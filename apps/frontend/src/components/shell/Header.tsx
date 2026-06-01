'use client';

import { WalletButton } from '@/components/wallet/WalletButton';
import { NetworkBadge } from '@/components/wallet/NetworkBadge';
import { SoundToggle } from './SoundToggle';
import { ThemeDots } from './ThemeDots';
import * as s from './shell.css';

export function Header() {
  return (
    <header className={s.header}>
      <div className={s.brand}>
        <span className={s.logoDot} />
        <h1 className={s.logo}>Daginz</h1>
      </div>
      <div className={s.headerRight}>
        <ThemeDots />
        <SoundToggle />
        <NetworkBadge />
        <WalletButton />
      </div>
    </header>
  );
}
