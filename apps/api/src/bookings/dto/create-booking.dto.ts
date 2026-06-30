import { IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  roomId!: string;

  startTime!: string;

  endTime!: string;
}
