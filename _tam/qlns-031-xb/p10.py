N='cong-cu/quan-ly-nhan-su/nguon/'
NEWF = r"""  // Kịch bản thử: 2 dòng × 3 bước; mỗi bước: thiết bị · mở trang (nút Mở ngay) · các bước · kết quả cần thấy (anh 08/11 15:16)
  function wfSteps() {
    var D = WF_DEMO, S6 = [
      { t: 'Thiết lập Wi‑Fi văn phòng', dev: 'Máy tính đang bắt Wi‑Fi', ic: 'pc', open: ['Trang quản lý', D + '/quan-ly'], st: ['Bấm tab <b>Thiết lập mạng Wi‑Fi</b> (tab đầu tiên)', 'Bấm <b>Thêm IP của máy này</b>'], res: 'Wi‑Fi đang dùng được ghi là mạng văn phòng' },
      { t: 'Đăng nhập trang nhân viên', dev: 'Điện thoại bắt cùng Wi‑Fi', ic: 'phone', open: ['Trang nhân viên', D + '/'], hint: 'hoặc quét mã QR ở thẻ 2 bằng camera', st: ['Chọn một nhân sự mẫu – mã NV và PIN tự điền', 'Bấm <b>Đăng nhập</b>'], res: 'Hiện chấm xanh "Đang ở mạng văn phòng"' },
      { t: 'Chấm vào ca', dev: 'Điện thoại – vẫn bắt Wi‑Fi', ic: 'phone', st: ['Bấm nút lớn <b>Vào ca</b>'], res: 'Báo "Đã chấm vào ca lúc … (Wi‑Fi)"' },
      { t: 'Thử chấm khi không ở văn phòng', dev: 'Điện thoại – tắt Wi‑Fi, dùng 4G', ic: 'phone', st: ['Tắt Wi‑Fi trên điện thoại', 'Bấm <b>Kiểm tra lại mạng</b>', 'Bấm <b>Ra ca</b>'], res: 'Bị từ chối – ở nhà, ở ngoài không chấm được', bad: 1 },
      { t: 'Chấm ra ca', dev: 'Điện thoại – bật lại Wi‑Fi', ic: 'phone', st: ['Bật lại Wi‑Fi văn phòng', 'Bấm <b>Kiểm tra lại mạng</b>', 'Bấm <b>Ra ca</b>'], res: 'Báo "Đã chấm ra ca lúc … (Wi‑Fi)"' },
      { t: 'Xem lượt chấm trong phần mềm', dev: 'Máy tính – phần mềm này', ic: 'pc', open: ['Tổng hợp công', '#cc', 1], st: ['Bấm <b>Lấy dữ liệu thử về</b> (ngay dưới sơ đồ này)', 'Mở <b>Tổng hợp công</b>, xem cột hôm nay'], res: 'Giờ vào – ra của nhân sự vừa thử đã vào bảng công' }];
    var IC = { pc: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>', phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>' };
    return '<div class="wf-steps">' + S6.map(function (x, i) {
      return '<div class="wf-st"><div class="wf-sth"><span class="wf-n">' + (i + 1) + '</span><b>' + x.t + '</b></div>' +
        '<div class="wf-dev ' + x.ic + '">' + IC[x.ic] + '<span>' + x.dev + '</span></div>' +
        '<div class="wf-sec"><small>Mở trang</small>' + (x.open ? '<a class="btn btn-sm' + (x.open[2] ? '' : ' btn-primary') + '" href="' + x.open[1] + '"' + (x.open[2] ? '' : ' target="_blank" rel="noopener"') + '>Mở ngay: ' + x.open[0] + (x.open[2] ? '' : ' ' + ic('ext', 13)) + '</a>' + (x.hint ? '<i>' + x.hint + '</i>' : '') : '<span class="wf-same">Đang ở trang nhân viên từ bước trước</span>') + '</div>' +
        '<div class="wf-sec"><small>Các bước</small><ol>' + x.st.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></div>' +
        '<div class="wf-sec res"><small>Kết quả cần thấy</small><em class="wf-res' + (x.bad ? ' bad' : '') + '">' + (x.bad ? '✕ ' : '✓ ') + x.res + '</em></div></div>';
    }).join('') + '</div>' +
      '<p class="wf-more"><b>Dự phòng:</b> Wi‑Fi văn phòng lỗi → nhân viên quét <b>Mã QR chấm công</b> (thẻ 3) để chấm. <b>Thử thêm:</b> gửi đơn nghỉ trên điện thoại → duyệt ở <a href="#np">Nghỉ phép</a> → điện thoại thấy "Đã duyệt".</p>';
  }
"""
CSS = """.wf-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 26px}
.wf-st{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:9px;min-width:0}
.wf-st:not(:nth-child(3n))::after{content:"→";position:absolute;right:-20px;top:50%;transform:translateY(-50%);color:var(--muted);font-weight:700;font-size:17px}
.wf-sth{display:flex;align-items:center;gap:8px}.wf-sth b{font-size:14.5px;line-height:1.3}
.wf-dev{display:flex;align-items:center;gap:7px;font-weight:700;font-size:13px;border-radius:9px;padding:6px 9px;background:var(--pri-soft);color:var(--pri-ink,var(--pri))}
.wf-dev.phone{background:#FFF1D6;color:#8A5300}
.wf-sec small{display:block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.wf-sec .btn{white-space:normal;text-align:left}.wf-sec i{display:block;font-size:12px;color:var(--ink-2);margin-top:4px}
.wf-same{font-size:12.5px;color:var(--ink-2)}
.wf-sec ol{margin:0;padding-left:18px;font-size:13px;line-height:1.5;color:var(--ink-2)}
.wf-sec.res{margin-top:auto}
.wf-res{display:block;font-style:normal;font-size:12.5px;font-weight:600;color:var(--ok-ink,#1E6B45);background:var(--ok-soft,#E3F3EA);border-radius:8px;padding:6px 9px;line-height:1.4}
.wf-res.bad{color:var(--danger,#B42318);background:var(--danger-soft,#FDECEA)}
.wf-more{margin:12px 0 0;font-size:13px;color:var(--ink-2)}
.wf-tc.backup{background:var(--surface-2);border-style:dashed}
@media (max-width:1000px){.wf-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.wf-st:not(:nth-child(3n))::after{content:none}}
@media (max-width:640px){.wf-steps{grid-template-columns:1fr}}
"""
for d in ('src','_ban-0.3.1'):
    p=N+d+'/chamcong.js'; s=open(p,encoding='utf-8').read()
    a=s.index('  // Kịch bản thử dạng sơ đồ ngang'); b=s.index('  PAGES.ccwifi = function () {')
    s=s[:a]+NEWF+s[b:]
    open(p,'w',encoding='utf-8').write(s)
    p=N+d+'/ui.html'; s=open(p,encoding='utf-8').read()
    a=s.index('.wf-steps{'); b=s.index('.wf-cf-note{margin:0 0 14px}')
    s=s[:a]+CSS+s[b:]
    open(p,'w',encoding='utf-8').write(s)
print('ok')
