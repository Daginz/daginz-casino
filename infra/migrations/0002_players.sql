-- Players: identity is the wallet address (lowercased). No passwords, no PII.

CREATE TABLE IF NOT EXISTS players (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT        NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
