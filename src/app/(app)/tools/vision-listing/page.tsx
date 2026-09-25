"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  X,
  Send,
  Crown,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { VisionListingOutput } from "@/components/tools/VisionListingOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { compressImageForAi } from "@/lib/image-compress";

const PLATFORMS = [
  "Shopee & TikTok Shop",
  "Shopee Mall / Yêu thích",
  "TikTok Shop",
  "Lazada",
];

const SAMPLE_HINT = {
  category: "Gia dụng nhà bếp - Lò vi sóng",
  audience: "Hộ gia đình 2-5 người, người đi làm bận rộn cần nấu nướng nhanh",
  note: "Tặng kèm đĩa thủy tinh cường lực và nắp đậy chống văng dầu mỡ, bảo hành 12 tháng",
  mockImage:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%230f172a'/><rect x='40' y='60' width='320' height='260' rx='16' fill='%231e293b' stroke='%23334155' stroke-width='4'/><rect x='60' y='90' width='200' height='200' rx='8' fill='%230f172a' stroke='%23475569' stroke-width='2'/><circle cx='160' cy='190' r='50' fill='%231e293b' stroke='%2310b981' stroke-dasharray='6,6'/><rect x='280' y='100' width='60' height='30' rx='4' fill='%230284c7'/><circle cx='310' cy='180' r='18' fill='%23334155'/><circle cx='310' cy='240' r='18' fill='%23334155'/><text x='50%25' y='92%25' dominant-baseline='middle' text-anchor='middle' font-size='13' fill='%2338bdf8' font-weight='bold' font-family='sans-serif'>LÒ VI SÓNG INOX 20L TOSHIBA</text></svg>",
};

