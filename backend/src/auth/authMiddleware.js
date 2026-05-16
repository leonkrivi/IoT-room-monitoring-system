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
