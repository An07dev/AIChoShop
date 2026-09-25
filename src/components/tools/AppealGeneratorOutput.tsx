"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Lightbulb,
  Search,
  Layers,
  Paperclip,
  Clock,
  Info,
  FileSpreadsheet,
  Maximize2,
  X,
  Scale,
  ShieldCheck,
  TrendingUp,
  Flame,
  ChevronRight,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseAppealGeneratorResult,
  formatAppealToMarkdown,
  formatLetterParagraphs,
  type AppealGeneratorData,
} from "@/lib/appeal-generator/contract";

interface AppealGeneratorOutputProps {
  result: string;
  loading: boolean;
  error?: { message: string; code?: string; canRetry?: boolean } | null;
  onRetry?: () => void;
  platform?: string;
  shopName?: string;
  violationType?: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
}

const APPEAL_STAGES = [
  { upToSeconds: 4, text: "Đang rà soát chính sách sàn & phân tích lý do vi phạm..." },
  { upToSeconds: 10, text: "Tìm kiếm nguyên nhân cốt lõi và phương án khắc phục ngay..." },
  { upToSeconds: 20, text: "Biên soạn mẫu đơn kháng nghị chuẩn mực, lịch sự & kiên quyết..." },
  { upToSeconds: 35, text: "Lồng ghép bằng chứng, cam kết hành động & tối ưu độ dài..." },
  { upToSeconds: 60, text: "Hoàn thiện hồ sơ kháng nghị và mẹo gỡ gậy đạt tỷ lệ mở 90%+..." },
  { upToSeconds: 90, text: "Đang kiểm duyệt tính pháp lý và tối ưu hồ sơ cho sàn TMĐT..." },
  { upToSeconds: 120, text: "Đang đồng bộ và hoàn tất cấu trúc văn bản..." },
];

/**
 * Hàm sao chép an toàn 2 tầng chống lỗi webview / in-app browser
 */
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

