  /* =====================================================================
     B3 – PHIẾU LƯƠNG (0.4.1, 09/11/2026) = bảng kê trả lương BLLĐ 2019 Điều 95 khoản 3
       - Lấy từ bảng lương ĐÃ CHỐT (u.lgm[ym].lock.rows) – không tính lại
       - In / lưu PDF từng người hoặc cả công ty
       - Gửi lên trang nhân viên trên điện thoại qua máy chủ chấm công (API /api/sync/phieu, phieu-hoi, phieu-tra-loi)
       - Nhân viên hỏi lại 1 dòng trên phiếu → hiện ở đây, quản lý trả lời tại chỗ (u.wf.phieu[ym] = { sent, n, by: {Mã NV: {xem, hoi[]}} })
       - 15:35 10/11: giao diện theo Cơ cấu / Bảng lương (thẻ số liệu, thanh lọc, bảng gx), phiếu thiết kế lại theo màu giao diện, nút Gửi email (chưa thiết lập)
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
  var PL_G = { tn: 'Các khoản thu nhập', bh: 'Bảo hiểm bắt buộc trừ vào lương', tax: 'Thuế thu nhập cá nhân', kt: 'Các khoản khấu trừ khác' };
  // 15:35 10/11 anh: phiếu lương thiết kế lại – màu nhấn theo màu giao diện người dùng chọn (biến --sp)
  function plAccent() {
    var c = '#1D6A50'; try { c = getComputedStyle(document.documentElement).getPropertyValue('--pri').trim() || c; } catch (e) { }
    var m = /^#([0-9a-f]{6})$/i.exec(c), lum = 0; if (m) { var n = parseInt(m[1], 16); lum = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
    return lum > 0.5 ? 'color-mix(in srgb,' + c + ' 60%,#000)' : c; // giao diện tối: màu nhấn sáng → làm đậm lại cho phiếu nền trắng
  }
  function plHtml(d) {
    var rows = '', tot = { tn: d.tn, bh: d.bh, tax: d.thue, kt: d.kt }, no = 0;
    ['tn', 'bh', 'tax', 'kt'].forEach(function (g) {
      var ls = d.dong.filter(function (x) { return x.g === g; }); if (!ls.length && g !== 'bh') return; no++;
      rows += '<tr class="g"><td><span class="no">' + ['I', 'II', 'III', 'IV'][no - 1] + '</span>' + PL_G[g] + '</td><td class="n">' + (g === 'tn' ? '' : '−') + lgMoney(tot[g]) + '</td></tr>';
      if (!ls.length) rows += '<tr><td colspan="2" class="f">' + esc(d.bhWhy || 'Không phát sinh') + '</td></tr>';
      ls.forEach(function (x) { rows += '<tr><td>' + esc(x.t) + (x.f ? '<div class="f">' + esc(x.f) + '</div>' : '') + '</td><td class="n">' + lgMoney(x.v) + '</td></tr>'; });
    });
    var si = [['Ngày công / giờ làm', d.cong], ['Lương cơ bản', lgMoney(d.coBan)], ['Lương đóng BHXH', d.bhBase ? lgMoney(d.bhBase) : 'Không đóng'], ['Người phụ thuộc', String(d.npt || 0)]];
    return '<div class="slip" style="--sp:' + plAccent() + '">' +
      '<div class="s-top"><div class="s-co"><b>' + esc(d.cty) + '</b><span>Bảng kê trả lương · BLLĐ 2019 Điều 95 khoản 3</span></div><div class="s-ym"><span>PHIẾU LƯƠNG</span><b>Tháng ' + HR.ymLabel(d.ym) + '</b></div></div>' +
      '<div class="s-who"><div><b class="nm">' + esc(d.ten) + '</b><span>' + esc(d.ma) + (d.pb ? ' · ' + esc(d.pb) : '') + (d.hd ? ' · ' + esc(d.hd) : '') + '</span></div><div class="s-net"><span>Thực lĩnh</span><b>' + lgMoney(d.tl) + ' <small>đ</small></b></div></div>' +
      '<div class="s-si">' + si.map(function (x) { return '<div><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>' +
      '<table><thead><tr><th>Khoản</th><th class="n">Số tiền (đồng)</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="s-sum"><div><span>Tổng thu nhập</span><b>' + lgMoney(d.tn) + '</b></div><div><span>Bảo hiểm</span><b>−' + lgMoney(d.bh) + '</b></div><div><span>Thuế TNCN</span><b>−' + lgMoney(d.thue) + '</b></div><div><span>Khấu trừ khác</span><b>−' + lgMoney(d.kt) + '</b></div><div class="tl"><span>Thực lĩnh</span><b>' + lgMoney(d.tl) + '</b></div></div>' +
      '<p class="chu">Bằng chữ: <i>' + esc(d.chu) + '</i></p>' +
      '<div class="sg"><div>Người lập phiếu<br><i>(ký, ghi rõ họ tên)</i></div><div>Người lao động<br><i>(ký, ghi rõ họ tên)</i></div></div>' +
      '<p class="s-ft">Bảng lương chốt ' + esc(d.chot) + (d.han ? ' · thắc mắc gửi trước ngày ' + esc(d.han) : '') + ' · Thông tin lương là thông tin cá nhân – vui lòng bảo mật.</p></div>';
  }
  var PL_CSS = '.slip{--sp:#1D6A50;--sp1:color-mix(in srgb,var(--sp) 8%,#fff);--sp2:color-mix(in srgb,var(--sp) 18%,#fff);max-width:760px;margin:0 auto 24px;font:13.5px/1.5 "Be Vietnam Pro","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:#1d2329;background:#fff;border:1px solid #e3e7ea;border-radius:14px;overflow:hidden;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.slip .s-top{display:flex;justify-content:space-between;align-items:center;gap:14px;background:var(--sp);color:#fff;padding:16px 24px}.slip .s-co b{display:block;font-size:15px;letter-spacing:.2px}.slip .s-co span{font-size:11.5px;opacity:.85}.slip .s-ym{text-align:right}.slip .s-ym span{display:block;font-size:11px;letter-spacing:2px;opacity:.85}.slip .s-ym b{font-size:19px;letter-spacing:.3px}' +
    '.slip .s-who{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 24px 12px}.slip .s-who .nm{display:block;font-size:19px;color:#111}.slip .s-who span{font-size:12.5px;color:#5c6670}.slip .s-net{background:var(--sp1);border:1px solid var(--sp2);border-radius:10px;padding:8px 16px;text-align:right;min-width:190px}.slip .s-net span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--sp)}.slip .s-net b{font-size:22px;color:var(--sp);font-variant-numeric:tabular-nums}.slip .s-net small{font-size:13px}' +
    '.slip .s-si{display:grid;grid-template-columns:repeat(4,1fr);margin:0 24px 14px;border:1px solid #e8ecee;border-radius:10px}.slip .s-si>div{padding:8px 12px;border-left:1px solid #e8ecee}.slip .s-si>div:first-child{border-left:0}.slip .s-si span{display:block;font-size:11px;color:#6b757e}.slip .s-si b{font-size:13.5px;font-variant-numeric:tabular-nums}' +
    '.slip table{width:calc(100% - 48px);margin:0 24px;border-collapse:collapse}.slip th{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#6b757e;text-align:left;padding:6px 10px;border-bottom:2px solid var(--sp)}.slip td{padding:6px 10px;border-bottom:1px solid #eef1f3;vertical-align:top}.slip .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.slip tr.g td{background:var(--sp1);font-weight:700;color:#14191e;border-bottom:1px solid var(--sp2)}.slip tr.g .no{display:inline-block;min-width:26px;color:var(--sp)}.slip tr:not(.g) td:first-child{padding-left:36px}.slip .f{font-size:11.5px;color:#7a848c}' +
    '.slip .s-sum{display:grid;grid-template-columns:repeat(4,1fr) 1.3fr;margin:14px 24px 0;border-radius:10px;overflow:hidden;border:1px solid var(--sp2)}.slip .s-sum>div{padding:8px 12px;background:#fafbfb}.slip .s-sum span{display:block;font-size:11px;color:#6b757e}.slip .s-sum b{font-variant-numeric:tabular-nums}.slip .s-sum .tl{background:var(--sp);color:#fff;text-align:right}.slip .s-sum .tl span{color:#fff;opacity:.85}.slip .s-sum .tl b{font-size:17px}' +
    '.slip .chu{margin:10px 24px 0;font-size:13px}.slip .sg{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin:22px 24px 0;min-height:86px;font-size:13px;font-weight:600}.slip .sg i{font-weight:400;font-size:12px;color:#6b757e}.slip .s-ft{margin:8px 0 0;padding:10px 24px;background:#f6f8f9;border-top:1px solid #eef1f3;font-size:11px;color:#7a848c}' +
    '@media (max-width:640px){.slip .s-si,.slip .s-sum{grid-template-columns:1fr 1fr}.slip .s-who{flex-direction:column;align-items:flex-start}.slip .s-net{text-align:left}}@media print{.slip{border:0;border-radius:0;margin:0 auto}}';
  function plPrint(html, title) {
    var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    var d = fr.contentWindow.document; d.open(); d.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff}' + PL_CSS + '</style></head><body>' + html + '</body></html>'); d.close();
    setTimeout(function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Trình duyệt chặn in – thử lại', 'warn'); } setTimeout(function () { fr.remove(); }, 1500); }, 300);
  }
  // 16:01 10/11: dữ liệu mẫu chưa có mã kết nối → gửi phiếu qua API bản thử (/api/demo/phieu…) của chamcong-thu.quantritute.com
  function plOn(u) { return wfOn(u) || wfDemoOn(u); }
  function plCall(u, path, body) { return wfOn(u) ? wfCall(u, path, body) : wfDemoGet(path, body); }
  function plUnit() { var f = ps('pl', { u: '', ym: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  PAGES.phieuluong = function () {
    lgStyle(); blStyle(); gxStyle(); blSampleLock(); if (!document.getElementById('plCss')) { var st = document.createElement('style'); st.id = 'plCss'; st.textContent = PL_CSS + '.pl-q{border-left:3px solid #b9770e;padding:6px 10px;margin:6px 0;background:rgba(185,119,14,.07);border-radius:4px}.pl-q.ok{border-color:#1e8449;background:rgba(30,132,73,.07)}.pl-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 14px}.gx-wrap.pl-full table.gx{width:100%!important}.pl-mail p{margin:0 0 14px}'; document.head.appendChild(st); }
    var f = ps('pl', { u: '', ym: '', q: '', pb: '' }), u = plUnit(); if (!u) return pageHead('Phiếu lương') + noData('dữ liệu');
    var us = selUnits().length ? selUnits() : S.units, ms = Object.keys(u.lgm || {}).filter(function (m) { return u.lgm[m].lock; }).sort();
    var seg = us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="pl-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '';
    if (!ms.length) return pageHead('Phiếu lương', 'Phiếu lương lấy từ bảng lương đã chốt.') + (seg ? '<div class="pl-top">' + seg + '</div>' : '') + '<div class="card card-pad"><p style="margin:0">Chưa có bảng lương đã chốt của <b>' + esc(shortUnit(u.name)) + '</b>. Vào <a href="#bl">Bảng lương</a> → chọn tháng đã chốt công → <b>Chốt bảng lương</b>.</p></div>';
    if (ms.indexOf(f.ym) < 0) f.ym = ms[ms.length - 1];
    var ym = f.ym, L = u.lgm[ym].lock, P = plState(u, ym), on = plOn(u), dm = !wfOn(u);
    var right = '<button class="btn btn-sm" data-act="pl-mail">' + ic('mail', 14) + ' Gửi email phiếu lương</button><button class="btn btn-sm" data-act="pl-print-all">' + ic('xuat', 14) + ' In / lưu PDF cả công ty</button>' + (on ? '<button class="btn btn-sm" data-act="pl-pull">Cập nhật câu hỏi</button><button class="btn btn-sm btn-primary" data-act="pl-send">' + (P.sent ? 'Gửi lại lên điện thoại' : 'Gửi lên điện thoại') + (dm ? ' (bản thử)' : '') + '</button>' : '');
    var head = pageHead('Phiếu lương', 'Phiếu lương tháng ' + HR.ymLabel(ym) + ' – ' + esc(shortUnit(u.name)) + ' – lấy từ bảng lương đã chốt ' + esc(L.at) + '.', right);
    var top = '<div class="pl-top">' + seg + '<select class="input" id="plYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + ' · đã chốt</option>'; }).join('') + '</select></div>';
    var nQ = 0, nXem = 0, tot = 0;
    L.rows.forEach(function (r) { var b = P.by[r.id] || {}; nQ += (b.hoi || []).filter(function (x) { return !x.tl; }).length; if (b.xem) nXem++; tot += +r.pay || 0; });
    var kpi = gxKpi([{ l: 'Số phiếu', v: L.rows.length }, { l: 'Tổng thực lĩnh', v: lgMoney(tot), cls: 'ac' },
      { l: 'Gửi lên điện thoại', v: on ? (P.sent ? 'Đã gửi' : 'Chưa gửi') : 'Chưa kết nối', d: on && P.sent ? esc(P.sent) + (dm ? ' · bản thử' : '') : on ? (dm ? 'qua máy chủ bản thử' : '') : 'kết nối ở <a href="#ccwifi">Chấm công Wi‑Fi</a>' },
      { l: 'Nhân viên đã xem', v: on && P.sent ? nXem + '/' + L.rows.length : '—' }, { l: 'Câu hỏi chờ trả lời', v: nQ, cls: nQ ? 'wn' : '' }]);
    var pbs = []; L.rows.forEach(function (r) { if (r.dept && pbs.indexOf(r.dept) < 0) pbs.push(r.dept); });
    var bar = '<div class="gx-bar"><input class="input" id="plQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q) + '" aria-label="Tìm"><select class="input" id="plPb" aria-label="Bộ phận"><option value="">Bộ phận</option>' + pbs.map(function (x) { return '<option' + (x === f.pb ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select><span class="gx-cnt" id="plCnt"></span><span class="gx-sp"></span>' +
      '<label class="lg-chk" style="white-space:nowrap">Hạn nhân viên hỏi lại <select class="input" id="plHan" style="width:auto!important;flex:none">' + [[0, 'không đặt hạn'], [3, '3 ngày sau khi gửi'], [5, '5 ngày'], [7, '7 ngày']].map(function (o) { return '<option value="' + o[0] + '"' + (+plSet(u).han === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';
    var cols = [{ id: 'stt', t: 'STT', w: 56 }, { id: 'ma', t: 'Mã NV', w: 90 }, { id: 'ten', t: 'Họ và tên', w: 230 }, { id: 'pb', t: 'Bộ phận', w: 200 }, { id: 'tl', t: 'Thực lĩnh', unit: 'đồng', w: 160, hl: 1, bg: 'rgba(29,106,80,.07)' }]
      .concat(on ? [{ id: 'xem', t: 'Nhân viên xem', w: 150 }, { id: 'hoi', t: 'Câu hỏi', w: 150 }] : [], [{ id: 'act', t: '', w: 120 }]);
    var rows = L.rows.map(function (r, i) {
      var b = P.by[r.id] || {}, q = (b.hoi || []), wait = q.filter(function (x) { return !x.tl; }).length;
      var cells = [{ h: i + 1, cls: 'c' }, { h: esc(r.id), cls: 'c' }, { h: '<a href="#" data-act="pl-view" data-id="' + esc(r.id) + '"><b>' + esc(r.name) + '</b></a>' }, { h: esc(r.dept || '') }, { h: lgMoney(r.pay), cls: 'n' }];
      if (on) cells.push({ h: b.xem ? 'Đã xem ' + esc(b.xem) : P.sent ? '<span class="faint">Chưa xem</span>' : '', cls: 'c' }, { h: q.length ? (wait ? '<span class="tag tag-warn">' + wait + ' chờ trả lời</span>' : '<span class="tag tag-ok">Đã trả lời ' + q.length + '</span>') : '', cls: 'c' });
      cells.push({ h: '<button class="btn btn-sm" data-act="pl-view" data-id="' + esc(r.id) + '">Xem phiếu</button>', cls: 'c' });
      return { at: ' data-q="' + esc(HR.stripAcc((r.id + ' ' + r.name).toLowerCase())) + '" data-pb="' + esc(r.dept || '') + '" data-v="' + (+r.pay || 0) + '"', cells: cells };
    });
    var foot = [{ h: 'Tổng cộng <span id="plN">' + L.rows.length + '</span> người', span: 3, cls: 'hl' }, null, null, { h: '' }, { h: '<span id="plT">' + lgMoney(tot) + '</span>', cls: 'n hl' }].concat(on ? [{ h: '' }, { h: '' }] : [], [{ h: '' }]);
    var tbl = gxTable({ id: 'plTbl', cols: cols, rows: rows, foot: foot }).replace('class="gx-wrap"', 'class="gx-wrap pl-full"');
    var note = nQ ? '<div class="notice warn" style="margin-bottom:10px">' + ic('info') + '<div><b>' + nQ + ' câu hỏi</b> của nhân viên đang chờ trả lời – bấm Xem phiếu để trả lời.</div></div>' : '';
    return head + top + kpi + '<div class="gx-card">' + note + bar + tbl + '</div>';
  };
  ACTS['pl-mail'] = function () { modal('Gửi email phiếu lương', '', '<div class="pl-mail"><p>Chưa thiết lập gửi email tự động. Anh/chị sẽ thiết lập tại phần <b>Cài đặt</b> khi bản hoàn thiện phát hành.</p><div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" data-close>Đã hiểu</button></div></div>', true); };
  ACTS['pl-u'] = function (a, id) { PS.pl.u = id; render(); };
  ACTS['pl-view'] = function (a, id) {
    var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock, r = L.rows.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var d = plData(u, ym, r, L), b = plState(u, ym).by[id] || {}, q = b.hoi || [], on = plOn(u);
    var qh = q.length ? '<h3 style="margin:16px 0 6px">Câu hỏi của nhân viên</h3>' + q.map(function (x, i) { return '<div class="pl-q' + (x.tl ? ' ok' : '') + '"><div><b>' + esc(x.dong) + '</b> · ' + esc(x.at || '') + '</div><div>' + esc(x.nd) + '</div>' + (x.tl ? '<div style="margin-top:4px"><b>Trả lời:</b> ' + esc(x.tl) + ' <span class="faint">(' + esc(x.tl_by || '') + ')</span></div>' : on ? '<div style="display:flex;gap:6px;margin-top:6px"><input class="input" id="plA' + i + '" placeholder="Trả lời nhân viên" maxlength="300"><button class="btn btn-sm btn-primary" data-act="pl-ans" data-id="' + esc(id) + '|' + i + '">Gửi</button></div>' : '') + '</div>'; }).join('') : '';
    var m = modal('Phiếu lương ' + r.name, 'Tháng ' + HR.ymLabel(ym), '<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-sm" id="plOne">In / lưu PDF</button></div>' + plHtml(d) + qh);
    $('#plOne', m).onclick = function () { plPrint(plHtml(d), 'Phieu luong ' + ym + ' ' + r.id); };
  };
  ACTS['pl-print-all'] = function () { var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock; plPrint(L.rows.map(function (r) { return plHtml(plData(u, ym, r, L)); }).join(''), 'Phieu luong ' + ym); log('In phiếu lương ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + L.rows.length + ' phiếu'); };
  ACTS['pl-send'] = function (a) {
    var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock, P = plState(u, ym); a.disabled = true;
    P.sentIso = HR.isoToday();
    var list = L.rows.map(function (r) { return { ma: r.id, du_lieu: plData(u, ym, r, L) }; });
    plCall(u, 'phieu', { ym: ym, chot: L.at, nguoi: ccUser(), list: list }).then(function (j) {
      P.sent = nowVn(); P.n = list.length; if (wfOn(u)) wfLog(u, 'Gửi phiếu lương ' + HR.ymLabel(ym) + ': ' + list.length + ' người'); log('Gửi phiếu lương ' + HR.ymLabel(ym) + ' lên điện thoại (' + u.name + '): ' + list.length + ' người'); saveUnits(); toast('Đã gửi ' + list.length + ' phiếu lương lên điện thoại', 'ok'); render();
    }).catch(function (e) { a.disabled = false; showErr('Chưa gửi được phiếu lương', e); });
  };
  function plPull(u, ym, quiet) {
    var P = plState(u, ym);
    return plCall(u, 'phieu-hoi?ym=' + ym).then(function (j) { j.list.forEach(function (x) { var b = P.by[x.ma] || (P.by[x.ma] = {}); b.xem = x.xem_at ? wfIso(x.xem_at).split('-').reverse().join('/') : ''; b.hoi = (x.hoi || []).map(function (k) { return { at: k.t ? wfIso(k.t).split('-').reverse().join('/') + ' ' + wfHM(k.t) : '', dong: k.dong, nd: k.nd, tl: k.tl || '', tl_by: k.tl_by || '' }; }); }); P.pull = nowVn(); saveUnits(); if (!quiet) toast('Đã cập nhật câu hỏi'); render(); })
      .catch(function (e) { if (!quiet) showErr('Chưa lấy được câu hỏi', e); });
  }
  ACTS['pl-pull'] = function () { var u = plUnit(); plPull(u, PS.pl.ym); };
  ACTS['pl-ans'] = function (a, key) {
    var u = plUnit(), ym = PS.pl.ym, k = key.split('|'), inp = $('#plA' + k[1]), tl = inp ? inp.value.trim() : ''; if (!tl) { toast('Nhập câu trả lời', 'warn'); return; }
    a.disabled = true;
    plCall(u, 'phieu-tra-loi', { ym: ym, ma: k[0], idx: +k[1], tra_loi: tl, nguoi: ccUser() }).then(function () { var b = plState(u, ym).by[k[0]]; if (b && b.hoi[+k[1]]) { b.hoi[+k[1]].tl = tl; b.hoi[+k[1]].tl_by = ccUser(); } saveUnits(); log('Trả lời câu hỏi phiếu lương ' + k[0] + ' tháng ' + HR.ymLabel(ym)); toast('Đã gửi câu trả lời', 'ok'); var bg = a.closest('.modal-bg'); if (bg) bg.close(); render(); ACTS['pl-view'](null, k[0]); })
      .catch(function (e) { a.disabled = false; showErr('Chưa gửi được câu trả lời', e); });
  };
  BINDS.phieuluong = function () {
    var y = $('#plYm'); if (y) y.addEventListener('change', function () { PS.pl.ym = y.value; render(); });
    var flt = function () { var q = HR.stripAcc(($('#plQ') || {}).value || '').toLowerCase().trim(), pb = ($('#plPb') || {}).value || '', n = 0, t = 0, all = 0; PS.pl.q = q; PS.pl.pb = pb;
      Array.prototype.forEach.call(document.querySelectorAll('#plTbl tbody tr[data-q]'), function (tr) { all++; var ok = (!q || tr.getAttribute('data-q').indexOf(q) >= 0) && (!pb || tr.getAttribute('data-pb') === pb); tr.style.display = ok ? '' : 'none'; if (ok) { n++; t += +tr.getAttribute('data-v') || 0; } });
      var c = $('#plCnt'); if (c) c.textContent = n + '/' + all; var N = $('#plN'); if (N) N.textContent = n; var T = $('#plT'); if (T) T.textContent = lgMoney(t); };
    var qi = $('#plQ'); if (qi) qi.addEventListener('input', flt); var pi = $('#plPb'); if (pi) pi.addEventListener('change', flt); flt();
    var h = $('#plHan'); if (h) h.addEventListener('change', function () { var u = plUnit(); plSet(u).han = +h.value; lgSave(u, 'hạn hỏi lại phiếu lương ' + h.value + ' ngày'); toast('Đã lưu'); });
    var u = plUnit(); if (u && plOn(u) && PS.pl.ym && plState(u, PS.pl.ym).sent && !plState(u, PS.pl.ym)._auto) { plState(u, PS.pl.ym)._auto = 1; plPull(u, PS.pl.ym, true); }
  };
