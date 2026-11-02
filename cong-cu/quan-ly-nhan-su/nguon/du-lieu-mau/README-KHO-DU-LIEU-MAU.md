# KHO DỮ LIỆU MẪU TỰ DỰNG – Công ty TNHH Đốm Sáng (hư cấu)

> Lập 02/11/2026 (hội thoại Phần 2). Thay hoàn toàn dữ liệu mẫu cũ (Tân Phát) – **dữ liệu cũ đã xóa hẳn ngày 02/11/2026**.
> **Toàn bộ là dữ liệu hư cấu**: tên người, CCCD, số sổ BHXH, số tài khoản, SĐT, email đều tự đặt (số giả có khối `0000` ở giữa, email `@domsang-demo.vn`). Tên ngân hàng là tên thật nhưng số tài khoản giả.
> Sinh lại bất cứ lúc nào: `cd nguon` → `python tao-kho-du-lieu-mau.py` → `node tao-du-lieu-mau.js` → `node build.js`. Kiểm tra cảnh báo: `node _kiem-tra-mau.js`.

## 1. Kịch bản (khớp câu chuyện gốc của series)
- Công ty nhỏ phân phối thiết bị chiếu sáng, **9 hồ sơ** (8 người đang làm + 1 người vừa nghỉ), 4 bộ phận.
- **Chủ nhật 11/10/2026 chuyển văn phòng mới** (5 người đi làm, tính tăng ca Chủ nhật); từ 05/10 chấm công tại văn phòng mới.
- Chuyên viên hành chính – nhân sự **nghỉ việc 02/10/2026** → kế toán trưởng **kiêm nhiệm nhân sự từ 05/10**. Kế toán viên đang nghỉ thai sản → phòng Kế toán – Hành chính chỉ còn 1 người đi làm.
- Hệ quả "lộ ra" trong dữ liệu (đúng nỗi đau của người kiêm nhiệm): 1 HĐ hết hạn chưa ký lại, quỹ phép chưa cập nhật, nhân viên mới thử việc ký sai, bảng lương tháng 10 quên tăng lương.
- **Ngày chốt dữ liệu: 31/10/2026** (phần mềm tự đặt khi bấm "Dùng dữ liệu mẫu").

| Mã | Họ tên | Bộ phận | Chức danh | Ghi chú |
|---|---|---|---|---|
| DS001 | Trần Quang Minh | Ban Giám đốc | Giám đốc | HĐ không xác định thời hạn |
| DS002 | Nguyễn Thị Thu Hà | Kế toán – Hành chính | Kế toán trưởng | Kiêm nhân sự từ 05/10/2026 |
| DS003 | Lê Thị Ngọc Anh | Kế toán – Hành chính | Chuyên viên HCNS | **Nghỉ việc 02/10/2026** |
| DS004 | Phạm Thu Trang | Kế toán – Hành chính | Kế toán viên | **Nghỉ thai sản 04/05 → 03/11/2026** |
| DS005 | Hoàng Văn Đức | Kinh doanh | Trưởng phòng | Đã ký 2 HĐ xác định thời hạn; tăng lương từ 01/10/2026 |
| DS006 | Vũ Thị Mai Phương | Kinh doanh | Nhân viên KD | Sinh nhật 20/10; HĐ 12 tháng sắp hết |
| DS007 | Đặng Minh Khoa | Kinh doanh | Nhân viên KD | **Mới vào 05/10/2026**, đang thử việc |
| DS008 | Bùi Văn Thắng | Kho – Giao nhận | Thủ kho | Tăng ca; đi muộn 3 lần tháng 10 |
| DS009 | Ngô Văn Hiếu | Kho – Giao nhận | Giao hàng | HĐ hết hạn 14/10/2026 chưa ký lại |

## 2. Cấu trúc
| Thư mục / file | Nội dung | Dùng để |
|---|---|---|
| `Du_lieu_nhan_su_Dom_Sang/` | Bộ chuẩn 9 file (danh mục, hồ sơ, sổ HĐ, lịch sử lương, chấm công T08–T10, đơn nghỉ + quỹ phép, bảng lương T08–T09) | "Dùng dữ liệu mẫu" / "Chọn thư mục" – ảnh chụp, video |
| `thang-moi/Bang_luong_2026_T10.xlsx` | Bảng lương tháng 10 kế toán vừa làm | Thử "Nạp file tháng mới" – bước kiểm tra bắt được lỗi lương DS005 |
| `nhap-thu/Kieu_A_Danh_sach_don_gian.xlsx` | Danh sách tự làm: tiêu đề dòng 1, tên cột khác ("Mã nhân viên", "Họ tên", "Bộ phận", "SĐT"…), ngày lẫn chữ/ngày, SĐT & CCCD mất số 0, 1 tên viết HOA, 1 tên thừa khoảng trắng, **1 dòng trùng, 1 dòng thiếu mã** | Phần 2 – nhập dữ liệu: nhận diện cột, làm sạch, báo lỗi trước khi lưu |
| `nhap-thu/Kieu_B_Cham_cong_dang_luoi_T10.xlsx` | Chấm công dạng lưới (1 người/dòng, cột ngày 1–31), tiêu đề gộp ô, 2 dòng tiêu đề (ngày + thứ) | Phần 2 – mẫu chấm công kiểu bảng tay |
| `nhap-thu/Kieu_C_Log_may_cham_cong_T10.xlsx` | Log thô máy chấm công: tiêu đề tiếng Anh (AC-No., Name, Time, State), **mã chấm công 1–9 thay cho mã NV** (ghép qua cột "Mã chấm công" trong hồ sơ), tên không dấu, mỗi lượt bấm 1 dòng, có lượt bấm trùng | Phần 2 – "mẫu theo hãng máy chấm công", ghép mã |

