'use client';

import { vars } from '@/styles/theme.css';
import { PAYLINES, SYMBOL_META, type SlotSymbol } from '@/lib/slot';
import { Reel } from './Reel';
import { WinFX, MarqueeLights } from './WinFX';
import * as s from './cabinet.css';

const { REEL_TILE } = s;
const REEL_W = REEL_TILE;
const GAP = 14;

export type SpinPhase = 'idle' | 'spinning' | 'result';

export interface CabinetResult {
  /** grid[col][row] symbols (from the backend round detail). */
  grid: SlotSymbol[][];
  /** winning payline indices (0..4) from the backend. */
  winLines: number[];
  /** the dominant winning symbol, for the banner tier. */
  winKey: SlotSymbol | null;
  win: boolean;
}

interface SlotCabinetProps {
  /** Per-reel window [top, centre, bottom]; cols are reels. */
  windows: [SlotSymbol, SlotSymbol, SlotSymbol][];
  spinId: number;
  duration: number;
  stagger: number;
  blur: number;
  phase: SpinPhase;
  result: CabinetResult | null;
  /** Incrementing burst trigger for the win celebration. */
  glowKey: number;
  nearMiss: boolean;
  anticip: boolean;
}

/**
 * Maps a payline index to an absolute overlay covering its 3 cells. Rows 0/1/2
 * are horizontal bands; diagonals (3 ↘, 4 ↗) are thin rotated bars spanning
 * the reel block corner-to-corner.
 */
function PaylineOverlay({ index, active, miss }: { index: number; active: boolean; miss: boolean }) {
  const line = PAYLINES[index];
  if (!line) return null;
  const isHorizontal = line[0] === line[1] && line[1] === line[2];
  const cls = `${s.payline}${active ? ` ${s.paylineWin}` : miss ? ` ${s.paylineMiss}` : ''}`;
  const border = active
    ? `2px solid ${vars.color.action}`
    : miss
      ? `2px solid color-mix(in oklab, ${vars.color.action} 60%, transparent)`
      : `2px solid ${vars.color.line}`;
  const opacity = active || miss ? 1 : 0.18;

  if (isHorizontal) {
    const row = line[0];
    return (
      <div
        className={cls}
        style={{
          left: -6,
          right: -6,
          top: row * REEL_TILE,
          height: REEL_TILE,
          border,
          opacity,
        }}
      />
    );
  }

  // Diagonal: a thin bar from one corner to the opposite, rotated to match.
  const blockW = REEL_W * 3 + GAP * 2;
  const blockH = REEL_TILE * 3;
  const angleDeg = (Math.atan2(line[2] - line[0] === 2 ? blockH - REEL_TILE : -(blockH - REEL_TILE), blockW) * 180) / Math.PI;
  const length = Math.hypot(blockW, blockH - REEL_TILE) + 12;
  return (
    <div
      className={cls}
      style={{
        left: '50%',
        top: '50%',
        width: length,
        height: 6,
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        borderTop: border,
        opacity,
        borderRadius: 4,
      }}
    />
  );
}

export function SlotCabinet({
  windows,
  spinId,
  duration,
  stagger,
  blur,
  phase,
  result,
  glowKey,
  nearMiss,
  anticip,
}: SlotCabinetProps) {
  const win = phase === 'result' && !!result?.win;
  const tier = win && result?.winKey ? SYMBOL_META[result.winKey].tier : null;
  const big = tier === 'jackpot' || tier === 'high';
  const miss = phase === 'result' && !win && nearMiss;

  // The 3rd reel hangs longer on an anticipated near/win (suspense).
  const durFor = (i: number) => duration + i * stagger + (anticip && i === 2 ? Math.round(duration * 0.85) : 0);
  const winLines = win && result ? result.winLines : [];

  return (
    <div className={s.wrap}>
      <div className={s.marqueeTag}>
        <div className={s.marqueeInner}>
          <span className={s.bulbDot} />
          <span className={s.marqueeText}>5 Lines · 3×3 Reels</span>
          <span className={s.bulbDot} />
        </div>
      </div>

      <div
        className={`${s.halo}${phase === 'spinning' ? ` ${s.haloSpinning}` : ''}${win ? ` ${s.haloWin}` : ''}`}
        aria-hidden
      />

      <div className={s.body} style={{ position: 'relative', zIndex: 1 }}>
        <MarqueeLights count={18} />
        <div className={s.well}>
          <div className={s.reelRow}>
            {windows.map((w, i) => (
              <Reel
                key={i}
                window={w}
                spinId={spinId ? spinId + i : 0}
                duration={durFor(i)}
                blur={blur}
                landed={phase === 'result'}
                glow={win && winLines.some((ln) => PAYLINES[ln]?.[i] === 1)}
              />
            ))}

            {/* All 5 paylines; active ones light up. */}
            {PAYLINES.map((_, idx) => (
              <PaylineOverlay key={idx} index={idx} active={winLines.includes(idx)} miss={miss && idx === 1} />
            ))}
          </div>

          <div className={s.statusBanner}>
            {win ? (
              <div
                className={s.bannerWin}
                style={{ fontSize: big ? 24 : 18, letterSpacing: big ? '0.16em' : '0.1em' }}
              >
                {tier === 'jackpot' ? '★ Jackpot ★' : big ? 'Big Win' : 'Winner'}
              </div>
            ) : miss ? (
              <div className={s.bannerInfo} style={{ color: vars.color.actionSoft, opacity: 0.9 }}>
                So close…
              </div>
            ) : phase === 'result' ? (
              <div className={s.bannerInfo}>No line</div>
            ) : phase === 'spinning' ? (
              <div className={s.bannerSpinning}>Drawing…</div>
            ) : (
              <div className={s.bannerInfo}>Place your bet</div>
            )}
          </div>
        </div>
      </div>

      <WinFX burst={glowKey} big={big} />
    </div>
  );
}
