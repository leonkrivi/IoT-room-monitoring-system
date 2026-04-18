import express from "express";
import mqttRoutes from "#src/routes/mqttRoutes.js";
import { shutdownMqttPipeline } from "#src/mqtt/mqttClient.js";

const app = express();
const PORT = Number(process.env.BACKEND_PORT) || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.send("Base endpoint. Express backend is running!");
});

app.use("/mqtt", mqttRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
