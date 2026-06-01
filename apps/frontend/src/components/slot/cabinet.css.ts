import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { candyPop, electric, nearMiss, neon, pop, orbit } from '@/styles/animations.css';

export const REEL_TILE = 104;

export const wrap = style({
  position: 'relative',
  width: '100%',
  maxWidth: 520,
  margin: '0 auto',
});

/**
 * A glow halo that slowly orbits behind the cabinet — the "circling light"
 * around the machine. A conic gradient of the theme accent, blurred, rotating.
 * Speeds up while spinning (the `spinning` modifier).
 */
export const halo = style({
  position: 'absolute',
  inset: -36,
  zIndex: 0,
  borderRadius: 32,
  pointerEvents: 'none',
  background: `conic-gradient(from 0deg, transparent 0deg, ${vars.color.glow} 60deg, ${vars.color.actionSoft} 110deg, transparent 180deg, ${vars.color.glow} 250deg, ${vars.color.gold} 310deg, transparent 360deg)`,
  filter: 'blur(28px)',
  opacity: 0.45,
  animation: `${orbit} 14s linear infinite`,
});

export const haloSpinning = style({
  opacity: 0.7,
  animationDuration: '5s',
});

export const haloWin = style({
  opacity: 0.9,
  animationDuration: '3s',
});

export const marqueeTag = style({
  textAlign: 'center',
  marginBottom: 14,
});

export const marqueeInner = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  padding: '7px 22px',
  border: `1px solid ${vars.color.line}`,
  borderRadius: 999,
  background: `linear-gradient(180deg, ${vars.color.surface2}, ${vars.color.surface3})`,
});

export const marqueeText = style({
  fontFamily: vars.font.ui,
  letterSpacing: '0.34em',
  fontSize: 11,
  color: vars.color.goldSoft,
  textTransform: 'uppercase',
});

/** The gold cabinet body. */
export const body = style({
  position: 'relative',
  padding: 22,
  borderRadius: 18,
  background: `linear-gradient(180deg, ${vars.color.goldSoft}, ${vars.color.gold} 30%, ${vars.color.goldDeep})`,
  boxShadow: '0 30px 70px -28px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.5)',
});

/** Dark inner well that holds the reels. */
export const well = style({
  position: 'relative',
  padding: '26px 20px',
  borderRadius: 12,
  background: `radial-gradient(120% 120% at 50% 0%, ${vars.color.surface2}, ${vars.color.surface3} 80%)`,
  border: '1px solid rgba(0,0,0,.35)',
  boxShadow: 'inset 0 2px 14px rgba(0,0,0,.5)',
});

export const reelRow = style({
  display: 'flex',
  gap: 14,
  justifyContent: 'center',
  position: 'relative',
});

export const reel = style({
  width: REEL_TILE,
  height: REEL_TILE * 3,
  overflow: 'hidden',
  position: 'relative',
  borderRadius: 8,
  background: `linear-gradient(180deg, color-mix(in oklab, ${vars.color.reelBg} 86%, #fff 8%), ${vars.color.reelBg} 55%, color-mix(in oklab, ${vars.color.reelBg} 88%, #000 12%))`,
  boxShadow: 'inset 0 16px 22px -12px rgba(0,0,0,.7), inset 0 -16px 22px -12px rgba(0,0,0,.7)',
});

export const reelInner = style({
  willChange: 'transform',
});

/** Glass sheen over each reel. */
export const sheen = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  borderRadius: 8,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0) 20%, rgba(255,255,255,0) 82%, rgba(0,0,0,.22))',
});

export const tile = style({
  height: REEL_TILE,
  display: 'grid',
  placeItems: 'center',
});

export const tilePop = style({
  animation: `${candyPop} .35s ease-out`,
});

/** A single payline overlay (one of 5). Horizontal lines are flat; diagonals
 *  are drawn as thin rotated bars. Active win/near-miss states animate. */
export const payline = style({
  position: 'absolute',
  pointerEvents: 'none',
  borderRadius: 8,
  transition: 'opacity .3s, box-shadow .3s, border-color .3s',
});

export const paylineWin = style({
  animation: `${electric} 1s ease-in-out infinite`,
  borderColor: vars.color.action,
});

export const paylineMiss = style({
  animation: `${nearMiss} .9s ease-in-out infinite`,
});

export const statusBanner = style({
  height: 32,
  marginTop: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const bannerWin = style({
  fontFamily: vars.font.display,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: vars.color.actionSoft,
  animation: `${neon} 1.2s ease-in-out infinite, ${pop} .3s ease-out`,
});

export const bannerInfo = style({
  fontFamily: vars.font.ui,
  fontSize: 12,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const bannerSpinning = style([
  bannerInfo,
  {
    color: vars.color.goldSoft,
  },
]);

/** Marquee bulb dot (used by the running-lights rows). */
export const bulbDot = style({
  width: 9,
  height: 9,
  borderRadius: '50%',
  background: vars.color.goldSoft,
  display: 'inline-block',
});

// The bulb glow uses a CSS var so the keyframe (defined globally) can read the
// theme accent; set it on the cabinet root.
globalStyle(`${body}`, {
  vars: {
    '--bulb-glow': vars.color.goldSoft,
  },
});
