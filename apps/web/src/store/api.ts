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
  tagTypes: ["Bookings", "Me"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { name: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    me: builder.query<Me, void>({
      query: () => "/me",
      providesTags: ["Me"],
    }),
  }),
});

export const { useLoginMutation, useMeQuery } = api;
