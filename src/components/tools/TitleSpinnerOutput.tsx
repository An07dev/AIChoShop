"use client";

import { useState, useMemo } from "react";
import { Copy, Check, FileSpreadsheet, Sparkles, LayoutList, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { TextDots } from "@/components/ui/text-dots";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface TitleItem {
  id: number;
  title: string;
  charCount: number;
  isSafe: boolean; // <= 120 ký tự là chuẩn cho Shopee/TikTok
}

interface TitleSpinnerOutputProps {
  result: string;
  loading: boolean;
  originalTitle: string;
}

export function TitleSpinnerOutput({ result, loading, originalTitle }: TitleSpinnerOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "raw">("cards");

  // Hàm bóc tách kết quả từ text của AI thành danh sách các tiêu đề
  const titleList: TitleItem[] = useMemo(() => {
    if (!result) return [];

    const lines = result.split("\n").map(line => line.trim()).filter(Boolean);
    const parsed: TitleItem[] = [];

    lines.forEach((line) => {
      // Tìm các dòng dạng "1. Tiêu đề", "1/ Tiêu đề", "- Tiêu đề", "* Tiêu đề", "Biến thể 1: Tiêu đề"
      const match = line.match(/^(?:(?:\d+[\.\/\:\)-]|\*|\-|\+|(?:Biến thể|Tiêu đề)\s*\d+[\:\.\-]?))\s*(.+)$/i);
      let text = match ? match[1] : line;

      // Loại bỏ các ký tự markdown thừa như ** hoặc dấu ngoặc kép ở đầu/cuối
      text = text.replace(/^\*\*|\*\*$/g, "").replace(/^["']|["']$/g, "").trim();

      // Bỏ qua các dòng tiêu đề chung chung như "Dưới đây là 10 tiêu đề...", "Chúc bạn bán đắt hàng..."
      if (
        text.length > 10 &&
        !text.toLowerCase().startsWith("dưới đây") &&
        !text.toLowerCase().startsWith("chúc bạn") &&
        !text.toLowerCase().startsWith("lưu ý")
      ) {
        parsed.push({
          id: parsed.length + 1,
          title: text,
          charCount: text.length,
          isSafe: text.length <= 120,
        });
      }
    });

    // Nếu không bóc tách được theo format danh sách thì fallback lấy theo từng dòng
    if (parsed.length === 0 && result.trim()) {
      return [
        {
          id: 1,
          title: result.trim(),
          charCount: result.trim().length,
          isSafe: result.trim().length <= 120,
        },
      ];
    }

    return parsed;
  }, [result]);

  // Sao chép từng tiêu đề
  const handleCopySingle = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Sao chép tất cả tiêu đề
  const handleCopyAll = () => {
    if (!result) return;
    const allTitles = titleList.length > 0
      ? titleList.map(t => `${t.id}. ${t.title}`).join("\n")
      : result;
    navigator.clipboard.writeText(allTitles);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Xuất file Excel (.xlsx)
  const handleExportExcel = () => {
    if (titleList.length === 0) return;

    // Chuẩn bị dữ liệu cho bảng tính
    const excelData = titleList.map((item) => ({
      "STT": item.id,
      "Tiêu Đề Nhân Bản (Spin Content)": item.title,
      "Số Ký Tự": item.charCount,
      "Chuẩn Sàn (<= 120 Ký Tự)": item.isSafe ? "Đạt chuẩn" : "Vượt quá (Cần rút gọn)",
      "Tiêu Đề Gốc": originalTitle || "N/A",
      "Nền Tảng Đề Xuất": "Shopee / TikTok Shop / Lazada",
    }));

    // Tạo Worksheet và Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Căn chỉnh độ rộng các cột
    worksheet["!cols"] = [
      { wch: 6 },   // STT
      { wch: 65 },  // Tiêu đề nhân bản
      { wch: 12 },  // Số ký tự
      { wch: 22 },  // Chuẩn sàn
      { wch: 45 },  // Tiêu đề gốc
      { wch: 30 },  // Nền tảng
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TieuDeNhanBan");

    // Tạo tên file với timestamp
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `AIChoShop_TieuDe_${dateStr}.xlsx`;

    // Tải file về máy
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-teal-500/20 text-teal-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-none">Kho Tiêu Đề Nhân Bản</h2>
          </div>
          {titleList.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-500/20 text-teal-300 border-teal-500/40">
              {titleList.length} Biến Thể Spin
            </span>
          )}
        </div>

        {/* Cụm nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Dạng thẻ trực quan"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "cards" ? "bg-teal-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} /> Thẻ
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản thô"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw" ? "bg-teal-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Gốc
              </button>
            </div>

            {/* Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={13} /> Xuất Excel (.xlsx)
            </button>

            {/* Nút Sao chép tất cả */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-white/10 active:scale-95"
            >
              {copiedAll ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedAll ? "Đã chép" : "Chép tất cả"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung kết quả có thanh cuộn riêng */}
      <div className="p-3.5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 shadow-lg shadow-teal-500/10">
              <FileSpreadsheet size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">Chưa Có Dữ Liệu Nhân Bản</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nhập tiêu đề sản phẩm gốc ở cột bên trái và bấm <strong className="text-teal-400 font-semibold">"Nhân Bản Bằng AI"</strong> để tạo 10 tiêu đề chuẩn SEO chống quét trùng lặp và tải về file Excel.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] text-slate-400">
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <Sparkles size={11} className="text-teal-400" /> 10 Biến thể khác biệt
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <CheckCircle2 size={11} className="text-emerald-400" /> Chuẩn &le; 120 ký tự
              </span>
              <span className="flex gap-1 items-center border border-slate-700/80 bg-slate-800/50 rounded-full px-2.5 py-1 text-slate-300">
                <FileSpreadsheet size={11} className="text-cyan-400" /> Xuất Excel 1 chạm
              </span>
            </div>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
              <Sparkles size={26} className="animate-spin text-teal-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Xào Nấu & Nhân Bản 10 Tiêu Đề...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Đang giữ nguyên từ khóa chính, đảo cấu trúc câu và tạo 10 biến thể tự nhiên chống thuật toán quét trùng lặp...
              </p>
            </div>
          </div>
        )}

        {/* Kết quả khi đã sinh xong */}
        {result && !loading && (
          <>
            {viewMode === "cards" ? (
              <div className="space-y-2">
                {titleList.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/40 p-2.5 rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-teal-900/10 flex items-start justify-between gap-3"
                  >
                    {/* Phần nội dung tiêu đề */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="shrink-0 w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 font-black text-[11px] flex items-center justify-center border border-teal-500/30">
                        #{item.id < 10 ? `0${item.id}` : item.id}
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="text-slate-200 font-medium text-xs leading-snug break-words group-hover:text-white transition-colors">
                          {item.title}
                        </p>

                        <div className="flex items-center gap-2.5 text-[10px]">
                          {/* Đếm số ký tự */}
                          <span className={`inline-flex items-center gap-0.5 font-mono font-bold px-1.5 py-0.2 rounded ${item.isSafe
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            }`}>
                            {item.charCount}/120 ký tự
                          </span>

                          {/* Trạng thái Shopee/TikTok */}
                          {item.isSafe ? (
                            <span className="text-slate-400 flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-400" /> Tối ưu Shopee & TikTok
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              <AlertCircle size={11} /> Có thể bị cắt dấu ...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nút copy từng tiêu đề */}
                    <button
                      onClick={() => handleCopySingle(item.title, item.id)}
                      className={`shrink-0 p-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${copiedId === item.id
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700/60 hover:bg-teal-600 text-slate-300 hover:text-white border border-slate-600/40"
                        }`}
                      title="Sao chép tiêu đề này"
                    >
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                      <span className="hidden sm:inline">{copiedId === item.id ? "Đã chép" : "Copy"}</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Chế độ xem văn bản gốc */
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl h-full overflow-y-auto custom-scrollbar">
                <pre className="text-slate-300 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                  {result}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
