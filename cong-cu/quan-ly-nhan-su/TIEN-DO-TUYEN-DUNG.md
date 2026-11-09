# Tiến độ riêng – Module Tuyển dụng (bản 0.5.1 – anh chốt số 09/11 16:04)
> Làm song song với hội thoại Module Lương (0.4.1, đang sửa `nguon/src/*`, `build.js`). File này là tiến độ riêng; **chỉ cập nhật tiến độ chung + tích hợp vào `nguon/src` khi anh duyệt**.

## Trạng thái
| Thời điểm | Việc |
|---|---|
| 09/11/2026 16:45 | **XONG B0–B6 – chờ anh xem 1 lượt.** Bản xem: `nguon/_nhanh-tuyen-dung/app/index.html` (Chrome/Edge) → Dùng dữ liệu mẫu → menu Tuyển dụng. Code: `_nhanh-tuyen-dung/tuyendung.js` (1 file). Ghép vào bản chính: `_nhanh-tuyen-dung/TICH-HOP.md`. Máy chủ cổng (để sau): `_nhanh-tuyen-dung/may-chu/THIET-KE-KET-NOI.md`. Căn cứ BLLĐ 2019 trích từ văn bản gốc anh gửi: `_nhanh-tuyen-dung/can-cu/45_2019_QH14.txt`. Chưa sửa `nguon/src`, `build.js`, `app/`, README, tiến độ chung |
| 09/11/2026 16:04 | Anh duyệt: số bản **0.5.1**; làm đủ rồi xem 1 lượt; duyệt nhu cầu 1 bước (admin lập phiếu, không cấp duyệt); đã gửi BLLĐ 45/2019. Yêu cầu thêm: **trang mẫu cổng tuyển dụng** (danh sách vị trí đang bật + trang chi tiết vị trí, chia sẻ được, ứng viên gửi CV → đổ về dữ liệu ứng viên, lưu Cloudflare – dựng form trước, kết nối sau); **biểu mẫu thư** mời phỏng vấn / mời nhận việc / cảm ơn & thông báo chưa trúng tuyển; **nút chuyển ứng viên → nhân viên** |
| 09/11/2026 15:50 | Đọc tiến độ chung (mục 1–5), BAN-GIAO-0.4.1.md, menu/SOON trong `src/app.js`, quy ước số bản (`series/00_HO-SO-SERIES.md` mục 7: B=5 là Tuyển dụng). Gửi kế hoạch B0–B6 – **chờ anh duyệt**. Chưa sửa file nào ngoài file này |

## Nguyên tắc tách nhánh (để không đụng Module Lương)
- Làm trong `nguon/_nhanh-tuyen-dung/`: bản chụp `src` lúc bắt đầu + `tuyendung.js` (toàn bộ logic, CSS, dữ liệu mẫu tuyển dụng) + `build-td.js` riêng → `_nhanh-tuyen-dung/app/index.html`.
- Không sửa: `nguon/src/*`, `nguon/build.js`, `app/index.html`, `cham-cong-thu/`, `assets/mau.b64`, `README.md`, `phien-ban*.json`, tiến độ chung.
- Mọi chỗ phải chạm file dùng chung ghi vào `_nhanh-tuyen-dung/TICH-HOP.md` (danh sách vá nhỏ) để khi anh duyệt thì ghép vào `src` mới nhất.

## Kế hoạch (đã duyệt 16:04, đã làm xong)
B0 dựng nhánh · B1 Nhu cầu tuyển dụng · B2 Tin tuyển dụng · B3 Ứng viên & phỏng vấn · B4 Mời nhận việc → hồ sơ nhân sự · B5 Kết nối Bảng điều hành / Việc cần xử lý / Sơ đồ tổ chức + dữ liệu mẫu · B6 Kiểm thử + anh xem 1 lượt.

## Việc còn treo / cần anh
- Xem 1 lượt bản `_nhanh-tuyen-dung/app/index.html`, góp ý.
- Chốt hạ tầng máy chủ cổng (Worker + D1 + R2 riêng, tên miền `tuyendung.quantritute.com`) – xem `may-chu/THIET-KE-KET-NOI.md` mục 1. R2 cần bật trên tài khoản Cloudflare.
- Luật 91/2025/QH15 + NĐ 356/2025: chưa có văn bản gốc trong `Văn bản pháp lý` – các chỗ nhắc dữ liệu cá nhân ứng viên đang ghi "chưa trích điều".
- Khi anh duyệt: ghép theo `TICH-HOP.md` vào `src` mới nhất (sau khi hội thoại Lương xong việc trên `app.js`), rồi mới ghi tiến độ chung.
