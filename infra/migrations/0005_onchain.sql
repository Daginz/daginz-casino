-- On-chain listener state: a single cursor (last processed block) + a dedupe
-- log of processed deposit events so a credit is never applied twice, even
-- across restarts or overlapping poll windows.

CREATE TABLE IF NOT EXISTS onchain_cursor (
    id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
    last_block      BIGINT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO onchain_cursor (id, last_block) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS onchain_deposits (
    tx_hash      TEXT        NOT NULL,
    log_index    INT         NOT NULL,
    player_addr  TEXT        NOT NULL,
    amount       NUMERIC(78, 0) NOT NULL,   -- uint256-safe
    nonce        BIGINT      NOT NULL,
    credited     BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tx_hash, log_index)
);

-- Withdrawals the backend has sent on-chain (reconciliation + idempotency).
CREATE TABLE IF NOT EXISTS onchain_withdrawals (
    withdrawal_id TEXT        PRIMARY KEY,   -- bytes32 hex, backend-generated
    player_addr   TEXT        NOT NULL,
    amount        NUMERIC(78, 0) NOT NULL,
    tx_hash       TEXT,
    status        TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'sent', 'failed')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
