'use strict';
/* ============================================================
   Tạo văn bản hàng loạt – Quản trị tử tế
   Lõi xử lý: danh sách, định dạng, nhận diện trường, sinh file
   Toàn bộ chạy trong trình duyệt, không gửi dữ liệu ra ngoài.
   ============================================================ */
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const S_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

const COLORS = ['#B06A22', '#2F7D4F', '#2F5F8F', '#8E4A9E', '#B8452F', '#1E8A8A', '#8A7A1E', '#C2477A', '#4A5FC1', '#5E7D2F', '#A0522D', '#3B8BC2'];
const colColor = j => COLORS[((j % COLORS.length) + COLORS.length) % COLORS.length];

const FMTS = {
  raw: 'Như trong danh sách',
  dmy: 'dd/mm/yyyy', dmy1: 'd/m/yyyy', dmyd: 'dd-mm-yyyy', dmyp: 'dd.mm.yyyy',
  long: 'dd tháng mm năm yyyy', iso: 'yyyy-mm-dd',
  ndot: '1.000.000', ncomma: '1,000,000', nplain: '1000000', pad2: 'Thêm số 0 phía trước (9 → 09)',
  upper: 'CHỮ IN HOA', lower: 'chữ thường', title: 'Viết Hoa Đầu Từ'
};
const DATE_FMTS = ['dmy', 'dmy1', 'dmyd', 'dmyp', 'long', 'iso'];
const NUM_FMTS = ['ndot', 'ncomma', 'nplain'];

/* ---------- tiện ích ---------- */
const nfc = s => (s == null ? '' : String(s)).normalize('NFC');
const cmp = s => s.replace(/[   ]/g, ' ');
const pad = n => String(n).padStart(2, '0');
const extOf = n => (n.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
const WORDCH = /[\p{L}\p{N}]/u;
const parseXml = s => new DOMParser().parseFromString(s, 'application/xml');
const serXml = d => { const s = new XMLSerializer().serializeToString(d); return s.startsWith('<?xml') ? s : XML_DECL + s; };
const sleep0 = () => new Promise(r => setTimeout(r, 0));

/* ---------- ô dữ liệu & định dạng ---------- */
function mkCell(x) {
  if (!x || x.v == null || x.v === '') return { e: true, v: '', w: '', d: '', t: 'z' };
  let v = x.v, t = x.t;
  let w = nfc(t === 's' || t === 'str' ? String(v) : (x.w != null ? x.w : String(v))).trim();
  if (typeof v === 'string') v = nfc(v).trim();
  const isDate = t === 'n' && !!x.z && XLSX.SSF.is_date(x.z);
  const c = { e: false, v, t, w, isDate, z: x.z || '' };
  c.d = defaultDisp(c);
  if (c.d === '' && w === '') c.e = true;
  return c;
}
function defaultDisp(c) {
  if (c.isDate) return fmtValue(c, 'dmy');
  if (c.t === 'n' && typeof c.v === 'number') {
    if (/#,##|,0/.test(c.z)) return fmtNum(c.v, 'ndot');
    if (Number.isInteger(c.v)) return String(c.v);
    return c.w;
  }
  if (c.t === 'b') return c.v ? 'Có' : 'Không';
  return c.w;
}
function dateParts(c) {
  if (!c || c.e) return null;
  if (c.isDate && typeof c.v === 'number') {
    const p = XLSX.SSF.parse_date_code(c.v);
    if (p && p.y > 1900) return { d: p.d, m: p.m, y: p.y };
    return null;
  }
  const s = String(c.w).trim();
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31) return { d: +m[1], m: +m[2], y: +m[3] };
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { d: +m[3], m: +m[2], y: +m[1] };
  return null;
}
const dateSerial = p => (Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(1899, 11, 30)) / 86400000;
function numOf(c) {
  if (!c || c.e) return null;
  if (c.t === 'n' && typeof c.v === 'number' && !c.isDate) return c.v;
  if (c.isDate) return null;
  let s = String(c.w).replace(/\s|đồng|đ|VNĐ|VND/gi, '');
  if (!s) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return +s.replace(/\./g, '').replace(',', '.');
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return +s.replace(/,/g, '');
  if (/^-?\d+([.,]\d+)?$/.test(s)) return +s.replace(',', '.');
  return null;
}
function fmtNum(n, fmt) {
  const neg = n < 0; n = Math.abs(n);
  let [i, d] = String(+n.toFixed(6)).split('.');
  if (fmt === 'nplain') return (neg ? '-' : '') + i + (d ? ',' + d : '');
  const sep = fmt === 'ncomma' ? ',' : '.', dec = fmt === 'ncomma' ? '.' : ',';
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (neg ? '-' : '') + i + (d ? dec + d : '');
}
function fmtValue(c, fmt) {
  if (!c || c.e) return '';
  const base = c.d != null ? c.d : c.w;
  if (DATE_FMTS.includes(fmt)) {
    const p = dateParts(c); if (!p) return base;
    const dd = pad(p.d), mm = pad(p.m);
    return fmt === 'dmy' ? `${dd}/${mm}/${p.y}` : fmt === 'dmy1' ? `${p.d}/${p.m}/${p.y}` : fmt === 'dmyd' ? `${dd}-${mm}-${p.y}`
      : fmt === 'dmyp' ? `${dd}.${mm}.${p.y}` : fmt === 'long' ? `${dd} tháng ${mm} năm ${p.y}` : `${p.y}-${mm}-${dd}`;
  }
  if (NUM_FMTS.includes(fmt)) { const n = numOf(c); return n == null ? base : fmtNum(n, fmt); }
  if (fmt === 'pad2') return /^\d$/.test(String(base).trim()) ? '0' + String(base).trim() : base;
  if (fmt === 'upper') return base.toLocaleUpperCase('vi');
  if (fmt === 'lower') return base.toLocaleLowerCase('vi');
  if (fmt === 'title') return base.toLocaleLowerCase('vi').replace(/(^|[\s(\-–])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('vi'));
  return base;
}
/* các cách một giá trị có thể xuất hiện trong file mẫu */
function variants(c) {
  if (!c || c.e) return [];
  const out = [], seen = new Set();
  const add = (fmt, text) => { text = nfc(text); if (text && !seen.has(text)) { seen.add(text); out.push({ fmt, text }); } };
  const dp = dateParts(c);
  if (dp) { for (const f of ['long', 'dmy', 'dmy1', 'dmyd', 'dmyp', 'iso']) add(f, fmtValue(c, f)); }
  else {
    const n = numOf(c);
    if (n != null) {
      if (Math.abs(n) >= 1000) { add('ndot', fmtNum(n, 'ndot')); add('ncomma', fmtNum(n, 'ncomma')); }
      add('nplain', fmtNum(n, 'nplain'));
    }
  }
  add('raw', c.d);
  if (c.w !== c.d) add('raw', c.w);
  const up = String(c.d).toLocaleUpperCase('vi');
  if (up !== c.d) add('upper', up);
  return out;
}
/* cột kiểu mã/năm/số điện thoại: giữ nguyên chữ số, không chèn dấu chấm nghìn */
const PLAIN_COL = /(^|[\s_(])(năm|nam|year|yyyy|mã|ma|code|id|số hiệu|so hieu|số vào sổ|stt|sđt|sdt|điện thoại|dien thoai|phone|cccd|cmnd|mst|tài khoản|tai khoan)([\s_)]|$)/i;
function suggestFmt(c, findText, head) {
  if (!c || c.e) return 'raw';
  if (findText != null) { const v = variants(c).find(x => cmp(x.text) === cmp(findText)); if (v) return v.fmt; }
  if (dateParts(c)) return 'dmy';
  const n = numOf(c);
  if (head && PLAIN_COL.test(head)) return 'raw';
  if (n != null && Number.isInteger(n) && n >= 1000 && n <= 2200) return 'raw'; /* trông như năm */
  if (n != null && Math.abs(n) >= 1000) return 'ndot';
  return 'raw';
}
/* giá trị số dùng khi thay ô số trong Excel */
function numTarget(c) {
  if (!c || c.e) return null;
  if (c.isDate && typeof c.v === 'number') return c.v;
  const dp = dateParts(c); if (dp) return dateSerial(dp);
  return numOf(c);
}

/* ---------- tìm & thay trong chuỗi bị chia nhỏ ---------- */
function boundaryOK(hay, a, b, needle) {
  if (WORDCH.test(needle[0]) && a > 0 && WORDCH.test(hay[a - 1])) return false;
  if (WORDCH.test(needle[needle.length - 1]) && b < hay.length && WORDCH.test(hay[b])) return false;
  return true;
}
function countWord(hay, t) {
  let n = 0, i = 0;
  while ((i = hay.indexOf(t, i)) >= 0) { if (boundaryOK(hay, i, i + t.length, t)) n++; i += 1; }
  return n;
}
/* finds: [{find, text?, key}] — ưu tiên đoạn dài hơn, không chồng lấn */
function planMatches(hay, finds) {
  const sorted = finds.filter(f => f.find).map(f => ({ ...f, q: cmp(f.find) })).sort((a, b) => b.q.length - a.q.length);
  const taken = [], res = [];
  const overlaps = (a, b) => taken.some(([x, y]) => a < y && b > x);
  for (const f of sorted) {
    let i = 0;
    while ((i = hay.indexOf(f.q, i)) >= 0) {
      const b = i + f.q.length;
      if (f.pos && i !== f.pos.a) { i++; continue; } /* trường theo vị trí: chỉ thay đúng chỗ đã chọn */
      if ((f.pos || boundaryOK(hay, i, b, f.q)) && !overlaps(i, b)) { res.push({ a: i, b, f }); taken.push([i, b]); i = b; }
      else i++;
    }
  }
  return res.sort((x, y) => x.a - y.a);
}
function applyRepl(segs, finds) {
  if (!finds.length) return null;
  const hay = cmp(segs.join(''));
  const ms = planMatches(hay, finds);
  if (!ms.length) return null;
  const out = segs.slice();
  for (let k = ms.length - 1; k >= 0; k--) {
    const m = ms[k];
    const offs = []; let o = 0; for (const s of out) { offs.push(o); o += s.length; }
    /* chữ mới đặt vào đoạn chứa ký tự "neo" (ký tự đầu của tên trường) để giữ định dạng của ký hiệu */
    const ap = Math.min(m.b - 1, m.a + (m.f.anchor || 0));
    let anc = -1;
    for (let q = 0; q < out.length; q++) if (out[q].length && offs[q] <= ap && ap < offs[q] + out[q].length) { anc = q; break; }
    let placed = false;
    for (let q = out.length - 1; q >= 0; q--) {
      const st = Math.max(m.a, offs[q]) - offs[q], en = Math.min(m.b, offs[q] + out[q].length) - offs[q];
      if (en <= st) continue;
      const ins = (q === anc || (anc < 0 && !placed && offs[q] <= m.a)) ? m.f.text : '';
      if (ins) placed = true;
      out[q] = out[q].slice(0, st) + ins + out[q].slice(en);
    }
  }
  return out;
}

/* ---------- ký hiệu trường trong file mẫu ---------- */
const MARK_RES = [
  [/\{\{\s*([^{}\n]{1,60}?)\s*\}\}/g, 'cb'], [/«\s*([^«»\n]{1,60}?)\s*»/g, 'gu'],
  [/<<\s*([^<>\n]{1,60}?)\s*>>/g, 'ab'], [/\[\s*([^\[\]\n]{1,60}?)\s*\]/g, 'sq']
];
function okSquare(name) {
  if (!/\p{L}/u.test(name)) return false;
  if (/^[.…\s_\-]+$/.test(name) || /^[ivxlcdm]+$/i.test(name) || /^\d+[a-z]?$/i.test(name)) return false;
  return name.length <= 50;
}
function findMarkers(text) {
  const out = [], seen = new Map();
  for (const [re, t] of MARK_RES) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(text))) {
      const name = nfc(m[1]).replace(/\s+/g, ' ').trim();
      if (!name || (t === 'sq' && !okSquare(name))) continue;
      const token = nfc(m[0]);
      if (out.some(x => x.t !== t && x.token.includes(token))) continue;
      if (seen.has(token)) { seen.get(token).n++; continue; }
      const mk = { token, name, t, n: 1, anchor: Math.max(0, token.indexOf(name)), weak: t === 'sq' && (/[,;:!?]/.test(name) || name.split(' ').length >= 6) };
      seen.set(token, mk); out.push(mk);
    }
  }
  return out;
}
const normName = s => nfc(s).toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu, '');
const stripName = s => normName(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
function matchColumn(headers, name) {
  let j = headers.findIndex(h => normName(h) === normName(name));
  if (j < 0) j = headers.findIndex(h => stripName(h) === stripName(name));
  return j;
}

/* ---------- WORD ---------- */
const SEP_EL = { br: '\n', cr: '\n', tab: '\t' };
function docxGroups(doc) {
  const ts = [...doc.getElementsByTagNameNS(W_NS, '*')].filter(n => n.localName === 't' || (SEP_EL[n.localName] && n.parentNode && n.parentNode.localName === 'r'));
  const map = new Map(), order = [];
  for (const t of ts) {
    let p = t.parentNode;
    while (p && !(p.localName === 'p' && p.namespaceURI === W_NS)) p = p.parentNode;
    if (!p) continue;
    if (!map.has(p)) { map.set(p, []); order.push(p); }
    map.get(p).push(t);
  }
  return order.map(p => map.get(p));
}
const segText = n => n.localName === 't' ? nfc(n.textContent) : (SEP_EL[n.localName] || '');
function replaceGroup(nodes, finds) {
  const segs = nodes.map(segText);
  const out = applyRepl(segs, finds);
  if (!out) return false;
  nodes.forEach((t, i) => {
    if (out[i] !== segs[i] && t.localName === 't') { t.textContent = out[i]; t.setAttributeNS(XML_NS, 'xml:space', 'preserve'); }
  });
  return true;
}
function replaceDocx(doc, finds, part) {
  let ch = false, gi = 0;
  for (const g of docxGroups(doc)) {
    const fs = finds.filter(f => !f.pos || (f.pos.part === part && f.pos.gi === gi)); gi++;
    if (fs.length && replaceGroup(g, fs)) ch = true;
  }
  return ch;
}
const DOCX_PART = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;
function docxPartLabel(p) {
  if (p === 'word/document.xml') return 'Nội dung chính';
  if (/header/.test(p)) return 'Đầu trang'; if (/footer/.test(p)) return 'Chân trang';
  if (/footnotes/.test(p)) return 'Chú thích cuối trang'; return 'Ghi chú cuối';
}
async function initDocx(T) {
  const zip = await JSZip.loadAsync(T.bytes);
  const order = p => p === 'word/document.xml' ? 0 : /header/.test(p) ? 1 : /footer/.test(p) ? 2 : 3;
  const parts = Object.keys(zip.files).filter(n => DOCX_PART.test(n)).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  if (!parts.includes('word/document.xml')) throw new Error('File Word không hợp lệ (thiếu nội dung chính).');
  T.parts = {}; T.paras = [];
  for (const p of parts) {
    const xml = await zip.file(p).async('string');
    T.parts[p] = xml;
    const doc = parseXml(xml);
    let gi = 0; for (const g of docxGroups(doc)) T.paras.push({ part: p, gi: gi++, text: g.map(segText).join('') });
  }
  T.text = T.paras.map(x => cmp(x.text)).join('\n');
}
/* ô chờ trong mẫu Word: dòng chấm / gạch dưới để điền (≥4 ký tự), kèm nhãn đứng trước để người dùng dễ nhận ra */
function docxPlaceholders(T) {
  const out = [], RE = /[.\u2026]{4,}|_{4,}/g;
  T.paras.forEach((P, idx) => {
    if (P.part !== 'word/document.xml') return;
    const t = cmp(P.text); let m; RE.lastIndex = 0;
    while ((m = RE.exec(t))) {
      let label = t.slice(0, m.index).replace(/[.\u2026_:\s]+$/, '').split(/[.\u2026_]{3,}/).pop().trim();
      for (let j = idx - 1; !label && j >= 0 && idx - j <= 3; j--) { const q = cmp(T.paras[j].text).replace(/[.\u2026_]{3,}/g, ' ').trim(); if (q) label = q; }
      out.push({ id: 'p' + P.gi + '_' + m.index, pos: { part: P.part, gi: P.gi, a: m.index }, find: m[0], label: label.slice(0, 50), pi: idx });
    }
  });
  return out;
}
/* Word → PDF ngay trên máy: dựng trang bằng docx-preview rồi chụp từng trang (giống bản in) */
async function docxToPdf(blob, out) {
  out = out || await PDFLib.PDFDocument.create();
  const host = document.createElement('div');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: '1200px', background: '#fff' });
  document.body.appendChild(host);
  try {
    await docx.renderAsync(blob, host, null, { inWrapper: false, ignoreLastRenderedPageBreak: false, breakPages: true, renderHeaders: true, renderFooters: true, experimental: true });
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const secs = [...host.querySelectorAll('section.docx')];
    for (const sec of secs) {
      const c = await html2canvas(sec, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      const jb = await canvasBlob(c, 'image/jpeg', 0.92); const img = await out.embedJpg(new Uint8Array(await jb.arrayBuffer()));
      const w = sec.offsetWidth * 0.75, hh = sec.offsetHeight * 0.75;
      out.addPage([w, hh]).drawImage(img, { x: 0, y: 0, width: w, height: hh });
      c.width = c.height = 0;
    }
  } finally { host.remove(); }
  return pdfClean(out);
}
async function docxZipFor(T, finds) {
  const zip = await JSZip.loadAsync(T.bytes);
  for (const [p, xml] of Object.entries(T.parts)) {
    const doc = parseXml(xml);
    if (replaceDocx(doc, finds, p)) zip.file(p, serXml(doc));
  }
  return zip;
}
function sectTypeStrip(sp) { [...sp.getElementsByTagNameNS(W_NS, 'type')].forEach(n => n.parentNode.removeChild(n)); }
async function docxMerged(T, findsList, prog) {
  const zip = await JSZip.loadAsync(T.bytes);
  for (const [p, xml] of Object.entries(T.parts)) {
    if (p === 'word/document.xml') continue;
    const d = parseXml(xml); if (replaceDocx(d, findsList[0], p)) zip.file(p, serXml(d));
  }
  const master = parseXml(T.parts['word/document.xml']);
  const body = master.getElementsByTagNameNS(W_NS, 'body')[0];
  const kids = [...body.childNodes];
  const lastEl = kids.filter(n => n.nodeType === 1).pop();
  const finalSect = lastEl && lastEl.localName === 'sectPr' ? lastEl : null;
  kids.forEach(n => { if (n !== finalSect) body.removeChild(n); });
  if (finalSect) sectTypeStrip(finalSect);
  /* đầu/chân trang riêng cho từng bản */
  const relsF = zip.file('word/_rels/document.xml.rels');
  const drels = relsF ? parseXml(await relsF.async('string')) : null;
  const ct = parseXml(await zip.file('[Content_Types].xml').async('string'));
  const relTarget = {};
  if (drels) for (const r of drels.getElementsByTagNameNS(PKG_NS, 'Relationship')) relTarget[r.getAttribute('Id')] = r.getAttribute('Target');
  let hfN = 0;
  const ownHF = async (sp, k) => {
    if (!drels || k === 0) return;
    for (const ref of [...sp.childNodes].filter(n => n.nodeType === 1 && (n.localName === 'headerReference' || n.localName === 'footerReference'))) {
      const rid = ref.getAttributeNS(R_NS, 'id'), tg = relTarget[rid]; if (!tg) continue;
      const src = resolveTarget('word/', tg); if (!T.parts[src]) continue;
      const d = parseXml(T.parts[src]); replaceDocx(d, findsList[k], src);
      hfN++;
      const name = `qtt_${ref.localName === 'headerReference' ? 'header' : 'footer'}${hfN}.xml`, dst = 'word/' + name;
      zip.file(dst, serXml(d));
      const sr = zip.file(relsPath(src)); if (sr) zip.file(relsPath(dst), await sr.async('uint8array'));
      const nid = 'rIdQttHf' + hfN;
      const r = drels.createElementNS(PKG_NS, 'Relationship'); r.setAttribute('Id', nid); r.setAttribute('Target', name);
      r.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + (ref.localName === 'headerReference' ? 'header' : 'footer'));
      drels.documentElement.appendChild(r);
      const o = ct.createElementNS(CT_NS, 'Override'); o.setAttribute('PartName', '/' + dst);
      o.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.' + (ref.localName === 'headerReference' ? 'header' : 'footer') + '+xml');
      ct.documentElement.appendChild(o);
      ref.setAttributeNS(R_NS, 'r:id', nid);
    }
  };
  for (let k = 0; k < findsList.length; k++) {
    const d = parseXml(T.parts['word/document.xml']);
    replaceDocx(d, findsList[k], 'word/document.xml');
    if (k > 0) {
      for (const tag of ['bookmarkStart', 'bookmarkEnd']) for (const b of d.getElementsByTagNameNS(W_NS, tag)) {
        const id = b.getAttributeNS(W_NS, 'id'); if (id != null) b.setAttributeNS(W_NS, 'w:id', String(+id + k * 100000));
        const nm = b.getAttributeNS(W_NS, 'name'); if (nm && nm !== '_GoBack') b.setAttributeNS(W_NS, 'w:name', (nm + '_' + (k + 1)).slice(0, 40));
      }
    }
    const b = d.getElementsByTagNameNS(W_NS, 'body')[0];
    const nodes = [...b.childNodes].filter(n => !(n.nodeType === 1 && n.localName === 'sectPr'));
    const imported = nodes.map(n => master.importNode(n, true));
    imported.forEach(n => body.insertBefore(n, finalSect));
    if (k < findsList.length - 1) {
      const sp = finalSect ? finalSect.cloneNode(true) : master.createElementNS(W_NS, 'w:sectPr');
      sectTypeStrip(sp); await ownHF(sp, k);
      const lastP = imported.filter(n => n.nodeType === 1).pop();
      if (lastP && lastP.localName === 'p') {
        let ppr = [...lastP.childNodes].find(n => n.nodeType === 1 && n.localName === 'pPr');
        if (!ppr) { ppr = master.createElementNS(W_NS, 'w:pPr'); lastP.insertBefore(ppr, lastP.firstChild); }
        const chg = [...ppr.childNodes].find(n => n.nodeType === 1 && n.localName === 'pPrChange');
        ppr.insertBefore(sp, chg || null);
      } else {
        const p = master.createElementNS(W_NS, 'w:p'), ppr = master.createElementNS(W_NS, 'w:pPr');
        ppr.appendChild(sp); p.appendChild(ppr); body.insertBefore(p, finalSect);
      }
    }
    else if (finalSect) await ownHF(finalSect, k);
    if (prog) await prog(k + 1);
  }
  if (drels) { zip.file('word/_rels/document.xml.rels', serXml(drels)); zip.file('[Content_Types].xml', serXml(ct)); }
  let id = 1;
  for (const n of master.getElementsByTagName('*')) if (n.localName === 'docPr') n.setAttribute('id', String(id++));
  zip.file('word/document.xml', serXml(master));
  return zip;
}

