/* ============================================================
   Giao diện 5 bước
   ============================================================ */
const S = {
  step: 'home', first: 'tpl', manual: false, homeKind: 'tpl', tplTab: 'have', showGuide: false, tpl: null, data: null,
  rules: [], boxes: [], sampleRow: -1, detected: false, detectInfo: null,
  selRule: null, selBox: null, page: 0, pv: 0,
  out: { fmt: null, merge: false, pattern: '' }, busy: false
};
let UID = 1;
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sv == null) continue; if (sk.startsWith('--')) e.style.setProperty(sk, sv); else e.style[sk] = sv; } }
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k in e && typeof v !== 'string') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(9)) { if (k == null || k === false) continue; e.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return e;
}
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), ms); }
function fmtBytes(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
function download(blob, name) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
function b64bytes(b64) { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
const FONT_BYTES = {};
function fontBytes(key) {
  if (key.startsWith('L|')) { if (LOCALF.bytes[key]) return LOCALF.bytes[key]; const p = key.split('|'); const st = p[2] || '00'; key = 'serif' + (st === '11' ? 'bi' : st === '10' ? 'b' : st === '01' ? 'i' : 'r'); }
  if (!FONT_BYTES[key]) FONT_BYTES[key] = b64bytes(FONTDATA[key]); return FONT_BYTES[key];
}
/* phông cài trên máy (Chrome/Edge – Local Font Access) */
const LOCALF = { fam: null, list: [], bytes: {} };
const famKey = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
async function loadLocalFonts() {
  if (LOCALF.fam) return LOCALF.list;
  if (!('queryLocalFonts' in window)) throw new Error('Trình duyệt này chưa cho đọc phông trên máy. Hãy dùng Chrome hoặc Edge bản mới.');
  const fonts = await window.queryLocalFonts();
  if (!fonts.length) throw new Error('Chưa được cấp quyền dùng phông trên máy.');
  const fam = {}; for (const f of fonts) (fam[f.family] = fam[f.family] || []).push(f);
  LOCALF.fam = fam; LOCALF.list = Object.keys(fam).sort((a, b) => a.localeCompare(b));
  return LOCALF.list;
}
function localMatch(srcFont) {
  if (!LOCALF.fam || !srcFont) return null;
  const k = famKey(srcFont);
  const strip = s => famKey(s).replace(/(ps)?mt$/, '').replace(/(regular|bold|italic|oblique|boldmt|psmt)+$/, '');
  return LOCALF.list.find(f => famKey(f) === k) || LOCALF.list.find(f => strip(f) === strip(srcFont)) || null;
}
async function ensureLocalFont(b) {
  if (b.font !== 'local' || !b.localFamily) return;
  const key = fontKey(b); if (LOCALF.bytes[key]) return;
  const faces = (LOCALF.fam || {})[b.localFamily]; if (!faces) return;
  const isB = s => /bold|black|heavy|semibold|demi/i.test(s), isI = s => /italic|oblique/i.test(s);
  const face = faces.find(f => isB(f.style) === !!b.bold && isI(f.style) === !!b.italic) || faces.find(f => isB(f.style) === !!b.bold) || faces.find(f => /regular|normal|book|roman/i.test(f.style)) || faces[0];
  const u8 = new Uint8Array(await (await face.blob()).arrayBuffer());
  LOCALF.bytes[key] = u8;
  try { const ff = new FontFace(`QTTL ${b.localFamily}`, u8, { weight: b.bold ? '700' : '400', style: b.italic ? 'italic' : 'normal' }); await ff.load(); document.fonts.add(ff); } catch (e) { console.warn(e); }
}
/* tự dùng phông gốc của file mẫu nếu trình duyệt đã cho phép đọc phông trên máy */
async function localFontState() { try { const p = await navigator.permissions.query({ name: 'local-fonts' }); return p.state; } catch (e) { return 'queryLocalFonts' in window ? 'prompt' : 'none'; } }
async function autoLocalFonts(silent) {
  if (!S.boxes.length) return 0;
  if (!LOCALF.fam) { if (!silent || (await localFontState()) !== 'granted') return 0; try { await loadLocalFonts(); } catch (e) { return 0; } }
  let n = 0;
  for (const b of S.boxes) {
    if (b.fontPicked) continue;
    const lf = localMatch(b.srcFont); if (!lf) continue;
    b.font = 'local'; b.localFamily = lf; try { await ensureLocalFont(b); } catch (e) { } n++;
  }
  if (n && S.step === 'map' && typeof refreshBoxUI === 'function') { refreshBoxUI(); const bn = $('#fontBanner'); if (bn) bn.remove(); }
  return n;
}
async function ensureAllLocal() { for (const b of S.boxes) if (b.on) { try { await ensureLocalFont(b); } catch (e) { console.warn(e); } } }
async function loadFonts() {
  const list = [['QTT Serif', 'serifr', '400', 'normal'], ['QTT Serif', 'serifb', '700', 'normal'], ['QTT Serif', 'serifi', '400', 'italic'],
  ['QTT Sans', 'sansr', '400', 'normal'], ['QTT Sans', 'sansb', '700', 'normal'], ['QTT Sans', 'sansi', '400', 'italic'],
  ['QTT Serif', 'serifbi', '700', 'italic'], ['QTT Sans', 'sansbi', '700', 'italic']];
  for (const [fam, key, weight, style] of list) {
    try { const f = new FontFace(fam, fontBytes(key), { weight, style }); await f.load(); document.fonts.add(f); } catch (e) { console.warn('font', key, e); }
  }
}
const KIND_LABEL = { docx: 'Word', xlsx: 'Excel', pdf: 'PDF', image: 'Ảnh', csv: 'CSV' };
const KIND_ICON = { docx: 'DOCX', xlsx: 'XLSX', pdf: 'PDF', image: 'ẢNH', csv: 'CSV' };
const engine = () => S.tpl && (S.tpl.kind === 'pdf' || S.tpl.kind === 'image') ? 'box' : 'text';
const D = () => S.data;
const rowLabel = i => {
  const d = D(); if (!d || !d.rows[i]) return '';
  const nameCol = guessNameCol();
  const c = nameCol >= 0 ? d.rows[i].cells[nameCol] : d.rows[i].cells.find(x => !x.e);
  return `Dòng ${d.rows[i].r}${c && !c.e ? ' – ' + c.d : ''}`;
};
function guessNameCol() {
  const d = D(); if (!d) return -1;
  let j = d.headers.findIndex(x => /họ\s*(và)?\s*tên|tên\s*(khách|nhân viên|học viên|người)|^tên$|full\s*name|^name$/i.test(x));
  if (j < 0) j = d.headers.findIndex(x => /tên/i.test(x));
  return j;
}
const activeRules = () => S.rules.filter(r => r.on && r.col != null && r.col >= 0);
const activeBoxes = () => S.boxes.filter(b => b.on && b.col != null && b.col >= 0);
const activeCount = () => engine() === 'box' ? activeBoxes().length : activeRules().length;

/* ---------- dữ liệu theo dòng ---------- */
function findsFor(ri) {
  const row = D().rows[ri];
  const xl = S.tpl.kind === 'xlsx';
  return activeRules().filter(r => r.kind === 'text').map(r => {
    const c = row.cells[r.col];
    const f = { find: r.find, text: fmtValue(c, r.fmt), key: r.id, anchor: r.anchor || 0, pos: r.pos };
    if (xl && r.src === 'mk' && r.fmt === 'raw') { const n = numTarget(c); if (n != null) f.num = n; }
    return f;
  });
}
function numsFor(ri) {
  const row = D().rows[ri], m = new Map();
  for (const r of activeRules().filter(r => r.kind === 'num')) {
    const c = row.cells[r.col];
    if (c.e) { m.set(r.num, { text: '' }); continue; }
    if (r.fmt === 'raw' || !r.fmt) { const n = numTarget(c); m.set(r.num, n != null ? { num: n } : { text: c.d }); }
    else m.set(r.num, { text: fmtValue(c, r.fmt) });
  }
  return m;
}
function boxesFor(ri) {
  const row = D().rows[ri];
  return activeBoxes().map(b => ({ ...b, text: fmtValue(row.cells[b.col], b.fmt) }));
}
function nameFor(ri, k, pattern) {
  const row = D().rows[ri];
  let s = (pattern || '{#}').replace(/\{([^{}]+)\}/g, (m, key) => {
    if (key === '#') return String(k + 1).padStart(String(D().sel.size).length, '0');
    const j = D().headers.indexOf(key); return j >= 0 ? row.cells[j].d : m;
  });
  s = nfc(s).replace(/[\\/:*?"<>|\u0000-\u001F]+/g, '-').replace(/\s+/g, ' ').replace(/^[\s.]+|[\s.]+$/g, '');
  return (s || 'ban-' + (k + 1)).slice(0, 120);
}

/* ---------- bước ---------- */
const STEP_META = {
  tpl: { t: 'File mẫu', s: () => S.tpl ? S.tpl.name : 'Word, Excel, PDF, ảnh' },
  data: { t: 'Danh sách', s: () => D() ? `${D().rows.length} dòng · ${D().headers.length} cột` : 'Excel, CSV' },
  map: { t: 'Ghép trường', s: () => S.detected ? `${activeCount()} trường đã ghép` : 'Nối mẫu với danh sách' },
  pv: { t: 'Xem thử', s: () => 'Kiểm tra trước khi tạo' },
  out: { t: 'Xuất file', s: () => D() ? `${D().sel.size} bản` : 'Gộp hoặc tách' }
};
const ORDER = () => S.first === 'list' ? ['data', 'tpl', 'map', 'pv', 'out'] : ['tpl', 'data', 'map', 'pv', 'out'];
const noMarkerKind = T => !!T && (T.kind === 'image' || (T.kind === 'pdf' && !T.hasText));
const hasMarkers = T => !!T && T.markers.some(m => !m.weak);
const tplReady = () => !!S.tpl; /* chưa có ký hiệu vẫn đi tiếp được: bấm Tiếp tục = chấp nhận ghép thủ công */
const dataReady = () => !!D() && D().rows.length > 0;
function canGo(k) {
  if (k === 'home') return true;
  const o = ORDER();
  if (o.indexOf(k) === 0) return true;
  if (k === 'tpl') return dataReady();
  if (k === 'data') return tplReady();
  if (k === 'map') return tplReady() && dataReady();
  return canGo('map') && S.detected && activeCount() > 0 && D().sel.size > 0;
}
const stepDone = k => k === 'tpl' ? tplReady() : k === 'data' ? dataReady() : k === 'map' ? (S.detected && activeCount() > 0) : false;
const nextOf = k => { const o = ORDER(); return o[o.indexOf(k) + 1] || null; };
const prevOf = k => { const o = ORDER(); return o[o.indexOf(k) - 1] || null; };
function renderSteps() {
  $$('[data-next]').forEach(b => b.disabled = !canGo(b.dataset.next));
  const nav = $('#steps'); nav.innerHTML = '';
  nav.hidden = S.step === 'home';
  const rs = $('#restart'); if (rs) rs.hidden = S.step === 'home';
  ORDER().forEach((k, i) => {
    const st = STEP_META[k];
    nav.append(h('button', {
      class: 'step' + (S.step === k ? ' on' : '') + (S.step !== k && stepDone(k) ? ' done' : ''), disabled: !canGo(k),
      onclick: () => go(k)
    }, h('span', { class: 'n' }, h('span', {}, i + 1)), h('span', {}, h('span', { class: 't' }, st.t), h('span', { class: 's' }, st.s()))));
  });
}
function go(k) {
  if (!canGo(k)) return;
  if (S.step === 'tpl' && S.tpl && !hasMarkers(S.tpl) && ORDER().indexOf(k) > ORDER().indexOf('tpl')) S.manual = true;
  S.step = k;
  if (k === 'map' && !S.detected) detect();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function restart() {
  S.tpl = null; S.data = null; S.manual = false; S.first = 'tpl'; S.tplTab = 'have'; S.showGuide = false;
  resetMapping(); S.out = { fmt: null, merge: false, pattern: '' }; S.step = 'home'; render();
  window.scrollTo({ top: 0 });
}
function render() {
  renderSteps();
  document.body.classList.toggle('is-home', S.step === 'home');
  const m = $('#main'); m.innerHTML = '';
  const v = { home: viewHome, tpl: viewTpl, data: viewData, map: viewMap, pv: viewPreview, out: viewExport }[S.step];
  m.append(v());
  if (S.step !== 'home') topNav(m);
}
/* nút chuyển bước đặt cả ở góc trên bên phải (ngang tiêu đề) – không phải kéo xuống cuối trang */
let NAV_LABEL = null;
function topNav(m) {
  const h2 = m.querySelector('.card h2'); if (!h2 || !m.querySelector('.nav')) return;
  const k = S.step, p = prevOf(k), n = nextOf(k);
  const btns = h('div', { class: 'topnav' },
    p ? h('button', { class: 'btn sm', onclick: () => go(p) }, '← Quay lại') : null,
    n ? h('button', { class: 'btn pri', 'data-next': n, disabled: !canGo(n), onclick: () => go(n) }, (NAV_LABEL || 'Tiếp tục: ' + STEP_META[n].t) + ' →') : null,
    k === 'out' && m.querySelector('.sect.row .btn.pri') ? h('button', { class: 'btn pri', onclick: () => { const b = m.querySelector('.sect.row .btn.pri'); if (b && !b.disabled) { b.click(); b.scrollIntoView({ behavior: 'smooth', block: 'center' }); } } }, m.querySelector('.sect.row .btn.pri').textContent + ' ↓') : null);
  if (!btns.children.length) return;
  const head = h('div', { class: 'cardhead' }); h2.replaceWith(head); head.append(h2, btns);
}
function navBar(nextLabel) {
  NAV_LABEL = nextLabel || null;
  const k = S.step, p = prevOf(k), n = nextOf(k);
  return h('div', { class: 'nav' },
    p ? h('button', { class: 'btn', onclick: () => go(p) }, '← Quay lại') : h('button', { class: 'btn', onclick: restart }, '← Làm lại từ đầu'),
    n ? h('button', { class: 'btn pri', 'data-next': n, disabled: !canGo(n), onclick: () => go(n) }, (nextLabel || 'Tiếp tục: ' + STEP_META[n].t) + ' →') : h('span'));
}
function dropZone(accept, label, fmts, onFile) {
  const inp = h('input', { type: 'file', accept });
  const z = h('label', { class: 'drop' },
    h('div', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' }),
    h('div', { class: 'big' }, label), h('div', { class: 'muted small' }, 'Kéo thả file vào đây hoặc bấm để chọn'),
    h('div', { class: 'fmts' }, fmts.map(([c, t]) => h('span', { class: 'tag ' + c }, t))), inp);
  inp.addEventListener('change', () => inp.files[0] && onFile(inp.files[0]));
  z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
  z.addEventListener('dragleave', () => z.classList.remove('over'));
  z.addEventListener('drop', e => { e.preventDefault(); z.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onFile(f); });
  return z;
}
function busyBox(msg) { return h('div', { class: 'busy' }, h('span', { class: 'spin' }), msg); }
function fileInfo(kind, name, meta, onChange, extra) {
  return h('div', { class: 'fileinfo' }, h('div', { class: 'ficon ' + kind }, KIND_ICON[kind] || kind.toUpperCase()),
    h('div', {}, h('div', { class: 'nm' }, name), h('div', { class: 'mt' }, meta)), h('div', { class: 'sp' }), extra || null,
    h('button', { class: 'btn sm chg', onclick: onChange }, '↻ Đổi file'));
}

/* ---------- hướng dẫn làm file mẫu ---------- */
function uniqMarkerNames() {
  const seen = new Set(), out = [];
  for (const m of (S.tpl ? S.tpl.markers : [])) { if (m.weak) continue; const k = normName(m.name); if (!seen.has(k)) { seen.add(k); out.push(m.name); } }
  return out;
}
function downloadBlankList() {
  const names = uniqMarkerNames(); if (!names.length) return;
  const ws = XLSX.utils.aoa_to_sheet([names]);
  ws['!cols'] = names.map(n => ({ wch: Math.max(14, n.length + 6) }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Danh sách');
  XLSX.writeFile(wb, `${S.tpl.base}_danh-sach.xlsx`);
}
function sampleDownload(key, name) { download(new Blob([b64bytes(SAMPLES[key])]), name); }
/* thử ngay: nạp sẵn phiếu lương mẫu + danh sách lương mẫu rồi sang bước Ghép trường */
async function runDemo() {
  const f = (k, n) => new File([b64bytes(SAMPLES[k])], n);
  S.first = 'tpl'; S.manual = false; S.tplTab = 'have'; S.showGuide = false; S.step = 'tpl';
  await onTplFile(f('docx', 'mau-phieu-luong.docx')); if (!S.tpl) return;
  await onDataFile(f('list', 'danh-sach-luong-mau.xlsx')); if (!S.data) return;
  go('map'); toast('Đã nạp phiếu lương mẫu và danh sách lương mẫu (8 nhân viên).', 4000);
}
const demoBtn = cls => h('button', { class: cls, onclick: runDemo, title: 'Nạp sẵn file phiếu lương mẫu và danh sách lương mẫu để xem công cụ chạy' }, '▶ Thử ngay với ví dụ phiếu lương');
/* file Word khởi đầu có sẵn ký hiệu theo cột danh sách */
async function starterDocx() {
  const hs = D() ? D().headers : ['Họ và tên', 'Ngày sinh', 'Chức vụ'];
  const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}<w:sz w:val="${o.sz || 26}"/>${o.c ? `<w:color w:val="${o.c}"/>` : ''}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const para = (runs, jc) => `<w:p><w:pPr>${jc ? `<w:jc w:val="${jc}"/>` : ''}<w:spacing w:after="120"/></w:pPr>${runs}</w:p>`;
  const body = [
    para(run('TÊN VĂN BẢN CỦA BẠN', { b: 1, sz: 32 }), 'center'),
    para(run('Sắp xếp, định dạng lại các dòng dưới đây theo văn bản của bạn. Giữ nguyên ký hiệu trong ngoặc vuông – đó là chỗ công cụ sẽ điền dữ liệu.', { i: 1, sz: 22, c: '8A7A6A' })),
    ...hs.map(hd => para(run(hd + ': ') + run(`[${hd}]`, { b: 1 })))
  ].join('');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  download(await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'file-mau-khoi-dau.docx');
}
/* ví dụ: file mẫu Word có ký hiệu, dựng như trang in */
let EX_DOM = null;
async function renderExample(holder) {
  try {
    if (!EX_DOM) {
      const tmp = h('div');
      await docx.renderAsync(new Blob([b64bytes(SAMPLES.docx)]), tmp, null, { inWrapper: true, ignoreLastRenderedPageBreak: true, breakPages: true });
      const txt = tmp.textContent || '';
      const finds = findMarkers(txt).filter(m => !m.weak).map(m => ({ find: m.token, key: m.token }));
      highlightDom(tmp, finds, (f, t) => h('span', { class: 'gmk' }, t));
      EX_DOM = tmp;
    }
    holder.innerHTML = ''; const c = EX_DOM.cloneNode(true); holder.append(c);
    const sec = c.querySelector('section.docx');
    if (sec) { const z = Math.min(1, (holder.clientWidth - 8) / (sec.offsetWidth + 4)); if (z < 1) c.style.zoom = z.toFixed(3); }
  } catch (e) { console.warn(e); holder.innerHTML = ''; }
}
function guidePanel() {
  const exHolder = h('div', { class: 'exdoc' }, busyBox('Đang dựng ví dụ…'));
  setTimeout(() => renderExample(exHolder), 0);
  return h('div', { class: 'gpanel' },
    h('div', { class: 'gp-cols' },
      h('div', {},
        h('h3', {}, 'Cách làm file thành phẩm mẫu chuẩn'),
        h('div', { class: 'gsteps v' },
          h('div', { class: 'gstep' }, h('b', {}, '1'), h('div', {}, h('h4', {}, 'Đánh dấu chỗ cần thay'), h('p', {}, 'Mở văn bản bạn vẫn dùng. Ở chỗ cần lấy từ danh sách, xoá chữ cũ và gõ ', h('code', {}, '[Tên cột]'), ', ví dụ ', h('code', {}, '[Họ và tên]'), ', ', h('code', {}, '[Ngày sinh]'), '. Dùng ', h('code', {}, '{{Họ và tên}}'), ' cũng được.'))),
          h('div', { class: 'gstep' }, h('b', {}, '2'), h('div', {}, h('h4', {}, 'Định dạng ngay trên ký hiệu'), h('p', {}, 'Muốn tên in đậm, cỡ 14, màu xanh thì định dạng chính ', h('code', {}, '[Họ và tên]'), ' như vậy. Kết quả giữ đúng phông, cỡ, màu của ký hiệu.'))),
          h('div', { class: 'gstep' }, h('b', {}, '3'), h('div', {}, h('h4', {}, 'Tên trùng với cột danh sách'), h('p', {}, 'Chữ trong ngoặc trùng tên cột ở dòng đầu file danh sách (không phân biệt hoa thường, có dấu hay không). Lưu file rồi tải lên lại.')))),
        h('ul', { class: 'gnotes' },
          h('li', {}, h('b', {}, 'Excel: '), 'ô chỉ chứa ', h('code', {}, '[Lương cơ bản]'), ' sẽ nhận số/ngày thật, giữ định dạng ô và công thức.'),
          h('li', {}, h('b', {}, 'PDF: '), 'gõ ký hiệu trong Word rồi xuất PDF; chừa chỗ trống sau ký hiệu. Hoặc dùng PDF cũ và bấm chọn chữ cần thay ở bước Ghép trường.'),
          h('li', {}, h('b', {}, 'Ảnh, PDF scan: '), 'kéo khung đặt chữ ở bước Ghép trường.')),
        h('div', { class: 'row' },
          D() ? h('button', { class: 'btn cta', onclick: starterDocx }, '⬇ File Word khởi đầu có sẵn các cột của bạn') : null,
          h('button', { class: 'btn sm', onclick: () => sampleDownload('docx', 'mau-phieu-luong.docx') }, '⬇ Phiếu lương mẫu (Word)'),
          h('button', { class: 'btn sm', onclick: () => sampleDownload('xlsx', 'mau-phieu-luong.xlsx') }, '⬇ Phiếu lương mẫu (Excel)'),
          h('button', { class: 'btn sm', onclick: () => sampleDownload('list', 'danh-sach-luong-mau.xlsx') }, '⬇ Danh sách lương mẫu'),
          demoBtn('btn sm'))),
      h('div', {}, h('div', { class: 'lbl', style: { marginBottom: '8px' } }, 'Ví dụ: phiếu lương mẫu đã đánh dấu (ô cam là ký hiệu)'), exHolder)));
}
function guideBox(open) {
  const ex = (txt) => { const p = h('p', {}); txt.split(/(\[[^\]]+\])/).forEach(s => p.append(/^\[/.test(s) ? h('span', { class: 'gmk' }, s) : s)); return p; };
  return h('details', { class: 'guide', open: open },
    h('summary', {}, h('span', { class: 'gq' }, '?'), 'Cách làm file mẫu chuẩn (2 phút)'),
    h('div', { class: 'gbody' },
      h('div', { class: 'gsteps' },
        h('div', { class: 'gstep' }, h('b', {}, '1'), h('div', {}, h('h4', {}, 'Đánh dấu chỗ cần thay'), h('p', {}, 'Mở văn bản Word/Excel bạn vẫn dùng. Ở chỗ cần lấy từ danh sách, gõ ', h('code', {}, '[Tên cột]'), ', ví dụ ', h('code', {}, '[Họ và tên]'), ', ', h('code', {}, '[Ngày sinh]'), '. Cũng dùng được ', h('code', {}, '{{Họ và tên}}'), ' hoặc ', h('code', {}, '«Họ và tên»'), '.'))),
        h('div', { class: 'gstep' }, h('b', {}, '2'), h('div', {}, h('h4', {}, 'Định dạng ngay trên ký hiệu'), h('p', {}, 'Muốn tên in đậm, cỡ 14, màu xanh thì định dạng chính ký hiệu ', h('code', {}, '[Họ và tên]'), ' như vậy. Kết quả giữ đúng phông, cỡ, màu của ký hiệu.'))),
        h('div', { class: 'gstep' }, h('b', {}, '3'), h('div', {}, h('h4', {}, 'Tên trùng với cột danh sách'), h('p', {}, 'Chữ trong ngoặc nên trùng tên cột ở dòng đầu file Excel danh sách (không phân biệt hoa thường). Chưa có danh sách? Tải mẫu lên, công cụ tạo sẵn file danh sách trống đúng tên cột.')))),
      h('div', { class: 'gex' }, h('div', { class: 'lbl' }, 'Ví dụ trong Word'),
        h('div', { class: 'gpaper' }, ex('PHIẾU LƯƠNG THÁNG [Kỳ lương]'), ex('Họ và tên: [Họ và tên]    Phòng ban: [Phòng ban]'), ex('Lương cơ bản: [Lương cơ bản] đồng    Thực lĩnh: [Thực lĩnh] đồng'))),
      h('ul', { class: 'gnotes' },
        h('li', {}, h('b', {}, 'Excel: '), 'ô chỉ chứa đúng một ký hiệu như ', h('code', {}, '[Lương cơ bản]'), ' sẽ nhận giá trị số/ngày, giữ định dạng ô và công thức.'),
        h('li', {}, h('b', {}, 'PDF: '), 'gõ ký hiệu trong Word rồi xuất ra PDF; chừa đủ chỗ trống sau ký hiệu vì PDF không tự xuống dòng.'),
        h('li', {}, h('b', {}, 'Ảnh, PDF scan: '), 'không có lớp chữ nên bạn kéo khung đặt chữ ở bước Ghép trường.'),
        h('li', {}, h('b', {}, 'Ngoặc vuông khác '), '(ví dụ ', h('code', {}, '[Ký, ghi rõ họ tên]'), ') không trùng tên cột sẽ được để tắt, bạn bỏ qua ở bước Ghép trường.')),
      h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'Tải mẫu dùng thử'),
        h('button', { class: 'btn sm', onclick: () => sampleDownload('docx', 'mau-phieu-luong.docx') }, '⬇ Phiếu lương Word'),
        h('button', { class: 'btn sm', onclick: () => sampleDownload('xlsx', 'mau-phieu-luong.xlsx') }, '⬇ Phiếu lương Excel'),
        h('button', { class: 'btn sm', onclick: () => sampleDownload('list', 'danh-sach-luong-mau.xlsx') }, '⬇ Danh sách lương mẫu'))));
}

/* ---------- BƯỚC 1: file mẫu ---------- */
async function onTplFile(file) {
  const ext = extOf(file.name);
  if (ext === 'doc' || ext === 'xls') { toast(`File .${ext} là định dạng cũ. Hãy mở bằng Office và lưu lại thành .${ext}x rồi tải lên.`, 5000); return; }
  const kind = ext === 'docx' ? 'docx' : (ext === 'xlsx' || ext === 'xlsm') ? 'xlsx' : ext === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) ? 'image' : null;
  if (!kind) { toast('Chưa hỗ trợ định dạng này. Dùng .docx, .xlsx, .pdf, .png hoặc .jpg.', 4000); return; }
  const m = $('#main'); m.innerHTML = ''; m.append(h('div', { class: 'card' }, busyBox('Đang đọc file mẫu…')));
  try {
    const T = { kind, name: file.name, base: file.name.replace(/\.[^.]+$/, ''), size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) };
    if (kind === 'docx') await initDocx(T); else if (kind === 'xlsx') await initXlsx(T); else if (kind === 'pdf') await initPdf(T); else await initImage(T, file);
    T.markers = T.kind === 'image' ? [] : findMarkers(T.text || '');
    S.tpl = T; resetMapping();
    S.out = { fmt: null, merge: false, pattern: '' };
  } catch (e) { console.error(e); toast(e.message || 'Không đọc được file.', 5000); }
  render();
}
function resetMapping() { S.rules = []; S.boxes = []; S.cands = []; S.detected = false; S.sampleRow = -1; S.selRule = S.selBox = null; S.page = 0; S.pv = 0; S.detectInfo = null; }
function tplMeta(T) {
  const meta = [KIND_LABEL[T.kind], fmtBytes(T.size)];
  if (T.kind === 'pdf') meta.push(`${T.numPages} trang`);
  if (T.kind === 'image') meta.push(`${T.pages[0].w}×${T.pages[0].h} px`);
  if (T.kind === 'xlsx') meta.push(`${T.sheets.length} trang tính`);
  return meta.join(' · ');
}
const tplDrop = label => dropZone('.docx,.xlsx,.xlsm,.pdf,.png,.jpg,.jpeg,.webp', label || 'Thả file thành phẩm mẫu vào đây',
  [['docx', 'Word .docx'], ['xlsx', 'Excel .xlsx'], ['pdf', 'PDF'], ['img', 'Ảnh .png .jpg']], async f => {
    const v = await confirmKind(f, 'tpl'); if (!v) return;
    if (v === 'list') { await onDataFile(f); if (S.first === 'tpl' && !S.tpl) { S.first = 'list'; S.step = 'tpl'; render(); } return; }
    S.manual = false; onTplFile(f);
  });
function choiceCard(on, num, title, desc, onclick) {
  return h('button', { class: 'choice' + (on ? ' on' : ''), onclick }, h('span', { class: 'cn' }, num), h('span', {}, h('b', {}, title), h('span', {}, desc)));
}
/* màn chọn/tải file mẫu khi chưa có (đi từ danh sách, hoặc tải lỗi) */
function viewTplUpload() {
  const d = D();
  const card = h('div', { class: 'card' }, h('h2', {}, 'Tải lên file thành phẩm mẫu'),
    h('p', { class: 'sub' }, d ? `Danh sách đã sẵn sàng (${d.rows.length} dòng, ${d.headers.length} cột). Giờ cần một file mẫu: văn bản, chứng chỉ… mà mỗi người sẽ nhận một bản.` : 'Văn bản, chứng chỉ, phiếu… mà mỗi người trong danh sách sẽ nhận một bản.'),
    h('div', { class: 'choices' },
      choiceCard(S.tplTab !== 'guide', '1', 'Tôi đã có file mẫu', 'Tải lên Word, Excel, PDF hoặc ảnh. Nếu đã gõ ký hiệu [Tên cột] thì công cụ tự nhận diện.', () => { S.tplTab = 'have'; render(); }),
      choiceCard(S.tplTab === 'guide', '2', 'Hướng dẫn tạo file mẫu', 'Xem cách đánh dấu [Tên cột], ví dụ mẫu, tải file Word khởi đầu có sẵn các cột của bạn.', () => { S.tplTab = 'guide'; render(); })));
  if (S.tplTab === 'guide') { card.append(guidePanel()); card.append(h('div', { class: 'lbl', style: { margin: '18px 0 8px' } }, 'Làm xong thì tải file mẫu chuẩn lên đây')); }
  card.append(tplDrop());
  return h('div', {}, card, navBar());
}
function viewTpl() {
  const T = S.tpl;
  if (!T) return viewTplUpload();
  const card = h('div', { class: 'card' }, h('h2', {}, 'File thành phẩm mẫu'),
    fileInfo(T.kind, T.name, tplMeta(T), () => { S.tpl = null; S.manual = false; resetMapping(); render(); }));
  if (hasMarkers(T)) {
    const names = uniqMarkerNames();
    card.append(h('div', { class: 'note ok' }, h('span', {}, '✓'), h('div', {},
      h('div', {}, h('b', {}, `Đã nhận diện ${names.length} trường`), ' theo ký hiệu trong file mẫu:'),
      h('div', { class: 'mkchips' }, T.markers.map(m => h('span', { class: 'mkchip' + (m.weak ? ' weak' : ''), title: m.weak ? 'Có thể không phải tên cột – sẽ để tắt nếu danh sách không có cột này' : '' }, m.token, m.n > 1 ? h('i', {}, '×' + m.n) : null))))));
    if (dataReady()) {
      const miss = names.filter(n => matchColumn(D().headers, n) < 0);
      if (miss.length) card.append(h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, h('b', {}, `${miss.length} trường chưa có cột cùng tên trong danh sách: `), miss.map(n => `[${n}]`).join(', '), '. Bạn ghép tay ở bước Ghép trường.')));
    } else card.append(h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn cta', onclick: downloadBlankList }, '⬇ Tải file danh sách trống theo các trường này'),
      h('span', { class: 'muted small' }, 'Điền mỗi người một dòng rồi tải lên ở bước tiếp theo.')));
  } else if (S.manual) {
    card.append(h('div', { class: 'note' }, h('span', {}, '✓'), h('span', {}, h('b', {}, 'Bạn chọn ghép thủ công. '), noMarkerKind(T) ? 'Ở bước Ghép trường, kéo khung lên chữ cũ cần thay – công cụ tự xoá chữ cũ, giữ nền và dòng chấm. ' : 'Sau khi có danh sách, công cụ dò các giá trị trùng với danh sách trong mẫu; bạn chỉnh lại hoặc bấm/bôi đen chỗ cần thay. ',
      h('a', { href: '#', onclick: e => { e.preventDefault(); S.manual = false; render(); } }, 'Đổi ý'))));
  } else {
    const scan = noMarkerKind(T);
    card.append(h('div', { class: 'warnbox' },
      h('div', { class: 'wb-h' }, h('span', { class: 'wb-i' }, '!'), h('div', {}, h('b', {}, 'File mẫu chưa có ký hiệu trường'),
        h('span', {}, scan ? (T.kind === 'image' ? 'File ảnh không có lớp chữ' : 'PDF này là bản scan/ảnh, không có lớp chữ') + ' nên công cụ không đọc được ký hiệu [Họ và tên]. Chọn một trong hai cách:' : 'Công cụ chưa thấy ký hiệu kiểu [Họ và tên] nào. Chọn một trong hai cách:'))),
      h('div', { class: 'choices' },
        choiceCard(S.showGuide, '1', 'Làm lại file mẫu theo hướng dẫn', scan ? 'Mở file gốc (Word…) của mẫu, gõ [Tên cột] vào chỗ cần thay rồi tải lên lại. Chính xác nhất, giữ đúng định dạng.' : 'Gõ [Tên cột] vào chỗ cần thay rồi tải lại. Chính xác nhất, giữ đúng định dạng của mẫu.', () => { S.showGuide = !S.showGuide; render(); }),
        choiceCard(false, '2', 'Ghép thủ công sau khi tải danh sách', scan ? 'Ở bước Ghép trường, kéo khung lên chữ cũ cần thay: công cụ tự xoá chữ cũ (giữ nền, hoa văn, dòng chấm) và lấy theo cỡ, độ đậm, màu chữ cũ.' : 'Danh sách cần có hàng tiêu đề chuẩn. Công cụ dò giá trị trùng, bạn bấm chọn chỗ cần thay trên trang mẫu.', () => { S.manual = true; const n = nextOf('tpl'); if (n && canGo(n)) go(n); else render(); }))));
    card.append(h('div', { class: 'muted small', style: { marginTop: '8px' } }, 'Bấm "Tiếp tục" cũng được hiểu là chọn cách 2 – ghép thủ công.'));
    if (S.showGuide) { card.append(guidePanel()); card.append(h('div', { class: 'lbl', style: { margin: '18px 0 8px' } }, 'Tải lại file mẫu đã đánh dấu')); card.append(tplDrop('Thả file mẫu chuẩn vào đây')); }
  }
  if (T.kind === 'pdf' && T.numPages > T.pages.length) card.append(h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, `File có ${T.numPages} trang, công cụ chỉ xử lý ${T.pages.length} trang đầu.`)));
  const pv = h('div', { class: 'prev' }, busyBox('Đang dựng bản xem…'));
  card.append(h('div', { class: 'lbl', style: { margin: '18px 0 0' } }, 'Bản xem file mẫu'), pv);
  setTimeout(() => showTplPreview(pv), 30);
  return h('div', {}, card, navBar());
}
/* ---------- cấu hình liên kết (anh thay link video thật sau) ---------- */
const DEMO_VIDEO_ID = 'jNQXAC9IVRw';
const TOOLS_URL = /^https?:$/.test(location.protocol) ? '/cong-cu' : 'https://quantritute.pages.dev/cong-cu';

