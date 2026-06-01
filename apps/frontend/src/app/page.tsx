'use client';

import { Header } from '@/components/shell/Header';
import { Footer } from '@/components/shell/Footer';
import { Lobby } from '@/components/lobby/Lobby';
import { Toasts } from '@/components/ui/toast';
import * as s from '@/components/shell/shell.css';

export default function HomePage() {
  return (
    <div className={s.page}>
      <Header />
      <Lobby />
      <Footer />
      <Toasts />
    </div>
  );
}
