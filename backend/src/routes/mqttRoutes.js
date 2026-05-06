import express from "express";
import {
  publishConfigurationMessage,
  publishCheckSensorMessage,
} from "#src/mqtt/mqttPublish.js";

const router = express.Router();

// ==================== MQTT Publish Endpoint ====================

router.post(
  "/publish/configuration/room/:roomId/device/:deviceId",
  async (req, res) => {
    try {
      const { configParams } = req.body;
      const { roomId, deviceId } = req.params;

      if (configParams === undefined)
        return res
          .status(400)
          .json({ ok: false, error: "configParams are required" });

      await publishConfigurationMessage(roomId, deviceId, configParams);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },
);

router.post(
  "/publish/sensor/status_check/room/:roomId/device/:deviceId",
  async (req, res) => {
    try {
      const { roomId, deviceId } = req.params;

      await publishCheckSensorMessage(roomId, deviceId);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  },
);

export default router;
