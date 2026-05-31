-- Provably-fair commit-reveal seeds. Each player has at most one ACTIVE seed
-- pair at a time; its server_seed_hash is published before play, the
-- server_seed is revealed only after the pair is rotated/retired.
-- nonce increments per round so the same seed pair yields distinct outcomes.

CREATE TABLE IF NOT EXISTS pf_seeds (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id        UUID        NOT NULL REFERENCES players(id),
    server_seed      TEXT        NOT NULL,
    server_seed_hash TEXT        NOT NULL,
    client_seed      TEXT        NOT NULL,
    nonce            INTEGER     NOT NULL DEFAULT 0,
    status           TEXT        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'revealed')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    revealed_at      TIMESTAMPTZ
);

-- At most one active seed per player (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pf_seeds_active_player
    ON pf_seeds (player_id) WHERE status = 'active';
