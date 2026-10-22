"""v1.22 Sinh trang Hướng dẫn tĩnh (SEO) → site/public/huong-dan/<slug>/index.html
Sửa nội dung trong file này rồi chạy: python tao-trang.py   (tại thư mục site/huong-dan-nguon)
Thêm trang mới: thêm 1 mục vào PAGES, rồi thêm slug vào GUIDES trong src/seo.js (sitemap)."""
import os, json, html, shutil
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'huong-dan')
SITE = 'https://quantritute.com'
NGAY, NGAY_ISO = '21/10/2026', '2026-10-21'
e = html.escape
HD = {'name': 'Bộ công cụ hóa đơn thuế', 'tool': '/tools/xu-ly-hoa-don/', 'info': '/cong-cu/hoa-don-thue'}
CN = {'name': 'Cẩm nang Thuế – Kế toán – Lao động 2026', 'tool': '/tools/cam-nang-thue-2026/', 'info': '/cong-cu/tra-cuu-van-ban', 'where': 'trên trình duyệt máy tính hoặc điện thoại'}
VB = {'name': 'Tạo văn bản hàng loạt', 'tool': '/tools/tao-van-ban-hang-loat/', 'info': '/cong-cu/van-ban-hang-loat'}

PAGES = [
 dict(slug='tai-hoa-don-dien-tu-hang-loat', t=HD,
  title='Cách tải hóa đơn điện tử hàng loạt từ cổng thuế (XML + bảng kê Excel)',
  short='Tải hóa đơn điện tử hàng loạt',
  desc='Hướng dẫn tải hàng loạt hóa đơn điện tử mua vào, bán ra, máy tính tiền từ hoadondientu.gdt.gov.vn thành 1 file ZIP gồm XML gốc và bảng kê Excel. Miễn phí, không cần cài đặt.',
  tldr=['Cổng hoadondientu.gdt.gov.vn chỉ cho tải từng hóa đơn một, quý nhiều hóa đơn là mất cả buổi.',
        'Công cụ miễn phí của Quản trị tử tế tải hàng loạt theo khoảng ngày, ra 1 file ZIP gồm XML từng hóa đơn và bảng kê Excel.',
        'Chạy ngay trên trình duyệt của anh/chị, dùng phiên đăng nhập sẵn có, không hỏi và không lưu mật khẩu.'],
  body='''
<h2>Vì sao tải từng hóa đơn lại mất thời gian?</h2>
<p>Trên trang tra cứu của cổng hóa đơn điện tử (hoadondientu.gdt.gov.vn), mỗi hóa đơn phải bấm xem rồi tải riêng. Với doanh nghiệp có vài chục đến vài trăm hóa đơn mỗi quý, việc này lặp lại hàng trăm lần, chưa kể phải đổi tên file, gom vào thư mục và gõ lại bảng kê để đối chiếu.</p>
<h2>Cách làm nhanh: tải hàng loạt bằng 1 nút</h2>
<ol class="steps">
<li><b>Mở công cụ trên máy tính</b> (Chrome hoặc Edge), vào thẻ <b>Tải hàng loạt</b>. Kéo nút của công cụ lên thanh dấu trang (bookmark) của trình duyệt – làm 1 lần, lần sau dùng luôn.</li>
<li><b>Đăng nhập cổng hóa đơn điện tử</b> như bình thường bằng tài khoản doanh nghiệp, mở trang tra cứu hóa đơn.</li>
<li><b>Bấm nút trên thanh dấu trang</b>, chọn loại hóa đơn (bán ra, mua vào, máy tính tiền) và khoảng ngày theo dạng dd/mm/yyyy.</li>
<li><b>Chờ công cụ quét và tải</b>. Công cụ tự quét lại tối đa 3 lần để không sót hóa đơn (cổng thuế đôi khi trả thiếu kết quả ở lần tra đầu).</li>
<li><b>Nhận file ZIP</b> gồm thư mục XML (đặt tên theo ngày, ký hiệu, số hóa đơn, tên đối tác) và file <code>Bang-ke-hoa-don.xlsx</code>.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/bang-dieu-khien-tai-hoa-don.webp" width="1140" height="860" loading="lazy" alt="Bảng điều khiển Tải hóa đơn hàng loạt hiện trên trang cổng thuế: chọn bán ra hoặc mua vào, khoảng ngày, kết quả tìm thấy và danh sách hóa đơn"><figcaption>Bảng điều khiển hiện ngay trên trang cổng thuế (dữ liệu minh họa).</figcaption></figure>
<div class="note">Mỗi lần tra cứu trên cổng giới hạn trong 1 tháng; công cụ tự chia khoảng ngày dài thành từng tháng, nghỉ ngắn giữa các lần tải để không bị cổng chặn. Phiên đăng nhập hết hạn giữa chừng thì công cụ tạm dừng, anh/chị đăng nhập lại rồi bấm tải tiếp.</div>
<h2>Trong file ZIP có gì?</h2>
<div class="tw"><table><tr><th>Thành phần</th><th>Dùng để làm gì</th></tr>
<tr><td>Thư mục <code>XML/</code></td><td>Bản gốc từng hóa đơn, lưu trữ và dùng cho các bước sau (chuyển Excel, lập tờ khai, tạo file nhập phần mềm kế toán).</td></tr>
<tr><td><code>Bang-ke-hoa-don.xlsx</code></td><td>Bảng kê để đối chiếu nhanh số lượng, giá trị, tiền thuế.</td></tr>
<tr><td>Danh sách hóa đơn chưa tải được (nếu có)</td><td>Ghi rõ hóa đơn nào cần lấy lại, để không bị sót khi kê khai.</td></tr></table></div>
<h2>Lưu ý thường gặp</h2>
<ul>
<li>Một số hóa đơn không mã (thường của điện lực, ngân hàng, viễn thông) bị cổng báo <i>"Không tồn tại hồ sơ gốc của hóa đơn"</i>. Công cụ vẫn đưa các hóa đơn này vào bảng kê bằng số tổng trên danh sách tra cứu và đánh dấu để anh/chị xin file XML từ người bán.</li>
<li>Hóa đơn đã bị thay thế hoặc bị hủy vẫn được liệt kê nhưng không cộng vào tổng.</li>
<li>Công cụ đã chạy thử trên Chrome và Edge; Firefox, Safari chưa được kiểm tra.</li>
</ul>''',
  faq=[('Công cụ có lấy mật khẩu tài khoản thuế của tôi không?','Không. Công cụ chạy ngay trên trang cổng thuế anh/chị đã đăng nhập, dùng phiên đăng nhập sẵn có của trình duyệt. Công cụ không hỏi, không lưu mật khẩu và không gửi hóa đơn lên máy chủ của Quản trị tử tế.'),
       ('Có mất phí không?','Không, công cụ dùng miễn phí.'),
       ('Dùng trên điện thoại được không?','Bước tải hàng loạt cần trình duyệt máy tính (Chrome hoặc Edge) vì phải dùng nút trên thanh dấu trang. Đang xem bằng điện thoại thì anh/chị có thể nhờ gửi link về email để mở trên máy tính.'),
       ('Tải xong XML thì làm gì tiếp?','Trong cùng bộ công cụ có các thẻ chuyển XML sang Excel, in bản gốc, lập tờ khai 01/GTGT và tạo file nhập lên MISA, dùng luôn file ZIP vừa tải.')],
  rel=['chuyen-xml-hoa-don-sang-excel','lap-to-khai-thue-gtgt-mau-01-gtgt']),

 dict(slug='chuyen-xml-hoa-don-sang-excel', t=HD,
  title='Chuyển file XML hóa đơn điện tử sang Excel hàng loạt (bảng kê mua vào, bán ra)',
  short='Chuyển XML hóa đơn sang Excel',
  desc='Đọc hàng loạt file XML hóa đơn điện tử (hoặc file ZIP tải từ cổng thuế) và xuất ra Excel: bảng kê mua vào, bán ra, tổng hợp theo thuế suất, chi tiết hàng hóa. Miễn phí, xử lý ngay trên máy.',
  tldr=['File XML là bản gốc của hóa đơn điện tử nhưng khó đọc, không mở thẳng thành bảng được.',
        'Thả nhiều file XML hoặc file ZIP vào công cụ → ra 1 file Excel gồm bảng kê mua vào, bán ra, tổng hợp thuế suất, chi tiết hàng hóa.',
        'Dữ liệu xử lý ngay trên máy tính của anh/chị, không tải lên máy chủ.'],
  body='''
<h2>Vì sao cần chuyển XML sang Excel?</h2>
<p>Hóa đơn điện tử có giá trị pháp lý ở file XML. Muốn đối chiếu số liệu, lập bảng kê hay kiểm tra thuế suất, kế toán thường phải mở từng hóa đơn rồi gõ lại vào Excel. Gõ tay vừa lâu vừa dễ sai số, nhất là với hóa đơn nhiều dòng hàng, có chiết khấu hoặc nhiều thuế suất.</p>
<h2>Cách làm</h2>
<ol class="steps">
<li>Mở công cụ trên máy tính, chọn thẻ <b>XML → Excel</b>.</li>
<li>Thả vào nhiều file XML cùng lúc, hoặc thả nguyên file ZIP tải từ cổng thuế. Có thể thêm hoặc gỡ từng file.</li>
<li>Xem mục <b>Cần xem lại</b>: công cụ báo các hóa đơn lệch tổng, hóa đơn ngoại tệ, hóa đơn bị thay thế/hủy.</li>
<li>Bấm xuất Excel.</li>
</ol>
<h2>File Excel nhận được</h2>
<div class="tw"><table><tr><th>Sheet</th><th>Nội dung</th></tr>
<tr><td>Bảng kê mua vào / Bảng kê bán ra</td><td>Mỗi hóa đơn một dòng, có STT và dòng tổng riêng cho từng chiều.</td></tr>
<tr><td>Tổng hợp thuế suất</td><td>Giá trị chưa thuế và tiền thuế theo từng mức thuế suất.</td></tr>
<tr><td>Chi tiết hàng hóa</td><td>Từng dòng hàng hóa, dịch vụ trên các hóa đơn.</td></tr></table></div>
<h2>Công cụ xử lý những trường hợp khó thế nào?</h2>
<ul>
<li><b>Hóa đơn trùng</b> (cùng mã số thuế người bán, mẫu, ký hiệu, số) chỉ tính 1 lần.</li>
<li><b>Hóa đơn bị thay thế, bị hủy</b> vẫn liệt kê nhưng ghi "Không" ở cột tính vào tổng.</li>
<li><b>Chiết khấu thương mại</b>: lấy tổng của hóa đơn làm chuẩn, phần chiết khấu trừ đúng vào từng thuế suất.</li>
<li><b>Ngày tháng</b> luôn ở dạng dd/mm/yyyy và là kiểu ngày thật trong Excel, lọc và sắp xếp được.</li>
</ul>
<div class="note">Dù công cụ đã đối chiếu tổng tiền, anh/chị vẫn nên rà mục "Cần xem lại" trước khi dùng số liệu để kê khai.</div>''',
  faq=[('Có giới hạn số file không?','Công cụ chạy trên trình duyệt nên phụ thuộc cấu hình máy; số lượng của một quý thông thường xử lý được trong một lần.'),
       ('Dữ liệu hóa đơn có bị gửi đi đâu không?','Không. File được đọc và xử lý ngay trên máy của anh/chị.'),
       ('Có nhập được vào MISA không?','Trong cùng bộ công cụ có thẻ "Tạo file nhập lên Misa" theo mẫu nhập khẩu của MISA AMIS Kế toán. Anh/chị nên nhập thử vài chứng từ trước khi nhập cả kỳ.')],
  rel=['tai-hoa-don-dien-tu-hang-loat','lap-to-khai-thue-gtgt-mau-01-gtgt']),

 dict(slug='lap-to-khai-thue-gtgt-mau-01-gtgt', t=HD,
  title='Lập tờ khai thuế GTGT mẫu 01/GTGT từ hóa đơn điện tử: tự tổng hợp chỉ tiêu, xuất file XML',
  short='Lập tờ khai 01/GTGT từ hóa đơn',
  desc='Tổng hợp tờ khai thuế GTGT mẫu 01/GTGT (phương pháp khấu trừ) từ file XML hóa đơn mua vào, bán ra; loại hóa đơn thay thế, hủy; xuất Excel và file XML theo cấu trúc HTKK để đối chiếu.',
  tldr=['Từ kỳ tháng 7 và quý III/2026, tờ khai 01/GTGT dùng mẫu mới theo Thông tư 89/2026/TT-BTC (thêm chỉ tiêu [32b], [34a], bỏ [11b]).',
        'Công cụ đọc XML hóa đơn, tự tổng hợp các chỉ tiêu, xuất Excel và file XML theo cấu trúc HTKK.',
        'Đây là bản nháp để đối chiếu: anh/chị kiểm tra lại trên HTKK trước khi nộp.'],
  body='''
<h2>Mẫu tờ khai và hạn nộp</h2>
<ul>
<li><b>Mẫu:</b> từ kỳ tháng 7/2026 và quý III/2026 áp dụng mẫu 01/GTGT ban hành kèm Thông tư 89/2026/TT-BTC. So với mẫu cũ (Thông tư 80/2021/TT-BTC), mẫu mới bổ sung chỉ tiêu [32b], [34a], bỏ chỉ tiêu [11b] và đổi tên một số chỉ tiêu.</li>
<li><b>Hạn nộp tờ khai quý III/2026:</b> chậm nhất ngày 02/11/2026 (ngày cuối tháng 10 rơi vào thứ Bảy nên lùi sang ngày làm việc tiếp theo), theo hướng dẫn tại Nghị định 252/2026/NĐ-CP. Với các kỳ khác, anh/chị đối chiếu thông báo của cơ quan thuế quản lý.</li>
</ul>
<h2>Cách lập tờ khai bằng công cụ</h2>
<ol class="steps">
<li>Tải hóa đơn mua vào và bán ra của kỳ (xem hướng dẫn <a href="/huong-dan/tai-hoa-don-dien-tu-hang-loat/">tải hóa đơn hàng loạt</a>).</li>
<li>Mở thẻ <b>Tờ khai thuế</b>, thả các file ZIP/XML vào.</li>
<li>Chọn kỳ khai (tháng hoặc quý) và mẫu tờ khai: mẫu mới theo Thông tư 89/2026, hoặc mẫu cũ theo Thông tư 80/2021 khi phần mềm kê khai của anh/chị chưa cập nhật mẫu mới.</li>
<li>Nhập thông tin người nộp thuế một lần (công cụ nhớ theo mã số thuế), hoặc lấy nhanh từ file XML tờ khai kỳ trước; số thuế còn được khấu trừ kỳ trước tự điền.</li>
<li>Rà bảng <b>Cần xem lại trước khi khai</b>: hóa đơn không có XML gốc, thuế suất được gợi ý (bấm để sửa tay nếu cần).</li>
<li>Xuất Excel để lưu hồ sơ và tải file XML tờ khai để mở bằng HTKK.</li>
</ol>
<h2>Công cụ tính số liệu theo quy tắc nào?</h2>
<ul>
<li>Hóa đơn đã bị thay thế, bị hủy không cộng vào tờ khai; hóa đơn trùng chỉ tính 1 lần.</li>
<li>Giá trị lấy theo tổng của từng hóa đơn; chiết khấu thương mại trừ đúng vào thuế suất tương ứng.</li>
<li>Hóa đơn thuế suất 8% (diện giảm thuế GTGT) được tách để lập phụ lục giảm thuế kèm tờ khai.</li>
</ul>
<p class="warn">Lưu ý quan trọng: file XML tờ khai được dựng theo cấu trúc file mẫu HTKK; với mẫu Thông tư 89, công cụ chưa xuất XML khi có số liệu ở chỉ tiêu mới [32b] hoặc [34a]. Anh/chị cần mở bằng HTKK để kiểm tra, đối chiếu với sổ sách trước khi nộp; công cụ không thay thế trách nhiệm rà soát của kế toán.</p>''',
  faq=[('Công cụ dùng cho doanh nghiệp khai theo tháng được không?','Công cụ tổng hợp theo khoảng ngày anh/chị chọn nên dùng được cho kỳ tháng và kỳ quý. File XML kỳ tháng chưa được đối chiếu với file mẫu HTKK, anh/chị kiểm tra kỹ khi mở bằng HTKK.'),
       ('Hóa đơn không có XML gốc thì sao?','Công cụ vẫn đưa vào bằng số tổng trên danh sách tra cứu, gợi ý thuế suất và cho tải XML bổ sung khi anh/chị xin được từ người bán.'),
       ('Có tốn phí không?','Không, công cụ dùng miễn phí.')],
  rel=['tai-hoa-don-dien-tu-hang-loat','chuyen-xml-hoa-don-sang-excel']),

 dict(slug='tao-van-ban-hang-loat-tu-excel', t=VB,
  title='Tạo hàng loạt hợp đồng, phiếu lương, giấy chứng nhận từ file mẫu và danh sách Excel',
  short='Tạo văn bản hàng loạt từ Excel',
  desc='Từ 1 file mẫu (Word, Excel, PDF, ảnh) và 1 danh sách Excel, tạo hàng loạt hợp đồng, phiếu lương, giấy mời, giấy chứng nhận cho từng người. Không cần Mail Merge, miễn phí, xử lý trên máy.',
  tldr=['Gõ lại cùng một hợp đồng, giấy mời, giấy chứng nhận cho hàng chục người vừa lâu vừa dễ sai tên.',
        'Công cụ ghép file mẫu với danh sách Excel, mỗi dòng ra một văn bản (Word, Excel, PDF hoặc ảnh).',
        'Không cần biết Mail Merge; file mẫu chưa đánh dấu trường vẫn ghép tay được.'],
  body='''
<h2>Mail Merge khó ở đâu?</h2>
<p>Mail Merge trong Word làm được việc này nhưng cần thao tác nhiều bước, khó với mẫu PDF hay ảnh (giấy chứng nhận, thư mời thiết kế sẵn), và hay lỗi định dạng số, ngày tháng. Nhiều người chọn cách sửa tay từng bản, dễ sót và sai tên.</p>
<h2>Cách làm</h2>
<ol class="steps">
<li><b>Tải file mẫu</b>: Word, Excel, PDF hoặc ảnh. Mẫu đã có ký hiệu trường thì công cụ nhận luôn; chưa có thì công cụ hướng dẫn tạo hoặc cho ghép tay.</li>
<li><b>Tải file danh sách</b> Excel/CSV, mỗi người một dòng. File có nhiều trang tính thì chọn trang lấy dữ liệu.</li>
<li><b>Ghép trường</b>: kéo cột trong danh sách thả vào đúng chỗ trên mẫu. Với PDF/ảnh, kéo khung quanh chữ cũ, công cụ tự bắt cỡ chữ, kiểu chữ, màu.</li>
<li><b>Xem thử</b> từng bản, sửa định dạng (thêm số 0 phía trước, giữ nguyên năm, mã số…).</li>
<li><b>Xuất file</b>: mỗi dòng một file lưu vào thư mục, hoặc gộp thành một file, hoặc nén ZIP.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/xem-thu-phieu-luong.webp" width="1118" height="858" loading="lazy" alt="Bước Xem thử của công cụ Tạo văn bản hàng loạt: phiếu lương của từng nhân viên và bảng giá trị được điền"><figcaption>Bước Xem thử: duyệt từng bản trước khi tạo (dữ liệu minh họa).</figcaption></figure>
<div class="note">Muốn thử trước? Ở trang đầu công cụ có nút <b>Thử ngay với ví dụ</b> nạp sẵn mẫu phiếu lương và danh sách 8 nhân viên (số liệu minh họa).</div>
<h2>Dùng cho việc gì?</h2>
<div class="tw"><table><tr><th>Bộ phận</th><th>Ví dụ</th></tr>
<tr><td>Hành chính – Nhân sự</td><td>Hợp đồng lao động, quyết định, giấy mời, thư mời nhận việc</td></tr>
<tr><td>Kế toán – C&amp;B</td><td>Phiếu lương, thông báo công nợ, biên bản đối chiếu</td></tr>
<tr><td>Đào tạo – Sự kiện</td><td>Giấy chứng nhận, chứng chỉ, thẻ đeo, thư mời</td></tr></table></div>''',
  faq=[('Có cần cài phần mềm không?','Không. Công cụ chạy trên trình duyệt Chrome hoặc Edge; có thể tải bản offline 1 file để dùng không cần mạng.'),
       ('Danh sách của tôi có bị gửi lên mạng không?','Không. File mẫu và danh sách được xử lý ngay trên máy của anh/chị.'),
       ('Xuất ra PDF được không?','Được. Mẫu Word cũng xuất được PDF (tách từng file hoặc gộp); với mẫu Word, bản PDF dựng dạng ảnh trang nên chữ không chọn được.')],
  rel=['chuyen-xml-hoa-don-sang-excel']),

 dict(slug='tra-cuu-van-ban-phap-luat-thue-ke-toan', t=CN,
  title='Tra cứu văn bản pháp luật thuế, kế toán, lao động 2026: tìm theo từ khóa, đối chiếu Luật – Nghị định – Thông tư',
  short='Tra cứu văn bản thuế, kế toán, lao động',
  desc='Cách tra nhanh quy định về thuế GTGT, TNDN, TNCN, hóa đơn điện tử, quản lý thuế, hợp đồng lao động, BHXH: tìm theo từ khóa trong nội dung từng Điều, đối chiếu Luật – Nghị định – Thông tư. Miễn phí.',
  tldr=['Một câu hỏi thuế thường phải lần qua Luật, Nghị định rồi Thông tư hướng dẫn; luật lại sửa liên tục.',
        'Cẩm nang gom văn bản theo 8 chủ đề, tìm được theo từ khóa trong nội dung từng Điều và đối chiếu Luật – Nghị định – Thông tư.',
        'Đây là bản tổng hợp để tra nhanh: luôn đối chiếu văn bản gốc trước khi áp dụng.'],
  body='''
<h2>Vì sao tra cứu quy định thuế hay mất thời gian?</h2>
<p>Một câu hỏi như "mặt hàng này có chịu thuế GTGT không?" hay "khoản chi này có được tính vào chi phí được trừ không?" thường không nằm trọn trong một văn bản. Luật nêu nguyên tắc, Nghị định quy định chi tiết, Thông tư hướng dẫn hồ sơ, thủ tục. Văn bản lại được sửa đổi, thay thế, nên tra xong vẫn phải kiểm tra xem điều khoản còn hiệu lực không.</p>
<h2>Cách tra nhanh bằng Cẩm nang</h2>
<ol class="steps">
<li><b>Mở Cẩm nang</b> trên trình duyệt (máy tính hoặc điện thoại đều xem được).</li>
<li><b>Gõ từ khóa</b> vào ô tìm kiếm, ví dụ <code>chi phí được trừ</code>. Cẩm nang tìm trong nội dung từng Điều của Luật, Nghị định, Thông tư; đoạn khớp được tô sáng.</li>
<li><b>Bấm vào kết quả</b> để mở nội dung Điều đó.</li>
<li><b>Đối chiếu</b>: dùng mục "Đối chiếu Luật – Nghị định – Thông tư" để xem quy định ở luật được hướng dẫn tiếp ở văn bản nào.</li>
<li><b>Đối chiếu văn bản gốc</b> trước khi áp dụng cho trường hợp của doanh nghiệp.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/tim-kiem-cam-nang.webp" width="1515" height="1130" loading="lazy" alt="Kết quả tìm kiếm từ khóa chi phí được trừ trong Cẩm nang: danh sách Điều luật khớp nội dung, đoạn khớp được tô sáng"><figcaption>Tìm "chi phí được trừ": các Điều khớp trong Luật, Nghị định, Thông tư, đoạn khớp được tô sáng.</figcaption></figure>
<h2>8 chủ đề trong Cẩm nang</h2>
<div class="tw"><table><tr><th>Chủ đề</th><th>Trong mỗi chủ đề có</th></tr>
<tr><td>Thuế GTGT · Hóa đơn &amp; chứng từ điện tử · Thuế TNDN · Thuế TNCN</td><td rowspan="2">Sơ đồ văn bản pháp lý, tra cứu văn bản, đối chiếu Luật – Nghị định – Thông tư, ghi nhớ nhanh, tự kiểm tra, hỏi đáp</td></tr>
<tr><td>Giao dịch liên kết · Quản lý thuế chung · Hợp đồng lao động · BHXH</td></tr></table></div>
<h2>Theo dõi văn bản mới</h2>
<p>Mục <b>Tự động cập nhật pháp lý mới nhất</b> liệt kê văn bản mới về thuế, kế toán, lao động, bảo hiểm xã hội theo tháng và theo chủ đề. Anh/chị có thể để lại email để nhận thư khi có văn bản mới (cần bấm xác nhận trong thư đầu tiên, hủy bất cứ lúc nào).</p>
<p class="warn">Lưu ý: Cẩm nang là bản tổng hợp để tham khảo, không thay thế văn bản gốc. Quy định có thể đã được sửa đổi sau thời điểm tổng hợp; anh/chị vui lòng đối chiếu văn bản gốc và thông báo của cơ quan thuế trước khi áp dụng.</p>''',
  faq=[('Cẩm nang có mất phí không?','Không, Cẩm nang dùng miễn phí, không cần đăng ký.'),
       ('Có dùng trên điện thoại được không?','Được. Cẩm nang là trang tra cứu nên xem được trên điện thoại; màn hình lớn sẽ dễ đọc đối chiếu hơn.'),
       ('Nội dung có cập nhật văn bản mới không?','Có mục theo dõi văn bản mới theo tháng và chủ đề, kèm đăng ký nhận email. Nội dung tổng hợp trong từng chủ đề vẫn cần đối chiếu văn bản gốc trước khi áp dụng.'),
       ('Tôi thấy chỗ sai thì báo ở đâu?','Trong Cẩm nang có nút "Góp ý · Liên hệ". Mọi góp ý đều được xem và sửa.')],
  rel=['lap-to-khai-thue-gtgt-mau-01-gtgt','chuyen-xml-hoa-don-sang-excel']),
]
BY = {p['slug']: p for p in PAGES}

