import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { env } from '@/config/env';
import { AppModule } from '@/composition/app.module';
import { DomainErrorFilter } from '@/shared/errors/domain-error.filter';
import { PG_POOL } from '@/shared/db/db.module';
import { runMigrations } from '@/shared/db/migrate';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new DomainErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Apply backend-owned migrations (players). Migrations live at repo-root infra/migrations.
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

  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${env.BACKEND_PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[backend] swagger on http://localhost:${env.BACKEND_PORT}/docs`);
}

void bootstrap();
