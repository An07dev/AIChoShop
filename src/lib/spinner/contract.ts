export const PLATFORMS = { shopee: { label: "Shopee", titleLimit: 120 }, tiktok: { label: "TikTok Shop", titleLimit: 79 } } as const;
export const CONTENT_MODES = { title: "Tiêu đề", description: "Mô tả", both: "Cả bộ" } as const;
export const ANGLES = { search: "Ưu tiên tìm kiếm", benefit: "Nhấn mạnh lợi ích", concise: "Ngắn gọn, dễ đọc" } as const;
export type Angle = keyof typeof ANGLES;
export type SpinnerInput = {
  platform: keyof typeof PLATFORMS; mode: keyof typeof CONTENT_MODES; angle: Angle | "mixed"; count: 5 | 10;
  originalTitle: string; originalDescription: string; keywords: string; usp: string;
};
export type Variant = { title: string; description: string; angle: Angle; slot?: number };
export type SpinnerRequest = { inputs: SpinnerInput; existing: Variant[]; replaceIndex: number | null };
export type Snapshot = { inputs: SpinnerInput; variants: Variant[] };
export const LIMITS = { originalTitle: 300, originalDescription: 4000, keywords: 500, usp: 2000 };
export const EMPTY: SpinnerInput = { platform: "shopee", mode: "title", angle: "mixed", count: 5, originalTitle: "", originalDescription: "", keywords: "", usp: "" };
export class SpinnerError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const length = (v: string) => Array.from(v.normalize("NFC")).length;
export const normalize = (v: string) => v.normalize("NFC").toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}%]+/gu, " ").trim().replace(/\s+/g, " ");
export const lockedWords = (input: SpinnerInput) => [...new Set(input.keywords.split(/[,;\n]/).map(v => v.trim()).filter(Boolean))];
export function angleAt(input: SpinnerInput, index: number): Angle { return input.angle === "mixed" ? (["search", "benefit", "concise"] as Angle[])[index % 3] : input.angle; }
const numbers = (text: string) => text.toLowerCase().match(/\d+(?:[.,]\d+)?(?:\s?(?:%|kg|ml|cm|mm|gb|tb|mah|mg|kw|w|g|l))?/g) ?? [];
const numberKey = (text: string) => text.toLowerCase().replace(/\s+/g, "").replace(/,/g, ".");
const includesPhrase = (text: string, phrase: string) => ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);

export function validateInput(value: unknown): SpinnerInput {
  if (!object(value)) throw new SpinnerError("Thông tin đầu vào không hợp lệ.");
  if (value.platform !== "shopee" && value.platform !== "tiktok") throw new SpinnerError("Vui lòng chọn Shopee hoặc TikTok Shop.");
  if (value.mode !== "title" && value.mode !== "description" && value.mode !== "both") throw new SpinnerError("Chọn tiêu đề, mô tả hoặc cả bộ.");
  if (value.angle !== "mixed" && value.angle !== "search" && value.angle !== "benefit" && value.angle !== "concise") throw new SpinnerError("Hướng viết không hợp lệ.");
  if (value.count !== 5 && value.count !== 10) throw new SpinnerError("Chọn 5 hoặc 10 phiên bản.");
  const input = { platform: value.platform, mode: value.mode, angle: value.angle, count: value.count } as SpinnerInput;
  for (const [key, limit] of Object.entries(LIMITS)) {
    const field = key as keyof typeof LIMITS;
    if (value[field] !== undefined && typeof value[field] !== "string") throw new SpinnerError("Các ô nội dung phải là văn bản.");
    input[field] = ((value[field] as string) ?? "").normalize("NFC").trim();
    if (length(input[field]) > limit) throw new SpinnerError(`Nội dung vượt giới hạn ${limit} ký tự.`);
  }
  if (!input.originalTitle) throw new SpinnerError("Vui lòng nhập tiêu đề gốc để xác định sản phẩm.");
  if (input.mode !== "title" && !input.originalDescription) throw new SpinnerError("Vui lòng nhập mô tả gốc cho chế độ mô tả hoặc cả bộ.");
  const words = lockedWords(input);
  if (words.length > 12 || words.some(w => length(w) > 100)) throw new SpinnerError("Tối đa 12 từ khóa bắt buộc, mỗi từ khóa tối đa 100 ký tự.");
  if (input.mode !== "description" && length(words.join(" ")) > PLATFORMS[input.platform].titleLimit) throw new SpinnerError("Các từ khóa bắt buộc dài hơn mục tiêu tiêu đề. Hãy giảm từ khóa hoặc chọn nền tảng khác.");
  return input;
}

