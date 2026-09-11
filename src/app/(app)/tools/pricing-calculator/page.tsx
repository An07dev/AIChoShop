"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Calculator, Store, Sparkles, Save, Search, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";

export default function PricingCalculator() {
  const { checkAccess, GateModals } = useToolGate();
  const [platform, setPlatform] = useState<"Shopee" | "TikTok">("Shopee");
  const [shopType, setShopType] = useState<"normal" | "mall">("normal");

  // Product Inputs
  const [costPrice, setCostPrice] = useState<number>(50000);
  const [packageCost, setPackageCost] = useState<number>(5000);
  const [riskPercent, setRiskPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(1.5);
  const [returnPercent, setReturnPercent] = useState<number>(2);
  
  const [marketingType, setMarketingType] = useState<"fixed" | "percent">("percent");
  const [marketingValue, setMarketingValue] = useState<number>(10);

  const [profitType, setProfitType] = useState<"fixed" | "percent">("percent");
  const [profitValue, setProfitValue] = useState<number>(20);

  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Shopee specific
  const [shopeePrograms, setShopeePrograms] = useState({
    freeship: false,
    voucherXtra: false,
    contentXtra: false,
    piship: false,
  });

  // TikTok specific
  const [tiktokSuperSale, setTiktokSuperSale] = useState(false);
  const [tiktokPackage, setTiktokPackage] = useState<number>(1);

  // -- CALCULATIONS --
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, Math.round(value)));
  };

  const result = useMemo(() => {
    // 1. Base platform fees
    let transactionFeePct = 6;
    let commissionFeePct = 0;
    let fixedPlatformFee = 0;

    if (platform === "Shopee") {
      commissionFeePct = shopType === "mall" ? 5 : 0;
      fixedPlatformFee = 3000; // Phí hạ tầng mới
    } else {
      transactionFeePct = tiktokSuperSale ? 5 : 6; // Ví dụ: siêu sale giảm 1%
      commissionFeePct = shopType === "mall" ? 4 : 0;
    }

    // 2. Program fees
    let programFeePct = 0;
    let programCaps = { freeship: 50000, voucherXtra: 50000, contentXtra: 50000 };
    let activePrograms = { freeship: 0, voucherXtra: 0, contentXtra: 0 };
    let fixedProgramFee = 0;

    if (platform === "Shopee") {
      if (shopeePrograms.freeship) activePrograms.freeship = 6;
      if (shopeePrograms.voucherXtra) activePrograms.voucherXtra = 2;
      if (shopeePrograms.contentXtra) activePrograms.contentXtra = 3;
      if (shopeePrograms.piship) fixedProgramFee += 1650;
    } else {
      // Tiktok logic based on package (Giả sử)
      if (tiktokPackage >= 2) activePrograms.voucherXtra = 3; // Giả sử VXP 3%
      if (tiktokPackage >= 3) activePrograms.freeship = 4; // Giả sử SFP 4%
    }

    // 3. User variables
    let totalFixed = costPrice + packageCost + fixedPlatformFee + fixedProgramFee;
    let totalPct = transactionFeePct + commissionFeePct + riskPercent + taxPercent + returnPercent;

    if (marketingType === "fixed") totalFixed += marketingValue;
    else totalPct += marketingValue;

    if (profitType === "fixed") totalFixed += profitValue;
    else totalPct += profitValue;

    // Helper: Tính toán SP dựa trên cap
    const calculateSP = () => {
      let currentFixed = totalFixed;
      let currentPct = totalPct + activePrograms.freeship + activePrograms.voucherXtra + activePrograms.contentXtra;

      // Check max cap 1st pass
      if (currentPct >= 100) return -1; // Error
      let sp = currentFixed / (1 - currentPct / 100);

      // Check if any program hit the cap, if so, move to fixed and remove from pct
      let recalculated = false;
      if (activePrograms.freeship > 0 && sp * (activePrograms.freeship / 100) > programCaps.freeship) {
        currentFixed += programCaps.freeship;
        currentPct -= activePrograms.freeship;
        recalculated = true;
      }
      if (activePrograms.voucherXtra > 0 && sp * (activePrograms.voucherXtra / 100) > programCaps.voucherXtra) {
        currentFixed += programCaps.voucherXtra;
        currentPct -= activePrograms.voucherXtra;
        recalculated = true;
      }
      if (activePrograms.contentXtra > 0 && sp * (activePrograms.contentXtra / 100) > programCaps.contentXtra) {
        currentFixed += programCaps.contentXtra;
        currentPct -= activePrograms.contentXtra;
        recalculated = true;
      }

      if (recalculated) {
        if (currentPct >= 100) return -1;
        sp = currentFixed / (1 - currentPct / 100);
      }
      
      return sp;
    };

    const sp = calculateSP();
    const isError = sp <= 0;

    // Phân tích chi tiết phí
    let actualPlatformFee = 0;
    let actualMarketing = 0;
    let actualProfit = 0;

    if (!isError) {
      actualPlatformFee = (sp * (transactionFeePct + commissionFeePct) / 100) + fixedPlatformFee;
      
      // Add program fees with caps
      actualPlatformFee += Math.min(sp * (activePrograms.freeship / 100), programCaps.freeship || Infinity);
      actualPlatformFee += Math.min(sp * (activePrograms.voucherXtra / 100), programCaps.voucherXtra || Infinity);
      actualPlatformFee += Math.min(sp * (activePrograms.contentXtra / 100), programCaps.contentXtra || Infinity);
      actualPlatformFee += fixedProgramFee;

      actualMarketing = marketingType === "fixed" ? marketingValue : sp * (marketingValue / 100);
      actualProfit = profitType === "fixed" ? profitValue : sp * (profitValue / 100);
    }

    return {
      sp,
      isError,
      transactionFeePct,
      commissionFeePct,
      totalBaseFeePct: transactionFeePct + commissionFeePct,
      actualPlatformFee,
      actualMarketing,
      actualProfit
    };
  }, [
    platform, shopType, costPrice, packageCost, riskPercent, taxPercent, returnPercent,
    marketingType, marketingValue, profitType, profitValue, shopeePrograms, tiktokSuperSale, tiktokPackage
  ]);

  useEffect(() => {
    // Chặn người dùng nếu họ đã dùng hết lượt free khi mới vào trang
    checkAccess("pricing-calculator", false);
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <GateModals />
      <div className="mb-6">
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calculator size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Tính Giá Bán Sản Phẩm</h1>
            <p className="text-slate-500 text-sm">Tính toán chi tiết các loại phí sàn để đưa ra giá bán tối ưu lợi nhuận.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Product Info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Calculator size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">Thông tin sản phẩm</h2>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên sản phẩm</label>
                  <input type="text" placeholder="Nhập tên sản phẩm" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nền tảng</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Shopee">Shopee</option>
                    <option value="TikTok">TikTok Shop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Giá vốn (VNĐ)</label>
                  <input type="text" value={costPrice ? new Intl.NumberFormat('vi-VN').format(costPrice) : ""} onChange={e=>setCostPrice(Number(e.target.value.replace(/[^0-9]/g, '')))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Chi phí đóng gói (VNĐ)</label>
                  <input type="text" value={packageCost ? new Intl.NumberFormat('vi-VN').format(packageCost) : ""} onChange={e=>setPackageCost(Number(e.target.value.replace(/[^0-9]/g, '')))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phí rủi ro (%)</label>
                  <input type="number" value={riskPercent} onChange={e=>setRiskPercent(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Thuế (%)</label>
                  <input type="number" value={taxPercent} onChange={e=>setTaxPercent(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hoàn đơn (%)</label>
                  <input type="number" value={returnPercent} onChange={e=>setReturnPercent(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Chi phí quảng cáo</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                    <select value={marketingType} onChange={e=>setMarketingType(e.target.value as any)} className="px-2 py-2 bg-transparent text-xs text-slate-600 border-r border-slate-200 outline-none">
                      <option value="fixed">Cố định (đ)</option>
                      <option value="percent">% Doanh thu</option>
                    </select>
                    <input type="text" value={marketingValue ? new Intl.NumberFormat('vi-VN').format(marketingValue) : ""} onChange={e=>setMarketingValue(Number(e.target.value.replace(/[^0-9]/g, '')))} className="w-full px-3 py-2 bg-transparent text-sm focus:outline-none font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Lợi nhuận mong muốn</label>
                  <div className="flex bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                    <select value={profitType} onChange={e=>setProfitType(e.target.value as any)} className="px-2 py-2 bg-transparent font-bold text-blue-700 text-xs border-r border-blue-200 outline-none">
                      <option value="fixed">Cố định (đ)</option>
                      <option value="percent">% Biên LN</option>
                    </select>
                    <input type="text" value={profitValue ? new Intl.NumberFormat('vi-VN').format(profitValue) : ""} onChange={e=>setProfitValue(Number(e.target.value.replace(/[^0-9]/g, '')))} className="w-full px-3 py-2 bg-transparent text-sm font-bold text-blue-700 focus:outline-none font-mono" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {result.isError ? (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold text-center">
                    Cảnh báo: Tổng phần trăm chi phí vượt quá 100%. Vui lòng điều chỉnh lại.
                  </div>
                ) : (
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
                    <p className="text-slate-400 text-sm font-medium mb-1 relative z-10">Giá Bán Đề Xuất</p>
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 relative z-10">
                      {formatCurrency(result.sp)}
                    </h3>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 relative z-10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Tổng thu về:</span>
                        <span className="font-bold text-white">{formatCurrency(result.sp)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Trừ vốn + phí + thuế:</span>
                        <span className="font-bold text-rose-400">-{formatCurrency(result.sp - result.actualProfit)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-300 font-bold flex items-center gap-1"><TrendingUp size={14} className="text-emerald-400"/> Lãi ròng:</span>
                        <span className="font-black text-emerald-400">{formatCurrency(result.actualProfit)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Tips */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-50 flex items-center gap-2 bg-blue-50/30">
              <Sparkles size={18} className="text-blue-500" />
              <h2 className="font-bold text-blue-900">Gợi ý tối ưu từ Seller AI</h2>
            </div>
            <div className="p-5">
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-blue-700 font-bold text-sm mb-2">Tối ưu chi phí trên {platform}</h3>
                <p className="text-slate-700 text-sm mb-3 leading-relaxed">
                  <span className="font-semibold">Mẹo:</span> {platform === "Shopee" 
                    ? "Phí thanh toán đã tăng lên 6%. Bạn nên cân nhắc giá trị đơn hàng để tối ưu gói PiShip." 
                    : "Tận dụng GMV Max để được hoàn 1% phí giao dịch (chỉ còn 5%)."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Platform Config */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Store size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">Cấu hình sàn bán hàng ({platform})</h2>
            </div>
            
            <div className="p-6 space-y-8 flex-1">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Ngành hàng</label>
                <div className="space-y-3">
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
                    <option>Chọn ngành hàng</option>
                    <option>Thời trang nam</option>
                    <option>Điện thoại & Phụ kiện</option>
                  </select>
                </div>
              </div>

              {/* Shop Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Loại shop</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shopType === "normal" ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                      {shopType === "normal" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Shop thường</span>
                    <input type="radio" className="hidden" checked={shopType === "normal"} onChange={() => setShopType("normal")} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shopType === "mall" ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                      {shopType === "mall" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{platform === "Shopee" ? "Shopee Mall" : "Shop Mall"}</span>
                    <input type="radio" className="hidden" checked={shopType === "mall"} onChange={() => setShopType("mall")} />
                  </label>
                </div>
              </div>

              {platform === "TikTok" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Loại ngày bán hàng</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${tiktokSuperSale ? "bg-blue-500" : "bg-slate-200"}`}
                      onClick={() => setTiktokSuperSale(!tiktokSuperSale)}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${tiktokSuperSale ? "left-[22px]" : "left-0.5"}`}></div>
                    </div>
                    <span className="text-sm text-slate-600">Ngày siêu sale (VXP: 3%, thay vì 2% ngày thường)</span>
                  </div>
                </div>
              )}

              {/* Programs */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Chương trình tham gia</label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {platform === "Shopee" ? (
                    <>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={shopeePrograms.freeship} onChange={(e) => setShopeePrograms({...shopeePrograms, freeship: e.target.checked})} className="mt-1" />
                        <span className="text-sm text-slate-700">Phí vận chuyển (6%, tối đa 50.000đ/sản phẩm)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={shopeePrograms.voucherXtra} onChange={(e) => setShopeePrograms({...shopeePrograms, voucherXtra: e.target.checked})} className="mt-1" />
                        <span className="text-sm text-slate-700">Dịch Vụ Voucher Xtra (2%, tối đa 50.000đ/sản phẩm)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={shopeePrograms.contentXtra} onChange={(e) => setShopeePrograms({...shopeePrograms, contentXtra: e.target.checked})} className="mt-1" />
                        <span className="text-sm text-slate-700">Dịch Vụ Content Xtra (3%, tối đa 50.000đ/sản phẩm)</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={shopeePrograms.piship} onChange={(e) => setShopeePrograms({...shopeePrograms, piship: e.target.checked})} className="mt-1" />
                        <span className="text-sm text-slate-700">PiShip - Gói Tiết Kiệm Vận Chuyển (1.650đ/đơn)</span>
                      </label>
                    </>
                  ) : (
                    <>
                      {[
                        { id: 1, name: "Gói 1: Không tham gia" },
                        { id: 2, name: "Gói 2: Chỉ VXP" },
                        { id: 3, name: "Gói 3: VXP + Flash Sales" },
                        { id: 4, name: "Gói 4: SFP + VXP + Flash Sales" },
                      ].map((pkg) => (
                        <label key={pkg.id} className="flex items-center gap-3 cursor-pointer p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400">
                          <input type="radio" name="tiktokPkg" checked={tiktokPackage === pkg.id} onChange={() => setTiktokPackage(pkg.id)} />
                          <span className="text-sm text-slate-700 font-medium">{pkg.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Fee Summary Widget */}
              <div className={`rounded-xl p-5 border ${platform === "Shopee" ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"}`}>
                <h3 className="font-bold text-slate-800 mb-3">Phí cơ bản nền tảng (Ước tính)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí giao dịch ({result.transactionFeePct}%):</span>
                    <span className="font-medium">{formatCurrency(result.sp * result.transactionFeePct / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí hoa hồng ({result.commissionFeePct}%):</span>
                    <span className="font-medium">{formatCurrency(result.sp * result.commissionFeePct / 100)}</span>
                  </div>
                  {platform === "Shopee" && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phí hạ tầng:</span>
                      <span className="font-medium">3.000 đ</span>
                    </div>
                  )}
                </div>
                <div className={`mt-4 pt-3 border-t flex justify-between ${platform === "Shopee" ? "border-orange-200 text-orange-800" : "border-green-200 text-green-800"}`}>
                  <span className="font-bold">Tổng thu của sàn (gồm các gói):</span>
                  <span className="font-black">{formatCurrency(result.actualPlatformFee)}</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
