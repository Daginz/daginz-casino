import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const wrap = style({
  maxWidth: 1240,
  margin: '0 auto',
  padding: '0 20px 80px',
});

export const hero = style({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  marginTop: 8,
});

export const heroTrack = style({
  display: 'flex',
  transition: 'transform .6s cubic-bezier(.16,1,.3,1)',
});

export const heroSlide = style({
  position: 'relative',
  flex: '0 0 100%',
  minHeight: 220,
  padding: '40px 36px',
  display: 'flex',
  alignItems: 'center',
});

export const heroGlyph = style({
  position: 'absolute',
  right: 24,
  top: '50%',
  transform: 'translateY(-50%)',
  fontFamily: vars.font.display,
  fontWeight: 800,
  fontSize: 180,
  color: 'rgba(255,255,255,.16)',
  lineHeight: 1,
  pointerEvents: 'none',
});

export const heroKicker = style({
  fontFamily: vars.font.ui,
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,.8)',
});

export const heroTitle = style({
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 38,
  color: '#fff',
  margin: '8px 0 6px',
  maxWidth: 560,
});

export const heroSub = style({
  fontFamily: vars.font.ui,
  fontSize: 15,
  color: 'rgba(255,255,255,.85)',
  maxWidth: 460,
  margin: 0,
});

export const heroCta = style({
  display: 'inline-block',
  marginTop: 16,
  padding: '11px 20px',
  borderRadius: 10,
  background: 'rgba(0,0,0,.35)',
  border: '1px solid rgba(255,255,255,.35)',
  color: '#fff',
  fontFamily: vars.font.ui,
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
});

export const heroDots = style({
  position: 'absolute',
  bottom: 14,
  left: 36,
  display: 'flex',
  gap: 8,
});

export const heroDot = style({
  width: 8,
  height: 8,
  borderRadius: 99,
  border: 'none',
  background: 'rgba(255,255,255,.4)',
  cursor: 'pointer',
  selectors: { '&[data-on="true"]': { background: '#fff', width: 22 } },
});

export const subbar = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  margin: '26px 0 8px',
});

export const searchbar = style({
  position: 'relative',
  flex: '1 1 240px',
  maxWidth: 360,
});

export const searchInput = style({
  width: '100%',
  padding: '11px 38px 11px 38px',
  borderRadius: 10,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  color: vars.color.text,
  fontFamily: vars.font.ui,
  fontSize: 14,
  outline: 'none',
  ':focus': { borderColor: vars.color.action },
});

export const searchIc = style({
  position: 'absolute',
  left: 13,
  top: '50%',
  transform: 'translateY(-50%)',
  color: vars.color.textFaint,
  pointerEvents: 'none',
});

export const chips = style({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  color: vars.color.textDim,
  fontFamily: vars.font.ui,
  fontSize: 13,
  cursor: 'pointer',
  selectors: {
    '&[data-on="true"]': { borderColor: vars.color.action, color: vars.color.text, background: vars.color.surface },
  },
});

export const rail = style({ marginTop: 28 });

export const railHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
});

export const railTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 20,
  color: vars.color.text,
  margin: 0,
});

export const railTrack = style({
  display: 'flex',
  gap: 14,
  overflowX: 'auto',
  // Room so the last card isn't flush against the edge / cut off, and a little
  // top/bottom so hover-lift isn't clipped.
  padding: '4px 4px 12px',
  scrollSnapType: 'x proximity',
  // Hide the scrollbar but keep scrolling (wheel/trackpad/arrows still work).
  scrollbarWidth: 'none',
  selectors: {
    '&::-webkit-scrollbar': { display: 'none' },
  },
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 14,
  marginTop: 12,
});

/* ---- game card ---- */
export const card = style({
  position: 'relative',
  flex: '0 0 168px',
  width: 168,
  aspectRatio: '3 / 4',
  borderRadius: 14,
  overflow: 'hidden',
  border: `1px solid ${vars.color.line}`,
  textDecoration: 'none',
  transition: 'transform .16s, box-shadow .16s',
  cursor: 'pointer',
  scrollSnapAlign: 'start',
  selectors: {
    '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 16px 36px -16px ${vars.color.glow}` },
  },
});

export const cardGrid = style([card, { width: 'auto', flex: 'initial' }]);

export const cardSoon = style({
  cursor: 'not-allowed',
  opacity: 0.7,
});

export const cardBadges = style({
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'flex',
  gap: 5,
  zIndex: 2,
});

export const badge = style({
  fontFamily: vars.font.ui,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '3px 7px',
  borderRadius: 6,
  boxShadow: '0 2px 8px rgba(0,0,0,.3)',
});

export const soonTag = style({
  fontFamily: vars.font.ui,
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '3px 7px',
  borderRadius: 6,
  background: 'rgba(0,0,0,.5)',
  color: 'rgba(255,255,255,.8)',
});

export const cardTitle = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  padding: '14px 12px 10px',
  zIndex: 2,
});

export const cardName = style({
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 16,
  color: '#fff',
  textShadow: '0 2px 6px rgba(0,0,0,.6)',
});

export const cardProv = style({
  fontFamily: vars.font.ui,
  fontSize: 10.5,
  color: 'rgba(255,255,255,.7)',
});

export const playFab = style({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  opacity: 0,
  transition: 'opacity .16s',
  zIndex: 2,
  selectors: {
    [`${card}:hover &`]: { opacity: 1 },
  },
});
