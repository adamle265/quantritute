  /* =====================================================================
     LỊCH XẾP CA (0.4.2 – 11/11/2026; anh góp ý 09:56: kỳ xếp ca, quản lý xếp / nhân viên đăng ký, menu chọn từng ô, Ctrl+Z, chỉ thể hiện lịch)
       - Nằm trong Thiết lập chấm công → Khối sản xuất, vận hành → Xếp ca làm
       - u.lich = { v, cfg: { ky: ngay|tuan|thang, mode: ql|nv, hanChot, hanDk, hanDuyet }, d: { Mã NV: { iso: mã ca | N | P | KL } },
                    reg: { Mã NV: { iso: mã đăng ký } } (nhân viên đăng ký), duyet: { kỳ: {at, by} }, pub: { kỳ: {at, by, ky} } (đã khóa), ntf: { kỳ: {at, by, n} }, log: [] }
       - Ô lịch chỉ thể hiện việc xếp lịch: ca đã xếp / Nghỉ (theo lịch) / Nghỉ phép / Nghỉ không lương / trống (chưa xếp) – không phải bảng chấm công
       - Cảnh báo: vượt 48 giờ/tuần (Điều 105), không có ngày nghỉ trong tuần (Điều 111), nghỉ chưa đủ 12 giờ khi chuyển ca (Điều 110), xếp nghỉ nhiều hơn số ngày nghỉ được phép
       - Thông báo lịch tới app nhân viên: ghi nhận lần gửi; màn hình lịch ca trên app nhân viên thuộc giai đoạn 3 (chưa làm)
     ===================================================================== */
  var LC_COLS = [['#2563eb', 'Xanh dương'], ['#d97706', 'Cam'], ['#7c3aed', 'Tím'], ['#059669', 'Xanh lá'], ['#db2777', 'Hồng'], ['#0891b2', 'Xanh ngọc'], ['#64748b', 'Xám']];
  var LC_DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var LC_SP = { N: ['Nghỉ', '#94a3b8', 'Nghỉ theo lịch (ngày nghỉ của người đó)'], P: ['Phép', '#0e7490', 'Nghỉ phép năm – nên có đơn nghỉ đã duyệt'], KL: ['KL', '#b91c1c', 'Nghỉ không lương'] };
  var LC_EMPTY = { v: 0, d: {}, pub: {}, log: [], reg: {}, duyet: {}, ntf: {}, cfg: {} };
  var LC_UNDO = [], LC_REDO = [];
  function lcOf(u) { return (u && u.lich) || LC_EMPTY; }
  function lcW(u) { var L = u.lich || (u.lich = { v: 0 }); ['d', 'pub', 'reg', 'duyet', 'ntf', 'cfg'].forEach(function (k) { L[k] = L[k] || {}; }); L.log = L.log || []; return L; }
  function lcCfg(u) { return Object.assign({ ky: 'tuan', mode: 'ql', hanChot: 2, hanDk: 5, hanDuyet: 2, gay: 1 }, lcOf(u).cfg || {}); }
  function lcColIdx(s, sh) { if (sh && sh.col != null && sh.col !== '') return +sh.col; var i = s.shifts.indexOf(sh); return (i < 0 ? 0 : i) % LC_COLS.length; }
  // 11/11 12:24: ký hiệu nghỉ / công tác trên lịch lấy từ Ký hiệu công (Thiết lập chung) – dùng chung 2 khối
  var LC_TCOL = { paid: '#0e7490', bh: '#a16207', unpaid: '#b91c1c', work: '#4d7c0f' };
  function lcSyncSP(s) {
    if (!s || !s.codes) return; var o = { N: ['Nghỉ', '#94a3b8', 'Nghỉ theo lịch (ngày nghỉ của người đó)'] };
    s.codes.forEach(function (x) { var k = String(x.k).toUpperCase(); if (k === 'N' || k === 'X' || k === 'X/2' || k === 'KP' || x.type === 'hol' || !LC_TCOL[x.type]) return; o[x.k] = [x.k, LC_TCOL[x.type], x.t + (x.don ? ' – nên có đơn đã duyệt' : '')]; });
    Object.keys(LC_SP).forEach(function (k) { delete LC_SP[k]; }); Object.keys(o).forEach(function (k) { LC_SP[k] = o[k]; });
    if (typeof LC_SP0 !== 'undefined') { LC_SP0.length = 0; Object.keys(o).forEach(function (k) { LC_SP0.push(k); }); }
  }
  function lcCol(s, code) { if (LC_SP[code]) return LC_SP[code][1]; var sh = ccShiftCode(s, code); if (sh && sh.parts) sh = sh.parts[0]; return sh ? LC_COLS[lcColIdx(s, sh)][0] : '#64748b'; }
  function lcSave(u, msg) { var L = lcW(u); L.v = (L.v || 0) + 1; u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) log('Lịch xếp ca (' + u.name + '): ' + msg); }
  function lcLog(u, o) { var L = lcW(u); o.at = nowVn(); o.by = o.by || ccUser(); L.log.push(o); if (L.log.length > 800) L.log.splice(0, L.log.length - 800); }
  function lcCellHtml(s, code) { if (String(code).indexOf('+') < 0) return esc(lcTxt(code)); return '<span class="lc-ps">' + String(code).split('+').map(function (k) { return '<i style="--c:' + lcCol(s, k) + '">' + esc(k) + '</i>'; }).join('') + '</span>'; }
  function lcTxt(code) { return LC_SP[code] ? LC_SP[code][0] : code || ''; }
  // kỳ xếp ca chứa ngày iso
  function lcKy(cfg, iso) {
    if (cfg.ky === 'ngay') return { key: iso, a: iso, b: iso, label: LC_DOW[ccDow(iso)] + ' ' + HR.vnDate(iso).slice(0, 5) };
    if (cfg.ky === 'thang') { var a = iso.slice(0, 7) + '-01'; return { key: a, a: a, b: bcDays(iso.slice(0, 7)).pop(), label: 'Tháng ' + HR.ymLabel(iso.slice(0, 7)) }; }
    var m = ccMon(iso); return { key: m, a: m, b: ccAdd(m, 6), label: HR.vnDate(m).slice(0, 5) + '–' + HR.vnDate(ccAdd(m, 6)).slice(0, 5) };
  }
  // khóa đang áp cho ngày iso (khóa theo ngày, tuần hoặc tháng – đổi kỳ sau khi khóa vẫn giữ đúng)
  function lcLockKey(u, iso) { var P = lcOf(u).pub, m = ccMon(iso), t = iso.slice(0, 7) + '-01'; if (P[iso] && (P[iso].ky || 'tuan') === 'ngay') return iso; if (P[m] && (P[m].ky || 'tuan') === 'tuan') return m; if (P[t] && P[t].ky === 'thang') return t; if (P[iso] && !P[iso].ky) return iso; return ''; }
  function lcRegOn(u) { return lcCfg(u).mode === 'nv'; }
  // trạng thái 1 kỳ cho người đang xem
  function lcKyState(u, K, ppl) {
    var L = lcOf(u), c = lcCfg(u), td = refDate(), n = 0, nE = 0, nR = 0, pub = L.pub[K.key] && (L.pub[K.key].ky || 'tuan') === c.ky ? L.pub[K.key] : null;
    ppl.forEach(function (e) { var M = L.d[e['Mã NV']] || {}, G = L.reg[e['Mã NV']] || {}; for (var d = K.a; d <= K.b; d = ccAdd(d, 1)) { if (!lcInRange(e, d)) continue; if (M[d]) n++; else nE++; if (G[d]) nR++; } });
    var chot = ccAdd(K.a, -(+c.hanChot || 0)), dk = ccAdd(K.a, -(+c.hanDk || 0)), dy = ccAdd(K.a, -(+c.hanDuyet || 0)), st, lv = '';
    if (pub) { st = 'Đã khóa'; lv = 'ok'; }
    else if (c.mode === 'nv') { var dv = L.duyet[K.key]; st = dv ? 'Đã duyệt – chờ khóa' : td <= dk ? 'Đang mở đăng ký' : 'Chờ duyệt đăng ký'; if (!dv && td > dy) lv = 'bad'; else if (td > chot) lv = 'bad'; }
    else { st = n ? (nE ? 'Đang xếp' : 'Đã xếp đủ – chờ khóa') : 'Chưa xếp'; if (td > chot && K.b >= td) lv = 'bad'; else if (td > ccAdd(chot, -2)) lv = 'warn'; }
    if (K.b < td && !pub) lv = lv || 'warn';
    return { K: K, pub: pub, ntf: L.ntf[K.key] || null, duyet: L.duyet[K.key] || null, st: st, lv: lv, n: n, nE: nE, nR: nR, chot: chot, dk: dk, dy: dy };
  }
  // nhắc việc (dùng ở trang xếp ca): kỳ sắp tới / đang trễ hạn chốt
  function lcReminder(u, s) {
    var c = lcCfg(u), td = refDate(), ppl = lcPeople(u, { dept: '', q: '' }, td, ccAdd(td, 40)), out = [], seen = {};
    for (var i = 0; i < 40; i++) { var K = lcKy(c, ccAdd(td, i)); if (seen[K.key]) continue; seen[K.key] = 1; var S1 = lcKyState(u, K, ppl); if (S1.pub) continue; var due = c.mode === 'nv' ? (td <= S1.dk ? S1.dk : S1.dy) : S1.chot; if (lgDays(td, due) <= 3) out.push({ K: K, S: S1, due: due }); if (out.length >= 3) break; }
    return out;
  }

  // dữ liệu mẫu (11/11): Health – Kho hàng, Xưởng Sản xuất, Xưởng Đóng gói thuộc khối sản xuất; lịch đã xếp từ tháng 8 (Kho, Xưởng SX) / tháng 10 (Đóng gói) đến 10/11
  function lcSample(u) {
    u.lcV = 5; var DG = 'Xưởng Đóng gói', SXD = ['Kho hàng', 'Xưởng Sản xuất', DG], NV = u.data.NV || []; if (!NV.some(function (e) { return e['Phòng ban'] === DG; })) return;
    if (!u.ccset) { u.ccset = u._ccDraft || ccDefault(u); u._ccDraft = null; }
    var s = ccNorm(u.ccset), all7 = { 1: 'f', 2: 'f', 3: 'f', 4: 'f', 5: 'f', 6: 'f', 0: 'f' };
    // 11/11 11:35 anh: ca ngày, ca đêm 8 giờ (nghỉ giữa ca 1 giờ); ca sáng, chiều, tối 4 giờ (không nghỉ giữa ca) – ghép được ca gãy
    s.shifts = s.shifts.filter(function (x) { return x.k !== 'sx'; });
    [{ id: 'F', name: 'Ca ngày (Full)', inT: '08:00', outT: '17:00', bFrom: '12:00', bTo: '13:00', col: 0 }, { id: 'Đ', name: 'Ca đêm', inT: '22:00', outT: '07:00', bFrom: '02:00', bTo: '03:00', col: 2 },
      { id: 'S', name: 'Ca sáng', inT: '07:00', outT: '11:00', bFrom: '', bTo: '', col: 3 }, { id: 'C', name: 'Ca chiều', inT: '13:00', outT: '17:00', bFrom: '', bTo: '', col: 1 }, { id: 'T', name: 'Ca tối', inT: '18:00', outT: '22:00', bFrom: '', bTo: '', col: 4 }]
      .forEach(function (x) { s.shifts.push(Object.assign({ k: 'sx', days: Object.assign({}, all7), rateX: 100 }, x)); });
    s.deptShift = s.deptShift || {}; SXD.forEach(function (d) { s.exc.dept[d] = Object.assign(s.exc.dept[d] || {}, { sch: 1 }); s.deptShift[d] = 'F'; }); SXD.forEach(function (d) { s.exc.dept[d].hrf = 1; }); s.exc.emp = s.exc.emp || {}; if (NV.some(function (e) { return e['Mã NV'] === 'SG003'; })) s.exc.emp.SG003 = { nc: 1, no: 0, note: 'Trưởng kho – không chấm công, tính giờ theo lịch xếp ca đã chốt' }; if (!s.at) s.at = '28/07/2026 08:00:00';
    s.ruleSx.deptRest = {}; SXD.forEach(function (d) { s.ruleSx.deptRest[d] = { n: 1, per: 'w' }; });
    var L = lcW(u), base = '2026-09-28', END = '2026-11-10', by = 'Quản đốc xưởng (dữ liệu mẫu)', iDG = 0, iAll = 0;
    L.d = {}; L.reg = {}; L.pub = {}; L.ntf = {}; L.duyet = {}; L.log = [];
    var restDow = function (k, w) { return [2, 5, 0, 3, 6, 1, 4][(k * 3 + w * 2) % 7]; }; // ngày nghỉ xoay theo người + tuần
    // Xưởng Đóng gói: 2 tổ đổi ca ngày ↔ ca đêm theo tuần; 2 người làm ca gãy (sáng + tối, chiều + tối), có ngày chỉ 1 ca ngắn
    var dgPlan = function (j, wk, dow) {
      if (j < 4) { var A = (Math.floor(j / 2) + wk) % 2 === 0; return A ? 'F' : 'Đ'; }
      if (j === 4) return dow === 3 ? 'C' : 'S+T';
      return dow === 5 ? 'S+C' : dow === 2 ? 'T' : 'C+T';
    };
    L.cfg = { ky: 'tuan', mode: 'ql', hanChot: 2, hanDk: 5, hanDuyet: 2 };
    NV.forEach(function (e) {
      var d0 = e['Phòng ban'], id = e['Mã NV']; if (SXD.indexOf(d0) < 0 || !id) return; var join = String(e['Ngày vào làm'] || '').slice(0, 10), m = L.d[id] = {}, j = d0 === DG ? iDG++ : -1, k = iAll++;
      for (var mo = '2026-07-27'; mo <= END; mo = ccAdd(mo, 7)) {
        var w = lgDays('2026-07-27', mo) / 7; if (j >= 0 && mo < base) continue; var wk = j >= 0 ? lgDays(base, mo) / 7 : 0;
        var rd = j >= 0 && j < 4 && wk > 0 && dgPlan(j, wk - 1, 0) === 'Đ' && dgPlan(j, wk, 1) === 'F' ? 1 : restDow(k, w); // từ ca đêm sang ca ngày: nghỉ thứ Hai để đủ 12 giờ nghỉ giữa 2 ca
        for (var x = 0; x < 7; x++) { var iso = ccAdd(mo, x); if (iso > END || (join && iso < join)) continue; var dw = ccDow(iso); m[iso] = dw === rd ? 'N' : j >= 0 ? dgPlan(j, wk, dw) : 'F'; }
      }
    });
    // tình huống mẫu: SG010 làm đủ 7 ngày tuần 02–08/11 (không nghỉ → cảnh báo) · SG012 nghỉ không lương 23/10 · SG013 nghỉ phép 06/11 (chưa có đơn)
    if (L.d.SG010) for (var z = '2026-11-02'; z <= '2026-11-08'; z = ccAdd(z, 1)) if (L.d.SG010[z] === 'N') L.d.SG010[z] = L.d.SG010['2026-11-04'];
    if (L.d.SG012) L.d.SG012['2026-10-23'] = 'KL'; if (L.d.SG013) L.d.SG013['2026-11-06'] = 'P';
    for (var mo2 = '2026-07-27'; mo2 <= '2026-11-02'; mo2 = ccAdd(mo2, 7)) { L.pub[mo2] = { at: HR.vnDate(ccAdd(mo2, -3)) + ' 16:00:00', by: by, ky: 'tuan' }; L.ntf[mo2] = { at: HR.vnDate(ccAdd(mo2, -3)) + ' 16:05:00', by: by, n: 0 }; }
    // nhân viên đăng ký sẵn tuần 16–22/11 (thử cách "Nhân viên đăng ký"): mỗi người tự chọn 1 ngày nghỉ, 2 người đăng ký ca gãy
    var wk16 = lgDays(base, '2026-11-16') / 7;
    NV.filter(function (e) { return e['Phòng ban'] === DG; }).forEach(function (e, i) { var id = e['Mã NV'], G = L.reg[id] = {}, rd = [3, 6, 2, 0, 5, 4][i % 6]; for (var d = '2026-11-16'; d <= '2026-11-22'; d = ccAdd(d, 1)) G[d] = ccDow(d) === rd ? 'N' : dgPlan(i, wk16, ccDow(d)); });
    if (L.reg.SG013) L.reg.SG013['2026-11-20'] = 'P'; if (L.reg.SG012) L.reg.SG012['2026-11-18'] = 'S+C';
    L.log.push({ at: '28/07/2026 08:00:00', by: by, what: 'Xếp lịch Kho hàng, Xưởng Sản xuất (ca F, mỗi người nghỉ 1 ngày/tuần, ngày nghỉ xoay); 28/09: Xưởng Đóng gói 2 tổ đổi ca ngày ↔ ca đêm theo tuần, 2 người làm ca gãy (S+T, C+T)' });
    L.v = (L.v || 0) + 1;
  }

  function lcStyle() {
    if (document.getElementById('lcCss')) return; var st = document.createElement('style'); st.id = 'lcCss';
    st.textContent = '.lc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0}.lc-bar .grow{flex:1}.lc-pal{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.lc-chip{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line-2);background:var(--surface);border-radius:999px;padding:4px 11px 4px 5px;font-size:12.5px;cursor:pointer;color:var(--ink)}.lc-chip b{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 4px;border-radius:999px;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c);font-size:11.5px}.lc-chip small{color:var(--muted)}.lc-chip.on{border-color:var(--c);box-shadow:0 0 0 2px color-mix(in srgb,var(--c) 30%,transparent)}' +
      '.lc-cfg{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:flex-end}.lc-cfg .field{margin:0}.lc-cfg .lc-n{display:flex;align-items:center;gap:6px;font-size:13px}.lc-cfg .lc-n input{width:64px}' +
      '.lc-kys{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.lc-ky{border:1.5px solid var(--line-2);background:var(--surface);border-radius:10px;padding:6px 10px;font:inherit;font-size:12.5px;cursor:pointer;text-align:left;color:var(--ink)}.lc-ky small{display:block;color:var(--muted);font-size:11px}.lc-ky.on{border-color:var(--pri);box-shadow:0 0 0 2px color-mix(in srgb,var(--pri) 22%,transparent)}.lc-ky.ok small{color:#15803d}.lc-ky.warn small{color:#b45309}.lc-ky.bad small{color:#b91c1c}' +
      '.lc-kyp{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--pri) 4%,var(--surface))}.lc-kyp .st{display:flex;flex-direction:column;gap:3px;font-size:13px}.lc-kyp .st b{font-size:15px}.lc-kyp .st .bad{color:#b91c1c}.lc-kyp .btns{display:flex;flex-wrap:wrap;gap:8px}' +
      '.lc-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface);max-height:70vh}.lc{border-collapse:separate;border-spacing:0;font-size:12.5px;min-width:100%}.lc th,.lc td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:0;text-align:center;white-space:nowrap}' +
      '.lc thead th{position:sticky;top:0;background:var(--surface);z-index:2;padding:6px 4px;font-weight:600}.lc thead th small{display:block;font-weight:500;color:var(--muted);font-size:10.5px}.lc th.lc-nm,.lc td.lc-nm{position:sticky;left:0;z-index:1;background:var(--surface);text-align:left;padding:6px 10px;min-width:190px}.lc thead th.lc-nm{z-index:3}.lc td.lc-nm small{display:block;color:var(--muted);font-size:11px}.lc tr.lc-g td{background:rgba(127,127,127,.07);text-align:left;padding:5px 10px;font-weight:700;font-size:12px;position:sticky;left:0}' +
      '.lc th.hol{background:color-mix(in srgb,#ef4444 12%,var(--surface))}.lc th.today{box-shadow:inset 0 -3px 0 var(--pri)}.lc th.lk small:after{content:" 🔒"}.lc th.sun{color:#b45309}' +
      '.lc td.lc-c{min-width:48px;height:38px}.lc td.lc-c button{all:unset;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:38px;cursor:pointer;font-weight:700;user-select:none;touch-action:none;position:relative;line-height:1.1}.lc td.lc-c button:focus-visible{outline:2px solid var(--pri);outline-offset:-2px}.lc td.lc-c button small{font-size:9.5px;font-weight:600;opacity:.75}' +
      '.lc td.lc-c.on button{background:color-mix(in srgb,var(--c) 17%,transparent);color:var(--c)}.lc td.lc-c.emp button{color:var(--line-2);font-weight:400}.lc td.lc-c.off button{color:var(--muted);font-weight:500;cursor:default;background:repeating-linear-gradient(45deg,transparent 0 5px,rgba(127,127,127,.07) 5px 10px)}.lc td.lc-c.lk button{cursor:not-allowed}.lc td.lc-c.lk.unl button{cursor:pointer}.lc td.lc-c.reg button{outline:1.5px dashed var(--c);outline-offset:-4px}.lc td.lc-c.today{box-shadow:inset 2px 0 0 var(--pri),inset -2px 0 0 var(--pri)}.lc td.lc-c .don{position:absolute;top:2px;right:3px;font-size:9px;font-weight:700;color:#0e7490}' +
      '.lc td.lc-t,.lc th.lc-t{padding:4px 8px;min-width:60px;font-variant-numeric:tabular-nums}.lc td.lc-w{min-width:44px}.lc td.lc-w .tag{cursor:help}.lc tfoot td{background:rgba(127,127,127,.05);font-size:11.5px;color:var(--muted);padding:4px 2px}.lc tfoot td.lc-nm{font-weight:600;color:var(--ink-2)}.lc tfoot b{color:var(--c)}' +
      '.lc-filt{display:grid;grid-template-columns:minmax(200px,1.3fr) auto minmax(150px,1fr) minmax(150px,1fr) minmax(150px,1fr);gap:12px;align-items:end;margin:4px 0 10px}.lc-filt .field{margin:0;min-width:0}.lc-filt select,.lc-filt input{width:100%}@media(max-width:900px){.lc-filt{grid-template-columns:1fr 1fr}}.lc-kybar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:flex-end;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--pri) 4%,var(--surface));margin:0 0 4px}.lc-kybar .field{margin:0}.lc-kybar select{min-width:170px}.lc-kybar .grow{flex:1}.lc-kyst{font-size:13px;color:var(--muted);padding-bottom:8px}.lc-tools{margin-top:0}.lc th.lc-s1,.lc td.lc-s1{min-width:52px}.lc th.lc-s2,.lc td.lc-s2{min-width:70px;border-right:2px solid var(--line-2)}.lc td.lc-s1,.lc td.lc-s2{background:rgba(127,127,127,.04)}.lc-menu{position:absolute;z-index:120;background:var(--surface);border:1px solid var(--line-2);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.18);padding:6px;min-width:230px;max-height:70vh;overflow:auto}.lc-menu h4{margin:4px 8px 6px;font-size:12px;color:var(--muted);font-weight:600}.lc-menu button{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:7px 8px;border-radius:8px;font:inherit;font-size:13px;color:var(--ink);cursor:pointer;text-align:left}.lc-menu button:hover,.lc-menu button:focus-visible{background:rgba(127,127,127,.1);outline:none}.lc-menu button b{display:inline-grid;place-items:center;min-width:30px;height:24px;border-radius:7px;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c);font-size:11.5px}.lc-menu button small{color:var(--muted);margin-left:auto}.lc-menu button.cur{background:color-mix(in srgb,var(--pri) 10%,transparent)}.lc-menu hr{border:0;border-top:1px solid var(--line);margin:4px 2px}.lc-menu button.lc-more{justify-content:center;color:var(--pri);font-size:12.5px;font-weight:600;padding:6px 8px}.lc-menu button.lc-more:hover{background:color-mix(in srgb,var(--pri) 8%,transparent)}.lc-mx[hidden]{display:none}.lc-msub{font-size:11.5px;color:var(--muted);margin:2px 8px 4px}.lc-mi{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:13px;cursor:pointer}.lc-mi:hover{background:rgba(127,127,127,.1)}.lc-mi.on{background:color-mix(in srgb,var(--c) 10%,transparent)}.lc-mi input{width:16px;height:16px;accent-color:var(--c);margin:0;cursor:pointer}.lc-mi b{display:inline-grid;place-items:center;min-width:30px;height:24px;border-radius:7px;background:color-mix(in srgb,var(--c) 18%,transparent);color:var(--c);font-size:11.5px}.lc-mi span{flex:1}.lc-mi small{color:var(--muted)}.lc-mfoot{display:flex;align-items:center;gap:8px;padding:6px 8px 4px}.lc-msum{flex:1;min-width:0;font-size:12.5px;color:var(--ink-2)}.lc-menu .lc-mfoot button{width:auto;flex:none;background:var(--pri);color:#fff;padding:6px 16px;justify-content:center;font-weight:600;border-radius:8px}.lc-menu .lc-mfoot button:hover{background:var(--pri);filter:brightness(1.08)}.lc-menu .lc-mfoot button:disabled{opacity:.4;cursor:not-allowed}.lc-msum.bad{color:#b91c1c;font-weight:600}.lc-msum.warn{color:#b45309}.lc td.lc-c.mul button{background:none}.lc-ps{display:flex;gap:2px;justify-content:center;flex-wrap:wrap}.lc-ps i{font-style:normal;display:inline-grid;place-items:center;min-width:18px;height:20px;padding:0 3px;border-radius:5px;font-size:11px;font-weight:700;background:color-mix(in srgb,var(--c) 20%,transparent);color:var(--c)}.lc td.lc-c.cf button{background:repeating-linear-gradient(135deg,color-mix(in srgb,#ef4444 18%,transparent) 0 6px,transparent 6px 12px);color:#b91c1c}' +
      '.lc-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--muted);margin:10px 0 0}.lc-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:middle}.lc-pat{display:flex;flex-wrap:wrap;gap:6px}.lc-pat select{width:auto;min-width:64px}.lc-ppl{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 12px;max-height:180px;overflow:auto;padding:6px;border:1px solid var(--line);border-radius:10px}.lc-ppl label{display:flex;gap:6px;align-items:center;font-size:13px}.lc-sub{font-size:12.5px;color:var(--muted);margin:4px 0 0}#lrF,#lrT,#lrC{display:grid;gap:12px}#lrF .field{margin:0}';
    document.head.appendChild(st);
  }
  function lcUnit() { ps('lc', { u: '', dept: '', view: 'week', d: '', q: '', brush: '', unl: {}, ky: '' }); return tlccUnit(); }
  function lcDepts(u, s) { var o = {}; (u.data.PB || []).forEach(function (p) { if (p['Tên phòng ban']) o[p['Tên phòng ban']] = 0; }); ccActive(u).forEach(function (e) { var d = e['Phòng ban'] || ''; if (d) o[d] = (o[d] || 0) + 1; }); return Object.keys(o).map(function (d) { return { d: d, n: o[d], sch: !!((s.exc.dept || {})[d] || {}).sch, hrf: !!((s.exc.dept || {})[d] || {}).hrf }; }); }
  function lcRange(f) {
    var d = f.d || refDate(), a, b, days = [];
    if (f.view === 'month') { a = d.slice(0, 7) + '-01'; b = bcDays(d.slice(0, 7)).pop(); } else { a = ccMon(d); b = ccAdd(a, 6); }
    for (var x = a; x <= b; x = ccAdd(x, 1)) days.push(x);
    return { a: a, b: b, days: days, label: f.view === 'month' ? 'Tháng ' + HR.ymLabel(d.slice(0, 7)) : HR.vnDate(a).slice(0, 5) + ' – ' + HR.vnDate(b) };
  }
  // người khối sản xuất trong khoảng a–b · f.dept '' = tất cả bộ phận của khối
  function lcPeople(u, f, a, b) {
    var q = norm(f.q || ''), s = ccOf(u);
    return (u.data.NV || []).filter(function (e) {
      var d = e['Phòng ban'] || ''; if (!e['Mã NV'] || !ccIsSxDept(s, d) || (f.dept && d !== f.dept)) return false; var j = String(e['Ngày vào làm'] || '').slice(0, 10), l = String(e['Ngày nghỉ việc'] || '').slice(0, 10);
      if ((j && j > b) || (l && l < a)) return false; return !q || norm(e['Mã NV'] + ' ' + (e['Họ và tên'] || '')).indexOf(q) >= 0;
    }).sort(function (x, y) { return (x['Phòng ban'] || '') < (y['Phòng ban'] || '') ? -1 : (x['Phòng ban'] || '') > (y['Phòng ban'] || '') ? 1 : x['Mã NV'] < y['Mã NV'] ? -1 : 1; });
  }
  function lcInRange(e, iso) { var j = String(e['Ngày vào làm'] || '').slice(0, 10), l = String(e['Ngày nghỉ việc'] || '').slice(0, 10); return !(j && iso < j) && !(l && iso > l); }
  // cảnh báo xếp ca của 1 người trong các tuần chạm khoảng đang xem
  function lcWarn(u, s, id, a, b, dept) {
    var M = lcOf(u).d[id] || {}, out = [], info = function (c) { var sh = c && !LC_SP[c] ? ccShiftCode(s, c) : null; return sh ? shiftInfo(sh) : null; }, rs = sxRestOf(s.ruleSx, dept);
    for (var mo = ccMon(a); mo <= b; mo = ccAdd(mo, 7)) {
      var hrs = 0, nW = 0, nN = 0, nAll = 0; for (var k = 0; k < 7; k++) { var c = M[ccAdd(mo, k)]; if (c) nAll++; if (c === 'N') nN++; var i = info(c); if (i) { hrs += i.full; nW++; } }
      if (hrs > 48) out.push({ lv: 'bad', t: 'Tuần ' + HR.vnDate(mo).slice(0, 5) + ': ' + ccNum(Math.round(hrs * 10) / 10) + ' giờ – vượt 48 giờ/tuần (BLLĐ Điều 105)' });
      if (nW === 7) out.push({ lv: 'bad', t: 'Tuần ' + HR.vnDate(mo).slice(0, 5) + ': làm cả 7 ngày, không có ngày nghỉ (BLLĐ Điều 111 – nghỉ ít nhất 24 giờ liên tục mỗi tuần)' });
      if (rs.per === 'w' && nN > rs.n) out.push({ lv: 'warn', t: 'Tuần ' + HR.vnDate(mo).slice(0, 5) + ': xếp nghỉ ' + nN + ' ngày – nhiều hơn ' + rs.n + ' ngày nghỉ được phép, giờ làm có thể thiếu so với giờ tiêu chuẩn tháng' });
    }
    if (rs.per === 'm') { var ym0 = a.slice(0, 7), nM = 0; bcDays(ym0).forEach(function (d) { if (M[d] === 'N') nM++; }); if (nM > rs.n) out.push({ lv: 'warn', t: 'Tháng ' + HR.ymLabel(ym0) + ': xếp nghỉ ' + nM + ' ngày – nhiều hơn ' + rs.n + ' ngày nghỉ được phép' }); }
    for (var d = a; d <= b; d = ccAdd(d, 1)) {
      var c0 = M[ccAdd(d, -1)], c1 = M[d], i0 = info(c0), i1 = info(c1);
      if (i0 && i1) { var gap = 1440 + i1.a - i0.b; if (gap < 720) out.push({ lv: 'bad', t: HR.vnDate(ccAdd(d, -1)).slice(0, 5) + ' → ' + HR.vnDate(d).slice(0, 5) + ': ca ' + c0 + ' → ca ' + c1 + ' chỉ nghỉ ' + (gap > 0 ? ccNum(Math.round(gap / 6) / 10) + ' giờ' : 'trùng giờ') + ' – cần nghỉ ít nhất 12 giờ trước khi chuyển ca (BLLĐ Điều 110)' }); }
      if (i1 && i1.conf && i1.conf.length) out.push({ lv: 'bad', t: HR.vnDate(d).slice(0, 5) + ': ' + i1.conf.join('; ') + ' – sửa lại ca trong ngày' });
      if (i1 && i1.multi && i1.full > 8) out.push({ lv: 'warn', t: HR.vnDate(d).slice(0, 5) + ': ' + c1 + ' tổng ' + ccNum(i1.full) + ' giờ trong ngày – vượt 8 giờ làm bình thường/ngày (BLLĐ Điều 105)' });
      var hh = holMap(s, d.slice(0, 4))[d]; if (hh && (hh.k === 'le' || hh.k === 'bu') && i1) out.push({ lv: 'warn', t: HR.vnDate(d).slice(0, 5) + ' (' + hh.t + '): xếp ca ngày lễ – giờ làm tính ít nhất 300% (BLLĐ Điều 98)' });
    }
    return out;
  }
  function lcDons(u) { var o = {}; (u.data.DON || []).forEach(function (d) { if (d['Trạng thái'] !== 'Đã duyệt' || !d['Từ ngày']) return; var t = String(d['Loại nghỉ'] || ''), code = 'P'; BC_LEAVE.some(function (b) { if (b[0].test(t)) { code = b[1]; return true; } }); (o[d['Mã NV']] = o[d['Mã NV']] || []).push({ a: String(d['Từ ngày']).slice(0, 10), b: String(d['Đến ngày'] || d['Từ ngày']).slice(0, 10), code: code, t: t }); }); return o; }

  // 11/11 11:16 anh: thiết lập cách thức xếp ca tách sang tab Thiết lập ca
  function lcCfgCard(u) {
    lcStyle(); var c = lcCfg(u), reg = c.mode === 'nv', s = ccOf(u);
    var num = function (k, v, w) { return '<label class="lc-n">' + w[0] + ' <input class="input" type="number" min="0" max="31" data-lcc="' + k + '" value="' + esc(v) + '"> ' + w[1] + '</label>'; };
    return '<div class="lc-cfg"><div class="field"><label>Kỳ xếp ca</label><div class="seg">' + [['ngay', 'Theo ngày'], ['tuan', 'Theo tuần'], ['thang', 'Theo tháng']].map(function (x) { return '<button class="' + (c.ky === x[0] ? 'on' : '') + '" data-act="lc-cfg" data-id="ky|' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><small class="faint">Đơn vị để khóa lịch, thông báo và nhắc hạn</small></div>' +
      '<div class="field"><label>Cách xếp</label><div class="seg">' + [['ql', 'Quản lý xếp'], ['nv', 'Nhân viên đăng ký']].map(function (x) { return '<button class="' + (c.mode === x[0] ? 'on' : '') + '" data-act="lc-cfg" data-id="mode|' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><small class="faint">' + (reg ? 'Nhân viên đăng ký ca → quản lý duyệt, điều chỉnh → khóa → thông báo' : 'Quản lý xếp → khóa → thông báo lịch tới app nhân viên') + '</small></div>' +
      '<div class="field"><label>Thời hạn (trước ngày bắt đầu kỳ)</label><div style="display:flex;flex-wrap:wrap;gap:12px">' + (reg ? num('hanDk', c.hanDk, ['Hạn đăng ký', 'ngày']) + num('hanDuyet', c.hanDuyet, ['Hạn phê duyệt', 'ngày']) : '') + num('hanChot', c.hanChot, ['Hạn chốt, khóa lịch', 'ngày']) + '</div><small class="faint">Sắp đến hạn hoặc quá hạn: hiện ở Việc cần xử lý</small></div>' + '</div>';
  }
  // nhắc việc xếp ca cho trang Việc cần xử lý
  function lcAlerts(u) {
    var out = []; if (!u || !u.data || !(u.data.NV || []).length) return out; var s = ccOf(u); if (!tlccHasSx(u)) return out;
    var c = lcCfg(u), td = refDate(), ppl = lcPeople(u, { dept: '', q: '' }, td, ccAdd(td, 45)), seen = {};
    for (var i = -7; i < 45; i++) { var K = lcKy(c, ccAdd(td, i)); if (seen[K.key]) continue; seen[K.key] = 1; if (K.b < td) continue; var S1 = lcKyState(u, K, ppl); if (S1.pub) continue;
      var stage = c.mode === 'nv' ? (td <= S1.dk ? 'dk' : !S1.duyet ? 'dy' : 'chot') : 'chot', due = stage === 'dk' ? S1.dk : stage === 'dy' ? S1.dy : S1.chot, n = lgDays(td, due); if (n > 7) continue;
      out.push({ kind: 'xep_ca', level: n < 0 ? 'gap' : n <= 2 ? 'canh' : 'nhac', id: '', name: '', dept: 'Khối sản xuất, vận hành', unit: u.name, unitId: u.id, title: (stage === 'dk' ? 'Hạn nhân viên đăng ký ca' : stage === 'dy' ? 'Duyệt đăng ký ca' : 'Chốt, khóa lịch xếp ca') + ' kỳ ' + K.label, detail: (n < 0 ? 'Quá hạn ' + (-n) + ' ngày' : n === 0 ? 'Hạn hôm nay' : 'Còn ' + n + ' ngày') + ' (hạn ' + HR.vnDate(due) + ') · ' + S1.n + ' ô đã xếp, ' + S1.nE + ' ô chưa xếp · làm ở Thiết lập chấm công → Khối sản xuất → Xếp ca làm', key: u.id + '|xep_ca||' + K.key + stage, due: due, days: n, sources: [] });
      if (out.length >= 4) break; }
    return out;
  }
  function lcMonths(u) { var L = lcOf(u), o = {}, td = refDate(); Object.keys(L.d).forEach(function (id) { Object.keys(L.d[id]).forEach(function (d) { o[d.slice(0, 7)] = 1; }); }); for (var i = -2; i <= 3; i++) o[ccuAddM(td.slice(0, 7), i)] = 1; return Object.keys(o).sort(); }
  function lcBody(u) {
    lcStyle(); if (typeof gxStyle === 'function') gxStyle();
    var f = ps('lc', { u: '', dept: '', view: 'week', d: '', q: '', brush: '', unl: {}, ky: '' }); if (f.u !== u.id) { f.u = u.id; f.dept = ''; f.brush = ''; f.ky = ''; }
    var s = ccOf(u), L = lcOf(u), c = lcCfg(u), td = refDate(); if (!f.d) f.d = td;
    var dl = lcDepts(u, s).filter(function (x) { return x.sch; }); if (!dl.length) return '<div class="notice warn">' + ic('info') + '<div>Chưa có phòng ban thuộc khối sản xuất, vận hành. Chọn phòng ban làm theo ca ở <a href="#tlchung">Thiết lập chung → Phân khối phòng ban</a>, rồi xếp ca từng người tại đây.</div></div>';
    if (f.dept && !dl.some(function (x) { return x.d === f.dept; })) f.dept = '';
    var R = lcRange(f), days = R.days, ppl = lcPeople(u, f, R.a, R.b), SH = s.shifts.filter(function (x) { return x.k === 'sx'; }); if (!SH.length) SH = s.shifts;
    var DN = lcDons(u), reg = c.mode === 'nv';
    var kys = [], seen = {}; days.forEach(function (d) { var K = lcKy(c, d); if (!seen[K.key]) { seen[K.key] = 1; kys.push(K); } });
    var curK = kys.filter(function (x) { return x.key === f.ky; })[0] || kys.filter(function (x) { return x.a <= td && td <= x.b; })[0] || kys[0]; f.ky = curK.key; var C0 = lcKyState(u, curK, ppl);
    var cnt = {}, lastDept = null, nC = days.length + 5;
    var rows = ppl.map(function (e) {
      var id = e['Mã NV'], M = L.d[id] || {}, G = L.reg[id] || {}, h = 0, nCa = 0, ws = lcWarn(u, s, id, R.a, R.b, e['Phòng ban']);
      var cells = days.map(function (iso) {
        if (!lcInRange(e, iso)) return '<td class="lc-c off"><button type="button" disabled title="Chưa vào làm / đã nghỉ việc">·</button></td>';
        var v = M[iso] || '', g = reg && G[iso] && G[iso] !== v ? G[iso] : '', sh = v && !LC_SP[v] ? ccShiftCode(s, v) : null, i = sh ? shiftInfo(sh) : null, lk = lcLockKey(u, iso), unl = lk && f.unl[lk];
        if (i) { h += i.full; (sh.parts || [sh]).forEach(function (q) { nCa++; cnt[iso + '|' + q.id] = (cnt[iso + '|' + q.id] || 0) + 1; }); }
        var dn = (DN[id] || []).filter(function (x) { return x.a <= iso && iso <= x.b; })[0], show = v || g;
        var tip = HR.vnDate(iso) + ' · ' + (sh ? (sh.parts ? (i && i.conf.length ? '⚠ ' + i.conf.join('; ') + ' · ' : '') + sh.parts.length + ' ca: ' + sh.parts.map(function (q) { return q.id + ' ' + q.inT + '–' + q.outT; }).join(' + ') + ' · ' + ccNum(i ? i.full : 0) + ' giờ' : 'Ca ' + sh.id + ' ' + sh.name + ' ' + sh.inT + '–' + sh.outT) : LC_SP[v] ? LC_SP[v][2] : 'Chưa xếp') + (g ? ' · nhân viên đăng ký: ' + (LC_SP[g] ? LC_SP[g][0] : 'ca ' + g) + ' (chờ duyệt)' : '') + (dn ? ' · có đơn ' + dn.t + ' đã duyệt' : '') + (lk ? ' · kỳ đã khóa' + (unl ? ' (đang mở sửa)' : ' – sửa phải ghi lý do') : '') + ' · bấm để chọn';
        return '<td class="lc-c' + (show ? ' on' : ' emp') + (String(show).indexOf('+') > 0 ? ' mul' : '') + (i && i.conf && i.conf.length ? ' cf' : '') + (g ? ' reg' : '') + (lk ? ' lk' : '') + (unl ? ' unl' : '') + (iso === td ? ' today' : '') + '" style="--c:' + lcCol(s, show) + '"><button type="button" data-lc="' + esc(id) + '|' + iso + '" title="' + esc(tip) + '">' + (show ? lcCellHtml(s, show) : '–') + (g ? '<small>đăng ký</small>' : '') + (dn && v !== 'P' && v !== 'KL' ? '<i class="don">' + esc(dn.code) + '</i>' : '') + '</button></td>';
      }).join('');
      var wt = ws.length ? '<span class="tag ' + (ws.some(function (w) { return w.lv === 'bad'; }) ? 'tag-bad' : 'tag-warn') + '" title="' + esc(ws.map(function (w) { return w.t; }).join('\n')) + '">' + ws.length + '</span>' : '<span class="faint">–</span>';
      var ex = ccExc(s, id, e['Phòng ban'], e), grp = !f.dept && e['Phòng ban'] !== lastDept ? '<tr class="lc-g"><td colspan="' + nC + '">' + esc(e['Phòng ban']) + '</td></tr>' : ''; lastDept = e['Phòng ban'];
      return grp + '<tr><td class="lc-nm"><b>' + personLink(u, id, e['Họ và tên'] || id) + '</b><small>' + esc(id + (e['Chức danh công việc'] || e['Chức vụ'] ? ' · ' + (e['Chức danh công việc'] || e['Chức vụ']) : '')) + (ex.hrf ? ' · lương theo giờ' : '') + '</small></td><td class="lc-t lc-s1"><b>' + nCa + '</b></td><td class="lc-t lc-s2"><b>' + ccNum(Math.round(h * 10) / 10) + '</b></td>' + cells + '<td class="lc-w">' + wt + '</td></tr>';
    }).join('');
    var head = '<tr><th class="lc-nm">Nhân sự (' + ppl.length + ')</th><th class="lc-t lc-s1" title="Tổng số ca đã xếp trong ' + (f.view === 'week' ? 'tuần' : 'tháng') + ' đang xem (ca gãy tính 2 ca)">Số ca</th><th class="lc-t lc-s2" title="Tổng giờ dự kiến theo các ca đã xếp (đã trừ nghỉ giữa ca)">Giờ dự kiến</th>' + days.map(function (iso) {
      var hh = holMap(s, iso.slice(0, 4))[iso], lk = lcLockKey(u, iso);
      return '<th class="' + (hh && (hh.k === 'le' || hh.k === 'bu') ? 'hol' : '') + (iso === td ? ' today' : '') + (lk ? ' lk' : '') + (ccDow(iso) === 0 ? ' sun' : '') + '" title="' + esc(HR.vnDate(iso) + ' · ' + ccDowT(iso) + (hh ? ' · ' + hh.t : '') + (lk ? ' · kỳ đã khóa' : '')) + '">' + iso.slice(8, 10) + (f.view === 'week' ? '/' + iso.slice(5, 7) : '') + '<small>' + LC_DOW[ccDow(iso)] + '</small></th>';
    }).join('') + '<th class="lc-t" title="Cảnh báo theo BLLĐ 2019 – rê chuột để xem">Lưu ý</th></tr>';
    var foot = SH.filter(function (sh) { return days.some(function (iso) { return cnt[iso + '|' + sh.id]; }); }).map(function (sh) {
      return '<tr style="--c:' + lcCol(s, sh.id) + '"><td class="lc-nm">Ca ' + esc(sh.id) + ' · ' + esc(sh.name) + '</td><td></td><td></td>' + days.map(function (iso) { var n = cnt[iso + '|' + sh.id] || 0; return '<td>' + (n ? '<b>' + n + '</b>' : '·') + '</td>'; }).join('') + '<td></td></tr>';
    }).join('');
    // bộ lọc: bộ phận · xem theo · tháng (chọn trong danh sách) · tuần · tìm
    var ms = lcMonths(u), ymSel = f.view === 'month' ? f.d.slice(0, 7) : (f.d.slice(0, 7)), wks = []; for (var mo = ccMon(ymSel + '-01'); mo <= bcDays(ymSel).pop(); mo = ccAdd(mo, 7)) wks.push(mo);
    if (ms.indexOf(ymSel) < 0) ms.push(ymSel); ms.sort();
    var filt = '<div class="lc-filt"><div class="field"><label for="lcDept">Bộ phận</label><select class="input" id="lcDept">' + [['', 'Tất cả bộ phận (' + dl.reduce(function (t, x) { return t + x.n; }, 0) + ' người)']].concat(dl.map(function (x) { return [x.d, x.d + ' (' + x.n + ' người)']; })).map(function (o) { return opt(o[0], o[1], f.dept); }).join('') + '</select></div>' +
      '<div class="field"><label>Xem theo</label><div class="seg"><button class="' + (f.view === 'week' ? 'on' : '') + '" data-act="lc-view" data-id="week">Tuần</button><button class="' + (f.view === 'month' ? 'on' : '') + '" data-act="lc-view" data-id="month">Tháng</button></div></div>' +
      '<div class="field"><label for="lcM">Tháng</label><select class="input" id="lcM">' + ms.map(function (m) { return opt(m, 'Tháng ' + HR.ymLabel(m) + (m === td.slice(0, 7) ? ' (tháng này)' : ''), ymSel); }).join('') + '</select></div>' +
      (f.view === 'week' ? '<div class="field"><label for="lcWk">Tuần</label><select class="input" id="lcWk">' + wks.map(function (w) { return opt(w, HR.vnDate(w).slice(0, 5) + ' – ' + HR.vnDate(ccAdd(w, 6)).slice(0, 5) + (w <= td && td <= ccAdd(w, 6) ? ' (tuần này)' : ''), R.a); }).join('') + '</select></div>' : '<div class="field"></div>') +
      '<div class="field"><label for="lcQ">Tìm</label><input class="input" id="lcQ" value="' + esc(f.q || '') + '" placeholder="Tên, mã NV"></div></div>';
    var kyBar = '<div class="lc-kybar"><div class="field"><label for="lcKy">Kỳ ' + (c.ky === 'ngay' ? 'ngày' : c.ky === 'thang' ? 'tháng' : 'tuần') + '</label><select class="input" id="lcKy">' + kys.map(function (K) { var P = lcOf(u).pub[K.key]; return opt(K.key, K.label + (P ? ' 🔒' : ''), curK.key); }).join('') + '</select></div>' +
      '<span class="lc-kyst">' + (C0.pub ? '🔒 Đã khóa ' + esc(C0.pub.at.slice(0, 10)) + (C0.ntf ? ' · đã thông báo' : ' · chưa thông báo') : 'Chưa khóa') + '</span><span class="grow"></span>' +
      (reg && !C0.pub ? '<button class="btn btn-sm" data-act="lc-duyet" data-id="' + curK.key + '"' + (C0.nR ? '' : ' disabled') + '>Duyệt theo đăng ký</button>' : '') +
      (C0.pub ? '<button class="btn btn-sm" data-act="lc-unpub" data-id="' + curK.key + '">Mở khóa</button>' : '<button class="btn btn-sm btn-primary" data-act="lc-pub" data-id="' + curK.key + '">' + ic('check', 15) + 'Khóa lịch</button>') +
      '<button class="btn btn-sm' + (C0.pub && !C0.ntf ? ' btn-primary' : '') + '" data-act="lc-ntf" data-id="' + curK.key + '"' + (C0.pub ? '' : ' disabled title="Khóa lịch trước khi thông báo"') + '>' + ic('appnv', 15) + (C0.ntf ? 'Thông báo lại' : 'Thông báo lịch tới app nhân viên') + '</button></div>';
    var pal = '' +
      '<div class="lc-bar lc-tools"><button class="btn btn-sm" data-act="lc-undo" title="Hoàn tác (Ctrl + Z)"' + (LC_UNDO.length ? '' : ' disabled') + '>↶ Hoàn tác</button><button class="btn btn-sm" data-act="lc-redo" title="Làm lại (Ctrl + Y)"' + (LC_REDO.length ? '' : ' disabled') + '>↷ Làm lại</button><span class="grow"></span>' +
      '<button class="btn btn-sm" data-act="lc-copy" title="Mỗi ngày đang xem lấy theo ca của đúng ngày đó tuần trước">' + ic('hd', 15) + 'Chép từ tuần trước</button><button class="btn btn-sm" data-act="lc-rot">Xếp xoay ca…</button><button class="btn btn-sm" data-act="lc-clear">Xóa lịch đang xem</button><button class="btn btn-sm" data-act="lc-xls">' + ic('xuat', 15) + 'Excel</button><button class="btn btn-sm" data-act="lc-log">Nhật ký</button></div>';
    var grid = ppl.length ? '<div class="lc-wrap"><table class="lc"><thead>' + head + '</thead><tbody>' + rows + '</tbody>' + (foot ? '<tfoot>' + foot + '</tfoot>' : '') + '</table></div>' : '<div class="card empty"><h2>Không có người</h2><p>Chọn bộ phận khác hoặc xóa ô tìm.</p></div>';
    var leg = '<div class="lc-leg"><span><b>Bấm 1 ô</b> để chọn ca (tích được nhiều ca) hoặc ký hiệu nghỉ; <b>Ctrl + Z</b> hoàn tác.</span><span><b>Nghỉ</b> nghỉ theo lịch · <b>P, KL, Ô, CT…</b> theo Ký hiệu công ở Thiết lập chung</span><span>Ô nhiều ca: khoảng trống giữa các ca không tính giờ</span><span>– Chưa xếp</span>' + (reg ? '<span><i style="border:1.5px dashed #888"></i>Nhân viên đăng ký, chờ duyệt</span>' : '') + '<span><b style="color:#0e7490">P</b> góc ô: có đơn nghỉ đã duyệt</span><span>🔒 Kỳ đã khóa – sửa phải ghi lý do</span></div>';
    return filt + kyBar + pal + grid + leg;
  }
  ACTS['lc-view'] = function (a, id) { PS.lc.view = id; PS.lc.ky = ''; render(); };
  ACTS['lc-nav'] = function (a, id) { var f = PS.lc, n = +id; f.ky = ''; if (!n) f.d = refDate(); else if (f.view === 'month') { var ym = ccuAddM(f.d.slice(0, 7), n); f.d = ym + '-01'; } else f.d = ccAdd(f.d || refDate(), 7 * n); render(); };
  ACTS['lc-brush'] = function (a, id) { PS.lc.brush = id; $$('.lc-chip').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-id') === id); }); };
  ACTS['lc-ky'] = function (a, id) { PS.lc.ky = id; lcRerender(); };
  ACTS['lc-cfg'] = function (a, key) { var u = lcUnit(), L = lcW(u), i = key.indexOf('|'), k = key.slice(0, i), v = key.slice(i + 1); if (k === 'gay') v = +v; L.cfg = Object.assign(lcCfg(u), L.cfg); L.cfg[k] = v; PS.lc.ky = ''; lcSave(u, 'thiết lập ' + k + ' = ' + v); toast(k === 'gay' ? (v ? 'Cho phép ca gãy: bấm ô lịch để chọn 2 ca trong ngày' : 'Không dùng ca gãy – ô đã xếp ca gãy vẫn giữ nguyên') : k === 'ky' ? 'Kỳ xếp ca: ' + (v === 'ngay' ? 'theo ngày' : v === 'thang' ? 'theo tháng' : 'theo tuần') : v === 'nv' ? 'Cách xếp: nhân viên đăng ký – quản lý duyệt, điều chỉnh rồi khóa' : 'Cách xếp: quản lý xếp', 'ok'); lcRerender(); };
  // ghi nhiều ô 1 lần: ch = { 'Mã NV|iso': mã | '' } – bỏ qua kỳ đã khóa chưa mở sửa · ghi lại để Hoàn tác (Ctrl + Z)
  function lcApply(u, ch, what, undo) {
    var L = lcW(u), n = 0, skip = 0, f = PS.lc, items = [];
    Object.keys(ch).forEach(function (k) { var a = k.split('|'), id = a[0], iso = a[1], v = ch[k] === 'X' ? '' : ch[k], M = L.d[id] || (L.d[id] = {}), old = M[iso] || '', lk = lcLockKey(u, iso);
      if (old === v) return; if (lk && !f.unl[lk]) { skip++; return; }
      if (v) M[iso] = v; else delete M[iso]; n++; items.push({ id: id, iso: iso, old: old, nw: v }); L.log.push({ at: nowVn(), by: ccUser(), id: id, iso: iso, old: old, nw: v, why: lk ? f.unl[lk] : '', what2: undo || '' }); });
    if (L.log.length > 800) L.log.splice(0, L.log.length - 800);
    if (n) { if (!undo) { LC_UNDO.push({ uid: u.id, items: items, what: what }); if (LC_UNDO.length > 50) LC_UNDO.shift(); LC_REDO = []; } lcSave(u, what + ' (' + n + ' ô)'); }
    return { n: n, skip: skip };
  }
  function lcUndo(redo) {
    var st = redo ? LC_REDO : LC_UNDO, x = st.pop(); if (!x) { toast(redo ? 'Không còn thao tác để làm lại' : 'Không còn thao tác để hoàn tác', 'info'); return; }
    var u = unitById(x.uid); if (!u) return; var ch = {}; x.items.forEach(function (it) { ch[it.id + '|' + it.iso] = redo ? it.nw : it.old; });
    var r = lcApply(u, ch, (redo ? 'làm lại: ' : 'hoàn tác: ') + x.what, redo ? 'Làm lại' : 'Hoàn tác'); (redo ? LC_UNDO : LC_REDO).push(x);
    toast((redo ? 'Đã làm lại ' : 'Đã hoàn tác ') + r.n + ' ô – ' + x.what, 'ok', r.skip ? r.skip + ' ô thuộc kỳ đã khóa không đổi.' : ''); lcRerender();
  }
  ACTS['lc-undo'] = function () { lcUndo(false); };
  ACTS['lc-redo'] = function () { lcUndo(true); };
  function lcRerender() { var w = $('.lc-wrap'), sx = w ? w.scrollLeft : 0, sy = w ? w.scrollTop : 0, y = window.scrollY; render(); window.scrollTo(0, y); var w2 = $('.lc-wrap'); if (w2) { w2.scrollLeft = sx; w2.scrollTop = sy; } }
  function lcAskUnlock(u, lk, then) {
    var P = lcOf(u).pub[lk]; if (!P) return then && then();
    var m = modal('Sửa lịch kỳ đã khóa', 'Kỳ bắt đầu ' + HR.vnDate(lk), '<p>Kỳ này đã khóa bởi <b>' + esc(P.by) + '</b> lúc ' + esc(P.at) + '. Nhân viên có thể đã nhận lịch – sửa xong nên bấm Thông báo lại.</p><div class="field"><label for="lcWhy">Lý do sửa *</label><input class="input" id="lcWhy" maxlength="160" placeholder="Ví dụ: đổi ca theo đơn của nhân viên, thiếu người ca đêm"></div><p id="lcMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="lcOk">Mở sửa kỳ này</button></div>', true);
    $('#lcOk', m).onclick = function () { var why = $('#lcWhy', m).value.trim(); if (!why) { $('#lcMsg', m).textContent = 'Nhập lý do sửa'; return; } PS.lc.unl[lk] = why; m.close(); toast('Đã mở sửa – mọi thay đổi ghi kèm lý do', 'ok'); lcRerender(); if (then) then(); };
  }
  function lcVisible(u) { var f = PS.lc, R = lcRange(f); return { R: R, ppl: lcPeople(u, f, R.a, R.b) }; }
  ACTS['lc-copy'] = function () {
    var u = lcUnit(), V = lcVisible(u), L = lcOf(u), ch = {};
    V.ppl.forEach(function (e) { var id = e['Mã NV'], src = Object.assign({}, L.d[id] || {}); V.R.days.forEach(function (iso) { if (!lcInRange(e, iso)) return; var v = src[ccAdd(iso, -7)] || ''; src[iso] = v; ch[id + '|' + iso] = v; }); });
    var r = lcApply(u, ch, 'chép từ tuần trước'); toast(r.n ? 'Đã chép ' + r.n + ' ô từ tuần trước' : 'Không có ô nào thay đổi', r.n ? 'ok' : 'info', r.skip ? r.skip + ' ô thuộc kỳ đã khóa không đổi – bấm Mở khóa hoặc sửa từng ô (ghi lý do).' : 'Bấm Hoàn tác (Ctrl + Z) nếu chép nhầm.'); lcRerender();
  };
  ACTS['lc-clear'] = function () {
    var u = lcUnit(), V = lcVisible(u);
    confirmBox('Xóa lịch đang xem?', 'Xóa ca đã xếp của ' + V.ppl.length + ' người, ' + V.R.label + '. Kỳ đã khóa không bị xóa. Có thể Hoàn tác (Ctrl + Z).', 'Xóa lịch', function () { var ch = {}; V.ppl.forEach(function (e) { V.R.days.forEach(function (iso) { ch[e['Mã NV'] + '|' + iso] = ''; }); }); var r = lcApply(u, ch, 'xóa lịch ' + V.R.label); toast('Đã xóa ' + r.n + ' ô', 'ok', r.skip ? r.skip + ' ô thuộc kỳ đã khóa giữ nguyên.' : ''); lcRerender(); });
  };
  function lcKyPpl(u, key) { var c = lcCfg(u), K = lcKy(c, key), f = PS.lc; return { K: K, ppl: lcPeople(u, { dept: f.dept, q: '' }, K.a, K.b) }; }
  ACTS['lc-pub'] = function (a, key) {
    var u = lcUnit(), s = ccOf(u), c = lcCfg(u), X = lcKyPpl(u, key), K = X.K, bad = 0, emp = 0, L = lcOf(u);
    X.ppl.forEach(function (e) { if (lcWarn(u, s, e['Mã NV'], K.a, K.b, e['Phòng ban']).some(function (w) { return w.lv === 'bad'; })) bad++; for (var d = K.a; d <= K.b; d = ccAdd(d, 1)) if (lcInRange(e, d) && !(L.d[e['Mã NV']] || {})[d]) emp++; });
    var go = function () { var W = lcW(u); W.pub[K.key] = { at: nowVn(), by: ccUser(), ky: c.ky }; delete PS.lc.unl[K.key]; lcLog(u, { what: 'Khóa lịch kỳ ' + K.label }); lcSave(u, 'khóa lịch kỳ ' + K.label); toast('Đã khóa lịch kỳ ' + K.label, 'ok', 'Bấm Thông báo lịch tới app nhân viên để báo cho nhân viên.'); lcRerender(); };
    var why = []; if (emp) why.push(emp + ' ô chưa xếp'); if (bad) why.push(bad + ' người có cảnh báo (vượt 48 giờ, thiếu ngày nghỉ, nghỉ chưa đủ 12 giờ khi chuyển ca)'); if (c.mode === 'nv' && !L.duyet[K.key] && Object.keys(L.reg).length) why.push('chưa bấm Duyệt theo đăng ký');
    if (why.length) confirmBox('Khóa lịch kỳ ' + K.label + '?', 'Còn ' + why.join('; ') + '. Vẫn khóa?', 'Vẫn khóa', go); else go();
  };
  ACTS['lc-unpub'] = function (a, key) {
    var u = lcUnit(), P = lcOf(u).pub[key]; if (!P) return;
    var m = modal('Mở khóa lịch', 'Kỳ bắt đầu ' + HR.vnDate(key), '<p>Đã khóa bởi <b>' + esc(P.by) + '</b> lúc ' + esc(P.at) + '. Mở khóa để sửa thoải mái, xong khóa và thông báo lại.</p><div class="field"><label for="lcUw">Lý do mở khóa *</label><input class="input" id="lcUw" maxlength="160"></div><p id="lcUm" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="lcUo">Mở khóa</button></div>', true);
    $('#lcUo', m).onclick = function () { var why = $('#lcUw', m).value.trim(); if (!why) { $('#lcUm', m).textContent = 'Nhập lý do'; return; } var W = lcW(u); delete W.pub[key]; lcLog(u, { what: 'Mở khóa kỳ bắt đầu ' + HR.vnDate(key), why: why }); lcSave(u, 'mở khóa kỳ ' + key); m.close(); toast('Đã mở khóa', 'ok'); lcRerender(); };
  };
  ACTS['lc-ntf'] = function (a, key) {
    var u = lcUnit(), X = lcKyPpl(u, key), W = lcW(u); W.ntf[key] = { at: nowVn(), by: ccUser(), n: X.ppl.length }; lcLog(u, { what: 'Thông báo lịch kỳ ' + X.K.label + ' tới app nhân viên (' + X.ppl.length + ' người)' }); lcSave(u, 'thông báo lịch kỳ ' + X.K.label);
    toast('Đã ghi nhận thông báo lịch kỳ ' + X.K.label + ' cho ' + X.ppl.length + ' người', 'ok', 'Màn hình lịch ca trên app nhân viên sẽ có ở giai đoạn 3 – hiện chưa gửi lên điện thoại thật.'); lcRerender();
  };
  ACTS['lc-duyet'] = function (a, key) {
    var u = lcUnit(), X = lcKyPpl(u, key), L = lcOf(u), ch = {}, n = 0;
    X.ppl.forEach(function (e) { var id = e['Mã NV'], G = L.reg[id] || {}; for (var d = X.K.a; d <= X.K.b; d = ccAdd(d, 1)) if (G[d] && lcInRange(e, d)) { ch[id + '|' + d] = G[d]; n++; } });
    if (!n) { toast('Kỳ này chưa có đăng ký của nhân viên', 'info'); return; }
    confirmBox('Duyệt theo đăng ký?', 'Đưa ' + n + ' ô nhân viên đăng ký vào lịch kỳ ' + X.K.label + ' (ghi đè ô đã xếp khác). Sau đó vẫn điều chỉnh từng ô được, xong bấm Khóa lịch.', 'Duyệt', function () { var r = lcApply(u, ch, 'duyệt đăng ký kỳ ' + X.K.label); lcW(u).duyet[key] = { at: nowVn(), by: ccUser() }; lcSave(u); toast('Đã duyệt ' + r.n + ' ô theo đăng ký', 'ok', 'Điều chỉnh nếu cần, rồi Khóa lịch và Thông báo.'); lcRerender(); });
  };
  ACTS['lc-log'] = function () {
    var u = lcUnit(), L = lcOf(u), nv = {}; (u.data.NV || []).forEach(function (e) { nv[e['Mã NV']] = e['Họ và tên']; });
    var ls = L.log.slice().reverse().slice(0, 300);
    modal('Nhật ký lịch xếp ca', shortUnit(u.name), ls.length ? '<div class="tbl-wrap" style="max-height:60vh"><table class="tbl"><thead><tr><th>Thời điểm</th><th>Người sửa</th><th>Nội dung</th><th>Lý do</th></tr></thead><tbody>' + ls.map(function (o) { return '<tr><td class="mono">' + esc(o.at || '') + '</td><td>' + esc(o.by || '') + '</td><td>' + (o.what ? esc(o.what) : esc((o.what2 ? o.what2 + ' · ' : '') + (nv[o.id] || o.id) + ' · ' + HR.vnDate(o.iso) + ': ' + (lcTxt(o.old) || 'trống') + ' → ' + (lcTxt(o.nw) || 'trống'))) + '</td><td>' + esc(o.why || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có thay đổi nào.</p>');
  };
  ACTS['lc-xls'] = function () {
    var u = lcUnit(), s = ccOf(u), V = lcVisible(u), L = lcOf(u);
    var cols = [{ t: 'Bộ phận', f: function (e) { return e['Phòng ban']; } }, { t: 'Mã NV', f: function (e) { return e['Mã NV']; } }, { t: 'Họ và tên', f: function (e) { return e['Họ và tên']; } }].concat(V.R.days.map(function (iso) { return { t: iso.slice(8, 10) + '/' + iso.slice(5, 7) + ' ' + LC_DOW[ccDow(iso)], f: function (e) { return lcTxt((L.d[e['Mã NV']] || {})[iso]); } }; }))
      .concat([{ t: 'Tổng giờ theo lịch', f: function (e) { var M = L.d[e['Mã NV']] || {}, h = 0; V.R.days.forEach(function (iso) { var sh = M[iso] && !LC_SP[M[iso]] ? ccShiftCode(s, M[iso]) : null; if (sh && shiftInfo(sh)) h += shiftInfo(sh).full; }); return Math.round(h * 10) / 10; } }, { t: 'Lưu ý', f: function (e) { return lcWarn(u, s, e['Mã NV'], V.R.a, V.R.b, e['Phòng ban']).map(function (w) { return w.t; }).join('; '); } }]);
    exportRows('Lich xep ca ' + (PS.lc.dept || 'khoi san xuat') + ' ' + V.R.label, cols, V.ppl, s.shifts.filter(function (x) { return x.k === 'sx'; }).map(function (sh) { return sh.id + ' = ' + sh.name + ' ' + sh.inT + '–' + sh.outT; }).join(' · ') + ' · Nghỉ = nghỉ theo lịch · Phép = nghỉ phép · KL = nghỉ không lương');
  };
  // menu chọn cho 1 ô
  function lcMenu(u, b) {
    $$('.lc-menu').forEach(function (x) { x.remove(); });
    var s = ccOf(u), k = b.getAttribute('data-lc'), id = k.split('|')[0], iso = k.split('|')[1], L = lcOf(u), v = (L.d[id] || {})[iso] || '', g = lcRegOn(u) ? (L.reg[id] || {})[iso] : '', SH = s.shifts.filter(function (x) { return x.k === 'sx'; }); if (!SH.length) SH = s.shifts;
    var nv = (u.data.NV || []).filter(function (e) { return e['Mã NV'] === id; })[0] || {};
    var it = function (val, lab, sub, col) { return '<button type="button" data-v="' + esc(val) + '" class="' + (val === v || (val === 'X' && !v) ? 'cur' : '') + '" style="--c:' + col + '"><b>' + esc(val === 'X' ? '–' : lcTxt(val)) + '</b>' + esc(lab) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>'; };
    // 11/11 11:46 anh: chọn được nhiều ca trong 1 ô – tích các ca rồi Lưu; bấm tên ca = chỉ chọn ca đó
    var cur = v && !LC_SP[v] ? String(v).split('+') : [];
    var row = function (x) { var i = shiftInfo(x), on = cur.indexOf(x.id) >= 0; return '<label class="lc-mi' + (on ? ' on' : '') + '" style="--c:' + lcCol(s, x.id) + '"><input type="checkbox" value="' + esc(x.id) + '"' + (on ? ' checked' : '') + '><b>' + esc(x.id) + '</b><span>' + esc(x.name) + '</span><small>' + esc(x.inT + '–' + x.outT) + (i ? ' · ' + ccNum(i.full) + 'h' : '') + '</small></label>'; };
    var m = document.createElement('div'); m.className = 'lc-menu'; m.setAttribute('role', 'dialog');
    m.innerHTML = '<h4>' + esc((nv['Họ và tên'] || id) + ' · ' + LC_DOW[ccDow(iso)] + ' ' + HR.vnDate(iso)) + '</h4>' + (g && g !== v ? it(g, 'Duyệt theo đăng ký', 'nhân viên đăng ký', lcCol(s, g)) + '<hr>' : '') +
      '<div class="lc-msub">Bấm tên ca để chọn 1 ca · tích nhiều ca rồi bấm Lưu</div>' + SH.map(row).join('') + '<div class="lc-mfoot"><span class="lc-msum" id="lcMs"></span><button type="button" class="btn btn-sm btn-primary" id="lcMok">Lưu</button></div><hr>' +
      (function () { // 11/11 12:59 anh: chỉ hiện Nghỉ, Nghỉ phép năm, Nghỉ không lương – ký hiệu khác vào nút Xem thêm
        var lab = function (k) { return k === 'N' ? 'Nghỉ (theo lịch)' : LC_SP[k][2].replace(/ – nên có đơn đã duyệt$/, ''); }, sub = function (k) { return k === 'N' ? 'ngày nghỉ của người này' : /nên có đơn/.test(LC_SP[k][2]) ? 'nên có đơn' : ''; };
        var main = ['N', 'P', 'KL'].filter(function (k) { return LC_SP[k]; }), more = Object.keys(LC_SP).filter(function (k) { return main.indexOf(k) < 0; }), open = more.indexOf(v) >= 0;
        return main.map(function (k) { return it(k, lab(k), sub(k), LC_SP[k][1]); }).join('') + (more.length ? '<button type="button" class="lc-more" id="lcMore" aria-expanded="' + open + '">' + (open ? 'Thu gọn ▴' : 'Xem thêm ' + more.length + ' ký hiệu (' + esc(more.join(', ')) + ') ▾') + '</button><div class="lc-mx" id="lcMx"' + (open ? '' : ' hidden') + '>' + more.map(function (k) { return it(k, lab(k), sub(k), LC_SP[k][1]); }).join('') + '</div>' : '');
      })() + '<hr>' + it('X', 'Để trống – chưa xếp', '', '#94a3b8');
    document.body.appendChild(m); var r = b.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight, left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - mw - 8), top = window.scrollY + r.bottom + 4; if (r.bottom + mh > window.innerHeight - 8 && r.top > mh) top = window.scrollY + r.top - mh - 4;
    m.style.left = Math.max(8, left) + 'px'; m.style.top = Math.max(window.scrollY + 8, top) + 'px'; var first = m.querySelector('.lc-mi input') || m.querySelector('button'); if (first) first.focus();
    var close = function () { m.remove(); document.removeEventListener('pointerdown', out, true); document.removeEventListener('keydown', esck, true); b.focus(); };
    var out = function (e) { if (!m.contains(e.target)) close(); }, esck = function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'Enter' && e.target && e.target.type === 'checkbox') { e.preventDefault(); save(); } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var bs = $$('button, input', m), i = bs.indexOf(document.activeElement); bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length].focus(); } };
    setTimeout(function () { document.addEventListener('pointerdown', out, true); document.addEventListener('keydown', esck, true); }, 0);
    var picked = function () { return ccCodeSort(s, $$('.lc-mi input', m).filter(function (c) { return c.checked; }).map(function (c) { return c.value; })); };
    var sum = function () {
      var code = picked(), x = code ? ccShiftCode(s, code) : null, i = x ? shiftInfo(x) : null, el = $('#lcMs', m); $$('.lc-mi', m).forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
      var cf = i && i.conf && i.conf.length; el.className = 'lc-msum' + (cf ? ' bad' : i && i.full > 8 ? ' warn' : '');
      el.innerHTML = !code ? 'Chưa tích ca nào' : cf ? '⚠ ' + esc(i.conf.join('; ')) : esc(code) + ' · ' + ccNum(i ? i.full : 0) + ' giờ' + (i && i.full > 8 ? ' – vượt 8 giờ/ngày' : '');
      $('#lcMok', m).disabled = !code || !!cf;
    };
    var apply = function (val) { var ch = {}; ch[k] = val; close(); var r2 = lcApply(u, ch, 'xếp ' + id + ' ' + HR.vnDate(iso)); if (r2.n) toast('Đã lưu: ' + (nv['Họ và tên'] || id) + ' ' + HR.vnDate(iso).slice(0, 5) + ' → ' + (lcTxt(val === 'X' ? '' : val) || 'chưa xếp'), 'ok', 'Ctrl + Z để hoàn tác'); lcRerender(); };
    var save = function () { var code = picked(); if (!code) return; var x = ccShiftCode(s, code), i = x ? shiftInfo(x) : null; if (i && i.conf && i.conf.length) { toast('Các ca bị trùng giờ', 'warn', i.conf.join('; ') + '. Bỏ tích 1 ca hoặc sửa giờ ca ở tab Thiết lập ca.'); return; } apply(code); };
    $$('.lc-mi input', m).forEach(function (c) { c.addEventListener('change', sum); });
    $$('.lc-mi span, .lc-mi b, .lc-mi small', m).forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); apply(t.closest('.lc-mi').querySelector('input').value); }); });
    $('#lcMok', m).addEventListener('click', save); sum();
    var mb = $('#lcMore', m); if (mb) mb.addEventListener('click', function (e) { e.stopPropagation(); var x = $('#lcMx', m), op = x.hidden; x.hidden = !op; mb.setAttribute('aria-expanded', op); mb.textContent = op ? 'Thu gọn ▴' : 'Xem thêm ' + x.children.length + ' ký hiệu ▾'; var r0 = m.getBoundingClientRect(); if (r0.bottom > window.innerHeight - 8) m.style.top = Math.max(window.scrollY + 8, window.scrollY + window.innerHeight - r0.height - 8) + 'px'; });
    m.addEventListener('click', function (e) { var x = e.target.closest('[data-v]'); if (!x) return; apply(x.getAttribute('data-v')); });
  }
  ACTS['lc-rot'] = function () {
    var u = lcUnit(), s = ccOf(u), V = lcVisible(u), f = PS.lc;
    if (!V.ppl.length) { toast('Bộ phận chưa có người', 'err'); return; }
    var shs = s.shifts.filter(function (x) { return x.k === 'sx'; }).length ? s.shifts.filter(function (x) { return x.k === 'sx'; }) : s.shifts, oSh = function (sel) { return opt('', '—', sel) + shs.map(function (x) { return opt(x.id, x.id + ' ' + x.name, sel); }).join('') + opt('N', 'N Nghỉ', sel); };
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
    var m = modal('Xếp xoay ca', (f.dept || 'Tất cả bộ phận khối sản xuất') + ' · ' + shortUnit(u.name), body), mode = 'tuan';
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
    var dp = $('#lcDept'); if (dp) dp.addEventListener('change', function () { f.dept = dp.value; f.ky = ''; render(); });
    var sm = $('#lcM'); if (sm) sm.addEventListener('change', function () { var ym = sm.value, td = refDate(); f.ky = ''; f.d = td.slice(0, 7) === ym ? td : ym + '-01'; render(); });
    var sw = $('#lcWk'); if (sw) sw.addEventListener('change', function () { f.d = sw.value; f.ky = ''; render(); });
    var sk = $('#lcKy'); if (sk) sk.addEventListener('change', function () { f.ky = sk.value; lcRerender(); });
    $$('[data-lcc]').forEach(function (el) { el.addEventListener('change', function () { var L = lcW(u), k = el.getAttribute('data-lcc'), v = Math.max(0, Math.min(31, Math.round(+el.value || 0))); L.cfg = Object.assign(lcCfg(u), L.cfg); L.cfg[k] = v; lcSave(u, k + ' = ' + v + ' ngày'); toast('Đã lưu thời hạn', 'ok'); lcRerender(); }); });
    var q = $('#lcQ'); if (q) { var tq; q.addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { f.q = q.value; var pos = q.selectionStart; render(); var q2 = $('#lcQ'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (e) { } } }, 250); }); }
    if (!window._lcKey) { window._lcKey = 1; document.addEventListener('keydown', function (e) { if (!(e.ctrlKey || e.metaKey) || !$('.lc-wrap') || $('.modal-bg')) return; var t = e.target, tag = t && t.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return; var k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); lcUndo(false); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); lcUndo(true); } }); }
    var wrap = $('.lc-wrap'); if (!wrap) return;
    var can = function (b) { var iso = b.getAttribute('data-lc').split('|')[1], lk = lcLockKey(u, iso); return !lk || f.unl[lk] ? '' : lk; };
    wrap.addEventListener('click', function (e) { var b = e.target.closest('[data-lc]'); if (!b || b.disabled) return; var lk = can(b); if (lk) lcAskUnlock(u, lk, function () { var b2 = $('[data-lc="' + b.getAttribute('data-lc') + '"]'); if (b2) lcMenu(u, b2); }); else lcMenu(u, b); });
    wrap.addEventListener('keydown', function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var b = e.target.closest('[data-lc]'); if (!b) return; e.preventDefault(); var lk = can(b); if (lk) lcAskUnlock(u, lk); else lcMenu(u, b); });
  };
