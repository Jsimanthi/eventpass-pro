package libsql

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DBWrapper provides a unified interface for both PostgreSQL and LibSQL
type DBWrapper struct {
	primary     *pgxpool.Pool
	fallbackDB  *sql.DB
	useFallback bool
}

// NewDBWrapper creates a new database wrapper with fallback support
func NewDBWrapper(ctx context.Context, primaryDSN, fallbackURL string) (*DBWrapper, error) {
	wrapper := &DBWrapper{}

	// Initialize primary PostgreSQL connection
	primary, err := pgxpool.New(ctx, primaryDSN)
	if err != nil {
		slog.Error("Failed to connect to primary database", "error", err)
		// If primary fails, try to use fallback
		if fallbackURL != "" {
			slog.Info("Attempting to use LibSQL fallback")
			return initFallback(wrapper, fallbackURL)
		}
		return nil, fmt.Errorf("failed to connect to both primary and fallback databases: %w", err)
	}

	// Test primary connection
	if err := primary.Ping(ctx); err != nil {
		slog.Error("Primary database ping failed", "error", err)
		primary.Close()

		if fallbackURL != "" {
			slog.Info("Switching to LibSQL fallback due to primary ping failure")
			return initFallback(wrapper, fallbackURL)
		}
		return nil, fmt.Errorf("primary database ping failed and no fallback available: %w", err)
	}

	wrapper.primary = primary
	wrapper.useFallback = false

	slog.Info("Database wrapper initialized with primary PostgreSQL connection")
	return wrapper, nil
}

// initFallback initializes the LibSQL fallback connection
func initFallback(wrapper *DBWrapper, fallbackURL string) (*DBWrapper, error) {
	db, err := sql.Open("libsql", fallbackURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create LibSQL connection: %w", err)
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping LibSQL database: %w", err)
	}

	wrapper.fallbackDB = db
	wrapper.useFallback = true

	slog.Info("Database wrapper initialized with LibSQL fallback connection")
	return wrapper, nil
}

// Ping checks the health of the active database connection
func (db *DBWrapper) Ping(ctx context.Context) error {
	if db.useFallback {
		return db.fallbackDB.PingContext(ctx)
	}

	return db.primary.Ping(ctx)
}

// Close closes the active database connection
func (db *DBWrapper) Close() {
	if db.useFallback && db.fallbackDB != nil {
		db.fallbackDB.Close()
	} else if db.primary != nil {
		db.primary.Close()
	}
}

// IsUsingFallback returns true if the wrapper is using the LibSQL fallback
func (db *DBWrapper) IsUsingFallback() bool {
	return db.useFallback
}

// GetPrimary returns the primary PostgreSQL pool (nil if using fallback)
func (db *DBWrapper) GetPrimary() *pgxpool.Pool {
	if db.useFallback {
		return nil
	}
	return db.primary
}

// GetFallback returns the LibSQL database (nil if using primary)
func (db *DBWrapper) GetFallback() *sql.DB {
	if !db.useFallback {
		return nil
	}
	return db.fallbackDB
}

// ExecuteQuery executes a query on the active database
func (db *DBWrapper) ExecuteQuery(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	if db.useFallback {
		return db.fallbackDB.ExecContext(ctx, query, args...)
	}

	// For pgx v5, we need to handle the return type conversion
	commandTag, err := db.primary.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	// Convert pgx result to sql.Result
	return &pgxResult{
		rowsAffected: commandTag.RowsAffected(),
		lastInsertId: 0, // pgx doesn't provide LastInsertId directly
	}, nil
}

// QueryRow executes a query that returns a single row
func (db *DBWrapper) QueryRow(ctx context.Context, query string, args ...interface{}) interface{} {
	if db.useFallback {
		return db.fallbackDB.QueryRowContext(ctx, query, args...)
	}

	return db.primary.QueryRow(ctx, query, args...)
}

// Query executes a query that returns multiple rows
func (db *DBWrapper) Query(ctx context.Context, query string, args ...interface{}) (interface{}, error) {
	if db.useFallback {
		return db.fallbackDB.QueryContext(ctx, query, args...)
	}

	return db.primary.Query(ctx, query, args...)
}

// BeginTx starts a transaction on the active database
func (db *DBWrapper) BeginTx(ctx context.Context, opts ...interface{}) (interface{}, error) {
	if db.useFallback {
		var txOpts *sql.TxOptions
		if len(opts) > 0 {
			if opt, ok := opts[0].(*sql.TxOptions); ok {
				txOpts = opt
			}
		}

		return db.fallbackDB.BeginTx(ctx, txOpts)
	}

	// For pgx v5, Begin is the correct method
	return db.primary.Begin(ctx)
}

// pgxResult wraps pgx result to implement sql.Result interface
type pgxResult struct {
	rowsAffected int64
	lastInsertId int64
}

func (r *pgxResult) LastInsertId() (int64, error) {
	return r.lastInsertId, nil
}

func (r *pgxResult) RowsAffected() (int64, error) {
	return r.rowsAffected, nil
}
