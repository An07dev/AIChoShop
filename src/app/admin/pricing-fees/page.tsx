
import { requireAdmin } from "@/lib/auth/session";
import { BadgePercent, ExternalLink, PlusCircle, PowerOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FEE_DATA_VERSION, getCategoryLabel, getOfficialCategory } from "@/lib/pricing/registry";
import { deactivatePricingFeeOverride } from "./actions";
import PricingFeeOverrideForm from "./PricingFeeOverrideForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản Trị Biểu Phí Sàn TMĐT",
  description: "Cấu hình tỷ lệ hoa hồng, phí thanh toán và phí cố định cho các sàn Shopee, TikTok Shop, Lazada.",
};

const date = (value: Date | null) => value ? new Intl.DateTimeFormat("vi-VN").format(value) : "Không giới hạn";
const status = (from: Date, to: Date | null, now: Date) => to && to < now
  ? { label: "Đã hết hiệu lực", className: "bg-slate-100 text-slate-600" }
  : from > now
    ? { label: "Sắp áp dụng", className: "bg-amber-50 text-amber-700" }
    : { label: "Đang áp dụng", className: "bg-emerald-50 text-emerald-700" };

export default async function PricingFeesAdminPage() {
  await requireAdmin();
  const overrides = await prisma.pricingFeeOverride.findMany({
    where: { active: true },
    orderBy: { effectiveFrom: "desc" },
  });

  return (
    <div className="space-y-6 w-full lg:w-[70%] mx-auto pb-12">
      <AdminPageHeader
        title="Quản Trị Biểu Phí Sàn Thương Mại Điện Tử"
        subtitle={`Cập nhật tỷ lệ hoa hồng, phí giao dịch và phí theo đơn cho Shopee, TikTok Shop. Dữ liệu tích hợp phiên bản ${FEE_DATA_VERSION}.`}
        icon={BadgePercent}
        iconGradient="from-blue-600 to-indigo-600"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            v{FEE_DATA_VERSION}
          </span>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="mb-5 flex items-center gap-2 font-black text-slate-900 text-base">
          <PlusCircle size={18} className="text-emerald-600" />
          <span>Thêm phiên bản biểu phí</span>
        </h2>
        <PricingFeeOverrideForm />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-black text-slate-900 text-base">Các bản ghi đang hoạt động</h2>
        </div>
        {overrides.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Chưa có bản ghi ghi đè. Công cụ đang dùng biểu phí tích hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Sàn / shop</th>
                  <th className="p-3.5">Ngành</th>
                  <th className="p-3.5">Mức phí</th>
                  <th className="p-3.5">Hiệu lực</th>
                  <th className="p-3.5">Nguồn</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overrides.map((item) => {
                  const category = getOfficialCategory(item.categoryId);
                  const state = status(item.effectiveFrom, item.effectiveTo, new Date());
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-bold uppercase text-slate-900">
                        {item.platform}
                        <span className="block text-[11px] font-normal text-slate-400 normal-case">
                          {item.shopType === "mall" ? "Shopee Mall / Shop Mall" : "Shop thường (Marketplace)"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {category ? getCategoryLabel(category) : item.categoryId}
                      </td>
                      <td className="p-3.5 font-mono text-xs text-slate-800">
                        HH {item.commissionRate ?? "—"}% · GD {item.transactionRate ?? "—"}% ·{" "}
                        {item.orderProcessingFee?.toLocaleString("vi-VN") ?? "—"}đ
                      </td>
                      <td className="p-3.5 text-xs">
                        <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 font-bold ${state.className}`}>
                          {state.label}
                        </span>
                        <span className="block text-slate-600">{date(item.effectiveFrom)}</span>
                        <span className="block text-slate-400">đến {date(item.effectiveTo)}</span>
                      </td>
                      <td className="p-3.5 text-xs">
                        <span className="font-semibold text-slate-900">{item.sourceName}</span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 inline-flex text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                        {item.note && (
                          <span className="block max-w-xs truncate text-[11px] text-slate-400 mt-0.5">
                            {item.note}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <form action={deactivatePricingFeeOverride}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer">
                            <PowerOff size={13} />
                            <span>Ngừng áp dụng</span>
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
