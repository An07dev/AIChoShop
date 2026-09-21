"use client";

import { useState, useMemo } from "react";
import {
  MessageSquareWarning,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertTriangle,
  Truck,
  HeartHandshake,
  ShieldAlert,
  FileText,
  LayoutList,
  Lightbulb,
  MessageCircle,
  Star,
  Quote,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

export interface ReviewStyleItem {
  id: number;
  title: string;
  badge: string;
  type: "apologetic" | "delivery" | "brand" | "general";
  reply: string;
  action: string;
  rawText: string;
}

interface ReviewReplierOutputProps {
  result: string;
  loading: boolean;
  reviewContent?: string;
  rating?: string;
  issueType?: string;
  onUseSample?: () => void;
}

export function ReviewReplierOutput({
  result,
  loading,
  reviewContent,
  rating = "1 sao",
  issueType,
  onUseSample,
}: ReviewReplierOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedReplyId, setCopiedReplyId] = useState<number | null>(null);
  const [copiedActionId, setCopiedActionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");
  const [activeTab, setActiveTab] = useState<number | "all" | "advice">("all");

  // Bóc tách nội dung AI trả về thành danh sách 3 phong cách + lời khuyên vàng
  const parsedData = useMemo(() => {
    if (!result) return { styles: [], adviceList: [] };

    const lines = result.split("\n");
    const styles: ReviewStyleItem[] = [];
    let currentStyle: Partial<ReviewStyleItem> | null = null;
    let currentSection: "reply" | "action" | null = null;
    let isAdviceBlock = false;
    const rawAdviceLines: string[] = [];

    const flushCurrent = () => {
      if (currentStyle && (currentStyle.reply || currentStyle.rawText)) {
        const id = styles.length + 1;
        const rawTitle = currentStyle.title || `Phương án ${id}`;
        let type: ReviewStyleItem["type"] = "general";
        let badge = "Đề Xuất";

        const lowerTitle = rawTitle.toLowerCase();
        if (lowerTitle.includes("chân thành") || lowerTitle.includes("cầu thị")) {
          type = "apologetic";
          badge = "Khuyên Dùng";
        } else if (lowerTitle.includes("khéo léo") || lowerTitle.includes("vận chuyển") || lowerTitle.includes("khách quan")) {
          type = "delivery";
          badge = "Lỗi Vận Chuyển";
        } else if (lowerTitle.includes("minh bạch") || lowerTitle.includes("uy tín") || lowerTitle.includes("thương hiệu")) {
          type = "brand";
          badge = "Bảo Vệ Thương Hiệu";
        } else if (id === 1) {
          type = "apologetic";
          badge = "Phương Án 1";
        } else if (id === 2) {
          type = "delivery";
          badge = "Phương Án 2";
        } else if (id === 3) {
          type = "brand";
          badge = "Phương Án 3";
        }

        // Làm sạch tiêu đề để không trùng lặp badge: Bỏ ngoặc đơn cuối (Khuyên dùng/...)
        const cleanTitle = rawTitle
          .replace(/\s*\([^\)]*\)\s*$/, "")
          .replace(/^\d+[\.\:\-]\s*(?:Phong [Cc]ách|Phương [Áá]n)?\s*/i, "")
          .trim();

        const formattedTitle = cleanTitle ? `${id}. ${cleanTitle}` : `Phương án ${id}`;

        styles.push({
          id,
          title: formattedTitle,
          badge,
          type,
          reply: currentStyle.reply ? currentStyle.reply.trim() : (currentStyle.rawText || "").trim(),
          action: currentStyle.action ? currentStyle.action.trim() : "",
          rawText: (currentStyle.rawText || "").trim(),
        });
        currentStyle = null;
        currentSection = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("```")) continue;

      // Kiểm tra xem đã đến phần Lời khuyên vàng chưa
      if (/^#+\s*(?:Lời khuyên|Tips|Lưu ý|Chiến lược)/i.test(trimmed)) {
        flushCurrent();
        isAdviceBlock = true;
        continue;
      }

      if (isAdviceBlock) {
        // Thu thập các gạch đầu dòng của lời khuyên
        const cleanAdvice = trimmed.replace(/^[-*•\d\.\)]\s*/, "").replace(/\*+/g, "").trim();
        if (cleanAdvice) {
          rawAdviceLines.push(cleanAdvice);
        }
        continue;
      }

      // Phát hiện tiêu đề phong cách mới
      const headerMatch =
        trimmed.match(/^(?:#{2,4}\s+|\*{2}|\b)(?:\d+[\.\:\-]\s*)?(?:Phong [Cc]ách|Phương [Áá]n|Câu [Tt]rả [Ll]ời|Cách|Lựa [Cc]họn)[\:\s]*(.+?)(?:\*{2})?$/i) ||
        trimmed.match(/^#{2,4}\s+(\d+[\.\:\-]\s*.+)$/);

      if (headerMatch) {
        flushCurrent();
        const rawTitle = headerMatch[1].replace(/\*+/g, "").trim();
        currentStyle = {
          title: rawTitle,
          reply: "",
          action: "",
          rawText: "",
        };
        currentSection = null;
        continue;
      }

      // Nếu chưa có style nào mở đầu mà gặp block quote hoặc lời thoại
      if (!currentStyle && styles.length === 0 && (trimmed.startsWith(">") || trimmed.includes("Dạ Shop") || trimmed.includes("Chào bạn"))) {
        currentStyle = {
          title: "Phong Cách Chân Thành & Cầu Thị",
          reply: "",
          action: "",
          rawText: "",
        };
        currentSection = "reply";
      }

      if (currentStyle) {
        // Kiểm tra dòng chứa nội dung phản hồi công khai
        const replyMatch = trimmed.match(/^[-*•\s]*(?:\*\*|\*)?(?:Nội dung phản hồi|Phản hồi công khai|Phản hồi|Câu trả lời)[^:\n\r]*[:\-]\s*(.*)$/i);
        if (replyMatch) {
          currentSection = "reply";
          let content = replyMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
          if (content.startsWith(">")) content = content.replace(/^>\s*/, "").trim();
          if (content) {
            currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${content}` : content;
          }
          continue;
        }

        // Kiểm tra dòng chứa hành động hậu trường
        const actionMatch = trimmed.match(/^[-*•\s]*(?:\*\*|\*)?(?:Hành động hậu trường|Hành động|Hậu trường|Xử lý inbox|Gợi ý)[^:\n\r]*[:\-]\s*(.*)$/i);
        if (actionMatch) {
          currentSection = "action";
          let content = actionMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
          if (content) {
            currentStyle.action = currentStyle.action ? `${currentStyle.action} ${content}` : content;
          }
          continue;
        }

        // Nếu dòng là trích dẫn markdown "> ..."
        if (trimmed.startsWith(">")) {
          const quoteText = trimmed.replace(/^>\s*/, "").replace(/^["'“”]|["'“”]$/g, "").trim();
          currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${quoteText}` : quoteText;
          continue;
        }

        // Nối tiếp văn bản theo section hiện tại (hỗ trợ nhiều dòng)
        if (currentSection === "reply") {
          currentStyle.reply = currentStyle.reply ? `${currentStyle.reply} ${trimmed}` : trimmed;
        } else if (currentSection === "action") {
          currentStyle.action = currentStyle.action ? `${currentStyle.action} ${trimmed}` : trimmed;
        } else {
          currentStyle.rawText = currentStyle.rawText ? `${currentStyle.rawText}\n${line}` : line;
        }
      }
    }

    flushCurrent();

    // Chuẩn hóa và làm sạch
    styles.forEach((s) => {
      if (s.reply) {
        s.reply = s.reply.replace(/^["'“”]|["'“”]$/g, "").trim();
      }
      if (!s.reply && s.rawText) {
        s.reply = s.rawText.replace(/^["'“”]|["'“”]$/g, "").trim();
      }
    });

    // Fallback: nếu AI trả về văn bản chưa parse được ít nhất 2 styles, tự động bóc tách theo khối
    if (styles.length < 2 && result.trim()) {
      const splitChunks = result
        .split(/(?:\n\s*(?:#{1,4}\s*)?(?:Phương án|Phong cách|Câu trả lời|Cách|Lựa chọn|\d+[\.\:\)])\s*)/i)
        .filter((c) => c.trim().length > 20);

      if (splitChunks.length >= 2) {
        styles.length = 0;
        splitChunks.slice(0, 3).forEach((chunk, index) => {
          const id = index + 1;
          const titles = [
            "Phong Cách Chân Thành & Cầu Thị",
            "Phong Cách Khéo Léo & Khách Quan",
            "Phong Cách Minh Bạch & Bảo Vệ Thương Hiệu"
          ];
          const badges = ["Khuyên Dùng", "Lỗi Vận Chuyển", "Bảo Vệ Thương Hiệu"];
          const types: ReviewStyleItem["type"][] = ["apologetic", "delivery", "brand"];

          styles.push({
            id,
            title: titles[index] || `Phương án ${id}`,
            badge: badges[index] || "Đề Xuất",
            type: types[index] || "general",
            reply: chunk.trim(),
            action: "Chủ động nhắn tin riêng qua inbox để trao đổi giải pháp giải quyết thỏa đáng.",
            rawText: chunk.trim(),
          });
        });
      } else if (styles.length === 0) {
        styles.push({
          id: 1,
          title: "Phương án phản hồi AI",
          badge: "Đề Xuất",
          type: "general",
          reply: result.trim(),
          action: "Chủ động liên hệ qua tin nhắn riêng để hỗ trợ khách hàng nhanh chóng.",
          rawText: result.trim(),
        });
      }
    }

    // Lời khuyên mặc định nếu AI không trả về
    const defaultAdvice = [
      "Không bao giờ đôi co hoặc cãi vã trên bình luận công khai để giữ hình ảnh chuyên nghiệp.",
      "Luôn chủ động điều hướng khách vào tin nhắn riêng (Inbox) để xử lý bồi thường thỏa đáng.",
      "Sau khi khách đồng ý giải pháp đền bù/đổi hàng, khéo léo nhờ khách cập nhật lại đánh giá 5 sao.",
      "Báo cáo sàn can thiệp nếu bình luận chứa từ ngữ thô tục hoặc có dấu hiệu phá hoại từ đối thủ.",
    ];

    return {
      styles,
      adviceList: rawAdviceLines.length > 0 ? rawAdviceLines : defaultAdvice,
    };
  }, [result]);

  // Sao chép phản hồi công khai
  const handleCopyReply = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedReplyId(id);
    setTimeout(() => setCopiedReplyId(null), 2000);
  };

  // Sao chép hành động hậu trường
  const handleCopyAction = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedActionId(id);
    setTimeout(() => setCopiedActionId(null), 2000);
  };

  // Sao chép tất cả nội dung
  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải về file text
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PhanHoiDanhGia_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Xuất file Excel kịch bản (.xlsx)
  const handleExportExcel = () => {
    if (!result || parsedData.styles.length === 0) return;

    const rows: any[] = [];
    let stt = 1;

    parsedData.styles.forEach((item) => {
      rows.push({
        STT: stt++,
        "Phong Cách": item.title,
        "Đặc Trưng": item.badge,
        "Phản Hồi Công Khai": item.reply,
        "Số Ký Tự": item.reply.length,
        "Hành Động Hậu Trường (Inbox)": item.action || "Chủ động liên hệ khách giải quyết thỏa đáng",
        "Đánh Giá Của Khách": reviewContent || "Đánh giá tiêu cực của khách",
        "Mức Sao": rating || "1 sao",
        "Vấn Đề": issueType || "Khiếu nại sản phẩm/vận chuyển",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 20 },
      { wch: 80 },
      { wch: 10 },
      { wch: 60 },
      { wch: 50 },
      { wch: 10 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "XuLyKhungHoang");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `AIChoShop_PhanHoiDanhGia_${dateStr}.xlsx`);
  };

  // Helper lấy icon và màu sắc cho từng style
  const getStyleTheme = (type: ReviewStyleItem["type"]) => {
    switch (type) {
      case "apologetic":
        return {
          icon: <HeartHandshake size={16} className="text-amber-400" />,
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          accentColor: "border-amber-500/40 bg-amber-500/5",
          btnHover: "hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40",
          cardGlow: "shadow-amber-950/20",
        };
      case "delivery":
        return {
          icon: <Truck size={16} className="text-cyan-400" />,
          badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
          accentColor: "border-cyan-500/40 bg-cyan-500/5",
          btnHover: "hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40",
          cardGlow: "shadow-cyan-950/20",
        };
      case "brand":
        return {
          icon: <ShieldCheck size={16} className="text-emerald-400" />,
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          accentColor: "border-emerald-500/40 bg-emerald-500/5",
          btnHover: "hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40",
          cardGlow: "shadow-emerald-950/20",
        };
      default:
        return {
          icon: <Sparkles size={16} className="text-orange-400" />,
          badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
          accentColor: "border-orange-500/40 bg-orange-500/5",
          btnHover: "hover:bg-orange-500/20 hover:text-orange-300 hover:border-orange-500/40",
          cardGlow: "shadow-orange-950/20",
        };
    }
  };

  const displayedStyles = useMemo(() => {
    if (activeTab === "all") return parsedData.styles;
    if (activeTab === "advice") return [];
    return parsedData.styles.filter((s) => s.id === activeTab);
  }, [parsedData.styles, activeTab]);

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng với sắc thái Hổ Phách & Cam (Amber / Orange) */}
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ (Toolbar) - Cố định 1 hàng chuẩn mobile */}
      <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-900/90 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquareWarning size={13} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-sm text-white truncate block">
              Kịch Bản Xử Lý
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:block">
              3 Phương Án · Hạ Nhiệt & Cứu Shop
            </span>
          </div>
        </div>

        {/* Cụm nút hành động - Luôn 1 hàng duy nhất */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Chuyển chế độ xem: Trực quan vs Gốc (icon-only trên mobile) */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
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
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} />
                <span className="hidden md:inline">Gốc</span>
              </button>
            </div>

            {/* Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Xuất 3 kịch bản ra file Excel (.xlsx)"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
            >
              <FileSpreadsheet size={12} className="text-amber-400" />
              <span>Excel</span>
            </button>

            {/* Nút Tải kịch bản (.txt): ẩn trên mobile, hiện trên sm+ */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Tải file text (.txt)"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={12} />
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {copiedAll ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
              <span>{copiedAll ? "Đã chép" : "Chép hết"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân Loại Phong Cách & Lời Khuyên - Cố định bên dưới toolbar tương tự ChatBroadcast & VideoRepurposer */}
      {result && !loading && (
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
            {parsedData.styles.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 font-mono">
                {parsedData.styles.length}
              </span>
            )}
          </button>

          {parsedData.styles.map((style) => {
            const isSelected = activeTab === style.id;
            const shortTitle =
              style.type === "apologetic"
                ? "1: Cầu thị"
                : style.type === "delivery"
                  ? "2: Vận chuyển"
                  : style.type === "brand"
                    ? "3: Thương hiệu"
                    : `${style.id}: ${style.title.split(":")[0].replace(/^(?:Phương án|Phong cách)\s*/i, "")}`;

            const fullTitle = style.title.split(":")[0];

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setActiveTab(style.id)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                  isSelected
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    style.type === "apologetic"
                      ? "bg-amber-500"
                      : style.type === "delivery"
                        ? "bg-sky-500"
                        : "bg-emerald-500"
                  }`}
                />
                <span className="sm:hidden">{shortTitle}</span>
                <span className="hidden sm:inline">{fullTitle}</span>
              </button>
            );
          })}

          {parsedData.adviceList.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("advice")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                activeTab === "advice"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <Lightbulb size={12} className="text-amber-400 sm:w-[13px] sm:h-[13px]" />
              <span className="sm:hidden">Lời khuyên</span>
              <span className="hidden sm:inline">Lời Khuyên Vàng</span>
            </button>
          )}
        </div>
      )}

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-3 sm:p-5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar pb-28 lg:pb-4">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 mb-1">
              <MessageSquareWarning size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              Chưa có phản hồi nào
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Dán nội dung đánh giá tiêu cực của khách hàng ở khung bên trái và bấm{" "}
              <strong className="text-amber-400 font-semibold">&quot;Phản Hồi Đắc Nhân Tâm Bằng AI&quot;</strong> để
              tạo 3 kịch bản xử lý chuyên nghiệp và đắc nhân tâm nhất.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
              <Sparkles size={13} className="text-amber-400" />
              <span>Gợi ý 3 phong cách: Chân thành, Khéo léo vận chuyển, Bảo vệ thương hiệu</span>
            </div>
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Chạy thử với dữ liệu mẫu (Demo)
              </button>
            )}
          </div>
        )}

        {/* Trạng thái đang tải (Loading) - Biểu tượng xoay tròn */}
        {loading && (
          <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <MessageSquareWarning size={28} className="animate-spin text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Phân Tích Tâm Lý & Soạn Kịch Bản...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang bóc tách bức xúc của khách, cân đối lý lẽ bảo vệ shop và xây dựng 3 phương án phản hồi đắc nhân tâm...
              </p>
            </div>
          </div>
        )}

        {/* Kết quả khi đã có dữ liệu */}
        {result && !loading && (
          <>
            {viewMode === "visual" ? (
              <div className="space-y-3.5 sm:space-y-4">
                {/* Thanh tóm tắt nhanh: 1 dòng siêu gọn gàng */}
                <div className="flex items-center justify-between gap-2 pb-2 sm:pb-2.5 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                    <span>
                      Đánh giá: <strong className="text-amber-400 font-bold">{rating || "1 sao"}</strong>
                    </span>
                    {issueType && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300 truncate max-w-[140px] sm:max-w-none">{issueType}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
                    <ShieldCheck size={12} />
                    <span className="hidden sm:inline">3 Phương Án · Hạ Nhiệt & Cứu Điểm Shop</span>
                    <span className="sm:hidden">Hạ nhiệt & cứu shop</span>
                  </div>
                </div>

                {/* Danh sách các Thẻ Phương Án */}
                {displayedStyles.length > 0 && (
                  <div className="space-y-3 sm:space-y-3.5">
                  {displayedStyles.map((style) => {
                    const theme = getStyleTheme(style.type);
                    const isReplyCopied = copiedReplyId === style.id;
                    const isActionCopied = copiedActionId === style.id;

                    return (
                      <div
                        key={style.id}
                        className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-all duration-200 ${theme.accentColor} ${theme.cardGlow} shadow-lg`}
                      >
                        {/* Card Header - Luôn 1 dòng trên mobile */}
                        <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            <div className="p-1 rounded-lg bg-slate-700/60 shrink-0">{theme.icon}</div>
                            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                              {style.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <span
                              className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg} truncate max-w-[95px] sm:max-w-none`}
                            >
                              {style.badge}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyReply(style.reply, style.id)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${isReplyCopied
                                ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                                }`}
                              title="Sao chép phản hồi công khai"
                            >
                              {isReplyCopied ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                              <span className="sm:hidden">{isReplyCopied ? "Đã chép" : "Chép"}</span>
                              <span className="hidden sm:inline">{isReplyCopied ? "Đã chép" : "Sao chép"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                          {/* Khung Nội dung phản hồi công khai */}
                          <div className="space-y-1 sm:space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Quote size={11} className="text-amber-400" /> Phản hồi công khai trên sàn
                              </span>
                              <span className="text-[10px] text-slate-500 hidden sm:inline">
                                {style.reply.length} ký tự
                              </span>
                            </div>

                            <div className="relative bg-slate-900/90 rounded-xl p-3 sm:p-3.5 border border-slate-700/80 text-slate-100 text-[12.5px] sm:text-sm leading-relaxed font-sans select-text space-y-2">
                              <p className="font-normal select-text whitespace-pre-line">{style.reply}</p>
                              {/* Thanh thao tác nhanh chân phản hồi */}
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium truncate">
                                  <Sparkles size={10} className="shrink-0" />
                                  <span className="hidden sm:inline">Hạ nhiệt &amp; cứu điểm uy tín</span>
                                  <span className="sm:hidden">Hạ nhiệt &amp; cứu shop</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyReply(style.reply, style.id)}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  {isReplyCopied ? <Check size={10} className="text-emerald-400 stroke-[3]" /> : <Copy size={10} />}
                                  <span>{isReplyCopied ? "Đã chép câu này" : "Chép phản hồi này →"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Khung Hành động hậu trường / Hướng dẫn xử lý Inbox */}
                          {style.action && (
                            <div className="bg-slate-900/60 rounded-xl p-2.5 sm:p-3 border border-slate-700/40 flex items-start gap-2 sm:gap-2.5">
                              <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                <MessageCircle size={13} className="sm:w-[14px] sm:h-[14px]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                  <h4 className="text-[10px] sm:text-[11px] font-bold text-indigo-300 uppercase tracking-wider truncate">
                                    Hành động hậu trường & Xử lý Inbox
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAction(style.action, style.id)}
                                    title="Chép gợi ý hành động"
                                    className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer shrink-0"
                                  >
                                    {isActionCopied ? (
                                      <Check size={11} className="text-emerald-400 stroke-[3]" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed select-text">
                                  {style.action}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}

                {/* Banner: Lời khuyên vàng khi xử lý đánh giá 1 sao */}
                {(activeTab === "all" || activeTab === "advice") && parsedData.adviceList.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-lg space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                          <Lightbulb size={14} className="sm:w-4 sm:h-4" />
                        </div>
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider truncate">
                          Lời khuyên khi xử lý đánh giá tiêu cực
                        </h4>
                      </div>

                    </div>
                    <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-300">
                      {parsedData.adviceList.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2 select-text">
                          <CheckCircle2 size={12} className="text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* Chế độ xem Markdown Gốc (Raw Mode) */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-4 relative group">
                <pre className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30 overflow-x-auto">
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
