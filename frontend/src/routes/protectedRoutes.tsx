import type { RouteObject } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardPage } from "@/pages/DashboardPage";

type ProtectedRouteProps = {
  allowPasswordChange?: boolean;
};

export function ProtectedRoute({
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, passwordChangeRequired } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (passwordChangeRequired && !allowPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export const protectedRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
    ],
  },
];
