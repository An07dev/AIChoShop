# Hồ sơ nghiệm thu khóa học và video

## Quyền và dữ liệu trả về

- Danh mục học viên chỉ đọc khóa học và bài học có trạng thái `PUBLISHED`.
- Bài VIP chỉ trả nội dung và URL video cho VIP còn hạn; admin vẫn xem được nội dung nháp để quản trị.
- Media mới được upload trực tiếp bằng TUS vào bucket Supabase Storage private. `/api/media/[filename]` kiểm tra session, trạng thái khóa/bài và quyền VIP trước khi chuyển tới signed URL có hạn; media local cũ vẫn được đọc trong giai đoạn chuyển đổi.
- YouTube/Vimeo là nguồn công khai của nhà cung cấp. Ứng dụng có thể ẩn URL khỏi người chưa có quyền nhưng không tuyên bố bảo vệ tệp nguồn bên ngoài.

## Quản trị nội dung

- Khóa học có trạng thái bản nháp, đã xuất bản hoặc đã ẩn; admin có thể sửa và chỉ xóa khóa rỗng.
- Bài học mới mặc định là bản nháp. Thứ tự được chèn/chuyển trong transaction và các bài liên quan được đánh lại thứ tự.
- Tiêu đề, học phần, nội dung, URL, thời lượng, thứ tự, khóa học và tài sản media đều được kiểm tra tại server.
- Seed không xóa dữ liệu hiện có, không gắn video mẫu và chỉ bổ sung bài còn thiếu ở trạng thái nháp.

## Tiến độ và media

- Tiến độ có trạng thái hoàn thành, `completedAt`, vị trí video, thời lượng và lần xem gần nhất.
- Video MP4/WebM nội bộ tự khôi phục vị trí đã xem; trình nhúng bên ngoài không cung cấp sự kiện phát chuẩn nên chỉ lưu trạng thái hoàn thành.
- Upload tạo `MediaAsset` có người tải, tên file ngẫu nhiên, MIME, kích thước, storage provider, bucket, object path và trạng thái. File bỏ dở hoặc không còn liên kết được dọn sau 24 giờ bằng thao tác admin, kể cả object trên Supabase.
- Trình duyệt upload thẳng tới hostname Storage bằng TUS, có tiến độ, retry và tiếp tục upload; service role key chỉ tồn tại phía server.

## Database và kiểm thử

- Schema Prisma được bổ sung bằng script cộng dồn [complete_learning.sql](../prisma/manual/complete_learning.sql); script không xóa Course, Lesson hoặc Progress.
- Phần Storage có migration riêng [supabase_video_storage.sql](../prisma/manual/supabase_video_storage.sql) và bucket private [setup_course_video_bucket.sql](../prisma/manual/setup_course_video_bucket.sql).
- PostgreSQL local kiểm tra script nâng cấp chạy lặp hai lần, giữ nguyên bản ghi cũ, backfill trạng thái xuất bản/completedAt và thực thi ownership media.
- Kiểm thử thuần kiểm tra ma trận quyền, validation URL/nội dung và chuẩn hóa vị trí video.
- Kết quả vòng nghiệm thu ngày 16/09/2026: 56/56 kiểm thử logic đạt, 3/3 kiểm thử PostgreSQL đạt, TypeScript và ESLint sạch, `next build --webpack` thành công.
- Kiểm thử giao diện local xác nhận guest không đọc được nội dung VIP, admin đăng nhập và quản trị trạng thái bài học, học viên đánh dấu hoàn thành và thấy tiến độ 1/2 (50%).

## Phạm vi còn cần dữ liệu thật

`LEARN-03` chưa thể nghiệm thu nếu chưa có video, giáo trình, ảnh bìa và thông tin số bài chính thức. Hệ thống không tự tạo nội dung hoặc gắn video mẫu để che khoảng trống này. Admin có thể nhập nội dung thật ở trạng thái nháp, xem trước rồi xuất bản.
