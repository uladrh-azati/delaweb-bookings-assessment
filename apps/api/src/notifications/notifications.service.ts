import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { Observable, Subject } from 'rxjs';
import type { DatabaseTransactionConnection } from 'slonik';
import type { NotificationEvent } from './notifications.entity.js';
import { NotificationsRepo } from './notifications.repo.js';

const { Client } = pg;

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly changes = new Subject<NotificationEvent>();
  private listener?: pg.Client;

  constructor(
    private readonly notificationsRepo: NotificationsRepo,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.listener = new Client({
      connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
    });
    await this.listener.connect();
    this.listener.on('notification', (): void => {
      this.changes.next({ type: 'bookings.changed' });
    });
    await this.listener.query('listen booking_events');
  }

  async onModuleDestroy(): Promise<void> {
    await this.listener?.end();
  }

  bookingChanges(): Observable<NotificationEvent> {
    return this.changes.asObservable();
  }

  async notifyBookingsChanged(): Promise<void> {
    await this.notificationsRepo.notifyBookingsChanged();
  }

  async notifyBookingsChangedTx(
    tx: DatabaseTransactionConnection,
  ): Promise<void> {
    await this.notificationsRepo.notifyBookingsChangedTx(tx);
  }
}
