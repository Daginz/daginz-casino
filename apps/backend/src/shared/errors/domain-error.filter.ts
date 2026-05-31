import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { DomainError } from './domain-error';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    traceId: string;
  };
}

/**
 * Single global filter: maps DomainError subclasses to HTTP envelopes,
 * and anything else to 500. Every response carries a traceId.
 */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = randomUUID();

    if (exception instanceof DomainError) {
      this.logger.warn(`[${traceId}] ${exception.code}: ${exception.message}`);
      const body: ErrorEnvelope = {
        error: { code: exception.code, message: exception.message, traceId },
      };
      response.status(exception.httpStatus).json(body);
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Unknown error';
    this.logger.error(`[${traceId}] UNEXPECTED at ${request.method} ${request.url}: ${message}`);
    const body: ErrorEnvelope = {
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', traceId },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
