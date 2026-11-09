# Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT

- **Thư mục / link web:** `loi-nhuan-san-tmdt` → `/tools/loi-nhuan-san-tmdt/`
- **Slug database (dự kiến):** `loi-nhuan-san-tmdt` (thẻ "Báo cáo lợi nhuận từ sàn TMĐT" đang Coming soon – cập nhật bản ghi đó qua migration khi lên web; `doi-soat-san-tmdt` giữ ẩn)
- **Nhóm:** kt (Kế toán – Tài chính)
- **Nguồn:** đề xuất Bảng ghim 04/11/2026 (kế toán, không để liên hệ) + anh duyệt phạm vi 04/11 21:32. Đề xuất: https://claude.ai/artifact/Wc6mthheiU9b48jq41kzGt ; bàn giao `cong-cu/Công cụ sẽ làm/Đối soát sàn TMĐT - hóa đơn - dòng tiền/BAN-GIAO-TOOL.md`
- **Nền:** nâng cấp từ app đối soát TikTok Shop bản cũ (09/2026), viết lại thành bản dùng chung cho mọi shop.
- **Trạng thái:** Bản 1.1.0 (06/11/2026) – sửa theo góp ý dùng thử (file `Góp ý app đối soát.docx`); trên web anh đặt tên "… - Beta 05.11". Lịch sử cập nhật ghi bằng migration `_mig_tools_v23`.

## Cách build
`cd nguon` → `node build.js` → chép `nguon/build/index.html` vào `app/index.html`. Không sửa tay `app/index.html`.
Nguồn: `src/ui.html` (khung + CSS riêng tiền tố `ds-`), `src/base.css` (CSS chung lấy từ In hóa đơn PDF), `src/core.js` (đọc xlsx, ghép dữ liệu, ví, lợi nhuận, xuất Excel), `src/sample.js` (dữ liệu mẫu giả lập – shop Đốm Sáng), `src/app.js` (giao diện).

## Tính năng bản 1.0.0 (TikTok Shop)
| Thẻ | Nội dung |
|---|---|
| Tổng quan | Dải dòng tiền doanh thu, 8 chỉ tiêu, biểu đồ theo ngày/tháng, cảnh báo đỏ số đơn trả cần HĐ điều chỉnh |
| Đối chiếu đơn hàng | Ghép Order ID: file Đơn – Income – Lịch sử rút tiền; 5 trạng thái; bấm dòng xem chi tiết phí |
| Đơn giao theo ngày | Chọn ngày (ô dd/mm/yyyy, ngày trước/sau, 14 ngày gần nhất) → đơn có Delivered Time ngày đó, xuất Excel; báo đơn đã trả sau giao |
| Đơn trả cần HĐ điều chỉnh | Đơn có Delivered Time + (Return/Refund \| SL trả > 0 \| Income có hoàn tiền hàng); trả toàn bộ/một phần, giá trị trả; tick "Đã lập HĐ ĐC" (lưu localStorage), nhãn "Mới" khi nạp file mới |
| Ví sàn & dòng tiền | Số dư đầu kỳ nhập tay (lưu máy) + Earnings − Withdrawal; theo tháng, theo ngày (so với quyết toán Income), danh sách lệnh rút |
| Lợi nhuận | 3 phạm vi (đã quyết toán / ước tính / tổng); thêm dòng "Phí đơn hủy/trả hàng" (phí giao thất bại…); xem theo đơn/ngày/tháng/SKU/sản phẩm |
| Giá vốn | Nhập theo SKU ID; ghép giá vốn từ thành phần (combo); gợi ý & cảnh báo giá vốn combo thấp bất thường (Combo n đơn vị) |
| Kiểm tra dữ liệu | Cảnh báo; tổng chi tiết khớp sheet Báo cáo; vùng khai báo/thực tế từng sheet |
| Xuất | Excel 10 sheet; báo cáo HTML gửi sếp (chọn mục, ghi chú, không có thông tin người mua) |

## Khác bản cũ
| # | Thay đổi | Lý do |
|---|---|---|
| 1 | Bỏ giá vốn cài sẵn của shop cũ; tên công cụ, file xuất không gắn tên shop | Dùng chung mọi shop |
| 2 | Ô ngày dd/mm/yyyy 3 phần (bỏ input type=date) | Quy tắc anh chốt |
| 3 | Thêm 2 thẻ Đơn giao theo ngày, Đơn trả cần HĐ điều chỉnh; thẻ Ví sàn | Anh duyệt 04/11 |
| 4 | Phí đơn hủy/trả hàng vào lợi nhuận | Bản cũ để ngoài báo cáo |
| 5 | Giá vốn combo ghép thành phần + cảnh báo | Phát hiện khi kiểm file mẫu |
| 6 | Giao diện theo bộ công cụ quantritute, Đốm, Góp ý, Thử với dữ liệu mẫu | Chuẩn công cụ web |

