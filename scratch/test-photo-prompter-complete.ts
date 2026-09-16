import { parsePhotoPrompterOutput } from "../src/components/tools/PhotoPrompterOutput";
import * as XLSX from "xlsx";

const sampleInput = `## 📸 1. TOP 5 BỘ PROMPT TIẾNG ANH CHUẨN STUDIO THƯƠNG MẠI
*(Copy nguyên văn đoạn mã code tiếng Anh vào Midjourney hoặc Flux để tạo ảnh chất lượng 8K)*

### 🌟 Prompt 1: Góc Chụp Toàn Cảnh (Master Hero Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A beautifully crafted leather bag with alligator embossed design in caramel brown color, lying on a natural wood surface with a soft, warm light from the ceiling. The bag is presented in a low-angle hero shot, emphasizing its luxurious texture and craftsmanship. The subtle color palette of beige and white around the bag adds to the warm and cozy Nordic atmosphere. Use an 85mm prime lens with f/1.8 aperture for a shallow depth of field, creating a bokeh effect. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Góc chụp từ dưới lên tạo cảm giác bề thế và cao cấp, nhấn mạnh vào chất liệu và họa tiết da bò dập vân cá sấu, tạo cảm xúc ấm cúng của phong cách Bắc Âu.]

### 🔍 Prompt 2: Góc Chụp Cận Cảnh Chi Tiết (Macro Detail Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
Zoom in on the intricate texture of the alligator embossed leather in a bag with caramel brown color. The surface of the leather is captured with an 85mm prime lens at f/1.8, showing the fine details and the soft yet distinct embossed patterns. The depth of field is shallow, creating a smooth, blurred background. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Chú trọng vào chi tiết chất liệu và họa tiết da bò, tạo cảm giác tinh xảo và cao cấp.]

### 💃 Prompt 3: Góc Lookbook Người Mẫu (Model Lookbook Shot)
- **English Prompt (Ready to Copy):**
\`\`\`
A young Asian woman in her early 20s, wearing a light white blazer, interacts naturally with a caramel brown alligator embossed leather bag. She is standing in a cozy, Nordic-style living space with beige and white tones, where the wooden elements and linen fabrics complement the overall aesthetic. The model’s subtle makeup and elegant demeanor enhance the look of sophistication and grace. Octane render, photorealistic, 8k --ar 3:4 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh lookbook với người mẫu tự nhiên tương tác với sản phẩm, phản ánh tinh thần phong cách Bắc Âu ấm cúng.]

### ☕ Prompt 4: Bối Cảnh Đời Sống Thực Tế (Lifestyle In-Context)
- **English Prompt (Ready to Copy):**
\`\`\`
A caramel brown alligator embossed leather bag gracefully placed in a cozy, Nordic-style living space. The room is decorated with natural wood furniture and soft, linen-covered cushions. The lighting is warm and natural, creating a cozy and inviting atmosphere. The bag is positioned on a wooden table, surrounded by elements that reflect the simplicity and warmth of the Nordic style, such as woolen blankets and wooden decor. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh sản phẩm trong không gian sống thực tế, phản ánh phong cách Bắc Âu ấm cúng và tông màu be/trắng.]

### ✨ Prompt 5: Phong Cách Tối Giản Nghệ Thuật (High-end Editorial)
- **English Prompt (Ready to Copy):**
\`\`\`
A high-end editorial style shot of a caramel brown alligator embossed leather bag, placed on a minimalist wooden pedestal with soft, diffused lighting. The bag is presented with a soft, elegant tone, reminiscent of Vogue or Elle magazine covers. The composition is clean and modern, highlighting the luxurious texture and the intricate embossed patterns. Octane render, photorealistic, 8k --ar 1:1 --v 6.1
\`\`\`
- **Ý đồ nhiếp ảnh:** [Tạo hình ảnh theo phong cách tạp chí thời trang, nhấn mạnh vào vẻ đẹp tinh tế và cao cấp của sản phẩm.]

---

## 🚫 2. BỘ CÂU LỆNH LOẠI TRỪ (NEGATIVE PROMPT)
*(Dán vào ô Negative Prompt / --no để ảnh không bị lỗi)*
\`\`\`
deformed hands, missing fingers, extra limbs, bad anatomy, distorted product, low quality, blurry, text, watermark, logo, oversaturated, plastic skin, cartoon, 3d render look
\`\`\`

---

## 💡 3. MẸO THỰC CHIẾN TỪ NHIẾP ẢNH GIA AI
- **Mẹo 1:** Đảm bảo rằng logo của bạn có thể được dễ dàng thêm vào hoặc thay thế bằng công cụ inpaint sau khi tạo ảnh AI.
- **Mẹo 2:** Sử dụng công cụ inpaint để xóa bỏ bất kỳ phần nào không mong muốn từ ảnh AI, ví dụ: người mẫu hoặc bối cảnh không cần thiết.
- **Mẹo 3:** Cân nhắc việc thêm một lớp mờ nhẹ cho logo hoặc sản phẩm để tránh nhìn thấy chúng quá rõ ràng trong ảnh cuối cùng, giúp hình ảnh trở nên tự nhiên hơn.
`;