function sanitizeFilename(name: string, fallback: string): string {
  const clean = (name || fallback)
    .toLowerCase()
    .replace(/[\/\\:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return clean || fallback;
}

/**
 * Tách tỷ lệ phần trăm (để làm huy hiệu gọn) và ghi chú giải thích (để hiển thị dòng chữ phụ)
 * Tránh lỗi vỡ layout khi AI trả về chuỗi dài như: "90% - 95% (Rất cao do có hóa đơn VAT...)"
 */
function extractSuccessRate(rateStr?: string): { rate: string; note: string } {
  if (!rateStr) return { rate: "90%+", note: "" };
  const trimmed = rateStr.trim();
  const match = trimmed.match(/^([><~]?\s*\d{1,3}%\s*(?:-\s*\d{1,3}%)?)/);
  if (match) {
    const rate = match[1].trim();
    const note = trimmed.replace(match[0], "").replace(/^[(\s–\-:;,]+|[)\s]+$/g, "").trim();
    return { rate, note };
  }
  if (trimmed.length > 20) {
    return { rate: trimmed.slice(0, 16) + "...", note: trimmed };
  }
  return { rate: trimmed, note: "" };
}

export function AppealGeneratorOutput({
  result,
  loading,
  error,
  onRetry,
  platform = "Shopee",
  shopName = "Gian Hàng Của Bạn",
  violationType,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
}: AppealGeneratorOutputProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<"all" | "letter" | "diagnosis" | "evidence" | "strategy">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Phân tích dữ liệu bằng bộ Parser 4 tầng bền bỉ
  const data: AppealGeneratorData = useMemo(() => {
    return parseAppealGeneratorResult(result);
  }, [result]);

  const rawMarkdown = useMemo(() => {
    return formatAppealToMarkdown(data);
  }, [data]);

  // Tự động phân đoạn lá đơn kháng nghị với xuống dòng (\n\n) rõ ràng
  const formattedLetter = useMemo(() => {
    return formatLetterParagraphs(data.appealLetter?.fullLetter || "", data.appealLetter);
  }, [data.appealLetter]);

  // Cuộn lên đầu khi chuyển sang chế độ Markdown
  useEffect(() => {
    if (viewMode === "raw" && textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [viewMode, rawMarkdown]);

  // Phím tắt Esc đóng toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Hàm sao chép dùng chung theo khóa (100% Icon-only)
  const handleCopySnippet = async (text: string, key: string) => {
    if (!text) return;
    await safeCopyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Sao chép riêng mẫu đơn kháng nghị
  const handleCopyLetter = async () => {
    const letterText = formattedLetter || data.appealLetter?.fullLetter || result;
    if (!letterText) return;
    await handleCopySnippet(letterText, "letter");
  };

  // Sao chép toàn bộ hồ sơ Markdown
  const handleCopyAll = async () => {
    if (!result) return;
    await safeCopyToClipboard(rawMarkdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải về file text
  const handleDownloadTxt = () => {
    if (!result) return;
    const safeShop = sanitizeFilename(shopName, "khang-nghi");
    try {
      const blob = new Blob([rawMarkdown], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AIChoShop_DonKhangNghi_${platform}_${safeShop}_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download TXT error:", err);
    }
  };

  // Xuất bảng tính Excel hồ sơ pháp lý đối soát
  const handleExportExcel = () => {
    try {
      if (!result || !data) return;

      const rows: any[] = [
        {
          "Trường Dữ Liệu": "Tên Gian Hàng",
          "Nội Dung Chi Tiết": data.shopName || shopName,
        },
        {
          "Trường Dữ Liệu": "Sàn TMĐT",
          "Nội Dung Chi Tiết": (data.platform || platform).toUpperCase(),
        },
        {
          "Trường Dữ Liệu": "Loại Vi Phạm",
          "Nội Dung Chi Tiết": data.violationType || violationType || "Vi phạm quy định",
        },
        {
          "Trường Dữ Liệu": "Mức Độ Nguy Cấp",
          "Nội Dung Chi Tiết": data.violationDiagnosis?.severityBadge || "⚠️ Cần Xử Lý Sớm",
        },
        {
          "Trường Dữ Liệu": "Kịch Bản Kháng Nghị",
          "Nội Dung Chi Tiết": data.violationDiagnosis?.scenarioTitle || "Giải trình vi phạm",
        },
        {
          "Trường Dữ Liệu": "Nguyên Nhân Cốt Lõi",
          "Nội Dung Chi Tiết": data.violationDiagnosis?.rootCauseAnalysis || "",
        },
        {
          "Trường Dữ Liệu": "Tỷ Lệ Mở Khóa Dự Báo",
          "Nội Dung Chi Tiết": data.violationDiagnosis?.estimatedSuccessRate || "",
        },
        {
          "Trường Dữ Liệu": "Tiêu Đề Đơn",
          "Nội Dung Chi Tiết": data.appealLetter?.subjectTitle || "",
        },
        {
          "Trường Dữ Liệu": "Toàn Văn Đơn Kháng Nghị (Gửi Sàn)",
          "Nội Dung Chi Tiết": formattedLetter || data.appealLetter?.fullLetter || "",
        },
        {
          "Trường Dữ Liệu": "Độ Dài (Số Từ)",
          "Nội Dung Chi Tiết": `${data.appealLetter?.wordCount || 0} từ`,
        },
        {
          "Trường Dữ Liệu": "Bằng Chứng Bắt Buộc",
          "Nội Dung Chi Tiết": (data.evidenceChecklist?.mandatoryDocuments || []).join(";\n"),
        },
        {
          "Trường Dữ Liệu": "Bằng Chứng Bổ Trợ",
          "Nội Dung Chi Tiết": (data.evidenceChecklist?.supplementaryDocuments || []).join(";\n"),
        },
        {
          "Trường Dữ Liệu": "Khung Giờ Vàng Nộp Đơn",
          "Nội Dung Chi Tiết": data.negotiationStrategy?.goldenSubmissionTime || "",
        },
        {
          "Trường Dữ Liệu": "Kênh Gửi Kháng Nghị",
          "Nội Dung Chi Tiết": data.negotiationStrategy?.portalRouting || "",
        },
        {
          "Trường Dữ Liệu": "Kịch Bản Escalation Cấp 2",
          "Nội Dung Chi Tiết": (data.negotiationStrategy?.escalationSteps || []).join(";\n"),
        },
        {
          "Trường Dữ Liệu": "Điều Tuyệt Đối Tránh",
          "Nội Dung Chi Tiết": (data.negotiationStrategy?.strictDonts || []).join(";\n"),
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [{ wch: 30 }, { wch: 90 }];

      const safeShop = sanitizeFilename(shopName, "khang-nghi");
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "HoSoKhangNghi");
      XLSX.writeFile(workbook, `AIChoShop_HoSoKhangNghi_${platform}_${safeShop}_${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Export Excel error:", err);
    }
  };

  // Văn bản tổng hợp cho từng khối để sao chép 1-chạm
  const diagnosisText = useMemo(() => {
    if (!data.violationDiagnosis) return "";
    const lines = [
      `CHẨN ĐOÁN VI PHẠM & RỦI RO - GIAN HÀNG: ${data.shopName || shopName} (${(data.platform || platform).toUpperCase()})`,
      `Mức độ: ${data.violationDiagnosis.severityBadge || ""}`,
      `Tỷ lệ mở khóa dự báo: ${data.violationDiagnosis.estimatedSuccessRate || ""}`,
      `Kịch bản: ${data.violationDiagnosis.scenarioTitle || ""}`,
      `Nguyên nhân cốt lõi: ${data.violationDiagnosis.rootCauseAnalysis || ""}`,
    ];
    if (data.violationDiagnosis.immediateActions?.length) {
      lines.push("\nVIỆC CẦN LÀM NGAY TRƯỚC KHI GỬI ĐƠN:");
      data.violationDiagnosis.immediateActions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    }
    return lines.join("\n");
  }, [data, shopName, platform]);

  const evidenceText = useMemo(() => {
    if (!data.evidenceChecklist) return "";
    const lines = [
      `CHECKLIST BẰNG CHỨNG PHÁP LÝ - ${data.shopName || shopName} (${(data.platform || platform).toUpperCase()})`,
    ];
    if (data.evidenceChecklist.mandatoryDocuments?.length) {
      lines.push("\n1. BẰNG CHỨNG BẮT BUỘC (MUST-HAVE):");
      data.evidenceChecklist.mandatoryDocuments.forEach((doc) => lines.push(`✓ ${doc}`));
    }
    if (data.evidenceChecklist.supplementaryDocuments?.length) {
      lines.push("\n2. BẰNG CHỨNG BỔ TRỢ (GIA TĂNG TỶ LỆ MỞ):");
      data.evidenceChecklist.supplementaryDocuments.forEach((doc) => lines.push(`• ${doc}`));
    }
    if (data.evidenceChecklist.formattingTips?.length) {
      lines.push("\n3. LƯU Ý KHI CHỤP / SCAN GỬI SÀN:");
      data.evidenceChecklist.formattingTips.forEach((tip) => lines.push(`- ${tip}`));
    }
    return lines.join("\n");
  }, [data, shopName, platform]);

  const strategyText = useMemo(() => {
    if (!data.negotiationStrategy) return "";
    const lines = [
      `CẨM NANG ĐÀM PHÁN & ESCALATION - ${data.shopName || shopName} (${(data.platform || platform).toUpperCase()})`,
    ];
    if (data.negotiationStrategy.goldenSubmissionTime) {
      lines.push(`- Khung giờ vàng nộp đơn: ${data.negotiationStrategy.goldenSubmissionTime}`);
    }
    if (data.negotiationStrategy.portalRouting) {
      lines.push(`- Luồng gửi đơn kháng nghị: ${data.negotiationStrategy.portalRouting}`);
    }
    if (data.negotiationStrategy.escalationSteps?.length) {
      lines.push("\nQUY TRÌNH NẾU BỊ TỪ CHỐI LẦN 1:");
      data.negotiationStrategy.escalationSteps.forEach((s) => lines.push(`• ${s}`));
    }
    if (data.negotiationStrategy.strictDonts?.length) {
      lines.push("\nĐIỀU TUYỆT ĐỐI TRÁNH:");
      data.negotiationStrategy.strictDonts.forEach((d) => lines.push(`⚠️ ${d}`));
    }
    return lines.join("\n");
  }, [data, shopName, platform]);

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col w-full lg:min-h-0 lg:h-full relative lg:overflow-hidden border border-slate-800 text-white">
      {/* 1. HEADER THANH CÔNG CỤ TỐI GIẢN (CHỮ TRẮNG NỀN ĐEN + 100% ICON-ONLY ACTIONS) */}
      <div className="relative lg:sticky top-0 z-10 lg:z-20 bg-black border-b border-slate-800 px-2.5 sm:px-4 py-1.5 sm:py-2 flex flex-col gap-1.5 shrink-0 rounded-t-2xl">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <ShieldAlert size={13} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase shrink-0 whitespace-nowrap">
              <span className="hidden sm:inline">Hồ Sơ Kháng Nghị Vi Phạm</span>
              <span className="sm:hidden">Kháng Nghị</span>
            </h2>
            <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
              {platform}
            </span>
          </div>

          {/* Phải: Nhóm nút thao tác 100% ICON-ONLY */}
          {result && !loading && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Nút Sao Chép Toàn Bộ (Icon-Only) */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ hồ sơ" : "Sao chép toàn bộ hồ sơ (Markdown)"}
                aria-label="Sao chép toàn bộ hồ sơ"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs shrink-0 ${copiedAll
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Xuất Excel (Icon-Only) */}
              <button
                type="button"
                onClick={handleExportExcel}
                title="Xuất bảng tính Excel hồ sơ đối soát (.xlsx)"
                aria-label="Xuất Excel"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              >
                <FileSpreadsheet size={13} />
              </button>

              {/* Nút Tải TXT (Icon-Only) */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải về file văn bản (.txt)"
                aria-label="Tải file TXT"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              >
                <Download size={13} />
              </button>

              {/* Chuyển đổi Xem: Thẻ / MD */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 shrink-0 ml-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-1.5 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "visual"
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  Thẻ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-1.5 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "raw"
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                    }`}
                >
                  MD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc Tối Giản (Tối ưu nhãn ngắn cho Mobile) */}
        {result && !loading && viewMode === "visual" && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "all"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <Layers size={11} />
              <span>Tất Cả</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("letter")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "letter"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <FileText size={11} />
              <span className="sm:hidden">Đơn Sàn</span>
              <span className="hidden sm:inline">Mẫu Đơn Gửi Sàn</span>
              {data.appealLetter?.wordCount > 0 && (
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  ~{data.appealLetter.wordCount} từ
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("diagnosis")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "diagnosis"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <ShieldCheck size={11} />
              <span className="sm:hidden">Chẩn Đoán</span>
              <span className="hidden sm:inline">Chẩn Đoán &amp; Tỷ Lệ Mở</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("evidence")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "evidence"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <Paperclip size={11} />
              <span className="sm:hidden">Bằng Chứng</span>
              <span className="hidden sm:inline">Checklist Bằng Chứng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("strategy")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "strategy"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <Clock size={11} />
              <span className="sm:hidden">Chiến Lược</span>
              <span className="hidden sm:inline">Chiến Lược Đàm Phán</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. VÙNG NỘI DUNG CHÍNH (CHỮ TRẮNG NỀN ĐEN TỐI GIẢN) */}
      <div
        className={`lg:flex-1 lg:min-h-0 p-2 sm:p-4 flex flex-col ${viewMode === "raw" ? "min-h-[420px] lg:h-full lg:overflow-hidden" : "lg:overflow-y-auto custom-scrollbar pb-28 sm:pb-24 lg:pb-4"
          }`}
      >
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Rà Soát Chính Sách & Viết Đơn Kháng Nghị..."
            stages={APPEAL_STAGES}
            accentColor="rose"
            minHeightClass="min-h-[320px]"
          />
        ) : result ? (
          viewMode === "raw" ? (
            /* CHẾ ĐỘ XEM MARKDOWN THUẦN */
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400 shrink-0">
                <span className="font-mono">Văn bản Markdown chuẩn · 100% sạch ký tự thừa</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition flex items-center justify-center cursor-pointer"
                    title="Mở toàn màn hình (Esc để thoát)"
                    aria-label="Toàn màn hình"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                    aria-label="Sao chép toàn bộ"
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
                      }`}
                  >
                    {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                readOnly
                value={rawMarkdown}
                className="w-full flex-1 h-full min-h-[320px] lg:min-h-0 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-[13px] font-mono leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            </div>
          ) : (
            /* CHẾ ĐỘ XEM THẺ TRỰC QUAN TỐI GIẢN (MOBILE-FIRST) */
            <div className="space-y-2.5 sm:space-y-3.5">
              {/* 1. BANNER TÓM TẮT CHẨN ĐOÁN & TỶ LỆ MỞ NHANH (TỐI ƯU MOBILE, KHÔNG BAO GIỜ BỊ TRÀN VIỀN / MẤT CHỮ) */}
              {activeTab === "all" && data.violationDiagnosis && (() => {
                const rateInfo = extractSuccessRate(data.violationDiagnosis.estimatedSuccessRate);
                return (
                  <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                    {/* Tầng 1: Tiêu đề "Chẩn Đoán Vi Phạm & Rủi Ro" + Nút Chuyển Tab Xem Chi Tiết */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider min-w-0">
                        <ShieldCheck size={13} className="text-white shrink-0" />
                        <span className="whitespace-normal leading-snug">Chẩn Đoán Vi Phạm &amp; Rủi Ro</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("diagnosis")}
                        className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-0.5 shrink-0 cursor-pointer active:scale-95"
                      >
                        <span>Xem chi tiết</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    {/* Tầng 2: Mức độ vi phạm (Hiển thị trọn vẹn 100% chữ, tự động xuống dòng khi dài, KHÔNG cắt cụt) */}
                    <div>
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-800 leading-snug break-words whitespace-normal">
                        {data.violationDiagnosis.severityBadge || "⚠️ Cần Xử Lý Ngay"}
                      </span>
                    </div>

                    {/* Tầng 3: Tỷ lệ mở khóa & Ghi chú giải thích */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-black flex items-center gap-1 shrink-0">
                        <TrendingUp size={11} className="shrink-0" /> Tỷ lệ mở: {rateInfo.rate}
                      </span>
                      {rateInfo.note && (
                        <span className="text-[11px] text-slate-300 leading-snug break-words whitespace-normal">
                          ({rateInfo.note})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 2. MẪU ĐƠN KHÁNG NGHỊ CHUẨN MỰC (TÂM ĐIỂM SỐ 1 - ĐƯA LÊN ĐẦU TIÊN ĐỂ NGƯỜI DÙNG THẤY NGAY) */}
              {(activeTab === "all" || activeTab === "letter") && data.appealLetter && (
                <div className="p-2.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 sm:space-y-3">
                  {/* Header Khối: 2 tầng chuẩn mực, không cắt cụt, tự động xuống dòng */}
                  <div className="space-y-2 pb-2.5 border-b border-slate-900">
                    {/* Tầng 1: Badge Mẫu Đơn + Độ Dài + Nút Copy Toàn Văn Đơn (Icon-Only) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-white text-black text-xs font-black shrink-0 tracking-wide">
                          MẪU ĐƠN GỬI SÀN
                        </span>
                        {data.appealLetter.wordCount > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                            ~{data.appealLetter.wordCount} từ
                          </span>
                        )}
                        <span className="hidden sm:inline-flex text-[10px] text-slate-400 font-medium">
                          (Độ dài vàng 200–350 từ chuẩn duyệt sàn)
                        </span>
                      </div>

                      {/* Nút Sao Chép Toàn Bộ Đơn (100% Icon-Only) */}
                      <button
                        type="button"
                        onClick={handleCopyLetter}
                        title={copiedKey === "letter" ? "Đã sao chép lá đơn" : "Sao chép toàn bộ đơn kháng nghị"}
                        aria-label="Sao chép toàn bộ đơn"
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${copiedKey === "letter"
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : "bg-white text-black hover:bg-slate-200"
                          }`}
                      >
                        {copiedKey === "letter" ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Tầng 2: Tiêu Đề Đơn (Subject Title) - TỰ ĐỘNG XUỐNG DÒNG (break-words), KHÔNG CẮT CỤT DẤU BA CHẤM */}
                    {data.appealLetter.subjectTitle && (
                      <div className="flex items-start justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 block mb-1">
                            Tiêu Đề Đơn Khiếu Nại (Subject Title)
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-white leading-relaxed break-words whitespace-normal select-all">
                            {data.appealLetter.subjectTitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(data.appealLetter.subjectTitle, "subject")}
                          title={copiedKey === "subject" ? "Đã sao chép tiêu đề" : "Sao chép tiêu đề đơn"}
                          aria-label="Sao chép tiêu đề"
                          className={`w-6 h-6 rounded flex items-center justify-center transition cursor-pointer shrink-0 mt-0.5 ${copiedKey === "subject"
                              ? "text-emerald-400 bg-emerald-950/40"
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                          {copiedKey === "subject" ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Toàn văn lá đơn (Phân đoạn xuống dòng rõ ràng, chuẩn thẩm mỹ) */}
                  <div className="p-3 sm:p-4 rounded-lg bg-black border border-slate-800/80 text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-all selection:bg-white selection:text-black">
                    {formattedLetter}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 pt-1 border-t border-slate-900/60">
                    <span className="flex items-center gap-1 min-w-0">
                      <Info size={11} className="text-slate-400 shrink-0" />
                      <span className="leading-snug break-words">Nhấp đúp bôi đen hoặc bấm icon để chép toàn bộ đơn.</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLetter}
                      title={copiedKey === "letter" ? "Đã sao chép lá đơn" : "Sao chép toàn bộ đơn kháng nghị"}
                      aria-label="Sao chép toàn bộ đơn"
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${copiedKey === "letter"
                          ? "bg-emerald-500 text-white shadow-emerald-500/20"
                          : "bg-white text-black hover:bg-slate-200"
                        }`}
                    >
                      {copiedKey === "letter" ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. CHẨN ĐOÁN VI PHẠM & RỦI RO CHI TIẾT */}
              {(activeTab === "all" || activeTab === "diagnosis") && data.violationDiagnosis && (
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="space-y-2 pb-2.5 border-b border-slate-900">
                    {/* Tầng 1: Tiêu Đề Full Chữ (Không Bao Giờ Cắt Cụt / Bị Đè) + Nút Sao Chép Icon-Only */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider min-w-0">
                        <ShieldCheck size={13} className="text-white shrink-0" />
                        <span className="whitespace-normal leading-snug">Chẩn Đoán Vi Phạm &amp; Rủi Ro</span>
                      </div>

                      {/* Nút Sao Chép Chẩn Đoán (Icon-Only) */}
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(diagnosisText, "diagnosis")}
                        title={copiedKey === "diagnosis" ? "Đã sao chép phân tích chẩn đoán" : "Sao chép chẩn đoán vi phạm"}
                        aria-label="Sao chép chẩn đoán"
                        className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${copiedKey === "diagnosis"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                          }`}
                      >
                        {copiedKey === "diagnosis" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Tầng 2: Mức Độ Vi Phạm Trọn Vẹn */}
                    {data.violationDiagnosis.severityBadge && (
                      <div>
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-800 leading-snug break-words whitespace-normal">
                          {data.violationDiagnosis.severityBadge}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Kịch Bản Kháng Nghị</span>
                      <p className="text-white font-bold text-xs leading-relaxed">
                        {data.violationDiagnosis.scenarioTitle}
                      </p>
                    </div>

                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Nguyên Nhân Cốt Lõi</span>
                      <p className="text-slate-200 font-medium leading-relaxed text-xs">
                        {data.violationDiagnosis.rootCauseAnalysis}
                      </p>
                    </div>

                    {data.violationDiagnosis.immediateActions?.length > 0 && (
                      <div className="sm:col-span-2 p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Flame size={11} /> Việc Cần Làm Ngay Trước Khi Gửi Đơn
                        </span>
                        <ul className="space-y-1 text-slate-300 text-xs">
                          {data.violationDiagnosis.immediateActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-slate-500">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. CHECKLIST BẰNG CHỨNG PHÁP LÝ BẮT BUỘC & BỔ TRỢ */}
              {(activeTab === "all" || activeTab === "evidence") && data.evidenceChecklist && (
                <div className="p-2.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider min-w-0">
                      <Paperclip size={13} className="text-white shrink-0" />
                      <span className="whitespace-normal leading-snug">Bộ Bằng Chứng &amp; Chứng Từ Cần Đính Kèm</span>
                    </div>

                    {/* Nút Sao Chép Checklist Bằng Chứng (Icon-Only) */}
                    <button
                      type="button"
                      onClick={() => handleCopySnippet(evidenceText, "evidence")}
                      title={copiedKey === "evidence" ? "Đã sao chép danh sách bằng chứng" : "Sao chép checklist bằng chứng"}
                      aria-label="Sao chép checklist bằng chứng"
                      className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${copiedKey === "evidence"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                        }`}
                    >
                      {copiedKey === "evidence" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Bắt buộc */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={11} /> Bằng Chứng Bắt Buộc (Must-Have)
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        {(data.evidenceChecklist.mandatoryDocuments || []).map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-white font-bold">✓</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bổ trợ */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Paperclip size={11} /> Bằng Chứng Bổ Trợ (Tăng Tỷ Lệ Mở)
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        {(data.evidenceChecklist.supplementaryDocuments || []).map((doc, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-500">•</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {data.evidenceChecklist.formattingTips?.length > 0 && (
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/40 border border-slate-900 text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb size={11} /> Lưu Ý Khi Chụp / Scan File Gửi Sàn
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-300">
                        {data.evidenceChecklist.formattingTips.map((tip, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-500">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. CẨM NANG ĐÀM PHÁN & KHUNG GIỜ VÀNG */}
              {(activeTab === "all" || activeTab === "strategy") && data.negotiationStrategy && (
                <div className="p-2.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 sm:space-y-3">
                  <div className="space-y-2 pb-2.5 border-b border-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider min-w-0">
                        <Clock size={13} className="text-white shrink-0" />
                        <span className="whitespace-normal leading-snug">Cẩm Nang Đàm Phán &amp; Quy Trình Escalation</span>
                      </div>

                      {/* Nút Sao Chép Cẩm Nang Đàm Phán (Icon-Only) */}
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(strategyText, "strategy")}
                        title={copiedKey === "strategy" ? "Đã sao chép cẩm nang đàm phán" : "Sao chép cẩm nang đàm phán"}
                        aria-label="Sao chép cẩm nang"
                        className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${copiedKey === "strategy"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                          }`}
                      >
                        {copiedKey === "strategy" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {data.negotiationStrategy.goldenSubmissionTime && (
                      <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 leading-relaxed flex items-start gap-1.5">
                        <span className="font-bold text-amber-400 shrink-0">⏱️ Khung giờ vàng:</span>
                        <span>{data.negotiationStrategy.goldenSubmissionTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Các bước escalation */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider flex items-center gap-1">
                        <Scale size={11} /> Quy Trình Nếu Bị Từ Chối Lần 1
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        {(data.negotiationStrategy.escalationSteps || []).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-500">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Điều tuyệt đối tránh */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={11} /> Việc Tuyệt Đối Tránh
                      </span>
                      <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                        {(data.negotiationStrategy.strictDonts || []).map((dont, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-slate-500">•</span>
                            <span>{dont}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : error ? (
          /* TRẠNG THÁI LỖI & PHỤC HỒI NHANH */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 shadow-md">
              {error.code === "NETWORK_OFFLINE" ? (
                <WifiOff size={22} />
              ) : error.code === "TIMEOUT" ? (
                <Clock size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-sm font-bold text-white">
                {error.code === "TIMEOUT"
                  ? "Quá Thời Gian Phản Hồi (120s)"
                  : error.code === "NETWORK_OFFLINE"
                  ? "Mất Kết Nối Internet"
                  : "Chưa Thể Hoàn Tất Kháng Nghị"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {error.message ||
                  "Đã xảy ra sự cố khi kết nối đến máy chủ AI. Dữ liệu đã nhập và ảnh chụp của bạn vẫn được giữ nguyên."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition cursor-pointer active:scale-95"
                >
                  <RotateCcw size={13} /> Thử Lại Ngay
                </button>
              )}
              {onUseSample && (
                <button
                  type="button"
                  onClick={onUseSample}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer active:scale-95"
                >
                  <Sparkles size={13} /> Thử Dữ Liệu Mẫu
                </button>
              )}
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI RỖNG */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <ShieldAlert size={22} />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-bold text-white">Chưa Có Hồ Sơ Kháng Nghị</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập thông tin vi phạm ở cột bên trái rồi bấm tạo để AI phân tích và biên soạn đơn khiếu nại chuẩn sàn.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-slate-200 transition cursor-pointer active:scale-95"
              >
                <Sparkles size={13} /> Dữ Liệu Mẫu
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. MODAL TOÀN MÀN HÌNH CHO MARKDOWN */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-white">
                <FileText size={13} />
              </div>
              <span className="font-bold text-sm text-white">Toàn Màn Hình: Hồ Sơ Kháng Nghị Vi Phạm</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ hồ sơ"}
                aria-label="Sao chép toàn bộ"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer"
                title="Đóng (Esc)"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 pt-3">
            <textarea
              readOnly
              value={rawMarkdown}
              className="w-full h-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
            />
          </div>
        </div>
      )}
    </div>
  );
}
