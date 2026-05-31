/**
 * Branded domain identifiers — shared across backend and frontend.
 * Prevents mixing raw strings (e.g. passing a GameRoundId where a PlayerId is expected).
 */
export type PlayerId = string & { readonly __brand: 'PlayerId' };
export type GameRoundId = string & { readonly __brand: 'GameRoundId' };
export type WalletAddress = string & { readonly __brand: 'WalletAddress' };
export type LedgerEntryId = string & { readonly __brand: 'LedgerEntryId' };

export const asPlayerId = (id: string): PlayerId => id as PlayerId;
export const asGameRoundId = (id: string): GameRoundId => id as GameRoundId;
export const asWalletAddress = (a: string): WalletAddress => a as WalletAddress;
