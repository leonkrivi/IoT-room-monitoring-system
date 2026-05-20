import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./protectedRoutes";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";

export const passwordRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute allowPasswordChange />,
    children: [
      {
        path: "/change-password",
        element: <ChangePasswordPage />,
      },
    ],
  },
];
