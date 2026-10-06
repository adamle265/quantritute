# Cẩm nang tra cứu Thuế – Kế toán – Lao động 2026

- **Slug:** `cam-nang-thue-2026` (link trên web: `/tools/cam-nang-thue-2026/`)
- **Nhóm:** Kế toán – tài chính
- **Nỗi đau giải quyết:** Không chắc văn bản nào còn hiệu lực, điều khoản nào đã bị sửa.
- **Người dùng:** Kế toán, chủ doanh nghiệp nhỏ
- **Trạng thái:** Dùng được (đã gắn vào tool "tra-cuu-van-ban" trong database, bản v1.1)
- **Bản gốc:** do anh Tuấn biên soạn

## Khác so với bản gốc
| # | Chỗ sửa | Lý do |
|---|---|---|
| 1 | Bỏ thông tin tổ chức cũ | Không dùng thương hiệu/thông tin tổ chức cũ |
| 2 | Bỏ cổng mã truy cập và form thu thông tin | Kho tool miễn phí, không thu dữ liệu |
| 3 | Nút liên hệ trỏ về `/lien-he` (3 chỗ) và `/cong-cu` (2 chỗ) | Dẫn người xem về web Quản trị tử tế |
| 5 | Thêm khối "🔔 Cập nhật pháp lý mới cần chú ý" trên trang chủ + nhãn "đang chờ cập nhật" ở chủ đề (lấy dữ liệu đã duyệt từ `/api/legal-updates`; mở file ngoài web thì khối tự ẩn) | Tính năng theo dõi văn bản mới, xem HUONG-DAN mục 13 |
| 6 | Menu "Trang chủ" → "Giới thiệu", bỏ hướng dẫn sử dụng; tab mới "Tự động cập nhật pháp lý mới nhất" (theo tháng / chủ đề, form đăng ký email); popup Góp ý (Họ tên, SĐT, Nội dung) thay link /lien-he | Bản 1.4 – HUONG-DAN mục 14 |
| 4 | Tiêu đề trang: "Cẩm nang Thuế & Kế toán 2026 · Quản trị tử tế" | Đồng bộ thương hiệu |

## Kiểm tra trước khi đưa lên
- [x] Không còn tên/logo/thông tin tổ chức cũ (rà tự động 05/10/2026)
- [x] Không còn cổng mã truy cập, form thu thông tin
- [x] Nút liên hệ trỏ về `/lien-he`, `/cong-cu`
- [ ] Anh mở thử trên web, chạy các tính năng chính

## Cập nhật lên web
Sửa file trong `app/` → mở PowerShell tại thư mục này → `.\cap-nhat.cmd`

## Việc còn lại
- Kế hoạch video (`video/ke-hoach-video.md`): chưa làm.
- Rà soát nội dung văn bản còn hiệu lực theo thời điểm đăng.

## Nhật ký
| Ngày | Việc |
|---|---|
| 05/10/2026 | Làm sạch bản gốc, gắn vào web v1.1, deploy lần đầu |
| 05/10/2026 | Chuyển nguồn sang `cong-cu/cam-nang-thue-2026/app/` |
| 05/10/2026 | Thêm theo dõi văn bản pháp luật mới (bản 1.3): khối cập nhật trên trang chủ, nhãn ở chủ đề. Sửa nội dung cẩm nang xong nhớ chạy `npm run legal:index` |
| 06/10/2026 | Bản 1.4: tab Tự động cập nhật pháp lý, đăng ký email, popup góp ý; dữ liệu + cài đặt riêng trong Quản trị → Cẩm nang thuế |
