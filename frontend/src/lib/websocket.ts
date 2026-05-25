const API_BASE = (import.meta.env.VITE_API_BASE ?? "localhost:3000")
  .replace(/^\w+:\/\//, "")
  .trim();
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

export function createWebSocket(): WebSocket {
  return new WebSocket(`${wsProtocol}//${API_BASE}`);
}
