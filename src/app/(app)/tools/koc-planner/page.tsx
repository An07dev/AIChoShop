"use client";

import { useState } from "react";
import { ArrowLeft, Presentation, Sparkles, Calculator } from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { KocPlannerOutput } from "@/components/tools/KocPlannerOutput";
import { TextDots } from "@/components/ui/text-dots";

export default function KocPlanner() {
  const { checkAccess, GateModals } = useToolGate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [category, setCategory] = useState("Thời trang nam");
  const [customCategory, setCustomCategory] = useState("");
  const [budget, setBudget] = useState("20000000");

  const handleGenerate = async () => {
    // const hasAccess = await checkAccess("koc-planner", true); // VIP Only
    // if (!hasAccess) return;

    const finalCategory =
      category === "Khác (Tự nhập ngành hàng)"
        ? customCategory.trim()
        : category;

    if (category === "Khác (Tự nhập ngành hàng)" && !customCategory.trim()) {
      alert("Vui lòng nhập tên ngành hàng của bạn!");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      alert("Vui lòng nhập Ngân sách hợp lệ!");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "koc-planner",
          inputs: { category: finalCategory || "Ngành hàng tự do", budget },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert("Có lỗi xảy ra: " + data.error);
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ AI.");
    } finally {
      setLoading(false);
    }
  };

  // Các mốc ngân sách mẫu để chọn nhanh
  const quickBudgets = [
    { label: "5 Triệu", value: "5000000" },
    { label: "10 Triệu", value: "10000000" },
    { label: "20 Triệu", value: "20000000" },
    { label: "50 Triệu", value: "50000000" },
    { label: "100 Triệu", value: "100000000" },
  ];

  const formattedBudgetPreview = Number(budget)
    ? new Intl.NumberFormat("vi-VN").format(Number(budget)) + " đ"
    : "0 đ";

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col min-h-0">
      <GateModals />

      {/* Thanh tiêu đề thu gọn trên 1 dòng */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-colors shadow-sm"
            title="Quay lại kho công cụ"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <Presentation size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  AI Lập Kế Hoạch KOC
                </h1>
                <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  VIP ONLY
                </span>
              </div>
              <p className="text-slate-400 text-xs hidden sm:block">
                Phân bổ ngân sách thông minh để book KOC/KOL ra đơn hiệu quả nhất.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Khu vực thao tác chính 2 cột chiếm trọn phần chiều cao còn lại */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Nhập thông số chiến dịch */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-slate-500" />
              <h2 className="font-bold text-slate-800 text-sm">
                Thông số chiến dịch
              </h2>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {formattedBudgetPreview}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col min-h-0 gap-3 justify-between">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Ngành hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngành hàng của bạn
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium cursor-pointer"
                >
                  <option>Thời trang nam</option>
                  <option>Thời trang nữ & Đồ lót</option>
                  <option>Giày dép & Túi xách</option>
                  <option>Mỹ phẩm & Chăm sóc sắc đẹp</option>
                  <option>Chăm sóc sức khỏe & Thực phẩm chức năng</option>
                  <option>Đồ ăn vặt & Thực phẩm chế biến (F&B)</option>
                  <option>Đồ uống, Trà sữa & Cafe</option>
                  <option>Gia dụng thông minh & Đời sống</option>
                  <option>Thiết bị điện tử & Phụ kiện công nghệ</option>
                  <option>Mẹ & Bé (Sữa bỉm, Đồ chơi)</option>
                  <option>Phụ kiện thời trang & Trang sức</option>
                  <option>Thể thao, Dã ngoại & Gym/Yoga</option>
                  <option>Chăm sóc thú cưng (Pet Care)</option>
                  <option>Sách, Văn phòng phẩm & Quà tặng</option>
                  <option>Nội thất & Trang trí nhà cửa (Home Decor)</option>
                  <option>Ô tô, Xe máy & Phụ kiện xe</option>
                  <option>Đồ thủ công mỹ nghệ / Handmade</option>
                  <option value="Khác (Tự nhập ngành hàng)">✨ Khác (Tự nhập ngành hàng...)</option>
                </select>

                {/* Ô nhập tuỳ chỉnh khi chọn mục Khác */}
                {category === "Khác (Tự nhập ngành hàng)" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Nhập tên ngành hàng của bạn (VD: Đồ phong thủy, Nhang trầm, Cây cảnh...)"
                      className="w-full px-3 py-2 bg-indigo-50/40 border border-indigo-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-semibold text-indigo-950 placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Ngân sách dự kiến */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Ngân sách dự kiến (VNĐ)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formattedBudgetPreview}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="VD: 20000000"
                    className="w-full pl-3 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Nút chọn nhanh ngân sách */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 block">
                  Chọn nhanh mức ngân sách phổ biến:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickBudgets.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBudget(b.value)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border ${budget === b.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border-slate-200"
                        }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gợi ý chiến lược KOC */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs space-y-1 mt-auto">
                <span className="font-bold text-indigo-700 text-[11px] block">
                  💡 Chiến lược Nano-Micro Influencer:
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Thay vì dồn ngân sách vào 1 KOL lớn rủi ro cao, AI sẽ chia nhỏ ngân sách thành 5-10 KOC Nano & Micro kết hợp chạy Spark Ads để tối đa hóa chuyển đổi ra đơn.
                </p>
              </div>
            </div>

            {/* Nút hành động Submit */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full shrink-0 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer ${loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-500/25 active:scale-[0.99]"
                }`}
            >
              {loading ? (
                <TextDots dots={3}>Thinking</TextDots>
              ) : (
                <>
                  <Sparkles size={16} /> Lên Kế Hoạch Bằng AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cột phải: Hiển thị kết quả kế hoạch KOC */}
        <div className="lg:col-span-7 h-full min-h-0">
          <KocPlannerOutput
            result={result}
            loading={loading}
            category={
              category === "Khác (Tự nhập ngành hàng)"
                ? customCategory.trim() || "Ngành khác"
                : category
            }
            budget={budget}
          />
        </div>
      </div>
    </div>
  );
}
