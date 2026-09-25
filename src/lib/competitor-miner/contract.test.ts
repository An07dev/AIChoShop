import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCompetitorMinerPrompt,
  parseCompetitorMinerResult,
  cleanAndValidateCompetitorMinerOutput,
  buildOfflineCompetitorMinerData,
  SAMPLE_COMPETITOR_MINER_INPUT,
  SAMPLE_COMPETITOR_MINER_DATA,
  SAMPLE_COMPETITOR_MINER_RESULT,
} from "./contract.ts";

test("Competitor Miner - Build Prompt generates valid prompt containing inputs", () => {
  const { systemPrompt, userPrompt } = buildCompetitorMinerPrompt({
    productName: "Áo Thun Oversize 100% Cotton",
    category: "Thời Trang",
    competitorReviews: "Vải mỏng, giặt 1 lần đã xù lông.",
    shopStrength: "Vải định lượng 250gsm, bảo hành đổi mới 30 ngày.",
  });

  assert.ok(systemPrompt.includes("Competitive Intelligence"));
  assert.ok(userPrompt.includes("Áo Thun Oversize 100% Cotton"));
  assert.ok(userPrompt.includes("Thời Trang"));
  assert.ok(userPrompt.includes("Vải mỏng, giặt 1 lần đã xù lông."));
  assert.ok(userPrompt.includes("Vải định lượng 250gsm"));
});

test("Competitor Miner - Parse Valid JSON Schema into CompetitorMinerData", () => {
  const result = parseCompetitorMinerResult(SAMPLE_COMPETITOR_MINER_RESULT, SAMPLE_COMPETITOR_MINER_INPUT);

  assert.equal(result.productName, SAMPLE_COMPETITOR_MINER_INPUT.productName);
  assert.ok(result.battleOverview.coreSlogan.length > 0);
  assert.ok(result.battleOverview.competitorVulnerabilityScore > 50);
  assert.ok(result.flaws.length >= 3);
  assert.ok(result.comparisonMatrix.length >= 3);
  assert.ok(result.conversionWeapons.videoHooks.length >= 3);
  assert.ok(result.conversionWeapons.subtleListingDescription.body.length > 0);
  assert.ok(result.conversionWeapons.priceObjectionHandling.consultantScript.length > 0);
  assert.ok(result.operationalDefense.mustAvoidChecklist.length >= 2);
});

test("Competitor Miner - Repair Truncated JSON on Token Cutoff", () => {
  // Cắt ngắn JSON giữa chừng để mô phỏng bị ngắt do maxTokens
  const truncated = SAMPLE_COMPETITOR_MINER_RESULT.slice(0, 500);
  const result = parseCompetitorMinerResult(truncated, SAMPLE_COMPETITOR_MINER_INPUT);

  assert.ok(result);
  assert.ok(result.productName);
  assert.ok(result.flaws.length > 0);
});

