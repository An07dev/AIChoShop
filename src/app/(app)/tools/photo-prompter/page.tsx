"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { PhotoPrompterOutput } from "@/components/tools/PhotoPrompterOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

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

const SAMPLE_OUTPUT = `## 📸 1. TOP 5 BỘ PROMPT TIẾNG ANH CHUẨN STUDIO THƯƠNG MẠI
*(Copy nguyên văn đoạn mã code tiếng Anh vào Midjourney hoặc Flux để tạo ảnh chất lượng 8K)*

### 🌟 Prompt 1: Góc Chụp Toàn Cảnh (Master Hero Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A beautifully crafted leather bag with alligator embossed design in caramel brown color, lying on a natural wood surface with a soft, warm light from the ceiling. The bag is presented in a low-angle hero shot, emphasizing its luxurious texture and craftsmanship. The subtle color palette of beige and white around the bag adds to the warm and cozy Nordic atmosphere. Use an 85mm prime lens with f/1.8 aperture for a shallow depth of field, creating a bokeh effect. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Góc chụp từ dưới lên tạo cảm giác bề thế và cao cấp, nhấn mạnh vào chất liệu và họa tiết da bò dập vân cá sấu, tạo cảm xúc ấm cúng của phong cách Bắc Âu.]

### 🔍 Prompt 2: Góc Chụp Cận Cảnh Chi Tiết (Macro Detail Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
Zoom in on the intricate texture of the alligator embossed leather in a bag with caramel brown color. The surface of the leather is captured with an 85mm prime lens at f/1.8, showing the fine details and the soft yet distinct embossed patterns. The depth of field is shallow, creating a smooth, blurred background. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Chú trọng vào chi tiết chất liệu và họa tiết da bò, tạo cảm giác tinh xảo và cao cấp.]

### 💃 Prompt 3: Góc Lookbook Người Mẫu (Model Lookbook Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A young Asian woman in her early 20s, wearing a light white blazer, interacts naturally with a caramel brown alligator embossed leather bag. She is standing in a cozy, Nordic-style living space with beige and white tones, where the wooden elements and linen fabrics complement the overall aesthetic. The model’s subtle makeup and elegant demeanor enhance the look of sophistication and grace. Octane render, photorealistic, 8k --ar 3:4 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh lookbook với người mẫu tự nhiên tương tác với sản phẩm, phản ánh tinh thần phong cách Bắc Âu ấm cúng.]

### ☕ Prompt 4: Bối Cảnh Đời Sống Thực Tế (Lifestyle In-Context)
- **English Prompt (Ready to Copy):**
\`\`\`
A caramel brown alligator embossed leather bag gracefully placed in a cozy, Nordic-style living space. The room is decorated with natural wood furniture and soft, linen-covered cushions. The lighting is warm and natural, creating a cozy and inviting atmosphere. The bag is positioned on a wooden table, surrounded by elements that reflect the simplicity and warmth of the Nordic style, such as woolen blankets and wooden decor. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh sản phẩm trong không gian sống thực tế, phản ánh phong cách Bắc Âu ấm cúng và tông màu be/trắng.]

### ✨ Prompt 5: Phong Cách Tối Giản Nghệ Thuật (High-end Editorial)
- **English Prompt (Ready to Copy):**
\`\`\`
A high-end editorial style shot of a caramel brown alligator embossed leather bag, placed on a minimalist wooden pedestal with soft, diffused lighting. The bag is presented with a soft, elegant tone, reminiscent of Vogue or Elle magazine covers. The composition is clean and modern, highlighting the luxurious texture and the intricate embossed patterns. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh theo phong cách tạp chí thời trang, nhấn mạnh vào vẻ đẹp tinh tế và cao cấp của sản phẩm.]

---

## 🚫 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT)
*(Dán vào ô Negative Prompt / --no để ảnh không bị lỗi)*
\`\`\`
deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look
\`\`\`

---

## 💡 3. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI
- **Mẹo 1:** Đảm bảo rằng logo của bạn có thể được dễ dàng thêm vào hoặc thay thế bằng công cụ inpaint sau khi tạo ảnh AI.
- **Mẹo 2:** Sử dụng công cụ inpaint để xóa bỏ bất kỳ phần nào không mong muốn từ ảnh AI, ví dụ: người mẫu hoặc bối cảnh không cần thiết.
- **Mẹo 3:** Cân nhắc việc thêm một lớp mờ nhẹ cho logo hoặc sản phẩm để tránh nhìn thấy chúng quá rõ ràng trong ảnh cuối cùng, giúp hình ảnh trở nên tự nhiên hơn.`;