export function parseVariants(value: unknown, input: SpinnerInput, count = input.count as number, startIndex = 0): Variant[] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }
    catch { throw new SpinnerError("AI phải trả JSON hợp lệ, không thêm lời dẫn.", 502); }
  }
  if (!object(parsed) || !Array.isArray(parsed.variants) || parsed.variants.length !== count) throw new SpinnerError(`Cần đúng ${count} phiên bản trong mảng variants.`, 502);
  const facts = [input.originalTitle, input.originalDescription, input.usp, input.keywords].join(" ");
  const factNumbers = new Set(numbers(facts).map(numberKey));
  const variants = parsed.variants.map((item: unknown, index: number) => {
    if (!object(item) || (input.mode !== "description" && typeof item.title !== "string") || (input.mode !== "title" && typeof item.description !== "string")) throw new SpinnerError(`Thiếu nội dung dạng văn bản cho chế độ ${CONTENT_MODES[input.mode]}.`, 502);
    const title = typeof item.title === "string" ? item.title.trim().normalize("NFC") : "";
    const description = typeof item.description === "string" ? item.description.trim().normalize("NFC") : "";
    if (input.mode !== "description" && (length(title) < 10 || length(title) > PLATFORMS[input.platform].titleLimit || /[\r\n]/.test(title))) throw new SpinnerError(`Tiêu đề cần 10–${PLATFORMS[input.platform].titleLimit} ký tự, trên một dòng.`, 502);
    if (input.mode !== "title" && (length(description) < 30 || length(description) > 1800)) throw new SpinnerError("Mô tả cần 30–1800 ký tự.", 502);
    const active = input.mode === "description" ? description : title;
    const missing = lockedWords(input).filter(word => !includesPhrase(active, word));
    if (missing.length) throw new SpinnerError(`Phiên bản ${startIndex + index + 1}: ${input.mode === "description" ? "mô tả" : "tiêu đề"} thiếu cụm từ bắt buộc ${missing.map(word => `“${word}”`).join(", ")}. Cần giữ nguyên cụm từ, không thay bằng từ đồng nghĩa.`, 502);
    const text = [input.mode !== "description" ? title : "", input.mode !== "title" ? description : ""].join(" ");
    const source = input.mode === "title" ? input.originalTitle : `${input.originalTitle} ${input.originalDescription}`;
    const outputNumbers = new Set(numbers(text).map(numberKey));
    if (numbers(source).some(n => !outputNumbers.has(numberKey(n)))) throw new SpinnerError("Phải giữ nguyên các thông số có số trong nội dung gốc.", 502);
    if ([...outputNumbers].some(n => !factNumbers.has(n))) throw new SpinnerError("Không thêm con số, thông số hoặc ưu đãi chưa có trong dữ liệu.", 502);
    for (const claim of ["chính hãng", "freeship", "bảo hành", "đổi trả", "giá xưởng", "cao cấp", "chứng nhận", "tốt nhất", "số 1", "chữa bệnh", "miễn phí", "giảm giá"]) {
      if (includesPhrase(text, claim) && !includesPhrase(facts, claim)) throw new SpinnerError(`Không thêm '${claim}' vì dữ liệu không cung cấp.`, 502);
    }
    const foreign = text.match(/[\p{Script=Han}\p{Script=Cyrillic}\p{Script=Arabic}]/gu) ?? [];
    if (foreign.some(c => !facts.includes(c))) throw new SpinnerError("Viết tiếng Việt, không xen chữ thuộc ngôn ngữ khác.", 502);
    return { title: input.mode === "description" ? "" : title, description: input.mode === "title" ? "" : description, angle: angleAt(input, startIndex + index), slot: startIndex + index };
  });
  validateDistinct(variants, input);
  return variants;
}

export function validateDistinct(variants: Variant[], input: SpinnerInput) {
  for (const field of (input.mode === "both" ? ["title", "description"] : [input.mode]) as ("title" | "description")[]) {
    const values = variants.map(v => normalize(v[field]));
    if (new Set(values).size !== values.length) throw new SpinnerError(`Các ${field === "title" ? "tiêu đề" : "mô tả"} không được trùng hoàn toàn.`, 502);
    const original = normalize(field === "title" ? input.originalTitle : input.originalDescription);
    if (values.includes(original)) throw new SpinnerError("Phiên bản mới không được chép nguyên nội dung gốc.", 502);
  }
}

