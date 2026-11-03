# Tạo 2 trang tĩnh: /chinh-sach-du-lieu/ và /dieu-khoan-su-dung/ (03/11/2026).
# Sửa nội dung ở đây rồi chạy:  python phap-ly/tao-trang-phap-ly.py   → npm run deploy:site
import os
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
NGAY = '03/11/2026'; VER = '1.0'
EMAIL = 'quantritute@gmail.com'; CHU = 'Đỗ Minh Tuấn'
def page(slug, title, desc, h1, body):
    url = f'https://quantritute.com/{slug}/'
    return f'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Quản trị tử tế</title><meta name="description" content="{desc}">
<link rel="canonical" href="{url}"><meta property="og:type" content="website"><meta property="og:title" content="{title} · Quản trị tử tế"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}"><meta property="og:image" content="https://quantritute.com/assets/desk-on.jpg">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/assets/fonts/fonts.css?v=20261103">
<link rel="stylesheet" href="/huong-dan/huong-dan.css?v=20261021b">
<style>.toc{{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 18px;margin:16px 0}}.toc ol{{margin:6px 0 0;padding-left:22px}}.toc a{{text-decoration:none}}button.ck{{font:inherit;font-weight:600;cursor:pointer;border:1.5px solid var(--ink);background:transparent;color:var(--ink);border-radius:999px;padding:6px 16px}}h2{{scroll-margin-top:16px}}</style>
</head>
<body>
<header class="top"><div class="in"><a class="brand" href="/">Quản trị <span>tử tế</span></a>
<nav><a href="/cong-cu">Bộ công cụ</a><a href="/huong-dan/">Hướng dẫn</a><a href="/ve-dom">Về Đốm</a></nav></div></header>
<main>
<p class="crumb"><a href="/">Trang chủ</a> › {h1}</p>
<h1>{h1}</h1><p class="meta">Phiên bản {VER} · Hiệu lực từ {NGAY}</p>
{body}
</main>
<footer><div class="in">Quản trị tử tế · <a href="/chinh-sach-du-lieu/">Chính sách dữ liệu</a> · <a href="/dieu-khoan-su-dung/">Điều khoản sử dụng</a> · Liên hệ: <a href="mailto:{EMAIL}">{EMAIL}</a></div></footer>
<script src="/qtt-analytics.js?v=20261103" defer></script>
</body></html>
'''

CS = f'''
<div class="tldr"><p><b>Tóm tắt nhanh</b></p><ul>
<li>Web chỉ hỏi những thông tin cần cho đúng việc anh/chị đang làm (gửi link, nhận tin, góp ý, đặt lịch) và chỉ lưu khi anh/chị <b>tích ô đồng ý</b>.</li>
<li>File anh/chị nạp vào công cụ được xử lý <b>ngay trên máy của anh/chị</b>, không gửi lên máy chủ của Quản trị tử tế.</li>
<li>Không bán, không cho thuê, không dùng dữ liệu để chạy quảng cáo.</li>
<li>Muốn xem, sửa, xoá dữ liệu hoặc rút lại đồng ý: gửi email tới <a href="mailto:{EMAIL}">{EMAIL}</a>.</li></ul></div>

<nav class="toc" aria-label="Mục lục"><b>Mục lục</b><ol>
<li><a href="#ai">Ai chịu trách nhiệm dữ liệu</a></li><li><a href="#thu-gi">Dữ liệu được thu, để làm gì, lưu bao lâu</a></li>
<li><a href="#cong-cu">Dữ liệu trong các công cụ</a></li><li><a href="#cookie">Phân tích web và cookie</a></li>
<li><a href="#ben-thu-ba">Bên thứ ba và lưu trữ ở nước ngoài</a></li><li><a href="#ai-ho-tro">Sử dụng AI</a></li>
<li><a href="#quyen">Quyền của anh/chị và cách thực hiện</a></li><li><a href="#bao-mat">Bảo mật và xử lý sự cố</a></li>
<li><a href="#khac">Những điều web không làm</a></li><li><a href="#thay-doi">Thay đổi chính sách</a></li></ol></nav>

