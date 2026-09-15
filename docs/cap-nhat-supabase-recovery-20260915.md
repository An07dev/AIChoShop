# Supabase: khôi phục mật khẩu và audit — 15/09/2026

Đã cập nhật database thật theo yêu cầu người dùng.

- Sao lưu schema public tại `.data/backups/recovery-audit-upgrade-20260915/public-before.dump`, phục hồi thử thành công trên PostgreSQL local và đối chiếu số lượng User/Transaction/Lesson. Database phục hồi thử đã xóa; archive và biên bản được giữ ngoài Git.
- Áp dụng `prisma/manual/create_recovery_audit.sql` trong transaction với lock timeout 10 giây và statement timeout 60 giây.
- Đã tạo PasswordReset (token hash duy nhất, thời hạn, trạng thái gửi, khóa ngoại tới User) và AdminAuditLog (actor, action, target, details, thời gian), cùng index.
- Bật RLS, thu hồi quyền PUBLIC/anon/authenticated; backend hiện tại có quyền truy cập phù hợp.
- Prisma đọc/ghi thử cả hai bảng trong transaction rồi rollback; xác nhận không để lại dữ liệu kiểm thử, không tạo token có thể sử dụng hoặc gửi email.
- Kiểm tra sau cập nhật: 5 tài khoản, 27 bài học, 11 giao dịch. Hai bảng mới chưa có bản ghi tại thời điểm kiểm chứng. Không sửa mật khẩu, trạng thái VIP hoặc nội dung giao dịch.

Database đã sẵn sàng cho mã recovery/audit. Chưa triển khai website production; gửi email thật vẫn cần RESEND_API_KEY, RECOVERY_EMAIL_FROM và APP_URL hợp lệ. Thông báo “chưa áp dụng Supabase đợt này” trong báo cáo cũ được thay thế bởi biên bản này.
