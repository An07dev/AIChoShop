"use client";

import React, { useState, useMemo, useRef, useEffect, Component, type ReactNode } from "react";

// ==========================================
// HÀM SAO CHÉP AN TOÀN 2 TẦNG (CLIPBOARD RESILIENCE)
// ==========================================
async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  // Tầng 1: Clipboard API hiện đại
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback sang Tầng 2
    }
  }
  // Tầng 2: Fallback qua textarea ẩn và document.execCommand
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

// ==========================================
// HÀM CHUẨN HÓA TÊN FILE AN TOÀN TRÊN MỌI HỆ ĐIỀU HÀNH
// ==========================================
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
import {
  Copy,
  Check,
  Sparkles,
  Download,
  MessageSquare,
  ShoppingBag,
  MessageCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  FileText,
  Bell,
  Users,
  Maximize2,
  Minimize2,
  X,
  Gift,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseChatBroadcastResult,
  formatChatBroadcastMarkdownText,
  type ChatBroadcastData,
  type ShopeeBroadcastMessage,
  type ZaloMessageItem,
  type BroadcastStrategy,
} from "@/lib/chat-broadcast/contract";

interface ChatBroadcastOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  channel?: string;
  scenario?: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
}

const BROADCAST_STAGES = [
  { upToSeconds: 4, text: "💬 Phân tích chân dung khách hàng & kịch bản remarketing..." },
  { upToSeconds: 12, text: "🛍️ Soạn tin nhắn Shopee Broadcast chuẩn < 350 ký tự..." },
  { upToSeconds: 25, text: "📱 Thiết kế tin nhắn Zalo OA tương tác 1:1 đắc nhân tâm..." },
  { upToSeconds: 45, text: "🎁 Lồng ghép voucher ưu đãi & lời kêu gọi hành động (CTA)..." },
  { upToSeconds: 80, text: "✨ Hoàn thiện khung giờ vàng & checklist an toàn sàn..." },
];

