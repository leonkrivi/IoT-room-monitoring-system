import type { RouteObject } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/pages/LoginPage";

function AuthRoute() {
  const { isAuthenticated, passwordChangeRequired } = useAuth();

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
