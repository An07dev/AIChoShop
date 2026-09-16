# Kế hoạch hoàn thiện AIChoShop

> Cập nhật 14/09/2026: đã triển khai đợt mã nguồn đầu tiên cho xác thực và thanh toán. Xem [tiến độ, kiểm chứng và điều kiện chuyển đổi](/D:/AIChoShop/docs/trien-khai-bao-mat-thanh-toan.md). Checklist bên dưới vẫn là tiêu chí nghiệm thu toàn dự án; chưa đánh dấu hoàn thành các mục còn cần database/E2E/production.

> Đợt tiếp theo: xem [quota AI, video và kiểm thử PostgreSQL](/D:/AIChoShop/docs/tien-do-ai-video.md). Chính sách lượt dùng đã được người dùng chấp thuận; các mục còn lại vẫn cần nghiệm thu.

## 1. Mục tiêu và phạm vi

Hoàn thiện phạm vi sản phẩm hiện có: 8 công cụ sinh nội dung AI, 3 công cụ tính toán, khóa học, tài khoản, quản trị và bán quyền VIP. Kế hoạch dựa trên [báo cáo phân tích chuyên sâu](/D:/AIChoShop/docs/phan-tich-chuyen-sau-du-an.md) tại snapshot `627f099`; cần đối chiếu lại phần mã có thay đổi trước khi triển khai từng hạng mục.

“Hoàn thiện” nghĩa là chức năng đúng, quyền truy cập được kiểm tra ở server, giao dịch có thể đối soát, dữ liệu được bảo vệ, giao diện dùng được trên thiết bị mục tiêu, hệ thống có thể triển khai và phục hồi. Không cần xây thêm CRM, đồng bộ shop hoặc microservices để đạt mục tiêu này.

Các checkbox dưới đây là **công việc cần thực hiện, chưa được đánh dấu hoàn thành**. Việc đã phân tích hoặc đã viết probe không có nghĩa lỗi đã được sửa.

### Mức ưu tiên

| Mức | Ý nghĩa | Nhóm việc |
|---|---|---|
| P0 | Chặn rủi ro trực tiếp trước khi mở chức năng nhạy cảm ra Internet | Session, API key, quyền quản trị, webhook, cấp VIP sai tiền |
| P1 | Bắt buộc trước khi vận hành trả phí đáng tin cậy | Toàn vẹn giao dịch, nội dung VIP, quota, thuế, dữ liệu, backup và release |
| P2 | Hoàn thiện trải nghiệm và bảo trì trong phạm vi hiện tại | Mobile, nội dung thật, parser, hiệu năng, báo cáo, thao tác quản trị |
| Sau phát hành | Mở rộng dựa trên nhu cầu đã đo | OAuth sàn, gửi tin thật, video AI, cộng tác nhiều shop |

Mức ưu tiên biểu thị thứ tự xử lý rủi ro, không có nghĩa được bỏ qua P2 nếu đang giới thiệu chức năng đó cho khách. Một nút chức năng chưa làm phải được hoàn thiện hoặc bỏ khỏi giao diện.

## 2. Quyết định sản phẩm cần chốt

Đây là các quyết định làm đầu vào cho thiết kế, không phải lý do trì hoãn việc vá các lỗi P0 đã rõ. Có thể chuẩn bị cấu trúc hỗ trợ nhiều chính sách trong khi chốt giá trị kinh doanh cuối cùng.

- [ ] **SP-01 — Ma trận công cụ và gói.** Liệt kê từng công cụ: khách dùng được không, Free được bao nhiêu, VIP có thêm quyền gì, có xuất file/lịch sử không. Quyết định dứt điểm các nhãn VIP đang không khớp page.
- [ ] **SP-02 — Định nghĩa lượt sử dụng.** Đề xuất: một kết quả AI hợp lệ mới tính một lượt; lỗi không tính. Phép tính giá/thuế/KOC và việc xem lịch sử là hoạt động riêng, không tự động trừ lượt provider.
- [ ] **SP-03 — Chính sách dùng thử.** Chọn hai kết quả theo trình duyệt hay cơ chế tài khoản; ghi rõ giới hạn thực tế. Quyết định cách hạn chế việc tạo danh tính thử hàng loạt.
- [ ] **SP-04 — VIP và quyền học.** Chốt tháng/năm/trọn đời, gia hạn từ thời điểm nào, xử lý VIP hết hạn, đang trọn đời mua thêm, gói ngừng bán, hoàn tiền và thu hồi quyền.
- [ ] **SP-05 — Cam kết “không giới hạn”.** Chốt fair-use hoặc hạn mức bảo vệ ngân sách, thông báo khi dịch vụ quá tải, và cơ chế chống lạm dụng. Không bán cam kết vượt khả năng vận hành đã đo.
- [ ] **SP-06 — Thông tin kinh doanh thật.** Xác nhận tài khoản nhận tiền, chủ tài khoản, tên đơn vị, kênh hỗ trợ, bảng giá, chính sách hoàn tiền và nội dung khóa học đưa vào bán.
- [ ] **SP-07 — Phạm vi phát hành.** Công bố rõ: công cụ soạn bản nháp, tính toán và học tập. Chưa quảng cáo tính năng tự đăng bài, gửi Zalo hoặc xử lý video thật khi chưa có tích hợp.

**Đầu ra nghiệm thu:** một bảng chính sách duy nhất có phiên bản, được UI và backend cùng sử dụng; mọi mô tả gói/công cụ khớp bảng này.

## 3. Nền tảng phát triển và môi trường

