package main

import (
	"fmt"
	"log"
	"os"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

func sendWelcomeEmail(toEmail, toName string) {
	from := mail.NewEmail("EventPass", os.Getenv("SENDGRID_FROM_EMAIL"))
	target := mail.NewEmail(toName, toEmail)

	plainTextContent := fmt.Sprintf("Hi %s,\n\nWelcome to EventPass! We're excited to have you on board.\n\nThanks,\nThe EventPass Team", toName)
	htmlContent := fmt.Sprintf("<p>Hi %s,</p><p>Welcome to EventPass! We're excited to have you on board.</p><p>Thanks,<br>The EventPass Team</p>", toName)

	message := mail.NewSingleEmail(from, "Welcome to EventPass!", target, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	response, err := client.Send(message)
	if err != nil {
		log.Println(err)
	} else {
		log.Println(response.StatusCode)
		log.Println(response.Body)
		log.Println(response.Headers)
	}
}

// func sendWhatsAppMessage(to, body string) {
// 	// TODO: Implement WhatsApp/Twilio integration
// 	log.Printf("Sending WhatsApp message to %s: %s", to, body)
// }
