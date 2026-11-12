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
      '.gx-bar .input{height:34px;font-size:13px;padding:0 8px}.gx-bar input.input{width:112px!important;flex:0 1 112px}.gx-bar select.input{width:130px!important;flex:0 0 130px;text-overflow:ellipsis}.gx-bar select.input{padding-right:22px}.gx-bar .btn-sm{padding:0 10px;height:34px}.gx-bar{display:flex;flex-wrap:wrap;gap:8px 6px;align-items:center;margin:0 0 10px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:8px 10px}.gx-bar .btn{background:var(--surface)}.gx-ib{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line-2);border-radius:8px;background:var(--surface);color:var(--pri-ink);cursor:pointer;padding:0}.gx-ib:disabled{opacity:.3;cursor:default}.gx-ib:not(:disabled):hover{border-color:var(--pri);color:var(--pri)}.gx-ibs{display:inline-flex;gap:4px}.gx-bar .input{width:auto;min-width:0}.gx-bar .gx-sp{flex:1}.gx-bar .gx-cnt{font-size:12.5px;color:var(--muted)}' +
      '.gx-wrap{overflow:auto;max-height:68vh;border:1px solid var(--line-2);border-radius:10px;background:var(--surface)}' +
      '.gx{border-collapse:separate;border-spacing:0;table-layout:fixed;width:max-content;font-size:12.5px}' +
      '.gx th,.gx td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:5px 7px;overflow:hidden;text-overflow:ellipsis}' +
      '.gx thead th{position:sticky;z-index:4;background:var(--surface-2);color:var(--pri-ink);font-weight:600;text-align:center;vertical-align:middle;white-space:normal;line-height:1.25;word-break:keep-all;overflow-wrap:normal;text-wrap:balance}' +
      '.gx thead tr.gx-u th{font-weight:500;font-size:11px;color:var(--muted);padding:3px 4px;border-bottom:1px solid var(--line-2)}' +
      '.gx td{white-space:nowrap;background:var(--surface);height:34px}.gx td.n{text-align:center;font-variant-numeric:tabular-nums}.gx td.c{text-align:center}' +
      '.gx .fz{position:sticky;z-index:2}.gx thead th.fz{z-index:6}.gx tfoot td.fz{z-index:5}.gx td.fz-l{box-shadow:inset -1px 0 0 var(--line-2)}' +
      '.gx tfoot td{position:sticky;bottom:0;z-index:3;background:var(--surface-2);font-weight:700;border-top:2px solid var(--line-2)}' +
      '.gx tbody tr:hover td{background:linear-gradient(rgba(127,127,127,.06),rgba(127,127,127,.06)),var(--surface)}' +
      '.gx td input.input{width:100%;padding:3px 6px;height:26px;text-align:center;font-size:12.5px;min-width:0}.gx td input[type=checkbox]{width:auto;height:auto}' +
      '.gx .ut{display:inline-flex;white-space:nowrap;vertical-align:middle;margin-left:1px;border:1px solid var(--line-2);border-radius:6px;overflow:hidden}.gx .ut button{border:0;background:transparent;padding:1px 4px;font-size:10.5px;white-space:nowrap;cursor:pointer;color:var(--muted)}.gx .ut button.on{background:var(--pri);color:#fff}.gx .ut button:disabled{cursor:default}' +
      '.gx-nb{border:0;background:rgba(217,119,6,.14);color:#b45309;border-radius:6px;padding:2px 7px;font-size:12px;cursor:pointer;font-weight:600}.gx-nb.bad{background:rgba(220,38,38,.12);color:#b91c1c}' +
      '.gx-pop{position:fixed;z-index:400;max-width:380px;background:var(--surface);border:1px solid var(--line-2);border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.2);padding:10px 12px;font-size:12.5px;line-height:1.45}.gx-pop{max-height:70vh;overflow:auto}.gn-t{font-size:11.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px}.gn{padding:6px 0;border-top:1px solid var(--line)}.gn:first-of-type{border-top:0}.gn-h{font-weight:700;color:#c0392b;line-height:1.4}.gn-d{margin-top:2px;color:var(--text);font-weight:400}' +
      '.gx td.chg input{border-color:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,.15)}.gx td.auto{background:linear-gradient(rgba(22,163,74,.14),rgba(22,163,74,.14)),var(--surface)!important}.gx td.auto input{border-color:#16a34a}.gx td.auto::before,.gx td.ovd::before{content:"●";float:left;font-size:9px;line-height:24px;color:#16a34a;margin-right:2px}.gx td.ovd::before{content:"✎";color:#c2410c;font-size:11px}' +
      '.gx td.ovd{background:linear-gradient(rgba(234,88,12,.18),rgba(234,88,12,.18)),var(--surface)!important;color:#9a3412}.gx td.inp{color:#1d4ed8;font-weight:600}.gx td.ed{cursor:text}.gx td.ed:hover{outline:1px dashed var(--line-2);outline-offset:-3px}.gx td.ein{padding:2px}' +
      '.cs-list{list-style:none;margin:0;padding:0;max-height:58vh;overflow:auto;border:1px solid var(--line);border-radius:10px}.cs-it{display:flex;align-items:center;gap:8px;padding:3px 10px;border-bottom:1px solid var(--line);background:var(--surface);cursor:grab}.cs-it:last-child{border-bottom:0}.cs-it.drag{opacity:.45;background:var(--surface-2)}.cs-h{color:var(--muted);letter-spacing:-2px;font-weight:700;user-select:none}.cs-it .lg-chk{flex:1;min-width:0}.cs-g{font-size:11px;color:var(--muted);background:var(--surface-2);border-radius:6px;padding:1px 6px;white-space:nowrap}.cs-mv{display:flex;gap:2px}.cs-mv .btn{padding:0 6px;min-height:22px;height:24px;font-size:12px;line-height:1}.cs-it .lg-chk{min-height:0}' + 
      '.gx thead th{position:sticky}.gx-rz{position:absolute;top:0;right:-4px;width:8px;height:100%;cursor:col-resize;z-index:8}.gx-rz:hover,.gx-rz.on{background:linear-gradient(90deg,transparent 3px,var(--pri) 3px,var(--pri) 5px,transparent 5px)}body.gx-rzing{cursor:col-resize;user-select:none}' +
      '.gx-leg{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px;font-size:12.5px;color:var(--muted)}.gx-leg li{display:flex;gap:8px;align-items:flex-start;line-height:1.45}.gx-leg .sw{flex:0 0 26px;height:16px;border-radius:4px;border:1px solid var(--line-2);margin-top:1px;background:var(--surface);font-size:10px;text-align:center;line-height:14px}' +
      '.gx-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}@media(min-width:1100px){.gx-kpi{grid-template-columns:repeat(var(--n),minmax(0,1fr))}}.gx-kpi>div{border:1px solid var(--line);border-radius:12px;padding:10px 14px;background:var(--surface);display:flex;flex-direction:column;gap:2px;min-height:76px}.gx-kpi span{font-size:12px;color:var(--muted);line-height:1.3;min-height:31px}.gx-kpi b{font-size:17px;font-variant-numeric:tabular-nums;line-height:1.25}.gx-kpi em{font-style:normal;font-size:12px;color:var(--muted)}.gx-kpi em.up{color:#b45309}.gx-kpi em.dn{color:#15803d}.gx-kpi>div.ac{background:var(--surface-2);border-color:var(--line-2)}.gx-kpi>div.ac b{color:var(--pri-ink)}.gx-kpi>div.wn b{color:#c2410c}' +
      '.no-scan #scanTxt{display:none}.gx td.hl,.gx th.hl{font-weight:700}.gx td.bad{color:#c0392b}.ccu-st{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;margin:0 0 12px}.bl-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 14px;margin:4px 0 12px}.bl-cg h4{grid-column:1/-1;margin:8px 0 0;font-size:13px}';
    document.head.appendChild(st);
  }
  // độ rộng cột theo dữ liệu: chuỗi dài nhất × ~7px, kẹp [mn, mx]
  function gxW(vals, mn, mx) { var L = 0; vals.forEach(function (v) { var n = String(v == null ? '' : v).length; if (n > L) L = n; }); return Math.max(mn || 48, Math.min(mx || 170, Math.round(L * 7.2 + 18))); }
  /* opt: { id, cols: [{ t, g?, unit?, w, cls?, hl? }], rows: [[{ h, cls?, at? }]], foot: [{ h, cls? }] | null, fz: số cột ghim trái }
     cột hl → nền theo opt.hl[c.hl] (mã màu) */
  // Bề rộng tối thiểu theo tiêu đề: đủ cho từ dài nhất, tối đa 3 dòng; dòng đơn vị đủ chỗ cho nút đ/ngày|đ/tháng
  function gxMinW(c) {
    var t = String(c.t || '').replace(/<[^>]*>/g, ' ').replace(/[ \t\r\n]+/g, ' ').trim(), wd = t.split(' ').reduce(function (m, x) { return Math.max(m, x.length); }, 0);
    var u = String(c.unit || ''), nb = (u.match(/<button/g) || []).length, ut = u.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    return Math.ceil(Math.max(wd * 8.2 + 18, t.length / 3 * 7.6 + 18, ut.length * 6.4 + nb * 14 + 14));
  }
  function gxTable(opt) {
    var cols = opt.cols, fz = window.innerWidth < 760 ? 0 : opt.fz || 0, hasG = cols.some(function (c) { return c.g; }), left = [], x = 0;
    cols.forEach(function (c) { if (typeof XW !== 'undefined' && XW.join) { c.t = XW.join(c.t); if (c.g) c.g = XW.join(c.g); } c.w = Math.max(c.w || 0, gxMinW(c)); }); // 10/11 anh: tiêu đề không vỡ chữ giữa từ, ô đơn vị đủ chỗ cho nút chọn
    var SW = (S.settings.gxW || {})[opt.id] || {}; cols.forEach(function (c) { if (c.id && SW[c.id]) c.w = Math.max(40, SW[c.id]); }); // độ rộng người dùng kéo (14:49 10/11)
    var rz = function (c) { return c.id ? '<span class="gx-rz" data-rz="' + esc(c.id) + '" title="Kéo để đổi độ rộng · bấm đúp: về mặc định"></span>' : ''; };
    cols.forEach(function (c, i) { left.push(x); x += c.w; });
    var fzA = function (i, extra) { return i < fz ? ' fz' + (i === fz - 1 ? ' fz-l' : '') + '" style="left:' + left[i] + 'px' + (extra || '') : (extra ? '" style="' + extra.replace(/^;/, '') : ''); };
    var bg = function (c) { return c.bg ? ';background:linear-gradient(' + c.bg + ',' + c.bg + '),var(--surface-2)' : ''; };
    var h = '<colgroup>' + cols.map(function (c) { return '<col style="width:' + c.w + 'px">'; }).join('') + '</colgroup><thead>';
    if (hasG) {
      h += '<tr class="gx-g">'; var i = 0;
      while (i < cols.length) { var c = cols[i]; if (!c.g) { h += '<th rowspan="2" class="' + (c.hl ? 'hl' : '') + fzA(i, bg(c)) + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + c.t + rz(c) + '</th>'; i++; continue; } var j = i; while (j < cols.length && cols[j].g === c.g) j++; h += '<th colspan="' + (j - i) + '" class="' + (j <= fz ? fzA(i, '') : '') + '">' + esc(c.g) + '</th>'; i = j; }
      h += '</tr><tr class="gx-t">' + cols.map(function (c, k) { return c.g ? '<th class="' + (c.hl ? 'hl' : '') + fzA(k, bg(c)) + '"' + (c.tip ? ' title="' + esc(c.tip) + '"' : '') + '>' + c.t + rz(c) + '</th>' : ''; }).join('') + '</tr>';
    } else h += '<tr class="gx-t">' + cols.map(function (c, k) { return '<th class="' + (c.hl ? 'hl' : '') + fzA(k, bg(c)) + '">' + c.t + rz(c) + '</th>'; }).join('') + '</tr>';
    h += '<tr class="gx-u">' + cols.map(function (c, k) { return '<th class="' + fzA(k, bg(c)) + '">' + (c.unit || '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += opt.rows.map(function (r) { return '<tr' + (r.at || '') + '>' + r.cells.map(function (d, k) { var c = cols[k]; return '<td class="' + (d.cls || '') + (c.hl ? ' hl' : '') + fzA(k, c.bg && !/ovd|auto/.test(d.cls || '') ? ';background:' + c.bg : '') + '"' + (d.at || '') + '>' + (d.h == null ? '' : d.h) + '</td>'; }).join('') + '</tr>'; }).join('');
    if (!opt.rows.length) h += '<tr><td colspan="' + cols.length + '" class="c faint" style="height:60px">Không có dòng nào khớp bộ lọc</td></tr>';
    h += '</tbody>';
    if (opt.foot) { var sk = 0; h += '<tfoot><tr>' + opt.foot.map(function (d, k) { if (sk) { sk--; return ''; } if (d.span > 1) sk = d.span - 1; return '<td' + (d.span > 1 ? ' colspan="' + d.span + '"' : '') + ' class="' + (d.cls || '') + fzA(k, '') + '">' + (d.h == null ? '' : d.h) + '</td>'; }).join('') + '</tr></tfoot>'; }
    return '<div class="gx-wrap" id="' + opt.id + '"><table class="gx" style="width:' + x + 'px">' + h + '</table></div>';
  }
  // ghim tiêu đề: mỗi tầng top = tổng chiều cao các tầng trên (ô gộp dọc lấy top của tầng bắt đầu)
  function gxFix(id) {
    var w = document.getElementById(id); if (!w) return; var trs = w.querySelectorAll('thead tr'), top = 0;
    Array.prototype.forEach.call(trs, function (tr) { Array.prototype.forEach.call(tr.children, function (th) { th.style.top = top + 'px'; }); top += tr.getBoundingClientRect().height; });
  }
  /* Lưu ý (12:35 10/11 anh): mỗi lưu ý = dòng đầu đỏ đậm (điều quan trọng nhất) + phần giải thích chữ thường bên dưới.
     Tách tự động ở " – ", ". ", "; " đầu tiên; lưu ý có sẵn { h, d } thì dùng luôn. Lưu ý mức "bad" xếp trước. */
  function gxSplit(w) {
    if (w && w.h) return { h: w.h, d: w.d || '' };
    var t = String(w && w.t != null ? w.t : w || '').trim(), best = -1, cut = 0;
    [[' – ', 3], ['. ', 2], ['; ', 2]].forEach(function (m) { var i = t.indexOf(m[0]); if (i >= 12 && (best < 0 || i < best)) { best = i; cut = m[1]; } });
    if (best < 0) return { h: t, d: '' };
    var h = t.slice(0, best).replace(/[.:;]$/, ''), d = t.slice(best + cut).trim();
    return { h: h, d: d.charAt(0).toUpperCase() + d.slice(1) };
  }
  function gxNoteHtml(list) { return (list || []).slice().sort(function (x, y) { return (y.lv === 'bad') - (x.lv === 'bad'); }).map(function (w) { var p = gxSplit(w); return '<div class="gn"><div class="gn-h">' + esc(p.h) + '</div>' + (p.d ? '<div class="gn-d">' + esc(p.d) + '</div>' : '') + '</div>'; }).join(''); }
  function gxNote(list) { if (!list || !list.length) return ''; var bad = list.some(function (x) { return x.lv === 'bad'; }); return '<button type="button" class="gx-nb' + (bad ? ' bad' : '') + '" data-gxn="' + esc(JSON.stringify(list.map(function (x) { return typeof x === 'string' ? { t: x } : { t: x.t, lv: x.lv, h: x.h, d: x.d }; }))) + '" title="Bấm để xem lưu ý" aria-label="' + list.length + ' lưu ý">⚠ ' + list.length + '</button>'; }
  function gxPop(btn) {
    var old = document.querySelector('.gx-pop'); if (old) { var same = old._b === btn; old.remove(); if (same) return; }
    var a = []; try { a = JSON.parse(btn.getAttribute('data-gxn')); } catch (e) { }
    var p = document.createElement('div'); p.className = 'gx-pop'; p._b = btn; p.innerHTML = '<div class="gn-t">Lưu ý (' + a.length + ')</div>' + gxNoteHtml(a);
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
  var GX_SVG = { undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', min: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>' };
  function gxSvg(k, n) { return '<svg width="' + (n || 16) + '" height="' + (n || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + GX_SVG[k] + '</svg>'; }
  function gxUndoBtns(kind) { var c = gxCan(kind); return '<span class="gx-ibs"><button type="button" class="gx-ib" data-act="gx-undo" data-id="' + kind + '"' + (c.u ? '' : ' disabled') + ' title="Hoàn tác (Ctrl+Z)" aria-label="Hoàn tác">' + gxSvg('undo') + '</button><button type="button" class="gx-ib" data-act="gx-redo" data-id="' + kind + '"' + (c.r ? '' : ' disabled') + ' title="Làm lại (Ctrl+Y)" aria-label="Làm lại">' + gxSvg('redo') + '</button></span>'; }
  function gxFullBtn(act, on) { return '<button class="btn btn-sm" data-act="' + act + '">' + gxSvg(on ? 'min' : 'full', 15) + (on ? 'Thu nhỏ (Esc)' : 'Toàn màn hình') + '</button>'; }
  // chỉ số tổng hợp: [{ l, v, d?: chú thích dưới, cls?: 'ac' nổi bật | 'wn' cảnh báo }]
  function gxKpi(items) { return '<div class="gx-kpi" style="--n:' + items.length + '">' + items.map(function (k) { return '<div class="' + (k.cls || '') + '"><span>' + k.l + '</span><b>' + k.v + '</b>' + (k.d ? '<em' + (k.dc ? ' class="' + k.dc + '"' : '') + '>' + k.d + '</em>' : '') + '</div>'; }).join('') + '</div>'; }
  function gxDelta(a, b, pre) { if (b == null) return { d: '' }; var d = a - b; return d ? { d: (pre || 'so tháng trước ') + (d > 0 ? '+' : '−') + lgMoney(Math.abs(d)), dc: d > 0 ? 'up' : 'dn' } : { d: (pre || 'so tháng trước ') + 'không đổi' }; }
  // chú thích cuối bảng: [{ sw?: html ô mẫu, st?: style ô mẫu, t: html, c?: màu chữ }]
  function gxLegend(items) { return '<ul class="gx-leg">' + items.map(function (x) { return '<li>' + (x.st != null ? '<span class="sw" style="' + x.st + '">' + (x.sw || '') + '</span>' : '<span class="sw" style="border:0;background:none">•</span>') + '<span' + (x.c ? ' style="color:' + x.c + '"' : '') + '>' + x.t + '</span></li>'; }).join('') + '</ul>'; }
  // kéo co giãn cột (14:49 10/11): lưu S.settings.gxW[bảng][cột]
  if (!window._gxRz) { window._gxRz = 1;
    document.addEventListener('mousedown', function (e) {
      var hd = e.target.closest && e.target.closest('.gx-rz'); if (!hd) return; e.preventDefault(); e.stopPropagation();
      var wrap = hd.closest('.gx-wrap'), tb = wrap.querySelector('table'), th = hd.parentNode, cid = hd.getAttribute('data-rz'), colsEl = tb.querySelectorAll('colgroup col');
      var x0 = e.clientX, r = th.getBoundingClientRect(), k = -1, acc = tb.getBoundingClientRect().left; [].some.call(colsEl, function (cl, i) { var w = parseFloat(cl.style.width); if (Math.abs(acc + w - r.right) < 3) { k = i; return true; } acc += w; return false; }); // cột có mép phải trùng mép phải ô tiêu đề
      if (k < 0) return; var col = colsEl[k], w0 = parseFloat(col.style.width), tw0 = parseFloat(tb.style.width); hd.classList.add('on'); document.body.classList.add('gx-rzing');
      var mv = function (ev) { var nw = Math.max(40, Math.round(w0 + ev.clientX - x0)); col.style.width = nw + 'px'; tb.style.width = (tw0 + nw - w0) + 'px'; };
      var up = function (ev) { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); hd.classList.remove('on'); document.body.classList.remove('gx-rzing'); var nw = Math.max(40, Math.round(w0 + ev.clientX - x0)); if (Math.abs(nw - w0) < 2) return; var G = S.settings.gxW || (S.settings.gxW = {}); (G[wrap.id] || (G[wrap.id] = {}))[cid] = nw; saveSettings(); gxKeep(wrap.id, render); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    }, true);
    document.addEventListener('dblclick', function (e) { var hd = e.target.closest && e.target.closest('.gx-rz'); if (!hd) return; var wrap = hd.closest('.gx-wrap'), G = S.settings.gxW || {}; if (G[wrap.id]) { delete G[wrap.id][hd.getAttribute('data-rz')]; saveSettings(); gxKeep(wrap.id, render); } }, true);
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.gx-rz')) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
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
  /* Chọn cột hiển thị + thứ tự (12:35 10/11 anh): tick hiện/ẩn, kéo thả (hoặc ↑ ↓) đổi thứ tự. Cột cố định (fixed) đứng nguyên chỗ.
     o: { title, sub?, cols (định nghĩa mặc định, đúng thứ tự gốc), hideKey, ordKey, hide0 (ẩn mặc định), main?(c) → bool, note? } */
  function gxOrder(cols, ordKey) {
    var ord = S.settings[ordKey]; if (!ord || !ord.length) return cols;
    var mov = cols.filter(function (c) { return !c.fixed; }), byId = {}; mov.forEach(function (c) { byId[c.id] = c; });
    var res = ord.filter(function (id) { return byId[id]; }).map(function (id) { return byId[id]; });
    mov.forEach(function (c, i) { if (res.indexOf(c) >= 0) return; var prev = i ? mov[i - 1] : null, at = prev ? res.indexOf(prev) + 1 : 0; res.splice(at, 0, c); }); // cột mới: đặt sau cột đứng trước nó theo mặc định
    var k = 0; return cols.map(function (c) { return c.fixed ? c : res[k++]; });
  }
  function gxColSel(o) {
    var hide = Object.assign({}, S.settings[o.hideKey] || o.hide0 || {}), list = gxOrder(o.cols, o.ordKey).filter(function (c) { return !c.fixed; });
    var nm = function (c) { return String(c.t || '').replace(/<[^>]+>/g, ' ').replace(/[\s ]+/g, ' ').trim(); };
    var row = function (c) { return '<li class="cs-it" draggable="true" data-col="' + esc(c.id) + '"><span class="cs-h" title="Kéo để đổi thứ tự" aria-hidden="true">⋮⋮</span><label class="lg-chk"><input type="checkbox"' + (hide[c.id] ? '' : ' checked') + '> ' + esc(nm(c)) + '</label>' + (c.g ? '<span class="cs-g">' + esc(String(c.g).replace(/<[^>]+>/g, '')) + '</span>' : '') + '<span class="cs-mv"><button type="button" class="btn btn-sm" data-mv="-1" aria-label="Lên">↑</button><button type="button" class="btn btn-sm" data-mv="1" aria-label="Xuống">↓</button></span></li>'; };
    var fx = o.cols.filter(function (c) { return c.fixed; }).map(nm).join(', ');
    var body = '<p class="lg-law" style="margin-top:0">Tick để hiện / bỏ tick để ẩn. <b>Kéo thả</b> dòng (hoặc bấm ↑ ↓) để đổi thứ tự cột trên bảng. Lựa chọn được nhớ cho lần sau và áp dụng cả khi xuất Excel.' + (fx ? ' Luôn hiện, đứng cố định: ' + esc(fx) + '.' : '') + (o.note ? ' ' + o.note : '') + '</p><ul class="cs-list" id="csL">' + list.map(row).join('') + '</ul>' +
      '<div class="link-row" style="justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:10px"><span style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" id="bcAll">Hiện tất cả</button>' + (o.main ? '<button class="btn btn-sm" id="bcMain">Chỉ cột chính</button>' : '') + '<button class="btn btn-sm" id="bcDef">Về mặc định</button></span><span style="display:flex;gap:8px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="bcOk">Áp dụng</button></span></div>';
    var m = modal(o.title, o.sub || '', body), L = $('#csL', m), drag = null;
    var paint = function (cs, hd) { L.innerHTML = cs.map(function (c) { var h0 = hide; hide = hd; var x = row(c); hide = h0; return x; }).join(''); };
    L.addEventListener('dragstart', function (e) { drag = e.target.closest('.cs-it'); if (!drag) return; drag.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag.getAttribute('data-col')); } catch (x) {} });
    L.addEventListener('dragend', function () { if (drag) drag.classList.remove('drag'); drag = null; L.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); }); });
    L.addEventListener('dragover', function (e) { if (!drag) return; e.preventDefault(); var t = e.target.closest('.cs-it'); if (!t || t === drag) return; var r = t.getBoundingClientRect(); L.insertBefore(drag, e.clientY > r.top + r.height / 2 ? t.nextSibling : t); });
    L.addEventListener('drop', function (e) { e.preventDefault(); });
    L.addEventListener('click', function (e) { var b = e.target.closest('[data-mv]'); if (!b) return; var it = b.closest('.cs-it'), d = +b.getAttribute('data-mv'); if (d < 0 && it.previousElementSibling) L.insertBefore(it, it.previousElementSibling); else if (d > 0 && it.nextElementSibling) L.insertBefore(it.nextElementSibling, it); b.focus(); });
    $('#bcAll', m).onclick = function () { L.querySelectorAll('input').forEach(function (x) { x.checked = true; }); };
    if (o.main) $('#bcMain', m).onclick = function () { L.querySelectorAll('.cs-it').forEach(function (li) { var c = o.cols.filter(function (y) { return y.id === li.getAttribute('data-col'); })[0]; li.querySelector('input').checked = !!(c && o.main(c)); }); };
    $('#bcDef', m).onclick = function () { paint(o.cols.filter(function (c) { return !c.fixed; }), Object.assign({}, o.hide0 || {})); };
    $('#bcOk', m).onclick = function () { var nh = {}, ord = []; L.querySelectorAll('.cs-it').forEach(function (li) { var id = li.getAttribute('data-col'); ord.push(id); if (!li.querySelector('input').checked) nh[id] = 1; }); S.settings[o.hideKey] = nh; S.settings[o.ordKey] = ord; saveSettings(); m.close(); render(); };
  }
  /* Dán 1 cột nhiều dòng từ Excel (12:35 10/11 anh) – dùng chung Cơ cấu nhân sự, Bảng lương.
     gxNum(raw, n2) → { v } | { err }; gxPaste(e, { targets: [{ id, name }], n2, label, apply(list[{id,val}]) }) → true nếu đã xử lý */
  function gxNum(raw, n2) {
    var t = String(raw == null ? '' : raw).replace(/[\s ]/g, '').replace(/đ$|đồng$|vnd$/i, '');
    if (t === '' || t === '-') return { v: '' };
    if (n2) { t = t.replace(/%$/, ''); if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(',', '.'); return /^\d+(\.\d+)?$/.test(t) ? { v: +t } : { err: 'không phải số' }; }
    if (/^-/.test(t)) return { err: 'số âm' };
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return { v: +t.replace(/[.,]/g, '') };
    if (/^\d+$/.test(t)) return { v: +t };
    if (/^\d+[.,]\d{1,2}$/.test(t)) return { v: Math.round(+t.replace(',', '.')) };
    return { err: /\d/.test(t) ? 'sai định dạng số' : 'không phải số' };
  }
  function gxPaste(e, o) {
    var txt = (e.clipboardData || window.clipboardData || { getData: function () { return ''; } }).getData('text') || '';
    var lines = txt.replace(/\r/g, '').split('\n'); while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    if (lines.length < 2) return false; e.preventDefault();
    var multi = lines.some(function (l) { return l.indexOf('\t') >= 0; }), ok = [], bad = [], T = o.targets;
    lines.forEach(function (l, i) { var raw = l.split('\t')[0]; if (i >= T.length) return; var r = gxNum(raw, o.n2); if (r.err) bad.push({ i: i, raw: raw, why: r.err, who: T[i].name }); else ok.push({ id: T[i].id, val: r.v }); });
    var over = Math.max(0, lines.length - T.length);
    if (!bad.length && !over && !multi) { o.apply(ok); toast('Đã dán ' + ok.length + ' dòng vào cột ' + o.label, 'ok'); return true; }
    var msg = '<p>Dán <b>' + lines.length + ' dòng</b> vào cột <b>' + esc(o.label) + '</b>, bắt đầu từ ' + esc(T[0].name) + ' (' + T.length + ' dòng phía dưới theo bộ lọc hiện tại).</p>' +
      (multi ? '<div class="notice warn">' + ic('info') + '<div>Dữ liệu có nhiều cột – chỉ lấy <b>cột đầu tiên</b>.</div></div>' : '') +
      (over ? '<div class="notice warn">' + ic('info') + '<div><b>Thừa ' + over + ' dòng</b> so với số dòng còn lại trên bảng – các dòng thừa bị bỏ qua.</div></div>' : '') +
      (bad.length ? '<div class="notice bad">' + ic('info') + '<div><b>' + bad.length + ' giá trị lỗi</b> (bỏ qua, giữ số cũ):<br>' + bad.slice(0, 12).map(function (b) { return 'Dòng ' + (b.i + 1) + ' – ' + esc(b.who) + ': "' + esc(b.raw) + '" ' + b.why; }).join('<br>') + (bad.length > 12 ? '<br>…' : '') + '</div></div>' : '') +
      '<div class="link-row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="gpOk"' + (ok.length ? '' : ' disabled') + '>Dán ' + ok.length + ' giá trị hợp lệ</button></div>';
    var m = modal('Kiểm tra dữ liệu dán', '', msg, true); $('#gpOk', m).onclick = function () { m.close(); o.apply(ok); toast('Đã dán ' + ok.length + ' dòng' + (bad.length ? ', bỏ qua ' + bad.length + ' lỗi' : ''), bad.length ? 'warn' : 'ok'); };
    return true;
  }
  function gxOpts(list, v, all) { return '<option value="">' + all + '</option>' + list.map(function (x) { return '<option value="' + esc(x) + '"' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
