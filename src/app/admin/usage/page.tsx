import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { listQuery, pageWindow, dateRange, type SearchValues } from "@/lib/admin/list-query";
import { TOOL_NAMES } from "@/lib/ai-tools-config";
import { redactText } from "@/lib/privacy/policy";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { History, Sparkles, Clock } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lịch Sử Sử Dụng Công Cụ - AIChoShop Admin",
  description: "Nhật ký lượt sử dụng AI phục vụ đối soát quota học viên.",
};

export default async function AdminUsage({
  searchParams,
}: {
  searchParams: Promise<SearchValues>;
}) {
  await requireAdmin();
  const values = await searchParams;
  const q = listQuery(values);
  const range = dateRange(q.value("from"), q.value("to"));
  const tool = q.value("tool");
  const sort = q.choice("sort", ["newest", "oldest"], "newest");

  const where: Prisma.AiUsageLogWhereInput = {
    ...(range.error ? { id: "" } : {}),
    ...(tool && { tool }),
    ...(range.bounds && { createdAt: range.bounds }),
    ...(q.q && {
      OR: [
        { userId: q.q },
        { user: { email: { contains: q.q, mode: "insensitive" } } },
        { user: { name: { contains: q.q, mode: "insensitive" } } },
      ],
    }),
  };

  const totalCount = await prisma.aiUsageLog.count({ where });
  const window = pageWindow(totalCount, q.page, q.size);

  const rows = await prisma.aiUsageLog.findMany({
    where,
    skip: window.skip,
    take: window.size,
    orderBy: [{ createdAt: sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
    select: {
      id: true,
      tool: true,
      toolName: true,
      action: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const listControls = (
    <AdminListControls
      embedded
      path="/admin/usage"
      values={values}
      window={window}
      error={range.error}
      dateLabel="Ngày sử dụng (VN)"
      filters={[
        {
          name: "tool",
          label: "Công cụ",
          options: [
            { value: "", label: "Tất cả công cụ" },
            ...Object.entries(TOOL_NAMES).map(([value, label]) => ({
              value,
              label,
            })),
          ],
        },
        {
          name: "sort",
          label: "Sắp xếp",
          options: [
            { value: "newest", label: "Mới nhất trước" },
            { value: "oldest", label: "Cũ nhất trước" },
          ],
        },
      ]}
    />
  );

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col w-full lg:w-[70%] mx-auto space-y-4">
      {/* ── TIÊU ĐỀ TRANG LỊCH SỬ DÙNG AI ── */}
      <AdminPageHeader
        title="Lịch Sử Sử Dụng Công Cụ AI"
        subtitle="Nhật ký lượt sử dụng phục vụ đối soát quota học viên. Bảo mật thông tin: Không lưu và không hiển thị nội dung chi tiết."
        icon={History}
        iconGradient="from-violet-600 to-indigo-600"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs">
            {totalCount.toLocaleString("vi-VN")} lượt dùng
          </span>
        }
      />

      {/* ── BẢNG DỮ LIỆU & BỘ LỌC (CHỈ CUỘN BẢNG, KHÔNG CUỘN TRANG) ── */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Bộ lọc dính phía trên bảng */}
        <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white">
          {listControls}
        </div>

        {/* Bảng dữ liệu - Cuộn độc lập */}
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider shadow-2xs">
              <tr>
                <th className="px-4 py-3 font-bold bg-slate-50 whitespace-nowrap min-w-[170px]">
                  Thời Gian (VN)
                </th>
                <th className="px-4 py-3 font-bold bg-slate-50 whitespace-nowrap min-w-[200px]">
                  Người Dùng
                </th>
                <th className="px-4 py-3 font-bold bg-slate-50 whitespace-nowrap min-w-[180px]">
                  Công Cụ AI
                </th>
                <th className="px-4 py-3 font-bold bg-slate-50 whitespace-nowrap">
                  Hoạt Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <History size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-600 text-sm">
                      Không tìm thấy lượt sử dụng phù hợp
                    </p>
                    <p className="text-xs mt-1 text-slate-400">
                      Hãy thử thay đổi từ khóa, khoảng ngày hoặc bộ lọc công cụ
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const initials = (row.user.name || row.user.email)
                    .slice(0, 2)
                    .toUpperCase();
                  const formattedDate = row.createdAt.toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Cột Thời Gian */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 font-medium">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          ID: {row.id.slice(0, 8)}...
                        </span>
                      </td>

                      {/* Cột Người Dùng */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                              {row.user.name || "Chưa đặt tên"}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono block truncate max-w-[180px]">
                              {row.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột Công Cụ */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100 shadow-2xs">
                          <Sparkles size={11} className="text-violet-500 shrink-0" />
                          <span>{row.toolName}</span>
                        </span>
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5 pl-0.5">
                          {row.tool}
                        </span>
                      </td>

                      {/* Cột Hoạt Động */}
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200/80">
                          {redactText(row.action)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
