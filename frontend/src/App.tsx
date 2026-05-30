import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { router } from "@/routes";

export function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <RouterProvider router={router} />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
