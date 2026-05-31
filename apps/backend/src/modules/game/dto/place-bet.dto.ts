import { ApiProperty } from '@nestjs/swagger';

export class PlaceBetDto {
  @ApiProperty({ enum: ['dice', 'crash', 'slot'], example: 'dice' })
  game!: 'dice' | 'crash' | 'slot';

  @ApiProperty({ example: '100', description: 'Stake in minor units (testnet credits)' })
  amount!: string;

  @ApiProperty({ example: 'player-chosen-seed' })
  clientSeed!: string;

  @ApiProperty({
    example: { target: 50 },
    description: 'Game-specific params (e.g. dice target 0-99)',
  })
  params!: Record<string, number>;
}
