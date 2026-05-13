import express from "express";
import "dotenv/config";

import roomStateRoutes from "#src/routes/roomStateRoutes.js";
import mqttRoutes from "#src/routes/mqttRoutes.js";
import { shutdownMqttPipeline } from "#src/mqtt/mqttClient.js";
import { initWebSocketServer } from "#src/ws/wsServer.js";
import { hydrateCacheOnStartup } from "#src/utils/hydrateCache.js";
import { ensureDefaultUser } from "#src/login/onStartup.js";

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", roomStateRoutes);

app.use("/mqtt", mqttRoutes);

const server = app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);

  // hydrate cache from database on startup
  await hydrateCacheOnStartup();

  // ensure default user exists on startup
  await ensureDefaultUser();

  // init WebSocket server on the same HTTP server
  initWebSocketServer(server);
});

// ==================== Graceful Shutdown Logic ====================
let shuttingDown = false;

async function gracefulServerShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}, shutting down...`);

  try {
    await shutdownMqttPipeline();
  } catch (err) {
    console.error(`Failed to shutdown MQTT pipeline: ${err.message}`);
  }

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGINT", () => {
  gracefulServerShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  gracefulServerShutdown("SIGTERM");
});
