"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileText,
  LayoutList,
  CheckCircle2,
  Lightbulb,
  Search,
  Building2,
  Send,
  Info,
} from "lucide-react";
import { TextShimmerWave } from "@/components/loading-ui/text-shimmer-wave";

interface AppealGeneratorOutputProps {
  result: string;
  loading: boolean;
  platform?: string;
  shopName?: string;
  violationType?: string;
}

export function AppealGeneratorOutput({
  result,
  loading,
  platform = "Shopee",
  shopName,
  violationType,
}: AppealGeneratorOutputProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

  // Phân tích văn bản AI trả về thành: 1. Phân tích vi phạm & 2. Mẫu đơn kháng nghị
  const parsedData = useMemo(() => {
    if (!result) return { coreIssue: "", solution: "", letter: "", rawText: "" };

    let coreIssue = "";
    let solution = "";
    let letter = "";

    // Tìm vị trí phân chia giữa phần 1 (Phân tích) và phần 2 (Mẫu đơn)
    const part2Index = result.search(/#{2,4}\s*2[\.\:\s]*(?:MẪU|Mẫu|ĐƠN|Đơn|MẪU ĐƠN)/i);

    let part1Text = "";
    let part2Text = "";

    if (part2Index !== -1) {
      part1Text = result.slice(0, part2Index);
      part2Text = result.slice(part2Index);
    } else {
      // Nếu không có header phần 2 rõ ràng
      const splitByKinhGui = result.search(/(?:Kính gửi|Thân gửi|Chào đội ngũ|Dear)/i);
      if (splitByKinhGui !== -1) {
        part1Text = result.slice(0, splitByKinhGui);
        part2Text = result.slice(splitByKinhGui);
      } else {
        part2Text = result;
      }
    }

    // Bóc tách vấn đề cốt lõi và cách khắc phục từ part 1
    if (part1Text) {
      const coreIssueMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Vấn đề cốt lõi|Lý do thực sự|Nguyên nhân)[^:\n\r]*[:\-]\s*([\s\S]*?)(?=(?:[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động)|$))/i);
      if (coreIssueMatch) {
        coreIssue = coreIssueMatch[1].replace(/\*+/g, "").trim();
      }

      const solutionMatch = part1Text.match(/[-*•\s]*(?:\*\*|\*)?(?:Cách khắc phục|Giải pháp|Hành động|Cần làm)[^:\n\r]*[:\-]\s*([\s\S]*?)$/i);
      if (solutionMatch) {
        solution = solutionMatch[1].replace(/\*+/g, "").trim();
      }
    }

    // Làm sạch mẫu đơn kháng nghị từ part 2
    if (part2Text) {
      // Bỏ header phần 2
      let cleanLetter = part2Text
        .replace(/^#{2,4}\s*2[^\n]*\n+/i, "")
        .replace(/^[-*•\s]*(?:Viết một|Mẫu đơn|Nội dung đơn|Dài khoảng)[^\n]*\n+/gim, "")
        .trim();

      // Nếu bắt đầu bằng các dấu gạch đầu dòng chú thích, tìm dòng bắt đầu lá đơn (Kính gửi / Tôi là...)
      const letterStart = cleanLetter.search(/(?:Kính gửi|Thân gửi|Kính chào|Chào Ban|Dear|Tôi là|Hôm nay)/i);
      if (letterStart !== -1 && letterStart < 300) {
        cleanLetter = cleanLetter.slice(letterStart);
      }

      letter = cleanLetter.trim();
    }

    // Nếu không tách được mẫu đơn riêng, fallback toàn bộ kết quả làm lá đơn
    if (!letter && result) {
      letter = result.trim();
    }

    return {
      coreIssue,
      solution,
      letter,
      rawText: result,
    };
  }, [result]);

  // Sao chép riêng mẫu đơn kháng nghị
  const handleCopyLetter = () => {
    const textToCopy = parsedData.letter || result;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  // Sao chép toàn bộ kết quả
  const handleCopyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Tải về file text
  const handleDownloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeShop = shopName
      ? shopName.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 20).trim()
      : "DonKhangNghi";
    link.download = `DonKhangNghi_${platform}_${safeShop}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl h-full flex flex-col relative overflow-hidden border border-slate-800">
      {/* Hiệu ứng nền mờ sang trọng với sắc thái Rose & Pink */}
      <div className="absolute top-0 right-0 p-36 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 p-36 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header thanh công cụ thu gọn */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 relative z-10 bg-slate-900/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
            <ShieldAlert size={16} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-sm leading-none">
              Hồ Sơ Kháng Nghị & Mẫu Đơn
            </h2>
            {platform && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {platform}
              </span>
            )}
          </div>
        </div>

        {/* Cụm nút hành động */}
        {result && !loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Chuyển chế độ xem: Trực quan vs Gốc */}
            <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
              <button
                onClick={() => setViewMode("visual")}
                title="Dạng giao diện trực quan"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "visual"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutList size={12} /> Trực quan
              </button>
              <button
                onClick={() => setViewMode("raw")}
                title="Dạng văn bản markdown gốc"
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText size={12} /> Gốc
              </button>
            </div>

            {/* Nút Tải đơn (.txt) */}
            <button
              onClick={handleDownloadTxt}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Download size={13} className="text-rose-400" /> Tải về (.txt)
            </button>

            {/* Nút Sao chép mẫu đơn */}
            <button
              onClick={handleCopyLetter}
              className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-md shadow-rose-950/40 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {copiedLetter ? (
                <CheckCircle2 size={13} className="text-white" />
              ) : (
                <Copy size={13} />
              )}
              {copiedLetter ? "Đã chép đơn" : "Chép mẫu đơn"}
            </button>
          </div>
        )}
      </div>

      {/* Nội dung chính cuộn độc lập */}
      <div className="p-3.5 flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar">
        {/* Trạng thái chưa có dữ liệu */}
        {!result && !loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              Chưa có hồ sơ kháng nghị
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Cung cấp tên shop, loại vi phạm và mô tả chi tiết ở khung bên trái rồi bấm{" "}
              <strong className="text-rose-400 font-semibold">"Viết Đơn Kháng Nghị Bằng AI"</strong>{" "}
              để tạo giải trình thuyết phục và mẫu đơn chuẩn gửi sàn.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
              <Sparkles size={13} className="text-rose-400" />
              <span>Hỗ trợ Shopee, TikTok Shop, Lazada, Facebook</span>
            </div>
          </div>
        )}

        {/* Trạng thái đang tải (Loading) */}
        {loading && (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center gap-3">
            <TextShimmerWave className="text-xl font-medium text-blue-500">
              AI Thinking
            </TextShimmerWave>
            <p className="text-xs text-slate-400 animate-pulse">
              Đang rà soát chính sách sàn {platform} và biên soạn lập luận pháp lý...
            </p>
          </div>
        )}

        {/* Kết quả khi đã có dữ liệu */}
        {result && !loading && (
          <>
            {viewMode === "visual" ? (
              <div className="space-y-3.5">
                {/* Khối 1: Phân tích nguyên nhân & Hướng khắc phục */}
                {(parsedData.coreIssue || parsedData.solution) && (
                  <div className="bg-slate-800/60 border border-rose-500/30 rounded-xl overflow-hidden shadow-lg shadow-rose-950/20">
                    <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                          <Search size={14} />
                        </div>
                        <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                          1. Phân tích vi phạm & Chiến lược gỡ gậy
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Dành cho Seller</span>
                    </div>

                    <div className="p-4 space-y-3">
                      {parsedData.coreIssue && (
                        <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-700/60">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle size={13} className="text-amber-400" />
                            <h4 className="text-xs font-bold text-amber-300">
                              Vấn đề cốt lõi (Lý do thực sự bị phạt):
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-5 font-sans">
                            {parsedData.coreIssue}
                          </p>
                        </div>
                      )}

                      {parsedData.solution && (
                        <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-700/60">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <h4 className="text-xs font-bold text-emerald-300">
                              Cách khắc phục ngay để tránh bị khóa vĩnh viễn:
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pl-5 font-sans">
                            {parsedData.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Khối 2: Mẫu Đơn Kháng Nghị Chuẩn (Copy & Paste gửi sàn) */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
                  <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                        <FileText size={14} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          2. Mẫu đơn kháng nghị chuẩn (Gửi Sàn {platform})
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyLetter}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      {copiedLetter ? (
                        <CheckCircle2 size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copiedLetter ? "Đã chép đơn" : "Sao chép đơn"}
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="relative bg-slate-950/90 rounded-lg p-4 border border-slate-700/80 text-slate-200 text-xs leading-relaxed font-sans select-all selection:bg-rose-500/30 whitespace-pre-wrap">
                      {parsedData.letter}
                    </div>
                  </div>
                </div>

                {/* Khối 3: Lưu ý vàng khi gửi đơn kháng nghị */}
                <div className="bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                      <Lightbulb size={15} />
                    </div>
                    <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                      Mẹo tăng tỷ lệ mở khóa lên 90%+
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Đính kèm bằng chứng thực tế:</strong> Chụp ảnh sản phẩm thật, hóa đơn VAT hoặc giấy ủy quyền phân phối vào phần tệp đính kèm của sàn.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Không spam gửi đơn liên tục:</strong> Chỉ gửi 1 đơn duy nhất và chờ phản hồi từ 24h - 48h làm việc. Gửi nhiều đơn trùng lặp dễ bị hệ thống tự động từ chối.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Thái độ văn minh, nhã nhặn:</strong> Tránh đổ lỗi gay gắt cho sàn, hãy tập trung vào tinh thần hợp tác và giải trình minh bạch.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Chế độ xem Markdown Gốc (Raw Mode) */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative group">
                <pre className="text-slate-300 font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-rose-500/30 overflow-x-auto">
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
