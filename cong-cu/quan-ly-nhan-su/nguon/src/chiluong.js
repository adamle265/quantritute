  /* =====================================================================
     BẢNG CHI LƯƠNG (0.4.1, 15:35 10/11/2026 anh) – dưới Phiếu lương
       - Lấy số thực lĩnh từ bảng lương ĐÃ CHỐT (u.lgm[ym].lock.rows)
       - 2 loại: tiền mặt (in để người lao động ký nhận) · đổ lương ngân hàng (STK, ngân hàng từ hồ sơ nhân sự)
       - Mỗi lần lập là 1 bản lưu: u.chiL = [{ id, ym, type: 'tm'|'nh', at, by, ngay, nd, rows:[{ id, name, dept, stk, nh, amt }], total }]
       - Xem lại, in / lưu PDF, xuất Excel, xóa các bản đã lập ở mọi tháng
     ===================================================================== */
  Object.assign(IC, {
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
    chiluong: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M2.5 10h19M6.5 14.5h4"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v6M18 9v6"/>',
    bank: '<path d="M3 10h18L12 4z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'
  });
  var CL_T = { tm: 'Chi tiền mặt', nh: 'Đổ lương ngân hàng' };
  function clUnit() { var f = ps('cl', { u: '', ym: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function clNv(u) { var m = {}; (u.data.NV || []).forEach(function (e) { m[e['Mã NV']] = e; }); return m; }
  function clSrc(u, ym) {
    var L = u.lgm && u.lgm[ym] && u.lgm[ym].lock; if (!L) return [];
    var nv = clNv(u);
    return L.rows.map(function (r) { var e = nv[r.id] || {}; return { id: r.id, name: r.name, dept: r.dept || '', stk: String(e['Số tài khoản'] || '').replace(/\s+/g, ''), nh: String(e['Ngân hàng'] || '').trim(), amt: Math.round(+r.pay || 0) }; });
  }
  function clList(u) { return u.chiL || (u.chiL = []); }
  function clVer(u, ym, type) { return clList(u).filter(function (b) { return b.ym === ym && b.type === type; }).length; }
  function clKd(s) { return HR.stripAcc(String(s || '')).toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); } // tên không dấu cho file ngân hàng

  /* ---------- bản in ---------- */
  function clHtml(u, b) {
    var c = coInfo(u), nh = b.type === 'nh', acc = plAccent();
    var th = nh ? '<th class="c" style="width:40px">STT</th><th style="width:70px">Mã NV</th><th>Họ và tên</th><th style="width:130px">Số tài khoản</th><th style="width:130px">Ngân hàng</th><th class="n" style="width:110px">Số tiền</th><th>Nội dung chuyển khoản</th>'
      : '<th class="c" style="width:40px">STT</th><th style="width:70px">Mã NV</th><th>Họ và tên</th><th style="width:150px">Bộ phận</th><th class="n" style="width:120px">Số tiền</th><th style="width:150px">Ký nhận</th>';
    var tr = b.rows.map(function (r, i) {
      return nh ? '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.id) + '</td><td><b>' + esc(r.name) + '</b><div class="kd">' + esc(clKd(r.name)) + '</div></td><td class="mono">' + esc(r.stk) + '</td><td>' + esc(r.nh) + '</td><td class="n">' + lgMoney(r.amt) + '</td><td class="sm">' + esc(b.nd + ' ' + r.id) + '</td></tr>'
        : '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.id) + '</td><td><b>' + esc(r.name) + '</b></td><td>' + esc(r.dept) + '</td><td class="n">' + lgMoney(r.amt) + '</td><td class="ky"></td></tr>';
    }).join('');
    var sg = nh ? ['Người lập biểu', 'Kế toán trưởng', 'Giám đốc'] : ['Người lập biểu', 'Kế toán trưởng', 'Thủ quỹ', 'Giám đốc'];
    return '<div class="clp" style="--sp:' + acc + '"><div class="cl-h"><div><b>' + esc(c.ten) + '</b>' + (c.dc && c.dc !== '……' ? '<span>' + esc(c.dc) + '</span>' : '') + (c.mst && c.mst !== '……' ? '<span>MST: ' + esc(c.mst) + '</span>' : '') + '</div>' + (b.so ? '<div class="cl-no">Số: ' + esc(b.so) + '</div>' : '') + '</div>' +
      '<h2>' + (nh ? 'BẢNG KÊ CHI LƯƠNG QUA NGÂN HÀNG' : 'BẢNG CHI LƯƠNG BẰNG TIỀN MẶT') + '</h2><p class="cl-sub">Tháng ' + HR.ymLabel(b.ym) + (b.ngay ? ' · Ngày chi: ' + esc(b.ngay) : '') + ' · Đơn vị tính: đồng</p>' +
      '<table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody><tfoot><tr><td colspan="' + (nh ? 5 : 4) + '">Tổng cộng ' + b.rows.length + ' người</td><td class="n">' + lgMoney(b.total) + '</td><td></td></tr></tfoot></table>' +
      '<p class="cl-chu">Số tiền bằng chữ: <i>' + esc(lgChu(b.total)) + '</i></p>' +
      '<p class="cl-d">……, ngày …… tháng …… năm ……</p><div class="cl-sg" style="grid-template-columns:repeat(' + sg.length + ',1fr)">' + sg.map(function (x) { return '<div><b>' + x + '</b><i>(ký, ghi rõ họ tên)</i></div>'; }).join('') + '</div></div>';
  }
  var CL_CSS = '.clp{--sp:#1D6A50;max-width:980px;margin:0 auto 24px;font:12.5px/1.45 "Be Vietnam Pro","Segoe UI",system-ui,Arial,sans-serif;color:#1d2329;background:#fff;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.clp .cl-h{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid var(--sp);padding-bottom:8px}.clp .cl-h b{display:block;font-size:14px}.clp .cl-h span{display:block;font-size:11.5px;color:#5c6670}.clp .cl-no{font-size:12px;color:#5c6670;white-space:nowrap}' +
    '.clp h2{text-align:center;margin:16px 0 2px;font-size:18px;letter-spacing:.4px;color:var(--sp)}.clp .cl-sub{text-align:center;margin:0 0 12px;color:#5c6670}' +
    '.clp table{width:100%;border-collapse:collapse}.clp th{background:color-mix(in srgb,var(--sp) 12%,#fff);font-size:11.5px;text-align:left;padding:7px 8px;border:1px solid #d6dde1}.clp td{padding:7px 8px;border:1px solid #e1e6e9;vertical-align:middle}.clp .c{text-align:center}.clp .n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.clp .mono{font-family:"IBM Plex Mono",Consolas,monospace}.clp .kd{font-size:10.5px;color:#7a848c}.clp .sm{font-size:11.5px}.clp td.ky{height:34px}' +
    '.clp tfoot td{font-weight:700;background:color-mix(in srgb,var(--sp) 8%,#fff)}.clp .cl-chu{margin:10px 0 0}.clp .cl-d{text-align:right;margin:14px 0 4px;font-style:italic;color:#5c6670}.clp .cl-sg{display:grid;text-align:center;min-height:100px}.clp .cl-sg b{display:block}.clp .cl-sg i{font-size:11px;color:#6b757e}' +
    '@media print{.clp{margin:0 auto}}';
  function clPrint(u, b) {
    var land = b.type === 'nh', fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    var d = fr.contentWindow.document; d.open(); d.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(clName(u, b)) + '</title><style>@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:12mm}body{margin:0;background:#fff}' + CL_CSS + '</style></head><body>' + clHtml(u, b) + '</body></html>'); d.close();
    setTimeout(function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Trình duyệt chặn in – thử lại', 'warn'); } setTimeout(function () { fr.remove(); }, 1500); }, 300);
  }
  function clName(u, b) { return (b.type === 'nh' ? 'Bang chi luong ngan hang ' : 'Bang chi luong tien mat ') + HR.ymLabel(b.ym) + ' ' + shortUnit(u.name) + (b.v > 1 ? ' ban ' + b.v : ''); }
  function clXls(u, b) {
    var nh = b.type === 'nh', data = b.rows.map(function (r, i) { return nh ? [i + 1, r.id, r.name, clKd(r.name), r.stk, r.nh, r.amt, b.nd + ' ' + r.id] : [i + 1, r.id, r.name, r.dept, r.amt, '']; });
    data.push(nh ? [null, null, 'TỔNG CỘNG ' + b.rows.length + ' người', null, null, null, b.total, null] : [null, null, 'TỔNG CỘNG ' + b.rows.length + ' người', null, b.total, null]);
    var cols = nh ? [{ t: 'STT', w: 6 }, { t: 'Mã NV', w: 10 }, { t: 'Họ và tên', w: 26 }, { t: 'Tên người nhận (không dấu)', w: 28 }, { t: 'Số tài khoản', w: 20 }, { t: 'Ngân hàng', w: 20 }, { t: 'Số tiền', w: 15, hl: 1 }, { t: 'Nội dung chuyển khoản', w: 34 }]
      : [{ t: 'STT', w: 6 }, { t: 'Mã NV', w: 10 }, { t: 'Họ và tên', w: 26 }, { t: 'Bộ phận', w: 22 }, { t: 'Số tiền', w: 15, hl: 1 }, { t: 'Ký nhận', w: 20 }];
    saveXlsx([{ name: nh ? 'Chi luong NH' : 'Chi luong TM', title: (nh ? 'BẢNG KÊ CHI LƯƠNG QUA NGÂN HÀNG' : 'BẢNG CHI LƯƠNG BẰNG TIỀN MẶT') + ' THÁNG ' + HR.ymLabel(b.ym), note: u.name + ' · đơn vị: đồng · lập ' + b.at + ' bởi ' + b.by + (b.ngay ? ' · ngày chi ' + b.ngay : ''), cols: cols, rows: data, bold: [data.length - 1] }], fileName(clName(u, b)));
  }

  /* ---------- trang ---------- */
  PAGES.chiluong = function () {
    lgStyle(); blStyle(); gxStyle(); blSampleLock();
    if (!document.getElementById('clCss')) { var st = document.createElement('style'); st.id = 'clCss'; st.textContent = CL_CSS + '.cl-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 14px}.cl-ch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 16px}.cl-ch .choice{cursor:pointer}.cl-ch .choice:hover{border-color:var(--pri)}.cl-ch .choice h3{margin:0}.cl-ch .choice p{margin:0;color:var(--muted)}.cl-ch .ic{color:var(--pri)}.cl-ch .cl-k{display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;font-size:13px}.cl-ch .cl-k b{font-variant-numeric:tabular-nums}.gx-wrap.cl-full table.gx{width:100%!important}.cl-prev{max-height:58vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:16px;background:#fff}.cl-opt{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:flex-end;margin:0 0 12px}.cl-opt .field{margin:0}@media(max-width:760px){.cl-ch{grid-template-columns:1fr}}'; document.head.appendChild(st); }
    var f = ps('cl', { u: '', ym: '', t: '' }), u = clUnit(); if (!u) return pageHead('Bảng chi lương') + noData('dữ liệu');
    var us = selUnits().length ? selUnits() : S.units, ms = Object.keys(u.lgm || {}).filter(function (m) { return u.lgm[m].lock; }).sort();
    var seg = us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="cl-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '';
    var head = pageHead('Bảng chi lương', 'Lập bảng chi lương tiền mặt để in ký nhận, hoặc bảng đổ lương gửi ngân hàng – lấy số thực lĩnh từ bảng lương đã chốt.');
    var saved = clList(u);
    if (!ms.length && !saved.length) return head + (seg ? '<div class="cl-top">' + seg + '</div>' : '') + '<div class="card card-pad"><p style="margin:0">Chưa có bảng lương đã chốt của <b>' + esc(shortUnit(u.name)) + '</b>. Vào <a href="#bl">Bảng lương</a> → chọn tháng → <b>Chốt bảng lương</b>, rồi quay lại đây để lập bảng chi.</p></div>';
    var top = '', ch = '';
    if (ms.length) {
      if (ms.indexOf(f.ym) < 0) f.ym = ms[ms.length - 1];
      var ym = f.ym, src = clSrc(u, ym), pay = src.filter(function (r) { return r.amt > 0; }), hasTk = pay.filter(function (r) { return r.stk; }), noTk = pay.length - hasTk.length;
      var sum = function (a) { return a.reduce(function (s, r) { return s + r.amt; }, 0); };
      top = '<div class="cl-top">' + seg + '<select class="input" id="clYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + ' · đã chốt</option>'; }).join('') + '</select></div>';
      var done = function (t) { var n = clVer(u, ym, t); return n ? '<span class="tag tag-ok">đã lập ' + n + ' bản</span>' : ''; };
      ch = '<div class="cl-ch"><button class="choice" data-act="cl-new" data-id="nh"><span class="ic">' + ic('bank') + '</span><h3>Lập bảng đổ lương ngân hàng ' + done('nh') + '</h3><p>Bảng có số tài khoản từng người, gửi ngân hàng để chuyển lương.</p><div class="cl-k"><span>Có tài khoản: <b>' + hasTk.length + '</b></span><span>Tổng tiền: <b>' + lgMoney(sum(hasTk)) + '</b></span>' + (noTk ? '<span style="color:var(--warn)">Chưa có tài khoản: <b>' + noTk + '</b></span>' : '') + '</div></button>' +
        '<button class="choice" data-act="cl-new" data-id="tm"><span class="ic">' + ic('cash') + '</span><h3>Lập bảng chi lương tiền mặt ' + done('tm') + '</h3><p>In ra để người lao động ký nhận khi nhận tiền.</p><div class="cl-k"><span>Người nhận: <b>' + pay.length + '</b></span><span>Tổng tiền: <b>' + lgMoney(sum(pay)) + '</b></span></div></button></div>';
    }
    var flt = f.t, list = saved.slice().sort(function (a, b) { return a.ym < b.ym ? 1 : a.ym > b.ym ? -1 : (a.n < b.n ? 1 : -1); }).filter(function (b) { return !flt || b.type === flt; });
    var bar = '<div class="gx-bar"><b style="margin-right:6px">Các bảng đã lập</b><div class="seg">' + [['', 'Tất cả'], ['tm', 'Tiền mặt'], ['nh', 'Ngân hàng']].map(function (x) { return '<button class="' + (flt === x[0] ? 'on' : '') + '" data-act="cl-flt" data-id="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><span class="gx-cnt">' + list.length + ' bản</span></div>';
    var cols = [{ id: 'stt', t: 'STT', w: 56 }, { id: 'ym', t: 'Tháng', w: 90 }, { id: 'loai', t: 'Loại bảng', w: 160 }, { id: 'so', t: 'Số', w: 100 }, { id: 'n', t: 'Số người', w: 80 }, { id: 'tot', t: 'Tổng tiền', unit: 'đồng', w: 140, hl: 1, bg: 'rgba(29,106,80,.07)' }, { id: 'at', t: 'Lập lúc', w: 160 }, { id: 'act', t: '', w: 260 }];
    var rows = list.map(function (b, i) { return { cells: [{ h: i + 1, cls: 'c' }, { h: HR.ymLabel(b.ym), cls: 'c' }, { h: '<span class="tag ' + (b.type === 'nh' ? 'tag-info' : 'tag-ok') + '">' + CL_T[b.type] + '</span>' + (b.v > 1 ? ' <span class="faint">bản ' + b.v + '</span>' : ''), cls: 'c' }, { h: esc(b.so || ''), cls: 'c' }, { h: b.rows.length, cls: 'c' }, { h: lgMoney(b.total), cls: 'n' }, { h: esc(b.at) + '<div class="faint">' + esc(b.by) + '</div>', cls: 'c' },
      { h: '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:nowrap"><button class="btn btn-sm" data-act="cl-view" data-id="' + b.id + '">Xem</button><button class="btn btn-sm" data-act="cl-print" data-id="' + b.id + '">In</button><button class="btn btn-sm" data-act="cl-xls" data-id="' + b.id + '">Excel</button><button class="btn btn-sm" data-act="cl-del" data-id="' + b.id + '">Xóa</button></div>', cls: 'c' }] }; });
    var tbl = list.length ? gxTable({ id: 'clTbl', cols: cols, rows: rows }).replace('class="gx-wrap"', 'class="gx-wrap cl-full"') : '<p class="faint" style="margin:6px 0">Chưa lập bảng chi lương nào' + (flt ? ' loại này' : '') + '.</p>';
    return head + top + ch + '<div class="gx-card">' + bar + tbl + '</div>';
  };
  ACTS['cl-u'] = function (a, id) { PS.cl.u = id; render(); };
  ACTS['cl-flt'] = function (a, id) { PS.cl.t = id; render(); };
  ACTS['cl-new'] = function (a, type) {
    var u = clUnit(), ym = PS.cl.ym, src = clSrc(u, ym).filter(function (r) { return r.amt > 0; }), nh = type === 'nh';
    var zero = clSrc(u, ym).length - src.length, noTk = src.filter(function (r) { return !r.stk; });
    var st = { scope: nh ? 'tk' : (clVer(u, ym, 'nh') && noTk.length ? 'notk' : 'all'), ngay: HR.vnDate(HR.isoToday()), nd: 'Luong thang ' + HR.ymLabel(ym) };
    var pick = function () { return nh ? src.filter(function (r) { return r.stk; }) : st.scope === 'notk' ? noTk : src; };
    var draft = function () { var rs = pick(); return { id: 'tmp', ym: ym, type: type, so: '', ngay: st.ngay, nd: st.nd, rows: rs, total: rs.reduce(function (s, r) { return s + r.amt; }, 0) }; };
    var opts = '<div class="cl-opt">' + (nh ? '' : '<div class="field"><label>Người đưa vào bảng</label><div class="seg" id="clSc"><button data-v="all" class="' + (st.scope === 'all' ? 'on' : '') + '">Tất cả (' + src.length + ')</button><button data-v="notk" class="' + (st.scope === 'notk' ? 'on' : '') + '">Chưa có tài khoản ngân hàng (' + noTk.length + ')</button></div></div>') +
      '<div class="field"><label for="clNg">Ngày chi</label><input class="input" id="clNg" value="' + esc(st.ngay) + '" style="width:130px"></div>' +
      (nh ? '<div class="field" style="flex:1;min-width:240px"><label for="clNd">Nội dung chuyển khoản (thêm mã NV ở cuối)</label><input class="input" id="clNd" value="' + esc(st.nd) + '" maxlength="60"></div>' : '') + '</div>' +
      (nh && noTk.length ? '<div class="notice warn" style="margin-bottom:10px">' + ic('info') + '<div><b>' + noTk.length + ' người chưa có số tài khoản</b> nên không có trong bảng ngân hàng: ' + esc(noTk.map(function (r) { return r.name; }).join(', ')) + '. Bổ sung ở Hồ sơ nhân sự, hoặc lập bảng chi tiền mặt cho những người này.</div></div>' : '') +
      (zero ? '<p class="faint" style="margin:0 0 8px">' + zero + ' người có thực lĩnh bằng 0 không đưa vào bảng.</p>' : '');
    var m = modal(nh ? 'Lập bảng đổ lương ngân hàng' : 'Lập bảng chi lương tiền mặt', 'Tháng ' + HR.ymLabel(ym) + ' · ' + shortUnit(u.name), opts + '<div class="cl-prev" id="clPv"></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="clSave">Lưu bảng</button></div>');
    var pv = function () { $('#clPv', m).innerHTML = clHtml(u, draft()); $('#clSave', m).disabled = !pick().length; };
    pv();
    var sc = $('#clSc', m); if (sc) sc.addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (!b) return; e.preventDefault(); st.scope = b.getAttribute('data-v'); Array.prototype.forEach.call(sc.children, function (x) { x.classList.toggle('on', x === b); }); pv(); });
    $('#clNg', m).addEventListener('input', function () { st.ngay = this.value.trim(); pv(); });
    var nd = $('#clNd', m); if (nd) nd.addEventListener('input', function () { st.nd = this.value.trim(); pv(); });
    $('#clSave', m).onclick = function () {
      var b = draft(), L = clList(u), n = L.reduce(function (mx, x) { return Math.max(mx, x.n || 0); }, 0) + 1, v = clVer(u, ym, type) + 1;
      b.id = 'cl' + Date.now().toString(36); b.n = n; b.v = v; b.at = nowVn(); b.by = ccUser(); b.so = (nh ? 'NH' : 'TM') + '-' + ym.replace('-', '') + (v > 1 ? '-' + v : '');
      b.rows = b.rows.map(function (r) { return { id: r.id, name: r.name, dept: r.dept, stk: r.stk, nh: r.nh, amt: r.amt }; });
      L.push(b); saveUnits(); log('Lập ' + CL_T[type].toLowerCase() + ' tháng ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + b.rows.length + ' người, ' + lgMoney(b.total) + ' đồng');
      var bg = this.closest('.modal-bg'); if (bg) bg.close(); toast('Đã lưu ' + (nh ? 'bảng đổ lương ngân hàng' : 'bảng chi lương tiền mặt') + ' số ' + b.so, 'ok'); render(); ACTS['cl-view'](null, b.id);
    };
  };
  function clFind(id) { var u = clUnit(); return { u: u, b: clList(u).filter(function (x) { return x.id === id; })[0] }; }
  ACTS['cl-view'] = function (a, id) {
    var x = clFind(id), u = x.u, b = x.b; if (!b) return;
    var m = modal(CL_T[b.type] + ' – tháng ' + HR.ymLabel(b.ym), 'Số ' + (b.so || '') + ' · lập ' + b.at + ' bởi ' + b.by, '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:10px"><button class="btn btn-sm" id="clX">' + ic('xuat', 14) + ' Xuất Excel</button><button class="btn btn-sm btn-primary" id="clP">In / lưu PDF</button></div><div class="cl-prev">' + clHtml(u, b) + '</div>');
    $('#clP', m).onclick = function () { clPrint(u, b); }; $('#clX', m).onclick = function () { clXls(u, b); };
  };
  ACTS['cl-print'] = function (a, id) { var x = clFind(id); if (x.b) clPrint(x.u, x.b); };
  ACTS['cl-xls'] = function (a, id) { var x = clFind(id); if (x.b) clXls(x.u, x.b); };
  ACTS['cl-del'] = function (a, id) {
    var x = clFind(id), u = x.u, b = x.b; if (!b) return;
    confirmBox('Xóa bảng chi lương số ' + (b.so || '') + '?', CL_T[b.type] + ' tháng ' + HR.ymLabel(b.ym) + ', ' + b.rows.length + ' người, ' + lgMoney(b.total) + ' đồng. Bảng lương và phiếu lương không bị ảnh hưởng.', 'Xóa', function () { u.chiL = clList(u).filter(function (y) { return y.id !== id; }); saveUnits(); log('Xóa bảng chi lương ' + (b.so || '') + ' (' + u.name + ')'); toast('Đã xóa'); render(); });
  };
  BINDS.chiluong = function () { var y = $('#clYm'); if (y) y.addEventListener('change', function () { PS.cl.ym = y.value; render(); }); };
