# DATA-04 đến DATA-07

Nhánh `codex/hoan-thien-data-04-07`, kế tiếp DATA-01–03. Mã nguồn và migration đã được kiểm thử PostgreSQL local. Các migration mới đã áp dụng lên DB thật ngày 17/09/2026 theo yêu cầu người dùng; chưa deploy mã nguồn mới lên Hostinger.

## DATA-04: truy cập và lỗi database

- AiUsageLog dùng Prisma có kiểu, bỏ hoàn toàn nhánh kiểm tra delegate bằng any, INSERT/COUNT SQL unsafe và số liệu mặc định 1 khi truy vấn lỗi. Ghi lỗi trả failure, không success giả.
- Dashboard admin dùng kết quả Prisma có kiểu. Khi DB lỗi, trang lỗi quản trị hiển thị thay vì bảng có tất cả số liệu 0. Giữ nguyên định nghĩa báo cáo cũ; thay định nghĩa doanh thu thuộc ADMIN-03.
- API lịch sử, gói VIP và cấu hình OpenAI phân loại DATABASE_UNAVAILABLE (503), DATABASE_SCHEMA_MISMATCH (503), DATA_CONFLICT/DATA_BUSY (409). Lỗi payload vẫn 400/413, không bị coi là lỗi DB.
- Session đọc qua readDatabase; mất DB không tạo quyền hoặc phiên khách giả. Admin API trả lỗi DB khi không xác minh được quyền. Settings lỗi không trả cấu hình AI mặc định: request dừng trước khi gọi provider.
- Server actions quản trị che lỗi database và loại bỏ log chứa đối tượng lỗi thô. Log được thay bằng operation/code. Giữ các thông báo validation nghiệp vụ ngắn đã qua bộ lọc.
- Kết quả AI đã commit nhưng đọc số liệu sau đó lỗi vẫn trả kết quả đã tạo, usage=null và usageUnavailable=true; không giả count hoặc yêu cầu người dùng tạo lại một kết quả đã bị tính lượt.
- SQL tham số hóa còn lại được giữ cho FOR UPDATE, advisory lock và atomic upsert quota/payment/rate-limit. Đây là SQL cho concurrency, không phải fallback khi Prisma lỗi.

## DATA-05: constraint và index

Migration `20260917000000_data_constraints_indexes`:

- Kiểm tra hạn mức và số dư không âm, giá/thời hạn VIP hợp lệ, thứ tự bài >0, kích thước media >0, giá trị/status giao dịch, direction/status webhook và status/metrics/counts ledger.
- Không xóa/sửa dữ liệu cũ để ép constraint đạt. Nếu dữ liệu cũ không hợp lệ, migration dừng và cần xử lý từng trường hợp đã review.
- Unique event hiện có là PaymentWebhookEvent.id (ID chuẩn hóa có prefix provider), paymentCode unique, Progress unique user/lesson, token/reset/filename unique được giữ nguyên. Không thêm sepayId unique để tránh phá giao dịch legacy.
- Không thêm unique course/order tức thời: thao tác đổi thứ tự hiện dịch các hàng trong transaction và có thể trùng ở trạng thái trung gian. Migration này bổ sung CHECK/index cho thứ tự, không tự đánh lại STT lịch sử.
- Index mới: Lesson(courseId,order), AiUsageLog(userId,tool,createdAt), AiUsageLog(createdAt), SeoRun(subject,status,createdAt), Transaction(status,createdAt), PaymentWebhookEvent(transactionId,status,receivedAt), AdminAuditLog(action,createdAt).

EXPLAIN ANALYZE/BUFFERS dùng PostgreSQL local với 100 user, 100 course, 20.000 lesson, 50.000 history, 30.000 run và 30.000 transaction. Bốn truy vấn lịch sử theo user/tool, bài theo course/order, pending theo subject/time và giao dịch theo status/time đều sử dụng index mới. Kế hoạch trước/sau lưu `.data/test-results/data-index-explain.json`, chỉ dữ liệu tổng hợp fixture, không chứa nội dung user thật.

