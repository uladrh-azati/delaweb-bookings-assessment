import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../lib/auth";
import { useBookingEventsQuery } from "../store/api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const hasToken = Boolean(getToken());
  useBookingEventsQuery(undefined, { skip: !hasToken });

  return hasToken ? <>{children}</> : <Navigate to="/login" replace />;
}
