"use server";

import { requireAdmin } from "@/lib/auth/session";

import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { updateSystemSettings, getSystemSettings } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { replacePassword } from "@/lib/auth/credentials";

/**
 * Server Action: Lưu cấu hình hệ thống (OpenAI API Key, Model, Base URL, Trạng thái)
 */
export async function saveSystemSettingsAction(formData: {
  openaiApiKey?: string;
  openaiModel?: string;
  openaiBaseUrl?: string;
  isOpenAiActive: boolean;
}) {
  await requireAdmin();
  try {
    const updated = await updateSystemSettings({
      openaiApiKey: formData.openaiApiKey !== undefined ? formData.openaiApiKey.trim() : undefined,
      openaiModel: formData.openaiModel?.trim() || "gpt-4o-mini",
      openaiBaseUrl: formData.openaiBaseUrl ? formData.openaiBaseUrl.trim() : null,
      isOpenAiActive: formData.isOpenAiActive,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Đã lưu cấu hình OpenAI & Hệ thống thành công!",
      data: {
        id: updated.id,
        configured: Boolean(updated.openaiApiKey || process.env.OPENAI_API_KEY),
        openaiModel: updated.openaiModel,
        openaiBaseUrl: updated.openaiBaseUrl,
        isOpenAiActive: updated.isOpenAiActive,
      },
    };
  } catch (error: any) {
    console.error("Error saving system settings:", error);
    return {
      success: false,
      error: error?.message || "Không thể lưu cấu hình hệ thống.",
    };
  }
}

/**
 * Server Action: Kiểm tra thử nghiệm OpenAI API Key xem có kết nối được không
 */
export async function testOpenAiConnectionAction(params: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}) {
  await requireAdmin();
  try {
    const settings = await getSystemSettings();
    const cleanKey = params.apiKey?.trim().replace(/^["']|["']$/g, "") || settings.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!cleanKey) {
      return {
        success: false,
        error: "Vui lòng nhập OpenAI API Key trước khi kiểm tra.",
      };
    }

    const cleanBaseUrl = params.baseUrl?.trim() || undefined;
    const testModel = params.model?.trim() || "gpt-4o-mini";

    const testClient = new OpenAI({
      apiKey: cleanKey,
      baseURL: cleanBaseUrl,
      timeout: 12000,
    });

    // Gửi 1 test prompt siêu ngắn (max 5 tokens) để xác thực key và model
    const response = await testClient.chat.completions.create({
      model: testModel,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });

    return {
      success: true,
      message: `Kết nối thành công! Key hợp lệ và Model '${testModel}' phản hồi tốt.`,
      sampleReply: response.choices[0]?.message?.content || "OK",
    };
  } catch (error: any) {
    console.error("OpenAI test connection error:", error);

    let friendlyError = error?.message || "Không thể kết nối đến OpenAI.";
    if (error?.status === 401) {
      friendlyError = "Lỗi xác thực (401): API Key không chính xác hoặc đã bị thu hồi.";
    } else if (error?.status === 429) {
      friendlyError = "Lỗi hạn ngạch (429): Tài khoản OpenAI của bạn đã hết Credits (Quota) hoặc bị giới hạn Rate Limit.";
    } else if (error?.status === 404) {
      friendlyError = `Model '${params.model || "gpt-4o-mini"}' không tồn tại hoặc tài khoản không có quyền truy cập.`;
    } else if (error?.code === "ECONNREFUSED" || friendlyError.includes("fetch failed")) {
      friendlyError = "Lỗi kết nối mạng: Không thể liên lạc với máy chủ OpenAI hoặc Base URL không hợp lệ.";
    }

    return {
      success: false,
      error: friendlyError,
    };
  }
}

/**
 * Server Action: Đổi mật khẩu tài khoản ADMIN
 */
export async function changeAdminPasswordAction(params: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  await requireAdmin();
  try {
    const currentPassword = params.currentPassword || "";
    const newPassword = params.newPassword || "";
    const confirmPassword = params.confirmPassword || "";

    if (!currentPassword) {
      return { success: false, error: "Vui lòng nhập mật khẩu Admin hiện tại." };
    }

    if (!newPassword) {
      return { success: false, error: "Vui lòng nhập mật khẩu mới." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Mật khẩu mới phải có tối thiểu 6 ký tự." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Xác nhận mật khẩu mới không khớp!" };
    }

    const admin = await requireAdmin();
    const account = await prisma.user.findUnique({ where: { id: admin.id }, select: { password: true } });
    if (!account || !(await verifyPassword(currentPassword, account.password))) return { success: false, error: "Mật khẩu hiện tại không chính xác." };
    await replacePassword(admin.id, newPassword, account.password);

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Đổi mật khẩu ADMIN thành công. Vui lòng đăng nhập lại.",
    };
  } catch (error: any) {
    console.error("Error changing admin password:", error);
    return {
      success: false,
      error: error?.message || "Lỗi hệ thống khi đổi mật khẩu Admin.",
    };
  }
}