<h2 id="ai">1. Ai chịu trách nhiệm dữ liệu</h2>
<p>Website <b>quantritute.com</b> (Quản trị tử tế) do cá nhân <b>{CHU}</b> vận hành. Ông {CHU} là bên quyết định mục đích và cách xử lý dữ liệu cá nhân thu qua website này.</p>
<p>Liên hệ về dữ liệu cá nhân: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<p>Chính sách này được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP (có hiệu lực từ 01/01/2026).</p>

<h2 id="thu-gi">2. Dữ liệu được thu, để làm gì, lưu bao lâu</h2>
<div class="tw"><table><thead><tr><th>Khi anh/chị…</th><th>Dữ liệu</th><th>Để làm gì</th><th>Lưu bao lâu</th></tr></thead><tbody>
<tr><td>Bấm “Gửi link về email” để mở công cụ trên máy tính</td><td>Email</td><td>Gửi 1 thư chứa link công cụ</td><td>Tự xoá sau 30 ngày</td></tr>
<tr><td>Đăng ký nhận tin công cụ mới hoặc tin văn bản pháp luật mới</td><td>Email, thời điểm đồng ý</td><td>Gửi thư thông báo; xác nhận 2 bước qua email</td><td>Đến khi anh/chị bấm “Hủy đăng ký” ở cuối thư; sau khi hủy, hoặc nếu không xác nhận, xoá sau 30 ngày</td></tr>
<tr><td>Gửi “Góp ý cho Đốm” trong công cụ hoặc Cẩm nang</td><td>Họ tên, số điện thoại (không bắt buộc), nội dung, trang đang dùng, thời điểm đồng ý</td><td>Phản hồi góp ý, sửa lỗi, cải thiện công cụ</td><td>24 tháng; sau đó xoá họ tên, số điện thoại, chỉ giữ nội dung góp ý</td></tr>
<tr><td>Gửi đề xuất công cụ (“Kể Đốm nghe”)</td><td>Nội dung đề xuất, vị trí công việc, Zalo/Email nếu anh/chị để lại</td><td>Xem xét làm công cụ; báo tin khi xong</td><td>24 tháng; sau đó xoá thông tin liên hệ, chỉ giữ nội dung đề xuất</td></tr>
<tr><td>Đặt lịch trò chuyện 1:1</td><td>Tên, số điện thoại/Zalo/Email, chủ đề, lời nhắn, thời điểm đồng ý</td><td>Liên hệ hẹn lịch và trao đổi</td><td>24 tháng rồi xoá</td></tr>
<tr><td>Bấm “Tôi cũng cần” trên Bảng ghim</td><td>Mã ngẫu nhiên của trình duyệt</td><td>Mỗi trình duyệt chỉ tính 1 lần</td><td>Theo đề xuất trên Bảng ghim</td></tr>
</tbody></table></div>
<p>Với mọi form, web còn ghi <b>mã băm của địa chỉ IP</b> (không lưu IP thật) để chặn gửi tự động, gửi lặp nhiều lần. Thư đã gửi đi được ghi nhật ký 90 ngày để kiểm tra thư có tới nơi hay không.</p>
<p>Đề xuất có thể được biên tập lại (bỏ thông tin nhận diện) để đưa lên Bảng ghim. Tên và lời góp ý chỉ hiện ở trang Góc cảm ơn khi anh/chị đồng ý.</p>
<p>Web không chủ đích thu dữ liệu của trẻ em. Nếu phát hiện thông tin do trẻ em dưới 16 tuổi gửi, Quản trị tử tế sẽ xoá.</p>

