"use client";

import { useState } from "react";
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
  cardTone = "emotional",
}: UnboxingCardOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "raw">("card");
  const [cardSide, setCardSide] = useState<"both" | "front" | "back">("both");

  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySnippet = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thu-cam-on-${shopName.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBadge =
    cardFormat === "mini_card"
      ? { text: "Card Visit Mini (9x5.4cm)", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" }
      : cardFormat === "voucher_tag"
      ? { text: "Tag Quà / Thẻ Treo", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" }
      : { text: "Bưu Thiếp A6 Chuẩn (10x15cm)", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col min-h-0 relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ */}
      <div className="absolute top-0 right-0 p-36 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
            <HeartHandshake size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Bản Thiết Kế Thư Cảm Ơn</h2>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${formatBadge.color}`}>
            {formatBadge.text}
          </span>
        </div>

        {/* Nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  viewMode === "card"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mô Phỏng Thiệp
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  viewMode === "raw"
                    ? "bg-rose-600 text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Văn Bản
              </button>
            </div>

            {viewMode === "card" && (
              <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setCardSide("both")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    cardSide === "both" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cả 2 Mặt
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide("front")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    cardSide === "front" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mặt Trước
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide("back")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    cardSide === "back" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mặt Sau
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title="Tải file txt"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download size={14} />
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                copiedAll
                  ? "bg-rose-500 text-white"
                  : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white"
              }`}
            >
              {copiedAll ? (
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

      {/* Nội dung kết quả */}
      <div className="flex-1 min-h-0 p-5 overflow-y-auto custom-scrollbar relative z-10">
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
          <div className="space-y-6">
            {viewMode === "raw" ? (
              <textarea
                readOnly
                value={result}
                className="w-full h-[500px] bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed resize-none focus:outline-hidden custom-scrollbar"
              />
            ) : (
              <div className="space-y-6">
                {/* 1. MẶT TRƯỚC THIỆP */}
                {(cardSide === "both" || cardSide === "front") && (
                  <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <Heart size={14} className="fill-rose-400" /> Mặt Trước (Bìa Thiệp - First Impression)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const frontMatch = result.match(/## 🎴 1\. MẶT TRƯỚC[\s\S]*?(?=---|$)/);
                          if (frontMatch) handleCopySnippet(frontMatch[0], "front");
                        }}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                      >
                        {copiedSnippet === "front" ? <Check size={12} /> : <Copy size={12} />} Copy Mặt Trước
                      </button>
                    </div>

                    <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-6 text-center space-y-3 relative">
                      <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <Gift size={20} />
                      </div>
                      <div className="text-xs uppercase tracking-widest text-rose-400 font-bold">
                        {shopName ? shopName.toUpperCase() : "OFFICIAL STORE"}
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-white">
                        MÓN QUÀ NÀY ĐƯỢC CHUẨN BỊ DÀNH RIÊNG CHO BẠN
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto italic">
                        Cảm ơn bạn đã trao gửi niềm tin. Hãy mở ra để khám phá điều bất ngờ bên trong nhé!
                      </p>
                      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                        <Sparkles size={12} className="text-amber-400" />
                        <span>Chạm cảm xúc ngay khi vừa khui nắp hộp hàng</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MẶT SAU THIỆP */}
                {(cardSide === "both" || cardSide === "back") && (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 rounded-2xl p-6 space-y-5 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <HeartHandshake size={14} /> Mặt Sau (Nội Dung Tri Ân Đắc Nhân Tâm)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const backMatch = result.match(/## 💌 2\. MẶT SAU[\s\S]*?(?=---|$)/);
                          if (backMatch) handleCopySnippet(backMatch[0], "back");
                        }}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors"
                      >
                        {copiedSnippet === "back" ? <Check size={12} /> : <Copy size={12} />} Copy Mặt Sau
                      </button>
                    </div>

                    {/* Lưới 3 khối giá trị cốt lõi */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Khiên chắn 1 sao */}
                      <div className="bg-rose-950/30 border border-rose-700/40 rounded-xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                            <ShieldCheck size={14} className="text-rose-400" /> Khiên Chắn 1 Sao
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const shieldMatch = result.match(/### 🛡️ KHIÊN CHẮN 1 SAO[\s\S]*?(?=###|$)/);
                              if (shieldMatch) handleCopySnippet(shieldMatch[0], "shield");
                            }}
                            className="text-[10px] text-rose-400 hover:text-white"
                          >
                            {copiedSnippet === "shield" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Lời nhắc nhún nhường, đề nghị khách nhắn tin để được đổi mới 100% miễn phí trong 24h thay vì vội đánh giá 1 sao.
                        </p>
                      </div>

                      {/* Nam châm kéo review 5 sao */}
                      <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" /> Nam Châm 5 Sao
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const starMatch = result.match(/### ⭐ NAM CHÂM KÉO REVIEW 5 SAO[\s\S]*?(?=###|$)/);
                              if (starMatch) handleCopySnippet(starMatch[0], "star");
                            }}
                            className="text-[10px] text-amber-400 hover:text-white"
                          >
                            {copiedSnippet === "star" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Thúc đẩy khách hào hứng chụp ảnh / quay clip unboxing xinh xắn để nhận voucher & quà tri ân đơn tiếp theo.
                        </p>
                      </div>

                      {/* Cổng QR Zalo an toàn */}
                      <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3.5 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <QrCode size={14} className="text-emerald-400" /> Cổng QR An Toàn
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const qrMatch = result.match(/### 📲 CỔNG QUÉT QR[\s\S]*?(?=##|$)/);
                              if (qrMatch) handleCopySnippet(qrMatch[0], "qr");
                            }}
                            className="text-[10px] text-emerald-400 hover:text-white"
                          >
                            {copiedSnippet === "qr" ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Lời dẫn quét QR kích hoạt bảo hành điện tử chính hãng hoặc nhận quà thành viên, kéo khách về Zalo đúng luật sàn.
                        </p>
                      </div>
                    </div>

                    {/* Nội dung chi tiết được parse từ Markdown */}
                    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3 whitespace-pre-line leading-relaxed font-sans">
                      {result}
                    </div>
                  </div>
                )}

                {/* 3. MẸO IN ẤN & XƯỞNG IN */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Printer size={18} />
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <h4 className="font-bold text-white text-sm">Lời Khuyên In Ấn Tiết Kiệm Chi Phí:</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Nên đặt in chất liệu <strong className="text-slate-200">Giấy C300 cán màng mờ 2 mặt</strong> (chống nước, chống quăn mép khi dính sương bưu kiện). Khi in số lượng từ 1.000 tấm, chi phí tại xưởng in offset chỉ khoảng <strong className="text-emerald-400">350đ - 500đ/tấm</strong>, nhưng mang lại tỷ lệ giữ khách và cứu hàng trăm nghìn tiền hàng bị hoàn!
                    </p>
                  </div>
                </div>
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
                Điền thông tin shop bên trái và bấm &ldquo;Tạo Thư Cảm Ơn Ngay&rdquo; để xem bản thiết kế hoàn chỉnh.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default UnboxingCardOutput;
