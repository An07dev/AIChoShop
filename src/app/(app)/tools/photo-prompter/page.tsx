"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Camera,
  Layers,
  Palette,
  User,
  Sliders,
  HelpCircle,
  Cpu,
  Crown,
  XCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { PhotoPrompterOutput } from "@/components/tools/PhotoPrompterOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";
import { compressImageForAi } from "@/lib/image-compress";
import { generatePhotoPrompterBlueprint } from "@/lib/photo-prompter/contract";

const STYLES = [
  {
    id: "minimalist_studio",
    name: "Studio Tối Giản Sang Trọng",
    desc: "Bục podium bê tông/đá cẩm thạch, ánh sáng mềm cao cấp",
  },
  {
    id: "luxury_hotel",
    name: "Khách Sạn 5 Sao Đẳng Cấp",
    desc: "Nội thất gỗ óc chó, ánh đèn vàng ấm áp quý phái",
  },
  {
    id: "korean_cafe",
    name: "Quán Cafe Hàn Quốc / Pastel",
    desc: "Tone màu be/kem nhẹ nhàng, ánh nắng ban mai qua cửa kính",
  },
  {
    id: "nature_organic",
    name: "Thiên Nhiên Hữu Cơ / Eco",
    desc: "Lá cây xanh tươi mát, giọt sương, bóng đổ cành lá tự nhiên",
  },
  {
    id: "street_cyberpunk",
    name: "Đường Phố Trẻ Trung & Neon",
    desc: "Văn hóa đường phố hiện đại, màu sắc nổi bật, năng động Gen Z",
  },
  {
    id: "scandinavian",
    name: "Bắc Âu Tối Giản Ấm Cúng",
    desc: "Chất liệu gỗ sồi, vải lanh, phong cách sống thư thái Hygge",
  },
];

const IMAGE_TYPE_GROUPS = [
  {
    group: "👗 Người Mẫu & Lookbook (Model & Lookbook)",
    options: [
      "Lookbook người mẫu toàn thân mặc/mang sản phẩm (Full-body Lookbook)",
      "Chụp chân dung nửa người / Thắt lưng trở lên (Half-body Portrait)",
      "Người mẫu tương tác tự nhiên & chuyển động (Candid & Action Movement)",
      "Người mẫu che mặt / Ẩn danh tôn sản phẩm (Faceless Aesthetic Model)",
      "Cận cảnh bàn tay đeo / Cầm sử dụng sản phẩm (Hand Holding & Detail Interaction)",
      "Người mẫu phong cách cặp đôi / Nhóm bạn (Couple / Group Lifestyle Lookbook)",
    ],
  },
  {
    group: "🏛️ Studio & Bục Trưng Bày (Commercial Studio & Podium)",
    options: [
      "Ảnh đơn sản phẩm trên bục Podium / Đá cẩm thạch (Hero Podium Shot)",
      "Nền trắng / Nền đơn sắc chuẩn sàn Shopee, TikTok Shop (Clean Studio White)",
      "Sản phẩm bay lơ lửng / Chống trọng lực (Anti-Gravity / Floating Product)",
      "Hiệu ứng giọt nước / Bắn tung tóe năng động (Water Splash & Droplets)",
      "Chiếu sáng bóng đổ nắng qua khung cửa sổ (Artistic Sunlight & Window Shadows)",
      "Ánh sáng Neon / Cyberpunk tương phản cao (High-contrast Neon Rim Light)",
      "Phông nền vải lụa mềm mại / Nếp gấp nghệ thuật (Draped Silk & Velvet Backdrop)",
    ],
  },
  {
    group: "📐 Flatlay & Sắp Đặt Bố Cục (Flatlay & Styled Layout)",
    options: [
      "Flatlay bài trí phụ kiện từ trên xuống 90° (Top-down Flatlay Arrangement)",
      "Bố cục mở hộp & Trải phụ kiện thành hàng (Unboxing & Knolling Layout)",
      "Bố cục đối xứng tối giản & Tinh tế (Symmetrical Minimalist Layout)",
      "Bố cục trừu tượng nghệ thuật theo khối màu (Color Blocking & Abstract Composition)",
    ],
  },
  {
    group: "🔍 Góc Chụp & Cận Cảnh Chi Tiết (Angles & Macro Shots)",
    options: [
      "Ảnh Macro zoom siêu cận đường nét & chất liệu (Extreme Macro Detail Shot)",
      "Góc nghiêng 45° năng động tôn khối & chiều sâu (Dynamic 45-degree Angle)",
      "Góc thấp từ dưới lên tạo cảm giác bề thế (Low Angle Hero View)",
      "Góc nhìn cận mặt trước chính diện (Direct Front Eye-level Shot)",
      "Góc nhìn mắt chim bao quát từ trên cao (Bird's Eye Aerial View)",
    ],
  },
  {
    group: "🏡 Bối Cảnh Đời Sống Thực Tế (Lifestyle In-Context)",
    options: [
      "Bối cảnh đời sống thực tế trong nhà / Phòng khách (Cozy Interior Lifestyle)",
      "Bối cảnh góc làm việc & Bàn học hiện đại (Modern Workspace / Desk Setup)",
      "Bối cảnh dạo phố & Quán cafe ngoại cảnh (Urban Street & Trendy Cafe)",
      "Bối cảnh thiên nhiên & Ánh sáng hoàng hôn (Golden Hour Outdoor Nature)",
      "Bối cảnh thể thao / Tập gym / Dã ngoại năng động (Athletic & Outdoor Action)",
      "Bối cảnh sự kiện / Dạ tiệc đêm sang trọng (Luxury Evening & Party Event)",
    ],
  },
];

