import { ConflictException, Injectable } from '@nestjs/common';
import { sql } from 'slonik';
import { DbService } from '../database/db.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly db: DbService) {}

  async create(dto: CreateBookingDto, userId: string) {
    const conflict = await this.db.query(sql.unsafe`
      select id from bookings
      where room_id = ${dto.roomId}
        and start_time < ${dto.endTime}
        and end_time > ${dto.startTime}
      limit 1
    `);
    if (conflict.length > 0) {
      throw new ConflictException('Slot already booked');
    }
    return this.db.query(sql.unsafe`
      insert into bookings (room_id, user_id, start_time, end_time)
      values (${dto.roomId}, ${userId}, ${dto.startTime}, ${dto.endTime})
      returning *
    `);
  }
}
