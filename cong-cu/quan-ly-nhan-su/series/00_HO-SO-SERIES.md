# HỒ SƠ SERIES – Hành trình xây phần mềm nhân sự cho doanh nghiệp nhỏ

> **Mọi hội thoại làm series này đọc file này ĐẦU TIÊN**, sau đó đọc `../README.md` (kỹ thuật) và `../cham-cong-thu/HUONG-DAN-TEST.md` (nếu làm chấm công).
> Cập nhật file này ngay khi: anh chốt quyết định, đăng bài/video, nhận góp ý từ fanpage, xong một phần.
> Lập 01/11/2026 (hội thoại "Phần mềm nhân sự – chấm công Wi-Fi").

## 1. Câu chuyện gốc (anh kể 01/11/2026 – dùng đúng, không thêm thắt)
- Công ty nơi vợ anh làm kế toán trưởng chuyển văn phòng mới; nhân sự **dưới 10 người**.
- Chuyên viên hành chính nhân sự vừa nghỉ → vợ anh **kiêm nhiệm** một phần công tác nhân sự, hỏi anh về việc lắp máy chấm công.
- Anh thấy chuỗi việc: chấm công trên máy → tải bảng chấm công từ máy → đưa sang bảng lương **mất nhiều thời gian, phức tạp** → tự hỏi có cách nào nhanh hơn; người kiêm nhiệm thì làm sao **gom mọi thứ về 1 ứng dụng**.
- Trước đây (anh) đã dùng nhiều phần mềm quản lý nhân sự: **chi phí khá cao**, quy mô SMEs **không tận dụng hết tính năng**. Khi viết: không nhắc nơi làm cũ/chuyện nghỉ việc (quy tắc kênh), không chê phần mềm khác.

