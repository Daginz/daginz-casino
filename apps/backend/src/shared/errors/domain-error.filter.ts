import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';
import { DomainError } from './domain-error';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    traceId: string;
  };
}

/**
 * Single global filter: maps DomainError subclasses to HTTP envelopes, passes
 * through Nest HttpExceptions (e.g. validation 400, guard 401), and turns
 * anything else into a 500. The traceId in the envelope is the SAME per-request
 * id pino set on the response (x-trace-id header), so the client-visible id
 * correlates exactly with the server logs.
 */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (response.getHeader('x-trace-id') as string | undefined) ?? 'unknown';

    if (exception instanceof DomainError) {
      this.logger.warn(`${exception.code}: ${exception.message}`, DomainErrorFilter.name);
      this.send(response, exception.httpStatus, exception.code, exception.message, traceId);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();
      const message =
        typeof resBody === 'string'
          ? resBody
          : ((resBody as { message?: string | string[] }).message ?? exception.message);
      const flat = Array.isArray(message) ? message.join('; ') : message;
      this.logger.warn(`HTTP ${status}: ${flat}`, DomainErrorFilter.name);
      this.send(response, status, this.codeForStatus(status), flat, traceId);
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      { err: { message, stack }, method: request.method, url: request.url },
      'UNEXPECTED error',
    );
    this.send(response, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', 'Internal server error', traceId);
  }

  private send(res: Response, status: number, code: string, message: string, traceId: string): void {
    const body: ErrorEnvelope = { error: { code, message, traceId } };
    res.status(status).json(body);
  }

  private codeForStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    return 'HTTP_ERROR';
  }
}
