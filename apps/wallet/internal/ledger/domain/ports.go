package domain

import "context"

// LedgerRepository is a port: declared by the domain, implemented by an adapter
// (in-memory now, pgx in Block D). Accept interfaces, return structs.
type LedgerRepository interface {
	// Balance returns the derived balance for a player (zero if no entries).
	Balance(ctx context.Context, playerID PlayerID) (Amount, error)
	// HasOp reports whether an idempotency key was already applied.
	HasOp(ctx context.Context, idempotencyKey string) (bool, error)
	// Append persists a new immutable entry.
	Append(ctx context.Context, entry Entry) error
}
