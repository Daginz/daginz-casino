import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

interface NonceEntry {
  expiresAt: number;
}

/**
 * Short-lived SIWE nonce store. In-memory with TTL — adequate for a
 * single-instance testnet. For multi-instance, swap for Redis behind the
 * same small interface (issue/consume).
 */
@Injectable()
export class NonceStore {
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly nonces = new Map<string, NonceEntry>();

  issue(): { nonce: string; issuedAt: Date } {
    this.sweep();
    const nonce = randomBytes(16).toString('hex');
    this.nonces.set(nonce, { expiresAt: Date.now() + this.ttlMs });
    return { nonce, issuedAt: new Date() };
  }

  /** Consume a nonce once; returns false if missing or expired (replay-safe). */
  consume(nonce: string): boolean {
    const entry = this.nonces.get(nonce);
    if (!entry) return false;
    this.nonces.delete(nonce);
    return entry.expiresAt > Date.now();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [nonce, entry] of this.nonces) {
      if (entry.expiresAt <= now) this.nonces.delete(nonce);
    }
  }
}
