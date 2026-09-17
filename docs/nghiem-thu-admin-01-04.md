# Nghiệm thu ADMIN-01–04

Ngày thực hiện: 17/09/2026. Nhánh: `codex/hoan-thien-admin-01-04`.

## Phạm vi đã thực hiện

- **ADMIN-01:** users, lessons, transactions và usage truy vấn/lọc/sắp xếp/phân trang trên server. Mỗi trang 10/20/50 dòng. Bộ lọc ở URL; số trang vượt phạm vi được kẹp về trang hợp lệ. DTO gửi xuống trình duyệt không chứa mật khẩu, cấu hình bí mật hay input/output AI.
- **ADMIN-02:** khóa gửi lặp trong thao tác quản trị chính; xác nhận xóa/ghi đè/ngừng bán; hiển thị kết quả và lỗi. Refresh dữ liệu bằng router, giữ URL/bộ lọc. Đồng bộ lại state khi props đổi. Tạo bài mới dùng thứ tự lớn nhất của cả khóa học, không tính từ trang đang xem.
- **ADMIN-03:** dashboard chọn kỳ tối đa 366 ngày theo múi giờ Việt Nam, biểu đồ nhóm ngày/tuần/tháng, bảng ngày, giao dịch thử, hoàn tiền và sự kiện cấp/gia hạn/thu hồi VIP. Có chức năng admin đánh dấu giao dịch thử/thật và ghi nhận hoàn tiền toàn phần đã thực hiện.
- **ADMIN-04:** thống nhất kiểm tra gói VIP giữa server actions và API: giá, giá gốc, thời hạn, slug, tính duy nhất, active/popular, features và giới hạn văn bản. Thay nhãn phổ biến và ghi audit trong cùng transaction. Gói đã có giao dịch chỉ ngừng bán; intent cũ giữ snapshot giá/tên/thời hạn. Tắt tất cả gói không tự tạo lại gói mẫu; bổ sung mẫu là thao tác chủ động, giữ gói hiện có.

### Giao diện dashboard

Đã khôi phục thiết kế tổng quan cũ: AdminPageHeader, bốn thẻ màu, hai biểu đồ cạnh nhau, danh sách 5 người dùng mới và 5 giao dịch gần đây, các thẻ lối tắt quản trị. Bộ lọc kỳ và báo cáo chi tiết mới được tích hợp trong cùng phong cách thẻ bo góc. Biểu đồ doanh thu hỗ trợ cột/đường và ngày/tuần/tháng, vẫn dùng tổng hợp server theo paidAt và refundedAt. Biểu đồ phân bố dùng quyền VIP còn hạn hiện tại; tab đăng ký mới theo kỳ đang chọn ghi rõ màu VIP/Free là quyền hiện tại, không phải lịch sử cấp VIP. Hai danh sách gần đây dùng 5 bản ghi mới nhất toàn hệ thống, độc lập với kỳ doanh thu. Liên kết quản lý user dùng tham số `q` của bộ lọc mới. Không thay đổi database trong lần khôi phục UI này.

## Định nghĩa báo cáo

- Doanh thu trước hoàn tiền: tổng `amount` của giao dịch `UPGRADE_VIP`, tiền VND, không sandbox, trạng thái SUCCESS hoặc REFUNDED, có `paidAt` trong kỳ. Ngày tạo yêu cầu không phải ngày doanh thu.
- Hoàn tiền: toàn bộ `amount` của giao dịch REFUNDED có `refundedAt` trong kỳ. Doanh thu sau hoàn tiền = doanh thu trước hoàn tiền − hoàn tiền; có thể âm nếu hoàn trả giao dịch của kỳ trước.
- Ghi nhận hoàn tiền chỉ cập nhật sổ đối soát sau khi admin đã thực sự trả tiền. Ứng dụng không chuyển khoản, không tự thu hồi VIP và chưa hỗ trợ hoàn tiền một phần.
- Đánh dấu thử/thật điều chỉnh phân loại báo cáo và sự kiện VIP liên quan, không tự sửa quyền đã cấp. Intent thử không được webhook tự cấp VIP hoặc admin duyệt cấp VIP.
- ARPU = doanh thu sau hoàn tiền trong kỳ / số tài khoản còn lưu trong DB được tạo trước ngày cuối kỳ. Mẫu số bao gồm tài khoản admin; không phải số người trả tiền hay số người hoạt động. Tài khoản đã xóa không còn trong mẫu số.
- Cohort: tối đa 12 tháng đăng ký gần nhất có tài khoản, số tài khoản còn lưu, số người có giao dịch trả tiền trong kỳ và doanh thu trước hoàn tiền của nhóm. Đây không phải tỷ lệ giữ chân; refund hiển thị riêng.
- Số tài khoản/VIP hiện tại phản ánh thời điểm mở báo cáo, không suy diễn thành số VIP lịch sử.
- Sự kiện VIP mới được ghi từ bản cập nhật này, nguồn PAYMENT/MANUAL, loại NEW/RENEWAL/REVOKED. Không dựng lịch sử giả từ trạng thái VIP hiện tại. Gửi lại webhook không tạo sự kiện thanh toán trùng; cập nhật VIP không đổi quyền/thời hạn không tạo gia hạn giả.
- Giao dịch cũ thiếu `paidAt`/`refundedAt` có cảnh báo và bị loại khỏi tổng theo ngày tương ứng, không lấy ngày tạo để thay thế.
- Thẻ số lượng users/lessons trong bảng quản trị mô tả trang đang xem; thanh phân trang hiển thị tổng bản ghi phù hợp bộ lọc.

