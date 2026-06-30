import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { NotificationsService } from './notifications.service.js';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.notifications
      .bookingChanges()
      .pipe(map((event): MessageEvent => ({ data: event })));
  }
}
