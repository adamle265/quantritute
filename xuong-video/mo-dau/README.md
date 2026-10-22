# Mở đầu & kết chuẩn – kênh Quản trị tử tế (14/10/2026)

Dùng cho MỌI video: đầu video bật đèn (ảnh bàn làm việc giống trang chủ web, laptop chiếu trang Bộ công cụ) → hiện logo mới (Đốm chào) + TIÊU ĐỀ VIDEO; cuối video (7s, cập nhật 14/10 18:45): tường sáng không laptop, logo + Đốm (bản `-sang` cho rõ nét) + nút Follow "& Đồng hành cùng Đốm nhé!" + "Cảm ơn anh chị!" → Đốm bay lên kéo dây → đèn tắt → Đốm ngủ phát sáng → tối hẳn.

- `dung_mo_dau.py "DÒNG 1|DÒNG 2" <thư mục dự án HyperFrames>` → ghi `index.html` (mở đầu 5s) và `ket.html` (kết 5s). Dấu `|` = xuống dòng; dấu `&` tự tô màu nhấn.
- Thư mục dự án cần `assets/`: `mo-dau.css`, `gsap.min.js`, `fonts/` (Be Vietnam Pro 800), `img/` gồm desk-off.jpg, desk-on.jpg (site/public/assets), bo-cong-cu.jpg (site/public/assets/screen), logo-ngang-nen-sang.png, logo-ngang-nen-sang.png (brand/logo-dom); Đốm: dom-01-chao-sang, dom-10-vui-sang, dom-12-ngu-toi (brand/dom); font Lora italic + Be Vietnam Pro 700/800.
- Render: `npx hyperframes@0.8.147 render -q high -w 2 -o mo-dau.mp4` (đổi ket.html thành index.html để render phần kết).
- Âm thanh: ghép ở bước trộn – 3–5 giây đầu nhạc thương hiệu (0,6), tiếng tách dây đèn ở giây 1,05; kết: tiếng vút giây 3,95, tiếng tách dây đèn giây 4,88, nhạc tắt dần theo đèn.
- Bản đã dựng cho v01: `tap/v01-tro-lai-cung-dom/xuat/mo-dau-v01.mp4`, `ket.mp4`.
