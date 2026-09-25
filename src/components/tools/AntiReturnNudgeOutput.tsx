"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  PackageCheck,
  PhoneCall,
  MessageSquare,
  FileSpreadsheet,
  ShieldCheck,
  Lightbulb,
  LayoutList,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseAntiReturnNudge,
  type AntiReturnNudgeData,
  type ChatMessageItem,
  type CallScriptData,
  type SmsScriptData,
  type PlanBData,
  type PsychologyTactic,
  type EmergencyActionItem,
} from "@/lib/anti-return-nudge/contract";

export type {
  AntiReturnNudgeData,
  ChatMessageItem,
  CallScriptData,
  SmsScriptData,
  PlanBData,
  PsychologyTactic,
  EmergencyActionItem,
};

interface AntiReturnNudgeOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  productName: string;
  scenario?: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
  isOfflineMode?: boolean;
  onRetryWithAi?: () => void;
}

const ANTI_RETURN_STAGES = [
  { upToSeconds: 4, text: "📦 Đang đọc tình trạng đơn hàng & phân tích lý do bom hàng..." },
  { upToSeconds: 10, text: "💬 Soạn kịch bản tin nhắn chat sàn < 350 ký tự chuẩn CSKH..." },
  { upToSeconds: 20, text: "📞 Thiết kế lời thoại gọi điện 3 bước xử lý từ chối khéo léo..." },
  { upToSeconds: 35, text: "🛡️ Xây dựng kế hoạch Plan B phối hợp bưu tá & Seller Center..." },
  { upToSeconds: 60, text: "✨ Hoàn tất bộ kịch bản tâm lý chống hoàn & cứu đơn thành công..." },
];

/**
 * Hàm sao chép 2 tầng chống lỗi webview / iOS Safari
 */
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback tầng 2
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
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

