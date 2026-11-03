# Bật Cloudflare Access cho trang Quản trị (anh làm 1 lần, ~10 phút)

Hiện trạng (em kiểm 03/11/2026): https://quantritute-admin.pages.dev mở thẳng màn hình "Nhập mật khẩu quản trị" → ai có link cũng thử mật khẩu được. Access thêm 1 lớp: phải nhận mã qua email của anh mới thấy trang.

1. dash.cloudflare.com → menu trái **Zero Trust** (lần đầu: chọn tên nhóm, gói **Free**).
2. **Access → Applications → Add an application → Self-hosted**.
3. Application name: `Quản trị tử tế`. Session duration: `1 month` (đỡ phải nhập mã thường xuyên).
4. Application domain: `quantritute-admin.pages.dev` (để trống Path). Bấm **Add domain** thêm dòng `*.quantritute-admin.pages.dev` (bản xem trước).
5. Policy: name `Chỉ anh Tuấn`, Action **Allow**, Include → **Emails** → nhập email anh dùng đăng nhập (ví dụ quantritute@gmail.com).
6. Login methods: để **One-time PIN** → Save.
7. Thử: mở cửa sổ ẩn danh → vào trang quản trị → phải hiện màn hình Cloudflare hỏi email → nhập email → nhận mã → vào được màn hình mật khẩu như cũ.

Lưu ý: Worker `quantritute-watch` và web chính không bị ảnh hưởng. Nếu sau này dùng tên miền riêng cho quản trị thì thêm tên miền đó vào bước 4.

## Cập nhật 03/11/2026 – theo giao diện mới (Zero Trust → Access controls → Applications → Create new self-hosted application)
- Ô Domain chỉ liệt kê tên miền anh sở hữu (quantritute.com) → bấm **Switch to custom input**, gõ `quantritute-admin.pages.dev` (Subdomain, Path để trống).
- Nếu báo không hợp lệ: vào Workers & Pages → quantritute-admin → Settings → Access Policy → **Enable** (tự tạo app cho bản xem trước), rồi mở app đó trong Zero Trust và thêm `quantritute-admin.pages.dev` vào danh sách hostname.
- Access policies: Create new policy → Action Allow → Include: Emails = minhtuan.hadu@gmail.com (và quantritute@gmail.com nếu muốn).

## 03/11/2026 09:20 – Trang quản trị dùng tên miền admin.quantritute.com
Access ban đầu chỉ khoá quantritute-admin.pages.dev; admin.quantritute.com vẫn mở (em kiểm: vào thẳng trang quản trị). Cần thêm hostname thứ 2 vào cùng ứng dụng:
Zero Trust → Access controls → Applications → mở "quantritute-admin.pages.dev" → Edit/Configure → Destinations → + Add public hostname → Subdomain `admin`, Domain `quantritute.com`, Path để trống → Save.
