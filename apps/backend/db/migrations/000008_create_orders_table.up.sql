CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL,
    event_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
