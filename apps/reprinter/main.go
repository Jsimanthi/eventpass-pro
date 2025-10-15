package main

import (
	"context"
	"log"
	"os"
	"strconv"

	"eventpass.pro/apps/backend/db"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/streadway/amqp"
)

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

	q, err := amqpChannel.QueueDeclare(
		"reprints", // name
		true,       // durable
		false,      // delete when unused
		false,      // exclusive
		false,      // no-wait
		nil,        // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %s", err)
	}

	msgs, err := amqpChannel.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %s", err)
	}

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.Body)

			inviteeID, err := strconv.Atoi(string(d.Body))
			if err != nil {
				log.Printf("Error parsing invitee ID: %s", err)
				continue
			}

			invitee, err := queries.GetInvitee(context.Background(), int32(inviteeID))
			if err != nil {
				log.Printf("Error getting invitee: %s", err)
				continue
			}

			log.Printf("Reprinting QR code for invitee: %s", invitee.Email)
			// In a real application, you would regenerate the QR code and send it here.
			log.Printf("QR code for %s sent!", invitee.Email)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever
}
