package libsql

import (
	"database/sql"
	"log"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

// DB is a wrapper around sql.DB that provides failover support.
 type DB struct {
	primary *sql.DB
	replica *sql.DB
	mu      sync.RWMutex
}

// New returns a new DB wrapper.
 func New(primaryDSN, replicaDSN string) (*DB, error) {
	primary, err := sql.Open("postgres", primaryDSN)
	if err != nil {
		return nil, err
	}

	replica, err := sql.Open("postgres", replicaDSN)
	if err != nil {
		return nil, err
	}

	db := &DB{
		primary: primary,
		replica: replica,
	}

	go db.checkPrimary()

	return db, nil
}

// checkPrimary checks the primary database connection and fails over to the replica if necessary.
 func (db *DB) checkPrimary() {
	for {
		time.Sleep(5 * time.Second)

		if err := db.primary.Ping(); err != nil {
			log.Println("Primary database is down, failing over to replica")
			db.mu.Lock()
			db.primary, db.replica = db.replica, db.primary
			db.mu.Unlock()
		}
	}
}

// Begin starts a transaction.
 func (db *DB) Begin() (*sql.Tx, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.primary.Begin()
}

// Exec executes a query without returning any rows.
 func (db *DB) Exec(query string, args ...interface{}) (sql.Result, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.primary.Exec(query, args...)
}

// Prepare creates a prepared statement for later queries or executions.
 func (db *DB) Prepare(query string) (*sql.Stmt, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.primary.Prepare(query)
}

// Query executes a query that returns rows, typically a SELECT.
 func (db *DB) Query(query string, args ...interface{}) (*sql.Rows, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.primary.Query(query, args...)
}

// QueryRow executes a query that is expected to return at most one row.
 func (db *DB) QueryRow(query string, args ...interface{}) *sql.Row {
	db.mu.RLock()
	defer db.mu.RUnlock()
	return db.primary.QueryRow(query, args...)
}

// Close closes the database and prevents new queries from starting.
 func (db *DB) Close() error {
	if err := db.primary.Close(); err != nil {
		return err
	}
	return db.replica.Close()
}
