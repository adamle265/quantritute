  /* =====================================================================
     B3 – PHIẾU LƯƠNG (0.4.1, 09/11/2026) = bảng kê trả lương BLLĐ 2019 Điều 95 khoản 3
       - Lấy từ bảng lương ĐÃ CHỐT (u.lgm[ym].lock.rows) – không tính lại
       - In / lưu PDF từng người hoặc cả công ty
       - Gửi lên trang nhân viên trên điện thoại qua máy chủ chấm công (API /api/sync/phieu, phieu-hoi, phieu-tra-loi)
       - Nhân viên hỏi lại 1 dòng trên phiếu → hiện ở đây, quản lý trả lời tại chỗ (u.wf.phieu[ym] = { sent, n, by: {Mã NV: {xem, hoi[]}} })
     ===================================================================== */
  function lgChu(n) {
    n = Math.round(Math.abs(+n || 0)); if (!n) return 'Không đồng';
    var cs = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'], un = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'], g = [];
    while (n > 0) { g.push(n % 1000); n = Math.floor(n / 1000); }
    var ba = function (x, full) {
      var t = Math.floor(x / 100), c = Math.floor(x % 100 / 10), d = x % 10, s = [];
      if (full || t) s.push(cs[t] + ' trăm');
      if (c) s.push(c === 1 ? 'mười' : cs[c] + ' mươi'); else if (d && (full || t)) s.push('lẻ');
      if (d) s.push(d === 1 && c > 1 ? 'mốt' : d === 5 && c > 0 ? 'lăm' : cs[d]);
      return s.join(' ');
    };
    var out = []; for (var i = g.length - 1; i >= 0; i--) { if (!g[i]) continue; out.push(ba(g[i], i < g.length - 1) + un[i]); }
    var t = out.join(' '); return t.charAt(0).toUpperCase() + t.slice(1) + ' đồng';
  }
  function plSet(u) { var s = lgOf(u); s.slip = s.slip || { han: 3 }; return s.slip; }
  function plState(u, ym) { u.wf = u.wf || {}; var P = u.wf.phieu || (u.wf.phieu = {}); return P[ym] || (P[ym] = { by: {} }); }
  function plHan(u, ym) { var P = plState(u, ym), d = P.sentIso || HR.isoToday(), n = +plSet(u).han || 0; return n ? HR.vnDate(ccAdd(d, n)) : ''; }
  // dữ liệu 1 phiếu (gửi lên điện thoại + in)
  function plData(u, ym, r, L) {
    var c = r.c || {};
    return { cty: u.name.replace(/\s*\(dữ liệu mẫu\)\s*/i, ''), ma: r.id, ten: r.name, pb: r.dept, ld: r.ld, hd: r.ctype, ym: ym, chot: L.at, han: plHan(u, ym),
      cong: c.hr ? lgNum(c.cong) + ' giờ làm' : lgNum(c.cong) + ' / ' + lgNum(c.std) + ' công', coBan: c.cb != null ? c.cb : c.coBan, bhBase: c.bhBase, npt: c.npt,
      dong: r.lines.filter(function (l) { return !l.info && (l.v || l.k === 'thue' || l.k === 'tg') && l.slip !== false; }).map(function (l) { return { g: l.grp, t: l.t, v: l.v, f: l.f }; }),
      tn: r.gross, bh: r.bhNL, thue: r.tax, kt: r.kt, tl: r.pay, chu: lgChu(r.pay), bhWhy: r.bhWhy || '' };
  }
  var PL_G = { tn: 'I. Các khoản thu nhập', bh: 'II. Bảo hiểm bắt buộc trừ vào lương', tax: 'III. Thuế thu nhập cá nhân', kt: 'IV. Các khoản khấu trừ khác' };
  function plHtml(d) {
    var rows = '', tot = { tn: d.tn, bh: d.bh, tax: d.thue, kt: d.kt };
    ['tn', 'bh', 'tax', 'kt'].forEach(function (g) {
      var ls = d.dong.filter(function (x) { return x.g === g; }); if (!ls.length && g !== 'bh') return;
      rows += '<tr class="g"><td>' + PL_G[g] + '</td><td class="n">' + lgMoney(tot[g]) + '</td></tr>';
      if (!ls.length) rows += '<tr><td colspan="2" class="f">' + esc(d.bhWhy || 'Không phát sinh') + '</td></tr>';
      ls.forEach(function (x) { rows += '<tr><td>' + esc(x.t) + (x.f ? '<div class="f">' + esc(x.f) + '</div>' : '') + '</td><td class="n">' + lgMoney(x.v) + '</td></tr>'; });
    });
    return '<div class="slip"><div class="sh"><b>' + esc(d.cty) + '</b><span>Phiếu lương = bảng kê trả lương (BLLĐ 2019 Điều 95 khoản 3)</span></div>' +
      '<h2>PHIẾU LƯƠNG THÁNG ' + HR.ymLabel(d.ym) + '</h2>' +
      '<div class="si"><div><span>Họ và tên</span><b>' + esc(d.ten) + '</b></div><div><span>Mã nhân viên</span><b>' + esc(d.ma) + '</b></div><div><span>Phòng ban</span><b>' + esc(d.pb || '') + '</b></div><div><span>Hợp đồng</span><b>' + esc(d.hd || '') + '</b></div><div><span>Ngày công / giờ làm</span><b>' + esc(d.cong) + '</b></div><div><span>Lương cơ bản</span><b>' + lgMoney(d.coBan) + '</b></div><div><span>Lương đóng BH</span><b>' + (d.bhBase ? lgMoney(d.bhBase) : 'Không đóng') + '</b></div><div><span>Người phụ thuộc</span><b>' + (d.npt || 0) + '</b></div></div>' +
      '<table><thead><tr><th>Khoản</th><th class="n">Số tiền (đồng)</th></tr></thead><tbody>' + rows +
      '<tr class="tl"><td>THỰC LĨNH = I − II − III − IV</td><td class="n">' + lgMoney(d.tl) + '</td></tr></tbody></table>' +
      '<p class="chu">Bằng chữ: <i>' + esc(d.chu) + '</i></p>' +
      '<p class="f">Bảng lương chốt ' + esc(d.chot) + (d.han ? ' · Thắc mắc về phiếu lương gửi trước ngày <b>' + esc(d.han) + '</b>' : '') + ' · Thông tin lương là thông tin cá nhân – vui lòng bảo mật.</p>' +
      '<div class="sg"><div>Người lập phiếu<br><i>(ký, ghi rõ họ tên)</i></div><div>Người lao động<br><i>(ký, ghi rõ họ tên)</i></div></div></div>';
  }
  var PL_CSS = '.slip{max-width:720px;margin:0 auto 24px;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1d1d1f;background:#fff;border:1px solid #ddd;border-radius:10px;padding:22px 24px;page-break-after:always}.slip .sh{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#555;border-bottom:1px solid #ddd;padding-bottom:8px}.slip .sh b{font-size:14px;color:#1d1d1f}.slip h2{text-align:center;font-size:19px;margin:14px 0 10px;letter-spacing:.3px}.slip .si{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 14px;margin:0 0 12px}.slip .si span{display:block;font-size:11px;color:#666}.slip .si b{font-size:13px}.slip table{width:100%;border-collapse:collapse}.slip th,.slip td{padding:6px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}.slip .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.slip tr.g td{background:#f3f6f4;font-weight:700}.slip tr.tl td{font-weight:800;font-size:16px;border-top:2px solid #2f7d4f;background:#e3f1e8}.slip .f{font-size:11.5px;color:#666}.slip .chu{margin:10px 0 4px}.slip .sg{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:26px;min-height:70px;font-size:13px}@media (max-width:640px){.slip .si{grid-template-columns:1fr 1fr}.slip{padding:16px}}@media print{.slip{border:0;border-radius:0;margin:0 auto;padding:0 0 10mm}}';
  function plPrint(html, title) {
    var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    var d = fr.contentWindow.document; d.open(); d.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff}' + PL_CSS + '</style></head><body>' + html + '</body></html>'); d.close();
    setTimeout(function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Trình duyệt chặn in – thử lại', 'warn'); } setTimeout(function () { fr.remove(); }, 1500); }, 300);
  }
  function plUnit() { var f = ps('pl', { u: '', ym: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  PAGES.phieuluong = function () {
    lgStyle(); blStyle(); if (!document.getElementById('plCss')) { var st = document.createElement('style'); st.id = 'plCss'; st.textContent = PL_CSS + '.pl-q{border-left:3px solid #b9770e;padding:6px 10px;margin:6px 0;background:rgba(185,119,14,.07);border-radius:4px}.pl-q.ok{border-color:#1e8449;background:rgba(30,132,73,.07)}'; document.head.appendChild(st); }
    var f = ps('pl', { u: '', ym: '' }), u = plUnit(); if (!u) return pageHead('Phiếu lương') + noData('dữ liệu');
    var us = selUnits().length ? selUnits() : S.units, ms = Object.keys(u.lgm || {}).filter(function (m) { return u.lgm[m].lock; }).sort();
    var pick = us.length > 1 ? '<div class="bl-bar"><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="pl-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : '';
    if (!ms.length) return pageHead('Phiếu lương', 'Phiếu lương = bảng kê trả lương gửi người lao động mỗi lần trả lương (BLLĐ 2019 Điều 95 khoản 3)') + pick + '<div class="card card-pad"><p style="margin:0">Chưa có bảng lương đã chốt của <b>' + esc(shortUnit(u.name)) + '</b>. Phiếu lương lấy từ bảng lương đã chốt: vào <a href="#bl">Bảng lương</a> → chọn tháng đã chốt công → <b>Chốt bảng lương</b>.</p></div>';
    if (ms.indexOf(f.ym) < 0) f.ym = ms[ms.length - 1];
    var ym = f.ym, L = u.lgm[ym].lock, P = plState(u, ym), on = wfOn(u), demo = wfDemoOn(u);
    var right = '<button class="btn btn-sm" data-act="pl-print-all">In / lưu PDF cả công ty</button>' + (on ? '<button class="btn btn-sm" data-act="pl-pull">Cập nhật câu hỏi</button><button class="btn btn-sm btn-primary" data-act="pl-send">' + (P.sent ? 'Gửi lại lên điện thoại' : 'Gửi lên điện thoại') + '</button>' : '');
    var head = pageHead('Phiếu lương', 'Tháng ' + HR.ymLabel(ym) + ' · ' + esc(shortUnit(u.name)) + ' · lấy từ bảng lương đã chốt ' + esc(L.at) + ' · phiếu lương = bảng kê trả lương (BLLĐ 2019 Điều 95 khoản 3)', right);
    var sel = '<div class="bl-bar"><select class="input" id="plYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + '</option>'; }).join('') + '</select>' +
      '<label class="lg-chk">Hạn nhân viên hỏi lại: <select class="input" id="plHan" style="width:auto">' + [[0, 'không đặt hạn'], [3, '3 ngày sau khi gửi'], [5, '5 ngày'], [7, '7 ngày']].map(function (o) { return '<option value="' + o[0] + '"' + (+plSet(u).han === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';
    var stt = '<div class="bl-st">' + (on ? (P.sent ? '<span class="tag tag-ok">Đã gửi lên điện thoại</span><span>' + esc(P.sent) + ' · ' + (P.n || 0) + ' phiếu</span>' : '<span class="tag tag-warn">Chưa gửi lên điện thoại</span>') + (P.pull ? '<span class="faint">câu hỏi cập nhật ' + esc(P.pull) + '</span>' : '') :
      demo ? '<span>Dữ liệu mẫu chưa kết nối máy chủ chấm công nên chưa gửi được phiếu lên điện thoại. Kết nối ở <a href="#ccwifi">Chấm công Wi‑Fi</a> (bản thử: chamcong-thu.quantritute.com).</span>' : '<span>Chưa kết nối máy chủ chấm công – vẫn in / lưu PDF được. Muốn gửi lên điện thoại: kết nối ở <a href="#ccwifi">Chấm công Wi‑Fi</a>.</span>') + '</div>';
    var nQ = 0, tb = L.rows.map(function (r, i) {
      var b = P.by[r.id] || {}, q = (b.hoi || []), wait = q.filter(function (x) { return !x.tl; }).length; nQ += wait;
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.id) + '</td><td><a href="#" data-act="pl-view" data-id="' + esc(r.id) + '">' + esc(r.name) + '</a></td><td>' + esc(r.dept || '') + '</td><td class="n hl-net">' + lgMoney(r.pay) + '</td>' +
        (on ? '<td>' + (b.xem ? 'Đã xem ' + esc(b.xem) : P.sent ? '<span class="faint">Chưa xem</span>' : '') + '</td><td>' + (q.length ? (wait ? '<span class="tag tag-warn">' + wait + ' chờ trả lời</span>' : '<span class="tag tag-ok">Đã trả lời ' + q.length + '</span>') : '') + '</td>' : '') +
        '<td><button class="btn btn-sm" data-act="pl-view" data-id="' + esc(r.id) + '">Xem phiếu</button></td></tr>';
    }).join('');
    var tbl = '<div class="card card-pad">' + (nQ ? '<div class="notice warn" style="margin-bottom:10px">' + ic('info') + '<div><b>' + nQ + ' câu hỏi</b> của nhân viên đang chờ trả lời – bấm Xem phiếu để trả lời.</div></div>' : '') + '<div class="tbl-wrap"><table class="tbl blt"><thead><tr><th>STT</th><th>Mã NV</th><th>Họ và tên</th><th>Phòng ban</th><th class="n hl-net">Thực lĩnh</th>' + (on ? '<th>Nhân viên xem</th><th>Câu hỏi</th>' : '') + '<th></th></tr></thead><tbody>' + tb + '</tbody></table></div></div>';
    return head + pick + sel + stt + tbl;
  };
  ACTS['pl-u'] = function (a, id) { PS.pl.u = id; render(); };
  ACTS['pl-view'] = function (a, id) {
    var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock, r = L.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var d = plData(u, ym, r, L), b = plState(u, ym).by[id] || {}, q = b.hoi || [], on = wfOn(u);
    var qh = q.length ? '<h3 style="margin:16px 0 6px">Câu hỏi của nhân viên</h3>' + q.map(function (x, i) { return '<div class="pl-q' + (x.tl ? ' ok' : '') + '"><div><b>' + esc(x.dong) + '</b> · ' + esc(x.at || '') + '</div><div>' + esc(x.nd) + '</div>' + (x.tl ? '<div style="margin-top:4px"><b>Trả lời:</b> ' + esc(x.tl) + ' <span class="faint">(' + esc(x.tl_by || '') + ')</span></div>' : on ? '<div style="display:flex;gap:6px;margin-top:6px"><input class="input" id="plA' + i + '" placeholder="Trả lời nhân viên" maxlength="300"><button class="btn btn-sm btn-primary" data-act="pl-ans" data-id="' + esc(id) + '|' + i + '">Gửi</button></div>' : '') + '</div>'; }).join('') : '';
    var m = modal('Phiếu lương ' + r.name, 'Tháng ' + HR.ymLabel(ym), '<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-sm" id="plOne">In / lưu PDF</button></div>' + plHtml(d) + qh);
    $('#plOne', m).onclick = function () { plPrint(plHtml(d), 'Phieu luong ' + ym + ' ' + r.id); };
  };
  ACTS['pl-print-all'] = function () { var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock; plPrint(L.rows.map(function (r) { return plHtml(plData(u, ym, r, L)); }).join(''), 'Phieu luong ' + ym); log('In phiếu lương ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + L.rows.length + ' phiếu'); };
  ACTS['pl-send'] = function (a) {
    var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock, P = plState(u, ym); a.disabled = true;
    P.sentIso = HR.isoToday();
    var list = L.rows.map(function (r) { return { ma: r.id, du_lieu: plData(u, ym, r, L) }; });
    wfCall(u, 'phieu', { ym: ym, chot: L.at, nguoi: ccUser(), list: list }).then(function (j) {
      P.sent = nowVn(); P.n = list.length; wfLog(u, 'Gửi phiếu lương ' + HR.ymLabel(ym) + ': ' + list.length + ' người'); log('Gửi phiếu lương ' + HR.ymLabel(ym) + ' lên điện thoại (' + u.name + '): ' + list.length + ' người'); saveUnits(); toast('Đã gửi ' + list.length + ' phiếu lương lên điện thoại', 'ok'); render();
    }).catch(function (e) { a.disabled = false; showErr('Chưa gửi được phiếu lương', e); });
  };
  function plPull(u, ym, quiet) {
    var P = plState(u, ym);
    return wfCall(u, 'phieu-hoi?ym=' + ym).then(function (j) { j.list.forEach(function (x) { var b = P.by[x.ma] || (P.by[x.ma] = {}); b.xem = x.xem_at ? wfIso(x.xem_at).split('-').reverse().join('/') : ''; b.hoi = (x.hoi || []).map(function (k) { return { at: k.t ? wfIso(k.t).split('-').reverse().join('/') + ' ' + wfHM(k.t) : '', dong: k.dong, nd: k.nd, tl: k.tl || '', tl_by: k.tl_by || '' }; }); }); P.pull = nowVn(); saveUnits(); if (!quiet) toast('Đã cập nhật câu hỏi'); render(); })
      .catch(function (e) { if (!quiet) showErr('Chưa lấy được câu hỏi', e); });
  }
  ACTS['pl-pull'] = function () { var u = plUnit(); plPull(u, PS.pl.ym); };
  ACTS['pl-ans'] = function (a, key) {
    var u = plUnit(), ym = PS.pl.ym, k = key.split('|'), inp = $('#plA' + k[1]), tl = inp ? inp.value.trim() : ''; if (!tl) { toast('Nhập câu trả lời', 'warn'); return; }
    a.disabled = true;
    wfCall(u, 'phieu-tra-loi', { ym: ym, ma: k[0], idx: +k[1], tra_loi: tl, nguoi: ccUser() }).then(function () { var b = plState(u, ym).by[k[0]]; if (b && b.hoi[+k[1]]) { b.hoi[+k[1]].tl = tl; b.hoi[+k[1]].tl_by = ccUser(); } saveUnits(); log('Trả lời câu hỏi phiếu lương ' + k[0] + ' tháng ' + HR.ymLabel(ym)); toast('Đã gửi câu trả lời', 'ok'); var bg = a.closest('.modal-bg'); if (bg) bg.close(); render(); ACTS['pl-view'](null, k[0]); })
      .catch(function (e) { a.disabled = false; showErr('Chưa gửi được câu trả lời', e); });
  };
  BINDS.phieuluong = function () {
    var y = $('#plYm'); if (y) y.addEventListener('change', function () { PS.pl.ym = y.value; render(); });
    var h = $('#plHan'); if (h) h.addEventListener('change', function () { var u = plUnit(); plSet(u).han = +h.value; lgSave(u, 'hạn hỏi lại phiếu lương ' + h.value + ' ngày'); toast('Đã lưu'); });
    var u = plUnit(); if (u && wfOn(u) && PS.pl.ym && plState(u, PS.pl.ym).sent && !plState(u, PS.pl.ym)._auto) { plState(u, PS.pl.ym)._auto = 1; plPull(u, PS.pl.ym, true); }
  };
