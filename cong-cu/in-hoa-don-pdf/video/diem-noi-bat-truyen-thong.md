# In hóa đơn PDF hàng loạt theo danh sách – Điểm nổi bật để truyền thông

> Công cụ ra đời từ **đề xuất thật trên Bảng ghim ngày 02/11/2026 của chị Thủy - HRM**: "Tôi tải file hóa đơn PDF về được 2.000 hóa đơn, làm sao để tôi in 2.000 hóa đơn này theo danh sách hóa đơn có sẵn và in không bị lẫn lệnh?" (trích, đã sửa chính tả). Anh chốt cùng ngày: làm thành công cụ riêng, làm luôn không chờ phản hồi. Nhắc tên chị Thủy: anh đã chốt cách gọi "chị Thủy - HRM" trong bài fanpage 02/11 – nên nhắn chị trước khi đăng.
> Bài fanpage + ảnh: `04_Nội dung - Marketing/bai-dang-in-hoa-don-pdf.md`, `anh-bai-dang-in-hoa-don-pdf.png`.

| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay |
|---|---|---|---|---|
| 1 | Chọn cả loạt PDF bấm in → máy in đảo thứ tự, xấp 2.000 tờ phải xếp tay | Ghép thành lô PDF liền mạch đúng thứ tự danh sách, mỗi lô 1 lệnh in | ✔ Mỗi lô một lệnh in, máy in không đảo trang | Mở lô 01 → lật trang thấy 0001, 0002… |
| 2 | Không biết hóa đơn nào chưa có file, file nào thừa, tải trùng | Ô lọc Thiếu file / File chưa khớp / File trùng; Excel đối chiếu | ✔ Biết ngay thiếu tờ nào trước khi in | Bấm ô "Thiếu file PDF (1)" |
| 3 | Tên file lộn xộn (Scan_0001, Tai lieu 2) | Đọc ký hiệu, số, MST trong file để khớp | ✔ Tên file lộn xộn vẫn khớp đúng | Bảng: "đọc trong file" |
| 4 | Cùng số 123 của nhiều người bán | Khớp theo ký hiệu + số + MST | ✔ Cùng số hóa đơn, khác người bán, không nhầm | 3 dòng số 123 khớp 3 file khác nhau |
| 5 | Kẹt giấy, rơi giấy giữa chừng | Số thứ tự góc trang "0001/2000 · C26TAA-123", lô nhỏ | ✔ Rơi giấy vẫn xếp lại được | Cận cảnh góc trang |
| 6 | In 2 mặt bị hóa đơn sau in vào mặt sau hóa đơn trước | Tùy chọn thêm trang trắng sau hóa đơn lẻ trang | ✔ In 2 mặt, mỗi hóa đơn một tờ riêng | Tick "In 2 mặt" |
| 7 | Hóa đơn không có rời máy | Xử lý ngay trên trình duyệt, có bản tải offline | ✔ Hóa đơn không rời máy | Nút "Tải bản offline" trong popup |

**Kết quả thử (dữ liệu giả, 02/11/2026):** 2.000 file (1.000 tên chuẩn + 1.000 tên Scan) + danh sách 2.000 dòng → khớp 2.000/2.000, ghép 20 lô × 100 hóa đơn; soát 100 trang lô 3 đúng thứ tự. *Chưa có số liệu với PDF thật – chỉ nói "đã thử với 2.000 file mẫu".*
