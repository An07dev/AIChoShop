"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
  LayoutList,
  FileText,
  Video,
  Flame,
  Zap,
  Lightbulb,
  ShoppingBag,
  Download,
  Film,
  Layers,
  Mic,
  Camera,
  Type,
  Music,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface ScriptSection {
  id: number;
  timeRange: string;
  phase: string;
  type: "hook" | "pain" | "solution" | "cta" | "other";
  voice: string;
  action?: string;
  overlay?: string;
  content: string;
}

export interface ScriptItem {
  id: number;
  title: string;
  sections: ScriptSection[];
  notes?: string;
  rawText: string;
}

interface ScriptWriterOutputProps {
  result: string;
  loading: boolean;
  productName: string;
  usp?: string;
  onUseSample?: () => void;
}

export function ScriptWriterOutput({
  result,
  loading,
  productName,
  usp,
  onUseSample,
}: ScriptWriterOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedScriptId, setCopiedScriptId] = useState<number | null>(null);
  const [copiedSectionKey, setCopiedSectionKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "raw">("cards");
  const [selectedScriptId, setSelectedScriptId] = useState<number>(1);
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Bóc tách kết quả AI thành danh sách các kịch bản chuẩn bảng phân cảnh
  const scripts: ScriptItem[] = useMemo(() => {
    if (!result) return [];

    // 1. Chuẩn hóa: ngắt dòng trước các thẻ markdown bị dính liền và lọc ký tự ngoại lai
    const normalized = result
      .replace(/```markdown/gi, "\n```markdown\n")
      .replace(/```/g, "\n```\n")
      .replace(/\s+(#+\s+Kịch bản)/gi, "\n\n$1")
      .replace(/\s+(#+\s+\[\d{2}:\d{2})/gi, "\n\n$1")
      .replace(/\s+(##+\s+Hook)/gi, "\n\n$1")
      .replace(/\s+(##+\s+Nỗi đau)/gi, "\n\n$1")
      .replace(/\s+(##+\s+Giải pháp)/gi, "\n\n$1")
      .replace(/\s+(##+\s+Call to Action)/gi, "\n\n$1")
      .replace(/\s+(#+\s+Lưu ý)/gi, "\n\n$1")
      .replace(/\s+(#+\s+Gợi ý quay dựng)/gi, "\n\n$1")
      .replace(/[\u4e00-\u9fa5]+[^\n]*\n?/g, ""); // Lọc câu bình luận tiếng Trung nếu có

    const lines = normalized.split("\n");
    const parsedScripts: ScriptItem[] = [];

    let currentScript: Partial<ScriptItem> | null = null;
    let currentSection: Partial<ScriptSection> | null = null;
    let bufferSection: string[] = [];
    let bufferNotes: string[] = [];
    let isInsideNotes = false;

    const finishCurrentSection = () => {
      if (currentSection && currentScript && currentScript.sections) {
        const fullContent = bufferSection.join("\n").trim();

        // Bóc tách chi tiết từng dòng: Lời thoại (Voice), Hành động (Visual), Chữ trên màn hình (Overlay)
        let voice = "";
        let action = "";
        let overlay = "";

        bufferSection.forEach((l) => {
          const tr = l.trim();
          const vMatch = tr.match(
            /^[-*•\s]*(?:\*\*|\*)?(?:Lời thoại|Voice|Thoại)[^:\n\r]*[:\-]\s*(.*)$/i
          );
          if (vMatch) {
            voice = vMatch[1]
              .replace(/^\*\*|\*\*$/g, "")
              .replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "")
              .trim();
            return;
          }

          const aMatch = tr.match(
            /^[-*•\s]*(?:\*\*|\*)?(?:Hình ảnh|Hành động|Visual|Góc quay|Camera)[^:\n\r]*[:\-]\s*(.*)$/i
          );
          if (aMatch) {
            action = aMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
            return;
          }

          const oMatch = tr.match(
            /^[-*•\s]*(?:\*\*|\*)?(?:Chữ trên video|Text trên video|Text hiển thị|Caption|Chữ màn hình|Text)[^:\n\r]*[:\-]\s*(.*)$/i
          );
          if (oMatch) {
            overlay = oMatch[1]
              .replace(/^\*\*|\*\*$/g, "")
              .replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, "")
              .trim();
            return;
          }
        });

        // Nếu không có voice riêng biệt, trích xuất câu trích dẫn hoặc fallback lấy fullContent
        if (!voice && !action) {
          const quoteMatch = fullContent.match(/["“]([^"”\n\r]{10,})["”]/);
          if (quoteMatch) {
            voice = quoteMatch[1].trim();
          } else {
            voice = fullContent;
          }
        }

        currentScript.sections.push({
          id: currentScript.sections.length + 1,
          timeRange: currentSection.timeRange || "",
          phase: currentSection.phase || `Cảnh ${currentScript.sections.length + 1}`,
          type: currentSection.type || "other",
          voice: voice,
          action: action,
          overlay: overlay,
          content: fullContent,
        });

        currentSection = null;
        bufferSection = [];
      }
    };

    const finishCurrentScript = () => {
      finishCurrentSection();
      if (currentScript && currentScript.sections && currentScript.sections.length > 0) {
        const notes = bufferNotes.join("\n").trim();
        const scriptId = parsedScripts.length + 1;

        let title = currentScript.title?.trim() || "";
        if (!title || /^Kịch bản video TikTok ngắn$/i.test(title)) {
          title = `Kịch bản ${scriptId}`;
        }

        const sectionsRaw = currentScript.sections
          .map((s) => {
            const parts = [`[${s.timeRange}] ${s.phase}`];
            if (s.action) parts.push(`- Hành động: ${s.action}`);
            if (s.voice) parts.push(`- Lời thoại: "${s.voice}"`);
            if (s.overlay) parts.push(`- Chữ trên video: ${s.overlay}`);
            if (!s.action && !s.overlay && s.content) parts.push(s.content);
            return parts.join("\n");
          })
          .join("\n\n");

        parsedScripts.push({
          id: scriptId,
          title: title,
          sections: currentScript.sections as ScriptSection[],
          notes: notes || undefined,
          rawText: `${title}\n\n${sectionsRaw}${notes ? `\n\nLưu ý & Quay dựng:\n${notes}` : ""}`,
        });

        currentScript = null;
        bufferNotes = [];
        isInsideNotes = false;
      }
    };

    const startNewScript = (title?: string) => {
      finishCurrentScript();
      const nextId = parsedScripts.length + 1;
      currentScript = {
        id: nextId,
        title: title || `Kịch bản ${nextId}`,
        sections: [],
      };
      isInsideNotes = false;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("```")) return;

      // Kiểm tra dòng tiêu đề kịch bản: VD "# KỊCH BẢN 1:", "Kịch bản số 2", "Biến thể 2"
      const isExplicitScriptHeader =
        /^(?:#+\s*)?(?:KỊCH BẢN|Kịch bản|Phiên bản|Biến thể|Option)\s*(\d+|[A-Z]|số\s*\d+)?[\:\-\.]?\s*(.*)$/i.test(
          trimmed
        );
      const isHookStart =
        /\[\s*00:00\s*-\s*00:03\s*\]/i.test(trimmed) ||
        (/HOOK/i.test(trimmed) && /\[\d{2}:\d{2}/i.test(trimmed));

      const currentHasHook = currentScript?.sections?.some((s) => s.type === "hook");

      // Bắt đầu kịch bản mới nếu gặp Header kịch bản hoặc gặp lại Hook khi script trước đã có Hook
      if (isExplicitScriptHeader && !isHookStart) {
        let scriptTitle = trimmed.replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
        if (/^Kịch bản video TikTok ngắn$/i.test(scriptTitle) || !scriptTitle) {
          scriptTitle = `Kịch bản ${parsedScripts.length + 1}`;
        }
        startNewScript(scriptTitle);
        return;
      } else if (isHookStart && (!currentScript || currentHasHook)) {
        startNewScript(`Kịch bản ${parsedScripts.length + 1}`);
      }

      if (!currentScript) {
        startNewScript(`Kịch bản 1`);
      }

      // Kiểm tra phần Gợi ý quay dựng / Lưu ý
      if (
        /^#+\s*(?:Gợi ý quay dựng|Lưu ý|Tips)/i.test(trimmed) ||
        /^Gợi ý quay dựng[\:\-]/i.test(trimmed) ||
        /^Lưu ý[\:\-]/i.test(trimmed)
      ) {
        finishCurrentSection();
        isInsideNotes = true;
        return;
      }

      if (isInsideNotes) {
        bufferNotes.push(line);
        return;
      }

      // Kiểm tra các mốc phân cảnh Timeline (Hook, Nỗi đau, Giải pháp, CTA)
      const timeMatch = trimmed.match(/\[(\d{2}:\d{2}\s*-\s*[^\]]+)\]\s*(.*)/i);
      const isPhaseHeader =
        trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("- [");

      const hasHook = /HOOK/i.test(trimmed);
      const hasPain = /NỖI ĐAU|VẤN ĐỀ/i.test(trimmed);
      const hasSolution = /GIẢI PHÁP|SẢN PHẨM/i.test(trimmed);
      const hasCta = /CALL TO ACTION|CTA|KÊU GỌI/i.test(trimmed);

      if (timeMatch || (isPhaseHeader && (hasHook || hasPain || hasSolution || hasCta))) {
        finishCurrentSection();

        let timeRange = timeMatch ? timeMatch[1].trim() : "";
        let afterTime = timeMatch
          ? timeMatch[2].trim()
          : trimmed.replace(/^[#\*\_\-\s]+|[#\*\_\-\s]+$/g, "");

        let type: ScriptSection["type"] = "other";
        let phase = afterTime;
        let inlineContent = "";

        // Bóc tách phần text nội dung nếu nằm cùng trên 1 dòng
        const colonMatch = afterTime.match(
          /^(?:\*{0,2})(HOOK|NỖI ĐAU|GIẢI PHÁP|CALL TO ACTION|CTA|KÊU GỌI|MỞ ĐẦU|VẤN ĐỀ)(?:\*{0,2})[\:\-\–—]\s*(.*)$/i
        );
        if (colonMatch) {
          inlineContent = colonMatch[2].trim();
        } else {
          const genericColon = afterTime.match(/^([^:\-–—]{2,30})[\:\-–—]\s*(.*)$/);
          if (genericColon && (hasHook || hasPain || hasSolution || hasCta)) {
            inlineContent = genericColon[2].trim();
          }
        }

        if (hasHook) {
          type = "hook";
          phase = "HOOK - Giữ Chân 3s Đầu";
          if (!timeRange) timeRange = "00:00 - 00:03";
        } else if (hasPain) {
          type = "pain";
          phase = "NỖI ĐAU - Khơi Gợi Vấn Đề";
          if (!timeRange) timeRange = "00:03 - 00:15";
        } else if (hasSolution) {
          type = "solution";
          phase = "GIẢI PHÁP - Giới Thiệu USP";
          if (!timeRange) timeRange = "00:15 - 00:30";
        } else if (hasCta) {
          type = "cta";
          phase = "CTA - Kêu Gọi Giỏ Hàng";
          if (!timeRange) timeRange = "00:30 - Hết Video";
        }

        currentSection = {
          timeRange,
          phase,
          type,
        };

        if (inlineContent) {
          bufferSection.push(inlineContent);
        }
      } else {
        if (currentSection) {
          bufferSection.push(line);
        }
      }
    });

    finishCurrentScript();

    // Fallback nếu không chia được kịch bản
    if (parsedScripts.length === 0 && result.trim()) {
      return [
        {
          id: 1,
          title: "Kịch bản Video Chi Tiết",
          sections: [
            {
              id: 1,
              timeRange: "00:00 - 00:45",
              phase: "Toàn bộ kịch bản",
              type: "other",
              voice: result.trim(),
              content: result.trim(),
            },
          ],
          rawText: result.trim(),
        },
      ];
    }

    return parsedScripts;
  }, [result]);

  // Tự động chọn kịch bản đầu tiên khi có dữ liệu mới
  useEffect(() => {
    if (scripts.length > 0) {
      if (!scripts.some((s) => s.id === selectedScriptId)) {
        setSelectedScriptId(scripts[0].id);
      }
    }
  }, [scripts, selectedScriptId]);

  // Kịch bản đang được chọn hiển thị
  const activeScript = useMemo(() => {
    return scripts.find((s) => s.id === selectedScriptId) || scripts[0];
  }, [scripts, selectedScriptId]);

  // Sao chép 1 phân cảnh cụ thể
  const handleCopySection = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionKey(key);
    setTimeout(() => setCopiedSectionKey(null), 1800);
  };

  // Sao chép kịch bản đang chọn
  const handleCopySingleScript = (script: ScriptItem) => {
    navigator.clipboard.writeText(script.rawText);
    setCopiedScriptId(script.id);
    setTimeout(() => setCopiedScriptId(null), 1800);
  };

  // Sao chép TẤT CẢ các kịch bản
  const handleCopyAll = () => {
    if (scripts.length === 0) return;
    const combined = scripts
      .map(
        (s) =>
          `================== ${s.title.toUpperCase()} ==================\n\n${s.rawText}`
      )
      .join("\n\n\n");
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải file văn bản (.txt)
  const handleDownloadTxt = () => {
    if (scripts.length === 0) return;
    const contentToDownload = viewAll
      ? scripts
          .map(
            (s) =>
              `================== ${s.title.toUpperCase()} ==================\n\n${s.rawText}`
          )
          .join("\n\n\n")
      : activeScript?.rawText || result;

    const blob = new Blob([contentToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = productName
      ? productName.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 25).trim()
      : "TikTok";
    link.download = `KichBan_${safeName || "Video"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Xuất file Excel kịch bản phân cảnh (.xlsx)
  const handleExportExcel = () => {
    if (scripts.length === 0) return;

    const excelRows: any[] = [];

    scripts.forEach((script) => {
      script.sections.forEach((sec) => {
        excelRows.push({
          "Kịch Bản": script.title,
          "Phân Cảnh": `Cảnh ${sec.id}`,
          "Thời Lượng": sec.timeRange || "N/A",
          "Mục Tiêu": sec.phase,
          "Lời Thoại (Voiceover)": sec.voice || sec.content,
          "Hành Động / Góc Máy (Visual)": sec.action || "Theo kịch bản",
          "Chữ Trên Video (Caption)": sec.overlay || "",
          "Gợi Ý Âm Thanh / Quay Dựng": script.notes || "",
          "Sản Phẩm": productName || "N/A",
          "USP Nổi Bật": usp || "N/A",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 22 }, // Kịch bản
      { wch: 10 }, // Cảnh
      { wch: 16 }, // Thời lượng
      { wch: 24 }, // Mục tiêu
      { wch: 55 }, // Lời thoại
      { wch: 45 }, // Hành động
      { wch: 32 }, // Chữ trên video
      { wch: 35 }, // Gợi ý quay dựng
      { wch: 28 }, // Sản phẩm
      { wch: 30 }, // USP
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangPhanCanhTikTok");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const fileName = `AIChoShop_KichBan_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  // Theme màu sắc phân cảnh
  const getSectionTheme = (type: ScriptSection["type"]) => {
    switch (type) {
      case "hook":
        return {
          icon: <Flame size={14} className="text-amber-400" />,
          badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
          border: "hover:border-amber-500/40",
        };
      case "pain":
        return {
          icon: <Zap size={14} className="text-orange-400" />,
          badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-300",
          border: "hover:border-orange-500/40",
        };
      case "solution":
        return {
          icon: <Lightbulb size={14} className="text-purple-400" />,
          badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-300",
          border: "hover:border-purple-500/40",
        };
      case "cta":
        return {
          icon: <ShoppingBag size={14} className="text-pink-400" />,
          badgeBg: "bg-pink-500/15 border-pink-500/30 text-pink-300",
          border: "hover:border-pink-500/40",
        };
      default:
        return {
          icon: <Sparkles size={14} className="text-indigo-400" />,
          badgeBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
          border: "hover:border-indigo-500/40",
        };
    }
  };

  const wordCount = result ? result.trim().split(/\s+/).length : 0;
  const totalSections = scripts.reduce((acc, s) => acc + s.sections.length, 0);

  // Component render một kịch bản theo bảng phân cảnh chuyên nghiệp
  const renderScriptCard = (script: ScriptItem, isSingleView: boolean = false) => {
    return (
      <div
        key={script.id}
        className={`bg-slate-900/90 border rounded-2xl overflow-hidden transition-all shadow-md ${
          isSingleView
            ? "border-transparent"
            : "border-slate-800 hover:border-purple-500/40 mb-5"
        }`}
      >
        {/* Header của từng kịch bản */}
        <div className="px-3.5 sm:px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
              #{script.id}
            </span>
            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
              {script.title}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 shrink-0">
              {script.sections.length} cảnh
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopySingleScript(script)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              copiedScriptId === script.id
                ? "bg-emerald-500 text-white"
                : "bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30"
            }`}
            title="Sao chép kịch bản này"
          >
            {copiedScriptId === script.id ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
            <span>{copiedScriptId === script.id ? "Đã chép" : "Chép kịch bản"}</span>
          </button>
        </div>

        {/* Nội dung các phân cảnh */}
        <div className="p-3 sm:p-4 space-y-3">
          {script.sections.map((sec) => {
            const theme = getSectionTheme(sec.type);
            const sectionKey = `${script.id}-${sec.id}`;
            const textToCopy = sec.voice || sec.content;

            return (
              <div
                key={sec.id}
                className={`group bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 ${theme.border} p-3 sm:p-3.5 rounded-xl transition-all shadow-xs space-y-2.5`}
              >
                {/* Thanh tiêu đề phân cảnh */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${theme.badgeBg}`}
                    >
                      {theme.icon}
                      <span className="truncate">{sec.phase}</span>
                    </span>
                    {sec.timeRange && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-700/40 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
                        ⏱️ {sec.timeRange}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySection(textToCopy, sectionKey)}
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      copiedSectionKey === sectionKey
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700/50 hover:bg-purple-600 text-slate-300 hover:text-white border border-slate-600/40"
                    }`}
                    title="Sao chép lời thoại phân cảnh này"
                  >
                    {copiedSectionKey === sectionKey ? (
                      <Check size={11} className="stroke-[3]" />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>
                      {copiedSectionKey === sectionKey ? "Đã chép" : "Copy thoại"}
                    </span>
                  </button>
                </div>

                {/* 1. Lời thoại (Voiceover) - Teleprompter Box */}
                {sec.voice ? (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-purple-500/20 shadow-inner">
                    <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Mic size={12} className="text-purple-400 shrink-0" />
                      <span>Lời thoại (Voiceover):</span>
                    </div>
                    <p className="text-slate-100 text-xs sm:text-[13px] font-medium leading-relaxed font-sans select-all">
                      &ldquo;{sec.voice}&rdquo;
                    </p>
                  </div>
                ) : (
                  sec.content && (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans select-all">
                      {sec.content}
                    </div>
                  )
                )}

                {/* 2. Hành động & Góc quay (Visual / Action) */}
                {sec.action && (
                  <div className="px-2.5 py-2 rounded-lg bg-slate-900/50 border border-slate-700/40 flex items-start gap-2 text-xs text-slate-300">
                    <Camera size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-slate-400 font-semibold text-[11px] mr-1.5">
                        Hành động / Visual:
                      </span>
                      <span className="text-slate-200 text-[11px] leading-relaxed">
                        {sec.action}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Chữ trên màn hình (Text Overlay / Caption) */}
                {sec.overlay && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold">
                    <Type size={12} className="text-amber-400 shrink-0" />
                    <span>Chữ trên video:</span>
                    <span className="text-amber-200 font-semibold">&ldquo;{sec.overlay}&rdquo;</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Hộp gợi ý âm thanh & quay dựng nếu có */}
          {script.notes && (
            <div className="mt-3 p-3 rounded-xl bg-purple-950/25 border border-purple-800/40 text-purple-200 text-xs flex items-start gap-2.5">
              <Music size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <span className="font-bold text-purple-300 text-[11px] uppercase tracking-wide flex items-center gap-1">
                  Gợi ý âm thanh & Quay dựng:
                </span>
                <p className="text-purple-200/90 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {script.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ màu tím sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ (Sticky trên mobile) */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 sm:px-4 py-2.5 flex flex-col gap-2 shrink-0">
        {/* Row 1: Tiêu đề + Script count + View mode toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
              <Video size={16} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-bold text-white text-xs sm:text-sm truncate">
                Kho Kịch Bản Video TikTok / Reels
              </h2>
              {scripts.length > 0 && !loading && (
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {scripts.length} kịch bản
                </span>
              )}
            </div>
          </div>

          {/* Chuyển chế độ xem */}
          {result && !loading && (
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Dạng phân cảnh Timeline"
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-purple-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={11} /> Phân cảnh
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản đầy đủ"
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-purple-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={11} /> Gốc
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Thao tác xuất Excel + Download TXT + Copy */}
        {result && !loading && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-400 truncate">
              <span className="font-semibold text-purple-300">{scripts.length} kịch bản</span>
              <span className="mx-1">·</span>
              <span className="text-slate-300">{totalSections} phân cảnh</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                title="Xuất bảng phân cảnh tất cả kịch bản ra Excel"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="Tải kịch bản về máy (.txt)"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Tải TXT</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  copiedAll
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                }`}
              >
                {copiedAll ? (
                  <>
                    <Check size={13} className="stroke-[3]" /> Đã Chép!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Chép Cả {scripts.length} Kịch Bản
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Row 3: Thanh Tabs chọn kịch bản (Desktop ONLY) */}
        {scripts.length > 1 && !loading && viewMode === "cards" && (
          <div className="hidden lg:flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
            <div className="flex items-center gap-1.5 shrink-0">
              {scripts.map((script) => (
                <button
                  key={script.id}
                  type="button"
                  onClick={() => {
                    setSelectedScriptId(script.id);
                    setViewAll(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    !viewAll && selectedScriptId === script.id
                      ? "bg-purple-600 text-white font-bold shadow-xs"
                      : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/50"
                  }`}
                >
                  <Film size={12} />
                  <span>Kịch bản #{script.id}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-mono text-slate-300">
                    {script.sections.length} cảnh
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setViewAll(!viewAll)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer border flex items-center gap-1 ${
                viewAll
                  ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white border-slate-700/60"
              }`}
              title="Xem tất cả kịch bản trải dài trên 1 trang"
            >
              <Layers size={12} />
              <span>{viewAll ? "Thu gọn" : "Xem tất cả"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Nội dung kết quả kịch bản: Tự mở rộng trên mobile, scroll độc lập trên desktop */}
      <div className="p-3.5 sm:p-5 flex-1 min-h-0 relative z-10 lg:overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <Video size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">
                Chưa Có Kịch Bản Video
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Nhập tên sản phẩm & điểm nổi bật bên trái rồi bấm{" "}
                <strong className="text-purple-400 font-semibold">
                  &quot;Lên Kịch Bản Bằng AI&quot;
                </strong>{" "}
                để tự động tạo các kịch bản TikTok/Reels phân cảnh chi tiết.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Sparkles size={13} className="text-purple-400" />
                Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] text-slate-400">
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Sparkles size={11} className="text-purple-400" /> Hook 3s giật tít
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Film size={11} className="text-indigo-400" /> Bảng phân cảnh chi tiết
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <FileSpreadsheet size={11} className="text-emerald-400" /> Xuất Excel quay dựng
              </span>
            </div>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <Sparkles size={26} className="animate-spin text-purple-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Lên Kịch Bản Phân Cảnh Triệu View...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang thiết kế Hook 3s bắt trend, phân tách lời thoại, góc quay máy và chữ hiển thị trên màn hình...
              </p>
            </div>
          </div>
        )}

        {/* Kết quả khi đã sinh xong */}
        {result && !loading && (
          <>
            {viewMode === "cards" ? (
              <div>
                {/* 📱 GIAO DIỆN MOBILE: THUẦN TEXT GỌN GÀNG CHUẨN AI (< lg) */}
                <div className="lg:hidden p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 text-[13px] text-slate-200 leading-relaxed select-text space-y-6">
                  {scripts.map((script) => {
                    const isCopiedThisScript = copiedScriptId === script.id;
                    return (
                      <div key={script.id} className="space-y-4 pb-5 border-b border-slate-800/80 last:border-0 last:pb-0">
                        {/* Script Header */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                            🎬 #{script.id}: {script.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleCopySingleScript(script)}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                          >
                            {isCopiedThisScript ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{isCopiedThisScript ? "Đã chép" : "Chép kịch bản"}</span>
                          </button>
                        </div>

                        {/* Scenes List */}
                        <div className="space-y-3 pl-1">
                          {script.sections.map((sec) => {
                            const secKey = `m-${script.id}-${sec.id}`;
                            const isCopiedSec = copiedSectionKey === secKey;
                            return (
                              <div key={sec.id} className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white text-xs">
                                    ⏱️ [{sec.timeRange || "00:00"}] {sec.phase}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopySection(sec.voice || sec.content, secKey)}
                                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                                  >
                                    {isCopiedSec ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                    <span>{isCopiedSec ? "Đã chép" : "Chép"}</span>
                                  </button>
                                </div>

                                {sec.voice && (
                                  <p className="text-slate-100 text-xs leading-relaxed select-text">
                                    <strong className="text-purple-400 font-semibold">🎤 Thoại: </strong>
                                    &ldquo;{sec.voice}&rdquo;
                                  </p>
                                )}
                                {sec.action && (
                                  <p className="text-slate-300 text-xs leading-relaxed select-text">
                                    <strong className="text-indigo-400 font-semibold">🎬 Hình ảnh: </strong>
                                    {sec.action}
                                  </p>
                                )}
                                {sec.overlay && (
                                  <p className="text-slate-400 text-[11px] leading-relaxed select-text font-mono">
                                    <strong className="text-pink-400 font-semibold font-sans">🔤 Chữ video: </strong>
                                    {sec.overlay}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes if present */}
                        {script.notes && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                            <strong>💡 Lưu ý quay dựng: </strong>
                            {script.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 🖥️ GIAO DIỆN DESKTOP: BẢNG PHÂN CẢNH TRỰC QUAN ĐẦY ĐỦ (lg+) */}
                <div className="hidden lg:block">
                  {viewAll ? (
                    /* Hiển thị tất cả các kịch bản thành từng khối riêng biệt */
                    <div>
                      {scripts.map((script) => renderScriptCard(script, false))}
                    </div>
                  ) : (
                    /* Hiển thị từng kịch bản theo Tab được chọn */
                    activeScript && renderScriptCard(activeScript, true)
                  )}
                </div>
              </div>
            ) : (
              /* Chế độ xem văn bản gốc */
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl min-h-[420px] custom-scrollbar">
                <pre className="text-slate-300 font-sans text-xs leading-relaxed whitespace-pre-wrap select-all">
                  {viewAll
                    ? scripts
                        .map(
                          (s) =>
                            `================== ${s.title.toUpperCase()} ==================\n\n${s.rawText}`
                        )
                        .join("\n\n\n")
                    : activeScript?.rawText || result}
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer metadata ghim cố định đáy khung output */}
      {result && !loading && (
        <div className="px-3.5 sm:px-4 py-2 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <span>Số từ: <strong className="text-slate-200 font-mono">{wordCount}</strong></span>
            <span>Tổng phân cảnh: <strong className="text-purple-300 font-mono">{totalSections}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 size={12} /> Sẵn sàng quay dựng TikTok Shop & Reels
          </div>
        </div>
      )}
    </div>
  );
}
