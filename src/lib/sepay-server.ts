import { prisma } from "@/lib/prisma";

export interface SePayConfigData {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  apiKey: string | null;
  syntaxPrefix: string;
  autoActivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SEPAY_CONFIG = {
  id: "default",
  bankName: "MB Bank",
  accountNumber: "0358888899",
  accountHolder: "AIChoShop Official",
  apiKey: "",
  syntaxPrefix: "VIP",
  autoActivate: true,
};

/**
 * Lấy cấu hình SePay từ Database.
 * Nếu chưa có thì tự động tạo cấu hình mặc định.
 */
export async function getSePayConfig(): Promise<SePayConfigData> {
  try {
    let config = await prisma.sePayConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.sePayConfig.create({
        data: {
          id: "default",
          bankName: DEFAULT_SEPAY_CONFIG.bankName,
          accountNumber: DEFAULT_SEPAY_CONFIG.accountNumber,
          accountHolder: DEFAULT_SEPAY_CONFIG.accountHolder,
          apiKey: DEFAULT_SEPAY_CONFIG.apiKey,
          syntaxPrefix: DEFAULT_SEPAY_CONFIG.syntaxPrefix,
          autoActivate: DEFAULT_SEPAY_CONFIG.autoActivate,
        },
      });
    }

    return config;
  } catch (error) {
    console.error("Error fetching SePay config:", error);
    return {
      ...DEFAULT_SEPAY_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Cập nhật cấu hình SePay
 */
export async function updateSePayConfig(data: {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  apiKey?: string;
  syntaxPrefix?: string;
  autoActivate?: boolean;
}): Promise<SePayConfigData> {
  return await prisma.sePayConfig.upsert({
    where: { id: "default" },
    update: {
      ...(data.bankName !== undefined && { bankName: data.bankName }),
      ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
      ...(data.accountHolder !== undefined && { accountHolder: data.accountHolder }),
      ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
      ...(data.syntaxPrefix !== undefined && { syntaxPrefix: data.syntaxPrefix }),
      ...(data.autoActivate !== undefined && { autoActivate: data.autoActivate }),
    },
    create: {
      id: "default",
      bankName: data.bankName || DEFAULT_SEPAY_CONFIG.bankName,
      accountNumber: data.accountNumber || DEFAULT_SEPAY_CONFIG.accountNumber,
      accountHolder: data.accountHolder || DEFAULT_SEPAY_CONFIG.accountHolder,
      apiKey: data.apiKey || DEFAULT_SEPAY_CONFIG.apiKey,
      syntaxPrefix: data.syntaxPrefix || DEFAULT_SEPAY_CONFIG.syntaxPrefix,
      autoActivate: data.autoActivate ?? DEFAULT_SEPAY_CONFIG.autoActivate,
    },
  });
}

/**
 * Kiểm tra và tự động hạ cấp tài khoản nếu đã hết hạn VIP.
 */
export async function syncUserVipExpiration(user: {
  id: string;
  isVIP: boolean;
  vipExpiresAt: Date | null;
}): Promise<{ isVIP: boolean; vipExpiresAt: Date | null }> {
  if (!user.isVIP || !user.vipExpiresAt) {
    return { isVIP: user.isVIP, vipExpiresAt: user.vipExpiresAt };
  }

  const isExpired = new Date(user.vipExpiresAt).getTime() <= Date.now();
  if (isExpired) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVIP: false },
    });
    return { isVIP: false, vipExpiresAt: user.vipExpiresAt };
  }

  return { isVIP: true, vipExpiresAt: user.vipExpiresAt };
}

/**
 * Quét toàn bộ và tự động hạ cấp các tài khoản VIP đã hết hạn.
 */
export async function syncAllExpiredVipUsers(): Promise<number> {
  try {
    const result = await prisma.user.updateMany({
      where: {
        isVIP: true,
        vipExpiresAt: {
          lte: new Date(),
        },
      },
      data: {
        isVIP: false,
      },
    });
    return result.count;
  } catch (error) {
    console.error("Failed to sync expired VIP users:", error);
    return 0;
  }
}

/**
 * Tính toán thời điểm hết hạn VIP mới khi gia hạn hoặc kích hoạt.
 * - durationDays = 0 hoặc null: Vĩnh viễn (null)
 * - durationDays > 0: Cộng thêm số ngày (cộng dồn nếu VIP hiện tại còn hạn)
 */
export function calculateNewVipExpiration(
  currentExpiresAt: Date | string | null | undefined,
  currentIsVIP: boolean,
  durationDays: number | null | undefined
): Date | null {
  // Trọn đời / vĩnh viễn
  if (!durationDays || durationDays === 0) {
    return null;
  }

  // Nếu người dùng hiện đang là VIP trọn đời (isVIP = true và vipExpiresAt = null/undefined),
  // luôn giữ nguyên VIP trọn đời, không bị ghi đè xuống gói có thời hạn
  if (currentIsVIP && (currentExpiresAt === null || currentExpiresAt === undefined)) {
    return null;
  }

  const now = new Date();
  let baseDate = now;

  // Nếu người dùng hiện đang là VIP và còn hạn trong tương lai thì cộng dồn từ ngày hết hạn cũ
  if (currentIsVIP && currentExpiresAt) {
    const existingDate = new Date(currentExpiresAt);
    if (!isNaN(existingDate.getTime()) && existingDate.getTime() > now.getTime()) {
      baseDate = existingDate;
    }
  }

  const newDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  return newDate;
}
