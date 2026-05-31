// Package httpapi adapts the ledger application service to HTTP.
// Thin handlers: decode → call app service → encode. No business logic here.
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/casino/wallet/internal/ledger/app"
	"github.com/casino/wallet/internal/ledger/domain"
)

// Handler holds the ledger service dependency.
type Handler struct {
	svc *app.Service
}

// New returns a ledger HTTP handler.
func New(svc *app.Service) *Handler { return &Handler{svc: svc} }

// Register attaches ledger routes (Go 1.22 method+pattern routing).
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /ledger/{playerID}/balance", h.balance)
	mux.HandleFunc("POST /ledger/bet", h.bet)
	mux.HandleFunc("POST /ledger/win", h.win)
}

type opRequest struct {
	PlayerID       string `json:"playerId"`
	Amount         int64  `json:"amount"`
	IdempotencyKey string `json:"idempotencyKey"`
	Reference      string `json:"reference"`
}

type balanceResponse struct {
	PlayerID string `json:"playerId"`
	Amount   int64  `json:"amount"`
}

// opFunc is the shared shape of Service.Bet / Service.Win.
type opFunc func(ctx context.Context, playerID domain.PlayerID, amt domain.Amount, key, ref string) (domain.Amount, error)

func (h *Handler) balance(w http.ResponseWriter, r *http.Request) {
	playerID := domain.PlayerID(r.PathValue("playerID"))
	bal, err := h.svc.Balance(r.Context(), playerID)
	if err != nil {
		writeErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, balanceResponse{PlayerID: string(playerID), Amount: bal.MinorUnits()})
}

func (h *Handler) bet(w http.ResponseWriter, r *http.Request) { h.apply(w, r, h.svc.Bet) }
func (h *Handler) win(w http.ResponseWriter, r *http.Request) { h.apply(w, r, h.svc.Win) }

func (h *Handler) apply(w http.ResponseWriter, r *http.Request, fn opFunc) {
	var req opRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
		return
	}
	amt, err := domain.NewAmount(req.Amount)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	bal, err := fn(r.Context(), domain.PlayerID(req.PlayerID), amt, req.IdempotencyKey, req.Reference)
	if err != nil {
		writeErr(w, err)
		return
	}
	writeJSON(w, http.StatusOK, balanceResponse{PlayerID: req.PlayerID, Amount: bal.MinorUnits()})
}

func writeErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrInsufficientFund):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "insufficient_funds"})
	case errors.Is(err, domain.ErrAccountNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "account_not_found"})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
