# Cập nhật Supabase thật: AuthRateLimit — 15/09/2026

Đã thực hiện theo yêu cầu cập nhật database thật của chủ dự án.

- Sao lưu toàn bộ schema public vào `.data/backups/auth-upgrade-20260915/public-before.dump`. Đã phục hồi thử thành công trên PostgreSQL local và xóa database phục hồi thử sau kiểm tra. Bản sao lưu chứa dữ liệu thật, được loại khỏi Git.
- Áp dụng `prisma/manual/create_auth_rate_limit.sql` trong transaction: tạo bảng `AuthRateLimit` với `id`, `attempts`, `expiresAt`; index thời gian hết hạn; bật RLS; thu hồi quyền PUBLIC/anon/authenticated.
- Kiểm tra Prisma đọc được bảng; thử thêm và tăng bộ đếm trong transaction rồi rollback, xác nhận không để lại dữ liệu kiểm thử.
- Sau cập nhật: 5 tài khoản, 27 bài học, 11 giao dịch, bộ đếm mới chưa có dữ liệu tại thời điểm kiểm tra. Migration không thay đổi mật khẩu, VIP hoặc giao dịch.
- Biên bản backup và migration nằm cùng thư mục archive.

Database đã sẵn sàng cho mã giới hạn đăng nhập/đăng ký trên nhánh `codex/hoan-thien-tai-khoan-quan-tri`. Không đồng nghĩa mã website đã được triển khai lên production hay mọi luồng giao diện đã nghiệm thu.

Thông báo “chưa áp dụng SQL AuthRateLimit” trong các báo cáo trước là trạng thái lịch sử và được thay thế bằng biên bản này.
