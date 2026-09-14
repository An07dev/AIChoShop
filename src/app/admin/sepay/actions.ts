"use server";

import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { updateSePayConfig } from "@/lib/sepay-server";
import { prisma } from "@/lib/prisma";
import { approvePaymentIntent, cancelUnpaidIntent } from "@/lib/payments/service";
import { paymentReviewReason, normalizeAccount } from "@/lib/payments/policy";

export async function saveSePayConfigAction(formData: {
  bankName: string; accountNumber: string; accountHolder: string; apiKey: string; syntaxPrefix: string; autoActivate: boolean;
}) {
  await requireAdmin();
  try {
    if (!formData.bankName?.trim() || !formData.accountHolder?.trim() || !/^[A-Z0-9]{4,50}$/.test(normalizeAccount(formData.accountNumber || "")) || typeof formData.autoActivate !== "boolean") throw new Error("Thông tin ngân hàng không hợp lệ.");
    if (formData.apiKey && (formData.apiKey.trim().length < 16 || formData.apiKey.length > 512)) throw new Error("Khóa webhook phải có từ 16 đến 512 ký tự.");
    const updated = await updateSePayConfig({ bankName: formData.bankName.trim(), accountNumber: normalizeAccount(formData.accountNumber),
      accountHolder: formData.accountHolder.trim(), ...(formData.apiKey.trim() && { apiKey: formData.apiKey.trim() }), syntaxPrefix: "ACS", autoActivate: formData.autoActivate });
    revalidatePath("/admin/sepay"); revalidatePath("/profile");
    return { success: true, configured: Boolean(updated.apiKey) };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không thể lưu cấu hình." }; }
}

// Preview only. It does not create bank events, transactions, or entitlements.
export async function simulateSePayWebhookAction(data: { paymentCode: string; amount: number }) {
  await requireAdmin();
  try {
    const code = data.paymentCode?.trim().toUpperCase();
    if (!/^ACS[A-F0-9]{16}$/.test(code)) throw new Error("Nhập mã thanh toán ACS của yêu cầu đã tạo.");
    const intent = await prisma.transaction.findUnique({ where: { paymentCode: code } });
    if (!intent) throw new Error("Không tìm thấy yêu cầu thanh toán.");
    const reason = paymentReviewReason(intent, { id: "preview", amount: data.amount, accountNumber: intent.accountNumber || "", content: code, transferType: "in" }, new Date());
    return { success: true, message: reason ? `Cần đối soát: ${reason}. Đây là bản xem trước, chưa ghi nhận tiền hoặc cấp VIP.` : "Dữ liệu khớp yêu cầu. Đây là bản xem trước, chưa ghi nhận tiền hoặc cấp VIP." };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không thể xem trước." }; }
}

export async function approveTransactionAction(txId: string) {
  const admin = await requireAdmin();
  try {
    await approvePaymentIntent(txId, admin.id);
    revalidatePath("/admin/sepay"); revalidatePath("/admin/users"); revalidatePath("/profile");
    return { success: true, message: "Đã đối soát giao dịch ngân hàng và cấp quyền VIP." };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không thể duyệt giao dịch." }; }
}

export async function deleteTransactionAction(txId: string) {
  await requireAdmin();
  try {
    await cancelUnpaidIntent(txId);
    revalidatePath("/admin/sepay");
    return { success: true, message: "Đã hủy yêu cầu chưa thanh toán; bản ghi vẫn được giữ để đối soát." };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không thể hủy yêu cầu." }; }
}
