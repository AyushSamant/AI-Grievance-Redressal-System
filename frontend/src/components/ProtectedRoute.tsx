// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "../types";

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const token = localStorage.getItem("access");
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    try {
      const user = JSON.parse(localStorage.getItem("user") ?? "{}");
      if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}