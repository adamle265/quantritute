 dict(slug='lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don', t=TK, ngay='29/10/2026', ngay_iso='2026-10-29',
  title='Lập bảng kê và soát lại tờ khai GTGT từ file "Danh sách hóa đơn" của cổng thuế',
  short='Bảng kê & soát tờ khai GTGT',
  desc='Gộp các file Danh sách hóa đơn bán ra, mua vào (có mã, không mã, máy tính tiền) tải từ hoadondientu.gdt.gov.vn thành bảng kê Excel, lập tờ khai 01/GTGT và đối chiếu với tờ khai trên phần mềm kế toán. Miễn phí, chạy trên trình duyệt.',
  tldr=['Phần mềm kế toán lập được tờ khai GTGT, nhưng kế toán vẫn cần một cách soát lại độc lập từ chính dữ liệu cổng thuế.',
        'Công cụ gộp các file "Danh sách hóa đơn" xuất Excel từ cổng thuế thành bảng kê 4 sheet, lập tờ khai 01/GTGT và so từng chỉ tiêu với file XML tờ khai của phần mềm.',
        'File danh sách không có thuế suất: công cụ suy từ tỷ lệ thuế, hóa đơn nhiều thuế suất được đánh dấu để anh/chị xác nhận.',
        'Chạy ngay trên trình duyệt, file không gửi lên máy chủ; có bản tải về dùng không cần mạng.'],
  body='''
<h2>Vì sao cần soát lại tờ khai từ danh sách hóa đơn?</h2>
<p>Tờ khai trên phần mềm kế toán được lập từ chứng từ đã hạch toán. Hóa đơn chưa hạch toán, hạch toán nhầm kỳ, hóa đơn không mã của điện lực, ngân hàng, viễn thông hay hóa đơn máy tính tiền rất dễ bị sót. Danh sách hóa đơn trên cổng hoadondientu.gdt.gov.vn là nguồn đối chiếu độc lập, nhưng mỗi lần xuất ra 4–6 file Excel (bán ra, mua vào; có mã, không mã, máy tính tiền), lọc và cộng tay rất mất thời gian.</p>
<h2>Cách làm bằng công cụ</h2>
<ol class="steps">
<li><b>Xuất danh sách trên cổng thuế:</b> Tra cứu hóa đơn → chọn bán ra hoặc mua vào, khoảng ngày của kỳ → Xuất Excel. Làm đủ các loại: hóa đơn điện tử có mã, không mã, hóa đơn máy tính tiền.</li>
<li><b>Nạp danh sách:</b> kéo thả tất cả file vào công cụ. Công cụ tự nhận mã số thuế doanh nghiệp, file nào bán ra, mua vào, hóa đơn máy tính tiền; báo loại danh sách còn thiếu và bỏ dòng trùng.</li>
<li><b>Bảng kê tổng hợp:</b> xác nhận thuế suất ước tính (ô viền cam), chọn lý do cho hóa đơn điều chỉnh / thay thế, bỏ tick hóa đơn không tính vào tờ khai hoặc không được khấu trừ. Tải Excel 4 sheet: hóa đơn mua vào, mua vào điều chỉnh – thay thế, hóa đơn bán ra, bán ra điều chỉnh – thay thế.</li>
<li><b>Tờ khai 01/GTGT:</b> chọn tháng hoặc quý, nhập [22] (hoặc lấy từ XML tờ khai kỳ trước) và các chỉ tiêu tự nhập. Tải Excel tờ khai (kèm bảng kê theo nhóm, phụ lục giảm thuế) hoặc file XML theo cấu trúc HTKK.</li>
<li><b>Đối chiếu:</b> nạp file XML tờ khai xuất từ phần mềm kế toán (hoặc gõ số). Công cụ so 27 chỉ tiêu, tô đỏ chỉ tiêu lệch kèm số chênh lệch và gợi ý nguyên nhân thường gặp.</li>
</ol>
<h2>Công cụ tính số liệu theo quy tắc nào?</h2>
<ul>
<li>Hóa đơn đã bị thay thế, đã bị hủy được liệt kê nhưng không tính; hóa đơn điều chỉnh tính theo đúng dấu số tiền trên danh sách (âm là điều chỉnh giảm); hóa đơn trùng chỉ tính 1 lần.</li>
<li>Thuế suất suy từ Tiền thuế / Tổng chưa thuế. Hóa đơn không khớp đúng một mức (VD vừa 8% vừa 10%) được tách ước tính bằng 2 mức kề nhau và đánh dấu để xác nhận hoặc nhập tay theo hóa đơn gốc.</li>
<li>Hóa đơn 8% (giảm thuế GTGT theo Nghị quyết 204/2025/QH15) kê vào nhóm 10% với số thuế thực tế, kèm phụ lục giảm thuế.</li>
<li>Kỳ kê khai hóa đơn điều chỉnh, thay thế: điều chỉnh thương mại (chiết khấu, trả lại hàng, quyết toán…) người bán kê vào kỳ lập, người mua kê vào kỳ nhận hóa đơn điều chỉnh (Thông tư 91/2026/TT-BTC Điều 10 khoản 6 điểm d). Hóa đơn sửa sai cho hóa đơn kỳ trước: công cụ chuyển sang nhóm khai bổ sung kỳ của hóa đơn gốc theo Nghị định 252/2026/NĐ-CP Điều 12 khoản 6; với thuế đầu vào áp dụng Nghị định 181/2025/NĐ-CP Điều 23 khoản 6.</li>
</ul>
<p class="warn">Lưu ý: danh sách hóa đơn trên cổng thuế chưa phải toàn bộ số liệu kê khai (tờ khai hải quan hàng nhập khẩu, chứng từ khác phải tự cộng thêm), và cổng thuế có lúc trả thiếu hóa đơn. Cách áp dụng quy định về hóa đơn điều chỉnh là gợi ý của công cụ; kế toán quyết định và chịu trách nhiệm số liệu nộp.</p>''',
  faq=[('Công cụ có thay phần mềm kế toán lập tờ khai không?','Không. Công cụ dùng để lập lại và soát tờ khai từ dữ liệu cổng thuế; anh/chị đối chiếu rồi nộp bằng HTKK, eTax hoặc phần mềm kế toán.'),
       ('Danh sách hóa đơn không có thuế suất, công cụ biết thuế suất bằng cách nào?','Công cụ suy từ tỷ lệ tiền thuế trên tổng chưa thuế. Hóa đơn nhiều thuế suất được tách ước tính và đánh dấu để anh/chị xác nhận hoặc sửa theo hóa đơn gốc.'),
       ('Đối chiếu được với tờ khai của phần mềm nào?','Công cụ đọc file XML tờ khai 01/GTGT theo cấu trúc của HTKK. Phần mềm của anh/chị xuất được file theo cấu trúc này thì nạp trực tiếp; không có file thì gõ số từng chỉ tiêu để so.'),
       ('Có tốn phí không?','Không, công cụ dùng miễn phí.')],
  rel=['lap-to-khai-thue-gtgt-mau-01-gtgt','tai-hoa-don-dien-tu-hang-loat']),
