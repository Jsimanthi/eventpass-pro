package main

import (
	"context"
	"net/http"
	"strings"

	"eventpass.pro/apps/backend/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func authMiddleware(queries *db.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			parts := strings.Split(tokenString, ".")
			if len(parts) != 2 {
				http.Error(w, "Invalid token format", http.StatusUnauthorized)
				return
			}

			userIDStr := parts[0]
			signature := parts[1]

			if !verify([]byte(userIDStr), signature) {
				http.Error(w, "Invalid token signature", http.StatusUnauthorized)
				return
			}

			userID, err := uuid.Parse(userIDStr)
			if err != nil {
				http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
				return
			}

			user, err := queries.GetUserByID(context.Background(), pgtype.UUID{Bytes: userID, Valid: true})
			if err != nil {
				http.Error(w, "User not found", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), "user", user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