- [ ] **ENV-01 — Tách môi trường.** Có local, test/staging và production với database, khóa AI, webhook, storage riêng. Gắn rõ môi trường trong giao diện admin để tránh thao tác nhầm.
- [ ] **ENV-02 — Chuẩn hóa cấu hình.** Liệt kê biến môi trường bắt buộc/tùy chọn, kiểm tra khi khởi động, ghi lỗi rõ nhưng không in bí mật. Loại bỏ fallback có thể bật quyền hoặc thanh toán khi cấu hình lỗi.
- [ ] **ENV-03 — Làm sạch dữ liệu sinh.** Tái sinh types `.next` bằng quy trình phù hợp phiên bản Next.js, kiểm tra lại route đã xóa. Không sửa file generated bằng tay để che lỗi.
- [ ] **ENV-04 — Dựng lại từ lockfile.** Ghim môi trường Node phù hợp, giữ lockfile, khai báo runtime script cần dùng như tsx nếu tiếp tục dùng. Cài từ checkout sạch phải chạy được các lệnh đã tài liệu hóa.
- [ ] **ENV-05 — Bảo vệ dữ liệu trước migration.** Kiểm kê schema thực, dữ liệu quan trọng, số lượng bản ghi và backup trước thay đổi. Không chạy seed xóa dữ liệu trên môi trường đang phục vụ khách.

**Nghiệm thu:** một người khác có thể dựng staging từ tài liệu và checkout sạch; không cần tìm credential trong mã; staging không ghi dữ liệu production.

## 4. Xác thực và bảo mật tài khoản — P0/P1

Phần mã chính: [auth actions](/D:/AIChoShop/src/app/actions/auth.ts), [profile actions](/D:/AIChoShop/src/app/actions/profile.ts), [admin login](/D:/AIChoShop/src/app/admin-login/actions.ts), [middleware](/D:/AIChoShop/src/middleware.ts), [SEO identity](/D:/AIChoShop/src/lib/seo/usage.ts).

- [ ] **AUTH-01 — Thay session user.** Bỏ việc coi `user_token=user.id` là đăng nhập. Dùng session khó đoán, server xác minh, có expiresAt/revokedAt/userId; hoặc thư viện xác thực có cơ chế tương đương.
- [ ] **AUTH-02 — Thay session admin.** Bỏ cookie chuỗi cố định. Admin là tài khoản được xác minh và có vai trò phù hợp; không dùng một mật khẩu chung làm toàn bộ mô hình quyền.
- [ ] **AUTH-03 — Thống nhất SEO.** Bỏ fallback nhận dạng từ cookie ID cũ. Đưa SEO về session chung; cập nhật tài liệu cho đúng mã.
- [ ] **AUTH-04 — Guard dùng chung.** Tạo lớp xác minh session/user/locked/role/entitlement, sử dụng trong mọi API và Server Action nhạy cảm. Middleware/proxy chỉ hỗ trợ điều hướng, không thay kiểm tra quyền tại dữ liệu.
- [ ] **AUTH-05 — Mật khẩu.** Chuyển user/admin sang thuật toán băm mật khẩu chuyên dụng với salt. Có lộ trình đọc hash cũ và nâng cấp sau đăng nhập hợp lệ hoặc reset có kiểm soát.
- [ ] **AUTH-06 — Thu hồi phiên.** Logout xóa phiên hiện tại; đổi/reset mật khẩu và khóa tài khoản có chính sách vô hiệu hóa phiên. Nút “Thoát Admin” thực hiện logout thật.
- [ ] **AUTH-07 — Chuẩn hóa danh tính.** Thống nhất email trim/hoa thường, phone, kiểm tra dữ liệu trùng và ràng buộc phù hợp. Đăng ký, admin tạo user, đăng nhập và thanh toán dùng cùng quy tắc.
- [ ] **AUTH-08 — Validation server.** Kiểm tra kiểu, độ dài và trường bắt buộc tại server, không chỉ form HTML. Không chấp nhận mật khẩu ngắn khi gọi action trực tiếp.
- [ ] **AUTH-09 — Chống thử đăng nhập.** Hạn chế tốc độ theo tài khoản và tín hiệu đáng tin từ hạ tầng; không dựa hoàn toàn vào header IP client tự gửi. Thông báo không làm lộ tài khoản tồn tại.
- [ ] **AUTH-10 — Khôi phục tài khoản.** Làm luồng quên mật khẩu thực, token một lần có hạn, hoặc quy trình hỗ trợ thủ công rõ ràng; bỏ link placeholder. Xác minh email nếu dùng email làm danh tính/khôi phục tài khoản.
- [ ] **AUTH-11 — Session trên trình duyệt.** Cấu hình HttpOnly, Secure, SameSite và thời hạn phù hợp; kiểm tra origin/CSRF cho đường mutation cần thiết. Tránh cache response chứa dữ liệu riêng giữa hai người dùng.

**Nghiệm thu:** guest/cookie tự đặt/phiên hết hạn/phiên thu hồi/tài khoản khóa không truy cập được dữ liệu riêng; user thường không gọi được mutation admin; ID người khác không làm đổi danh tính.

## 5. API, bí mật và quyền quản trị — P0/P1

Phần mã chính: [settings API](/D:/AIChoShop/src/app/api/settings/openai/route.ts), [VIP API](/D:/AIChoShop/src/app/api/vip-plans/route.ts), [admin actions](/D:/AIChoShop/src/app/admin), [system settings](/D:/AIChoShop/src/lib/system-settings.ts).

