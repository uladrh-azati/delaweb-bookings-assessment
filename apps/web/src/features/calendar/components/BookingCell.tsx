import type { Booking } from "../../../store/api";
import { timeRange, weekday } from "../calendar-date";

type BookingCellProps = {
  booking: Booking | undefined;
  isStart: boolean;
  isMine: boolean;
  isPast: boolean;
  disabled: boolean;
  day: Date;
  slotLabel: string;
  slotStart: Date;
  onSlotClick: (slotStart: Date) => void;
  onOpenHold: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  isCancelingBooking: boolean;
};

export function BookingCell({
  booking,
  isStart,
  isMine,
  isPast,
  disabled,
  day,
  slotLabel,
  slotStart,
  onSlotClick,
  onOpenHold,
  onCancelBooking,
  isCancelingBooking,
}: BookingCellProps) {
  const canOpenHold = booking?.status === "held" && isMine;

  if (booking) {
    return (
      <div
        sx={{
          minHeight: 54,
          borderTop: "1px solid",
          borderLeft: "1px solid",
          borderColor: "gray-100",
          p: 1,
          bg:
            booking.status === "held"
              ? "warning-yellow-3"
              : isMine
                ? "warning-green-3"
                : "purple-50",
        }}
      >
        {isStart && (
          <div
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              fontSize: 0,
              lineHeight: 1.25,
              color: "primary",
            }}
          >
            <strong>
              {booking.status === "held"
                ? isMine
                  ? "Your hold"
                  : "Held"
                : booking.userName}
            </strong>
            <span sx={{ color: "secondary" }}>
              {timeRange(booking.startTime, booking.endTime)}
            </span>
            {canOpenHold && (
              <button
                onClick={() => onOpenHold(booking)}
                sx={{
                  variant: "buttons.invisible",
                  p: 0,
                  justifyContent: "flex-start",
                  fontSize: 0,
                  color: "primary",
                  minHeight: 22,
                }}
              >
                Confirm
              </button>
            )}
            {booking.status === "confirmed" && isMine && (
              <button
                onClick={() => onCancelBooking(booking)}
                disabled={isCancelingBooking}
                sx={{
                  variant: "buttons.invisible",
                  p: 0,
                  justifyContent: "flex-start",
                  fontSize: 0,
                  color: "warning-red-1",
                  minHeight: 22,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSlotClick(slotStart)}
      disabled={disabled}
      sx={{
        minHeight: 54,
        border: 0,
        borderTop: "1px solid",
        borderLeft: "1px solid",
        borderColor: "gray-100",
        bg: isPast ? "gray-50" : "surface",
        cursor: disabled ? "default" : "pointer",
        color: "secondary",
        fontFamily: "inherit",
        "&:hover:not(:disabled)": {
          bg: "purple-25",
          boxShadow: "inset 0 0 0 1px #8057DB",
        },
      }}
      aria-label={`Book ${weekday(day)} ${slotLabel}`}
    />
  );
}