/* ---------- EXCEL ---------- */
function relsPath(p) { const i = p.lastIndexOf('/'); return p.slice(0, i) + '/_rels/' + p.slice(i + 1) + '.rels'; }
function resolveTarget(base, t) {
  if (t.startsWith('/')) return t.slice(1);
  const parts = (base + t).split('/'), out = [];
  for (const s of parts) { if (s === '..') out.pop(); else if (s !== '.') out.push(s); }
  return out.join('/');
}
const cellsOf = doc => [...doc.getElementsByTagNameNS(S_NS, 'c')];
const childEl = (n, name) => [...n.childNodes].find(x => x.nodeType === 1 && x.localName === name);
function xlsxGroups(doc) {
  const out = [];
  for (const c of cellsOf(doc)) {
    const is = childEl(c, 'is'); if (!is) continue;
    const ts = [...is.getElementsByTagNameNS(S_NS, 't')].filter(t => t.parentNode.localName !== 'rPh');
    if (ts.length) out.push({ c, ts });
  }
  return out;
}
function xlsxNumCells(doc) {
  const out = [];
  for (const c of cellsOf(doc)) {
    const t = c.getAttribute('t');
    if (t && t !== 'n') continue;
    if (childEl(c, 'f')) continue;
    const v = childEl(c, 'v'); if (!v) continue;
    const n = +v.textContent; if (!isFinite(n)) continue;
    out.push({ c, v, n });
  }
  return out;
}
function setCellText(doc, c, text) {
  [...c.childNodes].filter(n => n.nodeType === 1 && (n.localName === 'v' || n.localName === 'is')).forEach(n => c.removeChild(n));
  c.setAttribute('t', 'inlineStr');
  const is = doc.createElementNS(S_NS, 'is'), t = doc.createElementNS(S_NS, 't');
  t.setAttributeNS(XML_NS, 'xml:space', 'preserve'); t.textContent = text;
  is.appendChild(t); c.appendChild(is);
}
async function initXlsx(T) {
  const zip = await JSZip.loadAsync(T.bytes);
  const wbf = zip.file('xl/workbook.xml'); if (!wbf) throw new Error('File Excel không hợp lệ.');
  T.wbXml = await wbf.async('string');
  const wb = parseXml(T.wbXml);
  const rels = parseXml(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const relMap = {};
  for (const r of rels.getElementsByTagNameNS(PKG_NS, 'Relationship')) relMap[r.getAttribute('Id')] = r.getAttribute('Target');
  let sst = [];
  const sf = zip.file('xl/sharedStrings.xml');
  if (sf) sst = [...parseXml(await sf.async('string')).getElementsByTagNameNS(S_NS, 'si')];
  T.sheets = []; T.cells = []; T.numSet = new Set(); T.hasFormula = false;
  for (const s of wb.getElementsByTagNameNS(S_NS, 'sheet')) {
    const rid = s.getAttributeNS(R_NS, 'id');
    const path = resolveTarget('xl/', relMap[rid] || '');
    const f = zip.file(path); if (!f) continue;
    const doc = parseXml(await f.async('string'));
    for (const c of cellsOf(doc)) {
      if (c.getAttribute('t') === 's') {
        const v = childEl(c, 'v'); const si = sst[+(v ? v.textContent : -1)];
        if (v) c.removeChild(v);
        c.setAttribute('t', 'inlineStr');
        const is = doc.createElementNS(S_NS, 'is');
        if (si) for (const ch of [...si.childNodes]) if (ch.nodeType === 1 && (ch.localName === 't' || ch.localName === 'r')) is.appendChild(doc.importNode(ch, true));
        c.appendChild(is);
      }
      if (childEl(c, 'f')) T.hasFormula = true;
    }
    const rf = zip.file(relsPath(path));
    const sh = { name: nfc(s.getAttribute('name')), rid, path, xml: serXml(doc), rels: rf ? await rf.async('string') : null };
    T.sheets.push(sh);
    for (const g of xlsxGroups(doc)) T.cells.push({ sheet: sh.name, ref: g.c.getAttribute('r'), kind: 's', text: nfc(g.ts.map(t => t.textContent).join('')) });
    for (const x of xlsxNumCells(doc)) { T.cells.push({ sheet: sh.name, ref: x.c.getAttribute('r'), kind: 'n', n: x.n }); T.numSet.add(x.n); }
  }
  if (!T.sheets.length) throw new Error('Không đọc được trang tính nào trong file Excel.');
  T.text = T.cells.filter(c => c.kind === 's').map(c => cmp(c.text)).join('\n');
}
function procSheet(xml, finds, nums) {
  const doc = parseXml(xml);
  const numFinds = finds.filter(f => f.num != null);
  for (const g of xlsxGroups(doc)) {
    /* ô chỉ chứa đúng một ký hiệu và giá trị là số/ngày → ghi thành số để Excel giữ định dạng ô và công thức */
    if (numFinds.length) {
      const whole = cmp(nfc(g.ts.map(t => t.textContent).join(''))).trim();
      const f = numFinds.find(x => cmp(x.find) === whole);
      if (f) {
        [...g.c.childNodes].filter(n => n.nodeType === 1 && (n.localName === 'is' || n.localName === 'v')).forEach(n => g.c.removeChild(n));
        g.c.removeAttribute('t');
        const v = doc.createElementNS(S_NS, 'v'); v.textContent = String(f.num); g.c.appendChild(v);
        continue;
      }
    }
    replaceGroup(g.ts, finds);
  }
  if (nums && nums.size) {
    for (const x of xlsxNumCells(doc)) {
      if (!nums.has(x.n)) continue;
      const tg = nums.get(x.n);
      if (tg.num != null) x.v.textContent = String(tg.num);
      else setCellText(doc, x.c, tg.text);
    }
  }
  for (const c of cellsOf(doc)) if (childEl(c, 'f')) { const v = childEl(c, 'v'); if (v) c.removeChild(v); }
  return serXml(doc);
}
function fullCalc(wbXml) {
  const d = parseXml(wbXml);
  let cp = d.getElementsByTagNameNS(S_NS, 'calcPr')[0];
  if (!cp) {
    cp = d.createElementNS(S_NS, 'calcPr');
    const after = ['oleSize', 'customWorkbookViews', 'pivotCaches', 'smartTagPr', 'smartTagTypes', 'webPublishing', 'fileRecoveryPr', 'webPublishObjects', 'extLst'];
    const ref = [...d.documentElement.childNodes].find(n => n.nodeType === 1 && after.includes(n.localName));
    d.documentElement.insertBefore(cp, ref || null);
  }
  cp.setAttribute('fullCalcOnLoad', '1');
  return d;
}
async function xlsxZipFor(T, finds, nums) {
  const zip = await JSZip.loadAsync(T.bytes);
  T.sheets.forEach(s => zip.file(s.path, procSheet(s.xml, finds, nums)));
  if (T.hasFormula) zip.file('xl/workbook.xml', serXml(fullCalc(T.wbXml)));
  return zip;
}
function safeSheetName(n, used) {
  let b = nfc(n).replace(/[\[\]:*?\/\\]/g, '-').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Trang';
  let s = b, i = 2;
  while (used.has(s.toLowerCase())) { const suf = ` (${i++})`; s = b.slice(0, 31 - suf.length) + suf; }
  used.add(s.toLowerCase()); return s;
}
async function xlsxMerged(T, jobs, prog) {
  const zip = await JSZip.loadAsync(T.bytes);
  const ct = parseXml(await zip.file('[Content_Types].xml').async('string'));
  const wb = fullCalc(T.wbXml);
  const rels = parseXml(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const relEls = [...rels.getElementsByTagNameNS(PKG_NS, 'Relationship')];
  const ctRoot = ct.documentElement;
  const rmOverride = part => [...ct.getElementsByTagNameNS(CT_NS, 'Override')].filter(o => o.getAttribute('PartName') === '/' + part).forEach(o => ctRoot.removeChild(o));
  const addOverride = (part, type) => { const o = ct.createElementNS(CT_NS, 'Override'); o.setAttribute('PartName', '/' + part); o.setAttribute('ContentType', type); ctRoot.appendChild(o); };
  for (const s of T.sheets) {
    zip.remove(s.path); zip.remove(relsPath(s.path)); rmOverride(s.path);
    relEls.filter(r => r.getAttribute('Id') === s.rid).forEach(r => rels.documentElement.removeChild(r));
  }
  relEls.filter(r => /calcChain$/.test(r.getAttribute('Type'))).forEach(r => { if (r.parentNode) rels.documentElement.removeChild(r); });
  zip.remove('xl/calcChain.xml'); rmOverride('xl/calcChain.xml');
  const sheetsEl = wb.getElementsByTagNameNS(S_NS, 'sheets')[0];
  while (sheetsEl.firstChild) sheetsEl.removeChild(sheetsEl.firstChild);
  for (const dn of [...wb.getElementsByTagNameNS(S_NS, 'definedName')]) if (dn.hasAttribute('localSheetId')) dn.parentNode.removeChild(dn);
  const dns = wb.getElementsByTagNameNS(S_NS, 'definedNames')[0]; if (dns && !dns.firstElementChild) dns.parentNode.removeChild(dns);
  for (const bv of wb.getElementsByTagNameNS(S_NS, 'workbookView')) { bv.setAttribute('activeTab', '0'); bv.removeAttribute('firstSheet'); }
  const used = new Set(); let n = 0, dcount = 0;
  const existingDrawings = Object.keys(zip.files).filter(f => /^xl\/drawings\/drawing\d+\.xml$/.test(f)).length;
  for (let k = 0; k < jobs.length; k++) {
    const job = jobs[k];
    for (const s of T.sheets) {
      n++;
      const path = `xl/worksheets/qtt_sheet${n}.xml`;
      let xml = procSheet(s.xml, job.finds, job.nums);
      const sd = parseXml(xml);
      for (const tag of ['legacyDrawing', 'legacyDrawingHF', 'tableParts', 'oleObjects', 'controls', 'picture']) [...sd.getElementsByTagNameNS(S_NS, tag)].forEach(x => x.parentNode.removeChild(x));
      for (const ps of sd.getElementsByTagNameNS(S_NS, 'pageSetup')) ps.removeAttributeNS(R_NS, 'id');
      for (const sv of sd.getElementsByTagNameNS(S_NS, 'sheetView')) if (n > 1) sv.removeAttribute('tabSelected');
      const drawEl = sd.getElementsByTagNameNS(S_NS, 'drawing')[0];
      let keepDrawing = false;
      if (s.rels && drawEl) {
        const rd = parseXml(s.rels);
        const drid = drawEl.getAttributeNS(R_NS, 'id');
        const rel = [...rd.getElementsByTagNameNS(PKG_NS, 'Relationship')].find(r => r.getAttribute('Id') === drid);
        if (rel) {
          const src = resolveTarget('xl/worksheets/', rel.getAttribute('Target'));
          const f = zip.file(src);
          if (f) {
            dcount++;
            const dst = `xl/drawings/drawing${existingDrawings + dcount}.xml`;
            zip.file(dst, await f.async('uint8array'));
            const df = zip.file(relsPath(src)); if (df) zip.file(relsPath(dst), await df.async('uint8array'));
            addOverride(dst, 'application/vnd.openxmlformats-officedocument.drawing+xml');
            zip.file(relsPath(path), XML_DECL + `<Relationships xmlns="${PKG_NS}"><Relationship Id="${drid}" Type="${rel.getAttribute('Type')}" Target="../drawings/${dst.split('/').pop()}"/></Relationships>`);
            keepDrawing = true;
          }
        }
      }
      if (drawEl && !keepDrawing) drawEl.parentNode.removeChild(drawEl);
      zip.file(path, serXml(sd));
      const rid = 'rIdQtt' + n;
      const r = rels.createElementNS(PKG_NS, 'Relationship');
      r.setAttribute('Id', rid); r.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'); r.setAttribute('Target', `worksheets/qtt_sheet${n}.xml`);
      rels.documentElement.appendChild(r);
      addOverride(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
      const se = wb.createElementNS(S_NS, 'sheet');
      se.setAttribute('name', safeSheetName(T.sheets.length > 1 ? `${job.name} - ${s.name}` : job.name, used));
      se.setAttribute('sheetId', String(n)); se.setAttributeNS(R_NS, 'r:id', rid);
      sheetsEl.appendChild(se);
    }
    if (prog) await prog(k + 1);
  }
  zip.file('xl/workbook.xml', serXml(wb));
  zip.file('xl/_rels/workbook.xml.rels', serXml(rels));
  zip.file('[Content_Types].xml', serXml(ct));
  zip.remove('docProps/app.xml');
  const rr = zip.file('_rels/.rels');
  if (rr) { const d = parseXml(await rr.async('string')); [...d.getElementsByTagNameNS(PKG_NS, 'Relationship')].filter(r => /app\.xml$/.test(r.getAttribute('Target'))).forEach(r => d.documentElement.removeChild(r)); zip.file('_rels/.rels', serXml(d)); }
  rmOverride('docProps/app.xml');
  return zip;
}

/* ---------- PDF & ẢNH (ô chữ) ---------- */
const VN_OK = cp => (cp >= 0x20 && cp <= 0x7E) || (cp >= 0xA0 && cp <= 0xFF) || [0x102, 0x103, 0x110, 0x111, 0x128, 0x129, 0x168, 0x169, 0x1A0, 0x1A1, 0x1AF, 0x1B0, 0x309, 0x323, 0x20AB, 0x20AC, 0x2116, 0x2030].includes(cp)
  || (cp >= 0x300 && cp <= 0x303) || (cp >= 0x1EA0 && cp <= 0x1EF9) || (cp >= 0x2010 && cp <= 0x2027);
const pdfSafe = s => [...nfc(s).replace(/[\t\r\n]+/g, ' ')].map(ch => VN_OK(ch.codePointAt(0)) ? ch : '?').join('');
function fontKey(b) {
  if (b.font === 'local' && b.localFamily) return `L|${b.localFamily}|${b.bold ? 1 : 0}${b.italic ? 1 : 0}`;
  return (b.font === 'sans' ? 'sans' : 'serif') + (b.bold && b.italic ? 'bi' : b.bold ? 'b' : b.italic ? 'i' : 'r');
}
const CSS_FAM = b => b.font === 'local' && b.localFamily ? `"QTTL ${b.localFamily}", "QTT Serif"` : b.font === 'sans' ? '"QTT Sans"' : '"QTT Serif"';
const pdfFamily = name => (name || '').replace(/^[A-Z]{6}\+/, '').replace(/[-,_](Bold|Italic|Oblique|Regular|Roman|BoldItalic|BoldOblique|Semibold|Medium|Light)?(MT|PSMT)?$/i, '').replace(/(PS)?MT$/, '').replace(/PS$/, '');
function hexRgb(h) { h = (h || '#000000').replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
function toHex(r, g, b) { return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }

/* bố cục chữ trong ô: co chữ nếu dài hơn chỗ trống */
function layoutBox(b, txt, measure, pageW) {
  let size = b.size;
  let w = measure(txt, size);
  const margin = Math.max(pageW * 0.03, 4);
  let avail;
  if (b.align === 'center') { const cx = b.x + b.w / 2; avail = Math.max(b.w, 2 * Math.min(cx - margin, pageW - margin - cx)); }
  else if (b.align === 'right') avail = Math.max(b.w, b.x + b.w - margin);
  else avail = Math.max(b.w, b.maxW != null ? b.maxW : pageW - margin - b.x);
  if (b.fit === 'box') avail = b.w;
  if (b.fit === 'none') avail = Infinity;
  if (w > avail && w > 0) { size = Math.max(b.size * 0.4, size * avail / w); w = measure(txt, size); }
  const x = b.align === 'center' ? b.x + b.w / 2 - w / 2 : b.align === 'right' ? b.x + b.w - w : b.x;
  const base = b.y + (b.baseOff != null ? b.baseOff : (b.h + b.size * 0.7) / 2);
  return { x, base, size, w };
}

/* ---------- chữ cũ trên ẢNH / PDF scan: nhận diện nét mực, xoá sạch mà giữ nền ---------- */
/* tách nét mực trong một vùng (ImageData): trả về các mảng nét, đường chân chữ, cỡ chữ, độ đậm, màu */
function inkAnalyze(img) {
  const { width: w, height: h, data: d } = img, N = w * h;
  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  const srt = Float32Array.from(lum).sort(), dark = srt[N >> 1] < 110; /* nền tối, chữ sáng → đảo chiều */
  const bgL = dark ? srt[Math.floor(N * 0.15)] : srt[Math.floor(N * 0.85)], sg = dark ? -1 : 1;
  let br = 0, bgc = 0, bb = 0, bn = 0;
  for (let i = 0; i < N; i++) if (sg * (lum[i] - bgL) >= -10) { br += d[i * 4]; bgc += d[i * 4 + 1]; bb += d[i * 4 + 2]; bn++; }
  br /= bn || 1; bgc /= bn || 1; bb /= bn || 1;
  const ink = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const cd = Math.hypot(d[i * 4] - br, d[i * 4 + 1] - bgc, d[i * 4 + 2] - bb);
    const dl = sg * (bgL - lum[i]); if (dl > 95 || (cd > 125 && dl > 45)) ink[i] = 1;
  }
  /* gom nét liền nhau (8 hướng) */
  const lab = new Int32Array(N).fill(-1), comps = [], q = new Int32Array(N);
  for (let s0 = 0; s0 < N; s0++) {
    if (!ink[s0] || lab[s0] >= 0) continue;
    const c = { x0: w, y0: h, x1: 0, y1: 0, n: 0, id: comps.length }; let qh = 0, qt = 0; q[qt++] = s0; lab[s0] = c.id;
    while (qh < qt) {
      const i = q[qh++], x = i % w, y = (i / w) | 0; c.n++;
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx; if (ink[j] && lab[j] < 0) { lab[j] = c.id; q[qt++] = j; }
      }
    }
    c.w = c.x1 - c.x0 + 1; c.h = c.y1 - c.y0 + 1; comps.push(c);
  }
  const res = { w, h, ink, lab, comps, bg: [br, bgc, bb], body: [], keep: new Set() };
  if (!comps.length) return res;
  const maxH = Math.max(...comps.map(c => c.h));
  let body = comps.filter(c => c.h >= Math.max(3, maxH * 0.35));
  /* đường kẻ dài, mảnh (gạch chân, viền) → giữ nguyên */
  const pctl = (a, p) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; };
  const bodyH = pctl(body.map(c => c.h), 0.8);
  for (const c of comps) if (c.w > bodyH * 3 && c.h < bodyH * 0.22) res.keep.add(c.id);
  body = body.filter(c => !res.keep.has(c.id));
  /* dòng chấm: nhiều chấm nhỏ cùng một hàng, trải rộng → giữ nguyên */
  const small = comps.filter(c => !res.keep.has(c.id) && c.h <= Math.max(2, bodyH * 0.3) && c.w <= Math.max(3, bodyH * 0.5));
  const rows = [];
  for (const c of small) { const cy = (c.y0 + c.y1) / 2; let r = rows.find(r => Math.abs(r.cy - cy) <= Math.max(1.5, bodyH * 0.12)); if (!r) rows.push(r = { cy, list: [] }); r.list.push(c); }
  /* dòng chấm: các chấm cách đều, sát nhau (khác dấu nặng của chữ Việt vốn cách xa theo từng chữ cái) */
  for (const r of rows) {
    if (r.list.length < 3) continue;
    const xs = r.list.map(c => (c.x0 + c.x1) / 2).sort((a, b) => a - b), gaps = xs.slice(1).map((x, i) => x - xs[i]).sort((a, b) => a - b);
    const g = gaps[gaps.length >> 1];
    if (r.list.length >= 6 || g <= bodyH * 0.55) r.list.forEach(c => res.keep.add(c.id));
  }
  res.body = body;
  if (body.length) {
    const bots = body.map(c => c.y1).sort((a, b) => a - b);
    res.baseline = bots[Math.floor(bots.length / 2)] + 1;
    res.size = bodyH / 0.67;
    /* độ dày nét: độ dài đoạn mực theo hàng ngang trong các chữ */
    const runs = []; const bodyIds = new Set(body.map(c => c.id));
    for (const c of body) for (let y = c.y0; y <= c.y1; y++) { let run = 0; for (let x = c.x0; x <= c.x1 + 1; x++) { const on = x <= c.x1 && bodyIds.has(lab[y * w + x]); if (on) run++; else if (run) { runs.push(run); run = 0; } } }
    res.stroke = runs.length ? pctl(runs, 0.5) : 1;
    res.bold = res.stroke / res.size > 0.11;
    let r = 0, g = 0, b = 0, n = 0; const dark = [];
    for (const c of body) for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) { const i = y * w + x; if (lab[i] === c.id) dark.push(i); }
    dark.sort((a, b2) => sg * (lum[a] - lum[b2])); for (const i of dark.slice(0, Math.max(1, dark.length * 0.3 | 0))) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; n++; }
    res.color = toHex(r / n, g / n, b / n);
    res.x0 = Math.min(...body.map(c => c.x0)); res.x1 = Math.max(...body.map(c => c.x1));
  }
  return res;
}
/* xoá chữ cũ trong vùng ảnh: chỉ những điểm mực của chữ, lấp bằng màu nền xung quanh (giữ hoa văn, dòng chấm) */
function eraseInk(img, an, inner) {
  an = an || inkAnalyze(img);
  const { w, h, lab, keep } = an, d = img.data, N = w * h;
  /* chỉ xoá nét có tâm nằm trong ô; nét bị ô cắt ngang (vd dấu "/" ở mép) giữ nguyên */
  if (inner) for (const c of an.comps) { const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2; if (cx < inner.x0 || cx > inner.x1 || cy < inner.y0 || cy > inner.y1) keep.add(c.id); }
  const mask = new Uint8Array(N); let any = false;
  for (let i = 0; i < N; i++) if (lab[i] >= 0 && !keep.has(lab[i])) { mask[i] = 1; any = true; }
  if (!any) return img;
  const rad = Math.max(1, Math.round((an.stroke || 2) * 0.35)) + 1;
  const m2 = new Uint8Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x])
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && !(lab[ny * w + nx] >= 0 && keep.has(lab[ny * w + nx]))) m2[ny * w + nx] = 1;
    }
  /* lấp dần từ mép vào (onion-peel) */
  let left = 0; for (let i = 0; i < N; i++) left += m2[i];
  let guard = 0;
  while (left && guard++ < 400) {
    const fill = [];
    for (let i = 0; i < N; i++) {
      if (!m2[i]) continue;
      const x = i % w, y = (i / w) | 0; let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx; if (m2[j]) continue; r += d[j * 4]; g += d[j * 4 + 1]; b += d[j * 4 + 2]; n++;
      }
      if (n >= 2 || (n && guard > 50)) fill.push([i, r / n, g / n, b / n]);
    }
    if (!fill.length) { for (let i = 0; i < N; i++) if (m2[i]) { d[i * 4] = an.bg[0]; d[i * 4 + 1] = an.bg[1]; d[i * 4 + 2] = an.bg[2]; } break; }
    for (const [i, r, g, b] of fill) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; m2[i] = 0; left--; }
  }
  return img;
}
/* vùng ô (đơn vị trang) → hình chữ nhật điểm ảnh trên canvas */
function boxPx(b, scale, cw, ch, pad = 0) {
  const x = Math.max(0, Math.floor(b.x * scale) - pad), y = Math.max(0, Math.floor(b.y * scale) - pad);
  return { x, y, w: Math.max(1, Math.min(cw - x, Math.ceil(b.w * scale) + 2 * pad)), h: Math.max(1, Math.min(ch - y, Math.ceil(b.h * scale) + 2 * pad)) };
}
/* nhận kiểu chữ cũ (cỡ, đậm, màu, chân chữ) trong ô vừa kéo trên ảnh/PDF scan */
function inkStyle(canvas, scale, b) {
  const r = boxPx(b, scale, canvas.width, canvas.height);
  if (r.w < 4 || r.h < 4) return null;
  const an = inkAnalyze(canvas.getContext('2d', { willReadFrequently: true }).getImageData(r.x, r.y, r.w, r.h));
  if (!an.body.length || an.size / scale > b.h * 1.4) return null; /* chữ to hơn khung → khung chưa bao trọn chữ, không đoán */
  return { size: an.size / scale, bold: an.bold, color: an.color, baseline: (r.y + an.baseline) / scale, x0: (r.x + an.x0) / scale, x1: (r.x + an.x1) / scale };
}
/* khoảng trống bên phải ô trên cùng dòng (bỏ qua dòng chấm) – để chữ mới dài hơn không đè lên chữ in sẵn phía sau */
function freeRightOf(canvas, scale, b, ik) {
  const x0 = Math.ceil((b.x + b.w) * scale), y0 = Math.max(0, Math.floor((ik.baseline - ik.size * 0.75) * scale));
  const w = canvas.width - x0, h = Math.min(canvas.height - y0, Math.ceil(ik.size * 0.75 * scale));
  if (w < 4 || h < 4) return null;
  const an = inkAnalyze(canvas.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, w, h));
  const big = an.comps.filter(c => !an.keep.has(c.id) && c.h >= h * 0.45);
  if (!big.length) return null;
  return (x0 + Math.min(...big.map(c => c.x0))) / scale;
}
/* ảnh vá đã xoá chữ cho một ô (dùng cho PDF scan và xem trước) */
const PATCH = new Map();
function erasedPatch(P, b) {
  const pad = Math.max(3, Math.round((b.size || 10) * 0.5 * P.scale));
  const r = boxPx(b, P.scale, P.canvas.width, P.canvas.height, pad), ib = boxPx(b, P.scale, P.canvas.width, P.canvas.height, 0);
  const key = [P.canvas.width, ib.x, ib.y, ib.w, ib.h, pad].join('|');
  if (PATCH.has(key)) return PATCH.get(key);
  const img = P.canvas.getContext('2d', { willReadFrequently: true }).getImageData(r.x, r.y, r.w, r.h);
  eraseInk(img, null, { x0: ib.x - r.x, x1: ib.x - r.x + ib.w, y0: ib.y - r.y, y1: ib.y - r.y + ib.h });
  const c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').putImageData(img, 0, 0);
  const res = { canvas: c, r, x: r.x / P.scale, y: r.y / P.scale, w: r.w / P.scale, h: r.h / P.scale };
  if (PATCH.size > 300) PATCH.clear();
  PATCH.set(key, res); return res;
}
const smartErase = (T, b) => b.cover && !b.flat && (T.kind === 'image' || !T.hasText);

