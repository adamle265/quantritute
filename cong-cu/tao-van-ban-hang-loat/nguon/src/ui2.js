/* ---------- BƯỚC 3: ghép trường ---------- */
function colSelect(cur, onch) {
  return h('select', { class: 'inp', onchange: e => onch(e.target.value === '' ? null : +e.target.value) },
    h('option', { value: '' }, '— Chưa ghép cột —'), D().headers.map((x, j) => h('option', { value: String(j), selected: cur === j }, x)));
}
function fmtSelect(cur, onch, isNum) {
  return h('select', { class: 'inp', onchange: e => onch(e.target.value), title: 'Cách hiển thị giá trị' },
    Object.entries(FMTS).map(([k, v]) => h('option', { value: k, selected: cur === k }, isNum && k === 'raw' ? 'Giữ kiểu số/ngày của ô' : v)));
}
function colDrop(elm, onCol) {
  elm.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('text/qtt-col')) { e.preventDefault(); elm.classList.add('dragover'); } });
  elm.addEventListener('dragleave', () => elm.classList.remove('dragover'));
  elm.addEventListener('drop', e => { elm.classList.remove('dragover'); const v = e.dataTransfer.getData('text/qtt-col'); if (v !== '') { e.preventDefault(); onCol(+v); } });
}
function chipsBar(used) {
  return h('div', { class: 'chips' },
    D().headers.map((name, j) => {
      const c = h('span', { class: 'chip' + (used.has(j) ? ' used' : ''), draggable: 'true', title: 'Kéo thả vào một trường để ghép' },
        h('i', { style: { background: colColor(j) } }), h('span', {}, name));
      c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/qtt-col', String(j)); e.dataTransfer.effectAllowed = 'copy'; c.classList.add('dragging'); });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
      return c;
    }));
}
function sampleBar() {
  const d = D(), N = Math.min(d.rows.length, 2000);
  const sel = h('select', { class: 'inp', style: { maxWidth: '360px' }, onchange: e => { detect(+e.target.value); render(); } },
    Array.from({ length: N }, (_, i) => h('option', { value: String(i), selected: i === S.sampleRow }, rowLabel(i))));
  if (S.mode === 'marker') {
    const di = S.detectInfo || { n: 0, total: 0 };
    const miss = di.total - di.n;
    return h('div', { class: 'row', style: { marginBottom: '12px' } },
      h('span', { class: 'lbl' }, 'Xem giá trị của'), sel,
      h('button', { class: 'btn sm', onclick: () => { S.detected = false; detect(); render(); toast('Đã phân tích lại file mẫu.'); } }, '↻ Phân tích lại'),
      h('span', { class: 'small ' + (miss ? 'warn' : 'muted') }, `Nhận diện ${di.total} ký hiệu, ${di.n} đã khớp tên cột` + (miss ? `, ${miss} chưa khớp.` : '.')));
  }
  if (engine() === 'box') {
    const nc = (S.cands || []).length;
    return h('div', { class: 'row', style: { marginBottom: '12px' } }, h('span', { class: 'lbl' }, 'Xem giá trị của'), sel,
      h('span', { class: 'small', style: { color: nc ? '#2F7D4F' : 'var(--mute)' } }, nc ? `Đã đánh dấu ${nc} ô chờ (viền xanh, dấu +): bấm vào ô hoặc kéo cột thả vào để ghép.` : 'Kéo khung quanh chữ cũ cần thay để tạo khung, rồi ghép cột.'));
  }
  const info = S.detectInfo && S.detectInfo.n
    ? h('span', { class: 'muted small' }, `Mẫu khớp với dòng này ở ${S.detectInfo.n} cột.`)
    : h('span', { class: 'small warn' }, 'Chưa thấy giá trị nào của danh sách trong file mẫu.');
  return h('div', { class: 'row', style: { marginBottom: '12px' } },
    h('span', { class: 'lbl' }, 'File mẫu được làm từ'), sel,
    h('button', { class: 'btn sm', onclick: () => { detect(); render(); toast('Đã phân tích lại.'); } }, '↻ Tự tìm lại'), info);
}
function viewMap() {
  if (!S.detected) detect();
  return engine() === 'box' ? viewMapBox() : viewMapText();
}
function mapHeader(extra) {
  const used = new Set((engine() === 'box' ? S.boxes : S.rules).filter(x => x.on && x.col != null).map(x => x.col));
  const unused = D().headers.filter((_, j) => !used.has(j));
  return h('div', { class: 'card' },
    h('h2', {}, 'Ghép trường giữa file mẫu và danh sách'),
    h('p', { class: 'sub' }, S.mode === 'marker'
      ? (engine() === 'box' ? 'Mỗi ký hiệu trong mẫu là một khung chữ, chữ mới giữ phông và cỡ của ký hiệu. Kéo cột thả vào khung để đổi ghép; kéo chuột trên trang để thêm khung.'
        : 'Mỗi ký hiệu trong mẫu là một trường, chữ mới giữ đúng định dạng của ký hiệu (phông, cỡ, đậm, màu). Kéo cột thả vào trường để đổi ghép.')
      : engine() === 'box'
        ? (S.tpl.hasText ? 'Bấm vào chữ cũ trên trang (hoặc kéo khung quanh nó) để tạo khung: khung tự bắt đúng phông, cỡ, màu và vị trí của chữ cũ, chữ cũ được xoá khi tạo file. Kéo cột thả vào khung để ghép.' : 'Mỗi khung là một chỗ chữ sẽ được thay. Kéo cột từ danh sách thả vào khung để ghép; kéo chuột trên trang để thêm khung mới.')
        : 'Mẫu chưa có ký hiệu [Tên cột] nên công cụ dò các đoạn trùng với dữ liệu của danh sách. Kéo cột thả vào trường để đổi ghép; bôi đen đoạn chữ trong mẫu để thêm trường.'),
    sampleBar(), h('div', { class: 'lbl', style: { margin: '4px 0 8px' } }, 'Cột trong danh sách – kéo thả vào trường'), chipsBar(used),
    unused.length && used.size ? h('div', { class: 'muted small', style: { marginTop: '8px' } }, `Cột chưa dùng: ${unused.join(', ')}`) : null, extra || null);
}

