"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Layers,
  Users,
  Megaphone,
  Images,
  FileText,
  MessageCircle,
  Share2,
  CheckCircle2,
  FileSpreadsheet,
  LayoutList,
  Send,
  Smartphone,
  BadgeCheck,
  Tag,
  ChevronRight,
  Flame,
  FileCode2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface VideoRepurposerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  brandTone: string;
  callToAction: string;
  onUseSample?: () => void;
}

const CHANNELS = [
  { id: "all", name: "Tất Cả 5 Kênh", count: 5, icon: Layers, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", activeBg: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
  { id: "group", name: "1. FB Group", count: 1, icon: Users, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", activeBg: "bg-blue-500/20 text-blue-300 border-blue-500/50" },
  { id: "fanpage", name: "2. Fanpage", count: 1, icon: Megaphone, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", activeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50" },
  { id: "carousel", name: "3. Carousel", count: 1, icon: Images, color: "text-pink-400 bg-pink-500/10 border-pink-500/30", activeBg: "bg-pink-500/20 text-pink-300 border-pink-500/50" },
  { id: "blog", name: "4. Review SEO", count: 1, icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", activeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" },
  { id: "zalo", name: "5. Zalo OA", count: 1, icon: MessageCircle, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", activeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" },
];

export default function VideoRepurposerOutput({
  result,
  loading,
  productName,
  brandTone,
  callToAction,
  onUseSample,
}: VideoRepurposerOutputProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tách 5 định dạng bằng regex linh hoạt
  const sections = useMemo(() => {
    if (!result) return { group: "", fanpage: "", carousel: "", blog: "", zalo: "" };

    const patterns = [
      { key: "group", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*1|facebook\s*group|fb\s*group)/i },
      { key: "fanpage", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*2|fanpage)/i },
      { key: "carousel", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*3|carousel|chuỗi\s*ảnh)/i },
      { key: "blog", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*4|review\s*chuẩn\s*seo|bài\s*viết\s*review|website)/i },
      { key: "zalo", regex: /(?:^|\n)##?\s*.*(?:định\s*dạng\s*5|zalo\s*oa|tin\s*nhắn\s*zalo)/i },
    ];

    const matches = patterns.map((p) => {
      const match = result.match(p.regex);
      return {
        key: p.key,
        index: match ? match.index! : -1,
      };
    });

    const cleanSectionContent = (raw: string) => {
      return raw
        .replace(/^[\s\n]*##?[^\n]+\n?/i, "")
        .replace(/^[\s\n]*---+[\s\n]*/gm, "")
        .trim();
    };

    const foundIndices = matches.filter((m) => m.index !== -1).sort((a, b) => a.index - b.index);

    if (foundIndices.length < 2) {
      return {
        group: cleanSectionContent(result),
        fanpage: "",
        carousel: "",
        blog: "",
        zalo: "",
      };
    }

    const res: Record<string, string> = { group: "", fanpage: "", carousel: "", blog: "", zalo: "" };

    for (let i = 0; i < foundIndices.length; i++) {
      const current = foundIndices[i];
      const nextIndex = i + 1 < foundIndices.length ? foundIndices[i + 1].index : result.length;
      const rawChunk = result.substring(current.index, nextIndex);
      res[current.key] = cleanSectionContent(rawChunk);
    }

    return res as {
      group: string;
      fanpage: string;
      carousel: string;
      blog: string;
      zalo: string;
    };
  }, [result]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const rows = [
      {
        STT: 1,
        "Kênh Phân Phối": "Facebook Group",
        "Định Dạng": "Bài Viết Seeding / Chia Sẻ Thực Tế",
        "Mục Tiêu": "Tạo thảo luận tự nhiên, tránh bóp reach, tăng tương tác",
        "Sản Phẩm": productName || "Chưa đặt tên",
        "Nội Dung": sections.group || result,
      },
      {
        STT: 2,
        "Kênh Phân Phối": "Fanpage Facebook",
        "Định Dạng": "Bài Viết Bán Hàng / Chạy Ads",
        "Mục Tiêu": "Tối ưu Click link & Inbox tư vấn",
        "Sản Phẩm": productName || "Chưa đặt tên",
        "Nội Dung": sections.fanpage || result,
      },
      {
        STT: 3,
        "Kênh Phân Phối": "Chuỗi Ảnh Carousel",
        "Định Dạng": "Kịch Bản 5 Slide Ảnh (Lemon8 / FB / Instagram)",
        "Mục Tiêu": "Giữ chân người xem lướt slide, lưu bài",
        "Sản Phẩm": productName || "Chưa đặt tên",
        "Nội Dung": sections.carousel || result,
      },
      {
        STT: 4,
        "Kênh Phân Phối": "Blog / Website SEO",
        "Định Dạng": "Bài Viết Review Chuẩn SEO",
        "Mục Tiêu": "Lên Top Google tìm kiếm, kéo traffic tự nhiên",
        "Sản Phẩm": productName || "Chưa đặt tên",
        "Nội Dung": sections.blog || result,
      },
      {
        STT: 5,
        "Kênh Phân Phối": "Zalo OA / CSKH",
        "Định Dạng": "Tin Nhắn Tương Tác / Gửi Deal Riêng",
        "Mục Tiêu": "Chốt đơn khách cũ, remarketing 0 đồng",
        "Sản Phẩm": productName || "Chưa đặt tên",
        "Nội Dung": sections.zalo || result,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 35 },
      { wch: 40 },
      { wch: 30 },
      { wch: 80 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "5KenhDaKenh");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `AIChoShop_5Kenh_${dateStr}.xlsx`);
  };

  const wordCount = result ? result.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = result ? result.length : 0;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng gradient nền */}
      <div className="absolute top-0 right-0 p-36 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ - Luôn giữ đúng 1 dòng trên mobile */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-10 bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="p-1 sm:p-1.5 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
            <Share2 size={15} />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm leading-none truncate whitespace-nowrap">
            Nội Dung 5 Kênh
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 hidden md:inline-block shrink-0">
            Omnichannel 5-in-1
          </span>
          {productName && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[120px] hidden lg:inline-block shrink-0">
              {productName}
            </span>
          )}
        </div>

        {/* Nút Chuyển chế độ xem, Xuất Excel & Sao chép toàn bộ - 1 hàng duy nhất */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* View Mode Toggle: Trực quan vs Văn bản (icon-only trên mobile) */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                title="Xem dạng thẻ trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-pink-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} />
                <span className="hidden md:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Xem dạng văn bản thô"
                className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-pink-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode2 size={12} />
                <span className="hidden md:inline">Văn bản</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
              title="Xuất bảng nội dung 5 kênh ra file Excel (.xlsx)"
            >
              <FileSpreadsheet size={12} className="text-emerald-400" />
              <span>Excel</span>
            </button>

            {/* Sao chép toàn bộ */}
            <button
              type="button"
              onClick={() => handleCopy(result, "all_full")}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-md shadow-pink-500/20 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {copiedKey === "all_full" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedKey === "all_full" ? "Đã chép" : "Chép hết"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Thanh chuyển Tab 5 kênh */}
      {result && !loading && (
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const isSelected = activeTab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-slate-800 text-pink-400 border border-pink-500/40 shadow-xs ring-1 ring-pink-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <Icon size={13} className={isSelected ? "text-pink-400" : "text-slate-400"} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Vùng nội dung cuộn nội bộ */}
      <div className="p-3.5 sm:p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar overscroll-contain pb-24 lg:pb-4">
        {/* Chưa có kết quả */}
        {!result && !loading && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-1 shadow-lg shadow-pink-500/10">
              <Share2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Chưa Có Nội Dung Đa Kênh
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Dán kịch bản hoặc lời thoại video TikTok ở cột bên trái rồi nhấn{" "}
              <strong className="text-pink-400">&quot;Chuyển Đổi Sang 5 Định Dạng Kênh&quot;</strong>. Hệ thống AI sẽ tự động phân tích và viết lại chuẩn văn hóa từng nền tảng.
            </p>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-pink-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Chạy thử với dữ liệu mẫu (Demo)
              </button>
            )}
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/10">
              <Share2 size={28} className="animate-spin text-pink-400" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Chuyển Đổi Sang 5 Định Dạng Đa Kênh...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang viết lại cho Facebook Group Seeding, Fanpage Ads, 5 Slide Carousel, Review SEO & Zalo OA...
              </p>
            </div>
          </div>
        )}

        {/* Hiển thị kết quả */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Thanh thống kê nhanh */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span>
                  Độ dài: <strong className="text-white font-mono">{charCount}</strong> ký tự
                </span>
                <span>
                  Số từ: <strong className="text-white font-mono">{wordCount}</strong> từ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đã tối ưu thuật toán từng sàn
                </span>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: XEM TRỰC QUAN TỪNG KÊNH (VISUAL) */}
            {viewMode === "visual" ? (
              <div className="space-y-4">
                {/* 1. FB Group */}
                {(activeTab === "all" || activeTab === "group") && sections.group && (
                  <ChannelGroupCard
                    content={sections.group}
                    onCopy={(text) => handleCopy(text, "group")}
                    isCopied={copiedKey === "group"}
                    onCopyComment={(text) => handleCopy(text, "group_comment")}
                    isCommentCopied={copiedKey === "group_comment"}
                  />
                )}

                {/* 2. Fanpage Facebook */}
                {(activeTab === "all" || activeTab === "fanpage") && (sections.fanpage || activeTab === "fanpage") && (
                  <ChannelFanpageCard
                    content={sections.fanpage || result}
                    onCopy={(text) => handleCopy(text, "fanpage")}
                    isCopied={copiedKey === "fanpage"}
                  />
                )}

                {/* 3. Carousel 5 Slides */}
                {(activeTab === "all" || activeTab === "carousel") && (sections.carousel || activeTab === "carousel") && (
                  <ChannelCarouselCard
                    content={sections.carousel || result}
                    onCopyAll={(text) => handleCopy(text, "carousel_all")}
                    isAllCopied={copiedKey === "carousel_all"}
                    onCopySlide={(text, num) => handleCopy(text, `carousel_slide_${num}`)}
                    copiedSlideKey={copiedKey}
                  />
                )}

                {/* 4. Blog Review SEO */}
                {(activeTab === "all" || activeTab === "blog") && (sections.blog || activeTab === "blog") && (
                  <ChannelBlogCard
                    content={sections.blog || result}
                    onCopy={(text) => handleCopy(text, "blog")}
                    isCopied={copiedKey === "blog"}
                  />
                )}

                {/* 5. Zalo OA */}
                {(activeTab === "all" || activeTab === "zalo") && (sections.zalo || activeTab === "zalo") && (
                  <ChannelZaloCard
                    content={sections.zalo || result}
                    productName={productName}
                    onCopy={(text) => handleCopy(text, "zalo")}
                    isCopied={copiedKey === "zalo"}
                  />
                )}
              </div>
            ) : (
              /* CHẾ ĐỘ 2: XEM VĂN BẢN ĐẦY ĐỦ (RAW MARKDOWN) */
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap select-text">
                {result}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 1. COMPONENT: FACEBOOK GROUP SEEDING CARD
// ==========================================
function ChannelGroupCard({
  content,
  onCopy,
  isCopied,
  onCopyComment,
  isCommentCopied,
}: {
  content: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
  onCopyComment: (text: string) => void;
  isCommentCopied: boolean;
}) {
  // Tách riêng bình luận mồi nếu có
  const commentMatch = content.match(
    /(?:\n|^)(?:\*\(|\()?(?:bình\s*luận\s*mồi|gợi\s*ý\s*cmt|comment\s*mồi|bác\s*nào\s*lười\s*tìm\s*mã)[^:\n]*[:\-–]?\s*([\s\S]+?)(?:\)\*|\)$|$)/i
  );

  const seedingComment = commentMatch ? commentMatch[1].replace(/^\*\(/, "").replace(/\)\*$/, "").trim() : null;
  const postBody = commentMatch ? content.replace(commentMatch[0], "").trim() : content;

  return (
    <div className="bg-slate-950/80 border border-blue-900/40 rounded-2xl overflow-hidden shadow-sm hover:border-blue-700/60 transition-all">
      {/* Header thẻ */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl border border-blue-500/40 bg-blue-950/40 text-blue-400 shrink-0">
            <Users size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              Kênh 1: Bài Đăng Facebook Group
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Phong cách Seeding thật · Tránh kiểm duyệt Admin · Kéo thảo luận
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCopy(content)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-700/60 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
          {isCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isCopied ? "Đã Chép!" : "Sao chép"}</span>
        </button>
      </div>

      {/* Nội dung bài viết */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <FormattedText text={postBody} />
        </div>

        {/* Hộp gợi ý bình luận mồi */}
        {seedingComment && (
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                💬 Gợi ý bình luận mồi (Comment Seeding)
              </span>
              <button
                type="button"
                onClick={() => onCopyComment(seedingComment)}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 flex items-center gap-1 cursor-pointer"
              >
                {isCommentCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                <span>{isCommentCopied ? "Đã chép" : "Chép cmt"}</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 italic pl-1 select-text">
              &quot;{seedingComment}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPONENT: FANPAGE ADS & INBOX CARD
// ==========================================
function ChannelFanpageCard({
  content,
  onCopy,
  isCopied,
}: {
  content: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="bg-slate-950/80 border border-indigo-900/40 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-700/60 transition-all">
      {/* Header thẻ */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-400 shrink-0">
            <Megaphone size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              Kênh 2: Bài Đăng Fanpage Facebook
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Tối ưu Click & Inbox · Giật tít mạnh mẽ · Thúc đẩy hành động mua ngay
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCopy(content)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-700/60 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
          {isCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isCopied ? "Đã Chép!" : "Sao chép"}</span>
        </button>
      </div>

      {/* Nội dung bài Fanpage */}
      <div className="p-3.5 sm:p-4">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <FormattedText text={content} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. COMPONENT: CAROUSEL 5 SLIDES CARD
// ==========================================
function ChannelCarouselCard({
  content,
  onCopyAll,
  isAllCopied,
  onCopySlide,
  copiedSlideKey,
}: {
  content: string;
  onCopyAll: (text: string) => void;
  isAllCopied: boolean;
  onCopySlide: (text: string, num: number) => void;
  copiedSlideKey: string | null;
}) {
  // Parse 5 slides
  const slides = useMemo(() => {
    const lines = content.split("\n");
    const resultSlides: { num: number; label: string; text: string }[] = [];
    let currentNum = 0;
    let currentLabel = "";
    let buffer: string[] = [];

    const flush = () => {
      if (currentNum > 0 && buffer.length > 0) {
        resultSlides.push({
          num: currentNum,
          label: currentLabel || (currentNum === 1 ? "Bìa Giật Tít (Hook)" : currentNum === 5 ? "Kêu Gọi Lưu & Thả Tim" : `Slide ${currentNum}`),
          text: buffer.join("\n").trim(),
        });
      }
      buffer = [];
    };

    lines.forEach((l) => {
      const tr = l.trim();
      const match = tr.match(/^[-*•\s]*(?:Slide|Trang|Ảnh)\s*(\d+)[\s:()\-–]*(.*)/i);
      if (match) {
        flush();
        currentNum = parseInt(match[1], 10);
        const rest = match[2].replace(/^[:\-–\s]+/, "");
        const labelMatch = rest.match(/^\(([^)]+)\)[:\s]*(.*)/);
        if (labelMatch) {
          currentLabel = labelMatch[1].trim();
          if (labelMatch[2]) buffer.push(labelMatch[2]);
        } else {
          currentLabel = currentNum === 1 ? "Bìa Giật Tít (Hook)" : currentNum === 5 ? "Kêu Gọi Lưu & Thả Tim" : `Slide ${currentNum}`;
          if (rest) buffer.push(rest);
        }
      } else {
        if (currentNum > 0) {
          buffer.push(l);
        }
      }
    });

    flush();
    return resultSlides;
  }, [content]);

  return (
    <div className="bg-slate-950/80 border border-pink-900/40 rounded-2xl overflow-hidden shadow-sm hover:border-pink-700/60 transition-all">
      {/* Header thẻ */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl border border-pink-500/40 bg-pink-950/40 text-pink-400 shrink-0">
            <Images size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              Kênh 3: Kịch Bản Chuỗi 5 Slide Carousel
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Dành cho Lemon8 / Facebook Album / Instagram · Giữ chân người xem lướt slide
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCopyAll(content)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 hover:text-white border border-pink-700/60 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
          {isAllCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isAllCopied ? "Đã Chép!" : "Sao chép 5 Slide"}</span>
        </button>
      </div>

      {/* Danh sách 5 slide hiển thị thẻ riêng */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        {slides.length >= 2 ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {slides.map((s) => {
              const isSlideCopied = copiedSlideKey === `carousel_slide_${s.num}`;
              const isCover = s.num === 1;
              const isEnd = s.num === 5;

              return (
                <div
                  key={s.num}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    isCover
                      ? "bg-amber-950/30 border-amber-500/40"
                      : isEnd
                      ? "bg-pink-950/30 border-pink-500/40"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isCover
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : isEnd
                            ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        Slide {s.num}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopySlide(`Slide ${s.num}: ${s.text}`, s.num)}
                        className="text-[10px] p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title={`Sao chép Slide ${s.num}`}
                      >
                        {isSlideCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-white leading-tight">
                      {s.label}
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                      {s.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <FormattedText text={content} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. COMPONENT: REVIEW SEO BLOG CARD
// ==========================================
function ChannelBlogCard({
  content,
  onCopy,
  isCopied,
}: {
  content: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="bg-slate-950/80 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-700/60 transition-all">
      {/* Header thẻ */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shrink-0">
            <FileText size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              Kênh 4: Bài Viết Review Chuẩn SEO
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Website / Blog Affiliate · Lên Top Google tìm kiếm · Bảng Ưu & Nhược điểm
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCopy(content)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white border border-emerald-700/60 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
          {isCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isCopied ? "Đã Chép!" : "Sao chép"}</span>
        </button>
      </div>

      {/* Nội dung bài SEO */}
      <div className="p-3.5 sm:p-4">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <FormattedText text={content} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. COMPONENT: ZALO OA CHAT PREVIEW CARD
// ==========================================
function ChannelZaloCard({
  content,
  productName,
  onCopy,
  isCopied,
}: {
  content: string;
  productName?: string;
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  return (
    <div className="bg-slate-950/80 border border-cyan-900/40 rounded-2xl overflow-hidden shadow-sm hover:border-cyan-700/60 transition-all">
      {/* Header thẻ */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shrink-0">
            <MessageCircle size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">
              Kênh 5: Tin Nhắn Zalo OA / CSKH
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Gửi deal bí mật cho khách cũ · Xưng hô thân tình Em - Anh/Chị · Chốt đơn 1-1
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCopy(content)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-700/60 transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
        >
          {isCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isCopied ? "Đã Chép!" : "Sao chép"}</span>
        </button>
      </div>

      {/* Mô phỏng khung chat Zalo OA chuyên nghiệp */}
      <div className="p-3.5 sm:p-4">
        <div className="max-w-xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-md">
          {/* Header thanh Chat Zalo */}
          <div className="px-3 py-2 bg-cyan-950/50 border-b border-cyan-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-slate-950 text-xs shadow-xs">
                Zalo
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{productName ? `${productName.slice(0, 24)}...` : "Tư Vấn Bán Hàng"}</span>
                  <BadgeCheck size={13} className="text-cyan-400 inline" />
                </div>
                <div className="text-[10px] text-cyan-300/80">Zalo Official Account · Trực tuyến</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
              Deal Riêng
            </span>
          </div>

          {/* Bong bóng tin nhắn Chat */}
          <div className="p-3.5 space-y-2">
            <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-200 leading-relaxed select-text shadow-sm">
              <FormattedText text={content} />
            </div>
            <div className="text-[10px] text-slate-500 text-right pr-1">
              Vừa xong · Đã gửi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HELPER: RENDER MARKDOWN CLEANLY (NO RAW **)
// ==========================================
function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className="space-y-2 select-text font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading (### hoặc ##)
        if (trimmed.startsWith("###") || trimmed.startsWith("##")) {
          const headingText = trimmed.replace(/^#+\s*/, "").replace(/\*+/g, "");
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-bold text-pink-300 pt-1.5 pb-0.5 border-b border-slate-800/80"
            >
              {headingText}
            </h4>
          );
        }

        // Bullet point: - hoặc * hoặc •
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ");
        const contentText = isBullet ? trimmed.replace(/^[-*•]\s*/, "") : trimmed;

        // Parse **bold** parts inside line
        const parts = contentText.split(/(\*\*[^*]+\*\*)/g);

        return (
          <p
            key={idx}
            className={`text-xs leading-relaxed text-slate-200 ${
              isBullet
                ? "pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-pink-400 before:font-bold"
                : ""
            }`}
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="text-white font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
