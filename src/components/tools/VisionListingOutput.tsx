"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Tag,
  FileSpreadsheet,
  FileText,
  Hash,
  ShoppingBag,
  ExternalLink,
  Flame,
  Target,
  Search,
  CheckCircle2,
  ShieldCheck,
  Ruler,
  Gem,
  Layers,
  CheckCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface TitleVariant {
  id: number;
  label: string;
  tag: string;
  tagColor: string;
  iconType: "search" | "trend" | "ads";
  title: string;
  charCount: number;
}

export interface AttributeItem {
  attribute: string;
  value: string;
}

export interface DescSection {
  uspText: string;
  features: { title: string; content: string }[];
  sizeGuide: string[];
  commitments: string[];
  rawText: string;
}

export interface KeywordTags {
  keywords: string[];
  hashtags: string[];
}

export interface ParsedVisionData {
  titles: TitleVariant[];
  specs: AttributeItem[];
  desc: DescSection;
  tags: KeywordTags;
  hasStructuredData: boolean;
  raw: string;
}

interface VisionListingOutputProps {
  output: string | null;
  isLoading: boolean;
  productImage: string | null;
  onUseSample?: () => void;
}

// Bộ phân tích dữ liệu Listing AI chuyên nghiệp
function parseVisionOutput(text: string | null): ParsedVisionData | null {
  if (!text) return null;

  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    const match = text.match(new RegExp(`^[ \\t]*(?:##|\\*\\*|#)?\\s*[^\\n]*?${keyword}[^\\n]*$`, "im"));
    if (!match || match.index === undefined) return "";

    const contentStartIdx = match.index + match[0].length;
    const contentStart = text.slice(contentStartIdx);

    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|\\*\\*|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1Raw = findSection("TIÊU ĐỀ", ["BẢNG THÔNG SỐ", "THÔNG SỐ", "BÀI VIẾT MÔ TẢ"]);
  const s2Raw = findSection("THÔNG SỐ", ["BÀI VIẾT MÔ TẢ", "MÔ TẢ", "BỘ HASHTAG", "HASHTAG"]);
  const s3Raw = findSection("MÔ TẢ", ["BỘ HASHTAG", "HASHTAG", "TỪ KHÓA"]);
  const s4Raw = findSection("HASHTAG", []);

  // 1. Phân tích 3 Tiêu đề
  const titles: TitleVariant[] = [];
  const variantBlocks = s1Raw.split(/(?:^|\n)\s*-\s*\*\*Biến thể\s*(\d+)/i);
  if (variantBlocks.length > 1) {
    for (let i = 1; i < variantBlocks.length; i += 2) {
      const num = parseInt(variantBlocks[i], 10);
      const content = variantBlocks[i + 1] || "";

      let label = `Biến thể ${num}`;
      let title = content.trim();

      const labelMatch = content.match(
        /^\s*\(([^)]+)\)\s*:\s*(?:(?:\*\*)?Tên sản phẩm:(?:\*\*)?\s*)?([\s\S]+)$/i
      );
      if (labelMatch) {
        label = labelMatch[1].trim();
        title = labelMatch[2].trim();
      } else {
        const prodNameMatch = content.match(/(?:(?:\*\*)?Tên sản phẩm:(?:\*\*)?\s*)([\s\S]+)$/i);
        if (prodNameMatch) {
          title = prodNameMatch[1].trim();
        }
      }

      title = title
        .replace(/^[*\s:]+/, "")
        .replace(/(?:\*\*)?Tên sản phẩm:(?:\*\*)?/i, "")
        .replace(/^[*\s:]+/, "")
        .replace(/[*\s]+$/, "")
        .trim();
      const firstLine = title.split("\n")[0].replace(/^[\*\-_"'\s]+|[\*\-_"'\s]+$/g, "").trim();
      const finalTitle = firstLine || title;

      let tag = "Biến Thể SEO";
      let tagColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      let iconType: TitleVariant["iconType"] = "search";

      if (num === 1 || /tìm kiếm|tự nhiên|shopee|lazada/i.test(label)) {
        tag = "Shopee & Lazada · SEO Tự Nhiên";
        tagColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
        iconType = "search";
      } else if (num === 2 || /click|trend|tiktok|live/i.test(label)) {
        tag = "TikTok Shop · Viral & Bắt Trend";
        tagColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
        iconType = "trend";
      } else if (num === 3 || /ads|đấu thầu/i.test(label)) {
        tag = "Chạy Ads · Tối Ưu Đấu Thầu";
        tagColor = "text-purple-400 bg-purple-500/10 border-purple-500/30";
        iconType = "ads";
      }

      titles.push({
        id: num,
        label,
        tag,
        tagColor,
        iconType,
        title: finalTitle,
        charCount: finalTitle.length,
      });
    }
  }

  // 2. Phân tích Bảng thông số (Specs)
  const specs: AttributeItem[] = [];
  const lines = s2Raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        if (/^:?-+:?$/.test(parts[0]) || /thuộc tính/i.test(parts[0])) continue;
        const attr = parts[0].replace(/\*\*/g, "").trim();
        const val = parts[1].replace(/\*\*/g, "").trim();
        if (attr && val) {
          specs.push({ attribute: attr, value: val });
        }
      }
    }
  }

  // 3. Phân tích Bài mô tả (AIDA)
  let uspText = "";
  const features: { title: string; content: string }[] = [];
  const sizeGuide: string[] = [];
  const commitments: string[] = [];

  const uspMatch = s3Raw.match(
    /###\s*(?:✨|\[)?\s*(?:\[?[^\]\n]*?USP[^\]\n]*?\]?)[^\n]*\n([\s\S]*?)(?:###|$)/i
  );
  if (uspMatch) {
    uspText = uspMatch[1].trim();
  }

  const featMatch = s3Raw.match(
    /###\s*(?:💎)?[^\n]*?(?:TÍNH NĂNG|THIẾT KẾ)[^\n]*\n([\s\S]*?)(?:###|$)/i
  );
  if (featMatch) {
    const fLines = featMatch[1].split("\n");
    for (const fLine of fLines) {
      const trimmed = fLine.trim();
      if (!trimmed || !trimmed.startsWith("-")) continue;

      const itemMatch = trimmed.match(/^-\s*\*\*([^*]+?)\*\*[:\s]*([\s\S]*)$/);
      if (itemMatch) {
        const title = itemMatch[1].replace(/:\s*$/, "").replace(/\*\*/g, "").trim();
        const content = itemMatch[2].replace(/^:\s*/, "").replace(/\*\*/g, "").trim();
        features.push({ title, content });
      } else {
        features.push({
          title: "",
          content: trimmed.replace(/^-\s*/, "").replace(/\*\*/g, "").trim(),
        });
      }
    }
  }

  const sizeMatch = s3Raw.match(
    /###\s*(?:📏)?[^\n]*?(?:KÍCH CỠ|SIZE)[^\n]*\n([\s\S]*?)(?:###|$)/i
  );
  if (sizeMatch) {
    const sLines = sizeMatch[1].split("\n");
    for (const sLine of sLines) {
      const trimmed = sLine.trim().replace(/^-\s*/, "").replace(/\*\*/g, "").trim();
      if (trimmed) sizeGuide.push(trimmed);
    }
  }

  const comMatch = s3Raw.match(
    /###\s*(?:🛡️)?[^\n]*?(?:CAM KẾT)[^\n]*\n([\s\S]*?)(?:###|$)/i
  );
  if (comMatch) {
    const cLines = comMatch[1].split("\n");
    for (const cLine of cLines) {
      const trimmed = cLine.trim().replace(/^-\s*/, "").replace(/\*\*/g, "").trim();
      if (trimmed) commitments.push(trimmed);
    }
  }

  // 4. Phân tích Từ khóa & Hashtags
  const keywords: string[] = [];
  const hashtags: string[] = [];

  const kwLineMatch = s4Raw.match(/Từ khóa hạt nhân[^\n:]*:\s*([^\n]+)/i);
  if (kwLineMatch) {
    kwLineMatch[1]
      .split(",")
      .map((k) => k.replace(/\*\*/g, "").trim())
      .filter(Boolean)
      .forEach((k) => keywords.push(k));
  }

  const htMatches = s4Raw.match(/#[\p{L}\p{N}_]+/gu);
  if (htMatches) {
    htMatches.forEach((tag) => {
      const clean = tag.trim();
      if (!hashtags.includes(clean)) hashtags.push(clean);
    });
  }

  const hasStructuredData =
    titles.length > 0 || specs.length > 0 || !!uspText || features.length > 0 || keywords.length > 0;

  return {
    titles,
    specs,
    desc: {
      uspText,
      features,
      sizeGuide,
      commitments,
      rawText: s3Raw,
    },
    tags: {
      keywords,
      hashtags,
    },
    hasStructuredData,
    raw: text,
  };
}

