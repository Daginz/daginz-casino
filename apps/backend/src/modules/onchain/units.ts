/**
 * Unit boundary between the chain (wei, uint256) and the ledger (whole CHIP,
 * int64). The ledger stores game credits, not raw blockchain amounts — bets and
 * payouts are whole CHIP, so storing 10^18 sub-units per chip is pointless and
 * overflows int64. We convert ONLY here (deposit in / withdraw out), keeping the
 * two boundaries symmetric so they can never drift.
 *
 * CHIP has 18 decimals (set in ChipToken.sol). 1 CHIP = 10^18 wei.
 */
export const CHIP_DECIMALS = 18n;
export const WEI_PER_CHIP = 10n ** CHIP_DECIMALS;

/**
 * Convert on-chain wei to whole-CHIP ledger units. Reverts the floor amount in
 * `dust` so the caller can decide what to do with a fractional remainder
 * (on testnet the faucet mints whole CHIP, so dust is normally 0).
 */
export function weiToChip(wei: bigint): { chip: bigint; dust: bigint } {
  return { chip: wei / WEI_PER_CHIP, dust: wei % WEI_PER_CHIP };
}

/** Convert whole-CHIP ledger units back to wei for an on-chain withdrawal. */
export function chipToWei(chip: bigint): bigint {
  return chip * WEI_PER_CHIP;
}
