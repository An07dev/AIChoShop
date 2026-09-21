"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  MessageSquareCheck,
  DollarSign,
  Gift,
  HelpCircle,
  Zap,
  Tag,
  ShieldCheck,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { ObjectionKillerOutput } from "@/components/tools/ObjectionKillerOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";
import { MobileToolTabs } from "@/components/tools/MobileToolTabs";

const COMMON_OBJECTIONS = [
  "Giá đắt quá / Shop khác bán rẻ hơn nhiều",
  "Để anh/chị suy nghĩ thêm đã nhé",
  "Sợ chất lượng không giống hình / sợ bị lừa",
  "Phí ship đắt quá, có freeship không em?",
  "Hôm nay chưa có lương, có gì tuần sau chị mua",
];

const SAMPLE_DATA = {
  productName: "Nồi chiên không dầu điện tử 6L mặt kính cường lực",
  price: "890.000đ",
  customerObjection: "Bên shop kia bán mẫu y hệt có 650k thôi em ơi, shop bán 890k đắt quá, để chị xem lại đã nhé.",
  flexibleOffer: "Tặng kèm kẹp gắp inox 304 + voucher giảm 40k nếu chốt ngay phiên chat, bảo hành 12 tháng 1 đổi 1 tại nhà.",
};

const SAMPLE_OUTPUT = `## 🧠 1. GIẢI MÃ TÂM LÝ ẨN SAU LỜI TỪ CHỐI
- **Nỗi sợ thực sự của khách:** Khách lo ngại mua phải sản phẩm đắt mà không xứng đáng hoặc hàng giả, kém chất lượng. Họ cũng quan ngại so sánh giá với shop khác, lo lắng mua không phải là lựa chọn tốt nhất.
- **Sai lầm nhân viên thường mắc:** Đơn giản chỉ ra giá thấp hơn của shop kia mà không chứng minh được giá trị vượt trội của sản phẩm, khiến khách cảm thấy bị ép mua.

---

## 💬 2. BA PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI TỨC THÌ
### 💎 Phương Án 1: Đánh Vào Giá Trị Vượt Trội (Value Focus - Khuyên Dùng)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em hiểu hoàn toàn tâm lý của Anh/Chị. Nồi chiên không dầu điện tử 6L của shop chúng em không chỉ chất lượng vượt trội hơn so với nhiều sản phẩm cùng loại mà còn bền gấp đôi. Với mức giá 890k, em đảm bảo rằng Anh/Chị sẽ hài lòng với quyết định mua hàng của mình. 
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách chê đắt nhưng thực sự thích sản phẩm.

### ⚡ Phương Án 2: Tung Deal Khan Hiếm 15 Phút (Urgency & Exclusive Offer)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị, em có một ưu đãi đặc biệt chỉ trong 15 phút nữa. Nếu Anh/chị đặt hàng ngay bây giờ, em sẽ tặng kèm kẹp gắp inox 304 và voucher giảm 40k cho Anh/chị. Chỉ còn 15 phút nữa, đừng bỏ lỡ cơ hội tiết kiệm 40k nhé!
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách đòi 'suy nghĩ thêm' hoặc so sánh giá.

### 🛡️ Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em rất hiểu Anh/chị lo lắng về chất lượng. Shop chúng em cam kết bảo hành 12 tháng 1 đổi 1 tại nhà, đồng thời chịu 100% phí ship nếu Anh/chị không hài lòng. Em xin đảm bảo, Anh/chị sẽ không phải lo lắng về bất kỳ rủi ro nào.
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách sợ hàng không giống ảnh hoặc sợ bị lừa.

---

## 🚀 3. KỸ THUẬT "CÂU HỎI MỞ" BUỘC KHÁCH PHẢI TRẢ LỜI
- **Câu hỏi lựa chọn 1:** 
  \`\`\`markdown
  Em có thể giúp Anh/chị chọn màu sắc và kích thước phù hợp không? Điều này sẽ giúp Anh/chị quyết định nhanh hơn.
  \`\`\`
- **Câu hỏi lựa chọn 2:** 
  \`\`\`markdown
  Em có thể gửi thêm địa chỉ nhận hàng cho em, để em kịp thời gửi hàng cho Anh/chị?
  \`\`\`

---

## ⏱️ 4. NGUYÊN TẮC VÀNG KHI TRỰC CHAT SÀN
- **3 mẹo giúp tỷ lệ chốt đơn (Conversion Rate) trên khung chat tăng từ 15% lên 40%:**
  1. **Luôn đồng cảm và tạo sự tin tưởng:** Đồng cảm với khách hàng để làm giảm sự đề phòng và tạo cảm giác an tâm.
  2. **Cung cấp thông tin chi tiết và minh bạch:** Giải thích rõ về giá trị sản phẩm, ưu đãi và cam kết bảo hành để khách hàng hiểu rõ.
  3. **Đặt câu hỏi mở:** Hỏi khách hàng về nhu cầu và mong muốn để gợi ý họ đưa ra quyết định, thay vì để họ im lặng.`;

