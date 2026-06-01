'use client';

import { fmt } from '@/lib/format';
import { spinner } from '@/styles/animations.css';
import * as s from './betbar.css';

const PRESETS = [50, 100, 250, 500];
const MIN_BET = 5;
const STEP = 5;

interface BetBarProps {
  stake: number;
  setStake: (n: number) => void;
  maxBet: number;
  onSpin: () => void;
  busy: boolean;
  ready: boolean;
  displayPayout: number;
  showPayout: boolean;
}

export function BetBar({ stake, setStake, maxBet, onSpin, busy, ready, displayPayout, showPayout }: BetBarProps) {
  const clamp = (n: number) => Math.max(MIN_BET, Math.min(maxBet || Infinity, n));
  const canSpin = ready && !busy && stake >= MIN_BET && stake <= (maxBet || Infinity);

  return (
    <div className={s.bar}>
      <div className={s.group}>
        <button className={s.stepBtn} disabled={busy || stake <= MIN_BET} onClick={() => setStake(clamp(stake - STEP))} aria-label="Decrease bet">
          −
        </button>
        <div className={s.stakeBox}>
          <div className={s.stakeLabel}>Bet</div>
          <div className={s.stakeValue}>{fmt(stake)}</div>
        </div>
        <button className={s.stepBtn} disabled={busy || stake >= maxBet} onClick={() => setStake(clamp(stake + STEP))} aria-label="Increase bet">
          +
        </button>
      </div>

      <div className={s.group}>
        {PRESETS.map((p) => (
          <button key={p} className={s.preset} data-active={stake === p} disabled={busy || p > maxBet} onClick={() => setStake(clamp(p))}>
            {p}
          </button>
        ))}
        <button className={s.preset} disabled={busy || !maxBet} onClick={() => setStake(clamp(maxBet))}>
          MAX
        </button>
      </div>

      <button className={s.spinCta} disabled={!canSpin} onClick={onSpin}>
        {busy ? <span className={spinner} /> : 'Spin'}
      </button>

      {showPayout && <span className={s.payoutTag}>+{fmt(displayPayout)} CHIP</span>}
    </div>
  );
}
