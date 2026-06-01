import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from '@/config/env';

/**
 * Structured logging for the whole app.
 *
 * - pino emits JSON lines (machine-parseable) in production; pretty-printed in
 *   dev for human reading.
 * - Every request gets a traceId (from an inbound x-trace-id header if present,
 *   else a fresh uuid). pino-http attaches it to a per-request child logger, so
 *   EVERY log line within a request — and the response — carries the same id.
 * - The id is echoed back in the x-trace-id response header, so a client (or the
 *   DomainErrorFilter envelope) can correlate a failure with server logs.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } },
        // Correlation id per request.
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const existing = req.headers['x-trace-id'];
          const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
          res.setHeader('x-trace-id', id);
          return id;
        },
        // Trim noisy default fields; keep what matters.
        customProps: () => ({ service: 'backend' }),
        autoLogging: {
          ignore: (req: IncomingMessage) => req.url === '/health',
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        serializers: {
          req: (req: { method: string; url: string; id: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
      },
    }),
  ],
})
export class LoggingModule {}
