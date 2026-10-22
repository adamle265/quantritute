/* ==========================================================================
   HD-CORE – lõi dùng chung cho Bộ xử lý hóa đơn điện tử (Quản trị tử tế)
   Không dùng thư viện ngoài. Chạy trên Chrome/Edge/Firefox/Safari đời mới.
   Gồm: nhật ký, ngày tháng, đọc/ghi ZIP, ghi Excel (.xlsx), đọc XML hóa đơn,
   phân tích bộ hóa đơn và dựng 4 sheet.
   ========================================================================== */
var HDCore = (function () {
  'use strict';
  var VERSION = '1.0.0';

  /* ---------------- tiện ích chung ---------------- */
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }
  function nowStamp() { var d = new Date(); return '[' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ']'; }
  function maskTail(v) { v = String(v == null ? '' : v); return v.length <= 3 ? v.replace(/./g, '*') : v.slice(0, -3).replace(/./g, '*') + v.slice(-3); }
  function scrub(s) {
    s = String(s);
    s = s.replace(/(Bearer\s+)([A-Za-z0-9\-_.]+)/g, function (m, a, b) { return a + maskTail(b); });
    s = s.replace(/eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, function (m) { return maskTail(m); });
    s = s.replace(/("?(?:password|matkhau|token|jwt|cvalue|ckey|cccd)"?\s*[:=]\s*"?)([^"&\s,}]+)/gi, function (m, a, b) { return a + maskTail(b); });
    s = s.replace(/(^|[^\d])(\d{12,25})(?!\d)/g, function (m, a, b) { return a + maskTail(b); });
    return s;
  }
  function Logger(name) {
    this.name = name || 'nhat-ky'; this.lines = [];
  }
  Logger.prototype.ghi = function (s) { var l = nowStamp() + ' ' + scrub(s); this.lines.push(l); if (this.lines.length > 20000) this.lines.splice(0, 5000); return l; };
  Logger.prototype.loi = function (s, e) { this.ghi('[LOI] ' + s + (e ? ' | ' + (e && e.stack ? e.stack : e) : '')); };
  Logger.prototype.phanCach = function (t) { this.lines.push(''); this.ghi('===== ' + t + ' ====='); };
  Logger.prototype.text = function () { return '﻿' + this.lines.join('\r\n') + '\r\n'; };

  function boDau(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }
  function num(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    var s = String(v).trim().replace(/\s/g, '');
    if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    if (/^-?[\d.]+,\d+$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    var n = parseFloat(s.replace(/,/g, '')); return isNaN(n) ? 0 : n;
  }
  function fmtMoney(n) { n = Math.round(num(n)); var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (n < 0 ? '-' : '') + s; }

  /* ---------------- ngày tháng: hiển thị dd/mm/yyyy ---------------- */
  // nhận '2026-09-13', '2026-09-13T10:00:00', '13/09/2026' → {d,m,y}
  function parseDate(s) {
    s = String(s || '').trim(); var m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return { y: +m[1], m: +m[2], d: +m[3] };
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return { y: +m[3], m: +m[2], d: +m[1] };
    return null;
  }
  function validDMY(s) {
    var p = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '')); if (!p) return false;
    var d = new Date(+p[3], +p[2] - 1, +p[1]); return d.getFullYear() === +p[3] && d.getMonth() === +p[2] - 1 && d.getDate() === +p[1];
  }
  function dmy(s) { var p = parseDate(s); return p ? pad(p.d) + '/' + pad(p.m) + '/' + p.y : ''; }
  function ymdCompact(s) { var p = parseDate(s); return p ? p.y + pad(p.m) + pad(p.d) : '00000000'; }
  function excelSerial(s) { var p = parseDate(s); if (!p) return null; return Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(1899, 11, 30)) / 86400000); }
  function dmyToDate(s) { var p = parseDate(s); return p ? new Date(p.y, p.m - 1, p.d) : null; }
  // Cổng thuế trả tdlap theo giờ UTC (vd HĐ ngày 02/07 → "2026-07-01T17:00:00"). Đổi sang ngày Việt Nam (UTC+7), trả 'yyyy-mm-dd'.
  // Kiểm chứng 17/10/2026: K26TDV-319742 cổng trả 01/07, XML/công cụ khác ghi 02/07; C26MNE-3172 trả 29/09, thực tế 30/09.
  function ngayVN(s) {
    s = String(s || '');
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?/);
    if (!m) return s.slice(0, 10);
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)), tz = m[7];
    if (tz && tz !== 'Z') { var sg = tz[0] === '-' ? -1 : 1, t = tz.replace(':', ''); ms -= sg * (+t.substr(1, 2) * 60 + +t.substr(3, 2)) * 60000; }
    var d = new Date(ms + 7 * 3600000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function dateToDMY(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  // tách khoảng ngày thành từng tháng (máy chủ thuế giới hạn 1 tháng/lần tra cứu)
  function splitMonths(fromDMY, toDMY) {
    var a = dmyToDate(fromDMY), b = dmyToDate(toDMY), out = [];
    if (!a || !b || a > b) return out;
    var cur = new Date(a);
    while (cur <= b) {
      var end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      if (end > b) end = new Date(b);
      out.push([dateToDMY(cur), dateToDMY(end)]);
      cur = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    }
    return out;
  }
  // mặt nạ ô nhập dd/mm/yyyy
  function maskDMY(inp) {
    inp.addEventListener('input', function () {
      var v = inp.value.replace(/\D/g, '').slice(0, 8);
      if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
      else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      inp.value = v;
    });
  }

  /* ---------------- tên file ---------------- */
  function slugDoiTac(ten) {
    var t = boDau(ten).toUpperCase(), cn = '';
    var mCN = t.match(/^\s*CHI NHANH\b.*?\s[-–]\s*(.+)$/);
    if (mCN) { cn = 'CN-'; t = mCN[1]; }
    var laCty = !cn && /^\s*(CONG TY|CTY|CT)\b/.test(t);
    for (var i = 0; i < 6; i++) {
      var moi = t.replace(/^\s*(CONG TY|CTY|CT|TNHH|MTV|MOT THANH VIEN|CO PHAN|CP|CHI NHANH|DOANH NGHIEP TU NHAN|DNTN|TM VA DV|TM & DV|THUONG MAI VA DICH VU|HO KINH DOANH|HKD)\b[\s\-&,.]*/, '').trim();
      if (moi === t) break; t = moi;
    }
    var words = t.replace(/[^A-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean), slug = '';
    for (var j = 0; j < words.length; j++) { if (slug && (slug.length + 1 + words[j].length) > 22) break; slug = slug ? slug + '-' + words[j] : words[j]; }
    slug = slug.slice(0, 26).replace(/-+$/, '');
    if (!slug) return 'KHONG-RO';
    return cn ? cn + slug : (laCty ? 'CTY-' + slug : slug);
  }
  function tenFileHD(ngay, kyHieu, so, doiTac) {
    var s = String(so == null ? '' : so).replace(/\D/g, '') || '0';
    return ymdCompact(ngay) + '_' + (String(kyHieu || 'XX').replace(/[^A-Za-z0-9]/g, '') || 'XX') + '_' + pad(s, 8) + '_' + slugDoiTac(doiTac);
  }

  /* ---------------- CRC32 ---------------- */
  var CRC_T = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  var enc = new TextEncoder();
  function toU8(x) { if (x instanceof Uint8Array) return x; if (x instanceof ArrayBuffer) return new Uint8Array(x); return enc.encode(String(x)); }

  async function streamBytes(u8, stream) {
    var s = new Blob([u8]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  var canDeflate = typeof CompressionStream !== 'undefined';
  var canInflate = typeof DecompressionStream !== 'undefined';

  /* ---------------- đọc ZIP ---------------- */
  async function unzip(buf) {
    var u8 = toU8(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), out = [];
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('Không phải file ZIP hợp lệ');
    var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
    for (var e = 0; e < count; e++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var flag = dv.getUint16(off + 8, true), method = dv.getUint16(off + 10, true);
      var csize = dv.getUint32(off + 20, true), nlen = dv.getUint16(off + 28, true), xlen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
      var lho = dv.getUint32(off + 42, true);
      var nameBytes = u8.subarray(off + 46, off + 46 + nlen);
      var name; try { name = new TextDecoder(flag & 0x800 ? 'utf-8' : 'utf-8', { fatal: true }).decode(nameBytes); } catch (er) { name = Array.prototype.map.call(nameBytes, function (b) { return String.fromCharCode(b); }).join(''); }
      off += 46 + nlen + xlen + clen;
      if (/\/$/.test(name)) continue;
      var lnl = dv.getUint16(lho + 26, true), lxl = dv.getUint16(lho + 28, true);
      var start = lho + 30 + lnl + lxl, data = u8.subarray(start, start + csize);
      out.push({ name: name, method: method, data: data });
    }
    for (var k = 0; k < out.length; k++) {
      var it = out[k];
      if (it.method === 0) it.bytes = it.data;
      else if (it.method === 8) {
        if (!canInflate) throw new Error('Trình duyệt quá cũ, không giải nén được. Hãy dùng Chrome hoặc Edge bản mới.');
        it.bytes = await streamBytes(it.data, new DecompressionStream('deflate-raw'));
      } else it.bytes = null;
      delete it.data;
    }
    return out;
  }

  /* ---------------- ghi ZIP ---------------- */
  function ZipWriter() { this.files = []; }
  ZipWriter.prototype.add = function (name, data, opts) { this.files.push({ name: name, data: data, store: opts && opts.store }); };
  ZipWriter.prototype.blob = async function (mime) {
    var parts = [], central = [], offset = 0, d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (var i = 0; i < this.files.length; i++) {
      var f = this.files[i], raw = toU8(f.data), nameB = enc.encode(f.name), crc = crc32(raw), comp = raw, method = 0;
      if (!f.store && canDeflate && raw.length > 256) { try { comp = await streamBytes(raw, new CompressionStream('deflate-raw')); method = 8; } catch (e) { comp = raw; method = 0; } }
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, method, true);
      lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true); lh.setUint32(18, comp.length, true); lh.setUint32(22, raw.length, true);
      lh.setUint16(26, nameB.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, nameB, comp);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, method, true);
      ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, comp.length, true); ch.setUint32(24, raw.length, true);
      ch.setUint16(28, nameB.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, nameB);
      offset += 30 + nameB.length + comp.length;
    }
    var csize = 0; central.forEach(function (p) { csize += p.byteLength; });
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, this.files.length, true); end.setUint16(10, this.files.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: mime || 'application/zip' });
  };

  /* ---------------- ghi Excel .xlsx ----------------
     sheets: [{name, cols:[{h, t:'s'|'n'|'n4'|'d'|'i', w}], rows:[[...]], foot:[...]?}]
     t: s=chữ, n=số tiền #,##0, n4=số lẻ, d=ngày dd/mm/yyyy, i=số nguyên */
  function xesc(s) { return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function colName(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  async function xlsxBlob(sheets) {
    var STY = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="#,##0.####"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy"/></numFmts>' +
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8A5A2B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF6E7D3"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD3C7B4"/></left><right style="thin"><color rgb="FFD3C7B4"/></right><top style="thin"><color rgb="FFD3C7B4"/></top><bottom style="thin"><color rgb="FFD3C7B4"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="11">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
      '<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '<xf numFmtId="49" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
      '<xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
      '<xf numFmtId="1" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    function cell(ref, v, t, foot) {
      if (v === null || v === undefined || v === '') return '<c r="' + ref + '" s="' + (foot ? 7 : 2) + '"/>';
      if (t === 'n' || t === 'n4' || t === 'i' || t === 'd') {
        var x = t === 'd' ? excelSerial(v) : num(v);
        if (x === null || (typeof v === 'string' && t !== 'd' && v.trim() !== '' && isNaN(parseFloat(String(v).replace(/[.,\s]/g, ''))))) return '<c r="' + ref + '" s="2" t="inlineStr"><is><t xml:space="preserve">' + xesc(v) + '</t></is></c>';
        var st = foot ? (t === 'i' ? 9 : 8) : (t === 'n' ? 3 : t === 'n4' ? 4 : t === 'd' ? 5 : 6);
        return '<c r="' + ref + '" s="' + st + '"><v>' + (Math.round(x * 10000) / 10000) + '</v></c>';
      }
      return '<c r="' + ref + '" s="' + (foot ? 7 : 2) + '" t="inlineStr"><is><t xml:space="preserve">' + xesc(v) + '</t></is></c>';
    }
    var z = new ZipWriter();
    var wsXml = sheets.map(function (sh) {
      var cols = sh.cols, rowsX = [], r = 0;
      (sh.pre || []).forEach(function (line, i) { r++; rowsX.push('<row r="' + r + '">' + (line ? '<c r="A' + r + '" s="' + (i === 0 ? 10 : 0) + '" t="inlineStr"><is><t xml:space="preserve">' + xesc(line) + '</t></is></c>' : '') + '</row>'); });
      if (sh.grp) { r++; rowsX.push('<row r="' + r + '">' + sh.grp.map(function (g) { return '<c r="' + colName(g[0] + 1) + r + '" s="10" t="inlineStr"><is><t xml:space="preserve">' + xesc(g[1]) + '</t></is></c>'; }).join('') + '</row>'); }
      r++; var hr = r;
      rowsX.push('<row r="' + r + '" ht="32" customHeight="1">' + cols.map(function (c, i) { return '<c r="' + colName(i + 1) + r + '" s="1" t="inlineStr"><is><t xml:space="preserve">' + xesc(c.h) + '</t></is></c>'; }).join('') + '</row>');
      sh.rows.forEach(function (row) { r++; rowsX.push('<row r="' + r + '">' + row.map(function (v, i) { return cell(colName(i + 1) + r, v, (cols[i] || {}).t || 's'); }).join('') + '</row>'); });
      if (sh.foot) { r++; rowsX.push('<row r="' + r + '">' + sh.foot.map(function (v, i) { return cell(colName(i + 1) + r, v, (cols[i] || {}).t || 's', true); }).join('') + '</row>'); }
      var last = colName(cols.length);
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + hr + '" topLeftCell="A' + (hr + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
        '<cols>' + cols.map(function (c, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (c.w || 14) + '" customWidth="1"/>'; }).join('') + '</cols>' +
        '<sheetData>' + rowsX.join('') + '</sheetData>' + (sh.rows.length && !sh.noFilter ? '<autoFilter ref="A' + hr + ':' + last + (hr + sh.rows.length) + '"/>' : '') + '</worksheet>';
    });
    var n = sheets.length;
    z.add('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    z.add('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    z.add('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + xesc(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets><definedNames>' + sheets.map(function (s, i) { var h0 = (s.pre ? s.pre.length : 0) + (s.grp ? 1 : 0) + 1; return s.rows.length && !s.noFilter ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + xesc(s.name.slice(0, 31)) + '\'!$A$' + h0 + ':$' + colName(s.cols.length) + '$' + (s.rows.length + h0) + '</definedName>' : ''; }).join('') + '</definedNames></workbook>');
    z.add('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    z.add('xl/styles.xml', STY);
    wsXml.forEach(function (x, i) { z.add('xl/worksheets/sheet' + (i + 1) + '.xml', x); });
    return z.blob('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  /* ---------------- đọc XML hóa đơn (TT78 / NĐ123) ---------------- */
  var TCHAT = { '1': 'Hàng hóa, dịch vụ', '2': 'Khuyến mại', '3': 'Chiết khấu thương mại', '4': 'Ghi chú, diễn giải' };
  var TCHDON = { '1': 'Thay thế', '2': 'Điều chỉnh' };
  function kids(el, tag) { if (!el) return []; var o = []; for (var i = 0; i < el.children.length; i++) if (el.children[i].localName === tag) o.push(el.children[i]); return o; }
  function kid(el, tag) { return kids(el, tag)[0] || null; }
  function find(el, tag) { if (!el) return null; var l = el.getElementsByTagName(tag); if (l.length) return l[0]; var all = el.getElementsByTagNameNS('*', tag); return all.length ? all[0] : null; }
  function txt(el, tag) { var e = tag ? kid(el, tag) : el; return e && e.textContent != null ? e.textContent.trim() : ''; }
  function ttKhac(el, key) { var t = kid(el, 'TTKhac'); if (!t) return ''; var l = kids(t, 'TTin'); for (var i = 0; i < l.length; i++) if (txt(l[i], 'TTruong') === key) return txt(l[i], 'DLieu'); return ''; }

  /* ---------- Gợi ý tra cứu hóa đơn theo mẫu người bán (bản thể hiện người bán gửi qua email) ----------
     Đọc từ XML: MST nhà cung cấp giải pháp HĐĐT (MSTTCGP) + mã tra cứu / link tra cứu trong các thẻ TTKhac.
     Tên trường do từng nhà cung cấp tự đặt. Danh sách dưới đây lập từ 54 XML thật (Q3/2026, MST 0111403942, 17/10/2026):
       MISA (0101243150): TransactionID · nhóm MST 0101300842: "Mã TC" + "ĐCTC" (link) · 0106026495-001: "Mã tra cứu"
       Viettel (0100109106): SearchKey, PortalLink · VNPT (0100684378) và HĐ không ghi MSTTCGP: Fkey · Bkav (0101360697), EFY: không có mã trong XML.
     Link mặc định chỉ ghi khi có căn cứ: Bkav (in trên bản PDF người bán gửi), Viettel (ảnh chụp phần mềm Save Invoice), MISA (trang hướng dẫn helpact.misa.vn). */
  /* Bổ sung 18/10/2026 (tra tài liệu chính thức của nhà cung cấp; MST đánh dấu (*) chỉ có 1 nguồn thứ cấp – danh sách TCGP chép lại).
     Chưa nhà cung cấp nào có tài liệu xác nhận mở thẳng bằng link kèm mã → công cụ chỉ mở trang + sao chép mã.
     CHỈ GHI LINK ĐÃ MỞ THỬ ĐƯỢC (18/10/2026, trình duyệt máy anh Tuấn, thấy ô nhập mã): MISA, Bkav, Viettel, Thái Sơn, M-Invoice, EasyInvoice, MobiFone, Sapo, Fast.
     Đã bỏ: EFY ihoadon.vn/kiem-tra (là form đăng ký tư vấn); VNPT https://<MST>.vnpt-invoice.com.vn và -tt78 (không mở được) → để "Tìm trang tra cứu".
     Viettel: link do người bán ghi trong XML có thể hỏng (1 HĐ Q3 ra 404) → ưu tiên trang chung của Viettel. */
  var NCC = {
    '0101243150': { ten: 'MISA meInvoice', link: 'https://www.meinvoice.vn/tra-cuu/' },
    '0101360697': { ten: 'Bkav eHoadon', link: 'https://tracuu.ehoadon.vn', ghiChu: 'XML của Bkav không có mã tra cứu: mã nằm trong email/bản PDF người bán gửi.' },
    '0100109106': { ten: 'Viettel', link: 'https://vinvoice.viettel.vn/utilities/invoice-search', uuTien: 1, hd: 'Trang Viettel cần nhập MST người bán + mã (mã số bí mật) + kéo hình xác nhận.' },
    '0100684378': { ten: 'VNPT', link: '', ghiChu: 'VNPT: mỗi người bán có trang tra cứu riêng (thường in trên hóa đơn/email).' },
    '0101300842': { ten: 'Thái Sơn E-invoice', link: 'https://einvoice.vn/tra-cuu', hd: 'Trang Thái Sơn gọi mã này là "mã nhận hóa đơn".' },
    '0106026495': { ten: 'M-Invoice', link: 'https://tracuuhoadon.minvoice.com.vn/tra-cuu-hoa-don', hd: 'Trang M-Invoice cần nhập MST người bán + mã tra cứu (số bảo mật).' },
    '0102519041': { ten: 'EFY iHOADON', link: '' },
    '0105987432': { ten: 'SoftDreams EasyInvoice', link: 'https://tracuu.easyinvoice.vn/', hd: 'Trang EasyInvoice cần nhập MST người bán + mã tra cứu + mã xác thực (ảnh).' },
    '0100686209': { ten: 'MobiFone Invoice', link: 'http://tracuuhoadon.mobifoneinvoice.vn/', hd: 'Trang MobiFone cần nhập MST người bán + số bảo mật.' },
    '0103243195': { ten: 'Sapo Invoice', link: 'https://www.sapo.vn/tra-cuu-sapo-invoice.html' },
    '0100727825': { ten: 'Fast e-Invoice', link: 'https://einvoice.fast.com.vn/' },
    '0104128565': { ten: 'FPT eInvoice', link: '' }
  };
  var MA_TC = ['mã tra cứu', 'ma tra cuu', 'mã tc', 'matracuu', 'mã số bí mật', 'ma so bi mat', 'transactionid', 'searchkey', 'reservationcode', 'secretcode', 'lookupcode', 'fkey'];
  var LINK_TC = /portal|link|đctc|dctc|tra ?cứu|tracuu|lookup/i;
  function traCuu(mstTCGP, root, banMST) {
    var all = [], l = root.getElementsByTagName('*');
    for (var i = 0; i < l.length; i++) {
      if (l[i].localName !== 'TTin') continue;
      var p = l[i].parentNode && l[i].parentNode.parentNode; if (p && p.localName === 'HHDVu') continue;
      var k = txt(l[i], 'TTruong'), v = txt(l[i], 'DLieu'); if (k && v) all.push([k, v]);
    }
    var ma = '', maTen = '', link = '', best = 99;
    all.forEach(function (kv) {
      var n = kv[0].toLowerCase().trim(), idx = MA_TC.indexOf(n);
      if (idx >= 0 && idx < best && kv[1].length <= 80) { best = idx; ma = kv[1]; maTen = kv[0]; }
      if (!link && LINK_TC.test(kv[0]) && /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(kv[1]) && !/@/.test(kv[1])) link = /^https?:/i.test(kv[1]) ? kv[1] : 'http://' + kv[1];
    });
    var m0 = String(mstTCGP || '').trim(), n = NCC[m0] || NCC[m0.split('-')[0]] || {};
    var lk = (n.uuTien && n.link) ? n.link : (link || n.link || ''), gc = '';
    if (n.uuTien && link && link !== n.link) gc = 'Người bán ghi trong XML trang: ' + link + '. ';
    if (!ma) gc = n.ghiChu || 'Không thấy mã tra cứu trong XML: xem email/bản PDF người bán gửi.';
    else if (!lk) gc = 'Chưa rõ trang tra cứu: xem trên hóa đơn/email người bán.';
    else if (n.hd) gc += n.hd;
    return { nccMST: mstTCGP || '', ncc: n.ten || (mstTCGP ? 'MST ' + mstTCGP : 'Không ghi'), ma: ma, maTen: maTen, link: lk, linkTuXML: !!link, ghiChu: gc };
  }

  function parseInvoiceXML(text, fileName) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('XML hỏng hoặc không đúng định dạng');
    var hdon = find(doc, 'HDon'); if (!hdon) throw new Error('Không phải file XML hóa đơn (thiếu thẻ HDon)');
    var dl = kid(hdon, 'DLHDon') || find(hdon, 'DLHDon'); var ch = kid(dl, 'TTChung'), nd = kid(dl, 'NDHDon');
    var nb = kid(nd, 'NBan'), nm = kid(nd, 'NMua'), tt = kid(nd, 'TToan'), ds = kid(nd, 'DSHHDVu');
    var lq = kid(ch, 'TTHDLQuan');
    var inv = {
      file: fileName || '', pban: txt(ch, 'PBan'), loaiHD: txt(ch, 'THDon'), mauSo: txt(ch, 'KHMSHDon'), kyHieu: txt(ch, 'KHHDon'), so: txt(ch, 'SHDon'),
      ngay: txt(ch, 'NLap'), tienTe: txt(ch, 'DVTTe') || 'VND', tyGia: num(txt(ch, 'TGia')) || 1, httt: txt(ch, 'HTTToan'), mstTCGP: txt(ch, 'MSTTCGP'),
      lq: lq ? { tc: txt(lq, 'TCHDon'), loai: txt(lq, 'LHDCLQuan'), mauSo: txt(lq, 'KHMSHDCLQuan'), kyHieu: txt(lq, 'KHHDCLQuan'), so: txt(lq, 'SHDCLQuan'), ngay: txt(lq, 'NLHDCLQuan'), ghiChu: txt(lq, 'GChu') } : null,
      banMST: txt(nb, 'MST'), banTen: txt(nb, 'Ten'), banDC: txt(nb, 'DChi'),
      muaMST: txt(nm, 'MST'), muaTen: txt(nm, 'Ten'), muaDC: txt(nm, 'DChi'), muaNguoi: txt(nm, 'HVTNMHang'), muaMKH: txt(nm, 'MKHang'), muaCCCD: txt(nm, 'CCCDan'),
      chuaThue: num(txt(tt, 'TgTCThue')), thue: num(txt(tt, 'TgTThue')), coTong: !!txt(tt, 'TgTCThue'), coThue: !!txt(tt, 'TgTThue'), ck: num(txt(tt, 'TTCKTMai')), phi: num(txt(tt, 'TgTPhi')), tong: num(txt(tt, 'TgTTTBSo')), bangChu: txt(tt, 'TgTTTBChu'),
      mccqt: txt(hdon, 'MCCQT') || txt(find(hdon, 'MCCQT')),
      items: [], thueSuat: []
    };
    if (!inv.muaTen) inv.muaTen = inv.muaNguoi;
    kids(ds, 'HHDVu').forEach(function (h) {
      var tc = txt(h, 'TChat');
      inv.items.push({ stt: txt(h, 'STT'), tc: tc, tcTen: TCHAT[tc] || tc, ma: txt(h, 'MHHDVu'), ten: txt(h, 'THHDVu'), dvt: txt(h, 'DVTinh'), sl: num(txt(h, 'SLuong')), dg: num(txt(h, 'DGia')), tlck: num(txt(h, 'TLCKhau')), ck: num(txt(h, 'STCKhau')), thanhTien: num(txt(h, 'ThTien')), ts: txt(h, 'TSuat'), tienThue: num(txt(h, 'TThue') || ttKhac(h, 'VATAmount')) });
    });
    inv.traCuu = traCuu(inv.mstTCGP, hdon, inv.banMST);
    var lts = kid(tt, 'THTTLTSuat');
    kids(lts, 'LTSuat').forEach(function (l) { inv.thueSuat.push({ ts: txt(l, 'TSuat'), thanhTien: num(txt(l, 'ThTien')), thue: num(txt(l, 'TThue')) }); });
    return inv;
  }
  /* Tách giá trị chưa thuế / tiền thuế theo thuế suất, KHỚP với tổng của hóa đơn (TgTCThue, TgTThue).
     Lỗi gặp 18/10/2026 (KTT phát hiện): HĐ C26MSW-7720 (BBQ) ghi bảng tổng hợp thuế suất 358.334 = giá trị TRƯỚC chiết khấu,
     trong khi tổng chưa thuế của HĐ là 322.501 (đã trừ chiết khấu 35.833). Nguyên tắc: tổng của HĐ là chuẩn;
     chênh lệch đúng bằng các dòng chiết khấu (tính chất 3) thì trừ theo từng thuế suất, không thì phân bổ theo tỷ lệ. */
  function tachTS(inv) {
    var arr;
    if (inv.thueSuat && inv.thueSuat.length) arr = inv.thueSuat.map(function (t) { return { ts: t.ts, ct: num(t.thanhTien), th: num(t.thue) }; });
    else {
      var g = {};
      (inv.items || []).forEach(function (it) {
        if (it.tc === '4') return; var k = it.ts || '';
        var x = g[k] || (g[k] = { ts: k, ct: 0, th: 0 });
        var sign = it.tc === '3' ? -1 : 1; x.ct += sign * it.thanhTien; x.th += sign * (it.tienThue || 0);
      });
      arr = Object.keys(g).map(function (k) { return g[k]; });
      if (!arr.length) return [{ ts: '', ct: inv.chuaThue, th: inv.thue }];
      var sth0 = arr.reduce(function (a, x) { return a + x.th; }, 0);
      if (!sth0 && inv.thue && arr.length === 1) arr[0].th = inv.thue;
    }
    var ckBy = {}; (inv.items || []).forEach(function (it) { if (it.tc === '3') ckBy[it.ts || ''] = (ckBy[it.ts || ''] || 0) + it.thanhTien; });
    function khop(key, total, ck) {
      var sum = arr.reduce(function (a, x) { return a + x[key]; }, 0), d = sum - total; if (Math.abs(d) <= 1) return;
      if (ck) { var sc = Object.keys(ck).reduce(function (a, k) { return a + ck[k]; }, 0); if (sc && Math.abs(sc - d) <= 1 && arr.every(function (x) { return ck[x.ts] === undefined || x.ct >= ck[x.ts]; })) { arr.forEach(function (x) { x.ct -= ck[x.ts] || 0; }); return; } }
      if (arr.length === 1 || !sum) { arr[0][key] = total; return; }
      var acc = 0; arr.forEach(function (x, i) { if (i === arr.length - 1) x[key] = total - acc; else { x[key] = Math.round(x[key] * total / sum); acc += x[key]; } });
    }
    if (inv.coTong) khop('ct', inv.chuaThue, ckBy);
    if (inv.coThue) khop('th', inv.thue, null);
    return arr;
  }
  function keyOf(mst, mau, kh, so) { return [String(mst || '').trim(), String(mau || '').trim(), String(kh || '').trim().toUpperCase(), String(parseInt(String(so || '0').replace(/\D/g, ''), 10) || 0)].join('|'); }
  function invKey(inv) { return keyOf(inv.banMST, inv.mauSo, inv.kyHieu, inv.so); }

  /* ---------------- đọc bảng từ file .xlsx / .csv (danh mục xuất từ phần mềm kế toán) ---------------- */
  async function readTable(u8, name) {
    if (/\.csv$|\.txt$/i.test(name || '')) {
      var t = new TextDecoder('utf-8').decode(u8).replace(/^﻿/, ''), first = t.split(/\r?\n/)[0], d = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.indexOf('\t') >= 0 ? '\t' : ',');
      var rows = [], row = [], cur = '', q = false;
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
        else if (ch === '"') q = true; else if (ch === d) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
      }
      if (cur || row.length) { row.push(cur); rows.push(row); }
      return rows;
    }
    if (u8[0] === 0xD0 && u8[1] === 0xCF) throw new Error('File .xls (Excel 97-2003) chưa đọc được. Anh/chị mở file bằng Excel, chọn Lưu thành (Save As) dạng .xlsx rồi tải lên lại.');
    if (!(u8[0] === 0x50 && u8[1] === 0x4B)) throw new Error('Không phải file Excel .xlsx hay .csv');
    var parts = await unzip(u8), get = function (n) { var p = parts.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0]; return p && p.bytes ? new TextDecoder('utf-8').decode(p.bytes) : ''; };
    var P = function (x) { return new DOMParser().parseFromString(x, 'application/xml'); };
    var ss = [], sst = get('xl/sharedStrings.xml');
    if (sst) { var si = P(sst).getElementsByTagName('si'); for (var k = 0; k < si.length; k++) { var ts = si[k].getElementsByTagName('t'), v = ''; for (var j = 0; j < ts.length; j++) v += ts[j].textContent; ss.push(v); } }
    var sheetName = (parts.filter(function (x) { return /^xl\/worksheets\/sheet\d+\.xml$/i.test(x.name); }).map(function (x) { return x.name; }).sort()[0]) || 'xl/worksheets/sheet1.xml';
    var doc = P(get(sheetName)), rowsX = doc.getElementsByTagName('row'), out = [];
    var colIdx = function (ref) { var m = String(ref || '').match(/^([A-Z]+)/), n = 0; if (!m) return -1; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; };
    for (var r = 0; r < rowsX.length; r++) {
      var cells = rowsX[r].getElementsByTagName('c'), arr = [];
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c], tt = cell.getAttribute('t'), ci = colIdx(cell.getAttribute('r')), vEl = cell.getElementsByTagName('v')[0], val = '';
        if (tt === 's') val = ss[+(vEl ? vEl.textContent : 0)] || '';
        else if (tt === 'inlineStr') { var tl = cell.getElementsByTagName('t'); for (var z = 0; z < tl.length; z++) val += tl[z].textContent; }
        else val = vEl ? vEl.textContent : '';
        arr[ci < 0 ? c : ci] = val;
      }
      for (var f = 0; f < arr.length; f++) if (arr[f] === undefined) arr[f] = '';
      out[(+rowsX[r].getAttribute('r') || r + 1) - 1] = arr;
    }
    for (var g = 0; g < out.length; g++) if (!out[g]) out[g] = [];
    return out;
  }

  /* ---------------- trạng thái hóa đơn (mã của trang thuế) ---------------- */
  var TTHAI = { '1': 'Hóa đơn mới', '2': 'Hóa đơn thay thế', '3': 'Hóa đơn điều chỉnh', '4': 'Đã bị thay thế', '5': 'Đã bị điều chỉnh', '6': 'Đã bị hủy' };
  var TTXLY = { '0': 'Cục Thuế đã nhận', '1': 'Đang kiểm tra điều kiện cấp mã', '2': 'CQT từ chối', '3': 'Đủ điều kiện cấp mã', '4': 'Không đủ điều kiện cấp mã', '5': 'Đã cấp mã', '6': 'Cục Thuế đã nhận không mã', '7': 'Đã kiểm tra định kỳ không mã', '8': 'Đã nhận HĐ máy tính tiền' };

  /* ---------------- phân tích bộ hóa đơn → 4 sheet ----------------
     invs: kết quả parseInvoiceXML; meta: {key: {tthai, ttxly, loai}} lấy từ danh sách trang thuế (nếu có)
     opts.myMST: MST doanh nghiệp để tự nhận bán ra / mua vào */
  function analyze(invs, meta, opts) {
    meta = meta || {}; opts = opts || {};
    var my = String(opts.myMST || '').trim(), seen = {}, list = [], warns = [];
    invs.forEach(function (inv) {
      var k = invKey(inv);
      if (seen[k]) { warns.push({ kind: 'trung', text: 'Trùng hóa đơn ' + inv.kyHieu + '-' + inv.so + ' (' + inv.file + ') – đã bỏ, chỉ tính 1 lần.' }); return; }
      seen[k] = inv; list.push(inv);
    });
    // nhận loại bán ra / mua vào
    list.forEach(function (inv) {
      var m = meta[invKey(inv)] || {};
      inv.tthai = m.tthai != null ? String(m.tthai) : ''; inv.ttxly = m.ttxly != null ? String(m.ttxly) : '';
      inv.loai = m.loai || (my ? (inv.banMST === my ? 'Bán ra' : (inv.muaMST === my ? 'Mua vào' : 'Khác')) : '');
    });
    // hóa đơn thay thế / điều chỉnh có trong bộ → đánh dấu hóa đơn gốc
    list.forEach(function (inv) {
      if (!inv.lq || !inv.lq.so) return;
      var g = seen[keyOf(inv.banMST, inv.lq.mauSo, inv.lq.kyHieu, inv.lq.so)];
      if (inv.lq.tc === '1') { if (!inv.tthai) inv.tthai = '2'; if (g && !g.tthai) g.tthai = '4'; }
      else if (inv.lq.tc === '2') { if (!inv.tthai) inv.tthai = '3'; if (g && !g.tthai) g.tthai = '5'; }
    });
    list.forEach(function (inv) {
      if (!inv.tthai) inv.tthai = '1';
      inv.trangThai = TTHAI[inv.tthai] || inv.tthai;
      inv.loaiTru = inv.tthai === '4' || inv.tthai === '6';
      if (inv.noXml) warns.push({ kind: 'noxml', text: 'HĐ ' + inv.kyHieu + '-' + inv.so + ' (' + (inv.loai === 'Bán ra' ? inv.muaTen : inv.banTen) + '): cổng thuế không lưu XML gốc – bảng kê dùng số tổng từ danh sách tra cứu, không có chi tiết hàng hóa.' });
      if (inv.loaiTru) warns.push({ kind: inv.tthai === '6' ? 'huy' : 'thaythe', text: 'HĐ ' + inv.kyHieu + '-' + inv.so + ' ' + inv.trangThai.toLowerCase() + ' – không cộng vào tổng.' });
      // kiểm tra tổng dòng hàng
      var s = 0, co = false;
      inv.items.forEach(function (it) { if (it.tc === '1' || it.tc === '' ) { s += it.thanhTien; co = true; } else if (it.tc === '3') { s -= it.thanhTien; co = true; } });
      inv.lech = co && inv.chuaThue && Math.abs(s - inv.chuaThue) > 1 ? s - inv.chuaThue : 0;
      if (inv.lech) warns.push({ kind: 'lech', text: 'HĐ ' + inv.kyHieu + '-' + inv.so + ': tổng các dòng hàng lệch tổng tiền chưa thuế ' + fmtMoney(inv.lech) + ' đ.' });
      if (inv.tienTe && inv.tienTe !== 'VND') warns.push({ kind: 'ngoaite', text: 'HĐ ' + inv.kyHieu + '-' + inv.so + ' lập bằng ' + inv.tienTe + ' (tỷ giá ' + inv.tyGia + '). Số tiền trong bảng giữ nguyên tệ gốc.' });
    });
    list.sort(function (a, b) { return (a.loai || '').localeCompare(b.loai || '') || ymdCompact(a.ngay).localeCompare(ymdCompact(b.ngay)) || a.kyHieu.localeCompare(b.kyHieu) || (+a.so - +b.so); });
    var tot = { hd: 0, dong: 0, chuaThue: 0, thue: 0, tong: 0, loaiTru: 0 };
    list.forEach(function (inv) { tot.dong += inv.items.length; if (inv.loaiTru) { tot.loaiTru++; return; } tot.hd++; tot.chuaThue += inv.chuaThue; tot.thue += inv.thue; tot.tong += inv.tong; });
    return { list: list, warns: warns, tot: tot };
  }

  function buildSheets(res) {
    var L = res.list;
    var s1 = { name: 'Bảng kê hóa đơn', cols: [
      { h: 'STT', t: 'i', w: 6 }, { h: 'Loại', t: 's', w: 9 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: 'Mẫu số', t: 's', w: 7 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: 'Số HĐ', t: 's', w: 10 },
      { h: 'MST người bán', t: 's', w: 15 }, { h: 'Tên người bán', t: 's', w: 34 }, { h: 'MST người mua', t: 's', w: 15 }, { h: 'Tên người mua', t: 's', w: 34 },
      { h: 'Tiền tệ', t: 's', w: 7 }, { h: 'Tổng chưa thuế', t: 'n', w: 15 }, { h: 'Tiền thuế', t: 'n', w: 13 }, { h: 'Chiết khấu TM', t: 'n', w: 12 }, { h: 'Phí khác', t: 'n', w: 11 }, { h: 'Tổng thanh toán', t: 'n', w: 15 },
      { h: 'Trạng thái', t: 's', w: 16 }, { h: 'Tính vào tổng', t: 's', w: 9 }, { h: 'HĐ liên quan', t: 's', w: 22 }, { h: 'Hình thức TT', t: 's', w: 11 }, { h: 'Mã CQT', t: 's', w: 30 },
      { h: 'Địa chỉ người bán', t: 's', w: 34 }, { h: 'Địa chỉ người mua', t: 's', w: 34 }, { h: 'Tên file', t: 's', w: 40 }], rows: [] };
    L.forEach(function (v, i) {
      s1.rows.push([i + 1, v.loai, v.ngay, v.mauSo, v.kyHieu, v.so, v.banMST, v.banTen, v.muaMST, v.muaTen, v.tienTe, v.chuaThue, v.thue, v.ck, v.phi, v.tong, v.trangThai, v.loaiTru ? 'Không' : 'Có',
        v.lq && v.lq.so ? (TCHDON[v.lq.tc] || 'Liên quan') + ' HĐ ' + v.lq.kyHieu + '-' + v.lq.so + (v.lq.ngay ? ' ngày ' + dmy(v.lq.ngay) : '') : '', v.httt, v.mccqt, v.banDC, v.muaDC, v.file]);
    });
    s1.foot = ['', 'TỔNG', '', '', '', '', '', res.tot.hd + ' HĐ tính vào tổng', '', '', '', res.tot.chuaThue, res.tot.thue, '', '', res.tot.tong, '', '', '', '', '', '', '', ''];
    var s2 = { name: 'Chi tiết hàng hóa', cols: [
      { h: 'STT', t: 'i', w: 6 }, { h: 'Loại', t: 's', w: 9 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: 'Số HĐ', t: 's', w: 10 }, { h: 'MST đối tác', t: 's', w: 15 }, { h: 'Tên đối tác', t: 's', w: 30 },
      { h: 'Dòng', t: 's', w: 6 }, { h: 'Tính chất', t: 's', w: 16 }, { h: 'Mã hàng', t: 's', w: 12 }, { h: 'Tên hàng hóa, dịch vụ', t: 's', w: 42 }, { h: 'ĐVT', t: 's', w: 8 },
      { h: 'Số lượng', t: 'n4', w: 10 }, { h: 'Đơn giá', t: 'n4', w: 14 }, { h: 'Chiết khấu', t: 'n', w: 12 }, { h: 'Thành tiền', t: 'n', w: 15 }, { h: 'Thuế suất', t: 's', w: 9 }, { h: 'Tiền thuế dòng', t: 'n', w: 13 }, { h: 'Trạng thái HĐ', t: 's', w: 16 }], rows: [] };
    var stt = 0;
    L.forEach(function (v) {
      var doiTac = v.loai === 'Mua vào' ? [v.banMST, v.banTen] : [v.muaMST, v.muaTen];
      v.items.forEach(function (it) { stt++; s2.rows.push([stt, v.loai, v.ngay, v.kyHieu, v.so, doiTac[0], doiTac[1], it.stt, it.tcTen, it.ma, it.ten, it.dvt, it.sl || '', it.dg || '', it.ck || '', it.thanhTien, it.ts, it.tienThue || '', v.trangThai]); });
    });
    // tổng hợp theo thuế suất, tách bán ra / mua vào
    var g = {};
    L.forEach(function (v) {
      if (v.loaiTru) return;
      var parts = tachTS(v).map(function (p) { return { ts: p.ts || (v.items[0] ? v.items[0].ts : '') || 'Không rõ', thanhTien: p.ct, thue: p.th }; });
      parts.forEach(function (p) { var k = (v.loai || 'Chung') + '|' + (p.ts || 'Không rõ'); var x = g[k] || (g[k] = { loai: v.loai || 'Chung', ts: p.ts || 'Không rõ', hd: {}, ct: 0, th: 0 }); x.hd[invKey(v)] = 1; x.ct += p.thanhTien; x.th += p.thue; });
    });
    var order = ['0%', '5%', '8%', '10%', 'KCT', 'KKKNT', 'KHAC'];
    var s3 = { name: 'Tổng hợp thuế suất', cols: [{ h: 'Loại', t: 's', w: 10 }, { h: 'Thuế suất', t: 's', w: 12 }, { h: 'Số hóa đơn', t: 'i', w: 11 }, { h: 'Tiền chưa thuế', t: 'n', w: 17 }, { h: 'Tiền thuế', t: 'n', w: 15 }, { h: 'Cộng', t: 'n', w: 17 }], rows: [] };
    Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.loai.localeCompare(b.loai) || ((order.indexOf(a.ts) + 1 || 99) - (order.indexOf(b.ts) + 1 || 99)); })
      .forEach(function (x) { s3.rows.push([x.loai, x.ts, Object.keys(x.hd).length, x.ct, x.th, x.ct + x.th]); });
    var sct = 0, sth = 0; s3.rows.forEach(function (r) { sct += r[3]; sth += r[4]; });
    s3.foot = ['TỔNG', '', res.tot.hd, sct, sth, sct + sth];
    var s4 = { name: 'Gộp một bảng', cols: [
      { h: 'Loại', t: 's', w: 9 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: 'Mẫu số', t: 's', w: 7 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: 'Số HĐ', t: 's', w: 10 }, { h: 'MST người bán', t: 's', w: 15 }, { h: 'Tên người bán', t: 's', w: 30 }, { h: 'MST người mua', t: 's', w: 15 }, { h: 'Tên người mua', t: 's', w: 30 },
      { h: 'Dòng', t: 's', w: 6 }, { h: 'Tính chất', t: 's', w: 14 }, { h: 'Mã hàng', t: 's', w: 12 }, { h: 'Tên hàng hóa, dịch vụ', t: 's', w: 40 }, { h: 'ĐVT', t: 's', w: 8 }, { h: 'Số lượng', t: 'n4', w: 10 }, { h: 'Đơn giá', t: 'n4', w: 14 }, { h: 'Chiết khấu', t: 'n', w: 12 }, { h: 'Thành tiền', t: 'n', w: 15 }, { h: 'Thuế suất', t: 's', w: 9 },
      { h: 'Tổng chưa thuế HĐ', t: 'n', w: 15 }, { h: 'Tiền thuế HĐ', t: 'n', w: 13 }, { h: 'Tổng thanh toán HĐ', t: 'n', w: 15 }, { h: 'Trạng thái', t: 's', w: 16 }, { h: 'Mã CQT', t: 's', w: 30 }], rows: [] };
    L.forEach(function (v) {
      var items = v.items.length ? v.items : [{}];
      items.forEach(function (it) { s4.rows.push([v.loai, v.ngay, v.mauSo, v.kyHieu, v.so, v.banMST, v.banTen, v.muaMST, v.muaTen, it.stt || '', it.tcTen || '', it.ma || '', it.ten || '', it.dvt || '', it.sl || '', it.dg || '', it.ck || '', it.thanhTien != null ? it.thanhTien : '', it.ts || '', v.chuaThue, v.thue, v.tong, v.trangThai, v.mccqt]); });
    });
    var s5 = { name: 'Tra cứu mẫu người bán', cols: [
      { h: 'STT', t: 'i', w: 6 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: 'Số HĐ', t: 's', w: 10 }, { h: 'Người bán', t: 's', w: 34 },
      { h: 'Mã tra cứu', t: 'code', w: 26 }, { h: 'Trang tra cứu', t: 'url', w: 40 }, { h: 'Nhà cung cấp HĐĐT', t: 's', w: 18 }, { h: 'MST người bán', t: 'mst', w: 17 }, { h: 'Loại', t: 's', w: 9 }, { h: 'Ghi chú', t: 's', w: 50 }], rows: [] };
    L.forEach(function (v, i) {
      var t = v.traCuu || { ncc: v.noXml ? 'Không có XML gốc' : '', ma: '', link: '', ghiChu: v.noXml ? 'Cổng thuế không lưu XML gốc: xem email/bản PDF người bán gửi.' : '' };
      s5.rows.push([i + 1, v.ngay, v.kyHieu, v.so, v.banTen, t.ma, t.link, t.ncc, v.banMST, v.loai, t.ghiChu]);
    });
    // có cả mua vào và bán ra → tách bảng kê thành 2 sheet riêng (STT, dòng tổng tính riêng từng sheet)
    var coMua = L.some(function (v) { return v.loai === 'Mua vào'; }), coBan = L.some(function (v) { return v.loai === 'Bán ra'; });
    if (coMua && coBan) {
      var tach = function (loai, ten) {
        var rows = s1.rows.filter(function (r) { return r[1] === loai; }).map(function (r, i) { r = r.slice(); r[0] = i + 1; return r; });
        var hd = 0, ct = 0, th = 0, tg = 0; L.forEach(function (v) { if (v.loai !== loai || v.loaiTru) return; hd++; ct += v.chuaThue; th += v.thue; tg += v.tong; });
        var f = s1.foot.slice(); f[7] = hd + ' HĐ tính vào tổng'; f[11] = ct; f[12] = th; f[15] = tg;
        return { name: ten, cols: s1.cols, rows: rows, foot: f };
      };
      return [tach('Mua vào', 'Bảng kê mua vào'), tach('Bán ra', 'Bảng kê bán ra'), s2, s3, s4, s5];
    }
    return [s1, s2, s3, s4, s5];
  }

  /* ---------------- tải file về máy ---------------- */
  function saveBlob(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; a.style.display = 'none'; (document.body || document.documentElement).appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 60000);
  }

  return {
    VERSION: VERSION, pad: pad, maskTail: maskTail, scrub: scrub, Logger: Logger, boDau: boDau, num: num, fmtMoney: fmtMoney,
    parseDate: parseDate, validDMY: validDMY, dmy: dmy, ymdCompact: ymdCompact, splitMonths: splitMonths, maskDMY: maskDMY, dateToDMY: dateToDMY, dmyToDate: dmyToDate, ngayVN: ngayVN,
    slugDoiTac: slugDoiTac, tenFileHD: tenFileHD, crc32: crc32, unzip: unzip, ZipWriter: ZipWriter, xlsxBlob: xlsxBlob,
    parseInvoiceXML: parseInvoiceXML, tachTS: tachTS, readTable: readTable, traCuu: traCuu, NCC: NCC, invKey: invKey, keyOf: keyOf, TTHAI: TTHAI, TTXLY: TTXLY, analyze: analyze, buildSheets: buildSheets, saveBlob: saveBlob
  };
})();