/* lấy màu nền & màu chữ trong vùng ô */
function sampleColors(canvas, scale, b) {
  const x = Math.max(0, Math.floor(b.x * scale)), y = Math.max(0, Math.floor(b.y * scale));
  const w = Math.min(canvas.width - x, Math.ceil(b.w * scale)), h = Math.min(canvas.height - y, Math.ceil(b.h * scale));
  if (w < 2 || h < 2) return null;
  const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, w, h).data;
  const px = (i, j) => { const o = (j * w + i) * 4; return [data[o], data[o + 1], data[o + 2]]; };
  const buckets = new Map();
  const push = p => { const k = (p[0] >> 4) + '_' + (p[1] >> 4) + '_' + (p[2] >> 4); const e = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 }; e.n++; e.r += p[0]; e.g += p[1]; e.b += p[2]; buckets.set(k, e); };
  for (let i = 0; i < w; i++) { push(px(i, 0)); push(px(i, h - 1)); if (h > 4) { push(px(i, 1)); push(px(i, h - 2)); } }
  for (let j = 0; j < h; j++) { push(px(0, j)); push(px(w - 1, j)); }
  let best = null; for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
  const bg = [best.r / best.n, best.g / best.n, best.b / best.n];
  let maxD = 0; const ds = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const p = px(i, j); const d = Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]); ds.push([d, p]); if (d > maxD) maxD = d; }
  let fg = null;
  if (maxD > 60) { let n = 0, r = 0, g = 0, bb = 0; for (const [d, p] of ds) if (d >= maxD * 0.8) { n++; r += p[0]; g += p[1]; bb += p[2]; } fg = toHex(r / n, g / n, bb / n); }
  return { bg: toHex(...bg), fg };
}

