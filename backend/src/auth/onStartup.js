import { authService } from "./authService.js";

export async function ensureDefaultUser() {
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "admin";
  await authService.createDefaultUserIfNotExists(defaultPassword);
}
