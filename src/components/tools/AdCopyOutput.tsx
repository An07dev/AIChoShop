"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Flame,
  Search,
  Video,
  FileText,
  Tag,
  ShoppingBag,
  ShieldCheck,
  Layers,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import {
  parseAdCopyResult,
  formatShopeeBulkKeywords,
  adCopyToText,
  type AdCopyData,
  type AdPlatform,
  type ShopeeKeywordItem,
} from "@/lib/ad-copy/contract";

interface AdCopyOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  platform?: string;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
}

export function AdCopyOutput({
  result,
  loading,
  productName,
  platform = "both",
  elapsedSeconds,
  onCancel,
  onUseSample,
}: AdCopyOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeFilter, setActiveFilter] = useState<"all" | "shopee" | "tiktok" | "negative">("all");

  // Parser 4 tầng bền bỉ
  const data: AdCopyData | null = useMemo(() => {
    if (!result) return null;
    return parseAdCopyResult(result, (platform as AdPlatform) || "both");
  }, [result, platform]);

  // Chuẩn hóa dữ liệu sang văn bản text thô (Markdown) thay vì hiển thị cú pháp JSON
  const formattedRawText = useMemo(() => {
    return data ? adCopyToText(data, productName) : (result || "");
  }, [data, productName, result]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!formattedRawText) return;
    handleCopy(formattedRawText, "all");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    if (!formattedRawText) return;
    const blob = new Blob([formattedRawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mau-quang-cao-${productName ? productName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30) : "ads"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shopeeAds = data?.shopeeAds;
  const tiktokAds = data?.tiktokAds;
  const policy = data?.policyCompliance;

  const totalShopeeKws = shopeeAds
    ? shopeeAds.keywordMatrix.exactMatch.length +
    shopeeAds.keywordMatrix.broadMatch.length +
    shopeeAds.keywordMatrix.misspelledOrNiche.length
    : 0;

  const allShopeeKwsList: ShopeeKeywordItem[] = useMemo(() => {
    if (!shopeeAds) return [];
    return [
      ...shopeeAds.keywordMatrix.exactMatch,
      ...shopeeAds.keywordMatrix.broadMatch,
      ...shopeeAds.keywordMatrix.misspelledOrNiche,
    ];
  }, [shopeeAds]);

  const headlinesCount = shopeeAds ? shopeeAds.headlines.length : 0;
  const hooksCount = tiktokAds ? tiktokAds.hooks.length : 0;
  const captionsCount = tiktokAds ? tiktokAds.captions.length : 0;
  const negativeCount = shopeeAds ? shopeeAds.keywordMatrix.negativeKeywords.length : 0;

  const wordCount = formattedRawText ? formattedRawText.trim().split(/\s+/).length : 0;
  const charCountVal = formattedRawText ? formattedRawText.length : 0;

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800 text-white">
      {/* Header thanh công cụ (Sticky) - Đơn giản, Chữ trắng nền đen, Cực kỳ gọn gàng trên Mobile */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-col gap-1.5 shrink-0">
        {/* Hàng 1: Tiêu đề + Nút thao tác (Copy, TXT, Thẻ/Gốc) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề + Badge nền tảng */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <Flame size={13} className="text-orange-400 sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase truncate whitespace-nowrap">
              <span className="hidden sm:inline">Mẫu Quảng Cáo Sàn</span>
              <span className="sm:hidden">Mẫu Ads</span>
            </h2>
            <span className="text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0 truncate max-w-[85px] sm:max-w-none">
              {platform === "shopee" ? "Shopee" : platform === "tiktok" ? "TikTok" : "Shopee & TT"}
            </span>
          </div>

          {/* Phải: Các nút thao tác (Icon-only trên Mobile, Đầy đủ trên Desktop) */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Tất Cả: Icon tinh gọn */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ nội dung" : "Sao chép toàn bộ nội dung"}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-slate-200"
                  }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              {/* Nút Tải TXT */}
              <button
                type="button"
                onClick={handleDownload}
                title="Tải về file TXT"
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Download size={13} />
                <span className="hidden sm:inline">TXT</span>
              </button>

              {/* Chuyển đổi Xem: Thẻ / Gốc */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 shrink-0">
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
                  Gốc
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc Danh Mục - Cuộn ngang mượt mà, cân đối */}
        {result && !loading && viewMode === "visual" && data && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${activeFilter === "all"
                  ? "bg-white text-black font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
            >
              Tất Cả
            </button>
            {shopeeAds && (
              <button
                type="button"
                onClick={() => setActiveFilter("shopee")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "shopee"
                    ? "bg-white text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>Shopee Ads</span>
                {totalShopeeKws > 0 && (
                  <span className={`text-[10px] px-1 rounded font-mono ${activeFilter === "shopee" ? "bg-black/20 text-black font-bold" : "bg-black/50 text-slate-300"
                    }`}>
                    {totalShopeeKws}
                  </span>
                )}
              </button>
            )}
            {tiktokAds && (
              <button
                type="button"
                onClick={() => setActiveFilter("tiktok")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "tiktok"
                    ? "bg-white text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>TikTok Ads</span>
                {hooksCount > 0 && (
                  <span className={`text-[10px] px-1 rounded font-mono ${activeFilter === "tiktok" ? "bg-black/20 text-black font-bold" : "bg-black/50 text-slate-300"
                    }`}>
                    {hooksCount}
                  </span>
                )}
              </button>
            )}
            {negativeCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("negative")}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${activeFilter === "negative"
                    ? "bg-white text-black font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
              >
                <span>Từ Phủ Định</span>
                <span className={`text-[10px] px-1 rounded font-mono ${activeFilter === "negative" ? "bg-black/20 text-black font-bold" : "bg-black/50 text-slate-300"
                  }`}>
                  {negativeCount}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vùng nội dung chính: Chữ trắng nền đen, không màu mè */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                <Sparkles size={22} className="animate-spin duration-1000" />
              </div>
              {typeof elapsedSeconds === "number" && (
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono text-emerald-300">
                  {elapsedSeconds}s
                </div>
              )}
            </div>

            <div className="space-y-1.5 max-w-sm">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Soạn Mẫu Quảng Cáo Chuyển Đổi...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                {typeof elapsedSeconds === "number" && elapsedSeconds < 8
                  ? "⚡ Đang phân tích sản phẩm, chân dung khách hàng & góc chuyển đổi..."
                  : typeof elapsedSeconds === "number" && elapsedSeconds < 20
                  ? "🎯 Đang trích xuất ma trận từ khóa Shopee Ads (chính xác, mở rộng, phủ định)..."
                  : typeof elapsedSeconds === "number" && elapsedSeconds < 35
                  ? "🎬 Đang lên kịch bản TikTok Spark Ads (Hook 3s, visual action, voiceover)..."
                  : "🛡️ Đang rà soát từ cấm & kiểm tra an toàn chính sách quảng cáo sàn..."}
              </p>
            </div>

            {/* Thanh tiến trình thời gian tạo mẫu quảng cáo */}
            <div className="w-full max-w-xs bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(95, Math.max(5, ((elapsedSeconds || 1) / 45) * 100))}%`,
                }}
              />
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                <span>Hủy yêu cầu</span>
              </button>
            )}
          </div>
        ) : result && data ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={formattedRawText}
                className="w-full h-full min-h-[420px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden select-all"
              />
            ) : (
              <div className="space-y-4">
                {/* ═══════════════════════════════════════════════════════ */}
                {/* 1. SHOPEE ADS: MA TRẬN TỪ KHÓA & GIÁ THẦU               */}
                {/* ═══════════════════════════════════════════════════════ */}
                {shopeeAds && (activeFilter === "all" || activeFilter === "shopee") && (
                  <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                    {/* Header + Nút chép hàng loạt */}
                    <div className="flex items-start sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug">
                        1. Từ Khóa Đấu Thầu Shopee ({totalShopeeKws})
                      </h3>

                      {allShopeeKwsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(formatShopeeBulkKeywords(allShopeeKwsList), "shopee-bulk-kws")
                          }
                          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title={`Sao chép toàn bộ ${totalShopeeKws} từ khóa`}
                        >
                          {copiedKey === "shopee-bulk-kws" ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Hộp gợi ý Giá Thầu & Giờ Vàng (Hiển thị FULL text 100%, không bị cắt chữ) */}
                    {shopeeAds.biddingStrategy && (
                      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2.5">
                        {/* Thầu test */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <span>💡</span>
                            <span>Giá thầu khởi điểm đề xuất:</span>
                          </div>
                          <p className="text-xs font-semibold text-white leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                            {shopeeAds.biddingStrategy.recommendedInitialBid}
                          </p>
                        </div>

                        {/* Giờ vàng */}
                        {shopeeAds.biddingStrategy.peakHourMultiplier && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <span>⏰</span>
                              <span>Tăng thầu khung giờ vàng &amp; Siêu Sale:</span>
                            </div>
                            <p className="text-xs font-semibold text-white leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                              {shopeeAds.biddingStrategy.peakHourMultiplier}
                            </p>
                          </div>
                        )}

                        {/* Mẹo tối ưu */}
                        {shopeeAds.biddingStrategy.optimizationTip && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <span>🎯</span>
                              <span>Mẹo tối ưu hiệu quả:</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pl-2.5 border-l-2 border-slate-800 select-text">
                              {shopeeAds.biddingStrategy.optimizationTip}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Danh sách 3 Nhóm Từ Khóa */}
                    <div className="space-y-3">
                      {/* Nhóm 1: Chính xác */}
                      {shopeeAds.keywordMatrix.exactMatch.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-white">
                                • Chính Xác (Exact Match)
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({shopeeAds.keywordMatrix.exactMatch.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(formatShopeeBulkKeywords(shopeeAds.keywordMatrix.exactMatch), "exact-kws")
                              }
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0 active:scale-90"
                              title="Sao chép nhóm Chính Xác"
                            >
                              {copiedKey === "exact-kws" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {shopeeAds.keywordMatrix.exactMatch.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-colors"
                              >
                                <span className="text-xs text-white font-medium select-text leading-snug">{item.keyword}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800/70">
                                    {item.suggestedBid}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.keyword, `exact-${idx}`)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
                                    title="Sao chép từ khóa"
                                  >
                                    {copiedKey === `exact-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nhóm 2: Mở rộng */}
                      {shopeeAds.keywordMatrix.broadMatch.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-white">
                                • Mở Rộng (Broad Match)
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({shopeeAds.keywordMatrix.broadMatch.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(formatShopeeBulkKeywords(shopeeAds.keywordMatrix.broadMatch), "broad-kws")
                              }
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0 active:scale-90"
                              title="Sao chép nhóm Mở Rộng"
                            >
                              {copiedKey === "broad-kws" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {shopeeAds.keywordMatrix.broadMatch.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-colors"
                              >
                                <span className="text-xs text-white font-medium select-text leading-snug">{item.keyword}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800/70">
                                    {item.suggestedBid}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.keyword, `broad-${idx}`)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
                                    title="Sao chép từ khóa"
                                  >
                                    {copiedKey === `broad-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nhóm 3: Lỗi gõ / ngách */}
                      {shopeeAds.keywordMatrix.misspelledOrNiche.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-white">
                                • Ngách &amp; Lỗi Gõ Phổ Biến
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({shopeeAds.keywordMatrix.misspelledOrNiche.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(formatShopeeBulkKeywords(shopeeAds.keywordMatrix.misspelledOrNiche), "niche-kws")
                              }
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0 active:scale-90"
                              title="Sao chép nhóm Ngách & Lỗi Gõ"
                            >
                              {copiedKey === "niche-kws" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {shopeeAds.keywordMatrix.misspelledOrNiche.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 rounded-lg px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 transition-colors"
                              >
                                <span className="text-xs text-white font-medium select-text leading-snug">{item.keyword}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800/70">
                                    {item.suggestedBid}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.keyword, `niche-${idx}`)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-transform"
                                    title="Sao chép từ khóa"
                                  >
                                    {copiedKey === `niche-${idx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 2. 3 MẪU TIÊU ĐỀ QUẢNG CÁO CTR (≤ 55 KÝ TỰ)             */}
                {/* ═══════════════════════════════════════════════════════ */}
                {shopeeAds && shopeeAds.headlines.length > 0 && (activeFilter === "all" || activeFilter === "shopee") && (
                  <div className="space-y-2.5 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                        2. Tiêu Đề Quảng Cáo CTR (≤ 55 ký tự)
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(shopeeAds.headlines.map((h) => h.headline).join("\n"), "all-headlines")
                        }
                        className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                        title="Sao chép toàn bộ 3 tiêu đề"
                      >
                        {copiedKey === "all-headlines" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {shopeeAds.headlines.map((hl) => {
                        const isCopiedHl = copiedKey === `hl-${hl.id}`;
                        const isSafe = hl.charCount <= 55;

                        return (
                          <div
                            key={hl.id}
                            className="bg-slate-900 rounded-lg p-2.5 sm:p-3 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-start sm:items-center justify-between gap-2 text-xs pb-1.5 border-b border-slate-800/60">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[11px] font-bold text-slate-300 leading-snug">
                                  {hl.label} · {hl.angle}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[10px] font-mono ${isSafe ? "text-slate-400" : "text-amber-400 font-bold"
                                    }`}
                                >
                                  {hl.charCount}/55 kt
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(hl.headline, `hl-${hl.id}`)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                                  title="Sao chép tiêu đề"
                                >
                                  {isCopiedHl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed select-text">
                              {hl.headline}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 3. TỪ KHÓA PHỦ ĐỊNH (CHỐNG CLICK TẶC)                   */}
                {/* ═══════════════════════════════════════════════════════ */}
                {shopeeAds &&
                  shopeeAds.keywordMatrix.negativeKeywords.length > 0 &&
                  (activeFilter === "all" || activeFilter === "negative" || activeFilter === "shopee") && (
                    <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 gap-2">
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                            3. Từ Khóa Phủ Định - Chặn Click Tặc ({negativeCount})
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Chặn trên Shopee Ads để không tốn tiền khi khách gõ tìm thanh lý, đồ cũ, hàng nhái...
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(shopeeAds.keywordMatrix.negativeKeywords.join("\n"), "all-negatives")
                          }
                          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title="Sao chép danh sách từ khóa phủ định"
                        >
                          {copiedKey === "all-negatives" ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {shopeeAds.keywordMatrix.negativeKeywords.map((neg, nIdx) => {
                          const isCopiedNeg = copiedKey === `neg-${nIdx}`;
                          return (
                            <button
                              key={nIdx}
                              type="button"
                              onClick={() => handleCopy(neg, `neg-${nIdx}`)}
                              className={`text-xs px-2.5 py-1 rounded border transition-all flex items-center gap-1 cursor-pointer ${isCopiedNeg
                                ? "bg-white text-black font-bold border-white"
                                : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                                }`}
                            >
                              <span className="text-slate-500 font-bold">✕</span>
                              <span>{neg}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 4. 5 CÂU HOOK 3 GIÂY ĐẦU VIDEO (TIKTOK SPARK ADS)        */}
                {/* ═══════════════════════════════════════════════════════ */}
                {tiktokAds && tiktokAds.hooks.length > 0 && (activeFilter === "all" || activeFilter === "tiktok") && (
                  <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                        4. 5 Câu Hook 3 Giây Đầu Video (TikTok Ads)
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            tiktokAds.hooks
                              .map(
                                (hk) =>
                                  `Hook #${hk.id} (${hk.angle}):\n- Thị giác: ${hk.visualAction}\n- Text đè: "${hk.textOverlay}"\n- Lời thoại: "${hk.audioVoiceover}"`
                              )
                              .join("\n\n"),
                            "all-hooks"
                          )
                        }
                        className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                        title="Sao chép toàn bộ 5 câu Hook"
                      >
                        {copiedKey === "all-hooks" ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {tiktokAds.hooks.map((hk) => {
                        const isCopiedHk = copiedKey === `hk-${hk.id}`;

                        return (
                          <div
                            key={hk.id}
                            className="bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                          >
                            {/* Card Header: STT + Góc tiếp cận + Nút sao chép */}
                            <div className="flex items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {hk.id}
                                </span>
                                <span className="font-bold text-xs text-white leading-snug">
                                  {hk.angle}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    `Hook #${hk.id} (${hk.angle}):\n- Thị giác 3s: ${hk.visualAction}\n- Text đè video: "${hk.textOverlay}"\n- Lời thoại: "${hk.audioVoiceover}"`,
                                    `hk-${hk.id}`
                                  )
                                }
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                                title="Sao chép Hook này"
                              >
                                {isCopiedHk ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>

                            {/* Khối 1: Kịch bản hình ảnh 3s đầu (Xuống dòng riêng biệt để text trải dài 100% cân đối) */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                <span>🎬</span>
                                <span>Kịch bản hình ảnh 3s đầu:</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text">
                                {hk.visualAction}
                              </p>
                            </div>

                            {/* Khối 2: Chữ đè video (Text Overlay) & Lời thoại đọc */}
                            <div className="space-y-2 pt-1 border-t border-slate-800/60">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                  <span>💬</span>
                                  <span>Chữ đè video (Text Overlay):</span>
                                </div>
                                <p className="text-xs font-bold text-white leading-relaxed pl-2.5 border-l-2 border-white select-text">
                                  &ldquo;{hk.textOverlay}&rdquo;
                                </p>
                              </div>

                              {hk.audioVoiceover && hk.audioVoiceover !== hk.textOverlay && (
                                <div className="space-y-1 pt-0.5">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                    <span>🎙️</span>
                                    <span>Lời thoại lồng tiếng (Voiceover):</span>
                                  </div>
                                  <p className="text-xs text-slate-300 italic leading-relaxed pl-2.5 border-l-2 border-slate-800 select-text">
                                    &ldquo;{hk.audioVoiceover}&rdquo;
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 5. CAPTION & HASHTAGS (TIKTOK ADS)                       */}
                {/* ═══════════════════════════════════════════════════════ */}
                {tiktokAds && (tiktokAds.captions.length > 0 || tiktokAds.hashtags.length > 0) && (activeFilter === "all" || activeFilter === "tiktok") && (
                  <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                        5. 5 Mẫu Caption Kèm CTA Giỏ Hàng &amp; Hashtags
                      </h3>
                      {tiktokAds.captions.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              tiktokAds.captions
                                .map((c) => `[${c.title} - ${c.angle || "CTA"}]\n${c.caption}\n👉 CTA Giỏ Hàng: ${c.ctaBadge}`)
                                .join("\n\n"),
                              "all-captions"
                            )
                          }
                          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title="Sao chép toàn bộ Caption"
                        >
                          {copiedKey === "all-captions" ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Captions */}
                    {tiktokAds.captions.map((cap) => {
                      const isCopiedCap = copiedKey === `cap-${cap.id}`;
                      return (
                        <div
                          key={cap.id}
                          className="bg-slate-900 rounded-xl p-3 sm:p-3.5 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start sm:items-center justify-between gap-2 text-xs pb-1.5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                {cap.id}
                              </span>
                              <span className="font-bold text-slate-200 leading-snug">
                                {cap.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(`${cap.caption}\n\n👉 CTA Giỏ Hàng: ${cap.ctaBadge}`, `cap-${cap.id}`)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                              title="Sao chép Caption này"
                            >
                              {isCopiedCap ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>

                          <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed select-text">
                            {cap.caption}
                          </div>

                          {cap.ctaBadge && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/70">
                              <span className="text-slate-500 font-medium">👉 CTA Giỏ Hàng:</span>
                              <span className="text-slate-200 font-semibold">{cap.ctaBadge}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Hashtags */}
                    {tiktokAds.hashtags.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Bộ Hashtag chuẩn tệp:</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tiktokAds.hashtags.join(" "), "all-hashtags")}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                            title="Sao chép tất cả hashtag"
                          >
                            {copiedKey === "all-hashtags" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tiktokAds.hashtags.map((tag, tIdx) => {
                            const isCopiedTag = copiedKey === `tag-${tIdx}`;
                            return (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={() => handleCopy(tag, `tag-${tIdx}`)}
                                className={`text-xs px-2 py-0.5 rounded border transition-all cursor-pointer ${isCopiedTag
                                  ? "bg-white text-black font-bold border-white"
                                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                                  }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* 6. KIỂM ĐỊNH AN TOÀN CHÍNH SÁCH SÀN                      */}
                {/* ═══════════════════════════════════════════════════════ */}
                {policy && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-semibold flex items-center gap-1.5 text-white">
                        <ShieldCheck size={14} className="text-emerald-400" /> An Toàn Chính Sách Sàn
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{policy.safeScore}/100</span>
                    </div>
                    {policy.bannedWordsAvoided && policy.bannedWordsAvoided.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        Đã loại trừ từ cấm: {policy.bannedWordsAvoided.map((w) => `"${w}"`).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <FileText size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs sm:text-sm text-slate-300">Chưa có kết quả quảng cáo</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Điền thông tin và bấm &quot;Tạo Mẫu Quảng Cáo Chuyển Đổi&quot; để AI xử lý.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={12} />
                Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer metadata - Gọn gàng */}
      {result && !loading && (
        <div className="px-3.5 sm:px-4 py-2 border-t border-slate-800 bg-black flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>Số từ: <strong className="text-slate-300 font-mono">{wordCount}</strong></span>
            <span>Số ký tự: <strong className="text-slate-300 font-mono">{charCountVal}</strong></span>
          </div>
          <span className="text-emerald-400 font-medium">✓ Sẵn sàng chạy Ads</span>
        </div>
      )}
    </div>
  );
}
