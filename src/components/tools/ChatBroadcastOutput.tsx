"use client";

import { useState, useMemo } from "react";
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
  Send,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  Gift,
  ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface ChatBroadcastOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  channel?: string;
  scenario?: string;
  onUseSample?: () => void;
}

export interface MessageItem {
  id: string;
  channel: "shopee" | "zalo";
  rawTitle: string;
  sampleNumber: string;
  angle: string;
  content: string;
  charCount: number;
  wordCount: number;
}

export function parseChatBroadcast(text: string): {
  shopee: MessageItem[];
  zalo: MessageItem[];
  advice: string;
  adviceBullets: string[];
  raw: string;
} {
  if (!text) {
    return { shopee: [], zalo: [], advice: "", adviceBullets: [], raw: "" };
  }

  const lines = text.split("\n");

  const findHeaderLineIdx = (keywords: string[]) => {
    let charOffset = 0;
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("#")) {
        for (const kw of keywords) {
          if (trimmed.includes(kw.toLowerCase())) {
            return charOffset;
          }
        }
      }
      charOffset += line.length + 1;
    }
    return -1;
  };

  const shopeeIdx = findHeaderLineIdx(["shopee chat broadcast", "kịch bản shopee", "shopee"]);
  const zaloIdx = findHeaderLineIdx(["zalo oa", "kịch bản zalo", "zalo cá nhân", "zalo"]);
  const adviceIdx = findHeaderLineIdx(["lời khuyên", "khung giờ vàng", "lưu ý", "chuyên gia"]);

  const sections = [
    { type: "shopee", idx: shopeeIdx },
    { type: "zalo", idx: zaloIdx },
    { type: "advice", idx: adviceIdx },
  ]
    .filter((s) => s.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  let shopeeRaw = "";
  let zaloRaw = "";
  let adviceRaw = "";

  for (let i = 0; i < sections.length; i++) {
    const cur = sections[i];
    const nextIdx = i < sections.length - 1 ? sections[i + 1].idx : text.length;
    const content = text.slice(cur.idx, nextIdx).trim();
    if (cur.type === "shopee") shopeeRaw = content;
    if (cur.type === "zalo") zaloRaw = content;
    if (cur.type === "advice") adviceRaw = content;
  }

  const parseVariants = (raw: string, channelType: "shopee" | "zalo"): MessageItem[] => {
    if (!raw) return [];

    const withoutHeader = raw.replace(/^##[^\n]*\n?/i, "").trim();
    const parts = withoutHeader.split(/(?=###\s+)/i);
    const items: MessageItem[] = [];
    let count = 1;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed || !trimmed.startsWith("###")) continue;

      const firstLineEnd = trimmed.indexOf("\n");
      const titleLine = firstLineEnd !== -1 ? trimmed.slice(0, firstLineEnd) : trimmed;
      const body = firstLineEnd !== -1 ? trimmed.slice(firstLineEnd).trim() : "";

      const cleanTitle = titleLine
        .replace(/^###\s*/, "")
        .replace(/[:：]\s*$/, "")
        .trim();

      const parenMatch = cleanTitle.match(/(.*?)\((.*?)\)/);
      const sampleNumber = parenMatch ? parenMatch[1].trim() : `Mẫu ${count}`;
      const angle = parenMatch
        ? parenMatch[2].trim()
        : channelType === "shopee"
        ? "Trực diện & Cấp bách"
        : "Thân tình 1:1";

      let cleanContent = body.trim();
      cleanContent = cleanContent.replace(/^\*\*/, "").replace(/\*\*$/, "").trim();
      cleanContent = cleanContent.replace(/^["'“]/, "").replace(/["'”]$/, "").trim();

      if (cleanContent) {
        items.push({
          id: `${channelType}-${count++}`,
          channel: channelType,
          rawTitle: cleanTitle,
          sampleNumber,
          angle,
          content: cleanContent,
          charCount: cleanContent.length,
          wordCount: cleanContent.split(/\s+/).filter(Boolean).length,
        });
      }
    }
    return items;
  };

  const shopee = parseVariants(shopeeRaw, "shopee");
  const zalo = parseVariants(zaloRaw, "zalo");

  // Parse advice bullets
  const adviceBullets: string[] = [];
  if (adviceRaw) {
    const adviceLines = adviceRaw.split("\n");
    for (const l of adviceLines) {
      const trimmed = l.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const bulletText = trimmed
          .replace(/^[-*]\s*/, "")
          .replace(/^\*\*/, "")
          .replace(/\*\*$/, "")
          .trim();
        if (bulletText) adviceBullets.push(bulletText);
      }
    }
  }

  return {
    shopee,
    zalo,
    advice: adviceRaw,
    adviceBullets,
    raw: text,
  };
}

export function ChatBroadcastOutput({
  result,
  loading,
  shopName,
  channel = "both",
  scenario = "loyalty_voucher",
  onUseSample,
}: ChatBroadcastOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chat" | "compact">("chat");
  const [activeTab, setActiveTab] = useState<"all" | "shopee" | "zalo" | "advice">("all");

  const parsed = useMemo(() => parseChatBroadcast(result), [result]);

  const totalVariants = parsed.shopee.length + parsed.zalo.length;

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kich-ban-broadcast-${(shopName || "shop")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const rows: any[] = [];
    let stt = 1;

    parsed.shopee.forEach((item) => {
      rows.push({
        STT: stt++,
        "Nền Tảng": "Shopee Chat Broadcast",
        "Mẫu Tin": item.sampleNumber,
        "Góc Tiếp Cận": item.angle,
        "Nội Dung Tin Nhắn": item.content,
        "Số Ký Tự": item.charCount,
        "Quy Chuẩn Sàn": item.charCount <= 350 ? "✓ Đạt chuẩn (<350)" : "⚠️ Vượt 350 ký tự",
        "Gợi Ý Gửi Tin": "Gửi vào 12h-13h hoặc 19h-20h (Kèm voucher có hạn 24h)",
      });
    });

    parsed.zalo.forEach((item) => {
      rows.push({
        STT: stt++,
        "Nền Tảng": "Zalo OA & 1:1",
        "Mẫu Tin": item.sampleNumber,
        "Góc Tiếp Cận": item.angle,
        "Nội Dung Tin Nhắn": item.content,
        "Số Ký Tự": item.charCount,
        "Quy Chuẩn Sàn": "✓ Chuẩn CSKH 1:1 Thân tình",
        "Gợi Ý Gửi Tin": "Hỏi thăm khách trước khi tặng voucher để tăng tương tác",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 10 },
      { wch: 30 },
      { wch: 75 },
      { wch: 10 },
      { wch: 22 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChatBroadcast");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `AIChoShop_Broadcast_${dateStr}.xlsx`);
  };

  const wordCount = result ? result.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = result ? result.length : 0;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ gradient */}
      <div className="absolute top-0 right-0 p-36 bg-orange-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-blue-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-orange-500/20 to-blue-500/20 text-orange-400 border border-orange-500/30">
            <MessageSquare size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Kịch Bản Chat Remarketing</h2>
          </div>
          {totalVariants > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {totalVariants} Kịch Bản
            </span>
          )}
          {shopName && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[150px] hidden sm:inline-block">
              {shopName}
            </span>
          )}
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {/* Chế độ xem */}
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/70 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("chat")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "chat"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mô phỏng Chat
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "compact"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn bản
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất kịch bản ra Excel (.xlsx)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            {/* Tải txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải file text (.txt)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={13} />
            </button>

            {/* Sao chép tất cả */}
            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                copiedAll
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check size={13} className="stroke-[3]" /> Đã Sao Chép!
                </>
              ) : (
                <>
                  <Copy size={13} /> Sao Chép Tất Cả
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Kênh (Shopee / Zalo / Tips) */}
      {result && !loading && (
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "all"
                ? "bg-slate-800 text-white border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={13} />
            <span>Tất Cả</span>
            {totalVariants > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 font-mono">
                {totalVariants}
              </span>
            )}
          </button>

          {parsed.shopee.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("shopee")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "shopee"
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-xs"
                  : "text-slate-400 hover:text-orange-400"
              }`}
            >
              <ShoppingBag size={13} className="text-orange-400" />
              <span>Shopee Broadcast</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-500/20 font-mono text-orange-300">
                {parsed.shopee.length} mẫu
              </span>
            </button>
          )}

          {parsed.zalo.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("zalo")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "zalo"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs"
                  : "text-slate-400 hover:text-blue-400"
              }`}
            >
              <MessageCircle size={13} className="text-blue-400" />
              <span>Zalo OA & 1:1</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 font-mono text-blue-300">
                {parsed.zalo.length} mẫu
              </span>
            </button>
          )}

          {parsed.advice && (
            <button
              type="button"
              onClick={() => setActiveTab("advice")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === "advice"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <Clock size={13} className="text-amber-400" />
              <span>Khung Giờ & Tips</span>
            </button>
          )}
        </div>
      )}

      {/* Vùng hiển thị nội dung: Chỉ cuộn nội bộ tại đây */}
      <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-emerald-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10">
              <Sparkles size={26} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Soạn Tin Nhắn Kéo Khách Cũ...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang xây dựng kịch bản đắc nhân tâm chuẩn Shopee &lt; 350 ký tự và Zalo OA thân tình...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Thanh tóm tắt nhanh */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Số kịch bản: <strong className="text-white font-mono">{totalVariants}</strong>
                </span>
                <span>
                  Tổng ký tự: <strong className="text-white font-mono">{charCount}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <ShieldCheck size={14} />
                <span>Né phạt thuật toán SPAM · Giữ tỷ lệ phản hồi 100%</span>
              </div>
            </div>

            {/* 1. KỊCH BẢN SHOPEE */}
            {(activeTab === "all" || activeTab === "shopee") && parsed.shopee.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <ShoppingBag size={14} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-orange-400 uppercase tracking-wider">
                      Shopee Chat Broadcast (Tối Ưu &lt; 350 Ký Tự Sàn)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    {parsed.shopee.length} Biến Thể
                  </span>
                </div>

                <div className="grid gap-4">
                  {parsed.shopee.map((item) => (
                    <ShopeeMessageCard
                      key={item.id}
                      item={item}
                      shopName={shopName}
                      viewMode={viewMode}
                      isCopied={copiedSnippet === item.id}
                      onCopy={() => handleCopyText(item.content, item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. KỊCH BẢN ZALO */}
            {(activeTab === "all" || activeTab === "zalo") && parsed.zalo.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <MessageCircle size={14} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-blue-400 uppercase tracking-wider">
                      Zalo OA & Zalo Cá Nhân (CSKH Thân Tình 1:1)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    {parsed.zalo.length} Biến Thể
                  </span>
                </div>

                <div className="grid gap-4">
                  {parsed.zalo.map((item) => (
                    <ZaloMessageCard
                      key={item.id}
                      item={item}
                      shopName={shopName}
                      viewMode={viewMode}
                      isCopied={copiedSnippet === item.id}
                      onCopy={() => handleCopyText(item.content, item.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. LỜI KHUYÊN & KHUNG GIỜ VÀNG */}
            {(activeTab === "all" || activeTab === "advice") && parsed.advice && (
              <AdviceStrategyCard
                advice={parsed.advice}
                bullets={parsed.adviceBullets}
              />
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-1 shadow-lg shadow-orange-500/10">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Chưa Có Kịch Bản Chat Remarketing
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Chọn kênh gửi, nhập tên shop và ưu đãi ở cột bên trái rồi nhấn{" "}
              <strong className="text-emerald-400">&quot;Soạn Tin Nhắn Kéo Khách Cũ&quot;</strong> để tạo ngay 6 kịch bản chuyển đổi cao.
            </p>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Chạy thử với dữ liệu mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CARD: SHOPEE MESSAGE ITEM
// ==========================================
interface MessageCardProps {
  item: MessageItem;
  shopName: string;
  viewMode: "chat" | "compact";
  isCopied: boolean;
  onCopy: () => void;
}

function ShopeeMessageCard({ item, shopName, viewMode, isCopied, onCopy }: MessageCardProps) {
  const isOver = item.charCount > 350;

  return (
    <div className="bg-slate-950/80 border border-slate-800 hover:border-orange-500/40 rounded-2xl overflow-hidden shadow-xs transition-all">
      {/* Header Thẻ */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
          <span className="text-xs font-bold text-white">{item.sampleNumber}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/30">
            {item.angle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge đếm ký tự chuẩn sàn 350 */}
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              isOver
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
            title={
              isOver
                ? "Vượt quá 350 ký tự - Tin nhắn sẽ bị Shopee ẩn nút 'Xem thêm'"
                : "Chuẩn Shopee - Hiển thị 100% trọn vẹn trên popup chat"
            }
          >
            {isOver ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
            <span>{item.charCount} / 350 ký tự</span>
            <span className="hidden sm:inline">({isOver ? "Vượt mức" : "Chuẩn sàn"})</span>
          </span>

          {/* Nút sao chép */}
          <button
            type="button"
            onClick={onCopy}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold ${
              isCopied
                ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-500/40"
            }`}
          >
            {isCopied ? (
              <>
                <Check size={12} className="stroke-[3]" /> Đã Chép!
              </>
            ) : (
              <>
                <Copy size={12} /> Sao chép
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nội dung tin nhắn */}
      {viewMode === "chat" ? (
        /* GIAO DIỆN MÔ PHỎNG SHOPEE CHAT */
        <div className="p-4 bg-slate-950/90 space-y-3">
          {/* Giả lập khung chat sàn */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md border border-orange-400/40">
              {shopName ? shopName.slice(0, 1).toUpperCase() : "S"}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {shopName || "Gian Hàng Shopee"}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[9px] font-bold">
                  OFFICIAL
                </span>
                <span className="text-[10px] text-slate-500 ml-auto">Vừa xong</span>
              </div>

              {/* Bong bóng tin nhắn Shopee */}
              <div className="rounded-2xl rounded-tl-xs p-3.5 bg-slate-900 border border-orange-500/30 text-xs text-slate-100 leading-relaxed shadow-sm space-y-2.5">
                <p className="whitespace-pre-line font-sans">{item.content}</p>

                {/* Giả lập nút hành động Shopee */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 text-[11px] font-bold border border-orange-500/40">
                    <ShoppingBag size={12} />
                    <span>[🛒 Bấm Vào Giỏ Hàng & Nhận Ưu Đãi]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GIAO DIỆN COMPACT TEXT */
        <div className="p-4 bg-slate-950/60">
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {item.content}
          </p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CARD: ZALO MESSAGE ITEM
// ==========================================
function ZaloMessageCard({ item, shopName, viewMode, isCopied, onCopy }: MessageCardProps) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl overflow-hidden shadow-xs transition-all">
      {/* Header Thẻ */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
          <span className="text-xs font-bold text-white">{item.sampleNumber}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
            {item.angle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
            {item.charCount} ký tự · {item.wordCount} từ
          </span>

          {/* Nút sao chép */}
          <button
            type="button"
            onClick={onCopy}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold ${
              isCopied
                ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-500/40"
            }`}
          >
            {isCopied ? (
              <>
                <Check size={12} className="stroke-[3]" /> Đã Chép!
              </>
            ) : (
              <>
                <Copy size={12} /> Sao chép
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nội dung tin nhắn */}
      {viewMode === "chat" ? (
        /* GIAO DIỆN MÔ PHỎNG ZALO OA CHAT */
        <div className="p-4 bg-slate-950/90 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md border border-blue-400/40">
              {shopName ? shopName.slice(0, 1).toUpperCase() : "Z"}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {shopName || "Chăm Sóc Khách Hàng"}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold">
                  ZALO OA
                </span>
                <span className="text-[10px] text-slate-500 ml-auto">Vừa xong</span>
              </div>

              {/* Bong bóng tin nhắn Zalo */}
              <div className="rounded-2xl rounded-tl-xs p-3.5 bg-slate-900 border border-blue-500/30 text-xs text-slate-100 leading-relaxed shadow-sm space-y-2.5">
                <p className="whitespace-pre-line font-sans">{item.content}</p>

                {/* Giả lập nút hành động Zalo */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/40">
                    <Gift size={12} />
                    <span>[🎁 Nhận Mã Ưu Đãi / Phản Hồi Cho Shop]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GIAO DIỆN COMPACT TEXT */
        <div className="p-4 bg-slate-950/60">
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {item.content}
          </p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CARD: LỜI KHUYÊN & CHIẾN LƯỢC GỬI TIN
// ==========================================
function AdviceStrategyCard({ advice, bullets }: { advice: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-950 p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock size={16} />
          </div>
          <span>Chiến Lược Gửi Tin & Khung Giờ Vàng Từ Chuyên Gia</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          Tối Ưu Tỷ Lệ Mở
        </span>
      </div>

      {/* 3 Thẻ Trực Quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Khung giờ vàng */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-1.5">
          <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
            <Clock size={13} />
            <span>Khung Giờ Vàng Gửi Tin</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-300">12:00 - 14:00</strong> (Nghỉ trưa, lướt điện thoại chốt đơn) và{" "}
            <strong className="text-amber-300">18:00 - 20:00</strong> (Tan làm, thư giãn ăn tối).
          </p>
        </div>

        {/* Tần suất */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-1.5">
          <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
            <ShieldCheck size={13} />
            <span>Tần Suất Gửi An Toàn</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Gửi <strong className="text-amber-300">1 - 2 lần / tuần</strong>. Tránh gửi dồn dập khiến khách bấm chặn (block) hoặc dính thuật toán SPAM sàn.
          </p>
        </div>

        {/* Mẹo tăng mở tin */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-1.5">
          <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
            <Tag size={13} />
            <span>Mẹo Chốt Đơn 24 Giờ</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Đặt mã giảm giá độc quyền ngay câu đầu tiên. Luôn kèm hạn chót 24h để tạo độ cấp bách kích thích bấm mua ngay.
          </p>
        </div>
      </div>

      {/* Chi tiết nguyên văn nếu có thêm nội dung */}
      {bullets.length > 0 ? (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          {bullets.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="text-amber-400 font-bold">•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      ) : (
        advice && (
          <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pl-1">
            {advice}
          </div>
        )
      )}
    </div>
  );
}
