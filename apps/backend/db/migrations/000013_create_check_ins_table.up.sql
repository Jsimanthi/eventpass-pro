CREATE TABLE check_ins (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    invitee_id INTEGER REFERENCES invitees(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable TimescaleDB extension for this table
SELECT create_hypertable('check_ins', 'checked_in_at', if_not_exists => TRUE);