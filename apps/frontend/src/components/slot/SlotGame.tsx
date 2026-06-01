'use client';

import { SlotCabinet } from './SlotCabinet';
import { BetBar } from './BetBar';
import { ANIM } from '@/styles/theme.css';
import { useTheme } from '@/app/theme-provider';
import { useGame } from '@/app/game-provider';
import { Toast } from '@/components/ui/toast';

/**
 * The playable slot: cabinet + bet bar, driven by the shared game context.
 * Bet is capped by the casino (ledger) balance so the UI never offers a stake
 * the backend would reject.
 */
export function SlotGame() {
  const { theme, anim } = useTheme();
  void theme; // re-render on theme change so animations re-read vars
  const { spin: sp, chain, stake, setStake } = useGame();

  const preset = ANIM[anim];
  const maxBet = Math.max(0, Math.floor(chain.casinoBalance));

  function handleSpin() {
    if (!chain.ready) {
      Toast.info('Connect a wallet to play.');
      return;
    }
    if (chain.casinoBalance < stake) {
      Toast.err('Not enough casino balance — deposit first.');
      return;
    }
    void sp.spin(stake);
  }

  return (
    <div style={{ width: '100%' }}>
      <SlotCabinet
        windows={sp.windows}
        spinId={sp.spinId}
        duration={preset.spin}
        stagger={preset.stagger}
        blur={preset.blur}
        phase={sp.phase}
        result={sp.result}
        glowKey={sp.glowKey}
        nearMiss={sp.nearMiss}
        anticip={sp.anticip}
      />
      <BetBar
        stake={stake}
        setStake={setStake}
        maxBet={maxBet}
        onSpin={handleSpin}
        busy={sp.busy}
        ready={chain.ready}
        displayPayout={sp.displayPayout}
        showPayout={sp.phase === 'result' && !!sp.result?.win}
      />
    </div>
  );
}
