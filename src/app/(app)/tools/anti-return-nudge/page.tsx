"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  PackageCheck,
  Truck,
  Store,
  Tag,
  DollarSign,
  AlertOctagon,
  PhoneCall,
  Clock,
  ShieldCheck,
  Send,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { AntiReturnNudgeOutput } from "@/components/tools/AntiReturnNudgeOutput";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const SCENARIOS = [
  {
    id: "just_ordered",
    label: "📦 Khách Vừa Đặt Đơn COD",
    desc: "Xác nhận đơn, tạo sự hào hứng và kích hoạt trách nhiệm nhận hàng",
  },
  {
    id: "cancel_requested",
    label: "🛑 Khách Bấm Yêu Cầu Hủy Đơn",
    desc: "Cứu đơn khẩn cấp trước khi giao: hỗ trợ đổi size/màu hoặc tặng thêm quà",
  },
  {
    id: "delivery_failed_1",
    label: "🚚 Shipper Báo Giao Thất Bại Lần 1",
    desc: "Khách bận/thuê bao, cứu đơn đang trên đà bị hoàn ngược về kho",
  },
  {
    id: "delayed_shipment",
    label: "⏳ Đơn Hàng Giao Chậm Do Kho Vận",
    desc: "Chủ động trấn an khách để ngăn chặn tâm lý nản lòng bấm hủy",
  },
  {
    id: "expensive_cod",
    label: "💎 Đơn COD Giá Trị Cao (>500k)",
    desc: "Lọc đơn ảo, xác thực nhu cầu thật để tránh rủi ro vỡ nợ cước vận chuyển",
  },
];

const SAMPLE_DATA = {
  shopName: "Aicho Tech Store",
  productName: "Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro",
  codAmount: "450.000",
  scenario: "delivery_failed_1",
  customerReason: "Shipper báo gọi 2 cuộc khách không nhấc máy, bưu cục chuẩn bị chuyển hoàn",
  compensationOffer: "Tặng kèm 01 Cáp sạc bọc dù chống đứt trị giá 50k trong kiện hàng, hỗ trợ hẹn shipper giao lại theo giờ khách rảnh",
};