## 2. Quyết định đã chốt
| Ngày | Quyết định |
|---|---|
| 01/11 | Chia sẻ hành trình theo từng phần trên **fanpage trước**; đăng group nhân sự/kế toán **sau khi hoàn thiện một số module** |
| 01/11 | Mỗi phần: xây module + soạn bài fanpage ở **1 hội thoại riêng**; mỗi video 1 hội thoại riêng (quy trình video chung). Liền mạch qua file này |
| 01/11 | **Bản online, 2 app**: (1) quản lý – trưởng phòng/chuyên viên nhân sự/kế toán kiêm nhiệm; (2) nhân viên – dùng trên điện thoại. Mỗi đơn vị dùng **tài khoản Cloudflare riêng**, anh không giữ dữ liệu. Dùng lại phần xử lý nghiệp vụ của bản 0.4.0 (offline) |
| 01/11 | Kết nối Cloudflare cho đơn vị: **cách A – nút "Deploy to Cloudflare"** (đơn vị cần tài khoản Cloudflare + GitHub; Cloudflare tự tạo D1, tạo repo trong GitHub của đơn vị; repo nguồn phải public). Cơ chế cập nhật bản mới cho đơn vị: **chưa thiết kế** |
| 01/11 | **Hồ sơ nhân sự đưa lên trước bảng lương** |
| 01/11 | Bảng lương có **phần cài đặt để đơn vị tự thiết lập công thức tính**; mức BHXH, giảm trừ… là cài đặt sửa được, không gắn cứng |
| 01/11 | Bài đăng **không ghi ngày cụ thể** cho từng phần |
| 01/11 | **Không dùng dữ liệu Tân Phát**: tự dựng kho dữ liệu mẫu hư cấu hoàn toàn (tên, CCCD, STK giả). Kịch bản chính 9 nhân sự vừa chuyển văn phòng; bộ lớn ~30 người (mẹ + 2 con); cố ý 2–3 kiểu file Excel khác nhau để test nhập liệu. Làm ở hội thoại Phần 2 |
| 01/11 | **Nhập dữ liệu đầu vào**: tự nhận diện cột + lấy dữ liệu tự động, **có bước xác nhận lại / sửa thủ công**; nhập tối thiểu 5 cột; nhân viên tự cập nhật hồ sơ (quản lý duyệt); lưu cách ghép cột để dùng lại; làm sạch + báo lỗi trước khi lưu; mẫu theo hãng máy chấm công; AI gợi ý ghép cột (chỉ gửi tên cột) làm sau |
| 01/11 | **Giao diện phần mềm: tông xanh rêu chuyển sắc (R3), bản dịu 0.5.2 (anh chỉnh 23:00: bớt đậm, bớt sặc sỡ)** – chuyển sắc chỉ ở khung, dữ liệu giữ màu phẳng, vàng Đốm làm điểm nhấn; bố cục menu 2 tầng 6 nhóm → 23 module, tìm nhanh Ctrl K, Bảng điều hành mở đầu bằng 1 câu tóm tắt (bản 0.5.1) |
| 01/11 | **Menu phần mềm dạng cây cha – con, mở sẵn đủ tính năng** (để chụp 1 màn hình chia sẻ tổng thể). Nhóm: Tổng quan · Nhân sự · Chấm công · Lương · Cài đặt hệ thống; Tuyển dụng, Hội nhập, Đào tạo nội bộ, Bảo hiểm xã hội là module chính đứng riêng (bỏ nhóm Phát triển) – bản 0.6.0 |
| 01/11 | Menu bản 0.6.1: **nền sáng**, không ghi "Phần N"/"Bản thử"; Nhân sự = Sơ đồ tổ chức → **Danh sách nhân sự (gộp tài khoản nhân viên)** → Hồ sơ nhân sự (→ Hợp đồng, chờ anh xác nhận vị trí); "Thiết lập công thức lương" |
| 01/11 | **Tuyển dụng = nhóm 4 tính năng**: Nhu cầu tuyển dụng · Tin tuyển dụng · Ứng viên & phỏng vấn · Mời nhận việc (bản 0.6.2, 25 tính năng) |
| 01/11 | **Màu giao diện chốt: XANH MINT đồng bộ** (thay xanh rêu) – thanh công cụ mint, khối tóm tắt/nút/biểu đồ cùng tông, vàng Đốm điểm nhấn (bản 0.7.0) |
| 02/11 | **Màu giao diện chốt cuối: XANH NGỌC** (thanh công cụ ngọc đậm chữ trắng, toàn giao diện đồng bộ ngọc, vàng Đốm điểm nhấn – bản 0.8.0; thay mint/rêu) |
| 02/11 | **Font chốt: Lexend** (font thương hiệu). Khung giao diện hoàn tất ở bản 0.8.1 – xanh ngọc, Lexend, menu cây 25 tính năng |
| 02/11 | **Đã xóa toàn bộ dữ liệu Tân Phát** (trong công cụ + thư mục bài 7.2) – chỉ dùng kho dữ liệu mẫu tự dựng Đốm Sáng |
| 02/11 | **Người dùng tự đổi màu toàn phần mềm (bản 0.9.0)**: 5 màu sáng – Xanh ngọc (mặc định), Xanh rêu, Xanh dương, Vàng, Kem – và 1 nền tối chung; tuỳ chọn "Theo máy". Đổi nhanh bằng nút bảng màu trên thanh trên/cuối menu, Ctrl K → "Đổi màu giao diện", hoặc Cài đặt |
| 02/11 | **Kho dữ liệu mẫu tự dựng XONG – chỉ dưới 10 nhân sự** (anh dặn 02/11: dữ liệu mẫu để dưới 10 người → **bỏ bộ lớn ~30 người mẹ + 2 con**). Công ty hư cấu **Công ty TNHH Đốm Sáng**: 9 hồ sơ (8 đang làm + 1 vừa nghỉ), chuyển văn phòng CN 11/10/2026, HCNS nghỉ 02/10 → KTT kiêm nhiệm; ngày chốt 31/10/2026; 15 cảnh báo cài sẵn; 3 kiểu file khác mẫu trong `nhap-thu/` để xây nhập dữ liệu. Chi tiết: `nguon/du-lieu-mau/README-KHO-DU-LIEU-MAU.md` (bản 0.8.2) |
| 31/10 | Chấm công: 1 chạm qua Wi-Fi văn phòng + QR động 30 giây dự phòng; chống chấm hộ chỉ **phát hiện** (máy dùng chung, máy lạ), không chặn, không chụp ảnh. Bản thử 0.2.1-thu ở `../cham-cong-thu/` |

