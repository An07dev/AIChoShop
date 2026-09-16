"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MessageSquareWarning,
  Sparkles,
  Star,
  RotateCcw,
  Tag,
  FileEdit,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ReviewReplierOutput } from "@/components/tools/ReviewReplierOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const QUICK_TAGS = [
  { label: "Giao sai màu / kích thước", sample: "Shop làm ăn chán quá, đặt size L áo đen giao size M áo trắng. Đề nghị hoàn tiền gấp!" },
  { label: "Hàng móp méo / vỡ hỏng", sample: "Hộp hàng nát bươm, sản phẩm bên trong bị nứt vỡ hết, đóng gói sơ sài cẩu thả." },
  { label: "Giao hàng quá chậm", sample: "Đặt cả tuần mới nhận được, lỡ hết cả việc đi ăn cưới. Thái độ giao hàng thì cộc cằn." },
  { label: "Không giống hình / mô tả", sample: "Hàng nhận về vải mỏng tang, chỉ thừa tùm lum, khác một trời một vực so với video quảng cáo!" },
  { label: "Thiếu quà / phụ kiện", sample: "Quảng cáo mua 1 tặng 1 kèm quà tặng mini mà mở ra chỉ có 1 chai, nhắn shop không thèm rep." },
  { label: "Hàng lỗi / kém chất lượng", sample: "Mới bật dùng được 10 phút máy đã bốc khói khét lẹt, hàng rởm đừng ai mua." },
];

export default function ReviewReplier() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [rating, setRating] = useState<string>("1 sao");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [reviewContent, setReviewContent] = useState("");
  const [note, setNote] = useState("");

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.dailyFreeLimit !== "undefined") {
          setUserQuota({
            isLogged: !!data.isLogged,
            isVIP: !!data.isVIP,
            remainingFree: data.remainingFree,
            dailyFreeLimit: data.dailyFreeLimit || 12,
          });
        }
      })
      .catch(() => { });
  }, [refreshTrigger]);

  const handleSelectTag = (item: typeof QUICK_TAGS[0]) => {
    setSelectedTag(item.label);
    if (!reviewContent) {
      setReviewContent(item.sample);
    }
  };

  const handleResetForm = () => {
    setRating("1 sao");
    setSelectedTag("");
    setReviewContent("");
    setNote("");
    setResult("");
  };

  const handleUseSample = () => {
    setRating("1 sao");
    setSelectedTag("Hàng móp méo / vỡ hỏng");
    setReviewContent("Hàng nhận về hộp bị móp méo rách tả tơi, chai bên trong bị nứt chảy hết ra ngoài. Nhắn tin hỗ trợ nửa ngày chưa thấy ai trả lời, làm ăn tắc trách quá!");
    setNote("Shop đã kiểm tra camera lúc đóng gói còn nguyên vẹn, nghi do đơn vị bưu cục ném hàng.");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("review-replier", false); // Free Tool
    if (!hasAccess) return;

    if (!reviewContent.trim()) {
      showWarning("Vui lòng dán nội dung đánh giá của khách hàng!", "Thiếu Đánh Giá");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "review-replier",
          inputs: {
            reviewContent: reviewContent.trim(),
            reviewText: reviewContent.trim(),
            rating,
            issueType: selectedTag,
            note: note.trim(),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo phản hồi đánh giá");
      }
    } catch (error) {
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden pb-3">
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Xử Lý Khiếu Nại & Khủng Hoảng</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Xử Lý Khủng Hoảng
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs uppercase tracking-wider">
              <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
              FREE TOOL
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Biến đánh giá tiêu cực thành cơ hội bán hàng, xoa dịu khách hàng và bảo vệ uy tín shop.
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="review-replier" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles size={14} /> Thử Mẫu 1 Sao
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} /> Xóa Form
          </button>
        </div>
      </div>

      {/* Grid 2 Cột: Cuộn độc lập */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP ĐÁNH GIÁ (cuộn độc lập) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Mức sao của khách */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mức sao của khách <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "1 sao", label: "1 Sao", desc: "Rất bức xúc", stars: 1 },
                    { value: "2 sao", label: "2 Sao", desc: "Thất vọng", stars: 2 },
                    { value: "3 sao", label: "3 Sao", desc: "Chưa ưng ý", stars: 3 },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRating(item.value)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${rating === item.value
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        {Array.from({ length: item.stars }).map((_, i) => (
                          <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vấn đề gặp phải (Quick Tags) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Tag size={12} className="text-slate-400" />
                  Vấn đề gặp phải (Chọn nhanh)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((item, idx) => {
                    const isSelected = selectedTag === item.label;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTag(item)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nội dung khách chê (Textarea) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileEdit size={12} className="text-slate-400" />
                    Nội dung đánh giá của khách <span className="text-rose-500">*</span>
                  </label>
                </div>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={4}
                  placeholder="Dán nguyên văn câu chê bai hoặc nhận xét của khách vào đây...&#10;VD: Áo vải xấu quá, giao hàng chậm 5 ngày, nhắn tin không thèm rep, shop làm ăn lừa đảo..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Ghi chú thêm cho AI (Tùy chọn) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bối cảnh thêm của shop (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Hàng bị bưu tá làm ướt hộp, shop đồng ý đổi mới hoặc bù mã 50k..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Nút Submit */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !reviewContent.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <MessageSquareWarning size={16} className="animate-spin" /> Đang Phân Tích & Viết Kịch Bản Phản Hồi...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Phản Hồi Đắc Nhân Tâm Bằng AI
                  </>
                )}
              </button>

              {/* Quota info */}
              <p aria-live="polite" className="text-[10px] text-center text-slate-400">
                {userQuota?.isLogged ? (
                  userQuota.isVIP ? (
                    <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                      <span>👑</span> VIP · Không giới hạn
                    </span>
                  ) : (
                    <span>
                      ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Nâng cấp VIP</Link>
                    </span>
                  )
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ (cuộn độc lập) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <ReviewReplierOutput
            result={result}
            loading={loading}
            reviewContent={reviewContent}
            rating={rating}
            issueType={selectedTag}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
