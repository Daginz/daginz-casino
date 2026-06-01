import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const panel = style({
  background: `linear-gradient(180deg, ${vars.color.surface}, ${vars.color.surface3})`,
  border: `1px solid ${vars.color.line}`,
  borderRadius: 16,
  padding: 18,
});

export const head = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 14,
  gap: 10,
});

export const title = style({
  margin: 0,
  fontFamily: vars.font.display,
  fontWeight: vars.font.displayWeight,
  fontSize: 20,
  color: vars.color.text,
  letterSpacing: '0.01em',
});

export const sub = style({
  margin: '3px 0 0',
  fontFamily: vars.font.ui,
  fontSize: 11.5,
  color: vars.color.textFaint,
});

export const stat = style({
  padding: '11px 13px',
  borderRadius: 10,
  background: vars.color.surface3,
  border: `1px solid ${vars.color.lineSoft}`,
});

export const statLabel = style({
  fontFamily: vars.font.ui,
  fontSize: 10.5,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const statValue = style({
  fontFamily: vars.font.num,
  fontSize: 19,
  fontWeight: 700,
  color: vars.color.text,
});

export const label = style({
  fontFamily: vars.font.ui,
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
  marginBottom: 6,
});

export const input = style({
  width: '100%',
  padding: '11px 56px 11px 13px',
  borderRadius: 10,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface3,
  color: vars.color.text,
  fontFamily: vars.font.num,
  fontSize: 15,
  fontWeight: 600,
  outline: 'none',
  ':focus': { borderColor: vars.color.action },
});
