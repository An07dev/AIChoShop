"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Users,
  Megaphone,
  Images,
  FileText,
  MessageCircle,
  Share2,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Gift,
  MousePointerClick,
  Tag,
  MessageSquareQuote,
  Flame,
  LayoutGrid,
  Code2,
  Maximize2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  parseVideoRepurposerResult,
  formatRepurposerMarkdownText,
  type VideoRepurposerData,
} from "@/lib/video-repurposer/contract";

interface VideoRepurposerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  brandTone: string;
  callToAction: string;
  onUseSample?: () => void;
  elapsedSeconds?: number;
  onCancel?: () => void;
}

const REPURPOSER_STAGES = [
  { upToSeconds: 5, text: "🎬 Đang phân tích kịch bản video gốc & thông điệp chính..." },
  { upToSeconds: 15, text: "👥 Soạn thảo bài chia sẻ tự nhiên cho Facebook Group..." },
  { upToSeconds: 30, text: "📢 Chuyển thể bài đăng Fanpage & 5 Slide Carousel đa chiều..." },
  { upToSeconds: 55, text: "📝 Tối ưu bài Blog Review chuẩn SEO & kịch bản tin nhắn Zalo OA..." },
  { upToSeconds: 85, text: "🛡️ Kiểm tra chuẩn chính sách sàn & hoàn thiện cấu trúc JSON..." },
  { upToSeconds: 120, text: "✨ Hoàn thiện trọn bộ 5 kênh phân phối nội dung..." },
];