Số đo một lượt đại diện: lịch sử 0,560 → 0,127 ms; bài học 0,357 → 0,157 ms; pending 1,017 → 0,154 ms; giao dịch 3,272 → 0,083 ms. Đây là fixture local và cache có thể ảnh hưởng, không phải cam kết latency production. Cần theo dõi thực tế khi dữ liệu production tăng.

## DATA-06: lịch sử theo tài khoản

- Snapshot định giá/thuế/KOC lấy local làm nguồn chính để nạp lại và liên thông trên cùng thiết bị. Server lưu nhật ký hoạt động đã làm sạch; không tự trộn nhật ký KOC server trở lại danh sách local sau khi xóa.
- Khóa physical: `aichoshop:history:v2:<owner>:<tool>`. Envelope có version=2, owner và items. Không dùng key chung cũ hoặc tự chuyển dữ liệu không biết chủ sở hữu.
- Version không hỗ trợ/corrupt/oversize có thông báo; không ghi đè để ép đọc. Metadata phí và công thức của snapshot giữ nguyên, KOC vẫn có migrateInput cho cấu trúc công thức cũ đã được xác định chủ sở hữu.
- Account lưu localStorage; guest lưu sessionStorage của tab. Tối đa 50 mục/tool, 90 ngày và 512 KiB/tool. Đọc loại bỏ/dọn mục quá hạn, lưu kiểm tra quota/dung lượng. Không giả thành công khi trình duyệt từ chối lưu.
- AccountHistoryProvider nhận ID từ layout server, xác minh lại qua API trước khi đọc local. Đổi tài khoản remount subtree; storage event, focus và kiểm tra mỗi 30s phát hiện đổi tài khoản/logout ở tab khác và ẩn nội dung cũ.
- Request lịch sử của calculator gửi X-History-Owner. Server vẫn lấy user từ session, so khớp owner và từ chối 409 nếu khác; query/body userId không chọn được dữ liệu người khác. Link export dùng owner query để bảo vệ tab cũ nhưng không dùng owner này làm identity.
- Lưu KOC thuần công thức được ghi tool koc-calculator, không tính như một kết quả AI koc-planner. Không tự điều chỉnh quota quá khứ trong migration này.
- Local không mã hóa và không phải ranh giới chống người có quyền dùng DevTools/thiết bị. Có thể xuất hoặc xóa riêng dữ liệu của từng thiết bị.

## DATA-07: quyền riêng tư

Theo chính sách 90 ngày được người dùng phê duyệt:

- Sanitizer đệ quy lược bỏ base64/binary, key nhạy cảm, email và số điện thoại Việt Nam khỏi history input/output/action. JSON lưu vẫn hợp lệ; vượt giới hạn lưu có marker omitted thay vì JSON cắt dở. Bộ lọc không nhận diện được mọi tên/địa chỉ/PII trong văn bản tự do; giao diện nhắc không nhập bí mật hoặc dữ liệu khách hàng.
- Raw input và ảnh của công cụ AI được gửi cho model cấu hình để thực hiện yêu cầu. Trang /privacy và thông báo tại công cụ giải thích OpenAI/endpoint tương thích/Ollama, ảnh chỉ gửi ở luồng hỗ trợ ảnh. Không tuyên bố nhà cung cấp không lưu dữ liệu; thời hạn/xóa phía provider theo cấu hình/chính sách provider, tách khỏi xóa tại AIChoShop.
- Lịch sử qua API chỉ trả nội dung trong 90 ngày. Export nội dung quá hạn được xóa khỏi response ngay cả khi maintenance chưa chạy. Không ghi DB khi GET/render.
- Mutation lưu kết quả chạy expireHistoryContent trong transaction để xóa input/output/action quá hạn, giữ row/count/quota. Tác vụ admin bảo trì còn làm sạch lịch sử cũ còn hạn theo sanitizer hiện tại.
- /profile/data: xuất server dạng NDJSON streaming, batch 200, có marker complete; xuất local thành JSON riêng (tối đa 3 × 512 KiB). Không gom toàn bộ server vào RAM trình duyệt. Export chứa hồ sơ của chính user, credit, lịch sử công cụ, tiến độ và giao dịch; không chứa password/session/reset/API key hay dữ liệu người khác.
- Xóa cần session hợp lệ, same-origin, owner đúng và gõ XOA LICH SU. Xóa input/output/action server và local của owner trên thiết bị hiện tại, audit transaction; giữ quota, tài khoản, VIP, Progress và Transaction. Request đang xử lý có thể tạo lịch sử mới sau lần xóa. Thiết bị khác/legacy shared được dọn riêng.
- /admin/privacy: admin guard, xác nhận, chặn gửi đôi, báo số mục dọn/làm sạch. Maintenance dọn session hết hạn, token/passwordVersion reset hết hạn và rate-limit quá hạn >1 ngày. Không xóa counter quota guest hoặc payment ledger để reset quyền thử/số liệu.
- Migration `20260917010000_private_data_access` và `20260917020000_catalog_access` bật RLS, revoke PUBLIC/anon/authenticated cho bảng riêng tư/cấu hình/media và danh mục. Raw Lesson REST không lộ bài nháp/VIP; app public catalog đọc DTO qua trusted server. Hai bảng thanh toán đã được bảo vệ ở migration DATA trước.
- Metadata sử dụng và audit được giữ cho quota, an toàn, truy vết trong vòng đời dịch vụ/tài khoản; đợt này không tự xóa metadata hoặc hồ sơ tài khoản/giao dịch. Những yêu cầu xóa tài khoản/thanh toán cần quản trị viên xử lý riêng. Backup và provider có quy trình lưu/xóa riêng, không bị xóa bởi nút xóa history.