## Kiểm thử 04/11/2026 (4 file thật TikTok T8–9 – không dùng cho ảnh/video)
463 đơn (417/44/2) · Income 476 dòng · Σ quyết toán 76.386.902 = sheet Báo cáo · 2 đơn trả cần HĐ ĐC · 16 dòng phí đơn hủy/trả (−428.782) · gợi ý giá vốn combo 41.400 / 62.100 đúng · Excel 10 sheet mở được · báo cáo HTML mở được, chỉ xem · không lỗi JS.

## Nhật ký
| Ngày | Việc |
|---|---|
| 04/11/2026 | Bản 1.0.0 – dựng từ đầu theo phạm vi anh duyệt |
| 04/11/2026 22:20 | Bản 1.0.1 – nút "Xem dashboard lợi nhuận" (chỉ mở khi đủ giá vốn): 7 chỉ số, thác nước doanh thu → lợi nhuận, cơ cấu phí sàn, doanh thu/lợi nhuận/biên theo ngày-tháng, lợi nhuận theo sản phẩm, doanh thu theo kênh bán; tách thêm 6 khoản phí sàn (Voucher Xtra, quảng cáo cửa hàng…); file giá vốn chỉ lấy cột "Tên rút gọn" làm tên báo cáo; tải file trong bản xem trước claude.ai qua quyền lưu file |
| 04/11/2026 22:30 | Bản 1.0.2 – thẻ Lợi nhuận: mỗi khoản chi phí (giá vốn, phí sàn, phí đơn hủy/trả) hiện thêm % trên doanh thu dưới số tiền (bảng phạm vi, theo đơn/ngày/tháng/SKU/sản phẩm, dòng tổng); Excel thêm cột % tương ứng |
| 04/11/2026 22:40 | Bản 1.0.3 – Tổng quan: biểu đồ Doanh thu – Chi phí (giá vốn, phí sàn, phí đơn hủy/trả xếp chồng) – Lợi nhuận theo ngày/tháng (nút chọn), xem tháng có nhãn số + % trên doanh thu; ẩn/hiện qua "Chọn phần hiển thị"; nút Báo cáo gửi sếp có icon trên điện thoại |
| 06/11/2026 | Bản 1.1.0 – theo góp ý: (1) Tổng quan bấm thẻ Doanh thu đơn thành công / Đơn hủy-trả → mở Đối chiếu đơn hàng đã lọc, thêm hàng nút lọc Trạng thái đơn (Thành công, Hủy + trả, Hủy, Trả, Không có trong file Đơn); (2) thẻ mới **Hàng về kho**: đơn hủy khi ĐVVC đã lấy hàng (có Shipped Time hoặc Income có phí vận chuyển người bán) + đơn trả hàng; cột Order ID, ngày đặt, trạng thái, sản phẩm, phí VC người bán chịu, ngày hàng về kho (nhập, lưu localStorage `qtt_dsan_kho_v1`), ghi chú, tình trạng + số ngày chờ, doanh số, mã vận đơn; xuất Excel sheet Theo_doi_hang_ve_kho; báo cáo HTML có thể kèm; (3) thẻ Đơn hủy/trả hiện doanh số; (4) Kỳ dùng chung mọi thẻ, thẻ Giao theo ngày nay có bộ lọc kỳ; (5) số trên thẻ (Trả cần HĐ ĐC, Hàng về kho) tính theo kỳ đang chọn. Đổi tên thẻ ngắn gọn cho đủ 1 dòng. Sửa lỗi Báo cáo HTML gửi sếp không hiện Tổng quan (lỗi khởi tạo PMET). Kiểm file thật T8–9: 15 đơn hủy đã giao ĐVVC + 2 đơn trả = 17 đơn theo dõi; các số đối chiếu cũ giữ nguyên |
| 04/11/2026 23:30 | Bản 1.0.5 – vạch trục biểu đồ Tổng quan làm tròn số đẹp (kể cả khi lợi nhuận âm); đưa lên web ẩn: ảnh thẻ `assets/tools/loi-nhuan-san-tmdt.jpg`, ảnh chia sẻ `assets/tools/og/loi-nhuan-san-tmdt.jpg`, migration `_mig_tools_v22` (đổi bản ghi Coming soon thành công cụ chạy được, visible=0), thêm slug vào TOOL_SLUGS (góp ý) và tên trong Quản trị |
| 04/11/2026 22:50 | Bản 1.0.4 – biểu đồ Tổng quan: chọn 1 hoặc nhiều chỉ tiêu (Doanh thu mặc định, Giá vốn, Phí sàn, Phí hủy/trả, Lợi nhuận), tiêu đề đổi theo lựa chọn, màu riêng từng chỉ tiêu (giá vốn tím, phí sàn đỏ); thẻ Lợi nhuận: bỏ % ở bảng chi tiết, chỉ giữ ở bảng 3 phạm vi |
