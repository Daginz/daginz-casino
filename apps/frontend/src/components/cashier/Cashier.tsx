'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Panel, Stat, Label } from '@/components/ui/Panel';
import { Btn } from '@/components/ui/Btn';
import { Toast } from '@/components/ui/toast';
import { TxProgress } from './TxProgress';
import { useGame } from '@/app/game-provider';
import { fmt } from '@/lib/format';
import { ApiError } from '@/lib/api';
import { vars } from '@/styles/theme.css';
import * as p from '@/components/ui/Panel.css';

const amountSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((v) => Number(v) > 0, 'Must be greater than 0'),
});
type AmountForm = z.infer<typeof amountSchema>;

function AmountField({
  register,
  onMax,
  error,
  placeholder,
}: {
  register: ReturnType<typeof useForm<AmountForm>>['register'];
  onMax: () => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            {...register('amount')}
            inputMode="decimal"
            placeholder={placeholder ?? '0.00'}
            className={p.input}
          />
          <span
            style={{
              position: 'absolute',
              right: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              color: vars.color.textFaint,
            }}
          >
            CHIP
          </span>
        </div>
        <Btn type="button" variant="quiet" size="sm" onClick={onMax}>
          MAX
        </Btn>
      </div>
      {error && <p style={{ margin: '6px 2px 0', fontSize: 12, color: vars.color.loss }}>{error}</p>}
    </div>
  );
}

export function Cashier() {
  const { chain } = useGame();
  const { ready, busy, casinoBalance, walletBalance, faucet, deposit, withdraw, txFlow, clearFlow } = chain;

  const depForm = useForm<AmountForm>({ resolver: zodResolver(amountSchema), defaultValues: { amount: '' } });
  const wdForm = useForm<AmountForm>({ resolver: zodResolver(amountSchema), defaultValues: { amount: '' } });

  async function run(label: string, fn: () => Promise<void>) {
    try {
      await fn();
      Toast.ok(`${label} confirmed.`);
    } catch (e) {
      Toast.err(e instanceof ApiError ? e.message : e instanceof Error ? e.message : `${label} failed`);
    }
  }

  return (
    <Panel title="Cashier" sub="Test chips · faucet → vault → wallet">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Stat label="In wallet" value={fmt(walletBalance)} unit="CHIP" />
        <Stat label="In casino" value={fmt(casinoBalance)} unit="CHIP" gold />
      </div>

      {txFlow && (
        <div style={{ marginBottom: 16 }}>
          <TxProgress flow={txFlow} onClose={clearFlow} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Btn variant="ghost" full disabled={!ready} busy={busy === 'faucet'} onClick={() => void run('Faucet', () => faucet().then(() => undefined))}>
          Get 1,000 test CHIP
        </Btn>
        <p style={{ margin: '7px 2px 0', fontFamily: 'var(--font-ui)', fontSize: 11.5, color: vars.color.textFaint, lineHeight: 1.5 }}>
          Mints valueless test chips. No real funds, ever.
        </p>
      </div>

      <form
        style={{ marginBottom: 14 }}
        onSubmit={depForm.handleSubmit((v) =>
          run('Deposit', () => deposit(Number(v.amount))).then(() => depForm.reset()),
        )}
      >
        <Label>Deposit to casino</Label>
        <AmountField
          register={depForm.register}
          error={depForm.formState.errors.amount?.message}
          onMax={() => depForm.setValue('amount', String(walletBalance))}
        />
        <div style={{ marginTop: 8 }}>
          <Btn type="submit" variant="gold" full disabled={!ready} busy={busy === 'deposit'}>
            Deposit
          </Btn>
        </div>
      </form>

      <form
        onSubmit={wdForm.handleSubmit((v) => run('Withdraw', () => withdraw(Number(v.amount))).then(() => wdForm.reset()))}
      >
        <Label>Withdraw to wallet</Label>
        <AmountField
          register={wdForm.register}
          error={wdForm.formState.errors.amount?.message}
          onMax={() => wdForm.setValue('amount', String(casinoBalance))}
        />
        <div style={{ marginTop: 8 }}>
          <Btn type="submit" variant="ghost" full disabled={!ready} busy={busy === 'withdraw'}>
            Withdraw
          </Btn>
        </div>
      </form>

      {!ready && (
        <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-ui)', fontSize: 12, color: vars.color.textFaint }}>
          Connect a wallet to use the cashier.
        </p>
      )}
    </Panel>
  );
}
