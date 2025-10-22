package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "github.com/lib/pq"
)

func runMigrations() error {
	fmt.Println("Skipping migrations for now - will be handled by database initialization")
	return nil
}

func applyMigrations(db *sql.DB) error {
	migrationsDir := "apps/backend/db/migrations"

	// Get all migration files
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.up.sql"))
	if err != nil {
		return fmt.Errorf("failed to read migration files: %v", err)
	}

	// Sort files by name (they should be in order)
	sort.Strings(files)

	for _, file := range files {
		fmt.Printf("Applying migration: %s\n", filepath.Base(file))

		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %v", file, err)
		}

		// Split by semicolon and execute each statement
		statements := strings.Split(string(content), ";")

		for _, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}

			if _, err := db.Exec(stmt); err != nil {
				return fmt.Errorf("failed to execute statement in %s: %v\nStatement: %s", file, err, stmt)
			}
		}
	}

	return nil
}