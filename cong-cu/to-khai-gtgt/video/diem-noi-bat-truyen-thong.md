# Bảng kê & Tờ khai thuế GTGT từ Excel – Điểm nổi bật để truyền thông

> Công cụ ra đời từ **đặt hàng thật của anh Phương (kế toán, dùng MISA AMIS)** ngày 28/10/2026 – khách hàng đầu tiên chủ động đặt công cụ. Mỗi mục dưới đây là góp ý thật của anh Phương / anh Minh Tuấn khi dùng thử. Viết theo lợi ích: đỡ việc gì, yên tâm điều gì. Nhắc tên anh Phương khi truyền thông: cần anh Phương đồng ý.
> **Câu chuyện:** anh Phương nhận công cụ, gửi tiền cafe và **đồng ý để công cụ miễn phí trong kho công cụ** cho ai có nhu cầu (29/10/2026) – từ đơn đặt hàng riêng thành công cụ cộng đồng.
> **Phản hồi người dùng đầu tiên (29/10 tối, form góp ý, 5/5★):** chị Mai Ngọc Hằng – "công cụ quá okela… Mình đang dùng AMIS khác ok rồi nhưng vẫn rất thích có thêm công cụ test lại. Cảm ơn tác giả rất rất nhiều." *(Trích dẫn công khai cần chị Hằng đồng ý.)*
> Cập nhật: 29/10/2026 11:35 – bản 1.0.2, tên mới.

| # | Tình huống thực tế (nỗi đau) | Công cụ giải quyết | Câu truyền thông gợi ý | Cảnh quay |
|---|---|---|---|---|
| 1 | Phần mềm đã lập tờ khai, nhưng muốn **soát lại độc lập** từ chính dữ liệu cổng thuế | Lập tờ khai từ danh sách hóa đơn + **đối chiếu 27 chỉ tiêu** với XML tờ khai (cấu trúc HTKK) hoặc số gõ tay từ phần mềm – *XML AMIS: chờ anh Phương thử, chưa nói khi truyền thông* | ✔ Tờ khai trên phần mềm có khớp cổng thuế không – biết trong 1 phút | Nạp XML → bảng đối chiếu, 1 dòng đỏ "+733.801" |
| 2 | Cổng thuế tải về 4–6 file (có mã, không mã, máy tính tiền, bán, mua), phải gộp tay | Kéo thả tất cả 1 lần, tự nhận loại file, bán/mua, bỏ trùng | ✔ Bao nhiêu file cũng thả 1 lần, công cụ tự nhận | Thả 4 file → bảng "File đã nạp" |
| 3 | File danh sách **không có thuế suất**, HĐ nhà hàng vừa 8% vừa 10% | Tự suy thuế suất, tách ước tính, ô viền cam để xác nhận / sửa | ✔ Không phải mở từng hóa đơn để xem thuế suất | Lọc "Thuế suất cần xác nhận" → ✓ hàng loạt |
| 4 | **Lọc HĐ đã bị điều chỉnh / thay thế** trong hàng nghìn dòng mất thời gian (góp ý anh Phương) | Thẻ + sheet riêng cho mua vào và bán ra điều chỉnh / thay thế | ✔ HĐ điều chỉnh, thay thế, bị hủy – tách sẵn 1 chỗ, mua riêng bán riêng | Bấm thẻ "Bán ra điều chỉnh / thay thế (5)" |
| 5 | HĐ sửa sai lập **kỳ sau** cho HĐ kỳ này – muốn đưa vào tờ khai (góp ý anh Phương) | Thêm HĐ sửa sai, bắt buộc HĐ gốc thuộc kỳ, HĐ gốc bị thay thế tự không tính | ✔ HĐ sửa sai về muộn vẫn vào đúng kỳ của HĐ gốc | Gõ HĐ gốc → "Tìm thấy – thuộc tháng 09" |
| 6 | Không chắc HĐ điều chỉnh kê kỳ nào | Ô Lý do: thương mại / sửa sai cùng kỳ / sửa sai kỳ trước → tự xác định kỳ theo TT 91/2026, NĐ 252/2026, NĐ 181/2025 | ✔ Kê đúng kỳ theo văn bản mới nhất | Chọn "Sửa sai – HĐ gốc kỳ trước" → "khai bổ sung kỳ gốc" |
| 7 | Muốn tự quyết HĐ nào không kê (góp ý anh Phương) | Ô **Tính vào tờ khai** sửa được từng HĐ | ✔ Kế toán quyết, công cụ tính | Bỏ tick → [23] đổi ngay |
| 9 | [23] tự cộng lệch MISA vì **tổng tiền phí** và **HĐ hộ kinh doanh** (góp ý anh Phương) | [23] lấy như MISA: HĐ công ty = chưa thuế + phí; HĐ hộ KD = tổng thanh toán; tự nhận HĐ hộ KD (mẫu số 2 / không có thuế), tick lại được, bộ lọc riêng | ✔ [23] lấy đúng cách MISA – hộ kinh doanh tự nhận | Lọc "HĐ hộ kinh doanh" → ô tick "tự nhận" → dòng [23] |
| 10 | Nhập tay HĐ sửa sai bị **kê trùng** do còn dòng lưu lần trước (góp ý anh Phương) | Chặn nhập trùng, báo rõ dòng lưu từ trước, nút "↺ Làm lại từ đầu" | ✔ Không lo kê trùng | Thêm lại A-8 → thông báo chặn |
| 11 | Lọc ra hàng chục HĐ cần bỏ / cần kê, phải tick từng dòng (góp ý chị Mai Ngọc Hằng – người dùng web, 29/10) | Ô "Tất cả" ở cột Tính vào TK cho HĐ đang lọc + "↺ mặc định" | ✔ Lọc xong, 1 lần bấm cho cả danh sách | Lọc "Mua vào từ 5 triệu" → bỏ tick Tất cả |
| 8 | Dữ liệu khách hàng nhạy cảm | Xử lý ngay trên trình duyệt + **bản tải về dùng offline** | ✔ Hóa đơn không rời máy | Nút "Tải bản dùng offline" |

**Kết quả thật để kể (dữ liệu khách tháng 09/2026, đã ẩn tên):** 1.191 hóa đơn từ 4 file → bảng kê + tờ khai trong vài giây; số [23], [24], [32], [33], [40] **khớp 100%** với phép tính độc lập. *(Chỉ nêu số khi anh Phương đồng ý.)*
