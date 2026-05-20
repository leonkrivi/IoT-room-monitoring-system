import express from "express";
import roomStateRoutes from "#src/routes/roomStateRoutes.js";
import mqttRoutes from "#src/routes/mqttRoutes.js";
import authRoutes from "#src/routes/authRoutes.js";
import {
  checkSession,
  ensurePasswordUpdated,
} from "#src/auth/authMiddleware.js";

const router = express.Router();

router.use("/room-state", checkSession, ensurePasswordUpdated, roomStateRoutes);
router.use("/mqtt", checkSession, ensurePasswordUpdated, mqttRoutes);
router.use("/auth", authRoutes);

export default router;
