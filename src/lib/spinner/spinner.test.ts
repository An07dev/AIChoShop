import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY, angleAt, validateInput, validateRequest, parseVariants, inspectVariant, exportRows, similarity, type SpinnerInput } from "./contract.ts";
import { generateVariants, promptFor, PartialSpinnerError } from "./generate.ts";

const input: SpinnerInput = { ...EMPTY, originalTitle: "Áo phông nam cotton form rộng", originalDescription: "Áo phông nam cotton với form rộng thoải mái, dễ phối đồ và co giãn linh hoạt.", keywords: "áo phông nam, cotton", usp: "Co giãn, dễ phối đồ" };
const titles = ["Áo phông nam cotton co giãn thoải mái", "Áo phông nam cotton dễ phối đồ hàng ngày", "Áo phông nam cotton dáng rộng dễ mặc", "Áo phông nam chất cotton linh hoạt khi vận động", "Áo phông nam cotton phong cách đơn giản"];
const descriptions = ["Chất cotton và form rộng mang lại cảm giác thoải mái khi mặc.", "Dễ kết hợp trang phục với áo phông nam cotton co giãn linh hoạt.", "Áo phông nam cotton thiết kế dáng rộng, thuận tiện khi vận động.", "Lựa chọn áo phông nam cotton đơn giản, dễ mặc cho ngày thường.", "Áo phông nam cotton giúp phối đồ linh hoạt nhờ thiết kế form rộng."];
const raw = titles.map((title, i) => ({ title, description: descriptions[i] }));
const request = { inputs: input, replaceIndex: null, existing: [] };

