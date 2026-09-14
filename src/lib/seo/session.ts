import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SEO_SESSION_COOKIE = "seo_session";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Created only after password verification/registration, never from the legacy user-id cookie.
export async function createSeoSession(userId: string) {
  const store = await cookies();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.$executeRaw`INSERT INTO "SeoSession" ("tokenHash", "userId", "expiresAt")
    VALUES (${hashToken(token)}, ${userId}, ${expires})`;
  store.set(SEO_SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires,
  });
}

export async function deleteSeoSession() {
  const store = await cookies();
  const token = store.get(SEO_SESSION_COOKIE)?.value;
  if (token) await prisma.$executeRaw`DELETE FROM "SeoSession" WHERE "tokenHash" = ${hashToken(token)}`;
  store.delete(SEO_SESSION_COOKIE);
}
