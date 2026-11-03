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
GD = {'name': 'Ghép & đối chiếu 2 file Excel', 'tool': '/tools/ghep-doi-chieu/', 'info': '/cong-cu/doi-chieu-sao-ke'}
TK = {'name': 'Bảng kê & Tờ khai thuế GTGT từ Excel', 'tool': '/tools/to-khai-gtgt/', 'info': '/cong-cu/to-khai-gtgt'}
IP = {'name': 'In hóa đơn PDF hàng loạt theo danh sách', 'tool': '/tools/in-hoa-don-pdf/', 'info': '/cong-cu/in-hoa-don-pdf'}
TT = {'name': 'Tải tờ khai thuế đã nộp hàng loạt', 'tool': '/tools/tai-to-khai/', 'info': '/cong-cu/tai-to-khai'}

PAGES = [
 dict(slug='tai-hoa-don-dien-tu-hang-loat', seo_title='Tải hóa đơn điện tử hàng loạt từ cổng thuế', t=HD, ngay='26/10/2026', ngay_iso='2026-10-26',
  title='Cách tải hóa đơn điện tử hàng loạt từ cổng thuế (XML + bảng kê Excel)',
  short='Tải hóa đơn điện tử hàng loạt',
  desc='Hướng dẫn tải hàng loạt hóa đơn điện tử mua vào, bán ra, máy tính tiền từ hoadondientu.gdt.gov.vn thành 1 file ZIP gồm XML gốc và bảng kê Excel. Miễn phí, không cần cài đặt.',
  tldr=['Cổng hoadondientu.gdt.gov.vn chỉ cho tải từng hóa đơn một, quý nhiều hóa đơn là mất cả buổi.',
        'Công cụ miễn phí của Quản trị tử tế tải hàng loạt theo khoảng ngày, ra 1 file ZIP gồm XML từng hóa đơn và bảng kê Excel.',
        'Chạy ngay trên trình duyệt của anh/chị, dùng phiên đăng nhập sẵn có, không hỏi và không lưu mật khẩu.',
        'Từ 26/10/2026 cổng thuế yêu cầu nhập mã xác nhận khi tra hóa đơn máy tính tiền (tối đa 10 ngày/lần): công cụ hiện ảnh mã để anh/chị tự gõ, mỗi 10 ngày 1 mã.'],
  body='''
<div class="note"><b>Cập nhật 31/10/2026 – bản 1.8.1:</b> cột <b>HĐ liên quan</b> trong bảng kê ghi rõ hóa đơn thay thế / điều chỉnh cho hóa đơn số mấy, ngày nào và hóa đơn gốc bị thay thế / điều chỉnh bởi hóa đơn nào. <b>Cập nhật 26/10/2026 – bản 1.8.0.</b> Anh/chị đã cài nút từ trước: vào thẻ <b>Tải hàng loạt</b> của công cụ, xóa nút "Tải HĐ hàng loạt" cũ trên thanh dấu trang (chuột phải → Xóa) rồi kéo nút mới lên. Mở bảng điều khiển trên trang thuế, góc trên ghi <b>bản 1.8.0</b> là đã cập nhật.</div>
<h2>Vì sao tải từng hóa đơn lại mất thời gian?</h2>
<p>Trên trang tra cứu của cổng hóa đơn điện tử (hoadondientu.gdt.gov.vn), mỗi hóa đơn phải bấm xem rồi tải riêng. Với doanh nghiệp có vài chục đến vài trăm hóa đơn mỗi quý, việc này lặp lại hàng trăm lần, chưa kể phải đổi tên file, gom vào thư mục và gõ lại bảng kê để đối chiếu.</p>
<h2>Cách làm nhanh: tải hàng loạt bằng 1 nút</h2>
<ol class="steps">
<li><b>Mở công cụ trên máy tính</b> (Chrome hoặc Edge), vào thẻ <b>Tải hàng loạt</b>. Kéo nút của công cụ lên thanh dấu trang (bookmark) của trình duyệt – làm 1 lần, lần sau dùng luôn.</li>
<li><b>Đăng nhập cổng hóa đơn điện tử</b> như bình thường bằng tài khoản doanh nghiệp, mở trang tra cứu hóa đơn.</li>
<li><b>Bấm nút trên thanh dấu trang</b>, chọn bán ra hoặc mua vào, tick hóa đơn điện tử và/hoặc hóa đơn máy tính tiền, chọn khoảng ngày theo dạng dd/mm/yyyy.</li>
<li><b>Chờ công cụ quét</b>. Hóa đơn điện tử được quét nhiều lượt theo số tháng và gộp kết quả để không sót (cổng thuế đôi khi trả thiếu ở lần tra đầu). Có hóa đơn máy tính tiền thì gõ mã xác nhận cho từng đoạn 10 ngày (xem mục dưới).</li>
<li><b>Nhận file ZIP</b> gồm thư mục XML (đặt tên theo ngày, ký hiệu, số hóa đơn, tên đối tác) và file <code>Bang-ke-hoa-don.xlsx</code>.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/bang-dieu-khien-tai-hoa-don.webp" width="1140" height="860" loading="lazy" alt="Bảng điều khiển Tải hóa đơn hàng loạt hiện trên trang cổng thuế: chọn bán ra hoặc mua vào, khoảng ngày, kết quả tìm thấy và danh sách hóa đơn"><figcaption>Bảng điều khiển hiện ngay trên trang cổng thuế (dữ liệu minh họa).</figcaption></figure>
<div class="note">Mỗi lần tra hóa đơn điện tử trên cổng giới hạn trong 1 tháng; công cụ tự chia khoảng ngày dài thành từng tháng, nghỉ ngắn giữa các lần tải để không bị cổng chặn (cổng báo gọi nhanh thì tự giãn nhịp). Tải cả tháng, cả quý mà trang thuế hết phiên đăng nhập giữa chừng thì công cụ tạm dừng: anh/chị đăng nhập lại ngay trên trang (không tải lại trang, không đóng tab), công cụ tự chạy tiếp từ chỗ đang dở, không mất phần đã tải. Có hóa đơn máy tính tiền thì nhập mã mới cho đoạn đang tra.</div>
<h2>Hóa đơn máy tính tiền: nhập mã xác nhận</h2>
<p>Từ 26/10/2026, cổng hóa đơn điện tử yêu cầu nhập mã xác nhận (captcha) mỗi lần tra hóa đơn có mã khởi tạo từ máy tính tiền, và mỗi lần chỉ tra tối đa 10 ngày. Công cụ làm theo đúng quy định đó:</p>
<ol class="steps">
<li><b>Công cụ tự chia kỳ thành từng đoạn 10 ngày</b> – 1 tháng là 3 đoạn, 1 quý khoảng 9–10 đoạn.</li>
<li><b>Mỗi đoạn, bảng điều khiển hiện ảnh mã do chính cổng thuế cấp.</b> Anh/chị đọc và gõ vào ô, bấm <b>Tra đoạn này</b> (hoặc Enter). Mã khó đọc thì bấm <b>Đổi mã khác</b>.</li>
<li><b>Gõ sai mã</b>: công cụ báo và hiện mã mới, không tự gửi lại. Doanh nghiệp không có hóa đơn máy tính tiền thì bấm <b>Bỏ qua phần máy tính tiền</b> hoặc bỏ tick ô này trước khi tìm.</li>
<li><b>Sang trang kết quả sau và tải XML không cần mã</b>: công cụ tự lật hết trang và tải XML chung file ZIP với hóa đơn điện tử.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/ma-xac-nhan-hd-may-tinh-tien.webp" width="1140" height="1048" loading="lazy" alt="Bảng điều khiển hiện ảnh mã xác nhận của cổng thuế cho đoạn 01/09 đến 10/09, ô gõ mã, nút Tra đoạn này, Đổi mã khác và Bỏ qua phần máy tính tiền"><figcaption>Mỗi đoạn 10 ngày, anh/chị gõ mã xác nhận của cổng thuế (dữ liệu và mã minh họa).</figcaption></figure>
<div class="note">Công cụ <b>không tự đọc hay giải mã xác nhận</b>, không lưu và không dùng lại mã cho đoạn khác. Mã chỉ dùng cho đúng lần tra anh/chị vừa gõ, giống hệt thao tác trên trang thuế.</div>
<h2>Trong file ZIP có gì?</h2>
<div class="tw"><table><tr><th>Thành phần</th><th>Dùng để làm gì</th></tr>
<tr><td>Thư mục <code>XML/</code></td><td>Bản gốc từng hóa đơn, lưu trữ và dùng cho các bước sau (chuyển Excel, lập tờ khai, tạo file nhập phần mềm kế toán).</td></tr>
<tr><td><code>Bang-ke-hoa-don.xlsx</code></td><td>Bảng kê để đối chiếu nhanh số lượng, giá trị, tiền thuế. Cột <b>Trạng thái</b> và <b>HĐ liên quan</b> cho biết hóa đơn nào thay thế / điều chỉnh hóa đơn nào, khỏi mở từng hóa đơn.</td></tr>
<tr><td>Danh sách hóa đơn chưa tải được (nếu có)</td><td>Ghi rõ hóa đơn nào cần lấy lại, để không bị sót khi kê khai.</td></tr></table></div>
<h2>Lưu ý thường gặp</h2>
<ul>
<li>Một số hóa đơn không mã (thường của điện lực, ngân hàng, viễn thông) bị cổng báo <i>"Không tồn tại hồ sơ gốc của hóa đơn"</i>. Công cụ vẫn đưa các hóa đơn này vào bảng kê bằng số tổng trên danh sách tra cứu và đánh dấu để anh/chị xin file XML từ người bán.</li>
<li>Hóa đơn đã bị thay thế hoặc bị hủy vẫn được liệt kê nhưng không cộng vào tổng. Cột <b>HĐ liên quan</b> ghi: hóa đơn thay thế / điều chỉnh → "Thay thế HĐ C26TAA-123 ngày 05/09/2026"; hóa đơn gốc → "Bị thay thế bởi HĐ C26TAA-150 ngày 20/09/2026". Chiều thứ hai chỉ ghi được khi hóa đơn mới nằm trong cùng lần tải (tải đủ khoảng ngày có cả 2 hóa đơn); hóa đơn cổng thuế không lưu XML thì không xác định được.</li>
<li>Cổng thuế có lúc phản hồi rất chậm với một vài hóa đơn (thường là hóa đơn máy tính tiền). Công cụ tự ngắt sau 20 giây và gọi lại, dòng tiến độ ghi "cổng thuế phản hồi chậm, đã chờ … giây" – anh/chị cứ để công cụ chạy tiếp.</li>
<li>Công cụ đã chạy thử trên Chrome và Edge; Firefox, Safari chưa được kiểm tra.</li>
</ul>''',
  faq=[('Công cụ có lấy mật khẩu tài khoản thuế của tôi không?','Không. Công cụ chạy ngay trên trang cổng thuế anh/chị đã đăng nhập, dùng phiên đăng nhập sẵn có của trình duyệt. Công cụ không hỏi, không lưu mật khẩu và không gửi hóa đơn lên máy chủ của Quản trị tử tế.'),
       ('Có mất phí không?','Không, công cụ dùng miễn phí.'),
       ('Vì sao phải gõ mã khi tải hóa đơn máy tính tiền?','Từ 26/10/2026 cổng hoadondientu.gdt.gov.vn yêu cầu nhập mã xác nhận cho mỗi lần tra hóa đơn máy tính tiền, tối đa 10 ngày/lần. Công cụ tuân thủ yêu cầu này: anh/chị tự gõ mã, công cụ không tự đọc mã. Hóa đơn điện tử thông thường vẫn tải tự động.'),
       ('Cập nhật công cụ lên bản mới thế nào?','Nút trên thanh dấu trang chứa sẵn công cụ nên không tự cập nhật. Khi có bản mới, vào thẻ Tải hàng loạt của công cụ, xóa nút cũ trên thanh dấu trang rồi kéo nút mới lên. Số bản hiện ở góc trên bảng điều khiển.'),
       ('Dùng trên điện thoại được không?','Bước tải hàng loạt cần trình duyệt máy tính (Chrome hoặc Edge) vì phải dùng nút trên thanh dấu trang. Đang xem bằng điện thoại thì anh/chị có thể nhờ gửi link về email để mở trên máy tính.'),
       ('Làm sao biết hóa đơn này thay thế, điều chỉnh cho hóa đơn nào?','Mở file Bang-ke-hoa-don.xlsx trong gói tải, xem cột HĐ liên quan: hóa đơn thay thế / điều chỉnh ghi số và ngày của hóa đơn gốc; hóa đơn gốc ghi bị thay thế / bị điều chỉnh bởi hóa đơn nào (nếu hóa đơn mới nằm trong cùng lần tải). Ở thẻ Chuyển XML sang Excel có ô lọc nhanh các hóa đơn này.'),
       ('Tải xong XML thì làm gì tiếp?','Trong cùng bộ công cụ có các thẻ chuyển XML sang Excel, in bản gốc, lập tờ khai 01/GTGT và tạo file nhập lên MISA, dùng luôn file ZIP vừa tải.')],
  rel=['chuyen-xml-hoa-don-sang-excel','lap-to-khai-thue-gtgt-mau-01-gtgt']),

 dict(slug='chuyen-xml-hoa-don-sang-excel', seo_title='Chuyển XML hóa đơn sang Excel hàng loạt', t=HD,
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
<li><b>Hóa đơn thay thế, điều chỉnh</b>: cột <b>HĐ liên quan</b> ghi thay thế / điều chỉnh cho hóa đơn số mấy, ngày nào; hóa đơn gốc có trong bộ thì ghi ngược "bị thay thế / bị điều chỉnh bởi HĐ …". Tick ô <i>Chỉ xem hóa đơn thay thế / điều chỉnh</i> phía trên bảng để lọc nhanh.</li>
<li><b>Chiết khấu thương mại</b>: lấy tổng của hóa đơn làm chuẩn, phần chiết khấu trừ đúng vào từng thuế suất.</li>
<li><b>Ngày tháng</b> luôn ở dạng dd/mm/yyyy và là kiểu ngày thật trong Excel, lọc và sắp xếp được.</li>
</ul>
<div class="note">Dù công cụ đã đối chiếu tổng tiền, anh/chị vẫn nên rà mục "Cần xem lại" trước khi dùng số liệu để kê khai.</div>''',
  faq=[('Có giới hạn số file không?','Công cụ chạy trên trình duyệt nên phụ thuộc cấu hình máy; số lượng của một quý thông thường xử lý được trong một lần.'),
       ('Dữ liệu hóa đơn có bị gửi đi đâu không?','Không. File được đọc và xử lý ngay trên máy của anh/chị.'),
       ('Có nhập được vào MISA không?','Trong cùng bộ công cụ có thẻ "Tạo file nhập lên Misa" theo mẫu nhập khẩu của MISA AMIS Kế toán. Anh/chị nên nhập thử vài chứng từ trước khi nhập cả kỳ.')],
  rel=['tai-hoa-don-dien-tu-hang-loat','lap-to-khai-thue-gtgt-mau-01-gtgt']),

 dict(slug='lap-to-khai-thue-gtgt-mau-01-gtgt', seo_title='Lập tờ khai thuế GTGT 01/GTGT từ hóa đơn', t=HD,
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

 dict(slug='tao-van-ban-hang-loat-tu-excel', seo_title='Tạo hợp đồng, phiếu lương hàng loạt từ Excel', t=VB,
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

 dict(slug='tra-cuu-van-ban-phap-luat-thue-ke-toan', seo_title='Tra cứu văn bản thuế, kế toán, lao động 2026', t=CN,
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

 dict(slug='doi-chieu-sao-ke-ngan-hang-voi-so-ke-toan', seo_title='Đối chiếu sao kê ngân hàng với sổ kế toán TK 112', t=GD, ngay='22/10/2026', ngay_iso='2026-10-22',
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
<figure class="fig"><img src="/huong-dan/anh/doi-chieu-hai-nhom-dieu-kien.webp" width="1020" height="650" loading="lazy" alt="Bước 2 của công cụ Ghép và đối chiếu: Ngày giao dịch bằng Ngày hạch toán, và Số tiền gửi vào bằng Thu hoặc Số tiền rút ra bằng Chi"><figcaption>Điều kiện khớp khi đối chiếu sao kê: cùng ngày VÀ (tiền vào = Thu HOẶC tiền ra = Chi).</figcaption></figure>
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

 dict(slug='ghep-doi-chieu-2-file-excel-khong-can-vlookup', seo_title='Ghép, đối chiếu 2 file Excel không cần VLOOKUP', t=GD, ngay='22/10/2026', ngay_iso='2026-10-22',
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
 dict(slug='lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don', seo_title='Lập bảng kê, soát tờ khai GTGT từ cổng thuế', t=TK, ngay='29/10/2026', ngay_iso='2026-10-29',
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
 dict(slug='in-hoa-don-pdf-hang-loat-theo-danh-sach', seo_title='In hàng loạt hóa đơn PDF theo danh sách Excel', t=IP, ngay='03/11/2026', ngay_iso='2026-11-03', pub_iso='2026-11-02',
  title='In hàng nghìn hóa đơn PDF theo đúng thứ tự danh sách Excel, không lẫn, không sót',
  short='In hóa đơn PDF theo danh sách',
  desc='Xếp hàng nghìn file hóa đơn PDF theo thứ tự bảng kê Excel, báo thiếu, thừa, trùng, ghép lô có số thứ tự để in một lệnh; đổi tên file hàng loạt để tra cứu file mềm. Miễn phí.',
  tldr=['Chọn cả loạt file PDF rồi bấm in, máy in không giữ thứ tự: xấp giấy phải xếp lại bằng tay, khó biết tờ nào bị thiếu.',
        'Công cụ khớp từng file PDF với từng dòng danh sách Excel theo ký hiệu, số hóa đơn, MST người bán; tên file lộn xộn thì đọc chữ trong file.',
        'Báo hóa đơn thiếu file, file không có trong danh sách, file trùng, bản scan; xuất Excel đối chiếu.',
        'Ghép thành từng lô PDF đúng thứ tự, có số thứ tự ở góc trang; file xử lý ngay trên máy, không gửi lên máy chủ.',
        'Mới (bản 1.2.0): đổi tên hàng loạt file PDF theo dạng STT_YYMM_Ký hiệu mẫu số_Ký hiệu hóa đơn_MST người bán_Số hóa đơn_Tên công ty để gõ tìm nhanh trên máy, lưu vào thư mục hoặc tải 1 file nén.'],
  body='''
<div class="note"><b>Cập nhật 03/11/2026 – bản 1.2.1</b> (từ góp ý của người dùng): danh sách có tờ khai hải quan nhập khẩu (không có số hóa đơn, MST) vẫn giữ đúng số thứ tự và khớp được file tờ khai; khi lưu file mềm, file trùng, file có mật khẩu, file không có trong danh sách được tải kèm với chữ đầu tên <i>Trùng_</i>, <i>Mật khẩu_</i>, <i>Không trong DS_</i>.<br><b>Bản 1.2.0:</b> thêm mục <b>Lưu file mềm</b> – đổi tên hàng loạt file PDF theo cú pháp dễ tìm, số thứ tự trong tên trùng với số in ở góc bản giấy; danh sách Excel có nhiều trang tính (mỗi tháng một trang) thì tick chọn trang cần dùng; chọn cả thư mục thì công cụ tự nhận luôn file Excel danh sách trong thư mục. Xem mục <a href="#luu-file-mem">Đổi tên file &amp; lưu file mềm</a>.</div>
<h2>Vì sao in nhiều file PDF một lúc hay bị lẫn?</h2>
<p>Khi chọn hàng trăm, hàng nghìn file PDF rồi bấm in, mỗi file là một lệnh in riêng. File nhỏ xử lý nhanh in trước, file nặng in sau, file lỗi bị bỏ qua mà không báo. Kết quả là xấp giấy không theo thứ tự bảng kê, phải ngồi xếp lại và rất khó biết hóa đơn nào chưa có bản in. Ngoài ra cùng một số hóa đơn (ví dụ số 123) có thể của nhiều người bán khác nhau, chỉ nhìn số hóa đơn thì dễ xếp nhầm.</p>
<h2>Cách làm bằng công cụ</h2>
<ol class="steps">
<li><b>Nạp file PDF:</b> chọn nhiều file, cả thư mục hoặc file ZIP chứa PDF (kéo thả được). Nạp thêm nhiều lần cũng được, file trùng đường dẫn tự bỏ. Thư mục có sẵn file Excel danh sách thì công cụ tự nhận; có từ 2 file Excel trở lên thì công cụ chọn file khớp nhiều hóa đơn nhất và cho đổi sang file khác.</li>
<li><b>Nạp danh sách:</b> chọn file Excel (.xlsx) hoặc CSV đã sắp theo thứ tự muốn in, ví dụ bảng kê tải từ cổng thuế hoặc xuất từ phần mềm kế toán. Công cụ tự tìm dòng tiêu đề và cột số hóa đơn, ký hiệu, MST người bán; chọn lại được nếu nhận sai. File có nhiều trang tính (ví dụ mỗi tháng một trang) thì tick các trang cần dùng – có nút Chọn tất cả / Bỏ chọn tất cả – và giữ, kéo thả để sắp thứ tự trang; công cụ gộp theo thứ tự đó, số thứ tự chạy liền.</li>
<li><b>Khớp &amp; kiểm tra:</b> bấm Khớp. Công cụ khớp theo tên file trước (ví dụ <i>1C26TAA_00000123.pdf</i>); file nào tên không đủ thông tin thì đọc chữ trong file. Kết quả chia nhóm: khớp chắc chắn, khớp theo số hóa đơn (nên xem lại), thiếu file, file chưa khớp, file trùng.</li>
<li><b>Gán tay, lưu đối chiếu:</b> dòng thiếu file có ô chọn để gán file chưa khớp; tải Excel đối chiếu để lưu hồ sơ.</li>
<li><b>Ghép file để in:</b> chọn số hóa đơn mỗi lô (50, 100, 200, 500 hoặc 1 file), bật số thứ tự góc trang, in 2 mặt, trang báo thiếu hóa đơn nếu cần, bấm Ghép file. Mở từng lô và in bằng một lệnh, in xong lô này mới in lô sau.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/in-hoa-don-ket-qua-khop.webp" width="1140" height="860" loading="lazy" alt="Kết quả khớp: 14 dòng danh sách, 13 khớp chắc chắn, 1 thiếu file PDF, 2 file chưa khớp, 1 file trùng; bảng ký hiệu, số hóa đơn, file PDF và cách khớp"><figcaption>Kết quả khớp file với danh sách (dữ liệu minh họa).</figcaption></figure>
<figure class="fig"><img src="/huong-dan/anh/in-hoa-don-ghep-lo.webp" width="1140" height="860" loading="lazy" alt="Bước ghép file để in: chọn số hóa đơn mỗi lô, số thứ tự góc trang, in 2 mặt, chèn trang thiếu hóa đơn; danh sách lô đã ghép có nút Mở để in và Tải về"><figcaption>Ghép thành lô và mở từng lô để in (dữ liệu minh họa).</figcaption></figure>
<h2 id="luu-file-mem">Đổi tên file &amp; lưu file mềm để tra cứu</h2>
<p>File hóa đơn tải hàng loạt từ phần mềm thường có tên dính liền, không dấu, ví dụ <i>0123456789_1_C26TDS_00000123_25102026_congtytnhhdomsang.pdf</i>. Gõ số hóa đơn hay tên công ty vào ô tìm kiếm của Windows thường không ra, phải kéo lên kéo xuống để tìm. Bản in chỉ để lưu trữ, còn khi cần tra cứu thì vẫn tìm trên file mềm là chính.</p>
<ol class="steps">
<li><b>Khớp xong danh sách</b> (bước 1–3 ở trên), sang <b>Bước 4 – In &amp; tải về</b>, kéo xuống mục <b>Lưu file mềm</b>. Không cần in thì ở bước Ghép file bấm <b>Chỉ lưu file mềm</b>.</li>
<li><b>Chọn các phần trong tên file:</b> mặc định là <i>STT_YYMM_Ký hiệu mẫu số_Ký hiệu hóa đơn_MST người bán_Số hóa đơn_Tên công ty</i>. Tích hoặc bỏ từng phần, giữ và kéo thả từng dòng (hoặc bấm mũi tên ↑↓) để đổi thứ tự; thêm được ngày hóa đơn hoặc chữ tự nhập. Đổi được dấu nối (gạch dưới, gạch ngang, dấu chấm, dấu cách).</li>
<li><b>Chọn cách viết tên công ty:</b> mặc định giữ nguyên có dấu và dấu cách; tích <b>Bỏ dấu tiếng Việt</b> và/hoặc <b>Bỏ dấu cách</b> nếu quen gõ không dấu. Khung <b>Xem trước tên mới</b> hiện ngay kết quả.</li>
<li><b>Lưu:</b> bấm <b>Lưu vào một thư mục</b> (Chrome, Edge) để ghi thẳng các file đã đổi tên vào thư mục chọn, hoặc <b>Tải file nén (ZIP)</b>. Kèm theo là file Excel đối chiếu có cột "Tên file mới".</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/in-hoa-don-luu-file-mem.webp" width="1140" height="860" loading="lazy" alt="Mục Lưu file mềm ở Bước 4: chọn các phần trong tên file, dấu nối, bỏ dấu tiếng Việt, bỏ dấu cách, xem trước tên mới dạng 0001_2610_1_C26TDS_0123456789_123_CONG TY TNHH DOM SANG.pdf, nút Lưu vào một thư mục và Tải file nén"><figcaption>Đổi tên file theo cú pháp và lưu file mềm (dữ liệu minh họa).</figcaption></figure>
<table><thead><tr><th>Tùy chọn</th><th>Tên file mới (ví dụ minh họa)</th></tr></thead><tbody>
<tr><td>Mặc định</td><td><code>0002_2609_1_C26TDS_0123456789_1579_CÔNG TY TNHH ĐỐM SÁNG.pdf</code></td></tr>
<tr><td>Bỏ dấu tiếng Việt</td><td><code>0002_2609_1_C26TDS_0123456789_1579_CONG TY TNHH DOM SANG.pdf</code></td></tr>
<tr><td>Bỏ dấu tiếng Việt + Bỏ dấu cách</td><td><code>0002_2609_1_C26TDS_0123456789_1579_CONGTYTNHHDOMSANG.pdf</code></td></tr>
</tbody></table>
<ul>
<li><b>Số thứ tự</b> trong tên trùng với số in ở góc tờ hóa đơn khi ghép lô, nên tìm trên máy và tìm trong tủ hồ sơ theo cùng một số.</li>
<li><b>Năm tháng (YYMM)</b> lấy từ ngày hóa đơn: hóa đơn ngày 30/09/2026 là <i>2609</i>.</li>
<li><b>File trùng, có mật khẩu, không có trong danh sách</b> vẫn được tải kèm, gắn chữ đầu tên để biết ngay: <i>Trùng_0024_…</i> (bản tải 2 lần của hóa đơn STT 24), <i>Mật khẩu_…</i> (file có mật khẩu, không đọc được nội dung), <i>Không trong DS_…</i> hoặc <i>Chưa khớp_…</i> (bỏ tích "Kèm file không có trong danh sách" nếu không cần).</li>
<li><b>Tờ khai hải quan nhập khẩu</b> trong danh sách (số tờ khai 12 chữ số, không có ký hiệu, MST) vẫn giữ đúng số thứ tự; có file PDF tờ khai mà tên hoặc nội dung chứa số tờ khai thì công cụ khớp và đổi tên luôn.</li>
<li>Ký tự Windows không cho dùng trong tên file (như / : * ? " &lt; &gt; |) được đổi thành dấu "-"; tên quá dài thì cắt bớt phần tên công ty; 2 file trùng tên thì thêm (2), (3). Dòng thiếu file PDF được bỏ qua.</li>
</ul>
<p class="warn">Lưu ý khi tải file nén: Windows có thể chặn mở file ngay bên trong file nén tải từ trình duyệt. Bấm chuột phải vào file nén → <b>Extract All (Giải nén tất cả)</b> rồi mở trong thư mục vừa giải nén. Dùng Chrome hoặc Edge thì nên chọn <b>Lưu vào một thư mục</b>.</p>
<h2>Công cụ khớp file với danh sách theo cách nào?</h2>
<ul>
<li>Tên file có ký hiệu và số hóa đơn đứng liền nhau (kiểu tên file tải từ cổng thuế) được coi là khớp chắc chắn; có thêm MST người bán thì càng chắc.</li>
<li>Tên file chỉ có số hóa đơn: chỉ khớp khi số đó duy nhất trong danh sách và được đánh dấu "nên xem lại"; công cụ đọc thêm chữ trong file để xác nhận.</li>
<li>Hai file cùng khớp một hóa đơn: file sau được báo là trùng, bản có đuôi "(1)", "Copy" xếp sau bản gốc. Dòng lặp lại trong danh sách không in lại.</li>
<li>Số thứ tự in ở góc trên bên phải mỗi trang dạng <i>0001/2000 · C26TAA-123</i>, đặt đúng góc kể cả trang xoay ngang.</li>
</ul>
<p class="warn">Lưu ý: bản scan chỉ có hình ảnh thì công cụ không đọc được chữ, cần tên file có ký hiệu và số hóa đơn, hoặc gán tay. File PDF có mật khẩu hoặc bị hỏng sẽ được báo để in riêng. Chọn cả thư mục và lưu vào thư mục chạy tốt nhất trên Chrome, Edge.</p>''',
  faq=[('Không có danh sách Excel thì có dùng được không?','Có. Không nạp danh sách thì công cụ xếp theo đường dẫn và tên file (số tự nhiên: 2 trước 10), vẫn ghép lô và đánh số thứ tự.'),
       ('2.000 file thì mất bao lâu?','Phần lớn thời gian là đọc chữ trong các file có tên không đủ thông tin; file đặt tên chuẩn có ký hiệu và số hóa đơn thì khớp gần như tức thì. Có thanh tiến độ và nút Dừng.'),
       ('File có bị gửi lên mạng không?','Không. File PDF và danh sách được xử lý ngay trên máy của anh/chị; có bản tải về dùng không cần mạng.'),
       ('Danh sách có tờ khai nhập khẩu thì số thứ tự có bị lệch không?','Không. Từ bản 1.2.1, dòng tờ khai hải quan (số tờ khai 12 chữ số, không có số hóa đơn, MST) vẫn giữ số thứ tự của nó; nếu có file PDF tờ khai thì công cụ khớp theo số tờ khai, không có thì báo thiếu file.'),
       ('Đổi tên file có làm thay đổi file gốc trên máy không?','Không. Công cụ tạo bản sao đã đổi tên (lưu vào thư mục chọn hoặc file nén), file gốc giữ nguyên tên và vị trí.'),
       ('Bảng kê có nhiều trang tính theo tháng thì làm thế nào?','Công cụ liệt kê tất cả trang tính kèm số hóa đơn từng trang, tick sẵn các trang có hóa đơn. Bấm Bỏ chọn tất cả rồi tick các tháng cần dùng; công cụ gộp theo thứ tự trang tính, đổi thứ tự bằng cách giữ và kéo thả (hoặc nút mũi tên).'),
       ('Có tốn phí không?','Không, công cụ dùng miễn phí.')],
  rel=['tai-hoa-don-dien-tu-hang-loat','chuyen-xml-hoa-don-sang-excel']),
 dict(slug='tai-to-khai-thue-hang-loat', seo_title='Tải tờ khai thuế đã nộp hàng loạt từ trang dịch vụ công', t=TT, ngay='03/11/2026', ngay_iso='2026-11-03',
  title='Cách tải hàng loạt tờ khai thuế đã nộp trên trang dịch vụ công (cả năm trong một lần)',
  short='Tải tờ khai thuế đã nộp hàng loạt',
  desc='Tải hàng loạt tờ khai, phụ lục và thông báo của cơ quan thuế đã nộp trên dichvucong.gdt.gov.vn thành 1 file ZIP kèm bảng kê Excel; tự gom các lần nộp, đánh dấu lần hiệu lực cuối. Miễn phí.',
  tldr=['Trang Tra cứu hồ sơ của trang dịch vụ công chỉ cho tra tối đa 30 ngày mỗi lần, lần nào cũng nhập mã xác nhận và phải mở từng tờ khai để tải.',
        'Công cụ miễn phí của Quản trị tử tế chạy ngay trên trang dịch vụ công: chọn cả năm, tự chia lượt đúng giới hạn của trang dịch vụ công, mỗi lượt gõ 1 mã rồi tải hàng loạt.',
        'Hồ sơ nộp trước 01/07/2025 (tab Thuế điện tử): mỗi 12 tháng chỉ 1 mã xác nhận.',
        'Kết quả là 1 file ZIP: tờ khai XML, file đính kèm, thông báo của cơ quan thuế, bảng kê Excel gom các lần nộp theo tờ khai và kỳ.'],
  body='''
<h2>Vì sao tải tờ khai trên trang dịch vụ công mất nhiều thời gian?</h2>
<p>Trên trang Tra cứu hồ sơ của trang dịch vụ công (dichvucong.gdt.gov.vn), mỗi lần tra chỉ được tối đa 30 ngày và phải nhập mã xác nhận. Trang dịch vụ công không có nút tải hàng loạt: muốn lấy tờ khai phải mở từng hồ sơ, bấm Tải xuống, mà mở xong không có nút quay lại, lại phải tra từ đầu. Kỳ nào nộp bổ sung nhiều lần thì phải tải về từng bản rồi tự so xem lần nào là lần cuối.</p>
<h2>Cách làm bằng công cụ</h2>
<ol class="steps">
<li><b>Cài nút một lần:</b> mở trang công cụ, kéo nút "Tải tờ khai" lên thanh dấu trang của Chrome hoặc Edge.</li>
<li><b>Đăng nhập trang dịch vụ công như thường ngày</b> rồi bấm nút "Tải tờ khai" trên thanh dấu trang. Bảng điều khiển hiện ngay trên trang dịch vụ công, dùng phiên đăng nhập sẵn có.</li>
<li><b>Chọn khoảng ngày nộp:</b> tháng, quý, cả năm hoặc nhiều năm (có nút nhanh Tháng trước, Quý trước, Năm nay, Năm trước); lọc loại tờ khai nếu cần; chọn chế độ Đầy đủ (kèm thông báo của cơ quan thuế) hoặc Tải nhanh (chỉ tờ khai).</li>
<li><b>Gõ mã xác nhận cho từng lượt:</b> công cụ hiện ảnh mã của trang dịch vụ công, anh/chị đọc và gõ. Tải xong lượt này mới hỏi mã lượt sau; đến lượt gõ mã có chuông và thông báo trên màn hình, không cần ngồi canh.</li>
<li><b>Nhận file ZIP:</b> mỗi loại tờ khai một thư mục, tên file ghi kỳ, lần nộp, chính thức hay bổ sung, ngày nộp; kèm Bảng kê Excel.</li>
</ol>
<figure class="fig"><img src="/huong-dan/anh/tai-to-khai-bang-dieu-khien.webp" width="1280" height="720" loading="lazy" alt="Bảng điều khiển Tải tờ khai hàng loạt trên trang dịch vụ công: kết quả lọc 01/GTGT kỳ Q3 có 4 lần nộp, lần bổ sung không được chấp nhận bị gạch, lần cuối được đánh dấu, cột Tải ghi số thông báo đã tải"><figcaption>Bảng điều khiển sau khi tải xong (dữ liệu minh họa).</figcaption></figure>
<h2>Mỗi lượt cần bao nhiêu mã xác nhận?</h2>
<ul>
<li>Hồ sơ nộp từ 01/07/2025 nằm ở tab "Tra cứu hồ sơ đã nộp trên DVC": trang dịch vụ công giới hạn 30 ngày mỗi lần tra, nên mỗi tháng là 1 lượt, 1 mã.</li>
<li>Hồ sơ nộp trước 01/07/2025 nằm ở tab "Thuế điện tử": trang dịch vụ công cho tra khoảng dài, công cụ gộp 12 tháng thành 1 lượt, 1 mã.</li>
<li>Công cụ không tự đọc mã và không dùng lại mã cũ, đúng quy định của trang dịch vụ công. Trang dịch vụ công chỉ cho tải hồ sơ của lần tra gần nhất, nên công cụ tra lượt nào tải luôn lượt đó.</li>
</ul>
<h2>Nhiều lần nộp cùng kỳ được xử lý thế nào?</h2>
<p>Công cụ gom các hồ sơ theo tờ khai và kỳ tính thuế, xếp theo ngày nộp. Lần hiệu lực cuối là hồ sơ nộp sau cùng, không tính hồ sơ đã hủy hoặc không được chấp nhận. Trong Bảng kê Excel có sheet "Theo tờ khai &amp; kỳ" liệt kê các lần nộp và cảnh báo kỳ có hồ sơ hủy, lần cuối chưa có kết quả. Nếu chỉ cần bản cuối, tick "Chỉ giữ lần hiệu lực cuối của mỗi kỳ" trước khi tải.</p>
<p class="warn">Lưu ý: anh/chị vẫn nên đối chiếu nội dung tờ khai bổ sung khi lập báo cáo. Một số thông báo trang dịch vụ công không cho tải (bấm tay trên trang dịch vụ công cũng báo "Tải file thất bại"); công cụ ghi riêng các thông báo này vào file HS-chua-tai-duoc.txt, tờ khai vẫn được tải đủ.</p>''',
  faq=[('Có phải đưa mật khẩu thuế cho công cụ không?','Không. Công cụ chạy trên chính trang dịch vụ công bằng phiên đăng nhập anh/chị đang có, không hỏi và không lưu mật khẩu, không gửi dữ liệu đi đâu khác.'),
       ('Hết phiên đăng nhập giữa chừng thì sao?','Công cụ tự lưu file ZIP phần đã tải. Đăng nhập lại, bấm nút "Tải tờ khai" và chọn "Điền sẵn khoảng ngày còn lại" để tải tiếp.'),
       ('Công cụ có nộp, sửa hay hủy hồ sơ không?','Không. Công cụ chỉ tra cứu và tải về, không gọi bất kỳ lệnh nộp, bổ sung hay hủy hồ sơ nào.'),
       ('Có tốn phí không?','Không, công cụ dùng miễn phí.')],
  rel=['tai-hoa-don-dien-tu-hang-loat','lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don']),
]
BY = {p['slug']: p for p in PAGES}

def head(title, desc, path, ld):
    return f'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Quản trị tử tế</title><meta name="description" content="{e(desc)}">
<link rel="canonical" href="{SITE}{path}"><meta property="og:type" content="article"><meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{SITE}{path}"><meta property="og:image" content="{SITE}/assets/desk-on.jpg">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/assets/fonts/fonts.css?v=20261103">
<link rel="stylesheet" href="/huong-dan/huong-dan.css?v=20261021b">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">Quản trị <span>tử tế</span></a>
<nav><a href="/cong-cu">Bộ công cụ</a><a href="/huong-dan/">Hướng dẫn</a><a href="/ve-dom">Về Đốm</a></nav></div></header>
'''
FOOT = '''<footer><div class="in">Quản trị tử tế · Công cụ miễn phí &amp; AI giúp dân văn phòng bớt việc lặp lại · <a href="/cong-cu">Xem Bộ công cụ</a> · <a href="/chinh-sach-du-lieu/">Chính sách dữ liệu</a> · <a href="/dieu-khoan-su-dung/">Điều khoản</a></div></footer>
<script src="/qtt-analytics.js?v=20261021" defer></script>
</body></html>'''

def page(p):
    path = f'/huong-dan/{p["slug"]}/'; t = p['t']
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": p['title'], "description": p['desc'], "datePublished": p.get('pub_iso', p.get('ngay_iso', NGAY_ISO)), "dateModified": p.get('ngay_iso', NGAY_ISO),
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
    # v1.32 (02/11): thẻ <title> dùng seo_title ngắn (≤ ~60 ký tự kể cả đuôi) để Google không cắt; H1 trong bài giữ tiêu đề đầy đủ
    return head(p.get('seo_title', p['title']), p['desc'], path, ld) + f'''<main>
<p class="crumb"><a href="/">Trang chủ</a> › <a href="/huong-dan/">Hướng dẫn</a></p>
<h1>{e(p['title'])}</h1><p class="meta">Cập nhật {p.get('ngay', NGAY)} · Đốm – Quản trị tử tế</p>
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
    return head('Hướng dẫn xử lý việc văn phòng nhanh hơn', 'Hướng dẫn từng bước: tải hóa đơn điện tử hàng loạt, chuyển XML sang Excel, lập tờ khai 01/GTGT, soát tờ khai từ danh sách hóa đơn, tạo văn bản hàng loạt, đối chiếu sao kê ngân hàng và 2 file Excel – kèm công cụ miễn phí.', path, ld) + f'''<main>
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
