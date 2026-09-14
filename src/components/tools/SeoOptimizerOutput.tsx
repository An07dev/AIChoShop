"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Sparkles,
  Search,
  Layers,
  FileText,
  Hash,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import {
  SEO_PLATFORMS,
  charCount,
  seoFilename,
  seoToText,
  type SeoSnapshot,
} from "@/lib/seo/contract";

export function SeoOptimizerOutput({
  snapshot,
  loading,
}: {
  snapshot: SeoSnapshot | null;
  loading: boolean;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const { showError, showSuccess } = useToast();

  const result = snapshot?.output;
  const platform = snapshot?.inputs.platform || "shopee";
  const platformInfo = SEO_PLATFORMS[platform];

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
      showSuccess("Đã sao chép toàn bộ nội dung SEO!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showError("Không thể sao chép toàn bộ. Vui lòng thử lại.");
    }
  };

  const handleDownload = () => {
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
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Search size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Bộ Nội Dung SEO Chuẩn Sàn</h2>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              platform === "shopee"
                ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                : "bg-blue-500/20 text-blue-300 border-blue-500/40"
            }`}
          >
            {platform === "shopee" ? "Shopee (≤ 120 ký tự)" : "TikTok Shop (≤ 79 ký tự)"}
          </span>
        </div>

        {/* Các nút hành động khi đã có kết quả */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "preview"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trực quan
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn bản
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              title="Tải file .txt"
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
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
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
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Sparkles size={26} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Tối Ưu SEO & Viết Nội Dung Chuẩn Sàn...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang nghiên cứu từ khóa, tạo 5 biến thể tiêu đề giật tít chuẩn thuật toán và xây dựng mô tả AIDA...
              </p>
            </div>
          </div>
        ) : !result ? (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
              <Search size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">Chưa Có Nội Dung SEO</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nhập thông tin sản phẩm ở cột bên trái rồi nhấn{" "}
              <strong className="text-emerald-400">Tối Ưu SEO</strong> để AI tạo trọn bộ tiêu đề, mô tả và hashtag chuẩn sàn.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] text-slate-400">
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Layers size={11} className="text-emerald-400" /> 5 Tiêu đề chuẩn SEO
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <FileText size={11} className="text-teal-400" /> Mô tả AIDA thu hút
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Hash size={11} className="text-cyan-400" /> 10 Hashtag thịnh hành
              </span>
            </div>
          </div>
        ) : viewMode === "raw" ? (
          <textarea
            readOnly
            value={seoToText(result)}
            className="w-full h-[520px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
          />
        ) : (
          <div className="space-y-6">
            {/* 1. NĂM BIẾN THỂ TIÊU ĐỀ */}
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-400" />
                  1. Năm Biến Thể Tiêu Đề Chuẩn SEO
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(result.titles.join("\n"), "all-titles")}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  {copiedId === "all-titles" ? "✓ Đã chép tất cả" : "Chép 5 tiêu đề"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Mục tiêu: tối đa <strong className="text-slate-300">{platformInfo.titleLimit} ký tự</strong> mỗi tiêu đề theo thuật toán {platformInfo.label}.
              </p>
              <div className="space-y-2.5">
                {result.titles.map((title, index) => {
                  const count = charCount(title);
                  const isOptimal = count <= platformInfo.titleLimit;
                  const itemKey = `title-${index}`;
                  return (
                    <div
                      key={index}
                      className="bg-slate-950/70 rounded-xl border border-slate-800 p-3.5 space-y-2.5 hover:border-slate-700/80 transition-all"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="shrink-0 w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                          {index + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium break-words select-text flex-1">
                          {title}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                        <span
                          className={`text-[11px] font-medium flex items-center gap-1.5 ${
                            isOptimal ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOptimal ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          {count}/{platformInfo.titleLimit} ký tự ·{" "}
                          {isOptimal ? "Độ dài hoàn hảo" : "Hơi dài so với chuẩn sàn"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(title, itemKey)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all"
                        >
                          {copiedId === itemKey ? (
                            <>
                              <Check size={12} className="text-emerald-400" /> Đã chép
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Sao chép
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. MÔ TẢ SẢN PHẨM AIDA */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={14} className="text-teal-400" />
                  2. Mô Tả Sản Phẩm Chi Tiết (AIDA)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      result.descriptions.map((item) => `• ${item.title}:\n${item.content}`).join("\n\n"),
                      "all-desc"
                    )
                  }
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                >
                  {copiedId === "all-desc" ? "✓ Đã chép toàn bộ mô tả" : "Chép cả mô tả"}
                </button>
              </div>
              <div className="space-y-2.5">
                {result.descriptions.map((item, index) => {
                  const descKey = `desc-${index}`;
                  return (
                    <div
                      key={index}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700/80 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.title}:\n${item.content}`, descKey)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        >
                          {copiedId === descKey ? "✓ Đã chép" : "Chép đoạn này"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. MƯỜI HASHTAG GỢI Ý */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Hash size={14} className="text-cyan-400" />
                  3. Mười Hashtag Gợi Ý Lên Xu Hướng
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy(result.hashtags.join(" "), "all-tags")}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {copiedId === "all-tags" ? "✓ Đã chép 10 hashtag" : "Chép tất cả hashtag"}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {result.hashtags.map((tag) => {
                  const isCopied = copiedId === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleCopy(tag, tag)}
                      title="Nhấn để sao chép hashtag này"
                      className={`max-w-full break-all border rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                        isCopied
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs"
                          : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-emerald-300/90 hover:text-white"
                      }`}
                    >
                      {tag} {isCopied ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ghi chú lưu ý chân trang */}
            <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-800 pt-3">
              💡 Lưu ý: Hãy kiểm tra thông tin và chính sách shop thực tế trước khi đăng bán. Tiêu đề và nội dung được tạo tự động chuẩn theo thuật toán xếp hạng sàn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
