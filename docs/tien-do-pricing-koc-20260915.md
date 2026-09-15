# Hoàn thiện Pricing và KOC — 15/09/2026

Nhánh `codex/hoan-thien-pricing-koc`. Phạm vi: CALC-01, CALC-03, CALC-04, CALC-05, CALC-06 và KOC-01.

## Đã triển khai

- Nhận diện ngành có ngưỡng tối thiểu và mức chắc chắn. Chuỗi không liên quan trả `null`; CSV yêu cầu chọn ngành thủ công khi không nhận diện chắc chắn.
- Một fee resolver áp dụng cho tính giá đơn, tính hàng loạt và KOC. Thứ tự ở Pricing là dữ liệu tích hợp → ghi đè quản trị → số người dùng nhập. Snapshot mới lưu phiên bản và nguồn phí.
- Validation engine chặn NaN/Infinity, chi phí âm, phần trăm ngoài 0–100, số lượng, bước làm tròn và mục tiêu biên không khả thi. KOC dùng validation tập trung cho ngân sách, chi phí và tỷ lệ.
- CSV đọc BOM, dấu phẩy/dấu nháy/xuống dòng trong ô, số định dạng Việt Nam; giới hạn 2 MB và 1.000 dòng; báo lỗi theo dòng. CSV/XLSX thêm dấu nháy đơn trước nội dung có thể chạy công thức.
- Biểu phí quản trị kiểm tra ngày ngược, URL nguồn HTTPS, độ dài, và khoảng hiệu lực chồng nhau. PostgreSQL có CHECK và exclusion constraint chống cả hai yêu cầu đồng thời.
- Giao diện cảnh báo khi không tải được biểu phí quản trị hoặc dữ liệu phí quá 90 ngày; admin thấy trạng thái đang áp dụng, sắp áp dụng hoặc hết hiệu lực.
- KOC lấy đủ hoa hồng, phí giao dịch và phí theo đơn từ cùng resolver với Pricing; vẫn dùng chung engine Pricing cho phí, hoàn hàng, affiliate, thuế và CPA hòa vốn.

## Database

SQL bổ sung: `prisma/manual/guard_pricing_fee_periods.sql`. Đã sao lưu, phục hồi thử và áp dụng lên Supabase production ngày 15/09/2026; xem `docs/cap-nhat-supabase-pricing-20260915.md`.

## Kiểm thử

- Unit test: engine Pricing/KOC, nhận diện ngành, resolver theo ngày, cảnh báo cũ, CSV nhiều dòng và formula injection.
- PostgreSQL local: SQL chạy lặp được; hai insert chồng thời gian đồng thời chỉ một thành công; constraint chặn tỷ lệ và khoảng ngày sai.
