"use client";

import { useState } from "react";
import {
  ArrowLeft,
  MessageSquareWarning,
  Sparkles,
  Star,
  RotateCcw,
  Tag,
  FileEdit,
  Sparkle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ReviewReplierOutput } from "@/components/tools/ReviewReplierOutput";
import { TextDots } from "@/components/ui/text-dots";
import { useToast } from "@/context/ToastContext";

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

  const [rating, setRating] = useState<string>("1 sao");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [reviewContent, setReviewContent] = useState("");
  const [note, setNote] = useState("");

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
            rating,
            issueType: selectedTag,
            note: note.trim(),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <MessageSquareWarning size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Xử Lý Khủng Hoảng
                </h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  FREE TOOL
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Viết phản hồi cho các đánh giá 1 sao một cách khéo léo, 'đắc nhân tâm' nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Nút thử nội dung mẫu */}
        <button
          onClick={handleUseSample}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkle size={13} className="text-amber-500 fill-amber-500" />
          <span>Thử mẫu 1 sao</span>
        </button>
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Form nhập đánh giá */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Form */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              <h2 className="font-bold text-slate-800 text-sm">Đánh giá cần phản hồi</h2>
            </div>
            {(reviewContent || selectedTag || note) && (
              <button
                onClick={handleResetForm}
                className="text-xs font-medium text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                title="Làm mới form"
              >
                <RotateCcw size={12} /> Làm mới
              </button>
            )}
          </div>

          {/* Form scrollable content */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {/* Chọn mức sao đánh giá */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mức sao của khách
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
                      ? "border-amber-500 bg-amber-50/70 text-amber-900 shadow-sm ring-1 ring-amber-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                  >
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vấn đề gặp phải (Quick Tags) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
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
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
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
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileEdit size={12} className="text-slate-400" />
                  Nội dung đánh giá của khách <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {reviewContent.length} ký tự
                </span>
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={5}
                placeholder="Dán nguyên văn câu chê bai hoặc nhận xét của khách vào đây...&#10;VD: Áo vải xấu quá, giao hàng chậm 5 ngày, nhắn tin không thèm rep, shop làm ăn lừa đảo..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed"
              ></textarea>
            </div>

            {/* Ghi chú thêm cho AI (Tùy chọn) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bối cảnh thêm của shop (Tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Hàng bị bưu tá làm ướt hộp, shop đồng ý đổi mới hoặc bù mã 50k..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Footer nút Tạo phản hồi */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={loading || !reviewContent.trim()}
              className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${loading || !reviewContent.trim()
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 active:scale-[0.99]"
                }`}
            >
              {loading ? (
                <TextDots dots={3} className="text-white text-sm font-semibold">
                  Đang phân tích tâm lý khách hàng
                </TextDots>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Phản Hồi Bằng AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Bảng kết quả phản hồi chuyên nghiệp */}
        <div className="lg:col-span-7 h-full min-h-0">
          <ReviewReplierOutput
            result={result}
            loading={loading}
            reviewContent={reviewContent}
            rating={rating}
            issueType={selectedTag}
          />
        </div>
      </div>
    </div>
  );
}
