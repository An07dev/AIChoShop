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
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ReviewReplierOutput } from "@/components/tools/ReviewReplierOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const QUICK_TAGS = [
  { label: "Giao sai màu / kích thước", sample: "Shop làm ăn chán quá, đặt size L áo đen giao size M áo trắng. Đề nghị hoàn tiền gấp!" },
  { label: "Hàng móp méo / vỡ hỏng", sample: "Hộp hàng nát bươm, sản phẩm bên trong bị nứt vỡ hết, đóng gói sơ sài cẩu thả." },
  { label: "Giao hàng quá chậm", sample: "Đặt cả tuần mới nhận được, lỡ hết cả việc đi ăn cưới. Thái độ giao hàng thì cộc cằn." },
  { label: "Không giống hình / mô tả", sample: "Hàng nhận về vải mỏng tang, chỉ thừa tùm lum, khác một trời một vực so với video quảng cáo!" },
  { label: "Thiếu quà / phụ kiện", sample: "Quảng cáo mua 1 tặng 1 kèm quà tặng mini mà mở ra chỉ có 1 chai, nhắn shop không thèm rep." },
  { label: "Hàng lỗi / kém chất lượng", sample: "Mới bật dùng được 10 phút máy đã bốc khói khét lẹt, hàng rởm đừng ai mua." },
];

const SAMPLE_RESULT = `## 1. Phong Cách Chân Thành & Cầu Thị (Khuyên Dùng)
- **Phản hồi công khai**: Dạ Shop xin chân thành cúi đầu xin lỗi anh/chị vì sự cố kiện hàng bị móp méo và nứt vỡ trong đơn hàng vừa qua ạ! Shop vô cùng thấu hiểu cảm giác thất vọng và khó chịu của mình khi háo hức chờ nhận hàng mà sản phẩm lại không còn nguyên vẹn. Dù đã bọc màng chống sốc 3 lớp nhưng do khâu trung chuyển bưu cục quá tải nên đã xảy ra sự việc đáng tiếc này. Shop xin nhận 100% trách nhiệm và gửi hỏa tốc 01 chai mới hoàn toàn miễn phí ngay trong ngày hôm nay. Nhân viên hỗ trợ đã gửi tin nhắn riêng cho mình rồi ạ, anh/chị mở mục Chat giúp Shop để xác nhận địa chỉ nhận hàng đền bù ngay nhé ạ!
- **Hành động hậu trường**: Vào mục Chat Shopee/TikTok nhắn ngay cho khách: "Dạ em chào anh/chị, em là Quản lý CSKH bên Shop. Em xin lỗi vì kiện hàng của mình bị vỡ do bưu tá quăng quật ạ. Em đã tạo ngay đơn hàng mới hỏa tốc kèm 1 phần quà mini đền bù gửi tới mình, bên em chịu 100% cước phí. Khi nhận được hàng ưng ý, em rất mong anh/chị hỗ trợ sửa lại đánh giá giúp shop em bớt điểm phạt với nha ạ."

## 2. Phong Cách Khéo Léo & Khách Quan (Lỗi Vận Chuyển / Ngoại Cảnh)
- **Phản hồi công khai**: Dạ chào anh/chị, Shop đã kiểm tra lại camera quy trình đóng gói trước khi bàn giao cho bưu cục thì sản phẩm vẫn còn nguyên tem niêm phong và bọc xốp bóng khí rất dày dặn ạ. Sự cố hộp móp rách và vỡ nứt này khả năng cao do quá trình phân loại và dồn tải nặng của bên đơn vị giao nhận. Tuy nhiên, quyền lợi của anh/chị luôn là ưu tiên số 1 của Shop, bên em cam kết không để khách hàng phải chịu bất kỳ thiệt thòi nào! Shop đã gửi tin nhắn riêng để hỗ trợ đổi mới 1-1 miễn phí hoặc hoàn tiền 100% lập tức, anh/chị kiểm tra tin nhắn giúp Shop nhé ạ!
- **Hành động hậu trường**: Chụp ảnh clip camera đóng gói nguyên vẹn gửi vào mục Chat cho khách xem để khách hiểu Shop không làm ăn cẩu thả, đồng thời tạo yêu cầu bồi thường hư hỏng trên hệ thống sàn đối với đơn vị vận chuyển. Sau đó gửi mã giảm giá 30k tri ân khách hàng vì sự kiên nhẫn.

## 3. Phong Cách Minh Bạch & Bảo Vệ Thương Hiệu (Khẳng Định Uy Tín)
- **Phản hồi công khai**: Dạ Shop Aicho kính chào anh/chị, Shop luôn cam kết 100% sản phẩm phân phối ra thị trường là hàng chính hãng có đầy đủ tem phụ và kiểm định chất lượng nghiêm ngặt trước khi xuất kho. Trường hợp hàng bị vỡ hỏng trong lúc giao vận là sự cố ngoài ý muốn mà không ai mong muốn, nhưng tôn chỉ bán hàng của bên em là bảo vệ trải nghiệm của khách hàng đến cùng. Đội ngũ CSKH đã liên hệ qua tin nhắn để kích hoạt chính sách Bảo Hành Đổi Trả Miễn Phí 100% trong 24h cho mình. Rất mong anh/chị kiểm tra hộp thư Chat để bên em giải quyết dứt điểm thỏa đáng nhất ạ!
- **Hành động hậu trường**: Chuẩn bị sẵn biên bản kiểm tra và hướng dẫn khách nhấn nút "Yêu cầu Trả hàng/Hoàn tiền" trên sàn (chọn lý do: Hàng vỡ do vận chuyển) để hệ thống sàn duyệt bồi thường nhanh chóng mà không làm giảm tỷ lệ vận hành của Shop.

## Lời khuyên vàng khi xử lý đánh giá
- Phản hồi trong vòng 1-2 giờ đầu tiên để ngăn chặn khách chia sẻ đánh giá tiêu cực lên các hội nhóm mạng xã hội.
- Tuyệt đối không tranh cãi gay gắt hay đổ lỗi cho khách hàng trên bình luận công khai để giữ hình ảnh thương hiệu văn minh trước hàng ngàn khách mua tiềm năng khác.
- Sau khi đã hỗ trợ khách đổi mới hoặc đền bù hài lòng qua tin nhắn riêng, hãy khéo léo nhờ khách chỉnh sửa lại đánh giá thành 5 sao.
- Báo cáo sàn can thiệp ngay nếu phát hiện đánh giá có dấu hiệu cạnh tranh không lành mạnh từ đối thủ hoặc dùng từ ngữ thô tục.`;

