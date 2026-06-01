import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EVENT_BUS, EVENTS_QUEUE } from '@/contracts/events.contract';
import { env } from '@/config/env';
import { BullmqEventBus } from './bullmq-event-bus';
import { ReportingSubscriber } from './subscribers/reporting.subscriber';

function redisConnection(): { host: string; port: number } {
  const url = new URL(env.REDIS_URL);
  return { host: url.hostname, port: Number(url.port || 6379) };
}

/**
 * Async event bus on BullMQ (Redis). Global so any module can inject EVENT_BUS
 * to publish. Subscribers are Processors registered here.
 *
 * Failed jobs retry with backoff (BullMQ default + our opts) and land in the
 * queue's failed set — a dead-letter equivalent for inspection.
 */
@Global()
@Module({
  imports: [
    BullModule.forRoot({ connection: redisConnection() }),
    BullModule.registerQueue({
      name: EVENTS_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: false, // keep failures for inspection
      },
    }),
  ],
  providers: [
    { provide: EVENT_BUS, useClass: BullmqEventBus },
    ReportingSubscriber,
  ],
  exports: [EVENT_BUS],
})
export class EventsModule {}
