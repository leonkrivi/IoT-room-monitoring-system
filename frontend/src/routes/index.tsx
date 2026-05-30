import { createBrowserRouter, Navigate } from "react-router-dom";
import { authRoutes } from "./authRoutes";
import { passwordRoutes } from "./passwordRoutes";
import { protectedRoutes } from "./protectedRoutes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  ...authRoutes,
  ...passwordRoutes,
  ...protectedRoutes,
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
