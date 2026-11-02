# Kho riêng (Kho nghiên cứu + Sổ tay) – trang có mật khẩu

**Là gì:** bản online của `Nghiên cứu kênh YouTube/Kho-nghien-cuu-YouTube.html` + tính năng **Sổ tay** (kỷ niệm, nhật ký, bài học, ý tưởng). Chỉ anh Tuấn dùng; mọi đường dẫn (kể cả file dữ liệu) đều phải đăng nhập.

| Thành phần | Ở đâu |
|---|---|
| Dự án Cloudflare Pages | `quantritute-kho` → `https://quantritute-kho.pages.dev` + tên miền phụ anh gắn (đề xuất `kho.quantritute.com`) |
| Mã | `quantritute/kho/`: `functions/_middleware.js` (cổng mật khẩu), `functions/api/[[path]].js` (API), `lib/auth.js`, `public/` (trang) |
| Dữ liệu | Database `quantritute-db` (dùng chung với web, **bảng riêng** `kho_notes`, `kho_picks`, `kho_login_fail`) → `sao-luu.cmd` sao lưu luôn sổ tay |
| Mật khẩu | Secret `KHO_PASSWORD` trên Cloudflare (không nằm trong file nào). Tối thiểu 10 ký tự |
| File dữ liệu kho | `kho/public/index.html` (~6 MB, không đưa lên GitHub – dựng lại được từ thư mục Nghiên cứu) |

## Lần đầu đưa lên
1. PowerShell tại `quantritute`: `.\trien-khai-kho.cmd` → khi được hỏi, gõ mật khẩu rồi Enter.
2. Cloudflare → Workers & Pages → `quantritute-kho` → **Custom domains** → **Set up a domain** → gõ `kho.quantritute.com` → xác nhận. Chờ **Active** (vài phút, HTTPS tự cấp).
3. Mở `https://kho.quantritute.com` → đăng nhập.
4. (Nếu đã có ★/ghi chú/bài viết ở bản file trên máy) mở bản file → **⇅ Sao lưu** → tải `.json` → vào bản online → **⇅ Sao lưu** → Khôi phục từ file.

## Việc thường gặp
| Việc | Cách làm |
|---|---|
| Cập nhật kho (thêm kênh/sách mới) | Claude dựng lại `kho/public/index.html` → anh chạy `.\trien-khai-kho.cmd` |
| Đổi mật khẩu | `.\trien-khai-kho.cmd doi-mat-khau` (mọi phiên đăng nhập cũ tự hết hạn) |
| Quên mật khẩu | Đổi mật khẩu như trên (đặt mới, không cần mật khẩu cũ) |
| Khóa thêm một lớp (khuyên dùng) | Cloudflare → Zero Trust → Access → Applications → thêm `kho.quantritute.com` và `quantritute-kho.pages.dev`, chỉ cho phép email của anh |
| Sao lưu | `.\sao-luu.cmd` (database gồm cả sổ tay) + trong kho bấm **⇅ Sao lưu** tải `.json`/`.md` |

## An toàn
- Phiên đăng nhập 30 ngày (cookie HttpOnly, Secure, SameSite=Strict). Nút **Thoát** để đăng xuất trên máy lạ.
- Nhập sai 8 lần trong 15 phút → khóa 15 phút theo địa chỉ IP.
- Trang gắn `noindex`, `robots.txt` chặn toàn bộ: Google không lập chỉ mục.
- Xóa bài: vào **Thùng rác** trước, khôi phục được; "Xóa vĩnh viễn" mới mất hẳn.
