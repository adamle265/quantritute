# -*- coding: utf-8 -*-
"""Thêm 2 bài hướng dẫn công cụ Ghép & đối chiếu 2 file Excel vào site/huong-dan-nguon/tao-trang.py (chạy 1 lần, 22/10/2026)."""
import io, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tao-trang.py')
s = io.open(P, encoding='utf-8').read()
assert 'ghep-doi-chieu-2-file-excel-khong-can-vlookup' not in s, 'Đã thêm rồi'

# 1) công cụ mới
a = "VB = {'name': 'Tạo văn bản hàng loạt', 'tool': '/tools/tao-van-ban-hang-loat/', 'info': '/cong-cu/van-ban-hang-loat'}\n"
assert s.count(a) == 1
s = s.replace(a, a + "GD = {'name': 'Ghép & đối chiếu 2 file Excel', 'tool': '/tools/ghep-doi-chieu/', 'info': '/cong-cu/doi-chieu-sao-ke'}\n")

# 2) ngày cập nhật riêng từng bài (bài mới 22/10)
for old, new in [("\"datePublished\": NGAY_ISO, \"dateModified\": NGAY_ISO,", "\"datePublished\": p.get('ngay_iso', NGAY_ISO), \"dateModified\": p.get('ngay_iso', NGAY_ISO),"),
                 ("<p class=\"meta\">Cập nhật {NGAY} · Đốm – Quản trị tử tế</p>", "<p class=\"meta\">Cập nhật {p.get('ngay', NGAY)} · Đốm – Quản trị tử tế</p>")]:
    assert s.count(old) == 1, old; s = s.replace(old, new)

# 3) mô tả trang danh mục
old = "'Hướng dẫn từng bước: tải hóa đơn điện tử hàng loạt, chuyển XML sang Excel, lập tờ khai 01/GTGT, tạo văn bản hàng loạt – kèm công cụ miễn phí.'"
assert s.count(old) == 1
s = s.replace(old, "'Hướng dẫn từng bước: tải hóa đơn điện tử hàng loạt, chuyển XML sang Excel, lập tờ khai 01/GTGT, tạo văn bản hàng loạt, đối chiếu sao kê ngân hàng và 2 file Excel – kèm công cụ miễn phí.'")

