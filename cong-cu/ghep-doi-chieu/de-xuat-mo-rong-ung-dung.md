# Ghép & đối chiếu 2 file Excel – Nghiên cứu ứng dụng thực tế & đề xuất tối ưu
22/10/2026 · Cơ sở: bản 1.4.1 (anh tạm duyệt), kinh nghiệm nghiệp vụ kế toán – HCNS – bán hàng, tài liệu tham khảo (MISA, quy tắc auto-reconciliation của phần mềm ERP).
⚠ Đây là nghiên cứu bàn giấy, **chưa khảo sát người dùng thật** → nên kiểm chứng với KTT và qua form đề xuất trên Bảng ghim trước khi làm.

## 1. Bản đồ ứng dụng theo vị trí công việc
| # | Vị trí | Nhiệm vụ | File A ↔ File B | Đặc thù gây khó khi khớp | Bản 1.4.1 |
|---|---|---|---|---|---|
| 1 | Kế toán ngân hàng | Đối chiếu sao kê – sổ 112 | Sao kê ↔ sổ chi tiết/sổ tiền gửi | Ngày có giờ, tiền vào/ra 2 cột, lệch ngày, tách khoản, **phí chuyển khoản bị trừ** (5.000.000 → 4.989.000), nhiều tài khoản/nhiều tháng | Đáp ứng tốt, thiếu dung sai số tiền & gộp nhiều file |
| 2 | Kế toán công nợ | Đối chiếu công nợ với khách/NCC | Sổ 131/331 của mình ↔ sổ/biên bản đối tác | **Nợ bên này = Có bên kia** (ngược dấu/ngược cột), số HĐ ghi khác nhau ("HĐ 0000123", "123"), cần **so số dư theo từng đối tượng** | Thiếu đảo dấu, gộp theo khóa, biên bản đối chiếu |
| 3 | Kế toán thuế | Hóa đơn cổng thuế ↔ sổ/bảng kê MISA | Bảng kê từ Bộ xử lý hóa đơn ↔ sổ 133/3331 | Khóa ghép = ký hiệu + số HĐ + MST; số HĐ mất số 0 đầu; MST có dấu "-"; **1 HĐ nhiều dòng hàng ↔ 1 dòng sổ**; HĐ kê khai nhầm kỳ | Thiếu chuẩn hóa ký tự, gộp dòng theo HĐ |
| 4 | Kế toán bán hàng / TMĐT | Đơn hàng ↔ đối soát sàn ↔ tiền về; đơn ↔ hóa đơn xuất | File sàn ↔ sổ/ báo cáo | Mã đơn có tiền tố/hậu tố, tiền về = tổng nhiều đơn trừ phí | Một phần (khớp tổng chỉ cùng ngày, không dung sai) |
| 5 | Kho | Kiểm kê ↔ sổ kho; nhập kho ↔ hóa đơn mua | Biên bản kiểm kê ↔ báo cáo tồn | Mã hàng gõ lệch ("SP-001"/"SP001"), so **số lượng** có dung sai, tên hàng viết khác | Thiếu chuẩn hóa ký tự, khớp gần đúng tên |
| 6 | Mua hàng | Đối chiếu 3 bên PO – phiếu nhập – hóa đơn | 3 file | Cần 3 file, khớp từng phần (giao nhiều đợt) | Chưa có (chỉ 2 file) |
| 7 | HCNS / C&B | Chấm công máy ↔ danh sách NV; lương ↔ danh sách BHXH/thuế TNCN | Nhiều file máy chấm công ↔ DS nhân sự | Mã NV khác hệ thống, **tên có/không dấu**, CCCD/MST cá nhân, nhiều file cần gộp | Thiếu bỏ dấu, gộp nhiều file |
| 8 | Sự kiện / đào tạo | Đăng ký ↔ check-in ↔ đã chuyển khoản | Form đăng ký ↔ danh sách check-in/sao kê | **SĐT** (0912…, +84 912…, 84912…), email hoa/thường, nội dung chuyển khoản chứa mã/tên | Thiếu chuẩn hóa SĐT, trích mã từ nội dung |
| 9 | Sales / CRM | Lọc trùng lead mới với khách cũ | DS lead ↔ CRM | SĐT/email/tên công ty viết khác ("Cty TNHH ABC" / "Công ty trách nhiệm hữu hạn ABC") | Thiếu khớp gần đúng |
| 10 | Kiểm soát nội bộ / quản lý | So 2 phiên bản cùng 1 file (tháng này – tháng trước, bản gửi – bản sửa) | File cũ ↔ file mới | Muốn biết **dòng thêm / bớt / sửa ô nào** | Làm được bằng kiểu 7 nhưng phải tự chọn từng cặp cột |

