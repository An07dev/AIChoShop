"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function updateUserProfile(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

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
    console.error("Error updating profile:", error);
    return { success: false, error: "Không thể cập nhật hồ sơ, vui lòng thử lại sau" };
  }
}

export async function changeUserPassword(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

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

    const hashedCurrent = hashPassword(currentPassword);
    if (user.password !== hashedCurrent) {
      return { success: false, error: "Mật khẩu hiện tại không chính xác" };
    }

    await prisma.user.update({
      where: { id: token },
      data: {
        password: hashPassword(newPassword),
      },
    });

    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống khi đổi mật khẩu" };
  }
}

export async function requestVipActivation(packageType: string, amount: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;

    if (!token) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: token,
        amount: amount,
        status: "PENDING",
        type: `UPGRADE_VIP_${packageType}`,
      },
    });

    revalidatePath("/profile");
    return {
      success: true,
      message: "Yêu cầu nâng cấp VIP đã được ghi nhận. Vui lòng chuyển khoản đúng nội dung để hệ thống kích hoạt tự động.",
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Error creating VIP transaction:", error);
    return { success: false, error: "Không thể gửi yêu cầu nâng cấp, vui lòng liên hệ admin" };
  }
}

/**
 * Kiểm tra trạng thái VIP theo thời gian thực (dùng cho Modal thanh toán tự động nhận biết)
 */
export async function checkCurrentUserVipStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return { isVIP: false, vipExpiresAt: null };

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: { isVIP: true, vipExpiresAt: true },
    });

    if (!user) return { isVIP: false, vipExpiresAt: null };

    return {
      isVIP: user.isVIP,
      vipExpiresAt: user.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
    };
  } catch (error) {
    console.error("Error checking VIP status:", error);
    return { isVIP: false, vipExpiresAt: null };
  }
}
