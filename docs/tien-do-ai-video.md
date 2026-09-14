# Tiến độ AI, video và môi trường test — 14/09/2026

## Đã triển khai trong mã nguồn

- Khách chỉ gọi thử SEO, tối đa 2 kết quả theo cookie trình duyệt. Xóa cookie vẫn có thể tạo danh tính mới; giới hạn tổng hệ thống giúp chặn chi phí, chưa thay thế chống bot.
- Free dùng chung hạn mức AI trên tài khoản (mặc định 12 kết quả thành công/ngày, theo giờ Việt Nam). Hạn mức 0 được giữ nguyên. Các phép tính giá/thuế/KOC không được ghi giả thành kết quả AI.
- VIP dùng mọi công cụ, mặc định tối đa 200 kết quả/ngày. `AI_VIP_DAILY_LIMIT` điều chỉnh mức này. `AI_GLOBAL_DAILY_ATTEMPTS=5000` giới hạn tổng lần xử lý/ngày, bao gồm lỗi. Đây là giới hạn lượt gọi, không phải ngân sách tiền chính xác. `AI_ENABLED=false` dừng gọi AI.
- Giữ lượt bằng bản ghi `SeoRun` có tiền tố `ai_`, khóa PostgreSQL ngắn để chống chạy đồng thời. Mỗi tài khoản chỉ có một yêu cầu đang xử lý. Lưu kết quả và hoàn tất lượt trong cùng transaction; lỗi hoặc kết quả bị cắt không trừ lượt thành công. Lease hết hiệu lực sau 150 giây.
- API sinh nội dung yêu cầu đăng nhập (trừ SEO), giới hạn body, chặn yêu cầu khác origin, không trả lỗi thô từ provider. Không lưu ảnh base64 vào lịch sử sinh nội dung.
- Upload mới chỉ nhận MP4/WebM có chữ ký định dạng phù hợp, giới hạn cả luồng request 100 MiB. Lưu tại `.data/media` hoặc `MEDIA_ROOT` ngoài `public`.
- API video kiểm tra session và quyền bài học, hỗ trợ Range/HEAD để tua. Proxy chuyển đường dẫn `/uploads/videos/*` cũ qua cùng API. Nếu cùng tệp liên kết bài Free và VIP, áp dụng quyền VIP. Tệp chưa gắn bài chỉ admin xem được.
- Tiến độ học lưu trạng thái mong muốn bằng upsert, không đảo ngược trạng thái khi gửi lại cùng yêu cầu. Sửa hook nằm sau nhánh return của trang học.
- Thay mật khẩu thật trong `.env.example` bằng placeholder. **Chưa đổi mật khẩu trên Supabase.**

## Bằng chứng kiểm tra

- `node scripts/typecheck-source.cjs`: 0 lỗi.
- ESLint bốn tệp quota/media/upload mới hoặc viết lại: đạt.
- `node --test scripts/test-auth.cjs scripts/test-payments.cjs`: 46/46 đạt.
- `node --test scripts/test-payments-db.cjs`: đạt trên PostgreSQL 17 riêng, kiểm tra đồng thời, uniqueness, rollback và duyệt thủ công.
- `node --test scripts/test-ai-quota-db.cjs`: đạt trên PostgreSQL thật; kiểm tra đồng thời, rollback, không ghi kết quả hai lần, hạn mức 0, VIP hết hạn và đổi ngày Việt Nam.
- `node --test scripts/test-media.cjs`: 2/2 đạt.
- `node scripts/test-media-http.cjs`: đạt trên Next server thật; đường dẫn cũ/mới đều chặn guest và VIP hết hạn; VIP hợp lệ nhận 206 với đúng số byte.
- `next build --webpack --experimental-build-mode compile`: đạt. Đây là compile mode, chưa phải nghiệm thu toàn bộ prerender/deployment.

## Chạy lại test

Container cục bộ `aichoshop-test-20260914`, PostgreSQL 17, chỉ mở `127.0.0.1:55432`. Tài khoản test `postgres`, mật khẩu mẫu `local-test-only`, database `aichoshop_test`. Không sử dụng thông tin này ở production.

Trong PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgresql://postgres:local-test-only@127.0.0.1:55432/aichoshop_test'
node --test scripts/test-payments-db.cjs scripts/test-ai-quota-db.cjs
```

Test HTTP cần Next server cổng 3127 với `DATABASE_URL` trỏ đúng database test trên. Script tạo/xóa dữ liệu fixture trong database test, không chạy với URL production. Schema fixture ở `scripts/fixtures/schema.sql`; khi đổi Prisma schema, tái sinh bằng Prisma migrate diff từ schema rỗng.

## Kiểm kê thực tế và phần còn lại

- Supabase kết nối đọc được, nhưng chưa có các cột payment intent và bảng `PaymentWebhookEvent`. **Chưa áp dụng SQL trên Supabase**. Cần backup, áp dụng `prisma/manual/create_payment_intents.sql`, kiểm tra tương thích và triển khai cùng mã. Không dùng seed xóa dữ liệu.
- Có 6 MP4 trong dự án. Database có 27 bài: 24 bài vẫn dùng video YouTube mẫu, 3 bài dùng MP4, trong đó 2 bài tên test. Chưa có căn cứ gắn các video còn lại vào từng bài. Chưa thay nội dung thật hay xóa bài của người dùng.
- Email `hotro@aichoshop.com` chỉ được tìm thấy trong giao diện, chưa xác minh hộp thư. Các liên kết Zalo hiện chỉ tới `https://zalo.me`, chưa có số/tài khoản chính thức.
- Mật khẩu Supabase từng nằm trong tệp mẫu cần được chủ tài khoản đổi ở dịch vụ nguồn rồi cập nhật môi trường.
- Server production phải chuyển toàn bộ đường dẫn video qua Next proxy; không cấu hình CDN/nginx phục vụ trực tiếp `public/uploads/videos`. Storage mới cần ổ đĩa bền vững và backup. Video YouTube/Vimeo công khai không thể bảo vệ quyền tải bằng API nội bộ này.
- Chưa nghiệm thu các mục khác trong kế hoạch tổng thể: khôi phục mật khẩu, chống thử đăng nhập, audit quản trị, công thức thuế/CSV, nội dung và mobile, backup/restore, CI và triển khai production. Không coi tài liệu này là xác nhận hoàn thiện toàn dự án.
