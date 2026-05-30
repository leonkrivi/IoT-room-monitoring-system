import type { RouteObject } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardPage } from "@/pages/DashboardPage";
import { Spinner } from "@/components/ui/spinner";

type ProtectedRouteProps = {
  allowPasswordChange?: boolean;
};

export function ProtectedRoute({
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, passwordChangeRequired, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

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
