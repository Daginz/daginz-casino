// Package app is the ledger application layer: orchestrates domain + ports.
// Imports domain only; knows nothing about HTTP or the database.
package app

import (
	"context"
	"fmt"
	"time"

	"github.com/casino/wallet/internal/ledger/domain"
)

// Clock is a port for time, injected for determinism in tests.
type Clock interface{ Now() time.Time }

// Service applies bet/win/rollback operations against the ledger.
type Service struct {
	repo  domain.LedgerRepository
	clock Clock
}

// NewService wires the ledger service (composition happens in cmd/).
func NewService(repo domain.LedgerRepository, clock Clock) *Service {
	return &Service{repo: repo, clock: clock}
}

// Balance returns a player's current balance.
func (s *Service) Balance(ctx context.Context, playerID domain.PlayerID) (domain.Amount, error) {
	bal, err := s.repo.Balance(ctx, playerID)
	if err != nil {
		return domain.Amount{}, fmt.Errorf("reading balance: %w", err)
	}
	return bal, nil
}

// Bet debits a stake. Idempotent on idempotencyKey.
func (s *Service) Bet(ctx context.Context, playerID domain.PlayerID, amt domain.Amount, key, ref string) (domain.Amount, error) {
	return s.apply(ctx, playerID, domain.Debit, amt, key, ref)
}

// Win credits a payout. Idempotent on idempotencyKey.
func (s *Service) Win(ctx context.Context, playerID domain.PlayerID, amt domain.Amount, key, ref string) (domain.Amount, error) {
	return s.apply(ctx, playerID, domain.Credit, amt, key, ref)
}

// Rollback reverses a previously-applied operation by appending a compensating
// entry in the opposite direction for the same amount. Idempotent: a second
// rollback of the same key is a no-op. The reversal never overdraws — the
// floored balance keeps the result non-negative.
func (s *Service) Rollback(ctx context.Context, key string) (domain.Amount, error) {
	original, found, err := s.repo.FindByKey(ctx, key)
	if err != nil {
		return domain.Amount{}, fmt.Errorf("finding original op: %w", err)
	}
	if !found {
		return domain.Amount{}, domain.ErrAccountNotFound
	}

	reversalKey := "rollback:" + key
	seen, err := s.repo.HasOp(ctx, reversalKey)
	if err != nil {
		return domain.Amount{}, fmt.Errorf("checking rollback idempotency: %w", err)
	}
	if seen {
		return s.repo.Balance(ctx, original.PlayerID)
	}

	reversal := domain.Entry{
		IdempotencyKey: reversalKey,
		PlayerID:       original.PlayerID,
		Direction:      opposite(original.Direction),
		Amount:         original.Amount,
		Reference:      "rollback:" + original.Reference,
		CreatedAt:      s.clock.Now(),
	}
	if appendErr := s.repo.Append(ctx, reversal); appendErr != nil {
		return domain.Amount{}, fmt.Errorf("appending reversal: %w", appendErr)
	}
	return s.repo.Balance(ctx, original.PlayerID)
}

func opposite(d domain.Direction) domain.Direction {
	if d == domain.Debit {
		return domain.Credit
	}
	return domain.Debit
}

func (s *Service) apply(ctx context.Context, playerID domain.PlayerID, dir domain.Direction, amt domain.Amount, key, ref string) (domain.Amount, error) {
	seen, err := s.repo.HasOp(ctx, key)
	if err != nil {
		return domain.Amount{}, fmt.Errorf("checking idempotency: %w", err)
	}
	if seen {
		// Idempotent: return current balance without re-applying.
		return s.repo.Balance(ctx, playerID)
	}

	if dir == domain.Debit {
		bal, balErr := s.repo.Balance(ctx, playerID)
		if balErr != nil {
			return domain.Amount{}, fmt.Errorf("reading balance: %w", balErr)
		}
		if _, subErr := bal.Sub(amt); subErr != nil {
			return domain.Amount{}, fmt.Errorf("applying bet: %w", domain.ErrInsufficientFund)
		}
	}

	entry := domain.Entry{
		IdempotencyKey: key,
		PlayerID:       playerID,
		Direction:      dir,
		Amount:         amt,
		Reference:      ref,
		CreatedAt:      s.clock.Now(),
	}
	if appendErr := s.repo.Append(ctx, entry); appendErr != nil {
		return domain.Amount{}, fmt.Errorf("appending entry: %w", appendErr)
	}
	return s.repo.Balance(ctx, playerID)
}