- [ ] **SEC-01 — Khóa API cấu hình AI.** Chỉ admin hợp lệ được sửa; không trả key nguyên văn cho client chỉ cần trạng thái cấu hình. Thay response bằng configured/provider/model và phần che khi cần.
- [ ] **SEC-02 — Khóa CRUD gói VIP.** Áp dụng guard cho POST/PUT/PATCH/DELETE; GET công khai chỉ trả trường cần thiết của gói đang bán. Chức năng `all` dành cho admin nếu chứa dữ liệu quản trị.
- [ ] **SEC-03 — Kiểm tra từng action admin.** Bảo vệ tạo/xóa/khóa user, reset mật khẩu, sửa bài học, cấu hình phí, đổi gói, duyệt/xóa giao dịch và mô phỏng webhook.
- [ ] **SEC-04 — Xử lý credential mẫu.** Xác minh credential trong `.env.example`; nếu là bí mật thật còn dùng, thay ở dịch vụ nguồn và cập nhật môi trường. Thay mẫu bằng placeholder; đánh giá nơi từng chia sẻ và lịch sử Git khi cần.
- [ ] **SEC-05 — Bỏ mật khẩu mặc định/fallback.** Chỉ có quy trình bootstrap admin rõ ràng; DB lỗi không dẫn đến đăng nhập bằng mật khẩu viết cứng.
- [ ] **SEC-06 — Bảo vệ provider endpoint.** Chốt endpoint được phép, quyền đổi endpoint, scheme và đích truy cập. Thay đổi cấu hình phải được audit để biết ai thay, lúc nào; không ghi key vào audit.
- [ ] **SEC-07 — Hợp đồng API.** Mỗi endpoint có schema request/response, giới hạn body, mã lỗi và trạng thái HTTP rõ. Không gửi stack trace/raw provider error có thể chứa bí mật cho client.
- [ ] **SEC-08 — Audit quản trị.** Lưu actor, target, thao tác, thời điểm, kết quả và thay đổi cần thiết cho các mutation nhạy cảm. Có chính sách che dữ liệu và quyền xem audit.
- [ ] **SEC-09 — Quyền thao tác đặc biệt.** Chặn tự xóa/hạ quyền admin cuối cùng; cân nhắc xác minh lại danh tính trước đổi key, reset người khác hoặc xử lý giao dịch.

**Nghiệm thu:** ma trận guest/user/admin kiểm tra cả API trực tiếp và Server Actions; không có key thật trong response công khai, log thường hoặc mẫu cấu hình.

## 6. Thanh toán, giao dịch và VIP — P0/P1

Phần mã chính: [webhook](/D:/AIChoShop/src/app/api/webhooks/sepay/route.ts), [sepay-server](/D:/AIChoShop/src/lib/sepay-server.ts), [profile](/D:/AIChoShop/src/app/(app)/profile/ProfileClient.tsx), [admin SePay](/D:/AIChoShop/src/app/admin/sepay/actions.ts), [schema](/D:/AIChoShop/prisma/schema.prisma).

- [ ] **PAY-01 — Tạo payment intent.** Client chỉ gửi planId; server kiểm tra gói, chụp lại giá/currency/thời hạn và tạo mã thanh toán duy nhất gắn user. Không nhận giá client làm giá chính thức.
- [ ] **PAY-02 — QR theo intent.** QR dùng số tiền và mã intent do server trả; có hạn thanh toán và trạng thái. Không dùng tên/phone/email prefix làm định danh chính của khoản tiền.
- [ ] **PAY-03 — Webhook bắt buộc xác thực.** Thiếu/sai cấu hình hoặc key không dẫn đến xử lý nâng cấp. Nếu triển khai phương thức chữ ký, xác minh đúng payload và quy tắc provider.
- [ ] **PAY-04 — Kiểm tra payload.** Bắt buộc ID sự kiện hợp lệ, hướng tiền vào, tài khoản nhận đúng, số tiền hợp lệ và mã intent đúng. Phân biệt lỗi request với giao dịch cần đối soát.
- [ ] **PAY-05 — Xóa fallback cấp VIP theo đoán tiền.** Bỏ nhánh dưới giá gói vẫn cấp 30 ngày; không tự chọn lifetime từ ngưỡng tiền viết cứng. Thiếu/thừa/không khớp đi vào quy trình đã chốt.
- [ ] **PAY-06 — Chống trùng ở database.** Có unique provider/eventId, xử lý cả sự kiện lặp tuần tự và đồng thời. Kiểm tra bằng `findFirst` trước mutation không đủ.
- [ ] **PAY-07 — Atomic settlement.** Nhận event, khóa intent, cập nhật thanh toán và cấp entitlement trong transaction phù hợp. Retry sau crash không cấp quyền lần hai.
- [ ] **PAY-08 — Trạng thái rõ ràng.** Dùng tập trạng thái có ràng buộc: pending, paid, expired, needs_review, refunded/cancelled theo nghiệp vụ. Không cho chuyển trạng thái tùy tiện bằng dữ liệu client.
- [ ] **PAY-09 — Đối soát không đoán user.** Giao dịch chưa xác định không gán tạm vào admin/user đầu tiên. Admin có màn hình gán đúng intent/user, kèm lý do và audit.
- [ ] **PAY-10 — Acknowledge/retry.** Chỉ acknowledge sau khi đã nhận event bền vững; sự kiện lặp trả thành công nhất quán. Nhánh đối soát đã lưu không tạo thêm PENDING ở mỗi lần retry.
- [ ] **PAY-11 — Duyệt thủ công an toàn.** Chặn duyệt lặp, kiểm tra trạng thái và quyền; cấp entitlement qua cùng service của webhook. Không có công thức VIP riêng ở action duyệt.
- [ ] **PAY-12 — Tách dữ liệu mô phỏng.** Simulator chỉ chạy sandbox hoặc có loại sự kiện test không đi vào doanh thu thật. Không dùng nút “test” để nâng VIP thật mà không nhận biết.
- [ ] **PAY-13 — Theo dõi thanh toán chính xác.** Profile polling trạng thái intent thay vì chỉ isVIP; có timeout/backoff, hủy polling và thông báo mạng. Gia hạn của người đang VIP cũng được xác nhận đúng.
- [ ] **PAY-14 — Hết hạn và gia hạn.** Mọi điểm truy cập tính quyền từ expiresAt. Cron/dọn dữ liệu chỉ hỗ trợ vận hành. Test gói tháng/năm/trọn đời, hết hạn, gia hạn trước/sau hết hạn và gói ngừng bán.
- [ ] **PAY-15 — Sổ giao dịch.** Lưu paidAt, provider reference, snapshot gói, điều chỉnh/hoàn tiền và người xử lý. Không xóa giao dịch thật để làm sạch dashboard.