export default function PhotoPrompterPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [productName, setProductName] = useState("");
  const [style, setStyle] = useState(STYLES[0].id);
  const [imageType, setImageType] = useState(IMAGE_TYPES[0]);
  const [aiTool, setAiTool] = useState(AI_TOOLS[0]);
  const [modelDemographic, setModelDemographic] = useState("");

  const handleUseSample = () => {
    setProductName(SAMPLE_DATA.productName);
    setStyle(SAMPLE_DATA.style);
    setImageType(SAMPLE_DATA.imageType);
    setAiTool(SAMPLE_DATA.aiTool);
    setModelDemographic(SAMPLE_DATA.modelDemographic);
    setResult(SAMPLE_OUTPUT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setStyle(STYLES[0].id);
    setImageType(IMAGE_TYPES[0]);
    setAiTool(AI_TOOLS[0]);
    setModelDemographic("");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("photo-prompter", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm và đặc điểm chi tiết!", "Thiếu Thông Tin");
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
          tool: "photo-prompter",
          inputs: {
            productName: productName.trim(),
            style,
            imageType,
            aiTool,
            modelDemographic: modelDemographic.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAiError(data);
        return;
      }

      setResult(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      showAiError({
        code: "NETWORK_ERROR",
        error: "Không thể kết nối đến hệ thống AI. Vui lòng kiểm tra lại mạng hoặc thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0 h-full lg:overflow-hidden">
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

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200/80 dark:border-violet-800/80 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xs shrink-0">
                <Camera size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    AI Prompt Chụp Ảnh Studio &amp; Người Mẫu Ảo
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
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
                  Biến sản phẩm thực tế thành những bộ Prompt tiếng Anh chuẩn studio thương mại
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
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

      {/* Bố cục Form & Kết quả (Cuộn độc lập) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Camera size={15} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Cấu Hình Studio Ảo AI
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

              {/* 1. Tên Sản Phẩm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên Sản Phẩm & Đặc Điểm Ngoại Quan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Son kem lì màu đỏ thuần vỏ nhung mịn, thân son mạ viền vàng kim loại..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none font-medium"
                />
              </div>

              {/* 2. Phong Cách Bối Cảnh Studio */}
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
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${isSelected
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

              {/* 3. Loại Hình Ảnh & Nền Tảng AI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Góc Chụp & Loại Hình Ảnh
                    </label>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                      {IMAGE_TYPES.length} góc chụp
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
                      Công Cụ AI Tạo Ảnh
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

              {/* 4. Đặc Điểm Người Mẫu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User size={14} className="text-violet-500" />
                  Đặc Điểm Người Mẫu Ảo (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={modelDemographic}
                  onChange={(e) => setModelDemographic(e.target.value)}
                  placeholder="VD: Nữ Việt Nam 22 tuổi, mặt V-line, tóc buộc cao, trang phục công sở nhẹ nhàng..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                />
              </div>

              {/* Nút hành động */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/25 active:scale-[0.99]"
                  }`}
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Tạo Bộ Prompt Chuyên Nghiệp...
                  </>
                ) : (
                  <>
                    <Camera size={16} /> Tạo Bộ Prompt Studio Chuẩn Xưởng Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <PhotoPrompterOutput
            result={result}
            loading={loading}
            productName={productName}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
