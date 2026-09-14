"use server";

import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOfficialCategory } from "@/lib/pricing/registry";



function nullableNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${key} không hợp lệ.`);
  return value;
}

function vietnamDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  return new Date(`${String(value)}T00:00:00+07:00`);
}

export async function createPricingFeeOverride(formData: FormData) {
  await requireAdmin();
  const platform = String(formData.get("platform") ?? "");
  const shopType = String(formData.get("shopType") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const effectiveFrom = vietnamDate(formData.get("effectiveFrom"));
  const effectiveTo = vietnamDate(formData.get("effectiveTo"));
  if (!(["shopee", "tiktok"].includes(platform)) || !(["marketplace", "mall"].includes(shopType))) throw new Error("Sàn hoặc loại shop không hợp lệ.");
  const category = getOfficialCategory(categoryId);
  const applicableRate = shopType === "mall" ? category?.mallRate : category?.marketplaceRate;
  if (!category || category.platform !== platform || applicableRate === null) throw new Error("Ngành hàng không hợp lệ với sàn hoặc loại shop.");
  if (!sourceName || !effectiveFrom || Number.isNaN(effectiveFrom.getTime()) || (effectiveTo && Number.isNaN(effectiveTo.getTime()))) throw new Error("Nguồn và ngày hiệu lực là bắt buộc.");
  const commissionRate = nullableNumber(formData, "commissionRate");
  const transactionRate = nullableNumber(formData, "transactionRate");
  const orderProcessingFee = nullableNumber(formData, "orderProcessingFee");
  if (commissionRate === null && transactionRate === null && orderProcessingFee === null) throw new Error("Cần nhập ít nhất một mức phí.");
  if ((commissionRate ?? 0) > 100 || (transactionRate ?? 0) > 100) throw new Error("Tỷ lệ phí không được vượt 100%.");
  await prisma.pricingFeeOverride.create({ data: {
    platform, shopType, categoryId, commissionRate, transactionRate,
    orderProcessingFee: orderProcessingFee === null ? null : Math.round(orderProcessingFee),
    effectiveFrom, effectiveTo, sourceName, sourceUrl, note,
  } });
  revalidatePath("/admin/pricing-fees");
  revalidatePath("/tools/pricing-calculator");
}

export async function deactivatePricingFeeOverride(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Thiếu mã biểu phí.");
  await prisma.pricingFeeOverride.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/pricing-fees");
  revalidatePath("/tools/pricing-calculator");
}
