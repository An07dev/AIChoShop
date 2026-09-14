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
  Bookmark,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
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
  { id: "all", name: "Tất Cả 5 Kênh", icon: Layers, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "group", name: "1. FB Group", icon: Users, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { id: "fanpage", name: "2. Fanpage", icon: Megaphone, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  { id: "carousel", name: "3. Carousel", icon: Images, color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
  { id: "blog", name: "4. Review SEO", icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { id: "zalo", name: "5. Zalo OA", icon: MessageCircle, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
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
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Tách nội dung thành 5 phần riêng biệt dựa trên tiêu đề Markdown
  const sections = useMemo(() => {
    if (!result) return { group: "", fanpage: "", carousel: "", blog: "", zalo: "" };

    const splitByHeader = (text: string, titleKeywords: string[]) => {
      for (const kw of titleKeywords) {
        const idx = text.indexOf(kw);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const groupIdx = splitByHeader(result, ["ĐỊNH DẠNG 1", "FACEBOOK GROUP", "BÀI ĐĂNG FACEBOOK GROUP"]);
    const fanpageIdx = splitByHeader(result, ["ĐỊNH DẠNG 2", "FANPAGE FACEBOOK", "BÀI ĐĂNG FANPAGE"]);
    const carouselIdx = splitByHeader(result, ["ĐỊNH DẠNG 3", "CAROUSEL", "CHUỖI ẢNH CAROUSEL"]);
    const blogIdx = splitByHeader(result, ["ĐỊNH DẠNG 4", "REVIEW CHUẨN SEO", "BÀI VIẾT REVIEW"]);
    const zaloIdx = splitByHeader(result, ["ĐỊNH DẠNG 5", "ZALO OA", "TIN NHẮN ZALO"]);

    const cleanSection = (str: string) => str.trim().replace(/^---\s*/gm, "");

    const group = groupIdx !== -1 && fanpageIdx !== -1 ? cleanSection(result.substring(groupIdx, fanpageIdx)) : "";
    const fanpage = fanpageIdx !== -1 && carouselIdx !== -1 ? cleanSection(result.substring(fanpageIdx, carouselIdx)) : "";
    const carousel = carouselIdx !== -1 && blogIdx !== -1 ? cleanSection(result.substring(carouselIdx, blogIdx)) : "";
    const blog = blogIdx !== -1 && zaloIdx !== -1 ? cleanSection(result.substring(blogIdx, zaloIdx)) : "";
    const zalo = zaloIdx !== -1 ? cleanSection(result.substring(zaloIdx)) : "";

    return {
      group: group || result,
      fanpage,
      carousel,
      blog,
      zalo,
    };
  }, [result]);

  const handleCopy = (text: string, sectionKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExportExcel = () => {
    if (!result) return;

    const rows = [
      {
        STT: 1,
        "Kênh Phân Phối": "Facebook Group",
        "Định Dạng": "Bài Viết Seeding / Chia Sẻ Kinh Nghiệm",
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

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const charCount = result ? result.length : 0;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng gradient nền */}
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <Share2 size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Nội Dung 5 Kênh</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Omnichannel 5-in-1
          </span>
          {productName && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[140px]">
              {productName}
            </span>
          )}
        </div>

        {/* Nút Xuất Excel & Sao chép toàn bộ */}
        {result && !loading && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold px-3 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Xuất bảng nội dung 5 kênh ra file Excel (.xlsx)"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(result, "all_full")}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black px-3 py-1 rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {copiedSection === "all_full" ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              <span>{copiedSection === "all_full" ? "Đã Chép Hết!" : "Sao Chép Toàn Bộ"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Thanh chuyển Tab 5 kênh */}
      {result && !loading && (
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/50 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0 relative z-10">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const isSelected = activeTab === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveTab(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 text-amber-400 border border-amber-500/40 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon size={13} className={isSelected ? "text-amber-400" : "text-slate-400"} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Vùng nội dung cuộn nội bộ */}
      <div className="p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar overscroll-contain">
        {/* Chưa có kết quả */}
        {!result && !loading && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1 shadow-lg shadow-amber-500/10">
              <Share2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Chưa Có Nội Dung Đa Kênh
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Dán kịch bản hoặc lời thoại video TikTok ở cột bên trái rồi nhấn{" "}
              <strong className="text-amber-400">&quot;Chuyển Đổi Sang 5 Định Dạng Kênh&quot;</strong>. Hệ thống AI sẽ tự động phân tích và viết lại chuẩn từng nền tảng.
            </p>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Chạy thử với dữ liệu mẫu (Demo)
              </button>
            )}
          </div>
        )}

        {/* Trạng thái đang tải (Loading) - Biểu tượng xoay tròn */}
        {loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Share2 size={28} className="animate-spin text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Chuyển Đổi Sang 5 Định Dạng Đa Kênh...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang tối ưu cho Facebook Group Seeding, Fanpage Ads & Inbox, Carousel Album, Review SEO & Zalo OA...
              </p>
            </div>
          </div>
        )}

        {/* Hiển thị kết quả */}
        {result && !loading && (
          <div className="space-y-5">
            {/* Thống kê nhanh */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span>
                  Độ dài: <strong className="text-white font-mono">{charCount}</strong> ký tự
                </span>
                <span>
                  Số từ: <strong className="text-white font-mono">{wordCount}</strong> từ
                </span>
              </div>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Đã tối ưu thuật toán từng sàn
              </span>
            </div>

            {/* TAB: TẤT CẢ 5 KÊNH */}
            {activeTab === "all" && (
              <div className="space-y-4">
                {/* 1. FB Group */}
                {sections.group && (
                  <ContentCard
                    title="Định dạng 1: Bài Đăng Facebook Group (Seeding / Tâm sự thật)"
                    icon={Users}
                    color="border-blue-500/40 bg-blue-950/20 text-blue-400"
                    tag="Seeding Tự Nhiên"
                    content={sections.group}
                    onCopy={() => handleCopy(sections.group, "group")}
                    isCopied={copiedSection === "group"}
                  />
                )}

                {/* 2. Fanpage Facebook */}
                {sections.fanpage && (
                  <ContentCard
                    title="Định dạng 2: Bài Đăng Fanpage Facebook (Tối ưu Click & Inbox)"
                    icon={Megaphone}
                    color="border-indigo-500/40 bg-indigo-950/20 text-indigo-400"
                    tag="Tối Ưu Ads & Inbox"
                    content={sections.fanpage}
                    onCopy={() => handleCopy(sections.fanpage, "fanpage")}
                    isCopied={copiedSection === "fanpage"}
                  />
                )}

                {/* 3. Carousel */}
                {sections.carousel && (
                  <ContentCard
                    title="Định dạng 3: Kịch Bản Chuỗi Ảnh Carousel (Lemon8 / FB / Instagram)"
                    icon={Images}
                    color="border-pink-500/40 bg-pink-950/20 text-pink-400"
                    tag="5 Slide Giữ Chân"
                    content={sections.carousel}
                    onCopy={() => handleCopy(sections.carousel, "carousel")}
                    isCopied={copiedSection === "carousel"}
                  />
                )}

                {/* 4. Blog SEO */}
                {sections.blog && (
                  <ContentCard
                    title="Định dạng 4: Bài Viết Review Chuẩn SEO (Website / Blog Affiliate)"
                    icon={FileText}
                    color="border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                    tag="SEO Top 1 Google"
                    content={sections.blog}
                    onCopy={() => handleCopy(sections.blog, "blog")}
                    isCopied={copiedSection === "blog"}
                  />
                )}

                {/* 5. Zalo OA */}
                {sections.zalo && (
                  <ContentCard
                    title="Định dạng 5: Tin Nhắn Zalo OA / Chăm Sóc Khách Hàng"
                    icon={MessageCircle}
                    color="border-cyan-500/40 bg-cyan-950/20 text-cyan-400"
                    tag="Voucher Bí Mật"
                    content={sections.zalo}
                    onCopy={() => handleCopy(sections.zalo, "zalo")}
                    isCopied={copiedSection === "zalo"}
                  />
                )}

                {/* Khối xem thô đầy đủ nếu tách không đúng */}
                {!sections.fanpage && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-amber-500/30 selection:text-amber-200">
                    {result}
                  </div>
                )}
              </div>
            )}

            {/* TAB LỌC: 1. FB GROUP */}
            {activeTab === "group" && (
              <ContentCard
                title="Bài Đăng Facebook Group (Phong cách Seeding / Tâm sự thật)"
                icon={Users}
                color="border-blue-500/40 bg-blue-950/20 text-blue-400"
                tag="Tránh Kiểm Duyệt Admin"
                content={sections.group || result}
                onCopy={() => handleCopy(sections.group || result, "group")}
                isCopied={copiedSection === "group"}
              />
            )}

            {/* TAB LỌC: 2. FANPAGE */}
            {activeTab === "fanpage" && (
              <ContentCard
                title="Bài Đăng Fanpage Facebook (Tối ưu Click & Inbox)"
                icon={Megaphone}
                color="border-indigo-500/40 bg-indigo-950/20 text-indigo-400"
                tag="3-4 Gạch Đầu Dòng Icon"
                content={sections.fanpage || result}
                onCopy={() => handleCopy(sections.fanpage || result, "fanpage")}
                isCopied={copiedSection === "fanpage"}
              />
            )}

            {/* TAB LỌC: 3. CAROUSEL */}
            {activeTab === "carousel" && (
              <ContentCard
                title="Kịch Bản Chuỗi Ảnh Carousel (Lemon8 / Facebook Album / Instagram)"
                icon={Images}
                color="border-pink-500/40 bg-pink-950/20 text-pink-400"
                tag="5 Slide Dưới 20 Từ"
                content={sections.carousel || result}
                onCopy={() => handleCopy(sections.carousel || result, "carousel")}
                isCopied={copiedSection === "carousel"}
              />
            )}

            {/* TAB LỌC: 4. BLOG SEO */}
            {activeTab === "blog" && (
              <ContentCard
                title="Bài Viết Review Chuẩn SEO (Đăng Website / Blog Affiliate)"
                icon={FileText}
                color="border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                tag="Bảng Pros & Cons"
                content={sections.blog || result}
                onCopy={() => handleCopy(sections.blog || result, "blog")}
                isCopied={copiedSection === "blog"}
              />
            )}

            {/* TAB LỌC: 5. ZALO OA */}
            {activeTab === "zalo" && (
              <ContentCard
                title="Tin Nhắn Zalo OA / Tin Nhắn Chăm Sóc Khách Hàng"
                icon={MessageCircle}
                color="border-cyan-500/40 bg-cyan-950/20 text-cyan-400"
                tag="Em - Anh/Chị Thân Tình"
                content={sections.zalo || result}
                onCopy={() => handleCopy(sections.zalo || result, "zalo")}
                isCopied={copiedSection === "zalo"}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContentCardProps {
  title: string;
  icon: any;
  color: string;
  tag: string;
  content: string;
  onCopy: () => void;
  isCopied: boolean;
}

function ContentCard({ title, icon: Icon, color, tag, content, onCopy, isCopied }: ContentCardProps) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700 transition-all">
      {/* Header thẻ */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1 rounded-lg border ${color}`}>
            <Icon size={14} />
          </div>
          <span className="font-bold text-xs text-white truncate">{title}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
            {tag}
          </span>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1 cursor-pointer shrink-0"
        >
          {isCopied ? <Check size={12} className="text-emerald-400 stroke-[3]" /> : <Copy size={12} />}
          <span>{isCopied ? "Đã Chép!" : "Chép Mục Này"}</span>
        </button>
      </div>

      {/* Nội dung thẻ */}
      <div className="p-4 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {content}
      </div>
    </div>
  );
}
