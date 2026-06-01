'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { spinner } from '@/styles/animations.css';
import { btn } from './Btn.css';

type Variant = 'gold' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  busy?: boolean;
}

export function Btn({ children, variant = 'ghost', size = 'md', full = false, busy = false, disabled, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`${btn({ variant, size, full })}${className ? ` ${className}` : ''}`}
    >
      {busy && <span className={spinner} />}
      {children}
    </button>
  );
}
