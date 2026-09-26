"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Star,
  Trash2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  X,
  Clock,
  RotateCcw,
  FolderArchive,
  ArrowRight,
  FileText,
  AlertTriangle,
  Code2,
} from "lucide-react";
import { deleteHistoryItem, clearAllUserHistory } from "@/app/actions/history";
import {
  getHumanReadableSnippet,
  getCleanPlainText,
} from "@/lib/history-formatter";

export interface HistoryRecord {
  id: string;
  tool: string;
  toolName: string;
  action: string;
  input: string | null;
  output: string | null;
  createdAt: string;
}

interface HistoryClientProps {
  initialLogs: HistoryRecord[];
  user: {
    id: string;
    name: string | null;
    email: string;
    isVIP: boolean;
  };
}

export default function HistoryClient({ initialLogs, user }: HistoryClientProps) {
  const [logs, setLogs] = useState<HistoryRecord[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // ID của bản ghi đang chọn để hiển thị chi tiết (Master - Detail)
  const [selectedId, setSelectedId] = useState<string | null>(initialLogs[0]?.id || null);
  const [activeTab, setActiveTab] = useState<"text" | "input" | "json">("text");
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Danh sách ID yêu thích lưu trong localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State modal xác nhận xóa tất cả
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [, startDeleteTransition] = useTransition();

  // Tải danh sách yêu thích từ localStorage
  useEffect(() => {
    try {
      const storageKey = `aicho_favs_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setFavoriteIds(parsed);
          });
        }
      }
    } catch {
      // Bỏ qua lỗi
    }
  }, [user.id]);

  // Bật/tắt yêu thích
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        const storageKey = `aicho_favs_${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Bỏ qua lỗi
      }
      return next;
    });
  };

  // Sao chép nội dung văn bản thuần túy (dễ đọc, sẵn sàng dán)
  const handleCopy = (id: string, item: HistoryRecord) => {
    const textToCopy = getCleanPlainText(item.output, item.tool, item.action);
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Tải file văn bản .TXT chuẩn tiếng Việt (không chứa JSON thô)
  const handleDownloadTxt = (item: HistoryRecord) => {
    const content = getCleanPlainText(item.output, item.tool, item.action);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.tool}_${item.id.slice(-6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Xóa 1 bản ghi
  const handleDeleteOne = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;

    startDeleteTransition(async () => {
      const res = await deleteHistoryItem(id);
      if (res.success) {
        setLogs((prev) => {
          const next = prev.filter((l) => l.id !== id);
          if (selectedId === id) {
            setSelectedId(next[0]?.id || null);
          }
          return next;
        });
      } else {
        alert(res.error || "Không thể xóa bản ghi.");
      }
    });
  };

  // Xóa toàn bộ lịch sử
  const handleClearAll = async () => {
    startDeleteTransition(async () => {
      const res = await clearAllUserHistory();
      if (res.success) {
        setLogs([]);
        setSelectedId(null);
        setIsClearModalOpen(false);
      } else {
        alert(res.error || "Không thể xóa toàn bộ lịch sử.");
      }
    });
  };

  // Danh sách công cụ duy nhất
  const availableTools = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.tool && l.toolName) {
        map.set(l.tool, l.toolName);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [logs]);

  // Bộ lọc dữ liệu
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();
    const q = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      if (selectedTool !== "all" && log.tool !== selectedTool) {
        return false;
      }
      if (onlyFavorites && !favoriteIds.includes(log.id)) {
        return false;
      }
      if (timeFilter !== "all") {
        const logTime = new Date(log.createdAt).getTime();
        const diffHours = (now - logTime) / (1000 * 60 * 60);
        if (timeFilter === "today" && diffHours > 24) return false;
        if (timeFilter === "7days" && diffHours > 24 * 7) return false;
        if (timeFilter === "30days" && diffHours > 24 * 30) return false;
      }
      if (!q) return true;

      const inAction = log.action.toLowerCase().includes(q);
      const inTool = log.toolName.toLowerCase().includes(q);
      const inOutput = (log.output || "").toLowerCase().includes(q);
      const inInput = (log.input || "").toLowerCase().includes(q);

      return inAction || inTool || inOutput || inInput;
    });
  }, [logs, searchQuery, selectedTool, timeFilter, onlyFavorites, favoriteIds]);

  // Tự động chọn item đầu tiên nếu item đang chọn không tồn tại trong danh sách lọc
  const activeRecord = useMemo(() => {
    if (!filteredLogs.length) return null;
    return filteredLogs.find((l) => l.id === selectedId) || filteredLogs[0];
  }, [filteredLogs, selectedId]);

  // Xuất file Excel với nội dung định dạng tiếng Việt dễ đọc
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;

    const dataToExport = filteredLogs.map((log, index) => ({
      STT: index + 1,
      "Công cụ": log.toolName,
      "Thời gian tạo": new Date(log.createdAt).toLocaleString("vi-VN"),
      "Hành động / Tóm tắt": log.action,
      "Nội dung AI đã sinh (Dễ đọc)": getCleanPlainText(log.output, log.tool, log.action),
      "Thông số đầu vào": log.input || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AI Content Vault");

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 20 },
      { wch: 35 },
      { wch: 70 },
      { wch: 35 },
    ];

    XLSX.writeFile(
      workbook,
      `AIChoShop_AI_Content_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const formatShortTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatFullDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };

  return (
    <div className="w-full flex-1 flex flex-col h-[calc(100vh-130px)] min-h-[580px] max-w-7xl mx-auto overflow-hidden">
      {/* 1. THANH ĐIỀU KHIỂN TẬP TRUNG GỌN GÀNG (SINGLE-LINE CONTROL BAR) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 mb-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Tiêu đề & Đếm */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FolderArchive size={17} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Kho Nội Dung AI
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20">
                {filteredLogs.length}/{logs.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block leading-tight mt-0.5">
              Nội dung tự động định dạng trực quan, không hiển thị mã JSON thô
            </p>
          </div>
        </div>

        {/* Bộ lọc & Thao tác nhanh */}
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end">
          {/* Ô tìm kiếm gọn */}
          <div className="relative flex-1 sm:w-56 min-w-[140px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-7 pr-6 py-1.5 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors h-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Lọc theo Tool */}
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="hidden md:block bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2 py-1.5 rounded-lg focus:outline-none focus:border-brand cursor-pointer h-8 max-w-[150px] truncate"
          >
            <option value="all">🛠️ Tất cả Tools</option>
            {availableTools.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Nút chỉ hiện yêu thích */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title="Chỉ hiện mục yêu thích"
            className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border shrink-0 ${
              onlyFavorites
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
          >
            <Star size={13} className={onlyFavorites ? "fill-amber-500 text-amber-500" : ""} />
            <span className="hidden sm:inline">⭐ {favoriteIds.length > 0 ? `(${favoriteIds.length})` : ""}</span>
          </button>

          {/* Xuất Excel */}
          <button
            onClick={handleExportExcel}
            disabled={filteredLogs.length === 0}
            title="Xuất file Excel tiếng Việt"
            className="h-8 px-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* Dọn dẹp */}
          {logs.length > 0 && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              title="Xóa tất cả lịch sử"
              className="h-8 px-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Lối tắt quay về Tools */}
          <Link
            href="/tools"
            title="Mở kho công cụ AI"
            className="h-8 px-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
          >
            <Sparkles size={12} />
            <span className="hidden lg:inline">Công cụ</span>
          </Link>
        </div>
      </div>

      {/* 2. KHÔNG GIAN LÀM VIỆC CHÍNH: MASTER - DETAIL SPLIT VIEW */}
      <div className="flex-1 flex gap-2.5 overflow-hidden min-h-0 min-w-0 w-full">
        {/* CỘT TRÁI: DANH SÁCH BẢN GHI (30% ĐỘ RỘNG) */}
        <div className="w-full md:w-[30%] min-w-[280px] max-w-[360px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0 shadow-xs">
          {/* Thanh phụ hiển thị số lượng & reset */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="font-semibold">
              {filteredLogs.length} bản ghi
            </span>
            {(searchQuery || selectedTool !== "all" || timeFilter !== "all" || onlyFavorites) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTool("all");
                  setTimeFilter("all");
                  setOnlyFavorites(false);
                }}
                className="text-brand font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={10} /> Đặt lại
              </button>
            )}
          </div>

          {/* Danh sách cuộn */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1.5 space-y-1">
            {filteredLogs.map((item) => {
              const isSelected = activeRecord?.id === item.id;
              const isFav = favoriteIds.includes(item.id);
              const previewText = getHumanReadableSnippet(item.output, item.tool, item.action);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setIsMobileDetailOpen(true);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border text-left group relative ${
                    isSelected
                      ? "bg-brand/5 dark:bg-brand/10 border-brand/30 dark:border-brand/40 shadow-xs"
                      : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200/60 dark:hover:border-slate-800"
                  }`}
                >
                  {/* Row 1: Tool Tag + Time + Star */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-brand transition-colors truncate max-w-[190px]">
                      {item.toolName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatShortTime(item.createdAt)}
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                          isFav ? "text-amber-500" : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100"
                        }`}
                        title={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                      >
                        <Star size={12} className={isFav ? "fill-amber-500 opacity-100" : ""} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Action Title */}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.action}
                  </h4>

                  {/* Row 3: Output snippet (DỄ HIỂU - KHÔNG JSON) */}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                    {previewText}
                  </p>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <FileText size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Không tìm thấy nội dung
                </p>
                <p className="text-[11px] text-slate-400">
                  Thử tìm với từ khóa khác hoặc đặt lại bộ lọc.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT NỘI DUNG (70% ĐỘ RỘNG, MIN-W-0 CHỐNG TRÀN) */}
        <div className="hidden md:flex flex-1 md:w-[70%] min-w-0 flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {activeRecord ? (
            <>
              {/* Header chi tiết: 2 Dòng riêng biệt hoàn toàn */}
              <div className="p-3 sm:px-5 sm:py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 shrink-0 space-y-1.5 min-w-0 w-full">
                {/* DÒNG 1: Metadata (Tag, Giờ) bên trái & Dải nút thao tác bên phải */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand border border-brand/20">
                      {activeRecord.toolName}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {formatFullDateTime(activeRecord.createdAt)}
                    </span>
                  </div>

                  {/* Toolbar thao tác */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Sao chép văn bản thuần */}
                    <button
                      onClick={() => handleCopy(activeRecord.id, activeRecord)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedId === activeRecord.id ? (
                        <>
                          <Check size={13} className="text-white" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>

                    {/* Tải .TXT tiếng Việt */}
                    <button
                      onClick={() => handleDownloadTxt(activeRecord)}
                      title="Tải văn bản .TXT chuẩn"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                    >
                      <Download size={13} />
                      <span className="hidden lg:inline">Tải .TXT</span>
                    </button>

                    {/* Yêu thích */}
                    <button
                      onClick={() => toggleFavorite(activeRecord.id)}
                      title={favoriteIds.includes(activeRecord.id) ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                        favoriteIds.includes(activeRecord.id)
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30"
                          : "text-slate-400 hover:text-amber-500 bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80"
                      }`}
                    >
                      <Star size={14} className={favoriteIds.includes(activeRecord.id) ? "fill-amber-500" : ""} />
                    </button>

                    {/* Xóa */}
                    <button
                      onClick={(e) => handleDeleteOne(activeRecord.id, e)}
                      title="Xóa bản ghi này"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Mở tool */}
                    <Link
                      href={`/tools/${activeRecord.tool}`}
                      title="Mở công cụ này"
                      className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>

                {/* DÒNG 2: Tiêu đề tác vụ tự động xuống dòng khi dài, không làm vỡ layout */}
                <div className="min-w-0 w-full overflow-hidden">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug break-words [overflow-wrap:anywhere] whitespace-normal">
                    {activeRecord.action}
                  </h2>
                </div>
              </div>

              {/* Tabs chuyển đổi: Nội dung AI đã tạo | Dữ liệu đầu vào | Mã JSON thô */}
              <div className="px-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 shrink-0">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "text"
                      ? "border-brand text-brand"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <FileText size={13} />
                  <span>📄 Nội dung AI đã tạo</span>
                </button>

                {activeRecord.input && (
                  <button
                    onClick={() => setActiveTab("input")}
                    className={`py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "input"
                        ? "border-brand text-brand"
                        : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    <span>📥 Dữ liệu đầu vào</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("json")}
                  className={`py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                    activeTab === "json"
                      ? "border-slate-500 text-slate-700 dark:text-slate-200"
                      : "border-transparent text-slate-400 hover:text-slate-500"
                  }`}
                >
                  <Code2 size={12} />
                  <span className="text-[11px]">Mã JSON gốc</span>
                </button>
              </div>

              {/* Vùng xem nội dung chính (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 select-text">
                {activeTab === "text" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Nội dung đã được trích xuất thành văn bản thuần, sẵn sàng sao chép:</span>
                      <button
                        onClick={() => handleCopy(activeRecord.id, activeRecord)}
                        className="text-brand font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} /> Sao chép toàn bộ
                      </button>
                    </div>
                    <pre className="font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] overflow-x-hidden bg-slate-50/50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 select-text">
                      {getCleanPlainText(activeRecord.output, activeRecord.tool, activeRecord.action)}
                    </pre>
                  </div>
                )}

                {activeTab === "input" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Các tham số và prompt đầu vào đã cung cấp cho AI:</p>
                    <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap break-all">
                      {activeRecord.input}
                    </pre>
                  </div>
                )}

                {activeTab === "json" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Dữ liệu JSON kỹ thuật gốc được lưu trong cơ sở dữ liệu:</p>
                    <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap break-all overflow-x-auto">
                      {activeRecord.output}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <FolderArchive size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Chưa có bản ghi nào được chọn
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Hãy nhấp vào một bản ghi ở cột bên trái để xem đầy đủ nội dung văn bản, sao chép hoặc tải file.
              </p>
              <Link
                href="/tools"
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover shadow-xs"
              >
                <span>Dùng công cụ AI tạo ngay</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL XEM CHI TIẾT TRÊN MOBILE (< md) */}
      {isMobileDetailOpen && activeRecord && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col border-t border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header mobile drawer */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
                  {activeRecord.toolName}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-words [overflow-wrap:anywhere] whitespace-normal">
                  {activeRecord.action}
                </h3>
              </div>
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(activeRecord.id, activeRecord)}
                className="flex-1 py-2 rounded-xl bg-brand text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copiedId === activeRecord.id ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === activeRecord.id ? "Đã chép!" : "Sao chép"}</span>
              </button>

              <button
                onClick={() => handleDownloadTxt(activeRecord)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
              >
                <Download size={14} />
                <span>.TXT</span>
              </button>

              <button
                onClick={() => toggleFavorite(activeRecord.id)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-amber-500 border border-slate-200 dark:border-slate-700"
              >
                <Star size={16} className={favoriteIds.includes(activeRecord.id) ? "fill-amber-500" : ""} />
              </button>

              <button
                onClick={(e) => {
                  handleDeleteOne(activeRecord.id, e);
                  setIsMobileDetailOpen(false);
                }}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-700"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Content Mobile: Văn bản thuần chuẩn sạch sẽ */}
            <div className="p-4 flex-1 overflow-y-auto select-text">
              <pre className="font-sans text-xs text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 select-text">
                {getCleanPlainText(activeRecord.output, activeRecord.tool, activeRecord.action)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL XÁC NHẬN XÓA TẤT CẢ */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xóa toàn bộ lịch sử?
                </h3>
                <p className="text-xs text-slate-500">
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa toàn bộ <strong>{logs.length}</strong> nội dung AI đã tạo trong kho lưu trữ của mình?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
