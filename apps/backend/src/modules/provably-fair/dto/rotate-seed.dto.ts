import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RotateSeedDto {
  @ApiProperty({ example: 'my-lucky-seed', description: 'Player-chosen client seed' })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  clientSeed!: string;
}

export class VerifyDrawDto {
  @ApiProperty() @IsString() @MinLength(1) serverSeed!: string;
  @ApiProperty() @IsString() @MinLength(1) serverSeedHash!: string;
  @ApiProperty() @IsString() @MinLength(1) clientSeed!: string;
  @ApiProperty({ example: 0 }) @IsInt() @Min(0) nonce!: number;
  @ApiProperty({ example: 0.1234 }) @IsNumber() outcome!: number;
}
