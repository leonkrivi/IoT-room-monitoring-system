import express from "express";
import { dataFetcher } from "#src/globals/dataFetcher.js";
import { ALLOWED_HOURS, ALLOWED_GRANULARITIES } from "#src/utils/constants.js";

const router = express.Router();

// ==================== Room State Endpoints ====================

// expected query params:
// - days: optional, number of days to look back for recent history (default: 1 day)
// - granularity: optional, one of "minute", "hour", "day" (default: 15m)
router.get("/history_recent", async (req, res) => {
  try {
    const roomId = req.query.roomid;
    const deviceId = req.query.deviceid;

    const allIdPairs = await dataFetcher.getAllIdPairs();
    const validPair = allIdPairs.some(
      (pair) => pair.roomId === roomId && pair.deviceId === deviceId,
    );
    if (!validPair) {
      return res
        .status(404)
        .json({ ok: false, error: "Room or device not found" });
    }
    // TODO: optional, add hash mapping for roomId to avoid exposing internal IDs

    const hours = req.query.hours ? parseInt(req.query.hours, 10) : undefined;
    if (hours !== undefined && !ALLOWED_HOURS.includes(hours)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid hours value. Allowed values: ${ALLOWED_HOURS.join(", ")}`,
      });
    }

    const granularity = req.query.granularity;
    if (
      granularity !== undefined &&
      !ALLOWED_GRANULARITIES.includes(granularity)
    ) {
      return res.status(400).json({
        ok: false,
        error: `Invalid granularity value. Allowed values: ${ALLOWED_GRANULARITIES.join(", ")}`,
      });
    }

    const data = await dataFetcher.getRoomStateHistoryRecent(
      roomId,
      deviceId,
      hours,
      granularity,
    );
    res.json({ ok: true, data: data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// expected query params:
// - startTime: required, ISO string or timestamp in ms
// - endTime: required, ISO string or timestamp in ms
// - granularity: optional, one of "minute", "hour", "day" (default: 15m)
router.get("/history_period", async (req, res) => {
  try {
    const roomId = req.query.roomid;
    const deviceId = req.query.deviceid;

    const allIdPairs = await dataFetcher.getAllIdPairs();
    const validPair = allIdPairs.some(
      (pair) => pair.roomId === roomId && pair.deviceId === deviceId,
    );
    if (!validPair) {
      return res
        .status(404)
        .json({ ok: false, error: "Room or device not found" });
    }

    const { startTime, endTime, granularity } = req.query;

    const data = await dataFetcher.getRoomStateHistoryPeriod(
      roomId,
      deviceId,
      startTime,
      endTime,
      granularity,
    );
    res.json({ ok: true, data: data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
