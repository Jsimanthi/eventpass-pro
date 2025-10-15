CREATE TABLE reprint_requests (
  id SERIAL PRIMARY KEY,
  invitee_id INTEGER NOT NULL REFERENCES invitees(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
