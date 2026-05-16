import express from "express";
import { checkSession } from "#src/auth/authMiddleware.js";
import { authService } from "#src/auth/authService.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ error: "Password is required" });

    const isValid = await authService.getAndVerifyPassword(password);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const sessionId = await authService.createNewSession();

    res.cookie("sessionId", sessionId, { httpOnly: true });
    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(`Login error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", checkSession, async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    await authService.deleteSession(sessionId);
    res.clearCookie("sessionId");
    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error(`Logout error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/change-password", checkSession, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ error: "New password is required" });

    await authService.updatePassword(newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(`Change password error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
