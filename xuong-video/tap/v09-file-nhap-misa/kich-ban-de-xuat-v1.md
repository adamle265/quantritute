# v09 – Tạo sẵn file nhập lên MISA · Kịch bản đề xuất v1 (Cổng 2)

20/10/2026 · Đốm dẫn 100% · ước tính **~60s** (mở đầu 5s + thân ~38s + CTA ~10s + kết 7s) · đăng T2 26/10/2026 19:00
Video hướng dẫn nhẹ: chỉ cách vận hành + tác dụng, đi trên → dưới thẻ 5, **không demo chi tiết** (để đợt 2 sau khi KTT nhập thử thật).

## Kết quả chạy thật thẻ 5 (bản 1.5.4, 2 ZIP dữ liệu giả Q3)
- Tự tách: Mua vào 61 · Bán ra 80 (theo MST 9876543210).
- Thiết lập mặc định: TK công nợ 331, thuế 1331, Chưa thanh toán, TK kho 1561, tiền tố NK/MH/MDV/NVK.
- Nhà cung cấp: 28 · Hàng hóa: 218 dòng / 149 mặt hàng; gợi ý loại: Nghiệp vụ khác 129, Dịch vụ 11, Nhập kho 9. **Có vài gợi ý chưa đúng** (vd "Chè long nhãn" → Dịch vụ, "Hoa cẩm tú cầu" → Nhập kho) ⇒ lời chỉ nói "gợi ý", nhấn "rà lại".
- Xuất mua vào: Mua hàng trong nước (5 CT/10 dòng), Mua dịch vụ (6/11), Nghiệp vụ khác (45/386) + Tải tất cả (ZIP). Bán ra: Bán hàng (34/35), Bán dịch vụ (46/46).
- Khung đỏ "Còn … thông tin bắt buộc bị trống… MISA sẽ báo lỗi" + ghi chú "Nên nhập thử vài chứng từ…" hiện sẵn → lời D07 bám đúng điều này.
- File Excel tải về có tiêu đề "FILE MẪU CHỨNG TỪ … ĐỂ NHẬP VÀO PHẦN MỀM AMIS ACCOUNTING".

## Lời Đốm
| Đoạn | Cảnh | Phụ đề (chữ gốc) |
|---|---|---|
| D01 | Danh sách 2 file đã nạp → bấm thẻ 5 | Từ chính những hóa đơn đã nạp, Đốm tạo sẵn file để nhập lên MISA. Anh chị bấm sang thẻ 5. |
| D02 | ① nút Mua vào (61) / Bán ra (80) + dòng MST | Công cụ tự tách mua vào, bán ra theo mã số thuế doanh nghiệp. |
| D03 | ② Nhà cung cấp (28) → nút Tải lên danh mục → nút Xuất Excel danh mục NCC | Mục nhà cung cấp gom đủ các đơn vị trên hóa đơn. Tải lên danh mục từ MISA để tự điền mã; nhà cung cấp mới thì xuất Excel danh mục. |
| D04 | ③ Bảng hàng hóa, cột Loại + nhãn "gợi ý"; lướt các dòng ăn uống, xăng, phí | Mục hàng hóa, dịch vụ hiện từng dòng theo hóa đơn, kèm gợi ý loại. Ăn uống, xăng dầu, phí ngân hàng được gợi ý là nghiệp vụ khác, không cần sinh mã hàng. |
| D05 | Ô TK → nút ✓ Xác nhận | Anh chị rà lại, chọn tài khoản, rồi bấm dấu tích xác nhận. |
| D06 | ④ Xuất file: 3 file mua vào → bấm Bán ra → 2 file + Tải tất cả | Cuối cùng là các file đúng mẫu nhập khẩu của MISA: mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ. Tải từng file, hoặc cả gói ZIP. |
| D07 | Khung đỏ thông tin còn thiếu + dòng ghi chú | Ô còn thiếu thông tin, Đốm liệt kê bên dưới. Nên nhập thử vài chứng từ trước khi nhập cả kỳ. |
| D08 | Dòng cam kết (chép giọng D13 v07) | Công cụ hoàn toàn miễn phí, xử lý ngay trên máy của anh chị, không gửi hóa đơn ra ngoài. |
| D09 | Đốm cảm ơn + nút bio (chép giọng D14 v07) | Link dùng thử, Đốm để ở bio của kênh. Anh chị dùng thử, và góp ý để Đốm hoàn thiện thêm nhé! |

Phiên âm khi tạo json: MISA = "Mi sa", Excel = "ích xeo", ZIP = "díp", số 5 = "năm".

## Đã cố ý KHÔNG đưa vào
- "Nhập thẳng MISA không lỗi" (chưa nhập thử thật).
- Con số "129/149 gợi ý đúng" (có gợi ý chưa đúng trên dữ liệu này).
- Thiết lập mặc định, mục 3 điều kiện khấu trừ, lọc/áp dụng hàng loạt → để video demo đợt 2.

## Cần anh chốt
1. Tiêu đề mở đầu: **"TẠO SẴN FILE NHẬP | LÊN MISA"** (đã render) hay "TỪ HÓA ĐƠN | RA FILE NHẬP MISA"?
2. Nút thumbnail: "5 MẪU CHỨNG TỪ · GỢI Ý NGHIỆP VỤ KHÁC"?
3. Có thêm câu hứa "phần chi tiết Đốm làm ở video sau" không? (em đề xuất **không**, vì đợt 2 còn chờ KTT nhập thử)
