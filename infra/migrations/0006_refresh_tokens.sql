-- Refresh tokens for the SIWE auth session. The opaque token itself is NEVER
-- stored — only its SHA-256 hash, so a DB leak can't be used to mint sessions.
-- Tokens are rotated on every use (the old row is revoked), enabling reuse
-- detection: presenting an already-rotated token is a theft signal.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   TEXT        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,     -- SHA-256(opaque token)
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,                     -- set on rotation / logout
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_player ON refresh_tokens (player_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);
