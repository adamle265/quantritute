  // Chi phí máy chủ dự kiến theo quy mô (gói Free Cloudflare: Workers + D1 + R2) – giới hạn lấy từ trang giá Cloudflare, kiểm tra 07–08/11/2026
  // 08/11 anh: thêm dung lượng file scan, ảnh nhân viên; mức dưới 20 · 20–49 · 50–200 · trên 200; trên 200 người cân nhắc ERP trả phí
  function wfCostCard() {
    var T = [['Dưới 20 người', 20], ['20 – 49 người', 49], ['50 – 200 người', 200], ['Trên 200 người', 300]], LIM = { req: 100000, rd: 5000000 };
    function nf(v) { return Math.round(v).toLocaleString('vi-VN'); }
    function pc(v, l) { var x = v / l * 100; return x < 1 ? '<1%' : Math.round(x) + '%'; }
    function sz(mb) { return mb < 1000 ? '≈ ' + nf(mb) + ' MB' : '≈ ' + (mb / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' GB'; }
    var rows = T.map(function (t) {
      var n = t[1], big = n > 200, req = 3600 + 15 * n, rd = 3600 * (5 * n + 25) + 500 * n, cc = 2 * n * 260 * 0.4 / 1024, f1 = n * 6, f3 = n * 8;
      return '<tr' + (big ? ' class="big"' : '') + '><td><b>' + t[0] + '</b>' + (big ? '<small>tính ví dụ 300 người</small>' : '<small>tính ở mức ' + n + ' người</small>') + '</td>' +
        '<td class="num">' + nf(req) + ' <span class="faint">(' + pc(req, LIM.req) + ')</span></td>' +
        '<td class="num' + (rd > LIM.rd ? ' down' : '') + '">' + nf(rd) + ' <span class="faint">(' + pc(rd, LIM.rd) + ')</span></td>' +
        '<td class="num">' + sz(cc) + '</td>' +
        '<td class="num">' + sz(f1) + ' → ' + sz(f3) + ' <span class="faint">(' + pc(f3, 10240) + ')</span></td>' +
        '<td>' + (big ? '<span class="tag tag-warn">Có thể từ 5 USD</span>' : '<span class="tag tag-ok">0 đ</span>') + '</td></tr>';
    }).join('');
    return '<div class="card card-pad wf-cost"><div class="card-head"><div><h3>Chi phí máy chủ dự kiến theo quy mô nhân sự</h3><p>Phần chạy online (chấm công, trang nhân viên, kho file hồ sơ) đặt trên tài khoản Cloudflare riêng của công ty, gói <b>Free</b>: Workers (máy chủ), D1 (dữ liệu), R2 (file scan, ảnh). Bảng dưới là <b>ước tính</b> mức dùng so với giới hạn miễn phí.</p></div><span class="tag tag-ok">Miễn phí đến 200 người</span></div>' +
      '<div class="tbl-wrap"><table class="tbl wf-ct"><thead><tr><th>Quy mô</th><th>Lượt gọi máy chủ/ngày</th><th>Dòng dữ liệu đọc/ngày</th><th>Dữ liệu chấm công/năm</th><th>File scan, ảnh nhân viên<br><small>năm đầu → sau 3 năm</small></th><th>Chi phí/tháng</th></tr></thead><tbody>' + rows +
      '<tr class="lim"><td>Giới hạn gói Free</td><td class="num">100.000/ngày</td><td class="num">5 triệu/ngày</td><td class="num">5 GB</td><td class="num">10 GB</td><td>0 đ</td></tr></tbody></table></div>' +
      '<ul class="wf-note"><li><b>Giả định chấm công:</b> 1 trang Mã QR chấm công mở 8 giờ/ngày (tự làm mới 8 giây/lần – phần tốn nhiều nhất), mỗi người chấm 2 lượt/ngày, mở trang nhân viên vài lần, 260 ngày làm việc/năm.</li>' +
      '<li><b>Giả định file hồ sơ:</b> mỗi người khoảng 6 MB lúc vào làm (ảnh chân dung + khoảng 12 giấy tờ scan: CCCD, bằng cấp, sơ yếu lý lịch, giấy khám sức khỏe, hợp đồng đã ký…, mỗi file 0,3–0,5 MB, ảnh chụp bằng điện thoại nên nén lại trước khi tải lên) và thêm khoảng 1 MB/năm (hợp đồng, quyết định mới). Kho file R2 miễn phí 10 GB, tải về không mất phí.</li>' +
      '<li><b>Trên 200 người:</b> số dòng đọc vượt 5 triệu/ngày khi trang Mã QR chấm công bật cả ngày → dùng gói Workers Paid, tối thiểu 5 USD/tháng cho một tài khoản (đã gồm hạn mức D1 lớn hơn); file vượt 10 GB tính 0,015 USD/GB/tháng. <b>Với quy mô này, nếu cần tính năng nâng cao và tự động hóa hoàn toàn</b> (giao việc, quản lý dự án, giao tiếp nội bộ, phê duyệt nhiều cấp…), <b>nên cân nhắc phần mềm ERP / quản trị nhân sự trả phí</b>; công cụ này hướng tới doanh nghiệp nhỏ, gọn, miễn phí.</li>' +
      '<li><b>Tên miền:</b> dùng địa chỉ miễn phí dạng <span class="mono">…workers.dev</span> được ngay. Gắn tên miền riêng (vd <span class="mono">chamcong.tencongty.vn</span>): công ty <b>đã có tên miền</b> → không tốn thêm (tên miền cần quản lý DNS tại Cloudflare, gói Free); <b>chưa có</b> → phí mua và gia hạn tên miền theo báo giá nhà đăng ký.</li>' +
      '<li class="faint">Giới hạn gói Free, giá gói trả phí theo trang giá của Cloudflare (developers.cloudflare.com → Workers / D1 / R2 → Pricing), kiểm tra ngày 07–08/11/2026; Cloudflare có thể thay đổi. Một số hướng dẫn bên ngoài cho biết khi bật R2 có thể phải khai báo phương thức thanh toán dù dùng gói miễn phí – sẽ kiểm chứng khi lắp đặt thật. Kho file hồ sơ trên R2 là thiết kế dự kiến cho bản chính thức (hiện file scan lưu trong trình duyệt). Số liệu sử dụng là ước tính của Quản trị tử tế, sẽ đo lại khi chạy thật.</li></ul></div>';
  }
