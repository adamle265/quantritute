/* Bộ đọc Excel (.xlsx đọc thẳng XML; .xls/.xlsb dùng SheetJS khi cần) – lấy từ công cụ Ghép & đối chiếu */
var XR = (function () {
  'use strict';
  var progress = function () {};
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
  var ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

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
  function isXlsx(buf) { var u = new Uint8Array(buf.buffer || buf, buf.byteOffset || 0, 4); return u[0] === 0x50 && u[1] === 0x4B; }
  function open(buf, name) {
    var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (/\.(xlsx|xlsm)$/i.test(name || '') || isXlsx(u8)) { try { return readXlsxFast(u8); } catch (e) { if (e.friendly) throw e; } }
    return readWithSheetJS(u8);
  }
  return { open: open, XD: XD, serialToParts: serialToParts, dateToSerial: dateToSerial,
    setSheetJS: function (u) { sheetjsUrls = u || []; }, isXD: function (v) { return v instanceof XD; } };
})();
if (typeof module !== 'undefined') module.exports = XR;
