'use client';

import { Modal } from '@/components/ui/Modal';
import { spinner } from '@/styles/animations.css';
import { useSession } from '@/app/session-provider';
import * as s from './wallet.css';

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ open, onClose }: ConnectModalProps) {
  const { connectMetaMask, connectDemo, status, error } = useSession();
  const busy = status === 'connecting' || status === 'authenticating';

  async function pick(fn: () => Promise<void>) {
    await fn();
  }

  return (
    <Modal open={open} onClose={onClose} title="Connect a wallet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          className={s.option}
          disabled={busy}
          onClick={() => void pick(connectMetaMask).then(onClose)}
        >
          <span className={s.optionIcon}>🦊</span>
          <span>
            MetaMask
            <span className={s.optionSub}>Sign in with your browser wallet (SIWE).</span>
          </span>
        </button>

        <button
          className={s.option}
          disabled={busy}
          onClick={() => void pick(connectDemo).then(onClose)}
        >
          <span className={s.optionIcon}>🎲</span>
          <span>
            Demo wallet
            <span className={s.optionSub}>A built-in test key — no extension needed.</span>
          </span>
        </button>
      </div>

      {busy && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 2px 0', fontSize: 13, opacity: 0.8 }}>
          <span className={spinner} />
          {status === 'authenticating' ? 'Awaiting signature…' : 'Connecting…'}
        </p>
      )}
      {error && <p className={s.errorText}>{error}</p>}
    </Modal>
  );
}