const SAMPLE_OUTPUT = JSON.stringify(
  {
    listingScore: {
      score: 98,
      grade: "XUẤT SẮC",
      checklist: [
        { item: "Tiêu đề chuẩn công thức SEO Shopee & TikTok", passed: true },
        { item: "Đầy đủ 100% thuộc tính bắt buộc của Seller Center", passed: true },
        { item: "Mô tả AIDA có Hook 3 giây chuyển đổi cao", passed: true },
        { item: "Kiểm duyệt an toàn: 0% vi phạm từ cấm sàn", passed: true },
        { item: "Gợi ý phân loại SKU phễu giá tăng AOV", passed: true }
      ],
      safetyPassed: true
    },
    titles: [
      {
        id: 1,
        platform: "Shopee & Lazada",
        style: "SEO Tìm Kiếm Tự Nhiên (Search-Driven)",
        targetAudience: "Khách gõ tìm kiếm có nhu cầu mua thực tế",
        title: "Lò Vi Sóng Cơ 20L TOSHIBA Thép Không Gỉ - Kháng Khuẩn, Chống Tràn, Rã Đông Siêu Tốc (Bảo Hành 12 Tháng)",
        hookKeywords: "lò vi sóng toshiba 20l"
      },
      {
        id: 2,
        platform: "TikTok Shop",
        style: "Kéo Click & Chốt Cảm Xúc (Impulse-Driven)",
        targetAudience: "Khách lướt video/live chốt đơn theo cảm xúc & ưu đãi",
        title: "🔥 Lò Vi Sóng Inox 20L Toshiba Nấu Nướng Siêu Nhanh - TẶNG KÈM Bộ Đĩa Thủy Tinh & Nắp Đậy Chống Văng!",
        hookKeywords: "lò vi sóng giá rẻ quà tặng khủng"
      },
      {
        id: 3,
        platform: "Đấu Thầu Ads",
        style: "Tối Ưu Quảng Cáo Tìm Kiếm (High CTR & Low CPC)",
        targetAudience: "Khách tìm kiếm từ khóa ngách chạy ads",
        title: "Lò Vi Sóng Toshiba 20L Chính Hãng - Rã Đông Nhanh, Tiết Kiệm Điện, Chống Tràn",
        hookKeywords: "lò vi sóng toshiba chính hãng"
      }
    ],
    sellerAttributes: [
      { name: "Loại sản phẩm", value: "Lò vi sóng cơ", requiredByPlatform: true },
      { name: "Dung tích", value: "20 Lít", requiredByPlatform: true },
      { name: "Chất liệu khoang lò", value: "Thép không gỉ (Inox 304) tráng men chống dính", requiredByPlatform: true },
      { name: "Công suất vi sóng", value: "800W - 5 mức điều chỉnh nhiệt", requiredByPlatform: true },
      { name: "Màu sắc", value: "Bạc Ánh Kim / Đen Nhám", requiredByPlatform: true },
      { name: "Xuất xứ thương hiệu", value: "Nhật Bản (Lắp ráp chính hãng)", requiredByPlatform: true },
      { name: "Bảo hành", value: "12 Tháng Lỗi 1 Đổi 1", requiredByPlatform: true },
      { name: "Tính năng an toàn", value: "Chống tràn, tự ngắt khi quá nhiệt, khóa cơ trẻ em", requiredByPlatform: false },
      { name: "Đối tượng phù hợp", value: "Gia đình 2-5 người, sinh viên, người đi làm", requiredByPlatform: false }
    ],
    skuSuggestions: [
      {
        groupName: "Phân Loại Màu Sắc",
        options: ["Bạc Titan Sang Trọng", "Đen Nhám Chống Bám Vân Tay"]
      },
      {
        groupName: "Combo Ưu Đãi Tăng Giá Trị Đơn (AOV)",
        options: [
          "Bản Tiêu Chuẩn (Thân máy + Đĩa quay)",
          "Bản Full Combo (+ Bộ Đĩa Thủy Tinh Chịu Nhiệt + Nắp Chống Văng)",
          "Combo Quà Tặng (+ Khay Nướng Silicon Cao Cấp)"
        ]
      }
    ],
    aidaDescription: {
      attentionHook: "Nấu nướng bận rộn mỗi tối làm bạn mệt mỏi? Thức ăn rã đông mất cả tiếng đồng hồ lại còn bị khô cứng? Đừng để căn bếp trở thành gánh nặng sau ngày dài làm việc!",
      uspPoint: "Lò vi sóng Toshiba 20L thế hệ mới ứng dụng công nghệ sóng viba 3D xoay chiều, giúp thức ăn nóng đều từ trong ra ngoài chỉ sau 60 giây mà không làm mất đi vitamin dinh dưỡng.",
      featureBullets: [
        {
          feature: "Khoang lò Inox tráng men Nano",
          benefit: "Chống bám dầu mỡ tuyệt đối, chỉ cần dùng khăn ẩm lau nhẹ 5 giây là sạch bóng."
        },
        {
          feature: "5 Mức công suất linh hoạt (lên tới 800W)",
          benefit: "Tùy biến từ hâm nóng canh, rã đông thịt cá mềm mọng, đến nướng bánh mì giòn tan."
        },
        {
          feature: "Nút vặn cơ bền bỉ song ngữ",
          benefit: "Dễ dàng thao tác cho cả người lớn tuổi và trẻ nhỏ trong nhà."
        }
      ],
      usageAndSize: [
        "Kích thước sản phẩm: 44cm x 33cm x 26cm (Đặt vừa vặn mọi kệ bếp gia đình)",
        "Trọng lượng: 10.5 kg - Chân đế cao su chống trơn trượt tuyệt đối",
        "Hướng dẫn: Cắm nguồn điện 220V ổn định, vệ sinh định kỳ bằng nước ấm và chanh"
      ],
      guarantees: [
        "Cam kết 100% hàng chính hãng mới nguyên seal đập hộp",
        "Bảo hành điện tử 12 tháng trên toàn quốc, lỗi 1 đổi 1 trong 30 ngày đầu",
        "Đóng gói 3 lớp xốp chống va đập, bảo hiểm vỡ hỏng hoàn tiền 100%"
      ],
      ctaCloser: "👉 BẤM [MUA NGAY] HOẶC [THÊM VÀO GIỎ HÀNG] ĐỂ NHẬN NGAY VOUCHER GIẢM 10% VÀ TRỌN BỘ QUÀ TẶNG ĐỘC QUYỀN HÔM NAY!"
    },
    seoTags: {
      coreKeywords: [
        "lò vi sóng toshiba",
        "lò vi sóng 20l",
        "lò vi sóng giá rẻ",
        "lò vi sóng không nướng"
      ],
      longtailKeywords: [
        "lò vi sóng toshiba 20l chống tràn",
        "lò vi sóng rã đông nhanh tiết kiệm điện",
        "lò vi sóng cho người già dễ dùng"
      ],
      hashtags: [
        "#lovisonstokshiba",
        "#lovisong20l",
        "#giadungnhabep",
        "#shopeesale",
        "#tiktokshopvn",
        "#dodungnhabep"
      ]
    }
  },
  null,
  2
);

