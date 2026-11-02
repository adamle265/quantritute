/* 29/10/2026 – Bảng kê & Tờ khai thuế GTGT (thư mục cong-cu/to-khai-gtgt). Công cụ đặt hàng của anh Phương (kế toán), anh Tuấn chốt
   đưa lên web chung 29/10. Chưa có cuốn Coming soon cùng chủ đề trên web (đối chiếu /api/site 29/10) → thêm bản ghi mới slug to-khai-gtgt,
   chỉ thêm khi chưa có cuốn nào trỏ tới /tools/to-khai-gtgt/. Nội dung em soạn từ tính năng thật của bản 29/10/2026, anh duyệt/sửa ở Quản trị. */
const MIGRATE_TOOLS_V11 = [
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits)
   SELECT 'to-khai-gtgt', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'Bảng kê & Tờ khai thuế GTGT từ Excel', 'kt', 'Kế toán – tài chính',
     'Lọc, cộng tay mấy file danh sách hóa đơn chỉ để soát lại tờ khai GTGT',
     'Kế toán, Kế toán trưởng, Kế toán dịch vụ, Kiểm soát nội bộ, chủ doanh nghiệp nhỏ',
     'ok', 0, '/tools/to-khai-gtgt/', 0, '[]', '', (SELECT COALESCE(MAX(sort), 0) + 1 FROM tools), 1,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 0, 'calc', 'Tờ khai GTGT, Bảng kê hóa đơn, Hóa đơn điện tử, Đối chiếu, Excel',
     'Kéo thả nhiều file "Danh sách hóa đơn" xuất từ cổng thuế: bán ra, mua vào, hóa đơn có mã, không mã, máy tính tiền; nạp được file nhiều tháng để khai quý
Tự nhận MST doanh nghiệp, chiều bán ra / mua vào của từng file (chọn lại được), báo loại danh sách còn thiếu; bỏ trùng khi nạp trùng file
Tự loại hóa đơn đã bị thay thế, đã bị hủy; giữ đúng dấu hóa đơn điều chỉnh; ô Tính vào tờ khai, ô Được khấu trừ sửa được từng hóa đơn
Giá trị mua chưa VAT tính vào [23] theo cách MISA: hóa đơn công ty = tổng tiền chưa thuế + tổng tiền phí; hóa đơn hộ kinh doanh (tự nhận mẫu số 2 hoặc hóa đơn không có tiền chưa thuế, tiền thuế; tick lại được) = tổng tiền thanh toán
Danh sách không có thuế suất: công cụ suy từ tỷ lệ thuế / giá trị, tách ước tính hóa đơn nhiều thuế suất (VD 8% + 10%) để xác nhận hoặc sửa tay
Hóa đơn điều chỉnh, thay thế: chọn lý do (thương mại / sửa sai cùng kỳ / sửa sai kỳ trước) để xác định kỳ kê khai theo TT 91/2026, NĐ 252/2026, NĐ 181/2025
Thêm hóa đơn sửa sai lập kỳ sau cho hóa đơn gốc thuộc kỳ đang lập; hóa đơn gốc bị thay thế tự không tính
Bảng kê tổng hợp Excel 4 sheet: Hóa đơn mua vào, Mua vào điều chỉnh – thay thế, Hóa đơn bán ra, Bán ra điều chỉnh – thay thế; tách giá trị, thuế theo từng thuế suất
Tờ khai 01/GTGT theo TT 89/2026 (chọn được mẫu TT 80/2021): Excel gồm tờ khai, bảng kê theo nhóm, phụ lục giảm thuế NQ 204; file XML theo cấu trúc HTKK
Đối chiếu 27 chỉ tiêu với tờ khai lập trên phần mềm kế toán: nạp file XML tờ khai (cấu trúc HTKK) hoặc gõ số, chỉ ra chỉ tiêu lệch và gợi ý nguyên nhân
Lấy [22] và thông tin người nộp thuế từ XML tờ khai kỳ trước; số tự nhập nhớ theo từng kỳ
Tải bản dùng offline: 1 file HTML, mở bằng Chrome / Edge, không cần mạng',
     'Đủ mọi loại danh sách | Kéo thả nhiều file một lúc, tự nhận bán ra / mua vào, hóa đơn có mã, không mã, máy tính tiền, tự bỏ trùng.
Thuế suất tự suy ra | Danh sách cổng thuế không có thuế suất: công cụ suy từ tỷ lệ thuế, tách ước tính hóa đơn vừa 8% vừa 10% để kế toán xác nhận.
Soát lại tờ khai phần mềm | Nạp XML tờ khai (cấu trúc HTKK) hoặc gõ số, so 27 chỉ tiêu, chỉ ra chỉ tiêu lệch và gợi ý nguyên nhân.
Dữ liệu không rời máy | File xử lý trên trình duyệt của bạn, có bản tải về dùng không cần mạng.',
     'Bấm "Dùng online". Trên hoadondientu.gdt.gov.vn → Tra cứu hóa đơn, xuất Excel danh sách bán ra, mua vào (có mã, không mã, máy tính tiền) của kỳ.
Bước 1: kéo thả các file vào công cụ, kiểm tra MST doanh nghiệp và chiều bán ra / mua vào của từng file.
Bước 2: xác nhận thuế suất ước tính (ô viền cam), chọn lý do cho hóa đơn điều chỉnh / thay thế, bỏ tick hóa đơn không tính hoặc không được khấu trừ; tải bảng kê Excel.
Bước 3: chọn kỳ, nhập [22] và các chỉ tiêu tự nhập; tải Excel hoặc XML tờ khai; nạp XML tờ khai từ phần mềm kế toán để đối chiếu.',
     'Bản 1.0.0', '2026-10-29', 'Tuấn · Quản trị tử tế', '/tools/to-khai-gtgt/index.html', '',
     'Gộp các file danh sách hóa đơn tải từ cổng thuế thành 1 bảng kê Excel: mua vào, bán ra, hóa đơn điều chỉnh – thay thế, tách theo thuế suất.
Lập tờ khai 01/GTGT, phụ lục giảm thuế NQ 204 và file XML theo cấu trúc HTKK ngay từ bảng kê.
Đối chiếu từng chỉ tiêu với tờ khai lập trên phần mềm kế toán, biết ngay chỉ tiêu nào lệch, lệch bao nhiêu.
Xác định kỳ kê khai hóa đơn điều chỉnh, thay thế theo TT 91/2026, NĐ 252/2026; tự loại hóa đơn đã bị thay thế, bị hủy.'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'to-khai-gtgt' OR url = '/tools/to-khai-gtgt/')`,
];
