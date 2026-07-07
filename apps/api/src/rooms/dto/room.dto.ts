import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

export class RoomDto {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsString()
  name!: string;
}