<h2 id="cong-cu">3. Dữ liệu trong các công cụ</h2>
<ul>
<li>File Excel, Word, XML, PDF anh/chị nạp vào công cụ được đọc và xử lý <b>ngay trong trình duyệt trên máy anh/chị</b>. Máy chủ của Quản trị tử tế không nhận, không lưu các file này.</li>
<li>Các công cụ làm việc với trang của cơ quan thuế (tải hóa đơn, tải tờ khai): anh/chị tự đăng nhập bằng tài khoản của mình. Việc đăng nhập và tải dữ liệu diễn ra giữa trình duyệt của anh/chị và trang đó. Quản trị tử tế <b>không nhận tên đăng nhập, mật khẩu hay dữ liệu tải về</b>.</li>
<li>Web chỉ đếm số lượt mở, dùng, tải công cụ, không kèm dữ liệu của anh/chị.</li>
<li>Một số công cụ lưu tạm thiết lập, dữ liệu đang làm dở trong bộ nhớ trình duyệt trên máy anh/chị để lần sau mở lại không mất. Anh/chị xoá được bằng cách xoá dữ liệu duyệt web của trang này.</li></ul>

<h2 id="cookie">4. Phân tích web và cookie</h2>
<p><b>Thống kê nội bộ, không cookie:</b> web ghi trang được xem, nguồn vào web, thời gian ở lại, độ cuộn, chữ trên nút được bấm, loại thiết bị, trình duyệt, quốc gia và tốc độ tải trang để cải thiện web. Người truy cập chỉ được nhận biết bằng một mã băm thay đổi mỗi ngày (tạo từ IP, trình duyệt, ngày và một chuỗi bí mật), không truy ngược ra được là ai. Web không ghi chữ anh/chị gõ hay file anh/chị nạp. Trình duyệt giữ một mã phiên ngẫu nhiên (tự hết sau 30 phút không thao tác) và một đánh dấu “đã từng ghé”. Số liệu tự xoá sau khoảng 13 tháng.</p>
<p><b>Microsoft Clarity (chỉ khi anh/chị đồng ý):</b> giúp xem người dùng thao tác trên trang thế nào để làm web dễ dùng hơn. Clarity dùng cookie, ghi lại chuyển động chuột, cuộn, bấm; chữ trong ô nhập luôn được che. Clarity chỉ chạy sau khi anh/chị bấm “Đồng ý”, và không chạy trong các trang công cụ. Bấm “Không, cảm ơn” thì web vẫn dùng đầy đủ.</p>
<p>Đổi ý bất cứ lúc nào: bấm “Tùy chọn cookie” ở chân trang (mục này chỉ hiện khi web đang dùng Clarity) để được hỏi lại; chọn “Không, cảm ơn” thì cookie Clarity trên web được xoá. Dữ liệu Clarity đã ghi trước đó do Microsoft lưu theo chính sách của Microsoft.</p>
<p>Video YouTube được nhúng ở chế độ hạn chế cookie (youtube-nocookie.com).</p>

<h2 id="ben-thu-ba">5. Bên thứ ba và lưu trữ ở nước ngoài</h2>
<p>Để vận hành web, dữ liệu đi qua hoặc được lưu bởi các nhà cung cấp dưới đây. Một số đặt máy chủ <b>ngoài Việt Nam</b>; khi dùng các chức năng tương ứng, dữ liệu sẽ được chuyển tới đó:</p>
<div class="tw"><table><thead><tr><th>Nhà cung cấp</th><th>Việc</th><th>Dữ liệu liên quan</th></tr></thead><tbody>
<tr><td>Cloudflare, Inc. (Mỹ, mạng máy chủ toàn cầu)</td><td>Chạy website, cơ sở dữ liệu, chặn tấn công</td><td>Toàn bộ dữ liệu ở mục 2, 4</td></tr>
<tr><td>Resend (Mỹ)</td><td>Gửi email</td><td>Email người nhận, nội dung thư</td></tr>
<tr><td>Microsoft Clarity (Mỹ)</td><td>Phân tích thao tác, chỉ khi anh/chị đồng ý</td><td>Dữ liệu thao tác trên trang, cookie</td></tr>
<tr><td>Anthropic (Mỹ), Cloudflare Workers AI</td><td>AI hỗ trợ tóm tắt, phân loại (xem mục 6)</td><td>Văn bản pháp luật công khai; nội dung góp ý/đề xuất đã tự động che email, số điện thoại, không kèm họ tên</td></tr>
<tr><td>YouTube (Google)</td><td>Phát video khi anh/chị bấm xem</td><td>Theo chính sách của Google</td></tr>
</tbody></table></div>
<p>Quản trị tử tế không chia sẻ dữ liệu cá nhân cho bên nào khác, trừ khi cơ quan nhà nước có thẩm quyền yêu cầu theo quy định pháp luật.</p>

