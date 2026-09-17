"use server";
import { dataFailure, safeOperationMessage } from "@/lib/db-errors";


import { isVipActive } from "@/lib/vip-expiration";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { verifyPassword } from "@/lib/auth/password";
import { createPaymentIntent, type PaymentIntentView } from "@/lib/payments/service";
import { getSePayConfig } from "@/lib/sepay-server";
import { replacePassword } from "@/lib/auth/credentials";



export async function updateUserProfile(formData: FormData) {
  try {

    const token = await getSessionUserId();

    if (!token) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    if (!name || !name.trim()) {
      return { success: false, error: "Vui lòng nhập họ và tên" };
    }

    await prisma.user.update({
      where: { id: token },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true, message: "Cập nhật hồ sơ cá nhân thành công!" };
  } catch (error) {
    dataFailure(error, "app/actions/profile.ts");
    return { success: false, error: "Không thể cập nhật hồ sơ, vui lòng thử lại sau" };
  }
}

export async function changeUserPassword(formData: FormData) {
  try {

    const token = await getSessionUserId();

    if (!token) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "Vui lòng điền đầy đủ các trường mật khẩu" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Mật khẩu xác nhận không trùng khớp" };
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { password: true },
    });

    if (!user) {
      return { success: false, error: "Người dùng không tồn tại" };
    }

    if (!(await verifyPassword(currentPassword, user.password))) {
      return { success: false, error: "Mật khẩu hiện tại không chính xác" };
    }

    await replacePassword(token, newPassword, user.password);

    return { success: true, message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị." };
  } catch (error) {
    dataFailure(error, "app/actions/profile.ts");
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi đổi mật khẩu" };
  }
}

export async function requestVipActivation(planId: string): Promise<{ success: boolean; intent?: PaymentIntentView; error?: string }> {
  try {
    const userId = await getSessionUserId();
    if (!userId) return { success: false, error: "Vui lòng đăng nhập để thanh toán." };
    const intent = await createPaymentIntent(userId, planId, await getSePayConfig());
    return { success: true, intent };
  } catch (error) {
    return { success: false, error: safeOperationMessage(error, "Không thể tạo yêu cầu thanh toán.") };
  }
}

export async function checkPaymentIntentStatus(intentId: string): Promise<{ status: string }> {
  const userId = await getSessionUserId();
  if (!userId) return { status: "UNAUTHORIZED" };
  if (typeof intentId !== "string" || intentId.length > 100) return { status: "NOT_FOUND" };
  const intent = await prisma.transaction.findFirst({ where: { id: intentId, userId }, select: { status: true, expiresAt: true } });
  if (!intent) return { status: "NOT_FOUND" };
  return { status: intent.status === "PENDING" && intent.expiresAt && intent.expiresAt <= new Date() ? "EXPIRED" : intent.status };
}

/**
 * Kiểm tra trạng thái VIP theo thời gian thực (dùng cho Modal thanh toán tự động nhận biết)
 */
export async function checkCurrentUserVipStatus() {
  try {

    const token = await getSessionUserId();
    if (!token) return { isVIP: false, vipExpiresAt: null };

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { isVIP: true, vipExpiresAt: true },
    });

    if (!user) return { isVIP: false, vipExpiresAt: null };

    return {
      isVIP: isVipActive(user),
      vipExpiresAt: user.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
    };
  } catch (error) {
    dataFailure(error, "app/actions/profile.ts");
    return { isVIP: false, vipExpiresAt: null };
  }
}
