"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  ShieldAlert,
  Send,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useToolGate } from "@/hooks/useToolGate";
import { PolicyCheckerOutput } from "@/components/tools/PolicyCheckerOutput";
import { scanTextForViolations, ScanReport } from "@/lib/policy-blacklist/dictionary";
import { useToast } from "@/context/ToastContext";
import { AiUsageBadge } from "@/components/tools/AiUsageBadge";

const PLATFORMS = [
  { id: "TikTok Shop", label: "TikTok Shop (Kiểm duyệt gắt gao nhất)" },
  { id: "Shopee", label: "Shopee" },
  { id: "Facebook Ads", label: "Facebook Ads / Fanpage" },
  { id: "Lazada", label: "Lazada" },
];

const CONTENT_TYPES = [
  "Mô tả sản phẩm (Product Description)",
  "Tiêu đề sản phẩm (Product Title)",
  "Kịch bản Video / Livestream",
  "Tin nhắn Chat chăm sóc khách",
];

const SAMPLE_TEXT = `🔥 SIÊU PHẨM KEM DƯỠNG TRẮNG DA TRỊ MỤN SỐ 1 VIỆT NAM 🔥
Cam kết 100% trị dứt điểm mọi loại mụn bọc, mụn ẩn chỉ sau 3 ngày dùng! Thần dược tái sinh làn da, vĩnh viễn không tái phát.
Hàng nhập khẩu chuẩn style Gucci cao cấp, bảo hành hoàn tiền gấp 10 nếu không hiệu quả.
🎁 DUY NHẤT HÔM NAY: Tặng tiền mặt 50k cho 10 đơn đầu tiên!
Khách yêu liên hệ ngay Zalo / Hotline: 0912.345.678 hoặc inbox Fanpage Facebook để nhận ưu đãi chuyển khoản free ship nha!`;

