# Quy trình nội bộ: yêu cầu về dữ liệu cá nhân & sự cố dữ liệu

## A. Khi nhận email "Yêu cầu dữ liệu cá nhân" tới quantritute@gmail.com
| Bước | Việc | Hạn (đã công bố ở trang Chính sách) |
|---|---|---|
| 1 | Trả lời xác nhận đã nhận (mẫu bên dưới); ghi 1 dòng vào sổ theo dõi (ngày nhận, email, loại yêu cầu, hạn) | 2 ngày làm việc |
| 2 | Xác minh đúng người: yêu cầu gửi từ chính email đã đăng ký, hoặc đối chiếu SĐT/nội dung đã gửi | – |
| 3 | Tìm dữ liệu trong Quản trị: Góp ý, Đề xuất, Lịch hẹn, Người đăng ký, Gửi link (ô tìm kiếm theo email/SĐT) | – |
| 4a | Xem / cung cấp / sửa: gửi lại thông tin đang lưu hoặc sửa trực tiếp trong Quản trị | 10 ngày |
| 4b | Rút đồng ý / hạn chế / phản đối: huỷ đăng ký thư, xoá thông tin liên hệ, ghi chú "không liên hệ" | 15 ngày |
| 4c | Xoá: xoá bản ghi trong Quản trị (nút Xoá ở từng mục) | 20 ngày |
| 5 | Email báo đã xong + ghi ngày hoàn thành vào sổ | – |

Không xoá được vì lý do pháp luật (ví dụ đang có tranh chấp) → trả lời rõ lý do. Dữ liệu Clarity: hướng người dùng tới Microsoft (privacy.microsoft.com).

**Mẫu trả lời xác nhận:**
> Chào anh/chị, Quản trị tử tế đã nhận yêu cầu về dữ liệu cá nhân của anh/chị ngày …/…/2026. Yêu cầu sẽ được xử lý trong … ngày theo Chính sách bảo vệ dữ liệu cá nhân (quantritute.com/chinh-sach-du-lieu/). Nếu cần xác minh thêm, em sẽ liên hệ lại qua email này. – Đỗ Minh Tuấn

## B. Khi nghi ngờ lộ, mất dữ liệu (lộ mật khẩu quản trị, lộ API key, database bị truy cập lạ…)
1. **Chặn ngay:** đổi mật khẩu quản trị (ADMIN_TOKEN), khoá/đổi khoá Cloudflare, Resend, Anthropic; xem lại Cloudflare Access.
2. **Ghi lại:** thời điểm phát hiện, dữ liệu nào, bao nhiêu người, nguyên nhân dự kiến (giữ ảnh chụp, log).
3. **Báo cơ quan chuyên trách bảo vệ dữ liệu cá nhân (Bộ Công an – A05) chậm nhất 72 giờ** từ khi phát hiện (Điều 23 Luật 91/2025; mẫu thông báo theo NĐ 356/2025 – kiểm tra mẫu hiện hành trước khi gửi). Cần luật sư hỗ trợ nếu sự cố lớn.
4. **Báo người bị ảnh hưởng** qua email nếu có nguy cơ gây hại (bị lộ gì, đã làm gì, họ nên làm gì).
5. Sửa nguyên nhân, ghi bài học vào file này.

⚠️ Số điều, mẫu biểu NĐ 356/2025 lấy theo checklist vn-law-check và bài tóm tắt; cần đối chiếu toàn văn trên thuvienphapluat.vn trước khi dùng.
