'use client';

import { SYMBOL_META, type SlotSymbol } from '@/lib/slot';

/**
 * Renders one slot symbol as a glossy "candy bead" (ported from the design's
 * CandyBead) — a radial-gradient disc with the symbol glyph. SEVEN gets a
 * swirl treatment. No image assets; pure CSS so it themes/scales cleanly.
 */
export function SymbolBead({ k, size = 80 }: { k: SlotSymbol; size?: number }) {
  const meta = SYMBOL_META[k];

  if (meta.swirl) {
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${meta.c1} 0 12.5%, #fff 0 25%, ${meta.c2} 0 37.5%, #fff 0 50%, ${meta.c1} 0 62.5%, #fff 0 75%, ${meta.c2} 0 87.5%, #fff 0)`,
            boxShadow: 'inset 0 -6px 14px rgba(0,0,0,.28), 0 5px 12px rgba(0,0,0,.34)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,.75), transparent 44%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: size * 0.38,
            color: '#fff',
            textShadow: '0 2px 3px rgba(0,0,0,.4)',
          }}
        >
          {meta.glyph}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle at 34% 30%, ${meta.c1}, ${meta.c2} 80%)`,
          boxShadow:
            'inset 0 -8px 15px rgba(0,0,0,.30), inset 0 5px 9px rgba(255,255,255,.38), 0 6px 13px rgba(0,0,0,.34)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '20%',
          top: '15%',
          width: '36%',
          height: '27%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.9), transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.36,
          color: 'rgba(255,255,255,.94)',
          textShadow: '0 1px 2px rgba(0,0,0,.38)',
        }}
      >
        {meta.glyph}
      </div>
    </div>
  );
}
