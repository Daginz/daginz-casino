/**
 * Daginz theme system in Vanilla Extract.
 *
 * One `createThemeContract` (vars) defines the *shape* of a theme — every token
 * the design uses. Each palette (`royal`, `cyber`, `classic`, `candy`) is a
 * `createTheme` that fills the contract and yields a class name. Switching theme
 * at runtime = swapping that class on a wrapper element; no inline style writes,
 * fully type-checked, zero runtime CSS generation.
 *
 * Ported verbatim from the design's theme.jsx (THEMES / FONT_PAIRS).
 */
import { createTheme, createThemeContract } from '@vanilla-extract/css';

/** The contract: the full set of design tokens, with the same names as the CSS vars. */
export const vars = createThemeContract({
  color: {
    bg: null,
    bg2: null,
    feltA: null,
    feltB: null,
    surface: null,
    surface2: null,
    surface3: null,
    line: null,
    lineSoft: null,
    gold: null,
    goldSoft: null,
    goldDeep: null,
    goldInk: null,
    action: null,
    actionSoft: null,
    actionDeep: null,
    actionInk: null,
    reelAccent: null,
    text: null,
    textDim: null,
    textFaint: null,
    win: null,
    loss: null,
    reelBg: null,
    reelInk: null,
    seven: null,
    glow: null,
  },
  font: {
    display: null,
    ui: null,
    num: null,
    mono: null,
    displayWeight: null,
  },
});

export const royalTheme = createTheme(vars, {
  color: {
    bg: '#16130f',
    bg2: '#0a0907',
    feltA: 'rgba(11,79,51,0.40)',
    feltB: 'rgba(10,9,7,0)',
    surface: '#1b2a22',
    surface2: '#203127',
    surface3: '#15201a',
    line: 'rgba(212,175,55,0.22)',
    lineSoft: 'rgba(212,175,55,0.10)',
    gold: '#d4af37',
    goldSoft: '#f0d27a',
    goldDeep: '#9c7c1e',
    goldInk: '#2a2008',
    action: '#d4af37',
    actionSoft: '#f3da8e',
    actionDeep: '#9c7c1e',
    actionInk: '#2a2008',
    reelAccent: '#b8902e',
    text: '#f5edda',
    textDim: '#b6bdae',
    textFaint: '#79806f',
    win: '#6fe2a0',
    loss: '#e07a8c',
    reelBg: '#0f1c15',
    reelInk: '#f4ecd6',
    seven: '#c0392b',
    glow: 'rgba(212,175,55,0.5)',
  },
  font: {
    display: "'Cinzel', Georgia, serif",
    ui: "'Montserrat', system-ui, sans-serif",
    num: "'Montserrat', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: '700',
  },
});

export const cyberTheme = createTheme(vars, {
  color: {
    bg: '#190f2e',
    bg2: '#0d0820',
    feltA: 'rgba(0,240,255,0.12)',
    feltB: 'rgba(13,8,32,0)',
    surface: '#221542',
    surface2: '#2a1852',
    surface3: '#190f33',
    line: 'rgba(0,240,255,0.24)',
    lineSoft: 'rgba(124,77,255,0.22)',
    gold: '#22e0f0',
    goldSoft: '#9af7ff',
    goldDeep: '#0a8fa3',
    goldInk: '#03222a',
    action: '#ff2ea0',
    actionSoft: '#ff7ac4',
    actionDeep: '#b3005f',
    actionInk: '#2a0016',
    reelAccent: '#7c3aed',
    text: '#ece8ff',
    textDim: '#a79fce',
    textFaint: '#6c6396',
    win: '#28f0c2',
    loss: '#ff5a8a',
    reelBg: '#150a2c',
    reelInk: '#ece8ff',
    seven: '#ff2ea0',
    glow: 'rgba(255,46,160,0.55)',
  },
  font: {
    display: "'Rajdhani', system-ui, sans-serif",
    ui: "'Space Grotesk', system-ui, sans-serif",
    num: "'JetBrains Mono', ui-monospace, monospace",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: '700',
  },
});

