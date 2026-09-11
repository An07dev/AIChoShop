"use client";

import { useState, useMemo } from "react";
import {
  Presentation,
  Sparkles,
  Copy,
  Check,
  LayoutList,
  FileText,
  Download,
  DollarSign,
  Tag,
  Target,
  ShieldCheck,
  PieChart,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface KocPlannerOutputProps {
  result: string;
  loading: boolean;
  category: string;
  budget: string;
}

interface ParsedSection {
  id: number;
  title: string;
  content: string;
  isNote?: boolean;
}

export function KocPlannerOutput({
  result,
  loading,
  category,
  budget,
}: KocPlannerOutputProps) {
  const [copied, setCopied] = useState(false);
  const [copiedSectionId, setCopiedSectionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

  // Phân tích văn bản kế hoạch thành cấu trúc dữ liệu chuẩn
  const planData = useMemo(() => {
    if (!result) return null;

    // 1. Bóc tách phần Tóm tắt (từ khối ## Tóm tắt)
    const summaryBlockMatch = result.match(/##\s*Tóm tắt([\s\S]*?)(?=##|$)/i);
    const summaryText = summaryBlockMatch ? summaryBlockMatch[1] : result;

    const categoryMatch = summaryText.match(/Ngành hàng[\:\s\*]+([^\n\r]+)/i);
    const budgetMatch = summaryText.match(/Ngân sách[^\:\n\r]*[\:\s\*]+([^\n\r]+)/i);
    const strategyMatch = summaryText.match(/Chiến lược[\:\s\*]+([^\n\r]+)/i);
    const useCaseMatch = summaryText.match(/(?:Trường hợp sử dụng|Mục tiêu)[\:\s\*]+([^\n\r]+)/i);

    const cleanVal = (val?: string) => (val ? val.replace(/\*+/g, "").trim() : "");

    // 2. Bóc tách phân bổ ngân sách
    const bookingPctMatch = result.match(/Booking[^\d%]*(\d+)%/i);
    const adsPctMatch = result.match(/Chạy Ads[^\d%]*(\d+)%/i);
    const samplePctMatch = result.match(/(?:hàng mẫu|sample)[^\d%]*(\d+)%/i);

    // Số tiền trong ngoặc đơn (X.XXX.XXX VNĐ) hoặc sau dấu hai chấm
    const bookingMoneyMatch =
      result.match(/Booking[^\(\n]*\(\s*([\d\.\,]+\s*(?:VNĐ|đ)?)\s*\)/i) ||
      result.match(/Booking[\:\s\*]+(\d+[\d\.\,]*\s*(?:VNĐ|đ))/i);
    const adsMoneyMatch =
      result.match(/Chạy Ads[^\(\n]*\(\s*([\d\.\,]+\s*(?:VNĐ|đ)?)\s*\)/i) ||
      result.match(/Chạy Ads[\:\s\*]+(\d+[\d\.\,]*\s*(?:VNĐ|đ))/i);
    const sampleMoneyMatch =
      result.match(/(?:hàng mẫu|sample)[^\(\n]*\(\s*([\d\.\,]+\s*(?:VNĐ|đ)?)\s*\)/i) ||
      result.match(/(?:hàng mẫu|sample)[\:\s\*]+(\d+[\d\.\,]*\s*(?:VNĐ|đ))/i);

    // 3. Dự phòng số tiền từ ngân sách nếu AI không ghi rõ
    const numBudget = Number(budget) || 0;
    const formattedFallbackBudget = numBudget
      ? new Intl.NumberFormat("vi-VN").format(numBudget) + " VNĐ"
      : "5.000.000 VNĐ";

    const bookingPct = bookingPctMatch ? `${bookingPctMatch[1]}%` : "30%";
    const adsPct = adsPctMatch ? `${adsPctMatch[1]}%` : "50%";
    const samplePct = samplePctMatch ? `${samplePctMatch[1]}%` : "20%";

    const calcMoney = (pctStr: string) => {
      const pct = parseInt(pctStr) || 0;
      if (numBudget > 0) {
        return new Intl.NumberFormat("vi-VN").format((numBudget * pct) / 100) + " VNĐ";
      }
      return "";
    };

    const bookingMoney = bookingMoneyMatch
      ? cleanVal(bookingMoneyMatch[1])
      : calcMoney(bookingPct) || "1.500.000 VNĐ";
    const adsMoney = adsMoneyMatch
      ? cleanVal(adsMoneyMatch[1])
      : calcMoney(adsPct) || "2.500.000 VNĐ";
    const sampleMoney = sampleMoneyMatch
      ? cleanVal(sampleMoneyMatch[1])
      : calcMoney(samplePct) || "1.000.000 VNĐ";

    // 4. Tách các section con bên dưới (bỏ qua mục Tóm tắt vì đã đưa lên 4 thẻ trên cùng)
    const lines = result.split("\n");
    const sections: ParsedSection[] = [];
    let currentTitle = "";
    let buffer: string[] = [];

    const flush = () => {
      if (currentTitle && buffer.length > 0) {
        const content = buffer.join("\n").trim();
        const lower = currentTitle.toLowerCase();
        // Không lặp lại Tóm tắt và không lấy tiêu đề cha rỗng "Chi tiết kế hoạch"
        if (
          !lower.includes("tóm tắt") &&
          !(lower.includes("chi tiết kế hoạch") && content.length === 0)
        ) {
          sections.push({
            id: sections.length + 1,
            title: currentTitle,
            content,
            isNote: lower.includes("lưu ý") || lower.includes("ghi chú"),
          });
        }
      }
      buffer = [];
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("```")) return;

      const headerMatch = trimmed.match(/^#{2,3}\s+(.+)$/);
      if (headerMatch) {
        flush();
        currentTitle = headerMatch[1].replace(/\*+/g, "").trim();
      } else {
        buffer.push(line);
      }
    });

    flush();

    return {
      summary: {
        category: cleanVal(categoryMatch ? categoryMatch[1] : category),
        totalBudget: cleanVal(
          budgetMatch ? budgetMatch[1] : formattedFallbackBudget
        ),
        strategy: cleanVal(
          strategyMatch ? strategyMatch[1] : "Nano-Micro Influencer"
        ),
        useCase: cleanVal(
          useCaseMatch ? useCaseMatch[1] : "Chia nhỏ rủi ro"
        ),
      },
      allocation: {
        bookingPct,
        adsPct,
        samplePct,
        bookingMoney,
        adsMoney,
        sampleMoney,
      },
      sections,
    };
  }, [result, category, budget]);

  // Sao chép toàn bộ kế hoạch
  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sao chép từng mục
  const handleCopySection = (title: string, content: string, id: number) => {
    navigator.clipboard.writeText(`### ${title}\n\n${content}`);
    setCopiedSectionId(id);
    setTimeout(() => setCopiedSectionId(null), 1800);
  };

  // Tải file văn bản (.txt)
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeCat = category
      ? category.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 20).trim()
      : "KOC";
    link.download = `KeHoachKOC_${safeCat}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper chọn icon cho từng section
  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("phân bổ")) return <PieChart size={14} className="text-indigo-400" />;
    if (lower.includes("tiêu chí")) return <Award size={14} className="text-amber-400" />;
    if (lower.includes("dự phóng") || lower.includes("views")) return <TrendingUp size={14} className="text-emerald-400" />;
    if (lower.includes("lời kết")) return <Check size={14} className="text-purple-400" />;
    if (lower.includes("lưu ý")) return <AlertCircle size={14} className="text-amber-400" />;
    return <BookOpen size={14} className="text-blue-400" />;
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ màu Indigo / Tím sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Presentation size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">
              Kế Hoạch Phân Bổ KOC / KOL TikTok
            </h2>
          </div>
        </div>

        {/* Cụm nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem: Trực quan vs Văn bản */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                onClick={() => setViewMode("visual")}
                title="Dạng Dashboard trực quan"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} /> Trực quan
              </button>
              <button
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản đầy đủ"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Văn bản
              </button>
            </div>

            {/* Nút Tải file TXT */}
            <button
              onClick={handleDownloadTxt}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
              title="Tải kế hoạch về máy (.txt)"
            >
              <Download size={13} /> Tải .txt
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              onClick={handleCopyAll}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-white/10 active:scale-95"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Đã chép" : "Chép kế hoạch"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung kết quả có thanh cuộn riêng */}
      <div className="p-3.5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
              <Presentation size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-300 mb-1.5">
              Chưa có kế hoạch KOC
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Chọn ngành hàng & nhập ngân sách bên trái rồi bấm{" "}
              <strong className="text-indigo-400 font-semibold">
                "Lên Kế Hoạch Bằng AI"
              </strong>{" "}
              để nhận bảng phân bổ ngân sách Nano-Micro Influencer chuẩn TikTok Shop.
            </p>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[220px] flex items-center justify-center">
            <TextShimmerWave className="text-xl font-medium text-blue-500">
              AI Thinking
            </TextShimmerWave>
          </div>
        )}

        {/* Kết quả khi đã sinh xong */}
        {result && !loading && planData && (
          <>
            {viewMode === "visual" ? (
              <div className="space-y-3.5">
                {/* 4 Thẻ Hero Summary theo đúng nội dung ## Tóm tắt */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Card 1: Ngành hàng */}
                  <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-2.5 transition-all">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-semibold mb-1">
                      <Tag size={13} />
                      <span>Ngành hàng</span>
                    </div>
                    <div className="text-white font-bold text-xs sm:text-sm truncate">
                      {planData.summary.category}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Lĩnh vực mục tiêu
                    </div>
                  </div>

                  {/* Card 2: Ngân sách tổng */}
                  <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-2.5 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
                      <DollarSign size={13} />
                      <span>Ngân sách tổng</span>
                    </div>
                    <div className="text-emerald-400 font-bold text-xs sm:text-sm truncate font-mono">
                      {planData.summary.totalBudget}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Tổng chi phí đầu tư
                    </div>
                  </div>

                  {/* Card 3: Chiến lược */}
                  <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-2.5 transition-all">
                    <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold mb-1">
                      <Target size={13} />
                      <span>Chiến lược</span>
                    </div>
                    <div className="text-white font-bold text-xs sm:text-sm truncate">
                      {planData.summary.strategy}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Mô hình Influencer
                    </div>
                  </div>

                  {/* Card 4: Trường hợp sử dụng / Mục tiêu */}
                  <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-2.5 transition-all">
                    <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-semibold mb-1">
                      <ShieldCheck size={13} />
                      <span>Trường hợp sử dụng</span>
                    </div>
                    <div className="text-purple-300 font-bold text-xs sm:text-sm truncate">
                      {planData.summary.useCase}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Định hướng chiến dịch
                    </div>
                  </div>
                </div>

                {/* Khối Ma trận phân bổ ngân sách (Progress Bar 3 màu chuẩn) */}
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PieChart size={16} className="text-indigo-400" />
                      <h3 className="text-xs font-bold text-white">
                        Ma Trận Phân Bổ Ngân Sách
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tổng: {planData.summary.totalBudget}
                    </span>
                  </div>

                  {/* Thanh Progress phân bổ tỷ trọng 3 màu */}
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: planData.allocation.bookingPct }}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all"
                      title={`Booking: ${planData.allocation.bookingPct}`}
                    />
                    <div
                      style={{ width: planData.allocation.adsPct }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      title={`Chạy Ads: ${planData.allocation.adsPct}`}
                    />
                    <div
                      style={{ width: planData.allocation.samplePct }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                      title={`Hàng mẫu: ${planData.allocation.samplePct}`}
                    />
                  </div>

                  {/* 3 Thẻ chi tiết phân bổ theo đúng số tiền thực tế */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    {/* Booking KOC */}
                    <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                          Booking KOC
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {planData.allocation.bookingPct}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        {planData.allocation.bookingMoney}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Đảm bảo hợp đồng, bản quyền và cam kết tham gia chia sẻ nội dung.
                      </p>
                    </div>

                    {/* Chạy Ads */}
                    <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                          Chạy Spark Ads
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {planData.allocation.adsPct}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        {planData.allocation.adsMoney}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Triển khai TikTok Spark Ads đẩy video lên xu hướng tối ưu đơn hàng.
                      </p>
                    </div>

                    {/* Hàng Mẫu */}
                    <div className="bg-slate-900/80 border border-slate-700/60 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          Hàng Mẫu (Samples)
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {planData.allocation.samplePct}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        {planData.allocation.sampleMoney}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Mua và gửi hàng mẫu đến tận tay KOC thử nghiệm thực tế.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danh sách các phần nội dung chi tiết */}
                <div className="space-y-2.5">
                  {planData.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className={`p-3.5 rounded-xl transition-all shadow-sm ${
                        sec.isNote
                          ? "bg-amber-950/20 border border-amber-800/40"
                          : "bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-slate-700/50">
                            {getSectionIcon(sec.title)}
                          </span>
                          <h4
                            className={`text-xs font-bold ${
                              sec.isNote ? "text-amber-300" : "text-white"
                            }`}
                          >
                            {sec.title}
                          </h4>
                        </div>

                        <button
                          onClick={() =>
                            handleCopySection(sec.title, sec.content, sec.id)
                          }
                          className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                            copiedSectionId === sec.id
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-700/40 hover:bg-indigo-600 text-slate-300 hover:text-white"
                          }`}
                        >
                          {copiedSectionId === sec.id ? (
                            <Check size={11} />
                          ) : (
                            <Copy size={11} />
                          )}
                          <span>
                            {copiedSectionId === sec.id ? "Đã chép" : "Copy"}
                          </span>
                        </button>
                      </div>

                      {/* Nội dung mục chi tiết */}
                      <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans pl-1">
                        {sec.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Chế độ xem văn bản gốc */
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl h-full overflow-y-auto custom-scrollbar">
                <pre className="text-slate-300 font-sans text-xs leading-relaxed whitespace-pre-wrap">
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