**Nghiệm thu:** 1 đồng/sai tài khoản/sai key không cấp VIP; cùng một event đến nhiều lần chỉ ghi nhận một lần; lỗi DB giữa các bước không tạo quyền và giao dịch mâu thuẫn; thay giá gói không làm đổi intent đã tạo.

## 7. AI, quota và chất lượng đầu ra — P1

Phần mã chính: [API AI](/D:/AIChoShop/src/app/api/ai/route.ts), [SEO](/D:/AIChoShop/src/lib/seo), [usage](/D:/AIChoShop/src/lib/ai-usage.ts), [gate](/D:/AIChoShop/src/hooks/useToolGate.tsx), [output components](/D:/AIChoShop/src/components/tools).

- [ ] **AI-01 — Catalog công cụ dùng chung.** Lưu slug, tên, input schema, output schema, quyền, hạn mức, khả năng export và provider capability. Menu/page/server lấy từ cùng nguồn.
- [ ] **AI-02 — Enforce quyền tại server.** Mỗi generation kiểm tra session, locked, VIP còn hạn và quyền tool. UI gate chỉ giải thích và hướng người dùng đăng nhập/nâng cấp.
- [ ] **AI-03 — Tách ba bảng/khái niệm.** Activity log cho lịch sử thao tác; generation record cho mỗi lần gọi provider; quota ledger cho giữ/chốt/hoàn lượt. Client không tự ghi quota provider.
- [ ] **AI-04 — Quota nguyên tử.** Reserve trước gọi, commit khi output hợp lệ, release khi lỗi. Chặn vượt hạn mức khi gọi nhiều tool đồng thời; định nghĩa ngày theo múi giờ Việt Nam.
- [ ] **AI-05 — Sửa giá trị 0 và fallback.** Hạn mức 0 phải giữ là 0. DB/quota lỗi phải có hành vi rõ, không mặc định mở lượt không kiểm soát.
- [ ] **AI-06 — Sửa lượt thử UI.** Không trừ lượt khi mở trang, nhập thiếu hoặc provider lỗi. Không để bộ đếm local khóa SEO khác với số thành công server.
- [ ] **AI-07 — Hạn chế tài nguyên.** Giới hạn body/field/image, request rate và concurrency; thống nhất cả route SEO chính và route legacy. Bảo vệ ngân sách toàn hệ thống ngoài quota mỗi user.
- [ ] **AI-08 — Service gọi provider.** Tách prompt từng tool khỏi route lớn; thống nhất timeout, retry giới hạn, cancellation, model/capability và cờ ngừng AI. Phân biệt chọn Ollama với tắt dịch vụ.
- [ ] **AI-09 — Kiểm tra completion.** Reject/repair theo policy khi rỗng, bị cắt, refusal, JSON sai hoặc thiếu phần. Không báo thành công và trừ lượt cho output không sử dụng được.
- [ ] **AI-10 — Chuẩn hóa output.** Chuyển dần các parser Markdown nhạy định dạng sang dữ liệu có schema; render văn bản an toàn. Copy/export phải dùng cùng snapshot đã tạo.
- [ ] **AI-11 — Kiểm soát nội dung bịa.** Prompt chỉ dùng dữ liệu đã nhập, không tự thêm voucher, trải nghiệm, bảo hành, chứng nhận hoặc cam kết hiệu quả. Tách gợi ý giả định khỏi nội dung được xác nhận.
- [ ] **AI-12 — Bộ đánh giá tiếng Việt.** Có fixture thật đã khử dữ liệu nhạy cảm cho từng tool; đánh giá đủ cấu trúc, chính xác input, ngôn ngữ, tính sử dụng được và trường hợp lỗi.
- [ ] **AI-13 — Đo chi phí.** Ghi provider/model/token/latency/status/requestId; có bảng giá phiên bản hoặc cơ chế đối soát bill. Theo dõi chi phí theo user/tool/gói và cảnh báo ngân sách.
- [ ] **AI-14 — Lịch sử có kiểm soát.** Giới hạn lưu ảnh/base64, kích thước nội dung và thời gian giữ; không đưa key hoặc toàn bộ lỗi provider vào lịch sử người dùng.

**Nghiệm thu:** một lượt chỉ bị trừ khi đúng policy; provider lỗi không gây hụt lượt; Free không gọi tool VIP bằng API trực tiếp; output cắt/rỗng không được hiển thị như kết quả hoàn chỉnh.