export default function VideoRepurposerOutput({
  result,
  loading,
  productName,
  onUseSample,
  elapsedSeconds = 0,
  onCancel,
}: VideoRepurposerOutputProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "group" | "fanpage" | "carousel" | "blog" | "zalo" | "policy"
  >("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse dữ liệu đầu ra với bộ Resilient Parser 4 tầng bền bỉ
  const data: VideoRepurposerData = useMemo(() => {
    return parseVideoRepurposerResult(result);
  }, [result]);

  // Chuyển đổi dữ liệu chuẩn hóa sang văn bản Markdown sạch đẹp (100% không bao giờ hiển thị JSON thô)
  const cleanMarkdown = useMemo(() => {
    if (!result) return "";
    return formatRepurposerMarkdownText(data);
  }, [result, data]);

  const wordCount = useMemo(() => {
    return cleanMarkdown ? cleanMarkdown.trim().split(/\s+/).length : 0;
  }, [cleanMarkdown]);

  // Tự động cuộn lên đầu dòng 1 khi chuyển sang chế độ Markdown
  useEffect(() => {
    if (viewMode === "raw" && textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  }, [viewMode, cleanMarkdown]);

  // Phím Esc để đóng toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!cleanMarkdown) return;
    navigator.clipboard.writeText(cleanMarkdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!cleanMarkdown) return;
    const blob = new Blob([cleanMarkdown], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (productName || data.productName || "5-kenh")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .slice(0, 30);
    a.download = `AIChoShop-5Kenh-${safeName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const rows = [
      {
        STT: 1,
        "Kênh Phân Phối": "Facebook Group",
        "Định Dạng": "Bài Viết Seeding / Tâm Sự Thực Tế",
        "Mục Tiêu": "Tạo thảo luận tự nhiên, tránh bóp reach, tăng tương tác",
        "Sản Phẩm": productName || data.productName || "Sản phẩm",
        "Nội Dung Chính": `${data.fbGroupPost.headline ? `[${data.fbGroupPost.headline}]\n\n` : ""}${data.fbGroupPost.bodyText}\n\n${data.fbGroupPost.discussionHook}`,
        "Ghi Chú Triển Khai":
          data.fbGroupPost.seedingComments
            ?.map((c) => `[${c.role}]: "${c.comment}"`)
            .join(" | ") || "Kèm 3 kịch bản cmt mồi",
      },
      {
        STT: 2,
        "Kênh Phân Phối": "Fanpage Facebook",
        "Định Dạng": "Bài Viết Bán Hàng / Tối Ưu Click & Inbox",
        "Mục Tiêu": "Tối ưu Click link & Inbox tư vấn",
        "Sản Phẩm": productName || data.productName || "Sản phẩm",
        "Nội Dung Chính": `${data.fanpagePost.hookLine}\n\n${data.fanpagePost.bodyHighlights.join("\n")}\n\n${data.fanpagePost.offerDetails}\n\n${data.fanpagePost.callToAction}\n\n${data.fanpagePost.hashtags.join(" ")}`,
        "Ghi Chú Triển Khai": "Ghim link ở cmt đầu tiên",
      },
      ...data.carouselPost.slides.map((s, idx) => ({
        STT: 3 + idx * 0.1,
        "Kênh Phân Phối": `Carousel (Slide ${s.slideNumber})`,
        "Định Dạng": s.typeLabel || `Slide ${s.slideNumber}`,
        "Mục Tiêu": "Giữ chân người xem lướt slide & lưu bài",
        "Sản Phẩm": productName || data.productName || "Sản phẩm",
        "Nội Dung Chính": `Headline: ${s.headline}\nNội dung: ${s.bodyContent}`,
        "Ghi Chú Triển Khai": `Visual: ${s.visualDescription}`,
      })),
      {
        STT: 4,
        "Kênh Phân Phối": "Blog / Website SEO",
        "Định Dạng": "Bài Viết Review Chuẩn SEO",
        "Mục Tiêu": "Lên Top Google tìm kiếm, kéo traffic tự nhiên",
        "Sản Phẩm": productName || data.productName || "Sản phẩm",
        "Nội Dung Chính": `Tiêu đề: ${data.seoBlogPost.seoTitle}\nMeta: ${data.seoBlogPost.metaDescription}\n\n${data.seoBlogPost.introduction}\n\n${data.seoBlogPost.mainContent}\n\nPros: ${data.seoBlogPost.pros.join(" | ")}\nCons: ${data.seoBlogPost.cons.join(" | ")}\n\nVerdict: ${data.seoBlogPost.verdict}`,
        "Ghi Chú Triển Khai": `Điểm đánh giá: ${data.seoBlogPost.ratingScore || "9.4/10"}`,
      },
      {
        STT: 5,
        "Kênh Phân Phối": "Zalo OA / CSKH",
        "Định Dạng": "Tin Nhắn Tương Tác / Gửi Deal Riêng",
        "Mục Tiêu": "Chốt đơn khách cũ, remarketing 0 đồng",
        "Sản Phẩm": productName || data.productName || "Sản phẩm",
        "Nội Dung Chính": `${data.zaloOaMessage.customerGreeting}\n\n${data.zaloOaMessage.videoValueRecap}\n\n${data.zaloOaMessage.exclusiveDeal}\n\n${data.zaloOaMessage.ctaText}`,
        "Ghi Chú Triển Khai": "Gửi vào khung giờ 11h45 hoặc 19h30",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 35 },
      { wch: 40 },
      { wch: 25 },
      { wch: 80 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "5KenhDaKenh");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `AIChoShop_5Kenh_${dateStr}.xlsx`);
  };

  return (
    <div className="bg-black rounded-2xl shadow-2xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800 text-white">
      {/* 1. HEADER THANH CÔNG CỤ TỐI GIẢN (CHỮ TRẮNG NỀN ĐEN + ICON) */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex flex-col gap-1.5 shrink-0">
        {/* Hàng 1: Tiêu đề + Các nút thao tác */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Trái: Icon + Tiêu đề */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
              <Share2 size={13} className="text-white sm:w-3.5 sm:h-3.5" />
            </div>
            <h2 className="font-bold text-xs sm:text-sm text-white tracking-wide uppercase truncate whitespace-nowrap">
              <span className="hidden sm:inline">Biến Video Thành 5 Kênh</span>
              <span className="sm:hidden">5 Kênh</span>
            </h2>
          </div>

          {/* Phải: Nhóm nút thao tác gọn gàng */}
          {result && !loading && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Nút Sao Chép Tất Cả (Icon-only) */}
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ nội dung" : "Sao chép toàn bộ nội dung"}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${
                  copiedAll
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
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">Excel</span>
              </button>

              {/* Nút Tải TXT */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                title="Tải về file TXT"
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Download size={13} />
                <span className="hidden sm:inline">TXT</span>
              </button>

              {/* Toggle Chế độ xem: Thẻ / Markdown */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("visual")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === "visual"
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Chế độ thẻ trực quan"
                >
                  <LayoutGrid size={11} />
                  <span>Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("raw")}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === "raw"
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Chế độ văn bản Markdown thuần"
                >
                  <Code2 size={11} />
                  <span>Markdown</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hàng 2: Thanh Tab Lọc 5 Kênh - Gọn gàng, lướt ngang mượt mà trên mobile */}
        {result && !loading && viewMode === "visual" && (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pt-0.5 border-t border-slate-900">
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label="Tất Cả"
              count={5}
            />
            <TabButton
              active={activeTab === "group"}
              onClick={() => setActiveTab("group")}
              icon={<Users size={12} />}
              label="1. FB Group"
            />
            <TabButton
              active={activeTab === "fanpage"}
              onClick={() => setActiveTab("fanpage")}
              icon={<Megaphone size={12} />}
              label="2. Fanpage"
            />
            <TabButton
              active={activeTab === "carousel"}
              onClick={() => setActiveTab("carousel")}
              icon={<Images size={12} />}
              label="3. Carousel"
              count={5}
            />
            <TabButton
              active={activeTab === "blog"}
              onClick={() => setActiveTab("blog")}
              icon={<FileText size={12} />}
              label="4. Review SEO"
            />
            <TabButton
              active={activeTab === "zalo"}
              onClick={() => setActiveTab("zalo")}
              icon={<MessageCircle size={12} />}
              label="5. Zalo OA"
            />
            <TabButton
              active={activeTab === "policy"}
              onClick={() => setActiveTab("policy")}
              icon={<ShieldCheck size={12} />}
              label="Tuân Thủ"
              count={`${data.policyCompliance?.safeScore || 96}%`}
            />
          </div>
        )}
      </div>

      {/* 2. BODY NỘI DUNG HIỂN THỊ (TỐI ƯU CẢ MOBILE & DESKTOP - FULL CHIỀU CAO CHO MARKDOWN) */}
      <div
        className={`flex-1 min-h-0 p-3 sm:p-4 flex flex-col ${
          viewMode === "raw" ? "h-full overflow-hidden" : "lg:overflow-y-auto custom-scrollbar"
        }`}
      >
        {/* Chưa có kết quả */}
        {!result && !loading && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white mb-1">
              <Share2 size={22} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Chưa Có Nội Dung Đa Kênh
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Dán kịch bản video ở cột bên trái rồi nhấn nút chuyển đổi. Hệ thống AI sẽ viết lại 5 định dạng chuẩn từng sàn.
            </p>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-200 text-black px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={13} /> Chạy thử mẫu (Demo)
              </button>
            )}
          </div>
        )}

        {/* Trạng thái đang tải */}
        {loading && (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Chuyển Đổi Sang 5 Định Dạng Đa Kênh..."
            stages={REPURPOSER_STAGES}
            accentColor="rose"
            minHeightClass="min-h-[360px]"
          />
        )}

        {/* Hiển thị kết quả */}
        {result && !loading && (
          <div
            className={
              viewMode === "raw"
                ? "flex-1 flex flex-col min-h-0 h-full"
                : "space-y-3 sm:space-y-4"
            }
          >
            {/* CHẾ ĐỘ XEM TRỰC QUAN (VISUAL) */}
            {viewMode === "visual" ? (
              <div className="space-y-3 sm:space-y-4">
                {/* 1. FB Group */}
                {(activeTab === "all" || activeTab === "group") && (
                  <SimpleGroupCard
                    data={data.fbGroupPost}
                    onCopy={(text) => handleCopy(text, "group")}
                    isCopied={copiedKey === "group"}
                    onCopyComment={(text, id) => handleCopy(text, `group_cmt_${id}`)}
                    copiedCommentKey={copiedKey}
                  />
                )}

                {/* 2. Fanpage Facebook */}
                {(activeTab === "all" || activeTab === "fanpage") && (
                  <SimpleFanpageCard
                    data={data.fanpagePost}
                    onCopy={(text) => handleCopy(text, "fanpage")}
                    isCopied={copiedKey === "fanpage"}
                    onCopyHashtags={(text) => handleCopy(text, "fanpage_tags")}
                    isHashtagsCopied={copiedKey === "fanpage_tags"}
                  />
                )}

                {/* 3. Carousel 5 Slides */}
                {(activeTab === "all" || activeTab === "carousel") && (
                  <SimpleCarouselCard
                    data={data.carouselPost}
                    onCopyAll={(text) => handleCopy(text, "carousel_all")}
                    isAllCopied={copiedKey === "carousel_all"}
                    onCopySlide={(text, num) => handleCopy(text, `carousel_slide_${num}`)}
                    copiedSlideKey={copiedKey}
                  />
                )}

                {/* 4. Blog Review SEO */}
                {(activeTab === "all" || activeTab === "blog") && (
                  <SimpleBlogCard
                    data={data.seoBlogPost}
                    onCopy={(text) => handleCopy(text, "blog")}
                    isCopied={copiedKey === "blog"}
                  />
                )}

                {/* 5. Zalo OA */}
                {(activeTab === "all" || activeTab === "zalo") && (
                  <SimpleZaloCard
                    data={data.zaloOaMessage}
                    onCopy={(text) => handleCopy(text, "zalo")}
                    isCopied={copiedKey === "zalo"}
                  />
                )}

                {/* 6. Tuân Thủ Sàn */}
                {(activeTab === "all" || activeTab === "policy") && (
                  <SimplePolicyCard
                    data={data.policyCompliance}
                    onCopy={(text) => handleCopy(text, "policy")}
                    isCopied={copiedKey === "policy"}
                  />
                )}
              </div>
            ) : (
              /* CHẾ ĐỘ XEM VĂN BẢN MARKDOWN THUẦN (TEXT THÔ) - FULL CHIỀU CAO HOÀN TOÀN */
              <div className="flex-1 flex flex-col min-h-0 h-full space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Văn bản text thô (Markdown chuẩn):</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 hidden sm:inline-block">
                      {wordCount} từ · 5 kênh đầy đủ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Nút Phóng To Toàn Màn Hình */}
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      title="Phóng to toàn màn hình"
                      className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                    >
                      <Maximize2 size={12} />
                      <span className="hidden sm:inline">Toàn màn hình</span>
                    </button>

                    {/* Nút Sao Chép Toàn Bộ (Icon Only) */}
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                        copiedAll
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-white text-black hover:bg-slate-200"
                      }`}
                    >
                      {copiedAll ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  readOnly
                  value={cleanMarkdown}
                  className="w-full flex-1 min-h-[350px] lg:min-h-0 h-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TOÀN MÀN HÌNH (FULLSCREEN MARKDOWN) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-3 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0">
                <Share2 size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
                  Toàn Màn Hình: Nội Dung 5 Kênh (Markdown)
                </h3>
                <span className="text-[11px] text-slate-400">
                  {wordCount} từ · {cleanMarkdown.length} ký tự
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyAll}
                title={copiedAll ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-black hover:bg-slate-200"
                }`}
              >
                {copiedAll ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                title="Đóng toàn màn hình (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={cleanMarkdown}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 text-xs sm:text-sm font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
          />
        </div>
      )}
    </div>
  );
}

// ==========================================
// NÚT TAB LỌC GỌN GÀNG (MINIMAL TAB BUTTON)
// ==========================================
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  count?: number | string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
        active
          ? "bg-white text-black font-bold shadow-xs"
          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
      }`}
    >
      {icon && <span className={active ? "text-black" : "text-white"}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1 rounded font-mono ${
            active ? "bg-black/20 text-black font-bold" : "bg-black/50 text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ==========================================
// 1. THẺ FB GROUP TỐI GIẢN (TIÊU ĐỀ FULL TRÊN MOBILE)
// ==========================================
function SimpleGroupCard({
  data,
  onCopy,
  isCopied,
  onCopyComment,
  copiedCommentKey,
}: {
  data: VideoRepurposerData["fbGroupPost"];
  onCopy: (text: string) => void;
  isCopied: boolean;
  onCopyComment: (text: string, id: number) => void;
  copiedCommentKey: string | null;
}) {
  const fullPostText = `${data.headline ? `${data.headline}\n\n` : ""}${data.bodyText}${data.discussionHook ? `\n\n${data.discussionHook}` : ""}`;

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Cho phép xuống dòng tự nhiên, hiển thị FULL 100% không bị cắt cụt */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Users size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            1. Facebook Group (Seeding &amp; Tâm Sự)
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopy(fullPostText)}
          title="Sao chép bài viết Group"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Nội dung bài viết */}
      <div className="space-y-2.5">
        {data.headline && (
          <div className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
            {data.headline}
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-2.5 sm:pl-3 border-l-2 border-white select-text">
          {data.bodyText}
        </p>

        {data.discussionHook && (
          <div className="space-y-1 pt-1 border-t border-slate-900">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <MessageSquareQuote size={12} className="text-white" />
              <span>Câu hỏi mồi thảo luận:</span>
            </div>
            <p className="text-xs text-white font-medium italic pl-2.5 border-l-2 border-slate-700 select-text">
              &ldquo;{data.discussionHook}&rdquo;
            </p>
          </div>
        )}

        {/* 3 Bình luận mồi */}
        {data.seedingComments && data.seedingComments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <MessageCircle size={12} className="text-white" />
              <span>Bình luận mồi (Comment Seeding):</span>
            </div>
            <div className="space-y-2">
              {data.seedingComments.map((cmt) => {
                const isCmtCopied = copiedCommentKey === `group_cmt_${cmt.id}`;
                return (
                  <div
                    key={cmt.id}
                    className="bg-slate-900 rounded-lg p-2.5 sm:p-3 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {cmt.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopyComment(cmt.comment, cmt.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                        title="Sao chép bình luận này"
                      >
                        {isCmtCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-xs text-white select-text font-medium leading-relaxed pl-2 border-l-2 border-slate-700">
                      &ldquo;{cmt.comment}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. THẺ FANPAGE TỐI GIẢN (TIÊU ĐỀ & CTA FULL TRÊN MOBILE)
// ==========================================
function SimpleFanpageCard({
  data,
  onCopy,
  isCopied,
  onCopyHashtags,
  isHashtagsCopied,
}: {
  data: VideoRepurposerData["fanpagePost"];
  onCopy: (text: string) => void;
  isCopied: boolean;
  onCopyHashtags: (text: string) => void;
  isHashtagsCopied: boolean;
}) {
  const fullFanpageText = `${data.hookLine}\n\n${data.bodyHighlights.join("\n")}\n\n${data.offerDetails}\n\n${data.callToAction}\n\n${data.hashtags.join(" ")}`;

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Hiển thị full 100% không bị cắt ngắn */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Megaphone size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            2. Fanpage Facebook (Click &amp; Inbox)
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopy(fullFanpageText)}
          title="Sao chép bài Fanpage"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="space-y-2.5">
        {data.hookLine && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Flame size={12} className="text-white" />
              <span>Tiêu đề giật tít (Hook 3s):</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed pl-2.5 border-l-2 border-white select-text break-words">
              {data.hookLine}
            </p>
          </div>
        )}

        {data.bodyHighlights && data.bodyHighlights.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <CheckCircle2 size={12} className="text-white" />
              <span>Nội dung nổi bật:</span>
            </div>
            <div className="bg-slate-900 rounded-lg p-2.5 sm:p-3 border border-slate-800 space-y-1.5">
              {data.bodyHighlights.map((hl, idx) => (
                <div key={idx} className="text-xs text-slate-200 leading-relaxed flex items-start gap-2">
                  <span className="text-white font-bold shrink-0">•</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.offerDetails && (
          <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
            <Gift size={13} className="text-white shrink-0 mt-0.5" />
            <div>
              <span className="text-white font-bold">Ưu đãi: </span>
              <span>{data.offerDetails}</span>
            </div>
          </div>
        )}

        {/* Nút CTA hiển thị đầy đủ trên Mobile, không bị cắt ngắn */}
        {data.callToAction && (
          <div className="bg-white text-black p-2.5 rounded-lg flex items-start justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <MousePointerClick size={14} className="text-black shrink-0 mt-0.5" />
              <span className="text-xs font-bold leading-snug break-words">{data.callToAction}</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black text-white shrink-0 mt-0.5">
              CTA
            </span>
          </div>
        )}

        {data.hashtags && data.hashtags.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
            <div className="flex flex-wrap gap-1 min-w-0">
              {data.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onCopyHashtags(data.hashtags.join(" "))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 flex items-center justify-center shrink-0"
              title={isHashtagsCopied ? "Đã sao chép hashtag" : "Sao chép toàn bộ hashtag"}
            >
              {isHashtagsCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. THẺ CAROUSEL 5 SLIDE TỐI GIẢN (TIÊU ĐỀ FULL TRÊN MOBILE)
// ==========================================
function SimpleCarouselCard({
  data,
  onCopyAll,
  isAllCopied,
  onCopySlide,
  copiedSlideKey,
}: {
  data: VideoRepurposerData["carouselPost"];
  onCopyAll: (text: string) => void;
  isAllCopied: boolean;
  onCopySlide: (text: string, num: number) => void;
  copiedSlideKey: string | null;
}) {
  const fullCarouselText = `Chủ đề: ${data.conceptTitle}\n\n${data.slides
    .map(
      (s) =>
        `[${s.typeLabel || `Slide ${s.slideNumber}`}]\nHeadline: ${s.headline}\nNội dung: ${s.bodyContent}\nGợi ý hình ảnh: ${s.visualDescription}`
    )
    .join("\n\n")}\n\nCaption: ${data.caption}`;

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Hiển thị full 100% không bị cắt ngắn */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Images size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            3. Kịch Bản 5 Slide Carousel (Lemon8 / TikTok / IG)
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopyAll(fullCarouselText)}
          title="Sao chép 5 Slide"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isAllCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="space-y-2.5">
        {data.conceptTitle && (
          <div className="text-xs font-bold text-white pb-1.5 border-b border-slate-900 flex items-start gap-1.5">
            <Sparkles size={12} className="text-white shrink-0 mt-0.5" />
            <span className="leading-snug break-words">Chủ đề: {data.conceptTitle}</span>
          </div>
        )}

        {/* 5 Slide hiển thị theo danh sách dọc rõ ràng, đọc mượt trên mobile */}
        <div className="space-y-2">
          {data.slides.map((s) => {
            const isSlideCopied = copiedSlideKey === `carousel_slide_${s.slideNumber}`;
            const slideCopyText = `${s.typeLabel || `Slide ${s.slideNumber}`}\nHeadline: ${s.headline}\nNội dung: ${s.bodyContent}\nGợi ý hình ảnh: ${s.visualDescription}`;

            return (
              <div
                key={s.slideNumber}
                className="bg-slate-900 rounded-lg p-2.5 sm:p-3 border border-slate-800 space-y-2"
              >
                {/* Dòng 1: STT / Type label + Nút sao chép */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {s.slideNumber}
                    </span>
                    <span className="text-[11px] font-bold text-white leading-snug break-words">
                      {s.typeLabel || `Slide ${s.slideNumber}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopySlide(slideCopyText, s.slideNumber)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-90 shrink-0"
                    title={`Sao chép Slide ${s.slideNumber}`}
                  >
                    {isSlideCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                {/* Headline chữ to đè ảnh & nội dung */}
                <div className="pl-2.5 border-l-2 border-white space-y-1">
                  <div className="text-xs sm:text-sm font-bold text-white uppercase leading-snug break-words">
                    &ldquo;{s.headline}&rdquo;
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed select-text break-words">
                    {s.bodyContent}
                  </div>
                </div>

                {/* Gợi ý ảnh đồ họa */}
                {s.visualDescription && (
                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
                    <Camera size={12} className="text-white shrink-0 mt-0.5" />
                    <span className="leading-snug break-words">Gợi ý ảnh: {s.visualDescription}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Caption */}
        {data.caption && (
          <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs text-slate-200">
            <span className="text-white font-bold">Caption đăng kèm: </span>
            <span className="break-words">{data.caption}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. THẺ REVIEW SEO TỐI GIẢN (TIÊU ĐỀ FULL TRÊN MOBILE)
// ==========================================
function SimpleBlogCard({
  data,
  onCopy,
  isCopied,
}: {
  data: VideoRepurposerData["seoBlogPost"];
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  const fullBlogText = `Tiêu đề SEO: ${data.seoTitle}\nMeta: ${data.metaDescription}\n\n${data.introduction}\n\n${data.mainContent}\n\nƯu điểm:\n${data.pros.map((p) => `- ${p}`).join("\n")}\n\nNhược điểm:\n${data.cons.map((c) => `- ${c}`).join("\n")}\n\nLời khuyên:\n${data.verdict}\n\nĐiểm số: ${data.ratingScore || "9.4/10"}`;

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Hiển thị full 100% không bị cắt ngắn */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <FileText size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            4. Bài Viết Review Chuẩn SEO (Website / Blog)
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopy(fullBlogText)}
          title="Sao chép bài SEO"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="bg-slate-900 rounded-lg p-2.5 sm:p-3 border border-slate-800 space-y-1">
          <div className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
            {data.seoTitle}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed break-words">
            {data.metaDescription}
          </p>
        </div>

        {data.introduction && (
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap pl-2.5 border-l-2 border-slate-700 select-text break-words">
            {data.introduction}
          </p>
        )}

        {data.mainContent && (
          <div className="bg-slate-900/50 rounded-lg p-2.5 sm:p-3 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text break-words">
            {data.mainContent}
          </div>
        )}

        {/* Bảng Ưu & Nhược điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {data.pros && data.pros.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Ưu Điểm (Pros):</span>
              </div>
              {data.pros.map((p, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}

          {data.cons && data.cons.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertCircle size={13} className="text-rose-400" />
                <span>Nhược Điểm (Cons):</span>
              </div>
              {data.cons.map((c, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.verdict && (
          <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-white font-bold">Lời khuyên / Kết luận: </span>
              <span className="break-words">{data.verdict}</span>
            </div>
            {data.ratingScore && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black text-white border border-slate-800 self-start sm:self-auto shrink-0">
                ⭐ {data.ratingScore}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. THẺ ZALO OA TỐI GIẢN (TIÊU ĐỀ FULL TRÊN MOBILE)
// ==========================================
function SimpleZaloCard({
  data,
  onCopy,
  isCopied,
}: {
  data: VideoRepurposerData["zaloOaMessage"];
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  const fullZaloText = `${data.customerGreeting}\n\n${data.videoValueRecap}\n\n${data.exclusiveDeal}\n\n${data.ctaText}`;

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Hiển thị full 100% không bị cắt ngắn */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <MessageCircle size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            5. Tin Nhắn Zalo OA (Chăm Sóc Khách Cũ)
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopy(fullZaloText)}
          title="Sao chép tin nhắn Zalo"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="space-y-2">
        {data.customerGreeting && (
          <p className="text-xs sm:text-sm font-bold text-white break-words">{data.customerGreeting}</p>
        )}
        {data.videoValueRecap && (
          <p className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-slate-700 select-text break-words">
            {data.videoValueRecap}
          </p>
        )}
        {data.exclusiveDeal && (
          <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 text-xs text-white font-semibold flex items-center gap-2">
            <Tag size={13} className="text-white shrink-0" />
            <span className="break-words">{data.exclusiveDeal}</span>
          </div>
        )}
        {data.ctaText && (
          <p className="text-xs font-bold text-white break-words">{data.ctaText}</p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 6. THẺ TUÂN THỦ CHÍNH SÁCH TỐI GIẢN (TIÊU ĐỀ FULL TRÊN MOBILE)
// ==========================================
function SimplePolicyCard({
  data,
  onCopy,
  isCopied,
}: {
  data: VideoRepurposerData["policyCompliance"];
  onCopy: (text: string) => void;
  isCopied: boolean;
}) {
  const tipsText = data.channelTips?.join("\n") || "";

  return (
    <div className="space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-3.5">
      {/* Header thẻ: Hiển thị full 100% không bị cắt ngắn */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800/80 gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <ShieldCheck size={14} className="text-white shrink-0 mt-0.5" />
          <h3 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider leading-snug break-words">
            Tuân Thủ Chính Sách Sàn &amp; Mẹo Phân Phối
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onCopy(tipsText)}
          title="Sao chép mẹo"
          className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer active:scale-95"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        </button>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-300">Điểm an toàn sàn TMĐT:</span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black text-emerald-400 border border-slate-800">
            {data?.safeScore || 96}% Chuẩn Sàn
          </span>
        </div>

        {data?.bannedWordsAvoided && data.bannedWordsAvoided.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Từ cấm sàn đã né tránh:</span>
            <div className="flex flex-wrap gap-1">
              {data.bannedWordsAvoided.map((word, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                >
                  ✓ {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {data?.channelTips && data.channelTips.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-900">
            <span className="text-[11px] text-slate-400">Mẹo phân phối đa kênh:</span>
            <ul className="space-y-1 text-xs text-slate-300">
              {data.channelTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-white font-bold">•</span>
                  <span className="break-words">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
