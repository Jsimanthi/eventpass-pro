package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/tls"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"eventpass.pro/apps/backend/db"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	qrcode "github.com/skip2/go-qrcode"
	"github.com/streadway/amqp"
	"golang.org/x/crypto/bcrypt"
)

type API struct {
	db          db.Querier
	minioClient *minio.Client
	rdb         *redis.Client
	amqpChannel *amqp.Channel
}

func main() {
	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	pool, err := pgxpool.New(context.Background(), databaseUrl)
	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	log.Printf("Database connection established successfully")

	// Run database migrations
	if err := applyMigrations(pool); err != nil {
		log.Fatal("Failed to run migrations: ", err)
	}
	log.Printf("Database migrations completed successfully")

	queries := db.New(pool)

	// Create admin user if not exists
	adminEmail := "admin@example.com"
	adminPassword := "password123"
	_, err = queries.GetUserByEmail(context.Background(), adminEmail)
	if err != nil {
		// User doesn't exist, create it
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash password: ", err)
		}
		_, err = queries.CreateUser(context.Background(), db.CreateUserParams{
			ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Email:        adminEmail,
			PasswordHash: string(hashedPassword),
		})
		if err != nil {
			log.Fatal("Failed to create admin user: ", err)
		}
		log.Printf("Admin user created successfully")
	}

	// Skip TimescaleDB initialization for now
	log.Printf("Skipping TimescaleDB initialization for development")

	// MinIO client initialization
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("MINIO_SECRET_ACCESS_KEY")
	useSSL := false

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Printf("Failed to create MinIO client: %v", err)
		log.Fatalln(err)
	}

	log.Printf("MinIO client created successfully")

	// Create the bucket if it doesn't exist
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	err = minioClient.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
	if err != nil {
		// Check to see if we already own this bucket (which happens if you run this twice)
		exists, errBucketExists := minioClient.BucketExists(context.Background(), bucketName)
		if errBucketExists == nil && exists {
			log.Printf("MinIO bucket already exists: %s", bucketName)
		} else {
			log.Printf("MinIO bucket creation failed, but continuing: %v", err)
		}
	} else {
		log.Printf("MinIO bucket created successfully: %s", bucketName)
	}

	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		log.Fatal("REDIS_URL environment variable is not set")
	}
	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		log.Fatalf("Unable to parse Redis URL: %v", err)
	}

	rdb := redis.NewClient(opt)
	log.Printf("Redis client created successfully")

	var amqpChannel *amqp.Channel
	// Skip RabbitMQ for now
	log.Printf("Skipping RabbitMQ connection for development")
	amqpChannel = nil

	r := mux.NewRouter()

	api := &API{db: queries, minioClient: minioClient, rdb: rdb, amqpChannel: amqpChannel}

	api.StartInviteeExpirationCron()
	api.StartOrderExpirationCron()

	// Log system startup
	log.Printf("EventPass Pro backend started successfully")

	// Add middleware
	r.Use(metricsMiddleware)

	// Default route handler
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"EventPass Pro Backend API","version":"1.0.0","message":"Backend is running successfully"}`))
	}).Methods("GET")

	// Public routes
	r.HandleFunc("/test-publish", api.TestPublish).Methods("GET")
	r.HandleFunc("/validate", api.ValidateInvitee).Methods("GET")
	r.HandleFunc("/qrcodes/{objectName}", api.ServeQRCode).Methods("GET")
	r.HandleFunc("/users", api.CreateUser).Methods("POST")
	r.HandleFunc("/login", api.Login).Methods("POST")
	r.HandleFunc("/scan/{qr}", api.ScanQRCode).Methods("POST")
	r.HandleFunc("/ws", api.HandleWebSocket).Methods("GET")
	r.Handle("/metrics", promhttp.Handler())

	// Authenticated routes
	authRouter := r.PathPrefix("/").Subrouter()
	// authRouter.Use(authMiddleware(queries)) // Temporarily disabled for testing
	authRouter.HandleFunc("/events", api.ListEvents).Methods("GET")
	authRouter.HandleFunc("/events", api.CreateEvent).Methods("POST")
	authRouter.HandleFunc("/events/{id}", api.GetEvent).Methods("GET")
	authRouter.HandleFunc("/events/{id}", api.UpdateEvent).Methods("PUT")
	authRouter.HandleFunc("/events/{id}", api.DeleteEvent).Methods("DELETE")
	authRouter.HandleFunc("/events/{id}/invitees", api.ListInvitees).Methods("GET")
	authRouter.HandleFunc("/events/{id}/invitees", api.UploadInvitees).Methods("POST")
	authRouter.HandleFunc("/events/{id}/report", api.ExportInvitees).Methods("GET")
	authRouter.HandleFunc("/invitees/{invitee_id}/reprint", api.ReprintRequest).Methods("POST")
	authRouter.HandleFunc("/users/{id}/anonymize", api.AnonymizeUser).Methods("POST")
	authRouter.HandleFunc("/invitees/{id}/anonymize", api.AnonymizeInvitee).Methods("POST")
	authRouter.HandleFunc("/orders/{id}/anonymize", api.AnonymizeOrder).Methods("POST")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Serve HTTP instead of HTTPS for development
	log.Printf("Starting EventPass Pro server on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func ensureTLS(port string, router http.Handler) {
	certFile := "cert.pem"
	keyFile := "key.pem"

	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		// Create a simple self-signed certificate for local development.
		// This is not for production use.
		log.Printf("Generating self-signed TLS certificate for development")
		cmd := exec.Command("openssl", "req", "-x509", "-newkey", "rsa:4096", "-keyout", keyFile, "-out", certFile, "-days", "365", "-nodes", "-subj", "/CN=localhost")
		err = cmd.Run()
		if err != nil {
			log.Fatalf("Failed to generate self-signed certificate: %v", err)
		}
		log.Printf("TLS certificate generated successfully")
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}

	log.Printf("Starting EventPass Pro server on https://localhost:%s", port)

	log.Printf("Starting server on https://localhost:%s", port)
	log.Fatal(server.ListenAndServeTLS(certFile, keyFile))
}


// Metrics middleware to record HTTP request metrics
func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(ww, r)

		// Skip metrics recording for now
		_ = time.Since(start)
	})
}

// Response writer wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (api *API) TestPublish(w http.ResponseWriter, r *http.Request) {
	if api.amqpChannel == nil {
		http.Error(w, "RabbitMQ not available", http.StatusServiceUnavailable)
		return
	}

	// Skip RabbitMQ publishing for now
	http.Error(w, "RabbitMQ not available", http.StatusServiceUnavailable)
	return
}

func (api *API) ScanQRCode(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	qr := vars["qr"]

	// Skip Redis operations for now
	set := true

	if !set {
		http.Error(w, "Too many requests", http.StatusTooManyRequests)
		return
	}

	invitee, err := api.db.GetInviteeBySignature(ctx, pgtype.Text{String: qr, Valid: true})
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	if invitee.GiftClaimedAt.Valid {
		http.Error(w, "Gift already claimed", http.StatusConflict)
		return
	}

	updatedInvitee, err := api.db.UpdateInviteeStateAndClaimGift(ctx, db.UpdateInviteeStateAndClaimGiftParams{
		ID:    invitee.ID,
		State: "checked_in",
	})
	if err != nil {
		http.Error(w, "Failed to update invitee state", http.StatusInternalServerError)
		return
	}

	// Send gift claim notification if gift was claimed
	if updatedInvitee.GiftClaimedAt.Valid {
		// api.SendGiftClaimNotification(ctx, updatedInvitee)
	}

	// Send check-in notification
	// api.SendCheckInNotification(ctx, updatedInvitee)

	json.NewEncoder(w).Encode(updatedInvitee)
}

func (api *API) ListEvents(w http.ResponseWriter, r *http.Request) {
	events, err := api.db.ListEvents(context.Background())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(events)
}

func (api *API) ListInvitees(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	invitees, err := api.db.GetInviteesByEvent(context.Background(), int32(eventID))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(invitees)
}

func (api *API) CreateEvent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var newEvent db.CreateEventParams
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := api.db.CreateEvent(ctx, newEvent)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (api *API) GetEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	event, err := api.db.GetEvent(context.Background(), int32(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (api *API) UpdateEvent(w http.ResponseWriter, r *http.Request) {
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

	event, err := api.db.UpdateEvent(context.Background(), updatedEvent)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(event)
}

func (api *API) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	if err := api.db.DeleteEvent(context.Background(), int32(id)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) UploadInvitees(w http.ResponseWriter, r *http.Request) {
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

	processedCount := 0
	for _, record := range records {
		email := record[0]
		invitee, err := api.db.CreateInvitee(context.Background(), db.CreateInviteeParams{
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
		_, err = api.minioClient.PutObject(context.Background(), bucketName, objectName, bytes.NewReader(png), int64(len(png)), minio.PutObjectOptions{ContentType: "image/png"})
		if err != nil {
			http.Error(w, "Failed to upload QR code to MinIO", http.StatusInternalServerError)
			return
		}

		qrCodeURL := fmt.Sprintf("/qrcodes/%s", objectName)

		_, err = api.db.UpdateInvitee(context.Background(), db.UpdateInviteeParams{
			ID:            invitee.ID,
			QrCodeUrl:     pgtype.Text{String: qrCodeURL, Valid: true},
			HmacSignature: pgtype.Text{String: hmacSignature, Valid: true},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		processedCount++
	}

	w.WriteHeader(http.StatusAccepted)
}

func (api *API) ValidateInvitee(w http.ResponseWriter, r *http.Request) {
	inviteeIDStr := r.URL.Query().Get("invitee_id")
	signature := r.URL.Query().Get("signature")

	inviteeID, err := strconv.Atoi(inviteeIDStr)
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	invitee, err := api.db.GetInvitee(context.Background(), int32(inviteeID))
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	hmacSecret := os.Getenv("HMAC_SECRET")

	mac := hmac.New(sha256.New, []byte(hmacSecret))
	mac.Write([]byte(strconv.Itoa(int(invitee.ID))))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		_, err := api.db.UpdateInviteeState(context.Background(), db.UpdateInviteeStateParams{
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

	updatedInvitee, err := api.db.UpdateInviteeState(context.Background(), db.UpdateInviteeStateParams{
		ID:    invitee.ID,
		State: "checked_in",
	})
	if err != nil {
		http.Error(w, "Failed to update invitee state", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedInvitee)
}

func (api *API) ServeQRCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	objectName := vars["objectName"]

	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	object, err := api.minioClient.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
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

func (api *API) ExportInvitees(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	eventID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	invitees, err := api.db.GetInviteesByEvent(context.Background(), int32(eventID))
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
		var giftClaimedAt string
		if invitee.GiftClaimedAt.Valid {
			giftClaimedAt = invitee.GiftClaimedAt.Time.Format(time.RFC3339)
		}
		record := []string{
			strconv.Itoa(int(invitee.ID)),
			invitee.Email,
			invitee.Status,
			invitee.CreatedAt.Time.Format(time.RFC3339),
			invitee.UpdatedAt.Time.Format(time.RFC3339),
			invitee.ExpiresAt.Time.Format(time.RFC3339),
			giftClaimedAt,
		}
		if err := csvWriter.Write(record); err != nil {
			http.Error(w, "Failed to write CSV record", http.StatusInternalServerError)
			return
		}
	}
}

func (api *API) AnonymizeUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	userIDStr := vars["id"]
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeUser(ctx, pgtype.UUID{Bytes: userID, Valid: true}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) AnonymizeInvitee(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	inviteeID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeInvitee(ctx, int32(inviteeID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) AnonymizeOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	orderID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeOrder(ctx, int32(orderID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := api.db.GetUserByEmail(ctx, loginRequest.Email)
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(loginRequest.Password)); err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	var userID uuid.UUID
	if user.ID.Valid {
		userID = user.ID.Bytes
	}

	token, err := api.createLogin(userID)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

func (api *API) createLogin(userID uuid.UUID) (string, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	return tokenString, err
}

func (api *API) CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var newUser struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	user, err := api.db.CreateUser(ctx, db.CreateUserParams{
		ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Email:        newUser.Email,
		PasswordHash: string(hashedPassword),
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (api *API) StartInviteeExpirationCron() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			api.expireOldInvitees()
		}
	}()
}

func (api *API) expireOldInvitees() {
	ctx := context.Background()

	invitees, err := api.db.GetExpiredInvitees(ctx)
	if err != nil {
		return
	}

	for _, invitee := range invitees {
		api.db.UpdateInviteeStatus(ctx, db.UpdateInviteeStatusParams{
			ID:     invitee.ID,
			Status: "expired",
		})
	}
}

func (api *API) StartOrderExpirationCron() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			api.expireOldOrders()
		}
	}()
}

func (api *API) expireOldOrders() {
	ctx := context.Background()

	orders, err := api.db.GetExpiredOrders(ctx)
	if err != nil {
		return
	}

	for _, order := range orders {
		api.db.UpdateOrderStatus(ctx, db.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: "expired",
		})
	}
}

func (api *API) ReprintRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	user, ok := ctx.Value("user").(db.User)
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
	_, err = api.db.CreateReprintRequest(ctx, db.CreateReprintRequestParams{
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
	_, err = api.minioClient.PutObject(context.Background(), bucketName, objectName, bytes.NewReader(png), int64(len(png)), minio.PutObjectOptions{ContentType: "image/png"})
	if err != nil {
		http.Error(w, "Failed to upload QR code to MinIO", http.StatusInternalServerError)
		return
	}

	qrCodeURL := fmt.Sprintf("/qrcodes/%s", objectName)

	updatedInvitee, err := api.db.UpdateInvitee(context.Background(), db.UpdateInviteeParams{
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

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (api *API) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// WebSocket connection established but not fully implemented
	conn.Close()
}