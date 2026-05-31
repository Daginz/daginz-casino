// Command server starts the wallet/ledger HTTP service.
// This is the composition root: all wiring happens here, explicitly.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/casino/wallet/internal/api"
	"github.com/casino/wallet/internal/clock"
	"github.com/casino/wallet/internal/config"
	"github.com/casino/wallet/internal/ledger/adapters/httpapi"
	"github.com/casino/wallet/internal/ledger/adapters/memory"
	"github.com/casino/wallet/internal/ledger/app"
)

func main() {
	cfg := config.Load()

	// Composition: in-memory repo (Block C) + system clock → ledger service → HTTP adapter.
	repo := memory.New()
	ledgerSvc := app.NewService(repo, clock.System{})
	ledgerHandler := httpapi.New(ledgerSvc)

	mux := http.NewServeMux()
	api.RegisterRoutes(mux) // /health
	ledgerHandler.Register(mux)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("[wallet] listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[wallet] server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("[wallet] graceful shutdown failed: %v", err)
	}
	log.Println("[wallet] stopped")
}
