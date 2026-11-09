  /* =====================================================================
     B2 – BẢNG LƯƠNG THÁNG (0.4.1, 09/11/2026)
       - Tự tính từ bảng công (Tổng hợp công) + lương HĐ / quyết định lương + Thiết lập công thức lương (lgCalc)
       - Cột tổng hợp tô màu (anh 15:53): Lương cơ bản, Lương gross, Lương thời gian, Trợ cấp – phụ cấp (không đóng BH),
         Thưởng hiệu quả – KPI, Tổng thu nhập, Tổng BH NLĐ đóng, Thu nhập chịu thuế, Thu nhập tính thuế, Thực lĩnh
       - u.lgm[ym] = { inp: {Mã NV: {khoản: số tiền}}, lock: {at, by, ts, rows: [ảnh chụp lúc chốt]}, log: [] }
       - Chốt bảng lương chỉ khi tháng đã chốt công; sau chốt dùng ảnh chụp (phiếu lương B3 lấy từ đây)
       - Tab cũ "Bảng lương đã nạp (file Excel)" giữ nguyên trang Bảng lương 0.1–0.3 (PAGES.bl cũ)
     ===================================================================== */
  var BL_OLD = PAGES.bl, BL_OLD_B = BINDS.bl;
  var BL_TABS = [['bang', 'Bảng lương'], ['nhap', 'Nhập khoản tháng'], ['dc', 'Đối chiếu bảng lương đang dùng'], ['file', 'Bảng lương đã nạp (file)']];
  var BL_HL = [['gross', 'Lương gross', 'hl-gross'], ['coBan', 'Lương cơ bản', 'hl-cb'], ['tg', 'Lương thời gian', 'hl-tg'], ['pcT', 'Trợ cấp, phụ cấp', 'hl-pc'], ['thT', 'Thưởng hiệu quả, KPI', 'hl-th'], ['tongTN', 'Tổng thu nhập', 'hl-tn'], ['bhNL', 'BH người lao động đóng', 'hl-bh'], ['tnct', 'Thu nhập chịu thuế', 'hl-tax'], ['tntt', 'Thu nhập tính thuế', 'hl-tax'], ['pay', 'Thực lĩnh', 'hl-net']];
  function lgM(u, ym) { u.lgm = u.lgm || {}; var m = u.lgm[ym] || (u.lgm[ym] = { inp: {}, lock: null, log: [] }); m.inp = m.inp || {}; m.log = m.log || []; return m; }
  function blSave(u, ym, msg) { u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) { lgM(u, ym).log.unshift({ at: nowVn(), by: ccUser(), t: msg }); log('Bảng lương ' + HR.ymLabel(ym) + ' (' + u.name + '): ' + msg); } }
  function blUnit() { var f = ps('blg', { tab: 'bang', u: '', ym: '', full: false, q: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function blMonths(u) { var o = {}; bcMonths().forEach(function (m) { o[m] = 1; }); Object.keys(u.lgm || {}).forEach(function (m) { if (u.lgm[m].lock) o[m] = 1; }); return Object.keys(o).sort(); }
  // tính cả tháng (chưa chốt) – mỗi người 1 kết quả lgCalc
  function blCalc(u, ym) { var B = bcMonth(u, ym); return B.ppl.filter(function (p) { return !p.orphan; }).map(function (p) { return lgCalc(u, ym, p.id); }).filter(Boolean); }
  // ảnh chụp gọn để lưu khi chốt (không giữ đối tượng công ty)
  function blSnap(r) { return { id: r.id, name: r.name, dept: r.dept, ld: r.ld, ctype: r.ctype, c: r.c, gross: r.gross, bhNL: r.bhNL, tax: r.tax, kt: r.kt, net: r.net, pay: r.pay, dn: r.dn, dnTotal: r.dnTotal, bhWhy: r.bhWhy, warn: r.warn.filter(function (w) { return w.lv !== 'info' || /Không đóng/.test(w.t); }), lines: r.lines.map(function (l) { return { grp: l.grp, k: l.k, t: l.t, v: l.v, f: l.f, law: l.law, info: l.info, slip: l.slip }; }) }; }
  function blRows(u, ym) { var L = lgM(u, ym).lock; return L ? L.rows : blCalc(u, ym); }
  // danh sách cột: k = khóa trong r.c (hoặc hàm v), hl = cột tổng hợp tô màu, main = hiện ở chế độ Cột chính
  function blCols(u) {
    var s = lgOf(u), tn = s.items.filter(function (x) { return x.g === 'tn'; }), kt = s.items.filter(function (x) { return x.g === 'kt'; });
    var it = function (x, full) { return { t: x.t + (full ? ' (mức tháng)' : ''), v: function (r) { return (r.c[full ? 'full' : 'it'] || {})[x.id] || 0; }, sub: 1 }; };
    var c = function (k, t, o) { return Object.assign({ k: k, t: t, v: function (r) { return r.c[k]; } }, o || {}); };
    var cols = [{ t: 'Mã NV', v: function (r) { return r.id; }, txt: 1, main: 1 }, { t: 'Họ và tên', v: function (r) { return r.name; }, txt: 1, main: 1, name: 1 }, { t: 'Phòng ban', v: function (r) { return r.dept; }, txt: 1 }, { t: 'Loại lao động', v: function (r) { return r.ld; }, txt: 1, main: 1 }, { t: 'Loại hợp đồng', v: function (r) { return r.ctype; }, txt: 1 },
      c('vitri', 'Lương vị trí (HĐ / QĐ lương)', { main: 1 })];
    tn.filter(function (x) { return x.cat === 'cb'; }).forEach(function (x) { cols.push(it(x, true)); });
    cols.push(c('coBan', 'Lương cơ bản', { hl: 'hl-cb', main: 1, tip: 'Lương vị trí + phụ cấp chức vụ, phụ cấp cố định đóng BH' }));
    tn.filter(function (x) { return x.cat === 'pc' && x.kind !== 'qty' && x.kind !== 'input'; }).forEach(function (x) { cols.push(it(x, true)); });
    cols.push(c('gross', 'Lương gross', { hl: 'hl-gross', main: 1, tip: 'Lương cơ bản + trợ cấp, phụ cấp cố định hằng tháng (mức đủ tháng)' }));
    cols.push(c('std', 'Công chuẩn', { main: 1, num2: 1 }), { k: 'cong', t: 'Công hưởng lương / giờ làm', v: function (r) { return r.c.cong; }, fmt: function (r) { return lgNum(r.c.cong) + (r.c.hr ? ' giờ' : ''); }, main: 1, num2: 1 });
    cols.push(c('tg', 'Lương thời gian', { hl: 'hl-tg', main: 1, tip: 'Lương cơ bản × công hưởng lương ÷ công chuẩn (bán thời gian: giờ làm × đơn giá giờ)' }));
    cols.push(c('otH', 'Giờ làm thêm', { num2: 1 }), c('ot', 'Lương làm thêm giờ', { main: 1 }));
    tn.filter(function (x) { return x.cat === 'pc'; }).forEach(function (x) { cols.push(it(x)); });
    cols.push(c('pcT', 'Trợ cấp, phụ cấp (không đóng BH)', { hl: 'hl-pc', main: 1 }));
    tn.filter(function (x) { return x.cat === 'thuong'; }).forEach(function (x) { cols.push(it(x)); });
    cols.push(c('thT', 'Thưởng hiệu quả, KPI', { hl: 'hl-th', main: 1 }), c('d168', 'Trả thêm thay đóng BH (Điều 168)'));
    cols.push(c('tongTN', 'Tổng thu nhập', { hl: 'hl-tn', main: 1 }));
    cols.push(c('bhBase', 'Lương đóng BH', { main: 1 }), c('bhxh', 'BHXH 8%'), c('bhyt', 'BHYT 1,5%'), c('bhtn', 'BHTN 1%'));
    cols.push(c('bhNL', 'Tổng BH người lao động đóng', { hl: 'hl-bh', main: 1 }));
    cols.push(c('exempt', 'Khoản miễn, không tính thuế'), c('tnct', 'Thu nhập chịu thuế', { hl: 'hl-tax', main: 1 }));
    cols.push(c('npt', 'Người phụ thuộc', { num2: 1 }), c('gtT', 'Giảm trừ gia cảnh'), c('tntt', 'Thu nhập tính thuế', { hl: 'hl-tax', main: 1 }));
    cols.push(c('tax', 'Thuế TNCN', { main: 1 }));
    kt.forEach(function (x) { cols.push(it(x)); });
    cols.push(c('ktT', 'Khấu trừ sau thuế', { main: 1 }), c('pay', 'Thực lĩnh', { hl: 'hl-net', main: 1 }));
    ['BHXH ốm đau – thai sản', 'BHXH hưu trí – tử tuất', 'BH tai nạn lao động – BNN', 'BHYT', 'BHTN', 'Kinh phí công đoàn'].forEach(function (t, i) { cols.push({ t: 'DN đóng: ' + t, v: function (r) { return (r.c.dn || [])[i] || 0; } }); });
    cols.push(c('dnT', 'DN đóng BH, KPCĐ', { main: 1 }), c('cost', 'Tổng chi phí lương của DN'));
    cols.push({ t: 'Cảnh báo', v: function (r) { return (r.warn || []).filter(function (w) { return w.lv !== 'info'; }).map(function (w) { return w.t; }).join(' · '); }, txt: 1, main: 1, warn: 1 });
    return cols;
  }
  function blStyle() {
    if (document.getElementById('blCss')) return;
    var st = document.createElement('style'); st.id = 'blCss';
    st.textContent = '.blt td,.blt th{white-space:nowrap}.blt th{white-space:normal;min-width:92px;vertical-align:bottom}.blt td.n{text-align:right;font-variant-numeric:tabular-nums}' +
      '.blt .hl-gross{background:rgba(59,130,246,.12)}.blt .hl-cb{background:rgba(20,184,166,.14)}.blt .hl-tg{background:rgba(34,197,94,.14)}.blt .hl-pc{background:rgba(245,158,11,.16)}.blt .hl-th{background:rgba(168,85,247,.14)}.blt .hl-tn{background:rgba(37,99,235,.2)}.blt .hl-bh{background:rgba(239,68,68,.13)}.blt .hl-tax{background:rgba(249,115,22,.15)}.blt .hl-net{background:rgba(22,163,74,.24)}' +
      '.blt td[class*=hl-],.blt th[class*=hl-]{font-weight:700}.blt tr.tot td{font-weight:700;border-top:2px solid var(--line-2)}.blt td.w{white-space:normal;min-width:240px;font-size:12px;color:#b9770e}.blt .sub{color:var(--muted)}' +
      '.bl-leg{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.bl-leg span{padding:3px 8px;border-radius:6px;font-size:12px;font-weight:600}.bl-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0}.bl-st{padding:10px 14px;border-radius:10px;border:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 12px}' +
      '.bl-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}.bl-kpi div{border:1px solid var(--line);border-radius:10px;padding:10px 12px}.bl-kpi span{display:block;font-size:12px;color:var(--muted)}.bl-kpi b{font-size:18px}.bl-in{width:110px;text-align:right}.bl-dc .bad{color:#c0392b;font-weight:700}';
    document.head.appendChild(st);
  }
  function blCell(col, r) { var v = col.v(r); if (col.txt) return esc(v == null ? '' : v); if (col.fmt) return esc(col.fmt(r)); if (v == null || v === '') return ''; return col.num2 ? lgNum(v) : lgMoney(v); }
  PAGES.bl = function () {
    lgStyle(); blStyle();
    var f = ps('blg', { tab: 'bang', u: '', ym: '', full: false, q: '' }), u = blUnit(); if (!u) return pageHead('Bảng lương') + noData('dữ liệu');
    var us = selUnits().length ? selUnits() : S.units, ms = blMonths(u), X = bcX(u);
    if (ms.indexOf(f.ym) < 0) f.ym = ms.filter(function (m) { return X.lock[m]; }).pop() || ms[ms.length - 1];
    var ym = f.ym, M = lgM(u, ym), L = M.lock, cLock = X.lock[ym];
    var right = '<button class="btn btn-sm" data-act="bl-xls">' + ic('xuat', 15) + 'Xuất Excel</button>' + (L ? '<button class="btn btn-sm" data-act="bl-open">Mở lại bảng lương</button>' : '<button class="btn btn-sm btn-primary" data-act="bl-lock"' + (cLock ? '' : ' disabled title="Chốt công tháng này trước (Tổng hợp công)"') + '>Chốt bảng lương</button>');
    var head = pageHead('Bảng lương', 'Bảng thanh toán tiền lương tháng ' + HR.ymLabel(ym) + ' của <b>' + esc(shortUnit(u.name)) + '</b> · đơn vị: đồng · tự tính từ bảng công, lương HĐ / quyết định lương và Thiết lập công thức lương', right);
    var pick = '<div class="bl-bar">' + (us.length > 1 ? '<div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="bl-u" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div>' : '') +
      '<select class="input" id="blYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>Tháng ' + HR.ymLabel(m) + (u.lgm && u.lgm[m] && u.lgm[m].lock ? ' · đã chốt lương' : X.lock[m] ? ' · đã chốt công' : '') + '</option>'; }).join('') + '</select></div>';
    var st = '<div class="bl-st">' + (L ? '<span class="tag tag-ok">Đã chốt bảng lương</span><span>' + esc(L.at) + ' · ' + esc(L.by) + '</span>' : '<span class="tag tag-warn">Nháp – chưa chốt</span>') +
      '<span>' + (cLock ? 'Công tháng đã chốt ' + esc(cLock.at || '') : '<b>Công tháng chưa chốt</b> – số liệu tạm tính; <a href="#" data-go="cc">chốt công ở Tổng hợp công</a> trước khi chốt lương') + '</span>' +
      '<span class="faint">Cách tính theo <a href="#" data-go="congthuc">Thiết lập công thức lương</a> · chờ kế toán trưởng duyệt nghiệp vụ</span></div>';
    if (L) { var now = blCalc(u, ym), diff = now.filter(function (r) { var o = L.rows.filter(function (x) { return x.id === r.id; })[0]; return !o || o.pay !== r.pay; }).length; if (diff) st += '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>Số liệu hiện tại (công, lương, thiết lập) khác lúc chốt ở <b>' + diff + ' người</b>. Bảng lương đã chốt giữ nguyên; muốn cập nhật thì Mở lại rồi chốt lại.</div></div>'; }
    var tabs = '<div class="tl-tabs" role="tablist">' + BL_TABS.map(function (t) { return '<button role="tab" aria-selected="' + (f.tab === t[0]) + '" class="' + (f.tab === t[0] ? 'on' : '') + '" data-act="bl-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body = f.tab === 'nhap' ? blTabNhap(u, ym) : f.tab === 'dc' ? blTabDc(u, ym) : f.tab === 'file' ? '<div id="blOld">' + (BL_OLD ? BL_OLD() : '') + '</div>' : blTabBang(u, ym, f);
    return head + pick + st + tabs + '<div id="blArea">' + body + '</div>';
  };
  ACTS['bl-tab'] = function (a, id) { PS.blg.tab = id; render(); };
  ACTS['bl-u'] = function (a, id) { PS.blg.u = id; render(); };
  ACTS['bl-full'] = ACTS['bl-full'] || function () { };
  ACTS['blg-full'] = function (a, id) { PS.blg.full = id === '1'; render(); };
  function blTabBang(u, ym, f) {
    var rows = blRows(u, ym), cols = blCols(u).filter(function (c) { return f.full || c.main; }), q = norm(f.q || '');
    var list = rows.filter(function (r) { return !q || norm(r.id + ' ' + r.name).indexOf(q) >= 0; });
    var T = function (k) { return rows.reduce(function (t, r) { return t + (+r.c[k] || 0); }, 0); };
    var kpi = '<div class="bl-kpi"><div><span>Số người</span><b>' + rows.length + '</b></div><div><span>Tổng thu nhập</span><b>' + lgMoney(T('tongTN')) + '</b></div><div><span>BH người lao động đóng</span><b>' + lgMoney(T('bhNL')) + '</b></div><div><span>Thuế TNCN</span><b>' + lgMoney(T('tax')) + '</b></div><div><span>Thực lĩnh</span><b>' + lgMoney(T('pay')) + '</b></div><div><span>Tổng chi phí lương DN</span><b>' + lgMoney(T('cost')) + '</b></div></div>';
    var leg = '<div class="bl-leg">' + BL_HL.filter(function (h, i, a) { return a.findIndex(function (x) { return x[2] === h[2]; }) === i; }).map(function (h) { var t = h[2] === 'hl-tax' ? 'Thu nhập chịu thuế, tính thuế' : h[1]; return '<span class="blt"><span class="' + h[2] + '" style="padding:3px 8px;border-radius:6px">' + t + '</span></span>'; }).join('') + '</div>';
    var bar = '<div class="bl-bar"><div class="seg"><button class="' + (!f.full ? 'on' : '') + '" data-act="blg-full" data-id="0">Cột chính</button><button class="' + (f.full ? 'on' : '') + '" data-act="blg-full" data-id="1">Đầy đủ các khoản</button></div><input class="input" id="blQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q || '') + '" style="max-width:240px"></div>';
    var th = '<tr><th>STT</th>' + cols.map(function (c) { return '<th class="' + (c.hl || '') + (c.txt ? '' : ' n') + (c.sub ? ' sub' : '') + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + esc(c.t) + '</th>'; }).join('') + '</tr>';
    var tb = list.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td>' + cols.map(function (c) { var h = blCell(c, r); if (c.name) h = '<a href="#" data-act="bl-ct" data-id="' + esc(r.id) + '">' + h + '</a>'; return '<td class="' + (c.hl || '') + (c.txt ? '' : ' n') + (c.warn ? ' w' : '') + '">' + h + '</td>'; }).join('') + '</tr>'; }).join('');
    var tot = '<tr class="tot"><td></td>' + cols.map(function (c, i) { if (i === 1) return '<td>Cộng ' + list.length + ' người</td>'; if (c.txt || c.num2 || c.warn) return '<td></td>'; var t = list.reduce(function (s0, r) { return s0 + (+c.v(r) || 0); }, 0); return '<td class="n ' + (c.hl || '') + '">' + lgMoney(t) + '</td>'; }).join('') + '</tr>';
    return kpi + bar + leg + '<div class="tbl-wrap"><table class="tbl blt"><thead>' + th + '</thead><tbody>' + tb + tot + '</tbody></table></div><p class="lg-law">Bấm tên để xem từng bước tính, căn cứ pháp lý. Cột tô màu là các mục tổng hợp chính. Phần doanh nghiệp đóng (BHXH 17,5%, BHYT 3%, BHTN 1%, kinh phí công đoàn 2%) không trừ vào lương người lao động.</p>';
  }
  ACTS['bl-ct'] = function (a, id) { var u = blUnit(), r = blRows(u, PS.blg.ym).filter(function (x) { return x.id === id; })[0]; if (!r) return; modal(r.name, 'Bảng lương tháng ' + HR.ymLabel(PS.blg.ym) + (lgM(u, PS.blg.ym).lock ? ' · đã chốt' : ' · tạm tính'), '<div class="lg-pv">' + lgCard(r) + '</div>'); };
  // Tab: nhập khoản biến động của tháng (thưởng, KPI, công tác phí, tạm ứng, bồi thường…)
  function blInItems(u) { return lgOf(u).items.filter(function (x) { return (x.kind === 'input' || (x.kind === 'qty' && x.qtyBy === 'input')) && x.dk !== 'union'; }); }
  function blTabNhap(u, ym) {
    var M = lgM(u, ym), items = blInItems(u), rows = blRows(u, ym), lock = !!M.lock;
    if (!items.length) return '<div class="card card-pad">Chưa có khoản nào cách tính "Nhập mỗi tháng". Thêm ở <a href="#" data-go="congthuc">Thiết lập công thức lương</a>.</div>';
    var th = '<tr><th>Mã NV</th><th>Họ và tên</th>' + items.map(function (x) { return '<th class="n">' + esc(x.t) + (x.kind === 'qty' ? ' (số lượng)' : '') + '<div class="faint" style="font-weight:400">' + (x.g === 'kt' ? 'khấu trừ' : esc((LG_CAT[x.cat] || '').split(' (')[0])) + '</div></th>'; }).join('') + '</tr>';
    var tb = rows.map(function (r) { var o = M.inp[r.id] || {}; return '<tr><td>' + esc(r.id) + '</td><td>' + esc(r.name) + '</td>' + items.map(function (x) { var v = o[x.id]; return '<td class="n"><input class="input bl-in" data-bli="' + esc(r.id) + '" data-k="' + esc(x.id) + '" inputmode="numeric" value="' + (v == null || v === '' ? '' : esc(x.kind === 'qty' ? lgNum(v) : fmtInt(v))) + '"' + (lock ? ' disabled' : '') + ' aria-label="' + esc(x.t + ' ' + r.id) + '"></td>'; }).join('') + '</tr>'; }).join('');
    return '<div class="card card-pad">' + (lock ? '<div class="notice warn" style="margin-bottom:10px">' + ic('info') + '<div>Bảng lương đã chốt – mở lại để sửa.</div></div>' : '') + '<p class="lg-law" style="margin-top:0">Nhập số tiền của tháng ' + HR.ymLabel(ym) + '. Nhập xong tự lưu và tính lại bảng lương. Bồi thường thiệt hại: phần mềm cảnh báo nếu vượt 30% lương thực trả (BLLĐ Điều 102). Không dùng để phạt tiền (Điều 127.2).</p><div class="tbl-wrap"><table class="tbl blt"><thead>' + th + '</thead><tbody>' + tb + '</tbody></table></div></div>';
  }
  // Tab: đối chiếu với bảng lương đơn vị đang dùng (file Excel đã nạp vào phần mềm – loại "Bảng lương")
  var BL_DC = [['Ngày công', function (r) { return r.c.hr ? null : r.c.cong; }, ['Ngày công thực tế'], 1], ['Lương đóng BH', function (r) { return r.c.bhBase; }, ['Lương đóng BH']], ['BH người lao động đóng', function (r) { return r.c.bhNL; }, ['BHXH (8%)', 'BHYT (1,5%)', 'BHTN (1%)']], ['Tổng thu nhập', function (r) { return r.c.tongTN; }, ['Tổng thu nhập']], ['Thu nhập chịu thuế', function (r) { return r.c.tnct; }, ['Thu nhập chịu thuế']], ['Thu nhập tính thuế', function (r) { return r.c.tntt; }, ['Thu nhập tính thuế']], ['Thuế TNCN', function (r) { return r.c.tax; }, ['Thuế TNCN']], ['Thực lĩnh', function (r) { return r.c.pay; }, ['Thực lĩnh']]];
  function blTabDc(u, ym) {
    var file = (u.data.BL || {})[ym] || [];
    if (!file.length) return '<div class="card card-pad"><p>Chưa có bảng lương đơn vị đang dùng của tháng ' + HR.ymLabel(ym) + '. Nạp file Excel bảng lương (cột Mã NV, Tổng thu nhập, Thực lĩnh…) ở <a href="#" data-go="nhap">Nhập dữ liệu</a> rồi quay lại đây – phần mềm so từng người, từng khoản và chỉ ra dòng chênh lệch.</p></div>';
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
    var rows = blCalc(u, ym), bad = rows.filter(function (r) { return r.warn.some(function (w) { return w.lv === 'bad'; }); }), sum = rows.reduce(function (t, r) { return t + r.pay; }, 0);
    var m = modal('Chốt bảng lương tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<p>' + rows.length + ' người · tổng thực lĩnh <b>' + lgMoney(sum) + ' đồng</b>.</p>' + (bad.length ? '<div class="notice warn">' + ic('info') + '<div><b>' + bad.length + ' người có cảnh báo cần xem:</b><br>' + bad.map(function (r) { return esc(r.name) + ': ' + esc(r.warn.filter(function (w) { return w.lv === 'bad'; }).map(function (w) { return w.t; }).join('; ')); }).join('<br>') + '</div></div>' : '') + '<p class="lg-law">Sau khi chốt, bảng lương được giữ nguyên (kể cả khi sửa công, thiết lập), phiếu lương lấy từ bảng đã chốt. Muốn sửa phải Mở lại (ghi lý do).</p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="blOk">Chốt bảng lương</button></div>', true);
    $('#blOk', m).onclick = function () { var M = lgM(u, ym); M.lock = { at: nowVn(), by: ccUser(), ts: Date.now(), rows: rows.map(blSnap) }; blSave(u, ym, 'chốt bảng lương (' + rows.length + ' người, thực lĩnh ' + lgMoney(sum) + ')'); m.close(); toast('Đã chốt bảng lương tháng ' + HR.ymLabel(ym), 'ok'); render(); };
  };
  ACTS['bl-open'] = function () {
    var u = blUnit(), ym = PS.blg.ym, m = modal('Mở lại bảng lương tháng ' + HR.ymLabel(ym), shortUnit(u.name), '<div class="field"><label for="blWhy">Lý do mở lại *</label><input class="input" id="blWhy" maxlength="200"></div><p class="lg-law">Phiếu lương đã gửi nhân viên vẫn giữ bản cũ cho đến khi chốt lại và gửi lại.</p><p id="blMsg" class="tl-msg"></p><div class="link-row" style="justify-content:flex-end;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="blOk">Mở lại</button></div>', true);
    $('#blOk', m).onclick = function () { var w = $('#blWhy', m).value.trim(); if (!w) { $('#blMsg', m).textContent = 'Nhập lý do'; return; } var M = lgM(u, ym); M.prev = M.lock; M.lock = null; blSave(u, ym, 'mở lại bảng lương – ' + w); m.close(); toast('Đã mở lại bảng lương'); render(); };
  };
  ACTS['bl-xls'] = function () {
    var u = blUnit(), ym = PS.blg.ym, rows = blRows(u, ym), cols = blCols(u), L = lgM(u, ym).lock;
    var data = rows.map(function (r, i) { return [i + 1].concat(cols.map(function (c) { var v = c.v(r); return c.txt ? (v == null ? '' : String(v)) : (v == null || v === '' ? null : Math.round((+v) * (c.num2 ? 100 : 1)) / (c.num2 ? 100 : 1)); })); });
    data.push([null].concat(cols.map(function (c, i) { if (i === 1) return 'Cộng ' + rows.length + ' người'; if (c.txt || c.num2) return null; return rows.reduce(function (t, r) { return t + Math.round(+c.v(r) || 0); }, 0); })));
    var sheet = { name: 'Bang luong ' + ym, title: 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG ' + HR.ymLabel(ym), note: u.name + ' · đơn vị: đồng · ' + (L ? 'đã chốt ' + L.at + ' bởi ' + L.by : 'NHÁP – chưa chốt') + ' · cột tô màu là mục tổng hợp chính · cách tính chờ kế toán trưởng duyệt', cols: [{ t: 'STT', w: 6 }].concat(cols.map(function (c) { return { t: c.t, hl: !!c.hl, w: c.txt ? (c.warn ? 50 : 22) : 15 }; })), rows: data, bold: [data.length - 1] };
    saveXlsx([sheet], fileName('Bang luong ' + HR.ymLabel(ym) + ' ' + shortUnit(u.name)));
  };
  BINDS.bl = function () {
    var y = $('#blYm'); if (y) y.addEventListener('change', function () { PS.blg.ym = y.value; render(); });
    var q = $('#blQ'); if (q) q.addEventListener('input', function () { PS.blg.q = q.value; clearTimeout(q._t); q._t = setTimeout(function () { var p = q.selectionStart; render(); var q2 = $('#blQ'); if (q2) { q2.focus(); q2.setSelectionRange(p, p); } }, 250); });
    document.querySelectorAll('[data-bli]').forEach(function (el) {
      el.addEventListener('change', function () {
        var u = blUnit(), ym = PS.blg.ym, M = lgM(u, ym), id = el.getAttribute('data-bli'), k = el.getAttribute('data-k'), it = lgOf(u).items.filter(function (x) { return x.id === k; })[0] || {}, q = it.kind === 'qty', raw = q ? el.value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '') : el.value.replace(/[^\d]/g, '');
        var o = M.inp[id] || (M.inp[id] = {}); if (raw === '') delete o[k]; else o[k] = +raw;
        if (raw !== '') el.value = q ? lgNum(+raw) : fmtInt(+raw);
        blSave(u, ym, ''); toast('Đã lưu');
      });
    });
    if (PS.blg.tab === 'file' && BL_OLD_B && $('#blOld')) { try { BL_OLD_B(); } catch (e) { } }
  };
