'use client';

import type { ReactNode } from 'react';
import { vars } from '@/styles/theme.css';
import * as s from './Panel.css';

export function Panel({
  title,
  sub,
  right,
  children,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={s.panel}>
      <div className={s.head}>
        <div>
          <h3 className={s.title}>{title}</h3>
          {sub && <p className={s.sub}>{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, unit, gold }: { label: string; value: string; unit?: string; gold?: boolean }) {
  return (
    <div className={s.stat}>
      <div className={s.statLabel}>{label}</div>
      <div style={{ marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span className={s.statValue} style={gold ? { color: vars.color.goldSoft } : undefined}>
          {value}
        </span>
        {unit && <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: vars.color.textFaint }}>{unit}</span>}
      </div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <div className={s.label}>{children}</div>;
}
