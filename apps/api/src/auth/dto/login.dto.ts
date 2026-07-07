import { Expose } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Expose()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name: string;
}
