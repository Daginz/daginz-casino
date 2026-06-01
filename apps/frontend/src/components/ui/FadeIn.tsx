'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Subtle entrance animation for panels/sections — a short rise + fade. Honors
 * reduced-motion via the global CSS (framer respects the media query too, but
 * we keep the displacement tiny so it's gentle regardless).
 */
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
