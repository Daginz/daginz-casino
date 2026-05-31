import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { env } from '@/config/env';
import { AppModule } from '@/composition/app.module';
import { DomainErrorFilter } from '@/shared/errors/domain-error.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new DomainErrorFilter());

  const config = new DocumentBuilder()
    .setTitle('Casino API')
    .setDescription('Crypto casino backend (testnet)')
    .setVersion('0.0.0')
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
