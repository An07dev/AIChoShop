"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  PackageCheck,
  PhoneCall,
  MessageSquare,
  Send,
  Truck,
  FileSpreadsheet,
  ShieldCheck,
  Lightbulb,
  Store,
  LayoutList,
  FileText,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface ChatMessageItem {
  sampleNumber: string;
  title: string;
  badge: string;
  content: string;
  charCount: number;
  isSafe: boolean;
}

export interface CallScriptData {
  intro: string;
  handling: string;
  closing: string;
  full: string;
}

export interface SmsScriptData {
  title: string;
  content: string;
  charCount: number;
  isStandard: boolean;
}

export interface PlanBData {
  sellerCenter: string[];
  shipper: string[];
}

export interface PsychologyTactic {
  title: string;
  desc: string;
}

export interface ParsedAntiReturnData {
  chatMessages: ChatMessageItem[];
  callScript: CallScriptData;
  smsScript: SmsScriptData;
  planB: PlanBData;
  psychology: PsychologyTactic[];
  raw: string;
}

interface AntiReturnNudgeOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  productName: string;
  scenario?: string;
  onUseSample?: () => void;
}

// Phân tích kịch bản đầu ra
export function parseAntiReturnNudge(text: string): ParsedAntiReturnData | null {
  if (!text) return null;

  const findSection = (keyword: string, nextKeywords: string[] = []) => {
    const match = text.match(new RegExp(`^[ \\t]*(?:##|#)\\s*[^\\n]*?${keyword}[^\\n]*$`, "im"));
    if (!match || match.index === undefined) return "";
    const startIdx = match.index + match[0].length;
    const contentStart = text.slice(startIdx);
    let endIdx = contentStart.length;
    for (const nextKw of nextKeywords) {
      const nextMatch = contentStart.match(new RegExp(`^[ \\t]*(?:---|##|#)\\s*[^\\n]*?${nextKw}`, "im"));
      if (nextMatch && nextMatch.index !== undefined && nextMatch.index < endIdx) {
        endIdx = nextMatch.index;
      }
    }
    return contentStart.slice(0, endIdx).trim();
  };

  const s1 = findSection("KỊCH BẢN TIN NHẮN CHAT", ["KỊCH BẢN GỌI ĐIỆN", "GỌI ĐIỆN"]);
  const s2 = findSection("KỊCH BẢN GỌI ĐIỆN", ["KẾ HOẠCH HÀNH ĐỘNG", "PLAN B"]);
  const s3 = findSection("KẾ HOẠCH HÀNH ĐỘNG", ["BÍ QUYẾT TÂM LÝ", "TÂM LÝ"]);
  const s4 = findSection("BÍ QUYẾT TÂM LÝ", []);

  // 1. Tin nhắn chat sàn
  const chatMessages: ChatMessageItem[] = [];
  if (s1) {
    const mẫuMatches = s1.split(/(?=###\s*)/g).filter((chunk) => chunk.trim().startsWith("###"));
    mẫuMatches.forEach((chunk, idx) => {
      const headerMatch = chunk.match(/^###\s*([^\n]+)/);
      const rawTitle = headerMatch ? headerMatch[1].trim() : `Mẫu ${idx + 1}`;
      const sampleNumber = /mẫu\s*1/i.test(rawTitle) ? "Mẫu 1" : /mẫu\s*2/i.test(rawTitle) ? "Mẫu 2" : `Mẫu ${idx + 1}`;

      let body = chunk.replace(/^###[^\n]+\n/, "").trim();
      body = body.replace(/^\s*\*\*\[[^\]]+\]\*\*\s*/im, "").trim();
      body = body.replace(/^\s*\*\([^\)]+\)\*\s*/im, "").trim();
      body = body.replace(/---\s*$/, "").trim();

      const badge = /dưới 350/i.test(rawTitle)
        ? "< 350 ký tự"
        : /quà tặng|trách nhiệm|quyền lợi/i.test(rawTitle)
          ? "Kèm Quà Tặng"
          : "Chuẩn CSKH";

      chatMessages.push({
        sampleNumber,
        title: rawTitle.replace(/^[📱🎁💡\s]+/, "").trim(),
        badge,
        content: body,
        charCount: body.length,
        isSafe: body.length <= 350,
      });
    });
  }

  // 2. Kịch bản gọi điện & SMS
  const callScript: CallScriptData = { intro: "", handling: "", closing: "", full: "" };
  let smsScript: SmsScriptData = { title: "Mẫu SMS / Zalo Nhắn Tin Nhanh", content: "", charCount: 0, isStandard: true };

  if (s2) {
    const introMatch = s2.match(/(?:Lời mở đầu|Mở đầu)\s*:\s*(?:["“]([^"”]+)["”]|([^\n]+))/i);
    if (introMatch) callScript.intro = (introMatch[1] || introMatch[2] || "").replace(/^["“]|["”]$/g, "").trim();

    const handleMatch = s2.match(/(?:Xử lý tình huống|Tình huống)\s*:\s*(?:["“]([\s\S]*?)["”]|([^\n]+(?:\n[^\n]+)?))/i);
    if (handleMatch) {
      let hText = (handleMatch[1] || handleMatch[2] || "").trim();
      hText = hText.split(/\n\s*-\s*\*\*/)[0].trim();
      callScript.handling = hText.replace(/^["“]|["”]$/g, "").trim();
    }

    const closeMatch = s2.match(/(?:Chốt hẹn giao hàng|Chốt hẹn)\s*:\s*(?:["“]([^"”]+)["”]|([^\n]+))/i);
    if (closeMatch) callScript.closing = (closeMatch[1] || closeMatch[2] || "").replace(/^["“]|["”]$/g, "").trim();

    callScript.full = [
      callScript.intro ? `• Lời mở đầu: "${callScript.intro}"` : "",
      callScript.handling ? `• Xử lý tình huống: "${callScript.handling}"` : "",
      callScript.closing ? `• Chốt hẹn giao hàng: "${callScript.closing}"` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const smsMatch = s2.match(/###\s*[^:\n]*?(?:SMS|Zalo)[^\n]*\n([\s\S]*?)$/i);
    if (smsMatch) {
      let body = smsMatch[1].trim();
      body = body.replace(/^\s*\*\*\[[^\]]+\]\*\*\s*/im, "").trim();
      body = body.replace(/^\s*\*\([^\)]+\)\*\s*/im, "").trim();
      body = body.replace(/---\s*$/, "").trim();
      smsScript = {
        title: "Mẫu SMS / Zalo Nhắn Tin Nhanh",
        content: body,
        charCount: body.length,
        isStandard: body.length <= 160,
      };
    }
  }

  // 3. Plan B
  const planB: PlanBData = { sellerCenter: [], shipper: [] };
  if (s3) {
    const scMatch = s3.match(/(?:Thao tác trên hệ thống sàn|Seller Center)[\s\S]*?(?=(?:Phối hợp với Shipper|Bưu cục|$))/i);
    if (scMatch) {
      const lines = scMatch[0].split("\n");
      for (const l of lines) {
        const step = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*(.+)$/);
        if (step && !/thao tác trên/i.test(step[1])) planB.sellerCenter.push(step[1].trim());
      }
    }

    const shipMatch = s3.match(/(?:Phối hợp với Shipper|Bưu cục)[\s\S]*?$/i);
    if (shipMatch) {
      const lines = shipMatch[0].split("\n");
      for (const l of lines) {
        const step = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*(.+)$/);
        if (step && !/phối hợp với/i.test(step[1])) planB.shipper.push(step[1].trim());
      }
    }
  }

  // 4. Mẹo tâm lý
  const psychology: PsychologyTactic[] = [];
  if (s4) {
    const lines4 = s4.split("\n");
    for (const l of lines4) {
      const match = l.match(/^\s*(?:\d+[\.\)]|\-|\*)\s*\*\*([^*]+)\*\*\s*[:\-]?\s*(.+)$/);
      if (match) {
        psychology.push({
          title: match[1].replace(/[:\-]$/, "").trim(),
          desc: match[2].trim(),
        });
      }
    }
  }

  return {
    chatMessages,
    callScript,
    smsScript,
    planB,
    psychology,
    raw: text,
  };
}

export function AntiReturnNudgeOutput({
  result,
  loading,
  shopName,
  productName,
  scenario = "just_ordered",
  onUseSample,
}: AntiReturnNudgeOutputProps) {
  const [activeTab, setActiveTab] = useState<"all" | "chat" | "call" | "planb" | "psychology">("all");
  const [viewMode, setViewMode] = useState<"interactive" | "raw">("interactive");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    return parseAntiReturnNudge(result);
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

  const handleExportExcel = () => {
    if (!parsed) return;
    try {
      const wb = XLSX.utils.book_new();

      const chatRows = [
        ...parsed.chatMessages.map((m, idx) => ({
          STT: idx + 1,
          "Kênh Gửi": "Khung Chat Sàn",
          "Loại Mẫu": m.sampleNumber,
          "Tiêu Đề": m.title,
          "Nội Dung Tin Nhắn": m.content,
          "Số Ký Tự": m.charCount,
          "Chuẩn Sàn (<350)": m.isSafe ? "Đạt chuẩn" : "Vượt 350 ký tự",
        })),
        {
          STT: parsed.chatMessages.length + 1,
          "Kênh Gửi": "SMS / Zalo",
          "Loại Mẫu": "SMS Khẩn",
          "Tiêu Đề": parsed.smsScript.title,
          "Nội Dung Tin Nhắn": parsed.smsScript.content,
          "Số Ký Tự": parsed.smsScript.charCount,
          "Chuẩn Sàn (<350)": parsed.smsScript.isStandard ? "1 SMS (<160)" : "SMS dài",
        },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chatRows), "TinNhan_Chat_SMS");

      const callRows = [
        { "Giai Đoạn": "1. Lời mở đầu (0-10s)", "Nội Dung": parsed.callScript.intro },
        { "Giai Đoạn": "2. Xử lý tình huống (10-35s)", "Nội Dung": parsed.callScript.handling },
        { "Giai Đoạn": "3. Chốt hẹn giao lại (35-45s)", "Nội Dung": parsed.callScript.closing },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(callRows), "LoiThoai_GoiDien");

      const guideRows = [
        ...parsed.planB.sellerCenter.map((s, idx) => ({
          "Hạng Mục": "Plan B - Seller Center",
          "Bước": `Bước ${idx + 1}`,
          "Nội Dung": s,
        })),
        ...parsed.planB.shipper.map((s, idx) => ({
          "Hạng Mục": "Plan B - Bưu Cục/Shipper",
          "Bước": `Bước ${idx + 1}`,
          "Nội Dung": s,
        })),
        ...parsed.psychology.map((p, idx) => ({
          "Hạng Mục": "Mẹo Tâm Lý Học",
          "Bước": p.title,
          "Nội Dung": p.desc,
        })),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guideRows), "PlanB_TamLy");

      const fileName = `kich-ban-cuu-don-${(shopName || "shop").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("Đã tải xuống file Excel kịch bản cứu đơn!");
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
    a.download = `kich-ban-cuu-don-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải tệp .txt!");
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast mini */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/95 text-emerald-400 text-xs font-semibold shadow-xl border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          <Check size={13} className="stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header thanh công cụ (Toolbar) - 1 hàng ngang duy nhất trên cả mobile & desktop */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-20 bg-slate-900/90 backdrop-blur-md shrink-0 flex-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0 shadow-2xs">
            <PackageCheck size={14} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm truncate">
            Kịch Bản Cứu Đơn COD
          </h2>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline truncate">
            Tối Ưu Giao Hàng
          </span>
        </div>

        {/* Hàng nút hành động - Cố định 1 hàng ngang */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "interactive"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <LayoutList size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Trực quan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${viewMode === "raw"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
                  }`}
              >
                <FileText size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Gốc</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất kịch bản ra file Excel (.xlsx)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs shrink-0"
            >
              <FileSpreadsheet size={12} className="text-emerald-400 sm:w-[13px] sm:h-[13px]" />
              <span className="hidden xs:inline">Excel</span>
            </button>

            {/* Nút Tải báo cáo (.txt): chỉ hiện trên màn lớn */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải tệp kịch bản .txt"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <Download size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={() => handleCopy(result, "all", "Đã sao chép toàn bộ kịch bản!")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
            >
              {copiedKey === "all" ? (
                <>
                  <Check size={12} className="stroke-[3]" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Chép hết</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Loại Danh Mục Đầu Ra (Pinned Sub-Tabs) - Cố định bên dưới toolbar */}
      {result && viewMode === "interactive" && !loading && (
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "all"
              ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <Layers size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Tất Cả</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "chat"
              ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <MessageSquare size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Chat Sàn ({parsed?.chatMessages.length || 2})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("call")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "call"
              ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <PhoneCall size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Gọi &amp; SMS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("planb")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "planb"
              ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <ShieldCheck size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Plan B Sàn</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("psychology")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${activeTab === "psychology"
              ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 shadow-xs"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            <Lightbulb size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Mẹo Tâm Lý</span>
          </button>
        </div>
      )}

      {/* Vùng hiển thị nội dung: cuộn nội bộ */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto custom-scrollbar relative z-10 pb-24 lg:pb-4">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Sparkles size={22} className="animate-spin text-emerald-400 duration-1000" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                <TextShimmerWave>AI Đang Soạn Kịch Bản Cứu Đơn &amp; Chống Bom...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang vận dụng tâm lý học hành vi, tháo gỡ lý do từ chối và tối ưu tin nhắn ngắn dưới 350 ký tự...
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
              <div className="space-y-3.5">
                {/* ========================================================================= */}
                {/* 1. KỊCH BẢN TIN NHẮN CHAT SÀN (SHOPEE / TIKTOK SHOP)                      */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "chat") && parsed.chatMessages.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-emerald-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          1. Kịch Bản Tin Nhắn Chat Sàn
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {parsed.chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3.5 space-y-2.5 hover:border-slate-700/80 transition-all"
                        >
                          {/* Header mẫu */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {msg.title}
                              </span>

                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopy(msg.content, `chat-${idx}`, `Đã chép ${msg.sampleNumber}!`)}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `chat-${idx}` ? (
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

                          {/* Nội dung tin nhắn (KHÔNG TRUNCATE) */}
                          <div className="text-slate-200 text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed select-text font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. KỊCH BẢN GỌI ĐIỆN THOẠI & SMS TRỰC TIẾP                                */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "call") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={14} className="text-blue-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          2. Lời Thoại Gọi Điện CSKH (45s) &amp; SMS
                        </h3>
                      </div>

                    </div>

                    {/* Lời thoại cuộc gọi 45 giây */}
                    <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          🎙️ Lời Thoại Cuộc Gọi (45 Giây)
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(parsed.callScript.full, "callFull", "Đã chép toàn bộ lời thoại!")}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === "callFull" ? (
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

                      {/* 3 Bước đắc nhân tâm */}
                      <div className="space-y-2 text-xs">
                        {parsed.callScript.intro && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-slate-300 mr-1.5">
                                01. Lời mở đầu:
                              </span>
                              <span className="text-slate-200">&quot;{parsed.callScript.intro}&quot;</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.intro, "intro", "Đã chép lời mở đầu!")}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "intro" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}

                        {parsed.callScript.handling && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-slate-300 mr-1.5">
                                02. Xử lý tình huống:
                              </span>
                              <span className="text-slate-200">&quot;{parsed.callScript.handling}&quot;</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.handling, "handling", "Đã chép xử lý tình huống!")}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "handling" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}

                        {parsed.callScript.closing && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-2">
                            <div className="leading-relaxed break-words min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-slate-300 mr-1.5">
                                03. Chốt hẹn giao lại:
                              </span>
                              <span className="text-slate-200">&quot;{parsed.callScript.closing}&quot;</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(parsed.callScript.closing, "closing", "Đã chép chốt hẹn!")}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer shrink-0"
                            >
                              {copiedKey === "closing" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mẫu SMS / Zalo */}
                    {parsed.smsScript.content && (
                      <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              📩 Mẫu SMS / Zalo Nhắn Tin Nhanh
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopy(parsed.smsScript.content, "sms", "Đã chép mẫu SMS!")}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "sms" ? (
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

                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap break-words select-text">
                          {parsed.smsScript.content}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. KẾ HOẠCH HÀNH ĐỘNG DỰ PHÒNG TRÊN SELLER CENTER (PLAN B)                */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "planb") && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          3. Kế Hoạch Dự Phòng (Plan B)
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Ngăn chặn shipper tự ý hoàn hàng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Thao tác trên Seller Center */}
                      {parsed.planB.sellerCenter.length > 0 && (
                        <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                          <h4 className="text-xs font-bold text-slate-200 pb-1.5 border-b border-slate-800/80 flex items-center gap-1.5">
                            🖥️ Thao tác trên Seller Center
                          </h4>
                          <div className="space-y-1.5">
                            {parsed.planB.sellerCenter.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                                <span className="font-mono text-slate-500 font-semibold shrink-0">
                                  {idx + 1}.
                                </span>
                                <span className="break-words">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phối hợp với Shipper / Bưu cục */}
                      {parsed.planB.shipper.length > 0 && (
                        <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3.5 space-y-2">
                          <h4 className="text-xs font-bold text-slate-200 pb-1.5 border-b border-slate-800/80 flex items-center gap-1.5">
                            🚚 Phối hợp Shipper / Bưu cục
                          </h4>
                          <div className="space-y-1.5">
                            {parsed.planB.shipper.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                                <span className="font-mono text-slate-500 font-semibold shrink-0">
                                  {idx + 1}.
                                </span>
                                <span className="break-words">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. BÍ QUYẾT TÂM LÝ HỌC CHỐNG BOM HÀNG                                    */}
                {/* ========================================================================= */}
                {(activeTab === "all" || activeTab === "psychology") && parsed.psychology.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-purple-400" />
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                          4. Mẹo Tâm Lý Học Chống Bom Hàng
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Tăng tỷ lệ nhận hàng 20-30%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {parsed.psychology.map((tactic, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-3 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-purple-400">
                              0{idx + 1}.
                            </span>
                            <h5 className="font-bold text-xs text-slate-200 leading-snug">
                              {tactic.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed break-words">
                            {tactic.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <PackageCheck size={24} className="text-emerald-400/80" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-sm text-slate-200">
                Chưa Có Kịch Bản Cứu Đơn COD
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chọn tình huống đơn hàng ở khung bên trái và bấm &quot;Tạo Kịch Bản Chống Bom &amp; Cứu Đơn&quot; để AI xây dựng toàn bộ giải pháp.
              </p>
            </div>

            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 px-3.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Thử dữ liệu mẫu cứu đơn</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AntiReturnNudgeOutput;
