import express from "express";
import roomStateRoutes from "#src/routes/roomStateRoutes.js";
import mqttRoutes from "#src/routes/mqttRoutes.js";
import authRoutes from "#src/routes/authRoutes.js";

const router = express.Router();

router.use("/room-state", roomStateRoutes);
router.use("/mqtt", mqttRoutes);
router.use("/auth", authRoutes);

export default router;
