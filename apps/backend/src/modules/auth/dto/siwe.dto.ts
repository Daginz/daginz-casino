import { ApiProperty } from '@nestjs/swagger';

export class CreateChallengeDto {
  @ApiProperty({ example: '0x1234abcd...', description: 'EVM wallet address' })
  address!: string;
}

export class VerifySiweDto {
  @ApiProperty({ description: 'The SIWE message the wallet signed' })
  message!: string;

  @ApiProperty({ description: 'The signature produced by the wallet' })
  signature!: string;
}
