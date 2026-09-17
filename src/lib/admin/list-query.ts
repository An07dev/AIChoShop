export type SearchValues = Record<string, string | string[] | undefined>;
export function listQuery(values: SearchValues) {
    const value = (key: string) => typeof values[key] === "string" ? values[key] as string : "";
    const integer = (key: string, fallback: number) => /^\d{1,6}$/.test(value(key)) ? Number(value(key)) : fallback;
    return { value, q: value("q").trim().slice(0, 128), page: Math.max(1, integer("page", 1)), size: [10, 20, 50].includes(integer("size", 20)) ? integer("size", 20) : 20,
        choice: (key: string, allowed: string[], fallback: string) => allowed.includes(value(key)) ? value(key) : fallback };
}
export function pageWindow(total: number, requested: number, size: number) {
    const pages = Math.max(1, Math.ceil(total / size));
    const page = Math.min(pages, requested);
    return { total, page, pages, size, skip: (page - 1) * size };
}
export function vnDate(value: string): Date | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return undefined;
    const day = new Date(`${value}T00:00:00+07:00`);
    return Number.isFinite(day.getTime()) && new Date(day.getTime() + 7 * 3600000).toISOString().slice(0, 10) === value ? day : undefined;
}
export function dateRange(from: string, to: string) {
    const start = vnDate(from), end = vnDate(to);
    if ((from && !start) || (to && !end) || (start && end && start > end))
        return { error: "Khoảng ngày không hợp lệ. Hãy chọn ngày bắt đầu không sau ngày kết thúc.", bounds: undefined };
    return { error: "", bounds: start || end ? { ...(start && { gte: start }), ...(end && { lt: new Date(end.getTime() + 86400000) }) } : undefined };
}
