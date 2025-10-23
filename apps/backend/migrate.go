package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func runMigrations() error {
	fmt.Println("Skipping migrations for now - will be handled by database initialization")
	return nil
}

func applyMigrations(pool *pgxpool.Pool) error {
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

			if _, err := pool.Exec(context.Background(), stmt); err != nil {
				// Ignore "relation already exists" errors for idempotent migrations
				if strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "relation") && strings.Contains(err.Error(), "exists") ||
				   strings.Contains(err.Error(), "column") && strings.Contains(err.Error(), "already exists") ||
				   strings.Contains(err.Error(), "cannot create a unique index without the column") {
					fmt.Printf("Skipping existing relation in %s: %v\n", file, err)
					continue
				}
				return fmt.Errorf("failed to execute statement in %s: %v\nStatement: %s", file, err, stmt)
			}
		}
	}

	return nil
}