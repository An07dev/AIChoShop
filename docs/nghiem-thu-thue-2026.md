# Hồ sơ nghiệm thu công cụ dự toán thuế 2026

## Phạm vi

- Bộ quy tắc: `VN-2026-ND141-ND68-LTNDN67-ND20-v1`.
- Chỉ hỗ trợ kỳ tính thuế 2026; năm khác bị chặn thay vì dùng lại ngưỡng cũ.
- Kết quả là dự toán. Trường hợp có điều kiện, phân bổ đa hoạt động hoặc dữ liệu tham chiếu chưa đủ được gắn cờ cần đối chiếu nghiệp vụ.
- Đề xuất giảm 30% TNCN/TNDN không được tự áp dụng khi chưa có căn cứ xác định chính sách đã có hiệu lực.

## Căn cứ đang liên kết trong giao diện

1. [Nghị định 141/2026/NĐ-CP](https://vanban.chinhphu.vn/?classid=1&docid=217960&pageid=27160&typegroupid=4): ngưỡng 1 tỷ đồng và doanh thu tham chiếu.
2. [Nghị định 68/2026/NĐ-CP](https://vanban.chinhphu.vn/?classid=0&docid=217111&pageid=27160): phương pháp và tỷ lệ đối với hộ/cá nhân kinh doanh.
3. [Luật Thuế TNDN 67/2025/QH15](https://vanban.chinhphu.vn/?docid=214607&pageid=27160): thuế suất TNDN theo doanh thu tham chiếu.
4. [Nghị định 20/2026/NĐ-CP](https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-mien-giam-thue-thu-nhap-doanh-nghiep-de-phat-trien-kinh-te-tu-nhan-11926011908115524.htm): miễn TNDN ba năm cho doanh nghiệp nhỏ và vừa đăng ký lần đầu và các trường hợp loại trừ.

## Ma trận ca biên đã tự động hóa

| Ca | Kỳ vọng |
|---|---|
| Hộ/cá nhân đúng 1 tỷ | Miễn GTGT và TNCN |
| Hộ/cá nhân trên 1 tỷ | GTGT trên toàn doanh thu; TNCN phương pháp doanh thu trên phần vượt ngưỡng |
| Nhiều nhóm hoạt động | Tính riêng tỷ lệ từng nhóm; cảnh báo cách phân bổ ngưỡng |
| Doanh thu năm trước trên 3 tỷ | Chuyển phương pháp TNCN theo thu nhập |
| Chỉ năm hiện tại mới vượt 3 tỷ | Không tự đổi hồi tố trong năm; cảnh báo kỳ sau |
| Doanh nghiệp tham chiếu không quá 1 tỷ | Miễn TNDN nhưng vẫn tính GTGT |
| Không xác nhận dữ liệu năm trước | Không tự kết luận miễn TNDN |
| Năm trước hoạt động dưới 12 tháng | Quy đổi doanh thu tham chiếu đủ 12 tháng |
| Có bên liên kết không đủ điều kiện | Không miễn TNDN theo ngưỡng doanh thu |
| SME trong ba năm đầu | Miễn TNDN khi đủ toàn bộ xác nhận |
| SME có thu nhập loại trừ | Không tự miễn toàn bộ; yêu cầu đối chiếu |
| Năm chưa hỗ trợ hoặc tổng nhóm không khớp | Chặn kết quả thuế và không lưu lịch sử |
| Đã khấu trừ lớn hơn nghĩa vụ | Tách số còn nộp và số có thể bù trừ/hoàn |

## Chữ ký nghiệp vụ còn thiếu

Người phụ trách thuế/kế toán cần đối chiếu ma trận trên với hồ sơ mẫu thực tế, đặc biệt là phân bổ ngưỡng cho nhiều hoạt động, thu nhập loại trừ và lựa chọn giữa các ưu đãi. Sau khi xác nhận, ghi tên, ngày, phiên bản quy tắc và các điều chỉnh được yêu cầu tại đây rồi mới đánh dấu TAX-05 hoàn thành.
