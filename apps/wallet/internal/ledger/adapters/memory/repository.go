// Package memory is an in-memory LedgerRepository adapter (Block C stub).
// Block D swaps in a pgx-backed implementation behind the same port.
package memory

import (
	"context"
	"sync"

	"github.com/casino/wallet/internal/ledger/domain"
)

// Repository is a goroutine-safe in-memory ledger.
type Repository struct {
	mu      sync.RWMutex
	entries []domain.Entry
	seen    map[string]struct{}
}

// New returns an empty in-memory repository.
func New() *Repository {
	return &Repository{seen: make(map[string]struct{})}
}

// Balance derives the balance from the append-only entry list.
func (r *Repository) Balance(_ context.Context, playerID domain.PlayerID) (domain.Amount, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var total int64
	for _, e := range r.entries {
		if e.PlayerID != playerID {
			continue
		}
		if e.Direction == domain.Credit {
			total += e.Amount.MinorUnits()
		} else {
			total -= e.Amount.MinorUnits()
		}
	}
	if total < 0 {
		total = 0
	}
	return domain.NewAmount(total)
}

// HasOp reports whether an idempotency key was already applied.
func (r *Repository) HasOp(_ context.Context, idempotencyKey string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.seen[idempotencyKey]
	return ok, nil
}

// FindByKey returns the entry with the given idempotency key, if present.
func (r *Repository) FindByKey(_ context.Context, idempotencyKey string) (domain.Entry, bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, e := range r.entries {
		if e.IdempotencyKey == idempotencyKey {
			return e, true, nil
		}
	}
	return domain.Entry{}, false, nil
}

// Append persists a new immutable entry.
func (r *Repository) Append(_ context.Context, entry domain.Entry) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.seen[entry.IdempotencyKey]; ok {
		return domain.ErrDuplicateOp
	}
	r.seen[entry.IdempotencyKey] = struct{}{}
	r.entries = append(r.entries, entry)
	return nil
}