console.log("=== BẮT ĐẦU TEST PARSER PHOTO-PROMPTER ===");
const parsed = parsePhotoPrompterOutput(sampleInput);

if (!parsed) {
  console.error("❌ PARSE FAILED!");
  process.exit(1);
}

// 1. Kiểm tra 5 prompts
console.log(`\n[1] Kiểm tra 5 Prompts: Số lượng = ${parsed.prompts.length}`);
if (parsed.prompts.length !== 5) {
  console.error(`❌ Cần đúng 5 prompts, nhận được: ${parsed.prompts.length}`);
  process.exit(1);
}
parsed.prompts.forEach((p) => {
  console.log(`  ✓ Prompt ${p.index}: ${p.title}`);
  console.log(`    - Ratio: --ar ${p.aspectRatio} | Lens: ${p.lensInfo || "N/A"} | Version: ${p.versionInfo || "N/A"}`);
  console.log(`    - Code: ${p.promptCode.slice(0, 60)}...`);
  console.log(`    - Ý đồ: ${p.intention.slice(0, 60)}...`);
});

// 2. Kiểm tra Negative Prompt
console.log(`\n[2] Negative Prompt:`);
console.log(`  ✓ Nội dung: ${parsed.negativePrompt}`);
if (!parsed.negativePrompt.includes("deformed hands")) {
  console.error("❌ Negative prompt không đúng!");
  process.exit(1);
}

// 3. Kiểm tra Mẹo
console.log(`\n[3] Mẹo thực chiến: Số lượng = ${parsed.tips.length}`);
if (parsed.tips.length !== 3) {
  console.error(`❌ Cần 3 mẹo, nhận được: ${parsed.tips.length}`);
  process.exit(1);
}
parsed.tips.forEach((t) => {
  console.log(`  ✓ ${t.title}: ${t.content.slice(0, 60)}...`);
});

// 4. Kiểm tra xuất Excel
console.log(`\n[4] Kiểm tra xuất Excel:`);
const wb = XLSX.utils.book_new();
const promptRows = parsed.prompts.map((p) => ({
  STT: p.index,
  "Góc Chụp & Tên Prompt": p.title,
  "Tỷ Lệ (--ar)": p.aspectRatio,
  "Ống Kính (Lens)": p.lensInfo || "Studio Prime",
  "Prompt Tiếng Anh (Ready to Copy)": p.promptCode,
  "Ý Đồ Nhiếp Ảnh": p.intention,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(promptRows), "Prompts_Studio");

const negRows = [
  {
    "Hạng Mục": "Negative Prompt",
    "Nội Dung": parsed.negativePrompt,
    "Hướng Dẫn": "Dán vào ô Negative Prompt hoặc thêm tham số --no",
  },
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(negRows), "Negative_Prompt");

const tipRows = parsed.tips.map((t, idx) => ({
  STT: idx + 1,
  "Tiêu Đề Mẹo": t.title,
  "Nội Dung Hướng Dẫn Thực Chiến": t.content,
}));
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tipRows), "Meo_NhiepAnh");

const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
console.log(`  ✓ Tạo Excel thành công! Size: ${buffer.length} bytes`);

console.log("\n🎉 TEST HOÀN TẤT VÀ PASS 100%!");