export const classicTheme = createTheme(vars, {
  color: {
    bg: '#1b1d21',
    bg2: '#0e0f12',
    feltA: 'rgba(128,0,32,0.30)',
    feltB: 'rgba(14,15,18,0)',
    surface: '#2a2126',
    surface2: '#31262c',
    surface3: '#20191d',
    line: 'rgba(201,162,74,0.20)',
    lineSoft: 'rgba(128,0,32,0.26)',
    gold: '#c9a24a',
    goldSoft: '#e8cd86',
    goldDeep: '#8a6c22',
    goldInk: '#241b06',
    action: '#ffb02e',
    actionSoft: '#ffd27a',
    actionDeep: '#c77f00',
    actionInk: '#2a1c00',
    reelAccent: '#b8902e',
    text: '#f2ece2',
    textDim: '#b3ada3',
    textFaint: '#76716a',
    win: '#5fd08a',
    loss: '#ff5a6a',
    reelBg: '#181410',
    reelInk: '#f2ece2',
    seven: '#ff3b30',
    glow: 'rgba(255,140,30,0.52)',
  },
  font: {
    display: "'Bebas Neue', Impact, sans-serif",
    ui: "'Oswald', system-ui, sans-serif",
    num: "'Bebas Neue', Impact, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: '400',
  },
});

export const candyTheme = createTheme(vars, {
  color: {
    bg: '#3a1f6e',
    bg2: '#241046',
    feltA: 'rgba(255,120,180,0.16)',
    feltB: 'rgba(36,16,70,0)',
    surface: '#3a2070',
    surface2: '#492a8e',
    surface3: '#2c1656',
    line: 'rgba(255,210,80,0.32)',
    lineSoft: 'rgba(255,120,180,0.22)',
    gold: '#ffd23f',
    goldSoft: '#ffe79a',
    goldDeep: '#d99a00',
    goldInk: '#4a2e00',
    action: '#2fbf5f',
    actionSoft: '#6fe79a',
    actionDeep: '#1b7d3e',
    actionInk: '#06240f',
    reelAccent: '#ff5d8f',
    text: '#fff7fb',
    textDim: '#dac9f0',
    textFaint: '#a892c9',
    win: '#7cf2a0',
    loss: '#ff6d9a',
    reelBg: '#2a1457',
    reelInk: '#fff7fb',
    seven: '#ff4d6d',
    glow: 'rgba(255,120,180,0.5)',
  },
  font: {
    display: "'Fredoka', system-ui, sans-serif",
    ui: "'Fredoka', system-ui, sans-serif",
    num: "'Fredoka', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: '600',
  },
});

/** Theme key → class name. The active key is applied to a wrapper element. */
export const themeClass = {
  royal: royalTheme,
  cyber: cyberTheme,
  classic: classicTheme,
  candy: candyTheme,
} as const;

export type ThemeKey = keyof typeof themeClass;

/** Metadata for the theme picker (swatches/labels), separate from the CSS vars. */
export const THEME_META: Record<ThemeKey, { label: string; blurb: string; swatch: [string, string, string] }> = {
  royal: { label: 'Premium Royal', blurb: 'Chocolate · emerald · matte gold', swatch: ['#16130f', '#0B4F33', '#D4AF37'] },
  cyber: { label: 'Neon Cyber', blurb: 'Violet · cyan · electric fuchsia', swatch: ['#190f2e', '#00F0FF', '#FF2EA0'] },
  classic: { label: 'High Voltage', blurb: 'Anthracite · burgundy · fire red', swatch: ['#1b1d21', '#800020', '#FF3B30'] },
  candy: { label: 'Candy Pop', blurb: 'Sugar-rush pastel', swatch: ['#2a1457', '#ff5d8f', '#2fbf5f'] },
};

/** Animation intensity presets (from theme.jsx ANIM) — plain data, used by JS. */
export const ANIM = {
  calm: { label: 'Calm', spin: 1500, stagger: 260, countup: 700, shake: 0, blur: 4 },
  standard: { label: 'Standard', spin: 1900, stagger: 360, countup: 1000, shake: 1, blur: 8 },
  cinematic: { label: 'Cinematic', spin: 2600, stagger: 520, countup: 1500, shake: 1.8, blur: 13 },
} as const;

export type AnimKey = keyof typeof ANIM;