## Database và triển khai

Migration mới: `prisma/migrations/20260918000000_admin_reporting/migration.sql`.

Thêm `Transaction.isSandbox` (mặc định false), `Transaction.refundedAt`, các index báo cáo và bảng `VipGrantEvent`. Bảng sự kiện bật RLS, thu hồi quyền PUBLIC/anon/authenticated; ứng dụng dùng kết nối server tin cậy. Sự kiện chỉ chứa ID, nguồn, loại và thời gian; không lưu mật khẩu hoặc nội dung AI. Không xóa giao dịch, khóa học, bài học hay lịch sử cũ; không điền giả thời gian thanh toán hoặc sự kiện quá khứ.

**Đã áp dụng trên PostgreSQL local và DB thật ngày 17/09/2026; chưa deploy Hostinger.** DB local: `aichoshop_data0407_rollout_test`, container `aichoshop-data-test-2`, cổng 5439. Không thay `.env` production để chạy kiểm thử.

### Kết quả cập nhật DB thật

- Migration `20260918000000_admin_reporting` thành công; DB thật ghi nhận đủ 7 migration đã hoàn tất.
- Sao lưu trước khi cập nhật: `.data/backups/admin-01-04-rollout-1789619801475/public-before.dump`, 95.203 byte, định dạng PostgreSQL custom; kiểm tra catalogue đọc được. Biên bản/hash: `before.json`; kết quả sau cập nhật: `result.json` trong cùng thư mục. Backup nằm local, không đưa vào Git.
- So sánh hash và số dòng của 20 bảng dữ liệu cũ: không thay đổi. Có 6 người dùng, 3 khóa học, 30 bài học, 12 giao dịch và 4 gói VIP. Hai cột mới trong 12 giao dịch đều có giá trị mặc định; bảng sự kiện mới trống, không dựng lịch sử giả.
- `VipGrantEvent` bật RLS, server có quyền đọc/ghi, PUBLIC/anon/authenticated không có quyền được cấp.
- Đối chiếu toàn schema production phát hiện phần ngoài migration admin: `AiUsageLog` đang có thêm `completionTokens`, `costUsd`, `model`, `promptTokens`, `totalTokens` và index `(tool, createdAt)` so với schema nhánh này. Không xóa/đổi các cột/index đó. Vì vậy không tuyên bố toàn schema production hết drift; cần đồng bộ phần thống kê AI với nhánh đang triển khai trước migration tiếp theo có đụng bảng này. Kiểm tra local không có drift.

Khi triển khai: sao lưu DB thật, kiểm tra trạng thái migration và quyền kết nối server, chạy `npm run db:migrate -- --config prisma7.config.ts`, generate Prisma Client và deploy mã nguồn cùng bản schema. Kiểm tra lại `db:status` và `db:drift` với cùng config. Không dùng `db push` hay seed demo để cập nhật production. Bản code mới cần migration mới trước khi mở các màn hình admin. Nếu cần rollback ứng dụng, các cột/bảng bổ sung có thể giữ nguyên; không xóa migration/bảng để tránh mất sự kiện đã ghi.

## Kiểm thử đã chạy

