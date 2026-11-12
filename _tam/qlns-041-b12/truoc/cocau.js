  /* =====================================================================
     CƠ CẤU NHÂN SỰ THEO THÁNG (0.4.1 – anh 09/11/2026 21:30, đứng đầu nhóm Lương)
       - Toàn bộ danh sách nhân sự + chế độ từng người: lương cơ bản, từng khoản trợ cấp, lương hiệu suất mục tiêu,
         người phụ thuộc, đoàn viên, cam kết thuế, giờ theo HĐ (bán thời gian)
       - Mỗi tháng 1 bảng cơ cấu (u.lgcc[ym]) → tổng quỹ lương dự kiến; DUYỆT trước ngày s.ccHan (mặc định 15), nhắc trước s.ccNhac ngày
       - Bảng cơ cấu đã duyệt là căn cứ của Bảng lương (lgCalc đọc qua lgEmpM); chốt bảng lương cần cơ cấu đã duyệt
       - 22:16: lọc thay dòng nhóm, dòng tổng theo lọc, 3 tầng tiêu đề (đơn vị tính; trợ cấp ngày công chọn đ/ngày | đ/tháng), ghim tiêu đề + 3 cột,
         Lưu ý = biểu tượng, Toàn màn hình, chọn cột, Lấy dữ liệu từ tháng trước (tự cập nhật theo HĐ / QĐ lương mới – ô nền xanh ●, c.chg)
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
  // 1 dòng cơ cấu (dự kiến đủ công) – 22:16: đơn vị trợ cấp theo ngày công đ/ngày | đ/tháng theo bảng cơ cấu tháng
  function ccuSal(u, id, iso) { var d = u.data, byHd = HRR.contractsOf(d), byLs = HRR.lsOf(d), r = HR.dnum(iso), c = HRR.currentContract(byHd[id], r), sal = HRR.salaryAt(id, r, byHd, byLs), pcv = c && c['Phụ cấp chức vụ'] ? lgAmt(c['Phụ cấp chức vụ']) : 0, src = '';
    (byLs[id] || []).forEach(function (x) { var dd = lgIso(x['Ngày hiệu lực']); if (dd && dd <= iso && x['Phụ cấp chức vụ'] !== '' && x['Phụ cấp chức vụ'] != null) { pcv = lgAmt(x['Phụ cấp chức vụ']); src = 'QĐ ' + (x['Số quyết định'] || '') + ' hiệu lực ' + HR.vnDate(dd); } });
    var ls = (byLs[id] || []).filter(function (x) { var dd = lgIso(x['Ngày hiệu lực']); return dd && dd <= iso; }).sort(function (a, b) { return lgIso(a['Ngày hiệu lực']) < lgIso(b['Ngày hiệu lực']) ? -1 : 1; }).pop();
    return { c: c, sal: sal ? sal.amount : null, salSrc: ls ? (ls['Số quyết định'] ? 'QĐ ' + ls['Số quyết định'] : 'Quyết định lương') + ' hiệu lực ' + HR.vnDate(lgIso(ls['Ngày hiệu lực'])) : c ? 'HĐ ' + (c['Số hợp đồng'] || '') + ' hiệu lực ' + HR.vnDate(lgIso(c['Ngày hiệu lực'])) : '', pcv: pcv, pcSrc: src || (c ? 'HĐ ' + (c['Số hợp đồng'] || '') : ''), hs: lgHsAt(u, id, iso) };
  }
  function ccuRow(u, s, ym, e, E, std, L) {
    var id = e['Mã NV'], last = ccuLast(ym), H = ccuSal(u, id, last), c = H.c, ct = c ? String(c['Loại hợp đồng'] || '') : '', ld = ldOf(e), hr = ld !== 'Toàn thời gian', pcv = H.pcv;
    var cb = E.cb != null && E.cb !== '' ? +E.cb : H.sal || 0, it = {}, cd = 0, nc = 0, days = std || 22;
    s.items.filter(function (x) { return x.cat === 'cd' || x.cat === 'nc'; }).forEach(function (x) {
      var kd = lgKind(u, ym, x), v = kd === 'qty' ? lgEmpAmt(E, x, +x.price || 0) * days : lgEmpAmt(E, x, x.src === 'hd' ? pcv : +x.amt || 0); it[x.id] = v; if (x.cat === 'cd') cd += v; else nc += v;
    });
    var hs = E.hs != null && E.hs !== '' ? +E.hs : H.hs || 0, tn = cb + cd + nc + hs, ctv = HRR.isCtv(ct), prob = HRR.isProb(ct), ref = +L.ref.v || 0, T = L.tl.v;
    var bh = !!c && !ctv && !prob && !(hr && cb < ref), bhBase = cb + cd, b1 = Math.min(Math.max(bhBase, ref), 20 * ref), vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (L.lttv.v || [])[vg] || 0, b2 = Math.min(Math.max(bhBase, ref), 20 * ltM);
    var dn = bh ? b1 * (T.dnOm + T.dnHt + (+s.tnld || 0) + T.dnYt + T.kpcd) / 100 + b2 * T.dnTn / 100 : 0, w = [];
    if (!H.sal && (E.cb == null || E.cb === '')) w.push({ lv: 'bad', t: 'Chưa có HĐ / quyết định lương còn hiệu lực' });
    if (!hr && bh && bhBase < ltM) w.push({ lv: 'bad', t: 'Lương đóng BHXH ' + lgMoney(bhBase) + ' thấp hơn lương tối thiểu vùng ' + lgMoney(ltM) + ' (BLLĐ Điều 90.2)' });
    if (bh && H.sal && cb < H.sal) w.push({ lv: 'bad', t: 'Lương cơ bản (đóng BHXH) ' + lgMoney(cb) + ' thấp hơn mức lương ghi trên HĐ / quyết định lương ' + lgMoney(H.sal) + '. Theo NĐ 158/2025 Điều 7.1.a, lương đóng BHXH gồm mức lương thỏa thuận trong HĐLĐ – cần ghi HĐ / phụ lục đúng mức lương cơ bản, lương hiệu suất trả theo quy chế' });
    // 10/11 anh: khoản cố định (đóng BHXH) phải khớp HĐ – khác HĐ thì nhắc lập phụ lục; trợ cấp theo ngày công đi theo quy chế, không nhắc
    if (c && !ctv) {
      var hdN = H.salSrc || 'HĐ / quyết định lương';
      if (H.sal && E.cb != null && E.cb !== '' && cb > H.sal) w.push({ lv: 'warn', t: 'Lương cơ bản ' + lgMoney(cb) + ' khác mức lương trên ' + hdN + ' (' + lgMoney(H.sal) + ') – cần lập phụ lục HĐ / quyết định điều chỉnh lương (BLLĐ Điều 22)' });
      if (E.hs != null && E.hs !== '' && hs !== (H.hs || 0)) w.push({ lv: 'warn', t: 'Lương hiệu suất mục tiêu ' + lgMoney(hs) + ' khác mức trên HĐ / quyết định (' + lgMoney(H.hs || 0) + ') – cần lập phụ lục HĐ / quyết định' });
      s.items.filter(function (x) { return x.cat === 'cd'; }).forEach(function (x) {
        var v = it[x.id] || 0;
        if (x.src === 'hd') { if (v !== pcv) w.push({ lv: 'warn', t: x.t + ' ' + lgMoney(v) + ' khác mức trên ' + (H.pcSrc || 'HĐ') + ' (' + lgMoney(pcv) + ') – cần lập phụ lục HĐ (BLLĐ Điều 22)' }); }
        else if (v > 0) w.push({ lv: 'warn', t: x.t + ' ' + lgMoney(v) + ' là khoản cố định, đóng BHXH – cần ghi mức này trong HĐ / phụ lục HĐ (TT 10/2020 Điều 3.5.b; NĐ 158/2025 Điều 7.1.b)' });
      });
    }
    if (hr && !E.hrsHD && !E.hourly) w.push({ lv: 'warn', t: 'Bán thời gian chưa nhập giờ làm theo HĐ / tháng' });
    if (hs && cb && hs > cb * 1.5) w.push({ lv: 'warn', t: 'Lương hiệu suất lớn hơn 1,5 lần lương cơ bản – cần quy chế đánh giá hiệu suất rõ ràng (NĐ 158/2025 Điều 7)' });
    return { id: id, e: e, E: E, name: e['Họ và tên'] || '', dept: e['Phòng ban'] || '(chưa có bộ phận)', cd0: e['Chức danh'] || e['Chức vụ'] || '', ld: ld, hr: hr, ct: ct, sal: H.sal, salSrc: H.salSrc, hsH: H.hs || 0, hdT: H.sal != null ? H.sal + pcv + (H.hs || 0) : 0, pcv: pcv, cb: cb, it: it, cdT: cd, ncT: nc, tcT: cd + nc, bhBase: bh ? bhBase : 0, bh: bh, hs: hs, tn: tn, dn: dn, cost: tn + dn, w: w, std: days,
      short: ctv || prob || (c && !HRR.isIndef(ct) && lgIso(c['Ngày hiệu lực']) && lgIso(c['Ngày hết hạn']) && lgDays(lgIso(c['Ngày hiệu lực']), lgIso(c['Ngày hết hạn'])) < 90), npt0: +e['Số người phụ thuộc'] || 0 };
  }
  function ccuRows(u, ym) {
    var s = lgOf(u), L = {}, last = ccuLast(ym), std = ccuStd(u, ym); LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); });
    return ccuPeople(u, ym).map(function (e) { return ccuRow(u, s, ym, e, lgEmpM(u, s, ym, e['Mã NV']), std[e['Mã NV']], L); });
  }
  PAGES.cocau = function () {
    lgStyle(); blStyle(); gxStyle();
    var f = ps('ccu', { u: '', ym: '', q: '', dp: '', ld: '', note: false, full: false }), u = ccuUnit(); if (!u) return pageHead('Cơ cấu nhân sự') + noData('dữ liệu');
    var s = lgOf(u), us = selUnits().length ? selUnits() : S.units, ms = ccuMonths(u);
    if (ms.indexOf(f.ym) < 0) f.ym = refDate().slice(0, 7);
    var ym = f.ym, H = ccuHan(u, ym), cc = H.cc, lock = !!(cc && cc.duyet), rows = ccuRows(u, ym), prev = ccuPrev(u, ym), base = cc ? null : Object.keys(u.lgcc || {}).filter(function (k) { return k <= ym; }).sort().pop();
    var right = '<button class="btn btn-sm" data-act="ccu-xls">' + ic('xuat', 15) + 'Xuất Excel</button><button class="btn btn-sm" data-act="ccu-han">Hạn duyệt</button>' + (lock ? '<button class="btn btn-sm" data-act="ccu-open">Mở lại</button>' : '<button class="btn btn-sm btn-primary" data-act="ccu-ok">Duyệt cơ cấu tháng ' + HR.ymLabel(ym) + '</button>');
    var head = pageHead('Cơ cấu nhân sự', 'Chế độ lương của từng người tháng ' + HR.ymLabel(ym) + ' tại <b>' + esc(shortUnit(u.name)) + '</b> · bảng đã duyệt là căn cứ làm Bảng lương', right);
    var pick = '<div class="bl-bar">' + (us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="ccu-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '') +
      '<select class="input" id="ccuYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { var c = lgccOf(u, m); return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + (c ? (c.duyet ? ' · đã duyệt' : ' · nháp') : ' · chưa lập') + '</option>'; }).join('') + '</select></div>';
    var hanTxt = 'Hạn duyệt ' + HR.vnDate(H.iso);
    var st = '<div class="ccu-st">' + (lock ? '<span class="tag tag-ok">Đã duyệt</span><span>' + esc(cc.duyet.at) + ' · ' + esc(cc.duyet.by) + '</span>' : cc ? '<span class="tag tag-warn">Nháp – chưa duyệt</span>' + (cc.from ? '<span class="faint">lấy từ tháng ' + HR.ymLabel(cc.from) + ' lúc ' + esc(cc.tao || '') + '</span>' : '') : '<span class="tag">Chưa lập bảng tháng này</span>') +
      (lock ? '' : H.lv === 'gap' ? '<span class="tag tag-bad">Quá hạn duyệt ' + (-H.left) + ' ngày</span><span>' + hanTxt + '</span>' : H.lv === 'canh' ? '<span class="tag tag-warn">Còn ' + H.left + ' ngày đến hạn duyệt</span><span>' + hanTxt + '</span>' : '<span>' + hanTxt + '</span>') +
      '<span class="faint">Các khoản trợ cấp, thuế: <a href="#congthuc">Thiết lập công thức lương</a> · <a href="#" data-act="lg-hsqc">Hướng dẫn lập quy chế đánh giá hiệu suất</a></span></div>';
    if (u.source === 'sample' && !(u.data.HD || []).some(function (h) { return 'Lương hiệu suất mục tiêu' in h; })) st += '<div class="notice bad" style="margin-bottom:12px">' + ic('info') + '<div><b>Dữ liệu mẫu đang là bản cũ</b> (HĐ ghi cả thu nhập thỏa thuận nên báo lương cơ bản thấp hơn HĐ). Bấm <a href="#" data-act="sample">Dùng dữ liệu mẫu</a> để nạp bản mới: HĐ ghi lương cơ bản, phụ cấp chức vụ và lương hiệu suất mục tiêu.</div></div>';
    if (!cc) st += '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>Chưa có bảng cơ cấu tháng ' + HR.ymLabel(ym) + ' – đang hiển thị theo ' + (base ? 'bảng cơ cấu tháng ' + HR.ymLabel(base) : 'mức gợi ý (lương HĐ / quyết định lương)') + '. ' + (prev ? 'Bấm <b>Lấy dữ liệu từ tháng ' + HR.ymLabel(prev.ym) + '</b> để lập bảng – phần mềm tự cập nhật các thay đổi chắc chắn (HĐ, quyết định lương mới, người mới vào, người nghỉ).' : 'Sửa ô bất kỳ để lập bảng riêng.') + '</div></div>';
    var chgN = cc && cc.chg ? Object.keys(cc.chg).reduce(function (t, k) { return t + Object.keys(cc.chg[k]).length; }, 0) : 0;
    if (chgN && !lock) st += '<div class="notice" style="margin-bottom:12px;background:rgba(22,163,74,.1)">' + ic('info') + '<div><b>' + chgN + ' ô được tự cập nhật</b> theo HĐ / quyết định lương mới hoặc người mới vào làm – ô nền xanh có dấu ●, rê chuột hoặc chạm để đọc ghi chú. Kiểm tra lại trước khi duyệt.</div></div>';
    var T = function (k) { return rows.reduce(function (t, r) { return t + (+r[k] || 0); }, 0); }, P = prev ? (function () { var s2 = lgOf(u), L = {}, last = ccuLast(prev.ym), std = ccuStd(u, prev.ym); LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); }); var a = ccuPeople(u, prev.ym).map(function (e) { return ccuRow(u, s2, prev.ym, e, lgEmpM(u, s2, prev.ym, e['Mã NV']), std[e['Mã NV']], L); }); return { n: a.length, tn: a.reduce(function (t, r) { return t + r.tn; }, 0), cost: a.reduce(function (t, r) { return t + r.cost; }, 0) }; })() : null;
    var dif = function (a, b) { if (b == null) return ''; var d = a - b; return d ? '<em style="font-style:normal;font-size:12px;color:' + (d > 0 ? '#b45309' : '#15803d') + '"> ' + (d > 0 ? '+' : '−') + lgMoney(Math.abs(d)) + '</em>' : '<em style="font-style:normal;font-size:12px" class="faint"> không đổi</em>'; };
    var kpi = '<div class="bl-kpi"><div><span>Số người</span><b>' + rows.length + '</b>' + (P ? '<em style="font-style:normal;font-size:12px" class="faint"> tháng trước ' + P.n + '</em>' : '') + '</div><div><span>Tổng lương cơ bản</span><b>' + lgMoney(T('cb')) + '</b></div><div><span>Tổng trợ cấp</span><b>' + lgMoney(T('tcT')) + '</b></div><div><span>Lương hiệu suất mục tiêu</span><b>' + lgMoney(T('hs')) + '</b></div><div><span>Quỹ lương dự kiến (đủ công)</span><b>' + lgMoney(T('tn')) + '</b>' + dif(T('tn'), P && P.tn) + '</div><div><span>BH, KPCĐ công ty đóng</span><b>' + lgMoney(T('dn')) + '</b></div><div><span>Tổng chi phí dự kiến</span><b>' + lgMoney(T('cost')) + '</b>' + dif(T('cost'), P && P.cost) + '</div></div>';
    return head + pick + st + kpi + ccuTable(u, s, ym, rows, lock, prev, f, cc);
  };
  // cột của bảng cơ cấu: { id, t, g, unit, w, fixed, cell(r) → {h, cls, at}, sum: khóa cộng | null }
  function ccuColDefs(u, s, ym, rows, lock, prev, cc) {
    var dis = lock ? ' disabled' : '', pv = prev ? prev.emp : null, chg = (cc && cc.chg) || {}, tc = s.items.filter(function (x) { return x.cat === 'cd'; }).concat(s.items.filter(function (x) { return x.cat === 'nc'; })), uni = s.items.some(function (x) { return x.dk === 'union'; });
    var fmt = function (k, v) { return v == null || v === '' ? '' : k === 'hrsHD' ? lgNum(v) : fmtInt(v); };
    var inp = function (r, k, val, ph) {
      var E = r.E, pvE = pv && pv[r.id], pvv = pvE ? (k.indexOf('a:') === 0 ? (pvE.amt || {})[k.slice(2)] : pvE[k]) : undefined, a = chg[r.id] && chg[r.id][k], cls = 'n', at = '';
      if (a) { cls += ' auto'; at = ' title="' + esc(a) + '"'; }
      else if (pv && pvE && String(pvv == null ? '' : pvv) !== String(val == null ? '' : val)) { cls += ' chg'; at = ' title="Tháng ' + HR.ymLabel(prev.ym) + ': ' + esc(pvv == null || pvv === '' ? 'để trống (mức mặc định)' : fmt(k, pvv)) + '"'; }
      // 10/11: ô để trống hiện luôn mức mặc định (theo HĐ / thiết lập) bằng chữ thường, không để chữ mờ
      var dv = (val == null || val === '') && /^[\d.]+$/.test(String(ph || '')) ? ph : '', shown = dv || fmt(k, val);
      if (dv && !a) at += ' title="Mức mặc định (theo HĐ / quyết định lương hoặc thiết lập khoản) – sửa để đặt riêng cho người này"';
      return { h: '<input class="input" data-ccu="' + esc(r.id) + '" data-k="' + k + '" value="' + esc(shown) + '"' + (dv ? ' data-dflt="' + esc(dv) + '"' : ' placeholder="' + esc(ph || '') + '"') + ' inputmode="numeric" aria-label="' + esc(k + ' ' + r.id) + '"' + dis + '>', cls: cls, at: at };
    };
    var num = function (k, o) { return Object.assign({ cell: function (r) { return { h: lgMoney(r[k]), cls: 'n' }; }, sum: k, unit: 'đ/tháng' }, o); };
    var mw = function (k, mn) { return gxW(rows.map(function (r) { return lgMoney(r[k]); }).concat(['999.999.999']), mn || 84, 120); };
    var cols = [
      { id: 'stt', t: 'STT', w: 46, fixed: 1, cell: function (r, i) { return { h: i + 1, cls: 'c' }; } },
      { id: 'ma', t: 'Mã NV', w: gxW(rows.map(function (r) { return r.id; }), 56, 80), fixed: 1, cell: function (r) { return { h: esc(r.id) }; } },
      { id: 'ten', t: 'Họ và tên', w: gxW(rows.map(function (r) { return r.name; }), 120, 190), fixed: 1, cell: function (r) { var a = chg[r.id] && chg[r.id].moi; return { h: '<b>' + esc(r.name) + '</b>', cls: a ? 'auto' : '', at: a ? ' title="' + esc(a) + '"' : '' }; } },
      { id: 'bp', t: 'Bộ phận', w: gxW(rows.map(function (r) { return r.dept; }), 80, 150), cell: function (r) { return { h: esc(r.dept), at: ' title="' + esc(r.dept) + '"' }; } },
      { id: 'cdanh', t: 'Chức danh', w: gxW(rows.map(function (r) { return r.cd0; }), 80, 140), cell: function (r) { return { h: esc(r.cd0), at: ' title="' + esc(r.cd0) + '"' }; } },
      { id: 'ht', t: 'Chính thức / Thử việc', w: 96, cell: function (r) { var h = lgHt(r.ct); return { h: h === 'Thử việc' ? '<b style="color:#b45309">' + h + '</b>' : esc(h), at: ' title="' + esc((r.ct || 'chưa có HĐ') + (h === 'Thử việc' ? ' – không đóng BHXH, BHYT, BHTN' : '')) + '"' }; } },
      { id: 'ld', t: 'Loại lao động', w: gxW(rows.map(function (r) { return r.ld; }), 80, 130), cell: function (r) { return { h: esc(r.ld), at: ' title="' + esc(r.ct || 'chưa có HĐ') + '"' }; } },
      { id: 'hd', t: 'Tổng thu nhập theo HĐ / QĐ', g: 'Lương', w: mw('hdT'), unit: 'đ/tháng', sum: 'hdT', tip: 'Lương cơ bản + phụ cấp chức vụ + lương hiệu suất mục tiêu ghi trên HĐ / quyết định lương', cell: function (r) { var a = chg[r.id] && chg[r.id].hd; return { h: r.sal != null ? lgMoney(r.hdT) : '<span class="tag tag-bad">Chưa có</span>', cls: 'n' + (a ? ' auto' : ''), at: ' title="' + esc((a ? a + ' · ' : '') + (r.sal != null ? 'Lương cơ bản ' + lgMoney(r.sal) + ' + phụ cấp chức vụ ' + lgMoney(r.pcv) + ' + lương hiệu suất mục tiêu ' + lgMoney(r.hsH) + ' · ' : '') + (r.salSrc || '')) + '"' }; } },
      { id: 'cb', t: 'Lương cơ bản (đóng BHXH)', g: 'Lương', w: mw('cb', 100), unit: 'đ/tháng', sum: 'cb', bg: 'rgba(20,184,166,.12)', cell: function (r) { return inp(r, 'cb', r.E.cb, r.sal != null ? lgMoney(r.sal) : ''); } }
    ];
    tc.forEach(function (x) {
      var kd = lgKind(u, ym, x), un = x.cat === 'cd' ? 'thang' : lgccUnit(u, ym, x);
      cols.push({ id: 'a:' + x.id, t: esc(x.t), g: 'Trợ cấp', tip: x.cat === 'cd' ? 'Trợ cấp cố định – trả đủ tháng, tính vào lương đóng BHXH' : 'Trợ cấp theo ngày công – không đóng BHXH', w: 100, bg: 'rgba(245,158,11,.08)',
        unit: x.cat === 'cd' ? 'đ/tháng' : 'đ/<span class="ut" title="Đơn vị nhập của khoản này trong tháng: đ/ngày × ngày đi làm thực tế, hoặc đ/tháng × tỷ lệ ngày công"><button type="button" class="' + (un === 'ngay' ? 'on' : '') + '" data-act="ccu-unit" data-id="' + esc(x.id) + '|ngay"' + dis + '>ngày</button><button type="button" class="' + (un === 'thang' ? 'on' : '') + '" data-act="ccu-unit" data-id="' + esc(x.id) + '|thang"' + dis + '>tháng</button></span>',
        sumF: function (a) { return a.reduce(function (t, r) { return t + (r.it[x.id] || 0); }, 0); },
        cell: function (r) { return inp(r, 'a:' + x.id, r.E.amt[x.id], kd === 'qty' ? lgMoney(x.price) : x.src === 'hd' ? lgMoney(r.pcv) : lgMoney(x.amt)); } });
    });
    if (tc.length) cols.push(num('tcT', { id: 'tcT', t: 'Cộng trợ cấp', g: 'Trợ cấp', w: mw('tcT'), tip: 'Trợ cấp theo ngày (đ/ngày) quy ra tháng theo công chuẩn', bg: 'rgba(245,158,11,.16)', hl: 1 }));
    cols.push(num('bhBase', { id: 'bhb', t: 'Lương đóng BHXH', w: mw('bhBase', 96), tip: 'Lương cơ bản + trợ cấp cố định', bg: 'rgba(220,38,38,.1)', hl: 1, cell: function (r) { return { h: r.bh ? lgMoney(r.bhBase) : '<span class="faint">không đóng</span>', cls: 'n' + (r.w.some(function (w) { return /tối thiểu/.test(w.t); }) ? ' bad' : '') }; } }));
    cols.push({ id: 'hs', t: 'Lương hiệu suất mục tiêu', w: mw('hs', 96), unit: 'đ/tháng', sum: 'hs', tip: 'Mặc định theo cột Lương hiệu suất mục tiêu trên HĐ / quyết định lương', cell: function (r) { return inp(r, 'hs', r.E.hs, lgMoney(r.hsH)); } });
    cols.push(num('tn', { id: 'tn', t: 'Tổng thu nhập', g: 'Dự kiến đủ công', w: mw('tn'), bg: 'rgba(37,99,235,.08)', hl: 1 }), num('dn', { id: 'dn', t: 'BH, KPCĐ công ty đóng', g: 'Dự kiến đủ công', w: mw('dn') }), num('cost', { id: 'cost', t: 'Tổng chi phí', g: 'Dự kiến đủ công', w: mw('cost'), bg: 'rgba(37,99,235,.08)', hl: 1 }));
    cols.push({ id: 'npt', t: 'Người phụ thuộc', g: 'Thuế, khác', w: 64, unit: 'người', cell: function (r) { return inp(r, 'npt', r.E.npt, String(r.npt0)); } });
    if (uni) cols.push({ id: 'uni', t: 'Đoàn viên', g: 'Thuế, khác', w: 62, cell: function (r) { return { h: '<input type="checkbox" data-ccu="' + esc(r.id) + '" data-k="union"' + (r.E.union ? ' checked' : '') + dis + ' aria-label="Đoàn viên ' + esc(r.id) + '">', cls: 'c' }; } });
    cols.push({ id: 'cam', t: 'Cam kết thuế', g: 'Thuế, khác', w: 62, tip: 'Cam kết thu nhập chưa đến mức nộp thuế – NĐ 253/2026 Điều 50.2 (CTV, thử việc, HĐ dưới 3 tháng)', cell: function (r) { return { h: r.short ? '<input type="checkbox" data-ccu="' + esc(r.id) + '" data-k="cam08"' + (r.E.cam08 ? ' checked' : '') + dis + ' aria-label="Cam kết thuế ' + esc(r.id) + '">' : '<span class="faint">—</span>', cls: 'c' }; } });
    cols.push({ id: 'hrs', t: 'Giờ làm theo HĐ', g: 'Bán thời gian', w: 70, unit: 'giờ/tháng', cell: function (r) { return r.hr ? inp(r, 'hrsHD', r.E.hrsHD, 'chưa nhập') : { h: '<span class="faint">—</span>', cls: 'c' }; } });
    cols.push({ id: 'hourly', t: 'Đơn giá giờ', g: 'Bán thời gian', w: 84, unit: 'đ/giờ', cell: function (r) { return r.hr ? inp(r, 'hourly', r.E.hourly, r.E.hrsHD ? lgMoney(r.cb / r.E.hrsHD) : 'tự tính') : { h: '<span class="faint">—</span>', cls: 'c' }; } });
    cols.push({ id: 'note', t: 'Lưu ý', w: 58, cell: function (r) { return { h: gxNote(r.w), cls: 'c' }; } });
    return cols;
  }
  function ccuFilter(rows, f) { var q = norm(f.q || ''); return rows.filter(function (r) { return (!q || norm(r.id + ' ' + r.name).indexOf(q) >= 0) && (!f.dp || r.dept === f.dp) && (!f.ld || r.ld === f.ld) && (!f.ht || lgHt(r.ct) === f.ht) && (!f.note || r.w.length); }); }
  function ccuTable(u, s, ym, rows, lock, prev, f, cc) {
    var all = ccuColDefs(u, s, ym, rows, lock, prev, cc), hid = S.settings.ccuHide || {}, cols = all.filter(function (c) { return c.fixed || !hid[c.id]; }), list = ccuFilter(rows, f);
    var dps = rows.map(function (r) { return r.dept; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), lds = rows.map(function (r) { return r.ld; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), hts = rows.map(function (r) { return lgHt(r.ct); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var bar = '<div class="gx-bar"><input class="input" id="ccuQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q || '') + '" style="max-width:200px"><select class="input" data-ccf="dp" aria-label="Bộ phận">' + gxOpts(dps, f.dp, 'Tất cả bộ phận') + '</select><select class="input" data-ccf="ld" aria-label="Loại lao động">' + gxOpts(lds, f.ld, 'Tất cả loại lao động') + '</select><select class="input" data-ccf="ht" aria-label="Chính thức / Thử việc">' + gxOpts(hts, f.ht, 'Tất cả hình thức HĐ') + '</select><label class="lg-chk"><input type="checkbox" data-ccf="note"' + (f.note ? ' checked' : '') + '> Chỉ dòng có lưu ý</label><span class="gx-cnt">' + list.length + ' / ' + rows.length + ' người</span><span class="gx-sp"></span>' +
      gxUndoBtns('ccu') + (!lock && prev ? '<button class="btn btn-sm" data-act="ccu-pull">Lấy dữ liệu từ tháng ' + HR.ymLabel(prev.ym) + '</button>' : '') + '<button class="btn btn-sm" data-act="ccu-cols">Cột hiển thị</button><button class="btn btn-sm" data-act="ccu-full">' + (f.full ? 'Thu nhỏ (Esc)' : 'Toàn màn hình') + '</button></div>';
    var rws = list.map(function (r, i) { return { at: ' data-row="' + esc(r.id) + '"', cells: cols.map(function (c) { return c.cell(r, i); }) }; });
    var foot = cols.map(function (c, k) { if (k === 0) return { h: '' }; if (c.id === 'ten') return { h: 'Tổng cộng ' + list.length + ' người' + (list.length < rows.length ? ' (theo bộ lọc)' : '') }; if (c.sumF) return { h: lgMoney(c.sumF(list)), cls: 'n' }; if (c.sum) return { h: lgMoney(list.reduce(function (t, r) { return t + (+r[c.sum] || 0); }, 0)), cls: 'n' }; return { h: '' }; });
    var note = '<p class="lg-law" style="margin:8px 0 0"><b>Lương cơ bản</b> là căn cứ đóng BHXH, để trống = mức lương trên HĐ / quyết định lương. <b>Lương đóng BHXH</b> = lương cơ bản + trợ cấp cố định. Ô viền cam: khác tháng trước · ô nền xanh ●: tự cập nhật theo HĐ / quyết định mới (rê chuột để đọc). ' + (lock ? '<b>Bảng đã duyệt – muốn sửa bấm Mở lại.</b>' : 'Nhập xong tự lưu.') + '</p>';
    return '<div class="gx-card' + (f.full ? ' gx-full' : '') + '" data-ps="ccu">' + (f.full ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Cơ cấu nhân sự tháng ' + HR.ymLabel(ym) + ' · ' + esc(shortUnit(u.name)) + '</b>' + (lock ? '<span class="tag tag-ok">Đã duyệt</span>' : '<span class="tag tag-warn">Nháp</span>') + '</div>' : '') + bar + gxTable({ id: 'ccuG', cols: cols, rows: rws, foot: foot, fz: 3 }) + note + '</div>';
  }
  ACTS['ccu-u'] = function (a, id) { PS.ccu.u = id; render(); };
  ACTS['ccu-full'] = function () { PS.ccu.full = !PS.ccu.full; render(); };
  ACTS['ccu-cols'] = function () { var u = ccuUnit(), s = lgOf(u); gxColSel('Cột hiển thị – Cơ cấu nhân sự', ccuColDefs(u, s, PS.ccu.ym, [], false, null, null), 'ccuHide', function (id) { return ['cb', 'tcT', 'bhb', 'hs', 'tn', 'cost', 'note', 'hd'].indexOf(id) >= 0; }); };
  // đổi đơn vị trợ cấp theo ngày công trong tháng: quy đổi mức từng người theo công chuẩn tháng
  ACTS['ccu-unit'] = function (a, key) {
    var u = ccuUnit(), s = lgOf(u), ym = PS.ccu.ym, k = key.split('|'), it = s.items.filter(function (x) { return x.id === k[0]; })[0]; if (!it) return;
    var cur = lgccUnit(u, ym, it); if (cur === k[1]) return; gxSnap('ccu', u, ym, it.t + ': đổi đơn vị sang ' + (k[1] === 'ngay' ? 'đ/ngày' : 'đ/tháng')); var c = lgccEnsure(u, ym); if (c.duyet) { gxDrop(); toast('Bảng đã duyệt – bấm Mở lại để sửa', 'warn'); return; }
    var std = ccuStd(u, ym), n = 0; c.unit = c.unit || {}; c.unit[it.id] = k[1];
    // 10/11 11:48 anh: quy đổi cả người đang dùng mức mặc định (vd ăn ca 30.000 đ/ngày) – trước đây chỉ đổi ô đã nhập riêng nên chuyển sang đ/tháng thì ô trống
    var dft = cur === 'ngay' ? +it.price || 0 : it.kind === 'qty' ? 0 : +it.amt || 0;
    ccuPeople(u, ym).forEach(function (e) { var id = e['Mã NV']; if (!c.emp[id]) c.emp[id] = JSON.parse(JSON.stringify(lgEmpM(u, s, ym, id))); var E = c.emp[id]; E.amt = E.amt || {};
      var own = E.amt[it.id] != null && E.amt[it.id] !== '', v = own ? +E.amt[it.id] : dft; if (!v) return; var d = std[id] || 22;
      var nv = k[1] === 'ngay' ? Math.round(v / d / 100) * 100 : Math.round(v * d); if (k[1] === 'ngay' && nv === (+it.price || 0)) delete E.amt[it.id]; else E.amt[it.id] = nv; n++; });
    c.log.push({ at: nowVn(), by: ccUser(), t: it.t + ': đổi đơn vị sang ' + (k[1] === 'ngay' ? 'đ/ngày' : 'đ/tháng') }); u.ver = (u.ver || 0) + 1; saveUnits();
    toast(it.t + ': nhập theo ' + (k[1] === 'ngay' ? 'đ/ngày (× ngày đi làm thực tế)' : 'đ/tháng (× tỷ lệ ngày công)') + (n ? ' – đã quy đổi ' + n + ' người theo công chuẩn tháng, kiểm tra lại' : ''), n ? 'warn' : ''); gxKeep('ccuG', render);
  };
  // lấy dữ liệu từ bảng cơ cấu tháng trước + tự cập nhật thay đổi chắc chắn (HĐ, quyết định lương mới, người mới vào / nghỉ)
  ACTS['ccu-pull'] = function () {
    var u = ccuUnit(), s = lgOf(u), ym = PS.ccu.ym, prev = ccuPrev(u, ym), cur = lgccOf(u, ym); if (!prev) return; if (cur && cur.duyet) { toast('Bảng tháng này đã duyệt', 'warn'); return; }
    var go = function () {
      var pObj = u.lgcc[prev.ym], c = { emp: JSON.parse(JSON.stringify(pObj.emp)), unit: JSON.parse(JSON.stringify(pObj.unit || {})), duyet: null, log: [], tao: nowVn(), from: prev.ym, chg: {} };
      var pl = ccuLast(prev.ym), nl = ccuLast(ym), was = {}, nNew = 0, nUp = 0, cv = s.items.filter(function (x) { return x.src === 'hd' && x.cat === 'cd'; })[0];
      ccuPeople(u, prev.ym).forEach(function (e) { was[e['Mã NV']] = 1; });
      var note = function (id, k, t) { (c.chg[id] = c.chg[id] || {})[k] = t; nUp++; };
      ccuPeople(u, ym).forEach(function (e) {
        var id = e['Mã NV'], a = ccuSal(u, id, pl), b = ccuSal(u, id, nl), E = c.emp[id] || (c.emp[id] = { amt: {} }); E.amt = E.amt || {};
        if (!was[id]) { var j = lgIso(e['Ngày vào làm']); note(id, 'moi', 'Người mới' + (j ? ' vào làm từ ' + HR.vnDate(j) : '') + (b.salSrc ? ' – ' + b.salSrc.replace(/^QĐ\s+hiệu lực/, 'quyết định lương hiệu lực') : '') + ': chế độ lấy theo mức lương trên HĐ, nhập thêm trợ cấp nếu có'); nNew++; nUp--; return; }
        if (a.sal != null && b.sal != null && a.sal !== b.sal) {
          var t0 = 'Mức lương trên HĐ / QĐ đổi ' + lgMoney(a.sal) + ' → ' + lgMoney(b.sal) + ' (' + b.salSrc + ')';
          note(id, 'hd', t0);
          if (E.cb == null || E.cb === '' || +E.cb === a.sal) { if (E.cb != null && E.cb !== '') E.cb = b.sal; note(id, 'cb', t0 + ' → lương cơ bản cập nhật theo mức mới'); }
          else { var d = b.sal - a.sal; E.hs = Math.max(0, (+E.hs || 0) + d); note(id, 'hs', t0 + '. Lương cơ bản giữ ' + lgMoney(E.cb) + ', phần chênh ' + (d > 0 ? '+' : '−') + lgMoney(Math.abs(d)) + ' đưa vào lương hiệu suất mục tiêu – kiểm tra lại'); }
        }
        if ((a.hs || 0) !== (b.hs || 0)) { var t2 = 'Lương hiệu suất mục tiêu trên HĐ / QĐ đổi ' + lgMoney(a.hs || 0) + ' → ' + lgMoney(b.hs || 0) + ' (' + b.salSrc + ')'; if (E.hs == null || E.hs === '' || +E.hs === (a.hs || 0)) { if (E.hs != null && E.hs !== '') E.hs = b.hs || 0; note(id, 'hs', t2 + ' → cập nhật'); } else note(id, 'hs', t2 + ' – ô đang nhập riêng ' + lgMoney(E.hs) + ', chưa đổi'); }
        if (cv && a.pcv !== b.pcv) { var t1 = 'Phụ cấp chức vụ đổi ' + lgMoney(a.pcv) + ' → ' + lgMoney(b.pcv) + ' (' + b.pcSrc + ')'; if (E.amt[cv.id] == null || E.amt[cv.id] === '' || +E.amt[cv.id] === a.pcv) { if (E.amt[cv.id] != null && E.amt[cv.id] !== '') E.amt[cv.id] = b.pcv; note(id, 'a:' + cv.id, t1 + ' → cập nhật'); } else note(id, 'a:' + cv.id, t1 + ' – ô đang nhập riêng ' + lgMoney(E.amt[cv.id]) + ', chưa đổi'); }
      });
      var gone = Object.keys(was).filter(function (id) { return !ccuPeople(u, ym).some(function (e) { return e['Mã NV'] === id; }); });
      c.log.push({ at: c.tao, by: ccUser(), t: 'lấy dữ liệu từ tháng ' + HR.ymLabel(prev.ym) + ': ' + nUp + ' ô tự cập nhật, ' + nNew + ' người mới, ' + gone.length + ' người nghỉ' });
      gxSnap('ccu', u, ym, 'lấy dữ liệu từ tháng ' + HR.ymLabel(prev.ym)); u.lgcc[ym] = c; u.ver = (u.ver || 0) + 1; saveUnits(); log('Cơ cấu nhân sự ' + HR.ymLabel(ym) + ' (' + u.name + '): lấy dữ liệu từ tháng ' + HR.ymLabel(prev.ym));
      toast('Đã lập bảng tháng ' + HR.ymLabel(ym) + ' từ tháng ' + HR.ymLabel(prev.ym) + ': ' + nUp + ' ô tự cập nhật, ' + nNew + ' người mới' + (gone.length ? ', ' + gone.length + ' người đã nghỉ (bỏ khỏi bảng)' : ''), 'ok'); render();
    };
    if (!cur) { go(); return; }
    var m = modal('Lấy lại dữ liệu từ tháng ' + HR.ymLabel(prev.ym), shortUnit(u.name), '<p>Bảng nháp tháng ' + HR.ymLabel(ym) + ' đang có sẽ được <b>thay bằng</b> dữ liệu tháng ' + HR.ymLabel(prev.ym) + ' (kèm tự cập nhật thay đổi). Các ô đã sửa trong bảng nháp sẽ mất.</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="ccuOk">Thay bảng nháp</button></div>', true);
    $('#ccuOk', m).onclick = function () { m.close(); go(); };
  };
  ACTS['ccu-new'] = function () { var u = ccuUnit(), ym = PS.ccu.ym; gxSnap('ccu', u, ym, 'tạo bảng cơ cấu'); var c = lgccEnsure(u, ym); c.log.push({ at: nowVn(), by: ccUser(), t: 'tạo bảng cơ cấu' }); u.ver = (u.ver || 0) + 1; saveUnits(); log('Cơ cấu nhân sự ' + HR.ymLabel(ym) + ' (' + u.name + '): tạo bảng'); toast('Đã tạo bảng cơ cấu tháng ' + HR.ymLabel(ym)); render(); };
  ACTS['ccu-ok'] = function () {
    var u = ccuUnit(), ym = PS.ccu.ym, rows = ccuRows(u, ym), bad = rows.filter(function (r) { return r.w.length; }), tn = rows.reduce(function (t, r) { return t + r.tn; }, 0), cost = rows.reduce(function (t, r) { return t + r.cost; }, 0);
    var m = modal('Duyệt cơ cấu nhân sự tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<p>' + rows.length + ' người · quỹ lương dự kiến <b>' + lgMoney(tn) + ' đồng</b> · tổng chi phí dự kiến <b>' + lgMoney(cost) + ' đồng</b>.</p>' + (bad.length ? '<div class="notice warn">' + ic('info') + '<div><b>' + bad.length + ' người có lưu ý</b> – bấm biểu tượng ⚠ ở cột Lưu ý để xem từng người.</div></div>' : '') + '<p class="lg-law">Sau khi duyệt, bảng cơ cấu là căn cứ tính Bảng lương tháng ' + HR.ymLabel(ym) + ' và bị khóa; muốn sửa phải Mở lại (ghi lý do).</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ccuOk">Duyệt</button></div>', true);
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
    var u = ccuUnit(), s = lgOf(u), ym = PS.ccu.ym, f = PS.ccu, all = ccuRows(u, ym), rows = ccuFilter(all, f), cc = lgccOf(u, ym), hid = S.settings.ccuHide || {};
    var defs = ccuColDefs(u, s, ym, rows, true, null, cc).filter(function (c) { return (c.fixed || !hid[c.id]) && c.id !== 'note'; });
    var val = function (c, r, i) { if (c.id === 'stt') return i + 1; if (c.id === 'ma') return r.id; if (c.id === 'ten') return r.name; if (c.id === 'bp') return r.dept; if (c.id === 'cdanh') return r.cd0; if (c.id === 'ld') return r.ld; if (c.id === 'hd') return r.sal != null ? r.hdT : null; if (c.id === 'cb') return r.cb; if (c.id.indexOf('a:') === 0) return Math.round(r.it[c.id.slice(2)] || 0); if (c.id === 'bhb') return r.bhBase; if (c.id === 'npt') return r.E.npt != null && r.E.npt !== '' ? +r.E.npt : r.npt0; if (c.id === 'uni') return r.E.union ? 'x' : ''; if (c.id === 'cam') return r.E.cam08 ? 'x' : ''; if (c.id === 'hrs') return r.hr ? +r.E.hrsHD || null : null; if (c.id === 'hourly') return r.hr ? +r.E.hourly || null : null; return c.sum ? Math.round(+r[c.sum] || 0) : null; };
    var cols = defs.map(function (c) { return { t: c.t.replace(/<[^>]+>/g, '') + (c.id.indexOf('a:') === 0 ? ' (' + (c.tip && /cố định/.test(c.tip) ? 'cố định' : 'ngày công') + ')' : ''), hl: !!c.hl, w: c.id === 'ten' ? 24 : c.id === 'stt' ? 6 : 14 }; }).concat([{ t: 'Lưu ý', w: 50 }]);
    var groups = [], k0 = 0; while (k0 < defs.length) { var g = defs[k0].g; if (!g) { k0++; continue; } var j = k0; while (j < defs.length && defs[j].g === g) j++; groups.push({ t: g, from: k0, to: j - 1 }); k0 = j; }
    var data = rows.map(function (r, i) { return defs.map(function (c) { return val(c, r, i); }).concat([r.w.map(function (w) { return w.t; }).join(' · ')]); });
    data.push(defs.map(function (c, k) { if (c.id === 'ten') return 'TỔNG CỘNG ' + rows.length + ' người'; if (c.id.indexOf('a:') === 0 || c.sum) return rows.reduce(function (t, r, i) { return t + (+val(c, r, i) || 0); }, 0); return null; }).concat([null]));
    saveXlsx([{ name: 'Co cau ' + ym, title: 'BẢNG CƠ CẤU NHÂN SỰ – QUỸ LƯƠNG DỰ KIẾN THÁNG ' + HR.ymLabel(ym), note: u.name + ' · đơn vị: đồng · ' + (cc && cc.duyet ? 'đã duyệt ' + cc.duyet.at + ' bởi ' + cc.duyet.by : 'CHƯA DUYỆT') + (rows.length < all.length ? ' · theo bộ lọc ' + rows.length + '/' + all.length + ' người' : ''), cols: cols, groups: groups, rows: data, bold: [data.length - 1] }], fileName('Co cau nhan su ' + HR.ymLabel(ym) + ' ' + shortUnit(u.name)));
  };
  BINDS.cocau = function () {
    gxBind('ccuG');
    var y = $('#ccuYm'); if (y) y.addEventListener('change', function () { PS.ccu.ym = y.value; render(); });
    var q = $('#ccuQ'); if (q) q.addEventListener('input', function () { PS.ccu.q = q.value; clearTimeout(q._t); q._t = setTimeout(function () { var p = q.selectionStart; render(); var q2 = $('#ccuQ'); if (q2) { q2.focus(); q2.setSelectionRange(p, p); } }, 250); });
    document.querySelectorAll('[data-ccf]').forEach(function (el) { el.addEventListener('change', function () { var k = el.getAttribute('data-ccf'); PS.ccu[k] = el.type === 'checkbox' ? el.checked : el.value; render(); }); });
    document.querySelectorAll('#ccuG [data-ccu]').forEach(function (el) {
      el.addEventListener('change', function () {
        var u = ccuUnit(), ym = PS.ccu.ym, id0 = el.getAttribute('data-ccu');
        if (el.getAttribute('data-dflt') && el.value.trim() === el.getAttribute('data-dflt')) return;
        gxSnap('ccu', u, ym, 'sửa ô ' + id0); var c = lgccEnsure(u, ym); if (c.duyet) { gxDrop(); toast('Bảng đã duyệt – bấm Mở lại để sửa', 'warn'); render(); return; }
        var id = el.getAttribute('data-ccu'), k = el.getAttribute('data-k'), E = c.emp[id] || (c.emp[id] = { amt: {} }); E.amt = E.amt || {};
        var raw = k === 'hrsHD' ? el.value.replace(',', '.').replace(/[^\d.]/g, '') : el.value.replace(/[^\d]/g, ''), val = el.type === 'checkbox' ? el.checked : (raw === '' ? '' : +raw);
        if (k.indexOf('a:') === 0) E.amt[k.slice(2)] = val; else E[k] = val;
        if (c.chg && c.chg[id] && c.chg[id][k]) delete c.chg[id][k];
        u.ver = (u.ver || 0) + 1; saveUnits(); toast('Đã lưu'); gxKeep('ccuG', render);
        if (val !== '' && el.type !== 'checkbox' && (k === 'cb' || k === 'hs' || k.indexOf('a:') === 0)) ccuFillPop(id, k, val);
      });
    });
  };
  // 10/11: điền xong 1 ô (lương cơ bản, trợ cấp, lương hiệu suất) → nút nhỏ áp dụng cùng giá trị cho các dòng phía dưới
  function ccuFillPop(id, k, val) {
    var old = document.querySelector('.gx-pop'); if (old) old.remove();
    var ids = Array.prototype.map.call(document.querySelectorAll('#ccuG tr[data-row]'), function (t) { return t.getAttribute('data-row'); }), at = ids.indexOf(id), below = at < 0 ? [] : ids.slice(at + 1);
    if (!below.length) return;
    var u = ccuUnit(), ym = PS.ccu.ym, c = lgccOf(u, ym), get = function (x) { var E = c && c.emp[x]; if (!E) return ''; return k.indexOf('a:') === 0 ? (E.amt || {})[k.slice(2)] : E[k]; };
    var empty = below.filter(function (x) { var v = get(x); return v == null || v === ''; });
    var inp = document.querySelector('#ccuG [data-ccu="' + id + '"][data-k="' + k + '"]'); if (!inp) return; var rc = inp.getBoundingClientRect();
    var p = document.createElement('div'); p.className = 'gx-pop'; p.setAttribute('role', 'dialog');
    p.innerHTML = 'Áp dụng <b>' + lgMoney(val) + '</b> cho các dòng phía dưới?<div class="link-row" style="margin-top:8px;gap:6px;flex-wrap:wrap">' + (empty.length && empty.length < below.length ? '<button class="btn btn-sm btn-primary" data-fill="empty">Điền ' + empty.length + ' dòng còn để mặc định</button>' : '') + '<button class="btn btn-sm' + (empty.length && empty.length < below.length ? '' : ' btn-primary') + '" data-fill="all">Áp dụng cho ' + below.length + ' dòng dưới</button><button class="btn btn-sm" data-fill="no">Bỏ qua</button></div>';
    document.body.appendChild(p);
    var x = Math.min(window.innerWidth - p.offsetWidth - 10, Math.max(10, rc.left)), y = rc.bottom + 6; if (y + p.offsetHeight > window.innerHeight - 8) y = Math.max(8, rc.top - p.offsetHeight - 6); p.style.left = x + 'px'; p.style.top = y + 'px';
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fill]'); if (!b) return; var how = b.getAttribute('data-fill'); p.remove(); if (how === 'no') return;
      gxSnap('ccu', u, ym, 'áp dụng ' + lgMoney(val) + ' cho các dòng dưới'); var cc = lgccEnsure(u, ym); if (cc.duyet) { gxDrop(); return; } var list = how === 'all' ? below : empty;
      list.forEach(function (x) { var E = cc.emp[x] || (cc.emp[x] = { amt: {} }); E.amt = E.amt || {}; if (k.indexOf('a:') === 0) E.amt[k.slice(2)] = val; else E[k] = val; if (cc.chg && cc.chg[x]) delete cc.chg[x][k]; });
      cc.log.push({ at: nowVn(), by: ccUser(), t: 'áp dụng ' + k + ' = ' + lgMoney(val) + ' cho ' + list.length + ' người' }); u.ver = (u.ver || 0) + 1; saveUnits(); toast('Đã áp dụng cho ' + list.length + ' người'); gxKeep('ccuG', render);
    });
    setTimeout(function () { document.addEventListener('mousedown', function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('mousedown', off); } }); }, 0);
  }
