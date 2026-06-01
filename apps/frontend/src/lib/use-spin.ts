'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type RoundResult } from './api';
import { GAME_ID, PAYLINES, ROWS, type SlotSymbol } from './slot';
import { ANIM, type AnimKey } from '@/styles/theme.css';
import { Sound } from './sound';
import { Toast } from '@/components/ui/toast';
import type { CabinetResult, SpinPhase } from '@/components/slot/SlotCabinet';

type Window3 = [SlotSymbol, SlotSymbol, SlotSymbol];

const IDLE_GRID: SlotSymbol[][] = [
  ['CHERRY', 'LEMON', 'BELL'],
  ['STAR', 'SEVEN', 'CHERRY'],
  ['LEMON', 'BELL', 'STAR'],
];

function gridToWindows(grid: SlotSymbol[][]): Window3[] {
  return [0, 1, 2].map((col) => {
    const c = grid[col] ?? [];
    return [c[0] ?? 'CHERRY', c[1] ?? 'CHERRY', c[2] ?? 'CHERRY'] as Window3;
  });
}

/**
 * Detect a "near miss": two of a payline's three centre-eligible cells match
 * but the line didn't pay — the suspense hook that makes the 3rd reel hang.
 * We approximate by checking the middle row for 2-of-3 identical with no win.
 */
function detectNearMiss(grid: SlotSymbol[][], won: boolean): boolean {
  if (won) return false;
  for (const line of PAYLINES) {
    const cells = line.map((row, col) => grid[col]?.[row]);
    const counts = new Map<string, number>();
    for (const c of cells) if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    if ([...counts.values()].some((n) => n === 2)) return true;
  }
  return false;
}

export interface SpinState {
  phase: SpinPhase;
  spinId: number;
  windows: Window3[];
  result: CabinetResult | null;
  glowKey: number;
  nearMiss: boolean;
  anticip: boolean;
  /** Displayed payout, animated up from 0 on a win. */
  displayPayout: number;
  lastRound: RoundResult | null;
  busy: boolean;
}

export function useSpin(anim: AnimKey, onBalanceChange: () => void) {
  const preset = ANIM[anim];
  const qc = useQueryClient();
  const [state, setState] = useState<SpinState>({
    phase: 'idle',
    spinId: 0,
    windows: gridToWindows(IDLE_GRID),
    result: null,
    glowKey: 0,
    nearMiss: false,
    anticip: false,
    displayPayout: 0,
    lastRound: null,
    busy: false,
  });
  const countRef = useRef<number | null>(null);

  const countUp = useCallback((to: number) => {
    if (countRef.current) cancelAnimationFrame(countRef.current);
    const start = performance.now();
    const dur = preset.countup;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - p) ** 3;
      setState((s) => ({ ...s, displayPayout: Math.round(to * eased) }));
      if (p < 1) countRef.current = requestAnimationFrame(tick);
    };
    countRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.countup]);

  const spin = useCallback(
    async (stake: number) => {
      if (state.busy) return;
      Sound.unlock();
      // Start the reels spinning INSTANTLY on click (bump spinId now) — the
      // motion is indeterminate filler, so there's no stale-window race; the
      // real window is only applied when the result arrives and the reels
      // decelerate onto it. Mark the start time to enforce a minimum spin
      // duration even if the backend answers in a few ms.
      const startedAt = performance.now();
      setState((s) => ({
        ...s,
        busy: true,
        phase: 'spinning',
        spinId: s.spinId + 3, // +i per reel in the cabinet
        result: null,
        nearMiss: false,
        anticip: false,
        displayPayout: 0,
      }));
      Sound.spin();

      let round: RoundResult;
      try {
        round = await api.post<RoundResult>('/game/play', {
          gameId: GAME_ID,
          stake: String(Math.trunc(stake)),
          params: {},
        });
      } catch (e) {
        setState((s) => ({ ...s, busy: false, phase: 'idle' }));
        Toast.err(e instanceof ApiError ? e.message : 'Spin failed');
        return;
      }

      const grid = round.detail.grid as SlotSymbol[][];
      const windows = gridToWindows(grid);
      const won = Number(round.payout) > 0;
      const winLines = round.detail.wins.map((w) => w.line);
      const winKey = (round.detail.wins[0]?.symbol as SlotSymbol | undefined) ?? null;
      const near = detectNearMiss(grid, won);

      // Keep the reels visibly spinning for at least minSpin, then reveal: set
      // the real windows + flip to 'result' (which flags reels as landed →
      // they decelerate onto the correct window).
      const minSpin = Math.max(0, preset.spin - (performance.now() - startedAt));
      window.setTimeout(() => {
        const result: CabinetResult = { grid, winLines, winKey, win: won };
        setState((s) => ({
          ...s,
          windows,
          anticip: won || near,
          phase: 'result',
          result,
          nearMiss: near,
          glowKey: won ? s.glowKey + 1 : s.glowKey,
          lastRound: round,
          busy: false,
        }));
        if (won) {
          const big = winKey ? ['SEVEN', 'WILD'].includes(winKey) : false;
          Sound.win(big);
          countUp(Number(round.payout));
        } else if (near) {
          Sound.nearMiss();
        }
        onBalanceChange();
        void qc.invalidateQueries({ queryKey: ['history'] });
      }, minSpin);
    },
    [state.busy, preset, countUp, onBalanceChange, qc],
  );

  return { ...state, rows: ROWS, spin };
}