- 63/63 kiểm thử thành công, không bỏ qua: admin, payments PostgreSQL, auth, payments, audit, data và data extended.
- PostgreSQL thật tại local: tạo schema riêng, chạy toàn bộ migration, dữ liệu đại diện, rồi dọn schema kiểm thử. Kiểm tra phân trang/filter/sort, VIP hết hạn, thứ tự bài toàn khóa, snapshot intent, khóa và rollback thanh toán, sự kiện VIP, sandbox, hoàn tiền, biên ngày Việt Nam, ARPU/cohort, constraint/RLS, xóa nội dung vẫn giữ quota.
- `npx tsc --noEmit` đạt; lint các phần thay đổi không có lỗi, còn cảnh báo trong các component cũ. `npx next build --webpack` đạt. Build mặc định Turbopack bị Windows từ chối tạo tiến trình (`Access is denied`, lỗi OS 5), kể cả khi chạy lại; không đổi cấu hình build của dự án để che lỗi môi trường này.
- PostgreSQL local có đủ 7 migration; `prisma migrate diff` đối chiếu với schema hiện tại báo không có khác biệt.
- Chưa nghiệm thu bằng thao tác trình duyệt trên Hostinger. Các bước dưới đây dành cho kiểm tra giao diện local và nghiệm thu sau deploy.

## Cách kiểm tra trên giao diện

Chạy ứng dụng bằng cấu hình DB local đã có migration mới; đăng nhập admin. Không dùng DB thật để tạo/xóa dữ liệu thử.

1. `/admin/users`: chọn Free/VIP, khóa/mở và sắp xếp; chuyển trang hoặc tìm email. Thử cập nhật một người dùng; bộ lọc và trang phải giữ nguyên, dữ liệu phải cập nhật. VIP hết hạn thuộc Free. Thử bấm lưu nhanh hai lần; không gửi hai thao tác.
2. `/admin/lessons`: chọn khóa học, phần và trạng thái nháp/xuất bản; chọn 10 dòng. Thêm/sửa/xóa bài: bộ lọc vẫn giữ, số dòng/tổng cập nhật; xóa dòng cuối trang không tạo bảng trống sai trang. Tạo bài mới trong khóa nhiều trang: thứ tự mặc định bằng thứ tự lớn nhất toàn khóa + 1. Kiểm tra lại danh sách học viên.
3. `/admin/sepay`: lọc trạng thái, thử/thật và ngày tạo, tìm mã thanh toán/email. Giao dịch REVIEW thật có nút duyệt; PENDING có nút hủy. Đánh dấu thử cần xác nhận và bị loại khỏi doanh thu. Chỉ dùng giao dịch thử để kiểm tra hoàn tiền; nhập thời gian thực tế sau lúc trả tiền, không ở tương lai. Không coi nút ghi nhận là nút chuyển tiền ngân hàng.
4. `/admin/usage`: lọc user/công cụ/ngày, đổi thứ tự và trang. Xóa nội dung lịch sử ở tài khoản học viên: metadata lượt sử dụng vẫn còn để đối soát quota, admin không xem input/output ở bảng này.
5. `/admin`: chọn kỳ có giao dịch đã đối soát. Tổng trước hoàn tiền khớp giao dịch theo `paidAt`; hoàn tiền theo `refundedAt`, sandbox/pending không cộng doanh thu. Đổi ngày/tuần/tháng chỉ gộp cùng dữ liệu kỳ. Xem cảnh báo bản ghi cũ thiếu ngày thanh toán và chú thích ARPU/cohort.
6. `/admin/vip-plans`: nhập giá âm, giá gốc nhỏ hơn giá bán, slug trùng hoặc thời hạn âm: phải bị từ chối. Chọn hai gói phổ biến lần lượt: chỉ gói cuối có nhãn. Sửa giá/tên gói sau khi có intent: intent giữ snapshot cũ. Xóa gói đã có giao dịch: bị từ chối, dùng ngừng bán. Tắt hết gói rồi mở profile/trang giá: không xuất hiện gói mẫu tự động. Bổ sung mẫu giữ nguyên gói đã có và không tạo thêm nhãn phổ biến khi đã có gói phổ biến.
7. Đăng xuất hoặc dùng tài khoản thường: không vào được các trang quản trị và không gọi được các API/action sửa gói, duyệt thanh toán, ghi hoàn tiền hay phân loại sandbox.
