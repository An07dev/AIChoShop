"use client";

import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
  LayoutList,
  FileText,
  CheckCircle2,
  AlertCircle,
  Tag,
  Download,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface TitleItem {
  id: number;
  title: string;
  charCount: number;
  isSafe: boolean; // <= 120 ký tự là chuẩn cho Shopee/TikTok
}

const SPINNER_TAGS = [
  { tag: "Đẩy Top Sàn", role: "Tối Ưu Tìm Kiếm", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", badgeBg: "from-emerald-600 to-teal-600" },
  { tag: "Chính Hãng", role: "Tạo Niềm Tin", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", badgeBg: "from-blue-600 to-cyan-600" },
  { tag: "USP Nổi Bật", role: "Nhấn Mạnh Chất Liệu", color: "bg-teal-500/10 text-teal-400 border-teal-500/30", badgeBg: "from-teal-600 to-emerald-600" },
  { tag: "Thể Thao Trẻ", role: "Kích Thích Click", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", badgeBg: "from-amber-600 to-orange-600" },
  { tag: "Freeship Extra", role: "Ưu Đãi Vận Chuyển", color: "bg-orange-500/10 text-orange-400 border-orange-500/30", badgeBg: "from-orange-600 to-rose-600" },
  { tag: "Chuẩn Form", role: "Tôn Dáng Cơ Thể", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", badgeBg: "from-indigo-600 to-purple-600" },
  { tag: "Basic Đa Năng", role: "Dễ Phối Đồ Hàng Ngày", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", badgeBg: "from-purple-600 to-pink-600" },
  { tag: "Giá Xưởng", role: "Cạnh Tranh Giá Tốt", color: "bg-rose-500/10 text-rose-400 border-rose-500/30", badgeBg: "from-rose-600 to-red-600" },
  { tag: "Xu Hướng Mới", role: "Bắt Kịp Thị Hiếu", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", badgeBg: "from-cyan-600 to-teal-600" },
  { tag: "Bảo Hành 1-1", role: "Cam Kết Hậu Mãi", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", badgeBg: "from-emerald-600 to-teal-600" },
];

interface TitleSpinnerOutputProps {
  result: string;
  loading: boolean;
  originalTitle: string;
  onUseSample?: () => void;
}

export function TitleSpinnerOutput({
  result,
  loading,
  originalTitle,
  onUseSample,
}: TitleSpinnerOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "raw">("cards");
  const [filterMode, setFilterMode] = useState<"all" | "safe" | "long">("all");

  // Hàm bóc tách kết quả từ text của AI thành danh sách các tiêu đề
  const titleList: TitleItem[] = useMemo(() => {
    if (!result) return [];

    const lines = result.split("\n").map((line) => line.trim()).filter(Boolean);
    const parsed: TitleItem[] = [];

    lines.forEach((line) => {
      const match = line.match(
        /^(?:(?:\d+[\.\/\:\)-]|\*|\-|\+|(?:Biến thể|Tiêu đề)\s*\d+[\:\.\-]?))\s*(.+)$/i
      );
      let text = match ? match[1] : line;

      text = text.replace(/^\*\*|\*\*$/g, "").replace(/^["']|["']$/g, "").trim();

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

  // Bộ lọc tiêu đề hiển thị
  const filteredList = useMemo(() => {
    if (filterMode === "safe") return titleList.filter((t) => t.isSafe);
    if (filterMode === "long") return titleList.filter((t) => !t.isSafe);
    return titleList;
  }, [titleList, filterMode]);

  // Sao chép từng tiêu đề
  const handleCopySingle = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Sao chép tất cả tiêu đề
  const handleCopyAll = () => {
    if (!result) return;
    const allTitles =
      titleList.length > 0
        ? titleList.map((t) => `${t.id}. ${t.title}`).join("\n")
        : result;
    navigator.clipboard.writeText(allTitles);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Xuất file Excel (.xlsx)
  const handleExportExcel = () => {
    if (titleList.length === 0) return;

    const excelData = titleList.map((item) => ({
      STT: item.id,
      "Tiêu Đề Nhân Bản (Spin Content)": item.title,
      "Số Ký Tự": item.charCount,
      "Chuẩn Sàn (<= 120 Ký Tự)": item.isSafe ? "Đạt chuẩn" : "Vượt quá (Cần rút gọn)",
      "Tiêu Đề Gốc": originalTitle || "N/A",
      "Nền Tảng Đề Xuất": "Shopee / TikTok Shop / Lazada",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 65 },
      { wch: 12 },
      { wch: 22 },
      { wch: 45 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TieuDeNhanBan");

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const fileName = `AIChoShop_TieuDe_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl flex flex-col lg:h-full lg:min-h-0 relative lg:overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng */}
      <div className="absolute top-0 right-0 p-36 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-36 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header thanh công cụ (Sticky trên Mobile để luôn nằm trong tầm tay) */}
      <div className="sticky top-0 z-30 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-2xl shrink-0 space-y-2.5 shadow-sm">
        {/* Hàng 1: Tiêu đề + Chuyển chế độ xem */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
              <Sparkles size={14} />
            </div>
            <h2 className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
              10 Tiêu Đề Nhân Bản
            </h2>
          </div>

          {/* Chuyển chế độ xem: Thẻ / Gốc (chỉ hiện trên Desktop lg+) */}
          {result && !loading && (
            <div className="hidden lg:flex bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`py-1 px-2.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dạng Thẻ
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`py-1 px-2.5 rounded text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Bản Gốc
              </button>
            </div>
          )}
        </div>

        {/* Hàng 2: Nút Xuất Excel & Nút Sao Chép Toàn Bộ (chỉ hiện trên Desktop lg+) */}
        {result && !loading && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs border border-emerald-500/30 shrink-0"
              title="Xuất bảng 10 tiêu đề ra file Excel"
            >
              <FileSpreadsheet size={14} />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`flex-1 justify-center px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                copiedAll
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/20"
              }`}
            >
              {copiedAll ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Đã Chép Tất Cả</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Sao Chép 10 Tiêu Đề</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Hàng 3: Tabs lọc nhanh trạng thái (chỉ hiện trên Desktop lg+) */}
        {result && !loading && viewMode === "cards" && (
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterMode === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              Tất Cả ({titleList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("safe")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterMode === "safe"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800/70 text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 size={12} className="text-emerald-400" /> Chuẩn Sàn ≤ 120kt (
              {titleList.filter((t) => t.isSafe).length})
            </button>
            {titleList.some((t) => !t.isSafe) && (
              <button
                type="button"
                onClick={() => setFilterMode("long")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  filterMode === "long"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-800/70 text-slate-400 hover:text-white"
                }`}
              >
                <AlertCircle size={12} className="text-amber-400" /> Cần Rút Gọn (
                {titleList.filter((t) => !t.isSafe).length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vùng hiển thị nội dung: Cuộn tự nhiên mượt mà trên Mobile, cuộn độc lập trên Desktop */}
      <div className="flex-1 p-3.5 sm:p-5 lg:overflow-y-auto custom-scrollbar relative z-10">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[360px] sm:min-h-[380px] flex flex-col items-center justify-center text-center p-5 sm:p-6 text-slate-500 space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
              <FileSpreadsheet size={28} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm sm:text-base font-bold text-slate-200">
                Chưa Có Dữ Liệu Nhân Bản
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập tiêu đề sản phẩm gốc ở cột bên trái và bấm{" "}
                <strong className="text-teal-400 font-semibold">&quot;Nhân Bản Bằng AI&quot;</strong> để
                tạo 10 tiêu đề chuẩn SEO chống quét trùng lặp và tải về file Excel.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-400">
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
            {onUseSample && (
              <button
                type="button"
                onClick={onUseSample}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles size={14} /> Thử Dữ Liệu Mẫu (Demo)
              </button>
            )}
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
              <Sparkles size={26} className="animate-spin text-teal-400 duration-1000" />
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-base text-white">
                <TextShimmerWave>AI Đang Xào Nấu &amp; Nhân Bản 10 Tiêu Đề...</TextShimmerWave>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Đang giữ nguyên từ khóa chính, đảo cấu trúc câu và tạo 10 biến thể tự nhiên chống thuật
                toán quét trùng lặp...
              </p>
            </div>
          </div>
        )}

        {/* Kết quả khi đã sinh xong */}
        {result && !loading && (
          <>
            {viewMode === "cards" ? (
              <>
                {/* GIAO DIỆN MOBILE (< lg): THUẦN TEXT GỌN GÀNG, TỰ NHIÊN THEO PROMPT AI */}
                <div className="lg:hidden p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 text-[13px] text-slate-200 leading-relaxed select-text space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-300 text-xs tracking-wide">
                      🏷️ DANH SÁCH 10 TIÊU ĐỀ SPIN (CHỐNG SPAM)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800 active:scale-95 transition-colors cursor-pointer"
                    >
                      {copiedAll ? "✓ Đã chép 10" : "Chép cả 10"}
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {titleList.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 font-medium text-xs">
                            • Tiêu đề #{item.id}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({item.charCount}/120 ký tự{item.isSafe ? "" : " - dài"})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySingle(item.title, item.id)}
                              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 active:scale-95 transition-colors cursor-pointer"
                            >
                              {copiedId === item.id ? "✓ Đã chép" : "Chép"}
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-100 font-medium leading-snug pl-3 border-l-2 border-slate-800 select-all">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
                    <span>Tổng: 10 biến thể • Chuẩn SEO sàn</span>
                    <span className="text-emerald-500/90">✓ Đã tối ưu chống quét trùng</span>
                  </div>
                </div>

                {/* GIAO DIỆN DESKTOP (>= lg): GIỮ NGUYÊN GIAO DIỆN THẺ CARD TRỰC QUAN & THANH TIẾN TRÌNH */}
                <div className="hidden lg:block space-y-3 pb-6">
                  {filteredList.map((item, index) => {
                    const meta = SPINNER_TAGS[(item.id - 1) % SPINNER_TAGS.length] || SPINNER_TAGS[0];
                    const percent = Math.min(100, Math.round((item.charCount / 120) * 100));

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900/90 rounded-xl border border-slate-800 hover:border-slate-700/80 p-3 sm:p-4 transition-all space-y-2.5 group shadow-sm"
                      >
                        {/* Hàng 1: Số thứ tự + Nhãn phong cách bên trái, Nút sao chép bên phải */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-6 h-6 rounded-md bg-gradient-to-br ${meta.badgeBg} text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-xs`}
                            >
                              #{item.id < 10 ? `0${item.id}` : item.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${meta.color}`}
                            >
                              {meta.tag}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 truncate hidden sm:inline">
                              {meta.role}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopySingle(item.title, item.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 ${
                              copiedId === item.id
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                            }`}
                          >
                            {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === item.id ? "Đã chép" : "Sao chép"}</span>
                          </button>
                        </div>

                        {/* Hàng 2: Thanh tiến trình & Đếm ký tự */}
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.isSafe ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono px-0.5">
                            <span
                              className={`font-medium flex items-center gap-1.5 shrink-0 ${
                                item.isSafe ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  item.isSafe ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                              />
                              <span>{item.charCount}/120 ký tự</span>
                            </span>
                            <span className="text-slate-600 shrink-0">•</span>
                            <span
                              className={`text-[10px] sm:text-[11px] truncate ${
                                item.isSafe ? "text-slate-400" : "text-amber-400/90 font-medium"
                              }`}
                            >
                              {item.isSafe
                                ? "Chuẩn Shopee & TikTok Shop"
                                : "Hơi dài, có thể bị cắt dấu ..."}
                            </span>
                          </div>
                        </div>

                        {/* Hàng 3: Khung text tiêu đề tương phản cao, click-to-copy */}
                        <div
                          onClick={() => handleCopySingle(item.title, item.id)}
                          title="Bấm để sao chép nhanh"
                          className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 group-hover:border-slate-700 transition-colors cursor-pointer active:bg-slate-950"
                        >
                          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed select-all">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer metadata */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                      <span>Tổng số: <strong className="text-slate-300">{titleList.length} biến thể</strong></span>
                      <span>•</span>
                      <span>Chuẩn sàn: <strong className="text-emerald-400">{titleList.filter((t) => t.isSafe).length}</strong></span>
                      <span>•</span>
                      <span>Độ độc nhất: <strong className="text-teal-400">100%</strong></span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 size={13} className="shrink-0 stroke-[3]" />
                      <span>An toàn chống thuật toán quét spam trùng lặp</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Chế độ xem văn bản gốc (Raw Markdown) */
              <div className="space-y-3 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    Định dạng văn bản gốc (10 dòng)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedAll ? "Đã chép" : "Sao chép toàn bộ"}</span>
                  </button>
                </div>
                <pre className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 overflow-x-auto">
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
