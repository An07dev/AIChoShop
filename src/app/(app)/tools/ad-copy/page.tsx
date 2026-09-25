"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Crown,
  Send,
  Flame,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AdCopyOutput } from "@/components/tools/AdCopyOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { buildOfflineAdCopyData, type AdPlatform } from "@/lib/ad-copy/contract";

const SAMPLE_DATA = {
  productName: "Tai nghe Bluetooth không dây chống ồn ANC AirPro 5",
  price: "Gốc 690.000đ - Flash Sale độc quyền 389.000đ",
  usp: "Chống ồn chủ động ANC 35dB khử tạp âm; Thời lượng pin trâu 30 giờ kèm dock sạc; Micro ENC đàm thoại lọc gió cực nét; Chống nước IPX5 đi mưa thể thao thoải mái",
  targetAudience: "Học sinh sinh viên, dân văn phòng hay họp online, người thích nghe nhạc và tài xế công nghệ cần nghe gọi rõ ngoài đường",
  adPlatform: "both",
  campaignGoal: "conversion",
  promotionOffer: "Voucher giảm 50k & Freeship Xtra 100% trong khung giờ vàng",
};

const SAMPLE_RESULT = JSON.stringify(
  {
    platform: "both",
    campaignGoal: "Tối ưu Tỷ lệ Chuyển Đổi & ROAS (Ra đơn nhanh)",
    shopeeAds: {
      keywordMatrix: {
        exactMatch: [
          { keyword: "tai nghe bluetooth anc", suggestedBid: "1.800đ - 2.500đ", searchIntent: "Ý định mua cao, chốt đơn ngay" },
          { keyword: "tai nghe airpro 5", suggestedBid: "1.500đ - 2.200đ", searchIntent: "Tìm kiếm chính xác thương hiệu & model" },
          { keyword: "tai nghe chống ồn chủ động", suggestedBid: "1.900đ - 2.600đ", searchIntent: "Nhu cầu tính năng cao cấp" },
          { keyword: "tai nghe không dây pin trâu", suggestedBid: "1.200đ - 1.800đ", searchIntent: "Tìm kiếm theo lợi ích cốt lõi" }
        ],
        broadMatch: [
          { keyword: "tai nghe bluetooth", suggestedBid: "800đ - 1.200đ", searchIntent: "Gom traffic rẻ từ tìm kiếm bao quát" },
          { keyword: "tai nghe khong day", suggestedBid: "700đ - 1.100đ", searchIntent: "Traffic mở rộng không dấu" },
          { keyword: "tai nghe gaming đàm thoại", suggestedBid: "900đ - 1.300đ", searchIntent: "Tệp khách chơi game, nghe gọi" },
          { keyword: "tai nghe nhét tai chống ồn", suggestedBid: "750đ - 1.150đ", searchIntent: "Tệp tìm kiếm kiểu dáng nhét tai" }
        ],
        misspelledOrNiche: [
          { keyword: "tai nge bluetooth", suggestedBid: "450đ - 700đ", searchIntent: "Lỗi gõ sai chính tả phổ biến" },
          { keyword: "tay nghe blutooth", suggestedBid: "400đ - 650đ", searchIntent: "Lỗi gõ không dấu, biến thể vùng miền" },
          { keyword: "tai nghe chong on gia re", suggestedBid: "500đ - 850đ", searchIntent: "Từ khóa ngách săn giá tốt" }
        ],
        negativeKeywords: [
          "thanh lý", "miễn phí", "tai nghe cũ", "hàng nhái", "hướng dẫn tự sửa", "tuyển sỉ", "tai nghe có dây"
        ]
      },
      headlines: [
        {
          id: 1,
          label: "Mẫu 1",
          angle: "Góc Deal sốc & Quà tặng",
          headline: "Tai Nghe ANC AirPro 5 - Flash Sale Giảm 45% + Quà",
          charCount: 49,
          isSafeLength: true,
          hookBenefit: "Kích thích click nhờ ưu đãi sâu và quà tặng kèm"
        },
        {
          id: 2,
          label: "Mẫu 2",
          angle: "Góc USP Chống Ồn & Pin Trâu",
          headline: "AirPro 5 Khử Ồn ANC 35dB - Pin 30 Giờ Đàm Thoại Nét",
          charCount: 51,
          isSafeLength: true,
          hookBenefit: "Nổi bật 2 tính năng sát thủ mà khách hàng quan tâm nhất"
        },
        {
          id: 3,
          label: "Mẫu 3",
          angle: "Góc Cam kết Chính Hãng & An Tâm",
          headline: "Tai Nghe Không Dây AirPro 5 - Lỗi 1 Đổi 1 Trong 12T",
          charCount: 50,
          isSafeLength: true,
          hookBenefit: "Xóa tan nghi ngại bằng chính sách bảo hành vàng 1 đổi 1"
        }
      ],
      biddingStrategy: {
        recommendedInitialBid: "1.200đ - 1.600đ cho từ khóa chính xác; 600đ - 900đ cho từ mở rộng",
        peakHourMultiplier: "Tăng giá thầu 30% - 45% trong khung giờ vàng 20h00 - 23h00 và ngày Siêu Sale",
        optimizationTip: "Loại bỏ ngay các từ khóa có tỷ lệ click (CTR) dưới 1.5% sau 3 ngày và thêm vào danh sách từ khóa phủ định"
      }
    },
    tiktokAds: {
      hooks: [
        {
          id: 1,
          angle: "Góc Nỗi Đau / Cảnh Báo",
          visualAction: "Cầm chiếc tai nghe cũ bị rè đập nhẹ xuống bàn, lắc đầu chán nản rồi giơ AirPro 5 lên",
          textOverlay: "ĐỪNG MUA tai nghe nếu bạn chưa biết điều này!",
          audioVoiceover: "Bỏ tiền triệu mua tai nghe mà đi ra đường vẫn nghe trọn tiếng còi xe? Dừng ngay lại..."
        },
        {
          id: 2,
          angle: "Góc Sự Thật Bất Ngờ / Tiết Lộ",
          visualAction: "Quay cận cảnh bật chế độ ANC ở ngã tư đông đúc, mọi tạp âm xe cộ lập tức im bặt",
          textOverlay: "Tai nghe 300 cành đè bẹp các dòng tiền triệu?",
          audioVoiceover: "Thử test khả năng chống ồn ANC 35dB ở ngã tư giờ cao điểm và cái kết..."
        },
        {
          id: 3,
          angle: "Góc Đổi Đời / Trải Nghiệm Thực Tế",
          visualAction: "Đeo tai nghe AirPro 5 vừa chạy bộ ngoài mưa vừa nghe nhạc không hề rơi rớt",
          textOverlay: "Chạy bộ đi mưa cả tuần không lo hết pin!",
          audioVoiceover: "Đây là chiếc tai nghe chống nước pin trâu 30 tiếng cứu rỗi những buổi tập của mình!"
        },
        {
          id: 4,
          angle: "Góc So Sánh Tương Phản",
          visualAction: "Chia đôi màn hình: Một bên tai nghe thường âm thanh lẹt xẹt, một bên AirPro 5 giọng nói trong vắt",
          textOverlay: "Khác biệt 1 trời 1 vực khi đi ngoài đường!",
          audioVoiceover: "Thử gọi điện thoại khi đang chạy xe 40km/h xem micro lọc gió đỉnh cỡ nào nhé!"
        },
        {
          id: 5,
          angle: "Góc FOMO / Báo Deal Giới Hạn",
          visualAction: "Chỉ tay thẳng vào góc trái màn hình nơi có icon Giỏ Hàng Màu Vàng đang nhấp nháy",
          textOverlay: "Chỉ còn 50 suất Flash Sale độc quyền hôm nay!",
          audioVoiceover: "Săn đúng đợt sale trợ giá này được giảm một nửa tiền, bấm giỏ hàng góc trái săn ngay!"
        }
      ],
      captions: [
        {
          id: 1,
          title: "Mẫu Caption 1 (Tập trung giải quyết nỗi đau & Kích cầu)",
          angle: "Giải quyết nỗi đau ồn ào",
          caption: "Bật ANC một phát là cả thế giới yên tĩnh ngay! 🎧 Tai nghe Bluetooth AirPro 5 bản nâng cấp mới nhất: Chống ồn chủ động 35dB, pin trâu 30 tiếng, micro lọc gió cực nét ngoài đường. Đang Flash Sale độc quyền hôm nay kèm voucher giảm 50k trong giỏ hàng góc trái!",
          ctaBadge: "Bấm vào biểu tượng Giỏ Hàng màu vàng ở góc trái màn hình nhận voucher!"
        },
        {
          id: 2,
          title: "Mẫu Caption 2 (Review trải nghiệm thực tế & Tính năng)",
          angle: "Social Proof & Độ bền bỉ",
          caption: "Đi học, đi làm hay tập gym cả ngày không đau tai, nghe gọi cực rõ dù chạy xe 40km/h! Bản AirPro 5 này chuẩn chống nước IPX5 đi mưa thể thao thoải mái. Đã kiểm chứng hơn 10.000 đánh giá 5 sao trên TikTok Shop!",
          ctaBadge: "Bấm Giỏ Hàng góc trái để rinh ngay chiếc tai nghe quốc dân này!"
        },
        {
          id: 3,
          title: "Mẫu Caption 3 (Báo Flash Sale sốc & Voucher độc quyền)",
          angle: "Deal sốc & Quà tặng giới hạn",
          caption: "🔥 DEAL HỜI DUY NHẤT HÔM NAY! Giá gốc 690K nay chỉ còn 389K, lại còn áp được thêm mã giảm 50K và freeship tận giường. Duy nhất phiên video hôm nay, hết 50 suất hệ thống tự động nhảy về giá cũ!",
          ctaBadge: "Chạm vào Giỏ Hàng màu vàng nhận ngay mã giảm 50K độc quyền!"
        },
        {
          id: 4,
          title: "Mẫu Caption 4 (So sánh chất lượng & Bảo hành rủi ro bằng 0)",
          angle: "Chính hãng & Bảo hành 1 đổi 1",
          caption: "Đừng tiếc vài chục nghìn mua tai nghe trôi nổi rè tiếng mau hỏng. AirPro 5 cam kết âm bass chắc, micro đàm thoại khử ồn cực đỉnh và bảo hành 1 đổi 1 trong 12 tháng tận nhà nếu có lỗi từ nhà sản xuất!",
          ctaBadge: "Đặt mua chính hãng có bảo hành ngay tại Giỏ Hàng góc trái!"
        },
        {
          id: 5,
          title: "Mẫu Caption 5 (Cảnh báo số lượng có hạn & FOMO)",
          angle: "Khan hiếm & Cấp bách",
          caption: "⚠️ CẢNH BÁO SẮP CHÁY HÀNG: Chỉ còn đúng 15 chiếc AirPro 5 bản màu Titan giá 389K trong kho hôm nay! Khách nào chần chừ bỏ lỡ đợt trợ giá này thì tiếc hùi hụi luôn nhé. Nhanh tay chốt đơn ngay kẻo hết quà!",
          ctaBadge: "Bấm Giỏ Hàng màu vàng ở góc trái săn ngay trước khi hết suất!"
        }
      ],
      hashtags: ["#tainghebluetooth", "#airpro5", "#tainghechongon", "#reviewcongnghe", "#tiktokshop", "#dealhot"],
      conversionTip: "Chèn text overlay to rõ ở góc trên màn hình và luôn nhắc khách hàng bấm vào Giỏ Hàng Vàng trong 5 giây cuối video"
    },
    policyCompliance: {
      safeScore: 99,
      bannedWordsAvoided: ["cam kết 100%", "trị dứt điểm", "số 1 thị trường", "rẻ nhất thế giới", "lôi kéo ra ngoài sàn"],
      warningNotes: ["Đã tuân thủ chính sách quảng cáo Shopee Ads và tiêu chuẩn cộng đồng TikTok Shop"]
    }
  },
  null,
  2
);

