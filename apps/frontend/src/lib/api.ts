/**
 * Thin typed client for the casino backend (NestJS, default :4000).
 * Holds the SIWE-issued JWT in memory + localStorage and attaches it as a
 * Bearer token. Errors surface the backend's `{ error: { code, message } }`
 * envelope so callers can show a meaningful toast.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'dgz_jwt';

let token: string | null = null;

export function setToken(next: string | null): void {
  token = next;
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* SSR / private mode — in-memory token still works for the session */
  }
}

export function getToken(): string | null {
  if (token) return token;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; traceId?: string };
  message?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const t = getToken();
  if (t) headers.set('authorization', `Bearer ${t}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let code = 'UNKNOWN';
    let message = `Request failed (${res.status})`;
    let traceId: string | undefined;
    try {
      const body = (await res.json()) as ErrorEnvelope;
      code = body.error?.code ?? code;
      message = body.error?.message ?? body.message ?? message;
      traceId = body.error?.traceId;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message, traceId);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
};

// ── Endpoint response shapes (mirror the NestJS controllers) ─────────────────

export interface SiweChallenge {
  nonce: string;
  issuedAt: string;
}

export interface Player {
  id: string;
  walletAddress: string;
  createdAt: string;
}

export interface VerifyResult {
  player: Player;
  accessToken: string;
}

export interface BalanceResult {
  playerId: string;
  amount: string; // CHIP minor units
}

export interface SlotWin {
  line: number;
  symbol: string;
  multiplier: number;
  lineWin: string;
}

export interface RoundResult {
  id: string;
  game: string;
  stake: string;
  payout: string;
  outcome: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  detail: { grid: string[][]; wins: SlotWin[] };
  createdAt: string;
}

export interface Commitment {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface RevealResult {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}