<h2 id="ai-ho-tro">6. Sử dụng AI</h2>
<ul><li>Phần tóm tắt văn bản pháp luật mới trên Cẩm nang và trong bản tin email được soạn với sự hỗ trợ của AI từ văn bản gốc, <b>được Minh Tuấn rà soát trước khi đăng</b>. Luôn có link văn bản gốc để đối chiếu.</li>
<li>AI hỗ trợ Minh Tuấn phân loại góp ý, đề xuất. Trước khi gửi cho AI, email và số điện thoại được tự động che; họ tên không được gửi. AI không tự ra quyết định nào ảnh hưởng tới anh/chị.</li>
<li>Đốm là nhân vật minh hoạ của web (hình ảnh, giọng đọc trong video có dùng công cụ AI). Đốm trên web không phải chatbot, không tự trả lời tin nhắn.</li></ul>

<h2 id="quyen">7. Quyền của anh/chị và cách thực hiện</h2>
<p>Theo Luật Bảo vệ dữ liệu cá nhân, anh/chị có quyền: được biết về việc xử lý dữ liệu; đồng ý hoặc không đồng ý; <b>rút lại sự đồng ý</b>; xem, chỉnh sửa dữ liệu; yêu cầu xoá, hạn chế xử lý; phản đối xử lý; khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường theo quy định pháp luật.</p>
<p><b>Cách gửi yêu cầu:</b> gửi email tới <a href="mailto:{EMAIL}">{EMAIL}</a>, tiêu đề “Yêu cầu dữ liệu cá nhân”, ghi rõ yêu cầu và email/số điện thoại anh/chị đã dùng trên web để tìm đúng dữ liệu. Có thể được hỏi thêm thông tin để xác minh đúng là anh/chị.</p>
<div class="tw"><table><thead><tr><th>Việc</th><th>Thời hạn</th></tr></thead><tbody>
<tr><td>Xác nhận đã nhận yêu cầu</td><td>Trong 2 ngày làm việc</td></tr>
<tr><td>Cho xem, cung cấp, chỉnh sửa dữ liệu</td><td>Trong 10 ngày</td></tr>
<tr><td>Rút lại đồng ý, hạn chế hoặc phản đối xử lý</td><td>Trong 15 ngày</td></tr>
<tr><td>Xoá dữ liệu</td><td>Trong 20 ngày</td></tr></tbody></table></div>
<p>Hủy nhận thư: bấm “Hủy đăng ký” ở cuối bất kỳ thư nào, có hiệu lực ngay.</p>

<h2 id="bao-mat">8. Bảo mật và xử lý sự cố</h2>
<ul><li>Toàn bộ web chạy qua HTTPS; trang quản trị tách riêng, đăng nhập 2 lớp (xác thực email qua Cloudflare Access + mật khẩu quản trị); chỉ Minh Tuấn được truy cập dữ liệu.</li>
<li>Không lưu IP thật; không lưu mật khẩu, tài khoản ngân hàng hay tài khoản thuế của người dùng.</li>
<li>Khi xảy ra sự cố lộ, mất dữ liệu cá nhân, Quản trị tử tế sẽ thông báo cho cơ quan chuyên trách bảo vệ dữ liệu cá nhân (Bộ Công an) trong thời hạn luật định (72 giờ), và báo cho người bị ảnh hưởng qua email khi cần.</li></ul>

