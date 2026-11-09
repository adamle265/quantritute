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
| 05/11 | **Quy ước phiên bản A.B.C + mỗi phiên bản 1 link công khai + truyền thông theo phiên bản** – chi tiết mục 7; bản hiện tại đánh lại **0.1.1**; 3 việc chờ chốt ở mục 8 |
| 02/11 | **Đã xóa toàn bộ dữ liệu Tân Phát** (trong công cụ + thư mục bài 7.2) – chỉ dùng kho dữ liệu mẫu tự dựng Đốm Sáng |
| 02/11 | **Người dùng tự đổi màu toàn phần mềm (bản 0.9.0)**: 5 màu sáng – Xanh ngọc (mặc định), Xanh rêu, Xanh dương, Vàng, Kem – và 1 nền tối chung; tuỳ chọn "Theo máy". Đổi nhanh bằng nút bảng màu trên thanh trên/cuối menu, Ctrl K → "Đổi màu giao diện", hoặc Cài đặt |
| 02/11 | **Kho dữ liệu mẫu tự dựng XONG – chỉ dưới 10 nhân sự** (anh dặn 02/11: dữ liệu mẫu để dưới 10 người → **bỏ bộ lớn ~30 người mẹ + 2 con**). Công ty hư cấu **Công ty TNHH Đốm Sáng**: 9 hồ sơ (8 đang làm + 1 vừa nghỉ), chuyển văn phòng CN 11/10/2026, HCNS nghỉ 02/10 → KTT kiêm nhiệm; ngày chốt 31/10/2026; 15 cảnh báo cài sẵn; 3 kiểu file khác mẫu trong `nhap-thu/` để xây nhập dữ liệu. Chi tiết: `nguon/du-lieu-mau/README-KHO-DU-LIEU-MAU.md` (bản 0.8.2) |
| 06/11 | **ĐỔI HƯỚNG PHÁT HÀNH** (anh 07:06): không chia nhỏ module để phát hành/chia sẻ từng phần nữa → **hoàn thiện theo từng đợt rồi mới chia sẻ 1 lần**. Bản hiện tại **giữ số 0.1.1**, tiếp tục hoàn thiện thêm một số module; **khi anh báo xong 0.1.1 mới đưa lên trang tổng thể**. Chi tiết mục 9 (thay phần phát hành ở mục 7–8) |
| 06/11 | **Nhiều công ty độc lập** (anh sửa 07:39 – không phải mẹ – con): dữ liệu mẫu 2 công ty **Công ty TNHH Đốm Sáng Edu** (9 hồ sơ) + **Công ty TNHH Đốm Sáng Health** (7 người), "Dùng dữ liệu mẫu" nạp cả 2; ô Đơn vị chọn từng công ty hoặc **"Tổng các công ty" + tích chọn công ty gộp dữ liệu** |
| 06/11 | **Anh duyệt xuất bản 0.1.1 = bản mở đầu, xong 2 tính năng của Tổng quan (Bảng điều hành, Việc cần xử lý)** (10:56). Nguồn chốt `nguon/_ban-0.1.1/` (bản nội bộ cũ đổi tên `_ban-0.1.1-noi-bo-0511`); `phien-ban.json` còn 1 bản; bỏ 012, bỏ làm mờ menu, phông nội bộ. **Bài mở đầu anh duyệt** (bỏ câu hỏi cuối) – `04_Nội dung - Marketing/Series phần mềm nhân sự/bai-mo-dau-hanh-trinh.md`; ảnh em chụp từ trang công khai sau khi lên web. Công cụ miễn phí cho đơn vị dưới 20 người |
| 06/11 23:20 | **Module Nhân sự** (4 tính năng): **cho thêm/sửa đầy đủ trong phần mềm** (lưu trình duyệt, xuất lại Excel gốc) – thay quyết định GĐ1 "chỉ đọc" cho nhóm Nhân sự; **bổ sung hồ sơ giấy tờ vào dữ liệu mẫu**; **làm luôn mẫu văn bản hợp đồng** (cần chị KTT rà nội dung trước khi công khai); làm **lần lượt, anh duyệt từng tính năng**: Sơ đồ tổ chức → Danh sách → Hồ sơ → Hợp đồng |
| 08/11 | **Đưa máy chủ chấm công tới từng công ty**: cách chính **A – nút "Deploy to Cloudflare"** (công ty tự tạo tài khoản Cloudflare bằng email chung, bấm cài); **C – Quản trị tử tế cài hộ** làm dịch vụ (mời vào tài khoản, cài xong gỡ quyền, biên bản bàn giao). Bỏ phương án phát `trien-khai.cmd`. **Test sau khi hoàn thiện phần mềm** trên một tài khoản Cloudflare trắng |
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
| Mở đầu | Fanpage – bài mở đầu bản 0.1.1 | 06/11/2026 14:00 (anh hẹn lịch) | | Anh duyệt bài + 6 ảnh 06/11 11:38: `04_Nội dung - Marketing/Series phần mềm nhân sự/bai-mo-dau-hanh-trinh.md` + `anh-bai-mo-dau-01…06` |
| Bản 0.3.1 – Chấm công | Fanpage – bài cập nhật NGÀY 3 | (chờ anh duyệt, đăng sau khi 0.3.1 lên web) | quantritute.com/quan-ly-nhan-su/031 | Bài + 14 ảnh soạn 08/11: `bai-cap-nhat-0.3.1.md` + `anh-031-01…14`; nguồn ảnh `_nguon-anh-031/`; bình luận đầu có thêm link chấm công thử chamcong-thu |
| Bản 0.2.1 – Nhân sự | Fanpage – bài cập nhật phiên bản | (chờ anh duyệt, đăng sau khi 0.2.1 lên web) | quantritute.com/quan-ly-nhan-su/021 | Bài + 6 ảnh soạn 07/11: `bai-cap-nhat-0.2.1.md` + `anh-bai-021-01…06`; nguồn dựng ảnh `_nguon-anh-021/` |

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

