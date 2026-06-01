/**
 * Lobby catalogue (ported from the design's lobby.jsx). Most games are
 * placeholders (status:'soon'); only the slot we built is live and routes to
 * /play. Lucky Sevens in the design pointed at Daginz.html — we don't have that
 * variant, so it's marked 'soon' here (our live game is Sugar Pop = /play).
 */
export type GameCat = 'Slots' | 'Instant' | 'Table' | 'Live';
export type GameStatus = 'live' | 'soon';

export interface GameItem {
  id: string;
  name: string;
  cat: GameCat;
  glyph: string;
  edge: string;
  status: GameStatus;
  provider: string;
  href?: string;
  hot?: boolean;
  isNew?: boolean;
  c1: string;
  c2: string;
}

const g = (o: Partial<GameItem> & Pick<GameItem, 'id' | 'name' | 'cat' | 'glyph' | 'edge' | 'c1' | 'c2'>): GameItem => ({
  provider: 'Daginz Originals',
  status: 'soon',
  ...o,
});

export const GAMES: GameItem[] = [
  g({ id: 'sugar', name: 'Sugar Pop', cat: 'Slots', glyph: '❦', edge: '4.0%', status: 'live', href: '/play', hot: true, isNew: true, c1: '#ff7ab8', c2: '#7a3fd0' }),
  g({ id: 'sevens', name: 'Lucky Sevens', cat: 'Slots', glyph: '7', edge: '4.5%', hot: true, c1: '#ff5a3c', c2: '#7a0f1a' }),
  g({ id: 'neonreels', name: 'Neon Reels', cat: 'Slots', glyph: '▦', edge: '4.2%', isNew: true, c1: '#22d3ee', c2: '#075985' }),
  g({ id: 'goldrush', name: 'Gold Rush', cat: 'Slots', glyph: '◆', edge: '4.5%', c1: '#f7b733', c2: '#7a4a00' }),
  g({ id: 'cryptospin', name: 'Crypto Spin', cat: 'Slots', glyph: 'Ξ', edge: '4.0%', c1: '#8b5cf6', c2: '#2a1a6a' }),
  g({ id: 'fortune88', name: 'Fortune 88', cat: 'Slots', glyph: '8', edge: '4.6%', hot: true, c1: '#fb2e63', c2: '#5a0a2a' }),
  g({ id: 'coinflip', name: 'Coinflip', cat: 'Instant', glyph: 'Ð', edge: '2.0%', c1: '#f7c948', c2: '#8a5a00' }),
  g({ id: 'dice', name: 'Dice', cat: 'Instant', glyph: '⚄', edge: '1.0%', c1: '#22c386', c2: '#054d33' }),
  g({ id: 'crash', name: 'Crash', cat: 'Instant', glyph: '↗', edge: '1.0%', hot: true, c1: '#ff5ea0', c2: '#5a1060' }),
  g({ id: 'mines', name: 'Mines', cat: 'Instant', glyph: '✦', edge: '1.0%', c1: '#3b82f6', c2: '#0b2a6a' }),
  g({ id: 'plinko', name: 'Plinko', cat: 'Instant', glyph: '▼', edge: '1.5%', c1: '#a855f7', c2: '#3a1a7a' }),
  g({ id: 'wheel', name: 'Lightning Wheel', cat: 'Instant', glyph: '◉', edge: '3.0%', isNew: true, c1: '#ec4bd0', c2: '#3a1a8a' }),
  g({ id: 'hilo', name: 'Hi-Lo', cat: 'Instant', glyph: '♥', edge: '1.2%', isNew: true, c1: '#f43f5e', c2: '#6a0f2a' }),
  g({ id: 'limbo', name: 'Limbo', cat: 'Instant', glyph: '∞', edge: '1.0%', c1: '#f59e0b', c2: '#6a3a00' }),
  g({ id: 'keno', name: 'Keno', cat: 'Instant', glyph: '●', edge: '3.5%', c1: '#14b8a6', c2: '#064a44' }),
  g({ id: 'blackjack', name: 'Blackjack', cat: 'Table', glyph: '♠', edge: '0.5%', c1: '#10b981', c2: '#064233' }),
  g({ id: 'roulette', name: 'Roulette', cat: 'Table', glyph: '◉', edge: '2.7%', c1: '#ef4444', c2: '#1c1c1c' }),
  g({ id: 'poker', name: 'Video Poker', cat: 'Table', glyph: '♣', edge: '0.46%', c1: '#6366f1', c2: '#1a1a5a' }),
  g({ id: 'baccarat', name: 'Baccarat', cat: 'Table', glyph: '♦', edge: '1.06%', c1: '#c026d3', c2: '#4a0a4a' }),
  g({ id: 'liveroulette', name: 'Live Roulette', cat: 'Live', glyph: '◉', edge: '2.7%', isNew: true, c1: '#dc2626', c2: '#1c1c1c' }),
  g({ id: 'liveblackjack', name: 'Live Blackjack', cat: 'Live', glyph: '♠', edge: '0.5%', c1: '#059669', c2: '#043a2a' }),
];

export interface Slide {
  kicker: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  glyph: string;
  c1: string;
  c2: string;
}

export const SLIDES: Slide[] = [
  { kicker: 'Provably fair · on-chain', title: 'Find your game', sub: 'Fast payouts. Verifiable randomness. The edge is published.', cta: 'Play Sugar Pop', href: '/play', glyph: '❦', c1: '#1f8a5b', c2: '#0a3a28' },
  { kicker: 'Live now', title: 'Sugar Pop', sub: 'A 3×3 slot settled by a commit-reveal seed. Spin, win, verify.', cta: 'Spin now', href: '/play', glyph: '★', c1: '#b3005f', c2: '#2a0b3a' },
  { kicker: 'No trust required', title: 'The house edge, in the open', sub: 'Every result is reproducible in your browser. Check the math yourself.', cta: 'Explore games', href: '#games', glyph: 'Ð', c1: '#0a6e8a', c2: '#06243a' },
];

export const CHIPS: { key: string; label: string; icon: string }[] = [
  { key: 'all', label: 'All Games', icon: '▦' },
  { key: 'Slots', label: 'Slots', icon: '▦' },
  { key: 'Instant', label: 'Instant', icon: '✦' },
  { key: 'Table', label: 'Table', icon: '♠' },
  { key: 'Live', label: 'Live', icon: '◉' },
  { key: 'new', label: 'New', icon: '✧' },
];

export const CAT_LABELS: Record<string, string> = {
  all: 'All Games',
  Slots: 'Slots',
  Instant: 'Instant Thrills',
  Table: 'Table Games',
  Live: 'Live Casino',
  new: 'New Releases',
  hot: 'Hot Right Now',
};

export function matchCat(g: GameItem, cat: string): boolean {
  if (cat === 'all') return true;
  if (cat === 'new') return !!g.isNew;
  if (cat === 'hot') return !!g.hot;
  return g.cat === cat;
}
