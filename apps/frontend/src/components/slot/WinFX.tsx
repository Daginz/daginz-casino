'use client';

import { useEffect, useState } from 'react';
import { vars } from '@/styles/theme.css';
import { coin, flash, bulb } from '@/styles/animations.css';
import * as s from './cabinet.css';

interface Particle {
  id: string;
  left: number;
  delay: number;
  dur: number;
  size: number;
  drift: number;
  isCoin: boolean;
  rot: number;
}

/** Coin/spark shower + neon flash on a win. `burst` is an incrementing trigger. */
export function WinFX({ burst, big }: { burst: number; big: boolean }) {
  const [parts, setParts] = useState<Particle[]>([]);
  const [flashOn, setFlashOn] = useState(0);

  useEffect(() => {
    if (!burst) return;
    const n = big ? 46 : 22;
    const arr: Particle[] = Array.from({ length: n }, (_, i) => ({
      id: `${burst}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * (big ? 0.5 : 0.3),
      dur: 1.1 + Math.random() * 1.1,
      size: 8 + Math.random() * (big ? 16 : 10),
      drift: (Math.random() - 0.5) * 80,
      isCoin: Math.random() > 0.35,
      rot: Math.random() * 360,
    }));
    setParts(arr);
    setFlashOn(burst);
    const t1 = setTimeout(() => setParts([]), 2600);
    const t2 = setTimeout(() => setFlashOn(0), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [burst, big]);

  return (
    <div style={{ position: 'absolute', inset: -10, pointerEvents: 'none', overflow: 'hidden', zIndex: 6, borderRadius: 24 }}>
      {flashOn > 0 && (
        <div
          key={`f${flashOn}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(closest-side, ${vars.color.glow}, transparent 72%)`,
            animation: `${flash} .7s ease-out`,
          }}
        />
      )}
      {parts.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.isCoin ? '50%' : '2px',
            background: p.isCoin
              ? `radial-gradient(circle at 35% 30%, ${vars.color.actionSoft}, ${vars.color.action} 60%, ${vars.color.actionDeep})`
              : vars.color.actionSoft,
            boxShadow: `0 0 10px ${vars.color.glow}`,
            animation: `${coin} ${p.dur}s cubic-bezier(.3,.2,.5,1) ${p.delay}s forwards`,
            // CSS vars consumed by the coin keyframe.
            ['--drift' as string]: `${p.drift}px`,
            ['--rot' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** Running bulbs along the top & bottom of the cabinet frame. */
export function MarqueeLights({ count = 18 }: { count?: number }) {
  const bulbs = Array.from({ length: count });
  const Row = ({ pos }: { pos: 'top' | 'bottom' }) => (
    <div
      style={{
        position: 'absolute',
        [pos]: 7,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      {bulbs.map((_, i) => (
        <span
          key={i}
          className={s.bulbDot}
          style={{ animation: `${bulb} 1.4s ease-in-out infinite`, animationDelay: `${(i / count) * 1.4}s` }}
        />
      ))}
    </div>
  );
  return (
    <>
      <Row pos="top" />
      <Row pos="bottom" />
    </>
  );
}
