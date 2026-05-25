import express from "express";
import {
  publishConfigurationMessage,
  publishCheckSensorMessage,
} from "#src/mqtt/mqttPublish.js";
import {
  ALLOWED_HB_INTERVAL_MS,
  ALLOWED_SENSOR_RATE_MS,
} from "#src/utils/constants.js";

const router = express.Router();

// ==================== MQTT Publish Endpoint ====================

router.post("/publish/configuration", async (req, res) => {
  try {
    const { roomId, deviceId, hb_rate, sensor_rate } = req.query;

    if (!roomId || !deviceId)
      return res
        .status(400)
        .json({ ok: false, error: "roomId and deviceId are required" });

    const hbRate = hb_rate !== undefined ? Number(hb_rate) : undefined;
    const sensorRate =
      sensor_rate !== undefined ? Number(sensor_rate) : undefined;

    if (hb_rate !== undefined && Number.isNaN(hbRate))
      return res
        .status(400)
        .json({ ok: false, error: "hb_rate must be a number" });

    if (sensor_rate !== undefined && Number.isNaN(sensorRate))
      return res
        .status(400)
        .json({ ok: false, error: "sensor_rate must be a number" });

    if (hbRate !== undefined && !ALLOWED_HB_INTERVAL_MS.includes(hbRate))
      return res.status(400).json({
        ok: false,
        error: `Invalid hb_rate. Allowed values: ${ALLOWED_HB_INTERVAL_MS.join(", ")}`,
      });

    if (
      sensorRate !== undefined &&
      !ALLOWED_SENSOR_RATE_MS.includes(sensorRate)
    )
      return res.status(400).json({
        ok: false,
        error: `Invalid sensor_rate. Allowed values: ${ALLOWED_SENSOR_RATE_MS.join(", ")}`,
      });

    await publishConfigurationMessage(roomId, deviceId, {
      hb_rate: hbRate,
      sensor_rate: sensorRate,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/publish/check_sensor", async (req, res) => {
  try {
    const { roomId, deviceId } = req.query;

    if (!roomId || !deviceId)
      return res
        .status(400)
        .json({ ok: false, error: "roomId and deviceId are required" });

    await publishCheckSensorMessage(roomId, deviceId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
