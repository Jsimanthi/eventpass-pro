-- name: GetInviteesByEvent :many
SELECT * FROM invitees WHERE event_id = $1;
