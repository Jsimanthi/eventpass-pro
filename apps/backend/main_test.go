package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"eventpass.pro/apps/backend/db"
	"github.com/gorilla/mux"
)

func TestListInvitees(t *testing.T) {
	api := &API{
		db: &db.MockQuerier{
			GetInviteesByEventFunc: func(ctx context.Context, eventID int32) ([]db.Invitee, error) {
				return []db.Invitee{}, nil
			},
		},
	}

	rr := httptest.NewRecorder()
	req, err := http.NewRequest("GET", "/events/1/invitees", nil)
	if err != nil {
		t.Fatal(err)
	}

	vars := map[string]string{
		"id": "1",
	}
	req = mux.SetURLVars(req, vars)

	router := mux.NewRouter()
	router.HandleFunc("/events/{id}/invitees", api.ListInvitees)
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	// TODO: Add more assertions, like checking the response body
}
