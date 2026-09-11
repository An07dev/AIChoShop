"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  LayoutList,
  CheckCircle2,
  AlertCircle,
  Hash,
  Layers,
  ShoppingBag,
  Lightbulb,
  ExternalLink,
  Tag,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface SeoTitleItem {
  id: number;
  title: string;
  charCount: number;
  isSafe: boolean; // <= 120 ký tự
}

export interface SeoDescriptionItem {
  id: number;
  title: string;
  content: string;
}

interface SeoOptimizerOutputProps {
  result: string;
  loading: boolean;
  productName?: string;
  usp?: string;
}

export function SeoOptimizerOutput({
  result,
  loading,
  productName = "",
  usp = "",
}: SeoOptimizerOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTitleId, setCopiedTitleId] = useState<number | null>(null);
  const [copiedAllTitles, setCopiedAllTitles] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

  // Bóc tách kết quả AI thành: Tiêu đề, Mô tả, và Hashtag
  const parsedData = useMemo(() => {
    if (!result) return { titles: [], descriptions: [], hashtags: [], rawDesc: "" };

    const cleanResult = result
      .replace(/```markdown/gi, "")
      .replace(/```/g, "")
      .trim();

    // 1. Phân tách theo 3 khối chính
    const section1Match = cleanResult.match(/##\s*1[\.\:\s]*(?:Biến thể|Tiêu đề)[\s\S]*?(?=##\s*2|$)/i);
    const section2Match = cleanResult.match(/##\s*2[\.\:\s]*(?:Mô tả)[\s\S]*?(?=##\s*3|$)/i);
    const section3Match = cleanResult.match(/##\s*3[\.\:\s]*(?:Hashtag)[\s\S]*$/i);

    const sec1Text = section1Match ? section1Match[0] : "";
    const sec2Text = section2Match ? section2Match[0] : "";
    const sec3Text = section3Match ? section3Match[0] : "";

    // 2. Bóc tách 5 Tiêu đề
    const titles: SeoTitleItem[] = [];
    if (sec1Text) {
      const lines = sec1Text.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        const match = trimmed.match(/^(?:(?:\d+[\.\/\:\)-]|\*|\-|\+|(?:Biến thể|Tiêu đề)\s*\d+[\:\.\-]?))\s*(.+)$/i);
        if (match) {
          let text = match[1].replace(/^\*\*|\*\*$/g, "").replace(/^["'“”]|["'“”]$/g, "").trim();
          if (
            text.length > 5 &&
            !text.toLowerCase().startsWith("dưới đây") &&
            !text.toLowerCase().startsWith("tiêu đề") &&
            !text.toLowerCase().startsWith("biến thể tiêu đề")
          ) {
            titles.push({
              id: titles.length + 1,
              title: text,
              charCount: text.length,
              isSafe: text.length <= 120,
            });
          }
        }
      });
    }

    // Fallback bóc tách tiêu đề nếu không theo khối
    if (titles.length === 0) {
      const lines = cleanResult.split("\n");
      for (const line of lines) {
        const match = line.match(/^(\d+)[\.\)]\s*(.+)$/);
        if (match && titles.length < 5) {
          const text = match[2].replace(/\*+/g, "").trim();
          if (!text.startsWith("#") && text.length > 10) {
            titles.push({
              id: titles.length + 1,
              title: text,
              charCount: text.length,
              isSafe: text.length <= 120,
            });
          }
        }
      }
    }

    // 3. Bóc tách Mô tả sản phẩm
    const descriptions: SeoDescriptionItem[] = [];
    let rawDesc = "";
    if (sec2Text) {
      const lines = sec2Text.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
          const bullet = trimmed.replace(/^[-*•]\s*/, "").trim();
          const parts = bullet.match(/^(?:\*\*|\*)(.+?)(?:\*\*|\*)[:\-]\s*(.+)$/);
          if (parts) {
            descriptions.push({
              id: descriptions.length + 1,
              title: parts[1].trim(),
              content: parts[2].trim(),
            });
          } else {
            descriptions.push({
              id: descriptions.length + 1,
              title: "",
              content: bullet.replace(/\*+/g, "").trim(),
            });
          }
        }
      });
      rawDesc = descriptions
        .map((d) => (d.title ? `• ${d.title}: ${d.content}` : `• ${d.content}`))
        .join("\n");
    }

    // 4. Bóc tách Hashtags
    const hashtags: string[] = [];
    const sourceForTags = sec3Text || cleanResult;
    const tagMatches = sourceForTags.match(/#[\w\d_À-ỹ]+/gi);
    if (tagMatches) {
      tagMatches.forEach((tag) => {
        const cleanTag = tag.trim();
        if (!hashtags.includes(cleanTag)) {
          hashtags.push(cleanTag);
        }
      });
    }

    return {
      titles,
      descriptions,
      hashtags,
      rawDesc,
    };
  }, [result]);

  // Sao chép 1 tiêu đề
  const handleCopyTitle = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTitleId(id);
    setTimeout(() => setCopiedTitleId(null), 1800);
  };

  // Sao chép tất cả tiêu đề
  const handleCopyAllTitles = () => {
    if (parsedData.titles.length === 0) return;
    const all = parsedData.titles.map((t) => `${t.id}. ${t.title}`).join("\n");
    navigator.clipboard.writeText(all);
    setCopiedAllTitles(true);
    setTimeout(() => setCopiedAllTitles(false), 2000);
  };

  // Sao chép phần mô tả
  const handleCopyDescription = () => {
    const textToCopy =
      parsedData.rawDesc ||
      parsedData.descriptions.map((d) => (d.title ? `• ${d.title}: ${d.content}` : `• ${d.content}`)).join("\n");
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  // Sao chép toàn bộ Hashtags
  const handleCopyAllHashtags = () => {
    if (parsedData.hashtags.length === 0) return;
    navigator.clipboard.writeText(parsedData.hashtags.join(" "));
    setCopiedHashtags(true);
    setTimeout(() => setCopiedHashtags(false), 2000);
  };

  // Sao chép 1 hashtag đơn
  const handleCopySingleTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedSingleTag(tag);
    setTimeout(() => setCopiedSingleTag(null), 1500);
  };

  // Sao chép toàn bộ kết quả
  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải file .txt
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = productName
      ? productName.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 20).trim()
      : "SEO";
    link.download = `SEO_${safeName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng với sắc thái Xanh Lam & Cyan */}
      <div className="absolute top-0 right-0 p-36 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">
              Bộ Tối Ưu SEO Đa Kênh
            </h2>
          </div>
        </div>

        {/* Cụm nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} /> Trực quan
              </button>
              <button
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Gốc
              </button>
            </div>

            {/* Nút Tải .txt */}
            <button
              onClick={handleDownloadTxt}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Download size={13} className="text-blue-400" /> Tải về (.txt)
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              onClick={handleCopyAll}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-white/10 active:scale-95"
            >
              {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedAll ? "Đã chép" : "Chép tất cả"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-3.5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa có dữ liệu SEO
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Nhập tên sản phẩm cơ bản và các điểm nổi bật (USP) ở khung bên trái rồi bấm{" "}
              <strong className="text-blue-400 font-semibold">"Tối Ưu SEO Bằng AI"</strong> để
              tạo 5 tiêu đề chuẩn sàn, mô tả sản phẩm và bộ 10 hashtag bắt trend.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
              <Sparkles size={13} className="text-blue-400" />
              <span>Tiêu đề chuẩn sàn Shopee, TikTok Shop, Lazada (Tối đa 120 ký tự)</span>
            </div>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-3">
            <TextShimmerWave className="text-xl font-medium text-blue-500">
              AI Thinking
            </TextShimmerWave>
            <p className="text-xs text-slate-400 animate-pulse">
              Đang phân tích từ khóa ngách, cấu trúc tiêu đề và trích xuất hashtag...
            </p>
          </div>
        )}

        {/* Kết quả khi đã có dữ liệu */}
        {result && !loading && (
          <>
            {viewMode === "visual" ? (
              <div className="space-y-4">
                {/* Phần 1: 5 Biến thể tiêu đề chuẩn SEO */}
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-lg">
                  <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                        <Layers size={14} />
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        1. 5 Biến thể tiêu đề chuẩn SEO (Tối đa 120 ký tự)
                      </h3>
                    </div>
                    {parsedData.titles.length > 0 && (
                      <button
                        onClick={handleCopyAllTitles}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copiedAllTitles ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedAllTitles ? "Đã chép tất cả" : "Chép tất cả tiêu đề"}
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2">
                    {parsedData.titles.map((item) => {
                      const isCopied = copiedTitleId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900/90 border border-slate-700/60 hover:border-blue-500/40 rounded-lg p-2.5 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {item.id}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-200 font-medium leading-relaxed select-all">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-slate-400">
                                  {item.charCount} ký tự
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                    item.isSafe
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {item.isSafe ? "Chuẩn sàn <= 120" : "Hơi dài"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyTitle(item.title, item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 border border-slate-700/50"
                            title="Sao chép tiêu đề này"
                          >
                            {isCopied ? (
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phần 2: Mô tả sản phẩm chuẩn SEO */}
                {parsedData.descriptions.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                          <FileText size={14} />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          2. Mô tả sản phẩm nhấn mạnh lợi ích cốt lõi
                        </h3>
                      </div>
                      <button
                        onClick={handleCopyDescription}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copiedDesc ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedDesc ? "Đã chép mô tả" : "Chép mô tả"}
                      </button>
                    </div>

                    <div className="p-3.5 space-y-2">
                      {parsedData.descriptions.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-900/70 border border-slate-700/50 rounded-lg p-2.5 flex items-start gap-2 text-xs"
                        >
                          <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                          <div className="leading-relaxed text-slate-300">
                            {item.title && (
                              <strong className="text-white font-bold mr-1">
                                {item.title}:
                              </strong>
                            )}
                            <span>{item.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phần 3: 10 Hashtag chuẩn thuật toán */}
                {parsedData.hashtags.length > 0 && (
                  <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                          <Hash size={14} />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          3. Bộ 10 Hashtag chuẩn thuật toán tìm kiếm
                        </h3>
                      </div>
                      <button
                        onClick={handleCopyAllHashtags}
                        className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copiedHashtags ? (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedHashtags ? "Đã chép hashtag" : "Chép toàn bộ Hashtag"}
                      </button>
                    </div>

                    <div className="p-3.5">
                      <div className="flex flex-wrap gap-2">
                        {parsedData.hashtags.map((tag, idx) => {
                          const isTagCopied = copiedSingleTag === tag;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleCopySingleTag(tag)}
                              title="Bấm để chép hashtag này"
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                                isTagCopied
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-slate-900 text-slate-300 border-slate-700/70 hover:border-indigo-500/50 hover:text-white"
                              }`}
                            >
                              <Tag size={11} className="text-indigo-400" />
                              <span>{tag}</span>
                              {isTagCopied && <Check size={11} className="text-emerald-400 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">
                        💡 Mẹo: Dán bộ hashtag này vào cuối bài viết mô tả sản phẩm để robot tìm kiếm Shopee/TikTok nhận diện nhanh nhất.
                      </p>
                    </div>
                  </div>
                )}

                {/* Banner mẹo SEO sàn */}
                <div className="bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 rounded-xl p-3.5 shadow-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                      <Lightbulb size={14} />
                    </div>
                    <h4 className="text-xs font-black text-blue-300 uppercase tracking-wider">
                      Công thức đặt tiêu đề chuẩn SEO 2026
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>[Tên Cơ Bản] + [Thương Hiệu/Chất Liệu] + [Công Dụng/USP Độc Quyền] + [Mã Model/Dung Tích]</strong>. Đặt từ khóa chính trong 40 ký tự đầu tiên để hiển thị trọn vẹn trên điện thoại người mua.
                  </p>
                </div>
              </div>
            ) : (
              /* Chế độ xem Markdown Gốc (Raw Mode) */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative group">
                <pre className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30 overflow-x-auto">
                  {result}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
