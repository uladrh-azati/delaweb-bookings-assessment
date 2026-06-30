import { Expose, Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @Expose()
  @IsUUID()
  roomId!: string;

  @Expose()
  @IsDateString()
  startTime!: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @Expose()
  @IsOptional()
  @Transform(({ value }): number => Number(value))
  @IsInt()
  @IsIn([30, 60, 90, 120])
  durationMinutes?: number;
}
