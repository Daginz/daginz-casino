// Package api wires HTTP routes for the wallet service.
package api

import (
	"encoding/json"
	"net/http"
	"time"
)

// RegisterRoutes attaches all wallet routes to the given mux.
// Block D adds /bet, /win, /rollback, /deposit, /withdraw.
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", handleHealth)
}

type healthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, healthResponse{
		Status:    "ok",
		Service:   "wallet",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
