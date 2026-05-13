import { hashPassword } from "#src/utils/passwordUtils.js";
import { authService } from "./authService.js";

export async function ensureDefaultUser() {
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "admin123";
  await authService.createDefaultUserIfNotExists(defaultPassword);
}
