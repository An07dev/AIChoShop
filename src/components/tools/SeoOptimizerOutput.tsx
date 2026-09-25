import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Download,
  Sparkles,
  Search,
  Layers,
  FileText,
  Hash,
  Tag,
  FileSpreadsheet,
  CheckCircle2,
  LayoutGrid,
  Code2,
  ShieldCheck,
  Users,
  Flame,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/context/ToastContext";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import { ToolLoadingState } from "@/components/tools/ToolLoadingState";
import {
  SEO_PLATFORMS,
  charCount,
  seoFilename,
  seoToText,
  type SeoSnapshot,
} from "@/lib/seo/contract";

const TITLE_STRATEGY_NAMES = [
  { tag: "Đẩy Top Sàn", role: "SEO Thuật Toán (Search-Driven)" },
  { tag: "Tăng CTR", role: "Kéo Click CTR (Impulse / Săn Deal)" },
  { tag: "Chuẩn Ads", role: "Đấu Thầu Quảng Cáo (High Ads Quality)" },
  { tag: "Độc Quyền", role: "Đột Phá USP (Lợi Thế Cạnh Tranh)" },
  { tag: "Chốt Đơn", role: "Toàn Diện & Chốt Đơn (Conversion Master)" },
];

export function SeoOptimizerOutput({
  snapshot,
  loading,
  elapsedSeconds,
  onCancel,
  onUseSample,
}: {
  snapshot: SeoSnapshot | null;
  loading: boolean;
  elapsedSeconds?: number;
  onCancel?: () => void;
  onUseSample?: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [descViewMode, setDescViewMode] = useState<"aida" | "sections">("aida");
  const [activeFilter, setActiveFilter] = useState<"all" | "titles" | "desc" | "hashtags">("all");
  const { showError, showSuccess } = useToast();

  const result = snapshot?.output;
  const platform = snapshot?.inputs.platform || "shopee";
  const platformInfo = SEO_PLATFORMS[platform] || SEO_PLATFORMS.shopee;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      showError("Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.");
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(seoToText(result));
      setCopiedAll(true);
      showSuccess("Đã sao chép toàn bộ bộ Listing SEO!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showError("Không thể sao chép toàn bộ. Vui lòng thử lại.");
    }
  };

  const handleDownloadTxt = () => {
    if (!snapshot || !result) return;
    const blob = new Blob([seoToText(result)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = seoFilename(snapshot.inputs);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showSuccess("Đã tải xuống file TXT!");
  };

  const handleExportExcel = () => {
    if (!result) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tiêu đề phong phú
      const titlesData = (result.richTitles || result.titles.map((t, i) => ({
        id: i + 1,
        style: TITLE_STRATEGY_NAMES[i]?.role || "Tiêu đề",
        tag: TITLE_STRATEGY_NAMES[i]?.tag || "SEO",
        title: t,
        charCount: t.length,
        hookKeywords: "",
        targetAudience: "",
      }))).map((t: any) => ({
        "STT": t.id,
        "Chiến Lược": t.style,
        "Nhãn": t.tag,
        "Tiêu Đề Listing": t.title,
        "Số Ký Tự": t.charCount || t.title.length,
        "Từ Khóa Nhắm Đến": t.hookKeywords || "",
        "Khách Hàng Mục Tiêu": t.targetAudience || "",
      }));
      const wsTitles = XLSX.utils.json_to_sheet(titlesData);
      XLSX.utils.book_append_sheet(wb, wsTitles, "Tieu_De_SEO");

      // Sheet 2: Mô tả sản phẩm chuẩn AIDA
      const descData: any[] = [];
      if (result.descriptionAida) {
        if (result.descriptionAida.attentionHook) {
          descData.push({ "Phân Tầng": "1. Attention Hook (Thu Hút)", "Nội Dung / Đặc Tính": "Câu mở đầu đánh trúng nhu cầu", "Chi Tiết / Lợi Ích": result.descriptionAida.attentionHook });
        }
        if (result.descriptionAida.uspStory) {
          descData.push({ "Phân Tầng": "2. Interest USP (Độc Quyền)", "Nội Dung / Đặc Tính": "Câu chuyện chất liệu & nguồn gốc", "Chi Tiết / Lợi Ích": result.descriptionAida.uspStory });
        }
        if (result.descriptionAida.featureBullets) {
          result.descriptionAida.featureBullets.forEach((f, idx) => {
            descData.push({ "Phân Tầng": `3. Desire (Tính Năng #${idx + 1})`, "Nội Dung / Đặc Tính": f.feature, "Chi Tiết / Lợi Ích": f.benefit });
          });
        }
        if (result.descriptionAida.sizeAndSpecs) {
          result.descriptionAida.sizeAndSpecs.forEach((s) => {
            descData.push({ "Phân Tầng": "3. Desire (Thông Số & Size)", "Nội Dung / Đặc Tính": "Quy cách kỹ thuật", "Chi Tiết / Lợi Ích": s });
          });
        }
        if (result.descriptionAida.commitments) {
          result.descriptionAida.commitments.forEach((c) => {
            descData.push({ "Phân Tầng": "4. Action (Cam Kết Bán Hàng)", "Nội Dung / Đặc Tính": "Chính sách an tâm", "Chi Tiết / Lợi Ích": c });
          });
        }
        if (result.descriptionAida.ctaCloser) {
          descData.push({ "Phân Tầng": "4. Action (Kêu Gọi Hành Động)", "Nội Dung / Đặc Tính": "Lời kêu gọi chốt đơn", "Chi Tiết / Lợi Ích": result.descriptionAida.ctaCloser });
        }
      } else {
        (result.descriptions || []).forEach((d, i) => {
          descData.push({
            "Phân Tầng": `Mục ${i + 1}`,
            "Nội Dung / Đặc Tính": d.title,
            "Chi Tiết / Lợi Ích": d.content,
          });
        });
      }
      const wsDesc = XLSX.utils.json_to_sheet(descData);
      XLSX.utils.book_append_sheet(wb, wsDesc, "Mo_Ta_AIDA");

      // Sheet 3: Từ khóa & Hashtags
      const kwData = [
        ...((result.keywordMatrix?.coreKeywords || []).map((k) => ({ "Phân Loại": "Từ Khóa Chính (High Search)", "Nội Dung": k }))),
        ...((result.keywordMatrix?.longtailKeywords || []).map((k) => ({ "Phân Loại": "Từ Khóa Đuôi Dài (High Conversion)", "Nội Dung": k }))),
        ...((result.hashtags || []).map((h) => ({ "Phân Loại": "Hashtags Chuẩn Sàn", "Nội Dung": h }))),
      ];
      const wsKw = XLSX.utils.json_to_sheet(kwData);
      XLSX.utils.book_append_sheet(wb, wsKw, "Tu_Khoa_Hashtags");

      // Sheet 4: Kiểm định chất lượng SEO
      if (result.seoScore) {
        const auditData = [
          { "Hạng Mục": "Điểm SEO Tổng Quan", "Giá Trị": `${result.seoScore.score}/100` },
          { "Hạng Mục": "Xếp Hạng", "Giá Trị": result.seoScore.grade },
          { "Hạng Mục": "An Toàn Sàn (Không Từ Cấm)", "Giá Trị": result.seoScore.safetyPassed ? "Đạt chuẩn 100%" : "Cần rà soát" },
          ...(result.seoScore.checklist || []).map((c) => ({
            "Hạng Mục": `Tiêu Chí: ${c.item}`,
            "Giá Trị": c.passed ? "ĐẠT" : "CHƯA ĐẠT",
          })),
        ];
        const wsAudit = XLSX.utils.json_to_sheet(auditData);
        XLSX.utils.book_append_sheet(wb, wsAudit, "Kiem_Dinh_SEO");
      }

      const name = snapshot?.inputs.productName
        ? snapshot.inputs.productName.replace(/[^\w\s-]/gi, "").trim().slice(0, 30)
        : "san-pham";
      XLSX.writeFile(wb, `SEO_Listing_${platform}_${name}.xlsx`);
      showSuccess("Đã xuất bảng tính Excel thành công!");
    } catch {
      showError("Lỗi xuất Excel. Vui lòng thử lại.");
    }
  };

  const allText = useMemo(() => (result ? seoToText(result) : ""), [result]);
  const wordCount = useMemo(() => (allText ? allText.trim().split(/\s+/).length : 0), [allText]);
  const totalChars = useMemo(() => (allText ? allText.length : 0), [allText]);

  return (
    <div className="bg-[#0b0f19] text-white rounded-2xl shadow-xl border border-slate-800 flex flex-col w-full h-auto lg:min-h-[560px] lg:h-full relative overflow-visible lg:overflow-hidden">
      {/* 1. HEADER CÔNG CỤ: 1 DÒNG GỌN GÀNG, ICON-ONLY TRÊN MOBILE, STICKY TOP */}
      <div className="sticky top-0 z-20 rounded-t-2xl px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800 bg-[#0e1526]/95 backdrop-blur-md flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0">
            <Sparkles size={14} className="sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <h2 className="font-bold text-xs sm:text-sm text-white truncate whitespace-nowrap">
            <span className="hidden sm:inline">Kết Quả Tối Ưu SEO</span>
            <span className="sm:hidden">Kết Quả</span>
          </h2>
        </div>

        {result && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Nút sao chép toàn bộ: Trắng nổi bật - Icon Only */}
            <button
              type="button"
              onClick={handleCopyAll}
              title={copiedAll ? "Đã sao chép tất cả" : "Sao chép toàn bộ"}
              className={`p-1.5 sm:p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedAll
                ? "bg-emerald-500 text-white"
                : "bg-white hover:bg-slate-200 text-slate-950"
                }`}
            >
              {copiedAll ? <Check size={14} className="stroke-[2.5]" /> : <Copy size={14} />}
            </button>

            {/* Nút xuất file TXT - Mobile icon only */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải về file TXT đầy đủ"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Download size={14} className="text-slate-300" />
              <span className="hidden sm:inline">TXT</span>
            </button>

            {/* Nút xuất Excel - Mobile icon only */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất dữ liệu sang Excel (.xlsx)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <FileSpreadsheet size={14} className="text-slate-300" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Chuyển đổi Xem Preview / Raw - Mobile icon only */}
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                title="Chế độ giao diện trực quan"
                className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${viewMode === "preview"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Giao diện</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Chế độ mã nguồn văn bản"
                className={`p-1.5 sm:px-2 sm:py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${viewMode === "raw"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <Code2 size={13} />
                <span className="hidden sm:inline">Mã nguồn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. BODY KHU VỰC HIỂN THỊ DỮ LIỆU: NỀN ĐEN CHỮ TRẮNG */}
      <div className="p-3 sm:p-5 w-full lg:flex-1 lg:overflow-y-auto custom-scrollbar">
        {loading ? (
          <ToolLoadingState
            elapsedSeconds={elapsedSeconds}
            onCancel={onCancel}
            title="AI Đang Tạo Bộ Listing Chuẩn SEO..."
            accentColor="emerald"
            minHeightClass="min-h-[380px]"
            stages={[
              { upToSeconds: 8, text: `⚡ Đang phân tích AIDA & từ khóa cốt lõi cho ${platformInfo.label}...` },
              { upToSeconds: 20, text: `🎯 Đang sáng tạo 5 góc tiêu đề chuẩn thuật toán tìm kiếm và click CTR...` },
              { upToSeconds: 35, text: `📝 Đang hoàn thiện mô tả AIDA 4 tầng chuyển đổi và ma trận hashtag...` },
              { upToSeconds: 999, text: `🛡️ Đang chấm điểm SEO & rà soát kiểm duyệt từ ngữ an toàn sàn...` },
            ]}
          />
        ) : result ? (
          viewMode === "raw" ? (
            /* Chế độ xem Mã thuần */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nội dung định dạng văn bản hoàn chỉnh:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(allText, "raw-text")}
                  title={copiedId === "raw-text" ? "Đã sao chép toàn bộ" : "Sao chép toàn bộ"}
                  className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer active:scale-90 ${copiedId === "raw-text"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                    }`}
                >
                  {copiedId === "raw-text" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                </button>
              </div>
              <textarea
                readOnly
                value={allText}
                className="w-full h-[460px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed resize-none focus:outline-hidden select-all"
              />
            </div>
          ) : (
            /* Chế độ Xem Giao diện Trực quan: NỀN ĐEN CHỮ TRẮNG, GỌN GÀNG */
            <div className="space-y-4">
              {/* THANH TAB ĐIỀU HƯỚNG GỌN GÀNG */}
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "Tất cả", icon: Layers },
                  { id: "titles", label: "5 Tiêu đề", icon: Tag },
                  { id: "desc", label: "Mô tả AIDA", icon: FileText },
                  { id: "hashtags", label: "Từ khóa & Tags", icon: Hash },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 border ${isActive
                        ? "bg-slate-800 text-white border-slate-600 font-bold shadow-xs"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60"
                        }`}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>


              {/* PHẦN 1: NĂM BIẾN THỂ TIÊU ĐỀ (HIỂN THỊ CHÂN DUNG KHÁCH HÀNG & TỪ KHÓA) */}
              {(activeFilter === "all" || activeFilter === "titles") && (
                <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Tag size={15} className="text-slate-300 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
                        1. Năm Biến Thể Tiêu Đề Đa Phân Khúc
                      </h3>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        (Mục tiêu: ≤ {platformInfo.titleLimit} ký tự)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.titles.join("\n\n"), "all-titles")}
                      title={copiedId === "all-titles" ? "Đã sao chép cả 5 tiêu đề" : "Sao chép cả 5 tiêu đề"}
                      className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === "all-titles"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        }`}
                    >
                      {copiedId === "all-titles" ? (
                        <Check size={12} className="stroke-[2.5]" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {result.titles.map((title, index) => {
                      const count = charCount(title);
                      const isOptimal = count <= platformInfo.titleLimit;
                      const itemKey = `title-${index}`;
                      const richMeta = result.richTitles?.[index];
                      const meta = TITLE_STRATEGY_NAMES[index] || TITLE_STRATEGY_NAMES[0];
                      const tagName = richMeta?.tag || meta.tag;
                      const roleName = richMeta?.style || meta.role;

                      return (
                        <div
                          key={index}
                          className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 sm:p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                        >
                          {/* Hàng trên: Số thứ tự + Nhãn góc bán + Đếm ký tự + Nút chép */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                                {tagName}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                                {roleName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span
                                className={`text-[11px] font-mono ${isOptimal
                                  ? "text-slate-400"
                                  : "text-amber-400 font-semibold"
                                  }`}
                              >
                                {count}/{platformInfo.titleLimit} kt
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(title, itemKey)}
                                title={copiedId === itemKey ? "Đã sao chép tiêu đề" : "Sao chép tiêu đề"}
                                className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === itemKey
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                  }`}
                              >
                                {copiedId === itemKey ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* Nội dung tiêu đề: Chữ trắng to rõ */}
                          <p className="text-xs sm:text-sm font-medium text-white leading-relaxed select-all">
                            {title}
                          </p>

                          {/* Rich Metadata: Từ khóa trọng tâm & Chân dung khách hàng */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-0.5 border-t border-slate-800/60 mt-1">
                            {richMeta?.hookKeywords && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-slate-500">Từ khóa:</span>
                                <span className="text-slate-200 font-medium">
                                  {richMeta.hookKeywords}
                                </span>
                              </div>
                            )}
                            {richMeta?.targetAudience && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Users size={11} className="text-teal-400 shrink-0" />
                                <span className="text-teal-300 font-medium">
                                  {richMeta.targetAudience}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PHẦN 2: BÀI VIẾT MÔ TẢ CHUẨN AIDA (HỖ TRỢ XEM TRỰC QUAN PHỄU CHUYỂN ĐỔI) */}
              {(activeFilter === "all" || activeFilter === "desc") && (
                <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-slate-300 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
                        2. Bài Viết Mô Tả Phễu Chuyển Đổi AIDA
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Sub-toggle: Xem trực quan AIDA vs Xem phân đoạn */}
                      {result.descriptionAida && (
                        <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setDescViewMode("aida")}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${descViewMode === "aida"
                              ? "bg-slate-800 text-teal-300"
                              : "text-slate-400 hover:text-white"
                              }`}
                          >
                            Phễu AIDA
                          </button>
                          <button
                            type="button"
                            onClick={() => setDescViewMode("sections")}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${descViewMode === "sections"
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:text-white"
                              }`}
                          >
                            Từng Đoạn
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            result.descriptions.map((item) => `${item.title}:\n${item.content}`).join("\n\n"),
                            "all-desc"
                          )
                        }
                        title={copiedId === "all-desc" ? "Đã sao chép toàn bộ bài mô tả" : "Sao chép toàn bộ bài mô tả"}
                        className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === "all-desc"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          }`}
                      >
                        {copiedId === "all-desc" ? (
                          <Check size={12} className="stroke-[2.5]" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chế độ xem trực quan Phễu AIDA */}
                  {descViewMode === "aida" && result.descriptionAida ? (
                    <div className="space-y-3">
                      {/* Attention Hook */}
                      {result.descriptionAida.attentionHook && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Flame size={13} /> 1. Attention Hook (Gợi Mở Nhu Cầu &amp; Nỗi Đau)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(result.descriptionAida!.attentionHook!, "hook-desc")}
                              title={copiedId === "hook-desc" ? "Đã sao chép Attention Hook" : "Sao chép Attention Hook"}
                              className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === "hook-desc"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                }`}
                            >
                              {copiedId === "hook-desc" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                            "{result.descriptionAida.attentionHook}"
                          </p>
                        </div>
                      )}

                      {/* USP Story */}
                      {result.descriptionAida.uspStory && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={13} /> 2. Interest USP (Đột Phá Điểm Nhấn &amp; Nguồn Gốc)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(result.descriptionAida!.uspStory!, "usp-desc")}
                              title={copiedId === "usp-desc" ? "Đã sao chép USP Story" : "Sao chép USP Story"}
                              className={`p-1.5 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === "usp-desc"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                }`}
                            >
                              {copiedId === "usp-desc" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {result.descriptionAida.uspStory}
                          </p>
                        </div>
                      )}

                      {/* Feature vs Benefit Bullets */}
                      {result.descriptionAida.featureBullets && result.descriptionAida.featureBullets.length > 0 && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                            3. Desire (Tính Năng Vượt Trội ➔ Lợi Ích Khách Nhận Được)
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {result.descriptionAida.featureBullets.map((f, i) => (
                              <div
                                key={i}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                              >
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  <span>{f.feature}</span>
                                </div>
                                <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                                  <ArrowRight size={11} className="text-slate-500 shrink-0 hidden sm:inline" />
                                  <span className="text-slate-300 font-medium">{f.benefit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size & Specs */}
                      {result.descriptionAida.sizeAndSpecs && result.descriptionAida.sizeAndSpecs.length > 0 && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                            📏 Bảng Thông Số &amp; Hướng Dẫn Chọn Kích Cỡ
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.descriptionAida.sizeAndSpecs.map((spec, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Commitments & CTA */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {result.descriptionAida.commitments && result.descriptionAida.commitments.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <Shield size={13} /> 4. Cam Kết Bán Hàng An Tâm
                            </span>
                            <div className="space-y-1.5">
                              {result.descriptionAida.commitments.map((c, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.descriptionAida.ctaCloser && (
                          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                                🚀 Lời Kêu Gọi Hành Động (CTA)
                              </span>
                              <p className="text-xs text-slate-200 font-semibold mt-1">
                                {result.descriptionAida.ctaCloser}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(result.descriptionAida!.ctaCloser!, "cta-desc")}
                              title={copiedId === "cta-desc" ? "Đã sao chép lời kêu gọi CTA" : "Sao chép lời kêu gọi CTA"}
                              className={`p-1.5 self-start rounded-md text-xs transition-all flex items-center justify-center cursor-pointer active:scale-90 ${copiedId === "cta-desc"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-white border border-emerald-600/50"
                                }`}
                            >
                              {copiedId === "cta-desc" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Chế độ xem theo từng đoạn truyền thống */
                    <div className="space-y-2.5">
                      {result.descriptions.map((item, index) => {
                        const descKey = `desc-${index}`;
                        return (
                          <div
                            key={index}
                            className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 sm:p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-white">
                                {item.title}
                              </h4>

                              <button
                                type="button"
                                onClick={() => handleCopy(`${item.title}:\n\n${item.content}`, descKey)}
                                title={copiedId === descKey ? "Đã sao chép đoạn này" : "Sao chép đoạn này"}
                                className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === descKey
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                                  }`}
                              >
                                {copiedId === descKey ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                              </button>
                            </div>

                            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all font-sans bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                              {item.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 3: MA TRẬN TỪ KHÓA & HASHTAGS */}
              {(activeFilter === "all" || activeFilter === "hashtags") && (
                <div className="bg-[#0f172a]/70 rounded-xl border border-slate-800 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Hash size={15} className="text-slate-300 shrink-0" />
                      <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-white">
                        3. Ma Trận Từ Khóa &amp; Hashtags Lên Xu Hướng
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(result.hashtags.join(" "), "all-tags")}
                      title={copiedId === "all-tags" ? "Đã sao chép toàn bộ hashtags" : "Sao chép toàn bộ hashtags"}
                      className={`p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-90 ${copiedId === "all-tags"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        }`}
                    >
                      {copiedId === "all-tags" ? (
                        <Check size={12} className="stroke-[2.5]" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>

                  {/* Từ khóa hạt nhân & đuôi dài */}
                  {result.keywordMatrix && (
                    <div className="space-y-2.5">
                      {result.keywordMatrix.coreKeywords && result.keywordMatrix.coreKeywords.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                            Từ khóa hạt nhân (High Search Volume):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.keywordMatrix.coreKeywords.map((kw, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleCopy(kw, `core-kw-${i}`)}
                                title="Bấm để sao chép từ khóa"
                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                {copiedId === `core-kw-${i}` ? (
                                  <Check size={11} className="text-emerald-400" />
                                ) : (
                                  <Search size={11} className="text-slate-400" />
                                )}
                                <span>{kw}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.keywordMatrix.longtailKeywords && result.keywordMatrix.longtailKeywords.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                            Từ khóa đuôi dài (High Conversion Intent):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.keywordMatrix.longtailKeywords.map((kw, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleCopy(kw, `long-kw-${i}`)}
                                title="Bấm để sao chép từ khóa"
                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                {copiedId === `long-kw-${i}` ? (
                                  <Check size={11} className="text-emerald-400" />
                                ) : (
                                  <Copy size={11} className="text-slate-400" />
                                )}
                                <span>{kw}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chuỗi dán nhanh toàn bộ Hashtag */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Chuỗi Hashtags Dán Nhanh Vào Cuối Bài ({result.hashtags.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(result.hashtags.join(" "), "all-tags-box")}
                        title={copiedId === "all-tags-box" ? "Đã sao chép chuỗi hashtags" : "Sao chép chuỗi hashtags"}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs ${copiedId === "all-tags-box"
                          ? "bg-emerald-500 text-white"
                          : "bg-white hover:bg-slate-200 text-slate-950"
                          }`}
                      >
                        {copiedId === "all-tags-box" ? <Check size={12} className="stroke-[2.5]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <p className="text-xs font-mono text-slate-200 leading-relaxed select-all break-all bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                      {result.hashtags.join(" ")}
                    </p>

                    {/* Danh sách chip hashtag */}
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {result.hashtags.map((tag) => {
                        const isCopied = copiedId === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleCopy(tag, tag)}
                            title="Bấm để sao chép hashtag này"
                            className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${isCopied
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                              }`}
                          >
                            <Hash size={11} />
                            <span>{tag.replace(/^#/, "")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER THỐNG KÊ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <span>
                    Số từ: <strong className="text-white font-semibold">{wordCount}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Ký tự: <strong className="text-white font-semibold">{totalChars}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Hashtags: <strong className="text-white font-semibold">{result.hashtags.length}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 text-slate-300">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Chuẩn định dạng đăng bán {platformInfo.label}</span>
                </div>
              </div>
            </div>
          )
        ) : (
          /* TRẠNG THÁI CHƯA CÓ DỮ LIỆU: NỀN ĐEN CHỮ TRẮNG */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-3.5 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shadow-xs">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-white">
                Chưa có kết quả tối ưu SEO
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập thông tin sản phẩm ở cột bên trái hoặc bấm nút dùng thử dữ liệu mẫu để trải nghiệm ngay bộ Listing hoàn chỉnh.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-950 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                <Sparkles size={14} className="text-emerald-600" /> Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
