import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { pop } from '@/styles/animations.css';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'rgba(2,8,5,.66)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
});

export const panel = style({
  width: '100%',
  background: `linear-gradient(180deg, ${vars.color.surface2}, ${vars.color.surface})`,
  border: `1px solid ${vars.color.line}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 40px 90px -30px rgba(0,0,0,.85)',
  animation: `${pop} .18s ease-out`,
});

export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 18,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 24,
  color: vars.color.text,
});

export const close = style({
  background: 'none',
  border: 'none',
  color: vars.color.textFaint,
  fontSize: 22,
  cursor: 'pointer',
  lineHeight: 1,
  ':hover': { color: vars.color.text },
});
