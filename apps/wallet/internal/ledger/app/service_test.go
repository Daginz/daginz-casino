package app_test

import (
	"context"
	"testing"
	"time"

	"github.com/casino/wallet/internal/ledger/adapters/memory"
	"github.com/casino/wallet/internal/ledger/app"
	"github.com/casino/wallet/internal/ledger/domain"
)

type fixedClock struct{ t time.Time }

func (c fixedClock) Now() time.Time { return c.t }

func amt(t *testing.T, v int64) domain.Amount {
	t.Helper()
	a, err := domain.NewAmount(v)
	if err != nil {
		t.Fatalf("NewAmount(%d): %v", v, err)
	}
	return a
}

func newService() *app.Service {
	return app.NewService(memory.New(), fixedClock{t: time.Unix(0, 0).UTC()})
}

func TestService_WinThenBet(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()
	const player domain.PlayerID = "p1"

	if _, err := svc.Win(ctx, player, amt(t, 100), "win-1", "seed"); err != nil {
		t.Fatalf("win: %v", err)
	}
	bal, err := svc.Bet(ctx, player, amt(t, 40), "bet-1", "round-1")
	if err != nil {
		t.Fatalf("bet: %v", err)
	}
	if got := bal.MinorUnits(); got != 60 {
		t.Fatalf("balance = %d, want 60", got)
	}
}

func TestService_BetInsufficientFunds(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()

	_, err := svc.Bet(ctx, "p2", amt(t, 10), "bet-x", "round")
	if err == nil {
		t.Fatal("expected insufficient funds error, got nil")
	}
}

func TestService_Balance(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()

	// Unknown player → zero, no error.
	zero, err := svc.Balance(ctx, "nobody")
	if err != nil || zero.MinorUnits() != 0 {
		t.Fatalf("Balance(unknown) = %d, %v; want 0, nil", zero.MinorUnits(), err)
	}

	if _, err := svc.Win(ctx, "bp", amt(t, 80), "w-bp", "seed"); err != nil {
		t.Fatalf("win: %v", err)
	}
	bal, err := svc.Balance(ctx, "bp")
	if err != nil || bal.MinorUnits() != 80 {
		t.Fatalf("Balance = %d, %v; want 80, nil", bal.MinorUnits(), err)
	}
}

func TestService_RollbackReversesAWin(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()
	const player domain.PlayerID = "rbw"

	// Two wins; roll back the second — exercises the credit→debit reversal path.
	if _, err := svc.Win(ctx, player, amt(t, 100), "w1-rbw", "seed"); err != nil {
		t.Fatalf("win1: %v", err)
	}
	if _, err := svc.Win(ctx, player, amt(t, 40), "w2-rbw", "bonus"); err != nil {
		t.Fatalf("win2: %v", err)
	}
	bal, err := svc.Rollback(ctx, "w2-rbw")
	if err != nil {
		t.Fatalf("rollback: %v", err)
	}
	if got := bal.MinorUnits(); got != 100 {
		t.Fatalf("balance after rolling back a win = %d, want 100", got)
	}
}

func TestService_RollbackReversesABet(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()
	const player domain.PlayerID = "rb1"

	if _, err := svc.Win(ctx, player, amt(t, 100), "win-rb1", "seed"); err != nil {
		t.Fatalf("win: %v", err)
	}
	if _, err := svc.Bet(ctx, player, amt(t, 30), "bet-rb1", "round"); err != nil {
		t.Fatalf("bet: %v", err)
	}
	// Balance is 70; rolling back the bet should restore it to 100.
	bal, err := svc.Rollback(ctx, "bet-rb1")
	if err != nil {
		t.Fatalf("rollback: %v", err)
	}
	if got := bal.MinorUnits(); got != 100 {
		t.Fatalf("balance after rollback = %d, want 100", got)
	}
}

func TestService_RollbackIsIdempotent(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()
	const player domain.PlayerID = "rb2"

	if _, err := svc.Win(ctx, player, amt(t, 100), "win-rb2", "seed"); err != nil {
		t.Fatalf("win: %v", err)
	}
	if _, err := svc.Bet(ctx, player, amt(t, 40), "bet-rb2", "round"); err != nil {
		t.Fatalf("bet: %v", err)
	}
	if _, err := svc.Rollback(ctx, "bet-rb2"); err != nil {
		t.Fatalf("first rollback: %v", err)
	}
	// A second rollback of the same op must not credit again.
	bal, err := svc.Rollback(ctx, "bet-rb2")
	if err != nil {
		t.Fatalf("second rollback: %v", err)
	}
	if got := bal.MinorUnits(); got != 100 {
		t.Fatalf("balance after double rollback = %d, want 100 (idempotent)", got)
	}
}

func TestService_RollbackUnknownKey(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()

	if _, err := svc.Rollback(ctx, "does-not-exist"); err == nil {
		t.Fatal("expected error rolling back an unknown op, got nil")
	}
}

func TestService_Idempotency(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	svc := newService()
	const player domain.PlayerID = "p3"

	if _, err := svc.Win(ctx, player, amt(t, 50), "win-dup", "seed"); err != nil {
		t.Fatalf("first win: %v", err)
	}
	// Same idempotency key must not credit twice.
	bal, err := svc.Win(ctx, player, amt(t, 50), "win-dup", "seed")
	if err != nil {
		t.Fatalf("second win: %v", err)
	}
	if got := bal.MinorUnits(); got != 50 {
		t.Fatalf("balance = %d, want 50 (idempotent)", got)
	}
}
