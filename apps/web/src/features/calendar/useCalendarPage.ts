import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../../lib/auth";
import type { AppDispatch } from "../../store";
import {
  api,
  useBookingsQuery,
  useCancelBookingMutation,
  useConfirmHoldMutation,
  useCreateHoldMutation,
  useMeQuery,
  useRoomsQuery,
} from "../../store/api";
import type { Booking, Me, Room } from "../../store/api";
import { buildSlots, buildWeekDays, addDays, startOfWeek } from "./calendar-date";

type UseCalendarPageResult = {
  me: Me | undefined;
  rooms: Room[];
  roomId: string;
  weekStart: Date;
  weekEnd: Date;
  days: Date[];
  slots: ReturnType<typeof buildSlots>;
  bookings: Booking[];
  durationMinutes: number;
  activeHold: Booking | null;
  message: string;
  isUpdating: boolean;
  isCreatingHold: boolean;
  isConfirmingHold: boolean;
  isCancelingBooking: boolean;
  onSelectRoom: (roomId: string) => void;
  onPreviousWeek: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onSelectDuration: (durationMinutes: number) => void;
  onSlotClick: (slotStart: Date) => Promise<void>;
  onOpenHold: (booking: Booking) => void;
  onConfirmHold: () => Promise<void>;
  onDismissHold: () => void;
  onCancelBooking: (booking: Booking) => Promise<void>;
  onLogout: () => void;
};

export function useCalendarPage(): UseCalendarPageResult {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data: me } = useMeQuery();
  const { data: rooms = [] } = useRoomsQuery();
  const [roomId, setRoomId] = useState("");
  const [weekStart, setWeekStart] = useState((): Date => startOfWeek(new Date()));
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [activeHold, setActiveHold] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");

  useEffect((): void => {
    if (!roomId && rooms[0]) setRoomId(rooms[0].id);
  }, [roomId, rooms]);

  const weekEnd = useMemo((): Date => addDays(weekStart, 7), [weekStart]);
  const bookingQuery = useMemo(
    (): { roomId: string; from: string; to: string } => ({
      roomId,
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
    }),
    [roomId, weekEnd, weekStart],
  );
  const { data: bookings = [], isFetching } = useBookingsQuery(bookingQuery, {
    skip: !roomId,
  });
  const [createHold, createHoldState] = useCreateHoldMutation();
  const [confirmHold, confirmHoldState] = useConfirmHoldMutation();
  const [cancelBooking, cancelBookingState] = useCancelBookingMutation();

  useEffect((): (() => void) => {
    const onFocus = (): void => {
      dispatch(api.util.invalidateTags(["Bookings"]));
    };
    window.addEventListener("focus", onFocus);
    return (): void => window.removeEventListener("focus", onFocus);
  }, [dispatch]);

  useEffect((): (() => void) | undefined => {
    const nextExpiry = bookings
      .filter((booking): boolean => booking.status === "held" && Boolean(booking.expiresAt))
      .map((booking): number => new Date(booking.expiresAt!).getTime())
      .filter((expiry): boolean => expiry > Date.now())
      .sort((a, b): number => a - b)[0];

    if (!nextExpiry) return undefined;
    const timeout = window.setTimeout((): void => {
      dispatch(api.util.invalidateTags(["Bookings"]));
    }, Math.max(nextExpiry - Date.now() + 500, 500));
    return (): void => window.clearTimeout(timeout);
  }, [bookings, dispatch]);

  useEffect((): (() => void) | undefined => {
    if (!activeHold?.expiresAt) return undefined;

    const expiresAt = new Date(activeHold.expiresAt).getTime();
    if (expiresAt <= Date.now()) {
      setActiveHold(null);
      setMessage("The hold expired before it could be confirmed.");
      return undefined;
    }

    const timeout = window.setTimeout((): void => {
      setActiveHold((currentHold): Booking | null =>
        currentHold?.id === activeHold.id ? null : currentHold,
      );
      setMessage("The hold expired before it could be confirmed.");
    }, Math.max(expiresAt - Date.now() + 500, 500));

    return (): void => window.clearTimeout(timeout);
  }, [activeHold]);

  useEffect((): void => {
    if (!activeHold) return;

    const syncedHold = bookings.find(
      (booking): boolean => booking.id === activeHold.id,
    );
    if (syncedHold && syncedHold.status !== "held") {
      setActiveHold(null);
    }
  }, [activeHold, bookings]);

  const days = useMemo((): Date[] => buildWeekDays(weekStart), [weekStart]);
  const slots = useMemo((): ReturnType<typeof buildSlots> => buildSlots(), []);

  const onLogout = (): void => {
    clearToken();
    navigate("/login");
  };

  const onSlotClick = async (slotStart: Date): Promise<void> => {
    if (!roomId || slotStart <= new Date()) return;
    setMessage("");
    try {
      const hold = await createHold({
        roomId,
        startTime: slotStart.toISOString(),
        durationMinutes,
      }).unwrap();
      setActiveHold(hold);
    } catch {
      setMessage("That time is no longer available.");
    }
  };

  const onOpenHold = (booking: Booking): void => {
    if (booking.status !== "held" || booking.userId !== me?.userId) return;
    setMessage("");
    setActiveHold(booking);
  };

  const onConfirmHold = async (): Promise<void> => {
    if (!activeHold) return;
    setMessage("");
    try {
      await confirmHold(activeHold.id).unwrap();
      setActiveHold(null);
    } catch {
      setMessage("The hold expired before it could be confirmed.");
    }
  };

  const onCancelBooking = async (booking: Booking): Promise<void> => {
    setMessage("");
    try {
      await cancelBooking(booking.id).unwrap();
    } catch {
      setMessage("Could not cancel that booking.");
    }
  };

  return {
    me,
    rooms,
    roomId,
    weekStart,
    weekEnd,
    days,
    slots,
    bookings,
    durationMinutes,
    activeHold,
    message,
    isUpdating: isFetching || createHoldState.isLoading,
    isCreatingHold: createHoldState.isLoading,
    isConfirmingHold: confirmHoldState.isLoading,
    isCancelingBooking: cancelBookingState.isLoading,
    onSelectRoom: setRoomId,
    onPreviousWeek: (): void => setWeekStart(addDays(weekStart, -7)),
    onCurrentWeek: (): void => setWeekStart(startOfWeek(new Date())),
    onNextWeek: (): void => setWeekStart(addDays(weekStart, 7)),
    onSelectDuration: setDurationMinutes,
    onSlotClick,
    onOpenHold,
    onConfirmHold,
    onDismissHold: (): void => setActiveHold(null),
    onCancelBooking,
    onLogout,
  };
}
