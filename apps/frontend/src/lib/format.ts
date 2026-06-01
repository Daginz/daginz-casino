/** Display helpers ported from the design's chain.jsx (fmt / shortAddr / shortHash). */

/** Format a CHIP amount (whole units) with thousands separators. */
export function fmt(n: number | string | bigint): string {
  const num = typeof n === 'bigint' ? Number(n) : typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function shortAddr(addr?: string | null): string {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function shortHash(hash?: string | null): string {
  if (!hash) return '—';
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}
