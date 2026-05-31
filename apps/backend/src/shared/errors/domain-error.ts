import { HttpStatus } from '@nestjs/common';

/**
 * Base class for all expected domain failures.
 * Mapped to HTTP by the global DomainErrorFilter.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: HttpStatus;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = HttpStatus.BAD_REQUEST;
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly httpStatus = HttpStatus.CONFLICT;
}

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly httpStatus = HttpStatus.CONFLICT;
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly httpStatus = HttpStatus.UNAUTHORIZED;
}

export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly httpStatus = HttpStatus.BAD_GATEWAY;
}