def head(title, desc, path, ld):
    return f'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Quản trị tử tế</title><meta name="description" content="{e(desc)}">
<link rel="canonical" href="{SITE}{path}"><meta property="og:type" content="article"><meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{SITE}/assets/desk-on.jpg">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<link rel="stylesheet" href="/huong-dan/huong-dan.css?v=20261021b">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">Quản trị <span>tử tế</span></a>
<nav><a href="/cong-cu">Bộ công cụ</a><a href="/huong-dan/">Hướng dẫn</a><a href="/ve-dom">Về Đốm</a></nav></div></header>
'''
FOOT = '''<footer><div class="in">Quản trị tử tế · Công cụ miễn phí &amp; AI giúp dân văn phòng bớt việc lặp lại · <a href="/cong-cu">Xem Bộ công cụ</a></div></footer>
<script src="/qtt-analytics.js?v=20261021" defer></script>
</body></html>'''

def page(p):
    path = f'/huong-dan/{p["slug"]}/'; t = p['t']
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": p['title'], "description": p['desc'], "datePublished": NGAY_ISO, "dateModified": NGAY_ISO,
           "inLanguage": "vi", "mainEntityOfPage": SITE + path, "author": {"@type": "Organization", "name": "Quản trị tử tế", "url": SITE},
           "publisher": {"@type": "Organization", "name": "Quản trị tử tế", "url": SITE}},
          {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p['faq']]},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Trang chủ", "item": SITE + '/'}, {"@type": "ListItem", "position": 2, "name": "Hướng dẫn", "item": SITE + '/huong-dan/'},
            {"@type": "ListItem", "position": 3, "name": p['short'], "item": SITE + path}]}]
    cta = f'''<div class="cta"><img src="/assets/dom/dom-01-chao-sang.webp" alt="Đốm – trợ lý của Quản trị tử tế" width="84" height="84" loading="lazy">
