package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	primaryDSN := os.Getenv("DATABASE_URL")
	replicaDSN := os.Getenv("REPLICA_DATABASE_URL")

	if primaryDSN == "" || replicaDSN == "" {
		log.Fatal("DATABASE_URL and REPLICA_DATABASE_URL environment variables are not set")
	}

	go sync(primaryDSN, replicaDSN)

	// The rest of the worker logic will go here
	// For now, we'll just keep the worker alive
	select {}
}

func sync(primaryDSN, replicaDSN string) {
	primaryDB, err := sql.Open("postgres", primaryDSN)
	if err != nil {
		log.Fatalf("Failed to connect to primary database: %s", err)
	}
	defer primaryDB.Close()

	replicaDB, err := sql.Open("postgres", replicaDSN)
	if err != nil {
		log.Fatalf("Failed to connect to replica database: %s", err)
	}
	defer replicaDB.Close()

	for {
		time.Sleep(10 * time.Second)

		rows, err := primaryDB.Query("SELECT id, event_id, email, created_at, updated_at, qr_code, state, gift_claimed_at, expires_at FROM invitees")
		if err != nil {
			log.Printf("Error querying primary database: %v", err)
			continue
		}

		for rows.Next() {
			var id, eventID int
			var email, qrCode, state string
			var createdAt, updatedAt, giftClaimedAt, expiresAt sql.NullTime

			if err := rows.Scan(&id, &eventID, &email, &createdAt, &updatedAt, &qrCode, &state, &giftClaimedAt, &expiresAt); err != nil {
				log.Printf("Error scanning row from primary database: %v", err)
				continue
			}

			var replicaUpdatedAt sql.NullTime
			replicaDB.QueryRow("SELECT updated_at FROM invitees WHERE id = $1", id).Scan(&replicaUpdatedAt)

			if replicaUpdatedAt.Valid && replicaUpdatedAt.Time.After(updatedAt.Time) {
				// Replica is newer, don't overwrite
				continue
			}

			// Primary is newer or replica doesn't exist, so upsert
			_, err := replicaDB.Exec(`
				INSERT INTO invitees (id, event_id, email, created_at, updated_at, qr_code, state, gift_claimed_at, expires_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (id) DO UPDATE SET
					event_id = $2, email = $3, created_at = $4, updated_at = $5, qr_code = $6, state = $7, gift_claimed_at = $8, expires_at = $9
			`, id, eventID, email, createdAt, updatedAt, qrCode, state, giftClaimedAt, expiresAt)
			if err != nil {
				log.Printf("Error upserting into replica database: %v", err)
			}
		}

		// Close the rows at the end of the iteration to prevent resource leaks.
		rows.Close()
	}
}