async function renderPdfPages(pdf, maxPages) {
  const pages = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 2600 / Math.max(vp.width, vp.height));
    const vps = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(vps.width); canvas.height = Math.ceil(vps.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vps }).promise;
    pages.push({ page, vp, w: vp.width, h: vp.height, scale, canvas });
  }
  return pages;
}
async function initPdf(T) {
  let pdf;
  try { pdf = await pdfjsLib.getDocument({ data: T.bytes.slice(), isEvalSupported: false, fontExtraProperties: true }).promise; }
  catch (e) { throw new Error(/password/i.test(e.message || '') ? 'File PDF đang đặt mật khẩu. Hãy gỡ mật khẩu rồi tải lại.' : 'Không mở được file PDF.'); }
  T.pdf = pdf; T.numPages = pdf.numPages;
  T.pages = await renderPdfPages(pdf, 40);
  for (const P of T.pages) {
    const tc = await P.page.getTextContent();
    const fonts = {};
    for (const it of tc.items) {
      if (!('str' in it) || fonts[it.fontName]) continue;
      let name = '', fo = null;
      try { fo = P.page.commonObjs.get(it.fontName); name = (fo && (fo.name || fo.loadedName)) || ''; } catch (e) { }
      const fam = (tc.styles[it.fontName] || {}).fontFamily || '';
      fonts[it.fontName] = {
        family: pdfFamily(name),
        bold: /bold|black|heavy|semibold|demi/i.test(name) || !!(fo && (fo.bold || fo.black)), italic: /italic|oblique/i.test(name) || !!(fo && fo.italic), hint: fam,
        sans: /sans|arial|helvetica|verdana|tahoma|segoe|calibri|roboto|lexend|inter|gothic/i.test(name) ? true : /times|serif|roman|georgia|cambria|garamond|book/i.test(name) ? false : fam !== 'serif',
        samples: []
      };
    }
    for (const it of tc.items) { const f = fonts[it.fontName]; if (f && 'str' in it && it.width > 0 && it.str.trim().length >= 3 && f.samples.length < 60) f.samples.push(it); }
    for (const k in fonts) { const f = fonts[k]; Object.assign(f, fontMatch(f)); delete f.samples; if (f.match || f.guess) f.sans = (f.match || f.guess) === 'sans'; }
    let s = '', map = [], prev = null;
    const items = tc.items.filter(it => 'str' in it);
    items.forEach((it, k) => {
      const str = nfc(it.str);
      const sz = Math.hypot(it.transform[2], it.transform[3]) || 10;
      if (!str) { if (it.hasEOL && s && !s.endsWith('\n')) { s += '\n'; map.push(null); prev = null; } return; }
      if (prev) {
        const psz = Math.hypot(prev.transform[2], prev.transform[3]) || 10;
        const same = Math.abs(it.transform[5] - prev.transform[5]) < 0.5 * psz;
        const gap = it.transform[4] - (prev.transform[4] + prev.width);
        if (!same || gap < -psz) { if (!s.endsWith('\n')) { s += '\n'; map.push(null); } }
        else if (gap > 0.18 * sz && !s.endsWith(' ') && !str.startsWith(' ')) { s += ' '; map.push(null); }
      }
      for (let ci = 0; ci < str.length; ci++) { s += str[ci]; map.push({ k, ci }); }
      prev = it;
      if (it.hasEOL) { s += '\n'; map.push(null); prev = null; }
    });
    Object.assign(P, { items, str: s, map, fonts });
  }
  T.hasText = T.pages.some(P => P.str.replace(/\s/g, '').length > 3);
  T.text = T.pages.map(P => cmp(P.str)).join('\n');
}
async function initImage(T, file) {
  let bmp;
  try { bmp = await createImageBitmap(file); } catch (e) { throw new Error('Không đọc được ảnh.'); }
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width; canvas.height = bmp.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  T.pages = [{ w: bmp.width, h: bmp.height, scale: 1, canvas }];
  T.numPages = 1; T.hasText = false; T.text = '';
}
/* đo vị trí ký tự trong một đoạn chữ PDF theo độ rộng phông thật */
let MCTX = null;
function measureIn(str, f) {
  if (!MCTX) MCTX = document.createElement('canvas').getContext('2d');
  MCTX.font = `${f.italic ? 'italic ' : ''}${f.bold ? '700' : '400'} 100px ${f.sans ? '"QTT Sans"' : '"QTT Serif"'}`;
  return MCTX.measureText(str).width;
}
function charX(it, ci, f) {
  const s = nfc(it.str), tot = measureIn(s, f || {});
  if (!tot) return it.transform[4] + it.width * ci / Math.max(1, s.length);
  return it.transform[4] + it.width * measureIn(s.slice(0, ci), f || {}) / tot;
}
/* bắt khung theo chữ cũ trong vùng người dùng kéo (hoặc bấm) */
const DOTCH = /[.\u2026_·\s]/;
function charCenterVp(P, m) {
  const it = P.items[m.k], f = P.fonts[it.fontName] || {};
  const sz = Math.hypot(it.transform[2], it.transform[3]) || 10;
  const x = (charX(it, m.ci, f) + charX(it, m.ci + 1, f)) / 2;
  const [vx, vy] = P.vp.convertToViewportPoint(x, it.transform[5] + 0.35 * sz);
  return { x: vx, y: vy, base: it.transform[5], sz };
}
/* tách một trang PDF thành các "cụm chữ": ranh giới là dấu ":", dòng chấm (≥2 dấu chấm, …, _), khoảng trống đôi, xuống dòng.
   Dấu chấm đơn giữa chữ (Ms. Th.s) vẫn thuộc cụm. */
