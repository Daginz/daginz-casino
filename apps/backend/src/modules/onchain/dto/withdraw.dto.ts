import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
// class-validator decorators required — global ValidationPipe whitelists fields.

export class WithdrawDto {
  @ApiProperty({ example: '100', description: 'Amount in whole CHIP to withdraw on-chain' })
  @IsString()
  @Matches(/^\d+$/, { message: 'amount must be a positive integer string' })
  amount!: string;
}
