"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MessageSquareWarning,
  Sparkles,
  Star,
  RotateCcw,
  Tag,
  FileEdit,
  Send,
  ClipboardPaste,
  Trash2,
  XCircle,
  Store,
  Package,
  Gift,
  Truck,
  ShieldAlert,
  MessageCircle,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ReviewReplierOutput } from "@/components/tools/ReviewReplierOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import {
  SAMPLE_REVIEW_REPLIER_RESULT,
  parseReviewReplierResult,
} from "@/lib/review-replier/contract";

const DRAFT_STORAGE_KEY = "seller_ai_review_replier_draft_v2";

export interface CrisisTag {
  label: string;
  category: "shipping" | "quality" | "service";
  sample: string;
}

export const CRISIS_TAG_GROUPS = [
  {
    title: "🚚 Vận Chuyển & Đóng Gói",
    tags: [
      {
        label: "Hàng móp méo / vỡ nát",
        category: "shipping",
        sample: "Hộp hàng nát bươm, sản phẩm bên trong bị nứt vỡ hết, đóng gói sơ sài cẩu thả!",
      },
      {
        label: "Giao hàng quá chậm",
        category: "shipping",
        sample: "Đặt cả tuần mới nhận được, lỡ hết cả việc đi ăn cưới. Thái độ giao hàng thì cộc cằn.",
      },
      {
        label: "Giao sai phân loại / màu / size",
        category: "shipping",
        sample: "Shop làm ăn chán quá, đặt size L áo đen giao size M áo trắng. Đề nghị hoàn tiền gấp!",
      },
      {
        label: "Thiếu quà tặng / phụ kiện",
        category: "shipping",
        sample: "Quảng cáo mua 1 tặng 1 kèm quà tặng mini mà mở ra chỉ có 1 chai, nhắn shop không thèm rep.",
      },
    ],
  },
  {
    title: "🔍 Chất Lượng & Mô Tả",
    tags: [
      {
        label: "Hàng lỗi / không hoạt động",
        category: "quality",
        sample: "Mới bật dùng được 10 phút máy đã bốc khói khét lẹt, hàng rởm đừng ai mua.",
      },
      {
        label: "Không giống hình / mô tả",
        category: "quality",
        sample: "Hàng nhận về vải mỏng tang, chỉ thừa tùm lum, khác một trời một vực so với video quảng cáo!",
      },
      {
        label: "Nghi vấn hàng giả / nhái",
        category: "quality",
        sample: "Mã vạch quét không ra, mùi hắc nồng nặc khác hẳn chai trước mình mua ở Store, nghi hàng fake!",
      },
      {
        label: "Khách dùng sai cách đổ lỗi",
        category: "quality",
        sample: "Cắm nguồn không lên, bảo sạc nhanh mà sạc mãi không đầy pin, đồ lừa đảo!",
      },
    ],
  },
  {
    title: "💬 Dịch Vụ & Đối Ngoại",
    tags: [
      {
        label: "Shop chậm rep / bỏ rơi khách",
        category: "service",
        sample: "Hàng có vấn đề nhắn tin từ sáng tới tối không thấy shop trả lời, vô trách nhiệm!",
      },
      {
        label: "Tư vấn cộc cằn / thiếu nhiệt tình",
        category: "service",
        sample: "Hỏi tư vấn kích thước thì trả lời cộc lốc như muốn đuổi khách đi, quá thất vọng.",
      },
      {
        label: "Đe dọa bóc phốt mạng xã hội",
        category: "service",
        sample: "Làm ăn thế này tôi sẽ quay video đăng lên TikTok cho cộng đồng biết mặt shop lừa đảo!",
      },
      {
        label: "Nghi vấn đối thủ chơi xấu / ảo",
        category: "service",
        sample: "Đánh giá 1 sao vô căn cứ, không có ảnh video, tài khoản clone nghi đối thủ phá hoại.",
      },
    ],
  },
];

