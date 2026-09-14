"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

import { calculateNewVipExpiration } from "@/lib/sepay-server";

// Bật / Tắt trạng thái VIP nhanh
export async function toggleUserVip(userId: string, newVipStatus: boolean) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Người dùng không tồn tại" };

    let newExpiresAt = user.vipExpiresAt;
    if (newVipStatus) {
      // Nếu bật VIP và hiện tại vipExpiresAt đã quá hạn thì reset về null (hoặc gia hạn)
      if (user.vipExpiresAt && new Date(user.vipExpiresAt).getTime() <= Date.now()) {
        newExpiresAt = null; // Mặc định chuyển sang VIP vĩnh viễn khi Admin bấm Lên VIP
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isVIP: newVipStatus,
        vipExpiresAt: newVipStatus ? newExpiresAt : null,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/profile");
    return {
      success: true,
      isVIP: updated.isVIP,
      vipExpiresAt: updated.vipExpiresAt ? updated.vipExpiresAt.toISOString() : null,
    };
  } catch (error) {
    console.error("Error toggling VIP:", error);
    return { success: false, error: "Không thể cập nhật trạng thái VIP" };
  }
}

// Điều chỉnh thời hạn VIP (Thêm ngày, Trọn đời, Hạ FREE, hoặc ngày tùy chỉnh)
export async function updateUserVipDuration(
  userId: string,
  action: "add_days" | "lifetime" | "expire_now" | "custom_date",
  days?: number,
  customDate?: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Người dùng không tồn tại" };

    let newExpiresAt: Date | null = null;
    let newIsVIP = true;

    if (action === "lifetime") {
      newExpiresAt = null;
      newIsVIP = true;
    } else if (action === "expire_now") {
      newExpiresAt = new Date(Date.now() - 1000 * 60); // Quá hạn
      newIsVIP = false;
    } else if (action === "add_days") {
      const addedDays = Number(days) || 30;
      newExpiresAt = calculateNewVipExpiration(user.vipExpiresAt, user.isVIP, addedDays);
      newIsVIP = true;
    } else if (action === "custom_date" && customDate) {
      const parsed = new Date(customDate);
      if (isNaN(parsed.getTime())) {
        return { success: false, error: "Ngày tùy chỉnh không hợp lệ" };
      }
      newExpiresAt = parsed;
      newIsVIP = parsed.getTime() > Date.now();
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isVIP: newIsVIP,
        vipExpiresAt: newExpiresAt,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/profile");

    return {
      success: true,
      user: {
        id: updated.id,
        isVIP: updated.isVIP,
        vipExpiresAt: updated.vipExpiresAt ? updated.vipExpiresAt.toISOString() : null,
      },
    };
  } catch (error: any) {
    console.error("Error updating VIP duration:", error);
    return { success: false, error: error?.message || "Không thể cập nhật thời hạn VIP" };
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
  dailyFreeLimit?: number;
}) {
  const { email, password, name, phone, isVIP = false, role = "USER", dailyFreeLimit = 12 } = data;

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

    const created = await prisma.user.create({
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

    const limit = Number(dailyFreeLimit) || 12;
    try {
      await (prisma as any).$executeRawUnsafe(
        'UPDATE "User" SET "dailyFreeLimit" = $1 WHERE id = $2',
        limit,
        created.id
      );
    } catch (e) {
      console.warn("Could not set dailyFreeLimit on create:", e);
    }

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

// Cập nhật số lượt dùng Free mỗi ngày cho 1 tài khoản cụ thể
export async function updateUserDailyFreeLimit(userId: string, newLimit: number) {
  try {
    const limit = Math.max(0, Math.floor(Number(newLimit) || 0));
    try {
      await (prisma.user as any).update({
        where: { id: userId },
        data: { dailyFreeLimit: limit },
      });
    } catch {
      await (prisma as any).$executeRawUnsafe(
        'UPDATE "User" SET "dailyFreeLimit" = $1 WHERE id = $2',
        limit,
        userId
      );
    }
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, dailyFreeLimit: limit };
  } catch (error: any) {
    console.error("Error updating user free limit:", error);
    return { success: false, error: error?.message || "Không thể cập nhật số lượt free" };
  }
}

// Cập nhật số lượt dùng Free mỗi ngày áp dụng CHUNG cho TẤT CẢ các tài khoản FREE
export async function updateGlobalDailyFreeLimit(newLimit: number) {
  try {
    const limit = Math.max(0, Math.floor(Number(newLimit) || 0));

    // 1. Lưu cấu hình chung vào SystemSetting
    await prisma.$executeRawUnsafe(
      `UPDATE "SystemSetting" SET "defaultDailyFreeLimit" = $1 WHERE id = 'default'`,
      limit
    );

    // 2. Cập nhật đồng loạt cho TẤT CẢ tài khoản trong bảng User
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "dailyFreeLimit" = $1`,
      limit
    );

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, defaultDailyFreeLimit: limit };
  } catch (error: any) {
    console.error("Error updating global daily free limit:", error);
    return { success: false, error: error?.message || "Không thể cập nhật số lượt Free chung" };
  }
}
