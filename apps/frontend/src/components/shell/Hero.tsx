'use client';

import * as s from './shell.css';

export function Hero() {
  return (
    <section className={s.hero}>
      <h2 className={s.heroTitle}>Spin a provably-fair slot</h2>
      <p className={s.heroSub}>
        Testnet chips, on-chain deposits, and every outcome verifiable in your own browser.
      </p>
    </section>
  );
}
