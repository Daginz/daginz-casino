import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { env } from '@/config/env';
import { AppModule } from '@/composition/app.module';
import { DomainErrorFilter } from '@/shared/errors/domain-error.filter';
import { PG_POOL } from '@/shared/db/db.module';
import { runMigrations } from '@/shared/db/migrate';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Route Nest's own logs through pino, and use it as the app logger.
  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser()); // read the HTTP-only refresh-token cookie
  app.useGlobalFilters(new DomainErrorFilter(logger));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Backend-owned migrations (players, seeds, rounds, onchain).
  const pool = app.get<Pool>(PG_POOL);
  const migrationsDir = join(process.cwd(), '..', '..', 'infra', 'migrations');
  await runMigrations(pool, migrationsDir);

  const config = new DocumentBuilder()
    .setTitle('Casino API')
    .setDescription('Crypto casino backend (testnet)')
    .setVersion('0.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.BACKEND_PORT);
  logger.log(`backend listening on http://localhost:${env.BACKEND_PORT} (swagger: /docs)`);
}

void bootstrap();