> Kiểu A, B, C **chưa nạp được** ở bản hiện tại (bộ đọc mới nhận tên cột chuẩn) – đây là đầu vào để xây tính năng nhập dữ liệu Phần 2.

## 3. Lỗi cài sẵn – kết quả kiểm tra tại 31/10/2026 (15 cảnh báo)
| Mức | Cảnh báo | Người |
|---|---|---|
| Gấp | HĐ 24 tháng hết hạn 14/10, đã quá 17 ngày, chưa ký mới (còn 13 ngày trước khi HĐ tự thành không xác định thời hạn) | DS009 |
| Gấp | Lương thử việc 7.500.000 < 85% lương khởi điểm 9.000.000 | DS007 |
| Cần xử lý | Thử việc 61 ngày, vượt khung 60 ngày (trình độ đại học) | DS007 |
| Cần xử lý | Hồ sơ thiếu số sổ BHXH | DS007 |
| Cần xử lý | HĐ thử việc hết hạn sau 34 ngày | DS007 |
| Cần xử lý | HĐ 12 tháng hết hạn sau 29 ngày | DS006 |
| Cần xử lý | HĐ 36 tháng hết hạn sau 39 ngày + đã ký đủ 2 HĐ xác định thời hạn → lần tới bắt buộc HĐ không xác định thời hạn | DS005 |
| Cần xử lý | Quỹ phép ghi đã nghỉ 4, đơn đã duyệt là 5 | DS005 |
| Cần xử lý | Hết thai sản 03/11, đi làm lại 04/11 | DS004 |
| Cần xử lý | Đơn nghỉ phép 05–06/11 đang chờ duyệt | DS006 |
| Cần xử lý | 27/10 chấm nghỉ ốm nhưng không có đơn | DS009 |
| Theo dõi | Đi muộn 3 lần tháng 10 (55 phút) | DS008 |
| Theo dõi | Sinh nhật 20/10 | DS006 |
| Theo dõi | 1 hồ sơ người đã nghỉ chưa đặt thời hạn lưu (Luật BVDLCN) | DS003 |
| Khi nạp lương T10 | Lương cơ bản 14.000.000 khác mức hiệu lực 15.500.000 (QĐ 05/2026 hiệu lực 01/10) | DS005 |

- Bảng lương T08, T09 **khớp 100%** với chấm công và quyết định lương (để thấy phần mềm không báo nhầm).
- Bảng điều hành: 8 người đang làm (7 đi làm + 1 thai sản), tháng 10: +1 vào, −1 nghỉ; 3 HĐ sắp hết hạn + 1 đã hết hạn; 1 đơn chờ duyệt.

## 4. Giả định tính lương (DỮ LIỆU MẪU – không phải tư vấn, đơn vị tự rà lại)
- Công chuẩn = số ngày Thứ Hai–Thứ Sáu trong tháng (gồm ngày lễ). Lương thời gian = (lương cơ bản + phụ cấp chức vụ) ÷ công chuẩn × (ngày công + phép + lễ).
- Tăng ca: lương cơ bản ÷ công chuẩn ÷ 8 × 150% (ngày thường), 200% (Chủ nhật); phần trả cao hơn ngày thường không tính thuế.
- BHXH 8%, BHYT 1,5%, BHTN 1% trên lương cơ bản + phụ cấp chức vụ (trần 46.800.000); không đóng khi thử việc, thai sản cả tháng, hoặc làm dưới 14 ngày. Không có đoàn phí (chưa có công đoàn cơ sở).
- Giảm trừ gia cảnh 15.500.000 / 6.200.000; biểu thuế lũy tiến 5 bậc (5–10–20–30–35%, ngưỡng 10/30/60/100 triệu) – cùng cách tính với bản mẫu trước. **Thử việc: khấu trừ 10%** (giả định HĐ dưới 3 tháng). Tiền ăn ca 30.000 đ/ngày không tính thuế.
- ⚠️ Các mức trên **chưa được KTT duyệt**; trước khi đăng ảnh/video có con số lương, nhờ chị rà theo Phần 5 của series.
