import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepo } from './notifications.repo.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepo],
  exports: [NotificationsService],
})
export class NotificationsModule {}
