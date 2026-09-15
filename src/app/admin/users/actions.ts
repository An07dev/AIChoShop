"use server";

import { audit, auditedUserUpdate } from "@/lib/auth/audit";
import { auditOutcome } from "@/lib/auth/audit-operations";
import { requireAdmin } from "@/lib/auth/session";
import { guardAdminAccountChange } from "@/lib/auth/admin-account";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { replacePassword } from "@/lib/auth/credentials";
import { revalidatePath } from "next/cache";



import { calculateNewVipExpiration } from "@/lib/sepay-server";

// Bật / Tắt trạng thái VIP nhanh
export async function toggleUserVip(userId: string, newVipStatus: boolean) {
  const admin = await requireAdmin("toggleUserVip");
  return auditOutcome(admin.id, "toggleUserVip", async () => {
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

    const updated = await auditedUserUpdate(admin.id, userId, "VIP_CHANGED", {
        isVIP: newVipStatus,
        vipExpiresAt: newVipStatus ? newExpiresAt : null,
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

  });
}

// Điều chỉnh thời hạn VIP (Thêm ngày, Trọn đời, Hạ FREE, hoặc ngày tùy chỉnh)
export async function updateUserVipDuration(
  userId: string,
  action: "add_days" | "lifetime" | "expire_now" | "custom_date",
  days?: number,
  customDate?: string
) {
  const admin = await requireAdmin("updateUserVipDuration");
  return auditOutcome(admin.id, "updateUserVipDuration", async () => {
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

    const updated = await auditedUserUpdate(admin.id, userId, "VIP_CHANGED", {
        isVIP: newIsVIP,
        vipExpiresAt: newExpiresAt,
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
  } catch (error) {
    console.error("Error updating VIP duration:", error);
    return { success: false, error: error instanceof Error ? error.message : "Không thể cập nhật thời hạn VIP" };
  }

  });
}

// Khóa / Mở khóa tài khoản
export async function toggleUserLock(userId: string, newLockStatus: boolean) {
  const admin = await requireAdmin("toggleUserLock");
  return auditOutcome(admin.id, "toggleUserLock", async () => {
  if (typeof newLockStatus !== "boolean") return { success: false, error: "Trạng thái khóa không hợp lệ." };
  if (admin.id === userId) return { success: false, error: "Không thể tự khóa tài khoản quản trị đang đăng nhập." };
  try {
    const updated = await prisma.$transaction(async tx => {
      await guardAdminAccountChange(tx, admin.id, userId);
      const updated = await tx.user.update({ where: { id: userId }, data: { isLocked: newLockStatus } });
      if (newLockStatus) await tx.seoSession.deleteMany({ where: { userId } });
      await audit(tx, admin.id, "USER_LOCK_CHANGED", userId, { isLocked: newLockStatus });
      return updated;
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, isLocked: updated.isLocked };
  } catch (error) {
    console.error("Error toggling Lock:", error);
    return { success: false, error: "Không thể cập nhật trạng thái khóa" };
  }

  });
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
  const admin = await requireAdmin("createUserByAdmin");
  return auditOutcome(admin.id, "createUserByAdmin", async () => {
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

    if (!Number.isInteger(dailyFreeLimit) || dailyFreeLimit < 0 || dailyFreeLimit > 10000) throw new Error("Invalid limit");
    await prisma.$transaction(async tx => {
    const created = await tx.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: await hashPassword(password),
        name: name?.trim() || null,
        phone: phone?.trim() || null,
        isVIP: Boolean(isVIP),
        dailyFreeLimit,
        role: role === "ADMIN" ? "ADMIN" : "USER",
        userCredit: {
          create: {
            balance: isVIP ? 1000 : 100,
          },
        },
      },
    });

    await audit(tx, admin.id, "USER_CREATED", created.id, { isAdmin: created.role === "ADMIN" });
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo người dùng" };
  }

  });
}

// Đổi mật khẩu người dùng bởi Admin
export async function resetPasswordByAdmin(userId: string, newPassword: string) {
  const admin = await requireAdmin("resetPasswordByAdmin");
  return auditOutcome(admin.id, "resetPasswordByAdmin", async () => {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  try {
    await replacePassword(userId, newPassword, undefined, admin.id);
    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Không thể đặt lại mật khẩu" };
  }

  });
}

// Xóa tài khoản người dùng
export async function deleteUserByAdmin(userId: string) {
  const admin = await requireAdmin("deleteUserByAdmin");
  return auditOutcome(admin.id, "deleteUserByAdmin", async () => {
  if (admin.id === userId) return { success: false, error: "Không thể xóa tài khoản quản trị đang đăng nhập." };
  try {
    await prisma.$transaction(async tx => {
      await guardAdminAccountChange(tx, admin.id, userId);
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      if (await tx.transaction.count({ where: { userId } })) throw new Error("Tài khoản có lịch sử giao dịch. Hãy khóa tài khoản để giữ dữ liệu đối soát.");
      await tx.progress.deleteMany({ where: { userId } });
      await tx.userCredit.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
      await audit(tx, admin.id, "USER_DELETED", userId);
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Không thể xóa tài khoản này" };
  }

  });
}

// Cập nhật số lượt dùng Free mỗi ngày cho 1 tài khoản cụ thể
export async function updateUserDailyFreeLimit(userId: string, newLimit: number) {
  const admin = await requireAdmin("updateUserDailyFreeLimit");
  return auditOutcome(admin.id, "updateUserDailyFreeLimit", async () => {
  try {
    const limit = Number(newLimit);
    if (!Number.isInteger(limit) || limit < 0 || limit > 10000) throw new Error("Invalid limit");
    await auditedUserUpdate(admin.id, userId, "USER_QUOTA_CHANGED", { dailyFreeLimit: limit });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, dailyFreeLimit: limit };
  } catch (error) {
    console.error("Error updating user free limit:", error);
    return { success: false, error: error instanceof Error ? error.message : "Không thể cập nhật số lượt free" };
  }

  });
}

// Cập nhật số lượt dùng Free mỗi ngày áp dụng CHUNG cho TẤT CẢ các tài khoản FREE
export async function updateGlobalDailyFreeLimit(newLimit: number) {
  const admin = await requireAdmin("updateGlobalDailyFreeLimit");
  return auditOutcome(admin.id, "updateGlobalDailyFreeLimit", async () => {
  try {
    const limit = Number(newLimit);
    if (!Number.isInteger(limit) || limit < 0 || limit > 10000) throw new Error("Invalid limit");
    await prisma.$transaction(async tx => {
      await tx.systemSetting.upsert({ where: { id: "default" }, create: { id: "default", defaultDailyFreeLimit: limit }, update: { defaultDailyFreeLimit: limit } });
      await tx.user.updateMany({ data: { dailyFreeLimit: limit } });
      await audit(tx, admin.id, "GLOBAL_QUOTA_CHANGED", "default", { limit });
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return { success: true, defaultDailyFreeLimit: limit };
  } catch (error) {
    console.error("Error updating global daily free limit:", error);
    return { success: false, error: error instanceof Error ? error.message : "Không thể cập nhật số lượt Free chung" };
  }

  });
}
