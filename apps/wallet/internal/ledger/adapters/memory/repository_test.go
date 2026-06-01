// Tests for the in-memory ledger repository. It's an adapter behind the same
// port as Postgres, so these checks also document the contract the pgx adapter
// must satisfy. Run with -race to exercise the mutex (TestConcurrentAppend).
package memory_test

import (
	"context"
	"errors"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/casino/wallet/internal/ledger/adapters/memory"
	"github.com/casino/wallet/internal/ledger/domain"
)

func amt(t *testing.T, v int64) domain.Amount {
	t.Helper()
	a, err := domain.NewAmount(v)
	if err != nil {
		t.Fatalf("NewAmount(%d): %v", v, err)
	}
	return a
}

func entry(key string, p domain.PlayerID, dir domain.Direction, a domain.Amount) domain.Entry {
	return domain.Entry{
		IdempotencyKey: key,
		PlayerID:       p,
		Direction:      dir,
		Amount:         a,
		Reference:      "test",
		CreatedAt:      time.Unix(0, 0).UTC(),
	}
}

func TestBalance_DerivedFromEntries(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()
	const p domain.PlayerID = "p1"

	mustAppend(t, r, entry("c1", p, domain.Credit, amt(t, 100)))
	mustAppend(t, r, entry("d1", p, domain.Debit, amt(t, 30)))

	bal, err := r.Balance(ctx, p)
	if err != nil {
		t.Fatalf("Balance: %v", err)
	}
	if bal.MinorUnits() != 70 {
		t.Fatalf("Balance = %d, want 70", bal.MinorUnits())
	}
}

func TestBalance_FlooredAtZero(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()
	const p domain.PlayerID = "p2"

	// A debit exceeding credits would go negative; the repo floors at zero.
	mustAppend(t, r, entry("c1", p, domain.Credit, amt(t, 10)))
	mustAppend(t, r, entry("d1", p, domain.Debit, amt(t, 25)))

	bal, _ := r.Balance(ctx, p)
	if bal.MinorUnits() != 0 {
		t.Fatalf("Balance = %d, want 0 (floored)", bal.MinorUnits())
	}
}

func TestBalance_IsolatedPerPlayer(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()
	mustAppend(t, r, entry("a", "alice", domain.Credit, amt(t, 100)))
	mustAppend(t, r, entry("b", "bob", domain.Credit, amt(t, 50)))

	alice, _ := r.Balance(ctx, "alice")
	bob, _ := r.Balance(ctx, "bob")
	if alice.MinorUnits() != 100 || bob.MinorUnits() != 50 {
		t.Fatalf("cross-player leak: alice=%d bob=%d", alice.MinorUnits(), bob.MinorUnits())
	}
}

func TestHasOp_AndDuplicateAppend(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()

	seen, _ := r.HasOp(ctx, "k1")
	if seen {
		t.Fatal("HasOp reported a key before it was appended")
	}
	mustAppend(t, r, entry("k1", "p", domain.Credit, amt(t, 10)))

	if seen, _ := r.HasOp(ctx, "k1"); !seen {
		t.Fatal("HasOp did not report an appended key")
	}
	// Re-appending the same key must be rejected.
	if err := r.Append(ctx, entry("k1", "p", domain.Credit, amt(t, 10))); !errors.Is(err, domain.ErrDuplicateOp) {
		t.Fatalf("duplicate Append error = %v, want ErrDuplicateOp", err)
	}
}

func TestFindByKey(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()
	mustAppend(t, r, entry("find-me", "p", domain.Debit, amt(t, 42)))

	got, found, err := r.FindByKey(ctx, "find-me")
	if err != nil || !found {
		t.Fatalf("FindByKey found=%v err=%v, want found", found, err)
	}
	if got.Amount.MinorUnits() != 42 || got.Direction != domain.Debit {
		t.Fatalf("FindByKey returned wrong entry: %+v", got)
	}

	if _, found, _ := r.FindByKey(ctx, "absent"); found {
		t.Fatal("FindByKey reported a missing key as found")
	}
}

// Run with -race: concurrent appends must not corrupt state or race the mutex.
func TestConcurrentAppend(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	r := memory.New()
	const n = 100
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_ = r.Append(ctx, entry("k"+strconv.Itoa(i), "p", domain.Credit, amt(t, 1)))
		}(i)
	}
	wg.Wait()

	bal, _ := r.Balance(ctx, "p")
	if bal.MinorUnits() != n {
		t.Fatalf("after %d concurrent credits balance = %d, want %d", n, bal.MinorUnits(), n)
	}
}

func mustAppend(t *testing.T, r *memory.Repository, e domain.Entry) {
	t.Helper()
	if err := r.Append(context.Background(), e); err != nil {
		t.Fatalf("Append(%s): %v", e.IdempotencyKey, err)
	}
}