test("input validates supported modes/counts and trims text", () => {
  assert.equal(validateInput({ ...input, originalTitle: " test " }).originalTitle, "test");
  for (const invalid of [null, {}, { ...input, count: 6 }, { ...input, platform: "all" }, { ...input, mode: "x" }, { ...input, angle: "x" }, { ...input, originalTitle: [] }, { ...input, originalTitle: " " }, { ...input, usp: "x".repeat(2001) }, { ...input, mode: "both", originalDescription: "" }]) assert.throws(() => validateInput(invalid));
  assert.throws(() => validateInput({ ...input, keywords: "a".repeat(100) + ", " + "b".repeat(100) }));
});
test("all three modes and mixed angles are assigned by server", () => {
  assert.deepEqual(parseVariants({ variants: raw }, input).map(v => v.angle), ["search", "benefit", "concise", "search", "benefit"]);
  assert.ok(parseVariants({ variants: raw }, input).every(v => !v.description));
  const descriptionInput = { ...input, mode: "description" as const, keywords: "" };
  assert.ok(parseVariants({ variants: raw }, descriptionInput).every(v => !v.title && v.description));
  assert.equal(parseVariants({ variants: raw }, { ...input, mode: "both" }).length, 5);
  assert.equal(angleAt({ ...input, angle: "benefit" }, 4), "benefit");
});
test("rejects malformed, short, duplicate, unchanged and overlong titles", () => {
  for (const value of ["bad", {}, { variants: raw.slice(0, 3) }, { variants: Array(5).fill(raw[0]) }, { variants: [{ ...raw[0], title: input.originalTitle }, ...raw.slice(1)] }, { variants: [{ ...raw[0], title: "x".repeat(121) }, ...raw.slice(1)] }]) assert.throws(() => parseVariants(value, input));
  assert.throws(() => parseVariants({ variants: [{ ...raw[0], title: "Áo phông nam cotton " + "x".repeat(65) }, ...raw.slice(1)] }, { ...input, platform: "tiktok" }));
});
test("description and title duplicates are checked independently in both mode", () => {
  assert.throws(() => parseVariants({ variants: raw.map(v => ({ ...v, description: descriptions[0] })) }, { ...input, mode: "both" }));
  assert.throws(() => parseVariants({ variants: raw.map(v => ({ ...v, description: "" })) }, { ...input, mode: "both" }));
});
test("preserves locked phrases and numeric specs; rejects invented claims", () => {
  for (const title of ["Áo thun cotton dáng rộng dễ mặc", "Áo phông nam cotton bảo hành", "Áo phông nam cotton 100%", "Áo phông nam cotton 自由"]) assert.throws(() => parseVariants({ variants: [{ title, description: "" }] }, input, 1));
  assert.throws(() => parseVariants({ variants: [{ title: titles[0], description: "" }] }, { ...input, originalTitle: input.originalTitle + " 100%" }, 1));
  assert.equal(parseVariants({ variants: [{ title: titles[0] + " 100%", description: "" }] }, { ...input, originalTitle: input.originalTitle + " 100%" }, 1).length, 1);
});
test("similarity catches reordered words and warns about nearest peer", () => {
  assert.equal(similarity("cotton áo nam", "nam áo cotton"), 100);
  assert.equal(similarity("", ""), 0);
  const variants = parseVariants({ variants: raw }, input);
  assert.ok(inspectVariant(input, variants, 0).closest);
  const repeated = [{ ...variants[0], title: "Áo áo áo phông nam cotton" }, ...variants.slice(1)];
  assert.ok(inspectVariant(input, repeated, 0).warnings.some(w => w.includes("lặp")));
});
test("one repair attempt only, and refusal does not retry", async () => {
  let calls = 0;
  const variants = await generateVariants(request, async () => ({ content: ++calls === 1 ? "{}" : JSON.stringify({ variants: raw }), finished: true }));
  assert.equal(calls, 2); assert.equal(variants.length, 5);
  calls = 0;
  await assert.rejects(generateVariants(request, async () => { calls++; return { content: null, finished: false }; }));
  assert.equal(calls, 2);
  calls = 0;
  await assert.rejects(generateVariants(request, async () => { calls++; return { content: null, finished: true, refused: true }; }));
  assert.equal(calls, 1);
});
test("regeneration replaces only requested index, rejects old title and peer duplicates", async () => {
  const existing = parseVariants({ variants: raw }, input);
  const replacement = { title: "Áo phông nam cotton linh hoạt dễ phối trang phục", description: "" };
  const replacementRequest = validateRequest({ inputs: input, existing, replaceIndex: 2 });
  const result = await generateVariants(replacementRequest, async () => ({ content: JSON.stringify({ variants: [replacement] }), finished: true }));
  assert.equal(result[2].title, replacement.title);
  assert.equal(result[0].title, existing[0].title);
  assert.equal(result[2].angle, "concise");
  await assert.rejects(generateVariants(replacementRequest, async () => ({ content: JSON.stringify({ variants: [existing[2]] }), finished: true })));
  assert.throws(() => validateRequest({ inputs: input, existing, replaceIndex: 5 }));
  assert.throws(() => validateRequest({ inputs: input, existing: [], replaceIndex: 0 }));
});
test("export includes only selected variants and the snapshot source", () => {
  const snapshot = { inputs: input, variants: parseVariants({ variants: raw }, input) };
  const rows = exportRows(snapshot, [1, 3]);
  assert.equal(rows.length, 2); assert.equal(rows[0]["Phiên bản"], 2);
  assert.equal(rows[1]["Tiêu đề"], titles[3]);
  assert.equal(rows[0]["Tiêu đề gốc"], input.originalTitle);
});
test("prompt carries USP, required words, platform and content direction", () => {
  const prompt = promptFor(request);
  assert.ok(prompt.includes(input.usp)); assert.ok(prompt.includes(input.keywords));
  assert.ok(prompt.includes("Shopee")); assert.ok(prompt.includes("Nhấn mạnh lợi ích"));
});

