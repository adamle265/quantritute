/* ===========================================================================
   QUY TẮC NGHIỆP VỤ – cảnh báo đối chiếu chéo, tổng hợp công, quỹ phép, đối chiếu lương
   Chạy được cả trong trình duyệt và Node (để kiểm thử). Phụ thuộc HR (core.js).
   Căn cứ: Bộ luật Lao động 2019 (Điều 20, 25, 26, 107, 113, 114, 139), Nghị định 145/2020
   (Điều 60–61), Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
   =========================================================================== */
var HRR = (function (HR) {
  'use strict';
  var dnum = HR.dnum, vn = HR.vnDate;
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function isoOf(n) { var d = new Date(n * 86400000); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); }
  function num(v) { var n = +v; return isNaN(n) ? 0 : n; }
  function lastDayOf(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return ym + '-' + p2(new Date(Date.UTC(y, m, 0)).getUTCDate()); }
  function fmtMoney(n) { return Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /* ---------------- Cài đặt mặc định ---------------- */
  var DEF = {
    contractDays: 45,                 // HĐ sắp hết hạn trong N ngày
    probManager: 180, probCollege: 60, probMid: 30, probOther: 6,   // Điều 25 (ngày; "khác" = ngày làm việc)
    managerTitles: 'Giám đốc, Phó Giám đốc, Kế toán trưởng',
    probMinPct: 85,                   // Điều 26
    lookbackDays: 365,                // chỉ xét thử việc ký trong N ngày gần đây
    leavePendingSoon: 3,              // đơn chờ duyệt: nhắc trước N ngày
    leaveLow: 1,                      // còn ≤ N ngày phép
    leaveDiff: 0.5,
    otMonthWarn: 36, otMonthMax: 40, otYearMax: 200, otDayMax: 4,   // Điều 107: 40 giờ/tháng; 200 (hoặc 300) giờ/năm; ≤ 50% giờ làm bình thường/ngày
    maternityDays: 30,
    bhCoRate: 21.5,                   // % bảo hiểm công ty đóng trên lương đóng BH (BHXH 17,5 + BHYT 3 + BHTN 1) – sửa được
    payDiffDays: 0.5, payDiffOt: 1,
    retentionMonths: 0,               // 0 = chưa đặt thời hạn lưu hồ sơ người đã nghỉ
    workCodes: 'X, CT, TB', paidLeaveCodes: 'P, R', holidayCodes: 'L', leaveCodes: 'P, R, Ô, TS, KL',
    sundayIsOt: true,                 // đi làm Chủ nhật = tăng ca, không tính ngày công
    lateTimes: 3,
    off: {}                           // loại cảnh báo đang tắt
  };
  function codes(s) { var o = {}; String(s || '').split(/[,;\s]+/).forEach(function (c) { if (c) o[c.trim().toUpperCase()] = 1; }); return o; }
  function isSunday(iso) { var n = dnum(iso); return n !== null && new Date(n * 86400000).getUTCDay() === 0; }

  /* ---------------- Tiện ích hợp đồng ---------------- */
  var TV = 'Hợp đồng thử việc';
  function isFixed(t) { t = String(t || ''); return /xác định thời hạn/i.test(t) && !/không xác định/i.test(t); }
  function isIndef(t) { return /không xác định/i.test(String(t || '')); }
  function isProb(t) { return /thử việc/i.test(String(t || '')); }
  function signedNum(h) { var k = dnum(h['Ngày ký']); return k !== null ? k : dnum(h['Ngày hiệu lực']); }
  function contractsOf(d) {
    var by = {};
    d.HD.forEach(function (h) { (by[h['Mã NV']] = by[h['Mã NV']] || []).push(h); });
    Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return (dnum(a['Ngày hiệu lực']) || 0) - (dnum(b['Ngày hiệu lực']) || 0); }); });
    return by;
  }
  // HĐ mới nhất đã ký tính đến ngày r (số ngày)
  function currentContract(list, r) {
    var s = (list || []).filter(function (h) { var k = signedNum(h); return k === null || k <= r; });
    return s.length ? s[s.length - 1] : null;
  }
  function contractState(h, r) {
    if (!h) return '';
    var hl = dnum(h['Ngày hiệu lực']), het = dnum(h['Ngày hết hạn']), cd = dnum(h['Ngày chấm dứt']);
    if (cd !== null && cd < r) return 'Đã chấm dứt';
    if (hl !== null && hl > r) return 'Chưa hiệu lực';
    if (het !== null && het < r) return 'Đã hết hạn';
    return 'Đang hiệu lực';
  }
  // gợi ý lần ký tới cho HĐ hiện tại
  function nextSign(list, cur) {
    if (!cur) return '';
    if (isIndef(cur['Loại hợp đồng'])) return '';
    var fixed = list.filter(function (h) { return isFixed(h['Loại hợp đồng']) && signedNum(h) <= signedNum(cur); }).length;
    if (isProb(cur['Loại hợp đồng'])) return 'Ký HĐ lao động (xác định hoặc không xác định thời hạn)';
    if (fixed >= 2) return 'Bắt buộc HĐ không xác định thời hạn';
    return 'Được ký thêm 1 lần HĐ xác định thời hạn';
  }
  // lương cơ bản đang hiệu lực tại ngày r: ưu tiên HĐ thử việc đang hiệu lực, rồi quyết định lương
  function salaryAt(id, r, byHd, byLs) {
    var tv = (byHd[id] || []).filter(function (h) { return isProb(h['Loại hợp đồng']) && dnum(h['Ngày hiệu lực']) <= r && (dnum(h['Ngày hết hạn']) === null || dnum(h['Ngày hết hạn']) >= r); })[0];
    if (tv) return { amount: num(tv['Mức lương theo HĐ']), src: 'HĐ thử việc ' + (tv['Số hợp đồng'] || '') };
    var ls = (byLs[id] || []).filter(function (x) { return dnum(x['Ngày hiệu lực']) !== null && dnum(x['Ngày hiệu lực']) <= r; });
    if (ls.length) { var x = ls[ls.length - 1]; return { amount: num(x['Lương mới']), src: 'Quyết định ' + (x['Số quyết định'] || 'khởi điểm') + ' hiệu lực ' + vn(x['Ngày hiệu lực']) }; }
    var c = currentContract(byHd[id], r); if (c && c['Mức lương theo HĐ']) return { amount: num(c['Mức lương theo HĐ']), src: 'HĐ ' + (c['Số hợp đồng'] || '') };
    return null;
  }
  function lsOf(d) {
    var by = {};
    d.LS.forEach(function (x) { (by[x['Mã NV']] = by[x['Mã NV']] || []).push(x); });
    Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return (dnum(a['Ngày hiệu lực']) || 0) - (dnum(b['Ngày hiệu lực']) || 0); }); });
    return by;
  }

  /* ---------------- Tổng hợp chấm công 1 tháng ---------------- */
  function ccSummary(rows, cfg) {
    cfg = cfg || DEF;
    var W = codes(cfg.workCodes), out = {}, order = [];
    rows.forEach(function (x) {
      var id = x['Mã NV']; if (!id) return;
      var o = out[id];
      if (!o) { o = out[id] = { id: id, name: x['Họ và tên'], dept: x['Phòng ban'], to: x['Tổ'], work: 0, sundayWork: 0, codes: {}, late: 0, lateMin: 0, ot: 0, otDays: 0, days: {} }; order.push(id); }
      var k = String(x['Ký hiệu'] || '').toUpperCase();
      o.codes[k] = (o.codes[k] || 0) + 1;
      var sun = cfg.sundayIsOt && (x['Thứ'] === 'Chủ nhật' || isSunday(x['Ngày']));
      if (W[k]) { if (sun) o.sundayWork++; else o.work++; }
      var lm = num(x['Đi muộn (phút)']); if (lm > 0) { o.late++; o.lateMin += lm; }
      var ot = num(x['Giờ tăng ca']); if (ot > 0) { o.ot += ot; o.otDays++; }
      if (x['Ngày']) o.days[String(x['Ngày']).slice(8, 10)] = k;
    });
    return order.map(function (k) { return out[k]; });
  }
  function ccRange(rows) { var a = null, b = null; rows.forEach(function (x) { var d = x['Ngày']; if (!d) return; if (!a || d < a) a = d; if (!b || d > b) b = d; }); return { from: a, to: b }; }

  /* ---------------- Quỹ phép tính lại ---------------- */
  function leaveRecalc(d, R) {
    var r = dnum(R), year = R.slice(0, 4), used = {};
    d.DON.forEach(function (x) {
      if (x['Trạng thái'] !== 'Đã duyệt' || x['Loại nghỉ'] !== 'Nghỉ phép năm') return;
      if (!x['Từ ngày'] || String(x['Từ ngày']).slice(0, 4) !== year || dnum(x['Từ ngày']) > r) return;
      used[x['Mã NV']] = (used[x['Mã NV']] || 0) + num(x['Số ngày']);
    });
    return d.QP.map(function (q) {
      var totKey = Object.keys(q).filter(function (k) { return /^Tổng phép năm/.test(k); })[0];
      var tot = num(q[totKey]), fileUsed = num(q['Đã nghỉ']), calc = used[q['Mã NV']] || 0;
      return { q: q, total: tot, fileUsed: fileUsed, fileLeft: num(q['Còn lại']), calcUsed: calc, calcLeft: tot - calc, diff: Math.round((calc - fileUsed) * 10) / 10 };
    });
  }

  /* ---------------- Đối chiếu bảng lương với chấm công & quyết định lương ---------------- */
  function payrollCheck(d, ym, cfg) {
    cfg = cfg || DEF;
    var bl = d.BL[ym] || [], cc = d.CC[ym], P = codes(cfg.paidLeaveCodes), res = {}, byHd = contractsOf(d), byLs = lsOf(d);
    var sum = cc ? ccSummary(cc, cfg) : [], sm = {}; sum.forEach(function (s) { sm[s.id] = s; });
    var range = cc ? ccRange(cc) : null, end = dnum(lastDayOf(ym)), start = dnum(ym + '-01');
    bl.forEach(function (x) {
      var id = x['Mã NV'], issues = [];
      if (cc) {
        var s = sm[id];
        if (!s) issues.push({ k: 'nocc', t: 'Có trên bảng lương nhưng không có chấm công tháng này' });
        else {
          var dw = num(x['Ngày công thực tế']) - s.work;
          if (Math.abs(dw) >= cfg.payDiffDays) issues.push({ k: 'cong', t: 'Ngày công: bảng lương ' + num(x['Ngày công thực tế']) + ', chấm công ' + s.work + ' (' + (dw > 0 ? 'nhiều hơn ' : 'ít hơn ') + Math.abs(dw) + ')', diff: dw });
          var otBl = num(x['Giờ tăng ca ngày thường']) + num(x['Giờ tăng ca Chủ nhật']);
          if (('Giờ tăng ca ngày thường' in x) && Math.abs(otBl - s.ot) >= cfg.payDiffOt) issues.push({ k: 'ot', t: 'Giờ tăng ca: bảng lương ' + otBl + ', chấm công ' + s.ot });
          var pl = 0; Object.keys(P).forEach(function (c) { pl += s.codes[c] || 0; });
          if (('Nghỉ phép/việc riêng có lương' in x) && Math.abs(num(x['Nghỉ phép/việc riêng có lương']) - pl) >= cfg.payDiffDays) issues.push({ k: 'phep', t: 'Ngày nghỉ có lương: bảng lương ' + num(x['Nghỉ phép/việc riêng có lương']) + ', chấm công ' + pl });
        }
      }
      // lương cơ bản so với mức đang hiệu lực (chấp nhận mức cũ hoặc mới nếu đổi giữa tháng)
      if ('Lương cơ bản' in x) {
        var a = salaryAt(id, start, byHd, byLs), b = salaryAt(id, end, byHd, byLs), v = num(x['Lương cơ bản']);
        if ((a || b) && !(a && a.amount === v) && !(b && b.amount === v)) issues.push({ k: 'luong', t: 'Lương cơ bản ' + fmtMoney(v) + ' khác mức đang hiệu lực ' + fmtMoney((b || a).amount) + ' (' + (b || a).src + ')' });
      }
      res[id] = issues;
    });
    var missing = cc ? sum.filter(function (s) { return !bl.some(function (x) { return x['Mã NV'] === s.id; }) && s.work > 0; }).map(function (s) { return s.id; }) : [];
    var short = range && range.to && range.to < lastDayOf(ym) ? range.to : null;
    return { byId: res, missing: missing, ccTo: short, hasCc: !!cc };
  }

  /* ---------------- BỘ CẢNH BÁO ---------------- */
  var KINDS = {
    hd_soon: { name: 'Hợp đồng/thử việc sắp hết hạn', law: 'BLLĐ 2019 Điều 20' },
    hd_expired: { name: 'HĐ đã hết hạn, chưa ký mới', law: 'BLLĐ 2019 Điều 20 khoản 2' },
    hd_indef: { name: 'Lần ký tới bắt buộc HĐ không xác định thời hạn', law: 'BLLĐ 2019 Điều 20 khoản 2' },
    tv_long: { name: 'Thử việc vượt khung thời gian', law: 'BLLĐ 2019 Điều 25' },
    tv_pay: { name: 'Lương thử việc dưới 85%', law: 'BLLĐ 2019 Điều 26' },
    no_hd: { name: 'Đang làm mà không có HĐ hiệu lực', law: '' },
    don_pending: { name: 'Đơn nghỉ chờ duyệt', law: 'Quy chế công ty' },
    phep_low: { name: 'Hết / sắp hết phép năm', law: 'BLLĐ 2019 Điều 113, 114' },
    phep_diff: { name: 'Quỹ phép lệch đơn đã duyệt', law: '' },
    ot: { name: 'Tăng ca gần / vượt trần', law: 'BLLĐ 2019 Điều 107; NĐ 145/2020 Điều 60–61' },
    nghi_don: { name: 'Ngày nghỉ không khớp đơn', law: '' },
    ts_back: { name: 'Thai sản sắp quay lại / đã hết', law: 'BLLĐ 2019 Điều 139' },
    luong_cc: { name: 'Bảng lương lệch chấm công', law: '' },
    luong_cb: { name: 'Lương cơ bản khác mức hiệu lực', law: '' },
    ho_so: { name: 'Hồ sơ thiếu / người nghỉ việc còn công, lương', law: '' },
    luu_tru: { name: 'Thời hạn lưu hồ sơ người đã nghỉ', law: 'Luật BVDLCN 91/2025/QH15' },
    sinh_nhat: { name: 'Sinh nhật trong tháng', law: '', light: true },
    di_muon: { name: 'Đi muộn nhiều lần', law: '', light: true },
    dinh_bien: { name: 'Phòng ban vượt định biên', law: '', light: true }
  };
  var LV = { gap: 'Gấp', canh: 'Cần xử lý', nhac: 'Theo dõi' };

  function alerts(unit, R, cfg) {
    cfg = Object.assign({}, DEF, cfg || {});
    var d = unit.data, r = dnum(R), out = [], off = cfg.off || {};
    var nvById = {}; d.NV.forEach(function (e) { nvById[e['Mã NV']] = e; });
    var mat = HR.maternitySet(d, R), byHd = contractsOf(d), byLs = lsOf(d);
    var active = function (id) { var e = nvById[id]; return e && HR.isActive(e, R, mat); };
    function push(kind, level, id, title, detail, extra) {
      if (off[kind]) return;
      var e = nvById[id] || {};
      out.push(Object.assign({ kind: kind, level: level, id: id || '', name: e['Họ và tên'] || '', dept: e['Phòng ban'] || '', unit: unit.name, unitId: unit.id,
        title: title, detail: detail || '', key: unit.id + '|' + kind + '|' + (id || '') + '|' + ((extra && extra.k) || ''), days: null, sources: [] }, extra || {}));
    }
    var mgr = codes(cfg.managerTitles.replace(/,\s*/g, ',').toUpperCase().replace(/ /g, '_'));
    function probLimit(e) {
      var cv = String(e['Chức vụ'] || '').toUpperCase().replace(/ /g, '_');
      if (mgr[cv]) return { n: cfg.probManager, t: 'người quản lý doanh nghiệp', wd: false };
      var td = String(e['Trình độ'] || '');
      if (/đại học|cao đẳng|thạc sĩ|tiến sĩ/i.test(td)) return { n: cfg.probCollege, t: 'chức danh cần trình độ cao đẳng trở lên', wd: false };
      if (/trung cấp|công nhân kỹ thuật/i.test(td)) return { n: cfg.probMid, t: 'trình độ trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ', wd: false };
      return { n: cfg.probOther, t: 'công việc khác (ngày làm việc)', wd: true };
    }
    function workDays(a, b) { var n = 0; for (var x = a; x <= b; x++) if (new Date(x * 86400000).getUTCDay() !== 0) n++; return n; }

    // 1–6: hợp đồng
    Object.keys(nvById).forEach(function (id) {
      var e = nvById[id]; if (!active(id)) return;
      var list = byHd[id] || [], cur = currentContract(list, r);
      if (!cur) { push('no_hd', 'gap', id, 'Chưa có hợp đồng nào', 'Đang làm từ ' + vn(e['Ngày vào làm']) + ' nhưng sổ hợp đồng không có HĐ nào đã ký.', { sources: ['Hồ sơ', 'Sổ hợp đồng'] }); return; }
      var st = contractState(cur, r), exp = dnum(cur['Ngày hết hạn']);
      var hdTxt = cur['Loại hợp đồng'] + (cur['Số hợp đồng'] ? ' số ' + cur['Số hợp đồng'] : '');
      if (st === 'Đã hết hạn') {
        var lastCc = null; Object.keys(d.CC).forEach(function (m) { d.CC[m].forEach(function (x) { if (x['Mã NV'] === id && /^(X|CT)$/i.test(String(x['Ký hiệu'])) && dnum(x['Ngày']) > exp) lastCc = !lastCc || x['Ngày'] > lastCc ? x['Ngày'] : lastCc; }); });
        var over = r - exp;
        push('hd_expired', 'gap', id, hdTxt + ' đã hết hạn ' + over + ' ngày', 'Hết hạn ' + vn(cur['Ngày hết hạn']) + (lastCc ? ', vẫn có chấm công đi làm đến ' + vn(lastCc) : ', người này vẫn ở trạng thái đang làm') + '. ' + (over > 30 ? 'Đã quá 30 ngày: theo Điều 20 khoản 2, HĐ xác định thời hạn đã trở thành HĐ không xác định thời hạn – cần ký lại cho đúng.' : 'Phải ký HĐ mới trong 30 ngày kể từ ngày hết hạn (còn ' + (30 - over) + ' ngày).'), { days: -over, due: cur['Ngày hết hạn'], k: cur['Số hợp đồng'], sources: ['Sổ hợp đồng', 'Chấm công'] });
      } else if (st === 'Đã chấm dứt') {
        push('no_hd', 'gap', id, 'HĐ gần nhất đã chấm dứt', hdTxt + ' chấm dứt ' + vn(cur['Ngày chấm dứt']) + ' nhưng hồ sơ vẫn ghi đang làm.', { sources: ['Hồ sơ', 'Sổ hợp đồng'] });
      } else if (exp !== null && st === 'Đang hiệu lực') {
        var left = exp - r, ns = nextSign(list, cur);
        if (left <= cfg.contractDays) push('hd_soon', left <= 15 ? 'gap' : 'canh', id, hdTxt + ' hết hạn sau ' + left + ' ngày', 'Hết hạn ' + vn(cur['Ngày hết hạn']) + '. Lần ký tới: ' + ns + '.', { days: left, due: cur['Ngày hết hạn'], k: cur['Số hợp đồng'], sources: ['Sổ hợp đồng'] });
        if (ns === 'Bắt buộc HĐ không xác định thời hạn') push('hd_indef', left <= cfg.contractDays ? 'canh' : 'nhac', id, 'Đã ký đủ 2 HĐ xác định thời hạn', 'HĐ hiện tại ' + hdTxt + ' hết hạn ' + vn(cur['Ngày hết hạn']) + '. Nếu tiếp tục làm việc, lần ký tới bắt buộc là HĐ không xác định thời hạn (Điều 20 khoản 2).', { days: left, due: cur['Ngày hết hạn'], k: cur['Số hợp đồng'], sources: ['Sổ hợp đồng'] });
      }
      // thử việc: thời gian & lương (chỉ xét HĐ thử việc ký trong khoảng gần đây)
      list.filter(function (h) { return isProb(h['Loại hợp đồng']) && signedNum(h) <= r && r - signedNum(h) <= cfg.lookbackDays; }).forEach(function (h) {
        var a = dnum(h['Ngày hiệu lực']), b = dnum(h['Ngày hết hạn']);
        if (a !== null && b !== null) {
          var lim = probLimit(e), len = lim.wd ? workDays(a, b) : b - a + 1;
          if (len > lim.n) push('tv_long', 'canh', id, 'Thử việc ' + len + (lim.wd ? ' ngày làm việc' : ' ngày') + ', vượt khung ' + lim.n, 'HĐ ' + (h['Số hợp đồng'] || '') + ' từ ' + vn(h['Ngày hiệu lực']) + ' đến ' + vn(h['Ngày hết hạn']) + '. Trình độ "' + (e['Trình độ'] || '?') + '", chức vụ "' + (e['Chức vụ'] || '?') + '" → khung ' + lim.t + ' tối đa ' + lim.n + ' ngày (Điều 25).', { k: h['Số hợp đồng'], sources: ['Sổ hợp đồng', 'Hồ sơ'] });
        }
        var base = null, bsrc = '';
        var ls0 = (byLs[id] || []).filter(function (x) { return x['Ngày hiệu lực'] === h['Ngày hiệu lực'] || (/khởi điểm/i.test(x['Lý do'] || '') && Math.abs(dnum(x['Ngày hiệu lực']) - a) <= 31); })[0];
        if (ls0) { base = num(ls0['Lương mới']); bsrc = 'lương khởi điểm theo quyết định ' + vn(ls0['Ngày hiệu lực']); }
        else { var nx = list.filter(function (x) { return !isProb(x['Loại hợp đồng']) && dnum(x['Ngày hiệu lực']) > a; })[0]; if (nx) { base = num(nx['Mức lương theo HĐ']); bsrc = 'lương HĐ chính thức ' + (nx['Số hợp đồng'] || ''); } }
        var tvPay = num(h['Mức lương theo HĐ']);
        var ongoing = b === null || b >= r;
        if (base && tvPay && tvPay < base * cfg.probMinPct / 100 - 0.5) push('tv_pay', ongoing ? 'gap' : 'canh', id, 'Lương thử việc ' + fmtMoney(tvPay) + ' < ' + cfg.probMinPct + '% (' + fmtMoney(Math.ceil(base * cfg.probMinPct / 100)) + ')', 'HĐ ' + (h['Số hợp đồng'] || '') + ': ' + fmtMoney(tvPay) + ' = ' + (tvPay / base * 100).toFixed(1).replace('.', ',') + '% của ' + fmtMoney(base) + ' (' + bsrc + '). Điều 26: ít nhất 85% mức lương của công việc đó.' + (ongoing ? ' Đang thử việc – điều chỉnh trước kỳ lương tới.' : ' Thử việc đã kết thúc – xem xét truy trả phần chênh lệch.'), { k: h['Số hợp đồng'], sources: ['Sổ hợp đồng', 'Lịch sử lương'] });
      });
    });

    // 7: đơn chờ duyệt
    d.DON.forEach(function (x) {
      if (x['Trạng thái'] !== 'Chờ duyệt') return;
      var days = x['Từ ngày'] ? dnum(x['Từ ngày']) - r : null;
      var lv = days === null ? 'canh' : days < 0 ? 'gap' : days <= cfg.leavePendingSoon ? 'gap' : 'canh';
      push('don_pending', lv, x['Mã NV'], (x['Loại nghỉ'] || 'Đơn nghỉ') + ' ' + (x['Số ngày'] || '') + ' ngày – ' + (days === null ? 'chờ duyệt' : days < 0 ? 'đã qua ngày nghỉ ' + (-days) + ' ngày' : 'nghỉ sau ' + days + ' ngày'),
        'Đơn ' + (x['Số đơn'] || '') + ' từ ' + vn(x['Từ ngày']) + ' đến ' + vn(x['Đến ngày']) + ', người duyệt: ' + (x['Người duyệt'] || '?') + (x['Lý do'] ? '. Lý do: ' + x['Lý do'] : '') + '.', { days: days, due: x['Từ ngày'], k: x['Số đơn'], sources: ['Đơn nghỉ phép'] });
    });
    // 8–9: quỹ phép
    leaveRecalc(d, R).forEach(function (q) {
      var id = q.q['Mã NV']; if (!active(id)) return;
      if (q.fileLeft <= cfg.leaveLow) push('phep_low', q.fileLeft < 0 ? 'gap' : 'canh', id, q.fileLeft < 0 ? 'Âm ' + (-q.fileLeft) + ' ngày phép' : 'Còn ' + q.fileLeft + ' ngày phép năm', 'Tổng phép năm ' + q.total + ', đã nghỉ ' + q.fileUsed + ' (theo file quỹ phép).', { sources: ['Quỹ phép năm'] });
      if (Math.abs(q.diff) >= cfg.leaveDiff) push('phep_diff', 'canh', id, 'Quỹ phép ghi đã nghỉ ' + q.fileUsed + ', đơn đã duyệt là ' + q.calcUsed + ' ngày', 'Tổng các đơn "Nghỉ phép năm" đã duyệt có ngày nghỉ đến ' + vn(R) + ' là ' + q.calcUsed + ' ngày. Có thể file quỹ phép chưa cập nhật hoặc đơn bị nhập sai.', { sources: ['Quỹ phép năm', 'Đơn nghỉ phép'] });
    });
    // 10: tăng ca (tháng của ngày tham chiếu hoặc tháng chấm công gần nhất; cả năm)
    var ccMonths = Object.keys(d.CC).filter(function (m) { return m <= R.slice(0, 7); });
    var curM = ccMonths.length ? ccMonths[ccMonths.length - 1] : null, year = R.slice(0, 4), yearOt = {};
    Object.keys(d.CC).forEach(function (m) { if (m.slice(0, 4) !== year || m > R.slice(0, 7)) return; d.CC[m].forEach(function (x) { var o = num(x['Giờ tăng ca']); if (o) yearOt[x['Mã NV']] = (yearOt[x['Mã NV']] || 0) + o; }); });
    ccMonths.filter(function (m) { return m.slice(0, 4) === year; }).forEach(function (m) {
      ccSummary(d.CC[m], cfg).forEach(function (s) {
        if (s.ot > cfg.otMonthMax) push('ot', 'gap', s.id, 'Tăng ca ' + s.ot + ' giờ tháng ' + HR.ymLabel(m) + ' – vượt ' + cfg.otMonthMax + ' giờ', 'Điều 107: không quá ' + cfg.otMonthMax + ' giờ trong 1 tháng.', { k: m, sources: ['Chấm công ' + HR.ymLabel(m)] });
        else if (m === curM && s.ot >= cfg.otMonthWarn) push('ot', 'canh', s.id, 'Tăng ca ' + s.ot + ' giờ tháng ' + HR.ymLabel(m) + ' – gần trần ' + cfg.otMonthMax + ' giờ', 'Còn ' + (cfg.otMonthMax - s.ot) + ' giờ trước khi chạm trần tháng (Điều 107).', { k: m, sources: ['Chấm công ' + HR.ymLabel(m)] });
      });
      d.CC[m].forEach(function (x) {
        var o = num(x['Giờ tăng ca']), lt = x['Loại tăng ca']; if (!o) return;
        if (lt && !/thường/i.test(lt)) return;                 // giới hạn 50%/ngày chỉ xét ngày làm việc bình thường
        if (!lt && isSunday(x['Ngày'])) return;
        if (o > cfg.otDayMax) push('ot', 'canh', x['Mã NV'], 'Tăng ca ' + o + ' giờ ngày ' + vn(x['Ngày']) + ' – vượt ' + cfg.otDayMax + ' giờ/ngày', 'Điều 107: giờ làm thêm không quá 50% giờ làm bình thường trong ngày.', { k: x['Ngày'], sources: ['Chấm công ' + HR.ymLabel(m)] });
      });
    });
    Object.keys(yearOt).forEach(function (id) {
      var t = yearOt[id];
      if (t > cfg.otYearMax) push('ot', 'gap', id, 'Tăng ca ' + t + ' giờ năm ' + year + ' – vượt ' + cfg.otYearMax + ' giờ', 'Trần năm đang đặt ' + cfg.otYearMax + ' giờ (200 giờ, hoặc 300 giờ với ngành/công việc theo Điều 61 Nghị định 145/2020 – đổi trong Cài đặt).', { k: 'nam' + year, sources: ['Chấm công'] });
      else if (t >= cfg.otYearMax * 0.9) push('ot', 'canh', id, 'Tăng ca ' + t + ' giờ năm ' + year + ' – gần trần ' + cfg.otYearMax + ' giờ', 'Tính theo các tháng chấm công đã có.', { k: 'nam' + year, sources: ['Chấm công'] });
    });
    // 11: ngày nghỉ không khớp đơn
    var appr = {}, anyDon = d.DON.length > 0;
    d.DON.forEach(function (x) { if (x['Trạng thái'] !== 'Đã duyệt') return; var a = dnum(x['Từ ngày']), b = dnum(x['Đến ngày']); if (a === null) return; if (b === null) b = a; for (var t = a; t <= b; t++) appr[x['Mã NV'] + '|' + t] = x; });
    if (anyDon) {
      var LC = codes(cfg.leaveCodes), W = codes(cfg.workCodes), mis = {};
      Object.keys(d.CC).forEach(function (m) {
        d.CC[m].forEach(function (x) {
          var k = String(x['Ký hiệu'] || '').toUpperCase(), t = dnum(x['Ngày']); if (t === null || t > r) return;
          var has = appr[x['Mã NV'] + '|' + t];
          var key = x['Mã NV'] + '|' + m;
          if (LC[k] && !has) (mis[key] = mis[key] || { a: [], b: [], m: m, id: x['Mã NV'] }).a.push(vn(x['Ngày']) + ' (' + k + ')');
          if (W[k] && has && !(cfg.sundayIsOt && isSunday(x['Ngày']))) (mis[key] = mis[key] || { a: [], b: [], m: m, id: x['Mã NV'] }).b.push(vn(x['Ngày']));
        });
      });
      Object.keys(mis).forEach(function (k) {
        var o = mis[k];
        push('nghi_don', 'canh', o.id, 'Tháng ' + HR.ymLabel(o.m) + ': ' + (o.a.length ? o.a.length + ' ngày nghỉ không có đơn duyệt' : '') + (o.a.length && o.b.length ? ' · ' : '') + (o.b.length ? o.b.length + ' ngày có đơn nghỉ nhưng chấm đi làm' : ''),
          (o.a.length ? 'Chấm nghỉ nhưng không có đơn đã duyệt: ' + o.a.join(', ') + '. ' : '') + (o.b.length ? 'Có đơn nghỉ đã duyệt nhưng chấm X: ' + o.b.join(', ') + '.' : ''), { k: o.m, sources: ['Chấm công ' + HR.ymLabel(o.m), 'Đơn nghỉ phép'] });
      });
    }
    // 12: thai sản
    d.DON.forEach(function (x) {
      if (x['Loại nghỉ'] !== 'Nghỉ thai sản' || x['Trạng thái'] !== 'Đã duyệt' || !x['Đến ngày']) return;
      var e = nvById[x['Mã NV']]; if (!e || HR.staffState(e, R, null) === 'left') return;
      var end = dnum(x['Đến ngày']), left = end - r;
      if (left >= 0 && left <= cfg.maternityDays) push('ts_back', 'canh', x['Mã NV'], 'Hết thai sản ' + vn(x['Đến ngày']) + ', đi làm lại từ ' + vn(isoOf(end + 1)), 'Còn ' + left + ' ngày. Chuẩn bị bố trí công việc, cập nhật trạng thái hồ sơ, chấm công và báo tăng lại BHXH.', { days: left, due: x['Đến ngày'], k: x['Số đơn'], sources: ['Đơn nghỉ phép', 'Hồ sơ'] });
      else if (left < 0 && e['Trạng thái'] === 'Nghỉ thai sản') push('ts_back', 'canh', x['Mã NV'], 'Đã hết thai sản từ ' + vn(x['Đến ngày']) + ' nhưng hồ sơ vẫn ghi "Nghỉ thai sản"', 'Cập nhật trạng thái trong danh sách nhân viên.', { days: left, k: x['Số đơn'], sources: ['Đơn nghỉ phép', 'Hồ sơ'] });
    });
    // 13–14: bảng lương
    Object.keys(d.BL).filter(function (m) { return m <= R.slice(0, 7); }).forEach(function (m) {
      var pc = payrollCheck(d, m, cfg), cong = [], other = [];
      Object.keys(pc.byId).forEach(function (id) {
        pc.byId[id].forEach(function (is) {
          if (is.k === 'luong') push('luong_cb', 'gap', id, 'Bảng lương ' + HR.ymLabel(m) + ': ' + is.t.split(' (')[0], is.t + '.', { k: m, sources: ['Bảng lương ' + HR.ymLabel(m), 'Sổ hợp đồng', 'Lịch sử lương'] });
          else if (is.k === 'cong') cong.push({ id: id, diff: is.diff, t: is.t }); else other.push({ id: id, t: is.t });
        });
      });
      if (cong.length) {
        var g = {}; cong.forEach(function (c) { g[c.diff] = (g[c.diff] || 0) + 1; });
        var gtxt = Object.keys(g).map(function (k) { return g[k] + ' người ' + (k > 0 ? 'nhiều hơn ' : 'ít hơn ') + Math.abs(k) + ' ngày'; }).join('; ');
        push('luong_cc', 'gap', '', 'Bảng lương ' + HR.ymLabel(m) + ': ' + cong.length + ' người lệch ngày công so với chấm công', 'Ngày công trên bảng lương so với chấm công: ' + gtxt + '.' + (pc.ccTo ? ' Chấm công tháng này chỉ có dữ liệu đến ' + vn(pc.ccTo) + ' – có thể bảng lương đã tính trước cho các ngày cuối tháng.' : ''), { k: m + '|cong', people: cong.map(function (c) { return c.id; }), sources: ['Bảng lương ' + HR.ymLabel(m), 'Chấm công ' + HR.ymLabel(m)] });
      }
      other.forEach(function (o) { push('luong_cc', 'canh', o.id, 'Bảng lương ' + HR.ymLabel(m) + ': ' + o.t, '', { k: m + '|' + o.t.slice(0, 12), sources: ['Bảng lương ' + HR.ymLabel(m), 'Chấm công ' + HR.ymLabel(m)] }); });
      if (pc.missing.length) push('luong_cc', 'gap', '', 'Bảng lương ' + HR.ymLabel(m) + ': ' + pc.missing.length + ' người có đi làm nhưng không có trên bảng lương', 'Mã NV: ' + pc.missing.join(', '), { k: m + '|thieu', people: pc.missing, sources: ['Bảng lương ' + HR.ymLabel(m), 'Chấm công ' + HR.ymLabel(m)] });
    });
    // 15: hồ sơ thiếu; người nghỉ việc còn công/lương
    var left = {}; d.NV.forEach(function (e) { if (HR.staffState(e, R, mat) === 'left') left[e['Mã NV']] = e; });
    d.NV.forEach(function (e) {
      if (!active(e['Mã NV'])) return;
      var miss = ['Số sổ BHXH', 'Số tài khoản', 'Ngân hàng', 'Số CCCD/Mã số thuế', 'Ngày sinh'].filter(function (c) { return (c in e) && !e[c]; });
      if (miss.length) push('ho_so', 'canh', e['Mã NV'], 'Hồ sơ thiếu: ' + miss.join(', '), 'Bổ sung trong danh sách nhân viên.', { sources: ['Hồ sơ'] });
    });
    Object.keys(d.BL).forEach(function (m) { d.BL[m].forEach(function (x) { var e = left[x['Mã NV']]; if (e && e['Ngày nghỉ việc'] && e['Ngày nghỉ việc'] < m + '-01') push('ho_so', 'gap', x['Mã NV'], 'Đã nghỉ việc ' + vn(e['Ngày nghỉ việc']) + ' nhưng có trên bảng lương ' + HR.ymLabel(m), '', { k: 'bl' + m, sources: ['Hồ sơ', 'Bảng lương'] }); }); });
    Object.keys(d.CC).forEach(function (m) { var seen = {}; d.CC[m].forEach(function (x) { var e = left[x['Mã NV']]; if (e && e['Ngày nghỉ việc'] && x['Ngày'] > e['Ngày nghỉ việc'] && /^(X|CT)$/i.test(String(x['Ký hiệu'])) && !seen[x['Mã NV']]) { seen[x['Mã NV']] = 1; push('ho_so', 'gap', x['Mã NV'], 'Đã nghỉ việc ' + vn(e['Ngày nghỉ việc']) + ' nhưng còn chấm công tháng ' + HR.ymLabel(m), '', { k: 'cc' + m, sources: ['Hồ sơ', 'Chấm công'] }); } }); });
    // mã NV trên chấm công/bảng lương không có trong hồ sơ
    if (d.NV.length) {
      var unk = {}; Object.keys(d.CC).forEach(function (m) { d.CC[m].forEach(function (x) { if (!nvById[x['Mã NV']]) unk[x['Mã NV']] = 1; }); });
      Object.keys(d.BL).forEach(function (m) { d.BL[m].forEach(function (x) { if (!nvById[x['Mã NV']]) unk[x['Mã NV']] = 1; }); });
      var ul = Object.keys(unk); if (ul.length) push('ho_so', 'gap', '', ul.length + ' mã NV có trên chấm công/bảng lương nhưng không có trong hồ sơ', 'Mã NV: ' + ul.slice(0, 30).join(', ') + (ul.length > 30 ? '…' : ''), { k: 'unk', people: ul, sources: ['Hồ sơ', 'Chấm công', 'Bảng lương'] });
    }
    // 16: lưu trữ hồ sơ người đã nghỉ (Luật BVDLCN 2025)
    var lefts = Object.keys(left).map(function (k) { return left[k]; });
    if (lefts.length) {
      if (!cfg.retentionMonths) push('luu_tru', 'nhac', '', lefts.length + ' hồ sơ người đã nghỉ việc chưa đặt thời hạn lưu', 'Luật Bảo vệ dữ liệu cá nhân 2025: dữ liệu cá nhân của người lao động phải xóa, hủy khi chấm dứt hợp đồng, trừ khi có thỏa thuận hoặc luật quy định khác (vd hồ sơ BHXH, thuế, kế toán phải lưu theo thời hạn riêng). Đặt "Thời hạn lưu hồ sơ" trong Cài đặt để phần mềm nhắc đúng người đến hạn rà soát.', { k: 'chua-dat', people: lefts.map(function (e) { return e['Mã NV']; }), sources: ['Hồ sơ'] });
      else lefts.forEach(function (e) { var nd = dnum(e['Ngày nghỉ việc']); if (nd === null) return; var due = new Date(nd * 86400000); due.setUTCMonth(due.getUTCMonth() + cfg.retentionMonths); var dn = Math.floor(due.getTime() / 86400000); if (dn <= r) push('luu_tru', 'nhac', e['Mã NV'], 'Nghỉ việc ' + vn(e['Ngày nghỉ việc']) + ', quá ' + cfg.retentionMonths + ' tháng – đến hạn rà soát hồ sơ', 'Xem xét xóa/hủy dữ liệu cá nhân không còn nghĩa vụ lưu, hoặc ghi rõ căn cứ tiếp tục lưu.', { sources: ['Hồ sơ'] }); });
    }
    // nhắc nhẹ: sinh nhật, đi muộn, định biên
    var mRef = R.slice(5, 7);
    d.NV.forEach(function (e) { if (active(e['Mã NV']) && e['Ngày sinh'] && String(e['Ngày sinh']).slice(5, 7) === mRef) push('sinh_nhat', 'nhac', e['Mã NV'], 'Sinh nhật ' + vn(e['Ngày sinh']).slice(0, 5), '', { k: R.slice(0, 7), due: R.slice(0, 4) + String(e['Ngày sinh']).slice(4), sources: ['Hồ sơ'] }); });
    if (curM) ccSummary(d.CC[curM], cfg).forEach(function (s) { if (s.late >= cfg.lateTimes) push('di_muon', 'nhac', s.id, 'Đi muộn ' + s.late + ' lần tháng ' + HR.ymLabel(curM) + ' (' + s.lateMin + ' phút)', '', { k: curM, sources: ['Chấm công ' + HR.ymLabel(curM)] }); });
    var dash = HR.dashboard([{ name: unit.name, data: d }], { ref: R, contractDays: cfg.contractDays });
    dash.overStaff.forEach(function (x) { push('dinh_bien', 'nhac', '', x.name + ': ' + (x.working + x.maternity) + ' người, định biên ' + x.plan, 'Vượt ' + (x.working + x.maternity - x.plan) + ' người so với danh mục phòng ban.', { k: x.name, sources: ['Danh mục phòng ban', 'Hồ sơ'] }); });

    var rank = { gap: 0, canh: 1, nhac: 2 };
    out.sort(function (a, b) { return (rank[a.level] - rank[b.level]) || ((a.days === null ? 1e6 : a.days) - (b.days === null ? 1e6 : b.days)) || a.kind.localeCompare(b.kind); });
    return out;
  }

  /* ---------------- Kiểm tra file tháng mới trước khi nạp ---------------- */
  function checkImport(unit, sheet, cfg) {
    cfg = Object.assign({}, DEF, cfg || {});
    var d = unit.data, t = sheet.type, rows = sheet.rows, errs = [], warns = [], info = [];
    var nvById = {}; d.NV.forEach(function (e) { nvById[e['Mã NV']] = e; });
    if (sheet.missing && sheet.missing.length) warns.push('Thiếu ' + sheet.missing.length + ' cột so với mẫu: ' + sheet.missing.join(', '));
    var ids = {}, match = 0, nomatch = [];
    rows.forEach(function (x) { ids[x['Mã NV']] = 1; });
    Object.keys(ids).forEach(function (id) { if (nvById[id]) match++; else nomatch.push(id); });
    info.push('Đọc được ' + rows.length + ' dòng, ' + Object.keys(ids).length + ' mã NV: ' + match + ' khớp hồ sơ' + (nomatch.length ? ', ' + nomatch.length + ' không khớp' : ''));
    if (nomatch.length) errs.push('Mã NV không có trong hồ sơ: ' + nomatch.slice(0, 20).join(', ') + (nomatch.length > 20 ? '…' : ''));
    if (t === 'CC' || t === 'BL') {
      if (!sheet.month) errs.push('Không xác định được tháng của bảng (cần cột Ngày cho chấm công; tiêu đề "THÁNG mm/yyyy" hoặc tên sheet T09 cho bảng lương)');
      else if (d[t][sheet.month]) warns.push('Phần mềm đã có ' + HR.TYPE[t].name.toLowerCase() + ' tháng ' + HR.ymLabel(sheet.month) + ' – nạp sẽ thay bằng file mới');
    }
    if (t === 'CC') {
      var months = {}; rows.forEach(function (x) { if (x['Ngày']) months[String(x['Ngày']).slice(0, 7)] = 1; });
      if (Object.keys(months).length > 1) errs.push('File có dữ liệu của ' + Object.keys(months).length + ' tháng (' + Object.keys(months).map(HR.ymLabel).join(', ') + ') – mỗi file chỉ nên chứa 1 tháng');
      var seen = {}, dup = 0; rows.forEach(function (x) { var k = x['Mã NV'] + '|' + x['Ngày']; if (seen[k]) dup++; seen[k] = 1; });
      if (dup) errs.push(dup + ' dòng trùng cùng Mã NV và cùng ngày');
      var KH = {}; d.KH.forEach(function (k) { KH[String(k['Ký hiệu']).toUpperCase()] = 1; });
      if (d.KH.length) { var bad = {}; rows.forEach(function (x) { var k = String(x['Ký hiệu'] || '').toUpperCase(); if (k && !KH[k]) bad[k] = (bad[k] || 0) + 1; }); if (Object.keys(bad).length) errs.push('Ký hiệu không có trong danh mục: ' + Object.keys(bad).map(function (k) { return k + ' (' + bad[k] + ')'; }).join(', ')); }
      var nameDiff = 0; rows.forEach(function (x) { var e = nvById[x['Mã NV']]; if (e && x['Họ và tên'] && e['Họ và tên'] && x['Họ và tên'] !== e['Họ và tên']) nameDiff++; }); if (nameDiff) warns.push(nameDiff + ' dòng có họ tên khác hồ sơ');
      var tmp = { id: unit.id, name: unit.name, data: Object.assign({}, d, { CC: {} }) }; tmp.data.CC[sheet.month || 'x'] = rows;
      var al = alerts(tmp, sheet.month ? lastDayOf(sheet.month) : HR.isoToday(), Object.assign({}, cfg, { off: {} }));
      var nd = al.filter(function (a) { return a.kind === 'nghi_don'; }).length; if (nd) warns.push(nd + ' người có ngày nghỉ không khớp đơn đã duyệt (xem Việc cần xử lý sau khi nạp)');
      var lc = al.filter(function (a) { return a.kind === 'ho_so' && /còn chấm công/.test(a.title); }).length; if (lc) errs.push(lc + ' người đã nghỉ việc nhưng vẫn được chấm công đi làm');
      var ot = ccSummary(rows, cfg).filter(function (s) { return s.ot > cfg.otMonthMax; }).length; if (ot) warns.push(ot + ' người tăng ca vượt ' + cfg.otMonthMax + ' giờ trong tháng');
      var rg = ccRange(rows); if (sheet.month && rg.to && rg.to < lastDayOf(sheet.month)) warns.push('Chấm công mới có dữ liệu đến ' + vn(rg.to) + ' (chưa đủ tháng)');
    }
    if (t === 'BL') {
      var seen2 = {}, dup2 = 0; rows.forEach(function (x) { if (seen2[x['Mã NV']]) dup2++; seen2[x['Mã NV']] = 1; }); if (dup2) errs.push(dup2 + ' mã NV xuất hiện nhiều lần trên bảng lương');
      if (sheet.month) { var tmp2 = Object.assign({}, d, { BL: Object.assign({}, d.BL) }); tmp2.BL[sheet.month] = rows; var pc = payrollCheck(tmp2, sheet.month, cfg); var n = Object.keys(pc.byId).filter(function (k) { return pc.byId[k].length; }).length; if (n) warns.push(n + ' người có số liệu lệch chấm công / quyết định lương (xem Bảng lương sau khi nạp)'); }
      var g = 0; rows.forEach(function (x) { g += num(x['Tổng thu nhập']); }); info.push('Tổng thu nhập ' + fmtMoney(g) + ' đ');
    }
    return { errors: errs, warns: warns, info: info, match: match, nomatch: nomatch };
  }

  return { DEF: DEF, KINDS: KINDS, LV: LV, alerts: alerts, ccSummary: ccSummary, ccRange: ccRange, leaveRecalc: leaveRecalc, payrollCheck: payrollCheck,
    contractsOf: contractsOf, lsOf: lsOf, currentContract: currentContract, contractState: contractState, nextSign: nextSign, salaryAt: salaryAt,
    checkImport: checkImport, isProb: isProb, isFixed: isFixed, isIndef: isIndef, lastDayOf: lastDayOf, codes: codes, isSunday: isSunday, fmtMoney: fmtMoney };
})(typeof HR !== 'undefined' ? HR : require('./core.js'));
if (typeof module !== 'undefined') module.exports = HRR;
