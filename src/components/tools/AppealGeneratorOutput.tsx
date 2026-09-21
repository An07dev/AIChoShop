"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Sparkles,
  Copy,
  Download,
  AlertTriangle,
  FileText,
  LayoutList,
  CheckCircle2,
  Lightbulb,
  Search,
  Layers,
  Paperclip,
  Clock,
  HeartHandshake,
  Info,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface AppealGeneratorOutputProps {
  result: string;
  loading: boolean;
  platform?: string;
  shopName?: string;
  violationType?: string;
  onUseSample?: () => void;
}

export function AppealGeneratorOutput({
  result,
  loading,
  platform = "Shopee",
  shopName,
  violationType,
  onUseSample,
}: AppealGeneratorOutputProps) {
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<"all" | "letter" | "analysis" | "tips">("all");

  // Phân tích văn bản AI trả về thành: 1. Phân tích vi phạm & 2. Mẫu đơn kháng nghị
  const parsedData = useMemo(() => {
    if (!result) return { coreIssue: "", solution: "", letter: "", wordCount: 0, charCount: 0 };

    let coreIssue = "";
    let solution = "";
    let letter = "";

    // Tìm vị trí phân chia giữa phần 1 (Phân tích) và phần 2 (Mẫu đơn)
    const part2Index = result.search(/#{2,4}\s*2[\.\:\s]*(?:MẪU|Mẫu|ĐƠN|Đơn|MẪU ĐƠN)/i);

    let part1Text = "";
    let part2Text = "";

    if (part2Index !== -1) {
      part1Text = result.slice(0, part2Index);
      part2Text = result.slice(part2Index);
    } else {
      // Nếu không có header phần 2 rõ ràng
      const splitByKinhGui = result.search(/(?:Kính gửi|Thân gửi|Chào đội ngũ|Dear)/i);
      if (splitByKinhGui !== -1) {
        part1Text = result.slice(0, splitByKinhGui);
        part2Text = result.slice(splitByKinhGui);
      } else {
        part2Text = result;
      }
    }

    // Bóc tách vấn đề cốt lõi và cách khắc phục từ part 1
    if (part1Text) {
      const coreIssueMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Vấn đề cốt lõi|Lý do thực sự|Nguyên nhân)[^:\n\r]*[:\-]\s*([\s\S]*?)(?=(?:[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động)|$))/i);
      if (coreIssueMatch) {
        coreIssue = coreIssueMatch[1].replace(/\*+/g, "").trim();
      }

      const solutionMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động|Cần làm)[^:\n\r]*[:\-]\s*([\s\S]*?)$/i);
      if (solutionMatch) {
        solution = solutionMatch[1].replace(/\*+/g, "").trim();
      }
    }

    // Làm sạch mẫu đơn kháng nghị từ part 2
    if (part2Text) {
      // Bỏ header phần 2
      let cleanLetter = part2Text
        .replace(/^#{2,4}\s*2[^\n]*\n+/i, "")
        .replace(/^[-*•\s]*(?:Viết một|Mẫu đơn|Nội dung đơn|Dài khoảng)[^\n]*\n+/gim, "")
        .trim();

      // Nếu bắt đầu bằng các dấu gạch đầu dòng chú thích, tìm dòng bắt đầu lá đơn (Kính gửi / Tôi là...)
      const letterStart = cleanLetter.search(/(?:Kính gửi|Thân gửi|Kính chào|Chào Ban|Dear|Tôi là|Hôm nay)/i);
      if (letterStart !== -1 && letterStart < 300) {
        cleanLetter = cleanLetter.slice(letterStart);
      }

      letter = cleanLetter.trim();
    }

    // Nếu không tách được mẫu đơn riêng, fallback toàn bộ kết quả làm lá đơn
    if (!letter && result) {
      letter = result.trim();
    }

    const words = letter ? letter.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = letter ? letter.length : 0;

    return {
      coreIssue,
      solution,
      letter,
      wordCount: words,
      charCount: chars,
    };
  }, [result]);

  // Sao chép riêng mẫu đơn kháng nghị
  const handleCopyLetter = () => {
    const textToCopy = parsedData.letter || result;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  // Tải về file text
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeShop = shopName
      ? shopName.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 20).trim()
      : "DonKhangNghi";
    link.download = `DonKhangNghi_${platform}_${safeShop}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng với sắc thái Rose & Pink */}
      <div className="absolute top-0 right-0 p-36 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ (Toolbar) - Cố định 1 hàng duy nhất trên mobile */}
      <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-900/90 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-sm text-white truncate block">
              Hồ Sơ Kháng Nghị
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block">
              {platform ? `Chuẩn sàn ${platform}` : "Giải trình & Mẫu đơn khiếu nại"}
            </span>
          </div>
        </div>

        {/* Cụm nút hành động - Luôn 1 hàng duy nhất */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Chuyển chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} />
                <span className="hidden md:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} />
                <span className="hidden md:inline">Gốc</span>
              </button>
            </div>

            {/* Nút Tải đơn (.txt) - Ẩn trên mobile nhỏ để gọn gàng */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải đơn về máy (.txt)"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={12} />
            </button>

            {/* Nút Sao chép mẫu đơn */}
            <button
              type="button"
              onClick={handleCopyLetter}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-md shadow-rose-950/40 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {copiedLetter ? <CheckCircle2 size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedLetter ? "Đã chép" : "Chép đơn"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Loại Danh Mục Đầu Ra (Pinned Sub-Tabs) - Cố định bên dưới toolbar cho Mobile & Desktop */}
      {result && !loading && viewMode === "visual" && (
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "all"
                ? "bg-slate-800 text-white border border-slate-700 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Tất Cả</span>
          </button>

          {/* Tab Mẫu đơn kháng nghị - Tâm điểm chính người bán cần copy */}
          <button
            type="button"
            onClick={() => setActiveTab("letter")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "letter"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            <FileText size={12} className="text-rose-400 sm:w-[13px] sm:h-[13px]" />
            <span className="sm:hidden">1. Mẫu Đơn</span>
            <span className="hidden sm:inline">Mẫu Đơn Kháng Nghị</span>
            <span className="text-[9px] px-1 py-0.2 rounded-sm bg-rose-500/30 text-rose-200 font-bold uppercase tracking-wider">
              Gửi Sàn
            </span>
          </button>

          {/* Tab Phân tích vi phạm & Chiến lược */}
          {(parsedData.coreIssue || parsedData.solution) && (
            <button
              type="button"
              onClick={() => setActiveTab("analysis")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "analysis"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <Search size={12} className="text-amber-400 sm:w-[13px] sm:h-[13px]" />
              <span className="sm:hidden">2. Phân Tích</span>
              <span className="hidden sm:inline">Phân Tích &amp; Khắc Phục</span>
            </button>
          )}

          {/* Tab Mẹo mở khóa 90%+ */}
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              activeTab === "tips"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <Lightbulb size={12} className="text-emerald-400 sm:w-[13px] sm:h-[13px]" />
            <span className="sm:hidden">3. Mẹo Gỡ</span>
            <span className="hidden sm:inline">Mẹo Mở Khóa 90%+</span>
          </button>
        </div>
      )}

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-2.5 sm:p-4 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar pb-24 lg:pb-4">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa có hồ sơ kháng nghị
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Cung cấp tên shop, loại vi phạm và mô tả chi tiết ở khung bên trái rồi bấm{" "}
              <strong className="text-rose-400 font-semibold">&quot;Viết Đơn Kháng Nghị Bằng AI&quot;</strong>{" "}
              để tạo giải trình thuyết phục và mẫu đơn chuẩn gửi sàn.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 mb-2">
              <Sparkles size={13} className="text-rose-400" />
              <span>Hỗ trợ Shopee, TikTok Shop, Lazada, Facebook</span>
            </div>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) - Biểu tượng xoay tròn */}
        {loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <ShieldAlert size={28} className="animate-spin text-rose-400" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Rà Soát Chính Sách &amp; Viết Đơn Kháng Nghị...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang rà soát chính sách sàn {platform}, xây dựng luận điểm gỡ gậy và biên soạn lá đơn chuẩn mực...
              </p>
            </div>
          </div>
        )}

        {/* Kết quả khi đã có dữ liệu */}
        {result && !loading && (
          <>
            {viewMode === "visual" ? (
              <div className="space-y-2.5 sm:space-y-3.5">
                {/* Thanh tóm tắt nhanh: 1 dòng siêu gọn gàng */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                    <span>
                      Sàn: <strong className="text-rose-400 font-bold">{platform}</strong>
                    </span>
                    {shopName && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300 truncate max-w-[110px] sm:max-w-none">Shop: {shopName}</span>
                      </>
                    )}
                    {violationType && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300 truncate max-w-[120px] sm:max-w-none">{violationType}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
                    <CheckCircle2 size={12} />
                    <span className="hidden sm:inline">Hồ Sơ Chuẩn Sàn · Tăng Tỷ Lệ Mở</span>
                    <span className="sm:hidden">Chuẩn sàn</span>
                  </div>
                </div>

                {/* Khối 1: Phân tích nguyên nhân & Hướng khắc phục */}
                {(activeTab === "all" || activeTab === "analysis") && (parsedData.coreIssue || parsedData.solution) && (
                  <div className="bg-slate-800/60 border border-rose-500/30 rounded-xl overflow-hidden shadow-lg shadow-rose-950/20">
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                          <Search size={13} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <h3 className="text-[11px] sm:text-xs font-black text-rose-300 uppercase tracking-wider">
                          Phân tích vi phạm &amp; Chiến lược gỡ gậy
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50">
                        Dành cho Seller
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5">
                      {parsedData.coreIssue && (
                        <div className="bg-slate-900/80 rounded-lg p-2.5 sm:p-3 border-l-4 border-l-amber-500 border-y border-r border-slate-700/60">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                            <h4 className="text-xs font-bold text-amber-300">
                              Vấn đề cốt lõi (Lý do thực sự bị phạt):
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans pl-4">
                            {parsedData.coreIssue}
                          </p>
                        </div>
                      )}

                      {parsedData.solution && (
                        <div className="bg-slate-900/80 rounded-lg p-2.5 sm:p-3 border-l-4 border-l-emerald-500 border-y border-r border-slate-700/60">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <h4 className="text-xs font-bold text-emerald-300">
                              Cách khắc phục ngay để tránh bị phạt tiếp:
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans pl-4">
                            {parsedData.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Khối 2: Mẫu Đơn Kháng Nghị Chuẩn (Copy & Paste gửi sàn) */}
                {(activeTab === "all" || activeTab === "letter") && parsedData.letter && (
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="p-1 rounded bg-rose-500/20 text-rose-400 shrink-0">
                          <FileText size={13} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider truncate">
                            Mẫu đơn kháng nghị chuẩn (Gửi Sàn {platform})
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {parsedData.wordCount > 0 && (
                          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50">
                            ~{parsedData.wordCount} từ
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyLetter}
                          className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          {copiedLetter ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span>{copiedLetter ? "Đã chép" : "Chép đơn"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3.5">
                      <div className="relative bg-slate-950/90 rounded-lg p-3 sm:p-4 border border-slate-800 text-slate-200 text-xs leading-relaxed font-sans select-all selection:bg-rose-500/30 whitespace-pre-wrap">
                        {parsedData.letter}
                      </div>

                      {/* Thanh tác vụ nhanh dưới lá đơn - Rất tiện lợi khi dùng điện thoại */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Info size={12} className="text-rose-400 shrink-0" />
                          <span>Chạm chọn toàn bộ hoặc bấm nút bên cạnh để gửi vào form khiếu nại sàn</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLetter}
                          className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          {copiedLetter ? (
                            <CheckCircle2 size={13} className="text-emerald-300" />
                          ) : (
                            <Copy size={13} />
                          )}
                          <span>{copiedLetter ? "Đã sao chép lá đơn!" : "Sao chép toàn bộ mẫu đơn"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Khối 3: Lưu ý vàng khi gửi đơn kháng nghị (Dạng thẻ trực quan, scannable trên mobile) */}
                {(activeTab === "all" || activeTab === "tips") && (
                  <div className="bg-gradient-to-r from-rose-950/30 to-slate-900 border border-rose-500/20 rounded-xl p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <Lightbulb size={14} />
                      </div>
                      <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                        Mẹo tăng tỷ lệ mở khóa lên 90%+
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5">
                      {/* Thẻ 1 */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex items-start gap-2">
                        <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                          <Paperclip size={13} />
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block mb-0.5">Đính kèm bằng chứng thật</strong>
                          <span className="text-slate-300 leading-relaxed">
                            Chụp ảnh kho hàng, hóa đơn VAT hoặc giấy ủy quyền phân phối vào phần tệp đính kèm.
                          </span>
                        </div>
                      </div>

                      {/* Thẻ 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex items-start gap-2">
                        <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <Clock size={13} />
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block mb-0.5">Không spam gửi nhiều đơn</strong>
                          <span className="text-slate-300 leading-relaxed">
                            Chỉ gửi 1 đơn duy nhất và chờ 24h - 48h. Gửi liên tục dễ bị AI gắn cờ spam từ chối.
                          </span>
                        </div>
                      </div>

                      {/* Thẻ 3 */}
                      <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex items-start gap-2">
                        <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                          <HeartHandshake size={13} />
                        </div>
                        <div className="text-xs">
                          <strong className="text-white block mb-0.5">Thái độ cầu thị, hợp tác</strong>
                          <span className="text-slate-300 leading-relaxed">
                            Tránh tranh cãi gay gắt với sàn. Trình bày minh bạch và cam kết tuân thủ chính sách.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Chế độ xem Markdown Gốc (Raw Mode) */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-4 relative group">
                <pre className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-rose-500/30 overflow-x-auto">
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

