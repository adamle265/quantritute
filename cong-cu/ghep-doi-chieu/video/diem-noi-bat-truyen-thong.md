# Ghép & đối chiếu 2 file Excel – Điểm nổi bật để truyền thông

> Mỗi mục dưới đây bắt nguồn từ **góp ý thực tế của anh Minh Tuấn khi test bằng file thật** (sao kê ngân hàng, sổ chi tiết TK 112, sổ tiền gửi). Đây là những vấn đề kế toán gặp hằng tháng → nêu bật trong video, bài viết, caption. Viết theo lợi ích: đỡ việc gì, yên tâm điều gì.
> Cập nhật: 22/10/2026 – bản 1.7.0 (thêm #19–20) (mục D: tính năng mở rộng; mục E: góp ý giao diện 09:35; chờ anh test & duyệt).

## A. Nhóm tính năng sinh ra từ góp ý của anh (ưu tiên nêu bật)

| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay/minh họa |
|---|---|---|---|---|
| 1 | Sao kê ghi **ngày + giờ** (03/08/2026 08:29:23), sổ kế toán chỉ có **ngày** (03/08/2026) → Excel/VLOOKUP coi là khác nhau, không khớp được dòng nào | Tuỳ chọn **Khớp ngày/tháng/năm, bỏ qua giờ và định dạng ngày** (mặc định bật). Hiểu cả 3/8/2026, 2026-08-03, ô ngày Excel lẫn ngày dạng chữ | ✔ Sao kê có giờ, sổ chỉ có ngày – vẫn khớp, không phải sửa định dạng | Bỏ tick → 0 dòng khớp; tick → khớp gần hết |
| 2 | Đối chiếu sao kê ↔ sổ 112: tiền **vào** ở cột Gửi vào/Thu/PS Nợ, tiền **ra** ở cột Rút ra/Chi/PS Có. Đặt cả 3 cặp "đồng thời" thì **không khớp dòng nào** | 2 nhóm điều kiện: **① Bắt buộc (VÀ)** + **② Thay thế (HOẶC – khớp 1 trong các cặp)**. Ô trống/số 0 không tính là khớp | ✔ Tiền vào khớp tiền vào, tiền ra khớp tiền ra – chỉ cần 1 lần thiết lập | Dòng tóm tắt "Ngày GD = Ngày HT VÀ (Gửi vào = Nợ HOẶC Rút ra = Có)"; cột "Khớp theo" |
| 3 | Một ngày có **nhiều khoản cùng số tiền** (3 khoản 2,5 triệu ngày 10/08) → VLOOKUP lấy trùng 1 dòng, khoản khác bị báo thiếu sai | **Ghép 1–1**: mỗi dòng chỉ ghép 1 lần, theo thứ tự (tự bật khi dùng điều kiện thay thế) | ✔ Nhiều khoản cùng tiền, cùng ngày – vẫn ghép đúng từng cặp | Kiểm tra sức khỏe dữ liệu báo "lặp 3 lần" → kết quả khớp đủ |
| 4 | Không biết chọn cột nào để nối, nhất là nhóm điều kiện HOẶC | Nút **✨ Gợi ý cặp đối chiếu** ở cả 3 chỗ; nhóm ① luôn gợi ý **cặp ngày** (nhãn NGÀY); nhóm ② gợi ý các cặp bổ sung nhau, hiện "khớp thêm 53% · cộng dồn 99%" | ✔ Bấm 1 nút, công cụ tự tìm cặp cột cần đối chiếu | Bấm gợi ý → "Dùng cả 2 cặp (khớp 99,1%)" |
| 5 | Ngân hàng ghi **27/08**, kế toán ghi sổ **28/08** (Shopee rút tiền buổi tối) → bị báo "thiếu" ở cả 2 bên, mất công dò | Tab **⚠ Lệch ngày**: cảnh báo cặp dòng trùng số liệu nhưng lệch ngày, **anh/chị chọn số ngày cho phép lệch** (mặc định 3). Chỉ cảnh báo, không tự tính là khớp | ✔ Lệch ngày ghi sổ – công cụ chỉ ra ngay cặp nào, lệch mấy ngày | Thẻ "Lệch ngày 1 cặp", 2 dòng đứng liền nhau |
| 6 | Sao kê có **1 lệnh nộp BHXH**, sổ tách thành **BHXH + BHYT + BHTN + lãi chậm nộp** cùng ngày → cả 5 dòng đều báo "không khớp" | Tab **⚠ Khớp tổng**: tìm 1 dòng bằng **tổng nhiều dòng cùng ngày** (cả 2 chiều), khớp đúng từng đồng | ✔ 1 lệnh ngân hàng = nhiều bút toán – công cụ tự cộng và chỉ ra nhóm | 1 dòng sao kê 20.000.000 + 4 dòng sổ bên dưới |
| 7 | File sổ có dòng **"Tài khoản ngân hàng: …"**, **"Số dư đầu kỳ"**, **"Cộng"**, **"Tổng cộng"**, chữ ký → bị tính là giao dịch | Tự nhận và bỏ các dòng đó (báo chữ đỏ đã bỏ dòng nào) + **cột tick chọn từng dòng** ở bảng xem trước để bỏ dòng không muốn đối chiếu | ✔ Dòng số dư, dòng cộng, chữ ký tự bị loại – không làm sai kết quả | Banner "Đã bỏ 3 dòng…", bỏ tick 1 dòng bị gạch ngang |
| 8 | Lỡ tải nhầm file vào ô A/B | Nút **⇅ Đổi chỗ File A ↔ File B** ngay Bước 1 | ✔ Tải nhầm ô – 1 bấm là đổi | |
| 9 | Kết quả nhiều cột thừa, muốn bớt cột mà không phải làm lại | Bước 4 có khung **Chọn cột đưa vào file kết quả** (thu gọn), bấm Áp dụng là cập nhật ngay | ✔ Chọn lại cột ngay ở màn kết quả | |

**Kết quả thật để kể (file của anh, T8/2026):** sao kê 109 giao dịch ↔ sổ tiền gửi ACB 109 dòng → **108 khớp trong chưa đầy 1 giây**, còn đúng 1 cặp lệch ngày (Shopee 2.028.173: 27/08 ↔ 28/08). Cách cũ đặt 3 cặp đồng thời: **0 dòng khớp**. *(Dùng số liệu thật cần anh đồng ý; khi quay nên dùng bộ dữ liệu mẫu hoặc che thông tin.)*

## B. Nhóm tính năng nền (so với bản gốc Bài 6.11)
| Điểm | Lợi ích |
|---|---|
| Chạy ngay trên trình duyệt, không cài Python, file không rời máy | Không còn cảnh "Chay_Tool.command chưa được mở" trên Mac; dùng online hoặc tải 1 file HTML |
| 200.000 dòng đọc ~4 giây, ghép < 1 giây, tiến trình chạy thật | Không treo Excel, không đứng 0% |
| 7 kiểu ghép vẽ bằng 2 vòng tròn | Không cần biết VLOOKUP/Power Query |
| Báo cáo tra soát: trạng thái từng dòng, chi tiết lệch, cột số chênh lệch | Biết lệch ở đâu, lệch bao nhiêu |
| Bảng **Đối chiếu tổng tiền A − B** tách: do dòng lệch / do dòng chỉ có ở A / do dòng chỉ có ở B | Giải thích được chênh lệch tổng với sếp/kiểm toán |
| Xem đủ kết quả theo trang, lọc, tìm kiếm không dấu | Không giới hạn 100 dòng xem trước |
| Excel tô màu theo trạng thái, chia sheet, bộ lọc, cố định tiêu đề | Mở ra là xử lý được ngay |
| Lưu / nạp thiết lập | Tháng sau nạp lại là chạy |

## C. Gợi ý thông điệp chính
- Tiêu đề: **"Đối chiếu sao kê ngân hàng với sổ kế toán trong 1 phút – kể cả khi lệch ngày, tách khoản"**.
- 3 ý chốt: (1) Không công thức, không cài đặt; (2) Hiểu đúng cách kế toán ghi sổ (tiền vào/ra, lệch ngày, tách khoản BHXH); (3) Chỉ cảnh báo để mình quyết – không "làm đẹp" số liệu.

## D. Bản 1.5.0 – mở rộng ra các việc khác ngoài sao kê (anh chọn 22/10/2026)
> Nguồn: nghiên cứu nhu cầu ở các vị trí kế toán thuế, công nợ, nhân sự – C&B, sự kiện, quản lý dữ liệu (`de-xuat-mo-rong-ung-dung.md`). Anh duyệt 5 đề xuất P1.

| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay/minh họa |
|---|---|---|---|---|
| ~~10~~ | *(Bỏ ở bản 1.6.0 theo quyết định của anh: người dùng tự thiết lập)* Người dùng không biết "khóa", "kiểu ghép", "VÀ/HOẶC" là gì – chỉ biết mình đang cần đối chiếu **việc gì** | Thẻ **"Bạn đang cần đối chiếu gì?"** ở Bước 1: 6 việc có sẵn (sao kê, hóa đơn, công nợ, nhân sự, sự kiện, 2 phiên bản) – chọn việc là công cụ tự cài đặt | ✔ Chọn việc, không chọn công thức | Bấm thẻ "Hóa đơn ↔ sổ" → Tiếp tục → mọi ô đã điền sẵn |
| 11 | Ngân hàng **trừ phí chuyển khoản** (5.000.000 → 4.989.000), làm tròn thuế, chênh tỷ giá → lệch vài đồng là báo "không khớp" | **Dung sai số tiền** ± X đồng hoặc ± Y%. Khớp chính xác trước, sau đó mới ghép phần còn lại theo dung sai; dòng khớp nhờ dung sai vẫn được đánh dấu để kiểm tra | ✔ Lệch vì phí chuyển khoản – vẫn ghép đúng cặp, vẫn chỉ ra lệch bao nhiêu | Thẻ "Khớp nhờ dung sai: 1" |
| 12 | 1 hóa đơn có **nhiều dòng hàng**, sổ chỉ có 1 dòng tổng; công nợ 1 khách nhiều phát sinh → VLOOKUP lấy dòng đầu, sai tổng | **Gộp dòng theo khóa** ngay Bước 1: cộng các cột tiền, thêm cột "Số dòng gộp" (kịch bản hóa đơn/công nợ tự bật) | ✔ Không cần Pivot trước – công cụ tự cộng theo hóa đơn, theo khách hàng | Bảng xem trước từ 120 dòng hàng → 40 hóa đơn |
| 13 | Cùng 1 mã/SĐT/tên mà mỗi nơi gõ một kiểu: "KH-001" / "KH001", MST "0101-234-567", "0912 345 678" / "+84 912.345.678", "Nguyễn Văn An" / "Nguyen Van An" | 3 tuỳ chọn làm sạch nâng cao: **chỉ giữ chữ & số**, **bỏ dấu tiếng Việt**, **chuẩn hoá số điện thoại** (kể cả Excel làm mất số 0 đầu) | ✔ Gõ khác kiểu vẫn nhận ra là một | Danh sách đăng ký ↔ check-in sự kiện |
| 14 | Nhận lại file từ đồng nghiệp/đối tác, **không biết họ đã sửa ô nào**, thêm/xoá dòng nào | Kịch bản **So 2 phiên bản**: dòng thêm, dòng bớt, **ô bị sửa tô vàng** trên màn hình và trong file Excel xuất ra | ✔ Ai sửa gì trong file – nhìn màu vàng là biết | Bảng kết quả với 4 ô vàng |

**Thông điệp mở rộng:** "Không chỉ sao kê – mọi lần phải dò 2 danh sách: hóa đơn, công nợ, chấm công, khách mời, bản sửa của đồng nghiệp". Số liệu trong mục D lấy từ **dữ liệu giả** (`nguon/du-lieu-thu/kich-ban/`) – dùng thoải mái khi quay.

## E. Bản 1.6.0 – góp ý của anh khi test giao diện (22/10/2026 09:35)
| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay/minh họa |
|---|---|---|---|---|
| 15 | Có lúc chỉ cần "khớp 1 trong mấy cột" (tiền vào HOẶC tiền ra), không có cột nào bắt buộc phải trùng | Nhóm **Thỏa mãn một trong các điều kiện** dùng được độc lập; 2 nhóm đặt tên bằng lời thường thay cho "bắt buộc / thay thế" | ✔ Khớp đồng thời hay khớp một trong – nói đúng như cách mình nghĩ | Chỉ chọn 2 cặp ở nhóm 2 → chạy luôn |
| 16 | Hai file đặt tên cột khác nhau, không biết cột nào ứng với cột nào | **✨ Gợi ý cặp đối chiếu** ở cả 2 nhóm: tìm cặp **trùng tên tiêu đề** hoặc **dữ liệu khớp từ 80%**, kèm nhãn NGÀY / SỐ / MÃ và % khớp | ✔ Tên cột khác nhau – công cụ vẫn nhận ra cột nào khớp cột nào | "Số tiền gửi vào ⇄ Thu · khớp 100%" |
| 17 | Người dùng gặp vướng mà không biết hỏi ai; muốn có thêm tính năng | **Nút Đốm "Góp ý cho Đốm"** ngay trên công cụ: chấm sao, chọn Đề xuất tính năng / Báo lỗi, gửi thẳng về đội phát triển | ✔ Thiếu gì – bấm Đốm nói một câu, công cụ sẽ có thêm | Bấm Đốm → chọn 4 sao → gửi |
| 18 | Lần đầu dùng không biết bắt đầu từ đâu | Nút **Hướng dẫn sử dụng** (4 bước) và **Xem video Demo** ngay trên thanh tiêu đề, luôn ghim ở mọi màn hình | ✔ Lần đầu dùng – có Đốm chỉ từng bước | Mở hộp Hướng dẫn |

**Lưu ý khi quay:** đối chiếu sao kê nên thêm cặp ngày ở nhóm "đồng thời" – nếu chỉ dùng nhóm "một trong", cặp lệch ngày (Shopee 27/08 ↔ 28/08) sẽ được ghép luôn thay vì cảnh báo.
| 19 | Mở công cụ ra không biết bắt đầu từ đâu, phải đọc hướng dẫn | **Trang bắt đầu**: thả 1–2 file vào là vào việc ngay; có Thử với dữ liệu mẫu, Video demo, Cách hoạt động 4 bước (bản 1.7.0) | ✔ Thả 2 file Excel vào – bắt đầu đối chiếu | Kéo 2 file từ máy vào trang đầu |
| 20 | Đang làm dở không biết còn thiếu gì để sang bước sau | Thanh tiến trình **sáng dần theo dữ liệu đã đủ**, nhắc rõ "Tải thêm File B…", "Chọn ít nhất 1 cặp cột…"; nút Gỡ toàn bộ file để làm lại nhanh | ✔ Công cụ dẫn từng bước – thiếu gì nhắc nấy | Thanh bước 2 sáng lên ngay khi tải xong file thứ hai |
