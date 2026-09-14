# Đợt triển khai xác thực và thanh toán — 14/09/2026

Đây là thay đổi mã nguồn đầu tiên từ [kế hoạch hoàn thiện](/D:/AIChoShop/docs/ke-hoach-hoan-thien-du-an.md). **Chưa triển khai lên production và chưa áp dụng SQL vào database đang cấu hình.** Các đầu việc trong kế hoạch tổng thể chưa được coi là nghiệm thu chỉ vì đã có mã.

## 1. Những phần đã triển khai trong mã

### Xác thực và phân quyền

- Toàn bộ chỗ từng dùng `user_token` làm ID chuyển sang xác minh token ngẫu nhiên qua bảng `SeoSession`; kiểm tra hạn phiên và trạng thái khóa.
- Quản trị đăng nhập bằng email/mật khẩu tài khoản có `role = ADMIN`. Cookie `admin_token=authenticated` và mật khẩu quản trị dùng chung không còn cấp quyền.
- Trang, server action quản trị và API cấu hình/VIP/upload kiểm tra quyền ở server. Proxy chỉ hỗ trợ chuyển hướng, không thay thế kiểm tra quyền.
- Mật khẩu mới dùng scrypt với salt ngẫu nhiên. Tài khoản SHA-256 cũ được nâng cấp khi xác minh mật khẩu thành công. Địa chỉ email cũ trùng nhau nếu bỏ qua hoa/thường bị từ chối để đối soát, không chọn ngẫu nhiên một tài khoản.
- Đổi/reset mật khẩu cập nhật hash và xóa các phiên trong cùng transaction. Khóa tài khoản xóa phiên; đăng xuất xóa phiên hiện tại. Tạo phiên kiểm tra lại mật khẩu và trạng thái khóa dưới row lock để tránh phiên mới được cấp bằng thông tin đã thay đổi.
- API và trang cấu hình AI không trả khóa đã lưu xuống trình duyệt. Ô nhập trống giữ khóa cũ; nhập khóa mới để thay thế. Cấu hình SePay cũng chỉ trả trạng thái đã có khóa.
- Đã đổi `middleware.ts` sang `proxy.ts` theo hướng dẫn Next.js cài trong dự án.

### Thanh toán và VIP

- Client gửi `planId`; server đọc gói đang bán và chụp giá, thời hạn, tên gói, tiền tệ, tài khoản nhận tiền vào `Transaction`.
- Mã chuyển khoản riêng có dạng `ACS` + 16 ký tự hex; yêu cầu có hạn 30 phút. Nhấn lặp cùng gói/tài khoản nhận/giá/thời hạn tái sử dụng yêu cầu còn hiệu lực; giới hạn 10 yêu cầu mới mỗi giờ/tài khoản.
- QR chỉ hiển thị sau khi server tạo yêu cầu. Modal theo dõi trạng thái đúng ID và chủ sở hữu, không dựa vào cờ VIP sẵn có. Người đã có VIP cũng có thể mua gia hạn.
- Webhook bắt buộc có khóa cấu hình và xác thực header. Đọc tối đa 32 KiB thực tế, kiểm tra ID, chiều tiền, số tiền nguyên dương và tài khoản nhận.
- Mỗi ID SePay có một `PaymentWebhookEvent` duy nhất. Gửi lại cùng sự kiện không cấp quyền thêm; thay payload cho ID cũ bị từ chối.
- Dùng mã thanh toán chính xác; không còn dò tên, email, số điện thoại hoặc giao dịch gần nhất để cấp VIP.
- Event, yêu cầu thanh toán và quyền VIP được cập nhật trong cùng transaction; khóa hàng yêu cầu và người dùng để tránh cấp trùng hoặc mất ngày gia hạn.
- Khoản sai tiền, sai tài khoản, mã không rõ, quá hạn, người dùng khóa hoặc tắt tự động được lưu `REVIEW`. Khoản chưa khớp không bị gán cho tài khoản bất kỳ.
- Chỉ trả `success: true` khi đã ghi nhận bền vững sự kiện thành công/bỏ qua/chờ đối soát; lỗi lưu trữ trả 503 để nhà cung cấp gửi lại.
- Duyệt thủ công chỉ sử dụng sự kiện ngân hàng đã lưu, khớp mã/tài khoản/số tiền. Cho phép duyệt khoản đến muộn sau khi kiểm tra lại; không duyệt một yêu cầu chỉ vì nó đang `PENDING`.
- Giả lập trong admin chỉ xem trước, không ghi tiền hoặc cấp VIP. Nút hủy giữ bản ghi; không xóa giao dịch đã nhận tiền. Xóa người dùng có lịch sử giao dịch bị từ chối.
- Các điểm kiểm tra quyền công cụ/khóa học đã sửa sử dụng thời hạn VIP hiện tại. Trang khóa học không serialize nội dung/URL bài VIP cho tài khoản chưa có quyền; cập nhật tiến độ cũng kiểm tra quyền bài học.

