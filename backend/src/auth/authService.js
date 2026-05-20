import { sqliteLogin } from "#src/database/sqliteLogin.js";
import { hashPassword, verifyPassword } from "#src/utils/passwordUtils.js";
import { randomUUID } from "crypto";

class AuthService {
  async createDefaultUserIfNotExists(password) {
    const exists = await sqliteLogin.getUser();

    if (!exists) {
      try {
        console.log("Creating default user...");
        const { key, salt, params } = hashPassword(password);
        const passwordHash = `${key},${salt},${params}`;
        await sqliteLogin.createUser(passwordHash);
      } catch (error) {
        console.error("Error occurred while creating default user:", error);
      }
    }
  }

  async getAndVerifyPassword(password) {
    const passwordHash = await sqliteLogin.getPasswordHash();
    return await verifyPassword(password, passwordHash);
  }

  async updatePassword(newPassword) {
    const { key, salt, params } = hashPassword(newPassword);
    const newPasswordHash = `${key},${salt},${params}`;

    await sqliteLogin.setPasswordHash(newPasswordHash);
    await sqliteLogin.setPasswordChangeRequired(false);
  }

  async isPasswordChangeRequired() {
    const value = await sqliteLogin.getPasswordChangeRequired();
    return Boolean(value);
  }

  // extends session if valid, otherwise deletes it and returns null
  async getAndVerifySession(sessionId) {
    const session = await sqliteLogin.getSessionById(sessionId);
    if (!session) return null;

    const now = new Date();
    if (now > new Date(session.expiresAt)) {
      await sqliteLogin.deleteSessionById(sessionId);
      return null;
    } else {
      // extend session expiration by 30 minutes
      const newExpiresAt = new Date(
        now.getTime() + 30 * 60 * 1000,
      ).toISOString();
      await sqliteLogin.updateSessionExpiration(sessionId, newExpiresAt);
    }
    return true;
  }

  async createNewSession() {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await sqliteLogin.createSession(sessionId, expiresAt);
    return sessionId;
  }

  async deleteSession(sessionId) {
    await sqliteLogin.deleteSessionById(sessionId);
  }
}

export const authService = new AuthService();
