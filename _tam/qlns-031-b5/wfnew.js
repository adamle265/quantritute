  /* ----- 07/11 17:42: BẢN THỬ – dữ liệu mẫu lấy lượt chấm, đơn nghỉ từ máy chủ bản thử (API công khai /api/demo/*, không cần mã kết nối) ----- */
  var WF_DEMO_AT = 0, WF_IMG = /*@@WFIMG@@*/null;
  function wfDemoOn(u) { return !!(u && u.source === 'sample' && !wfOn(u)); }
  function wfDemoGet(path, body) {
    return fetch(WF_DEMO + '/api/demo/' + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined)
      .then(function (r) { return r.json(); }, function () { throw new Error('Không kết nối được máy chủ bản thử – kiểm tra mạng Internet.'); })
      .then(function (j) { if (!j.ok) throw new Error(j.loi || 'Máy chủ bản thử báo lỗi'); return j; });
  }
  function wfDemoPull(force) {
    var us = S.units.filter(wfDemoOn); if (!us.length) return Promise.resolve(null);
    if (!force && Date.now() - WF_DEMO_AT < 60e3) return Promise.resolve(null); WF_DEMO_AT = Date.now();
    var today = HR.isoToday(), from = ccAdd(today, -13);
    return Promise.all([wfDemoGet('cham?tu=' + from + '&den=' + today), wfDemoGet('don')]).then(function (rs) {
      var res = { cham: 0, don: 0, kq: 0 };
      us.forEach(function (u) {
        var nv = nvIndex(u), w = u.wf = u.wf || {}, by = {}, local = {}, edited = false; w.punches = w.punches || {};
        var mine = rs[0].list.filter(function (x) { return nv[x.ma]; });
        mine.forEach(function (x) { var k = wfIso(x.t).slice(0, 7); (by[k] = by[k] || []).push(x); });
        [from.slice(0, 7), today.slice(0, 7)].forEach(function (k) { w.punches[k] = by[k] || []; }); res.cham += mine.length;
        (u.data.DON || []).forEach(function (d) { local[String(d['Số đơn'])] = d; });
        rs[1].list.forEach(function (x) {
          var e = nv[x.ma], d = local[x.so]; if (!e) return;
          if (!d) { editRow(u, 'DON', x.so, { 'Số đơn': x.so, 'Ngày tạo đơn': wfIso(x.tao), 'Mã NV': x.ma, 'Họ và tên': e['Họ và tên'] || x.ma, 'Phòng ban': e['Phòng ban'] || '', 'Loại nghỉ': x.loai, 'Từ ngày': x.tu, 'Đến ngày': x.den, 'Số ngày': npWorkDays(u, e, x.tu, x.den), 'Lý do': x.ly_do || '', 'Người duyệt': x.nguoi_duyet || '', 'Trạng thái': x.trang_thai, 'Ngày duyệt': x.ngay_duyet || '', 'Nguồn': 'Điện thoại' }, 'nhận đơn ' + x.so + ' gửi trên điện thoại (bản thử)'); res.don++; edited = true; }
          else if (d['Trạng thái'] === 'Chờ duyệt' && x.trang_thai !== 'Chờ duyệt') { editRow(u, 'DON', x.so, { 'Trạng thái': x.trang_thai, 'Người duyệt': x.nguoi_duyet || '', 'Ngày duyệt': x.ngay_duyet || '', 'Lý do từ chối': x.ly_do_tc || '' }, 'đơn ' + x.so + ' đã được xử lý ở máy khác (bản thử)'); edited = true; }
          else if ((d['Trạng thái'] === 'Đã duyệt' || d['Trạng thái'] === 'Từ chối') && x.trang_thai === 'Chờ duyệt') { res.kq++; wfPushDon(u, d); }
        });
        if (edited) ACACHE.key = null;
        w.demoAt = nowVn(); bcX(u).v++; u._bc = {}; u._ccd = null;
      });
      saveUnits(); return res;
    });
  }
  function wfDemoAuto() { wfDemoPull(false).then(function (r) { if (r && (r.cham || r.don)) render(); }, function () { }); }
  /* ----- Trang Chấm công Wi‑Fi ----- */
  function wfCardReal(u) {
    var w = u.wf || {}, on = wfOn(u), ppl = wfPeople(u), noAcc = (u.data.NV || []).filter(function (e) { var ac = (u.acc || {})[e['Mã NV']]; return (!ac || ac.st === 'none') && HR.staffState(e, HR.isoToday(), HR.maternitySet(u.data, HR.isoToday())) !== 'left'; }).length;
    if (!on) return '<div class="card card-pad wf-card"><div class="card-head"><div><h3>' + esc(shortUnit(u.name)) + '</h3><p>Chưa kết nối máy chủ chấm công riêng của công ty</p></div><span class="tag tag-mute">Chưa kết nối</span></div>' +
      '<div class="notice warn">' + ic('info') + '<div><b>Chỉ thực hiện khi phần mềm hoàn thiện và chính thức phát hành bản đầy đủ.</b> Trong lúc chờ, anh/chị trải nghiệm bằng bản thử ở trên với dữ liệu mẫu.</div></div>' +
      '<div class="link-row" style="margin-top:10px"><button class="btn" data-act="wf-guide">' + ic('info', 15) + 'Xem hướng dẫn thiết lập riêng cho công ty</button></div></div>';
    var today = HR.isoToday(), mp = wfMap(u, today.slice(0, 7)), nv = nvIndex(u), tlist = Object.keys(mp).filter(function (k) { return mp[k].iso === today; }).map(function (k) { return { ma: k.split('|')[0], r: mp[k] }; });
    var lastLock = Object.keys(w.sent || {}).sort().pop(), xn = lastLock && w.cong && w.cong[lastLock], xnN = 0, xnBad = 0, xnT = 0; if (xn) Object.keys(xn).forEach(function (k) { xnT++; if (xn[k].xn === 1) xnN++; else if (xn[k].xn === 2) xnBad++; });
    return '<div class="card card-pad wf-card on"><div class="card-head"><div><h3>' + esc(shortUnit(u.name)) + '</h3><p>' + esc(w.url) + (w.ten ? ' · máy chủ “' + esc(w.ten) + '”' : '') + (w.ver ? ' · bản ' + esc(w.ver) : '') + '</p></div><span class="tag tag-ok">Đã kết nối</span></div>' +
      '<div class="org-kpi wf-k"><div><b>' + ppl.filter(function (x) { return x.active; }).length + '</b><span>tài khoản đang dùng</span></div><div class="' + ((w.noPin || []).length ? 'k-warn' : '') + '"><b>' + (w.noPin || []).length + '</b><span>chưa có PIN trên máy chủ</span></div><div><b>' + tlist.length + '</b><span>người đã chấm hôm nay</span></div>' +
      '<div><b>' + (xn ? xnN + '/' + xnT : '–') + '</b><span>' + (lastLock ? 'xác nhận công T' + lastLock.slice(5) : 'xác nhận công') + (xnBad ? ' · <b class="down">' + xnBad + ' báo sai</b>' : '') + '</span></div></div>' +
      ((w.noPin || []).length ? '<div class="notice warn">' + ic('info') + '<div>Chưa có mã PIN trên máy chủ: <b>' + esc(w.noPin.join(', ')) + '</b>. Vào <a href="#nv">Danh sách nhân sự</a> → bấm ô Tài khoản → <b>Đặt lại PIN</b>; phần mềm tự gửi PIN mới lên máy chủ (PIN cũ chỉ lưu dạng mã hóa nên không gửi lại được).</div></div>' : '') +
      (noAcc ? '<p class="faint" style="font-size:12.5px;margin:8px 0 0">' + noAcc + ' người đang làm chưa được cấp tài khoản nhân viên – cấp ở Danh sách nhân sự để họ chấm công trên điện thoại.</p>' : '') +
      '<div class="link-row" style="margin-top:12px"><button class="btn btn-primary" data-act="wf-sync" data-id="' + u.id + '">' + ic('refresh', 15) + 'Đồng bộ ngay</button><a class="btn" href="' + esc(w.url.replace(/\/+$/, '')) + '/quan-ly" target="_blank" rel="noopener">Trang quản lý máy chủ ' + ic('ext', 14) + '</a><button class="btn" data-act="wf-off" data-id="' + u.id + '">Ngắt kết nối</button><span class="faint" style="font-size:12.5px">' + (w.at ? 'Đồng bộ lần cuối ' + esc(w.at) : 'Chưa đồng bộ') + '</span></div>' +
      '<div class="wf-cols"><div><h4>Hôm nay ' + HR.vnDate(today) + '</h4>' + wfTodayTbl([u]) + '</div>' +
      '<div><h4>Nhật ký đồng bộ</h4><ol class="wf-log">' + (w.log || []).slice(0, 8).map(function (l) { return '<li class="' + (l.ok ? '' : 'bad') + '"><span class="faint mono">' + esc(l.at) + '</span> ' + esc(l.txt) + '</li>'; }).join('') + '</ol></div></div></div>';
  }
  function wfTodayTbl(us) {
    var today = HR.isoToday(), rows = [];
    us.forEach(function (u) { var mp = wfMap(u, today.slice(0, 7)), nv = nvIndex(u); Object.keys(mp).forEach(function (k) { if (mp[k].iso === today) rows.push({ u: u, ma: k.split('|')[0], e: nv[k.split('|')[0]] || {}, r: mp[k] }); }); });
    if (!rows.length) return '<p class="muted">Chưa có lượt chấm hôm nay' + (us.some(wfDemoOn) ? ' trên bản thử. Làm theo kịch bản thử ở trên rồi bấm <b>Lấy dữ liệu thử về</b>.' : ' (theo lần đồng bộ cuối).') + '</p>';
    return '<div class="tbl-wrap"><table class="tbl wf-t"><thead><tr><th>Nhân sự</th>' + (us.length > 1 ? '<th>Công ty</th>' : '') + '<th>Vào</th><th>Ra</th><th>Cách chấm</th></tr></thead><tbody>' + rows.sort(function (a, b) { return a.r.tin < b.r.tin ? -1 : 1; }).map(function (x) { return '<tr><td>' + esc(x.e['Họ và tên'] || x.ma) + ' <span class="faint mono">' + esc(x.ma) + '</span></td>' + (us.length > 1 ? '<td>' + esc(shortUnit(x.u.name)) + '</td>' : '') + '<td class="mono">' + esc(x.r.tin || '–') + '</td><td class="mono">' + esc(x.r.tout || '–') + '</td><td>' + Object.keys(x.r.cach).map(function (c) { return WF_CACH[c] || c; }).join(', ') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  // Chi phí máy chủ chấm công dự kiến (gói Free của Cloudflare) – giới hạn lấy từ trang giá Cloudflare, kiểm tra 07/11/2026
  function wfCostCard() {
    var N = [10, 30, 50, 100, 200], LIM = { req: 100000, rd: 5000000, st: 5120 };
    function nf(v) { return Math.round(v).toLocaleString('vi-VN'); }
    function pc(v, l) { var x = v / l * 100; return x < 1 ? '<1%' : Math.round(x) + '%'; }
    var rows = N.map(function (n) { var req = 3600 + 15 * n, rd = 3600 * (5 * n + 25) + 500 * n, mb = 2 * n * 260 * 0.4 / 1024; return '<tr><td><b>' + n + ' người</b></td><td class="num">' + nf(req) + ' <span class="faint">(' + pc(req, LIM.req) + ')</span></td><td class="num">' + nf(rd) + ' <span class="faint">(' + pc(rd, LIM.rd) + ')</span></td><td class="num">' + (mb < 1 ? 'dưới 1 MB' : '≈ ' + nf(mb) + ' MB') + '</td><td><span class="tag tag-ok">0 đ</span></td></tr>'; }).join('');
    return '<div class="card card-pad wf-cost"><div class="card-head"><div><h3>Chi phí máy chủ chấm công dự kiến</h3><p>Máy chủ chạy trên tài khoản Cloudflare riêng của công ty, gói <b>Free</b> (Workers + cơ sở dữ liệu D1). Bảng dưới là <b>ước tính</b> mức dùng mỗi ngày so với giới hạn miễn phí.</p></div><span class="tag tag-ok">Miễn phí đến khoảng 200 người</span></div>' +
      '<div class="tbl-wrap"><table class="tbl wf-ct"><thead><tr><th>Quy mô</th><th>Lượt gọi máy chủ/ngày</th><th>Dòng dữ liệu đọc/ngày</th><th>Dữ liệu sau 1 năm</th><th>Chi phí/tháng</th></tr></thead><tbody>' + rows +
      '<tr class="lim"><td>Giới hạn gói Free</td><td class="num">100.000/ngày</td><td class="num">5 triệu/ngày</td><td class="num">5 GB</td><td>0 đ</td></tr></tbody></table></div>' +
      '<ul class="wf-note"><li><b>Giả định:</b> 1 Màn hình chung mở 8 giờ/ngày (tự làm mới 8 giây/lần – phần tốn nhiều nhất), mỗi người chấm 2 lượt/ngày, mở trang nhân viên vài lần, 260 ngày làm việc/năm. Ghi dữ liệu mỗi ngày chỉ vài nghìn dòng, rất xa giới hạn 100.000 dòng.</li>' +
      '<li><b>Trên khoảng 250 người</b> (màn hình chung bật cả ngày): số dòng đọc tiến gần 5 triệu/ngày – bản sau sẽ giảm tần suất làm mới; hoặc dùng gói Workers Paid, tối thiểu 5 USD/tháng cho một tài khoản.</li>' +
      '<li><b>Tên miền:</b> dùng địa chỉ miễn phí dạng <span class="mono">…workers.dev</span> được ngay. Muốn gắn tên miền riêng (vd <span class="mono">chamcong.tencongty.vn</span>): công ty <b>đã có tên miền</b> → không tốn thêm (tên miền cần quản lý DNS tại Cloudflare, gói Free); <b>chưa có</b> → phí mua và gia hạn tên miền theo báo giá nhà đăng ký.</li>' +
      '<li class="faint">Giới hạn gói Free, gói trả phí theo trang giá của Cloudflare (developers.cloudflare.com → Workers / D1 → Pricing), kiểm tra ngày 07/11/2026; Cloudflare có thể thay đổi. Số liệu sử dụng là ước tính của Quản trị tử tế, sẽ đo lại khi chạy thật.</li></ul></div>';
  }
  PAGES.ccwifi = function () {
    var web = /quantritute/.test(location.hostname), us = selUnits().length ? selUnits() : S.units;
    var smp = us.filter(wfDemoOn), real = us.filter(function (u) { return !wfDemoOn(u); }), demo = web || smp.length > 0, D = WF_DEMO;
    var head = pageHead('Chấm công Wi‑Fi', 'Nhân viên bấm <b>Vào ca / Ra ca</b> trên điện thoại khi bắt Wi‑Fi văn phòng; Wi‑Fi lỗi thì quét mã QR ở Màn hình chung. Lượt chấm, đơn nghỉ gửi từ điện thoại đổ về <a href="#cc">Tổng hợp công</a>, <a href="#np">Nghỉ phép</a>; công đã chốt gửi ngược lên điện thoại để nhân viên xác nhận.',
      '<button class="btn" data-act="wf-guide">' + ic('info', 15) + 'Hướng dẫn thiết lập riêng cho công ty</button>');
    var h = head;
    if (demo) {
      var T = [['ql', 'Trang quản lý', 'Cho kế toán, nhân sự: ai đã chấm, chấm bằng Wi‑Fi hay QR, lượt bị từ chối, khai báo Wi‑Fi văn phòng, tài khoản nhân viên.', 'Tab <b>Mạng văn phòng</b> → <b>Thêm IP của máy này</b> để Wi‑Fi anh/chị đang dùng được coi là Wi‑Fi văn phòng.', '/quan-ly', 'Mở Trang quản lý'],
        ['tram', 'Màn hình chung QR', 'Một máy đặt cố định ở văn phòng luôn mở trang này: báo IP Wi‑Fi văn phòng cho máy chủ, hiện mã QR đổi mỗi 30 giây để quét khi Wi‑Fi lỗi.', 'Mở trên máy tính đang bắt Wi‑Fi – IP tự được ghi. Để trang này mở khi thử trên điện thoại.', '/tram', 'Mở Màn hình chung'],
        ['nv', 'Trang nhân viên', 'Nhân viên mở trên điện thoại: chấm Vào ca / Ra ca, xem công, phiếu lương, phép, gửi đơn nghỉ, xác nhận công tháng.', 'Quét mã QR bên cạnh bằng điện thoại → chọn nhân sự mẫu (mã NV và PIN tự điền) → Đăng nhập.', '/', 'Mở Trang nhân viên']];
      var last = smp.map(function (u) { return u.wf && u.wf.demoAt; }).filter(Boolean).sort().pop(), nP = 0, nD = 0;
      smp.forEach(function (u) { Object.keys((u.wf || {}).punches || {}).forEach(function (k) { nP += u.wf.punches[k].length; }); nD += (u.data.DON || []).filter(function (d) { return d['Nguồn'] === 'Điện thoại'; }).length; });
      h += '<div class="card card-pad wf-demo"><div class="wf-demo-h">' + ic('ccwifi', 22) + '<div><h3>Trải nghiệm chấm công thật trên điện thoại – bản thử</h3><p>Máy chủ bản thử <span class="mono">' + esc(D.replace(/^https:\/\//, '')) + '</span> dùng <b>dữ liệu mẫu hư cấu</b>, có sẵn tài khoản cho từng nhân sự mẫu, không cần mật khẩu. Bản thử dùng chung: lượt chấm của mọi người đang thử đều hiện ở đây.</p></div></div>' +
        '<div class="wf-try">' + T.map(function (t, i) { return '<div class="wf-tc"><div class="wf-th"><span class="wf-n">' + (i + 1) + '</span><h4>' + t[1] + '</h4></div><p>' + t[2] + '</p><p class="wf-do"><b>Thử:</b> ' + t[3] + '</p>' + (t[0] === 'nv' ? '<div class="wf-qr"><img src="' + D + '/api/demo/qr?u=nv" alt="Mã QR mở Trang nhân viên" loading="lazy" onerror="this.parentNode.style.display=\'none\'"><span>Quét bằng camera điện thoại<br><b class="mono">' + esc(D.replace(/^https:\/\//, '')) + '</b></span></div>' : '') + '<a class="btn' + (t[0] === 'nv' ? ' btn-primary' : '') + '" href="' + D + t[4] + '" target="_blank" rel="noopener">' + t[5] + ' ' + ic('ext', 14) + '</a></div>'; }).join('') + '</div>' +
        '<h4 class="wf-h4">Kịch bản thử 5 phút</h4><ol class="wf-s5">' + ['Mở <b>Màn hình chung</b> trên máy tính đang bắt Wi‑Fi (máy chủ ghi Wi‑Fi đó là mạng văn phòng).', 'Điện thoại bắt <b>cùng Wi‑Fi</b> → quét mã QR ở thẻ Trang nhân viên → chọn nhân sự → Đăng nhập → bấm <b>Vào ca</b> → nhận bằng Wi‑Fi.', '<b>Tắt Wi‑Fi</b> điện thoại (dùng 4G) → bấm <b>Ra ca</b> → bị từ chối (xem ở Trang quản lý → Bị từ chối).', 'Vẫn 4G, mở camera quét mã QR trên <b>Màn hình chung</b> → bấm <b>Ra ca</b> → được nhận bằng QR.', 'Gửi thử một <b>đơn nghỉ</b> trên điện thoại → quay lại đây bấm <b>Lấy dữ liệu thử về</b> → xem cột hôm nay ở <a href="#cc">Tổng hợp công</a>, duyệt đơn ở <a href="#np">Nghỉ phép</a> → điện thoại thấy "Đã duyệt".'].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
        (smp.length ? '<div class="wf-flow"><div><b>Dữ liệu thử đã lấy về:</b> ' + nP + ' lượt chấm (14 ngày gần nhất) · ' + nD + ' đơn gửi từ điện thoại' + (last ? ' · lúc ' + esc(last) : '') + '</div><div class="link-row"><button class="btn btn-primary" data-act="wf-demo">' + ic('refresh', 15) + 'Lấy dữ liệu thử về</button><a class="btn" href="#cc">Tổng hợp công</a><a class="btn" href="#np">Nghỉ phép</a></div></div>' +
          '<h4 class="wf-h4">Hôm nay ' + HR.vnDate(HR.isoToday()) + ' trên bản thử</h4>' + wfTodayTbl(smp) : '<p class="muted" style="margin:10px 0 0">Nạp <b>dữ liệu mẫu</b> để lượt chấm trên bản thử tự đổ về Tổng hợp công, Nghỉ phép.</p>') + '</div>';
    }
    h += real.map(wfCardReal).join('');
    h += wfCostCard();
    return h;
  };
  BINDS.ccwifi = function () { if (S.units.some(wfDemoOn)) wfDemoAuto(); };
  ACTS['wf-demo'] = function (a) { a.disabled = true; wfDemoPull(true).then(function (r) { toast('Đã lấy dữ liệu từ bản thử', 'ok', r ? r.cham + ' lượt chấm · ' + r.don + ' đơn mới' : ''); render(); }, function (er) { toast('Chưa lấy được dữ liệu thử', 'err', er.message); render(); }); };
  ACTS['wf-guide'] = function () {
    var I = WF_IMG || {}, img = function (k, cap) { return I[k] ? '<figure class="wf-fig"><img src="' + I[k] + '" alt="' + esc(cap) + '"><figcaption>' + cap + '</figcaption></figure>' : ''; };
    var un = S.units.filter(function (u) { return u.source !== 'sample' && !wfOn(u); });
    var form = un.length ? un.map(function (u) { var w = u.wf || {}; return '<div class="wf-cf"><b>' + esc(shortUnit(u.name)) + '</b><div class="grid wf-f"><div class="field"><label for="wU_' + u.id + '">Địa chỉ máy chủ chấm công</label><input class="input" id="wU_' + u.id + '" placeholder="https://chamcong.tencongty.com" value="' + esc(w.url || '') + '"></div><div class="field"><label for="wK_' + u.id + '">Mã kết nối</label><input class="input mono" id="wK_' + u.id + '" placeholder="QTT-…" autocomplete="off"></div></div><p id="wM_' + u.id + '" class="tl-msg"></p><button class="btn btn-primary" data-act="wf-con" data-id="' + u.id + '">Kết nối</button></div>'; }).join('') : '<p class="faint">Ô nhập địa chỉ máy chủ và mã kết nối hiện ở đây khi phần mềm đã nạp dữ liệu nhân sự thật của công ty (không áp dụng cho dữ liệu mẫu).</p>';
    var st = [['Tạo máy chủ chấm công riêng', 'Chạy bộ cài trên <b>tài khoản Cloudflare của công ty</b> (tệp <span class="mono">trien-khai.cmd</span> trong thư mục <span class="mono">cham-cong-thu</span>, có hướng dẫn kèm). Dữ liệu chấm công nằm ở tài khoản của công ty, không nằm ở máy chủ của Quản trị tử tế. Chi phí: xem bảng <b>Chi phí máy chủ chấm công dự kiến</b> ở trang Chấm công Wi‑Fi.', ''],
      ['Cài đặt lần đầu trên Trang quản lý', 'Mở <span class="mono">địa chỉ máy chủ/quan-ly</span>: đặt tên công ty, mã PIN quản lý (6–12 số, ghi nhớ – không lấy lại được). Trang quản lý có các tab Lượt chấm, Máy dùng chung, Nhân viên, Mạng văn phòng, Bị từ chối, Cài đặt.', img('ql', 'Trang quản lý của máy chủ chấm công')],
      ['Khai báo Wi‑Fi văn phòng', 'Đặt một thiết bị cố định ở văn phòng (máy tính, máy tính bảng, điện thoại cũ) mở <b>Màn hình chung</b> (<span class="mono">/tram</span>), nhập PIN quản lý để kích hoạt một lần. Màn hình tự báo IP Wi‑Fi văn phòng; router đổi IP thì tự cập nhật. Có thể thêm IP tay ở tab <b>Mạng văn phòng</b>.', img('ip', 'Tab Mạng văn phòng – IP được coi là Wi‑Fi văn phòng') + img('tram', 'Màn hình chung: mã QR đổi mỗi 30 giây, danh sách đã chấm hôm nay')],
      ['Tạo mã kết nối', 'Trang quản lý → <b>Cài đặt</b> → <b>Kết nối Phần mềm quản lý nhân sự</b> → <b>Tạo mã kết nối</b>. Chép ngay địa chỉ máy chủ và mã kết nối (mã chỉ hiện một lần).', img('key', 'Địa chỉ máy chủ và mã kết nối (ảnh minh họa, mã đã che)')],
      ['Kết nối ở phần mềm này', 'Dán địa chỉ máy chủ và mã kết nối rồi bấm Kết nối. Phần mềm đẩy danh sách nhân viên đã có tài khoản lên máy chủ.' + '<div class="wf-cfs">' + form + '</div>', ''],
      ['Cấp tài khoản, PIN cho nhân viên', 'Ở <a href="#nv" data-close>Danh sách nhân sự</a> → ô Tài khoản → Cấp tài khoản / Đặt lại PIN; PIN được gửi thẳng lên máy chủ. Nhân viên mở địa chỉ máy chủ trên điện thoại, đăng nhập bằng mã NV + PIN, ghim ra màn hình chính.', img('nv', 'Trang nhân viên trên điện thoại')],
      ['Hằng ngày, cuối tháng', 'Bấm <b>Đồng bộ ngay</b> để lấy lượt chấm, đơn nghỉ về Tổng hợp công, Nghỉ phép. Chốt công tháng → phần mềm gửi công từng người lên điện thoại để nhân viên xác nhận hoặc báo sai.', '']];
    modal('Hướng dẫn thiết lập riêng cho công ty', 'Máy chủ chấm công trên tài khoản Cloudflare của công ty · 7 bước',
      '<div class="notice warn wf-only">' + ic('info') + '<div><b>Chỉ thực hiện khi phần mềm hoàn thiện và chính thức phát hành bản đầy đủ.</b> Hiện tại mời anh/chị trải nghiệm bằng bản thử (dữ liệu mẫu) ở trang Chấm công Wi‑Fi.</div></div>' +
      '<ol class="guide-steps wf-gs">' + st.map(function (s, i) { return '<li><span class="gn">' + (i + 1) + '</span><div><h4>' + s[0] + '</h4><p>' + s[1] + '</p>' + s[2] + '</div></li>'; }).join('') + '</ol>' +
      '<div class="notice" style="margin-top:10px">' + ic('info') + '<div>Chấm công chỉ <b>phát hiện</b> chấm hộ (một điện thoại dùng cho nhiều người), không chụp ảnh, không lấy vị trí. Giờ chấm lấy theo đồng hồ máy chủ. Trước khi dùng thật cần có thông báo xử lý dữ liệu cá nhân cho nhân viên (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15).</div></div>');
  };
