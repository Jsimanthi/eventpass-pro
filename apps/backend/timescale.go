package main

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// createContinuousAggregates sets up TimescaleDB continuous aggregates for analytics
// This function can be called during system initialization to set up materialized views
// for efficient querying of time-series check-in data
//
// Usage: createContinuousAggregates(pool)
// createContinuousAggregates sets up TimescaleDB continuous aggregates for analytics
// This function can be called during system initialization to set up materialized views
// for efficient querying of time-series check-in data
//
// To use this function, call it after database connection is established:
//   createContinuousAggregates(pool)
//
// The function creates:
// - hourly_check_ins: Materialized view for hourly check-in aggregation
// - daily_check_ins: Materialized view for daily check-in aggregation
// - Associated refresh policies for automatic updates
func createContinuousAggregates(pool *pgxpool.Pool) {
	// Create materialized view for hourly check-ins
	_, err := pool.Exec(context.Background(), `
		CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_check_ins
		WITH (timescaledb.continuous) AS
		SELECT
			time_bucket(INTERVAL '1 hour', checked_in_at) AS hour,
			COUNT(*) AS check_in_count
		FROM check_ins
		GROUP BY hour;
	`)
	if err != nil {
		log.Fatalf("Failed to create hourly_check_ins materialized view: %v", err)
	}

	// Add refresh policy for hourly check-ins
	_, err = pool.Exec(context.Background(), `
		SELECT add_continuous_aggregate_policy('hourly_check_ins',
			start_offset => INTERVAL '3 hour',
			end_offset => INTERVAL '1 hour',
			schedule_interval => INTERVAL '1 hour',
			if_not_exists => true);
	`)
	if err != nil {
		// Check if the error is a "duplicate object" error (code 42710). If so, it's safe to ignore.
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "42710" {
			log.Printf("Warning: continuous aggregate policy for hourly_check_ins already exists. Ignoring.")
		} else {
			log.Fatalf("Failed to add continuous aggregate policy for hourly_check_ins: %v", err)
		}
	}

	// Create materialized view for daily check-ins
	_, err = pool.Exec(context.Background(), `
		CREATE MATERIALIZED VIEW IF NOT EXISTS daily_check_ins
		WITH (timescaledb.continuous) AS
		SELECT
			time_bucket(INTERVAL '1 day', checked_in_at) AS day,
			COUNT(*) AS check_in_count
		FROM check_ins
		GROUP BY day;
	`)
	if err != nil {
		log.Fatalf("Failed to create daily_check_ins materialized view: %v", err)
	}

	// Add refresh policy for daily check-ins
	_, err = pool.Exec(context.Background(), `
		SELECT add_continuous_aggregate_policy('daily_check_ins',
			start_offset => INTERVAL '3 day',
			end_offset => INTERVAL '1 day',
			schedule_interval => INTERVAL '1 day',
			if_not_exists => true);
	`)
	if err != nil {
		// Check if the error is a "duplicate object" error (code 42710). If so, it's safe to ignore.
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "42710" {
			log.Printf("Warning: continuous aggregate policy for daily_check_ins already exists. Ignoring.")
		} else {
			log.Fatalf("Failed to add continuous aggregate policy for daily_check_ins: %v", err)
		}
	}
}
