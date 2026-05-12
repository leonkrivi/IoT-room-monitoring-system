import WebSocket from "ws";

const TAG = "[WS Test Client]";
const PORT = Number(process.env.BACKEND_PORT) || 3000;

const ws = new WebSocket(`ws://localhost:${PORT}`);

ws.on("open", () => {
  console.log(TAG, "✅ connected to WebSocket server");
});

ws.on("message", (rawData) => {
  try {
    const { type, data } = JSON.parse(rawData);
    if (type === "initial_state") {
      console.log(TAG, "📥 Received initial state from server: ", data);
    } else if (type === "test_message") {
      console.log(TAG, "📥 Received test message from server: ", data);
    } else {
      console.log(TAG, "🟢 Received event: ", { type, data });
    }
  } catch (err) {
    console.error(TAG, "⚠️ Greška pri obradi:", err.message);
    console.log(TAG, "🟢 Received message (text):", rawData.toString());
  }
});

ws.on("close", () => {
  console.log(TAG, "❌ WebSocket connection closed");
});

ws.on("error", (err) => {
  console.error(TAG, "⚠️ WebSocket error:", err);
});

setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    const testMessage = {
      type: "test_message",
      data: "Hello from test client!",
    };
    ws.send(JSON.stringify(testMessage));
    console.log(TAG, "📤 Sent test message to server:", testMessage);
  }
}, 10000);
