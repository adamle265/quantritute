/* ===========================================================================
   GHÉP & ĐỐI CHIẾU 2 FILE EXCEL – LÕI XỬ LÝ (chạy trong Web Worker hoặc luồng chính)
   Quản trị tử tế · toàn bộ xử lý ngay trên máy người dùng, không gửi file đi đâu.
   Dùng: fflate (giải nén .xlsx), SheetJS (chỉ nạp khi gặp .xls/.xlsb).
   =========================================================================== */
var GDC = (function () {
  'use strict';

  var EXCEL_ROW_LIMIT = 1048575;
  var MAX_RESULT_ROWS = 6000000;
  var progressFn = function () {};
  function progress(msg, pct) { try { progressFn(msg, pct); } catch (e) {} }
  function FriendlyError(msg) { var e = new Error(msg); e.friendly = true; return e; }

  /* ---------------- Kiểu ngày ---------------- */
  function XD(s) { this.s = s; }               // ngày lưu dạng số sê-ri Excel
  var MS_DAY = 86400000, EPOCH = Date.UTC(1899, 11, 30);
  function serialToParts(s) {
    var d = new Date(EPOCH + Math.round(s * MS_DAY));
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()];
  }
  function hasTime(x) { var f = x.s - Math.floor(x.s); return f * MS_DAY > 500 && (1 - f) * MS_DAY > 500; }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(x) { var p = serialToParts(x.s); return p2(p[2]) + '/' + p2(p[1]) + '/' + p[0]; }
  // hiển thị: có giờ thì thêm giờ (03/08/2026 08:29:23)
  function fmtDateTime(x) { if (!hasTime(x)) return fmtDate(x); var p = serialToParts(x.s); return p2(p[2]) + '/' + p2(p[1]) + '/' + p[0] + ' ' + p2(p[3]) + ':' + p2(p[4]) + ':' + p2(p[5]); }
  function dateToSerial(y, m, d, hh, mm, ss) { return (Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0) - EPOCH) / MS_DAY; }

  /* ---------------- Định dạng hiển thị kiểu Việt Nam ---------------- */
  function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return '';
    var neg = n < 0; n = Math.abs(n);
    var isInt = Math.abs(n - Math.round(n)) < 1e-9;
    var s = isInt ? String(Math.round(n)) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    if (s.indexOf('e') >= 0) return (neg ? '-' : '') + s;
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + parts[0] + (parts[1] ? ',' + parts[1] : '');
  }
  function disp(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return fmtNum(v);
    if (typeof v === 'string') return v;
    if (v instanceof XD) return fmtDateTime(v);
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return String(v);
  }
  function isBlank(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === ''); }

  /* ---------------- Làm sạch khóa ---------------- */
  var WS_RE = /[\s\u00a0\u1680\u180e\u2000-\u200d\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]+/g;
  var NUMKEY_RE = /^-?\d+(\.\d+)?$/;
  function rawStr(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (v instanceof XD) return fmtDateTime(v);
    return String(v);
  }
  /* Nhận ngày dù ở dạng ô ngày Excel hay chữ: 03/08/2026, 3/8/2026 08:29:23, 03-08-2026, 2026-08-03T08:29, 03.08.26…
     Chữ dạng a/b/c luôn hiểu là ngày/tháng/năm (kiểu Việt Nam). Trả về "yyyy-mm-dd" hoặc null. */
  var DMY_RE = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4}|\d{2})(?:(?:\s+|T|,\s*)(\d{1,2})[:h](\d{2})(?::(\d{2})(?:[.,]\d+)?)?\s*(AM|PM|SA|CH)?)?$/i;
  var YMD_RE = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:(?:\s+|T)(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?(?:Z|[+\-]\d{2}:?\d{2})?)?$/;
  function dayKey(v) {
    if (v instanceof XD) { var p = serialToParts(Math.floor(v.s + 1e-9)); return p[0] + '-' + p2(p[1]) + '-' + p2(p[2]); }
    if (typeof v !== 'string') return null;
    var t = v.replace(WS_RE, ' ').trim(), m = DMY_RE.exec(t), y, mo, d;
    if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; if (m[3].length === 2) y += 2000; }
    else { m = YMD_RE.exec(t); if (!m) return null; y = +m[1]; mo = +m[2]; d = +m[3]; }
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null;
    return y + '-' + p2(mo) + '-' + p2(d);
  }
  function cleanKey(v, o) {
    if (o.dateOnly) { var dk = dayKey(v); if (dk !== null) return '\u0002d' + dk; }
    var s = rawStr(v);
    if (s === '') return '';
    if (o.trimSpaces) s = s.replace(WS_RE, ' ').trim();
    if (o.normalizeUnicode) s = s.normalize('NFC');
    if (o.caseInsensitive) s = s.toLowerCase();
    if (o.noAccent) s = stripAccKeep(s);
    if (o.phone) {   // 0912 345 678 = +84 912.345.678 = 84912345678 = 912345678 (ô số mất số 0)
      var dg = s.replace(/[\s.\-()]/g, '');
      if (/^\+?\d{9,13}$/.test(dg)) { dg = dg.replace(/^\+/, ''); if (dg.indexOf('84') === 0 && dg.length >= 11) dg = '0' + dg.slice(2); else if (dg.charAt(0) !== '0' && dg.length === 9) dg = '0' + dg; s = dg; }
    }
    if (o.alnumOnly) s = s.replace(ALNUM_RE, '');
    if (o.numericEquivalence && NUMKEY_RE.test(s)) { var n = Number(s); if (isFinite(n)) s = String(n); }
    return s;
  }
  var ALNUM_RE = /[^\p{L}\p{N}]+/gu;
  function stripAccKeep(t) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  var TEXT_CMP = { trimSpaces: true, caseInsensitive: true, normalizeUnicode: true, numericEquivalence: false };
  function toNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (typeof v === 'string') {
      var t = v.trim().replace(/\s/g, '').replace(/,/g, '');
      if (t !== '' && NUMKEY_RE.test(t)) return Number(t);
    }
    return null;
  }
  var ASCII_RE = /^[\x00-\x7f]*$/;
  function stripAcc(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
  function nameSim(a, b) {
    var na = stripAcc(a).replace(/[^a-z0-9]/g, ''), nb = stripAcc(b).replace(/[^a-z0-9]/g, '');
    if (!na || !nb) return 0;
    if (na === nb) return 0.18;
    if (na.length >= 3 && nb.length >= 3 && (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0)) return 0.09;
    return 0;
  }

  /* ---------------- Đọc XLSX nhanh (tự viết, đọc thẳng XML) ---------------- */
  var dec = new TextDecoder('utf-8');
  function unz(buf, names) {
    var want = {}; names.forEach(function (n) { want[n.toLowerCase()] = 1; });
    return fflate.unzipSync(buf, { filter: function (f) { return !!want[f.name.toLowerCase()]; } });
  }
  function getEntry(files, name) {
    var ln = name.toLowerCase();
    for (var k in files) if (k.toLowerCase() === ln) return files[k];
    return null;
  }
  function xmlUnesc(s) {
    if (s.indexOf('&') < 0) return s;
    return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (m, e) {
      if (e === 'amp') return '&'; if (e === 'lt') return '<'; if (e === 'gt') return '>';
      if (e === 'quot') return '"'; if (e === 'apos') return "'";
      if (e[1] === 'x') return String.fromCodePoint(parseInt(e.slice(2), 16));
      return String.fromCodePoint(parseInt(e.slice(1), 10));
    });
  }
  function textRuns(x) { // nối các <t>…</t>, bỏ <rPh> (phiên âm)
    if (x.indexOf('<rPh') >= 0) x = x.replace(/<rPh[\s\S]*?<\/rPh>/g, '');
    var out = '', i = 0;
    while (true) {
      var a = x.indexOf('<t', i); if (a < 0) break;
      var c = x.charCodeAt(a + 2);
      if (c !== 62 && c !== 32 && c !== 47) { i = a + 2; continue; } // <t> hoặc <t xml:space…>
      var gt = x.indexOf('>', a); if (x.charCodeAt(gt - 1) === 47) { i = gt + 1; continue; }
      var e = x.indexOf('</t>', gt); if (e < 0) break;
      out += x.slice(gt + 1, e); i = e + 4;
    }
    return xmlUnesc(out);
  }
  var BUILTIN_DATE = { 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 27: 1, 30: 1, 36: 1, 45: 1, 46: 1, 47: 1, 50: 1, 57: 1 };
  function isDateFmt(code) {
    var c = code.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, '');
    return /[dmyhs]/i.test(c) && !/^[#0.,%\s]*$/.test(c) && !/general/i.test(c);
  }
  function parseStyles(x) {
    var custom = {}, re = /<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g, m;
    while ((m = re.exec(x))) custom[m[1]] = xmlUnesc(m[2]);
    var dates = [];
    var a = x.indexOf('<cellXfs'); if (a < 0) return dates;
    var b = x.indexOf('</cellXfs>', a), sec = x.slice(a, b), r2 = /<xf\b([^>]*)/g, k = 0;
    while ((m = r2.exec(sec))) {
      var id = /numFmtId="(\d+)"/.exec(m[1]); id = id ? +id[1] : 0;
      dates[k++] = !!(BUILTIN_DATE[id] || (custom[id] && isDateFmt(custom[id])));
    }
    return dates;
  }
  function colIdx(ref) { var n = 0; for (var i = 0; i < ref.length; i++) { var c = ref.charCodeAt(i); if (c < 65 || c > 90) break; n = n * 26 + (c - 64); } return n - 1; }

  function parseSheetXml(x, sst, dateStyle, label) {
    var rows = [], i = x.indexOf('<sheetData'), endAll = x.lastIndexOf('</sheetData>');
    if (i < 0) return rows;
    if (endAll < 0) endAll = x.length;
    var total = endAll - i, lastRep = 0, rIdx = -1;
    while (true) {
      var rs = x.indexOf('<row', i); if (rs < 0 || rs > endAll) break;
      var rgt = x.indexOf('>', rs);
      var rattr = x.slice(rs + 4, rgt);
      var rm = / r="(\d+)"/.exec(' ' + rattr);
      rIdx = rm ? (+rm[1] - 1) : rIdx + 1;
      if (x.charCodeAt(rgt - 1) === 47) { i = rgt + 1; continue; } // <row …/>
      var re = x.indexOf('</row>', rgt);
      var row = [], cIdx = -1, j = rgt + 1;
      while (true) {
        var cs = x.indexOf('<c', j); if (cs < 0 || cs > re) break;
        var nc = x.charCodeAt(cs + 2); if (nc !== 32 && nc !== 62 && nc !== 47) { j = cs + 2; continue; }
        var cgt = x.indexOf('>', cs);
        var at = x.slice(cs + 2, cgt);
        var selfClose = x.charCodeAt(cgt - 1) === 47;
        var ri = at.indexOf(' r="');
        if (ri >= 0) { var q = at.indexOf('"', ri + 4); cIdx = colIdx(at.slice(ri + 4, q)); } else cIdx++;
        if (selfClose) { j = cgt + 1; continue; }
        var ce = x.indexOf('</c>', cgt);
        var inner = x.slice(cgt + 1, ce);
        j = ce + 4;
        var ti = at.indexOf(' t="'), t = '';
        if (ti >= 0) t = at.slice(ti + 4, at.indexOf('"', ti + 4));
        var val;
        if (t === 'inlineStr') { val = textRuns(inner); }
        else {
          var vs = inner.indexOf('<v>'), v;
          if (vs < 0) { if (inner.indexOf('<v') >= 0) { var vg = inner.indexOf('>', inner.indexOf('<v')); v = inner.slice(vg + 1, inner.indexOf('</v>')); } else continue; }
          else v = inner.slice(vs + 3, inner.indexOf('</v>', vs));
          if (t === 's') val = sst[+v];
          else if (t === 'str' || t === 'e') val = xmlUnesc(v);
          else if (t === 'b') val = v === '1';
          else if (t === 'd') { var dm = ISO_RE.exec(v); val = dm ? new XD(dateToSerial(+dm[1], +dm[2], +dm[3], +(dm[4] || 0), +(dm[5] || 0), +(dm[6] || 0))) : xmlUnesc(v); }
          else {
            val = +v;
            if (isNaN(val)) val = v;
            else {
              var si = at.indexOf(' s="');
              if (si >= 0 && dateStyle[+at.slice(si + 4, at.indexOf('"', si + 4))] && val > -1 && val < 2958466) val = new XD(val);
            }
          }
        }
        if (val === '' || val === undefined) continue;
        row[cIdx] = val;
      }
      if (row.length) rows[rIdx] = row;
      i = re + 6;
      if (i - lastRep > 4000000) { lastRep = i; progress(label, 15 + Math.round((i - (endAll - total)) / total * 70)); }
    }
    return rows;
  }

  function readXlsxFast(buf) {
    var meta = unz(buf, ['xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/sharedStrings.xml', 'xl/styles.xml', '[Content_Types].xml']);
    var wb = getEntry(meta, 'xl/workbook.xml'); if (!wb) throw new Error('nowb');
    var wbx = dec.decode(wb), rels = getEntry(meta, 'xl/_rels/workbook.xml.rels'), relx = rels ? dec.decode(rels) : '';
    var relMap = {}, m, re = /<Relationship\b([^>]*)\/?>/g;
    while ((m = re.exec(relx))) {
      var id = /Id="([^"]+)"/.exec(m[1]), tg = /Target="([^"]+)"/.exec(m[1]);
      if (id && tg) relMap[id[1]] = tg[1];
    }
    var sheets = [], rs = /<sheet\b([^>]*)\/?>/g;
    while ((m = rs.exec(wbx))) {
      var nm = /name="([^"]*)"/.exec(m[1]), rid = /r:id="([^"]+)"/.exec(m[1]) || /\bid="([^"]+)"/.exec(m[1]);
      var st = /state="([^"]+)"/.exec(m[1]);
      if (!nm || !rid) continue;
      var tgt = relMap[rid[1]] || ''; if (!tgt) continue;
      var path = tgt.charAt(0) === '/' ? tgt.slice(1) : ('xl/' + tgt).replace(/\/\.\//g, '/');
      if (!/worksheet/i.test(path)) continue; // bỏ chart sheet
      sheets.push({ name: xmlUnesc(nm[1]), path: path, hidden: !!(st && st[1] !== 'visible') });
    }
    if (!sheets.length) throw new Error('nosheet');
    var sstE = getEntry(meta, 'xl/sharedStrings.xml'), sst = [];
    if (sstE) {
      var sx = dec.decode(sstE), p = 0;
      while (true) {
        var a = sx.indexOf('<si', p); if (a < 0) break;
        var g = sx.indexOf('>', a);
        if (sx.charCodeAt(g - 1) === 47) { sst.push(''); p = g + 1; continue; }
        var b = sx.indexOf('</si>', g); sst.push(textRuns(sx.slice(g + 1, b))); p = b + 5;
      }
    }
    var stE = getEntry(meta, 'xl/styles.xml');
    var dateStyle = stE ? parseStyles(dec.decode(stE)) : [];
    return {
      sheetNames: sheets.map(function (s) { return s.name; }),
      getRows: function (name) {
        var sh = sheets.filter(function (s) { return s.name === name; })[0];
        progress('Đang giải nén sheet "' + name + '"...', 8);
        var f = unz(buf, [sh.path]), data = getEntry(f, sh.path);
        if (!data) throw FriendlyError('Không tìm thấy dữ liệu của sheet "' + name + '".');
        progress('Đang đọc dữ liệu sheet "' + name + '"...', 12);
        var x = dec.decode(data); data = null;
        return parseSheetXml(x, sst, dateStyle, 'Đang đọc dữ liệu sheet "' + name + '"...');
      }
    };
  }

  /* SheetJS cho .xls, .xlsb, .ods hoặc khi bộ đọc nhanh không đọc được */
  var sheetjsUrls = [];
  function ensureSheetJS() {
    if (typeof XLSX !== 'undefined') return;
    var last;
    for (var i = 0; i < sheetjsUrls.length; i++) {
      try {
        if (typeof importScripts === 'function') importScripts(sheetjsUrls[i]);
        else { var xhr = new XMLHttpRequest(); xhr.open('GET', sheetjsUrls[i], false); xhr.send(); if (xhr.status === 200 || xhr.status === 0) (0, eval)(xhr.responseText); }
        if (typeof XLSX !== 'undefined') return;
      } catch (e) { last = e; }
    }
    throw FriendlyError('Định dạng này (.xls/.xlsb) cần tải thêm bộ đọc từ Internet nhưng chưa tải được. Vui lòng kiểm tra mạng, hoặc mở file bằng Excel rồi lưu lại dạng .xlsx.');
  }
  function readWithSheetJS(buf) {
    progress('Đang nạp bộ đọc định dạng Excel cũ...', 10);
    ensureSheetJS();
    progress('Đang đọc file...', 20);
    var wb = XLSX.read(buf, { type: 'array', cellDates: true });
    return {
      sheetNames: wb.SheetNames.slice(),
      getRows: function (name) {
        var ws = wb.Sheets[name]; if (!ws || !ws['!ref']) return [];
        var range = XLSX.utils.decode_range(ws['!ref']), rows = [];
        for (var r = range.s.r; r <= range.e.r; r++) {
          var row = [];
          for (var c = range.s.c; c <= range.e.c; c++) {
            var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })]; if (!cell || cell.v === undefined || cell.v === null || cell.v === '') continue;
            var v = cell.v;
            if (v instanceof Date) v = new XD(dateToSerial(v.getFullYear(), v.getMonth() + 1, v.getDate(), v.getHours(), v.getMinutes(), v.getSeconds()));
            else if (cell.t === 'e') v = cell.w || '#ERR';
            row[c] = v;
          }
          if (row.length) rows[r] = row;
        }
        return rows;
      }
    };
  }

  /* ---------------- Đọc CSV ---------------- */
  function decodeCsv(buf) {
    var u8 = new Uint8Array(buf);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^\ufeff/, ''); } catch (e) {}
    try { return new TextDecoder('windows-1258').decode(u8); } catch (e) {}
    return new TextDecoder('windows-1252').decode(u8);
  }
  function parseCsv(text) {
    var head = text.slice(0, 20000).split(/\r?\n/).slice(0, 10).join('\n');
    var sep = (head.split(';').length > head.split(',').length) ? ';' : (head.split('\t').length > head.split(',').length ? '\t' : ',');
    var rows = [], row = [], f = '', q = false, i = 0, n = text.length, sc = sep.charCodeAt(0);
    var lastRep = 0;
    while (i < n) {
      var c = text.charCodeAt(i);
      if (q) {
        if (c === 34) { if (text.charCodeAt(i + 1) === 34) { f += '"'; i += 2; continue; } q = false; i++; continue; }
        var nx = text.indexOf('"', i); if (nx < 0) { f += text.slice(i); i = n; break; }
        f += text.slice(i, nx); i = nx; continue;
      }
      if (c === 34 && f === '') { q = true; i++; continue; }
      if (c === sc) { row.push(f === '' ? undefined : f); f = ''; i++; continue; }
      if (c === 10 || c === 13) {
        row.push(f === '' ? undefined : f); f = '';
        rows.push(row); row = [];
        if (c === 13 && text.charCodeAt(i + 1) === 10) i++;
        i++;
        if (i - lastRep > 3000000) { lastRep = i; progress('Đang đọc file CSV...', 15 + Math.round(i / n * 60)); }
        continue;
      }
      var j = i; while (j < n) { var cc = text.charCodeAt(j); if (cc === sc || cc === 10 || cc === 13 || cc === 34) break; j++; }
      if (j === i) { f += text[i]; i++; } else { f += text.slice(i, j); i = j; }
    }
    if (f !== '' || row.length) { row.push(f === '' ? undefined : f); rows.push(row); }
    return rows;
  }
  var DATE_RE = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  var ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/;
  function parseDateStr(s) {
    var m = DATE_RE.exec(s);
    if (m) { var d = +m[1], mo = +m[2]; if (mo > 12 || d > 31 || mo < 1) return null; return dateToSerial(+m[3], mo, d, +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); }
    m = ISO_RE.exec(s);
    if (m) { if (+m[2] > 12) return null; return dateToSerial(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); }
    return null;
  }
  function coerceCsvColumns(data, nCols) {
    for (var c = 0; c < nCols; c++) {
      var vals = 0, lead0 = false, allNum = true, nDate = 0;
      for (var r = 0; r < data.length; r++) {
        var v = data[r][c]; if (v === undefined) continue;
        var t = String(v).trim(); if (t === '') continue;
        vals++;
        if (/^0\d/.test(t)) lead0 = true;
        if (allNum && !NUMKEY_RE.test(t.replace(/,/g, ''))) allNum = false;
        if (parseDateStr(t) !== null) nDate++;
      }
      if (!vals) continue;
      if (nDate / vals >= 0.95) { for (r = 0; r < data.length; r++) { v = data[r][c]; if (v !== undefined) { var sd = parseDateStr(String(v).trim()); if (sd !== null) data[r][c] = new XD(sd); } } continue; }
      if (lead0) continue;   // mã có số 0 ở đầu (0012, số điện thoại) → giữ dạng chữ
      if (allNum) { for (r = 0; r < data.length; r++) { v = data[r][c]; if (v !== undefined && String(v).trim() !== '') data[r][c] = Number(String(v).trim().replace(/,/g, '')); } }
      else if (nDate / vals >= 0.95) { for (r = 0; r < data.length; r++) { v = data[r][c]; if (v !== undefined) { var s = parseDateStr(String(v).trim()); if (s !== null) data[r][c] = new XD(s); } } }
    }
  }

  /* ---------------- Trạng thái ---------------- */
  var S = { A: null, B: null, last: null, keyCache: {} };

  function readerFor(buf, name) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      progress('Đang đọc file CSV...', 10);
      var rows = parseCsv(decodeCsv(buf));
      return { kind: 'csv', sheetNames: ['Sheet1'], getRows: function () { return rows; } };
    }
    if (ext === 'xlsx' || ext === 'xlsm') {
      try { var r = readXlsxFast(new Uint8Array(buf)); r.kind = 'excel'; return r; }
      catch (e) { if (e.friendly) throw e; }
      var r2 = readWithSheetJS(buf); r2.kind = 'excel'; return r2;
    }
    if (ext === 'xls' || ext === 'xlsb' || ext === 'ods') { var r3 = readWithSheetJS(buf); r3.kind = 'excel'; return r3; }
    throw FriendlyError('Định dạng file "' + name + '" chưa được hỗ trợ. Vui lòng dùng .xlsx, .xls hoặc .csv.');
  }

  function loadFileBuffer(slot, name, buf) {
    if (slot !== 'A' && slot !== 'B') throw FriendlyError('Vị trí file không hợp lệ.');
    progress('Đang mở file...', 5);
    var rd;
    try { rd = readerFor(buf, name); }
    catch (e) {
      if (e.friendly) throw e;
      throw FriendlyError('Không đọc được file "' + name + '". File có thể bị hỏng, có mật khẩu hoặc không đúng định dạng Excel.');
    }
    S[slot] = { fileName: name, kind: rd.kind, reader: rd, sheetNames: rd.sheetNames, raw: {}, sheetName: null };
    S.last = null; S.keyCache = {};
    return { sheetNames: rd.sheetNames, fileName: name };
  }

  function rawRows(st, sheet) {
    if (!st.raw[sheet]) {
      st.raw = {}; // chỉ giữ 1 sheet trong bộ nhớ
      var rows = st.reader.getRows(sheet);
      st.raw[sheet] = rows;
    }
    return st.raw[sheet];
  }

  function detectHeader(rows) {
    var best = 0, bestScore = -1;
    for (var r = 0; r < Math.min(rows.length, 30); r++) {
      var row = rows[r], sc = 0;
      if (row) for (var c = 0; c < row.length; c++) { var v = row[c]; if (typeof v === 'string' && v.trim() !== '') sc++; }
      if (sc > bestScore) { bestScore = sc; best = r; }
    }
    return best;
  }

  function dedupeCols(vals, width) {
    var seen = {}, out = [];
    for (var i = 0; i < width; i++) {
      var v = vals[i], base = (v === undefined || v === null || String(v).trim() === '') ? ('Cột ' + (i + 1)) : (v instanceof XD ? fmtDate(v) : String(v).replace(/\s+/g, ' ').trim());
      var cnt = seen[base] || 0, name = cnt === 0 ? base : base + ' (' + (cnt + 1) + ')';
      seen[base] = cnt + 1; out.push(name);
    }
    return out;
  }

  /* Nhận diện dòng tổng cộng / chữ ký (nâng cấp) */
  var TOTAL_RE = /^(tổng\s*cộng|cộng(?!\s*hòa)(\s+(phát\s*sinh|tháng|quý|năm|trang|chuyển\s*sang|lũy\s*kế|luỹ\s*kế|số\s*phát\s*sinh))?|tổng\s*số|tổng\s*cộng\s*tiền|total|grand\s*total|sub\s*total|subtotal|số\s*dư\s*(đầu|cuối)(\s*kỳ)?|dư\s*(đầu|cuối)\s*kỳ|phát\s*sinh\s*trong\s*kỳ|tài\s*khoản\s*:?\s*\d+\s*$|tài\s*khoản(\s*ngân\s*hàng)?\s*:\s*\d+)/i;
  var SIGN_RE = /^(người\s*(ghi\s*sổ|lập(\s*biểu|\s*phiếu)?|nhận|giao|duyệt)|kế\s*toán\s*trưởng|giám\s*đốc|thủ\s*trưởng|thủ\s*quỹ|thủ\s*kho|\(ký|\(\s*ký|ngày\s*\.{0,}\s*\d{0,2}\s*tháng|ngày\s+\d{1,2}\s+tháng|số\s*này\s*có|sổ\s*này\s*có|đã\s*ký|ký,\s*họ\s*tên|lập\s*,?\s*ngày)/i;
  function rowKind(row, tail) {
    var first = null, nFill = 0;
    for (var c = 0; c < row.length; c++) {
      var v = row[c]; if (isBlank(v)) continue; nFill++;
      if (first === null) first = v;
    }
    if (typeof first === 'string') {
      var t = first.replace(WS_RE, ' ').trim().normalize('NFC');
      if (t.length <= 90 && TOTAL_RE.test(t)) return { kind: 'total', text: t };
      if (t.length <= 80 && SIGN_RE.test(t)) return { kind: 'sign', text: t };
    }
    if (!tail) return null;
    for (c = 0; c < row.length; c++) { // dòng chữ ký: ô chữ ở giữa dòng
      var w = row[c]; if (typeof w !== 'string') continue;
      var u = w.replace(WS_RE, ' ').trim().normalize('NFC');
      if (u && u.length <= 60 && SIGN_RE.test(u)) return { kind: 'sign', text: u };
    }
    return null;
  }

  function sliceData(st, headerRow, skipFooter) {
    var rows = st.raw[st.sheetName];
    var header = rows[headerRow] || [];
    var data = [], rowNums = [], width = header.length;
    for (var r = headerRow + 1; r < rows.length; r++) {
      var row = rows[r]; if (!row) continue;
      var blank = true;
      for (var c = 0; c < row.length; c++) if (!isBlank(row[c])) { blank = false; break; }
      if (blank) continue;
      data.push(row); rowNums.push(r + 1);
      if (row.length > width) width = row.length;
    }
    // đếm số ô có dữ liệu điển hình
    var removed = [];
    if (skipFooter && data.length) {
      var keep = [], keepNums = [];
      // 1) dòng tổng cộng ở bất kỳ đâu; 2) khối chữ ký/ghi chú ở cuối
      var fills = [];
      for (var i = 0; i < data.length; i += Math.max(1, Math.floor(data.length / 500))) {
        var f = 0, rr = data[i]; for (var k = 0; k < rr.length; k++) if (!isBlank(rr[k])) f++; fills.push(f);
      }
      fills.sort(function (a, b) { return a - b; });
      var med = fills[Math.floor(fills.length / 2)] || 1;
      var tailStart = data.length;
      for (i = data.length - 1; i >= 0 && data.length - i <= 30; i--) {
        var rk = rowKind(data[i], true), ff = 0; for (k = 0; k < data[i].length; k++) if (!isBlank(data[i][k])) ff++;
        if (rk || ff <= Math.max(2, Math.floor(med * 0.3))) tailStart = i; else break;
      }
      var tailHasMark = false;
      for (i = tailStart; i < data.length; i++) if (rowKind(data[i], true)) { tailHasMark = true; break; }
      if (!tailHasMark) tailStart = data.length;
      for (i = 0; i < data.length; i++) {
        var kd = rowKind(data[i], i >= tailStart);
        if (i >= tailStart || (kd && kd.kind === 'total')) {
          var txt = kd ? kd.text : (function (row) { for (var q = 0; q < row.length; q++) if (!isBlank(row[q])) return disp(row[q]); return ''; })(data[i]);
          removed.push({ row: rowNums[i], text: txt.length > 50 ? txt.slice(0, 50) + '…' : txt });
        } else { keep.push(data[i]); keepNums.push(rowNums[i]); }
      }
      data = keep; rowNums = keepNums;
    }
    var columns = dedupeCols(header, width);
    if (st.kind === 'csv') coerceCsvColumns(data, width);
    // dòng người dùng bỏ tick ở bảng xem trước (theo số dòng Excel)
    st.cand = data; st.candNums = rowNums;
    var ex = st.exclude && st.exclude.size ? st.exclude : null;
    if (ex) { var kept = []; for (var e2 = 0; e2 < data.length; e2++) if (!ex.has(rowNums[e2])) kept.push(data[e2]); data = kept; }
    var types = [];
    for (var c2 = 0; c2 < width; c2++) {
      var n = 0, nNum = 0, nDate = 0;
      for (var r2 = 0; r2 < data.length && n < 300; r2++) {
        var v2 = data[r2][c2]; if (isBlank(v2)) continue; n++;
        if (v2 instanceof XD) nDate++; else if (typeof v2 === 'number') nNum++;
      }
      types.push(!n ? 'text' : (nDate / n > 0.5 ? 'date' : (nNum / n > 0.5 ? 'number' : 'text')));
    }
    // P1.3 Gộp dòng theo khóa: các dòng cùng giá trị ở cột gộp → 1 dòng; cột số được cộng, cột khác lấy giá trị dòng đầu
    st.grouped = null;
    var gcols = (st.groupBy || []).filter(function (c) { return columns.indexOf(c) >= 0; });
    if (gcols.length && data.length) {
      var gi = gcols.map(function (c) { return columns.indexOf(c); }), map = new Map(), out = [], cnt = [];
      var sumIdx = []; for (var c3 = 0; c3 < width; c3++) if (types[c3] === 'number' && gi.indexOf(c3) < 0) sumIdx.push(c3);
      for (var r3 = 0; r3 < data.length; r3++) {
        var row3 = data[r3], parts = [], allE = true;
        for (var k3 = 0; k3 < gi.length; k3++) { var pk = cleanKey(row3[gi[k3]], TEXT_CMP); if (pk !== '') allE = false; parts.push(pk); }
        var key3 = allE ? '\u0005' + r3 : parts.join('\u0001');
        var at = map.get(key3);
        if (at === undefined) { map.set(key3, out.length); var cp = row3.slice(); cp.length = Math.max(cp.length, width); out.push(cp); cnt.push(1); }
        else {
          var tgt = out[at]; cnt[at]++;
          for (var z = 0; z < sumIdx.length; z++) { var ci = sumIdx[z], a3 = toNum(tgt[ci]), b3 = toNum(row3[ci]); if (b3 !== null) tgt[ci] = Math.round(((a3 || 0) + b3) * 1e6) / 1e6; }
        }
      }
      var cntName = 'Số dòng gộp'; while (columns.indexOf(cntName) >= 0) cntName += ' (2)';
      for (var o3 = 0; o3 < out.length; o3++) out[o3][width] = cnt[o3];
      st.grouped = { cols: gcols, from: data.length, to: out.length, summed: sumIdx.map(function (i) { return columns[i]; }) };
      columns = columns.concat([cntName]); types = types.concat(['number']); data = out;
    }
    st.headerRow = headerRow; st.columns = columns; st.colTypes = types; st.data = data; st.removed = removed;
  }

  function sheetInfo(slot) {
    var st = S[slot];
    var preview = st.data.slice(0, 5).map(function (row) { var o = {}; st.columns.forEach(function (c, i) { o[c] = disp(row[i]); }); return o; });
    // bảng chọn dòng: N dòng đầu + 3 dòng cuối, kèm số dòng Excel và trạng thái tick
    var cand = st.cand || [], nums = st.candNums || [], head = Math.min(cand.length, st.previewHead || 12), rowsOut = [];
    function pr(i) { return { n: nums[i], on: !(st.exclude && st.exclude.has(nums[i])), cells: (st.grouped ? st.columns.slice(0, -1) : st.columns).map(function (c, k) { return disp(cand[i][k]); }) }; }
    for (var i = 0; i < head; i++) rowsOut.push(pr(i));
    var tailFrom = Math.max(head, cand.length - 3), gap = tailFrom - head;
    for (i = tailFrom; i < cand.length; i++) rowsOut.push(pr(i));
    return {
      fileName: st.fileName, sheetNames: st.sheetNames, sheetName: st.sheetName,
      headerRow: st.headerRow, headerRowDisplay: st.headerRow + 1, autoDetectedHeaderRow: !!st.autoDetected,
      columns: st.columns, colTypes: st.colTypes, colCount: st.columns.length, rowCount: st.data.length,
      preview: preview, skipFooter: st.skipFooter, removedRows: st.removed,
      grouped: st.grouped, groupBy: st.groupBy || [], baseColumns: st.grouped ? st.columns.slice(0, -1) : st.columns,
      pickRows: rowsOut, pickGap: gap, pickHeadEnd: head, candCount: cand.length, excluded: st.exclude ? Array.from(st.exclude) : []
    };
  }

  function loadSheet(slot, sheetName, headerRow, opts) {
    var st = S[slot]; if (!st) throw FriendlyError('Chưa tải file cho vị trí ' + slot + '.');
    if (st.sheetNames.indexOf(sheetName) < 0) throw FriendlyError('Sheet "' + sheetName + '" không có trong file.');
    var rows = rawRows(st, sheetName);
    if (!rows.length) throw FriendlyError('Sheet "' + sheetName + '" không có dữ liệu.');
    st.sheetName = sheetName;
    var auto = headerRow === null || headerRow === undefined;
    var h = auto ? detectHeader(rows) : Math.max(0, Math.min(+headerRow, rows.length - 1));
    st.autoDetected = auto;
    st.skipFooter = !(opts && opts.skipFooter === false);
    st.exclude = new Set((opts && opts.excludeRows) || []);
    st.previewHead = Math.max(12, Math.min(2000, (opts && opts.previewHead) || 12));
    st.groupBy = (opts && opts.groupBy) || [];
    progress('Đang tách dòng dữ liệu...', 90);
    sliceData(st, h, st.skipFooter);
    S.last = null; S.keyCache = {};
    return sheetInfo(slot);
  }

  function require2() {
    if (!S.A || !S.A.data) throw FriendlyError('Chưa tải dữ liệu cho File A.');
    if (!S.B || !S.B.data) throw FriendlyError('Chưa tải dữ liệu cho File B.');
  }
  function colIndex(st, name) {
    var i = st.columns.indexOf(name);
    if (i < 0) throw FriendlyError('Không tìm thấy cột "' + name + '" trong ' + st.fileName + '.');
    return i;
  }

  /* Khóa ghép: mảng chuỗi, null = khóa trống (không bao giờ khớp) */
  function buildKeys(slot, cols, clean) {
    var ck = slot + '|' + cols.join('\u0001') + '|' + JSON.stringify(clean);
    if (S.keyCache[ck]) return S.keyCache[ck];
    var st = S[slot], idx = cols.map(function (c) { return colIndex(st, c); });
    var n = st.data.length, keys = new Array(n), empty = 0;
    for (var r = 0; r < n; r++) {
      var row = st.data[r], k;
      if (idx.length === 1) k = cleanKey(row[idx[0]], clean);
      else { var parts = [], allE = true; for (var j = 0; j < idx.length; j++) { var p = cleanKey(row[idx[j]], clean); if (p !== '') allE = false; parts.push(p); } k = allE ? '' : parts.join('\u0001'); }
      if (k === '') { keys[r] = null; empty++; } else keys[r] = k;
    }
    var res = { keys: keys, empty: empty };
    S.keyCache[ck] = res;
    return res;
  }

  /* ---------------- Bộ so khớp: nhóm điều kiện BẮT BUỘC (khớp tất cả) + nhóm THAY THẾ (khớp ít nhất 1 cặp) ----------------
     - Bắt buộc: các cặp cột phải bằng nhau đồng thời (như trước).
     - Thay thế (HOẶC): chỉ cần 1 cặp bằng nhau. Ô trống hoặc số 0 không tính là khớp
       (VD sao kê: Số tiền gửi vào = Phát sinh Nợ HOẶC Số tiền rút ra = Phát sinh Có).
     - Chế độ khi trùng: first (lấy dòng đầu), all (lấy hết), one (ghép 1–1, mỗi dòng chỉ dùng 1 lần, theo thứ tự). */
  function orVal(v, clean) {
    if (v === null || v === undefined) return null;
    var n = toNum(v);
    if (n !== null) return n === 0 ? null : '\u0003' + (Math.round(n * 100) / 100);
    var k = cleanKey(v, clean);
    return k === '' || k === '0' ? null : k;
  }
  function buildOr(slot, col, clean) {
    var ck = 'or|' + slot + '|' + col + '|' + JSON.stringify(clean);
    if (S.keyCache[ck]) return S.keyCache[ck];
    var st = S[slot], ci = colIndex(st, col), n = st.data.length, out = new Array(n);
    for (var r = 0; r < n; r++) out[r] = orVal(st.data[r][ci], clean);
    S.keyCache[ck] = out;
    return out;
  }
  function validPairs(list, ka, kb) { return (list || []).filter(function (p) { return p && p[ka] && p[kb]; }); }
  function Matcher(cfg) {
    var req = validPairs(cfg.keyPairs, 'a', 'b'), ors = validPairs(cfg.orPairs, 'a', 'b');
    if (!req.length && !ors.length) throw FriendlyError('Chưa chọn cột khóa.');
    var clean = cfg.clean || {};
    var reqK = {
      A: req.length ? buildKeys('A', req.map(function (p) { return p.a; }), clean).keys : null,
      B: req.length ? buildKeys('B', req.map(function (p) { return p.b; }), clean).keys : null
    };
    var orK = { A: ors.map(function (p) { return buildOr('A', p.a, clean); }), B: ors.map(function (p) { return buildOr('B', p.b, clean); }) };
    var nRows = { A: S.A.data.length, B: S.B.data.length };
    function rk(side, r) { return reqK[side] ? reqK[side][r] : ''; }
    var maps = {};
    function mapsFor(side) { // chỉ mục của bên được tra cứu
      if (maps[side]) return maps[side];
      var list = [], n = nRows[side], m, r, k, e;
      if (!ors.length) {
        m = new Map();
        for (r = 0; r < n; r++) { k = rk(side, r); if (k === null) continue; e = m.get(k); if (e === undefined) m.set(k, [r]); else e.push(r); }
        list.push(m);
      } else {
        for (var q = 0; q < ors.length; q++) {
          m = new Map(); var ov = orK[side][q];
          for (r = 0; r < n; r++) { k = rk(side, r); if (k === null || ov[r] === null) continue; k = k + '\u0004' + ov[r]; e = m.get(k); if (e === undefined) m.set(k, [r]); else e.push(r); }
          list.push(m);
        }
      }
      return (maps[side] = list);
    }
    var lastPair = [];
    // danh sách dòng bên kia khớp với dòng r của bên base (theo thứ tự cặp, không trùng); lastPair[i] = cặp HOẶC đã khớp
    function cands(base, r) {
      var other = base === 'A' ? 'B' : 'A', ms = mapsFor(other), k = rk(base, r);
      lastPair.length = 0;
      if (k === null) return null;
      if (!ors.length) { var hit = ms[0].get(k); if (hit) for (var i = 0; i < hit.length; i++) lastPair[i] = -1; return hit || null; }
      var out = null, seen = null;
      for (var q = 0; q < ors.length; q++) {
        var ov = orK[base][q][r]; if (ov === null) continue;
        var h = ms[q].get(k + '\u0004' + ov); if (!h) continue;
        if (!out) { out = h.slice(); for (var x = 0; x < h.length; x++) lastPair[x] = q; if (ors.length > 1) { seen = new Set(h); } continue; }
        for (var y = 0; y < h.length; y++) if (!seen.has(h[y])) { seen.add(h[y]); lastPair[out.length] = q; out.push(h[y]); }
      }
      return out;
    }
    // chạy ghép từ 1 bên: cb(baseRow, otherRow|-1, pairIdx) ; trả về cờ dòng bên kia đã được khớp
    /* Dung sai số tiền (P1.1): áp cho cặp thay thế dạng số; nếu không có cặp thay thế thì cho cặp bắt buộc dạng số đầu tiên.
       Thứ tự: khớp chính xác hết trước, rồi mới ghép các dòng còn lại theo dung sai (chênh nhỏ nhất). */
    var tolCfg = cfg.amountTol || {}, tolAbs = Math.abs(+tolCfg.abs || 0), tolPct = Math.abs(+tolCfg.pct || 0);
    var tolOn = tolAbs > 0 || tolPct > 0, tolPairs = [], tolReqKeys = null;
    function numCol(side, col) { var st0 = S[side], i = st0.columns.indexOf(col); return i >= 0 && st0.colTypes[i] === 'number'; }
    if (tolOn) {
      if (ors.length) ors.forEach(function (p, q) { if (numCol('A', p.a) && numCol('B', p.b)) tolPairs.push({ q: q, a: p.a, b: p.b, label: p.a + ' = ' + p.b }); });
      else {
        var ri = -1; for (var x0 = 0; x0 < req.length; x0++) if (numCol('A', req[x0].a) && numCol('B', req[x0].b)) { ri = x0; break; }
        if (ri >= 0) {
          var restReq = req.filter(function (_, i) { return i !== ri; });
          tolReqKeys = {
            A: restReq.length ? buildKeys('A', restReq.map(function (p) { return p.a; }), clean).keys : null,
            B: restReq.length ? buildKeys('B', restReq.map(function (p) { return p.b; }), clean).keys : null
          };
          tolPairs.push({ q: -1, a: req[ri].a, b: req[ri].b, label: req[ri].a + ' = ' + req[ri].b });
        }
      }
    }
    function tolGroupKey(side, r) { if (tolReqKeys) return tolReqKeys[side] ? tolReqKeys[side][r] : ''; return rk(side, r); }
    function tolOf(v) { return Math.max(tolAbs, Math.abs(v) * tolPct / 100) + 1e-9; }
    // chạy ghép từ 1 bên: cb(baseRow, otherRow|-1, pairIdx, chênhDungSai) ; trả về cờ dòng bên kia đã được khớp
    function run(base, mode, cb) {
      var other = base === 'A' ? 'B' : 'A', n = nRows[base], hit = new Uint8Array(nRows[other]), used = mode === 'one' ? hit : null;
      var res = new Array(n);   // kết quả từng dòng: null = chưa khớp
      for (var r = 0; r < n; r++) {
        var c = cands(base, r);
        if (!c || !c.length) { res[r] = null; continue; }
        if (mode === 'one') {
          var got = -1, gp = -1;
          for (var i = 0; i < c.length; i++) if (!used[c[i]]) { got = c[i]; gp = lastPair[i]; break; }
          if (got < 0) { res[r] = null; continue; }
          used[got] = 1; res[r] = [got, gp];
        } else {
          for (var j = 0; j < c.length; j++) hit[c[j]] = 1;
          if (mode === 'all') { var arr = []; for (var j2 = 0; j2 < c.length; j2++) arr.push(c[j2], lastPair[j2]); res[r] = arr; }
          else res[r] = [c[0], lastPair[0]];
        }
      }
      var tolRes = null;
      if (tolPairs.length) {
        tolRes = {};
        var stB = S[other], stA = S[base];
        tolPairs.forEach(function (tp) {
          var colO = stB.columns.indexOf(base === 'A' ? tp.b : tp.a), colBs = stA.columns.indexOf(base === 'A' ? tp.a : tp.b);
          var groups = new Map();
          for (var j = 0; j < nRows[other]; j++) {
            if (hit[j]) continue;
            var gk = tolGroupKey(other, j); if (gk === null) continue;
            var v = toNum(stB.data[j][colO]); if (v === null || v === 0) continue;
            var g = groups.get(gk); if (!g) groups.set(gk, g = []); g.push([v, j]);
          }
          groups.forEach(function (g) { g.sort(function (a, b) { return a[0] - b[0]; }); });
          for (var r2 = 0; r2 < n; r2++) {
            if (res[r2] || tolRes[r2]) continue;
            var gk2 = tolGroupKey(base, r2); if (gk2 === null) continue;
            var g2 = groups.get(gk2); if (!g2) continue;
            var v2 = toNum(stA.data[r2][colBs]); if (v2 === null || v2 === 0) continue;
            var t = tolOf(v2), lo = 0, hi = g2.length;
            while (lo < hi) { var mid = (lo + hi) >> 1; if (g2[mid][0] < v2 - t) lo = mid + 1; else hi = mid; }
            var best = -1, bestD = Infinity;
            for (var k = lo; k < g2.length && g2[k][0] <= v2 + t; k++) {
              var jj = g2[k][1]; if (hit[jj]) continue;
              var d = Math.abs(g2[k][0] - v2); if (d < bestD) { bestD = d; best = jj; }
            }
            if (best >= 0) { hit[best] = 1; var vO = toNum(stB.data[best][colO]); tolRes[r2] = [best, tp.q, base === 'A' ? v2 - vO : vO - v2, tp.label]; /* chênh luôn tính A − B */ }
          }
        });
      }
      for (var r3 = 0; r3 < n; r3++) {
        var rr = res[r3];
        if (rr) { for (var z = 0; z < rr.length; z += 2) cb(r3, rr[z], rr[z + 1]); }
        else if (tolRes && tolRes[r3]) cb(r3, tolRes[r3][0], tolRes[r3][1], { diff: Math.round(tolRes[r3][2] * 100) / 100, label: tolRes[r3][3] });
        else cb(r3, -1, -1);
      }
      return hit;
    }
    function compositeKeys(side) { // khóa gộp để thống kê trùng: bắt buộc + các giá trị HOẶC
      var n = nRows[side], out = new Array(n);
      for (var r = 0; r < n; r++) {
        var k = rk(side, r); if (k === null) { out[r] = null; continue; }
        if (!ors.length) { out[r] = k; continue; }
        var parts = [k], any = false;
        for (var q = 0; q < ors.length; q++) { var v = orK[side][q][r]; if (v !== null) any = true; parts.push(v === null ? '' : v); }
        out[r] = any ? parts.join('\u0004') : null;
      }
      return out;
    }
    return { req: req, ors: ors, run: run, cands: cands, rk: rk, compositeKeys: compositeKeys,
      orLabel: function (q) { return q < 0 ? '' : ors[q].a + ' = ' + ors[q].b; } };
  }

  /* ---------------- Gợi ý cặp điều kiện thay thế (HOẶC) ----------------
     Với điều kiện bắt buộc đã chọn, thử từng cặp cột: mỗi cặp khớp được bao nhiêu dòng của File A.
     Chọn dần cặp làm tăng số dòng khớp nhiều nhất (các cặp bổ sung cho nhau, VD Gửi vào = Nợ, Rút ra = Có). */
  function suggestOrPairs(cfg) {
    require2();
    var A = S.A, B = S.B, clean = cfg.clean || {};
    var req = validPairs(cfg.keyPairs, 'a', 'b'), already = validPairs(cfg.orPairs, 'a', 'b');
    var reqA = req.length ? buildKeys('A', req.map(function (p) { return p.a; }), clean).keys : null;
    var reqB = req.length ? buildKeys('B', req.map(function (p) { return p.b; }), clean).keys : null;
    var usedA = {}, usedB = {};
    req.concat(already).forEach(function (p) { usedA[p.a] = 1; usedB[p.b] = 1; });
    var nA = Math.min(A.data.length, 5000), nB = Math.min(B.data.length, 40000);
    var rowsA = []; for (var r = 0; r < nA; r++) if (!reqA || reqA[r] !== null) rowsA.push(r);
    if (rowsA.length < 3) return [];
    progress('Đang dò các cặp cột bổ sung cho nhau...', 15);
    var cand = [], aCols = A.columns.filter(function (c, i) { return !usedA[c] && A.colTypes[i] !== 'date'; }), bCols = B.columns.filter(function (c, i) { return !usedB[c] && B.colTypes[i] !== 'date'; });
    var orAcache = {};
    function orA(c) { if (!orAcache[c]) orAcache[c] = buildOr('A', c, clean); return orAcache[c]; }
    // cặp đã có trong nhóm HOẶC: tính sẵn các dòng đã khớp
    var base = new Uint8Array(A.data.length);
    if (already.length) {
      already.forEach(function (p) {
        var ob = buildOr('B', p.b, clean), oa = orA(p.a), set = new Set();
        for (var j = 0; j < nB; j++) { var kb = reqB ? reqB[j] : ''; if (kb === null || ob[j] === null) continue; set.add(kb + '\u0004' + ob[j]); }
        rowsA.forEach(function (r) { var k = reqA ? reqA[r] : ''; if (oa[r] !== null && set.has(k + '\u0004' + oa[r])) base[r] = 1; });
      });
    }
    var step = 0, total = bCols.length;
    bCols.forEach(function (cb) {
      step++; if (step % 3 === 0) progress('Đang dò các cặp cột bổ sung cho nhau...', 15 + Math.round(step / total * 70));
      var ob = buildOr('B', cb, clean), set = new Set(), filledB = 0, distinct = new Set();
      for (var j = 0; j < nB; j++) { var kb = reqB ? reqB[j] : ''; if (kb === null || ob[j] === null) continue; filledB++; set.add(kb + '\u0004' + ob[j]); if (distinct.size < 30) distinct.add(ob[j]); }
      if (filledB < 3 || distinct.size < 3) return;            // cột trống hoặc gần như hằng số
      aCols.forEach(function (ca) {
        var oa = orA(ca), filled = 0, hits = [];
        for (var t = 0; t < rowsA.length; t++) {
          var r = rowsA[t]; if (oa[r] === null) continue; filled++;
          var k = reqA ? reqA[r] : '';
          if (set.has(k + '\u0004' + oa[r])) hits.push(r);
        }
        if (filled < 3 || hits.length < Math.max(3, rowsA.length * 0.03)) return;
        var prec = hits.length / filled;                          // trong các dòng có giá trị, bao nhiêu % tìm được dòng khớp
        if (prec < 0.3) return;
        cand.push({ aCol: ca, bCol: cb, hits: hits, prec: prec, bonus: nameSim(ca, cb) });
      });
    });
    progress('Đang chọn tổ hợp tốt nhất...', 90);
    var covered = base.slice(), out = [], doneA = {}, doneB = {}, already0 = 0;
    rowsA.forEach(function (r) { if (covered[r]) already0++; });
    var cum = already0;
    for (var round = 0; round < 6; round++) {
      var best = null, bestGain = 0;
      cand.forEach(function (c) {
        if (doneA[c.aCol] || doneB[c.bCol]) return;
        var g = 0; for (var i = 0; i < c.hits.length; i++) if (!covered[c.hits[i]]) g++;
        var score = g * (0.5 + 0.5 * c.prec) * (1 + c.bonus);
        if (score > bestGain) { bestGain = score; best = c; best._g = g; }
      });
      if (!best || best._g < Math.max(2, rowsA.length * 0.02)) break;
      best.hits.forEach(function (r) { covered[r] = 1; });
      doneA[best.aCol] = doneB[best.bCol] = 1;
      cum += best._g;
      out.push({ colA: best.aCol, colB: best.bCol, alone: Math.round(best.hits.length / rowsA.length * 1000) / 1000, gain: Math.round(best._g / rowsA.length * 1000) / 1000, cumulative: Math.round(cum / rowsA.length * 1000) / 1000, precision: Math.round(best.prec * 1000) / 1000 });
    }
    return { pairs: out, sampleRows: rowsA.length, before: Math.round(already0 / rowsA.length * 1000) / 1000 };
  }

  /* ---------------- Gợi ý cột khóa ---------------- */
  function suggestKeys(clean) {
    var KC = { trimSpaces: true, caseInsensitive: true, normalizeUnicode: true, numericEquivalence: false, dateOnly: !(clean && clean.dateOnly === false) };
    require2();
    progress('Đang phân tích các cột...', 15);
    var A = S.A, B = S.B;
    function sets(st) {
      return st.columns.map(function (c, ci) {
        var s = new Set(), lim = Math.min(st.data.length, 5000);
        var cnt = 0;
        var nDay = 0;
        for (var r = 0; r < lim; r++) { var k = cleanKey(st.data[r][ci], KC); if (k !== '') { s.add(k); cnt++; if (k.charCodeAt(0) === 2) nDay++; } }
        s.isDate = cnt > 0 && nDay / cnt >= 0.8;
        s.uniq = cnt ? s.size / cnt : 0;
        return s;
      });
    }
    var sa = sets(A); progress('Đang phân tích các cột...', 45);
    var sb = sets(B); progress('Đang so khớp các cặp cột...', 65);
    var out = [];
    A.columns.forEach(function (ca, i) {
      if (!sa[i].size) return;
      B.columns.forEach(function (cb, j) {
        if (!sb[j].size) return;
        var small = sa[i].size <= sb[j].size ? sa[i] : sb[j], big = small === sa[i] ? sb[j] : sa[i], inter = 0;
        small.forEach(function (v) { if (big.has(v)) inter++; });
        var overlap = inter / small.size, bonus = nameSim(ca, cb);
        // khóa tốt thường có nhiều giá trị khác nhau
        var distinctness = Math.min(1, Math.min(sa[i].size, sb[j].size) / 50);
        var uniq = Math.max(sa[i].uniq, sb[j].uniq);   // cột khóa tốt: giá trị ít lặp lại
        var ta = A.colTypes[i], tb = B.colTypes[j];
        var typeF = (ta === 'number' && tb === 'number') ? 0.55 : ((ta === 'date' || tb === 'date') ? 0.4 : 1); // số tiền, ngày ít khi là khóa
        if (!bonus) { var na2 = stripAcc(ca).replace(/[^a-z0-9]/g, '').replace(/^(ma|so|id|code)/, ''), nb2 = stripAcc(cb).replace(/[^a-z0-9]/g, '').replace(/^(ma|so|id|code)/, ''); if (na2.length >= 4 && na2 === nb2) bonus = 0.12; }
        var score = Math.min(1, overlap * 0.85 + bonus) * (0.6 + 0.4 * distinctness) * (0.35 + 0.65 * uniq) * typeF;
        var smallN = Math.min(sa[i].size, sb[j].size);
        if (smallN < 10 && !bonus) return;            // cột chỉ có vài giá trị (vd TK Nợ 131) không dùng làm khóa
        if (score < 0.3) return;
        if (overlap > 0.05 || bonus > 0) out.push({ colA: ca, colB: cb, matchRatio: Math.round(overlap * 1000) / 1000, score: score, nameSimilar: bonus > 0 });
      });
    });
    // cặp ngày (Ngày giao dịch ⇄ Ngày hạch toán…): luôn đưa cặp ngày tốt nhất vào gợi ý – hay dùng làm điều kiện bắt buộc khi đối chiếu sao kê, sổ quỹ
    var bestDate = null;
    A.columns.forEach(function (ca, i) {
      if (!sa[i].isDate) return;
      B.columns.forEach(function (cb, j) {
        if (!sb[j].isDate) return;
        var small = sa[i].size <= sb[j].size ? sa[i] : sb[j], big = small === sa[i] ? sb[j] : sa[i], inter = 0;
        small.forEach(function (v) { if (big.has(v)) inter++; });
        var ov = small.size ? inter / small.size : 0, PRI = /giao\s*dịch|hạch\s*toán/i, sc = ov + nameSim(ca, cb) + (PRI.test(ca) ? 0.05 : 0) + (PRI.test(cb) ? 0.05 : 0);
        if (ov >= 0.5 && (!bestDate || sc > bestDate.score)) bestDate = { colA: ca, colB: cb, matchRatio: Math.round(ov * 1000) / 1000, score: sc, nameSimilar: nameSim(ca, cb) > 0, isDate: true };
      });
    });
    out = out.filter(function (o) { return !(bestDate && o.colA === bestDate.colA && o.colB === bestDate.colB); });
    out.sort(function (a, b) { return b.score - a.score; });
    out = out.slice(0, bestDate ? 5 : 6);
    if (bestDate) { var pos = 0; while (pos < out.length && out[pos].score >= 0.8) pos++; out.splice(pos, 0, bestDate); } // cặp mã rất tốt (mã đơn, số chứng từ) vẫn đứng trước
    return out;
  }

  /* ---------------- Gợi ý cặp đối chiếu (1.6.0) ----------------
     Đề xuất các cặp cột có TÊN TIÊU ĐỀ TRÙNG (bỏ dấu, hoa/thường, ký tự đặc biệt) hoặc DỮ LIỆU KHỚP ≥ 80%
     (tỉ lệ giá trị khác nhau của cột ít giá trị hơn có mặt ở cột kia; ô trống / số 0 không tính).
     group = 'and' (thỏa mãn đồng thời): ưu tiên cột mã ít lặp, cột ngày; 'or' (thỏa mãn một trong): ưu tiên cột số tiền. */
  function suggestPairs(cfg, group) {
    require2();
    var A = S.A, B = S.B, clean = Object.assign({}, cfg.clean || {}, { dateOnly: true });
    var used = { A: {}, B: {} };
    validPairs(cfg.keyPairs, 'a', 'b').concat(validPairs(cfg.orPairs, 'a', 'b')).forEach(function (p) { used.A[p.a] = 1; used.B[p.b] = 1; });
    function pv(v) {
      if (isBlank(v)) return null;
      var k = cleanKey(v, clean);
      if (k.charCodeAt(0) === 2) return k;
      var n = toNum(v);
      if (n !== null) return n === 0 ? null : '\u0003' + (Math.round(n * 100) / 100);
      return k === '' || k === '0' ? null : k;
    }
    function profile(st, side) {
      var lim = Math.min(st.data.length, 20000);
      return st.columns.map(function (c, ci) {
        if (used[side][c]) return null;
        var s = new Set(), cnt = 0, nD = 0, nN = 0, nInt = 0, mn = Infinity, mx = -Infinity;
        for (var r = 0; r < lim; r++) {
          var k = pv(st.data[r][ci]); if (k === null) continue;
          cnt++; s.add(k); var ch = k.charCodeAt(0);
          if (ch === 2) nD++;
          else if (ch === 3) { nN++; var nv = +k.slice(1); if (nv === Math.floor(nv)) { nInt++; if (nv < mn) mn = nv; if (nv > mx) mx = nv; } }
        }
        var uq = cnt ? s.size / cnt : 0;
        // cột số thứ tự / số chạy liên tục (STT, số hóa đơn 1, 2, 3…): 2 dãy số kiểu này luôn trùng nhau nên không dùng để gợi ý theo dữ liệu
        var seq = nN === cnt && nInt === cnt && uq >= 0.95 && s.size >= 10 && s.size / (mx - mn + 1) >= 0.8;
        return { set: s, cnt: cnt, uniq: uq, seq: seq, kind: !cnt ? '' : (nD / cnt >= 0.8 ? 'date' : (nN / cnt >= 0.8 ? 'number' : 'text')), norm: stripAcc(c).replace(/[^a-z0-9]/g, '') };
      });
    }
    progress('Đang phân tích các cột...', 15);
    var pa = profile(A, 'A'); progress('Đang phân tích các cột...', 45);
    var pb = profile(B, 'B'); progress('Đang so khớp các cặp cột...', 65);
    var out = [];
    A.columns.forEach(function (ca, i) {
      var x = pa[i]; if (!x || !x.cnt) return;
      B.columns.forEach(function (cb, j) {
        var y = pb[j]; if (!y || !y.cnt) return;
        var nameEq = !!x.norm && x.norm === y.norm;
        if (!nameEq && x.kind !== y.kind) return;
        var small = x.set.size <= y.set.size ? x.set : y.set, big = small === x.set ? y.set : x.set, inter = 0;
        small.forEach(function (v) { if (big.has(v)) inter++; });
        var ov = small.size ? inter / small.size : 0;
        var dataOk = ov >= 0.8 && small.size >= 3 && small.size / big.size >= 0.02 && !x.seq && !y.seq
          && (x.kind !== 'date' || inter / big.size >= 0.3);   // ngày: 2 cột phải cùng khoảng thời gian, không chỉ nằm lọt trong nhau
        if (!nameEq && !dataOk) return;
        var kind = x.kind === y.kind ? x.kind : 'text', uniq = Math.max(x.uniq, y.uniq), sc = ov + (nameEq ? 0.15 : 0);
        if (group === 'or') sc += (kind === 'number' ? 0.25 : 0) - (kind === 'date' ? 0.4 : 0);
        else sc += 0.4 * uniq + (kind === 'date' ? 0.15 : 0) - (kind === 'number' ? 0.25 : 0);
        out.push({ colA: ca, colB: cb, matchRatio: Math.round(ov * 1000) / 1000, nameMatch: nameEq, dataMatch: dataOk, kind: kind, score: sc });
      });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 15);
  }

  /* ---------------- Kiểm tra nhanh dữ liệu ---------------- */
  function checkKeys(cfg) {
    require2();
    var M = Matcher(cfg), req = M.req, ors = M.ors;
    progress('Đang kiểm tra dữ liệu...', 30);
    function analyze(side, cols) {
      var st = S[side], keys = M.compositeKeys(side), cnt = new Map(), first = new Map(), empty = 0;
      for (var r = 0; r < keys.length; r++) { var v = keys[r]; if (v === null) { empty++; continue; } var c = cnt.get(v); if (c === undefined) { cnt.set(v, 1); first.set(v, r); } else cnt.set(v, c + 1); }
      var dups = [], dupRows = 0;
      cnt.forEach(function (c, v) { if (c > 1) { dupRows += c; dups.push([v, c]); } });
      dups.sort(function (a, b) { return b[1] - a[1]; });
      var idx = cols.map(function (c) { return colIndex(st, c); });
      var ex = dups.slice(0, 5).map(function (d) { var row = st.data[first.get(d[0])]; return { value: idx.map(function (i) { var v = row[i]; return isBlank(v) ? '(trống)' : disp(v); }).join(' + '), count: d[1] }; });
      return { set: cnt, keys: keys, res: { emptyCount: empty, duplicateCount: dupRows, duplicateExamples: ex, distinctKeys: cnt.size, totalRows: keys.length } };
    }
    var colsA = req.map(function (p) { return p.a; }).concat(ors.map(function (p) { return p.a; }));
    var colsB = req.map(function (p) { return p.b; }).concat(ors.map(function (p) { return p.b; }));
    var ra = analyze('A', colsA); progress('Đang kiểm tra dữ liệu...', 60);
    var rb = analyze('B', colsB); progress('Đang tính tỉ lệ khớp...', 80);
    var a2b, b2a;
    if (!ors.length) {
      var inter = 0; ra.set.forEach(function (_, k) { if (rb.set.has(k)) inter++; });
      a2b = ra.set.size ? inter / ra.set.size : 0; b2a = rb.set.size ? inter / rb.set.size : 0;
    } else { // theo dòng: bao nhiêu dòng tìm được dòng khớp ở file kia
      var okA = 0, nA = 0;
      var hitB = M.run('A', 'first', function (r, j) { if (ra.keys[r] !== null) { nA++; if (j >= 0) okA++; } });
      var nB = 0, okB = 0; for (var j = 0; j < rb.keys.length; j++) if (rb.keys[j] !== null) { nB++; if (hitB[j]) okB++; }
      a2b = nA ? okA / nA : 0; b2a = nB ? okB / nB : 0;
    }
    return { A: ra.res, B: rb.res, matchRateAtoB: a2b, matchRateBtoA: b2a, warning: Math.max(a2b, b2a) < 0.10, hasOr: ors.length > 0 };
  }

  /* ---------------- Gợi ý cặp cột so sánh (nâng cấp) ---------------- */
  function suggestComparePairs(cfg) {
    require2();
    var M = Matcher(cfg), pairs = M.req.concat(M.ors);
    progress('Đang dò các cột có cùng giá trị...', 20);
    var sample = [];
    for (var i = 0; i < S.A.data.length && sample.length < 3000; i++) { var c0 = M.cands('A', i); if (c0 && c0.length) sample.push([i, c0[0]]); }
    if (sample.length < 5) return [];
    var A = S.A, B = S.B, SUG_CMP = { trimSpaces: true, caseInsensitive: true, normalizeUnicode: true, numericEquivalence: false, dateOnly: !!(cfg.clean && cfg.clean.dateOnly) };
    var skipA = pairs.map(function (p) { return p.a; }), skipB = pairs.map(function (p) { return p.b; });
    progress('Đang so khớp giá trị...', 55);
    var cands = [];
    A.columns.forEach(function (ca, ai) {
      if (skipA.indexOf(ca) >= 0) return;
      B.columns.forEach(function (cb, bi) {
        if (skipB.indexOf(cb) >= 0) return;
        var both = 0, eq = 0, distinct = new Set(), numeric = 0;
        for (var s = 0; s < sample.length; s++) {
          var va = A.data[sample[s][0]][ai], vb = B.data[sample[s][1]][bi];
          if (isBlank(va) || isBlank(vb)) continue;
          both++;
          var na = toNum(va), nb = toNum(vb);
          if (na !== null && nb !== null) { numeric++; if (Math.abs(na - nb) < 0.5) eq++; }
          else if (cleanKey(va, SUG_CMP) === cleanKey(vb, SUG_CMP)) eq++;
          if (distinct.size < 30) distinct.add(rawStr(va));
        }
        if (both < Math.min(20, sample.length / 2)) return;
        var rate = eq / both, bonus = nameSim(ca, cb);
        if (distinct.size < 3 && bonus === 0) return;     // cột gần như hằng số → bỏ qua
        var isDate = A.colTypes[ai] === 'date' || B.colTypes[bi] === 'date';
        if (isDate && rate < 0.95) return;               // 2 cột ngày khác nghĩa (ngày hiệu lực ≠ ngày chứng từ) dễ báo lệch giả
        if (rate >= 0.6 || (bonus >= 0.18 && rate >= 0.3)) cands.push({ aCol: ca, bCol: cb, rate: rate, numeric: numeric / both > 0.5, score: rate + bonus });
      });
    });
    cands.sort(function (a, b) { return b.score - a.score; });
    var usedA = {}, usedB = {}, out = [];
    cands.forEach(function (c) { if (usedA[c.aCol] || usedB[c.bCol]) return; usedA[c.aCol] = usedB[c.bCol] = 1; out.push({ aCol: c.aCol, bCol: c.bCol, tolerance: '', matchRate: Math.round(c.rate * 1000) / 1000, numeric: c.numeric }); });
    // giữ đúng thứ tự cột của File A cho dễ đọc
    out.sort(function (x, y) { return A.columns.indexOf(x.aCol) - A.columns.indexOf(y.aCol); });
    return out.slice(0, 12);
  }

  /* ---------------- Ghép ---------------- */
  var ST = ['Khớp', 'Chỉ có ở A', 'Chỉ có ở B', 'Lệch giá trị'];
  var WARN_KEY = 'Lệch ngày', SUM_KEY = 'Khớp tổng';
  var JOIN_LABELS = { 1: 'Giữ đủ File A, lấy thêm thông tin từ File B', 2: 'Giữ đủ File B, lấy thêm thông tin từ File A', 3: 'Chỉ lấy dòng có ở cả 2 file', 4: 'Gộp tất cả, không bỏ sót dòng nào', 5: 'Dòng có ở A nhưng B không có', 6: 'Dòng có ở B nhưng A không có', 7: 'Báo cáo tra soát toàn diện' };

  function Grow() { this.a = new Int32Array(1024); this.n = 0; }
  Grow.prototype.push = function (v) { if (this.n === this.a.length) { var b = new Int32Array(this.a.length * 2); b.set(this.a); this.a = b; } this.a[this.n++] = v; };
  Grow.prototype.done = function () { return this.a.subarray(0, this.n); };

  function runMerge(cfg) {
    require2();
    var t0 = Date.now();
    var jt = +cfg.joinType; if (!jt) throw FriendlyError('Chưa chọn kiểu ghép.');
    var mode = cfg.duplicateHandling === 'all' ? 'all' : (cfg.duplicateHandling === 'one' ? 'one' : 'first');
    var A = S.A, B = S.B;
    progress('Đang chuẩn hoá khóa...', 10);
    var M = Matcher(cfg), pairs = M.req, hasOr = M.ors.length > 0;
    progress('Đang chuẩn hoá khóa...', 25);

    // kế hoạch cột
    var reserved = jt === 7 ? { 'Trạng thái': 1, 'Chi tiết lệch': 1, 'Khớp theo': 1 } : {};
    var aKeys = pairs.map(function (p) { return p.a; }), bKeys = pairs.map(function (p) { return p.b; });
    function pick(st, sel, keysNames) { var list = sel === 'ALL' || !sel ? st.columns.slice() : sel.filter(function (c) { return st.columns.indexOf(c) >= 0; }); return list.filter(function (c) { return keysNames.indexOf(c) < 0; }); }
    var selA = pick(A, cfg.colsA, aKeys), selB = pick(B, cfg.colsB, bKeys);
    var keyOut = aKeys.slice();
    function outName(c, other, suf) { return (other.indexOf(c) >= 0 || reserved[c] || keyOut.indexOf(c) >= 0) ? c + suf : c; }
    var aOut = selA.map(function (c) { return outName(c, selB, ' (A)'); });
    var bOut = selB.map(function (c) { return outName(c, selA, ' (B)'); });

    progress('Đang ghép dữ liệu...', 40);
    var IA = new Grow(), IB = new Grow(), STs = new Grow(), OP = new Grow();
    var tolMap = {}, tolCount = 0;
    function emit(i, j, s, q, tol) { if (tol) { tolMap[IA.n] = tol; tolCount++; } IA.push(i); IB.push(j); STs.push(s); OP.push(q); if (IA.n > MAX_RESULT_ROWS) throw FriendlyError('Kết quả vượt quá ' + fmtNum(MAX_RESULT_ROWS) + ' dòng (thường do khóa bị trùng nhiều và đang chọn "Lấy đủ tất cả các dòng"). Hãy chọn cách xử lý khóa trùng khác hoặc thêm điều kiện.'); }
    var hit;
    if (jt === 1 || jt === 4 || jt === 7) hit = M.run('A', mode, function (i, j, q, tol) { if (j < 0) emit(i, -1, 1, -1); else emit(i, j, 0, q, tol); });
    else if (jt === 3) hit = M.run('A', mode, function (i, j, q, tol) { if (j >= 0) emit(i, j, 0, q, tol); });
    else if (jt === 5) hit = M.run('A', mode, function (i, j) { if (j < 0) emit(i, -1, 1, -1); });
    else if (jt === 2) M.run('B', mode, function (j, i, q, tol) { if (i < 0) emit(-1, j, 2, -1); else emit(i, j, 0, q, tol); });
    else if (jt === 6) { hit = M.run('A', mode, function () {}); for (var j = 0; j < hit.length; j++) if (!hit[j]) emit(-1, j, 2, -1); }
    if (jt === 4 || jt === 7) { for (var j2 = 0; j2 < hit.length; j2++) if (!hit[j2]) emit(-1, j2, 2, -1); }
    var orHit = OP.done();
    var ia = IA.done(), ib = IB.done(), st = new Uint8Array(STs.done());
    progress('Đang so sánh giá trị...', 70);

    // so sánh giá trị (kiểu 7)
    var cmp = [];
    if (jt === 7) {
      (cfg.comparePairs || []).forEach(function (p) {
        if (!p.aCol || !p.bCol) return;
        var ai = A.columns.indexOf(p.aCol), bi = B.columns.indexOf(p.bCol); if (ai < 0 || bi < 0) return;
        var tol = p.tolerance === '' || p.tolerance === null || p.tolerance === undefined ? 0 : Math.abs(Number(String(p.tolerance).replace(/,/g, '.'))) || 0;
        cmp.push({ aCol: p.aCol, bCol: p.bCol, ai: ai, bi: bi, tol: tol, label: p.aCol === p.bCol ? p.aCol : p.aCol + ' / ' + p.bCol, mism: 0, numeric: 0, sumA: 0, sumB: 0, sumAm: 0, sumBm: 0, sumOnlyA: 0, sumOnlyB: 0 });
      });
    }
    var cc0 = cfg.clean || {}, CMP_OPTS = { trimSpaces: true, caseInsensitive: true, normalizeUnicode: true, numericEquivalence: false, dateOnly: !!cc0.dateOnly, noAccent: !!cc0.noAccent, alnumOnly: !!cc0.alnumOnly, phone: !!cc0.phone };
    var mis = cmp.length ? new Uint32Array(Math.ceil(ia.length / 32) * Math.max(1, cmp.length)) : null; // bit lệch theo (dòng, cặp)
    var words = Math.ceil(ia.length / 32);
    var mismatchCount = 0;
    if (cmp.length) {
      for (var r = 0; r < ia.length; r++) {
        var s0 = st[r], rowA = ia[r] >= 0 ? A.data[ia[r]] : null, rowB = ib[r] >= 0 ? B.data[ib[r]] : null, any = false;
        for (var q = 0; q < cmp.length; q++) {
          var c = cmp[q], va = rowA ? rowA[c.ai] : undefined, vb = rowB ? rowB[c.bi] : undefined;
          var na = toNum(va), nb = toNum(vb);
          if (na !== null) { c.sumA += na; if (s0 === 0) c.sumAm += na; else c.sumOnlyA += na; c.numeric++; }
          if (nb !== null) { c.sumB += nb; if (s0 === 0) c.sumBm += nb; else c.sumOnlyB += nb; }
          if (s0 !== 0) continue;
          var bad;
          if (na !== null && nb !== null) bad = Math.abs(na - nb) > c.tol + 1e-9;
          else bad = cleanKey(va, CMP_OPTS) !== cleanKey(vb, CMP_OPTS);
          if (bad) { c.mism++; any = true; mis[q * words + (r >>> 5)] |= (1 << (r & 31)); }
        }
        if (any) { st[r] = 3; mismatchCount++; }
      }
    }
    // dòng khớp nhờ dung sai số tiền: ở báo cáo tra soát coi là "Lệch giá trị" để người dùng thấy và kiểm tra
    if (jt === 7) for (var tk in tolMap) { var tr = +tk; if (st[tr] === 0) { st[tr] = 3; mismatchCount++; } }
    var onlyA = 0, onlyB = 0, matched = 0;
    for (r = 0; r < st.length; r++) { if (st[r] === 1) onlyA++; else if (st[r] === 2) onlyB++; else matched++; }

    /* ---- Cảnh báo: trùng số liệu nhưng lệch ngày (chỉ báo, không tính là khớp) ----
       Lấy cặp điều kiện bắt buộc dạng ngày; ghép lại các dòng Chỉ có ở A với Chỉ có ở B
       khi mọi điều kiện còn lại (bắt buộc khác + một cặp thay thế) đều khớp và ngày lệch ≤ N ngày. */
    var dw = null, warnPartner = null, warnDays = null, warnVia = null, wColA = -1, wColB = -1;
    if (jt === 7 && cfg.dateWarn && cfg.dateWarn.on) {
      var maxDays = Math.max(1, Math.min(366, parseInt(cfg.dateWarn.days, 10) || 3));
      function dayNum(v) { var k = dayKey(v); if (k === null) return null; var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / MS_DAY; }
      function dateLike(st, col) {
        var ci = st.columns.indexOf(col), n = 0, ok = 0;
        for (var r = 0; r < st.data.length && n < 300; r++) { var v = st.data[r][ci]; if (isBlank(v)) continue; n++; if (dayKey(v) !== null) ok++; }
        return n > 0 && ok / n >= 0.8;
      }
      var dIdx = -1;
      for (var q0 = 0; q0 < pairs.length; q0++) if (dateLike(A, pairs[q0].a) && dateLike(B, pairs[q0].b)) { dIdx = q0; break; }
      var rest = pairs.filter(function (_, i) { return i !== dIdx; });
      if (dIdx < 0) dw = { error: 'Chưa có cặp cột ngày ở nhóm "Thỏa mãn đồng thời các điều kiện" nên chưa dò được dòng lệch ngày.', days: maxDays };
      else if (!rest.length && !hasOr) dw = { error: 'Ngoài cặp ngày cần thêm ít nhất 1 điều kiện khác (số tiền, số chứng từ…) để biết 2 dòng là cùng một giao dịch.', days: maxDays };
      else {
        var cl = cfg.clean || {};
        var restA = rest.length ? buildKeys('A', rest.map(function (p) { return p.a; }), cl).keys : null;
        var restB = rest.length ? buildKeys('B', rest.map(function (p) { return p.b; }), cl).keys : null;
        var orA = M.ors.map(function (p) { return buildOr('A', p.a, cl); }), orB = M.ors.map(function (p) { return buildOr('B', p.b, cl); });
        var dColA = A.columns.indexOf(pairs[dIdx].a), dColB = B.columns.indexOf(pairs[dIdx].b); wColA = dColA; wColB = dColB;
        function variants(side, row) {
          var rk2 = side === 'A' ? (restA ? restA[row] : '') : (restB ? restB[row] : '');
          if (rk2 === null) return [];
          if (!hasOr) return [rk2];
          var out = [], ov = side === 'A' ? orA : orB;
          for (var q = 0; q < ov.length; q++) if (ov[q][row] !== null) out.push(rk2 + '\u0004' + q + '\u0004' + ov[q][row]);
          return out;
        }
        var idxB = new Map();
        for (var rb = 0; rb < st.length; rb++) {
          if (st[rb] !== 2) continue;
          var dB = dayNum(B.data[ib[rb]][dColB]); if (dB === null) continue;
          variants('B', ib[rb]).forEach(function (k) { var e = idxB.get(k); if (!e) idxB.set(k, [rb]); else e.push(rb); });
        }
        warnPartner = new Int32Array(st.length).fill(-1); warnDays = new Int16Array(st.length); warnVia = new Int16Array(st.length).fill(-1);
        var pairsFound = 0, order = [];
        for (var ra = 0; ra < st.length; ra++) {
          if (st[ra] !== 1) continue;
          var dA = dayNum(A.data[ia[ra]][dColA]); if (dA === null) continue;
          var best = -1, bestD = 1e9, bestK = '';
          variants('A', ia[ra]).forEach(function (k) {
            var lst = idxB.get(k); if (!lst) return;
            for (var x = 0; x < lst.length; x++) {
              var rbb = lst[x]; if (warnPartner[rbb] >= 0) continue;
              var dd = dayNum(B.data[ib[rbb]][dColB]) - dA;
              if (dd !== 0 && Math.abs(dd) <= maxDays && Math.abs(dd) < Math.abs(bestD)) { bestD = dd; best = rbb; bestK = k; }
            }
          });
          if (best >= 0) { if (hasOr) { var qq = +bestK.split('\u0004')[1]; warnVia[ra] = warnVia[best] = qq; } warnPartner[ra] = best; warnPartner[best] = ra; warnDays[ra] = bestD; warnDays[best] = -bestD; pairsFound++; order.push(ra, best); }
        }
        dw = { days: maxDays, pairs: pairsFound, dateLabel: pairs[dIdx].a + ' = ' + pairs[dIdx].b, order: order };
      }
    }
    /* ---- Cảnh báo: 1 dòng bằng TỔNG nhiều dòng cùng ngày bên kia (VD 1 lệnh nộp BHXH ở sao kê = BHXH + BHYT + BHTN + lãi chậm nộp ở sổ) ----
       Chỉ xét dòng Chỉ có ở A / Chỉ có ở B chưa nằm trong cặp lệch ngày; cùng ngày, cùng các điều kiện bắt buộc khác,
       cùng cột tiền (cặp thay thế số, hoặc cặp so sánh số). Chỉ cảnh báo, không tính là khớp. */
    var sg = null, sgRole = null, sgGroup = null;
    if (jt === 7 && cfg.sumWarn && cfg.sumWarn.on) {
      var dayN = function (v) { var k = dayKey(v); if (k === null) return null; var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / MS_DAY; };
      var isDateCol = function (st0, col) { var ci = st0.columns.indexOf(col), n = 0, ok = 0; for (var r = 0; r < st0.data.length && n < 300; r++) { var v = st0.data[r][ci]; if (isBlank(v)) continue; n++; if (dayKey(v) !== null) ok++; } return n > 0 && ok / n >= 0.8; };
      var dI = -1; for (var q1 = 0; q1 < pairs.length; q1++) if (isDateCol(A, pairs[q1].a) && isDateCol(B, pairs[q1].b)) { dI = q1; break; }
      // các cột tiền: cặp thay thế (số) – nếu không có thì cặp so sánh số ở kiểu 7
      var money = [];
      M.ors.forEach(function (p) { money.push({ ai: A.columns.indexOf(p.a), bi: B.columns.indexOf(p.b), label: p.a + ' = ' + p.b }); });
      if (!money.length) cmp.forEach(function (c) { if (c.numeric > 0) money.push({ ai: c.ai, bi: c.bi, label: c.label }); });
      if (dI < 0) sg = { error: 'Chưa có cặp cột ngày ở nhóm "Thỏa mãn đồng thời các điều kiện" nên chưa dò được dòng khớp tổng.' };
      else if (!money.length) sg = { error: 'Cần ít nhất 1 cặp cột số tiền (ở nhóm "Thỏa mãn một trong các điều kiện" hoặc cặp so sánh) để cộng tổng.' };
      else {
        var cl2 = cfg.clean || {}, rest2 = pairs.filter(function (_, i) { return i !== dI; });
        var rA = rest2.length ? buildKeys('A', rest2.map(function (p) { return p.a; }), cl2).keys : null;
        var rB = rest2.length ? buildKeys('B', rest2.map(function (p) { return p.b; }), cl2).keys : null;
        var dCA = A.columns.indexOf(pairs[dI].a), dCB = B.columns.indexOf(pairs[dI].b);
        sgRole = new Int8Array(st.length); sgGroup = new Int32Array(st.length).fill(-1);
        var groups = new Map();   // ngày|khóa khác|cột tiền → { A: [{r,v}], B: [{r,v}] }
        for (var r3 = 0; r3 < st.length; r3++) {
          if (st[r3] !== 1 && st[r3] !== 2) continue;
          if (warnPartner && warnPartner[r3] >= 0) continue;
          var isA = st[r3] === 1, row = isA ? A.data[ia[r3]] : B.data[ib[r3]];
          var dn = dayN(row[isA ? dCA : dCB]); if (dn === null) continue;
          var rk3 = isA ? (rA ? rA[ia[r3]] : '') : (rB ? rB[ib[r3]] : ''); if (rk3 === null) continue;
          for (var mq = 0; mq < money.length; mq++) {
            var v3 = toNum(row[isA ? money[mq].ai : money[mq].bi]); if (v3 === null || v3 <= 0) continue;
            var gk = dn + '\u0004' + rk3 + '\u0004' + mq, g = groups.get(gk);
            if (!g) { g = { A: [], B: [], q: mq, day: dn }; groups.set(gk, g); }
            g[isA ? 'A' : 'B'].push({ r: r3, v: Math.round(v3 * 100) });
          }
        }
        // tìm tập con (≥ 2 dòng) có tổng đúng bằng mục tiêu; giới hạn bước để không treo máy
        var findSubset = function (target, items) {
          var list = items.filter(function (x) { return x.v <= target; }).sort(function (a, b) { return b.v - a.v; });
          if (list.length < 2) return null;
          var all = 0; list.forEach(function (x) { all += x.v; });
          if (all === target) return list.slice();
          if (all < target || list.length > 30) return null;   // nhiều dòng quá dễ ra tổ hợp trùng ngẫu nhiên
          var suf = new Array(list.length + 1); suf[list.length] = 0;
          for (var i = list.length - 1; i >= 0; i--) suf[i] = suf[i + 1] + list[i].v;
          var pick = [], budget = Math.min(200000, sgBudget), found = null;
          (function dfs(i, sum) {
            if (found || --budget < 0) return;
            if (sum === target) { if (pick.length >= 2) found = pick.slice(); return; }
            if (i >= list.length || pick.length >= 8 || sum + suf[i] < target) return;
            if (sum + list[i].v <= target) { pick.push(list[i]); dfs(i + 1, sum + list[i].v); pick.pop(); }
            dfs(i + 1, sum);
          })(0, 0);
          sgBudget -= Math.min(200000, sgBudget) - Math.max(0, budget);
          return found;
        };
        var used = new Uint8Array(st.length), out3 = [], order3 = [];
        var sgBudget = 5000000;   // tổng số bước dò tối đa cho cả file
        groups.forEach(function (g) {
          [['A', 'B'], ['B', 'A']].forEach(function (dir) {
            var singles = g[dir[0]].filter(function (x) { return !used[x.r]; }).sort(function (a, b) { return b.v - a.v; });
            singles.forEach(function (s0) {
              if (used[s0.r]) return;
              var parts = findSubset(s0.v, g[dir[1]].filter(function (x) { return !used[x.r]; }));
              if (!parts) return;
              var gid = out3.length;
              used[s0.r] = 1; sgRole[s0.r] = 1; sgGroup[s0.r] = gid; order3.push(s0.r);
              parts.forEach(function (x) { used[x.r] = 1; sgRole[x.r] = 2; sgGroup[x.r] = gid; order3.push(x.r); });
              out3.push({ single: s0.r, parts: parts.map(function (x) { return x.r; }), side: dir[0], q: g.q, day: g.day, total: s0.v / 100 });
            });
          });
        });
        sg = { groups: out3, order: order3, dateLabel: pairs[dI].a + ' = ' + pairs[dI].b, money: money, partial: sgBudget <= 0 };
      }
    }
    function sumText(r) {
      if (!sgGroup || sgGroup[r] < 0) return '';
      var g = sg.groups[sgGroup[r]], dd = new Date(g.day * MS_DAY), ds = p2(dd.getUTCDate()) + '/' + p2(dd.getUTCMonth() + 1) + '/' + dd.getUTCFullYear();
      var otherSide = g.side === 'A' ? 'File B' : 'File A', mySide = g.side === 'A' ? 'File A' : 'File B';
      if (sgRole[r] === 1) return 'Bằng tổng ' + g.parts.length + ' dòng ' + otherSide + ' cùng ngày ' + ds + ' (' + fmtNum(g.total) + ' – theo ' + sg.money[g.q].label + ')';
      return '1 trong ' + g.parts.length + ' dòng có tổng ' + fmtNum(g.total) + ' = 1 dòng ' + mySide + ' cùng ngày ' + ds;
    }
    function warnText(r) {
      var stx = sumText(r); if (stx) return stx;
      if (!warnPartner || warnPartner[r] < 0) return '';
      var p = warnPartner[r], d = warnDays[r];
      var other = st[r] === 1 ? 'File B' : 'File A';
      var dv = st[r] === 1 ? B.data[ib[p]][wColB] : A.data[ia[p]][wColA];
      return 'Trùng số liệu với dòng ' + other + ' ngày ' + (dayKey(dv) || '').split('-').reverse().join('/') + ' (lệch ' + Math.abs(d) + ' ngày)' + (warnVia && warnVia[r] >= 0 ? ' – theo ' + M.orLabel(warnVia[r]) : '');
    }

    var statusIncluded = jt === 7;
    var statusName = 'Trạng thái', detailName = 'Chi tiết lệch', viaName = 'Khớp theo';
    var allNames = keyOut.concat(aOut, bOut);
    while (allNames.indexOf(viaName) >= 0) viaName += ' (đối chiếu)';
    var showVia = statusIncluded && (hasOr || tolCount > 0);
    var warnName = 'Cảnh báo'; while (allNames.indexOf(warnName) >= 0) warnName += ' (đối chiếu)';
    var showWarn = !!((dw && !dw.error) || (sg && !sg.error));
    while (allNames.indexOf(statusName) >= 0) statusName += ' (đối chiếu)';
    while (allNames.indexOf(detailName) >= 0 || detailName === statusName) detailName += ' (đối chiếu)';
    var diffCols = [];
    if (statusIncluded) cmp.forEach(function (c, q) { if (c.numeric > 0) { var nm = 'Chênh lệch ' + c.label; while (allNames.indexOf(nm) >= 0) nm += ' (đối chiếu)'; diffCols.push({ q: q, name: nm }); } });

    var aIdx = selA.map(function (c) { return A.columns.indexOf(c); }), bIdx = selB.map(function (c) { return B.columns.indexOf(c); });
    var aKeyIdx = aKeys.map(function (c) { return A.columns.indexOf(c); }), bKeyIdx = bKeys.map(function (c) { return B.columns.indexOf(c); });
    var keyTypes = aKeyIdx.map(function (i) { return A.colTypes[i] === 'date' ? 'date' : 'text'; });
    var columns = statusIncluded ? [statusName].concat(keyOut, showVia ? [viaName] : [], [detailName], showWarn ? [warnName] : [], diffCols.map(function (d) { return d.name; }), aOut, bOut) : keyOut.concat(aOut, bOut);
    var types = statusIncluded ? ['text'].concat(keyTypes, showVia ? ['text'] : [], ['text'], showWarn ? ['text'] : [], diffCols.map(function () { return 'number'; }), aIdx.map(function (i) { return A.colTypes[i]; }), bIdx.map(function (i) { return B.colTypes[i]; }))
      : keyTypes.concat(aIdx.map(function (i) { return A.colTypes[i]; }), bIdx.map(function (i) { return B.colTypes[i]; }));

    function detailOf(r) {
      if (st[r] !== 3) return '';
      var parts = [], rowA = A.data[ia[r]], rowB = B.data[ib[r]];
      if (tolMap[r]) parts.push('Khớp nhờ dung sai: ' + tolMap[r].label + ' chênh ' + fmtNum(Math.abs(tolMap[r].diff)));
      for (var q = 0; q < cmp.length; q++) {
        if (!(mis[q * words + (r >>> 5)] & (1 << (r & 31)))) continue;
        var c = cmp[q], va = rowA[c.ai], vb = rowB[c.bi], na = toNum(va), nb = toNum(vb);
        if (na !== null && nb !== null) parts.push(c.label + ': ' + fmtNum(na) + ' ≠ ' + fmtNum(nb) + ', chênh ' + fmtNum(Math.abs(na - nb)));
        else parts.push(c.label + ': "' + disp(va) + '" ≠ "' + disp(vb) + '"');
      }
      return parts.join('; ');
    }
    // trả về mảng giá trị gốc của 1 dòng kết quả (đúng kiểu dữ liệu)
    function rowValues(r, lite) {
      var out = [], rowA = ia[r] >= 0 ? A.data[ia[r]] : null, rowB = ib[r] >= 0 ? B.data[ib[r]] : null;
      if (statusIncluded && !lite) out.push(ST[st[r]]);
      for (var k = 0; k < aKeyIdx.length; k++) { var v = rowA ? rowA[aKeyIdx[k]] : undefined; if (isBlank(v) && rowB) v = rowB[bKeyIdx[k]]; out.push(v); }
      if (statusIncluded && !lite) {
        if (showVia) out.push(tolMap[r] ? tolMap[r].label + ' (≈ trong dung sai)' : (orHit[r] >= 0 ? M.orLabel(orHit[r]) : ''));
        out.push(detailOf(r));
        if (showWarn) out.push(warnText(r));
        for (var d = 0; d < diffCols.length; d++) {
          var c = cmp[diffCols[d].q], dv = null;
          if (st[r] === 3) { var na = toNum(rowA[c.ai]), nb = toNum(rowB[c.bi]); if (na !== null && nb !== null && Math.abs(na - nb) > 1e-9) dv = Math.round((na - nb) * 1e6) / 1e6; }
          out.push(dv);
        }
      }
      for (k = 0; k < aIdx.length; k++) out.push(rowA ? rowA[aIdx[k]] : undefined);
      for (k = 0; k < bIdx.length; k++) out.push(rowB ? rowB[bIdx[k]] : undefined);
      return out;
    }

    var stats = { totalRows: ia.length, matchedCount: jt === 7 ? matched - mismatchCount : matched, matchedAll: matched, onlyACount: onlyA, onlyBCount: onlyB, mismatchCount: mismatchCount, exceedsExcelLimit: ia.length > EXCEL_ROW_LIMIT, hasCompare: jt === 7 && cmp.length > 0, elapsedMs: Date.now() - t0, dateWarnPairs: dw && !dw.error ? dw.pairs : 0, sumWarnGroups: sg && !sg.error ? sg.groups.length : 0, tolMatched: tolCount };
    var totals = cmp.filter(function (c) { return c.numeric > 0; }).map(function (c) {
      return { label: c.label, aCol: c.aCol, bCol: c.bCol, mismatch: c.mism, sumA: c.sumA, sumB: c.sumB, diff: c.sumA - c.sumB, diffMatched: c.sumAm - c.sumBm, onlyA: c.sumOnlyA, onlyB: c.sumOnlyB };
    });
    var textPairs = cmp.filter(function (c) { return c.numeric === 0; }).map(function (c) { return { label: c.label, mismatch: c.mism }; });
    // ô bị lệch (để tô màu trên bảng và trong Excel): cột A và cột B của từng cặp so sánh lệch, cột tiền của dòng khớp nhờ dung sai
    var cmpColA = cmp.map(function (c) { var k = selA.indexOf(c.aCol); return k >= 0 ? columns.indexOf(aOut[k]) : -1; });
    var cmpColB = cmp.map(function (c) { var k = selB.indexOf(c.bCol); return k >= 0 ? columns.indexOf(bOut[k]) : -1; });
    function colOfPair(label) { var pp = label.split(' = '); var ka = selA.indexOf(pp[0]), kb = selB.indexOf(pp[1]); return [ka >= 0 ? columns.indexOf(aOut[ka]) : -1, kb >= 0 ? columns.indexOf(bOut[kb]) : -1]; }
    function hlOf(r) {
      if (!statusIncluded || st[r] !== 3) return null;
      var out = [];
      for (var q = 0; q < cmp.length; q++) if (mis[q * words + (r >>> 5)] & (1 << (r & 31))) { if (cmpColA[q] >= 0) out.push(cmpColA[q]); if (cmpColB[q] >= 0) out.push(cmpColB[q]); }
      if (tolMap[r]) colOfPair(tolMap[r].label).forEach(function (x) { if (x >= 0) out.push(x); });
      return out.length ? out : null;
    }
    S.last = { hlOf: hlOf, cfg: cfg, jt: jt, ia: ia, ib: ib, st: st, columns: columns, types: types, rowValues: rowValues, stats: stats, totals: totals, textPairs: textPairs, statusIncluded: statusIncluded, searchIdx: null, view: null, dw: dw, sg: sg };
    progress('Đang tạo bản xem trước...', 95);
    var page = getPage({ filter: 'ALL', search: '', page: 1, pageSize: 100 });
    return { stats: stats, columns: columns, colTypes: types, totals: totals, textPairs: textPairs, statusIncluded: statusIncluded, joinType: jt, page: page,
      dateWarn: dw ? { error: dw.error || '', days: dw.days, pairs: dw.pairs || 0, dateLabel: dw.dateLabel || '' } : null,
      sumWarn: sg ? { error: sg.error || '', groups: sg.groups ? sg.groups.length : 0, rows: sg.order ? sg.order.length : 0, dateLabel: sg.dateLabel || '' } : null };
  }

  /* ---------------- Xem kết quả theo trang + tìm kiếm (nâng cấp) ---------------- */
  function getPage(q) {
    var L = S.last; if (!L) throw FriendlyError('Chưa có kết quả. Vui lòng bấm Chạy trước.');
    var filter = q.filter || 'ALL', search = (q.search || '').trim(), size = Math.max(10, Math.min(500, q.pageSize || 100));
    var key = filter + '|' + search;
    if (!L.view || L.view.key !== key) {
      var want = filter === 'ALL' ? -1 : ST.indexOf(filter);
      var needle = search ? stripAcc(search) : '';
      if (needle && /^-?[\d.,\s]+$/.test(needle) && /\d/.test(needle)) needle = needle.replace(/[.\s]/g, '').replace(',', '.'); // số kiểu 7.043.300
      if (needle && !L.searchIdx) {
        progress('Đang lập chỉ mục tìm kiếm...', 40);
        L.searchIdx = new Array(L.ia.length);
        var cache = new Map();
        for (var r = 0; r < L.ia.length; r++) {
          var vals = L.rowValues(r, true), s = [];
          for (var k = 0; k < vals.length; k++) {
            var v = vals[k]; if (v === null || v === undefined || v === '') continue;
            if (typeof v === 'number') { s.push(String(v)); continue; }
            var t = typeof v === 'string' ? v : disp(v), c = cache.get(t);
            if (c === undefined) { c = ASCII_RE.test(t) ? t.toLowerCase() : stripAcc(t); if (cache.size < 300000) cache.set(t, c); }
            s.push(c);
          }
          L.searchIdx[r] = s.join('\u0001');
          if ((r & 32767) === 0) progress('Đang lập chỉ mục tìm kiếm...', 40 + Math.round(r / L.ia.length * 50));
        }
      }
      var list = new Grow();
      if (filter === SUM_KEY) {
        var os = L.sg && L.sg.order ? L.sg.order : [];
        for (var w2 = 0; w2 < os.length; w2++) { if (needle && L.searchIdx[os[w2]].indexOf(needle) < 0) continue; list.push(os[w2]); }
      } else if (filter === WARN_KEY) {
        var od = L.dw && L.dw.order ? L.dw.order : [];
        for (var w = 0; w < od.length; w += 2) {
          if (needle && L.searchIdx[od[w]].indexOf(needle) < 0 && L.searchIdx[od[w + 1]].indexOf(needle) < 0) continue;
          list.push(od[w]); list.push(od[w + 1]);
        }
      } else
      for (var r2 = 0; r2 < L.ia.length; r2++) {
        if (want >= 0 && L.st[r2] !== want) continue;
        if (needle && L.searchIdx[r2].indexOf(needle) < 0) continue;
        list.push(r2);
      }
      L.view = { key: key, rows: list.done() };
    }
    var total = L.view.rows.length, pages = Math.max(1, Math.ceil(total / size)), page = Math.max(1, Math.min(pages, q.page || 1));
    var rows = [], statuses = [], hls = [];
    for (var i = (page - 1) * size; i < Math.min(total, page * size); i++) {
      var rr = L.view.rows[i]; rows.push(L.rowValues(rr).map(disp)); statuses.push(ST[L.st[rr]]); hls.push(L.hlOf ? L.hlOf(rr) : null);
    }
    var counts = { ALL: L.ia.length }; ST.forEach(function (s) { counts[s] = 0; });
    for (var c = 0; c < L.st.length; c++) counts[ST[L.st[c]]]++;
    counts[WARN_KEY] = L.dw && L.dw.order ? L.dw.order.length : 0;
    counts[SUM_KEY] = L.sg && L.sg.groups ? L.sg.groups.length : 0;
    return { rows: rows, statuses: statuses, hl: hls, total: total, page: page, pages: pages, pageSize: size, counts: counts };
  }

  /* ---------------- Xuất Excel (tự ghi XLSX, nén từng phần) ---------------- */
  function xesc(s) { return s.replace(/[&<>"]/g, function (c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, ''); }
  function colLetter(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

  function XlsxWriter() {
    var chunks = [], self = this;
    this.zip = new fflate.Zip(function (err, data) { if (err) throw err; chunks.push(data); });
    this.chunks = chunks; this.sst = new Map(); this.sstList = []; this.sstCount = 0; this.sheets = [];
  }
  XlsxWriter.prototype.file = function (name, str, level) {
    var f = new fflate.ZipDeflate(name, { level: level === undefined ? 6 : level }); this.zip.add(f); f.push(fflate.strToU8(str), true);
  };
  XlsxWriter.prototype.si = function (s) {
    this.sstCount++;
    var i = this.sst.get(s); if (i === undefined) { i = this.sstList.length; this.sst.set(s, i); this.sstList.push(s); } return i;
  };
  // styles: 0 thường, 1 tiêu đề, 2 ngày, 3 đậm, 4 số có phân cách, 5 tiêu đề phụ
  XlsxWriter.prototype.sheet = function (name, opts) {
    var idx = this.sheets.length + 1, path = 'xl/worksheets/sheet' + idx + '.xml';
    this.sheets.push(name);
    var f = new fflate.ZipDeflate(path, { level: 1 }); this.zip.add(f);
    var buf = [], blen = 0, enc = fflate.strToU8;
    function flush(final) { if (buf.length || final) { f.push(enc(buf.join('')), !!final); buf = []; blen = 0; } }
    var head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    if (opts.freeze) head += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';
    else head += '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
    head += '<sheetFormatPr defaultRowHeight="15"/>';
    if (opts.widths && opts.widths.length) head += '<cols>' + opts.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    head += '<sheetData>';
    buf.push(head);
    var rowN = 0, self = this;
    return {
      row: function (vals, styles) {
        rowN++;
        var s = '<row r="' + rowN + '">', skip = false;
        for (var c = 0; c < vals.length; c++) {
          var v = vals[c], stl = styles ? styles[c] : 0, sa = stl ? ' s="' + stl + '"' : '';
          if (v === null || v === undefined || v === '') { if (stl === 1) s += '<c r="' + colLetter(c) + rowN + '"' + sa + '/>'; skip = true; continue; }
          var ref = skip ? ' r="' + colLetter(c) + rowN + '"' : ''; skip = false;
          if (typeof v === 'number') { if (isFinite(v)) s += '<c' + ref + sa + '><v>' + v + '</v></c>'; }
          else if (v instanceof XD) s += '<c' + ref + (hasTime(v) ? ' s="6"' : ' s="2"') + '><v>' + v.s + '</v></c>';
          else if (typeof v === 'boolean') s += '<c' + ref + sa + ' t="b"><v>' + (v ? 1 : 0) + '</v></c>';
          else { var str = String(v); if (str.length > 32767) str = str.slice(0, 32767); s += '<c' + ref + sa + ' t="s"><v>' + self.si(str) + '</v></c>'; }
        }
        s += '</row>';
        buf.push(s); blen += s.length;
        if (blen > 1000000) flush(false);
      },
      end: function (tail) {
        var t = '</sheetData>';
        if (opts.filter) t += '<autoFilter ref="A1:' + colLetter(opts.filter.cols - 1) + Math.max(1, opts.filter.rows + 1) + '"/>';
        if (opts.cf && opts.cf.rows > 0) {
          var ref = 'A2:' + colLetter(opts.cf.cols - 1) + (opts.cf.rows + 1), pr = 1;
          opts.cf.rules.forEach(function (rl) { t += '<conditionalFormatting sqref="' + ref + '"><cfRule type="expression" dxfId="' + rl.dxf + '" priority="' + (pr++) + '"><formula>$A2="' + xesc(rl.text) + '"</formula></cfRule></conditionalFormatting>'; });
        }
        t += '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>';
        buf.push(t); flush(true);
      }
    };
  };
  XlsxWriter.prototype.finish = function () {
    var n = this.sheets.length, names = this.sheets;
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>';
    for (var i = 1; i <= n; i++) ct += '<Override PartName="/xl/worksheets/sheet' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    ct += '</Types>';
    this.file('[Content_Types].xml', ct);
    this.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
    var now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    this.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Kết quả ghép &amp; đối chiếu</dc:title><dc:creator>Quản trị tử tế</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>');
    this.file('docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>');
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>';
    for (i = 0; i < n; i++) wb += '<sheet name="' + xesc(names[i]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
    wb += '</sheets>';
    var dn = '';
    for (i = 0; i < n; i++) if (this.filters && this.filters[i]) dn += '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + xesc(names[i]).replace(/'/g, "''") + '\'!$A$1:$' + colLetter(this.filters[i].cols - 1) + '$' + Math.max(1, this.filters[i].rows + 1) + '</definedName>';
    if (dn) wb += '<definedNames>' + dn + '</definedNames>';
    wb += '</workbook>';
    this.file('xl/workbook.xml', wb);
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    for (i = 0; i < n; i++) rels += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
    rels += '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId' + (n + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>';
    this.file('xl/_rels/workbook.xml.rels', rels);
    this.file('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm:ss"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FF16401F"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFBFE3C8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFD966"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="4"><dxf><fill><patternFill><bgColor rgb="FFE3F3E6"/></patternFill></fill></dxf><dxf><fill><patternFill><bgColor rgb="FFFFF3C4"/></patternFill></fill></dxf><dxf><fill><patternFill><bgColor rgb="FFFBE0DE"/></patternFill></fill></dxf><dxf><fill><patternFill><bgColor rgb="FFDCEBFB"/></patternFill></fill></dxf></dxfs></styleSheet>');
    // sharedStrings – ghi theo từng phần
    var f = new fflate.ZipDeflate('xl/sharedStrings.xml', { level: 1 }); this.zip.add(f);
    var list = this.sstList, parts = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + this.sstCount + '" uniqueCount="' + list.length + '">'], len = 0;
    for (i = 0; i < list.length; i++) {
      var s = list[i], sp = /^\s|\s$|\n/.test(s) ? ' xml:space="preserve"' : '';
      var e = '<si><t' + sp + '>' + xesc(s) + '</t></si>'; parts.push(e); len += e.length;
      if (len > 1000000) { f.push(fflate.strToU8(parts.join(''))); parts = []; len = 0; }
    }
    parts.push('</sst>'); f.push(fflate.strToU8(parts.join('')), true);
    this.zip.end();
    return new Blob(this.chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  function sanitizeSheet(n) { var s = String(n).replace(/[:\\\/\?\*\[\]]/g, '-'); if (s.length > 31) s = s.slice(0, 31); return s.trim() || 'Sheet'; }

  function exportExcel() {
    var L = S.last; if (!L) throw FriendlyError('Chưa có kết quả để xuất. Vui lòng chạy ghép dữ liệu trước.');
    var t0 = Date.now(), cfg = L.cfg, stats = L.stats;
    progress('Đang tạo workbook...', 5);
    var W = new XlsxWriter(); W.filters = [];
    // Tổng hợp
    var cl = []; var c = cfg.clean || {};
    if (c.trimSpaces) cl.push('Bỏ khoảng trắng thừa'); if (c.caseInsensitive) cl.push('Không phân biệt hoa/thường'); if (c.normalizeUnicode) cl.push('Đồng nhất Unicode tiếng Việt'); if (c.numericEquivalence) cl.push('Coi số dạng chữ và số là một'); if (c.dateOnly) cl.push('Khớp ngày/tháng/năm, bỏ qua giờ và định dạng ngày'); if (c.alnumOnly) cl.push('Chỉ giữ chữ và số'); if (c.noAccent) cl.push('Bỏ dấu tiếng Việt'); if (c.phone) cl.push('Chuẩn hoá số điện thoại');
    function fi(st) { return st.fileName + '  (sheet: ' + st.sheetName + ', dòng tiêu đề: ' + (st.headerRow + 1) + ')'; }
    var now = new Date();
    var sum = [['THÔNG TIN GHÉP & ĐỐI CHIẾU DỮ LIỆU', ''], ['Thời điểm xuất file', p2(now.getHours()) + ':' + p2(now.getMinutes()) + ':' + p2(now.getSeconds()) + ' ' + p2(now.getDate()) + '/' + p2(now.getMonth() + 1) + '/' + now.getFullYear()], ['', ''],
      ['File A', fi(S.A)], ['Số dòng / cột File A', S.A.data.length + ' dòng, ' + S.A.columns.length + ' cột'],
      ['File B', fi(S.B)], ['Số dòng / cột File B', S.B.data.length + ' dòng, ' + S.B.columns.length + ' cột']];
    [['A', S.A], ['B', S.B]].forEach(function (x) { if (x[1].removed && x[1].removed.length) sum.push(['Dòng tổng cộng/chữ ký đã bỏ ở File ' + x[0], x[1].removed.length + ' dòng: ' + x[1].removed.slice(0, 6).map(function (r) { return 'dòng ' + r.row + ' "' + r.text + '"'; }).join('; ') + (x[1].removed.length > 6 ? '…' : '')]); });
    sum.push(['', ''], ['Thỏa mãn đồng thời các điều kiện', validPairs(cfg.keyPairs, 'a', 'b').map(function (p) { return p.a + '  =  ' + p.b; }).join(' ;  ') || '(không có)'], ['Tuỳ chọn làm sạch khóa', cl.length ? cl.join(', ') : '(không bật tuỳ chọn nào)'], ['Xử lý khóa trùng', cfg.duplicateHandling === 'all' ? 'Lấy đủ tất cả các dòng' : (cfg.duplicateHandling === 'one' ? 'Ghép 1–1: mỗi dòng chỉ ghép 1 lần, theo thứ tự' : 'Chỉ lấy dòng đầu tiên (giống VLOOKUP)')], ['Kiểu ghép đã chọn', JOIN_LABELS[L.jt]]);
    if (cfg.amountTol && (+cfg.amountTol.abs > 0 || +cfg.amountTol.pct > 0)) sum.push(['Dung sai số tiền khi khớp', (+cfg.amountTol.abs > 0 ? '± ' + fmtNum(+cfg.amountTol.abs) + ' đồng' : '') + (+cfg.amountTol.abs > 0 && +cfg.amountTol.pct > 0 ? ' hoặc ' : '') + (+cfg.amountTol.pct > 0 ? '± ' + String(cfg.amountTol.pct).replace('.', ',') + '%' : '') + ' – khớp chính xác trước, dung sai sau; ' + (stats.tolMatched || 0) + ' dòng khớp nhờ dung sai']);
    [['A', S.A], ['B', S.B]].forEach(function (x) { if (x[1].grouped) sum.push(['Gộp dòng ở File ' + x[0], 'Theo ' + x[1].grouped.cols.join(' + ') + ': ' + x[1].grouped.from + ' dòng → ' + x[1].grouped.to + ' dòng; cộng các cột ' + (x[1].grouped.summed.join(', ') || '(không có cột số)')]); });
    var orp = validPairs(cfg.orPairs, 'a', 'b');
    if (orp.length) { var ki = sum.findIndex(function (x) { return x[0] === 'Thỏa mãn đồng thời các điều kiện'; }); sum.splice(ki + 1, 0, ['Thỏa mãn một trong các điều kiện', orp.map(function (p) { return p.a + '  =  ' + p.b; }).join('  HOẶC  ') + ' (ô trống hoặc 0 không tính)']); }
    if (L.jt === 7 && cfg.comparePairs && cfg.comparePairs.length) sum.push(['Cặp cột so sánh', cfg.comparePairs.filter(function (p) { return p.aCol && p.bCol; }).map(function (p) { return p.aCol + ' ⇄ ' + p.bCol + (p.tolerance !== '' && p.tolerance != null ? ' (lệch cho phép ' + p.tolerance + ')' : ''); }).join(' ;  ')]);
    sum.push(['', ''], ['Tổng số dòng kết quả', stats.totalRows], [stats.hasCompare ? 'Số dòng khớp hoàn toàn' : 'Số dòng khớp', stats.matchedCount], ['Chỉ có ở File A', stats.onlyACount], ['Chỉ có ở File B', stats.onlyBCount]);
    if (stats.hasCompare) sum.push(['Số dòng lệch giá trị', stats.mismatchCount]);
    if (L.sg) sum.push(['Cảnh báo 1 dòng = tổng nhiều dòng cùng ngày', L.sg.error ? L.sg.error : (L.sg.groups.length + ' nhóm, ' + L.sg.order.length + ' dòng (vẫn tính trong Chỉ có ở A / Chỉ có ở B) – xem sheet "Khớp tổng (cảnh báo)"')]);
    if (L.dw) sum.push(['Cảnh báo trùng số liệu, lệch ngày (≤ ' + L.dw.days + ' ngày)', L.dw.error ? L.dw.error : (L.dw.pairs + ' cặp (vẫn tính trong Chỉ có ở A / Chỉ có ở B) – xem sheet "Lệch ngày (cảnh báo)"')]);
    sum.push(['Thời gian xử lý', (stats.elapsedMs / 1000).toFixed(2).replace('.', ',') + ' giây']);
    if (stats.exceedsExcelLimit) sum.push(['CẢNH BÁO', 'Kết quả vượt quá ' + fmtNum(EXCEL_ROW_LIMIT) + ' dòng – giới hạn của 1 sheet Excel. Dữ liệu đã được tách sang nhiều sheet liên tiếp.']);
    var ws = W.sheet('Tổng hợp', { widths: [38, 22, 22, 22, 22, 22, 22] });
    sum.forEach(function (r) { ws.row(r, [/^[A-ZĐÂĂÊÔƠƯÁÀẢÃẠ\s&]+$/.test(r[0]) && r[0] ? 3 : 0, typeof r[1] === 'number' ? 4 : 0]); });
    if (L.totals.length) {
      ws.row(['', '']); ws.row(['ĐỐI CHIẾU TỔNG TIỀN (A − B)', '']);
      ws.row(['Cột so sánh', 'Tổng File A', 'Tổng File B', 'Chênh lệch A − B', 'Do lệch trên dòng khớp', 'Do dòng chỉ có ở A', 'Do dòng chỉ có ở B (trừ đi)'], [1, 1, 1, 1, 1, 1, 1]);
      L.totals.forEach(function (t) { ws.row([t.label, t.sumA, t.sumB, t.diff, t.diffMatched, t.onlyA, t.onlyB], [3, 4, 4, 5, 4, 4, 4]); });
      ws.row(['Số dòng lệch theo từng cột', '']);
      L.totals.forEach(function (t) { ws.row([t.label, t.mismatch], [0, 4]); });
      L.textPairs.forEach(function (t) { ws.row([t.label, t.mismatch], [0, 4]); });
    }
    ws.end(); W.filters.push(null);

    // độ rộng cột
    var cols = L.columns, ncol = cols.length;
    var widths = cols.map(function (cn) { return Math.max(String(cn).length + 2, 11); });
    var sampleN = Math.min(L.ia.length, 3000);
    for (var r = 0; r < sampleN; r++) { var vals = L.rowValues(r); for (var k = 0; k < ncol; k++) { var dl = disp(vals[k]).length + 2; if (dl > widths[k]) widths[k] = dl; } }
    widths = widths.map(function (w) { return Math.min(w, 42); });
    var hdrStyles = cols.map(function () { return 1; });
    // cột số: dùng định dạng có dấu phân cách nghìn khi toàn số nguyên, còn lại để General
    var intCol = L.types.map(function () { return true; });
    for (r = 0; r < sampleN; r++) { var vv = L.rowValues(r); for (k = 0; k < ncol; k++) { var x = vv[k]; if (typeof x === 'number' && Math.abs(x - Math.round(x)) > 1e-9) intCol[k] = false; } }
    var numStyles = L.types.map(function (t, i) { return t === 'number' && intCol[i] ? 4 : 0; });
    var rules = [{ text: 'Khớp', dxf: 0 }, { text: 'Lệch giá trị', dxf: 1 }, { text: 'Chỉ có ở A', dxf: 2 }, { text: 'Chỉ có ở B', dxf: 3 }];

    function writeBucket(base, filterSt, pFrom, pTo) {
      var list = [];
      if (filterSt === 'S') { list = L.sg && L.sg.order ? L.sg.order.slice() : []; }
      else if (filterSt === 'W') { list = L.dw && L.dw.order ? Array.prototype.slice.call(L.dw.order) : []; }
      else if (filterSt < 0) { for (var i = 0; i < L.ia.length; i++) list.push(i); } else { for (i = 0; i < L.st.length; i++) if (L.st[i] === filterSt) list.push(i); }
      var nChunks = Math.max(1, Math.ceil(list.length / EXCEL_ROW_LIMIT)), done = 0;
      for (var ch = 0; ch < nChunks; ch++) {
        var part = list.slice(ch * EXCEL_ROW_LIMIT, (ch + 1) * EXCEL_ROW_LIMIT);
        var name = sanitizeSheet(nChunks === 1 ? base : base + ' ' + (ch + 1));
        var fl = { cols: ncol, rows: part.length };
        var s = W.sheet(name, { freeze: true, widths: widths, filter: fl, cf: L.statusIncluded ? { rows: part.length, cols: ncol, rules: rules } : null });
        W.filters.push(fl);
        s.row(cols, hdrStyles);
        for (var j = 0; j < part.length; j++) {
          var hl = L.hlOf ? L.hlOf(part[j]) : null;
          if (hl) { var stl = numStyles.slice(); hl.forEach(function (ci) { stl[ci] = numStyles[ci] === 4 ? 8 : 7; }); s.row(L.rowValues(part[j]), stl); }
          else s.row(L.rowValues(part[j]), numStyles);
          done++;
          if ((done & 16383) === 0) progress('Đang ghi sheet "' + base + '"...', pFrom + Math.round(done / Math.max(1, list.length) * (pTo - pFrom)));
        }
        s.end();
      }
    }
    if (L.statusIncluded) {
      var buckets = [['Tất cả', -1], ['Khớp', 0], ['Lệch giá trị', 3]];
      if (L.dw && !L.dw.error) buckets.push(['Lệch ngày (cảnh báo)', 'W']);
      if (L.sg && !L.sg.error) buckets.push(['Khớp tổng (cảnh báo)', 'S']);
      buckets.push(['Chỉ có ở A', 1], ['Chỉ có ở B', 2]);
      var pp = 10;
      buckets.forEach(function (b) { var w = b[1] < 0 ? 40 : 10; writeBucket(b[0], b[1], pp, pp + w); pp += w; });
    } else writeBucket('Kết quả', -1, 10, 88);
    progress('Đang đóng gói file...', 92);
    var blob = W.finish();
    var d = new Date(), fn = 'KetQua_Ghep_' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.xlsx';
    return { blob: blob, fileName: fn, ms: Date.now() - t0 };
  }

  /* ---------------- Đổi chỗ A ↔ B ---------------- */
  function clearFiles() { S.A = null; S.B = null; S.last = null; S.keyCache = {}; return true; }
  function swapAB() {
    var t = S.A; S.A = S.B; S.B = t; S.last = null; S.keyCache = {};
    return { A: S.A && S.A.data ? sheetInfo('A') : null, B: S.B && S.B.data ? sheetInfo('B') : null };
  }

  /* ---------------- Dữ liệu mẫu ---------------- */
  function rng(seed) { var x = seed >>> 0; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function loadSampleData(kind) {
    var R = rng(20261021), pick = function (a) { return a[Math.floor(R() * a.length)]; }, ri = function (a, b) { return a + Math.floor(R() * (b - a + 1)); };
    var HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
    var TEN = ['Văn An', 'Thị Bình', 'Minh Châu', 'Thu Duyên', 'Quốc Đạt', 'Thị Giang', 'Hữu Hải', 'Thanh Huyền', 'Đức Khang', 'Ngọc Lan', 'Văn Long', 'Thị Mai', 'Hoàng Nam', 'Kim Oanh', 'Tấn Phát', 'Thu Quỳnh', 'Văn Sơn', 'Thị Thảo', 'Anh Tuấn', 'Bích Vân'];
    var KV = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nghệ An', 'Bình Dương', 'Khánh Hoà'];
    var CTY = ['Công ty TNHH', 'Công ty CP', 'DNTN'], NG = ['Thương mại', 'Xây dựng', 'Thực phẩm', 'Vận tải', 'Nội thất', 'Công nghệ'];
    var SP = [['Bàn phím cơ', 350000], ['Chuột không dây', 180000], ['Màn hình 24 inch', 2800000], ['Ghế văn phòng', 1450000], ['Đèn bàn LED', 220000], ['Ổ cứng SSD 512GB', 890000], ['Webcam Full HD', 420000], ['Tai nghe chụp tai', 560000], ['Bàn nâng hạ', 3200000], ['Loa vi tính mini', 150000]];
    var codes = [], cust = [], names = {};
    for (var i = 1; i <= 300; i++) {
      var code = 'KH' + String(i).padStart(4, '0'); codes.push(code);
      var biz = R() < 0.35, nm = biz ? pick(CTY) + ' ' + pick(HO) + ' ' + pick(NG) : pick(HO) + ' ' + pick(TEN); names[code] = nm;
      cust.push([code, nm, pick(KV), biz ? 'Doanh nghiệp' : 'Cá nhân', new XD(dateToSerial(2023, ri(1, 12), ri(1, 28)))]);
    }
    [7, 32, 88, 150, 210].forEach(function (k) { cust[k][0] = ' ' + cust[k][0] + '  '; });
    [15, 60, 140].forEach(function (k) { cust[k][0] = cust[k][0].toLowerCase(); });
    [20, 120, 260].forEach(function (k) { var d = cust[k].slice(); d[1] = pick(HO) + ' ' + pick(TEN) + ' (trùng mã)'; cust.push(d); });
    var orders = [];
    for (var j = 1; j <= 2000; j++) {
      var c2 = R() < 0.03 ? 'KH' + ri(9001, 9099) : codes[ri(0, 280)];
      if (R() < 0.04) c2 = c2.toLowerCase(); if (R() < 0.04) c2 = ' ' + c2 + ' ';
      var sp = pick(SP), sl = ri(1, 20);
      orders.push(['DH' + String(j).padStart(5, '0'), new XD(dateToSerial(2026, ri(3, 9), ri(1, 28))), c2, sp[0], sl, sp[1], sl * sp[1]]);
    }
    var ordAoa = [['BÁO CÁO ĐƠN HÀNG'], [], ['Số đơn hàng', 'Ngày đặt', 'Mã khách hàng', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']].concat(orders);
    var bName, bAoa;
    if (kind === 'ledger') {
      // Sổ chi tiết bán hàng của kế toán: thiếu vài đơn, lệch tiền vài đơn, có dòng Cộng + chữ ký
      var led = [], total = 0, n = 0;
      orders.forEach(function (o, k) {
        if (R() < 0.02) return;                      // đơn chưa ghi sổ
        var amt = o[6]; if (R() < 0.015) amt = amt + pick([10000, 50000, -100000, 500000]);
        n++; total += amt;
        led.push([o[1], 'BH26-' + String(n).padStart(5, '0'), o[0], String(o[2]).trim().toUpperCase(), names[String(o[2]).trim().toUpperCase()] || '', 'Bán hàng theo đơn ' + o[0], amt, Math.round(amt * 0.08), 131, 5111]);
      });
      for (var x = 0; x < 6; x++) { var amt2 = ri(5, 60) * 100000; total += amt2; led.push([new XD(dateToSerial(2026, 9, ri(1, 28))), 'BH26-9' + x, 'DH9' + String(x).padStart(4, '0'), pick(codes), '', 'Bán lẻ không qua đơn', amt2, Math.round(amt2 * 0.08), 131, 5111]); }
      bName = 'So_chi_tiet_ban_hang_mau.xlsx';
      bAoa = [['CÔNG TY TNHH MẪU'], ['SỔ CHI TIẾT BÁN HÀNG'], [], ['Ngày hạch toán', 'Số chứng từ', 'Số đơn hàng', 'Mã khách hàng', 'Tên khách hàng', 'Diễn giải', 'Doanh thu', 'Thuế GTGT', 'TK Nợ', 'TK Có']].concat(led)
        .concat([['Cộng', undefined, undefined, undefined, undefined, undefined, total, Math.round(total * 0.08)], [], [undefined, 'Người ghi sổ', undefined, undefined, undefined, 'Kế toán trưởng'], [undefined, '(Ký, họ tên)', undefined, undefined, undefined, '(Ký, họ tên)']]);
    } else {
      bName = 'Danh_muc_khach_hang_mau.xlsx';
      bAoa = [['DANH MỤC KHÁCH HÀNG - CẬP NHẬT 09/2026'], [], ['Mã KH', 'Tên khách hàng', 'Khu vực', 'Loại khách', 'Ngày tạo']].concat(cust);
    }
    function mk(name, aoa) { var rows = aoa.map(function (r) { return r.length ? r : undefined; }); return { fileName: name, kind: 'excel', reader: { sheetNames: ['Sheet1'], getRows: function () { return rows; } }, sheetNames: ['Sheet1'], raw: {}, sheetName: null }; }
    S.A = mk('Don_hang_mau.xlsx', ordAoa); S.B = mk(bName, bAoa); S.last = null; S.keyCache = {};
    return { A: loadSheet('A', 'Sheet1', null), B: loadSheet('B', 'Sheet1', null) };
  }

  /* ---------------- Thiết lập: kiểm tra cột còn tồn tại ---------------- */
  function columnsOf() { return { A: S.A && S.A.columns ? S.A.columns : [], B: S.B && S.B.columns ? S.B.columns : [] }; }

  return {
    setProgress: function (fn) { progressFn = fn; },
    setSheetJS: function (urls) { sheetjsUrls = urls || []; },
    loadFileBuffer: loadFileBuffer, loadSheet: loadSheet, loadSampleData: loadSampleData, swapAB: swapAB, clearFiles: clearFiles,
    suggestKeys: suggestKeys, suggestOrPairs: suggestOrPairs, suggestPairs: suggestPairs, checkKeys: checkKeys, suggestComparePairs: suggestComparePairs,
    runMerge: runMerge, getPage: getPage, exportExcel: exportExcel, columnsOf: columnsOf,
    _S: S, _XD: XD
  };
})();
