# Tiến độ tài khoản — 15/09/2026

Nhánh: `codex/hoan-thien-tai-khoan-quan-tri`, tạo từ `main` khi working tree sạch. Không sửa lỗi Prisma tại admin SePay theo yêu cầu.

## Mã đã bổ sung

- AUTH-09: giới hạn đăng nhập 10 lần/email/15 phút; đăng ký 5 lần/email/15 phút. Có giới hạn chung 300 lần đăng nhập và 60 lần đăng ký/15 phút để hạn chế đổi email liên tục. Các lần thành công cũng tính vào giới hạn. Cửa sổ cố định, có thể có hai đợt sát ranh giới thời gian.
- Bộ đếm PostgreSQL dùng chung giữa các tiến trình; tăng bộ đếm trong transaction. Email chuẩn hóa rồi SHA-256 trước khi đưa vào khóa bộ đếm; không lưu mật khẩu. Không lấy IP từ header người dùng có thể giả mạo. Bộ đếm quá hạn hơn một ngày được dọn khi có lượt hợp lệ.
- Khi không đọc/ghi được bộ đếm, đăng nhập và đăng ký từ chối với thông báo chung. Không có cơ chế bỏ qua giới hạn khi lỗi DB. Giới hạn theo hạ tầng/IP đáng tin còn cần cấu hình ở nơi triển khai; giới hạn theo email có thể bị người khác sử dụng để tạm chặn một tài khoản.
- SEC-09: chặn tự khóa/xóa tài khoản admin. Tuần tự hóa thao tác khóa/xóa và kiểm tra lại quyền của người thực hiện trong transaction, tránh hai admin đồng thời khóa nhau khiến không còn admin hoạt động.
- Kiểm tra lịch sử giao dịch và xóa tài khoản trong cùng transaction, khóa hàng người dùng; giữ lịch sử thanh toán.

## SQL bắt buộc trước khi chạy bản mã này

`prisma/manual/create_auth_rate_limit.sql` tạo bảng `AuthRateLimit`, index hết hạn, bật RLS và thu hồi quyền PUBLIC/anon/authenticated. Bảng chỉ phục vụ backend.

**Đã áp dụng SQL lên Supabase ngày 15/09/2026 theo yêu cầu người dùng.** Xem [biên bản cập nhật](./cap-nhat-supabase-auth-20260915.md). Với các môi trường khác chưa có bảng, đăng nhập/đăng ký sẽ bị từ chối. Cần kiểm thử PostgreSQL thành công, sao lưu và triển khai SQL trước mã. Không chạy lại seed hoặc db push để thay cho SQL bổ sung này.

## Kiểm tra

- Prisma generate: đạt.
- Source TypeScript: 0 lỗi.
- `node --test scripts/test-auth.cjs`: 31/31 đạt, gồm kiểm tra từ chối khi bộ đếm không truy cập được.
- ESLint các helper mới, auth actions và script test mới: đạt.
- `scripts/test-account-security-db.cjs`: đã chạy thành công trên PostgreSQL local ngày 15/09/2026. 20 yêu cầu đăng nhập đồng thời chỉ 10 được nhận; 8 yêu cầu đăng ký chỉ 5 được nhận; các yêu cầu bị từ chối đúng lỗi hạn mức. Hai admin khóa nhau đồng thời chỉ một thao tác thành công, còn một admin hoạt động. SQL bổ sung chạy lặp hai lần thành công.
- Chạy lại cùng bộ quota AI và thanh toán PostgreSQL: 3/3 bộ kiểm thử đạt, không bỏ qua. Các schema fixture riêng được dọn sau test. Supabase không bị thay đổi.
- Khôi phục Docker bằng cách đổi tên thư mục runtime hỏng sang `C:/Users/hoang/AppData/Local/Docker/run-preserved-20260915`; giữ nguyên container và dữ liệu. Container test đang chạy trên `127.0.0.1:55432`.

Plan tổng thể vẫn còn khôi phục mật khẩu, audit quản trị đầy đủ, thuế/CSV, mobile/nội dung, CI và nghiệm thu production. Đợt này chỉ triển khai phần chống thử đăng nhập và bảo vệ thao tác khóa/xóa admin; chưa đánh dấu toàn bộ AUTH-09/SEC-09 hoàn tất.
