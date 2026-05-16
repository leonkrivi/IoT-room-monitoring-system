import express from "express";
import { dataFetcher } from "#src/globals/dataFetcher.js";

const router = express.Router();

// ==================== Room State Endpoints ====================

// expected query params:
// - days: optional, number of days to look back for recent history (default: 1 day)
// - granularity: optional, one of "minute", "hour", "day" (default: 15m)
router.get("/room_state/room/:roomId/history/recent", async (req, res) => {
  try {
    const { roomId } = req.params;

    const allRoomIds = await dataFetcher.getAllRoomIds();
    // TODO: consider caching room IDs
    if (!allRoomIds.includes(roomId)) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }
    // TODO: optional, add hash mapping for roomId to avoid exposing internal IDs

    const days = req.query.days ? parseInt(req.query.days) : undefined;
    const { granularity } = req.query;

    const data = await dataFetcher.getRecentRoomStateHistory(
      roomId,
      days,
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
router.get("/room_state/room/:roomId/history/period", async (req, res) => {
  try {
    const { roomId } = req.params;

    const allRoomIds = await dataFetcher.getAllRoomIds();
    if (!allRoomIds.includes(roomId)) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    const { startTime, endTime, granularity } = req.query;

    const data = await dataFetcher.getRoomStateHistory(
      roomId,
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
