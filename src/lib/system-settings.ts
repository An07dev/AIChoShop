import { dataFailure } from "./db-errors";
import { audit } from "@/lib/auth/audit";
import { prisma } from "@/lib/prisma";

export interface SystemSettingData {
  id: string;
  adminPassword?: string | null;
  openaiApiKey: string | null;
  openaiModel: string;
  openaiBaseUrl: string | null;
  isOpenAiActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SYSTEM_SETTINGS = {
  id: "default",
  adminPassword: null,
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  openaiBaseUrl: "",
    isOpenAiActive: false,
};

// Cache cấu hình hệ thống trong bộ nhớ 60s để tránh truy vấn Database liên tục trên mỗi yêu cầu AI
let cachedSettings: { data: SystemSettingData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export function invalidateSystemSettingsCache() {
  cachedSettings = null;
}

/**
 * Lấy cấu hình hệ thống từ Database có bộ đệm bộ nhớ (In-memory Cache 60s).
 * Tự động dùng bản cache dự phòng nếu Database gặp sự cố tạm thời (Zero-downtime resilience).
 */
export async function getSystemSettings(forceRefresh = false): Promise<SystemSettingData> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.data;
  }

  try {
    const setting = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    if (setting) {
      cachedSettings = { data: setting, expiresAt: now + CACHE_TTL_MS };
      return setting;
    }
    const envKey = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || null;
    const envModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const envStatus = process.env.OpenAIStatus?.trim().toLowerCase();
    const envIsOpenAi = envStatus === undefined ? true : envStatus === "true";

    const defaultData: SystemSettingData = {
      id: "default",
      openaiApiKey: envKey,
      openaiModel: envModel,
      openaiBaseUrl: null,
      isOpenAiActive: envIsOpenAi,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cachedSettings = { data: defaultData, expiresAt: now + CACHE_TTL_MS };
    return defaultData;
  } catch (error) {
    // Nếu DB chập chờn nhưng đã có bản cache trước đó -> tái sử dụng an toàn để không sập app
    if (cachedSettings) {
      console.warn("[SystemSettings] Lỗi đọc Database, sử dụng bản cache gần nhất:", error);
      return cachedSettings.data;
    }
    const failure = dataFailure(error, "read-system-settings");
    throw Object.assign(new Error(failure.message), { code: failure.code });
  }
}

/**
 * Cập nhật cấu hình hệ thống
 * Ghi cấu hình và nhật ký trong cùng transaction, xóa cache bộ nhớ ngay lập tức.
 */
export async function updateSystemSettings(data: {
  openaiApiKey?: string | null; openaiModel?: string; openaiBaseUrl?: string | null; isOpenAiActive?: boolean;
}, actorId: string): Promise<SystemSettingData> {
  return prisma.$transaction(async tx => {
    const values = {
      ...(data.openaiApiKey?.trim() && { openaiApiKey: data.openaiApiKey.trim() }),
      ...(data.openaiModel !== undefined && { openaiModel: data.openaiModel.trim() }),
      ...(data.openaiBaseUrl !== undefined && { openaiBaseUrl: data.openaiBaseUrl?.trim() || null }),
      ...(data.isOpenAiActive !== undefined && { isOpenAiActive: data.isOpenAiActive }),
    };
    const updated = await tx.systemSetting.upsert({ where: { id: "default" }, create: { id: "default", ...values }, update: values });
    await audit(tx, actorId, "SYSTEM_SETTINGS_UPDATED", "default", {
      keyChanged: !!data.openaiApiKey?.trim(), modelChanged: data.openaiModel !== undefined,
      endpointChanged: data.openaiBaseUrl !== undefined, isOpenAiActive: updated.isOpenAiActive,
    });
    invalidateSystemSettingsCache();
    return updated;
  });
}

export async function getOpenAiToken(): Promise<{
  token: string;
  apiKey: string;
  model: string;
  baseURL?: string;
  isOpenAiActive: boolean;
}> {
  const settings = await getSystemSettings();
  const rawKey = settings.openaiApiKey || process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || "";

  return {
    token: rawKey,
    apiKey: rawKey,
    model: settings.openaiModel || "gpt-4o-mini",
    baseURL: settings.openaiBaseUrl || undefined,
    isOpenAiActive: settings.isOpenAiActive,
  };
}
