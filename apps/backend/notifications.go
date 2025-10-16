package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"github.com/streadway/amqp"
	"eventpass.pro/apps/backend/db"
)

// NotificationService handles email and SMS/WhatsApp notifications
type NotificationService struct {
	sendgridClient *sendgrid.Client
	emailFrom      string
}

// NewNotificationService creates a new notification service
func NewNotificationService() *NotificationService {
	sendgridKey := os.Getenv("SENDGRID_API_KEY")

	service := &NotificationService{
		emailFrom: os.Getenv("SMTP_FROM"),
	}

	if sendgridKey != "" {
		service.sendgridClient = sendgrid.NewSendClient(sendgridKey)
		slog.Info("SendGrid email notifications enabled")
	} else {
		slog.Info("SendGrid not configured, email notifications disabled")
	}

	return service
}

// SendEmail sends an email using SendGrid
func (ns *NotificationService) SendEmail(toEmail, subject, htmlContent, plainContent string) error {
	if ns.sendgridClient == nil {
		slog.Warn("SendGrid not configured, skipping email notification", "to", toEmail)
		return nil
	}

	from := mail.NewEmail("EventPass Pro", ns.emailFrom)
	to := mail.NewEmail("", toEmail)
	message := mail.NewSingleEmail(from, subject, to, plainContent, htmlContent)

	response, err := ns.sendgridClient.Send(message)
	if err != nil {
		LogError(context.Background(), "Failed to send email", err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	LogInfo(context.Background(), "Email sent successfully",
		slog.String("to", toEmail),
		slog.String("subject", subject),
		slog.Int("status", response.StatusCode))

	return nil
}

// NotificationWorker processes notification messages from RabbitMQ
func (api *API) StartNotificationWorker() {
	if api.amqpChannel == nil {
		slog.Error("AMQP channel not available for notification worker")
		return
	}

	// Declare queue for notifications
	queue, err := api.amqpChannel.QueueDeclare(
		"notifications", // name
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		nil,            // arguments
	)
	if err != nil {
		LogError(context.Background(), "Failed to declare notifications queue", err)
		return
	}

	// Bind to exchange
	err = api.amqpChannel.QueueBind(
		queue.Name,     // queue name
		"notification", // routing key
		"eventpass",    // exchange
		false,
		nil,
	)
	if err != nil {
		LogError(context.Background(), "Failed to bind notifications queue", err)
		return
	}

	// Start consuming messages
	msgs, err := api.amqpChannel.Consume(
		queue.Name, // queue
		"",         // consumer
		false,      // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // args
	)
	if err != nil {
		LogError(context.Background(), "Failed to register notification consumer", err)
		return
	}

	ns := NewNotificationService()

	go func() {
		for msg := range msgs {
			ctx := context.Background()

			var notification struct {
				Type    string `json:"type"`    // "email", "sms", "whatsapp"
				To      string `json:"to"`
				Subject string `json:"subject,omitempty"`
				Message string `json:"message"`
			}

			if err := json.Unmarshal(msg.Body, &notification); err != nil {
				LogError(ctx, "Failed to unmarshal notification message", err)
				msg.Nack(false, false) // Don't requeue
				continue
			}

			var sendErr error
			switch notification.Type {
			case "email":
				sendErr = ns.SendEmail(notification.To, notification.Subject, notification.Message, notification.Message)
			default:
				sendErr = fmt.Errorf("unknown notification type: %s", notification.Type)
			}

			if sendErr != nil {
				LogError(ctx, "Failed to send notification", sendErr,
					slog.String("type", notification.Type),
					slog.String("to", notification.To))
				msg.Nack(false, true) // Requeue for retry
			} else {
				msg.Ack(false)
				LogInfo(ctx, "Notification sent successfully",
					slog.String("type", notification.Type),
					slog.String("to", notification.To))
			}
		}
	}()

	LogInfo(context.Background(), "Notification worker started successfully")
}

// SendEventNotification sends notifications for event-related activities
func (api *API) SendEventNotification(ctx context.Context, eventID int32, notificationType, recipient, subject, message string) {
	if api.amqpChannel == nil {
		slog.Warn("AMQP channel not available, skipping notification")
		return
	}

	notification := struct {
		Type    string `json:"type"`
		To      string `json:"to"`
		Subject string `json:"subject,omitempty"`
		Message string `json:"message"`
	}{
		Type:    notificationType,
		To:      recipient,
		Subject: subject,
		Message: message,
	}

	body, err := json.Marshal(notification)
	if err != nil {
		LogError(ctx, "Failed to marshal notification", err)
		return
	}

	err = api.amqpChannel.Publish(
		"eventpass",     // exchange
		"notification", // routing key
		false,          // mandatory
		false,          // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)
	if err != nil {
		LogError(ctx, "Failed to publish notification", err)
		return
	}

	LogInfo(ctx, "Event notification queued",
		slog.Int("event_id", int(eventID)),
		slog.String("type", notificationType),
		slog.String("recipient", recipient))
}

// SendCheckInNotification sends a notification when someone checks in
func (api *API) SendCheckInNotification(ctx context.Context, invitee db.Invitee) {
	event, err := api.db.GetEvent(ctx, invitee.EventID)
	if err != nil {
		LogError(ctx, "Failed to get event for check-in notification", err)
		return
	}

	// Send email notification
	subject := fmt.Sprintf("Check-in Confirmed - %s", event.Name)
	emailMessage := fmt.Sprintf(`
Hello!

You have successfully checked in to the event: %s

Event Details:
- Event: %s
- Check-in Time: %s
- Status: Confirmed

Thank you for attending!

Best regards,
EventPass Pro Team
`, event.Name, event.Name, time.Now().Format("2006-01-02 15:04:05"))

	api.SendEventNotification(ctx, invitee.EventID, "email", invitee.Email, subject, emailMessage)

	// SMS/WhatsApp notifications can be added here when Twilio is properly configured
}

// SendEventReminder sends event reminder notifications
func (api *API) SendEventReminder(ctx context.Context, eventID int32, hoursBefore int) error {
	event, err := api.db.GetEvent(ctx, eventID)
	if err != nil {
		return fmt.Errorf("failed to get event: %w", err)
	}

	invitees, err := api.db.GetInviteesByEvent(ctx, eventID)
	if err != nil {
		return fmt.Errorf("failed to get invitees: %w", err)
	}

	subject := fmt.Sprintf("Reminder: %s starts in %d hours", event.Name, hoursBefore)
	message := fmt.Sprintf(`
Reminder: %s

Event: %s
Start Time: %s
Location: %s

This is a reminder that the event starts in %d hours.

Please make sure to arrive on time and bring your QR code for check-in.

Best regards,
EventPass Pro Team
`, event.Name, event.Name, event.Date.Time.Format("2006-01-02 15:04"), event.Location, hoursBefore)

	for _, invitee := range invitees {
		if invitee.Status == "pending" {
			api.SendEventNotification(ctx, eventID, "email", invitee.Email, subject, message)
		}
	}

	LogInfo(ctx, "Event reminders sent",
		slog.Int("event_id", int(eventID)),
		slog.Int("hours_before", hoursBefore),
		slog.Int("recipients", len(invitees)))

	return nil
}

// SendGiftClaimNotification sends a notification when a gift is claimed
func (api *API) SendGiftClaimNotification(ctx context.Context, invitee db.Invitee) {
	event, err := api.db.GetEvent(ctx, invitee.EventID)
	if err != nil {
		LogError(ctx, "Failed to get event for gift claim notification", err)
		return
	}

	subject := fmt.Sprintf("Gift Claimed - %s", event.Name)
	message := fmt.Sprintf(`
Gift Claim Notification

Event: %s
Guest Email: %s
Claim Time: %s

A gift has been successfully claimed for this guest.

Best regards,
EventPass Pro Team
`, event.Name, invitee.Email, time.Now().Format("2006-01-02 15:04:05"))

	// Send to event organizer (could be configured per event)
	organizerEmail := os.Getenv("ORGANIZER_EMAIL")
	if organizerEmail != "" {
		api.SendEventNotification(ctx, invitee.EventID, "email", organizerEmail, subject, message)
	}
}
