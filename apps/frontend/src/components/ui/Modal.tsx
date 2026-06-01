'use client';

import type { ReactNode } from 'react';
import * as s from './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 420 }: ModalProps) {
  if (!open) return null;
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.panel} style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h3 className={s.title}>{title}</h3>
          <button className={s.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
