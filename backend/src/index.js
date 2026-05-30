import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import routes from "#src/routes/routes.js";
import { shutdownMqttPipeline } from "#src/mqtt/mqttClient.js";
import { initWebSocketServer } from "#src/ws/wsServer.js";
import { hydrateCacheOnStartup } from "#src/utils/hydrateCache.js";
import { ensureDefaultUser } from "#src/auth/onStartup.js";

const app = express();
const PORT = Number(process.env.BACKEND_PORT);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 6001;

const allowedOrigins = new Set([
  `http://localhost:${FRONTEND_PORT}`,
  "http://localhost:6001",
  `http://127.0.0.1:${FRONTEND_PORT}`,
  "http://127.0.0.1:6001",
]);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(routes);

const server = app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

const bootstrap = async () => {
  try {
    // hydrate cache from database on startup
    await hydrateCacheOnStartup();

    // ensure default user exists on startup
    await ensureDefaultUser();

    // init WebSocket server on the same HTTP server
    initWebSocketServer(server);
  } catch (err) {
    console.error(`Error during server startup: ${err.message}`);
  }
};

bootstrap();

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
