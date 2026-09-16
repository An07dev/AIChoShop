"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  Target,
  Swords,
  Flame,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Quote,
  Video,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Box,
  Layers,
  Sparkle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface CompetitorFlaw {
  rawTitle: string;
  title: string;
  tag: string;
  content: string;
}

export interface ComparisonRow {
  criteria: string;
  competitor: string;
  shopYou: string;
  rawCols: string[];
}

export interface ComparisonTableData {
  headers: string[];
  rows: ComparisonRow[];
}

export interface VideoHookItem {
  label: string;
  angle: string;
  text: string;
}

export interface DefenseTipItem {
  title: string;
  content: string;
}

export interface ParsedCompetitorMinerData {
  flaws: CompetitorFlaw[];
  uspStatement: string;
  comparisonTable: ComparisonTableData;
  hooks: VideoHookItem[];
  subtleDescription: string;
  defenseTips: DefenseTipItem[];
  raw: string;
}

interface CompetitorMinerOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  onUseSample?: () => void;
}

function cleanQuotes(str: string): string {
  if (!str) return "";
  return str.trim().replace(/^["“'«]|["”'»]$/g, "").trim();
}

export function parseCompetitorMinerOutput(text: string): ParsedCompetitorMinerData | null {
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

  const s1 = findSection(["BÓC TÁCH", "TỬ HUYỆT"], ["ĐỊNH VỊ", "VŨ KHÍ", "USP"]);
  const s2 = findSection(["ĐỊNH VỊ", "VŨ KHÍ", "USP"], ["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"]);
  const s3 = findSection(["BỘ CÂU HOOK", "HOOK", "DÌM HÀNG"], ["LỜI KHUYÊN", "PHÒNG THỦ"]);
  const s4 = findSection(["LỜI KHUYÊN", "PHÒNG THỦ"], []);

  // 1. Phân tích 3 tử huyệt
  const flaws: CompetitorFlaw[] = [];
  if (s1) {
    const lines = s1.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      const strippedBullet = line.replace(/^[-*•]\s+/, "");

      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m) {
        const fullTitle = m[1].trim();
        const content = cleanQuotes(m[2].trim());

        const tagMatch = fullTitle.match(/\(([^)]+)\)/);
        const tag = tagMatch ? tagMatch[1].trim() : "";
        const cleanTitle = fullTitle.replace(/\([^)]+\)/, "").trim();

        flaws.push({
          rawTitle: fullTitle,
          title: cleanTitle || fullTitle,
          tag: tag,
          content: content,
        });
      } else if (strippedBullet.length > 5) {
        flaws.push({
          rawTitle: `Tử huyệt ${flaws.length + 1}`,
          title: `Tử huyệt ${flaws.length + 1}`,
          tag: "",
          content: cleanQuotes(strippedBullet),
        });
      }
    }
  }

  // 2. Định vị USP & Bảng so sánh
  let uspStatement = "";
  const comparisonTable: ComparisonTableData = {
    headers: [],
    rows: [],
  };

  if (s2) {
    const stmtMatch = s2.match(/(?:Tuyên ngôn định vị[^\n:]*|Slogan[^\n:]*)\s*[:\-]\s*(?:["“]([^"”\n]+)["”]|([^\n]+))/i);
    if (stmtMatch) {
      let rawStmt = stmtMatch[1] || stmtMatch[2] || "";
      rawStmt = rawStmt.replace(/^\*\*|\*\*$/g, "").trim();
      uspStatement = cleanQuotes(rawStmt);
    }

    const tableLines = s2.split("\n").filter((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
    if (tableLines.length >= 2) {
      const headerLine = tableLines[0];
      comparisonTable.headers = headerLine
        .split("|")
        .map((c) => c.trim().replace(/\*\*/g, ""))
        .filter(Boolean);

      for (let i = 1; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) {
          continue;
        }
        const cols = line
          .split("|")
          .map((c) => c.trim().replace(/\*\*/g, ""))
          .slice(1, -1);
        if (cols.length > 0) {
          comparisonTable.rows.push({
            criteria: cols[0] || "",
            competitor: cols[1] || "",
            shopYou: cols[2] || "",
            rawCols: cols,
          });
        }
      }
    }
  }

  // 3. Hook & Kịch bản dìm hàng
  const hooks: VideoHookItem[] = [];
  let subtleDescription = "";

  if (s3) {
    const descMatch = s3.match(/(?:Đoạn mô tả sản phẩm[^\n:]*|Mô tả sản phẩm[^\n:]*)\s*[:\-]\s*([\s\S]*?)(?=(?:--|\n#|$))/i);
    if (descMatch) {
      let descText = descMatch[1].trim();
      descText = descText.replace(/^\*\*|\*\*$/g, "").trim();
      subtleDescription = cleanQuotes(descText);
    }

    const lines = s3.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (/đoạn mô tả/i.test(line) || line.startsWith("#") || line.startsWith("*(") || line.startsWith("(")) continue;

      const strippedBullet = line.replace(/^[-*•]\s+/, "");

      let m = strippedBullet.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = strippedBullet.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = strippedBullet.match(/^(Hook\s*\d+[^:]*|\bHook[^:]*)\s*[:\-]\s*([\s\S]+)$/i);
      }

      if (m && /hook/i.test(m[1])) {
        const fullHookLabel = m[1].trim();
        const hookText = cleanQuotes(m[2].trim());

        const angleMatch = fullHookLabel.match(/\(([^)]+)\)/);
        const angle = angleMatch ? angleMatch[1].trim() : "";
        const cleanLabel = fullHookLabel.replace(/\([^)]+\)/, "").trim();

        hooks.push({
          label: cleanLabel || fullHookLabel,
          angle: angle,
          text: hookText,
        });
      }
    }
  }

  // 4. Lời khuyên phòng thủ
  const defenseTips: DefenseTipItem[] = [];
  if (s4) {
    const lines = s4.split("\n");
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#") || line === "---") continue;
      const bulletClean = line.replace(/^[-*•]\s+/, "").trim();

      let m = bulletClean.match(/^\*\*([^*:]+?)(?::\*\*|\*\*:)\s*([\s\S]+)$/);
      if (!m) {
        m = bulletClean.match(/^\*\*([^*]+?)\*\*\s*[:\-]\s*([\s\S]+)$/);
      }
      if (!m) {
        m = bulletClean.match(/^([^:]+?)\s*:\s*([\s\S]+)$/);
      }

      if (m && /lưu ý|chú ý|bước|điểm|khuyên/i.test(m[1])) {
        defenseTips.push({
          title: m[1].trim(),
          content: cleanQuotes(m[2].trim()),
        });
      } else if (bulletClean.length > 5) {
        defenseTips.push({
          title: `Lưu ý ${defenseTips.length + 1}`,
          content: cleanQuotes(bulletClean.replace(/^\*\*|\*\*$/g, "")),
        });
      }
    }
  }

  return {
    flaws,
    uspStatement,
    comparisonTable,
    hooks,
    subtleDescription,
    defenseTips,
    raw: text,
  };
}

