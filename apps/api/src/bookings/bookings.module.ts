import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RoomsRepo } from '../rooms/rooms.repo.js';
import { BookingsCleanupService } from './bookings-cleanup.service.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsRepo } from './bookings.repo.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCleanupService, BookingsRepo, RoomsRepo],
  exports: [BookingsService],
})
export class BookingsModule {}
