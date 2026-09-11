"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Calculator,
  AlertTriangle,
  Info,
  RotateCcw,
  Sparkles,
  Building2,
  DollarSign,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { TaxCalculatorOutput } from "@/components/tools/TaxCalculatorOutput";

export default function TaxCalculator() {
  const [revenue, setRevenue] = useState("500000000");
  const [businessType, setBusinessType] = useState("ho-kinh-doanh");
  const [platformFees, setPlatformFees] = useState("70000000"); // Mặc định ~14% phí sàn

  const results = useMemo(() => {
    const rev = Number(revenue) || 0;
    const fees = Number(platformFees) || 0;

    // Thuế suất thương mại điện tử (phân phối, cung cấp hàng hóa)
    // Hộ kinh doanh / Cá nhân kinh doanh: 1.5% (1% GTGT + 0.5% TNCN)
    // Nếu doanh thu <= 100tr/năm -> Miễn thuế
    let gtgt = 0;
    let tncn = 0;
    let isExempt = false;

    if (businessType === "ho-kinh-doanh" || businessType === "ca-nhan") {
      if (rev <= 100000000) {
        isExempt = true;
      } else {
        gtgt = rev * 0.01;
        tncn = rev * 0.005;
      }
    } else if (businessType === "cong-ty") {
      // Đơn giản hóa cho Công ty (thực tế phức tạp hơn dựa trên lợi nhuận)
      // GTGT đóng theo phương pháp khấu trừ, TNDN 20% trên lợi nhuận
      gtgt = rev * 0.1; // Khách trả, công ty nộp thay (tạm tính)
      const estimatedProfit = rev - fees - rev * 0.7; // Tạm tính giá vốn 70%
      tncn = Math.max(0, estimatedProfit * 0.2); // Thuế TNDN 20%
    }

    const totalTax = isExempt ? 0 : gtgt + tncn;
    const netRevenue = rev - fees - totalTax;

    const effectiveTaxRate = rev > 0 ? (totalTax / rev) * 100 : 0;
    const platformFeeRate = rev > 0 ? (fees / rev) * 100 : 0;
    const netRate = rev > 0 ? (netRevenue / rev) * 100 : 0;

    return {
      gtgt,
      tncn,
      totalTax,
      netRevenue,
      isExempt,
      effectiveTaxRate,
      platformFeeRate,
      netRate,
    };
  }, [revenue, businessType, platformFees]);

  const handleResetForm = () => {
    setRevenue("");
    setPlatformFees("");
    setBusinessType("ho-kinh-doanh");
  };

  // Các nút nhanh cho doanh thu
  const handleAddRevenue = (amount: number) => {
    const current = Number(revenue) || 0;
    const updated = current + amount;
    setRevenue(String(updated));
    // Tự động tính 14% phí sàn mẫu
    setPlatformFees(String(Math.round(updated * 0.14)));
  };

  // Nút nhanh cho phí sàn theo tỷ lệ %
  const handleSetFeePercent = (pct: number) => {
    const rev = Number(revenue) || 0;
    if (rev > 0) {
      setPlatformFees(String(Math.round((rev * pct) / 100)));
    }
  };

  // Kịch bản mẫu
  const handleLoadScenario = (rev: number, feePct: number, type: string) => {
    setBusinessType(type);
    setRevenue(String(rev));
    setPlatformFees(String(Math.round((rev * feePct) / 100)));
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  Tính Thuế TMĐT (Shopee/TikTok)
                </h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  FREE TOOL
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Tính toán chính xác thuế GTGT, TNCN phải nộp theo quy định pháp luật hiện hành.
              </p>
            </div>
          </div>
        </div>

        {/* Nút kịch bản nhanh */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleLoadScenario(80000000, 14, "ho-kinh-doanh")}
            className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            Shop &lt; 100tr (Miễn thuế)
          </button>
          <button
            onClick={() => handleLoadScenario(500000000, 14, "ho-kinh-doanh")}
            className="text-[11px] font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            Shop 500tr
          </button>
          <button
            onClick={() => handleLoadScenario(2000000000, 14, "ho-kinh-doanh")}
            className="text-[11px] font-semibold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-sm"
          >
            Shop 2 tỷ
          </button>
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Form nhập thông số */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Form */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-rose-500" />
              <h2 className="font-bold text-slate-800 text-sm">Thông số kinh doanh</h2>
            </div>
            {(revenue || platformFees) && (
              <button
                onClick={handleResetForm}
                className="text-xs font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                title="Làm mới form"
              >
                <RotateCcw size={12} /> Làm mới
              </button>
            )}
          </div>

          {/* Form scrollable content */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {/* Loại hình kinh doanh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" />
                Loại hình kinh doanh
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-semibold text-slate-800 cursor-pointer"
              >
                <option value="ho-kinh-doanh">
                  Hộ Kinh Doanh (Khuyên dùng - Thuế 1.5%)
                </option>
                <option value="ca-nhan">Cá Nhân Kinh Doanh (Thuế 1.5%)</option>
                <option value="cong-ty">
                  Công Ty / Doanh Nghiệp (TNDN 20% + GTGT 10%)
                </option>
              </select>
            </div>

            {/* Doanh thu Sàn ghi nhận */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <DollarSign size={12} className="text-slate-400" />
                  Tổng doanh thu Sàn ghi nhận (VNĐ / Năm)
                </label>
                {revenue && (
                  <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                    {new Intl.NumberFormat("vi-VN").format(Number(revenue))} ₫
                  </span>
                )}
              </div>
              <input
                type="text"
                value={revenue ? new Intl.NumberFormat("vi-VN").format(Number(revenue)) : ""}
                onChange={(e) => setRevenue(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="VD: 500.000.000"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono font-bold text-slate-800 placeholder:text-slate-400"
              />

              {/* Nút cộng nhanh doanh thu */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: "+50tr", val: 50000000 },
                  { label: "+100tr", val: 100000000 },
                  { label: "+500tr", val: 500000000 },
                  { label: "+1 tỷ", val: 1000000000 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddRevenue(item.val)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 flex items-start gap-1 leading-snug">
                <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
                <span>
                  Doanh thu này là tổng tiền hàng người mua trả, chưa trừ phí sàn. Cơ quan thuế tính trên con số này.
                </span>
              </p>
            </div>

            {/* Tổng các loại phí Sàn */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Percent size={12} className="text-slate-400" />
                  Tổng phí Sàn (VNĐ / Năm)
                </label>
                {platformFees && (
                  <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    {new Intl.NumberFormat("vi-VN").format(Number(platformFees))} ₫
                  </span>
                )}
              </div>
              <input
                type="text"
                value={
                  platformFees
                    ? new Intl.NumberFormat("vi-VN").format(Number(platformFees))
                    : ""
                }
                onChange={(e) => setPlatformFees(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Phí thanh toán, cố định, voucher, ads..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono font-bold text-slate-800 placeholder:text-slate-400"
              />

              {/* Nút % phí sàn nhanh */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-slate-400">Chọn nhanh theo %:</span>
                {[10, 12, 14, 16].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSetFeePercent(pct)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-all cursor-pointer active:scale-95"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Hộp cảnh báo pháp lý */}
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <p className="leading-relaxed">
                Trốn thuế TMĐT hiện nay sẽ bị phạt rất nặng (truy thu + phạt chậm nộp 0.03%/ngày). Khai báo <strong>Hộ kinh doanh đóng 1.5%</strong> là phương án an toàn và tối ưu nhất cho cá nhân.
              </p>
            </div>
          </div>
        </div>

        {/* Cột phải: Dashboard bảng phân tích thuế */}
        <div className="lg:col-span-7 h-full min-h-0">
          <TaxCalculatorOutput
            revenue={Number(revenue) || 0}
            platformFees={Number(platformFees) || 0}
            businessType={businessType}
            results={results}
          />
        </div>
      </div>
    </div>
  );
}
