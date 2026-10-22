
## D. Bản 1.5.0 – mở rộng ra các việc khác ngoài sao kê (anh chọn 22/10/2026)
> Nguồn: nghiên cứu nhu cầu ở các vị trí kế toán thuế, công nợ, nhân sự – C&B, sự kiện, quản lý dữ liệu (`de-xuat-mo-rong-ung-dung.md`). Anh duyệt 5 đề xuất P1.

| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay/minh họa |
|---|---|---|---|---|
| 10 | Người dùng không biết "khóa", "kiểu ghép", "VÀ/HOẶC" là gì – chỉ biết mình đang cần đối chiếu **việc gì** | Thẻ **"Bạn đang cần đối chiếu gì?"** ở Bước 1: 6 việc có sẵn (sao kê, hóa đơn, công nợ, nhân sự, sự kiện, 2 phiên bản) – chọn việc là công cụ tự cài đặt | ✔ Chọn việc, không chọn công thức | Bấm thẻ "Hóa đơn ↔ sổ" → Tiếp tục → mọi ô đã điền sẵn |
| 11 | Ngân hàng **trừ phí chuyển khoản** (5.000.000 → 4.989.000), làm tròn thuế, chênh tỷ giá → lệch vài đồng là báo "không khớp" | **Dung sai số tiền** ± X đồng hoặc ± Y%. Khớp chính xác trước, sau đó mới ghép phần còn lại theo dung sai; dòng khớp nhờ dung sai vẫn được đánh dấu để kiểm tra | ✔ Lệch vì phí chuyển khoản – vẫn ghép đúng cặp, vẫn chỉ ra lệch bao nhiêu | Thẻ "Khớp nhờ dung sai: 1" |
| 12 | 1 hóa đơn có **nhiều dòng hàng**, sổ chỉ có 1 dòng tổng; công nợ 1 khách nhiều phát sinh → VLOOKUP lấy dòng đầu, sai tổng | **Gộp dòng theo khóa** ngay Bước 1: cộng các cột tiền, thêm cột "Số dòng gộp" (kịch bản hóa đơn/công nợ tự bật) | ✔ Không cần Pivot trước – công cụ tự cộng theo hóa đơn, theo khách hàng | Bảng xem trước từ 120 dòng hàng → 40 hóa đơn |
| 13 | Cùng 1 mã/SĐT/tên mà mỗi nơi gõ một kiểu: "KH-001" / "KH001", MST "0101-234-567", "0912 345 678" / "+84 912.345.678", "Nguyễn Văn An" / "Nguyen Van An" | 3 tuỳ chọn làm sạch nâng cao: **chỉ giữ chữ & số**, **bỏ dấu tiếng Việt**, **chuẩn hoá số điện thoại** (kể cả Excel làm mất số 0 đầu) | ✔ Gõ khác kiểu vẫn nhận ra là một | Danh sách đăng ký ↔ check-in sự kiện |
| 14 | Nhận lại file từ đồng nghiệp/đối tác, **không biết họ đã sửa ô nào**, thêm/xoá dòng nào | Kịch bản **So 2 phiên bản**: dòng thêm, dòng bớt, **ô bị sửa tô vàng** trên màn hình và trong file Excel xuất ra | ✔ Ai sửa gì trong file – nhìn màu vàng là biết | Bảng kết quả với 4 ô vàng |

**Thông điệp mở rộng:** "Không chỉ sao kê – mọi lần phải dò 2 danh sách: hóa đơn, công nợ, chấm công, khách mời, bản sửa của đồng nghiệp". Số liệu trong mục D lấy từ **dữ liệu giả** (`nguon/du-lieu-thu/kich-ban/`) – dùng thoải mái khi quay.
