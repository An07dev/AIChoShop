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

  // Khóa cuộn trang chính trên desktop, chỉ cho phép cuộn nội bộ phần input và output
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        main.style.overflow = "hidden";
      } else {
        main.style.overflow = "auto";
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      main.style.overflow = "";
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
      .catch(() => {});
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
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
      <GateModals />

      {/* 1. Header & Breadcrumb thu gọn */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-amber-600 transition-colors flex items-center gap-1">
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
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wide border border-amber-200 dark:border-amber-800">
              Phản Hồi Đánh Giá 1-3 Sao
            </span>
          </h1>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex items-center gap-2 shrink-0">
          <AiUsageBadge tool="review-replier" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
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

      {/* 2. Khu vực thao tác chính 2 cột: Cả 2 cuộn độc lập, trang ngoài không cuộn */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* CỘT TRÁI: FORM NHẬP ĐÁNH GIÁ */}
        <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Header cột trái */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquareWarning size={15} className="text-amber-500" />
              <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Đánh Giá Cần Xử Lý</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">
              {reviewContent.length} ký tự
            </span>
          </div>

          {/* Form inputs cuộn nội bộ */}
          <div className="p-3.5 sm:p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain space-y-3.5">
            {/* 3 Thẻ tóm tắt tính năng */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <Star size={13} className="text-amber-500 shrink-0 fill-amber-500" />
                  3 Style
                </div>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Chân thành, Khéo léo</p>
              </div>
              <div className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  <HeartHandshake size={13} className="text-emerald-500 shrink-0" />
                  Xoa Dịu
                </div>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Giảm bức xúc ngay</p>
              </div>
              <div className="p-2 rounded-xl border border-orange-200/70 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 dark:text-orange-300">
                  <ShieldCheck size={13} className="text-orange-500 shrink-0" />
                  Cứu Uy Tín
                </div>
                <p className="text-[10px] text-orange-700/80 dark:text-orange-400/80 mt-0.5">Thuyết phục khách mới</p>
              </div>
            </div>

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
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      rating === item.value
                        ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/20"
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
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
              ></textarea>
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Tips Card */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500" /> Bí quyết phản hồi đánh giá 1 sao thành công:
              </p>
              <p>• <strong>Tốc độ là vàng:</strong> Phản hồi trong 1-2h giúp giảm 80% tỷ lệ khách giữ nguyên đánh giá xấu.</p>
              <p>• <strong>Luôn đưa giải pháp:</strong> Nhận lỗi cầu thị & đề xuất đền bù (đổi mới/voucher) trước khi phân trần lý do.</p>
            </div>
          </div>

          {/* Sticky footer submit button */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !reviewContent.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <MessageSquareWarning size={16} className="animate-spin" /> Đang Phân Tích & Viết Kịch Bản Phản Hồi...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Phản Hồi Đắc Nhân Tâm Bằng AI
                </>
              )}
            </button>

            {/* Thông tin quota tài khoản */}
            <p aria-live="polite" className="text-[10px] text-center text-slate-400">
              {userQuota?.isLogged ? (
                userQuota.isVIP ? (
                  <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                    <span>👑</span> VIP · Không giới hạn
                  </span>
                ) : (
                  <span>
                    ⚡ Còn <strong className={userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"}>{userQuota.remainingFree ?? 0}</strong>/{userQuota.dailyFreeLimit} lượt hôm nay · <Link href="/profile#pricing-section" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">Nâng cấp VIP</Link>
                  </span>
                )
              ) : (
                <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
              )}
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ */}
        <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
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
