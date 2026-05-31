// Package config loads wallet-service configuration from the environment.
package config

import "os"

// Config holds runtime configuration for the wallet service.
type Config struct {
	Port        string
	DatabaseURL string
	// Store selects the ledger backend: "postgres" (default) or "memory".
	Store string
}

// Load reads configuration from environment variables with sane defaults.
func Load() Config {
	return Config{
		Port:        getenv("WALLET_PORT", "4100"),
		DatabaseURL: getenv("DATABASE_URL", "postgres://casino:casino@localhost:5432/casino"),
		Store:       getenv("WALLET_STORE", "postgres"),
	}
}

func getenv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}
