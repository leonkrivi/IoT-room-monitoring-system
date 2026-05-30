import express from "express";
import {
  ALLOWED_GRANULARITIES,
  ALLOWED_HB_INTERVAL_MS,
  ALLOWED_HOURS,
  ALLOWED_SENSOR_RATE_MS,
  GRANULARITY_LABELS,
} from "#src/utils/constants.js";

const router = express.Router();

function formatGranularityLabel(value) {
  return GRANULARITY_LABELS[value] ?? value;
}

router.get("/", (req, res) => {
  res.json({
    ok: true,
    configPresets: {
      hbIntervalMs: ALLOWED_HB_INTERVAL_MS,
      sensorRateMs: ALLOWED_SENSOR_RATE_MS,
    },
    queryPresets: {
      hours: ALLOWED_HOURS,
      granularities: ALLOWED_GRANULARITIES.map((value) => ({
        value,
        label: formatGranularityLabel(value),
      })),
    },
  });
});

export default router;
