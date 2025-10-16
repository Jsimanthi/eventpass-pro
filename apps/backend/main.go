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
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	queries := db.New(pool)

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
		log.Fatalln(err)
	}

	// Create the bucket if it doesn't exist
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	err = minioClient.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
	if err != nil {
		// Check to see if we already own this bucket (which happens if you run this twice)
		exists, errBucketExists := minioClient.BucketExists(context.Background(), bucketName)
		if errBucketExists == nil && exists {
			log.Printf("We already own %s\n", bucketName)
		} else {
			log.Fatalln(err)
		}
	} else {
		log.Printf("Successfully created %s\n", bucketName)
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

	amqpConn, err := amqp.Dial(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	defer amqpConn.Close()

	amqpChannel, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %s", err)
	}
	defer amqpChannel.Close()

	r := mux.NewRouter()

	api := &API{db: queries, minioClient: minioClient, rdb: rdb, amqpChannel: amqpChannel}

	api.StartInviteeExpirationCron()
	api.StartOrderExpirationCron()

	r.Use(loggingMiddleware)

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
	authRouter.Use(authMiddleware(queries))
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

	ensureTLS(port, r)
}

func ensureTLS(port string, router http.Handler) {
	certFile := "cert.pem"
	keyFile := "key.pem"

	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		// Create a simple self-signed certificate for local development.
		// This is not for production use.
		cmd := exec.Command("openssl", "req", "-x509", "-newkey", "rsa:4096", "-keyout", keyFile, "-out", certFile, "-days", "365", "-nodes", "-subj", "/CN=localhost")
		err = cmd.Run()
		if err != nil {
			log.Fatalf("Failed to generate self-signed certificate: %v", err)
		}
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}

	log.Printf("Starting server on https://localhost:%s", port)
	log.Fatal(server.ListenAndServeTLS(certFile, keyFile))
}