- **Ảnh đăng kèm – bổ sung 07/11 11:15:** số lượng ảnh không giới hạn 6, chọn các màn hình/tính năng nổi bật, bỏ ảnh quá chi tiết (vd hộp chọn cột, form thêm người, popup xem nhanh). **KHÔNG in số thứ tự (01/06…) lên ảnh** để anh tự chọn ảnh mà không lệch số; thứ tự chỉ để ở tên file.
- **Ảnh đăng kèm (anh chốt 06/11 11:19):** đúng màu thương hiệu Quản trị tử tế (nền giấy #F4EFE5, chữ #231E19/#6A6157, bìa cũng nền sáng thương hiệu + Đốm chào (anh chốt 11:31), Lexend, câu IBM Plex Mono "QUẢN TRỊ LẤY CON NGƯỜI LÀM GỐC"); chụp phần mềm ở màu **Xanh rêu**; 1 ảnh bìa + tối đa 5 ảnh tính năng (anh chốt 11:31). Mã dựng ảnh: chụp từ trang công khai /quan-ly-nhan-su/<bản> bằng Chrome.

- **Việc tiếp theo (06/11 chiều, hội thoại mới):** làm các module tiếp theo cho đợt sau 0.1.1. Đọc mục 9 + bảng module mục 8 trước khi bắt đầu; mã nguồn đang làm ở `nguon/src/`, bản 0.1.1 đã chốt ở `nguon/_ban-0.1.1/` (không sửa).

## 7. Quy ước phiên bản & phát hành (anh chốt 05/11/2026 – ⚠️ phần phát hành theo từng module đã được THAY bằng mục 9 ngày 06/11)
**Số phiên bản `A.B.C`**
| Số | Ý nghĩa | Ví dụ |
|---|---|---|
| A | 0 = đang hoàn thiện; **1** = hoàn thiện hết và xuất bản toàn bộ công cụ; sau đó chỉ tăng khi có thay đổi, sửa chữa lớn | 0.x.x → 1.0.0 |
| B | Số thứ tự **module** (nhóm trên menu): 1 Tổng quan · 2 Nhân sự · 3 Chấm công · 4 Lương · 5 Tuyển dụng · 6 Hội nhập · 7 Đào tạo nội bộ · 8 Bảo hiểm xã hội · 9 Cài đặt hệ thống | 0.**1**.x = Tổng quan |
| C | Lần chỉnh sửa / cập nhật **lớn** trong module đó (xong 1 tính năng con, hoặc 1 đợt cập nhật lớn); **về 1 khi sang module mới** | 0.1.1 Bảng điều hành → 0.1.2 Việc cần xử lý → 0.2.1 Sơ đồ tổ chức |
- **Bản hiện tại = 0.1.1** (Bảng điều hành, khung giao diện, kho dữ liệu mẫu, đổi màu – gộp mọi bản nội bộ 0.4.0 → 0.10.6 trước đó). Số nội bộ cũ chỉ còn trong nhật ký README.
- Tiếp theo: duyệt xong **Việc cần xử lý** → **0.1.2**; xong **Sơ đồ tổ chức** → **0.2.1**; …
- Sửa nhỏ (màu, chữ, lỗi hiển thị) giữa 2 bản lớn **không đổi số** – ghi vào nhật ký README kèm ngày (đề xuất, chờ anh xác nhận).

**Mỗi phiên bản = 1 link công khai riêng, không ghi đè**
- Mỗi bản lớn xuất bản 1 link riêng, bản sau không thay bản trước → xem lại được toàn bộ hành trình phát triển.
- Nơi đặt link: **chưa chốt** (đề xuất mục 8).

**Truyền thông theo phiên bản**
- Mở đầu: 1 bài đặt vấn đề + hướng sẽ làm (bài Phần 1 – nháp đã có, chờ anh duyệt).
- Mỗi phiên bản mới: 1 hoặc nhiều bài (nếu nội dung lớn) – module vừa xong, tính năng đã xây, cải tiến của các module trước (nếu có), cách các module kết nối với nhau; **kèm 1 video về module mới**.
- Mọi bài, ảnh, video gắn **link của đúng phiên bản** đang nói tới.

## 8. Anh chốt thêm (05/11/2026 18:58)
1. **Số module B theo THỨ TỰ HOÀN THÀNH, không nhảy số** (không theo vị trí trên menu). Giữ bảng đối chiếu dưới đây, cập nhật khi xong mỗi module.
2. **Link từng phiên bản đặt trên web** – anh chốt lại 05/11 19:08: `quantritute.com/quan-ly-nhan-su/<số bản viết liền, bỏ dấu chấm>` (ví dụ `quantritute.com/quan-ly-nhan-su/011`); trang lịch sử `quantritute.com/quan-ly-nhan-su`. Làm bằng `nguon/xuat-ban.js`, đưa lên bằng `xuat-ban-web.cmd` 
3. **Bản thử Chấm công Wi‑Fi**: chưa quan trọng – khi làm tới module chấm công thì tận dụng bản đã xây, tối ưu và tích hợp vào công cụ chung (bỏ số riêng của bản thử).
4. **Bản công khai dùng bộ dữ liệu mẫu tự dựng, các số liệu là giả định** – ghi rõ trên trang.

| B | Module (thứ tự hoàn thành) | Các bản |
|---|---|---|
| 1 | Tổng quan (Bảng điều hành, Việc cần xử lý) | 0.1.1 Bảng điều hành (05/11) · 0.1.2 Việc cần xử lý + Việc định kỳ (anh duyệt 05/11 19:47) – **module 1 xong** |
| 2 | Nhân sự (Sơ đồ tổ chức · Danh sách nhân sự · Hồ sơ nhân sự · Hợp đồng) – làm 06/11 23:10 → 07/11 09:37 | **0.2.1 – anh chốt hoàn thành 07/11 09:37** (gồm Kho hồ sơ, Kho HĐ đã ký, Kho HĐ mẫu + trình soạn kiểu Word, xem nhanh từ hồ sơ). Link `/quan-ly-nhan-su/021` |
| 3 | Chấm công (Thiết lập chấm công · Tổng hợp công · Nghỉ phép · Chấm công Wi‑Fi) | **0.3.1 – bắt đầu 07/11/2026**, phạm vi dự kiến ở `nguon/phien-ban-du-kien.json` (hiện trên trang Lịch sử là "Đang làm") |

## 9. Hướng mới – hoàn thiện theo đợt (anh chốt 06/11/2026 07:06, thay phần phát hành ở mục 7–8)
- **Không phát hành, chia sẻ từng module nhỏ nữa.** Tập trung hoàn thiện theo từng đợt, xong đợt mới chia sẻ phiên bản **1 lần**.
- **Bản đang làm = 0.1.1** (giữ số; gồm Bảng điều hành, Việc cần xử lý + Việc định kỳ, xem nhiều công ty độc lập + Tổng các công ty, và thêm một số module nữa). Số `VER` trong `nguon/build.js` đã đưa về `0.1.1`.
- **Khi anh báo "xong 0.1.1"** → em mới lưu lên trang tổng thể `quantritute.com/quan-ly-nhan-su` (dọn `phien-ban.json` còn 1 bản 0.1.1 lấy từ `src`, bỏ thư mục công khai `012`). Đến lúc đó **không làm gì thêm** với link công khai; các link 011/012 đã tạo 05/11 để nguyên cho tới khi anh báo.
- Ảnh/bản công khai từ nay **hiển thị đủ tính năng, đều sáng** – bỏ cơ chế làm mờ menu theo phiên bản (`xong` trong `phien-ban.json`, `QTT_DONE` trong `xuat-ban.js`) khi xuất bản lần tới.
- **Bài chia sẻ co lại cho chất lượng:**
  | Bài | Khi nào | Ghi chú |
  |---|---|---|
  | 1 bài mở đầu | Sau khi anh góp ý | Bản nháp `bai-mo-dau-hanh-trinh.md` (05/11) sẽ **viết lại theo góp ý của anh**; ảnh kèm hiển thị **đủ tính năng, đều sáng** |
  | Bài cập nhật phiên bản tiếp theo | Mỗi khi xong 1 đợt (0.1.1 → …) | 1 bài / phiên bản |
  | Bài xuất bản công cụ hoàn thiện | Bản 1.0.0 | |
  | Bài cập nhật tính năng sau góp ý | Khi có góp ý đáng làm | |
- Bảng module mục 8 giữ lại làm lịch sử; thứ tự module vẫn theo thứ tự hoàn thành nhưng **không gắn với lần phát hành**.



## 10. Bản 0.2.1 (anh chốt 07/11/2026 09:37)
- Đợt 2 xong = **0.2.1 – module Nhân sự**. Số bản theo mục 7: B = module thứ tự hoàn thành (2 = Nhân sự), C về 1. Bản tiếp theo: **0.3.1 – Chấm công** (bắt đầu 07/11).
- Xuất bản: `nguon/_ban-0.2.1/` (nguồn chốt, có `mau.b64` riêng) → `xuat-ban-web.cmd` (chỉ tạo bản chưa có; 011 giữ nguyên) → `quantritute.com/quan-ly-nhan-su/021` + trang Lịch sử có thẻ "Đang làm" (từ `nguon/phien-ban-du-kien.json`, sửa file này khi đổi phạm vi; để trống khi không có bản đang làm).
- Anh chốt 07/11 09:37: kho file bản chính thức lưu trên **Cloudflare riêng của đơn vị sử dụng** (bản thử giữ trên trình duyệt); dữ liệu mẫu **cập nhật liên tục cho đúng các thay đổi anh yêu cầu**; giấy tờ thiếu = **1 đầu việc gộp** trong Việc cần xử lý, mở ra có danh sách cụ thể.

- **Ảnh + tiêu đề chia sẻ (anh nhắc 07/11 11:22 – KHÔNG để anh nhắc lại):** mỗi lần xuất bản phiên bản mới phải (1) dựng ảnh `site/public/assets/tools/og/quan-ly-nhan-su-<số bản>.jpg` 1200×630 bằng `nguon/og/og.html` (ảnh chụp bản mới, pill số bản + module) – `xuat-ban.js` DỪNG nếu thiếu; (2) trang Lịch sử và ảnh chung `og/quan-ly-nhan-su.jpg` (trang /cong-cu/quan-ly-nhan-su) tự lấy ảnh bản mới nhất; (3) tiêu đề/mô tả chia sẻ nêu đúng số bản; (4) sau khi anh deploy: Facebook Sharing Debugger → **Thu thập lại** cho /quan-ly-nhan-su/, /quan-ly-nhan-su/<bản>/, /cong-cu/quan-ly-nhan-su; (5) nhắc anh sửa mô tả, trạng thái, phiên bản công cụ ở Quản trị → Công cụ.

### Quy tắc ảnh chia sẻ theo trang (anh chốt 07/11 11:32)
- Mỗi trang một ảnh riêng, đúng nội dung trang, không dùng chung: trang bản `/0xy/` = ảnh bản (màn hình module của bản đó); trang Lịch sử `/quan-ly-nhan-su/` = ảnh dòng thời gian các bản, dựng lại mỗi khi có bản mới (`quan-ly-nhan-su-lich-su-<mã bản>.jpg`); trang công cụ `/cong-cu/quan-ly-nhan-su` = ảnh giới thiệu công cụ (`quan-ly-nhan-su.jpg`), chỉ đổi khi thông điệp công cụ đổi.
- Sau khi lên web: dán từng link (có và không có `/` cuối, có `?nguon=facebook`) vào Facebook Sharing Debugger → Scrape Again.
