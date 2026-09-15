"use server";

import { requireAdmin } from "@/lib/auth/session";
import { guardAdminAccountChange } from "@/lib/auth/admin-account";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { replacePassword } from "@/lib/auth/credentials";
import { revalidatePath } from "next/cache";



import { calculateNewVipExpiration } from "@/lib/sepay-server";

// Bật / Tắt trạng thái VIP nhanh
export async function toggleUserVip(userId: string, newVipStatus: boolean) {
  await requireAdmin();
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
  await requireAdmin();
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
  const admin = await requireAdmin();
  if (typeof newLockStatus !== "boolean") return { success: false, error: "Trạng thái khóa không hợp lệ." };
  if (admin.id === userId) return { success: false, error: "Không thể tự khóa tài khoản quản trị đang đăng nhập." };
  try {
    const updated = await prisma.$transaction(async tx => {
      await guardAdminAccountChange(tx, admin.id, userId);
      const updated = await tx.user.update({ where: { id: userId }, data: { isLocked: newLockStatus } });
      if (newLockStatus) await tx.seoSession.deleteMany({ where: { userId } });
      return updated;
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
  await requireAdmin();
  const { email, password, name, phone, isVIP = false, role = "USER", dailyFreeLimit = 12 } = data;

  if (!email || typeof password !== "string" || password.length < 6 || password.length > 256) {
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
        password: await hashPassword(password),
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
  await requireAdmin();
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  try {
    await replacePassword(userId, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Không thể đặt lại mật khẩu" };
  }
}

// Xóa tài khoản người dùng
export async function deleteUserByAdmin(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { success: false, error: "Không thể xóa tài khoản quản trị đang đăng nhập." };
  try {
    await prisma.$transaction(async tx => {
      await guardAdminAccountChange(tx, admin.id, userId);
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      if (await tx.transaction.count({ where: { userId } })) throw new Error("Tài khoản có lịch sử giao dịch. Hãy khóa tài khoản để giữ dữ liệu đối soát.");
      await tx.progress.deleteMany({ where: { userId } });
      await tx.userCredit.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

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
  await requireAdmin();
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
  await requireAdmin();
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
