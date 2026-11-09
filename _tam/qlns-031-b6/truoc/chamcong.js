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
      rule: { lateGrace: 0, earlyGrace: 0, halfBy: 'late', halfLate: 120, halfEarly: 120, fullH: 7, halfH: 3.5, miss: 'wait', otAfter: 30, otBlock: 30, restIsOt: c.sundayIsOt !== false, lateTimes: c.lateTimes || 3, otMode: 'auto', editReason: true, editAfterLock: true, otRateN: 150, otRateR: 200, otRateH: 300 },
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
  function ccNorm(s) { var R = s.rule; if (R.otMode == null) R.otMode = 'auto'; if (R.editReason == null) R.editReason = true; if (R.editAfterLock == null) R.editAfterLock = true; if (R.otRateN == null) R.otRateN = 150; if (R.otRateR == null) R.otRateR = 200; if (R.otRateH == null) R.otRateH = 300; if (!s.exc) s.exc = { dept: {}, emp: {} }; s.exc.dept = s.exc.dept || {}; s.exc.emp = s.exc.emp || {}; return s; }
  function ccOf(u) { if (!u.ccset) u._ccDraft = u._ccDraft || ccDefault(u); return ccNorm(u.ccset || u._ccDraft); }
  // ngoại lệ của 1 người: nc = không cần chấm công (tính đủ công) · no = không tính tăng ca; đặt theo người ưu tiên hơn theo phòng ban
  function ccExc(s, id, dept) { var e = (s.exc && s.exc.emp || {})[id], d = (s.exc && s.exc.dept || {})[dept] || {}; if (e) return { nc: !!e.nc, no: !!e.no, src: 'người' }; return { nc: !!d.nc, no: !!d.no, src: d.nc || d.no ? 'phòng ban' : '' }; }
  function ccSave(u, msg) {
    if (!u.ccset) { u.ccset = u._ccDraft || ccDefault(u); u._ccDraft = null; }
    u.ccset.at = nowVn(); u.ver = (u.ver || 0) + 1; saveUnits(); log('Thiết lập chấm công (' + u.name + '): ' + msg);
  }
  // Cài đặt chung + thiết lập riêng của công ty (chưa thiết lập → Cài đặt chung, giữ nguyên số liệu như trước)
  function cfgFor(u) {
    var c = cfg(); if (!u) return c;
    var s = ccOf(u), // 07/11 15:30: luôn theo thiết lập (thiết lập gợi ý lấy từ Cài đặt chung) – để ký hiệu X/2, hệ số công tính đúng
       o = Object.assign({}, c), pick = function (f) { return s.codes.filter(f).map(function (x) { return x.k; }).join(', '); };
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
    var R = s.rule, i = shiftInfo(sh), o = { cong: 0, late: 0, early: 0, ot: 0, otRaw: 0, otWait: false, otRate: 0, otPay: 0, kind: kind, worked: 0, code: '', note: [] }; who = who || {};
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
      var all = Math.max(0, to - ti), brk2 = i.ba !== null ? Math.max(0, Math.min(to, i.bb) - Math.max(ti, i.ba)) : 0; all -= brk2; if (brk2) o.note.push('Đã trừ ' + brk2 + ' phút nghỉ giữa ca');
      o.ot = R.restIsOt || kind === 'hol' ? Math.floor(all / (+R.otBlock || 1)) * (+R.otBlock || 1) / 60 : 0;
      o.code = 'X'; o.note.push(kind === 'hol' ? 'Đi làm ngày lễ, tết: toàn bộ giờ tính làm thêm, trả ' + R.otRateH + '% (luật: ít nhất 300%). Ngày lễ vẫn được hưởng nguyên lương như ngày nghỉ – người hưởng lương ngày được trả thêm lương ngày lễ (Điều 98)' : R.restIsOt ? 'Đi làm ngày nghỉ hằng tuần: tính làm thêm, trả ' + R.otRateR + '% (luật: ít nhất 200%, Điều 98)' : 'Đi làm ngày nghỉ hằng tuần: tính công như ngày thường');
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
    if (o.ot) o.note.push('Làm thêm sau giờ ra ' + ccNum(o.ot) + ' giờ, trả ' + R.otRateN + '% – cần người lao động đồng ý (Điều 107)');
    o.code = o.cong === full ? (full === 1 ? 'X' : 'X/2') : o.cong > 0 ? 'X/2' : 'KP?';
    if (o.code === 'KP?') o.note.push('Không đủ giờ tính công – xem lại có đơn nghỉ không');
    return ccOtFinal(o, R, who);
  }
  // Điều 98 BLLĐ 2019: làm thêm ngày thường ≥ 150% · ngày nghỉ hằng tuần ≥ 200% · ngày lễ, tết, nghỉ có hưởng lương ≥ 300% (chưa kể lương ngày lễ với người hưởng lương ngày)
  var CC_OT_MIN = { otRateN: 150, otRateR: 200, otRateH: 300 };
  function ccOtFinal(o, R, who) {
    o.otRaw = o.ot; if (!o.otRaw) return o;
    o.otRate = o.kind === 'hol' ? +R.otRateH : o.kind === 'rest' ? +R.otRateR : +R.otRateN; o.otPay = o.otRaw * o.otRate / 100;
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
      (function () {
        // Phạm vi áp dụng (góp ý anh 07/11 14:44: ô "Ca mặc định" bị khóa mà vẫn cho tích phòng ban – khó hiểu)
        // · ca đang là mặc định: chỉ giải thích, không hiện danh sách phòng ban (ca mặc định đã áp cho mọi phòng chưa gán ca khác)
        // · ca khác: chọn 1 trong 2 – Đặt làm ca mặc định / Chỉ áp dụng cho các phòng ban chọn
        var others = dps.filter(function (d) { var c = (s.deptShift || {})[d]; return c && c !== s.def; });
        if (!isNew && sh.id === s.def) return '<div class="field"><label>Phạm vi áp dụng</label><div class="tl-scope"><b>Đây là ca mặc định</b> – áp dụng cho mọi người' + (others.length ? ', trừ phòng ban đã gán ca khác: ' + esc(others.map(function (d) { return d + ' (' + s.deptShift[d] + ')'; }).join(', ')) : '') + '.<small>Mỗi công ty luôn có 1 ca mặc định nên không bỏ chọn ở đây được. Muốn đổi: mở ca khác → chọn <b>Đặt làm ca mặc định</b>.</small></div></div>';
        var asDef = false;
        return '<div class="field"><label>Phạm vi áp dụng</label><div class="tl-rad col tl-scope2">' +
          '<label class="tl-ro"><input type="radio" name="sScope" value="dept" checked><span><b>Chỉ áp dụng cho các phòng ban chọn dưới đây</b></span></label>' +
          (dps.length ? '<div class="tl-depts" id="sDps">' + dps.map(function (d) { var cur = (s.deptShift || {})[d]; return '<label class="radio"><input type="checkbox" data-dp="' + esc(d) + '"' + (cur && cur === sh.id ? ' checked' : '') + '> ' + esc(d) + (cur && cur !== sh.id ? ' <span class="faint">(đang ở ca ' + esc(cur) + ')</span>' : !cur ? ' <span class="faint">(đang theo ca mặc định)</span>' : '') + '</label>'; }).join('') + '</div>' : '<p class="faint">Chưa có danh mục phòng ban.</p>') +
          '<label class="tl-ro"><input type="radio" name="sScope" value="def"' + (asDef ? ' checked' : '') + '><span><b>Đặt làm ca mặc định</b> – áp dụng cho mọi người, trừ phòng ban gán ca khác. Ca <b>' + esc(s.def) + '</b> sẽ thôi là ca mặc định</span></label></div></div>';
      })() +
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
    var syncScope = function () { var sc = $('input[name="sScope"]:checked', m), box = $('#sDps', m); if (!sc || !box) return; var off = sc.value === 'def'; box.classList.toggle('off', off); $$('[data-dp]', box).forEach(function (c) { c.disabled = off; }); };
    $$('input[name="sScope"]', m).forEach(function (r) { r.addEventListener('change', syncScope); }); syncScope();
    $$('input', m).forEach(function (x) { x.addEventListener('input', function () { $('#shMsg', m).textContent = ''; }); });
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
      s.deptShift = s.deptShift || {};
      var scope = $('input[name="sScope"]:checked', m);
      if (scope && scope.value === 'def') { s.def = nid; Object.keys(s.deptShift).forEach(function (d) { if (s.deptShift[d] === nid) delete s.deptShift[d]; }); }
      else if (scope) $$('[data-dp]', m).forEach(function (c) { var d = c.getAttribute('data-dp'); if (c.checked) s.deptShift[d] = nid; else if (s.deptShift[d] === nid) delete s.deptShift[d]; });
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
      n('otRateN', 'Mức trả – ngày thường', '%', 'Luật: ít nhất 150%') + n('otRateR', 'Mức trả – ngày nghỉ hằng tuần', '%', 'Luật: ít nhất 200%') + n('otRateH', 'Mức trả – ngày lễ, tết, nghỉ có hưởng lương', '%', 'Luật: ít nhất 300%, chưa kể lương ngày lễ với người hưởng lương ngày') +
      n('otAfter', 'Tính làm thêm khi ra sau giờ ra từ', 'phút') + '<div class="tl-q"><label for="q_otBlock">Làm tròn xuống theo</label><span class="tl-qi"><select class="input" id="q_otBlock" data-qk="otBlock">' + [15, 30, 60].map(function (v) { return opt(v, v + ' phút', R.otBlock); }).join('') + '</select></span></div></div>' +
      '<div class="tl-rad col tl-otm"><span class="vc-lbl">Khi giờ làm vượt giờ ra theo ca</span>' + rad('otMode', 'auto', '<b>Mặc định tính tăng ca</b> – tự cộng giờ vượt quá theo thiết lập trên') + rad('otMode', 'confirm', '<b>Không mặc định tính</b> – vẫn hiện giờ làm thêm, chỉ tính khi người quản lý bấm <b>Xác nhận</b>; không bấm thì không tính') + '</div>' +
      '<p class="faint" style="font-size:12.5px;margin:10px 0 0">Đi làm ngày nghỉ hằng tuần, ngày lễ tết: tính theo giờ làm thực tế, <b>trừ thời gian nghỉ giữa ca</b> của ca làm việc.</p>' +
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
    box.innerHTML = '<div class="tl-res-k"><div><span>Ký hiệu</span><b><span class="code ' + (code ? CC_TYPE_CLS[code.type] : '') + '">' + esc(r.code || '–') + '</span></b></div><div><span>Ngày công</span><b>' + ccNum(r.cong) + '</b></div><div><span>Giờ làm trong ca</span><b>' + ccNum(r.worked) + '</b></div><div><span>Đi muộn</span><b>' + (r.late ? r.late + ' phút' : '–') + '</b></div><div><span>Về sớm</span><b>' + (r.early ? r.early + ' phút' : '–') + '</b></div><div><span>Làm thêm</span><b>' + (r.otRaw ? ccNum(r.otRaw) + ' giờ' + (r.otWait ? '<small class="tl-ow">chờ xác nhận</small>' : !r.ot ? '<small class="tl-ow no">không tính</small>' : '<small class="tl-ow ok">× ' + r.otRate + '% = ' + ccNum(r.otPay) + ' giờ lương</small>') : '–') + '</b></div></div>' +
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
      '<div class="notice" style="margin-top:14px">' + ic('appnv') + '<div><b>Vẫn được cấp tài khoản nhân viên</b> (Danh sách nhân sự → Tài khoản) như mọi người: dùng để xem công, phiếu lương, gửi đơn nghỉ và các thông tin khác. Người không cần chấm công chỉ là <b>không bắt buộc</b> bấm Vào ca / Ra ca – nếu có bấm, lượt chấm vẫn được ghi để tham khảo, không làm thay đổi ngày công.</div></div>' +
      '<div class="notice warn" style="margin-top:10px">' + ic('info') + '<div><b>Không cần chấm công:</b> phần mềm tự tính đủ công các ngày làm việc theo ca, không xét đi muộn – về sớm; ngày nghỉ có đơn (phép, ốm, không lương…) vẫn trừ theo đơn. Không có ngày nghỉ trừ lương thì tính đủ lương.<br>' +
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
    $$('[data-qk]').forEach(function (el) { el.addEventListener('change', function () { var k = el.getAttribute('data-qk'), v = +el.value; if (isNaN(v) || v < 0) { el.value = s.rule[k]; toast('Giá trị chưa đúng', 'err'); return; } if (CC_OT_MIN[k] && v < CC_OT_MIN[k]) { el.value = s.rule[k]; toast('Không thấp hơn ' + CC_OT_MIN[k] + '% theo Điều 98 BLLĐ 2019', 'err'); return; } if (k === 'halfH' && v > +s.rule.fullH) { el.value = s.rule[k]; toast('Mức nửa công phải nhỏ hơn mức đủ công', 'err'); return; } s.rule[k] = v; ccSave(u, k + ' = ' + v); toast('Đã lưu', 'ok'); tlccTry(u, s); }); });
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

  /* =====================================================================
     BƯỚC 2/4 – TỔNG HỢP CÔNG (anh duyệt bước 1 lúc 14:57 07/11/2026)
       Bảng công tháng ghép 4 nguồn, ưu tiên: SỬA TAY → ĐƠN NGHỈ ĐÃ DUYỆT → GIỜ CHẤM (tính theo Thiết lập) → KÝ HIỆU TRONG FILE
       + lịch lễ tết, ngày nghỉ tuần, ca theo phòng ban, ngoại lệ (miễn chấm công / không tính tăng ca), tăng ca chờ xác nhận
       Lưu trong đơn vị: u.ccx = { m: {ym: {'ID|dd': ô sửa tay}}, ok: {ym: {'ID|dd': xác nhận tăng ca}}, lock: {ym: chốt công}, log: [nhật ký sửa], v }
     ===================================================================== */
  var BC_LEAVE = [[/thai sản/i, 'TS'], [/ốm|bệnh/i, 'Ô'], [/không lương/i, 'KL'], [/việc riêng|kết hôn|cưới|tang|hiếu|hỷ/i, 'R'], [/phép/i, 'P']];
  var BC_ISSUE = { 'don-cho': 'Có đơn nghỉ chờ duyệt', vang: 'Vắng chưa rõ lý do', 'thieu-cham': 'Thiếu lượt chấm', 'thieu-don': 'Thiếu đơn nghỉ', 'ky-hieu-la': 'Ký hiệu chưa khai báo', 'khong-du': 'Không đủ giờ tính công' };
  var BC_DAYK = { work: 'Ngày làm việc', half: 'Làm buổi sáng', rest: 'Nghỉ hằng tuần', hol: 'Nghỉ lễ, tết' };
  function bcX(u) { var x = u.ccx || (u.ccx = {}); x.m = x.m || {}; x.ok = x.ok || {}; x.lock = x.lock || {}; x.log = x.log || []; x.v = x.v || 0; return x; }
  function bcCode(s, k) { k = String(k || '').toUpperCase(); return s.codes.filter(function (c) { return String(c.k).toUpperCase() === k; })[0]; }
  function bcDays(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7), n = new Date(Date.UTC(y, m, 0)).getUTCDate(), a = []; for (var d = 1; d <= n; d++) a.push(ccIso(y, m, d)); return a; }
  // Người sửa / người chốt: lấy theo tài khoản đang dùng phần mềm (anh chốt 07/11 15:15). Chưa có Phân quyền → chủ tài khoản 'Quản trị viên'.
  function ccUser() { return (S.settings.user && S.settings.user.name) || 'Quản trị viên'; }
  function bcEditor() { return ccUser(); }
  function bcWho() { return '<p class="bc-who">' + ic('nv', 14) + 'Thực hiện bởi tài khoản đang dùng: <b>' + esc(ccUser()) + '</b></p>'; }
  function bcSaveX(u, msg) { var x = bcX(u); x.v++; u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) log('Tổng hợp công (' + u.name + '): ' + msg); }

  // Loại ngày của 1 người vào ngày iso: hol (lễ, tết, nghỉ bù) · rest (nghỉ tuần, nghỉ hoán đổi) · work · half
  function bcKind(s, sh, iso) {
    var h = holMap(s, iso.slice(0, 4))[iso];
    if (h) { if (h.k === 'le' || h.k === 'bu') return { k: 'hol', h: h }; if (h.k === 'doi') return { k: 'rest', h: h }; if (h.k === 'lb') return { k: 'work', h: h }; }
    var dk = ccDayK(sh, iso); return { k: dk === 'f' ? 'work' : dk === 'h' ? 'half' : 'rest', h: null };
  }
  // Áp loại ký hiệu vào ô: ngày công, nghỉ hưởng lương, BHXH, không lương
  function bcApplyCode(s, c) {
    var d = bcCode(s, c.k); c.type = d ? d.type : (c.k ? 'other' : ''); c.paid = c.bh = c.unpaid = 0;
    if (!c.k || c.k === '?') return;
    var w = d ? +d.w : 0;
    if (c.type === 'work') { if (c.cong == null) c.cong = c.kind === 'half' ? Math.min(w, 0.5) : w; }
    else { c.cong = 0; if (c.type === 'paid' || c.type === 'hol') c.paid = c.kind === 'half' ? Math.min(w, 0.5) : w; else if (c.type === 'bh') c.bh = 1; else if (c.type === 'unpaid') c.unpaid = 1; }
  }
  // Tính cả tháng của 1 công ty (có bộ nhớ đệm)
  function bcMonth(u, ym) {
    var s = ccOf(u), x = bcX(u), SG = bcSynEnd(u), key = ym + '|' + (u.ver || 0) + '|' + (u.ccset ? u.ccset.at : '') + '|' + x.v + '|' + refDate() + '|' + SG;
    u._bc = u._bc || {}; if (u._bc[ym] && u._bc[ym].key === key) return u._bc[ym];
    var R = s.rule, days = bcDays(ym), first = days[0], last = days[days.length - 1], rows = (u.data.CC || {})[ym] || [], byKey = {}, dataEnd = '';
    rows.forEach(function (r) { var d = String(r['Ngày'] || '').slice(0, 10); if (!d || !r['Mã NV']) return; byKey[r['Mã NV'] + '|' + d] = r; if (d > dataEnd) dataEnd = d; });
    if (SG && SG >= first && SAMPLE_REF < last) { var sgE = SG < last ? SG : last; if (sgE > dataEnd) dataEnd = sgE; } // 0.3.1: dữ liệu mẫu tự sinh lượt chấm từ sau ngày chốt mẫu đến hôm nay
    var WM = wfMap(u, ym); Object.keys(WM).forEach(function (k) { if (WM[k].iso > dataEnd) dataEnd = WM[k].iso; }); // bước 4: lượt chấm trên điện thoại (máy chủ chấm công)
    var pend = {}; (u.data.DON || []).forEach(function (d) { if (d['Trạng thái'] === 'Chờ duyệt' && d['Từ ngày']) (pend[d['Mã NV']] = pend[d['Mã NV']] || []).push({ from: String(d['Từ ngày']).slice(0, 10), to: String(d['Đến ngày'] || d['Từ ngày']).slice(0, 10), t: d['Loại nghỉ'], so: d['Số đơn'] }); });
    var dons = {}; (u.data.DON || []).forEach(function (d) { if (d['Trạng thái'] !== 'Đã duyệt' || !d['Từ ngày']) return; var t = String(d['Loại nghỉ'] || ''), code = 'P'; BC_LEAVE.some(function (b) { if (b[0].test(t)) { code = b[1]; return true; } }); (dons[d['Mã NV']] = dons[d['Mã NV']] || []).push({ from: String(d['Từ ngày']).slice(0, 10), to: String(d['Đến ngày'] || d['Từ ngày']).slice(0, 10), code: code, so: d['Số đơn'], t: t }); });
    var ppl = [], seen = {};
    (u.data.NV || []).forEach(function (e) {
      var id = e['Mã NV'], j = String(e['Ngày vào làm'] || '').slice(0, 10), l = String(e['Ngày nghỉ việc'] || '').slice(0, 10); if (!id) return;
      if ((j && j > last) || (l && l < first)) return; seen[id] = 1; ppl.push({ id: id, name: e['Họ và tên'] || id, dept: e['Phòng ban'] || '', e: e, join: j, left: l });
    });
    rows.forEach(function (r) { var id = r['Mã NV']; if (id && !seen[id]) { seen[id] = 1; ppl.push({ id: id, name: r['Họ và tên'] || id, dept: r['Phòng ban'] || '', e: null, join: '', left: '', orphan: true }); } });
    var M = x.m[ym] || {}, OK = x.ok[ym] || {}, lock = x.lock[ym];
    ppl.forEach(function (p) {
      p.sh = ccShiftOf(s, p.dept); p.exc = ccExc(s, p.id, p.dept); p.days = {};
      var S0 = p.sum = { work: 0, paid: 0, hol: 0, bh: 0, unpaid: 0, vang: 0, issues: 0, late: 0, lateMin: 0, early: 0, otN: 0, otR: 0, otH: 0, otPay: 0, otWait: 0, otNo: 0, manual: 0, std: 0, fileOt: 0, codes: {} };
      days.forEach(function (iso) {
        var dd = iso.slice(8, 10), K = bcKind(s, p.sh, iso), c = { iso: iso, dd: dd, kind: K.k, hol: K.h, k: '', cong: null, tin: '', tout: '', late: 0, early: 0, otRaw: 0, ot: 0, otWait: false, otOk: false, src: '', issue: '', note: [], file: null, don: null };
        if ((p.join && iso < p.join) || (p.left && iso > p.left)) { c.src = 'out'; p.days[dd] = c; return; }
        if (c.kind === 'work') S0.std += 1; else if (c.kind === 'half') S0.std += 0.5;
        var fr = byKey[p.id + '|' + iso], dn = (dons[p.id] || []).filter(function (d) { return d.from <= iso && iso <= d.to; })[0];
        if (!fr && !dn && SG && iso > SAMPLE_REF && iso <= SG && !p.exc.nc && !WM[p.id + '|' + iso] && (c.kind === 'work' || c.kind === 'half')) fr = bcSynRow(p, iso, c.kind);
        var wp = WM[p.id + '|' + iso]; if (wp) { var fk0 = fr ? String(fr['Ký hiệu'] || '').trim().toUpperCase() : '', d0 = bcCode(s, fk0); if (!fr || !fk0 || (d0 && d0.type === 'work')) fr = Object.assign({}, fr || {}, { 'Giờ vào': wp.tin, 'Giờ ra': wp.tout, 'Ký hiệu': fk0, 'Giờ tăng ca': '', 'Đi muộn (phút)': '', 'Ghi chú': 'Chấm trên điện thoại (' + Object.keys(wp.cach).map(function (k) { return WF_CACH[k] || k; }).join(', ') + ')' }); c.wifi = wp; }
        if (fr) { c.file = { k: String(fr['Ký hiệu'] || '').trim().toUpperCase(), tin: fr['Giờ vào'] || '', tout: fr['Giờ ra'] || '', ot: +fr['Giờ tăng ca'] || 0, late: +fr['Đi muộn (phút)'] || 0, note: fr['Ghi chú'] || '' }; S0.fileOt += c.file.ot; }
        c.don = dn || null;
        var workDay = c.kind === 'work' || c.kind === 'half';
        if (p.exc.nc) {
          if (dn && workDay) { c.k = dn.code; c.src = 'don'; }
          else if (c.kind === 'hol') { c.k = 'L'; c.src = 'le'; }
          else if (workDay) { c.k = c.kind === 'half' ? 'X/2' : 'X'; c.cong = c.kind === 'half' ? 0.5 : 1; c.src = 'auto'; c.note.push('Không cần chấm công – tự tính đủ công'); }
        } else if (fr) {
          var fk = c.file.k, def = bcCode(s, fk), hasT = ccMin(c.file.tin) !== null || ccMin(c.file.tout) !== null;
          if (hasT && (!fk || !def || def.type === 'work')) {
            var r = ccCalcDay(s, p.sh, c.file.tin, c.file.tout, workDay ? 'work' : c.kind, c.kind === 'half' ? 'h' : 'f', p.exc);
            c.tin = c.file.tin; c.tout = c.file.tout; c.late = r.late; c.early = r.early; c.otRaw = r.otRaw || 0; c.ot = r.ot || 0; c.otWait = !!r.otWait; c.note = r.note.slice(); c.src = 'calc';
            if (r.code === '?') { c.k = '?'; c.issue = 'thieu-cham'; }
            else if (r.code === 'KP?') { c.k = 'KP'; c.issue = 'khong-du'; }
            else { c.k = workDay ? (fk && def && def.type === 'work' && fk !== 'X' && fk !== 'X/2' ? fk : r.code) : 'X'; c.cong = workDay ? r.cong : 0; }
          } else if (fk) { c.k = fk; c.src = 'file'; if (!def) c.issue = 'ky-hieu-la'; }
          else if (dn && workDay) { c.k = dn.code; c.src = 'don'; }
          if (dn && workDay && c.src !== 'don' && (!c.k || c.k === '?' || c.k === 'KP')) { c.k = dn.code; c.src = 'don'; c.issue = ''; c.cong = null; }
        } else if (dn && workDay) { c.k = dn.code; c.src = 'don'; }
        else if (c.kind === 'hol') { c.k = 'L'; c.src = 'le'; }
        else if (workDay && dataEnd && iso <= dataEnd) { c.k = '?'; c.issue = 'vang'; c.src = 'none'; }
        if (c.issue === 'vang') { var pd = (pend[p.id] || []).filter(function (d) { return d.from <= iso && iso <= d.to; })[0]; if (pd) { c.issue = 'don-cho'; c.pend = pd; c.note.push('Đơn ' + (pd.so || '') + ' (' + pd.t + ') đang chờ duyệt – duyệt ở trang Nghỉ phép'); } }
        // sửa tay – luôn được ưu tiên
        var key2 = p.id + '|' + dd, mm = M[key2];
        if (mm) { c.auto = { k: c.k, cong: c.cong, ot: c.otRaw, tin: c.tin, tout: c.tout }; c.k = mm.k; c.cong = mm.cong == null ? null : +mm.cong; c.tin = mm.tin || ''; c.tout = mm.tout || ''; c.late = +mm.late || 0; c.early = +mm.early || 0; c.otRaw = c.ot = +mm.ot || 0; c.otWait = false; c.issue = ''; c.src = 'tay'; c.manual = mm; S0.manual++; }
        else if (c.otWait && OK[key2]) { c.ot = c.otRaw; c.otWait = false; c.otOk = OK[key2]; }
        bcApplyCode(s, c);
        if (!c.issue && c.k && c.k !== '?') { var d2 = bcCode(s, c.k); if (d2 && d2.don && !dn && c.src !== 'tay') c.issue = 'thieu-don'; }
        c.otKind = c.kind === 'hol' ? 'H' : c.kind === 'rest' ? 'R' : 'N'; c.otRate = c.otKind === 'H' ? +R.otRateH : c.otKind === 'R' ? +R.otRateR : +R.otRateN;
        if (c.otRaw && !c.ot && !c.otWait) S0.otNo += c.otRaw;
        if (c.otWait) S0.otWait += c.otRaw;
        S0['ot' + c.otKind] += c.ot; S0.otPay += c.ot * c.otRate / 100;
        if (c.type === 'work') S0.work += c.cong || 0; S0.paid += c.type === 'paid' ? c.paid : 0; S0.hol += c.type === 'hol' ? c.paid : 0; S0.bh += c.bh; S0.unpaid += c.unpaid;
        if (c.late) { S0.late++; S0.lateMin += c.late; } if (c.early) S0.early++;
        if (c.issue) { S0.issues++; if (c.issue === 'vang') S0.vang++; }
        if (c.k) S0.codes[c.k] = (S0.codes[c.k] || 0) + 1;
        if (lock && c.manual && c.manual.after) c.after = true;
        p.days[dd] = c;
      });
      S0.salary = S0.work + S0.paid + S0.hol;
    });
    var res = { key: key, ym: ym, u: u, s: s, days: days, ppl: ppl, dataEnd: dataEnd, hasFile: rows.length > 0, lock: lock };
    u._bc[ym] = res; return res;
  }
  // 0.3.1: dữ liệu mẫu chỉ có file chấm công đến ngày chốt mẫu → tự sinh giờ vào/ra cho các ngày sau đó đến hôm nay (cố định theo mã NV + ngày, không ngẫu nhiên mỗi lần mở)
  function bcSynEnd(u) {
    if (!u || u.source !== 'sample') return ''; var t = HR.isoToday(), d = new Date();
    var end = d.getHours() >= 18 ? t : ccAdd(t, -1); return end > SAMPLE_REF ? end : '';
  }
  function bcHash(str) { var h = 7; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003; return h; }
  function bcSynRow(p, iso, kind) {
    var sh = p.sh || {}, h = bcHash(p.id + iso), a = ccMin(sh.inT || '08:00'), b = ccMin(kind === 'half' ? (sh.bFrom || '12:00') : (sh.outT || '17:00'));
    var tin = h % 17 === 0 ? a + 6 + h % 20 : a - 4 - h % 22, tout = b + 1 + (h >> 3) % 27; // ra trong 28 phút sau giờ tan → không phát sinh tăng ca giả
    return { 'Giờ vào': ccHM(tin), 'Giờ ra': ccHM(tout), 'Ký hiệu': '', 'Giờ tăng ca': '', 'Đi muộn (phút)': '', 'Ghi chú': 'Dữ liệu mẫu tự sinh (sau ngày chốt mẫu ' + HR.vnDate(SAMPLE_REF) + ')' };
  }
  function bcMonths() { var o = {}; selUnits().forEach(function (u) { Object.keys(u.data.CC || {}).forEach(function (m) { o[m] = 1; }); }); o[refDate().slice(0, 7)] = 1; return Object.keys(o).sort(); }
  function bcCellTxt(c) { return c.src === 'out' ? '' : (c.k || ''); }
  function bcNum(v) { return v ? ccNum(Math.round(v * 100) / 100) : '0'; }

  PAGES.cc = function () {
    if (!S.units.length) return pageHead('Tổng hợp công') + noData('dữ liệu chấm công');
    var ms = bcMonths(), f = ps('bc', { m: '', view: 'grid', q: '', dept: '', only: false });
    if (ms.indexOf(f.m) < 0) f.m = ms.filter(function (m) { return m <= refDate().slice(0, 7) && selUnits().some(function (u) { return (u.data.CC || {})[m]; }); }).pop() || ms[ms.length - 1];
    var us = selUnits(), res = us.map(function (u) { return bcMonth(u, f.m); }), T = { n: 0, work: 0, paid: 0, issues: 0, ot: 0, otWait: 0, manual: 0, otPay: 0 };
    res.forEach(function (r) { r.ppl.forEach(function (p) { T.n++; T.work += p.sum.work; T.paid += p.sum.paid + p.sum.hol; T.issues += p.sum.issues; T.ot += p.sum.otN + p.sum.otR + p.sum.otH; T.otWait += p.sum.otWait; T.manual += p.sum.manual; T.otPay += p.sum.otPay; }); });
    var lockBar = '<div class="bc-locks">' + res.map(function (r) {
      var L = r.lock; return '<div class="bc-lk' + (L ? ' on' : '') + '">' + ic(L ? 'check' : 'np', 16) + '<span>' + (isMulti() ? '<b>' + esc(shortUnit(r.u.name)) + '</b> · ' : '') + '<a class="bc-otm ' + (r.s.rule.otMode === 'confirm' ? 'cf' : '') + '" href="#thietlapcc" title="Đổi ở Thiết lập chấm công → Quy định tính công">Tăng ca: ' + (r.s.rule.otMode === 'confirm' ? 'chờ xác nhận mới tính' : 'mặc định tính') + '</a> ' + (L ? 'Đã chốt công tháng ' + HR.ymLabel(f.m) + ' <small>' + esc(L.by + ' · ' + L.at) + '</small>' + (function () { var df = bcLockDiff(r); return df.length ? ' <span class="tag tag-warn" title="' + esc(df.join(', ')) + '">Bảng công hiện khác lúc chốt: ' + df.length + ' người (sửa sau chốt hoặc đổi thiết lập)</span>' : ''; })() + (function () { var c = r.u.wf && r.u.wf.cong && r.u.wf.cong[f.m]; if (!c) return ''; var ks = Object.keys(c), ok = ks.filter(function (k) { return c[k].xn === 1; }).length, bad = ks.filter(function (k) { return c[k].xn === 2; }); return ' <span class="tag ' + (bad.length ? 'tag-bad' : ok === ks.length ? 'tag-ok' : 'tag-mute') + '" title="' + esc(bad.map(function (k) { return k + ': ' + (c[k].ph || ''); }).join(' | ')) + '">Nhân viên xác nhận ' + ok + '/' + ks.length + (bad.length ? ' · ' + bad.length + ' báo sai' : '') + '</span>'; })() : 'Tháng ' + HR.ymLabel(f.m) + ' đang mở – chưa chốt công') + '</span>' +
        (L ? '<button class="btn btn-sm" data-act="bc-unlock" data-id="' + r.u.id + '">Mở lại</button>' : '<button class="btn btn-sm btn-primary" data-act="bc-lock" data-id="' + r.u.id + '">Chốt công tháng</button>') + '</div>';
    }).join('') + '</div>';
    var src = res.some(function (r) { return r.hasFile; }) ? 'Dữ liệu chấm công đến ' + res.map(function (r) { return r.dataEnd ? HR.vnDate(r.dataEnd) : '–'; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') : 'Chưa có file chấm công tháng này – bảng chỉ hiện lịch làm việc, lễ tết, đơn nghỉ';
    var otMode = res.some(function (r) { return r.s.rule.otMode === 'confirm'; });
    return pageHead('Tổng hợp công', 'Tự tính theo <a href="#thietlapcc">Thiết lập chấm công</a> từng công ty · thứ tự ưu tiên: sửa tay → đơn nghỉ đã duyệt → giờ chấm → ký hiệu trong file · ' + esc(src)) +
      '<div class="filters card card-pad">' + selectBox('bM', 'Tháng', ms.slice().reverse().map(function (m) { return [m, 'Tháng ' + HR.ymLabel(m)]; }), f.m) + searchBox('bQ', f.q) +
      selectBox('bDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      '<div class="field"><label>Cách xem</label><div class="seg">' + [['grid', 'Bảng công'], ['sum', 'Tổng hợp'], ['ot', 'Tăng ca' + (T.otWait ? ' (' + ccNum(T.otWait) + 'h chờ)' : '')], ['issue', 'Cần xử lý' + (T.issues ? ' (' + T.issues + ')' : '')], ['log', 'Nhật ký sửa']].map(function (v) { return '<button class="' + (f.view === v[0] ? 'on' : '') + '" data-act="bc-view" data-id="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div></div></div>' +
      lockBar +
      '<div class="mini-kpis big"><div><span>Số người</span><b>' + T.n + '</b></div><div><span>Ngày công</span><b>' + bcNum(T.work) + '</b></div><div><span>Nghỉ hưởng lương (phép, lễ)</span><b>' + bcNum(T.paid) + '</b></div><div><span>Tăng ca được tính</span><b>' + (T.ot ? bcNum(T.ot) : 0) + ' giờ</b></div>' +
      (otMode || T.otWait ? '<div class="' + (T.otWait ? 'k-warn' : '') + '"><span>Tăng ca chờ xác nhận</span><b>' + (T.otWait ? bcNum(T.otWait) : 0) + ' giờ</b></div>' : '') + '<div class="' + (T.issues ? 'k-bad' : '') + '"><span>Ô cần xử lý</span><b>' + T.issues + '</b></div><div><span>Ô sửa tay</span><b>' + T.manual + '</b></div></div>' +
      '<div id="bArea"></div>';
  };
  ACTS['bc-view'] = function (a, id) { PS.bc.view = id; render(); };

  function bcRows() {
    var f = PS.bc, q = norm(f.q), out = [];
    selUnits().forEach(function (u) { bcMonth(u, f.m).ppl.forEach(function (p) { if ((!f.dept || p.dept === f.dept) && (!q || norm(p.id + ' ' + p.name).indexOf(q) >= 0)) out.push({ u: u, p: p, s: ccOf(u) }); }); });
    return out;
  }
  function bcGrid(rows) {
    var f = PS.bc, days = bcDays(f.m), s0 = rows.length ? rows[0].s : ccOf(selUnits()[0]), sh0 = ccShiftOf(s0, '');
    var head = '<tr><th class="bc-nm">Nhân sự</th>' + days.map(function (iso) { var K = bcKind(s0, sh0, iso); return '<th class="bc-d k-' + K.k + (iso === refDate() ? ' today' : '') + '" title="' + esc(HR.vnDate(iso) + ' · ' + ccDowT(iso) + (K.h ? ' · ' + K.h.t : '')) + '"><b>' + iso.slice(8, 10) + '</b><small>' + ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][ccDow(iso)] + '</small>' + (iso === refDate() ? '<em>' + (iso === HR.isoToday() ? 'Hôm nay' : 'Tính đến') + '</em>' : '') + '</th>'; }).join('') + '<th class="bc-t">Công</th><th class="bc-t">Nghỉ<br>hưởng lương</th><th class="bc-t">Tăng ca</th></tr>';
    var body = rows.map(function (x) {
      var p = x.p, S0 = p.sum;
      return '<tr><td class="bc-nm"><b>' + personLink(x.u, p.id, p.name) + '</b><small>' + esc(p.id + (isMulti() ? ' · ' + shortUnit(x.u.name) : '') + ' · ca ' + (p.sh ? p.sh.id : '')) + (p.exc.nc ? ' · <span class="bc-tag">miễn chấm công</span>' : p.exc.no ? ' · <span class="bc-tag">không tính tăng ca</span>' : '') + '</small></td>' +
        days.map(function (iso) {
          var c = p.days[iso.slice(8, 10)], cls = 'bc-c k-' + c.kind + (iso === refDate() ? ' today' : '') + (c.src === 'out' ? ' out' : '') + (c.type ? ' t-' + c.type : '') + (c.issue ? ' iss' : '') + (c.manual ? ' man' : '') + (c.otWait ? ' wait' : '') + (c.after ? ' aft' : '');
          var tip = HR.vnDate(c.iso) + ' · ' + BC_DAYK[c.kind] + (c.k ? ' · ' + c.k : '') + (c.tin || c.tout ? ' · ' + (c.tin || '?') + '–' + (c.tout || '?') : '') + (c.otRaw ? ' · tăng ca ' + ccNum(c.otRaw) + 'h' + (c.otWait ? ' chờ xác nhận' : !c.ot ? ' không tính' : '') : '') + (c.issue ? ' · ' + BC_ISSUE[c.issue] : '') + (c.manual ? ' · sửa tay' : '');
          return '<td class="' + cls + '">' + (c.src === 'out' ? '' : '<button type="button" data-act="bc-cell" data-id="' + x.u.id + '|' + esc(p.id) + '|' + c.dd + '" title="' + esc(tip) + '">' + esc(bcCellTxt(c) === '?' ? '?' : bcCellTxt(c)) + (c.otRaw ? '<i>' + ccNum(c.otRaw) + '</i>' : '') + '</button>') + '</td>';
        }).join('') + '<td class="bc-t"><b>' + ccNum(Math.round(S0.work * 100) / 100) + '</b><small>/' + ccNum(S0.std) + '</small></td><td class="bc-t">' + bcNum(S0.paid + S0.hol) + '</td><td class="bc-t">' + bcNum(S0.otN + S0.otR + S0.otH) + (S0.otWait ? '<small class="w">+' + ccNum(S0.otWait) + ' chờ</small>' : '') + '</td></tr>';
    }).join('');
    var codes = s0.codes.map(function (c) { return '<span><span class="code ' + (CC_TYPE_CLS[c.type] || '') + '">' + esc(c.k) + '</span>' + esc(c.t.replace(/\s*\(.*\)$/, '')) + '</span>'; }).join('');
    return '<div class="legend bc-leg">' + codes + '<span><span class="code bc-q">?</span>Cần xử lý</span><span><i class="bc-mk man"></i>Sửa tay</span><span><i class="bc-mk wait"></i>Tăng ca chờ xác nhận</span><span><i class="bc-mk hol"></i>Lễ, tết</span><span><i class="bc-mk rest"></i>Nghỉ hằng tuần</span></div>' +
      '<div class="bc-wrap"><table class="bc">' + '<thead>' + head + '</thead><tbody>' + (body || '<tr><td colspan="' + (days.length + 4) + '" class="muted">Không có người nào.</td></tr>') + '</tbody></table></div>' +
      '<div class="tb-foot"><span class="muted">Bấm vào ô để xem chi tiết, sửa tay' + (s0.rule.otMode === 'confirm' ? ', xác nhận tăng ca' : '') + '. Số nhỏ trong ô là giờ tăng ca.</span><button class="btn btn-sm" data-act="bc-export">' + ic('xuat') + 'Xuất bảng công Excel</button></div>';
  }
  ACTS['bc-export'] = function () {
    var f = PS.bc, rows = bcRows(), days = bcDays(f.m);
    var cols = (isMulti() ? [{ t: 'Đơn vị', f: function (x) { return x.u.name; } }] : []).concat([{ t: 'Mã NV', f: function (x) { return x.p.id; } }, { t: 'Họ và tên', f: function (x) { return x.p.name; } }, { t: 'Phòng ban', f: function (x) { return x.p.dept; } }, { t: 'Ca', f: function (x) { return x.p.sh ? x.p.sh.id : ''; } }])
      .concat(days.map(function (iso) { return { t: iso.slice(8, 10), f: function (x) { var c = x.p.days[iso.slice(8, 10)]; return c.src === 'out' ? '' : c.k + (c.otRaw ? ' +' + ccNum(c.otRaw) + 'h' : ''); } }; }))
      .concat([{ t: 'Công chuẩn', f: function (x) { return x.p.sum.std; } }, { t: 'Ngày công', f: function (x) { return x.p.sum.work; } }, { t: 'Nghỉ phép, việc riêng', f: function (x) { return x.p.sum.paid; } }, { t: 'Lễ, tết', f: function (x) { return x.p.sum.hol; } }, { t: 'Tổng công hưởng lương', f: function (x) { return x.p.sum.salary; } }, { t: 'BHXH (ốm, thai sản)', f: function (x) { return x.p.sum.bh; } }, { t: 'Không lương', f: function (x) { return x.p.sum.unpaid; } },
        { t: 'Tăng ca ngày thường (giờ)', f: function (x) { return x.p.sum.otN; } }, { t: 'Tăng ca nghỉ tuần (giờ)', f: function (x) { return x.p.sum.otR; } }, { t: 'Tăng ca lễ tết (giờ)', f: function (x) { return x.p.sum.otH; } }, { t: 'Tăng ca quy đổi (giờ lương)', f: function (x) { return Math.round(x.p.sum.otPay * 100) / 100; } }, { t: 'Tăng ca chờ xác nhận (giờ)', f: function (x) { return x.p.sum.otWait; } }]);
    exportRows('Bang cong ' + HR.ymLabel(f.m), cols, rows, 'Ký hiệu theo Thiết lập chấm công · "+2h" = giờ tăng ca');
  };
  function bcSum(rows) {
    var c = (isMulti() ? [{ t: 'Đơn vị', f: function (x) { return shortUnit(x.u.name); } }] : []).concat([
      { t: 'Mã NV', f: function (x) { return x.p.id; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.p.name; }, h: function (x) { return personLink(x.u, x.p.id, x.p.name); }, cls: 'nowrap' }, { t: 'Phòng ban', f: function (x) { return x.p.dept; } },
      { t: 'Công chuẩn', f: function (x) { return x.p.sum.std; }, r: 1, title: 'Số ngày làm việc theo ca trong tháng (trừ lễ tết, tính từ ngày vào làm)' },
      { t: 'Ngày công', f: function (x) { return x.p.sum.work; }, r: 1 }, { t: 'Nghỉ phép, việc riêng', f: function (x) { return x.p.sum.paid; }, r: 1 }, { t: 'Lễ, tết', f: function (x) { return x.p.sum.hol; }, r: 1 },
      { t: 'Công hưởng lương', f: function (x) { return x.p.sum.salary; }, r: 1, h: function (x) { return '<b>' + nfmt(x.p.sum.salary) + '</b>'; }, title: 'Ngày công + nghỉ phép, việc riêng có lương + lễ tết' },
      { t: 'BHXH', f: function (x) { return x.p.sum.bh; }, r: 1, title: 'Nghỉ ốm, thai sản – hưởng chế độ BHXH' }, { t: 'Không lương', f: function (x) { return x.p.sum.unpaid; }, r: 1 },
      { t: 'Đi muộn', f: function (x) { return x.p.sum.late; }, r: 1, h: function (x) { var n = x.p.sum.late; return n >= (+x.s.rule.lateTimes || 3) ? '<span class="tag tag-warn" title="' + x.p.sum.lateMin + ' phút">' + n + '</span>' : n ? n + '<small class="faint"> · ' + x.p.sum.lateMin + 'p</small>' : '0'; } }, { t: 'Về sớm', f: function (x) { return x.p.sum.early; }, r: 1 },
      { t: 'TC ngày thường', f: function (x) { return x.p.sum.otN; }, r: 1, title: 'Giờ tăng ca được tính · trả ' + (selUnits()[0] ? ccOf(selUnits()[0]).rule.otRateN : 150) + '%' }, { t: 'TC nghỉ tuần', f: function (x) { return x.p.sum.otR; }, r: 1 }, { t: 'TC lễ tết', f: function (x) { return x.p.sum.otH; }, r: 1 },
      { t: 'TC quy đổi', f: function (x) { return Math.round(x.p.sum.otPay * 100) / 100; }, r: 1, title: 'Giờ tăng ca × mức trả (150/200/300%) = số giờ lương' },
      { t: 'Chờ xác nhận', f: function (x) { return x.p.sum.otWait; }, r: 1, h: function (x) { return x.p.sum.otWait ? '<span class="tag tag-warn">' + nfmt(x.p.sum.otWait) + '</span>' : '<span class="faint">0</span>'; } },
      { t: 'TC theo file', f: function (x) { return x.p.sum.fileOt; }, r: 1, title: 'Giờ tăng ca ghi trong file chấm công – để đối chiếu với số tự tính' },
      { t: 'Cần xử lý', f: function (x) { return x.p.sum.issues; }, r: 1, h: function (x) { return x.p.sum.issues ? '<span class="tag tag-bad">' + x.p.sum.issues + '</span>' : '<span class="faint">0</span>'; } }, { t: 'Sửa tay', f: function (x) { return x.p.sum.manual; }, r: 1 }]);
    return table('bc-s', c, rows, { title: 'Tong hop cong ' + HR.ymLabel(PS.bc.m) });
  }
  function bcCellsOf(rows, fn) { var out = []; rows.forEach(function (x) { Object.keys(x.p.days).sort().forEach(function (dd) { var c = x.p.days[dd]; if (fn(c, x)) out.push({ u: x.u, p: x.p, s: x.s, c: c }); }); }); return out; }
  function bcOt(rows) {
    var list = bcCellsOf(rows, function (c) { return c.otRaw > 0; }), conf = rows.some(function (x) { return x.s.rule.otMode === 'confirm'; }), wait = list.filter(function (y) { return y.c.otWait; }).length;
    return (conf ? '<div class="notice" style="margin-bottom:12px">' + ic('info') + '<div>Công ty đang đặt <b>Không mặc định tính tăng ca</b>: giờ làm thêm chỉ được cộng khi bấm <b>Xác nhận</b>. Tích các dòng rồi bấm Xác nhận, hoặc bấm vào ô trên Bảng công.</div></div>' : '<div class="notice" style="margin-bottom:12px">' + ic('info') + '<div>Công ty đang đặt <b>Mặc định tính tăng ca</b>. Muốn duyệt từng lượt trước khi tính: Thiết lập chấm công → Quy định tính công → Làm thêm giờ.</div></div>') +
      (conf && wait ? '<div class="bc-otbar"><label class="tl-ro"><input type="checkbox" id="otAll"><span>Chọn tất cả ' + wait + ' lượt chờ xác nhận</span></label><button class="btn btn-primary btn-sm" data-act="bc-okmany">Xác nhận đã chọn</button></div>' : '') +
      table('bc-ot', (isMulti() ? [{ t: 'Đơn vị', f: function (y) { return shortUnit(y.u.name); } }] : []).concat([
        { t: '', nosort: 1, noExport: 1, f: function () { return ''; }, h: function (y) { return y.c.otWait ? '<input type="checkbox" class="ot-ck" data-k="' + y.u.id + '|' + esc(y.p.id) + '|' + y.c.dd + '" aria-label="Chọn">' : ''; } },
        { t: 'Ngày', f: function (y) { return y.c.iso; } }, { t: 'Thứ', f: function (y) { return ccDowT(y.c.iso); } }, { t: 'Loại ngày', f: function (y) { return BC_DAYK[y.c.kind]; } }, { t: 'Mã NV', f: function (y) { return y.p.id; }, mono: 1 }, { t: 'Họ và tên', f: function (y) { return y.p.name; }, h: function (y) { return personLink(y.u, y.p.id, y.p.name); } },
        { t: 'Giờ vào', f: function (y) { return y.c.tin; } }, { t: 'Giờ ra', f: function (y) { return y.c.tout; } }, { t: 'Giờ làm thêm', f: function (y) { return y.c.otRaw; }, r: 1 }, { t: 'Mức trả', f: function (y) { return y.c.otRate + '%'; }, r: 1 },
        { t: 'Trạng thái', f: function (y) { return y.c.otWait ? 'Chờ xác nhận' : y.c.ot ? (y.c.otOk ? 'Đã xác nhận' : y.c.manual ? 'Sửa tay' : 'Tự tính') : 'Không tính'; }, h: function (y) { var c = y.c; return c.otWait ? '<span class="tag tag-warn">Chờ xác nhận</span>' : c.ot ? '<span class="tag tag-ok">' + (c.otOk ? 'Đã xác nhận · ' + esc(c.otOk.by) : c.manual ? 'Sửa tay' : 'Tự tính') + '</span>' : '<span class="tag tag-mute">Không tính' + (y.p.exc.no ? ' – thuộc diện không tính tăng ca' : '') + '</span>'; } },
        { t: '', nosort: 1, noExport: 1, f: function () { return ''; }, h: function (y) { return y.c.otWait ? '<button class="btn btn-sm" data-act="bc-ok" data-id="' + y.u.id + '|' + esc(y.p.id) + '|' + y.c.dd + '">Xác nhận</button>' : y.c.otOk ? '<button class="btn btn-sm" data-act="bc-unok" data-id="' + y.u.id + '|' + esc(y.p.id) + '|' + y.c.dd + '">Bỏ xác nhận</button>' : ''; } }]), list, { title: 'Tang ca ' + HR.ymLabel(PS.bc.m), empty: 'Tháng này không có giờ làm thêm.' });
  }
  function bcIssue(rows) {
    var list = bcCellsOf(rows, function (c) { return !!c.issue; });
    return table('bc-is', (isMulti() ? [{ t: 'Đơn vị', f: function (y) { return shortUnit(y.u.name); } }] : []).concat([
      { t: 'Ngày', f: function (y) { return y.c.iso; } }, { t: 'Thứ', f: function (y) { return ccDowT(y.c.iso); } }, { t: 'Mã NV', f: function (y) { return y.p.id; }, mono: 1 }, { t: 'Họ và tên', f: function (y) { return y.p.name; }, h: function (y) { return personLink(y.u, y.p.id, y.p.name); } },
      { t: 'Việc cần xử lý', f: function (y) { return BC_ISSUE[y.c.issue]; }, h: function (y) { return '<span class="tag ' + (y.c.issue === 'thieu-don' ? 'tag-warn' : 'tag-bad') + '">' + BC_ISSUE[y.c.issue] + '</span>'; } },
      { t: 'Ký hiệu', f: function (y) { return y.c.k; } }, { t: 'Giờ vào – ra', f: function (y) { return y.c.tin || y.c.tout ? (y.c.tin || '?') + ' – ' + (y.c.tout || '?') : ''; } }, { t: 'Ghi chú trong file', wrap: 1, f: function (y) { return y.c.file ? y.c.file.note : ''; } },
      { t: '', nosort: 1, noExport: 1, f: function () { return ''; }, h: function (y) { return '<button class="btn btn-sm btn-primary" data-act="bc-cell" data-id="' + y.u.id + '|' + esc(y.p.id) + '|' + y.c.dd + '">Xử lý</button>'; } }]), list, { title: 'Cong can xu ly ' + HR.ymLabel(PS.bc.m), empty: 'Không có ô nào cần xử lý. Có thể chốt công.' });
  }
  function bcLog() {
    var f = PS.bc, list = []; selUnits().forEach(function (u) { bcX(u).log.forEach(function (l) { if (l.ym === f.m) list.push({ u: u, l: l }); }); });
    list.sort(function (a, b) { return a.l.ts < b.l.ts ? 1 : -1; });
    return table('bc-lg', (isMulti() ? [{ t: 'Đơn vị', f: function (y) { return shortUnit(y.u.name); } }] : []).concat([
      { t: 'Thời điểm', f: function (y) { return y.l.at; } }, { t: 'Người sửa', f: function (y) { return y.l.by; } }, { t: 'Việc', f: function (y) { return y.l.what; } }, { t: 'Nhân sự', f: function (y) { return y.l.name ? y.l.name + ' (' + y.l.id + ')' : ''; } }, { t: 'Ngày', f: function (y) { return y.l.iso || ''; } },
      { t: 'Trước', wrap: 1, f: function (y) { return y.l.old || ''; } }, { t: 'Sau', wrap: 1, f: function (y) { return y.l.nw || ''; } }, { t: 'Lý do', wrap: 1, f: function (y) { return y.l.why || ''; } },
      { t: 'Sau chốt', f: function (y) { return y.l.after ? 'Có' : ''; }, h: function (y) { return y.l.after ? '<span class="tag tag-warn">Sau chốt</span>' : ''; } }]), list, { title: 'Nhat ky sua cong ' + HR.ymLabel(f.m), empty: 'Tháng này chưa có lần sửa nào.' });
  }
  BINDS.cc = function () {
    if (!$('#bArea')) return; wfDemoAuto();
    function refresh() {
      var f = PS.bc, rows = bcRows();
      $('#bArea').innerHTML = f.view === 'sum' ? bcSum(rows) : f.view === 'ot' ? bcOt(rows) : f.view === 'issue' ? bcIssue(rows) : f.view === 'log' ? bcLog() : bcGrid(rows);
      var all = $('#otAll'); if (all) all.addEventListener('change', function () { $$('.ot-ck').forEach(function (c) { c.checked = all.checked; }); });
    }
    REFRESH = refresh; bindFilters('bc', { bQ: 'q', bDept: 'dept' }, refresh);
    var bm = $('#bM'); if (bm) bm.addEventListener('change', function () { PS.bc.m = bm.value; render(); });
    refresh();
  };

  /* ----- Ô công: xem chi tiết, sửa tay, xác nhận tăng ca ----- */
  function bcFind(key) { var a = key.split('|'), u = unitById(a[0]); if (!u) return null; var r = bcMonth(u, PS.bc.m), p = r.ppl.filter(function (x) { return x.id === a[1]; })[0]; return p ? { u: u, r: r, p: p, c: p.days[a[2]], key: a[1] + '|' + a[2] } : null; }
  function bcDesc(c) { return (c.k || '(trống)') + (c.cong ? ' · ' + ccNum(c.cong) + ' công' : '') + (c.tin || c.tout ? ' · ' + (c.tin || '?') + '–' + (c.tout || '?') : '') + (c.otRaw ? ' · TC ' + ccNum(c.otRaw) + 'h' : ''); }
  function bcLogAdd(u, o) { var x = bcX(u); o.ts = Date.now(); o.at = nowVn(); o.by = o.by || bcEditor() || 'Quản lý'; o.after = !!x.lock[o.ym]; x.log.push(o); if (x.log.length > 3000) x.log = x.log.slice(-3000); }
  ACTS['bc-cell'] = function (a, key) {
    var F = bcFind(key); if (!F) return; var u = F.u, p = F.p, c = F.c, s = F.r.s, R = s.rule, L = F.r.lock, ym = PS.bc.m;
    var ro = L && !R.editAfterLock;
    var info = '<dl class="kv2 bc-kv"><dt>Ngày</dt><dd>' + ccDowT(c.iso) + ' ' + HR.vnDate(c.iso) + ' · <b>' + BC_DAYK[c.kind] + '</b>' + (c.hol ? ' – ' + esc(c.hol.t) : '') + '</dd><dt>Ca</dt><dd>' + (p.sh ? esc(p.sh.id + ' ' + p.sh.inT + '–' + p.sh.outT) : '–') + (p.exc.nc ? ' · <span class="bc-tag">miễn chấm công</span>' : p.exc.no ? ' · <span class="bc-tag">không tính tăng ca</span>' : '') + '</dd>' +
      '<dt>File chấm công</dt><dd>' + (c.file ? esc((c.file.k || '(trống)') + (c.file.tin || c.file.tout ? ' · ' + (c.file.tin || '?') + '–' + (c.file.tout || '?') : '') + (c.file.ot ? ' · TC ' + c.file.ot + 'h' : '') + (c.file.note ? ' · ' + c.file.note : '')) : '<span class="faint">Không có dòng</span>') + '</dd>' +
      '<dt>Đơn nghỉ</dt><dd>' + (c.don ? esc(c.don.t + ' · ' + HR.vnDate(c.don.from) + (c.don.to !== c.don.from ? '–' + HR.vnDate(c.don.to) : '') + (c.don.so ? ' · số ' + c.don.so : '')) : '<span class="faint">Không có đơn đã duyệt</span>') + '</dd>' +
      '<dt>' + (c.manual ? 'Theo quy tắc' : 'Kết quả') + '</dt><dd>' + esc(bcDesc(c.manual ? Object.assign({}, c.auto, { otRaw: c.auto.ot }) : c)) + (c.issue ? ' · <span class="tag tag-bad">' + BC_ISSUE[c.issue] + '</span>' : '') + '</dd>' +
      (c.manual ? '<dt>Sửa tay</dt><dd>' + esc(bcDesc(c)) + ' <span class="faint">· ' + esc(c.manual.by + ' · ' + c.manual.at) + (c.manual.why ? ' · ' + c.manual.why : '') + '</span></dd>' : '') + '</dl>' +
      (c.note.length && !c.manual ? '<ul class="tl-notes">' + c.note.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '');
    var otBox = c.otWait ? '<div class="notice warn bc-okbox">' + ic('info') + '<div>Tăng ca <b>' + ccNum(c.otRaw) + ' giờ</b> (' + c.otRate + '%) đang <b>chờ xác nhận</b> – chưa cộng vào giờ tăng ca.</div><button class="btn btn-primary btn-sm" data-act="bc-ok" data-id="' + key + '">Xác nhận</button></div>' :
      c.otOk ? '<div class="notice bc-okbox">' + ic('check') + '<div>Tăng ca ' + ccNum(c.otRaw) + ' giờ đã xác nhận · ' + esc(c.otOk.by + ' · ' + c.otOk.at) + '</div><button class="btn btn-sm" data-act="bc-unok" data-id="' + key + '">Bỏ xác nhận</button></div>' : '';
    var codeOpts = [['', '(trống)']].concat(s.codes.map(function (x) { return [x.k, x.k + ' – ' + x.t.replace(/\s*\(.*\)$/, '')]; }));
    var form = ro ? '<div class="notice warn">' + ic('info') + '<div>Tháng ' + HR.ymLabel(ym) + ' đã chốt công. Thiết lập đang không cho sửa sau khi chốt – bấm <b>Mở lại</b> ở đầu trang nếu cần sửa.</div></div>' :
      '<form id="bcF" class="bc-form" novalidate><h4>Sửa tay ô này' + (L ? ' <span class="tag tag-warn">sau chốt – cần gửi nhân viên xác nhận lại</span>' : '') + '</h4><div class="bc-fg">' +
      '<div class="field"><label for="eK">Ký hiệu</label><select class="input" id="eK">' + codeOpts.map(function (o) { return opt(o[0], o[1], c.k === '?' ? '' : c.k); }).join('') + '</select></div>' +
      '<div class="field"><label for="eC">Ngày công</label><select class="input" id="eC">' + [1, 0.5, 0].map(function (v) { return opt(v, ccNum(v), c.cong == null ? (c.type === 'work' ? 1 : 0) : c.cong); }).join('') + '</select></div>' +
      field('eIn', 'Giờ vào', c.tin, ' inputmode="numeric" maxlength="5" placeholder="08:00"') + field('eOut', 'Giờ ra', c.tout, ' inputmode="numeric" maxlength="5" placeholder="17:00"') +
      '<div class="field"><label for="eOt">Giờ tăng ca</label><input class="input" id="eOt" type="number" min="0" max="16" step="0.25" value="' + (c.otRaw || 0) + '"></div></div>' +
      '<p class="faint bc-hint" id="eHint">Đổi giờ vào – ra thì phần mềm tính lại ký hiệu, ngày công, tăng ca theo thiết lập; vẫn sửa tiếp được từng ô.</p>' +
      '<div class="field"><label for="eWhy">Lý do' + (R.editReason ? ' *' : '') + '</label><input class="input" id="eWhy" maxlength="160" placeholder="Ví dụ: quên chấm ra, đi công tác, máy chấm lỗi" value="' + esc(c.manual ? c.manual.why || '' : '') + '"></div>' + bcWho() +
      '<p id="eMsg" class="tl-msg"></p><div class="link-row" style="justify-content:space-between">' + (c.manual ? '<button type="button" class="btn" id="eReset">Khôi phục theo quy tắc</button>' : '<span></span>') +
      '<span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Đóng</button><button type="submit" class="btn btn-primary">Lưu sửa tay</button></span></div></form>';
    var m = modal(p.name + ' · ' + HR.vnDate(c.iso), p.id + (isMulti() ? ' · ' + shortUnit(u.name) : ''), info + otBox + form);
    if (ro) return;
    var recalc = function () {
      var ti = $('#eIn', m).value.trim(), to = $('#eOut', m).value.trim(); if (ccMin(ti) === null || ccMin(to) === null) return;
      var wd = c.kind === 'work' || c.kind === 'half', r = ccCalcDay(s, p.sh, ti, to, wd ? 'work' : c.kind, c.kind === 'half' ? 'h' : 'f', p.exc);
      if (r.code && r.code !== '?' && r.code !== 'KP?') $('#eK', m).value = r.code; else if (r.code === 'KP?') $('#eK', m).value = 'KP';
      $('#eC', m).value = String(wd ? r.cong : 0); $('#eOt', m).value = r.otRaw || 0;
      $('#eHint', m).textContent = 'Tính lại theo giờ: ' + (r.late ? 'đi muộn ' + r.late + ' phút · ' : '') + (r.early ? 'về sớm ' + r.early + ' phút · ' : '') + (r.otRaw ? 'làm thêm ' + ccNum(r.otRaw) + ' giờ' : 'không làm thêm') + '.';
      m._late = r.late; m._early = r.early;
    };
    ['eIn', 'eOut'].forEach(function (k) { $('#' + k, m).addEventListener('input', recalc); });
    $('#eK', m).addEventListener('change', function () { var d = bcCode(s, $('#eK', m).value); if (d) $('#eC', m).value = String(d.type === 'work' ? (c.kind === 'half' ? Math.min(+d.w, 0.5) : +d.w) : 0); });
    var rs = $('#eReset', m); if (rs) rs.addEventListener('click', function () {
      var by = ccUser(), M = bcX(u).m[ym]; delete M[F.key];
      bcLogAdd(u, { ym: ym, id: p.id, name: p.name, iso: c.iso, what: 'Khôi phục theo quy tắc', old: bcDesc(c), nw: bcDesc(Object.assign({}, c.auto, { otRaw: c.auto.ot })), why: $('#eWhy', m).value.trim(), by: by });
      bcSaveX(u, 'khôi phục ô ' + p.id + ' ' + c.iso); m.close(); toast('Đã khôi phục theo quy tắc', 'ok'); render();
    });
    $('#bcF', m).addEventListener('submit', function (e) {
      e.preventDefault(); var msg = $('#eMsg', m), why = $('#eWhy', m).value.trim(), by = ccUser(), ti = $('#eIn', m).value.trim(), to = $('#eOut', m).value.trim(), ot = +$('#eOt', m).value;
      if ((ti && ccMin(ti) === null) || (to && ccMin(to) === null)) { msg.textContent = 'Giờ vào, giờ ra dạng HH:MM hoặc để trống'; return; }
      if (isNaN(ot) || ot < 0 || ot > 16) { msg.textContent = 'Giờ tăng ca từ 0 đến 16'; return; }
      if (R.editReason && !why) { msg.textContent = 'Nhập lý do sửa (Thiết lập đang bắt buộc ghi lý do)'; $('#eWhy', m).focus(); return; }
      var nw = { k: $('#eK', m).value, cong: +$('#eC', m).value, tin: ti ? ccHM(ccMin(ti)) : '', tout: to ? ccHM(ccMin(to)) : '', ot: ot, late: m._late != null ? m._late : c.late, early: m._early != null ? m._early : c.early, why: why, by: by, at: nowVn(), after: L ? 1 : 0 };
      var X = bcX(u), M = X.m[ym] || (X.m[ym] = {}); M[F.key] = nw;
      bcLogAdd(u, { ym: ym, id: p.id, name: p.name, iso: c.iso, what: 'Sửa tay', old: bcDesc(c), nw: bcDesc({ k: nw.k, cong: nw.cong, tin: nw.tin, tout: nw.tout, otRaw: nw.ot }), why: why, by: by });
      bcSaveX(u, 'sửa ô ' + p.id + ' ' + c.iso + ': ' + nw.k + ' ' + nw.cong + ' công, TC ' + nw.ot); m.close(); toast('Đã lưu sửa tay', 'ok', L ? 'Tháng đã chốt – ô này được đánh dấu để gửi nhân viên xác nhận lại.' : 'Ô sửa tay giữ nguyên, không bị quy tắc tính đè lại.'); render();
    });
  };
  function bcOkSet(keys, on) {
    var go = function (by2) {
      var n = 0, touched = {};
      keys.forEach(function (key) { var F = bcFind(key); if (!F) return; var X = bcX(F.u), O = X.ok[PS.bc.m] || (X.ok[PS.bc.m] = {}); if (on) { if (!F.c.otWait) return; O[F.key] = { by: by2, at: nowVn(), h: F.c.otRaw }; } else { if (!O[F.key]) return; delete O[F.key]; }
        bcLogAdd(F.u, { ym: PS.bc.m, id: F.p.id, name: F.p.name, iso: F.c.iso, what: on ? 'Xác nhận tăng ca' : 'Bỏ xác nhận tăng ca', old: on ? 'Chờ xác nhận ' + ccNum(F.c.otRaw) + 'h' : 'Đã xác nhận ' + ccNum(F.c.otRaw) + 'h', nw: on ? 'Tính ' + ccNum(F.c.otRaw) + 'h × ' + F.c.otRate + '%' : 'Chờ xác nhận', by: by2 }); touched[F.u.id] = F.u; n++; });
      Object.keys(touched).forEach(function (k) { bcSaveX(touched[k], (on ? 'xác nhận ' : 'bỏ xác nhận ') + n + ' lượt tăng ca'); });
      $$('.modal-bg').forEach(function (b) { if (b.close) b.close(); });
      if (n) toast((on ? 'Đã xác nhận ' : 'Đã bỏ xác nhận ') + n + ' lượt tăng ca', 'ok'); else toast('Chưa chọn lượt nào', 'err'); render();
    };
    go(ccUser());
  }
  ACTS['bc-ok'] = function (a, key) { bcOkSet([key], true); };
  ACTS['bc-unok'] = function (a, key) { bcOkSet([key], false); };
  ACTS['bc-okmany'] = function () { bcOkSet($$('.ot-ck').filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-k'); }), true); };

  /* ----- Chốt công tháng ----- */
  ACTS['bc-lock'] = function (a, uid) {
    var u = unitById(uid), ym = PS.bc.m, r = bcMonth(u, ym), iss = 0, wait = 0, n = r.ppl.length; r.ppl.forEach(function (p) { iss += p.sum.issues; wait += p.sum.otWait; });
    var future = r.days[r.days.length - 1] > refDate();
    var m = modal('Chốt công tháng ' + HR.ymLabel(ym), shortUnit(u.name),
      '<ul class="bc-chk"><li class="' + (iss ? 'bad' : 'ok') + '">' + (iss ? iss + ' ô cần xử lý (vắng chưa rõ, thiếu chấm, thiếu đơn…)' : 'Không còn ô cần xử lý') + '</li>' +
      '<li class="' + (wait ? 'warn' : 'ok') + '">' + (wait ? ccNum(wait) + ' giờ tăng ca chờ xác nhận – chốt thì phần này KHÔNG được tính' : 'Không có tăng ca chờ xác nhận') + '</li>' +
      (future ? '<li class="warn">Tháng chưa kết thúc (tính đến ' + HR.vnDate(refDate()) + ')</li>' : '') + '<li class="ok">' + n + ' người · ' + bcNum(r.ppl.reduce(function (t, p) { return t + p.sum.salary; }, 0)) + ' công hưởng lương</li></ul>' +
      '<p class="faint" style="font-size:12.5px">Sau khi chốt: số liệu tháng này dùng để tính lương. ' + (r.s.rule.editAfterLock ? 'Vẫn sửa tay được – ô sửa sau chốt được đánh dấu để gửi nhân viên xác nhận lại.' : 'Không sửa được nữa cho đến khi Mở lại.') + ' Gửi từng nhân viên xác nhận công trên điện thoại sẽ có khi ghép Ứng dụng nhân viên (bước Chấm công Wi‑Fi).</p>' +
      bcWho() + '<p id="lkMsg" class="tl-msg"></p>' +
      '<div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="lkGo">' + (iss || wait ? 'Vẫn chốt công' : 'Chốt công') + '</button></div>', true);
    $('#lkGo', m).addEventListener('click', function () {
      var by = ccUser(), X = bcX(u);
      X.lock[ym] = { by: by, at: nowVn(), ts: Date.now(), issues: iss, wait: wait, sum: r.ppl.map(function (p) { return { id: p.id, name: p.name, work: p.sum.work, paid: p.sum.paid, hol: p.sum.hol, salary: p.sum.salary, bh: p.sum.bh, unpaid: p.sum.unpaid, otN: p.sum.otN, otR: p.sum.otR, otH: p.sum.otH, otPay: Math.round(p.sum.otPay * 100) / 100 }; }) };
      bcLogAdd(u, { ym: ym, what: 'Chốt công tháng', nw: n + ' người' + (iss ? ', còn ' + iss + ' ô cần xử lý' : '') + (wait ? ', ' + ccNum(wait) + 'h tăng ca chưa xác nhận' : ''), by: by }); X.log[X.log.length - 1].after = false;
      bcSaveX(u, 'chốt công ' + ym); m.close(); toast('Đã chốt công tháng ' + HR.ymLabel(ym), 'ok', wfOn(u) ? 'Đang gửi công từng người lên điện thoại để nhân viên xác nhận…' : ''); render();
      if (wfOn(u)) wfSendCong(u, ym, false).then(function (k) { wfLog(u, 'Đã gửi công tháng ' + HR.ymLabel(ym) + ' cho ' + k + ' nhân viên xác nhận'); saveUnits(); toast('Đã gửi công tháng ' + HR.ymLabel(ym) + ' cho ' + k + ' nhân viên xác nhận', 'ok'); render(); }, function (er) { wfLog(u, 'Chưa gửi được công ' + ym + ': ' + er.message, false); saveUnits(); toast('Chưa gửi được công lên điện thoại', 'err', er.message + ' Bấm Đồng bộ ở trang Chấm công Wi‑Fi để gửi lại.'); });
    });
  };
  ACTS['bc-unlock'] = function (a, uid) {
    var u = unitById(uid), ym = PS.bc.m, L = bcX(u).lock[ym]; if (!L) return;
    var m = modal('Mở lại công tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<p>Đã chốt bởi <b>' + esc(L.by) + '</b> lúc ' + esc(L.at) + '. Mở lại để sửa, xong thì chốt lại.</p><div class="field"><label for="ulWhy">Lý do mở lại *</label><input class="input" id="ulWhy" maxlength="160"></div>' + bcWho() + '<p id="ulMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ulGo">Mở lại</button></div>', true);
    $('#ulGo', m).addEventListener('click', function () {
      var why = $('#ulWhy', m).value.trim(), by = ccUser(); if (!why) { $('#ulMsg', m).textContent = 'Nhập lý do mở lại'; return; }
      delete bcX(u).lock[ym];
      bcLogAdd(u, { ym: ym, what: 'Mở lại công tháng', old: 'Đã chốt bởi ' + L.by + ' · ' + L.at, why: why, by: by }); bcX(u).log[bcX(u).log.length - 1].after = false;
      bcSaveX(u, 'mở lại công ' + ym); m.close(); toast('Đã mở lại công tháng ' + HR.ymLabel(ym), 'ok'); render();
    });
  };

  // Dữ liệu mẫu (anh yêu cầu 07/11 15:15): các tháng trước tháng 11/2026 coi như ĐÃ CHỐT; ô ốm DS009 27/10 đã bổ sung giấy nghỉ ốm trước khi chốt
  function bcSampleInit(u, refYm) {
    if (!u || u.source !== 'sample') return; var x = bcX(u); x.m = {}; x.ok = {}; x.lock = {}; x.log = [];
    if (/Edu/.test(u.folder || '')) { x.m['2026-10'] = { 'DS009|27': { k: 'Ô', cong: 0, tin: '', tout: '', ot: 0, late: 0, early: 0, why: 'Đã nộp giấy nghỉ ốm của bệnh viện', by: 'Quản trị viên', at: '02/11/2026 09:12:00' } };
      x.log.push({ ym: '2026-10', id: 'DS009', name: 'Ngô Văn Hiếu', iso: '2026-10-27', what: 'Sửa tay', old: 'Ô · thiếu đơn nghỉ', nw: 'Ô', why: 'Đã nộp giấy nghỉ ốm của bệnh viện', by: 'Quản trị viên', at: '02/11/2026 09:12:00', ts: 1 }); }
    Object.keys(u.data.CC || {}).sort().forEach(function (ym) {
      if (ym >= refYm) return; var y = +ym.slice(0, 4), mo = +ym.slice(5, 7) + 1; if (mo > 12) { mo = 1; y++; }
      var at = '03/' + p2(mo) + '/' + y + ' 16:30:00', r = bcMonth(u, ym);
      x.lock[ym] = { by: 'Quản trị viên', at: at, issues: 0, wait: 0, sum: r.ppl.map(function (p) { return { id: p.id, name: p.name, work: p.sum.work, paid: p.sum.paid, hol: p.sum.hol, salary: p.sum.salary, bh: p.sum.bh, unpaid: p.sum.unpaid, otN: p.sum.otN, otR: p.sum.otR, otH: p.sum.otH, otPay: Math.round(p.sum.otPay * 100) / 100 }; }) };
      x.log.push({ ym: ym, what: 'Chốt công tháng', nw: r.ppl.length + ' người', by: 'Quản trị viên', at: at, ts: 2, after: false });
    });
    x.v++; u._bc = {};
  }

  /* =====================================================================
     NỐI BẢNG CÔNG VÀO CÁC TRANG KHÁC (anh chốt 07/11 15:26 "có chuyển để khớp với thời điểm bây giờ")
       ccData(u) = dữ liệu của công ty nhưng bảng chấm công (CC) lấy từ Tổng hợp công (đã tính theo thiết lập, đơn nghỉ, sửa tay)
       → Việc cần xử lý, Bảng điều hành, đối chiếu Bảng lương, hồ sơ từng người dùng chung 1 số liệu với Tổng hợp công
       Tháng đã chốt: số liệu = bảng công tại thời điểm hiện tại (sửa sau chốt được đánh dấu); nếu khác bản lưu lúc chốt → cảnh báo trên Tổng hợp công
     ===================================================================== */
  function bcRowsOf(r) {
    var out = [];
    r.ppl.forEach(function (p) { r.days.forEach(function (iso) {
      var c = p.days[iso.slice(8, 10)]; if (!c || c.src === 'out' || !c.k || c.k === '?') return;
      out.push({ 'Ngày': iso, 'Thứ': ccDowT(iso), 'Mã NV': p.id, 'Họ và tên': p.name, 'Phòng ban': p.dept, 'Tổ': p.e ? p.e['Tổ/Ca'] || '' : '', 'Ca': p.sh ? p.sh.id : '', 'Giờ vào': c.tin || '', 'Giờ ra': c.tout || '',
        'Số giờ công': c.type === 'work' ? Math.round((c.cong || 0) * (p.sh ? (shiftInfo(p.sh) || { full: 8 }).full : 8) * 10) / 10 : '', 'Đi muộn (phút)': c.late || '', 'Giờ tăng ca': c.ot || '', 'Loại tăng ca': c.ot ? (c.otKind === 'H' ? 'Ngày lễ' : c.otKind === 'R' ? 'Ngày nghỉ' : 'Ngày thường') : '',
        'Ký hiệu': c.k, 'Ghi chú': c.manual ? 'Sửa tay: ' + (c.manual.why || '') : (c.file && c.file.note) || '' });
    }); });
    return out;
  }
  function ccData(u) {
    var x = bcX(u), key = (u.ver || 0) + '|' + (u.ccset ? u.ccset.at : '') + '|' + x.v + '|' + refDate() + '|' + bcSynEnd(u);
    if (u._ccd && u._ccd.key === key) return u._ccd.d;
    var ms = {}; Object.keys(u.data.CC || {}).forEach(function (m) { ms[m] = 1; }); Object.keys(x.lock).forEach(function (m) { ms[m] = 1; }); Object.keys(u.wifi || {}).forEach(function (m) { ms[m] = 1; }); if (bcSynEnd(u)) ms[bcSynEnd(u).slice(0, 7)] = 1;
    var CC = {}; Object.keys(ms).sort().forEach(function (ym) { var rows = bcRowsOf(bcMonth(u, ym)); if (rows.length) CC[ym] = rows; });
    var d = Object.assign({}, u.data, { CC: CC }); u._ccd = { key: key, d: d }; return d;
  }
  function ccUnit(u) { return Object.assign({}, u, { data: ccData(u) }); }
  // bảng công hiện tại khác bản tổng lưu lúc chốt?
  function bcLockDiff(r) {
    if (!r.lock || !r.lock.sum) return []; var by = {}, out = []; r.lock.sum.forEach(function (x) { by[x.id] = x; });
    r.ppl.forEach(function (p) { var o = by[p.id]; if (!o) return; var a = Math.round(p.sum.salary * 100), b = Math.round(o.salary * 100), c = Math.round((p.sum.otN + p.sum.otR + p.sum.otH) * 100), d = Math.round((o.otN + o.otR + o.otH) * 100); if (a !== b || c !== d) out.push(p.name); });
    return out;
  }

  /* =====================================================================
     BƯỚC 3/4 – NGHỈ PHÉP (07/11/2026)
       Đơn nghỉ: tạo, duyệt / từ chối / hủy ngay trên phần mềm (lớp sửa dữ liệu DON, ghi lại được file Excel gốc)
       Quỹ phép năm tự tính: Điều 113 (12/14/16 ngày), Điều 114 (+1 ngày mỗi 5 năm), NĐ 145/2020 Điều 66 (chưa đủ 12 tháng: tính theo tháng, ≥ 0,5 làm tròn lên)
       Số ngày nghỉ của đơn = số ngày làm việc theo ca của người đó (trừ ngày nghỉ tuần, lễ tết, nghỉ bù)
     ===================================================================== */
  EKEY.DON = 'Số đơn'; ETYPE_T.DON = 'Đơn nghỉ'; STD_FILE.DON = '04_Nghi_phep/Don_nghi_phep_2026.xlsx';
  var NP_TYPES = [['Nghỉ phép năm', 'P', 'Trừ vào quỹ phép năm (Điều 113)'], ['Nghỉ việc riêng có lương', 'R', 'Kết hôn 3 ngày; con kết hôn 1 ngày; cha mẹ (cả bên vợ/chồng), vợ/chồng, con chết 3 ngày (Điều 115)'],
    ['Nghỉ ốm', 'Ô', 'Hưởng chế độ BHXH – cần giấy chứng nhận nghỉ việc hưởng BHXH'], ['Nghỉ thai sản', 'TS', 'Hưởng chế độ BHXH'], ['Nghỉ không lương', 'KL', 'Thỏa thuận với người sử dụng lao động (Điều 115 khoản 3)']];
  function npRule(s) { var L = s.leave || (s.leave = {}); if (L.base == null) L.base = 12; L.emp = L.emp || {}; return L; }
  function npWorkDays(u, e, from, to) { // số ngày làm việc theo ca của người đó trong khoảng
    var s = ccOf(u), sh = ccShiftOf(s, e ? e['Phòng ban'] : ''), n = 0, d = from, g = 0;
    while (d <= to && g < 400) { var K = bcKind(s, sh, d); n += K.k === 'work' ? 1 : K.k === 'half' ? 0.5 : 0; d = ccAdd(d, 1); g++; }
    return n;
  }
  function npRound(v) { var f = Math.floor(v); return v - f >= 0.5 ? f + 1 : f; }
  // quỹ phép năm của 1 người tại ngày R
  function npQuota(u, e, R) {
    var s = ccOf(u), L = npRule(s), y = +R.slice(0, 4), id = e['Mã NV'], base = +(L.emp[id] || L.base), j = String(e['Ngày vào làm'] || '').slice(0, 10);
    var yrs = 0; if (j) { yrs = y - +j.slice(0, 4); if (R.slice(5) < j.slice(5)) yrs--; yrs = Math.max(0, yrs); }
    var tn = Math.floor(yrs / 5), months = 12, note = '';
    if (j && j.slice(0, 4) === String(y)) { months = 12 - +j.slice(5, 7) + (+j.slice(8, 10) <= 15 ? 1 : 0); note = 'Vào làm ' + HR.vnDate(j) + ' → tính ' + months + ' tháng'; }
    var l = String(e['Ngày nghỉ việc'] || '').slice(0, 10); if (l && l.slice(0, 4) === String(y)) { months = Math.max(0, months - (12 - +l.slice(5, 7)) - (+l.slice(8, 10) < 15 ? 1 : 0)); note = (note ? note + '; ' : '') + 'nghỉ việc ' + HR.vnDate(l); }
    var total = months >= 12 ? base + tn : npRound((base + tn) / 12 * months);
    var used = 0, plan = 0, wait = 0, yS = y + '-01-01', yE = y + '-12-31';
    (u.data.DON || []).forEach(function (d) {
      if (d['Mã NV'] !== id || !/phép năm/i.test(d['Loại nghỉ'] || '') || !d['Từ ngày']) return;
      var a = String(d['Từ ngày']).slice(0, 10), b = String(d['Đến ngày'] || a).slice(0, 10); if (b < yS || a > yE) return;
      var n = +d['Số ngày'] || npWorkDays(u, e, a < yS ? yS : a, b > yE ? yE : b);
      if (d['Trạng thái'] === 'Đã duyệt') { if (a <= R) used += n; else plan += n; } else if (d['Trạng thái'] === 'Chờ duyệt') wait += n;
    });
    var q = (u.data.QP || []).filter(function (x) { return x['Mã NV'] === id; })[0], fk = q ? Object.keys(q).filter(function (k) { return /^Tổng phép năm/.test(k); })[0] : null;
    return { base: base, yrs: yrs, tn: tn, months: months, total: total, used: used, plan: plan, wait: wait, left: total - used - plan, note: note, file: q ? { total: +q[fk] || 0, used: +q['Đã nghỉ'] || 0, left: +q['Còn lại'] || 0 } : null };
  }
  PAGES.np = function () {
    if (!S.units.length) return pageHead('Nghỉ phép') + noData('dữ liệu');
    var f = ps('np2', { tab: 'don', st: 'Chờ duyệt', q: '', loai: '', dept: '' }), R = refDate();
    var all = []; selUnits().forEach(function (u) { (u.data.DON || []).forEach(function (d) { all.push({ u: u, d: d }); }); });
    var cnt = { 'Chờ duyệt': 0, 'Đã duyệt': 0, 'Từ chối': 0, '': all.length }; all.forEach(function (x) { cnt[x.d['Trạng thái']] = (cnt[x.d['Trạng thái']] || 0) + 1; });
    var soon = all.filter(function (x) { var a = String(x.d['Từ ngày'] || '').slice(0, 10), b = String(x.d['Đến ngày'] || a).slice(0, 10); return x.d['Trạng thái'] !== 'Từ chối' && b >= R && a <= ccAdd(R, 14); }).sort(function (a, b) { return a.d['Từ ngày'] < b.d['Từ ngày'] ? -1 : 1; });
    var late = all.filter(function (x) { return x.d['Trạng thái'] === 'Chờ duyệt' && String(x.d['Từ ngày']).slice(0, 10) <= R; }).length;
    var head = pageHead('Nghỉ phép', 'Đơn nghỉ được duyệt tự vào <a href="#cc">Tổng hợp công</a> · quỹ phép năm tự tính theo Điều 113, 114 BLLĐ 2019 và Điều 66 NĐ 145/2020, tính đến ' + HR.vnDate(R), '<button class="btn btn-primary" data-act="np-new">+ Tạo đơn nghỉ</button>');
    var kpi = '<div class="org-kpi"><div class="' + (cnt['Chờ duyệt'] ? 'k-warn' : '') + '"><b>' + cnt['Chờ duyệt'] + '</b><span>đơn chờ duyệt' + (late ? ' · <b class="down">' + late + ' đã tới ngày nghỉ</b>' : '') + '</span></div><div><b>' + soon.length + '</b><span>lượt nghỉ trong 14 ngày tới</span></div>' +
      '<div><b>' + cnt['Đã duyệt'] + '</b><span>đơn đã duyệt</span></div><div><b>' + (cnt['Từ chối'] || 0) + '</b><span>đơn từ chối</span></div></div>';
    var soonBox = soon.length ? '<div class="card card-pad np-soon"><div class="card-head"><div><h3>Sắp nghỉ, đang nghỉ</h3><p>14 ngày tới, gồm cả đơn chờ duyệt</p></div></div><div class="np-sl">' + soon.slice(0, 12).map(function (x) {
      var d = x.d, a = String(d['Từ ngày']).slice(0, 10), b = String(d['Đến ngày'] || a).slice(0, 10);
      return '<div class="np-si' + (d['Trạng thái'] === 'Chờ duyệt' ? ' wait' : '') + '"><b>' + personLink(x.u, d['Mã NV'], d['Họ và tên']) + '</b><span>' + esc(d['Loại nghỉ']) + ' · ' + HR.vnDate(a).slice(0, 5) + (b !== a ? '–' + HR.vnDate(b).slice(0, 5) : '') + ' · ' + nfmt(+d['Số ngày']) + ' ngày</span>' + (d['Trạng thái'] === 'Chờ duyệt' ? '<em>chờ duyệt</em>' : '') + '</div>';
    }).join('') + '</div></div>' : '';
    var tabs = '<div class="tl-tabs">' + [['don', 'Đơn nghỉ'], ['quy', 'Quỹ phép năm'], ['qd', 'Quy định phép năm']].map(function (t) { return '<button class="' + (f.tab === t[0] ? 'on' : '') + '" data-act="np-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var flt = f.tab === 'qd' ? '' : '<div class="filters card card-pad">' + (f.tab === 'don' ? '<div class="field"><label>Trạng thái</label><div class="seg">' + [['Chờ duyệt', 'Chờ duyệt'], ['Đã duyệt', 'Đã duyệt'], ['Từ chối', 'Từ chối'], ['', 'Tất cả']].map(function (v) { return '<button class="' + (f.st === v[0] ? 'on' : '') + '" data-act="np-st" data-id="' + v[0] + '">' + v[1] + ' <span class="vc-hn">' + (cnt[v[0]] || 0) + '</span></button>'; }).join('') + '</div></div>' : '') +
      searchBox('nQ', f.q) + (f.tab === 'don' ? selectBox('nLoai', 'Loại nghỉ', [['', 'Tất cả loại']].concat(NP_TYPES.map(function (t) { return [t[0], t[0]]; })), f.loai, 170) : '') + selectBox('nDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) + '</div>';
    return head + kpi + (f.tab === 'don' ? soonBox : '') + tabs + flt + '<div id="nArea"></div>';
  };
  ACTS['np-tab'] = function (a, id) { PS.np2.tab = id; render(); };
  ACTS['np-st'] = function (a, id) { PS.np2.st = id; render(); };
  BINDS.np = function () {
    if (!$('#nArea')) return; wfDemoAuto();
    function refresh() {
      var f = PS.np2, q = norm(f.q), R = refDate();
      if (f.tab === 'qd') { $('#nArea').innerHTML = npRuleHtml(); npRuleBind(); return; }
      if (f.tab === 'quy') {
        var rows = []; selUnits().forEach(function (u) { var mat = HR.maternitySet(u.data, R); (u.data.NV || []).forEach(function (e) { if (HR.staffState(e, R, mat) === 'left' && String(e['Ngày nghỉ việc'] || '').slice(0, 4) !== R.slice(0, 4)) return; if ((f.dept && e['Phòng ban'] !== f.dept) || (q && norm(e['Mã NV'] + ' ' + e['Họ và tên']).indexOf(q) < 0)) return; rows.push({ u: u, e: e, x: npQuota(u, e, R) }); }); });
        $('#nArea').innerHTML = table('np-quy', uCol().concat([{ t: 'Mã NV', f: function (r) { return r.e['Mã NV']; }, mono: 1 }, { t: 'Họ và tên', f: function (r) { return r.e['Họ và tên']; }, h: function (r) { return personLink(r.u, r.e['Mã NV'], r.e['Họ và tên']); } }, { t: 'Phòng ban', f: function (r) { return r.e['Phòng ban']; } },
          { t: 'Ngày vào làm', f: function (r) { return r.e['Ngày vào làm']; } }, { t: 'Thâm niên', f: function (r) { return r.x.yrs; }, r: 1, h: function (r) { return r.x.yrs + ' năm'; } },
          { t: 'Phép cơ bản', f: function (r) { return r.x.base; }, r: 1, h: function (r) { return '<select class="input np-base" data-u="' + r.u.id + '" data-id="' + esc(r.e['Mã NV']) + '" aria-label="Phép cơ bản">' + [12, 14, 16].map(function (v) { return opt(v, v, r.x.base); }).join('') + '</select>'; } },
          { t: 'Thâm niên +', f: function (r) { return r.x.tn; }, r: 1 }, { t: 'Tổng phép năm', f: function (r) { return r.x.total; }, r: 1, h: function (r) { return '<b>' + nfmt(r.x.total) + '</b>' + (r.x.note ? '<small class="faint" style="display:block" title="' + esc(r.x.note) + '">' + r.x.months + ' tháng</small>' : ''); } },
          { t: 'Đã nghỉ', f: function (r) { return r.x.used; }, r: 1 }, { t: 'Đã duyệt sắp nghỉ', f: function (r) { return r.x.plan; }, r: 1 }, { t: 'Chờ duyệt', f: function (r) { return r.x.wait; }, r: 1, h: function (r) { return r.x.wait ? '<span class="tag tag-warn">' + nfmt(r.x.wait) + '</span>' : '<span class="faint">0</span>'; } },
          { t: 'Còn lại', f: function (r) { return r.x.left; }, r: 1, h: function (r) { var v = r.x.left; return '<b class="' + (v < 0 ? 'down' : v <= (cfg().leaveLow || 1) ? 'np-low' : '') + '">' + nfmt(v) + '</b>'; } },
          { t: 'Theo file (tổng / đã nghỉ / còn)', f: function (r) { return r.x.file ? r.x.file.total + ' / ' + r.x.file.used + ' / ' + r.x.file.left : ''; }, h: function (r) { if (!r.x.file) return '<span class="faint">–</span>'; var df = r.x.file.total !== r.x.total || r.x.file.used !== r.x.used; return '<span class="' + (df ? 'tag tag-warn' : 'faint') + '" title="' + (df ? 'Khác số tự tính – xem lại file Quỹ phép' : 'Khớp') + '">' + r.x.file.total + ' / ' + r.x.file.used + ' / ' + r.x.file.left + '</span>'; } }]), rows, { title: 'Quy phep nam ' + R.slice(0, 4), note: 'Tính đến ' + HR.vnDate(R) });
        $$('.np-base').forEach(function (el) { el.addEventListener('change', function () { var u = unitById(el.getAttribute('data-u')), s = ccOf(u), L = npRule(s), id = el.getAttribute('data-id'); if (+el.value === +L.base) delete L.emp[id]; else L.emp[id] = +el.value; ccSave(u, 'phép cơ bản ' + id + ' = ' + el.value); toast('Đã lưu', 'ok'); refresh(); }); });
        return;
      }
      var list = []; selUnits().forEach(function (u) { (u.data.DON || []).forEach(function (d) { if ((f.st && d['Trạng thái'] !== f.st) || (f.loai && d['Loại nghỉ'] !== f.loai) || (f.dept && d['Phòng ban'] !== f.dept) || (q && norm(d['Mã NV'] + ' ' + d['Họ và tên'] + ' ' + d['Số đơn']).indexOf(q) < 0)) return; list.push({ u: u, d: d }); }); });
      list.sort(function (a, b) { return String(b.d['Từ ngày']) < String(a.d['Từ ngày']) ? -1 : 1; });
      $('#nArea').innerHTML = table('np-don', uCol().concat([{ t: 'Số đơn', f: function (x) { return x.d['Số đơn']; }, mono: 1 }, { t: 'Ngày tạo', f: function (x) { return x.d['Ngày tạo đơn']; } }, { t: 'Mã NV', f: function (x) { return x.d['Mã NV']; }, mono: 1 },
        { t: 'Họ và tên', f: function (x) { return x.d['Họ và tên']; }, h: function (x) { return personLink(x.u, x.d['Mã NV'], x.d['Họ và tên']); } }, { t: 'Loại nghỉ', f: function (x) { return x.d['Loại nghỉ']; } },
        { t: 'Từ ngày', f: function (x) { return x.d['Từ ngày']; } }, { t: 'Đến ngày', f: function (x) { return x.d['Đến ngày']; } }, { t: 'Số ngày', f: function (x) { return x.d['Số ngày']; }, r: 1 }, { t: 'Lý do', wrap: 1, f: function (x) { return x.d['Lý do']; } },
        { t: 'Nguồn', f: function (x) { return x.d['Nguồn'] || 'File Excel'; } },
        { t: 'Trạng thái', f: function (x) { return x.d['Trạng thái']; }, h: function (x) { var s = x.d['Trạng thái'], past = s === 'Chờ duyệt' && String(x.d['Từ ngày']).slice(0, 10) <= R; return '<span class="tag ' + (s === 'Đã duyệt' ? 'tag-ok' : s === 'Chờ duyệt' ? (past ? 'tag-bad' : 'tag-warn') : 'tag-mute') + '">' + esc(s) + (past ? ' · đã tới ngày nghỉ' : '') + '</span>' + (x.d['Người duyệt'] && s !== 'Chờ duyệt' ? '<small class="faint" style="display:block">' + esc(x.d['Người duyệt']) + '</small>' : '') + (x.d['Lý do từ chối'] ? '<small class="faint" style="display:block">' + esc(x.d['Lý do từ chối']) + '</small>' : ''); } },
        { t: '', nosort: 1, noExport: 1, f: function () { return ''; }, h: function (x) { var k = x.u.id + '|' + esc(x.d['Số đơn']); return x.d['Trạng thái'] === 'Chờ duyệt' ? '<span class="np-btns"><button class="btn btn-sm btn-primary" data-act="np-ok" data-id="' + k + '">Duyệt</button><button class="btn btn-sm" data-act="np-no" data-id="' + k + '">Từ chối</button></span>' : '<button class="btn btn-sm" data-act="np-view" data-id="' + k + '">Xem</button>'; } }]), list, { title: 'Don nghi', empty: f.st === 'Chờ duyệt' ? 'Không có đơn nào chờ duyệt.' : 'Không có đơn nào.' });
    }
    REFRESH = refresh; bindFilters('np2', { nQ: 'q', nLoai: 'loai', nDept: 'dept' }, refresh); refresh();
  };
  function npFind(key) { var a = key.split('|'), u = unitById(a[0]); if (!u) return null; var d = (u.data.DON || []).filter(function (x) { return String(x['Số đơn']) === a.slice(1).join('|'); })[0]; return d ? { u: u, d: d } : null; }
  function npInfo(u, d) {
    var e = nvIndex(u)[d['Mã NV']], q = e && /phép năm/i.test(d['Loại nghỉ'] || '') ? npQuota(u, e, refDate()) : null;
    return '<dl class="kv2"><dt>Nhân sự</dt><dd>' + esc(d['Họ và tên'] + ' · ' + d['Mã NV'] + (d['Phòng ban'] ? ' · ' + d['Phòng ban'] : '')) + '</dd><dt>Loại nghỉ</dt><dd>' + esc(d['Loại nghỉ']) + '</dd><dt>Thời gian</dt><dd>' + HR.vnDate(d['Từ ngày']) + (d['Đến ngày'] && d['Đến ngày'] !== d['Từ ngày'] ? ' – ' + HR.vnDate(d['Đến ngày']) : '') + ' · <b>' + nfmt(+d['Số ngày']) + ' ngày làm việc</b></dd>' +
      '<dt>Lý do</dt><dd>' + esc(d['Lý do'] || '–') + '</dd><dt>Số đơn</dt><dd class="mono">' + esc(d['Số đơn']) + ' · tạo ' + (d['Ngày tạo đơn'] ? HR.vnDate(d['Ngày tạo đơn']) : '') + (d['Nguồn'] ? ' · ' + esc(d['Nguồn']) : '') + '</dd>' +
      (d['Người duyệt'] ? '<dt>Người duyệt</dt><dd>' + esc(d['Người duyệt']) + (d['Ngày duyệt'] ? ' · ' + HR.vnDate(d['Ngày duyệt']) : '') + '</dd>' : '') + '</dl>' +
      (q ? '<div class="notice' + (q.left - (d['Trạng thái'] === 'Chờ duyệt' ? +d['Số ngày'] : 0) < 0 ? ' warn' : '') + '">' + ic('np') + '<div>Quỹ phép năm ' + refDate().slice(0, 4) + ': tổng <b>' + nfmt(q.total) + '</b> · đã nghỉ ' + nfmt(q.used) + ' · đã duyệt sắp nghỉ ' + nfmt(q.plan) + ' · còn <b>' + nfmt(q.left) + '</b>' + (d['Trạng thái'] === 'Chờ duyệt' ? ' → sau khi duyệt còn <b>' + nfmt(q.left - +d['Số ngày']) + '</b>' : '') + '</div></div>' : '');
  }
  ACTS['np-view'] = function (a, key) { var F = npFind(key); if (!F) return; var m = modal('Đơn nghỉ ' + F.d['Số đơn'], F.d['Trạng thái'], npInfo(F.u, F.d) + (F.d['Nguồn'] === 'Phần mềm' ? '<div class="link-row" style="justify-content:space-between;margin-top:14px"><button class="btn btn-danger" id="npDel">Hủy đơn</button><button class="btn" data-close>Đóng</button></div>' : '<div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Đóng</button></div>'), true);
    var dl = $('#npDel', m); if (dl) dl.addEventListener('click', function () { confirmBox('Hủy đơn ' + F.d['Số đơn'] + '?', 'Đơn bị xóa khỏi danh sách, ngày nghỉ trên bảng công tính lại.', 'Hủy đơn', function () { delRow(F.u, 'DON', F.d['Số đơn'], 'hủy đơn ' + F.d['Số đơn'] + ' bởi ' + ccUser()); m.close(); commitEdits(); toast('Đã hủy đơn', 'ok'); }); }); };
  ACTS['np-ok'] = function (a, key) {
    var F = npFind(key); if (!F) return;
    var m = modal('Duyệt đơn nghỉ', F.d['Số đơn'], npInfo(F.u, F.d) + bcWho() + '<div class="link-row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Đóng</button><button class="btn btn-primary" id="npGo">Duyệt đơn</button></div>', true);
    $('#npGo', m).addEventListener('click', function () { editRow(F.u, 'DON', F.d['Số đơn'], { 'Trạng thái': 'Đã duyệt', 'Người duyệt': ccUser(), 'Ngày duyệt': HR.isoToday(), 'Lý do từ chối': '' }, 'duyệt đơn ' + F.d['Số đơn'] + ' bởi ' + ccUser()); m.close(); commitEdits(); var F2 = npFind(key); if (F2) wfPushDon(F2.u, F2.d); toast('Đã duyệt đơn ' + F.d['Số đơn'], 'ok', 'Các ngày nghỉ đã vào Tổng hợp công.'); });
  };
  ACTS['np-no'] = function (a, key) {
    var F = npFind(key); if (!F) return;
    var m = modal('Từ chối đơn nghỉ', F.d['Số đơn'], npInfo(F.u, F.d) + '<div class="field" style="margin-top:12px"><label for="npWhy">Lý do từ chối *</label><input class="input" id="npWhy" maxlength="160"></div>' + bcWho() + '<p id="npMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Đóng</button><button class="btn btn-danger" id="npGo">Từ chối</button></div>', true);
    $('#npGo', m).addEventListener('click', function () { var w = $('#npWhy', m).value.trim(); if (!w) { $('#npMsg', m).textContent = 'Nhập lý do để báo lại cho nhân viên'; return; } editRow(F.u, 'DON', F.d['Số đơn'], { 'Trạng thái': 'Từ chối', 'Người duyệt': ccUser(), 'Ngày duyệt': HR.isoToday(), 'Lý do từ chối': w }, 'từ chối đơn ' + F.d['Số đơn'] + ': ' + w); m.close(); commitEdits(); var F2 = npFind(key); if (F2) wfPushDon(F2.u, F2.d); toast('Đã từ chối đơn ' + F.d['Số đơn'], 'ok'); });
  };
  ACTS['np-new'] = function () {
    var us = selUnits(), R = refDate(), ppl = []; us.forEach(function (u) { var mat = HR.maternitySet(u.data, R); (u.data.NV || []).forEach(function (e) { if (HR.staffState(e, R, mat) !== 'left') ppl.push({ u: u, e: e }); }); });
    var body = '<form id="npF" class="tl-form" novalidate><div class="field"><label for="nWho">Nhân sự *</label><select class="input" id="nWho">' + opt('', 'Chọn nhân sự…', '') + ppl.map(function (x, i) { return opt(i, x.e['Họ và tên'] + ' – ' + x.e['Mã NV'] + (isMulti() ? ' · ' + shortUnit(x.u.name) : ''), ''); }).join('') + '</select></div>' +
      '<div class="field"><label for="nType">Loại nghỉ *</label><select class="input" id="nType">' + NP_TYPES.map(function (t) { return opt(t[0], t[0], 'Nghỉ phép năm'); }).join('') + '</select><small class="faint" id="nTypeH"></small></div>' +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="nFrom">Từ ngày *</label>' + dateInput('nFrom', '') + '</div><div class="field"><label for="nTo">Đến ngày *</label>' + dateInput('nTo', '') + '</div></div>' +
      '<div id="nCalc" class="tl-sinfo"><span class="faint">Chọn nhân sự và ngày nghỉ</span></div>' +
      '<div class="field"><label for="nWhy">Lý do</label><input class="input" id="nWhy" maxlength="200"></div>' +
      '<label class="tl-ro"><input type="checkbox" id="nOk" checked><span>Duyệt luôn (người tạo đơn là quản lý)</span></label>' + bcWho() +
      '<p id="nMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">Tạo đơn</button></div></form>';
    var m = modal('Tạo đơn nghỉ', 'Nhập thay cho nhân viên. Nhân viên tự gửi trên điện thoại khi dùng Chấm công Wi‑Fi', body, true);
    var iso = function (id) { return HR.parseVn($('#' + id, m).value.trim()) || ''; };
    var calc = function () {
      var t = NP_TYPES.filter(function (x) { return x[0] === $('#nType', m).value; })[0]; $('#nTypeH', m).textContent = t ? t[2] : '';
      var x = ppl[$('#nWho', m).value], a = iso('nFrom'), b = iso('nTo') || a, box = $('#nCalc', m); if (!x || !a) { box.innerHTML = '<span class="faint">Chọn nhân sự và ngày nghỉ</span>'; return null; }
      if (b < a) { box.innerHTML = '<span class="down">Đến ngày phải sau Từ ngày</span>'; return null; }
      var n = npWorkDays(x.u, x.e, a, b), h = '<span>Số ngày làm việc nghỉ: <b>' + nfmt(n) + '</b></span><span class="faint">(đã trừ ngày nghỉ tuần, lễ tết theo ca của người này)</span>';
      if (/phép năm/.test($('#nType', m).value)) { var q = npQuota(x.u, x.e, R); h += '<div class="notice' + (q.left - n < 0 ? ' warn' : '') + '">' + ic('np') + '<div>Phép năm còn <b>' + nfmt(q.left) + '</b> → sau đơn này còn <b>' + nfmt(q.left - n) + '</b>' + (q.left - n < 0 ? ' – vượt quỹ phép, phần vượt nên chuyển sang nghỉ không lương' : '') + '</div></div>'; }
      var dup = (x.u.data.DON || []).filter(function (d) { return d['Mã NV'] === x.e['Mã NV'] && d['Trạng thái'] !== 'Từ chối' && String(d['Từ ngày']).slice(0, 10) <= b && String(d['Đến ngày'] || d['Từ ngày']).slice(0, 10) >= a; })[0];
      if (dup) h += '<div class="notice warn">' + ic('info') + '<div>Trùng đơn ' + esc(dup['Số đơn']) + ' (' + esc(dup['Loại nghỉ']) + ', ' + esc(dup['Trạng thái']) + ')</div></div>';
      box.innerHTML = h; return { x: x, a: a, b: b, n: n, dup: dup };
    };
    ['nWho', 'nType'].forEach(function (k) { $('#' + k, m).addEventListener('change', calc); }); ['nFrom', 'nTo'].forEach(function (k) { bindDateInput($('#' + k, m)); $('#' + k, m).addEventListener('input', calc); });
    $('#npF', m).addEventListener('submit', function (e) {
      e.preventDefault(); var r = calc(), msg = $('#nMsg', m); if (!r) { msg.textContent = 'Chọn nhân sự, nhập Từ ngày – Đến ngày dạng dd/mm/yyyy'; return; }
      if (!r.n) { msg.textContent = 'Khoảng ngày này không có ngày làm việc nào'; return; } if (r.dup) { msg.textContent = 'Đã có đơn trùng ngày – xem lại đơn ' + r.dup['Số đơn']; return; }
      var u = r.x.u, y = r.a.slice(0, 4), n = 1, so; do { so = 'DN-' + y + '-' + ('00' + n).slice(-3); n++; } while ((u.data.DON || []).some(function (d) { return String(d['Số đơn']) === so; }));
      var ok = $('#nOk', m).checked, row = { 'Số đơn': so, 'Ngày tạo đơn': HR.isoToday(), 'Mã NV': r.x.e['Mã NV'], 'Họ và tên': r.x.e['Họ và tên'], 'Phòng ban': r.x.e['Phòng ban'] || '', 'Loại nghỉ': $('#nType', m).value, 'Từ ngày': r.a, 'Đến ngày': r.b, 'Số ngày': r.n, 'Lý do': $('#nWhy', m).value.trim(), 'Người duyệt': ok ? ccUser() : '', 'Trạng thái': ok ? 'Đã duyệt' : 'Chờ duyệt', 'Ngày duyệt': ok ? HR.isoToday() : '', 'Nguồn': 'Phần mềm' };
      editRow(u, 'DON', so, row, 'tạo đơn ' + so + ' (' + row['Loại nghỉ'] + ', ' + r.n + ' ngày) bởi ' + ccUser()); m.close(); commitEdits(); toast('Đã tạo đơn ' + so, 'ok', ok ? 'Đơn đã duyệt – các ngày nghỉ đã vào Tổng hợp công.' : 'Đơn đang chờ duyệt.');
    });
  };
  function npRuleHtml() {
    var us = selUnits(); return '<div class="set-grid">' + us.map(function (u) { var L = npRule(ccOf(u)); return '<div class="card card-pad"><div class="card-head"><div><h3>' + esc(shortUnit(u.name)) + '</h3><p>Áp dụng cho người chưa đặt riêng ở bảng Quỹ phép năm</p></div></div><div class="tl-qs"><div class="tl-q"><label>Phép năm cơ bản</label><span class="tl-qi"><select class="input np-rb" data-u="' + u.id + '">' + [[12, '12 ngày – điều kiện bình thường'], [14, '14 ngày – nặng nhọc, độc hại'], [16, '16 ngày – đặc biệt nặng nhọc']].map(function (v) { return opt(v[0], v[1], L.base); }).join('') + '</select></span></div></div></div>'; }).join('') + '</div>' +
      '<div class="notice" style="margin-top:14px">' + ic('info') + '<div><b>Cách phần mềm tính:</b><br>• Phép cơ bản 12 / 14 / 16 ngày làm việc (Điều 113 BLLĐ 2019), cộng 1 ngày cho mỗi đủ 5 năm làm việc (Điều 114).<br>• Vào làm hoặc nghỉ việc trong năm: tính theo số tháng làm việc – tháng vào làm trước ngày 16 được tính cả tháng; (phép năm ÷ 12) × số tháng, phần lẻ từ 0,5 làm tròn lên (Điều 66 NĐ 145/2020). Quy định đầy đủ còn xét số ngày làm việc thực tế trong tháng – trường hợp đặc biệt anh/chị sửa tay ở cột Phép cơ bản.<br>• Đã nghỉ = đơn <b>Nghỉ phép năm</b> đã duyệt, đếm theo ngày làm việc của ca (trừ ngày nghỉ tuần, lễ tết).<br>• Thời gian nghỉ thai sản, nghỉ ốm (tối đa 2 tháng/năm), nghỉ không lương được đồng ý (tối đa 1 tháng/năm) vẫn được tính là thời gian làm việc để tính phép (Điều 65 NĐ 145/2020) – phần mềm chưa trừ các trường hợp vượt mức này.</div></div>';
  }
  function npRuleBind() { $$('.np-rb').forEach(function (el) { el.addEventListener('change', function () { var u = unitById(el.getAttribute('data-u')); npRule(ccOf(u)).base = +el.value; ccSave(u, 'phép năm cơ bản = ' + el.value); toast('Đã lưu', 'ok'); }); }); }

  /* =====================================================================
     BƯỚC 4/4 – CHẤM CÔNG WI‑FI (07/11/2026)
       Anh chốt 11:55: MÁY CHỦ CHẤM CÔNG LÀ NƠI LƯU CHÍNH (Cloudflare Worker + D1 riêng của từng công ty – mã nguồn cham-cong-thu/, bản 0.3.1)
       Phần mềm này kết nối bằng Địa chỉ máy chủ + Mã kết nối (tạo ở trang Quản lý của máy chủ → Cài đặt):
         · đẩy danh sách nhân viên có tài khoản (+ mã PIN ngay lúc cấp / đặt lại PIN), diện không cần chấm công
         · kéo lượt chấm (Wi‑Fi / QR / chấm bổ sung) → Tổng hợp công dùng làm giờ vào – ra (ưu tiên hơn file Excel)
         · kéo đơn nghỉ nhân viên gửi trên điện thoại → Nghỉ phép (chờ duyệt); duyệt / từ chối → báo ngược lại
         · gửi công tạm tính tháng đang mở + công đã chốt để nhân viên xem, xác nhận; kéo kết quả xác nhận
       Lưu trong đơn vị: u.wf = { url, key, at, ten, ver, punches: {ym: [...]}, cong: {ym: {ma: xn}}, sent: {ym: chốt lúc}, noPin: [], log: [] }
       Bản trên web quantritute.com (dữ liệu mẫu): anh chốt dẫn sang bản thử thật chamcong-thu.quantritute.com
     ===================================================================== */
  var WF_DEMO = 'https://chamcong-thu.quantritute.com';
  function wfOn(u) { return !!(u && u.wf && u.wf.url && u.wf.key); }
  function wfLog(u, txt, ok) { var w = u.wf; w.log = w.log || []; w.log.unshift({ at: nowVn(), txt: txt, ok: ok !== false }); if (w.log.length > 30) w.log.length = 30; }
  function wfCall(u, path, body) {
    var w = u.wf; return fetch(w.url.replace(/\/+$/, '') + '/api/sync/' + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ authorization: 'Bearer ' + w.key }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, loi: 'Máy chủ trả lời không đúng (mã ' + r.status + ')' }; }); },
        function () { throw new Error('Không kết nối được máy chủ chấm công. Kiểm tra địa chỉ, mạng Internet' + (location.protocol === 'file:' ? '' : ', hoặc tường lửa của trình duyệt') + '.'); })
      .then(function (j) { if (!j.ok) throw new Error(j.loi || 'Máy chủ báo lỗi'); return j; });
  }
  function wfIso(t) { var d = new Date(t + 7 * 3600e3); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); }
  function wfHM(t) { var d = new Date(t + 7 * 3600e3); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); }
  // lượt chấm 1 tháng → giờ vào đầu tiên, giờ ra cuối cùng mỗi người mỗi ngày
  function wfMap(u, ym) {
    var list = (u.wf && u.wf.punches && u.wf.punches[ym]) || [], o = {};
    list.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (x) {
      var k = x.ma + '|' + wfIso(x.t), r = o[k] || (o[k] = { tin: '', tout: '', n: 0, cach: {}, iso: wfIso(x.t) }); r.n++; r.cach[x.cach] = 1;
      if (x.loai === 'vao') { if (!r.tin) r.tin = wfHM(x.t); } else r.tout = wfHM(x.t);
    });
    return o;
  }
  var WF_CACH = { wifi: 'Wi‑Fi', qr: 'QR', tay: 'chấm bổ sung' };
  function wfPeople(u) {
    var R = HR.isoToday(), mat = HR.maternitySet(u.data, R), s = ccOf(u), out = [];
    (u.data.NV || []).forEach(function (e) {
      var id = e['Mã NV'], ac = (u.acc || {})[id]; if (!id || !ac || ac.st === 'none' || ac.st === 'off') return;
      var left = HR.staffState(e, R, mat) === 'left';
      out.push({ ma: id, ten: e['Họ và tên'] || id, pb: e['Phòng ban'] || '', active: ac.st === 'on' && !left, ncc: ccExc(s, id, e['Phòng ban']).nc });
    });
    return out;
  }
  function wfCongOf(p, tam) { var S0 = p.sum, ng = {}; Object.keys(p.days).forEach(function (dd) { var c = p.days[dd]; if (c.src !== 'out' && c.k) ng[dd] = c.k; }); var r2 = function (v) { return Math.round(v * 100) / 100; }; return { tam: !!tam, cong: r2(S0.work), phep: r2(S0.paid), le: r2(S0.hol), huong: r2(S0.salary), tc: r2(S0.otN + S0.otR + S0.otH), ngay: ng }; }
  function wfSendCong(u, ym, tam) {
    var r = bcMonth(u, ym), ok = {}; wfPeople(u).forEach(function (x) { ok[x.ma] = 1; });
    var list = r.ppl.filter(function (p) { return ok[p.id]; }).map(function (p) { return { ma: p.id, du_lieu: wfCongOf(p, tam) }; });
    if (!list.length) return Promise.resolve(0);
    return wfCall(u, 'cong', { ym: ym, nguoi: ccUser(), list: list }).then(function (j) { if (!tam) { u.wf.sent = u.wf.sent || {}; u.wf.sent[ym] = (bcX(u).lock[ym] || {}).at || nowVn(); } return j.n; });
  }
  function wfPushPin(u, id, pin, e) {
    if (!wfOn(u)) return; e = e || nvIndex(u)[id] || {};
    wfCall(u, 'pin', { ma: id, pin: pin, ten: e['Họ và tên'] || id, pb: e['Phòng ban'] || '' }).then(function () { u.wf.noPin = (u.wf.noPin || []).filter(function (x) { return x !== id; }); wfLog(u, 'Đã gửi mã PIN mới của ' + id + ' lên máy chủ chấm công'); saveUnits(); toast('Đã gửi mã PIN lên máy chủ chấm công', 'ok', id + ' đăng nhập điện thoại bằng mã PIN này.'); },
      function (er) { wfLog(u, 'Chưa gửi được PIN ' + id + ': ' + er.message, false); saveUnits(); toast('Chưa gửi được mã PIN lên máy chủ chấm công', 'err', er.message + ' Đặt lại PIN khi có mạng.'); });
  }
  function wfPushDon(u, d) {
    if (d['Nguồn'] !== 'Điện thoại') return;
    if (wfDemoOn(u)) { wfDemoGet('don-cap-nhat', { list: [{ so: d['Số đơn'], trang_thai: d['Trạng thái'], nguoi_duyet: d['Người duyệt'] || '', ngay_duyet: d['Ngày duyệt'] || '', ly_do_tc: d['Lý do từ chối'] || '', so_ngay: +d['Số ngày'] || null }] }).then(function () { toast('Đã báo kết quả về điện thoại (bản thử)', 'ok', 'Đơn ' + d['Số đơn'] + ': ' + d['Trạng thái']); }, function () { }); return; }
    if (!wfOn(u)) return;
    wfCall(u, 'don-cap-nhat', { list: [{ so: d['Số đơn'], trang_thai: d['Trạng thái'], nguoi_duyet: d['Người duyệt'] || '', ngay_duyet: d['Ngày duyệt'] || '', ly_do_tc: d['Lý do từ chối'] || '', so_ngay: +d['Số ngày'] || null }] })
      .then(function () { wfLog(u, 'Đã báo kết quả đơn ' + d['Số đơn'] + ' (' + d['Trạng thái'] + ') về điện thoại nhân viên'); saveUnits(); }, function (er) { wfLog(u, 'Chưa báo được đơn ' + d['Số đơn'] + ': ' + er.message + ' – sẽ gửi lại khi đồng bộ', false); saveUnits(); });
  }
  // ĐỒNG BỘ 1 công ty
  function wfSync(u) {
    var w = u.wf, today = HR.isoToday(), ymNow = today.slice(0, 7), y = +ymNow.slice(0, 4), m = +ymNow.slice(5, 7) - 1; if (m < 1) { m = 12; y--; }
    var from = y + '-' + p2(m) + '-01', res = { nv: 0, pin: 0, cham: 0, don: 0, kq: 0, cong: 0 };
    return wfCall(u, 'ping').then(function (j) { w.ten = j.ten_cty; w.ver = j.ver; w.cheDo = j.che_do; return wfCall(u, 'nhan-vien', { list: wfPeople(u) }); })
      .then(function (j) { res.nv = j.them + j.sua; w.noPin = j.chua_pin || []; return wfCall(u, 'cham?tu=' + from + '&den=' + today); })
      .then(function (j) {
        var by = {}; j.list.forEach(function (x) { var k = wfIso(x.t).slice(0, 7); (by[k] = by[k] || []).push(x); });
        w.punches = w.punches || {}; [from.slice(0, 7), ymNow].forEach(function (k) { w.punches[k] = by[k] || []; }); res.cham = j.list.length;
        return wfCall(u, 'don?tu=' + ccAdd(today, -62));
      })
      .then(function (j) {
        var local = {}, up = [], nv = nvIndex(u), edited = false; (u.data.DON || []).forEach(function (d) { local[String(d['Số đơn'])] = d; });
        j.list.forEach(function (x) {
          var d = local[x.so];
          if (!d) { if (x.trang_thai === 'Đã hủy') return; var e = nv[x.ma] || {}; editRow(u, 'DON', x.so, { 'Số đơn': x.so, 'Ngày tạo đơn': wfIso(x.tao), 'Mã NV': x.ma, 'Họ và tên': e['Họ và tên'] || x.ma, 'Phòng ban': e['Phòng ban'] || '', 'Loại nghỉ': x.loai, 'Từ ngày': x.tu, 'Đến ngày': x.den, 'Số ngày': npWorkDays(u, e, x.tu, x.den), 'Lý do': x.ly_do || '', 'Người duyệt': x.nguoi_duyet || '', 'Trạng thái': x.trang_thai, 'Ngày duyệt': x.ngay_duyet || '', 'Nguồn': 'Điện thoại' }, 'nhận đơn ' + x.so + ' gửi trên điện thoại'); res.don++; edited = true; return; }
          if (x.trang_thai === 'Đã hủy' && d['Trạng thái'] === 'Chờ duyệt') { editRow(u, 'DON', x.so, { 'Trạng thái': 'Đã hủy' }, 'nhân viên hủy đơn ' + x.so + ' trên điện thoại'); edited = true; return; }
          if ((d['Trạng thái'] === 'Đã duyệt' || d['Trạng thái'] === 'Từ chối') && x.trang_thai !== d['Trạng thái']) up.push({ so: x.so, trang_thai: d['Trạng thái'], nguoi_duyet: d['Người duyệt'] || '', ngay_duyet: d['Ngày duyệt'] || '', ly_do_tc: d['Lý do từ chối'] || '', so_ngay: +d['Số ngày'] || null });
        });
        if (edited) ACACHE.key = null;
        return up.length ? wfCall(u, 'don-cap-nhat', { list: up }).then(function (k) { res.kq = k.n; }) : null;
      })
      .then(function () {
        var X = bcX(u), jobs = [wfSendCong(u, ymNow, !X.lock[ymNow]).then(function (n) { res.cong += n; })];
        Object.keys(X.lock).sort().slice(-2).forEach(function (ym) { if (ym === ymNow || !X.lock[ym].ts || X.lock[ym].ts < (w.since || 0)) return; if (!w.sent || w.sent[ym] !== X.lock[ym].at) jobs.push(wfSendCong(u, ym, false).then(function (n) { res.cong += n; })); });
        return Promise.all(jobs);
      })
      .then(function () { var X = bcX(u); return Promise.all(Object.keys(w.sent || {}).filter(function (ym) { return X.lock[ym]; }).map(function (ym) { return wfCall(u, 'cong-xac-nhan?ym=' + ym).then(function (j) { w.cong = w.cong || {}; var o = w.cong[ym] = {}; j.list.forEach(function (x) { o[x.ma] = { xn: x.xn, at: x.xn_at, ph: x.phan_hoi }; }); }); })); })
      .then(function () {
        w.at = nowVn(); bcX(u).v++; u._bc = {}; u._ccd = null;
        var t = 'Đồng bộ xong: ' + res.nv + ' nhân viên · ' + res.cham + ' lượt chấm · ' + res.don + ' đơn mới' + (res.kq ? ' · báo ' + res.kq + ' kết quả duyệt' : '') + ' · gửi công ' + res.cong + ' người';
        wfLog(u, t); saveUnits(); return { res: res, txt: t };
      }, function (er) { wfLog(u, 'Đồng bộ lỗi: ' + er.message, false); saveUnits(); throw er; });
  }

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
  ACTS['wf-con'] = function (a, uid) {
    var u = unitById(uid), url = $('#wU_' + uid).value.trim().replace(/\/+$/, ''), key = $('#wK_' + uid).value.trim(), msg = $('#wM_' + uid);
    if (!/^https?:\/\/[^\s/]+/.test(url)) { msg.textContent = 'Địa chỉ dạng https://… (lấy ở trang Quản lý của máy chủ)'; return; }
    if (!/^QTT-[0-9A-F]{8,}$/i.test(key)) { msg.textContent = 'Mã kết nối dạng QTT-… (tạo ở trang Quản lý → Cài đặt)'; return; }
    u.wf = Object.assign(u.wf || {}, { url: url, key: key, since: (u.wf && u.wf.url === url && u.wf.since) || Date.now() }); // chỉ gửi xác nhận công cho các tháng chốt SAU khi kết nối msg.textContent = 'Đang kết nối…';
    wfSync(u).then(function (r) { var mb = a.closest('.modal-bg'); if (mb && mb.close) mb.close(); toast('Đã kết nối máy chủ chấm công', 'ok', r.txt); render(); }, function (er) { u.wf.key = ''; saveUnits(); msg.textContent = er.message; });
  };
  ACTS['wf-sync'] = function (a, uid) { var u = unitById(uid); a.disabled = true; toast('Đang đồng bộ…', 'info'); wfSync(u).then(function (r) { toast('Đồng bộ xong', 'ok', r.txt); render(); }, function (er) { toast('Đồng bộ chưa xong', 'err', er.message); render(); }); };
  ACTS['wf-off'] = function (a, uid) { var u = unitById(uid); confirmBox('Ngắt kết nối máy chủ chấm công?', 'Lượt chấm đã lấy về vẫn giữ trong bảng công. Muốn nối lại cần nhập mã kết nối.', 'Ngắt kết nối', function () { u.wf.key = ''; wfLog(u, 'Ngắt kết nối'); saveUnits(); render(); }); };
