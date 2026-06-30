# Booking App

## The problem

Build a multi-user appointment booking app.

- Multiple users sign in with a name and book 30-minute slots in shared rooms.
- A booking can cover 1–4 consecutive slots in a single request, up to 2 hours. All slots must be in the same room and free at the time of booking; if any slot isn't available, the booking doesn't go through.
- A user can cancel their own bookings.
- A user can't have two bookings overlapping in time, even across different rooms.
- People on different devices stay in sync as bookings come and go.
- Past slots can't be booked, and the calendar should reflect what's currently bookable for everyone looking at it.

The UI shows one room's week at a time with a way to switch rooms.

## Bonus (optional)

Hold a slot for 5 minutes while the user confirms.

- Clicking a free slot creates a hold and opens a confirmation dialog.
- While the hold is active, the slot is visible to other users as "held" (no name needed) and cannot be booked by anyone else.
- Clicking Confirm in the dialog converts the hold into a booking.
- The hold expires after 5 minutes. Closing the dialog leaves the hold to expire naturally, no explicit release needed.

This is optional. If you skip it, briefly describe how you'd approach it in DECISIONS.md.

## Stack

NestJS + Slonik (raw SQL, no ORM) + Postgres on the backend. React + Vite + RTK Query on the frontend. The boilerplate has these wired up. Other choices are fine if you justify them in DECISIONS.md.

## What's provided

- Working dev environment (`pnpm dev` starts API + web + DB)
- Auth (name-only login → JWT)
- Migration runner + initial schema for `users` and `rooms` (you design the `bookings` schema)
- Slonik pool wired into NestJS
- A `<Calendar />` placeholder and a RTK Query setup on the frontend
- One example e2e test

## What we look for

Working software, clear code, and honest tradeoffs. The UI should be mobile-friendly. We read DECISIONS.md carefully, so tell us what you built, what you skipped, and why. One feature done well beats five done sloppily.

## Time

We expect this to take 5–8 hours. Please don't exceed 10. If you run out of time, ship what works and explain what you'd do next in DECISIONS.md.

## Submission

Zip the repo (or push to a private repo and share access). Include:

- Working `pnpm dev`
- DECISIONS.md filled in

## Running locally

**Prereqs:** Node 22 (`.nvmrc` is provided, `nvm use`), pnpm 9+, Docker.

First-time setup:

```bash
cp .env.example .env
pnpm install
pnpm db:up        # boots Postgres in Docker, waits for healthcheck
pnpm migrate      # creates users + rooms tables
pnpm dev          # starts api on :3000, web on :5273
```

Open http://localhost:5273, login with any name and you're in.

### Useful scripts

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `pnpm dev`          | api + web in parallel, with watch                          |
| `pnpm db:up`        | start Postgres container (waits for healthcheck)           |
| `pnpm db:down`      | stop Postgres container, **keep data**                     |
| `pnpm db:reset`     | drop volume + restart + re-migrate (fresh DB, schema only) |
| `pnpm migrate`      | apply unapplied migrations                                 |
| `pnpm migrate:down` | revert the most recently applied migration                 |
| `pnpm build`        | build api + web for production                             |
| `pnpm test`         | run all tests                                              |

### Ports

- **API**: `http://localhost:3000`
- **Web**: `http://localhost:5273` (proxies `/api/*` → API)
- **Postgres**: `localhost:55432` (non-standard, to avoid colliding with a local Postgres)
