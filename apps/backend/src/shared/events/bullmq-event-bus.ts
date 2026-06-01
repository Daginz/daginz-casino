import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Logger } from 'nestjs-pino';
import {
  EVENTS_QUEUE,
  type DomainEvent,
  type IEventBus,
} from '@/contracts/events.contract';

/**
 * Publishes domain events onto the BullMQ queue. The job name is the event name
 * so subscribers can switch on it. Publishing failures are logged, not thrown —
 * a producer must not fail its own transaction because the bus hiccuped (the
 * write already committed; the event is best-effort + retried by BullMQ).
 */
@Injectable()
export class BullmqEventBus implements IEventBus {
  constructor(
    @InjectQueue(EVENTS_QUEUE) private readonly queue: Queue,
    private readonly logger: Logger,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.queue.add(event.name, event);
    } catch (err) {
      this.logger.error(
        { err: String(err), event: event.name },
        'failed to publish domain event',
      );
    }
  }
}
