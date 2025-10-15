-- name: CreateReprintRequest :one
INSERT INTO reprint_requests (
  invitee_id,
  user_id
) VALUES (
  $1, $2
) RETURNING *;