const SAMPLE_OUTPUT = `## 💬 1. KỊCH BẢN TIN NHẮN CHAT SÀN (SHOPEE / TIKTOK SHOP)

### 📱 Mẫu 1: Ngắn Gọn & Hiển Thị Hoàn Hảo (Dưới 350 ký tự)
**[Tin nhắn gửi trực tiếp qua khung chat sàn cho khách hàng]**

Chào [Tên Khách Hàng],  
Xin chào bạn! Đây là [Tên Shop] - Aicho Tech Store. Đơn hàng của bạn [Mã Đơn] đang được giao đi, với sản phẩm [Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro] trị giá 450k. 
Để đảm bảo bạn nhận được hàng đúng cách, chúng tôi sẽ tặng kèm 1 cáp sạc bọc dù chống đứt trị giá 50k trong kiện hàng này. 
Hãy mở máy và nhận hàng khi shipper liên lạc. Nếu bạn không nghe máy, xin vui lòng liên hệ shop để đổi giờ giao hàng thuận tiện.
Cảm ơn bạn đã tin tưởng Aicho Tech Store. 🙏

---

### 🎁 Mẫu 2: Đánh Vào Quyền Lợi & Tạo Trách Nhiệm (Kèm Quà Tặng / Cam Kết)
**[Tin nhắn gửi trực tiếp qua khung chat sàn cho khách hàng]**

Chào [Tên Khách Hàng],  
Xin chào bạn! Đây là [Tên Shop] - Aicho Tech Store. Đơn hàng của bạn [Mã Đơn] đang được giao đi, với sản phẩm [Tai nghe Bluetooth chống ồn chủ động ANC AichoPods Pro] trị giá 450k. 
Để phục vụ khách hàng tốt hơn, chúng tôi đã chuẩn bị món quà bất ngờ là 1 cáp sạc bọc dù chống đứt trị giá 50k bên trong gói hàng. 
Đây là món quà đặc biệt của shop dành riêng cho bạn. 
Hãy mở máy và nhận hàng khi shipper liên lạc. Nếu bạn không nghe máy, xin vui lòng liên hệ shop để đổi giờ giao hàng thuận tiện.
Cảm ơn bạn đã tin tưởng Aicho Tech Store. 🙏

---

## 📞 2. KỊCH BẢN GỌI ĐIỆN THOẠI / SMS TRỰC TIẾP

### 🎙️ Lời Thoại Cuộc Gọi (Kịch bản 45 giây)
- **Lời mở đầu:** "Chào [Tên Khách Hàng], đây là [Tên Nhân Viên CSKH] từ Aicho Tech Store."
- **Xử lý tình huống:** "Xin lỗi, shipper đã liên hệ 2 lần nhưng khách không nhấc máy. Shop sẵn sàng hỗ trợ đổi giờ giao hàng thuận tiện cho bạn. Nếu bạn có thời gian, vui lòng mở máy nhận hàng. 
Nếu không thể mở máy, bạn có thể liên hệ shop vào [Số Điện Thoại Shop] để đổi thời gian giao hàng. 
Hãy nhớ kiểm tra kỹ sản phẩm trước khi nhận và phản hồi ngay nếu có bất kỳ vấn đề nào."
- **Chốt hẹn giao hàng:** "Hãy hẹn shipper giao hàng vào [Thời Gian Dự Kiến] để đảm bảo bạn nhận được hàng đúng lúc. Cảm ơn bạn đã tin tưởng [Tên Shop]!"

### 📩 Mẫu SMS / Zalo Nhắn Tin Nhanh (Dưới 160 ký tự)
**[Mẫu tin nhắn SMS ngắn gọn thông báo kiện hàng quan trọng đang trên đường tới, xin phép nhờ khách chú ý cuộc gọi của shipper]**

Chào [Tên Khách Hàng],  
Đơn hàng [Mã Đơn] trị giá 450k đang trên đường tới. Shipper liên lạc 2 lần nhưng khách không nhấc máy. 
Vui lòng mở máy nhận hàng hoặc liên hệ shop để đổi giờ giao hàng. 
Cảm ơn bạn đã tin tưởng Aicho Tech Store! 🙏

---

## 🛡️ 3. KẾ HOẠCH HÀNH ĐỘNG DỰ PHÒNG TRÊN SELLER CENTER (PLAN B)

### Thao tác trên hệ thống sàn:
1. Truy cập Seller Center trên sàn Shopee/TikTok Shop.
2. Tìm đơn hàng [Mã Đơn].
3. Hoãn hoàn hàng (nếu có) hoặc yêu cầu giao lại lần 2, lần 3.
4. Cập nhật trạng thái đơn hàng và ghi chú về việc giao lại.

### Phối hợp với Shipper / Bưu cục:
1. Liên hệ tổng đài vận chuyển hoặc bưu cục phát để thông báo về tình huống.
2. Yêu cầu hỗ trợ giao lại hàng vào thời gian thuận lợi cho khách.
3. Đưa ra đề xuất về việc đổi địa chỉ nhận hoặc thời gian giao hàng.

---

## 🧠 4. BÍ QUYẾT TÂM LÝ HỌC CHỐNG BOM HÀNG TỪ CHUYÊN GIA

### 3 Mẹo tâm lý học thực chiến giúp tỷ lệ nhận hàng tăng vọt 20-30%
1. **Tạo cảm giác chờ đợi háo hức:** Đưa ra các thông tin chi tiết về sản phẩm, ưu đãi kèm theo, và nhấn mạnh việc khách hàng đang chờ đợi một món quà đặc biệt. Điều này giúp tăng sự quan tâm và mong chờ từ khách hàng.
2. **Kỹ thuật ràng buộc cam kết nhỏ:** Yêu cầu khách hàng xác nhận thời gian giao hàng hoặc để lại số điện thoại để nhận hàng. Việc ràng buộc khách hàng bằng một cam kết nhỏ như vậy làm tăng khả năng họ thực hiện cam kết.
3. **Nhắc nhở văn minh về công sức người lao động:** Trong các tin nhắn hoặc lời thoại, nhấn mạnh về công sức và tâm huyết của đội ngũ shipper và nhân viên vận chuyển. Điều này tạo ra một cảm giác trách nhiệm và sự trân trọng từ phía khách hàng.`;

