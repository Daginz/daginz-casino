import { createHmac } from 'node:crypto';

/**
 * Pure provably-fair math, shared by the service (live) and the simulator/
 * verifier. One definition so live play and verification can never diverge.
 */

/** Per-round secret seed derived from the hidden server seed. */
export function deriveRoundSeed(serverSeed: string, clientSeed: string, nonce: number): string {
  return createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
}

/** A scalar outcome in [0,1) for the round (analytics / simple games). */
export function roundOutcome(roundSeed: string): number {
  return parseInt(roundSeed.slice(0, 13), 16) / 2 ** 52;
}
