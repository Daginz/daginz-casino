import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/theme.css';

export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '6px 12px',
  borderRadius: 999,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  fontFamily: vars.font.ui,
  fontSize: 12.5,
});

export const dot = style({
  width: 8,
  height: 8,
  borderRadius: 99,
});

export const pill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px 6px 8px',
  borderRadius: 999,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface2,
  fontFamily: vars.font.ui,
  fontSize: 13,
  color: vars.color.text,
  cursor: 'pointer',
});

export const avatar = style({
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${vars.color.gold}, ${vars.color.action})`,
});

export const option = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: `1px solid ${vars.color.line}`,
  background: vars.color.surface3,
  color: vars.color.text,
  fontFamily: vars.font.ui,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color .15s, background .15s',
  selectors: {
    '&:hover:not(:disabled)': { borderColor: vars.color.action },
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
});

export const optionIcon = style({
  width: 34,
  height: 34,
  borderRadius: 9,
  display: 'grid',
  placeItems: 'center',
  fontSize: 20,
  flexShrink: 0,
  background: vars.color.surface,
});

export const optionSub = style({
  fontFamily: vars.font.ui,
  fontSize: 12,
  fontWeight: 400,
  color: vars.color.textFaint,
  marginTop: 2,
});

export const errorText = style({
  margin: '12px 2px 0',
  fontFamily: vars.font.ui,
  fontSize: 12.5,
  color: vars.color.loss,
});
