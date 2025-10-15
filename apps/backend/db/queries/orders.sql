-- name: GetExpiredOrders :many
SELECT *
FROM orders
WHERE expires_at < now() AND status = 'pending';

-- name: UpdateOrderStatus :one
UPDATE orders
SET
  status = $2
WHERE id = $1
RETURNING *;

-- name: CreateOrder :one
INSERT INTO orders (user_id, event_id, status, expires_at, deleted_at, anonymized_at) VALUES ($1, $2, $3, $4, NULL, NULL) RETURNING *;

-- name: AnonymizeOrder :exec
UPDATE orders SET user_id = NULL, deleted_at = NOW(), anonymized_at = NOW() WHERE id = $1;
