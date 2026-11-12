  /* =====================================================================
     MODULE LƯƠNG (bản 0.4.1 – bắt đầu 09/11/2026)
     B1 – THIẾT LẬP CÔNG THỨC LƯƠNG + bộ máy tính lương dùng chung cho Bảng lương (B2), Phiếu lương (B3)
       - Nguyên tắc anh chốt 09/11 14:11: ĐÚNG LUẬT là ưu tiên số 1 · căn cứ: quan-ly-nhan-su/CAN-CU-PHAP-LY-LUONG.md (quy tắc 1–28)
       - Tham số pháp luật dùng CHUNG mọi công ty, theo ngày hiệu lực: S.settings.lgLaw (gốc LG_LAW0)
       - Thiết lập RIÊNG từng công ty: u.lgset = { v: 2, at, vung, tnld, round, late (false|true|'fine'), lateFine, otTax, d168, items, emp }
       - 09/11 18:21: mô hình Lương cơ bản (đóng BHXH) + trợ cấp cố định / theo ngày công + lương hiệu suất + KPI + thưởng
         chưa sửa gì thì dùng bản gợi ý u._lgDraft (giống Thiết lập chấm công)
       - lgCalc(u, ym, id) → các dòng tính kèm công thức + căn cứ, cảnh báo, chi phí doanh nghiệp
     (chèn vào app.js khi build tại chỗ đánh dấu LUONG, sau CHAMCONG – dùng chung biến, hàm)
     ===================================================================== */
  // liên kết <a href="#" data-act> (bấm tên, chuyển tab) không được đổi địa chỉ # – phần mềm điều hướng theo hash
  document.addEventListener('click', function lgNoJump(e) { var a = e.target.closest && e.target.closest('a[href="#"][data-act]'); if (a) e.preventDefault(); }, true);
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
  /* ---------- 09/11 18:21 (anh): mô hình khoản lương theo bảng lương mẫu 2 ----------
     Lương cơ bản (đóng BHXH, thường từ lương tối thiểu vùng, tăng theo thang lương) + Trợ cấp cố định (đóng BHXH, trả đủ)
     + Trợ cấp theo ngày công (không đóng BHXH) + Lương hiệu suất (mục tiêu × tỷ lệ ngày công × tỷ lệ đạt) + Lương KPI + Thưởng
     Lương đóng BHXH = Lương cơ bản + Trợ cấp cố định
     Thực lĩnh = Tổng thu nhập − BH người lao động đóng − Thuế TNCN − Tạm ứng, khấu trừ khác (giảm trừ gia cảnh chỉ dùng để tính thuế) */
  var LG_CAT = { cd: 'Trợ cấp cố định (đóng BHXH)', nc: 'Trợ cấp theo ngày công (không đóng BHXH)', kpi: 'Lương KPI', thuong: 'Thưởng' };
  var LG_KIND = { fix: 'Cố định cả tháng', ratio: 'Theo tỷ lệ ngày công', cond: 'Cả tháng nếu đủ % công', qty: 'Đơn giá × số ngày đi làm', input: 'Nhập mỗi tháng', pctbh: '% lương đóng BHXH' };
  var LG_DK = { adv: 'Tạm ứng lương (Điều 101 BLLĐ)', dmg: 'Bồi thường thiệt hại (Điều 102 BLLĐ – tối đa 30%)', union: 'Đoàn phí công đoàn (chỉ đoàn viên)', agree: 'Khoản trừ NLĐ đồng ý bằng văn bản' };
  // Danh mục gợi ý – tax: all = chịu thuế · free = miễn thuế (có mức trần / điều kiện) · law: căn cứ, hiện khi chọn
  var LG_PRE = {
    cd: [
      { id: 'cv', t: 'Trợ cấp chức vụ', src: 'hd', tax: 'all', law: 'Phụ cấp lương thỏa thuận trong HĐ → tính vào lương đóng BHXH (Luật BHXH Điều 31; NĐ 158/2025 Điều 7). Chịu thuế TNCN. Mặc định lấy cột Phụ cấp chức vụ trên HĐ / quyết định lương' },
      { id: 'trn', t: 'Trợ cấp trách nhiệm', tax: 'all', law: 'Phụ cấp lương → đóng BHXH (NĐ 158/2025 Điều 7.1.b). Chịu thuế TNCN' },
      { id: 'thn', t: 'Trợ cấp thâm niên', tax: 'all', law: 'Phụ cấp lương → đóng BHXH (NĐ 158/2025 Điều 7.1.b). Chịu thuế TNCN' },
      { id: 'doc', t: 'Trợ cấp độc hại, nguy hiểm', tax: 'free', warn: 'doc', law: 'Đóng BHXH (NĐ 158/2025 Điều 7.1.b). Không tính thuế TNCN khi là phụ cấp cho nghề, công việc độc hại, nguy hiểm theo quy định của cơ quan nhà nước; phần cao hơn mức quy định phải tính thuế (NĐ 253/2026 Điều 8.3.d)' },
      { id: 'kv', t: 'Trợ cấp khu vực, thu hút', tax: 'free', warn: 'doc', law: 'Đóng BHXH. Không tính thuế TNCN theo mức cơ quan nhà nước quy định; phần vượt phải tính thuế (NĐ 253/2026 Điều 8.3.đ)' }
    ],
    nc: [
      { id: 'anca', t: 'Ăn ca', kind: 'qty', tax: 'free', capLaw: 'anca', law: 'Trả bằng tiền: miễn thuế đến 1,2 triệu/người/tháng, phần vượt tính thuế; DN tự nấu, mua suất ăn, phát phiếu ăn: không tính thuế (NĐ 253/2026 Điều 8.2.g, từ 01/07/2026). Không đóng BHXH, không vào đơn giá tăng ca (NĐ 145/2020 Điều 55.1.a)' },
      { id: 'dt', t: 'Điện thoại', kind: 'ratio', tax: 'all', warn: 'qc', law: 'Mặc định CHỊU thuế vì đơn vị chưa có quy chế khoán. Khoán điện thoại phục vụ công việc: chỉ phần cao hơn mức khoán ghi trong quy chế tài chính / quy chế nội bộ mới tính thuế (NĐ 253/2026 Điều 8.2.đ) – khi đã ban hành quy chế thì tick miễn thuế và nhập mức khoán vào "Miễn thuế đến"' },
      { id: 'tp', t: 'Trang phục', kind: 'ratio', tax: 'free', cap: 416667, warn: 'tp', law: 'Trang phục bằng tiền được tính chi phí tối đa 5 triệu/người/năm (NĐ 320/2025 Điều 10) → phần khoán trong mức này không tính thuế, phần vượt tính thuế (NĐ 253/2026 Điều 8.2.đ). Mức trần tháng 416.667 = 5.000.000 ÷ 12 – theo dõi cả năm' },
      { id: 'xx', t: 'Xăng xe, đi lại', kind: 'ratio', tax: 'all', warn: 'xx', law: 'Hỗ trợ xăng xe trả bằng tiền cùng lương: tính thuế TNCN. Chỉ không tính khi DN bố trí phương tiện đưa đón theo quy chế (NĐ 253/2026 Điều 8.4.c) hoặc thanh toán công tác phí có chứng từ (Điều 8.4.k)' },
      { id: 'nha', t: 'Nhà ở', kind: 'ratio', tax: 'all', warn: 'nha', law: 'Hỗ trợ nhà ở bằng tiền: tính thuế TNCN. Tiền thuê nhà DN trả thay: tính vào thu nhập chịu thuế theo số thực trả nhưng không quá 15% tổng thu nhập chịu thuế (NĐ 253/2026 Điều 8.2.h)' },
      { id: 'cc', t: 'Chuyên cần', kind: 'cond', cond: 100, tax: 'all', law: 'Khoản phụ thuộc quá trình làm việc → không đóng BHXH (NĐ 158/2025 Điều 7.1.b). Chịu thuế TNCN' }
    ],
    kpi: [{ id: 'kpi', t: 'Lương KPI', kind: 'input', tax: 'all', law: 'Biến động theo kết quả công việc → không đóng BHXH (NĐ 158/2025 Điều 7.1.b–c). Chịu thuế TNCN' }],
    thuong: [{ id: 'thle', t: 'Thưởng lễ, tết', kind: 'input', tax: 'all', law: 'Thưởng (BLLĐ Điều 104) – không đóng BHXH, chịu thuế TNCN (NĐ 253/2026 Điều 8.2.i)' }, { id: 'thk', t: 'Thưởng khác', kind: 'input', tax: 'all', law: 'Thưởng – không đóng BHXH, chịu thuế TNCN' }]
  };
  var LG_WARN = { qc: 'Miễn thuế điện thoại chỉ trong mức khoán ghi ở quy chế tài chính / quy chế nội bộ – nhập mức khoán vào "Miễn thuế đến"', tp: 'Trang phục bằng tiền: tối đa 5 triệu/người/năm (NĐ 320/2025 Điều 10)', xx: 'Xăng xe trả bằng tiền không thuộc khoản miễn thuế (NĐ 253/2026 Điều 8) – chỉ tick miễn khi là phương tiện đưa đón theo quy chế', nha: 'Hỗ trợ nhà ở bằng tiền không thuộc khoản miễn thuế (NĐ 253/2026 Điều 8.2.h)', doc: 'Chỉ miễn thuế phần theo mức cơ quan nhà nước quy định cho nghề, công việc đó (NĐ 253/2026 Điều 8.3)' };
  function lgPre(cat, id) { return (LG_PRE[cat] || []).filter(function (x) { return x.id === id; })[0]; }
  function lgMk(cat, id) { var p = lgPre(cat, id), it = Object.assign({ g: 'tn', cat: cat, kind: cat === 'cd' ? 'fix' : cat === 'nc' ? 'ratio' : 'input', amt: 0, price: 0, slip: true }, p); if (cat === 'nc' && id === 'anca') it.price = 0; return it; }
  function lgItems0() {
    return [lgMk('cd', 'cv'), lgMk('nc', 'anca'), lgMk('nc', 'dt'), lgMk('nc', 'tp'), lgMk('nc', 'xx'), lgMk('kpi', 'kpi'), lgMk('thuong', 'thle'),
      { id: 'tamung', t: 'Tạm ứng lương', g: 'kt', dk: 'adv', kind: 'input', amt: 0, slip: true, law: 'Tạm ứng không tính lãi, NLĐ hoàn trả (BLLĐ Điều 101)' },
      { id: 'boithuong', t: 'Bồi thường thiệt hại', g: 'kt', dk: 'dmg', kind: 'input', amt: 0, slip: true, law: 'Chỉ khấu trừ để bồi thường hư hỏng dụng cụ, thiết bị, tài sản; tối đa 30% lương thực trả sau BH, thuế; NLĐ được biết lý do (BLLĐ Điều 102, 129)' },
      { id: 'doanphi', t: 'Đoàn phí công đoàn', g: 'kt', dk: 'union', kind: 'pctbh', amt: 0.5, slip: true, law: 'Doanh nghiệp ngoài nhà nước: đoàn viên đóng 0,5% tiền lương làm căn cứ đóng BHXH, tối đa 10% mức lương cơ sở (Quyết định 61/QĐ-TLĐ Điều 1.3, hiệu lực 01/07/2025 – đã đối chiếu văn bản gốc). DN nhà nước: 0,5% tiền lương thực lĩnh (Điều 1.2). Đoàn viên hưởng trợ cấp BHXH từ 1 tháng hoặc nghỉ không lương từ 1 tháng không phải đóng. Chỉ trừ người được đánh dấu là đoàn viên' },
      { id: 'trukhac', t: 'Khoản trừ khác (NLĐ đồng ý)', g: 'kt', dk: 'agree', kind: 'input', amt: 0, slip: true, law: 'Chỉ trừ khi NLĐ đồng ý bằng văn bản; không ép chi tiêu lương (BLLĐ Điều 94.2). Không dùng để phạt tiền (Điều 127.2)' }];
  }
  // dữ liệu mẫu: lương cơ bản đóng BHXH theo cấp (nhân viên = lương tối thiểu vùng I), phần còn lại của lương HĐ thành lương hiệu suất
  function lgSample(u, s) {
    s.otHs = true; // công ty mẫu tính đơn giá tăng ca gồm lương hiệu suất mục tiêu – đúng NĐ 145/2020 Điều 55.1.a, khớp file bảng lương mẫu
    var byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data), r = HR.dnum(refDate()), E = s.emp;
    var M = { dt: { DS001: 500000, DS002: 300000, DS005: 300000, DS006: 300000, DS007: 300000, SG001: 500000, SG003: 300000, SG006: 300000 }, xx: { DS005: 500000, DS006: 500000, DS009: 500000, SG002: 500000, SG003: 500000 }, cc: { DS006: 300000, SG002: 300000, SG006: 300000, SG007: 300000 } };
    s.items.forEach(function (it) { if (it.id === 'anca') it.price = 30000; }); s.items.splice(5, 0, lgMk('nc', 'cc'));
    Object.keys(M).forEach(function (k) { Object.keys(M[k]).forEach(function (id) { var x = E[id] || (E[id] = { amt: {} }); x.amt[k] = M[k][id]; }); });
    (u.data.NV || []).forEach(function (e) {
      var id = e['Mã NV'], sal = HRR.salaryAt(id, r, byHd, byLs), c = HRR.currentContract(byHd[id], r); if (!sal || !c) return;
      if (/cộng tác|bán thời gian|không trọn/i.test(String(c['Loại hợp đồng'] || ''))) return;
      // 10/11: dữ liệu mẫu đã làm sạch – HĐ / QĐ ghi đúng lương cơ bản (đóng BHXH), lương hiệu suất mục tiêu = thu nhập thỏa thuận − lương cơ bản
      // lương cơ bản = mức lương HĐ / QĐ, lương hiệu suất mục tiêu = cột "Lương hiệu suất mục tiêu" trên HĐ / QĐ (lgHsAt) → không cần đặt riêng
    });
    E.DS010 = Object.assign(E.DS010 || { amt: {} }, { hrsHD: 88 }); E.DS011 = Object.assign(E.DS011 || { amt: {} }, { hrsHD: 45.5 });
    if (!u.lgm) { var I = {}; if ((u.data.NV || []).some(function (e) { return e['Mã NV'] === 'DS006'; })) I.DS006 = { tamung: 1000000 }; (u.data.NV || []).forEach(function (e) { var id = e['Mã NV']; if (lgHsAt(u, id, '2026-10-31')) { I[id] = I[id] || {}; I[id].hsTl = { DS005: 95, DS008: 90, SG003: 90, SG006: 95 }[id] || 100; } }); u.lgm = { '2026-10': { inp: I, lock: null, log: [] } }; } lgSampleHs(u);
  }
  // 10/11 12:09: tháng 08, 09 mẫu đã đánh giá xong – tỷ lệ đạt 100% (như file bảng lương mẫu) → không còn ghi chú "chưa nhập tỷ lệ đạt"
  function lgSampleHs(u) { if (u.source !== 'sample' || !u.lgm) return; ['2026-08', '2026-09'].forEach(function (ym) { if (u.lgm[ym]) return; var I = {}, last = ym + (ym === '2026-09' ? '-30' : '-31'); (u.data.NV || []).forEach(function (e) { var id = e['Mã NV']; if (lgHsAt(u, id, last)) I[id] = { hsTl: 100 }; }); u.lgm[ym] = { inp: I, lock: null, log: [] }; }); }
  function lgSampleCc(u, s) { if (u.source !== 'sample' || u.lgcc) return; u.lgcc = { '2026-10': { emp: JSON.parse(JSON.stringify(s.emp)), duyet: { at: '10/10/2026 09:00:00', by: 'Kế toán trưởng (dữ liệu mẫu)' }, log: [{ at: '10/10/2026 09:00:00', by: 'Kế toán trưởng (dữ liệu mẫu)', t: 'duyệt cơ cấu' }], tao: '03/10/2026 08:30:00' } }; }
  // 09/11 22:16: dữ liệu mẫu dựng lại cơ cấu tháng 10 (đã duyệt) + 2 quyết định hiệu lực 01/11 để thử "Lấy dữ liệu từ tháng trước"
  function lgDemo5(u, s) {
    if (u.source !== 'sample' || (u.data.LS || []).some(function (x) { return x['Số quyết định'] === '15/2026/QĐ-ĐS'; })) return; u.lgDemo5 = 1; var d = u.data, nv = {}; (d.NV || []).forEach(function (e) { nv[e['Mã NV']] = e; });
    var addLs = function (id, so, moi, pc, ly) { var e = nv[id]; if (!e) return; var sal = HRR.salaryAt(id, HR.dnum('2026-10-31'), HRR.contractsOf(d), HRR.lsOf(d)), old = sal ? sal.amount : 0, nw = moi ? old + moi : old;
      d.LS = d.LS || []; d.LS.push({ 'STT': d.LS.length + 1, 'Số quyết định': so, 'Ngày quyết định': '2026-10-25', 'Ngày hiệu lực': '2026-11-01', 'Mã NV': id, 'Họ và tên': e['Họ và tên'], 'Phòng ban': e['Phòng ban'], 'Chức danh': e['Chức danh'] || '', 'Lương cũ': old, 'Lương mới': nw, 'Mức tăng': nw - old, 'Tỷ lệ tăng (%)': old ? Math.round((nw - old) / old * 1000) / 10 : '', 'Phụ cấp chức vụ': pc || '', 'Lương hiệu suất mục tiêu': lgHsAt(u, id, '2026-10-31'), 'Lý do': ly }); };
    addLs('DS006', '15/2026/QĐ-ĐS', 1000000, '', 'Điều chỉnh lương theo đánh giá năng lực (dữ liệu mẫu)');
    addLs('DS008', '16/2026/QĐ-ĐS', 0, 1000000, 'Giao phụ trách nhóm, tăng phụ cấp chức vụ (dữ liệu mẫu)');
    u.lgcc = null; lgSampleCc(u, s);
  }
  function lgDefault(u) { var s = { v: 5, at: '', vung: 1, tnld: 0.5, round: 1000, late: false, lateFine: 0, otHs: false, ccHan: 15, ccNhac: 3, otTax: 'full', d168: true, items: lgItems0(), emp: {} }; if (u && u.source === 'sample') { lgSample(u, s); lgSampleCc(u, s); lgDemo5(u, s); } return s; }
  function lgOf(u) {
    if (u.source === 'sample' && u.lgSampleV === 7) { u.lgSampleV = 8; if (u.lgset) u.lgset.otHs = true; if (u._lgDraft) u._lgDraft.otHs = true; lgSampleHs(u); } // 10/11 12:09: mẫu tính tăng ca gồm lương hiệu suất (như file bảng lương mẫu) → hết cảnh báo tăng ca
    if (u.source === 'sample' && u.lgSampleV !== 8) { u.lgSampleV = 8; u.lgset = null; u._lgDraft = null; u.lgcc = null; u.lgm = null; u._lgOld = null; } // 10/11: dữ liệu mẫu mới (HĐ ghi lương cơ bản + lương hiệu suất mục tiêu) → dựng lại thiết lập lương mẫu
    if (!u.lgset || (u.lgset.v || 1) < 2) { if (u.lgset && !u._lgOld) u._lgOld = u.lgset; if (u.lgset) u.lgset = null; u._lgDraft = u._lgDraft && u._lgDraft.v >= 2 ? u._lgDraft : lgDefault(u); }
    var s = u.lgset || u._lgDraft; s.emp = s.emp || {};
    if ((s.v || 1) < 3) { s.v = 3; s.otHs = false; s.items.forEach(function (it) { if (it.id === 'dt' && !it.cap) { it.tax = 'all'; it.law = lgPre('nc', 'dt').law; } if (it.id === 'doanphi') { it.amt = 0.5; it.law = lgItems0().filter(function (x) { return x.id === 'doanphi'; })[0].law; } }); }
    if (s.v < 4) { s.v = 4; s.ccHan = 15; s.ccNhac = 3; lgSampleCc(u, s); }
    if (s.v < 5) { s.v = 5; lgDemo5(u, s); }
    return s;
  }
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
  // khoản nhập riêng từng tháng: u.lgm[ym].inp[id][khoản] (hsTl = tỷ lệ đạt lương hiệu suất, %)
  function lgInp(u, ym, id, k) { var m = u.lgm && u.lgm[ym], v = m && m.inp && m.inp[id] ? m.inp[id][k] : undefined; return v === undefined || v === '' || v === null || isNaN(+v) ? null : +v; }
  function lgEmpAmt(E, it, def) { return E.amt[it.id] != null && E.amt[it.id] !== '' ? +E.amt[it.id] : def; }
  /* Cơ cấu nhân sự theo tháng (09/11 21:30): u.lgcc[ym] = { emp: {Mã NV: chế độ}, duyet: {at, by} | null, log: [] }
     Tháng chưa có bảng cơ cấu thì dùng bảng gần nhất trước đó, chưa có nữa thì dùng chế độ gợi ý s.emp */
  function lgccBase(u, s, ym) { var ks = Object.keys(u.lgcc || {}).filter(function (k) { return k <= ym; }).sort(); return ks.length ? u.lgcc[ks[ks.length - 1]].emp : s.emp; }
  function lgEmpM(u, s, ym, id) { var src = lgccBase(u, s, ym), E = src[id] || (src === s.emp ? null : s.emp[id]); if (!E) E = { amt: {} }; E.amt = E.amt || {}; return E; }
  function lgccObj(u, ym) { var ks = Object.keys(u.lgcc || {}).filter(function (k) { return k <= ym; }).sort(); return ks.length ? u.lgcc[ks[ks.length - 1]] : null; }
  // đơn vị của trợ cấp theo ngày công trong bảng cơ cấu tháng: ngay (đ/ngày × ngày đi làm) | thang (đ/tháng × tỷ lệ công)
  function lgccUnit(u, ym, it) { var o = lgccObj(u, ym), un = o && o.unit ? o.unit[it.id] : ''; return un || (it.kind === 'qty' ? 'ngay' : 'thang'); }
  // 10/11 11:50 anh: hình thức hợp đồng – thử việc thường không đóng BHXH
  // 10/11 12:09 anh: "Loại hợp đồng" = Chính thức | Thử việc | Bán thời gian | Cộng tác viên (mặc định hiện); "Hình thức" = Fulltime | Part-time | Cộng tác viên (mặc định ẩn)
  function lgHt(ct, ld) { ct = String(ct || ''); if (HRR.isCtv(ct) || ld === 'Cộng tác viên') return 'Cộng tác viên'; if (!ct || ct === '(chưa có HĐ)') return 'Chưa có HĐ'; if (HRR.isProb(ct)) return 'Thử việc'; if (ld === 'Bán thời gian') return 'Bán thời gian'; return 'Chính thức'; }
  function lgLd(ld) { return ld === 'Toàn thời gian' ? 'Fulltime' : ld === 'Bán thời gian' ? 'Part-time' : ld || ''; }
  // ẩn cột Hình thức (ld) một lần cho máy đã lưu lựa chọn cột từ trước
  function lgHideLd(key) { var h = S.settings[key]; if (!h) h = S.settings[key] = key === 'blHide' ? { ctype: 1 } : {}; var v = S.settings.ldHideV || {}; if (!v[key]) { h.ld = 1; v[key] = 1; S.settings.ldHideV = v; saveSettings(); } return h; }
  function lgKind(u, ym, it) { if (it.cat !== 'nc') return it.kind; var un = lgccUnit(u, ym, it); return un === 'ngay' ? 'qty' : it.kind === 'qty' ? 'ratio' : it.kind; }
  function lgccOf(u, ym) { return (u.lgcc || {})[ym] || null; }
  function lgccEnsure(u, ym) { u.lgcc = u.lgcc || {}; if (!u.lgcc[ym]) { var s = lgOf(u); u.lgcc[ym] = { emp: JSON.parse(JSON.stringify(lgccBase(u, s, ym))), duyet: null, log: [], tao: nowVn() }; } return u.lgcc[ym]; }
  // 10/11 09:31: lương hiệu suất mục tiêu ghi trên HĐ thử việc / quyết định lương / HĐLĐ (cột "Lương hiệu suất mục tiêu") – mặc định cho Cơ cấu nhân sự
  function lgHsAt(u, id, iso) {
    var d = u.data, r = HR.dnum(iso), byHd = HRR.contractsOf(d), byLs = HRR.lsOf(d), F = 'Lương hiệu suất mục tiêu', has = function (x) { return x && x[F] !== '' && x[F] != null; };
    var tv = (byHd[id] || []).filter(function (h) { return HRR.isProb(h['Loại hợp đồng']) && HR.dnum(h['Ngày hiệu lực']) <= r && (!h['Ngày hết hạn'] || HR.dnum(h['Ngày hết hạn']) >= r); })[0]; if (tv) return has(tv) ? lgAmt(tv[F]) : 0;
    var ls = (byLs[id] || []).filter(function (x) { var t = HR.dnum(x['Ngày hiệu lực']); return t !== null && t <= r && has(x); }); if (ls.length) return lgAmt(ls[ls.length - 1][F]);
    var c = HRR.currentContract(byHd[id], r); return has(c) ? lgAmt(c[F]) : 0;
  }
  function lgCap(it, L) { return it.capLaw ? +L[it.capLaw].v || 0 : +it.cap || 0; }

  /* ---------- Bộ máy tính lương 1 người, 1 tháng ---------- */
  function lgCalc(u, ym, id, opt) {
    opt = opt || {};
    var s = lgOf(u), L = {}, days = bcDays(ym), last = days[days.length - 1];
    LG_LAWK.forEach(function (k) { L[k[0]] = lgAt(k[0], last); });
    var B = bcMonth(u, ym), p = B.ppl.filter(function (x) { return x.id === id; })[0]; if (!p) return null;
    var e = p.e || {}, E = lgEmpM(u, s, ym, id), hsDef = E.hs != null && E.hs !== '' ? +E.hs : lgHsAt(u, id, last), rEnd = HR.dnum(last), byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data);
    var c = HRR.currentContract(byHd[id], rEnd), ctype = c ? String(c['Loại hợp đồng'] || '') : '', sal = HRR.salaryAt(id, rEnd, byHd, byLs);
    var hdSal = sal ? +sal.amount || 0 : 0, cb = E.cb != null && E.cb !== '' ? +E.cb : hdSal, R = ccOf(u).rule, si = p.sh ? shiftInfo(p.sh) : null, fullH = si ? si.full : 8;
    var hr = !!(p.exc && p.exc.hr), ctv = !!(p.exc && p.exc.ctv) || HRR.isCtv(ctype), prob = HRR.isProb(ctype);
    var hl = c ? lgIso(c['Ngày hiệu lực']) : '', het = c ? lgIso(c['Ngày hết hạn']) : '', term = !c ? 0 : HRR.isIndef(ctype) || !het ? 999 : hl ? (lgDays(hl, het) + 1) / 30.4 : 999;
    var r = { u: u, id: id, ym: ym, name: p.name, dept: p.dept, cdanh: e['Chức danh'] || e['Chức vụ'] || '', ctype: ctype || '(chưa có HĐ)', ld: hr ? (ctv ? 'Cộng tác viên' : 'Bán thời gian') : 'Toàn thời gian', lines: [], warn: [], dn: [], salSrc: sal ? sal.src : '', base: cb, locked: !!bcX(u).lock[ym], sum: p.sum };
    var add = function (grp, k, t, v, f, law, flag) { var o = { grp: grp, k: k, t: t, v: Math.round(v || 0), f: f || '', law: law || '' }; if (flag) Object.assign(o, flag); r.lines.push(o); return o; };
    var W = function (lv, t) { r.warn.push({ lv: lv, t: t }); };
    // sửa tay trên bảng lương: u.lgm[ym].ovr[id][khóa] – ô tự động bị sửa sẽ được đánh dấu và cảnh báo
    var OV = (u.lgm && u.lgm[ym] && u.lgm[ym].ovr && u.lgm[ym].ovr[id]) || {}; r.ovr = {};
    var O = function (k, auto) { var v = OV[k]; if (v != null && v !== '' && !isNaN(+v)) { r.ovr[k] = { auto: auto, v: +v }; return +v; } return auto; };
    var fix = function (k, ok) { if (!r.ovr[ok || k]) return; r.lines.forEach(function (l) { if (l.k === k) { l.v = Math.round(r.ovr[ok || k].v); l.f = 'sửa tay trên bảng lương (tự tính: ' + lgMoney(r.ovr[ok || k].auto) + ')'; } }); };
    var cc = lgccOf(u, ym); r.ccSt = cc ? (cc.duyet ? 'duyet' : 'nhap') : 'chua';
    cb = O('cb', cb); r.base = cb;
    var T = L.tl.v, ref = +L.ref.v || 0, vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (L.lttv.v || [])[vg] || 0, ltH = (L.lttv.h || [])[vg] || 0;
    if (!sal && E.cb == null) W('bad', 'Chưa có mức lương: không thấy HĐ hoặc quyết định lương còn hiệu lực đến ' + HR.vnDate(last) + ' và chưa nhập lương cơ bản');
    // 1. Lương theo ngày công (giờ công)
    var outD = 0; Object.keys(p.days).forEach(function (dd) { var x = p.days[dd]; if (x.src === 'out') outD += x.kind === 'work' ? 1 : x.kind === 'half' ? 0.5 : 0; });
    var std = O('std', (p.sum.std || 0) + (hr ? 0 : outD)), cong = O('cong', hr ? p.sum.hours || 0 : p.sum.salary || 0), work = O('work', hr ? p.sum.hDays || 0 : p.sum.work || 0), ratio = 1, luong = 0, unitH = 0, agreedH = 0;
    var C = r.c = { cb: cb, hr: hr, std: hr ? 0 : std, cong: cong, work: work, paid: p.sum.paid || 0, hol: p.sum.hol || 0, unpaid: p.sum.unpaid || 0, bhD: p.sum.bh || 0, lateMin: p.sum.lateMin || 0, uo: 0, otN: O('otN', p.sum.otN || 0), otR: O('otR', p.sum.otR || 0), otH: O('otH', p.sum.otH || 0), ot: 0, d168: 0, bhBase: 0, bhxh: 0, bhyt: 0, bhtn: 0, tntt: 0, gtBan: 0, gtNpt: 0, it: {}, full: {}, hsMt: 0, hsTl: 0, hs: 0 };
    if (hr) {
      Object.keys(p.days).forEach(function (dd) { var x = p.days[dd]; if (x.src === 'out') return; if (x.kind === 'work') agreedH += si ? si.full : 0; else if (x.kind === 'half') agreedH += si ? si.half : 0; });
      var hrs = cong, hHD = +E.hrsHD || 0; if (hHD) agreedH = hHD; unitH = +E.hourly || (agreedH ? cb / agreedH : 0); luong = unitH * hrs; ratio = agreedH ? Math.min(1, hrs / agreedH) : 0;
      if (!E.hourly && !hHD) W('bad', 'Chưa nhập số giờ làm theo HĐ / tháng (Cơ cấu nhân sự) – đơn giá giờ đang ước theo ca (' + lgNum(agreedH) + ' giờ). Lương bán thời gian = lương giờ × số giờ thỏa thuận trong HĐ (NĐ 158/2025 Điều 7.2)');
      add('tn', 'tg', 'Lương theo giờ làm', luong, lgNum(hrs) + ' giờ × ' + lgMoney(unitH) + ' đ/giờ' + (E.hourly ? ' (đơn giá nhập riêng)' : ' (= ' + lgMoney(cb) + ' ÷ ' + lgNum(agreedH) + (hHD ? ' giờ theo HĐ / tháng)' : ' giờ ước theo ca)')), 'Bán thời gian, cộng tác viên hưởng theo thời gian làm việc thực tế (BLLĐ Điều 32.3)');
    } else {
      ratio = std ? Math.min(1, cong / std) : 0; luong = cb * ratio; unitH = std && fullH ? cb / (std * fullH) : 0;
      add('tn', 'tg', 'Lương theo ngày công', luong, lgMoney(cb) + ' × ' + lgNum(cong) + ' / ' + lgNum(std) + ' công (đi làm + nghỉ có lương + nghỉ lễ)' + (outD ? ' · ' + (p.join && p.join > days[0] ? 'vào làm ' + HR.vnDate(p.join) : 'nghỉ việc ' + HR.vnDate(p.left)) + ', công chuẩn tính cả tháng' : ''), 'Lương cơ bản theo ' + (E.cb != null && E.cb !== '' ? 'Cơ cấu nhân sự' : sal ? sal.src : 'HĐ / quyết định lương') + '; ngày lễ, phép năm, việc riêng có lương hưởng nguyên lương (BLLĐ Điều 112, 113, 115; NĐ 145/2020 Điều 67)');
      if ((s.late === true || s.late === 'time') && p.sum.lateMin) { var lt = unitH * p.sum.lateMin / 60; luong -= lt; add('tn', 'late', 'Không trả lương thời gian đi muộn', -lt, lgNum(p.sum.lateMin) + ' phút × ' + lgMoney(unitH) + ' đ/giờ', 'Chỉ không trả lương cho đúng thời gian không làm việc – không phải phạt tiền (BLLĐ Điều 127.2)'); }
      if (s.late === 'fine') { var nL = p.sum.late || 0, fn = (+s.lateFine || 0) * nL; if (fn) { luong -= fn; add('tn', 'late', 'Trừ tiền đi muộn (phạt)', -fn, nL + ' lần × ' + lgMoney(s.lateFine), 'SAI QUY ĐỊNH: BLLĐ Điều 127.2 cấm phạt tiền, cắt lương thay việc xử lý kỷ luật lao động'); W('bad', 'Đang trừ tiền phạt đi muộn ' + lgMoney(fn) + ' – sai quy định BLLĐ Điều 127.2 (cấm phạt tiền, cắt lương). Nên chuyển về "Không trả lương đúng số phút đi muộn" (Thiết lập công thức lương → Tỷ lệ & công thức)'); } }
      if (sal && cb < ltM) W('bad', 'Lương cơ bản ' + lgMoney(cb) + ' thấp hơn lương tối thiểu vùng ' + (vg + 1) + ' (' + lgMoney(ltM) + ') – BLLĐ Điều 90.2; ' + L.lttv.s);
    }
    luong = O('tg', luong); fix('tg'); C.tg = luong;
    // 2. Tăng ca (NĐ 145/2020 Điều 55.1.a: tiền lương thực trả của công việc – gồm lương cơ bản, trợ cấp cố định, lương hiệu suất; KHÔNG gồm thưởng Điều 104, ăn ca, xăng xe, điện thoại, đi lại, nhà ở, hỗ trợ không liên quan công việc)
    var tnItems = 0, exempt = 0, cdFull = 0, pcv = 0;
    if (c && c['Phụ cấp chức vụ']) pcv = lgAmt(c['Phụ cấp chức vụ']);
    (byLs[id] || []).forEach(function (x) { var d = lgIso(x['Ngày hiệu lực']); if (d && d <= last && x['Phụ cấp chức vụ'] !== '' && x['Phụ cấp chức vụ'] != null) pcv = lgAmt(x['Phụ cấp chức vụ']); });
    s.items.filter(function (it) { return it.cat === 'cd'; }).forEach(function (it) { cdFull += lgEmpAmt(E, it, it.src === 'hd' ? pcv : +it.amt || 0); });
    var rN = Math.max(150, +R.otRateN || 150), rR = Math.max(200, +R.otRateR || 200), rH = Math.max(300, +R.otRateH || 300), otH = C.otN + C.otR + C.otH, ot = 0;
    if (otH) {
      var otX = 0; s.items.filter(function (it) { return it.cat === 'nc' && it.ot && lgKind(u, ym, it) !== 'qty'; }).forEach(function (it) { otX += lgEmpAmt(E, it, +it.amt || 0); if (['anca', 'dt', 'xx', 'nha'].indexOf(it.id) >= 0) W('warn', it.t + ' đang được tính vào đơn giá tăng ca – NĐ 145/2020 Điều 55.1.a loại trừ khoản này'); });
      var hsOt = s.otHs ? hsDef : 0, otB = cb + cdFull + hsOt + otX, uo = hr ? unitH : (std && fullH ? otB / (std * fullH) : 0);
      C.uo = uo; ot = O('ot', uo * (C.otN * rN + C.otR * rR + C.otH * rH) / 100);
      var otEx = s.otTax === 'premium' ? ot - uo * otH : ot;
      if (otH > 40) { otEx = otEx * 40 / otH; W('warn', 'Làm thêm ' + lgNum(otH) + ' giờ trong tháng – vượt 40 giờ/tháng (BLLĐ Điều 107.2.b). Phần vượt giới hạn không được miễn thuế (NĐ 253/2026 Điều 26.3)'); }
      if (!hr && !s.otHs && hsDef) W('warn', 'Đơn giá tăng ca chưa gồm lương hiệu suất (theo lựa chọn của đơn vị). NĐ 145/2020 Điều 55.1.a tính theo tiền lương thực trả của công việc, chỉ loại trừ thưởng Điều 104, ăn ca, xăng xe, điện thoại, đi lại, nhà ở – nếu lương hiệu suất là tiền lương theo công việc thì tiền tăng ca đang thấp hơn mức luật ' + lgMoney(uo * (C.otN * rN + C.otR * rR + C.otH * rH) / 100 * hsDef / otB) + '. Đổi ở Thiết lập công thức lương → Tỷ lệ & công thức');
      exempt += otEx; C.ot = ot;
      add('tn', 'ot', 'Lương tăng ca', ot, 'đơn giá ' + lgMoney(uo) + ' đ/giờ' + (hr ? '' : ' (= ' + lgMoney(otB) + ' lương cơ bản + trợ cấp cố định' + (hsOt ? ' + lương hiệu suất mục tiêu' : '') + (otX ? ' + trợ cấp gắn công việc' : '') + ' ÷ ' + lgNum(std * fullH) + ' giờ)') + ' × (' + [C.otN ? lgNum(C.otN) + ' giờ × ' + rN + '%' : '', C.otR ? lgNum(C.otR) + ' giờ × ' + rR + '%' : '', C.otH ? lgNum(C.otH) + ' giờ × ' + rH + '%' : ''].filter(Boolean).join(' + ') + ') · miễn thuế ' + lgMoney(otEx), 'BLLĐ Điều 98; NĐ 145/2020 Điều 55; miễn thuế TNCN: Luật 109/2025 Điều 4.8, NĐ 253/2026 Điều 26' + (s.otTax === 'premium' ? ' – đang để chỉ miễn phần trả cao hơn' : ''), { ex: otEx, slip: true }); fix('ot');
    }
    // 3. Lương hiệu suất = mục tiêu × tỷ lệ đạt (mặc định = tỷ lệ ngày công)
    var hsMt = O('hsMt', hsDef);
    if (hsMt) { var tl = lgInp(u, ym, id, 'hsTl'); if (tl == null && !hr) W('warn', 'Chưa nhập tỷ lệ đạt lương hiệu suất tháng ' + HR.ymLabel(ym) + ' – đang tạm tính 100%. Lương hiệu suất phải căn cứ kết quả đánh giá theo quy chế; nếu tháng nào cũng trả đủ, cơ quan BHXH có thể coi là tiền lương phải đóng (NĐ 158/2025 Điều 7). Xem Hướng dẫn lập quy chế đánh giá hiệu suất (Cơ cấu nhân sự)');
      var rt = tl != null ? tl / 100 : 1, hv = O('hs', hsMt * ratio * rt); C.hsMt = hsMt; C.hsTl = rt * 100; C.hs = hv; tnItems += hv;
      add('tn', 'hs', 'Lương hiệu suất', hv, lgMoney(hsMt) + ' × ' + lgPct(ratio * 100) + ' công × ' + lgPct(rt * 100) + (tl != null ? ' tỷ lệ đạt (nhập tháng ' + HR.ymLabel(ym) + ')' : ' tỷ lệ đạt (chưa nhập – tạm tính 100%)'), 'Khoản biến động theo hiệu quả công việc → không đóng BHXH (NĐ 158/2025 Điều 7.1.b–c), chịu thuế TNCN. Lưu ý: nếu thực tế trả cố định hằng tháng không gắn kết quả công việc, cơ quan BHXH có thể coi là tiền lương phải đóng', { slip: true }); fix('hs'); }
    // 4. Trợ cấp cố định, trợ cấp theo ngày công, KPI, thưởng
    s.items.filter(function (it) { return it.g === 'tn'; }).forEach(function (it) {
      var full = lgEmpAmt(E, it, it.src === 'hd' ? pcv : +it.amt || 0), v = 0, f = '', m = lgInp(u, ym, id, it.id);
      var kd = lgKind(u, ym, it);
      if (kd === 'fix') { v = full; f = 'cố định ' + lgMoney(full); }
      else if (kd === 'ratio') { v = full * ratio; f = lgMoney(full) + ' × ' + lgPct(ratio * 100) + ' công'; }
      else if (kd === 'cond') { var ok = ratio * 100 >= (+it.cond || 0); v = ok ? full : 0; f = (ok ? 'đủ ' : 'chưa đủ ') + (+it.cond || 0) + '% công (đạt ' + lgPct(ratio * 100) + ')'; }
      else if (kd === 'qty') { var q = m != null ? m : work, pr = lgEmpAmt(E, it, +it.price || 0); v = q * pr; f = lgNum(q) + ' ngày đi làm × ' + lgMoney(pr); }
      else if (kd === 'input') { v = m != null ? m : 0; f = m != null ? 'nhập tháng ' + HR.ymLabel(ym) : 'nhập ở Bảng lương tháng'; }
      if (kd !== 'input') { v = O('it.' + it.id, v); if (r.ovr['it.' + it.id]) f = 'sửa tay trên bảng lương (tự tính: ' + lgMoney(r.ovr['it.' + it.id].auto) + ')'; }
      C.it[it.id] = v; C.full[it.id] = kd === 'fix' || kd === 'cond' || kd === 'ratio' ? full : 0;
      if (!v && !opt.all) return;
      tnItems += v;
      var ex = 0;
      if (it.tax === 'free') {
        var cap = lgCap(it, L); ex = cap ? Math.min(v, cap) : v; if (cap) f += ' · miễn thuế đến ' + lgMoney(cap);
        if (cap && v > cap) W('warn', it.t + ' ' + lgMoney(v) + ' vượt mức miễn thuế ' + lgMoney(cap) + '/tháng – phần vượt ' + lgMoney(v - cap) + ' tính vào thu nhập chịu thuế' + (it.warn === 'tp' ? ' (trang phục: tối đa 5 triệu/người/năm – NĐ 320/2025 Điều 10)' : ''));
        if (!cap && it.warn === 'qc') W('warn', it.t + ' đang để miễn thuế toàn bộ nhưng chưa nhập mức khoán – ' + LG_WARN.qc);
        if (it.warn === 'xx' || it.warn === 'nha') W('bad', it.t + ' đang để miễn thuế – ' + LG_WARN[it.warn]);
        if (it.warn === 'doc') W('info', it.t + ': ' + LG_WARN.doc);
      }
      exempt += ex;
      add('tn', it.id, it.t, v, f, it.law, { ex: ex, slip: it.slip, cat: it.cat });
    });
    var sumCat = function (cat, key) { return s.items.filter(function (it) { return it.g === 'tn' && it.cat === cat; }).reduce(function (t, it) { return t + (+C[key][it.id] || 0); }, 0); };
    C.cdT = sumCat('cd', 'it'); C.ncT = sumCat('nc', 'it'); C.kpiT = sumCat('kpi', 'it'); C.thT = sumCat('thuong', 'it'); C.tcT = C.cdT + C.ncT; C.kthT = C.kpiT + C.thT;
    // 5. Bảo hiểm: lương đóng BHXH = lương cơ bản + trợ cấp cố định
    var noPay = (p.sum.unpaid || 0) + (p.sum.bh || 0) + outD, bhOk = true, why = '';
    if (ctv) { bhOk = false; why = 'Hợp đồng cộng tác viên / dịch vụ – không phải HĐLĐ'; }
    else if (!c) { bhOk = false; why = 'Chưa có hợp đồng'; }
    else if (prob) { bhOk = false; why = 'Đang ở HĐ thử việc riêng (không thuộc diện BHTN – Luật Việc làm 2025 Điều 31.2; BHXH theo HĐLĐ – Luật BHXH Điều 2.1.a)'; }
    else if (term < 1) { bhOk = false; why = 'HĐLĐ dưới 01 tháng (Luật BHXH Điều 2.1.a)'; }
    else if (hr && cb < ref) { bhOk = false; why = 'Bán thời gian, lương tháng theo HĐ ' + lgMoney(cb) + ' thấp hơn mức thấp nhất ' + lgMoney(ref) + ' (Luật BHXH Điều 2.1.l)'; }
    var skip14 = bhOk && noPay >= 14; if (skip14) why = 'Không làm việc, không hưởng lương ' + lgNum(noPay) + ' ngày làm việc' + (outD ? ' (gồm ' + lgNum(outD) + ' ngày chưa vào làm / đã nghỉ việc)' : '') + ' – từ 14 ngày trở lên tháng này không đóng (Luật BHXH Điều 33.5, 34.3; Luật Việc làm Điều 33.4)';
    var bhBase = O('bhBase', cb + cdFull), b1 = Math.min(Math.max(bhBase, ref), 20 * ref), b2 = Math.min(Math.max(bhBase, ref), 20 * ltM), nl = 0;
    r.bhBase = bhBase; r.bhOk = bhOk && !skip14; r.bhWhy = why; C.bhBase = r.bhOk ? bhBase : 0;
    if (r.bhOk) {
      var xh = O('bhxh', b1 * T.nlXh / 100), yt = O('bhyt', b1 * T.nlYt / 100), tn = O('bhtn', b2 * T.nlTn / 100); nl = xh + yt + tn; C.bhxh = xh; C.bhyt = yt; C.bhtn = tn;
      var bf = 'lương đóng BHXH ' + lgMoney(bhBase) + ' = lương cơ bản ' + lgMoney(cb) + (cdFull ? ' + trợ cấp cố định ' + lgMoney(cdFull) : '') + (b1 !== bhBase ? ' (giới hạn ' + lgMoney(b1) + ')' : '');
      add('bh', 'bhxh', 'BHXH (' + lgPct(T.nlXh) + ')', xh, bf, 'Luật BHXH 41/2024 Điều 31, 33.1.a; NĐ 158/2025 Điều 7', { slip: true });
      add('bh', 'bhyt', 'BHYT (' + lgPct(T.nlYt) + ')', yt, '', 'Luật BHYT Điều 13.1.a', { slip: true });
      add('bh', 'bhtn', 'BHTN (' + lgPct(T.nlTn) + ')', tn, b2 !== b1 ? 'trần 20 lần lương tối thiểu vùng ' + lgMoney(b2) : '', 'Luật Việc làm 74/2025 Điều 33.1.a, 34', { slip: true }); fix('bhxh'); fix('bhyt'); fix('bhtn');
      var dXh = O('dnXh', b1 * (T.dnOm + T.dnHt + (+s.tnld || 0)) / 100), dYt = O('dnYt', b1 * T.dnYt / 100), dTn = O('dnTn', b2 * T.dnTn / 100), kp = O('kpcd', b1 * T.kpcd / 100);
      r.dn.push(['BHXH (' + lgPct(T.dnOm + T.dnHt + (+s.tnld || 0)) + ', gồm TNLĐ – BNN ' + lgPct(s.tnld) + ')', dXh], ['BHYT (' + lgPct(T.dnYt) + ')', dYt], ['BHTN (' + lgPct(T.dnTn) + ')', dTn], ['Kinh phí công đoàn (' + lgPct(T.kpcd) + ')', kp]);
      if (!hr && bhBase < ltM) W('bad', 'Lương đóng BHXH ' + lgMoney(bhBase) + ' thấp hơn lương tối thiểu vùng ' + (vg + 1) + ' (' + lgMoney(ltM) + ')');
    } else if (why) W('info', 'Không đóng bảo hiểm tháng này: ' + why);
    if (hr && unitH && ltH && unitH < ltH) W('bad', 'Đơn giá ' + lgMoney(unitH) + ' đ/giờ thấp hơn lương tối thiểu giờ vùng ' + (vg + 1) + ' (' + lgMoney(ltH) + ') – ' + L.lttv.s);
    var d168 = 0;
    if (s.d168 && !bhOk && c && !ctv && !prob) { var rt2 = T.dnOm + T.dnHt + (+s.tnld || 0) + T.dnYt + T.dnTn; d168 = O('d168', luong * rt2 / 100); tnItems += d168; add('tn', 'd168', 'Khoản trả thêm thay đóng BH', d168, lgMoney(luong) + ' × ' + lgPct(rt2), 'BLLĐ Điều 168.3 – NLĐ không thuộc diện BHXH, BHYT, BHTN bắt buộc được trả thêm khoản tương đương mức NSDLĐ đóng – chịu thuế TNCN (đã xác nhận 09/11)', { slip: true }); fix('d168'); }
    C.d168 = d168;
    var gross = luong + ot + tnItems; r.gross = gross; r.bhNL = nl; C.tongTN = gross; C.bhNL = nl;
    // 6. Thuế TNCN: TN chịu thuế = Tổng thu nhập − khoản miễn · TN tính thuế = TN chịu thuế − giảm trừ (bản thân, người phụ thuộc, BH NLĐ đóng)
    exempt = O('exempt', exempt);
    var tnct = Math.max(0, gross - exempt), tax = 0, npt = O('npt', E.npt != null && E.npt !== '' ? +E.npt : +e['Số người phụ thuộc'] || 0), short = ctv || prob || term < 3;
    r.tnct = tnct; r.exempt = exempt; r.npt = npt; r.short = short; C.tnct = tnct; C.exempt = exempt; C.npt = npt;
    add('tax', 'tnct', 'Thu nhập chịu thuế', tnct, lgMoney(gross) + ' tổng thu nhập − ' + lgMoney(exempt) + ' khoản miễn thuế (tăng ca, ăn ca, điện thoại, trang phục… trong mức quy định)', 'Luật TNCN 109/2025 Điều 3, 4; NĐ 253/2026 Điều 8, 26', { info: 1 });
    if (short) {
      var K = L.k10.v;
      if (E.cam08) add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', 0, 'có bản cam kết thu nhập chưa đến mức nộp thuế → tạm không khấu trừ', L.k10.s, { slip: true });
      else if (gross >= K[1] || E.req10) { tax = tnct * K[0] / 100; add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', tax, lgMoney(tnct) + ' × ' + K[0] + '%', L.k10.s + (ctv ? ' · hợp đồng cộng tác viên' : prob ? ' · HĐ thử việc' : ' · HĐLĐ dưới 03 tháng'), { slip: true }); }
      else add('tax', 'thue', 'Thuế TNCN (khấu trừ ' + K[0] + '%)', 0, 'lần chi ' + lgMoney(gross) + ' dưới ' + lgMoney(K[1]) + ' → không khấu trừ (trừ khi cá nhân yêu cầu)', L.k10.s, { slip: true });
    } else {
      var gt = [O('gtBan', L.gt.v[0]), L.gt.v[1]], gNpt = O('gtNpt', npt * gt[1]); C.gtBan = gt[0]; C.gtNpt = gNpt;
      var tntt = Math.max(0, tnct - nl - gt[0] - gNpt), tx = lgTax(tntt, L.bac.v); tax = tx.v; r.tntt = tntt; C.tntt = tntt;
      add('tax', 'gt', 'Các khoản giảm trừ', nl + gt[0] + gNpt, 'bản thân ' + lgMoney(gt[0]) + (npt ? ' + ' + npt + ' người phụ thuộc × ' + lgMoney(gt[1]) : '') + ' + BH người lao động đóng ' + lgMoney(nl), 'Luật TNCN 109/2025 Điều 8.2, 10 (' + L.gt.s + ')', { info: 1 });
      add('tax', 'tntt', 'Thu nhập tính thuế', tntt, lgMoney(tnct) + ' − ' + lgMoney(nl + gt[0] + gNpt), 'Luật TNCN 109/2025 Điều 8.2', { info: 1 });
      add('tax', 'thue', 'Thuế TNCN (lũy tiến)', tax, tx.f || 'chưa đến mức nộp thuế', L.bac.s + ' – HĐLĐ từ 03 tháng: khấu trừ theo biểu lũy tiến (NĐ 253/2026 Điều 50.2)', { slip: true });
    }
    if (OV.tax != null && OV.tax !== '') { tax = O('tax', tax); fix('thue', 'tax'); }
    // 7. Khấu trừ sau thuế: tạm ứng, bồi thường, đoàn phí, khoản NLĐ đồng ý
    var after = gross - nl - tax, kt = 0;
    s.items.filter(function (it) { return it.g === 'kt'; }).forEach(function (it) {
      var m = lgInp(u, ym, id, it.id), v = 0, f = '';
      if (it.dk === 'union') { if (!E.union) return; if (it.kind === 'pctbh') { var cpU = ref * 0.1, raw = bhBase * (+it.amt || 0) / 100; v = Math.min(raw, cpU); f = lgPct(it.amt) + ' × ' + lgMoney(bhBase) + (raw > cpU ? ' (trần 10% lương cơ sở ' + lgMoney(cpU) + ')' : ''); } else { v = lgEmpAmt(E, it, +it.amt || 0); f = 'cố định'; } }
      else { v = m != null ? m : it.kind === 'fix' ? lgEmpAmt(E, it, +it.amt || 0) : 0; f = m != null ? 'nhập tháng ' + HR.ymLabel(ym) : it.kind === 'fix' ? 'cố định' : 'nhập ở Bảng lương tháng'; }
      if (it.dk === 'union') { v = O('it.' + it.id, v); if (r.ovr['it.' + it.id]) f = 'sửa tay trên bảng lương'; }
      C.it[it.id] = v; if (!v && !opt.all) return;
      if (it.dk === 'dmg' && v > after * 0.3) W('bad', it.t + ' ' + lgMoney(v) + ' vượt 30% lương thực trả sau BH, thuế (' + lgMoney(after * 0.3) + ') – BLLĐ Điều 102.3');
      kt += v; add('kt', it.id, it.t, v, f, it.law, { slip: it.slip });
    });
    var net = after - kt, rnd = +s.round || 0, pay = rnd ? Math.round(net / rnd) * rnd : Math.round(net);
    r.tax = tax; r.kt = kt; r.net = net; r.pay = pay; r.dnTotal = r.dn.reduce(function (t, x) { return t + x[1]; }, 0);
    C.tax = tax; C.tamung = C.it.tamung || 0; C.ktKhac = kt - C.tamung; C.ktT = kt; C.net = net; C.pay = pay; C.dn = r.dn.map(function (x) { return x[1]; }); C.dnBh = (C.dn[0] || 0) + (C.dn[1] || 0) + (C.dn[2] || 0); C.kpcd = C.dn[3] || 0; C.dnT = r.dnTotal; C.cost = gross + r.dnTotal;
    var nOv = Object.keys(r.ovr).length; if (nOv) W('warn', 'Đã sửa tay ' + nOv + ' ô trên bảng lương (khác số tự tính từ cơ cấu, bảng công)');
    if (r.ccSt !== 'duyet') W('info', 'Cơ cấu nhân sự tháng ' + HR.ymLabel(ym) + (r.ccSt === 'nhap' ? ' chưa duyệt' : ' chưa lập – đang dùng cơ cấu tháng gần nhất'));
    if (!r.locked) W('info', 'Tháng ' + HR.ymLabel(ym) + ' chưa chốt công – số liệu đang tạm tính theo bảng công hiện tại');
    if (ctv && (p.sum.hDays || 0) >= 15) W('warn', 'Cộng tác viên đi làm ' + p.sum.hDays + ' ngày trong tháng – có dấu hiệu quan hệ lao động (BLLĐ Điều 13; Luật BHXH Điều 2.1.a)');
    return r;
  }

  /* ---------- Trang: Thiết lập công thức lương ---------- */
  var LG_TABS = [['kh', 'Khoản lương'], ['ct', 'Tỷ lệ & công thức'], ['lu', 'Tham số theo luật'], ['vb', 'Văn bản & quy chế']];
  function lgUnit() { var f = ps('lg', { tab: 'kh', u: '', ym: '', pick: null }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function lgStyle() {
    if (document.getElementById('lgCss')) return;
    var st = document.createElement('style'); st.id = 'lgCss';
    st.textContent = '.lg-law{font-size:12px;color:var(--muted);line-height:1.45}.lg-vb td,.lg-vb th{white-space:normal;vertical-align:top}.lg-vb td:first-child{min-width:190px}.lg-vb td:last-child{white-space:nowrap}.lg-qc{display:grid;gap:8px}.lg-qc-it{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:10px}.lg-qc-it .lg-law{margin-top:3px}@media(max-width:640px){.lg-qc-it{flex-direction:column;align-items:stretch}.lg-qc-it .link-row{justify-content:flex-end}}.lg-chk{display:inline-flex;align-items:center;gap:6px}.lg-num{width:112px;text-align:right}.lg-pv{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}.lg-pv .card{min-width:0}.lg-pv .tbl td:first-child{min-width:200px}.lg-pv .tbl td.lg-f{min-width:180px}.lg-pv .card h3{margin:0 0 2px}.tbl td.n,.tbl th.n{text-align:right;white-space:nowrap}.lg-pv tr.g td{background:rgba(127,127,127,.07);font-weight:600}.lg-pv tr.tot td{font-weight:700;border-top:2px solid var(--line-2)}.lg-f{font-size:12px;color:var(--muted)}.lg-w{margin:8px 0 0;padding-left:18px}.lg-w li{margin:3px 0}.lg-w .bad{color:#c0392b}.lg-w .warn{color:#b9770e}.lg-dn{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--muted);margin-top:8px}.lg-banner{margin-bottom:12px}.lg-pick{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 0}.lg-ok{color:#1e8449}.lg-bt td{vertical-align:top}.lg-bt select{min-width:220px}.lg-grp th.gh{text-align:center;border-bottom:1px solid var(--line)}.lg-ng td.bh{font-weight:700;background:rgba(239,68,68,.08)}.lg-ng th.cd,.lg-ng td.cd{background:rgba(20,184,166,.07)}.lg-ng th.nc,.lg-ng td.nc{background:rgba(245,158,11,.08)}.lg-ng td.bad{color:#c0392b}';
    document.head.appendChild(st);
  }
  PAGES.congthuc = function () {
    lgStyle();
    var f = ps('lg', { tab: 'kh', u: '', ym: '', pick: null }), u = lgUnit(); if (!u) return pageHead('Thiết lập công thức lương') + noData('dữ liệu');
    var s = lgOf(u), us = selUnits().length ? selUnits() : S.units;
    var head = pageHead('Thiết lập công thức lương', 'Các khoản trợ cấp, thuế TNCN, tỷ lệ bảo hiểm và công thức các cột tự tính của <b>' + esc(shortUnit(u.name)) + '</b> · ' + (u.lgset ? 'sửa lần cuối ' + esc(u.lgset.at) : '<span class="tl-draft">Đang dùng thiết lập gợi ý – sửa bất kỳ mục nào là lưu riêng cho công ty này</span>'));
    var pick = us.length > 1 ? '<div class="tl-units"><span class="vc-lbl">Công ty</span><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="lg-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : '';
    var ban = '<div class="notice warn lg-banner">' + ic('info') + '<div><b>Cách tính đang chờ kế toán trưởng duyệt nghiệp vụ.</b> Luồng tính: Lương cơ bản → Lương theo ngày công → Tổng thu nhập (+ tăng ca, trợ cấp, lương hiệu suất, KPI, thưởng) → Thu nhập chịu thuế (− khoản miễn thuế) → Lương đóng BHXH (= lương cơ bản + trợ cấp cố định) → Giảm trừ → Thu nhập tính thuế → Thuế → Thực lĩnh (= Tổng thu nhập − BH người lao động − Thuế − Tạm ứng). Giảm trừ gia cảnh chỉ dùng để tính thuế, không trừ vào tiền lĩnh.<br>Mức lương cơ bản, trợ cấp, lương hiệu suất của từng người đặt ở <a href="#cocau">Cơ cấu nhân sự</a> theo từng tháng.' + (u._lgOld ? '<br><b>Thiết lập cũ (bản trước 18:21) đã được thay bằng mô hình mới.</b>' : '') + '</div></div>';
    var tabs = '<div class="tl-tabs" role="tablist">' + LG_TABS.map(function (t) { return '<button role="tab" aria-selected="' + (f.tab === t[0]) + '" class="' + (f.tab === t[0] ? 'on' : '') + '" data-act="lg-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (['kh', 'ct', 'lu', 'vb'].indexOf(f.tab) < 0) f.tab = 'kh';
    var body = f.tab === 'ct' ? lgTabCt(u, s) : f.tab === 'lu' ? lgTabLu(u, s) : f.tab === 'vb' ? lgTabVb(u, s) : lgTabKh(u, s);
    return head + pick + ban + tabs + '<div id="lgArea">' + body + '</div>';
  };
  ACTS['lg-tab'] = function (a, id) { PS.lg.tab = id; render(); };
  ACTS['lg-u'] = function (a, id) { PS.lg.u = id; PS.lg.pick = null; render(); };

  /* Tab 1: Khoản lương – 4 nhóm */
  var LG_GRP = [['tc', 'Trợ cấp', 'Mỗi khoản chọn loại: <b>Cố định</b> (trả đủ tháng, tính vào lương đóng BHXH) hoặc <b>Theo ngày công</b> (không đóng BHXH) và có chịu thuế TNCN không. Mức từng người đặt ở Cơ cấu nhân sự.'], ['kpi', 'Lương KPI', 'Nhập cuối tháng trên Bảng lương. Lương hiệu suất mục tiêu đặt ở Cơ cấu nhân sự.'], ['thuong', 'Thưởng', 'Nhập mỗi tháng ở Bảng lương.'], ['kt', 'Khấu trừ sau thuế', 'Không có loại "Phạt": BLLĐ Điều 127.2 cấm phạt tiền, cắt lương thay xử lý kỷ luật. Bồi thường thiệt hại tối đa 30% lương thực trả (Điều 102).']];
  function lgTabKh(u, s) {
    return LG_GRP.map(function (g) {
      var list = s.items.filter(function (x) { return g[0] === 'kt' ? x.g === 'kt' : g[0] === 'tc' ? x.cat === 'cd' || x.cat === 'nc' : x.cat === g[0]; });
      var rows = list.map(function (it) {
        var how = LG_KIND[it.kind] + (it.kind === 'cond' ? ' (≥ ' + (+it.cond || 0) + '%)' : '') + (it.src === 'hd' ? ' · mặc định lấy từ HĐ' : '');
        var amt = it.kind === 'qty' ? lgMoney(it.price) + ' / ngày' : it.kind === 'pctbh' ? lgPct(it.amt) : it.kind === 'input' ? '—' : (it.src === 'hd' ? 'theo HĐ' : lgMoney(it.amt));
        var cap = it.capLaw ? lgAt(it.capLaw, refDate()).v : +it.cap || 0;
        var tx = it.g === 'kt' ? '—' : it.tax === 'free' ? 'Không chịu thuế' + (cap ? ' (miễn đến ' + lgMoney(cap) + '/tháng)' : it.warn === 'qc' ? ' <span class="tag tag-warn">nhập mức khoán</span>' : '') + ((it.warn === 'xx' || it.warn === 'nha') ? ' <span class="tag tag-bad">kiểm tra</span>' : '') : 'Chịu thuế';
        var loai = it.cat === 'cd' ? '<span class="tag tag-ok">Cố định · đóng BHXH</span>' : it.cat === 'nc' ? '<span class="tag">Theo ngày công</span>' : '';
        return '<tr><td><b>' + esc(it.t) + '</b>' + (it.g === 'kt' ? '<div class="faint">' + esc(LG_DK[it.dk] || '') + '</div>' : '') + '</td>' + (g[0] === 'tc' ? '<td>' + loai + '</td>' : '') + '<td>' + how + '</td><td class="n">' + amt + '</td><td>' + tx + '</td><td>' + (it.slip ? 'Có' : 'Không') + '</td><td><button class="btn btn-sm" data-act="lg-it" data-id="' + esc(it.id) + '">Sửa</button></td></tr>';
      }).join('');
      var used = list.map(function (x) { return x.id; }), pre = (g[0] === 'tc' ? LG_PRE.cd.map(function (x) { return ['cd', x]; }).concat(LG_PRE.nc.map(function (x) { return ['nc', x]; })) : (LG_PRE[g[0]] || []).map(function (x) { return [g[0], x]; })).filter(function (x) { return used.indexOf(x[1].id) < 0; });
      var addBar = '<div class="link-row" style="margin-top:10px;gap:6px;flex-wrap:wrap">' + pre.map(function (x) { return '<button class="btn btn-sm" data-act="lg-add" data-id="' + x[0] + '|' + x[1].id + '">+ ' + esc(x[1].t) + '</button>'; }).join('') + '<button class="btn btn-sm" data-act="lg-it" data-id="" data-g="' + g[0] + '">+ Khoản khác</button></div>';
      return '<div class="card card-pad" style="margin-bottom:14px"><h3 style="margin:0">' + g[1] + '</h3><p class="lg-law" style="margin:2px 0 8px">' + g[2] + '</p>' + (rows ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Khoản</th>' + (g[0] === 'tc' ? '<th>Loại</th>' : '') + '<th>Cách tính</th><th class="n">Mức mặc định</th><th>Thuế TNCN</th><th>Trên phiếu</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="faint" style="margin:0">Chưa có khoản nào.</p>') + addBar + '</div>';
    }).join('') + '<div class="card card-pad"><h3 style="margin:0">Tự tính</h3><p class="lg-law" style="margin:4px 0 0">Lương theo ngày công (lương cơ bản × công hưởng lương ÷ công chuẩn) · Lương tăng ca 150 / 200 / 300% (đơn giá = lương cơ bản + trợ cấp cố định ÷ giờ chuẩn; tùy chọn gồm lương hiệu suất – NĐ 145/2020 Điều 55.1.a) · Lương hiệu suất (mục tiêu × tỷ lệ ngày công × tỷ lệ đạt) · BHXH, BHYT, BHTN, thuế TNCN · Khoản trả thêm thay đóng BH (BLLĐ Điều 168.3).</p></div>';
  }
  ACTS['lg-add'] = function (a, key) { var u = lgUnit(), s = lgOf(u), k = key.split('|'), it = lgMk(k[0], k[1]); if (s.items.some(function (x) { return x.id === it.id; })) return; var last = -1; s.items.forEach(function (x, i) { if (x.cat === k[0]) last = i; }); if (last < 0) s.items.forEach(function (x, i) { if (x.g === 'tn') last = i; }); s.items.splice(last + 1, 0, it); lgSave(u, 'thêm khoản ' + it.t); toast('Đã thêm ' + it.t + ' – nhập mức từng người ở Cơ cấu nhân sự'); render(); };
  ACTS['lg-it'] = function (a, id) {
    var u = lgUnit(), s = lgOf(u), isNew = !id, g = isNew ? a.getAttribute('data-g') : null;
    if (g === 'tc') g = 'nc';
    var it = isNew ? (g === 'kt' ? { id: '', t: '', g: 'kt', dk: 'agree', kind: 'input', amt: 0, slip: true } : { id: '', t: '', g: 'tn', cat: g, kind: g === 'cd' ? 'fix' : g === 'nc' ? 'ratio' : 'input', amt: 0, price: 0, tax: 'all', slip: true }) : JSON.parse(JSON.stringify(s.items.filter(function (x) { return x.id === id; })[0] || null));
    if (!it) return;
    var isTc = it.cat === 'cd' || it.cat === 'nc', kinds = it.g === 'kt' ? ['input', 'fix', 'pctbh'] : isTc ? ['ratio', 'qty', 'cond', 'fix'] : ['input'];
    var sel = function (idd, lbl, opts, v) { return '<div class="field"><label for="' + idd + '">' + lbl + '</label><select class="input" id="' + idd + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; };
    var chk = function (idd, lbl, v) { return '<label class="lg-chk"><input type="checkbox" id="' + idd + '"' + (v ? ' checked' : '') + '> ' + lbl + '</label>'; };
    var cap = it.capLaw ? lgAt(it.capLaw, refDate()).v : +it.cap || 0;
    var body = '<form id="lgF" novalidate><p class="lg-law" style="margin-top:0">Nhóm: <b>' + esc(it.g === 'kt' ? 'Khấu trừ sau thuế' : isTc ? 'Trợ cấp' : LG_CAT[it.cat]) + '</b></p>' + field('iT', 'Tên khoản *', it.t, ' maxlength="60"') +
      (isTc ? sel('iCat', 'Loại trợ cấp', [['cd', 'Cố định – trả đủ tháng, tính vào lương đóng BHXH và đơn giá tăng ca'], ['nc', 'Theo ngày công – không đóng BHXH']], it.cat) : '') +
      (it.g === 'kt' ? sel('iDk', 'Loại khấu trừ', Object.keys(LG_DK).map(function (k) { return [k, LG_DK[k]]; }), it.dk) : '') +
      (kinds.length > 1 ? '<div id="iKW">' + sel('iK', 'Cách tính', kinds.map(function (k) { return [k, LG_KIND[k]]; }), it.kind) + '</div>' : '') +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div id="iAmtW">' + field('iA', it.kind === 'pctbh' ? 'Tỷ lệ (%)' : 'Mức mặc định (đồng/tháng)', it.kind === 'pctbh' ? lgNum(it.amt) : fmtInt(+it.amt || 0), ' inputmode="decimal"') + '</div>' +
      '<div id="iPrW">' + field('iP', 'Đơn giá mặc định (đồng/ngày đi làm)', fmtInt(+it.price || 0), ' inputmode="numeric"') + '</div><div id="iCondW">' + field('iC', '% công tối thiểu để hưởng cả tháng', it.cond == null ? 100 : it.cond, ' inputmode="numeric" maxlength="3"') + '</div></div>' +
      (it.g === 'tn' ? sel('iTax', 'Thuế TNCN', [['all', 'Chịu thuế TNCN'], ['free', 'Không chịu thuế TNCN – khoản miễn (đặt mức trần / tháng nếu có)']], it.tax || 'all') + '<div id="iCapW">' + field('iCap', 'Miễn thuế đến (đồng/tháng) – để 0 là miễn toàn bộ' + (it.capLaw ? ' · mức theo luật' : ''), fmtInt(cap), ' inputmode="numeric"' + (it.capLaw ? ' readonly' : '')) + '</div>' +
        (it.warn ? '<div class="notice warn" id="iWarn">' + ic('info') + '<div>' + esc(LG_WARN[it.warn] || '') + '</div></div>' : '') : '') +
      (isTc ? '<div style="margin:8px 0" id="iOtW">' + chk('iOt', 'Tính vào đơn giá tăng ca (chỉ khoản gắn với công việc, chức danh – NĐ 145/2020 Điều 55.1.a loại trừ ăn ca, xăng xe, điện thoại, đi lại, nhà ở)', it.ot) + '</div>' : '') + '<div style="margin:8px 0">' + chk('iSl', 'Hiện trên phiếu lương', it.slip) + '</div>' + (it.law ? '<p class="lg-law">' + esc(it.law) + '</p>' : '') +
      '<p id="lgMsg" class="tl-msg"></p><div class="link-row" style="justify-content:space-between">' + (isNew ? '<span></span>' : '<button type="button" class="btn btn-danger" id="iDel">Xóa khoản</button>') + '<span style="display:flex;gap:8px"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">' + (isNew ? 'Thêm' : 'Lưu') + '</button></span></div></form>';
    var m = modal(isNew ? 'Thêm khoản' : 'Sửa ' + it.t, shortUnit(u.name), body, true);
    var vis = function () { var cd = $('#iCat', m) && $('#iCat', m).value === 'cd', k = cd ? 'fix' : $('#iK', m) ? $('#iK', m).value : it.kind, show = function (q, on) { var el = $(q, m); if (el) el.style.display = on ? '' : 'none'; }; show('#iKW', !cd); show('#iOtW', !cd); show('#iAmtW', k !== 'qty' && k !== 'input'); show('#iPrW', k === 'qty'); show('#iCondW', k === 'cond'); show('#iCapW', !!($('#iTax', m) && $('#iTax', m).value === 'free')); var lb = $('#iAmtW label', m); if (lb) lb.textContent = k === 'pctbh' ? 'Tỷ lệ (%)' : 'Mức mặc định (đồng/tháng)'; };
    ['#iK', '#iTax', '#iCat'].forEach(function (q) { var el = $(q, m); if (el) el.addEventListener('change', vis); }); vis();
    var dl = $('#iDel', m); if (dl) dl.onclick = function () { s.items = s.items.filter(function (x) { return x.id !== it.id; }); lgSave(u, 'xóa khoản ' + it.t); m.close(); toast('Đã xóa khoản ' + it.t); render(); };
    $('#lgF', m).onsubmit = function (ev) {
      ev.preventDefault(); var v = function (q) { var el = $(q, m); return el ? el.value.trim() : ''; }, ck = function (q) { var el = $(q, m); return el ? el.checked : false; };
      var t = v('#iT'); if (!t) { $('#lgMsg', m).textContent = 'Nhập tên khoản'; return; }
      if ($('#iK', m)) it.kind = v('#iK'); if ($('#iDk', m)) it.dk = v('#iDk'); if ($('#iCat', m)) { it.cat = v('#iCat'); if (it.cat === 'cd') { it.kind = 'fix'; it.ot = false; } }
      it.t = t; it.amt = it.kind === 'pctbh' ? +String(v('#iA')).replace(',', '.') || 0 : lgAmt(v('#iA')); it.price = lgAmt(v('#iP')); it.cond = lgAmt(v('#iC'));
      if (it.g === 'tn') { it.tax = v('#iTax') || 'all'; if (!it.capLaw) it.cap = lgAmt(v('#iCap')); }
      it.slip = ck('#iSl'); if (it.cat === 'nc') it.ot = ck('#iOt'); if (it.tax === 'free' && (it.warn === 'xx' || it.warn === 'nha')) toast(LG_WARN[it.warn], 'warn');
      if (it.kind === 'pctbh' && it.dk !== 'union') { $('#lgMsg', m).textContent = 'Cách tính "% lương đóng BHXH" chỉ dùng cho đoàn phí công đoàn.'; return; }
      if (isNew) { it.id = 'k' + Date.now().toString(36); var last = -1; s.items.forEach(function (x, i) { if (it.g === 'kt' ? x.g === 'kt' : isTc ? x.cat === 'cd' || x.cat === 'nc' : x.cat === it.cat) last = i; }); s.items.splice(last < 0 ? s.items.length : last + 1, 0, it); } else s.items = s.items.map(function (x) { return x.id === it.id ? it : x; });
      lgSave(u, (isNew ? 'thêm' : 'sửa') + ' khoản ' + t); m.close(); toast('Đã lưu khoản ' + t); render();
    };
  };

  ACTS['lg-hsqc'] = function () {
    var li = function (a) { return '<ol style="margin:6px 0 12px;padding-left:20px">' + a.map(function (x) { return '<li style="margin:4px 0">' + x + '</li>'; }).join('') + '</ol>'; };
    var body = '<div class="lg-hs">' +
      '<p style="margin-top:0">Mục đích: lương hiệu suất phải thật sự <b>biến động theo kết quả công việc</b> và có <b>bằng chứng đánh giá</b> từng tháng. Khi đó khoản này không thuộc tiền lương đóng BHXH (NĐ 158/2025 Điều 7.1.b–c); nếu trả cố định, đủ mỗi tháng thì cơ quan BHXH có thể truy thu.</p>' +
      '<h4 style="margin:10px 0 2px">Các bước lập quy chế</h4>' + li([
        '<b>Chọn 3–5 chỉ tiêu đo được cho từng vị trí</b>, có trọng số cộng lại 100% (ví dụ: doanh số, số việc hoàn thành đúng hạn, tỷ lệ lỗi, đánh giá của khách hàng). Tránh chỉ tiêu chỉ là "đi làm đủ công" – đó là chuyên cần, không phải hiệu suất.',
        '<b>Quy định thang quy đổi điểm → tỷ lệ đạt</b> (ví dụ: dưới 70 điểm: 0–50%; 70–89: 80%; 90–100: 100%; vượt: tối đa 120%). Công thức: Lương hiệu suất = Mức mục tiêu × Tỷ lệ đạt.',
        '<b>Quy trình hằng tháng:</b> ai chấm (quản lý trực tiếp), ai duyệt, hạn chót, người lao động được xem và phản hồi kết quả. Lưu bảng điểm có chữ ký / xác nhận.',
        '<b>Ghi vào HĐLĐ hoặc phụ lục:</b> mức lương cơ bản, mức lương hiệu suất mục tiêu và câu "lương hiệu suất được chi trả theo kết quả đánh giá hằng tháng theo Quy chế…, không cố định".',
        '<b>Tham khảo ý kiến tổ chức đại diện người lao động</b> (nếu có) và <b>công bố công khai tại nơi làm việc</b> trước khi áp dụng – như với thang lương, bảng lương, quy chế thưởng (BLLĐ Điều 93.3, 104.2).',
        '<b>Mỗi tháng nhập tỷ lệ đạt</b> vào Bảng lương, cột "Lương hiệu suất – Tỷ lệ đạt (%)" (bấm vào ô để nhập, có gợi ý điền cho các dòng dưới). Để trống thì phần mềm tạm tính 100% và cảnh báo. Lương hiệu suất luôn nhân thêm tỷ lệ ngày công thực tế.'
      ]) +
      '<h4 style="margin:10px 0 2px">Dấu hiệu rủi ro cần tránh</h4><ul style="margin:6px 0 12px;padding-left:20px"><li>Tỷ lệ đạt tháng nào cũng 100% cho mọi người.</li><li>Không có bảng đánh giá lưu hồ sơ.</li><li>Lương cơ bản để sát lương tối thiểu vùng còn lương hiệu suất chiếm phần lớn thu nhập nhưng không có tiêu chí.</li><li>Lương hiệu suất vẫn trả đủ khi người lao động nghỉ không lương nhiều ngày.</li></ul>' +
      '<p class="lg-law">Căn cứ: Luật BHXH 41/2024 Điều 31; NĐ 158/2025 Điều 7; BLLĐ 2019 Điều 93, 104. Đây là gợi ý cách làm, đơn vị nên để kế toán trưởng / luật sư rà soát trước khi ban hành.</p>' +
      '<div class="link-row" style="justify-content:flex-end"><button type="button" class="btn" data-close>Đóng</button></div></div>';
    modal('Hướng dẫn lập quy chế đánh giá hiệu suất', 'Để lương hiệu suất không bị coi là lương cố định phải đóng BHXH', body);
  };
  BINDS.congthuc = function () {
    document.querySelectorAll('[data-lgp]').forEach(function (el) {
      el.addEventListener('change', function () {
        var u = lgUnit(), s = lgOf(u), E = lgEmp(s, el.getAttribute('data-lgp')), k = el.getAttribute('data-k');
        var raw = k === 'hrsHD' ? el.value.replace(',', '.').replace(/[^\d.]/g, '') : el.value.replace(/[^\d]/g, ''), val = el.type === 'checkbox' ? el.checked : (raw === '' ? '' : +raw);
        if (k.indexOf('a:') === 0) E.amt[k.slice(2)] = val; else E[k] = val;
        lgSave(u, 'chế độ ' + el.getAttribute('data-lgp')); toast('Đã lưu');
        if (el.type !== 'checkbox') { var y = window.scrollY, w = $('#lgArea .tbl-wrap'), sx = w ? w.scrollLeft : 0; render(); window.scrollTo(0, y); var w2 = $('#lgArea .tbl-wrap'); if (w2) w2.scrollLeft = sx; }
      });
    });
    document.querySelectorAll('[data-lgo]').forEach(function (el) {
      el.addEventListener('change', function () { var u = lgUnit(), s = lgOf(u), k = el.getAttribute('data-lgo'), v = el.value; if (k === 'lateFine') v = String(lgAmt(v)); s[k] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v; lgSave(u, k + ' = ' + v); toast('Đã lưu'); render(); });
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
      '<tr><td><b>Miễn thuế tiền lương làm thêm giờ</b><div class="lg-law">Luật 109/2025 Điều 4.8, NĐ 253/2026 Điều 26 ghi "tiền lương làm thêm giờ" – <b>đã chốt miễn toàn bộ (09/11)</b>; luật cũ chỉ miễn phần trả cao hơn</div></td><td>' + sel('otTax', [['full', 'Miễn toàn bộ tiền làm thêm (theo câu chữ luật mới)'], ['premium', 'Chỉ miễn phần trả cao hơn giờ thường']], s.otTax) + '</td></tr>' +
      '<tr><td><b>Đơn giá tăng ca có gồm lương hiệu suất?</b><div class="lg-law">NĐ 145/2020 Điều 55.1.a: tiền lương thực trả của công việc, chỉ loại trừ thưởng Điều 104, ăn ca, xăng xe, điện thoại, đi lại, nhà ở, hỗ trợ không liên quan công việc. Chọn "Không" thì phần mềm cảnh báo số tiền tăng ca có thể thiếu so với luật</div></td><td>' + sel('otHs', [['false', 'Không – chỉ lương cơ bản + trợ cấp cố định (đơn vị chọn 09/11)'], ['true', 'Có – gồm lương hiệu suất mục tiêu']], String(!!s.otHs)) + '</td></tr>' +
      '<tr><td><b>Thời gian đi muộn</b><div class="lg-law">Mặc định tắt. Được phép: không trả lương cho đúng thời gian không làm việc. Không được phạt tiền, cắt lương (BLLĐ Điều 127.2)</div>' + (s.late === 'fine' ? '<div class="notice bad" style="margin-top:6px">' + ic('info') + '<div><b>Sai quy định:</b> trừ tiền phạt đi muộn vi phạm BLLĐ Điều 127.2 – phần mềm vẫn tính theo lựa chọn của đơn vị nhưng cảnh báo đỏ trên bảng lương từng người.</div></div>' : '') + '</td><td>' + sel('late', [['false', 'Không trừ (mặc định)'], ['true', 'Không trả lương đúng số phút đi muộn'], ['fine', 'Trừ tiền phạt mỗi lần đi muộn – SAI QUY ĐỊNH']], s.late === 'fine' ? 'fine' : String(!!s.late)) + (s.late === 'fine' ? '<div style="margin-top:6px"><input class="input lg-num" data-lgo="lateFine" value="' + fmtInt(+s.lateFine || 0) + '" inputmode="numeric" aria-label="Tiền phạt mỗi lần"> đ/lần</div>' : '') + '</td></tr>' +
      '<tr><td><b>Khoản trả thêm thay đóng BH (Điều 168.3)</b><div class="lg-law">Người có HĐLĐ nhưng không thuộc diện đóng BH được trả thêm khoản tương đương mức doanh nghiệp đóng; khoản này chịu thuế TNCN (đã xác nhận 09/11)</div></td><td>' + sel('d168', [['true', 'Tự tính'], ['false', 'Không tính (đơn vị tự xử lý)']], String(!!s.d168)) + '</td></tr>' +
      '<tr><td><b>Hạn duyệt bảng cơ cấu nhân sự</b><div class="lg-law">Bảng cơ cấu tháng phải được duyệt trước ngày này – là căn cứ làm bảng lương. Phần mềm nhắc ở Việc cần xử lý và trên trang Cơ cấu nhân sự</div></td><td>Trước ngày ' + sel('ccHan', Array.from({ length: 28 }, function (x, i) { return [i + 1, String(i + 1)]; }), s.ccHan || 15) + ' hằng tháng · nhắc trước ' + sel('ccNhac', [[1, '1 ngày'], [3, '3 ngày'], [5, '5 ngày'], [7, '7 ngày']], s.ccNhac || 3) + '</td></tr>' +
      '<tr><td><b>Làm tròn số tiền chi trả</b></td><td>' + sel('round', [[0, 'Không làm tròn'], [100, 'Đến 100 đồng'], [1000, 'Đến 1.000 đồng']], s.round) + '</td></tr>' +
      '</tbody></table></div></div>';
    var law = lgLaw(), rowsL = LG_LAWK.map(function (k) {
      var list = (law[k[0]] || []).slice().sort(function (a, b) { return a.f < b.f ? -1 : 1; }), cur = lgAt(k[0], R);
      return '<tr><td><b>' + k[1] + '</b></td><td>' + list.map(function (x) { var on = x.f === cur.f; return '<div style="margin-bottom:6px"' + (on ? '' : ' class="faint"') + '>Từ ' + HR.vnDate(x.f) + ': <b>' + lgLawTxt(k[0], x.v, x.h) + '</b>' + (on ? ' <span class="tag tag-ok">đang áp dụng</span>' : '') + '<div class="lg-law">' + esc(x.s) + ' · ' + (x.ok ? '<span class="lg-ok">đã đối chiếu văn bản gốc</span>' : '<b>chưa đối chiếu đủ văn bản gốc</b>') + '</div></div>'; }).join('') + '</td><td><button class="btn btn-sm" data-act="lg-law" data-id="' + k[0] + '">Thêm mức mới</button></td></tr>';
    }).join('');
    return { opt: opt, law: '<div class="card card-pad"><h3>Tham số theo quy định (dùng chung mọi công ty)</h3><p class="lg-law" style="margin-top:0">Khi luật thay đổi: bấm <b>Thêm mức mới</b>, nhập ngày hiệu lực và số hiệu văn bản. Tháng lương nào dùng mức có hiệu lực tại ngày cuối tháng đó.</p><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-bt"><tbody>' + rowsL + '</tbody></table></div></div>' };
  }
  function lgTabCt(u, s) { return lgTabBt(u, s).opt + lgFx(u, s); }
  function lgTabLu(u, s) { return lgTabBt(u, s).law; }
  // công thức các cột tự tính trên bảng lương (hiện theo lựa chọn của đơn vị)
  function lgFx(u, s) {
    var T = lgAt('tl', refDate()).v, dn = T.dnOm + T.dnHt + (+s.tnld || 0), rows = [
      ['Lương cơ bản, trợ cấp, lương hiệu suất mục tiêu', 'Lấy từ bảng Cơ cấu nhân sự đã duyệt của tháng', 'BLLĐ Điều 93'],
      ['Công chuẩn, ngày công, giờ tăng ca', 'Lấy từ Tổng hợp công (bảng công đã chốt)', 'BLLĐ Điều 105–107'],
      ['Lương theo ngày công', 'Lương cơ bản × công hưởng lương ÷ công chuẩn (bán thời gian: giờ làm × đơn giá giờ)', 'BLLĐ Điều 112, 113, 115'],
      ['Lương tăng ca', '(Lương cơ bản + trợ cấp cố định' + (s.otHs ? ' + lương hiệu suất mục tiêu' : '') + ') ÷ giờ chuẩn × 150 / 200 / 300% × giờ', 'NĐ 145/2020 Điều 55'],
      ['Lương hiệu suất thực nhận', 'Mục tiêu × tỷ lệ ngày công × tỷ lệ đạt (nhập cuối tháng)', 'NĐ 158/2025 Điều 7'],
      ['Trợ cấp cố định', 'Trả đủ mức trong cơ cấu', 'Luật BHXH Điều 31'],
      ['Trợ cấp theo ngày công', 'Mức × tỷ lệ ngày công · hoặc đơn giá × ngày đi làm · hoặc đủ % công mới hưởng', 'NĐ 158/2025 Điều 7.1.b'],
      ['Tổng thu nhập', 'Lương theo ngày công + tăng ca + lương hiệu suất + trợ cấp + KPI + thưởng (+ khoản trả thêm Điều 168)', 'BLLĐ Điều 90'],
      ['Lương đóng BHXH', 'Lương cơ bản + trợ cấp cố định (trong khoảng mức tham chiếu – 20 lần)', 'Luật BHXH Điều 31'],
      ['BH người lao động', 'Lương đóng BHXH × ' + lgPct(T.nlXh) + ' + ' + lgPct(T.nlYt) + ' + ' + lgPct(T.nlTn), 'Luật BHXH Điều 33; Luật BHYT Điều 13; Luật Việc làm Điều 33'],
      ['BH công ty, KPCĐ', 'Lương đóng BHXH × ' + lgPct(dn) + ' + ' + lgPct(T.dnYt) + ' + ' + lgPct(T.dnTn) + ' + KPCĐ ' + lgPct(T.kpcd), 'Luật BHXH Điều 34; Luật Công đoàn Điều 29'],
      ['Khoản miễn thuế', 'Tiền tăng ca ' + (s.otTax === 'premium' ? '(phần trả cao hơn)' : '(toàn bộ)') + ' + các trợ cấp đặt "Không chịu thuế" trong mức trần', 'Luật TNCN 109/2025 Điều 4; NĐ 253/2026 Điều 8, 26'],
      ['Thu nhập chịu thuế', 'Tổng thu nhập − khoản miễn thuế', 'Luật TNCN Điều 3'],
      ['Thu nhập tính thuế', 'Thu nhập chịu thuế − BH người lao động − giảm trừ bản thân − giảm trừ người phụ thuộc', 'Luật TNCN Điều 8.2, 10'],
      ['Thuế TNCN', 'HĐ từ 3 tháng: biểu lũy tiến · CTV, thử việc, HĐ dưới 3 tháng: 10% khi chi từ 5 triệu', 'Luật TNCN Điều 9; NĐ 253/2026 Điều 50'],
      ['Thực lĩnh', 'Tổng thu nhập − BH người lao động − thuế TNCN − tạm ứng, khấu trừ khác' + (+s.round ? ', làm tròn đến ' + fmtInt(s.round) + ' đồng' : ''), 'BLLĐ Điều 94, 101, 102']];
    return '<div class="card card-pad" style="margin-top:14px"><h3>Công thức các cột tự tính trên bảng lương</h3><p class="lg-law" style="margin-top:0">Các ô tự tính đều sửa tay được trên Bảng lương; ô đã sửa tay được đánh dấu và cảnh báo.</p><div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr><th>Cột</th><th>Cách tính</th><th>Căn cứ</th></tr></thead><tbody>' + rows.map(function (x) { return '<tr><td><b>' + esc(x[0]) + '</b></td><td>' + esc(x[1]) + '</td><td class="lg-law">' + esc(x[2]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
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
    return '<div class="card card-pad"><h3>' + esc(r.name) + ' <span class="faint" style="font-weight:400">· ' + esc(r.id) + ' · ' + esc(lgLd(r.ld)) + ' · ' + esc(r.ctype) + '</span></h3>' + warn +
      '<div class="tbl-wrap" style="margin-top:10px;max-height:none"><table class="tbl"><thead><tr><th>Khoản</th><th>Cách tính</th><th class="n">Số tiền (đồng)</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + dn + '</div>';
  }
