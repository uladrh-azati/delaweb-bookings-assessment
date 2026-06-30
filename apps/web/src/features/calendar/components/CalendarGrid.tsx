import { Fragment } from "react";
import type { Booking, Me } from "../../../store/api";
import { getBookingCellState } from "../calendar-bookings";
import {
  dateAtMinutes,
  monthDay,
  type CalendarSlot,
  weekday,
} from "../calendar-date";
import { BookingCell } from "./BookingCell";

type CalendarGridProps = {
  days: Date[];
  slots: CalendarSlot[];
  bookings: Booking[];
  me: Me | undefined;
  isCreatingHold: boolean;
  isCancelingBooking: boolean;
  onSlotClick: (slotStart: Date) => void;
  onCancelBooking: (booking: Booking) => void;
};

export function CalendarGrid({
  days,
  slots,
  bookings,
  me,
  isCreatingHold,
  isCancelingBooking,
  onSlotClick,
  onCancelBooking,
}: CalendarGridProps) {
  return (
    <div
      sx={{
        bg: "surface",
        border: "1px solid",
        borderColor: "gray-200",
        borderRadius: "8px",
        boxShadow: "card",
        overflow: "auto",
      }}
    >
      <div
        sx={{
          minWidth: 900,
          display: "grid",
          gridTemplateColumns: "72px repeat(7, minmax(112px, 1fr))",
        }}
      >
        <div
          sx={{
            bg: "gray-50",
            borderBottom: "1px solid",
            borderColor: "gray-200",
          }}
        />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            sx={{
              bg: "gray-50",
              borderBottom: "1px solid",
              borderLeft: "1px solid",
              borderColor: "gray-200",
              px: 2,
              py: 2,
              minHeight: 56,
            }}
          >
            <strong sx={{ display: "block", fontSize: 1 }}>
              {weekday(day)}
            </strong>
            <span sx={{ color: "secondary", fontSize: 0 }}>
              {monthDay(day)}
            </span>
          </div>
        ))}

        {slots.map((slot) => (
          <Fragment key={`row-${slot.minutes}`}>
            <div
              key={`time-${slot.minutes}`}
              sx={{
                borderTop: "1px solid",
                borderColor: "gray-100",
                px: 2,
                py: 2,
                color: "secondary",
                fontSize: 0,
                bg: "gray-25",
              }}
            >
              {slot.label}
            </div>
            {days.map((day) => {
              const slotStart = dateAtMinutes(day, slot.minutes);
              const state = getBookingCellState({
                bookings,
                slotStart,
                userId: me?.userId,
                isCreatingHold,
              });

              return (
                <BookingCell
                  key={`${day.toISOString()}-${slot.minutes}`}
                  {...state}
                  day={day}
                  slotLabel={slot.label}
                  slotStart={slotStart}
                  onSlotClick={onSlotClick}
                  onCancelBooking={onCancelBooking}
                  isCancelingBooking={isCancelingBooking}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
