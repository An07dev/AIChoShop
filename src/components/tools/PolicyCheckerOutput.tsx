"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  RotateCcw,
  Tag,
  CheckCircle2,
  Table as TableIcon,
  LayoutList,
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
export function parsePolicyCheckerOutput(
  aiText: string | null,
  scanReport: ScanReport | null
): ParsedPolicyData | null {
  if (!aiText && !scanReport) return null;

  const rawText = aiText || "";

  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    if (!rawText) return "";
    const match = rawText.match(
      new RegExp(`^[ \\t]*(?:##|\\*\\*|#)?\\s*[^\\n]*?${keyword}[^\\n]*$`, "im")
    );
    if (!match || match.index === undefined) return "";

    const contentStartIdx = match.index + match[0].length;
    const contentStart = rawText.slice(contentStartIdx);

    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(
        new RegExp(`^[ \\t]*(?:---|##|\\*\\*|#)\\s*[^\\n]*?${nextKw}`, "im")
      );
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
    if (riskMatch) {
      riskLevel = riskMatch[1]
        .replace(/[*_]/g, "")
        .replace(/\(Điểm.*?\)/i, "")
        .trim();
    }

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
      riskLevel = "NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK";
      summary = `Phát hiện ${scanReport.totalViolations} từ khóa vi phạm nghiêm trọng có nguy cơ bị gỡ sản phẩm hoặc khóa shop.`;
    } else if (scanReport.riskLevel === "WARNING") {
      riskLevel = "CẢNH BÁO - TỪ NGỮ NHẠY CẢM";
      summary = `Phát hiện ${scanReport.totalViolations} điểm cần sửa đổi để tránh bị bóp tương tác hoặc cấm chạy quảng cáo.`;
    } else {
      riskLevel = "AN TOÀN - ĐẠT CHUẨN";
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
          let solution = parts[3]?.replace(/[*_]/g, "").replace(/^Thay bằng:\s*/i, "").trim() || "";
          solution = solution.replace(/^["'“]/, "").replace(/["'”]$/, "").trim();

          let severity: ViolationItem["severity"] = "HIGH";
          if (/ngoài sàn|zalo|hotline|sđt|chuyển khoản|stk|100%|dứt điểm|tiền mặt/i.test(phrase + category)) {
            severity = "CRITICAL";
          } else if (/số 1|nhất|top 1|gucci|chanel|thần dược|hoàn tiền/i.test(phrase + category)) {
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
  let safeText = s3Raw.replace(/^\s*\*\([^*]+\)\*\s*/m, "").trim();
  safeText = safeText.replace(/^[*\-_"'\s]+|[*\-_"'\s]+$/g, "").trim();

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
  const [activeTab, setActiveTab] = useState<"all" | "rewrite" | "violations" | "audit" | "tips">("all");
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [violationStyle, setViolationStyle] = useState<"list" | "table">("list");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parsePolicyCheckerOutput(aiOutput, scanReport);
  }, [aiOutput, scanReport]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleCopyForbiddenList = () => {
    if (!parsed || parsed.violations.length === 0) return;
    const list = parsed.violations.map((v) => v.phrase).join(", ");
    handleCopy(list, "forbiddenList", "Đã sao chép danh sách từ cấm!");
  };

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
    handleCopy(tsv, "tsv", "Đã chép bảng vi phạm (dán được vào Excel / Sheets)!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      const violationsData = parsed.violations.map((v, i) => ({
        STT: i + 1,
        "Từ ngữ vi phạm": v.phrase,
        "Mức độ rủi ro": v.severity,
        "Nhóm chính sách": v.category,
        "Lý do vi phạm": v.reason,
        "Giải pháp khắc phục an toàn": v.solution,
      }));
      const wsViolations = XLSX.utils.json_to_sheet(violationsData);
      XLSX.utils.book_append_sheet(wb, wsViolations, "DiemViPham");

      const safeData = [
        { Muc: "Nền tảng kiểm duyệt", NoiDung: platform },
        { Muc: "Mức độ rủi ro", NoiDung: parsed.audit.riskLevel },
        { Muc: "Điểm số an toàn", NoiDung: `${parsed.audit.score}/100` },
        { Muc: "Tóm tắt kết luận", NoiDung: parsed.audit.summary },
        { Muc: "Bản Viết Lại An Toàn 100%", NoiDung: parsed.rewrite?.text || "Chưa có" },
        ...parsed.tips.map((tip, idx) => ({
          Muc: `Lời khuyên #${idx + 1}`,
          NoiDung: tip,
        })),
      ];
      const wsSafe = XLSX.utils.json_to_sheet(safeData);
      XLSX.utils.book_append_sheet(wb, wsSafe, "BanVietLai_AnToan");

      const fileName = `bao-cao-chinh-sach-${platform.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã tải xuống file Excel báo cáo!");
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      showToast("Không thể xuất file Excel.");
    }
  };

  const handleDownloadTxt = () => {
    if (!parsed) return;
    const content = parsed.raw || aiOutput || "";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-vi-pham-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống file báo cáo .txt!");
  };

  const score = parsed?.audit.score ?? (scanReport?.score ?? 100);
  const isDanger = score < 60 || /nguy hiểm|khóa link|ăn gậy/i.test(parsed?.audit.riskLevel || "");
  const isWarning = !isDanger && (score < 90 || /cảnh báo|nhẹ/i.test(parsed?.audit.riskLevel || ""));

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini tinh tế */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-emerald-400 text-xs font-semibold shadow-xl border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ gọn gàng */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2.5 relative z-10 bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                : isWarning
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
            }`}
          >
            {isDanger ? (
              <ShieldAlert size={15} />
            ) : isWarning ? (
              <AlertTriangle size={15} />
            ) : (
              <ShieldCheck size={15} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-white text-xs sm:text-sm truncate">
                Kết Quả Soi Vi Phạm
              </h2>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 hidden sm:inline">
                {platform}
              </span>
            </div>
          </div>
        </div>

        {/* Nút hành động trên Header */}
        {parsed && !isLoading && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Chế độ xem: Trực quan / Thô */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trực quan
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

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Xuất bảng ra Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span className="hidden xl:inline text-[11px] font-medium">Excel</span>
            </button>

            {/* Tải file text */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Tải tệp .txt"
            >
              <Download size={13} />
            </button>

            {/* Sao chép tất cả */}
            <button
              type="button"
              onClick={() => handleCopy(parsed.raw, "all", "Đã sao chép toàn bộ báo cáo!")}
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
      {parsed && viewMode === "visual" && !isLoading && (
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
            onClick={() => setActiveTab("rewrite")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "rewrite"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <Sparkles size={12} className="text-emerald-400" />
            <span>Bản sạch 100%</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("violations")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "violations"
                ? "bg-slate-800 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            <AlertTriangle size={12} className="text-rose-400" />
            <span>Điểm vi phạm ({parsed.violations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-slate-800 text-slate-200 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={12} />
            <span>Đánh giá rủi ro ({score}/100)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "tips"
                ? "bg-slate-800 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            <Info size={12} />
            <span>Lời khuyên sàn ({parsed.tips.length})</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị nội dung: cuộn nội bộ mượt mà */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Sparkles size={22} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Soi Từ Cấm & Tối Ưu Bản Sạch...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang đối chiếu chính sách {platform} và viết lại bản bán hàng không vi phạm...
              </p>
            </div>
          </div>
        ) : parsed ? (
          <div className="space-y-3.5">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dữ liệu Markdown gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(parsed.raw, "rawText", "Đã sao chép Markdown!")}
                    className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy size={12} /> Sao chép
                  </button>
                </div>
                <textarea
                  readOnly
                  value={parsed.raw}
                  className="w-full h-[500px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
                />
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* ========================================================================= */}
                {/* 1. ĐÁNH GIÁ RỦI RO (GỌN GÀNG, KHÔNG RƯỜM RÀ)                             */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "audit") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
                    {/* Hàng 1: Mức độ + Thang đo điểm gọn gàng */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          🛡️ 1. Đánh Giá Rủi Ro
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                            isDanger
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                              : isWarning
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {parsed.audit.riskLevel}
                        </span>
                      </div>

                      {/* Điểm số an toàn tinh gọn */}
                      <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 font-medium">Điểm an toàn:</span>
                        <span
                          className={`text-sm font-black font-mono ${
                            isDanger
                              ? "text-rose-400"
                              : isWarning
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {score}/100
                        </span>
                        {/* Thanh mini bar */}
                        <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            style={{ width: `${Math.max(score, 5)}%` }}
                            className={`h-full ${
                              isDanger
                                ? "bg-rose-500"
                                : isWarning
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tóm tắt tình trạng */}
                    {parsed.audit.summary && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-slate-400 font-medium">Tóm tắt: </span>
                        {parsed.audit.summary}
                      </p>
                    )}

                    {/* Chính sách vi phạm (Dạng tag mini) */}
                    {parsed.audit.policies.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[11px] text-slate-400 shrink-0">Chính sách:</span>
                        {parsed.audit.policies.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. DANH SÁCH ĐIỂM VI PHẠM (GỌN GÀNG, TINH TẾ, DỄ TRA CỨU)                 */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "violations") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    {/* Header mục vi phạm */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          ⚠️ 2. Danh Sách {parsed.violations.length} Điểm Vi Phạm
                        </h3>
                      </div>

                      {/* Tiện ích chuyển đổi & sao chép */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Toggle kiểu xem List / Table */}
                        <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                          <button
                            type="button"
                            onClick={() => setViolationStyle("list")}
                            className={`p-1 rounded text-xs transition cursor-pointer ${
                              violationStyle === "list"
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                            title="Dạng danh sách gọn"
                          >
                            <LayoutList size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViolationStyle("table")}
                            className={`p-1 rounded text-xs transition cursor-pointer ${
                              violationStyle === "table"
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                            title="Dạng bảng ma trận"
                          >
                            <TableIcon size={13} />
                          </button>
                        </div>

                        {/* Nút copy danh sách từ cấm */}
                        <button
                          type="button"
                          onClick={handleCopyForbiddenList}
                          className="px-2 py-1 rounded text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Copy size={11} />
                          <span>Chép từ cấm</span>
                        </button>

                        {/* Nút copy TSV */}
                        <button
                          type="button"
                          onClick={handleCopyTsv}
                          className="px-2 py-1 rounded text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition cursor-pointer flex items-center gap-1"
                          title="Chép bảng TSV để dán vào Excel"
                        >
                          <FileSpreadsheet size={11} className="text-emerald-400" />
                          <span>Chép bảng</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh Sách Các Lỗi Vi Phạm */}
                    {parsed.violations.length > 0 ? (
                      violationStyle === "list" ? (
                        /* GIAO DIỆN DANH SÁCH GỌN GÀNG - HIỂN THỊ TRỌN VẸN TEXT KHÔNG BỊ CẮT */
                        <div className="space-y-2.5">
                          {parsed.violations.map((v, index) => (
                            <div
                              key={v.id || index}
                              className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-2"
                            >
                              {/* Hàng 1: Thứ tự, Từ vi phạm & Nhóm chính sách */}
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-mono font-bold text-slate-500">
                                    #{index + 1}
                                  </span>
                                  <span className="font-mono font-bold text-xs text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-lg border border-rose-500/30 break-words">
                                    &quot;{v.phrase}&quot;
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                    {v.category}
                                  </span>
                                </div>
                                {v.severity && (
                                  <span
                                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                      v.severity === "CRITICAL"
                                        ? "bg-rose-600 text-white"
                                        : v.severity === "HIGH"
                                        ? "bg-amber-600 text-white"
                                        : "bg-slate-700 text-slate-300"
                                    }`}
                                  >
                                    {v.severity}
                                  </span>
                                )}
                              </div>

                              {/* Hàng 2: Lý do phạt (nếu có) */}
                              {v.reason && (
                                <p className="text-[11px] text-slate-400 leading-relaxed pl-1 break-words">
                                  <strong className="text-slate-300 font-medium">Lý do phạt:</strong> {v.reason}
                                </p>
                              )}

                              {/* Hàng 3: Giải pháp thay thế (Full text, không cắt bớt) */}
                              {v.solution && (
                                <div className="flex items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                                  <div className="text-xs leading-relaxed break-words min-w-0 flex-1">
                                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mr-1.5 inline-block">
                                      Thay bằng:
                                    </span>
                                    <span className="font-medium text-emerald-200">
                                      &quot;{v.solution}&quot;
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(
                                        v.solution,
                                        `sol-${index}`,
                                        `Đã sao chép: "${v.solution}"`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 ml-1"
                                    title="Sao chép từ thay thế này"
                                  >
                                    {copiedKey === `sol-${index}` ? (
                                      <>
                                        <Check size={11} className="stroke-[3]" /> Đã chép
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} /> Sao chép
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* GIAO DIỆN BẢNG MA TRẬN - FULL TEXT KHÔNG TRUNCATE */
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                                <th className="py-2.5 px-2.5 w-8 text-center">#</th>
                                <th className="py-2.5 px-3 min-w-[140px]">Từ Ngữ Vi Phạm</th>
                                <th className="py-2.5 px-3 min-w-[110px]">Nhóm Chính Sách</th>
                                <th className="py-2.5 px-3 min-w-[160px]">Lý Do Phạt</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Giải Pháp An Toàn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                              {parsed.violations.map((v, index) => (
                                <tr key={v.id || index} className="hover:bg-slate-900/50">
                                  <td className="py-2.5 px-2.5 text-center text-slate-500 font-mono text-[11px] align-top">
                                    {index + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-rose-300 text-xs break-words align-top">
                                    &quot;{v.phrase}&quot;
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-400 align-top">
                                    {v.category}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 text-[11px] break-words leading-relaxed align-top">
                                    {v.reason}
                                  </td>
                                  <td className="py-2.5 px-3 align-top">
                                    <div className="flex items-start justify-between gap-2 text-emerald-300 bg-emerald-950/30 p-2 rounded border border-emerald-500/20 text-xs">
                                      <span className="break-words leading-relaxed flex-1 font-medium">
                                        {v.solution}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopy(
                                            v.solution,
                                            `sol-tbl-${index}`,
                                            `Đã sao chép: "${v.solution}"`
                                          )
                                        }
                                        className="text-emerald-400 hover:text-white transition cursor-pointer shrink-0 mt-0.5"
                                        title="Sao chép từ thay thế này"
                                      >
                                        {copiedKey === `sol-tbl-${index}` ? (
                                          <Check size={12} />
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
                      )
                    ) : (
                      <div className="p-4 text-center text-slate-400 bg-slate-900/40 rounded-lg">
                        <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-1" />
                        <span className="text-xs font-medium text-white">
                          Không phát hiện vi phạm từ cấm nào!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. BẢN VIẾT LẠI AN TOÀN 100% (READY TO USE)                              */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "rewrite") && parsed.rewrite && (
                  <div className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          ✅ 3. Bản Viết Lại An Toàn 100%
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {parsed.rewrite.charCount} ký tự • {parsed.rewrite.wordCount} từ
                        </span>
                      </div>

                      {/* Các nút sao chép và dán vào ô nhập */}
                      <div className="flex items-center gap-1.5">
                        {onApplySafeText && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplySafeText(parsed.rewrite!.text);
                              showToast("Đã dán đè bản sạch vào ô nhập!");
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1"
                            title="Dán đè bản sạch này vào ô nhập bên trái"
                          >
                            <RotateCcw size={11} />
                            <span>Dán vào ô nhập</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              parsed.rewrite!.text,
                              "safeRewrite",
                              "Đã sao chép bản viết lại an toàn!"
                            )
                          }
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          {copiedKey === "safeRewrite" ? (
                            <>
                              <Check size={12} className="stroke-[3]" /> Đã sao chép
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Sao chép bản sạch
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Nội dung bản viết lại */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {parsed.rewrite.text}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. LỜI KHUYÊN TỪ CHUYÊN GIA                                              */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "tips") && (
                  <div className="space-y-3">
                    {/* Khối lời khuyên */}
                    {parsed.tips.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-400">
                          <Info size={14} />
                          <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                            💡 4. Lời Khuyên Từ Chuyên Gia
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {parsed.tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <p className="leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bộ từ khóa an toàn khuyên dùng */}
                    {parsed.safeTags.length > 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <Tag size={13} />
                            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                              Từ Khóa An Toàn Khuyên Dùng (Click để copy)
                            </h3>
                          </div>
                          <span className="text-[10px] text-slate-500">Dán thay thế nhanh</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsed.safeTags.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleCopy(tag, `tag-${idx}`, `Đã chép: "${tag}"`)}
                              className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1 ${
                                copiedKey === `tag-${idx}`
                                  ? "bg-emerald-500 text-slate-950 font-bold"
                                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20"
                              }`}
                            >
                              {copiedKey === `tag-${idx}` ? (
                                <Check size={11} className="stroke-[3]" />
                              ) : (
                                <span className="text-emerald-400 text-[11px]">+</span>
                              )}
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State Gọn Gàng */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <ShieldAlert size={24} className="text-rose-400/80" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-slate-200">
                Chưa Có Kết Quả Soi Vi Phạm
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập nội dung ở khung bên trái và bấm &quot;Quét Vi Phạm&quot; để đối chiếu chính sách sàn.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Thử dữ liệu mẫu</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