## 8. Giá bán, thuế và KOC — P1/P2

### Giá bán

- [x] **CALC-01 — Sửa gợi ý ngành.** Không khớp phải trả null; hiển thị độ chắc chắn và cho chọn thủ công. Chuỗi vô nghĩa không tự ra “Laptop”.
- [x] **CALC-02 — Quản trị biểu phí.** Mỗi tập phí có nguồn, ngày hiệu lực, ngày đối chiếu, phạm vi shop và chương trình. Kiểm chứng các mức thực sự dùng khi phát hành, không chỉ dựa nhãn “official”.
- [x] **CALC-03 — Fee resolver dùng chung.** Áp dụng cùng thứ tự ưu tiên dữ liệu tích hợp/admin override/manual input cho pricing, bulk và KOC. Snapshot lưu mức phí và version đã sử dụng.
- [x] **CALC-04 — Validation đầy đủ.** Chặn NaN/Infinity, số âm không hợp lệ, phần trăm ngoài miền, số lượng không hợp lệ, target/rounding sai. Kiểm tra kết quả solver vẫn đạt mục tiêu sau làm tròn.
- [x] **CALC-05 — CSV/XLSX.** Parser hỗ trợ dấu nháy, dấu phẩy, ô xuống dòng, BOM và định dạng số; báo lỗi theo dòng. Bảo vệ export khỏi formula injection; giới hạn file/dòng để không treo trình duyệt.
- [x] **CALC-06 — Phí có thời gian hiệu lực.** Chặn khoảng ngày ngược, định nghĩa chồng lấn, hiển thị nguồn đang áp dụng và cảnh báo biểu phí cũ. Không để phí admin thay đổi mà KOC vẫn âm thầm dùng mặc định.

### Thuế

- [x] **TAX-01 — Bổ sung nhánh doanh nghiệp nhỏ.** Mô hình hóa điều kiện miễn TNDN được nêu trong báo cáo; không miễn nhầm GTGT hoặc tự kết luận chỉ dựa doanh thu hiện tại.
- [x] **TAX-02 — Điều kiện giảm thuế.** Bổ sung hoặc nêu rõ các giả định về cư trú, chia/tách, liên kết, doanh thu tham chiếu và ưu đãi khác. Checkbox không thay toàn bộ kiểm tra điều kiện.
- [x] **TAX-03 — Phạm vi kỳ thuế.** Chỉ cho chọn năm được hỗ trợ hoặc tải bộ quy tắc theo năm; không áp một ngưỡng viết cứng cho mọi năm.
- [x] **TAX-04 — Đa hoạt động/doanh thu.** Làm rõ doanh thu từng ngành, tổng doanh thu, chi phí/thu nhập khác, khấu trừ và nộp thừa; không gộp khác thuế suất thành một tỷ lệ mà không cảnh báo.
- [ ] **TAX-05 — Nghiệm thu nghiệp vụ.** Đã có bộ ca boundary, liên kết căn cứ và version kết quả trong [hồ sơ nghiệm thu thuế 2026](./nghiem-thu-thue-2026.md); còn cần chữ ký đối chiếu của người phụ trách thuế/kế toán trước khi coi kết quả là căn cứ kê khai.

### KOC

- [x] **KOC-01 — Nhất quán công thức.** Đối chiếu CPA hòa vốn, chi phí giữ lại khi hoàn, affiliate và thuế với pricing. Kiểm tra số tiền giải ngân/tiền ròng và vốn chiến dịch không bị tính trùng.
- [x] **KOC-02 — Làm rõ dự phóng.** Gắn nhãn giả định cho CPA, đơn/KOC, tỷ lệ hiệu quả; đưa kịch bản thận trọng/cơ sở/thuận lợi và giải thích biến tác động mạnh.
- [x] **KOC-03 — Luồng liên thông.** Đọc hồ sơ sản phẩm/lịch sử pricing có quyền và phiên bản; không âm thầm dùng snapshot cũ hoặc dữ liệu của tài khoản khác. Xem [hồ sơ nghiệm thu KOC](./nghiem-thu-koc.md).

**Nghiệm thu:** có bộ kết quả chuẩn có thể giải thích; cùng input/phiên bản phí cho cùng output; import/export không đổi nghĩa số; các ngoại lệ thuế đã được biểu diễn hoặc giới hạn minh bạch.

## 9. Khóa học và video — P1/P2

- [x] **LEARN-01 — DTO danh mục.** Guest/Free chỉ nhận metadata và phần nội dung được quyền xem; không serialize nội dung hoặc URL video VIP.
- [x] **LEARN-02 — Phát video có quyền.** Media nội bộ được phát qua route kiểm tra session/quyền ở mỗi request và hỗ trợ Range; URL YouTube/Vimeo được ghi rõ là nguồn công khai, không giả là video riêng tư.
- [ ] **LEARN-03 — Hoàn thiện nội dung thật.** Thay video/nội dung placeholder, kiểm tra số bài, module và thứ tự; không quảng cáo 27 bài nếu catalog thực không tương ứng.
- [x] **LEARN-04 — CRUD bài học/khóa học.** Validate title, courseId, order, module, URL và quyền. Đổi thứ tự/trạng thái bài cập nhật đúng các trang courses/learn.
- [x] **LEARN-05 — Tiến độ.** Chỉ user hợp lệ ghi tiến độ bài được phép; lưu hoàn thành, thời điểm và vị trí video trực tiếp để tiếp tục sau refresh.
- [x] **LEARN-06 — Sửa Hooks và trạng thái trống.** Không gọi hook sau early return; khóa không có bài, bài đã xóa, video không phát đều có UI xử lý.
- [x] **LEARN-07 — Upload.** Admin guard, giới hạn 100 MiB, MIME/chữ ký, tên ngẫu nhiên, ghi file theo stream, ownership, trạng thái gắn/mồ côi và thao tác dọn file không dùng.

