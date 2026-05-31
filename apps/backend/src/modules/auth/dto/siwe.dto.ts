import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ example: '0x1234abcd...', description: 'EVM wallet address' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'address must be a 0x EVM address' })
  address!: string;
}

export class VerifySiweDto {
  @ApiProperty({ description: 'The SIWE message the wallet signed' })
  @IsString()
  @MinLength(1)
  message!: string;

  @ApiProperty({ description: 'The signature produced by the wallet' })
  @IsString()
  @MinLength(1)
  signature!: string;
}
