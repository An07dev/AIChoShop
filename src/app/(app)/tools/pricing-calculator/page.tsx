"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Calculator,
  Store,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Copy,
  Info,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
  Percent,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

// BẢNG DANH MỤC NGÀNH HÀNG CHUẨN THỰC TẾ 2026
const CATEGORIES = [
  { id: "fashion", name: "Thời trang & Phụ kiện", commissionNormal: 4.5, commissionMall: 7.0, defaultReturn: 12 },
  { id: "beauty", name: "Mỹ phẩm & Chăm sóc sắc đẹp", commissionNormal: 4.0, commissionMall: 6.5, defaultReturn: 4 },
  { id: "electronics", name: "Điện tử & Phụ kiện công nghệ", commissionNormal: 3.0, commissionMall: 5.0, defaultReturn: 2 },
  { id: "home", name: "Gia dụng & Đời sống", commissionNormal: 4.0, commissionMall: 6.0, defaultReturn: 4 },
  { id: "mom_baby", name: "Mẹ & Bé", commissionNormal: 4.0, commissionMall: 6.0, defaultReturn: 3 },
  { id: "groceries", name: "Bách hóa online & Thực phẩm", commissionNormal: 3.5, commissionMall: 5.5, defaultReturn: 2 },
  { id: "other", name: "Ngành hàng tổng hợp khác", commissionNormal: 4.0, commissionMall: 6.0, defaultReturn: 3 },
];