const SAMPLE_OUTPUT = `---

## 🛡️ 1. TỔNG QUAN ĐÁNH GIÁ RỦI RO
- **Mức độ rủi ro:** NGUY HIỂM - NGUY CƠ BỊ KHÓA LINK / ĂN GẬY VI PHẠM CAO (Điểm an toàn: 15/100)
- **Tóm tắt tình trạng:** Đoạn văn bản chứa hàng loạt vi phạm nghiêm trọng về: Lôi kéo giao dịch ngoài sàn (Zalo, Hotline, FB, Chuyển khoản), Cam kết y tế quá mức (Trị dứt điểm 100%, Thần dược), Từ ngữ so sánh nhất (Số 1 VN, Duy nhất) và Nghi vấn vi phạm nhãn hiệu quốc tế (Gucci). Nếu đăng tải, sản phẩm chắc chắn sẽ bị AI của sàn từ chối duyệt, gắn cờ vi phạm hoặc khóa vĩnh viễn.
- **Các chính sách bị vi phạm:** Chính sách lôi kéo giao dịch ngoài sàn TikTok Shop/Shopee; Luật Quảng cáo (Từ ngữ so sánh tuyệt đối); Chính sách hàng giả/nhái thương hiệu; Quy chuẩn quản lý mỹ phẩm và bảo vệ quyền lợi người tiêu dùng.

---

## ⚠️ 2. DANH SÁCH CÁC ĐIỂM VI PHẠM CẦN GỠ BỎ
| Từ ngữ / Đoạn văn vi phạm | Nhóm chính sách | Lý do thuật toán sàn gắn cờ | Giải pháp khắc phục |
| :--- | :--- | :--- | :--- |
| "SỐ 1 VIỆT NAM" | Khẳng định so sánh nhất | Vi phạm Luật Quảng cáo khi không có chứng nhận nhà nước | Thay bằng: "Dòng kem dưỡng cao cấp được yêu thích" |
| "Cam kết 100% trị dứt điểm" | Cam kết y tế quá mức | Mỹ phẩm không được cam kết hiệu quả y tế tuyệt đối | Thay bằng: "Hỗ trợ cải thiện và làm mờ mụn rõ rệt" |
| "Thần dược tái sinh làn da" | Từ ngữ thần thánh hóa | Bị quét là quảng cáo sai công dụng và lừa dối người tiêu dùng | Thay bằng: "Tinh chất chăm sóc và nuôi dưỡng làn da" |
| "vĩnh viễn không tái phát" | Tuyên bố phóng đại | Vi phạm chính sách tuyên bố y tế không có cơ sở khoa học | Thay bằng: "Giúp duy trì làn da khỏe mạnh, sạch mịn lâu dài" |
| "style Gucci" | Thương hiệu nhạy cảm | Nghi vấn gắn mác thương hiệu quốc tế chưa có giấy ủy quyền | Thay bằng: "Thiết kế sang trọng, tinh tế" |
| "hoàn tiền gấp 10" | Chiêu trò giật gân (Gimmick) | Thuật toán AI coi là nội dung câu view, lừa đảo | Thay bằng: "Chính sách đổi trả linh hoạt theo quy định sàn" |
| "Tặng tiền mặt 50k" | Tặng tiền mặt / Quà cấm | Chính sách sàn cấm giao dịch tiền mặt hoặc thưởng tiền riêng | Thay bằng: "Tặng voucher giảm giá 50k áp dụng trực tiếp" |
| "Zalo / Hotline: 0912.345.678" | Lôi kéo ngoài sàn (CRITICAL) | Hành vi dẫn dắt khách hàng ra ngoài sàn để trốn phí giao dịch | Xóa toàn bộ số điện thoại và từ Zalo, dùng: "Nhắn tin qua khung chat sàn" |
| "Fanpage Facebook" | Dẫn sang mạng xã hội khác | Cấm nhắc đến đối thủ cạnh tranh ngoài sàn | Thay bằng: "Nhắn tin trực tiếp cho shop tại đây" |
| "chuyển khoản free ship" | Thanh toán ngoài sàn | Bị coi là hướng dẫn thanh toán lách cổng thanh toán sàn | Thay bằng: "Ưu đãi voucher Freeship theo mã sàn" |

---

## ✅ 3. BẢN VIẾT LẠI AN TOÀN 100% (READY TO USE)
*(Nội dung đã được biên tập lại an toàn, xóa bỏ 100% từ cấm nhưng vẫn giữ trọn sức hút bán hàng. Bấm Sao Chép để dùng ngay!)*

✨ KEM DƯỠNG DA GIẢM MỤN CHUYÊN SÂU - BÍ QUYẾT LÀN DA SẠCH MỊN ✨

Bạn đang tìm kiếm giải pháp dịu nhẹ cho làn da mụn và thâm sạm? Khám phá ngay dòng kem dưỡng ẩm phục hồi cao cấp - bí quyết giúp làn da tươi sáng, mịn màng mỗi ngày.

💎 ĐIỂM NỔI BẬT CỦA SẢN PHẨM:
- Hỗ trợ làm dịu các nốt mụn sưng, cải thiện bề mặt da trông thấy chỉ sau thời gian ngắn sử dụng đều đặn.
- Chiết xuất tự nhiên giàu dưỡng chất, thẩm thấu nhanh, không gây nhờn rít, giúp cân bằng độ ẩm và củng cố hàng rào bảo vệ da.
- Thiết kế bao bì sang trọng, thanh lịch, tiện lợi mang theo hàng ngày.

🎁 ƯU ĐÃI ĐẶC QUYỀN HÔM NAY:
- Giảm ngay voucher 50.000đ trực tiếp vào đơn hàng cho khách hàng nhanh tay nhất.
- Hỗ trợ mã miễn phí vận chuyển Extra toàn quốc khi đặt hàng qua sàn.

🛡️ CHÍNH SÁCH TỪ SHOP:
- Cam kết sản phẩm chính hãng, đầy đủ hóa đơn chứng từ.
- Đổi trả linh hoạt trong vòng 7 ngày nếu lỗi từ nhà sản xuất.
- Đội ngũ tư vấn tận tâm 24/7: Quý khách vui lòng nhấn nút "Chat ngay" trên khung trò chuyện của sàn để được hỗ trợ chuyên sâu!

---

## 💡 4. LỜI KHUYÊN TỪ CHUYÊN GIA
- Đối với ngành Mỹ phẩm & Skincare trên TikTok Shop: Tuyệt đối tránh các từ ngữ mang tính chỉ định y khoa (trị mụn, chữa khỏi, thần dược). Thay vào đó, hãy tập trung vào các từ ngữ "chăm sóc da", "làm dịu", "cải thiện", "phục hồi".
- Khi chạy Livestream hoặc Video ngắn: Không bao giờ nói to số điện thoại hoặc giơ bảng ghi Zalo/STK lên màn hình, AI nhận diện giọng nói và hình ảnh của TikTok sẽ tự động bóp reach hoặc đánh sập phiên live trong vòng 3 phút.
- Khuyến mại an toàn: Không tặng tiền mặt hay hứa hẹn chuyển khoản lại tiền, chỉ sử dụng công cụ Marketing chính thức do Seller Center cung cấp (Voucher giảm giá, Flash sale, Mua kèm deal sốc).`;

