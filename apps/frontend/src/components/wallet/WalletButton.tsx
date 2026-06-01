'use client';

import { useState } from 'react';
import { Btn } from '@/components/ui/Btn';
import { useSession } from '@/app/session-provider';
import { shortAddr } from '@/lib/format';
import { ConnectModal } from './ConnectModal';
import * as s from './wallet.css';

/**
 * Header wallet control: shows a "Connect" CTA when signed out, and a clickable
 * pill (address + disconnect) when signed in. Opens the ConnectModal.
 */
export function WalletButton() {
  const [open, setOpen] = useState(false);
  const { status, address, mode, disconnect } = useSession();

  if (status === 'connected' && address) {
    return (
      <button className={s.pill} onClick={disconnect} title="Click to disconnect">
        <span className={s.avatar} />
        {shortAddr(address)}
        {mode === 'demo' && <span style={{ opacity: 0.6, fontSize: 11 }}>· demo</span>}
      </button>
    );
  }

  return (
    <>
      <Btn variant="gold" onClick={() => setOpen(true)} busy={status === 'connecting' || status === 'authenticating'}>
        Connect wallet
      </Btn>
      <ConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
