"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCheck,
  ArrowRight,
  ExternalLink,
  Flame,
  Scale,
  RotateCcw,
  Tag,
  Ban,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";
import { ScanReport } from "@/lib/policy-blacklist/dictionary";

export interface ViolationItem {
  id: number;
  phrase: string;
  category: string;
  reason: string;
  solution: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface RiskAudit {
  riskLevel: string;
  score: number;
  summary: string;
  policies: string[];
}

export interface SafeRewriteData {
  text: string;
  charCount: number;
  wordCount: number;
}

export interface ParsedPolicyData {
  audit: RiskAudit;
  violations: ViolationItem[];
  rewrite: SafeRewriteData | null;
  tips: string[];
  safeTags: string[];
  forbiddenTags: string[];
  hasStructuredData: boolean;
  raw: string;
}

interface PolicyCheckerOutputProps {
  scanReport: ScanReport | null;
  aiOutput: string | null;
  isLoading: boolean;
  platform: string;
  onUseSample?: () => void;
  onApplySafeText?: (cleanText: string) => void;
}

// Bộ phân tích dữ liệu kiểm duyệt chính sách sàn
function parsePolicyCheckerOutput(
  aiText: string | null,
  scanReport: ScanReport | null
): ParsedPolicyData | null {
  if (!aiText && !scanReport) return null;

  const rawText = aiText || "";

  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    if (!rawText) return "";
    const match = rawText.match(new RegExp(`^[ \\t]*(?:##|\\*\\*|#)?\\s*[^\\n]*?${keyword}[^\\n]*$`, "im"));
    if (!match || match.index === undefined) return "";

    const contentStartIdx = match.index + match[0].length;
    const contentStart = rawText.slice(contentStartIdx);

    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|\\*\\*|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1Raw = findSection("ĐÁNH GIÁ RỦI RO", ["DANH SÁCH", "ĐIỂM VI PHẠM"]);
  const s2Raw = findSection("ĐIỂM VI PHẠM", ["BẢN VIẾT LẠI", "BẢN SẠCH"]);
  const s3Raw = findSection("BẢN VIẾT LẠI", ["LỜI KHUYÊN", "KHUYẾN NGHỊ"]);
  const s4Raw = findSection("LỜI KHUYÊN", []);

  // 1. Phân tích Thước đo & Đánh giá Rủi ro
  let riskLevel = "NGUY HIỂM";
  let score = scanReport ? scanReport.score : 20;
  let summary = "";
  const policies: string[] = [];

  if (s1Raw) {
    const riskMatch = s1Raw.match(/(?:Mức độ rủi ro|Rủi ro)\s*:\s*(.+)$/im);
    if (riskMatch) riskLevel = riskMatch[1].replace(/[*_]/g, "").trim();

    const scoreMatch = s1Raw.match(/(?:Điểm an toàn|Điểm)\s*:\s*(\d+)/i);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    } else if (!scanReport) {
      if (/an toàn/i.test(riskLevel)) score = 95;
      else if (/cảnh báo|nhẹ|trung bình/i.test(riskLevel)) score = 65;
      else score = 25;
    }

    const sumMatch = s1Raw.match(/(?:Tóm tắt tình trạng|Tóm tắt)\s*:\s*(.+)$/im);
    if (sumMatch) summary = sumMatch[1].replace(/[*_]/g, "").trim();

    const polMatch = s1Raw.match(/(?:Các chính sách bị vi phạm|Chính sách vi phạm)\s*:\s*(.+)$/im);
    if (polMatch) {
      const rawPol = polMatch[1].replace(/[*_]/g, "").trim();
      rawPol.split(/[;,]/).forEach((p) => {
        const cleaned = p.trim();
        if (cleaned) policies.push(cleaned);
      });
    }
  } else if (scanReport) {
    score = scanReport.score;
    if (scanReport.riskLevel === "DANGER") {
      riskLevel = "NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY";
      summary = `Hệ thống phát hiện ${scanReport.totalViolations} từ khóa vi phạm nghiêm trọng có nguy cơ bị gỡ sản phẩm hoặc khóa shop.`;
    } else if (scanReport.riskLevel === "WARNING") {
      riskLevel = "CẢNH BÁO - CÓ TỪ NGỮ NHẠY CẢM";
      summary = `Phát hiện ${scanReport.totalViolations} điểm cần sửa đổi để tránh bị bóp tương tác hoặc cấm chạy quảng cáo.`;
    } else {
      riskLevel = "AN TOÀN - ĐẠT CHUẨN CHÍNH SÁCH SÀN";
      summary = "Không phát hiện vi phạm từ cấm theo từ điển chính sách sàn 2026.";
    }
  }

