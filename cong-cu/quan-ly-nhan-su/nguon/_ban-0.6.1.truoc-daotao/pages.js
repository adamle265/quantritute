  /* =====================================================================
     PAGES – Việc cần xử lý, Nhân viên (hồ sơ), Hợp đồng, Chấm công, Nghỉ phép,
     Bảng lương, Danh mục, Xuất báo cáo, Nạp tháng mới, Hướng dẫn/Video/Góp ý
     (chèn vào giữa app.js khi build – dùng chung biến, hàm của app.js)
     ===================================================================== */
  var PAGES = {}, BINDS = {}, ACTS = {}, PS = {}, REFRESH = null;
  var vn = HR.vnDate;
  function ps(p, def) { if (!PS[p]) PS[p] = Object.assign({}, def); return PS[p]; }
  function isMulti() { return selUnits().length > 1; }
  function unitById(id) { return S.units.filter(function (u) { return u.id === id; })[0]; }
  function gather(type) { var out = []; selUnits().forEach(function (u) { (u.data[type] || []).forEach(function (r) { out.push({ u: u, r: r }); }); }); return out; }
  function monthsOf(type) { var m = {}; selUnits().forEach(function (u) { Object.keys(u.data[type] || {}).forEach(function (k) { m[k] = 1; }); }); return Object.keys(m).sort(); }
  function nvIndex(u) { var kv = u.scannedAt + '#' + (u.ver || 0); if (!u._nv || u._nvv !== kv) { u._nv = {}; u.data.NV.forEach(function (e) { u._nv[e['Mã NV']] = e; }); u._nvv = kv; } return u._nv; }
  function depts() { var o = {}; selUnits().forEach(function (u) { u.data.PB.forEach(function (p) { o[p['Tên phòng ban']] = 1; }); u.data.NV.forEach(function (e) { if (e['Phòng ban']) o[e['Phòng ban']] = 1; }); }); return Object.keys(o); }
  function opt(v, t, sel) { return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(t) + '</option>'; }
  function selectBox(id, label, options, val, w) { return '<div class="field"><label for="' + id + '">' + label + '</label><select class="input" id="' + id + '"' + (w ? ' style="min-width:' + w + 'px"' : '') + '>' + options.map(function (o) { return opt(o[0], o[1], val); }).join('') + '</select></div>'; }
  function searchBox(id, val, ph) { return '<div class="field" style="flex:1;min-width:200px"><label for="' + id + '">Tìm kiếm</label><input class="input" id="' + id + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || 'Tên, mã NV…') + '"></div>'; }
  function norm(s) { return HR.stripAcc(String(s == null ? '' : s)).toLowerCase(); }
  function nfmt(v) { return typeof v === 'number' ? (Number.isInteger(v) ? fmtInt(v) : String(Math.round(v * 100) / 100).replace('.', ',')) : v; }
  function isIso(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  function lvTag(l) { return '<span class="tag ' + (l === 'gap' ? 'tag-bad' : l === 'canh' ? 'tag-warn' : 'tag-info') + '">' + HRR.LV[l] + '</span>'; }
  function money(v) { return v === null || v === undefined || v === '' ? '' : fmtInt(v); }
  function seniority(e, R) { var a = HR.dnum(e['Ngày vào làm']), b = HR.dnum(e['Ngày nghỉ việc']) || HR.dnum(R); if (a === null) return ''; return Math.max(0, Math.floor((b - a) / 365.25 * 10) / 10); }

  /* ---------------- Bộ cảnh báo (bộ nhớ đệm) ---------------- */
  var ACACHE = { key: null, list: [] };
  function alertList() {
    var key = selUnits().map(function (u) { return u.id + '@' + u.scannedAt + '#' + (u.ver || 0) + (u.ccset ? '~' + u.ccset.at : '') + '^' + (u.ccx ? u.ccx.v : 0) + '!' + (u.wf && u.wf.cong ? JSON.stringify(u.wf.cong).length : 0) + '$' + (u.lich ? JSON.stringify(u.lich.pub || {}).length + ':' + JSON.stringify(u.lich.cfg || {}) + ':' + Object.keys(u.lich.d || {}).length : ''); }).join(',') + '|' + refDate() + '|' + JSON.stringify(cfg());
    if (ACACHE.key !== key) {
      var R = refDate(), t0 = Date.now(), list = [];
      selUnits().forEach(function (u) { try { list = list.concat(HRR.alerts(ccUnit(u), R, cfgFor(u))); /* 0.3.1: bảng công theo Tổng hợp công */ if (typeof lcAlerts === 'function') list = list.concat(lcAlerts(u)); } catch (e) { logErr('Tính cảnh báo cho ' + u.name, e); } });
      ACACHE = { key: key, list: list };
      log('Tính cảnh báo tại ngày ' + vn(R) + ': ' + list.length + ' việc (' + list.filter(function (a) { return a.level === 'gap'; }).length + ' gấp) sau ' + (Date.now() - t0) + ' ms');
    }
    return ACACHE.list;
  }
  function isDone(a) { return !!S.done[a.key]; }
  function navBadge() { if (!S.units.length) return 0; try { var L = alertList(); try { alPendCheck(L); } catch (e2) { } return L.filter(function (a) { return a.level !== 'nhac' && !isDone(a); }).length; } catch (e) { return 0; } }

  /* ---------------- Bảng dữ liệu dùng chung (sắp xếp, hiện thêm, xuất Excel) ---------------- */
  var TB = {};
  function cmp(a, b) { if (a === b) return 0; if (a === null || a === undefined || a === '') return 1; if (b === null || b === undefined || b === '') return -1; if (typeof a === 'number' && typeof b === 'number') return a - b; return String(a).localeCompare(String(b), 'vi', { numeric: true }); }
  function cellText(c, r) { var v = c.f(r); if (c.sens && !S.showSens) v = HR.maskValue(v); if (isIso(v)) return vn(v); return v === null || v === undefined ? '' : nfmt(v); }
  function table(id, cols, rows, opts) {
    opts = opts || {};
    var st = TB[id] = TB[id] || { sort: null, limit: opts.limit || 200 };
    var list = rows.slice(), all = cols; cols = cols.filter(function (c) { return !c.hide; }); // hide: chỉ xuất Excel, không hiện
    if (st.sort && cols[st.sort.i]) { var c0 = cols[st.sort.i], sv = c0.s || c0.f; list.sort(function (a, b) { return cmp(sv(a), sv(b)) * st.sort.dir; }); }
    st.cur = { cols: all, list: list, title: opts.title || '', note: opts.note || '' };
    var shown = list.slice(0, st.limit);
    var h = '<div class="tbl-wrap"' + (opts.tall ? ' style="max-height:70vh"' : '') + '><table class="tbl' + (opts.cls ? ' ' + opts.cls : '') + '"><thead><tr>' + cols.map(function (c, i) {
      var arrow = st.sort && st.sort.i === i ? (st.sort.dir > 0 ? ' ▲' : ' ▼') : '';
      return '<th class="' + (c.r ? 'r ' : '') + (c.nosort ? '' : 'sortable') + '"' + (c.nosort ? '' : ' data-tb-sort="' + id + '|' + i + '"') + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' + c.t + arrow + '</th>';
    }).join('') + '</tr></thead><tbody>' + (shown.length ? shown.map(function (r) {
      return '<tr' + (opts.rowAttr ? opts.rowAttr(r) : '') + '>' + cols.map(function (c) { return '<td class="' + (c.r ? 'r ' : '') + (c.mono ? 'mono ' : '') + (c.wrap ? 'wrap ' : '') + (c.cls || '') + '">' + (c.h ? c.h(r) : esc(cellText(c, r))) + '</td>'; }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="' + cols.length + '" class="muted">' + (opts.empty || 'Không có dòng nào.') + '</td></tr>') + '</tbody></table></div>';
    h += '<div class="tb-foot"><span class="muted">' + fmtInt(list.length) + ' dòng' + (list.length > shown.length ? ', đang hiện ' + fmtInt(shown.length) : '') + '</span>' +
      (list.length > shown.length ? '<button class="btn btn-sm" data-act="tb-more" data-id="' + id + '">Hiện thêm ' + fmtInt(Math.min(500, list.length - shown.length)) + ' dòng</button>' : '') +
      (opts.noExport ? '' : '<button class="btn btn-sm" data-act="tb-export" data-id="' + id + '">' + ic('xuat') + 'Xuất Excel</button>') + '</div>';
    return h;
  }
  document.addEventListener('click', function (e) {
    var th = e.target.closest('[data-tb-sort]'); if (!th) return;
    var p = th.getAttribute('data-tb-sort').split('|'), st = TB[p[0]], i = +p[1];
    st.sort = st.sort && st.sort.i === i ? (st.sort.dir > 0 ? { i: i, dir: -1 } : null) : { i: i, dir: 1 };
    if (REFRESH) REFRESH();
  });
  ACTS['tb-more'] = function (a, id) { TB[id].limit += 500; if (REFRESH) REFRESH(); };
  ACTS['tb-export'] = function (a, id) { var c = TB[id] && TB[id].cur; if (!c) return; exportRows(c.title || 'Du lieu', c.cols, c.list, c.note); };
  function exportValue(c, r) { var v = c.x ? c.x(r) : c.f(r); if (c.sens && S.settings.maskExport) v = HR.maskValue(v); if (isIso(v)) return vn(v); return v === undefined ? null : v; }
  function exportRows(title, cols, list, note) {
    var sheet = { name: title.slice(0, 31), title: title.toUpperCase(), note: (note ? note + ' · ' : '') + 'Xuất lúc ' + nowVn() + (S.settings.maskExport ? ' · đã che số CCCD, sổ BHXH, tài khoản' : ''), cols: cols.filter(function (c) { return !c.noExport; }).map(function (c) { return { t: c.xt || c.t.replace(/<[^>]+>/g, '') }; }), rows: [] };
    var ec = cols.filter(function (c) { return !c.noExport; });
    sheet.rows = list.map(function (r) { return ec.map(function (c) { return exportValue(c, r); }); });
    saveXlsx([sheet], fileName(title));
  }
  function fileName(t) { var d = new Date(); return HR.stripAcc(t).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '.xlsx'; }
  function saveXlsx(sheets, name) {
    try {
      var u8 = XW.build(sheets), blob = new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      log('Xuất file Excel ' + name + ' (' + sheets.map(function (s) { return s.name + ': ' + s.rows.length + ' dòng'; }).join('; ') + ')');
      toast('Đã tạo file ' + name, 'ok', 'File nằm trong thư mục Tải về (Downloads) của trình duyệt.');
    } catch (e) { showErr('Chưa xuất được file Excel', e); }
  }
  function bindFilters(page, map, refresh) {
    Object.keys(map).forEach(function (id) {
      var el = $('#' + id); if (!el) return;
      var ev = el.tagName === 'INPUT' && el.type !== 'checkbox' ? 'input' : 'change';
      el.addEventListener(ev, function () { PS[page][map[id]] = el.type === 'checkbox' ? el.checked : el.value; Object.keys(TB).forEach(function (k) { if (k.indexOf(page) === 0) TB[k].limit = 200; }); refresh(); });
    });
  }
  function pageHead(t, sub, right) { return '<div class="page-head"><div><h1>' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right ? '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + right + '</div>' : '') + '</div>'; }
  function noData(what) { return '<div class="card empty"><img class="dom-img" alt="Đốm"><h2>Chưa có ' + what + '</h2><p>Phần mềm chưa tìm thấy bảng này trong thư mục dữ liệu. Xem trang <a href="#nhap" data-go="nhap">Nhập dữ liệu</a> để biết đã đọc được những gì.</p></div>'; }
  function uCol() { return isMulti() ? [{ t: 'Đơn vị', f: function (x) { return x.u.name; } }] : []; }
  function personLink(u, id, name) { return '<a href="#" class="plink" data-act="profile" data-u="' + u.id + '" data-id="' + esc(id) + '">' + esc(name || id) + '</a>'; }
  ACTS.profile = function (a, id, e) { e.preventDefault(); openProfile(a.getAttribute('data-u'), a.getAttribute('data-id')); };

  /* ================== VIỆC CẦN XỬ LÝ ================== */
  function urgentCard() {
    var list = alertList().filter(function (a) { return a.level !== 'nhac' && !isDone(a); });
    var gap = list.filter(function (a) { return a.level === 'gap'; }).length;
    var top = list.slice(0, 6);
    return '<div class="card card-pad"><div class="card-head"><div><h3>Việc cần xử lý gấp</h3><p>Đối chiếu từ nhiều file, tính đến ' + vn(refDate()) + ' · ' + gap + ' việc gấp, ' + (list.length - gap) + ' việc cần xử lý</p></div><a class="btn btn-sm" href="#viec" data-go="viec">Xem tất cả ' + list.length + ' việc →</a></div>' +
      (top.length ? '<div class="al-list">' + top.map(alertRow).join('') + '</div>' : '<p class="muted">Không có việc gấp. Tốt lắm!</p>') + '</div>';
  }
  // 0.1.2 – THẺ VIỆC: ảnh người liên quan · loại · nội dung · căn cứ · tờ lịch hạn xử lý · nút Mở hồ sơ / Đã xử lý
  var LV_IC = { gap: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2v.1"/>', canh: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', nhac: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' };
  function lvIcon(l) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + LV_IC[l] + '</svg>'; }
  function whoHtml(a, u) {
    if (!a.id) return '<span class="vc-who grp"><i class="lv-' + a.level + '">' + lvIcon(a.level) + '</i><span><b>Cả đơn vị</b><small>' + (a.people && a.people.length ? a.people.length + ' người liên quan' : esc(a.unit || '')) + '</small></span></span>';
    var e = u ? nvIndex(u)[a.id] : null, av = e ? avatarOf(e, u.source === 'sample') : null;
    return '<span class="vc-who">' + (av ? '<img src="' + av + '" alt="">' : '<i>' + esc(givenName(a.name || a.id).charAt(0).toUpperCase()) + '</i>') + '<span>' + personLink(u, a.id, a.name) + '<small>' + esc(shortDept(a.dept || '')) + '</small></span></span>';
  }
  function alertRow(a, noWho) {
    var u = unitById(a.unitId), K = HRR.KINDS[a.kind] || { name: a.kind }, done = isDone(a), fx = alFix(a);
    var when = a.days === null || a.days === undefined ? '' : a.days < 0 ? 'Quá ' + (-a.days) + ' ngày' : a.days === 0 ? 'Hôm nay' : 'Còn ' + a.days + ' ngày';
    var cal = a.due ? '<span class="ev-cal vc-cal lv-' + a.level + '"><small>Th' + (+a.due.slice(5, 7)) + '/' + a.due.slice(2, 4) + '</small><b>' + (+a.due.slice(8, 10)) + '</b></span>' : '';
    var src = (a.sources || []).join(' · ');
    return '<div class="vc vc-' + a.level + (done ? ' done' : '') + '">' +
      '<div class="vc-main"><div class="vc-head">' + (noWho ? '' : whoHtml(a, u)) + '<span class="vc-kind lv-' + a.level + '">' + lvIcon(a.level) + esc(K.name) + '</span>' + (isMulti() ? '<span class="tag tag-mute">' + esc(shortUnit(a.unit)) + '</span>' : '') + '</div>' +
      '<div class="vc-title">' + esc(a.title) + '</div>' + (a.detail ? '<div class="vc-detail">' + esc(a.detail) + '</div>' : '') +
      '<div class="vc-foot">' + (K.law ? '<span class="vc-law">Căn cứ: ' + esc(K.law) + '</span>' : '') + (src ? '<span class="vc-from">Đối chiếu: ' + esc(src) + '</span>' : '') +
      (a.people && a.people.length ? '<button class="btn btn-sm" data-act="al-people" data-key="' + esc(a.key) + '">' + (a.miss ? 'Xem danh sách thiếu' : 'Xem ' + a.people.length + ' người') + '</button>' : '') + '</div>' +
      (done ? '<div class="vc-done">✓ Đã xử lý ' + esc(S.done[a.key].at || '') + (S.done[a.key].note ? ' – ' + esc(S.done[a.key].note) : '') + '</div>' : '') + '</div>' +
      '<div class="vc-side">' + (cal || when ? '<div class="vc-when">' + cal + (when ? '<span class="vc-d' + (a.days < 0 ? ' bad' : a.days <= 7 ? ' warn' : '') + '">' + when + '</span>' : '') + '</div>' : '') +
      '<div class="vc-btns">' + (fx && !done ? '<button class="btn btn-sm btn-primary" data-act="al-fix" data-key="' + esc(a.key) + '" title="' + esc(fx.tip || '') + '">' + esc(fx.t) + ' →</button>' : '') + (a.id && u && !noWho ? '<button class="btn btn-sm" data-act="profile" data-u="' + u.id + '" data-id="' + esc(a.id) + '">Mở hồ sơ</button>' : '') +
      '<button class="btn btn-sm ' + (done || fx ? '' : 'btn-primary') + '" data-act="al-done" data-key="' + esc(a.key) + '" title="' + (fx ? 'Dùng khi đã xử lý ngoài phần mềm' : '') + '">' + (done ? 'Hoàn tác' : '✓ Đã xử lý') + '</button></div></div></div>';
  }

  /* 12/11 góp ý: nút "Xử lý" dẫn thẳng tới đúng chỗ cần sửa; việc do phần mềm tự đối chiếu tự đóng khi dữ liệu đã đúng (báo "Việc đã tự đóng").
     "Đã xử lý" chỉ còn để đánh dấu việc xử lý ngoài phần mềm. */
  function fakeA(o) { return { getAttribute: function (k) { return o[k] == null ? null : o[k]; } }; }
  function alYm(a) { var k = String(a.k || a.ym || ''); var m = /(\d{4}-\d{2})/.exec(k); return m ? m[1] : ''; }
  var AL_FIX = {
    hd_soon: ['Lập hợp đồng mới', 'hd'], hd_expired: ['Lập hợp đồng mới', 'hd'], hd_indef: ['Lập HĐ không xác định thời hạn', 'hd'], no_hd: ['Lập hợp đồng', 'hd'], tv_long: ['Lập hợp đồng lao động', 'hd'], ld_hd: ['Lập lại hợp đồng', 'hd'],
    tv_pay: ['Xem hợp đồng', 'phd'], ctv_hd: ['Xem hợp đồng', 'phd'], don_pending: ['Duyệt đơn', 'don'], phep_low: ['Mở quỹ phép', 'np'], phep_diff: ['Mở quỹ phép', 'np'],
    nghi_don: ['Mở bảng công', 'cc'], di_muon: ['Mở bảng công', 'cc'], ot: ['Mở bảng công', 'cc'], cong_sai: ['Mở bảng công', 'cc'], xep_ca: ['Mở lịch xếp ca', 'lc'],
    luong_cc: ['Mở bảng lương', 'bl'], luong_cb: ['Mở cơ cấu nhân sự', 'ccu'], luong_cocau: ['Duyệt cơ cấu nhân sự', 'ccu'], bhxh_pt: ['Mở cơ cấu nhân sự', 'ccu'],
    ho_so: ['Mở hồ sơ', 'hs'], giay_to: ['Bổ sung giấy tờ', 'hs'], ts_back: ['Mở hồ sơ', 'hs'], luu_tru: ['Mở hồ sơ', 'hs'], dinh_bien: ['Mở sơ đồ tổ chức', 'go:tochuc'],
    td_new: ['Xem hồ sơ ứng viên', 'go:tdungvien'], td_keep: ['Mở ngân hàng ứng viên', 'go:tdungvien'], td_iv: ['Mở lịch phỏng vấn', 'go:tdlich'], td_offer: ['Mở kết quả phỏng vấn', 'go:tdmoi'], td_dead: ['Sửa tin tuyển dụng', 'go:tdtin'], td_fair: ['Sửa tin tuyển dụng', 'go:tdtin'], td_policy: ['Mở cổng tuyển dụng', 'go:tdtin'], td_start: ['Tạo hồ sơ nhân sự', 'go:nv'],
    hn_late: ['Mở hội nhập', 'hn'], hn_none: ['Bắt đầu hội nhập', 'go:hntiendo']
  };
  function alFix(a) { var f = AL_FIX[a.kind]; if (!f) return null; if ((f[1] === 'hd' || f[1] === 'phd' || f[1] === 'hs') && !a.id) return f[1] === 'hs' ? null : { t: f[0], to: 'go:hd' }; if (f[1] === 'don' && !a.k) return { t: 'Mở nghỉ phép', to: 'np' }; return { t: f[0], to: f[1], tip: 'Mở đúng chỗ cần xử lý – xong việc tự đóng' }; }
  var AL_PEND = {};
  function alPendCheck(list) { var ks = Object.keys(AL_PEND); if (!ks.length) return; var have = {}; list.forEach(function (a) { have[a.key] = 1; }); ks.forEach(function (k) { if (!have[k]) { toast('✓ Việc đã tự đóng', 'ok', AL_PEND[k] + ' – dữ liệu đã đúng nên việc này không còn trong danh sách.'); log('Việc tự đóng sau khi xử lý: ' + AL_PEND[k]); delete AL_PEND[k]; } }); }
  ACTS['al-fix'] = function (b) {
    var key = b.getAttribute('data-key'), a = findAlert(key); if (!a) return; var fx = alFix(a); if (!fx) return; var u = unitById(a.unitId), to = fx.to, ym = alYm(a);
    AL_PEND[key] = a.title;
    if (/^go:/.test(to)) { go(to.slice(3)); return; }
    if (to === 'hd') { go('hd'); setTimeout(function () { ACTS['hd-new'](fakeA({ 'data-u': u.id }), a.id); }, 120); return; }
    if (to === 'phd') { openProfile(u.id, a.id, 'hd'); return; }
    if (to === 'hs') { ACTS['hs-open'](fakeA({ 'data-u': u.id }), a.id); return; }
    if (to === 'don') { go('np'); setTimeout(function () { ACTS['np-ok'](fakeA({}), u.id + '|' + a.k); }, 120); return; }
    if (to === 'np') { go('np'); return; }
    if (to === 'cc') { ACTS['al-cc'](fakeA({ 'data-u': u.id, 'data-id': a.id || '', 'data-m': ym || '' })); return; }
    if (to === 'lc') { ACTS['al-lc'](fakeA({ 'data-u': u.id })); return; }
    if (to === 'bl') { var f = ps('blg', { u: '', ym: '', q: '', view: '' }); f.u = u.id; if (ym) f.ym = ym; go('bl'); return; }
    if (to === 'ccu') { var c = ps('ccu', { u: '', ym: '', q: '' }); c.u = u.id; if (ym) c.ym = ym; go('cocau'); return; }
    if (to === 'hn') { var p = String(a.key).split('||')[1] || '', ob = p.split('/')[0]; go('hntiendo'); setTimeout(function () { if (ACTS['hnt-open']) ACTS['hnt-open'](fakeA({ 'data-u': u.id }), ob); }, 120); return; }
  };
  ACTS['al-lc'] = function (a) { var tf = ps('tlcc', { tabs: {}, u: '', y: '' }); tf.tabs = tf.tabs || {}; tf.tabs.tlsx = 'xep'; tf.u = a.getAttribute('data-u') || tf.u; if (location.hash !== '#tlsx') location.hash = '#tlsx'; else render(); };
  ACTS['al-cc'] = function (a) { var f = ps('bc', { m: '', view: 'grid', q: '', dept: '', only: false }); f.m = a.getAttribute('data-m') || f.m; f.q = a.getAttribute('data-id') || ''; f.view = 'grid'; f.dept = ''; if (location.hash !== '#cc') location.hash = '#cc'; else render(); }; // 0.3.2: báo sai công → mở bảng công tháng đó, lọc đúng người
  function findAlert(key) { return alertList().filter(function (a) { return a.key === key; })[0]; }
  ACTS['al-done'] = function (a) {
    var key = a.getAttribute('data-key'), al = findAlert(key); if (!al) return;
    if (S.done[key]) { delete S.done[key]; saveDone(); log('Bỏ đánh dấu đã xử lý: ' + al.title); render(); return; }
    var m = modal('Đánh dấu đã xử lý', al.title, '<div class="field"><label for="dnNote">Ghi chú (không bắt buộc)</label><input class="input" id="dnNote" placeholder="vd: đã ký HĐ 045/2026, đã duyệt đơn…" maxlength="200"></div><p class="faint" style="font-size:12.5px">Việc đã đánh dấu được ẩn khỏi danh sách "Chưa xử lý"; xem lại ở bộ lọc "Đã xử lý". Nếu dữ liệu thay đổi khiến việc này xuất hiện lại với nội dung khác, phần mềm sẽ báo lại.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="dnOk">Lưu</button></div>', true);
    function ok() { S.done[key] = { at: nowVn().slice(0, 10), note: $('#dnNote', m).value.trim(), title: al.title }; saveDone(); log('Đánh dấu đã xử lý: ' + al.title); m.close(); render(); }
    $('#dnOk', m).addEventListener('click', ok); $('#dnNote', m).addEventListener('keydown', function (e) { if (e.key === 'Enter') ok(); });
  };
  ACTS['al-people'] = function (a) {
    var al = findAlert(a.getAttribute('data-key')); if (!al) return;
    var u = unitById(al.unitId), nv = nvIndex(u);
    var rows = al.people.map(function (id) { return { u: u, id: id, e: nv[id] || {} }; });
    if (al.miss) { // việc gộp "Hồ sơ giấy tờ còn thiếu": danh sách cụ thể từng người, bấm để mở trang Hồ sơ nhân sự của người đó
      var mm = modal(al.title, (isMulti() ? shortUnit(u.name) + ' · ' : '') + 'Bấm "Bổ sung" để mở hồ sơ, ghi ngày nộp từng giấy tờ', table('ppl', [{ t: 'Mã NV', f: function (x) { return x.id; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.e['Họ và tên'] || ''; }, h: function (x) { return personLink(u, x.id, x.e['Họ và tên'] || x.id); } }, { t: 'Phòng ban', f: function (x) { return x.e['Phòng ban']; } }, { t: 'Còn thiếu', f: function (x) { return al.miss[x.id]; }, h: function (x) { return '<span class="miss">' + esc(al.miss[x.id]) + '</span>'; } }, { t: '', f: function () { return ''; }, h: function (x) { return '<button class="btn btn-sm" data-act="hs-open" data-u="' + u.id + '" data-id="' + esc(x.id) + '">Bổ sung</button>'; } }], rows, { title: 'Ho so giay to con thieu', limit: 1000 }));
      mm.addEventListener('click', function (e) { if (e.target.closest('[data-act="profile"],[data-act="hs-open"]')) mm.close(); });
      return;
    }
    var m = modal(al.title, al.detail, table('ppl', [{ t: 'Mã NV', f: function (x) { return x.id; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.e['Họ và tên'] || '(không có trong hồ sơ)'; }, h: function (x) { return x.e['Họ và tên'] ? personLink(u, x.id, x.e['Họ và tên']) : '<span class="faint">(không có trong hồ sơ)</span>'; } }, { t: 'Phòng ban', f: function (x) { return x.e['Phòng ban']; } }, { t: 'Trạng thái', f: function (x) { return x.e['Trạng thái']; } }, { t: 'Ngày nghỉ việc', f: function (x) { return x.e['Ngày nghỉ việc']; } }], rows, { title: 'Danh sach', limit: 1000 }));
    m.addEventListener('click', function (e) { if (e.target.closest('[data-act="profile"]')) m.close(); });
  };
  /* ================== VIỆC ĐỊNH KỲ (0.1.2 – anh yêu cầu 05/11/2026) ==================
     Việc lặp lại hằng tháng, thiết lập ở Cài đặt hệ thống → Việc định kỳ; hiện ở trang Việc cần xử lý.
     Quy tắc: ngày thiết lập rơi vào Thứ Bảy / Chủ nhật → tháng đó tự chuyển sang ngày làm việc kế tiếp gần nhất.
     Ngày lớn hơn số ngày của tháng (vd 31 ở tháng 30 ngày) → lấy ngày cuối tháng. Việc quá hạn còn hiện 7 ngày, sau đó chuyển sang lần tới. */
  var DK_DEF = [
    { id: 'dk1', t: 'Gửi xác nhận chấm công cho nhân sự', d: 1, b: 3, who: '', on: true },
    { id: 'dk2', t: 'Chốt bảng chấm công', d: 3, b: 3, who: '', on: true },
    { id: 'dk3', t: 'Chốt & xin duyệt bảng lương', d: 6, b: 3, who: '', on: true },
    { id: 'dk4', t: 'Hoàn thành gửi phiếu lương', d: 8, b: 3, who: '', on: true },
    { id: 'dk5', t: 'Chi lương', d: 10, b: 3, who: '', on: true }
  ];
  var DK_OVER = 7;
  // 12/11 góp ý: mỗi việc định kỳ có nút mở thẳng chức năng làm việc đó
  var DK_GO = [['', '— Không —'], ['cc', 'Tổng hợp công'], ['np', 'Nghỉ phép'], ['cocau', 'Cơ cấu nhân sự'], ['bl', 'Bảng lương'], ['phieuluong', 'Phiếu lương'], ['chiluong', 'Bảng chi lương'], ['hd', 'Hợp đồng'], ['nv', 'Danh sách nhân sự'], ['tdnhucau', 'Nhu cầu tuyển dụng'], ['hntiendo', 'Hội nhập nhân sự mới'], ['xuat', 'Xuất báo cáo']];
  function dkGo(t) {
    if (t.go != null) return t.go;
    var s = String(t.t || '').toLowerCase();
    return /phiếu lương/.test(s) ? 'phieuluong' : /chi lương/.test(s) ? 'chiluong' : /bảng lương|duyệt lương/.test(s) ? 'bl' : /chấm công|bảng công/.test(s) ? 'cc' : /cơ cấu/.test(s) ? 'cocau' : /hợp đồng/.test(s) ? 'hd' : '';
  }
  function dkGoName(id) { var x = DK_GO.filter(function (g) { return g[0] === id; })[0]; return x ? x[1] : ''; }
  function dkList() { if (!Array.isArray(S.settings.periodic)) S.settings.periodic = JSON.parse(JSON.stringify(DK_DEF)); return S.settings.periodic; }
  function dkDate(y, m, day) {
    if (m < 1) { m += 12; y--; } if (m > 12) { m -= 12; y++; }
    var last = new Date(Date.UTC(y, m, 0)).getUTCDate(), dd = Math.min(Math.max(1, day), last), t0 = Date.UTC(y, m - 1, dd) / 864e5, t = t0;
    while ([0, 6].indexOf(new Date(t * 864e5).getUTCDay()) >= 0) t++;
    return { iso: isoOfN(t), orig: isoOfN(t0), shifted: t !== t0, ym: y + '-' + p2(m) };
  }
  function dkNext(task, R) {
    var r = HR.dnum(R), y = +R.slice(0, 4), m = +R.slice(5, 7);
    for (var k = -1; k <= 3; k++) {
      var c = dkDate(y, m + k, +task.d), days = HR.dnum(c.iso) - r; c.key = 'dk|' + task.id + '|' + c.ym; c.days = days;
      if (S.done[c.key] || days < -DK_OVER) continue;
      return c;
    }
    return null;
  }
  function dkWeek(iso) { return THU_VN[dowOf(iso)]; }
  function dkCard() {
    var R = refDate(), L = dkList().filter(function (x) { return x.on; });
    var it = L.map(function (t) { var n = dkNext(t, R); return n ? Object.assign({ task: t }, n) : null; }).filter(Boolean).sort(function (a, b) { return a.days - b.days; });
    var ym = R.slice(0, 7), doneNow = [];
    dkList().forEach(function (t) { for (var k = -1; k <= 2; k++) { var c = dkDate(+ym.slice(0, 4), +ym.slice(5, 7) + k, +t.d); c.key = 'dk|' + t.id + '|' + c.ym; if (S.done[c.key]) doneNow.push({ t: t, c: c }); } });
    doneNow.sort(function (a, b) { return a.c.iso < b.c.iso ? -1 : 1; });
    var rows = it.map(function (x) {
      var lv = x.days < 0 ? 'gap' : x.days <= (+x.task.b || 0) ? 'canh' : 'nhac';
      var when = x.days < 0 ? 'Quá ' + (-x.days) + ' ngày' : x.days === 0 ? 'Hôm nay' : 'Còn ' + x.days + ' ngày';
      var sub = 'Hằng tháng ngày ' + x.task.d + (x.shifted ? ' · ' + vn(x.orig).slice(0, 5) + ' là ' + dkWeek(x.orig) + ' → chuyển sang ' + dkWeek(x.iso) + ' ' + vn(x.iso).slice(0, 5) : '') + (x.task.who ? ' · Phụ trách: ' + esc(x.task.who) : '');
      return '<div class="dk-row lv-' + lv + (lv === 'nhac' ? ' far' : '') + '"><span class="ev-cal vc-cal lv-' + lv + '"><small>Th' + (+x.iso.slice(5, 7)) + '</small><b>' + (+x.iso.slice(8, 10)) + '</b></span>' +
        '<span class="dk-t"><b>' + esc(x.task.t) + '</b><small>' + sub + '</small></span><span class="vc-d' + (x.days < 0 ? ' bad' : lv === 'canh' ? ' warn' : '') + '">' + when + '</span>' +
        '<span class="dk-acts">' + (dkGo(x.task) ? '<button class="btn btn-sm dk-go" data-act="dk-open" data-p="' + dkGo(x.task) + '" data-ym="' + x.ym + '" title="Mở ' + esc(dkGoName(dkGo(x.task))) + '">' + esc(dkGoName(dkGo(x.task))) + ' →</button>' : '') +
        '<button class="btn btn-sm' + (lv !== 'nhac' ? ' btn-primary' : '') + '" data-act="dk-done" data-key="' + esc(x.key) + '" data-t="' + esc(x.task.t) + '">✓ Xong</button></span></div>';
    }).join('');
    var soon = it.filter(function (x) { return x.days <= (+x.task.b || 0); }).length;
    return '<div class="card card-pad dk-card"><div class="card-head"><div><h3>' + ic('dinhky') + 'Việc định kỳ</h3><p>Lặp lại hằng tháng · ' + (soon ? '<b>' + soon + ' việc sắp đến hạn</b>' : 'chưa có việc nào sắp đến hạn') + ' · ngày rơi vào Thứ Bảy, Chủ nhật tự chuyển sang ngày làm việc kế tiếp</p></div><button class="btn btn-sm" data-go="dinhky">Thiết lập</button></div>' +
      (rows ? '<div class="dk-list">' + rows + '</div>' : '<p class="muted">Chưa bật việc định kỳ nào. Bấm Thiết lập để thêm.</p>') +
      (doneNow.length ? '<div class="dk-done">Đã xong: ' + doneNow.map(function (x) { return '<button class="dk-chip" data-act="dk-undo" data-key="' + esc(x.c.key) + '" title="Bấm để hoàn tác">✓ ' + esc(x.t.t) + ' (kỳ T' + (+x.c.ym.slice(5, 7)) + ')</button>'; }).join('') + '</div>' : '') + '</div>';
  }
  ACTS['dk-done'] = function (a) { var k = a.getAttribute('data-key'); S.done[k] = { at: nowVn().slice(0, 10), title: a.getAttribute('data-t') }; saveDone(); log('Việc định kỳ đã xong: ' + a.getAttribute('data-t') + ' (' + k.split('|')[2] + ')'); render(); };
  ACTS['dk-open'] = function (a) {
    var p = a.getAttribute('data-p'), ym = a.getAttribute('data-ym') || '';
    // kỳ việc định kỳ là tháng làm việc; chấm công, lương xử lý cho tháng trước đó
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1; if (m < 1) { m = 12; y--; } var pm = y + '-' + p2(m);
    if (ym && (p === 'bl' || p === 'phieuluong' || p === 'chiluong')) { ps('blg', { u: '', ym: '', q: '', view: '' }).ym = pm; }
    if (ym && p === 'cocau') { ps('ccu', { u: '', ym: '', q: '' }).ym = pm; }
    go(p);
  };
  ACTS['dk-undo'] = function (a) { delete S.done[a.getAttribute('data-key')]; saveDone(); render(); };
  // Trang thiết lập: Cài đặt hệ thống → Việc định kỳ
  PAGES.dinhky = function () {
    var L = dkList(), R = refDate();
    var rows = L.map(function (t) {
      var n = dkNext(t, R);
      return '<tr' + (t.on ? '' : ' class="off"') + '><td><label class="dk-sw"><input type="checkbox" data-dk="on" data-id="' + t.id + '"' + (t.on ? ' checked' : '') + '><span></span></label></td>' +
        '<td><input class="input" data-dk="t" data-id="' + t.id + '" value="' + esc(t.t) + '" maxlength="120" aria-label="Tên việc"></td>' +
        '<td class="r"><input class="input num dk-n" type="number" min="1" max="31" data-dk="d" data-id="' + t.id + '" value="' + t.d + '" aria-label="Ngày hằng tháng"></td>' +
        '<td class="r"><input class="input num dk-n" type="number" min="0" max="20" data-dk="b" data-id="' + t.id + '" value="' + t.b + '" aria-label="Nhắc trước"></td>' +
        '<td><input class="input" data-dk="who" data-id="' + t.id + '" value="' + esc(t.who || '') + '" maxlength="60" aria-label="Phụ trách"></td>' +
        '<td><select class="input" data-dk="go" data-id="' + t.id + '" aria-label="Mở chức năng">' + DK_GO.map(function (g) { return '<option value="' + g[0] + '"' + (g[0] === dkGo(t) ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select></td>' +
        '<td class="dk-next">' + (n ? '<b>' + dkWeek(n.iso) + ' ' + vn(n.iso) + '</b>' + (n.shifted ? '<small>chuyển từ ' + dkWeek(n.orig) + ' ' + vn(n.orig) + '</small>' : '') : '—') + '</td>' +
        '<td><button class="btn btn-sm" data-act="dk-del" data-id="' + t.id + '" title="Xóa việc này">Xóa</button></td></tr>';
    }).join('');
    return pageHead('Việc định kỳ', 'Các việc lặp lại hằng tháng. Việc đang bật sẽ hiện ở trang Việc cần xử lý; được tô màu khi còn trong số ngày "Nhắc trước".', '<button class="btn btn-primary" data-act="dk-add">+ Thêm việc</button>') +
      '<div class="notice">' + ic('info') + '<div><b>Quy tắc ngày:</b> nếu ngày thiết lập rơi vào <b>Thứ Bảy hoặc Chủ nhật</b> thì trong tháng đó tự chuyển sang <b>ngày làm việc kế tiếp gần nhất</b> (vd ngày 08/11/2026 là Chủ nhật → Thứ Hai 09/11). Ngày lớn hơn số ngày của tháng (vd ngày 31) lấy ngày cuối tháng. Ngày lễ chưa tự tính – sẽ bổ sung khi có lịch nghỉ lễ của đơn vị.</div></div><div style="height:12px"></div>' +
      '<div class="card card-pad"><div class="tbl-wrap"><table class="tbl dk-tbl"><thead><tr><th>Bật</th><th>Tên việc</th><th class="r">Ngày hằng tháng</th><th class="r">Nhắc trước (ngày)</th><th>Người phụ trách</th><th>Nút mở chức năng</th><th>Lần tới (tính từ ' + vn(R) + ')</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="8" class="muted">Chưa có việc nào. Bấm "+ Thêm việc".</td></tr>') + '</tbody></table></div>' +
      '<div class="tb-foot"><span class="muted">' + L.length + ' việc · ' + L.filter(function (t) { return t.on; }).length + ' đang bật · thay đổi tự lưu</span><button class="btn btn-sm" data-act="dk-reset">Khôi phục 5 việc mẫu</button></div></div>';
  };
  BINDS.dinhky = function () {
    $$('[data-dk]').forEach(function (el) {
      el.addEventListener('change', function () {
        var t = dkList().filter(function (x) { return x.id === el.getAttribute('data-id'); })[0], f = el.getAttribute('data-dk'); if (!t) return;
        if (f === 'on') t.on = el.checked;
        else if (f === 'd' || f === 'b') { var v = Math.round(+el.value); var lo = f === 'd' ? 1 : 0, hi = f === 'd' ? 31 : 20; if (isNaN(v) || v < lo || v > hi) { toast(f === 'd' ? 'Ngày hằng tháng từ 1 đến 31' : 'Nhắc trước từ 0 đến 20 ngày', 'err'); el.value = t[f]; return; } t[f] = v; }
        else { var s = el.value.trim(); if (f === 't' && !s) { el.value = t.t; return; } t[f] = s; }
        saveSettings(); log('Sửa việc định kỳ: ' + t.t); render();
      });
    });
  };
  ACTS['dk-add'] = function () { dkList().push({ id: 'dk' + Date.now().toString(36), t: 'Việc mới', d: 15, b: 3, who: '', on: true }); saveSettings(); render(); setTimeout(function () { var x = $$('[data-dk="t"]'); if (x.length) { x[x.length - 1].focus(); x[x.length - 1].select(); } }, 50); };
  ACTS['dk-del'] = function (a, id) { var L = dkList(), t = L.filter(function (x) { return x.id === id; })[0]; if (!t) return; S.settings.periodic = L.filter(function (x) { return x.id !== id; }); saveSettings(); log('Xóa việc định kỳ: ' + t.t); toast('Đã xóa "' + t.t + '"', 'ok'); render(); };
  ACTS['dk-reset'] = function () { S.settings.periodic = JSON.parse(JSON.stringify(DK_DEF)); saveSettings(); toast('Đã khôi phục 5 việc mẫu', 'ok'); render(); };

  PAGES.viec = function () {
    var f = ps('viec', { lv: '', han: '7', kind: '', dept: '', q: '', st: 'todo', view: 'lv' }); if (!f.view) f.view = 'lv'; if (!f.han) f.han = '7'; if (f.lv === 'open' && !f.who) f.lv = '';
    var all = alertList();
    var cnt = { gap: 0, canh: 0, nhac: 0 }, doneN = 0; all.forEach(function (a) { if (isDone(a)) doneN++; else cnt[a.level]++; });
    var kinds = {}; all.forEach(function (a) { kinds[a.kind] = (kinds[a.kind] || 0) + 1; });
    var off = Object.keys(cfg().off || {}).filter(function (k) { return cfg().off[k]; }).length, pct = all.length ? Math.round(doneN / all.length * 100) : 0;
    var LVN = { gap: ['Gấp', 'xử lý ngay, có rủi ro pháp lý / tiền'], canh: ['Cần xử lý', 'trong thời gian tới'], nhac: ['Theo dõi', 'nhắc nhẹ, không gấp'] };
    var tiles = ['gap', 'canh', 'nhac'].map(function (l) { return '<button type="button" class="vc-tile lv-' + l + (f.lv === l ? ' on' : '') + (cnt[l] ? '' : ' zero') + '" data-act="viec-lv" data-id="' + l + '"><span class="vc-tic">' + lvIcon(l) + '</span><b class="num">' + cnt[l] + '</b><span class="t">' + LVN[l][0] + '</span><small>' + LVN[l][1] + '</small></button>'; }).join('');
    // 07/11 10:03 (anh yêu cầu): bộ lọc đầu tiên theo hạn – thay dòng "Đang hiện: Gấp + Cần xử lý"; mặc định Trong 07 ngày
    var hc = {}; var base = viecFiltered(true); VIEC_HAN.forEach(function (h) { hc[h[0]] = base.filter(function (a) { return hanIn(a, h[0]); }).length; });
    var hanTabs = VIEC_HAN.map(function (h) { return '<button type="button" class="seg-b' + (f.han === h[0] ? ' on' : '') + '" role="tab" aria-selected="' + (f.han === h[0]) + '" data-act="viec-han" data-id="' + h[0] + '">' + h[1] + ' <b class="vc-hn">' + hc[h[0]] + '</b></button>'; }).join('');
    var views = [['lv', 'Theo mức độ'], ['nguoi', 'Theo người'], ['han', 'Theo hạn']].map(function (v) { return '<button type="button" class="seg-b' + (f.view === v[0] ? ' on' : '') + '" data-act="viec-view" data-id="' + v[0] + '">' + v[1] + '</button>'; }).join('');
    return pageHead('Việc cần xử lý', 'Phần mềm tự đối chiếu hồ sơ, hợp đồng, chấm công, nghỉ phép, bảng lương · tính đến ' + vn(refDate()) + (off ? ' · đang tắt ' + off + ' loại cảnh báo (Cài đặt)' : ''), '<button class="btn" data-act="viec-export">' + ic('xuat') + 'Xuất Excel</button>') +
      '<div class="vc-band"><div class="vc-prog"><span class="vc-prog-l">Tiến độ xử lý</span><div class="vc-prog-n"><b class="num">' + doneN + '</b><span>/ ' + all.length + ' việc đã xử lý</span></div><div class="vc-bar"><i style="width:' + pct + '%"></i></div>' +
      '<small>' + (all.length - doneN ? 'Xử lý xong việc nào, bấm "✓ Đã xử lý" để gạch khỏi danh sách.' : 'Đã xử lý hết. Tuyệt vời!') + '</small></div>' + tiles + '</div>' +
      dkCard() + '<div class="vc-bar2"><div class="seg vc-han" role="tablist" aria-label="Lọc theo hạn">' + hanTabs + '</div><div class="vc-bar3"><span class="vc-lbl">Sắp xếp</span><div class="seg" role="tablist" aria-label="Cách xem">' + views + '</div>' + (f.lv ? '<span class="vc-lvtxt">' + (f.lv === 'open' ? 'Mức Gấp + Cần xử lý' : 'Đang lọc mức: ' + LVN[f.lv][0]) + ' · <button type="button" class="lnk" data-act="viec-lv" data-id="">Bỏ lọc mức</button></span>' : '') + '</div></div>' +
      '<p class="vc-hnote">Việc quá hạn và việc Gấp chưa có hạn luôn hiện ở mọi tab. Việc Cần xử lý / Theo dõi không gắn hạn (hồ sơ thiếu, tăng ca, đi muộn…) xem ở tab Tất cả.</p>' +
      (f.who ? (function () { var p = f.who.split('|'), u = unitById(p[0]), e = u ? nvIndex(u)[p.slice(1).join('|')] : null; return '<div class="who-chip">Đang xem việc của <b>' + esc(e ? e['Họ và tên'] : p[1]) + '</b>' + (e ? ' · ' + esc(e['Mã NV']) + (isMulti() ? ' · ' + esc(shortUnit(u.name)) : '') : '') + '<button type="button" class="btn btn-sm" data-act="profile" data-u="' + esc(p[0]) + '" data-id="' + esc(p[1]) + '">Mở hồ sơ</button><button type="button" class="btn btn-sm" data-act="viec-who-off">× Xem việc của mọi người</button></div>'; })() : '') +
      '<div class="filters card card-pad vc-filters">' + searchBox('vQ', f.q, 'Tên, mã NV, nội dung…') +
      selectBox('vKind', 'Loại việc', [['', 'Tất cả loại']].concat(Object.keys(HRR.KINDS).filter(function (k) { return kinds[k]; }).map(function (k) { return [k, HRR.KINDS[k].name + ' (' + kinds[k] + ')']; })), f.kind, 220) +
      selectBox('vDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      selectBox('vSt', 'Trạng thái', [['todo', 'Chưa xử lý'], ['done', 'Đã xử lý'], ['all', 'Tất cả']], f.st) + '</div><div id="vArea"></div>';
  };
  var VIEC_HAN = [['qua', 'Quá hạn'], ['7', 'Trong 07 ngày'], ['14', 'Trong 14 ngày'], ['30', 'Trong 30 ngày'], ['sau', 'Sau 30 ngày'], ['all', 'Tất cả']];
  // quá hạn + Gấp không gắn hạn: mọi tab · có hạn: cộng dồn 0–7 / 0–14 / 0–30, hoặc > 30 · không gắn hạn (Cần xử lý, Theo dõi): chỉ Tất cả (anh chốt 07/11 10:10)
  function hanIn(a, h) {
    var d = a.days, num = typeof d === 'number';
    if (h === 'all' || (num && d < 0) || (!num && a.level === 'gap')) return true;
    if (!num) return false;
    return h === '7' ? d <= 7 : h === '14' ? d <= 14 : h === '30' ? d <= 30 : h === 'sau' ? d > 30 : false;
  }
  function viecFiltered(noHan) {
    var f = PS.viec, q = norm(f.q);
    return alertList().filter(function (a) {
      if (!noHan && !hanIn(a, f.han || '7')) return false;
      if (f.lv === 'open' ? a.level === 'nhac' : f.lv && a.level !== f.lv) return false;
      if (f.who && (a.unitId + '|' + a.id) !== f.who) return false;
      if (f.kind && a.kind !== f.kind) return false;
      if (f.dept && a.dept !== f.dept) return false;
      if (f.st === 'todo' && isDone(a)) return false; if (f.st === 'done' && !isDone(a)) return false;
      if (q && norm(a.title + ' ' + a.detail + ' ' + a.name + ' ' + a.id + ' ' + a.dept).indexOf(q) < 0) return false;
      return true;
    });
  }
  function viecGroups(list, view) {
    var rank = { gap: 0, canh: 1, nhac: 2 };
    if (view === 'nguoi') {
      var by = {}, order = [];
      list.forEach(function (a) { var k = a.id ? a.unitId + '|' + a.id : '_'; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(a); });
      order.sort(function (x, y) { var A = by[x], B = by[y]; return (x === '_') - (y === '_') || Math.min.apply(null, A.map(function (a) { return rank[a.level]; })) - Math.min.apply(null, B.map(function (a) { return rank[a.level]; })) || B.length - A.length; });
      return order.map(function (k) { var it = by[k], a0 = it[0]; return { person: k === '_' ? null : a0, t: k === '_' ? 'Việc chung của đơn vị' : a0.name, items: it }; });
    }
    if (view === 'han') {
      var N = function (d) { return typeof d === 'number'; }, G = [['Quá hạn', function (d) { return N(d) && d < 0; }], ['Trong 7 ngày', function (d) { return N(d) && d >= 0 && d <= 7; }], ['8 – 30 ngày', function (d) { return N(d) && d > 7 && d <= 30; }], ['Sau 30 ngày', function (d) { return N(d) && d > 30; }], ['Không gắn hạn', function (d) { return !N(d); }]];
      return G.map(function (g) { return { t: g[0], items: list.filter(function (a) { return g[1](a.days); }).sort(function (x, y) { return (x.days || 0) - (y.days || 0); }) }; });
    }
    return [['gap', 'Gấp'], ['canh', 'Cần xử lý'], ['nhac', 'Theo dõi']].map(function (l) { return { t: l[1], lv: l[0], items: list.filter(function (a) { return a.level === l[0]; }) }; });
  }
  BINDS.viec = function () {
    function refresh() {
      var f = PS.viec, list = viecFiltered(), lim = f.limit || 150, shown = 0;
      var html = viecGroups(list, f.view || 'lv').map(function (g) {
        if (!g.items.length || shown >= lim) return '';
        var rows = g.items.slice(0, Math.max(0, lim - shown)); shown += rows.length;
        var head;
        if (g.person) {
          var u = unitById(g.person.unitId), c = { gap: 0, canh: 0, nhac: 0 }; g.items.forEach(function (a) { c[a.level]++; });
          head = '<div class="vc-ph">' + whoHtml(g.person, u) + '<span class="vc-pc">' + ['gap', 'canh', 'nhac'].filter(function (l) { return c[l]; }).map(function (l) { return '<span class="vc-pill lv-' + l + '">' + c[l] + ' ' + HRR.LV[l].toLowerCase() + '</span>'; }).join('') + '</span></div>';
        } else head = '<div class="vc-gh' + (g.lv ? ' lv-' + g.lv : '') + '">' + (g.lv ? lvIcon(g.lv) : '') + esc(g.t) + '<span>' + g.items.length + '</span></div>';
        return '<section class="vc-g' + (g.person ? ' person' : '') + '">' + head + rows.map(function (a) { return alertRow(a, !!g.person); }).join('') + '</section>';
      }).join('');
      $('#vArea').innerHTML = list.length ? html + (list.length > lim ? '<div class="tb-foot"><button class="btn btn-sm" data-act="viec-more">Hiện thêm (còn ' + (list.length - lim) + ' việc)</button></div>' : '')
        : '<div class="card empty"><img class="dom-img" alt="Đốm"><h2>' + (PS.viec.st === 'todo' && alertList().length ? 'Không còn việc nào chưa xử lý' : 'Không có việc nào') + '</h2><p>' + (PS.viec.st === 'todo' && alertList().length ? 'Anh/chị đã xử lý hết các việc khớp bộ lọc này. Đốm sẽ nhắc khi có việc mới.' : 'Không có việc khớp bộ lọc đang chọn.') + '</p></div>';
      $$('#vArea img.dom-img').forEach(function (i) { i.src = DOM_HERO; });
    }
    REFRESH = refresh; bindFilters('viec', { vQ: 'q', vKind: 'kind', vDept: 'dept', vSt: 'st' }, refresh); refresh();
  };
  // 07/11 10:23 (anh yêu cầu): bấm tab lọc / sắp xếp / thẻ mức → giữ nguyên vị trí màn hình, chỉ phần danh sách bên dưới đổi
  function viecKeep(fn) {
    var bar = $('.vc-bar2'), off = bar ? bar.getBoundingClientRect().top : null, y = window.scrollY;
    fn(); render();
    var b2 = $('.vc-bar2'), va = $('#vArea');
    if (off === null || !b2 || !va) { window.scrollTo({ top: y, behavior: 'instant' }); return; }
    var need = Math.max(0, b2.getBoundingClientRect().top + window.scrollY - off), lack = need + window.innerHeight - document.documentElement.scrollHeight;
    if (lack > 0) { va.style.minHeight = (va.offsetHeight + lack) + 'px'; lack = need + window.innerHeight - document.documentElement.scrollHeight; if (lack > 0) va.style.minHeight = (va.offsetHeight + lack) + 'px'; } // danh sách ngắn hơn: giữ đủ chiều cao để thanh tab không nhảy
    window.scrollTo({ top: need, behavior: 'instant' });
  }
  ACTS['viec-lv'] = function (a, id) { viecKeep(function () { PS.viec.lv = PS.viec.lv === id ? '' : id; }); };
  ACTS['viec-han'] = function (a, id) { viecKeep(function () { PS.viec.han = id; PS.viec.limit = 0; }); };
  ACTS['viec-view'] = function (a, id) { viecKeep(function () { PS.viec.view = id; }); };
  ACTS['viec-more'] = function () { PS.viec.limit = (PS.viec.limit || 150) + 300; REFRESH(); };
  ACTS['viec-export'] = function () {
    var cols = [{ t: 'Mức độ', f: function (a) { return HRR.LV[a.level]; } }, { t: 'Loại cảnh báo', f: function (a) { return (HRR.KINDS[a.kind] || {}).name; } }].concat(isMulti() ? [{ t: 'Đơn vị', f: function (a) { return a.unit; } }] : []).concat([
      { t: 'Mã NV', f: function (a) { return a.id; } }, { t: 'Họ và tên', f: function (a) { return a.name; } }, { t: 'Phòng ban', f: function (a) { return a.dept; } },
      { t: 'Nội dung', f: function (a) { return a.title; } }, { t: 'Chi tiết', f: function (a) { return a.detail + (a.people ? ' Danh sách mã NV: ' + a.people.join(', ') : ''); } },
      { t: 'Hạn / ngày liên quan', f: function (a) { return a.due || ''; } }, { t: 'Còn (ngày)', f: function (a) { return a.days; } },
      { t: 'Đối chiếu từ', f: function (a) { return (a.sources || []).join(', '); } }, { t: 'Căn cứ', f: function (a) { return (HRR.KINDS[a.kind] || {}).law; } },
      { t: 'Đã xử lý', f: function (a) { return isDone(a) ? 'Đã xử lý ' + (S.done[a.key].at || '') + (S.done[a.key].note ? ' – ' + S.done[a.key].note : '') : ''; } }]);
    exportRows('Viec can xu ly', cols, viecFiltered(), 'Tính đến ' + vn(refDate()));
  };

  /* ================== NHÂN VIÊN ================== */
  function staffRows() {
    var R = refDate(), out = [];
    selUnits().forEach(function (u) {
      var mat = HR.maternitySet(u.data, R), byHd = HRR.contractsOf(u.data), byLs = HRR.lsOf(u.data), r = HR.dnum(R), al = {};
      alertList().forEach(function (a) { if (a.unitId === u.id && a.id && !isDone(a) && a.level !== 'nhac') al[a.id] = (al[a.id] || 0) + 1; });
      u.data.NV.forEach(function (e) {
        var st = HR.staffState(e, R, mat), cur = HRR.currentContract(byHd[e['Mã NV']], r), sal = HRR.salaryAt(e['Mã NV'], r, byHd, byLs);
        out.push({ u: u, e: e, st: st, cur: cur, curState: cur ? HRR.contractState(cur, r) : '', sal: sal ? sal.amount : null, al: al[e['Mã NV']] || 0 });
      });
    });
    return out;
  }
  var ST_TXT = { working: 'Đang đi làm', maternity: 'Nghỉ thai sản', left: 'Đã nghỉ việc', future: 'Chưa vào làm' };
  PAGES.nv = function () {
    if (!gather('NV').length) return pageHead('Nhân viên') + noData('hồ sơ nhân viên');
    var f = ps('nv', { q: '', dept: '', cv: '', st: 'active', hd: '' });
    var cvs = {}; gather('NV').forEach(function (x) { if (x.r['Chức vụ']) cvs[x.r['Chức vụ']] = 1; });
    return pageHead('Danh sách nhân sự', 'Bấm vào tên để mở hồ sơ đầy đủ · trạng thái tính đến ' + vn(refDate())) +
      '<div class="filters card card-pad">' + searchBox('nQ', f.q, 'Tên, mã NV, số điện thoại…') +
      selectBox('nDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      selectBox('nCv', 'Chức vụ', [['', 'Tất cả chức vụ']].concat(Object.keys(cvs).map(function (d) { return [d, d]; })), f.cv) +
      selectBox('nSt', 'Trạng thái', [['active', 'Đang làm (kể cả thai sản)'], ['working', 'Đang đi làm'], ['maternity', 'Nghỉ thai sản'], ['left', 'Đã nghỉ việc'], ['', 'Tất cả']], f.st) +
      selectBox('nHd', 'Hợp đồng hiện tại', [['', 'Tất cả'], ['tv', 'Thử việc'], ['xd', 'Xác định thời hạn'], ['kxd', 'Không xác định thời hạn'], ['none', 'Không có / đã hết hạn']], f.hd) + '</div><div id="nArea"></div>';
  };
  BINDS.nv = function () {
    if (!$('#nArea')) return;
    function refresh() {
      var f = PS.nv, q = norm(f.q);
      var rows = staffRows().filter(function (x) {
        var e = x.e;
        if (f.st === 'active' ? !(x.st === 'working' || x.st === 'maternity') : f.st && x.st !== f.st) return false;
        if (f.dept && e['Phòng ban'] !== f.dept) return false; if (f.cv && e['Chức vụ'] !== f.cv) return false;
        if (f.hd) { var t = x.cur && x.curState === 'Đang hiệu lực' ? x.cur['Loại hợp đồng'] : ''; if (f.hd === 'tv' && !HRR.isProb(t)) return false; if (f.hd === 'xd' && !HRR.isFixed(t)) return false; if (f.hd === 'kxd' && !/không xác định/i.test(t)) return false; if (f.hd === 'none' && t) return false; }
        if (q && norm(e['Mã NV'] + ' ' + e['Họ và tên'] + ' ' + e['Số điện thoại'] + ' ' + e['Email công ty']).indexOf(q) < 0) return false;
        return true;
      });
      var R = refDate();
      $('#nArea').innerHTML = table('nv', uCol().concat([
        { t: 'Mã NV', f: function (x) { return x.e['Mã NV']; }, mono: 1 },
        { t: 'Họ và tên', f: function (x) { return x.e['Họ và tên']; }, h: function (x) { return personLink(x.u, x.e['Mã NV'], x.e['Họ và tên']); } },
        { t: 'Phòng ban', f: function (x) { return x.e['Phòng ban']; } }, { t: 'Chức vụ', f: function (x) { return x.e['Chức vụ']; } },
        { t: 'Chức danh', f: function (x) { return x.e['Chức danh công việc']; } },
        { t: 'Ngày vào làm', f: function (x) { return x.e['Ngày vào làm']; } }, { t: 'Thâm niên (năm)', f: function (x) { return seniority(x.e, R); }, r: 1 },
        { t: 'Hợp đồng hiện tại', f: function (x) { return x.cur ? x.cur['Loại hợp đồng'] + (x.curState !== 'Đang hiệu lực' ? ' (' + x.curState.toLowerCase() + ')' : '') : ''; } },
        { t: 'Lương CB hiện tại', f: function (x) { return x.sal; }, r: 1 },
        { t: 'Trạng thái', f: function (x) { return ST_TXT[x.st]; }, h: function (x) { return '<span class="tag ' + (x.st === 'working' ? 'tag-ok' : x.st === 'maternity' ? 'tag-info' : 'tag-mute') + '">' + ST_TXT[x.st] + '</span>'; } },
        { t: 'Việc cần xử lý', f: function (x) { return x.al; }, h: function (x) { return x.al ? '<span class="tag tag-warn">' + x.al + '</span>' : ''; }, r: 1 }
      ]), rows, { title: 'Danh sach nhan vien' });
    }
    REFRESH = refresh; bindFilters('nv', { nQ: 'q', nDept: 'dept', nCv: 'cv', nSt: 'st', nHd: 'hd' }, refresh); refresh();
  };

  /* ---------------- Hồ sơ 1 người (ngăn kéo) ---------------- */
  var drawer = null;
  function openProfile(uid, id, tab) {
    var u = unitById(uid); if (!u) return;
    var e = nvIndex(u)[id];
    if (!e) { toast('Không tìm thấy mã ' + id + ' trong hồ sơ', 'err'); return; }
    if (drawer) drawer.remove();
    S.showSens = false;
    drawer = document.createElement('div'); drawer.className = 'drawer-bg';
    drawer.innerHTML = '<aside class="drawer" role="dialog" aria-modal="true"></aside>';
    document.body.appendChild(drawer);
    drawer.addEventListener('click', function (ev) { if (ev.target === drawer || ev.target.closest('[data-dclose]')) closeDrawer(); var t = ev.target.closest('[data-dtab]'); if (t) drawProfile(u, id, t.getAttribute('data-dtab')); if (ev.target.closest('[data-sens]')) { S.showSens = !S.showSens; drawProfile(u, id, drawer._tab); } });
    document.addEventListener('keydown', escDrawer);
    drawProfile(u, id, tab || 'info');
    log('Mở hồ sơ ' + id);
  }
  function escDrawer(e) { if (e.key === 'Escape' && drawer && !$('.modal-bg')) closeDrawer(); }
  function closeDrawer() { if (drawer) { drawer.remove(); drawer = null; } S.showSens = false; document.removeEventListener('keydown', escDrawer); }
  function kvRows(e, keys) { return keys.map(function (k) { var v = e[k[0]]; if (k[2] && !S.showSens) v = HR.maskValue(v); var need = NEED.some(function (n) { return n[0] === k[0]; }); return '<dt>' + esc(k[1] || k[0]) + '</dt><dd>' + (v === null || v === undefined || v === '' ? (need ? '<span class="miss">Còn thiếu</span>' : '<span class="faint">—</span>') : esc(isIso(v) ? vn(v) : nfmt(v))) + '</dd>'; }).join(''); }
  function drawProfile(u, id, tab) {
    var R = refDate(), r = HR.dnum(R), d = u.data, e = nvIndex(u)[id], box = $('.drawer', drawer); drawer._tab = tab;
    var mat = HR.maternitySet(d, R), st = HR.staffState(e, R, mat), byHd = HRR.contractsOf(d), byLs = HRR.lsOf(d);
    var hds = byHd[id] || [], cur = HRR.currentContract(hds, r), lss = byLs[id] || [];
    var dons = d.DON.filter(function (x) { return x['Mã NV'] === id; }).sort(function (a, b) { return cmp(b['Từ ngày'], a['Từ ngày']); });
    var als = alertList().filter(function (a) { return a.unitId === u.id && a.id === id; });
    var tabs = [['info', 'Thông tin'], ['time', 'Dòng thời gian'], ['hd', 'Hợp đồng (' + hds.length + ')'], ['luong', 'Lương'], ['phep', 'Nghỉ phép'], ['cc', 'Chấm công'], ['al', 'Cảnh báo (' + als.length + ')']];
    var h = '<div class="dr-head"><div class="avatar">' + esc(String(e['Họ và tên'] || '?').split(' ').pop().slice(0, 2)) + '</div><div style="min-width:0"><h2>' + esc(e['Họ và tên']) + '</h2><p class="muted"><span class="mono">' + esc(id) + '</span> · ' + esc(e['Chức danh công việc'] || e['Chức vụ'] || '') + ' · ' + esc(e['Phòng ban'] || '') + (isMulti() ? ' · ' + esc(u.name) : '') + ' <span class="tag ' + (st === 'working' ? 'tag-ok' : st === 'maternity' ? 'tag-info' : 'tag-mute') + '">' + ST_TXT[st] + '</span></p></div><button class="btn btn-sm" data-act="nv-edit" data-u="' + u.id + '" data-id="' + esc(id) + '">Sửa thông tin</button><button class="x-btn" data-dclose>Đóng</button></div>' +
      '<div class="dr-tabs">' + tabs.map(function (t) { return '<button class="' + (t[0] === tab ? 'on' : '') + '" data-dtab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="dr-body">';
    if (tab === 'info') {
      var miss = missingOf(e);
      h += miss.length ? '<div class="notice warn">' + ic('info') + '<div><b>Hồ sơ còn thiếu ' + miss.length + '/' + NEED.length + ' thông tin:</b> ' + esc(miss.join(', ')) + '.<div class="link-row" style="margin-top:8px"><button class="btn btn-sm btn-primary" data-act="nv-edit" data-u="' + u.id + '" data-id="' + esc(id) + '">Bổ sung ngay</button></div></div></div>' : '<div class="notice">' + ic('check') + '<div>Hồ sơ đủ ' + NEED.length + ' thông tin cơ bản (cần cho hợp đồng, BHXH, trả lương).</div></div>';
      h += '<div class="dr-sec"><h4>Thông tin cá nhân</h4><dl class="kv2">' + kvRows(e, [['Mã NV'], ['Họ và tên'], ['Giới tính'], ['Ngày sinh'], ['Dân tộc'], ['Quê quán'], ['Địa chỉ thường trú'], ['Số điện thoại'], ['Email công ty'], ['Trình độ'], ['Tình trạng hôn nhân'], ['Số người phụ thuộc']]) + '</dl></div>' +
        '<div class="dr-sec"><h4>Giấy tờ, bảo hiểm, ngân hàng <button class="btn btn-sm" data-sens style="margin-left:8px">' + (S.showSens ? 'Ẩn số' : 'Hiện số') + '</button></h4><dl class="kv2">' + kvRows(e, [['Số CCCD/Mã số thuế', 'Số CCCD / MST', 1], ['Ngày cấp CCCD'], ['Số sổ BHXH', 'Số sổ BHXH', 1], ['Ngân hàng'], ['Số tài khoản', 'Số tài khoản', 1]]) + '</dl></div>' +
        '<div class="dr-sec"><h4>Công việc</h4><dl class="kv2">' + kvRows(e, [['Phòng ban'], ['Chức vụ'], ['Chức danh công việc'], ['Tổ/Ca'], ['Ngày vào làm'], ['Trạng thái', 'Trạng thái (theo file)'], ['Ngày nghỉ việc']]) + '<dt>Thâm niên</dt><dd>' + seniority(e, R) + ' năm</dd><dt>Hợp đồng hiện tại</dt><dd>' + (cur ? esc(cur['Loại hợp đồng'] + ' · ' + HRR.contractState(cur, r) + (cur['Ngày hết hạn'] ? ' · hết hạn ' + vn(cur['Ngày hết hạn']) : '')) : '<span class="faint">—</span>') + '</dd><dt>Lương cơ bản hiện tại</dt><dd>' + (function () { var s = HRR.salaryAt(id, r, byHd, byLs); return s ? fmtInt(s.amount) + ' <span class="faint">(' + esc(s.src) + ')</span>' : '—'; })() + '</dd></dl></div>';
    } else if (tab === 'time') {
      var ev = [];
      if (e['Ngày vào làm']) ev.push([e['Ngày vào làm'], 'Vào làm', (e['Phòng ban'] || '') + ' · ' + (e['Chức danh công việc'] || ''), 'ok']);
      var GA = function (act, k) { return ' data-act="' + act + '" data-u="' + u.id + '" data-id="' + esc(id) + '" data-k="' + esc(k) + '"'; };
      hds.forEach(function (x) { ev.push([x['Ngày hiệu lực'] || x['Ngày ký'], (HRR.isProb(x['Loại hợp đồng']) ? 'Hợp đồng thử việc ' : 'Hợp đồng lao động ') + (x['Số hợp đồng'] || ''), x['Loại hợp đồng'] + (x['Ngày hết hạn'] ? ' đến ' + vn(x['Ngày hết hạn']) : '') + ' · lương ' + money(x['Mức lương theo HĐ']), 'info', GA('hd-view', x['Số hợp đồng'])]); if (x['Ngày chấm dứt']) ev.push([x['Ngày chấm dứt'], 'Chấm dứt HĐ ' + (x['Số hợp đồng'] || ''), x['Lý do chấm dứt'] || '', 'mute', GA('hd-view', x['Số hợp đồng'])]); });
      lss.forEach(function (x) { ev.push([x['Ngày hiệu lực'], 'Lương ' + money(x['Lương mới']), (x['Lý do'] || '') + (x['Lương cũ'] ? ' · từ ' + money(x['Lương cũ']) + (x['Tỷ lệ tăng (%)'] ? ' (+' + nfmt(x['Tỷ lệ tăng (%)']) + '%)' : '') : ''), 'ok', GA('ls-view', x['Ngày hiệu lực'])]); });
      dons.filter(function (x) { return x['Trạng thái'] === 'Đã duyệt'; }).forEach(function (x) { ev.push([x['Từ ngày'], x['Loại nghỉ'], x['Số ngày'] + ' ngày, đến ' + vn(x['Đến ngày']) + (x['Lý do'] ? ' · ' + x['Lý do'] : ''), 'mute', GA('don-view', x['Số đơn'] || x['Từ ngày'])]); });
      if (e['Ngày nghỉ việc']) ev.push([e['Ngày nghỉ việc'], 'Nghỉ việc', '', 'bad']);
      ev.sort(function (a, b) { return cmp(b[0], a[0]); });
      h += '<p class="faint" style="font-size:12.5px;margin:0 0 8px">Bấm vào mốc hợp đồng, lương, nghỉ phép để xem nhanh chi tiết.</p><ol class="timeline">' + ev.map(function (x) { return '<li class="tl-' + x[3] + (x[0] > R ? ' tl-future' : '') + (x[4] ? ' tl-go' : '') + '"' + (x[4] ? ' tabindex="0" role="button"' + x[4] : '') + '><span class="tl-d">' + vn(x[0]) + '</span><b>' + esc(x[1]) + (x[4] ? ' <span class="tl-ic">›</span>' : '') + '</b><span class="muted">' + esc(x[2]) + '</span></li>'; }).join('') + '</ol>';
    } else if (tab === 'hd') {
      h += cur ? '<div class="notice">' + ic('info') + '<div>Hợp đồng hiện tại: <b>' + esc(cur['Loại hợp đồng']) + '</b> (' + HRR.contractState(cur, r).toLowerCase() + ')' + (HRR.nextSign(hds, cur) ? '. Lần ký tới: <b>' + esc(HRR.nextSign(hds, cur)) + '</b>.' : '.') + '</div></div>' : '';
      h += miniTable(['Số HĐ', 'Loại', 'Ngày ký', 'Hiệu lực', 'Hết hạn', 'Lương HĐ', 'Tình trạng (theo ngày)'], hds.slice().reverse().map(function (x) { return { c: [x['Số hợp đồng'], x['Loại hợp đồng'], vn(x['Ngày ký']), vn(x['Ngày hiệu lực']), vn(x['Ngày hết hạn']) || 'Không thời hạn', money(x['Mức lương theo HĐ']), HRR.contractState(x, r)], a: 'data-act="hd-view" data-u="' + u.id + '" data-id="' + esc(id) + '" data-k="' + esc(x['Số hợp đồng']) + '" title="Xem nhanh hợp đồng"' }; }), [5]);
    } else if (tab === 'luong') {
      h += '<div class="dr-sec"><h4>Lịch sử điều chỉnh lương</h4>' + miniTable(['Hiệu lực', 'Số quyết định', 'Lương cũ', 'Lương mới', 'Tăng', 'Lý do'], lss.slice().reverse().map(function (x) { return { c: [vn(x['Ngày hiệu lực']), x['Số quyết định'] || '', money(x['Lương cũ']), money(x['Lương mới']), x['Tỷ lệ tăng (%)'] ? nfmt(x['Tỷ lệ tăng (%)']) + '%' : '', x['Lý do'] || ''], a: 'data-act="ls-view" data-u="' + u.id + '" data-id="' + esc(id) + '" data-k="' + esc(x['Ngày hiệu lực']) + '" title="Xem nhanh quyết định lương"' }; }), [2, 3, 4]) + '</div>';
      var bm = Object.keys(d.BL).sort().reverse();
      h += '<div class="dr-sec"><h4>Bảng lương các tháng</h4>' + miniTable(['Tháng', 'Lương CB', 'Công chuẩn', 'Ngày công', 'Tăng ca (giờ)', 'Tổng thu nhập', 'Thực lĩnh', 'Đối chiếu'], bm.map(function (m) { var x = d.BL[m].filter(function (y) { return y['Mã NV'] === id; })[0]; if (!x) return null; var is = HRR.payrollCheck(d, m, cfg()).byId[id] || []; return { c: [HR.ymLabel(m), money(x['Lương cơ bản']), nfmt(x['Công chuẩn']), nfmt(x['Ngày công thực tế']), nfmt((+x['Giờ tăng ca ngày thường'] || 0) + (+x['Giờ tăng ca Chủ nhật'] || 0)), money(x['Tổng thu nhập']), money(x['Thực lĩnh']), is.length ? is.map(function (i) { return i.t; }).join('; ') : 'Khớp'], a: 'data-act="bl-view" data-u="' + u.id + '" data-id="' + esc(id) + '" data-k="' + m + '" title="Xem bảng lương chi tiết tháng ' + HR.ymLabel(m) + '"' }; }).filter(Boolean), [1, 2, 3, 4, 5, 6]) + '</div>';
    } else if (tab === 'phep') {
      var q = HRR.leaveRecalc(d, R).filter(function (x) { return x.q['Mã NV'] === id; })[0];
      h += q ? '<div class="mini-kpis"><div><span>Tổng phép năm</span><b>' + nfmt(q.total) + '</b></div><div><span>Đã nghỉ (file)</span><b>' + nfmt(q.fileUsed) + '</b></div><div><span>Còn lại (file)</span><b>' + nfmt(q.fileLeft) + '</b></div><div><span>Đã nghỉ theo đơn duyệt</span><b class="' + (q.diff ? 'down' : '') + '">' + nfmt(q.calcUsed) + '</b></div></div>' : '<p class="muted">Chưa có quỹ phép của người này.</p>';
      h += '<div class="dr-sec"><h4>Đơn nghỉ</h4>' + miniTable(['Số đơn', 'Loại nghỉ', 'Từ', 'Đến', 'Số ngày', 'Lý do', 'Trạng thái'], dons.map(function (x) { return { c: [x['Số đơn'], x['Loại nghỉ'], vn(x['Từ ngày']), vn(x['Đến ngày']), nfmt(x['Số ngày']), x['Lý do'] || '', x['Trạng thái']], a: 'data-act="don-view" data-u="' + u.id + '" data-id="' + esc(id) + '" data-k="' + esc(x['Số đơn'] || x['Từ ngày']) + '" title="Xem nhanh đơn nghỉ"' }; }), [4]) + '</div>';
    } else if (tab === 'cc') {
      var dCC = ccData(u).CC; // 0.3.1: theo Tổng hợp công
      var months = Object.keys(dCC).sort().reverse();
      var sel = drawer._ccm && months.indexOf(drawer._ccm) >= 0 ? drawer._ccm : months[0];
      h += months.length ? '<div class="dr-sec"><h4>Tổng hợp theo tháng</h4>' + miniTable(['Tháng', 'Ngày công', 'Đi làm CN', 'Nghỉ có phép', 'Ốm/TS', 'KL/KP', 'Đi muộn', 'Tăng ca (giờ)'], months.map(function (m) { var s = HRR.ccSummary(dCC[m].filter(function (x) { return x['Mã NV'] === id; }), cfg())[0]; if (!s) return null; var c = s.codes; return [HR.ymLabel(m), s.work, s.sundayWork, (c.P || 0) + (c.R || 0), (c['Ô'] || 0) + (c.TS || 0), (c.KL || 0) + (c.KP || 0), s.late + ' lần / ' + s.lateMin + ' phút', s.ot]; }).filter(Boolean), [1, 2, 3, 4, 5, 7]) + '</div>' +
        '<div class="dr-sec"><h4>Chi tiết tháng <select class="input" id="drCcm" style="min-height:28px;padding:2px 8px;margin-left:6px">' + months.map(function (m) { return opt(m, HR.ymLabel(m), sel); }).join('') + '</select></h4>' + miniTable(['Ngày', 'Thứ', 'Ca', 'Vào', 'Ra', 'Giờ công', 'Muộn (phút)', 'Tăng ca', 'Ký hiệu', 'Ghi chú'], dCC[sel].filter(function (x) { return x['Mã NV'] === id; }).map(function (x) { return [vn(x['Ngày']), x['Thứ'], x['Ca'], x['Giờ vào'], x['Giờ ra'], nfmt(x['Số giờ công']), nfmt(x['Đi muộn (phút)']), nfmt(x['Giờ tăng ca']), x['Ký hiệu'], x['Ghi chú'] || '']; }), [5, 6, 7]) + '</div>' : '<p class="muted">Chưa có dữ liệu chấm công.</p>';
    } else if (tab === 'al') {
      h += als.length ? '<div class="al-list">' + als.map(alertRow).join('') + '</div>' : '<p class="muted">Không có cảnh báo nào cho người này.</p>';
    }
    box.innerHTML = h + '</div>';
    var cs = $('#drCcm', box); if (cs) cs.addEventListener('change', function () { drawer._ccm = cs.value; drawProfile(u, id, 'cc'); });
  }
  function miniTable(head, rows, right, attrs) {
    right = right || []; attrs = attrs || [];
    if (!rows.length) return '<p class="muted">Không có dữ liệu.</p>';
    return '<div class="tbl-wrap" style="max-height:none"><table class="tbl"><thead><tr>' + head.map(function (t, i) { return '<th' + (right.indexOf(i) >= 0 ? ' class="r"' : '') + '>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, ri) { var at = r && r.c ? r.a : attrs[ri], cells = r && r.c ? r.c : r; return '<tr' + (at ? ' class="tr-go" tabindex="0" ' + at : '') + '>' + cells.map(function (v, i) { return '<td' + (right.indexOf(i) >= 0 ? ' class="r"' : '') + '>' + esc(v === null || v === undefined ? '' : v) + '</td>'; }).join('') + (at ? '<td class="tr-ic">›</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>';
  }

  /* ================== HỢP ĐỒNG ================== */
  PAGES.hd = function () {
    if (!gather('HD').length) return pageHead('Hợp đồng') + noData('sổ hợp đồng');
    var f = ps('hd', { q: '', loai: '', st: '', dept: '', exp: '', latest: true });
    var loai = {}, exps = {}; gather('HD').forEach(function (x) { loai[x.r['Loại hợp đồng']] = 1; if (x.r['Ngày hết hạn']) exps[x.r['Ngày hết hạn'].slice(0, 7)] = 1; });
    var R = refDate(), em = Object.keys(exps).sort().filter(function (m) { return m >= HR.addMonths(R.slice(0, 7), -3) && m <= HR.addMonths(R.slice(0, 7), 12); });
    return pageHead('Hợp đồng', 'Tình trạng tính theo ngày ký, hiệu lực, hết hạn, chấm dứt (tại ' + vn(R) + '), không theo cột "Tình trạng" trong file') +
      '<div class="filters card card-pad">' + searchBox('hQ', f.q, 'Tên, mã NV, số HĐ…') +
      selectBox('hLoai', 'Loại hợp đồng', [['', 'Tất cả loại']].concat(Object.keys(loai).map(function (d) { return [d, d]; })), f.loai, 200) +
      selectBox('hSt', 'Tình trạng', [['', 'Tất cả'], ['Đang hiệu lực', 'Đang hiệu lực'], ['Đã hết hạn', 'Đã hết hạn'], ['Đã chấm dứt', 'Đã chấm dứt'], ['Chưa hiệu lực', 'Chưa hiệu lực']], f.st) +
      selectBox('hExp', 'Tháng hết hạn', [['', 'Tất cả']].concat(em.map(function (m) { return [m, HR.ymLabel(m)]; })), f.exp) +
      selectBox('hDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      '<label class="radio" style="align-self:flex-end;padding-bottom:8px"><input type="checkbox" id="hLatest"' + (f.latest ? ' checked' : '') + '> Chỉ HĐ mới nhất của mỗi người</label></div><div id="hArea"></div>';
  };
  BINDS.hd = function () {
    if (!$('#hArea')) return;
    function refresh() {
      var f = PS.hd, q = norm(f.q), R = refDate(), r = HR.dnum(R), rows = [];
      selUnits().forEach(function (u) {
        var by = HRR.contractsOf(u.data), nv = nvIndex(u);
        Object.keys(by).forEach(function (id) {
          var list = by[id], cur = HRR.currentContract(list, r);
          (f.latest ? (cur ? [cur] : list.slice(-1)) : list).forEach(function (h) { rows.push({ u: u, h: h, e: nv[id] || {}, st: HRR.contractState(h, r), next: h === cur ? HRR.nextSign(list, cur) : '' }); });
        });
      });
      rows = rows.filter(function (x) {
        if (f.loai && x.h['Loại hợp đồng'] !== f.loai) return false; if (f.st && x.st !== f.st) return false;
        if (f.exp && String(x.h['Ngày hết hạn'] || '').slice(0, 7) !== f.exp) return false;
        if (f.dept && (x.e['Phòng ban'] || x.h['Phòng ban']) !== f.dept) return false;
        if (q && norm(x.h['Mã NV'] + ' ' + x.h['Họ và tên'] + ' ' + x.h['Số hợp đồng']).indexOf(q) < 0) return false;
        return true;
      });
      $('#hArea').innerHTML = table('hd', uCol().concat([
        { t: 'Số HĐ', f: function (x) { return x.h['Số hợp đồng']; }, mono: 1 }, { t: 'Mã NV', f: function (x) { return x.h['Mã NV']; }, mono: 1 },
        { t: 'Họ và tên', f: function (x) { return x.h['Họ và tên'] || x.e['Họ và tên']; }, h: function (x) { return personLink(x.u, x.h['Mã NV'], x.h['Họ và tên'] || x.e['Họ và tên']); } },
        { t: 'Phòng ban', f: function (x) { return x.e['Phòng ban'] || x.h['Phòng ban']; } }, { t: 'Chức danh', f: function (x) { return x.h['Chức danh']; } },
        { t: 'Loại hợp đồng', f: function (x) { return x.h['Loại hợp đồng']; } }, { t: 'Ngày ký', f: function (x) { return x.h['Ngày ký']; } },
        { t: 'Hiệu lực', f: function (x) { return x.h['Ngày hiệu lực']; } }, { t: 'Hết hạn', f: function (x) { return x.h['Ngày hết hạn']; } },
        { t: 'Lương HĐ', f: function (x) { return x.h['Mức lương theo HĐ']; }, r: 1 },
        { t: 'Tình trạng', f: function (x) { return x.st; }, h: function (x) { var d = x.h['Ngày hết hạn'] ? HR.dnum(x.h['Ngày hết hạn']) - HR.dnum(refDate()) : null; return '<span class="tag ' + (x.st === 'Đang hiệu lực' ? (d !== null && d <= cfg().contractDays ? 'tag-warn' : 'tag-ok') : x.st === 'Đã hết hạn' ? 'tag-mute' : 'tag-mute') + '">' + x.st + (x.st === 'Đang hiệu lực' && d !== null && d <= cfg().contractDays ? ' · còn ' + d + ' ngày' : '') + '</span>'; } },
        { t: 'Lần ký tới', wrap: 1, f: function (x) { return x.next; }, h: function (x) { return x.next ? '<span class="' + (/Bắt buộc/.test(x.next) ? 'tag tag-warn' : 'faint') + '">' + esc(x.next) + '</span>' : ''; } }
      ]), rows, { title: 'So hop dong', note: 'Tình trạng tính tại ' + vn(refDate()) });
    }
    REFRESH = refresh; bindFilters('hd', { hQ: 'q', hLoai: 'loai', hSt: 'st', hExp: 'exp', hDept: 'dept', hLatest: 'latest' }, refresh); refresh();
  };

  /* ================== CHẤM CÔNG ================== */
  var CODE_CLS = { X: 'c-x', CT: 'c-x', P: 'c-p', R: 'c-p', L: 'c-l', 'Ô': 'c-o', TS: 'c-ts', KL: 'c-kl', KP: 'c-kp' };
  PAGES.cc = function () {
    var ms = monthsOf('CC'); if (!ms.length) return pageHead('Chấm công') + noData('dữ liệu chấm công');
    var f = ps('cc', { m: '', view: 'sum', q: '', dept: '', code: '' }); if (ms.indexOf(f.m) < 0) f.m = ms.filter(function (m) { return m <= refDate().slice(0, 7); }).pop() || ms[ms.length - 1];
    var rows = [], sum = []; selUnits().forEach(function (u) { (u.data.CC[f.m] || []).forEach(function (r) { rows.push(r); }); sum = sum.concat(HRR.ccSummary(u.data.CC[f.m] || [], cfgFor(u))); });
    var tot = { p: 0, w: 0, pl: 0, om: 0, kk: 0, late: 0, ot: 0 };
    sum.forEach(function (s) { tot.w += s.work; tot.pl += (s.codes.P || 0) + (s.codes.R || 0); tot.om += (s.codes['Ô'] || 0) + (s.codes.TS || 0); tot.kk += (s.codes.KL || 0) + (s.codes.KP || 0); tot.late += s.late; tot.ot += s.ot; });
    var rg = HRR.ccRange(rows);
    return pageHead('Chấm công', 'Ngày công tính theo <a href="#thietlapcc">Thiết lập chấm công</a> của từng công ty (' + esc(cfgFor(selUnits()[0]).workCodes) + (cfgFor(selUnits()[0]).sundayIsOt ? '; đi làm ngày nghỉ hằng tuần tính là tăng ca' : '') + ')' + (rg.to && rg.to < HRR.lastDayOf(f.m) ? ' · <b class="down">dữ liệu tháng này mới đến ' + vn(rg.to) + '</b>' : '')) +
      '<div class="filters card card-pad">' + selectBox('cM', 'Tháng', ms.slice().reverse().map(function (m) { return [m, 'Tháng ' + HR.ymLabel(m)]; }), f.m) + searchBox('cQ', f.q) +
      selectBox('cDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      (f.view === 'detail' ? selectBox('cCode', 'Ký hiệu', [['', 'Tất cả']].concat(['X', 'CT', 'P', 'R', 'L', 'Ô', 'TS', 'KL', 'KP'].map(function (k) { return [k, k]; })).concat([['late', 'Đi muộn'], ['ot', 'Có tăng ca']]), f.code) : '') +
      '<div class="field"><label>Cách xem</label><div class="seg">' + [['sum', 'Tổng hợp'], ['grid', 'Lưới theo ngày'], ['detail', 'Chi tiết']].map(function (v) { return '<button class="' + (f.view === v[0] ? 'on' : '') + '" data-act="cc-view" data-id="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="mini-kpis big"><div><span>Số người</span><b>' + sum.length + '</b></div><div><span>Số dòng</span><b>' + fmtInt(rows.length) + '</b></div><div><span>Ngày công</span><b>' + fmtInt(tot.w) + '</b></div><div><span>Nghỉ có phép (P, R)</span><b>' + tot.pl + '</b></div><div><span>Ốm, thai sản</span><b>' + tot.om + '</b></div><div><span>Không lương, không phép</span><b class="' + (tot.kk ? 'down' : '') + '">' + tot.kk + '</b></div><div><span>Lượt đi muộn</span><b>' + tot.late + '</b></div><div><span>Giờ tăng ca</span><b>' + fmtInt(tot.ot) + '</b></div></div><div id="cArea"></div>';
  };
  ACTS['cc-view'] = function (a, id) { PS.cc.view = id; render(); };
  BINDS.cc = function () {
    if (!$('#cArea')) return;
    function refresh() {
      var f = PS.cc, q = norm(f.q), rows = [];
      selUnits().forEach(function (u) { (u.data.CC[f.m] || []).forEach(function (r) { rows.push({ u: u, r: r }); }); });
      var keep = function (r) { return (!f.dept || r['Phòng ban'] === f.dept) && (!q || norm(r['Mã NV'] + ' ' + r['Họ và tên']).indexOf(q) >= 0); };
      var c = cfg(), W = c.otMonthMax, warn = c.otMonthWarn;
      if (f.view === 'detail') {
        var list = rows.filter(function (x) { if (!keep(x.r)) return false; if (f.code === 'late') return +x.r['Đi muộn (phút)'] > 0; if (f.code === 'ot') return +x.r['Giờ tăng ca'] > 0; return !f.code || String(x.r['Ký hiệu']).toUpperCase() === f.code; });
        $('#cArea').innerHTML = table('cc-d', uCol().concat(['Ngày', 'Thứ', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Tổ', 'Ca', 'Giờ vào', 'Giờ ra', 'Số giờ công', 'Đi muộn (phút)', 'Giờ tăng ca', 'Loại tăng ca', 'Ký hiệu', 'Ghi chú'].map(function (k) {
          return { t: k, f: function (x) { return x.r[k]; }, r: /Số giờ|muộn|Giờ tăng/.test(k) ? 1 : 0, mono: k === 'Mã NV' ? 1 : 0, h: k === 'Họ và tên' ? function (x) { return personLink(x.u, x.r['Mã NV'], x.r['Họ và tên']); } : k === 'Ký hiệu' ? function (x) { var v = String(x.r['Ký hiệu'] || ''); return '<span class="code ' + (CODE_CLS[v.toUpperCase()] || '') + '">' + esc(v) + '</span>'; } : null };
        })), list, { title: 'Cham cong chi tiet ' + HR.ymLabel(f.m) });
        return;
      }
      var byU = {}; rows.forEach(function (x) { (byU[x.u.id] = byU[x.u.id] || { u: x.u, rows: [] }).rows.push(x.r); });
      var sums = []; Object.keys(byU).forEach(function (k) { HRR.ccSummary(byU[k].rows, cfgFor(byU[k].u)).forEach(function (s) { s.u = byU[k].u; sums.push(s); }); });
      sums = sums.filter(function (s) { return (!f.dept || s.dept === f.dept) && (!q || norm(s.id + ' ' + s.name).indexOf(q) >= 0); });
      if (f.view === 'grid') {
        var y = +f.m.slice(0, 4), mo = +f.m.slice(5, 7), nd = new Date(Date.UTC(y, mo, 0)).getUTCDate(), days = [];
        for (var i = 1; i <= nd; i++) days.push(p2(i));
        var dows = days.map(function (dd) { return new Date(Date.UTC(y, mo - 1, +dd)).getUTCDay(); });
        $('#cArea').innerHTML = '<div class="legend" style="margin:0 0 10px">' + Object.keys(CODE_CLS).map(function (k) { return '<span><span class="code ' + CODE_CLS[k] + '">' + k + '</span></span>'; }).join('') + '<span class="faint">Cột tô nền: Chủ nhật</span></div>' +
          table('cc-g', uCol().concat([{ t: 'Mã NV', f: function (s) { return s.id; }, mono: 1 }, { t: 'Họ và tên', f: function (s) { return s.name; }, h: function (s) { return personLink(s.u, s.id, s.name); }, cls: 'nowrap' }]).concat(days.map(function (dd, i) {
            return { t: '<span class="' + (dows[i] === 0 ? 'sun' : '') + '">' + dd + '</span>', xt: dd, nosort: 1, f: function (s) { return s.days[dd] || ''; }, cls: 'gc' + (dows[i] === 0 ? ' sun' : ''), h: function (s) { var v = s.days[dd] || ''; return v ? '<span class="code ' + (CODE_CLS[v] || '') + '">' + esc(v) + '</span>' : ''; } };
          })).concat([{ t: 'Công', f: function (s) { return s.work; }, r: 1 }, { t: 'Tăng ca', f: function (s) { return s.ot; }, r: 1 }]), sums, { title: 'Luoi cham cong ' + HR.ymLabel(f.m), cls: 'grid-tbl', tall: 1 });
        return;
      }
      $('#cArea').innerHTML = table('cc-s', [{ t: 'Mã NV', f: function (s) { return s.id; }, mono: 1 }, { t: 'Họ và tên', f: function (s) { return s.name; }, h: function (s) { return personLink(s.u, s.id, s.name); } }, { t: 'Phòng ban', f: function (s) { return s.dept; } }, { t: 'Tổ', f: function (s) { return s.to; } },
        { t: 'Ngày công', f: function (s) { return s.work; }, r: 1, title: 'Theo Thiết lập chấm công → Ký hiệu công' }, { t: 'Đi làm CN', f: function (s) { return s.sundayWork; }, r: 1 }].concat(['P', 'R', 'L', 'Ô', 'TS', 'KL', 'KP'].map(function (k) { return { t: k, f: function (s) { return s.codes[k] || 0; }, r: 1 }; })).concat([
        { t: 'Lần đi muộn', f: function (s) { return s.late; }, r: 1, h: function (s) { return s.late >= c.lateTimes ? '<span class="tag tag-warn">' + s.late + '</span>' : String(s.late); } }, { t: 'Phút muộn', f: function (s) { return s.lateMin; }, r: 1 },
        { t: 'Giờ tăng ca', f: function (s) { return s.ot; }, r: 1, h: function (s) { return s.ot > W ? '<span class="tag tag-bad">' + s.ot + '</span>' : s.ot >= warn ? '<span class="tag tag-warn">' + s.ot + '</span>' : String(s.ot); } }]), sums, { title: 'Tong hop cham cong ' + HR.ymLabel(f.m) });
    }
    REFRESH = refresh; bindFilters('cc', { cQ: 'q', cDept: 'dept', cCode: 'code' }, refresh);
    var cm = $('#cM'); if (cm) cm.addEventListener('change', function () { PS.cc.m = cm.value; render(); });
    refresh();
  };

  /* ================== NGHỈ PHÉP ================== */
  PAGES.np = function () {
    if (!gather('DON').length && !gather('QP').length) return pageHead('Nghỉ phép') + noData('đơn nghỉ phép / quỹ phép');
    var f = ps('np', { tab: 'don', q: '', loai: '', st: '', m: '', dept: '', diff: false });
    var loai = {}, ms = {}; gather('DON').forEach(function (x) { loai[x.r['Loại nghỉ']] = 1; if (x.r['Từ ngày']) ms[x.r['Từ ngày'].slice(0, 7)] = 1; });
    return pageHead('Nghỉ phép', 'Quỹ phép được tính lại từ các đơn "Nghỉ phép năm" đã duyệt (đến ' + vn(refDate()) + ') để so với số trên file') +
      '<div class="seg" style="margin-bottom:12px"><button class="' + (f.tab === 'don' ? 'on' : '') + '" data-act="np-tab" data-id="don">Đơn nghỉ</button><button class="' + (f.tab === 'qp' ? 'on' : '') + '" data-act="np-tab" data-id="qp">Quỹ phép năm</button></div>' +
      '<div class="filters card card-pad">' + searchBox('pQ', f.q, f.tab === 'don' ? 'Tên, mã NV, số đơn…' : 'Tên, mã NV…') +
      (f.tab === 'don' ? selectBox('pLoai', 'Loại nghỉ', [['', 'Tất cả loại']].concat(Object.keys(loai).map(function (d) { return [d, d]; })), f.loai, 180) + selectBox('pSt', 'Trạng thái', [['', 'Tất cả'], ['Chờ duyệt', 'Chờ duyệt'], ['Đã duyệt', 'Đã duyệt'], ['Từ chối', 'Từ chối']], f.st) + selectBox('pM', 'Tháng nghỉ', [['', 'Tất cả']].concat(Object.keys(ms).sort().reverse().map(function (m) { return [m, HR.ymLabel(m)]; })), f.m)
        : '<label class="radio" style="align-self:flex-end;padding-bottom:8px"><input type="checkbox" id="pDiff"' + (f.diff ? ' checked' : '') + '> Chỉ người lệch hoặc sắp hết phép</label>') +
      selectBox('pDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) + '</div><div id="pArea"></div>';
  };
  ACTS['np-tab'] = function (a, id) { PS.np.tab = id; render(); };
  BINDS.np = function () {
    if (!$('#pArea')) return;
    function refresh() {
      var f = PS.np, q = norm(f.q), R = refDate(), r = HR.dnum(R);
      if (f.tab === 'don') {
        var rows = gather('DON').filter(function (x) { var d = x.r; return (!f.loai || d['Loại nghỉ'] === f.loai) && (!f.st || d['Trạng thái'] === f.st) && (!f.m || String(d['Từ ngày'] || '').slice(0, 7) === f.m) && (!f.dept || d['Phòng ban'] === f.dept) && (!q || norm(d['Mã NV'] + ' ' + d['Họ và tên'] + ' ' + d['Số đơn']).indexOf(q) >= 0); });
        $('#pArea').innerHTML = table('np-d', uCol().concat([{ t: 'Số đơn', f: function (x) { return x.r['Số đơn']; }, mono: 1 }, { t: 'Ngày tạo', f: function (x) { return x.r['Ngày tạo đơn']; } }, { t: 'Mã NV', f: function (x) { return x.r['Mã NV']; }, mono: 1 },
          { t: 'Họ và tên', f: function (x) { return x.r['Họ và tên']; }, h: function (x) { return personLink(x.u, x.r['Mã NV'], x.r['Họ và tên']); } }, { t: 'Phòng ban', f: function (x) { return x.r['Phòng ban']; } }, { t: 'Loại nghỉ', f: function (x) { return x.r['Loại nghỉ']; } },
          { t: 'Từ ngày', f: function (x) { return x.r['Từ ngày']; } }, { t: 'Đến ngày', f: function (x) { return x.r['Đến ngày']; } }, { t: 'Số ngày', f: function (x) { return x.r['Số ngày']; }, r: 1 }, { t: 'Lý do', wrap: 1, f: function (x) { return x.r['Lý do']; } }, { t: 'Người duyệt', f: function (x) { return x.r['Người duyệt']; } },
          { t: 'Trạng thái', f: function (x) { return x.r['Trạng thái']; }, h: function (x) { var s = x.r['Trạng thái'], late = s === 'Chờ duyệt' && x.r['Từ ngày'] && HR.dnum(x.r['Từ ngày']) < r; return '<span class="tag ' + (s === 'Đã duyệt' ? 'tag-ok' : s === 'Chờ duyệt' ? (late ? 'tag-bad' : 'tag-warn') : 'tag-mute') + '">' + esc(s) + (late ? ' · đã qua ngày nghỉ' : '') + '</span>'; } }, { t: 'Ngày duyệt', f: function (x) { return x.r['Ngày duyệt']; } }]), rows, { title: 'Don nghi phep' });
      } else {
        var rows2 = []; selUnits().forEach(function (u) { HRR.leaveRecalc(u.data, R).forEach(function (q2) { q2.u = u; rows2.push(q2); }); });
        rows2 = rows2.filter(function (x) { return (!f.dept || x.q['Phòng ban'] === f.dept) && (!q || norm(x.q['Mã NV'] + ' ' + x.q['Họ và tên']).indexOf(q) >= 0) && (!f.diff || Math.abs(x.diff) >= cfg().leaveDiff || x.fileLeft <= cfg().leaveLow); });
        $('#pArea').innerHTML = table('np-q', uCol().concat([{ t: 'Mã NV', f: function (x) { return x.q['Mã NV']; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.q['Họ và tên']; }, h: function (x) { return personLink(x.u, x.q['Mã NV'], x.q['Họ và tên']); } }, { t: 'Phòng ban', f: function (x) { return x.q['Phòng ban']; } },
          { t: 'Ngày vào làm', f: function (x) { return x.q['Ngày vào làm']; } }, { t: 'Thâm niên', f: function (x) { return x.q['Thâm niên (năm)']; }, r: 1 }, { t: 'Phép cơ bản', f: function (x) { return x.q['Phép cơ bản']; }, r: 1 }, { t: 'Phép thâm niên', f: function (x) { return x.q['Phép thâm niên']; }, r: 1 },
          { t: 'Tổng phép năm', f: function (x) { return x.total; }, r: 1 }, { t: 'Đã nghỉ (file)', f: function (x) { return x.fileUsed; }, r: 1 }, { t: 'Còn lại (file)', f: function (x) { return x.fileLeft; }, r: 1, h: function (x) { return x.fileLeft <= cfg().leaveLow ? '<span class="tag ' + (x.fileLeft < 0 ? 'tag-bad' : 'tag-warn') + '">' + nfmt(x.fileLeft) + '</span>' : nfmt(x.fileLeft); } },
          { t: 'Đã nghỉ theo đơn', f: function (x) { return x.calcUsed; }, r: 1 }, { t: 'Lệch', f: function (x) { return x.diff; }, r: 1, h: function (x) { return x.diff ? '<span class="tag tag-warn">' + (x.diff > 0 ? '+' : '') + nfmt(x.diff) + '</span>' : '<span class="faint">0</span>'; } }]), rows2, { title: 'Quy phep nam', note: 'Tính lại đến ' + vn(R) });
      }
    }
    REFRESH = refresh; bindFilters('np', { pQ: 'q', pLoai: 'loai', pSt: 'st', pM: 'm', pDept: 'dept', pDiff: 'diff' }, refresh); refresh();
  };

  /* ================== BẢNG LƯƠNG ================== */
  var BL_MAIN = ['Lương cơ bản', 'Phụ cấp chức vụ', 'Công chuẩn', 'Ngày công thực tế', 'Tiền tăng ca', 'Tổng thu nhập', 'Thuế TNCN', 'Thực lĩnh'];
  PAGES.bl = function () {
    var ms = monthsOf('BL'); if (!ms.length) return pageHead('Bảng lương') + noData('bảng lương');
    var f = ps('bl', { m: '', full: false, q: '', dept: '', issues: false }); if (ms.indexOf(f.m) < 0) f.m = ms.filter(function (m) { return m <= refDate().slice(0, 7); }).pop() || ms[ms.length - 1];
    var t = { n: 0, g: 0, ot: 0, ins: 0, tax: 0, net: 0 }, prev = 0, pm = HR.addMonths(f.m, -1), nIss = 0;
    selUnits().forEach(function (u) {
      (u.data.BL[f.m] || []).forEach(function (x) { t.n++; t.g += +x['Tổng thu nhập'] || 0; t.ot += +x['Tiền tăng ca'] || 0; t.ins += (+x['BHXH (8%)'] || 0) + (+x['BHYT (1,5%)'] || 0) + (+x['BHTN (1%)'] || 0) + (+x['Đoàn phí công đoàn (1%)'] || 0); t.tax += +x['Thuế TNCN'] || 0; t.net += +x['Thực lĩnh'] || 0; });
      (u.data.BL[pm] || []).forEach(function (x) { prev += +x['Tổng thu nhập'] || 0; });
      var pc = HRR.payrollCheck(ccData(u), f.m, cfgFor(u)); Object.keys(pc.byId).forEach(function (k) { if (pc.byId[k].length) nIss++; });
    });
    return pageHead('Bảng lương', 'Bảng thanh toán tiền lương, đơn vị: đồng · cột "Đối chiếu" so từng dòng với chấm công và mức lương đang hiệu lực') +
      '<div class="filters card card-pad">' + selectBox('bM', 'Tháng', ms.slice().reverse().map(function (m) { return [m, 'Tháng ' + HR.ymLabel(m)]; }), f.m) + searchBox('bQ', f.q) +
      selectBox('bDept', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(depts().map(function (d) { return [d, d]; })), f.dept) +
      '<div class="field"><label>Số cột</label><div class="seg"><button class="' + (!f.full ? 'on' : '') + '" data-act="bl-full" data-id="0">Cột chính</button><button class="' + (f.full ? 'on' : '') + '" data-act="bl-full" data-id="1">Đủ cột</button></div></div>' +
      '<label class="radio" style="align-self:flex-end;padding-bottom:8px"><input type="checkbox" id="bIss"' + (f.issues ? ' checked' : '') + '> Chỉ dòng có lệch (' + nIss + ')</label></div>' +
      '<div class="mini-kpis big"><div><span>Số người</span><b>' + t.n + '</b></div><div><span>Tổng thu nhập</span><b>' + fmtInt(t.g) + '</b></div><div><span>Tiền tăng ca</span><b>' + fmtInt(t.ot) + '</b></div><div><span>Bảo hiểm + công đoàn (NLĐ)</span><b>' + fmtInt(t.ins) + '</b></div><div><span>Thuế TNCN</span><b>' + fmtInt(t.tax) + '</b></div><div><span>Thực lĩnh</span><b>' + fmtInt(t.net) + '</b></div><div><span>So với tháng trước</span><b class="' + (prev ? (t.g >= prev ? 'up' : 'down') : '') + '">' + (prev ? fmtPct((t.g - prev) / prev * 100) : '—') + '</b></div><div><span>Dòng có lệch</span><b class="' + (nIss ? 'down' : '') + '">' + nIss + '</b></div></div><div id="bArea"></div>';
  };
  ACTS['bl-full'] = function (a, id) { PS.bl.full = id === '1'; render(); };
  BINDS.bl = function () {
    if (!$('#bArea')) return;
    function refresh() {
      var f = PS.bl, q = norm(f.q), rows = [], pm = HR.addMonths(f.m, -1);
      selUnits().forEach(function (u) {
        var pc = HRR.payrollCheck(ccData(u), f.m, cfgFor(u)), prev = {}; (u.data.BL[pm] || []).forEach(function (x) { prev[x['Mã NV']] = +x['Tổng thu nhập'] || 0; });
        (u.data.BL[f.m] || []).forEach(function (x) { rows.push({ u: u, r: x, is: pc.byId[x['Mã NV']] || [], prev: prev[x['Mã NV']] }); });
      });
      rows = rows.filter(function (x) { return (!f.dept || x.r['Phòng ban'] === f.dept) && (!q || norm(x.r['Mã NV'] + ' ' + x.r['Họ và tên']).indexOf(q) >= 0) && (!f.issues || x.is.length); });
      var keys = f.full ? (rows[0] ? Object.keys(rows[0].r).filter(function (k) { return ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh'].indexOf(k) < 0; }) : []) : BL_MAIN;
      var cols = uCol().concat([{ t: 'Mã NV', f: function (x) { return x.r['Mã NV']; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.r['Họ và tên']; }, h: function (x) { return personLink(x.u, x.r['Mã NV'], x.r['Họ và tên']); } }, { t: 'Phòng ban', f: function (x) { return x.r['Phòng ban']; } }, { t: 'Chức danh', f: function (x) { return x.r['Chức danh']; } }])
        .concat(keys.map(function (k) { return { t: k, f: function (x) { return x.r[k]; }, r: typeof (rows[0] && rows[0].r[k]) === 'number' ? 1 : 0, sens: k === 'Số tài khoản' }; }))
        .concat([{ t: 'So tháng trước', f: function (x) { return x.prev ? Math.round(((+x.r['Tổng thu nhập'] || 0) - x.prev) / x.prev * 1000) / 10 : null; }, r: 1, h: function (x) { if (!x.prev) return '<span class="faint">—</span>'; var v = ((+x.r['Tổng thu nhập'] || 0) - x.prev) / x.prev * 100; return '<span class="' + (Math.abs(v) >= 20 ? 'tag tag-warn' : '') + '">' + fmtPct(v) + '</span>'; } },
          { t: 'Đối chiếu', wrap: 1, f: function (x) { return x.is.length ? x.is.map(function (i) { return i.t; }).join('; ') : 'Khớp'; }, h: function (x) { return x.is.length ? x.is.map(function (i) { return '<div class="tag tag-warn" style="white-space:normal;margin:1px 0">' + esc(i.t) + '</div>'; }).join('') : '<span class="tag tag-ok">Khớp</span>'; } }]);
      $('#bArea').innerHTML = table('bl', cols, rows, { title: 'Bang luong ' + HR.ymLabel(f.m) });
    }
    REFRESH = refresh; bindFilters('bl', { bQ: 'q', bDept: 'dept', bIss: 'issues' }, refresh);
    var bm = $('#bM'); if (bm) bm.addEventListener('change', function () { PS.bl.m = bm.value; render(); });
    refresh();
  };

  /* ================== DANH MỤC ================== */
  PAGES.dm = function () {
    var R = refDate(), h = pageHead('Danh mục', 'Đọc từ file danh mục trong thư mục dữ liệu');
    var pb = gather('PB'), cnt = {};
    selUnits().forEach(function (u) { var mat = HR.maternitySet(u.data, R); u.data.NV.forEach(function (e) { if (HR.isActive(e, R, mat)) { var k = u.id + '|' + e['Phòng ban']; cnt[k] = (cnt[k] || 0) + 1; } }); });
    h += '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>Phòng ban</h3><p>Cột "Đang làm" tính lại từ hồ sơ tại ' + vn(R) + '; "Nhân sự hiện có" là số ghi trong file</p></div></div>' + (pb.length ? table('dm-pb', uCol().concat([{ t: 'Mã', f: function (x) { return x.r['Mã phòng ban']; }, mono: 1 }, { t: 'Tên phòng ban', f: function (x) { return x.r['Tên phòng ban']; } }, { t: 'Trưởng bộ phận', f: function (x) { return x.r['Trưởng bộ phận']; } }, { t: 'Định biên', f: function (x) { return x.r['Định biên']; }, r: 1 }, { t: 'Nhân sự hiện có (file)', f: function (x) { return x.r['Nhân sự hiện có']; }, r: 1 }, { t: 'Đang làm (tính lại)', f: function (x) { return cnt[x.u.id + '|' + x.r['Tên phòng ban']] || 0; }, r: 1, h: function (x) { var n = cnt[x.u.id + '|' + x.r['Tên phòng ban']] || 0; return typeof x.r['Định biên'] === 'number' && n > x.r['Định biên'] ? '<span class="tag tag-warn">' + n + '</span>' : String(n); } }, { t: 'Lịch làm việc', f: function (x) { return x.r['Lịch làm việc']; } }]), pb, { title: 'Phong ban', limit: 1000 }) : '<p class="muted">Chưa có danh mục phòng ban.</p>') + '</div>';
    [['CV', 'Chức vụ', ['Mã chức vụ', 'Tên chức vụ', 'Cấp bậc', 'Phụ cấp chức vụ (đồng/tháng)']], ['CA', 'Ca làm việc', ['Mã ca', 'Tên ca', 'Giờ bắt đầu', 'Giờ kết thúc', 'Nghỉ giữa ca', 'Áp dụng']], ['KH', 'Ký hiệu chấm công', ['Ký hiệu', 'Ý nghĩa', 'Công ty trả lương']]].forEach(function (t) {
      var rows = gather(t[0]);
      h += '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>' + t[1] + '</h3></div></div>' + (rows.length ? table('dm-' + t[0], uCol().concat(t[2].map(function (k) { return { t: k, f: function (x) { return x.r[k]; }, r: /Cấp|Phụ cấp/.test(k) ? 1 : 0 }; })), rows, { title: t[1], limit: 1000 }) : '<p class="muted">Chưa có danh mục này.</p>') + '</div>';
    });
    return h;
  };
  BINDS.dm = function () { REFRESH = render; };

  /* ================== XUẤT BÁO CÁO ================== */
  PAGES.xuat = function () {
    var R = refDate(), mCC = monthsOf('CC'), mBL = monthsOf('BL'), f = ps('xuat', { m: '' });
    var lastM = mBL.filter(function (m) { return m <= R.slice(0, 7); }).pop() || mBL[mBL.length - 1] || mCC[mCC.length - 1] || '';
    if (!f.m) f.m = lastM;
    var allM = {}; mCC.concat(mBL).forEach(function (m) { allM[m] = 1; });
    var items = [
      ['monthly', 'Báo cáo nhân sự tháng', 'Nhiều sheet: tổng quan (quân số theo phòng ban, biến động vào/nghỉ, quỹ lương), việc cần xử lý, tổng hợp chấm công, bảng lương + đối chiếu.'],
      ['alerts', 'Danh sách việc cần xử lý', 'Toàn bộ cảnh báo đang mở và đã xử lý, kèm căn cứ và nguồn đối chiếu.'],
      ['staff', 'Danh sách nhân viên đang làm', 'Hồ sơ đầy đủ của người đang làm (kể cả nghỉ thai sản), hợp đồng và lương hiện tại.'],
      ['contracts', 'Sổ hợp đồng (tình trạng theo ngày)', 'Toàn bộ hợp đồng, tình trạng tính tại ngày tham chiếu và gợi ý lần ký tới.'],
      ['leave', 'Quỹ phép năm (tính lại)', 'So số trên file với tổng đơn nghỉ phép đã duyệt.']
    ];
    return pageHead('Xuất báo cáo', 'File Excel tạo ngay trên máy, lưu vào thư mục Tải về của trình duyệt · số liệu tính đến ' + vn(R)) +
      '<div class="filters card card-pad">' + selectBox('xM', 'Tháng báo cáo', Object.keys(allM).sort().reverse().map(function (m) { return [m, 'Tháng ' + HR.ymLabel(m)]; }), f.m) +
      '<label class="radio" style="align-self:flex-end;padding-bottom:8px"><input type="checkbox" id="xMask"' + (S.settings.maskExport ? ' checked' : '') + '> Che số CCCD, sổ BHXH, tài khoản khi xuất (chỉ hiện 3 số cuối)</label></div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">' + items.map(function (it) { return '<div class="card card-pad xcard"><h3>' + it[1] + '</h3><p class="muted">' + it[2] + '</p><button class="btn btn-primary" data-act="xuat" data-id="' + it[0] + '">' + ic('xuat') + 'Tải file Excel</button></div>'; }).join('') + '</div>' +
      '<p class="faint" style="margin-top:14px">Mỗi bảng ở các trang Nhân viên, Hợp đồng, Chấm công, Nghỉ phép, Bảng lương đều có nút "Xuất Excel" để xuất đúng phần đang lọc.</p>';
  };
  BINDS.xuat = function () {
    var xm = $('#xM'); if (xm) xm.addEventListener('change', function () { PS.xuat.m = xm.value; });
    var mk = $('#xMask'); if (mk) mk.addEventListener('change', function () { S.settings.maskExport = mk.checked; saveSettings(); });
  };
  function sheetFrom(name, cols, list, title, note) { return { name: name, title: title, note: note, cols: cols.map(function (c) { return { t: c.xt || c.t }; }), rows: list.map(function (r) { return cols.map(function (c) { return exportValue(c, r); }); }) }; }
  ACTS.xuat = function (a, id) {
    var R = refDate(), r = HR.dnum(R), us = selUnits(), M = PS.xuat.m, note = 'Tính đến ' + vn(R) + (us.length > 1 ? ' · ' + us.length + ' đơn vị' : ' · ' + us[0].name);
    var U = isMulti() ? [{ t: 'Đơn vị', f: function (x) { return x.u.name; } }] : [];
    var staffCols = U.concat(['Mã NV', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Số CCCD/Mã số thuế', 'Ngày cấp CCCD', 'Dân tộc', 'Quê quán', 'Địa chỉ thường trú', 'Số điện thoại', 'Email công ty', 'Phòng ban', 'Chức vụ', 'Chức danh công việc', 'Tổ/Ca', 'Ngày vào làm', 'Trình độ', 'Tình trạng hôn nhân', 'Số người phụ thuộc', 'Số sổ BHXH', 'Ngân hàng', 'Số tài khoản'].map(function (k) { return { t: k, f: function (x) { return x.e[k]; }, sens: /CCCD\/|sổ BHXH|tài khoản/.test(k) }; }))
      .concat([{ t: 'Trạng thái (tại ngày tham chiếu)', f: function (x) { return ST_TXT[x.st]; } }, { t: 'Thâm niên (năm)', f: function (x) { return seniority(x.e, R); } }, { t: 'Hợp đồng hiện tại', f: function (x) { return x.cur ? x.cur['Loại hợp đồng'] : ''; } }, { t: 'Hết hạn HĐ', f: function (x) { return x.cur ? x.cur['Ngày hết hạn'] : ''; } }, { t: 'Lương CB hiện tại', f: function (x) { return x.sal; } }]);
    var alertSheet = function () { var list = alertList(); return sheetFrom('Viec can xu ly', [{ t: 'Mức độ', f: function (a) { return HRR.LV[a.level]; } }, { t: 'Loại', f: function (a) { return (HRR.KINDS[a.kind] || {}).name; } }].concat(isMulti() ? [{ t: 'Đơn vị', f: function (a) { return a.unit; } }] : []).concat([{ t: 'Mã NV', f: function (a) { return a.id; } }, { t: 'Họ và tên', f: function (a) { return a.name; } }, { t: 'Phòng ban', f: function (a) { return a.dept; } }, { t: 'Nội dung', f: function (a) { return a.title; } }, { t: 'Chi tiết', f: function (a) { return a.detail + (a.people ? ' Mã NV: ' + a.people.join(', ') : ''); } }, { t: 'Hạn', f: function (a) { return a.due; } }, { t: 'Còn (ngày)', f: function (a) { return a.days; } }, { t: 'Căn cứ', f: function (a) { return (HRR.KINDS[a.kind] || {}).law; } }, { t: 'Đã xử lý', f: function (a) { return isDone(a) ? (S.done[a.key].at + ' ' + (S.done[a.key].note || '')).trim() : ''; } }]), list, 'VIỆC CẦN XỬ LÝ', note); };
    if (id === 'alerts') return saveXlsx([alertSheet()], fileName('Viec can xu ly'));
    if (id === 'staff') { var sr = staffRows().filter(function (x) { return x.st === 'working' || x.st === 'maternity'; }); return saveXlsx([sheetFrom('Nhan vien dang lam', staffCols, sr, 'DANH SÁCH NHÂN VIÊN ĐANG LÀM', note)], fileName('Nhan vien dang lam')); }
    if (id === 'contracts') {
      var rows = []; us.forEach(function (u) { var by = HRR.contractsOf(u.data); Object.keys(by).forEach(function (k) { var cur = HRR.currentContract(by[k], r); by[k].forEach(function (h) { rows.push({ u: u, h: h, st: HRR.contractState(h, r), next: h === cur ? HRR.nextSign(by[k], cur) : '' }); }); }); });
      return saveXlsx([sheetFrom('So hop dong', U.concat(['Số hợp đồng', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Loại hợp đồng', 'Ngày ký', 'Ngày hiệu lực', 'Ngày hết hạn', 'Mức lương theo HĐ', 'Phụ cấp chức vụ', 'Ngày chấm dứt', 'Lý do chấm dứt'].map(function (k) { return { t: k, f: function (x) { return x.h[k]; } }; })).concat([{ t: 'Tình trạng (theo ngày)', f: function (x) { return x.st; } }, { t: 'Lần ký tới', f: function (x) { return x.next; } }]), rows, 'SỔ HỢP ĐỒNG', note)], fileName('So hop dong'));
    }
    if (id === 'leave') { var lr = []; us.forEach(function (u) { HRR.leaveRecalc(u.data, R).forEach(function (q) { q.u = u; lr.push(q); }); }); return saveXlsx([sheetFrom('Quy phep', U.concat([{ t: 'Mã NV', f: function (x) { return x.q['Mã NV']; } }, { t: 'Họ và tên', f: function (x) { return x.q['Họ và tên']; } }, { t: 'Phòng ban', f: function (x) { return x.q['Phòng ban']; } }, { t: 'Tổng phép năm', f: function (x) { return x.total; } }, { t: 'Đã nghỉ (file)', f: function (x) { return x.fileUsed; } }, { t: 'Còn lại (file)', f: function (x) { return x.fileLeft; } }, { t: 'Đã nghỉ theo đơn duyệt', f: function (x) { return x.calcUsed; } }, { t: 'Còn lại theo đơn', f: function (x) { return x.calcLeft; } }, { t: 'Lệch', f: function (x) { return x.diff; } }]), lr, 'QUỸ PHÉP NĂM (TÍNH LẠI)', note)], fileName('Quy phep nam')); }
    if (id === 'monthly') {
      if (!M) { toast('Chưa có tháng nào để báo cáo', 'err'); return; }
      var RM = HRR.lastDayOf(M) < R ? HRR.lastDayOf(M) : R; // số liệu quân số tính đến cuối tháng báo cáo (hoặc ngày tham chiếu nếu sớm hơn)
      var d = HR.dashboard(us.map(function (u) { return { name: u.name, data: ccData(u) }; }), { ref: RM, month: M, contractDays: cfg().contractDays });
      note = 'Quân số tính đến ' + vn(RM) + ' · cảnh báo tính đến ' + vn(R) + (us.length > 1 ? ' · ' + us.length + ' đơn vị' : ' · ' + us[0].name);
      var ov = { name: 'Tong quan', title: 'BÁO CÁO NHÂN SỰ THÁNG ' + HR.ymLabel(M), note: note, cols: [{ t: 'Chỉ tiêu' }, { t: 'Giá trị' }, { t: 'Ghi chú' }], rows: [
        ['Nhân viên đang làm (đến ' + vn(RM) + ')', d.staff.active, d.staff.working + ' đang đi làm, ' + d.staff.maternity + ' nghỉ thai sản'],
        ['Vào làm trong tháng ' + HR.ymLabel(d.moves.month), d.moves.joined.length, d.moves.joined.map(function (x) { return x.e['Họ và tên']; }).join(', ')],
        ['Nghỉ việc trong tháng ' + HR.ymLabel(d.moves.month), d.moves.left.length, d.moves.left.map(function (x) { return x.e['Họ và tên']; }).join(', ')],
        ['Tổng thu nhập tháng ' + HR.ymLabel(d.month || M), d.payroll ? Math.round(d.payroll.gross) : null, d.prevPayroll && d.payroll ? 'So với tháng trước: ' + fmtPct((d.payroll.gross - d.prevPayroll.gross) / d.prevPayroll.gross * 100) : ''],
        ['Thực lĩnh', d.payroll ? Math.round(d.payroll.net) : null, ''],
        ['HĐ sắp hết hạn trong ' + cfg().contractDays + ' ngày', d.contracts.soon.length, ''], ['HĐ đã hết hạn chưa ký mới', d.contracts.overdue.length, ''],
        ['Đơn nghỉ chờ duyệt', d.leaves.pending.length, d.leaves.overdue + ' đơn đã qua ngày nghỉ'],
        ['Việc gấp chưa xử lý', alertList().filter(function (a) { return a.level === 'gap' && !isDone(a); }).length, 'Chi tiết ở sheet Việc cần xử lý'], [''], ['QUÂN SỐ THEO PHÒNG BAN', null, null]].concat(d.depts.map(function (x) { return [(isMulti() ? x.unit + ' · ' : '') + x.name, x.working + x.maternity, x.plan !== null ? 'Định biên ' + x.plan + (x.working + x.maternity > x.plan ? ' – vượt ' + (x.working + x.maternity - x.plan) : '') + (x.maternity ? '; ' + x.maternity + ' nghỉ thai sản' : '') : ''];
      })) };
      var sheets = [ov, alertSheet()];
      var ccRows = []; us.forEach(function (u) { if (ccData(u).CC[M]) HRR.ccSummary(ccData(u).CC[M], cfgFor(u)).forEach(function (s) { s.u = u; ccRows.push(s); }); });
      if (ccRows.length) sheets.push(sheetFrom('Cham cong ' + M, U.concat([{ t: 'Mã NV', f: function (s) { return s.id; } }, { t: 'Họ và tên', f: function (s) { return s.name; } }, { t: 'Phòng ban', f: function (s) { return s.dept; } }, { t: 'Ngày công', f: function (s) { return s.work; } }, { t: 'Đi làm CN', f: function (s) { return s.sundayWork; } }]).concat(['P', 'R', 'L', 'Ô', 'TS', 'KL', 'KP'].map(function (k) { return { t: k, f: function (s) { return s.codes[k] || 0; } }; })).concat([{ t: 'Lần đi muộn', f: function (s) { return s.late; } }, { t: 'Phút muộn', f: function (s) { return s.lateMin; } }, { t: 'Giờ tăng ca', f: function (s) { return s.ot; } }]), ccRows, 'TỔNG HỢP CHẤM CÔNG THÁNG ' + HR.ymLabel(M), note));
      var blRows = []; us.forEach(function (u) { var pc = HRR.payrollCheck(ccData(u), M, cfgFor(u)); (u.data.BL[M] || []).forEach(function (x) { blRows.push({ u: u, r: x, is: pc.byId[x['Mã NV']] || [] }); }); });
      if (blRows.length) { var bk = Object.keys(blRows[0].r); sheets.push(sheetFrom('Bang luong ' + M, U.concat(bk.map(function (k) { return { t: k, f: function (x) { return x.r[k]; }, sens: k === 'Số tài khoản' }; })).concat([{ t: 'Đối chiếu', wrap: 1, f: function (x) { return x.is.length ? x.is.map(function (i) { return i.t; }).join('; ') : 'Khớp'; } }]), blRows, 'BẢNG LƯƠNG THÁNG ' + HR.ymLabel(M) + ' (KÈM ĐỐI CHIẾU)', note)); }
      return saveXlsx(sheets, fileName('Bao cao nhan su thang ' + HR.ymLabel(M).replace('/', '-')));
    }
  };

  /* ================== NẠP FILE THÁNG MỚI ================== */
  var IMP = null;
  function importCardHtml() {
    if (!S.units.length) return '';
    return '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>Nạp file tháng mới</h3><p>Chấm công, bảng lương tháng mới (hoặc sổ hợp đồng, đơn nghỉ bản mới). Phần mềm kiểm tra số dòng, mã NV khớp hồ sơ, trùng tháng, ký hiệu, ngày nghỉ có đơn… rồi mới cho nạp.</p></div></div>' +
      '<div class="filters" style="padding:0;border:none;background:none;box-shadow:none">' + selectBox('impU', 'Nạp vào đơn vị', S.units.map(function (u) { return [u.id, u.name]; }), (IMP && IMP.uid) || (S.settings.unit !== 'all' ? S.settings.unit : S.units[0].id), 260) +
      '<div class="field"><label>&nbsp;</label><button class="btn btn-primary" data-act="imp-pick">' + ic('files') + 'Chọn file Excel…</button></div></div>' +
      '<input type="file" id="impFile" accept=".xlsx,.xlsm,.xls" hidden><div id="impArea">' + (IMP ? importResultHtml() : '') + '</div></div>';
  }
  ACTS['imp-pick'] = function () { $('#impFile').value = ''; $('#impFile').click(); };
  function bindImport() {
    var fi = $('#impFile'); if (!fi) return;
    fi.addEventListener('change', function () {
      var f = fi.files[0]; if (!f) return;
      var uid = $('#impU').value, u = unitById(uid);
      var b = busy('Đang kiểm tra file ' + f.name + '…');
      f.arrayBuffer().then(function (buf) {
        var wb = XR.open(new Uint8Array(buf), f.name), sheets = [];
        wb.sheetNames.forEach(function (sn) { var s = HR.parseSheet(wb.getRows(sn), sn, f.name); if (s.type) sheets.push(s); });
        b.done();
        if (!sheets.length) { IMP = null; toast('File "' + f.name + '" không có bảng nào nhận ra được', 'err', 'Cần có dòng tiêu đề với các cột như Mã NV, Ngày, Ký hiệu (chấm công) hoặc Mã NV, Tổng thu nhập, Thực lĩnh (bảng lương).'); render(); return; }
        IMP = { uid: uid, file: f, buf: buf, name: f.name, items: sheets.map(function (s) { return { s: s, chk: HRR.checkImport(u, s, cfgFor(u)) }; }) };
        log('Kiểm tra file nạp mới ' + f.name + ' cho đơn vị ' + u.name + ': ' + IMP.items.map(function (it) { return HR.TYPE[it.s.type].name + (it.s.month ? ' ' + it.s.month : '') + ' – ' + it.s.count + ' dòng, ' + it.chk.match + ' mã NV khớp, ' + it.chk.nomatch.length + ' không khớp, ' + it.chk.errors.length + ' lỗi, ' + it.chk.warns.length + ' lưu ý'; }).join('; '));
        $('#impArea').innerHTML = importResultHtml();
      }).catch(function (e) { b.done(); showErr('Chưa đọc được file ' + f.name, e, 'File hỏng, đang mở trong Excel, hoặc không phải file Excel.'); });
    });
    var iu = $('#impU'); if (iu) iu.addEventListener('change', function () { IMP = null; $('#impArea').innerHTML = ''; });
  }
  function importResultHtml() {
    var u = unitById(IMP.uid), anyErr = IMP.items.some(function (it) { return it.chk.errors.length; });
    var dest = u.source === 'folder' ? 'chép file vào thư mục "' + u.folder + '" rồi quét lại' : 'lưu vào phần mềm (đơn vị này không gắn thư mục ghi nhớ nên file không được chép vào thư mục)';
    return '<div class="imp-box"><div class="imp-file">' + ic('files', 18) + '<b>' + esc(IMP.name) + '</b><span class="muted">' + (IMP.file.size / 1024).toFixed(0) + ' KB</span></div>' +
      IMP.items.map(function (it) {
        var s = it.s, c = it.chk;
        return '<div class="imp-item"><h4>' + HR.TYPE[s.type].name + (s.month ? ' tháng ' + HR.ymLabel(s.month) : '') + ' <span class="faint">· sheet "' + esc(s.sheet) + '", tiêu đề ở dòng ' + s.headerRow + '</span></h4>' +
          c.info.map(function (t) { return '<div class="chk ok">✓ ' + esc(t) + '</div>'; }).join('') + c.errors.map(function (t) { return '<div class="chk bad">✕ ' + esc(t) + '</div>'; }).join('') + c.warns.map(function (t) { return '<div class="chk warn">! ' + esc(t) + '</div>'; }).join('') +
          (!c.errors.length && !c.warns.length ? '<div class="chk ok">✓ Không phát hiện lỗi</div>' : '') + '</div>';
      }).join('') +
      '<div class="imp-act">' + (anyErr ? '<span class="down">Có lỗi phải sửa trong file trước khi nạp.</span>' : '<span class="muted">Khi bấm nạp: ' + esc(dest) + '. File Excel đang có không bị sửa.</span>') +
      '<button class="btn" data-act="imp-cancel">Hủy</button><button class="btn btn-primary" data-act="imp-go"' + (anyErr ? ' disabled' : '') + '>Nạp vào "' + esc(u.name) + '"</button></div></div>';
  }
  ACTS['imp-cancel'] = function () { IMP = null; $('#impArea').innerHTML = ''; };
  var SUBDIR = { CC: /cham.?cong/, BL: /luong/, DON: /nghi.?phep/, QP: /nghi.?phep/, HD: /hop.?dong/, LS: /hop.?dong/, NV: /ho.?so/, PB: /ho.?so/ };
  ACTS['imp-go'] = function () {
    if (!IMP) return;
    var u = unitById(IMP.uid), it = IMP;
    function inApp() {
      it.items.forEach(function (x) { var s = x.s; if (HR.TYPE[s.type].monthly) u.data[s.type][s.month] = s.rows; else u.data[s.type] = s.rows; var keys = Object.keys(u.data[s.type]); if (HR.TYPE[s.type].monthly) { var o = {}; keys.sort().forEach(function (k) { o[k] = u.data[s.type][k]; }); u.data[s.type] = o; } u.report.push({ path: '(nạp ' + nowVn().slice(0, 10) + ') ' + it.name, sheet: s.sheet, type: s.type, month: s.month, headerRow: s.headerRow, count: s.count, skipped: s.skipped, missing: s.missing, used: true, note: 'Nạp trong phần mềm' }); });
      u.ver = (u.ver || 0) + 1; u.scannedAt = nowVn(); saveUnits();
      log('Nạp file ' + it.name + ' vào đơn vị ' + u.name + ' (lưu trong phần mềm, không chép vào thư mục)');
      toast('Đã nạp "' + it.name + '"', 'ok', 'Lưu trong phần mềm. Số liệu, cảnh báo đã cập nhật.'); IMP = null; render();
    }
    if (u.source !== 'folder' || !u.handle) return inApp();
    var h = u.handle;
    (h.queryPermission ? h.queryPermission({ mode: 'readwrite' }) : Promise.resolve('denied')).then(function (p) { return p === 'granted' ? p : h.requestPermission({ mode: 'readwrite' }); }).then(function (p) {
      if (p !== 'granted') { toast('Chưa được cấp quyền ghi vào thư mục', 'err', 'Phần mềm cần quyền ghi để chép file mới vào thư mục "' + u.folder + '". Bấm lại "Nạp" và chọn Cho phép, hoặc file sẽ chỉ được lưu trong phần mềm.'); return; }
      var re = SUBDIR[it.items[0].s.type];
      var findDir = function () { var iter = h.values(), found = null; function step() { return iter.next().then(function (r) { if (r.done) return found; var x = r.value; if (!found && x.kind === 'directory' && re && re.test(HR.stripAcc(x.name).toLowerCase().replace(/[\s-]/g, '_'))) found = x; return step(); }); } return step(); };
      return findDir().then(function (dir) {
        dir = dir || h;
        var name = it.name, base = name.replace(/(\.[^.]+)$/, ''), ext = (/(\.[^.]+)$/.exec(name) || ['', '.xlsx'])[1], n = 0;
        function freeName() { var nm = n ? base + ' (' + n + ')' + ext : name; return dir.getFileHandle(nm).then(function () { n++; return freeName(); }, function () { return nm; }); }
        return freeName().then(function (nm) {
          return dir.getFileHandle(nm, { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) { return w.write(it.buf).then(function () { return w.close(); }); }).then(function () {
            var where = (dir === h ? '' : dir.name + '/') + nm;
            log('Nạp file ' + it.name + ': ' + it.items.map(function (x) { return x.s.count + ' dòng, ' + x.chk.match + ' mã NV khớp, ' + x.chk.nomatch.length + ' không khớp'; }).join('; ') + ' → đã chép vào ' + u.folder + '/' + where);
            toast('Đã chép file vào ' + u.folder + '/' + where, 'ok', 'Đang quét lại thư mục…'); IMP = null;
            return walkHandle(h).then(function (l) { return readEntries(l, 'Đang quét lại "' + u.name + '"…'); }).then(function (m) { applyResult(m, { source: 'folder', folder: u.folder, handle: h }, u.id); render(); });
          });
        });
      });
    }).catch(function (e) { showErr('Chưa chép được file vào thư mục', e, 'Kiểm tra file cùng tên có đang mở trong Excel không, rồi thử lại.'); });
  };

  /* ================== CÀI ĐẶT: NGƯỠNG, CÁCH TÍNH CÔNG, BẬT/TẮT CẢNH BÁO ================== */
  function settingsRulesHtml() {
    var c = cfg();
    function n(id, label, unit, help) { return '<dt><label for="r_' + id + '">' + label + '</label></dt><dd><input class="input rnum" id="r_' + id + '" data-rk="' + id + '" type="number" min="0" step="any" value="' + esc(c[id]) + '"> ' + (unit || '') + (help ? '<div class="faint" style="font-size:12px">' + help + '</div>' : '') + '</dd>'; }
    function t(id, label, help) { return '<dt><label for="r_' + id + '">' + label + '</label></dt><dd><input class="input rtxt" id="r_' + id + '" data-rk="' + id + '" value="' + esc(c[id]) + '">' + (help ? '<div class="faint" style="font-size:12px">' + help + '</div>' : '') + '</dd>'; }
    return '<div class="set-grid" style="margin-top:16px">' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Ngưỡng hợp đồng, thử việc</h3><p>BLLĐ 2019 Điều 20, 25, 26</p></div></div><dl class="kv kv-set">' +
      n('contractDays', 'HĐ sắp hết hạn trong', 'ngày') + n('probManager', 'Thử việc – quản lý DN', 'ngày') + n('probCollege', 'Thử việc – trình độ CĐ trở lên', 'ngày') + n('probMid', 'Thử việc – trung cấp, CNKT', 'ngày') + n('probOther', 'Thử việc – công việc khác', 'ngày làm việc') +
      t('managerTitles', 'Chức vụ tính là quản lý DN', 'Cách nhau dấu phẩy, đúng như cột Chức vụ') + n('probMinPct', 'Lương thử việc tối thiểu', '% lương chính thức') + n('lookbackDays', 'Xét thử việc ký trong', 'ngày gần đây') + '</dl></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Tăng ca, phép, thai sản</h3><p>BLLĐ 2019 Điều 107, 113, 114, 139; NĐ 145/2020</p></div></div><dl class="kv kv-set">' +
      n('otMonthWarn', 'Nhắc khi tăng ca tháng từ', 'giờ') + n('otMonthMax', 'Trần tăng ca tháng', 'giờ') +
      '<dt><label for="r_otYearMax">Trần tăng ca năm</label></dt><dd><select class="input" id="r_otYearMax" data-rk="otYearMax">' + opt(200, '200 giờ (thông thường)', c.otYearMax) + opt(300, '300 giờ (ngành/công việc theo Điều 61 NĐ 145/2020)', c.otYearMax) + '</select><div class="faint" style="font-size:12px">Doanh nghiệp tự xác định có thuộc diện 300 giờ hay không.</div></dd>' +
      n('otDayMax', 'Tăng ca tối đa 1 ngày thường', 'giờ', '50% của 8 giờ làm bình thường') + n('leavePendingSoon', 'Đơn chờ duyệt: gấp khi còn', 'ngày') + n('leaveLow', 'Nhắc khi còn phép ≤', 'ngày') + n('leaveDiff', 'Quỹ phép lệch đơn từ', 'ngày') + n('maternityDays', 'Nhắc thai sản quay lại trước', 'ngày') +
      n('refWage', 'Mức tham chiếu đóng BHXH', 'đồng/tháng', 'Dùng nhắc BHXH với người làm bán thời gian (Luật BHXH 2024). Mặc định 2.530.000 – kiểm tra lại mỗi khi Nhà nước điều chỉnh') + '</dl></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Đối chiếu công – lương</h3><p>Ký hiệu công, ca làm, đi muộn, làm thêm giờ, lễ tết: đặt riêng từng công ty ở <b>Chấm công → Thiết lập chấm công</b> (từ bản 0.3.1).</p></div><button class="btn btn-sm" data-go="thietlapcc">Mở Thiết lập chấm công</button></div><dl class="kv kv-set">' +
      n('payDiffDays', 'Báo lệch ngày công từ', 'ngày') + n('payDiffOt', 'Báo lệch giờ tăng ca từ', 'giờ') + '</dl></div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Lưu trữ hồ sơ người đã nghỉ</h3><p>Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15</p></div></div><dl class="kv kv-set">' + n('retentionMonths', 'Thời hạn lưu hồ sơ', 'tháng sau ngày nghỉ', '0 = chưa đặt. Hồ sơ BHXH, thuế, kế toán có thời hạn lưu riêng theo luật chuyên ngành – xác định với bộ phận pháp chế/kế toán trước khi đặt.') + '</dl></div>' +
      '<div class="card card-pad" style="grid-column:1/-1"><div class="card-head"><div><h3>Bật / tắt từng loại cảnh báo</h3><p>Tắt những loại không áp dụng cho đơn vị. Có thể bật lại bất cứ lúc nào.</p></div><button class="btn btn-sm" data-act="rules-reset">Khôi phục mặc định</button></div><div class="kind-grid">' +
      Object.keys(HRR.KINDS).map(function (k) { var K = HRR.KINDS[k]; return '<label class="radio"><input type="checkbox" data-kind="' + k + '"' + (c.off && c.off[k] ? '' : ' checked') + '> ' + esc(K.name) + (K.law ? ' <span class="faint" style="font-size:12px">· ' + esc(K.law) + '</span>' : '') + '</label>'; }).join('') + '</div></div></div>';
  }
  function bindRules() {
    $$('[data-rk]').forEach(function (el) {
      el.addEventListener('change', function () {
        var k = el.getAttribute('data-rk'), c = cfg(), v;
        if (el.type === 'checkbox') v = el.checked; else if (el.classList.contains('rtxt')) v = el.value; else { v = +el.value; if (isNaN(v) || v < 0) { el.value = c[k]; toast('Giá trị chưa đúng', 'err'); return; } }
        c[k] = v; saveSettings(); log('Đổi cài đặt ' + k + ' = ' + v); toast('Đã lưu', 'ok', 'Cảnh báo, số liệu tính lại theo cài đặt mới.'); renderNav();
      });
    });
    $$('[data-kind]').forEach(function (el) { el.addEventListener('change', function () { var c = cfg(); c.off = c.off || {}; c.off[el.getAttribute('data-kind')] = !el.checked; saveSettings(); log('Bật/tắt cảnh báo ' + el.getAttribute('data-kind') + ': ' + (el.checked ? 'bật' : 'tắt')); renderNav(); }); });
  }
  ACTS['rules-reset'] = function () { S.settings.cfg = Object.assign({}, HRR.DEF, { off: {} }); saveSettings(); log('Khôi phục cài đặt ngưỡng mặc định'); toast('Đã khôi phục mặc định', 'ok'); render(); };

  /* ================== HƯỚNG DẪN · VIDEO · GÓP Ý ================== */
  var DEMO_VIDEO = '', TOOL_SLUG = 'quan-ly-nhan-su';
  ACTS.guide = function () {
    var steps = [
      ['Nạp dữ liệu', ['Chọn <b>thư mục dữ liệu</b> (Chrome/Edge ghi nhớ thư mục, lần sau chỉ cần <b>Quét lại thư mục</b>), hoặc chọn các file Excel, hoặc kéo thả. Chưa có dữ liệu thì bấm <b>Dùng dữ liệu mẫu</b>.', 'Phần mềm nhận ra file theo <b>tên cột</b>, tự tìm dòng tiêu đề, bỏ dòng tổng cộng, chữ ký. Trang <b>Nhập dữ liệu</b> cho biết đã đọc được bảng nào, thiếu cột nào.', 'Nhiều công ty/chi nhánh: <b>Thêm đơn vị</b>, mỗi đơn vị một thư mục; ô Đơn vị ở thanh trên để chọn hoặc xem gộp.']],
      ['Chọn ngày tham chiếu', ['Mọi số liệu "sắp hết hạn", "đang làm", "đã quá hạn" tính theo ô <b>Tính đến</b> ở thanh trên. Mặc định là hôm nay; xem lại dữ liệu cũ thì chọn ngày cố định.']],
      ['Xử lý việc cần làm', ['Trang <b>Việc cần xử lý</b> gom các cảnh báo đối chiếu từ nhiều file: hợp đồng, thử việc, tăng ca, phép, thai sản, lệch công – lương… kèm căn cứ pháp lý.', 'Bấm tên người để mở hồ sơ; xử lý xong bấm <b>Đã xử lý</b> (có thể ghi chú).', 'Ngưỡng và cách tính công chỉnh trong <b>Cài đặt</b> cho đúng quy chế đơn vị.']],
      ['Tra cứu, nạp tháng mới, xuất báo cáo', ['Các trang Nhân viên, Hợp đồng, Chấm công, Nghỉ phép, Bảng lương: lọc, sắp xếp (bấm tiêu đề cột), <b>Xuất Excel</b> phần đang lọc.', 'Có file chấm công/bảng lương tháng mới: <b>Nhập dữ liệu → Nạp file tháng mới</b>, phần mềm kiểm tra trước rồi mới chép vào thư mục.', '<b>Xuất báo cáo</b>: báo cáo nhân sự tháng nhiều sheet để gửi lãnh đạo.']]
    ];
    modal('Hướng dẫn sử dụng', 'Phần mềm quản lý nhân sự · xử lý ngay trên máy, không gửi dữ liệu đi đâu', '<ol class="guide-steps">' + steps.map(function (s, i) { return '<li><span class="gn">' + (i + 1) + '</span><div><h4>' + s[0] + '</h4><ul>' + s[1].map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div></li>'; }).join('') + '</ol><p class="faint">Nếu gặp lỗi: Cài đặt → Nhật ký → Tải file nhật ký và gửi cho người hỗ trợ (số CCCD, tài khoản đã được che).</p>', true);
  };
  ACTS.video = function () {
    modal('Video demo', 'Phần mềm quản lý nhân sự', DEMO_VIDEO ? '<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(DEMO_VIDEO) + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video demo"></iframe></div>' : '<div class="empty" style="padding:20px"><img src="' + DOM_SRC + '" alt="Đốm" style="width:70px"><h2>Video demo đang được hoàn thiện</h2><p>Trong lúc chờ, anh/chị xem Hướng dẫn sử dụng hoặc bấm "Dùng dữ liệu mẫu" để thử ngay.</p><button class="btn" data-act="guide">Mở Hướng dẫn sử dụng</button></div>', true);
  };
  ACTS.feedback = function () {
    var m = modal('Góp ý cho Đốm', 'Mọi ý kiến đều được đọc để cải tiến phần mềm', '<form id="fbForm" class="fb-form" novalidate><div class="field"><label>Bạn muốn gửi</label><div class="seg" id="fbType">' + ['Đánh giá chung', 'Đề xuất tính năng', 'Báo lỗi'].map(function (t, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" data-t="' + t + '">' + t + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="fbC">Nội dung</label><textarea class="input" id="fbC" rows="5" maxlength="3800" placeholder="Điều bạn thấy hữu ích, điều chưa tiện, tính năng muốn có thêm…"></textarea></div>' +
      '<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="fbN">Họ tên</label><input class="input" id="fbN" maxlength="120"></div><div class="field"><label for="fbP">Số điện thoại (không bắt buộc)</label><input class="input" id="fbP" maxlength="20"></div></div><div class="field" style="margin-top:8px"><label for="fbE">Email (không bắt buộc – để Đốm báo khi công cụ có bản mới)</label><input class="input" id="fbE" autocomplete="email" type="email" maxlength="160"></div>' +
      '<p class="faint" style="font-size:12px">Góp ý chỉ gửi nội dung bạn nhập ở đây, không gửi dữ liệu nhân sự.</p><p id="fbMsg" class="muted"></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-close>Đóng</button><button type="submit" class="btn btn-primary" id="fbSend">Gửi góp ý</button></div></form>', true);
    var type = 'Đánh giá chung';
    $('#fbType', m).addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; type = b.getAttribute('data-t'); $$('#fbType button', m).forEach(function (x) { x.classList.toggle('on', x === b); }); });
    $('#fbForm', m).addEventListener('submit', function (e) {
      e.preventDefault();
      var c = $('#fbC', m).value.trim(), n = $('#fbN', m).value.trim(), ph = $('#fbP', m).value.trim(), msg = $('#fbMsg', m);
      if (c.length < 5) { msg.textContent = 'Vui lòng nhập nội dung (ít nhất 5 ký tự).'; return; }
      if (n.length < 2) { msg.textContent = 'Vui lòng nhập họ tên để Đốm tiện phản hồi.'; return; }
      var body = { tool: TOOL_SLUG, name: n, phone: ph, email: ((document.getElementById('fbE')||{}).value||'').trim(), content: '[' + type + ']\n' + c, page: 'Quản lý nhân sự · trang ' + curPage + ' · bản ' + APP_VER, website: '' };
      $('#fbSend', m).disabled = true; msg.textContent = 'Đang gửi…';
      var online = /^https?:$/.test(location.protocol) && /quantritute/.test(location.hostname);
      (online ? fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); })
        : fetch('https://quantritute.com/api/feedback', { method: 'POST', mode: 'no-cors', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body) }))
        .then(function () { msg.textContent = 'Cảm ơn bạn! Góp ý đã được gửi tới Đốm.'; log('Gửi góp ý (' + type + ')'); setTimeout(function () { m.close(); }, 1800); },
          function (er) { $('#fbSend', m).disabled = false; msg.textContent = 'Chưa gửi được (kiểm tra kết nối mạng) – vui lòng thử lại.'; logErr('Gửi góp ý', er); });
    });
  };
