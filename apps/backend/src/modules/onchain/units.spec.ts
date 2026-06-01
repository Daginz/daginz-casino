import { weiToChip, chipToWei, WEI_PER_CHIP } from './units';

/**
 * The wei↔CHIP boundary guards against the int64 overflow that storing raw
 * 18-decimal amounts in the ledger would cause. These checks pin the conversion
 * and the deposit-in / withdraw-out symmetry.
 */
describe('units: wei <-> CHIP conversion', () => {
  it('converts whole CHIP to wei and back losslessly', () => {
    for (const chip of [0n, 1n, 100n, 1000n, 1_000_000n]) {
      const wei = chipToWei(chip);
      expect(wei).toBe(chip * WEI_PER_CHIP);
      expect(weiToChip(wei)).toEqual({ chip, dust: 0n });
    }
  });

  it('floors sub-CHIP wei and reports the remainder as dust', () => {
    const wei = WEI_PER_CHIP * 3n + 123n; // 3 CHIP + 123 wei dust
    expect(weiToChip(wei)).toEqual({ chip: 3n, dust: 123n });
  });

  it('treats amounts below 1 CHIP as zero chip with full dust', () => {
    expect(weiToChip(WEI_PER_CHIP - 1n)).toEqual({ chip: 0n, dust: WEI_PER_CHIP - 1n });
  });

  it('handles amounts that would overflow int64 if stored as wei', () => {
    // 300 CHIP = 3e20 wei > int64 max (~9.2e18) — must reduce to a safe int.
    const chip = 300n;
    const wei = chipToWei(chip);
    expect(wei > 9_223_372_036_854_775_807n).toBe(true); // exceeds int64
    expect(weiToChip(wei).chip).toBe(300n); // but the ledger value is tiny
  });
});
