-- name: CreateUser :one
INSERT INTO users (id, email, password_hash, deleted_at, anonymized_at) VALUES ($1, $2, $3, NULL, NULL) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL;

-- name: AnonymizeUser :exec
UPDATE users SET email = 'anonymized', password_hash = 'anonymized', deleted_at = NOW(), anonymized_at = NOW() WHERE id = $1;
