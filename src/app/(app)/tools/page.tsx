"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  ShieldAlert,
  Video,
  MessageSquareWarning,
  Megaphone,
  Presentation,
  ArrowRight,
  Cpu,
  Flame,
  Send,
  Share2,
  Sparkles,
  HeartHandshake,
  PackageCheck,
  TrendingUp,
  Target,
  Camera,
  MessageSquareCheck,
  Search,
  Crown,
  X,
  FolderArchive,
  Rocket,
} from "lucide-react";

interface ToolItem {
  id: string;
  orderNumber: number;
  name: string;
  description: string;
  category: "all" | "prep" | "seo" | "marketing" | "ops";
  categoryName: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  isFree: boolean;
  platforms: string[];
}

const TOOLS: ToolItem[] = [
  // Giai đoạn 1: Chuẩn bị & Tài chính
  {
    id: "product-validator",
    orderNumber: 2,
    name: "AI Thẩm Định Sản Phẩm",
    description: "Chấm điểm tiềm năng 1-100, bóc tách rủi ro chôn vốn & cước cân nặng ẩn trước khi nhập.",
    category: "prep",
    categoryName: "Chuẩn bị & Giá",
    icon: TrendingUp,
    colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-900/50",
    isFree: false,
    platforms: ["Đa sàn"],
  },
  {
    id: "pricing-calculator",
    orderNumber: 1,
    name: "Tính Giá Bán Sản Phẩm",
    description: "Công cụ tính giá tối ưu (Markup) dựa trên % sàn, % ads và lợi nhuận mong muốn thực tế.",
    category: "prep",
    categoryName: "Chuẩn bị & Giá",
    icon: Calculator,
    colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-900/50",
    isFree: true,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "tax-calculator",
    orderNumber: 3,
    name: "Tính Thuế TMĐT Chuẩn",
    description: "Tự động tính thuế GTGT và TNCN phải nộp, giảm rủi ro bị truy thu pháp lý sau này.",
    category: "prep",
    categoryName: "Chuẩn bị & Giá",
    icon: Calculator,
    colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-900/50",
    isFree: true,
    platforms: ["Đa sàn"],
  },

  // Giai đoạn 2: Tối ưu SEO & Phủ sóng
  {
    id: "competitor-miner",
    orderNumber: 4,
    name: "AI Đọc Vị Đối Thủ & Săn USP",
    description: "Bóc tách review 1-3 sao đối thủ, tìm tử huyệt và thông điệp cạnh tranh độc quyền.",
    category: "seo",
    categoryName: "SEO & Phủ Sóng",
    icon: Target,
    colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-900/50",
    isFree: false,
    platforms: ["Shopee", "Lazada"],
  },
  {
    id: "photo-prompter",
    orderNumber: 5,
    name: "AI Prompt Chụp Ảnh Studio",
    description: "Sinh 5 bộ prompt tiếng Anh chuẩn Midjourney/Flux.1 tiết kiệm tiền thuê mẫu & studio.",
    category: "seo",
    categoryName: "SEO & Phủ Sóng",
    icon: Camera,
    colorClass: "text-violet-500 bg-violet-50 dark:bg-violet-950/50 border-violet-200/60 dark:border-violet-900/50",
    isFree: false,
    platforms: ["Đa sàn"],
  },
  {
    id: "vision-listing",
    orderNumber: 6,
    name: "AI Phân Tích Ảnh (Vision)",
    description: "Upload ảnh sản phẩm, AI tự quét nhận diện sinh toàn bộ tiêu đề & mô tả AIDA chuẩn SEO.",
    category: "seo",
    categoryName: "SEO & Phủ Sóng",
    icon: Sparkles,
    colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-900/50",
    isFree: false,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "seo-optimizer",
    orderNumber: 7,
    name: "AI Tối Ưu SEO & Hashtag",
    description: "Sinh 5 tiêu đề giật tít lên top 1 tìm kiếm và mô tả chứa hashtag chuẩn thuật toán sàn.",
    category: "seo",
    categoryName: "SEO & Phủ Sóng",
    icon: Megaphone,
    colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-900/50",
    isFree: true,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "title-spinner",
    orderNumber: 8,
    name: "Nhân Bản Tiêu Đề Chống Spam",
    description: "Xào nấu tiêu đề, mô tả để lập nhiều shop clone đánh du kích mà không bị phạt thuật toán.",
    category: "seo",
    categoryName: "SEO & Phủ Sóng",
    icon: Cpu,
    colorClass: "text-teal-500 bg-teal-50 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-900/50",
    isFree: false,
    platforms: ["Shopee", "TikTok"],
  },

  // Giai đoạn 3: Marketing & Kéo Traffic
  {
    id: "ad-copy",
    orderNumber: 9,
    name: "AI Mẫu Quảng Cáo Ads",
    description: "Ma trận từ khóa Shopee Ads và 5 câu Hook 3s kèm Caption TikTok Spark Ads kéo đơn.",
    category: "marketing",
    categoryName: "Video & Marketing",
    icon: Flame,
    colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-950/50 border-orange-200/60 dark:border-orange-900/50",
    isFree: false,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "script-writer",
    orderNumber: 10,
    name: "AI Kịch Bản Video Hook 3s",
    description: "Kịch bản quay TikTok Reels với 3s đầu Hook gắt giữ chân người xem và chốt giỏ hàng.",
    category: "marketing",
    categoryName: "Video & Marketing",
    icon: Video,
    colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200/60 dark:border-purple-900/50",
    isFree: false,
    platforms: ["TikTok", "Shopee"],
  },
  {
    id: "koc-planner",
    orderNumber: 11,
    name: "AI Lập Kế Hoạch KOC",
    description: "Phân bổ ngân sách thuê KOC hay KOL, ước tính tỷ lệ chuyển đổi ROI thực tế nhất.",
    category: "marketing",
    categoryName: "Video & Marketing",
    icon: Presentation,
    colorClass: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-900/50",
    isFree: false,
    platforms: ["TikTok", "Shopee"],
  },
  {
    id: "video-repurposer",
    orderNumber: 12,
    name: "AI Biến Video Thành 5 Kênh",
    description: "Chuyển 1 kịch bản video TikTok thành 5 định dạng: Facebook Group, Fanpage, Zalo OA...",
    category: "marketing",
    categoryName: "Video & Marketing",
    icon: Share2,
    colorClass: "text-pink-500 bg-pink-50 dark:bg-pink-950/50 border-pink-200/60 dark:border-pink-900/50",
    isFree: false,
    platforms: ["Đa sàn"],
  },

  // Giai đoạn 4: Vận hành & Kháng nghị
  {
    id: "objection-killer",
    orderNumber: 13,
    name: "Bẻ Gãy Từ Chối & Chốt Đơn 1-1",
    description: "Xử lý câu nói 'đắt quá', 'suy nghĩ thêm' trong tin nhắn chat sàn, chốt khách trong 3 phút.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: MessageSquareCheck,
    colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-900/50",
    isFree: false,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "policy-checker",
    orderNumber: 14,
    name: "AI Soi Từ Cấm Sàn",
    description: "Rà soát từ cấm theo chính sách kiểm duyệt TikTok Shop, Shopee và tự viết lại bản an toàn.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: ShieldAlert,
    colorClass: "text-red-500 bg-red-50 dark:bg-red-950/50 border-red-200/60 dark:border-red-900/50",
    isFree: true,
    platforms: ["TikTok", "Shopee"],
  },
  {
    id: "chat-broadcast",
    orderNumber: 15,
    name: "Chat Broadcast & Zalo OA",
    description: "Soạn tin nhắn kéo khách cũ mua lại dưới 350 ký tự chuẩn đắc nhân tâm, không lo bị spam.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: Send,
    colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-900/50",
    isFree: false,
    platforms: ["Shopee", "Đa sàn"],
  },
  {
    id: "review-replier",
    orderNumber: 16,
    name: "AI Xử Lý Review 1 Sao",
    description: "Phản hồi đánh giá xấu đắc nhân tâm để xoa dịu khách hàng và cứu vớt uy tín shop.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: MessageSquareWarning,
    colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-900/50",
    isFree: true,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "appeal-generator",
    orderNumber: 17,
    name: "AI Kháng Nghị Vi Phạm Sàn",
    description: "Tự động viết đơn giải trình xin mở khóa shop/sản phẩm bám sát chính sách sàn.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: ShieldAlert,
    colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-900/50",
    isFree: false,
    platforms: ["TikTok", "Shopee"],
  },
  {
    id: "unboxing-card",
    orderNumber: 18,
    name: "AI Thư Cảm Ơn Nhét Hộp",
    description: "Thiết kế thiệp cảm ơn 2 mặt: Chặn 1 sao, kéo đánh giá 5 sao kèm ảnh và dẫn về Zalo.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: HeartHandshake,
    colorClass: "text-pink-500 bg-pink-50 dark:bg-pink-950/50 border-pink-200/60 dark:border-pink-900/50",
    isFree: false,
    platforms: ["Đa sàn"],
  },
  {
    id: "anti-return-nudge",
    orderNumber: 19,
    name: "AI Chống Hoàn Hàng COD",
    description: "Kịch bản cứu đơn: Nhắc khách nhận hàng, cứu khi khách hủy và xử lý shipper báo ảo.",
    category: "ops",
    categoryName: "Chăm Sóc & Kháng Nghị",
    icon: PackageCheck,
    colorClass: "text-teal-500 bg-teal-50 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-900/50",
    isFree: false,
    platforms: ["Shopee", "TikTok"],
  },
  {
    id: "product-launchpad",
    orderNumber: 20,
    name: "AI Ra Mắt 5-in-1 (Launchpad)",
    description: "Nhập thông tin 1 lần, tự động sinh trọn bộ: Listing SEO, 3 Kịch bản Video, 3 Mẫu Ads, Thư cảm ơn & Kịch bản COD.",
    category: "prep",
    categoryName: "Chuẩn bị & Ra Mắt",
    icon: Rocket,
    colorClass: "text-brand bg-brand/10 border-brand/30 shadow-xs",
    isFree: false,
    platforms: ["Shopee", "TikTok", "Lazada"],
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả", count: 20 },
  { key: "prep", label: "1. Chuẩn bị & Giá", count: 4 },
  { key: "seo", label: "2. SEO & Phủ sóng", count: 5 },
  { key: "marketing", label: "3. Video & Traffic", count: 4 },
  { key: "ops", label: "4. Kháng nghị & CSKH", count: 7 },
] as const;

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "prep" | "seo" | "marketing" | "ops">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "vip">("all");

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return TOOLS.filter((tool) => {
      // Lọc theo Tab Category
      if (selectedCategory !== "all" && tool.category !== selectedCategory) {
        return false;
      }

      // Lọc theo Gói Free / VIP
      if (tierFilter === "free" && !tool.isFree) return false;
      if (tierFilter === "vip" && tool.isFree) return false;

      // Lọc theo Từ khóa
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.platforms.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, tierFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 pb-8">
      {/* UNIFIED COMPACT HEADER & FILTERS: 1 KHỐI DUY NHẤT */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
        {/* Row 1: Title, Count, Kho Lưu Trữ shortcut & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Kho Công Cụ AI Thực Chiến
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
              {TOOLS.length} Tools
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700/80 shrink-0 cursor-pointer h-8"
            >
              <FolderArchive size={13} className="text-brand" />
              <span>Kho Lưu Trữ</span>
            </Link>

            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh công cụ..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-8 pr-7 py-1 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors h-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Category Tabs + Tier Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded ${
                      isActive
                        ? "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tier Filter: Tất cả | Free | VIP */}
          <div className="flex items-center gap-1 shrink-0 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setTierFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                tierFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTierFilter("free")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                tierFilter === "free"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              FREE
            </button>
            <button
              onClick={() => setTierFilter("vip")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                tierFilter === "vip"
                  ? "bg-white dark:bg-slate-900 text-amber-500 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Crown size={11} className="fill-amber-500" /> VIP
            </button>
          </div>
        </div>
      </div>

      {/* 3. DENSE GRID CÔNG CỤ (3-4 CỘT, COMPACT, THẤP GỌN, KHÔNG DÀI TRANG) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
        {filteredTools.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand/40 dark:hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card: Icon + Step # + Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tool.colorClass} shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <ToolIcon size={18} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                      #{tool.orderNumber}
                    </span>
                    {tool.isFree ? (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                        FREE
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200/50 dark:border-amber-800/50 flex items-center gap-0.5">
                        <Crown size={9} className="fill-amber-500" /> VIP
                      </span>
                    )}
                  </div>
                </div>

                {/* Tên công cụ */}
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-brand transition-colors line-clamp-1">
                  {tool.name}
                </h3>

                {/* Mô tả ngắn gọn */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Footer: Sàn hỗ trợ + Action arrow */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-1 truncate max-w-[70%]">
                  {tool.platforms.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.2 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <span className="inline-flex items-center gap-0.5 font-bold text-slate-400 group-hover:text-brand transition-colors shrink-0">
                  Dùng ngay <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Khi không tìm thấy công cụ */}
      {filteredTools.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            Không tìm thấy công cụ nào với từ khóa &quot;{searchQuery}&quot;
          </p>
          <p className="text-xs text-slate-400">
            Hãy thử tìm bằng từ khác như: seo, video, kháng nghị, giá, thuế...
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setTierFilter("all");
            }}
            className="text-xs font-bold text-brand hover:underline mt-1 inline-block cursor-pointer"
          >
            Xem lại tất cả 19 công cụ
          </button>
        </div>
      )}
    </div>
  );
}
