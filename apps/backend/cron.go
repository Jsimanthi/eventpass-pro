package main

import (
	"context"
	"log"
	"time"

	"eventpass.pro/apps/backend/db"
)

func (h *handler) StartInviteeExpirationCron() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			h.expireOldInvitees()
		}
	}()
}

func (h *handler) expireOldInvitees() {
	log.Println("Checking for expired invitees...")
	invitees, err := h.queries.GetExpiredInvitees(context.Background())
	if err != nil {
		log.Printf("Failed to get expired invitees: %v", err)
		return
	}

	for _, invitee := range invitees {
		log.Printf("Expiring invitee with ID: %d", invitee.ID)
		_, err := h.queries.UpdateInviteeStatus(context.Background(), db.UpdateInviteeStatusParams{
			ID:     invitee.ID,
			Status: "expired",
		})
		if err != nil {
			log.Printf("Failed to expire invitee with ID %d: %v", invitee.ID, err)
		}
	}
}

func (h *handler) StartOrderExpirationCron() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			h.expireOldOrders()
		}
	}()
}

func (h *handler) expireOldOrders() {
	log.Println("Checking for expired orders...")
	orders, err := h.queries.GetExpiredOrders(context.Background())
	if err != nil {
		log.Printf("Failed to get expired orders: %v", err)
		return
	}

	for _, order := range orders {
		log.Printf("Expiring order with ID: %d", order.ID)
		_, err := h.queries.UpdateOrderStatus(context.Background(), db.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: "expired",
		})
		if err != nil {
			log.Printf("Failed to expire order with ID %d: %v", order.ID, err)
		}
	}
}
