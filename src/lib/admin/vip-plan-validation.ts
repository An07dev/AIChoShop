export type PlanInput = {
    name: string;
    slug: string;
    price: number;
    originalPrice: number;
    period: string;
    durationDays: number | null;
    desc: string;
    tag: string | null;
    isPopular: boolean;
    features: string[];
    order: number;
    active: boolean;
};
export function validateVipPlan(input: unknown, existing?: PlanInput): PlanInput {
    if (!input || typeof input !== "object" || Array.isArray(input))
        throw Error("Dữ liệu gói VIP không hợp lệ.");
    const raw = input as Record<string, unknown>;
    const allowed = ["name", "slug", "price", "originalPrice", "period", "durationDays", "desc", "tag", "isPopular", "features", "order", "active"];
    if (Object.keys(raw).some(key => !allowed.includes(key)))
        throw Error("Dữ liệu gói có trường không được phép.");
    const data: Record<string, unknown> = { period: "/ tháng", durationDays: 30, desc: "", tag: null, isPopular: false, features: [], order: 0, active: true, ...existing, ...raw };
    const text = (key: string, max: number, required = false) => { const value = data[key]; if (typeof value !== "string" || value.trim().length > max || (required && !value.trim()))
        throw Error(`Thông tin ${key} không hợp lệ.`); return value.trim(); };
    const name = text("name", 100, true);
    const slug = (raw.slug === undefined || raw.slug === "") && !existing ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : data.slug;
    if (typeof slug !== "string" || slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        throw Error("Mã gói phải là chữ thường, số và dấu gạch nối; tối đa 64 ký tự.");
    const integer = (key: string, min: number, max: number) => { const value = data[key]; if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max)
        throw Error(`Giá trị ${key} không hợp lệ.`); return value; };
    const price = integer("price", 1, 2147483647);
    if (data.originalPrice === undefined)
        data.originalPrice = price;
    const originalPrice = integer("originalPrice", price, 2147483647);
    const durationDays = data.durationDays === null ? null : integer("durationDays", 0, 36500);
    for (const key of ["active", "isPopular"])
        if (typeof data[key] !== "boolean")
            throw Error(`Trạng thái ${key} phải là boolean.`);
    if (raw.isPopular === true && data.active === false)
        throw Error("Chỉ gói đang bán mới được gắn nhãn nổi bật.");
    if (!Array.isArray(data.features) || data.features.length > 30 || data.features.some(feature => typeof feature !== "string" || !feature.trim() || feature.length > 200))
        throw Error("Quyền lợi phải là danh sách tối đa 30 dòng, mỗi dòng tối đa 200 ký tự.");
    if (data.tag !== null && typeof data.tag !== "string")
        throw Error("Nhãn gói không hợp lệ.");
    const tag = typeof data.tag === "string" ? text("tag", 80) || null : null;
    return { name, slug, price, originalPrice, durationDays, period: text("period", 80, true), desc: text("desc", 4000), tag, features: data.features.map(feature => feature.trim()), order: integer("order", 0, 100000), active: data.active as boolean, isPopular: data.active ? data.isPopular as boolean : false };
}
