package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"eventpass.pro/apps/backend/db"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgtype"
	qrcode "github.com/skip2/go-qrcode"
	"github.com/minio/minio-go/v7"
)

func (h *handler) ReprintRequest(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(db.User)
	if !ok {
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	inviteeID, err := strconv.Atoi(vars["invitee_id"])
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	// Create a reprint request record
	_, err = h.queries.CreateReprintRequest(context.Background(), db.CreateReprintRequestParams{
		InviteeID: int32(inviteeID),
		UserID:    user.ID,
	})
	if err != nil {
		http.Error(w, "Failed to create reprint request", http.StatusInternalServerError)
		return
	}

	// Regenerate the QR code
	hmacSecret := os.Getenv("HMAC_SECRET")
	baseURL := os.Getenv("BASE_URL")
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	mac := hmac.New(sha256.New, []byte(hmacSecret))
	mac.Write([]byte(strconv.Itoa(inviteeID)))
	hmacSignature := hex.EncodeToString(mac.Sum(nil))

	validationURL := fmt.Sprintf("%s/validate?invitee_id=%d&signature=%s", baseURL, inviteeID, hmacSignature)

	png, err := qrcode.Encode(validationURL, qrcode.Medium, 256)
	if err != nil {
		http.Error(w, "Failed to generate QR code", http.StatusInternalServerError)
		return
	}

	objectName := fmt.Sprintf("%d.png", inviteeID)
	_, err = h.minioClient.PutObject(context.Background(), bucketName, objectName, bytes.NewReader(png), int64(len(png)), minio.PutObjectOptions{ContentType: "image/png"})
	if err != nil {
		http.Error(w, "Failed to upload QR code to MinIO", http.StatusInternalServerError)
		return
	}

	qrCodeURL := fmt.Sprintf("/qrcodes/%s", objectName)

	updatedInvitee, err := h.queries.UpdateInvitee(context.Background(), db.UpdateInviteeParams{
		ID:            int32(inviteeID),
		QrCodeUrl:     pgtype.Text{String: qrCodeURL, Valid: true},
		HmacSignature: pgtype.Text{String: hmacSignature, Valid: true},
	})
	if err != nil {
		http.Error(w, "Failed to update invitee with new QR code", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedInvitee)
}
