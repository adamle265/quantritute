  /* =====================================================================
     BẢNG LƯỚI DÙNG CHUNG cho Cơ cấu nhân sự + Bảng lương (0.4.1 – anh 09/11 22:16)
       - 3 tầng tiêu đề: nhóm (ô gộp) / tên cột / đơn vị tính; chữ căn giữa 2 chiều, viền mờ giữa các ô
       - Ghim tiêu đề (top tính theo chiều cao từng tầng), ghim cột STT – Mã – Họ tên bên trái, dòng tổng ghim dưới
       - Độ rộng cột ước theo dữ liệu bên dưới, tiêu đề tự xuống dòng; cột Lưu ý = biểu tượng, bấm mới hiện nội dung
       - Toàn màn hình (lớp .gx-full), lọc theo bộ phận / loại lao động / có lưu ý
     ===================================================================== */
  function gxStyle() {
    if (document.getElementById('gxCss')) return;
    var st = document.createElement('style'); st.id = 'gxCss';
    st.textContent = '.gx-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r,12px);padding:12px}.gx-card.gx-full{position:fixed;inset:0;z-index:300;border-radius:0;padding:12px 16px;display:flex;flex-direction:column;overflow:hidden}.gx-card.gx-full .gx-wrap{max-height:none;flex:1}' +
      '.gx-bar{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;margin:0 0 10px}.gx-bar .input{width:auto;min-width:0}.gx-bar .gx-sp{flex:1}.gx-bar .gx-cnt{font-size:12.5px;color:var(--muted)}' +
      '.gx-wrap{overflow:auto;max-height:68vh;border:1px solid var(--line-2);border-radius:10px;background:var(--surface)}' +
      '.gx{border-collapse:separate;border-spacing:0;table-layout:fixed;width:max-content;font-size:12.5px}' +
      '.gx th,.gx td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:5px 7px;overflow:hidden;text-overflow:ellipsis}' +
      '.gx thead th{position:sticky;z-index:4;background:var(--surface-2);color:var(--pri-ink);font-weight:600;text-align:center;vertical-align:middle;white-space:normal;line-height:1.25;word-break:normal;overflow-wrap:anywhere}' +
      '.gx thead tr.gx-u th{font-weight:500;font-size:11px;color:var(--muted);padding:3px 4px;border-bottom:1px solid var(--line-2)}' +
      '.gx td{white-space:nowrap;background:var(--surface);height:34px}.gx td.n{text-align:right;font-variant-numeric:tabular-nums}.gx td.c{text-align:center}' +
      '.gx .fz{position:sticky;z-index:2}.gx thead th.fz{z-index:6}.gx tfoot td.fz{z-index:5}.gx td.fz-l{box-shadow:inset -1px 0 0 var(--line-2)}' +
      '.gx tfoot td{position:sticky;bottom:0;z-index:3;background:var(--surface-2);font-weight:700;border-top:2px solid var(--line-2)}' +
      '.gx tbody tr:hover td{background:linear-gradient(rgba(127,127,127,.06),rgba(127,127,127,.06)),var(--surface)}' +
      '.gx td input.input{width:100%;padding:3px 6px;height:26px;text-align:right;font-size:12.5px;min-width:0}.gx td input[type=checkbox]{width:auto;height:auto}' +
      '.gx .ut{display:inline-flex;white-space:nowrap;vertical-align:middle;margin-left:1px;border:1px solid var(--line-2);border-radius:6px;overflow:hidden}.gx .ut button{border:0;background:transparent;padding:1px 4px;font-size:10.5px;white-space:nowrap;cursor:pointer;color:var(--muted)}.gx .ut button.on{background:var(--pri);color:#fff}.gx .ut button:disabled{cursor:default}' +
      '.gx-nb{border:0;background:rgba(217,119,6,.14);color:#b45309;border-radius:6px;padding:2px 7px;font-size:12px;cursor:pointer;font-weight:600}.gx-nb.bad{background:rgba(220,38,38,.12);color:#b91c1c}' +
      '.gx-pop{position:fixed;z-index:400;max-width:380px;background:var(--surface);border:1px solid var(--line-2);border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.2);padding:10px 12px;font-size:12.5px;line-height:1.45}.gx-pop ul{margin:4px 0 0;padding-left:18px}.gx-pop li{margin:3px 0}' +
      '.gx td.chg input{border-color:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,.15)}.gx td.auto{background:linear-gradient(rgba(22,163,74,.14),rgba(22,163,74,.14)),var(--surface)!important}.gx td.auto input{border-color:#16a34a}.gx td.auto::before,.gx td.ovd::before{content:"●";float:left;font-size:9px;line-height:24px;color:#16a34a;margin-right:2px}.gx td.ovd::before{content:"✎";color:#c2410c;font-size:11px}' +
      '.gx td.ovd{background:linear-gradient(rgba(234,88,12,.18),rgba(234,88,12,.18)),var(--surface)!important;color:#9a3412}.gx td.inp{color:#1d4ed8;font-weight:600}.gx td.ed{cursor:text}.gx td.ed:hover{outline:1px dashed var(--line-2);outline-offset:-3px}.gx td.ein{padding:2px}' +
      '.gx td.hl,.gx th.hl{font-weight:700}.gx td.bad{color:#c0392b}.ccu-st{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;margin:0 0 12px}.bl-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px;margin:4px 0 12px}.bl-cg h4{grid-column:1/-1;margin:8px 0 0;font-size:13px}';
    document.head.appendChild(st);
  }
  // độ rộng cột theo dữ liệu: chuỗi dài nhất × ~7px, kẹp [mn, mx]
  function gxW(vals, mn, mx) { var L = 0; vals.forEach(function (v) { var n = String(v == null ? '' : v).length; if (n > L) L = n; }); return Math.max(mn || 48, Math.min(mx || 170, Math.round(L * 7.2 + 18))); }
  /* opt: { id, cols: [{ t, g?, unit?, w, cls?, hl? }], rows: [[{ h, cls?, at? }]], foot: [{ h, cls? }] | null, fz: số cột ghim trái }
     cột hl → nền theo opt.hl[c.hl] (mã màu) */
  function gxTable(opt) {
    var cols = opt.cols, fz = window.innerWidth < 760 ? 0 : opt.fz || 0, hasG = cols.some(function (c) { return c.g; }), left = [], x = 0;
    cols.forEach(function (c, i) { left.push(x); x += c.w; });
    var fzA = function (i, extra) { return i < fz ? ' fz' + (i === fz - 1 ? ' fz-l' : '') + '" style="left:' + left[i] + 'px' + (extra || '') : (extra ? '" style="' + extra.replace(/^;/, '') : ''); };
    var bg = function (c) { return c.bg ? ';background:linear-gradient(' + c.bg + ',' + c.bg + '),var(--surface-2)' : ''; };
    var h = '<colgroup>' + cols.map(function (c) { return '<col style="width:' + c.w + 'px">'; }).join('') + '</colgroup><thead>';
    if (hasG) {
      h += '<tr class="gx-g">'; var i = 0;
      while (i < cols.length) { var c = cols[i]; if (!c.g) { h += '<th rowspan="2" class="' + (c.hl ? 'hl' : '') + fzA(i, bg(c)) + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + c.t + '</th>'; i++; continue; } var j = i; while (j < cols.length && cols[j].g === c.g) j++; h += '<th colspan="' + (j - i) + '" class="' + (j <= fz ? fzA(i, '') : '') + '">' + esc(c.g) + '</th>'; i = j; }
      h += '</tr><tr class="gx-t">' + cols.map(function (c, k) { return c.g ? '<th class="' + (c.hl ? 'hl' : '') + fzA(k, bg(c)) + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + c.t + '</th>' : ''; }).join('') + '</tr>';
    } else h += '<tr class="gx-t">' + cols.map(function (c, k) { return '<th class="' + (c.hl ? 'hl' : '') + fzA(k, bg(c)) + '">' + c.t + '</th>'; }).join('') + '</tr>';
    h += '<tr class="gx-u">' + cols.map(function (c, k) { return '<th class="' + fzA(k, bg(c)) + '">' + (c.unit || '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += opt.rows.map(function (r) { return '<tr' + (r.at || '') + '>' + r.cells.map(function (d, k) { var c = cols[k]; return '<td class="' + (d.cls || '') + (c.hl ? ' hl' : '') + fzA(k, c.bg && !/ovd|auto/.test(d.cls || '') ? ';background:' + c.bg : '') + '"' + (d.at || '') + '>' + (d.h == null ? '' : d.h) + '</td>'; }).join('') + '</tr>'; }).join('');
    if (!opt.rows.length) h += '<tr><td colspan="' + cols.length + '" class="c faint" style="height:60px">Không có dòng nào khớp bộ lọc</td></tr>';
    h += '</tbody>';
    if (opt.foot) h += '<tfoot><tr>' + opt.foot.map(function (d, k) { return '<td class="' + (d.cls || '') + fzA(k, '') + '">' + (d.h == null ? '' : d.h) + '</td>'; }).join('') + '</tr></tfoot>';
    return '<div class="gx-wrap" id="' + opt.id + '"><table class="gx" style="width:' + x + 'px">' + h + '</table></div>';
  }
  // ghim tiêu đề: mỗi tầng top = tổng chiều cao các tầng trên (ô gộp dọc lấy top của tầng bắt đầu)
  function gxFix(id) {
    var w = document.getElementById(id); if (!w) return; var trs = w.querySelectorAll('thead tr'), top = 0;
    Array.prototype.forEach.call(trs, function (tr) { Array.prototype.forEach.call(tr.children, function (th) { th.style.top = top + 'px'; }); top += tr.getBoundingClientRect().height; });
  }
  function gxNote(list) { if (!list || !list.length) return ''; var bad = list.some(function (x) { return x.lv === 'bad'; }); return '<button type="button" class="gx-nb' + (bad ? ' bad' : '') + '" data-gxn="' + esc(JSON.stringify(list.map(function (x) { return x.t || x; }))) + '" title="Bấm để xem lưu ý" aria-label="' + list.length + ' lưu ý">⚠ ' + list.length + '</button>'; }
  function gxPop(btn) {
    var old = document.querySelector('.gx-pop'); if (old) { var same = old._b === btn; old.remove(); if (same) return; }
    var a = []; try { a = JSON.parse(btn.getAttribute('data-gxn')); } catch (e) { }
    var p = document.createElement('div'); p.className = 'gx-pop'; p._b = btn; p.innerHTML = '<b>Lưu ý</b><ul>' + a.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    document.body.appendChild(p); var rc = btn.getBoundingClientRect(), x = Math.min(window.innerWidth - p.offsetWidth - 10, Math.max(10, rc.right - p.offsetWidth)), y = rc.bottom + 6; if (y + p.offsetHeight > window.innerHeight - 8) y = Math.max(8, rc.top - p.offsetHeight - 6); p.style.left = x + 'px'; p.style.top = y + 'px';
    setTimeout(function () { document.addEventListener('mousedown', function off(e) { if (!p.contains(e.target) && e.target !== btn) { p.remove(); document.removeEventListener('mousedown', off); } }); }, 0);
  }
  function gxBind(id) {
    gxFix(id); var w = document.getElementById(id); if (!w) return;
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-gxn]'); if (b) { e.preventDefault(); gxPop(b); } });
    if (!window._gxRs) { window._gxRs = 1; window.addEventListener('resize', function () { ['ccuG', 'blG'].forEach(gxFix); }); document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var f = document.querySelector('.gx-card.gx-full'); if (f && !document.querySelector('.modal-bg, .modal')) { var k = f.getAttribute('data-ps'); if (k && PS[k]) { PS[k].full = false; render(); } } } }); }
  }
  /* 10/11 (anh 09:01): ô nhập số – bấm vào là chọn hết (gõ đè luôn, không còn số 0 thừa), gõ tới đâu tự thêm dấu . phân cách hàng nghìn tới đó */
  function gxFmtLive(el) {
    var v = el.value, pos = el.selectionStart == null ? v.length : el.selectionStart, nd = v.slice(0, pos).replace(/\D/g, '').length, d = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    var f = d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; if (f === v) return; el.value = f;
    var k = 0, c = 0; while (c < f.length && k < nd) { if (/\d/.test(f[c])) k++; c++; } try { el.setSelectionRange(c, c); } catch (e) { }
  }
  function gxIsMoney(el) { return el && el.tagName === 'INPUT' && el.closest('.gx') && el.getAttribute('inputmode') !== 'decimal' && el.type !== 'checkbox' && el.getAttribute('data-k') !== 'hrsHD' && el.getAttribute('data-k') !== 'npt' && !el.closest('td[data-n2]'); }
  if (!window._gxNum) {
    window._gxNum = 1;
    document.addEventListener('focusin', function (e) { var el = e.target; if (el && el.tagName === 'INPUT' && el.closest('.gx') && el.type !== 'checkbox') { try { el.select(); } catch (x) { } el._gxSel = 1; } });
    document.addEventListener('mouseup', function (e) { var el = e.target; if (el && el._gxSel) { el._gxSel = 0; if (el.selectionStart === el.selectionEnd) e.preventDefault(); } }, true);
    document.addEventListener('keydown', function (e) { var el = e.target; if (el && el._gxSel) el._gxSel = 0; }, true);
    document.addEventListener('input', function (e) { if (gxIsMoney(e.target)) gxFmtLive(e.target); });
  }
  /* 10/11 (anh 09:04): HOÀN TÁC / LÀM LẠI cho Cơ cấu nhân sự + Bảng lương – Ctrl+Z, Ctrl+Y (Ctrl+Shift+Z), nút ↶ ↷ trên thanh công cụ
     Mỗi thao tác sửa dữ liệu chụp lại bảng tháng trước khi sửa (u.lgcc[ym] hoặc u.lgm[ym]); giữ tối đa 50 bước, chỉ trong phiên làm việc */
  var GX_UNDO = { u: [], r: [] };
  function gxObj(kind, u, ym) { return kind === 'ccu' ? (u.lgcc || {})[ym] : (u.lgm || {})[ym]; }
  function gxSnap(kind, u, ym, label) { var o = gxObj(kind, u, ym); GX_UNDO.u.push({ kind: kind, uid: u.id, ym: ym, label: label, snap: o ? JSON.stringify(o) : null }); if (GX_UNDO.u.length > 50) GX_UNDO.u.shift(); GX_UNDO.r = []; }
  function gxDrop() { GX_UNDO.u.pop(); }
  function gxCan(kind) { return { u: GX_UNDO.u.filter(function (e) { return e.kind === kind; }).length, r: GX_UNDO.r.filter(function (e) { return e.kind === kind; }).length }; }
  function gxUndo(kind, redo) {
    var A = redo ? GX_UNDO.r : GX_UNDO.u, B = redo ? GX_UNDO.u : GX_UNDO.r, k = -1;
    for (var i = A.length - 1; i >= 0; i--) if (A[i].kind === kind) { k = i; break; }
    if (k < 0) { toast(redo ? 'Không còn thao tác để làm lại' : 'Không còn thao tác để hoàn tác'); return; }
    var e = A[k], u = S.units.filter(function (x) { return x.id === e.uid; })[0]; if (!u) { A.splice(k, 1); return; }
    var cur = gxObj(kind, u, e.ym);
    if (cur && (kind === 'ccu' ? cur.duyet : cur.lock)) { toast(kind === 'ccu' ? 'Bảng cơ cấu tháng ' + HR.ymLabel(e.ym) + ' đã duyệt – bấm Mở lại rồi mới hoàn tác được' : 'Bảng lương tháng ' + HR.ymLabel(e.ym) + ' đã chốt – mở lại rồi mới hoàn tác được', 'warn'); return; }
    A.splice(k, 1); B.push({ kind: kind, uid: e.uid, ym: e.ym, label: e.label, snap: cur ? JSON.stringify(cur) : null });
    var box = kind === 'ccu' ? (u.lgcc = u.lgcc || {}) : (u.lgm = u.lgm || {});
    if (e.snap == null) delete box[e.ym]; else box[e.ym] = JSON.parse(e.snap);
    u.ver = (u.ver || 0) + 1; saveUnits(); log((kind === 'ccu' ? 'Cơ cấu nhân sự ' : 'Bảng lương ') + HR.ymLabel(e.ym) + ' (' + u.name + '): ' + (redo ? 'làm lại – ' : 'hoàn tác – ') + e.label);
    if (kind === 'ccu') { PS.ccu.u = u.id; PS.ccu.ym = e.ym; } else { PS.blg.u = u.id; PS.blg.ym = e.ym; }
    var p = document.querySelector('.gx-pop, .bl-fill'); if (p) p.remove();
    toast((redo ? 'Đã làm lại: ' : 'Đã hoàn tác: ') + e.label); gxKeep(kind === 'ccu' ? 'ccuG' : 'blG', render);
  }
  function gxUndoBtns(kind) { var c = gxCan(kind); return '<span class="seg" style="display:inline-flex"><button class="btn btn-sm" data-act="gx-undo" data-id="' + kind + '"' + (c.u ? '' : ' disabled') + ' title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác">↶ Hoàn tác</button><button class="btn btn-sm" data-act="gx-redo" data-id="' + kind + '"' + (c.r ? '' : ' disabled') + ' title="Làm lại (Ctrl+Y)" aria-label="Làm lại">↷</button></span>'; }
  ACTS['gx-undo'] = function (a, k) { gxUndo(k, false); };
  ACTS['gx-redo'] = function (a, k) { gxUndo(k, true); };
  if (!window._gxKey) {
    window._gxKey = 1;
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return; var key = (e.key || '').toLowerCase(); if (key !== 'z' && key !== 'y') return;
      var pg = (location.hash || '').replace('#', ''), kind = pg === 'cocau' ? 'ccu' : pg === 'bl' ? 'bl' : ''; if (!kind) return;
      var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a.type !== 'checkbox' && a.value !== a.defaultValue) return; // đang gõ dở trong ô: để trình duyệt tự hoàn tác chữ
      if (document.querySelector('.modal-bg, .modal')) return;
      e.preventDefault(); gxUndo(kind, key === 'y' || e.shiftKey);
    });
  }
  // giữ vị trí cuộn khi vẽ lại
  function gxKeep(id, fn) { var sy = window.scrollY, w = document.getElementById(id), sx = w ? w.scrollLeft : 0, st = w ? w.scrollTop : 0; fn(); window.scrollTo(0, sy); var w2 = document.getElementById(id); if (w2) { w2.scrollLeft = sx; w2.scrollTop = st; } }
  // chọn cột hiển thị (dùng chung): cols [{ id, t, g, fixed }], key trong S.settings
  function gxColSel(title, cols, key, mainIds) {
    var h = S.settings[key] || {}, gs = []; cols = cols.filter(function (c) { return !c.fixed; });
    cols.forEach(function (c) { var g = c.g || 'Cột khác'; if (gs.indexOf(g) < 0) gs.push(g); });
    var body = '<p class="lg-law" style="margin-top:0">Chọn cột hiện trên bảng. Lựa chọn được nhớ cho lần sau và áp dụng cả khi xuất Excel.</p>' + gs.map(function (g) { return '<div class="bl-cg"><h4>' + esc(g) + '</h4>' + cols.filter(function (c) { return (c.g || 'Cột khác') === g; }).map(function (c) { return '<label class="lg-chk"><input type="checkbox" data-col="' + esc(c.id) + '"' + (h[c.id] ? '' : ' checked') + '> ' + c.t.replace(/<[^>]+>/g, ' ') + '</label>'; }).join('') + '</div>'; }).join('') +
      '<div class="link-row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" id="bcAll">Hiện tất cả</button>' + (mainIds ? '<button class="btn btn-sm" id="bcMain">Chỉ cột chính</button>' : '') + '</span><span style="display:flex;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="bcOk">Áp dụng</button></span></div>';
    var m = modal(title, '', body);
    $('#bcAll', m).onclick = function () { m.querySelectorAll('[data-col]').forEach(function (x) { x.checked = true; }); };
    if (mainIds) $('#bcMain', m).onclick = function () { m.querySelectorAll('[data-col]').forEach(function (x) { x.checked = mainIds(x.getAttribute('data-col')); }); };
    $('#bcOk', m).onclick = function () { var nh = {}; m.querySelectorAll('[data-col]').forEach(function (x) { if (!x.checked) nh[x.getAttribute('data-col')] = 1; }); S.settings[key] = nh; saveSettings(); m.close(); render(); };
  }
  function gxOpts(list, v, all) { return '<option value="">' + all + '</option>' + list.map(function (x) { return '<option value="' + esc(x) + '"' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
