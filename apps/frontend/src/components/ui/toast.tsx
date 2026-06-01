'use client';

import { useEffect, useState } from 'react';
import { vars } from '@/styles/theme.css';
import { toastIn } from '@/styles/animations.css';

type ToastType = 'ok' | 'err' | 'info';
interface ToastItem {
  id: string;
  type: ToastType;
  msg: string;
}

// A tiny external store so any module can `Toast.ok(...)` without prop drilling
// (ported from the design's components.jsx Toast singleton).
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];
let seq = 0;

function emit() {
  for (const l of listeners) l([...items]);
}
function push(type: ToastType, msg: string): string {
  const id = `t${seq++}`;
  items = [...items, { id, type, msg }];
  emit();
  setTimeout(() => dismiss(id), 4200);
  return id;
}
function dismiss(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export const Toast = {
  ok: (m: string) => push('ok', m),
  err: (m: string) => push('err', m),
  info: (m: string) => push('info', m),
  dismiss,
};

const ACCENT: Record<ToastType, string> = {
  ok: vars.color.win,
  err: vars.color.loss,
  info: vars.color.gold,
};
const ICON: Record<ToastType, string> = { ok: '✓', err: '!', info: 'ⓘ' };

export function Toasts() {
  const [list, setList] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
      }}
    >
      {list.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            cursor: 'pointer',
            background: vars.color.surface2,
            border: `1px solid ${vars.color.line}`,
            borderLeft: `3px solid ${ACCENT[t.type]}`,
            borderRadius: 12,
            boxShadow: '0 18px 40px -16px rgba(0,0,0,.7)',
            fontFamily: vars.font.ui,
            fontSize: 13.5,
            color: vars.color.text,
            animation: `${toastIn} .22s ease-out`,
          }}
        >
          <span style={{ color: ACCENT[t.type], fontWeight: 700 }}>{ICON[t.type]}</span>
          <span style={{ lineHeight: 1.4 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
