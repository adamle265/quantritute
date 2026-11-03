/* In hóa đơn PDF theo danh sách – lõi xử lý (không phụ thuộc giao diện)
   Dùng được cả trên trình duyệt lẫn node (kiểm thử). Cần fflate (đọc/ghi xlsx). */
var IPE = (function () {
  'use strict';
  var FF = (typeof fflate !== 'undefined') ? fflate : (typeof require === 'function' ? require('fflate') : null);

  /* ---------- chuẩn hoá ---------- */
  function boDau(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();
  }
  function stripZ(s) { s = String(s).replace(/^0+/, ''); return s || '0'; }
  var RE_KH = /[CK]\d{2}[A-Z]{3}/;
  function normKH(v) {
    var s = boDau(v).replace(/[^A-Z0-9]/g, '');
    if (!s) return '';
    var m = s.match(RE_KH); return m ? m[0] : s;
  }
  function normMST(v) {
    var s = String(v == null ? '' : v).replace(/[^0-9]/g, '');
    return (s.length === 10 || s.length === 13) ? s : (s.length >= 9 ? s : '');
  }
  function normSo(v) {
    if (v == null || v === '') return '';
    if (typeof v === 'number') return v > 0 && Math.floor(v) === v ? String(v) : '';
    var s = String(v).trim();
    if (!/\d/.test(s)) return '';
    var d = s.replace(/[^0-9]/g, '');
    if (!d || d.length > 8) return '';
    return stripZ(d);
  }
  function natCmp(a, b) {
    var ax = String(a).toLowerCase().match(/\d+|\D+/g) || [], bx = String(b).toLowerCase().match(/\d+|\D+/g) || [];
    for (var i = 0; i < Math.min(ax.length, bx.length); i++) {
      var x = ax[i], y = bx[i];
      if (x === y) continue;
      var nx = /^\d/.test(x), ny = /^\d/.test(y);
      if (nx && ny) { var d = (+x) - (+y); if (d) return d; return x.length - y.length; }
      return x < y ? -1 : 1;
    }
    return ax.length - bx.length;
  }

  /* ---------- trích khoá từ tên file / chữ trong PDF ---------- */
  // trả { nums:Set, khs:Set, msts:Set, pairs:Set('KH|so'), labeled:Set }
  function extractKeys(str, isText) {
    var s = boDau(str);
    var k = { nums: new Set(), khs: new Set(), msts: new Set(), pairs: new Set(), labeled: new Set() };
    var m, re;
    re = /(?:^|[^A-Z])\d?([CK]\d{2}[A-Z]{3})(?![A-Z])/g;
    while ((m = re.exec(s))) k.khs.add(m[1]);
    re = /([CK]\d{2}[A-Z]{3})[^A-Z0-9]{0,4}(\d{1,8})(?!\d)/g;
    while ((m = re.exec(s))) k.pairs.add(m[1] + '|' + stripZ(m[2]));
    re = /(?:^|[^0-9])(\d{10})(?:-?(\d{3}))?(?![0-9])/g;
    while ((m = re.exec(s))) { k.msts.add(m[1] + (m[2] || '')); if (m[2]) k.msts.add(m[1]); }
    re = /\d+/g;
    while ((m = re.exec(s))) if (m[0].length <= 8) k.nums.add(stripZ(m[0]));
    if (isText) {
      re = /(?:^|[^A-Z])SO\s*(?:\(\s*(?:INVOICE\s*)?NO\.?\s*\)|HOA DON)?\s*[:.]?\s*(\d{1,8})(?![\d.,])/g;
      while ((m = re.exec(s))) k.labeled.add(stripZ(m[1]));
      re = /(?:^|[^A-Z])NO\.?\s*[:.]\s*(\d{1,8})(?![\d.,])/g;
      while ((m = re.exec(s))) k.labeled.add(stripZ(m[1]));
    } else {
      // tên file: số đứng ngay sau ký hiệu, hoặc số có số 0 đứng đầu (thường là số HĐ 7–8 chữ số) coi như có nhãn
      k.pairs.forEach(function (p) { k.labeled.add(p.split('|')[1]); });
      re = /(?:^|[^0-9])(0+\d{1,7})(?![0-9])/g;
      while ((m = re.exec(s))) if (m[1].length >= 7 && m[1].length <= 8) k.labeled.add(stripZ(m[1]));
    }
    return k;
  }

  /* ---------- chấm điểm 1 dòng danh sách với 1 file ---------- */
  function score(row, k) {
    var s = 0, why = [];
    if (row.kh && k.pairs.has(row.kh + '|' + row.so)) { s += 6; why.push('ký hiệu + số'); }
    else {
      if (k.labeled.has(row.so)) { s += 3; why.push('số HĐ'); }
      else if (k.nums.has(row.so)) { s += 1; why.push('số HĐ'); }
      if (row.kh) {
        if (k.khs.has(row.kh)) { s += 3; why.push('ký hiệu'); }
        else if (k.khs.size) s -= 5;
      }
    }
    if (row.mst) {
      if (k.msts.has(row.mst)) { s += 3; why.push('MST'); }
      else if (k.msts.size) s -= 1;
    }
    return { s: s, why: why };
  }

  /* ---------- khớp ----------
     rows: [{i, so, kh, mst, ...}]   items: [{id, keysName, keysText?}]
     Kết quả gán vào row.item / item.row, item.level ('chac'|'so'|'tay'), item.status ('khop'|'trung'|'mo-ho'|'khong') */
  function buildIndex(rows) {
    var by = new Map();
    var seen = new Map();
    rows.forEach(function (r) {
      if (!r.so) return;
      var key = r.kh + '|' + r.so + '|' + r.mst;
      if (seen.has(key)) { r.dupRow = seen.get(key); return; } // dòng lặp lại trong danh sách
      seen.set(key, r.i); r.dupRow = null;
      if (!by.has(r.so)) by.set(r.so, []); by.get(r.so).push(r);
    });
    return by;
  }
  function bestFor(item, k, by, isText) {
    var cand = new Map(), arr = [];
    function add(n) { var l = by.get(n); if (l) l.forEach(function (r) { cand.set(r.i, r); }); }
    k.nums.forEach(add); k.labeled.forEach(add);
    cand.forEach(function (r) { var sc = score(r, k); if (sc.s > 0) arr.push({ r: r, s: sc.s, why: sc.why }); });
    arr.sort(function (a, b) { return b.s - a.s; });
    if (!arr.length) return null;
    var top = arr[0], tie = arr.length > 1 && arr[1].s === top.s;
    var need = isText ? 3 : 1;
    if (top.s < need) return null;
    if (tie) return { amb: arr.filter(function (x) { return x.s === top.s; }).map(function (x) { return x.r; }) };
    var level = top.s >= 4 ? 'chac' : 'so';
    // chỉ có số (1–3 điểm): số đó phải là duy nhất trong danh sách
    if (level === 'so' && by.get(top.r.so).length > 1) return { amb: by.get(top.r.so) };
    return { r: top.r, s: top.s, level: level, why: top.why };
  }
  // tên file kiểu bản sao: "abc (1).pdf", "abc - Copy.pdf", "Bản sao của abc" → xếp sau bản gốc
  function copyPen(n) { return /\(\d+\)\s*(\.[a-z]+)?$|copy|ban sao|bản sao/i.test(n) ? 1 : 0; }
  // Lượt đọc chữ trong file: xét các file chưa khớp + file chỉ khớp theo số (level 'so') để xác nhận lại
  function textPass(rows, items, by) {
    var weak = [];
    items.forEach(function (it) {
      if (it.status === 'khop' && it.level === 'so' && it.keysText) {
        weak.push({ it: it, r: it.row }); rows[it.row].item = null; it.status = null; it.row = null; it.level = null;
      }
    });
    matchPass(rows, items, by, 'text');
    weak.forEach(function (w) {
      var it = w.it;
      if (it.status !== 'khop' && rows[w.r].item == null) { rows[w.r].item = it.id; it.row = w.r; it.status = 'khop'; it.level = 'so'; it.amb = null; }
    });
  }
  // pass: 'name' | 'text'. Chỉ xử lý item chưa khớp; dòng đã có file thì file sau thành "trùng".
  function matchPass(rows, items, by, pass) {
    var claims = [];
    items.forEach(function (it) {
      if (it.status === 'khop' || it.status === 'trung' || it.status === 'loi') return;
      var k = pass === 'text' ? it.keysText : it.keysName;
      if (!k) return;
      var b = bestFor(it, k, by, pass === 'text');
      if (!b) { if (pass === 'text' || !it.amb) it.status = 'khong'; return; }
      if (b.amb) { it.status = 'mo-ho'; it.amb = b.amb.map(function (r) { return r.i; }); return; }
      claims.push({ it: it, b: b });
    });
    claims.sort(function (a, b) { return b.b.s - a.b.s || copyPen(a.it.name) - copyPen(b.it.name) || natCmp(a.it.name, b.it.name); });
    claims.forEach(function (c) {
      var r = c.b.r, it = c.it;
      if (r.item != null) {
        // tranh chấp yếu (chỉ khớp theo số) → để lượt đọc chữ trong file xử lý lại, không kết luận trùng
        if (c.b.level === 'so') { it.status = 'mo-ho'; it.amb = [r.i]; return; }
        it.status = 'trung'; it.dupOf = r.i; return;
      }
      r.item = it.id; it.row = r.i; it.status = 'khop'; it.level = c.b.level; it.why = c.b.why.join(', ') + (pass === 'text' ? ' (đọc trong file)' : ' (tên file)');
      it.amb = null;
    });
  }

  /* ---------- đọc danh sách Excel / CSV ---------- */
  var HEAD = {
    so: [/^so hoa don$/, /^so hd$/, /^so hoa don dien tu$/, /so hoa don/, /^so hd\b/, /invoice no/, /^so$/],
    kh: [/^ky hieu hoa don$/, /^ky hieu hd$/, /^ky hieu$/, /ky hieu hoa don/, /serial/],
    mst: [/mst nguoi ban/, /ma so thue nguoi ban/, /mst ncc/, /mst nha cung cap/, /mst ben ban/, /^mst$/, /^ma so thue$/, /mst/],
    ngay: [/^ngay lap$/, /ngay lap/, /^ngay hoa don$/, /^ngay hd$/, /^ngay$/],
    mau: [/^ky hieu mau so$/, /^mau so$/, /ky hieu mau so/, /mau so hoa don/],
    ten: [/ten nguoi ban/, /nha cung cap/, /ten ncc/, /ten don vi ban/, /ten nguoi mua/, /ten khach/]
  };
  function headKey(v) { return boDau(v).toLowerCase().replace(/[^a-z0-9/ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function guessCols(header) {
    var res = {}, used = {};
    ['so', 'kh', 'mst', 'ngay', 'mau', 'ten'].forEach(function (f) {
      var pats = HEAD[f];
      for (var p = 0; p < pats.length && res[f] == null; p++) {
        for (var c = 0; c < header.length; c++) {
          if (used[c]) continue;
          var h = headKey(header[c]);
          if (!h) continue;
          if (f === 'kh' && /mau so/.test(h)) continue;
          if (f === 'so' && /(mau so|ky hieu|thue|tien|luong|stt)/.test(h)) continue;
          if (f === 'mst' && /mua/.test(h) && p >= 5) continue;
          if (pats[p].test(h)) { res[f] = c; used[c] = 1; break; }
        }
      }
    });
    return res;
  }
  function findHeaderRow(aoa) {
    var best = -1, bs = 0;
    for (var r = 0; r < Math.min(aoa.length, 40); r++) {
      var g = guessCols(aoa[r] || []), sc = 0;
      if (g.so != null) sc += 3; if (g.kh != null) sc += 2; if (g.mst != null) sc += 1; if (g.ngay != null) sc += 1;
      if (sc > bs) { bs = sc; best = r; }
    }
    return best;
  }
  function xmlDec(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCodePoint(+n); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCodePoint(parseInt(n, 16)); }).replace(/&amp;/g, '&');
  }
  function colIdx(ref) { var m = /^([A-Z]+)/.exec(ref), n = 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + m[1].charCodeAt(i) - 64; return n - 1; }
  function readXlsx(u8) {
    var z = FF.unzipSync(u8), td = new TextDecoder('utf-8');
    function txt(p) { return z[p] ? td.decode(z[p]) : ''; }
    var ss = [], sst = txt('xl/sharedStrings.xml');
    sst.replace(/<si>([\s\S]*?)<\/si>/g, function (_, si) {
      var t = ''; si.replace(/<t[^>]*>([\s\S]*?)<\/t>/g, function (__, x) { t += x; }); ss.push(xmlDec(t)); return '';
    });
    var wb = txt('xl/workbook.xml'), rels = txt('xl/_rels/workbook.xml.rels'), sheets = [];
    wb.replace(/<sheet\b([^>]*)\/?>/g, function (_, a) {
      var nm = /name="([^"]*)"/.exec(a), rid = /r:id="([^"]*)"/.exec(a) || /\bid="([^"]*)"/.exec(a);
      var tg = rid ? new RegExp('Id="' + rid[1] + '"[^>]*Target="([^"]*)"').exec(rels) || new RegExp('Target="([^"]*)"[^>]*Id="' + rid[1] + '"').exec(rels) : null;
      var path = tg ? tg[1].replace(/^\/?xl\//, '').replace(/^\//, '') : '';
      sheets.push({ name: xmlDec(nm ? nm[1] : 'Sheet'), path: 'xl/' + path });
    });
    if (!sheets.length) Object.keys(z).filter(function (p) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(p); }).sort(natCmp).forEach(function (p, i) { sheets.push({ name: 'Sheet' + (i + 1), path: p }); });
    sheets.forEach(function (sh) {
      var x = txt(sh.path), aoa = [];
      x.replace(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g, function (_, body) {
        var row = [];
        if (body) body.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, function (__, attrs, inner) {
          var r = /\br="([A-Z]+)\d+"/.exec(attrs), t = /\bt="([^"]*)"/.exec(attrs), ci = r ? colIdx(r[1]) : row.length, v = '';
          inner = inner || '';
          var vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
          if (t && t[1] === 's') v = vm ? ss[+vm[1]] : '';
          else if (t && t[1] === 'inlineStr') { var q = ''; inner.replace(/<t[^>]*>([\s\S]*?)<\/t>/g, function (_x, y) { q += y; }); v = xmlDec(q); }
          else if (t && (t[1] === 'str' || t[1] === 'e')) v = vm ? xmlDec(vm[1]) : '';
          else if (t && t[1] === 'b') v = vm ? (vm[1] === '1' ? 'TRUE' : 'FALSE') : '';
          else v = vm ? (isNaN(+vm[1]) ? xmlDec(vm[1]) : +vm[1]) : '';
          row[ci] = v; return '';
        });
        var rr = /<row\b[^>]*\br="(\d+)"/.exec(_);
        if (rr) { while (aoa.length < +rr[1] - 1) aoa.push([]); }
        aoa.push(row); return '';
      });
      sh.aoa = aoa;
    });
    return sheets;
  }
  function readCsv(text) {
    text = text.replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', cnt = function (c) { return first.split(c).length; };
    var d = cnt('\t') > cnt(';') && cnt('\t') > cnt(',') ? '\t' : (cnt(';') > cnt(',') ? ';' : ',');
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += ch;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return [{ name: 'CSV', aoa: rows }];
  }
  function excelDate(v) {
    if (typeof v !== 'number' || v < 20000 || v > 80000) return v;
    var d = new Date(Math.round((v - 25569) * 86400000));
    return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear();
  }
  // dựng danh sách dòng từ bảng (aoa), dòng tiêu đề hr, map cột cols
  function buildRows(aoa, hr, cols) {
    var rows = [];
    for (var r = hr + 1; r < aoa.length; r++) {
      var a = aoa[r] || [];
      var so = normSo(a[cols.so]);
      if (!so) continue;
      rows.push({
        i: rows.length, line: r + 1, so: so, soRaw: a[cols.so],
        kh: cols.kh != null ? normKH(a[cols.kh]) : '', khRaw: cols.kh != null ? (a[cols.kh] == null ? '' : String(a[cols.kh])) : '',
        mst: cols.mst != null ? normMST(a[cols.mst]) : '',
        ngay: cols.ngay != null ? String(excelDate(a[cols.ngay]) == null ? '' : excelDate(a[cols.ngay])) : '',
        ten: cols.ten != null ? String(a[cols.ten] == null ? '' : a[cols.ten]) : '',
        mau: cols.mau != null ? String(a[cols.mau] == null ? '' : a[cols.mau]).trim() : '',
        item: null
      });
    }
    return rows;
  }

  /* ---------- đặt tên file theo cú pháp (bản 1.2.0) ---------- */
  // bỏ dấu tiếng Việt nhưng giữ chữ hoa/thường
  function boDauGiu(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFC'); }
  // ngày dd/mm/yyyy, yyyy-mm-dd hoặc số Excel → {d,m,y}
  function parseNgay(v) {
    v = excelDate(v); var s = String(v == null ? '' : v).trim(), m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return { y: m[1], m: ('0' + m[2]).slice(-2), d: ('0' + m[3]).slice(-2) };
    if ((m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s))) return { y: m[3].length === 2 ? '20' + m[3] : m[3], m: ('0' + m[2]).slice(-2), d: ('0' + m[1]).slice(-2) };
    return null;
  }
  // làm sạch 1 phần tên: bỏ ký tự Windows cấm, gộp khoảng trắng, tuỳ chọn bỏ dấu / bỏ dấu cách
  function cleanPart(v, cfg) {
    var s = String(v == null ? '' : v).replace(/[\\\/:*?"<>|\x00-\x1F]+/g, '-').replace(/\s+/g, ' ').trim();
    if (cfg.boDau) s = boDauGiu(s);
    if (cfg.noSpace) s = s.replace(/ /g, '');
    return s.replace(/^[.\s]+|[.\s]+$/g, '');
  }
  var PARTS = {
    stt: 'Số thứ tự (như bản in)', mau: 'Ký hiệu mẫu số', yymm: 'Năm tháng hóa đơn (YYMM)', so: 'Số hóa đơn', ten: 'Tên công ty',
    kh: 'Ký hiệu hóa đơn', mst: 'MST người bán', ngay: 'Ngày hóa đơn (DDMMYYYY)', text: 'Chữ tự nhập'
  };
  var DEFAULT_NAME = { parts: [{ k: 'stt', on: 1 }, { k: 'mau', on: 1 }, { k: 'yymm', on: 1 }, { k: 'so', on: 1 }, { k: 'ten', on: 1 }, { k: 'kh', on: 0 }, { k: 'mst', on: 0 }, { k: 'ngay', on: 0 }, { k: 'text', on: 0, txt: '' }], sep: '_', boDau: false, noSpace: false };
  // tên mới (chưa có .pdf). row có thể null (không có danh sách) → STT + tên gốc
  function makeName(row, stt, wStt, cfg, origName) {
    var MAX = 150, out = [], tenIdx = -1;
    if (!row) {
      var base = String(origName || '').replace(/\.pdf$/i, '');
      out = [String(stt).padStart(wStt, '0'), cleanPart(base, cfg)];
    } else {
      cfg.parts.forEach(function (p) {
        if (!p.on) return;
        var v = '', nd;
        if (p.k === 'stt') v = String(stt).padStart(wStt, '0');
        else if (p.k === 'mau') v = row.mau;
        else if (p.k === 'yymm') { nd = parseNgay(row.ngay); v = nd ? nd.y.slice(-2) + nd.m : ''; }
        else if (p.k === 'so') v = row.so;
        else if (p.k === 'ten') { v = row.ten; }
        else if (p.k === 'kh') v = row.khRaw;
        else if (p.k === 'mst') v = row.mst;
        else if (p.k === 'ngay') { nd = parseNgay(row.ngay); v = nd ? nd.d + nd.m + nd.y : ''; }
        else if (p.k === 'text') v = p.txt;
        v = cleanPart(v, cfg);
        if (!v) return;
        if (p.k === 'ten') tenIdx = out.length;
        out.push(v);
      });
    }
    var sep = cfg.sep == null ? '_' : cfg.sep, name = out.join(sep);
    if (name.length > MAX) {
      var i = tenIdx >= 0 ? tenIdx : out.length - 1, over = name.length - MAX;
      out[i] = out[i].slice(0, Math.max(8, out[i].length - over)).trim();
      name = out.join(sep).slice(0, MAX + 20);
    }
    return name;
  }
  // tránh trùng tên (không phân biệt hoa thường như Windows): thêm " (2)", " (3)"…
  function uniqueNamer() {
    var seen = {};
    return function (name) {
      var k = name.toLowerCase(), n = seen[k] || 0; seen[k] = n + 1;
      if (!n) return name;
      var c = n + 1; while (seen[(name + ' (' + c + ')').toLowerCase()]) c++;
      var nm = name + ' (' + c + ')'; seen[nm.toLowerCase()] = 1; return nm;
    };
  }

  /* ---------- ZIP "lưu trữ" (không nén) chuẩn, ghi đủ kích thước + CRC ở header (không dùng data descriptor)
     để Windows Explorer mở được trực tiếp; tên tiếng Việt UTF-8 (cờ bit 11) ---------- */
  var CRC_T = null;
  function crc32(u8, crc) {
    if (!CRC_T) { CRC_T = new Int32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c; } }
    crc = (crc == null ? 0 : crc) ^ -1;
    for (var i = 0; i < u8.length; i++) crc = CRC_T[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  }
  function ZipStore(date) {
    var d = date || new Date(), enc = new TextEncoder(), cd = [], off = 0, parts = [];
    var tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function hdr(sig, name, crc, size, central, at) {
      var nb = enc.encode(name), b = new Uint8Array((central ? 46 : 30) + nb.length), v = new DataView(b.buffer), p = 0;
      v.setUint32(p, sig, true); p += 4;
      if (central) { v.setUint16(p, 20, true); p += 2; }           // version made by: 2.0, MS-DOS
      v.setUint16(p, 20, true); p += 2;                              // version needed
      v.setUint16(p, 0x0800, true); p += 2;                          // UTF-8
      v.setUint16(p, 0, true); p += 2;                               // stored
      v.setUint16(p, tm, true); p += 2; v.setUint16(p, dt, true); p += 2;
      v.setUint32(p, crc, true); p += 4; v.setUint32(p, size, true); p += 4; v.setUint32(p, size, true); p += 4;
      v.setUint16(p, nb.length, true); p += 2; v.setUint16(p, 0, true); p += 2;
      if (central) { p += 2 + 2 + 2; v.setUint32(p, 0x20, true); p += 4; v.setUint32(p, at, true); p += 4; } // comment, disk, int attr = 0; ext attr = archive
      b.set(nb, p); return b;
    }
    return {
      // data: Uint8Array (để tính CRC); body: Blob/Uint8Array đưa vào file (mặc định = data)
      add: function (name, data, body) {
        var crc = crc32(data), lh = hdr(0x04034b50, name, crc, data.length, false);
        cd.push(hdr(0x02014b50, name, crc, data.length, true, off));
        parts.push(lh, body || data); off += lh.length + data.length;
      },
      size: function () { return off; },
      end: function () {
        var cdl = 0; cd.forEach(function (x) { parts.push(x); cdl += x.length; });
        var e = new Uint8Array(22), v = new DataView(e.buffer);
        v.setUint32(0, 0x06054b50, true); v.setUint16(8, cd.length, true); v.setUint16(10, cd.length, true); v.setUint32(12, cdl, true); v.setUint32(16, off, true);
        parts.push(e); return parts;
      }
    };
  }

  /* ---------- ghi xlsx đơn giản ---------- */
  function xesc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); }
  function cName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  // sheets: [{name, head:[..], rows:[[..]], widths:[..], fills:[styleIdx per row]}]
  function writeXlsx(sheets) {
    var enc = new TextEncoder(), files = {};
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    var wbs = '', rels = '';
    sheets.forEach(function (sh, n) {
      ct += '<Override PartName="/xl/worksheets/sheet' + (n + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      wbs += '<sheet name="' + xesc(sh.name) + '" sheetId="' + (n + 1) + '" r:id="rId' + (n + 1) + '"/>';
      rels += '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (n + 1) + '.xml"/>';
      var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>';
      sh.head.forEach(function (_, c) { x += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + ((sh.widths && sh.widths[c]) || 14) + '" customWidth="1"/>'; });
      x += '</cols><sheetData>';
      var all = [sh.head].concat(sh.rows);
      all.forEach(function (row, r) {
        var st = r === 0 ? 1 : ((sh.fills && sh.fills[r - 1]) || 0);
        x += '<row r="' + (r + 1) + '">';
        row.forEach(function (v, c) {
          var ref = cName(c) + (r + 1);
          if (typeof v === 'number' && isFinite(v)) x += '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>';
          else x += '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xesc(v) + '</t></is></c>';
        });
        x += '</row>';
      });
      x += '</sheetData><autoFilter ref="A1:' + cName(sh.head.length - 1) + all.length + '"/></worksheet>';
      files['xl/worksheets/sheet' + (n + 1) + '.xml'] = enc.encode(x);
    });
    ct += '</Types>';
    files['[Content_Types].xml'] = enc.encode(ct);
    files['_rels/.rels'] = enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    files['xl/workbook.xml'] = enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + wbs + '</sheets></workbook>');
    files['xl/_rels/workbook.xml.rels'] = enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels + '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    // style 0 thường, 1 tiêu đề, 2 xanh (khớp), 3 vàng (nên xem lại), 4 đỏ (thiếu/lỗi)
    files['xl/styles.xml'] = enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF231E19"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F1E8"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFCE2B6"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8E3DE"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD8CFC2"/></left><right style="thin"><color rgb="FFD8CFC2"/></right><top style="thin"><color rgb="FFD8CFC2"/></top><bottom style="thin"><color rgb="FFD8CFC2"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf borderId="1" applyBorder="1"/><xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fillId="3" borderId="1" applyFill="1" applyBorder="1"/><xf fillId="4" borderId="1" applyFill="1" applyBorder="1"/><xf fillId="5" borderId="1" applyFill="1" applyBorder="1"/></cellXfs></styleSheet>');
    return FF.zipSync(files, { level: 6 });
  }

  return {
    boDau: boDau, stripZ: stripZ, normKH: normKH, normMST: normMST, normSo: normSo, natCmp: natCmp,
    extractKeys: extractKeys, score: score, buildIndex: buildIndex, matchPass: matchPass, textPass: textPass, copyPen: copyPen, bestFor: bestFor,
    readXlsx: readXlsx, readCsv: readCsv, findHeaderRow: findHeaderRow, guessCols: guessCols, buildRows: buildRows,
    writeXlsx: writeXlsx, excelDate: excelDate, headKey: headKey,
    boDauGiu: boDauGiu, parseNgay: parseNgay, cleanPart: cleanPart, makeName: makeName, uniqueNamer: uniqueNamer, crc32: crc32, ZipStore: ZipStore, PARTS: PARTS, DEFAULT_NAME: DEFAULT_NAME
  };
})();
if (typeof module !== 'undefined') module.exports = IPE;
