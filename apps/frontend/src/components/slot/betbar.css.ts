import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';
import { cta } from '@/styles/animations.css';

export const bar = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 16,
  background: `linear-gradient(180deg, ${vars.color.surface}, ${vars.color.surface3})`,
  border: `1px solid ${vars.color.line}`,
});

export const group = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});

export const stepBtn = style({
  width: 34,
  height: 34,
  borderRadius: 9,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  color: vars.color.text,
  fontSize: 18,
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  ':disabled': { opacity: 0.4, cursor: 'not-allowed' },
});

export const stakeBox = style({
  minWidth: 96,
  textAlign: 'center',
  padding: '8px 12px',
  borderRadius: 10,
  background: vars.color.surface3,
  border: `1px solid ${vars.color.lineSoft}`,
});

export const stakeLabel = style({
  fontFamily: vars.font.ui,
  fontSize: 9.5,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: vars.color.textFaint,
});

export const stakeValue = style({
  fontFamily: vars.font.num,
  fontSize: 20,
  fontWeight: 700,
  color: vars.color.text,
});

export const preset = style({
  padding: '7px 12px',
  borderRadius: 8,
  border: `1px solid ${vars.color.lineSoft}`,
  background: 'transparent',
  color: vars.color.textDim,
  fontFamily: vars.font.num,
  fontSize: 13,
  cursor: 'pointer',
  selectors: {
    '&[data-active="true"]': {
      borderColor: vars.color.action,
      color: vars.color.text,
    },
  },
});

export const spinCta = style({
  padding: '16px 40px',
  borderRadius: 12,
  border: `1px solid ${vars.color.actionDeep}`,
  background: `linear-gradient(180deg, ${vars.color.actionSoft}, ${vars.color.action} 55%, ${vars.color.actionDeep})`,
  color: vars.color.actionInk,
  fontFamily: vars.font.display,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  boxShadow: `0 8px 22px -10px ${vars.color.glow}, inset 0 1px 0 rgba(255,255,255,.45)`,
  selectors: {
    '&:not(:disabled)': { animation: `${cta} 2.4s ease-in-out infinite` },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed', animation: 'none' },
  },
});

export const payoutTag = style({
  fontFamily: vars.font.num,
  fontSize: 15,
  fontWeight: 700,
  color: vars.color.win,
  minWidth: 90,
  textAlign: 'center',
});
