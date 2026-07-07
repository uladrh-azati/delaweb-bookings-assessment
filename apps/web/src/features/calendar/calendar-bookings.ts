import type { Booking } from "../../store/api";

export type BookingCellState = {
  booking: Booking | undefined;
  isStart: boolean;
  isMine: boolean;
  isPast: boolean;
  disabled: boolean;
};

export type BookingCellStateArgs = {
  bookings: readonly Booking[];
  slotStart: Date;
  userId: string | undefined;
  isCreatingHold: boolean;
};

export function bookingForSlot(
  bookings: readonly Booking[],
  slotStart: Date,
): Booking | undefined {
  const time = slotStart.getTime();
  return bookings.find(
    (booking): boolean =>
      new Date(booking.startTime).getTime() <= time &&
      new Date(booking.endTime).getTime() > time,
  );
}

export function getBookingCellState(
  args: BookingCellStateArgs,
): BookingCellState {
  const { bookings, slotStart, userId, isCreatingHold } = args;
  const booking = bookingForSlot(bookings, slotStart);
  const isStart = booking
    ? sameTime(new Date(booking.startTime), slotStart)
    : false;
  const isMine = booking?.userId === userId;
  const isPast = slotStart <= new Date();

  return {
    booking,
    isStart,
    isMine,
    isPast,
    disabled: Boolean(booking) || isPast || isCreatingHold,
  };
}

function sameTime(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}
