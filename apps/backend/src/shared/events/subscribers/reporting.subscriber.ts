import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from 'nestjs-pino';
import type { Job } from 'bullmq';
import { EVENTS_QUEUE, type DomainEvent } from '@/contracts/events.contract';

/**
 * Reporting subscriber — the reference consumer for the event bus.
 *
 * Demonstrates the pattern (one Processor over the shared queue, switching on
 * the event name) without yet persisting analytics: it logs each event so the
 * pipeline is observable end to end. A real Reporting service would aggregate
 * into ClickHouse here. Risk/CRM subscribers follow the same shape.
 *
 * A throwing handler causes BullMQ to retry (attempts/backoff from the queue
 * config); exhausted jobs stay in the failed set for inspection.
 */
@Processor(EVENTS_QUEUE)
export class ReportingSubscriber extends WorkerHost {
  constructor(private readonly logger: Logger) {
    super();
  }

  async process(job: Job<DomainEvent>): Promise<void> {
    const event = job.data;
    switch (event.name) {
      case 'game.round.completed':
        this.logger.log(
          `reporting: round completed player=${event.playerId} stake=${event.stake} payout=${event.payout}`,
        );
        break;
      case 'onchain.deposit.confirmed':
        this.logger.log(
          `reporting: deposit confirmed player=${event.playerId} chip=${event.chip}`,
        );
        break;
      case 'onchain.withdraw.sent':
        this.logger.log(
          `reporting: withdraw sent player=${event.playerId} chip=${event.chip}`,
        );
        break;
      default: {
        // Exhaustiveness guard — a new event type must be handled here.
        const _never: never = event;
        this.logger.warn(`reporting: unhandled event ${JSON.stringify(_never)}`);
      }
    }
  }
}