**Nghiệm thu:** tài khoản không có quyền không lấy được nội dung VIP qua response hoặc URL; khóa trống/có bài chuyển qua lại không lỗi; video thật phát trên thiết bị mục tiêu.

## 10. Dữ liệu, lưu trữ và quản trị — P1/P2

- [x] **DATA-01 — Migration có phiên bản.** Chuyển thay đổi schema/SQL thủ công sang quy trình migration phù hợp dữ liệu hiện có; thử upgrade trên bản sao và có kế hoạch phục hồi.
- [x] **DATA-02 — Seed an toàn.** Tách dữ liệu demo khỏi bootstrap production; không mặc định xóa Course/Lesson. Sửa moduleName và tránh thao tác phá lịch sử tiến độ.
- [x] **DATA-03 — Bỏ ghi ngầm trong get/render.** Khởi tạo settings/gói mặc định qua setup rõ ràng; không tạo dữ liệu hoặc hạ VIP vì người dùng mở trang.
- [ ] **DATA-04 — Chuẩn hóa truy cập DB.** Giảm any và fallback SQL lặp; phân biệt lỗi dữ liệu, lỗi schema và mất kết nối. Không che lỗi bằng trả số liệu/quyền giả định.
- [ ] **DATA-05 — Constraint/index.** Thêm unique event, trạng thái và ràng buộc cần thiết; kiểm tra index theo truy vấn user/status/time, course/order và usage. Dùng EXPLAIN với dữ liệu đại diện để chọn index.
- [ ] **DATA-06 — Lịch sử riêng từng user.** Quyết định local/server là nguồn chính; namespace local theo tài khoản, xử lý logout/đổi tài khoản và giới hạn dung lượng. Có version/migration cho snapshot.
- [ ] **DATA-07 — Quyền riêng tư.** Chốt dữ liệu gửi provider, lưu bao lâu, ai đọc được, cách xóa/xuất dữ liệu. Không lưu ảnh base64 hoặc PII trong log lâu hơn mục đích cần thiết.
- [ ] **ADMIN-01 — Phân trang/lọc server.** Users, lessons, transactions và usage có pagination/filter/sort rõ. Tránh tải mọi bản ghi xuống trình duyệt.
- [ ] **ADMIN-02 — Thao tác có trạng thái.** Chặn double submit, xác nhận thao tác xóa/ghi đè, báo lỗi cụ thể; refresh không để props và state cũ mâu thuẫn.
- [ ] **ADMIN-03 — Báo cáo đúng định nghĩa.** Doanh thu theo paidAt, tách sandbox/refund/pending; tăng trưởng VIP theo sự kiện cấp quyền; ARPU/cohort có kỳ và mẫu số rõ.
- [ ] **ADMIN-04 — Cấu hình gói ổn định.** Validate giá, thời hạn, slug, active/popular, snapshot intent cũ; ngừng bán toàn bộ gói không tự làm xuất hiện gói mặc định ngoài ý muốn.

**Nghiệm thu:** dữ liệu user A không xuất hiện ở user B; admin truy vết được thao tác; số liệu doanh thu khớp giao dịch đối soát; deploy không tự seed/xóa nội dung thật.

## 11. Giao diện, nội dung và trải nghiệm — P2

- [ ] **UX-01 — Điều hướng mobile.** Sidebar đóng/mở hoặc navigation phù hợp cho user và admin; không chiếm phần lớn màn hình hẹp. Test ít nhất 360/390/768/1440 px.
- [ ] **UX-02 — Form/modal.** Reset loading đúng khi đóng/mở lại, try/finally, chống gửi đôi; focus, Escape, label, dialog semantics và thao tác bàn phím.
- [ ] **UX-03 — Tìm kiếm/thông báo.** Nối chức năng thật hoặc bỏ control chưa hoạt động. Không để nút trang trí trông như tính năng đang sẵn sàng.
- [ ] **UX-04 — Trạng thái đầy đủ.** Loading, empty, validation error, network error, unauthorized, quota hết, timeout và success thống nhất; giữ input khi lỗi.
- [ ] **UX-05 — Quyền Free/VIP thống nhất.** Danh mục, landing, page, modal và server lấy cùng policy. Có giải thích giới hạn trước khi người dùng tốn công nhập dữ liệu.
- [ ] **UX-06 — Copy/export/history.** Nút có phản hồi thật, lỗi clipboard được xử lý; snapshot không lẫn input mới với output cũ; tải lại lịch sử được.
- [ ] **UX-07 — Nội dung công khai thật.** Sửa 8/11 công cụ, 25/27 bài, mô tả video/AI, địa chỉ/hotline và số liệu marketing chưa có nguồn. Không hứa tự động gửi/đăng hoặc hiệu quả chưa được đo.
- [ ] **UX-08 — Các trang hỗ trợ.** Hoàn thiện trợ giúp, hướng dẫn thanh toán, điều khoản, quyền riêng tư và liên hệ; URL thật thay `#`. Nội dung cần phản ánh cách thu thập dữ liệu và cung cấp dịch vụ thực tế.
- [ ] **UX-09 — Theme/design system.** Dùng token màu, khoảng cách, typography và component chung; giảm selector toàn cục/!important. Giữ màu lỗi/cảnh báo/thành công có nghĩa.
- [ ] **UX-10 — Khả năng tiếp cận.** Contrast, focus visible, tên nút icon, alt ảnh, bảng rộng, giảm chuyển động và thao tác không cần chuột; test công cụ kết hợp kiểm tra tay.
- [ ] **UX-11 — SEO website.** Metadata/canonical/sitemap/robots phù hợp trang công khai, không index dữ liệu riêng/admin; OG và lỗi 404. Đây là SEO của website, khác tool sinh nội dung SEO.

