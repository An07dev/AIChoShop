"use client";

import { useMemo, useState, type ReactNode } from "react";
import { getAvailableCategories, getDefaultCategoryId } from "@/lib/pricing/registry";
import type { Platform, ShopType } from "@/lib/pricing/types";
import { createPricingFeeOverride } from "./actions";

export default function PricingFeeOverrideForm() {
  const [platform, setPlatform] = useState<Platform>("shopee");
  const [shopType, setShopType] = useState<ShopType>("marketplace");
  const [categoryId, setCategoryId] = useState(() => getDefaultCategoryId("shopee", "marketplace"));
  const categories = useMemo(() => getAvailableCategories(platform, shopType), [platform, shopType]);
  const selected = categories.find((category) => category.id === categoryId) ?? categories[0];
  const level1Values = Array.from(new Set(categories.map((category) => category.level1)));
  const level2Values = Array.from(new Set(categories.filter((category) => category.level1 === selected.level1).map((category) => category.level2)));
  const level3Values = categories.filter((category) => category.level1 === selected.level1 && category.level2 === selected.level2);
  const changeScope = (nextPlatform: Platform, nextShopType: ShopType) => {
    setPlatform(nextPlatform); setShopType(nextShopType);
    setCategoryId(getDefaultCategoryId(nextPlatform, nextShopType));
  };
  return <form action={createPricingFeeOverride} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <input type="hidden" name="platform" value={platform} /><input type="hidden" name="shopType" value={shopType} />
    <AdminField label="Sàn"><select value={platform} onChange={(event) => changeScope(event.target.value as Platform, shopType)} className="admin-input"><option value="shopee">Shopee</option><option value="tiktok">TikTok Shop</option></select></AdminField>
    <AdminField label="Loại shop"><select value={shopType} onChange={(event) => changeScope(platform, event.target.value as ShopType)} className="admin-input"><option value="marketplace">Shop thường</option><option value="mall">Mall</option></select></AdminField>
    <AdminField label="Ngành cấp 1"><select value={selected.level1} onChange={(event) => setCategoryId(categories.find((item) => item.level1 === event.target.value)!.id)} className="admin-input">{level1Values.map((value) => <option key={value}>{value}</option>)}</select></AdminField>
    <AdminField label="Ngành cấp 2"><select value={selected.level2} onChange={(event) => setCategoryId(categories.find((item) => item.level1 === selected.level1 && item.level2 === event.target.value)!.id)} className="admin-input">{level2Values.map((value) => <option key={value}>{value}</option>)}</select></AdminField>
    <AdminField label="Ngành cấp 3"><select name="categoryId" value={selected.id} onChange={(event) => setCategoryId(event.target.value)} className="admin-input">{level3Values.map((item) => <option key={item.id} value={item.id}>{item.level3}</option>)}</select></AdminField>
    <AdminField label="Mức tích hợp hiện tại"><input readOnly value={`${shopType === "mall" ? selected.mallRate : selected.marketplaceRate}%`} className="admin-input font-bold" /></AdminField>
    <AdminField label="Ngày bắt đầu"><input required type="date" name="effectiveFrom" className="admin-input" /></AdminField>
    <AdminField label="Ngày kết thúc"><input type="date" name="effectiveTo" className="admin-input" /></AdminField>
    <AdminField label="Hoa hồng ghi đè (%)"><input min="0" max="100" step="0.01" type="number" name="commissionRate" className="admin-input" /></AdminField>
    <AdminField label="Giao dịch ghi đè (%)"><input min="0" max="100" step="0.01" type="number" name="transactionRate" className="admin-input" /></AdminField>
    <AdminField label="Phí theo đơn ghi đè"><input min="0" step="1" type="number" name="orderProcessingFee" className="admin-input" /></AdminField>
    <AdminField label="Tên nguồn"><input required name="sourceName" placeholder="Seller Center / thông báo..." className="admin-input" /></AdminField>
    <AdminField label="URL nguồn"><input type="url" name="sourceUrl" placeholder="https://..." className="admin-input" /></AdminField>
    <div className="md:col-span-2 lg:col-span-3"><AdminField label="Ghi chú"><input name="note" placeholder="Điều kiện chương trình hoặc hợp đồng riêng..." className="admin-input" /></AdminField></div>
    <div className="md:col-span-2 lg:col-span-4"><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Lưu và áp dụng</button></div>
  </form>;
}

function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>{children}</label>;
}
