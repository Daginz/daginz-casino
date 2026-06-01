'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { themeClass, type ThemeKey, type AnimKey } from '@/styles/theme.css';

interface ThemeCtx {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  anim: AnimKey;
  setAnim: (a: AnimKey) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_STORE = 'dgz_theme';
const ANIM_STORE = 'dgz_anim';

const ALL_THEME_CLASSES = Object.values(themeClass);

/**
 * Applies the active Vanilla Extract theme class to <html> (documentElement).
 * It MUST live at the root, not a wrapper div: `body::before` (the felt
 * background) and `body` itself read the theme vars, and CSS variables only
 * cascade downward — vars set on an inner div are invisible to body. Switching
 * theme is a class swap; everything recolors instantly. Persisted.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('candy');
  const [anim, setAnimState] = useState<AnimKey>('standard');

  // Hydrate persisted choice after mount (avoids SSR/client mismatch).
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_STORE) as ThemeKey | null;
      const a = localStorage.getItem(ANIM_STORE) as AnimKey | null;
      if (t && t in themeClass) setThemeState(t);
      if (a && (a === 'calm' || a === 'standard' || a === 'cinematic')) setAnimState(a);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep the theme class on <html> so body + body::before resolve the vars.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...ALL_THEME_CLASSES);
    root.classList.add(themeClass[theme]);
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      anim,
      setTheme: (t) => {
        setThemeState(t);
        try {
          localStorage.setItem(THEME_STORE, t);
        } catch {
          /* ignore */
        }
      },
      setAnim: (a) => {
        setAnimState(a);
        try {
          localStorage.setItem(ANIM_STORE, a);
        } catch {
          /* ignore */
        }
      },
    }),
    [theme, anim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