**Nghiệm thu:** người mới có thể tìm tool → nhập → nhận/xuất kết quả → đăng ký → mua VIP → học bài trên điện thoại mà không gặp control chết hoặc trạng thái mâu thuẫn.

## 12. Hiệu năng, vận hành và phát hành — P1/P2

- [ ] **OPS-01 — Đo baseline.** Đo bundle, thời gian trang, query, latency AI và mức RAM trước tối ưu; tách số đo local/staging/production.
- [ ] **OPS-02 — Giảm truy vấn/payload.** DTO tối thiểu, gộp lookup user trong một request, aggregate chart trên server, phân trang. Cache chỉ phần công khai theo version, tránh cache lẫn user.
- [ ] **OPS-03 — Tính toán hàng loạt.** Benchmark CSV 100/1.000 dòng, index ngành, chia dữ liệu phí/lazy load; dùng worker khi số đo cho thấy cần. Không mặc định thêm worker/queue chỉ vì ứng dụng có AI.
- [ ] **OPS-04 — Storage bền vững.** Media ngoài Git/local ephemeral disk; lifecycle, quyền đọc/ghi và quy trình migration file hiện có. Không xóa file đang dùng trước khi đối chiếu reference.
- [ ] **OPS-05 — Observability.** RequestId, lỗi có phân loại, metric provider/DB/quota/payment; log che bí mật. Cảnh báo webhook lỗi, chi phí tăng, lỗi đăng nhập bất thường và dung lượng.
- [ ] **OPS-06 — Health và recovery.** Readiness/liveness phù hợp, timeout DB/provider, hành vi khi dependency lỗi. Không trả cấu hình ngân hàng hoặc mật khẩu mặc định khi hệ thống lỗi.
- [ ] **OPS-07 — Backup/restore.** Backup DB và media, kiểm tra restore vào môi trường riêng; chốt RPO/RTO theo nhu cầu kinh doanh. Backup chưa thử restore không đủ nghiệm thu.
- [ ] **OPS-08 — Pipeline CI.** Cài từ lockfile, lint theo policy, typecheck, unit/integration test và build; không cho merge/release nếu kiểm tra bắt buộc thất bại.
- [ ] **OPS-09 — Kiểm tra dependency.** Rà advisory của package thực cài và độ ảnh hưởng đường sử dụng; nâng có kiểm thử, không đổi tất cả phiên bản cùng lúc. Dọn dependency/helper không dùng sau xác minh import.
- [ ] **OPS-10 — Release và rollback.** HTTPS/domain/env/proxy, migration tương thích, asset storage và font được thử; có smoke test sau deploy và cách rollback code/dữ liệu theo từng thay đổi.
- [ ] **OPS-11 — Runbook.** Hướng dẫn setup, deploy, đổi key, lỗi AI, đối soát chuyển khoản, user mất quyền, backup/restore và xử lý dữ liệu. Thay README mẫu bằng tài liệu dự án.

**Nghiệm thu:** build từ checkout sạch đạt; staging chạy đúng với cấu hình riêng; có release thử, smoke test và restore thực; lỗi payment/provider có thể được phát hiện và xử lý bằng runbook.

## 13. Kiểm thử bắt buộc và cổng nghiệm thu

### Bộ kiểm thử cần có

- [ ] **QA-01 — Chuyển probe thành regression.** 9 probe trong báo cáo hiện xác nhận hành vi sai; sau sửa, test phải kỳ vọng từ chối/đúng nghiệp vụ, không tiếp tục coi hành vi cũ là kết quả cần đạt.
- [ ] **QA-02 — Auth/API matrix.** Guest, user Free, VIP còn hạn, VIP hết hạn, locked và admin cho mọi endpoint/action nhạy cảm. Gọi trực tiếp HTTP, không chỉ bấm UI.
- [ ] **QA-03 — Payment integration.** Database test thật: event trùng/đồng thời, crash/retry, thiếu tiền, sai account, thiếu key, hai người cùng số tiền, đổi gói và gia hạn.
- [ ] **QA-04 — Quota integration.** Gọi nhiều tool cùng lúc, limit 0, giao ngày Việt Nam, lỗi log/provider, rollback; kiểm tra usage và tiền provider không bị đếm mâu thuẫn.
- [ ] **QA-05 — Bộ ca engine.** Bổ sung trường hợp nêu ở pricing/tax/KOC; test dữ liệu đầu vào biên và đối chiếu nghiệp vụ. Giữ 30 test hiện có khi vẫn đúng policy.
- [ ] **QA-06 — E2E hành trình.** Đăng ký/đăng nhập, dùng thử, hết quota, thanh toán sandbox, nhận VIP, học bài, gia hạn, logout, đổi mật khẩu, khóa tài khoản.
- [ ] **QA-07 — UI/thiết bị.** Mobile/desktop, sáng/tối, keyboard, modal mở lại, khóa học trống, mất mạng và dữ liệu lịch sử.
- [ ] **QA-08 — Dữ liệu riêng và media.** Guest không nhận bài VIP; user A không đọc log/history của B; URL video hết hạn hoặc không có quyền bị từ chối theo thiết kế.
- [ ] **QA-09 — Dựng mới/nâng cấp.** Cài mới staging, migration từ snapshot có dữ liệu, build sạch, backup/restore và rollback được kiểm tra.
- [ ] **QA-10 — Pilot giới hạn.** Cho nhóm người dùng đại diện hoàn thành công việc thực; đo thời gian, lỗi, chất lượng AI và nhu cầu hỗ trợ; xử lý lỗi chặn trước mở rộng.

