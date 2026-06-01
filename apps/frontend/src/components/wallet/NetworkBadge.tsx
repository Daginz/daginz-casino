'use client';

import { useSession } from '@/app/session-provider';
import { ACTIVE_CHAIN_ID } from '@/lib/wagmi';
import { vars } from '@/styles/theme.css';
import * as s from './wallet.css';

const CHAIN_LABEL: Record<number, string> = { 31337: 'Hardhat', 11155111: 'Sepolia' };

export function NetworkBadge() {
  const { chainOk, status } = useSession();
  if (status === 'disconnected') return null;
  const label = CHAIN_LABEL[ACTIVE_CHAIN_ID] ?? 'Network';
  return (
    <div className={s.badge} style={{ color: chainOk ? vars.color.textDim : vars.color.loss }}>
      <span
        className={s.dot}
        style={{
          background: chainOk ? vars.color.win : vars.color.loss,
          boxShadow: chainOk ? `0 0 8px ${vars.color.win}` : 'none',
        }}
      />
      {chainOk ? label : 'Wrong network'}
    </div>
  );
}
