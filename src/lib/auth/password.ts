import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
    if (error) reject(error); else resolve(key);
  });
});

export async function hashPassword(password: string) {
  if (typeof password !== "string" || password.length < 1 || password.length > 256) {
    throw new Error("Mật khẩu không hợp lệ.");
  }
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  if (typeof password !== "string" || password.length > 256 || typeof stored !== "string") return false;
  // Existing accounts are upgraded only after successful password verification.
  if (/^[a-f0-9]{64}$/.test(stored)) {
    return timingSafeEqual(Buffer.from(stored, "hex"), createHash("sha256").update(password).digest());
  }
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt-v1" || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
  return timingSafeEqual(await derive(password, parts[1]), Buffer.from(parts[2], "hex"));
}