function fieldSegments(P) {
  if (P._segs) return P._segs;
  const str = P.str, n = str.length, segs = [];
  const kind = i => {
    if (i < 0 || i >= n || str[i] === '\n') return 'end';
    if (str[i] === ':') return 'colon';
    if (str[i] === '\u2026' || str[i] === '_' || (str[i] === '.' && (str[i - 1] === '.' || str[i + 1] === '.'))) return 'dots';
    if (str[i] === ' ' && (str[i - 1] === ' ' || str[i + 1] === ' ')) return 'gap';
    return null;
  };
  const boldAt = i => { const m = P.map[i]; return m ? !!(P.fonts[P.items[m.k].fontName] || {}).bold : null; };
  const fb = new Set(); /* chỗ đổi kiểu chữ (thường ↔ đậm) cũng là ranh giới cụm */
  let i = 0;
  while (i < n) {
    if (kind(i) || str[i] === ' ' || !P.map[i]) { i++; continue; }
    let a = i; const ba = boldAt(a);
    while (i < n && !kind(i)) { const bi = boldAt(i); if (i > a && bi != null && bi !== ba && /\S/.test(str[i])) { fb.add(i); break; } i++; }
    if (i > a && str[i - 1] === ' ' && fb.has(i)) { /* khoảng trắng trước chữ đậm thuộc về cụm trước */ }
    let b = i; while (b > a && /[\s.]/.test(str[b - 1]) && !(str[b - 1] === '.' && /\p{L}/u.test(str[b - 2] || '') && /\p{Lu}/u.test(str[b - 3] || '') && b - a <= 4)) b--;
    if (b <= a) continue;
    const look = (j, dir) => { const j0 = j; while (j >= 0 && j < n && str[j] === ' ') j += dir; if (dir > 0 ? fb.has(j) : fb.has(a)) return 'font'; return kind(j) || 'word'; };
    segs.push({ a, b, prev: look(a - 1, -1), next: look(b, 1), text: str.slice(a, b) });
  }
  return (P._segs = segs);
}
/* ô chờ: các cụm chữ trông như giá trị điền (đứng sau nhãn "...:" / dòng chấm, khác kiểu chữ với nhãn) – chỉ đánh dấu, không tự ghép */
const LABEL_WORDS = /^(ngày|tháng|năm|từ ngày|đến ngày|days?|from|to|at|tại|cấp|has conferred|on)$/i;
function fieldCandidates(T) {
  const out = [];
  T.pages.forEach((P, pi) => {
    if (!P.map) return;
    const segs = fieldSegments(P);
    const fontOf = sg => { const m = P.map[sg.a]; return m ? (P.fonts[P.items[m.k].fontName] || {}) : {}; };
    /* kiểu chữ của nhãn (cụm đứng trước dấu ":") */
    const labels = segs.filter(sg => sg.next === 'colon');
    const lb = labels.map(sg => !!fontOf(sg).bold), labelBold = lb.length ? lb.filter(Boolean).length > lb.length / 2 : false;
    const vary = segs.some(sg => !!fontOf(sg).bold !== labelBold);
    for (const sg of segs) {
      const t = sg.text.trim();
      if (!t || t.length > 60 || sg.next === 'colon' || LABEL_WORDS.test(t)) continue;
      const near = sg.prev === 'dots' || sg.prev === 'colon' || sg.next === 'dots';
      const styled = vary && !!fontOf(sg).bold !== labelBold;
      if (!(near && (!vary || styled)) && !(styled && (sg.prev === 'font' || sg.next === 'font'))) continue;
      const bx = boxFromMatch(T, pi, sg.a, sg.b); if (!bx) continue;
      out.push({ id: 'c' + pi + '_' + sg.a, page: pi, a: sg.a, b: sg.b, text: t, x: bx.x, y: bx.y, w: bx.w, h: bx.h });
    }
  });
  return out;
}
function snapRegion(T, pi, r, click) {
  const P = T.pages[pi]; if (!P || !P.map) return null;
  const hits = [];
  const px = r.x + r.w / 2, py = r.y + r.h / 2;
  for (let i = 0; i < P.str.length; i++) {
    const m = P.map[i]; if (!m) continue;
    const c = charCenterVp(P, m);
    const inside = click ? (Math.abs(c.x - px) < 0.8 * c.sz && Math.abs(c.y - py) < 0.6 * c.sz) : (c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y && c.y <= r.y + r.h);
    if (inside) hits.push({ i, c });
  }
  if (!hits.length) return null;
  /* chọn dòng gần tâm vùng nhất */
  const cy = r.y + r.h / 2, cx = r.x + r.w / 2;
  const isDot = i => DOTCH.test(P.str[i]);
  const words = hits.filter(x => !isDot(x.i));
  const pool = words.length ? words : hits;
  pool.sort((p, q) => Math.abs(p.c.y - cy) - Math.abs(q.c.y - cy) || Math.abs(p.c.x - cx) - Math.abs(q.c.x - cx));
  const base = pool[0].c.base, sz0 = pool[0].c.sz;
  const line = hits.filter(x => Math.abs(x.c.base - base) < 0.12 * sz0).map(x => x.i);
  let a = Math.min(...line), b = Math.max(...line) + 1;
  if (!click && words.length) {
    /* kéo: lấy trọn các cụm chữ mà vùng kéo chạm vào (không cắt giữa chữ) */
    const ws = new Set(line.filter(i => !isDot(i)));
    let touched = fieldSegments(P).filter(sg => { for (let i = sg.a; i < sg.b; i++) if (ws.has(i)) return true; return false; });
    if (touched.some(sg => sg.next !== 'colon')) touched = touched.filter(sg => sg.next !== 'colon'); /* bỏ nhãn "Cho:" nếu đã có phần giá trị */
    if (touched.length) { a = Math.min(...touched.map(sg => sg.a)); b = Math.max(...touched.map(sg => sg.b)); }
  }
  if (click) {
    const sg = words.length && fieldSegments(P).find(sg => pool[0].i >= sg.a && pool[0].i < sg.b);
    if (sg) { const bx = boxFromMatch(T, pi, sg.a, sg.b); if (bx) { bx.orig = P.str.slice(sg.a, sg.b).trim(); bx.cover = true; return bx; } }
    /* bấm 1 lần: mở rộng ra cả cụm chữ, dừng ở dấu ":", dòng chấm hoặc khoảng trống lớn */
    if (!words.length) return null;
    a = pool[0].i; b = a + 1;
    const stop = i => i < 0 || i >= P.str.length || P.str[i] === '\n' || P.str[i] === ':' || /[.\u2026_]/.test(P.str[i]) || (P.str[i] === ' ' && (P.str[i - 1] === ' ' || P.str[i + 1] === ' '));
    while (!stop(a - 1)) a--;
    while (!stop(b)) b++;
  }
  let a2 = a, b2 = b;
  while (a2 < b2 && DOTCH.test(P.str[a2])) a2++;
  while (b2 > a2 && DOTCH.test(P.str[b2 - 1])) b2--;
  if (a2 < b2) {
    const bx = boxFromMatch(T, pi, a2, b2); if (!bx) return null;
    bx.orig = P.str.slice(a2, b2).trim(); bx.cover = true;
    return bx;
  }
  /* chỉ có dòng chấm: giữ dòng chấm, viết chữ lên trên */
  const m0 = P.map[a] || P.map[line[0]]; const it = P.items[m0.k], f = P.fonts[it.fontName] || {};
  let sz = Math.hypot(it.transform[2], it.transform[3]) || 10;
  /* cỡ chữ lấy theo chữ nhãn đứng trước trên cùng dòng (nếu có) */
  for (let i = a - 1; i >= 0 && P.str[i] !== '\n'; i--) { const mm = P.map[i]; if (mm && !DOTCH.test(P.str[i])) { const li = P.items[mm.k]; sz = Math.hypot(li.transform[2], li.transform[3]) || sz; break; } }
  const [, vy] = P.vp.convertToViewportPoint(it.transform[4], it.transform[5]);
  const bl = vy - 0.12 * sz;
  const box = { page: pi, x: r.x, y: bl - 0.92 * sz, w: Math.max(r.w, sz * 2), h: 1.17 * sz, size: Math.round(sz * 10) / 10, ...boxFont(f), bold: false, italic: false, srcFont: f.family || '', align: 'left', cover: false, color: '#1a1a1a', bg: '#ffffff', orig: '' };
  const sc = sampleColors(P.canvas, P.scale, { x: r.x, y: vy - sz, w: Math.max(r.w, sz), h: sz * 1.2 }); if (sc && sc.fg) box.color = sc.fg;
  return box;
}
/* tìm phông nhúng sẵn gần giống phông gốc nhất:
   1) tên phông thuộc nhóm đã biết (Times, Arial…) → dùng luôn
   2) tên lạ (CIDFont+F1, phông trang trí…) → so độ rộng chữ thật trong PDF với 2 phông nhúng sẵn, lệch ≤ 6% mới coi là gần giống */
