"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
  LayoutGrid,
  Code2,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import { useToast } from "@/context/ToastContext";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  type SpinnerPlatform,
  type TitleSpinnerResult,
  SPINNER_PLATFORMS,
  parseTitleSpinnerResult,
  titleSpinnerToText,
  buildTitleSpinnerExcelRows,
} from "@/lib/title-spinner/contract";

interface TitleSpinnerOutputProps {
  result: string;
  loading: boolean;
  originalTitle: string;
  platform?: SpinnerPlatform;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
}

export function TitleSpinnerOutput({
  result,
  loading,
  originalTitle,
  platform = "shopee",
  elapsedSeconds,
  onCancel,
  onUseSample,
}: TitleSpinnerOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [filterMode, setFilterMode] = useState<"all" | "safe" | "unique">("all");
  const { showSuccess, showError } = useToast();

  const platformConfig = SPINNER_PLATFORMS[platform] || SPINNER_PLATFORMS.shopee;

  // Bóc tách kết quả bằng Resilient Parser
  const parsed: TitleSpinnerResult = useMemo(() => {
    return parseTitleSpinnerResult(result, platform, originalTitle);
  }, [result, platform, originalTitle]);

  // Bộ lọc tiêu đề hiển thị
  const filteredList = useMemo(() => {
    if (filterMode === "safe") return parsed.titles.filter((t) => t.isSafe);
    if (filterMode === "unique") return parsed.titles.filter((t) => t.uniquenessScore >= 80);
    return parsed.titles;
  }, [parsed.titles, filterMode]);

  // Toàn bộ văn bản định dạng text để sao chép / tải TXT
  const allText = useMemo(() => {
    return titleSpinnerToText(parsed);
  }, [parsed]);

  // Sao chép 1 tiêu đề lẻ
  const handleCopySingle = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      showError("Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.");
    }
  };

  // Sao chép tất cả tiêu đề
  const handleCopyAll = async () => {
    if (!result || parsed.titles.length === 0) return;
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      showSuccess("Đã sao chép toàn bộ 10 tiêu đề nhân bản!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showError("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  // Tải file TXT
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([allText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (originalTitle || "san_pham")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "_")
      .slice(0, 30);
    link.download = `AIChoShop_Spin10_${platform}_${safeName}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showSuccess("Đã tải xuống file TXT!");
  };

  // Xuất file Excel (.xlsx)
  const handleExportExcel = () => {
    if (!result || parsed.titles.length === 0) return;
    try {
      const rows = buildTitleSpinnerExcelRows(parsed);
      const worksheet = XLSX.utils.json_to_sheet(rows);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 18 },
        { wch: 30 },
        { wch: 75 },
        { wch: 10 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 45 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "TieuDeNhanBan");

      const safeName = (originalTitle || "san_pham")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .slice(0, 25);
      const fileName = `AIChoShop_Spin10_${platform}_${safeName}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showSuccess("Đã xuất file Excel thành công!");
    } catch {
      showError("Có lỗi xảy ra khi tạo file Excel.");
    }
  };

  return (
    <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden">
      {/* 1. HEADER TOOLBAR: 1 DÒNG DUY NHẤT TRÊN CẢ PC VÀ MOBILE */}
      <div className="sticky top-0 z-20 px-3.5 sm:px-5 py-3 border-b border-slate-800 bg-[#0e1526]/95 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 rounded-t-2xl">
        {/* Tiêu đề ngắn gọn */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
            <Sparkles size={15} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide shrink-0 whitespace-nowrap">
            <span className="hidden xl:inline">10 Tiêu Đề Nhân Bản</span>
            <span className="xl:hidden">10 Tiêu Đề</span>
          </h2>
        </div>

        {/* Nhóm nút thao tác: Icon trên Mobile, đầy đủ chữ trên PC */}
        {result && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Nút Sao Chép Toàn Bộ (Trắng nổi bật - Icon Only) */}
            <button
              type="button"
              onClick={handleCopyAll}
              title={copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ 10 tiêu đề"}
              className={`p-1.5 sm:p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedAll
                ? "bg-emerald-500 text-white"
                : "bg-white hover:bg-slate-200 text-slate-950"
                }`}
            >
              {copiedAll ? <Check size={14} className="stroke-[2.5]" /> : <Copy size={14} />}
            </button>

            {/* Nút Xuất TXT */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải về file TXT đầy đủ"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Download size={14} className="text-slate-300" />
              <span className="hidden sm:inline">TXT</span>
            </button>

            {/* Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất bảng tính Excel (.xlsx)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <FileSpreadsheet size={14} className="text-slate-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Toggle Giao diện / Mã nguồn */}
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                title="Chế độ giao diện trực quan"
                className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${viewMode === "visual"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Giao diện</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Chế độ mã nguồn văn bản"
                className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${viewMode === "raw"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Code2 size={13} />
                <span className="hidden sm:inline">Mã nguồn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. BODY KHU VỰC HIỂN THỊ DỮ LIỆU: NỀN ĐEN CHỮ TRẮNG */}
      <div className="p-3 sm:p-5 w-full lg:flex-1 lg:overflow-y-auto custom-scrollbar">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Nhân Bản 10 Tiêu Đề Chuẩn SEO..."
            accentColor="cyan"
            minHeightClass="min-h-[380px]"
            stages={[
              { upToSeconds: 8, text: `⚡ Đang phân tích từ khóa hạt nhân và cấu trúc tiêu đề gốc...` },
              { upToSeconds: 20, text: `🎯 Đang áp dụng 10 công thức hoán vị, đảo ngữ và giật tít sàn ${platformConfig.label}...` },
              { upToSeconds: 35, text: `🛡️ Đang kiểm tra độ độc nhất (>80%) và độ dài an toàn không bị cắt chữ...` },
              { upToSeconds: 999, text: `✅ Đang hoàn tất bảng 10 tiêu đề tối ưu thuật toán tìm kiếm...` },
            ]}
          />
        ) : result ? (
          viewMode === "raw" ? (
            /* Chế độ xem Mã thuần */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Văn bản định dạng hoàn chỉnh:</span>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  title={copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ"}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90"
                >
                  {copiedAll ? <Check size={13} className="text-emerald-400 stroke-[2.5]" /> : <Copy size={13} />}
                </button>
              </div>
              <textarea
                readOnly
                value={allText}
                className="w-full h-[460px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden select-all"
              />
            </div>
          ) : (
            /* Chế độ Xem Giao diện Trực quan: NỀN ĐEN CHỮ TRẮNG, GỌN GÀNG */
            <div className="space-y-4">
              {/* THANH TAB LỌC NHANH GỌN GÀNG */}
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${filterMode === "all"
                    ? "bg-slate-800 text-white border border-slate-700 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  Tất Cả ({parsed.titles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("safe")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${filterMode === "safe"
                    ? "bg-slate-800 text-white border border-slate-700 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Chuẩn Sàn ({parsed.safeCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("unique")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${filterMode === "unique"
                    ? "bg-slate-800 text-white border border-slate-700 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                >
                  <Zap size={13} className="text-teal-400" />
                  <span>Độc Bản Cao &ge;80% ({parsed.titles.filter((t) => t.uniquenessScore >= 80).length})</span>
                </button>
              </div>

              {/* THẺ TỔNG QUAN CHỈ SỐ AN TOÀN CHỐNG SPAM */}
              <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">
                      Chỉ Số An Toàn Chống Thuật Toán Quét Trùng Lặp
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                  💡 <span className="font-semibold text-slate-300">{parsed.recommendation}</span>
                </p>
              </div>

              {/* DANH SÁCH 10 THẺ TIÊU ĐỀ BIẾN THỂ */}
              <div className="space-y-2.5">
                {filteredList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2.5"
                  >
                    {/* Hàng nhãn: ID + Chiến lược + Uniqueness Score + Đếm ký tự + Nút Sao chép */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          #{item.id < 10 ? `0${item.id}` : item.id}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 shrink-0">
                          {item.strategyTag}
                        </span>



                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border shrink-0 ${item.isSafe
                            ? "bg-slate-800/60 text-slate-300 border-slate-700"
                            : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            }`}
                        >
                          {item.charCount}/{item.maxLimit} ký tự
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.title, item.id)}
                        title={copiedId === item.id ? "Đã sao chép tiêu đề" : "Sao chép tiêu đề"}
                        className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === item.id
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                          }`}
                      >
                        {copiedId === item.id ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Tiêu đề biến thể: Chữ to rõ, nổi bật, dễ đọc */}
                    <p className="font-semibold text-white text-xs sm:text-sm leading-snug select-all">
                      {item.title}
                    </p>

                    {/* Giải thích chiến lược phụ */}
                    {item.reason && (
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/50">
                        🎯 <span className="text-slate-400">{item.reason}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Trạng thái trống chưa có kết quả */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-slate-200">Chưa Có Tiêu Đề Nhân Bản</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập tiêu đề gốc ở cột bên trái và bấm{" "}
                <strong className="text-teal-400 font-semibold">&quot;Nhân Bản Bằng AI&quot;</strong> để tạo
                10 biến thể chống quét trùng lặp cho {platformConfig.label}.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                Thử dữ liệu mẫu
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
