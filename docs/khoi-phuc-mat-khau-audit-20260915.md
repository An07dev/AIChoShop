# Khôi phục mật khẩu và nhật ký quản trị

Nhánh `codex/khoi-phuc-mat-khau-audit`, từ main ngày 15/09/2026. Không xử lý lỗi Prisma SePay đã được yêu cầu bỏ qua.

## Đã triển khai

- Nút Quên mật khẩu dẫn tới `/forgot-password`. Trang `/reset-password` nhận token từ fragment URL, xóa fragment khỏi thanh địa chỉ sau khi nạp. Token không nằm trong query URL gửi tới máy chủ khi mở trang; người dùng gửi token qua Server Action khi lưu mật khẩu.
- Gửi tự động qua Resend, theo lựa chọn của người dùng. Cần `RESEND_API_KEY`, `RECOVERY_EMAIL_FROM` (địa chỉ gửi đã xác minh) và `APP_URL` (origin website; production bắt buộc HTTPS). Không lấy origin từ header yêu cầu. Tham khảo API chính thức: https://resend.com/docs/api-reference/emails/send-email.
- Token ngẫu nhiên 32 byte, database chỉ lưu SHA-256; link hết hạn 15 phút, dùng một lần. Khóa hàng người dùng và kiểm tra lại token trong transaction giúp chống hai lần đổi đồng thời. Thay đổi mật khẩu theo luồng khác khiến link cũ không còn hợp lệ nhờ đối chiếu bản băm phiên bản mật khẩu.
- Đổi mật khẩu, vô hiệu hóa các link còn lại, thu hồi phiên và ghi audit trong cùng transaction. Không tự đăng nhập sau reset.
- Giới hạn yêu cầu khôi phục qua AuthRateLimit, email chuẩn hóa; tối đa một email/tài khoản/phút. Yêu cầu mới không tự hủy link đã gửi, tránh người ngoài liên tục làm mất hiệu lực link của chủ tài khoản.
- Thông báo chung cho email không tồn tại/tài khoản khóa/lỗi gửi để tránh công khai tài khoản tồn tại. Khi thiếu cấu hình email, giao diện báo chức năng chưa được cấu hình. Trạng thái SENT nghĩa là provider chấp nhận, không bảo đảm thư đã vào inbox. Lỗi/timeout được lưu FAILED; người dùng có thể yêu cầu lại, chưa có hàng đợi tự retry hoặc webhook theo dõi delivery/bounce.
- Trang `/admin/audit`, có guard admin, phân trang 50 bản ghi; hiển thị ID người thực hiện, đối tượng, hành động, thời gian Việt Nam. Cảnh báo lỗi gửi email gần đây. Không hiển thị token hoặc password hash.
- Audit cùng transaction cho tạo/xóa/khóa người dùng, sửa VIP/hạn mức, admin reset mật khẩu, người dùng hoàn tất recovery, duyệt thanh toán và admin hủy yêu cầu thanh toán. Nhật ký không có API sửa/xóa và không có foreign key tới User để giữ dấu vết sau khi xóa tài khoản. Backend database owner vẫn có quyền sửa bảng; chưa phải kho audit bất biến trước quản trị viên database.

## Database và triển khai

**Đã áp dụng Supabase ngày 15/09/2026 theo yêu cầu người dùng.** Xem [biên bản cập nhật](./cap-nhat-supabase-recovery-20260915.md). Hướng dẫn dưới đây dành cho các môi trường chưa cập nhật. SQL `prisma/manual/create_recovery_audit.sql` thêm PasswordReset và AdminAuditLog, index, RLS và thu hồi quyền PUBLIC/anon/authenticated. Chạy với search_path public trên Supabase, sau backup và trước khi triển khai mã. Các thao tác đã tích hợp audit sẽ rollback nếu chưa có bảng audit.

Không chạy seed hoặc db push thay cho migration đã chuẩn bị. Chưa gửi email tới người thật hoặc triển khai website. API key và địa chỉ gửi cần chủ dự án cấu hình, không đưa vào Git.

## Kiểm chứng

- Prisma generate và TypeScript source: đạt, 0 diagnostics.
- ESLint các helper recovery/mail/audit, action recovery, form, audit page và test recovery: đạt.
- 54 kiểm thử đạt, 0 fail, 0 skip: xác thực, payment test doubles, Resend giả lập, cùng PostgreSQL local cho recovery, account security, payment và quota AI.
- Recovery PostgreSQL: email không tồn tại, cooldown, chỉ lưu hash, hai lần reset đồng thời chỉ một thành công, thu hồi session, link hết hạn, tài khoản khóa, mật khẩu đã đổi và rollback khi audit lỗi. SQL chạy lặp hai lần trên schema riêng.
- Resend giả lập: endpoint cố định, idempotency key, URL fragment, kiểm tra cấu hình HTTPS và lỗi provider. Chưa xác nhận DNS/domain gửi hoặc thư tới inbox thật.

- Build compile mode: đạt; chưa phải full deployment/prerender nghiệm thu.
- HTTP trên Next server local: /forgot-password, /reset-password, /login trả 200 và đúng nội dung/link; guest truy cập /admin/audit bị chuyển về /admin-login. Chưa kiểm tra click/submit bằng trình duyệt.

## Còn ngoài phạm vi hoàn tất của đợt này

Audit cấu hình API key/ngân hàng, thay đổi bài học/gói/biểu phí và thao tác thất bại chưa được bao phủ. Chưa đánh dấu toàn bộ SEC-08 hoàn tất. UI cần nghiệm thu thực tế cả luồng từ email tới browser sau khi cấu hình dịch vụ. Các phần khác của plan (thuế/CSV, mobile/nội dung, CI/production) còn nguyên.