function ChatBroadcastOutputInner({
  result,
  loading,
  shopName,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
}: ChatBroadcastOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "shopee" | "zalo" | "strategy">("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Phân giải dữ liệu qua resilient parser 4 tầng
  const data: ChatBroadcastData = useMemo(() => parseChatBroadcastResult(result), [result]);

  // Chuyển đổi sang văn bản Markdown sạch đẹp
  const markdownText = useMemo(() => {
    if (!result) return "";
    return formatChatBroadcastMarkdownText(data);
  }, [result, data]);

  // Tự động cuộn lên đầu khi chuyển sang tab Markdown
  useEffect(() => {
    if (viewMode === "raw" && textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [viewMode, markdownText]);

  // Phím tắt ESC để đóng toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const totalVariants = (data.shopeeMessages?.length || 0) + (data.zaloMessages?.length || 0);

  const handleCopySnippet = async (text: string, key: string) => {
    if (!text) return;
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (!markdownText) return;
    const ok = await safeCopyToClipboard(markdownText);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!markdownText) return;
    const safeName = sanitizeFilename(shopName, "broadcast");
    const blob = new Blob([markdownText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-broadcast-${safeName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const rows: any[] = [];
    let stt = 1;

    data.shopeeMessages?.forEach((item) => {
      rows.push({
        STT: stt++,
        "Nền Tảng": "Shopee Broadcast",
        "Mẫu Tin": item.sampleNumber,
        "Góc Tiếp Cận": item.angle,
        "Tệp Mục Tiêu": item.targetAudience,
        "Thông Báo Đẩy (Hook)": item.notificationHook,
        "Nội Dung Tin Nhắn": item.content,
        "Số Ký Tự": item.charCount,
        "Chuẩn Sàn": item.isSafeLength ? "✓ Đạt chuẩn (< 350 kt)" : "⚠️ Vượt 350 kt",
        "Nút CTA": item.callToAction,
        "Khung Giờ": data.strategy?.goldenHours?.shopee || "11h30 - 13h00 & 19h30 - 21h00",
      });
    });

    data.zaloMessages?.forEach((item) => {
      rows.push({
        STT: stt++,
        "Nền Tảng": "Zalo OA & 1:1",
        "Mẫu Tin": item.sampleNumber,
        "Góc Tiếp Cận": item.angle,
        "Tệp Mục Tiêu": "Khách cũ thân thiết",
        "Thông Báo Đẩy (Hook)": item.greeting,
        "Nội Dung Tin Nhắn": item.fullContent,
        "Số Ký Tự": item.charCount,
        "Chuẩn Sàn": "✓ Chuẩn CSKH 1:1",
        "Nút CTA": item.callToAction,
        "Khung Giờ": data.strategy?.goldenHours?.zalo || "09h00 - 10h30 & 14h30 - 16h00",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 10 },
      { wch: 24 },
      { wch: 26 },
      { wch: 32 },
      { wch: 65 },
      { wch: 10 },
      { wch: 20 },
      { wch: 26 },
      { wch: 35 },
    ];

    const safeName = sanitizeFilename(shopName, "broadcast");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Broadcast");
    XLSX.writeFile(workbook, `AIChoShop_Broadcast_${safeName}_${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col min-h-0 lg:h-full relative lg:overflow-hidden border border-slate-800 text-white w-full max-w-full">
      {/* 1. HEADER THANH CÔNG CỤ TỐI GIẢN (CHỮ TRẮNG NỀN ĐEN + ICON) */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-col gap-1.5 shrink-0">
        {/* Hàng 1: Tiêu đề + Các nút thao tác */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <MessageSquare size={13} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase shrink-0 whitespace-nowrap">
              <span className="hidden sm:inline">Tin Nhắn Chat Broadcast</span>
              <span className="sm:hidden">Broadcast</span>
            </h2>
            {totalVariants > 0 && (
              <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                {totalVariants} mẫu
              </span>
            )}
          </div>

          {/* Phải: Nhóm nút thao tác icon-only / mini */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Tất Cả (Icon-only) */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs shrink-0 ${copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Xuất Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                title="Xuất bảng tính Excel (.xlsx)"
                className="w-7 h-7 sm:w-auto sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">Excel</span>
              </button>

              {/* Nút Tải TXT */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải về file TXT"
                className="w-7 h-7 sm:w-auto sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
              >
                <Download size={13} />
                <span className="hidden sm:inline">TXT</span>
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

        {/* Hàng 2: Thanh Tab Lọc Phân Kênh (Chỉ hiện khi ở chế độ visual và đã có kết quả) */}
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
              <span>Tất Cả</span>
              {totalVariants > 0 && (
                <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-black/20 text-inherit">
                  {totalVariants}
                </span>
              )}
            </button>

            {(data.shopeeMessages?.length || 0) > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("shopee")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "shopee"
                    ? "bg-white text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <ShoppingBag size={11} />
                <span>Shopee ({data.shopeeMessages.length})</span>
              </button>
            )}

            {(data.zaloMessages?.length || 0) > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("zalo")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeTab === "zalo"
                    ? "bg-white text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <MessageCircle size={11} />
                <span>Zalo OA ({data.zaloMessages.length})</span>
              </button>
            )}

            {data.strategy && (
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
            title="Đang Soạn Kịch Bản Broadcast Chuẩn Sàn..."
            stages={BROADCAST_STAGES}
            accentColor="emerald"
            minHeightClass="min-h-[320px]"
          />
        ) : result ? (
          viewMode === "raw" ? (
            /* CHẾ ĐỘ XEM MARKDOWN THUẦN (FULL CHIỀU CAO + MODAL TOÀN MÀN HÌNH) */
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400 shrink-0">
                <span className="font-mono">Văn bản Markdown sạch · 100% không dính ký tự JSON</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
                    title="Mở toàn màn hình (Phím tắt: Esc để thoát)"
                  >
                    <Maximize2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-black hover:bg-slate-200"
                      }`}
                  >
                    {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                readOnly
                value={markdownText}
                className="w-full flex-1 h-full min-h-[320px] lg:min-h-0 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-[13px] font-mono leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            </div>
          ) : (
            /* CHẾ ĐỘ XEM THẺ TRỰC QUAN (VISUAL CARDS TỐI GIẢN) */
            <div className="space-y-4">
              {/* 1. DANH SÁCH SHOPEE BROADCAST */}
              {(activeTab === "all" || activeTab === "shopee") && (data.shopeeMessages?.length || 0) > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <ShoppingBag size={13} />
                      <span>Shopee Chat Broadcast</span>
                      <span className="text-[10px] font-normal text-slate-400 lowercase">(&lt; 350 ký tự)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {data.shopeeMessages.length} mẫu
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {data.shopeeMessages.map((item) => (
                      <ShopeeItemCard
                        key={item.id}
                        item={item}
                        isCopied={copiedKey === item.id}
                        isHookCopied={copiedKey === `${item.id}-hook`}
                        onCopy={() => handleCopySnippet(item.content, item.id)}
                        onCopyHook={() => handleCopySnippet(item.notificationHook, `${item.id}-hook`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. DANH SÁCH ZALO OA */}
              {(activeTab === "all" || activeTab === "zalo") && (data.zaloMessages?.length || 0) > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <MessageCircle size={13} />
                      <span>Zalo OA & CSKH 1:1</span>
                      <span className="text-[10px] font-normal text-slate-400 lowercase">(thân tình)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {data.zaloMessages.length} mẫu
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {data.zaloMessages.map((item) => (
                      <ZaloItemCard
                        key={item.id}
                        item={item}
                        isCopied={copiedKey === item.id}
                        onCopy={() => handleCopySnippet(item.fullContent, item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. CHIẾN LƯỢC & KHUNG GIỜ VÀNG */}
              {(activeTab === "all" || activeTab === "strategy") && data.strategy && (
                <StrategySection strategy={data.strategy} />
              )}
            </div>
          )
        ) : (
          /* TRẠNG THÁI RỖNG (EMPTY STATE) */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <MessageSquare size={22} />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-bold text-white">Chưa Có Kịch Bản Chat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập thông tin sản phẩm và ưu đãi ở cột bên trái để AI soạn tin nhắn chuẩn sàn.
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
              <span className="font-bold text-sm text-white">Toàn Màn Hình: Tin Nhắn Chat Broadcast</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95 ${copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-slate-200"
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
              value={markdownText}
              className="w-full h-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// THẺ ITEM: SHOPEE BROADCAST (TỐI GIẢN CHỮ TRẮNG NỀN ĐEN)
// ==========================================
function ShopeeItemCard({
  item,
  isCopied,
  isHookCopied,
  onCopy,
  onCopyHook,
}: {
  item: ShopeeBroadcastMessage;
  isCopied: boolean;
  isHookCopied: boolean;
  onCopy: () => void;
  onCopyHook: () => void;
}) {
  const isOver = item.charCount > 350;

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
      {/* Header Thẻ: 2 tầng chuẩn responsive chống vỡ tràn viền trên mobile */}
      <div className="space-y-2 pb-2.5 border-b border-slate-900">
        {/* TẦNG 1: [Mẫu 1] + [✓ 274/350] bên trái <=======> [Nút Copy] bên phải */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-white text-black text-xs font-black shrink-0 tracking-wide">
              {item.sampleNumber}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${isOver
                  ? "bg-rose-950/40 text-rose-300 border-rose-800"
                  : "bg-slate-900 text-slate-300 border-slate-800"
                }`}
            >
              {isOver ? (
                <AlertTriangle size={10} className="text-rose-400" />
              ) : (
                <CheckCircle2 size={10} className="text-emerald-400" />
              )}
              <span>{item.charCount}/350</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onCopy}
            title={isCopied ? "Đã sao chép tin nhắn" : "Sao chép tin nhắn Shopee"}
            className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${isCopied
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-white text-black hover:bg-slate-200"
              }`}
          >
            {isCopied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
          </button>
        </div>

        {/* TẦNG 2: [Góc tiếp cận] + [Tệp khách hàng] - Tự xuống dòng mượt mà nếu màn hình hẹp */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
            <Sparkles size={10} className="text-amber-400 shrink-0" />
            <span>{item.angle}</span>
          </span>
          {item.targetAudience && (
            <span className="text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-900 flex items-center gap-1">
              <Users size={10} className="text-slate-400 shrink-0" />
              <span className="text-slate-300 font-medium truncate">{item.targetAudience}</span>
            </span>
          )}
        </div>
      </div>

      {/* Thông Báo Đẩy (Hook Màn Hình Khóa): Hiển thị gọn gàng */}
      {item.notificationHook && (
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-start justify-between gap-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <div className="w-5 h-5 rounded bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
              <Bell size={10} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Thông Báo Đẩy (Màn Hình Khóa)
              </span>
              <p className="text-xs text-white font-medium break-words leading-relaxed mt-0.5">
                {item.notificationHook}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCopyHook}
            title={isHookCopied ? "Đã sao chép hook" : "Sao chép dòng thông báo đẩy"}
            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center justify-center cursor-pointer shrink-0 mt-0.5 active:scale-90"
          >
            {isHookCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
      )}

      {/* Nội Dung Tin Nhắn Chat */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-[13px] text-slate-100 leading-relaxed whitespace-pre-line select-text font-normal">
        {item.content}
      </div>

      {/* Nút Kêu Gọi CTA */}
      {item.callToAction && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 shrink-0">Nút CTA:</span>
          <span className="text-slate-200 font-medium break-words">{item.callToAction}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// THẺ ITEM: ZALO OA (TỐI GIẢN CHỮ TRẮNG NỀN ĐEN)
// ==========================================
function ZaloItemCard({
  item,
  isCopied,
  onCopy,
}: {
  item: ZaloMessageItem;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
      {/* Header Thẻ: 2 tầng chuẩn responsive chống vỡ tràn viền trên mobile */}
      <div className="space-y-2 pb-2.5 border-b border-slate-900">
        {/* TẦNG 1: [Mẫu 1] + [Độ dài ký tự] bên trái <=======> [Nút Copy] bên phải */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-white text-black text-xs font-black shrink-0 tracking-wide">
              {item.sampleNumber}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-800 bg-slate-900 text-slate-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={10} className="text-emerald-400" />
              <span>{item.charCount} kt</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onCopy}
            title={isCopied ? "Đã sao chép tin nhắn" : "Sao chép tin nhắn Zalo"}
            className={`w-7 h-7 rounded-md transition-all flex items-center justify-center cursor-pointer active:scale-90 shrink-0 ${isCopied
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-white text-black hover:bg-slate-200"
              }`}
          >
            {isCopied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
          </button>
        </div>

        {/* TẦNG 2: [Góc tiếp cận] */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-200 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
            <Sparkles size={10} className="text-blue-400 shrink-0" />
            <span>{item.angle}</span>
          </span>
        </div>
      </div>

      {/* Nội Dung Tin Nhắn Hoàn Chỉnh */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-[13px] text-slate-100 leading-relaxed whitespace-pre-line select-text">
        {item.fullContent}
      </div>

      {/* Quà Tặng / Ưu Đãi Độc Quyền nếu có */}
      {item.giftOffer && (
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2 text-[11px]">
          <Gift size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Ưu Đãi / Quà Tặng:</span>
            <span className="text-slate-200 leading-snug">{item.giftOffer}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// KHỐI CHIẾN LƯỢC & KHUNG GIỜ VÀNG (TỐI GIẢN)
// ==========================================
function StrategySection({ strategy }: { strategy: BroadcastStrategy }) {
  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-900">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
          <Clock size={13} />
          <span>Chiến Lược Gửi Tin & Khung Giờ Vàng</span>
        </div>
      </div>

      {/* 3 Thẻ Nhỏ Khung Giờ Vàng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Shopee:</span>
          <p className="text-xs font-bold text-white">{strategy.goldenHours?.shopee || "11h30 - 13h00 & 19h30 - 21h00"}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Zalo OA:</span>
          <p className="text-xs font-bold text-white">{strategy.goldenHours?.zalo || "09h00 - 10h30 & 14h30 - 16h00"}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Thời Điểm:</span>
          <p className="text-xs font-bold text-white">{strategy.goldenHours?.bestDays || "Thứ 5, 6 & Mega Sale"}</p>
        </div>
      </div>

      {/* Checklist Chống Khóa Sàn */}
      {strategy.antiSpamChecklist && strategy.antiSpamChecklist.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-400" />
            <span>Checklist Né Phạt Sàn:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {strategy.antiSpamChecklist.map((rule, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tần Suất Gửi */}
      {strategy.frequencyRules && strategy.frequencyRules.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-900">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Tần Suất Khuyến Nghị:</span>
          {strategy.frequencyRules.map((r, idx) => (
            <p key={idx} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1">
              <span className="text-slate-500">•</span>
              <span>{r}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// REACT ERROR BOUNDARY CỤC BỘ (CHỐNG CRASH TOÀN TRANG)
// ==========================================
class ChatBroadcastErrorBoundary extends Component<
  { children: ReactNode; onUseSample?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onUseSample?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ChatBroadcastOutput render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-black border border-slate-800 text-center space-y-3 my-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Không Thể Hiển Thị Giao Diện Kịch Bản</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Đã xảy ra sự cố định dạng dữ liệu phản hồi từ AI. Bạn có thể khôi phục lại dữ liệu mẫu hoặc thử lại.
            </p>
          </div>
          {this.props.onUseSample && (
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onUseSample?.();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Khôi Phục Dữ Liệu Mẫu
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export function ChatBroadcastOutput(props: ChatBroadcastOutputProps) {
  return (
    <ChatBroadcastErrorBoundary onUseSample={props.onUseSample}>
      <ChatBroadcastOutputInner {...props} />
    </ChatBroadcastErrorBoundary>
  );
}
