'use client';

import { useQuery } from '@tanstack/react-query';
import { Panel } from '@/components/ui/Panel';
import { api, type RoundResult } from '@/lib/api';
import { fmt } from '@/lib/format';
import { vars } from '@/styles/theme.css';
import { useSession } from '@/app/session-provider';
import { useGame } from '@/app/game-provider';

/**
 * Activity feed — the player's recent rounds from GET /game/history. Refetches
 * after each spin (the spin hook invalidates the ['history'] query).
 */
export function History() {
  const { status } = useSession();
  const { spin } = useGame();
  // Re-key on the last round id so a fresh spin nudges a refetch even if the
  // invalidation race-lost; cheap and keeps the feed snappy.
  const lastId = spin.lastRound?.id ?? 'none';

  const history = useQuery({
    queryKey: ['history', lastId],
    enabled: status === 'connected',
    queryFn: () => api.get<RoundResult[]>('/game/history'),
  });

  const rounds = history.data ?? [];

  return (
    <Panel title="Activity" sub="Newest first">
      {rounds.length === 0 ? (
        <p style={{ fontFamily: vars.font.ui, fontSize: 12.5, color: vars.color.textFaint, margin: 0 }}>
          No spins yet. Place a bet to begin.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 320, overflowY: 'auto' }}>
          {rounds.map((r) => {
            const won = Number(r.payout) > 0;
            return (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 11px',
                  borderRadius: 9,
                  background: vars.color.surface3,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: vars.font.ui, fontSize: 13, color: vars.color.text }}>
                    Bet {fmt(r.stake)}
                    {won ? (
                      <span style={{ color: vars.color.win }}> · +{fmt(r.payout)}</span>
                    ) : (
                      <span style={{ color: vars.color.textFaint }}> · no win</span>
                    )}
                  </div>
                  <div style={{ fontFamily: vars.font.mono, fontSize: 11, color: vars.color.textFaint }}>
                    {new Date(r.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: vars.font.ui,
                    fontSize: 10.5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 99,
                    whiteSpace: 'nowrap',
                    color: won ? vars.color.win : vars.color.textFaint,
                    background: won
                      ? `color-mix(in oklab, ${vars.color.win} 14%, transparent)`
                      : 'transparent',
                  }}
                >
                  {won ? 'win' : 'loss'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
