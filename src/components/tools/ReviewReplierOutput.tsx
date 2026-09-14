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
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<number | "all">("all");

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
        const title = currentStyle.title || `Phương án ${id}`;
        let type: ReviewStyleItem["type"] = "general";
        let badge = "Đề Xuất";

        const lowerTitle = title.toLowerCase();
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

        styles.push({
          id,
          title,
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
    return parsedData.styles.filter((s) => s.id === activeTab);
  }, [parsedData.styles, activeTab]);

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng với sắc thái Hổ Phách & Cam (Amber / Orange) */}
      <div className="absolute top-0 right-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <MessageSquareWarning size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">
              Kết Quả Phản Hồi & Kịch Bản Xử Lý
            </h2>
          </div>
        </div>

        {/* Cụm nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} /> Trực quan
              </button>
              <button
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Gốc
              </button>
            </div>

            {/* Nút Tải kịch bản (.txt) */}
            <button
              onClick={handleDownloadTxt}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Download size={13} className="text-amber-400" /> Tải về (.txt)
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              onClick={handleCopyAll}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-white/10 active:scale-95"
            >
              {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedAll ? "Đã chép" : "Chép tất cả"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-3.5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
              <MessageSquareWarning size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa có phản hồi nào
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Dán nội dung đánh giá tiêu cực của khách hàng ở khung bên trái và bấm{" "}
              <strong className="text-amber-400 font-semibold">"Phản Hồi Bằng AI"</strong> để
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
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Thử mẫu 1 sao (Demo)
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
              <div className="space-y-4">
                {/* Thanh chọn Tab nhanh: Tất cả | Phong cách 1 | Phong cách 2 | Phong cách 3 */}
                {parsedData.styles.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "all"
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                      }`}
                    >
                      <Sparkles size={13} />
                      Tất cả ({parsedData.styles.length} phương án)
                    </button>

                    {parsedData.styles.map((style) => {
                      const theme = getStyleTheme(style.type);
                      const isSelected = activeTab === style.id;
                      return (
                        <button
                          key={style.id}
                          onClick={() => setActiveTab(style.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                              : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                          }`}
                        >
                          {theme.icon}
                          <span>{style.title.split(":")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Danh sách các Thẻ Phương Án */}
                <div className="space-y-3.5">
                  {displayedStyles.map((style) => {
                    const theme = getStyleTheme(style.type);
                    const isReplyCopied = copiedReplyId === style.id;
                    const isActionCopied = copiedActionId === style.id;

                    return (
                      <div
                        key={style.id}
                        className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all duration-200 ${theme.accentColor} ${theme.cardGlow} shadow-lg`}
                      >
                        {/* Card Header */}
                        <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-slate-700/60">{theme.icon}</div>
                            <h3 className="text-sm font-bold text-white tracking-wide">
                              {style.title}
                            </h3>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg}`}
                          >
                            {style.badge}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Khung Nội dung phản hồi công khai (Teleprompter Quote Box) */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Quote size={12} className="text-amber-400" /> Phản hồi công khai
                                trên sàn
                              </span>
                              <button
                                onClick={() => handleCopyReply(style.reply, style.id)}
                                className="text-[11px] font-bold px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                {isReplyCopied ? (
                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                                {isReplyCopied ? "Đã chép phản hồi" : "Chép phản hồi"}
                              </button>
                            </div>

                            <div className="relative bg-slate-900/90 rounded-lg p-3.5 border border-slate-700/80 text-slate-200 text-sm leading-relaxed font-sans select-all selection:bg-amber-500/30">
                              <span className="text-amber-400/30 text-2xl font-serif absolute -top-1 left-1 pointer-events-none">
                                “
                              </span>
                              <p className="relative z-10 pl-2 font-normal">{style.reply}</p>
                            </div>
                          </div>

                          {/* Khung Hành động hậu trường / Hướng dẫn xử lý Inbox */}
                          {style.action && (
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/40 flex items-start gap-2.5">
                              <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                <MessageCircle size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <h4 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                                    Hành động hậu trường & Xử lý Inbox
                                  </h4>
                                  <button
                                    onClick={() => handleCopyAction(style.action, style.id)}
                                    title="Chép gợi ý hành động"
                                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                                  >
                                    {isActionCopied ? (
                                      <Check size={12} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
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

                {/* Banner: Lời khuyên vàng khi xử lý đánh giá 1 sao */}
                {parsedData.adviceList.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                        <Lightbulb size={16} />
                      </div>
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                        Lời khuyên vàng khi xử lý đánh giá tiêu cực
                      </h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {parsedData.adviceList.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* Chế độ xem Markdown Gốc (Raw Mode) */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative group">
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