## 3. Lộ trình series (anh chốt 01/11)
> **01/11 – Khung bố cục + giao diện chung mới (bản 0.5.1, màu xanh rêu chuyển sắc anh chốt 19:19)** đã dựng đủ 23 module theo bảng dưới; mỗi Phần sau chỉ việc lắp module vào khung (thay trang "Sắp có" trong `nguon/src/app.js` → `SOON`/`MODS`, đổi `st` từ số Phần thành `'ok'`). Bản xem: https://claude.ai/artifact/5JrGzAJrcoh5TV9NBax1Lj. **02/11: kho dữ liệu mẫu tự dựng đã thay Tân Phát (bản 0.8.2)** – từ nay chụp ảnh/quay video bằng "Dùng dữ liệu mẫu" (Công ty TNHH Đốm Sáng, ngày chốt 31/10/2026).
| Phần | Nội dung | Trạng thái |
|---|---|---|
| 1 | Lý do bắt đầu, hướng đi, tổng quan 2 app | Bài fanpage: **bản nháp 01/11 chờ anh duyệt** |
| 2 | Quản lý nhân sự, sơ đồ tổ chức, tài khoản nhân viên, nhập dữ liệu đầu vào, chấm công + tổng hợp công | **Kho dữ liệu mẫu xong 02/11** (bước 1); tiếp: sơ đồ tổ chức → danh sách/tài khoản NV → nhập dữ liệu (dùng `nhap-thu/` kiểu A, B, C) → ghép chấm công Wi‑Fi. Chấm công có bản thử |
| 3 | Thiết lập chấm công (quản lý), quản lý nghỉ phép | Chưa làm |
| 4 | Hồ sơ nhân sự | Chưa làm |
| 5 | Bảng lương, phiếu lương, thiết lập công thức tính | Chưa làm – cần chị (KTT) duyệt nghiệp vụ trước khi đăng |
| 6 | Báo cáo, dashboard | Chưa làm |
| 7 | Nâng cao: hội nhập + check-in/check-out · BHXH · đào tạo nội bộ · **tuyển dụng** | Chưa làm – BHXH cần chị duyệt |

## 4. Bài đăng & video đã đăng
| Phần | Kênh | Ngày đăng | Link | Ghi chú |
|---|---|---|---|---|
| 1 | Fanpage | | | Nháp: `04_Nội dung - Marketing/Series phần mềm nhân sự/phan-1-fanpage.md` |

Video: theo quy trình video chung – cần **1 hội thoại lập kế hoạch chuỗi (Cổng 1)** trước. Đề xuất (chưa chốt): mỗi phần 1 video hành trình anh nói 60–90s (series "Xây phần mềm nhân sự – Tập N", kết bằng 1 câu hỏi cụ thể) + video tính năng Đốm khi phần đó dùng thử được.

## 5. Góp ý nhận được (ghi nguyên văn, kèm ngày, nguồn)
| Ngày | Nguồn | Người góp ý (viết tắt) | Nội dung | Xử lý ở phần |
|---|---|---|---|---|
| | | | | |

## 6. Nguyên tắc nội dung
- Xưng "Tuấn/mình", gọi "anh/chị và các bạn" (skill viết caption). Không nhắc nơi làm cũ / chuyện nghỉ việc; không chê phần mềm khác.
- Mọi hình ảnh/video chỉ dùng **kho dữ liệu mẫu tự dựng**; không dùng dữ liệu công ty chị, không dùng Tân Phát.
- Không hứa "tính đúng 100%"; lương/BHXH/thuế TNCN ghi rõ đơn vị cần rà lại.
- Mỗi bài kết bằng **1 câu hỏi cụ thể** để lấy góp ý cho phần sau.
