import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SEO_SESSION_COOKIE = "seo_session";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Created only after password verification/registration, never from the legacy user-id cookie.
export async function createSeoSession(userId: string, verifiedPassword: string) {
  const store = await cookies();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.$transaction(async tx => {
    const users = await tx.$queryRaw<{ password: string; isLocked: boolean }[]>`
      SELECT "password", "isLocked" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    if (!users[0] || users[0].isLocked || users[0].password !== verifiedPassword) {
      throw new Error("Thông tin đăng nhập đã thay đổi. Vui lòng đăng nhập lại.");
    }
    const previous = store.get(SEO_SESSION_COOKIE)?.value;
    if (previous) await tx.seoSession.deleteMany({ where: { tokenHash: hashToken(previous) } });
    await tx.seoSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt: expires } });
  });
  store.set(SEO_SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
  store.delete("user_token");
  store.delete("admin_token");
}

export async function deleteSeoSession() {
  const store = await cookies();
  const token = store.get(SEO_SESSION_COOKIE)?.value;
  if (token) await prisma.$executeRaw`DELETE FROM "SeoSession" WHERE "tokenHash" = ${hashToken(token)}`;
  store.delete(SEO_SESSION_COOKIE);
}