<div><p><b>{e(t['name'])}</b> dùng miễn phí, chạy ngay {t.get('where', 'trên trình duyệt máy tính, dữ liệu không gửi lên máy chủ')}.</p>
<a class="btn" href="{t['tool']}?utm_source=huong-dan&amp;utm_medium=seo&amp;utm_campaign={p['slug']}">Dùng công cụ miễn phí</a><a class="btn ghost" href="{t['info']}">Xem giới thiệu &amp; video</a></div></div>'''
    faq = ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in p['faq'])
    rel = ''.join(f'<li><a href="/huong-dan/{r}/">{e(BY[r]["title"])}</a></li>' for r in p['rel'])
    return head(p['title'], p['desc'], path, ld) + f'''<main>
<p class="crumb"><a href="/">Trang chủ</a> › <a href="/huong-dan/">Hướng dẫn</a></p>
<h1>{e(p['title'])}</h1><p class="meta">Cập nhật {NGAY} · Đốm – Quản trị tử tế</p>
<div class="tldr"><p><b>Tóm tắt nhanh</b></p><ul>{''.join(f'<li>{e(x)}</li>' for x in p['tldr'])}</ul></div>
{cta}
{p['body']}
{cta}
<h2>Câu hỏi thường gặp</h2>{faq}
<h2>Hướng dẫn liên quan</h2><ul class="rel">{rel}</ul>
</main>
''' + FOOT

def index():
    path = '/huong-dan/'
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Hướng dẫn – Quản trị tử tế", "url": SITE + path, "inLanguage": "vi"}
    cards = ''.join(f'<a class="card" href="/huong-dan/{p["slug"]}/"><b>{e(p["title"])}</b><span>{e(p["desc"])}</span></a>' for p in PAGES)
    return head('Hướng dẫn xử lý việc văn phòng nhanh hơn', 'Hướng dẫn từng bước: tải hóa đơn điện tử hàng loạt, chuyển XML sang Excel, lập tờ khai 01/GTGT, tạo văn bản hàng loạt – kèm công cụ miễn phí.', path, ld) + f'''<main>
<h1>Hướng dẫn</h1><p>Mỗi bài giải quyết một việc lặp lại cụ thể của kế toán, nhân sự, hành chính – kèm công cụ miễn phí để làm ngay.</p>
<div class="cards">{cards}</div></main>
''' + FOOT

os.makedirs(OUT, exist_ok=True)
shutil.copy(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'huong-dan.css'), os.path.join(OUT, 'huong-dan.css'))
for p in PAGES:
    d = os.path.join(OUT, p['slug']); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page(p))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index())
print('GUIDES =', json.dumps(['/huong-dan/'] + [f'/huong-dan/{p["slug"]}/' for p in PAGES]))
