import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { passwordKeyLen, scryptParams } from "#src/utils/constants.js";

export function hashPassword(password) {
  const { N, r, p } = scryptParams;

  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, passwordKeyLen, {
    N,
    r,
    p,
    maxmem: 128 * 1024 * 1024 * 2, // Allow up to 256MB
  });

  return {
    key: derivedKey.toString("hex"),
    salt: salt.toString("hex"),
    params: `${N}:${r}:${p}`,
  };
}

export function verifyPassword(password, stored) {
  if (typeof stored !== "string") {
    throw new TypeError("stored must be a string");
  }

  const [key, salt, params] = stored.split(",");
  const [N, r, p] = params.split(":").map(Number);

  const derivedKey = scryptSync(
    password,
    Buffer.from(salt, "hex"),
    passwordKeyLen,
    {
      N,
      r,
      p,
      maxmem: 128 * 1024 * 1024 * 2, // Allow up to 256MB
    },
  );

  return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}
