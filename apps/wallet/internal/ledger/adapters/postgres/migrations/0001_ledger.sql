-- Ledger: append-only double-entry journal. Balance is always derived,
-- never stored mutably. Idempotency enforced by a unique key.

CREATE TABLE IF NOT EXISTS ledger_entries (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    idempotency_key TEXT        NOT NULL UNIQUE,
    player_id       TEXT        NOT NULL,
    direction       TEXT        NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount          BIGINT      NOT NULL CHECK (amount >= 0),
    reference       TEXT        NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot path: balance is SUM over a player's entries.
CREATE INDEX IF NOT EXISTS idx_ledger_entries_player ON ledger_entries (player_id);
