import 'reflect-metadata';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { config as loadDotenv } from 'dotenv';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import pg from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

loadDotenv({ path: '../../.env' });

const { Client } = pg;

type LoginResult = {
  token: string;
  user: {
    id: string;
    name: string;
  };
};

type Room = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: 'held' | 'confirmed' | 'cancelled';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let db: pg.Client;
  let rooms: Room[];

  beforeAll(async () => {
    db = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await db.connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    server = app.getHttpServer() as Server;
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await db.query('delete from bookings');
    await db.query('delete from users');

    const login = await loginAs('Alice');
    const res = await request(server)
      .get('/rooms')
      .set('Authorization', `Bearer ${login.token}`)
      .expect(200);
    rooms = res.body as Room[];
  });

  afterAll(async () => {
    await app.close();
    await db.end();
  });

  it('creates a hold, confirms it, and cancels the confirmed booking', async () => {
    const alice = await loginAs('Alice');
    const startTime = futureSlot(1);

    const hold = await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 60 })
      .expect(201);
    const holdBody = hold.body as Booking;

    expect(holdBody.status).toBe('held');
    expect(holdBody.expiresAt).toBeTruthy();

    const confirmed = await request(server)
      .post(`/bookings/${holdBody.id}/confirm`)
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(201);
    const confirmedBody = confirmed.body as Booking;

    expect(confirmedBody.status).toBe('confirmed');
    expect(confirmedBody.expiresAt).toBeNull();

    const cancelled = await request(server)
      .delete(`/bookings/${confirmedBody.id}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(200);
    const cancelledBody = cancelled.body as Booking;

    expect(cancelledBody.status).toBe('cancelled');
  });

  it('creates a direct booking', async () => {
    const alice = await loginAs('Alice');
    const res = await request(server)
      .post('/bookings')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        roomId: rooms[0].id,
        startTime: futureSlot(2),
        durationMinutes: 30,
      })
      .expect(201);
    const body = res.body as Booking;

    expect(body.status).toBe('confirmed');
  });

  it('rejects malformed booking ids before hitting the database', async () => {
    const alice = await loginAs('Alice');

    await request(server)
      .post('/bookings/not-a-uuid/confirm')
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(400);

    await request(server)
      .delete('/bookings/not-a-uuid')
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(400);
  });

  it('rejects past, non-aligned, and overlong bookings', async () => {
    const alice = await loginAs('Alice');

    await request(server)
      .post('/bookings')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        roomId: rooms[0].id,
        startTime: new Date(Date.now() - 60_000).toISOString(),
        durationMinutes: 30,
      })
      .expect(400);

    const nonAligned = new Date(futureSlot(3));
    nonAligned.setUTCMinutes(nonAligned.getUTCMinutes() + 7);
    await request(server)
      .post('/bookings')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        roomId: rooms[0].id,
        startTime: nonAligned.toISOString(),
        endTime: new Date(nonAligned.getTime() + 30 * 60_000).toISOString(),
      })
      .expect(400);

    await request(server)
      .post('/bookings')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        roomId: rooms[0].id,
        startTime: futureSlot(4),
        endTime: new Date(
          new Date(futureSlot(4)).getTime() + 150 * 60_000,
        ).toISOString(),
      })
      .expect(400);
  });

  it('blocks another user from an active room hold', async () => {
    const alice = await loginAs('Alice');
    const bob = await loginAs('Bob');
    const startTime = futureSlot(5);

    await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 })
      .expect(201);

    await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 })
      .expect(409);
  });

  it('blocks the same user from holding overlapping slots in another room', async () => {
    const alice = await loginAs('Alice');
    const startTime = futureSlot(6);

    await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 })
      .expect(201);

    await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ roomId: rooms[1].id, startTime, durationMinutes: 30 })
      .expect(409);
  });

  it('hides expired holds from reads and allows overwrite without cleanup', async () => {
    const alice = await loginAs('Alice');
    const bob = await loginAs('Bob');
    const startTime = futureSlot(7);

    const hold = await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 })
      .expect(201);
    const holdBody = hold.body as Booking;

    await db.query(
      "update bookings set expires_at = now() - interval '1 minute' where id = $1",
      [holdBody.id],
    );
    await db.query(
      "update room_slot_claims set expires_at = now() - interval '1 minute' where booking_id = $1",
      [holdBody.id],
    );
    await db.query(
      "update user_slot_claims set expires_at = now() - interval '1 minute' where booking_id = $1",
      [holdBody.id],
    );

    const list = await request(server)
      .get('/bookings')
      .query({
        roomId: rooms[0].id,
        from: new Date(new Date(startTime).getTime() - 60_000).toISOString(),
        to: new Date(new Date(startTime).getTime() + 60 * 60_000).toISOString(),
      })
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(200);
    expect(list.body).toEqual([]);

    await request(server)
      .post('/bookings/holds')
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 })
      .expect(201);
  });

  it('allows only one concurrent same-slot claim', async () => {
    const alice = await loginAs('Alice');
    const bob = await loginAs('Bob');
    const startTime = futureSlot(8);

    const results = await Promise.all([
      request(server)
        .post('/bookings/holds')
        .set('Authorization', `Bearer ${alice.token}`)
        .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 }),
      request(server)
        .post('/bookings/holds')
        .set('Authorization', `Bearer ${bob.token}`)
        .send({ roomId: rooms[0].id, startTime, durationMinutes: 30 }),
    ]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
  });

  async function loginAs(name: string): Promise<LoginResult> {
    const res = await request(server)
      .post('/auth/login')
      .send({ name: `${name}-${randomUUID()}` })
      .expect(200);
    return res.body as LoginResult;
  }
});

function futureSlot(offsetDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
}