const IMAGE_TYPES = IMAGE_TYPE_GROUPS.flatMap((g) => g.options);

const AI_TOOL_GROUPS = [
  {
    group: "🎨 Midjourney (Đỉnh cao thẩm mỹ & ánh sáng thương mại)",
    options: [
      "Midjourney v6.1 (Sắc nét nhất, chi tiết chất liệu siêu thực)",
      "Midjourney v6.0 (Chuẩn Studio Commercial Photo)",
      "Midjourney Niji v6 (Phong cách minh họa & thời trang Nhật Bản)",
    ],
  },
  {
    group: "⚡ Flux.1 (Chân thực hàng đầu thế giới 2024-2025)",
    options: [
      "Flux.1 Dev (Chi tiết da & vải chân thực tuyệt đối)",
      "Flux.1 Schnell (Tạo ảnh siêu tốc 4 bước)",
      "Flux.1 Pro (Chất lượng thương mại cao cấp nhất)",
    ],
  },
  {
    group: "⚙️ Stable Diffusion & Mã nguồn mở",
    options: [
      "Stable Diffusion 3.5 Large (Độ sắc nét & bố cục vượt trội)",
      "SDXL 1.0 (Stable Diffusion XL linh hoạt)",
      "Fooocus (Tự động tối ưu prompt phong cách e-commerce)",
      "ComfyUI + Flux / SDXL (Quy trình làm việc chuyên sâu)",
    ],
  },
  {
    group: "🌐 Nền tảng AI Phổ biến khác",
    options: [
      "DALL-E 3 (OpenAI - Hiểu ngữ cảnh tự nhiên tiếng Anh)",
      "Google Imagen 3 (Màu sắc sống động, bố cục mượt mà)",
      "Ideogram v2 (Vẽ chữ, logo & typography trên sản phẩm chuẩn xác)",
      "Leonardo.ai (PhotoReal v2 / Kino XL thương mại)",
      "Adobe Firefly Image 3 (An toàn thương mại bản quyền)",
      "SeaArt AI / Krea AI (Tối ưu hình ảnh sản phẩm TMĐT)",
    ],
  },
];

const AI_TOOLS = AI_TOOL_GROUPS.flatMap((g) => g.options);

