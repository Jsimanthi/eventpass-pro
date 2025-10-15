package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"eventpass.pro/apps/backend/db"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/minio/minio-go/v7"
	qrcode "github.com/skip2/go-qrcode"
	"github.com/streadway/amqp"
)

func (h *handler) TestPublish(w http.ResponseWriter, r *http.Request) {
	err := h.amqpChannel.Publish(
		"",      // exchange
		"hello", // routing key
		false,   // mandatory
		false,   // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte("Hello World!"),
		})
	if err != nil {
		http.Error(w, "Failed to publish a message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Message published"))
}

func (h *handler) ScanQRCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	qr := vars["qr"]

	// Use SetNX to atomically set the key if it doesn't exist.
	// If the key already exists, it means we have already processed this QR code recently.
	set, err := h.rdb.SetNX(context.Background(), qr, "1", 5*time.Second).Result()
	if err != nil {
		http.Error(w, "Failed to set Redis key", http.StatusInternalServerError)
		return
	}

	if !set {
		http.Error(w, "Too many requests", http.StatusTooManyRequests)
		return
	}

	invitee, err := h.queries.GetInviteeBySignature(context.Background(), pgtype.Text{String: qr, Valid: true})
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	if invitee.GiftClaimedAt.Valid {
		http.Error(w, "Gift already claimed", http.StatusConflict)
		return
	}

	updatedInvitee, err := h.queries.UpdateInviteeStateAndClaimGift(context.Background(), db.UpdateInviteeStateAndClaimGiftParams{
		ID:    invitee.ID,
		State: "checked_in",
	})
	if err != nil {
		http.Error(w, "Failed to update invitee state", http.StatusInternalServerError)
		return
	}

	payload, err := json.Marshal(updatedInvitee)
	if err != nil {
		http.Error(w, "Failed to marshal invitee data", http.StatusInternalServerError)
		return
	}

	if err := h.rdb.Publish(context.Background(), "check-ins", payload).Err(); err != nil {
		http.Error(w, "Failed to publish check-in event", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedInvitee)
}

