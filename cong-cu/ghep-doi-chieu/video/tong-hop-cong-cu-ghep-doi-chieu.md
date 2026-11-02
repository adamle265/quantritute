# Ghép & đối chiếu 2 file Excel – Tổng hợp để làm video

Cập nhật: 24/10/2026 · Bản công cụ: **1.7.11** (24/10/2026 10:40 – sửa lỗi nhóm "Thỏa mãn một trong" không áp dụng Chuẩn hoá số điện thoại / Chỉ giữ chữ và số; chờ anh đưa lên web; **quay video v12 bằng bản này**). Dùng cho hội thoại làm video v10–v12. Chỉ nói những gì đã có thật trong công cụ; mục 5 là những điều **KHÔNG được nói**.

## 1. Thông tin nhanh
| Mục | Nội dung |
|---|---|
| Tên | Ghép & đối chiếu 2 file Excel |
| Link dùng | https://quantritute.com/tools/ghep-doi-chieu/ · trang giới thiệu: https://quantritute.com/cong-cu/doi-chieu-sao-ke (trong lời video chỉ nói "link ở bai ô của kênh") |
| Nhóm | Kế toán – Tài chính, **Nổi bật**, Active, miễn phí, không cần đăng ký |
| Dành cho | Kế toán, kế toán trưởng, kiểm soát nội bộ; mở rộng: hành chính – nhân sự, sự kiện, văn phòng |
| Cam kết | Chạy ngay trên trình duyệt, **file không rời máy**, không cài đặt |
| Bài hướng dẫn trên web | /huong-dan/doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan/ · /huong-dan/ghep-doi-chieu-2-file-excel-khong-can-vlookup/ |
| Thư mục | `quantritute/cong-cu/ghep-doi-chieu/` (app, nguon, video) |

## 2. Câu chuyện ra đời (chất liệu cho phần anh nói ở v10 – anh tự nói bằng lời của mình)
- Phát triển từ bài học "Bài 6.11 – Xây dựng tool ghép và đối chiếu file" (bản gốc chạy Python). Anh làm lại thành bản chạy trên trình duyệt, dễ dùng hơn. *(Có nhắc tên bài học trong video không: anh quyết ở Cổng 2.)*
- Anh test bằng file thật của mình (sao kê ngân hàng ↔ sổ tiền gửi TK 112) và góp ý từng chỗ vướng → công cụ có: khớp ngày bỏ giờ, nhóm điều kiện "đồng thời / một trong", cảnh báo lệch ngày, khớp tổng BHXH, tự bỏ dòng số dư/cộng, tick bỏ dòng, đổi chỗ file A↔B. Chi tiết: `diem-noi-bat-truyen-thong.md` mục A.
- Kết quả trên file thật (109 giao dịch, khớp 108 trong chưa đầy 1 giây, còn 1 cặp lệch ngày): **chỉ nói khi anh đồng ý**; hình vẫn dùng dữ liệu giả.

## 3. Luồng dùng (4 bước trên công cụ)
1. Thả 2 file (hoặc "Thử với dữ liệu mẫu") → xem trước, tự bỏ dòng tổng cộng/chữ ký, tick bỏ dòng, đổi chỗ A↔B, gộp dòng theo khóa (nếu cần).
2. Chọn cặp đối chiếu: nhóm **Thỏa mãn đồng thời** + nhóm **Thỏa mãn một trong các điều kiện**; nút **✨ Gợi ý cặp đối chiếu** (nhóm "một trong" gợi ý được cả Gửi vào ⇄ Thu và Rút ra ⇄ Chi, nhãn "Bổ sung · cộng dồn X%" – từ bản 1.7.10); khung **Làm sạch khóa trước khi so khớp** + **Tuỳ chọn nâng cao**; Kiểm tra nhanh dữ liệu.
3. Chọn kiểu ghép (hình 2 vòng tròn, 7 kiểu; Báo cáo tra soát).
4. Kết quả: thẻ số, tab Lệch ngày, Khớp tổng, Lệch giá trị; bảng Đối chiếu tổng tiền A − B; chọn cột; tải Excel **tô màu cả dòng theo trạng thái** (định dạng có điều kiện – Excel, LibreOffice, Google Sheets đều hiện; đọc file bằng code sẽ không thấy màu); lưu / nạp thiết lập. Thông báo ghép xong không ghi số giây (bản 1.7.10).

## 4. Các lựa chọn làm sạch (cho v12 – chữ đúng như trên công cụ)
| Lựa chọn | Ví dụ trên công cụ |
|---|---|
| Bỏ khoảng trắng thừa, kể cả khoảng trắng đặc biệt | |
| Không phân biệt chữ hoa/thường | |
| Đồng nhất tiếng Việt Unicode dựng sẵn và tổ hợp | |
| Coi số dạng chữ và số là một ("001" = 1) | Cảnh báo: cẩn thận với số điện thoại, mã có số 0 đầu |
| Khớp ngày/tháng/năm, bỏ qua giờ và định dạng ngày (mặc định bật) | "03/08/2026 08:29:23" = "03/08/2026" = "2026-08-03" |
| *Nâng cao:* Chỉ giữ chữ và số khi so khớp | "KH-001" = "KH 001" = "KH001"; MST "0101-234-567" = "0101234567" |
| *Nâng cao:* Bỏ dấu tiếng Việt | "Nguyễn Văn An" = "Nguyen Van An" |
| *Nâng cao:* Chuẩn hoá số điện thoại | "0912 345 678" = "+84 912.345.678" = 912345678 (ô Excel mất số 0 đầu) |
| *Nâng cao:* Cho phép số tiền lệch ± đồng / % | Phí chuyển khoản 5.000.000 → 4.989.000; khớp chính xác trước, phần còn lại mới theo dung sai; dòng khớp nhờ dung sai đánh dấu "Lệch giá trị" |

## 5. KHÔNG được nói
- Không nói "khớp 100%", "không bao giờ sai", "thay kế toán đối chiếu".
- Lệch ngày, Khớp tổng: **chỉ là cảnh báo**, công cụ không tự tính là khớp – không nói công cụ "tự xử lý", "tự hạch toán".
- Không dùng / không hiện file sao kê, sổ sách thật của anh; số liệu trên hình là dữ liệu minh họa.
- Không nói tên website trong lời; không hứa tốc độ cụ thể với file người dùng (con số "200.000 dòng đọc ~3,5 giây" là đo trên máy thử – chỉ dùng khi anh đồng ý, kèm chữ "tùy máy").
- Không nói công cụ đọc được "mọi định dạng": chỉ nhận .xlsx, .xlsm, .xls, .xlsb, .csv.
