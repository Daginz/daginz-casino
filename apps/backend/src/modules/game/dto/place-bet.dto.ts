import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, Matches } from 'class-validator';
// NOTE: all DTOs need class-validator decorators — the global ValidationPipe
// runs forbidNonWhitelisted, so any undecorated field => 400.

export class PlaceBetDto {
  @ApiProperty({ example: 'slot-classic-3x3', description: 'Registered game id' })
  @IsString()
  gameId!: string;

  @ApiProperty({ example: '100', description: 'Stake in minor units (testnet credits)' })
  @IsString()
  @Matches(/^\d+$/, { message: 'stake must be a non-negative integer string' })
  stake!: string;

  @ApiProperty({
    example: {},
    description: 'Game-specific params (validated by the game definition)',
  })
  @IsObject()
  @IsOptional()
  params: Record<string, unknown> = {};

  @ApiPropertyOptional({ description: 'Use a free spin instead of the ledger balance' })
  @IsBoolean()
  @IsOptional()
  useFreeSpin?: boolean;
}
