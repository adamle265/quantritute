# Pháp lý – Tuân thủ Luật Bảo vệ dữ liệu cá nhân (bắt đầu 03/11/2026)

Rà soát theo checklist repo vn-law-check + Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP, Luật AI 134/2025/QH15.
Chủ thể chịu trách nhiệm dữ liệu: **Đỗ Minh Tuấn** (cá nhân) · email nhận yêu cầu: **quantritute@gmail.com**.

| Mục | Việc | Ở đâu |
|---|---|---|
| 1 | Trang Chính sách bảo vệ dữ liệu cá nhân | `site/public/chinh-sach-du-lieu/` (tạo bằng `tao-trang-phap-ly.py`) |
| 11 | Trang Điều khoản sử dụng | `site/public/dieu-khoan-su-dung/` (cùng script) |
| 2 | Ô đồng ý ở form Góp ý của 5 công cụ (Cẩm nang, Ghép đối chiếu, In HĐ PDF, Tải tờ khai, Tờ khai GTGT) + máy chủ từ chối góp ý chưa tích | `scripts/dong-y-gop-y-cong-cu.py`, `src/public-api.js` |
| 3 | Ô đồng ý ở form Đề xuất (khi để lại Zalo/Email) | `site/public/dom.js`, `src/public-api.js` |
| 5 | Lưu vết đồng ý: cột `consent_at` + `consent_ver` (feedback, requests, bookings, subscribers) | `src/core.js` (CONSENT_COLS), câu chữ: `MAU-CAU-DONG-Y.md` |
| 6 | Thời hạn lưu, tự dọn mỗi ngày 10:00 | `src/retention.js`, `watch/index.js` |
| 7 | Quy trình xử lý yêu cầu dữ liệu + sự cố 72 giờ | `QUY-TRINH-YEU-CAU-DU-LIEU.md` |
| 9 | Header bảo mật web + trang quản trị; Cloudflare Access (anh tự bật) | `site/public/_headers`, `admin/public/_headers`, `HUONG-DAN-CLOUDFLARE-ACCESS.md` |
| 10 | Nhãn AI cho tóm tắt văn bản pháp luật (Cẩm nang + bản tin) | `cong-cu/cam-nang-thue-2026/app/index.html`, `src/mailer.js` |
| 13 | Phông chữ tự lưu, bỏ Google Fonts | `site/public/assets/fonts/`, `scripts/doi-font.py` |

**Chưa làm (anh chưa giao):** mục 4 (đồng ý riêng cho Góc cảm ơn), mục 8 (hồ sơ chuyển dữ liệu ra nước ngoài – cần hỏi luật sư), mục 12 (thông báo Bộ Công Thương khi bán công cụ có phí – **nhắc anh khi bắt đầu làm công cụ có phí**).

**Quy tắc cho hội thoại sau:**
- Thêm form mới thu tên/SĐT/email → phải có ô đồng ý không tích sẵn + link `/chinh-sach-du-lieu/`, máy chủ kiểm `consent`, lưu `consent_at`/`consent_ver`, thêm mã câu chữ vào `MAU-CAU-DONG-Y.md`, cập nhật bảng mục 2 trong `tao-trang-phap-ly.py`.
- Thêm dịch vụ bên ngoài nhận dữ liệu người dùng → cập nhật mục 5 trang Chính sách.
- Công cụ mới: link phông chữ `https://quantritute.com/assets/fonts/fonts.css?v=20261103`, không dùng Google Fonts.
- Bản cũ trước khi sửa: `_tam/truoc-phap-ly-20261103/` (và git).
