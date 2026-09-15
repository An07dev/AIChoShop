"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSeoSession, deleteSeoSession } from "@/lib/seo/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AuthRateLimitError, limitAuthAttempts } from "@/lib/auth/rate-limit";

export async function registerUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = formData.get("password");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== "string" || password.length < 6 || password.length > 256 || name.length > 120 || phone.length > 30) {
    return { success: false, error: "Thông tin không hợp lệ. Mật khẩu phải có từ 6 đến 256 ký tự." };
  }
  try {
    await limitAuthAttempts("register", email);
    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (existing) return { success: false, error: "Email này đã được đăng ký" };
    const setting = await prisma.systemSetting.findUnique({ where: { id: "default" }, select: { defaultDailyFreeLimit: true } });
    const user = await prisma.user.create({ data: {
      email, password: await hashPassword(password), name: name || "Seller", phone: phone || null,
      dailyFreeLimit: setting?.defaultDailyFreeLimit ?? 12,
    } });
    await createSeoSession(user.id, user.password);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthRateLimitError) return { success: false, error: error.message };
    return { success: false, error: "Không thể đăng ký. Vui lòng thử lại hoặc đăng nhập nếu tài khoản đã được tạo." };
  }
}

export async function loginUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = formData.get("password");
  const denied = { success: false, error: "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa." };
  if (!email || email.length > 254 || typeof password !== "string" || !password || password.length > 256) return denied;
  try {
    await limitAuthAttempts("login", email);
    // Ambiguous legacy email addresses must be reconciled before login.
    const users = await prisma.user.findMany({ where: { email: { equals: email, mode: "insensitive" } }, take: 2 });
    const user = users.length === 1 ? users[0] : null;
    if (!user || user.isLocked || !(await verifyPassword(password, user.password))) return denied;
    let verifiedPassword = user.password;
    if (/^[a-f0-9]{64}$/.test(user.password)) {
      verifiedPassword = await hashPassword(password);
      const upgraded = await prisma.user.updateMany({ where: { id: user.id, password: user.password, isLocked: false }, data: { password: verifiedPassword } });
      if (upgraded.count !== 1) return denied;
    }
    await createSeoSession(user.id, verifiedPassword);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthRateLimitError) return { success: false, error: error.message };
    return { success: false, error: "Không thể đăng nhập. Vui lòng thử lại." };
  }
}

export async function logoutUser() {
  await deleteSeoSession();
  const store = await cookies();
  store.delete("user_token");
  store.delete("admin_token");
  redirect("/login");
}
