/**
 * Global reset + base layout. Body colors reference theme `vars`, so the page
 * background follows the active theme. The themed wrapper (with a theme class)
 * is mounted high in the tree so these vars resolve.
 */
import { globalStyle } from '@vanilla-extract/css';
import { vars } from './theme.css';

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
});

globalStyle('html, body', {
  margin: 0,
  padding: 0,
});

globalStyle('body', {
  background: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.ui,
  minHeight: '100vh',
  WebkitFontSmoothing: 'antialiased',
});

/** The radial "felt" glow behind the whole app, themed via feltA/feltB. */
globalStyle('body::before', {
  content: '""',
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  background: `radial-gradient(120% 100% at 50% -10%, ${vars.color.feltA}, ${vars.color.feltB} 60%), linear-gradient(180deg, ${vars.color.bg}, ${vars.color.bg2})`,
  pointerEvents: 'none',
});

globalStyle('a', {
  color: 'inherit',
});

/**
 * Respect reduced-motion: kill long/looping decorative animations (coin shower,
 * marquee bulbs, reel blur, CTA pulse) and collapse transitions. The reels still
 * land on the correct window because the WAAPI animation has fill:forwards and a
 * deterministic landing effect — only the motion is removed, not the result.
 */
globalStyle('*', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animationDuration: '0.001ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.001ms !important',
    },
  },
});