export function AntiReturnNudgeOutput({
  result,
  loading,
  shopName,
  productName,
  scenario = "just_ordered",
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
  isOfflineMode = false,
  onRetryWithAi,
}: AntiReturnNudgeOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "chat" | "call" | "planb" | "psychology">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Lắng nghe phím Escape để thoát fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  const parsed = useMemo(() => {
    if (!result) return null;
    return parseAntiReturnNudge(result, {
      shopName,
      productName,
      scenario,
    });
  }, [result, shopName, productName, scenario]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = async (text: string, key: string, label: string = "Đã sao chép!") => {
    if (!text) return;
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast(label);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    }
  };

  const handleCopyAll = () => {
    if (!parsed) return;
    const fullContent = `=== BỘ KỊCH BẢN CHỐNG HOÀN HÀNG & CỨU ĐƠN COD ===
Shop: ${parsed.shopName || shopName || "Shop"} | Sản phẩm: ${parsed.productName || productName || "Sản phẩm"}
Tình huống: ${parsed.scenarioName} | Mức độ khẩn cấp: ${parsed.urgencyLevel}
Khung giờ vàng: ${parsed.goldenHourTip}

[1. KỊCH BẢN TIN NHẮN CHAT SÀN]
${parsed.chatMessages.map((m) => `--- ${m.title} (${m.badge}) ---\n${m.content}\n`).join("\n")}

[2. KỊCH BẢN GỌI ĐIỆN THOẠI & SMS]
• Lời thoại cuộc gọi 45s:
${parsed.callScript.full || `${parsed.callScript.intro}\n${parsed.callScript.handling}\n${parsed.callScript.closing}`}

• Mẫu SMS / Zalo:
${parsed.smsScript.content}

[3. KẾ HOẠCH DỰ PHÒNG PLAN B]
• Thao tác Seller Center:
${(parsed.planB.sellerCenterSteps || (parsed.planB as any).sellerCenter || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

• Phối hợp Bưu cục & Shipper:
${(parsed.planB.carrierCoordination || (parsed.planB as any).shipper || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

[4. CHECKLIST KHẨN CẤP]
${(parsed.emergencyChecklist || []).map((c) => `Bước ${c.step} (${c.timeframe}): ${c.action}`).join("\n")}

[5. MẸO TÂM LÝ HỌC CHỐNG BOM HÀNG]
${parsed.psychology.map((p, i) => `${i + 1}. ${p.title}: ${p.actionableTip || (p as any).desc || p.principle}`).join("\n")}`;

    handleCopy(fullContent, "all", "Đã sao chép toàn bộ kịch bản!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      const chatRows = [
        ...parsed.chatMessages.map((m, idx) => ({
          STT: idx + 1,
          "Kênh Gửi": m.channel || "Khung Chat Sàn",
          "Loại Mẫu": m.sampleNumber,
          "Tiêu Đề": m.title,
          "Nội Dung Tin Nhắn": m.content,
          "Số Ký Tự": m.charCount,
          "Chuẩn Màn Hình Khóa (<350)": m.isSafe ? "Đạt chuẩn" : "Vượt 350 ký tự",
        })),
        {
          STT: parsed.chatMessages.length + 1,
          "Kênh Gửi": "SMS / Zalo Khẩn",
          "Loại Mẫu": "SMS Khẩn Cấp",
          "Tiêu Đề": parsed.smsScript.title,
          "Nội Dung Tin Nhắn": parsed.smsScript.content,
          "Số Ký Tự": parsed.smsScript.charCount,
          "Chuẩn Màn Hình Khóa (<350)": parsed.smsScript.isStandard ? "1 SMS (<160)" : "SMS dài",
        },
      ];
      const wsChat = XLSX.utils.json_to_sheet(chatRows);
      wsChat["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 32 }, { wch: 60 }, { wch: 10 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsChat, "TinNhan_Chat_SMS");

      const callRows = [
        { "Giai Đoạn": "1. Lời mở đầu (0-10s)", "Nội Dung": parsed.callScript.intro },
        { "Giai Đoạn": "2. Xử lý tình huống (10-35s)", "Nội Dung": parsed.callScript.handling },
        { "Giai Đoạn": "3. Chốt hẹn giao lại (35-45s)", "Nội Dung": parsed.callScript.closing },
      ];
      const wsCall = XLSX.utils.json_to_sheet(callRows);
      wsCall["!cols"] = [{ wch: 26 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsCall, "LoiThoai_GoiDien");

      const sellerSteps = parsed.planB?.sellerCenterSteps || (parsed.planB as any)?.sellerCenter || [];
      const carrierSteps = parsed.planB?.carrierCoordination || (parsed.planB as any)?.shipper || [];
      const psychTactics = parsed.psychology || [];
      const checklist = parsed.emergencyChecklist || [];

      const guideRows = [
        ...sellerSteps.map((s: string, idx: number) => ({
          "Hạng Mục": "Plan B - Seller Center",
          "Bước": `Bước ${idx + 1}`,
          "Nội Dung": s,
        })),
        ...carrierSteps.map((s: string, idx: number) => ({
          "Hạng Mục": "Plan B - Bưu Cục/Shipper",
          "Bước": `Bước ${idx + 1}`,
          "Nội Dung": s,
        })),
        ...checklist.map((c: any) => ({
          "Hạng Mục": "Checklist Khẩn Cấp",
          "Bước": `Bước ${c.step} (${c.timeframe})`,
          "Nội Dung": c.action,
        })),
        ...psychTactics.map((p: any) => ({
          "Hạng Mục": "Mẹo Tâm Lý Học",
          "Bước": p.title,
          "Nội Dung": p.actionableTip || p.desc || p.principle || "",
        })),
      ];
      const wsGuide = XLSX.utils.json_to_sheet(guideRows);
      wsGuide["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsGuide, "PlanB_Va_TamLy");

      const safeName = (shopName || "shop").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const fileName = `kich-ban-cuu-don-${safeName}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã tải xuống file Excel kịch bản cứu đơn!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kich-ban-cuu-don-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  return (
    <div
      className={`bg-black text-white rounded-2xl border border-zinc-800 shadow-2xl flex flex-col w-full lg:min-h-0 lg:h-full relative overflow-visible lg:overflow-hidden transition-all ${isFullScreen
        ? "fixed inset-2 sm:inset-4 z-50 rounded-2xl shadow-2xl bg-black overflow-y-auto"
        : "h-auto lg:h-full"
        }`}
    >
      {/* Toast Mini */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <Check size={13} className="text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar Tối Giản (Chữ trắng nền đen, 1 hàng ngang duy nhất) */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-zinc-800 bg-black flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20 flex-nowrap sticky top-0 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <PackageCheck size={15} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase truncate">
            Kịch Bản Cứu Đơn COD
          </h2>

          {isOfflineMode && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-amber-400 shrink-0">
              ⚡ Dự Phòng
            </span>
          )}
        </div>

        {/* Nút hành động Toolbar (Toàn bộ nút copy chỉ hiển thị icon) */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chuyển chế độ: Trực quan vs Gốc */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Giao diện trực quan"
                aria-label="Giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "interactive"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <LayoutList size={12} />
                <span className="hidden sm:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Văn bản gốc"
                aria-label="Văn bản gốc"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "raw"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
                  }`}
              >
                <FileText size={12} />
                <span className="hidden sm:inline">Gốc</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất file Excel (.xlsx)"
              aria-label="Xuất file Excel"
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
            </button>

            {/* Tải tệp .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp .txt"
              aria-label="Tải tệp .txt"
              className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Download size={13} />
            </button>

            {/* Toàn màn hình */}


            {/* Sao chép toàn bộ: CHỈ HIỂN THỊ ICON */}
            <button
              type="button"
              onClick={handleCopyAll}
              title={copiedKey === "all" ? "Đã sao chép tất cả" : "Sao chép tất cả"}
              aria-label="Sao chép tất cả"
              className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === "all" ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Thông báo Chế độ Dự Phòng Offline Blueprint */}
      {isOfflineMode && result && !loading && (
        <div className="px-3 sm:px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">
              ⚡ Kịch bản cứu đơn dự phòng chuẩn sàn 2026 (Lượt dùng AI chưa bị trừ).
            </span>
          </div>
          {onRetryWithAi && (
            <button
              type="button"
              onClick={onRetryWithAi}
              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-medium text-[11px] shrink-0 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} /> Thử lại AI
            </button>
          )}
        </div>
      )}

      {/* 2. Sub-Tabs Phân Loại (Cố định thanh tab bên dưới toolbar) */}
      {result && viewMode === "interactive" && !loading && (
        <div className="sticky top-[49px] z-10 px-3 sm:px-4 py-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "all"
              ? "bg-white text-black font-bold shadow-xs"
              : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
          >
            <Layers size={12} />
            <span>Tất Cả</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "chat"
              ? "bg-white text-black font-bold shadow-xs"
              : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
          >
            <MessageSquare size={12} />
            <span>Chat Sàn ({parsed?.chatMessages.length || 2})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("call")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "call"
              ? "bg-white text-black font-bold shadow-xs"
              : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
          >
            <PhoneCall size={12} />
            <span>Gọi &amp; SMS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("planb")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "planb"
              ? "bg-white text-black font-bold shadow-xs"
              : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
          >
            <ShieldCheck size={12} />
            <span>Plan B Sàn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("psychology")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "psychology"
              ? "bg-white text-black font-bold shadow-xs"
              : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 font-medium"
              }`}
          >
            <Lightbulb size={12} />
            <span>Mẹo Tâm Lý</span>
          </button>
        </div>
      )}

      {/* 3. Vùng hiển thị nội dung: Cuộn cả trang trên Mobile, Cuộn nội bộ trên Desktop */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar relative z-10 pb-24 lg:pb-4">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Soạn Kịch Bản Cứu Đơn & Chống Bom..."
            stages={ANTI_RETURN_STAGES}
            accentColor="emerald"
            minHeightClass="min-h-[360px]"
          />
        ) : result && parsed ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Dữ liệu gốc:</span>
                  {/* Nút sao chép Markdown gốc: CHỈ HIỂN THỊ ICON */}
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép Markdown!")}
                    title="Sao chép toàn bộ văn bản gốc"
                    aria-label="Sao chép toàn bộ văn bản gốc"
                    className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer"
                  >
                    {copiedKey === "rawText" ? (
                      <Check size={12} className="stroke-[3] text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[500px] bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* ========================================================================= */}
                {/* 1. KỊCH BẢN TIN NHẮN CHAT SÀN (SHOPEE / TIKTOK SHOP)                      */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "chat") && parsed.chatMessages.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={15} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          1. Kịch Bản Tin Nhắn Chat Sàn
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {parsed.chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3 sm:p-3.5 space-y-2 hover:border-zinc-700 transition-all"
                        >
                          {/* Header từng mẫu: Đảm bảo hiển thị ĐẦY ĐỦ tiêu đề & badge, KHÔNG BỊ CẮT CHỮ */}
                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-800/60">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                                  {msg.sampleNumber}
                                </span>
                                {msg.badge && (
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${msg.isSafe
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      }`}
                                  >
                                    {msg.badge}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                                {msg.title}
                              </h4>
                            </div>

                            {/* Nút copy cố định góc trên bên phải, không bị rớt dòng */}
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.content, `chat-${idx}`, `Đã sao chép ${msg.sampleNumber}!`)}
                              title={`Sao chép ${msg.sampleNumber}`}
                              aria-label={`Sao chép ${msg.sampleNumber}`}
                              className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 self-start mt-0.5"
                            >
                              {copiedKey === `chat-${idx}` ? (
                                <Check size={12} className="stroke-[3] text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          {/* Nội dung tin nhắn */}
                          <div className="text-zinc-200 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed select-text bg-black/60 p-2.5 sm:p-3 rounded-lg border border-zinc-800/60 font-sans">
                            {msg.content}
                          </div>

                          {/* Thông số ký tự */}

                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. KỊCH BẢN GỌI ĐIỆN THOẠI CSKH (45s) & SMS TRỰC TIẾP                     */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "call") && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={15} className="text-blue-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          2. Lời Thoại Cuộc Gọi (45s) &amp; SMS
                        </h3>
                      </div>

                    </div>

                    {/* Lời thoại 45 giây */}
                    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          🎙️ Lời Thoại Cuộc Gọi CSKH (45 Giây)
                        </span>

                        {/* Nút copy toàn bộ lời thoại: CHỈ HIỂN THỊ ICON */}
                        <button
                          type="button"
                          onClick={() => handleCopy(parsed.callScript.full || `${parsed.callScript.intro}\n${parsed.callScript.handling}\n${parsed.callScript.closing}`, "callFull", "Đã sao chép toàn bộ lời thoại!")}
                          title="Sao chép toàn bộ lời thoại cuộc gọi"
                          aria-label="Sao chép toàn bộ lời thoại cuộc gọi"
                          className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                        >
                          {copiedKey === "callFull" ? (
                            <Check size={12} className="stroke-[3] text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>

                      {/* 3 Bước đắc nhân tâm */}
                      <div className="space-y-2 text-xs">
                        {parsed.callScript.intro && (
                          <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-zinc-400 mr-1.5">
                                01. Lời mở đầu (0-10s):
                              </span>
                              <span className="text-zinc-200">&quot;{parsed.callScript.intro}&quot;</span>
                            </div>
                            {/* Nút copy lời mở đầu: CHỈ HIỂN THỊ ICON */}
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.intro, "intro", "Đã sao chép lời mở đầu!")}
                              title="Sao chép lời mở đầu"
                              aria-label="Sao chép lời mở đầu"
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "intro" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}

                        {parsed.callScript.handling && (
                          <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-zinc-400 mr-1.5">
                                02. Xử lý &amp; Thấu cảm (10-35s):
                              </span>
                              <span className="text-zinc-200">&quot;{parsed.callScript.handling}&quot;</span>
                            </div>
                            {/* Nút copy xử lý tình huống: CHỈ HIỂN THỊ ICON */}
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.handling, "handling", "Đã sao chép phần xử lý!")}
                              title="Sao chép xử lý tình huống"
                              aria-label="Sao chép xử lý tình huống"
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "handling" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}

                        {parsed.callScript.closing && (
                          <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-zinc-400 mr-1.5">
                                03. Chốt hẹn giao lại (35-45s):
                              </span>
                              <span className="text-zinc-200">&quot;{parsed.callScript.closing}&quot;</span>
                            </div>
                            {/* Nút copy chốt hẹn: CHỈ HIỂN THỊ ICON */}
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.closing, "closing", "Đã sao chép chốt hẹn!")}
                              title="Sao chép chốt hẹn"
                              aria-label="Sao chép chốt hẹn"
                              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "closing" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {parsed.callScript.mindsetNote && (
                        <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-zinc-800/60">
                          💡 {parsed.callScript.mindsetNote}
                        </p>
                      )}
                    </div>

                    {/* Mẫu SMS / Zalo Khẩn */}
                    {parsed.smsScript.content && (
                      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              📩 Mẫu SMS / Zalo Khẩn Cấp
                            </span>

                          </div>

                          {/* Nút copy SMS: CHỈ HIỂN THỊ ICON */}
                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.smsScript.content, "sms", "Đã sao chép mẫu SMS!")}
                            title="Sao chép mẫu SMS"
                            aria-label="Sao chép mẫu SMS"
                            className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                          >
                            {copiedKey === "sms" ? (
                              <Check size={12} className="stroke-[3] text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>

                        <div className="bg-black/60 p-3 rounded-lg border border-zinc-800/60 text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap break-words select-text font-mono">
                          {parsed.smsScript.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. KẾ HOẠCH HÀNH ĐỘNG DỰ PHÒNG TRÊN SELLER CENTER (PLAN B)                */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "planb") && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-amber-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          3. Kế Hoạch Dự Phòng (Plan B)
                        </h3>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Thao tác trên Seller Center */}
                      {((parsed.planB?.sellerCenterSteps?.length ?? 0) > 0 || ((parsed.planB as any)?.sellerCenter?.length ?? 0) > 0) && (
                        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3.5 space-y-2">
                          <h4 className="text-xs font-bold text-zinc-200 pb-1.5 border-b border-zinc-800/80 flex items-center gap-1.5">
                            🖥️ Thao tác trên Seller Center
                          </h4>
                          <div className="space-y-1.5">
                            {(parsed.planB.sellerCenterSteps || (parsed.planB as any).sellerCenter || []).map((step: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                                <span className="font-mono text-zinc-500 font-semibold shrink-0">
                                  {idx + 1}.
                                </span>
                                <span className="break-words">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phối hợp với Shipper / Bưu cục */}
                      {((parsed.planB?.carrierCoordination?.length ?? 0) > 0 || ((parsed.planB as any)?.shipper?.length ?? 0) > 0) && (
                        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3.5 space-y-2">
                          <h4 className="text-xs font-bold text-zinc-200 pb-1.5 border-b border-zinc-800/80 flex items-center gap-1.5">
                            🚚 Phối hợp Shipper / Bưu cục
                          </h4>
                          <div className="space-y-1.5">
                            {(parsed.planB.carrierCoordination || (parsed.planB as any).shipper || []).map((step: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                                <span className="font-mono text-zinc-500 font-semibold shrink-0">
                                  {idx + 1}.
                                </span>
                                <span className="break-words">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checklist Khẩn Cấp (Nhiệm vụ 3 bước) nếu có */}
                    {parsed.emergencyChecklist && parsed.emergencyChecklist.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                        <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Clock size={13} /> Checklist Hành Động Ứng Cứu Khẩn Cấp
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {parsed.emergencyChecklist.map((item, idx) => (
                            <div key={idx} className="bg-black/60 border border-zinc-800/80 p-2.5 rounded-lg space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-400">Bước {item.step}</span>
                                <span className="text-zinc-500 text-[10px]">{item.timeframe}</span>
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{item.action}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. BÍ QUYẾT TÂM LÝ HỌC CHỐNG BOM HÀNG                                    */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "psychology") && parsed.psychology && parsed.psychology.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={15} className="text-purple-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          4. Mẹo Tâm Lý Học Chống Bom Hàng
                        </h3>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {parsed.psychology.map((tactic, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-3 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-purple-400">
                              0{idx + 1}.
                            </span>
                            <h5 className="font-bold text-xs text-zinc-200 leading-snug">
                              {tactic.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed break-words">
                            {tactic.actionableTip || (tactic as any).desc || tactic.principle}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State Tối Giản */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <PackageCheck size={24} className="text-emerald-400/80" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-zinc-200">
                Chưa Có Kịch Bản Cứu Đơn COD
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chọn tình huống đơn hàng ở khung bên trái và bấm &quot;Tạo Kịch Bản Chống Bom &amp; Cứu Đơn&quot; để AI xây dựng toàn bộ giải pháp.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} className="text-emerald-400" />
                <span>Thử dữ liệu mẫu cứu đơn</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AntiReturnNudgeOutput;
