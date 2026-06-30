import { sql, type DatabaseTransactionConnection } from 'slonik';

export async function up(tx: DatabaseTransactionConnection): Promise<void> {
  await tx.query(sql.unsafe`
    create table bookings (
      id uuid primary key default gen_random_uuid(),
      room_id uuid not null references rooms(id),
      user_id uuid not null references users(id),
      start_time timestamptz not null,
      end_time timestamptz not null,
      status text not null check (status in ('held', 'confirmed', 'cancelled')),
      expires_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (end_time > start_time)
    )
  `);

  await tx.query(sql.unsafe`
    create table room_slot_claims (
      room_id uuid not null references rooms(id),
      slot_start timestamptz not null,
      booking_id uuid not null references bookings(id) on delete cascade,
      status text not null check (status in ('held', 'confirmed')),
      expires_at timestamptz,
      primary key (room_id, slot_start)
    )
  `);

  await tx.query(sql.unsafe`
    create table user_slot_claims (
      user_id uuid not null references users(id),
      slot_start timestamptz not null,
      booking_id uuid not null references bookings(id) on delete cascade,
      status text not null check (status in ('held', 'confirmed')),
      expires_at timestamptz,
      primary key (user_id, slot_start)
    )
  `);

  await tx.query(sql.unsafe`
    create index bookings_room_time_idx on bookings (room_id, start_time, end_time)
  `);

  await tx.query(sql.unsafe`
    create index bookings_user_time_idx on bookings (user_id, start_time, end_time)
  `);

  await tx.query(sql.unsafe`
    create index bookings_expired_holds_idx on bookings (expires_at)
    where status = 'held'
  `);
}

export async function down(tx: DatabaseTransactionConnection): Promise<void> {
  await tx.query(sql.unsafe`drop table user_slot_claims`);
  await tx.query(sql.unsafe`drop table room_slot_claims`);
  await tx.query(sql.unsafe`drop table bookings`);
}
