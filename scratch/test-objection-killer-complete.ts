import { parseObjectionKillerOutput } from "../src/components/tools/ObjectionKillerOutput";

const sample = `## 🧠 1. GIẢI MÃ TÂM LÝ ẨN SAU LỜI TỪ CHỐI
- **Nỗi sợ thực sự của khách:** Khách lo ngại mua phải sản phẩm đắt mà không xứng đáng hoặc hàng giả, kém chất lượng. Họ cũng quan ngại so sánh giá với shop khác, lo lắng mua không phải là lựa chọn tốt nhất.
- **Sai lầm nhân viên thường mắc:** Đơn giản chỉ ra giá thấp hơn của shop kia mà không chứng minh được giá trị vượt trội của sản phẩm, khiến khách cảm thấy bị ép mua.

---

## 💬 2. BA PHƯƠNG ÁN PHẢN HỒI BẺ GÃY TỪ CHỐI TỨC THÌ
### 💎 Phương Án 1: Đánh Vào Giá Trị Vượt Trội (Value Focus - Khuyên Dùng)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em hiểu hoàn toàn tâm lý của Anh/Chị. Nồi chiên không dầu điện tử 6L của shop chúng em không chỉ chất lượng vượt trội hơn so với nhiều sản phẩm cùng loại mà còn bền gấp đôi. Với mức giá 890k, em đảm bảo rằng Anh/Chị sẽ hài lòng với quyết định mua hàng của mình. 
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách chê đắt nhưng thực sự thích sản phẩm.

### ⚡ Phương Án 2: Tung Deal Khan Hiếm 15 Phút (Urgency & Exclusive Offer)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị, em có một ưu đãi đặc biệt chỉ trong 15 phút nữa. Nếu Anh/chị đặt hàng ngay bây giờ, em sẽ tặng kèm kẹp gắp inox 304 và voucher giảm 40k cho Anh/chị. Chỉ còn 15 phút nữa, đừng bỏ lỡ cơ hội tiết kiệm 40k nhé!
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách đòi 'suy nghĩ thêm' hoặc so sánh giá.

### 🛡️ Phương Án 3: Đảo Ngược Rủi Ro Tuyệt Đối (Zero-Risk Reversal)
- **Mẫu tin nhắn:** 
  \`\`\`markdown
  Anh/chị ơi, em rất hiểu Anh/chị lo lắng về chất lượng. Shop chúng em cam kết bảo hành 12 tháng 1 đổi 1 tại nhà, đồng thời chịu 100% phí ship nếu Anh/chị không hài lòng. Em xin đảm bảo, Anh/chị sẽ không phải lo lắng về bất kỳ rủi ro nào.
  \`\`\`
- **Thời điểm áp dụng:** Dành cho khách sợ hàng không giống ảnh hoặc sợ bị lừa.

---

## 🚀 3. KỸ THUẬT "CÂU HỎI MỞ" BUỘC KHÁCH PHẢI TRẢ LỜI
- **Câu hỏi lựa chọn 1:** 
  \`\`\`markdown
  Em có thể giúp Anh/chị chọn màu sắc và kích thước phù hợp không? Điều này sẽ giúp Anh/chị quyết định nhanh hơn.
  \`\`\`
- **Câu hỏi lựa chọn 2:** 
  \`\`\`markdown
  Em có thể gửi thêm địa chỉ nhận hàng cho em, để em kịp thời gửi hàng cho Anh/chị?
  \`\`\`

---

## ⏱️ 4. NGUYÊN TẮC VÀNG KHI TRỰC CHAT SÀN
- **3 mẹo giúp tỷ lệ chốt đơn (Conversion Rate) trên khung chat tăng từ 15% lên 40%:**
  1. **Luôn đồng cảm và tạo sự tin tưởng:** Đồng cảm với khách hàng để làm giảm sự đề phòng và tạo cảm giác an tâm.
  2. **Cung cấp thông tin chi tiết và minh bạch:** Giải thích rõ về giá trị sản phẩm, ưu đãi và cam kết bảo hành để khách hàng hiểu rõ.
  3. **Đặt câu hỏi mở:** Hỏi khách hàng về nhu cầu và mong muốn để gợi ý họ đưa ra quyết định, thay vì để họ im lặng.`;

const parsed = parseObjectionKillerOutput(sample);
console.log("=== PARSED RESULT ===");
console.log("Psychology Real Fear:", parsed?.psychology.realFear);
console.log("Psychology Staff Mistake:", parsed?.psychology.staffMistake);
console.log("\nResponse Options Count:", parsed?.responseOptions.length);
parsed?.responseOptions.forEach(o => {
  console.log(`- Option ${o.index}: [${o.badge}] ${o.title}`);
  console.log(`  Message: "${o.message.slice(0, 80)}..."`);
  console.log(`  Timing: "${o.timing}"`);
});
console.log("\nOpen Questions Count:", parsed?.openQuestions.length);
parsed?.openQuestions.forEach(q => {
  console.log(`- ${q.label}: "${q.question}"`);
});
console.log("\nGolden Rules Count:", parsed?.goldenRules.length);
parsed?.goldenRules.forEach(r => {
  console.log(`- ${r.title}: "${r.content}"`);
});
