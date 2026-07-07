import { Injectable } from '@nestjs/common';
import { sql, type DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';
import { DbService } from '../database/db.service.js';
import type { Booking, BookingStatus, ClaimStatus } from './bookings.entity.js';

type DateLike = Date | string;

type BookingRow = {
  id: string;
  room_id: string;
  room_name: string;
  user_id: string;
  user_name: string;
  start_time: DateLike;
  end_time: DateLike;
  status: BookingStatus;
  expires_at: DateLike | null;
  created_at: DateLike;
  updated_at: DateLike;
};

type ListBookingsArgs = {
  roomId?: string;
  from: Date;
  to: Date;
};

type InsertBookingArgs = {
  roomId: string;
  userId: string;
  start: Date;
  end: Date;
  status: ClaimStatus;
  expiresAt: string | null;
};

type BookingOwnershipArgs = {
  id: string;
  userId: string;
};

type BookingIdArgs = {
  bookingId: string;
};

type ClaimCounts = {
  roomCount: number;
  userCount: number;
};

type ClaimRoomSlotArgs = {
  roomId: string;
  slot: Date;
  bookingId: string;
  status: ClaimStatus;
  expiresAt: string | null;
};

type ClaimUserSlotArgs = {
  userId: string;
  slot: Date;
  bookingId: string;
  status: ClaimStatus;
  expiresAt: string | null;
};

const dateLikeSchema = z.union([z.date(), z.string()]);
const bookingStatusSchema = z.enum(['held', 'confirmed', 'cancelled']);
const bookingRowSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  room_name: z.string(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  start_time: dateLikeSchema,
  end_time: dateLikeSchema,
  status: bookingStatusSchema,
  expires_at: dateLikeSchema.nullable(),
  created_at: dateLikeSchema,
  updated_at: dateLikeSchema,
});
const idRowSchema = z.object({
  id: z.string().uuid(),
});
const claimRowSchema = z.object({
  booking_id: z.string().uuid(),
});
const countRowSchema = z.object({
  count: z.union([z.number().int().nonnegative(), z.string()]),
});

@Injectable()
export class BookingsRepo {
  constructor(private readonly db: DbService) {}

  async transaction<T>(
    fn: (tx: DatabaseTransactionConnection) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(fn);
  }

  async list(args: ListBookingsArgs): Promise<readonly Booking[]> {
    const { roomId, from, to } = args;
    const rows = await this.db.query<BookingRow>(sql.type(bookingRowSchema)`
      select
        b.id,
        b.room_id,
        r.name as room_name,
        b.user_id,
        u.name as user_name,
        b.start_time,
        b.end_time,
        b.status,
        b.expires_at,
        b.created_at,
        b.updated_at
      from bookings b
      join rooms r on r.id = b.room_id
      join users u on u.id = b.user_id
      where (${roomId ?? null}::uuid is null or b.room_id = ${roomId ?? null}::uuid)
        and b.start_time < ${to.toISOString()}
        and b.end_time > ${from.toISOString()}
        and (
          b.status = 'confirmed'
          or (b.status = 'held' and b.expires_at > now())
        )
      order by b.start_time, r.name
    `);

    return rows.map((row): Booking => this.toEntity(row));
  }

