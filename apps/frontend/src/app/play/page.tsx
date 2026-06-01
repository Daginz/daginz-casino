'use client';

import Link from 'next/link';
import { Header } from '@/components/shell/Header';
import { Footer } from '@/components/shell/Footer';
import { SlotGame } from '@/components/slot/SlotGame';
import { Cashier } from '@/components/cashier/Cashier';
import { Paytable } from '@/components/panels/Paytable';
import { Verify } from '@/components/verify/Verify';
import { History } from '@/components/panels/History';
import { WalletButton } from '@/components/wallet/WalletButton';
import { FadeIn } from '@/components/ui/FadeIn';
import { Toasts } from '@/components/ui/toast';
import { useSession } from '../session-provider';
import { useGame } from '../game-provider';
import { vars } from '@/styles/theme.css';
import * as s from '@/components/shell/shell.css';

export default function PlayPage() {
  const { status } = useSession();
  const { spin } = useGame();
  const connected = status === 'connected';

  return (
    <div className={s.page}>
      <Header />

      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          margin: '4px 0 16px',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          color: vars.color.textDim,
          textDecoration: 'none',
        }}
      >
        ‹ Back to lobby
      </Link>

      {connected ? (
        <div className={s.grid}>
          <FadeIn>
            <SlotGame />
          </FadeIn>
          <aside className={s.rail}>
            <FadeIn delay={0.05}>
              <Cashier />
            </FadeIn>
            <FadeIn delay={0.1}>
              <Paytable />
            </FadeIn>
            <FadeIn delay={0.15}>
              <Verify lastRound={spin.lastRound} />
            </FadeIn>
            <FadeIn delay={0.2}>
              <History />
            </FadeIn>
          </aside>
        </div>
      ) : (
        <div className={s.gate}>
          <p style={{ opacity: 0.75, maxWidth: 420 }}>
            Connect a wallet (or use the built-in demo wallet) to claim test chips and start spinning.
          </p>
          <WalletButton />
        </div>
      )}

      <Footer />
      <Toasts />
    </div>
  );
}
