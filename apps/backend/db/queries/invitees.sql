-- name: GetInvitee :one
SELECT *
FROM invitees
WHERE id = $1
LIMIT 1;

-- name: CreateInvitee :one
INSERT INTO invitees (
  event_id,
  email,
  expires_at,
  status,
  deleted_at,
  anonymized_at
) VALUES (
  $1, $2, $3, $4, NULL, NULL
)
RETURNING *;

-- name: UpdateInvitee :one
UPDATE invitees
SET
  qr_code_url = $2,
  hmac_signature = $3
WHERE id = $1
RETURNING *;

-- name: UpdateInviteeStateAndClaimGift :one
UPDATE invitees
SET
  state = $2,
  gift_claimed_at = now()
WHERE id = $1
RETURNING *;

-- name: GetInviteeBySignature :one
SELECT *
FROM invitees
WHERE hmac_signature = $1
LIMIT 1;

-- name: UpdateInviteeState :one
UPDATE invitees
SET
  state = $2
WHERE id = $1
RETURNING *;

-- name: GetExpiredInvitees :many
SELECT *
FROM invitees
WHERE expires_at < now() AND status = 'pending';

-- name: UpdateInviteeStatus :one
UPDATE invitees
SET
  status = $2
WHERE id = $1
RETURNING *;

-- name: AnonymizeInvitee :exec
UPDATE invitees SET email = 'anonymized', qr_code_url = NULL, hmac_signature = NULL, deleted_at = NOW(), anonymized_at = NOW() WHERE id = $1;
