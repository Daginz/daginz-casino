import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsString, Matches } from 'class-validator';
// NOTE: all SIWE/game/PF DTOs need class-validator decorators — the global
// ValidationPipe runs forbidNonWhitelisted, so any undecorated field => 400.

export class PlaceBetDto {
  @ApiProperty({ enum: ['dice', 'crash', 'slot'], example: 'dice' })
  @IsIn(['dice', 'crash', 'slot'])
  game!: 'dice' | 'crash' | 'slot';

  @ApiProperty({ example: '100', description: 'Stake in minor units (testnet credits)' })
  @IsString()
  @Matches(/^\d+$/, { message: 'amount must be a non-negative integer string' })
  amount!: string;

  @ApiProperty({ example: 'player-chosen-seed' })
  @IsString()
  clientSeed!: string;

  @ApiProperty({
    example: { target: 50 },
    description: 'Game-specific params (e.g. dice target 0-99)',
  })
  @IsObject()
  params!: Record<string, number>;
}
