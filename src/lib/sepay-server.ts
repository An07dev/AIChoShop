import { dataFailure } from "@/lib/db-errors";
import { audit } from "@/lib/auth/audit";
import { isVipActive } from "@/lib/vip-expiration";
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
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  apiKey: "",
  syntaxPrefix: "ACS",
  autoActivate: false,
};

/**
 * Lấy cấu hình SePay từ Database.
 * Chưa cấu hình trả về trạng thái tắt; lỗi database được truyền lên để đóng cổng thanh toán.
 */
export async function getSePayConfig(): Promise<SePayConfigData> {
  const config = await prisma.sePayConfig.findUnique({ where: { id: "default" } });
  return config ?? { ...DEFAULT_SEPAY_CONFIG, createdAt: new Date(), updatedAt: new Date() };
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
}, actorId: string): Promise<SePayConfigData> {
  return prisma.$transaction(async tx => {
  const updated = await tx.sePayConfig.upsert({
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
  await audit(tx, actorId, "BANK_SETTINGS_UPDATED", "default", { keyChanged: data.apiKey !== undefined, bankChanged: data.bankName !== undefined, accountChanged: data.accountNumber !== undefined, holderChanged: data.accountHolder !== undefined, autoActivate: updated.autoActivate });
  return updated;
  });
}

/**
 * Tính quyền VIP hiện tại, không ghi dữ liệu khi chỉ xem trang.
 */
export async function syncUserVipExpiration(user: {
  id: string;
  isVIP: boolean;
  vipExpiresAt: Date | null;
}): Promise<{ isVIP: boolean; vipExpiresAt: Date | null }> {
  return { isVIP: isVipActive(user), vipExpiresAt: user.vipExpiresAt };
}

/**
 * Quét toàn bộ và tự động hạ cấp các tài khoản VIP đã hết hạn.
 */
export async function syncAllExpiredVipUsers(): Promise<number> {
  try {
    const result = await prisma.$transaction(async tx => {
    const expired = await tx.user.findMany({ where: { isVIP: true, vipExpiresAt: { lte: new Date() } }, select: { id: true } });
    let count = 0;
    for (const user of expired) {
    const changed = await tx.user.updateMany({
      where: {
        id: user.id,
        isVIP: true,
        vipExpiresAt: {
          lte: new Date(),
        },
      },
      data: {
        isVIP: false,
      },
    });
    if (changed.count) { await audit(tx, "system", "VIP_EXPIRED", user.id); count++; }
    }
    return { count };
    });
    return result.count;
  } catch (error) {
    dataFailure(error, "lib/sepay-server.ts");
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