export default function VisionListingPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Form states
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [categoryHint, setCategoryHint] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [shopNote, setShopNote] = useState("");

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");

  const [compressing, setCompressing] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showWarning("Dung lượng ảnh vượt quá 15MB. Vui lòng chọn ảnh nhẹ hơn!", "Ảnh Quá Lớn");
      return;
    }

    setImageFileName(file.name);
    setCompressing(true);
    try {
      // Tự động nén và chuẩn hóa ảnh về max 1024px JPEG:
      // Giúp giảm dung lượng từ vài MB xuống còn 150KB, tăng tốc Ollama Local gấp 5 lần
      const optimizedBase64 = await compressImageForAi(file, 1024, 0.85);
      setImageBase64(optimizedBase64 || null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUseSample = () => {
    setCategoryHint(SAMPLE_HINT.category);
    setTargetAudience(SAMPLE_HINT.audience);
    setShopNote(SAMPLE_HINT.note);
    setImageBase64(SAMPLE_HINT.mockImage);
    setImageFileName("lo-vi-song-toshiba-20l.png");
    setResult(SAMPLE_OUTPUT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    handleRemoveImage();
    setPlatform(PLATFORMS[0]);
    setCategoryHint("");
    setTargetAudience("");
    setShopNote("");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("vision-listing", true);
    if (!hasAccess) return;

    if (!imageBase64) {
      showWarning("Vui lòng tải lên ít nhất 1 ảnh chụp sản phẩm!", "Thiếu Hình Ảnh");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
          error: "Yêu cầu xử lý ảnh đã quá thời gian phản hồi (120s). Vui lòng thử lại với ảnh dung lượng nhẹ hơn hoặc kiểm tra kết nối mạng.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "vision-listing",
          inputs: {
            imageBase64,
            platform,
            categoryHint: categoryHint.trim(),
            targetAudience: targetAudience.trim(),
            shopNote: shopNote.trim(),
          },
        }),
      });
      console.log("DỮ liệu input => ", { imageBase64, platform, categoryHint, targetAudience, shopNote })
      console.log("DỮ LIỆU TỪ AI =>", response);
      const data = await response.json();

      if (!response.ok || !data.success) {
        showAiError(data);
        console.log("Dữ liệu lỗi => ", data);
        return;
      }

      setResult(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình phân tích ảnh theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      showAiError({
        code: "NETWORK_ERROR",
        error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
      });
    } finally {
      clearTimeout(timeoutId);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden">
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 space-y-2 sm:space-y-3">
        {/* Mobile top bar: Breadcrumb + VIP badge + Lịch sử */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs uppercase tracking-wider">
              <Crown size={10} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="vision-listing" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Tối Ưu SEO &amp; Đăng Bán</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <ImageIcon size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Phân Tích Ảnh Sản Phẩm
                  </h1>
                  {/* Mobile Quick Action Buttons */}
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="md:hidden px-2 py-1 rounded-xl text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer text-xs font-bold active:scale-90 flex items-center gap-1 shrink-0"
                    title="Thử dữ liệu mẫu"
                  >
                    <Sparkles size={12} className="text-emerald-500" />
                    <span>Mẫu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Tải ảnh chụp sản phẩm lên, AI tự động quét nhận diện chất liệu, kiểu dáng và tạo trọn bộ Listing chuẩn SEO sàn.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="vision-listing" refreshTrigger={refreshTrigger} className="w-full sm:w-auto" />
            <button
              type="button"
              onClick={handleUseSample}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/60 transition-colors cursor-pointer shadow-2xs text-center active:scale-95 whitespace-nowrap"
            >
              <Sparkles size={13} className="shrink-0" />
              <span>Dữ Liệu Mẫu</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs text-center active:scale-95 whitespace-nowrap"
            >
              <RotateCcw size={13} className="shrink-0" />
              <span>Xóa Form</span>
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
        resultLabel="Bộ Listing AI"
      />

      {/* Grid 2 Cột: Cấu hình bên trái & Output bên phải */}
      <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM TẢI ẢNH & THÔNG TIN */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 1. UPLOAD ẢNH SẢN PHẨM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Ảnh Chụp Sản Phẩm <span className="text-rose-500">*</span>
                </label>

                {!imageBase64 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Bấm để tải ảnh lên hoặc kéo thả vào đây
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Hỗ trợ PNG, JPG, WebP (Tối đa 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 p-2.5 flex items-center gap-3">
                    <img
                      src={imageBase64}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {imageFileName || "Ảnh sản phẩm"}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <ImageIcon size={11} /> Đã sẵn sàng phân tích Vision
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Xóa ảnh và chọn ảnh khác"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. SÀN THƯƠNG MẠI ĐIỆN TỬ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nền Tảng Đăng Bán
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. GỢI Ý NGÀNH HÀNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gợi Ý Ngành Hàng / Tên Loại Sản Phẩm (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={categoryHint}
                  onChange={(e) => setCategoryHint(e.target.value)}
                  placeholder="VD: Gia dụng nhà bếp - Lò vi sóng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 4. KHÁCH HÀNG MỤC TIÊU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Khách Hàng Mục Tiêu (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="VD: Gia đình 2-5 người, người bận rộn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 5. GHI CHÚ / ƯU ĐÃI RIÊNG CỦA SHOP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ưu Đãi & Quà Tặng Kèm Riêng Của Shop (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={shopNote}
                  onChange={(e) => setShopNote(e.target.value)}
                  placeholder="VD: Tặng đĩa thủy tinh cường lực, bảo hành 12 tháng 1 đổi 1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* NÚT SUBMIT + HỦY */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !imageBase64}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Phân Tích Ảnh ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Phân Tích &amp; Tạo Listing AI
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
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} w-full lg:col-span-7 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-24 lg:pb-0`}>

          <VisionListingOutput
            output={result}
            isLoading={loading}
            productImage={imageBase64}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            productName={categoryHint}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !imageBase64}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin text-white" />
                <span>Đang Phân Tích ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Send size={16} /> Phân Tích &amp; Tạo Listing AI
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
      )}
    </div>
  );
}