test("Competitor Miner - Legacy Markdown Backward Compatibility", () => {
  const legacyMarkdown = `## 🔍 1. BÓC TÁCH 3 TỬ HUYỆT LỚN NHẤT CỦA ĐỐI THỦ
- **Tử huyệt 1 (Lỗi sản phẩm / Chất liệu):** Áo thun vải mỏng như vải mùng, giặt 2 nước là dão cổ áo.
- **Tử huyệt 2 (Đóng gói / Giao hàng):** Hộp carton mỏng dính, rách nát khi shipper giao tới.
- **Tử huyệt 3 (Dịch vụ CSKH):** Nhắn tin thắc mắc bảo hành thì bị chặn và đổ lỗi cho khách.

---

## 💎 2. ĐỊNH VỊ VŨ KHÍ USP ĐỘC QUYỀN CHO SHOP BẠN
- **Tuyên ngôn định vị đập tan nỗi sợ:** "Chất vải Cotton Compact dệt dày 280gsm, bảo hành 1 đổi 1 tận nhà trong 30 ngày."

| Tiêu chí | Đối thủ trên thị trường | Sản phẩm của Shop Bạn (Vượt trội) |
| :--- | :--- | :--- |
| **Chất liệu vải** | Mỏng, dễ xù | Dày 280gsm, không xù |
| **Quy cách đóng gói** | Hộp rách nát | Hộp carton cứng nắp gài + túi zip |
| **Chính sách đổi trả** | Trốn tránh | Đổi tận nhà 24h |

---

## 🎬 3. BỘ CÂU HOOK & KỊCH BẢN "DÌM HÀNG VĂN MINH"
- **Hook 1 (Góc Cảnh Báo):** "Đừng vội mua áo thun giá rẻ nếu bạn không muốn cổ áo dão thành cái bao tải!"
- **Hook 2 (Góc Đồng Cảm Thực Tế):** "Có ai từng mua áo thun trên mạng mà unbox ra chiếc hộp nát bươm chưa?"
- **Đoạn mô tả sản phẩm "Đá xéo đối thủ tinh tế":** Áo thun của shop chúng tôi tuyển chọn kỹ lưỡng từng sợi bông, cam kết không bao giờ xù lông hay dão cổ áo như hàng đại trà trên thị trường.

---

## 🛡️ 4. LỜI KHUYÊN PHÒNG THỦ CHO SHOP BẠN
- **Lưu ý 1:** Kiểm tra 100% đường may trước khi đóng gói.
- **Lưu ý 2:** Bắt buộc bọc chống sốc và hộp cứng.
`;

  const parsed = parseCompetitorMinerResult(legacyMarkdown, SAMPLE_COMPETITOR_MINER_INPUT);

  assert.ok(parsed);
  assert.equal(parsed.flaws.length, 3);
  assert.ok(parsed.flaws[0].title.includes("Lỗi sản phẩm") || parsed.flaws[0].realReviewQuote.includes("vải mùng"));
  assert.ok(parsed.battleOverview.coreSlogan.includes("Cotton Compact"));
  assert.equal(parsed.comparisonMatrix.length, 3);
  assert.ok(parsed.conversionWeapons.videoHooks.length >= 2);
  assert.ok(parsed.conversionWeapons.subtleListingDescription.body.includes("tuyển chọn kỹ lưỡng"));
  assert.ok(parsed.operationalDefense.mustAvoidChecklist.length >= 2);
});

test("Competitor Miner - Offline Blueprint Generation (Resilience Layer)", () => {
  const offline = buildOfflineCompetitorMinerData({
    productName: "Nồi Chiên Không Dầu 6L",
    category: "Gia Dụng Thông Minh",
    competitorReviews: "Khay nướng bong tróc lớp chống dính, bốc khói khét lẹt.",
    shopStrength: "Lòng nồi phủ men Ceramic chống trầy, bảo hành 12 tháng tại nhà.",
  });

  assert.ok(offline);
  assert.equal(offline.productName, "Nồi Chiên Không Dầu 6L");
  assert.ok(offline.battleOverview.coreSlogan.includes("Nồi Chiên Không Dầu 6L"));
  assert.ok(offline.flaws.length === 3);
  assert.ok(offline.comparisonMatrix.length >= 3);
  assert.ok(offline.conversionWeapons.videoHooks.length === 3);
  assert.ok(offline.conversionWeapons.priceObjectionHandling.consultantScript.length > 0);
});

test("Competitor Miner - Clean and Validate Output returns clean JSON string", () => {
  const validJson = JSON.stringify(SAMPLE_COMPETITOR_MINER_DATA);
  const validated = cleanAndValidateCompetitorMinerOutput(validJson, SAMPLE_COMPETITOR_MINER_INPUT);

  assert.ok(typeof validated === "string");
  const parsed = JSON.parse(validated);
  assert.equal(parsed.productName, SAMPLE_COMPETITOR_MINER_DATA.productName);

  // Fallback an toàn khi chuỗi rỗng
  const emptyValidated = cleanAndValidateCompetitorMinerOutput("", SAMPLE_COMPETITOR_MINER_INPUT);
  assert.ok(typeof emptyValidated === "string");
  const emptyParsed = JSON.parse(emptyValidated);
  assert.ok(emptyParsed.battleOverview);
});