export default function PricingCalculator() {
  const { checkAccess, GateModals } = useToolGate();

  // 1. Chế độ tính toán:
  // "target_price" = Từ Giá vốn + % Lời mong muốn -> Ra Giá bán đề xuất
  // "target_profit" = Từ Giá bán đối thủ / giá muốn bán -> Thẩm định Lãi ròng thực nhận
  const [calcMode, setCalcMode] = useState<"target_price" | "target_profit">("target_price");

  // 2. Nền tảng & Loại shop
  const [platform, setPlatform] = useState<"Shopee" | "TikTok">("Shopee");
  const [shopType, setShopType] = useState<"normal" | "mall">("normal");
  const [selectedCategory, setSelectedCategory] = useState("fashion");

  // 3. Thông tin sản phẩm & Chi phí đầu vào
  const [productName, setProductName] = useState("");
  const [costPrice, setCostPrice] = useState<number>(50000);
  const [packageCost, setPackageCost] = useState<number>(5000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [taxPercent, setTaxPercent] = useState<number>(1.5); // 1% GTGT + 0.5% TNCN
  const [returnPercent, setReturnPercent] = useState<number>(12); // Tự động theo ngành

  // 4. Phí hoa hồng sàn (tự động gợi ý theo ngành nhưng cho phép gõ đè)
  const [commissionPct, setCommissionPct] = useState<number>(4.5);

  // 5. Chi phí Marketing / Ads
  const [marketingType, setMarketingType] = useState<"fixed" | "percent">("percent");
  const [marketingValue, setMarketingValue] = useState<number>(10);

  // 6. Dành cho Mode 1: Lợi nhuận mong muốn
  const [profitType, setProfitType] = useState<"fixed" | "percent">("percent");
  const [profitValue, setProfitValue] = useState<number>(20);

  // 7. Dành cho Mode 2: Giá muốn bán / Giá đối thủ
  const [targetSellingPrice, setTargetSellingPrice] = useState<number>(120000);

  // 8. Cấu hình gói dịch vụ Shopee
  const [shopeePrograms, setShopeePrograms] = useState({
    freeship: true, // 6%, trần 50k
    voucherXtra: true, // 2%, trần 50k
    contentXtra: false, // 3%, trần 50k
    piship: false, // 1.650đ/đơn
  });

  // 9. Cấu hình gói dịch vụ TikTok Shop
  const [tiktokSuperSale, setTiktokSuperSale] = useState(false); // GMV Max giảm còn 5% phí giao dịch
  const [tiktokPrograms, setTiktokPrograms] = useState({
    freeship: true, // SFP ~4.5%, trần 40k
    voucherXtra: true, // VXP ~2.5%, trần 40k
  });

  const [copied, setCopied] = useState(false);

  // Cập nhật phí hoa hồng và tỷ lệ hoàn khi đổi Ngành hàng hoặc Shop Type
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      setReturnPercent(cat.defaultReturn);
      setCommissionPct(shopType === "mall" ? cat.commissionMall : cat.commissionNormal);
    }
  };

  const handleShopTypeChange = (type: "normal" | "mall") => {
    setShopType(type);
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    if (cat) {
      setCommissionPct(type === "mall" ? cat.commissionMall : cat.commissionNormal);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Math.max(0, Math.round(value))
    );
  };

  // --- CÔNG THỨC TOÁN HỌC & GIẢI NGUYÊN BẢN CHUẨN XÁC ---
  const result = useMemo(() => {
    // 1. Phí giao dịch sàn (Transaction Fee) - Chuẩn 6% cho cả Shopee & TikTok
    let transactionFeePct = 6.0;
    if (platform === "TikTok" && tiktokSuperSale) {
      transactionFeePct = 5.0; // TikTok ưu đãi GMV Max
    }

    // 2. Phí cố định theo đơn hàng (Fixed fee per order)
    // Shopee: 3.000đ hạ tầng (+ 1.650đ nếu dùng PiShip)
    // TikTok: 3.000đ phí xử lý đơn hàng áp dụng từ 27/10/2025
    let fixedPlatformFee = 3000;
    let fixedProgramFee = platform === "Shopee" && shopeePrograms.piship ? 1650 : 0;

    // 3. Tỷ lệ % và Trần phí của các gói dịch vụ
    let activePrograms = {
      freeship: false,
      freeshipPct: 0,
      freeshipCap: 50000,
      voucherXtra: false,
      voucherPct: 0,
      voucherCap: 50000,
      contentXtra: false,
      contentPct: 0,
      contentCap: 50000,
    };

    if (platform === "Shopee") {
      activePrograms.freeship = shopeePrograms.freeship;
      activePrograms.freeshipPct = shopeePrograms.freeship ? 6.0 : 0;
      activePrograms.freeshipCap = 50000;

      activePrograms.voucherXtra = shopeePrograms.voucherXtra;
      activePrograms.voucherPct = shopeePrograms.voucherXtra ? 2.0 : 0;
      activePrograms.voucherCap = 50000;

      activePrograms.contentXtra = shopeePrograms.contentXtra;
      activePrograms.contentPct = shopeePrograms.contentXtra ? 3.0 : 0;
      activePrograms.contentCap = 50000;
    } else {
      activePrograms.freeship = tiktokPrograms.freeship;
      activePrograms.freeshipPct = tiktokPrograms.freeship ? 4.5 : 0;
      activePrograms.freeshipCap = 40000;

      activePrograms.voucherXtra = tiktokPrograms.voucherXtra;
      activePrograms.voucherPct = tiktokPrograms.voucherXtra ? 2.5 : 0;
      activePrograms.voucherCap = 40000;
    }

    // --- TÍNH TOÁN THEO CHẾ ĐỘ ---
    let sellingPrice = 0;
    let isError = false;
    let errorMessage = "";

    if (calcMode === "target_price") {
      // MODE 1: TÍNH GIÁ BÁN ĐỀ XUẤT TỪ VỐN VÀ LÃI MONG MUỐN (Giải ngược phương trình)
      let baseFixed = costPrice + packageCost + fixedPlatformFee + fixedProgramFee;
      if (marketingType === "fixed") baseFixed += marketingValue;
      if (profitType === "fixed") baseFixed += profitValue;

      let basePct =
        transactionFeePct +
        commissionPct +
        riskPercent +
        taxPercent +
        returnPercent +
        (marketingType === "percent" ? marketingValue : 0) +
        (profitType === "percent" ? profitValue : 0);

      // Thuật toán vòng lặp hội tụ xử lý mức trần phí sàn (Capping while-loop)
      let currentFixed = baseFixed;
      let currentPct =
        basePct +
        activePrograms.freeshipPct +
        activePrograms.voucherPct +
        activePrograms.contentPct;

      let cappedFreeship = false;
      let cappedVoucher = false;
      let cappedContent = false;

      let iterations = 0;
      let sp = 0;

      while (iterations < 10) {
        iterations++;
        if (currentPct >= 100) {
          isError = true;
          errorMessage = "Tổng tỷ lệ chi phí & lợi nhuận vượt quá 100%. Vui lòng điều chỉnh lại!";
          break;
        }

        sp = currentFixed / (1 - currentPct / 100);
        let changed = false;

        if (!cappedFreeship && activePrograms.freeship && sp * (activePrograms.freeshipPct / 100) > activePrograms.freeshipCap) {
          cappedFreeship = true;
          currentFixed += activePrograms.freeshipCap;
          currentPct -= activePrograms.freeshipPct;
          changed = true;
        }

        if (!cappedVoucher && activePrograms.voucherXtra && sp * (activePrograms.voucherPct / 100) > activePrograms.voucherCap) {
          cappedVoucher = true;
          currentFixed += activePrograms.voucherCap;
          currentPct -= activePrograms.voucherPct;
          changed = true;
        }

        if (!cappedContent && activePrograms.contentXtra && sp * (activePrograms.contentPct / 100) > activePrograms.contentCap) {
          cappedContent = true;
          currentFixed += activePrograms.contentCap;
          currentPct -= activePrograms.contentPct;
          changed = true;
        }

        if (!changed) break;
      }

      if (!isError && sp > 0) {
        sellingPrice = Math.round(sp);
      } else {
        isError = true;
      }
    } else {
      // MODE 2: TÍNH THẨM ĐỊNH LỢI NHUẬN TỪ GIÁ MUỐN BÁN (GIÁ ĐỐI THỦ)
      sellingPrice = Math.max(0, targetSellingPrice);
      if (sellingPrice <= 0) {
        isError = true;
        errorMessage = "Vui lòng nhập giá bán hợp lệ (> 0 đ)";
      }
    }

    // --- BÓC TÁCH CHI TIẾT DÒNG TIỀN CHO CẢ 2 CHẾ ĐỘ ---
    let actualTransactionFee = 0;
    let actualCommissionFee = 0;
    let actualFreeshipFee = 0;
    let actualVoucherFee = 0;
    let actualContentFee = 0;
    let totalPlatformFee = 0;

    let actualTax = 0;
    let actualReturnLoss = 0;
    let actualRisk = 0;
    let actualMarketing = 0;
    let actualProfit = 0;
    let netPayout = 0; // Tiền sàn trả về tài khoản ngân hàng
    let profitMarginPct = 0;

    if (!isError && sellingPrice > 0) {
      actualTransactionFee = sellingPrice * (transactionFeePct / 100);
      actualCommissionFee = sellingPrice * (commissionPct / 100);

      if (activePrograms.freeship) {
        actualFreeshipFee = Math.min(
          sellingPrice * (activePrograms.freeshipPct / 100),
          activePrograms.freeshipCap
        );
      }
      if (activePrograms.voucherXtra) {
        actualVoucherFee = Math.min(
          sellingPrice * (activePrograms.voucherPct / 100),
          activePrograms.voucherCap
        );
      }
      if (activePrograms.contentXtra) {
        actualContentFee = Math.min(
          sellingPrice * (activePrograms.contentPct / 100),
          activePrograms.contentCap
        );
      }

      totalPlatformFee =
        actualTransactionFee +
        actualCommissionFee +
        actualFreeshipFee +
        actualVoucherFee +
        actualContentFee +
        fixedPlatformFee +
        fixedProgramFee;

      // Tiền thực nhận về ví sàn sau khi sàn cấn trừ
      netPayout = sellingPrice - totalPlatformFee;

      // Thuế & Rủi ro
      actualTax = sellingPrice * (taxPercent / 100);
      actualReturnLoss = sellingPrice * (returnPercent / 100);
      actualRisk = sellingPrice * (riskPercent / 100);

      // Chi phí Marketing
      actualMarketing =
        marketingType === "fixed" ? marketingValue : sellingPrice * (marketingValue / 100);

      // Lãi ròng đút túi
      if (calcMode === "target_price") {
        actualProfit = profitType === "fixed" ? profitValue : sellingPrice * (profitValue / 100);
      } else {
        // Mode 2: Lãi ròng = Tiền sàn trả - Giá vốn - Đóng gói - Thuế - Rủi ro/Hoàn - Marketing
        actualProfit =
          netPayout -
          costPrice -
          packageCost -
          actualTax -
          actualReturnLoss -
          actualRisk -
          actualMarketing;
      }

      profitMarginPct = (actualProfit / sellingPrice) * 100;
    }

    return {
      sellingPrice,
      isError,
      errorMessage,
      transactionFeePct,
      commissionPct,
      fixedPlatformFee,
      fixedProgramFee,
      actualTransactionFee,
      actualCommissionFee,
      actualFreeshipFee,
      actualVoucherFee,
      actualContentFee,
      totalPlatformFee,
      platformFeePct: (totalPlatformFee / (sellingPrice || 1)) * 100,
      netPayout,
      actualTax,
      actualReturnLoss,
      actualRisk,
      actualMarketing,
      actualProfit,
      profitMarginPct,
    };
  }, [
    calcMode,
    platform,
    shopType,
    selectedCategory,
    costPrice,
    packageCost,
    riskPercent,
    taxPercent,
    returnPercent,
    commissionPct,
    marketingType,
    marketingValue,
    profitType,
    profitValue,
    targetSellingPrice,
    shopeePrograms,
    tiktokSuperSale,
    tiktokPrograms,
  ]);

  useEffect(() => {
    checkAccess("pricing-calculator", false);
  }, []);

  const copyBreakdown = () => {
    const text = `=== BẢNG PHÂN TÍCH GIÁ BÁN (${platform}) ===
Sản phẩm: ${productName || "Sản phẩm"} (Ngành: ${CATEGORIES.find((c) => c.id === selectedCategory)?.name})
Giá bán đề xuất: ${formatCurrency(result.sellingPrice)}
------------------------------------------------
1. SÀN CẤN TRỪ (${result.platformFeePct.toFixed(1)}%): -${formatCurrency(result.totalPlatformFee)}
   • Phí giao dịch (${result.transactionFeePct}%): -${formatCurrency(result.actualTransactionFee)}
   • Phí hoa hồng sàn (${commissionPct}%): -${formatCurrency(result.actualCommissionFee)}
   • Phí Freeship Extra: -${formatCurrency(result.actualFreeshipFee)}
   • Phí Voucher Extra: -${formatCurrency(result.actualVoucherFee)}
   • Phí xử lý đơn hàng: -${formatCurrency(result.fixedPlatformFee + result.fixedProgramFee)}
------------------------------------------------
2. TIỀN VỀ VÍ SÀN: ${formatCurrency(result.netPayout)}
3. CHI PHÍ VẬN HÀNH:
   • Giá vốn nhập hàng: -${formatCurrency(costPrice)}
   • Chi phí đóng gói: -${formatCurrency(packageCost)}
   • Nghĩa vụ thuế TMĐT (1.5%): -${formatCurrency(result.actualTax)}
   • Rủi ro & Hoàn đơn: -${formatCurrency(result.actualReturnLoss + result.actualRisk)}
   • Chi phí Ads/Marketing: -${formatCurrency(result.actualMarketing)}
------------------------------------------------
=> LÃI RÒNG THỰC NHẬN: ${formatCurrency(result.actualProfit)} (${result.profitMarginPct.toFixed(1)}% biên LN)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <GateModals />

      {/* HEADER */}
      <div className="mb-6">
        <Link
          href="/tools"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <Calculator size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Tính Giá Bán Tối Ưu Lợi Nhuận</h1>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  CHUẨN 2026
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                Cập nhật chính xác biểu phí sàn Shopee & TikTok Shop mới nhất, triệt tiêu rủi ro bán lỗ.
              </p>
            </div>
          </div>

          {/* CHẾ ĐỘ TÍNH 2 CHIỀU */}
          <div className="flex bg-slate-200/70 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setCalcMode("target_price")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                calcMode === "target_price"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign size={14} /> Tính Giá Bán Đề Xuất
            </button>
            <button
              onClick={() => setCalcMode("target_profit")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                calcMode === "target_profit"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowRightLeft size={14} /> Thẩm Định Giá Đối Thủ
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: NHẬP LIỆU CHI PHÍ & THÔNG TIN SẢN PHẨM */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-800">Thông tin chi phí sản phẩm</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {calcMode === "target_price" ? "Chế độ: Tính xuôi" : "Chế độ: Tính ngược"}
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Tên sản phẩm & Sàn */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="VD: Áo polo nam cotton"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sàn TMĐT</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok">TikTok Shop</option>
                  </select>
                </div>
              </div>

              {/* Ngành hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngành hàng (Tự áp mức phí & tỷ lệ hoàn sàn)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (Gợi ý hoàn: {cat.defaultReturn}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Giá vốn & Đóng gói */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá vốn nhập hàng (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={costPrice ? new Intl.NumberFormat("vi-VN").format(costPrice) : ""}
                    onChange={(e) => setCostPrice(Number(e.target.value.replace(/[^0-9]/g, "")))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chi phí đóng gói/hộp (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={packageCost ? new Intl.NumberFormat("vi-VN").format(packageCost) : ""}
                    onChange={(e) => setPackageCost(Number(e.target.value.replace(/[^0-9]/g, "")))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Hoàn đơn, Thuế, Rủi ro */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tỷ lệ hoàn (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={returnPercent}
                    onChange={(e) => setReturnPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thuế TMĐT (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Rủi ro phát sinh (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Chi phí Marketing Ads */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chi phí quảng cáo (Shopee/TikTok Ads)
                </label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  <select
                    value={marketingType}
                    onChange={(e) => setMarketingType(e.target.value as any)}
                    className="px-3 py-2 bg-slate-100 text-xs text-slate-700 font-bold border-r border-slate-200 outline-none"
                  >
                    <option value="percent">% Doanh thu</option>
                    <option value="fixed">Cố định (đ/đơn)</option>
                  </select>
                  <input
                    type="text"
                    value={marketingValue ? new Intl.NumberFormat("vi-VN").format(marketingValue) : ""}
                    onChange={(e) =>
                      setMarketingValue(Number(e.target.value.replace(/[^0-9]/g, "")))
                    }
                    className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              {/* NẾU LÀ MODE 1: LỢI NHUẬN MONG MUỐN */}
              {calcMode === "target_price" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lợi nhuận ròng bạn muốn đạt
                  </label>
                  <div className="flex bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                    <select
                      value={profitType}
                      onChange={(e) => setProfitType(e.target.value as any)}
                      className="px-3 py-2 bg-blue-100 font-bold text-blue-800 text-xs border-r border-blue-200 outline-none"
                    >
                      <option value="percent">% Biên LN ròng</option>
                      <option value="fixed">Tiền lãi (đ/đơn)</option>
                    </select>
                    <input
                      type="text"
                      value={profitValue ? new Intl.NumberFormat("vi-VN").format(profitValue) : ""}
                      onChange={(e) =>
                        setProfitValue(Number(e.target.value.replace(/[^0-9]/g, "")))
                      }
                      className="w-full px-3 py-2 bg-transparent text-sm font-bold text-blue-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                /* NẾU LÀ MODE 2: NHẬP GIÁ BÁN CỦA ĐỐI THỦ */
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1.5 flex items-center justify-between">
                    <span>Giá bạn muốn bán / Giá đối thủ (VNĐ)</span>
                    <span className="text-[10px] text-emerald-600 font-normal">Thẩm định lợi nhuận</span>
                  </label>
                  <input
                    type="text"
                    value={
                      targetSellingPrice
                        ? new Intl.NumberFormat("vi-VN").format(targetSellingPrice)
                        : ""
                    }
                    onChange={(e) =>
                      setTargetSellingPrice(Number(e.target.value.replace(/[^0-9]/g, "")))
                    }
                    className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-bold text-emerald-900"
                  />
                </div>
              )}

              {/* CARD TỔNG KẾT NHANH */}
              <div className="pt-4 border-t border-slate-100">
                {result.isError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>{result.errorMessage || "Chi phí vượt quá 100%, vui lòng kiểm tra lại!"}</span>
                  </div>
                ) : (
                  <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 rounded-2xl text-white shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 p-12 bg-emerald-500 rounded-full blur-3xl opacity-15"></div>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                          {calcMode === "target_price" ? "Giá Bán Đề Xuất" : "Giá Niêm Yết Thẩm Định"}
                        </p>
                        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mt-0.5">
                          {formatCurrency(result.sellingPrice)}
                        </h3>
                      </div>
                      <button
                        onClick={copyBreakdown}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copied ? "Đã copy" : "Copy sao kê"}
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 relative z-10 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tổng tiền sàn thu:</span>
                        <span className="font-bold text-rose-400">
                          -{formatCurrency(result.totalPlatformFee)} ({result.platformFeePct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Sàn giải ngân về ví:</span>
                        <span className="font-bold text-white">{formatCurrency(result.netPayout)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <TrendingUp size={14} /> Lãi ròng đút túi:
                        </span>
                        <span className="font-black text-emerald-400 text-sm">
                          +{formatCurrency(result.actualProfit)} ({result.profitMarginPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CẢNH BÁO THÔNG MINH */}
          {!result.isError && (
            <div className="space-y-3">
              {result.profitMarginPct < 10 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Cảnh báo: Biên lãi ròng dưới 10%!</span>
                    <p className="mt-0.5 text-amber-700 leading-relaxed">
                      Lãi mỏng dưới 10% rất dễ dẫn tới thua lỗ khi gặp tỷ lệ khách trả hàng tăng cao trong đợt khuyến mãi.
                    </p>
                  </div>
                </div>
              )}

              {result.platformFeePct > 20 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2.5">
                  <Info size={18} className="shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <span className="font-bold">Phí sàn chiếm trên {result.platformFeePct.toFixed(0)}% giá bán!</span>
                    <p className="mt-0.5 text-blue-700 leading-relaxed">
                      Sàn đang thu hơn 1/5 giá trị món hàng. Hãy cân nhắc combo hoặc tăng giá niêm yết để giảm áp lực gói dịch vụ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CẤU HÌNH BIỂU PHÍ SÀN 2026 & BẢNG KÊ DÒNG TIỀN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={20} className="text-blue-600" />
                <h2 className="font-bold text-slate-800">
                  Cấu hình biểu phí thực tế: {platform} (2026)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Tự động tính thuế & trần phí</span>
            </div>

            {/* Loại Shop */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Loại gian hàng</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleShopTypeChange("normal")}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    shopType === "normal"
                      ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="font-bold text-sm">Shop thường / Shop Yêu thích</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hoa hồng chuẩn: {CATEGORIES.find((c) => c.id === selectedCategory)?.commissionNormal}%
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleShopTypeChange("mall")}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    shopType === "mall"
                      ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="font-bold text-sm">{platform === "Shopee" ? "Shopee Mall" : "TikTok Shop Mall"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hoa hồng chuẩn: {CATEGORIES.find((c) => c.id === selectedCategory)?.commissionMall}%
                  </div>
                </button>
              </div>
            </div>

            {/* PHÍ CỐ ĐỊNH / HOA HỒNG SÀN (CHO PHÉP SỬA TAY) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    Phí Cố Định / Hoa Hồng Nền Tảng:
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Áp dụng cho mọi đơn giao thành công (Shopee & TikTok đã thu cả Shop thường).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-600 text-sm">%</span>
                </div>
              </div>
            </div>

            {/* TikTok: Toggle Siêu Sale / GMV Max */}
            {platform === "TikTok" && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-800 text-sm">Ưu đãi GMV Max / Ngày Siêu Sale:</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Giảm phí giao dịch từ 6% xuống còn 5% khi đạt tỷ lệ ngân sách quảng cáo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTiktokSuperSale(!tiktokSuperSale)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    tiktokSuperSale ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      tiktokSuperSale ? "translate-x-6" : ""
                    }`}
                  ></div>
                </button>
              </div>
            )}

            {/* CÁC GÓI DỊCH VỤ MARKETING CỦA SÀN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Các gói dịch vụ đăng ký (Tự áp mức trần 40k - 50k)
              </label>

              <div className="space-y-2.5">
                {platform === "Shopee" ? (
                  <>
                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={shopeePrograms.freeship}
                        onChange={(e) =>
                          setShopeePrograms({ ...shopeePrograms, freeship: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói Freeship Xtra (FMP)</span>
                        <span className="text-slate-500 ml-2">Phí 6.0% (Tối đa 50.000đ/sản phẩm)</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={shopeePrograms.voucherXtra}
                        onChange={(e) =>
                          setShopeePrograms({ ...shopeePrograms, voucherXtra: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói Voucher Xtra (VXP)</span>
                        <span className="text-slate-500 ml-2">Phí 2.0% (Tối đa 50.000đ/sản phẩm)</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={shopeePrograms.contentXtra}
                        onChange={(e) =>
                          setShopeePrograms({ ...shopeePrograms, contentXtra: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói Live & Video (Content Xtra)</span>
                        <span className="text-slate-500 ml-2">Phí 3.0% (Tối đa 50.000đ/sản phẩm)</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={shopeePrograms.piship}
                        onChange={(e) =>
                          setShopeePrograms({ ...shopeePrograms, piship: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói PiShip Shopee</span>
                        <span className="text-slate-500 ml-2">Thu cố định 1.650đ/đơn</span>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tiktokPrograms.freeship}
                        onChange={(e) =>
                          setTiktokPrograms({ ...tiktokPrograms, freeship: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói Freeship Extra (SFP TikTok)</span>
                        <span className="text-slate-500 ml-2">Phí 4.5% (Tối đa 40.000đ/sản phẩm)</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={tiktokPrograms.voucherXtra}
                        onChange={(e) =>
                          setTiktokPrograms({ ...tiktokPrograms, voucherXtra: e.target.checked })
                        }
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800">Gói Voucher Extra (VXP TikTok)</span>
                        <span className="text-slate-500 ml-2">Phí 2.5% (Tối đa 40.000đ/sản phẩm)</span>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* BẢNG KÊ SAO KÊ DÒNG TIỀN CHI TIẾT (WATERFALL BREAKDOWN) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-black text-slate-900 text-sm">
                  Bảng Kê Đối Soát 1 Đơn Hàng Thành Công
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  {platform}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-800 text-sm pb-1">
                  <span>Doanh thu niêm yết (Khách trả):</span>
                  <span>{formatCurrency(result.sellingPrice)}</span>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1.5 text-rose-900">
                  <div className="font-bold flex justify-between">
                    <span>1. Tổng các khoản sàn cấn trừ ({result.platformFeePct.toFixed(1)}%):</span>
                    <span>-{formatCurrency(result.totalPlatformFee)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-rose-700">
                    <span>• Phí xử lý giao dịch ({result.transactionFeePct}%):</span>
                    <span>-{formatCurrency(result.actualTransactionFee)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-rose-700">
                    <span>• Phí hoa hồng sàn ({commissionPct}%):</span>
                    <span>-{formatCurrency(result.actualCommissionFee)}</span>
                  </div>
                  {result.actualFreeshipFee > 0 && (
                    <div className="flex justify-between pl-3 text-rose-700">
                      <span>• Phí Freeship Extra:</span>
                      <span>-{formatCurrency(result.actualFreeshipFee)}</span>
                    </div>
                  )}
                  {result.actualVoucherFee > 0 && (
                    <div className="flex justify-between pl-3 text-rose-700">
                      <span>• Phí Voucher Extra:</span>
                      <span>-{formatCurrency(result.actualVoucherFee)}</span>
                    </div>
                  )}
                  {result.actualContentFee > 0 && (
                    <div className="flex justify-between pl-3 text-rose-700">
                      <span>• Phí Content Live Xtra:</span>
                      <span>-{formatCurrency(result.actualContentFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pl-3 text-rose-700">
                    <span>• Phí cố định xử lý đơn hàng/hạ tầng:</span>
                    <span>-{formatCurrency(result.fixedPlatformFee + result.fixedProgramFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-blue-900 p-2.5 bg-blue-50 rounded-lg">
                  <span>2. Tiền thực nhận về Ví Sàn (Net Payout):</span>
                  <span className="font-black text-sm">{formatCurrency(result.netPayout)}</span>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-800">3. Chi phí vận hành tự chi trả:</div>
                  <div className="flex justify-between pl-3">
                    <span>• Tiền hàng gốc (Giá vốn):</span>
                    <span>-{formatCurrency(costPrice)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>• Bao bì, thùng đóng gói:</span>
                    <span>-{formatCurrency(packageCost)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>• Nghĩa vụ thuế TMĐT (1.5%):</span>
                    <span>-{formatCurrency(result.actualTax)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>• Quỹ rủi ro & Hoàn hàng ({returnPercent + riskPercent}%):</span>
                    <span>-{formatCurrency(result.actualReturnLoss + result.actualRisk)}</span>
                  </div>
                  {result.actualMarketing > 0 && (
                    <div className="flex justify-between pl-3">
                      <span>• Chi phí Quảng cáo Ads:</span>
                      <span>-{formatCurrency(result.actualMarketing)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-black text-emerald-800 text-sm p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl">
                  <span>= LÃI RÒNG ĐÚT TÚI:</span>
                  <span className="text-base">
                    +{formatCurrency(result.actualProfit)} ({result.profitMarginPct.toFixed(1)}% Doanh thu)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
