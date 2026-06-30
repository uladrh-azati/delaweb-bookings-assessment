import { Expose, Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';

export class LoginUserDto {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsString()
  name!: string;
}

export class LoginResultDto {
  @Expose()
  @IsString()
  token!: string;

  @Expose()
  @ValidateNested()
  @Type(() => LoginUserDto)
  user!: LoginUserDto;
}
