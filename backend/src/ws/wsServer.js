import { WebSocketServer } from "ws";
import { eventBus } from "#src/utils/eventEmitter.js";
import { getInitialState } from "#src/utils/stateUtils.js";

const TAG = "[WebSocket Server]";

export function initWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });
  const port = httpServer.address() ? httpServer.address().port : process.env.BACKEND_PORT || 3000;
  console.log(TAG, `running on ws://localhost:${port}`);

  wss.on("connection", async (ws) => {
    console.log(TAG, "New WS client connected");

    // send initial state to the newly connected client
    /* inital state consists of:
    - room state per device
    - sensor status per device
    - connection status per device */
    const initialState = await getInitialState();

    ws.send(JSON.stringify({ type: "initial_state", data: initialState }));

    ws.on("close", () => console.log(TAG, "WS client disconnected"));
  });

  eventBus.on("ws_broadcast", (msg) => {
    // msg should have a structure like { type: "room_state_update", data: { ... } }
    const payload = JSON.stringify(msg);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  return wss;
}
