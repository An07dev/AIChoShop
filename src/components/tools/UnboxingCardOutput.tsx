"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Download,
  HeartHandshake,
  ShieldCheck,
  Star,
  QrCode,
  Printer,
  FileText,
  Gift,
  Heart,
  LayoutList,
  Layers,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface UnboxingCardOutputProps {
  result: string;
  loading: boolean;
  shopName: string;
  cardFormat?: string;
  cardTone?: string;
}

export function UnboxingCardOutput({
  result,
  loading,
  shopName,
  cardFormat = "postcard_a6",
  cardTone: _cardTone = "emotional",
}: UnboxingCardOutputProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "raw">("card");
  const [cardSide, setCardSide] = useState<"both" | "front" | "back" | "print">("both");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleCopy = (text: string, key: string, label: string = "Đã sao chép!") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    handleCopy(result, "all", "Đã sao chép toàn bộ bản thiết kế thiệp!");
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thu-cam-on-${(shopName || "shop").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống tệp .txt!");
  };

  // Trích xuất các phần nội dung từ kết quả AI
  const cardData = useMemo(() => {
    if (!result) return null;

    const frontMatch = result.match(/##\s*[🎴1\.\s]*MẶT TRƯỚC[\s\S]*?(?=(?:---|##\s*[💌2\.\s]*MẶT SAU|$))/i);
    const backMatch = result.match(/##\s*[💌2\.\s]*MẶT SAU[\s\S]*?(?=(?:---|##\s*[🖨️3\.\s]*QUY CHUẨN|##\s*3|$))/i);
    const printMatch = result.match(/##\s*[🖨️3\.\s]*QUY CHUẨN[\s\S]*?(?=$)/i);

    const rawFront = frontMatch ? frontMatch[0].trim() : "";
    const rawBack = backMatch ? backMatch[0].trim() : "";
    const rawPrint = printMatch ? printMatch[0].trim() : "";

    // Parse thông tin mặt trước
    const headlineMatch = rawFront.match(/(?:Tiêu đề đập vào mắt|Tiêu đề)[^:]*:\s*([^\n]+)/i);
    const subMatch = rawFront.match(/(?:Lời tựa|Sub-headline)[^:]*:\s*([^\n]+)/i);
    const visualMatch = rawFront.match(/(?:Điểm nhấn thiết kế|Visual Note)[^:]*:\s*([^\n]+)/i);

    const headline = headlineMatch
      ? headlineMatch[1].replace(/[*_]/g, "").trim()
      : "MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN!";
    const subheadline = subMatch
      ? subMatch[1].replace(/[*_]/g, "").trim()
      : "Cảm ơn bạn vì đã tin tưởng lựa chọn chúng mình giữa muôn vàn thương hiệu ngoài kia.";
    const visualNote = visualMatch
      ? visualMatch[1].replace(/[*_]/g, "").trim()
      : "";

    // Parse các khối giá trị mặt sau
    const shieldMatch = rawBack.match(/###\s*[🛡️\s]*KHIÊN CHẮN 1 SAO[\s\S]*?(?=(?:###|$))/i);
    const starMatch = rawBack.match(/###\s*[⭐\s]*NAM CHÂM KÉO REVIEW[\s\S]*?(?=(?:###|$))/i);
    const qrMatch = rawBack.match(/###\s*[📲\s]*CỔNG QUÉT QR[\s\S]*?(?=(?:---|##|$))/i);

    return {
      rawFront,
      rawBack,
      rawPrint,
      headline,
      subheadline,
      visualNote,
      shield: shieldMatch ? shieldMatch[0].trim() : "",
      star: starMatch ? starMatch[0].trim() : "",
      qr: qrMatch ? qrMatch[0].trim() : "",
    };
  }, [result]);

  const formatBadge =
    cardFormat === "mini_card"
      ? { text: "Card Mini (9x5.4cm)", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" }
      : cardFormat === "voucher_tag"
      ? { text: "Tag Quà / Thẻ Treo", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" }
      : { text: "Khổ A6 Chuẩn (10x15cm)", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-rose-500/50 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <Check size={12} className="text-rose-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. Header thanh công cụ (Toolbar) - CỐ ĐỊNH 1 HÀNG NGANG DUY NHẤT */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-20 bg-slate-900/90 backdrop-blur-md shrink-0 flex-nowrap">
        {/* Bên trái: Icon & Tiêu đề */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
            <HeartHandshake size={14} className="sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="font-bold text-white text-xs sm:text-sm truncate">
            Bản Thiết Kế Thiệp
          </h2>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${formatBadge.color} hidden md:inline truncate`}>
            {formatBadge.text}
          </span>
        </div>

        {/* Bên phải: Nút hành động (flex-nowrap) */}
        {result && !loading && (
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Chuyển chế độ xem: Mô phỏng vs Văn bản */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                title="Mô phỏng thiệp trực quan"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "card"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Mô phỏng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Văn bản thuần markdown"
                className={`p-1 sm:px-2 sm:py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} className="sm:w-[13px] sm:h-[13px]" />
                <span className="hidden md:inline">Văn bản</span>
              </button>
            </div>

            {/* Tải tệp .txt (Desktop only) */}
            <button
              type="button"
              onClick={handleDownload}
              title="Tải tệp thiết kế (.txt)"
              className="hidden sm:flex p-1 sm:p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              <Download size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg transition-all shadow-md shadow-rose-950/40 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
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

      {/* 2. Pinned Sub-Tabs - Cố định bên dưới toolbar */}
      {result && !loading && viewMode === "card" && (
        <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-slate-800 bg-slate-950/70 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setCardSide("both")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              cardSide === "both"
                ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>Cả 2 Mặt</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("front")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              cardSide === "front"
                ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>1. Mặt Trước</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("back")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              cardSide === "back"
                ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HeartHandshake size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>2. Mặt Sau</span>
          </button>
          <button
            type="button"
            onClick={() => setCardSide("print")}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              cardSide === "print"
                ? "bg-slate-800 text-rose-300 border border-rose-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Printer size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>3. Mẹo In Xưởng</span>
          </button>
        </div>
      )}

      {/* 3. Nội dung kết quả */}
      <div className="flex-1 min-h-0 p-3 sm:p-5 overflow-y-auto custom-scrollbar relative z-10 pb-24 lg:pb-4">
        {loading ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <Sparkles size={26} className="animate-spin text-rose-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Thiết Kế Thư Cảm Ơn Đắc Nhân Tâm...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang tạo lời tri ân chạm cảm xúc, cài khiên chắn chống 1 sao và tối ưu đòn bẩy kéo đánh giá 5 sao kèm ảnh...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4 sm:space-y-5">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[520px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {/* 1. MẶT TRƯỚC THIỆP */}
                {(cardSide === "both" || cardSide === "front") && cardData && (
                  <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />

                    {/* Header Khối Mặt Trước */}
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-rose-500/20">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <Heart size={13} className="fill-rose-400" /> 1. Mặt Trước (Bìa Thiệp - First Impression)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(cardData.rawFront || result, "front", "Đã chép nội dung mặt trước!")}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedKey === "front" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                        <span className="hidden xs:inline">Chép mặt trước</span>
                      </button>
                    </div>

                    {/* Khung mô phỏng thiệp mặt trước */}
                    <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-5 text-center space-y-2.5 relative">
                      <div className="w-9 h-9 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <Gift size={18} />
                      </div>
                      <div className="text-[11px] uppercase tracking-widest text-rose-400 font-bold">
                        {shopName ? shopName.toUpperCase() : "OFFICIAL STORE"}
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug">
                        {cardData.headline}
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto italic leading-relaxed">
                        &ldquo;{cardData.subheadline}&rdquo;
                      </p>
                      {cardData.visualNote && (
                        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1 border-t border-slate-800/80 mt-2">
                          <Sparkles size={12} className="text-amber-400 shrink-0" />
                          <span className="line-clamp-2">Ghi chú thiết kế: {cardData.visualNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. MẶT SAU THIỆP */}
                {(cardSide === "both" || cardSide === "back") && cardData && (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
                    {/* Header Khối Mặt Sau */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <HeartHandshake size={14} /> 2. Mặt Sau (Nội Dung Tri Ân Đắc Nhân Tâm)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(cardData.rawBack || result, "back", "Đã chép nội dung mặt sau!")}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedKey === "back" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                        <span className="hidden xs:inline">Chép mặt sau</span>
                      </button>
                    </div>

                    {/* Lưới 3 khối giá trị cốt lõi */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                      {/* Khiên chắn 1 sao */}
                      <div className="bg-rose-950/30 border border-rose-700/40 rounded-xl p-3 space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                            <ShieldCheck size={13} className="text-rose-400" /> Khiên Chắn 1 Sao
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardData.shield || "Khiên chắn 1 sao", "shield", "Đã chép lời dẫn chống 1 sao!")}
                            className="text-[10px] text-rose-400 hover:text-white p-1 cursor-pointer"
                            title="Sao chép khối này"
                          >
                            {copiedKey === "shield" ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Lời cam kết đổi trả 100% miễn phí trong 24h nhằm hóa giải bức xúc trước khi khách bấm đánh giá 1 sao.
                        </p>
                      </div>

                      {/* Nam châm kéo review 5 sao */}
                      <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3 space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <Star size={13} className="text-amber-400 fill-amber-400" /> Nam Châm 5 Sao
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardData.star || "Nam châm 5 sao", "star", "Đã chép quà kéo review!")}
                            className="text-[10px] text-amber-400 hover:text-white p-1 cursor-pointer"
                            title="Sao chép khối này"
                          >
                            {copiedKey === "star" ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Tặng voucher giảm giá và quà tri ân đơn tiếp theo để thúc đẩy khách quay video, chụp ảnh chấm 5 sao.
                        </p>
                      </div>

                      {/* Cổng QR Zalo an toàn */}
                      <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3 space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <QrCode size={13} className="text-emerald-400" /> Cổng QR An Toàn
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cardData.qr || "Cổng quét QR an toàn", "qr", "Đã chép lời dẫn quét QR!")}
                            className="text-[10px] text-emerald-400 hover:text-white p-1 cursor-pointer"
                            title="Sao chép khối này"
                          >
                            {copiedKey === "qr" ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Lời dẫn quét QR kích hoạt bảo hành hoặc quà bí mật, đưa khách về kênh chăm sóc mà không bị vi phạm sàn.
                        </p>
                      </div>
                    </div>

                    {/* Nội dung chi tiết của Mặt Sau */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-xs text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
                      {cardData.rawBack || result}
                    </div>
                  </div>
                )}

                {/* 3. MẸO IN ẤN & XƯỞNG IN */}
                {(cardSide === "both" || cardSide === "print") && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Printer size={13} />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          3. Quy Chuẩn In Ấn & Tối Ưu Chi Phí Xưởng
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(cardData?.rawPrint || "Quy chuẩn in ấn", "print", "Đã chép mẹo in ấn xưởng!")}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedKey === "print" ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                        <span className="hidden xs:inline">Chép quy chuẩn in</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      {cardData?.rawPrint ? (
                        <div className="whitespace-pre-line leading-relaxed text-slate-300">
                          {cardData.rawPrint}
                        </div>
                      ) : (
                        <p className="text-slate-400 leading-relaxed">
                          Nên đặt in chất liệu <strong className="text-slate-200">Giấy C300 cán màng mờ 2 mặt</strong> (chống nước, chống quăn mép khi dính sương bưu kiện). Khi in số lượng từ 1.000 tấm, chi phí tại xưởng in offset chỉ khoảng <strong className="text-emerald-400">350đ - 500đ/tấm</strong>, nhưng mang lại tỷ lệ giữ chân khách và hạn chế hoàn hàng rất hiệu quả!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-sm">Chưa Có Dữ Liệu Thiết Kế</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Điền thông tin shop bên trái và bấm &ldquo;Tạo Thư Cảm Ơn Ngay&rdquo; hoặc bấm &ldquo;Dữ Liệu Mẫu&rdquo; để xem bản thiết kế hoàn chỉnh.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UnboxingCardOutput;