func (h *handler) ListEvents(w http.ResponseWriter, r *http.Request) {
	events, err := h.queries.ListEvents(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(events)
}

func (h *handler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var newEvent db.CreateEventParams
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := h.queries.CreateEvent(context.Background(), newEvent)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (h *handler) GetEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	event, err := h.queries.GetEvent(context.Background(), int32(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (h *handler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	var updatedEvent db.UpdateEventParams
	if err := json.NewDecoder(r.Body).Decode(&updatedEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updatedEvent.ID = int32(id)

	event, err := h.queries.UpdateEvent(context.Background(), updatedEvent)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (h *handler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	if err := h.queries.DeleteEvent(context.Background(), int32(id)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *handler) UploadInvitees(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		http.Error(w, "Failed to parse multipart form", http.StatusInternalServerError)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		http.Error(w, "Failed to read CSV data", http.StatusInternalServerError)
		return
	}

	hmacSecret := os.Getenv("HMAC_SECRET")
	baseURL := os.Getenv("BASE_URL")
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	for _, record := range records {
		email := record[0]
		invitee, err := h.queries.CreateInvitee(context.Background(), db.CreateInviteeParams{
			EventID: int32(eventID),
			Email:   email,
			ExpiresAt: pgtype.Timestamptz{
				Time:  time.Now().Add(24 * time.Hour),
				Valid: true,
			},
			Status: "pending",
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		mac := hmac.New(sha256.New, []byte(hmacSecret))
		mac.Write([]byte(strconv.Itoa(int(invitee.ID))))
		hmacSignature := hex.EncodeToString(mac.Sum(nil))

		validationURL := fmt.Sprintf("%s/validate?invitee_id=%d&signature=%s", baseURL, invitee.ID, hmacSignature)

		png, err := qrcode.Encode(validationURL, qrcode.Medium, 256)
		if err != nil {
			http.Error(w, "Failed to generate QR code", http.StatusInternalServerError)
			return
		}

		objectName := fmt.Sprintf("%d.png", invitee.ID)
		_, err = h.minioClient.PutObject(context.Background(), bucketName, objectName, bytes.NewReader(png), int64(len(png)), minio.PutObjectOptions{ContentType: "image/png"})
		if err != nil {
			http.Error(w, "Failed to upload QR code to MinIO", http.StatusInternalServerError)
			return
		}

		qrCodeURL := fmt.Sprintf("/qrcodes/%s", objectName)

		_, err = h.queries.UpdateInvitee(context.Background(), db.UpdateInviteeParams{
			ID:            invitee.ID,
			QrCodeUrl:     pgtype.Text{String: qrCodeURL, Valid: true},
			HmacSignature: pgtype.Text{String: hmacSignature, Valid: true},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusAccepted)
}

func (h *handler) ValidateInvitee(w http.ResponseWriter, r *http.Request) {
	inviteeIDStr := r.URL.Query().Get("invitee_id")
	signature := r.URL.Query().Get("signature")

	inviteeID, err := strconv.Atoi(inviteeIDStr)
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	invitee, err := h.queries.GetInvitee(context.Background(), int32(inviteeID))
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	hmacSecret := os.Getenv("HMAC_SECRET")

	mac := hmac.New(sha256.New, []byte(hmacSecret))
	mac.Write([]byte(strconv.Itoa(int(invitee.ID))))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		_, err := h.queries.UpdateInviteeState(context.Background(), db.UpdateInviteeStateParams{
			ID:    invitee.ID,
			State: "denied",
		})
		if err != nil {
			http.Error(w, "Failed to update invitee state", http.StatusInternalServerError)
			return
		}

		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	updatedInvitee, err := h.queries.UpdateInviteeState(context.Background(), db.UpdateInviteeStateParams{
		ID:    invitee.ID,
		State: "checked_in",
	})
	if err != nil {
		http.Error(w, "Failed to update invitee state", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedInvitee)
}

func (h *handler) ServeQRCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	objectName := vars["objectName"]

	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	object, err := h.minioClient.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		http.Error(w, "Failed to get QR code from MinIO", http.StatusNotFound)
		return
	}
	defer object.Close()

	stat, err := object.Stat()
	if err != nil {
		http.Error(w, "Failed to get QR code stats from MinIO", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", stat.ContentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size))

	if _, err := io.Copy(w, object); err != nil {
		http.Error(w, "Failed to serve QR code", http.StatusInternalServerError)
		return
	}
}

func (h *handler) ExportInvitees(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	invitees, err := h.queries.GetInviteesByEvent(context.Background(), int32(eventID))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invitees-%d.csv", eventID))

	csvWriter := csv.NewWriter(w)
	defer csvWriter.Flush()

	header := []string{"ID", "Email", "Status", "Created At", "Updated At", "Expires At", "Gift Claimed At"}
	if err := csvWriter.Write(header); err != nil {
		http.Error(w, "Failed to write CSV header", http.StatusInternalServerError)
		return
	}

	for _, invitee := range invitees {
		record := []string{
			strconv.Itoa(int(invitee.ID)),
			invitee.Email,
			invitee.Status,
			invitee.CreatedAt.Time.Format(time.RFC3339),
			invitee.UpdatedAt.Time.Format(time.RFC3339),
			invitee.ExpiresAt.Time.Format(time.RFC3339),
			invitee.GiftClaimedAt.Time.Format(time.RFC3339),
		}
		if err := csvWriter.Write(record); err != nil {
			http.Error(w, "Failed to write CSV record", http.StatusInternalServerError)
			return
		}
	}
}

func (h *handler) AnonymizeUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr := vars["id"]
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var userUUID pgtype.UUID
	userUUID.Bytes = userID
	userUUID.Valid = true

	if err := h.queries.AnonymizeUser(context.Background(), userUUID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *handler) AnonymizeInvitee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	inviteeID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	if err := h.queries.AnonymizeInvitee(context.Background(), int32(inviteeID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *handler) AnonymizeOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	if err := h.queries.AnonymizeOrder(context.Background(), int32(orderID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
