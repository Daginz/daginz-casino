-- Game rounds: one row per completed round, any game. game-specific detail
-- (e.g. the slot grid + winning lines) is stored as JSONB so the generic
-- engine doesn't need a column per game.

CREATE TABLE IF NOT EXISTS game_rounds (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id        TEXT        NOT NULL REFERENCES players(id),
    game             TEXT        NOT NULL,
    stake            BIGINT      NOT NULL CHECK (stake >= 0),
    payout           BIGINT      NOT NULL CHECK (payout >= 0),
    outcome          DOUBLE PRECISION NOT NULL,
    server_seed_hash TEXT        NOT NULL,
    client_seed      TEXT        NOT NULL,
    nonce            INTEGER     NOT NULL,
    detail           JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_player ON game_rounds (player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game ON game_rounds (game);