const SERIF_RE = /times|tinos|liberationserif|georgia|cambria|garamond|bookantiqua|palatino|minion|baskerville|bodoni|century|constantia|notoserif|dejavuserif|ptserif|sourceserif|vntime|vni-?times|^serif/i;
const SANS_RE = /arial|arimo|helvetica|liberationsans|calibri|verdana|tahoma|segoe|roboto|opensans|notosans|dejavusans|lato|montserrat|inter\b|nunito|sourcesans|bevietnam|candara|corbel|trebuchet|vnarial|vni-?helve|^sans/i;
function fontMatch(f) {
  const nm = (f.family || '').replace(/\s+/g, '');
  const odd = /mono|courier|consol|script|hand|brush|vibes|dancing|pacifico|lobster|comic/i.test(nm); /* phông đặc biệt: không coi là gần giống */
  if (!odd && SERIF_RE.test(nm)) return { match: 'serif', how: 'name' };
  if (!odd && SANS_RE.test(nm)) return { match: 'sans', how: 'name' };
  const smp = f.samples || []; if (smp.length < 2) return { match: null };
  const ctx = document.createElement('canvas').getContext('2d'), it0 = f.italic ? 'italic ' : '';
  const score = (fam, w) => {
    const r = smp.map(it => { const sz = Math.hypot(it.transform[2], it.transform[3]) || 10; ctx.font = `${it0}${w} ${sz}px ${fam}`; return ctx.measureText(nfc(it.str)).width / it.width; }).filter(x => isFinite(x) && x > 0).sort((a, b) => a - b);
    return r.length ? r.reduce((a, x) => a + Math.abs(x - 1), 0) / r.length : 9; /* lệch trung bình – phông đúng thì mọi dòng đều khớp */
  };
  /* thử 4 kiểu (có chân/không chân × thường/đậm) – tên phông bị ẩn nên cờ đậm cũng có thể mất */
  const cands = [];
  for (const [k, fam] of [['serif', '"QTT Serif"'], ['sans', '"QTT Sans"']]) for (const b of f.bold ? [true] : [false, true]) {
    cands.push({ k, b, d: score(fam, b ? 700 : 400), pen: b && !f.bold ? 0.005 : 0 });
  }
  cands.sort((x, y) => (x.d + x.pen) - (y.d + y.pen));
  const c = cands[0];
  if (c.b) f.bold = true;
  return c.d <= 0.06 ? { match: c.k, how: 'width', dist: c.d } : { match: null, guess: c.k, dist: c.d };
}
const srcFontLabel = s => { s = (s || '').replace(/([a-z])([A-Z])/g, '$1 $2'); return /^(CIDFont|F\d|T\d|TT\d)|^[A-Z]{1,2}\d+$/i.test(s.replace(/\s/g, '')) ? `phông nhúng không tên (${s})` : s; };
const boxFont = f => ({ font: f.match || f.guess || (f.sans ? 'sans' : 'serif'), fontWarn: !f.match });
/* ô chữ từ một đoạn khớp trong PDF */
function boxFromMatch(T, pi, a, b, anchor) {
  const P = T.pages[pi];
  let m0 = null, m1 = null;
  for (let i = a; i < b; i++) if (P.map[i]) { m0 = P.map[i]; break; }
  for (let i = b - 1; i >= a; i--) if (P.map[i]) { m1 = P.map[i]; break; }
  if (!m0 || !m1) return null;
  const i0 = P.items[m0.k], i1 = P.items[m1.k];
  const sz = Math.hypot(i0.transform[2], i0.transform[3]) || 10;
  const x0 = charX(i0, m0.ci, P.fonts[i0.fontName]);
  const x1 = charX(i1, m1.ci + 1, P.fonts[i1.fontName]);
  const [vx0, vy] = P.vp.convertToViewportPoint(x0, i0.transform[5]);
  const [vx1] = P.vp.convertToViewportPoint(x1, i0.transform[5]);
  let fi = i0; if (anchor) { const ma = P.map[a + anchor]; if (ma) fi = P.items[ma.k]; }
  const f = P.fonts[fi.fontName] || {};
  const left = Math.min(vx0, vx1), w = Math.abs(vx1 - vx0);
  const cx = left + w / 2;
  const box = {
    page: pi, x: left - 0.08 * sz, y: vy - 0.92 * sz, w: w + 0.16 * sz, h: 1.17 * sz, size: Math.round(sz * 10) / 10,
    ...boxFont(f), bold: !!f.bold, italic: !!f.italic, srcFont: f.family || '',
    align: Math.abs(cx - P.w / 2) < P.w * 0.04 ? 'center' : 'left', cover: true, color: '#000000', bg: '#ffffff'
  };
  const sc = sampleColors(P.canvas, P.scale, box);
  if (sc) { box.bg = sc.bg; if (sc.fg) box.color = sc.fg; }
  /* căn phải: ô nằm cuối dòng, cả dòng ở nửa phải trang */
  let eol = true;
  for (let i = b; i < P.str.length && P.str[i] !== '\n'; i++) if (P.str[i] !== ' ' && P.map[i]) { eol = false; break; }
  if (box.align === 'left' && eol) {
    let s0 = a; while (s0 > 0 && P.str[s0 - 1] !== '\n') s0--;
    let lx = null; for (let i = s0; i < a + 1; i++) if (P.map[i]) { const it = P.items[P.map[i].k]; lx = P.vp.convertToViewportPoint(charX(it, P.map[i].ci, P.fonts[it.fontName]), it.transform[5])[0]; break; }
    if (lx != null && lx > P.w * 0.45 && left + w > P.w * 0.7) box.align = 'right';
  }
  /* chỗ trống tới chữ kế tiếp trên cùng dòng */
  for (let i = b; i < P.str.length; i++) {
    const ch = P.str[i]; if (ch === '\n') break;
    if (ch === ' ' || !P.map[i]) continue;
    const it = P.items[P.map[i].k];
    if (Math.abs(it.transform[5] - i0.transform[5]) > 0.3 * sz) break;
    const nx = charX(it, P.map[i].ci, P.fonts[it.fontName]);
    const [vnx] = P.vp.convertToViewportPoint(nx, it.transform[5]);
    if (vnx > left + w) box.maxW = vnx - left - 0.18 * sz;
    break;
  }
  return box;
}
async function pdfDocFor(T, boxes, fontBytes) {
  /* đo độ rộng giá trị mới (cỡ chữ gốc) để dàn lại dòng khi có thể */
  const mctx = document.createElement('canvas').getContext('2d'), widths = new Map();
  for (const bx of boxes) {
    const t = pdfSafe(bx.text || '');
    mctx.font = `${bx.italic ? 'italic ' : ''}${bx.bold ? '700 ' : '400 '}${bx.size}px ${CSS_FAM(bx)}`;
    widths.set(bx.id, t.trim() ? mctx.measureText(t).width : 0);
  }
  const red = await pdfRedacted(T, boxes, widths);
  const doc = await PDFLib.PDFDocument.load(red.bytes, { ignoreEncryption: true });
  doc.registerFontkit(fontkit);
  const pages = doc.getPages(), fonts = {};
  for (const bx0 of boxes) {
    let bx = red.reflow.has(bx0.id) ? { ...bx0, fit: 'none' } : bx0;
    if (bx.align === 'left' && red.starts && red.starts.has(bx0.id)) {
      const P0 = T.pages[bx.page]; const [vx] = P0.vp.convertToViewportPoint(red.starts.get(bx0.id), 0);
      if (Math.abs(vx - bx.x) < bx.size * 1.5) bx = { ...bx, w: bx.w + (bx.x - vx), x: vx };
    }
    const off = red.offs && red.offs.get(bx0.id);
    if (off) bx = { ...bx, x: bx.x + off, maxW: bx.maxW != null ? bx.maxW : bx.maxW };
    const P = T.pages[bx.page], pg = pages[bx.page]; if (!P || !pg) continue;
    const key = fontKey(bx);
    if (!fonts[key]) fonts[key] = await doc.embedFont(fontBytes(key), { subset: true });
    const font = fonts[key];
    if (smartErase(T, bx)) {
      const pt = erasedPatch(P, bx); const jb = await canvasBlob(pt.canvas, 'image/png');
      const im = await doc.embedPng(new Uint8Array(await jb.arrayBuffer()));
      const [x1, y1] = P.vp.convertToPdfPoint(pt.x, pt.y + pt.h), [x2, y2] = P.vp.convertToPdfPoint(pt.x + pt.w, pt.y);
      pg.drawImage(im, { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) });
    } else if (bx.cover && (!T.hasText || !red.ok || bx.forceRect)) {
      const [x1, y1] = P.vp.convertToPdfPoint(bx.x, bx.y + bx.h), [x2, y2] = P.vp.convertToPdfPoint(bx.x + bx.w, bx.y);
      pg.drawRectangle({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1), color: PDFLib.rgb(...hexRgb(bx.bg)) });
    }
    const txt = pdfSafe(bx.text);
    if (txt.trim()) {
      const lay = layoutBox(bx, txt, (t, s) => font.widthOfTextAtSize(t, s), P.w);
      const [px, py] = P.vp.convertToPdfPoint(lay.x, lay.base);
      pg.drawText(txt, { x: px, y: py, size: lay.size, font, color: PDFLib.rgb(...hexRgb(bx.color)) });
    }
  }
  return pdfClean(doc);
}
function drawBoxesOnCanvas(ctx, boxes, pageW, T, P) {
  for (const bx of boxes) {
    if (bx.cover && P && smartErase(T, bx)) { const pt = erasedPatch(P, bx); ctx.drawImage(pt.canvas, pt.x, pt.y, pt.w, pt.h); }
    else if (bx.cover) { ctx.fillStyle = bx.bg; ctx.fillRect(bx.x, bx.y, bx.w, bx.h); }
    const txt = nfc(bx.text).replace(/[\t\r\n]+/g, ' ');
    if (!txt.trim()) continue;
    const fontStr = s => `${bx.italic ? 'italic ' : ''}${bx.bold ? '700 ' : '400 '}${s}px ${CSS_FAM(bx)}`;
    const lay = layoutBox(bx, txt, (t, s) => { ctx.font = fontStr(s); return ctx.measureText(t).width; }, pageW);
    ctx.font = fontStr(lay.size); ctx.fillStyle = bx.color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillText(txt, lay.x, lay.base);
  }
}
function imageCanvasFor(T, boxes) {
  const P = T.pages[0];
  const c = document.createElement('canvas'); c.width = P.w; c.height = P.h;
  const ctx = c.getContext('2d'); ctx.drawImage(P.canvas, 0, 0);
  drawBoxesOnCanvas(ctx, boxes, P.w, T, P);
  return c;
}
const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));
/* làm sạch PDF đầu ra: bỏ mọi thành phần chủ động (JavaScript, tự chạy, file đính kèm, XFA, mã hoá còn sót)
   – những thứ khiến phần mềm diệt virus nghi ngờ file */