export default function ReviewReplier() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

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

  // Dán nhanh từ bộ nhớ tạm
  const handlePasteReview = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setReviewContent(text);
      }
    } catch {
      // Clipboard denied or unsupported
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
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
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
    setMobileTab("result");

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
      {/* Modals chặn quyền nếu có */}
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 pb-3 space-y-2 sm:space-y-3">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs uppercase tracking-wider">
              <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
              FREE
            </span>
            <AiUsageBadge tool="review-replier" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Xử Lý Khiếu Nại & Khủng Hoảng</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
                <MessageSquareWarning size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Xử Lý Khủng Hoảng
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                    FREE TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Biến đánh giá 1-2 sao thành cơ hội bán hàng, xoa dịu khách hàng và bảo vệ uy tín shop.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="review-replier" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Sparkles size={14} /> Dữ Liệu Mẫu
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <RotateCcw size={14} /> Xóa Form
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <MobileToolTabs
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        hasResult={Boolean(result)}
        loading={loading}
        resultLabel="Kịch Bản Phản Hồi"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP ĐÁNH GIÁ (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs">
                    <MessageSquareWarning size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Khiếu Nại
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold cursor-pointer hover:bg-amber-100 transition active:scale-95"
                  >
                    <Sparkles size={10} /> Mẫu
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    3 Phương Án
                  </span>
                </div>
              </div>

              {/* 1. Mức sao của khách */}
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

              {/* 2. Vấn đề gặp phải (Quick Tags) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag size={12} className="text-amber-500" />
                    <span>Vấn đề gặp phải (Chọn nhanh)</span>
                  </span>
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={() => setSelectedTag("")}
                      className="text-[10px] text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  )}
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
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Nội dung khách chê (Textarea) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileEdit size={12} className="text-amber-500" />
                    <span>Nội dung đánh giá của khách</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {reviewContent && (
                      <button
                        type="button"
                        onClick={() => setReviewContent("")}
                        className="text-[10px] text-slate-400 hover:text-rose-500 transition cursor-pointer flex items-center gap-1 font-medium"
                      >
                        <Trash2 size={11} /> Xóa
                      </button>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {reviewContent.trim() ? `${reviewContent.trim().length} ký tự` : "Shopee / TikTok"}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={4}
                    placeholder="Dán nguyên văn câu chê bai hoặc nhận xét của khách vào đây...&#10;VD: Áo vải xấu quá, giao hàng chậm 5 ngày, nhắn tin không thèm rep, shop làm ăn lừa đảo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all resize-none placeholder:text-slate-400 leading-relaxed shadow-2xs"
                  />
                  {!reviewContent && (
                    <button
                      type="button"
                      onClick={handlePasteReview}
                      className="absolute right-2.5 bottom-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer shadow-xs active:scale-95"
                      title="Dán nhanh từ clipboard"
                    >
                      <ClipboardPaste size={12} /> Dán nhanh
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Ghi chú thêm cho AI (Tùy chọn) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bối cảnh thêm của shop (Tùy chọn)
                  </label>
                  <span className="text-[10px] text-slate-400">Hướng giải quyết</span>
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Đã đóng gói cẩn thận, đồng ý đổi mới hỏa tốc hoặc bù mã 50k..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Nút Submit */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !reviewContent.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
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
