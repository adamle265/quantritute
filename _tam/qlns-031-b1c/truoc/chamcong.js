  /* =====================================================================
     MODULE CHẤM CÔNG (bản 0.3.1 – bắt đầu 07/11/2026)
     Bước 1/4 – THIẾT LẬP CHẤM CÔNG (anh chốt thứ tự 07/11 11:55: nền trước, Wi‑Fi sau)
       - Thiết lập RIÊNG từng công ty: u.ccset = { shifts, def, deptShift, rule, codes, hol, at }
       - Chưa sửa gì thì u.ccset chưa có → mọi trang dùng Cài đặt chung như trước (không đổi số liệu cũ)
       - cfgFor(u): Cài đặt chung + ký hiệu công, quy định của công ty đó → dùng cho cảnh báo, tổng hợp công, đối chiếu lương
       - Lịch lễ tết: Điều 112 BLLĐ 2019; ngày âm lịch tính bằng thuật toán âm lịch Việt Nam (Hồ Ngọc Đức, múi giờ +7)
     (chèn vào app.js khi build tại chỗ đánh dấu CHAMCONG, sau NHANSU – dùng chung biến, hàm)
     ===================================================================== */
  var CC_DOW = [[1, 'Thứ Hai', 'T2'], [2, 'Thứ Ba', 'T3'], [3, 'Thứ Tư', 'T4'], [4, 'Thứ Năm', 'T5'], [5, 'Thứ Sáu', 'T6'], [6, 'Thứ Bảy', 'T7'], [0, 'Chủ nhật', 'CN']];
  var CC_DAYK = { f: 'Cả ngày', h: 'Buổi sáng', a: 'Cách tuần', o: 'Nghỉ' }; // a = làm cả ngày cách tuần (tuần làm, tuần nghỉ – góp ý anh 07/11 14:30)
  var CC_DAYS = { f: 'Làm', h: 'Sáng', a: 'Cách', o: 'Nghỉ' };
  var CC_TYPE = [['work', 'Đi làm – tính công'], ['paid', 'Nghỉ có hưởng lương'], ['hol', 'Nghỉ lễ, tết'], ['bh', 'Nghỉ hưởng chế độ BHXH'], ['unpaid', 'Nghỉ không hưởng lương'], ['other', 'Khác']];
  var CC_TYPE_T = {}; CC_TYPE.forEach(function (t) { CC_TYPE_T[t[0]] = t[1]; });
  var CC_TYPE_CLS = { work: 'c-x', paid: 'c-p', hol: 'c-l', bh: 'c-o', unpaid: 'c-kl', other: '' };
  var CC_HOLK = { le: 'Nghỉ lễ, tết', bu: 'Nghỉ bù', doi: 'Nghỉ hoán đổi', lb: 'Đi làm bù' };
  var CC_CODES = [
    ['X', 'Đi làm', 'work', 1, 0], ['X/2', 'Đi làm nửa ngày', 'work', 0.5, 0], ['CT', 'Đi công tác', 'work', 1, 0], ['TB', 'Teambuilding, sự kiện công ty', 'work', 1, 0],
    ['P', 'Nghỉ phép năm', 'paid', 1, 1], ['R', 'Nghỉ việc riêng có lương (kết hôn, tang – Điều 115)', 'paid', 1, 1], ['L', 'Nghỉ lễ, tết', 'hol', 1, 0],
    ['Ô', 'Nghỉ ốm (hưởng BHXH)', 'bh', 1, 1], ['TS', 'Nghỉ thai sản', 'bh', 1, 1], ['KL', 'Nghỉ không lương (có đơn)', 'unpaid', 0, 1], ['KP', 'Nghỉ không phép', 'unpaid', 0, 0]
  ];

  /* ---------- Âm lịch Việt Nam (thuật toán công khai của Hồ Ngọc Đức, múi giờ +7) ---------- */
  var LUNAR = (function () {
    var PI = Math.PI;
    function jdFromDate(dd, mm, yy) { var a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3; var jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045; if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083; return jd; }
    function jdToDate(jd) { var a, b, c; if (jd > 2299160) { a = jd + 32044; b = Math.floor((4 * a + 3) / 146097); c = a - Math.floor(b * 146097 / 4); } else { b = 0; c = jd + 32082; } var d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153); return [e - Math.floor((153 * m + 2) / 5) + 1, m + 3 - 12 * Math.floor(m / 10), b * 100 + d - 4800 + Math.floor(m / 10)]; }
    function newMoon(k) {
      var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
      var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3; Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
      var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3, Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3, F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
      var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M) - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr) + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
      var dt = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
      return Jd1 + C1 - dt;
    }
    function nmDay(k, tz) { return Math.floor(newMoon(k) + 0.5 + tz / 24); }
    function sunLong(jdn) { var T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180; var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2; var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M); var L = (L0 + DL) * dr; return L - PI * 2 * Math.floor(L / (PI * 2)); }
    function sunSeg(d, tz) { return Math.floor(sunLong(d - 0.5 - tz / 24) / PI * 6); }
    function month11(yy, tz) { var off = jdFromDate(31, 12, yy) - 2415021, k = Math.floor(off / 29.530588853), nm = nmDay(k, tz); if (sunSeg(nm, tz) >= 9) nm = nmDay(k - 1, tz); return nm; }
    function leapOff(a11, tz) { var k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5), last, i = 1, arc = sunSeg(nmDay(k + i, tz), tz); do { last = arc; i++; arc = sunSeg(nmDay(k + i, tz), tz); } while (arc !== last && i < 14); return i - 1; }
    // ngày âm (không nhuận) → ISO dương lịch
    function toSolar(ld, lm, ly) {
      var tz = 7, a11, b11; if (lm < 11) { a11 = month11(ly - 1, tz); b11 = month11(ly, tz); } else { a11 = month11(ly, tz); b11 = month11(ly + 1, tz); }
      var k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853), off = lm - 11; if (off < 0) off += 12;
      if (b11 - a11 > 365) { var lo = leapOff(a11, tz); if (off >= lo) off += 1; }
      var r = jdToDate(nmDay(k + off, tz) + ld - 1); return r[2] + '-' + p2(r[1]) + '-' + p2(r[0]);
    }
    return { toSolar: toSolar };
  })();

  /* ---------- Tiện ích ngày, giờ ---------- */
  function ccIso(y, m, d) { return y + '-' + p2(m) + '-' + p2(d); }
  function ccAdd(iso, n) { var t = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + n * 86400000, d = new Date(t); return ccIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  function ccDow(iso) { return new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay(); }
  function ccMin(t) { var m = /^\s*(\d{1,2})[:hg.](\d{2})\s*$/i.exec(String(t == null ? '' : t)); if (!m) return null; var h = +m[1], mi = +m[2]; return h > 23 || mi > 59 ? null : h * 60 + mi; }
  function ccHM(min) { min = ((min % 1440) + 1440) % 1440; return p2(Math.floor(min / 60)) + ':' + p2(min % 60); }
  function ccNum(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
  function ccMon(iso) { return ccAdd(iso, -((ccDow(iso) + 6) % 7)); }
  // loại ngày của ca vào 1 ngày cụ thể: f cả ngày · h buổi sáng · o nghỉ (ngày 'a' cách tuần → f hoặc o theo tuần mốc sh.alt)
  function ccDayK(sh, iso) {
    var k = (sh && sh.days || {})[ccDow(iso)] || 'o'; if (k !== 'a') return k; if (!sh.alt) return 'f';
    var w = Math.round((Date.parse(ccMon(iso)) - Date.parse(ccMon(sh.alt))) / 604800000); return ((w % 2) + 2) % 2 === 0 ? 'f' : 'o';
  }
  function ccNextAlt(sh, from) { var d = from; for (var i = 0; i < 15; i++) { if ((sh.days || {})[ccDow(d)] === 'a' && ccDayK(sh, d) === 'f') return d; d = ccAdd(d, 1); } return ''; }
  function ccDowT(iso) { var d = ccDow(iso); return CC_DOW.filter(function (x) { return x[0] === d; })[0][1]; }

  /* ---------- Thiết lập mặc định của 1 công ty ---------- */
  function ccDefault(u) {
    var c = cfg(), cnt = {}, best = 'HC', n = 0;
    Object.keys((u.data && u.data.CC) || {}).forEach(function (m) { (u.data.CC[m] || []).forEach(function (r) { var k = String(r['Ca'] || '').trim(); if (k) { cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] > n) { n = cnt[k]; best = k; } } }); });
    var W = HRR.codes(c.workCodes), PL = HRR.codes(c.paidLeaveCodes), LV = HRR.codes(c.leaveCodes), HL = HRR.codes(c.holidayCodes);
    var codes = CC_CODES.map(function (x) {
      var k = x[0].toUpperCase(), t = W[k] ? 'work' : PL[k] ? 'paid' : HL[k] ? 'hol' : x[2];
      return { k: x[0], t: x[1], type: t, w: x[3], don: LV[k] ? 1 : 0 };
    });
    var s = {
      v: 1, def: best, deptShift: {},
      shifts: [{ id: best, name: best === 'HC' ? 'Ca hành chính' : 'Ca ' + best, inT: '08:00', outT: '17:00', bFrom: '12:00', bTo: '13:00', days: { 1: 'f', 2: 'f', 3: 'f', 4: 'f', 5: 'f', 6: 'o', 0: 'o' } }],
      rule: { lateGrace: 0, earlyGrace: 0, halfBy: 'late', halfLate: 120, halfEarly: 120, fullH: 7, halfH: 3.5, miss: 'wait', otAfter: 30, otBlock: 30, restIsOt: c.sundayIsOt !== false, lateTimes: c.lateTimes || 3, otMode: 'auto', editReason: true, editAfterLock: true },
      codes: codes, hol: {}, exc: { dept: {}, emp: {} }, at: ''
    };
    ccYears(u).forEach(function (y) { s.hol[y] = { opt: { tet: '2+3', qk: '1/9', vh: false }, days: holBuild(y, { tet: '2+3', qk: '1/9', vh: false }, s), auto: 1 }; });
    return s;
  }
  function ccYears(u) {
    var o = {}; o[refDate().slice(0, 4)] = 1;
    Object.keys((u.data && u.data.CC) || {}).forEach(function (m) { o[m.slice(0, 4)] = 1; });
    var ys = Object.keys(o).sort(); var last = +ys[ys.length - 1]; if (+refDate().slice(5, 7) >= 9) o[last + 1] = 1;
    return Object.keys(o).sort();
  }
  // bổ sung trường mới cho thiết lập đã lưu từ trước (07/11 14:30)
  function ccNorm(s) { var R = s.rule; if (R.otMode == null) R.otMode = 'auto'; if (R.editReason == null) R.editReason = true; if (R.editAfterLock == null) R.editAfterLock = true; if (!s.exc) s.exc = { dept: {}, emp: {} }; s.exc.dept = s.exc.dept || {}; s.exc.emp = s.exc.emp || {}; return s; }
  function ccOf(u) { if (!u.ccset) u._ccDraft = u._ccDraft || ccDefault(u); return ccNorm(u.ccset || u._ccDraft); }
  // ngoại lệ của 1 người: nc = không cần chấm công (tính đủ công) · no = không tính tăng ca; đặt theo người ưu tiên hơn theo phòng ban
  function ccExc(s, id, dept) { var e = (s.exc && s.exc.emp || {})[id], d = (s.exc && s.exc.dept || {})[dept] || {}; if (e) return { nc: !!e.nc, no: !!e.no, src: 'người' }; return { nc: !!d.nc, no: !!d.no, src: d.nc || d.no ? 'phòng ban' : '' }; }
  function ccSave(u, msg) {
    if (!u.ccset) { u.ccset = u._ccDraft || ccDefault(u); u._ccDraft = null; }
    u.ccset.at = nowVn(); u.ver = (u.ver || 0) + 1; saveUnits(); log('Thiết lập chấm công (' + u.name + '): ' + msg);
  }
  // Cài đặt chung + thiết lập riêng của công ty (chưa thiết lập → Cài đặt chung, giữ nguyên số liệu như trước)
  function cfgFor(u) {
    var c = cfg(); if (!u || !u.ccset) return c;
    var s = u.ccset, o = Object.assign({}, c), pick = function (f) { return s.codes.filter(f).map(function (x) { return x.k; }).join(', '); };
    o.workCodes = pick(function (x) { return x.type === 'work'; }); o.paidLeaveCodes = pick(function (x) { return x.type === 'paid'; });
    o.holidayCodes = pick(function (x) { return x.type === 'hol'; }); o.leaveCodes = pick(function (x) { return x.don; });
    o.codeW = {}; s.codes.forEach(function (x) { o.codeW[String(x.k).toUpperCase()] = +x.w; });
    o.sundayIsOt = !!s.rule.restIsOt; o.lateTimes = +s.rule.lateTimes || c.lateTimes;
    return o;
  }

  /* ---------- Ca làm việc: giờ chuẩn ---------- */
  function shiftInfo(sh) {
    var a = ccMin(sh.inT), b = ccMin(sh.outT); if (a === null || b === null) return null;
    var night = b <= a; if (night) b += 1440;
    var ba = ccMin(sh.bFrom), bb = ccMin(sh.bTo), brk = 0;
    if (ba !== null && bb !== null) { if (ba < a) ba += 1440; if (bb <= ba) bb += 1440; brk = Math.max(0, Math.min(bb, b) - Math.max(ba, a)); } else { ba = bb = null; }
    var full = (b - a - brk) / 60, half = ba !== null ? Math.max(0, ba - a) / 60 : full / 2;
    var week = 0, weekMax = 0, alt = false, days = sh.days || {}; Object.keys(days).forEach(function (k) { var v = days[k] === 'f' ? full : days[k] === 'h' ? half : days[k] === 'a' ? full : 0; weekMax += v; week += days[k] === 'a' ? v / 2 : v; if (days[k] === 'a') alt = true; });
    return { a: a, b: b, ba: ba, bb: bb, brk: brk, full: full, half: half, night: night, week: week, weekMax: weekMax, alt: alt };
  }
  function shiftWarns(sh) {
    var i = shiftInfo(sh), w = []; if (!i) return ['Giờ vào, giờ ra chưa đúng dạng HH:MM'];
    if (i.full > 8) w.push('Giờ làm bình thường ' + ccNum(i.full) + ' giờ/ngày – vượt 8 giờ (Điều 105 BLLĐ 2019)');
    if (i.weekMax > 48) w.push('Tổng ' + ccNum(i.weekMax) + ' giờ/tuần' + (i.alt ? ' (tuần có làm cách tuần)' : '') + ' – vượt 48 giờ (Điều 105)');
    if (i.alt && !sh.alt) w.push('Chưa chọn tuần mốc cho ngày làm cách tuần');
    var need = i.night ? 45 : 30; if (i.full >= 6 && i.brk < need) w.push('Nghỉ giữa giờ ' + i.brk + ' phút – ít nhất ' + need + ' phút liên tục khi làm từ 6 giờ/ngày' + (i.night ? ' ca đêm' : '') + ' (Điều 109)');
    if (sh.bFrom && sh.bTo && i.ba !== null && (i.ba < i.a || i.bb > i.b)) w.push('Giờ nghỉ giữa ca nằm ngoài giờ làm');
    return w;
  }
  function ccShiftOf(s, dept) { var id = (s.deptShift || {})[dept] || s.def; return s.shifts.filter(function (x) { return x.id === id; })[0] || s.shifts[0]; }
  function ccIsWork(s, iso, dept) { var sh = ccShiftOf(s, dept); return !!sh && ccDayK(sh, iso) !== 'o'; }

  /* ---------- Tính công 1 ngày (dùng cho Xem thử; bước 2 dùng cho bảng công tự động) ---------- */
  // kind: 'work' ngày làm việc · 'rest' ngày nghỉ hằng tuần · 'hol' ngày lễ, tết
  // who = { nc: không cần chấm công, no: không tính tăng ca } · kết quả: ot = giờ tăng ca ĐƯỢC TÍNH, otRaw = giờ làm thêm ghi nhận, otWait = chờ xác nhận
  function ccCalcDay(s, sh, tin, tout, kind, dayK, who) {
    var R = s.rule, i = shiftInfo(sh), o = { cong: 0, late: 0, early: 0, ot: 0, otRaw: 0, otWait: false, worked: 0, code: '', note: [] }; who = who || {};
    if (!i) { o.note.push('Ca chưa có giờ vào, giờ ra hợp lệ'); return o; }
    if (who.nc) {
      if (kind === 'work') { o.cong = dayK === 'h' ? 0.5 : 1; o.code = o.cong === 1 ? 'X' : 'X/2'; o.note.push('Thuộc diện không cần chấm công: tự tính đủ công ngày làm việc, không xét đi muộn – về sớm. Ngày nghỉ có đơn (phép, ốm…) vẫn trừ theo đơn'); }
      else o.note.push('Thuộc diện không cần chấm công: ngày nghỉ không tự tính công');
      o.note.push('Giờ làm thêm (nếu có) nhập tay trên bảng công'); return o;
    }
    var a = i.a, b = i.b, ba = i.ba, bb = i.bb;
    if (dayK === 'h' && ba !== null) { b = ba; ba = bb = null; }
    var ti = ccMin(tin), to = ccMin(tout);
    if (ti === null && to === null) { o.code = kind === 'work' ? '' : ''; o.note.push(kind === 'work' ? 'Không có lượt chấm – để trống, chờ đơn nghỉ hoặc ký hiệu' : 'Ngày nghỉ, không đi làm'); return o; }
    if (ti === null || to === null) {
      o.note.push('Thiếu lượt chấm ' + (ti === null ? 'vào' : 'ra'));
      if (kind !== 'work') return o;
      o.cong = R.miss === 'half' ? 0.5 : R.miss === 'full' ? (dayK === 'h' ? 0.5 : 1) : 0;
      o.code = R.miss === 'wait' ? '?' : o.cong >= 1 ? 'X' : 'X/2';
      if (R.miss === 'wait') o.note.push('Chờ bổ sung giờ chấm'); return o;
    }
    if (i.night) { if (ti < a - 360) ti += 1440; if (to <= ti) to += 1440; } else if (to < ti) to += 1440;
    var s1 = Math.max(ti, a), e1 = Math.min(to, b), wk = Math.max(0, e1 - s1);
    if (ba !== null) wk -= Math.max(0, Math.min(e1, bb) - Math.max(s1, ba));
    o.worked = Math.max(0, wk) / 60;
    if (kind !== 'work') {
      var all = Math.max(0, to - ti); if (i.ba !== null) all -= Math.max(0, Math.min(to, i.bb) - Math.max(ti, i.ba));
      o.ot = R.restIsOt || kind === 'hol' ? Math.floor(all / (+R.otBlock || 1)) * (+R.otBlock || 1) / 60 : 0;
      o.code = 'X'; o.note.push(kind === 'hol' ? 'Đi làm ngày lễ, tết: toàn bộ giờ tính làm thêm – trả ít nhất 300%, chưa kể lương ngày lễ (Điều 98)' : R.restIsOt ? 'Đi làm ngày nghỉ hằng tuần: tính làm thêm – trả ít nhất 200% (Điều 98)' : 'Đi làm ngày nghỉ hằng tuần: tính công như ngày thường');
      if (!R.restIsOt && kind === 'rest') { o.cong = o.worked >= i.full * 0.5 ? 1 : 0.5; o.ot = 0; }
      return ccOtFinal(o, R, who);
    }
    var late = Math.max(0, ti - a), early = Math.max(0, b - to);
    o.late = late > (+R.lateGrace || 0) ? late : 0; o.early = early > (+R.earlyGrace || 0) ? early : 0;
    var full = dayK === 'h' ? 0.5 : 1, half = full / 2;
    if (o.worked < 1 / 60) o.cong = 0;
    else if (R.halfBy === 'hours') { var fh = dayK === 'h' ? +R.fullH / 2 : +R.fullH, hh = dayK === 'h' ? +R.halfH / 2 : +R.halfH; o.cong = o.worked >= fh ? full : o.worked >= hh ? half : 0; }
    else { o.cong = full; if ((+R.halfLate > 0 && o.late > +R.halfLate) || (+R.halfEarly > 0 && o.early > +R.halfEarly)) { o.cong = half; o.note.push('Đi muộn hoặc về sớm quá mức → tính nửa công'); } }
    var after = to - b; if (after >= (+R.otAfter || 0) && after > 0) { var blk = +R.otBlock || 1; o.ot = Math.floor(after / blk) * blk / 60; }
    if (o.late) o.note.push('Đi muộn ' + o.late + ' phút'); if (o.early) o.note.push('Về sớm ' + o.early + ' phút');
    if (o.ot) o.note.push('Làm thêm sau giờ ra ' + ccNum(o.ot) + ' giờ – cần người lao động đồng ý (Điều 107)');
    o.code = o.cong === full ? (full === 1 ? 'X' : 'X/2') : o.cong > 0 ? 'X/2' : 'KP?';
    if (o.code === 'KP?') o.note.push('Không đủ giờ tính công – xem lại có đơn nghỉ không');
    return ccOtFinal(o, R, who);
  }
  function ccOtFinal(o, R, who) {
    o.otRaw = o.ot; if (!o.otRaw) return o;
    if (who.no) { o.ot = 0; o.note.push('Thuộc diện không tính tăng ca: giờ làm thêm chỉ hiển thị, không cộng vào giờ tăng ca'); }
    else if (R.otMode === 'confirm') { o.ot = 0; o.otWait = true; o.note.push('Chờ xác nhận: giờ làm thêm chỉ cộng vào giờ tăng ca khi người quản lý bấm Xác nhận trên bảng công – không bấm thì không tính'); }
    return o;
  }

  /* ---------- Lịch nghỉ lễ, tết theo năm (Điều 112 BLLĐ 2019) ---------- */
  function holBuild(y, opt, s) {
    y = +y; var L = [], add = function (d, t) { L.push({ d: d, t: t, k: 'le' }); };
    add(ccIso(y, 1, 1), 'Tết Dương lịch');
    var t1 = LUNAR.toSolar(1, 1, y), ab = String(opt.tet || '2+3').split('+'), a = +ab[0], b = +ab[1];
    for (var i = a; i >= 1; i--) add(ccAdd(t1, -i), 'Tết Nguyên đán – ' + (i === 1 ? 'ngày cuối năm âm lịch' : i + ' ngày trước mùng 1'));
    for (var j = 0; j < b; j++) add(ccAdd(t1, j), 'Tết Nguyên đán – mùng ' + (j + 1));
    add(LUNAR.toSolar(10, 3, y), 'Giỗ Tổ Hùng Vương (10/3 âm lịch)');
    add(ccIso(y, 4, 30), 'Ngày Chiến thắng 30/4'); add(ccIso(y, 5, 1), 'Ngày Quốc tế Lao động 1/5');
    add(ccIso(y, 9, opt.qk === '3/9' ? 3 : 1), 'Quốc khánh – ngày liền kề'); add(ccIso(y, 9, 2), 'Quốc khánh 2/9');
    if (opt.vh) add(ccIso(y, 11, 24), 'Ngày Văn hóa Việt Nam 24/11');
    L.sort(function (p, q) { return p.d < q.d ? -1 : 1; });
    var taken = {}; L.forEach(function (x) { taken[x.d] = 1; });
    var sh = s && s.shifts ? ccShiftOf(s, '') : null, isW = function (d) { return sh ? ccDayK(sh, d) !== 'o' : ccDow(d) !== 0 && ccDow(d) !== 6; };
    L.slice().forEach(function (x) {
      if (isW(x.d)) return;
      var d = x.d, guard = 0; do { d = ccAdd(d, 1); guard++; } while ((!isW(d) || taken[d]) && guard < 30);
      taken[d] = 1; L.push({ d: d, t: 'Nghỉ bù – ' + x.t + ' (' + HR.vnDate(x.d) + ' trùng ngày nghỉ hằng tuần)', k: 'bu' });
    });
    L.sort(function (p, q) { return p.d < q.d ? -1 : 1; });
    return L;
  }
  function holOf(s, y) { return (s.hol && s.hol[y] && s.hol[y].days) || []; }
  function holMap(s, y) { var o = {}; holOf(s, y).forEach(function (x) { o[x.d] = x; }); return o; }

  /* ================== TRANG THIẾT LẬP CHẤM CÔNG ================== */
  var TLCC_TABS = [['ca', 'Ca làm việc'], ['qd', 'Quy định tính công'], ['nl', 'Ngoại lệ'], ['kh', 'Ký hiệu công'], ['le', 'Lịch nghỉ lễ, tết']];
  function tlccUnit() {
    var f = ps('tlcc', { tab: 'ca', u: '', y: '' }), us = selUnits().length ? selUnits() : S.units;
    var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u;
  }
  PAGES.thietlapcc = function () {
    var f = ps('tlcc', { tab: 'ca', u: '', y: '' }), u = tlccUnit(); if (!u) return pageHead('Thiết lập chấm công') + noData('dữ liệu');
    var s = ccOf(u), us = selUnits().length ? selUnits() : S.units;
    var head = pageHead('Thiết lập chấm công', 'Ca làm, quy định tính công, ký hiệu và lịch nghỉ lễ của <b>' + esc(shortUnit(u.name)) + '</b>. Mỗi công ty thiết lập riêng · ' + (u.ccset ? 'sửa lần cuối ' + esc(u.ccset.at) : '<span class="tl-draft">Đang dùng thiết lập gợi ý – sửa bất kỳ mục nào là lưu riêng cho công ty này</span>'),
      (S.units.length > 1 ? '<button class="btn btn-sm" data-act="tlcc-copy">' + ic('hd', 15) + 'Chép sang công ty khác</button>' : ''));
    var pick = us.length > 1 ? '<div class="tl-units"><span class="vc-lbl">Công ty</span><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="tlcc-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : '';
    var tabs = '<div class="tl-tabs" role="tablist">' + TLCC_TABS.map(function (t) { return '<button role="tab" aria-selected="' + (f.tab === t[0]) + '" class="' + (f.tab === t[0] ? 'on' : '') + '" data-act="tlcc-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body = f.tab === 'qd' ? tlccRule(u, s) : f.tab === 'nl' ? tlccExc(u, s) : f.tab === 'kh' ? tlccCodes(u, s) : f.tab === 'le' ? tlccHol(u, s, f) : tlccShifts(u, s);
    return head + pick + tabs + '<div id="tlArea">' + body + '</div>';
  };
  ACTS['tlcc-tab'] = function (a, id) { PS.tlcc.tab = id; render(); };
  ACTS['tlcc-u'] = function (a, id) { PS.tlcc.u = id; render(); };

  /* ----- Tab 1: Ca làm việc ----- */
  function tlccShifts(u, s) {
    var dps = (u.data.PB || []).map(function (p) { return p['Tên phòng ban']; }).filter(Boolean);
    var cards = s.shifts.map(function (sh) {
      var i = shiftInfo(sh), w = shiftWarns(sh), isDef = sh.id === s.def;
      var dd = dps.filter(function (d) { return (s.deptShift || {})[d] === sh.id; });
      return '<div class="card card-pad tl-shift' + (isDef ? ' def' : '') + '"><div class="tl-sh-h"><span class="code c-x">' + esc(sh.id) + '</span><div class="grow"><h3>' + esc(sh.name) + (isDef ? ' <span class="tag tag-ok">Ca mặc định</span>' : '') + '</h3>' +
        '<p class="faint">' + (i ? esc(sh.inT) + ' – ' + esc(sh.outT) + (i.night ? ' (qua đêm)' : '') + (i.brk ? ' · nghỉ giữa ca ' + esc(sh.bFrom) + ' – ' + esc(sh.bTo) : ' · không nghỉ giữa ca') : 'Giờ chưa hợp lệ') + '</p></div>' +
        '<button class="btn btn-sm" data-act="tlcc-sh" data-id="' + esc(sh.id) + '">Sửa</button></div>' +
        (i ? '<div class="tl-sh-k"><div><b>' + ccNum(i.full) + '</b><span>giờ công / ngày</span></div><div><b>' + ccNum(i.half) + '</b><span>giờ buổi sáng</span></div><div><b>' + ccNum(i.week) + '</b><span>giờ / tuần' + (i.alt ? ' (trung bình)' : '') + '</span></div></div>' : '') +
        '<div class="tl-week">' + CC_DOW.map(function (d) { var k = (sh.days || {})[d[0]] || 'o'; return '<span class="wd wd-' + k + '" title="' + d[1] + ': ' + CC_DAYK[k] + '"><b>' + d[2] + '</b><small>' + CC_DAYS[k] + '</small></span>'; }).join('') + '</div>' +
        (i && i.alt ? '<p class="tl-alt">' + ic('np', 15) + '<span>Làm cách tuần' + (sh.alt ? ' · ngày đi làm tới: <b>' + esc(ccDowT(ccNextAlt(sh, refDate())) + ' ' + HR.vnDate(ccNextAlt(sh, refDate()))) + '</b>' : ' · <b>chưa chọn tuần mốc</b>') + '</span></p>' : '') +
        '<p class="tl-apply">' + (isDef ? 'Áp dụng cho mọi người, trừ phòng ban đặt ca khác' : dd.length ? 'Áp dụng cho: ' + esc(dd.join(', ')) : '<span class="faint">Chưa gán phòng ban nào</span>') + '</p>' +
        (w.length ? '<div class="notice warn">' + ic('info') + '<div>' + w.map(esc).join('<br>') + '</div></div>' : '') + '</div>';
    }).join('');
    var used = {}; Object.keys(u.data.CC || {}).forEach(function (m) { (u.data.CC[m] || []).forEach(function (r) { var k = String(r['Ca'] || '').trim(); if (k) used[k] = (used[k] || 0) + 1; }); });
    var unknown = Object.keys(used).filter(function (k) { return !s.shifts.some(function (x) { return x.id === k; }); });
    return (unknown.length ? '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>File chấm công có mã ca chưa khai báo: <b>' + esc(unknown.join(', ')) + '</b>. Thêm ca cùng mã để phần mềm tính đúng giờ chuẩn.</div></div>' : '') +
      '<div class="tl-shifts">' + cards + '<button class="tl-add" data-act="tlcc-sh" data-id="">' + '<b class="tl-plus">+</b><span>Thêm ca làm việc</span><small>Ca sáng, ca chiều, ca đêm, ca cuối tuần…</small></button></div>' +
      '<p class="faint tl-law">Căn cứ BLLĐ 2019: giờ làm bình thường không quá 8 giờ/ngày, 48 giờ/tuần (Điều 105); nghỉ giữa giờ ít nhất 30 phút liên tục, ca đêm 45 phút (Điều 109); mỗi tuần nghỉ ít nhất 24 giờ liên tục (Điều 111).</p>';
  }
  ACTS['tlcc-sh'] = function (a, id) {
    var u = tlccUnit(), s = ccOf(u), isNew = !id, sh = isNew ? { id: '', name: '', inT: '08:00', outT: '17:00', bFrom: '12:00', bTo: '13:00', days: { 1: 'f', 2: 'f', 3: 'f', 4: 'f', 5: 'f', 6: 'o', 0: 'o' } } : s.shifts.filter(function (x) { return x.id === id; })[0];
    if (!sh) return;
    var dps = (u.data.PB || []).map(function (p) { return p['Tên phòng ban']; }).filter(Boolean), days = Object.assign({}, sh.days || {});
    var body = '<form id="shF" class="tl-form" novalidate><div class="grid" style="grid-template-columns:120px 1fr;gap:10px">' + field('sId', 'Mã ca *', sh.id, ' maxlength="10" autocomplete="off"' + (isNew ? '' : '')) + field('sNm', 'Tên ca *', sh.name, ' maxlength="60"') + '</div>' +
      '<div class="grid tl-times">' + field('sIn', 'Giờ vào *', sh.inT, ' inputmode="numeric" placeholder="08:00" maxlength="5"') + field('sOut', 'Giờ ra *', sh.outT, ' inputmode="numeric" placeholder="17:00" maxlength="5"') + field('sBf', 'Nghỉ giữa ca từ', sh.bFrom, ' inputmode="numeric" placeholder="12:00" maxlength="5"') + field('sBt', 'đến', sh.bTo, ' inputmode="numeric" placeholder="13:00" maxlength="5"') + '</div>' +
      '<div class="field"><label>Ngày làm việc trong tuần <span class="faint">(bấm để đổi: Cả ngày → Buổi sáng → Cách tuần → Nghỉ)</span></label><div class="tl-week edit" id="sDays">' + CC_DOW.map(function (d) { var k = days[d[0]] || 'o'; return '<button type="button" class="wd wd-' + k + '" data-d="' + d[0] + '"><b>' + d[2] + '</b><small>' + CC_DAYK[k] + '</small></button>'; }).join('') + '</div></div>' +
      '<div class="field tl-altf" id="sAltF"><label for="sAlt">Ngày làm cách tuần: chọn 1 ngày trong <b>tuần có đi làm</b> <span class="faint">(ví dụ thứ Bảy gần nhất có đi làm)</span></label>' + dateInput('sAlt', sh.alt || '') + '<small class="faint" id="sAltN"></small></div>' +
      '<div id="sInfo" class="tl-sinfo"></div>' +
      '<div class="field"><label class="radio"><input type="checkbox" id="sDef"' + (sh.id && sh.id === s.def ? ' checked disabled' : '') + '> Ca mặc định – áp dụng cho mọi người, trừ phòng ban đặt ca khác</label></div>' +
      (dps.length ? '<div class="field"><label>Phòng ban làm theo ca này</label><div class="tl-depts">' + dps.map(function (d) { var cur = (s.deptShift || {})[d]; return '<label class="radio"><input type="checkbox" data-dp="' + esc(d) + '"' + (cur && cur === sh.id ? ' checked' : '') + '> ' + esc(d) + (cur && cur !== sh.id ? ' <span class="faint">(đang ở ca ' + esc(cur) + ')</span>' : '') + '</label>'; }).join('') + '</div></div>' : '') +
      '<p id="shMsg" class="tl-msg"></p><div class="link-row" style="justify-content:space-between">' + (isNew || s.shifts.length < 2 || sh.id === s.def ? '<span></span>' : '<button type="button" class="btn btn-danger" id="shDel">Xóa ca</button>') +
      '<span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">' + (isNew ? 'Thêm ca' : 'Lưu') + '</button></span></div></form>';
    var m = modal(isNew ? 'Thêm ca làm việc' : 'Sửa ' + sh.name, shortUnit(u.name), body, true);
    var altIso = function () { var mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec($('#sAlt', m).value.trim()); if (!mm) return ''; var iso = ccIso(+mm[3], +mm[2], +mm[1]); return HR.vnDate(iso) === p2(+mm[1]) + '/' + p2(+mm[2]) + '/' + mm[3] ? iso : ''; };
    var draw = function () {
      var hasA = Object.keys(days).some(function (k) { return days[k] === 'a'; }); $('#sAltF', m).style.display = hasA ? '' : 'none';
      var t = { inT: $('#sIn', m).value.trim(), outT: $('#sOut', m).value.trim(), bFrom: $('#sBf', m).value.trim(), bTo: $('#sBt', m).value.trim(), days: days, alt: altIso() }, i = shiftInfo(t), w = shiftWarns(t);
      if (hasA) { var nx = t.alt ? [0, 7, 14, 21, 28].map(function (k) { return ccNextAlt(t, ccAdd(refDate(), k)); }).filter(function (d, ix, a) { return d && a.indexOf(d) === ix; }).slice(0, 3) : []; $('#sAltN', m).textContent = t.alt ? 'Các ngày đi làm tới: ' + nx.map(function (d) { return HR.vnDate(d); }).join(' · ') : 'Nhập ngày dạng dd/mm/yyyy'; }
      $('#sInfo', m).innerHTML = i ? '<span>Giờ công chuẩn <b>' + ccNum(i.full) + ' giờ/ngày</b></span><span>Buổi sáng <b>' + ccNum(i.half) + ' giờ</b></span><span>Cả tuần <b>' + ccNum(i.week) + ' giờ' + (i.alt ? ' trung bình (tuần đi làm ' + ccNum(i.weekMax) + ' giờ)' : '') + '</b></span>' + (i.night ? '<span class="tag tag-warn">Ca qua đêm</span>' : '') + (w.length ? '<div class="notice warn">' + ic('info') + '<div>' + w.map(esc).join('<br>') + '</div></div>' : '') : '<span class="faint">Nhập giờ dạng HH:MM, ví dụ 08:00</span>';
    };
    $('#sDays', m).addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; var d = b.getAttribute('data-d'), k = days[d] || 'o', nx = k === 'f' ? 'h' : k === 'h' ? 'a' : k === 'a' ? 'o' : 'f'; days[d] = nx; b.className = 'wd wd-' + nx; b.querySelector('small').textContent = CC_DAYK[nx]; draw(); });
    ['sIn', 'sOut', 'sBf', 'sBt', 'sAlt'].forEach(function (k) { $('#' + k, m).addEventListener('input', draw); }); if (typeof bindDateInput === 'function') bindDateInput($('#sAlt', m)); $('#sAlt', m).addEventListener('change', draw); draw();
    var del = $('#shDel', m); if (del) del.addEventListener('click', function () {
      var nUse = 0; Object.keys(u.data.CC || {}).forEach(function (mo) { (u.data.CC[mo] || []).forEach(function (r) { if (String(r['Ca'] || '').trim() === sh.id) nUse++; }); });
      confirmBox('Xóa ca ' + sh.id + '?', (nUse ? 'File chấm công đang có ' + nUse + ' dòng ghi ca này – các dòng đó sẽ được tính theo ca mặc định. ' : '') + 'Phòng ban đang gán ca này chuyển về ca mặc định.', 'Xóa ca', function () {
        s.shifts = s.shifts.filter(function (x) { return x !== sh; }); Object.keys(s.deptShift || {}).forEach(function (d) { if (s.deptShift[d] === sh.id) delete s.deptShift[d]; });
        ccSave(u, 'xóa ca ' + sh.id); m.close(); toast('Đã xóa ca ' + sh.id, 'ok'); render();
      });
    });
    $('#shF', m).addEventListener('submit', function (e) {
      e.preventDefault(); var msg = $('#shMsg', m), bad = function (id, t) { msg.textContent = t; var el = $('#' + id, m); if (el) el.focus(); };
      var nid = $('#sId', m).value.trim().toUpperCase(), nm = $('#sNm', m).value.trim();
      if (!/^[A-Z0-9ĐÔƠƯÂĂÊ_\-\/]{1,10}$/.test(nid)) return bad('sId', 'Mã ca gồm chữ, số, tối đa 10 ký tự (ví dụ HC, CA1, DEM)');
      if (s.shifts.some(function (x) { return x !== sh && x.id === nid; })) return bad('sId', 'Mã ca ' + nid + ' đã có');
      if (!nm) return bad('sNm', 'Nhập tên ca');
      var t = { inT: $('#sIn', m).value.trim(), outT: $('#sOut', m).value.trim(), bFrom: $('#sBf', m).value.trim(), bTo: $('#sBt', m).value.trim() };
      if (ccMin(t.inT) === null) return bad('sIn', 'Giờ vào dạng HH:MM'); if (ccMin(t.outT) === null) return bad('sOut', 'Giờ ra dạng HH:MM');
      if ((t.bFrom || t.bTo) && (ccMin(t.bFrom) === null || ccMin(t.bTo) === null)) return bad(ccMin(t.bFrom) === null ? 'sBf' : 'sBt', 'Giờ nghỉ giữa ca dạng HH:MM, hoặc để trống cả 2 ô');
      if (!Object.keys(days).some(function (k) { return days[k] !== 'o'; })) return bad('sDays', 'Chọn ít nhất 1 ngày làm việc');
      var hasA = Object.keys(days).some(function (k) { return days[k] === 'a'; }), alt = altIso();
      if (hasA && !alt) return bad('sAlt', 'Chọn 1 ngày trong tuần có đi làm để phần mềm biết tuần nào làm, tuần nào nghỉ');
      if (hasA && !Object.keys(days).some(function (k) { return days[k] === 'a' && +k === ccDow(alt); })) return bad('sAlt', 'Ngày mốc phải đúng thứ đang đặt Cách tuần (ví dụ một thứ Bảy có đi làm)');
      t.alt = hasA ? alt : '';
      t.inT = ccHM(ccMin(t.inT)); t.outT = ccHM(ccMin(t.outT)); if (t.bFrom) { t.bFrom = ccHM(ccMin(t.bFrom)); t.bTo = ccHM(ccMin(t.bTo)); }
      var old = sh.id, row = Object.assign(sh, t, { id: nid, name: nm, days: days });
      if (isNew) s.shifts.push(row);
      if (old && old !== nid) { if (s.def === old) s.def = nid; Object.keys(s.deptShift || {}).forEach(function (d) { if (s.deptShift[d] === old) s.deptShift[d] = nid; }); }
      if ($('#sDef', m).checked) s.def = nid;
      s.deptShift = s.deptShift || {};
      $$('[data-dp]', m).forEach(function (c) { var d = c.getAttribute('data-dp'); if (c.checked) s.deptShift[d] = nid; else if (s.deptShift[d] === nid) delete s.deptShift[d]; });
      ccSave(u, (isNew ? 'thêm ca ' : 'sửa ca ') + nid + ' ' + t.inT + '–' + t.outT); m.close(); toast(isNew ? 'Đã thêm ca ' + nid : 'Đã lưu ca ' + nid, 'ok', 'Lịch nghỉ bù có thể cần tính lại nếu đổi ngày làm việc trong tuần.'); render();
    });
  };

  /* ----- Tab 2: Quy định tính công + Xem thử ----- */
  function tlccRule(u, s) {
    var R = s.rule, n = function (k, label, unit, help, step) { return '<div class="tl-q"><label for="q_' + k + '">' + label + '</label><span class="tl-qi"><input class="input" id="q_' + k + '" data-qk="' + k + '" type="number" min="0" step="' + (step || 1) + '" value="' + esc(R[k]) + '"><span>' + (unit || '') + '</span></span>' + (help ? '<small>' + help + '</small>' : '') + '</div>'; };
    var rad = function (k, v, t) { return '<label class="tl-ro"><input type="radio" name="q_' + k + '" data-qr="' + k + '" value="' + v + '"' + (String(R[k]) === v ? ' checked' : '') + '><span>' + t + '</span></label>'; };
    var shOpts = s.shifts.map(function (x) { return opt(x.id, x.id + ' – ' + x.name, s.def); }).join('');
    return '<div class="set-grid tl-rules">' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Đi muộn, về sớm</h3><p>So với giờ vào, giờ ra của ca</p></div></div><div class="tl-qs">' +
      n('lateGrace', 'Cho phép đến muộn', 'phút', 'Trong mức này không tính là đi muộn') + n('earlyGrace', 'Cho phép về sớm', 'phút') + n('lateTimes', 'Nhắc khi đi muộn từ', 'lần/tháng', 'Hiện ở Việc cần xử lý') + '</div></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Cách tính nửa công</h3><p>Chọn 1 cách cho cả công ty</p></div></div>' +
      '<div class="tl-rad">' + rad('halfBy', 'late', '<b>Theo đi muộn, về sớm</b>') + '</div><div class="tl-qs">' + n('halfLate', 'Đến muộn quá', 'phút → nửa công', '0 = không áp dụng') + n('halfEarly', 'Về sớm quá', 'phút → nửa công', '0 = không áp dụng') + '</div>' +
      '<div class="tl-rad">' + rad('halfBy', 'hours', '<b>Theo số giờ làm thực tế</b>') + '</div><div class="tl-qs">' + n('fullH', 'Đủ 1 công khi làm từ', 'giờ', '', 0.5) + n('halfH', 'Nửa công khi làm từ', 'giờ', 'Dưới mức này: không tính công', 0.5) + '</div></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Quên chấm vào hoặc ra</h3><p>Ngày chỉ có 1 lượt chấm</p></div></div><div class="tl-rad col">' +
      rad('miss', 'wait', '<b>Chờ bổ sung</b> – để trống, nhắc người quản lý (khuyên dùng)') + rad('miss', 'half', 'Tính nửa công') + rad('miss', 'full', 'Tính đủ công') + rad('miss', 'zero', 'Không tính công') + '</div></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Làm thêm giờ</h3><p>BLLĐ 2019 Điều 98, 107</p></div></div><div class="tl-qs">' +
      n('otAfter', 'Tính làm thêm khi ra sau giờ ra từ', 'phút') + '<div class="tl-q"><label for="q_otBlock">Làm tròn xuống theo</label><span class="tl-qi"><select class="input" id="q_otBlock" data-qk="otBlock">' + [15, 30, 60].map(function (v) { return opt(v, v + ' phút', R.otBlock); }).join('') + '</select></span></div></div>' +
      '<div class="tl-rad col tl-otm"><span class="vc-lbl">Khi giờ làm vượt giờ ra theo ca</span>' + rad('otMode', 'auto', '<b>Mặc định tính tăng ca</b> – tự cộng giờ vượt quá theo thiết lập trên') + rad('otMode', 'confirm', '<b>Không mặc định tính</b> – vẫn hiện giờ làm thêm, chỉ tính khi người quản lý bấm <b>Xác nhận</b>; không bấm thì không tính') + '</div>' +
      '<label class="tl-ro" style="margin-top:10px"><input type="checkbox" data-qc="restIsOt"' + (R.restIsOt ? ' checked' : '') + '><span><b>Đi làm ngày nghỉ hằng tuần</b> tính là làm thêm giờ (trả ít nhất 200%), không tính ngày công</span></label>' +
      '<p class="faint" style="font-size:12px;margin:8px 0 0">Trần làm thêm (40 giờ/tháng, 200 hoặc 300 giờ/năm) đặt ở Cài đặt, dùng chung các công ty. Phòng ban, người không tính tăng ca: đặt ở thẻ <b>Ngoại lệ</b>.</p></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Sửa tay trên bảng công</h3><p>Áp dụng ở Tổng hợp công</p></div></div>' +
      '<div class="notice">' + ic('check') + '<div><b>Luôn cho phép sửa tay</b> dù đã đặt quy tắc: sửa ký hiệu, ngày công, giờ vào – ra, giờ làm thêm của từng ô. Ô sửa tay được giữ nguyên, không bị quy tắc tính đè lại. Mỗi lần sửa ghi lại người sửa, thời điểm, giá trị cũ.</div></div>' +
      '<div class="tl-rad col">' + '<label class="tl-ro"><input type="checkbox" data-qc="editReason"' + (R.editReason ? ' checked' : '') + '><span><b>Bắt buộc ghi lý do</b> khi sửa (ví dụ: quên chấm, đi công tác, máy chấm lỗi)</span></label>' +
      '<label class="tl-ro"><input type="checkbox" data-qc="editAfterLock"' + (R.editAfterLock ? ' checked' : '') + '><span><b>Cho sửa cả sau khi chốt công</b> – ô sửa sau chốt được đánh dấu để gửi nhân viên xác nhận lại</span></label></div></div>' +
      '</div>' +
      '<div class="card card-pad tl-try"><div class="card-head"><div><h3>Xem thử cách tính</h3><p>Nhập giờ chấm để kiểm tra quy định trước khi áp cho cả tháng</p></div></div>' +
      '<div class="filters" style="margin:0"><div class="field"><label for="tWho">Nhân sự</label><select class="input" id="tWho" style="max-width:260px">' + opt('', 'Nhân viên thường', '') + ccActive(u).map(function (e) { var x = ccExc(s, e['Mã NV'], e['Phòng ban']); return opt(e['Mã NV'], e['Họ và tên'] + (x.nc ? ' · miễn chấm công' : x.no ? ' · không tính tăng ca' : ''), ''); }).join('') + '</select></div><div class="field"><label for="tCa">Ca</label><select class="input" id="tCa">' + shOpts + '</select></div>' +
      '<div class="field"><label for="tDay">Ngày</label><select class="input" id="tDay">' + opt('work', 'Ngày làm việc', 'work') + opt('half', 'Ngày làm buổi sáng', '') + opt('rest', 'Ngày nghỉ hằng tuần', '') + opt('hol', 'Ngày lễ, tết', '') + '</select></div>' +
      '<div class="field"><label for="tIn">Giờ vào</label><input class="input" id="tIn" value="08:12" inputmode="numeric" maxlength="5" style="width:96px"></div><div class="field"><label for="tOut">Giờ ra</label><input class="input" id="tOut" value="18:05" inputmode="numeric" maxlength="5" style="width:96px"></div></div>' +
      '<div id="tOutBox" class="tl-res"></div></div>';
  }
  function tlccTry(u, s) {
    var box = $('#tOutBox'); if (!box) return;
    var sh = s.shifts.filter(function (x) { return x.id === $('#tCa').value; })[0] || s.shifts[0], dk = $('#tDay').value;
    var wid = $('#tWho') ? $('#tWho').value : '', we = wid ? ccActive(u).filter(function (e) { return e['Mã NV'] === wid; })[0] : null;
    var r = ccCalcDay(s, sh, $('#tIn').value, $('#tOut').value, dk === 'rest' || dk === 'hol' ? dk : 'work', dk === 'half' ? 'h' : 'f', we ? ccExc(s, wid, we['Phòng ban']) : {});
    var code = s.codes.filter(function (x) { return x.k === r.code; })[0];
    box.innerHTML = '<div class="tl-res-k"><div><span>Ký hiệu</span><b><span class="code ' + (code ? CC_TYPE_CLS[code.type] : '') + '">' + esc(r.code || '–') + '</span></b></div><div><span>Ngày công</span><b>' + ccNum(r.cong) + '</b></div><div><span>Giờ làm trong ca</span><b>' + ccNum(r.worked) + '</b></div><div><span>Đi muộn</span><b>' + (r.late ? r.late + ' phút' : '–') + '</b></div><div><span>Về sớm</span><b>' + (r.early ? r.early + ' phút' : '–') + '</b></div><div><span>Làm thêm</span><b>' + (r.otRaw ? ccNum(r.otRaw) + ' giờ' + (r.otWait ? '<small class="tl-ow">chờ xác nhận</small>' : !r.ot ? '<small class="tl-ow no">không tính</small>' : '') : '–') + '</b></div></div>' +
      (r.note.length ? '<ul class="tl-notes">' + r.note.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '');
  }

  /* ----- Tab Ngoại lệ: không cần chấm công · không tính tăng ca (góp ý anh 07/11 14:30) ----- */
  function ccActive(u) { var R = refDate(), mat = HR.maternitySet(u.data, R); return (u.data.NV || []).filter(function (e) { return e['Mã NV'] && HR.staffState(e, R, mat) !== 'left'; }); }
  function tlccExc(u, s) {
    var ppl = ccActive(u), dps = {}; (u.data.PB || []).forEach(function (p) { if (p['Tên phòng ban']) dps[p['Tên phòng ban']] = 0; }); ppl.forEach(function (e) { var d = e['Phòng ban'] || '(Chưa ghi phòng ban)'; dps[d] = (dps[d] || 0) + 1; });
    var nNc = ppl.filter(function (e) { return ccExc(s, e['Mã NV'], e['Phòng ban']).nc; }).length, nNo = ppl.filter(function (e) { var x = ccExc(s, e['Mã NV'], e['Phòng ban']); return x.no && !x.nc; }).length;
    var D = s.exc.dept, E = s.exc.emp, ids = Object.keys(E), byId = {}; (u.data.NV || []).forEach(function (e) { byId[e['Mã NV']] = e; });
    var ck = function (attr, on) { return '<input type="checkbox" class="tl-ck" ' + attr + (on ? ' checked' : '') + '>'; };
    return '<div class="org-kpi tl-ek"><div><b>' + nNc + '</b><span>người không cần chấm công</span></div><div><b>' + nNo + '</b><span>người chấm công nhưng không tính tăng ca</span></div><div><b>' + (ppl.length - nNc) + '</b><span>người chấm công bình thường</span></div></div>' +
      '<div class="tl-hgrid">' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Theo phòng ban</h3><p>Áp dụng cho mọi người trong phòng, trừ người có thiết lập riêng bên cạnh</p></div></div>' +
      '<div class="tbl-wrap" style="max-height:none"><table class="tbl tl-etbl"><thead><tr><th>Phòng ban</th><th class="r">Đang làm</th><th class="c">Không cần<br>chấm công</th><th class="c">Không tính<br>tăng ca</th></tr></thead><tbody>' +
      Object.keys(dps).map(function (d) { var x = D[d] || {}; return '<tr><td>' + esc(d) + '</td><td class="r">' + dps[d] + '</td><td class="c">' + ck('data-ed="' + esc(d) + '" data-ef="nc" aria-label="' + esc(d) + ': không cần chấm công"', x.nc) + '</td><td class="c">' + ck('data-ed="' + esc(d) + '" data-ef="no" aria-label="' + esc(d) + ': không tính tăng ca"', x.no) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Theo từng người</h3><p>Ưu tiên hơn thiết lập của phòng ban</p></div></div>' +
      (ids.length ? '<div class="tl-elist">' + ids.map(function (id) { var x = E[id], e = byId[id] || {}; return '<div class="tl-ei"><div class="grow"><b>' + esc(e['Họ và tên'] || id) + '</b><small>' + esc(id + (e['Phòng ban'] ? ' · ' + e['Phòng ban'] : '') + (byId[id] && ppl.indexOf(byId[id]) < 0 ? ' · đã nghỉ việc' : '')) + '</small>' + (x.note ? '<small class="tl-en">' + esc(x.note) + '</small>' : '') + '</div>' +
        '<label class="tl-ro"><input type="checkbox" data-ee="' + esc(id) + '" data-ef="nc"' + (x.nc ? ' checked' : '') + '><span>Không cần chấm công</span></label><label class="tl-ro"><input type="checkbox" data-ee="' + esc(id) + '" data-ef="no"' + (x.no ? ' checked' : '') + '><span>Không tính tăng ca</span></label><button class="btn btn-sm" data-act="tlcc-edel" data-id="' + esc(id) + '">Bỏ</button></div>'; }).join('') + '</div>' : '<p class="muted">Chưa có ai được đặt riêng.</p>') +
      '<div class="tl-hadd"><select class="input" id="eWho" style="flex:1;min-width:200px">' + opt('', 'Chọn nhân sự…', '') + ppl.filter(function (e) { return !E[e['Mã NV']]; }).map(function (e) { return opt(e['Mã NV'], e['Họ và tên'] + ' – ' + (e['Phòng ban'] || ''), ''); }).join('') + '</select>' +
      '<label class="tl-ro"><input type="checkbox" id="eNc"><span>Không cần chấm công</span></label><label class="tl-ro"><input type="checkbox" id="eNo"><span>Không tính tăng ca</span></label>' +
      '<input class="input" id="eNote" maxlength="80" placeholder="Lý do, ví dụ: Giám đốc, làm việc theo kết quả" style="flex:1 1 100%"><button class="btn btn-primary" data-act="tlcc-eadd">+ Thêm người</button></div></div></div>' +
      '<div class="notice warn" style="margin-top:14px">' + ic('info') + '<div><b>Không cần chấm công:</b> phần mềm tự tính đủ công các ngày làm việc theo ca, không xét đi muộn – về sớm; ngày nghỉ có đơn (phép, ốm, không lương…) vẫn trừ theo đơn. Không có ngày nghỉ trừ lương thì tính đủ lương.<br>' +
      '<b>Không tính tăng ca:</b> giờ làm thêm vẫn hiện trên bảng công nhưng không cộng vào giờ tăng ca. Theo BLLĐ 2019, người làm thêm giờ theo yêu cầu của người sử dụng lao động được trả lương làm thêm (Điều 98) – chỉ dùng cho trường hợp đã thỏa thuận rõ trong hợp đồng, quy chế lương (ví dụ lương khoán theo kết quả); nên rà lại với người phụ trách pháp chế, kế toán.</div></div>';
  }
  ACTS['tlcc-edel'] = function (a, id) { var u = tlccUnit(), s = ccOf(u); delete s.exc.emp[id]; ccSave(u, 'bỏ ngoại lệ ' + id); toast('Đã bỏ thiết lập riêng của ' + id, 'ok'); render(); };
  ACTS['tlcc-eadd'] = function () {
    var u = tlccUnit(), s = ccOf(u), id = $('#eWho').value, nc = $('#eNc').checked, no = $('#eNo').checked;
    if (!id) { toast('Chọn nhân sự', 'err'); $('#eWho').focus(); return; }
    if (!nc && !no) { toast('Tích ít nhất 1 ô: Không cần chấm công hoặc Không tính tăng ca', 'err'); return; }
    s.exc.emp[id] = { nc: nc ? 1 : 0, no: no ? 1 : 0, note: $('#eNote').value.trim() }; ccSave(u, 'ngoại lệ ' + id + (nc ? ' không chấm công' : '') + (no ? ' không tăng ca' : '')); toast('Đã thêm ' + id, 'ok'); render();
  };

  /* ----- Tab 3: Ký hiệu công ----- */
  function tlccCodes(u, s) {
    var used = {}; Object.keys(u.data.CC || {}).forEach(function (m) { (u.data.CC[m] || []).forEach(function (r) { var k = String(r['Ký hiệu'] || '').trim().toUpperCase(); if (k) used[k] = (used[k] || 0) + 1; }); });
    var known = {}; s.codes.forEach(function (x) { known[String(x.k).toUpperCase()] = 1; });
    var odd = Object.keys(used).filter(function (k) { return !known[k]; });
    return (odd.length ? '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>File chấm công có ký hiệu chưa khai báo: <b>' + esc(odd.join(', ')) + '</b> – các ngày này chưa được tính công. Thêm ký hiệu cùng tên để phần mềm hiểu.</div></div>' : '') +
      '<div class="card"><div class="tbl-wrap"><table class="tbl tl-codes"><thead><tr><th>Ký hiệu</th><th>Ý nghĩa</th><th>Nhóm</th><th class="r">Hệ số</th><th>Phải có đơn</th><th class="r">Đang dùng</th><th></th></tr></thead><tbody>' +
      s.codes.map(function (x, i) {
        var k = String(x.k).toUpperCase();
        return '<tr data-ci="' + i + '"><td><span class="code ' + (CC_TYPE_CLS[x.type] || '') + '">' + esc(x.k) + '</span></td><td><input class="input" data-cf="t" value="' + esc(x.t) + '" maxlength="80" aria-label="Ý nghĩa ' + esc(x.k) + '"></td>' +
          '<td><select class="input" data-cf="type" aria-label="Nhóm ' + esc(x.k) + '">' + CC_TYPE.map(function (t) { return opt(t[0], t[1], x.type); }).join('') + '</select></td>' +
          '<td class="r"><select class="input" data-cf="w" style="width:76px" aria-label="Hệ số ' + esc(x.k) + '">' + [1, 0.5, 0].map(function (v) { return opt(v, ccNum(v), x.w); }).join('') + '</select></td>' +
          '<td><label class="radio"><input type="checkbox" data-cf="don"' + (x.don ? ' checked' : '') + '> Có</label></td><td class="r">' + (used[k] ? fmtInt(used[k]) + ' ngày' : '<span class="faint">–</span>') + '</td>' +
          '<td>' + (used[k] ? '' : '<button class="btn btn-sm" data-act="tlcc-cdel" data-id="' + i + '" aria-label="Xóa ký hiệu ' + esc(x.k) + '">Xóa</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="card-pad tl-cadd"><input class="input" id="cNewK" maxlength="6" placeholder="Ký hiệu mới" style="width:130px"><input class="input" id="cNewT" maxlength="80" placeholder="Ý nghĩa, ví dụ: Làm việc tại nhà" style="flex:1;min-width:200px"><select class="input" id="cNewG">' + CC_TYPE.map(function (t) { return opt(t[0], t[1], 'work'); }).join('') + '</select><button class="btn btn-primary" data-act="tlcc-cadd">+ Thêm ký hiệu</button></div></div>' +
      '<p class="faint tl-law"><b>Hệ số</b>: số ngày được tính cho 1 ngày mang ký hiệu đó (đi làm → ngày công; nghỉ có lương → ngày nghỉ hưởng lương). <b>Phải có đơn</b>: ngày mang ký hiệu này mà không có đơn nghỉ được duyệt sẽ hiện ở Việc cần xử lý. Ký hiệu đang có trong file chấm công không xóa được.</p>';
  }
  ACTS['tlcc-cdel'] = function (a, id) { var u = tlccUnit(), s = ccOf(u), x = s.codes[+id]; if (!x) return; s.codes.splice(+id, 1); ccSave(u, 'xóa ký hiệu ' + x.k); toast('Đã xóa ký hiệu ' + x.k, 'ok'); render(); };
  ACTS['tlcc-cadd'] = function () {
    var u = tlccUnit(), s = ccOf(u), k = $('#cNewK').value.trim().toUpperCase(), t = $('#cNewT').value.trim(), g = $('#cNewG').value;
    if (!/^[A-ZÀ-Ỹ0-9\/+]{1,6}$/i.test(k)) { toast('Ký hiệu gồm chữ, số, tối đa 6 ký tự', 'err'); $('#cNewK').focus(); return; }
    if (s.codes.some(function (x) { return String(x.k).toUpperCase() === k; })) { toast('Ký hiệu ' + k + ' đã có', 'err'); return; }
    if (!t) { toast('Nhập ý nghĩa của ký hiệu', 'err'); $('#cNewT').focus(); return; }
    s.codes.push({ k: k, t: t, type: g, w: g === 'unpaid' ? 0 : 1, don: g === 'paid' || g === 'bh' ? 1 : 0 }); ccSave(u, 'thêm ký hiệu ' + k); toast('Đã thêm ký hiệu ' + k, 'ok'); render();
  };

  /* ----- Tab 4: Lịch nghỉ lễ, tết ----- */
  function tlccHol(u, s, f) {
    var ys = ccYears(u); Object.keys(s.hol || {}).forEach(function (y) { if (ys.indexOf(y) < 0) ys.push(y); }); ys.sort();
    if (ys.indexOf(f.y) < 0) f.y = ys.indexOf(refDate().slice(0, 4)) >= 0 ? refDate().slice(0, 4) : ys[ys.length - 1];
    var y = f.y, H = s.hol[y], days = H ? H.days : [], o = H ? H.opt : { tet: '2+3', qk: '1/9', vh: false };
    var nLe = days.filter(function (x) { return x.k === 'le'; }).length, nBu = days.filter(function (x) { return x.k === 'bu'; }).length;
    var t1 = LUNAR.toSolar(1, 1, +y), gt = LUNAR.toSolar(10, 3, +y);
    var optBox = '<div class="card card-pad tl-hopt"><div class="card-head"><div><h3>Phương án nghỉ năm ' + y + '</h3><p>Mùng 1 Tết: <b>' + ccDowT(t1) + ' ' + HR.vnDate(t1) + '</b> · Giỗ Tổ 10/3 âm lịch: <b>' + ccDowT(gt) + ' ' + HR.vnDate(gt) + '</b></p></div></div>' +
      '<div class="tl-hrow"><span class="vc-lbl">Tết Nguyên đán (5 ngày)</span><div class="seg">' + [['1+4', '1 ngày trước Tết + 4 ngày đầu năm'], ['2+3', '2 + 3'], ['3+2', '3 + 2']].map(function (x) { return '<button class="' + (o.tet === x[0] ? 'on' : '') + '" data-act="tlcc-hopt" data-id="tet:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="tl-hrow"><span class="vc-lbl">Quốc khánh (2 ngày)</span><div class="seg">' + [['1/9', '1/9 và 2/9'], ['3/9', '2/9 và 3/9']].map(function (x) { return '<button class="' + (o.qk === x[0] ? 'on' : '') + '" data-act="tlcc-hopt" data-id="qk:' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="tl-hrow"><label class="radio"><input type="checkbox" id="hVh"' + (o.vh ? ' checked' : '') + '> Cho nghỉ Ngày Văn hóa Việt Nam 24/11</label><span class="faint tl-vh">Công chức được nghỉ 24/11/2026. Với doanh nghiệp, đến lúc cập nhật (07/11/2026) Luật sửa đổi Bộ luật Lao động vẫn đang được Quốc hội cho ý kiến, chưa bắt buộc – đơn vị tự quyết, kiểm tra lại văn bản mới trước khi bật.</span></div>' +
      '<div class="link-row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-act="tlcc-hbuild">' + (H ? 'Tạo lại lịch theo phương án' : 'Tạo lịch năm ' + y) + '</button><span class="faint" style="font-size:12.5px">Tự thêm ngày nghỉ bù khi ngày lễ trùng ngày nghỉ hằng tuần của ca mặc định (Điều 112 khoản 3). Ngày anh/chị tự thêm được giữ lại.</span></div></div>';
    var list = '<div class="card card-pad"><div class="card-head"><div><h3>Danh sách ngày năm ' + y + '</h3><p>' + nLe + ' ngày lễ, tết' + (nBu ? ' · ' + nBu + ' ngày nghỉ bù' : '') + ' · ngày lễ, tết, nghỉ bù được hưởng nguyên lương</p></div></div>' +
      (days.length ? '<div class="tl-hlist">' + days.map(function (x, i) { return '<div class="tl-hi k-' + x.k + '"><span class="tl-hd"><b>' + HR.vnDate(x.d).slice(0, 5) + '</b><small>' + ccDowT(x.d) + '</small></span><span class="grow">' + esc(x.t) + (x.m ? ' <span class="tag tag-mute">tự thêm</span>' : '') + '</span><span class="tag ' + (x.k === 'lb' ? 'tag-warn' : x.k === 'le' ? 'tag-ok' : 'tag-mute') + '">' + CC_HOLK[x.k] + '</span><button class="btn btn-sm" data-act="tlcc-hdel" data-id="' + i + '" aria-label="Xóa ngày ' + HR.vnDate(x.d) + '">Xóa</button></div>'; }).join('') + '</div>' : '<p class="muted">Chưa có lịch năm ' + y + '. Chọn phương án rồi bấm Tạo lịch.</p>') +
      '<div class="tl-hadd"><span class="datebox"><input class="input" id="hD" inputmode="numeric" placeholder="dd/mm/yyyy" maxlength="10"></span><select class="input" id="hK">' + Object.keys(CC_HOLK).map(function (k) { return opt(k, CC_HOLK[k], 'doi'); }).join('') + '</select><input class="input" id="hT" maxlength="80" placeholder="Ghi chú, ví dụ: Nghỉ hoán đổi, làm bù thứ Bảy 22/8" style="flex:1;min-width:220px"><button class="btn" data-act="tlcc-hadd">+ Thêm ngày</button></div></div>';
    return '<div class="tl-years"><span class="vc-lbl">Năm</span><div class="seg">' + ys.map(function (x) { return '<button class="' + (x === y ? 'on' : '') + '" data-act="tlcc-y" data-id="' + x + '">' + x + '</button>'; }).join('') + '</div></div>' +
      '<div class="tl-hgrid">' + optBox + list + '</div>' + tlccCal(s, y) +
      '<p class="faint tl-law">Căn cứ Điều 112 BLLĐ 2019: Tết Dương lịch 1 ngày; Tết Âm lịch 5 ngày; Giỗ Tổ Hùng Vương 1 ngày; 30/4, 1/5 mỗi ngày 1 ngày; Quốc khánh 2 ngày (2/9 và 1 ngày liền kề trước hoặc sau). Doanh nghiệp chọn phương án nghỉ Tết, Quốc khánh và <b>thông báo cho người lao động trước ít nhất 30 ngày</b>. Lịch 2027 tham khảo Thông báo 11483/TB-BNV ngày 09/10/2026 của Bộ Nội vụ.</p>';
  }
  function tlccCal(s, y) {
    var hm = holMap(s, y), sh = ccShiftOf(s, ''), td = HR.isoToday(), h = '<div class="card card-pad tl-cal"><div class="card-head"><div><h3>Lịch cả năm ' + y + '</h3><p>Theo ca mặc định ' + esc(sh ? sh.id : '') + '</p></div><div class="legend"><span><i class="cd k-le"></i>Lễ, tết</span><span><i class="cd k-bu"></i>Nghỉ bù / hoán đổi</span><span><i class="cd k-lb"></i>Làm bù</span><span><i class="cd k-o"></i>Nghỉ hằng tuần</span><span><i class="cd k-h"></i>Làm buổi sáng</span></div></div><div class="tl-months">';
    for (var m = 1; m <= 12; m++) {
      var first = ccIso(+y, m, 1), nd = new Date(Date.UTC(+y, m, 0)).getUTCDate(), lead = (ccDow(first) + 6) % 7;
      h += '<div class="tl-mo"><b>Tháng ' + m + '</b><div class="tl-mg">' + ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (d) { return '<i>' + d + '</i>'; }).join('');
      for (var k = 0; k < lead; k++) h += '<span></span>';
      for (var d = 1; d <= nd; d++) {
        var iso = ccIso(+y, m, d), x = hm[iso], wk = sh ? ccDayK(sh, iso) : 'f';
        var cls = x ? 'k-' + (x.k === 'doi' ? 'bu' : x.k) : wk === 'o' ? 'k-o' : wk === 'h' ? 'k-h' : '';
        h += '<span class="' + cls + (iso === td ? ' today' : '') + '" title="' + esc(HR.vnDate(iso) + (x ? ' · ' + x.t : '')) + '">' + d + '</span>';
      }
      h += '</div></div>';
    }
    return h + '</div></div>';
  }
  ACTS['tlcc-y'] = function (a, id) { PS.tlcc.y = id; render(); };
  ACTS['tlcc-hopt'] = function (a, id) {
    var u = tlccUnit(), s = ccOf(u), y = PS.tlcc.y, kv = id.split(':'), H = s.hol[y] || (s.hol[y] = { opt: { tet: '2+3', qk: '1/9', vh: false }, days: [] });
    H.opt[kv[0]] = kv[1]; holRebuild(s, y); ccSave(u, 'lịch lễ ' + y + ': ' + kv[0] + ' = ' + kv[1]); toast('Đã cập nhật lịch nghỉ năm ' + y, 'ok'); render();
  };
  function holRebuild(s, y) { var H = s.hol[y], keep = (H.days || []).filter(function (x) { return x.m; }), auto = holBuild(y, H.opt, s), have = {}; keep.forEach(function (x) { have[x.d] = 1; }); H.days = auto.filter(function (x) { return !have[x.d]; }).concat(keep).sort(function (p, q) { return p.d < q.d ? -1 : 1; }); }
  ACTS['tlcc-hbuild'] = function () {
    var u = tlccUnit(), s = ccOf(u), y = PS.tlcc.y, H = s.hol[y] || (s.hol[y] = { opt: { tet: '2+3', qk: '1/9', vh: false }, days: [] }), vh = $('#hVh');
    if (vh) H.opt.vh = vh.checked; holRebuild(s, y); ccSave(u, 'tạo lịch lễ ' + y); toast('Đã tạo lịch nghỉ năm ' + y, 'ok', 'Nhớ thông báo cho người lao động trước ít nhất 30 ngày.'); render();
  };
  ACTS['tlcc-hdel'] = function (a, id) { var u = tlccUnit(), s = ccOf(u), y = PS.tlcc.y, H = s.hol[y]; if (!H) return; var x = H.days.splice(+id, 1)[0]; ccSave(u, 'xóa ngày ' + (x && x.d)); toast('Đã xóa ngày ' + HR.vnDate(x.d), 'ok'); render(); };
  ACTS['tlcc-hadd'] = function () {
    var u = tlccUnit(), s = ccOf(u), y = PS.tlcc.y, v = $('#hD').value.trim(), mm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v), k = $('#hK').value, t = $('#hT').value.trim();
    if (!mm) { toast('Nhập ngày dạng dd/mm/yyyy', 'err'); $('#hD').focus(); return; }
    var iso = ccIso(+mm[3], +mm[2], +mm[1]); if (HR.vnDate(iso) !== p2(+mm[1]) + '/' + p2(+mm[2]) + '/' + mm[3]) { toast('Ngày không có thật', 'err'); return; }
    if (iso.slice(0, 4) !== y) { toast('Ngày phải thuộc năm ' + y, 'err'); return; }
    var H = s.hol[y] || (s.hol[y] = { opt: { tet: '2+3', qk: '1/9', vh: false }, days: [] });
    if (H.days.some(function (x) { return x.d === iso; })) { toast('Ngày ' + v + ' đã có trong lịch', 'err'); return; }
    H.days.push({ d: iso, t: t || CC_HOLK[k], k: k, m: 1 }); H.days.sort(function (p, q) { return p.d < q.d ? -1 : 1; });
    ccSave(u, 'thêm ngày ' + iso + ' (' + k + ')'); toast('Đã thêm ' + CC_HOLK[k].toLowerCase() + ' ' + v, 'ok'); render();
  };

  /* ----- Chép thiết lập sang công ty khác ----- */
  ACTS['tlcc-copy'] = function () {
    var u = tlccUnit(), others = S.units.filter(function (x) { return x !== u; }); if (!others.length) return;
    var m = modal('Chép thiết lập chấm công', 'Từ ' + shortUnit(u.name), '<p>Chép ca làm việc, quy định tính công, ký hiệu công và lịch nghỉ lễ sang:</p><div class="tl-depts">' + others.map(function (x) { return '<label class="radio"><input type="checkbox" data-cu="' + x.id + '" checked> ' + esc(x.name) + (x.ccset ? ' <span class="faint">(đã có thiết lập riêng – sẽ bị thay)</span>' : '') + '</label>'; }).join('') + '</div><p class="faint" style="font-size:12.5px">Phân công ca theo phòng ban không chép (mỗi công ty phòng ban khác nhau).</p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="cpOk">Chép</button></div>', true);
    $('#cpOk', m).addEventListener('click', function () {
      var src = clone(ccOf(u)), n = 0; src.deptShift = {};
      $$('[data-cu]', m).forEach(function (c) { if (!c.checked) return; var t = S.units.filter(function (x) { return x.id === c.getAttribute('data-cu'); })[0]; if (!t) return; t.ccset = clone(src); t._ccDraft = null; ccSave(t, 'chép thiết lập từ ' + u.name); n++; });
      m.close(); if (n) toast('Đã chép sang ' + n + ' công ty', 'ok'); render();
    });
  };

  BINDS.thietlapcc = function () {
    var u = tlccUnit(); if (!u || !$('#tlArea')) return; var s = ccOf(u);
    $$('[data-qk]').forEach(function (el) { el.addEventListener('change', function () { var k = el.getAttribute('data-qk'), v = +el.value; if (isNaN(v) || v < 0) { el.value = s.rule[k]; toast('Giá trị chưa đúng', 'err'); return; } if (k === 'halfH' && v > +s.rule.fullH) { el.value = s.rule[k]; toast('Mức nửa công phải nhỏ hơn mức đủ công', 'err'); return; } s.rule[k] = v; ccSave(u, k + ' = ' + v); toast('Đã lưu', 'ok'); tlccTry(u, s); }); });
    $$('[data-qr]').forEach(function (el) { el.addEventListener('change', function () { if (!el.checked) return; s.rule[el.getAttribute('data-qr')] = el.value; ccSave(u, el.getAttribute('data-qr') + ' = ' + el.value); toast('Đã lưu', 'ok'); tlccTry(u, s); }); });
    $$('[data-qc]').forEach(function (el) { el.addEventListener('change', function () { s.rule[el.getAttribute('data-qc')] = el.checked; ccSave(u, el.getAttribute('data-qc') + ' = ' + el.checked); toast('Đã lưu', 'ok'); tlccTry(u, s); }); });
    ['tCa', 'tDay', 'tIn', 'tOut'].forEach(function (k) { var el = $('#' + k); if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { tlccTry(u, s); }); });
    tlccTry(u, s);
    $$('tr[data-ci] [data-cf]').forEach(function (el) {
      el.addEventListener('change', function () {
        var x = s.codes[+el.closest('tr').getAttribute('data-ci')], k = el.getAttribute('data-cf'); if (!x) return;
        if (k === 't') { if (!el.value.trim()) { el.value = x.t; return; } x.t = el.value.trim(); } else if (k === 'don') x.don = el.checked ? 1 : 0; else if (k === 'w') x.w = +el.value; else x.type = el.value;
        ccSave(u, 'ký hiệu ' + x.k + ': ' + k); toast('Đã lưu ký hiệu ' + x.k, 'ok', 'Số liệu chấm công, cảnh báo tính lại theo ký hiệu mới.'); if (k === 'type') render();
      });
    });
    $$('[data-ed]').forEach(function (el) { el.addEventListener('change', function () { var d = el.getAttribute('data-ed'), k = el.getAttribute('data-ef'), x = s.exc.dept[d] || (s.exc.dept[d] = {}); x[k] = el.checked ? 1 : 0; if (!x.nc && !x.no) delete s.exc.dept[d]; ccSave(u, 'ngoại lệ phòng ' + d + ' ' + k + ' = ' + el.checked); toast('Đã lưu', 'ok'); render(); }); });
    $$('[data-ee]').forEach(function (el) { el.addEventListener('change', function () { var id = el.getAttribute('data-ee'), x = s.exc.emp[id]; if (!x) return; x[el.getAttribute('data-ef')] = el.checked ? 1 : 0; if (!x.nc && !x.no) delete s.exc.emp[id]; ccSave(u, 'ngoại lệ ' + id); toast('Đã lưu', 'ok'); render(); }); });
    var tw = $('#tWho'); if (tw) tw.addEventListener('change', function () { var e = ccActive(u).filter(function (x) { return x['Mã NV'] === tw.value; })[0]; if (e) { var sh = ccShiftOf(s, e['Phòng ban']); if (sh) $('#tCa').value = sh.id; } tlccTry(u, s); });
    var hd = $('#hD'); if (hd && typeof bindDateInput === 'function') bindDateInput(hd);
    var vh = $('#hVh'); if (vh) vh.addEventListener('change', function () { var y = PS.tlcc.y, H = s.hol[y] || (s.hol[y] = { opt: { tet: '2+3', qk: '1/9', vh: false }, days: [] }); H.opt.vh = vh.checked; holRebuild(s, y); ccSave(u, 'lịch lễ ' + y + ': 24/11 = ' + vh.checked); toast(vh.checked ? 'Đã thêm 24/11 vào lịch nghỉ' : 'Đã bỏ 24/11 khỏi lịch nghỉ', 'ok'); render(); });
  };
