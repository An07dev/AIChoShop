/**
 * Utility functions for computing VIP duration, remaining days, and status.
 * Client-safe (does not import database or server packages).
 */

export interface VipStatusInfo {
  isVIP: boolean;
  isLifetime: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  formattedText: string;
  badgeType: "lifetime" | "active" | "expired" | "free";
}

export function isVipActive(user: { isVIP: boolean; vipExpiresAt: Date | string | null } | null | undefined, now = new Date()): boolean {
  if (!user?.isVIP) return false;
  if (user.vipExpiresAt === null) return true;
  const expiresAt = new Date(user.vipExpiresAt);
  return Number.isFinite(expiresAt.getTime()) && expiresAt > now;
}

/**
 * Tính số ngày VIP còn lại.
 * - null: VIP Vĩnh viễn (hoặc chưa là VIP)
 * - 0: Đã hết hạn
 * - >0: Số ngày còn lại
 */
export function computeVipDaysLeft(vipExpiresAt: Date | string | null | undefined): number | null {
  if (!vipExpiresAt) return null;
  
  const expiryDate = new Date(vipExpiresAt);
  if (isNaN(expiryDate.getTime())) return null;

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Kiểm tra xem tài khoản VIP đã quá hạn hay chưa.
 */
export function isVipExpired(vipExpiresAt: Date | string | null | undefined): boolean {
  if (!vipExpiresAt) return false;
  const expiryDate = new Date(vipExpiresAt);
  if (isNaN(expiryDate.getTime())) return false;
  return expiryDate.getTime() <= Date.now();
}

/**
 * Phân tích và định dạng trạng thái VIP chi tiết
 */
export function getVipStatusInfo(
  isVIP: boolean,
  vipExpiresAt: Date | string | null | undefined
): VipStatusInfo {
  if (!isVIP) {
    return {
      isVIP: false,
      isLifetime: false,
      isExpired: false,
      daysLeft: null,
      formattedText: "Tài khoản Miễn phí (Free)",
      badgeType: "free",
    };
  }

  // User is VIP
  if (!vipExpiresAt) {
    return {
      isVIP: true,
      isLifetime: true,
      isExpired: false,
      daysLeft: null,
      formattedText: "VIP Trọn đời (Vĩnh viễn)",
      badgeType: "lifetime",
    };
  }

  const daysLeft = computeVipDaysLeft(vipExpiresAt);
  const expiryDate = new Date(vipExpiresAt);
  const formattedDate = !isNaN(expiryDate.getTime())
    ? `${expiryDate.getDate().toString().padStart(2, "0")}/${(expiryDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${expiryDate.getFullYear()}`
    : "";

  if (daysLeft === 0) {
    return {
      isVIP: false, // đã quá hạn
      isLifetime: false,
      isExpired: true,
      daysLeft: 0,
      formattedText: `Đã hết hạn VIP (${formattedDate})`,
      badgeType: "expired",
    };
  }

  return {
    isVIP: true,
    isLifetime: false,
    isExpired: false,
    daysLeft,
    formattedText: `VIP Còn ${daysLeft} ngày (Đến ${formattedDate})`,
    badgeType: "active",
  };
}
