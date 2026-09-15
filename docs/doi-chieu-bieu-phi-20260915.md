# Đối chiếu biểu phí — 15/09/2026

Phạm vi phát hành hiện tại chỉ gồm Shopee Việt Nam, TikTok Shop Việt Nam và kênh bán trực tiếp. Lazada chưa có trong kiểu dữ liệu và bộ tính, vì vậy đã bỏ tên Lazada khỏi mô tả trang quản trị để giao diện không hứa chức năng chưa tồn tại.

## Dữ liệu nền tảng

| Sàn | Khoản phí | Giá trị tích hợp | Hiệu lực | Nguồn chính thức |
|---|---:|---:|---:|---|
| Shopee shop thường | Phí cố định theo ngành cấp 3 | 1.656 ngành trong JSON dùng chung với Mall | 23/05/2026 | PDF Shopee non-Mall trong `SOURCES.shopeeMarketplace` |
| Shopee Mall | Phí cố định theo ngành cấp 3 | cùng 1.656 ngành, cột Mall | 29/05/2026 | PDF Shopee Mall trong `SOURCES.shopeeMall` |
| Shopee | Phí xử lý giao dịch | 6% | điều khoản hiện hành khi đối chiếu | Điều khoản Shopee/Shopee Mall |
| Shopee | Phí cố định theo đơn | 0đ | điều khoản hiện hành khi đối chiếu | Không có khoản 3.000đ/đơn trong điều khoản; đã sửa giá trị gán nhầm từ TikTok |
| TikTok Shop Marketplace | Hoa hồng theo ngành cấp 3 | 2.040 ngành | 03/07/2026 | PDF trong bài Introduction to Seller Fees |
| TikTok Shop Mall | Hoa hồng theo ngành cấp 3 | cùng 2.040 ngành, cột Mall | 03/08/2026 | PDF trong bài Introduction to Seller Fees |
| TikTok Shop | Phí giao dịch | 6% | 09/05/2026 | Transaction Fee |
| TikTok Shop | Phí xử lý đơn | 3.000đ/đơn giao thành công | 27/10/2025 | Order Processing Fee |

Bộ test kiểm tra số dòng, ID trùng, miền tỷ lệ và các dòng mẫu đối chiếu trực tiếp trong ba PDF. Nguồn, ngày hiệu lực và ngày xác minh được giữ trong registry phiên bản `2026-09-15`.

## Chương trình tùy chọn

- Shopee “Ưu đãi phí vận chuyển”: 6%, tối đa 50.000đ mỗi sản phẩm; chỉ hiện cho Shopee Mall và mặc định tắt.
- TikTok Voucher Extra cơ bản: 5%, tối đa 50.000đ mỗi sản phẩm; mặc định tắt, chỉ bật khi shop đủ điều kiện và đã tham gia. Giao diện ghi rõ nhóm hàng bị loại trừ.
- Đã bỏ Shopee Voucher Xtra, Content Xtra và TikTok SFP khỏi bộ tính vì không tìm được nguồn chính thức hiện hành đủ rõ cho tỷ lệ/phạm vi từng shop. Người dùng vẫn có thể nhập phí thực tế bằng phần phí thủ công hoặc admin override.

Các chương trình và ưu đãi có thể phụ thuộc hợp đồng, trạng thái đủ điều kiện hoặc thông báo riêng trong Seller Center. Khi sao kê shop khác số tích hợp, admin tạo override có nguồn và thời gian hiệu lực thay vì sửa lịch sử kết quả cũ.