func (api *API) TestPublish(w http.ResponseWriter, r *http.Request) {
	err := api.amqpChannel.Publish(
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

func (api *API) ScanQRCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	qr := vars["qr"]

	// Use SetNX to atomically set the key if it doesn't exist.
	// If the key already exists, it means we have already processed this QR code recently.
	set, err := api.rdb.SetNX(context.Background(), qr, "1", 5*time.Second).Result()
	if err != nil {
		http.Error(w, "Failed to set Redis key", http.StatusInternalServerError)
		return
	}

	if !set {
		http.Error(w, "Too many requests", http.StatusTooManyRequests)
		return
	}

	invitee, err := api.db.GetInviteeBySignature(context.Background(), pgtype.Text{String: qr, Valid: true})
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	if invitee.GiftClaimedAt.Valid {
		http.Error(w, "Gift already claimed", http.StatusConflict)
		return
	}

	updatedInvitee, err := api.db.UpdateInviteeStateAndClaimGift(context.Background(), db.UpdateInviteeStateAndClaimGiftParams{
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

	if err := api.rdb.Publish(context.Background(), "check-ins", payload).Err(); err != nil {
		http.Error(w, "Failed to publish check-in event", http.StatusInternalServerError)
		return
	}

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
	var newEvent db.CreateEventParams
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := api.db.CreateEvent(context.Background(), newEvent)
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
	if err != nil {package main

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
	"strings"
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
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	queries := db.New(pool)

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
		log.Fatalln(err)
	}

	// Create the bucket if it doesn't exist
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	err = minioClient.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
	if err != nil {
		// Check to see if we already own this bucket (which happens if you run this twice)
		exists, errBucketExists := minioClient.BucketExists(context.Background(), bucketName)
		if errBucketExists == nil && exists {
			log.Printf("We already own %s\n", bucketName)
		} else {
			log.Fatalln(err)
		}
	} else {
		log.Printf("Successfully created %s\n", bucketName)
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

	amqpConn, err := amqp.Dial(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	defer amqpConn.Close()

	amqpChannel, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %s", err)
	}
	defer amqpChannel.Close()

	r := mux.NewRouter()

	api := &API{db: queries, minioClient: minioClient, rdb: rdb, amqpChannel: amqpChannel}

	api.StartInviteeExpirationCron()
	api.StartOrderExpirationCron()

	r.Use(loggingMiddleware)

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
	authRouter.Use(authMiddleware(queries))
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

	ensureTLS(port, r)
}

func ensureTLS(port string, router http.Handler) {
	certFile := "cert.pem"
	keyFile := "key.pem"

	if _, err := os.Stat(certFile); os.IsNotExist(err) {
		// Create a simple self-signed certificate for local development.
		// This is not for production use.
		cmd := exec.Command("openssl", "req", "-x509", "-newkey", "rsa:4096", "-keyout", keyFile, "-out", certFile, "-days", "365", "-nodes", "-subj", "/CN=localhost")
		err = cmd.Run()
		if err != nil {
			log.Fatalf("Failed to generate self-signed certificate: %v", err)
		}
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}

	log.Printf("Starting server on https://localhost:%s", port)
	log.Fatal(server.ListenAndServeTLS(certFile, keyFile))
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("request: %s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func authMiddleware(queries db.Querier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				http.Error(w, "Could not find bearer token in Authorization header", http.StatusUnauthorized)
				return
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(os.Getenv("JWT_SECRET")), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				userIDStr, ok := claims["user_id"].(string)
				if !ok {
					http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
					return
				}

				userID, err := uuid.Parse(userIDStr)
				if err != nil {
					http.Error(w, "Invalid user ID format in token", http.StatusUnauthorized)
					return
				}

				user, err := queries.GetUser(context.Background(), pgtype.UUID{Bytes: userID, Valid: true})
				if err != nil {
					http.Error(w, "User not found", http.StatusUnauthorized)
					return
				}

				ctx := context.WithValue(r.Context(), "user", user)
				next.ServeHTTP(w, r.WithContext(ctx))
			} else {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			}
		})
	}
}

func (api *API) TestPublish(w http.ResponseWriter, r *http.Request) {
	err := api.amqpChannel.Publish(
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

func (api *API) ScanQRCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	qr := vars["qr"]

	// Use SetNX to atomically set the key if it doesn't exist.
	// If the key already exists, it means we have already processed this QR code recently.
	set, err := api.rdb.SetNX(context.Background(), qr, "1", 5*time.Second).Result()
	if err != nil {
		http.Error(w, "Failed to set Redis key", http.StatusInternalServerError)
		return
	}

	if !set {
		http.Error(w, "Too many requests", http.StatusTooManyRequests)
		return
	}

	invitee, err := api.db.GetInviteeBySignature(context.Background(), pgtype.Text{String: qr, Valid: true})
	if err != nil {
		http.Error(w, "Invitee not found", http.StatusNotFound)
		return
	}

	if invitee.GiftClaimedAt.Valid {
		http.Error(w, "Gift already claimed", http.StatusConflict)
		return
	}

	updatedInvitee, err := api.db.UpdateInviteeStateAndClaimGift(context.Background(), db.UpdateInviteeStateAndClaimGiftParams{
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

	if err := api.rdb.Publish(context.Background(), "check-ins", payload).Err(); err != nil {
		http.Error(w, "Failed to publish check-in event", http.StatusInternalServerError)
		return
	}

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
	var newEvent db.CreateEventParams
	if err := json.NewDecoder(r.Body).Decode(&newEvent); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	event, err := api.db.CreateEvent(context.Background(), newEvent)
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
	if err !=.
	{
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
	vars := mux.Vars(r)
	userIDStr := vars["id"]
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeUser(context.Background(), pgtype.UUID{Bytes: userID, Valid: true}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) AnonymizeInvitee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	inviteeID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeInvitee(context.Background(), int32(inviteeID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) AnonymizeOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeOrder(context.Background(), int32(orderID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := api.db.GetUserByEmail(context.Background(), loginRequest.Email)
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
		userID = user.ID
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
	"strings"
	"time"

	"eventpass.pro/apps/backend/db"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/
.
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
	vars := mux.Vars(r)
	userIDStr := vars["id"]
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeUser(context.Background(), pgtype.UUID{Bytes: userID, Valid: true}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.SReadtatusNoContent)
}

func (api *API) AnonymizeInvitee(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	inviteeID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid invitee ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeInvitee(context.Background(), int32(inviteeID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) AnonymizeOrder(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid order ID", http.StatusBadRequest)
		return
	}

	if err := api.db.AnonymizeOrder(context.Background(), int32(orderID)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) Login(w http.ResponseWriter, r *http.Request) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginRequest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := api.db.GetUserByEmail(context.Background(), loginRequest.Email)
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

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

func (api *API) createLogin(userID uuid.UUID) (string, error) {
	// Create a new token object, specifying signing method and the claims
	// you would like it to contain.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	return tokenString, err
}

func (api *API) CreateUser(w http.ResponseWriter, r *http.Request) {
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

	user, err := api.db.CreateUser(context.Background(), db.CreateUserParams{
		ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Email:        newUser.Email,
		PasswordHash: string(hashedPassword),
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

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
	log.Println("Checking for expired invitees...")
	invitees, err := api.db.GetExpiredInvitees(context.Background())
	if err != nil {
		log.Printf("Failed to get expired invitees: %v", err)
		return
	}

	for _, invitee := range invitees {
		log.Printf("Expiring invitee with ID: %d", invitee.ID)
		_, err := api.db.UpdateInviteeStatus(context.Background(), db.UpdateInviteeStatusParams{
			ID:     invitee.ID,
			Status: "expired",
		})
		if err != nil {
			log.Printf("Failed to expire invitee with ID %d: %v", invitee.ID, err)
		}
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
	log.Println("Checking for expired orders...")
	orders, err := api.db.GetExpiredOrders(context.Background())
	if err != nil {
		log.Printf("Failed to get expired orders: %v", err)
		return
	}

	for _, order := range orders {
		log.Printf("Expiring order with ID: %d", order.ID)
		_, err := api.db.UpdateOrderStatus(context.Background(), db.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: "expired",
		})
		if err != nil {
			log.Printf("Failed to expire order with ID %d: %v", order.ID, err)
		}
	}
}

func (api *API) ReprintRequest(w http.ResponseWriter, r *http.Request) {
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
	_, err = api.db.CreateReprintRequest(context.Background(), db.CreateReprintRequestParams{
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
		log.Println(err)
		return
	}
	defer conn.Close()

	pubsub := api.rdb.Subscribe(context.Background(), "check-ins")
	defer pubsub.Close()

	for {
		msg, err := pubsub.ReceiveMessage(context.Background())
		if err != nil {
			log.Println(err)
			return
		}

		if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
			log.Println(err)
			return
		}
	}
}
