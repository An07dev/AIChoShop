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
  CheckCircle2,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface AdCopyOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  platform?: string;
  onUseSample?: () => void;
}

// Cấu trúc dữ liệu phân tích
interface KeywordItem {
  keyword: string;
  bid: string;
}

interface KeywordGroup {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  intent: string;
  items: KeywordItem[];
  rawText: string;
}

interface HeadlineItem {
  id: number;
  label: string;
  angle: string;
  content: string;
  charCount: number;
}

interface HookItem {
  id: number;
  angle: string;
  content: string;
}

interface CaptionItem {
  id: number;
  title: string;
  content: string;
}

export function AdCopyOutput({
  result,
  loading,
  productName,
  platform = "both",
  onUseSample,
}: AdCopyOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeFilter, setActiveFilter] = useState<"all" | "keywords" | "headlines" | "hooks" | "captions">("all");

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    handleCopy(result, "all");
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mau-quang-cao-${productName ? productName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30) : "ads"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parser bóc tách dữ liệu có cấu trúc từ Markdown
  const parsedData = useMemo(() => {
    if (!result) return null;

    const lines = result.split("\n");

    const keywordGroups: KeywordGroup[] = [];
    const headlines: HeadlineItem[] = [];
    const hooks: HookItem[] = [];
    const captions: CaptionItem[] = [];
    const hashtags: string[] = [];

    let currentGroup: KeywordGroup | null = null;
    let inHeadlinesSection = false;
    let inHooksSection = false;
    let inCaptionsSection = false;

    // Helper tạo nhóm từ khóa
    const createGroup = (name: string, badge: string, badgeColor: string, intent: string): KeywordGroup => ({
      id: `group-${keywordGroups.length + 1}`,
      name,
      badge,
      badgeColor,
      intent,
      items: [],
      rawText: "",
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Bỏ qua dòng trống, dòng chỉ chứa ký tự bullet, hoặc dòng chữ hành động
      if (
        !line ||
        line === "•" ||
        line === "-" ||
        line === "*" ||
        line.toLowerCase().includes("chép mục này")
      ) {
        continue;
      }

      // 1. Nhận diện các Nhóm Từ Khóa
      if (/nhóm\s*1/i.test(line) && /chính xác|exact/i.test(line)) {
        inHeadlinesSection = false;
        inHooksSection = false;
        inCaptionsSection = false;
        currentGroup = createGroup(
          "Nhóm 1: Từ Khóa Chính Xác (Exact Match)",
          "High Intent",
          "bg-rose-500/20 text-rose-300 border-rose-500/40",
          "Ý định mua cao nhất - Tỷ lệ chuyển đổi tốt nhất"
        );
        keywordGroups.push(currentGroup);
        continue;
      }

      if (/nhóm\s*2/i.test(line) && /mở rộng|broad/i.test(line)) {
        inHeadlinesSection = false;
        inHooksSection = false;
        inCaptionsSection = false;
        currentGroup = createGroup(
          "Nhóm 2: Từ Khóa Mở Rộng (Broad Match)",
          "Traffic Rẻ",
          "bg-blue-500/20 text-blue-300 border-blue-500/40",
          "Gom lượt tìm kiếm bao quát với chi phí thầu thấp"
        );
        keywordGroups.push(currentGroup);
        continue;
      }

      if (/nhóm\s*3/i.test(line) && /lỗi gõ|địa phương|ngách/i.test(line)) {
        inHeadlinesSection = false;
        inHooksSection = false;
        inCaptionsSection = false;
        currentGroup = createGroup(
          "Nhóm 3: Từ Khóa Ngách & Lỗi Gõ",
          "Ít Cạnh Tranh",
          "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          "Từ khóa không dấu, gõ nhầm hoặc từ địa phương ROAS cao"
        );
        keywordGroups.push(currentGroup);
        continue;
      }

      // 2. Nhận diện mục Tiêu đề CTR
      if (/tiêu đề/i.test(line) && /ctr|quảng cáo/i.test(line)) {
        currentGroup = null;
        inHeadlinesSection = true;
        inHooksSection = false;
        inCaptionsSection = false;
        continue;
      }

      // 3. Nhận diện mục Hook 3s
      if (/hook/i.test(line) && /3\s*giây|text đè|video/i.test(line)) {
        currentGroup = null;
        inHeadlinesSection = false;
        inHooksSection = true;
        inCaptionsSection = false;
        continue;
      }

      // 4. Nhận diện mục Caption
      if (/caption/i.test(line) && /quảng cáo|giỏ hàng|cta/i.test(line)) {
        currentGroup = null;
        inHeadlinesSection = false;
        inHooksSection = false;
        inCaptionsSection = true;
        continue;
      }

      // 5. Nhận diện Hashtags
      if (/#[\w\u00C0-\u024F]+/i.test(line)) {
        const matches = line.match(/#[\w\u00C0-\u024F]+/g);
        if (matches) {
          matches.forEach((tag) => {
            if (!hashtags.includes(tag)) hashtags.push(tag);
          });
        }
      }

      // Bóc tách nội dung theo phân vùng
      if (currentGroup) {
        // Thu thập từ khóa
        if (line.includes(":") || /^[-*•]\s+/.test(line)) {
          const clean = line.replace(/^[-*•#\s]+/, "").trim();
          const parts = clean.split(/[:|]/);
          if (parts.length >= 2) {
            const kw = parts[0].replace(/^\[|\]|\*\*/g, "").trim();
            const bid = parts.slice(1).join(":").replace(/^\[|\]|\*\*/g, "").trim();
            if (
              kw &&
              !kw.toLowerCase().includes("nhóm") &&
              !kw.toLowerCase().includes("tên từ khóa") &&
              !kw.toLowerCase().includes("ma trận")
            ) {
              currentGroup.items.push({ keyword: kw, bid: bid || "Theo thị trường" });
            }
          } else if (clean && !clean.startsWith("(") && !clean.startsWith("#")) {
            const kw = clean.replace(/^\[|\]|\*\*/g, "").trim();
            if (
              kw &&
              !kw.toLowerCase().includes("nhóm") &&
              !kw.toLowerCase().includes("tên từ khóa")
            ) {
              currentGroup.items.push({ keyword: kw, bid: "Đề xuất thầu" });
            }
          }
        }
      } else if (inHeadlinesSection) {
        // Thu thập tiêu đề CTR
        if (/mẫu\s*\d/i.test(line)) {
          const clean = line.replace(/^[-*•#\s]+/, "").trim();
          const matchAngle = clean.match(/\((.*?)\)/);
          const angle = matchAngle ? matchAngle[1] : "Tiêu đề chuẩn CTR";
          const content = clean.replace(/mẫu\s*\d.*?:/i, "").replace(/^\[|\]$/g, "").trim();
          if (content) {
            headlines.push({
              id: headlines.length + 1,
              label: `Mẫu ${headlines.length + 1}`,
              angle,
              content,
              charCount: content.length,
            });
          }
        }
      } else if (inHooksSection) {
        // Thu thập Hook 3s
        if (/hook\s*\d/i.test(line) || (/^[-*•\d.]+\s+/i.test(line) && line.includes('"'))) {
          const clean = line.replace(/^[-*•#\s]+/, "").trim();
          const matchAngle = clean.match(/\((.*?)\)/);
          const angle = matchAngle ? matchAngle[1] : "Gây tò mò dừng lướt";
          const content = clean.replace(/hook\s*\d.*?:/i, "").replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "").trim();
          if (content) {
            hooks.push({
              id: hooks.length + 1,
              angle,
              content,
            });
          }
        }
      } else if (inCaptionsSection) {
        // Thu thập Caption
        if (/mẫu\s*caption\s*\d|caption\s*\d/i.test(line)) {
          const clean = line.replace(/^[-*•#\s]+/, "").trim();
          const title = clean.split(/[:\-]/)[0].trim();
          const content = clean.replace(/mẫu\s*caption\s*\d.*?:/i, "").trim();
          captions.push({
            id: captions.length + 1,
            title: title || `Mẫu Caption ${captions.length + 1}`,
            content: content || "",
          });
        } else if (captions.length > 0 && !line.startsWith("#")) {
          // Nối dòng cho caption
          const lastCap = captions[captions.length - 1];
          lastCap.content = (lastCap.content ? lastCap.content + "\n" : "") + line;
        }
      }
    }

    const hasShopee = keywordGroups.length > 0 || headlines.length > 0;
    const hasTiktok = hooks.length > 0 || captions.length > 0 || hashtags.length > 0;

    return {
      hasShopee,
      hasTiktok,
      keywordGroups,
      headlines,
      hooks,
      captions,
      hashtags,
    };
  }, [result]);

  const totalKeywords = parsedData ? parsedData.keywordGroups.reduce((acc, g) => acc + g.items.length, 0) : 0;
  const headlinesCount = parsedData ? parsedData.headlines.length : 0;
  const hooksCount = parsedData ? parsedData.hooks.length : 0;
  const captionsCount = parsedData ? parsedData.captions.length : 0;
  const hashtagsCount = parsedData ? parsedData.hashtags.length : 0;

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const charCount = result ? result.length : 0;

  const platformBadge =
    platform === "shopee"
      ? { text: "Shopee Ads", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" }
      : platform === "tiktok"
      ? { text: "TikTok Spark Ads", color: "bg-pink-500/20 text-pink-300 border-pink-500/40" }
      : { text: "Shopee & TikTok Ads", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ (Sticky trên mobile) */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 sm:px-4 py-2.5 flex flex-col gap-2 shrink-0">
        {/* Row 1: Tiêu đề + Badge Nền tảng + Chuyển chế độ xem */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
              <Flame size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-white text-xs sm:text-sm truncate">Mẫu Quảng Cáo Chuyển Đổi</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${platformBadge.color}`}>
              {platformBadge.text}
            </span>
          </div>

          {/* Nút chuyển đổi View Mode */}
          {result && !loading && (
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Thẻ
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Gốc
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Thanh thao tác nhanh (Download + Copy All) */}
        {result && !loading && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-400 truncate">
              {totalKeywords > 0 && <span className="font-semibold text-orange-400">{totalKeywords} từ khóa</span>}
              {totalKeywords > 0 && headlinesCount > 0 && <span className="mx-1">·</span>}
              {headlinesCount > 0 && <span className="text-amber-400">{headlinesCount} tiêu đề</span>}
              {hooksCount > 0 && <span className="mx-1">·</span>}
              {hooksCount > 0 && <span className="text-pink-400">{hooksCount} hook</span>}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                title="Tải file TXT"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Tải TXT</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                }`}
              >
                {copiedAll ? (
                  <>
                    <Check size={13} className="stroke-[3]" /> Đã Chép!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Sao Chép Tất Cả
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Row 3: Thanh lọc danh mục nhanh (Desktop ONLY) */}
        {result && !loading && viewMode === "visual" && parsedData && (
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Tất Cả
            </button>
            {totalKeywords > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("keywords")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "keywords"
                    ? "bg-orange-600 text-white font-bold shadow-xs"
                    : "bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-orange-300"
                }`}
              >
                <span>1. Từ Khóa Ads</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">{totalKeywords}</span>
              </button>
            )}
            {headlinesCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("headlines")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "headlines"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-amber-300"
                }`}
              >
                <span>2. Tiêu Đề CTR</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">{headlinesCount}</span>
              </button>
            )}
            {hooksCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("hooks")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "hooks"
                    ? "bg-pink-600 text-white font-bold shadow-xs"
                    : "bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-pink-300"
                }`}
              >
                <span>3. Hook 3s</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">{hooksCount}</span>
              </button>
            )}
            {(captionsCount > 0 || hashtagsCount > 0) && (
              <button
                type="button"
                onClick={() => setActiveFilter("captions")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === "captions"
                    ? "bg-cyan-600 text-white font-bold shadow-xs"
                    : "bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-cyan-300"
                }`}
              >
                <span>4. Caption & Tag</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">{captionsCount}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vùng hiển thị nội dung: Tự mở rộng trên mobile, scroll độc lập trên desktop */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-pink-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Sparkles size={26} className="animate-spin text-blue-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Phân Tích & Viết Mẫu Quảng Cáo...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang xây dựng ma trận từ khóa đấu thầu, giật tít Hook 3 giây và soạn caption tối ưu CTR...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-full min-h-[420px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div>
                {/* ============================================================= */}
                {/* 📱 GIAO DIỆN MOBILE: THUẦN TEXT GỌN GÀNG CHUẨN AI (< lg)       */}
                {/* ============================================================= */}
                <div className="lg:hidden p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 text-[13px] text-slate-200 leading-relaxed select-text space-y-5">
                  {/* 1. MA TRẬN TỪ KHÓA SHOPEE ADS */}
                  {parsedData && parsedData.keywordGroups.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          🔍 1. TỪ KHÓA ĐẤU THẦU ADS
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              parsedData.keywordGroups
                                .map((g) => `### ${g.name}:\n` + g.items.map((it) => `- ${it.keyword}: ${it.bid}`).join("\n"))
                                .join("\n\n"),
                              "all-kws"
                            )
                          }
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                        >
                          {copiedKey === "all-kws" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedKey === "all-kws" ? "Đã chép" : "Chép tất cả"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 pl-1">
                        {parsedData.keywordGroups.map((group) => {
                          const groupKws = group.items.map((it) => `- ${it.keyword}: ${it.bid}`).join("\n");
                          const isCopiedGroup = copiedKey === `m-group-${group.id}`;
                          return (
                            <div key={group.id} className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-orange-400 text-xs">
                                  • {group.name}:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(groupKws, `m-group-${group.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                                >
                                  {isCopiedGroup ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                  <span>{isCopiedGroup ? "Đã chép" : "Chép nhóm"}</span>
                                </button>
                              </div>
                              <div className="space-y-1 pl-3 text-xs text-slate-300 font-mono">
                                {group.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-900/80 last:border-0">
                                    <span className="truncate">{it.keyword}</span>
                                    <span className="text-amber-400 text-[11px] shrink-0">{it.bid}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. TIÊU ĐỀ QUẢNG CÁO CTR */}
                  {parsedData && parsedData.headlines.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          🏷️ 2. TIÊU ĐỀ QUẢNG CÁO CTR
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(parsedData.headlines.map((h) => `${h.label}: ${h.content}`).join("\n"), "all-headlines")
                          }
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                        >
                          {copiedKey === "all-headlines" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedKey === "all-headlines" ? "Đã chép" : "Chép cả 3"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 pl-1">
                        {parsedData.headlines.map((hl) => {
                          const isCopiedHl = copiedKey === `m-hl-${hl.id}`;
                          return (
                            <div key={hl.id} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-amber-300 text-xs">
                                  • {hl.label} ({hl.angle}):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(hl.content, `m-hl-${hl.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                                >
                                  {isCopiedHl ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                  <span>{isCopiedHl ? "Đã chép" : "Chép"}</span>
                                </button>
                              </div>
                              <p className="text-slate-100 pl-3 leading-snug select-text font-medium">
                                {hl.content}
                              </p>
                              <p className="text-[11px] text-slate-500 pl-3">
                                ({hl.charCount}/60 ký tự{hl.charCount <= 60 ? " - Chuẩn Shopee Ads" : " - Hơi dài"})
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. 5 CÂU HOOK 3S ĐẦU VIDEO (TIKTOK ADS) */}
                  {parsedData && parsedData.hooks.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          ⚡ 3. 5 CÂU HOOK 3 GIÂY ĐẦU VIDEO
                        </h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(parsedData.hooks.map((h) => `#${h.id} (${h.angle}): "${h.content}"`).join("\n\n"), "all-hooks")
                          }
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                        >
                          {copiedKey === "all-hooks" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedKey === "all-hooks" ? "Đã chép" : "Chép cả 5"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 pl-1">
                        {parsedData.hooks.map((hk) => {
                          const isCopiedHk = copiedKey === `m-hk-${hk.id}`;
                          return (
                            <div key={hk.id} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-pink-300 text-xs">
                                  • Hook #{hk.id} ({hk.angle}):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(hk.content, `m-hk-${hk.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                                >
                                  {isCopiedHk ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                  <span>{isCopiedHk ? "Đã chép" : "Chép"}</span>
                                </button>
                              </div>
                              <p className="text-slate-100 pl-3 leading-snug select-text font-medium italic">
                                &ldquo;{hk.content}&rdquo;
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. MẪU CAPTION & HASHTAG */}
                  {parsedData && (parsedData.captions.length > 0 || parsedData.hashtags.length > 0) && (
                    <div className="space-y-3 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          📝 4. CAPTION &amp; HASHTAGS
                        </h3>
                      </div>

                      {parsedData.captions.map((cap) => {
                        const isCopiedCap = copiedKey === `m-cap-${cap.id}`;
                        return (
                          <div key={cap.id} className="space-y-1 pl-1 pb-3 border-b border-slate-800/60 last:border-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-blue-300 text-xs">
                                • {cap.title}:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(cap.content, `m-cap-${cap.id}`)}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                              >
                                {isCopiedCap ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                <span>{isCopiedCap ? "Đã chép" : "Chép caption"}</span>
                              </button>
                            </div>
                            <p className="text-slate-300 pl-3 leading-relaxed select-text whitespace-pre-line text-xs">
                              {cap.content}
                            </p>
                          </div>
                        );
                      })}

                      {parsedData.hashtags.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-pink-300 text-xs">
                              • Bộ Hashtag đề xuất:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsedData.hashtags.join(" "), "m-all-hashtags")}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                            >
                              {copiedKey === "m-all-hashtags" ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                              <span>{copiedKey === "m-all-hashtags" ? "Đã chép" : "Chép hashtag"}</span>
                            </button>
                          </div>
                          <p className="pl-3 text-slate-400 font-mono text-xs select-text leading-relaxed">
                            {parsedData.hashtags.join(" ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ============================================================= */}
                {/* 🖥️ GIAO DIỆN DESKTOP: THẺ TRỰC QUAN ĐẦY ĐỦ (lg+)              */}
                {/* ============================================================= */}
                <div className="hidden lg:block space-y-6 sm:space-y-8">
                {/* ═══════════════════════════════════════════════════════ */}
                {/* PHẦN 1: MA TRẬN TỪ KHÓA SHOPEE ADS                     */}
                {/* ═══════════════════════════════════════════════════════ */}
                {parsedData &&
                  parsedData.keywordGroups.length > 0 &&
                  (activeFilter === "all" || activeFilter === "keywords") && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-orange-500/20 text-orange-400">
                            <Search size={16} />
                          </div>
                          <h3 className="font-black text-xs sm:text-sm text-orange-400 uppercase tracking-wide">
                            1. Ma Trận Từ Khóa Đấu Thầu Shopee Ads
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {totalKeywords} từ khóa đề xuất
                        </span>
                      </div>

                      {/* Danh sách 3 Nhóm Từ Khóa */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {parsedData.keywordGroups.map((group) => {
                          const allKws = group.items.map((it) => it.keyword).join("\n");
                          const isCopiedGroup = copiedKey === `group-${group.id}`;

                          return (
                            <div
                              key={group.id}
                              className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 space-y-3 hover:border-slate-700 transition-all shadow-sm"
                            >
                              {/* Group Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-xs sm:text-sm text-white">{group.name}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                                      {group.badge}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-tight">{group.intent}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(allKws, `group-${group.id}`)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer ${
                                    isCopiedGroup
                                      ? "bg-emerald-500 text-white"
                                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                  }`}
                                >
                                  {isCopiedGroup ? (
                                    <>
                                      <Check size={12} className="stroke-[3]" /> Đã sao chép ({group.items.length})
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} /> Sao chép nhóm từ khóa
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Keywords Grid Table */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {group.items.map((item, kwIdx) => {
                                  const kwKey = `kw-${group.id}-${kwIdx}`;
                                  const isCopiedKw = copiedKey === kwKey;

                                  return (
                                    <div
                                      key={kwIdx}
                                      className="bg-slate-900/90 border border-slate-800/70 rounded-xl px-3 py-2 flex items-center justify-between gap-2 hover:border-orange-500/40 hover:bg-slate-800/50 transition-all group"
                                    >
                                      <span className="text-xs font-semibold text-slate-200 truncate flex-1" title={item.keyword}>
                                        {item.keyword}
                                      </span>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300/90 border border-slate-700">
                                          {item.bid}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopy(item.keyword, kwKey)}
                                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
                                          title="Sao chép từ khóa này"
                                        >
                                          {isCopiedKw ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* PHẦN 2: 3 MẪU TIÊU ĐỀ QUẢNG CÁO CTR                     */}
                {/* ═══════════════════════════════════════════════════════ */}
                {parsedData &&
                  parsedData.headlines.length > 0 &&
                  (activeFilter === "all" || activeFilter === "headlines") && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                            <Tag size={16} />
                          </div>
                          <h3 className="font-black text-xs sm:text-sm text-amber-400 uppercase tracking-wide">
                            2. 3 Mẫu Tiêu Đề Quảng Cáo CTR (&lt; 60 ký tự)
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">Chuẩn Shopee</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {parsedData.headlines.map((hl) => {
                          const isCopiedHl = copiedKey === `hl-${hl.id}`;
                          const isSafeLength = hl.charCount <= 60;

                          return (
                            <div
                              key={hl.id}
                              className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm space-y-2 group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-md bg-slate-800 shrink-0">
                                    {hl.label}
                                  </span>
                                  <span className="text-[11px] font-medium text-amber-300/80 truncate">
                                    {hl.angle}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                      isSafeLength
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    }`}
                                  >
                                    {hl.charCount}/60 ký tự
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(hl.content, `hl-${hl.id}`)}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    {isCopiedHl ? (
                                      <>
                                        <Check size={12} className="text-emerald-400 stroke-[3]" /> Đã chép
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} /> Sao chép
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs sm:text-sm font-bold text-slate-100 bg-slate-900/90 rounded-xl p-3 border border-slate-800/60 font-sans leading-relaxed">
                                {hl.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* PHẦN 3: 5 CÂU HOOK TEXT ĐÈ VIDEO (TIKTOK 3S ĐẦU)        */}
                {/* ═══════════════════════════════════════════════════════ */}
                {parsedData &&
                  parsedData.hooks.length > 0 &&
                  (activeFilter === "all" || activeFilter === "hooks") && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-pink-500/20 text-pink-400">
                            <Video size={16} />
                          </div>
                          <h3 className="font-black text-xs sm:text-sm text-pink-400 uppercase tracking-wide">
                            3. 5 Câu Hook Text Đè Video (TikTok 3 Giây Đầu)
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">Dừng lướt cực mạnh</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {parsedData.hooks.map((hk) => {
                          const isCopiedHk = copiedKey === `hk-${hk.id}`;

                          return (
                            <div
                              key={hk.id}
                              className="bg-slate-950/70 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                  #{hk.id}
                                </span>
                                <div className="space-y-1 min-w-0">
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                                    {hk.angle}
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white font-sans leading-relaxed">
                                    &ldquo;{hk.content}&rdquo;
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(hk.content, `hk-${hk.id}`)}
                                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 self-end sm:self-center shrink-0 cursor-pointer"
                              >
                                {isCopiedHk ? (
                                  <>
                                    <Check size={12} className="text-emerald-400 stroke-[3]" /> Đã chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Sao chép Hook
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/* PHẦN 4: CAPTION KÈM CTA & HASHTAG TIKTOK ADS           */}
                {/* ═══════════════════════════════════════════════════════ */}
                {parsedData &&
                  (parsedData.captions.length > 0 || parsedData.hashtags.length > 0) &&
                  (activeFilter === "all" || activeFilter === "captions") && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                            <ShoppingBag size={16} />
                          </div>
                          <h3 className="font-black text-xs sm:text-sm text-blue-400 uppercase tracking-wide">
                            4. Mẫu Caption Kèm CTA Giỏ Hàng & Hashtag
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">Tối ưu giỏ hàng</span>
                      </div>

                      {/* Captions Grid */}
                      {parsedData.captions.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {parsedData.captions.map((cap) => {
                            const isCopiedCap = copiedKey === `cap-${cap.id}`;

                            return (
                              <div
                                key={cap.id}
                                className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-blue-300">
                                    {cap.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(cap.content, `cap-${cap.id}`)}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    {isCopiedCap ? (
                                      <>
                                        <Check size={12} className="text-emerald-400 stroke-[3]" /> Đã chép
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} /> Sao chép Caption
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-200 whitespace-pre-line leading-relaxed border border-slate-800/60 font-sans select-all">
                                  {cap.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hashtags Pills */}
                      {parsedData.hashtags.length > 0 && (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <Tag size={13} className="text-pink-400" /> Bộ Hashtag chạy Ads chuẩn tệp ({parsedData.hashtags.length}):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsedData.hashtags.join(" "), "all-hashtags")}
                              className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                            >
                              {copiedKey === "all-hashtags" ? "Đã chép tất cả hashtag!" : "Sao chép toàn bộ hashtag"}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {parsedData.hashtags.map((tag, tIdx) => {
                              const isCopiedTag = copiedKey === `tag-${tIdx}`;

                              return (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => handleCopy(tag, `tag-${tIdx}`)}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                    isCopiedTag
                                      ? "bg-emerald-500 text-white border-emerald-400"
                                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-pink-500/50 hover:text-white"
                                  }`}
                                >
                                  {isCopiedTag ? <Check size={11} className="stroke-[3]" /> : <span className="text-pink-400">#</span>}
                                  <span>{tag.replace(/^#/, "")}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Fallback nếu nội dung không match parser chuẩn */}
                {parsedData && !parsedData.hasShopee && !parsedData.hasTiktok && (
                  <div className="bg-slate-950/50 rounded-xl p-4 sm:p-5 border border-slate-800/80 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-3 font-sans whitespace-pre-line">
                    {result}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-center text-slate-400">
              <FileText size={26} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-300">Chưa có dữ liệu quảng cáo</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Điền thông tin sản phẩm và bấm &quot;Tạo Mẫu Quảng Cáo&quot; để AI tối ưu chiến dịch cho bạn.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={13} className="text-blue-400" />
                Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer metadata ghim cố định đáy khung output */}
      {result && !loading && (
        <div className="px-3.5 sm:px-4 py-2 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <span>Số từ: <strong className="text-slate-200 font-mono">{wordCount}</strong></span>
            <span>Số ký tự: <strong className="text-slate-200 font-mono">{charCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={12} /> Sẵn sàng chạy Shopee & TikTok Ads
          </div>
        </div>
      )}
    </div>
  );
}
