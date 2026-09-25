"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Building2,
  Tag,
  ShieldCheck,
  Scale,
  Clock,
  Send,
  Crown,
  XCircle,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AppealGeneratorOutput } from "@/components/tools/AppealGeneratorOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { compressImageForAi } from "@/lib/image-compress";
import {
  SAMPLE_APPEAL_DATA,
  SAMPLE_APPEAL_RESULT,
  parseAppealGeneratorResult,
} from "@/lib/appeal-generator/contract";

const DRAFT_STORAGE_KEY = "seller_ai_appeal_generator_draft_v2";
const RESULT_STORAGE_KEY = "seller_ai_appeal_generator_last_result_v2";

const VIOLATION_OPTIONS = [
  "Hàng giả / Hàng nhái (Nghi ngờ hàng Fake)",
  "Vi phạm quyền sở hữu trí tuệ (Bản quyền thương hiệu/Logo)",
  "Vi phạm bản quyền hình ảnh / Video sao chép",
  "Spam từ khóa, giật tít, mô tả sản phẩm sai lệch",
  "Giao dịch ảo / Búp đơn / Đánh giá ảo (Buff đơn)",
  "Tỷ lệ đơn hàng không thành công / Tỷ lệ hủy đơn quá cao",
  "Giao hàng trễ hạn / Thời gian chuẩn bị hàng quá lâu",
  "Gửi hàng sai / Gửi hộp rỗng / Tráo đổi hàng",
  "Điều hướng khách hàng ra ngoài sàn (Zalo/SĐT/Website ngoài)",
  "Sản phẩm cấm hoặc hạn chế kinh doanh (Y tế, TPCN, chất cấm,...)",
  "Nội dung phản cảm, khiêu dâm, bạo lực hoặc không an toàn",
  "Quảng cáo quá mức công dụng (Cam kết 100%, trị dứt điểm...)",
  "Trùng lặp sản phẩm / Nhân bản gian hàng spam",
  "Hành vi lừa đảo hoặc vi phạm tiêu chuẩn cộng đồng",
  "Khác (Tự nhập lý do vi phạm...)",
];

