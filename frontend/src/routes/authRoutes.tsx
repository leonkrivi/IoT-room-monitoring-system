import type { RouteObject } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { Spinner } from "@/components/ui/spinner";

function AuthRoute() {
  const { isAuthenticated, passwordChangeRequired, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return passwordChangeRequired ? (
      <Navigate to="/change-password" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return <Outlet />;
}

export const authRoutes: RouteObject[] = [
  {
    element: <AuthRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
];
