import {
  CalendarGrid,
  CalendarHeader,
  ConfirmHoldDialog,
  DurationSelector,
  FeedbackMessage,
  RoomSelector,
  WeekControls,
} from "../features/calendar/components";
import { useCalendarPage } from "../features/calendar/useCalendarPage";

export default function Calendar() {
  const calendar = useCalendarPage();

  return (
    <div sx={{ p: [3, 4], maxWidth: 1220, mx: "auto" }}>
      <CalendarHeader
        me={calendar.me}
        weekStart={calendar.weekStart}
        weekEnd={calendar.weekEnd}
        onLogout={calendar.onLogout}
      />

      <div
        sx={{
          display: "flex",
          alignItems: ["stretch", "center"],
          justifyContent: "space-between",
          gap: 3,
          flexDirection: ["column", "row"],
          mb: 3,
        }}
      >
        <RoomSelector
          rooms={calendar.rooms}
          roomId={calendar.roomId}
          onSelectRoom={calendar.onSelectRoom}
        />
        <WeekControls
          onPreviousWeek={calendar.onPreviousWeek}
          onCurrentWeek={calendar.onCurrentWeek}
          onNextWeek={calendar.onNextWeek}
        />
      </div>

      <DurationSelector
        durationMinutes={calendar.durationMinutes}
        isUpdating={calendar.isUpdating}
        onSelectDuration={calendar.onSelectDuration}
      />

      <FeedbackMessage message={calendar.message} />

      <CalendarGrid
        days={calendar.days}
        slots={calendar.slots}
        bookings={calendar.bookings}
        me={calendar.me}
        isCreatingHold={calendar.isCreatingHold}
        isCancelingBooking={calendar.isCancelingBooking}
        onSlotClick={calendar.onSlotClick}
        onOpenHold={calendar.onOpenHold}
        onCancelBooking={calendar.onCancelBooking}
      />

      <ConfirmHoldDialog
        activeHold={calendar.activeHold}
        isConfirmingHold={calendar.isConfirmingHold}
        onDismissHold={calendar.onDismissHold}
        onConfirmHold={calendar.onConfirmHold}
      />
    </div>
  );
}
