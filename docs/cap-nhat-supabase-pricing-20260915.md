# Supabase: ràng buộc biểu phí — 15/09/2026

- Đích đã xác minh: Supabase PostgreSQL production, PostgreSQL 17.6.
- Trước migration: bảng `PricingFeeOverride` có 0 bản ghi, 0 bản ghi active và 0 cặp thời gian chồng lấn.
- Sao lưu toàn bộ schema `public` vào `.data/backups/pricing-fees-upgrade-20260915/public-before.dump`.
- Đã phục hồi bản sao lưu trên PostgreSQL local và đối chiếu số bản ghi `PricingFeeOverride`; database phục hồi thử đã được xóa.
- Đã chạy `prisma/manual/guard_pricing_fee_periods.sql` trên production.
- Đã xác minh hai constraint hợp lệ: `PricingFeeOverride_valid_values_check` và `PricingFeeOverride_no_active_overlap_excl`.
- Biên bản backup và kết quả migration nằm trong `.data/backups/pricing-fees-upgrade-20260915/`, được loại khỏi Git và không được chia sẻ vì chứa dữ liệu production.

Migration chỉ bổ sung extension/constraint, không seed và không xóa dữ liệu. Mã website vẫn phải được triển khai riêng để giao diện dùng bản registry phí phiên bản `2026-09-15`.
