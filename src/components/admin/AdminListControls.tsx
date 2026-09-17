import Link from "next/link";
import Form from "next/form";
import type { SearchValues } from "@/lib/admin/list-query";
type Filter = {
    name: string;
    label: string;
    options: {
        value: string;
        label: string;
    }[];
};
export function AdminListControls({ path, values, window, filters = [], dateLabel, error }: {
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
}) {
    const value = (name: string) => typeof values[name] === "string" ? values[name] as string : "";
    const href = (page: number) => { const query = new URLSearchParams(); for (const [key, v] of Object.entries(values))
        if (typeof v === "string" && v)
            query.set(key, v); query.set("page", String(page)); query.set("size", String(window.size)); return `${path}?${query}`; };
    const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
    return <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
  <Form key={JSON.stringify(values)} action={path} scroll={false} className="flex flex-wrap items-end gap-3">
   <label className="grid gap-1 text-xs font-semibold">Tìm kiếm<input name="q" defaultValue={value("q")} maxLength={128} placeholder="Tên, email hoặc mã…" className={field}/></label>
   {filters.map(filter => <label key={filter.name} className="grid gap-1 text-xs font-semibold">{filter.label}<select name={filter.name} defaultValue={value(filter.name) || filter.options[0]?.value} className={field}>{filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
   {dateLabel && <><label className="grid gap-1 text-xs font-semibold">{dateLabel}: từ<input type="date" name="from" defaultValue={value("from")} className={field}/></label><label className="grid gap-1 text-xs font-semibold">Đến hết ngày<input type="date" name="to" defaultValue={value("to")} className={field}/></label></>}
   <label className="grid gap-1 text-xs font-semibold">Mỗi trang<select name="size" defaultValue={window.size} className={field}>{[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
   <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Áp dụng</button><Link href={path} className="text-sm text-blue-700 py-2">Xóa bộ lọc</Link>
  </Form>
  {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-4 text-sm"><span>{window.total.toLocaleString("vi-VN")} kết quả · Trang {window.page}/{window.pages}</span>{window.page > 1 && <Link href={href(window.page - 1)} scroll={false}>← Trang trước</Link>}{window.page < window.pages && <Link href={href(window.page + 1)} scroll={false}>Trang sau →</Link>}</nav>
 </section>;
}
