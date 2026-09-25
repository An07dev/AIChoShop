"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  HeartHandshake,
  ShieldCheck,
  Star,
  QrCode,
  Printer,
  FileText,
  Gift,
  Heart,
  LayoutList,
  Layers,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  UnboxingCardData,
  parseUnboxingCardResult,
} from "@/lib/unboxing-card/contract";

interface UnboxingCardOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  cardFormat?: string;
  cardTone?: string;
  primaryGoal?: string;
  isOfflineMode?: boolean;
  onUseSample?: () => void;
  onRetryWithAi?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
}

const UNBOXING_STAGES = [
  { upToSeconds: 4, text: "💌 Phân tích phong cách thương hiệu & cảm xúc người nhận hàng..." },
  { upToSeconds: 10, text: "💖 Soạn thông điệp bìa trước tạo ấn tượng First Impression..." },
  { upToSeconds: 20, text: "🛡️ Thiết lập khiên chắn tâm lý hóa giải 80% nguy cơ đánh giá 1 sao..." },
  { upToSeconds: 35, text: "⭐ Tối ưu nam châm kéo review 5 sao kèm clip unboxing & quà tặng..." },
  { upToSeconds: 60, text: "🖨️ Chuẩn hóa thông số xưởng in offset & cổng QR bảo hành an toàn..." },
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
      // Fallback sang tầng 2
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

export function UnboxingCardOutput({
  result,
  loading,
  shopName,
  cardFormat = "postcard_a6",
  cardTone = "emotional",
  primaryGoal = "anti_1_star",
  isOfflineMode = false,
  onUseSample,
  onRetryWithAi,
  elapsedSeconds = 0,
  onCancel,
}: UnboxingCardOutputProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "raw">("card");
  const [cardSide, setCardSide] = useState<"both" | "front" | "back" | "print">("both");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Thoát toàn màn hình khi bấm Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000);
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

  // Parse dữ liệu từ Resilient 4-tier Parser
  const cardData: UnboxingCardData | null = useMemo(() => {
    if (!result || !result.trim()) return null;
    return parseUnboxingCardResult(result, {
      shopName,
      productCategory: "",
      cardTone,
      cardFormat,
      primaryGoal,
    });
  }, [result, shopName, cardTone, cardFormat, primaryGoal]);

  const activeShopName = (shopName || cardData?.shopName || "").trim();

  // Huy hiệu nhận diện mặt trước: Luôn đảm bảo xuất hiện tên shop
  const displayBadge = useMemo(() => {
    const rawBadge = cardData?.front?.badgeText || "";
    if (!activeShopName) return rawBadge || "OFFICIAL STORE • HANDMADE WITH LOVE";
    if (!rawBadge) return `${activeShopName.toUpperCase()} • OFFICIAL STORE`;
    if (!rawBadge.toLowerCase().includes(activeShopName.toLowerCase())) {
      return `${activeShopName.toUpperCase()} • ${rawBadge.replace(/^[•\s-]+|[•\s-]+$/g, "")}`;
    }
    return rawBadge;
  }, [cardData?.front?.badgeText, activeShopName]);

  const handleCopyAll = () => {
    if (!cardData) return;
    const notes = Array.isArray(cardData.front?.visualDesignNotes)
      ? cardData.front.visualDesignNotes.join("; ")
      : "";
    const advice = Array.isArray(cardData.marketingAdvice)
      ? cardData.marketingAdvice.map((adv, i) => `${i + 1}. ${adv}`).join("\n")
      : "";

    const fullContent = `=== THƯ CẢM ƠN NHÉT HỘP HÀNG - ${(cardData.shopName || "SHOP").toUpperCase()} ===
Khổ in: ${cardData.cardFormat || "A6"} | Tone: ${cardData.cardTone || ""}

[1. MẶT TRƯỚC - BÌA THIỆP]
- Huy hiệu: ${displayBadge}
- Tiêu đề: ${cardData.front?.headline || ""}
- Lời tựa: ${cardData.front?.subheadline || ""}
- Gợi ý thiết kế: ${notes}
- Lời dẫn lật mặt: ${cardData.front?.openHook || ""}

[2. MẶT SAU - TÂM THƯ & 3 TRỤ CỘT CHIẾN LƯỢC]
${cardData.back?.heartfeltLetter || ""}

🛡️ KHIÊN CHẮN 1 SAO:
${cardData.back?.anti1StarShield?.heading || ""}
${cardData.back?.anti1StarShield?.message || ""}
(Kênh hỗ trợ: ${cardData.back?.anti1StarShield?.supportCta || ""})

⭐ NAM CHÂM REVIEW 5 SAO:
${cardData.back?.reviewMagnet?.heading || ""}
${cardData.back?.reviewMagnet?.instruction || ""}
(Quà tặng/Ưu đãi: ${cardData.back?.reviewMagnet?.incentive || ""})

📲 CỔNG QR BẢO HÀNH AN TOÀN:
${cardData.back?.safeQrPortal?.qrCaption || ""}
${cardData.back?.safeQrPortal?.safeNotice || ""}

[3. QUY CHUẨN XƯỞNG IN OFFSET]
- Kích thước: ${cardData.printSpecs?.dimensionsMm || ""} (Tràn lề: ${cardData.printSpecs?.bleedNote || ""})
- Chất liệu giấy: ${cardData.printSpecs?.recommendedPaper || ""}
- Hệ màu in: ${cardData.printSpecs?.colorMode || ""}
- Ước tính chi phí: ${cardData.printSpecs?.estimatedCost || ""}
- Mẹo unboxing: ${cardData.printSpecs?.proPackagingTip || ""}

[4. LỜI KHUYÊN MARKETING & RETENTION]
${advice}`;

    handleCopy(fullContent, "all", "Đã sao chép toàn bộ bản thiết kế thiệp!");
  };

  const handleDownloadTxt = () => {
    if (!cardData) return;
    const fullContent = `=== THƯ CẢM ƠN NHÉT HỘP HÀNG - ${(cardData.shopName || "SHOP").toUpperCase()} ===\nKhổ in: ${cardData.cardFormat || ""}\n\n[MẶT TRƯỚC]\nTiêu đề: ${cardData.front?.headline || ""}\nLời tựa: ${cardData.front?.subheadline || ""}\n\n[MẶT SAU]\n${cardData.back?.fullBackText || ""}\n\n[QUY CHUẨN IN]\n${cardData.printSpecs?.formatName || ""} - ${cardData.printSpecs?.dimensionsMm || ""}\n${cardData.printSpecs?.recommendedPaper || ""}\n${cardData.printSpecs?.estimatedCost || ""}`;
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeShop = (shopName || cardData.shopName || "shop").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 30);
    a.download = `thu-cam-on-${safeShop}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  const handleExportExcel = () => {
    if (!cardData) return;
    try {
      const wb = XLSX.utils.book_new();
      const notes = Array.isArray(cardData.front?.visualDesignNotes)
        ? cardData.front.visualDesignNotes.join(" | ")
        : "";

      const overviewRows = [
        ["THÔNG SỐ BẢN THIẾT KẾ THIỆP CẢM ƠN NHÉT HỘP", ""],
        ["Tên Shop / Thương hiệu", cardData.shopName || ""],
        ["Khổ thẻ in", cardData.cardFormat || ""],
        ["Tone ngôn từ", cardData.cardTone || ""],
        ["Mục tiêu ưu tiên", cardData.primaryGoal || ""],
        ["", ""],
        ["--- NỘI DUNG MẶT TRƯỚC ---", ""],
        ["Tiêu đề đập vào mắt", cardData.front?.headline || ""],
        ["Lời tựa mở đầu", cardData.front?.subheadline || ""],
        ["Huy hiệu nhận diện", displayBadge],
        ["Gợi ý thiết kế", notes],
        ["Lời dẫn lật mặt sau", cardData.front?.openHook || ""],
        ["", ""],
        ["--- NỘI DUNG MẶT SAU ---", ""],
        ["Tâm thư tri ân", cardData.back?.heartfeltLetter || ""],
        ["Khiên chắn 1 sao (Tiêu đề)", cardData.back?.anti1StarShield?.heading || ""],
        ["Khiên chắn 1 sao (Nội dung)", cardData.back?.anti1StarShield?.message || ""],
        ["Kênh hỗ trợ khẩn cấp", cardData.back?.anti1StarShield?.supportCta || ""],
        ["Nam châm review 5 sao (Tiêu đề)", cardData.back?.reviewMagnet?.heading || ""],
        ["Quà tặng / Voucher review", cardData.back?.reviewMagnet?.incentive || ""],
        ["Lời kêu gọi quay clip/ảnh", cardData.back?.reviewMagnet?.instruction || ""],
        ["Mục đích quét mã QR", cardData.back?.safeQrPortal?.purpose || ""],
        ["Lời dẫn quét QR an toàn", cardData.back?.safeQrPortal?.safeNotice || ""],
        ["Toàn bộ văn bản mặt sau", cardData.back?.fullBackText || ""],
        ["", ""],
        ["--- THÔNG SỐ XƯỞNG IN ---", ""],
        ["Quy cách kích thước", cardData.printSpecs?.dimensionsMm || ""],
        ["Lưu ý tràn lề", cardData.printSpecs?.bleedNote || ""],
        ["Chất liệu giấy đề xuất", cardData.printSpecs?.recommendedPaper || ""],
        ["Hệ màu in", cardData.printSpecs?.colorMode || ""],
        ["Dự toán chi phí", cardData.printSpecs?.estimatedCost || ""],
        ["Mẹo đóng gói unboxing", cardData.printSpecs?.proPackagingTip || ""],
      ];

      const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
      wsOverview["!cols"] = [{ wch: 28 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsOverview, "Thiết Kế Thiệp");

      const adviceList = Array.isArray(cardData.marketingAdvice) ? cardData.marketingAdvice : [];
      const adviceRows = [
        ["STT", "CHIẾN LƯỢC RETENTION & TỐI ƯU TRẢI NGHIỆM KHÁCH HÀNG"],
        ...adviceList.map((adv, idx) => [idx + 1, adv]),
      ];
      const wsAdvice = XLSX.utils.aoa_to_sheet(adviceRows);
      wsAdvice["!cols"] = [{ wch: 8 }, { wch: 90 }];
      XLSX.utils.book_append_sheet(wb, wsAdvice, "Lời Khuyên Marketing");

      const safeName = (shopName || cardData.shopName || "shop")
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF_-]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 30);
      const fileName = `unboxing-card-${safeName || "shop"}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã xuất tệp Excel thành công!");
    } catch (err) {
      console.error("excel_export_error", err);
      showToast("Lỗi khi tạo file Excel!");
    }
  };

  const formatBadgeText =
    cardFormat === "mini_card"
      ? "Card Mini 9x5.4cm"
      : cardFormat === "voucher_tag"
        ? "Tag Treo 6x10cm"
        : "Bưu Thiếp A6 10x15cm";

  return (
    <div
      className={`bg-black text-white rounded-2xl border border-zinc-800/90 shadow-2xl flex flex-col w-full lg:min-h-0 lg:h-full relative overflow-visible lg:overflow-hidden transition-all ${
        isFullScreen ? "fixed inset-2 sm:inset-4 z-50 rounded-2xl shadow-2xl bg-black overflow-y-auto" : "h-auto lg:h-full"
      }`}
    >
      {/* Toast Notification Minimalist */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <Check size={13} className="text-white stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Toolbar Tối Giản (Chữ trắng nền đen, 1 hàng ngang duy nhất) */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-zinc-800 bg-black flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-20 flex-nowrap sticky top-0 rounded-t-2xl">
        {/* Bên trái: Tiêu đề & Badges */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
            <HeartHandshake size={14} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase truncate">
            Thư Cảm Ơn Nhét Hộp
          </h2>

          {isOfflineMode && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              Offline Mode
            </span>
          )}
        </div>

        {/* Bên phải: Nút thao tác (Cân đối & Tối ưu mobile) */}
        {cardData && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chuyển chế độ: Mô phỏng vs Văn bản */}
            <div className="bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                title="Mô phỏng trực quan"
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "card"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                  }`}
              >
                <LayoutList size={12} />
                <span className="hidden sm:inline">Mô phỏng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Văn bản / JSON thuần"
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "raw"
                    ? "bg-white text-black font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                  }`}
              >
                <FileText size={12} />
                <span className="hidden sm:inline">Văn bản</span>
              </button>
            </div>

            {/* Xuất Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất file Excel (.xlsx)"
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <FileSpreadsheet size={13} />
            </button>

            {/* Tải tệp .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp .txt"
              className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Download size={13} />
            </button>

            {/* Toàn màn hình */}
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? "Thu nhỏ (Esc)" : "Toàn màn hình"}
              className="hidden sm:flex w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {isFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Sao chép toàn bộ */}
            <button
              type="button"
              onClick={handleCopyAll}
              title={copiedKey === "all" ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
              className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === "all" ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
            </button>
          </div>
        )}
      </div>

      {/* Thông báo Offline Mode (nếu có) */}
      {isOfflineMode && cardData && !loading && (
        <div className="px-3 sm:px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate">
              Bản mẫu Offline Blueprint được kích hoạt để đảm bảo tiến độ in ấn của bạn.
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

      {/* 2. Sub-Tabs: Cả 2 Mặt | Mặt Trước | Mặt Sau | Thông Số In */}
      {cardData && !loading && viewMode === "card" && (
        <div className="sticky top-[49px] z-10 px-3 sm:px-4 py-2 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setCardSide("both")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${cardSide === "both"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
          >
            <Layers size={12} />
            <span>Cả 2 Mặt</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("front")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${cardSide === "front"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
          >
            <Heart size={12} />
            <span>1. Mặt Trước</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("back")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${cardSide === "back"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
          >
            <HeartHandshake size={12} />
            <span>2. Mặt Sau</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("print")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${cardSide === "print"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-800/80 font-medium"
              }`}
          >
            <Printer size={12} />
            <span>3. Mẹo In Xưởng</span>
          </button>
        </div>
      )}

      {/* 3. Vùng Nội Dung Kết Quả (Cuộn cả trang trên mobile, cuộn trong container trên desktop) */}
      <div className="w-full lg:flex-1 lg:min-h-0 p-3 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10 pb-20 lg:pb-4 bg-black">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="Đang Thiết Kế Thư Cảm Ơn Chuẩn Xưởng In..."
            stages={UNBOXING_STAGES}
            accentColor="rose"
            minHeightClass="min-h-[360px]"
          />
        ) : cardData ? (
          <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                  <span>Dữ liệu JSON / Markdown:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "raw", "Đã sao chép chuỗi thô!")}
                    title={copiedKey === "raw" ? "Đã sao chép" : "Sao chép dữ liệu thô"}
                    className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
                  >
                    {copiedKey === "raw" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[520px] bg-black border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. MẶT TRƯỚC THIỆP (CARD FRONT SIDE) */}
                {(cardSide === "both" || cardSide === "front") && (
                  <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-4 relative">
                    {/* Header Khối Mặt Trước */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <Heart size={13} className="text-white" /> 1. Mặt Trước (Bìa Thiệp - First Impression)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `[MẶT TRƯỚC THIỆP]\nHuy hiệu: ${displayBadge}\nTiêu đề: ${cardData.front?.headline || ""}\nLời tựa: ${cardData.front?.subheadline || ""}\nLời dẫn: ${cardData.front?.openHook || ""}`,
                            "front",
                            "Đã chép nội dung mặt trước!"
                          )
                        }
                        title={copiedKey === "front" ? "Đã sao chép" : "Sao chép mặt trước"}
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
                      >
                        {copiedKey === "front" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Khung mô phỏng thiệp mặt trước tối giản */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-6 sm:p-8 text-center space-y-3.5 relative shadow-inner">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase">
                        <Gift size={12} /> {displayBadge}
                      </div>

                      <h3 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight max-w-xl mx-auto">
                        {cardData.front?.headline || "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!"}
                      </h3>

                      <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto italic font-serif leading-relaxed">
                        &ldquo;{cardData.front?.subheadline || ""}&rdquo;
                      </p>

                      {cardData.front?.openHook && (
                        <div className="pt-2 text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1">
                          <span>{cardData.front.openHook}</span>
                        </div>
                      )}

                      {/* Gợi ý xưởng in cho mặt trước */}
                      {cardData.front?.visualDesignNotes && cardData.front.visualDesignNotes.length > 0 && (
                        <div className="pt-3.5 border-t border-zinc-800/80 mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
                          <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
                            <Sparkles size={11} className="text-zinc-400" /> Gợi ý xưởng in:
                          </span>
                          {cardData.front.visualDesignNotes.map((note, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] text-zinc-400 bg-zinc-900/90 px-2.5 py-0.5 rounded border border-zinc-800"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. MẶT SAU THIỆP (CARD BACK SIDE) */}
                {(cardSide === "both" || cardSide === "back") && (
                  <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-5 relative">
                    {/* Header Khối Mặt Sau */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <HeartHandshake size={13} className="text-white" /> 2. Mặt Sau (Tâm Thư Tri Ân & 3 Trụ Cột Chiến Lược)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(cardData.back?.fullBackText || "", "back", "Đã chép toàn bộ văn bản mặt sau!")
                        }
                        title={copiedKey === "back" ? "Đã sao chép" : "Sao chép văn bản mặt sau"}
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
                      >
                        {copiedKey === "back" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Khối Tâm Thư Tri Ân */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-2.5 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Heart size={13} className="text-zinc-400" /> Tâm Thư Tri Ân Từ Trái Tim Đội Ngũ
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(cardData.back?.heartfeltLetter || "", "letter", "Đã chép tâm thư tri ân!")
                          }
                          className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                          title="Sao chép tâm thư"
                        >
                          {copiedKey === "letter" ? (
                            <Check size={12} className="stroke-[3] text-white" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="border-l-2 border-zinc-700 pl-3.5 sm:pl-4 py-0.5">
                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-serif italic whitespace-pre-line">
                          {cardData.back?.heartfeltLetter || ""}
                        </p>
                      </div>
                    </div>

                    {/* Lưới 3 Trụ Cột Chiến Lược (Cân đối 3 cột trên desktop, xếp chồng mượt mà trên mobile) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* Trụ cột 1: Khiên Chắn 1 Sao */}
                      <div className="bg-black border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 tracking-wide uppercase">
                              <ShieldCheck size={14} className="text-zinc-300" /> Khiên Chắn 1 Sao
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${cardData.back?.anti1StarShield?.heading || ""}\n${cardData.back?.anti1StarShield?.message || ""}\n${cardData.back?.anti1StarShield?.supportCta || ""}`,
                                  "shield",
                                  "Đã chép khiên chắn 1 sao!"
                                )
                              }
                              className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                              title="Sao chép khối khiên chắn"
                            >
                              {copiedKey === "shield" ? <Check size={11} className="stroke-[3] text-white" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {cardData.back?.anti1StarShield?.heading || "ĐỪNG VỘI ĐÁNH GIÁ 1 SAO BẠN NHÉ!"}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {cardData.back?.anti1StarShield?.message || ""}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                          💬 {cardData.back?.anti1StarShield?.supportCta || "Hỗ trợ 24h qua khung chat"}
                        </div>
                      </div>

                      {/* Trụ cột 2: Nam Châm Review 5 Sao */}
                      <div className="bg-black border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 tracking-wide uppercase">
                              <Star size={14} className="text-zinc-300" /> Nam Châm 5 Sao
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${cardData.back?.reviewMagnet?.heading || ""}\n${cardData.back?.reviewMagnet?.instruction || ""}\nƯu đãi: ${cardData.back?.reviewMagnet?.incentive || ""}`,
                                  "star",
                                  "Đã chép quà kéo review!"
                                )
                              }
                              className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                              title="Sao chép khối nam châm"
                            >
                              {copiedKey === "star" ? <Check size={11} className="stroke-[3] text-white" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {cardData.back?.reviewMagnet?.heading || "CHỤP ẢNH XINH - NHẬN VOUCHER LIỀN TAY"}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {cardData.back?.reviewMagnet?.instruction || ""}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-300 font-semibold bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-1.5">
                          <Gift size={12} className="shrink-0 text-zinc-400" />
                          <span className="truncate">{cardData.back?.reviewMagnet?.incentive || "Voucher ưu đãi đơn sau"}</span>
                        </div>
                      </div>

                      {/* Trụ cột 3: Cổng QR Bảo Hành An Toàn */}
                      <div className="bg-black border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 tracking-wide uppercase">
                              <QrCode size={14} className="text-zinc-300" /> Cổng QR An Toàn
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${cardData.back?.safeQrPortal?.qrCaption || ""}\n${cardData.back?.safeQrPortal?.safeNotice || ""}`,
                                  "qr",
                                  "Đã chép cổng QR an toàn!"
                                )
                              }
                              className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                              title="Sao chép khối QR"
                            >
                              {copiedKey === "qr" ? <Check size={11} className="stroke-[3] text-white" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {cardData.back?.safeQrPortal?.purpose || "Kích hoạt bảo hành điện tử chính hãng"}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {cardData.back?.safeQrPortal?.safeNotice || ""}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-300 font-mono text-center bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                          {cardData.back?.safeQrPortal?.qrCaption || "[QUÉT MÃ QR TẠI ĐÂY]"}
                        </div>
                      </div>
                    </div>

                    {/* Mẹo sử dụng / bảo quản nhanh */}
                    {cardData.back.usageTips && cardData.back.usageTips.length > 0 && (
                      <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 text-xs space-y-1.5">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                          <CheckCircle2 size={13} className="text-zinc-400" /> Mẹo vặt in chân thiệp:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-xs">
                          {cardData.back.usageTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Văn bản mặt sau sẵn sàng copy */}
                    <div className="bg-black border border-zinc-800 rounded-xl p-3.5 sm:p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                        <span>Toàn văn mặt sau (Sẵn sàng copy vào thiết kế):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cardData.back.fullBackText, "fullBack", "Đã sao chép toàn bộ!")}
                          title={copiedKey === "fullBack" ? "Đã sao chép" : "Sao chép toàn bộ văn bản mặt sau"}
                          className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
                        >
                          {copiedKey === "fullBack" ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-mono">
                        {cardData.back.fullBackText}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. QUY CHUẨN XƯỞNG IN (PRINT SPECS) */}
                {(cardSide === "both" || cardSide === "print") && (
                  <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-4">
                    {/* Header Khối Quy Chuẩn In */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0">
                          <Printer size={12} />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase">
                          3. Bảng Quy Chuẩn Kỹ Thuật Xưởng In (Offset Việt Nam)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `Quy cách: ${cardData.printSpecs.dimensionsMm}\nTràn lề: ${cardData.printSpecs.bleedNote}\nGiấy: ${cardData.printSpecs.recommendedPaper}\nHệ màu: ${cardData.printSpecs.colorMode}\nChi phí: ${cardData.printSpecs.estimatedCost}\nMẹo: ${cardData.printSpecs.proPackagingTip}`,
                            "print",
                            "Đã chép thông số xưởng in!"
                          )
                        }
                        title={copiedKey === "print" ? "Đã sao chép" : "Sao chép thông số in"}
                        className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
                      >
                        {copiedKey === "print" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Lưới 4 ô thông số in cân đối */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kích Thước Cắt</div>
                        <div className="text-xs font-bold text-white">
                          {cardData.printSpecs.dimensionsMm}
                        </div>
                        <div className="text-[11px] text-zinc-400">{cardData.printSpecs.bleedNote}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Chất Liệu Giấy</div>
                        <div className="text-xs font-bold text-white">
                          {cardData.printSpecs.recommendedPaper}
                        </div>
                        <div className="text-[11px] text-zinc-400">{cardData.printSpecs.colorMode}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dự Toán Chi Phí</div>
                        <div className="text-xs font-bold text-white">
                          {cardData.printSpecs.estimatedCost}
                        </div>
                        <div className="text-[11px] text-zinc-400">Ghép bài Offset 1.000 tấm</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Trải Nghiệm Unboxing</div>
                        <div className="text-[11px] text-zinc-300 leading-snug">
                          {cardData.printSpecs.proPackagingTip}
                        </div>
                      </div>
                    </div>

                    {/* Lời khuyên Retention & Marketing */}
                    {cardData.marketingAdvice && cardData.marketingAdvice.length > 0 && (
                      <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                          <Lightbulb size={13} className="text-zinc-400" /> Lời Khuyên Thực Chiến Tăng LTV & Hạn Chế Hoàn Hàng:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {cardData.marketingAdvice.map((adv, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 leading-relaxed"
                            >
                              <span className="font-bold text-white mr-1.5">#{idx + 1}</span>
                              {adv}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State Tối Giản (Chữ trắng nền đen) */
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xl">
              <HeartHandshake size={28} className="text-white" />
            </div>
            <div className="max-w-md space-y-1.5">
              <p className="font-bold text-white text-sm sm:text-base">
                Chưa Có Bản Thiết Kế Thiệp
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Điền thông tin shop bên trái và bấm &ldquo;Tạo Thư Cảm Ơn Nhét Hộp Ngay&rdquo; hoặc bấm &ldquo;Dữ Liệu Mẫu&rdquo; để xem bản thiết kế 2 mặt hoàn chỉnh chuẩn xưởng in.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <Sparkles size={13} /> Nạp Dữ Liệu Mẫu Ngay
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnboxingCardOutput;
