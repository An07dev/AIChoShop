# Hồ sơ nghiệm thu dự phóng và liên thông KOC

## Phiên bản và phạm vi

- Mô hình dự phóng: `KOC-FORECAST-2026-v1`.
- Kịch bản cơ sở dùng đúng dữ liệu người dùng nhập.
- Kịch bản thận trọng giảm tỷ lệ KOC hiệu quả 20%, giảm đơn tự nhiên/KOC 30%, tăng CPA 25% và tăng tỷ lệ hoàn.
- Kịch bản thuận lợi tăng tỷ lệ KOC hiệu quả 10%, tăng đơn tự nhiên/KOC 25%, giảm CPA 15% và giảm tỷ lệ hoàn 25%.
- Phân tích độ nhạy đo thay đổi lợi nhuận khi giá bán, tỷ lệ KOC hiệu quả, đơn/KOC, CPA hoặc tỷ lệ hoàn biến động bất lợi rồi xếp theo tác động tuyệt đối.

## Liên thông định giá

- KOC chỉ đọc snapshot định giá TikTok do API trả về cho session đang đăng nhập.
- Không dùng `localStorage` làm nguồn thay thế vì dữ liệu trình duyệt có thể thuộc tài khoản đăng nhập trước đó.
- Snapshot sai cấu trúc, không thuộc TikTok hoặc bị trùng ID đều bị loại.
- Khi nhập sản phẩm, kế hoạch lưu ID snapshot, tên sản phẩm, ngày tạo và phiên bản phí nguồn.
- Nếu snapshot quá 90 ngày hoặc phiên bản phí đã đổi, giao diện cảnh báo và tính kế hoạch bằng biểu phí hiện tại.
- Khi người dùng sửa đầu vào, kết quả cũ được ẩn cho tới lần tính tiếp theo.

## Kiểm thử tự động

1. Kịch bản thận trọng có lợi nhuận thấp hơn cơ sở và thuận lợi cao hơn cơ sở.
2. Các yếu tố độ nhạy được xếp giảm dần theo chênh lệch lợi nhuận tuyệt đối.
3. API chưa xác nhận đăng nhập không cung cấp snapshot để nhập.
4. Chỉ snapshot TikTok hợp lệ, không trùng lặp được chấp nhận.
5. Snapshot quá 90 ngày hoặc khác phiên bản phí được gắn cờ cần kiểm tra.
6. Các test ngân sách, Ads, hoàn hàng, phí TikTok, dòng tiền và validation cũ tiếp tục đạt.
