/* 22/10/2026 – Ghép & đối chiếu 2 file Excel (thư mục cong-cu/ghep-doi-chieu, bản 1.7.8). Anh Tuấn chốt: DÙNG LẠI cuốn Coming soon
   "doi-chieu-sao-ke" (Đối chiếu sao kê và sổ phụ ngân hàng) – đổi tên thành Ghép & đối chiếu 2 file Excel, giữ slug và Nổi bật.
   Chỉ chạy khi bản ghi còn Coming soon (url = ''); trường anh đã tự nhập thì giữ nguyên (trừ giá trị mặc định cũ).
   Phòng khi trên web không còn cuốn đó: thêm bản ghi mới slug ghep-doi-chieu nếu chưa có cuốn nào trỏ tới /tools/ghep-doi-chieu/. */
const MIGRATE_TOOLS_V8 = [
  `UPDATE tools SET
    name = 'Ghép & đối chiếu 2 file Excel',
    url = '/tools/ghep-doi-chieu/',
    download_url = CASE WHEN download_url = '' THEN '/tools/ghep-doi-chieu/index.html' ELSE download_url END,
    status = 'ok', grp = 'kt', featured = 1, eta = '',
    icon = CASE WHEN icon = '' THEN 'files' ELSE icon END,
    tags = CASE WHEN tags IN ('', 'Ngân hàng, Đối chiếu') THEN 'Đối chiếu, Sao kê ngân hàng, Excel, Công nợ, Hóa đơn' ELSE tags END,
    pain = CASE WHEN pain = '' THEN 'Đối chiếu sao kê, sổ sách bằng VLOOKUP cả buổi vẫn sót – lệch ngày, tách khoản là không khớp.' ELSE pain END,
    who = CASE WHEN who IN ('', 'Kế toán') THEN 'Kế toán, Kế toán trưởng, Kiểm soát nội bộ, Sales admin, Hành chính – Nhân sự, chủ doanh nghiệp nhỏ' ELSE who END,
    released = CASE WHEN released = '' THEN '2026-10-22' ELSE released END,
    version = CASE WHEN version = '' THEN 'Bản 1.7.8' ELSE version END,
    benefits = CASE WHEN benefits = '' THEN 'Đối chiếu sao kê ngân hàng với sổ tiền gửi, TK 112: tiền vào – tiền ra, lệch ngày ghi sổ, tách khoản.
Tìm ngay dòng có ở file này mà file kia không có: đơn chưa ghi sổ, mã khách sai, nhân sự thiếu chấm công.
So số tiền từng dòng, tô vàng ô lệch và tách tổng chênh lệch do dòng lệch hay dòng thiếu.
Xuất Excel đã tô màu theo trạng thái, lưu thiết lập để tháng sau chạy lại.' ELSE benefits END,
    highlights = CASE WHEN highlights = '' THEN 'Không cần công thức | Chọn cặp cột hoặc bấm Gợi ý, công cụ tự ghép – không cần VLOOKUP hay Power Query.
Hiểu cách ghi sổ | Khớp ngày bỏ qua giờ, tiền vào – tiền ra, cảnh báo lệch ngày và tách khoản (VD nộp BHXH).
File lớn vẫn nhanh | 200.000 dòng ghép trong vài giây ngay trên trình duyệt.
Dữ liệu không rời máy | File xử lý trên máy bạn, không tải lên máy chủ.' ELSE highlights END,
    features = CASE WHEN features = '' THEN 'Thả 1 hoặc 2 file Excel/CSV là vào việc ngay; thiếu file nào công cụ nhắc
Tự dò dòng tiêu đề, tự bỏ dòng Cộng, Số dư, chữ ký cuối sổ; bỏ tick từng dòng không muốn đối chiếu
Gộp dòng theo khóa (cộng tiền theo số hóa đơn, mã khách…) trước khi đối chiếu
2 nhóm điều kiện: Thỏa mãn đồng thời (VÀ) và Thỏa mãn một trong (HOẶC) – VD tiền vào = Nợ HOẶC tiền ra = Có
Gợi ý cặp đối chiếu theo tên cột trùng hoặc dữ liệu khớp từ 80%
Làm sạch khóa: khoảng trắng, hoa/thường, Unicode, ngày bỏ qua giờ, chỉ giữ chữ và số, bỏ dấu, chuẩn hoá số điện thoại
Cho phép số tiền lệch ± đồng hoặc ± % (phí chuyển khoản, làm tròn); ghép 1–1 khi nhiều khoản cùng số tiền
7 kiểu ghép; báo cáo tra soát: khớp, lệch giá trị (tô vàng ô lệch), chỉ có ở A, chỉ có ở B, cột số chênh lệch
Cảnh báo dòng trùng số liệu nhưng lệch ngày (chọn số ngày) và 1 dòng bằng tổng nhiều dòng cùng ngày
Bảng đối chiếu tổng tiền A − B; xem, lọc, tìm kiếm toàn bộ kết quả; chọn lại cột ngay ở màn kết quả
Xuất Excel tô màu, mỗi trạng thái một sheet; lưu thiết lập để lần sau nạp lại' ELSE features END,
    guide = CASE WHEN guide = '' THEN 'Bấm "Dùng online", thả 2 file cần đối chiếu (file chính và file đối chiếu) vào khung tải file.
Bước 2: chọn cặp cột ở nhóm Thỏa mãn đồng thời hoặc Thỏa mãn một trong – bấm Gợi ý cặp đối chiếu cho nhanh.
Bước 3: chọn kiểu ghép; muốn so số tiền từng dòng thì chọn Báo cáo tra soát toàn diện, bấm Chạy.
Bước 4: xem, lọc dòng lệch, tải Excel. Bấm Lưu thiết lập để tháng sau dùng lại.' ELSE guide END,
    updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'doi-chieu-sao-ke' AND url = ''`,
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits)
   SELECT 'ghep-doi-chieu', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'Ghép & đối chiếu 2 file Excel', 'kt', 'Kế toán – tài chính',
     'Đối chiếu sao kê, sổ sách bằng VLOOKUP cả buổi vẫn sót – lệch ngày, tách khoản là không khớp.',
     'Kế toán, Kế toán trưởng, Kiểm soát nội bộ, Sales admin, Hành chính – Nhân sự, chủ doanh nghiệp nhỏ',
     'ok', 0, '/tools/ghep-doi-chieu/', 0, '[]', '', (SELECT COALESCE(MAX(sort), 0) + 1 FROM tools), 1,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 1, 'files', 'Đối chiếu, Sao kê ngân hàng, Excel, Công nợ, Hóa đơn',
     'Thả 1 hoặc 2 file Excel/CSV là vào việc ngay; thiếu file nào công cụ nhắc