<h2 id="khac">9. Những điều web không làm</h2>
<ul><li>Không mua bán, cho thuê, trao đổi dữ liệu cá nhân.</li><li>Không dùng dữ liệu để chạy quảng cáo, không gắn Facebook Pixel, Google Ads hay mã quảng cáo nào.</li>
<li>Không thu dữ liệu cá nhân nhạy cảm (sức khoẻ, tài chính, tài khoản ngân hàng…).</li><li>Không dùng dữ liệu vào mục đích khác với mục đích đã nêu ở mục 2.</li></ul>
<p>Mời “Tách cà phê” là chuyển khoản tự nguyện qua ngân hàng của anh/chị: web không nhận thông tin thanh toán. Tên người chuyển, nội dung chuyển khoản do ngân hàng hiển thị cho chủ tài khoản, chỉ dùng để cảm ơn.</p>

<h2 id="thay-doi">10. Thay đổi chính sách</h2>
<p>Khi chính sách thay đổi, phiên bản và ngày hiệu lực ở đầu trang được cập nhật. Thay đổi quan trọng (thêm loại dữ liệu, thêm mục đích, thêm bên nhận) sẽ được thông báo trên web và qua email cho người đang đăng ký nhận tin; với mục đích mới, web sẽ xin lại sự đồng ý.</p>
<p>Xem thêm: <a href="/dieu-khoan-su-dung/">Điều khoản sử dụng</a>.</p>
'''

DK = f'''
<div class="tldr"><p><b>Tóm tắt nhanh</b></p><ul>
<li>Công cụ và nội dung trên web hiện <b>miễn phí</b>, dùng cho công việc của anh/chị và đơn vị mình.</li>
<li>Cẩm nang, bài hướng dẫn, bản tin là <b>tài liệu tham khảo</b>, không thay thế tư vấn pháp lý, thuế. Kết quả công cụ cần được anh/chị kiểm tra trước khi nộp hay kê khai.</li>
<li>Dữ liệu anh/chị nạp vào công cụ xử lý ngay trên máy của anh/chị.</li></ul></div>

<h2>1. Phạm vi</h2>
<p>Điều khoản này áp dụng khi anh/chị truy cập quantritute.com, dùng các công cụ (bản online hoặc bản tải về), đọc Cẩm nang, bài hướng dẫn, nhận bản tin email. Website do cá nhân <b>{CHU}</b> vận hành; liên hệ <a href="mailto:{EMAIL}">{EMAIL}</a>. Dùng web nghĩa là anh/chị đồng ý với điều khoản này.</p>

<h2>2. Dịch vụ miễn phí</h2>
<p>Hiện web không thu phí bất kỳ công cụ, nội dung nào. “Tách cà phê” là khoản ủng hộ tự nguyện, không phải mua hàng, không kèm quyền lợi hay cam kết dịch vụ. Khi có công cụ hoặc dịch vụ thu phí, điều khoản riêng (giá, cách thanh toán, hoàn tiền, khiếu nại) sẽ được công bố trước khi bán.</p>

<h2>3. Thông tin chỉ để tham khảo</h2>
<ul><li>Cẩm nang Thuế – Kế toán – Lao động, bài hướng dẫn, bản tin văn bản pháp luật mới được biên soạn cẩn thận nhưng <b>không phải tư vấn pháp lý, thuế, kế toán</b> cho trường hợp cụ thể.</li>
<li>Phần tóm tắt văn bản pháp luật mới có AI hỗ trợ soạn và được rà soát trước khi đăng; luôn đối chiếu văn bản gốc (có link kèm theo) và văn bản còn hiệu lực trước khi áp dụng.</li>
<li>Quy định pháp luật thay đổi thường xuyên; nội dung trên web có thể chưa kịp cập nhật.</li></ul>

<h2>4. Dùng công cụ</h2>
<ul><li>Công cụ xử lý file ngay trên máy anh/chị (xem <a href="/chinh-sach-du-lieu/#cong-cu">Chính sách dữ liệu, mục 3</a>). Anh/chị nên giữ bản gốc file trước khi xử lý.</li>
<li>Kết quả công cụ (bảng kê, tờ khai, file nhập phần mềm kế toán, file đối chiếu…) là bản hỗ trợ. <b>Anh/chị và đơn vị chịu trách nhiệm kiểm tra, quyết định nộp</b> và số liệu đã kê khai với cơ quan nhà nước.</li>
<li>Công cụ làm việc với trang của cơ quan thuế: anh/chị tự đăng nhập bằng tài khoản hợp pháp của mình hoặc được đơn vị ủy quyền, tự thao tác các bước xác thực (mã xác nhận), chỉ tải dữ liệu của đơn vị mình và tuân thủ quy định sử dụng của trang đó. Không dùng công cụ để truy cập dữ liệu của người khác hay làm quá tải hệ thống.</li>
<li>Công cụ được cung cấp theo hiện trạng; có thể được sửa, nâng cấp, tạm dừng mà không báo trước.</li></ul>

