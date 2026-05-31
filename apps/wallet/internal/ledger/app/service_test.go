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
