import { fetchEventSource } from "@microsoft/fetch-event-source";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../lib/auth";

export type User = {
  id: string;
  name: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type Me = {
  userId: string;
  name: string;
};

export type Room = {
  id: string;
  name: string;
};

export type BookingStatus = "held" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRequest = {
  roomId: string;
  startTime: string;
  durationMinutes: number;
};

export type BookingQuery = {
  roomId?: string;
  from: string;
  to: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Bookings", "Rooms", "Me"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { name: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    me: builder.query<Me, void>({
      query: () => "/me",
      providesTags: ["Me"],
    }),
    rooms: builder.query<Room[], void>({
      query: () => "/rooms",
      providesTags: ["Rooms"],
    }),
    bookings: builder.query<Booking[], BookingQuery>({
      query: (params) => ({ url: "/bookings", params }),
      providesTags: ["Bookings"],
    }),
    bookingEvents: builder.query<null, void>({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(_, { cacheEntryRemoved, dispatch }) {
        const token = getToken();
        if (!token) return;

        const controller = new AbortController();
        void fetchEventSource("/api/bookings/events", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          onmessage: () => {
            dispatch(api.util.invalidateTags(["Bookings"]));
          },
          onerror: () => undefined,
        }).catch(() => undefined);

        await cacheEntryRemoved;
        controller.abort();
      },
    }),
    createBooking: builder.mutation<Booking, BookingRequest>({
      query: (body) => ({ url: "/bookings", method: "POST", body }),
      invalidatesTags: ["Bookings"],
    }),
    createHold: builder.mutation<Booking, BookingRequest>({
      query: (body) => ({ url: "/bookings/holds", method: "POST", body }),
      invalidatesTags: ["Bookings"],
    }),
    confirmHold: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}/confirm`, method: "POST" }),
      invalidatesTags: ["Bookings"],
    }),
    cancelBooking: builder.mutation<Booking, string>({
      query: (id) => ({ url: `/bookings/${id}`, method: "DELETE" }),
      invalidatesTags: ["Bookings"],
    }),
  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useRoomsQuery,
  useBookingsQuery,
  useBookingEventsQuery,
  useCreateBookingMutation,
  useCreateHoldMutation,
  useConfirmHoldMutation,
  useCancelBookingMutation,
} = api;