export function VisionListingOutput({
  output,
  isLoading,
  productImage,
  onUseSample,
}: VisionListingOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<"all" | "titles" | "specs" | "desc" | "tags">("all");

  const parsed = useMemo(() => parseVisionOutput(output), [output]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `listing-san-pham-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!parsed) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Tiêu đề & Thông số
    const specsRows = [
      ["NHÓM", "THUỘC TÍNH", "GIÁ TRỊ"],
      ...parsed.titles.map((t) => ["1. TIÊU ĐỀ SEO", t.tag, t.title]),
      ...parsed.specs.map((s) => ["2. THÔNG SỐ", s.attribute, s.value]),
    ];
    const wsSpecs = XLSX.utils.aoa_to_sheet(specsRows);
    wsSpecs["!cols"] = [{ wch: 18 }, { wch: 30 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, wsSpecs, "TieuDe_ThongSo");

    // Sheet 2: Mô tả & Từ khóa
    const descRows = [
      ["MỤC", "NỘI DUNG"],
      ["✨ USP Đặc Quyền", parsed.desc.uspText || ""],
      ...parsed.desc.features.map((f) => [`💎 ${f.title}`, f.content]),
      ...parsed.desc.sizeGuide.map((s) => ["📏 Chọn Size", s]),
      ...parsed.desc.commitments.map((c) => ["🛡️ Cam Kết", c]),
      ["🔍 Từ Khóa Hạt Nhân", parsed.tags.keywords.join(", ")],
      ["# Hashtag Chuẩn Sàn", parsed.tags.hashtags.join(" ")],
    ];
    const wsDesc = XLSX.utils.aoa_to_sheet(descRows);
    wsDesc["!cols"] = [{ wch: 25 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(workbook, wsDesc, "MoTa_AIDA_Hashtag");

    XLSX.writeFile(workbook, `AIChoShop_Listing_${Date.now()}.xlsx`);
  };

  const copyTableAsTsv = () => {
    if (!parsed || parsed.specs.length === 0) return;
    const tsv = parsed.specs.map((s) => `${s.attribute}\t${s.value}`).join("\n");
    handleCopy(tsv, "all-specs");
  };

  const copyAllDescText = () => {
    if (!parsed) return;
    const parts = [];
    if (parsed.desc.uspText) {
      parts.push(`✨ ĐIỂM NHẤN ĐẶC QUYỀN:\n${parsed.desc.uspText}`);
    }
    if (parsed.desc.features.length > 0) {
      parts.push(
        `💎 CHI TIẾT TÍNH NĂNG & THIẾT KẾ:\n` +
          parsed.desc.features.map((f) => `- ${f.title ? `**${f.title}**: ` : ""}${f.content}`).join("\n")
      );
    }
    if (parsed.desc.sizeGuide.length > 0) {
      parts.push(`📏 HƯỚNG DẪN CHỌN SIZE:\n` + parsed.desc.sizeGuide.map((s) => `- ${s}`).join("\n"));
    }
    if (parsed.desc.commitments.length > 0) {
      parts.push(`🛡️ CAM KẾT VÀNG TỪ SHOP:\n` + parsed.desc.commitments.map((c) => `- ${c}`).join("\n"));
    }
    handleCopy(parts.join("\n\n") || parsed.desc.rawText, "all-desc");
  };

  const copyAllTitlesText = () => {
    if (!parsed || parsed.titles.length === 0) return;
    const text = parsed.titles
      .map((t) => `- Biến thể ${t.id} (${t.tag}):\n  Tên sản phẩm: ${t.title}`)
      .join("\n\n");
    handleCopy(text, "all-titles");
  };

  const copySpecsAsText = () => {
    if (!parsed || parsed.specs.length === 0) return;
    const text = parsed.specs.map((s) => `• ${s.attribute}: ${s.value}`).join("\n");
    handleCopy(text, "all-specs");
  };

  const copyKeywordsText = () => {
    if (!parsed || parsed.tags.keywords.length === 0) return;
    handleCopy(parsed.tags.keywords.join(", "), "all-kw");
  };

  const copyHashtagsText = () => {
    if (!parsed || parsed.tags.hashtags.length === 0) return;
    handleCopy(parsed.tags.hashtags.join(" "), "all-ht");
  };

  const wordCount = output ? output.trim().split(/\s+/).length : 0;
  const charCount = output ? output.length : 0;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl lg:h-full flex flex-col lg:min-h-0 relative overflow-hidden border border-slate-800">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header toolbar */}
      <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 relative z-10 bg-slate-900/90 backdrop-blur-md shrink-0 space-y-2.5 2xl:space-y-0 2xl:flex 2xl:items-center 2xl:justify-between">
        <div className="flex items-center justify-between 2xl:justify-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <Sparkles size={15} />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
              Listing Sản Phẩm AI
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 shrink-0">
            Vision AI
          </span>
        </div>

        {/* Nút thao tác toolbar (chỉ hiện trên Desktop lg+) */}
        {output && !isLoading && (
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between 2xl:justify-end gap-2 pt-2 2xl:pt-0 border-t border-slate-800/80 2xl:border-0">
            {/* Chuyển chế độ xem */}
            <div className="grid grid-cols-2 sm:flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/90 shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`py-1 px-2.5 sm:px-3 rounded text-[11px] font-bold transition-all cursor-pointer text-center ${
                  viewMode === "visual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="lg:hidden">Văn Bản AI</span>
                <span className="hidden lg:inline">Trực Quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`py-1 px-2.5 sm:px-3 rounded text-[11px] font-bold transition-all cursor-pointer text-center ${
                  viewMode === "raw"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Markdown
              </button>
            </div>

            {/* Nhóm nút xuất & chép */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Nút Xuất Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 border border-emerald-500/30"
                title="Xuất bảng thuộc tính & tiêu đề ra file Excel"
              >
                <FileSpreadsheet size={13} />
                <span>Excel</span>
              </button>

              {/* Nút Tải file TXT */}
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                title="Tải về file TXT"
              >
                <Download size={13} />
                <span>TXT</span>
              </button>

              {/* Nút Sao Chép Tất Cả */}
              <button
                type="button"
                onClick={handleCopyAll}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                }`}
                title="Sao chép toàn bộ listing"
              >
                {copiedAll ? (
                  <>
                    <Check size={12} className="stroke-[3]" />
                    <span>Đã Chép</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Sao Chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs lọc nhanh danh mục (chỉ hiện trên Desktop lg+) */}
      {output && !isLoading && viewMode === "visual" && (
        <div className="hidden lg:flex px-3 sm:px-4 py-2 border-b border-slate-800 bg-slate-950/60 items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("titles")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "titles"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Tag size={12} /> 1. Tiêu Đề ({parsed?.titles.length || 3})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "specs"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet size={12} /> 2. Thông Số ({parsed?.specs.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("desc")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "desc"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={12} /> 3. Mô Tả AIDA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tags")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "tags"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Hash size={12} /> 4. Từ Khóa &amp; Tag
          </button>
        </div>
      )}

      {/* Main content scroll area */}
      <div className="flex-1 lg:min-h-0 p-3.5 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              {productImage ? (
                <div className="relative">
                  <img
                    src={productImage}
                    alt="Analyzing"
                    className="w-24 h-24 object-cover rounded-2xl border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20"
                  />
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-30"></div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles size={30} className="animate-spin text-amber-400 duration-1000" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>Vision AI Đang Đọc Hình Ảnh & Viết Listing...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Đang nhận diện chất liệu, màu sắc, chi tiết thiết kế, lập bảng thông số Seller Center và sinh bài mô tả chuẩn AIDA...
              </p>
            </div>
          </div>
        ) : output && parsed ? (
          <div className="space-y-6">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Dữ liệu văn bản gốc (Markdown):</span>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Copy size={12} /> Sao chép toàn bộ
                  </button>
                </div>
                <pre className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 overflow-x-auto">
                  {output}
                </pre>
              </div>
            ) : (
              <div>
                {/* ============================================================= */}
                {/* 📱 GIAO DIỆN MOBILE: THUẦN TEXT GỌN GÀNG CHUẨN AI (< lg)       */}
                {/* ============================================================= */}
                <div className="lg:hidden p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 text-[13px] text-slate-200 leading-relaxed select-text space-y-5">
                  {/* 1. TIÊU ĐỀ CHUẨN SEO */}
                  {parsed.titles.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          🏷️ 1. TIÊU ĐỀ CHUẨN SEO
                        </h3>
                        <button
                          type="button"
                          onClick={copyAllTitlesText}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                        >
                          {copiedKey === "all-titles" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedKey === "all-titles" ? "Đã chép" : "Chép cả 3"}</span>
                        </button>
                      </div>

                      <div className="space-y-3 pl-1">
                        {parsed.titles.map((variant) => {
                          const isCopied = copiedKey === `title-${variant.id}`;
                          return (
                            <div key={variant.id} className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-300 text-xs">
                                  • Biến thể {variant.id} ({variant.tag}):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(variant.title, `title-${variant.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                                >
                                  {isCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                  <span>{isCopied ? "Đã chép" : "Chép"}</span>
                                </button>
                              </div>
                              <p className="text-slate-100 pl-3 leading-snug select-text">
                                <span className="text-slate-400">Tên sản phẩm: </span>
                                {variant.title}
                              </p>
                              <p className="text-[11px] text-slate-500 pl-3">
                                ({variant.charCount} ký tự{variant.charCount <= 120 ? " - Chuẩn SEO" : ""})
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. BẢNG THÔNG SỐ KỸ THUẬT */}
                  {parsed.specs.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          📋 2. BẢNG THÔNG SỐ KỸ THUẬT
                        </h3>
                        <button
                          type="button"
                          onClick={copySpecsAsText}
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                        >
                          {copiedKey === "all-specs" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedKey === "all-specs" ? "Đã chép" : "Chép thông số"}</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 pl-1">
                        {parsed.specs.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-slate-500">•</span>
                            <span className="font-medium text-slate-400 shrink-0">{item.attribute}:</span>
                            <span className="text-slate-200 select-text">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. BÀI VIẾT MÔ TẢ CHUYỂN ĐỔI CAO (AIDA) */}
                  <div className="space-y-3.5 pb-4 border-b border-slate-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        📝 3. BÀI VIẾT MÔ TẢ (AIDA)
                      </h3>
                      <button
                        type="button"
                        onClick={copyAllDescText}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                      >
                        {copiedKey === "all-desc" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedKey === "all-desc" ? "Đã chép" : "Chép toàn bộ"}</span>
                      </button>
                    </div>

                    {/* 3.1 USP */}
                    {parsed.desc.uspText && (
                      <div className="space-y-1 pl-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-slate-300 text-xs">
                            ✨ [ĐIỂM NHẤN ĐẶC QUYỀN - USP]
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.desc.uspText, "usp-text")}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            {copiedKey === "usp-text" ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedKey === "usp-text" ? "Đã chép" : "Chép"}</span>
                          </button>
                        </div>
                        <p className="text-slate-200 leading-relaxed pl-2 select-text">
                          {parsed.desc.uspText}
                        </p>
                      </div>
                    )}

                    {/* 3.2 CHI TIẾT TÍNH NĂNG & THIẾT KẾ */}
                    {parsed.desc.features.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        <h4 className="font-semibold text-slate-300 text-xs">
                          💎 CHI TIẾT TÍNH NĂNG &amp; THIẾT KẾ
                        </h4>
                        <div className="space-y-1.5 pl-2">
                          {parsed.desc.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-slate-500 shrink-0">•</span>
                              <div className="select-text">
                                {feat.title ? (
                                  <strong className="text-slate-200 font-semibold mr-1">{feat.title}:</strong>
                                ) : null}
                                <span className="text-slate-300">{feat.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3.3 HƯỚNG DẪN CHỌN SIZE */}
                    {parsed.desc.sizeGuide.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        <h4 className="font-semibold text-slate-300 text-xs">
                          📏 BẢNG QUY ĐỔI KÍCH CỠ / HƯỚNG DẪN CHỌN SIZE
                        </h4>
                        <div className="space-y-1 pl-2 text-slate-300">
                          {parsed.desc.sizeGuide.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-slate-500 shrink-0">•</span>
                              <span className="select-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3.4 CAM KẾT VÀNG */}
                    {parsed.desc.commitments.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        <h4 className="font-semibold text-slate-300 text-xs">
                          🛡️ CAM KẾT VÀNG TỪ SHOP
                        </h4>
                        <div className="space-y-1 pl-2 text-slate-300">
                          {parsed.desc.commitments.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-slate-500 shrink-0">•</span>
                              <span className="select-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. HASHTAG & TỪ KHÓA TÌM KIẾM */}
                  <div className="space-y-3 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        🔍 4. BỘ HASHTAG &amp; TỪ KHÓA TÌM KIẾM
                      </h3>
                    </div>

                    {/* Từ khóa hạt nhân */}
                    {parsed.tags.keywords.length > 0 && (
                      <div className="space-y-1 pl-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-300 text-xs">
                            • Từ khóa hạt nhân:
                          </span>
                          <button
                            type="button"
                            onClick={copyKeywordsText}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            {copiedKey === "all-kw" ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedKey === "all-kw" ? "Đã chép" : "Chép"}</span>
                          </button>
                        </div>
                        <p className="pl-3 text-slate-300 leading-relaxed select-text">
                          {parsed.tags.keywords.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {parsed.tags.hashtags.length > 0 && (
                      <div className="space-y-1 pl-1 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-300 text-xs">
                            • Hashtag chuẩn SEO:
                          </span>
                          <button
                            type="button"
                            onClick={copyHashtagsText}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            {copiedKey === "all-ht" ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            <span>{copiedKey === "all-ht" ? "Đã chép" : "Chép"}</span>
                          </button>
                        </div>
                        <p className="pl-3 text-slate-300 leading-relaxed select-text font-mono text-xs">
                          {parsed.tags.hashtags.join(" ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ============================================================= */}
                {/* 🖥️ GIAO DIỆN DESKTOP: THẺ TRỰC QUAN ĐẦY ĐỦ (lg+)              */}
                {/* ============================================================= */}
                <div className="hidden lg:block space-y-6">
                  {/* 1. KHỐI TIÊU ĐỀ CHUẨN SEO */}
                {(activeTab === "all" || activeTab === "titles") && (
                  <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0 mt-0.5 sm:mt-0">🏷️</span>
                        <div>
                          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                            1. Tiêu Đề Chuẩn SEO
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            3 góc tiếp cận: Tìm kiếm tự nhiên, Giật tít TikTok &amp; Đấu thầu Ads
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                        {parsed.titles.length} biến thể
                      </span>
                    </div>

                    <div className="space-y-3">
                      {parsed.titles.map((variant) => {
                        const isCopied = copiedKey === `title-${variant.id}`;
                        return (
                          <div
                            key={variant.id}
                            className="bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700 p-3.5 sm:p-4 transition-all space-y-2.5 group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 min-w-0 ${variant.tagColor}`}
                                  title={variant.tag}
                                >
                                  {variant.iconType === "search" && <Search size={11} className="shrink-0" />}
                                  {variant.iconType === "trend" && <Flame size={11} className="shrink-0" />}
                                  {variant.iconType === "ads" && <Target size={11} className="shrink-0" />}
                                  <span className="truncate">{variant.tag}</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(variant.title, `title-${variant.id}`)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                                  isCopied
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70"
                                }`}
                              >
                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-0.5">
                              <span className="font-semibold text-slate-400">Biến thể {variant.id}</span>
                              <span className="flex items-center gap-1">
                                <span>{variant.charCount} ký tự</span>
                                {variant.charCount <= 120 && (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <Check size={11} className="stroke-[3]" /> Chuẩn SEO
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 group-hover:border-slate-700/60 transition-colors">
                              <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed select-all">
                                {variant.title}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. KHỐI BẢNG THÔNG SỐ KỸ THUẬT */}
                {(activeTab === "all" || activeTab === "specs") && (
                  <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0 mt-0.5 sm:mt-0">📋</span>
                        <div>
                          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                            2. Bảng Thông Số Kỹ Thuật
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Attributes điền Shopee &amp; TikTok Seller Center
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyTableAsTsv}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                        title="Sao chép toàn bộ bảng (dạng bảng tính Tab-Separated)"
                      >
                        {copiedKey === "all-specs" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedKey === "all-specs" ? "Đã chép" : "Chép cả bảng"}</span>
                      </button>
                    </div>

                    {parsed.specs.length > 0 ? (
                      <>
                        {/* Mobile View: Key-Value Cards (< sm) */}
                        <div className="sm:hidden space-y-2">
                          {parsed.specs.map((item, idx) => {
                            const isRowCopied = copiedKey === `spec-${idx}`;
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between gap-2.5 hover:border-slate-700 transition-all"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {item.attribute}
                                  </div>
                                  <div className="text-xs font-semibold text-emerald-300 mt-0.5 break-words leading-snug">
                                    {item.value}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.value, `spec-${idx}`)}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                                    isRowCopied
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60"
                                  }`}
                                  title={`Sao chép "${item.value}"`}
                                >
                                  {isRowCopied ? <Check size={11} /> : <Copy size={11} />}
                                  <span className="text-[10px] font-bold">{isRowCopied ? "Đã chép" : "Chép"}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop View: Full Table (sm+) */}
                        <div className="hidden sm:block rounded-xl border border-slate-800 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-4 font-bold w-1/3">Thuộc Tính</th>
                                <th className="py-2.5 px-4 font-bold w-1/2">Giá Trị Chi Tiết Từ Ảnh</th>
                                <th className="py-2.5 px-4 text-center font-bold">Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                              {parsed.specs.map((item, idx) => {
                                const isRowCopied = copiedKey === `spec-${idx}`;
                                return (
                                  <tr
                                    key={idx}
                                    className="hover:bg-slate-800/40 transition-colors group"
                                  >
                                    <td className="py-2.5 sm:py-3 px-4 font-bold text-slate-200">
                                      {item.attribute}
                                    </td>
                                    <td className="py-2.5 sm:py-3 px-4 text-emerald-300 font-medium">
                                      {item.value}
                                    </td>
                                    <td className="py-2.5 sm:py-3 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleCopy(item.value, `spec-${idx}`)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer ${
                                          isRowCopied
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                            : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                        }`}
                                        title={`Sao chép giá trị "${item.value}"`}
                                      >
                                        {isRowCopied ? <Check size={11} /> : <Copy size={11} />}
                                        <span>{isRowCopied ? "Đã chép" : "Chép"}</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                        {output}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. KHỐI BÀI VIẾT MÔ TẢ CHUYỂN ĐỔI CAO (AIDA) */}
                {(activeTab === "all" || activeTab === "desc") && (
                  <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0 mt-0.5 sm:mt-0">📝</span>
                        <div>
                          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                            3. Mô Tả Chuẩn AIDA
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            USP Nỗi đau → Tính năng → Chọn size → Cam kết
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={copyAllDescText}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                      >
                        {copiedKey === "all-desc" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedKey === "all-desc" ? "Đã chép" : "Sao chép"}</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {/* 3.1 USP Callout Box */}
                      {parsed.desc.uspText && (
                        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 min-w-0">
                              <Sparkles size={13} className="shrink-0" />
                              <span className="truncate">Điểm Nhấn Đặc Quyền (USP)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.desc.uspText, "usp-text")}
                              className="text-[10px] text-amber-400/90 hover:text-amber-300 flex items-center gap-1 cursor-pointer shrink-0 font-semibold active:scale-95"
                            >
                              {copiedKey === "usp-text" ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedKey === "usp-text" ? "Đã chép" : "Chép USP"}</span>
                            </button>
                          </div>
                          <p className="text-xs text-amber-100/90 leading-relaxed">
                            {parsed.desc.uspText}
                          </p>
                        </div>
                      )}

                      {/* 3.2 Chi Tiết Tính Năng & Thiết Kế */}
                      {parsed.desc.features.length > 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 sm:p-4 space-y-2.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <Gem size={13} className="text-teal-400 shrink-0" />
                            <span>Chi Tiết Tính Năng &amp; Thiết Kế</span>
                          </span>
                          <div className="space-y-2 text-xs">
                            {parsed.desc.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-slate-200">
                                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                                <div className="leading-relaxed">
                                  {feat.title ? (
                                    <strong className="text-white font-bold mr-1">
                                      {feat.title}:
                                    </strong>
                                  ) : null}
                                  <span className="text-slate-300">{feat.content}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3.3 Hướng Dẫn Kích Cỡ / Size */}
                      {parsed.desc.sizeGuide.length > 0 && (
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 sm:p-4 space-y-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Ruler size={13} className="shrink-0" />
                            <span>Bảng Quy Đổi / Hướng Dẫn Chọn Size</span>
                          </span>
                          <div className="space-y-1.5 text-xs text-cyan-100/90">
                            {parsed.desc.sizeGuide.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-cyan-400 shrink-0">•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3.4 Cam Kết Vàng Từ Shop */}
                      {parsed.desc.commitments.length > 0 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 sm:p-4 space-y-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="shrink-0" />
                            <span>Cam Kết Vàng Từ Shop</span>
                          </span>
                          <div className="space-y-1.5 text-xs text-emerald-100/90">
                            {parsed.desc.commitments.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. KHỐI BỘ HASHTAG & TỪ KHÓA TÌM KIẾM */}
                {(activeTab === "all" || activeTab === "tags") && (
                  <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-4 shadow-sm">
                    <div className="flex items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0 mt-0.5 sm:mt-0">🔍</span>
                        <div>
                          <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide">
                            4. Hashtags &amp; Từ Khóa Tìm Kiếm
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            Tăng độ phủ SEO sàn và kéo đề xuất video TikTok
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 4.1 Từ Khóa Hạt Nhân */}
                    {parsed.tags.keywords.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 min-w-0">
                            <Search size={12} className="text-amber-400 shrink-0" />
                            <span className="truncate">Từ khóa hạt nhân ({parsed.tags.keywords.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.tags.keywords.join(", "), "all-kw")}
                            className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-semibold cursor-pointer shrink-0 active:scale-95"
                          >
                            {copiedKey === "all-kw" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedKey === "all-kw" ? "Đã chép" : "Chép tất cả"}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {parsed.tags.keywords.map((kw, idx) => {
                            const isKwCopied = copiedKey === `kw-${idx}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleCopy(kw, `kw-${idx}`)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isKwCopied
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                    : "bg-slate-900 text-slate-200 border-slate-800 hover:border-amber-500/40 hover:text-amber-300"
                                }`}
                                title="Bấm để sao chép từ khóa này"
                              >
                                {isKwCopied ? <Check size={11} className="text-emerald-400" /> : <span className="text-[10px] opacity-70">🔍</span>}
                                <span>{kw}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4.2 Hashtags Chuẩn SEO Sàn */}
                    {parsed.tags.hashtags.length > 0 && (
                      <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 min-w-0">
                            <Hash size={12} className="text-emerald-400 shrink-0" />
                            <span className="truncate">Hashtags chuẩn SEO ({parsed.tags.hashtags.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.tags.hashtags.join(" "), "all-ht")}
                            className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-semibold cursor-pointer shrink-0 active:scale-95"
                          >
                            {copiedKey === "all-ht" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedKey === "all-ht" ? "Đã chép tất cả" : "Chép toàn bộ"}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {parsed.tags.hashtags.map((tag, idx) => {
                            const isHtCopied = copiedKey === `ht-${idx}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleCopy(tag, `ht-${idx}`)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  isHtCopied
                                    ? "bg-emerald-500 text-white border-emerald-400 shadow-xs"
                                    : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60 hover:text-emerald-200"
                                }`}
                                title="Bấm để sao chép hashtag này"
                              >
                                {isHtCopied ? <Check size={11} /> : <Hash size={11} />}
                                <span>{tag.replace(/^#/, "")}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Footer metadata */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>Số từ: <strong className="text-slate-300">{wordCount}</strong></span>
                <span>•</span>
                <span>Ký tự: <strong className="text-slate-300">{charCount}</strong></span>
                <span>•</span>
                <span>Thuộc tính: <strong className="text-emerald-400">{parsed.specs.length}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>Sẵn sàng đăng bán Shopee, TikTok Shop &amp; Lazada</span>
              </div>
            </div>
          </div>
        ) : (
          /* Trạng thái chưa có dữ liệu */
          <div className="h-full min-h-[360px] sm:min-h-[400px] flex flex-col items-center justify-center text-center p-5 sm:p-6 text-slate-500 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-center text-slate-400 shadow-lg">
              <ShoppingBag size={26} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-slate-200">Chưa có kết quả phân tích hình ảnh</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tải ảnh sản phẩm của bạn lên ở tab &quot;Nhập thông tin&quot; hoặc bấm nút thử nghiệm mẫu để trải nghiệm giao diện Listing hoàn chỉnh ngay.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