export default function AntiReturnNudgePage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [shopName, setShopName] = useState("");
  const [productName, setProductName] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [scenario, setScenario] = useState(SCENARIOS[2].id);
  const [customerReason, setCustomerReason] = useState("");
  const [compensationOffer, setCompensationOffer] = useState("");

  const handleUseSample = () => {
    setShopName(SAMPLE_DATA.shopName);
    setProductName(SAMPLE_DATA.productName);
    setCodAmount(SAMPLE_DATA.codAmount);
    setScenario(SAMPLE_DATA.scenario);
    setCustomerReason(SAMPLE_DATA.customerReason);
    setCompensationOffer(SAMPLE_DATA.compensationOffer);
    setResult(SAMPLE_OUTPUT);
  };

  const handleResetForm = () => {
    setShopName("");
    setProductName("");
    setCodAmount("");
    setScenario(SCENARIOS[0].id);
    setCustomerReason("");
    setCompensationOffer("");
    setResult("");
  };

  const handleGenerate = async () => {
    const hasAccess = await checkAccess("anti-return-nudge", false);
    if (!hasAccess) return;

    if (!shopName.trim()) {
      showWarning("Vui lòng nhập tên shop hoặc gian hàng!", "Thiếu Thông Tin");
      return;
    }
    if (!productName.trim()) {
      showWarning("Vui lòng nhập tên sản phẩm của đơn hàng!", "Thiếu Thông Tin");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "anti-return-nudge",
          inputs: {
            shopName: shopName.trim(),
            productName: productName.trim(),
            codAmount: codAmount.trim(),
            scenario,
            customerReason: customerReason.trim(),
            compensationOffer: compensationOffer.trim(),
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

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Vận Hành & Phòng Thủ Đơn</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2">
              <PackageCheck className="text-emerald-500" /> AI Chống Hoàn Hàng & Cứu Đơn COD
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-xs uppercase tracking-wider">
              <Crown size={11} className="text-amber-600 dark:text-amber-400" />
              VIP TOOL
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Xử lý triệt để nỗi đau bom hàng: Tin nhắn xác nhận kích hoạt trách nhiệm, cứu đơn khi khách đòi hủy và ứng cứu khi shipper báo giao thất bại lần 1.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiUsageBadge tool="anti-return-nudge" refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Bố cục Form & Kết quả */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* Cột trái: Form nhập liệu */}
        <div className="lg:col-span-5 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-2">
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông Tin Đơn Hàng COD
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseSample}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                Dữ liệu mẫu
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Làm mới
              </button>
            </div>
          </div>

          {/* 1. Tên Shop */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên Gian Hàng / Shop <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="VD: Aicho Tech, Tiệm Giày Sneaker..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <Store size={15} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          {/* 2. Tên Sản Phẩm & Tiền COD */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên Sản Phẩm <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Tai nghe bluetooth ANC..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <Tag size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiền COD (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder="350.000"
                  className="w-full pl-8 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <DollarSign size={14} className="absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* 3. Tình huống xử lý */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Tình Huống Đơn Hàng Cần Xử Lý
            </label>
            <div className="space-y-2">
              {SCENARIOS.map((sc) => {
                const isSelected = scenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setScenario(sc.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs"
                        : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? "text-emerald-900 dark:text-emerald-200"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {sc.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                      {sc.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Lý do từ khách / bối cảnh */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Lý Do Khách Đưa Ra / Bối Cảnh Thực Tế (Không bắt buộc)
            </label>
            <input
              type="text"
              value={customerReason}
              onChange={(e) => setCustomerReason(e.target.value)}
              placeholder="VD: Đi công tác không nhận được, Shipper gọi đúng lúc họp, Thấy shop khác rẻ hơn..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 5. Ưu đãi giữ chân / giải pháp shop có thể hỗ trợ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Ưu Đãi Cứu Đơn Hoặc Giải Pháp Hỗ Trợ (Không bắt buộc)
            </label>
            <textarea
              rows={2}
              value={compensationOffer}
              onChange={(e) => setCompensationOffer(e.target.value)}
              placeholder="VD: Hỗ trợ đổi màu/size miễn phí tận nơi, tặng thêm quà bí mật trong kiện hàng, giảm 20k tiền ship..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Nút bấm Tạo Kịch Bản */}
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
                <Sparkles size={16} className="animate-spin" /> Đang Lên Kịch Bản Cứu Đơn...
              </>
            ) : (
              <>
                <PackageCheck size={16} /> Tạo Kịch Bản Chống Bom & Cứu Đơn
              </>
            )}
          </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả trực quan */}
        <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <AntiReturnNudgeOutput
            result={result}
            loading={loading}
            shopName={shopName}
            productName={productName}
            scenario={scenario}
            onUseSample={handleUseSample}
          />
        </div>
      </div>
    </div>
  );
}
