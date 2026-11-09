  /* =====================================================================
     CƠ CẤU NHÂN SỰ THEO THÁNG (0.4.1 – anh 09/11/2026 21:30, đứng đầu nhóm Lương)
       - Toàn bộ danh sách nhân sự + chế độ từng người: lương cơ bản, từng khoản trợ cấp, lương hiệu suất mục tiêu,
         người phụ thuộc, đoàn viên, cam kết thuế, giờ theo HĐ (bán thời gian)
       - Mỗi tháng 1 bảng cơ cấu (u.lgcc[ym]) → tổng quỹ lương dự kiến; DUYỆT trước ngày s.ccHan (mặc định 15), nhắc trước s.ccNhac ngày
       - Bảng cơ cấu đã duyệt là căn cứ của Bảng lương (lgCalc đọc qua lgEmpM); chốt bảng lương cần cơ cấu đã duyệt
     ===================================================================== */
  function ccuUnit() { var f = ps('ccu', { u: '', ym: '', q: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function ccuAddM(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + String(m + 1).padStart(2, '0'); }
  function ccuMonths(u) { var o = {}, cur = refDate().slice(0, 7); bcMonths().forEach(function (m) { o[m] = 1; }); Object.keys(u.lgcc || {}).forEach(function (m) { o[m] = 1; }); o[cur] = 1; o[ccuAddM(cur, 1)] = 1; return Object.keys(o).sort(); }
  function ccuLast(ym) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)); return d.toISOString().slice(0, 10); }
  function ccuPeople(u, ym) { var a = ym + '-01', b = ccuLast(ym); return (u.data.NV || []).filter(function (e) { if (!e['Mã NV']) return false; var l = lgIso(e['Ngày nghỉ việc']), j = lgIso(e['Ngày vào làm']); return (!l || l >= a) && (!j || j <= b); }); }
  function ccuPrev(u, ym) { var ks = Object.keys(u.lgcc || {}).filter(function (k) { return k < ym; }).sort(); return ks.length ? { ym: ks[ks.length - 1], emp: u.lgcc[ks[ks.length - 1]].emp } : null; }
  function ccuStd(u, ym) { try { var B = bcMonth(u, ym), o = {}; B.ppl.forEach(function (p) { o[p.id] = p.sum.std || 0; }); return o; } catch (e) { return {}; } }
  // hạn duyệt cơ cấu của tháng ym: { iso, left (ngày còn lại theo hôm nay), lv: ok | gap | canh | nhac }
  function ccuHan(u, ym) {
    var s = lgOf(u), d = Math.min(28, Math.max(1, +s.ccHan || 15)), iso = ym + '-' + String(d).padStart(2, '0'), today = refDate(), cc = lgccOf(u, ym);
    var left = lgDays(today, iso), lv = cc && cc.duyet ? 'ok' : left < 0 ? 'gap' : left <= (+s.ccNhac || 3) ? 'canh' : 'nhac';
    return { iso: iso, left: left, lv: lv, cc: cc };
  }
  // 1 dòng cơ cấu (dự kiến đủ công)
  function ccuRow(u, s, ym, e, E, std, L) {
    var id = e['Mã NV'], last = ccuLast(ym), r = HR.dnum(last), byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data);
    var c = HRR.currentContract(byHd[id], r), ct = c ? String(c['Loại hợp đồng'] || '') : '', sal = HRR.salaryAt(id, r, byHd, byLs), ld = ldOf(e), hr = ld !== 'Toàn thời gian';
    var pcv = c && c['Phụ cấp chức vụ'] ? lgAmt(c['Phụ cấp chức vụ']) : 0;
    (byLs[id] || []).forEach(function (x) { var d = lgIso(x['Ngày hiệu lực']); if (d && d <= last && x['Phụ cấp chức vụ'] !== '' && x['Phụ cấp chức vụ'] != null) pcv = lgAmt(x['Phụ cấp chức vụ']); });
    var cb = E.cb != null && E.cb !== '' ? +E.cb : sal ? sal.amount : 0, it = {}, cd = 0, nc = 0, days = std || 22;
    s.items.filter(function (x) { return x.cat === 'cd' || x.cat === 'nc'; }).forEach(function (x) {
      var v = x.kind === 'qty' ? lgEmpAmt(E, x, +x.price || 0) * days : lgEmpAmt(E, x, x.src === 'hd' ? pcv : +x.amt || 0); it[x.id] = v; if (x.cat === 'cd') cd += v; else nc += v;
    });
    var hs = +E.hs || 0, tn = cb + cd + nc + hs, ctv = HRR.isCtv(ct), prob = HRR.isProb(ct), ref = +L.ref.v || 0, T = L.tl.v;
    var bh = !!c && !ctv && !prob && !(hr && cb < ref), bhBase = cb + cd, b1 = Math.min(Math.max(bhBase, ref), 20 * ref), vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (L.lttv.v || [])[vg] || 0, b2 = Math.min(Math.max(bhBase, ref), 20 * ltM);
    var dn = bh ? b1 * (T.dnOm + T.dnHt + (+s.tnld || 0) + T.dnYt + T.kpcd) / 100 + b2 * T.dnTn / 100 : 0;
    var w = []; if (!sal && E.cb == null) w.push('Chưa có HĐ / quyết định lương'); if (!hr && bh && bhBase < ltM) w.push('Lương đóng BHXH thấp hơn lương tối thiểu vùng ' + lgMoney(ltM)); if (hr && !E.hrsHD && !E.hourly) w.push('Bán thời gian chưa nhập giờ theo HĐ');
    if (hs && cb && hs > cb * 1.5) w.push('Lương hiệu suất lớn hơn 1,5 lần lương cơ bản – cần quy chế đánh giá rõ ràng');
    return { id: id, e: e, E: E, name: e['Họ và tên'] || '', dept: e['Phòng ban'] || '(chưa có bộ phận)', cd0: e['Chức danh'] || e['Chức vụ'] || '', ld: ld, hr: hr, ct: ct, sal: sal ? sal.amount : null, pcv: pcv, cb: cb, it: it, cdT: cd, ncT: nc, tcT: cd + nc, bhBase: bh ? bhBase : 0, bh: bh, hs: hs, tn: tn, dn: dn, cost: tn + dn, w: w,
      short: ctv || prob || (c && !HRR.isIndef(ct) && lgIso(c['Ngày hiệu lực']) && lgIso(c['Ngày hết hạn']) && lgDays(lgIso(c['Ngày hiệu lực']), lgIso(c['Ngày hết hạn'])) < 90), npt0: +e['Số người phụ thuộc'] || 0 };
  }
  function ccuRows(u, ym) {
    var s = lgOf(u), L = {}, last = ccuLast(ym), std = ccuStd(u, ym); LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); });
    return ccuPeople(u, ym).map(function (e) { return ccuRow(u, s, ym, e, lgEmpM(u, s, ym, e['Mã NV']), std[e['Mã NV']], L); });
  }
  function ccuStyle() {
    if (document.getElementById('ccuCss')) return;
    var st = document.createElement('style'); st.id = 'ccuCss';
    st.textContent = '.ccu td,.ccu th{white-space:nowrap}.ccu th{vertical-align:bottom;white-space:normal;min-width:84px}.ccu th.gh{text-align:center;border-bottom:1px solid var(--line);background:rgba(127,127,127,.06)}.ccu td.n,.ccu th.n{text-align:right}.ccu .lg-num{width:108px}.ccu td.c-tc,.ccu th.c-tc{background:rgba(245,158,11,.08)}.ccu td.c-bh,.ccu th.c-bh{background:rgba(220,38,38,.1);font-weight:700}.ccu td.c-dk,.ccu th.c-dk{background:rgba(37,99,235,.08)}.ccu tr.sub td{font-weight:700;background:rgba(127,127,127,.08)}.ccu tr.tot td{font-weight:800;border-top:2px solid var(--line-2)}.ccu .chg input{border-color:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,.15)}.ccu td.bad{color:#c0392b}.ccu .tg{font-size:10.5px;font-weight:600;padding:1px 5px;border-radius:5px;margin-left:3px;white-space:nowrap}.ccu .tg-cd{background:rgba(13,148,136,.15);color:#0f766e}.ccu .tg-nc{background:rgba(245,158,11,.18);color:#92400e}.ccu-st{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;margin:0 0 12px}.ccu-w{font-size:12px;color:#b9770e;white-space:normal;min-width:200px}';
    document.head.appendChild(st);
  }
  PAGES.cocau = function () {
    lgStyle(); blStyle(); ccuStyle();
    var f = ps('ccu', { u: '', ym: '', q: '' }), u = ccuUnit(); if (!u) return pageHead('Cơ cấu nhân sự') + noData('dữ liệu');
    var s = lgOf(u), us = selUnits().length ? selUnits() : S.units, ms = ccuMonths(u);
    if (ms.indexOf(f.ym) < 0) f.ym = refDate().slice(0, 7);
    var ym = f.ym, H = ccuHan(u, ym), cc = H.cc, lock = !!(cc && cc.duyet), rows = ccuRows(u, ym), prev = ccuPrev(u, ym), base = cc ? null : Object.keys(u.lgcc || {}).filter(function (k) { return k <= ym; }).sort().pop();
    var right = '<button class="btn btn-sm" data-act="ccu-xls">' + ic('xuat', 15) + 'Xuất Excel</button><button class="btn btn-sm" data-act="ccu-han">Hạn duyệt</button>' + (lock ? '<button class="btn btn-sm" data-act="ccu-open">Mở lại</button>' : '<button class="btn btn-sm btn-primary" data-act="ccu-ok">Duyệt cơ cấu tháng ' + HR.ymLabel(ym) + '</button>');
    var head = pageHead('Cơ cấu nhân sự', 'Chế độ lương của từng người tháng ' + HR.ymLabel(ym) + ' tại <b>' + esc(shortUnit(u.name)) + '</b> · đơn vị: đồng · bảng đã duyệt là căn cứ làm Bảng lương', right);
    var pick = '<div class="bl-bar">' + (us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="ccu-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '') +
      '<select class="input" id="ccuYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { var c = lgccOf(u, m); return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + (c ? (c.duyet ? ' · đã duyệt' : ' · nháp') : ' · chưa lập') + '</option>'; }).join('') + '</select>' +
      '<input class="input" id="ccuQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q || '') + '" style="max-width:220px"></div>';
    var hanTxt = 'Hạn duyệt ' + HR.vnDate(H.iso);
    var st = '<div class="ccu-st">' + (lock ? '<span class="tag tag-ok">Đã duyệt</span><span>' + esc(cc.duyet.at) + ' · ' + esc(cc.duyet.by) + '</span>' : cc ? '<span class="tag tag-warn">Nháp – chưa duyệt</span>' : '<span class="tag">Chưa lập bảng tháng này</span>') +
      (lock ? '' : H.lv === 'gap' ? '<span class="tag tag-bad">Quá hạn duyệt ' + (-H.left) + ' ngày</span><span>' + hanTxt + '</span>' : H.lv === 'canh' ? '<span class="tag tag-warn">Còn ' + H.left + ' ngày đến hạn duyệt</span><span>' + hanTxt + '</span>' : '<span>' + hanTxt + '</span>') +
      '<span class="faint">Các khoản trợ cấp, thuế: <a href="#congthuc">Thiết lập công thức lương</a> · <a href="#" data-act="lg-hsqc">Hướng dẫn lập quy chế đánh giá hiệu suất</a></span></div>';
    if (!cc) st += '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>Chưa có bảng cơ cấu tháng ' + HR.ymLabel(ym) + ' – đang hiển thị theo ' + (base ? 'bảng cơ cấu tháng ' + HR.ymLabel(base) : 'mức gợi ý (lương HĐ / quyết định lương)') + '. Sửa ô bất kỳ hoặc bấm <a href="#" data-act="ccu-new">Tạo bảng cơ cấu tháng ' + HR.ymLabel(ym) + '</a> để lập bảng riêng.</div></div>';
    var T = function (k) { return rows.reduce(function (t, r) { return t + (+r[k] || 0); }, 0); }, P = prev ? (function () { var s2 = lgOf(u), L = {}, last = ccuLast(prev.ym), std = ccuStd(u, prev.ym); LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); }); var a = ccuPeople(u, prev.ym).map(function (e) { return ccuRow(u, s2, prev.ym, e, lgEmpM(u, s2, prev.ym, e['Mã NV']), std[e['Mã NV']], L); }); return { n: a.length, tn: a.reduce(function (t, r) { return t + r.tn; }, 0), cost: a.reduce(function (t, r) { return t + r.cost; }, 0), by: a.reduce(function (o, r) { o[r.id] = r; return o; }, {}) }; })() : null;
    var dif = function (a, b) { if (b == null) return ''; var d = a - b; return d ? '<em style="font-style:normal;font-size:12px;color:' + (d > 0 ? '#b45309' : '#15803d') + '"> ' + (d > 0 ? '+' : '−') + lgMoney(Math.abs(d)) + '</em>' : '<em style="font-style:normal;font-size:12px" class="faint"> không đổi</em>'; };
    var kpi = '<div class="bl-kpi"><div><span>Số người</span><b>' + rows.length + '</b>' + (P ? '<em style="font-style:normal;font-size:12px" class="faint"> tháng trước ' + P.n + '</em>' : '') + '</div><div><span>Tổng lương cơ bản</span><b>' + lgMoney(T('cb')) + '</b></div><div><span>Tổng trợ cấp</span><b>' + lgMoney(T('tcT')) + '</b></div><div><span>Lương hiệu suất mục tiêu</span><b>' + lgMoney(T('hs')) + '</b></div><div><span>Quỹ lương dự kiến (đủ công)</span><b>' + lgMoney(T('tn')) + '</b>' + dif(T('tn'), P && P.tn) + '</div><div><span>BH, KPCĐ công ty đóng</span><b>' + lgMoney(T('dn')) + '</b></div><div><span>Tổng chi phí dự kiến</span><b>' + lgMoney(T('cost')) + '</b>' + dif(T('cost'), P && P.cost) + '</div></div>';
    return head + pick + st + kpi + '<div id="ccuArea">' + ccuTable(u, s, ym, rows, lock, prev, f) + '</div>';
  };
  function ccuCols(s) {
    var tc = s.items.filter(function (x) { return x.cat === 'cd'; }).concat(s.items.filter(function (x) { return x.cat === 'nc'; })), uni = s.items.some(function (x) { return x.dk === 'union'; });
    return { tc: tc, uni: uni };
  }
  function ccuTable(u, s, ym, rows, lock, prev, f) {
    var K = ccuCols(s), q = norm(f.q || ''), dis = lock ? ' disabled' : '', pv = prev ? prev.emp : null;
    var inp = function (r, k, val, ph, cls) {
      var pvE = pv && pv[r.id], pvv = pvE ? (k.indexOf('a:') === 0 ? (pvE.amt || {})[k.slice(2)] : pvE[k]) : undefined, chg = pv && pvE && String(pvv == null ? '' : pvv) !== String(val == null ? '' : val);
      return '<td class="' + (cls || '') + (chg ? ' chg' : '') + '"' + (chg ? ' title="Tháng ' + HR.ymLabel(prev.ym) + ': ' + esc(pvv == null || pvv === '' ? 'để trống' : k === 'hrsHD' ? lgNum(pvv) : fmtInt(pvv)) + '"' : '') + '><input class="input lg-num" data-ccu="' + esc(r.id) + '" data-k="' + k + '" value="' + (val == null || val === '' ? '' : esc(k === 'hrsHD' ? lgNum(val) : fmtInt(val))) + '" placeholder="' + esc(ph || '') + '" inputmode="numeric" aria-label="' + esc(k + ' ' + r.id) + '"' + dis + '></td>';
    };
    var g1 = '<tr><th class="gh" colspan="6">Nhân sự</th><th class="gh" colspan="2">Lương</th>' + (K.tc.length ? '<th class="gh c-tc" colspan="' + (K.tc.length + 1) + '">Trợ cấp</th>' : '') + '<th rowspan="2" class="n c-bh">Lương đóng BHXH<br><span class="faint" style="font-weight:400">cơ bản + trợ cấp cố định</span></th><th rowspan="2" class="n">Lương hiệu suất mục tiêu</th><th class="gh c-dk" colspan="3">Dự kiến đủ công</th><th class="gh" colspan="' + (4 + (K.uni ? 1 : 0)) + '">Thuế, khác</th><th rowspan="2">Lưu ý</th></tr>';
    var g2 = '<tr><th>STT</th><th>Mã NV</th><th>Họ và tên</th><th>Bộ phận</th><th>Chức danh</th><th>Loại LĐ / HĐ</th><th class="n">Lương trên HĐ / QĐ</th><th class="n">Lương cơ bản<br><span class="faint" style="font-weight:400">đóng BHXH</span></th>' +
      K.tc.map(function (x) { return '<th class="n c-tc">' + esc(x.t) + '<span class="tg ' + (x.cat === 'cd' ? 'tg-cd">cố định' : 'tg-nc">ngày công') + '</span>' + (x.kind === 'qty' ? '<br><span class="faint" style="font-weight:400">đ/ngày</span>' : '') + '</th>'; }).join('') + (K.tc.length ? '<th class="n c-tc">Cộng trợ cấp</th>' : '') +
      '<th class="n c-dk">Tổng thu nhập</th><th class="n c-dk">BH, KPCĐ công ty</th><th class="n c-dk">Tổng chi phí</th><th class="n">Người phụ thuộc</th>' + (K.uni ? '<th>Đoàn viên</th>' : '') + '<th title="Cam kết thu nhập chưa đến mức nộp thuế – NĐ 253/2026 Điều 50.2">Cam kết thuế</th><th>Giờ theo HĐ / tháng</th><th>Đơn giá giờ</th></tr>';
    var list = rows.filter(function (r) { return !q || norm(r.id + ' ' + r.name).indexOf(q) >= 0; }), depts = [], by = {};
    list.forEach(function (r) { if (!by[r.dept]) { by[r.dept] = []; depts.push(r.dept); } by[r.dept].push(r); });
    var nCol = 6 + 2 + (K.tc.length ? K.tc.length + 1 : 0) + 2 + 3 + 4 + (K.uni ? 1 : 0) + 1, i = 0;
    var sumRow = function (a, label, cls) { var S2 = function (k) { return a.reduce(function (t, r) { return t + (+r[k] || 0); }, 0); }; return '<tr class="' + cls + '"><td colspan="6">' + esc(label) + ' · ' + a.length + ' người</td><td class="n">' + lgMoney(a.reduce(function (t, r) { return t + (r.sal || 0); }, 0)) + '</td><td class="n">' + lgMoney(S2('cb')) + '</td>' + K.tc.map(function (x) { return '<td class="n c-tc">' + lgMoney(a.reduce(function (t, r) { return t + (r.it[x.id] || 0); }, 0)) + '</td>'; }).join('') + (K.tc.length ? '<td class="n c-tc">' + lgMoney(S2('tcT')) + '</td>' : '') + '<td class="n c-bh">' + lgMoney(S2('bhBase')) + '</td><td class="n">' + lgMoney(S2('hs')) + '</td><td class="n c-dk">' + lgMoney(S2('tn')) + '</td><td class="n c-dk">' + lgMoney(S2('dn')) + '</td><td class="n c-dk">' + lgMoney(S2('cost')) + '</td><td colspan="' + (nCol - 6 - 2 - (K.tc.length ? K.tc.length + 1 : 0) - 5) + '"></td></tr>'; };
    var body = depts.map(function (d, di) {
      return '<tr class="sub"><td colspan="' + nCol + '">' + String.fromCharCode(65 + di) + '. ' + esc(d) + '</td></tr>' + by[d].map(function (r) {
        var E = r.E;
        return '<tr><td>' + (++i) + '</td><td>' + esc(r.id) + '</td><td><b>' + esc(r.name) + '</b></td><td>' + esc(r.dept) + '</td><td>' + esc(r.cd0) + '</td><td>' + esc(r.ld) + '<div class="faint">' + esc(r.ct || 'chưa có HĐ') + '</div></td><td class="n">' + (r.sal != null ? lgMoney(r.sal) : '<span class="tag tag-bad">Chưa có</span>') + '</td>' +
          inp(r, 'cb', E.cb, r.sal != null ? lgMoney(r.sal) : '') +
          K.tc.map(function (x) { return inp(r, 'a:' + x.id, E.amt[x.id], x.kind === 'qty' ? lgMoney(x.price) : x.src === 'hd' ? lgMoney(r.pcv) : lgMoney(x.amt), 'c-tc'); }).join('') + (K.tc.length ? '<td class="n c-tc">' + lgMoney(r.tcT) + '</td>' : '') +
          '<td class="n c-bh' + (r.w.some(function (w) { return /tối thiểu/.test(w); }) ? ' bad' : '') + '">' + (r.bh ? lgMoney(r.bhBase) : '<span class="faint">không đóng</span>') + '</td>' + inp(r, 'hs', E.hs, '0') +
          '<td class="n c-dk">' + lgMoney(r.tn) + '</td><td class="n c-dk">' + lgMoney(r.dn) + '</td><td class="n c-dk">' + lgMoney(r.cost) + '</td>' + inp(r, 'npt', E.npt, String(r.npt0)) +
          (K.uni ? '<td><input type="checkbox" data-ccu="' + esc(r.id) + '" data-k="union"' + (E.union ? ' checked' : '') + dis + ' aria-label="Đoàn viên ' + esc(r.id) + '"></td>' : '') +
          '<td>' + (r.short ? '<label class="lg-chk"><input type="checkbox" data-ccu="' + esc(r.id) + '" data-k="cam08"' + (E.cam08 ? ' checked' : '') + dis + '> có</label>' : '<span class="faint">—</span>') + '</td>' +
          (r.hr ? inp(r, 'hrsHD', E.hrsHD, 'chưa nhập') + inp(r, 'hourly', E.hourly, E.hrsHD ? lgMoney(r.cb / E.hrsHD) : 'tự tính') : '<td class="faint">—</td><td class="faint">—</td>') +
          '<td class="ccu-w">' + esc(r.w.join(' · ')) + '</td></tr>';
      }).join('') + sumRow(by[d], 'Cộng ' + d, 'sub');
    }).join('') + sumRow(list, 'Tổng cộng', 'tot');
    return '<div class="card card-pad"><p class="lg-law" style="margin-top:0"><b>Lương cơ bản</b> là căn cứ đóng BHXH (để trống = lương trên HĐ / quyết định lương; không thấp hơn lương tối thiểu vùng). <b>Lương đóng BHXH</b> = lương cơ bản + trợ cấp cố định. Phần còn lại của mức lương thỏa thuận đặt vào trợ cấp theo ngày công và lương hiệu suất. Ô viền cam là khác tháng trước (rê chuột để xem). Ô trống dùng mức mặc định của khoản. ' + (lock ? '<b>Bảng đã duyệt – muốn sửa bấm Mở lại.</b>' : 'Nhập xong tự lưu.') + '</p><div class="tbl-wrap"><table class="tbl ccu"><thead>' + g1 + g2 + '</thead><tbody>' + body + '</tbody></table></div></div>';
  }
  ACTS['ccu-u'] = function (a, id) { PS.ccu.u = id; render(); };
  ACTS['ccu-new'] = function () { var u = ccuUnit(), ym = PS.ccu.ym, c = lgccEnsure(u, ym); c.log.push({ at: nowVn(), by: ccUser(), t: 'tạo bảng cơ cấu' }); u.ver = (u.ver || 0) + 1; saveUnits(); log('Cơ cấu nhân sự ' + HR.ymLabel(ym) + ' (' + u.name + '): tạo bảng'); toast('Đã tạo bảng cơ cấu tháng ' + HR.ymLabel(ym)); render(); };
  ACTS['ccu-ok'] = function () {
    var u = ccuUnit(), ym = PS.ccu.ym, rows = ccuRows(u, ym), bad = rows.filter(function (r) { return r.w.length; }), tn = rows.reduce(function (t, r) { return t + r.tn; }, 0), cost = rows.reduce(function (t, r) { return t + r.cost; }, 0);
    var m = modal('Duyệt cơ cấu nhân sự tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<p>' + rows.length + ' người · quỹ lương dự kiến <b>' + lgMoney(tn) + ' đồng</b> · tổng chi phí dự kiến <b>' + lgMoney(cost) + ' đồng</b>.</p>' + (bad.length ? '<div class="notice warn">' + ic('info') + '<div><b>' + bad.length + ' người có lưu ý:</b><br>' + bad.map(function (r) { return esc(r.name) + ': ' + esc(r.w.join('; ')); }).join('<br>') + '</div></div>' : '') + '<p class="lg-law">Sau khi duyệt, bảng cơ cấu là căn cứ tính Bảng lương tháng ' + HR.ymLabel(ym) + ' và bị khóa; muốn sửa phải Mở lại (ghi lý do). Tháng sau sẽ lập từ bảng này.</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ccuOk">Duyệt</button></div>', true);
    $('#ccuOk', m).onclick = function () { var c = lgccEnsure(u, ym); c.duyet = { at: nowVn(), by: ccUser() }; c.log.push({ at: c.duyet.at, by: c.duyet.by, t: 'duyệt cơ cấu (' + rows.length + ' người, quỹ lương ' + lgMoney(tn) + ')' }); u.ver = (u.ver || 0) + 1; saveUnits(); log('Cơ cấu nhân sự ' + HR.ymLabel(ym) + ' (' + u.name + '): duyệt'); m.close(); toast('Đã duyệt cơ cấu tháng ' + HR.ymLabel(ym), 'ok'); render(); };
  };
  ACTS['ccu-open'] = function () {
    var u = ccuUnit(), ym = PS.ccu.ym; if (u.lgm && u.lgm[ym] && u.lgm[ym].lock) { toast('Bảng lương tháng ' + HR.ymLabel(ym) + ' đã chốt – mở lại bảng lương trước', 'warn'); return; }
    var m = modal('Mở lại cơ cấu tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<div class="field"><label for="ccuWhy">Lý do mở lại *</label><input class="input" id="ccuWhy" maxlength="200"></div><p id="ccuMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="ccuOk">Mở lại</button></div>', true);
    $('#ccuOk', m).onclick = function () { var w = $('#ccuWhy', m).value.trim(); if (!w) { $('#ccuMsg', m).textContent = 'Nhập lý do'; return; } var c = lgccEnsure(u, ym); c.duyet = null; c.log.push({ at: nowVn(), by: ccUser(), t: 'mở lại – ' + w }); u.ver = (u.ver || 0) + 1; saveUnits(); log('Cơ cấu nhân sự ' + HR.ymLabel(ym) + ' (' + u.name + '): mở lại – ' + w); m.close(); toast('Đã mở lại'); render(); };
  };
  ACTS['ccu-han'] = function () {
    var u = ccuUnit(), s = lgOf(u), opt = function (a, v) { return a.map(function (x) { return '<option value="' + x[0] + '"' + (+x[0] === +v ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(''); };
    var m = modal('Hạn duyệt cơ cấu nhân sự', shortUnit(u.name), '<div class="field"><label for="ccuD">Duyệt bảng cơ cấu trước ngày (hằng tháng)</label><select class="input" id="ccuD">' + opt(Array.from({ length: 28 }, function (x, i) { return [i + 1, 'Ngày ' + (i + 1)]; }), s.ccHan || 15) + '</select></div><div class="field"><label for="ccuN">Nhắc trước</label><select class="input" id="ccuN">' + opt([[1, '1 ngày'], [3, '3 ngày'], [5, '5 ngày'], [7, '7 ngày']], s.ccNhac || 3) + '</select></div><p class="lg-law">Nhắc hiện ở Việc cần xử lý, Bảng lương và trang này cho đến khi bảng cơ cấu tháng được duyệt.</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ccuOk">Lưu</button></div>', true);
    $('#ccuOk', m).onclick = function () { s.ccHan = +$('#ccuD', m).value; s.ccNhac = +$('#ccuN', m).value; lgSave(u, 'hạn duyệt cơ cấu ngày ' + s.ccHan + ', nhắc trước ' + s.ccNhac + ' ngày'); m.close(); toast('Đã lưu'); render(); };
  };
  ACTS['ccu-xls'] = function () {
    var u = ccuUnit(), s = lgOf(u), ym = PS.ccu.ym, rows = ccuRows(u, ym), K = ccuCols(s), cc = lgccOf(u, ym);
    var cols = [{ t: 'STT', w: 6 }, { t: 'Mã NV', w: 9 }, { t: 'Họ và tên', w: 24 }, { t: 'Bộ phận', w: 18 }, { t: 'Chức danh', w: 16 }, { t: 'Loại LĐ', w: 14 }, { t: 'Lương trên HĐ / QĐ' }, { t: 'Lương cơ bản', hl: 1 }].concat(K.tc.map(function (x) { return { t: x.t + (x.cat === 'cd' ? ' (cố định)' : ' (ngày công)') }; }), K.tc.length ? [{ t: 'Cộng trợ cấp', hl: 1 }] : [], [{ t: 'Lương đóng BHXH', hl: 1 }, { t: 'Lương hiệu suất mục tiêu' }, { t: 'Tổng thu nhập dự kiến', hl: 1 }, { t: 'BH, KPCĐ công ty' }, { t: 'Tổng chi phí dự kiến', hl: 1 }, { t: 'Người phụ thuộc' }, { t: 'Lưu ý', w: 40 }]);
    var n0 = 8, groups = [{ t: 'Nhân sự', from: 0, to: 5 }, { t: 'Lương', from: 6, to: 7 }]; if (K.tc.length) groups.push({ t: 'Trợ cấp', from: n0, to: n0 + K.tc.length }); var a = n0 + (K.tc.length ? K.tc.length + 1 : 0); groups.push({ t: 'Dự kiến đủ công', from: a + 2, to: a + 4 });
    var data = [], bold = [], by = {}, depts = [], i = 0; rows.forEach(function (r) { if (!by[r.dept]) { by[r.dept] = []; depts.push(r.dept); } by[r.dept].push(r); });
    var line = function (r, n) { return [n, r.id, r.name, r.dept, r.cd0, r.ld, r.sal, r.cb].concat(K.tc.map(function (x) { return Math.round(r.it[x.id] || 0); }), K.tc.length ? [r.tcT] : [], [r.bhBase, r.hs, Math.round(r.tn), Math.round(r.dn), Math.round(r.cost), r.E.npt != null && r.E.npt !== '' ? +r.E.npt : r.npt0, r.w.join(' · ')]); };
    var sum = function (a, t) { var row = [null, t, null, null, null, a.length + ' người']; for (var k = 6; k < cols.length - 2; k++) row.push(a.reduce(function (s0, r) { return s0 + (+line(r, 0)[k] || 0); }, 0)); row.push(null, null); return row; };
    depts.forEach(function (d, di) { data.push([String.fromCharCode(65 + di), d]); bold.push(data.length - 1); by[d].forEach(function (r) { data.push(line(r, ++i)); }); data.push(sum(by[d], 'Cộng ' + d)); bold.push(data.length - 1); });
    data.push(sum(rows, 'TỔNG CỘNG')); bold.push(data.length - 1);
    saveXlsx([{ name: 'Co cau ' + ym, title: 'BẢNG CƠ CẤU NHÂN SỰ – QUỸ LƯƠNG DỰ KIẾN THÁNG ' + HR.ymLabel(ym), note: u.name + ' · đơn vị: đồng · ' + (cc && cc.duyet ? 'đã duyệt ' + cc.duyet.at + ' bởi ' + cc.duyet.by : 'CHƯA DUYỆT'), cols: cols, groups: groups, rows: data, bold: bold }], fileName('Co cau nhan su ' + HR.ymLabel(ym) + ' ' + shortUnit(u.name)));
  };
  BINDS.cocau = function () {
    var y = $('#ccuYm'); if (y) y.addEventListener('change', function () { PS.ccu.ym = y.value; render(); });
    var q = $('#ccuQ'); if (q) q.addEventListener('input', function () { PS.ccu.q = q.value; clearTimeout(q._t); q._t = setTimeout(function () { var p = q.selectionStart; render(); var q2 = $('#ccuQ'); if (q2) { q2.focus(); q2.setSelectionRange(p, p); } }, 250); });
    document.querySelectorAll('[data-ccu]').forEach(function (el) {
      el.addEventListener('change', function () {
        var u = ccuUnit(), ym = PS.ccu.ym, c = lgccEnsure(u, ym); if (c.duyet) { toast('Bảng đã duyệt – bấm Mở lại để sửa', 'warn'); render(); return; }
        var id = el.getAttribute('data-ccu'), k = el.getAttribute('data-k'), E = c.emp[id] || (c.emp[id] = { amt: {} }); E.amt = E.amt || {};
        var raw = k === 'hrsHD' ? el.value.replace(',', '.').replace(/[^\d.]/g, '') : el.value.replace(/[^\d]/g, ''), val = el.type === 'checkbox' ? el.checked : (raw === '' ? '' : +raw);
        if (k.indexOf('a:') === 0) E.amt[k.slice(2)] = val; else E[k] = val;
        u.ver = (u.ver || 0) + 1; saveUnits(); toast('Đã lưu');
        var sy = window.scrollY, w = $('#ccuArea .tbl-wrap'), sx = w ? w.scrollLeft : 0; render(); window.scrollTo(0, sy); var w2 = $('#ccuArea .tbl-wrap'); if (w2) w2.scrollLeft = sx;
      });
    });
  };
