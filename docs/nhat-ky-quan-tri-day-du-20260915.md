# Nhật ký quản trị — phạm vi ghi nhận

Ngày cập nhật: 15/09/2026. Dùng bảng `AdminAuditLog` hiện có, không cần SQL bổ sung.

| Nhóm | Thao tác được ghi |
| --- | --- |
| Người dùng | Tạo, xóa, khóa/mở khóa, cấp/tắt VIP, đổi hạn mức cá nhân và chung, đặt lại mật khẩu |
| Bảo mật tài khoản | Khôi phục mật khẩu hoàn tất; đăng nhập thất bại và vượt giới hạn |
| Thanh toán | Quản trị viên duyệt thanh toán, hủy yêu cầu chưa thanh toán |
| Cấu hình | Lưu cấu hình AI và SePay/ngân hàng qua Server Action và API cấu hình AI |
| Học tập | Tạo khóa học; thêm, sửa, xóa bài học, bật/tắt VIP; từng bản ghi được khôi phục |
| Gói VIP | Thêm, sửa, xóa, bật/tắt, nhãn phổ biến qua Server Action và API; khởi tạo gói mặc định |
| Biểu phí | Thêm mức phí ghi đè, vô hiệu hóa |
| Video | Tải lên thành công, lỗi/từ chối ở API tải lên |
| Quyền quản trị | Từ chối tại `requireAdmin` và `adminRouteGuard`, chặn nguồn yêu cầu |
| Kết quả thao tác | Kết quả `success: false`, HTTP lỗi, exception tại các action/API quản trị thay đổi dữ liệu |
| Tự động | Hạ trạng thái VIP hết hạn khi chạy đồng bộ, tác nhân `system` |

## Cơ chế

- Thay đổi database và nhật ký thành công nằm trong cùng transaction. Nếu không ghi được nhật ký, transaction bị rollback.
- Nhật ký lỗi/từ chối nằm ngoài transaction đã thất bại. Khi database không truy cập được, không thể lưu sự kiện vào chính database đó; máy chủ phát tín hiệu `security_audit_unavailable`, quyền truy cập vẫn bị từ chối.
- Upload là thao tác filesystem: nếu ghi nhật ký lỗi sau khi ghi file, hệ thống cố xóa file vừa tạo và trả lỗi. Filesystem và PostgreSQL không phải một transaction; sự cố tiến trình/ổ đĩa giữa hai bước vẫn cần đối soát file mồ côi.
- Không lưu mật khẩu, token, API key, email nguyên văn hoặc tài khoản ngân hàng trong chi tiết nhật ký. Đăng nhập thất bại dùng hash email và tác nhân chưa xác minh; hash là mã đối chiếu, không phải bằng chứng danh tính.
- Chi tiết thay đổi dùng danh sách trường số/boolean được cho phép. Đây không phải bản sao đầy đủ trước/sau của nội dung bài học.
- Giao diện `/admin/audit` có nhãn tiếng Việt, bộ lọc loại thao tác, phân trang 50 bản ghi, người thực hiện và mã đối tượng. Người dùng đã xóa vẫn giữ ID lịch sử.
- Một yêu cầu có thể đã ghi được một số thay đổi rồi báo lỗi ở bước sau (ví dụ khôi phục nhiều bài, làm mới cache); xem cả bản ghi thành công và lỗi liên quan.
- Không ghi mỗi lần xem trang/đọc dữ liệu thành công. Webhook ngân hàng có nhật ký riêng ở `PaymentWebhookEvent`. Không tái tạo lịch sử trước lúc tính năng được triển khai.

## Kiểm thử và cách kiểm tra giao diện

Chạy `node --test scripts/test-audit.cjs` để kiểm tra trường an toàn, rollback khi audit lỗi, kết quả action/HTTP lỗi và action gói VIP thực tế với database giả lập.

Chạy `node --test scripts/test-audit-db.cjs` với `TEST_DATABASE_URL` trỏ PostgreSQL **local**, database có tên kết thúc `_test`. Test tạo schema ngẫu nhiên riêng và dọn schema của nó; không dùng production. Kiểm tra CRUD gói VIP/bài học, cấu hình AI/ngân hàng và rollback thực sự bằng constraint PostgreSQL.

Trên môi trường kiểm thử: đăng nhập admin, đổi trạng thái một gói VIP hoặc bài học, lưu cấu hình rồi mở `/admin/audit` và chọn bộ lọc tương ứng. Thử gửi form thiếu trường bắt buộc để kiểm tra bản ghi từ chối. Dùng cửa sổ riêng không đăng nhập để gọi API admin, sau đó kiểm tra nhật ký bằng tài khoản admin. Không dùng tài khoản/thanh toán thật để thử thao tác xóa hoặc duyệt tiền.
