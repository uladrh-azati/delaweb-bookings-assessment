import { Expose } from 'class-transformer';
import { IsIn } from 'class-validator';

export class NotificationEventDto {
  @Expose()
  @IsIn(['bookings.changed'])
  type!: 'bookings.changed';
}