export default function AdCopyPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [usp, setUsp] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adPlatform, setAdPlatform] = useState<AdPlatform>("both");
  const [campaignGoal, setCampaignGoal] = useState("conversion");
  const [promotionOffer, setPromotionOffer] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [userQuota, setUserQuota] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    remainingFree: number | null;
    dailyFreeLimit: number;
  } | null>(null);

  // Dọn dẹp timer & abort controller khi unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
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

  const handleUseSample = () => {
    setProductName(SAMPLE_DATA.productName);
    setPrice(SAMPLE_DATA.price);
    setUsp(SAMPLE_DATA.usp);
    setTargetAudience(SAMPLE_DATA.targetAudience);
    setAdPlatform(SAMPLE_DATA.adPlatform as AdPlatform);
    setCampaignGoal(SAMPLE_DATA.campaignGoal);
    setPromotionOffer(SAMPLE_DATA.promotionOffer);
    setResult(SAMPLE_RESULT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setPrice("");
    setUsp("");
    setTargetAudience("");
    setAdPlatform("both");
    setCampaignGoal("conversion");
    setPromotionOffer("");
    setResult("");
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("ad-copy", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm!", "Thiếu Thông Tin");
      return;
    }
    if (!price.trim()) {
      showWarning("Vui lòng nhập giá bán hoặc giá khuyến mãi!", "Thiếu Thông Tin");
      return;
    }
    if (!usp.trim()) {
      showWarning("Vui lòng nhập 2-3 điểm nổi bật (USP) của sản phẩm!", "Thiếu Thông Tin");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setResult("");
    setMobileTab("result");
    setElapsedSeconds(0);

    // Bộ đếm thời gian thực
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Timeout bảo vệ tối đa 60 giây
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại hoặc giảm bớt độ dài nội dung.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "ad-copy",
          inputs: {
            productName: productName.trim(),
            price: price.trim(),
            usp: usp.trim(),
            targetAudience: targetAudience.trim() || "Khách hàng mua sắm online toàn quốc",
            adPlatform,
            campaignGoal,
            promotionOffer: promotionOffer.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === "REQUEST_ABORTED") {
          showWarning("Đã hủy tạo mẫu quảng cáo theo yêu cầu của bạn.", "Đã Hủy");
          return;
        }
        // Tự động kích hoạt Offline Blueprint dự phòng khi AI 502/503/timeout
        const offlineData = buildOfflineAdCopyData({
          adPlatform,
          productName: productName.trim(),
          price: price.trim(),
          usp: usp.trim(),
          targetAudience: targetAudience.trim() || "Khách hàng mua sắm online toàn quốc",
          campaignGoal,
          promotionOffer: promotionOffer.trim(),
        });
        setResult(JSON.stringify(offlineData));
        showWarning(
          data?.error || "Máy chủ AI phản hồi chậm hoặc đang bảo trì (502). Đã kích hoạt Bộ Mẫu Quảng Cáo Dự Phòng 2026!",
          "Chế Độ Dự Phòng"
        );
        return;
      }

      setResult(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message?.includes("aborted") || controller.signal.aborted) {
        showWarning("Đã dừng quá trình tạo mẫu quảng cáo.", "Đã Hủy");
        return;
      }
      // Tự động phục hồi khi mất kết nối mạng
      const offlineData = buildOfflineAdCopyData({
        adPlatform,
        productName: productName.trim(),
        price: price.trim(),
        usp: usp.trim(),
        targetAudience: targetAudience.trim() || "Khách hàng mua sắm online toàn quốc",
        campaignGoal,
        promotionOffer: promotionOffer.trim(),
      });
      setResult(JSON.stringify(offlineData));
      showWarning(
        "Không thể kết nối đến hệ thống AI (sự cố mạng). Đã kích hoạt Bộ Mẫu Quảng Cáo Dự Phòng 2026!",
        "Chế Độ Dự Phòng"
      );
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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
      {/* Modals chặn quyền nếu có */}
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
            <AiUsageBadge tool="ad-copy" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Marketing &amp; Kéo Traffic</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs shrink-0">
                <Flame size={20} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    AI Mẫu Quảng Cáo
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
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Ma trận từ khóa đấu thầu Shopee Ads + 5 Câu Hook 3s và Caption tối ưu Giỏ hàng TikTok Spark Ads.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved exactly as original) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="ad-copy" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        resultLabel="Mẫu Quảng Cáo"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div
          className={`${
            mobileTab === "form" ? "flex" : "hidden lg:flex"
          } lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}
        >
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 1. NỀN TẢNG QUẢNG CÁO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nền Tảng Quảng Cáo <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdPlatform("both")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "both"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>⚡ Cả Hai</span>
                    <span className="text-[10px] font-normal opacity-80">Shopee &amp; TikTok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlatform("shopee")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "shopee"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🛒 Shopee Ads</span>
                    <span className="text-[10px] font-normal opacity-80">Từ Khóa &amp; CTR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlatform("tiktok")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      adPlatform === "tiktok"
                        ? "bg-pink-50 dark:bg-pink-950/40 border-pink-500 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🎵 TikTok Ads</span>
                    <span className="text-[10px] font-normal opacity-80">Hook 3s &amp; Giỏ</span>
                  </button>
                </div>
              </div>

              {/* 2. TÊN SẢN PHẨM */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên Sản Phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Tai nghe Bluetooth chống ồn ANC AirPro 5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 3. GIÁ BÁN & GIÁ KHUYẾN MÃI */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Giá Bán &amp; Khuyến Mãi <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="VD: Gốc 690k - Giảm còn 389k hôm nay"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 4. ĐIỂM NỔI BẬT (USP) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>
                    Điểm Nổi Bật (USP) / Lợi Ích Cốt Lõi <span className="text-rose-500">*</span>
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="VD: Chống ồn chủ động ANC 35dB; Pin 30 tiếng; Micro lọc gió cực nét; Chống nước IPX5..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* 5. ĐỐI TƯỢNG MỤC TIÊU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Đối Tượng Khách Hàng Nhắm Tới</span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="VD: Sinh viên, dân văn phòng, người hay đi xe máy ngoài đường..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* 6. MỤC TIÊU CHIẾN DỊCH */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mục Tiêu Chiến Dịch
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCampaignGoal("conversion")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      campaignGoal === "conversion"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🎯 Ra Đơn Nhanh</span>
                    <span className="text-[10px] font-normal opacity-80">Tối ưu ROAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignGoal("traffic")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      campaignGoal === "traffic"
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>🚀 Gom Traffic</span>
                    <span className="text-[10px] font-normal opacity-80">Giá thầu rẻ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignGoal("flash_sale")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      campaignGoal === "flash_sale"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600 dark:text-amber-400 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>⚡ Flash Sale</span>
                    <span className="text-[10px] font-normal opacity-80">Xả kho deal sốc</span>
                  </button>
                </div>
              </div>

              {/* 7. ƯU ĐÃI KÍCH CẦU / VOUCHER (TÙY CHỌN) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Ưu Đãi / Voucher / Freeship (Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={promotionOffer}
                  onChange={(e) => setPromotionOffer(e.target.value)}
                  placeholder="VD: Voucher giảm 50k, Freeship Xtra, Quà tặng kèm củ sạc..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* NÚT SUBMIT TRONG FORM & HỦY YÊU CẦU */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" /> Đang Tạo Mẫu Quảng Cáo ({elapsedSeconds}s)...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Tạo Mẫu Quảng Cáo Chuyển Đổi
                    </>
                  )}
                </button>

                {loading && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/60 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <XCircle size={14} className="text-rose-400" /> Hủy Quá Trình Tạo
                  </button>
                )}
              </div>

              {/* Thông tin quota tài khoản */}
              <p aria-live="polite" className="text-[10px] text-center text-slate-400">
                {userQuota?.isLogged ? (
                  userQuota.isVIP ? (
                    <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                      <span>👑</span> VIP · Không giới hạn
                    </span>
                  ) : (
                    <span>
                      ⚡ Còn{" "}
                      <strong
                        className={
                          userQuota.remainingFree === 0 ? "text-rose-500" : "text-emerald-500"
                        }
                      >
                        {userQuota.remainingFree ?? 0}
                      </strong>
                      /{userQuota.dailyFreeLimit} lượt hôm nay ·{" "}
                      <Link
                        href="/profile#pricing-section"
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Nâng cấp VIP
                      </Link>
                    </span>
                  )
                ) : (
                  <span>Tài khoản miễn phí được cấp lượt dùng mỗi ngày.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div
          className={`${
            mobileTab === "result" ? "flex" : "hidden lg:flex"
          } lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden pb-16 lg:pb-0`}
        >
          <AdCopyOutput
            result={result}
            loading={loading}
            productName={productName}
            platform={adPlatform}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            onUseSample={handleUseSample}
          />
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar (chỉ hiện khi ở tab form trên mobile) */}
      {mobileTab === "form" && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 lg:hidden shadow-lg space-y-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Đang Tạo Mẫu Quảng Cáo ({elapsedSeconds}s)...
              </>
            ) : (
              <>
                <Send size={16} /> Tạo Mẫu Quảng Cáo Chuyển Đổi
              </>
            )}
          </button>

          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 text-rose-400 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <XCircle size={14} /> Hủy Yêu Cầu
            </button>
          )}
        </div>
      )}
    </div>
  );
}