  async insertTx(
    tx: DatabaseTransactionConnection,
    args: InsertBookingArgs,
  ): Promise<Booking | null> {
    const { roomId, userId, start, end, status, expiresAt } = args;
    const rows = await tx.any(sql.type(bookingRowSchema)`
      insert into bookings (room_id, user_id, start_time, end_time, status, expires_at)
      values (${roomId}, ${userId}, ${start.toISOString()}, ${end.toISOString()}, ${status}, ${expiresAt})
      returning
        id,
        room_id,
        (select name from rooms where rooms.id = bookings.room_id) as room_name,
        user_id,
        (select name from users where users.id = bookings.user_id) as user_name,
        start_time,
        end_time,
        status,
        expires_at,
        created_at,
        updated_at
    `);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async confirmHeldTx(
    tx: DatabaseTransactionConnection,
    args: BookingOwnershipArgs,
  ): Promise<Booking | null> {
    const { id, userId } = args;
    const rows = await tx.any(sql.type(bookingRowSchema)`
      update bookings
      set status = 'confirmed',
          expires_at = null,
          updated_at = now()
      where id = ${id}
        and user_id = ${userId}
        and status = 'held'
        and expires_at > now()
      returning
        id,
        room_id,
        (select name from rooms where rooms.id = bookings.room_id) as room_name,
        user_id,
        (select name from users where users.id = bookings.user_id) as user_name,
        start_time,
        end_time,
        status,
        expires_at,
        created_at,
        updated_at
    `);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findActiveHeldByIdTx(
    tx: DatabaseTransactionConnection,
    args: BookingOwnershipArgs,
  ): Promise<Booking | null> {
    const { id, userId } = args;
    const rows = await tx.any(sql.type(bookingRowSchema)`
      select
        id,
        room_id,
        (select name from rooms where rooms.id = bookings.room_id) as room_name,
        user_id,
        (select name from users where users.id = bookings.user_id) as user_name,
        start_time,
        end_time,
        status,
        expires_at,
        created_at,
        updated_at
      from bookings
      where id = ${id}
        and user_id = ${userId}
        and status = 'held'
        and expires_at > now()
      for update
    `);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async cancelConfirmedTx(
    tx: DatabaseTransactionConnection,
    args: BookingOwnershipArgs,
  ): Promise<Booking | null> {
    const { id, userId } = args;
    const rows = await tx.any(sql.type(bookingRowSchema)`
      update bookings
      set status = 'cancelled',
          expires_at = null,
          updated_at = now()
      where id = ${id}
        and user_id = ${userId}
        and status = 'confirmed'
      returning
        id,
        room_id,
        (select name from rooms where rooms.id = bookings.room_id) as room_name,
        user_id,
        (select name from users where users.id = bookings.user_id) as user_name,
        start_time,
        end_time,
        status,
        expires_at,
        created_at,
        updated_at
    `);

    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async confirmClaimsTx(
    tx: DatabaseTransactionConnection,
    args: BookingIdArgs,
  ): Promise<ClaimCounts> {
    const { bookingId } = args;
    const roomRows = await tx.any(sql.type(countRowSchema)`
      with updated as (
        update room_slot_claims
        set status = 'confirmed', expires_at = null
        where booking_id = ${bookingId}
          and status = 'held'
          and expires_at > now()
        returning 1
      )
      select count(*) as count from updated
    `);
    const userRows = await tx.any(sql.type(countRowSchema)`
      with updated as (
        update user_slot_claims
        set status = 'confirmed', expires_at = null
        where booking_id = ${bookingId}
          and status = 'held'
          and expires_at > now()
        returning 1
      )
      select count(*) as count from updated
    `);

    return {
      roomCount: Number(roomRows[0]?.count ?? 0),
      userCount: Number(userRows[0]?.count ?? 0),
    };
  }

  async deleteClaimsTx(
    tx: DatabaseTransactionConnection,
    args: BookingIdArgs,
  ): Promise<void> {
    const { bookingId } = args;
    await tx.query(
      sql.unsafe`delete from room_slot_claims where booking_id = ${bookingId}`,
    );
    await tx.query(
      sql.unsafe`delete from user_slot_claims where booking_id = ${bookingId}`,
    );
  }

  async claimRoomSlotTx(
    tx: DatabaseTransactionConnection,
    args: ClaimRoomSlotArgs,
  ): Promise<boolean> {
    const { roomId, slot, bookingId, status, expiresAt } = args;
    const rows = await tx.any(sql.type(claimRowSchema)`
      insert into room_slot_claims (room_id, slot_start, booking_id, status, expires_at)
      values (${roomId}, ${slot.toISOString()}, ${bookingId}, ${status}, ${expiresAt})
      on conflict (room_id, slot_start) do update
      set booking_id = excluded.booking_id,
          status = excluded.status,
          expires_at = excluded.expires_at
      where room_slot_claims.status = 'held'
        and room_slot_claims.expires_at <= now()
      returning booking_id
    `);

    return rows.length === 1;
  }

  async claimUserSlotTx(
    tx: DatabaseTransactionConnection,
    args: ClaimUserSlotArgs,
  ): Promise<boolean> {
    const { userId, slot, bookingId, status, expiresAt } = args;
    const rows = await tx.any(sql.type(claimRowSchema)`
      insert into user_slot_claims (user_id, slot_start, booking_id, status, expires_at)
      values (${userId}, ${slot.toISOString()}, ${bookingId}, ${status}, ${expiresAt})
      on conflict (user_id, slot_start) do update
      set booking_id = excluded.booking_id,
          status = excluded.status,
          expires_at = excluded.expires_at
      where user_slot_claims.status = 'held'
        and user_slot_claims.expires_at <= now()
      returning booking_id
    `);

    return rows.length === 1;
  }

  async deleteExpiredHolds(): Promise<number> {
    const rows = await this.db.query<{ id: string }>(sql.type(idRowSchema)`
      delete from bookings
      where status = 'held'
        and expires_at < now() - interval '1 day'
      returning id
    `);

    return rows.length;
  }

  private toEntity(row: BookingRow): Booking {
    return {
      id: row.id,
      roomId: row.room_id,
      roomName: row.room_name,
      userId: row.user_id,
      userName: row.user_name,
      startTime: this.toIso(row.start_time),
      endTime: this.toIso(row.end_time),
      status: row.status,
      expiresAt: row.expires_at ? this.toIso(row.expires_at) : null,
      createdAt: this.toIso(row.created_at),
      updatedAt: this.toIso(row.updated_at),
    };
  }

  private toRow(entity: Booking): BookingRow {
    return {
      id: entity.id,
      room_id: entity.roomId,
      room_name: entity.roomName,
      user_id: entity.userId,
      user_name: entity.userName,
      start_time: entity.startTime,
      end_time: entity.endTime,
      status: entity.status,
      expires_at: entity.expiresAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  private toIso(value: DateLike): string {
    return value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  }
}
