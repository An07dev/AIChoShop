"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Bật / Tắt trạng thái VIP
export async function toggleUserVip(userId: string, newVipStatus: boolean) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isVIP: newVipStatus },
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, isVIP: updated.isVIP };
  } catch (error) {
    console.error("Error toggling VIP:", error);
    return { success: false, error: "Không thể cập nhật trạng thái VIP" };
  }
}

// Khóa / Mở khóa tài khoản
export async function toggleUserLock(userId: string, newLockStatus: boolean) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isLocked: newLockStatus },
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, isLocked: updated.isLocked };
  } catch (error) {
    console.error("Error toggling Lock:", error);
    return { success: false, error: "Không thể cập nhật trạng thái khóa" };
  }
}

// Tạo người dùng thủ công bởi Admin
export async function createUserByAdmin(data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  isVIP?: boolean;
  role?: "USER" | "ADMIN";
}) {
  const { email, password, name, phone, isVIP = false, role = "USER" } = data;

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập đầy đủ Email và Mật khẩu" };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return { success: false, error: "Email này đã tồn tại trong hệ thống" };
    }

    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashPassword(password),
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        isVIP: Boolean(isVIP),
        role: role === "ADMIN" ? "ADMIN" : "USER",
        userCredit: {
          create: {
            balance: isVIP ? 1000 : 100,
          },
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo người dùng" };
  }
}

// Đổi mật khẩu người dùng bởi Admin
export async function resetPasswordByAdmin(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    });
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Không thể đặt lại mật khẩu" };
  }
}

// Xóa tài khoản người dùng
export async function deleteUserByAdmin(userId: string) {
  try {
    await prisma.$transaction([
      prisma.progress.deleteMany({ where: { userId } }),
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.userCredit.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Không thể xóa tài khoản này" };
  }
}
