"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  MessageSquare,
  Zap,
  ShieldCheck,
  Gem,
  Send,
  FileSpreadsheet,
  Brain,
  AlertCircle,
  XCircle,
  MessageCircleQuestion,
  Clock,
  Sparkle,
  MessageSquareCheck,
  User,
  Lightbulb,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface ObjectionPsychology {
  realFear: string;
  staffMistake: string;
}

export interface ObjectionResponseOption {
  index: number;
  rawHeader: string;
  title: string;
  badge: string;
  message: string;
  timing: string;
  charCount: number;
}

export interface OpenQuestionItem {
  label: string;
  question: string;
}

export interface GoldenRuleItem {
  title: string;
  content: string;
}

export interface ParsedObjectionKillerData {
  psychology: ObjectionPsychology;
  responseOptions: ObjectionResponseOption[];
  openQuestions: OpenQuestionItem[];
  goldenRules: GoldenRuleItem[];
  raw: string;
}

interface ObjectionKillerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  onUseSample?: () => void;
}

function cleanQuotesAndCode(str: string): string {
  if (!str) return "";
  let s = str.trim();
  const codeMatch = s.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
  if (codeMatch) {
    s = codeMatch[1].trim();
  }
  s = s.replace(/^\*\*|\*\*$/g, "").trim();
  s = s.replace(/^\[|\]$/g, "").trim();
  s = s.replace(/^["“'«]|["”'»]$/g, "").trim();
  return s.trim();
}

export function parseObjectionKillerOutput(text: string): ParsedObjectionKillerData | null {
  if (!text) return null;

  const findSection = (keywords: string[], nextKeywords: string[] = []) => {
    let bestStart = -1;
    let headerLen = 0;
    for (const kw of keywords) {
      const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${kw}[^\\n]*$`, "im"));
      if (match && match.index !== undefined) {
        bestStart = match.index;
        headerLen = match[0].length;
        break;
      }
    }
    if (bestStart === -1) return "";

    const contentStart = text.slice(bestStart + headerLen);
    let endIdx = contentStart.length;

    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection(["GIẢI MÃ TÂM LÝ", "TÂM LÝ ẨN"], ["BA PHƯƠNG ÁN", "PHƯƠNG ÁN PHẢN HỒI", "KỸ THUẬT"]);
  const s2 = findSection(["BA PHƯƠNG ÁN", "PHƯƠNG ÁN PHẢN HỒI"], ["KỸ THUẬT", "CÂU HỎI MỞ", "NGUYÊN TẮC"]);
  const s3 = findSection(["KỸ THUẬT", "CÂU HỎI MỞ"], ["NGUYÊN TẮC VÀNG", "NGUYÊN TẮC"]);
  const s4 = findSection(["NGUYÊN TẮC VÀNG", "NGUYÊN TẮC"], []);

  // 1. Tâm lý khách
  const psychology: ObjectionPsychology = {
    realFear: "",
    staffMistake: "",
  };

  if (s1) {
    const lines = s1.split("\n");
    for (const line of lines) {
      const stripped = line.replace(/^[-*•]\s+/, "").trim();
      let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);

      if (m) {
        if (/nỗi sợ|sợ thực sự|lo ngại/i.test(m[1])) {
          psychology.realFear = cleanQuotesAndCode(m[2]);
        } else if (/sai lầm|thường mắc|tránh/i.test(m[1])) {
          psychology.staffMistake = cleanQuotesAndCode(m[2]);
        }
      }
    }
  }

  // 2. 3 Phương án phản hồi
  const responseOptions: ObjectionResponseOption[] = [];
  if (s2) {
    const optionBlocks = s2.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));

    optionBlocks.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawHeader = headerMatch ? headerMatch[1].trim() : `Phương Án ${idx + 1}`;
      const title = rawHeader.replace(/^[💎⚡🛡️🚀💡\s]+/, "");

      let message = "";
      let timing = "";

      const msgMatch = chunk.match(/(?:Mẫu tin nhắn|Tin nhắn|Kịch bản)[^\n:]*[:\-]\s*([\s\S]*?)(?=(?:-\s*\*\*Thời điểm|---|$))/i);
      if (msgMatch) {
        message = cleanQuotesAndCode(msgMatch[1]);
      } else {
        const codeMatch = chunk.match(/```(?:[a-zA-Z]*\n)?([\s\S]*?)```/);
        if (codeMatch) message = codeMatch[1].trim();
      }

      const timingMatch = chunk.match(/(?:Thời điểm áp dụng|Thời điểm|Áp dụng khi|Đối tượng)[^\n:]*[:\-]\s*([^\n]+(?:\n[^\n#\-]+)?)/i);
      if (timingMatch) {
        timing = cleanQuotesAndCode(timingMatch[1]);
      }

      let badge = "Khuyên Dùng";
      if (/khan hiếm|15 phút|deal/i.test(title)) {
        badge = "Deal 15 Phút";
      } else if (/đảo ngược|rủi ro|bảo hành|đổi trả/i.test(title)) {
        badge = "Xóa Sạch Rủi Ro";
      } else if (/giá trị/i.test(title)) {
        badge = "Giá Trị Vượt Trội";
      }

      responseOptions.push({
        index: idx + 1,
        rawHeader,
        title,
        badge,
        message,
        timing,
        charCount: message.length,
      });
    });
  }

  // 3. Kỹ thuật câu hỏi mở
  const openQuestions: OpenQuestionItem[] = [];
  if (s3) {
    const qMatches = s3.split(/(?=(?:[-*•]\s*\*\*|###\s*))/g);
    for (const qChunk of qMatches) {
      const trimmed = qChunk.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;

      const labelMatch = trimmed.match(/^[-*•]?\s*(?:\*\*)?([^:\n]+?)(?:\*\*)?\s*:\s*([\s\S]+)$/);
      if (labelMatch) {
        const label = labelMatch[1].trim();
        const content = cleanQuotesAndCode(labelMatch[2]);
        if (content) {
          openQuestions.push({
            label,
            question: content,
          });
        }
      }
    }
  }

  // 4. Nguyên tắc vàng
  const goldenRules: GoldenRuleItem[] = [];
  if (s4) {
    const lines = s4.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed === "---") continue;
      if (/3 mẹo|nguyên tắc vàng/i.test(trimmed) && !trimmed.includes("**")) continue;

      const stripped = trimmed.replace(/^(?:\d+[\.\)]|\-|\*|•)\s+/, "").trim();
      let m = stripped.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      if (!m) m = stripped.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);

      if (m) {
        const content = cleanQuotesAndCode(m[2]);
        if (content) {
          goldenRules.push({
            title: m[1].replace(/^\*\*|\*\*$/g, "").trim(),
            content,
          });
        }
      } else if (stripped.length > 5 && !/tỷ lệ chốt đơn/i.test(stripped)) {
        goldenRules.push({
          title: `Nguyên tắc ${goldenRules.length + 1}`,
          content: cleanQuotesAndCode(stripped),
        });
      }
    }
  }

  return {
    psychology,
    responseOptions,
    openQuestions,
    goldenRules,
    raw: text,
  };
}

export function ObjectionKillerOutput({
  result,
  loading,
  productName,
  onUseSample,
}: ObjectionKillerOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "psychology" | "options" | "questions" | "rules">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parseObjectionKillerOutput(result);
  }, [result]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleCopyAllOptions = () => {
    if (!parsed || parsed.responseOptions.length === 0) return;
    const text = parsed.responseOptions
      .map((opt) => `### ${opt.title} (${opt.badge})\n${opt.message}\n(Thời điểm: ${opt.timing})`)
      .join("\n\n---\n\n");
    handleCopy(text, "options_all", "Đã sao chép 3 phương án phản hồi!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 3 Phương án
      const optRows = parsed.responseOptions.map((opt) => ({
        STT: opt.index,
        "Phương Án": opt.title,
        "Đặc Trưng": opt.badge,
        "Mẫu Tin Nhắn Phản Hồi": opt.message,
        "Thời Điểm Áp Dụng": opt.timing,
        "Số Ký Tự": opt.charCount,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(optRows), "3_PhuongAn_PhanHoi");

      // Sheet 2: Tâm lý khách
      const psychRows = [
        { "Góc Nhìn": "Nỗi sợ thực sự của khách", "Phân Tích": parsed.psychology.realFear },
        { "Góc Nhìn": "Sai lầm nhân viên thường mắc", "Phân Tích": parsed.psychology.staffMistake },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(psychRows), "GiaiMa_TamLy");

      // Sheet 3: Câu hỏi mở
      const qRows = parsed.openQuestions.map((q, idx) => ({
        STT: idx + 1,
        "Loại Câu Hỏi": q.label,
        "Nội Dung Câu Hỏi Chốt": q.question,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qRows), "CauHoiMo_ChotDon");

      // Sheet 4: Nguyên tắc vàng
      const ruleRows = parsed.goldenRules.map((r, idx) => ({
        STT: idx + 1,
        "Nguyên Tắc": r.title,
        "Nội Dung Chi Tiết": r.content,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ruleRows), "NguyenTac_TrucChat");

      const safeName = (productName || "san-pham").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const fileName = `kich-ban-be-gay-tu-choi-${safeName}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã xuất file Excel kịch bản chốt đơn!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (productName || "san-pham").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    a.download = `kich-ban-chot-don-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  const getOptionTheme = (index: number) => {
    switch (index) {
      case 1:
        return {
          icon: Gem,
          color: "text-emerald-400",
          badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          border: "border-emerald-500/30 hover:border-emerald-500/50",
          bubbleBg: "bg-emerald-950/20 border-emerald-500/20",
        };
      case 2:
        return {
          icon: Zap,
          color: "text-amber-400",
          badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          border: "border-amber-500/30 hover:border-amber-500/50",
          bubbleBg: "bg-amber-950/20 border-amber-500/20",
        };
      case 3:
        return {
          icon: ShieldCheck,
          color: "text-blue-400",
          badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          border: "border-blue-500/30 hover:border-blue-500/50",
          bubbleBg: "bg-blue-950/20 border-blue-500/20",
        };
      default:
        return {
          icon: MessageSquare,
          color: "text-slate-400",
          badgeBg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
          border: "border-slate-800 hover:border-slate-700",
          bubbleBg: "bg-slate-950/40 border-slate-800",
        };
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini phản hồi */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-emerald-400 text-xs font-semibold shadow-xl border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ tối giản */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2.5 relative z-10 bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
            <MessageSquareCheck size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-white text-xs sm:text-sm truncate">
              Kịch Bản Bẻ Gãy Từ Chối &amp; Trợ Lý Chốt Đơn 1-1
            </h2>
          </div>
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mô phỏng chat
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Gốc
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Xuất file Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span className="hidden xl:inline text-[11px] font-medium">Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Tải file .txt"
            >
              <Download size={13} />
            </button>

            <button
              type="button"
              onClick={() => handleCopy(result, "all", "Đã sao chép toàn bộ kịch bản chốt đơn!")}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              {copiedKey === "all" ? (
                <>
                  <Check size={12} className="stroke-[3]" /> Đã chép
                </>
              ) : (
                <>
                  <Copy size={12} /> Sao chép tất cả
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Đoạn Tinh Tế */}
      {result && viewMode === "interactive" && !loading && (
        <div className="px-3.5 py-1.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-1 overflow-x-auto custom-scrollbar relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "all"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("psychology")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "psychology"
                ? "bg-slate-800 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-purple-300"
            }`}
          >
            <Brain size={12} />
            <span>Giải mã tâm lý</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("options")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "options"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <MessageSquare size={12} />
            <span>3 Phương án phản hồi (3)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "questions"
                ? "bg-slate-800 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-blue-300"
            }`}
          >
            <Send size={12} />
            <span>Câu hỏi mở chốt đơn ({parsed?.openQuestions.length || 2})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "rules"
                ? "bg-slate-800 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            <Clock size={12} />
            <span>Nguyên tắc trực chat</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị kết quả (cuộn nội bộ) */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Sparkles size={22} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Soạn Kịch Bản Bẻ Gãy Lời Từ Chối...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang giải mã tâm lý ngầm, tính toán ưu đãi nhượng bộ và tạo 3 kịch bản chốt sale trong 3 phút...
              </p>
            </div>
          </div>
        ) : result && parsed ? (
          <div className="space-y-4">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dữ liệu Markdown gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép Markdown!")}
                    className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="w-full h-[500px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* ========================================================================= */}
                {/* 1. GIẢI MÃ TÂM LÝ ẨN SAU LỜI TỪ CHỐI                                      */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "psychology") && (parsed.psychology.realFear || parsed.psychology.staffMistake) && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Brain size={14} className="text-purple-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          1. Giải Mã Tâm Lý Ẩn Sau Lời Từ Chối
                        </h3>
                      </div>
                      <span className="text-[11px] text-purple-400 font-medium">
                        Đọc vị khách hàng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parsed.psychology.realFear && (
                        <div className="bg-slate-900/80 rounded-xl border border-amber-500/20 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <AlertCircle size={13} className="text-amber-400 shrink-0" />
                              Nỗi sợ thực sự của khách:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.psychology.realFear, "fear", "Đã chép nỗi sợ thực sự!")}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                              title="Sao chép"
                            >
                              {copiedKey === "fear" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed break-words select-text">
                            {parsed.psychology.realFear}
                          </p>
                        </div>
                      )}

                      {parsed.psychology.staffMistake && (
                        <div className="bg-slate-900/80 rounded-xl border border-rose-500/20 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                              <XCircle size={13} className="text-rose-400 shrink-0" />
                              Sai lầm nhân viên thường mắc:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.psychology.staffMistake, "mistake", "Đã chép sai lầm cần tránh!")}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                              title="Sao chép"
                            >
                              {copiedKey === "mistake" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed break-words select-text">
                            {parsed.psychology.staffMistake}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. BA PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI TỨC THÌ                           */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "options") && parsed.responseOptions.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          2. Ba Phương Án Phản Hồi Bẻ Gãy Từ Chối Tức Thì
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAllOptions}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "options_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>Sao chép 3 phương án</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {parsed.responseOptions.map((opt) => {
                        const theme = getOptionTheme(opt.index);
                        const IconComp = theme.icon;

                        return (
                          <div
                            key={opt.index}
                            className={`bg-slate-900/80 rounded-xl border ${theme.border} p-3.5 space-y-3 transition-all`}
                          >
                            {/* Tiêu đề & Nhãn phương án */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className={`p-1.5 rounded-lg bg-slate-800/80 ${theme.color}`}>
                                  <IconComp size={14} />
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-white">
                                  {opt.title}
                                </h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                                  {opt.badge}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(opt.message, `opt_${opt.index}`, `Đã chép ${opt.title}!`)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                {copiedKey === `opt_${opt.index}` ? (
                                  <>
                                    <Check size={12} className="stroke-[3] text-emerald-400" /> Đã chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} /> Sao chép tin nhắn
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Bong bóng chat mô phỏng */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <User size={12} className="text-emerald-400" />
                                  Tin nhắn gửi trực tiếp khách hàng:
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-800">
                                  {opt.charCount} ký tự • Chuẩn sàn
                                </span>
                              </div>

                              <div
                                onClick={() => handleCopy(opt.message, `opt_${opt.index}`, `Đã chép ${opt.title}!`)}
                                className={`p-3.5 rounded-xl border text-xs text-slate-200 leading-relaxed break-words select-text cursor-pointer hover:bg-slate-950/80 transition relative group ${theme.bubbleBg}`}
                                title="Bấm để sao chép nhanh"
                              >
                                {opt.message}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
                                  Bấm để copy
                                </div>
                              </div>
                            </div>

                            {/* Thời điểm áp dụng */}
                            {opt.timing && (
                              <div className="text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/60 flex items-center gap-1.5">
                                <Clock size={12} className="text-amber-400 shrink-0" />
                                <span><b>Thời điểm áp dụng:</b> {opt.timing}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. KỸ THUẬT "CÂU HỎI MỞ" BUỘC KHÁCH PHẢI TRẢ LỜI                          */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "questions") && parsed.openQuestions.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Send size={14} className="text-blue-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          3. Kỹ Thuật &ldquo;Câu Hỏi Mở&rdquo; Buộc Khách Phải Trả Lời
                        </h3>
                      </div>
                      <span className="text-[11px] text-blue-400 font-medium">
                        Chống khách im lặng rời đi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parsed.openQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 rounded-xl border border-blue-500/20 p-3.5 space-y-2.5 hover:border-blue-500/40 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                                <MessageCircleQuestion size={13} className="text-blue-400 shrink-0" />
                                {q.label}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(q.question, `q_${idx}`, `Đã chép ${q.label}!`)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `q_${idx}` ? (
                                  <>
                                    <Check size={11} className="stroke-[3] text-emerald-400" /> Đã chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} /> Sao chép
                                  </>
                                )}
                              </button>
                            </div>

                            <div
                              onClick={() => handleCopy(q.question, `q_${idx}`, `Đã chép ${q.label}!`)}
                              className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed break-words select-text cursor-pointer hover:border-blue-500/30 transition"
                              title="Bấm để sao chép"
                            >
                              &ldquo;{q.question}&rdquo;
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. NGUYÊN TẮC VÀNG KHI TRỰC CHAT SÀN                                     */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "rules") && parsed.goldenRules.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          4. Nguyên Tắc Vàng Khi Trực Chat Sàn
                        </h3>
                      </div>
                      <span className="text-[11px] text-amber-400 font-medium">
                        Tăng tỷ lệ chốt đơn (CR) 15% ➔ 40%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {parsed.goldenRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3 space-y-1.5 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                              <Lightbulb size={13} className="text-amber-400 shrink-0" />
                              {rule.title}
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed break-words select-text">
                              {rule.content}
                            </p>
                          </div>

                          <div className="pt-2 mt-1 border-t border-slate-800/60 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopy(`${rule.title}: ${rule.content}`, `rule-${idx}`, `Đã chép ${rule.title}!`)}
                              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer font-medium"
                            >
                              {copiedKey === `rule-${idx}` ? (
                                <>
                                  <Check size={11} className="text-emerald-400" /> Đã chép
                                </>
                              ) : (
                                <>
                                  <Copy size={11} /> Chép nguyên tắc
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-emerald-400 shadow-inner">
              <MessageSquare size={24} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-semibold text-slate-200 text-sm">Chưa Có Kịch Bản Bẻ Gãy Từ Chối</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập câu từ chối của khách &amp; ưu đãi có thể nhượng bộ bên trái, sau đó bấm &ldquo;Bẻ Gãy Lời Từ Chối Ngay&rdquo;.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkle size={13} />
                <span>Thử dữ liệu mẫu để xem giao diện</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectionKillerOutput;
