# Cổng tuyển dụng – máy chủ THỬ NGHIỆM (recruit.quantritute.com)
> Làm 11/11/2026 theo chốt của anh 19:32: "phương án 1 (bản thử), link recruit.quantritute.com, không dùng R2".
> Phần mềm: `nguon/src/tuyendung.js` (hằng `TD_THU`, các hàm `tdThuPush`, `tdThuPull`, `tdOpenTab`, `tdImportApp`).

## Chạy thế nào
- Người dùng thử bấm **Mở link** ở Cổng tuyển dụng → phần mềm tạo **mã cổng** (10 ký tự, nằm trong link) + **khóa bí mật** (32 ký tự, chỉ trình duyệt đó giữ), dựng trang cổng (`tdPortalHtml`, mode `live`) và gửi lên `POST /api/cong`, rồi mở `https://recruit.quantritute.com/t/<mã>/<công ty>[/<vị trí>|/ve-chung-toi]`.
- Ứng viên nộp trên trang → `POST /api/ung-tuyen` → lưu D1 (CV chia phần ≤ 1,5 MB vì D1 giới hạn 2 MB/dòng; CV tối đa 5 MB).
- Phần mềm tự lấy hồ sơ mỗi 45 giây khi đang mở (và khi vào Ngân hàng ứng viên / Cổng tuyển dụng) → `GET /api/cong/ho-so`, `GET /api/cong/cv` → nhập vào Ngân hàng ứng viên + kho CV → `POST /api/cong/da-lay` → **máy chủ xóa ngay**.
- Tự xóa: trang cổng, hồ sơ, CV quá **24 giờ** (cron mỗi giờ, phút 17, + dọn ngẫu nhiên khi có yêu cầu). Nút "Tắt cổng thử" xóa ngay.
- Không kết nối được (chưa triển khai, mất mạng) → phần mềm mở trang ngay trên máy (blob) như trước, hồ sơ vẫn về phần mềm qua tab.

## Triển khai (anh chạy)
Đứng ở `quantritute\cong-cu\quan-ly-nhan-su\tuyen-dung-thu`: `.\trien-khai.cmd` – lần đầu tự tạo database `qtt-tuyen-dung-thu-db` và điền id vào `wrangler.jsonc`; gắn tên miền `recruit.quantritute.com` (custom domain, lần đầu có thể mất vài phút).

## Pháp lý – lưu ý
- Ngoại lệ có chủ đích với nguyên tắc "dữ liệu khách hàng không nằm trên máy chủ của Tuấn": chỉ phục vụ **bản dùng thử với dữ liệu mẫu**; trang có dải báo "Vui lòng không nhập thông tin thật; hồ sơ tự xóa sau 24 giờ"; không lập chỉ mục tìm kiếm (noindex).
- Nên thêm 1 đoạn vào trang Chính sách dữ liệu quantritute.com nói về cổng thử (dữ liệu gì, lưu bao lâu, xóa thế nào) – chờ anh duyệt nội dung.
- Bản chính thức: theo nguyên tắc anh chốt, mỗi công ty dựng cổng trên **tài khoản Cloudflare của chính công ty**, phần mềm chỉ hướng dẫn tạo và nối (thiết kế: `../nguon/_nhanh-tuyen-dung/may-chu/THIET-KE-KET-NOI.md`).

## Đã thử (11/11, wrangler dev cục bộ)
Mở link danh sách / vị trí / Về chúng tôi; điều hướng trong trang đổi đúng đường dẫn, nút Quay lại hoạt động; "điện thoại" khác mở link, nộp hồ sơ kèm CV → phần mềm tự lấy về Ngân hàng ứng viên kèm CV; CV 3,3 MB lưu – tải về khớp từng byte; lấy xong máy chủ còn 0 hồ sơ; sai khóa bị chặn; mã không tồn tại → trang "Link đã hết hạn" (410).
