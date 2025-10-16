DB_URL=postgres://eventpass_user:your_secure_password_here@postgres:5432/eventpass_pro?sslmode=disable

migrate-up:
	migrate -path db/migrations -database "$(DB_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DB_URL)" down

migrate-create:
	migrate create -ext sql -dir db/migrations -seq $(name)

.PHONY: migrate-up migrate-down migrate-create
