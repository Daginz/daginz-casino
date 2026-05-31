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
	"github.com/casino/wallet/internal/ledger/adapters/postgres"
	"github.com/casino/wallet/internal/ledger/app"
	"github.com/casino/wallet/internal/ledger/domain"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	// Composition: choose ledger repository backend, build service + HTTP adapter.
	repo, cleanup, err := buildRepo(ctx, cfg)
	if err != nil {
		log.Fatalf("[wallet] init store: %v", err)
	}
	defer cleanup()

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
		log.Printf("[wallet] listening on http://localhost:%s (store=%s)", cfg.Port, cfg.Store)
		if listenErr := srv.ListenAndServe(); listenErr != nil && !errors.Is(listenErr, http.ErrServerClosed) {
			log.Fatalf("[wallet] server error: %v", listenErr)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if shutdownErr := srv.Shutdown(shutdownCtx); shutdownErr != nil {
		log.Printf("[wallet] graceful shutdown failed: %v", shutdownErr)
	}
	log.Println("[wallet] stopped")
}

// buildRepo selects and constructs the ledger repository backend.
func buildRepo(ctx context.Context, cfg config.Config) (domain.LedgerRepository, func(), error) {
	if cfg.Store == "memory" {
		return memory.New(), func() {}, nil
	}
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}
	if migErr := postgres.Migrate(ctx, pool); migErr != nil {
		pool.Close()
		return nil, nil, migErr
	}
	return postgres.New(pool), pool.Close, nil
}
