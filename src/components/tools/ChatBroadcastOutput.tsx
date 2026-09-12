"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  FileText,
  Send,
  User,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface ChatBroadcastOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  channel?: string;
  scenario?: string;
}

export function ChatBroadcastOutput({
  result,
  loading,
  shopName,
  channel = "both",
  scenario = "cart_abandoned",
}: ChatBroadcastOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kich-ban-chat-${shopName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const charCount = result ? result.length : 0;

  const channelBadge = 
    channel === "shopee" ? { text: "Shopee Broadcast", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" }
    : channel === "zalo" ? { text: "Zalo Remarketing", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" }
    : { text: "Shopee & Zalo Remarketing", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <MessageSquare size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Kịch Bản Chat Remarketing</h2>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${channelBadge.color}`}>
            {channelBadge.text}
          </span>
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  viewMode === "preview"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mô phỏng Chat
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
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
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Sparkles size={26} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Soạn Tin Nhắn Kéo Khách Cũ...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang xây dựng kịch bản đắc nhân tâm, kích cầu mua sắm mà không gây cảm giác spam phiền hà...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[460px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div className="space-y-4">
                {/* Parse và hiển thị mô phỏng chat */}
                {result.split("\n\n").map((block, idx) => {
                  const trimmed = block.trim();
                  if (!trimmed) return null;

                  // Tiêu đề H2
                  if (trimmed.startsWith("## ")) {
                    const isShopeeHeader = trimmed.includes("SHOPEE");
                    const isZaloHeader = trimmed.includes("ZALO");
                    return (
                      <div
                        key={idx}
                        className={`pt-3 pb-1 border-b flex items-center gap-2 ${
                          isShopeeHeader ? "border-orange-500/30 text-orange-400" : isZaloHeader ? "border-blue-500/30 text-blue-400" : "border-slate-800 text-emerald-400"
                        }`}
                      >
                        <h3 className="text-sm font-black uppercase tracking-wide">
                          {trimmed.replace("## ", "")}
                        </h3>
                      </div>
                    );
                  }

                  // Mẫu tin nhắn (H3)
                  if (trimmed.startsWith("### ")) {
                    const title = trimmed.replace("### ", "");
                    return (
                      <div key={idx} className="pt-2">
                        <span className="text-xs font-bold text-slate-300 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">
                          {title}
                        </span>
                      </div>
                    );
                  }

                  // Khối bong bóng tin nhắn (nếu có nội dung)
                  const isAdvice = trimmed.toLowerCase().includes("lời khuyên") || trimmed.toLowerCase().includes("khung giờ");
                  if (isAdvice) {
                    return (
                      <div key={idx} className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-xs text-amber-200/90 space-y-1.5">
                        <p className="font-bold flex items-center gap-1.5 text-amber-300">
                          <AlertTriangle size={14} /> Lưu ý gửi tin hiệu quả:
                        </p>
                        <p className="leading-relaxed whitespace-pre-line text-slate-300">{trimmed}</p>
                      </div>
                    );
                  }

                  const blockChars = trimmed.length;
                  const isShopeeOverLimit = blockChars > 350 && (channel === "shopee" || trimmed.toLowerCase().includes("shopee"));

                  return (
                    <div
                      key={idx}
                      className="group relative bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm"
                    >
                      {/* Bong bóng chat header */}
                      <div className="flex items-center justify-between gap-2 mb-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {shopName ? shopName.slice(0, 1).toUpperCase() : "S"}
                          </div>
                          <span className="font-bold text-slate-200 truncate max-w-[180px]">
                            {shopName || "Gian Hàng"}
                          </span>
                          <span className="text-[10px] text-slate-500">Vừa xong</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isShopeeOverLimit
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}
                            title={isShopeeOverLimit ? "Vượt quá 350 ký tự chuẩn Shopee" : "Số ký tự của tin nhắn"}
                          >
                            {blockChars} ký tự
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(trimmed, `msg-${idx}`)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSnippet === `msg-${idx}` ? (
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

                      {/* Nội dung tin nhắn */}
                      <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-200 whitespace-pre-line leading-relaxed border border-slate-800/60 font-sans">
                        {trimmed}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>Số từ: <strong className="text-slate-400">{wordCount}</strong></span>
                <span>Tổng ký tự: <strong className="text-slate-400">{charCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check size={12} /> Chuẩn văn phong giữ chân khách cũ
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-center text-slate-400">
              <MessageSquare size={26} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-300">Chưa có kịch bản tin nhắn</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Chọn tình huống, nhập tên gian hàng & ưu đãi rồi bấm &quot;Soạn Tin Nhắn Kéo Khách&quot; để tạo ngay.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
