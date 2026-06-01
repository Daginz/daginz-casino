// Black-box tests (package domain_test) — exercise the public API only, the
// way real callers use it. The domain is pure, so no mocks are needed: we
// construct Amounts directly and assert invariants.
package domain_test

import (
	"errors"
	"testing"

	"github.com/casino/wallet/internal/ledger/domain"
)

func mustAmount(t *testing.T, v int64) domain.Amount {
	t.Helper()
	a, err := domain.NewAmount(v)
	if err != nil {
		t.Fatalf("NewAmount(%d) unexpected error: %v", v, err)
	}
	return a
}

func TestNewAmount(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name    string
		input   int64
		want    int64
		wantErr error
	}{
		{name: "zero is valid", input: 0, want: 0},
		{name: "positive", input: 100, want: 100},
		{name: "large positive", input: 9_223_372_036_854_775_807, want: 9_223_372_036_854_775_807},
		{name: "negative is rejected", input: -1, wantErr: domain.ErrNegativeAmount},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got, err := domain.NewAmount(tc.input)
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Fatalf("NewAmount(%d) error = %v, want %v", tc.input, err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("NewAmount(%d) unexpected error: %v", tc.input, err)
			}
			if got.MinorUnits() != tc.want {
				t.Fatalf("MinorUnits() = %d, want %d", got.MinorUnits(), tc.want)
			}
		})
	}
}

func TestAmount_Add(t *testing.T) {
	t.Parallel()
	a := mustAmount(t, 70)
	b := mustAmount(t, 30)

	sum := a.Add(b)
	if sum.MinorUnits() != 100 {
		t.Fatalf("Add = %d, want 100", sum.MinorUnits())
	}
	// Value-object immutability: the operands are unchanged.
	if a.MinorUnits() != 70 || b.MinorUnits() != 30 {
		t.Fatalf("Add mutated an operand: a=%d b=%d", a.MinorUnits(), b.MinorUnits())
	}
}

func TestAmount_Sub(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name    string
		a, b    int64
		want    int64
		wantErr bool
	}{
		{name: "simple", a: 100, b: 40, want: 60},
		{name: "to zero", a: 50, b: 50, want: 0},
		{name: "overdraw is rejected", a: 10, b: 30, wantErr: true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got, err := mustAmount(t, tc.a).Sub(mustAmount(t, tc.b))
			if tc.wantErr {
				if !errors.Is(err, domain.ErrNegativeAmount) {
					t.Fatalf("Sub(%d,%d) error = %v, want ErrNegativeAmount", tc.a, tc.b, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("Sub(%d,%d) unexpected error: %v", tc.a, tc.b, err)
			}
			if got.MinorUnits() != tc.want {
				t.Fatalf("Sub(%d,%d) = %d, want %d", tc.a, tc.b, got.MinorUnits(), tc.want)
			}
		})
	}
}

// Round-trip property: for non-negative a >= b, (a - b) + b == a.
func FuzzAmount_SubAddRoundTrip(f *testing.F) {
	f.Add(int64(100), int64(40))
	f.Add(int64(0), int64(0))
	f.Fuzz(func(t *testing.T, a, b int64) {
		if a < 0 || b < 0 || b > a {
			t.Skip() // domain only defines these for non-negative, non-overdraw
		}
		base := mustAmount(t, a)
		sub := mustAmount(t, b)
		diff, err := base.Sub(sub)
		if err != nil {
			t.Fatalf("Sub(%d,%d) errored unexpectedly: %v", a, b, err)
		}
		if got := diff.Add(sub).MinorUnits(); got != a {
			t.Fatalf("round-trip: (%d-%d)+%d = %d, want %d", a, b, b, got, a)
		}
	})
}