### Phạm vi chưa hoàn tất

- Chưa kiểm chứng các transaction/khóa hàng trên PostgreSQL thật ở phiên làm việc này.
- Chưa chạy luồng đăng nhập, mua VIP, gia hạn và modal thanh toán với database staging hoặc ngân hàng/provider thật.
- URL video tĩnh đã biết vẫn cần chuyển sang lưu trữ riêng và cơ chế cấp quyền media. Việc lọc DTO không bảo vệ được đường dẫn công khai đã lộ trước đây.
- Chưa có quy trình hoàn tiền hoặc gán thủ công giao dịch không có mã sau khi thu thập chứng từ. Hàng chờ đã hiển thị để đối soát; những khoản này chưa tự cấp VIP.
- Chưa xử lý toàn bộ quota AI, rate limit đăng nhập, khôi phục mật khẩu, dữ liệu phí/thuế, mobile, nội dung mẫu, giám sát và backup của kế hoạch 125 việc.
- Chưa chuyển toàn bộ lịch sử schema sang Prisma migrations; SQL lần này là nâng cấp cộng thêm, tương thích cách vận hành manual SQL hiện tại.

## 2. Thứ tự chuyển đổi môi trường

1. Sao lưu database và xác nhận môi trường staging riêng. Tránh chạy seed hiện tại trên dữ liệu cần giữ.
2. Kiểm tra bảng `SeoSession` đã có. Nếu thiếu, xem [SQL SEO hiện hữu](/D:/AIChoShop/prisma/manual/create_seo_usage.sql) và áp dụng trên staging trước; ứng dụng không có đường xác thực dự phòng khi bảng phiên thiếu.
3. Áp dụng [create_payment_intents.sql](/D:/AIChoShop/prisma/manual/create_payment_intents.sql) trước khi chạy bản ứng dụng mới. File chỉ thêm cột, bảng và chỉ mục; không xóa lịch sử, không tự cấp VIP, không đoán gói cho giao dịch cũ.
4. Chạy `node node_modules/prisma/build/index.js generate`. Đây là tạo client, không thay đổi database.
5. Xác nhận một tài khoản hiện hữu thuộc người quản trị. Công cụ [admin-access.cjs](/D:/AIChoShop/scripts/admin-access.cjs) mặc định chỉ kiểm tra; chỉ cấp quyền khi gọi với `--grant` cho email được chọn rõ ràng:

   ```powershell
   node scripts/admin-access.cjs "email-quan-tri-da-dang-ky@example.com"
   node scripts/admin-access.cjs "email-quan-tri-da-dang-ky@example.com" --grant
   ```

   Thay email ví dụ bằng tài khoản thật đã xác nhận. Công cụ không tạo mật khẩu mặc định, không đổi mật khẩu và không tự chạy khi khởi động. Nếu không có tài khoản ADMIN, không thể dùng lại mật khẩu quản trị chung để truy cập.

