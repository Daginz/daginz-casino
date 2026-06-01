'use client';

import { Panel } from '@/components/ui/Panel';
import { SymbolBead } from '@/components/slot/SymbolBead';
import { PAYTABLE, SYMBOLS, SYMBOL_META, computeRTP } from '@/lib/slot';
import { fmt } from '@/lib/format';
import { vars } from '@/styles/theme.css';

/**
 * Paytable for the 3x3 / 5-line game. Multipliers come from the backend's
 * calibrated PAYTABLE; the headline RTP is the locally computed approximation
 * (the authoritative figure is the backend's 96.04% calibration).
 */
export function Paytable() {
  const { rtp, edge } = computeRTP();
  return (
    <Panel
      title="Paytable"
      sub="Three on a line. Multiplier × line bet."
      right={
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: vars.font.num, fontSize: 18, fontWeight: 700, color: vars.color.goldSoft }}>
            {(rtp * 100).toFixed(2)}%
          </div>
          <div style={{ fontFamily: vars.font.ui, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: vars.color.textFaint }}>
            RTP · {(edge * 100).toFixed(2)}% edge
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SYMBOLS.map((sym) => (
          <div
            key={sym}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 9,
              background: vars.color.surface3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', gap: 4, width: 70, justifyContent: 'center', flexShrink: 0 }}>
                {[0, 1, 2].map((i) => (
                  <SymbolBead key={i} k={sym} size={18} />
                ))}
              </span>
              <span style={{ fontFamily: vars.font.ui, fontSize: 13, color: vars.color.textDim }}>{SYMBOL_META[sym].label}</span>
            </div>
            <span style={{ fontFamily: vars.font.num, fontSize: 15, fontWeight: 700, color: vars.color.text }}>×{fmt(PAYTABLE[sym])}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
