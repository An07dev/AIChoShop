"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, Clock, Copy, Check, X, Sparkles, FileText, ChevronRight } from "lucide-react";

interface ActivityItem {
  id: string;
  tool: string;
  toolName: string;
  action: string;
  input?: any;
  output?: string | null;
  time: string;
  createdAt: string;
}

interface AiUsageBadgeProps {
  tool?: string;
  refreshTrigger?: number;
  onSelectOutput?: (output: string) => void;
}

export function AiUsageBadge({ tool, refreshTrigger = 0, onSelectOutput }: AiUsageBadgeProps) {
  const [stats, setStats] = useState<{
    isLogged: boolean;
    isVIP: boolean;
    todayCount: number;
    totalGenerated: number;
    dailyFreeLimit: number;
    remainingFree: number | null;
    recentActivities: ActivityItem[];
  }>({
    isLogged: false,
    isVIP: false,
    todayCount: 0,
    totalGenerated: 0,
    dailyFreeLimit: 12,
    remainingFree: 12,
    recentActivities: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ActivityItem | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const url = tool ? `/api/ai/usage?tool=${encodeURIComponent(tool)}` : "/api/ai/usage";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats({
          isLogged: !!data.isLogged,
          isVIP: !!data.isVIP,
          todayCount: data.todayCount || 0,
          totalGenerated: data.totalGenerated || 0,
          dailyFreeLimit: data.dailyFreeLimit || 12,
          remainingFree: data.remainingFree !== undefined ? data.remainingFree : 12,
          recentActivities: data.recentActivities || [],
        });
      }
    } catch {
      // ignore fetch error
    }
  }, [tool]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  const handleCopy = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Nếu chưa đăng nhập, không hiển thị badge
  if (!stats.isLogged) {
    return null;
  }

  const filteredActivities = tool
    ? stats.recentActivities.filter((a) => a.tool === tool)
    : stats.recentActivities;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Badge Lượt Dùng Hôm Nay */}
        <div
          className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs"
          title={
            stats.isVIP
              ? "Tài khoản VIP: Sử dụng không giới hạn"
              : `Hôm nay bạn còn ${stats.remainingFree ?? 0}/${stats.dailyFreeLimit} lượt miễn phí`
          }
        >
          <Zap size={13} className="text-amber-500 fill-amber-500 shrink-0" />
          {stats.isVIP ? (
            <>
              <span className="font-bold text-slate-900 dark:text-white">Không giới hạn</span>
              <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded-sm ml-0.5">
                VIP
              </span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-slate-400 font-normal">Còn:</span>
              <span
                className={`font-black ${(stats.remainingFree ?? 0) <= 2
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
                  }`}
              >
                {stats.remainingFree ?? 0}/{stats.dailyFreeLimit} lượt
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Free</span>
            </>
          )}
        </div>

        {/* Nút Xem Nội Dung Đã Tạo Gần Đây */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs active:scale-95"
          title="Xem các nội dung bạn đã tạo trước đây"
        >
          <Clock size={13} className="text-blue-500 shrink-0" />
          <span className="hidden sm:inline">Lịch sử</span>
        </button>
      </div>

      {/* Modal Lịch Sử Đã Tạo */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => {
              setIsOpen(false);
              setViewingItem(null);
            }}
          />

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {viewingItem ? "Chi tiết nội dung" : "Nội Dung Đã Tạo Gần Đây"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingItem
                      ? viewingItem.toolName
                      : `Tổng cộng ${stats.totalGenerated} bản ghi đã lưu vào tài khoản`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (viewingItem) {
                    setViewingItem(null);
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              {viewingItem ? (
                /* Chi tiết 1 bản ghi */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingItem.action}
                    </span>
                    <span className="text-slate-400">{viewingItem.time}</span>
                  </div>

                  {viewingItem.input && typeof viewingItem.input === "object" && Object.keys(viewingItem.input).length > 0 && (
                    <div className="bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
                      <div className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <FileText size={13} /> Thông số đã nhập:
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300">
                        {Object.entries(viewingItem.input)
                          .filter(([k, v]) => v && typeof v !== "object" && k !== "imageBase64" && k !== "snapshot")
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <div key={k} className="inline-flex items-center gap-1 text-[11px]">
                              <span className="text-slate-400 capitalize">{k}:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {viewingItem.output || "(Không có nội dung)"}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setViewingItem(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Quay lại danh sách
                    </button>
                    {onSelectOutput && viewingItem.output && (
                      <button
                        onClick={() => {
                          onSelectOutput(viewingItem.output || "");
                          setIsOpen(false);
                          setViewingItem(null);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Nạp lại vào trang
                      </button>
                    )}
                    {viewingItem.output && (
                      <button
                        onClick={() => handleCopy(viewingItem.id, viewingItem.output || "")}
                        className="px-4 py-2 text-xs font-bold bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedId === viewingItem.id ? (
                          <>
                            <Check size={14} /> Đã sao chép!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Sao chép nội dung
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Danh sách bản ghi gần đây */
                <div className="space-y-2.5">
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Sparkles size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                        Chưa có nội dung nào được tạo
                      </p>
                      <p className="text-xs mt-1 text-slate-400">
                        Hãy nhập thông tin và bấm Tạo nội dung để trải nghiệm sức mạnh của AI.
                      </p>
                    </div>
                  ) : (
                    filteredActivities.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div
                          className="flex-1 cursor-pointer min-w-0"
                          onClick={() => setViewingItem(item)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                              {item.toolName}
                            </span>
                            <span className="text-[11px] text-slate-400">{item.time}</span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                            {item.action}
                          </h4>
                          {item.output && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.output.replace(/[#*`_]/g, "").slice(0, 80)}...
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          {item.output && (
                            <button
                              onClick={() => handleCopy(item.id, item.output || "")}
                              title="Sao chép nhanh"
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-2xs"
                            >
                              {copiedId === item.id ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setViewingItem(item)}
                            title="Xem chi tiết"
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-2xs"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
