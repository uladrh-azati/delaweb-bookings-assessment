import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service.js';
import { RoomsRepo } from '../rooms/rooms.repo.js';
import {
  HOLD_MINUTES,
  MAX_BOOKING_MS,
  MAX_SLOTS_PER_BOOKING,
  SLOT_MINUTES,
  SLOT_MS,
} from './booking.constants.js';
import type { Booking, ClaimStatus } from './bookings.entity.js';
import { BookingsRepo } from './bookings.repo.js';
import { CreateBookingDto, ListBookingsDto } from './dto/index.js';

type UserBookingArgs = {
  dto: CreateBookingDto;
  userId: string;
};

type BookingOwnershipArgs = {
  id: string;
  userId: string;
};

type BookingWindow = {
  start: Date;
  end: Date;
  slots: readonly Date[];
};

type CreateBookingWithStatusArgs = UserBookingArgs & {
  status: ClaimStatus;
};

type ParseDateArgs = {
  value: string;
  field: string;
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepo: BookingsRepo,
    private readonly notifications: NotificationsService,
    private readonly roomsRepo: RoomsRepo,
  ) {}

  async list(dto: ListBookingsDto): Promise<readonly Booking[]> {
    const from = this.parseDate({ value: dto.from, field: 'from' });
    const to = this.parseDate({ value: dto.to, field: 'to' });
    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }

    return this.bookingsRepo.list({
      roomId: dto.roomId,
      from,
      to,
    });
  }

  async create(args: UserBookingArgs): Promise<Booking> {
    return this.createWithStatus({ ...args, status: 'confirmed' });
  }

  async hold(args: UserBookingArgs): Promise<Booking> {
    return this.createWithStatus({ ...args, status: 'held' });
  }

  async confirm(args: BookingOwnershipArgs): Promise<Booking> {
    const { id, userId } = args;
    return this.bookingsRepo.transaction(async (tx): Promise<Booking> => {
      const booking = await this.bookingsRepo.findActiveHeldByIdTx(tx, {
        id,
        userId,
      });
      if (!booking) {
        throw new ConflictException(
          'Hold is not active or does not belong to you',
        );
      }

      const expectedSlotCount = this.getSlotCount(booking);
      const claimCounts = await this.bookingsRepo.confirmClaimsTx(tx, {
        bookingId: id,
      });
      if (
        claimCounts.roomCount !== expectedSlotCount ||
        claimCounts.userCount !== expectedSlotCount
      ) {
        throw new ConflictException('Hold is no longer available');
      }

      const confirmedBooking = await this.bookingsRepo.confirmHeldTx(tx, {
        id,
        userId,
      });
      if (!confirmedBooking) {
        throw new ConflictException('Hold is no longer available');
      }

      await this.notifications.notifyBookingsChangedTx(tx);
      return confirmedBooking;
    });
  }

  async cancel(args: BookingOwnershipArgs): Promise<Booking> {
    const { id, userId } = args;
    return this.bookingsRepo.transaction(async (tx): Promise<Booking> => {
      const booking = await this.bookingsRepo.cancelConfirmedTx(tx, {
        id,
        userId,
      });
      if (!booking) {
        throw new NotFoundException('Confirmed booking not found');
      }

      await this.bookingsRepo.deleteClaimsTx(tx, { bookingId: id });
      await this.notifications.notifyBookingsChangedTx(tx);
      return booking;
    });
  }

  private async createWithStatus(
    args: CreateBookingWithStatusArgs,
  ): Promise<Booking> {
    const { dto, userId, status } = args;
    const { start, end, slots } = this.validateBookingWindow(dto);
    const expiresAt =
      status === 'held'
        ? new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString()
        : null;

    return this.bookingsRepo.transaction(async (tx): Promise<Booking> => {
      const room = await this.roomsRepo.findByIdTx(tx, { id: dto.roomId });
      if (!room) {
        throw new BadRequestException('Room does not exist');
      }

      const booking = await this.bookingsRepo.insertTx(tx, {
        roomId: dto.roomId,
        userId,
        start,
        end,
        status,
        expiresAt,
      });
      if (!booking) {
        throw new ConflictException('Booking could not be created');
      }

      for (const slot of slots) {
        const roomClaimed = await this.bookingsRepo.claimRoomSlotTx(tx, {
          roomId: dto.roomId,
          slot,
          bookingId: booking.id,
          status,
          expiresAt,
        });
        if (!roomClaimed) {
          throw new ConflictException('Room slot is not available');
        }

        const userClaimed = await this.bookingsRepo.claimUserSlotTx(tx, {
          userId,
          slot,
          bookingId: booking.id,
          status,
          expiresAt,
        });
        if (!userClaimed) {
          throw new ConflictException(
            'You already have a booking at that time',
          );
        }
      }

      await this.notifications.notifyBookingsChangedTx(tx);
      return booking;
    });
  }

  private validateBookingWindow(dto: CreateBookingDto): BookingWindow {
    const start = this.parseDate({ value: dto.startTime, field: 'startTime' });
    let end: Date;
    if (dto.durationMinutes) {
      end = new Date(start.getTime() + dto.durationMinutes * 60 * 1000);
    } else if (dto.endTime) {
      end = this.parseDate({ value: dto.endTime, field: 'endTime' });
    } else {
      throw new BadRequestException('durationMinutes or endTime is required');
    }

    const durationMs = end.getTime() - start.getTime();
    if (start <= new Date()) {
      throw new BadRequestException('Bookings must start in the future');
    }
    if (!this.isAlignedToSlot(start) || !this.isAlignedToSlot(end)) {
      throw new BadRequestException(
        `Bookings must align to ${SLOT_MINUTES}-minute slots`,
      );
    }
    if (
      durationMs < SLOT_MS ||
      durationMs > MAX_BOOKING_MS ||
      durationMs % SLOT_MS !== 0
    ) {
      throw new BadRequestException(
        `Bookings must cover 1-${MAX_SLOTS_PER_BOOKING} consecutive slots`,
      );
    }

    const slots: Date[] = [];
    for (let time = start.getTime(); time < end.getTime(); time += SLOT_MS) {
      slots.push(new Date(time));
    }
    return { start, end, slots };
  }

  private parseDate(args: ParseDateArgs): Date {
    const { value, field } = args;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }
    return date;
  }

  private isAlignedToSlot(date: Date): boolean {
    return (
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0 &&
      date.getUTCMinutes() % SLOT_MINUTES === 0
    );
  }

  private getSlotCount(booking: Booking): number {
    return (
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
      SLOT_MS
    );
  }
}