## 2. Khoảng trống & đề xuất (theo mức ưu tiên)
### P1 – Nên làm trước khi xuất bản (giá trị cao, phạm vi nhiều vị trí, công sức vừa)
| # | Đề xuất | Giải quyết cho | Ghi chú thiết kế |
|---|---|---|---|
| P1.1 | **Dung sai số tiền khi khớp** (± X đồng hoặc ± x%) cho cặp điều kiện số – kèm cột "chênh" | Phí chuyển khoản, làm tròn thuế, chênh tỷ giá (#1, #2, #4) | Khác với "lệch cho phép" hiện có (chỉ dùng khi so sánh sau khi đã khớp). Ưu tiên khớp chính xác trước, dung sai sau (đúng thứ tự phần mềm ERP khuyến nghị) |
| P1.2 | **Chuẩn hóa khóa nâng cao** (ô tick): chỉ giữ chữ + số ("KH-001" = "KH001", MST "0101-234-567"); bỏ dấu tiếng Việt (tên NV); chuẩn hóa SĐT (+84/84/0, dấu cách, chấm) | #3, #5, #7, #8, #9 | Hiện đã có "001 = 1" (bỏ số 0 đầu số HĐ) |
| P1.3 | **Gộp dòng theo khóa trước khi đối chiếu** (cộng tiền theo số HĐ / mã KH / tháng) | 1 HĐ nhiều dòng hàng ↔ 1 dòng sổ (#3); so **số dư công nợ theo từng đối tượng** (#2); tồn kho theo mã (#5) | Tùy chọn ở Bước 1 cho từng file: "Gộp theo cột … , cộng các cột …" |
| P1.4 | **Kịch bản mẫu theo nghiệp vụ** (chọn ở Bước 1): Sao kê ↔ sổ 112 · Hóa đơn cổng thuế ↔ sổ MISA · Công nợ với đối tác · Chấm công ↔ DS nhân sự · Đăng ký ↔ check-in · So 2 phiên bản file | Người không rành chọn điều kiện; giảm số ô phải hiểu | Kịch bản tự bật đúng tùy chọn + gợi ý cặp; các tùy chọn khác thu vào "Cài đặt nâng cao". **Đây là điểm truyền thông mạnh** ("chọn việc, không chọn công thức") |
| P1.5 | **So 2 phiên bản file** 1 chạm: tự ghép cột cùng tên, báo dòng thêm / bớt / ô nào bị sửa (tô màu ô) | #10 – mọi vị trí | Dùng lại kiểu 7, chỉ thêm chế độ tự chọn tất cả cột cùng tên + tô ô lệch trong Excel |

### P2 – Làm sau khi có phản hồi người dùng
| # | Đề xuất | Giải quyết cho |
|---|---|---|
| P2.1 | **Đảo dấu / đổi bên Nợ–Có** khi so số tiền (Nợ 131 của mình = Có 331 của đối tác; số âm = số dương) | Công nợ (#2) |
| P2.2 | **Trích mã từ nội dung** (lấy số HĐ, mã đơn, mã KH nằm trong cột diễn giải/nội dung chuyển khoản) làm khóa | Sao kê có nội dung "TT HD 0000123 CTY ABC" (#1, #8) |
| P2.3 | **Khớp gần đúng tên** (điểm tương đồng ≥ x%) – chỉ cảnh báo, người dùng xác nhận | Tên KH/NCC/hàng viết khác (#5, #9) |
| P2.4 | **Gộp nhiều file / nhiều sheet** vào File A hoặc B (nhiều tháng sao kê, nhiều tài khoản, nhiều máy chấm công) | #1, #7 |
| P2.5 | **Khớp tay & ghi chú**: chọn 2+ dòng để khớp thủ công, ghi lý do (VD "phí ngân hàng chưa hạch toán"); xuất kèm | Phần còn lại sau tự động – bước kế toán luôn phải làm |
| P2.6 | Lệch ngày & khớp tổng mở rộng: khớp tổng **trong khoảng N ngày**, nhiều–nhiều | #4 (tiền sàn về gộp nhiều ngày) |
| P2.7 | Quy tắc loại trừ theo từ khóa (bỏ dòng có "Phí SMS", "Lãi tiền gửi"…) lưu trong thiết lập | #1 |

### P3 – Mở rộng thành sản phẩm riêng / gắn với công cụ khác
| # | Đề xuất | Ghi chú |
|---|---|---|
| P3.1 | Xuất **biên bản đối chiếu công nợ** (Word/PDF) theo từng đối tượng | Có thể dùng chung "Tạo văn bản hàng loạt" |
| P3.2 | Đối chiếu **3 bên** PO – phiếu nhập – hóa đơn | Phạm vi lớn, nên là công cụ riêng |
| P3.3 | Nhận thẳng file Excel từ **Bộ xử lý hóa đơn** (kịch bản Hóa đơn ↔ sổ MISA) + gợi ý bút toán điều chỉnh MISA | Tạo hệ sinh thái giữa các công cụ |

## 3. Phản biện / rủi ro
- **Quá nhiều tùy chọn làm người mới sợ.** Bản 1.4.1 đã có ~15 lựa chọn. Bắt buộc đi kèm P1.4 (kịch bản) và thu gọn "Cài đặt nâng cao", nếu không công cụ mạnh nhưng khó dùng – trái tinh thần "không cần biết công thức".
- **Dung sai & khớp gần đúng dễ khớp sai.** Nguyên tắc giữ nguyên: khớp chính xác trước, dung sai sau, gần đúng chỉ cảnh báo – không bao giờ tự "làm đẹp" số liệu.
- **Phạm vi**: #6 (3 bên) và biên bản công nợ nên tách công cụ riêng, tránh dồn hết vào 1 công cụ.
- **Thời điểm xuất bản**: có thể xuất bản bản hiện tại (đã mạnh cho kế toán ngân hàng) rồi bổ sung P1 trong bản 1.5, hoặc làm P1 xong mới xuất bản. Anh quyết.

## Nguồn tham khảo
- Thứ tự quy tắc tự động đối chiếu (1-1 → nhóm → dung sai → ngoại lệ): https://www.aspiresys.com/blog/oracle/erp-implementation/recommended-sequence-for-auto-reconciliation-rules-setup/
- Nguyên nhân chênh lệch bảng kê thuế GTGT và sổ cái: https://helpact.misa.vn/kb/hdqt_chenh_lech_bang_ke_thue_gtgt_va_so_cai/
- Công việc kế toán công nợ: https://ketoanleanh.edu.vn/mo-ta-chi-tiet-cong-viec-cua-ke-toan-cong-no-trong-doanh-nghiep.html
- Mẫu sổ chi tiết công nợ Excel: https://amis.misa.vn/29987/so-chi-tiet-cong-no-bang-excel/
