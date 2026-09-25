import Link from "next/link";
import Form from "next/form";
import type { SearchValues } from "@/lib/admin/list-query";
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

type Filter = {
  name: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
};

export function AdminListControls({
  path,
  values,
  window,
  filters = [],
  dateLabel,
  error,
  embedded = false,
}: {
  path: string;
  values: SearchValues;
  window: {
    total: number;
    page: number;
    pages: number;
    size: number;
  };
  filters?: Filter[];
  dateLabel?: string;
  error?: string;
  embedded?: boolean;
}) {
  const value = (name: string) =>
    typeof values[name] === "string" ? (values[name] as string) : "";

  const href = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, v] of Object.entries(values)) {
      if (typeof v === "string" && v) query.set(key, v);
    }
    query.set("page", String(page));
    query.set("size", String(window.size));
    return `${path}?${query}`;
  };

  const fieldClass =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";

  return (
    <section
      className={
        embedded
          ? "min-w-0 space-y-4"
          : "rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
      }
    >
      <Form
        key={JSON.stringify(values)}
        action={path}
        scroll={false}
        className="flex flex-wrap items-end gap-3"
      >
        {/* Tìm kiếm */}
        <div className="grid gap-1 text-xs font-bold text-slate-700 min-w-[200px] flex-1 sm:flex-initial sm:w-64">
          <span>Tìm kiếm</span>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              name="q"
              defaultValue={value("q")}
              maxLength={128}
              placeholder="Tên, email hoặc mã…"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Bộ lọc lựa chọn */}
        {filters.map((filter) => (
          <div
            key={filter.name}
            className="grid gap-1 text-xs font-bold text-slate-700 min-w-[130px]"
          >
            <span>{filter.label}</span>
            <select
              name={filter.name}
              defaultValue={value(filter.name) || filter.options[0]?.value}
              className={fieldClass}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Khoảng ngày (VN) */}
        {dateLabel && (
          <>
            <div className="grid gap-1 text-xs font-bold text-slate-700">
              <span>{dateLabel}: từ</span>
              <input
                type="date"
                name="from"
                defaultValue={value("from")}
                className={fieldClass}
              />
            </div>
            <div className="grid gap-1 text-xs font-bold text-slate-700">
              <span>Đến hết ngày</span>
              <input
                type="date"
                name="to"
                defaultValue={value("to")}
                className={fieldClass}
              />
            </div>
          </>
        )}

        {/* Số bản ghi mỗi trang */}
        <div className="grid gap-1 text-xs font-bold text-slate-700 w-24">
          <span>Mỗi trang</span>
          <select
            name="size"
            defaultValue={window.size}
            className={fieldClass}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Nút thao tác lọc */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Filter size={13} />
            <span>Áp dụng</span>
          </button>
          <Link
            href={path}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Xóa lọc</span>
          </Link>
        </div>
      </Form>

      {error && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium"
        >
          {error}
        </div>
      )}

      {/* Thanh Phân Trang */}
      <nav
        aria-label="Phân trang"
        className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500"
      >
        <div>
          Tổng cộng{" "}
          <span className="font-bold text-slate-900">
            {window.total.toLocaleString("vi-VN")}
          </span>{" "}
          kết quả · Trang{" "}
          <span className="font-bold text-slate-900">{window.page}</span> /{" "}
          <span className="font-bold text-slate-900">
            {Math.max(1, window.pages)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {window.page > 1 ? (
            <Link
              href={href(window.page - 1)}
              scroll={false}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-all"
            >
              <ChevronLeft size={13} />
              <span>Trang trước</span>
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-300 font-medium flex items-center gap-1 cursor-not-allowed">
              <ChevronLeft size={13} />
              <span>Trang trước</span>
            </span>
          )}

          {window.page < window.pages ? (
            <Link
              href={href(window.page + 1)}
              scroll={false}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-all"
            >
              <span>Trang sau</span>
              <ChevronRight size={13} />
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-300 font-medium flex items-center gap-1 cursor-not-allowed">
              <span>Trang sau</span>
              <ChevronRight size={13} />
            </span>
          )}
        </div>
      </nav>
    </section>
  );
}