6. Kiểm tra đăng nhập user/admin, phiên cũ, đăng xuất, khóa, đổi/reset mật khẩu và phân quyền bằng tài khoản staging. Người chỉ có cookie ID cũ phải đăng nhập lại; phiên ngẫu nhiên hợp lệ đang lưu vẫn được xác minh.
7. Cấu hình tài khoản ngân hàng thật và khóa webhook; cấu hình mới trống mặc định tắt. Khóa để trống trong form giữ nguyên khóa đã lưu. Không có khóa thì không nhận webhook và không tạo checkout.
8. Nếu SePay đang lọc nội dung theo tiền tố `VIP`, cập nhật quy tắc để nhận mã `ACS...`. Webhook gửi `Authorization: Apikey <khóa>`; endpoint cũng hỗ trợ Bearer hoặc `x-api-key` như lớp tương thích.
9. Chạy kiểm thử payment PostgreSQL, rồi E2E staging với callback xác thực. Kiểm tra tiền thiếu/thừa, sai tài khoản, mã khác, ID gửi lại, hai callback đồng thời, tắt tự động, gia hạn, hết hạn và lỗi database.
10. Chỉ phát hành sau khi các bước trên đạt. Giữ nguyên giao dịch cũ thiếu snapshot để đối soát; không backfill giá/thời hạn bằng bảng giá hiện tại. Khi có sự cố, đóng checkout/đưa webhook vào trạng thái retry trong lúc sửa; không quay lại logic cấp VIP cũ thiếu xác thực.

SQL bắt buộc đi trước ứng dụng vì Prisma Client mới có thể đọc cột mới ngay khi tải lịch sử giao dịch, kể cả khi chưa mở modal thanh toán.

## 3. Kiểm chứng đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| Kiểm thử xác thực, cookie giả, role, mật khẩu, thu hồi phiên | 30 đạt |
| Kiểm thử service/webhook thanh toán với transaction double | 16 đạt |
| Kiểm thử chính sách thanh toán, thời hạn VIP, giới hạn body | 7 đạt |
| Bộ test sẵn có cho giá bán, SEO, KOC và thuế | 30 đạt |
| HTTP thật qua Next server: 8 API nhạy cảm với cookie giả | Cả 8 trả 403 |
| HTTP `/admin` với cookie giả | 307 về `/admin-login` |
| HTTP trang admin-login | 200, có trường email |
| TypeScript mã nguồn | 0 lỗi |
| Next.js webpack `--experimental-build-mode compile` | Thành công |
| Lint các module mới và test harness | Đạt; toàn repo còn lỗi lint cũ |
| PostgreSQL integration | Chưa chạy: không có `TEST_DATABASE_URL`, Docker daemon chưa hoạt động |

Kiểm tra compile/HTTP dùng URL database giả trên localhost để tránh chạm dữ liệu thật. Build `compile` chưa bao gồm nghiệm thu prerender/deploy đầy đủ. HTTP ở đây kiểm tra từ chối truy cập và trang đăng nhập, không chứng minh giao dịch hoặc đăng nhập thành công với database thật.

## 4. Chạy lại kiểm thử

```powershell
node --test scripts/test-auth.cjs
node --test scripts/test-payments.cjs
node --experimental-strip-types --test src/lib/payments/policy.test.ts
node --experimental-strip-types --test src/lib/pricing/engine.test.ts src/lib/seo/seo.test.ts src/lib/koc-planner/engine.test.ts src/lib/tax-calculator/engine.test.ts
node scripts/typecheck-source.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

[test-payments-db.cjs](/D:/AIChoShop/scripts/test-payments-db.cjs) chỉ dùng `TEST_DATABASE_URL`, không đọc `DATABASE_URL`. Nó yêu cầu PostgreSQL localhost với tên database kết thúc `_test`, tạo schema ngẫu nhiên riêng, kiểm thử và dọn đúng schema đó. Kiểm thử này bao gồm áp dụng SQL hai lần, checkout đồng thời, callback đồng thời, snapshot khi sửa gói, gia hạn và rollback khi lỗi sau cập nhật User. Không có biến môi trường thì báo SKIP, không được tính là đã đạt.

[test-auth-http.cjs](/D:/AIChoShop/scripts/test-auth-http.cjs) cần Next server cô lập đang chạy tại localhost, mặc định cổng 3127. Server tạm của lần kiểm tra này đã được dừng.
