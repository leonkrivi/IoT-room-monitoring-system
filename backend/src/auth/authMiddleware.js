import { authService } from "./authService.js";

export async function checkSession(req, res, next) {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) return res.sendStatus(401);

    const session = await authService.getAndVerifySession(sessionId);
    if (!session) return res.sendStatus(401);

    next();
  } catch (err) {
    console.error(`Auth middleware error: ${err.message}`);
    return res.sendStatus(500);
  }
}

export async function ensurePasswordUpdated(req, res, next) {
  try {
    const passwordChangeRequired = await authService.isPasswordChangeRequired();
    if (passwordChangeRequired) {
      return res.status(403).json({
        error: "Password change required",
        passwordChangeRequired: true,
      });
    }

    next();
  } catch (err) {
    console.error(`Password guard error: ${err.message}`);
    return res.sendStatus(500);
  }
}
