-- Player bonus profile: a per-player inventory of promo rewards, kept SEPARATE
-- from the (real) ledger balance. Free spins are a counter; daily rewards are
-- gated by a 24h cooldown via daily_last_claim_at. The game engine stays
-- stateless — at spin time the bet SOURCE may be a free spin instead of the
-- ledger, but a win is always credited to the real ledger.

CREATE TABLE IF NOT EXISTS player_bonuses (
    player_id           TEXT        PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    free_spins          INT         NOT NULL DEFAULT 0 CHECK (free_spins >= 0),
    daily_last_claim_at TIMESTAMPTZ,                    -- NULL = never claimed
    daily_streak        INT         NOT NULL DEFAULT 0, -- consecutive daily claims
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
