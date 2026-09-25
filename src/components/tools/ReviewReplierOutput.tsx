"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  MessageSquareWarning,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Scale,
  Maximize2,
  X,
  CheckCircle2,
  Users,
  Clock,
  MessageCircle,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseReviewReplierResult,
  formatReviewReplierToMarkdown,
  type ReviewReplierData,
  type ReviewSolutionItem,
} from "@/lib/review-replier/contract";

interface ReviewReplierOutputProps {
  result: string;
  loading: boolean;
  reviewContent?: string;
  rating?: string;
  issueType?: string;
  shopName?: string;
  productName?: string;
  platform?: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
}

const REVIEW_STAGES = [
  { upToSeconds: 4, text: "💬 Đang đọc & phân tích cảm xúc bức xúc của khách hàng..." },
  { upToSeconds: 12, text: "🧠 Chẩn đoán nguyên nhân cốt lõi (Sản phẩm, Bưu cục, hay Hiểu lầm)..." },
  { upToSeconds: 25, text: "✍️ Soạn 3 phương án phản hồi công khai theo 3 phong cách tâm lý..." },
  { upToSeconds: 45, text: "💬 Viết kịch bản nhắn tin riêng Inbox 1:1 & Lời nhờ sửa sao đắc nhân tâm..." },
  { upToSeconds: 80, text: "🛡️ Đánh giá rủi ro thuật toán sàn & Hoàn thiện cẩm nang phòng vệ..." },
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
      // Fallback sang Tầng 2
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

export function ReviewReplierOutput({
  result,
  loading,
  reviewContent,
  rating = "1 sao",
  issueType,
  shopName = "Gian Hàng Chính Hãng",
  productName = "Sản phẩm đánh giá",
  platform = "shopee",
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
}: ReviewReplierOutputProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<number | "all" | "diagnosis" | "strategy">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Phân tích dữ liệu 4 tầng bền bỉ
  const data: ReviewReplierData = useMemo(() => {
    return parseReviewReplierResult(result);
  }, [result]);

  const rawMarkdown = useMemo(() => {
    return formatReviewReplierToMarkdown(data);
  }, [data]);

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

  const handleCopySnippet = async (text: string, key: string) => {
    if (!text) return;
    await safeCopyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = async () => {
    if (!result) return;
    await safeCopyToClipboard(rawMarkdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const safeName = sanitizeFilename(shopName, "khung-hoang");
    try {
      const blob = new Blob([rawMarkdown], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AIChoShop_XuLyKhungHoang_${safeName}_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download TXT error:", err);
    }
  };

  const handleExportExcel = () => {
    try {
      if (!result || !data || !Array.isArray(data.solutions) || data.solutions.length === 0) return;

      const rows: any[] = [];
      let stt = 1;

      data.solutions.forEach((item) => {
        rows.push({
          STT: stt++,
          "Phương Án": item.sampleNumber || `Phương Án ${stt - 1}`,
          "Phong Cách": item.styleName || "",
          "Đặc Trưng": item.badge || "",
          "Góc Tiếp Cận Tâm Lý": item.psychologicalAngle || "",
          "Phản Hồi Công Khai": item.publicReply?.content || "",
          "Số Ký Tự": item.publicReply?.charCount || (item.publicReply?.content?.length || 0),
          "Kịch Bản Inbox 1:1": item.inboxScript?.fullMessage || "",
          "Lời Đề Xuất Đền Bù": item.inboxScript?.compensationOffer || "",
          "Lời Khéo Nhờ Sửa Sao": item.inboxScript?.revisionNudge || "",
          "SOP Hậu Trường": item.behindTheScenesAction || "",
          "Sàn TMĐT": (platform || "SHOPEE").toUpperCase(),
          "Đánh Giá Của Khách": reviewContent || "Đánh giá tiêu cực của khách",
          "Mức Sao": rating || "1 sao",
          "Vấn Đề": issueType || "Khiếu nại sản phẩm/vận chuyển",
          "Mức Độ Nguy Cấp": data.crisisAnalysis?.severityBadge || data.crisisAnalysis?.severityLevel || "⚠️ Cần Xử Lý Sớm",
          "Tâm Lý Khách": data.crisisAnalysis?.customerPsychology || "",
          "Rủi Ro Sàn": data.crisisAnalysis?.platformRisk || "",
          "Báo Cáo Sàn?": data.crisisAnalysis?.canAppealToPlatform ? "CÓ" : "KHÔNG",
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 26 },
        { wch: 18 },
        { wch: 35 },
        { wch: 55 },
        { wch: 10 },
        { wch: 65 },
        { wch: 35 },
        { wch: 35 },
        { wch: 45 },
        { wch: 12 },
        { wch: 40 },
        { wch: 10 },
        { wch: 25 },
        { wch: 18 },
        { wch: 40 },
        { wch: 35 },
        { wch: 14 },
      ];

      const safeName = sanitizeFilename(shopName, "khung-hoang");
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KhungHoang");
      XLSX.writeFile(workbook, `AIChoShop_XuLyKhungHoang_${safeName}_${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Export Excel error:", err);
    }
  };

  const filteredSolutions = useMemo(() => {
    const list = Array.isArray(data?.solutions) ? data.solutions : [];
    if (activeTab === "all") return list;
    if (typeof activeTab === "number") {
      return list.filter((s) => s && s.id === activeTab);
    }
    return [];
  }, [data?.solutions, activeTab]);

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col w-full lg:min-h-0 lg:h-full relative lg:overflow-hidden border border-slate-800 text-white">
      {/* 1. HEADER THANH CÔNG CỤ TỐI GIẢN (CHỮ TRẮNG NỀN ĐEN + ICON) */}
      <div className="relative lg:sticky top-0 z-10 lg:z-20 bg-black border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-col gap-1.5 shrink-0 rounded-t-2xl">
        {/* Hàng 1: Tiêu đề + Các nút thao tác icon-only */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <MessageSquareWarning size={13} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase shrink-0 whitespace-nowrap">
              <span className="hidden sm:inline">Kịch Bản Xử Lý Khủng Hoảng</span>
              <span className="sm:hidden">Khủng Hoảng</span>
            </h2>
            {data.solutions?.length > 0 && (
              <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                {data.solutions.length} phương án
              </span>
            )}
          </div>

          {/* Phải: Nhóm nút thao tác icon-only tối giản */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Tất Cả (Icon-only) */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ kịch bản"}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs shrink-0 ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Xuất Excel (Icon-Only) */}
              <button
                type="button"
                onClick={handleExportExcel}
                title="Xuất bảng tính Excel (.xlsx)"
                aria-label="Xuất Excel"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              >
                <FileSpreadsheet size={13} />
              </button>

              {/* Nút Tải TXT (Icon-Only) */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải về file TXT"
                aria-label="Tải file TXT"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              >
                <Download size={13} />
              </button>

              {/* Chuyển đổi Xem: Thẻ / Markdown */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 shrink-0 ml-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "visual"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  Thẻ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${viewMode === "raw"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                    }`}
                >
                  <span className="sm:hidden">MD</span>
                  <span className="hidden sm:inline">Markdown</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc Tối Giản */}
        {result && !loading && viewMode === "visual" && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "all"
                ? "bg-white text-black font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              <Layers size={11} />
              <span>Tất Cả ({data.solutions?.length || 0})</span>
            </button>

            {data.solutions?.map((sol) => (
              <button
                key={sol.id}
                type="button"
                onClick={() => setActiveTab(sol.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === sol.id
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>{sol.sampleNumber}: {sol.badge}</span>
              </button>
            ))}

            {data.crisisAnalysis && (
              <button
                type="button"
                onClick={() => setActiveTab("diagnosis")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "diagnosis"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <ShieldCheck size={11} />
                <span>Chẩn Đoán</span>
              </button>
            )}

            {data.strategyGuide && (
              <button
                type="button"
                onClick={() => setActiveTab("strategy")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "strategy"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <Clock size={11} />
                <span>Chiến Lược</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. VÙNG NỘI DUNG CHÍNH (CHỮ TRẮNG NỀN ĐEN TỐI GIẢN) */}
      <div
        className={`lg:flex-1 lg:min-h-0 p-3 sm:p-4 flex flex-col ${viewMode === "raw" ? "min-h-[420px] lg:h-full lg:overflow-hidden" : "lg:overflow-y-auto custom-scrollbar pb-16 lg:pb-3"
          }`}
      >
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="Đang Phân Tích & Soạn Kịch Bản Khủng Hoảng..."
            stages={REVIEW_STAGES}
            accentColor="amber"
            minHeightClass="min-h-[320px]"
          />
        ) : result ? (
          viewMode === "raw" ? (
            /* CHẾ ĐỘ XEM MARKDOWN THUẦN */
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400 shrink-0">
                <span className="font-mono">Văn bản Markdown chuẩn · 100% không dính ký tự thừa</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
                    title="Mở toàn màn hình (Esc để thoát)"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
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
            /* CHẾ ĐỘ XEM THẺ TRỰC QUAN TỐI GIẢN */
            <div className="space-y-3.5">
              {/* A. BANNER CHẨN ĐOÁN KHỦNG HOẢNG TỐI GIẢN */}
              {(activeTab === "all" || activeTab === "diagnosis") && data.crisisAnalysis && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider shrink-0">
                      <ShieldCheck size={13} className="text-white shrink-0" />
                      <span className="whitespace-nowrap">Chẩn Đoán Khủng Hoảng</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-800">
                        {data.crisisAnalysis.severityBadge || "Cần Xử Lý Sớm"}
                      </span>
                      {data.crisisAnalysis.canAppealToPlatform && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-black flex items-center gap-1 shrink-0">
                          <Scale size={10} /> Có Thể Báo Cáo Sàn
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-900 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Tâm Lý Khách Hàng</span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        {data.crisisAnalysis.customerPsychology}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-900 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">Nguyên Nhân Cốt Lõi</span>
                      <p className="text-slate-200 font-medium leading-relaxed">
                        {data.crisisAnalysis.rootCause}
                      </p>
                    </div>

                    <div className="sm:col-span-2 p-2 rounded-lg bg-slate-900/60 border border-slate-900 space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">
                        Rủi Ro Thuật Toán ({platform.toUpperCase()})
                      </span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        {data.crisisAnalysis.platformRisk}
                      </p>
                      {data.crisisAnalysis.canAppealToPlatform && data.crisisAnalysis.appealReason && (
                        <p className="text-emerald-400 text-[11px] font-semibold pt-1 border-t border-slate-800 mt-1">
                          ✓ Căn cứ báo cáo sàn gỡ đánh giá: {data.crisisAnalysis.appealReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* B. CÁC THẺ PHƯƠNG ÁN (CHUẨN 2 TẦNG CÂN ĐỐI) */}
              {(activeTab === "all" || typeof activeTab === "number") && (
                <div className="grid gap-3">
                  {filteredSolutions.map((item) => (
                    <SolutionItemCard
                      key={item.id}
                      item={item}
                      platform={platform}
                      isPublicCopied={copiedKey === `public-${item.id}`}
                      isInboxCopied={copiedKey === `inbox-${item.id}`}
                      onCopyPublic={() => handleCopySnippet(item.publicReply.content, `public-${item.id}`)}
                      onCopyInbox={() => handleCopySnippet(item.inboxScript.fullMessage, `inbox-${item.id}`)}
                    />
                  ))}
                </div>
              )}

              {/* C. CẨM NANG CHIẾN LƯỢC BẢO VỆ GIAN HÀNG */}
              {(activeTab === "all" || activeTab === "strategy") && data.strategyGuide && (
                <StrategySection guide={data.strategyGuide} />
              )}
            </div>
          )
        ) : (
          /* TRẠNG THÁI RỖNG */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <MessageSquareWarning size={22} />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-bold text-white">Chưa Có Kịch Bản Xử Lý</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dán nội dung đánh giá tiêu cực của khách ở cột bên trái để AI phân tích và tạo 3 kịch bản xử lý.
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
              <span className="font-bold text-sm text-white">Toàn Màn Hình: Kịch Bản Xử Lý Khủng Hoảng</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Đóng (Esc)"
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

// ==========================================
// THẺ ITEM: PHƯƠNG ÁN PHẢN HỒI (TỐI GIẢN CHỮ TRẮNG NỀN ĐEN)
// ==========================================
function SolutionItemCard({
  item,
  platform,
  isPublicCopied,
  isInboxCopied,
  onCopyPublic,
  onCopyInbox,
}: {
  item: ReviewSolutionItem;
  platform: string;
  isPublicCopied: boolean;
  isInboxCopied: boolean;
  onCopyPublic: () => void;
  onCopyInbox: () => void;
}) {
  const publicReplyContent = item.publicReply?.content || "";
  const publicReplyKeyPoints = Array.isArray(item.publicReply?.keyPoints) ? item.publicReply.keyPoints : [];
  const greeting = item.inboxScript?.greeting || "";
  const bodyMessage = item.inboxScript?.bodyMessage || "";
  const compensationOffer = item.inboxScript?.compensationOffer || "";
  const revisionNudge = item.inboxScript?.revisionNudge || "";

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      {/* Header Thẻ: 2 tầng chuẩn responsive chống vỡ tràn viền trên mobile */}
      <div className="space-y-2 pb-2.5 border-b border-slate-900">
        {/* TẦNG 1: [Phương Án 1] + [Khuyên Dùng] + [Nút Copy] bên phải */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-white text-black text-xs font-black shrink-0 tracking-wide">
              {item.sampleNumber || "Phương Án"}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800 shrink-0">
              {item.badge || "Khuyên Dùng"}
            </span>
          </div>

          {/* Nút Copy phản hồi công khai (Icon-only) */}
          <button
            type="button"
            onClick={onCopyPublic}
            title={isPublicCopied ? "Đã sao chép phản hồi công khai" : "Sao chép phản hồi công khai"}
            className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${isPublicCopied ? "bg-emerald-500 text-white shadow-xs" : "bg-white text-black hover:bg-slate-200"
              }`}
          >
            {isPublicCopied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
          </button>
        </div>

        {/* TẦNG 2: [Phong cách] + [Góc tiếp cận tâm lý] */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
            {item.styleName || "Phong cách thực chiến"}
          </span>
          {item.psychologicalAngle && (
            <span className="text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-900">
              🎯 {item.psychologicalAngle}
            </span>
          )}
        </div>
      </div>

      {/* 1. KHỐI PHẢN HỒI CÔNG KHAI TRÊN SÀN */}
      <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Phản Hồi Công Khai ({(platform || "SHOPEE").toUpperCase()})
          </span>
        </div>
        <p className="text-xs text-white font-medium break-words leading-relaxed select-all">
          {publicReplyContent}
        </p>

        {publicReplyKeyPoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {publicReplyKeyPoints.map((pt, pIdx) => (
              <span
                key={pIdx}
                className="text-[10px] font-medium px-2 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                ✓ {pt}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. KHỐI KỊCH BẢN INBOX 1:1 (CÓ NÚT COPY RIÊNG GỬI KHÁCH NGAY) */}
      <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MessageCircle size={12} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
              Kịch Bản Nhắn Tin Riêng (Inbox 1:1)
            </span>
          </div>

          {/* Nút Sao Chép Inbox (Icon-only) */}
          <button
            type="button"
            onClick={onCopyInbox}
            title={isInboxCopied ? "Đã sao chép kịch bản inbox" : "Sao chép toàn bộ kịch bản inbox gửi khách"}
            className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${isInboxCopied ? "bg-emerald-500 text-white shadow-xs" : "bg-white text-black hover:bg-slate-200"
              }`}
          >
            {isInboxCopied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-black border border-slate-800/80 text-xs text-slate-200 leading-relaxed space-y-1.5 select-all">
          {greeting && <p className="text-white font-medium">{greeting}</p>}
          {bodyMessage && <p className="text-slate-300">{bodyMessage}</p>}
          {compensationOffer && (
            <p className="text-slate-300 pt-1 border-t border-slate-900">
              🎁 <strong className="text-white">Đền bù:</strong> {compensationOffer}
            </p>
          )}
          {revisionNudge && (
            <p className="text-slate-300">
              ⭐ <strong className="text-white">Nhờ sửa sao:</strong> {revisionNudge}
            </p>
          )}
        </div>
      </div>

      {/* 3. SOP HẬU TRƯỜNG */}
      {item.behindTheScenesAction && (
        <div className="text-[11px] text-slate-400 flex items-start gap-1.5 px-1">
          <span className="text-slate-500 font-bold shrink-0">🛡️ SOP:</span>
          <span className="text-slate-300 leading-relaxed">{item.behindTheScenesAction}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CẨM NANG CHIẾN LƯỢC BẢO VỆ GIAN HÀNG
// ==========================================
function StrategySection({ guide }: { guide: ReviewReplierData["strategyGuide"] }) {
  const dos = Array.isArray(guide?.dos) ? guide.dos : [];
  const donts = Array.isArray(guide?.donts) ? guide.donts : [];
  const appealChecklist = Array.isArray(guide?.appealChecklist) ? guide.appealChecklist : [];

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="space-y-2 pb-2.5 border-b border-slate-900">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
          <Clock size={13} className="text-white shrink-0" />
          <span className="whitespace-nowrap">Chiến Lược Dập Khủng Hoảng</span>
        </div>
        {guide?.goldenResponseHours && (
          <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 leading-relaxed flex items-start gap-1.5">
            <span className="font-bold text-amber-400 shrink-0">⏱️ Khung giờ vàng:</span>
            <span>{guide.goldenResponseHours}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* Việc nên làm */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={11} /> Việc Nên Làm
          </span>
          <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
            {dos.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-slate-500">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Việc tránh */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-900 space-y-1.5">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={11} /> Việc Tuyệt Đối Tránh
          </span>
          <ul className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
            {donts.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-slate-500">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {appealChecklist.length > 0 && (
        <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-900 text-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Scale size={11} /> Checklist Báo Cáo Sàn Gỡ Đánh Giá
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-300">
            {appealChecklist.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-white">✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