  // 2. Bảng Tra Cứu Vi Phạm
  const violations: ViolationItem[] = [];
  if (s2Raw) {
    const lines = s2Raw.split("\n");
    let count = 1;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          if (/^:?-+:?$/.test(parts[0]) || /từ ngữ|điểm vi phạm/i.test(parts[0])) continue;
          const phrase = parts[0].replace(/[*_"]/g, "").trim();
          const category = parts[1]?.replace(/[*_]/g, "").trim() || "Chính sách sàn";
          const reason = parts[2]?.replace(/[*_]/g, "").trim() || "";
          const solution = parts[3]?.replace(/[*_]/g, "").replace(/^Thay bằng:\s*/i, "").trim() || "";

          let severity: ViolationItem["severity"] = "HIGH";
          if (/ngoài sàn|zalo|hotline|sđt|chuyển khoản|stk|100%|dứt điểm|tiền mặt/i.test(phrase + category)) {
            severity = "CRITICAL";
          } else if (/số 1|nhất|top 1|gucci|chanel|thần dược/i.test(phrase + category)) {
            severity = "HIGH";
          } else {
            severity = "MEDIUM";
          }

          if (phrase) {
            violations.push({ id: count++, phrase, category, reason, solution, severity });
          }
        }
      }
    }
  }

  // Nếu AI chưa trả về nhưng scanReport có từ cấm, fallback sang matches của scanReport
  if (violations.length === 0 && scanReport && scanReport.matches.length > 0) {
    scanReport.matches.forEach((m, idx) => {
      violations.push({
        id: idx + 1,
        phrase: m.matchedText,
        category: m.categoryLabel,
        reason: m.reason,
        solution: m.suggestion,
        severity: m.severity,
      });
    });
  }

  // 3. Bản Viết Lại An Toàn 100%
  let safeText = s3Raw.replace(/^\s*\*\([^*]+\)\*\s*/, "").trim();
  safeText = safeText.replace(/^[\*\-_"'\s]+|[\*\-_"'\s]+$/g, "").trim();

  const rewrite: SafeRewriteData | null = safeText
    ? {
        text: safeText,
        charCount: safeText.length,
        wordCount: safeText.trim().split(/\s+/).length,
      }
    : null;

  // 4. Lời Khuyên & Tags
  const tips: string[] = [];
  if (s4Raw) {
    const tipLines = s4Raw.split("\n");
    for (const line of tipLines) {
      const match = line.match(/^[-*•\d.]+\s*(.+)$/);
      if (match) {
        const tip = match[1].replace(/[*_]/g, "").trim();
        if (tip) tips.push(tip);
      }
    }
  }

  const safeTags: string[] = [];
  const forbiddenTags: string[] = [];

  violations.forEach((v) => {
    if (v.phrase && !forbiddenTags.includes(v.phrase)) {
      forbiddenTags.push(v.phrase.replace(/^"|"$/g, "").trim());
    }
    if (v.solution) {
      const cleanSol = v.solution.replace(/^"|"$/g, "").replace(/^Thay bằng:\s*/i, "").trim();
      if (cleanSol && !safeTags.includes(cleanSol) && cleanSol.length < 50) {
        safeTags.push(cleanSol);
      }
    }
  });

  const hasStructuredData = violations.length > 0 || !!rewrite || !!s1Raw;

  return {
    audit: { riskLevel, score, summary, policies },
    violations,
    rewrite,
    tips,
    safeTags,
    forbiddenTags,
    hasStructuredData,
    raw: rawText || JSON.stringify(scanReport, null, 2),
  };
}

export function PolicyCheckerOutput({
  scanReport,
  aiOutput,
  isLoading,
  platform,
  onUseSample,
  onApplySafeText,
}: PolicyCheckerOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "audit" | "violations" | "rewrite" | "tips">("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parsePolicyCheckerOutput(aiOutput, scanReport);
  }, [aiOutput, scanReport]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép vào bộ nhớ đệm!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Sao chép toàn bộ bảng TSV để dán trực tiếp vào Google Sheet / Excel
  const handleCopyTsv = () => {
    if (!parsed || parsed.violations.length === 0) return;
    const headers = ["Từ ngữ vi phạm", "Mức độ", "Nhóm chính sách", "Lý do phạt", "Giải pháp thay thế"];
    const rows = parsed.violations.map((v) => [
      v.phrase,
      v.severity,
      v.category,
      v.reason,
      v.solution,
    ]);
    const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    handleCopy(tsv, "tsv", "Đã sao chép bảng tra cứu vi phạm (dán được vào Google Sheets & Excel)!");
  };

  // Xuất file Excel (.xlsx) chuyên nghiệp với 2 sheets
  const handleExportExcel = () => {
    if (!parsed) return;

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Bảng Tra Cứu Vi Phạm
      const violationsData = parsed.violations.map((v, i) => ({
        STT: i + 1,
        "Từ ngữ / Câu vi phạm": v.phrase,
        "Mức độ rủi ro": v.severity,
        "Nhóm chính sách sàn": v.category,
        "Lý do thuật toán phạt": v.reason,
        "Giải pháp khắc phục an toàn": v.solution,
      }));
      const wsViolations = XLSX.utils.json_to_sheet(violationsData);
      XLSX.utils.book_append_sheet(wb, wsViolations, "DiemViPham");

      // Sheet 2: Bản Viết Lại An Toàn & Lời Khuyên
      const safeData = [
        { Muc: "Nền tảng kiểm duyệt", NoiDung: platform },
        { Muc: "Mức độ rủi ro", NoiDung: parsed.audit.riskLevel },
        { Muc: "Điểm số an toàn", NoiDung: `${parsed.audit.score}/100` },
        { Muc: "Tóm tắt kết luận", NoiDung: parsed.audit.summary },
        { Muc: "Bản Viết Lại An Toàn 100%", NoiDung: parsed.rewrite?.text || "Chưa có" },
        ...parsed.tips.map((tip, idx) => ({
          Muc: `Lời khuyên thực chiến #${idx + 1}`,
          NoiDung: tip,
        })),
      ];
      const wsSafe = XLSX.utils.json_to_sheet(safeData);
      XLSX.utils.book_append_sheet(wb, wsSafe, "BanVietLai_AnToan");

      const fileName = `bao-cao-chinh-sach-${platform.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã tải xuống file Excel báo cáo vi phạm thành công!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel. Đã chuyển sang sao chép toàn bộ.");
    }
  };

  // Tải file .txt báo cáo
  const handleDownloadTxt = () => {
    if (!parsed) return;
    const content = parsed.raw || aiOutput || (scanReport ? JSON.stringify(scanReport, null, 2) : "");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-vi-pham-${platform.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống báo cáo chi tiết (.txt)!");
  };

  const score = parsed?.audit.score ?? (scanReport?.score ?? 100);
  const isDanger = score < 60 || /nguy hiểm|khóa link|ăn gậy/i.test(parsed?.audit.riskLevel || "");
  const isWarning = !isDanger && (score < 90 || /cảnh báo|nhẹ/i.test(parsed?.audit.riskLevel || ""));
  const isSafe = !isDanger && !isWarning;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast phản hồi mini */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl shadow-emerald-950/60 border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCheck size={14} className="stroke-[3]" />
          {toastMessage}
        </div>
      )}

      {/* Hiệu ứng nền mờ theo mức độ rủi ro */}
      <div
        className={`absolute top-0 right-0 p-40 rounded-full blur-[110px] pointer-events-none transition-all duration-700 ${
          isDanger ? "bg-rose-500/15" : isWarning ? "bg-amber-500/15" : "bg-emerald-500/15"
        }`}
      />
      <div className="absolute bottom-0 left-0 p-40 bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Header thanh công cụ */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
              isDanger
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : isWarning
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {isDanger ? (
              <ShieldAlert size={18} />
            ) : isWarning ? (
              <AlertTriangle size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none flex items-center gap-1.5">
              Kết Quả Soi Vi Phạm
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {platform}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đối chiếu thuật toán kiểm duyệt sàn 2026
            </p>
          </div>
        </div>

        {/* Nút hành động */}
        {parsed && !isLoading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem */}
            <div className="bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trực Quan
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Báo Cáo Thô
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Xuất Bảng Vi Phạm & Bản Sạch Ra File Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span className="hidden xl:inline text-[11px]">Excel</span>
            </button>

            {/* Tải file .txt */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Tải báo cáo .txt"
            >
              <Download size={14} />
            </button>

            {/* Sao chép tất cả */}
            <button
              type="button"
              onClick={() => handleCopy(parsed.raw, "all", "Đã sao chép toàn bộ báo cáo vi phạm!")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                copiedKey === "all"
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
              }`}
            >
              {copiedKey === "all" ? (
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

      {/* Thanh bộ lọc Tabs chuyên sâu */}
      {parsed && viewMode === "visual" && !isLoading && (
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "all"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={13} /> 1. Thước Đo Rủi Ro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("violations")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "violations"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle size={13} /> 2. Điểm Vi Phạm ({parsed.violations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rewrite")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "rewrite"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={13} /> 3. Bản Viết Lại An Toàn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "tips"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info size={13} /> 4. Lời Khuyên & Tags
          </button>
        </div>
      )}

      {/* Vùng hiển thị nội dung chính */}
      <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-amber-500/20 to-emerald-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
                <Sparkles size={28} className="animate-spin text-rose-400 duration-1000" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Soi Từ Cấm & Viết Lại Bản Sạch...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang đối chiếu thuật toán chính sách sàn {platform}, phân tích ngữ cảnh và biên tập lại bản an toàn 100% không lo bị phạt...
              </p>
            </div>
          </div>
        ) : parsed ? (
          <div className="space-y-6">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dữ liệu Markdown thô:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(parsed.raw, "rawText", "Đã sao chép nội dung Markdown!")}
                    className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                </div>
                <textarea
                  readOnly
                  value={parsed.raw}
                  className="w-full h-[520px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* ========================================================================= */}
                {/* MỤC 1: 🛡️ THƯỚC ĐO AN TOÀN & ĐÁNH GIÁ RỦI RO                             */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "audit") && (
                  <div
                    className={`rounded-2xl border p-5 relative overflow-hidden transition-all ${
                      isDanger
                        ? "bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-800/60 shadow-lg shadow-rose-950/30"
                        : isWarning
                        ? "bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-800/60 shadow-lg shadow-amber-950/30"
                        : "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-800/60 shadow-lg shadow-emerald-950/30"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            isDanger
                              ? "bg-rose-600 text-white"
                              : isWarning
                              ? "bg-amber-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {isDanger ? (
                            <ShieldAlert size={26} />
                          ) : isWarning ? (
                            <AlertTriangle size={26} />
                          ) : (
                            <ShieldCheck size={26} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              🛡️ 1. Thước Đo An Toàn & Đánh Giá Rủi Ro
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                isDanger
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : isWarning
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              }`}
                            >
                              {parsed.audit.riskLevel}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white mt-1">
                            {isDanger
                              ? "Rủi Ro Nghiêm Trọng: Chắc Chắn Ăn Gậy Hoặc Khóa Link!"
                              : isWarning
                              ? "Cảnh Báo: Chứa Từ Ngữ Nhạy Cảm Dễ Bị Bóp Reach!"
                              : "Hoàn Toàn An Toàn: Đạt Chuẩn 100% Chính Sách Sàn!"}
                          </h3>
                        </div>
                      </div>

                      {/* Điểm số an toàn lớn */}
                      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Chỉ Số An Toàn
                          </span>
                          <span className="text-xs text-slate-400">
                            {score >= 90 ? "Rất an tâm" : score >= 60 ? "Cần chỉnh sửa" : "Nguy cơ cao"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-3xl sm:text-4xl font-black ${
                              isDanger
                                ? "text-rose-400"
                                : isWarning
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {score}
                          </span>
                          <span className="text-xs font-bold text-slate-500">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Tóm tắt & 3 thẻ stats */}
                    <div className="pt-4 space-y-3">
                      {parsed.audit.summary && (
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                          <strong className="text-white block mb-1">📌 Kết luận từ chuyên gia kiểm duyệt:</strong>
                          {parsed.audit.summary}
                        </p>
                      )}

                      {/* 3 mini stat cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] font-semibold text-slate-400 block">Số điểm vi phạm</span>
                          <span className="text-base font-black text-rose-400">
                            {parsed.violations.length} lỗi gắn cờ
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] font-semibold text-slate-400 block">Mức phạt dự kiến</span>
                          <span className="text-base font-black text-amber-400">
                            {isDanger ? "Khóa link & Trừ điểm shop" : isWarning ? "Hạn chế phân phối / Bóp live" : "Được duyệt ngay"}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                          <span className="text-[10px] font-semibold text-slate-400 block">Giải pháp tối ưu</span>
                          <span className="text-base font-black text-emerald-400">
                            Đã có Bản Viết Lại 100%
                          </span>
                        </div>
                      </div>

                      {/* Các điều khoản sàn liên quan nếu có */}
                      {parsed.audit.policies.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">Chính sách vi phạm:</span>
                          {parsed.audit.policies.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono text-[10px]"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* MỤC 2: ⚠️ BẢNG TRA CỨU VI PHẠM & GIẢI PHÁP THAY THẾ (VIOLATION MATRIX)     */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "violations") && (
                  <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                            ⚠️ 2. Bảng Tra Cứu Vi Phạm & Giải Pháp Thay Thế
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Phát hiện {parsed.violations.length} điểm nhạy cảm cần loại bỏ trước khi đăng sàn
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const forbiddenList = parsed.violations.map((v) => v.phrase).join(", ");
                            handleCopy(forbiddenList, "forbiddenList", "Đã sao chép danh sách từ cấm!");
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                          title="Sao chép toàn bộ danh sách từ cấm"
                        >
                          <Copy size={12} />
                          <span>Sao chép từ cấm</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyTsv}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                          title="Sao chép dạng TSV để dán trực tiếp vào Google Sheets / Excel"
                        >
                          <FileSpreadsheet size={13} className="text-emerald-400" />
                          <span>Sao chép bảng (TSV)</span>
                        </button>
                      </div>
                    </div>

                    {/* Bảng dữ liệu vi phạm chuẩn hóa */}
                    {parsed.violations.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                              <th className="py-2.5 px-3 w-8 text-center">#</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Từ Ngữ Vi Phạm</th>
                              <th className="py-2.5 px-3 min-w-[120px]">Nhóm Chính Sách</th>
                              <th className="py-2.5 px-3 min-w-[180px]">Lý Do Thuật Toán Phạt</th>
                              <th className="py-2.5 px-3 min-w-[180px]">Giải Pháp Khắc Phục</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {parsed.violations.map((v, index) => (
                              <tr
                                key={v.id || index}
                                className="hover:bg-slate-900/60 transition-colors group"
                              >
                                <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                                  {index + 1}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                      &quot;{v.phrase}&quot;
                                    </span>
                                    <span
                                      className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                        v.severity === "CRITICAL"
                                          ? "bg-rose-600 text-white"
                                          : v.severity === "HIGH"
                                          ? "bg-amber-600 text-white"
                                          : "bg-slate-700 text-slate-300"
                                      }`}
                                    >
                                      {v.severity}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 inline-block">
                                    {v.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-400 text-[11px] leading-relaxed">
                                  {v.reason}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
                                    <span className="text-xs font-bold text-emerald-300">
                                      {v.solution}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(v.solution, `sol-${index}`, `Đã sao chép giải pháp: ${v.solution}`)}
                                      className="p-1 rounded hover:bg-emerald-900/60 text-emerald-400 hover:text-white transition cursor-pointer shrink-0"
                                      title="Sao chép từ thay thế này"
                                    >
                                      {copiedKey === `sol-${index}` ? (
                                        <Check size={12} className="text-emerald-400" />
                                      ) : (
                                        <Copy size={12} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                        <p className="font-bold text-sm text-white">Tuyệt vời! Không phát hiện vi phạm</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Nội dung của bạn không dính bất kỳ từ khóa cấm nào theo thuật toán hiện tại.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* MỤC 3: ✨ BẢN VIẾT LẠI AN TOÀN 100% (READY TO USE)                        */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "rewrite") && parsed.rewrite && (
                  <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 rounded-2xl border border-emerald-500/40 p-5 space-y-3.5 shadow-xl shadow-emerald-950/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Sparkles size={18} />
                          <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                            ✅ 3. Bản Viết Lại An Toàn 100% (Ready-to-Use)
                          </h3>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ĐÃ TỐI ƯU SẠCH
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Đã loại bỏ toàn bộ từ cấm, giữ trọn sức hút bán hàng và công thức chuyển đổi cao
                        </p>
                      </div>

                      {/* Nút hành động cho Bản Sạch */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {onApplySafeText && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplySafeText(parsed.rewrite!.text);
                              showToast("Đã dán bản sạch vào ô nhập bên trái!");
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                            title="Dán đè bản sạch này vào ô nhập văn bản để tiếp tục chỉnh sửa"
                          >
                            <RotateCcw size={12} />
                            <span>Dán Vào Ô Nhập</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopy(parsed.rewrite!.text, "safeRewrite", "Đã sao chép bản viết lại an toàn 100%!")}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-950/60 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === "safeRewrite" ? (
                            <>
                              <Check size={13} className="stroke-[3]" /> Đã Sao Chép!
                            </>
                          ) : (
                            <>
                              <Copy size={13} /> Sao Chép Bản Sạch
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Thống kê ký tự & số từ */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <div className="flex items-center gap-3">
                        <span>Số từ: <strong className="text-slate-200 font-mono">{parsed.rewrite.wordCount}</strong></span>
                        <span>Tổng ký tự: <strong className="text-slate-200 font-mono">{parsed.rewrite.charCount}</strong></span>
                      </div>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Check size={12} /> Sẵn sàng đăng Shopee / TikTok Shop
                      </span>
                    </div>

                    {/* Khung nội dung bản sạch */}
                    <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-emerald-500/20 text-slate-100 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {parsed.rewrite.text}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* MỤC 4: 💡 LỜI KHUYÊN TỪ CHUYÊN GIA & BỘ TAGS AN TOÀN                       */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "tips") && (
                  <div className="space-y-4">
                    {/* Tags tương tác Click-to-copy */}
                    <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-emerald-400" />
                          <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                            🏷️ Bộ Từ Khóa An Toàn Khuyên Dùng (Click Để Copy)
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-500">Bấm từng từ để dán nhanh</span>
                      </div>

                      {parsed.safeTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {parsed.safeTags.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCopy(tag, `tag-${idx}`, `Đã sao chép từ khóa: "${tag}"`)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                copiedKey === `tag-${idx}`
                                  ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950/50 scale-105"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-102"
                              }`}
                            >
                              {copiedKey === `tag-${idx}` ? (
                                <Check size={12} className="stroke-[3]" />
                              ) : (
                                <CheckCircle2 size={12} className="text-emerald-400" />
                              )}
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Chưa có danh sách từ thay thế.</p>
                      )}

                      {/* Danh sách từ cấm tuyệt đối */}
                      {parsed.forbiddenTags.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                            <Ban size={13} />
                            <span>Từ ngữ tuyệt đối không dùng trong bài đăng:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {parsed.forbiddenTags.map((ft, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/40 font-mono text-[11px] line-through opacity-80"
                              >
                                {ft}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Khối lời khuyên thực chiến */}
                    {parsed.tips.length > 0 && (
                      <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-400">
                          <Info size={16} />
                          <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                            💡 4. Lời Khuyên Thực Chiến Tránh Thuật Toán Quét
                          </h3>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                          {parsed.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>Nền tảng: <strong className="text-slate-300">{platform}</strong></span>
                <span>Điểm vi phạm: <strong className="text-rose-400">{parsed.violations.length}</strong></span>
                <span>Điểm an toàn: <strong className={isDanger ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"}>{score}/100</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check size={12} /> Đã kiểm duyệt theo chính sách sàn 2026
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* EMPTY STATE ĐẸP MẮT & NÚT DÙNG THỬ MẪU                                    */
          /* ========================================================================= */
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-800/40 border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-lg">
              <ShieldAlert size={30} className="text-rose-400/80" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <p className="font-bold text-base text-slate-200">
                Chưa Có Kết Quả Soi Vi Phạm
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập hoặc dán nội dung mô tả, tiêu đề hoặc kịch bản cần kiểm tra ở khung bên trái. Hệ thống sẽ rà soát 100% từ cấm và viết lại bản an toàn ngay.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <Sparkles size={14} />
                <span>Dùng Thử Nội Dung Mẫu Vi Phạm</span>
              </button>
            )}

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-left w-full max-w-md text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <strong className="text-slate-300 block mb-0.5">1. Quét tức thì</strong>
                <span className="text-slate-500">Phát hiện từ cấm, SĐT, Zalo, từ so sánh nhất</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <strong className="text-slate-300 block mb-0.5">2. Chấm điểm sàn</strong>
                <span className="text-slate-500">Đánh giá rủi ro khóa link & ăn gậy vi phạm</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <strong className="text-slate-300 block mb-0.5">3. Viết lại bản sạch</strong>
                <span className="text-slate-500">Copy dùng ngay 100% không lo bị phạt</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