## Triển khai và bảo trì

1. Backup DB và kiểm tra trên bản sao, xác minh dữ liệu cũ hợp lệ và kết nối ứng dụng có role trusted/bypass RLS. Không dùng anon/authenticated làm DATABASE_URL của server.
2. Deploy migration và code tương ứng. POST history mới yêu cầu owner; code cũ chưa gửi owner sẽ bị từ chối ghi nhật ký. Không rollout DB/code lệch phiên bản trong thời gian dài.
3. Chạy `npm run db:migrate`, `npm run db:status`, `npm run db:drift` trên đúng môi trường. Không dùng reset, db push hoặc seed demo trên production.
4. Chạy bảo trì admin một lần để làm sạch lịch sử còn hạn đã lưu trước bản này.
5. Cấu hình tác vụ scheduled command của môi trường host chạy `npm run db:privacy:cleanup` hàng ngày với env server riêng. CLI dùng transaction, timeout và audit system; chỉ dọn quá hạn/token, không scrub toàn bộ lịch sử còn hạn. Không có side effect này trong install/build/start hoặc GET. Lịch bảo trì Hostinger chưa được cấu hình trong đợt local này.
6. Restore backup vào môi trường riêng: dọn quá hạn và áp dụng lại yêu cầu xóa sau backup trước khi mở dịch vụ. DB dump không chứa video; media cần backup riêng.

## Kiểm thử tự động và kiểm tra giao diện

`TEST_DATABASE_URL` phải là localhost/127.0.0.1, tên DB kết thúc `_test`; mỗi test tạo schema riêng và dọn schema đó.

- `npm run test:data:extended`: phân loại lỗi, cách ly account/version/TTL/quota storage, scrub nested, API lịch sử và export/delete matrix, PostgreSQL constraint/RLS, export >200 hàng, erase/cleanup không đổi quota/dữ liệu khác, EXPLAIN.
- `npm run test:data`, `npm run test:ai:db`, `npm run test:auth`, `npm run test:payments`: hồi quy seed/read/quota/session/payment.
- Typecheck, lint các file thay đổi và build production. Không coi SKIP DB là đạt.

Kết quả nghiệm thu local ngày 17/09/2026: DATA mở rộng 6/6 (không skip PostgreSQL), quota AI PostgreSQL 1/1, DATA cũ 2/2, đăng nhập/phân quyền 31/31, thanh toán 16/16 và policy 7/7, định giá/KOC/CSV/biểu phí 30/30, học tập 3/3 và media 2/2. Typecheck không lỗi, lint các file thay đổi không lỗi (còn cảnh báo biến chưa dùng), build production đạt. Đã thử migration trên bản sao database thật ở PostgreSQL local và kiểm tra drift không có khác biệt schema.

Trên giao diện sau deploy đúng nhánh:

