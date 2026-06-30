import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}
