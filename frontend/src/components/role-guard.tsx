import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import type { Rol } from "@/lib/types";

interface RoleGuardProps {
  allow: Rol[];
}

export function RoleGuard({ allow }: RoleGuardProps): JSX.Element {
  const hasRole = useAuthStore((s) => s.hasRole);
  return hasRole(...allow) ? <Outlet /> : <Navigate to="/403" replace />;
}
