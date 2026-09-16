import { parseCompetitorMinerOutput } from "../src/components/tools/CompetitorMinerOutput";
import * as XLSX from "xlsx";

const sampleInput = `## 🔍 1. BÓC TÁCH 3 TỬ HUYỆT LỚN NHẤT CỦA ĐỐI THỦ

- **Tử huyệt 1 (Lỗi sản phẩm / Chất liệu):** Áo thun của đối thủ có vải mỏng, dễ bị xù lông và chảy xệ sau khi giặt, gây mất thẩm mỹ và cảm giác không thoải mái cho khách hàng.
- **Tử huyệt 2 (Đóng gói / Giao hàng / Phụ kiện):** Hộp carton đóng gói của đối thủ quá mỏng, dễ bị rách và thiếu phụ kiện như túi zip mờ bảo vệ sản phẩm.
- **Tử huyệt 3 (Dịch vụ CSKH / Bảo hành):** Đối thủ thường từ chối trách nhiệm và không giải quyết triệt để khi khách hàng khiếu nại, gây mất lòng tin và sự bất tiện cho khách hàng.

---

## 💎 2. ĐỊNH VỊ VŨ KHÍ USP ĐỘC QUYỀN CHO SHOP BẠN

- **Tuyên ngôn định vị đập tan nỗi sợ:** "Chất liệu dày dặn, không xù lông, form áo rộng rãi thoải mái, bảo hành 1 đổi 1 tận nhà trong 30 ngày."

- **Bảng so sánh hơn hẳn (Shop Bạn vs Đối Thủ Thị Trường):**

| Tiêu chí | Đối thủ trên thị trường | Sản phẩm của Shop Bạn (Vượt trội) |
| :--- | :--- | :--- |
| **Chất liệu / Hoàn thiện** | Vải mỏng, dễ bị xù lông | Vải Cotton Compact 100% dệt dày 280gsm không xù lông, cổ áo dệt sợi co giãn kép |
| **Quy cách đóng gói** | Hộp carton sơ sài, dễ vỡ | Hộp carton cứng nắp gài, túi zip mờ bảo vệ sản phẩm |
| **Chính sách bảo hành** | Trốn tránh, đổ lỗi | Đổi mới 100% tận nhà trong 24h |

---

## 🎬 3. BỘ CÂU HOOK & KỊCH BẢN "DÌM HÀNG VĂN MINH"

- **Hook 1 (Góc Cảnh Báo):** "Bạn có chắc chắn muốn mua áo thun từ một shop không chịu trách nhiệm, khiến bạn mất thời gian và tiền bạc không?"
- **Hook 2 (Góc Đồng Cảm Thực Tế):** "Hãy tưởng tượng, bạn giặt áo thun và phát hiện cổ áo chảy xệ, bị xù lông, mất công sửa chữa ngay tại nhà?"
- **Hook 3 (Góc Vạch Trần Sự Thật):** "Hãy chọn shop chúng tôi, nơi bạn luôn được bảo hành 1 đổi 1 tận nhà trong 30 ngày, không còn lo lắng về các vấn đề chất lượng và dịch vụ."

- **Đoạn mô tả sản phẩm "Đá xéo đối thủ tinh tế":** "Áo thun Cotton Compact 280gsm của chúng tôi không chỉ mang lại cảm giác thoải mái, form áo rông rãi, mà còn được bảo hành 1 đổi 1 tận nhà trong 30 ngày. Với chất liệu dày dặn 100% Cotton, áo thun của bạn sẽ không bao giờ bị xù lông hay chảy xệ sau khi giặt. Đảm bảo bạn sẽ hài lòng với sản phẩm của chúng tôi, không cần phải lo lắng về những vấn đề thường gặp ở các shop khác."

---

## 🛡️ 4. LỜI KHUYÊN PHÒNG THỦ CHO SHOP BẠN

- **Lưu ý 1:** Tuân thủ quy trình kiểm duyệt chất liệu và hoàn thiện sản phẩm để đảm bảo chất lượng vải luôn chuẩn xác.
- **Lưu ý 2:** Đảm bảo quy trình đóng gói sản phẩm được thực hiện cẩn thận, sử dụng hộp carton và túi zip mờ để bảo vệ sản phẩm.
- **Lưu ý 3:** Đào tạo đội ngũ CSKH để họ có thể giải quyết các vấn đề của khách hàng một cách nhanh chóng và hiệu quả, đảm bảo khách hàng luôn hài lòng.
`;

console.log("=== BẮT ĐẦU KIỂM THỬ PARSER & OUTPUT ===");

const parsed = parseCompetitorMinerOutput(sampleInput);

if (!parsed) {
  console.error("❌ PARSE FAILED!");
  process.exit(1);
}

