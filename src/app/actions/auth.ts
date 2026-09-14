"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Utility to hash password
function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập Email và Mật khẩu" };
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được đăng ký" };
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        name: name || "Seller",
        phone: phone || null,
      },
    });

    // Kế thừa định mức lượt Free hiện tại từ cấu hình hệ thống
    try {
      const setting: any = await prisma.$queryRawUnsafe(
        `SELECT "defaultDailyFreeLimit" FROM "SystemSetting" WHERE id = 'default' LIMIT 1;`
      );
      if (setting && setting[0]?.defaultDailyFreeLimit) {
        await prisma.$executeRawUnsafe(
          `UPDATE "User" SET "dailyFreeLimit" = $1 WHERE id = $2`,
          Number(setting[0].defaultDailyFreeLimit) || 12,
          user.id
        );
      }
    } catch {}

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("user_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống" };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Email hoặc mật khẩu không đúng" };
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: "Email hoặc mật khẩu không đúng" };
    }

    if (user.isLocked) {
      return { success: false, error: "Tài khoản của bạn đã bị tạm khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ." };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("user_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống" };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("user_token");
  redirect("/login");
}
