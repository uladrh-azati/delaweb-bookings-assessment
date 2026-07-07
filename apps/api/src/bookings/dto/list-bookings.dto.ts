import { Expose } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListBookingsDto {
  @Expose()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @Expose()
  @IsDateString()
  from!: string;

  @Expose()
  @IsDateString()
  to!: string;
}