Tự dò dòng tiêu đề, tự bỏ dòng Cộng, Số dư, chữ ký cuối sổ; bỏ tick từng dòng không muốn đối chiếu
Gộp dòng theo khóa (cộng tiền theo số hóa đơn, mã khách…) trước khi đối chiếu
2 nhóm điều kiện: Thỏa mãn đồng thời (VÀ) và Thỏa mãn một trong (HOẶC) – VD tiền vào = Nợ HOẶC tiền ra = Có
Gợi ý cặp đối chiếu theo tên cột trùng hoặc dữ liệu khớp từ 80%
Làm sạch khóa: khoảng trắng, hoa/thường, Unicode, ngày bỏ qua giờ, chỉ giữ chữ và số, bỏ dấu, chuẩn hoá số điện thoại
Cho phép số tiền lệch ± đồng hoặc ± % (phí chuyển khoản, làm tròn); ghép 1–1 khi nhiều khoản cùng số tiền
7 kiểu ghép; báo cáo tra soát: khớp, lệch giá trị (tô vàng ô lệch), chỉ có ở A, chỉ có ở B, cột số chênh lệch
Cảnh báo dòng trùng số liệu nhưng lệch ngày (chọn số ngày) và 1 dòng bằng tổng nhiều dòng cùng ngày
Bảng đối chiếu tổng tiền A − B; xem, lọc, tìm kiếm toàn bộ kết quả; chọn lại cột ngay ở màn kết quả
Xuất Excel tô màu, mỗi trạng thái một sheet; lưu thiết lập để lần sau nạp lại',
     'Không cần công thức | Chọn cặp cột hoặc bấm Gợi ý, công cụ tự ghép – không cần VLOOKUP hay Power Query.
Hiểu cách ghi sổ | Khớp ngày bỏ qua giờ, tiền vào – tiền ra, cảnh báo lệch ngày và tách khoản (VD nộp BHXH).
File lớn vẫn nhanh | 200.000 dòng ghép trong vài giây ngay trên trình duyệt.
Dữ liệu không rời máy | File xử lý trên máy bạn, không tải lên máy chủ.',
     'Bấm "Dùng online", thả 2 file cần đối chiếu (file chính và file đối chiếu) vào khung tải file.
Bước 2: chọn cặp cột ở nhóm Thỏa mãn đồng thời hoặc Thỏa mãn một trong – bấm Gợi ý cặp đối chiếu cho nhanh.
Bước 3: chọn kiểu ghép; muốn so số tiền từng dòng thì chọn Báo cáo tra soát toàn diện, bấm Chạy.
Bước 4: xem, lọc dòng lệch, tải Excel. Bấm Lưu thiết lập để tháng sau dùng lại.',
     'Bản 1.7.8', '2026-10-22', 'Tuấn · Quản trị tử tế', '/tools/ghep-doi-chieu/index.html', '',
     'Đối chiếu sao kê ngân hàng với sổ tiền gửi, TK 112: tiền vào – tiền ra, lệch ngày ghi sổ, tách khoản.
Tìm ngay dòng có ở file này mà file kia không có: đơn chưa ghi sổ, mã khách sai, nhân sự thiếu chấm công.
So số tiền từng dòng, tô vàng ô lệch và tách tổng chênh lệch do dòng lệch hay dòng thiếu.
Xuất Excel đã tô màu theo trạng thái, lưu thiết lập để tháng sau chạy lại.'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'ghep-doi-chieu' OR url = '/tools/ghep-doi-chieu/')`,
];
