  /* =====================================================================
     MODULE LƯƠNG (bản 0.4.1 – bắt đầu 09/11/2026)
     B1 – THIẾT LẬP CÔNG THỨC LƯƠNG + bộ máy tính lương dùng chung cho Bảng lương (B2), Phiếu lương (B3)
       - Nguyên tắc anh chốt 09/11 14:11: ĐÚNG LUẬT là ưu tiên số 1 · căn cứ: quan-ly-nhan-su/CAN-CU-PHAP-LY-LUONG.md (quy tắc 1–28)
       - Tham số pháp luật dùng CHUNG mọi công ty, theo ngày hiệu lực: S.settings.lgLaw (gốc LG_LAW0)
       - Thiết lập RIÊNG từng công ty: u.lgset = { v, at, vung, tnld, round, late, otTax, d168, items, emp }
         chưa sửa gì thì dùng bản gợi ý u._lgDraft (giống Thiết lập chấm công)
       - lgCalc(u, ym, id) → các dòng tính kèm công thức + căn cứ, cảnh báo, chi phí doanh nghiệp
     (chèn vào app.js khi build tại chỗ đánh dấu LUONG, sau CHAMCONG – dùng chung biến, hàm)
     ===================================================================== */
  var LG_LAW0 = {
    ref: [{ f: '2024-07-01', v: 2340000, s: 'NĐ 73/2024/NĐ-CP – mức lương cơ sở (hết hiệu lực 01/07/2026 theo NĐ 161/2026 Điều 6)', ok: 0 },
      { f: '2026-07-01', v: 2530000, s: 'NĐ 161/2026/NĐ-CP Điều 3 khoản 2 · mức tham chiếu = mức lương cơ sở (NĐ 158/2025 Điều 5 khoản 2)', ok: 1 }],
    lttv: [{ f: '2026-01-01', v: [5310000, 4730000, 4140000, 3700000], h: [25500, 22700, 20000, 17800], s: 'NĐ 293/2025/NĐ-CP Điều 3', ok: 1 },
      { f: '2027-01-01', v: [5700000, 5080000, 4450000, 4040000], h: [27400, 24400, 21400, 19400], s: 'NĐ 399/2026/NĐ-CP Điều 3 (thay NĐ 293/2025)', ok: 1 }],
    gt: [{ f: '2026-01-01', v: [15500000, 6200000], s: 'Luật Thuế TNCN 109/2025/QH15 Điều 10 · áp dụng từ kỳ tính thuế 2026 (NĐ 253/2026 Điều 69)', ok: 1 }],
    bac: [{ f: '2026-01-01', v: [[10000000, 5], [30000000, 10], [60000000, 20], [100000000, 30], [0, 35]], s: 'Luật Thuế TNCN 109/2025/QH15 Điều 9', ok: 1 }],
    tl: [{ f: '2026-01-01', v: { nlXh: 8, nlYt: 1.5, nlTn: 1, dnOm: 3, dnHt: 14, dnYt: 3, dnTn: 1, kpcd: 2 },
      s: 'BHXH: Luật BHXH 41/2024 Điều 32–34 (đã đối chiếu) · BHYT: Luật BHYT Điều 13 – tối đa 6%, DN 2/3, NLĐ 1/3; mức 4,5% theo nghị định (chưa đối chiếu) · BHTN: Luật Việc làm 74/2025 Điều 33 – tối đa 1% / 1% (mức cụ thể theo nghị định, chưa đối chiếu) · KPCĐ: Luật Công đoàn 50/2024 Điều 29 (đã đối chiếu)', ok: 0 }],
    k10: [{ f: '2026-01-01', v: [10, 5000000], s: 'NĐ 253/2026/NĐ-CP Điều 50 khoản 2 – không ký HĐ hoặc HĐLĐ dưới 03 tháng', ok: 1 }],
    anca: [{ f: '2026-07-01', v: 1200000, s: 'NĐ 253/2026/NĐ-CP Điều 8 khoản 2 điểm g – áp dụng từ 01/07/2026', ok: 1 }]
  };
  var LG_LAWK = [['ref', 'Mức tham chiếu (lương cơ sở)'], ['lttv', 'Lương tối thiểu vùng'], ['gt', 'Giảm trừ gia cảnh'], ['bac', 'Biểu thuế lũy tiến từng phần'], ['tl', 'Tỷ lệ đóng bảo hiểm, kinh phí công đoàn'], ['k10', 'Khấu trừ 10% (HĐ dưới 3 tháng, không ký HĐ)'], ['anca', 'Tiền ăn giữa ca không tính thuế']];
  var LG_KIND = { fix: 'Cố định hằng tháng', ratio: 'Theo tỷ lệ công', cond: 'Cả tháng nếu đủ % công', qty: 'Số lượng × đơn giá', input: 'Nhập mỗi tháng', pctbh: '% lương đóng BH' };
  var LG_TAX = { all: 'Chịu thuế', none: 'Không tính thuế', cap: 'Miễn đến mức' };
  var LG_DK = { adv: 'Hoàn tạm ứng (Điều 101 BLLĐ)', dmg: 'Bồi thường thiệt hại (Điều 102 BLLĐ – tối đa 30%)', union: 'Đoàn phí công đoàn (chỉ đoàn viên)', agree: 'Khoản trừ NLĐ đồng ý bằng văn bản' };
  function lgItems0() {
    return [
      { id: 'pccv', t: 'Phụ cấp chức vụ', g: 'tn', cat: 'cb', kind: 'ratio', src: 'hd', amt: 0, per: false, tax: 'all', bh: true, ot: true, slip: true, sys: 1, law: 'Lấy cột Phụ cấp chức vụ trên HĐ / quyết định lương. Phụ cấp lương thỏa thuận trong HĐ tính vào lương đóng BH (Luật BHXH Điều 31; NĐ 158/2025 Điều 7)' },
      { id: 'pcdt', t: 'Phụ cấp điện thoại', g: 'tn', cat: 'pc', kind: 'cond', cond: 50, amt: 0, per: true, tax: 'cap', cap: 0, bh: false, ot: false, slip: true, law: 'Khoán điện thoại: chỉ phần cao hơn mức phù hợp chi phí được trừ TNDN mới tính thuế (NĐ 253/2026 Điều 8.2.đ) – ghi mức miễn theo quy chế. Không tính vào đơn giá tăng ca (NĐ 145/2020 Điều 55.1.a). Lương đóng BH: xếp nhóm Trợ cấp, phụ cấp không đóng BH (khoản hỗ trợ không gắn với công việc, chức danh). Lưu ý Luật BHXH 2024 Điều 31 / NĐ 158/2025 Điều 7 không còn liệt kê khoản được loại trừ: nếu HĐ ghi là phụ cấp lương trả cố định thì chuyển sang nhóm Lương cơ bản (chờ kế toán trưởng duyệt)' },
      { id: 'pcxx', t: 'Hỗ trợ xăng xe, đi lại', g: 'tn', cat: 'pc', kind: 'cond', cond: 50, amt: 0, per: true, tax: 'all', bh: false, ot: false, slip: true, law: 'Không tính vào đơn giá tăng ca (NĐ 145/2020 Điều 55.1.a). Lương đóng BH: như phụ cấp điện thoại (chờ duyệt)' },
      { id: 'anca', t: 'Tiền ăn giữa ca', g: 'tn', cat: 'pc', kind: 'qty', qtyBy: 'work', price: 0, form: 'tien', tax: 'cap', capLaw: 'anca', bh: false, ot: false, slip: true, law: 'Trả bằng tiền: phần vượt 1,2 triệu/người/tháng mới tính thuế; DN tự nấu, mua suất ăn, phát phiếu ăn: không tính thuế (NĐ 253/2026 Điều 8.2.g, từ 01/07/2026). Không tính vào đơn giá tăng ca (NĐ 145/2020 Điều 55.1.a)' },
      { id: 'kpi', t: 'Thưởng, KPI, hoa hồng', g: 'tn', cat: 'thuong', kind: 'input', amt: 0, tax: 'all', bh: false, ot: false, slip: true, law: 'Khoản biến động theo năng suất, kết quả công việc không tính vào lương đóng BH (NĐ 158/2025 Điều 7.1.b–c), không tính vào đơn giá tăng ca (NĐ 145/2020 Điều 55.1.a)' },
      { id: 'ctp', t: 'Công tác phí (có chứng từ)', g: 'tn', cat: 'pc', kind: 'input', amt: 0, tax: 'none', bh: false, ot: false, slip: true, law: 'Khoản thanh toán đi công tác theo quy chế, có hóa đơn chứng từ không tính vào thu nhập chịu thuế (NĐ 253/2026 Điều 8.4.k). Khoán công tác phí không chứng từ: chuyển sang "Miễn đến mức"' },
      { id: 'tamung', t: 'Hoàn tạm ứng', g: 'kt', dk: 'adv', kind: 'input', amt: 0, slip: true, law: 'Tạm ứng không tính lãi, NLĐ hoàn trả (BLLĐ Điều 101)' },
      { id: 'boithuong', t: 'Bồi thường thiệt hại', g: 'kt', dk: 'dmg', kind: 'input', amt: 0, slip: true, law: 'Chỉ khấu trừ để bồi thường hư hỏng dụng cụ, thiết bị, tài sản; tối đa 30% lương thực trả sau BH, thuế; NLĐ được biết lý do (BLLĐ Điều 102, 129)' },
      { id: 'doanphi', t: 'Đoàn phí công đoàn', g: 'kt', dk: 'union', kind: 'pctbh', amt: 1, slip: true, law: 'Đoàn viên đóng theo Điều lệ Công đoàn Việt Nam (Luật Công đoàn 50/2024 Điều 29.1.a) – mức % do đơn vị xác nhận theo Điều lệ. Chỉ trừ người được đánh dấu là đoàn viên' },
      { id: 'trukhac', t: 'Khoản trừ khác (NLĐ đồng ý)', g: 'kt', dk: 'agree', kind: 'input', amt: 0, slip: true, law: 'Ký túc xá, quỹ tự nguyện…: chỉ trừ khi NLĐ đồng ý bằng văn bản; không được ép chi tiêu lương (BLLĐ Điều 94.2). Không dùng cho phạt tiền – BLLĐ Điều 127.2 cấm phạt tiền, cắt lương thay xử lý kỷ luật' }
    ];
  }
  function lgDefault(u) {
    var emp = {};
    // dữ liệu mẫu Đốm Sáng Edu (09/11): DS010 bán thời gian ca chiều 13:30–17:30 ≈ 4 giờ × 22 ngày; DS011 CTV sáng T2/T4/T6 08:00–11:30 ≈ 3,5 giờ × 13 buổi
    if (/dữ liệu mẫu/i.test(u && u.name || '') && (u.data.NV || []).some(function (e) { return e['Mã NV'] === 'DS010'; })) { emp.DS010 = { amt: {}, hrsHD: 88 }; emp.DS011 = { amt: {}, hrsHD: 45.5 }; }
    return { v: 1, at: '', vung: 1, tnld: 0.5, round: 1000, late: false, otTax: 'full', d168: true, items: lgItems0(), emp: emp };
  }
  function lgOf(u) { if (!u.lgset) u._lgDraft = u._lgDraft || lgDefault(u); var s = u.lgset || u._lgDraft; s.emp = s.emp || {}; s.items.forEach(lgCatFix); return s; }
  // 09/11 (anh 15:53): mỗi khoản thu nhập thuộc 1 nhóm trên bảng lương – cb = Lương cơ bản (phụ cấp cố định, đóng BH) · pc = Trợ cấp, phụ cấp (không đóng BH) · thuong = Thưởng hiệu quả, KPI
  var LG_CAT = { cb: 'Lương cơ bản (phụ cấp cố định – đóng BH)', pc: 'Trợ cấp, phụ cấp (không đóng BH)', thuong: 'Thưởng hiệu quả, KPI (không đóng BH)' };
  function lgCatFix(it) { if (it.g !== 'tn') return; if (!it.cat) it.cat = it.bh ? 'cb' : (it.id === 'kpi' || /thưởng|kpi|hoa hồng/i.test(it.t || '') ? 'thuong' : 'pc'); it.bh = it.cat === 'cb'; }
  function lgSave(u, msg) { if (!u.lgset) { u.lgset = u._lgDraft || lgDefault(u); u._lgDraft = null; } u.lgset.at = nowVn(); u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) log('Thiết lập công thức lương (' + u.name + '): ' + msg); }
  function lgLaw() { if (!S.settings.lgLaw) { S.settings.lgLaw = JSON.parse(JSON.stringify(LG_LAW0)); } var L = S.settings.lgLaw; Object.keys(LG_LAW0).forEach(function (k) { if (!L[k]) L[k] = JSON.parse(JSON.stringify(LG_LAW0[k])); }); return L; }
  function lgAt(k, iso) { var a = (lgLaw()[k] || []).slice().sort(function (x, y) { return x.f < y.f ? -1 : 1; }), r = a[0]; a.forEach(function (x) { if (x.f <= iso) r = x; }); return r || { v: null, s: '', ok: 0 }; }
  function lgEmp(s, id) { var E = s.emp[id] || (s.emp[id] = { amt: {} }); E.amt = E.amt || {}; return E; }
  function lgIso(v) { var t = String(v == null ? '' : v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''; }
  function lgDays(a, b) { return Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000); }
  function lgMoney(v) { return v == null || isNaN(v) ? '' : (Math.round(v) < 0 ? '−' : '') + fmtInt(Math.abs(Math.round(v))); }
  function lgNum(v) { return String(Math.round((+v || 0) * 100) / 100).replace('.', ','); }
  function lgPct(v) { return lgNum(v) + '%'; }
  function lgAmt(v) { return +String(v == null ? '' : v).replace(/[^\d]/g, '') || 0; }
  function lgTax(tn, bac) { var t = 0, lo = 0, steps = []; bac.forEach(function (b) { if (tn <= lo) return; var hi = b[0] || Infinity, part = Math.min(tn, hi) - lo; if (part > 0) { t += part * b[1] / 100; steps.push(lgMoney(part) + ' × ' + b[1] + '%'); } lo = hi; }); return { v: t, f: steps.join(' + ') }; }
  // khoản nhập riêng từng tháng (Bảng lương tháng – B2 dùng): u.lgm[ym].inp[id][itemId]
  function lgInp(u, ym, id, itemId) { var m = u.lgm && u.lgm[ym], v = m && m.inp && m.inp[id] ? m.inp[id][itemId] : undefined; return v === undefined || v === '' || v === null || isNaN(+v) ? null : +v; }
  function lgEmpAmt(E, it, def) { return E.amt[it.id] != null && E.amt[it.id] !== '' ? +E.amt[it.id] : def; }

  /* ---------- Bộ máy tính lương 1 người, 1 tháng ---------- */
  function lgCalc(u, ym, id, opt) {
    opt = opt || {};
    var s = lgOf(u), L = {}, days = bcDays(ym), last = days[days.length - 1];
    LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); });
    var B = bcMonth(u, ym), p = B.ppl.filter(function (x) { return x.id === id; })[0]; if (!p) return null;
    var e = p.e || {}, E = lgEmp(s, id), rEnd = HR.dnum(last), byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data);
    var c = HRR.currentContract(byHd[id], rEnd), ctype = c ? String(c['Loại hợp đồng'] || '') : '', sal = HRR.salaryAt(id, rEnd, byHd, byLs);
    var base = sal ? +sal.amount || 0 : 0, R = ccOf(u).rule, si = p.sh ? shiftInfo(p.sh) : null, fullH = si ? si.full : 8;
    var hr = !!(p.exc && p.exc.hr), ctv = !!(p.exc && p.exc.ctv) || HRR.isCtv(ctype), prob = HRR.isProb(ctype);
    var hl = c ? lgIso(c['Ngày hiệu lực']) : '', het = c ? lgIso(c['Ngày hết hạn']) : '', term = !c ? 0 : HRR.isIndef(ctype) || !het ? 999 : hl ? (lgDays(hl, het) + 1) / 30.4 : 999;
    var r = { u: u, id: id, ym: ym, name: p.name, dept: p.dept, ctype: ctype || '(chưa có HĐ)', ld: hr ? (ctv ? 'Cộng tác viên' : 'Bán thời gian') : 'Toàn thời gian', lines: [], warn: [], dn: [], salSrc: sal ? sal.src : '', base: base, locked: !!bcX(u).lock[ym], sum: p.sum };
    var add = function (grp, k, t, v, f, law, flag) { var o = { grp: grp, k: k, t: t, v: Math.round(v || 0), f: f || '', law: law || '' }; if (flag) Object.assign(o, flag); r.lines.push(o); return o; };
    var W = function (lv, t) { r.warn.push({ lv: lv, t: t }); };
    if (!sal) W('bad', 'Chưa có mức lương: không thấy HĐ hoặc quyết định lương còn hiệu lực đến ' + HR.vnDate(last));
    // 1. Lương theo thời gian
    var std = p.sum.std || 0, cong = p.sum.salary || 0, ratio = 1, luong = 0, unitH = 0, agreedH = 0;
    if (hr) {
      Object.keys(p.days).forEach(function (dd) { var x = p.days[dd]; if (x.src === 'out') return; if (x.kind === 'work') agreedH += si ? si.full : 0; else if (x.kind === 'half') agreedH += si ? si.half : 0; });
      var hrs = p.sum.hours || 0, hHD = +E.hrsHD || 0; if (hHD) agreedH = hHD; unitH = +E.hourly || (agreedH ? base / agreedH : 0); luong = unitH * hrs; ratio = agreedH ? Math.min(1, hrs / agreedH) : 0;
      if (!E.hourly && !hHD) W('bad', 'Chưa nhập số giờ làm theo HĐ / tháng (tab Mức theo người) – đơn giá giờ đang ước theo ca ' + (p.sh ? p.sh.id : '') + ' (' + lgNum(agreedH) + ' giờ), sai nếu người này làm ca ngắn hơn. Lương tháng của người làm bán thời gian = lương giờ × số giờ thỏa thuận trong HĐ (NĐ 158/2025 Điều 7.2)');
      add('tn', 'tg', 'Lương theo giờ làm', luong, lgNum(hrs) + ' giờ × ' + lgMoney(unitH) + ' đ/giờ' + (E.hourly ? ' (đơn giá nhập riêng)' : ' (= ' + lgMoney(base) + ' ÷ ' + lgNum(agreedH) + (hHD ? ' giờ theo HĐ / tháng)' : ' giờ ước theo ca)')), 'Bán thời gian, cộng tác viên hưởng theo thời gian làm việc thực tế; bán thời gian bình đẳng với người làm trọn thời gian (BLLĐ Điều 32.3)');
    } else {
      ratio = std ? Math.min(1, cong / std) : 0; luong = base * ratio; unitH = std && fullH ? base / (std * fullH) : 0;
      add('tn', 'tg', 'Lương theo ngày công', luong, lgMoney(base) + ' × ' + lgNum(cong) + ' / ' + lgNum(std) + ' công (đi làm + nghỉ có lương + nghỉ lễ)', 'Lương theo ' + (sal ? sal.src : 'HĐ / quyết định lương') + '; ngày lễ, phép năm, việc riêng có lương hưởng nguyên lương (BLLĐ Điều 112, 113, 115; NĐ 145/2020 Điều 67)');
      if (s.late && p.sum.lateMin) { var lt = unitH * p.sum.lateMin / 60; luong -= lt; add('tn', 'late', 'Không trả lương thời gian đi muộn', -lt, lgNum(p.sum.lateMin) + ' phút × ' + lgMoney(unitH) + ' đ/giờ', 'Chỉ không trả lương cho đúng thời gian không làm việc – không phải phạt tiền (BLLĐ Điều 127.2 cấm phạt tiền, cắt lương thay xử lý kỷ luật)'); }
    }
    // 2. Khoản thu nhập
    var tnItems = 0, exempt = 0, bhAdd = 0, otAdd = 0, pccv = 0, C = r.c = { vitri: base, hr: hr, std: hr ? 0 : std, cong: hr ? (p.sum.hours || 0) : cong, ratio: ratio, otH: 0, ot: 0, d168: 0, bhBase: 0, bhxh: 0, bhyt: 0, bhtn: 0, tntt: 0, gtT: 0, it: {}, full: {} };
    if (c && c['Phụ cấp chức vụ']) pccv = lgAmt(c['Phụ cấp chức vụ']);
    (byLs[id] || []).forEach(function (x) { var d = lgIso(x['Ngày hiệu lực']); if (d && d <= last && x['Phụ cấp chức vụ'] !== '' && x['Phụ cấp chức vụ'] != null) pccv = lgAmt(x['Phụ cấp chức vụ']); });
    s.items.filter(function (it) { return it.g === 'tn'; }).forEach(function (it) {
      var full = it.src === 'hd' ? pccv : lgEmpAmt(E, it, +it.amt || 0), v = 0, f = '', m = lgInp(u, ym, id, it.id);
      if (it.kind === 'fix') { v = full; f = 'cố định ' + lgMoney(full); }
      else if (it.kind === 'ratio') { v = full * ratio; f = lgMoney(full) + ' × ' + lgPct(ratio * 100) + ' công'; }
      else if (it.kind === 'cond') { var ok = ratio * 100 >= (+it.cond || 0); v = ok ? full : 0; f = (ok ? 'đủ ' : 'chưa đủ ') + (+it.cond || 0) + '% công (đạt ' + lgPct(ratio * 100) + ')' + (ok ? ' → ' + lgMoney(full) : ' → 0'); }
      else if (it.kind === 'qty') { var q = m != null ? m : it.qtyBy === 'work' ? (hr ? p.sum.hDays || 0 : p.sum.work || 0) : 0, pr = lgEmpAmt(E, it, +it.price || 0); v = q * pr; f = lgNum(q) + (it.qtyBy === 'work' ? ' ngày đi làm' : '') + ' × ' + lgMoney(pr); }
      else if (it.kind === 'input') { v = m != null ? m : 0; f = m != null ? 'nhập tháng ' + HR.ymLabel(ym) : 'nhập ở Bảng lương tháng'; }
      C.it[it.id] = v; C.full[it.id] = it.kind === 'fix' || it.kind === 'cond' || it.kind === 'ratio' ? full : 0;
      if (!v && !opt.all) return;
      tnItems += v;
      var ex = 0; if (it.tax === 'none' || (it.id === 'anca' && it.form === 'suat')) ex = v; else if (it.tax === 'cap') { var cap = it.capLaw ? +L[it.capLaw].v || 0 : +it.cap || 0; ex = Math.min(v, cap); if (cap) f += ' · miễn thuế đến ' + lgMoney(cap); }
      exempt += ex; if (it.bh) bhAdd += it.kind === 'cond' || it.kind === 'ratio' ? full : v; if (it.ot) otAdd += full;
      add('tn', it.id, it.t, v, f, it.law, { ex: ex, slip: it.slip });
    });
    // 3. Tăng ca (NĐ 145/2020 Điều 55: đơn giá giờ không gồm ăn ca, xăng xe, điện thoại, thưởng…)
    var rN = Math.max(150, +R.otRateN || 150), rR = Math.max(200, +R.otRateR || 200), rH = Math.max(300, +R.otRateH || 300);
    var otH = (p.sum.otN || 0) + (p.sum.otR || 0) + (p.sum.otH || 0), ot = 0;
    if (otH) {
      var uo = hr ? unitH : (std && fullH ? (base + otAdd) / (std * fullH) : 0);
      ot = uo * ((p.sum.otN || 0) * rN + (p.sum.otR || 0) * rR + (p.sum.otH || 0) * rH) / 100;
      var otEx = s.otTax === 'premium' ? ot - uo * otH : ot;
      if (otH > 40) { otEx = otEx * 40 / otH; W('warn', 'Làm thêm ' + lgNum(otH) + ' giờ trong tháng – vượt 40 giờ/tháng (BLLĐ Điều 107.2.b). Phần vượt giới hạn không được miễn thuế (NĐ 253/2026 Điều 26.3)'); }
      exempt += otEx; C.otH = otH; C.ot = ot;
      add('tn', 'ot', 'Lương làm thêm giờ', ot, 'đơn giá ' + lgMoney(uo) + ' đ/giờ × (' + [p.sum.otN ? lgNum(p.sum.otN) + ' giờ × ' + rN + '%' : '', p.sum.otR ? lgNum(p.sum.otR) + ' giờ × ' + rR + '%' : '', p.sum.otH ? lgNum(p.sum.otH) + ' giờ × ' + rH + '%' : ''].filter(Boolean).join(' + ') + ') · miễn thuế ' + lgMoney(otEx), 'BLLĐ Điều 98; NĐ 145/2020 Điều 55 (đơn giá giờ = lương + phụ cấp gắn với công việc ÷ giờ làm bình thường); miễn thuế TNCN: Luật 109/2025 Điều 4.8, NĐ 253/2026 Điều 26' + (s.otTax === 'premium' ? ' – đang để chỉ miễn phần trả cao hơn' : ''), { ex: otEx, slip: true });
    }
    // 4. Diện bảo hiểm
    var T = L.tl.v, ref = +L.ref.v || 0, vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (L.lttv.v || [])[vg] || 0, ltH = (L.lttv.h || [])[vg] || 0;
    var noPay = (p.sum.unpaid || 0) + (p.sum.bh || 0), bhOk = true, why = '';
    if (ctv) { bhOk = false; why = 'Hợp đồng cộng tác viên / dịch vụ – không phải HĐLĐ'; }
    else if (!c) { bhOk = false; why = 'Chưa có hợp đồng'; }
    else if (prob) { bhOk = false; why = 'Đang ở HĐ thử việc riêng (không thuộc diện BHTN – Luật Việc làm 2025 Điều 31.2; BHXH theo HĐLĐ – Luật BHXH Điều 2.1.a) – chờ kế toán trưởng duyệt'; }
    else if (term < 1) { bhOk = false; why = 'HĐLĐ dưới 01 tháng (Luật BHXH Điều 2.1.a)'; }
    else if (hr && base < ref) { bhOk = false; why = 'Bán thời gian, lương tháng theo HĐ ' + lgMoney(base) + ' thấp hơn mức thấp nhất ' + lgMoney(ref) + ' (Luật BHXH Điều 2.1.l)'; }
    var skip14 = bhOk && noPay >= 14; if (skip14) why = 'Không hưởng lương ' + lgNum(noPay) + ' ngày (từ 14 ngày làm việc) – tháng này không đóng (Luật BHXH Điều 33.5, 34.3; Luật Việc làm Điều 33.4)';
    var bhBase = base + bhAdd, b1 = Math.min(Math.max(bhBase, ref), 20 * ref), b2 = Math.min(Math.max(bhBase, ref), 20 * ltM), nl = 0;
    r.bhBase = bhBase; r.bhOk = bhOk && !skip14; r.bhWhy = why; C.bhBase = r.bhOk ? bhBase : 0;
    if (r.bhOk) {
      var xh = b1 * T.nlXh / 100, yt = b1 * T.nlYt / 100, tn = b2 * T.nlTn / 100; nl = xh + yt + tn; C.bhxh = xh; C.bhyt = yt; C.bhtn = tn;
      var bf = 'lương đóng ' + lgMoney(bhBase) + (b1 !== bhBase ? ' (giới hạn ' + lgMoney(b1) + ')' : '');
      add('bh', 'bhxh', 'BHXH (' + lgPct(T.nlXh) + ')', xh, bf, 'Luật BHXH 41/2024 Điều 31, 33.1.a – lương đóng = mức lương + phụ cấp + khoản bổ sung thỏa thuận trả ổn định; thấp nhất mức tham chiếu, cao nhất 20 lần', { slip: true });
      add('bh', 'bhyt', 'BHYT (' + lgPct(T.nlYt) + ')', yt, bf, 'Luật BHYT Điều 13.1.a – NLĐ đóng 1/3', { slip: true });
      add('bh', 'bhtn', 'BHTN (' + lgPct(T.nlTn) + ')', tn, 'lương đóng ' + lgMoney(b2) + (b2 !== bhBase ? ' (trần 20 lần lương tối thiểu vùng)' : ''), 'Luật Việc làm 74/2025 Điều 33.1.a, 34', { slip: true });
      r.dn.push(['BHXH ốm đau – thai sản (' + lgPct(T.dnOm) + ')', b1 * T.dnOm / 100], ['BHXH hưu trí – tử tuất (' + lgPct(T.dnHt) + ')', b1 * T.dnHt / 100], ['BH tai nạn lao động – BNN (' + lgPct(s.tnld) + ')', b1 * (+s.tnld || 0) / 100], ['BHYT (' + lgPct(T.dnYt) + ')', b1 * T.dnYt / 100], ['BHTN (' + lgPct(T.dnTn) + ')', b2 * T.dnTn / 100], ['Kinh phí công đoàn (' + lgPct(T.kpcd) + ')', b1 * T.kpcd / 100]);
    } else if (why) W('info', 'Không đóng bảo hiểm tháng này: ' + why);
    if (!hr && sal && base < ltM) W('bad', 'Lương ' + lgMoney(base) + ' thấp hơn lương tối thiểu vùng ' + (vg + 1) + ' (' + lgMoney(ltM) + ') – BLLĐ Điều 90.2; ' + L.lttv.s);
    if (hr && unitH && ltH && unitH < ltH) W('bad', 'Đơn giá ' + lgMoney(unitH) + ' đ/giờ thấp hơn lương tối thiểu giờ vùng ' + (vg + 1) + ' (' + lgMoney(ltH) + ') – ' + L.lttv.s);
    // 4b. Điều 168.3 BLLĐ: NLĐ (HĐLĐ) không thuộc diện đóng BH được trả thêm khoản tương đương mức DN đóng
    var d168 = 0;
    if (s.d168 && !bhOk && c && !ctv && !prob) { var rt = T.dnOm + T.dnHt + (+s.tnld || 0) + T.dnYt + T.dnTn; d168 = luong * rt / 100; add('tn', 'd168', 'Khoản trả thêm thay đóng BH', d168, lgMoney(luong) + ' × ' + lgPct(rt), 'BLLĐ Điều 168.3 – NLĐ không thuộc diện BHXH, BHYT, BHTN bắt buộc được trả thêm cùng kỳ lương khoản tương đương mức NSDLĐ đóng (cách tính chờ kế toán trưởng duyệt)', { slip: true }); }
    var gross = luong + tnItems + ot + d168; r.gross = gross; r.bhNL = nl; C.d168 = d168;
    // 5. Thuế TNCN
    var tnct = Math.max(0, gross - exempt), tax = 0, npt = +e['Số người phụ thuộc'] || 0, short = ctv || prob || term < 3;
    r.tnct = tnct; r.exempt = exempt; r.npt = npt; r.short = short; C.tnct = tnct; C.exempt = exempt; C.npt = npt;
    add('tax', 'tnct', 'Thu nhập chịu thuế', tnct, lgMoney(gross) + ' − ' + lgMoney(exempt) + ' (khoản miễn, không tính thuế)', 'Luật TNCN 109/2025 Điều 3, 4; NĐ 253/2026 Điều 8, 26', { info: 1 });
    if (short) {
      var K = L.k10.v;
      if (E.cam08) add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', 0, 'có bản cam kết thu nhập chưa đến mức nộp thuế → tạm không khấu trừ (cuối năm vẫn lập danh sách nộp cơ quan thuế)', L.k10.s, { slip: true });
      else if (gross >= K[1] || E.req10) { tax = tnct * K[0] / 100; add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', tax, lgMoney(tnct) + ' × ' + K[0] + '%' + (gross < K[1] ? ' (cá nhân yêu cầu khấu trừ)' : ''), L.k10.s + (ctv ? ' · hợp đồng cộng tác viên' : prob ? ' · HĐ thử việc' : ' · HĐLĐ dưới 03 tháng'), { slip: true }); }
      else add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', 0, 'lần chi ' + lgMoney(gross) + ' dưới ' + lgMoney(K[1]) + ' → không khấu trừ (trừ khi cá nhân yêu cầu)', L.k10.s, { slip: true });
    } else {
      var gt = L.gt.v, ded = nl + gt[0] + npt * gt[1], tntt = Math.max(0, tnct - ded), tx = lgTax(tntt, L.bac.v); tax = tx.v; r.tntt = tntt; C.tntt = tntt; C.gtT = gt[0] + npt * gt[1];
      add('tax', 'tntt', 'Thu nhập tính thuế', tntt, lgMoney(tnct) + ' − BH ' + lgMoney(nl) + ' − bản thân ' + lgMoney(gt[0]) + (npt ? ' − ' + npt + ' người phụ thuộc × ' + lgMoney(gt[1]) : ''), 'Luật TNCN 109/2025 Điều 8.2, 10 (' + L.gt.s + ')', { info: 1 });
      add('tax', 'thue', 'Thuế TNCN (lũy tiến)', tax, tx.f || 'chưa đến mức nộp thuế', L.bac.s + ' – HĐLĐ từ 03 tháng: khấu trừ theo biểu lũy tiến (NĐ 253/2026 Điều 50.2)', { slip: true });
    }
    // 6. Khấu trừ sau thuế
    var after = gross - nl - tax, kt = 0;
    s.items.filter(function (it) { return it.g === 'kt'; }).forEach(function (it) {
      var m = lgInp(u, ym, id, it.id), v = 0, f = '';
      if (it.dk === 'union') { if (!E.union) return; v = it.kind === 'pctbh' ? bhBase * (+it.amt || 0) / 100 : lgEmpAmt(E, it, +it.amt || 0); f = it.kind === 'pctbh' ? lgPct(it.amt) + ' × ' + lgMoney(bhBase) : 'cố định'; }
      else { v = m != null ? m : it.kind === 'fix' ? lgEmpAmt(E, it, +it.amt || 0) : 0; f = m != null ? 'nhập tháng ' + HR.ymLabel(ym) : it.kind === 'fix' ? 'cố định' : 'nhập ở Bảng lương tháng'; }
      if (!v && !opt.all) return;
      if (it.dk === 'dmg' && v > after * 0.3) W('bad', it.t + ' ' + lgMoney(v) + ' vượt 30% lương thực trả sau BH, thuế (' + lgMoney(after * 0.3) + ') – BLLĐ Điều 102.3');
      C.it[it.id] = v; kt += v; add('kt', it.id, it.t, v, f, it.law, { slip: it.slip });
    });
    var net = after - kt, rnd = +s.round || 0, pay = rnd ? Math.round(net / rnd) * rnd : Math.round(net);
    r.tax = tax; r.kt = kt; r.net = net; r.pay = pay;
    r.dnTotal = r.dn.reduce(function (t, x) { return t + x[1]; }, 0);
    // cột tổng hợp trên bảng lương (anh 15:53): Lương cơ bản = lương vị trí + phụ cấp cố định đóng BH · Lương gross = lương cơ bản + trợ cấp, phụ cấp cố định
    var sumBy = function (cat, key) { return s.items.filter(function (it) { return it.g === 'tn' && it.cat === cat; }).reduce(function (t, it) { return t + (+C[key][it.id] || 0); }, 0); };
    C.coBan = base + sumBy('cb', 'full'); C.gross = C.coBan + sumBy('pc', 'full'); C.tgBase = luong; C.tg = luong + sumBy('cb', 'it');
    C.pcT = sumBy('pc', 'it'); C.thT = sumBy('thuong', 'it'); C.tongTN = gross; C.bhNL = nl; C.tax = tax; C.ktT = kt; C.net = net; C.pay = pay; C.dnT = r.dnTotal; C.cost = gross + r.dnTotal; C.dn = r.dn.map(function (x) { return x[1]; }); C.warn = r.warn.filter(function (w) { return w.lv !== 'info'; }).length;
    if (!r.locked) W('info', 'Tháng ' + HR.ymLabel(ym) + ' chưa chốt công – số liệu đang tạm tính theo bảng công hiện tại');
    if (ctv && (p.sum.hDays || 0) >= 15) W('warn', 'Cộng tác viên đi làm ' + p.sum.hDays + ' ngày trong tháng – có dấu hiệu quan hệ lao động (BLLĐ Điều 13; Luật BHXH Điều 2.1.a)');
    return r;
  }

  /* ---------- Trang: Thiết lập công thức lương ---------- */
  var LG_TABS = [['kh', 'Khoản lương'], ['ng', 'Mức theo người'], ['bt', 'Bảo hiểm & thuế'], ['xt', 'Xem trước']];
  function lgUnit() { var f = ps('lg', { tab: 'kh', u: '', ym: '', pick: null }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function lgStyle() {
    if (document.getElementById('lgCss')) return;
    var st = document.createElement('style'); st.id = 'lgCss';
    st.textContent = '.lg-law{font-size:12px;color:var(--muted);line-height:1.45}.lg-chk{display:inline-flex;align-items:center;gap:6px}.lg-num{width:120px;text-align:right}.lg-pv{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}.lg-pv .card{min-width:0}.lg-pv .tbl td:first-child{min-width:200px}.lg-pv .tbl td.lg-f{min-width:180px}.lg-pv .card h3{margin:0 0 2px}.tbl td.n,.tbl th.n{text-align:right;white-space:nowrap}.lg-pv tr.g td{background:rgba(127,127,127,.07);font-weight:600}.lg-pv tr.tot td{font-weight:700;border-top:2px solid var(--line-2)}.lg-f{font-size:12px;color:var(--muted)}.lg-w{margin:8px 0 0;padding-left:18px}.lg-w li{margin:3px 0}.lg-w .bad{color:#c0392b}.lg-w .warn{color:#b9770e}.lg-dn{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--muted);margin-top:8px}.lg-banner{margin-bottom:12px}.lg-pick{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 0}.lg-ok{color:#1e8449}.lg-bt td{vertical-align:top}.lg-bt select{min-width:220px}';
    document.head.appendChild(st);
  }
  PAGES.congthuc = function () {
    lgStyle();
    var f = ps('lg', { tab: 'kh', u: '', ym: '', pick: null }), u = lgUnit(); if (!u) return pageHead('Thiết lập công thức lương') + noData('dữ liệu');
    var s = lgOf(u), us = selUnits().length ? selUnits() : S.units;
    var head = pageHead('Thiết lập công thức lương', 'Khoản thu nhập, phụ cấp, khấu trừ, bảo hiểm, thuế của <b>' + esc(shortUnit(u.name)) + '</b> · ' + (u.lgset ? 'sửa lần cuối ' + esc(u.lgset.at) : '<span class="tl-draft">Đang dùng thiết lập gợi ý theo luật – sửa bất kỳ mục nào là lưu riêng cho công ty này</span>'));
    var pick = us.length > 1 ? '<div class="tl-units"><span class="vc-lbl">Công ty</span><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="lg-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : '';
    var ban = '<div class="notice warn lg-banner">' + ic('info') + '<div><b>Cách tính đang chờ kế toán trưởng duyệt nghiệp vụ.</b> Phần mềm tính theo Bộ luật Lao động, Luật BHXH, Luật Việc làm, Luật BHYT, Luật Thuế TNCN và các nghị định hướng dẫn (xem tab Bảo hiểm &amp; thuế); đơn vị vẫn phải rà lại kết quả trước khi trả lương.</div></div>';
    var tabs = '<div class="tl-tabs" role="tablist">' + LG_TABS.map(function (t) { return '<button role="tab" aria-selected="' + (f.tab === t[0]) + '" class="' + (f.tab === t[0] ? 'on' : '') + '" data-act="lg-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body = f.tab === 'ng' ? lgTabNg(u, s) : f.tab === 'bt' ? lgTabBt(u, s) : f.tab === 'xt' ? lgTabXt(u, s, f) : lgTabKh(u, s);
    return head + pick + ban + tabs + '<div id="lgArea">' + body + '</div>';
  };
  ACTS['lg-tab'] = function (a, id) { PS.lg.tab = id; render(); };
  ACTS['lg-u'] = function (a, id) { PS.lg.u = id; PS.lg.pick = null; render(); };

  /* Tab 1: Khoản lương */
  function lgTabKh(u, s) {
    var sysRow = function (t, note) { return '<tr><td><b>' + t + '</b><div class="faint">Tự tính</div></td><td colspan="6" class="lg-law">' + note + '</td><td></td></tr>'; };
    var row = function (it) {
      var how = LG_KIND[it.kind] + (it.kind === 'cond' ? ' (≥ ' + (+it.cond || 0) + '%)' : '') + (it.src === 'hd' ? ' – lấy từ HĐ / QĐ lương' : '');
      var amt = it.src === 'hd' ? 'theo HĐ' : it.kind === 'qty' ? lgMoney(it.price) + ' / ' + (it.qtyBy === 'work' ? 'ngày đi làm' : 'đơn vị') : it.kind === 'pctbh' ? lgPct(it.amt) : it.kind === 'input' ? '—' : lgMoney(it.amt);
      if (it.per) amt += '<div class="faint">+ mức riêng từng người</div>';
      var tx = it.g === 'kt' ? '—' : it.id === 'anca' && it.form === 'suat' ? 'Không tính (suất ăn)' : it.tax === 'cap' ? ((it.capLaw ? lgAt(it.capLaw, refDate()).v : +it.cap) ? 'Miễn đến ' + lgMoney(it.capLaw ? lgAt(it.capLaw, refDate()).v : it.cap) : 'Miễn đến mức quy chế <span class="tag tag-warn">chưa nhập</span>') : LG_TAX[it.tax];
      return '<tr><td><b>' + esc(it.t) + '</b>' + (it.g === 'kt' ? '<div class="faint">' + esc(LG_DK[it.dk] || '') + '</div>' : '') + '</td><td>' + how + '</td><td class="n">' + amt + '</td><td>' + tx + '</td><td>' + (it.g === 'kt' ? 'Khấu trừ sau thuế' : esc(LG_CAT[it.cat] || '')) + '</td><td>' + (it.g === 'kt' ? '—' : it.ot ? 'Có' : 'Không') + '</td><td>' + (it.slip ? 'Có' : 'Không') + '</td><td><button class="btn btn-sm" data-act="lg-it" data-id="' + esc(it.id) + '">Sửa</button></td></tr>';
    };
    var th = '<thead><tr><th>Khoản</th><th>Cách tính</th><th class="n">Mức mặc định</th><th>Thuế TNCN</th><th>Nhóm trên bảng lương</th><th>Vào đơn giá tăng ca</th><th>Hiện trên phiếu</th><th></th></tr></thead>';
    var tn = s.items.filter(function (x) { return x.g === 'tn'; }), kt = s.items.filter(function (x) { return x.g === 'kt'; });
    return '<div class="card card-pad"><h3>Thu nhập</h3><div class="tbl-wrap"><table class="tbl">' + th + '<tbody>' +
      sysRow('Lương theo thời gian', 'Lương HĐ / quyết định lương × công hưởng lương ÷ công chuẩn (toàn thời gian) · giờ làm × đơn giá giờ (bán thời gian, cộng tác viên). Lấy từ Tổng hợp công.') +
      tn.map(row).join('') +
      sysRow('Lương làm thêm giờ', 'Giờ tăng ca đã xác nhận × đơn giá giờ × 150% / 200% / 300% (BLLĐ Điều 98; NĐ 145/2020 Điều 55). Hệ số lấy ở Thiết lập chấm công, không thấp hơn mức luật.') +
      sysRow('Khoản trả thêm thay đóng BH', 'Chỉ với người có HĐLĐ không thuộc diện đóng BH (BLLĐ Điều 168.3) – bật / tắt ở tab Bảo hiểm &amp; thuế.') +
      '</tbody></table></div><button class="btn btn-sm" style="margin-top:10px" data-act="lg-it" data-id="" data-g="tn">+ Thêm khoản thu nhập</button></div>' +
      '<div class="card card-pad" style="margin-top:14px"><h3>Bảo hiểm, thuế (tự tính)</h3><p class="lg-law">BHXH, BHYT, BHTN phần người lao động đóng và thuế TNCN tự tính theo tab <a href="#" data-act="lg-tab" data-id="bt">Bảo hiểm &amp; thuế</a>. Phần doanh nghiệp đóng (BHXH, tai nạn lao động, BHYT, BHTN, kinh phí công đoàn) không trừ vào lương, hiện riêng ở phần chi phí doanh nghiệp.</p></div>' +
      '<div class="card card-pad" style="margin-top:14px"><h3>Khấu trừ sau thuế</h3><div class="tbl-wrap"><table class="tbl">' + th + '<tbody>' + kt.map(row).join('') + '</tbody></table></div><button class="btn btn-sm" style="margin-top:10px" data-act="lg-it" data-id="" data-g="kt">+ Thêm khoản khấu trừ</button>' +
      '<p class="lg-law" style="margin-top:10px">Phần mềm <b>không có loại khoản "Phạt"</b>: Bộ luật Lao động cấm phạt tiền, cắt lương thay việc xử lý kỷ luật (Điều 127.2). Chỉ được khấu trừ lương để bồi thường thiệt hại tài sản, tối đa 30% lương thực trả sau BH, thuế (Điều 102). Đi muộn: chỉ không trả lương cho thời gian không làm việc (bật ở tab Bảo hiểm &amp; thuế).</p></div>';
  }
  ACTS['lg-it'] = function (a, id) {
    var u = lgUnit(), s = lgOf(u), isNew = !id, g = isNew ? a.getAttribute('data-g') : null;
    var it = isNew ? (g === 'kt' ? { id: '', t: '', g: 'kt', dk: 'agree', kind: 'input', amt: 0, slip: true } : { id: '', t: '', g: 'tn', cat: 'pc', kind: 'fix', amt: 0, per: false, tax: 'all', bh: false, ot: false, slip: true }) : JSON.parse(JSON.stringify(s.items.filter(function (x) { return x.id === id; })[0] || null));
    if (!it) return;
    var kinds = it.g === 'kt' ? ['input', 'fix', 'pctbh'] : ['fix', 'ratio', 'cond', 'qty', 'input'];
    var sel = function (idd, lbl, opts, v) { return '<div class="field"><label for="' + idd + '">' + lbl + '</label><select class="input" id="' + idd + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; };
    var chk = function (idd, lbl, v) { return '<label class="lg-chk"><input type="checkbox" id="' + idd + '"' + (v ? ' checked' : '') + '> ' + lbl + '</label>'; };
    var body = '<form id="lgF" novalidate>' + field('iT', 'Tên khoản *', it.t, ' maxlength="60"' + (it.sys ? ' readonly' : '')) +
      (it.g === 'kt' ? sel('iDk', 'Loại khấu trừ', Object.keys(LG_DK).map(function (k) { return [k, LG_DK[k]]; }), it.dk) : '') +
      (it.src === 'hd' ? '<p class="lg-law">Mức lấy từ cột Phụ cấp chức vụ trên hợp đồng / quyết định lương.</p>' : sel('iK', 'Cách tính', kinds.map(function (k) { return [k, LG_KIND[k]]; }), it.kind)) +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">' +
      '<div id="iAmtW">' + field('iA', it.kind === 'pctbh' ? 'Tỷ lệ (%)' : 'Mức mặc định (đồng/tháng)', it.kind === 'pctbh' ? lgNum(it.amt) : fmtInt(+it.amt || 0), ' inputmode="decimal"') + '</div>' +
      '<div id="iCondW">' + field('iC', '% công tối thiểu để hưởng cả tháng', it.cond == null ? 50 : it.cond, ' inputmode="numeric" maxlength="3"') + '</div>' +
      '<div id="iPrW">' + field('iP', 'Đơn giá (đồng)', fmtInt(+it.price || 0), ' inputmode="numeric"') + '</div>' +
      '<div id="iQW">' + sel('iQ', 'Số lượng theo', [['work', 'Số ngày đi làm trong tháng (tự lấy)'], ['input', 'Nhập mỗi tháng']], it.qtyBy || 'work') + '</div></div>' +
      (it.g === 'tn' ? sel('iCat', 'Nhóm trên bảng lương', Object.keys(LG_CAT).map(function (k) { return [k, LG_CAT[k]]; }), it.cat) + '<p class="lg-law" style="margin-top:-4px">Lương cơ bản: mức lương + phụ cấp lương, khoản bổ sung thỏa thuận trong HĐ, trả ổn định → tính vào lương đóng BH (Luật BHXH Điều 31; NĐ 158/2025 Điều 7). Khoản biến động theo năng suất, kết quả công việc không đóng BH.</p><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">' + sel('iX', 'Thuế TNCN', Object.keys(LG_TAX).map(function (k) { return [k, LG_TAX[k]]; }), it.tax) + '<div id="iCapW">' + field('iCap', 'Miễn thuế đến (đồng/tháng)' + (it.capLaw ? ' – theo luật' : ''), fmtInt(it.capLaw ? lgAt(it.capLaw, refDate()).v : +it.cap || 0), ' inputmode="numeric"' + (it.capLaw ? ' readonly' : '')) + '</div></div>' +
        (it.id === 'anca' ? sel('iFm', 'Hình thức', [['tien', 'Trả bằng tiền cùng lương'], ['suat', 'Công ty nấu ăn / mua suất ăn / phát phiếu ăn']], it.form || 'tien') : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:8px 18px;margin:6px 0">' + chk('iPer', 'Có mức riêng từng người', it.per) + chk('iOt', 'Tính vào đơn giá tăng ca', it.ot) + chk('iSl', 'Hiện trên phiếu lương', it.slip) + '</div>' : '<div style="display:flex;flex-wrap:wrap;gap:8px 18px;margin:6px 0">' + chk('iPer', 'Có mức riêng từng người', it.per) + chk('iSl', 'Hiện trên phiếu lương', it.slip) + '</div>') +
      (it.law ? '<p class="lg-law">' + esc(it.law) + '</p>' : '') +
      '<p id="lgMsg" class="tl-msg"></p><div class="link-row" style="justify-content:space-between">' + (isNew || it.sys ? '<span></span>' : '<button type="button" class="btn btn-danger" id="iDel">Xóa khoản</button>') + '<span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">' + (isNew ? 'Thêm' : 'Lưu') + '</button></span></div></form>';
    var m = modal(isNew ? (it.g === 'kt' ? 'Thêm khoản khấu trừ' : 'Thêm khoản thu nhập') : 'Sửa ' + it.t, shortUnit(u.name), body, true);
    var vis = function () {
      var k = $('#iK', m) ? $('#iK', m).value : it.kind, show = function (q, on) { var el = $(q, m); if (el) el.style.display = on ? '' : 'none'; };
      show('#iAmtW', k !== 'qty' && k !== 'input' && it.src !== 'hd'); show('#iCondW', k === 'cond'); show('#iPrW', k === 'qty'); show('#iQW', k === 'qty'); show('#iCapW', !!($('#iX', m) && $('#iX', m).value === 'cap'));
      var lb = $('#iAmtW label', m); if (lb) lb.textContent = k === 'pctbh' ? 'Tỷ lệ (%)' : 'Mức mặc định (đồng/tháng)';
    };
    ['#iK', '#iX'].forEach(function (q) { var el = $(q, m); if (el) el.addEventListener('change', vis); }); vis();
    var dl = $('#iDel', m); if (dl) dl.onclick = function () { s.items = s.items.filter(function (x) { return x.id !== it.id; }); lgSave(u, 'xóa khoản ' + it.t); m.close(); toast('Đã xóa khoản ' + it.t); render(); };
    $('#lgF', m).onsubmit = function (ev) {
      ev.preventDefault(); var v = function (q) { var el = $(q, m); return el ? el.value.trim() : ''; }, ck = function (q) { var el = $(q, m); return el ? el.checked : false; };
      var t = v('#iT'); if (!t) { $('#lgMsg', m).textContent = 'Nhập tên khoản'; return; }
      if ($('#iK', m)) it.kind = v('#iK'); if ($('#iDk', m)) it.dk = v('#iDk');
      it.t = t; it.amt = it.kind === 'pctbh' ? +String(v('#iA')).replace(',', '.') || 0 : lgAmt(v('#iA')); it.cond = lgAmt(v('#iC')); it.price = lgAmt(v('#iP')); it.qtyBy = v('#iQ') || 'work';
      if (it.g === 'tn') { it.tax = v('#iX'); if (!it.capLaw) it.cap = lgAmt(v('#iCap')); it.cat = v('#iCat') || it.cat; it.bh = it.cat === 'cb'; it.ot = ck('#iOt'); if ($('#iFm', m)) it.form = v('#iFm'); }
      it.per = ck('#iPer'); it.slip = ck('#iSl');
      if (it.g === 'tn' && it.cat === 'cb' && (it.kind === 'input' || it.kind === 'qty')) { $('#lgMsg', m).textContent = 'Khoản nhập mỗi tháng / theo số lượng là khoản biến động – không xếp vào Lương cơ bản (không đóng BH, NĐ 158/2025 Điều 7.1.b–c). Chọn nhóm khác.'; return; }
      if (it.kind === 'pctbh' && it.g === 'kt' && it.dk !== 'union') { $('#lgMsg', m).textContent = 'Cách tính "% lương đóng BH" chỉ dùng cho đoàn phí công đoàn.'; return; }
      if (isNew) { it.id = 'k' + Date.now().toString(36); s.items.push(it); } else s.items = s.items.map(function (x) { return x.id === it.id ? it : x; });
      lgSave(u, (isNew ? 'thêm' : 'sửa') + ' khoản ' + t); m.close(); toast('Đã lưu khoản ' + t); render();
    };
  };

  /* Tab 2: Mức theo người */
  function lgPeople(u) { var m0 = refDate().slice(0, 7) + '-01'; return (u.data.NV || []).filter(function (e) { if (!e['Mã NV']) return false; var l = lgIso(e['Ngày nghỉ việc']); return !l || l >= m0; }); }
  function lgTabNg(u, s) {
    var per = s.items.filter(function (x) { return x.per; }), uni = s.items.some(function (x) { return x.dk === 'union'; });
    var byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data), r = HR.dnum(refDate());
    var rows = lgPeople(u).map(function (e) {
      var id = e['Mã NV'], E = lgEmp(s, id), c = HRR.currentContract(byHd[id], r), ct = c ? String(c['Loại hợp đồng'] || '') : '', sal = HRR.salaryAt(id, r, byHd, byLs), ld = ldOf(e);
      var hr = ld !== 'Toàn thời gian', hl = c ? lgIso(c['Ngày hiệu lực']) : '', het = c ? lgIso(c['Ngày hết hạn']) : '';
      var shortC = HRR.isCtv(ct) || HRR.isProb(ct) || (hl && het && !HRR.isIndef(ct) && lgDays(hl, het) < 90);
      var inp = function (k, val, ph) { return '<input class="input lg-num" data-lgp="' + esc(id) + '" data-k="' + k + '" value="' + (val == null || val === '' ? '' : esc(k === 'hrsHD' ? lgNum(val) : fmtInt(val))) + '" placeholder="' + esc(ph || '') + '" inputmode="numeric" aria-label="' + esc(k) + ' ' + esc(id) + '">'; };
      return '<tr><td>' + esc(id) + '</td><td><b>' + esc(e['Họ và tên'] || '') + '</b><div class="faint">' + esc(e['Phòng ban'] || '') + '</div></td><td>' + esc(ld) + '<div class="faint">' + esc(ct || 'chưa có HĐ') + '</div></td><td class="n">' + (sal ? lgMoney(sal.amount) : '<span class="tag tag-bad">Chưa có</span>') + '</td><td class="n">' + esc(e['Số người phụ thuộc'] === '' || e['Số người phụ thuộc'] == null ? '0' : e['Số người phụ thuộc']) + '</td>' +
        (uni ? '<td><input type="checkbox" data-lgp="' + esc(id) + '" data-k="union"' + (E.union ? ' checked' : '') + ' aria-label="Đoàn viên ' + esc(id) + '"></td>' : '') +
        '<td>' + (shortC ? '<label class="lg-chk"><input type="checkbox" data-lgp="' + esc(id) + '" data-k="cam08"' + (E.cam08 ? ' checked' : '') + '> có cam kết</label>' : '<span class="faint">—</span>') + '</td>' +
        '<td>' + (hr ? inp('hrsHD', E.hrsHD, 'chưa nhập') : '<span class="faint">—</span>') + '</td><td>' + (hr ? inp('hourly', E.hourly, E.hrsHD && sal ? lgMoney(sal.amount / E.hrsHD) : 'tự tính') : '<span class="faint">—</span>') + '</td>' +
        per.map(function (it) { return '<td>' + inp('a:' + it.id, E.amt[it.id], it.kind === 'qty' ? lgMoney(it.price) : lgMoney(it.amt)) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div class="card card-pad"><p class="lg-law" style="margin-top:0">Lương lấy từ hợp đồng / quyết định lương; số người phụ thuộc lấy từ hồ sơ (sửa ở Hồ sơ nhân sự). Ô để trống = dùng mức mặc định của khoản. Nhập xong tự lưu. Thêm cột cho khoản khác: mở khoản đó ở tab Khoản lương, chọn "Có mức riêng từng người".</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Mã NV</th><th>Họ và tên</th><th>Loại lao động / HĐ</th><th class="n">Lương HĐ / QĐ</th><th class="n">Người phụ thuộc</th>' +
      (uni ? '<th>Đoàn viên</th>' : '') + '<th title="Mẫu cam kết thu nhập chưa đến mức nộp thuế – NĐ 253/2026 Điều 50.2">Cam kết thuế<br><span class="faint">HĐ dưới 3 tháng, CTV</span></th><th title="Lương tháng bán thời gian = lương giờ × số giờ thỏa thuận trong HĐ (NĐ 158/2025 Điều 7.2)">Giờ theo HĐ / tháng<br><span class="faint">bán thời gian, CTV</span></th><th>Đơn giá giờ<br><span class="faint">để trống = lương ÷ giờ HĐ</span></th>' + per.map(function (it) { return '<th>' + esc(it.t) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  BINDS.congthuc = function () {
    document.querySelectorAll('[data-lgp]').forEach(function (el) {
      el.addEventListener('change', function () {
        var u = lgUnit(), s = lgOf(u), E = lgEmp(s, el.getAttribute('data-lgp')), k = el.getAttribute('data-k');
        var raw = k === 'hrsHD' ? el.value.replace(',', '.').replace(/[^\d.]/g, '') : el.value.replace(/[^\d]/g, ''), val = el.type === 'checkbox' ? el.checked : (raw === '' ? '' : +raw);
        if (k.indexOf('a:') === 0) E.amt[k.slice(2)] = val; else E[k] = val;
        if (el.type !== 'checkbox' && val !== '') el.value = k === 'hrsHD' ? lgNum(val) : fmtInt(val);
        lgSave(u, 'mức theo người ' + el.getAttribute('data-lgp')); toast('Đã lưu');
      });
    });
    document.querySelectorAll('[data-lgo]').forEach(function (el) {
      el.addEventListener('change', function () { var u = lgUnit(), s = lgOf(u), k = el.getAttribute('data-lgo'), v = el.value; s[k] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v; lgSave(u, k + ' = ' + v); toast('Đã lưu'); render(); });
    });
    var ym = $('#lgYm'); if (ym) ym.addEventListener('change', function () { PS.lg.ym = ym.value; PS.lg.pick = null; render(); });
    document.querySelectorAll('[data-lgpick]').forEach(function (el) { el.addEventListener('change', function () { var a = (PS.lg.pick || []).filter(function (x) { return x !== el.value; }); if (el.checked) a.push(el.value); PS.lg.pick = a.slice(-5); render(); }); });
  };

  /* Tab 3: Bảo hiểm & thuế */
  function lgTabBt(u, s) {
    var R = refDate(), sel = function (k, opts, v) { return '<select class="input" data-lgo="' + k + '" aria-label="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
    var opt = '<div class="card card-pad"><h3>Lựa chọn của ' + esc(shortUnit(u.name)) + '</h3><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-bt"><tbody>' +
      '<tr><td><b>Vùng lương tối thiểu</b><div class="lg-law">Theo nơi công ty hoạt động (NĐ 293/2025, NĐ 399/2026 Điều 3 khoản 3)</div></td><td>' + sel('vung', [[1, 'Vùng I'], [2, 'Vùng II'], [3, 'Vùng III'], [4, 'Vùng IV']], s.vung) + '</td></tr>' +
      '<tr><td><b>Mức đóng BH tai nạn lao động – bệnh nghề nghiệp</b><div class="lg-law">0,5% bình thường; 0,3% khi doanh nghiệp đủ điều kiện và được chấp thuận (NĐ 58/2020/NĐ-CP Điều 4, 5)</div></td><td>' + sel('tnld', [[0.5, '0,5%'], [0.3, '0,3% (đã được chấp thuận)']], s.tnld) + '</td></tr>' +
      '<tr><td><b>Miễn thuế tiền lương làm thêm giờ</b><div class="lg-law">Luật 109/2025 Điều 4.8, NĐ 253/2026 Điều 26 ghi "tiền lương làm thêm giờ"; luật cũ chỉ miễn phần trả cao hơn – <b>chờ kế toán trưởng xác nhận</b></div></td><td>' + sel('otTax', [['full', 'Miễn toàn bộ tiền làm thêm (theo câu chữ luật mới)'], ['premium', 'Chỉ miễn phần trả cao hơn giờ thường']], s.otTax) + '</td></tr>' +
      '<tr><td><b>Thời gian đi muộn</b><div class="lg-law">Chỉ không trả lương cho thời gian không làm việc; không được phạt tiền (BLLĐ Điều 127.2)</div></td><td>' + sel('late', [['false', 'Không trừ'], ['true', 'Không trả lương phút đi muộn']], String(!!s.late)) + '</td></tr>' +
      '<tr><td><b>Khoản trả thêm thay đóng BH (Điều 168.3)</b><div class="lg-law">Người có HĐLĐ nhưng không thuộc diện đóng BH được trả thêm khoản tương đương mức doanh nghiệp đóng</div></td><td>' + sel('d168', [['true', 'Tự tính'], ['false', 'Không tính (đơn vị tự xử lý)']], String(!!s.d168)) + '</td></tr>' +
      '<tr><td><b>Làm tròn số tiền chi trả</b></td><td>' + sel('round', [[0, 'Không làm tròn'], [100, 'Đến 100 đồng'], [1000, 'Đến 1.000 đồng']], s.round) + '</td></tr>' +
      '</tbody></table></div></div>';
    var law = lgLaw(), rowsL = LG_LAWK.map(function (k) {
      var list = (law[k[0]] || []).slice().sort(function (a, b) { return a.f < b.f ? -1 : 1; }), cur = lgAt(k[0], R);
      return '<tr><td><b>' + k[1] + '</b></td><td>' + list.map(function (x) { var on = x.f === cur.f; return '<div style="margin-bottom:6px"' + (on ? '' : ' class="faint"') + '>Từ ' + HR.vnDate(x.f) + ': <b>' + lgLawTxt(k[0], x.v, x.h) + '</b>' + (on ? ' <span class="tag tag-ok">đang áp dụng</span>' : '') + '<div class="lg-law">' + esc(x.s) + ' · ' + (x.ok ? '<span class="lg-ok">đã đối chiếu văn bản gốc</span>' : '<b>chưa đối chiếu đủ văn bản gốc</b>') + '</div></div>'; }).join('') + '</td><td><button class="btn btn-sm" data-act="lg-law" data-id="' + k[0] + '">Thêm mức mới</button></td></tr>';
    }).join('');
    return opt + '<div class="card card-pad" style="margin-top:14px"><h3>Tham số theo quy định (dùng chung mọi công ty)</h3><p class="lg-law" style="margin-top:0">Khi luật thay đổi: bấm <b>Thêm mức mới</b>, nhập ngày hiệu lực và số hiệu văn bản. Tháng lương nào dùng mức có hiệu lực tại ngày cuối tháng đó.</p><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-bt"><tbody>' + rowsL + '</tbody></table></div></div>';
  }
  function lgLawTxt(k, v, h) {
    if (k === 'lttv') return v.map(function (x, i) { return 'V' + (i + 1) + ' ' + lgMoney(x) + (h ? ' (' + lgMoney(h[i]) + '/giờ)' : ''); }).join(' · ');
    if (k === 'gt') return 'bản thân ' + lgMoney(v[0]) + ' · người phụ thuộc ' + lgMoney(v[1]) + ' /tháng';
    if (k === 'bac') { var lo = 0; return v.map(function (b) { var t = (b[0] ? (lo ? 'trên ' + lgNum(lo / 1e6) + ' – ' : 'đến ') + lgNum(b[0] / 1e6) + ' tr' : 'trên ' + lgNum(lo / 1e6) + ' tr') + ': ' + b[1] + '%'; lo = b[0]; return t; }).join(' · '); }
    if (k === 'tl') return 'NLĐ: BHXH ' + lgPct(v.nlXh) + ', BHYT ' + lgPct(v.nlYt) + ', BHTN ' + lgPct(v.nlTn) + ' · DN: ốm đau–thai sản ' + lgPct(v.dnOm) + ', hưu trí–tử tuất ' + lgPct(v.dnHt) + ', BHYT ' + lgPct(v.dnYt) + ', BHTN ' + lgPct(v.dnTn) + ', KPCĐ ' + lgPct(v.kpcd);
    if (k === 'k10') return v[0] + '% khi chi từ ' + lgMoney(v[1]) + '/lần';
    return lgMoney(v);
  }
  ACTS['lg-law'] = function (a, k) {
    var cur = lgAt(k, refDate()), name = (LG_LAWK.filter(function (x) { return x[0] === k; })[0] || [])[1];
    var body = '<form id="lwF" novalidate><div class="field"><label for="lwD">Ngày có hiệu lực *</label>' + dateInput('lwD', '') + '</div>' +
      '<div class="field"><label for="lwV">Giá trị * <span class="faint">(sửa trên nền mức hiện tại, giữ đúng dạng)</span></label><textarea class="input" id="lwV" rows="3">' + esc(JSON.stringify(cur.v)) + '</textarea></div>' +
      (k === 'lttv' ? '<div class="field"><label for="lwH">Lương tối thiểu giờ (4 vùng)</label><input class="input" id="lwH" value="' + esc(JSON.stringify(cur.h || [])) + '"></div>' : '') +
      field('lwS', 'Số hiệu văn bản, Điều, khoản *', '', ' maxlength="200"') + '<label class="lg-chk"><input type="checkbox" id="lwOk"> Đã đối chiếu văn bản gốc</label>' +
      '<p id="lwMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">Thêm</button></div></form>';
    var m = modal('Thêm mức mới', name, body, true);
    $('#lwF', m).onsubmit = function (ev) {
      ev.preventDefault(); var d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec($('#lwD', m).value.trim()), msg = $('#lwMsg', m), val, hh;
      if (!d) { msg.textContent = 'Nhập ngày dạng dd/mm/yyyy'; return; }
      try { val = JSON.parse($('#lwV', m).value); hh = $('#lwH', m) ? JSON.parse($('#lwH', m).value || '[]') : undefined; } catch (e) { msg.textContent = 'Giá trị chưa đúng dạng – sửa trên nền giá trị hiện tại'; return; }
      if (typeof val !== typeof cur.v || Array.isArray(val) !== Array.isArray(cur.v)) { msg.textContent = 'Giá trị phải cùng dạng với mức hiện tại'; return; }
      var src = $('#lwS', m).value.trim(); if (!src) { msg.textContent = 'Nhập số hiệu văn bản'; return; }
      var o = { f: d[3] + '-' + d[2] + '-' + d[1], v: val, s: src, ok: $('#lwOk', m).checked ? 1 : 0 }; if (hh && hh.length) o.h = hh;
      var L = lgLaw(); L[k] = (L[k] || []).filter(function (x) { return x.f !== o.f; }).concat([o]); saveSettings(); log('Tham số lương: ' + name + ' từ ' + d[0] + ' – ' + src); m.close(); toast('Đã thêm mức mới'); render();
    };
  };

  /* Tab 4: Xem trước trên vài người */
  function lgTabXt(u, s, f) {
    var ms = bcMonths(), X = bcX(u), ym = f.ym && ms.indexOf(f.ym) >= 0 ? f.ym : (ms.filter(function (m) { return X.lock[m]; }).pop() || ms[ms.length - 1]); f.ym = ym;
    var B = bcMonth(u, ym), all = B.ppl.filter(function (p) { return !p.orphan; });
    if (!f.pick) { var ft = all.filter(function (p) { return !p.exc.hr; }).slice(0, 2), pt = all.filter(function (p) { return p.exc.hr && !p.exc.ctv; }).slice(0, 1), ct = all.filter(function (p) { return p.exc.ctv; }).slice(0, 1); f.pick = ft.concat(pt, ct).map(function (p) { return p.id; }); }
    var pick = '<div class="lg-pick">' + all.map(function (p) { return '<label class="lg-chk"><input type="checkbox" data-lgpick value="' + esc(p.id) + '"' + (f.pick.indexOf(p.id) >= 0 ? ' checked' : '') + '> ' + esc(p.name) + '</label>'; }).join('') + '</div>';
    var top = '<div class="card card-pad"><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:end"><div class="field" style="margin:0"><label for="lgYm">Tháng</label><select class="input" id="lgYm">' + ms.map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>' + HR.ymLabel(m) + (X.lock[m] ? ' · đã chốt công' : '') + '</option>'; }).join('') + '</select></div><p class="lg-law" style="margin:0 0 6px;flex:1;min-width:240px">Chọn tối đa 5 người để xem từng bước tính. Số liệu công lấy từ Tổng hợp công tháng này; khoản nhập mỗi tháng (thưởng, tạm ứng…) sẽ nhập ở Bảng lương tháng.</p></div>' + pick + '</div>';
    var cards = f.pick.map(function (id) { var r = lgCalc(u, ym, id); return r ? lgCard(r) : ''; }).join('');
    return top + '<div class="lg-pv" style="margin-top:14px">' + (cards || '<p class="faint">Chọn người để xem.</p>') + '</div>';
  }
  function lgCard(r) {
    var grp = { tn: 'I. Thu nhập', bh: 'II. Bảo hiểm người lao động đóng', tax: 'III. Thuế thu nhập cá nhân', kt: 'IV. Khấu trừ sau thuế' }, rows = '';
    ['tn', 'bh', 'tax', 'kt'].forEach(function (g) {
      var ls = r.lines.filter(function (x) { return x.grp === g; }); if (!ls.length && g === 'kt') return;
      var tot = g === 'tn' ? r.gross : g === 'bh' ? r.bhNL : g === 'tax' ? r.tax : r.kt;
      rows += '<tr class="g"><td>' + grp[g] + '</td><td></td><td class="n">' + lgMoney(tot) + '</td></tr>';
      if (!ls.length) rows += '<tr><td colspan="3" class="lg-f">' + esc(r.bhWhy || 'Không đóng') + '</td></tr>';
      ls.forEach(function (x) { rows += '<tr><td>' + esc(x.t) + (x.law ? '<div class="lg-law">' + esc(x.law) + '</div>' : '') + '</td><td class="lg-f">' + esc(x.f) + '</td><td class="n">' + (x.info ? '<span class="faint">' + lgMoney(x.v) + '</span>' : lgMoney(x.v)) + '</td></tr>'; });
    });
    rows += '<tr class="tot"><td>Thực lĩnh = I − II − III − IV</td><td class="lg-f">' + (r.pay !== Math.round(r.net) ? 'làm tròn từ ' + lgMoney(r.net) : '') + '</td><td class="n">' + lgMoney(r.pay) + '</td></tr>';
    var warn = r.warn.length ? '<ul class="lg-w">' + r.warn.map(function (w) { return '<li class="' + w.lv + '">' + esc(w.t) + '</li>'; }).join('') + '</ul>' : '';
    var dn = r.dn.length ? '<div class="lg-dn"><b>Doanh nghiệp đóng thêm (không trừ lương):</b>' + r.dn.map(function (x) { return '<span>' + esc(x[0]) + ': ' + lgMoney(x[1]) + '</span>'; }).join('') + '<span><b>Cộng ' + lgMoney(r.dnTotal) + '</b></span></div>' : '';
    return '<div class="card card-pad"><h3>' + esc(r.name) + ' <span class="faint" style="font-weight:400">· ' + esc(r.id) + ' · ' + esc(r.ld) + ' · ' + esc(r.ctype) + '</span></h3>' + warn +
      '<div class="tbl-wrap" style="margin-top:10px;max-height:none"><table class="tbl"><thead><tr><th>Khoản</th><th>Cách tính</th><th class="n">Số tiền (đồng)</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + dn + '</div>';
  }
