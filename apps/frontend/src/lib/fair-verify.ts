/**
 * Browser-side provably-fair verification — a byte-for-byte mirror of the
 * backend's fair-math.ts, using Web Crypto instead of node:crypto. Lets a
 * player independently recompute any revealed outcome and confirm it matches
 * what they were paid on, with no trust in the server.
 *
 * roundSeed = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`)  (hex)
 * outcome   = parseInt(roundSeed.slice(0,13), 16) / 2 ** 52       in [0,1)
 */

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/** HMAC-SHA256(key=serverSeed, msg=`${clientSeed}:${nonce}`) as hex. */
export async function deriveRoundSeed(serverSeed: string, clientSeed: string, nonce: number): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(serverSeed), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${clientSeed}:${nonce}`));
  return toHex(sig);
}

export function roundOutcome(roundSeed: string): number {
  return parseInt(roundSeed.slice(0, 13), 16) / 2 ** 52;
}

/** SHA-256(serverSeed) as hex — to confirm it matches the pre-published hash. */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return toHex(digest);
}

export interface VerifyInput {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  /** The outcome the round was settled with (from the round record). */
  claimedOutcome: number;
}

export interface VerifyReport {
  /** SHA-256(serverSeed) === published serverSeedHash. */
  hashMatches: boolean;
  /** Recomputed outcome from the seed pair + nonce. */
  recomputedOutcome: number;
  recomputedRoundSeed: string;
  /** recomputedOutcome === claimedOutcome (to float tolerance). */
  outcomeMatches: boolean;
  /** Both checks pass. */
  valid: boolean;
}

/** Full client-side verification of a revealed draw. */
export async function verifyDraw(input: VerifyInput): Promise<VerifyReport> {
  const computedHash = await sha256Hex(input.serverSeed);
  const hashMatches = computedHash.toLowerCase() === input.serverSeedHash.toLowerCase();

  const roundSeed = await deriveRoundSeed(input.serverSeed, input.clientSeed, input.nonce);
  const recomputed = roundOutcome(roundSeed);
  const outcomeMatches = Math.abs(recomputed - input.claimedOutcome) < 1e-9;

  return {
    hashMatches,
    recomputedOutcome: recomputed,
    recomputedRoundSeed: roundSeed,
    outcomeMatches,
    valid: hashMatches && outcomeMatches,
  };
}
