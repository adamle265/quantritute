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
