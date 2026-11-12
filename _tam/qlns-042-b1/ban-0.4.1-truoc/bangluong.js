  /* =====================================================================
     B2 – BẢNG LƯƠNG THÁNG (0.4.1, 09/11/2026 – làm lại 21:30 theo yêu cầu anh)
       - 1 bảng lương chi tiết duy nhất: đủ cột, nhóm cột có ô gộp phía trên (như bảng lương mẫu), chọn ẩn / hiện cột (S.settings.blHide)
       - Trợ cấp gộp 1 nhóm (cố định hay theo ngày công đặt ở Thiết lập tính lương); dòng nhóm theo bộ phận + dòng cộng
       - Mọi ô số sửa tay được: ô tự động (từ Cơ cấu nhân sự đã duyệt, bảng công, công thức) sửa tay → u.lgm[ym].ovr, tô cam + cảnh báo;
         ô nhập cuối tháng (KPI, thưởng, tạm ứng, tỷ lệ đạt…) → u.lgm[ym].inp, chữ xanh, gợi ý điền cho các dòng phía dưới
       - Chốt bảng lương cần: đã chốt công + đã duyệt Cơ cấu nhân sự tháng; sau chốt dùng ảnh chụp (phiếu lương lấy từ đây)
     ===================================================================== */
  var BL_OLD = PAGES.bl, BL_OLD_B = BINDS.bl;
  function lgM(u, ym) { u.lgm = u.lgm || {}; var m = u.lgm[ym] || (u.lgm[ym] = { inp: {}, lock: null, log: [] }); m.inp = m.inp || {}; m.log = m.log || []; return m; }
  function blSave(u, ym, msg) { u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) { lgM(u, ym).log.unshift({ at: nowVn(), by: ccUser(), t: msg }); log('Bảng lương ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + msg); } }
  function blUnit() { var f = ps('blg', { u: '', ym: '', q: '', view: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function blMonths(u) { var o = {}; bcMonths().forEach(function (m) { o[m] = 1; }); Object.keys(u.lgm || {}).forEach(function (m) { if (u.lgm[m].lock) o[m] = 1; }); return Object.keys(o).sort(); }
  // tính cả tháng (chưa chốt) – mỗi người 1 kết quả lgCalc
  function blCalc(u, ym) { var B = bcMonth(u, ym); return B.ppl.filter(function (p) { return !p.orphan; }).map(function (p) { return lgCalc(u, ym, p.id); }).filter(Boolean); }
  // ảnh chụp gọn để lưu khi chốt (không giữ đối tượng công ty)
  function blSnap(r) { return { id: r.id, name: r.name, dept: r.dept, cdanh: r.cdanh, ovr: r.ovr, ccSt: r.ccSt, ld: r.ld, ctype: r.ctype, c: r.c, gross: r.gross, bhNL: r.bhNL, tax: r.tax, kt: r.kt, net: r.net, pay: r.pay, dn: r.dn, dnTotal: r.dnTotal, bhWhy: r.bhWhy, warn: r.warn.filter(function (w) { return w.lv !== 'info' || /Không đóng/.test(w.t); }), lines: r.lines.map(function (l) { return { grp: l.grp, k: l.k, t: l.t, v: l.v, f: l.f, law: l.law, info: l.info, slip: l.slip }; }) }; }
  function blRows(u, ym) { var L = lgM(u, ym).lock; return L ? L.rows : blCalc(u, ym); }

  // ---------- Cột bảng lương chi tiết: nhóm (ô gộp phía trên), loại sửa: ov = ô tự động (sửa tay → cảnh báo), in = nhập cuối tháng ----------
  function blCols(u) {
    var s = lgOf(u), tn = s.items.filter(function (x) { return x.g === 'tn'; }), kt = s.items.filter(function (x) { return x.g === 'kt'; });
    var c = function (k, t, o) { return Object.assign({ id: k, k: k, t: t, unit: o && o.num2 ? '' : 'đ', v: function (r) { return r.c[k]; } }, o || {}); };
    var tc = tn.filter(function (x) { return x.cat === 'cd'; }).concat(tn.filter(function (x) { return x.cat === 'nc'; })), kth = tn.filter(function (x) { return x.cat === 'kpi' || x.cat === 'thuong'; });
    var cols = [
      { id: 'ma', t: 'Mã NV', v: function (r) { return r.id; }, txt: 1, fixed: 1 }, { id: 'ten', t: 'Họ và tên', v: function (r) { return r.name; }, txt: 1, name: 1, fixed: 1 },
      { id: 'cdanh', t: 'Chức danh', g: 'Thông tin', v: function (r) { return r.cdanh || ''; }, txt: 1 }, { id: 'ld', t: 'Hình thức', g: 'Thông tin', v: function (r) { return lgLd(r.ld); }, txt: 1 }, { id: 'ht', t: 'Loại hợp đồng', g: 'Thông tin', v: function (r) { return lgHt(r.ctype, r.ld); }, txt: 1 },
      c('cb', 'Lương cơ bản', { hl: 'hl-cb', ed: 'ov', src: 'cơ cấu' }),
      c('std', 'Công chuẩn', { g: 'Ngày công', num2: 1, unit: 'công', ed: 'ov', src: 'chấm công' }), c('work', 'Ngày đi làm', { g: 'Ngày công', num2: 1, unit: 'ngày', ed: 'ov', src: 'chấm công' }), c('paid', 'Nghỉ phép, có lương', { g: 'Ngày công', num2: 1, unit: 'ngày' }), c('hol', 'Nghỉ lễ, tết', { g: 'Ngày công', num2: 1, unit: 'ngày' }), c('unpaid', 'Nghỉ không lương', { g: 'Ngày công', num2: 1, unit: 'ngày' }), c('bhD', 'Nghỉ hưởng BHXH', { g: 'Ngày công', num2: 1, unit: 'ngày' }), c('cong', 'Công hưởng lương', { g: 'Ngày công', num2: 1, unit: 'công / giờ', ed: 'ov', src: 'chấm công', tip: 'Đi làm + nghỉ có lương + nghỉ lễ (bán thời gian: số giờ làm)' }),
      c('tg', 'Lương theo ngày công', { hl: 'hl-tg', ed: 'ov' }),
      c('otN', 'Ngày thường 150%', { g: 'Tăng ca', num2: 1, unit: 'giờ', ed: 'ov', src: 'chấm công' }), c('otR', 'Nghỉ tuần 200%', { g: 'Tăng ca', num2: 1, unit: 'giờ', ed: 'ov', src: 'chấm công' }), c('otH', 'Lễ, tết 300%', { g: 'Tăng ca', num2: 1, unit: 'giờ', ed: 'ov', src: 'chấm công' }), c('uo', 'Đơn giá giờ', { g: 'Tăng ca', unit: 'đ/giờ' }), c('ot', 'Lương tăng ca', { g: 'Tăng ca', ed: 'ov' }),
      c('hsMt', 'Mục tiêu', { g: 'Lương hiệu suất', ed: 'ov', src: 'cơ cấu' }), { id: 'hsTl', k: 'hsTl', t: 'Tỷ lệ đạt', unit: '%', g: 'Lương hiệu suất', num2: 1, ed: 'in', v: function (r) { return r.c.hsMt ? r.c.hsTl : null; }, inV: function (r, M) { return (M.inp[r.id] || {}).hsTl; } }, c('hs', 'Thực nhận', { g: 'Lương hiệu suất', hl: 'hl-hs', ed: 'ov' })
    ];
    tc.forEach(function (x) { cols.push({ id: 'it.' + x.id, k: 'it.' + x.id, t: x.t, g: 'Trợ cấp', unit: 'đ', tip: x.cat === 'cd' ? 'Trợ cấp cố định – đóng BHXH' : 'Trợ cấp theo ngày công – không đóng BHXH', tag: x.cat === 'cd' ? 'cố định' : 'ngày công', ed: 'ov', src: 'cơ cấu', v: function (r) { return (r.c.it || {})[x.id] || 0; } }); });
    if (tc.length) cols.push(c('tcT', 'Cộng trợ cấp', { g: 'Trợ cấp', hl: 'hl-pc' }));
    kth.forEach(function (x) { cols.push({ id: 'it.' + x.id, k: x.id, t: x.t, g: 'KPI, thưởng', unit: 'đ', ed: 'in', v: function (r) { return (r.c.it || {})[x.id] || 0; }, inV: function (r, M) { return (M.inp[r.id] || {})[x.id]; } }); });
    if (kth.length) cols.push(c('kthT', 'Cộng KPI, thưởng', { g: 'KPI, thưởng', hl: 'hl-th' }));
    cols.push(c('d168', 'Trả thêm thay đóng BH (Điều 168)', { ed: 'ov' }), c('tongTN', 'Tổng thu nhập', { hl: 'hl-tn' }), c('bhBase', 'Lương đóng BHXH', { hl: 'hl-bhb', ed: 'ov', src: 'cơ cấu' }));
    cols.push(c('bhxh', 'BHXH 8%', { g: 'BH người lao động đóng', ed: 'ov' }), c('bhyt', 'BHYT 1,5%', { g: 'BH người lao động đóng', ed: 'ov' }), c('bhtn', 'BHTN 1%', { g: 'BH người lao động đóng', ed: 'ov' }), c('bhNL', 'Cộng', { g: 'BH người lao động đóng', hl: 'hl-bh' }));
    [['dnXh', 'BHXH 17,5%', 0], ['dnYt', 'BHYT 3%', 1], ['dnTn', 'BHTN 1%', 2], ['kpcd', 'KPCĐ 2%', 3]].forEach(function (x) { cols.push({ id: x[0], k: x[0], t: x[1], g: 'Công ty đóng (tính vào chi phí)', unit: 'đ', ed: 'ov', v: function (r) { return (r.c.dn || [])[x[2]] || 0; } }); });
    cols.push(c('dnT', 'Cộng', { g: 'Công ty đóng (tính vào chi phí)' }));
    cols.push(c('exempt', 'Khoản miễn thuế', { g: 'Thuế TNCN', ed: 'ov' }), c('tnct', 'Thu nhập chịu thuế', { g: 'Thuế TNCN', hl: 'hl-tax' }), c('npt', 'Người phụ thuộc', { g: 'Thuế TNCN', num2: 1, unit: 'người', ed: 'ov', src: 'cơ cấu' }), c('gtBan', 'Giảm trừ bản thân', { g: 'Thuế TNCN', ed: 'ov' }), c('gtNpt', 'Giảm trừ người phụ thuộc', { g: 'Thuế TNCN', ed: 'ov' }), c('tntt', 'Thu nhập tính thuế', { g: 'Thuế TNCN', hl: 'hl-tax' }), c('tax', 'Thuế TNCN', { g: 'Thuế TNCN', ed: 'ov' }));
    kt.forEach(function (x) { var auto = x.dk === 'union'; cols.push({ id: 'it.' + x.id, k: auto ? 'it.' + x.id : x.id, t: x.t, g: 'Khấu trừ', unit: 'đ', ed: auto ? 'ov' : 'in', v: function (r) { return (r.c.it || {})[x.id] || 0; }, inV: auto ? null : function (r, M) { return (M.inp[r.id] || {})[x.id]; } }); });
    cols.push(c('ktT', 'Cộng khấu trừ', { g: 'Khấu trừ' }), c('pay', 'Thực lĩnh', { hl: 'hl-net', fixed: 1 }), c('cost', 'Tổng chi phí lương của công ty'));
    cols.push({ id: 'warn', t: 'Lưu ý', v: function (r) { return (r.warn || []).filter(function (w) { return w.lv !== 'info'; }).map(function (w) { return w.t; }).join(' · '); }, txt: 1, warn: 1 });
    return cols;
  }
  function blHide() { return lgHideLd('blHide'); }
  function blVis(u) { var h = blHide(); return gxOrder(blCols(u), 'blOrd').filter(function (c) { return c.fixed || !h[c.id]; }); }
  function blStyle() {
    if (document.getElementById('blCss')) return;
    var st = document.createElement('style'); st.id = 'blCss';
    st.textContent = '.blt td,.blt th{white-space:nowrap}.blt th{white-space:normal;min-width:84px;vertical-align:bottom}.blt th.gh{text-align:center;vertical-align:middle;border-bottom:1px solid var(--line);background:rgba(127,127,127,.07)}.blt td.n{text-align:right;font-variant-numeric:tabular-nums}' +
      '.blt .hl-hs{background:rgba(59,130,246,.12)}.blt .hl-cb{background:rgba(20,184,166,.14)}.blt .hl-tg{background:rgba(34,197,94,.14)}.blt .hl-pc{background:rgba(245,158,11,.16)}.blt .hl-th{background:rgba(168,85,247,.14)}.blt .hl-tn{background:rgba(37,99,235,.2)}.blt .hl-bhb{background:rgba(220,38,38,.18)}.blt .hl-bh{background:rgba(239,68,68,.13)}.blt .hl-tax{background:rgba(249,115,22,.15)}.blt .hl-net{background:rgba(22,163,74,.24)}' +
      '.blt td[class*=hl-],.blt th[class*=hl-]{font-weight:700}.blt tr.sub td{font-weight:700;background:rgba(127,127,127,.08)}.blt tr.tot td{font-weight:800;border-top:2px solid var(--line-2)}.blt td.w{white-space:nowrap;max-width:360px;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:#b9770e}.blt .tg{font-size:10px;font-weight:600;padding:0 4px;border-radius:4px;background:rgba(127,127,127,.12);margin-left:3px;white-space:nowrap}' +
      '.blt td.ed{cursor:text}.blt td.ed:hover{outline:1px dashed var(--line-2);outline-offset:-3px}.blt td.ovd{background:rgba(234,88,12,.2)!important;color:#9a3412}.blt td.ovd::after{content:" ✎";font-size:11px}.blt td.inp{color:#1d4ed8;font-weight:600}.blt td.ein{padding:2px}.blt td.ein input{width:110px;text-align:center;padding:4px 6px}' +
      '.bl-leg{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.bl-leg span{padding:3px 8px;border-radius:6px;font-size:12px;font-weight:600}.bl-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0}.bl-st{padding:10px 14px;border-radius:10px;border:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 12px}' +
      '.bl-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}.bl-kpi div{border:1px solid var(--line);border-radius:10px;padding:10px 12px}.bl-kpi span{display:block;font-size:12px;color:var(--muted)}.bl-kpi b{font-size:18px}.bl-dc .bad{color:#c0392b;font-weight:700}' +
      '.bl-fill{position:fixed;z-index:60;max-width:340px;background:var(--card,#fff);border:1px solid var(--line-2);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:10px 12px;font-size:13px}.bl-fill .link-row{margin-top:8px;gap:6px;flex-wrap:wrap}.bl-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px;margin:4px 0 12px}.bl-cg h4{grid-column:1/-1;margin:8px 0 0;font-size:13px}';
    document.head.appendChild(st);
  }
  function blCell(col, r) { var v = col.v(r); if (col.txt) return esc(v == null ? '' : v); if (col.fmt) return esc(col.fmt(r)); if (v == null || v === '') return ''; return col.num2 ? lgNum(v) : lgMoney(v); }
  // 15:58 10/11 anh: dữ liệu mẫu mặc định bảng lương tháng 10/2026 ĐÃ CHỐT để thử Phiếu lương, Bảng chi lương (người dùng tự mở lại thì không chốt lại – M.prev)
  function blSampleLock() {
    (S.units || []).forEach(function (u) {
      if (u.source !== 'sample') return; var ym = '2026-10';
      try { lgOf(u); var M = lgM(u, ym); if (M.lock || M.prev || !bcX(u).lock[ym]) return; var cc = lgccOf(u, ym); if (!cc || !cc.duyet) return;
        var rows = blCalc(u, ym), sum = rows.reduce(function (t, r) { return t + r.pay; }, 0);
        M.lock = { at: '05/11/2026 16:30:00', by: 'Kế toán trưởng (dữ liệu mẫu)', ts: Date.now(), rows: rows.map(blSnap) };
        M.log.unshift({ at: '05/11/2026 16:30:00', by: 'Kế toán trưởng (dữ liệu mẫu)', t: 'chốt bảng lương (' + rows.length + ' người, thực lĩnh ' + lgMoney(sum) + ')' }); saveUnits();
      } catch (e) { logErr('Chốt bảng lương mẫu tháng 10', e); }
    });
  }
  PAGES.bl = function () {
    lgStyle(); blStyle(); gxStyle(); blSampleLock();
    var f = ps('blg', { u: '', ym: '', q: '', view: '', dp: '', ld: '', note: false, full: false }), u = blUnit(); if (!u) return pageHead('Bảng lương') + noData('dữ liệu');
    if (f.view === 'file') return pageHead('Bảng lương đã nạp từ file', 'Bảng lương Excel đơn vị đang dùng (nạp ở Nhập dữ liệu)', '<button class="btn btn-sm" data-act="bl-view" data-id="">← Về bảng lương chi tiết</button>') + '<div id="blOld">' + (BL_OLD ? BL_OLD() : '') + '</div>';
    var us = selUnits().length ? selUnits() : S.units, ms = blMonths(u), X = bcX(u);
    if (ms.indexOf(f.ym) < 0) f.ym = ms.filter(function (m) { return X.lock[m]; }).pop() || ms[ms.length - 1];
    var ym = f.ym, M = lgM(u, ym), L = M.lock, cLock = X.lock[ym], H = ccuHan(u, ym);
    var right = '<button class="btn btn-sm" data-act="bl-dc">Đối chiếu</button><button class="btn btn-sm" data-act="bl-xls">' + ic('xuat', 15) + 'Xuất Excel</button>' + (L ? '<button class="btn btn-sm btn-primary" data-act="bl-print">' + ic('xuat', 15) + 'In bảng lương</button><button class="btn btn-sm" data-act="bl-open">Mở lại bảng lương</button>' : '<button class="btn btn-sm btn-primary" data-act="bl-lock"' + (cLock ? '' : ' disabled title="Chốt công tháng này trước (Tổng hợp công)"') + '>Chốt bảng lương</button>');
    var head = pageHead('Bảng lương', 'Bảng thanh toán tiền lương tháng ' + HR.ymLabel(ym) + (us.length > 1 ? ' – ' + esc(shortUnit(u.name)) : '') + ' – căn cứ: Cơ cấu nhân sự đã duyệt, bảng công đã chốt, Thiết lập tính lương.', right);
    var pick = '<div class="bl-bar">' + (us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="bl-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '') +
      '<select class="input" id="blYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + (u.lgm && u.lgm[m] && u.lgm[m].lock ? ' · đã chốt lương' : X.lock[m] ? ' · đã chốt công' : '') + '</option>'; }).join('') + '</select></div>';
    var st = '<div class="bl-st">' + (L ? '<span class="tag tag-ok">Đã chốt bảng lương</span><span>' + esc(L.at) + ' · ' + esc(L.by) + '</span>' : '<span class="tag tag-warn">Nháp – chưa chốt</span>') +
      '<span>' + (H.cc && H.cc.duyet ? 'Cơ cấu nhân sự đã duyệt ' + esc(H.cc.duyet.at) : '<b>Cơ cấu nhân sự chưa duyệt</b> (hạn ' + HR.vnDate(H.iso) + ') – <a href="#cocau">mở Cơ cấu nhân sự</a>') + '</span>' +
      '<span>' + (cLock ? 'Công tháng đã chốt ' + esc(cLock.at || '') : '<b>Công tháng chưa chốt</b> – <a href="#cc">chốt ở Tổng hợp công</a>') + '</span></div>';
    if (u.source === 'sample' && !(u.data.HD || []).some(function (h) { return 'Lương hiệu suất mục tiêu' in h; })) st += '<div class="notice bad" style="margin-bottom:12px">' + ic('info') + '<div><b>Dữ liệu mẫu đang là bản cũ.</b> Bấm <a href="#" data-act="sample">Dùng dữ liệu mẫu</a> để nạp bản mới (HĐ ghi lương cơ bản, phụ cấp chức vụ, lương hiệu suất mục tiêu).</div></div>';
    if (L) { var now = blCalc(u, ym), diff = now.filter(function (r) { var o = L.rows.filter(function (x) { return x.id === r.id; })[0]; return !o || o.pay !== r.pay; }).length; if (diff) st += '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>Số liệu hiện tại (công, cơ cấu, thiết lập) khác lúc chốt ở <b>' + diff + ' người</b>. Bảng lương đã chốt giữ nguyên; muốn cập nhật thì Mở lại rồi chốt lại.</div></div>'; }
    return head + pick + st + '<div id="blArea">' + blTabBang(u, ym, f) + '</div><p class="lg-law" style="margin-top:10px"><a href="#" data-act="bl-view" data-id="file">Xem bảng lương đã nạp từ file Excel</a></p>';
  };
  ACTS['bl-u'] = function (a, id) { PS.blg.u = id; render(); };
  ACTS['bl-view'] = function (a, id) { PS.blg.view = id; render(); };
  function blFilter(rows, f) { var q = norm(f.q || ''); return rows.filter(function (r) { return (!q || norm(r.id + ' ' + r.name).indexOf(q) >= 0) && (!f.dp || (r.dept || '(chưa có bộ phận)') === f.dp) && (!f.ld || lgLd(r.ld) === f.ld) && (!f.ht || lgHt(r.ctype, r.ld) === f.ht) && (!f.note || (r.warn || []).some(function (w) { return w.lv !== 'info'; }) || Object.keys(r.ovr || {}).length); }); }
  var BL_BG = { 'hl-cb': 'rgba(20,184,166,.13)', 'hl-tg': 'rgba(34,197,94,.13)', 'hl-hs': 'rgba(59,130,246,.11)', 'hl-pc': 'rgba(245,158,11,.15)', 'hl-th': 'rgba(168,85,247,.13)', 'hl-tn': 'rgba(37,99,235,.17)', 'hl-bhb': 'rgba(220,38,38,.15)', 'hl-bh': 'rgba(239,68,68,.12)', 'hl-tax': 'rgba(249,115,22,.14)', 'hl-net': 'rgba(22,163,74,.2)' };
  function blTabBang(u, ym, f) {
    var M = lgM(u, ym), lock = !!M.lock, rows = blRows(u, ym), vis = blVis(u), list = blFilter(rows, f);
    var T = function (k) { return rows.reduce(function (t, r) { return t + (+r.c[k] || 0); }, 0); }, nOv = rows.reduce(function (t, r) { return t + Object.keys(r.ovr || {}).length; }, 0);
    var kpi = gxKpi([{ l: 'Số người', v: rows.length }, { l: 'Tổng thu nhập', v: lgMoney(T('tongTN')) }, { l: 'BH người lao động đóng', v: lgMoney(T('bhNL')) }, { l: 'Thuế TNCN', v: lgMoney(T('tax')) }, { l: 'Thực lĩnh', v: lgMoney(T('pay')), cls: 'ac' }, { l: 'Tổng chi phí lương công ty', v: lgMoney(T('cost')), cls: 'ac' }].concat(nOv ? [{ l: 'Ô đã sửa tay', v: nOv, cls: 'wn', d: 'rê chuột ô ✎ để xem số tự tính' }] : []));
    var dps = rows.map(function (r) { return r.dept || '(chưa có bộ phận)'; }).filter(function (x, i, a) { return a.indexOf(x) === i; }), lds = rows.map(function (r) { return lgLd(r.ld); }).filter(function (x, i, a) { return a.indexOf(x) === i; }), hts = rows.map(function (r) { return lgHt(r.ctype, r.ld); }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var bar = '<div class="gx-bar"><input class="input" id="blQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q || '') + '" style="width:150px"><select class="input" data-blf="dp" aria-label="Bộ phận">' + gxOpts(dps, f.dp, 'Bộ phận') + '</select><select class="input" data-blf="ld" aria-label="Hình thức">' + gxOpts(lds, f.ld, 'Hình thức') + '</select><select class="input" data-blf="ht" aria-label="Loại hợp đồng">' + gxOpts(hts, f.ht, 'Loại HĐ') + '</select><span class="gx-cnt" title="Số người đang hiện / tổng số">' + list.length + '/' + rows.length + '</span><span class="gx-sp"></span>' + (lock ? '' : '<button class="btn btn-sm" data-act="bl-imp">' + ic('xuat', 15) + 'Nhập từ Excel</button>') + '<button class="btn btn-sm" data-act="bl-colsel">Cột hiển thị</button>' + gxFullBtn('bl-full', f.full) + (lock ? '' : gxUndoBtns('bl')) + '</div>';
    var leg = gxLegend([{ st: 'background:rgba(37,99,235,.17)', t: 'Cột tô màu: các mục tổng hợp chính (lương ngày công, tổng thu nhập, BH, thuế, thực lĩnh).' },
      { st: 'background:rgba(234,88,12,.2);color:#c2410c', sw: '✎', t: 'Ô tự tính đã sửa tay – rê chuột để xem số phần mềm tự tính; xóa trống để trở về số tự tính.', c: '#c2410c' },
      { st: 'color:#1d4ed8;font-weight:700', sw: '123', t: 'Chữ xanh: số nhập cuối tháng (tỷ lệ đạt, KPI, thưởng, tạm ứng, khấu trừ).', c: '#1d4ed8' },
      { st: 'background:rgba(217,119,6,.14);color:#b45309;font-weight:700', sw: '⚠', t: 'Cột Lưu ý: bấm để xem – dòng đỏ đậm là điều cần xử lý.', c: '#b45309' },
      { t: lock ? '<b>Bảng lương đã chốt – muốn sửa bấm Mở lại bảng lương.</b>' : 'Bấm vào ô số để sửa · Enter lưu · Esc hủy · Ctrl+Z hoàn tác · dán một cột từ Excel vào ô đầu để điền xuống · kéo mép tiêu đề để đổi độ rộng cột.' }]);
    var wv = function (c) { if (c.id === 'ma') return gxW(rows.map(function (r) { return r.id; }), 56, 80); if (c.id === 'ten') return gxW(rows.map(function (r) { return r.name; }), 120, 190); if (c.id === 'warn') return 58; if (c.txt) return gxW(rows.map(function (r) { return c.v(r); }), 80, 140); if (c.num2) return 66; return gxW(rows.map(function (r) { return lgMoney(c.v(r)); }).concat(['99.999.999']), 82, 118); };
    var cols = [{ id: 'stt', t: 'STT', w: 46 }].concat(vis.map(function (c) { return { id: c.id, t: esc(c.t) + (c.tag ? '<div class="faint" style="font-size:10px;font-weight:500">' + c.tag + '</div>' : ''), g: c.g, unit: c.txt ? '' : c.unit || '', w: wv(c), hl: !!c.hl, bg: BL_BG[c.hl] || '', tip: c.tip }; }));
    var cell = function (c, r) {
      if (c.warn) { var ws = (r.warn || []).filter(function (w) { return w.lv !== 'info'; }); return { h: gxNote(ws), cls: 'c' }; }
      var h = blCell(c, r), cls = c.txt ? '' : 'n', at = '';
      if (c.name) h = '<a href="#" data-act="bl-ct" data-id="' + esc(r.id) + '"><b>' + h + '</b></a>';
      if (c.txt && !c.name) at += ' title="' + h + '"';
      if (c.ed === 'ov' && r.ovr && r.ovr[c.k]) { cls += ' ovd'; at += ' title="Đã sửa tay – số tự tính: ' + esc(c.num2 ? lgNum(r.ovr[c.k].auto) : lgMoney(r.ovr[c.k].auto)) + '"'; }
      if (c.ed === 'in') { var iv = c.inV ? c.inV(r, M) : undefined; if (iv != null && iv !== '') cls += ' inp'; }
      if (c.ed && !lock) { cls += ' ed'; at += ' data-be="' + esc(c.k) + '" data-bt="' + c.ed + '" data-bid="' + esc(r.id) + '"' + (c.num2 ? ' data-n2="1"' : '') + (c.src ? ' data-src="' + c.src + '"' : ''); }
      return { h: h, cls: cls, at: at };
    };
    var rws = list.map(function (r, i) { return { at: ' data-row="' + esc(r.id) + '"', cells: [{ h: i + 1, cls: 'c' }].concat(vis.map(function (c) { return cell(c, r); })) }; });
    var foot = [{ h: 'Tổng cộng ' + list.length + ' người' + (list.length < rows.length ? ' (theo bộ lọc)' : ''), span: 3 }].concat(vis.map(function (c, k) { if (k < 2) return { h: '' }; if (c.txt || c.num2 || c.warn) return { h: '' }; return { h: lgMoney(list.reduce(function (t, r) { return t + (+c.v(r) || 0); }, 0)), cls: 'n' }; }));
    var fz = 1 + (vis[0] && vis[0].id === 'ma' ? 1 : 0) + (vis[1] && vis[1].id === 'ten' ? 1 : 0);
    return kpi + '<div class="gx-card' + (f.full ? ' gx-full' : '') + '" data-ps="blg">' + (f.full ? '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Bảng lương tháng ' + HR.ymLabel(ym) + ' · ' + esc(shortUnit(u.name)) + '</b>' + (lock ? '<span class="tag tag-ok">Đã chốt</span>' : '<span class="tag tag-warn">Nháp</span>') + '</div>' : '') + bar + gxTable({ id: 'blG', cols: cols, rows: rws, foot: foot, fz: fz }) + leg + '</div><p class="lg-law" style="margin-top:8px">Bấm tên để xem từng bước tính và căn cứ pháp lý.</p>';
  }
  // ---------- Sửa ô trực tiếp trên bảng lương ----------
  function blParse(v, n2) { var t = String(v || '').trim(); if (t === '') return ''; if (n2) { t = (t.indexOf(',') >= 0 ? t.replace(/\./g, '').replace(',', '.') : t).replace(/[^\d.]/g, ''); return t === '' || isNaN(+t) ? '' : +t; } t = t.replace(/[^\d]/g, ''); return t === '' ? '' : +t; }
  function blSetVal(u, ym, id, k, type, val) {
    var M = lgM(u, ym), box = type === 'in' ? (M.inp) : (M.ovr = M.ovr || {}), o = box[id] || (box[id] = {});
    if (val === '') delete o[k]; else o[k] = val;
    if (type === 'ov' && val !== '') { var r = lgCalc(u, ym, id); if (r && r.ovr[k] && Math.round(r.ovr[k].auto * 100) === Math.round(val * 100)) delete o[k]; }
    if (!Object.keys(o).length) delete box[id];
  }
  var BL_DOWN = null; // 10/11 12:09 anh: bấm ô khác khi đang sửa → lưu ô cũ, mở luôn ô mới, giữ vị trí cuộn
  function blEdit(td) {
    if (td.querySelector('input')) return;
    var u = blUnit(), ym = PS.blg.ym, k = td.getAttribute('data-be'), type = td.getAttribute('data-bt'), id = td.getAttribute('data-bid'), n2 = !!td.getAttribute('data-n2'), M = lgM(u, ym);
    var cur = type === 'in' ? ((M.inp[id] || {})[k]) : ((M.ovr || {})[id] || {})[k], shown = td.textContent.replace(' ✎', '').trim();
    var init = cur != null && cur !== '' ? (n2 ? lgNum(cur) : fmtInt(cur)) : shown;
    var h0 = td.innerHTML; td.classList.add('ein'); td.innerHTML = '<input class="input" inputmode="' + (n2 ? 'decimal' : 'numeric') + '" value="' + esc(init) + '" aria-label="Sửa ô">';
    var inp = td.querySelector('input'), done = false; inp.focus(); inp.select();
    var commit = function (save) {
      if (done) return; done = true; var back = function () { td.classList.remove('ein'); td.innerHTML = h0; }; if (!save) { back(); return; } // 10/11 12:09 anh: không vẽ lại cả bảng khi thoát/không đổi → giữ vị trí cuộn ngang
      var raw = inp.value, val = blParse(raw, n2);
      if (String(raw).trim() === init) { back(); return; }
      gxSnap('bl', u, ym, 'sửa ô ' + id); blSetVal(u, ym, id, k, type, val); blSave(u, ym, ''); var sy = window.scrollY, w = $('#blG'), sx = w ? w.scrollLeft : 0, st0 = w ? w.scrollTop : 0;
      var nx = BL_DOWN && BL_DOWN !== td && BL_DOWN.isConnected ? { b: BL_DOWN.getAttribute('data-bid'), e: BL_DOWN.getAttribute('data-be') } : null; BL_DOWN = null; // ô vừa bấm sang (blur do bấm ô khác)
      PS.blg.fill = !nx && type === 'in' && val !== '' ? { k: k, v: val, id: id, n2: n2 } : null;
      render(); window.scrollTo(0, sy); var w2 = $('#blG'); if (w2) { w2.scrollLeft = sx; w2.scrollTop = st0; }
      if (nx) { var td2 = document.querySelector('#blG td.ed[data-bid="' + nx.b + '"][data-be="' + nx.e + '"]'); if (td2) blEdit(td2); }
      if (type === 'ov') toast(val === '' ? 'Đã trả về số tự tính' : 'Đã sửa tay – ô được đánh dấu cam', val === '' ? '' : 'warn');
      if (PS.blg.fill) blFillPop();
    };
    inp.addEventListener('paste', function (e) { // dán 1 cột nhiều dòng từ Excel → các dòng bên dưới (theo bộ lọc)
      var all = [].slice.call(document.querySelectorAll('#blG td.ed[data-be="' + k + '"]')), from = all.indexOf(td); if (from < 0) return;
      var NM = {}; (u.data.NV || []).forEach(function (e) { NM[e['Mã NV']] = e['Họ và tên'] || ''; }); var T = all.slice(from).map(function (x) { var b = x.getAttribute('data-bid'); return { id: b, name: (b + ' ' + (NM[b] || '')).trim() }; });
      var col = blCols(u).filter(function (c) { return c.k === k && c.ed; })[0], label = col ? col.t : k, sx = ($('#blG') || {}).scrollLeft || 0;
      gxPaste(e, { targets: T, n2: n2, label: label, apply: function (list) { done = true; gxSnap('bl', u, ym, 'dán ' + list.length + ' ô ' + label); list.forEach(function (x) { blSetVal(u, ym, x.id, k, type, x.val); }); blSave(u, ym, 'dán ' + list.length + ' giá trị cột ' + label); PS.blg.fill = null; var w = $('#blG'), st = w ? w.scrollTop : 0, sy = window.scrollY; render(); window.scrollTo(0, sy); var w2 = $('#blG'); if (w2) { w2.scrollLeft = sx; w2.scrollTop = st; } } });
    });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); commit(false); } });
    inp.addEventListener('blur', function () { commit(true); });
  }
  // gợi ý điền cùng giá trị cho các dòng phía dưới (ô nhập cuối tháng)
  function blFillPop() {
    var F = PS.blg.fill; if (!F) return; var old = $('.bl-fill'); if (old) old.remove();
    var trs = Array.prototype.slice.call(document.querySelectorAll('#blG tr[data-row]')), ids = trs.map(function (t) { return t.getAttribute('data-row'); }), at = ids.indexOf(F.id), below = at < 0 ? [] : ids.slice(at + 1);
    if (!below.length) { PS.blg.fill = null; return; }
    var u = blUnit(), M = lgM(u, PS.blg.ym), empty = below.filter(function (id) { var v = (M.inp[id] || {})[F.k]; return v == null || v === ''; });
    var td = document.querySelector('#blArea td[data-bid="' + F.id + '"][data-be="' + F.k + '"]'), rc = td ? td.getBoundingClientRect() : { left: 20, bottom: 120 };
    var pop = document.createElement('div'); pop.className = 'bl-fill'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = 'Áp dụng <b>' + (F.n2 ? lgNum(F.v) : lgMoney(F.v)) + '</b> cho các nhân viên phía dưới?<div class="link-row">' + (empty.length ? '<button class="btn btn-sm btn-primary" data-fill="empty">Điền ' + empty.length + ' dòng còn trống</button>' : '') + '<button class="btn btn-sm' + (empty.length ? '' : ' btn-primary') + '" data-fill="all">Điền cả ' + below.length + ' dòng dưới</button><button class="btn btn-sm" data-fill="no">Bỏ qua</button></div>';
    document.body.appendChild(pop);
    var x = Math.min(window.innerWidth - pop.offsetWidth - 12, Math.max(12, rc.left)), y = rc.bottom + 6; if (y + pop.offsetHeight > window.innerHeight - 8) y = Math.max(8, rc.top - pop.offsetHeight - 6); pop.style.left = x + 'px'; pop.style.top = y + 'px';
    pop.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fill]'); if (!b) return; var how = b.getAttribute('data-fill'); pop.remove(); PS.blg.fill = null; if (how === 'no') return;
      var list = how === 'all' ? below : empty; gxSnap('bl', u, PS.blg.ym, 'điền cho ' + list.length + ' dòng dưới'); list.forEach(function (id) { blSetVal(u, PS.blg.ym, id, F.k, 'in', F.v); }); blSave(u, PS.blg.ym, 'điền ' + F.k + ' cho ' + list.length + ' người'); toast('Đã điền cho ' + list.length + ' người');
      var sy = window.scrollY, w = $('#blG'), sx = w ? w.scrollLeft : 0, st0 = w ? w.scrollTop : 0; render(); window.scrollTo(0, sy); var w2 = $('#blG'); if (w2) { w2.scrollLeft = sx; w2.scrollTop = st0; }
    });
    setTimeout(function () { document.addEventListener('mousedown', function off(e) { if (!pop.contains(e.target)) { pop.remove(); PS.blg.fill = null; document.removeEventListener('mousedown', off); } }); }, 0);
  }
  ACTS['bl-full'] = function () { PS.blg.full = !PS.blg.full; render(); };
  ACTS['bl-colsel'] = function () { var u = blUnit(); blHide(); gxColSel({ title: 'Cột hiển thị trên bảng lương', sub: shortUnit(u.name), cols: blCols(u), hideKey: 'blHide', ordKey: 'blOrd', hide0: { ld: 1 }, main: function (c) { return !!(c.hl || c.id === 'ht' || c.id === 'tax' || c.id === 'warn'); } }); };
  /* Nhập số liệu từ file Excel (12:35 10/11 anh): KPI, thưởng, tạm ứng, khấu trừ, tỷ lệ đạt – ghép theo Mã NV (không có mã thì theo Họ và tên duy nhất) */
  var BL_IMP0 = ['kpi', 'thle', 'tamung'];
  function blImpCols(u) { return blCols(u).filter(function (c) { return c.ed === 'in'; }); }
  ACTS['bl-imp'] = function () {
    var u = blUnit(), ym = PS.blg.ym, cols = blImpCols(u), M = lgM(u, ym); if (M.lock) { toast('Bảng lương đã chốt – mở lại để nhập', 'warn'); return; }
    var pick = cols.map(function (c) { return '<label class="lg-chk" style="margin:0 14px 6px 0"><input type="checkbox" data-ic="' + esc(c.k) + '"' + (BL_IMP0.indexOf(c.k) >= 0 ? ' checked' : '') + '> ' + esc(c.t) + '</label>'; }).join('');
    var m = modal('Nhập số liệu từ Excel', 'Bảng lương tháng ' + HR.ymLabel(ym) + ' · ' + shortUnit(u.name),
      '<ol class="lg-law" style="font-size:13px;margin:0 0 10px;padding-left:18px"><li>Chọn các cột cần nhập rồi bấm <b>Tải file mẫu</b> – file có sẵn Mã NV, Họ và tên, số đang có.</li><li>Điền số vào file (giữ nguyên dòng tiêu đề và cột Mã NV). Có thể dùng file riêng của đơn vị, miễn có cột <b>Mã NV</b> (hoặc Họ và tên) và cột trùng tên khoản.</li><li>Chọn file để xem trước, kiểm tra rồi bấm <b>Ghi nhận</b>.</li></ol>' +
      '<div style="display:flex;flex-wrap:wrap">' + pick + '</div><div class="link-row" style="gap:8px;margin:8px 0 12px"><button class="btn btn-sm" id="biTpl">' + ic('xuat', 14) + 'Tải file mẫu</button><label class="btn btn-sm btn-primary" style="cursor:pointer">Chọn file Excel…<input type="file" id="biF" accept=".xlsx,.xls,.xlsm,.csv" hidden></label></div><div id="biOut"></div>');
    var sel = function () { return [].slice.call(m.querySelectorAll('[data-ic]:checked')).map(function (x) { return x.getAttribute('data-ic'); }); };
    $('#biTpl', m).onclick = function () {
      var ks = sel(); if (!ks.length) { toast('Chọn ít nhất 1 cột', 'warn'); return; } var cs = cols.filter(function (c) { return ks.indexOf(c.k) >= 0; }), rows = blRows(u, ym);
      saveXlsx([{ name: 'Nhap_lieu', title: 'NHẬP SỐ LIỆU BẢNG LƯƠNG THÁNG ' + HR.ymLabel(ym), note: shortUnit(u.name) + ' · điền số vào các cột, giữ nguyên Mã NV · tỷ lệ đạt nhập số % (vd 95)', cols: [{ t: 'Mã NV', w: 10 }, { t: 'Họ và tên', w: 26 }, { t: 'Bộ phận', w: 18 }].concat(cs.map(function (c) { return { t: c.t, w: 16, hl: 1 }; })),
        rows: rows.map(function (r) { return [r.id, r.name, r.dept || ''].concat(cs.map(function (c) { var v = c.inV ? c.inV(r, M) : null; return v == null || v === '' ? null : +v; })); }) }], fileName('Mau nhap lieu bang luong ' + ym + ' ' + shortUnit(u.name), 'xlsx'));
    };
    $('#biF', m).onchange = function () {
      var f = this.files[0]; if (!f) return; var out = $('#biOut', m); out.innerHTML = '<p class="lg-law">Đang đọc ' + esc(f.name) + '…</p>';
      f.arrayBuffer().then(function (buf) {
        var wb = XR.open(new Uint8Array(buf), f.name), res = null;
        wb.sheetNames.some(function (sn) { var R = blImpParse(u, ym, wb.getRows(sn), cols); if (R.cols.length) { R.sheet = sn; res = R; return true; } return false; });
        if (!res) { out.innerHTML = '<div class="notice bad">' + ic('info') + '<div>Không tìm thấy dòng tiêu đề có cột <b>Mã NV</b> (hoặc Họ và tên) và ít nhất 1 cột trùng tên khoản: ' + cols.map(function (c) { return esc(c.t); }).join(', ') + '.</div></div>'; return; }
        out.innerHTML = blImpView(res); var b = $('#biOk', m); if (b) b.onclick = function () {
          gxSnap('bl', u, ym, 'nhập Excel ' + f.name); res.ch.forEach(function (x) { blSetVal(u, ym, x.id, x.k, 'in', x.v); }); blSave(u, ym, 'nhập từ Excel ' + f.name + ': ' + res.ch.length + ' ô (' + res.cols.map(function (c) { return c.t; }).join(', ') + ')');
          m.close(); toast('Đã ghi nhận ' + res.ch.length + ' ô từ ' + f.name, 'ok'); gxKeep('blG', render); };
      }).catch(function (e) { out.innerHTML = '<div class="notice bad">' + ic('info') + '<div>Không đọc được file: ' + esc(e && e.friendly ? e.message : 'file hỏng hoặc không phải Excel') + '</div></div>'; });
    };
  };
  function blImpParse(u, ym, rows, cols) {
    var nz = function (x) { return norm(String(x == null ? '' : x)).replace(/[^a-z0-9%]+/g, ' ').trim(); }, hr = -1, map = {}, ci = -1, ni = -1;
    for (var i = 0; i < Math.min(rows.length, 15); i++) { var r = rows[i] || [], mi = -1, nn = -1, mm = {}; r.forEach(function (v, j) { var t = nz(v); if (t === 'ma nv' || t === 'ma nhan vien' || t === 'ma') mi = j; else if (t === 'ho va ten' || t === 'ho ten') nn = j; else cols.forEach(function (c) { if (t && t === nz(c.t)) mm[c.k] = j; }); }); if ((mi >= 0 || nn >= 0) && Object.keys(mm).length) { hr = i; map = mm; ci = mi; ni = nn; break; } }
    var R = { cols: cols.filter(function (c) { return map[c.k] != null; }), ch: [], same: 0, bad: [], miss: [], dup: [], rows: 0 }; if (hr < 0) { R.cols = []; return R; }
    var people = blRows(u, ym), byId = {}, byNm = {}, M = lgM(u, ym); people.forEach(function (p) { byId[String(p.id).toUpperCase()] = p; var n = norm(p.name); byNm[n] = byNm[n] ? 'dup' : p; });
    for (var r2 = hr + 1; r2 < rows.length; r2++) { var row = rows[r2]; if (!row) continue; var code = ci >= 0 && row[ci] != null ? String(row[ci]).trim() : '', nm = ni >= 0 && row[ni] != null ? String(row[ni]).trim() : ''; if (!code && !nm) continue;
      var p = code ? byId[code.toUpperCase()] : null; if (!p && nm) { var q = byNm[norm(nm)]; if (q === 'dup') { R.dup.push(nm); continue; } p = q; } if (!p) { R.miss.push(code || nm); continue; } R.rows++;
      R.cols.forEach(function (c) { var raw = row[map[c.k]]; if (raw == null || raw === '') return; var g = typeof raw === 'number' ? { v: c.num2 ? raw : Math.round(raw) } : gxNum(raw, c.num2); if (g.err) { R.bad.push(p.id + ' – ' + c.t + ': "' + raw + '" ' + g.err); return; } var old = c.inV ? c.inV(p, M) : null; if (old != null && old !== '' && +old === g.v) { R.same++; return; } R.ch.push({ id: p.id, name: p.name, k: c.k, t: c.t, old: old, v: g.v, n2: c.num2 }); }); }
    return R;
  }
  function blImpView(R) {
    var f = function (x, n2) { return x == null || x === '' ? '–' : n2 ? lgNum(x) : lgMoney(x); };
    return '<div class="notice' + (R.bad.length || R.miss.length || R.dup.length ? ' warn' : '') + '">' + ic('info') + '<div>Sheet <b>' + esc(R.sheet) + '</b> · cột nhận được: <b>' + R.cols.map(function (c) { return esc(c.t); }).join(', ') + '</b> · ' + R.rows + ' người khớp · <b>' + R.ch.length + ' ô thay đổi</b>' + (R.same ? ', ' + R.same + ' ô giữ nguyên' : '') +
      (R.miss.length ? '<br><b>Không tìm thấy trên bảng lương (' + R.miss.length + '):</b> ' + R.miss.slice(0, 15).map(esc).join(', ') : '') + (R.dup.length ? '<br><b>Trùng họ tên, cần Mã NV:</b> ' + R.dup.map(esc).join(', ') : '') + (R.bad.length ? '<br><b>Giá trị lỗi – bỏ qua (' + R.bad.length + '):</b><br>' + R.bad.slice(0, 12).map(esc).join('<br>') : '') + '</div></div>' +
      (R.ch.length ? '<div class="tbl-wrap" style="max-height:38vh;margin-top:8px"><table class="tbl"><thead><tr><th>Mã NV</th><th>Họ và tên</th><th>Khoản</th><th class="r">Đang có</th><th class="r">Mới</th></tr></thead><tbody>' + R.ch.map(function (x) { return '<tr><td>' + esc(x.id) + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.t) + '</td><td class="r">' + f(x.old, x.n2) + '</td><td class="r"><b>' + f(x.v, x.n2) + '</b></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
      '<div class="link-row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn" data-close>Đóng</button><button class="btn btn-primary" id="biOk"' + (R.ch.length ? '' : ' disabled') + '>Ghi nhận ' + R.ch.length + ' ô</button></div>';
  }
  ACTS['bl-dc'] = function () { var u = blUnit(), ym = PS.blg.ym; modal('Đối chiếu với bảng lương đơn vị đang dùng', 'Tháng ' + HR.ymLabel(ym) + ' · ' + shortUnit(u.name), blTabDc(u, ym)); };
  // 16:00 10/11 anh: sau khi chốt có nút In bảng lương – A4 ngang, đủ các cột đang hiển thị, tổng cộng, bằng chữ, chữ ký cuối trang
  ACTS['bl-print'] = function () {
    var u = blUnit(), ym = PS.blg.ym, rows = blRows(u, ym), cols = blVis(u), L = lgM(u, ym).lock, c = coInfo(u), acc = typeof plAccent === 'function' ? plAccent() : '#1D6A50';
    var val = function (cl, r) { var v = cl.v(r); if (cl.warn) return ''; if (cl.txt) return esc(v == null ? '' : String(v)); return v == null || v === '' ? '' : cl.num2 ? String(Math.round(v * 100) / 100).replace('.', ',') : lgMoney(v); };
    cols = cols.filter(function (cl) { return !cl.warn; });
    var gh = '', k = 0; while (k < cols.length) { var g = cols[k].g, j = k; while (j < cols.length && cols[j].g === g) j++; gh += '<th colspan="' + (j - k) + '"' + (g ? '' : ' class="e"') + '>' + esc(g || '') + '</th>'; k = j; }
    var th = '<tr><th rowspan="2">STT</th>' + gh + '<th rowspan="2">Ký nhận</th></tr><tr>' + cols.map(function (cl) { return '<th>' + esc(cl.t) + (cl.tag ? '<br><i>' + esc(cl.tag) + '</i>' : '') + '</th>'; }).join('') + '</tr>';
    var tb = rows.map(function (r, i) { return '<tr><td class="c">' + (i + 1) + '</td>' + cols.map(function (cl) { return '<td class="' + (cl.txt ? '' : 'n') + (cl.hl ? ' hl' : '') + '">' + val(cl, r) + '</td>'; }).join('') + '<td></td></tr>'; }).join('');
    var tot = '<tr class="t"><td></td>' + cols.map(function (cl, i) { if (i === 1) return '<td>TỔNG CỘNG ' + rows.length + ' người</td>'; if (cl.txt || cl.num2) return '<td></td>'; return '<td class="n' + (cl.hl ? ' hl' : '') + '">' + lgMoney(rows.reduce(function (s0, r) { return s0 + Math.round(+cl.v(r) || 0); }, 0)) + '</td>'; }).join('') + '<td></td></tr>';
    var pay = rows.reduce(function (s0, r) { return s0 + (+r.pay || 0); }, 0);
    var A3 = cols.length > 22, PW = A3 ? 1530 : 1060, css = '@page{size:' + (A3 ? 'A3' : 'A4') + ' landscape;margin:8mm}body{margin:0;font:8px/1.25 "Be Vietnam Pro","Segoe UI",Arial,sans-serif;color:#1d2329;-webkit-print-color-adjust:exact;print-color-adjust:exact}.h{display:flex;justify-content:space-between;border-bottom:2px solid ' + acc + ';padding-bottom:4px;font-size:10px}.h b{font-size:11.5px}h1{text-align:center;font-size:15px;margin:8px 0 0;color:' + acc + '}.sub{text-align:center;margin:2px 0 8px;font-size:10px;color:#5c6670}table{width:100%;border-collapse:collapse}th,td{border:1px solid #c9d1d6;padding:.35em .3em}th{background:color-mix(in srgb,' + acc + ' 12%,#fff);font-weight:700;text-align:center;vertical-align:middle}th i{font-weight:400}th.e{background:#fff;border-bottom:0}td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}td.c{text-align:center}td.hl{font-weight:700}tr.t td{font-weight:700;background:color-mix(in srgb,' + acc + ' 8%,#fff)}thead{display:table-header-group}tr{page-break-inside:avoid}.chu{margin:6px 0 0;font-size:10px}.d{text-align:right;margin:10px 0 2px;font-style:italic;font-size:10px}.sg{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;font-size:10.5px;min-height:90px;page-break-inside:avoid}.sg b{display:block}.sg i{font-size:9px;color:#6b757e}';
    var html = '<div class="h"><div><b>' + esc(c.ten) + '</b>' + (c.dc ? '<br>' + esc(c.dc) : '') + (c.mst ? '<br>MST: ' + esc(c.mst) : '') + '</div><div style="text-align:right">' + (L ? 'Đã chốt ' + esc(L.at) + '<br>' + esc(L.by) : 'NHÁP – chưa chốt') + '</div></div>' +
      '<h1>BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ' + HR.ymLabel(ym) + '</h1><p class="sub">Đơn vị tính: đồng</p><table><thead>' + th + '</thead><tbody>' + tb + tot + '</tbody></table>' +
      '<p class="chu">Tổng thực lĩnh bằng chữ: <i>' + esc(lgChu(pay)) + '</i></p><p class="d">……, ngày …… tháng …… năm ……</p>' +
      '<div class="sg"><div><b>Người lập biểu</b><i>(ký, ghi rõ họ tên)</i></div><div><b>Kế toán trưởng</b><i>(ký, ghi rõ họ tên)</i></div><div><b>Giám đốc</b><i>(ký, đóng dấu, ghi rõ họ tên)</i></div></div>';
    var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + PW + 'px;height:600px;border:0'; document.body.appendChild(fr); // rộng = khổ giấy ngang trừ lề (A3 khi nhiều cột) → đo để thu nhỏ vừa trang
    var d = fr.contentWindow.document; d.open(); d.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Bang luong ' + HR.ymLabel(ym) + ' ' + esc(shortUnit(u.name)) + '</title><style>' + css + '</style></head><body>' + html + '</body></html>'); d.close();
    try { var tbE = d.querySelector('table'), fs = 8; for (var it = 0; it < 4 && tbE.scrollWidth > PW; it++) { fs = Math.max(4, fs * PW / tbE.scrollWidth * 0.98); tbE.style.fontSize = fs.toFixed(2) + 'px'; } } catch (e) { } // thu cỡ chữ bảng cho vừa khổ giấy (không dùng zoom – trình duyệt in bỏ qua)
    log('In bảng lương ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + rows.length + ' người');
    setTimeout(function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { toast('Trình duyệt chặn in – thử lại', 'warn'); } setTimeout(function () { fr.remove(); }, 1500); }, 300);
  };
  ACTS['bl-xls'] = function () {
    var u = blUnit(), ym = PS.blg.ym, all = blRows(u, ym), rows = blFilter(all, PS.blg), cols = blVis(u), L = lgM(u, ym).lock, data = [], bold = [], i = 0;
    var val = function (c, r) { var v = c.v(r); return c.txt ? (v == null ? '' : String(v)) : (v == null || v === '' ? null : Math.round((+v) * (c.num2 ? 100 : 1)) / (c.num2 ? 100 : 1)); };
    var ovT = function (r) { return Object.keys(r.ovr || {}).map(function (k) { var c = cols.filter(function (x) { return x.k === k; })[0]; return c ? c.t : k; }).join(', '); };
    var sum = function (a, t) { return [null].concat(cols.map(function (c, k) { if (k === 1) return t; if (c.txt || c.num2) return null; return a.reduce(function (s0, r) { return s0 + Math.round(+c.v(r) || 0); }, 0); }), [null, null]); };
    rows.forEach(function (r) { data.push([++i].concat(cols.map(function (c) { return c.warn ? (r.warn || []).filter(function (w) { return w.lv !== 'info'; }).map(function (w) { return w.t; }).join(' · ') : val(c, r); }), [ovT(r), ''])); });
    data.push(sum(rows, 'TỔNG CỘNG ' + rows.length + ' người')); bold.push(data.length - 1);
    var xc = [{ t: 'STT', w: 6 }].concat(cols.map(function (c) { return { t: c.t + (c.tag ? ' (' + c.tag + ')' : ''), hl: !!c.hl, w: c.txt ? (c.warn ? 50 : 22) : 14 }; }), [{ t: 'Ô sửa tay', w: 30 }, { t: 'Ký nhận', w: 14 }]);
    var groups = [], k0 = 0; while (k0 < cols.length) { var g = cols[k0].g; if (!g) { k0++; continue; } var j = k0; while (j < cols.length && cols[j].g === g) j++; groups.push({ t: g, from: k0 + 1, to: j }); k0 = j; }
    saveXlsx([{ name: 'Bang luong ' + ym, title: 'BẢNG TÍNH – THANH TOÁN TIỀN LƯƠNG THÁNG ' + HR.ymLabel(ym), note: u.name + ' · đơn vị: đồng · ' + (L ? 'đã chốt ' + L.at + ' bởi ' + L.by : 'NHÁP – chưa chốt') + (rows.length < all.length ? ' · theo bộ lọc ' + rows.length + '/' + all.length + ' người' : ''), cols: xc, groups: groups, rows: data, bold: bold }], fileName('Bang luong ' + HR.ymLabel(ym) + ' ' + shortUnit(u.name)));
  };
  BINDS.bl = function () {
    if (PS.blg.view === 'file') { if (BL_OLD_B && $('#blOld')) { try { BL_OLD_B(); } catch (e) { } } return; }
    var y = $('#blYm'); if (y) y.addEventListener('change', function () { PS.blg.ym = y.value; render(); });
    var q = $('#blQ'); if (q) q.addEventListener('input', function () { PS.blg.q = q.value; clearTimeout(q._t); q._t = setTimeout(function () { var p = q.selectionStart; render(); var q2 = $('#blQ'); if (q2) { q2.focus(); q2.setSelectionRange(p, p); } }, 250); });
    gxBind('blG'); document.querySelectorAll('[data-blf]').forEach(function (el) { el.addEventListener('change', function () { var k = el.getAttribute('data-blf'); PS.blg[k] = el.type === 'checkbox' ? el.checked : el.value; render(); }); });
    var a = $('#blArea'); if (a) a.addEventListener('mousedown', function (e) { BL_DOWN = e.target.closest('td.ed'); }, true); if (a) a.addEventListener('click', function (e) { var td = e.target.closest('td.ed'); if (td && !e.target.closest('a')) blEdit(td); });
  };

  ACTS['bl-ct'] = function (a, id) { var u = blUnit(), r = blRows(u, PS.blg.ym).filter(function (x) { return x.id === id; })[0]; if (!r) return; modal(r.name, 'Bảng lương tháng ' + HR.ymLabel(PS.blg.ym) + (lgM(u, PS.blg.ym).lock ? ' · đã chốt' : ' · tạm tính'), '<div class="lg-pv">' + lgCard(r) + '</div>'); };

  // Tab: đối chiếu với bảng lương đơn vị đang dùng (file Excel đã nạp vào phần mềm – loại "Bảng lương")
  var BL_DC = [['Ngày công', function (r) { return r.c.hr ? null : r.c.cong; }, ['Ngày công thực tế'], 1], ['Lương đóng BH', function (r) { return r.c.bhBase; }, ['Lương đóng BH']], ['BH người lao động đóng', function (r) { return r.c.bhNL; }, ['BHXH (8%)', 'BHYT (1,5%)', 'BHTN (1%)']], ['Tổng thu nhập', function (r) { return r.c.tongTN; }, ['Tổng thu nhập']], ['Thu nhập chịu thuế', function (r) { return r.c.tnct; }, ['Thu nhập chịu thuế']], ['Thu nhập tính thuế', function (r) { return r.c.tntt; }, ['Thu nhập tính thuế']], ['Thuế TNCN', function (r) { return r.c.tax; }, ['Thuế TNCN']], ['Thực lĩnh', function (r) { return r.c.pay; }, ['Thực lĩnh']]];
  function blTabDc(u, ym) {
    var file = (u.data.BL || {})[ym] || [];
    if (!file.length) return '<div><p>Chưa có bảng lương đơn vị đang dùng của tháng ' + HR.ymLabel(ym) + '. Nạp file Excel bảng lương (cột Mã NV, Tổng thu nhập, Thực lĩnh…) ở <a href="#nhap">Nhập dữ liệu</a> rồi quay lại đây – phần mềm so từng người, từng khoản và chỉ ra dòng chênh lệch.</p></div>';
    var rows = blRows(u, ym), by = {}; file.forEach(function (x) { by[x['Mã NV']] = x; }); var seen = {}, nDiff = 0;
    var num = function (x, ks) { var has = ks.some(function (k) { return x[k] !== undefined && x[k] !== ''; }); return has ? ks.reduce(function (t, k) { return t + (+x[k] || 0); }, 0) : null; };
    var th = '<tr><th>Mã NV</th><th>Họ và tên</th>' + BL_DC.map(function (d) { return '<th class="n" colspan="3">' + d[0] + '</th>'; }).join('') + '</tr><tr><th></th><th></th>' + BL_DC.map(function () { return '<th class="n">Phần mềm</th><th class="n">Đang dùng</th><th class="n">Chênh</th>'; }).join('') + '</tr>';
    var tb = rows.map(function (r) {
      var x = by[r.id]; seen[r.id] = 1; var any = false;
      var tds = BL_DC.map(function (d) { var a = d[1](r), b = x ? num(x, d[2]) : null, df = a != null && b != null ? a - b : null, bad = df != null && Math.abs(df) >= (d[3] ? 0.5 : 1000); if (bad) any = true; var f0 = function (v) { return v == null ? '<span class="faint">—</span>' : d[3] ? lgNum(v) : lgMoney(v); }; return '<td class="n">' + f0(a) + '</td><td class="n">' + f0(b) + '</td><td class="n' + (bad ? ' bad' : '') + '">' + (df == null ? '' : bad ? (df > 0 ? '+' : '') + (d[3] ? lgNum(df) : lgMoney(df)) : '✓') + '</td>'; }).join('');
      if (any || !x) nDiff++;
      return '<tr><td>' + esc(r.id) + '</td><td><a href="#" data-act="bl-ct" data-id="' + esc(r.id) + '">' + esc(r.name) + '</a>' + (!x ? ' <span class="tag tag-warn">không có trên bảng đang dùng</span>' : '') + '</td>' + tds + '</tr>';
    }).join('');
    var only = file.filter(function (x) { return !seen[x['Mã NV']]; });
    return '<div class="card card-pad bl-dc"><p style="margin-top:0"><b>' + nDiff + ' / ' + rows.length + ' người</b> có chênh lệch (từ 1.000 đồng hoặc 0,5 công).' + (only.length ? ' <b>' + only.length + ' người</b> chỉ có trên bảng đang dùng: ' + esc(only.map(function (x) { return x['Mã NV'] + ' ' + (x['Họ và tên'] || ''); }).join(', ')) + '.' : '') + '</p><p class="lg-law">Chênh lệch có thể do bảng đang dùng tính khác quy định (ví dụ lương đóng BH thấp hơn tổng lương + phụ cấp cố định, khấu trừ thuế 10% với mọi mức chi) hoặc do thiết lập trong phần mềm chưa đúng với quy chế lương – bấm tên để xem từng bước tính và căn cứ.</p><div class="tbl-wrap"><table class="tbl blt"><thead>' + th + '</thead><tbody>' + tb + '</tbody></table></div></div>';
  }
  ACTS['bl-lock'] = function () {
    var u = blUnit(), ym = PS.blg.ym; if (!bcX(u).lock[ym]) { toast('Chốt công tháng ' + HR.ymLabel(ym) + ' trước', 'warn'); return; }
    var cc = lgccOf(u, ym); if (!cc || !cc.duyet) { toast('Duyệt Cơ cấu nhân sự tháng ' + HR.ymLabel(ym) + ' trước khi chốt bảng lương', 'warn'); return; }
    var rows = blCalc(u, ym), bad = rows.filter(function (r) { return r.warn.some(function (w) { return w.lv === 'bad'; }); }), sum = rows.reduce(function (t, r) { return t + r.pay; }, 0);
    var m = modal('Chốt bảng lương tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<p>' + rows.length + ' người · tổng thực lĩnh <b>' + lgMoney(sum) + ' đồng</b>.</p>' + (bad.length ? '<div class="notice warn">' + ic('info') + '<div><b>' + bad.length + ' người có cảnh báo cần xem:</b><br>' + bad.map(function (r) { return esc(r.name) + ': ' + esc(r.warn.filter(function (w) { return w.lv === 'bad'; }).map(function (w) { return w.t; }).join('; ')); }).join('<br>') + '</div></div>' : '') + '<p class="lg-law">Sau khi chốt, bảng lương được giữ nguyên (kể cả khi sửa công, thiết lập), phiếu lương lấy từ bảng đã chốt. Muốn sửa phải Mở lại (ghi lý do).</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="blOk">Chốt bảng lương</button></div>', true);
    $('#blOk', m).onclick = function () { var M = lgM(u, ym); M.lock = { at: nowVn(), by: ccUser(), ts: Date.now(), rows: rows.map(blSnap) }; blSave(u, ym, 'chốt bảng lương (' + rows.length + ' người, thực lĩnh ' + lgMoney(sum) + ')'); m.close(); toast('Đã chốt bảng lương tháng ' + HR.ymLabel(ym), 'ok'); render(); };
  };
  ACTS['bl-open'] = function () {
    var u = blUnit(), ym = PS.blg.ym, m = modal('Mở lại bảng lương tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<div class="field"><label for="blWhy">Lý do mở lại *</label><input class="input" id="blWhy" maxlength="200"></div><p class="lg-law">Phiếu lương đã gửi nhân viên vẫn giữ bản cũ cho đến khi chốt lại và gửi lại.</p><p id="blMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="blOk">Mở lại</button></div>', true);
    $('#blOk', m).onclick = function () { var w = $('#blWhy', m).value.trim(); if (!w) { $('#blMsg', m).textContent = 'Nhập lý do'; return; } var M = lgM(u, ym); M.prev = M.lock; M.lock = null; blSave(u, ym, 'mở lại bảng lương – ' + w); m.close(); toast('Đã mở lại bảng lương'); render(); };
  };
