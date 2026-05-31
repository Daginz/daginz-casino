// Package postgres provides a pgx-backed LedgerRepository and a tiny migration
// runner. Migrations are plain .sql files applied in lexical order, tracked in
// a schema_migrations table. No external migrate binary needed.
package postgres

import (
	"context"
	"embed"
	"fmt"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migrate applies any unapplied .sql migrations embedded in the binary.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name       TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`); err != nil {
		return fmt.Errorf("creating schema_migrations: %w", err)
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("reading migrations dir: %w", err)
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		if !e.IsDir() {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		if applyErr := applyOne(ctx, pool, name); applyErr != nil {
			return applyErr
		}
	}
	return nil
}

func applyOne(ctx context.Context, pool *pgxpool.Pool, name string) error {
	var exists bool
	if err := pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = $1)`, name,
	).Scan(&exists); err != nil {
		return fmt.Errorf("checking migration %s: %w", name, err)
	}
	if exists {
		return nil
	}

	sqlBytes, err := migrationsFS.ReadFile("migrations/" + name)
	if err != nil {
		return fmt.Errorf("reading migration %s: %w", name, err)
	}

	return pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
		if _, execErr := tx.Exec(ctx, string(sqlBytes)); execErr != nil {
			return fmt.Errorf("applying migration %s: %w", name, execErr)
		}
		if _, insErr := tx.Exec(ctx,
			`INSERT INTO schema_migrations (name) VALUES ($1)`, name,
		); insErr != nil {
			return fmt.Errorf("recording migration %s: %w", name, insErr)
		}
		return nil
	})
}
