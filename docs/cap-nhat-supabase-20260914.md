# Cập nhật Supabase thật — 14/09/2026

Đã thực hiện theo yêu cầu cập nhật database thật của chủ dự án.

- Sao lưu toàn bộ schema `public` bằng PostgreSQL pg_dump custom format. Đã phục hồi thử trên PostgreSQL local, đối chiếu số lượng tài khoản, bài học và giao dịch; sau đó xóa database phục hồi thử.
- Bản sao lưu và biên bản kiểm chứng nằm trong `.data/backups/payment-upgrade-20260914/`, được loại khỏi Git. Archive chứa dữ liệu thật và bí mật ứng dụng: chỉ cấp quyền cho người quản trị, không chia sẻ hoặc đưa lên repository.
- Đã chạy `prisma/manual/create_payment_intents.sql` trên Supabase, trong transaction, có giới hạn thời gian chờ khóa.
- Bổ sung 11 cột vào `Transaction`, index mã thanh toán duy nhất và index tra cứu người dùng/trạng thái/thời gian.
- Tạo `PaymentWebhookEvent`, khóa ngoại tới `Transaction` và index trạng thái/thời điểm nhận.
- Đã đối chiếu toàn bộ các trường cũ của 11 giao dịch trước/sau migration: không thay đổi. Các giao dịch cũ không được tự gán payment code hoặc tự cấp VIP.
- Đã chạy `prisma/manual/secure_payment_tables.sql`: bật RLS và thu hồi quyền trực tiếp của PUBLIC, anon, authenticated trên hai bảng thanh toán. Backend sử dụng kết nối PostgreSQL có quyền phù hợp; không phụ thuộc Supabase client phía trình duyệt để đọc/ghi thanh toán.
- Kiểm tra sau cập nhật: 11 giao dịch, 5 tài khoản, 27 bài học; bảng sự kiện mới chưa có dữ liệu. Prisma đọc được schema mới.

Database đã cập nhật; đây **không phải** triển khai mã website, bật webhook production hay nghiệm thu thanh toán tiền thật. Chưa xoay mật khẩu Supabase từng xuất hiện trong tệp mẫu.

Các tài liệu tiến độ trước thời điểm này ghi “chưa cập nhật Supabase” là trạng thái lịch sử. Dùng biên bản này làm trạng thái mới nhất của database thanh toán.