test("repairs only failed slots and keeps accepted text and directions unchanged", async () => {
  let calls = 0;
  const result = await generateVariants(request, async prompt => {
    calls++;
    if (calls === 1) return { content: JSON.stringify({ variants: raw.map((v, i) => i === 2 ? { ...v, title: "Áo thun nam cotton dáng rộng" } : v) }), finished: true };
    assert.ok(prompt.includes("đúng 1 phiên bản"));
    assert.ok(prompt.includes("Phiên bản 3:"));
    assert.ok(prompt.includes("“áo phông nam”"));
    assert.ok(prompt.includes("Ngắn gọn, dễ đọc"));
    return { content: JSON.stringify({ variants: [raw[2]] }), finished: true };
  });
  assert.equal(calls, 2);
  assert.deepEqual(result, parseVariants({ variants: raw }, input));
});

test("partial failure is usable, can resume gaps and regenerate a noncontiguous slot", async () => {
  let calls = 0;
  let partial: PartialSpinnerError | undefined;
  try {
    await generateVariants(request, async () => ({ content: JSON.stringify({ variants: ++calls === 1 ? raw.map((v, i) => i === 1 ? { ...v, title: "Áo thun nam dáng rộng dễ mặc" } : v) : [{ title: "Áo thun nam dáng rộng dễ mặc", description: "" }] }), finished: true }));
  } catch (error) { assert.ok(error instanceof PartialSpinnerError); partial = error; }
  assert.ok(partial);
  assert.match(partial.message, /Phiên bản 2:.*“áo phông nam”.*“cotton”/);
  assert.deepEqual(partial.variants.map(v => v.slot), [0, 2, 3, 4]);
  const resumed = validateRequest({ inputs: input, existing: partial.variants });
  const filled = await generateVariants(resumed, async prompt => {
    assert.ok(prompt.includes("đúng 1 phiên bản"));
    return { content: JSON.stringify({ variants: [raw[1]] }), finished: true };
  });
  assert.deepEqual(filled, parseVariants({ variants: raw }, input));
  const replacement = { title: "Áo phông nam cotton linh hoạt dễ phối trang phục", description: "" };
  const replaced = await generateVariants(validateRequest({ inputs: input, existing: partial.variants, replaceIndex: 3 }), async () => ({ content: JSON.stringify({ variants: [replacement] }), finished: true }));
  assert.equal(replaced.find(v => v.slot === 3)?.title, replacement.title);
  assert.equal(replaced.find(v => v.slot === 2)?.title, raw[2].title);
  assert.throws(() => validateRequest({ inputs: input, existing: [partial.variants[0], partial.variants[0]] }));
});

test("repair transport failure preserves accepted variants and duplicate repairs are rejected", async () => {
  let calls = 0;
  await assert.rejects(generateVariants(request, async () => {
    if (++calls === 2) throw new Error("provider unavailable");
    return { content: JSON.stringify({ variants: [raw[0], raw[0], ...raw.slice(2)] }), finished: true };
  }), (error: unknown) => error instanceof PartialSpinnerError && error.variants.length === 4);
  calls = 0;
  await assert.rejects(generateVariants(request, async () => ({ content: JSON.stringify({ variants: ++calls === 1 ? [raw[0], raw[0], ...raw.slice(2)] : [raw[0]] }), finished: true })), (error: unknown) => error instanceof PartialSpinnerError && error.variants.length === 4 && error.message.includes("Phiên bản 2"));
});

test("description-only missing phrases identify the correct field and slot", () => {
  assert.throws(() => parseVariants({ variants: [{ title: "", description: "Chiếc áo cotton dáng rộng dễ phối đồ và thoải mái khi mặc." }] }, { ...input, mode: "description" }, 1, 4), /Phiên bản 5: mô tả.*“áo phông nam”/);
});

test("inactive fields may be omitted; partial exports retain original slot numbers", () => {
  const variants = parseVariants({ variants: [{ title: titles[3] }] }, input, 1, 3);
  assert.equal(variants[0].description, "");
  assert.equal(exportRows({ inputs: input, variants }, [0])[0]["Phiên bản"], 4);
  assert.throws(() => parseVariants({ variants: [{ description: descriptions[1] }] }, input, 1));
  assert.throws(() => parseVariants({ variants: [{ title: titles[3] }] }, { ...input, mode: "both" }, 1));
});
