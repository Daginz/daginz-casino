'use client';

import { spinner } from '@/styles/animations.css';
import { vars } from '@/styles/theme.css';
import { explorer } from '@/lib/explorer';
import { shortHash } from '@/lib/format';
import type { TxFlow, TxStep } from '@/lib/use-chain';
import { Btn } from '@/components/ui/Btn';

const STATUS_ICON: Record<TxStep['status'], string> = {
  pending: '○',
  active: '',
  done: '✓',
  error: '✗',
};

function StepRow({ step }: { step: TxStep }) {
  const ex = explorer();
  const url = step.hash ? ex.txUrl(step.hash) : null;
  const color =
    step.status === 'done' ? vars.color.win : step.status === 'error' ? vars.color.loss : step.status === 'active' ? vars.color.goldSoft : vars.color.textFaint;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ width: 16, display: 'grid', placeItems: 'center', marginTop: 2, color }}>
        {step.status === 'active' ? <span className={spinner} /> : STATUS_ICON[step.status]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: vars.font.ui, fontSize: 13, color: step.status === 'pending' ? vars.color.textFaint : vars.color.text }}>
          {step.label}
          {step.block != null && (
            <span style={{ color: vars.color.textFaint, fontSize: 11 }}> · block #{step.block}</span>
          )}
        </div>
        {step.note && (
          <div style={{ fontFamily: vars.font.ui, fontSize: 11, color: vars.color.textFaint, marginTop: 1 }}>{step.note}</div>
        )}
        {step.hash && (
          <div style={{ fontFamily: vars.font.mono, fontSize: 11, marginTop: 2 }}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: vars.color.goldSoft }}>
                {shortHash(step.hash)} · view on {ex.name} ↗
              </a>
            ) : (
              <span style={{ color: vars.color.textDim }} title="No public explorer on this network — copy the hash to verify elsewhere">
                {shortHash(step.hash)} · {ex.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Live transaction progress for the cashier: shows each step of a faucet /
 * deposit / withdraw flow (pending → active → mined block → done), with the tx
 * hash and a third-party explorer link so the user can independently confirm
 * where their transaction is — even via another service.
 */
export function TxProgress({ flow, onClose }: { flow: TxFlow; onClose: () => void }) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 12,
        background: vars.color.surface3,
        border: `1px solid ${vars.color.line}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: vars.font.ui, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: vars.color.text }}>
          {flow.title}
        </span>
        {flow.done && (
          <Btn size="sm" variant="quiet" onClick={onClose}>
            Done
          </Btn>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {flow.steps.map((st) => (
          <StepRow key={st.key} step={st} />
        ))}
      </div>
    </div>
  );
}
