package main

import (
	"context"
	"crypto/tls"
	"log"
	"net/http"
	"os"
	"os/exec"

	"eventpass.pro/apps/backend/db"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/streadway/amqp"
)

type handler struct {
	queries     *db.Queries
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

	h := &handler{queries: queries, minioClient: minioClient, rdb: rdb, amqpChannel: amqpChannel}

	h.StartInviteeExpirationCron()
	h.StartOrderExpirationCron()
	createContinuousAggregates(pool)

	r.Use(loggingMiddleware)
	r.Use(rateLimitMiddleware)

	// Public routes
	r.HandleFunc("/test-publish", h.TestPublish).Methods("GET")
	r.HandleFunc("/validate", h.ValidateInvitee).Methods("GET")
	r.HandleFunc("/qrcodes/{objectName}", h.ServeQRCode).Methods("GET")
	r.HandleFunc("/users", h.CreateUser).Methods("POST")
	r.HandleFunc("/login", h.Login).Methods("POST")
	r.HandleFunc("scan/{qr}", h.ScanQRCode).Methods("POST")
	r.HandleFunc("/ws", h.HandleWebSocket).Methods("GET")
	r.Handle("/metrics", promhttp.Handler())

	// Authenticated routes
	authRouter := r.PathPrefix("/").Subrouter()
	authRouter.Use(authMiddleware(queries))
	authRouter.HandleFunc("/events", h.ListEvents).Methods("GET")
	authRouter.HandleFunc("/events", h.CreateEvent).Methods("POST")
	authRouter.HandleFunc("/events/{id}", h.GetEvent).Methods("GET")
	authRouter.HandleFunc("/events/{id}", h.UpdateEvent).Methods("PUT")
	authRouter.HandleFunc("/events/{id}", h.DeleteEvent).Methods("DELETE")
	authRouter.HandleFunc("/events/{id}/invitees", h.UploadInvitees).Methods("POST")
	authRouter.HandleFunc("/events/{id}/report", h.ExportInvitees).Methods("GET")
	authRouter.HandleFunc("/invitees/{invitee_id}/reprint", h.ReprintRequest).Methods("POST")
	authRouter.HandleFunc("/users/{id}/anonymize", h.AnonymizeUser).Methods("POST")
	authRouter.HandleFunc("/invitees/{id}/anonymize", h.AnonymizeInvitee).Methods("POST")
	authRouter.HandleFunc("/orders/{id}/anonymize", h.AnonymizeOrder).Methods("POST")

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
