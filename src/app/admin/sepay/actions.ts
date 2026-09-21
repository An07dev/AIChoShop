"use server";
import { safeOperationMessage } from "@/lib/db-errors";


import { auditOutcome } from "@/lib/auth/audit-operations";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { updateSePayConfig } from "@/lib/sepay-server";
import { prisma } from "@/lib/prisma";
import { approvePaymentIntent, cancelUnpaidIntent } from "@/lib/payments/service";
import { paymentReviewReason, normalizeAccount } from "@/lib/payments/policy";

export async function saveSePayConfigAction(formData: {
  bankName: string; accountNumber: string; accountHolder: string; apiKey: string; syntaxPrefix: string; autoActivate: boolean;
}) {
  const auditAdmin = await requireAdmin("saveSePayConfigAction");
  return auditOutcome(auditAdmin.id, "saveSePayConfigAction", async () => {
  try {
    if (!formData.bankName?.trim() || !formData.accountHolder?.trim() || !/^[A-Z0-9]{4,50}$/.test(normalizeAccount(formData.accountNumber || "")) || typeof formData.autoActivate !== "boolean") throw new Error("Thông tin ngân hàng không hợp lệ.");
    if (formData.apiKey && (formData.apiKey.trim().length < 16 || formData.apiKey.length > 512)) throw new Error("Khóa webhook phải có từ 16 đến 512 ký tự.");
    const updated = await updateSePayConfig({ bankName: formData.bankName.trim(), accountNumber: normalizeAccount(formData.accountNumber),
      accountHolder: formData.accountHolder.trim(), ...(formData.apiKey.trim() && { apiKey: formData.apiKey.trim() }), syntaxPrefix: "ACS", autoActivate: formData.autoActivate }, auditAdmin.id);
    revalidatePath("/admin/sepay"); revalidatePath("/profile");
    return { success: true, configured: Boolean(updated.apiKey) };
  } catch (error) { return { success: false, error: safeOperationMessage(error, "Không thể lưu cấu hình.") }; }

  });
}

// Preview only. It does not create bank events, transactions, or entitlements.
export async function simulateSePayWebhookAction(data: { paymentCode: string; amount: number }) {
  const auditAdmin = await requireAdmin("simulateSePayWebhookAction");
  return auditOutcome(auditAdmin.id, "simulateSePayWebhookAction", async () => {
  try {
    const code = data.paymentCode?.trim().toUpperCase();
    if (!/^ACS[A-F0-9]{16}$/.test(code)) throw new Error("Nhập mã thanh toán ACS của yêu cầu đã tạo.");
    const intent = await prisma.transaction.findUnique({ where: { paymentCode: code } });
    if (!intent) throw new Error("Không tìm thấy yêu cầu thanh toán.");
    const reason = paymentReviewReason(intent, { id: "preview", amount: data.amount, accountNumber: intent.accountNumber || "", content: code, transferType: "in" }, new Date());
    return { success: true, message: reason ? `Cần đối soát: ${reason}. Đây là bản xem trước, chưa ghi nhận tiền hoặc cấp VIP.` : "Dữ liệu khớp yêu cầu. Đây là bản xem trước, chưa ghi nhận tiền hoặc cấp VIP." };
  } catch (error) { return { success: false, error: safeOperationMessage(error, "Không thể xem trước.") }; }

  });
}

export async function approveTransactionAction(txId: string) {
  const admin = await requireAdmin("approveTransactionAction");
  return auditOutcome(admin.id, "approveTransactionAction", async () => {
  try {
    await approvePaymentIntent(txId, admin.id);
    revalidatePath("/admin/sepay"); revalidatePath("/admin/users"); revalidatePath("/profile");
    return { success: true, message: "Đã đối soát giao dịch ngân hàng và cấp quyền VIP." };
  } catch (error) { return { success: false, error: safeOperationMessage(error, "Không thể duyệt giao dịch.") }; }

  });
}

export async function deleteTransactionAction(txId: string) {
  const admin = await requireAdmin("deleteTransactionAction");
  return auditOutcome(admin.id, "deleteTransactionAction", async () => {
  try {
    await cancelUnpaidIntent(txId, admin.id);
    revalidatePath("/admin/sepay");
    return { success: true, message: "Đã hủy yêu cầu chưa thanh toán; bản ghi vẫn được giữ để đối soát." };
  } catch (error) { return { success: false, error: safeOperationMessage(error, "Không thể hủy yêu cầu.") }; }

  });
}

export async function setTransactionSandboxAction(txId:string,isSandbox:boolean){
 const admin=await requireAdmin("setTransactionSandboxAction");
 return auditOutcome(admin.id,"setTransactionSandboxAction",async()=>{try{
  if(typeof isSandbox!=="boolean")throw Error("Trạng thái thử nghiệm không hợp lệ.");
  await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "Transaction" WHERE id=${txId} FOR UPDATE`;await tx.transaction.update({where:{id:txId},data:{isSandbox}});await tx.vipGrantEvent.updateMany({where:{transactionId:txId},data:{isSandbox}});await tx.adminAuditLog.create({data:{actorId:admin.id,action:"PAYMENT_ENVIRONMENT_CHANGED",targetId:txId,details:JSON.stringify({isSandbox})}});});
  revalidatePath("/admin");revalidatePath("/admin/sepay");return {success:true,message:"Đã cập nhật phân loại báo cáo; quyền VIP hiện tại không thay đổi."};
 }catch(error){return {success:false,error:safeOperationMessage(error,"Không phân loại được giao dịch.")};}});
}

export async function recordRefundAction(txId:string,refundedAt:string){
 const admin=await requireAdmin("recordRefundAction");
 return auditOutcome(admin.id,"recordRefundAction",async()=>{try{
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(refundedAt))throw Error("Thời điểm hoàn tiền không hợp lệ.");
  const time=new Date(`${refundedAt.length===16?refundedAt+":00":refundedAt}+07:00`);
  if(!Number.isFinite(time.getTime())||new Date(time.getTime()+7*3600000).toISOString().slice(0,refundedAt.length)!==refundedAt||time>new Date())throw Error("Thời điểm hoàn tiền không hợp lệ hoặc nằm trong tương lai.");
  await prisma.$transaction(async tx=>{await tx.$queryRaw`SELECT id FROM "Transaction" WHERE id=${txId} FOR UPDATE`;const intent=await tx.transaction.findUniqueOrThrow({where:{id:txId}});if(intent.status!=="SUCCESS"||!intent.paidAt||time<intent.paidAt)throw Error("Chỉ ghi nhận hoàn tiền toàn phần cho giao dịch đã thanh toán, sau thời điểm trả tiền.");await tx.transaction.update({where:{id:txId},data:{status:"REFUNDED",refundedAt:time}});await tx.adminAuditLog.create({data:{actorId:admin.id,action:"PAYMENT_REFUND_RECORDED",targetId:txId,details:JSON.stringify({amount:intent.amount})}});});
  revalidatePath("/admin");revalidatePath("/admin/sepay");return {success:true,message:"Đã ghi nhận hoàn tiền toàn phần. Thao tác này không chuyển tiền qua ngân hàng hoặc tự thu hồi VIP."};
 }catch(error){return {success:false,error:safeOperationMessage(error,"Không ghi nhận được hoàn tiền.")};}});
}
