import { Injectable } from '@nestjs/common';
import { sql, type DatabaseTransactionConnection } from 'slonik';
import { DbService } from '../database/db.service.js';

@Injectable()
export class NotificationsRepo {
  constructor(private readonly db: DbService) {}

  async notifyBookingsChanged(): Promise<void> {
    await this.db.query(sql.unsafe`
      select pg_notify('booking_events', '{"type":"bookings.changed"}')
    `);
  }

  async notifyBookingsChangedTx(
    tx: DatabaseTransactionConnection,
  ): Promise<void> {
    await tx.query(sql.unsafe`
      select pg_notify('booking_events', '{"type":"bookings.changed"}')
    `);
  }
}
