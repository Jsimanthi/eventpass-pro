CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, 
    anonymized_at TIMESTAMPTZ
);

CREATE TABLE invitees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qr_code TEXT,
    hmac_signature TEXT,
    state VARCHAR(255) NOT NULL DEFAULT 'invited',
    gift_claimed_at TIMESTAMP,
    expires_at TIMESTAMPTZ,
    status VARCHAR(255) NOT NULL DEFAULT 'created',
    deleted_at TIMESTAMPTZ, 
    anonymized_at TIMESTAMPTZ,
    UNIQUE(event_id, email)
);

CREATE TABLE reprint_requests (
  id SERIAL PRIMARY KEY,
  invitee_id INTEGER NOT NULL REFERENCES invitees(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id uuid NOT NULL,
    event_id INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ, 
    anonymized_at TIMESTAMPTZ
);

-- This table is for analytics.
CREATE TABLE check_ins (
    id SERIAL,
    invitee_id INTEGER NOT NULL REFERENCES invitees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (created_at, id) -- Composite primary key including the time column
);

-- This converts the check_ins table into a hypertable, which is required for continuous aggregates.
SELECT create_hypertable('check_ins', 'created_at');
