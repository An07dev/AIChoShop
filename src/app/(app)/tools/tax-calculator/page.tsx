"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Calculator, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";

export default function TaxCalculator() {
  const [revenue, setRevenue] = useState("");
  const [businessType, setBusinessType] = useState("ho-kinh-doanh");
  const [platformFees, setPlatformFees] = useState("");

  const results = useMemo(() => {
    const rev = Number(revenue) || 0;
    const fees = Number(platformFees) || 0;
    
    // Thuế suất thương mại điện tử (phân phối, cung cấp hàng hóa)
    // Hộ kinh doanh / Cá nhân kinh doanh: 1.5% (1% GTGT + 0.5% TNCN)
    // Nếu doanh thu < 100tr/năm -> Miễn thuế
    let gtgt = 0;
    let tncn = 0;
    let isExempt = false;

    if (businessType === "ho-kinh-doanh" || businessType === "ca-nhan") {
      if (rev <= 100000000) {
        isExempt = true;
      } else {
        gtgt = rev * 0.01;
        tncn = rev * 0.005;
      }
    } else if (businessType === "cong-ty") {
      // Đơn giản hóa cho Công ty (thực tế phức tạp hơn dựa trên lợi nhuận)
      // GTGT đóng theo phương pháp khấu trừ, TNDN 20% trên lợi nhuận
      gtgt = rev * 0.1; // Khách trả, công ty nộp thay (tạm tính)
      const estimatedProfit = rev - fees - (rev * 0.7); // Tạm tính giá vốn 70%
      tncn = Math.max(0, estimatedProfit * 0.2); // Thuế TNDN 20%
    }

    const totalTax = gtgt + tncn;
    const netRevenue = rev - fees - totalTax;

    return {
      gtgt,
      tncn,
      totalTax,
      netRevenue,
      isExempt
    };
  }, [revenue, businessType, platformFees]);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại kho công cụ
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 rounded-xl">
            <Calculator size={28} className="text-rose-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">Tính Thuế TMĐT (Shopee/TikTok)</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded shadow-sm">FREE TOOL</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">Tính toán chính xác thuế GTGT, TNCN phải nộp theo quy định pháp luật hiện hành.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Loại hình kinh doanh</label>
              <select 
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              >
                <option value="ho-kinh-doanh">Hộ Kinh Doanh (Khuyên dùng cho Seller)</option>
                <option value="ca-nhan">Cá Nhân Kinh Doanh</option>
                <option value="cong-ty">Công Ty / Doanh Nghiệp (TNDN)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tổng doanh thu Sàn ghi nhận (VNĐ/Năm)</label>
              <input 
                type="text" 
                value={revenue ? new Intl.NumberFormat('vi-VN').format(Number(revenue)) : ""}
                onChange={e => setRevenue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="VD: 500.000.000" 
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono" 
              />
              <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                <Info size={14} className="shrink-0" />
                Lưu ý: Doanh thu này là tổng tiền hàng bán được, chưa trừ các khoản phí sàn. Cơ quan thuế tính trên con số này.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tổng các loại phí Sàn (VNĐ/Năm)</label>
              <input 
                type="text" 
                value={platformFees ? new Intl.NumberFormat('vi-VN').format(Number(platformFees)) : ""}
                onChange={e => setPlatformFees(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Phí thanh toán, cố định, ads..." 
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono" 
              />
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 text-amber-500" />
              <p>Trốn thuế TMĐT hiện nay sẽ bị phạt rất nặng (truy thu + phạt chậm nộp). Việc khai báo Hộ kinh doanh đóng mức 1.5% là phương án an toàn nhất cho cá nhân.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl shadow-xl h-full p-8 border border-slate-800 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-rose-400" />
              Bảng Tính Nghĩa Vụ Thuế
            </h2>

            {results.isExempt ? (
              <div className="p-6 bg-emerald-900/30 border border-emerald-500/30 rounded-xl mb-6">
                <h3 className="text-emerald-400 font-bold text-lg mb-2">🎉 Chúc mừng! Bạn được MIỄN THUẾ</h3>
                <p className="text-emerald-200/70 text-sm">Doanh thu năm của bạn dưới 100.000.000 VNĐ nên theo quy định pháp luật hiện hành, bạn không phải nộp Thuế GTGT và TNCN.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400">Thuế Giá Trị Gia Tăng (GTGT)</span>
                  <span className="text-white font-mono font-bold">{formatVND(results.gtgt)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400">{businessType === 'cong-ty' ? 'Thuế Thu Nhập Doanh Nghiệp (TNDN tạm tính)' : 'Thuế Thu Nhập Cá Nhân (TNCN)'}</span>
                  <span className="text-white font-mono font-bold">{formatVND(results.tncn)}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-rose-500/10 rounded-xl border border-rose-500/30 mt-2">
                  <span className="text-rose-400 font-bold">TỔNG THUẾ PHẢI NỘP</span>
                  <span className="text-rose-400 font-mono font-black text-2xl">{formatVND(results.totalTax)}</span>
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Dòng Tiền Thực Tế</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Doanh thu ban đầu:</span>
                <span className="text-slate-300 font-mono text-sm">{formatVND(Number(revenue))}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Trừ phí sàn:</span>
                <span className="text-slate-300 font-mono text-sm">-{formatVND(Number(platformFees))}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 text-sm">Trừ thuế:</span>
                <span className="text-rose-400 font-mono text-sm">-{formatVND(results.totalTax)}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">TIỀN THỰC NHẬN</span>
                <span className="text-emerald-400 font-mono font-black text-xl">{formatVND(results.netRevenue)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
