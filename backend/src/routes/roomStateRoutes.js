import express from "express";
import {
  getRoomStateHistory,
  getRecentRoomStateHistory,
} from "#src/database/influxRead.js";

const router = express.Router();

// ==================== Room State Endpoints ====================

router.get("/room_state/room/:roomId/history/recent", async (req, res) => {
  try {
    const { roomId } = req.params;
    // TODO: check if roomId is valid
    // TODO: optional, add hash mapping for roomId to avoid exposing internal IDs

    const days = req.query.days ? parseInt(req.query.days) : undefined;
    const { granularity } = req.query;

    const data = await getRecentRoomStateHistory(roomId, days, granularity);
    res.json({ ok: true, data: data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get("/room_state/room/:roomId/history/period", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startTime, endTime, granularity } = req.query;

    const data = await getRoomStateHistory(
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
