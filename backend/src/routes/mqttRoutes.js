import express from "express";
import { publishMessage } from "#src/mqtt/mqttClient.js";

const router = express.Router();

router.post("/publish", async (req, res) => {
  try {
    const { topic, message, qos = 0, retain = false } = req.body;

    if (!topic || message === undefined) {
      return res
        .status(400)
        .json({ ok: false, error: "topic and message are required" });
    }

    await publishMessage(topic, String(message), { qos, retain });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// development stage: run with
// curl -X POST http://localhost:3000/mqtt/publish -H "Content-Type: application/json" -d '{"topic":"/test/backend","message":"Hello from backend!"}'

export default router;
