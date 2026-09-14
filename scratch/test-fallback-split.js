const fs = require('fs');

const fallbackText = `1. Phong cách xin lỗi chân thành:
Dạ Shop chào bạn, Shop vô cùng xin lỗi bạn về sự cố lần này ạ. Shop xin phép được hoàn tiền hoặc gửi bù sản phẩm mới cho bạn ngay nhé.

2. Phong cách giải thích do bên bưu cục:
Dạ Shop rất tiếc vì kiện hàng bị móp méo do bên vận chuyển quăng quật, dù vậy Shop vẫn xin chịu trách nhiệm đổi mới hoàn toàn miễn phí cho bạn.

3. Phong cách cam kết chất lượng chính hãng:
Dạ Shop cam kết hàng chuẩn chính hãng 100%, nếu bạn không ưng ý Shop sẵn sàng thu hồi và hoàn trả toàn bộ chi phí cho bạn ạ.`;

// Test the fallback splitting
const splitChunks = fallbackText
  .split(/(?:\n\s*(?:#{1,4}\s*)?(?:Phương án|Phong cách|Câu trả lời|Cách|Lựa chọn|\d+[\.\:\)])\s*)/i)
  .filter((c) => c.trim().length > 20);

console.log("Fallback chunks:", splitChunks.length);
splitChunks.forEach((c, idx) => console.log(`Chunk ${idx + 1}:`, c.trim().slice(0, 40)));
