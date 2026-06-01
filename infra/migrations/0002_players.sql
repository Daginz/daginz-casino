-- Players: identity IS the lowercased wallet address. No passwords, no PII.
-- The address is the primary key — it is the single identity used across auth
-- (JWT sub), the ledger, provably-fair seeds, game rounds and the on-chain
-- listener. Using one id everywhere prevents the deposit/bet/withdraw drift
-- that a separate surrogate UUID caused.

CREATE TABLE IF NOT EXISTS players (
    id          TEXT        PRIMARY KEY,        -- lowercased wallet address
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