/* ---------- hộp thoại xác nhận ---------- */
function modal(title, body, buttons, wide) {
  return new Promise(res => {
    const close = v => { ov.remove(); document.removeEventListener('keydown', esc); res(v); };
    const esc = e => { if (e.key === 'Escape') close(null); };
    const ov = h('div', { class: 'mdl', onclick: e => { if (e.target === ov) close(null); } },
      h('div', { class: 'mdl-b' + (wide ? ' wide' : '') }, h('button', { class: 'x mdl-x', onclick: () => close(null) }, '×'),
        title ? h('h3', {}, title) : null, body,
        buttons && buttons.length ? h('div', { class: 'mdl-a' }, buttons.map(b => h('button', { class: 'btn ' + (b.pri ? 'pri' : ''), onclick: () => close(b.v) }, b.label))) : null));
    document.addEventListener('keydown', esc);
    document.body.append(ov);
  });
}
function openVideo() {
  modal('Video hướng dẫn sử dụng', h('div', {},
    h('div', { class: 'vid' }, h('iframe', { src: `https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?rel=0`, allow: 'accelerometer; autoplay; encrypted-media; picture-in-picture', allowfullscreen: true, title: 'Video hướng dẫn' })),
    h('div', { class: 'muted small', style: { marginTop: '8px' } }, 'Cần kết nối mạng để xem video. ', h('a', { href: `https://www.youtube.com/watch?v=${DEMO_VIDEO_ID}`, target: '_blank', rel: 'noopener' }, 'Mở trên YouTube ↗'))), null, true);
}
/* đoán file Excel/CSV là danh sách hay file mẫu */
async function sniffSheet(file) {
  const ext = extOf(file.name);
  if (!['xlsx', 'xlsm', 'xls', 'csv', 'ods'].includes(ext)) return null;
  try {
    const buf = await file.arrayBuffer();
    const wb = ext === 'csv' ? XLSX.read(new TextDecoder('utf-8').decode(buf).replace(/^﻿/, ''), { type: 'string', raw: true }) : XLSX.read(buf, { type: 'array' });
    let all = '';
    for (const n of wb.SheetNames) { const ws = wb.Sheets[n]; for (const k in ws) if (k[0] !== '!' && ws[k] && ws[k].t === 's') all += ws[k].v + '\n'; }
    const markers = findMarkers(nfc(all)).filter(m => !m.weak).length;
    const ws = wb.Sheets[wb.SheetNames.find(n => wb.Sheets[n]['!ref']) || wb.SheetNames[0]];
    const aoa = ws ? XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' }) : [];
    const hi = aoa.findIndex(r => r.some(v => v !== ''));
    const head = hi >= 0 ? aoa[hi].map(v => String(v).trim()) : [];
    const nonEmptyHead = head.filter(Boolean);
    const textHead = nonEmptyHead.filter(v => isNaN(+v)).length;
    const body = hi >= 0 ? aoa.slice(hi + 1) : [];
    const goodRows = body.filter(r => r.filter(v => v !== '').length >= Math.max(2, nonEmptyHead.length * 0.5)).length;
    const merged = (ws && ws['!merges'] || []).length;
    const listy = !markers && textHead >= 2 && new Set(nonEmptyHead).size === nonEmptyHead.length && goodRows >= 2 && merged <= 1;
    return { kind: markers ? 'tpl' : listy ? 'list' : '?', markers, rows: goodRows, headers: nonEmptyHead };
  } catch (e) { return null; }
}
async function confirmKind(file, chosen) {
  const sn = await sniffSheet(file); if (!sn || sn.kind === '?' || sn.kind === chosen) return chosen;
  const body = sn.kind === 'list'
    ? h('div', {}, h('p', {}, 'File ', h('b', {}, file.name), ' trông giống một ', h('b', {}, 'file danh sách'), ` (${sn.rows} dòng dữ liệu, ${sn.headers.length} cột) hơn là file thành phẩm mẫu.`),
      h('div', { class: 'mkchips' }, sn.headers.slice(0, 10).map(x => h('span', { class: 'mkchip' }, x)), sn.headers.length > 10 ? h('span', { class: 'mkchip weak' }, `+${sn.headers.length - 10} cột`) : null),
      h('p', { class: 'muted small' }, 'Bạn muốn dùng file này làm gì?'))
    : h('div', {}, h('p', {}, 'File ', h('b', {}, file.name), ' có ', h('b', {}, `${sn.markers} ký hiệu trường [Tên cột]`), ' – trông giống ', h('b', {}, 'file thành phẩm mẫu'), ' hơn là file danh sách.'), h('p', { class: 'muted small' }, 'Bạn muốn dùng file này làm gì?'));
  const v = await modal('Kiểm tra lại loại file', body, [
    { label: sn.kind === 'list' ? 'Dùng làm file danh sách' : 'Dùng làm file thành phẩm mẫu', v: sn.kind, pri: true },
    { label: chosen === 'list' ? 'Vẫn là file danh sách' : 'Vẫn là file thành phẩm mẫu', v: chosen }]);
  return v;
}

