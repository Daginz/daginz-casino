import { recipe } from '@vanilla-extract/recipes';
import { vars } from '@/styles/theme.css';

/**
 * Button recipe ported from the design's Btn (components.jsx): variants
 * gold/ghost/quiet/danger × sizes sm/md/lg, plus full-width and busy states.
 */
export const btn = recipe({
  base: {
    fontFamily: vars.font.ui,
    fontWeight: 600,
    letterSpacing: '0.02em',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'transform .12s, filter .18s, background .18s',
    selectors: {
      '&:active:not(:disabled)': { transform: 'translateY(1px)' },
      '&:hover:not(:disabled)': { filter: 'brightness(1.06)' },
      '&:disabled': { opacity: 0.45, cursor: 'not-allowed' },
    },
  },
  variants: {
    variant: {
      gold: {
        background: `linear-gradient(180deg, ${vars.color.actionSoft}, ${vars.color.action} 55%, ${vars.color.actionDeep})`,
        color: vars.color.actionInk,
        border: `1px solid ${vars.color.actionDeep}`,
        boxShadow: `0 8px 22px -10px ${vars.color.glow}, inset 0 1px 0 rgba(255,255,255,.45)`,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: 700,
      },
      ghost: {
        background: vars.color.surface2,
        color: vars.color.text,
        border: `1px solid ${vars.color.line}`,
      },
      quiet: {
        background: 'transparent',
        color: vars.color.textDim,
        border: `1px solid ${vars.color.lineSoft}`,
      },
      danger: {
        background: 'transparent',
        color: vars.color.loss,
        border: `1px solid color-mix(in oklab, ${vars.color.loss} 40%, transparent)`,
      },
    },
    size: {
      sm: { padding: '8px 12px', fontSize: 12.5 },
      md: { padding: '11px 18px', fontSize: 14 },
      lg: { padding: '16px 26px', fontSize: 16 },
    },
    full: {
      true: { width: '100%' },
      false: { width: 'auto' },
    },
  },
  defaultVariants: {
    variant: 'ghost',
    size: 'md',
    full: false,
  },
});