# 4) 2 bài mới
NEW = r"""
 dict(slug='doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan', t=GD, ngay='22/10/2026', ngay_iso='2026-10-22',
  title='Đối chiếu sao kê ngân hàng với sổ kế toán (TK 112) bằng Excel: tìm khoản lệch trong vài phút',
  short='Đối chiếu sao kê ngân hàng với sổ TK 112',
  desc='Cách đối chiếu sao kê ngân hàng với sổ tiền gửi, sổ TK 112: khớp tiền vào – tiền ra, bỏ qua giờ giao dịch, phát hiện lệch ngày ghi sổ, khoản bị tách, phí chuyển khoản. Công cụ miễn phí, xử lý trên máy.',
  tldr=['Dò sao kê với sổ TK 112 bằng VLOOKUP hay báo "không khớp" vì sao kê có giờ, tiền vào – ra nằm ở 2 cột, nhiều khoản trùng số tiền.',
        'Công cụ Ghép & đối chiếu ghép theo ngày + (tiền vào = Thu HOẶC tiền ra = Chi), chỉ ra dòng chỉ có ở sao kê, chỉ có ở sổ.',
        'Cảnh báo riêng khoản ghi sổ lệch ngày và 1 lệnh ngân hàng bằng tổng nhiều bút toán (VD nộp BHXH); file không rời máy.'],
  body='''
<h2>Vì sao đối chiếu sao kê bằng VLOOKUP hay "không khớp"?</h2>
<ul>
<li><b>Sao kê ghi cả giờ</b> (25/09/2026 16:42:10), sổ kế toán chỉ có ngày (25/09/2026) – Excel coi là 2 giá trị khác nhau.</li>
<li><b>Tiền vào, tiền ra nằm ở 2 cột</b> (Số tiền gửi vào / Số tiền rút ra trên sao kê, Thu / Chi hoặc Phát sinh Nợ / Có trên sổ). Đặt cả hai cặp cùng lúc thì không dòng nào khớp.</li>
<li><b>Nhiều khoản cùng số tiền, cùng ngày</b>: VLOOKUP luôn lấy dòng đầu tiên, khoản thứ hai bị báo thiếu sai.</li>
<li><b>Ngân hàng ghi 1 lệnh, kế toán tách nhiều bút toán</b>: một lệnh nộp BHXH 20 triệu trên sao kê là 4 dòng BHXH, BHYT, BHTN, lãi chậm đóng trên sổ.</li>
<li><b>Ghi sổ lệch ngày</b> (tiền về buổi tối, hôm sau mới hạch toán) và <b>phí chuyển khoản</b> bị trừ thẳng vào số tiền.</li>
</ul>
<h2>Chuẩn bị 2 file</h2>
<ul>
<li><b>File A – sao kê</b>: xuất Excel (.xlsx, .xls) hoặc CSV từ internet banking cho kỳ cần đối chiếu.</li>
<li><b>File B – sổ chi tiết TK 112 / sổ tiền gửi</b> của đúng tài khoản đó, xuất từ phần mềm kế toán.</li>
<li>Không cần xoá dòng tiêu đề, dòng "Số dư đầu kỳ", "Cộng", chữ ký: công cụ tự nhận và bỏ, có báo đã bỏ dòng nào.</li>
</ul>
<h2>Cách làm</h2>
<ol class="steps">
<li><b>Mở công cụ, thả 2 file</b> vào khung tải file (chọn cùng lúc: file thứ nhất là sao kê, file thứ hai là sổ). Thiếu file nào công cụ nhắc; chọn nhầm thì bấm <b>Đổi chỗ File A ↔ File B</b>.</li>
<li><b>Bước 2 – nhóm "Thỏa mãn đồng thời các điều kiện"</b>: chọn <code>Ngày giao dịch = Ngày hạch toán</code>. Tuỳ chọn <b>Khớp ngày/tháng/năm, bỏ qua giờ</b> đã bật sẵn.</li>
<li><b>Nhóm "Thỏa mãn một trong các điều kiện"</b>: <code>Số tiền gửi vào = Thu</code> và <code>Số tiền rút ra = Chi</code> (hoặc Phát sinh Nợ / Phát sinh Có). Bấm <b>Gợi ý cặp đối chiếu</b> để công cụ tìm cặp cột khớp. Công cụ tự chuyển sang <b>Ghép 1–1</b> để 2 khoản cùng số tiền ghép với 2 dòng sổ khác nhau.</li>
<li><b>Có phí chuyển khoản?</b> Mở <b>Tuỳ chọn nâng cao</b>, nhập số tiền được lệch (VD 20.000 đồng). Công cụ khớp chính xác hết trước, phần còn lại mới ghép theo dung sai và đánh dấu để anh/chị kiểm tra.</li>
<li><b>Bước 3</b>: chọn <b>Báo cáo tra soát toàn diện</b>, giữ bật cảnh báo lệch ngày (mặc định tối đa 3 ngày) và khớp tổng nhiều dòng, bấm <b>Chạy</b>. Bước 4 xem, lọc kết quả và tải Excel.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/doi-chieu-hai-nhom-dieu-kien.webp" width="1020" height="894" loading="lazy" alt="Bước 2 của công cụ Ghép và đối chiếu: Ngày giao dịch bằng Ngày hạch toán, và Số tiền gửi vào bằng Thu hoặc Số tiền rút ra bằng Chi"><figcaption>Điều kiện khớp khi đối chiếu sao kê: cùng ngày VÀ (tiền vào = Thu HOẶC tiền ra = Chi).</figcaption></figure>
<h2>Đọc kết quả thế nào?</h2>
<figure class="fig"><img src="/huong-dan/anh/doi-chieu-sao-ke-ket-qua.webp" width="1200" height="393" loading="lazy" alt="Kết quả đối chiếu sao kê với sổ tiền gửi: số dòng khớp, lệch giá trị, lệch ngày, khớp tổng nhiều dòng, khớp nhờ dung sai, chỉ có ở từng file"><figcaption>Kết quả với dữ liệu minh họa: mỗi trạng thái có thẻ đếm riêng và tab lọc riêng.</figcaption></figure>
<div class="tw"><table><tr><th>Trạng thái</th><th>Ý nghĩa</th><th>Thường do</th></tr>
<tr><td>Khớp</td><td>Sao kê và sổ cùng ngày, cùng số tiền</td><td>–</td></tr>
<tr><td>Lệch giá trị</td><td>Ghép được nhờ dung sai, kèm số tiền chênh</td><td>Phí chuyển khoản, làm tròn</td></tr>
<tr><td>⚠ Lệch ngày</td><td>Trùng số tiền, khác ngày trong số ngày cho phép</td><td>Tiền về buổi tối, hôm sau mới ghi sổ</td></tr>
<tr><td>⚠ Khớp tổng</td><td>1 dòng bằng tổng nhiều dòng cùng ngày ở file kia</td><td>1 lệnh nộp BHXH, thuế được tách nhiều bút toán</td></tr>
<tr><td>Chỉ có ở A (sao kê)</td><td>Ngân hàng có, sổ chưa có</td><td>Phí, lãi ngân hàng chưa hạch toán</td></tr>
<tr><td>Chỉ có ở B (sổ)</td><td>Sổ có, sao kê chưa có</td><td>Khoản ghi sổ trước khi tiền về, ghi nhầm tài khoản</td></tr></table></div>
<figure class="fig"><img src="/huong-dan/anh/doi-chieu-khop-tong-bhxh.webp" width="1200" height="237" loading="lazy" alt="Tab Khớp tổng: 1 lệnh nộp BHXH 20 triệu trên sao kê bằng tổng 4 dòng trên sổ cùng ngày"><figcaption>Tab Khớp tổng: lệnh nộp BHXH 20.000.000 trên sao kê = 4 bút toán cùng ngày trên sổ (dữ liệu minh họa).</figcaption></figure>
<div class="note">Lệch ngày và khớp tổng chỉ là <b>cảnh báo</b>, công cụ không tự tính là khớp: các dòng này vẫn nằm trong Chỉ có ở A / Chỉ có ở B để kế toán xem và quyết định.</div>
<h2>Mẹo để tháng sau làm nhanh hơn</h2>
<ul>
<li>Bấm <b>Lưu thiết lập</b> ở bước kết quả. Tháng sau tải 2 file mới rồi bấm <b>Nạp thiết lập đã lưu</b> ở Bước 1: các cặp cột và tuỳ chọn tự áp dụng.</li>
<li>Mỗi lần đối chiếu một tài khoản ngân hàng với sổ chi tiết của đúng tài khoản đó.</li>
<li>File Excel tải về có sheet Tổng hợp và mỗi trạng thái một sheet, tô màu sẵn – dùng làm hồ sơ đối chiếu cuối kỳ.</li>
</ul>''',
  faq=[('File sao kê có bị gửi lên mạng không?','Không. Công cụ chạy ngay trên trình duyệt, file được đọc và xử lý trên máy của anh/chị, không tải lên máy chủ.'),
       ('Sao kê có giờ, sổ chỉ có ngày thì có khớp được không?','Được. Tuỳ chọn "Khớp ngày/tháng/năm, bỏ qua giờ và định dạng ngày" bật sẵn; công cụ hiểu cả ô ngày Excel lẫn ngày dạng chữ như 03/08/2026, 2026-08-03.'),
       ('Sổ của tôi dùng Phát sinh Nợ / Có thay vì Thu / Chi?','Chọn cặp tương ứng: Số tiền gửi vào = Phát sinh Nợ, Số tiền rút ra = Phát sinh Có, đặt ở nhóm "Thỏa mãn một trong các điều kiện".'),
       ('Một ngày có nhiều khoản cùng số tiền thì sao?','Chọn "Ghép 1–1" ở mục Khi khóa bị trùng (công cụ tự chọn khi dùng nhóm một trong các điều kiện): mỗi dòng chỉ ghép một lần, theo thứ tự.'),
       ('Công cụ có mất phí không?','Không, công cụ dùng miễn phí.')],
  rel=['ghep-doi-chieu-2-file-excel-khong-can-vlookup','tai-hoa-don-dien-tu-hang-loat']),

 dict(slug='ghep-doi-chieu-2-file-excel-khong-can-vlookup', t=GD, ngay='22/10/2026', ngay_iso='2026-10-22',
  title='Ghép và đối chiếu 2 file Excel không cần VLOOKUP: tìm dòng thiếu, dòng lệch, số tiền chênh',
  short='Ghép & đối chiếu 2 file Excel',
  desc='Cách ghép 2 file Excel theo cột chung và đối chiếu từng dòng không cần VLOOKUP: tìm dòng có ở file này mà file kia không có, so số tiền, tách tổng chênh lệch. Miễn phí, file 200.000 dòng vẫn chạy.',
  tldr=['VLOOKUP chỉ lấy dòng đầu tiên, dễ sai khi mã có khoảng trắng, chữ hoa/thường, và rất chậm với file lớn.',
        'Công cụ Ghép & đối chiếu nối 2 file theo một hoặc nhiều cặp cột (tên cột 2 file được phép khác nhau), có 7 kiểu ghép.',
        'Báo cáo tra soát cho biết từng dòng khớp, lệch giá trị hay chỉ có ở một file, kèm bảng đối chiếu tổng tiền.'],
  body='''
<h2>Khi nào cần ghép và đối chiếu 2 file?</h2>
<div class="tw"><table><tr><th>Việc</th><th>File A</th><th>File B</th></tr>
<tr><td>Kiểm tra đơn đã ghi sổ chưa</td><td>Báo cáo đơn hàng</td><td>Sổ chi tiết bán hàng</td></tr>
<tr><td>Đối chiếu hóa đơn</td><td>Bảng kê hóa đơn</td><td>Sổ chi tiết thuế GTGT, bảng kê trên phần mềm</td></tr>
<tr><td>Đối chiếu công nợ</td><td>Sổ công nợ 131/331</td><td>Bảng đối chiếu của đối tác</td></tr>
<tr><td>Nhân sự – C&amp;B</td><td>Danh sách nhân sự</td><td>Bảng chấm công, bảng lương, danh sách BHXH</td></tr>
<tr><td>Sự kiện</td><td>Danh sách đăng ký</td><td>Danh sách check-in, đã chuyển khoản</td></tr>
<tr><td>Kiểm tra file bị sửa</td><td>Bản cũ</td><td>Bản mới</td></tr></table></div>
<h2>VLOOKUP khó ở đâu?</h2>
<ul>
<li>Chỉ trả về dòng đầu tiên khi mã bị trùng; không cho biết dòng nào của file kia bị thừa.</li>
<li>Báo #N/A vì khoảng trắng thừa, chữ hoa/thường, "KH-001" với "KH001", số dạng chữ.</li>
<li>Muốn so nhiều cột (tiền hàng, thuế, tổng tiền) phải viết nhiều công thức, file trăm nghìn dòng chạy rất chậm.</li>
</ul>
<h2>Cách làm</h2>
<ol class="steps">
<li><b>Thả 2 file</b> (.xlsx, .xls, .csv) vào công cụ. Công cụ tự tìm dòng tiêu đề, bỏ dòng Cộng và chữ ký cuối bảng. Một mã có nhiều dòng (hóa đơn nhiều dòng hàng) thì dùng <b>Gộp dòng theo khóa</b> để cộng các cột tiền trước.</li>
<li><b>Chọn cặp cột để nối dòng</b>: bấm <b>Gợi ý cặp đối chiếu</b> – công cụ tìm các cặp có tên tiêu đề trùng hoặc dữ liệu khớp từ 80%. Bấm <b>Kiểm tra dữ liệu</b> để xem tỉ lệ khớp, ô trống, giá trị trùng.</li>
<li><b>Chọn kiểu ghép</b> (bảng dưới). Với Báo cáo tra soát, công cụ tự gợi ý các cặp cột cần so sánh như Tiền hàng ⇄ Doanh thu.</li>
<li><b>Xem kết quả và tải Excel</b>: lọc theo trạng thái, tìm kiếm, mở lại phần chọn cột đưa vào file ngay ở màn hình kết quả.</li>
</ol>
<h2>7 kiểu ghép</h2>
<div class="tw"><table><tr><th>Kiểu ghép</th><th>Dùng khi</th></tr>
<tr><td>Giữ đủ File A, lấy thêm thông tin từ File B</td><td>Gắn tên khách, đơn giá… từ danh mục vào đơn hàng (thay VLOOKUP)</td></tr>
<tr><td>Giữ đủ File B, lấy thêm thông tin từ File A</td><td>Như trên, theo chiều ngược lại</td></tr>
<tr><td>Chỉ lấy dòng có ở cả 2 file</td><td>Lọc phần trùng nhau</td></tr>
<tr><td>Gộp tất cả, không bỏ sót dòng nào</td><td>Gộp 2 danh sách thành 1</td></tr>
<tr><td>Dòng có ở A nhưng B không có</td><td>Đơn chưa ghi sổ, nhân sự chưa chấm công</td></tr>
<tr><td>Dòng có ở B nhưng A không có</td><td>Khoản ghi sổ không có chứng từ gốc</td></tr>
<tr><td>Báo cáo tra soát toàn diện</td><td>So từng cột, biết dòng nào khớp, lệch, thiếu và lệch bao nhiêu</td></tr></table></div>
<figure class="fig"><img src="/huong-dan/anh/ghep-file-doi-chieu-tong-tien.webp" width="1200" height="222" loading="lazy" alt="Bảng đối chiếu tổng tiền A trừ B, tách chênh lệch do dòng lệch, dòng chỉ có ở A, dòng chỉ có ở B"><figcaption>Đối chiếu tổng tiền: chênh lệch A − B được tách theo nguyên nhân (dữ liệu mẫu có sẵn trong công cụ).</figcaption></figure>
<figure class="fig"><img src="/huong-dan/anh/ghep-file-lech-gia-tri.webp" width="1200" height="593" loading="lazy" alt="Tab Lệch giá trị trong báo cáo tra soát: chi tiết lệch và cột số chênh lệch từng dòng"><figcaption>Tab Lệch giá trị: ghi rõ cột nào lệch, lệch bao nhiêu; ô lệch được tô vàng trên bảng và trong file Excel.</figcaption></figure>
<h2>Làm sạch khóa trước khi so khớp</h2>
<ul>
<li>Bật sẵn: bỏ khoảng trắng thừa, không phân biệt hoa/thường, đồng nhất Unicode tiếng Việt, khớp ngày bỏ qua giờ.</li>
<li>Tuỳ chọn nâng cao: chỉ giữ chữ và số ("KH-001" = "KH001", mã số thuế có gạch), bỏ dấu tiếng Việt (so họ tên), chuẩn hoá số điện thoại (0912…, +84…), cho phép số tiền lệch ± đồng hoặc ± %.</li>
<li>Có 2 nhóm điều kiện: <b>Thỏa mãn đồng thời</b> (mọi cặp phải bằng nhau) và <b>Thỏa mãn một trong</b> (chỉ cần 1 cặp bằng nhau) – dùng một nhóm hoặc kết hợp cả hai.</li>
</ul>
<div class="note">Muốn thử trước? Ở trang đầu công cụ bấm <b>Thử với dữ liệu mẫu</b>: có sẵn bộ Đơn hàng ↔ Sổ chi tiết bán hàng và Đơn hàng ↔ Danh mục khách hàng (số liệu minh họa).</div>''',
  faq=[('Công cụ khác gì so với dùng VLOOKUP?','Công cụ ghép theo một hoặc nhiều cặp cột cùng lúc, xử lý được khóa trùng (lấy dòng đầu, ghép 1–1 hoặc lấy đủ), báo cả dòng thiếu ở hai phía và so nhiều cột số tiền trong một lần chạy, không cần viết công thức.'),
       ('File lớn có chạy được không?','Được. Khi thử, file 200.000 dòng được ghép trong vài giây ngay trên trình duyệt; tốc độ phụ thuộc cấu hình máy.'),
       ('Tên cột ở 2 file khác nhau có sao không?','Không sao. Anh/chị chọn cặp cột tương ứng (VD Mã đơn hàng = Số đơn hàng), hoặc bấm Gợi ý cặp đối chiếu.'),
       ('Dữ liệu có bị gửi lên mạng không?','Không. File được xử lý ngay trên máy của anh/chị.'),
       ('Lần sau có phải chọn lại từ đầu không?','Không cần: bấm Lưu thiết lập để lưu ra file, lần sau Nạp thiết lập đã lưu là dùng lại.')],
  rel=['doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan','chuyen-xml-hoa-don-sang-excel']),
"""
a = "]\nBY = {p['slug']: p for p in PAGES}"
assert s.count(a) == 1
s = s.replace(a, NEW.rstrip('\n') + "\n" + a)
io.open(P, 'w', encoding='utf-8').write(s)
print('ok')
