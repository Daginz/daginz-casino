import type { GameRoundId, PlayerId } from '@casino/contracts';

/**
 * Domain events published to the async bus. Producers (game engine, on-chain
 * listener) emit these after a committed write; subscribers (reporting, risk,
 * crm) react without blocking the producer's request path.
 *
 * Event names are stable strings — the BullMQ job name. Payloads are plain
 * JSON-serialisable data (bigint amounts as strings).
 */
export const EVENT_BUS = Symbol('EVENT_BUS');

/** The single BullMQ queue all domain events flow through. */
export const EVENTS_QUEUE = 'casino-events';

export type DomainEventName =
  | 'game.round.completed'
  | 'onchain.deposit.confirmed'
  | 'onchain.withdraw.sent';

export interface GameRoundCompleted {
  name: 'game.round.completed';
  roundId: GameRoundId;
  playerId: PlayerId;
  game: string;
  stake: string; // minor units (CHIP), serialised bigint
  payout: string;
  createdAt: string; // ISO
}

export interface OnchainDepositConfirmed {
  name: 'onchain.deposit.confirmed';
  playerId: PlayerId;
  chip: string; // whole CHIP credited, serialised bigint
  txHash: string;
}

export interface OnchainWithdrawSent {
  name: 'onchain.withdraw.sent';
  playerId: PlayerId;
  chip: string;
  txHash: string;
  withdrawalId: string;
}

export type DomainEvent = GameRoundCompleted | OnchainDepositConfirmed | OnchainWithdrawSent;

export interface IEventBus {
  /** Publish a domain event. Fire-and-forget from the caller's perspective. */
  publish(event: DomainEvent): Promise<void>;
}
