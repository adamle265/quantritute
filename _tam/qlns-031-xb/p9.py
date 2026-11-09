import sys
N='cong-cu/quan-ly-nhan-su/nguon/'
def rep(s,a,b):
    assert s.count(a)==1,(s.count(a),a[:90]); return s.replace(a,b)
for d in ('src','_ban-0.3.1'):
    p=N+d+'/chamcong.js'; s=open(p,encoding='utf-8').read()
    i=s.index("      var T = [['nv', 'Trang nhân viên'"); j=s.index("      var last = smp.map(")
    s=s[:i]+"""      // 08/11 15:10 anh: Trang quản lý đứng trước (thiết lập Wi‑Fi rồi mới chấm được); tính năng chính là chấm bằng Wi‑Fi, Mã QR chỉ là dự phòng
      var T = [['ql', 'Trang quản lý', 'Làm <b>trước tiên</b>: khai báo Wi‑Fi văn phòng để máy chủ nhận ra ai đang ở văn phòng. Sau đó xem tổng hợp lượt chấm, lượt bị từ chối, máy dùng chung, tài khoản nhân viên.', 'Mở trên máy tính đang bắt Wi‑Fi → tab đầu tiên <b>Thiết lập mạng Wi‑Fi</b> → <b>Thêm IP của máy này</b>.', '/quan-ly', 'Mở Trang quản lý'],
        ['nv', 'Trang nhân viên', 'Nhân viên mở trên điện thoại, bắt Wi‑Fi văn phòng là bấm <b>Vào ca / Ra ca</b> được ngay. Xem bảng chấm công các tháng, phiếu lương, phép, gửi đơn nghỉ, xác nhận công.', 'Điện thoại bắt cùng Wi‑Fi → quét mã QR bên cạnh → chọn nhân sự mẫu (mã NV và PIN tự điền) → Đăng nhập → <b>Vào ca</b>.', '/', 'Mở Trang nhân viên'],
        ['tram', 'Mã QR chấm công', '<span class="tag tag-mute">Dự phòng</span> Chỉ dùng khi điện thoại nhân viên không bắt được Wi‑Fi văn phòng (Wi‑Fi lỗi, quá tải, ở xa bộ phát): mở trên một thiết bị cố định ở văn phòng, nhân viên quét mã đổi mỗi 30 giây để chấm.', 'Tắt Wi‑Fi điện thoại, quét mã trên trang này rồi bấm Ra ca.', '/tram', 'Mở Mã QR chấm công']];
"""+s[j:]
    s=rep(s,"'<a class=\"btn' + (t[0] === 'nv' ? ' btn-primary' : '') + '\" href=\"' + D + t[4]","'<a class=\"btn' + (t[0] !== 'tram' ? ' btn-primary' : '') + '\" href=\"' + D + t[4]")
    s=rep(s,"T.map(function (t, i) { return '<div class=\"wf-tc\">","T.map(function (t, i) { return '<div class=\"wf-tc' + (t[0] === 'tram' ? ' backup' : '') + '\">")
    i=s.index("        '<h4 class=\"wf-h4\">Kịch bản thử 5 phút</h4><ol class=\"wf-s5\">"); j=s.index("        (smp.length ? '<div class=\"wf-flow\">")
    s=s[:i]+"""        '<h4 class="wf-h4">Kịch bản thử 5 phút – chấm công bằng Wi‑Fi</h4>' + wfSteps() +
"""+s[j:]
    s=rep(s,"  PAGES.ccwifi = function () {","""  // Kịch bản thử dạng sơ đồ ngang (điện thoại: xếp dọc)
  function wfSteps() {
    var S5 = [['Trang quản lý', 'Máy tính đang bắt Wi‑Fi: <b>Thiết lập mạng Wi‑Fi</b> → <b>Thêm IP của máy này</b>', 'Wi‑Fi này thành mạng văn phòng', ''],
      ['Mở Trang nhân viên', 'Điện thoại bắt <b>cùng Wi‑Fi</b>, quét mã QR ở thẻ 2 → chọn nhân sự → Đăng nhập', 'Hiện "Đang ở mạng văn phòng"', ''],
      ['Bấm Vào ca', 'Một chạm, không cần máy chấm công', 'Đã chấm vào ca (Wi‑Fi)', ''],
      ['Tắt Wi‑Fi, bấm Ra ca', 'Dùng 4G như khi đang ở nhà', 'Bị từ chối – không chấm từ xa được', 'bad'],
      ['Bật lại Wi‑Fi, bấm Ra ca', 'Đang ở văn phòng thì chấm bình thường', 'Đã chấm ra ca (Wi‑Fi)', ''],
      ['Xem trong phần mềm', 'Bấm <b>Lấy dữ liệu thử về</b> → <a href="#cc">Tổng hợp công</a>, cột hôm nay', 'Giờ vào – ra đã vào bảng công', '']];
    return '<div class="wf-steps">' + S5.map(function (x, i) { return '<div class="wf-st"><div class="wf-sth"><span class="wf-n">' + (i + 1) + '</span><b>' + x[0] + '</b></div><small>' + x[1] + '</small><em class="wf-res' + (x[3] ? ' bad' : '') + '">' + (x[3] ? '✕ ' : '✓ ') + x[2] + '</em></div>'; }).join('<span class="wf-ar" aria-hidden="true">→</span>') + '</div>' +
      '<p class="wf-more"><b>Dự phòng:</b> Wi‑Fi văn phòng lỗi → nhân viên quét <b>Mã QR chấm công</b> (thẻ 3) để chấm. <b>Thử thêm:</b> gửi đơn nghỉ trên điện thoại → duyệt ở <a href="#np">Nghỉ phép</a> → điện thoại thấy "Đã duyệt".</p>';
  }
  PAGES.ccwifi = function () {""")
    s=rep(s,"'<span class=\"tag tag-warn\">Có thể từ 5 USD</span>'","'<span class=\"tag tag-warn\">5 USD/tháng</span>'")
    s=rep(s,"<b>Trên 200 người:</b> số dòng đọc vượt 5 triệu/ngày khi trang Mã QR chấm công bật cả ngày → dùng gói Workers Paid, tối thiểu 5 USD/tháng cho một tài khoản (đã gồm hạn mức D1 lớn hơn); file vượt 10 GB tính 0,015 USD/GB/tháng.",
            "<b>Trên 200 người – chi phí dự kiến 5 USD/tháng:</b> số dòng đọc vượt 5 triệu/ngày khi trang Mã QR chấm công bật cả ngày → dùng gói Workers Paid, giá 5 USD/tháng cho một tài khoản (đã gồm hạn mức D1 lớn hơn); chỉ khi file scan vượt 10 GB mới tính thêm 0,015 USD/GB/tháng.")
    open(p,'w',encoding='utf-8').write(s)
    p=N+d+'/ui.html'; s=open(p,encoding='utf-8').read()
    a=".wf-cf-note{margin:0 0 14px}"
    s=rep(s,a,""".wf-steps{display:flex;align-items:stretch;gap:6px;overflow-x:auto;padding-bottom:4px}
.wf-st{flex:1 1 0;min-width:140px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 11px;display:flex;flex-direction:column;gap:5px}
.wf-sth{display:flex;align-items:center;gap:7px}.wf-sth b{font-size:13.5px;line-height:1.3}
.wf-st small{font-size:12.5px;color:var(--ink-2);line-height:1.45}
.wf-res{margin-top:auto;font-style:normal;font-size:12px;font-weight:600;color:var(--ok-ink,#1E6B45);background:var(--ok-soft,#E3F3EA);border-radius:8px;padding:5px 8px;line-height:1.35}
.wf-res.bad{color:var(--danger,#B42318);background:var(--danger-soft,#FDECEA)}
.wf-ar{align-self:center;color:var(--muted);font-weight:700;font-size:18px;flex:none}
.wf-more{margin:10px 0 0;font-size:13px;color:var(--ink-2)}
.wf-tc.backup{background:var(--surface-2);border-style:dashed}
@media (max-width:900px){.wf-steps{flex-direction:column}.wf-ar{transform:rotate(90deg);margin:-2px auto}}
"""+a)
    open(p,'w',encoding='utf-8').write(s)
    p=N+d+'/app.js'; s=open(p,encoding='utf-8').read()
    s=rep(s,"theme: 'auto', color: 'ngoc', pick:","theme: 'auto', color: 'reu', pick:")
    s=rep(s,"return COLORS.some(function (x) { return x.k === c && c !== 'dark'; }) ? c : 'ngoc'; }","return COLORS.some(function (x) { return x.k === c && c !== 'dark'; }) ? c : 'reu'; }")
    s=rep(s,"S.settings.refMode = 'today'; /* 08/11 anh:","if (S.settings.colorV !== 2) { S.settings.color = 'reu'; S.settings.colorV = 2; } /* 08/11 15:10 anh: màu mặc định Xanh rêu (đổi 1 lần cho máy đã lưu màu cũ) */ S.settings.refMode = 'today'; /* 08/11 anh:")
    open(p,'w',encoding='utf-8').write(s)
print('ok')