1. Tài khoản A lưu định giá/thuế/KOC rồi mở lại lịch sử và liên thông định giá → KOC; logout, login B, B không thấy snapshot local của A. Login A lại để kiểm tra lịch sử A còn.
2. Mở hai tab cùng browser; đổi tài khoản ở một tab. Tab cũ phải ẩn dữ liệu, yêu cầu tải lại và không ghi log vào tài khoản mới.
3. /profile → Dữ liệu cá nhân: tải hai file export, kiểm tra chỉ chứa dữ liệu của bạn; xóa bằng xác nhận, kiểm tra AI quota vẫn giữ và khóa học/tiến độ/giao dịch còn.
4. /admin/privacy: xác nhận bảo trì, kiểm tra thông báo và sự kiện trong /admin/audit. User thường gọi action trực tiếp phải bị từ chối.
5. Mất DB: trang admin hiển thị lỗi, API trả 503/code; không hiển thị dashboard số 0 hoặc tự bật provider. Khôi phục kết nối rồi thử lại.

Chưa deploy mã nguồn mới lên Hostinger, chưa cấu hình scheduled command, chưa chứng nhận retention phía provider hoặc backup vận hành. Lỗi upload Hostinger còn là phạm vi OPS/media riêng.

## Cập nhật DB thật ngày 17/09/2026

- Sao lưu schema public và dữ liệu ứng dụng bằng pg_dump custom với snapshot repeatable-read: `.data/backups/data-04-07-rollout-20260917/public-before.dump`, 141245 byte, có SHA-256 trong `before.json`. Backup được giữ ngoài Git và gói deploy; không chứa file video hoặc schema dịch vụ Supabase khác.
- Phục hồi bản sao mới vào `aichoshop_data0407_rollout_test` trên PostgreSQL local; bỏ riêng mục tạo schema public đã tồn tại khi restore. Chạy cả ba migration mới, đối chiếu fingerprint nội dung 20 bảng giữ nguyên và drift không khác biệt.
- Xác minh kết nối server thật bypass RLS và checksum ba migration đã áp dụng trước đó khớp mã nguồn; chạy `npm run db:migrate` trên DB thật, chỉ áp dụng `20260917000000_data_constraints_indexes`, `20260917010000_private_data_access`, `20260917020000_catalog_access`.
- Sau cập nhật: đủ 6 migration, status up to date, drift không khác biệt, 20 bảng có RLS và server vẫn có quyền truy cập, không còn grant PUBLIC/anon/authenticated trên các bảng này, không có constraint chưa validated.
- Đối chiếu fingerprint toàn bộ dữ liệu của 20 bảng trước/sau: không bảng nào thay đổi. Giữ nguyên 6 user, 3 khóa học, 30 bài học, 12 giao dịch, 119 bản ghi lịch sử, 13 tiến độ và 11 media asset. Không reset/seed, không chạy tác vụ xóa/làm sạch lịch sử trên DB thật trong lần cập nhật schema này.
- Smoke test Prisma Client với driver adapter của ứng dụng đọc User/Course/Lesson/Transaction/AiUsageLog/Progress thành công. Báo cáo máy nằm trong `local-result.json`, `production-result.json` cạnh backup.
- Chức năng giao diện xuất/xóa, sanitizer và bảo trì mới chỉ hoạt động khi Hostinger deploy mã nguồn tương ứng. Lịch dọn dữ liệu hằng ngày và làm sạch lịch sử cũ còn hạn vẫn cần triển khai bằng quy trình bảo trì ở trên.

## Sửa hiển thị lịch sử sau khi xóa

API và dashboard lọc `ERASED_ACTION` ngay trong truy vấn danh sách, trước giới hạn 10/50 mục; không thay đổi truy vấn đếm lượt/quota. Cửa sổ lịch sử dùng số mục còn hiển thị thay vì tổng số lượt đã tạo. Kiểm thử PostgreSQL local xác nhận xóa toàn bộ làm danh sách trống, số lượt/quota giữ nguyên và mục mới tạo sau xóa vẫn hiển thị. Bản sửa chỉ đổi mã nguồn, không cần migration mới hoặc xóa thêm dữ liệu DB thật.