export function CompetitorMinerOutput({
  result,
  loading,
  productName,
  onUseSample,
}: CompetitorMinerOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "flaws" | "usp" | "hooks" | "defense">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parseCompetitorMinerOutput(result);
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

  const handleCopyFlawsAll = () => {
    if (!parsed || parsed.flaws.length === 0) return;
    const text = parsed.flaws
      .map((f, i) => `• ${f.title}${f.tag ? ` (${f.tag})` : ""}: ${f.content}`)
      .join("\n\n");
    handleCopy(text, "flaws_all", "Đã sao chép 3 tử huyệt đối thủ!");
  };

  const handleCopyTableAll = () => {
    if (!parsed || parsed.comparisonTable.rows.length === 0) return;
    const headers = parsed.comparisonTable.headers.join(" | ");
    const rows = parsed.comparisonTable.rows
      .map((r) => `${r.criteria} | ${r.competitor} | ${r.shopYou}`)
      .join("\n");
    const text = `BẢNG SO SÁNH HƠN HẲN ĐỐI THỦ:\n${headers}\n${rows}`;
    handleCopy(text, "table_all", "Đã sao chép bảng so sánh!");
  };

  const handleCopyHooksAll = () => {
    if (!parsed) return;
    const hookText = parsed.hooks
      .map((h) => `${h.label}${h.angle ? ` (${h.angle})` : ""}: "${h.text}"`)
      .join("\n\n");
    const descText = parsed.subtleDescription
      ? `\n\nĐoạn mô tả sản phẩm đá xéo đối thủ tinh tế:\n${parsed.subtleDescription}`
      : "";
    handleCopy(hookText + descText, "hooks_all", "Đã sao chép bộ hook & mô tả!");
  };

  const handleCopyDefenseAll = () => {
    if (!parsed || parsed.defenseTips.length === 0) return;
    const text = parsed.defenseTips.map((d) => `• ${d.title}: ${d.content}`).join("\n\n");
    handleCopy(text, "defense_all", "Đã sao chép lời khuyên phòng thủ!");
  };

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 3 Tử huyệt
      const flawRows = parsed.flaws.map((f, idx) => ({
        STT: idx + 1,
        "Loại Tử Huyệt": f.title,
        "Phân Loại": f.tag || "N/A",
        "Chi Tiết Lỗi Của Đối Thủ": f.content,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flawRows), "TuHuyet_DoiThu");

      // Sheet 2: Bảng so sánh & Tuyên ngôn USP
      const tableRows = parsed.comparisonTable.rows.map((r, idx) => ({
        STT: idx + 1,
        "Tiêu Chí So Sánh": r.criteria,
        "Đối Thủ Thị Trường (Kém/Rủi ro)": r.competitor,
        "Shop Bạn (Vượt trội)": r.shopYou,
      }));
      if (parsed.uspStatement) {
        tableRows.push({
          STT: tableRows.length + 1,
          "Tiêu Chí So Sánh": "★ TUYÊN NGÔN ĐỊNH VỊ",
          "Đối Thủ Thị Trường (Kém/Rủi ro)": "",
          "Shop Bạn (Vượt trội)": parsed.uspStatement,
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tableRows), "SoSanh_USP");

      // Sheet 3: Hook & Kịch bản dìm hàng
      const hookRows = [
        ...parsed.hooks.map((h, idx) => ({
          STT: idx + 1,
          "Phân Loại": h.label,
          "Góc Tiếp Cận": h.angle || "N/A",
          "Nội Dung Câu Hook": h.text,
        })),
      ];
      if (parsed.subtleDescription) {
        hookRows.push({
          STT: hookRows.length + 1,
          "Phân Loại": "Đoạn mô tả sản phẩm đá xéo",
          "Góc Tiếp Cận": "Bài viết mô tả sản phẩm",
          "Nội Dung Câu Hook": parsed.subtleDescription,
        });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hookRows), "Hook_KichBan");

      // Sheet 4: Lời khuyên phòng thủ
      const defenseRows = parsed.defenseTips.map((d, idx) => ({
        STT: idx + 1,
        "Hạng Mục": d.title,
        "Nội Dung Khuyến Nghị": d.content,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defenseRows), "LoiKhuyen_PhongThu");

      const safeName = (productName || "san-pham").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
      const fileName = `doc-vi-doi-thu-usp-${safeName}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã xuất file Excel vũ khí USP & đối thủ!");
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
    a.download = `doc-vi-doi-thu-${safeName}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  const getFlawTheme = (tag: string, index: number) => {
    if (/sản phẩm|chất liệu|chất lượng/i.test(tag) || index === 0) {
      return {
        icon: Flame,
        color: "text-rose-400",
        badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        border: "border-rose-500/20 hover:border-rose-500/40",
      };
    }
    if (/đóng gói|giao hàng|phụ kiện|vận chuyển/i.test(tag) || index === 1) {
      return {
        icon: Box,
        color: "text-amber-400",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        border: "border-amber-500/20 hover:border-amber-500/40",
      };
    }
    return {
      icon: ShieldAlert,
      color: "text-orange-400",
      badgeBg: "bg-orange-500/15 text-orange-300 border-orange-500/30",
      border: "border-orange-500/20 hover:border-orange-500/40",
    };
  };

  const getHookTheme = (angle: string, index: number) => {
    if (/cảnh báo/i.test(angle) || index === 0) {
      return {
        badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        accent: "text-rose-400",
      };
    }
    if (/đồng cảm/i.test(angle) || index === 1) {
      return {
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        accent: "text-amber-400",
      };
    }
    return {
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      accent: "text-purple-400",
    };
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini phản hồi */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-rose-400 text-xs font-semibold shadow-xl border border-rose-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ tối giản */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2.5 relative z-10 bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
            <Swords size={15} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-white text-xs sm:text-sm truncate">
              Vũ Khí Khắc Chế Đối Thủ &amp; USP Độc Quyền
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
                    ? "bg-rose-600 text-white shadow-xs"
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
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Gốc
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
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
              onClick={() => handleCopy(result, "all", "Đã sao chép toàn bộ kết quả phân tích!")}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
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
                ? "bg-slate-800 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("flaws")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "flaws"
                ? "bg-slate-800 text-rose-400 border border-rose-500/30"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            <Flame size={12} />
            <span>3 Tử huyệt đối thủ ({parsed?.flaws.length || 3})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("usp")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "usp"
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-emerald-300"
            }`}
          >
            <Sparkles size={12} />
            <span>Vũ khí USP &amp; So sánh</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hooks")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "hooks"
                ? "bg-slate-800 text-purple-400 border border-purple-500/30"
                : "text-slate-400 hover:text-purple-300"
            }`}
          >
            <Video size={12} />
            <span>Hook &amp; Kịch bản dìm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("defense")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "defense"
                ? "bg-slate-800 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:text-blue-300"
            }`}
          >
            <ShieldCheck size={12} />
            <span>Lời khuyên phòng thủ</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị nội dung: cuộn nội bộ */}
      <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar relative z-10">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
              <Sparkles size={22} className="animate-spin text-rose-400 duration-1000" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Khai Thác Đánh Giá Chê Đối Thủ...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang bóc tách 3 tử huyệt cay đắng, xây dựng bảng USP đập tan nỗi sợ và soạn kịch bản dìm hàng tinh tế...
              </p>
            </div>
          </div>
        ) : result && parsed ? (
          <div className="space-y-3.5">
            {viewMode === "raw" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dữ liệu Markdown gốc:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result, "rawText", "Đã sao chép Markdown!")}
                    className="hover:text-rose-400 flex items-center gap-1 cursor-pointer font-medium"
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
                {/* 1. BÓC TÁCH 3 TỬ HUYỆT LỚN NHẤT CỦA ĐỐI THỦ                              */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "flaws") && parsed.flaws.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Flame size={14} className="text-rose-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          1. Bóc Tách 3 Tử Huyệt Lớn Nhất Của Đối Thủ
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyFlawsAll}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "flaws_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>Sao chép 3 tử huyệt</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {parsed.flaws.map((flaw, idx) => {
                        const theme = getFlawTheme(flaw.tag, idx);
                        const IconComp = theme.icon;

                        return (
                          <div
                            key={idx}
                            className={`bg-slate-900/70 rounded-xl border ${theme.border} p-3 sm:p-3.5 space-y-2 hover:bg-slate-900/90 transition-all`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg bg-slate-800/80 ${theme.color}`}>
                                  <IconComp size={14} />
                                </div>
                                <span className="text-xs font-bold text-white">
                                  {flaw.title}
                                </span>
                                {flaw.tag && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                                    {flaw.tag}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(`${flaw.title}${flaw.tag ? ` (${flaw.tag})` : ""}: ${flaw.content}`, `flaw-${idx}`, `Đã chép ${flaw.title}!`)}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `flaw-${idx}` ? (
                                  <>
                                    <Check size={11} className="text-emerald-400 stroke-[3]" /> Đã chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} /> Sao chép
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 break-words select-text">
                              {flaw.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. ĐỊNH VỊ VŨ KHÍ USP ĐỘC QUYỀN CHO SHOP BẠN                              */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "usp") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          2. Định Vị Vũ Khí USP Độc Quyền Cho Shop Bạn
                        </h3>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Vũ khí chiến thắng
                      </span>
                    </div>

                    {/* Tuyên ngôn định vị đập tan nỗi sợ */}
                    {parsed.uspStatement && (
                      <div className="rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/90 border border-emerald-500/30 p-3.5 space-y-2 relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Quote size={13} className="text-emerald-400" />
                            Tuyên ngôn định vị đập tan nỗi sợ
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.uspStatement, "usp_statement", "Đã chép tuyên ngôn định vị!")}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            {copiedKey === "usp_statement" ? (
                              <>
                                <Check size={11} className="stroke-[3]" /> Đã chép
                              </>
                            ) : (
                              <>
                                <Copy size={11} /> Sao chép tuyên ngôn
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-white font-semibold text-xs sm:text-sm leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border border-emerald-500/20 select-text">
                          &ldquo;{parsed.uspStatement}&rdquo;
                        </div>
                      </div>
                    )}

                    {/* Bảng so sánh hơn hẳn (Shop Bạn vs Đối Thủ Thị Trường) */}
                    {parsed.comparisonTable.rows.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <TrendingUp size={13} className="text-amber-400" />
                            Bảng So Sánh Hơn Hẳn (Shop Bạn vs Đối Thủ Thị Trường)
                          </span>

                          <button
                            type="button"
                            onClick={handleCopyTableAll}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "table_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>Sao chép bảng</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 custom-scrollbar">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-300">
                                <th className="p-2.5 sm:p-3 font-bold w-[26%]">
                                  {parsed.comparisonTable.headers[0] || "Tiêu chí"}
                                </th>
                                <th className="p-2.5 sm:p-3 font-bold w-[37%] text-rose-300">
                                  <div className="flex items-center gap-1.5">
                                    <XCircle size={13} className="text-rose-400 shrink-0" />
                                    <span>{parsed.comparisonTable.headers[1] || "Đối thủ trên thị trường"}</span>
                                  </div>
                                </th>
                                <th className="p-2.5 sm:p-3 font-bold w-[37%] text-emerald-300 bg-emerald-950/20">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                                    <span>{parsed.comparisonTable.headers[2] || "Sản phẩm của Shop Bạn (Vượt trội)"}</span>
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 text-slate-200">
                              {parsed.comparisonTable.rows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-800/40 transition-colors"
                                >
                                  <td className="p-2.5 sm:p-3 font-semibold text-slate-300 align-top">
                                    {row.criteria}
                                  </td>
                                  <td className="p-2.5 sm:p-3 text-rose-300/90 align-top leading-relaxed bg-rose-950/10">
                                    {row.competitor}
                                  </td>
                                  <td className="p-2.5 sm:p-3 text-emerald-200 font-medium align-top leading-relaxed bg-emerald-950/20">
                                    {row.shopYou}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. BỘ CÂU HOOK & KỊCH BẢN "DÌM HÀNG VĂN MINH"                              */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "hooks") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Video size={14} className="text-purple-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          3. Bộ Câu Hook &amp; Kịch Bản &ldquo;Dìm Hàng Văn Minh&rdquo;
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHooksAll}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "hooks_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>Sao chép tất cả</span>
                      </button>
                    </div>

                    {/* Danh sách 3 Hooks */}
                    {parsed.hooks.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          3 Câu Hook 3 Giây Đầu Video / Livestream
                        </span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {parsed.hooks.map((hook, idx) => {
                            const theme = getHookTheme(hook.angle, idx);

                            return (
                              <div
                                key={idx}
                                className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3 space-y-2 hover:border-slate-700/80 transition-all"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">
                                      {hook.label}
                                    </span>
                                    {hook.angle && (
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                                        {hook.angle}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopy(`"${hook.text}"`, `hook-${idx}`, `Đã chép ${hook.label}!`)}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `hook-${idx}` ? (
                                      <>
                                        <Check size={11} className="text-emerald-400 stroke-[3]" /> Đã chép
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} /> Sao chép
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 break-words select-text font-medium">
                                  &ldquo;{hook.text}&rdquo;
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Đoạn mô tả sản phẩm "Đá xéo đối thủ tinh tế" */}
                    {parsed.subtleDescription && (
                      <div className="bg-slate-900/70 rounded-xl border border-purple-500/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <FileText size={13} className="text-purple-400" />
                            Đoạn mô tả sản phẩm &ldquo;Đá xéo đối thủ tinh tế&rdquo;
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.subtleDescription, "subtle_desc", "Đã chép đoạn mô tả sản phẩm!")}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "subtle_desc" ? (
                              <>
                                <Check size={11} className="text-emerald-400 stroke-[3]" /> Đã chép
                              </>
                            ) : (
                              <>
                                <Copy size={11} /> Sao chép mô tả
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-slate-200 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 break-words select-text">
                          {parsed.subtleDescription}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. LỜI KHUYÊN PHÒNG THỦ CHO SHOP BẠN                                     */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "defense") && parsed.defenseTips.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          4. Lời Khuyên Phòng Thủ Cho Shop Bạn
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDefenseAll}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "defense_all" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>Sao chép lời khuyên</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {parsed.defenseTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3 space-y-1.5 hover:border-blue-500/30 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                                <ShieldCheck size={13} className="text-blue-400 shrink-0" />
                                {tip.title}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed break-words select-text">
                              {tip.content}
                            </p>
                          </div>

                          <div className="pt-2 mt-1 border-t border-slate-800/60 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleCopy(`${tip.title}: ${tip.content}`, `defense-${idx}`, `Đã chép ${tip.title}!`)}
                              className="text-[11px] text-slate-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer font-medium"
                            >
                              {copiedKey === `defense-${idx}` ? (
                                <>
                                  <Check size={11} className="text-emerald-400" /> Đã chép
                                </>
                              ) : (
                                <>
                                  <Copy size={11} /> Chép lưu ý
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
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-rose-400 shadow-inner">
              <Swords size={24} />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-semibold text-slate-200 text-sm">Chưa Có Dữ Liệu Khai Thác Đối Thủ</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập tên sản phẩm &amp; dán review chê 1-3 sao của đối thủ bên trái, sau đó bấm &ldquo;Đọc Vị Đối Thủ &amp; Tìm USP Ngay&rdquo;.
              </p>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
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

export default CompetitorMinerOutput;
