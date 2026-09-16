# DATA-01 đến DATA-03

Nhánh `codex/hoan-thien-data` chuyển database sang Prisma Migrate và tách seed demo khỏi bootstrap. Không tự chạy migration/seed trên production khi install, build hoặc mở trang.

## Migration

- `20260916000000_baseline` dựng schema trước đợt DATA. Bao gồm CHECK thời lượng/tiến độ và exclusion chống chồng lấn biểu phí (`btree_gist`), không chỉ schema Prisma.
- `20260916010000_safe_bootstrap_defaults` đổi DEFAULT, không UPDATE bản ghi: bỏ mật khẩu admin mặc định, bỏ ngân hàng mẫu, tắt autoActivate/AI mặc định và dùng prefix ACS.
- `20260916020000_payment_access` bật RLS và thu hồi quyền API công khai trên bảng thanh toán, giữ truy cập qua server tin cậy.
- `prisma/baseline.prisma` là snapshot bất biến phục vụ nhận database đã được nâng cấp bằng SQL thủ công. Không dùng snapshot này để generate Client hoặc tạo migration tương lai.
- Database mới: `npm run db:migrate`, sau đó `npm run db:seed`.
- Database cũ: backup và thử trên bản sao trước; `npm run db:baseline` chỉ đánh dấu baseline khi schema Prisma khớp và có đủ tên CHECK/exclusion yêu cầu (cần review định nghĩa constraint trên bản sao trước rollout). Nó không chạy lại CREATE TABLE trên dữ liệu thật. Nếu drift, dừng và chuẩn bị SQL sửa tương thích đã review; không dùng reset hoặc accept-data-loss.
- Sau baseline: `npm run db:migrate`, `npx prisma generate`, `npm run db:status`, `npm run db:drift`.
- Không chạy lại các SQL trong `prisma/manual` sau khi chuyển sang migration. Các script cũ được giữ làm tài liệu nâng cấp lịch sử.

## Backup và phục hồi

Trước thao tác production, dùng `pg_dump --format=custom --file=<backup-path>` với kết nối PostgreSQL được cấu hình qua PGHOST/PGPORT/PGUSER/PGDATABASE và pgpass. Không đưa password vào log hoặc command history. Sao lưu riêng `MEDIA_ROOT`; dump database không chứa video. Restore bằng `pg_restore` vào database staging riêng rồi kiểm tra counts và nghiệp vụ. Không restore đè database đang phục vụ khách.

Migration đổi DEFAULT không đổi cấu hình người dùng nên rollback code cũ không cần xóa dữ liệu. Nếu cần phục hồi DEFAULT cũ, tạo migration tiến mới có review; không xóa bản ghi `_prisma_migrations`, không rollback bằng reset. Mật khẩu/ngân hàng mẫu cũ không nên khôi phục. Backup/restore đầy đủ trên hạ tầng production thuộc OPS-07 và chưa được nghiệm thu trong đợt này.

## Seed

- `npm run db:seed`: chỉ bổ sung SystemSetting/SePayConfig nếu thiếu, AI/payment tắt, không mật khẩu hoặc tài khoản admin mẫu, không gói VIP hoặc khóa học demo.
- `npm run db:seed:demo`: chỉ localhost ngoài production; thêm một khóa demo và hai bài nháp không video, học phần đúng và nối thứ tự ở cuối. Không ghi đè các bài đã chỉnh sửa.
- Transaction + advisory lock bảo vệ chạy lặp/đồng thời. Lỗi rollback toàn bộ seed.
- Có thể tạo gói VIP bằng thao tác admin khởi tạo mặc định, có guard/audit. Việc mở trang trống không tự tạo gói.

## Đọc dữ liệu

- Trang admin gói VIP chỉ đọc dữ liệu, giữ danh sách trống nếu admin xóa/ngừng bán.
- Trang admin users không còn quét/hạ VIP khi render; hiển thị isVIP theo entitlement tại thời điểm đọc.
- getActiveVipPlans/getSePayConfig/getSystemSettings/syncUserVipExpiration không tạo/sửa dữ liệu khi đọc. Khi đọc SystemSetting lỗi, AI bị đóng thay vì tự bật.
- Mutation cấu hình, thanh toán, usage, tiến độ và bảo mật session vẫn được phép ghi theo nghiệp vụ; DATA-03 không loại bỏ các hành vi cần thiết đó.

## Kiểm thử

`TEST_DATABASE_URL` phải là localhost/127.0.0.1 và tên database kết thúc `_test`. Chạy `npm run test:data`: helper đọc không ghi; PostgreSQL baseline, nâng cấp có dữ liệu, seed lặp/đồng thời, giữ Progress/User/Lesson/cấu hình, trạng thái nháp demo và default an toàn. Mỗi test tạo schema riêng và chỉ dọn schema đó.

Đợt này chưa thay đổi database production. Không coi test bị SKIP là bằng chứng đạt.

Kết quả ngày 16/09/2026: PostgreSQL 17 local cổng 5439; tạo mới, deploy lặp và tiếp nhận database cũ thành công, drift bằng 0. Hai test DATA đạt, không skip; lint các file DATA đạt. Chưa chạy migration trên database thật.
Build production 
ext build --webpack và kiểm tra TypeScript đạt. Sửa thêm export hằng số không hợp lệ trên page Photo Prompter để build được.
