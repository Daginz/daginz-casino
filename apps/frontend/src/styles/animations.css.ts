/**
 * The "juice" keyframes ported from the design (Sugar Pop.html <style> block):
 * spinner, pop-in, toast slide, marquee bulb, payline electric/near-miss,
 * neon flicker, CTA pulse, coin shower, win flash, candy pop. Exposed as VE
 * keyframe names so components reference them type-safely.
 */
import { keyframes, style } from '@vanilla-extract/css';
import { vars } from './theme.css';

export const spin = keyframes({
  to: { transform: 'rotate(360deg)' },
});

export const pop = keyframes({
  from: { transform: 'scale(.85)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
});

export const toastIn = keyframes({
  from: { transform: 'translateX(20px)', opacity: 0 },
  to: { transform: 'translateX(0)', opacity: 1 },
});

export const blink = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.35 },
});

export const bulb = keyframes({
  '0%, 100%': { opacity: 0.35, boxShadow: '0 0 2px var(--bulb-glow, #fff)' },
  '50%': { opacity: 1, boxShadow: '0 0 10px 2px var(--bulb-glow, #fff)' },
});

export const electric = keyframes({
  '0%, 100%': { boxShadow: `0 0 6px ${vars.color.action}, inset 0 0 6px ${vars.color.action}` },
  '50%': { boxShadow: `0 0 18px ${vars.color.actionSoft}, inset 0 0 12px ${vars.color.actionSoft}` },
});

export const nearMiss = keyframes({
  '0%, 100%': { opacity: 0.5 },
  '50%': { opacity: 1 },
});

export const neon = keyframes({
  '0%, 100%': { textShadow: `0 0 6px ${vars.color.actionSoft}, 0 0 14px ${vars.color.action}` },
  '50%': { textShadow: `0 0 10px ${vars.color.actionSoft}, 0 0 26px ${vars.color.action}` },
});

export const cta = keyframes({
  '0%, 100%': { transform: 'translateY(0)', boxShadow: `0 8px 22px -10px ${vars.color.glow}` },
  '50%': { transform: 'translateY(-1px)', boxShadow: `0 12px 30px -10px ${vars.color.glow}` },
});

export const coin = keyframes({
  '0%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
  '100%': {
    transform: 'translateY(360px) translateX(var(--drift, 0px)) rotate(var(--rot, 180deg))',
    opacity: 0,
  },
});

export const flash = keyframes({
  '0%': { opacity: 0 },
  '30%': { opacity: 0.9 },
  '100%': { opacity: 0 },
});

export const candyPop = keyframes({
  '0%': { transform: 'scale(.9)' },
  '60%': { transform: 'scale(1.06)' },
  '100%': { transform: 'scale(1)' },
});

/** Slow orbit of a glow halo around the cabinet (the "circling" light). */
export const orbit = keyframes({
  to: { transform: 'rotate(360deg)' },
});

/** Reusable spinner atom (used by buttons in busy state). */
export const spinner = style({
  display: 'inline-block',
  width: 13,
  height: 13,
  border: '2px solid currentColor',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 0.7s linear infinite`,
});
