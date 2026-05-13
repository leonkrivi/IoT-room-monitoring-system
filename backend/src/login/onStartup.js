import { hashPassword } from "#src/utils/passwordUtils.js";
import { sqliteLogin } from "#src/database/sqLiteLogin.js";

export async function ensureDefaultUser() {
  const exists = await sqliteLogin.getUser();

  if (!exists) {
    try {
      console.log("Creating default user...");
      const password = process.env.DEFAULT_PASSWORD || "admin123";

      const { key, salt, params } = hashPassword(password);
      const passwordHash = `${key},${salt},${params}`;
      await sqliteLogin.createUser(passwordHash);
    } catch (error) {
      console.error("Error occurred while creating default user:", error);
    }
  }
}
