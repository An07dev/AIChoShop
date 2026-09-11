"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
  Building2,
  ShieldCheck,
  Scale,
  Sparkles,
} from "lucide-react";

export interface TaxCalculatorResults {
  gtgt: number;
  tncn: number;
  totalTax: number;
  netRevenue: number;
  isExempt: boolean;
  effectiveTaxRate: number;
  platformFeeRate: number;
  netRate: number;
}

interface TaxCalculatorOutputProps {
  revenue: number;
  platformFees: number;
  businessType: string;
  results: TaxCalculatorResults;
}

export function TaxCalculatorOutput({
  revenue,
  platformFees,
  businessType,
  results,
}: TaxCalculatorOutputProps) {
  const [copied, setCopied] = useState(false);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  const businessTypeLabel = useMemo(() => {
    switch (businessType) {
      case "ho-kinh-doanh":
        return "Hộ Kinh Doanh (1.5%)";
      case "ca-nhan":
        return "Cá Nhân Kinh Doanh (1.5%)";
      case "cong-ty":
        return "Doanh Nghiệp / Công Ty";
      default:
        return "Hộ Kinh Doanh";
    }
  }, [businessType]);

  // Tạo báo cáo dạng văn bản
  const textReport = useMemo(() => {
    const lines = [
      "========================================",
      "   BẢNG TÍNH NGHĨA VỤ THUẾ TMĐT (AIChoShop)",
      "========================================",
      `• Loại hình kinh doanh: ${businessTypeLabel}`,
      `• Tổng doanh thu sàn ghi nhận: ${formatVND(revenue)}`,
      `• Tổng chi phí sàn: ${formatVND(platformFees)} (${results.platformFeeRate.toFixed(1)}%)`,
      "----------------------------------------",
    ];

    if (results.isExempt) {
      lines.push(
        "• TRẠNG THÁI: MIỄN THUẾ (Doanh thu dưới 100.000.000 VNĐ/năm)",
        "• Thuế GTGT: 0 VNĐ",
        "• Thuế TNCN: 0 VNĐ",
        "• TỔNG THUẾ PHẢI NỘP: 0 VNĐ"
      );
    } else {
      lines.push(
        `• Thuế Giá Trị Gia Tăng (GTGT): ${formatVND(results.gtgt)}`,
        `• ${businessType === "cong-ty" ? "Thuế TNDN (tạm tính)" : "Thuế TNCN"}: ${formatVND(results.tncn)}`,
        `• TỔNG THUẾ PHẢI NỘP: ${formatVND(results.totalTax)} (Tỷ lệ: ${results.effectiveTaxRate.toFixed(2)}%)`
      );
    }

    lines.push(
      "----------------------------------------",
      `• TIỀN THỰC NHẬN VỀ TÀI KHOẢN: ${formatVND(results.netRevenue)} (${results.netRate.toFixed(1)}%)`,
      "========================================",
      "Căn cứ pháp lý: Thông tư 40/2021/TT-BTC & Nghị định 91/2022/NĐ-CP"
    );

    return lines.join("\n");
  }, [revenue, platformFees, businessType, results, businessTypeLabel]);

  // Sao chép báo cáo
  const handleCopyReport = () => {
    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tải báo cáo .txt
  const handleDownloadReport = () => {
    const blob = new Blob([textReport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BaoCaoThue_TMDT_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng Rose & Emerald */}
      <div className="absolute top-0 right-0 p-36 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
            <PieChart size={16} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-sm leading-none">
              Bảng Phân Tích Nghĩa Vụ Thuế
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {businessTypeLabel}
            </span>
          </div>
        </div>

        {/* Cụm nút hành động */}
        {revenue > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleDownloadReport}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Download size={13} className="text-rose-400" /> Tải báo cáo (.txt)
            </button>
            <button
              onClick={handleCopyReport}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-white/10 active:scale-95"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Đã chép số liệu" : "Chép số liệu"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa nhập doanh thu */}
        {revenue <= 0 && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
              <Calculator size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa có dữ liệu tính thuế
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Nhập tổng doanh thu ghi nhận trên sàn và phí sàn ở khung bên trái để xem bảng phân tích chi tiết thuế GTGT, TNCN và dòng tiền thực nhận.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
              <ShieldCheck size={13} className="text-rose-400" />
              <span>Chuẩn thuế suất 1.5% theo quy định mới nhất của Tổng cục Thuế</span>
            </div>
          </div>
        )}

        {/* Kết quả khi đã nhập doanh thu */}
        {revenue > 0 && (
          <div className="space-y-4">
            {/* Banner Miễn Thuế khi doanh thu <= 100tr */}
            {results.isExempt && (
              <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-lg shadow-emerald-950/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide mb-1">
                      🎉 Chúc mừng! Bạn thuộc diện MIỄN THUẾ
                    </h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed font-sans">
                      Theo quy định của Luật Thuế hiện hành, cá nhân và hộ kinh doanh có tổng doanh thu trong năm <strong>dưới 100.000.000 VNĐ</strong> không phải nộp thuế Giá Trị Gia Tăng (GTGT) và thuế Thu Nhập Cá Nhân (TNCN).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3 Thẻ Metric KPIs hàng đầu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Thẻ 1: Tổng doanh thu */}
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Doanh thu Sàn</span>
                  <Wallet size={14} className="text-blue-400" />
                </div>
                <div className="text-base font-black text-white font-mono truncate">
                  {formatVND(revenue)}
                </div>
                <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                  100% Tổng ghi nhận
                </div>
              </div>

              {/* Thẻ 2: Tổng thuế phải nộp */}
              <div className={`border rounded-xl p-3 shadow-md ${
                results.isExempt
                  ? "bg-slate-800/70 border-slate-700/60"
                  : "bg-rose-950/30 border-rose-500/40"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                    Thuế phải nộp
                  </span>
                  <Scale size={14} className="text-rose-400" />
                </div>
                <div className="text-base font-black text-rose-400 font-mono truncate">
                  {formatVND(results.totalTax)}
                </div>
                <div className="text-[10px] text-rose-300/80 font-semibold mt-0.5">
                  {results.isExempt ? "Được miễn 100%" : `Tỷ lệ: ${results.effectiveTaxRate.toFixed(2)}%`}
                </div>
              </div>

              {/* Thẻ 3: Thực nhận về tài khoản */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3 shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Tiền thực nhận
                  </span>
                  <TrendingUp size={14} className="text-emerald-400" />
                </div>
                <div className="text-base font-black text-emerald-400 font-mono truncate">
                  {formatVND(results.netRevenue)}
                </div>
                <div className="text-[10px] text-emerald-300/80 font-semibold mt-0.5">
                  Tỷ lệ ròng: {results.netRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Thanh tỷ lệ phân bổ trực quan (Multi-segment Visual Bar) */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300">Cơ cấu phân bổ dòng tiền</span>
                <span className="text-[11px] text-slate-400 font-mono">100% Doanh thu</span>
              </div>

              {/* Progress bar multi-colored */}
              <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${Math.max(0, results.netRate)}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Thực nhận: ${results.netRate.toFixed(1)}%`}
                ></div>
                <div
                  style={{ width: `${Math.max(0, results.platformFeeRate)}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Phí sàn: ${results.platformFeeRate.toFixed(1)}%`}
                ></div>
                <div
                  style={{ width: `${Math.max(0, results.effectiveTaxRate)}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Thuế: ${results.effectiveTaxRate.toFixed(1)}%`}
                ></div>
              </div>

              {/* Chú giải legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-slate-300">Thực nhận:</span>
                  <strong className="text-emerald-400 font-mono">{results.netRate.toFixed(1)}%</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="text-slate-300">Phí sàn:</span>
                  <strong className="text-amber-400 font-mono">{results.platformFeeRate.toFixed(1)}%</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="text-slate-300">Nghĩa vụ thuế:</span>
                  <strong className="text-rose-400 font-mono">{results.effectiveTaxRate.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Chi tiết từng khoản thuế */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg">
              <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Chi tiết thuế phải nộp nhà nước
                </h3>
                <span className="text-[10px] text-slate-400">Quy định hiện hành</span>
              </div>

              <div className="p-3.5 space-y-2.5">
                {/* Thuế GTGT */}
                <div className="flex items-center justify-between p-2.5 bg-slate-900/70 rounded-lg border border-slate-700/50">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Thuế Giá Trị Gia Tăng (GTGT)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {businessType === "cong-ty"
                        ? "10% thuế suất (phương pháp khấu trừ tạm tính)"
                        : "1.0% trên tổng doanh thu sàn"}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-100">
                    {formatVND(results.gtgt)}
                  </span>
                </div>

                {/* Thuế TNCN hoặc TNDN */}
                <div className="flex items-center justify-between p-2.5 bg-slate-900/70 rounded-lg border border-slate-700/50">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {businessType === "cong-ty"
                        ? "Thuế Thu Nhập Doanh Nghiệp (TNDN)"
                        : "Thuế Thu Nhập Cá Nhân (TNCN)"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {businessType === "cong-ty"
                        ? "20% trên lợi nhuận chịu thuế (ước tính)"
                        : "0.5% trên tổng doanh thu sàn"}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-100">
                    {formatVND(results.tncn)}
                  </span>
                </div>

                {/* Tổng thuế cộng dồn */}
                <div className="flex items-center justify-between p-3 bg-rose-950/40 rounded-lg border border-rose-500/40">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wide">
                    TỔNG CỘNG THUẾ PHẢI NỘP
                  </span>
                  <span className="font-mono font-black text-base text-rose-400">
                    {formatVND(results.totalTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dòng tiền chi tiết (Cashflow Breakdown) */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Dòng tiền thực tế sau khấu trừ
              </h4>

              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                <span className="text-slate-300">1. Tổng doanh thu ghi nhận ban đầu:</span>
                <span className="font-mono font-semibold text-slate-200">{formatVND(revenue)}</span>
              </div>

              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                <span className="text-amber-300">2. Trừ tổng chi phí sàn:</span>
                <span className="font-mono font-semibold text-amber-400">-{formatVND(platformFees)}</span>
              </div>

              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-800">
                <span className="text-rose-300">3. Trừ thuế phải nộp:</span>
                <span className="font-mono font-semibold text-rose-400">-{formatVND(results.totalTax)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/30 mt-2">
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                  TIỀN THỰC TẾ VỀ TÚI
                </span>
                <span className="font-mono font-black text-base text-emerald-400">
                  {formatVND(results.netRevenue)}
                </span>
              </div>
            </div>

            {/* Banner Lời khuyên pháp lý 2026 */}
            <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-3.5 shadow-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                  <AlertTriangle size={14} />
                </div>
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Cảnh báo & Lời khuyên thuế TMĐT 2026
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-slate-300 pl-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Sàn Shopee, TikTok Shop đã kết nối truyền dữ liệu doanh thu trực tiếp cho Cơ quan Thuế.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Đăng ký <strong>Hộ Kinh Doanh cá thể</strong> đóng mức khoán 1.5% là phương án an toàn và tối ưu nhất cho nhà bán hàng.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
