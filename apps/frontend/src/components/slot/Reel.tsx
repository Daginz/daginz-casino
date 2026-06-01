'use client';

import { useEffect, useRef, useState } from 'react';
import { SYMBOLS, type SlotSymbol } from '@/lib/slot';
import { SymbolBead } from './SymbolBead';
import * as s from './cabinet.css';

const { REEL_TILE } = s;

function randomSymbol(): SlotSymbol {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? 'CHERRY';
}

function randomStrip(n: number): SlotSymbol[] {
  return Array.from({ length: n }, randomSymbol);
}

interface ReelProps {
  /** Final 3-symbol window for this reel: [top, centre, bottom]. */
  window: [SlotSymbol, SlotSymbol, SlotSymbol];
  /** Bumped on each spin (0 = idle). Starts the free-spin immediately. */
  spinId: number;
  /** True once the backend result is known → decelerate to the final window. */
  landed: boolean;
  duration: number;
  blur: number;
  glow?: boolean;
}

/**
 * One reel column. Two-stage motion that mirrors a real slot:
 *  1. On spinId change → spin freely (looping translate over a random strip),
 *     starting INSTANTLY on click — no waiting for the network.
 *  2. When `landed` flips true (backend result arrived) → swap in a strip that
 *     ends on the real window and decelerate to a stop on it.
 * The displayed stop is therefore always exactly the backend's grid.
 */
export function Reel({ window: win, spinId, landed, duration, blur, glow }: ReelProps) {
  const [seq, setSeq] = useState<SlotSymbol[]>(win);
  const [offset, setOffset] = useState(0);
  const [moving, setMoving] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<Animation | null>(null);
  const stopRef = useRef<Animation | null>(null);

  const cancel = (r: React.MutableRefObject<Animation | null>) => {
    if (r.current) {
      try {
        r.current.cancel();
      } catch {
        /* noop */
      }
      r.current = null;
    }
  };

  // Stage 1 — start free-spinning the instant spinId changes.
  useEffect(() => {
    if (!spinId) {
      setSeq(win);
      setOffset(0);
      return;
    }
    cancel(stopRef);
    cancel(loopRef);
    // A long loop strip; we translate by one full strip and repeat.
    const loop = randomStrip(12);
    setSeq([...loop, loop[0]!]); // +1 so the wrap is seamless
    setOffset(0);
    setMoving(true);
    const raf = requestAnimationFrame(() => {
      const el = innerRef.current;
      if (!el) return;
      const dist = loop.length * REEL_TILE;
      const anim = el.animate(
        [{ transform: 'translateY(0px)' }, { transform: `translateY(-${dist}px)` }],
        { duration: 380, easing: 'linear', iterations: Infinity },
      );
      loopRef.current = anim;
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  // Stage 2 — result arrived: decelerate onto the real window.
  useEffect(() => {
    if (!landed || !spinId) return;
    const el = innerRef.current;
    if (!el) {
      setSeq(win);
      setOffset(0);
      setMoving(false);
      return;
    }
    // Read where the looping strip currently sits, then build a fresh strip
    // that ends on [win] and glide from the current visual position to it.
    cancel(loopRef);
    const filler = randomStrip(14);
    const full = [...filler, win[0], win[1], win[2]];
    const dist = (full.length - 3) * REEL_TILE;
    setSeq(full);
    setOffset(0);
    setMoving(true);
    const raf = requestAnimationFrame(() => {
      const node = innerRef.current;
      if (!node) return;
      const anim = node.animate(
        [{ transform: 'translateY(0px)' }, { transform: `translateY(-${dist}px)` }],
        { duration, easing: 'cubic-bezier(.12,.72,.16,1)', fill: 'forwards' },
      );
      stopRef.current = anim;
      anim.onfinish = () => {
        node.style.transform = `translateY(-${dist}px)`;
        setOffset(-dist);
        setMoving(false);
        cancel(stopRef);
      };
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landed]);

  return (
    <div className={s.reel}>
      <div
        ref={innerRef}
        className={s.reelInner}
        style={{
          transform: `translateY(${offset}px)`,
          filter: moving ? `blur(${blur * 0.5}px)` : 'none',
        }}
      >
        {seq.map((k, i) => {
          const isCentre = i === seq.length - 2;
          return (
            <div key={i} className={`${s.tile}${glow && isCentre && !moving ? ` ${s.tilePop}` : ''}`}>
              <SymbolBead k={k} />
            </div>
          );
        })}
      </div>
      <div className={s.sheen} />
    </div>
  );
}
