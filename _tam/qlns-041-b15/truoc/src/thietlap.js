  /* =====================================================================
     THIẾT LẬP TÍNH LƯƠNG – tab "Tỷ lệ & công thức" và "Tham số theo luật" (12:35 10/11/2026 anh)
       - Lựa chọn: nút chọn nhanh, phương án mặc định đánh dấu sẵn, nút "Về mặc định"
       - Công thức: chỉnh THÀNH PHẦN (anh chọn) – công chuẩn, khoản cộng vào đơn giá tăng ca, lương hiệu suất có nhân tỷ lệ công;
         dòng theo luật khóa, sửa mức ở Tham số theo luật. Lệch luật → cảnh báo đỏ trên bảng lương.
       - Tham số theo luật: sửa từng mức (form theo từng loại), thêm mức mới theo ngày hiệu lực, xóa mức tự thêm, khôi phục mặc định
     ===================================================================== */
  var LG_OPTS = [
    { k: 'vung', t: 'Vùng lương tối thiểu', law: 'Theo nơi công ty hoạt động (NĐ 293/2025, NĐ 399/2026 Điều 3 khoản 3)', o: [[1, 'Vùng I'], [2, 'Vùng II'], [3, 'Vùng III'], [4, 'Vùng IV']], d: 1 },
    { k: 'tnld', t: 'Mức đóng BH tai nạn lao động – bệnh nghề nghiệp', law: '0,5% bình thường; 0,3% khi doanh nghiệp đủ điều kiện và được chấp thuận (NĐ 58/2020/NĐ-CP Điều 4, 5)', o: [[0.5, '0,5%'], [0.3, '0,3% (đã được chấp thuận)']], d: 0.5 },
    { k: 'otTax', t: 'Miễn thuế tiền lương làm thêm giờ', law: 'Luật 109/2025 Điều 4.8, NĐ 253/2026 Điều 26 ghi "tiền lương làm thêm giờ" – đã chốt miễn toàn bộ (09/11); luật cũ chỉ miễn phần trả cao hơn', o: [['full', 'Miễn toàn bộ'], ['premium', 'Chỉ miễn phần trả cao hơn']], d: 'full' },
    { k: 'otHs', t: 'Đơn giá tăng ca có gồm lương hiệu suất?', law: 'NĐ 145/2020 Điều 55.1.a: tiền lương thực trả của công việc, chỉ loại trừ thưởng Điều 104, ăn ca, xăng xe, điện thoại, đi lại, nhà ở, hỗ trợ không liên quan công việc. Chọn "Không" thì phần mềm cảnh báo số tiền tăng ca có thể thiếu so với luật', o: [[false, 'Không'], [true, 'Có – gồm lương hiệu suất mục tiêu']], d: false },
    { k: 'late', t: 'Thời gian đi muộn', law: 'Được phép: không trả lương cho đúng thời gian không làm việc. Không được phạt tiền, cắt lương (BLLĐ Điều 127.2)', o: [[false, 'Không trừ'], [true, 'Không trả lương đúng số phút đi muộn'], ['fine', 'Trừ tiền phạt – SAI QUY ĐỊNH']], d: false },
    { k: 'd168', t: 'Khoản trả thêm thay đóng BH (Điều 168.3)', law: 'Người có HĐLĐ nhưng không thuộc diện đóng BH được trả thêm khoản tương đương mức doanh nghiệp đóng; khoản này chịu thuế TNCN (đã xác nhận 09/11)', o: [[true, 'Tự tính'], [false, 'Không tính (đơn vị tự xử lý)']], d: true },
    { k: 'ccNhac', t: 'Nhắc duyệt bảng cơ cấu nhân sự trước hạn', law: 'Bảng cơ cấu tháng phải được duyệt trước hạn (chọn ngày ở dòng dưới) – là căn cứ làm bảng lương', o: [[1, '1 ngày'], [3, '3 ngày'], [5, '5 ngày'], [7, '7 ngày']], d: 3 },
    { k: 'round', t: 'Làm tròn số tiền chi trả', law: 'Làm tròn thực lĩnh từng người', o: [[0, 'Không làm tròn'], [100, 'Đến 100 đồng'], [1000, 'Đến 1.000 đồng']], d: 1000 }
  ];
  var LG_FX0 = { fxStd: 0, fxOtCd: true, fxHsR: true }; // công chuẩn theo bảng công · đơn giá tăng ca gồm trợ cấp cố định · lương hiệu suất × tỷ lệ công
  function lgOptV(s, o) { var v = s[o.k]; if (o.k === 'late') return v === 'fine' ? 'fine' : !!v; if (o.k === 'round') return +v > 1 ? +v : 0; return v == null ? o.d : v; }
  function lgTabBt(u, s) {
    var nonDef = 0;
    var rows = LG_OPTS.map(function (o) {
      var cur = lgOptV(s, o); if (String(cur) !== String(o.d)) nonDef++;
      var seg = '<div class="seg lg-seg" role="group" aria-label="' + esc(o.t) + '">' + o.o.map(function (x) { var on = String(x[0]) === String(cur); return '<button type="button" class="' + (on ? 'on' : '') + (x[0] === 'fine' ? ' bad' : '') + '" aria-pressed="' + on + '" data-act="lg-opt" data-id="' + o.k + '|' + x[0] + '">' + (on ? '✓ ' : '') + esc(x[1]) + (String(x[0]) === String(o.d) ? '<small>mặc định</small>' : '') + '</button>'; }).join('') + '</div>';
      var extra = o.k === 'late' && s.late === 'fine' ? '<div class="notice bad" style="margin-top:6px">' + ic('info') + '<div><b>Sai quy định:</b> trừ tiền phạt đi muộn vi phạm BLLĐ Điều 127.2 – phần mềm vẫn tính theo lựa chọn của đơn vị nhưng cảnh báo đỏ trên bảng lương từng người.</div></div>' + '<div class="lg-late"><div class="seg lg-seg" role="group" aria-label="Cách tính">' + [['lan', 'Theo số lần'], ['phut', 'Theo số phút']].map(function (x) { var on = (s.lateMode || 'lan') === x[0]; return '<button type="button" class="' + (on ? 'on' : '') + '" data-act="lg-opt" data-id="lateMode|' + x[0] + '">' + (on ? '✓ ' : '') + x[1] + '</button>'; }).join('') + '</div>' +
        '<label>Mức trừ <input class="input lg-num" data-lgo="lateFine" value="' + fmtInt(+s.lateFine || 0) + '" inputmode="numeric" aria-label="Mức trừ"> ' + ((s.lateMode || 'lan') === 'phut' ? 'đ/phút' : 'đ/lần') + '</label>' +
        '<label>Tối đa <input class="input lg-num" data-lgo="lateCapD" value="' + (+s.lateCapD ? fmtInt(+s.lateCapD) : '') + '" inputmode="numeric" placeholder="không giới hạn" aria-label="Tối đa mỗi ngày"> đ/ngày</label>' +
        '<label>Tối đa <input class="input lg-num" data-lgo="lateCapM" value="' + (+s.lateCapM ? fmtInt(+s.lateCapM) : '') + '" inputmode="numeric" placeholder="không giới hạn" aria-label="Tối đa mỗi tháng"> đ/tháng</label></div>' : '';
      if (o.k === 'ccNhac') extra = '<div style="margin-top:6px">Hạn duyệt: trước ngày <select class="input" data-lgo="ccHan" aria-label="Hạn duyệt" style="width:auto;max-width:130px;display:inline-block">' + Array.from({ length: 28 }, function (x, i) { return '<option value="' + (i + 1) + '"' + ((s.ccHan || 15) === i + 1 ? ' selected' : '') + '>' + (i + 1) + (i + 1 === 15 ? ' (mặc định)' : '') + '</option>'; }).join('') + '</select> hằng tháng</div>';
      return '<tr><td><b>' + esc(o.t) + '</b><div class="lg-law">' + esc(o.law) + '</div></td><td>' + seg + extra + '</td></tr>';
    }).join('');
    var opt = '<div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Lựa chọn của ' + esc(shortUnit(u.name)) + '</h3><p class="lg-law" style="margin:2px 0 8px">Bấm để chọn nhanh – dấu ✓ là phương án đang dùng, nhãn <b>mặc định</b> là phương án gợi ý.' + (nonDef ? ' Đang khác mặc định: <b>' + nonDef + '</b> mục.' : '') + '</p></div><button class="btn btn-sm" data-act="lg-opt-def"' + (nonDef ? '' : ' disabled') + '>Về mặc định</button></div><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-bt lg-opt"><tbody>' + rows + '</tbody></table></div></div>';
    return { opt: opt, law: lgTabLaw(u) };
  }
  function lgTabCt(u, s) { return lgTabBt(u, s).opt + lgFx(u, s); }
  function lgTabLu(u, s) { return lgTabLaw(u); }
  ACTS['lg-opt'] = function (a, key) { var u = lgUnit(), s = lgOf(u), i = key.indexOf('|'), k = key.slice(0, i), v = key.slice(i + 1); s[k] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v; lgSave(u, k + ' = ' + v); toast('Đã lưu'); var y = window.scrollY; render(); window.scrollTo(0, y); };
  ACTS['lg-opt-def'] = function () { var u = lgUnit(), s = lgOf(u); confirmBox('Đưa các lựa chọn về mặc định?', 'Áp dụng cho ' + shortUnit(u.name) + ': ' + LG_OPTS.filter(function (o) { return String(lgOptV(s, o)) !== String(o.d); }).map(function (o) { return o.t; }).join('; ') + '. Hạn duyệt cơ cấu về ngày 15.', 'Về mặc định', function () { LG_OPTS.forEach(function (o) { s[o.k] = o.d; }); s.ccHan = 15; lgSave(u, 'lựa chọn về mặc định'); toast('Đã đưa về mặc định'); render(); }); };

  /* Công thức các cột tự tính – dòng chỉnh được có nút Chỉnh */
  function lgFxV(s, k) { return s[k] == null ? LG_FX0[k] : s[k]; }
  function lgFx(u, s) {
    var T = lgAt('tl', refDate()).v, dn = T.dnOm + T.dnHt + (+s.tnld || 0), R = (ccOf(u) || {}).rule || {}, std = +lgFxV(s, 'fxStd'), otCd = lgFxV(s, 'fxOtCd') !== false, hsR = lgFxV(s, 'fxHsR') !== false;
    var otX = s.items.filter(function (it) { return it.cat === 'nc' && it.ot; }).map(function (it) { return it.t; });
    var rN = Math.max(150, +R.otRateN || 150), rR = Math.max(200, +R.otRateR || 200), rH = Math.max(300, +R.otRateH || 300);
    var dev = function (b) { return b ? ' <span class="tag tag-warn">đã chỉnh</span>' : ''; };
    var rows = [
      ['Lương cơ bản, trợ cấp, lương hiệu suất mục tiêu', 'Lấy từ bảng Cơ cấu nhân sự đã duyệt của tháng', 'BLLĐ Điều 93', ''],
      ['Công chuẩn, ngày công, giờ tăng ca', 'Ngày công, giờ tăng ca lấy từ Tổng hợp công (bảng công đã chốt) · công chuẩn: ' + (std ? '<b>cố định ' + std + ' ngày/tháng</b>' : 'số ngày làm việc theo lịch của tháng') + dev(std), 'BLLĐ Điều 105–107', 'std'],
      ['Lương theo ngày công', 'Lương cơ bản × công hưởng lương ÷ công chuẩn (tối đa đủ lương cơ bản) · bán thời gian: giờ làm × đơn giá giờ', 'BLLĐ Điều 112, 113, 115', 'std'],
      ['Lương tăng ca', '(Lương cơ bản' + (otCd ? ' + trợ cấp cố định' : '') + (s.otHs ? ' + lương hiệu suất mục tiêu' : '') + (otX.length ? ' + ' + otX.join(', ') : '') + ') ÷ (công chuẩn × giờ/ngày) × ' + rN + ' / ' + rR + ' / ' + rH + '% × giờ' + dev(!otCd || s.otHs || otX.length), 'NĐ 145/2020 Điều 55; hệ số lấy từ Thiết lập chấm công', 'ot'],
      ['Lương hiệu suất thực nhận', 'Mục tiêu' + (hsR ? ' × tỷ lệ ngày công' : '') + ' × tỷ lệ đạt (nhập cuối tháng)' + dev(!hsR), 'NĐ 158/2025 Điều 7', 'hs'],
      ['Trợ cấp cố định', 'Trả đủ mức trong cơ cấu', 'Luật BHXH Điều 31', ''],
      ['Trợ cấp theo ngày công', 'Mức × tỷ lệ ngày công · hoặc đơn giá × ngày đi làm · hoặc đủ % công mới hưởng – chọn cho từng khoản ở tab Khoản lương', 'NĐ 158/2025 Điều 7.1.b', 'kh'],
      ['Tổng thu nhập', 'Lương theo ngày công + tăng ca + lương hiệu suất + trợ cấp + KPI + thưởng (+ khoản trả thêm Điều 168)', 'BLLĐ Điều 90', ''],
      ['Lương đóng BHXH', 'Lương cơ bản + trợ cấp cố định (trong khoảng mức tham chiếu – 20 lần)', 'Luật BHXH Điều 31; NĐ 158/2025 Điều 7', 'law'],
      ['BH người lao động', 'Lương đóng BHXH × ' + lgPct(T.nlXh) + ' + ' + lgPct(T.nlYt) + ' + ' + lgPct(T.nlTn), 'Luật BHXH Điều 33; Luật BHYT Điều 13; Luật Việc làm Điều 33', 'law'],
      ['BH công ty, KPCĐ', 'Lương đóng BHXH × ' + lgPct(dn) + ' + ' + lgPct(T.dnYt) + ' + ' + lgPct(T.dnTn) + ' + KPCĐ ' + lgPct(T.kpcd), 'Luật BHXH Điều 34; Luật Công đoàn Điều 29', 'law'],
      ['Khoản miễn thuế', 'Tiền tăng ca ' + (s.otTax === 'premium' ? '(phần trả cao hơn)' : '(toàn bộ)') + ' + các trợ cấp đặt "Không chịu thuế" trong mức trần', 'Luật TNCN 109/2025 Điều 4; NĐ 253/2026 Điều 8, 26', 'law'],
      ['Thu nhập chịu thuế', 'Tổng thu nhập − khoản miễn thuế', 'Luật TNCN Điều 3', 'law'],
      ['Thu nhập tính thuế', 'Thu nhập chịu thuế − BH người lao động − giảm trừ bản thân − giảm trừ người phụ thuộc', 'Luật TNCN Điều 8.2, 10', 'law'],
      ['Thuế TNCN', 'HĐ từ 3 tháng: biểu lũy tiến · CTV, thử việc, HĐ dưới 3 tháng: 10% khi chi từ 5 triệu', 'Luật TNCN Điều 9; NĐ 253/2026 Điều 50', 'law'],
      ['Thực lĩnh', 'Tổng thu nhập − BH người lao động − thuế TNCN − tạm ứng, khấu trừ khác' + (+s.round > 1 ? ', làm tròn đến ' + fmtInt(s.round) + ' đồng' : ''), 'BLLĐ Điều 94, 101, 102', 'round']];
    var btn = function (k) { if (!k) return '<span class="faint">—</span>'; if (k === 'law') return '<button class="btn btn-sm" data-act="lg-tab" data-id="lu" title="Sửa tỷ lệ, mức ở Tham số theo luật">Theo luật ›</button>'; if (k === 'kh') return '<button class="btn btn-sm" data-act="lg-tab" data-id="kh">Khoản lương ›</button>'; if (k === 'round') return '<span class="faint">ở Lựa chọn</span>'; return '<button class="btn btn-sm btn-primary" data-act="lg-fx" data-id="' + k + '">Chỉnh</button>'; };
    var any = std || !otCd || !hsR;
    return '<div class="card card-pad" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap"><div><h3 style="margin:0">Công thức các cột tự tính trên bảng lương</h3><p class="lg-law" style="margin:2px 0 8px">Bấm <b>Chỉnh</b> để chọn thành phần của công thức. Dòng "Theo luật" tính đúng quy định – khi luật đổi tỷ lệ, mức thì sửa ở Tham số theo luật. Từng ô vẫn sửa tay được trên Bảng lương.</p></div><button class="btn btn-sm" data-act="lg-fx-def"' + (any ? '' : ' disabled') + '>Công thức mặc định</button></div><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-vb"><thead><tr><th>Cột</th><th>Cách tính</th><th>Căn cứ</th><th></th></tr></thead><tbody>' +
      rows.map(function (x) { return '<tr><td><b>' + esc(x[0]) + '</b></td><td>' + x[1] + '</td><td class="lg-law">' + esc(x[2]) + '</td><td>' + btn(x[3]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  ACTS['lg-fx-def'] = function () { var u = lgUnit(), s = lgOf(u); Object.keys(LG_FX0).forEach(function (k) { delete s[k]; }); lgSave(u, 'công thức về mặc định'); toast('Đã về công thức mặc định'); render(); };
  ACTS['lg-fx'] = function (a, k) {
    var u = lgUnit(), s = lgOf(u), R = (ccOf(u) || {}).rule || {}, rad = function (n, v, lab, cur, note) { return '<label class="lg-fxo"><input type="radio" name="' + n + '" value="' + v + '"' + (String(cur) === String(v) ? ' checked' : '') + '> <span><b>' + lab + '</b>' + (note ? '<span class="lg-law" style="display:block">' + note + '</span>' : '') + '</span></label>'; };
    var chk = function (id, lab, on, note, dis) { return '<label class="lg-fxo"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> <span><b>' + lab + '</b>' + (note ? '<span class="lg-law" style="display:block">' + note + '</span>' : '') + '</span></label>'; };
    var title, body;
    if (k === 'std') { var cur = +lgFxV(s, 'fxStd') || 0; title = 'Công chuẩn tháng'; body = rad('fxStd', 0, 'Theo lịch làm việc của tháng (mặc định)', cur, 'Số ngày làm việc trong tháng theo ca, lịch nghỉ hằng tuần ở Thiết lập chấm công – đi làm đủ lịch là đủ lương cơ bản') + rad('fxStd', 26, 'Cố định 26 ngày', cur, 'Phổ biến khi làm 6 ngày/tuần') + rad('fxStd', 24, 'Cố định 24 ngày', cur) + rad('fxStd', 22, 'Cố định 22 ngày', cur, 'Phổ biến khi làm 5 ngày/tuần') +
      '<div class="notice warn" style="margin-top:8px">' + ic('info') + '<div><b>Lưu ý khi chọn công chuẩn cố định:</b> tháng có nhiều ngày làm việc hơn công chuẩn, người đi làm đủ vẫn chỉ được tối đa đủ lương cơ bản; tháng có ít ngày hơn, người đi làm đủ lịch có thể bị trả thiếu – phần mềm cảnh báo trên bảng lương khi công hưởng lương ít hơn công chuẩn dù không nghỉ ngày nào.</div></div>'; }
    else if (k === 'ot') { title = 'Thành phần đơn giá tăng ca'; var nc = s.items.filter(function (it) { return it.cat === 'nc'; });
      body = '<p class="lg-law" style="margin-top:0">Đơn giá giờ = tổng các khoản được tick ÷ (công chuẩn × số giờ làm/ngày). NĐ 145/2020 Điều 55.1.a: tính theo tiền lương thực trả của công việc đang làm, <b>không gồm</b> thưởng (BLLĐ Điều 104), tiền ăn giữa ca, hỗ trợ xăng xe, điện thoại, đi lại, nhà ở, nuôi con nhỏ và khoản không liên quan công việc.</p>' +
        chk('fxCb', 'Lương cơ bản', true, 'Luôn tính', true) + chk('fxOtCd', 'Trợ cấp cố định (chức vụ, trách nhiệm…)', lgFxV(s, 'fxOtCd') !== false, 'Mặc định tính – là phụ cấp lương ghi trong HĐ. Bỏ tick: phần mềm cảnh báo đỏ trả thiếu so với luật') +
        chk('fxOtHs', 'Lương hiệu suất mục tiêu', !!s.otHs, 'Là tiền lương theo kết quả công việc → về nguyên tắc phải tính. Bỏ tick: phần mềm cảnh báo số tiền có thể thiếu') +
        nc.map(function (it) { var ex = ['anca', 'dt', 'xx', 'nha', 'tp'].indexOf(it.id) >= 0; return chk('fxNc_' + it.id, it.t + ' (trợ cấp theo ngày công)', !!it.ot, ex ? 'NĐ 145/2020 Điều 55.1.a loại trừ khoản này – không nên tick' : 'Chỉ tick khi khoản gắn với công việc, chức danh (không phải hỗ trợ đời sống)'); }).join('') +
        '<p class="lg-law" style="margin:10px 0 0">Hệ số đang dùng: ngày thường <b>' + Math.max(150, +R.otRateN || 150) + '%</b>, nghỉ hằng tuần <b>' + Math.max(200, +R.otRateR || 200) + '%</b>, lễ tết <b>' + Math.max(300, +R.otRateH || 300) + '%</b> – sửa ở Chấm công → Thiết lập chấm công (không thấp hơn 150/200/300% – BLLĐ Điều 98).</p>'; }
    else if (k === 'hs') { title = 'Lương hiệu suất thực nhận'; body = rad('fxHsR', 'true', 'Mục tiêu × tỷ lệ ngày công × tỷ lệ đạt (mặc định)', String(lgFxV(s, 'fxHsR') !== false), 'Nghỉ không lương thì lương hiệu suất giảm theo') + rad('fxHsR', 'false', 'Mục tiêu × tỷ lệ đạt', String(lgFxV(s, 'fxHsR') !== false), 'Không nhân tỷ lệ ngày công – kết quả đánh giá đã phản ánh ngày công. Phù hợp khi quy chế đánh giá có tiêu chí chuyên cần'); }
    else return;
    var m = modal(title, shortUnit(u.name), body + '<div class="link-row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="fxOk">Lưu</button></div>', true);
    $('#fxOk', m).onclick = function () {
      if (k === 'std') { var v = +(m.querySelector('[name="fxStd"]:checked') || {}).value || 0; if (v) s.fxStd = v; else delete s.fxStd; }
      if (k === 'ot') { var cd = $('#fxOtCd', m).checked; if (cd) delete s.fxOtCd; else s.fxOtCd = false; s.otHs = $('#fxOtHs', m).checked; s.items.forEach(function (it) { var x = $('#fxNc_' + it.id, m); if (x) it.ot = x.checked; }); }
      if (k === 'hs') { var hv = (m.querySelector('[name="fxHsR"]:checked') || {}).value; if (hv === 'false') s.fxHsR = false; else delete s.fxHsR; }
      lgSave(u, 'chỉnh công thức: ' + title); m.close(); toast('Đã lưu công thức – bảng lương tháng chưa chốt tính lại theo công thức mới'); render();
    };
  };

  /* Tham số theo luật – sửa từng mức bằng form */
  var LG_TLK = [['nlXh', 'NLĐ – BHXH'], ['nlYt', 'NLĐ – BHYT'], ['nlTn', 'NLĐ – BHTN'], ['dnOm', 'DN – ốm đau, thai sản'], ['dnHt', 'DN – hưu trí, tử tuất'], ['dnYt', 'DN – BHYT'], ['dnTn', 'DN – BHTN'], ['kpcd', 'DN – kinh phí công đoàn']];
  function lgLawForm(k, v, h) {
    var n = function (id, lab, val, unit) { return '<div class="field"><label for="' + id + '">' + lab + '</label><div style="display:flex;align-items:center;gap:6px"><input class="input" id="' + id + '" inputmode="decimal" value="' + esc(val == null ? '' : (unit === '%' ? lgNum(val) : fmtInt(val))) + '">' + (unit ? '<span class="faint">' + unit + '</span>' : '') + '</div></div>'; };
    if (k === 'ref' || k === 'anca') return n('lw0', k === 'ref' ? 'Mức tham chiếu / lương cơ sở' : 'Mức không tính thuế', v, 'đồng/tháng');
    if (k === 'lttv') return '<div class="form-grid">' + [0, 1, 2, 3].map(function (i) { return n('lwM' + i, 'Vùng ' + ['I', 'II', 'III', 'IV'][i] + ' – tháng', v[i], 'đ') + n('lwG' + i, 'Vùng ' + ['I', 'II', 'III', 'IV'][i] + ' – giờ', (h || [])[i], 'đ'); }).join('') + '</div>';
    if (k === 'gt') return '<div class="form-grid">' + n('lw0', 'Giảm trừ bản thân', v[0], 'đ/tháng') + n('lw1', 'Mỗi người phụ thuộc', v[1], 'đ/tháng') + '</div>';
    if (k === 'k10') return '<div class="form-grid">' + n('lw0', 'Tỷ lệ khấu trừ', v[0], '%') + n('lw1', 'Khi chi từ', v[1], 'đ/lần') + '</div>';
    if (k === 'tl') return '<div class="form-grid">' + LG_TLK.map(function (x) { return n('lwT_' + x[0], x[1], v[x[0]], '%'); }).join('') + '</div>';
    if (k === 'bac') return '<p class="lg-law" style="margin-top:0">Ngưỡng là thu nhập tính thuế/tháng đến hết bậc; bậc cuối để trống ngưỡng.</p>' + v.map(function (b, i) { return '<div style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1">' + n('lwB' + i, 'Bậc ' + (i + 1) + ' – đến', b[0] || '', 'đ') + '</div><div style="width:120px">' + n('lwR' + i, 'Thuế suất', b[1], '%') + '</div></div>'; }).join('');
    return '';
  }
  function lgLawRead(k, m, cur) {
    var g = function (id, pct) { var el = $('#' + id, m); if (!el) return null; var r = gxNum(el.value, pct); if (r.err || r.v === '') throw new Error('Ô "' + (el.closest('.field').querySelector('label').textContent) + '" chưa đúng'); return r.v; };
    var gOpt = function (id) { var el = $('#' + id, m); if (!el || el.value.trim() === '') return 0; var r = gxNum(el.value, false); if (r.err) throw new Error('Ngưỡng chưa đúng'); return r.v; };
    if (k === 'ref' || k === 'anca') return { v: g('lw0') };
    if (k === 'lttv') return { v: [0, 1, 2, 3].map(function (i) { return g('lwM' + i); }), h: [0, 1, 2, 3].map(function (i) { return g('lwG' + i); }) };
    if (k === 'gt') return { v: [g('lw0'), g('lw1')] };
    if (k === 'k10') return { v: [g('lw0', true), g('lw1')] };
    if (k === 'tl') { var o = {}; LG_TLK.forEach(function (x) { o[x[0]] = g('lwT_' + x[0], true); }); Object.keys(cur.v).forEach(function (x) { if (o[x] == null) o[x] = cur.v[x]; }); return { v: o }; }
    if (k === 'bac') return { v: cur.v.map(function (b, i) { return [i === cur.v.length - 1 ? 0 : gOpt('lwB' + i), g('lwR' + i, true)]; }) };
  }
  function lgTabLaw(u) {
    var law = lgLaw(), R = refDate();
    var rowsL = LG_LAWK.map(function (k) {
      var list = (law[k[0]] || []).slice().sort(function (a, b) { return a.f < b.f ? -1 : 1; }), cur = lgAt(k[0], R), d0 = JSON.stringify(LG_LAW0[k[0]]), chg = JSON.stringify(law[k[0]]) !== d0;
      return '<tr><td><b>' + k[1] + '</b>' + (chg ? '<div><span class="tag tag-warn">đã chỉnh so với mặc định</span></div>' : '') + '</td><td>' + list.map(function (x) {
        var on = x.f === cur.f, base = (LG_LAW0[k[0]] || []).filter(function (y) { return y.f === x.f; })[0], ed = base && JSON.stringify(base.v) !== JSON.stringify(x.v);
        return '<div style="margin-bottom:8px"' + (on ? '' : ' class="faint"') + '>Từ ' + HR.vnDate(x.f) + ': <b>' + lgLawTxt(k[0], x.v, x.h) + '</b>' + (on ? ' <span class="tag tag-ok">đang áp dụng</span>' : '') + (ed ? ' <span class="tag tag-warn">đã sửa</span>' : !base ? ' <span class="tag tag-info">tự thêm</span>' : '') +
          ' <button class="btn btn-sm" data-act="lg-law-ed" data-id="' + k[0] + '|' + x.f + '">Sửa</button>' + (!base ? ' <button class="btn btn-sm" data-act="lg-law-del" data-id="' + k[0] + '|' + x.f + '">Xóa</button>' : '') +
          '<div class="lg-law">' + esc(x.s) + ' · ' + (x.ok ? '<span class="lg-ok">đã đối chiếu văn bản gốc</span>' : '<b>chưa đối chiếu đủ văn bản gốc</b>') + '</div></div>'; }).join('') +
        '</td><td style="white-space:nowrap"><button class="btn btn-sm" data-act="lg-law" data-id="' + k[0] + '">Thêm mức mới</button>' + (chg ? '<br><button class="btn btn-sm" style="margin-top:6px" data-act="lg-law-rs" data-id="' + k[0] + '">Khôi phục mặc định</button>' : '') + '</td></tr>';
    }).join('');
    return '<div class="card card-pad"><h3>Tham số theo quy định (dùng chung mọi công ty)</h3><p class="lg-law" style="margin-top:0">Mặc định theo văn bản hiện hành (cột nguồn). Khi luật thay đổi: bấm <b>Thêm mức mới</b>, nhập ngày hiệu lực và số hiệu văn bản – tháng lương nào dùng mức có hiệu lực tại ngày cuối tháng đó. <b>Sửa</b> để chỉnh một mức đã có; <b>Khôi phục mặc định</b> để trả về số liệu gốc của phần mềm.</p><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-bt lg-opt"><tbody>' + rowsL + '</tbody></table></div></div>';
  }
  function lgLawDlg(k, f) {
    var L = lgLaw(), name = (LG_LAWK.filter(function (x) { return x[0] === k; })[0] || [])[1], ex = f ? (L[k] || []).filter(function (x) { return x.f === f; })[0] : null, cur = ex || lgAt(k, refDate());
    var body = '<form id="lwF" novalidate>' + (ex ? '<p class="lg-law" style="margin-top:0">Mức có hiệu lực từ <b>' + HR.vnDate(ex.f) + '</b></p>' : '<div class="field"><label for="lwD">Ngày có hiệu lực *</label>' + dateInput('lwD', '') + '</div><p class="lg-law" style="margin-top:0">Số liệu điền sẵn theo mức hiện tại – sửa các ô thay đổi.</p>') + lgLawForm(k, cur.v, cur.h) +
      field('lwS', 'Số hiệu văn bản, Điều, khoản *', ex ? ex.s : '', ' maxlength="300"') + '<label class="lg-chk"><input type="checkbox" id="lwOk"' + (ex && ex.ok ? ' checked' : '') + '> Đã đối chiếu văn bản gốc</label>' +
      '<p id="lwMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn" data-close>Hủy</button><button type="submit" class="btn btn-primary">' + (ex ? 'Lưu' : 'Thêm') + '</button></div></form>';
    var m = modal(ex ? 'Sửa mức' : 'Thêm mức mới', name, body, true);
    m.querySelectorAll('input[inputmode="decimal"]').forEach(function (el) { el.addEventListener('focus', function () { el.select(); }); });
    $('#lwF', m).onsubmit = function (ev) {
      ev.preventDefault(); var msg = $('#lwMsg', m), iso = ex ? ex.f : null, val;
      if (!ex) { var d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec($('#lwD', m).value.trim()); if (!d) { msg.textContent = 'Nhập ngày dạng dd/mm/yyyy'; return; } iso = d[3] + '-' + d[2] + '-' + d[1]; }
      try { val = lgLawRead(k, m, cur); } catch (e) { msg.textContent = e.message; return; }
      var src = $('#lwS', m).value.trim(); if (!src) { msg.textContent = 'Nhập số hiệu văn bản'; return; }
      var o = { f: iso, v: val.v, s: src, ok: $('#lwOk', m).checked ? 1 : 0 }; if (val.h) o.h = val.h;
      L[k] = (L[k] || []).filter(function (x) { return x.f !== iso; }).concat([o]); saveSettings(); log('Tham số lương: ' + name + ' từ ' + HR.vnDate(iso) + (ex ? ' (sửa)' : '') + ' – ' + src); m.close(); toast(ex ? 'Đã lưu mức đã sửa' : 'Đã thêm mức mới'); render();
    };
  }
  ACTS['lg-law'] = function (a, k) { lgLawDlg(k, null); };
  ACTS['lg-law-ed'] = function (a, key) { var i = key.indexOf('|'); lgLawDlg(key.slice(0, i), key.slice(i + 1)); };
  ACTS['lg-law-del'] = function (a, key) { var i = key.indexOf('|'), k = key.slice(0, i), f = key.slice(i + 1); confirmBox('Xóa mức từ ' + HR.vnDate(f) + '?', 'Chỉ xóa được mức tự thêm.', 'Xóa', function () { var L = lgLaw(); L[k] = L[k].filter(function (x) { return x.f !== f; }); saveSettings(); log('Tham số lương: xóa mức ' + k + ' từ ' + f); render(); }); };
  ACTS['lg-law-rs'] = function (a, k) { var name = (LG_LAWK.filter(function (x) { return x[0] === k; })[0] || [])[1]; confirmBox('Khôi phục mặc định "' + name + '"?', 'Các mức đã sửa hoặc tự thêm của tham số này bị thay bằng số liệu gốc của phần mềm. Áp dụng cho mọi công ty.', 'Khôi phục', function () { var L = lgLaw(); L[k] = JSON.parse(JSON.stringify(LG_LAW0[k])); saveSettings(); log('Tham số lương: khôi phục mặc định ' + name); render(); }); };