<h2>5. Hành vi không được phép</h2>
<ul><li>Tấn công, dò lỗ hổng, gửi tự động, spam qua form của web.</li><li>Dùng web, công cụ vào việc trái pháp luật.</li>
<li>Gửi nội dung vi phạm pháp luật, xúc phạm người khác, hoặc thông tin cá nhân của người khác mà không được phép.</li>
<li>Sao chép, bán lại công cụ, nội dung, hình ảnh nhân vật Đốm dưới tên mình khi chưa được đồng ý.</li></ul>

<h2>6. Quyền sở hữu</h2>
<p>Công cụ, bài viết, hình ảnh, nhân vật Đốm thuộc về {CHU}, trừ khi ghi rõ nguồn khác. Anh/chị được dùng miễn phí cho công việc của mình và đơn vị; chia sẻ link thoải mái. Văn bản pháp luật được dẫn là tài liệu công khai của Nhà nước.</p>

<h2>7. Góp ý, đề xuất</h2>
<p>Góp ý, đề xuất anh/chị gửi có thể được dùng để làm hoặc cải thiện công cụ, và có thể được biên tập (bỏ thông tin nhận diện) để đưa lên Bảng ghim. Tên và lời góp ý chỉ hiện ở Góc cảm ơn khi anh/chị đồng ý.</p>

<h2>8. Giới hạn trách nhiệm</h2>
<p>Trong phạm vi pháp luật cho phép, Quản trị tử tế không chịu trách nhiệm với thiệt hại phát sinh từ việc dùng thông tin tham khảo hoặc kết quả công cụ mà chưa được kiểm tra, từ việc web hay công cụ tạm thời gián đoạn, hoặc từ trang web của bên thứ ba được dẫn link. Điều này không làm mất các quyền của anh/chị theo pháp luật về bảo vệ quyền lợi người tiêu dùng.</p>

<h2>9. Thay đổi điều khoản, luật áp dụng</h2>
<p>Điều khoản có thể được cập nhật; phiên bản và ngày hiệu lực ghi ở đầu trang. Điều khoản này được điều chỉnh theo pháp luật Việt Nam. Tranh chấp (nếu có) được ưu tiên giải quyết bằng thương lượng qua email {EMAIL}; không thương lượng được thì đưa ra cơ quan có thẩm quyền theo quy định pháp luật.</p>
<p>Xem thêm: <a href="/chinh-sach-du-lieu/">Chính sách bảo vệ dữ liệu cá nhân</a>.</p>
'''
for slug, t, d, h, b in [
    ('chinh-sach-du-lieu', 'Chính sách bảo vệ dữ liệu cá nhân', 'Quản trị tử tế thu dữ liệu gì, để làm gì, lưu bao lâu, gửi cho ai, và cách anh/chị xem, sửa, xoá dữ liệu hoặc rút lại đồng ý.', 'Chính sách bảo vệ dữ liệu cá nhân', CS),
    ('dieu-khoan-su-dung', 'Điều khoản sử dụng', 'Điều khoản khi dùng công cụ, Cẩm nang và nội dung trên quantritute.com: miễn phí, chỉ để tham khảo, người dùng tự kiểm tra kết quả trước khi nộp.', 'Điều khoản sử dụng', DK)]:
    os.makedirs(f'site/public/{slug}', exist_ok=True)
    open(f'site/public/{slug}/index.html', 'w', encoding='utf-8').write(page(slug, t, d, h, b)); print('Tạo', f'site/public/{slug}/index.html')
