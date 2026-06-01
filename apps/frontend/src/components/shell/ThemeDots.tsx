'use client';

import { THEME_META, type ThemeKey } from '@/styles/theme.css';
import { useTheme } from '@/app/theme-provider';
import { vars } from '@/styles/theme.css';

const KEYS = Object.keys(THEME_META) as ThemeKey[];

export function ThemeDots() {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {KEYS.map((k) => (
        <button
          key={k}
          title={THEME_META[k].label}
          aria-label={THEME_META[k].label}
          aria-pressed={theme === k}
          onClick={() => setTheme(k)}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            cursor: 'pointer',
            padding: 0,
            border: theme === k ? `2px solid ${vars.color.text}` : `2px solid ${vars.color.line}`,
            transform: theme === k ? 'scale(1.12)' : 'none',
            transition: 'transform .15s',
            background: `linear-gradient(135deg, ${THEME_META[k].swatch[0]}, ${THEME_META[k].swatch[1]} 50%, ${THEME_META[k].swatch[2]})`,
          }}
        />
      ))}
    </div>
  );
}