export const COMPENSATION_CHIPS = [
  "📦 Đổi mới 1-1 miễn phí hỏa tốc",
  "💰 Hoàn tiền 100% không cần trả hàng",
  "🎟️ Tặng Voucher giảm giá 50K",
  "🎁 Tặng quà đặc biệt vào đơn sau",
];

const SAMPLE_INPUTS = {
  platform: "shopee",
  shopName: "Aicho Tech Official Store",
  productName: "Củ sạc nhanh GaN 65W 3 cổng Type-C & Cáp dù siêu bền",
  rating: "1 sao",
  selectedTag: "Hàng móp méo / vỡ nát",
  reviewContent: "Hàng nhận về hộp bị móp méo rách tả tơi, củ sạc bên trong bị nứt vỏ. Nhắn tin hỗ trợ nửa ngày chưa thấy ai trả lời, làm ăn tắc trách quá!",
  compensation: "📦 Đổi mới 1-1 miễn phí hỏa tốc",
  note: "Shop đã kiểm tra camera lúc đóng gói còn nguyên vẹn, nghi do đơn vị bưu cục dồn tải ném hàng.",
};

export default function ReviewReplier() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Form Inputs
  const [platform, setPlatform] = useState<string>("shopee");
  const [shopName, setShopName] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [rating, setRating] = useState<string>("1 sao");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [reviewContent, setReviewContent] = useState("");
  const [compensation, setCompensation] = useState<string>("");
  const [note, setNote] = useState("");

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  // 1. Khôi phục nháp từ LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.platform) setPlatform(parsed.platform);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.productName) setProductName(parsed.productName);
        if (parsed.rating) setRating(parsed.rating);
        if (parsed.selectedTag) setSelectedTag(parsed.selectedTag);
        if (parsed.reviewContent) setReviewContent(parsed.reviewContent);
        if (parsed.compensation) setCompensation(parsed.compensation);
        if (parsed.note) setNote(parsed.note);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      // Bỏ qua lỗi parsing nháp
    }
  }, []);

  // 2. Tự động lưu nháp sau 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            platform,
            shopName,
            productName,
            rating,
            selectedTag,
            reviewContent,
            compensation,
            note,
            result,
          })
        );
      } catch {
        // Fallback lưu inputs nếu quota đầy
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              platform,
              shopName,
              productName,
              rating,
              selectedTag,
              reviewContent,
              compensation,
              note,
              result: "",
            })
          );
        } catch { }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [platform, shopName, productName, rating, selectedTag, reviewContent, compensation, note, result]);

  // Clean-up timer khi unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

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

  const handleSelectTag = (item: { label: string; sample: string }) => {
    if (selectedTag === item.label) {
      setSelectedTag("");
    } else {
      setSelectedTag(item.label);
      if (!reviewContent.trim()) {
        setReviewContent(item.sample);
      }
    }
  };

  // Dán nhanh từ bộ nhớ tạm
  const handlePasteReview = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setReviewContent(text.trim());
        showSuccess("Đã dán nội dung từ bộ nhớ tạm!", "Dán Nhanh");
      } else {
        showWarning("Bộ nhớ tạm hiện đang trống!", "Dán Nhanh");
      }
    } catch {
      showWarning("Không thể đọc clipboard tự động. Vui lòng bấm Ctrl+V để dán trực tiếp.", "Bộ Nhớ Tạm");
    }
  };

  const handleResetForm = () => {
    if (shopName || productName || reviewContent || result) {
      const confirmed = window.confirm("Bạn có chắc chắn muốn làm mới toàn bộ biểu mẫu không?");
      if (!confirmed) return;
    }
    setPlatform("shopee");
    setShopName("");
    setProductName("");
    setRating("1 sao");
    setSelectedTag("");
    setReviewContent("");
    setCompensation("");
    setNote("");
    setResult("");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch { }
    showSuccess("Đã làm mới biểu mẫu!", "Làm Mới");
  };

  const handleUseSample = () => {
    setPlatform(SAMPLE_INPUTS.platform);
    setShopName(SAMPLE_INPUTS.shopName);
    setProductName(SAMPLE_INPUTS.productName);
    setRating(SAMPLE_INPUTS.rating);
    setSelectedTag(SAMPLE_INPUTS.selectedTag);
    setReviewContent(SAMPLE_INPUTS.reviewContent);
    setCompensation(SAMPLE_INPUTS.compensation);
    setNote(SAMPLE_INPUTS.note);
    setResult(SAMPLE_REVIEW_REPLIER_RESULT);
    setMobileTab("result");
    showSuccess("Đã điền dữ liệu mẫu thực chiến!", "Dữ Liệu Mẫu");
  };

  // Nạp lại kết quả từ lịch sử và điền ngược lại form
  const handleSelectHistoryOutput = (pastOutput: string) => {
    if (!pastOutput) return;
    setResult(pastOutput);
    setMobileTab("result");

    try {
      const parsed = parseReviewReplierResult(pastOutput);
      if (parsed) {
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.productName) setProductName(parsed.productName);
        if (parsed.platform) setPlatform(parsed.platform);
        if (parsed.rating) setRating(parsed.rating);
      }
    } catch { }

    showSuccess("Đã tải lại kết quả từ lịch sử!", "Lịch Sử");
  };

  const handleGenerate = async () => {
    if (loading || isSubmittingRef.current) return;

    // 1. Kiểm tra kết nối mạng
    if (typeof window !== "undefined" && !navigator.onLine) {
      showAiError({ error: "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng wifi/4G và thử lại!" });
      return;
    }

    // 2. Kiểm tra quyền truy cập công cụ
    const hasAccess = await checkAccess("review-replier", false); // Free Tool
    if (!hasAccess) return;

    // 3. Tiền kiểm tra dữ liệu đầu vào (Pre-flight validation)
    const trimmedReview = reviewContent.trim();
    if (!trimmedReview) {
      showWarning("Vui lòng nhập hoặc dán nội dung đánh giá của khách hàng!", "Thiếu Đánh Giá");
      return;
    }

    if (trimmedReview.length < 5) {
      showWarning("Nội dung đánh giá cần có tối thiểu 5 ký tự để AI có đủ dữ liệu bóc tách tâm lý khách hàng!", "Đánh Giá Quá Ngắn");
      return;
    }

    if (trimmedReview.length > 2500) {
      showWarning("Nội dung đánh giá quá dài (tối đa 2500 ký tự). Vui lòng rút gọn những đoạn không liên quan!", "Đánh Giá Quá Dài");
      return;
    }

    // 4. Khóa request chống click đúp & kích hoạt luồng xử lý
    isSubmittingRef.current = true;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setElapsedSeconds(0);
    setResult("");
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu xử lý khủng hoảng đã quá thời gian phản hồi (120s). Vui lòng thử lại sau.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "review-replier",
          inputs: {
            platform,
            shopName: shopName.trim() || "Gian Hàng Chính Hãng",
            productName: productName.trim() || "Sản phẩm đánh giá",
            rating,
            issueType: selectedTag || "Khiếu nại sản phẩm/vận chuyển",
            reviewContent: trimmedReview,
            compensation: compensation.trim(),
            note: note.trim(),
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setResult(data.data);
        setRefreshTrigger((prev) => prev + 1);
        showSuccess("Đã tạo trọn bộ 3 kịch bản xử lý khủng hoảng thành công!", "Hoàn Tất");
      } else {
        showAiError(data, "Có lỗi xảy ra khi tạo kịch bản xử lý");
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình tạo kịch bản theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      showAiError({ error: "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc token." });
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto lg:flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-3">
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
            <AiUsageBadge
              tool="review-replier"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleSelectHistoryOutput}
              historyOnly
            />
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

            {/* Title Row: Icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
                <MessageSquareWarning size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Xử Lý Khủng Hoảng
                  </h1>
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
                  Bảo vệ uy tín gian hàng: Chẩn đoán rủi ro thuật toán, phản hồi công khai lịch thiệp & kịch bản inbox đắc nhân tâm.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge
              tool="review-replier"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleSelectHistoryOutput}
            />
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
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-28 lg:pb-2">
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Chuẩn Sàn TMĐT
                  </span>
                </div>
              </div>

              {/* 1. SÀN TMĐT (NỀN TẢNG) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sàn TMĐT Phát Sinh Đánh Giá <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "shopee", name: "Shopee", icon: "🛒", activeClass: "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400" },
                    { id: "tiktok", name: "TikTok Shop", icon: "🎵", activeClass: "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400" },
                    { id: "lazada", name: "Lazada", icon: "🔷", activeClass: "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400" },
                    { id: "other", name: "Đa Kênh", icon: "🌐", activeClass: "bg-slate-100 dark:bg-slate-800 border-slate-600 text-slate-800 dark:text-slate-200" },
                  ].map((p) => {
                    const isSelected = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${isSelected
                          ? `${p.activeClass} shadow-xs font-extrabold ring-1 ring-amber-500/20`
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span className="text-[11px] truncate w-full text-center">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. TÊN GIAN HÀNG & TÊN SẢN PHẨM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Store size={12} className="text-amber-500" />
                    <span>Tên Gian Hàng</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: Aicho Tech Official..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Package size={12} className="text-amber-500" />
                    <span>Tên Sản Phẩm Bị Khiếu Nại</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Củ sạc GaN 65W..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 3. MỨC SAO CỦA KHÁCH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mức Sao Của Khách Hàng <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "1 sao", label: "1 Sao", desc: "Rất bức xúc", stars: 1, color: "text-rose-500" },
                    { value: "2 sao", label: "2 Sao", desc: "Thất vọng nặng", stars: 2, color: "text-amber-500" },
                    { value: "3 sao", label: "3 Sao", desc: "Chưa ưng ý", stars: 3, color: "text-amber-400" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRating(item.value)}
                      className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${rating === item.value
                        ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">
                        {Array.from({ length: item.stars }).map((_, i) => (
                          <Star key={i} size={12} className="text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>


              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileEdit size={12} className="text-amber-500" />
                    <span>Nội Dung Đánh Giá Của Khách</span>
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
                    placeholder="Dán nguyên văn câu chê bai hoặc nhận xét của khách vào đây...&#10;VD: Hàng nhận về hộp nát, chai serum bị vỡ rò hết ra ngoài, nhắn tin shop nửa ngày không rep, làm ăn lừa đảo!"
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


              {/* 7. BỐI CẢNH THÊM CỦA SHOP (GHI CHÚ) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bối Cảnh Thêm Từ Shop (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Đã check camera đóng gói nguyên seal, nghi bưu cục quăng quật vỡ hàng..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Nút Submit + Hủy (Desktop & Tablet) */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !reviewContent.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <MessageSquareWarning size={16} className="animate-spin text-white" />
                      <span>Đang Phân Tích ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Phản Hồi Đắc Nhân Tâm Bằng AI
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Hủy yêu cầu"
                  >
                    <XCircle size={16} />
                    <span>Hủy</span>
                  </button>
                )}
              </div>

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
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-24 lg:pb-0`}>
          <ReviewReplierOutput
            result={result}
            loading={loading}
            reviewContent={reviewContent}
            rating={rating}
            issueType={selectedTag}
            shopName={shopName}
            productName={productName}
            platform={platform}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* Floating Action Bar trên Mobile (cho phép gửi tin 1 chạm ở tab Form) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg">
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !reviewContent.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <>
                  <MessageSquareWarning size={16} className="animate-spin text-white" />
                  <span>Đang Phân Tích ({elapsedSeconds}s)...</span>
                </>
              ) : (
                <>
                  <Send size={16} /> Phản Hồi Đắc Nhân Tâm
                </>
              )}
            </button>
            {loading && (
              <button
                type="button"
                onClick={handleCancel}
                className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30 font-bold transition-all cursor-pointer active:scale-95"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