export function parseExisting(value: unknown, inputs: SpinnerInput): Variant[] {
  if (!Array.isArray(value) || value.length > inputs.count) throw new SpinnerError("Bộ kết quả cũ không hợp lệ.");
  const variants = value.map((item: unknown, index: number) => {
    const slot = object(item) ? item.slot ?? index : index;
    if (!Number.isInteger(slot) || (slot as number) < 0 || (slot as number) >= inputs.count) throw new SpinnerError("Vị trí phiên bản không hợp lệ.");
    return parseVariants({ variants: [item] }, inputs, 1, slot as number)[0];
  });
  if (new Set(variants.map(v => v.slot)).size !== variants.length) throw new SpinnerError("Vị trí phiên bản bị trùng.");
  validateDistinct(variants, inputs);
  return variants.sort((a, b) => a.slot! - b.slot!);
}

export function validateRequest(body: unknown): SpinnerRequest {
  if (!object(body)) throw new SpinnerError("Yêu cầu không hợp lệ.");
  const inputs = validateInput(body.inputs);
  let existing: Variant[];
  try { existing = parseExisting(body.existing ?? [], inputs); }
  catch { throw new SpinnerError("Bộ kết quả cũ không hợp lệ. Hãy tạo lại cả bộ."); }
  if (body.replaceIndex === undefined || body.replaceIndex === null) return { inputs, existing, replaceIndex: null };
  if (!Number.isInteger(body.replaceIndex) || !existing.some(v => v.slot === body.replaceIndex)) throw new SpinnerError("Vị trí phiên bản không hợp lệ.");
  return { inputs, existing, replaceIndex: body.replaceIndex as number };
}

// Jaccard of normalized word sets. Reordering the same words still scores 100%.
export function similarity(a: string, b: string) {
  const left = new Set(normalize(a).split(" ").filter(Boolean));
  const right = new Set(normalize(b).split(" ").filter(Boolean));
  const union = new Set([...left, ...right]);
  return union.size ? Math.round([...left].filter(v => right.has(v)).length / union.size * 100) : 0;
}
export function inspectVariant(input: SpinnerInput, variants: Variant[], index: number) {
  const item = variants[index];
  const activeFields = (input.mode === "both" ? ["title", "description"] : [input.mode]) as ("title" | "description")[];
  const originalSimilarity = Math.max(...activeFields.map(field => similarity(item[field], field === "title" ? input.originalTitle : input.originalDescription)));
  const peers = variants.map((peer, i) => ({ index: i, score: i === index ? -1 : Math.max(...activeFields.map(field => similarity(item[field], peer[field]))) })).sort((a, b) => b.score - a.score);
  const warnings: string[] = [];
  if (originalSimilarity >= 80) warnings.push("Nhiều từ giống bản gốc; có thể chỉ thay thứ tự từ.");
  if (peers[0]?.score >= 80) warnings.push(`Gần giống phiên bản ${(variants[peers[0].index].slot ?? peers[0].index) + 1} (${peers[0].score}%).`);
  const titleTokens = normalize(item.title).split(" ").filter(Boolean);
  if (titleTokens.some(token => titleTokens.filter(t => t === token).length >= 3)) warnings.push("Tiêu đề lặp một từ từ 3 lần trở lên.");
  return { originalSimilarity, closest: peers[0]?.score >= 0 ? peers[0] : null, warnings };
}
export function variantText(item: Variant) { return [item.title, item.description].filter(Boolean).join("\n\n"); }
export function exportRows(snapshot: Snapshot, selected: number[]) {
  return selected.map(index => {
    const item = snapshot.variants[index];
    const review = inspectVariant(snapshot.inputs, snapshot.variants, index);
    return { "Phiên bản": (item.slot ?? index) + 1, "Nền tảng": PLATFORMS[snapshot.inputs.platform].label, "Hướng viết": ANGLES[item.angle], "Tiêu đề": item.title, "Mô tả": item.description, "Ký tự tiêu đề": length(item.title), "Tương đồng bản gốc (%)": review.originalSimilarity, "Cảnh báo": review.warnings.join(" "), "Từ khóa giữ nguyên": lockedWords(snapshot.inputs).join(", "), "Tiêu đề gốc": snapshot.inputs.originalTitle, "Mô tả gốc": snapshot.inputs.originalDescription };
  });
}
