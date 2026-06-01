'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel, Label } from '@/components/ui/Panel';
import { Btn } from '@/components/ui/Btn';
import { Toast } from '@/components/ui/toast';
import { api, ApiError, type Commitment, type RevealResult, type RoundResult } from '@/lib/api';
import { verifyDraw, type VerifyReport } from '@/lib/fair-verify';
import { shortHash } from '@/lib/format';
import { vars } from '@/styles/theme.css';
import { useSession } from '@/app/session-provider';

function Copyable({ text, display }: { text: string; display?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      title="Copy"
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: vars.color.textDim,
        fontFamily: vars.font.mono,
        fontSize: 12,
        textAlign: 'left',
        wordBreak: 'break-all',
      }}
    >
      {done ? 'copied ✓' : (display ?? text)}
    </button>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: vars.font.ui, fontSize: 12, color: vars.color.textFaint }}>{k}</span>
      <span style={{ textAlign: 'right' }}>{v}</span>
    </div>
  );
}

interface VerifyProps {
  lastRound: RoundResult | null;
}

/**
 * Provably-fair panel — our REAL commit-reveal scheme (not VRF). Shows the
 * pre-committed server-seed hash, the player's client seed (editable), and a
 * "Verify last spin" action that reveals the server seed and recomputes the
 * outcome IN THE BROWSER (fair-verify.ts), proving the spin wasn't tampered.
 */
export function Verify({ lastRound }: VerifyProps) {
  const { status } = useSession();
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [revealed, setRevealed] = useState<RevealResult | null>(null);
  const [busy, setBusy] = useState(false);

  const commitment = useQuery({
    queryKey: ['commitment', status],
    enabled: status === 'connected',
    queryFn: () => api.get<Commitment>('/provably-fair/commitment'),
  });

  async function handleVerify() {
    if (!lastRound) return;
    setBusy(true);
    setReport(null);
    try {
      // Reveal the server seed for the round we want to check, then recompute.
      const seed = await api.post<RevealResult>('/provably-fair/reveal', {});
      setRevealed(seed);
      const r = await verifyDraw({
        serverSeed: seed.serverSeed,
        serverSeedHash: lastRound.serverSeedHash,
        clientSeed: lastRound.clientSeed,
        nonce: lastRound.nonce,
        claimedOutcome: lastRound.outcome,
      });
      setReport(r);
      r.valid ? Toast.ok('Verified — outcome matches the committed seed.') : Toast.err('Verification mismatch!');
      void commitment.refetch();
    } catch (e) {
      Toast.err(e instanceof ApiError ? e.message : 'Reveal failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Provably fair" sub="Commit-reveal · every spin reproducible in your browser">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          k="Server seed hash"
          v={
            commitment.data ? (
              <Copyable text={commitment.data.serverSeedHash} display={shortHash(commitment.data.serverSeedHash)} />
            ) : (
              <span style={{ color: vars.color.textFaint, fontSize: 12 }}>—</span>
            )
          }
        />
        <Row
          k="Client seed"
          v={
            commitment.data ? (
              <Copyable text={commitment.data.clientSeed} display={commitment.data.clientSeed} />
            ) : (
              '—'
            )
          }
        />
        <Row
          k="Nonce"
          v={<span style={{ fontFamily: vars.font.mono, fontSize: 12.5, color: vars.color.text }}>{commitment.data?.nonce ?? '—'}</span>}
        />
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${vars.color.lineSoft}` }}>
        <Label>Last spin</Label>
        {!lastRound ? (
          <p style={{ fontFamily: vars.font.ui, fontSize: 12.5, color: vars.color.textFaint, margin: 0 }}>
            Spin once, then verify the outcome against the committed seed.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Row
              k="Outcome"
              v={<span style={{ fontFamily: vars.font.mono, fontSize: 12.5, color: vars.color.text }}>{lastRound.outcome.toFixed(8)}</span>}
            />
            <Row
              k="Payout"
              v={
                <span style={{ fontFamily: vars.font.num, fontSize: 14, fontWeight: 700, color: Number(lastRound.payout) > 0 ? vars.color.win : vars.color.textDim }}>
                  {Number(lastRound.payout) > 0 ? `+${lastRound.payout} CHIP` : '—'}
                </span>
              }
            />
            <Btn variant="quiet" size="sm" onClick={handleVerify} busy={busy} disabled={busy}>
              Reveal & verify in browser
            </Btn>

            {report && (
              <div style={{ background: vars.color.surface3, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row
                  k="SHA-256(serverSeed)"
                  v={<span style={{ fontFamily: vars.font.mono, fontSize: 11, color: report.hashMatches ? vars.color.win : vars.color.loss }}>{report.hashMatches ? 'matches commitment ✓' : 'MISMATCH ✗'}</span>}
                />
                <Row
                  k="Recomputed outcome"
                  v={<span style={{ fontFamily: vars.font.mono, fontSize: 11, color: report.outcomeMatches ? vars.color.win : vars.color.loss }}>{report.recomputedOutcome.toFixed(8)} {report.outcomeMatches ? '✓' : '✗'}</span>}
                />
                {revealed && (
                  <div>
                    <div style={{ fontFamily: vars.font.ui, fontSize: 10.5, color: vars.color.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                      Revealed server seed
                    </div>
                    <Copyable text={revealed.serverSeed} display={shortHash(revealed.serverSeed)} />
                  </div>
                )}
                <div style={{ fontFamily: vars.font.ui, fontSize: 12, fontWeight: 700, color: report.valid ? vars.color.win : vars.color.loss }}>
                  {report.valid ? 'Provably fair ✓' : 'Verification failed ✗'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