export default function ObjectionKillerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileTab, setMobileTab] = useState<"form" | "result">("form");

  // Form states
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [customerObjection, setCustomerObjection] = useState("");
  const [flexibleOffer, setFlexibleOffer] = useState("");

  const handleUseSample = () => {
    setProductName(SAMPLE_DATA.productName);
    setPrice(SAMPLE_DATA.price);
    setCustomerObjection(SAMPLE_DATA.customerObjection);
    setFlexibleOffer(SAMPLE_DATA.flexibleOffer);
    setResult(SAMPLE_OUTPUT);
    setMobileTab("result");
  };

  const handleResetForm = () => {
    setProductName("");
    setPrice("");
    setCustomerObjection("");
    setFlexibleOffer("");
    setResult("");
  };

  const handleSelectCommonObjection = (text: string) => {
    setCustomerObjection(text);
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("objection-killer", false);
    if (!hasAccess) return;

    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm đang tư vấn!", "Thiếu Thông Tin");
      return;
    }
    if (!customerObjection.trim()) {
      showWarning("Vui lòng nhập lời từ chối hoặc băn khoăn của khách hàng!", "Thiếu Thông Tin");
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
          tool: "objection-killer",
          inputs: {
            productName: productName.trim(),
            price: price.trim(),
            customerObjection: customerObjection.trim(),
            flexibleOffer: flexibleOffer.trim(),
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft size={13} /> Kho công cụ AI
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <Crown size={12} className="text-amber-600 dark:text-amber-400" />
              VIP
            </span>
            <AiUsageBadge tool="objection-killer" refreshTrigger={refreshTrigger} historyOnly />
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
              <span className="text-slate-600 dark:text-slate-300">Tư Vấn &amp; Chốt Sale</span>
            </div>

            {/* Title Row: Centered icon, text & minimal mobile reset button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                <MessageSquareCheck size={20} className="sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    Bẻ Gãy Lời Từ Chối &amp; Trợ Lý Chốt Đơn 1-1
                  </h1>
                  {/* Minimal icon-only reset button: ONLY ON MOBILE */}
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="md:hidden w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
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
                  Xử lý mượt mà câu nói &ldquo;đắt quá&rdquo;, &ldquo;suy nghĩ thêm&rdquo; trong tin nhắn chat sàn. Bẻ gãy mọi băn khoăn và chốt khách ngay trong 3 phút.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop ONLY) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <AiUsageBadge tool="objection-killer" refreshTrigger={refreshTrigger} />
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
        resultLabel="Kịch Bản Chốt Đơn"
      />

      {/* Bố cục Form & Kết quả (Cuộn độc lập) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className={`${mobileTab === "form" ? "flex" : "hidden lg:flex"} lg:col-span-5 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-24 lg:pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <MessageSquareCheck size={15} />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Tình Huống Từ Chối Của Khách
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseSample}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
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

              {/* 1. Tên Sản Phẩm & Giá */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sản Phẩm Đang Tư Vấn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Kem dưỡng ẩm phục hồi B5..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mức Giá Bán
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="VD: 289k"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Lời từ chối */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lời Từ Chối / Câu Khách Vừa Nhắn <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {COMMON_OBJECTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCommonObjection(item)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={customerObjection}
                  onChange={(e) => setCustomerObjection(e.target.value)}
                  placeholder={`VD: "Đắt quá em ơi, bên kia bán có 180k mà shop bán tận 250k..." hoặc "Để anh hỏi ý kiến vợ đã rồi có gì báo lại em sau nhé!"`}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium"
                />
              </div>

              {/* 3. Ưu Đãi Nhượng Bộ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Gift size={14} className="text-emerald-500" />
                  Ưu Đãi / Quyền Lợi Shop Có Thể Hỗ Trợ (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={flexibleOffer}
                  onChange={(e) => setFlexibleOffer(e.target.value)}
                  placeholder="VD: Giảm thêm 20k qua voucher kín, tặng quà mini dùng thử, miễn phí đổi size tận nhà, freeship..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium"
                />
              </div>

              {/* Nút hành động */}
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Soạn Kịch Bản Bẻ Gãy Từ Chối...
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Bẻ Gãy Từ Chối & Lên Kịch Bản Chốt Ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan */}
        <div className={`${mobileTab === "result" ? "flex" : "hidden lg:flex"} lg:col-span-7 flex-col min-h-0 lg:h-full lg:overflow-hidden`}>
          <ObjectionKillerOutput
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
