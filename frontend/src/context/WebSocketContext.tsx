import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { createWebSocket } from "@/lib/websocket";
import { safeParseWsMessage } from "@/hooks/wsSchemas";
import type { WsMessage } from "@/hooks/wsSchemas";
import { useAuth } from "@/context/AuthContext";

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (listener: (msg: WsMessage, ts: number) => void) => () => void;
  lastMessageAt: number | undefined;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageAt, setLastMessageAt] = useState<number | undefined>(
    undefined,
  );

  const listeners = useRef<Set<(msg: WsMessage, ts: number) => void>>(
    new Set(),
  );
  const lastInitialState = useRef<WsMessage | null>(null);
  const lastInitialStateTime = useRef<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnected(false);
      setLastMessageAt(undefined);
      lastInitialState.current = null;
      lastInitialStateTime.current = 0;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    let isActive = true;
    let socket: WebSocket | null = null;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!isActive) return;

      try {
        socket = createWebSocket();
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isActive) return;
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          if (!isActive) return;
          let payload: unknown;
          try {
            payload = JSON.parse(event.data as string);
          } catch {
            return;
          }
          const message = safeParseWsMessage(payload);
          if (!message) return;

          const timestamp = Date.now();
          setLastMessageAt(timestamp);

          if (message.type === "initial_state") {
            lastInitialState.current = message;
            lastInitialStateTime.current = timestamp;
          }

          // Notify all subscribers
          listeners.current.forEach((listener) => {
            try {
              listener(message, timestamp);
            } catch (err) {
              console.error("Error in WebSocket listener:", err);
            }
          });
        };

        socket.onclose = () => {
          if (!isActive) return;
          setIsConnected(false);
          socketRef.current = null;

          // Attempt to reconnect after 3 seconds
          reconnectTimeoutId = setTimeout(() => {
            connect();
          }, 3000);
        };

        socket.onerror = () => {
          if (socket) {
            socket.close();
          }
        };
      } catch (err) {
        console.error("Failed to connect WebSocket:", err);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutId = setTimeout(() => {
          connect();
        }, 3000);
      }
    }

    connect();

    return () => {
      isActive = false;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (socket) {
        socket.close();
      }
    };
  }, [isAuthenticated]);

  const subscribe = useCallback(
    (listener: (msg: WsMessage, ts: number) => void) => {
      listeners.current.add(listener);

      // Replay cached initial state to subscriber if available
      if (lastInitialState.current) {
        listener(lastInitialState.current, lastInitialStateTime.current);
      }

      return () => {
        listeners.current.delete(listener);
      };
    },
    [],
  );

  return (
    <WebSocketContext.Provider
      value={{ isConnected, subscribe, lastMessageAt }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return ctx;
}