// 1. Kiểm tra Tử huyệt
console.log(`\n[1] Kiểm tra 3 Tử huyệt: Số lượng = ${parsed.flaws.length}`);
if (parsed.flaws.length !== 3) {
  console.error(`❌ Cần 3 tử huyệt, nhưng nhận được ${parsed.flaws.length}`);
  process.exit(1);
}
parsed.flaws.forEach((f, i) => {
  console.log(`  ✓ Tử huyệt ${i + 1}: ${f.title} | Tag: ${f.tag}`);
  console.log(`    Nội dung: ${f.content.slice(0, 50)}...`);
});

// 2. Kiểm tra USP & Bảng so sánh
console.log(`\n[2] Tuyên ngôn USP: "${parsed.uspStatement}"`);
if (!parsed.uspStatement.includes("Chất liệu dày dặn")) {
  console.error("❌ Tuyên ngôn USP không đúng!");
  process.exit(1);
}
console.log(`  ✓ Bảng so sánh có ${parsed.comparisonTable.rows.length} dòng`);
if (parsed.comparisonTable.rows.length !== 3) {
  console.error(`❌ Cần 3 dòng so sánh, nhưng nhận được ${parsed.comparisonTable.rows.length}`);
  process.exit(1);
}
parsed.comparisonTable.rows.forEach((r, i) => {
  console.log(`  ✓ Dòng ${i + 1}: [${r.criteria}] -> Đối thủ: ${r.competitor.slice(0, 25)}... vs Shop Bạn: ${r.shopYou.slice(0, 30)}...`);
});

// 3. Kiểm tra Hook & Mô tả
console.log(`\n[3] Bộ câu Hook & Mô tả:`);
console.log(`  ✓ Số câu hook: ${parsed.hooks.length}`);
if (parsed.hooks.length !== 3) {
  console.error(`❌ Cần 3 câu hook, nhưng nhận được ${parsed.hooks.length}`);
  process.exit(1);
}
parsed.hooks.forEach((h, i) => {
  console.log(`  ✓ Hook ${i + 1}: ${h.label} (${h.angle}) -> "${h.text.slice(0, 45)}..."`);
});
console.log(`  ✓ Đoạn mô tả đá xéo: "${parsed.subtleDescription.slice(0, 60)}..."`);
if (!parsed.subtleDescription) {
  console.error("❌ Không trích xuất được đoạn mô tả sản phẩm!");
  process.exit(1);
}

// 4. Kiểm tra Lời khuyên phòng thủ
console.log(`\n[4] Lời khuyên phòng thủ: Số lượng = ${parsed.defenseTips.length}`);
if (parsed.defenseTips.length !== 3) {
  console.error(`❌ Cần 3 lời khuyên, nhưng nhận được ${parsed.defenseTips.length}`);
  process.exit(1);
}
parsed.defenseTips.forEach((d, i) => {
  console.log(`  ✓ ${d.title}: ${d.content.slice(0, 45)}...`);
});

// 5. Kiểm tra xuất Excel
console.log("\n[5] Kiểm tra xuất Excel đa sheet:");
const wb = XLSX.utils.book_new();
const flawRows = parsed.flaws.map((f, idx) => ({
  STT: idx + 1,
  "Loại Tử Huyệt": f.title,
  "Phân Loại": f.tag || "N/A",
  "Chi Tiết Lỗi Của Đối Thủ": f.content,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flawRows), "TuHuyet_DoiThu");

const tableRows = parsed.comparisonTable.rows.map((r, idx) => ({
  STT: idx + 1,
  "Tiêu Chí So Sánh": r.criteria,
  "Đối Thủ Thị Trường (Kém/Rủi ro)": r.competitor,
  "Shop Bạn (Vượt trội)": r.shopYou,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tableRows), "SoSanh_USP");

const hookRows = [
  ...parsed.hooks.map((h, idx) => ({
    STT: idx + 1,
    "Phân Loại": h.label,
    "Góc Tiếp Cận": h.angle || "N/A",
    "Nội Dung Câu Hook": h.text,
  })),
  {
    STT: parsed.hooks.length + 1,
    "Phân Loại": "Đoạn mô tả sản phẩm đá xéo",
    "Góc Tiếp Cận": "Bài viết mô tả sản phẩm",
    "Nội Dung Câu Hook": parsed.subtleDescription,
  }
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hookRows), "Hook_KichBan");

const defenseRows = parsed.defenseTips.map((d, idx) => ({
  STT: idx + 1,
  "Hạng Mục": d.title,
  "Nội Dung Khuyến Nghị": d.content,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(defenseRows), "LoiKhuyen_PhongThu");

const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
console.log(`  ✓ Excel workbook tạo thành công! Kích thước: ${buffer.length} bytes`);

console.log("\n🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐÃ PASS 100%!");
