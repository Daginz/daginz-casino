import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { env } from '@/config/env';

/** DI token for the shared pg Pool. */
export const PG_POOL = Symbol('PG_POOL');

/**
 * Global module exposing a single pg Pool. Repositories inject PG_POOL and
 * own their own SQL — no ORM (per arch rules: repository pattern, no leak).
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: (): Pool => new Pool({ connectionString: env.DATABASE_URL }),
    },
  ],
  exports: [PG_POOL],
})
export class DbModule {}
