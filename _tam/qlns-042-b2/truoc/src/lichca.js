  /* =====================================================================
     LỊCH XẾP CA (0.4.2 – anh duyệt GĐ1 + GĐ2 lúc 08:08 11/11/2026)
       - Bộ phận làm theo ca (kho, xưởng sản xuất…): mỗi người một ca theo từng ngày, người quản lý xếp trước
       - Lưu trong đơn vị: u.lich = { v, d: { Mã NV: { 'yyyy-mm-dd': mã ca | 'N' (nghỉ) } }, pub: { thứ Hai của tuần: { at, by } }, log: [] }
       - Chấm công đối chiếu ca đã xếp của từng người (bcMonth): đi muộn, về sớm, vắng ca; ngày chưa xếp ca không báo vắng
       - Cảnh báo khi xếp: vượt 48 giờ/tuần (BLLĐ Điều 105), không có ngày nghỉ hằng tuần (Điều 111), nghỉ chưa đủ 12 giờ khi chuyển ca (Điều 110)
       - Tuần đã công bố được khóa: sửa phải ghi lý do, mọi lần sửa ghi nhật ký
       - Nhân viên đăng ký ca trên điện thoại: giai đoạn 3 (chưa làm)
     ===================================================================== */
  var LC_COLS = [['#2563eb', 'Xanh dương'], ['#d97706', 'Cam'], ['#7c3aed', 'Tím'], ['#059669', 'Xanh lá'], ['#db2777', 'Hồng'], ['#0891b2', 'Xanh ngọc'], ['#64748b', 'Xám']];
  var LC_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var LC_EMPTY = { v: 0, d: {}, pub: {}, log: [] };
  function lcOf(u) { return (u && u.lich) || LC_EMPTY; }
  function lcW(u) { var L = u.lich || (u.lich = { v: 0, d: {}, pub: {}, log: [] }); L.d = L.d || {}; L.pub = L.pub || {}; L.log = L.log || []; return L; }
  function lcColIdx(s, sh) { if (sh && sh.col != null && sh.col !== '') return +sh.col; var i = s.shifts.indexOf(sh); return (i < 0 ? 0 : i) % LC_COLS.length; }
  function lcCol(s, code) { if (code === 'N') return '#94a3b8'; var sh = ccShiftById(s, code); return sh ? LC_COLS[lcColIdx(s, sh)][0] : '#64748b'; }
  function lcSave(u, msg) { var L = lcW(u); L.v = (L.v || 0) + 1; u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) log('Lịch xếp ca (' + u.name + '): ' + msg); }
  function lcLog(u, o) { var L = lcW(u); o.at = nowVn(); o.by = o.by || ccUser(); L.log.push(o); if (L.log.length > 600) L.log.splice(0, L.log.length - 600); }
  function lcPubOf(u, iso) { return lcOf(u).pub[ccMon(iso)] || null; }
  function lcTxt(code) { return code === 'N' ? 'Nghỉ' : code || ''; }

  // dữ liệu mẫu (11/11): Đốm Sáng Health có Xưởng Đóng gói 6 người, 3 ca (sáng, chiều, đêm), xoay ca theo tuần, nghỉ Chủ nhật
  function lcSample(u) {
    u.lcV = 1; var D = 'Xưởng Đóng gói', ppl = (u.data.NV || []).filter(function (e) { return e['Phòng ban'] === D && e['Mã NV']; }); if (!ppl.length) return;
    if (!u.ccset) { u.ccset = u._ccDraft || ccDefault(u); u._ccDraft = null; }
    var s = ccNorm(u.ccset), all6 = { 1: 'f', 2: 'f', 3: 'f', 4: 'f', 5: 'f', 6: 'f', 0: 'o' };
    [{ id: 'S', name: 'Ca sáng', inT: '06:00', outT: '14:30', bFrom: '10:00', bTo: '10:30', col: 3 }, { id: 'C', name: 'Ca chiều', inT: '14:00', outT: '22:30', bFrom: '18:00', bTo: '18:30', col: 1 }, { id: 'Đ', name: 'Ca đêm', inT: '22:00', outT: '06:45', bFrom: '02:00', bTo: '02:45', col: 2, rateX: 100 }]
      .forEach(function (x) { if (!ccShiftById(s, x.id)) s.shifts.push(Object.assign({ days: Object.assign({}, all6), rateX: 100 }, x)); });
    s.deptShift = s.deptShift || {}; s.deptShift[D] = 'S'; s.exc.dept[D] = Object.assign(s.exc.dept[D] || {}, { hrf: 1, sch: 1 }); if (!s.at) s.at = '28/09/2026 08:00:00';
    var L = lcW(u), codes = ['S', 'C', 'Đ'], base = '2026-09-28';
    ppl.forEach(function (e, i) {
      var id = e['Mã NV'], t = Math.floor(i / 2) % 3, join = String(e['Ngày vào làm'] || '').slice(0, 10), m = L.d[id] = {};
      for (var iso = base; iso <= '2026-12-31'; iso = ccAdd(iso, 1)) { if (join && iso < join) continue; var w = Math.floor(lgDays(base, iso) / 7); m[iso] = ccDow(iso) === 0 ? 'N' : codes[(t + w) % 3]; }
    });
    // tình huống mẫu: tuần 16–22/11 SG010 đang ca đêm, được xếp thêm ca sáng Chủ nhật 22/11 → cảnh báo thiếu ngày nghỉ tuần, nghỉ chưa đủ 12 giờ khi chuyển ca
    if (L.d.SG010) L.d.SG010['2026-11-22'] = 'S';
    for (var mo = base; mo <= '2026-11-16'; mo = ccAdd(mo, 7)) L.pub[mo] = { at: HR.vnDate(ccAdd(mo, -3)) + ' 16:00:00', by: 'Quản đốc xưởng (dữ liệu mẫu)' };
    L.log.push({ at: '28/09/2026 08:00:00', by: 'Quản đốc xưởng (dữ liệu mẫu)', what: 'Xếp xoay ca theo tuần 3 tổ (sáng – chiều – đêm), nghỉ Chủ nhật', n: 0 });
    L.v = (L.v || 0) + 1;
  }

  function lcStyle() {
    if (document.getElementById('lcCss')) return; var st = document.createElement('style'); st.id = 'lcCss';
    st.textContent = '.lc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}.lc-bar .grow{flex:1}.lc-pal{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.lc-pal .vc-lbl{margin-right:2px}' +
      '.lc-chip{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line-2);background:var(--card);border-radius:999px;padding:4px 11px 4px 5px;font-size:12.5px;cursor:pointer;color:var(--ink)}.lc-chip b{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:999px;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c);font-size:12px}.lc-chip small{color:var(--muted)}.lc-chip.on{border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}' +
      '.lc-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--card);max-height:70vh}.lc{border-collapse:separate;border-spacing:0;font-size:12.5px;min-width:100%}.lc th,.lc td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:0;text-align:center;white-space:nowrap}' +
      '.lc thead th{position:sticky;top:0;background:var(--card);z-index:2;padding:6px 4px;font-weight:600}.lc thead th small{display:block;font-weight:500;color:var(--muted);font-size:10.5px}.lc th.lc-nm,.lc td.lc-nm{position:sticky;left:0;z-index:1;background:var(--card);text-align:left;padding:6px 10px;min-width:190px}.lc thead th.lc-nm{z-index:3}.lc td.lc-nm small{display:block;color:var(--muted);font-size:11px}' +
      '.lc th.hol{background:color-mix(in srgb,#ef4444 12%,var(--card))}.lc th.today{box-shadow:inset 0 -3px 0 var(--pri)}.lc th.lk small:after{content:" 🔒"}.lc th.sun{color:#b45309}' +
      '.lc td.lc-c{min-width:' + 46 + 'px;height:36px}.lc td.lc-c button{all:unset;box-sizing:border-box;display:grid;place-items:center;width:100%;height:36px;cursor:pointer;font-weight:700;user-select:none;touch-action:none;position:relative}.lc td.lc-c button:focus-visible{outline:2px solid var(--pri);outline-offset:-2px}' +
      '.lc td.lc-c.on button{background:color-mix(in srgb,var(--c) 17%,transparent);color:var(--c)}.lc td.lc-c.off button{color:var(--muted);font-weight:500;background:repeating-linear-gradient(45deg,transparent 0 5px,rgba(127,127,127,.07) 5px 10px)}.lc td.lc-c.lk button{cursor:not-allowed}.lc td.lc-c.lk.unl button{cursor:pointer}.lc td.lc-c.miss button:after,.lc td.lc-c.extra button:after{content:"";position:absolute;top:3px;right:3px;width:7px;height:7px;border-radius:50%;background:#dc2626}.lc td.lc-c.extra button:after{background:#d97706}.lc td.lc-c.today{box-shadow:inset 2px 0 0 var(--pri),inset -2px 0 0 var(--pri)}' +
      '.lc td.lc-t,.lc th.lc-t{padding:4px 8px;min-width:64px;font-variant-numeric:tabular-nums}.lc td.lc-w{min-width:44px}.lc td.lc-w .tag{cursor:help}.lc tfoot td{background:rgba(127,127,127,.05);font-size:11.5px;color:var(--muted);padding:4px 2px}.lc tfoot td.lc-nm{font-weight:600;color:var(--ink-2)}.lc tfoot b{color:var(--c)}' +
      '.lc-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--muted);margin:10px 0 0}.lc-leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}.lc-pat{display:flex;flex-wrap:wrap;gap:6px}.lc-pat select{width:auto;min-width:64px}.lc-ppl{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 12px;max-height:180px;overflow:auto;padding:6px;border:1px solid var(--line);border-radius:10px}.lc-ppl label{display:flex;gap:6px;align-items:center;font-size:13px}.lc-sub{font-size:12.5px;color:var(--muted);margin:4px 0 0}#lrF,#lrT,#lrC{display:grid;gap:12px}#lrF .field{margin:0}';
    document.head.appendChild(st);
  }
  function lcUnit() { var f = ps('lc', { u: '', dept: '', view: 'week', d: '', q: '', brush: '', unl: {} }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function lcDepts(u, s) { var o = {}; (u.data.PB || []).forEach(function (p) { if (p['Tên phòng ban']) o[p['Tên phòng ban']] = 0; }); ccActive(u).forEach(function (e) { var d = e['Phòng ban'] || ''; if (d) o[d] = (o[d] || 0) + 1; }); return Object.keys(o).map(function (d) { return { d: d, n: o[d], sch: !!((s.exc.dept || {})[d] || {}).sch, hrf: !!((s.exc.dept || {})[d] || {}).hrf }; }).sort(function (a, b) { return (b.sch - a.sch) || 0; }); }
  function lcRange(f) {
    var d = f.d || refDate(), a, b, days = [];
    if (f.view === 'month') { a = d.slice(0, 7) + '-01'; b = bcDays(d.slice(0, 7)).pop(); } else { a = ccMon(d); b = ccAdd(a, 6); }
    for (var x = a; x <= b; x = ccAdd(x, 1)) days.push(x);
    return { a: a, b: b, days: days, label: f.view === 'month' ? 'Tháng ' + HR.ymLabel(d.slice(0, 7)) : HR.vnDate(a).slice(0, 5) + ' – ' + HR.vnDate(b) };
  }
  function lcPeople(u, f, a, b) {
    var q = norm(f.q || '');
    return (u.data.NV || []).filter(function (e) {
      if (!e['Mã NV'] || (e['Phòng ban'] || '') !== f.dept) return false; var j = String(e['Ngày vào làm'] || '').slice(0, 10), l = String(e['Ngày nghỉ việc'] || '').slice(0, 10);
      if ((j && j > b) || (l && l < a)) return false; return !q || norm(e['Mã NV'] + ' ' + (e['Họ và tên'] || '')).indexOf(q) >= 0;
    });
  }
  function lcInRange(e, iso) { var j = String(e['Ngày vào làm'] || '').slice(0, 10), l = String(e['Ngày nghỉ việc'] || '').slice(0, 10); return !(j && iso < j) && !(l && iso > l); }
  // cảnh báo xếp ca của 1 người trong các tuần chạm khoảng đang xem
  function lcWarn(u, s, id, a, b) {
    var M = lcOf(u).d[id] || {}, out = [], H = {}, info = function (c) { var sh = c && c !== 'N' ? ccShiftById(s, c) : null; return sh ? shiftInfo(sh) : null; };
    for (var mo = ccMon(a); mo <= b; mo = ccAdd(mo, 7)) {
      var hrs = 0, nW = 0, nSet = 0; for (var k = 0; k < 7; k++) { var c = M[ccAdd(mo, k)]; if (c) nSet++; var i = info(c); if (i) { hrs += i.full; nW++; } }
      if (hrs > 48) out.push({ lv: 'bad', t: 'Tuần ' + HR.vnDate(mo).slice(0, 5) + ': ' + ccNum(Math.round(hrs * 10) / 10) + ' giờ – vượt 48 giờ/tuần (BLLĐ Điều 105)' });
      if (nW === 7) out.push({ lv: 'bad', t: 'Tuần ' + HR.vnDate(mo).slice(0, 5) + ': làm cả 7 ngày, không có ngày nghỉ hằng tuần (BLLĐ Điều 111 – nghỉ ít nhất 24 giờ liên tục mỗi tuần)' });
    }
    for (var d = a; d <= b; d = ccAdd(d, 1)) {
      var c0 = M[ccAdd(d, -1)], c1 = M[d], i0 = info(c0), i1 = info(c1);
      if (i0 && i1) { var gap = 1440 + i1.a - i0.b; if (gap < 720) out.push({ lv: 'bad', t: HR.vnDate(ccAdd(d, -1)).slice(0, 5) + ' → ' + HR.vnDate(d).slice(0, 5) + ': ca ' + c0 + ' → ca ' + c1 + ' chỉ nghỉ ' + (gap > 0 ? ccNum(Math.round(gap / 6) / 10) + ' giờ' : 'trùng giờ') + ' – cần nghỉ ít nhất 12 giờ trước khi chuyển ca (BLLĐ Điều 110)' }); }
      var hh = holMap(s, d.slice(0, 4))[d]; if (hh && (hh.k === 'le' || hh.k === 'bu') && i1) out.push({ lv: 'warn', t: HR.vnDate(d).slice(0, 5) + ' (' + hh.t + '): xếp ca ngày lễ – giờ làm tính tăng ca ít nhất 300% (BLLĐ Điều 98)' });
    }
    return out;
  }

  PAGES.lichca = function () {
    lcStyle(); if (typeof gxStyle === 'function') gxStyle();
    var u = lcUnit(); if (!u) return pageHead('Lịch xếp ca') + noData('dữ liệu nhân sự');
    var f = PS.lc, s = ccOf(u), L = lcOf(u), us = selUnits().length ? selUnits() : S.units; if (!f.d) f.d = refDate();
    var dl = lcDepts(u, s); if (!f.dept || !dl.some(function (x) { return x.d === f.dept; })) { var sd = dl.filter(function (x) { return x.sch; })[0]; f.dept = sd ? sd.d : (dl[0] || {}).d || ''; }
    var R = lcRange(f), days = R.days, ppl = lcPeople(u, f, R.a, R.b), dep = dl.filter(function (x) { return x.d === f.dept; })[0] || { sch: false, hrf: false };
    var brushOk = f.brush === 'N' || f.brush === 'X' || ccShiftById(s, f.brush); if (!brushOk) { var b0 = s.shifts.filter(function (x) { return x.id !== s.def; })[0] || s.shifts[0]; f.brush = b0 ? b0.id : 'N'; }
    var TD = refDate(), yms = {}; days.forEach(function (d) { yms[d.slice(0, 7)] = 1; }); var B = {}; Object.keys(yms).forEach(function (ym) { var r = bcMonth(u, ym); B[ym] = {}; r.ppl.forEach(function (p) { B[ym][p.id] = p; }); });
    var cnt = {}, nSet = 0, hrsT = 0, nWarn = 0, miss = 0, extra = 0;
    var rows = ppl.map(function (e) {
      var id = e['Mã NV'], M = L.d[id] || {}, h = 0, ws = lcWarn(u, s, id, R.a, R.b); if (ws.some(function (w) { return w.lv === 'bad'; })) nWarn++;
      var cells = days.map(function (iso) {
        if (!lcInRange(e, iso)) return '<td class="lc-c off"><button type="button" disabled title="Chưa vào làm / đã nghỉ việc">·</button></td>';
        var c = M[iso] || '', sh = c && c !== 'N' ? ccShiftById(s, c) : null, i = sh ? shiftInfo(sh) : null, pub = L.pub[ccMon(iso)], unl = pub && f.unl[ccMon(iso)];
        if (i) { h += i.full; nSet++; cnt[iso + '|' + c] = (cnt[iso + '|' + c] || 0) + 1; }
        var bp = B[iso.slice(0, 7)][id], bc = bp ? bp.days[iso.slice(8, 10)] : null, mk = '';
        if (bc && iso <= TD) { if (sh && bc.issue === 'vang') { mk = ' miss'; miss++; } else if (bc.guess) { mk = ' extra'; extra++; } }
        var tip = HR.vnDate(iso) + ' · ' + (sh ? sh.id + ' ' + sh.name + ' ' + sh.inT + '–' + sh.outT : c === 'N' ? 'Nghỉ' : 'Chưa xếp ca') + (pub ? ' · tuần đã công bố' + (unl ? ' (đang mở sửa)' : ' – sửa phải ghi lý do') : '') + (mk === ' miss' ? ' · VẮNG CA (không có lượt chấm)' : mk === ' extra' ? ' · đi làm ngoài lịch (ca ' + (bc.sh ? bc.sh.id : '') + ')' : '') + (bc && bc.tin && iso <= TD ? ' · chấm ' + bc.tin + '–' + (bc.tout || '?') : '');
        return '<td class="lc-c' + (c ? ' on' : '') + (pub ? ' lk' : '') + (unl ? ' unl' : '') + mk + (iso === TD ? ' today' : '') + '" style="--c:' + lcCol(s, c) + '"><button type="button" data-lc="' + esc(id) + '|' + iso + '" title="' + esc(tip) + '">' + esc(lcTxt(c)) + '</button></td>';
      }).join('');
      hrsT += h;
      var wt = ws.length ? '<span class="tag ' + (ws.some(function (w) { return w.lv === 'bad'; }) ? 'tag-bad' : 'tag-warn') + '" title="' + esc(ws.map(function (w) { return w.t; }).join('\n')) + '">' + ws.length + '</span>' : '<span class="faint">–</span>';
      var ex = ccExc(s, id, e['Phòng ban'], e);
      return '<tr><td class="lc-nm"><b>' + personLink(u, id, e['Họ và tên'] || id) + '</b><small>' + esc(id + (e['Chức danh công việc'] || e['Chức vụ'] ? ' · ' + (e['Chức danh công việc'] || e['Chức vụ']) : '')) + (ex.hrf ? ' · lương theo giờ' : '') + '</small></td>' + cells + '<td class="lc-t"><b>' + ccNum(Math.round(h * 10) / 10) + '</b></td><td class="lc-w">' + wt + '</td></tr>';
    }).join('');
    var head = '<tr><th class="lc-nm">Nhân sự (' + ppl.length + ')</th>' + days.map(function (iso) {
      var hh = holMap(s, iso.slice(0, 4))[iso], pub = L.pub[ccMon(iso)];
      return '<th class="' + (hh && (hh.k === 'le' || hh.k === 'bu') ? 'hol' : '') + (iso === TD ? ' today' : '') + (pub ? ' lk' : '') + (ccDow(iso) === 0 ? ' sun' : '') + '" title="' + esc(HR.vnDate(iso) + ' · ' + ccDowT(iso) + (hh ? ' · ' + hh.t : '') + (pub ? ' · tuần đã công bố ' + pub.at : '')) + '">' + iso.slice(8, 10) + (f.view === 'week' ? '/' + iso.slice(5, 7) : '') + '<small>' + LC_DOW[ccDow(iso)] + '</small></th>';
    }).join('') + '<th class="lc-t" title="Tổng giờ làm theo ca đã xếp trong khoảng đang xem (đã trừ nghỉ giữa ca)">Giờ</th><th class="lc-t" title="Cảnh báo theo BLLĐ 2019 – rê chuột để xem">Lưu ý</th></tr>';
    var foot = s.shifts.filter(function (sh) { return days.some(function (iso) { return cnt[iso + '|' + sh.id]; }); }).map(function (sh) {
      return '<tr style="--c:' + lcCol(s, sh.id) + '"><td class="lc-nm">Ca ' + esc(sh.id) + ' · ' + esc(sh.name) + '</td>' + days.map(function (iso) { var n = cnt[iso + '|' + sh.id] || 0; return '<td>' + (n ? '<b>' + n + '</b>' : '·') + '</td>'; }).join('') + '<td></td><td></td></tr>';
    }).join('');
    var weeks = []; for (var mo = ccMon(R.a); mo <= R.b; mo = ccAdd(mo, 7)) weeks.push(mo);
    var nPub = weeks.filter(function (w) { return L.pub[w]; }).length, wk0 = weeks[0], pub0 = L.pub[wk0];
    var unitSeg = us.length > 1 ? '<div class="field"><label>Công ty</label><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="lc-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : '';
    var filt = '<div class="filters card card-pad">' + unitSeg + selectBox('lcDept', 'Bộ phận', dl.map(function (x) { return [x.d, x.d + (x.sch ? ' · xếp ca' : '') + ' (' + x.n + ')']; }), f.dept, 220) +
      '<div class="field"><label>Xem theo</label><div class="seg"><button class="' + (f.view === 'week' ? 'on' : '') + '" data-act="lc-view" data-id="week">Tuần</button><button class="' + (f.view === 'month' ? 'on' : '') + '" data-act="lc-view" data-id="month">Tháng</button></div></div>' +
      '<div class="field"><label>' + esc(R.label) + '</label><div class="seg"><button data-act="lc-nav" data-id="-1" aria-label="Trước">‹ Trước</button><button data-act="lc-nav" data-id="0">Hôm nay</button><button data-act="lc-nav" data-id="1" aria-label="Sau">Sau ›</button></div></div>' + '<div class="field"><label for="lcQ">Tìm</label><input class="input" id="lcQ" value="' + esc(f.q || '') + '" placeholder="Tên, mã NV" style="width:170px"></div>' + '</div>';
    var note = !dep.sch ? '<div class="notice warn" style="margin:12px 0 0">' + ic('info') + '<div>Bộ phận <b>' + esc(f.dept) + '</b> chưa bật <b>Xếp ca theo lịch</b>: ngày chưa xếp vẫn tính theo ca của bộ phận. Bật để chấm công chỉ theo ca đã xếp (ngày chưa xếp không báo vắng)' + (dep.hrf ? '' : ' – có thể bật thêm <b>Lương theo giờ thực tế</b> cho kho, xưởng') + '.</div><button class="btn btn-sm btn-primary" data-act="lc-on">Bật xếp ca' + (dep.hrf ? '' : ' + lương theo giờ') + '</button></div>' : '';
    var pal = '<div class="lc-bar"><div class="lc-pal"><span class="vc-lbl">Bút xếp ca</span>' + s.shifts.map(function (sh) { var i = shiftInfo(sh); return '<button type="button" class="lc-chip' + (f.brush === sh.id ? ' on' : '') + '" style="--c:' + lcCol(s, sh.id) + '" data-act="lc-brush" data-id="' + esc(sh.id) + '" title="' + esc(sh.name + ' ' + sh.inT + '–' + sh.outT + (i ? ' · ' + ccNum(i.full) + ' giờ' : '')) + '"><b>' + esc(sh.id) + '</b>' + esc(sh.name) + ' <small>' + esc(sh.inT + '–' + sh.outT) + '</small></button>'; }).join('') +
      '<button type="button" class="lc-chip' + (f.brush === 'N' ? ' on' : '') + '" style="--c:#94a3b8" data-act="lc-brush" data-id="N"><b>N</b>Nghỉ</button><button type="button" class="lc-chip' + (f.brush === 'X' ? ' on' : '') + '" style="--c:#dc2626" data-act="lc-brush" data-id="X"><b>×</b>Xóa ô</button></div><span class="grow"></span>' +
      '<button class="btn btn-sm" data-act="lc-copy" title="Mỗi ngày đang xem lấy theo ca của đúng ngày đó tuần trước">' + ic('hd', 15) + 'Chép từ tuần trước</button><button class="btn btn-sm" data-act="lc-rot">Xếp xoay ca…</button><button class="btn btn-sm" data-act="lc-clear">Xóa lịch đang xem</button><button class="btn btn-sm" data-act="lc-xls">' + ic('xuat', 15) + 'Excel</button>' +
      (f.view === 'week' ? (pub0 ? '<button class="btn btn-sm" data-act="lc-unpub" data-id="' + wk0 + '">Mở khóa tuần</button>' : '<button class="btn btn-sm btn-primary" data-act="lc-pub" data-id="' + wk0 + '">Công bố, khóa tuần</button>') : '') + '<button class="btn btn-sm" data-act="lc-log">Nhật ký</button></div>';
    var kpi = typeof gxKpi === 'function' ? gxKpi([{ l: 'Số người', v: ppl.length }, { l: 'Ca đã xếp', v: nSet }, { l: 'Giờ làm theo lịch', v: ccNum(Math.round(hrsT)) + ' giờ' }, { l: 'Người có cảnh báo', v: nWarn, cls: nWarn ? 'k-bad' : '' }, { l: 'Lệch so với chấm công', v: miss + extra, d: miss + extra ? miss + ' vắng ca · ' + extra + ' ngoài lịch' : 'đến hôm nay', cls: miss ? 'k-warn' : '' }, { l: f.view === 'week' ? 'Trạng thái tuần' : 'Tuần đã công bố', v: f.view === 'week' ? (pub0 ? 'Đã công bố' : 'Chưa công bố') : nPub + '/' + weeks.length, d: f.view === 'week' && pub0 ? pub0.at.slice(0, 10) + ' · ' + pub0.by : '' }]) : '';
    var grid = ppl.length ? '<div class="lc-wrap"><table class="lc"><thead>' + head + '</thead><tbody>' + rows + '</tbody>' + (foot ? '<tfoot>' + foot + '</tfoot>' : '') + '</table></div>' : '<div class="card empty"><h2>Bộ phận chưa có người</h2><p>Chọn bộ phận khác ở ô Bộ phận.</p></div>';
    var leg = '<div class="lc-leg"><span>Chọn bút rồi <b>bấm hoặc kéo</b> qua các ô để xếp ca.</span><span><i style="background:#dc2626"></i>Vắng ca (đã qua, không có lượt chấm)</span><span><i style="background:#d97706"></i>Đi làm ngoài lịch</span><span>🔒 Tuần đã công bố – sửa phải ghi lý do</span><span>Căn cứ BLLĐ 2019: tối đa 48 giờ/tuần (Điều 105), nghỉ ít nhất 12 giờ trước khi chuyển ca (Điều 110), mỗi tuần nghỉ ít nhất 24 giờ liên tục (Điều 111).</span></div>';
    return pageHead('Lịch xếp ca', 'Xếp ca từng người, từng ngày cho bộ phận làm theo ca – chấm công và tính lương theo ca đã xếp. Ca làm việc đặt ở <a href="#thietlapcc">Thiết lập chấm công</a>.') + filt + note + kpi + pal + grid + leg;
  };
  ACTS['lc-u'] = function (a, id) { PS.lc.u = id; PS.lc.dept = ''; PS.lc.brush = ''; render(); };
  ACTS['lc-view'] = function (a, id) { PS.lc.view = id; render(); };
  ACTS['lc-nav'] = function (a, id) { var f = PS.lc, n = +id; if (!n) f.d = refDate(); else if (f.view === 'month') { var ym = ccuAddM(f.d.slice(0, 7), n); f.d = ym + '-01'; } else f.d = ccAdd(f.d || refDate(), 7 * n); render(); };
  ACTS['lc-brush'] = function (a, id) { PS.lc.brush = id; $$('.lc-chip').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-id') === id); }); };
  ACTS['lc-on'] = function () { var u = lcUnit(), s = ccOf(u), d = PS.lc.dept; if (!d) return; s.exc.dept[d] = Object.assign(s.exc.dept[d] || {}, { sch: 1, hrf: 1 }); ccSave(u, 'bật xếp ca theo lịch + lương theo giờ thực tế cho ' + d); toast('Đã bật xếp ca theo lịch và tính lương theo giờ thực tế cho ' + d, 'ok', 'Đổi lại ở Thiết lập chấm công → Ngoại lệ.'); render(); };
  // ghi nhiều ô 1 lần: ch = { 'Mã NV|iso': mã ca | '' } – bỏ qua tuần đã công bố chưa mở sửa
  function lcApply(u, ch, what, why) {
    var L = lcW(u), n = 0, skip = 0, f = PS.lc;
    Object.keys(ch).forEach(function (k) { var a = k.split('|'), id = a[0], iso = a[1], v = ch[k], M = L.d[id] || (L.d[id] = {}), old = M[iso] || '';
      if (old === v) return; if (L.pub[ccMon(iso)] && !f.unl[ccMon(iso)]) { skip++; return; }
      if (v) M[iso] = v; else delete M[iso]; n++; L.log.push({ at: nowVn(), by: ccUser(), id: id, iso: iso, old: old, nw: v, why: L.pub[ccMon(iso)] ? f.unl[ccMon(iso)] : '' }); });
    if (L.log.length > 600) L.log.splice(0, L.log.length - 600);
    if (n) { lcSave(u, what + ' (' + n + ' ô)'); }
    return { n: n, skip: skip };
  }
  function lcRerender() { var w = $('.lc-wrap'), sx = w ? w.scrollLeft : 0, sy = w ? w.scrollTop : 0, y = window.scrollY; render(); window.scrollTo(0, y); var w2 = $('.lc-wrap'); if (w2) { w2.scrollLeft = sx; w2.scrollTop = sy; } }
  function lcAskUnlock(u, mon, then) {
    var P = lcOf(u).pub[mon]; if (!P) return then && then();
    var m = modal('Sửa lịch tuần đã công bố', 'Tuần ' + HR.vnDate(mon) + ' – ' + HR.vnDate(ccAdd(mon, 6)), '<p>Tuần này đã công bố bởi <b>' + esc(P.by) + '</b> lúc ' + esc(P.at) + '. Nhân viên đã biết lịch – sửa thì nên báo lại người liên quan.</p><div class="field"><label for="lcWhy">Lý do sửa *</label><input class="input" id="lcWhy" maxlength="160" placeholder="Ví dụ: đổi ca theo đơn của nhân viên, thiếu người ca đêm"></div><p id="lcMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="lcOk">Mở sửa tuần này</button></div>', true);
    $('#lcOk', m).onclick = function () { var why = $('#lcWhy', m).value.trim(); if (!why) { $('#lcMsg', m).textContent = 'Nhập lý do sửa'; return; } PS.lc.unl[mon] = why; m.close(); toast('Đã mở sửa tuần ' + HR.vnDate(mon).slice(0, 5) + ' – mọi thay đổi ghi kèm lý do', 'ok'); lcRerender(); if (then) then(); };
  }
  function lcVisible(u) { var f = PS.lc, R = lcRange(f); return { R: R, ppl: lcPeople(u, f, R.a, R.b) }; }
  ACTS['lc-copy'] = function () {
    var u = lcUnit(), V = lcVisible(u), L = lcOf(u), ch = {}, M = {};
    V.ppl.forEach(function (e) { var id = e['Mã NV'], src = Object.assign({}, L.d[id] || {}); V.R.days.forEach(function (iso) { if (!lcInRange(e, iso)) return; var v = src[ccAdd(iso, -7)] || ''; src[iso] = v; ch[id + '|' + iso] = v; }); });
    var r = lcApply(u, ch, 'chép từ tuần trước'); toast(r.n ? 'Đã chép ' + r.n + ' ô từ tuần trước' : 'Không có ô nào thay đổi', r.n ? 'ok' : 'info', r.skip ? r.skip + ' ô thuộc tuần đã công bố không đổi – bấm Mở khóa tuần hoặc sửa từng ô (ghi lý do).' : ''); lcRerender();
  };
  ACTS['lc-clear'] = function () {
    var u = lcUnit(), V = lcVisible(u);
    confirmBox('Xóa lịch đang xem?', 'Xóa ca đã xếp của ' + V.ppl.length + ' người, ' + V.R.label + '. Tuần đã công bố không bị xóa.', 'Xóa lịch', function () { var ch = {}; V.ppl.forEach(function (e) { V.R.days.forEach(function (iso) { ch[e['Mã NV'] + '|' + iso] = ''; }); }); var r = lcApply(u, ch, 'xóa lịch ' + V.R.label); toast('Đã xóa ' + r.n + ' ô', 'ok', r.skip ? r.skip + ' ô thuộc tuần đã công bố giữ nguyên.' : ''); lcRerender(); });
  };
  ACTS['lc-pub'] = function (a, mon) {
    var u = lcUnit(), s = ccOf(u), V = lcVisible(u), bad = 0; V.ppl.forEach(function (e) { if (lcWarn(u, s, e['Mã NV'], mon, ccAdd(mon, 6)).some(function (w) { return w.lv === 'bad'; })) bad++; });
    var go = function () { var L = lcW(u); L.pub[mon] = { at: nowVn(), by: ccUser() }; delete PS.lc.unl[mon]; lcLog(u, { what: 'Công bố, khóa tuần ' + HR.vnDate(mon) + ' – ' + HR.vnDate(ccAdd(mon, 6)) }); lcSave(u, 'công bố tuần ' + mon); toast('Đã công bố lịch tuần ' + HR.vnDate(mon).slice(0, 5) + ' – ' + HR.vnDate(ccAdd(mon, 6)).slice(0, 5), 'ok', 'Gửi lịch lên điện thoại nhân viên sẽ có ở giai đoạn 3.'); lcRerender(); };
    if (bad) confirmBox('Còn ' + bad + ' người có cảnh báo', 'Lịch tuần này có người vượt 48 giờ, thiếu ngày nghỉ tuần hoặc nghỉ chưa đủ 12 giờ khi chuyển ca (rê chuột vào cột Lưu ý để xem). Vẫn công bố?', 'Vẫn công bố', go); else go();
  };
  ACTS['lc-unpub'] = function (a, mon) {
    var u = lcUnit(), P = lcOf(u).pub[mon]; if (!P) return;
    var m = modal('Mở khóa tuần ' + HR.vnDate(mon).slice(0, 5) + ' – ' + HR.vnDate(ccAdd(mon, 6)).slice(0, 5), shortUnit(u.name), '<p>Đã công bố bởi <b>' + esc(P.by) + '</b> lúc ' + esc(P.at) + '. Mở khóa để sửa thoải mái, xong thì công bố lại.</p><div class="field"><label for="lcUw">Lý do mở khóa *</label><input class="input" id="lcUw" maxlength="160"></div><p id="lcUm" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="lcUo">Mở khóa</button></div>', true);
    $('#lcUo', m).onclick = function () { var why = $('#lcUw', m).value.trim(); if (!why) { $('#lcUm', m).textContent = 'Nhập lý do'; return; } delete lcW(u).pub[mon]; lcLog(u, { what: 'Mở khóa tuần ' + HR.vnDate(mon), why: why }); lcSave(u, 'mở khóa tuần ' + mon); m.close(); toast('Đã mở khóa tuần', 'ok'); lcRerender(); };
  };
  ACTS['lc-log'] = function () {
    var u = lcUnit(), L = lcOf(u), nv = {}; (u.data.NV || []).forEach(function (e) { nv[e['Mã NV']] = e['Họ và tên']; });
    var ls = L.log.slice().reverse().slice(0, 200);
    modal('Nhật ký lịch xếp ca', shortUnit(u.name), ls.length ? '<div class="tbl-wrap" style="max-height:60vh"><table class="tbl"><thead><tr><th>Thời điểm</th><th>Người sửa</th><th>Nội dung</th><th>Lý do</th></tr></thead><tbody>' + ls.map(function (o) { return '<tr><td class="mono">' + esc(o.at || '') + '</td><td>' + esc(o.by || '') + '</td><td>' + (o.what ? esc(o.what) : esc((nv[o.id] || o.id) + ' · ' + HR.vnDate(o.iso) + ': ' + (lcTxt(o.old) || 'trống') + ' → ' + (lcTxt(o.nw) || 'trống'))) + '</td><td>' + esc(o.why || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có thay đổi nào.</p>');
  };
  ACTS['lc-xls'] = function () {
    var u = lcUnit(), s = ccOf(u), V = lcVisible(u), L = lcOf(u);
    var cols = [{ t: 'Mã NV', f: function (e) { return e['Mã NV']; } }, { t: 'Họ và tên', f: function (e) { return e['Họ và tên']; } }].concat(V.R.days.map(function (iso) { return { t: iso.slice(8, 10) + '/' + iso.slice(5, 7) + ' ' + LC_DOW[ccDow(iso)], f: function (e) { return lcTxt((L.d[e['Mã NV']] || {})[iso]); } }; }))
      .concat([{ t: 'Tổng giờ theo lịch', f: function (e) { var M = L.d[e['Mã NV']] || {}, h = 0; V.R.days.forEach(function (iso) { var sh = M[iso] && M[iso] !== 'N' ? ccShiftById(s, M[iso]) : null; if (sh && shiftInfo(sh)) h += shiftInfo(sh).full; }); return Math.round(h * 10) / 10; } }, { t: 'Lưu ý', f: function (e) { return lcWarn(u, s, e['Mã NV'], V.R.a, V.R.b).map(function (w) { return w.t; }).join('; '); } }]);
    exportRows('Lich xep ca ' + PS.lc.dept + ' ' + V.R.label, cols, V.ppl, s.shifts.map(function (sh) { return sh.id + ' = ' + sh.name + ' ' + sh.inT + '–' + sh.outT; }).join(' · ') + ' · N = Nghỉ');
  };
  // Xếp xoay ca: theo tuần (mỗi tổ 1 ca/tuần, xoay vòng) hoặc theo chuỗi ngày tự đặt
  ACTS['lc-rot'] = function () {
    var u = lcUnit(), s = ccOf(u), V = lcVisible(u), f = PS.lc;
    if (!V.ppl.length) { toast('Bộ phận chưa có người', 'err'); return; }
    var shs = s.shifts, oSh = function (sel) { return opt('', '—', sel) + shs.map(function (x) { return opt(x.id, x.id + ' ' + x.name, sel); }).join('') + opt('N', 'N Nghỉ', sel); };
    var def3 = shs.filter(function (x) { return x.id !== s.def; }); if (!def3.length) def3 = shs;
    var body = '<form id="lrF" novalidate><div class="field"><label>Cách xoay</label><div class="seg"><button type="button" class="on" data-m="tuan">Xoay theo tuần</button><button type="button" data-m="chuoi">Chuỗi ngày tự đặt</button></div></div>' +
      '<div id="lrT"><p class="lc-sub" style="margin-top:0">Chia người thành các tổ theo thứ tự danh sách; mỗi tuần mỗi tổ làm 1 ca, tuần sau chuyển sang ca kế tiếp (ví dụ sáng → chiều → đêm).</p><div class="field"><label>Thứ tự ca xoay</label><div class="lc-pat">' + [0, 1, 2, 3].map(function (i) { return '<select class="input" data-rt="' + i + '">' + oSh(def3[i] ? def3[i].id : '').replace(opt('N', 'N Nghỉ', def3[i] ? def3[i].id : ''), '') + '</select>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Ngày nghỉ trong tuần</label><div class="lc-pat">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<label class="lg-chk"><input type="checkbox" data-rd="' + d + '"' + (d === 0 ? ' checked' : '') + '> ' + LC_DOW[d] + '</label>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="lrG">Số tổ</label><input class="input" id="lrG" type="number" min="1" max="10" value="' + Math.min(3, V.ppl.length) + '" style="width:90px"><small class="faint" id="lrGn"></small></div></div>' +
      '<div id="lrC" style="display:none"><p class="lc-sub" style="margin-top:0">Đặt chuỗi ca lặp lại theo ngày, ví dụ 2 sáng – 2 chiều – 2 đêm – 1 nghỉ. Người sau bắt đầu lệch so với người trước theo số ngày đặt bên dưới.</p><div class="field"><label>Chuỗi ca (tối đa 14 ngày, để "—" ở cuối)</label><div class="lc-pat">' + Array.from({ length: 14 }, function (x, i) { var p0 = def3.length >= 3 ? [def3[0].id, def3[0].id, def3[1].id, def3[1].id, def3[2].id, def3[2].id, 'N'] : [def3[0].id, def3[0].id, def3[0].id, def3[0].id, def3[0].id, 'N', 'N']; return '<select class="input" data-rc="' + i + '">' + oSh(p0[i] || '') + '</select>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="lrO">Người sau lệch so với người trước</label><input class="input" id="lrO" type="number" min="0" max="13" value="2" style="width:90px"> <span class="faint">ngày</span></div></div>' +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="lrA">Từ ngày</label>' + dateInput('lrA', V.R.a) + '</div><div class="field"><label for="lrB">Đến ngày</label>' + dateInput('lrB', V.R.b) + '</div></div>' +
      '<div class="field"><label>Người áp dụng <span class="faint">(thứ tự = thứ tự chia tổ)</span></label><div class="lc-ppl">' + V.ppl.map(function (e) { return '<label><input type="checkbox" data-rp="' + esc(e['Mã NV']) + '" checked> ' + esc(e['Họ và tên'] || e['Mã NV']) + ' <span class="faint">' + esc(e['Mã NV']) + '</span></label>'; }).join('') + '</div></div>' +
      '<label class="lg-chk" style="margin:6px 0"><input type="checkbox" id="lrW" checked> Ghi đè ô đã xếp</label><p class="lc-sub">Tuần đã công bố không bị thay đổi. Kiểm tra cột Lưu ý sau khi xếp.</p><p id="lrM" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">Xếp ca</button></div></form>';
    var m = modal('Xếp xoay ca', f.dept + ' · ' + shortUnit(u.name), body), mode = 'tuan';
    $$('[data-m]', m).forEach(function (b) { b.onclick = function () { mode = b.getAttribute('data-m'); $$('[data-m]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#lrT', m).style.display = mode === 'tuan' ? '' : 'none'; $('#lrC', m).style.display = mode === 'chuoi' ? '' : 'none'; }; });
    var gN = function () { var g = Math.max(1, +$('#lrG', m).value || 1), n = $$('[data-rp]', m).filter(function (c) { return c.checked; }).length; $('#lrGn', m).textContent = ' ' + n + ' người → mỗi tổ khoảng ' + Math.ceil(n / g) + ' người'; }; $('#lrG', m).oninput = gN; $$('[data-rp]', m).forEach(function (c) { c.onchange = gN; }); gN();
    ['lrA', 'lrB'].forEach(function (k) { if (typeof bindDateInput === 'function') bindDateInput($('#' + k, m)); });
    var iso = function (k) { var mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec($('#' + k, m).value.trim()); return mm ? ccIso(+mm[3], +mm[2], +mm[1]) : ''; };
    $('#lrF', m).onsubmit = function (ev) {
      ev.preventDefault(); var msg = $('#lrM', m), a = iso('lrA'), b = iso('lrB'), ids = $$('[data-rp]', m).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-rp'); }), ow = $('#lrW', m).checked, L = lcOf(u), ch = {};
      if (!a || !b || b < a) { msg.textContent = 'Chọn khoảng ngày đúng dạng dd/mm/yyyy'; return; } if (lgDays(a, b) > 186) { msg.textContent = 'Xếp tối đa 6 tháng mỗi lần'; return; } if (!ids.length) { msg.textContent = 'Chọn ít nhất 1 người'; return; }
      var byId = {}; V.ppl.forEach(function (e) { byId[e['Mã NV']] = e; });
      if (mode === 'tuan') {
        var seq = $$('[data-rt]', m).map(function (x) { return x.value; }).filter(Boolean), off = $$('[data-rd]', m).filter(function (c) { return c.checked; }).map(function (c) { return +c.getAttribute('data-rd'); }), G = Math.max(1, Math.min(10, +$('#lrG', m).value || 1));
        if (!seq.length) { msg.textContent = 'Chọn ít nhất 1 ca để xoay'; return; } if (off.length > 5) { msg.textContent = 'Nghỉ tối đa 5 ngày/tuần'; return; }
        var per = Math.ceil(ids.length / G), m0 = ccMon(a);
        ids.forEach(function (id, i) { var t = Math.floor(i / per); for (var d = a; d <= b; d = ccAdd(d, 1)) { if (!lcInRange(byId[id], d)) continue; if (!ow && (L.d[id] || {})[d]) continue; var w = Math.floor(lgDays(m0, d) / 7); ch[id + '|' + d] = off.indexOf(ccDow(d)) >= 0 ? 'N' : seq[(t + w) % seq.length]; } });
      } else {
        var pat = []; $$('[data-rc]', m).forEach(function (x) { pat.push(x.value); }); while (pat.length && !pat[pat.length - 1]) pat.pop(); if (!pat.length || pat.indexOf('') >= 0) { msg.textContent = 'Chuỗi ca không được có ô trống ở giữa'; return; }
        var o = Math.max(0, +$('#lrO', m).value || 0);
        ids.forEach(function (id, i) { for (var d = a; d <= b; d = ccAdd(d, 1)) { if (!lcInRange(byId[id], d)) continue; if (!ow && (L.d[id] || {})[d]) continue; var k = ((lgDays(a, d) + i * o) % pat.length + pat.length) % pat.length; ch[id + '|' + d] = pat[k]; } });
      }
      var r = lcApply(u, ch, 'xếp xoay ca ' + HR.vnDate(a) + '–' + HR.vnDate(b)); m.close(); toast('Đã xếp ' + r.n + ' ô', 'ok', r.skip ? r.skip + ' ô thuộc tuần đã công bố giữ nguyên.' : 'Kiểm tra cột Lưu ý trước khi công bố.'); lcRerender();
    };
  };
  BINDS.lichca = function () {
    var u = lcUnit(); if (!u) return; var f = PS.lc;
    var dp = $('#lcDept'); if (dp) dp.addEventListener('change', function () { f.dept = dp.value; render(); });
    var q = $('#lcQ'); if (q) { var tq; q.addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { f.q = q.value; var pos = q.selectionStart; render(); var q2 = $('#lcQ'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) { } } }, 250); }); }
    var wrap = $('.lc-wrap'); if (!wrap) return;
    var down = false, ch = {}, s = ccOf(u);
    var paint = function (b) {
      var k = b.getAttribute('data-lc'), iso = k.split('|')[1], mon = ccMon(iso), td = b.parentNode; if (lcOf(u).pub[mon] && !f.unl[mon]) return false;
      var v = f.brush === 'X' ? '' : f.brush; if (ch[k] === v) return true; ch[k] = v;
      b.textContent = lcTxt(v); td.classList.toggle('on', !!v); td.style.setProperty('--c', lcCol(s, v)); return true;
    };
    var end = function () { if (!down) return; down = false; var n = Object.keys(ch).length; if (n) { var r = lcApply(u, ch, 'xếp ca'); ch = {}; lcRerender(); if (r.n) toast('Đã lưu ' + r.n + ' ô', 'ok'); } };
    wrap.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('[data-lc]'); if (!b || b.disabled || e.button > 0) return; e.preventDefault();
      var iso = b.getAttribute('data-lc').split('|')[1], mon = ccMon(iso); if (lcOf(u).pub[mon] && !f.unl[mon]) { lcAskUnlock(u, mon); return; }
      down = true; ch = {}; paint(b); try { b.releasePointerCapture(e.pointerId); } catch (x) { }
    });
    wrap.addEventListener('pointerover', function (e) { if (!down) return; var b = e.target.closest('[data-lc]'); if (b && !b.disabled) paint(b); });
    if (window._lcUp) document.removeEventListener('pointerup', window._lcUp); window._lcUp = end; document.addEventListener('pointerup', end);
    wrap.addEventListener('keydown', function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var b = e.target.closest('[data-lc]'); if (!b) return; e.preventDefault(); var iso = b.getAttribute('data-lc').split('|')[1], mon = ccMon(iso); if (lcOf(u).pub[mon] && !f.unl[mon]) { lcAskUnlock(u, mon); return; } down = true; ch = {}; paint(b); end(); });
  };
