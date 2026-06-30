import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service.js';
import { BookingsRepo } from './bookings.repo.js';
import type { CleanupExpiredHoldsDto } from './dto/index.js';

@Injectable()
export class BookingsCleanupService {
  constructor(
    private readonly bookingsRepo: BookingsRepo,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 */15 * * * *')
  async cleanupExpiredHoldsCron(): Promise<void> {
    await this.cleanupExpiredHolds();
  }

  async cleanupExpiredHolds(): Promise<CleanupExpiredHoldsDto> {
    const deletedCount = await this.bookingsRepo.deleteExpiredHolds();

    if (deletedCount > 0) {
      await this.notifications.notifyBookingsChanged();
    }

    return { deletedCount };
  }
}
