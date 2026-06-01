import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const page = style({
  maxWidth: 1240,
  margin: '0 auto',
  padding: '0 20px 60px',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '18px 0',
  flexWrap: 'wrap',
});

export const brand = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

export const logo = style({
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 26,
  letterSpacing: '0.04em',
  color: vars.color.text,
  margin: 0,
});

export const logoDot = style({
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: `radial-gradient(circle at 35% 30%, ${vars.color.actionSoft}, ${vars.color.action} 70%)`,
  boxShadow: `0 0 12px ${vars.color.glow}`,
});

export const headerRight = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
});

export const hero = style({
  textAlign: 'center',
  padding: '20px 0 28px',
});

export const heroTitle = style({
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 44,
  margin: 0,
  color: vars.color.text,
  lineHeight: 1.05,
});

export const heroSub = style({
  fontFamily: vars.font.ui,
  fontSize: 15,
  color: vars.color.textDim,
  marginTop: 10,
});

/** Two-column game layout: game left, side rail right (design's 372px rail). */
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 372px',
  gap: 22,
  alignItems: 'start',
  '@media': {
    '(max-width: 980px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const rail = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});

export const footer = style({
  textAlign: 'center',
  padding: '40px 0 0',
  fontFamily: vars.font.ui,
  fontSize: 12,
  color: vars.color.textFaint,
  lineHeight: 1.6,
});

export const gate = style({
  textAlign: 'center',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
});
