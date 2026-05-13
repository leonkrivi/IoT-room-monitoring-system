import { verifyPassword } from "#src/utils/passwordUtils.js";
import { sqliteLogin } from "#src/database/sqliteLogin.js";

console.log("Testing default password...");

const defaultPassword = process.env.DEFAULT_PASSWORD || "admin123";

const storedPasswordHash = await sqliteLogin.getPasswordHash();

if (!storedPasswordHash) {
  console.error(
    "No password hash found in database. Default user may not be initialized.",
  );
  process.exit(1);
}

const isValid = verifyPassword(defaultPassword, storedPasswordHash);

if (isValid) {
  console.log("Default password is valid.");
} else {
  console.error("Default password is invalid.");
  process.exit(1);
}