export default function PolicyCheckerPage() {
  const { checkAccess, GateModals } = useToolGate();
  const { showAiError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [platform, setPlatform] = useState("TikTok Shop");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [text, setText] = useState("");

  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const handleUseSample = () => {
    setText(SAMPLE_TEXT);
    setPlatform("TikTok Shop");
    setContentType(CONTENT_TYPES[0]);
    const instantReport = scanTextForViolations(SAMPLE_TEXT);
    setScanReport(instantReport);
    setAiOutput(SAMPLE_OUTPUT);
  };

  const handleResetForm = () => {
    setText("");
    setScanReport(null);
    setAiOutput(null);
  };

  const handleScan = async () => {
    const hasAccess = await checkAccess("policy-checker", false);
    if (!hasAccess) return;

    if (!text.trim()) {
      showWarning("Vui lòng nhập hoặc dán nội dung cần kiểm tra vi phạm!", "Thiếu Nội Dung");
      return;
    }

    // 1. Quét tức thì qua từ điển Regex
    const instantReport = scanTextForViolations(text);
    setScanReport(instantReport);

    // 2. Gọi AI để phân tích ngữ cảnh sâu và viết lại bản an toàn
    setLoading(true);
    setAiOutput(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "policy-checker",
          inputs: {
            platform,
            contentType,
            text: text.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showAiError(data);
        return;
      }

      setAiOutput(data.data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
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
      {/* Modals chặn quyền nếu có */}
      <GateModals />

      {/* Header & Breadcrumb */}
      <div className="shrink-0 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/tools" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> Kho Công Cụ AI
            </Link>
            <span>/</span>
            <span className="text-slate-600 dark:text-slate-300">Vận Hành & Xử Lý Rủi Ro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
            AI Soi Từ Khóa Cấm & Vi Phạm Sàn
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs uppercase tracking-wider">
              FREE TOOL
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 uppercase tracking-wide border border-rose-200 dark:border-rose-800">
              Chống Khóa Shop
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rà soát 100% từ cấm theo chính sách TikTok Shop & Shopee          </p>
        </div>

        <div className="flex items-center gap-2">
          <AiUsageBadge tool="policy-checker" refreshTrigger={refreshTrigger} />
          <button
            type="button"
            onClick={handleUseSample}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100/50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles size={13} />
            <span>Dữ Liệu Mẫu</span>
          </button>
        </div>
      </div>

      {/* Grid 2 cột: Trái nhập liệu - Phải hiển thị Output */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:overflow-hidden items-stretch">
        {/* CỘT TRÁI: FORM NHẬP NỘI DUNG */}
        <div className="lg:col-span-5 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 lg:pr-1.5 pb-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nội Dung Cần Rà Soát
                </span>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw size={12} /> Làm mới
                </button>
              </div>

              {/* 1. CHỌN SÀN KIỂM DUYỆT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nền Tảng Đăng Tải
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const isSelected = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                      >
                        <div className="leading-tight">{p.id}</div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                          {p.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CHỌN LOẠI NỘI DUNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Loại Nội Dung Quét
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. KHUNG NHẬP NỘI DUNG */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Nội Dung Cần Soi <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-mono">{text.length} ký tự</span>
                </label>
                <textarea
                  rows={9}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Dán tiêu đề, mô tả sản phẩm, kịch bản video hoặc nội dung quảng cáo bạn chuẩn bị đăng lên sàn vào đây..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>

              {/* NÚT SUBMIT */}
              <button
                type="button"
                onClick={handleScan}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" /> Đang Soi Từ Khóa & Viết Lại...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} /> Quét Vi Phạm & Đề Xuất Bản Sạch
                  </>
                )}
              </button>
            </div>

            {/* Tips Policy */}
            <div className="bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" /> Lưu ý kiểm duyệt sàn 2026:
              </p>
              <p>• <strong>Tránh lách chữ:</strong> Không nên viết kiểu &quot;z.a.l.o&quot;, &quot;s-đ-t&quot; vì AI của sàn vẫn quét ra và sẽ bị phạt lỗi gian lận cố ý.</p>
              <p>• <strong>Dùng bản viết lại:</strong> Sử dụng bản viết lại an toàn do AI đề xuất để vừa cuốn hút vừa tránh mọi rủi ro ăn gậy.</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ HIỂN THỊ */}
        <div className="lg:col-span-7 flex flex-col min-h-0 lg:h-full lg:overflow-hidden">
          <PolicyCheckerOutput
            scanReport={scanReport}
            aiOutput={aiOutput}
            isLoading={loading}
            platform={platform}
            onUseSample={handleUseSample}
            onApplySafeText={(cleanText) => setText(cleanText)}
          />
        </div>
      </div>
    </div>
  );
}