### Các cổng phát hành

| Cổng | Điều kiện phải đạt | Không dùng làm bằng chứng thay thế |
|---|---|---|
| G1 — An toàn truy cập | Session và guard thật; không lộ key; khóa VIP/server; upload được bảo vệ | Trang login hiển thị đẹp hoặc middleware redirect |
| G2 — Tiền và quyền | Payment intent/event, atomic/idempotent, đối soát, hết hạn/gia hạn đúng | Một lần chuyển khoản thành công thủ công |
| G3 — Giá trị chức năng | Policy thống nhất, AI hợp lệ, engine đúng phạm vi, bài học thật | Có đủ menu hoặc unit test chỉ kiểm tra công thức cũ |
| G4 — Khả năng sử dụng | E2E/thiết bị mục tiêu đạt; không control chết; dữ liệu riêng tách biệt | Chỉ xem screenshot desktop |
| G5 — Vận hành | Build sạch, CI, staging, backup/restore, monitoring và runbook | Chạy được trên máy phát triển |

## 14. Thứ tự triển khai và phụ thuộc

1. **Chuẩn bị môi trường và policy tối thiểu.** ENV-01 đến ENV-05; chốt SP-01/SP-02/SP-04. Đồng thời chuẩn bị bản vá P0, không chờ tất cả quyết định marketing.
2. **Xây session và guard chung.** AUTH-01 đến AUTH-06; áp vào settings/VIP/admin/upload và dữ liệu bài học. Xử lý bí mật mẫu nếu là key thật.
3. **Thiết kế schema thanh toán và entitlement.** Migration payment intent/event, snapshot, trạng thái, unique. Sau đó sửa webhook, duyệt tay và profile theo cùng service.
4. **Làm quota và AI orchestration.** Enforce tool policy, quota ledger, error/output handling; cập nhật frontend gate và lịch sử.
5. **Củng cố engine và khóa học.** Sửa thuế/category/fee resolver, kiểm tra CSV, đưa nội dung thật và media có quyền.
6. **Hoàn thiện giao diện/admin/dữ liệu.** Mobile, modal, Hooks, copy/export, pagination, dashboard có định nghĩa, chính sách dữ liệu và nội dung công khai.
7. **Nghiệm thu staging và release.** CI/build, integration/E2E, backup restore, theo dõi và pilot; mở rộng sau khi các cổng đạt.

Các luồng có thể làm độc lập về mặt tổ chức: nội dung khóa học/marketing thật; xây fixture nghiệp vụ; khảo sát UX; chuẩn bị storage/staging. Không làm hai nhánh sửa session/payment schema mâu thuẫn mà chưa thống nhất hợp đồng dữ liệu.

## 15. Những việc chưa bắt buộc cho phiên bản hiện tại

Chỉ đưa vào sau khi có nhu cầu và nguồn lực rõ, không coi là thiếu sót phải xây để hoàn thành MVP:

- OAuth và đồng bộ sản phẩm/đơn hàng từ Shopee, TikTok Shop.
- Gửi Zalo/chat hoặc đăng nội dung trực tiếp lên nền tảng.
- Tự động đọc video, chuyển giọng nói thành văn bản, render video/avatar.
- CRM, pipeline khách hàng, email marketing, chương trình giới thiệu.
- Nhiều shop/team trong một tài khoản và phân quyền cộng tác chi tiết.
- App mobile riêng, microservices hoặc Kubernetes.
- Recommendation/trend engine có nguồn dữ liệu live.

Hồ sơ sản phẩm dùng chung giữa các tool là bước mở rộng hữu ích sau khi lịch sử và phân quyền đã ổn định, nhưng không nên trì hoãn vá session, payment và quota để làm tính năng này trước.

## 16. Cách quản lý tiến độ

Mỗi ticket khi triển khai nên có: người phụ trách, phạm vi file, phụ thuộc, thay đổi dữ liệu, test nghiệm thu, cách rollout và bằng chứng đạt. Chỉ đánh dấu hoàn thành sau khi code và kiểm tra tương ứng đã đạt; “đã viết code” hoặc “đã hết lỗi TypeScript” không đủ cho ticket thanh toán/phân quyền.

Không ấn định lịch cố định từ số dòng mã. Sau khi chốt môi trường, policy và quy mô đội, chia ticket theo buổi/đợt có thể review độc lập. Theo dõi phần trăm hoàn thành theo các cổng G1–G5, không theo số màn hình đã vẽ.

**Điểm bắt đầu cụ thể:** xây session/guard chuẩn và đóng API cấu hình AI/CRUD VIP; song song chuẩn bị staging và thiết kế payment intent. Đây là các thay đổi mở đường cho hầu hết công việc còn lại.

DATA-01–03: bằng chứng và quy trình triển khai tại [nghiem-thu-data.md](nghiem-thu-data.md). Hoàn tất mã và kiểm thử PostgreSQL local; production chưa áp dụng.