function pdfClean(doc) {
  const { PDFName, PDFDict, PDFArray } = PDFLib, N = k => PDFName.of(k);
  const bad = a => { try { const d = a instanceof PDFDict ? a : doc.context.lookup(a); const st = d && d.get(N('S')); return st && /JavaScript|Launch|ImportData|SubmitForm|GoToE|Rendition/.test(st.toString()); } catch (e) { return false; } };
  try {
    const cat = doc.catalog;
    ['OpenAction', 'AA', 'URI'].forEach(k => cat.delete(N(k)));
    const names = cat.lookup(N('Names')); if (names instanceof PDFDict) ['JavaScript', 'EmbeddedFiles'].forEach(k => names.delete(N(k)));
    const af = cat.lookup(N('AcroForm')); if (af instanceof PDFDict) af.delete(N('XFA'));
    for (const pg of doc.getPages()) {
      pg.node.delete(N('AA'));
      const an = pg.node.lookup(N('Annots'));
      if (an instanceof PDFArray) for (let i = 0; i < an.size(); i++) {
        const d = an.lookup(i); if (!(d instanceof PDFDict)) continue;
        d.delete(N('AA')); const a = d.get(N('A')); if (a && bad(a)) d.delete(N('A'));
        const st = d.get(N('Subtype')); if (st && /FileAttachment|Movie|Sound|Screen|RichMedia/.test(st.toString())) d.delete(N('FS'));
      }
    }
    if (doc.context.trailerInfo) { doc.context.trailerInfo.Encrypt = undefined; }
    doc.setProducer('Quan tri tu te - Tao van ban hang loat'); doc.setCreator('Quan tri tu te'); doc.setModificationDate(new Date());
  } catch (e) { console.warn('pdfClean', e); }
  return doc;
}
/* chuyển PDF thành PDF dạng ảnh (mỗi trang là một ảnh JPEG) – giống hệt bản in, không còn chữ/phông nhúng */
async function pdfAsImages(bytes, scale = 2.5) {
  const src = await pdfjsLib.getDocument({ data: bytes, isEvalSupported: false }).promise;
  const out = await PDFLib.PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    const pg = await src.getPage(i), v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    const jb = await canvasBlob(c, 'image/jpeg', 0.9); const img = await out.embedJpg(new Uint8Array(await jb.arrayBuffer()));
    out.addPage([v1.width, v1.height]).drawImage(img, { x: 0, y: 0, width: v1.width, height: v1.height }); c.width = c.height = 0;
  }
  await src.destroy(); return pdfClean(out);
}

/* ---------- PDF: xoá hẳn chữ gốc nằm dưới khung phủ ----------
   Đối chiếu danh sách lệnh vẽ chữ của pdf.js (có độ rộng từng ký tự) với
   luồng nội dung gốc của trang, rồi thay các ký tự nằm trong khung bằng
   khoảng dịch tương đương (TJ số) để chữ còn lại giữ nguyên vị trí. */
const PDFTok = (() => {
  const WS = new Set([0, 9, 10, 12, 13, 32]), DL = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);
  function tokenize(b) {
    let i = 0; const n = b.length; const ops = []; let stack = [];
    const skipWs = () => { for (; ;) { while (i < n && WS.has(b[i])) i++; if (b[i] === 37) { while (i < n && b[i] !== 10 && b[i] !== 13) i++; } else break; } };
    const readLit = () => {
      const out = []; let depth = 1; i++;
      while (i < n) {
        const c = b[i++];
        if (c === 92) {
          const d = b[i++];
          if (d === 110) out.push(10); else if (d === 114) out.push(13); else if (d === 116) out.push(9); else if (d === 98) out.push(8); else if (d === 102) out.push(12);
          else if (d >= 48 && d <= 55) { let v = d - 48; for (let k = 0; k < 2 && b[i] >= 48 && b[i] <= 55; k++) v = v * 8 + (b[i++] - 48); out.push(v & 255); }
          else if (d === 13) { if (b[i] === 10) i++; } else if (d === 10) { } else out.push(d);
        } else if (c === 40) { depth++; out.push(c); } else if (c === 41) { depth--; if (!depth) break; out.push(c); } else out.push(c);
      }
      return { t: 's', v: Uint8Array.from(out) };
    };
    const readHex = () => {
      i++; let s = '';
      while (i < n && b[i] !== 62) { const c = b[i++]; if (!WS.has(c)) s += String.fromCharCode(c); }
      i++; if (s.length % 2) s += '0';
      const u = new Uint8Array(s.length / 2); for (let k = 0; k < u.length; k++) u[k] = parseInt(s.substr(k * 2, 2), 16);
      return { t: 's', v: u };
    };
    const readReg = () => { const st = i; while (i < n && !WS.has(b[i]) && !DL.has(b[i])) i++; return String.fromCharCode(...b.subarray(st, i)); };
    const readObj = () => {
      skipWs(); if (i >= n) return null;
      const c = b[i];
      if (c === 40) return readLit();
      if (c === 60) { if (b[i + 1] === 60) { i += 2; return { t: 'd<' }; } return readHex(); }
      if (c === 62 && b[i + 1] === 62) { i += 2; return { t: 'd>' }; }
      if (c === 91) { i++; const arr = []; for (; ;) { skipWs(); if (i >= n) break; if (b[i] === 93) { i++; break; } const o = readObj(); if (!o) break; arr.push(o); } return { t: 'a', v: arr }; }
      if (c === 93 || c === 41 || c === 62 || c === 123 || c === 125) { i++; return { t: 'x' }; }
      if (c === 47) { i++; return { t: 'n', v: readReg() }; }
      const w = readReg(); if (w === '') { i++; return { t: 'x' }; }
      if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) return { t: 'num', v: +w };
      if (w === 'true' || w === 'false' || w === 'null') return { t: 'k', v: w };
      return { t: 'op', v: w };
    };
    let opStart = -1;
    while (i < n) {
      skipWs(); if (i >= n) break;
      const st = i; const o = readObj(); if (!o) break;
      if (o.t !== 'op') { if (opStart < 0) opStart = st; stack.push(o); continue; }
      if (o.v === 'BI') {
        const id = (() => { for (let k = i; k < n - 1; k++) if (b[k] === 73 && b[k + 1] === 68 && WS.has(b[k - 1]) && (k + 2 >= n || WS.has(b[k + 2]))) return k; return -1; })();
        if (id < 0) return null;
        let k = id + 3;
        for (; k < n - 1; k++) if (b[k] === 69 && b[k + 1] === 73 && WS.has(b[k - 1]) && (k + 2 >= n || WS.has(b[k + 2]) || DL.has(b[k + 2]))) break;
        i = k + 2; stack = []; opStart = -1; continue;
      }
      if (o.v === 'Tj' || o.v === 'TJ' || o.v === "'" || o.v === '"') ops.push({ op: o.v, args: stack, start: opStart < 0 ? st : opStart, end: i });
      stack = []; opStart = -1;
    }
    return ops;
  }
  const hex = u => '<' + [...u].map(x => x.toString(16).padStart(2, '0')).join('') + '>';
  const num = v => (Math.round(v * 1000) / 1000).toString();
  return { tokenize, hex, num };
})();
function mMul(m, n) { return [m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3], m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3], m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5]]; }
const mApply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
async function pdfTextOps(P) {
  const OPS = pdfjsLib.OPS;
  const ol = await P.page.getOperatorList({ annotationMode: pdfjsLib.AnnotationMode.DISABLE });
  let st = { ctm: [1, 0, 0, 1, 0, 0], tm: [1, 0, 0, 1, 0, 0], x: 0, y: 0, lx: 0, ly: 0, fs: 0, dir: 1, fm: 0.001, vert: false, tc: 0, tw: 0, th: 1, rise: 0, lead: 0, t3: false };
  const stack = []; let depth = 0; const out = [];
  for (let k = 0; k < ol.fnArray.length; k++) {
    const fn = ol.fnArray[k], a = ol.argsArray[k];
    if (fn === OPS.paintFormXObjectBegin) { depth++; continue; }
    if (fn === OPS.paintFormXObjectEnd) { depth--; continue; }
    if (depth > 0) { if (fn === OPS.showText) out.push(null); continue; }
    switch (fn) {
      case OPS.save: stack.push({ ...st }); break;
      case OPS.restore: if (stack.length) st = stack.pop(); break;
      case OPS.transform: st.ctm = mMul(a, st.ctm); break;
      case OPS.beginText: st.tm = [1, 0, 0, 1, 0, 0]; st.x = st.lx = 0; st.y = st.ly = 0; break;
      case OPS.setTextMatrix: st.tm = a.slice(0, 6); st.x = st.lx = 0; st.y = st.ly = 0; break;
      case OPS.moveText: st.x = st.lx += a[0]; st.y = st.ly += a[1]; break;
      case OPS.setLeadingMoveText: st.lead = a[1]; st.x = st.lx += a[0]; st.y = st.ly += a[1]; break;
      case OPS.setLeading: st.lead = -a[0]; break;
      case OPS.nextLine: st.x = st.lx += 0; st.y = st.ly += st.lead; break;
      case OPS.setCharSpacing: st.tc = a[0]; break;
      case OPS.setWordSpacing: st.tw = a[0]; break;
      case OPS.setHScale: st.th = a[0] / 100; break;
      case OPS.setTextRise: st.rise = a[0]; break;
      case OPS.setFont: {
        st.fs = Math.abs(a[1]); st.dir = a[1] < 0 ? -1 : 1;
        let fo = null; try { fo = P.page.commonObjs.get(a[0]); } catch (e) { }
        st.fm = fo && fo.fontMatrix ? fo.fontMatrix[0] : 0.001; st.vert = !!(fo && fo.vertical); st.t3 = !!(fo && fo.isType3Font);
        break;
      }
      case OPS.showText: {
        const glyphs = a[0], items = []; let x = 0;
        const th = st.th * st.dir, was = st.fs * st.fm;
        const M = mMul(st.tm, st.ctm);
        for (const g of glyphs) {
          if (typeof g === 'number') { x += -g * st.fs / 1000; items.push({ n: g }); continue; }
          const sp = (g.isSpace ? st.tw : 0) + st.tc;
          const adv = g.width * was + sp * st.dir;
          const [cx, cy] = mApply(M, st.x + (x + adv / 2) * th, st.y + st.rise + 0.3 * st.fs);
          items.push({ g, adv, cx, cy });
          x += adv;
        }
        out.push(st.vert || st.t3 ? { bad: true, items } : { items, fs: st.fs, us: Math.abs(th) * Math.hypot(M[0], M[1]) });
        st.x += x * th;
        break;
      }
    }
  }
  return out;
}
async function redactPage(T, pi, doc, pg, rects) {
  /* rects: [{ r:[x1,y1,x2,y2], id, wNew }] – trả về { ok, reflow:Set(id) } */
  const P = T.pages[pi];
  const jsOps = P._ops || (P._ops = await pdfTextOps(P));
  const C = doc.context, fail = { ok: false, reflow: new Set() };
  let contents = pg.node.Contents(); if (!contents) return { ok: true, reflow: new Set() };
  const refsOrStreams = contents instanceof PDFLib.PDFArray ? contents.asArray() : [contents];
  const streams = refsOrStreams.map(r => r instanceof PDFLib.PDFRef ? C.lookup(r) : r);
  const datas = streams.map(s => s instanceof PDFLib.PDFRawStream ? PDFLib.decodePDFRawStream(s).decode() : (s.getContents ? s.getContents() : null));
  if (datas.some(d => !d)) return fail;
  const rawOps = []; const per = datas.map(d => { const o = PDFTok.tokenize(d); if (o) rawOps.push(...o.map(x => ({ ...x, d }))); return o; });
  if (per.some(o => !o) || rawOps.length !== jsOps.length) { console.warn('redact: lệch số lệnh', rawOps.length, jsOps.length); return fail; }
  /* giữ dòng chấm/gạch dưới (từ 3 ký tự liền nhau) */
  for (const js of jsOps) {
    if (!js || js._kept) continue; js._kept = true;
    const gl0 = js.items.filter(it => it.g); let run = [];
    const flush0 = () => { if (run.length >= 3) run.forEach(it => it.keep = true); run = []; };
    for (const it of gl0) { if (/^[.…_·]$/.test(it.g.unicode || '')) run.push(it); else flush0(); } flush0();
  }
  const rectOf0 = (x, y) => rects.find(R => x >= R.r[0] && x <= R.r[2] && y >= R.r[1] && y <= R.r[3]);
  /* không xoá dấu cách nằm ở mép khung (để giữ khoảng cách với chữ bên cạnh) */
  const edge = new Set();
  for (const op of jsOps) {
    if (!op || op.bad) continue;
    const gl = op.items.filter(it => it.g);
    for (let i = 0; i < gl.length; i++) {
      const R = rectOf0(gl[i].cx, gl[i].cy); if (!R) continue;
      const isWs = it => /^\s*$/.test(it.g.unicode || '');
      if (!isWs(gl[i])) continue;
      const prevIn = i > 0 && rectOf0(gl[i - 1].cx, gl[i - 1].cy) === R && !edge.has(gl[i - 1]);
      let j = i; while (j < gl.length && rectOf0(gl[j].cx, gl[j].cy) === R && isWs(gl[j])) j++;
      const nextIn = j < gl.length && rectOf0(gl[j].cx, gl[j].cy) === R;
      if (!prevIn || !nextIn) for (let q = i; q < j; q++) edge.add(gl[q]);
      i = j - 1;
    }
  }
  const rectOf = (x, y, it) => it && edge.has(it) ? null : rectOf0(x, y);
  /* dàn lại dòng: chữ phía sau nằm cùng lệnh vẽ thì đẩy theo độ dài giá trị mới */
  const pageW = pg.getWidth();
  const allG = []; jsOps.forEach((op, k) => { if (op && !op.bad) op.items.forEach(it => { if (it.g) allG.push({ k, it, us: op.us, fs: op.fs }); }); });
  const shift = new Map();
  for (const R of rects) {
    if (R.wNew == null) continue;
    const rem = allG.filter(g => !g.it.keep && rectOf(g.it.cx, g.it.cy, g.it) === R);
    if (!rem.length) continue;
    const last = rem.reduce((a, b) => a.it.cx > b.it.cx ? a : b);
    const k = last.k, y = last.it.cy, fs = last.fs || 10;
    const removedW = rem.reduce((s, g) => s + g.it.adv * g.us, 0);
    const delta = R.wNew - removedW;
    const fol = allG.filter(g => Math.abs(g.it.cy - y) < 0.35 * fs * (g.us || 1) && g.it.cx > R.r[2] && !rectOf(g.it.cx, g.it.cy, g.it));
    if (!fol.length) continue;
    if (!fol.every(g => g.k === k)) continue;
    const maxX = Math.max(...fol.map(g => g.it.cx)) + fs * (rem[0].us || 1) * 0.5;
    if (delta > 0 && maxX + delta > pageW * 0.97) continue;
    shift.set(R.id, { delta, done: false, k });
  }
  const edits = new Map(), reflow = new Set(), starts = new Map(), offs = new Map();
  /* vị trí thật của ký tự đầu tiên bị xoá trong mỗi khung (chính xác hơn ước lượng) */
  for (const R of rects) {
    const rem = allG.filter(g => !g.it.keep && rectOf(g.it.cx, g.it.cy, g.it) === R);
    if (rem.length) { const g0 = rem.reduce((a, b) => a.it.cx < b.it.cx ? a : b); starts.set(R.id, g0.it.cx - g0.it.adv * (g0.us || 1) / 2); }
  }
  for (let k = 0; k < rawOps.length; k++) {
    const js = jsOps[k], raw = rawOps[k]; if (!js) continue;
    const hit = js.items.some(it => it.g && !it.keep && rectOf(it.cx, it.cy, it));
    if (!hit) continue;
    if (js.bad) return fail;
    const strArg = raw.args[raw.args.length - 1];
    let elems;
    if (raw.op === 'TJ') { if (!strArg || strArg.t !== 'a') return fail; elems = strArg.v.filter(e => e.t === 's' || e.t === 'num'); }
    else { if (!strArg || strArg.t !== 's') return fail; elems = [strArg]; }
    const nG = js.items.filter(it => it.g).length, nB = elems.filter(e => e.t === 's').reduce((s, e) => s + e.v.length, 0);
    if (!nG) continue;
    const bpg = nB / nG; if (bpg !== 1 && bpg !== 2) return fail;
    if (elems.some(e => e.t === 's' && e.v.length % bpg)) return fail;
    const parts = []; let gi = 0; let cur = []; let adj = 0, pend = null, cum = 0;
    const gl = js.items.filter(it => it.g);
    const flush = () => { if (cur.length) { if (adj) { parts.push(PDFTok.num(adj)); adj = 0; } parts.push(PDFTok.hex(Uint8Array.from(cur))); cur = []; } };
    const applyShift = () => {
      if (!pend) return; const sh = shift.get(pend.id);
      if (sh && !sh.done && sh.k === k) { adj += -(sh.delta / (js.us || 1)) * 1000 / (js.fs || 1); sh.done = true; reflow.add(pend.id); cum += sh.delta; }
      pend = null;
    };
    for (const e of elems) {
      if (e.t === 'num') { flush(); adj += e.v; continue; }
      for (let p = 0; p < e.v.length; p += bpg) {
        const g = gl[gi++]; const code = [...e.v.subarray(p, p + bpg)];
        const R = g && !g.keep ? rectOf(g.cx, g.cy, g) : null;
        if (R) { flush(); adj += -g.adv * 1000 / (js.fs || 1); if (pend !== R && cum) offs.set(R.id, cum); pend = R; }
        else { applyShift(); if (adj) { parts.push(PDFTok.num(adj)); adj = 0; } cur.push(...code); }
      }
    }
    flush(); if (adj) parts.push(PDFTok.num(adj));
    let rep = `[${parts.join(' ')}] TJ`;
    if (raw.op === "'") rep = 'T* ' + rep;
    if (raw.op === '"') { const aw = raw.args[0], ac = raw.args[1]; rep = `${PDFTok.num(aw.v)} Tw ${PDFTok.num(ac.v)} Tc T* ` + rep; }
    if (!edits.has(raw.d)) edits.set(raw.d, []);
    edits.get(raw.d).push({ s: raw.start, e: raw.end, rep });
  }
  if (!edits.size) return { ok: true, reflow, starts, offs };
  const enc = new TextEncoder();
  const newRefs = datas.map((d, si) => {
    const ed = (edits.get(d) || []).sort((a, b) => a.s - b.s);
    if (!ed.length) return refsOrStreams[si] instanceof PDFLib.PDFRef ? refsOrStreams[si] : C.register(streams[si]);
    const chunks = []; let at = 0;
    for (const x of ed) { chunks.push(d.subarray(at, x.s), enc.encode(' ' + x.rep + ' ')); at = x.e; }
    chunks.push(d.subarray(at));
    const len = chunks.reduce((s, c) => s + c.length, 0), out = new Uint8Array(len); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
    return C.register(C.flateStream(out));
  });
  pg.node.set(PDFLib.PDFName.of('Contents'), C.obj(newRefs));
  return { ok: true, reflow, starts, offs };
}
async function pdfRedacted(T, boxes, widths) {
  /* widths: Map(id → độ rộng giá trị mới) – dùng để dàn lại dòng theo từng bản */
  const cov = boxes.filter(b => b.cover);
  const key = JSON.stringify(cov.map(b => [b.page, b.x, b.y, b.w, b.h, widths ? widths.get(b.id) || 0 : 0].map(v => Math.round(v * 100) / 100)));
  if (T._red && T._red.key === key) return T._red;
  const res = { key, bytes: T.bytes, ok: true, reflow: new Set(), starts: new Map(), offs: new Map() };
  if (T.hasText && cov.length) {
    try {
      const doc = await PDFLib.PDFDocument.load(T.bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const byPage = new Map();
      for (const b of cov) {
        const P = T.pages[b.page]; if (!P || !pages[b.page]) continue;
        const [x1, y1] = P.vp.convertToPdfPoint(b.x, b.y + b.h), [x2, y2] = P.vp.convertToPdfPoint(b.x + b.w, b.y);
        if (!byPage.has(b.page)) byPage.set(b.page, []);
        byPage.get(b.page).push({ r: [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)], id: b.id, wNew: widths && b.align === 'left' && b.fit !== 'none' ? widths.get(b.id) : null });
      }
      for (const [pi, rects] of byPage) { const r = await redactPage(T, pi, doc, pages[pi], rects); if (!r.ok) res.ok = false; r.reflow.forEach(id => res.reflow.add(id)); if (r.starts) r.starts.forEach((v, id) => res.starts.set(id, v)); if (r.offs) r.offs.forEach((v, id) => res.offs.set(id, v)); }
      res.bytes = await doc.save({ useObjectStreams: false });
    } catch (e) { console.warn('redact', e); res.ok = false; res.bytes = T.bytes; }
  }
  T._red = res; return res;
}

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
  histButtons();
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
/* ---------- Hoàn tác / làm lại (Ctrl+Z, Ctrl+Y) ----------
   Ghi lại trạng thái ghép trường, khung chữ, dòng đã chọn, tuỳ chọn xuất sau mỗi thao tác. */
