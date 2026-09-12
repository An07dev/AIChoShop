"use server";

import { revalidatePath } from "next/cache";
import { updateSePayConfig, getSePayConfig, calculateNewVipExpiration } from "@/lib/sepay-server";
import { prisma } from "@/lib/prisma";
import { getActiveVipPlans } from "@/lib/vip-plans-server";

/**
 * Lưu cấu hình SePay từ Admin
 */
export async function saveSePayConfigAction(formData: {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  apiKey: string;
  syntaxPrefix: string;
  autoActivate: boolean;
}) {
  try {
    const updated = await updateSePayConfig({
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      accountHolder: formData.accountHolder.trim(),
      apiKey: formData.apiKey.trim(),
      syntaxPrefix: formData.syntaxPrefix.trim() || "VIP",
      autoActivate: formData.autoActivate,
    });

    revalidatePath("/admin/sepay");
    revalidatePath("/profile");
    return { success: true, config: updated };
  } catch (error: any) {
    console.error("Error saving SePay config:", error);
    return { success: false, error: error?.message || "Không thể lưu cấu hình SePay" };
  }
}

/**
 * Giả lập gửi Webhook SePay để kiểm tra logic kích hoạt VIP trực tiếp
 */
export async function simulateSePayWebhookAction(data: {
  phoneOrEmailOrId: string;
  amount: number;
  customContent?: string;
}) {
  try {
    const { phoneOrEmailOrId, amount, customContent } = data;
    const config = await getSePayConfig();

    if (!phoneOrEmailOrId || !phoneOrEmailOrId.trim()) {
      return { success: false, error: "Vui lòng nhập số điện thoại, email hoặc ID học viên" };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Số tiền giao dịch phải lớn hơn 0đ" };
    }

    const query = phoneOrEmailOrId.trim();

    // 1. Tìm học viên
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: query },
          { email: query.toLowerCase() },
          { email: { startsWith: query.toLowerCase() + "@" } },
          { id: query },
        ],
      },
    });

    if (!user) {
      return {
        success: false,
        error: `Không tìm thấy tài khoản nào khớp với "${query}". Vui lòng kiểm tra lại Email hoặc SĐT.`,
      };
    }

    // 2. Khớp gói VIP theo số tiền
    const activePlans = await getActiveVipPlans();
    let matchedPlan = activePlans.find((p) => p.price === amount);

    if (!matchedPlan) {
      const eligiblePlans = activePlans
        .filter((p) => p.price <= amount)
        .sort((a, b) => b.price - a.price);
      if (eligiblePlans.length > 0) {
        matchedPlan = eligiblePlans[0];
      }
    }

    const durationDays = matchedPlan
      ? matchedPlan.durationDays
      : amount >= 990000 ? 0 : 30;

    const fakeSepayId = `SIM-${Date.now()}`;
    const generatedContent = customContent?.trim() || `${config.syntaxPrefix} ${user.phone || user.email}`;

    // 3. Nếu tắt tự động kích hoạt
    if (!config.autoActivate) {
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          amount,
          status: "PENDING",
          type: "UPGRADE_VIP",
          sepayId: fakeSepayId,
        },
      });

      return {
        success: true,
        message: "Chế độ tự động kích hoạt đang TẮT. Đã tạo giao dịch PENDING thành công!",
        transactionId: tx.id,
        autoActivated: false,
      };
    }

    // 4. Tính toán thời hạn mới
    const newExpiresAt = calculateNewVipExpiration(
      user.vipExpiresAt,
      user.isVIP,
      durationDays
    );

    // Cập nhật người dùng
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVIP: true,
        vipExpiresAt: newExpiresAt,
      },
    });

    // Tạo giao dịch SUCCESS
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        status: "SUCCESS",
        type: "UPGRADE_VIP",
        sepayId: fakeSepayId,
      },
    });

    revalidatePath("/admin/sepay");
    revalidatePath("/admin/users");
    revalidatePath("/profile");

    return {
      success: true,
      message: `Giả lập Webhook thành công! Đã kích hoạt VIP cho ${user.name || user.email}`,
      transactionId: tx.id,
      autoActivated: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVIP: updatedUser.isVIP,
        vipExpiresAt: updatedUser.vipExpiresAt?.toISOString() || null,
      },
      planName: matchedPlan ? matchedPlan.name : "Tự động phân bổ",
      durationDays,
    };
  } catch (error: any) {
    console.error("Error simulating SePay webhook:", error);
    return { success: false, error: error?.message || "Lỗi xử lý webhook giả lập" };
  }
}

/**
 * Phê duyệt thủ công một giao dịch chuyển khoản (Kích hoạt VIP)
 */
export async function approveTransactionAction(txId: string) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: txId },
      include: { user: true },
    });

    if (!tx) {
      return { success: false, error: "Không tìm thấy giao dịch này" };
    }

    if (tx.status === "SUCCESS") {
      return { success: false, error: "Giao dịch này đã ở trạng thái thành công" };
    }

    // Xác định số ngày gia hạn theo số tiền
    const activePlans = await getActiveVipPlans();
    let matchedPlan = activePlans.find((p) => p.price === tx.amount);
    if (!matchedPlan) {
      const eligiblePlans = activePlans
        .filter((p) => p.price <= tx.amount)
        .sort((a, b) => b.price - a.price);
      if (eligiblePlans.length > 0) matchedPlan = eligiblePlans[0];
    }
    const durationDays = matchedPlan ? matchedPlan.durationDays : (tx.amount >= 990000 ? 0 : 30);

    // Cập nhật người dùng nếu có
    if (tx.userId && tx.user) {
      const newExpiresAt = calculateNewVipExpiration(
        tx.user.vipExpiresAt,
        tx.user.isVIP,
        durationDays
      );

      await prisma.user.update({
        where: { id: tx.userId },
        data: {
          isVIP: true,
          vipExpiresAt: newExpiresAt,
        },
      });
    }

    // Cập nhật trạng thái giao dịch
    await prisma.transaction.update({
      where: { id: txId },
      data: {
        status: "SUCCESS",
      },
    });

    revalidatePath("/admin/sepay");
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/profile");

    return {
      success: true,
      message: `Đã duyệt thành công giao dịch và kích hoạt VIP cho ${tx.user?.name || tx.user?.email || "học viên"}!`,
    };
  } catch (error: any) {
    console.error("Lỗi khi duyệt giao dịch:", error);
    return { success: false, error: error?.message || "Lỗi khi duyệt giao dịch" };
  }
}

/**
 * Xóa một giao dịch (dùng cho đơn test/rác)
 */
export async function deleteTransactionAction(txId: string) {
  try {
    await prisma.transaction.delete({
      where: { id: txId },
    });

    revalidatePath("/admin/sepay");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Đã xóa bản ghi giao dịch thành công!",
    };
  } catch (error: any) {
    console.error("Lỗi khi xóa giao dịch:", error);
    return { success: false, error: error?.message || "Không thể xóa giao dịch" };
  }
}