const SAMPLE_DATA = {
  productName: "Túi xách kẹp nách da bò dập vân cá sấu màu nâu caramel",
  style: "korean_cafe",
  imageType: "Lookbook người mẫu toàn thân mặc/mang sản phẩm (Full-body Lookbook)",
  aiTool: "Midjourney v6.1 (Sắc nét nhất, chi tiết chất liệu siêu thực)",
  modelDemographic: "Nữ châu Á 23 tuổi thanh lịch, trang điểm nhẹ tự nhiên, mặc áo blazer trắng kem",
};

export default function PhotoPrompterPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning, showSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [style, setStyle] = useState(STYLES[0].id);
  const [imageType, setImageType] = useState(IMAGE_TYPES[0]);
  const [aiTool, setAiTool] = useState(AI_TOOLS[0]);
  const [modelDemographic, setModelDemographic] = useState("");

  // Image Upload & Vision AI states
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeKb: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dọn dẹp timer và abort request khi component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Lắng nghe phím dán ảnh Ctrl + V từ clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Hàm xử lý nén và tải ảnh lên an toàn
  const processImageFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
      showWarning("Vui lòng chỉ tải lên tệp hình ảnh (PNG, JPG, WEBP)!", "Sai Định Dạng");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showWarning("Dung lượng ảnh vượt quá 15MB. Vui lòng chọn ảnh chụp nhẹ hơn!", "Ảnh Quá Lớn");
      return;
    }

    try {
      let optimized = await compressImageForAi(file, 1024, 0.82);
      if (optimized && optimized.length > 1.2 * 1024 * 1024) {
        optimized = await compressImageForAi(file, 800, 0.70);
      }

      if (optimized) {
        const cleanBase64 = optimized.trim();
        setImageBase64(cleanBase64);
        const sizeKb = Math.round((cleanBase64.length * 3) / 4 / 1024);
        setImageMeta({ name: file.name, sizeKb });
        showSuccess(`Đã nén tối ưu ảnh sản phẩm (${sizeKb} KB) thành công!`, "Vision AI Ready");
      }
    } catch (err) {
      console.error("Image processing error:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        if (rawBase64 && rawBase64.length < 2 * 1024 * 1024) {
          setImageBase64(rawBase64.trim());
          setImageMeta({ name: file.name, sizeKb: Math.round(file.size / 1024) });
        } else {
          showWarning("Không thể nén ảnh này. Vui lòng dùng ảnh có kích thước nhẹ hơn.", "Ảnh Quá Lớn");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64(null);
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUseSample = () => {
    setIsOfflineMode(false);
    setProductName(SAMPLE_DATA.productName);
    setStyle(SAMPLE_DATA.style);
    setImageType(SAMPLE_DATA.imageType);
    setAiTool(SAMPLE_DATA.aiTool);
    setModelDemographic(SAMPLE_DATA.modelDemographic);

    // Sinh blueprint mẫu tức thì
    const sampleBlueprint = generatePhotoPrompterBlueprint(SAMPLE_DATA);
    setResult(JSON.stringify(sampleBlueprint));
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setIsOfflineMode(false);
    setProductName("");
    setStyle(STYLES[0].id);
    setImageType(IMAGE_TYPES[0]);
    setAiTool(AI_TOOLS[0]);
    setModelDemographic("");
    handleRemoveImage();
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("photo-prompter", false);
    if (!hasAccess) return;

    if (!productName.trim() && !imageBase64) {
      showWarning("Vui lòng tải ảnh sản phẩm hoặc nhập tên & đặc điểm sản phẩm!", "Thiếu Thông Tin");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setIsOfflineMode(false);
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
          error: "Yêu cầu đã quá thời gian phản hồi (120s). Vui lòng thử lại sau.",
        });
      }
    }, 120000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          tool: "photo-prompter",
          inputs: {
            productName: productName.trim() || (imageMeta?.name ? `Sản phẩm ${imageMeta.name}` : "Sản phẩm thương mại"),
            style,
            imageType,
            aiTool,
            modelDemographic: modelDemographic.trim(),
            imageBase64: imageBase64 ? imageBase64.trim() : null,
          },
        }),
      });

      const data = await response.json();

      // Kiểm tra lỗi tài khoản hoặc giới hạn quota
      if (
        response.status === 401 ||
        data?.code === "LOGIN_REQUIRED" ||
        data?.code === "DAILY_LIMIT_EXCEEDED" ||
        data?.code === "QUOTA_EXCEEDED"
      ) {
        showAiError(data);
        return;
      }

      if (!response.ok || !data.success) {
        // Fallback Blueprint tức thì nếu API quá tải (502/503/timeout)
        setIsOfflineMode(true);
        const offlineBlueprint = generatePhotoPrompterBlueprint({
          productName: productName.trim() || "Sản phẩm thương mại",
          style,
          imageType,
          aiTool,
          modelDemographic: modelDemographic.trim(),
          imageBase64,
        });
        setResult(JSON.stringify(offlineBlueprint));
        setRefreshTrigger((prev) => prev + 1);
        return;
      }

      setIsOfflineMode(Boolean(data.isOfflineFallback));
      setResult(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      if (error?.name === "AbortError" || controller.signal.aborted) {
        showWarning("Đã dừng quá trình xử lý theo yêu cầu của bạn.", "Đã Hủy");
        return;
      }

      // Kích hoạt Offline Blueprint an toàn tuyệt đối khi lỗi mạng
      setIsOfflineMode(true);
      const offlineBlueprint = generatePhotoPrompterBlueprint({
        productName: productName.trim() || "Sản phẩm thương mại",
        style,
        imageType,
        aiTool,
        modelDemographic: modelDemographic.trim(),
        imageBase64,
      });
      setResult(JSON.stringify(offlineBlueprint));
      showSuccess("Đã kích hoạt bộ prompt Studio dự phòng chuẩn sàn TMĐT!", "Offline Mode");
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
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full">
      {/* Modals kiểm tra quyền truy cập */}
      <GateModals />

      {/* 1. Header Navigation & Quick Actions */}
      <div className="shrink-0 mb-3 space-y-2">
        {/* Mobile Top Bar: Breadcrumb + Badges */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="photo-prompter" refreshTrigger={refreshTrigger} historyOnly />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            {/* Desktop Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/tools" className="hover:text-violet-600 transition-colors flex items-center gap-1 text-slate-500">
                <ArrowLeft size={13} /> Kho Công Cụ AI
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Hình Ảnh &amp; Media</span>
            </div>

            {/* Title Row */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200/80 dark:border-violet-800/80 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xs shrink-0">
                <Camera size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Prompt Chụp Ảnh Studio &amp; Người Mẫu Ảo
                  </h1>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
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
                  Soi ảnh thật bằng Vision AI &amp; tạo bộ prompt chuẩn xưởng 8K tăng tỷ lệ click (CTR) và chuyển đổi
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="photo-prompter" refreshTrigger={refreshTrigger} />
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
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
        resultLabel="Bộ Prompt Studio"
      />

      {/* Bố cục Form & Kết quả */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Camera size={15} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Cấu Hình Studio Ảo &amp; Thị Giác AI
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
                  >
                    Dữ liệu mẫu
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="hidden sm:flex text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Làm mới
                  </button>
                </div>
              </div>

              {/* 1. TẢI ẢNH SẢN PHẨM THẬT (Vision AI Analysis) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-violet-500" />
                    Ảnh Sản Phẩm Thực Tế (Khuyên dùng)
                  </label>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                    Ctrl + V để dán nhanh
                  </span>
                </div>

                {!imageBase64 ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                      isDragging
                        ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-violet-50/30"
                    }`}
                  >
                    <Upload size={20} className="text-slate-400 group-hover:text-violet-500 mb-1.5 transition-colors" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      Kéo thả, bấm tải ảnh hoặc dán (Ctrl + V)
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 text-center">
                      AI sẽ soi chất liệu, màu sắc và phom dáng thật để tạo prompt chuẩn mẫu 100%
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-violet-200 dark:border-violet-800/80 p-2.5 bg-violet-50/30 dark:bg-violet-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={imageBase64}
                        alt="Ảnh sản phẩm thật"
                        className="w-12 h-12 object-cover rounded-lg border border-violet-300 dark:border-violet-700 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span>Đã nhận diện ảnh thật</span>
                          {imageMeta?.sizeKb ? (
                            <span className="text-[10px] font-mono text-violet-700 dark:text-violet-300 font-semibold ml-1 px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-900/60 border border-violet-300/60 dark:border-violet-700/60">
                              {imageMeta.sizeKb} KB
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[200px]">
                          {imageMeta?.name || "Vision AI sẽ phân tích đặc tả vật lý sản phẩm"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      title="Gỡ bỏ ảnh này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Tên Sản Phẩm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Sản Phẩm &amp; Đặc Điểm Ngoại Quan {!imageBase64 && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Son kem lì màu đỏ thuần vỏ nhung mịn, thân son mạ viền vàng kim loại..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium"
                />
              </div>

              {/* 3. Phong Cách Bối Cảnh Studio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette size={14} className="text-violet-500" />
                  Phong Cách Không Gian Bối Cảnh
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STYLES.map((st) => {
                    const isSelected = style === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStyle(st.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-900 dark:text-violet-200 font-bold ring-2 ring-violet-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium"
                        }`}
                      >
                        <div className="font-semibold text-[13px]">{st.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {st.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Loại Hình Ảnh & Nền Tảng AI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Góc Chụp Ưu Tiên
                    </label>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                      {IMAGE_TYPES.length} tùy chọn
                    </span>
                  </div>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium cursor-pointer"
                  >
                    {IMAGE_TYPE_GROUPS.map((grp) => (
                      <optgroup
                        key={grp.group}
                        label={grp.group}
                        className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      >
                        {grp.options.map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="bg-white dark:bg-slate-800 font-normal text-slate-700 dark:text-slate-200"
                          >
                            {type}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nền Tảng AI Tạo Ảnh
                    </label>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                      {AI_TOOLS.length} nền tảng
                    </span>
                  </div>
                  <select
                    value={aiTool}
                    onChange={(e) => setAiTool(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium cursor-pointer"
                  >
                    {AI_TOOL_GROUPS.map((grp) => (
                      <optgroup
                        key={grp.group}
                        label={grp.group}
                        className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                      >
                        {grp.options.map((tool) => (
                          <option
                            key={tool}
                            value={tool}
                            className="bg-white dark:bg-slate-800 font-normal text-slate-700 dark:text-slate-200"
                          >
                            {tool}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Đặc Điểm Người Mẫu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User size={14} className="text-violet-500" />
                  Đặc Điểm Người Mẫu Ảo (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={modelDemographic}
                  onChange={(e) => setModelDemographic(e.target.value)}
                  placeholder="VD: Nữ Việt Nam 22 tuổi, da tự nhiên, tóc buộc cao, trang phục công sở thanh lịch..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    loading
                      ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/25 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-white" />
                      <span>Đang Tạo Prompt ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} /> Tạo Bộ Prompt Studio Chuẩn Xưởng Ngay
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

        {/* Cột phải: Kết quả trực quan (Chữ trắng nền đen, cuộn cả trang trên Mobile) */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col w-full lg:min-h-0 lg:h-full lg:overflow-hidden pb-20 lg:pb-0`}>
          <PhotoPrompterOutput
            result={result}
            loading={loading}
            productName={productName}
            onUseSample={handleUseSample}
            elapsedSeconds={elapsedSeconds}
            onCancel={handleCancel}
            productImage={imageBase64}
            isOfflineMode={isOfflineMode}
            onRetryWithAi={handleGenerate}
          />
        </div>
      </div>
    </div>
  );
}