const HIST = { undo: [], redo: [], cur: null, key: null, busy: false };
function histState() {
  const d = S.data;
  return JSON.stringify({ rules: S.rules, boxes: S.boxes, sel: d && d.sel ? [...d.sel] : null, sheet: d ? d.sheet : null, out: S.out, sampleRow: S.sampleRow, selRule: S.selRule, selBox: S.selBox, page: S.page });
}
const histKey = () => (S.tpl ? S.tpl.name + S.tpl.size : '') + '|' + (S.data ? S.data.name + S.data.size : '');
function histBaseline() { HIST.cur = histState(); HIST.key = histKey(); HIST.step = S.step; }
function histCheckpoint() {
  if (HIST.busy) return;
  if (HIST.key !== histKey()) { HIST.undo = []; HIST.redo = []; histBaseline(); histButtons(); return; } /* đổi file → bắt đầu lịch sử mới */
  if (HIST.step !== S.step) { histBaseline(); return; } /* vừa chuyển bước: giá trị mặc định của bước mới không tính là thao tác */
  const now = histState();
  if (now === HIST.cur) return;
  if (HIST.cur != null) { HIST.undo.push(HIST.cur); if (HIST.undo.length > 100) HIST.undo.shift(); }
  HIST.redo = []; HIST.cur = now; histButtons();
}
function histApply(json) {
  const o = JSON.parse(json);
  HIST.busy = true;
  S.rules = o.rules; S.boxes = o.boxes; S.out = o.out; S.sampleRow = o.sampleRow; S.selRule = o.selRule; S.selBox = o.selBox; S.page = o.page || 0;
  if (S.data && o.sheet && o.sheet !== S.data.sheet) { S.data.sheet = o.sheet; parseSheet(); }
  if (S.data && o.sel) S.data.sel = new Set(o.sel);
  HIST.cur = json; render(); HIST.busy = false; histButtons();
}
function undo() { if (!HIST.undo.length) { toast('Không còn thao tác để hoàn tác.'); return; } histCheckpoint(); if (!HIST.undo.length) return; HIST.redo.push(HIST.cur); histApply(HIST.undo.pop()); toast('Đã hoàn tác thao tác vừa rồi.'); }
function redo() { if (!HIST.redo.length) return; HIST.undo.push(HIST.cur); histApply(HIST.redo.pop()); toast('Đã làm lại.'); }
function histButtons() {
  const u = $('#undoBtn'), r = $('#redoBtn'); if (!u) return;
  const show = S.step !== 'home' && (HIST.undo.length || HIST.redo.length);
  u.hidden = r.hidden = !show; u.disabled = !HIST.undo.length; r.disabled = !HIST.redo.length;
}
let HIST_T = 0;
const histSoon = () => { clearTimeout(HIST_T); HIST_T = setTimeout(histCheckpoint, 60); };
function render() {
  renderSteps();
  document.body.classList.toggle('is-home', S.step === 'home');
  const m = $('#main'); m.innerHTML = '';
  const v = { home: viewHome, tpl: viewTpl, data: viewData, map: viewMap, pv: viewPreview, out: viewExport }[S.step];
  m.append(v());
  if (S.step !== 'home') topNav(m);
  histSoon();
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
const DEMO_VIDEO_ID = '61ViuSOMFrA';
const TOOLS_URL = /^https?:$/.test(location.protocol) ? '/cong-cu' : 'https://quantritute.com/cong-cu';

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
  setTimeout(histBaseline, 0); /* kết quả tự nhận diện là mốc ban đầu, không tính là thao tác */
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
      try { const r = await fetch(new URL('tao-van-ban-hang-loat.html', location.href).href, { cache: 'no-store' }); download(new Blob([await r.blob()], { type: 'text/html' }), 'tao-van-ban-hang-loat.html'); toast('Mở file vừa tải bằng Chrome hoặc Edge để dùng, không cần mạng.', 4000); }
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
