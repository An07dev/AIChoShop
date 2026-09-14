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
  isOpenAiActive: true,
};

/**
 * Lấy cấu hình hệ thống từ Database.
 * Hỗ trợ cả Prisma ORM và Direct SQL Fallback (tự phục hồi nếu instance PrismaClient cũ).
 */
export async function getSystemSettings(): Promise<SystemSettingData> {
  try {
    // 1. Thử dùng Prisma Model nếu có sẵn
    if ((prisma as any).systemSetting?.findUnique) {
      const setting = await (prisma as any).systemSetting.findUnique({
        where: { id: "default" },
      });
      if (setting) return setting;
    }

    // 2. Direct SQL Query Fallback (chạy trực tiếp trên PostgreSQL, an toàn 100%)
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SystemSetting" WHERE id = 'default' LIMIT 1;`
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }

    // 3. Nếu chưa có bản ghi, tạo bản ghi mặc định
    const envKey = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || null;
    const envModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const envStatus = process.env.OpenAIStatus?.trim().toLowerCase();
    const envIsOpenAi = envStatus === undefined ? true : envStatus === "true";

    await prisma.$executeRawUnsafe(
      `INSERT INTO "SystemSetting" ("id", "openaiApiKey", "openaiModel", "openaiBaseUrl", "isOpenAiActive", "createdAt", "updatedAt")
       VALUES ('default', $1, $2, null, $3, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING;`,
      envKey,
      envModel,
      envIsOpenAi
    );

    const createdRows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SystemSetting" WHERE id = 'default' LIMIT 1;`
    );
    if (createdRows && createdRows.length > 0) {
      return createdRows[0];
    }

    return {
      id: "default",
      openaiApiKey: envKey,
      openaiModel: envModel,
      openaiBaseUrl: null,
      isOpenAiActive: envIsOpenAi,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return {
      id: "default",
      openaiApiKey: process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "") || null,
      openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      openaiBaseUrl: null,
      isOpenAiActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Cập nhật cấu hình hệ thống
 * Hỗ trợ cả Prisma ORM và Direct SQL Fallback (không bao giờ lỗi upsert undefined)
 */
export async function updateSystemSettings(data: {
  adminPassword?: string | null;
  openaiApiKey?: string | null;
  openaiModel?: string;
  openaiBaseUrl?: string | null;
  isOpenAiActive?: boolean;
}): Promise<SystemSettingData> {
  const current = await getSystemSettings();

  const nextAdminPassword =
    data.adminPassword !== undefined
      ? data.adminPassword ? data.adminPassword.trim() : null
      : current.adminPassword || null;
  const nextApiKey =
    data.openaiApiKey !== undefined
      ? data.openaiApiKey ? data.openaiApiKey.trim() : null
      : current.openaiApiKey;
  const nextModel =
    data.openaiModel !== undefined
      ? data.openaiModel.trim()
      : current.openaiModel || "gpt-4o-mini";
  const nextBaseUrl =
    data.openaiBaseUrl !== undefined
      ? data.openaiBaseUrl ? data.openaiBaseUrl.trim() : null
      : current.openaiBaseUrl;
  const nextActive =
    data.isOpenAiActive !== undefined
      ? Boolean(data.isOpenAiActive)
      : current.isOpenAiActive;

  // 1. Thử dùng Prisma ORM nếu model systemSetting đã nạp vào client
  if ((prisma as any).systemSetting?.upsert) {
    try {
      return await (prisma as any).systemSetting.upsert({
        where: { id: "default" },
        update: {
          adminPassword: nextAdminPassword,
          openaiApiKey: nextApiKey,
          openaiModel: nextModel,
          openaiBaseUrl: nextBaseUrl,
          isOpenAiActive: nextActive,
        },
        create: {
          id: "default",
          adminPassword: nextAdminPassword,
          openaiApiKey: nextApiKey,
          openaiModel: nextModel,
          openaiBaseUrl: nextBaseUrl,
          isOpenAiActive: nextActive,
        },
      });
    } catch (ormErr) {
      console.warn("Prisma ORM upsert failed, falling back to direct SQL:", ormErr);
    }
  }

  // 2. Direct SQL Upsert Fallback (chạy độc lập, không phụ thuộc vào PrismaClient instance cache)
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SystemSetting" ("id", "adminPassword", "openaiApiKey", "openaiModel", "openaiBaseUrl", "isOpenAiActive", "createdAt", "updatedAt")
     VALUES ('default', $1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT ("id") DO UPDATE
     SET "adminPassword" = $1, "openaiApiKey" = $2, "openaiModel" = $3, "openaiBaseUrl" = $4, "isOpenAiActive" = $5, "updatedAt" = NOW();`,
    nextAdminPassword,
    nextApiKey,
    nextModel,
    nextBaseUrl,
    nextActive
  );

  const updatedRows: any = await prisma.$queryRawUnsafe(
    `SELECT * FROM "SystemSetting" WHERE id = 'default' LIMIT 1;`
  );

  if (updatedRows && updatedRows.length > 0) {
    return updatedRows[0];
  }

  return {
    id: "default",
    adminPassword: nextAdminPassword,
    openaiApiKey: nextApiKey,
    openaiModel: nextModel,
    openaiBaseUrl: nextBaseUrl,
    isOpenAiActive: nextActive,
    createdAt: current.createdAt || new Date(),
    updatedAt: new Date(),
  };
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
