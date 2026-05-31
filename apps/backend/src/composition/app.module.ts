import { Module } from '@nestjs/common';
import { HealthModule } from '@/modules/health/health.module';

/**
 * Root assembly. Feature modules are added here as they come online
 * (Block C: auth, game, provably-fair, bonus, ...).
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