/* --- mẫu Word/Excel --- */
function markEl(r, txt) {
  return h('mark', {
    class: 'hl' + (r.src === 'mk' ? ' mk' : '') + (r.on && r.col != null ? '' : ' off') + (S.selRule === r.id ? ' sel' : ''), style: { '--c': r.col != null ? colColor(r.col) : '#999' },
    title: r.col != null ? '→ ' + D().headers[r.col] : 'Chưa ghép cột', 'data-rid': String(r.id),
    onclick: () => { S.selRule = r.id; render(); setTimeout(() => { const el = $(`.rule[data-id="${r.id}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 50); }
  }, txt);
}
/* tô các trường ngay trên trang Word đã dựng */
function highlightDom(root, finds, mkFn) {
  if (!finds.length) return;
  for (const p of root.querySelectorAll('p')) {
    if (p.querySelector('p')) continue;
    const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); const nodes = []; let n;
    while ((n = tw.nextNode())) nodes.push(n);
    if (!nodes.length) continue;
    const offs = []; let o = 0; for (const x of nodes) { offs.push(o); o += x.nodeValue.length; }
    const ms = planMatches(cmp(nodes.map(x => x.nodeValue).join('')), finds);
    for (let k = ms.length - 1; k >= 0; k--) {
      const m = ms[k], r = mkFn ? null : S.rules.find(x => x.id === m.f.key); if (!mkFn && !r) continue;
      const parts = [];
      for (let q = nodes.length - 1; q >= 0; q--) {
        const len = nodes[q].nodeValue.length;
        const st = Math.max(m.a, offs[q]) - offs[q], en = Math.min(m.b, offs[q] + len) - offs[q];
        if (en <= st) continue;
        const mid = nodes[q].splitText(st); mid.splitText(en - st);
        const mk = mkFn ? mkFn(m.f, mid.nodeValue) : markEl(r, mid.nodeValue); mid.replaceWith(mk); parts.unshift(mk);
      }
      if (parts.length > 1) parts.forEach((mk, i) => mk.classList.add(i === 0 ? 'p-first' : i === parts.length - 1 ? 'p-last' : 'p-mid'));
    }
  }
}
/* nối đoạn văn Word (theo thứ tự trong file) với thẻ <p> đã dựng – so khớp theo chữ, bỏ khoảng trắng */
function mapDocxParas(root, T) {
  const sq = x => cmp(x || '').replace(/\s+/g, '');
  const ps = [...root.querySelectorAll('section.docx article p')].filter(p => !p.querySelector('p'));
  const res = new Map(); let j = 0;
  for (const P of T.paras) {
    if (P.part !== 'word/document.xml') continue;
    const want = sq(P.text); if (!want) continue;
    for (let k = j; k < Math.min(ps.length, j + 40); k++) if (sq(ps[k].textContent) === want) { res.set(P.gi, ps[k]); ps[k].dataset.gi = P.gi; j = k + 1; break; }
  }
  return res;
}
/* thứ tự lần xuất hiện của chuỗi q trong t trước vị trí a */
const occIndex = (t, q, a) => { let n = 0, i = 0; while ((i = t.indexOf(q, i)) >= 0 && i < a) { n++; i += q.length; } return n; };
function wrapInP(p, q, nth, mk) {
  const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); const nodes = []; let n;
  while ((n = tw.nextNode())) nodes.push(n);
  const full = cmp(nodes.map(x => x.nodeValue).join(''));
  let i = -1, from = 0; for (let k = 0; k <= nth; k++) { i = full.indexOf(q, from); if (i < 0) return null; from = i + q.length; }
  const a = i, b = i + q.length, offs = []; let o = 0; for (const x of nodes) { offs.push(o); o += x.nodeValue.length; }
  const parts = [];
  for (let k = nodes.length - 1; k >= 0; k--) {
    const len = nodes[k].nodeValue.length, st = Math.max(a, offs[k]) - offs[k], en = Math.min(b, offs[k] + len) - offs[k];
    if (en <= st) continue;
    const mid = nodes[k].splitText(st); mid.splitText(en - st); const el = mk(mid.nodeValue); mid.replaceWith(el); parts.unshift(el);
  }
  return parts;
}
/* tô các trường theo vị trí và các ô chờ trên trang Word */
function markDocxPositions(root, T) {
  const pmap = mapDocxParas(root, T);
  const paraOf = gi => T.paras.find(P => P.part === 'word/document.xml' && P.gi === gi);
  const place = (pos, find, mk) => { const p = pmap.get(pos.gi), P = paraOf(pos.gi); if (!p || !P) return; wrapInP(p, cmp(find), occIndex(cmp(P.text), cmp(find), pos.a), mk); };
  for (const r of S.rules) if (r.pos && r.pos.part === 'word/document.xml') place(r.pos, r.find, t => { const m = markEl(r, t); m.title = (r.label ? r.label + ' → ' : '') + (r.col != null ? D().headers[r.col] : 'chưa ghép cột') + ' · bấm để đổi'; return m; });
  for (const c of S.cands || []) {
    if (!c.pos || S.rules.some(r => r.pos && r.pos.gi === c.pos.gi && r.pos.a === c.pos.a)) continue;
    place(c.pos, c.find, t => h('span', { class: 'dcand', 'data-cid': c.id, title: (c.label ? `“${c.label}” – ` : '') + 'bấm để chọn cột ghép vào ô này' }, t));
  }
}
/* bảng chọn cột (cố định trên màn hình, không bị khung cuộn che, không tự đóng khi đang chọn) */
function openColPicker(anchorRect, title, cur, onPick, onRemove, extra) {
  closeColPicker();
  const hint = title.label ? matchColumn(D().headers, title.label) : -1;
  const pk = h('div', { class: 'colpick', id: 'colPick' },
    h('div', { class: 'cpk-h' }, h('div', {}, h('b', {}, 'Ghép cột vào ô'), h('span', {}, title.text)), h('button', { class: 'x', onclick: closeColPicker }, '×')),
    h('div', { class: 'cpk-l' }, D().headers.map((name, j) => h('button', { class: 'cpk-i' + (cur === j ? ' on' : ''), onclick: () => { closeColPicker(); onPick(j); } },
      h('i', { style: { background: colColor(j) } }), h('span', {}, name), j === hint ? h('em', {}, 'trùng tên nhãn') : null))),
    extra || null,
    onRemove ? h('button', { class: 'btn sm', style: { marginTop: '8px' }, onclick: () => { closeColPicker(); onRemove(); } }, 'Bỏ ghép ô này') : null);
  document.body.append(pk);
  const W = Math.min(340, window.innerWidth - 16), Hh = Math.min(pk.offsetHeight, window.innerHeight - 16);
  let x = Math.min(Math.max(8, anchorRect.left), window.innerWidth - W - 8), y = anchorRect.bottom + 6;
  if (y + Hh > window.innerHeight - 8) y = Math.max(8, anchorRect.top - Hh - 6);
  Object.assign(pk.style, { left: x + 'px', top: y + 'px', width: W + 'px' });
  setTimeout(() => { document.addEventListener('pointerdown', pickOutside, true); document.addEventListener('keydown', pickEsc); }, 0);
}
function pickOutside(e) { const pk = $('#colPick'); if (pk && !pk.contains(e.target)) closeColPicker(); }
function pickEsc(e) { if (e.key === 'Escape') closeColPicker(); }
function closeColPicker() { const pk = $('#colPick'); if (pk) pk.remove(); document.removeEventListener('pointerdown', pickOutside, true); document.removeEventListener('keydown', pickEsc); }
function addPosRule(pos, find, label, col, quiet) {
  const sc = D().rows[S.sampleRow] ? D().rows[S.sampleRow].cells[col] : null;
  let r = S.rules.find(x => x.pos && x.pos.gi === pos.gi && x.pos.a === pos.a && x.pos.part === pos.part);
  if (r) { r.col = col; r.on = true; setRuleCol(r, col); }
  else { r = { id: UID++, kind: 'text', find, pos, label, col, fmt: suggestFmt(sc, null, D().headers[col]), on: true, conf: 'hi', src: 'manual', alts: [] }; S.rules.push(r); S.rules.sort((x, y) => x.pos && y.pos ? (x.pos.gi - y.pos.gi || x.pos.a - y.pos.a) : 0); }
  S.selRule = r.id; if (!quiet) render();
}
async function renderDocxView(holder) {
  const T = S.tpl;
  try {
    if (!T._docDom) {
      const tmp = h('div');
      await docx.renderAsync(new Blob([T.bytes]), tmp, null, { inWrapper: true, ignoreLastRenderedPageBreak: true, breakPages: true, renderHeaders: true, renderFooters: true });
      T._docDom = tmp;
    }
    const clone = T._docDom.cloneNode(true);
    highlightDom(clone, ruleFinds());
    markDocxPositions(clone, T);
    holder.innerHTML = ''; holder.append(clone);
    const sec = clone.querySelector('section.docx');
    if (sec) {
      const fit = Math.min(1, (holder.clientWidth - 8) / (sec.offsetWidth + 4));
      const z = S.docZoom === 'fit' || !S.docZoom ? fit : S.docZoom;
      clone.style.zoom = z.toFixed(3); const zl = $('#zoomLbl'); if (zl) zl.textContent = Math.round(z * 100) + '%';
    }
  } catch (e) {
    console.warn(e); holder.innerHTML = '';
    const finds = ruleFinds(); let last = null;
    for (const p of T.paras) {
      if (p.part !== last) { holder.append(h('div', { class: 'pg' }, docxPartLabel(p.part))); last = p.part; }
      holder.append(h('p', {}, hlText(p.text, finds)));
    }
  }
}
function hlText(text, finds) {
  const hay = cmp(text), ms = planMatches(hay, finds), frag = document.createDocumentFragment();
  let at = 0;
  for (const m of ms) {
    frag.append(text.slice(at, m.a));
    const r = S.rules.find(x => x.id === m.f.key); if (!r) continue;
    frag.append(markEl(r, text.slice(m.a, m.b)));
    at = m.b;
  }
  frag.append(text.slice(at));
  return frag;
}
const ruleFinds = () => S.rules.filter(r => r.kind === 'text' && !r.pos).map(r => ({ find: r.find, key: r.id }));
function xlsxGrid(T, withRules) {
  const wrap = h('div', {}), finds = withRules ? ruleFinds() : [];
  const dec = ref => { const m = ref.match(/^([A-Z]+)(\d+)$/); return m ? { c: XLSX.utils.decode_col(m[1]), r: +m[2] } : null; };
  for (const sh of T.sheets.slice(0, 6)) {
    const cells = T.cells.filter(c => c.sheet === sh.name).map(c => ({ ...c, p: dec(c.ref) })).filter(c => c.p);
    if (T.sheets.length > 1) wrap.append(h('div', { class: 'pg' }, 'Trang tính: ' + sh.name));
    if (!cells.length) { wrap.append(h('div', { class: 'muted small' }, '(trống)')); continue; }
    const maxR = Math.min(Math.max(...cells.map(c => c.p.r)), 150), maxC = Math.min(Math.max(...cells.map(c => c.p.c)), 25);
    const minC = Math.min(...cells.map(c => c.p.c));
    const at = {}; cells.forEach(c => at[c.p.r + ':' + c.p.c] = c);
    const tb = h('tbody');
    for (let r = 1; r <= maxR; r++) {
      const tr = h('tr', {}, h('th', {}, r));
      for (let c = minC; c <= maxC; c++) {
        const x = at[r + ':' + c];
        if (!x) { tr.append(h('td')); continue; }
        if (x.kind === 's') tr.append(h('td', {}, finds.length ? hlText(x.text, finds) : x.text));
        else {
          const rule = withRules ? S.rules.find(q => q.kind === 'num' && q.num === x.n) : null;
          let disp = Math.abs(x.n) >= 1000 && Number.isInteger(x.n) ? fmtNum(x.n, 'ndot') : String(x.n);
          if (rule && rule.col != null) { const sc = D().rows[S.sampleRow] && D().rows[S.sampleRow].cells[rule.col]; if (sc && dateParts(sc)) disp = fmtValue(sc, 'dmy'); }
          tr.append(h('td', {
            class: rule ? 'hlc' : '', style: rule ? { '--c': rule.col != null ? colColor(rule.col) : '#999', cursor: 'pointer' } : null,
            onclick: rule ? () => { S.selRule = rule.id; render(); } : null
          }, disp));
        }
      }
      tb.append(tr);
    }
    wrap.append(h('div', { style: { overflow: 'auto' } }, h('table', { class: 'xg' },
      h('thead', {}, h('tr', {}, h('th'), Array.from({ length: maxC - minC + 1 }, (_, i) => h('th', {}, XLSX.utils.encode_col(minC + i))))), tb)));
  }
  return wrap;
}
function templateView() {
  const T = S.tpl, box = h('div', { class: 'tview' });
  if (T.kind === 'docx') {
    box.classList.add('docv');
    const holder = h('div', {}, busyBox('Đang dựng trang mẫu…'));
    box.append(holder);
    setTimeout(() => renderDocxView(holder), 0);
  } else box.append(xlsxGrid(T, true));
  /* Word: bấm ô chờ / trường đã ghép để chọn cột; kéo cột thả vào ô chờ */
  if (T.kind === 'docx') {
    box.addEventListener('click', e => {
      const c = e.target.closest('.dcand'), mk = e.target.closest('mark.hl');
      if (c) {
        const cd = (S.cands || []).find(x => x.id === c.dataset.cid); if (!cd) return; e.stopPropagation();
        /* chữ thật (không phải dòng chấm) xuất hiện nhiều chỗ → cho ghép luôn các chỗ giống hệt */
        const same = /^[.\u2026_]+$/.test(cd.find) ? [] : (S.cands || []).filter(x => x !== cd && x.find === cd.find && !S.rules.some(r => r.pos && r.pos.gi === x.pos.gi && r.pos.a === x.pos.a));
        let all = true;
        const extra = same.length ? h('label', { class: 'row small', style: { gap: '6px', marginTop: '8px' } }, h('input', { type: 'checkbox', checked: true, onchange: ev => all = ev.target.checked }), `Ghép luôn ${same.length} chỗ khác có cùng chữ này`) : null;
        openColPicker(c.getBoundingClientRect(), { text: cd.label ? `${cd.label}: “${cd.find.length > 24 ? cd.find.slice(0, 24) + '…' : cd.find}”` : `“${cd.find}”`, label: cd.label }, null, j => {
          if (all) for (const x of same) addPosRule(x.pos, x.find, x.label, j, true);
          addPosRule(cd.pos, cd.find, cd.label, j);
        }, null, extra);
      }
      else if (mk) { const r = S.rules.find(x => String(x.id) === mk.dataset.rid); if (!r || !r.pos) return; e.stopPropagation(); openColPicker(mk.getBoundingClientRect(), { text: r.label ? `${r.label}` : `“${r.find}”`, label: r.label }, r.col, j => { r.col = j; setRuleCol(r, j); render(); }, () => { S.rules = S.rules.filter(x => x !== r); render(); }); }
    }, true);
    box.addEventListener('dragover', e => { const c = e.target.closest('.dcand'); if (c && [...e.dataTransfer.types].includes('text/qtt-col')) { e.preventDefault(); c.classList.add('dragover'); } });
    box.addEventListener('dragleave', e => { const c = e.target.closest && e.target.closest('.dcand'); if (c) c.classList.remove('dragover'); });
    box.addEventListener('drop', e => { const c = e.target.closest('.dcand'); if (!c) return; const v = e.dataTransfer.getData('text/qtt-col'); const cd = (S.cands || []).find(x => x.id === c.dataset.cid); if (v === '' || !cd) return; e.preventDefault(); addPosRule(cd.pos, cd.find, cd.label, +v); });
  }
  /* bôi đen để thêm trường */
  box.addEventListener('mouseup', e => setTimeout(() => {
    if (e.target.closest && e.target.closest('.selpop')) return;
    $$('.selpop', box).forEach(x => x.remove());
    const sel = window.getSelection(); if (!sel || sel.isCollapsed) return;
    const txt = nfc(sel.toString()).replace(/\s+/g, ' ').trim();
    if (!txt || txt.length > 200) return;
    if (T.kind === 'docx') {
      /* Word: ghép đúng chỗ đã bôi đen (không thay mọi chỗ trùng chữ) */
      const rg = sel.getRangeAt(0), p = rg.startContainer.parentElement && rg.startContainer.parentElement.closest('p[data-gi]');
      const P = p && T.paras.find(x => x.part === 'word/document.xml' && x.gi === +p.dataset.gi);
      if (P) {
        const pre = document.createRange(); pre.setStart(p, 0); pre.setEnd(rg.startContainer, rg.startOffset);
        const raw = cmp(nfc(sel.toString())), nth = occIndex(cmp(p.textContent), raw, pre.toString().length);
        const t = cmp(P.text); let i = -1, from = 0; for (let k = 0; k <= nth; k++) { i = t.indexOf(raw, from); if (i < 0) break; from = i + raw.length; }
        if (i >= 0) { const rr = rg.getBoundingClientRect(); openColPicker(rr, { text: `“${txt.length > 30 ? txt.slice(0, 30) + '…' : txt}”`, label: '' }, null, j => { sel.removeAllRanges(); addPosRule({ part: P.part, gi: P.gi, a: i }, raw, '', j); }); return; }
      }
    }
    const rr = sel.getRangeAt(0).getBoundingClientRect(), br = box.getBoundingClientRect();
    let col = null;
    const pop = h('div', { class: 'selpop', style: { left: Math.max(4, rr.left - br.left) + 'px', top: (rr.bottom - br.top + box.scrollTop + 6) + 'px' } },
      h('span', {}, 'Ghép “', h('b', {}, txt.length > 30 ? txt.slice(0, 30) + '…' : txt), '” với'), colSelect(null, v => col = v),
      h('button', { class: 'btn sm pri', onclick: () => { if (col == null) { toast('Chọn cột trước đã.'); return; } addManualRule(txt, col); } }, 'Thêm'),
      h('button', { class: 'x', onclick: () => pop.remove() }, '×'));
    box.append(pop);
  }, 10));
  return box;
}
function addManualRule(txt, col) {
  const ex = S.rules.find(r => r.kind === 'text' && cmp(r.find) === cmp(txt));
  const sc = D().rows[S.sampleRow] ? D().rows[S.sampleRow].cells[col] : null;
  if (ex) { ex.col = col; ex.on = true; ex.fmt = suggestFmt(sc, txt); ex.conf = 'hi'; S.selRule = ex.id; }
  else {
    if (!cmp(S.tpl.text).includes(cmp(txt))) toast('Lưu ý: không tìm thấy đúng đoạn này trong mẫu (có thể khác dấu cách).', 4000);
    const r = { id: UID++, kind: 'text', find: txt, col, fmt: suggestFmt(sc, txt), on: true, conf: 'hi', src: 'manual', alts: [] };
    S.rules.push(r); S.selRule = r.id;
  }
  render();
}
function setRuleCol(r, j) {
  const c = D().rows[S.sampleRow] ? D().rows[S.sampleRow].cells[j] : null;
  r.fmt = r.kind === 'num' ? 'raw' : r.src === 'mk' ? markerFmt(j) : suggestFmt(c, r.find, D().headers[j]);
  r.on = true; if (r.conf === 'dup' || r.conf === 'nomatch') r.conf = 'hi';
}
function ruleItem(r) {
  const d = D(), cnt = ruleCount(r);
  const sc = r.col != null && d.rows[S.sampleRow] ? d.rows[S.sampleRow].cells[r.col] : null;
  let label;
  if (r.kind === 'num') {
    const refs = S.tpl.cells.filter(c => c.kind === 'n' && c.n === r.num).map(c => c.ref).slice(0, 3).join(', ');
    label = `Ô số ${refs}: ${sc && dateParts(sc) ? fmtValue(sc, 'dmy') : (Math.abs(r.num) >= 1000 ? fmtNum(r.num, 'ndot') : r.num)}`;
  } else label = r.pos ? `${r.label || 'Ô trong mẫu'} · “${r.find.length > 18 ? r.find.slice(0, 18) + '…' : r.find}”` : r.src === 'mk' ? r.find : `“${r.find}”`;
  const badges = [h('span', {}, cnt ? `${cnt} chỗ trong mẫu` : 'Không thấy trong mẫu')];
  if (r.conf === 'lo') badges.push(h('span', { class: 'warn' }, '· Cần soát: giá trị ngắn, dễ trùng'));
  if (r.conf === 'dup' && r.alts.length) badges.push(h('span', { class: 'warn' }, '· Trùng giá trị với cột ' + r.alts.map(j => d.headers[j]).join(', ')));
  if (r.conf === 'nomatch' && r.col == null) badges.push(h('span', { class: 'warn' }, '· Chưa có cột cùng tên – chọn cột, hoặc để tắt nếu không phải trường'));
  if (r.src === 'manual') badges.push(h('span', {}, '· Tự thêm'));
  const card = h('div', { class: 'rule' + (r.on ? '' : ' off') + (S.selRule === r.id ? ' sel' : ''), 'data-id': String(r.id), style: { borderLeft: `4px solid ${r.col != null ? colColor(r.col) : 'var(--line2)'}` } },
    h('span', { class: 'handle', draggable: 'true', title: 'Kéo để sắp xếp' }, '⋮⋮'),
    h('div', { class: 'find' }, h('span', { class: 'q', title: r.find }, label), h('div', { class: 'm' }, badges)),
    h('div', { class: 'acts' },
      h('label', { class: 'sw', title: r.on ? 'Đang dùng – bấm để bỏ qua' : 'Đang bỏ qua – bấm để dùng' }, h('input', { type: 'checkbox', checked: r.on, onchange: e => { r.on = e.target.checked; render(); } }), h('b')),
      h('button', { class: 'x', title: 'Xóa trường', onclick: () => { S.rules = S.rules.filter(x => x !== r); render(); } }, '×')),
    h('div', { class: 'slot' },
      colSelect(r.col, v => { r.col = v; if (v != null) setRuleCol(r, v); render(); }),
      fmtSelect(r.fmt, v => { r.fmt = v; render(); }, r.kind === 'num' || (S.tpl.kind === 'xlsx' && r.src === 'mk')),
      sc ? h('div', { class: 'val', title: 'Kết quả với dòng mẫu' }, 'Dòng mẫu → ', h('b', {}, (r.kind === 'num' && r.fmt === 'raw' ? sc.d : fmtValue(sc, r.fmt)) || '(trống)')) : null));
  colDrop(card, j => { r.col = j; setRuleCol(r, j); render(); });
  const hd = card.querySelector('.handle');
  hd.addEventListener('dragstart', e => { e.dataTransfer.setData('text/qtt-rule', String(r.id)); e.dataTransfer.effectAllowed = 'move'; });
  card.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('text/qtt-rule')) { e.preventDefault(); card.classList.add('drop-before'); } });
  card.addEventListener('dragleave', () => card.classList.remove('drop-before'));
  card.addEventListener('drop', e => {
    card.classList.remove('drop-before');
    const id = +e.dataTransfer.getData('text/qtt-rule'); if (!id || id === r.id) return;
    e.preventDefault();
    const mv = S.rules.find(x => x.id === id); S.rules = S.rules.filter(x => x !== mv);
    S.rules.splice(S.rules.indexOf(r), 0, mv); render();
  });
  card.addEventListener('click', e => { if (e.target.closest('select,input,button,.handle')) return; S.selRule = r.id; $$('mark.hl').forEach(m => m.classList.toggle('sel', m.dataset.rid === String(r.id))); $$('.rule').forEach(x => x.classList.toggle('sel', x === card)); const mk = $(`mark.hl[data-rid="${r.id}"]`); if (mk) mk.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  return card;
}
function viewMapText() {
  const d = D();
  const lo = S.rules.filter(r => r.on && (r.conf === 'lo' || r.conf === 'dup')).length;
  const nOn = activeRules().length;
  const head = mapHeader();
  const isDoc = S.tpl.kind === 'docx', nC = (S.cands || []).filter(c => !S.rules.some(r => r.pos && r.pos.gi === c.pos.gi && r.pos.a === c.pos.a)).length;
  const zoomBar = isDoc ? h('div', { class: 'row', style: { gap: '4px' } },
    h('button', { class: 'btn sm', title: 'Thu nhỏ', onclick: () => { S.docZoom = Math.max(0.4, (typeof S.docZoom === 'number' ? S.docZoom : 0.8) - 0.1); render(); } }, '−'),
    h('span', { class: 'small', id: 'zoomLbl', style: { minWidth: '42px', textAlign: 'center' } }, ''),
    h('button', { class: 'btn sm', title: 'Phóng to', onclick: () => { S.docZoom = Math.min(2, (typeof S.docZoom === 'number' ? S.docZoom : 0.8) + 0.1); render(); } }, '+'),
    h('button', { class: 'btn sm', onclick: () => { S.docZoom = 'fit'; render(); } }, 'Vừa khung')) : null;
  const left = h('div', { class: 'card' }, h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center' } }, h('h3', { style: { margin: 0 } }, 'Trang mẫu'), zoomBar),
    h('p', { class: 'sub small' }, isDoc && S.mode === 'value'
      ? (nC ? `Ô viền xanh là chỗ chờ điền (${nC} ô): bấm vào ô để chọn cột, hoặc kéo cột thả vào ô. Muốn ghép chỗ khác thì bôi đen đoạn chữ đó.` : 'Bôi đen đoạn chữ cần thay để chọn cột ghép vào đúng chỗ đó.')
      : 'Ô tô màu là chỗ sẽ được thay, màu theo cột đã ghép. Bấm vào ô để xem trường tương ứng.'), templateView());
  let txt = '', col = null;
  const right = h('div', { class: 'card' }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h3', { style: { margin: 0 } }, `Các trường (${nOn}/${S.rules.length} đang dùng)`),
    S.rules.length ? h('button', { class: 'btn sm ghost', onclick: () => { S.rules.forEach(r => r.on = r.col != null); render(); } }, 'Bật tất cả') : null),
    lo ? h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, `Có ${lo} trường cần soát lại (giá trị ngắn hoặc trùng giữa các cột). Hãy chắc chắn ghép đúng cột trước khi tạo file.`)) : null,
    S.rules.length ? h('div', { class: 'rules' }, S.rules.map(r => ruleItem(r)))
      : h('div', { class: 'note' }, h('span', {}, 'ℹ'), h('span', {}, S.tpl.kind === 'docx' ? 'Chưa ghép ô nào. Bấm vào các ô viền xanh trên trang mẫu (hoặc bôi đen đoạn chữ) để chọn cột.' : 'Chưa có trường nào. Hãy chọn đúng dòng mà file mẫu được làm từ ở phía trên, hoặc bôi đen đoạn chữ trong mẫu để tự thêm.')),
    h('div', { class: 'lbl', style: { marginTop: '16px' } }, 'Thêm trường thủ công'),
    h('div', { class: 'addman' }, h('input', { class: 'inp', placeholder: 'Đoạn chữ trong mẫu cần thay…', oninput: e => txt = e.target.value }), colSelect(null, v => col = v),
      h('button', { class: 'btn sm', onclick: () => { const t = nfc(txt).trim(); if (!t || col == null) { toast('Nhập đoạn chữ và chọn cột.'); return; } addManualRule(t, col); } }, '+ Thêm')));
  return h('div', {}, head, h('div', { class: 'grid2 mapgrid' + (isDoc ? ' wide' : ''), style: { marginTop: '16px' } }, left, right), navBar('Xem thử'));
}

/* --- mẫu PDF / ảnh: khung chữ --- */
function previewTextOf(b) {
  const row = D().rows[S.sampleRow];
  if (b.col != null && row) return fmtValue(row.cells[b.col], b.fmt) || '';
  return b.orig || 'Ô chữ';
}
function drawOverlay() {
  const stage = $('#bxStage'); if (!stage) return;
  const T = S.tpl, P = T.pages[S.page];
  const sheet = $('.sheet', stage), ovl = $('.ovl', stage);
  const maxW = Math.max(200, stage.clientWidth - 26);
  const W = Math.min(maxW, P.h > P.w ? Math.min(maxW, 820) : maxW);
  sheet.style.width = W + 'px';
  const k = W / P.w; S._k = k;
  ovl.innerHTML = '';
  /* ô chờ: chỗ có vẻ là giá trị cần điền – bấm (hoặc thả cột vào) để tạo khung */
  const ov = (c, b) => b.page === c.page && Math.max(0, Math.min(c.x + c.w, b.x + b.w) - Math.max(c.x, b.x)) * Math.max(0, Math.min(c.y + c.h, b.y + b.h) - Math.max(c.y, b.y)) > 0.3 * c.w * c.h;
  (S.cands || []).forEach(c => {
    if (c.page !== S.page || S.boxes.some(b => ov(c, b))) return;
    const e = h('div', { class: 'cand', title: `Ô chờ: “${c.text}” – bấm để tạo khung, hoặc kéo cột thả vào`, style: { left: (c.x - 1) * k + 'px', top: (c.y - 1) * k + 'px', width: (c.w + 2) * k + 'px', height: (c.h + 2) * k + 'px' } }, h('span', { class: 'cp' }, '+'));
    const make = col => { const bx = boxFromMatch(T, c.page, c.a, c.b); if (!bx) return; const b = { id: UID++, ...bx, orig: c.text, cover: true, col: null, fmt: 'raw', on: true, conf: 'hi', src: 'manual' }; S.boxes.push(b); S.selBox = b.id; if (col != null) setBoxCol(b, col); refreshBoxUI(); };
    e.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); make(null); toast(`Đã tạo khung cho “${c.text}” – chọn cột để thay.`); });
    colDrop(e, j => make(j));
    ovl.append(e);
  });
  S.boxes.forEach((b, idx) => {
    if (b.page !== S.page) return;
    const c = b.col != null ? colColor(b.col) : '#8a8a8a';
    const e = h('div', { class: 'bx' + (S.selBox === b.id ? ' sel' : '') + (b.on ? '' : ' off'), 'data-id': String(b.id), style: { left: b.x * k + 'px', top: b.y * k + 'px', width: b.w * k + 'px', height: b.h * k + 'px', '--c': c, background: b.cover && !smartErase(T, b) ? (rectFor(b) ? b.bg : 'rgba(255,255,255,.82)') : 'transparent' } });
    const base = b.baseOff != null ? b.baseOff : (b.h + b.size * 0.7) / 2;
    if (b.on && smartErase(T, b)) { try { const pt = erasedPatch(P, b); if (!pt.url) pt.url = pt.canvas.toDataURL(); e.append(h('img', { src: pt.url, alt: '', style: { position: 'absolute', left: (pt.x - b.x) * k + 'px', top: (pt.y - b.y) * k + 'px', width: pt.w * k + 'px', height: pt.h * k + 'px', pointerEvents: 'none', maxWidth: 'none' } })); } catch (er) { console.warn(er); } }
    const tx = h('div', {
      class: 'tx', style: {
        position: 'absolute', top: (base - b.size * 0.84) * k + 'px', width: 'auto', fontFamily: CSS_FAM(b), fontWeight: b.bold ? '700' : '400', fontStyle: b.italic ? 'italic' : 'normal',
        fontSize: b.size * k + 'px', color: b.color, left: b.align === 'left' ? '0' : b.align === 'center' ? '50%' : 'auto', right: b.align === 'right' ? '0' : 'auto',
        transform: b.align === 'center' ? 'translateX(-50%)' : 'none'
      }
    }, previewTextOf(b));
    e.append(tx, h('span', { class: 'nb' }, `${idx + 1}${b.col != null ? ' · ' + D().headers[b.col] : ''}`), h('span', { class: 'rz' }));
    colDrop(e, j => setBoxCol(b, j));
    ovl.append(e);
  });
}
const rectFor = b => b.cover && (smartErase(S.tpl, { ...b, flat: false }) ? !!b.flat : (S.tpl.kind === 'image' || !S.tpl.hasText || b.forceRect));
const isUpperText = s => !!s && /\p{L}{2}/u.test(s) && s === s.toLocaleUpperCase('vi') && s !== s.toLocaleLowerCase('vi');
function setBoxCol(b, j) { b.col = j; const c = D().rows[S.sampleRow] ? D().rows[S.sampleRow].cells[j] : null; b.fmt = S.mode === 'marker' && b.src === 'auto' ? markerFmt(j) : suggestFmt(c, b.orig, D().headers[j]);
  if (b.fmt === 'raw' && isUpperText(b.orig) && !dateParts(c) && numOf(c) == null) b.fmt = 'upper';
  b.on = true; if (b.conf === 'nomatch') b.conf = 'hi'; S.selBox = b.id; refreshBoxUI(); }
function resample(b, withFg) {
  const P = S.tpl.pages[b.page];
  const sc = sampleColors(P.canvas, P.scale, b);
  if (sc) { if (b.autoBg !== false) b.bg = sc.bg; if (withFg && sc.fg) b.color = sc.fg; }
}
function bindStage(ovl) {
  let mode = null, st = null, ghost = null, bx = null, moved = false;
  const pt = e => { const r = ovl.getBoundingClientRect(); return { x: (e.clientX - r.left) / S._k, y: (e.clientY - r.top) / S._k }; };
  ovl.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const p = pt(e), be = e.target.closest('.bx');
    moved = false;
    if (be) {
      bx = S.boxes.find(x => x.id === +be.dataset.id); if (!bx) return;
      if (S.selBox !== bx.id) { S.selBox = bx.id; $$('.bx', ovl).forEach(x => x.classList.toggle('sel', x === be)); }
      mode = e.target.classList.contains('rz') ? 'rz' : 'mv';
      st = { p, x: bx.x, y: bx.y, w: bx.w, h: bx.h, el: be };
    } else {
      mode = 'draw'; st = { p }; ghost = h('div', { class: 'bx-ghost' }); ovl.append(ghost);
    }
    ovl.setPointerCapture(e.pointerId); e.preventDefault();
  });
  ovl.addEventListener('pointermove', e => {
    if (!mode) return;
    const p = pt(e), dx = p.x - st.p.x, dy = p.y - st.p.y, k = S._k, P = S.tpl.pages[S.page];
    if (Math.abs(dx) * k > 2 || Math.abs(dy) * k > 2) moved = true;
    if (mode === 'draw') {
      const x = Math.min(p.x, st.p.x), y = Math.min(p.y, st.p.y);
      Object.assign(ghost.style, { left: x * k + 'px', top: y * k + 'px', width: Math.abs(dx) * k + 'px', height: Math.abs(dy) * k + 'px' });
    } else if (mode === 'mv') {
      bx.x = Math.max(-bx.w / 2, Math.min(P.w - bx.w / 2, st.x + dx)); bx.y = Math.max(-bx.h / 2, Math.min(P.h - bx.h / 2, st.y + dy));
      st.el.style.left = bx.x * k + 'px'; st.el.style.top = bx.y * k + 'px';
    } else {
      bx.w = Math.max(6 / k, st.w + dx); bx.h = Math.max(6 / k, st.h + dy);
      st.el.style.width = bx.w * k + 'px'; st.el.style.height = bx.h * k + 'px';
    }
  });
  const end = e => {
    if (!mode) return;
    const p = pt(e), k = S._k;
    if (mode === 'draw') {
      ghost.remove();
      const w = Math.abs(p.x - st.p.x), hh = Math.abs(p.y - st.p.y);
      const T = S.tpl, click = w * k <= 6 && hh * k <= 6;
      const snap = T.kind === 'pdf' && T.hasText ? snapRegion(T, S.page, click ? { x: p.x - 2 / k, y: p.y - 2 / k, w: 4 / k, h: 4 / k } : { x: Math.min(p.x, st.p.x), y: Math.min(p.y, st.p.y), w, h: hh }, click) : null;
      if (snap) {
        const b = { id: UID++, ...snap, col: null, fmt: 'raw', on: true, conf: 'hi', src: 'manual' };
        S.boxes.push(b); S.selBox = b.id;
        toast(b.orig ? `Đã bắt theo chữ cũ “${b.orig}” – chọn cột để thay.` : 'Vùng dòng chấm: giữ dòng chấm, chữ mới viết lên trên.');
      } else if (w * k > 12 && hh * k > 8) {
        const b = { id: UID++, page: S.page, x: Math.min(p.x, st.p.x), y: Math.min(p.y, st.p.y), w, h: hh, size: Math.round(hh * 0.62 * 10) / 10, font: 'serif', bold: false, italic: false, align: 'left', cover: true, bg: '#ffffff', color: '#231e19', col: null, fmt: 'raw', on: true, conf: 'hi', src: 'manual', orig: '' };
        resample(b, true);
        if (b.color.toLowerCase() === b.bg.toLowerCase()) b.color = '#231e19';
        const P0 = T.pages[S.page], ik = inkStyle(P0.canvas, P0.scale, b);
        if (ik) { /* bắt theo chữ cũ: cỡ, đậm, màu, đường chân chữ, vị trí bắt đầu */
          b.size = Math.round(ik.size * 2) / 2; b.bold = ik.bold; b.color = ik.color;
          const nx = Math.max(b.x, ik.x0 - ik.size * 0.05); b.w -= nx - b.x; b.x = nx;
          b.baseOff = ik.baseline - b.y; b.orig = '';
          const fr = freeRightOf(P0.canvas, P0.scale, b, ik); if (fr) b.maxW = Math.max(b.w, fr - b.x - ik.size * 0.4);
          toast(`Đã bắt theo chữ cũ: cỡ ${b.size}, ${b.bold ? 'chữ đậm' : 'chữ thường'}. Chữ cũ sẽ được xoá, giữ nền và dòng chấm.`, 4000);
        }
        S.boxes.push(b); S.selBox = b.id;
      } else S.selBox = null;
      refreshBoxUI();
    } else {
      if (moved) { resample(bx, false); }
      refreshBoxUI();
    }
    mode = null;
  };
  ovl.addEventListener('pointerup', end);
  ovl.addEventListener('pointercancel', end);
}
function seg(opts, cur, onch) {
  return h('div', { class: 'seg' }, opts.map(([v, l, t]) => h('button', { class: cur === v ? 'on' : '', title: t || '', onclick: () => onch(v) }, l)));
}
const needFont = b => b.on && b.fontWarn && !b.fontPicked && b.font !== 'local';
const FONT_NAME = { serif: 'Có chân – giống Times New Roman', sans: 'Không chân – giống Arial' };
function fontField(b) {
  const pick = v => { b.font = v; b.localFamily = null; b.fontPicked = true; refreshBoxUI(); };
  const segF = seg([['serif', 'Có chân', 'Giống Times New Roman'], ['sans', 'Không chân', 'Giống Arial']], b.font === 'sans' ? 'sans' : 'serif', pick);
  const src = b.srcFont ? srcFontLabel(b.srcFont) : '';
  if (b.font === 'local' && b.localFamily) return h('div', { class: 'full muted small', style: { gridColumn: '1/-1' } }, 'Phông chữ: ', h('b', {}, b.localFamily), ' (đúng phông gốc trên máy)');
  if (needFont(b)) return h('div', { class: 'full fontwarn', style: { gridColumn: '1/-1' } }, h('div', {}, h('b', {}, '⚠ Chưa có phông gần giống phông gốc'), h('span', {}, (src ? `Chữ mẫu dùng ${src}. ` : '') + 'Chọn phông trông giống chữ mẫu nhất cho khung này:')), segF);
  if (!S.tpl.hasText || !b.srcFont) return h('label', { class: 'full' }, 'Phông chữ', segF);
  return h('div', { class: 'full muted small', style: { gridColumn: '1/-1' } }, 'Phông chữ: tự dùng ', h('b', {}, FONT_NAME[b.font === 'sans' ? 'sans' : 'serif']), ` – gần giống phông gốc ${src}. `, h('a', { href: '#', onclick: e => { e.preventDefault(); pick(b.font === 'sans' ? 'serif' : 'sans'); } }, 'Đổi sang ' + (b.font === 'sans' ? 'có chân' : 'không chân')));
}
function boxProps() {
  const b = S.boxes.find(x => x.id === S.selBox);
  const wrap = h('div', { id: 'bxProps' });
  if (!b) { wrap.append(h('div', { class: 'note' }, h('span', {}, 'ℹ'), h('span', {}, S.tpl.hasText ? 'Bấm vào chữ cũ trên trang để tạo khung bắt theo chữ đó, hoặc kéo khung quanh vùng cần điền (vùng dòng chấm được giữ nguyên). Chọn một khung để chỉnh; kéo góc dưới bên phải để đổi cỡ.' : 'Chọn một khung trên trang để chỉnh. Kéo chuột ở chỗ trống để thêm khung mới; kéo góc dưới bên phải để đổi cỡ.'))); return wrap; }
  const upd = (fn, full) => { fn(); full ? refreshBoxUI() : (drawOverlay(), drawBoxList()); };
  const idx = S.boxes.indexOf(b) + 1;
  const textPdf = S.tpl.kind === 'pdf' && S.tpl.hasText;
  const fontOpts = [['serif', 'Có chân', 'Giống Times New Roman'], ['sans', 'Không chân', 'Giống Arial']];
  const pickLocal = async () => {
    try { await loadLocalFonts(); } catch (e) { toast(e.message, 4500); return; }
    if (!b.localFamily) b.localFamily = localMatch(b.srcFont) || LOCALF.list.find(f => /times new roman/i.test(f)) || LOCALF.list[0];
    b.font = 'local'; await ensureLocalFont(b); refreshBoxUI();
  };
  wrap.append(...[h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '14px' } }, h('h3', { style: { margin: 0 } }, `Khung ${idx}`),
    h('div', { class: 'row', style: { gap: '4px' } },
      h('button', { class: 'btn sm', onclick: () => { const c = { ...b, id: UID++, y: b.y + b.h * 1.4, src: 'manual', orig: '' }; S.boxes.push(c); S.selBox = c.id; resample(c, false); refreshBoxUI(); } }, 'Nhân bản'),
      h('button', { class: 'btn sm', onclick: () => { S.boxes = S.boxes.filter(x => x !== b); S.selBox = null; refreshBoxUI(); } }, 'Xóa'))),
    b.orig ? h('div', { class: 'muted small', style: { marginTop: '4px' } }, 'Chữ gốc trong mẫu: “' + b.orig + '”') : null,
    h('div', { class: 'props' },
      h('label', { class: 'full' }, 'Cột dữ liệu', colSelect(b.col, v => upd(() => { if (v == null) b.col = null; else setBoxCol(b, v); }, true))),
      h('label', { class: 'full' }, 'Định dạng', fmtSelect(b.fmt, v => upd(() => b.fmt = v))),
      fontField(b),
      h('label', {}, 'Kiểu', h('div', { class: 'seg' },
        h('button', { class: b.bold ? 'on' : '', onclick: async () => { b.bold = !b.bold; await ensureLocalFont(b); refreshBoxUI(); } }, h('b', {}, 'Đậm')),
        h('button', { class: b.italic ? 'on' : '', onclick: async () => { b.italic = !b.italic; await ensureLocalFont(b); refreshBoxUI(); } }, h('i', {}, 'Nghiêng')))),
      h('label', {}, 'Cỡ chữ', h('input', { class: 'inp', type: 'number', min: '2', max: '400', step: '0.5', value: String(b.size), oninput: e => { const v = +e.target.value; if (v > 0) upd(() => b.size = v); } })),
      h('label', {}, 'Màu chữ', h('input', { type: 'color', value: b.color, oninput: e => upd(() => b.color = e.target.value) })),
      h('label', { class: 'full' }, 'Căn lề', seg([['left', 'Trái'], ['center', 'Giữa'], ['right', 'Phải']], b.align, v => upd(() => b.align = v, true))),
      h('label', { class: 'full' }, 'Khi chữ dài hơn chỗ trống', seg([['auto', 'Co nhỏ cho vừa'], ['none', 'Giữ nguyên cỡ chữ']], b.fit === 'none' ? 'none' : 'auto', v => upd(() => b.fit = v === 'none' ? 'none' : undefined, true))),
      h('label', { class: 'inl full' }, h('input', { type: 'checkbox', checked: b.cover, onchange: e => upd(() => b.cover = e.target.checked, true) }), textPdf || smartErase(S.tpl, { ...b, cover: true, flat: false }) ? 'Xoá chữ cũ trong khung (không phủ nền, giữ hoa văn, dòng chấm)' : 'Phủ chữ cũ bằng màu nền'),
      !textPdf && b.cover ? h('label', { class: 'inl full' }, h('input', { type: 'checkbox', checked: !!b.flat, onchange: e => upd(() => b.flat = e.target.checked, true) }), 'Phủ bằng một màu nền phẳng (dùng khi xoá chưa sạch)') : null,
      textPdf && b.cover ? h('label', { class: 'inl full' }, h('input', { type: 'checkbox', checked: !!b.forceRect, onchange: e => upd(() => b.forceRect = e.target.checked, true) }), 'Phủ thêm màu nền (chỉ khi chữ cũ là hình ảnh)') : null,
      rectFor(b) ? h('label', {}, 'Màu nền phủ', h('input', { type: 'color', value: b.bg, oninput: e => upd(() => { b.bg = e.target.value; b.autoBg = false; }) })) : null,
      rectFor(b) ? h('label', {}, ' ', h('button', { class: 'btn sm', onclick: () => upd(() => { b.autoBg = true; resample(b, false); }, true) }, 'Lấy lại màu nền')) : null,
      h('div', { class: 'row', style: { gap: '6px', gridColumn: '1/-1' } },
        h('button', { class: 'btn sm', title: 'Phông, đậm/nghiêng, màu chữ của khung này áp cho mọi khung', onclick: async () => { for (const x of S.boxes) if (x !== b) { Object.assign(x, { font: b.font, localFamily: b.localFamily, bold: b.bold, italic: b.italic, color: b.color, fontPicked: true }); await ensureLocalFont(x); } refreshBoxUI(); toast('Đã áp phông và màu cho mọi khung.'); } }, 'Áp phông & màu này cho mọi khung'),
        h('button', { class: 'btn sm', onclick: async () => { for (const x of S.boxes) if (x !== b) { Object.assign(x, { font: b.font, localFamily: b.localFamily, bold: b.bold, italic: b.italic, color: b.color, size: b.size, fontPicked: true }); await ensureLocalFont(x); } refreshBoxUI(); toast('Đã áp kiểu (gồm cỡ chữ) cho mọi khung.'); } }, '… kèm cỡ chữ')))].filter(Boolean));
  return wrap;
}
function drawBoxList() {
  const list = $('#bxList'); if (!list) return;
  list.innerHTML = '';
  if (!S.boxes.length) { list.append(h('div', { class: 'muted small' }, 'Chưa có khung nào.')); return; }
  S.boxes.forEach((b, i) => {
    const it = h('div', { class: 'bxitem' + (S.selBox === b.id ? ' sel' : ''), onclick: e => { if (e.target.closest('.sw')) return; S.selBox = b.id; if (S.page !== b.page) { S.page = b.page; render(); } else refreshBoxUI(); } },
      h('span', { class: 'k', style: { background: b.col != null ? colColor(b.col) : '#8a8a8a' } }, i + 1),
      h('div', { class: 'd' }, h('b', {}, b.col != null ? D().headers[b.col] : 'Chưa ghép cột'),
        h('span', {}, (S.tpl.pages.length > 1 ? `Trang ${b.page + 1} · ` : '') + (b.orig ? `“${b.orig}”` : b.cover === false ? 'Vùng dòng chấm' : 'Khung tự thêm') + (needFont(b) ? ' · ⚠ chọn phông' : '') + (b.conf === 'lo' ? ' · cần soát' : b.conf === 'nomatch' && b.col == null ? ' · chưa có cột cùng tên' : ''))),
      h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: b.on, onchange: e => { b.on = e.target.checked; refreshBoxUI(); } }), h('b')));
    colDrop(it, j => setBoxCol(b, j));
    list.append(it);
  });
}
function refreshBoxUI() {
  histSoon();
  drawOverlay(); drawBoxList();
  const bc = $('#bxCount'); if (bc) bc.textContent = `Khung chữ (${activeBoxes().length}/${S.boxes.length} đang dùng)`;
  const p = $('#bxProps'); if (p) p.replaceWith(boxProps());
  const fw = $('#fontWarn'), wn = S.boxes.filter(needFont).length; if (fw) { if (!wn) fw.remove(); else fw.querySelector('b').textContent = `${wn} khung chưa có phông gần giống phông gốc. `; }
  renderSteps();
}
function viewMapBox() {
  const T = S.tpl;
  const extra = !T.hasText ? h('div', { class: 'note' }, h('span', {}, 'ℹ'), h('span', {}, T.kind === 'image' ? 'File ảnh không có lớp chữ. Kéo khung bao quanh chữ cũ cần thay (rộng hơn chữ một chút) rồi ghép cột: công cụ tự bắt cỡ chữ, độ đậm, màu, đường chân chữ và xoá chữ cũ – giữ nguyên nền, hoa văn, dòng chấm.' : 'PDF này không có lớp chữ. Kéo khung bao quanh chữ cũ cần thay (rộng hơn chữ một chút) rồi ghép cột: công cụ tự bắt cỡ chữ, độ đậm, màu, đường chân chữ và xoá chữ cũ – giữ nguyên nền, hoa văn, dòng chấm.')) : null;
  const head = mapHeader(extra);
  const pgnav = T.pages.length > 1 ? h('div', { class: 'pgnav' },
    h('button', { class: 'btn sm', disabled: S.page === 0, onclick: () => { S.page--; render(); } }, '‹'),
    h('span', { class: 'small' }, `Trang ${S.page + 1}/${T.pages.length}`),
    h('button', { class: 'btn sm', disabled: S.page >= T.pages.length - 1, onclick: () => { S.page++; render(); } }, '›')) : null;
  const P = T.pages[S.page];
  const sheet = h('div', { class: 'sheet' }); P.canvas.style.width = '100%'; P.canvas.style.height = 'auto';
  const ovl = h('div', { class: 'ovl' });
  sheet.append(P.canvas, ovl);
  const stage = h('div', { class: 'stage', id: 'bxStage' }, sheet);
  bindStage(ovl);
  const left = h('div', { class: 'card' }, h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '10px' } }, h('h3', { style: { margin: 0 } }, 'Trang mẫu'), pgnav), stage);
  const warnN = S.boxes.filter(needFont).length;
  const fwarn = warnN ? h('div', { class: 'note warn', id: 'fontWarn' }, h('span', {}, '⚠'), h('span', {}, h('b', {}, `${warnN} khung chưa có phông gần giống phông gốc. `), 'Công cụ tạm dùng phông gần nhất; hãy bấm từng khung có dấu ⚠ để chọn phông trông giống chữ mẫu.')) : null;
  const right = h('div', { class: 'card' }, fwarn, h('h3', { id: 'bxCount' }, `Khung chữ (${activeBoxes().length}/${S.boxes.length} đang dùng)`),
    h('div', { class: 'bxlist', id: 'bxList' }), boxProps());
  const view = h('div', {}, head, h('div', { class: 'bx-wrap', style: { marginTop: '16px' } }, left, right), navBar('Xem thử'));
  setTimeout(() => { drawOverlay(); drawBoxList(); }, 0);
  return view;
}

/* ---------- BƯỚC 4: xem thử ---------- */
let PV_TOKEN = 0;
function selIdx() { return [...D().sel].sort((a, b) => a - b); }
function viewPreview() {
  const idxs = selIdx();
  S.pv = Math.max(0, Math.min(S.pv, idxs.length - 1));
  const ri = idxs[S.pv];
  const sel = h('select', { class: 'inp', style: { maxWidth: '340px' }, onchange: e => { S.pv = +e.target.value; render(); } },
    idxs.slice(0, 3000).map((i, k) => h('option', { value: String(k), selected: k === S.pv }, rowLabel(i))));
  const bar = h('div', { class: 'pvbar' },
    h('button', { class: 'btn sm', disabled: S.pv === 0, onclick: () => { S.pv--; render(); } }, '‹ Trước'), sel,
    h('button', { class: 'btn sm', disabled: S.pv >= idxs.length - 1, onclick: () => { S.pv++; render(); } }, 'Sau ›'),
    h('span', { class: 'muted small' }, `Bản ${S.pv + 1}/${idxs.length}`));
  const area = h('div', { class: 'prev', style: { maxHeight: '760px' } }, busyBox('Đang dựng bản xem thử…'));
  const row = D().rows[ri], sample = D().rows[S.sampleRow];
  const items = engine() === 'box' ? activeBoxes().map((b, i) => [D().headers[b.col], fmtValue(row.cells[b.col], b.fmt), b.orig])
    : activeRules().map(r => [D().headers[r.col], r.kind === 'num' && r.fmt === 'raw' ? row.cells[r.col].d : fmtValue(row.cells[r.col], r.fmt), r.kind === 'num' ? null : r.find]);
  const kv = h('table', { class: 'kv' }, h('tbody', {}, items.map(([k, v, old]) => h('tr', {}, h('td', {}, k), h('td', {}, old && old !== v ? h('span', { class: 'old' }, old) : null, v || h('i', { class: 'muted' }, '(trống)'))))));
  const empty = items.filter(x => !x[1]).length;
  const side = h('div', { class: 'card' }, h('h3', {}, 'Giá trị được điền'), kv, h('div', { id: 'pvWarn' }),
    empty ? h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, `Dòng này có ${empty} ô trống, chỗ tương ứng trong văn bản sẽ để trống.`)) : null);
  const main = h('div', { class: 'card' }, h('h2', {}, 'Xem thử kết quả'), h('p', { class: 'sub' }, 'Đây là bản thật sẽ được tạo cho dòng đang chọn. Duyệt vài dòng để chắc chắn mọi trường đã đúng.'), bar, area);
  const tok = ++PV_TOKEN;
  setTimeout(() => renderPreview(ri, area, tok), 20);
  return h('div', {}, h('div', { class: 'grid2', style: { gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)' } }, main, side), navBar('Xuất file'));
}
function shrinkList(ri) {
  const T = S.tpl, out = [];
  const ctx = document.createElement('canvas').getContext('2d');
  for (const b of boxesFor(ri)) {
    const txt = nfc(b.text); if (!txt.trim()) continue;
    const P = T.pages[b.page];
    const lay = layoutBox(b, txt, (t, s) => { ctx.font = `${b.italic ? 'italic ' : ''}${b.bold ? '700 ' : '400 '}${s}px ${CSS_FAM(b)}`; return ctx.measureText(t).width; }, P.w);
    if (lay.size < b.size * 0.88) out.push([D().headers[b.col], Math.round(lay.size / b.size * 100), b.id]);
  }
  return out;
}
async function renderPreview(ri, area, tok) {
  const T = S.tpl;
  if (engine() === 'box') await ensureAllLocal();
  const showShrink = () => {
    if (engine() !== 'box') return;
    const w = $('#pvWarn'), rf = (T.kind === 'pdf' && T._red && T._red.reflow) || new Set(), sl = shrinkList(ri).filter(x => !rf.has(x[2]));
    if (w) w.innerHTML = '';
    if (w && sl.length) w.append(h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, h('b', {}, 'Chữ bị co nhỏ do dài hơn chỗ trống: '), sl.map(([k, p]) => `${k} (${p}%)`).join(', '),
      '. Phần chữ phía sau nằm cố định trên PDF nên không đẩy ra được – hãy chừa thêm khoảng trắng sau ký hiệu trong file Word gốc, dùng mẫu Word, hoặc chọn "Giữ nguyên cỡ chữ" cho khung đó.')));
  };
  try {
    let nodes = [];
    if (T.kind === 'docx') {
      const zip = await docxZipFor(T, findsFor(ri)); const blob = await zip.generateAsync({ type: 'blob' });
      if (tok !== PV_TOKEN) return;
      area.innerHTML = ''; area.style.background = ''; await docx.renderAsync(blob, area, null, { inWrapper: true, ignoreLastRenderedPageBreak: true }); return;
    } else if (T.kind === 'xlsx') {
      const zip = await xlsxZipFor(T, findsFor(ri), numsFor(ri)); const u8 = await zip.generateAsync({ type: 'uint8array' });
      const wb = XLSX.read(u8, { type: 'array' });
      const box = h('div', { class: 'xprev' });
      const tabs = h('div', { class: 'xtabs' }); const body = h('div', { style: { overflow: 'auto' } });
      const show = n => { body.innerHTML = XLSX.utils.sheet_to_html(wb.Sheets[n], { editable: false }); $$('button', tabs).forEach(b => b.classList.toggle('on', b.textContent === n)); };
      if (wb.SheetNames.length > 1) wb.SheetNames.forEach(n => tabs.append(h('button', { class: 'pill', onclick: () => show(n) }, n)));
      box.append(tabs, body); nodes = [box]; area.style.background = 'var(--paper)';
      if (tok !== PV_TOKEN) return; area.innerHTML = ''; area.append(...nodes); show(wb.SheetNames[0]); return;
    } else if (T.kind === 'pdf') {
      const doc = await pdfDocFor(T, boxesFor(ri), fontBytes); const bytes = await doc.save();
      const pdf = await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.6 });
        const c = h('canvas', { width: Math.ceil(vp.width), height: Math.ceil(vp.height) });
        await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; nodes.push(c);
      }
    } else nodes = [imageCanvasFor(T, boxesFor(ri))];
    if (tok !== PV_TOKEN) return;
    area.innerHTML = ''; area.append(...nodes); showShrink();
  } catch (e) { console.error(e); area.innerHTML = ''; area.append(h('div', { class: 'note err' }, 'Không dựng được bản xem thử: ' + (e.message || e))); }
}

/* ---------- BƯỚC 5: xuất file ---------- */
function outFormats() {
  const k = S.tpl.kind;
  return k === 'docx' ? [['docx', 'Word .docx'], ['pdf', 'PDF']] : k === 'xlsx' ? [['xlsx', 'Excel .xlsx']] : k === 'pdf' ? [['pdf', 'PDF (giữ chữ)'], ['pdfimg', 'PDF dạng ảnh']] : [['png', 'Ảnh PNG'], ['jpg', 'Ảnh JPG'], ['pdf', 'PDF']];
}
function defaultPattern(merge) {
  const j = guessNameCol();
  const tok = j >= 0 ? `{${D().headers[j]}}` : '{#}';
  return merge ? tok : S.tpl.base.replace(/[{}]/g, '') + '_' + tok;
}
function setMerge(m) { const wasDef = S.out.pattern === defaultPattern(S.out.merge); S.out.merge = m; if (wasDef) S.out.pattern = defaultPattern(m); }
function uniqueNames(arr) {
  const seen = {};
  return arr.map(n => { const k = n.toLocaleLowerCase('vi'); if (!seen[k]) { seen[k] = 1; return n; } return `${n} (${++seen[k]})`; });
}
const fmtExt = f => f === 'pdfimg' ? 'pdf' : f;
const HAS_DIR = typeof window.showDirectoryPicker === 'function';
const noAccent = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC');
const fileName = s => (S.out.ascii !== false && !(S.out.merge)) ? noAccent(s).replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '_') : s;
function viewExport() {
  const T = S.tpl, n = D().sel.size, fm = outFormats();
  if (!S.out.fmt || !fm.some(f => f[0] === S.out.fmt)) S.out.fmt = fm[0][0];
  if (!S.out.pattern) S.out.pattern = defaultPattern(S.out.merge && n > 1);
  if (S.out.folder === undefined) S.out.folder = HAS_DIR;
  const canMerge = n > 1 && !(T.kind === 'image' && S.out.fmt !== 'pdf');
  if (!canMerge && S.out.merge && n > 1 && T.kind === 'image') S.out.fmt = 'pdf';
  const mergeDesc0 = { docx: 'Một file Word, mỗi bản bắt đầu ở trang mới', xlsx: 'Một file Excel, mỗi bản là một trang tính', pdf: 'Một file PDF nối các bản liên tiếp', image: 'Một file PDF, mỗi ảnh là một trang' }[T.kind];
  const mergeDesc = T.kind === 'docx' && S.out.fmt === 'pdf' ? 'Một file PDF nối các bản liên tiếp' : mergeDesc0;
  const opt = (on, dis, title, desc, fn) => h('label', { class: 'opt' + (on ? ' on' : '') + (dis ? ' dis' : '') }, h('input', { type: 'radio', name: 'mg', checked: on, disabled: dis, onchange: fn }), h('div', {}, h('b', {}, title), h('span', {}, desc)));
  const pat = h('input', { class: 'inp', value: S.out.pattern, oninput: e => { S.out.pattern = e.target.value; drawNames(); } });
  const names = h('div', { class: 'names' });
  const idxs = selIdx();
  const drawNames = () => { const ex = uniqueNames(idxs.slice(0, 3).map((ri, k) => fileName(nameFor(ri, k, S.out.pattern)))); const ext = S.out.merge && n > 1 ? null : fmtExt(S.out.fmt); names.textContent = S.out.merge && n > 1 ? 'Tên trang tính/bản: ' + ex.join(' · ') + (n > 3 ? ' …' : '') : ex.map(x => x + '.' + ext).join('   ') + (n > 3 ? '   …' : ''); };
  drawNames();
  const ins = tok => { const s = pat.selectionStart ?? pat.value.length; pat.value = pat.value.slice(0, s) + tok + pat.value.slice(pat.selectionEnd ?? s); S.out.pattern = pat.value; drawNames(); pat.focus(); };
  const prog = h('div', { class: 'prog', hidden: true }, h('i')), plabel = h('div', { class: 'muted small', style: { marginTop: '6px' } }), res = h('div', { class: 'result' });
  const btn = h('button', { class: 'btn pri', style: { fontSize: '16px', padding: '12px 22px' }, onclick: () => doExport(btn, prog, plabel, res) }, `Tạo ${n} bản và tải về`);
  const card = h('div', { class: 'card' }, h('h2', {}, 'Xuất file'), h('p', { class: 'sub' }, `Sẽ tạo ${n} bản từ ${n} dòng đã chọn trong danh sách.`),
    h('div', { class: 'sect' }, h('div', { class: 'lbl', style: { marginBottom: '8px' } }, 'Định dạng'),
      h('div', { class: 'fmtrow' }, fm.map(([v, l]) => h('button', { class: 'pill' + (S.out.fmt === v ? ' on' : ''), onclick: () => { S.out.fmt = v; render(); } }, l))),
      T.kind === 'docx' && S.out.fmt === 'pdf' ? h('p', { class: 'muted small', style: { marginTop: '8px' } }, 'PDF được tạo ngay trên máy từ bản Word đã điền (mỗi trang là một ảnh nét cao, giống bản in). Nếu cần PDF có chữ chọn được, hãy tải Word rồi dùng Word → Lưu thành PDF.') : null,
      T.kind === 'pdf' ? h('p', { class: 'muted small', style: { marginTop: '8px' } }, S.out.fmt === 'pdfimg' ? 'PDF dạng ảnh: mỗi trang thành một ảnh nét cao – trông giống hệt bản in, không sao chép được chữ, file nặng hơn. Dùng khi máy/phần mềm diệt virus chặn file PDF thường.' : 'PDF giữ chữ: chữ sắc nét, chọn/sao chép được, file nhẹ.') : null),
    h('div', { class: 'sect' }, h('div', { class: 'lbl', style: { marginBottom: '8px' } }, 'Cách tải về'),
      h('div', { class: 'opts' },
        opt((!S.out.merge || n <= 1) && !(S.out.folder && HAS_DIR && n > 1), false, n > 1 ? 'Mỗi dòng một file · nén ZIP' : 'Một file duy nhất', n > 1 ? `${n} file nén trong một file .zip` + (HAS_DIR ? ' (Windows có thể chặn khi giải nén)' : '') : 'Tải về một file', () => { S.out.folder = false; setMerge(false); render(); }),
        HAS_DIR && n > 1 ? opt(!S.out.merge && !!S.out.folder, false, 'Mỗi dòng một file · lưu vào một thư mục trong ổ D (khuyên dùng)', 'Chọn một thư mục trong ổ D (hoặc ổ khác không phải ổ C – ổ chứa Windows và tài nguyên hệ thống), ví dụ D:\\VanBan. Công cụ ghi thẳng từng file vào đó, không cần giải nén. Trình duyệt không cho ghi vào ổ C, Desktop, Documents, Downloads…', () => { S.out.folder = true; setMerge(false); render(); }) : null,
        opt(S.out.merge && n > 1, n <= 1, 'Gộp tất cả vào một file', mergeDesc, () => { S.out.folder = false; setMerge(true); if (T.kind === 'image') S.out.fmt = 'pdf'; render(); }))),
    h('div', { class: 'sect' }, h('div', { class: 'lbl', style: { marginBottom: '8px' } }, S.out.merge && n > 1 ? 'Tên từng bản (tên trang tính khi gộp Excel)' : 'Tên file'),
      !(S.out.merge && n > 1) ? h('label', { class: 'row small', style: { marginBottom: '8px', gap: '8px' } }, h('input', { type: 'checkbox', checked: S.out.ascii !== false, onchange: e => { S.out.ascii = e.target.checked; drawNames(); } }), 'Tên file không dấu tiếng Việt (khuyên dùng – tránh lỗi khi giải nén, gửi email trên Windows)') : null,
      h('div', { class: 'namebox' }, pat, h('button', { class: 'btn sm', onclick: () => { S.out.pattern = defaultPattern(S.out.merge && n > 1); pat.value = S.out.pattern; drawNames(); } }, 'Mặc định')),
      h('div', { class: 'chips', style: { marginTop: '8px', padding: '8px' } }, h('span', { class: 'chip', onclick: () => ins('{#}'), title: 'Số thứ tự' }, h('i', { style: { background: 'var(--mute)' } }), h('span', {}, '# Số thứ tự')),
        D().headers.map((x, j) => h('span', { class: 'chip', onclick: () => ins(`{${x}}`) }, h('i', { style: { background: colColor(j) } }), h('span', {}, x)))),
      names),
    h('div', { class: 'sect row' }, btn), prog, plabel, res);
  return h('div', {}, card, navBar());
}
function moreToolsNote() {
  return h('a', { class: 'morecta inl', href: TOOLS_URL, target: /^https?:$/.test(location.protocol) ? null : '_blank', rel: 'noopener' },
    h('span', {}, h('b', {}, 'Tham khảo các công cụ hữu ích khác'), h('span', {}, 'Bộ công cụ miễn phí của Quản trị tử tế')), h('span', { class: 'mc-a' }, '→'));
}
async function doExport(btn, prog, plabel, res) {
  if (S.busy) return;
  S.busy = true; btn.disabled = true; res.innerHTML = ''; prog.hidden = false;
  const T = S.tpl, idxs = selIdx(), n = idxs.length, fmt = S.out.fmt, merge = S.out.merge && n > 1;
  const names = uniqueNames(idxs.map((ri, k) => merge ? nameFor(ri, k, S.out.pattern) : fileName(nameFor(ri, k, S.out.pattern))));
  const toFolder = !merge && n > 1 && S.out.folder && HAS_DIR;
  let dir = null;
  if (toFolder) {
    try { dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'qtt-tvb' }); }
    catch (e) { S.busy = false; btn.disabled = false; prog.hidden = true; if (e.name !== 'AbortError') toast('Không mở được thư mục này. Hãy tạo một thư mục mới trong ổ D (ví dụ D:\\VanBan) rồi chọn lại.', 6000); return; }
  }
  const bar = prog.firstChild;
  const setP = async (k, txt) => { bar.style.width = (k / n * 100).toFixed(1) + '%'; plabel.textContent = txt || `Đang tạo ${k}/${n}…`; await sleep0(); };
  const t0 = performance.now();
  try {
    if (engine() === 'box') await ensureAllLocal();
    let blob, fname;
    await setP(0, 'Đang chuẩn bị…');
    if (merge) {
      if (T.kind === 'docx' && fmt === 'pdf') { const out = await PDFLib.PDFDocument.create(); for (let k = 0; k < n; k++) { await docxToPdf(await (await docxZipFor(T, findsFor(idxs[k]))).generateAsync({ type: 'blob' }), out); await setP(k + 1); } blob = new Blob([await out.save()], { type: 'application/pdf' }); fname = `${T.base}_${n}-ban.pdf`; }
      else if (T.kind === 'docx') { const zip = await docxMerged(T, idxs.map(findsFor), setP); blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); fname = `${T.base}_${n}-ban.docx`; }
      else if (T.kind === 'xlsx') { const zip = await xlsxMerged(T, idxs.map((ri, k) => ({ finds: findsFor(ri), nums: numsFor(ri), name: names[k] })), setP); blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); fname = `${T.base}_${n}-ban.xlsx`; }
      else {
        const out = await PDFLib.PDFDocument.create();
        for (let k = 0; k < n; k++) {
          if (T.kind === 'pdf') { let doc = await pdfDocFor(T, boxesFor(idxs[k]), fontBytes); if (fmt === 'pdfimg') doc = await pdfAsImages(await doc.save()); const pages = await out.copyPages(doc, doc.getPageIndices()); pages.forEach(p => out.addPage(p)); }
          else { const P = T.pages[0], c = imageCanvasFor(T, boxesFor(idxs[k])); const jb = await canvasBlob(c, 'image/jpeg', 0.92); const img = await out.embedJpg(new Uint8Array(await jb.arrayBuffer())); const pw = P.w * 0.75, ph = P.h * 0.75; out.addPage([pw, ph]).drawImage(img, { x: 0, y: 0, width: pw, height: ph }); }
          await setP(k + 1);
        }
        pdfClean(out); blob = new Blob([await out.save()], { type: 'application/pdf' }); fname = `${T.base}_${n}-ban.pdf`;
      }
    } else {
      const zip = n > 1 && !dir ? new JSZip() : null; let single = null;
      for (let k = 0; k < n; k++) {
        const ri = idxs[k]; let data;
        if (T.kind === 'docx' && fmt === 'pdf') data = await (await docxToPdf(await (await docxZipFor(T, findsFor(ri))).generateAsync({ type: 'blob' }))).save();
        else if (T.kind === 'docx') data = await (await docxZipFor(T, findsFor(ri))).generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
        else if (T.kind === 'xlsx') data = await (await xlsxZipFor(T, findsFor(ri), numsFor(ri))).generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
        else if (T.kind === 'pdf') { const doc = await pdfDocFor(T, boxesFor(ri), fontBytes); data = fmt === 'pdfimg' ? await (await pdfAsImages(await doc.save())).save() : await doc.save(); }
        else {
          const c = imageCanvasFor(T, boxesFor(ri));
          if (fmt === 'pdf') { const out = await PDFLib.PDFDocument.create(); const jb = await canvasBlob(c, 'image/jpeg', 0.92); const img = await out.embedJpg(new Uint8Array(await jb.arrayBuffer())); const P = T.pages[0]; out.addPage([P.w * 0.75, P.h * 0.75]).drawImage(img, { x: 0, y: 0, width: P.w * 0.75, height: P.h * 0.75 }); data = await pdfClean(out).save(); }
          else data = new Uint8Array(await (await canvasBlob(c, fmt === 'jpg' ? 'image/jpeg' : 'image/png', 0.92)).arrayBuffer());
        }
        const nm = names[k] + '.' + fmtExt(fmt);
        if (dir) { const fh = await dir.getFileHandle(nm, { create: true }); const w = await fh.createWritable(); await w.write(data); await w.close(); }
        else if (zip) zip.file(nm, data); else single = [nm, data];
        await setP(k + 1);
      }
      if (dir) { bar.style.width = '100%'; plabel.textContent = `Đã lưu ${n} file vào thư mục “${dir.name}”.`; res.append(h('div', { class: 'note ok' }, h('span', {}, '✓'), h('span', {}, 'Đã lưu ', h('b', {}, `${n} file`), ' vào thư mục ', h('b', {}, dir.name), '. Mở thư mục đó để xem.'))); res.append(moreToolsNote()); return; }
      if (zip) { plabel.textContent = 'Đang nén file ZIP…'; blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' }); fname = `${fileName(T.base)}_${n}-ban.zip`; }
      else { blob = new Blob([single[1]], { type: fmtExt(fmt) === 'pdf' ? 'application/pdf' : 'application/octet-stream' }); fname = single[0]; }
    }
    bar.style.width = '100%';
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    plabel.textContent = `Xong ${n} bản trong ${secs} giây.`;
    download(blob, fname);
    res.append(h('div', { class: 'note ok' }, h('span', {}, '✓'), h('span', {}, 'Đã tạo ', h('b', {}, fname), ` (${fmtBytes(blob.size)}). Nếu trình duyệt chưa tự tải, `,
      h('a', { href: '#', onclick: e => { e.preventDefault(); download(blob, fname); } }, 'bấm vào đây'), '.')));
    if (/\.zip$/.test(fname)) res.append(h('div', { class: 'note' }, h('span', {}, 'ℹ'), h('span', {}, h('b', {}, 'Nếu Windows báo chặn khi giải nén: '), 'chuột phải file .zip → Properties → tick ', h('b', {}, 'Unblock'), ' → OK rồi giải nén lại.', T.kind === 'pdf' && fmt !== 'pdfimg' ? ' Nếu vẫn bị chặn, chọn định dạng "PDF dạng ảnh" rồi tạo lại.' : '', HAS_DIR ? ' Hoặc chọn "Mỗi dòng một file · lưu vào một thư mục trong ổ D" để khỏi phải giải nén.' : '')));
    res.append(moreToolsNote());
    if (T.kind === 'pdf' && T._red && !T._red.ok) res.append(h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, 'Với file PDF này, chữ gốc chỉ được phủ màu nền, vẫn còn nằm ẩn bên dưới (có thể lộ khi sao chép chữ). Nếu cần sạch hoàn toàn, hãy dùng mẫu Word/Excel hoặc xuất PDF mẫu từ Word.')));
  } catch (e) {
    console.error(e);
    res.append(h('div', { class: 'note err' }, 'Có lỗi khi tạo file: ' + (e.message || e)));
  } finally { S.busy = false; btn.disabled = false; }
}

/* ---------- khởi động ---------- */
async function init() {
  const root = document.documentElement;
  try { const l = localStorage.getItem('qtt-lamp'); if (l) root.dataset.lamp = l; } catch (e) { }
  $('#restart').addEventListener('click', restart);
  $('#lampBtn').addEventListener('click', () => { root.dataset.lamp = root.dataset.lamp === 'off' ? 'on' : 'off'; try { localStorage.setItem('qtt-lamp', root.dataset.lamp); } catch (e) { } });
  if (/^https?:$/.test(location.protocol)) {
    $('#backWeb').hidden = false; $('#dlSelf').hidden = false;
    $('#dlSelf').addEventListener('click', async () => {
      try { const r = await fetch(location.href, { cache: 'no-store' }); download(new Blob([await r.blob()], { type: 'text/html' }), 'tao-van-ban-hang-loat.html'); toast('Mở file vừa tải bằng Chrome hoặc Edge để dùng, không cần mạng.', 4000); }
      catch (e) { toast('Không tải được. Hãy dùng Ctrl+S để lưu trang.'); }
    });
  }
  /* Ctrl+Z hoàn tác, Ctrl+Y / Ctrl+Shift+Z làm lại (trong ô nhập chữ thì để trình duyệt tự hoàn tác chữ) */
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k !== 'z' && k !== 'y') return;
    if (e.target.closest && e.target.closest('input[type=text],input:not([type]),input[type=number],textarea,[contenteditable]')) return;
    if (S.step === 'home') return;
    e.preventDefault();
    if (k === 'y' || e.shiftKey) redo(); else undo();
  });
  document.addEventListener('change', histSoon, true);
  document.addEventListener('pointerup', histSoon, true);
  $('#undoBtn').addEventListener('click', undo); $('#redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', e => {
    if (S.step !== 'map' || engine() !== 'box' || !S.selBox) return;
    if (e.target.closest('input,select,textarea')) return;
    const b = S.boxes.find(x => x.id === S.selBox); if (!b) return;
    const st = e.shiftKey ? 10 : 1;
    if (e.key === 'Delete' || e.key === 'Backspace') { S.boxes = S.boxes.filter(x => x !== b); S.selBox = null; refreshBoxUI(); e.preventDefault(); }
    else if (e.key.startsWith('Arrow')) { const u = st / (S._k || 1); if (e.key === 'ArrowLeft') b.x -= u; if (e.key === 'ArrowRight') b.x += u; if (e.key === 'ArrowUp') b.y -= u; if (e.key === 'ArrowDown') b.y += u; drawOverlay(); e.preventDefault(); }
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (S.step === 'map' && engine() === 'box') drawOverlay(); }, 120); });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { if (!e.target.closest('.drop')) e.preventDefault(); });
  render();
  await loadFonts();
}
init();
