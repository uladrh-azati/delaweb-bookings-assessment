import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class BookingDto {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsUUID()
  roomId!: string;

  @Expose()
  @IsString()
  roomName!: string;

  @Expose()
  @IsUUID()
  userId!: string;

  @Expose()
  @IsString()
  userName!: string;

  @Expose()
  @IsDateString()
  startTime!: string;

  @Expose()
  @IsDateString()
  endTime!: string;

  @Expose()
  @IsIn(['held', 'confirmed', 'cancelled'])
  status!: 'held' | 'confirmed' | 'cancelled';

  @Expose()
  @IsOptional()
  @IsDateString()
  expiresAt!: string | null;

  @Expose()
  @IsDateString()
  createdAt!: string;

  @Expose()
  @IsDateString()
  updatedAt!: string;
}