/* ---------- trang đầu ---------- */
async function onHomeFile(file) {
  const ext = extOf(file.name);
  let kind = S.homeKind;
  if (['docx', 'doc', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) kind = 'tpl';
  else if (['csv', 'xls', 'ods'].includes(ext)) kind = 'list';
  else if (!['xlsx', 'xlsm'].includes(ext)) { toast('Chưa hỗ trợ định dạng này. Dùng Word, Excel, PDF, ảnh hoặc CSV.', 4000); return; }
  if (kind !== S.homeKind) toast(kind === 'tpl' ? 'File này được nhận là file thành phẩm mẫu.' : 'File này được nhận là file danh sách.', 3500);
  if (['xlsx', 'xlsm'].includes(ext)) { const v = await confirmKind(file, kind); if (!v) return; kind = v; S.homeKind = v; }
  S.first = kind; S.manual = false; S.tplTab = 'have'; S.showGuide = false;
  S.step = kind === 'list' ? 'data' : 'tpl';
  if (kind === 'list') await onDataFile(file); else await onTplFile(file);
}
function viewHome() {
  const k = S.homeKind;
  const inp = h('input', { type: 'file', accept: k === 'list' ? '.xlsx,.xlsm,.xls,.csv,.ods' : '.docx,.xlsx,.xlsm,.pdf,.png,.jpg,.jpeg,.webp', hidden: true });
  inp.addEventListener('change', () => inp.files[0] && onHomeFile(inp.files[0]));
  const ck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  const drop = h('div', { class: 'hz' },
    h('div', { class: 'hz-doc', html: `<svg viewBox="0 0 64 80"><path d="M6 2h36l16 16v56a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#fff" stroke="#E3DACB" stroke-width="2"/><path d="M42 2v16h16" fill="#F4EFE5" stroke="#E3DACB" stroke-width="2"/><rect x="8" y="44" width="40" height="18" rx="4" fill="${k === 'list' ? '#217346' : '#B06A22'}"/><text x="28" y="57.5" text-anchor="middle" font-family="Lexend,Segoe UI,sans-serif" font-size="11" font-weight="600" fill="#fff">${k === 'list' ? 'xlsx' : 'mẫu'}</text></svg>` }),
    h('div', { class: 'hz-t' }, k === 'list' ? 'Thả file danh sách vào đây' : 'Thả file thành phẩm mẫu vào đây'),
    h('div', { class: 'hz-s' }, k === 'list' ? 'Excel hoặc CSV · dòng đầu là tên cột' : 'Word · Excel · PDF · Ảnh'),
    h('div', { class: 'hz-or' }, h('span', {}, 'hoặc')),
    h('button', { class: 'hbtn', onclick: () => inp.click() }, h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>' }), 'Tải file lên để bắt đầu'), inp);
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) onHomeFile(f); });
  const ico = { tpl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg>', list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></svg>' };
  const kindBtn = (v, t, s) => h('button', { class: 'hk' + (k === v ? ' on' : ''), onclick: () => { S.homeKind = v; render(); } }, h('span', { class: 'hk-ic', html: ico[v] }), h('span', {}, h('b', {}, t), h('span', {}, s)), h('i', {}));
  const hero = h('div', { class: 'hero' },
    h('div', { class: 'hero-l' },
      h('div', { class: 'eyebrow' }, 'Bộ công cụ · Hành chính – Nhân sự'),
      h('h1', {}, 'Tạo văn bản ', h('span', {}, 'hàng loạt'), h('br'), 'từ một file mẫu'),
      h('p', { class: 'lead' }, 'Hợp đồng, giấy mời, chứng chỉ, phiếu lương… cho hàng trăm người chỉ trong vài phút, từ một file mẫu và một danh sách Excel.'),
      h('ul', { class: 'hl' }, [
        'Word, Excel, PDF, ảnh – giữ nguyên định dạng mẫu',
        'Tự nhận diện trường theo ký hiệu [Tên cột]',
        'Xem thử từng bản, tải gộp một file hoặc tách từng file',
        'Xử lý 100% trên máy bạn, dữ liệu không gửi đi đâu'].map(t => h('li', {}, h('span', { class: 'ck', html: ck }), t))),
      h('div', { class: 'row', style: { gap: '12px', marginBottom: '16px' } },
        h('button', { class: 'vbtn', onclick: openVideo }, h('span', { class: 'vplay', html: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' }), h('span', {}, h('b', {}, 'Xem video hướng dẫn'), h('span', {}, 'Demo từng bước sử dụng'))),
        h('button', { class: 'vbtn demo', onclick: runDemo, title: 'Nạp sẵn phiếu lương mẫu và danh sách lương mẫu' }, h('span', { class: 'vplay', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>' }), h('span', {}, h('b', {}, 'Thử ngay với ví dụ'), h('span', {}, 'Phiếu lương mẫu · 8 nhân viên')))),
      h('div', { class: 'hero-foot' }, 'Miễn phí · Không cần cài đặt · Dùng được khi không có mạng')),
    h('div', { class: 'hero-r' },
      h('span', { class: 'fb fb1' }, 'docx'), h('span', { class: 'fb fb2' }, 'xlsx'), h('span', { class: 'fb fb3' }, 'pdf'),
      h('div', { class: 'upcard' },
        h('div', { class: 'hk-t' }, h('span', {}, '1'), 'Chọn loại file bạn sẽ tải lên'),
        h('div', { class: 'hks' }, kindBtn('tpl', 'File thành phẩm mẫu', 'Văn bản/chứng chỉ mẫu'), kindBtn('list', 'File danh sách', 'Excel/CSV mỗi người một dòng')),
        drop)));
  const how = h('div', { class: 'how' }, h('div', { class: 'how-t' }, 'Cách hoạt động'),
    h('div', { class: 'how-g' }, [
      ['1', 'Chuẩn bị file mẫu', 'Gõ [Tên cột] vào chỗ cần thay trong Word, Excel hoặc PDF.'],
      ['2', 'Tải danh sách', 'Excel/CSV, dòng đầu là tên cột, mỗi người một dòng.'],
      ['3', 'Ghép & xem thử', 'Công cụ tự ghép theo tên, bạn kiểm tra từng bản.'],
      ['4', 'Tải về', 'Gộp một file hoặc mỗi người một file nén ZIP.']].map(([n, t, d]) => h('div', { class: 'how-i' }, h('b', {}, n), h('h4', {}, t), h('p', {}, d)))),
    h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '18px' } },
      h('button', { class: 'btn', onclick: () => { S.first = 'tpl'; S.step = 'tpl'; S.tplTab = 'guide'; render(); } }, 'Chưa có file mẫu? Xem hướng dẫn & ví dụ'),
      demoBtn('btn'),
      h('button', { class: 'btn ghost', onclick: () => sampleDownload('docx', 'mau-phieu-luong.docx') }, '⬇ Phiếu lương mẫu'),
      h('button', { class: 'btn ghost', onclick: () => sampleDownload('list', 'danh-sach-luong-mau.xlsx') }, '⬇ Danh sách lương mẫu')));
  const more = h('a', { class: 'morecta', href: TOOLS_URL, target: /^https?:$/.test(location.protocol) ? null : '_blank', rel: 'noopener' },
    h('span', { class: 'mc-i', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' }),
    h('b', {}, 'Công cụ hữu ích khác'), h('span', { class: 'mc-a' }, '→'));
  return h('div', {}, hero, how, more);
}
async function showTplPreview(pv) {
  const T = S.tpl; if (!T) return;
  try {
    if (T.kind === 'docx') {
      pv.innerHTML = '';
      await docx.renderAsync(new Blob([T.bytes]), pv, null, { inWrapper: true, ignoreLastRenderedPageBreak: true, breakPages: true });
    } else if (T.kind === 'xlsx') { pv.innerHTML = ''; pv.style.background = 'var(--paper)'; pv.append(xlsxGrid(T, null)); }
    else { pv.innerHTML = ''; for (const P of T.pages.slice(0, 6)) pv.append(h('img', { src: P.url || (P.url = P.canvas.toDataURL('image/jpeg', .85)), alt: '' })); }
  } catch (e) { console.warn(e); pv.innerHTML = ''; pv.append(h('div', { class: 'muted small' }, 'Không dựng được bản xem trực quan cho file này, nhưng vẫn xử lý được.')); }
}

/* ---------- BƯỚC 2: danh sách ---------- */
async function onDataFile(file) {
  const ext = extOf(file.name);
  if (!['xlsx', 'xlsm', 'xls', 'csv', 'ods'].includes(ext)) { toast('Danh sách cần là file Excel (.xlsx, .xls) hoặc .csv', 4000); return; }
  try {
    const buf = await file.arrayBuffer();
    let wb;
    if (ext === 'csv') { let txt = new TextDecoder('utf-8').decode(buf).replace(/^﻿/, ''); wb = XLSX.read(txt, { type: 'string', raw: true }); }
    else wb = XLSX.read(buf, { type: 'array', cellNF: true, cellText: true, cellDates: false });
    const sheet = wb.SheetNames.find(n => wb.Sheets[n]['!ref']) || wb.SheetNames[0];
    S.data = { name: file.name, size: file.size, kind: ext === 'csv' ? 'csv' : 'xlsx', wb, sheet, q: '' };
    parseSheet();
    if (wb.SheetNames.length > 1) setTimeout(() => toast(`File có ${wb.SheetNames.length} trang tính – đang lấy “${sheet}”. Chọn trang tính khác ngay bên dưới tên file.`, 5000), 300);
    resetMapping();
  } catch (e) { console.error(e); toast('Không đọc được file danh sách.', 4000); }
  render();
}
function parseSheet() {
  const d = S.data, ws = d.wb.Sheets[d.sheet];
  d.headers = []; d.rows = []; d.sel = new Set();
  if (!ws || !ws['!ref']) return;
  const R = XLSX.utils.decode_range(ws['!ref']);
  const at = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
  let hr = R.s.r;
  for (; hr <= R.e.r; hr++) { let any = false; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(hr, c); if (x && x.v !== '' && x.v != null) { any = true; break; } } if (any) break; }
  const cols = [];
  for (let c = R.s.c; c <= R.e.c; c++) { const x = at(hr, c); cols.push({ c, name: x ? nfc(x.w != null ? x.w : x.v).trim().replace(/\s+/g, ' ') : '' }); }
  const rows = [];
  for (let r = hr + 1; r <= R.e.r; r++) { const cells = cols.map(k => mkCell(at(r, k.c))); if (cells.every(x => x.e)) continue; rows.push({ r: r + 1, cells }); }
  const keep = cols.map((k, i) => !!k.name || rows.some(rw => !rw.cells[i].e));
  const seen = {};
  d.headers = cols.filter((_, i) => keep[i]).map(k => {
    let n = k.name || 'Cột ' + XLSX.utils.encode_col(k.c);
    if (seen[n]) n = `${n} (${++seen[n]})`; else seen[n] = 1;
    return n;
  });
  d.rows = rows.map(rw => ({ r: rw.r, cells: rw.cells.filter((_, i) => keep[i]) }));
  d.headerRow = hr + 1;
  d.sel = new Set(d.rows.map((_, i) => i));
  S.out.pattern = '';
}
function viewData() {
  const d = D();
  const card = h('div', { class: 'card' }, h('h2', {}, 'Tải lên danh sách'),
    h('p', { class: 'sub' }, 'File Excel hoặc CSV, dòng đầu tiên là tên các cột (Họ và tên, Ngày sinh, Chức vụ…). Mỗi dòng phía dưới sẽ tạo ra một bản.'));
  if (!d) {
    card.append(dropZone('.xlsx,.xlsm,.xls,.csv,.ods', 'Thả file danh sách vào đây', [['xlsx', 'Excel .xlsx .xls'], ['xlsx', 'CSV']], async f => {
      const v = await confirmKind(f, 'list'); if (!v) return;
      if (v === 'tpl') { S.manual = false; await onTplFile(f); return; }
      onDataFile(f);
    }));
    if (S.tpl && hasMarkers(S.tpl)) card.append(h('div', { class: 'row', style: { marginTop: '12px' } }, h('span', { class: 'muted small' }, 'Chưa có danh sách?'),
      h('button', { class: 'btn cta', onclick: downloadBlankList }, `⬇ Tải file danh sách trống (${uniqMarkerNames().length} cột theo file mẫu)`)));
    return h('div', {}, card, navBar());
  }
  card.append(fileInfo(d.kind, d.name, (d.wb.SheetNames.length > 1 ? `Trang tính “${d.sheet}” · ` : '') + `${d.rows.length} dòng dữ liệu · ${d.headers.length} cột · tiêu đề ở dòng ${d.headerRow || 1}`, () => { S.data = null; resetMapping(); render(); }));
  if (d.wb.SheetNames.length > 1) {
    /* file có nhiều trang tính: chọn trang tính lấy dữ liệu */
    const nRows = n => { const ref = d.wb.Sheets[n] && d.wb.Sheets[n]['!ref']; if (!ref) return 0; const r = XLSX.utils.decode_range(ref); return Math.max(0, r.e.r - r.s.r); };
    card.append(h('div', { class: 'sheetpick' },
      h('div', { class: 'lbl' }, `File có ${d.wb.SheetNames.length} trang tính – chọn trang tính lấy dữ liệu`),
      h('div', { class: 'sp-l' }, d.wb.SheetNames.map(n => {
        const k = nRows(n);
        return h('button', { class: 'sp-i' + (n === d.sheet ? ' on' : ''), disabled: !k, title: k ? '' : 'Trang tính trống',
          onclick: () => { if (n === d.sheet) return; d.sheet = n; d.q = ''; parseSheet(); resetMapping(); render(); toast(`Đã lấy dữ liệu từ trang tính “${n}”.`); } },
          h('span', { class: 'sp-ic', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>' }),
          h('b', {}, n), h('span', {}, k ? `~${k} dòng` : 'trống'));
      }))));
  }
  if (!d.rows.length) { card.append(h('div', { class: 'note err' }, 'Trang tính này chưa có dữ liệu.')); return h('div', {}, card, navBar()); }
  if (S.tpl && hasMarkers(S.tpl)) {
    const miss = uniqMarkerNames().filter(n => matchColumn(d.headers, n) < 0);
    if (miss.length) card.append(h('div', { class: 'note' }, h('span', {}, '⚠'), h('span', {}, h('b', {}, `${miss.length} trường trong mẫu chưa có cột cùng tên: `), miss.map(n => `[${n}]`).join(', '), '. Bạn có thể ghép tay ở bước sau, hoặc sửa tên cột trong danh sách cho trùng.')));
  }
  const cnt = h('span', { class: 'muted small' });
  const q = h('input', { class: 'inp', placeholder: 'Tìm trong danh sách…', value: d.q || '', style: { flex: '1', maxWidth: '320px' } });
  const tbl = h('div', { class: 'tblwrap' });
  const draw = () => {
    const qq = nfc(q.value).toLocaleLowerCase('vi').trim(); d.q = q.value;
    const vis = d.rows.map((rw, i) => i).filter(i => !qq || d.rows[i].cells.some(c => c.d.toLocaleLowerCase('vi').includes(qq)));
    const shown = vis.slice(0, 500);
    const allCk = h('input', { type: 'checkbox', checked: vis.length > 0 && vis.every(i => d.sel.has(i)) });
    allCk.addEventListener('change', () => { vis.forEach(i => allCk.checked ? d.sel.add(i) : d.sel.delete(i)); draw(); renderSteps(); });
    const t = h('table', { class: 'dt' }, h('thead', {}, h('tr', {}, h('th', { class: 'ck' }, allCk), h('th', {}, '#'), d.headers.map(x => h('th', { title: x }, x)))),
      h('tbody', {}, shown.map(i => {
        const rw = d.rows[i];
        const ck = h('input', { type: 'checkbox', checked: d.sel.has(i) });
        const tr = h('tr', { class: d.sel.has(i) ? '' : 'off' }, h('td', { class: 'ck' }, ck), h('td', { class: 'ix' }, rw.r), rw.cells.map(c => h('td', { title: c.d }, c.d)));
        ck.addEventListener('change', () => { ck.checked ? d.sel.add(i) : d.sel.delete(i); tr.className = ck.checked ? '' : 'off'; cnt.textContent = `Đã chọn ${d.sel.size}/${d.rows.length} dòng`; renderSteps(); });
        return tr;
      })));
    tbl.innerHTML = ''; tbl.append(t);
    if (vis.length > shown.length) tbl.append(h('div', { class: 'muted small', style: { padding: '8px 12px' } }, `Đang hiện 500/${vis.length} dòng khớp. Các dòng còn lại vẫn được xử lý theo lựa chọn.`));
    cnt.textContent = `Đã chọn ${d.sel.size}/${d.rows.length} dòng`;
  };
  q.addEventListener('input', draw);
  card.append(h('div', { class: 'tbar' }, q,
    h('button', { class: 'btn sm', onclick: () => { d.rows.forEach((_, i) => d.sel.add(i)); draw(); renderSteps(); } }, 'Chọn tất cả'),
    h('button', { class: 'btn sm', onclick: () => { d.sel.clear(); draw(); renderSteps(); } }, 'Bỏ chọn'), cnt), tbl);
  draw();
  return h('div', {}, card, navBar());
}

/* ---------- nhận diện trường ---------- */
function weightText(t) { const L = t.length; const dig = /^[\d.,\/\- ]+$/.test(t); if (L >= 6) return dig ? 2.5 : 3; if (L >= 4) return dig ? 1 : 2; if (L === 3) return dig ? 0.4 : 1; return 0.2; }
function hitsForRow(i, hay) {
  const T = S.tpl, d = D(), hits = []; let score = 0;
  d.headers.forEach((_, j) => {
    const c = d.rows[i].cells[j]; if (c.e) return;
    if (T.numSet && T.numSet.size) {
      const nv = numTarget(c);
      if (nv != null && T.numSet.has(nv)) { hits.push({ col: j, kind: 'num', num: nv }); score += Math.abs(nv) >= 1000 ? 2.5 : 0.3; return; }
    }
    for (const v of variants(c)) {
      const t = cmp(v.text); if (t.length < 2) continue;
      if (hay.includes(t) && countWord(hay, t) > 0) { hits.push({ col: j, kind: 'text', fmt: v.fmt, text: v.text }); score += weightText(t); break; }
    }
  });
  return { i, score, hits };
}
function firstCell(j) {
  const d = D(), idx = [...d.sel].sort((a, b) => a - b);
  for (const i of (idx.length ? idx : d.rows.map((_, k) => k))) { const c = d.rows[i].cells[j]; if (c && !c.e) return c; }
  return null;
}
function markerFmt(j) { return S.tpl.kind === 'xlsx' ? 'raw' : suggestFmt(firstCell(j), null, D().headers[j]); }
function detect(forceRow) {
  const T = S.tpl, d = D();
  const keepManual = S.detected ? { rules: S.rules.filter(r => r.src === 'manual'), boxes: S.boxes.filter(b => b.src === 'manual') } : null;
  S.mode = T.markers && T.markers.length ? 'marker' : 'value';
  if (S.mode === 'marker') {
    /* Cách chính: ký hiệu [Tên cột], {{Tên cột}}, «Tên cột» trong file mẫu */
    const first = [...d.sel].sort((a, b) => a - b)[0];
    S.sampleRow = forceRow != null && forceRow >= 0 ? forceRow : (first != null ? first : 0);
    const mk = T.markers.map(m => { const j = matchColumn(d.headers, m.name); return { ...m, col: j >= 0 ? j : null }; });
    S.detectInfo = { n: mk.filter(m => m.col != null).length, total: mk.length };
    if (engine() === 'text') {
      S.rules = sortRulesByPos(mk.map(m => ({ id: UID++, kind: 'text', find: m.token, anchor: m.anchor, name: m.name, col: m.col, fmt: m.col != null ? markerFmt(m.col) : 'raw', on: m.col != null, conf: m.col != null ? 'hi' : 'nomatch', src: 'mk', alts: [] })));
      S.boxes = [];
    } else {
      const boxes = [];
      const finds = mk.map(m => ({ find: m.token, key: m.col, fmt: m.col != null ? markerFmt(m.col) : 'raw', name: m.name, anchor: m.anchor }));
      T.pages.forEach((P, pi) => {
        for (const m of planMatches(cmp(P.str), finds)) {
          const bx = boxFromMatch(T, pi, m.a, m.b, m.f.anchor); if (!bx) continue;
          boxes.push({ id: UID++, ...bx, col: m.f.key, fmt: m.f.fmt, on: m.f.key != null, conf: m.f.key != null ? 'hi' : 'nomatch', orig: m.f.find, src: 'auto' });
        }
      });
      S.boxes = boxes; S.rules = [];
    }
  } else {
    /* Dự phòng: mẫu không có ký hiệu → dò giá trị của danh sách trong mẫu */
    const hay = cmp(T.text || '');
    let best = { i: -1, score: 0, hits: [] };
    if (forceRow != null && forceRow >= 0) best = hitsForRow(forceRow, hay);
    else if (hay || (T.numSet && T.numSet.size)) {
      const N = Math.min(d.rows.length, 2000);
      for (let i = 0; i < N; i++) { const r = hitsForRow(i, hay); if (r.score > best.score) best = r; }
    }
    S.sampleRow = best.i >= 0 ? best.i : (forceRow != null ? forceRow : 0);
    S.detectInfo = { score: best.score, n: best.hits.length };
    if (engine() === 'text') {
      const byText = new Map(), rules = [];
      for (const x of best.hits) {
        if (x.kind === 'num') { const ex = rules.find(r => r.kind === 'num' && r.num === x.num); if (ex) { ex.alts.push(x.col); continue; } rules.push({ id: UID++, kind: 'num', num: x.num, find: String(x.num), col: x.col, fmt: 'raw', on: true, conf: Math.abs(x.num) >= 1000 ? 'hi' : 'lo', src: 'auto', alts: [] }); continue; }
        const k = cmp(x.text);
        if (byText.has(k)) { byText.get(k).alts.push(x.col); continue; }
        const lo = k.length <= 3 || (/^[\d.,\/]+$/.test(k) && k.length <= 4);
        const r = { id: UID++, kind: 'text', find: x.text, col: x.col, fmt: x.fmt, on: !lo, conf: lo ? 'lo' : 'hi', src: 'auto', alts: [] };
        byText.set(k, r); rules.push(r);
      }
      rules.forEach(r => { if (r.alts.length) r.conf = 'dup'; });
      if (T.kind === 'docx') {
        /* Word chưa có ký hiệu: không tự ghép (dễ sai) – đánh dấu "ô chờ": dòng chấm/gạch dưới + chỗ trùng giá trị danh sách */
        const cands = docxPlaceholders(T);
        for (const r of cands.length ? [] : rules) { /* mẫu đã có dòng chấm để điền → không cần dò giá trị */
          if (r.kind !== 'text' || r.conf === 'lo') continue;
          T.paras.forEach(P => {
            if (P.part !== 'word/document.xml') return;
            const t = cmp(P.text), q = cmp(r.find); let i = 0;
            while ((i = t.indexOf(q, i)) >= 0) { const b = i + q.length; if (boundaryOK(t, i, b, q) && !cands.some(c => c.pos.gi === P.gi && c.pos.a < b && c.pos.a + c.find.length > i)) cands.push({ id: 'v' + P.gi + '_' + i, pos: { part: P.part, gi: P.gi, a: i }, find: t.slice(i, b), label: '' }); i = b; }
          });
        }
        S.cands = cands; S.rules = []; S.boxes = [];
      } else { S.rules = sortRulesByPos(rules); S.boxes = []; }
    } else {
      /* mẫu PDF/ảnh chưa có ký hiệu: không tự ghép theo giá trị (dễ sai) – chỉ đánh dấu các "ô chờ" để bấm chọn */
      S.boxes = []; S.rules = [];
    }
  }
  if (keepManual) { S.rules.push(...keepManual.rules); S.boxes.push(...keepManual.boxes); }
  if (engine() === 'box') S.cands = S.mode === 'value' && T.hasText ? fieldCandidates(T) : [];
  else if (!(T.kind === 'docx' && S.mode === 'value')) S.cands = [];
  S.detected = true; S.selRule = S.selBox = null;
  if (T.kind === 'pdf' && T.hasText) setTimeout(() => autoLocalFonts(true), 0);
}
function sortRulesByPos(rules) {
  const hay = cmp(S.tpl.text || '');
  const pos = r => { if (r.kind === 'num') return 1e9 + (S.tpl.cells || []).findIndex(c => c.kind === 'n' && c.n === r.num); const i = hay.indexOf(cmp(r.find)); return i < 0 ? 1e9 : i; };
  return rules.slice().sort((a, b) => pos(a) - pos(b));
}
function ruleCount(r) {
  if (r.pos) return 1;
  if (r.kind === 'num') return (S.tpl.cells || []).filter(c => c.kind === 'n' && c.n === r.num).length;
  const finds = S.rules.filter(x => x.kind === 'text' && !x.pos).map(x => ({ find: x.find, key: x.id }));
  const hay = cmp(S.tpl.text || '');
  return planMatches(hay, finds).filter(m => m.f.key === r.id).length;
}
