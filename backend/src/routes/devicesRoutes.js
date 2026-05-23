import express from "express";
import { dataFetcher } from "#src/globals/dataFetcher.js";

const router = express.Router();

// ==================== Device Endpoints ====================

router.get("/devices/list", async (req, res) => {
  try {
    const devices = await dataFetcher.getAllIdPairs();
    res.json({ ok: true, data: devices });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
