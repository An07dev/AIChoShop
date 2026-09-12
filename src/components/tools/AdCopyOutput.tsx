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
  Share2,
  Tag,
  ShoppingBag,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface AdCopyOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  platform?: string;
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
}: AdCopyOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>("all");

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
    a.download = `mau-quang-cao-${productName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
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
          const content = clean.replace(/hook\s*\d.*?:/i, "").replace(/^[“"']|[”"']$/g, "").trim();
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

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const charCount = result ? result.length : 0;

  const platformBadge =
    platform === "shopee"
      ? { text: "Shopee Ads", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" }
      : platform === "tiktok"
      ? { text: "TikTok Spark Ads", color: "bg-pink-500/20 text-pink-300 border-pink-500/40" }
      : { text: "Shopee & TikTok Ads", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Flame size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Mẫu Quảng Cáo Chuyển Đổi</h2>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${platformBadge.color}`}>
            {platformBadge.text}
          </span>
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Giao diện thẻ
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn bản gốc
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              title="Tải file txt"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                copiedAll
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check size={13} className="stroke-[3]" /> Đã Sao Chép
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

      {/* Vùng hiển thị nội dung */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar relative z-10">
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
                className="w-full h-[520px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div className="space-y-8">
                {/* ═══════════════════════════════════════════════════════ */}
                {/* PHẦN 1: MA TRẬN TỪ KHÓA SHOPEE ADS                     */}
                {/* ═══════════════════════════════════════════════════════ */}
                {parsedData && parsedData.keywordGroups.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-orange-500/20 text-orange-400">
                          <Search size={16} />
                        </div>
                        <h3 className="font-black text-sm text-orange-400 uppercase tracking-wide">
                          Ma Trận Từ Khóa Đấu Thầu Shopee Ads
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {parsedData.keywordGroups.reduce((acc, g) => acc + g.items.length, 0)} từ khóa đề xuất
                      </span>
                    </div>

                    {/* Danh sách 3 Nhóm Từ Khóa */}
                    <div className="grid grid-cols-1 gap-4">
                      {parsedData.keywordGroups.map((group) => {
                        const allKws = group.items.map((it) => it.keyword).join("\n");
                        const isCopiedGroup = copiedKey === `group-${group.id}`;

                        return (
                          <div
                            key={group.id}
                            className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-sm"
                          >
                            {/* Group Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs text-white">{group.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${group.badgeColor}`}>
                                    {group.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{group.intent}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(allKws, `group-${group.id}`)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                                    <Copy size={12} /> Sao chép tất cả từ khóa
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
                                    className="bg-slate-900/90 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2 hover:border-blue-500/40 hover:bg-slate-800/50 transition-all group"
                                  >
                                    <span className="text-xs font-semibold text-slate-200 truncate flex-1" title={item.keyword}>
                                      {item.keyword}
                                    </span>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300/90 border border-slate-700">
                                        {item.bid}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(item.keyword, kwKey)}
                                        className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-700 transition-colors cursor-pointer"
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
                {parsedData && parsedData.headlines.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                          <Tag size={16} />
                        </div>
                        <h3 className="font-black text-sm text-amber-400 uppercase tracking-wide">
                          3 Mẫu Tiêu Đề Quảng Cáo Tối Ưu CTR (&lt; 60 ký tự)
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Chuẩn thuật toán Shopee</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {parsedData.headlines.map((hl) => {
                        const isCopiedHl = copiedKey === `hl-${hl.id}`;
                        const isSafeLength = hl.charCount <= 60;

                        return (
                          <div
                            key={hl.id}
                            className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all shadow-sm space-y-2 group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-md bg-slate-800">
                                  {hl.label}
                                </span>
                                <span className="text-[11px] font-medium text-amber-300/80">
                                  {hl.angle}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
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

                            <p className="text-sm font-bold text-slate-100 bg-slate-900/90 rounded-xl p-3 border border-slate-800/60 font-sans">
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
                {parsedData && parsedData.hooks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-pink-500/20 text-pink-400">
                          <Video size={16} />
                        </div>
                        <h3 className="font-black text-sm text-pink-400 uppercase tracking-wide">
                          5 Câu Hook Text Đè Video (TikTok 3 Giây Đầu)
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
                            className="bg-slate-950/70 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                #{hk.id}
                              </span>
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  {hk.angle}
                                </span>
                                <p className="text-sm font-bold text-white font-sans">
                                  &ldquo;{hk.content}&rdquo;
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopy(hk.content, `hk-${hk.id}`)}
                              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 self-end sm:self-center shrink-0 cursor-pointer"
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
                {parsedData && (parsedData.captions.length > 0 || parsedData.hashtags.length > 0) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                          <ShoppingBag size={16} />
                        </div>
                        <h3 className="font-black text-sm text-blue-400 uppercase tracking-wide">
                          Mẫu Caption Kèm CTA Giỏ Hàng & Hashtag
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Tối ưu giỏ hàng vàng</span>
                    </div>

                    {/* Captions Grid */}
                    {parsedData.captions.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {parsedData.captions.map((cap) => {
                          const isCopiedCap = copiedKey === `cap-${cap.id}`;

                          return (
                            <div
                              key={cap.id}
                              className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all shadow-sm space-y-2"
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

                              <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-200 whitespace-pre-line leading-relaxed border border-slate-800/60 font-sans">
                                {cap.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Hashtags Pills */}
                    {parsedData.hashtags.length > 0 && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Tag size={13} className="text-pink-400" /> Bộ 5 Hashtag chạy Ads chuẩn tệp:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(parsedData.hashtags.join(" "), "all-hashtags")}
                            className="text-[11px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "all-hashtags" ? "Đã chép tất cả!" : "Sao chép toàn bộ hashtag"}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {parsedData.hashtags.map((tag, tIdx) => {
                            const isCopiedTag = copiedKey === `tag-${tIdx}`;

                            return (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={() => handleCopy(tag, `tag-${tIdx}`)}
                                className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                                  isCopiedTag
                                    ? "bg-emerald-500 text-white border-emerald-400"
                                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-pink-500/50 hover:text-white"
                                }`}
                              >
                                {isCopiedTag ? <Check size={11} className="stroke-[3]" /> : <span>#</span>}
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
                  <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/80 text-slate-200 text-sm leading-relaxed space-y-3 font-sans whitespace-pre-line">
                    {result}
                  </div>
                )}
              </div>
            )}

            {/* Footer metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>Số từ: <strong className="text-slate-400">{wordCount}</strong></span>
                <span>Số ký tự: <strong className="text-slate-400">{charCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 size={12} /> Chiến dịch sẵn sàng triển khai Shopee & TikTok Ads
              </div>
            </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