export default function AppealGenerator() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorState, setErrorState] = useState<{
    message: string;
    code?: string;
    canRetry: boolean;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKb: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Form states
  const [platform, setPlatform] = useState("Shopee");
  const [violationType, setViolationType] = useState(VIOLATION_OPTIONS[0]);
  const [customViolationType, setCustomViolationType] = useState("");
  const [shopName, setShopName] = useState("");
  const [details, setDetails] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Giám sát trạng thái kết nối mạng thời gian thực
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      showSuccess("Đã kết nối lại Internet! Bạn có thể tiếp tục thao tác.", "Trực Tuyến");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("Thiết bị đang mất kết nối Internet. Vui lòng kiểm tra Wifi/4G.", "Mất Kết Nối");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showSuccess, showWarning]);

  // 1. Khôi phục nháp từ LocalStorage & SessionStorage khi khởi tạo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      let loadedResult = "";
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.platform) setPlatform(parsed.platform);
        if (parsed.violationType) setViolationType(parsed.violationType);
        if (parsed.customViolationType) setCustomViolationType(parsed.customViolationType);
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.details) setDetails(parsed.details);
        if (parsed.result) {
          loadedResult = parsed.result;
          setResult(parsed.result);
        }
      }

      // Khôi phục kết quả từ SessionStorage nếu localStorage bị quota hoặc chưa kịp lưu
      if (!loadedResult && typeof window !== "undefined") {
        const sessionResult = sessionStorage.getItem(RESULT_STORAGE_KEY);
        if (sessionResult) {
          setResult(sessionResult);
        }
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
            violationType,
            customViolationType,
            shopName,
            details,
            result,
          })
        );
      } catch {
        // Fallback không lưu result nếu vượt quota dung lượng localStorage
        try {
          localStorage.setItem(
            DRAFT_STORAGE_KEY,
            JSON.stringify({
              platform,
              violationType,
              customViolationType,
              shopName,
              details,
              result: "",
            })
          );
        } catch { }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [platform, violationType, customViolationType, shopName, details, result]);

  // Dọn dẹp timer và abort request khi component unmount
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Kiểm tra định dạng tệp hình ảnh
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
      showWarning("Vui lòng chỉ tải lên tệp hình ảnh (PNG, JPG, WEBP)!", "Sai Định Dạng");
      return;
    }

    // 2. Kiểm tra kích thước tệp ban đầu (tối đa 15MB)
    if (file.size > 15 * 1024 * 1024) {
      showWarning("Dung lượng ảnh vượt quá 15MB. Vui lòng chọn ảnh chụp màn hình nhỏ hơn!", "Ảnh Quá Lớn");
      return;
    }

    try {
      // Nén thông minh: tối đa 1024px, JPEG chất lượng 0.82
      let optimized = await compressImageForAi(file, 1024, 0.82);

      // Nếu chuỗi base64 vẫn lớn hơn 1.2MB, nén sâu hơn ở 800px / 0.70 để đảm bảo an toàn tuyệt đối
      if (optimized && optimized.length > 1.2 * 1024 * 1024) {
        optimized = await compressImageForAi(file, 800, 0.70);
      }

      if (optimized) {
        const cleanBase64 = optimized.trim();
        setImageBase64(cleanBase64);
        const sizeKb = Math.round((cleanBase64.length * 3) / 4 / 1024);
        setImageMeta({ name: file.name, sizeKb });
        showSuccess(`Đã nén tối ưu ảnh (${sizeKb} KB) thành công!`, "Tải Ảnh");
      }
    } catch (err) {
      console.error("Image compression error:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        if (rawBase64 && rawBase64.length < 2 * 1024 * 1024) {
          setImageBase64(rawBase64.trim());
          setImageMeta({ name: file.name, sizeKb: Math.round(file.size / 1024) });
        } else {
          showWarning("Không thể nén ảnh này và dung lượng vượt mức cho phép. Vui lòng dùng ảnh chụp màn hình nhẹ hơn.", "Ảnh Quá Lớn");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImageMeta(null);
  };

  const handleResetForm = () => {
    setPlatform("Shopee");
    setViolationType(VIOLATION_OPTIONS[0]);
    setCustomViolationType("");
    setShopName("");
    setDetails("");
    setImageBase64(null);
    setImageMeta(null);
    setResult("");
    setErrorState(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    } catch { }
    showSuccess("Đã làm mới biểu mẫu!", "Làm Mới");
  };

  const handleUseSample = () => {
    setPlatform(SAMPLE_APPEAL_DATA.platform || "Shopee");
    setViolationType(SAMPLE_APPEAL_DATA.violationType || VIOLATION_OPTIONS[0]);
    setCustomViolationType("");
    setShopName(SAMPLE_APPEAL_DATA.shopName || "TuKi Store Official");
    setDetails(
      "Sản phẩm kem dưỡng da của shop bị AI quét khóa với lý do nghi ngờ hàng nhái. Shop có hóa đơn VAT nhập khẩu chính ngạch từ công ty phân phối độc quyền và tem phụ tiếng Việt đầy đủ."
    );
    setResult(SAMPLE_APPEAL_RESULT);
    setErrorState(null);
    try {
      sessionStorage.setItem(RESULT_STORAGE_KEY, SAMPLE_APPEAL_RESULT);
    } catch { }
    setMobileTab("result");
    showSuccess("Đã điền dữ liệu mẫu thực chiến & kết quả mẫu!", "Dữ Liệu Mẫu");
  };

  // Nạp lại kết quả từ lịch sử và điền ngược lại form
  const handleSelectHistoryOutput = (pastOutput: string) => {
    if (!pastOutput) return;
    setResult(pastOutput);
    setErrorState(null);
    try {
      sessionStorage.setItem(RESULT_STORAGE_KEY, pastOutput);
    } catch { }
    setMobileTab("result");

    try {
      const parsed = parseAppealGeneratorResult(pastOutput);
      if (parsed) {
        if (parsed.shopName) setShopName(parsed.shopName);
        if (parsed.platform) setPlatform(parsed.platform);
        if (parsed.violationType) {
          if (VIOLATION_OPTIONS.includes(parsed.violationType)) {
            setViolationType(parsed.violationType);
          } else {
            setViolationType(VIOLATION_OPTIONS[VIOLATION_OPTIONS.length - 1]);
            setCustomViolationType(parsed.violationType);
          }
        }
      }
    } catch { }

    showSuccess("Đã tải lại kết quả từ lịch sử!", "Lịch Sử");
  };

  const handleGenerate = async () => {
    if (loading || isSubmittingRef.current) return;

    if (typeof window !== "undefined" && !navigator.onLine) {
      setErrorState({
        code: "NETWORK_OFFLINE",
        message: "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng wifi/4G và thử lại!",
        canRetry: true,
      });
      setMobileTab("result");
      showAiError({ error: "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng wifi/4G và thử lại!" });
      return;
    }

    const hasAccess = await checkAccess("appeal-generator", true); // VIP Only
    if (!hasAccess) return;

    const finalViolationType = violationType.startsWith("Khác")
      ? customViolationType.trim()
      : violationType;

    if (violationType.startsWith("Khác") && !customViolationType.trim()) {
      showWarning("Vui lòng nhập lý do vi phạm cụ thể của bạn!", "Thiếu Thông Tin");
      return;
    }

    if (!shopName.trim() || (!details.trim() && !imageBase64)) {
      showWarning("Vui lòng cung cấp Tên Shop và Mô tả chi tiết hoặc Ảnh chụp màn hình!", "Thiếu Dữ Liệu");
      return;
    }

    isSubmittingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setElapsedSeconds(0);
    setErrorState(null);
    setResult("");
    setMobileTab("result");

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        controller.abort();
        setErrorState({
          code: "TIMEOUT",
          message: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại sau.",
          canRetry: true,
        });
        showAiError({
          code: "TIMEOUT",
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại sau.",
        });
      }
    }, 120000);

    try {
      const requestPayload = {
        tool: "appeal-generator",
        inputs: {
          platform,
          violationType: finalViolationType,
          shopName: shopName.trim(),
          details: details.trim(),
          imageBase64: imageBase64 ? imageBase64.trim() : null,
        },
      };

      let response: Response;
      try {
        response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === "AbortError" || controller.signal.aborted) {
          throw fetchErr;
        }
        // Thử lại tự động 1 lần nếu gặp lỗi mạng tạm thời khi máy vẫn online
        if (typeof window !== "undefined" && navigator.onLine) {
          await new Promise((r) => setTimeout(r, 1500));
          if (controller.signal.aborted) throw fetchErr;
          response = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify(requestPayload),
          });
        } else {
          throw fetchErr;
        }
      }

      const data = await response.json().catch(() => null);
      if (data && data.success) {
        setResult(data.data);
        setErrorState(null);
        try {
          sessionStorage.setItem(RESULT_STORAGE_KEY, data.data);
        } catch { }
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errCode = data?.code || (response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "SERVER_BUSY" : "AI_ERROR");
        const errMsg = data?.error || (response.status === 504 ? "Cổng xử lý AI quá thời gian phản hồi (504 Timeout)." : "Có lỗi xảy ra khi tạo văn bản kháng nghị.");
        setErrorState({
          code: errCode,
          message: errMsg,
          canRetry: true,
        });
        showAiError(data || { error: errMsg }, "Có lỗi xảy ra khi tạo văn bản kháng nghị");
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình xử lý theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }
      const isNetworkDrop = typeof window !== "undefined" && !navigator.onLine;
      setErrorState({
        code: isNetworkDrop ? "NETWORK_OFFLINE" : "FETCH_ERROR",
        message: isNetworkDrop
          ? "Kết nối Internet bị ngắt quãng trong quá trình gửi yêu cầu. Vui lòng bấm Thử Lại Ngay."
          : "Không thể kết nối đến máy chủ AI. Vui lòng bấm Thử Lại Ngay hoặc kiểm tra lại đường truyền.",
        canRetry: true,
      });
      showAiError({ error: isNetworkDrop ? "Mất kết nối mạng." : "Không thể kết nối đến máy chủ AI. Vui lòng thử lại!" });
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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col lg:min-h-0 lg:h-full lg:overflow-hidden pb-3">
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 mb-3 space-y-2">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge
              tool="appeal-generator"
              refreshTrigger={refreshTrigger}
              historyOnly
              onSelectOutput={handleSelectHistoryOutput}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-rose-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Vận Hành & Xử Lý Rủi Ro</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-center text-rose-500 dark:text-rose-400 shadow-xs shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Kháng Nghị Vi Phạm
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer shadow-2xs active:scale-90"
                    title="Xóa Form / Đặt lại"
                    aria-label="Xóa Form"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider shrink-0">
                    <Crown size={11} className="text-amber-600 dark:text-amber-400" />
                    VIP TOOL
                  </span>
                </div>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Tạo chiến lược giải trình pháp lý và mẫu đơn khiếu nại chuẩn sàn tăng tỷ lệ mở shop &amp; sản phẩm bị khóa.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY - Preserved) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge
              tool="appeal-generator"
              refreshTrigger={refreshTrigger}
              onSelectOutput={handleSelectHistoryOutput}
            />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Sparkles size={14} /> Thử Mẫu Vi Phạm
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
        hasResult={Boolean(result || errorState)}
        loading={loading}
        resultLabel="Đơn Kháng Nghị"
      />

      {/* Grid 2 Cột: Cuộn độc lập trên Desktop, Chuyển tab trên Mobile */}
      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-start lg:items-stretch">
        {/* CỘT TRÁI: FORM THÔNG TIN VI PHẠM (cuộn độc lập) */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col lg:min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="lg:h-full lg:overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-28 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Khối Form */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                      Thông Tin Vi Phạm
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Chuẩn Sàn TMĐT
                </span>
              </div>

              {/* Sàn TMĐT & Tên Shop */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sàn TMĐT <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option>Shopee</option>
                    <option>TikTok Shop</option>
                    <option>Facebook</option>
                    <option>Lazada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Building2 size={12} className="text-rose-500" />
                    Tên Shop <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="VD: TuKi Store..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Loại Vi Phạm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Tag size={12} className="text-rose-500" />
                  Loại Vi Phạm (Lý do bị quét khóa) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all cursor-pointer"
                >
                  {VIOLATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {/* Ô nhập tuỳ chỉnh khi chọn mục Khác */}
                {violationType.startsWith("Khác") && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customViolationType}
                      onChange={(e) => setCustomViolationType(e.target.value)}
                      placeholder="Nhập lý do cụ thể (VD: Trùng CCCD, đổi tài khoản ngân hàng...)"
                      className="w-full px-3 py-2 bg-rose-50/40 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-950 dark:text-rose-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Giải trình chi tiết */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText size={12} className="text-rose-500" />
                    Giải Trình Chi Tiết Sự Việc <span className="text-rose-500">*</span>
                  </label>
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder="Kể ngắn gọn sự việc, lý do khách quan và các bằng chứng bạn có (hóa đơn VAT, tem mác, giấy ủy quyền, clip đóng gói)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Ảnh chụp thông báo vi phạm (Tùy chọn) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ảnh Chụp Thông Báo Phạt / Mã Lỗi (Tùy chọn)
                </label>

                {!imageBase64 ? (
                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-emerald-50/30 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <Upload size={18} className="text-slate-400 group-hover:text-emerald-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600">
                      Bấm để tải ảnh lên (PNG, JPG)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      AI sẽ đọc thông báo phạt và tìm lỗ hổng quét của sàn
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={imageBase64}
                        alt="Ảnh vi phạm"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>Đã tải ảnh lên</span>
                          {imageMeta?.sizeKb ? (
                            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold ml-1 px-1.5 py-0.2 rounded bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-800/60">
                              {imageMeta.sizeKb} KB
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                          {imageMeta?.name || "AI sẽ phân tích chi tiết thông báo vi phạm từ ảnh"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                      title="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Cảnh báo mất kết nối Internet */}
              {!isOnline && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                  <WifiOff size={14} className="shrink-0" />
                  <span>Đang mất kết nối mạng. Bạn vẫn có thể soạn nháp và chỉnh sửa thông tin.</span>
                </div>
              )}

              {/* Nút Submit */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !shopName.trim() || (!details.trim() && !imageBase64)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <ShieldAlert size={16} className="animate-spin text-white" />
                      <span>Đang Phân Tích ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Viết Đơn Kháng Nghị Bằng AI
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

        {/* CỘT PHẢI: HIỂN THỊ KẾT QUẢ ĐƠN KHÁNG NGHỊ (cuộn độc lập) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-24 lg:pb-0`}>

          <AppealGeneratorOutput
            result={result}
            loading={loading}
            error={errorState}
            onRetry={handleGenerate}
            platform={platform}
            shopName={shopName}
            violationType={violationType.startsWith("Khác") ? (customViolationType || "Vi phạm khác") : violationType}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
