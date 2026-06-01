// Transport-layer tests: drive the HTTP handlers through a real httptest
// server wired to the real application service + in-memory repo. We assert the
// status-code mapping and JSON shapes a client actually sees — no mocks, since
// the app layer over the in-memory repo is fast and deterministic.
package httpapi_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/casino/wallet/internal/ledger/adapters/httpapi"
	"github.com/casino/wallet/internal/ledger/adapters/memory"
	"github.com/casino/wallet/internal/ledger/app"
)

type fixedClock struct{}

func (fixedClock) Now() time.Time { return time.Unix(0, 0).UTC() }

// newServer builds the full HTTP stack over a fresh in-memory ledger.
func newServer(t *testing.T) *httptest.Server {
	t.Helper()
	svc := app.NewService(memory.New(), fixedClock{})
	mux := http.NewServeMux()
	httpapi.New(svc).Register(mux)
	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)
	return srv
}

func postJSON(t *testing.T, url string, body any) (*http.Response, map[string]any) {
	t.Helper()
	buf, _ := json.Marshal(body)
	res, err := http.Post(url, "application/json", bytes.NewReader(buf))
	if err != nil {
		t.Fatalf("POST %s: %v", url, err)
	}
	raw, _ := io.ReadAll(res.Body)
	_ = res.Body.Close()
	var parsed map[string]any
	_ = json.Unmarshal(raw, &parsed)
	return res, parsed
}

func TestHandler_WinBetBalance(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	const player = "p1"

	res, _ := postJSON(t, srv.URL+"/ledger/win", map[string]any{
		"playerId": player, "amount": 100, "idempotencyKey": "w1", "reference": "seed",
	})
	if res.StatusCode != http.StatusOK {
		t.Fatalf("win status = %d, want 200", res.StatusCode)
	}

	res, body := postJSON(t, srv.URL+"/ledger/bet", map[string]any{
		"playerId": player, "amount": 30, "idempotencyKey": "b1", "reference": "round",
	})
	if res.StatusCode != http.StatusOK {
		t.Fatalf("bet status = %d, want 200", res.StatusCode)
	}
	if got := body["amount"]; got != float64(70) {
		t.Fatalf("balance after bet = %v, want 70", got)
	}

	// GET balance reflects the same value.
	getRes, err := http.Get(srv.URL + "/ledger/" + player + "/balance")
	if err != nil {
		t.Fatalf("GET balance: %v", err)
	}
	defer getRes.Body.Close()
	var bal map[string]any
	_ = json.NewDecoder(getRes.Body).Decode(&bal)
	if bal["amount"] != float64(70) {
		t.Fatalf("GET balance = %v, want 70", bal["amount"])
	}
}

func TestHandler_StatusCodes(t *testing.T) {
	t.Parallel()
	srv := newServer(t)

	tests := []struct {
		name    string
		path    string
		body    any
		want    int
		prepare func()
	}{
		{
			name: "overdraw returns 409",
			path: "/ledger/bet",
			body: map[string]any{"playerId": "broke", "amount": 50, "idempotencyKey": "x1", "reference": "r"},
			want: http.StatusConflict,
		},
		{
			name: "negative amount returns 400",
			path: "/ledger/win",
			body: map[string]any{"playerId": "p", "amount": -5, "idempotencyKey": "x2", "reference": "r"},
			want: http.StatusBadRequest,
		},
		{
			name: "rollback of unknown key returns 404",
			path: "/ledger/rollback",
			body: map[string]any{"idempotencyKey": "never-existed"},
			want: http.StatusNotFound,
		},
		{
			name: "rollback without a key returns 400",
			path: "/ledger/rollback",
			body: map[string]any{},
			want: http.StatusBadRequest,
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			res, _ := postJSON(t, srv.URL+tc.path, tc.body)
			if res.StatusCode != tc.want {
				t.Fatalf("%s status = %d, want %d", tc.name, res.StatusCode, tc.want)
			}
		})
	}
}

func TestHandler_RollbackReversesBet(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	const player = "rb"

	postJSON(t, srv.URL+"/ledger/win", map[string]any{"playerId": player, "amount": 100, "idempotencyKey": "w", "reference": "s"})
	postJSON(t, srv.URL+"/ledger/bet", map[string]any{"playerId": player, "amount": 40, "idempotencyKey": "b", "reference": "r"})

	res, body := postJSON(t, srv.URL+"/ledger/rollback", map[string]any{"idempotencyKey": "b"})
	if res.StatusCode != http.StatusOK {
		t.Fatalf("rollback status = %d, want 200", res.StatusCode)
	}
	if body["amount"] != float64(100) {
		t.Fatalf("balance after rollback = %v, want 100", body["amount"])
	}
}

func TestHandler_MalformedBodyReturns400(t *testing.T) {
	t.Parallel()
	srv := newServer(t)
	res, err := http.Post(srv.URL+"/ledger/bet", "application/json", bytes.NewReader([]byte("{not json")))
	if err != nil {
		t.Fatalf("POST: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusBadRequest {
		t.Fatalf("malformed body status = %d, want 400", res.StatusCode)
	}
}
