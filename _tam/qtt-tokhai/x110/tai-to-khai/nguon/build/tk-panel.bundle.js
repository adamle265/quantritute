(function(){/* ==========================================================================
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
      inv.tthai = m.tthai != null ? String(m.tthai) : ''; inv.ttxly = m.ttxly != null ? String(m.ttxly) : ''; inv.biLq = [];
      inv.loai = m.loai || (my ? (inv.banMST === my ? 'Bán ra' : (inv.muaMST === my ? 'Mua vào' : 'Khác')) : '');
    });
    // hóa đơn thay thế / điều chỉnh có trong bộ → đánh dấu hóa đơn gốc
    list.forEach(function (inv) {
      if (!inv.lq || !inv.lq.so) return;
      var g = seen[keyOf(inv.banMST, inv.lq.mauSo, inv.lq.kyHieu, inv.lq.so)];
      if (inv.lq.tc === '1') { if (!inv.tthai) inv.tthai = '2'; if (g && !g.tthai) g.tthai = '4'; }
      else if (inv.lq.tc === '2') { if (!inv.tthai) inv.tthai = '3'; if (g && !g.tthai) g.tthai = '5'; }
      // 1.8.1 (góp ý người dùng 31/10): ghi ngược lên HĐ gốc "bị thay thế / bị điều chỉnh bởi HĐ … ngày …"
      if (g) (g.biLq = g.biLq || []).push({ tc: inv.lq.tc, kyHieu: inv.kyHieu, so: inv.so, ngay: inv.ngay });
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

  /* 1.8.1: nội dung cột "HĐ liên quan" – cả 2 chiều */
  function lqText(v) {
    if (v.lq && v.lq.so) return (TCHDON[v.lq.tc] || 'Liên quan') + ' HĐ ' + v.lq.kyHieu + '-' + v.lq.so + (v.lq.ngay ? ' ngày ' + dmy(v.lq.ngay) : '');
    if (v.biLq && v.biLq.length) return v.biLq.map(function (x) { return (x.tc === '2' ? 'Bị điều chỉnh bởi' : 'Bị thay thế bởi') + ' HĐ ' + x.kyHieu + '-' + x.so + (x.ngay ? ' ngày ' + dmy(x.ngay) : ''); }).join('; ');
    if (v.tthai === '4' || v.tthai === '5') return (v.tthai === '4' ? 'Bị thay thế' : 'Bị điều chỉnh') + ' – HĐ mới không có trong bộ đã tải';
    if ((v.tthai === '2' || v.tthai === '3') && v.noXml) return 'Không có XML – chưa xác định được HĐ gốc';
    return '';
  }
  function buildSheets(res) {
    var L = res.list;
    var s1 = { name: 'Bảng kê hóa đơn', cols: [
      { h: 'STT', t: 'i', w: 6 }, { h: 'Loại', t: 's', w: 9 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: 'Mẫu số', t: 's', w: 7 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: 'Số HĐ', t: 's', w: 10 },
      { h: 'MST người bán', t: 's', w: 15 }, { h: 'Tên người bán', t: 's', w: 34 }, { h: 'MST người mua', t: 's', w: 15 }, { h: 'Tên người mua', t: 's', w: 34 },
      { h: 'Tiền tệ', t: 's', w: 7 }, { h: 'Tổng chưa thuế', t: 'n', w: 15 }, { h: 'Tiền thuế', t: 'n', w: 13 }, { h: 'Chiết khấu TM', t: 'n', w: 12 }, { h: 'Phí khác', t: 'n', w: 11 }, { h: 'Tổng thanh toán', t: 'n', w: 15 },
      { h: 'Trạng thái', t: 's', w: 16 }, { h: 'Tính vào tổng', t: 's', w: 9 }, { h: 'HĐ liên quan', t: 's', w: 34 }, { h: 'Hình thức TT', t: 's', w: 11 }, { h: 'Mã CQT', t: 's', w: 30 },
      { h: 'Địa chỉ người bán', t: 's', w: 34 }, { h: 'Địa chỉ người mua', t: 's', w: 34 }, { h: 'Tên file', t: 's', w: 40 }], rows: [] };
    L.forEach(function (v, i) {
      s1.rows.push([i + 1, v.loai, v.ngay, v.mauSo, v.kyHieu, v.so, v.banMST, v.banTen, v.muaMST, v.muaTen, v.tienTe, v.chuaThue, v.thue, v.ck, v.phi, v.tong, v.trangThai, v.loaiTru ? 'Không' : 'Có',
        lqText(v), v.httt, v.mccqt, v.banDC, v.muaDC, v.file]);
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

/* ==========================================================================
   TK-PANEL – bảng điều khiển "Tải tờ khai hàng loạt" chạy trên dichvucong.gdt.gov.vn (hồ sơ nộp từ 01/07/2025)
   và thuedientu.gdt.gov.vn (hồ sơ nộp trên Thuế điện tử – trước 01/07/2025 và một phần sau đó). Nộp ở đâu – tải ở đó.
   Quản trị tử tế · quantritute.com
   - Dùng phiên đăng nhập sẵn có của trình duyệt. Không hỏi, không lưu mật khẩu.
   - Chỉ gọi tới chính trang dịch vụ công, đúng các lệnh tra cứu / tải mà trang "Tra cứu hồ sơ" đang dùng.
   - Mã xác nhận: người dùng tự đọc, tự gõ cho từng tháng. Công cụ không tự đọc mã, không dùng lại mã.
   - Chỉ đọc: không gọi bất kỳ lệnh nộp / bổ sung / hủy hồ sơ nào.
   ========================================================================== */
(function () {
  'use strict';
  var DOM_LUP = 'data:image/webp;base64,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';
  var DOM_ICON = 'data:image/webp;base64,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';
  var C = HDCore, VER = '1.1.0', HOST_DVC = 'dichvucong.gdt.gov.vn', HOST_ETAX = 'thuedientu.gdt.gov.vn', BASE = '/tthc/';
  var ETAX = location.hostname === HOST_ETAX, HOST = ETAX ? HOST_ETAX : HOST_DVC;
  var TEN = ETAX ? 'trang thuế điện tử' : 'trang dịch vụ công', TENH = ETAX ? 'Trang thuế điện tử' : 'Trang dịch vụ công';
  var SIZE = 50, NGAY_DVC = '01/07/2025';

  if (window.__qttTK && window.__qttTK.show) { window.__qttTK.show(); return; }

  if (location.hostname !== HOST_DVC && location.hostname !== HOST_ETAX) {
    var t = document.createElement('div');
    t.textContent = 'Nút "Tải tờ khai" chạy trên 2 trang (nộp ở đâu – tải ở đó): ' + HOST_DVC + ' (hồ sơ nộp từ 01/07/2025) và ' + HOST_ETAX + ' (hồ sơ nộp trên Thuế điện tử, chủ yếu trước 01/07/2025). Hãy mở trang, đăng nhập, rồi bấm lại nút.';
    t.style.cssText = 'position:fixed;z-index:2147483647;top:16px;right:16px;max-width:360px;background:#A63A2B;color:#fff;padding:14px 16px;border-radius:10px;font:14px/1.5 Segoe UI,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 9000); return;
  }

  var LOG = new C.Logger('nhat-ky');
  LOG.phanCach('Mở bảng điều khiển');
  LOG.ghi('Phiên bản công cụ: ' + VER + ' | lõi ' + C.VERSION);
  LOG.ghi('Trình duyệt: ' + navigator.userAgent);
  LOG.ghi('Trang: ' + location.hostname + location.pathname + (ETAX ? ' (thue dien tu)' : ''));

  var S = { busy: false, stop: false, gap: ETAX ? 700 : 1200, okRun: 0, last: 0, rows: [], sel: {}, filter: '', sort: 'tk', token: '', loaiTK: [], loaiTKMap: {}, mst: '', logged: null };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ApiError(kind, status, msg) { this.kind = kind; this.status = status; this.message = msg; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('qtt-tk-' + k); if (v === null) localStorage.removeItem('qtt-tk-' + k); else localStorage.setItem('qtt-tk-' + k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* ---------- mã chống giả mạo yêu cầu (CSRF) của trang ---------- */
  function csrf() {
    var m = document.querySelector('meta[name="csrf-token"]');
    if (m && m.content) return m.content;
    if (S.token) return S.token;
    var c = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/); return c ? decodeURIComponent(c[1]) : '';
  }

  /* ---------- gọi trang dịch vụ công ----------
     Giãn nhịp giữa các lệnh (mặc định 1,2 giây), trang dịch vụ công báo 429 thì giãn thêm và chờ.
     Hết phiên: trang dịch vụ công chuyển về trang đăng nhập → báo 'session'.
     opt: {method, json, html, once} */
  function laTrangDangNhap(r, text) {
    var u = String(r.url || '');
    if (!ETAX && (/\/(homelogin|login|dang-nhap)(\b|\?|$)/i.test(u) || /sso|cas\/login/i.test(u))) return true; // (thuế điện tử: URL có "processorState" chứa "sso")
    if (r.status === 401) return true;
    if (ETAX && text && (/type\s*=\s*["']?password/i.test(text) || /phiên làm việc (đã )?hết hạn|hết phiên làm việc/i.test(text))) return true;
    return false;
  }
  async function call(path, opt) {
    opt = opt || {};
    var waits = [2000, 4000, 8000], waits429 = [6000, 12000, 24000], last, lim = opt.once ? 0 : 3;
    for (var attempt = 0; attempt <= lim; attempt++) {
      if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
      var cho = S.last + S.gap - Date.now(); if (cho > 0) await sleep(cho);
      if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
      S.last = Date.now();
      var t0 = Date.now(), method = opt.method || 'GET', r, text;
      LOG.ghi('[MANG] ' + method + ' ' + path.replace(/captcha=[^&]*/, 'captcha=***') + (attempt ? ' (thử lại lần ' + attempt + ')' : ''));
      var hh = {};
      if (ETAX) { if (method === 'POST') hh['Content-Type'] = 'application/x-www-form-urlencoded'; }
      else if (opt.html) { hh['accept'] = 'text/html-partial'; hh['HX-Request'] = 'true'; }
      if (method === 'POST' && !ETAX) { hh['Content-Type'] = opt.form ? 'application/x-www-form-urlencoded' : 'application/json'; hh['X-XSRF-TOKEN'] = csrf(); hh['Accept'] = 'application/json, text/javascript, */*; q=0.01'; hh['X-Requested-With'] = 'XMLHttpRequest'; }
      var ac = window.AbortController ? new AbortController() : null, hen = ac ? setTimeout(function () { ac.abort(); }, 45000) : 0;
      try {
        r = await fetch(path, { method: method, headers: hh, credentials: 'same-origin', body: opt.form ? opt.form : opt.json ? JSON.stringify(opt.json) : undefined, signal: ac ? ac.signal : undefined });
        if (opt.bin) { var u8b = new Uint8Array(await r.arrayBuffer()); var laFile = laFileTai(u8b); text = laFile ? '' : new TextDecoder().decode(u8b); }
        else text = await r.text();
      } catch (e) {
        clearTimeout(hen);
        var treo = e && e.name === 'AbortError';
        last = new ApiError(treo ? 'server' : 'network', 0, treo ? '' + TENH + ' không phản hồi sau 45 giây' : 'Không kết nối được tới ' + TEN + ' (' + (e && e.message) + ')');
        LOG.ghi('[MANG] -> ' + last.message);
        if (attempt < lim) { await sleep(treo ? 1000 : waits[attempt]); continue; } throw last;
      }
      clearTimeout(hen);
      LOG.ghi('[MANG] -> ' + r.status + ' | ' + (opt.bin && laFile ? u8b.length + ' byte (file)' : text.length + ' ký tự') + ' | ' + (Date.now() - t0) + ' ms');
      if (laTrangDangNhap(r, text)) { LOG.ghi('[PHIEN] Cong chuyen ve trang dang nhap: ' + String(r.url).replace(/\?.*$/, '')); throw new ApiError('session', r.status, 'Phiên đăng nhập ' + TEN + ' đã hết.'); }
      if (r.status === 200) {
        if (S.gap > 1200 && ++S.okRun >= 15) { S.gap = Math.max(1200, S.gap - 300); S.okRun = 0; }
        if (opt.bin) return { file: laFile, u8: u8b, text: text, cd: r.headers.get('content-disposition') || '' };
        if (method === 'POST' && !opt.html) {
          var j; try { j = JSON.parse(text); } catch (e) {
            if (/<html|<!doctype/i.test(text)) { LOG.ghi('[PHIEN] POST tra ve trang HTML -> coi nhu het phien'); throw new ApiError('session', 200, 'Phiên đăng nhập ' + TEN + ' đã hết.'); }
            last = new ApiError('data', 200, '' + TENH + ' trả về dữ liệu không đọc được'); LOG.ghi('[MANG] -> NGUYEN VAN: ' + text.slice(0, 300));
            if (attempt < lim) { await sleep(waits[attempt]); continue; } throw last;
          }
          return j;
        }
        return text;
      }
      var msg = text;
      try { var jj = JSON.parse(text); msg = jj.error || jj.message || text; } catch (e) { msg = clean(text.replace(/<[^>]+>/g, ' ')); }
      msg = String(msg).slice(0, 200);
      LOG.ghi('[MANG] -> NGUYEN VAN loi: ' + msg);
      if (r.status === 403) throw new ApiError('session', 403, '' + TENH + ' từ chối (403) – có thể phiên đăng nhập đã hết. ' + msg);
      if (r.status === 429) {
        S.gap = Math.min(5000, S.gap + 800); S.okRun = 0;
        last = new ApiError('busy', 429, '' + TENH + ' báo gọi quá nhanh');
        LOG.ghi('[CHO] Cong bao 429 -> gian nhip ' + S.gap + ' ms/lenh, cho ' + waits429[Math.min(attempt, 2)] / 1000 + ' giay');
        if (attempt < lim) { await sleep(waits429[attempt]); continue; } throw last;
      }
      if (opt.khongThuLai && opt.khongThuLai.test(msg)) throw new ApiError('reject', r.status, msg); // lỗi nghiệp vụ, gọi lại cũng vậy
      last = new ApiError(r.status >= 500 ? 'server' : 'reject', r.status, msg);
      if (r.status >= 500 && attempt < lim) { await sleep(waits[attempt]); continue; }
      throw last;
    }
    throw last;
  }

  function laFileTai(u8) { return !!(u8 && u8.length > 4 && ((u8[0] === 0x50 && u8[1] === 0x4B) || (u8[0] === 0x3C && u8[1] === 0x3F && u8[2] === 0x78) || (u8[0] === 0xEF && u8[1] === 0xBB && u8[3] === 0x3C) || (u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44))); } // ZIP, <?xml, BOM+<, %PDF

  /* ---------- trang Tra cứu hồ sơ: kiểm tra đăng nhập, lấy danh mục tờ khai ---------- */
  async function moTrangTraCuu() {
    var html = await call(BASE + 'tchs', { once: true });
    var d = new DOMParser().parseFromString(html, 'text/html');
    if (!d.getElementById('form-search-advanced')) throw new ApiError('session', 200, 'Chưa đăng nhập ' + TEN + '');
    var m = d.querySelector('meta[name="csrf-token"]'); if (m) S.token = m.getAttribute('content') || '';
    var sel = d.querySelector('select[name="maToKhai"]');
    S.loaiTK = sel ? [].slice.call(sel.options).filter(function (o) { return o.value; }).map(function (o) { return [o.value, clean(o.textContent)]; }) : [];
    S.loaiTK.forEach(function (o) { S.loaiTKMap[o[0]] = o[1]; });
    LOG.ghi('[TRANG] Da dang nhap. Danh muc to khai: ' + S.loaiTK.length + ' loai');
    return true;
  }

  /* ---------- đọc bảng kết quả tra cứu (HTML) ---------- */
  function docKetQua(html, mode) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    var txt = clean(d.body ? d.body.textContent : '');
    var mt = txt.match(/Tổng số bản ghi:?\s*(\d+)/i), tp = d.getElementById('totalPage');
    var heads = [].slice.call(d.querySelectorAll('thead th')).map(function (th) { return C.boDau(clean(th.textContent)).toLowerCase(); });
    var bang = heads.some(function (h) { return h.indexOf('ma ho so') >= 0 || h.indexOf('ma giao dich') >= 0; });
    if (!mt && !bang) {
      if (/không có (dữ liệu|kết quả|bản ghi|hồ sơ)|không tìm thấy/i.test(txt)) return { ok: true, total: 0, pages: 0, rows: [] };
      return { ok: false, msg: txt.slice(0, 220) };
    }
    function idx(key) { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf(key) >= 0) return i; return -1; }
    function or(a, b) { return a >= 0 ? a : b; }
    var I = { ma: or(idx('ma ho so'), idx('ma giao dich')), tthc: idx('ten tthc'), tk: idx('to khai'), ky: idx('ky tinh thue'), loai: idx('loai to khai'), lanBS: or(idx('lan nop bo sung'), idx('lan bo sung')), cqt: or(idx('co quan thue'), idx('noi nop')), ngay: idx('ngay nop'), tt: idx('trang thai') };
    I.lan = (function () { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf('lan nop') === 0 && heads[i].indexOf('bo sung') < 0) return i; return -1; })();
    var rows = [];
    [].slice.call(d.querySelectorAll('tbody tr')).forEach(function (tr) {
      var td = tr.cells; if (!td || td.length < 6) return;
      function c(k) { return I[k] >= 0 && td[I[k]] ? clean(td[I[k]].textContent) : ''; }
      var eye = tr.querySelector('[data-ma-ho-so]'), bs = tr.querySelector('[onclick*="kkhaiBSung"]');
      var ma = c('ma') || (eye ? eye.getAttribute('data-ma-ho-so') : '');
      if (!ma) return;
      var tk = c('tk'), r = {
        ma: ma, tthc: c('tthc'), tk: tk, tkCode: clean(tk.split(' - ')[0]), ky: c('ky'), loai: c('loai'), lanBS: c('lanBS'), lan: c('lan'),
        cqt: c('cqt'), ngay: c('ngay'), tt: c('tt'), src: mode === 'tdt' ? 'tdt' : 'dvc',
        mstNop: bs ? (bs.getAttribute('data-mst-nop') || '') : '', mstNopThay: bs ? (bs.getAttribute('data-mst-nop-thay') || '') : ''
      };
      if (mode === 'tdt') { r.maTKhai = bs ? (bs.getAttribute('data-ma-tkhai') || '') : ''; r.tkCode = maToKhaiTDT(r); }
      rows.push(r);
    });
    var total = mt ? +mt[1] : rows.length, pages = tp ? +clean(tp.textContent) || 1 : 1;
    return { ok: true, total: total, pages: pages, rows: rows };
  }
  // tab Thuế điện tử chỉ ghi TÊN tờ khai → tìm ký hiệu mẫu (01/GTGT…): theo mã tờ khai trên nút bổ sung, không có thì so tên với danh mục của trang dịch vụ công (chỉ nhận khi khớp đúng 1 mẫu)
  function chuanTen(t) { return C.boDau(String(t || '')).toUpperCase().replace(/M[AẪ]U\s+S[OỐ]\s+\S+/g, '').replace(/[^A-Z0-9]/g, ''); }
  function maToKhaiTDT(r) {
    if (r.maTKhai && S.loaiTKMap[r.maTKhai]) return clean(S.loaiTKMap[r.maTKhai].split(' - ')[0]);
    var n = chuanTen(r.tk), hit = [];
    S.loaiTK.forEach(function (o) { var p = o[1].split(' - '); if (p.length < 2) return; var core = chuanTen(p.slice(1).join(' - ')); if (core.length > 12 && n.indexOf(core) === 0) hit.push(clean(p[0])); });
    hit = hit.filter(function (v, i) { return hit.indexOf(v) === i; });
    if (hit.length === 1) return hit[0];
    return clean(r.tk.replace(/\(.*$/, '')).slice(0, 60) || r.tk.slice(0, 60);
  }
  function bodyTdt(tu, den, ma, page, size) {
    var p = new URLSearchParams();
    p.set('_csrf', csrf()); p.set('page', page ? String(page) : ''); p.set('size', size ? String(size) : ''); p.set('maToKhai_tdt', S.maTK || ''); p.set('maGiaoDichTthc_tdt', '');
    p.set('tuNgay_tdt', tu); p.set('denNgay_tdt', den); p.set('scope_tdt2', 'SELF'); p.set('mstUyQuyen_tdt2', ''); p.set('captcha', ma || '');
    return p.toString();
  }
  function qs(tu, den, ma, extra) {
    var p = 'maNghiepVu=&maTTHC=&maToKhai=' + encodeURIComponent(S.maTK || '') + '&maHoSo=&tuNgay=' + encodeURIComponent(tu) + '&denNgay=' + encodeURIComponent(den) + '&scope_tdt1=SELF&mstUyQuyen_tdt1=&captcha=' + encodeURIComponent(ma || '');
    return BASE + 'ho-so/search?' + p + (extra || '');
  }

  /* ==========================================================================
     TRANG THUẾ ĐIỆN TỬ (thuedientu.gdt.gov.vn) – khảo sát trang thật 03/11/2026 (tài khoản doanh nghiệp):
     - Khai thuế → Tra cứu tờ khai: form traCuuKhaiForm POST /etaxnnt/Request (dse_nextEventName=query, pn = trang,
       qryFromDate / qryToDate dd/mm/yyyy, maTKhai). KHÔNG có mã xác nhận; máy chủ nhận khoảng dài (2015 → nay trong 1 lần).
     - 10 hồ sơ/trang. Tên tờ khai là link downloadTkhai(mã GD) → GET …dse_nextEventName=downTkhai&messageId=<mã> → file XML.
       Chỉ tải được hồ sơ thuộc TRANG kết quả vừa đọc. Vài dòng không có link tải (VD 05/QTT-TNCN) → ghi "không cho tải".
     - Thông báo: thongBao(mã GD) → trang danh sách → downloadFile(id) = POST form tkhaiForm (dse_nextEventName=download, messageId=id) → XML.
     ========================================================================== */
  var EX = { form: null, dl: '', tb: '', sid: '' };
  function boScript(d) { [].forEach.call(d.querySelectorAll('script,style,noscript'), function (x) { x.remove(); }); return d; }
  function truong(f) { var o = []; [].forEach.call(f.elements, function (e) { if (!e.name || /^(button|submit|reset|image)$/i.test(e.type)) return; if ((e.type === 'checkbox' || e.type === 'radio') && !e.checked) return; o.push([e.name, e.tagName === 'SELECT' ? '' : e.value]); }); return o; }
  function layHam(d, ten) { // lấy đường dẫn trong hàm của trang: function ten(x){ … '…' + x }
    var sc = [].map.call(d.querySelectorAll('script'), function (x) { return x.textContent; }).join('\n');
    var m = sc.match(new RegExp('function\\s+' + ten + '\\s*\\(\\s*(\\w+)\\s*\\)\\s*\\{[^]*?[\'"]([^\'"]*dse_nextEventName[^\'"]*)[\'"]\\s*\\+\\s*\\1'));
    return m ? m[2].replace(/&amp;/g, '&') : '';
  }
  function hocTrang(d) { // cập nhật trường form + đường dẫn tải từ trang vừa đọc (mã phiên/mã xử lý có thể đổi)
    var f = d.forms.traCuuKhaiForm || d.getElementById('traCuuKhaiForm'); if (f) EX.form = truong(f);
    var a = layHam(d, 'downloadTkhai'); if (a) EX.dl = a;
    var b = layHam(d, 'thongBao'); if (b) EX.tb = b;
    if (EX.form) EX.form.forEach(function (kv) { if (kv[0] === 'dse_sessionId' && kv[1]) EX.sid = kv[1]; });
    return !!f;
  }
  function gtForm(k) { var v = ''; (EX.form || []).forEach(function (kv) { if (kv[0] === k) v = kv[1]; }); return v; }
  function urlTaiEtax(ma) {
    if (EX.dl) return EX.dl + encodeURIComponent(ma);
    return '/etaxnnt/Request?&dse_sessionId=' + encodeURIComponent(EX.sid) + '&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=16&dse_processorState=viewTraCuuTkhai&dse_processorId=' + encodeURIComponent(gtForm('dse_processorId')) + '&dse_nextEventName=downTkhai&messageId=' + encodeURIComponent(ma);
  }
  function urlTbEtax(ma) {
    if (EX.tb) return EX.tb + encodeURIComponent(ma);
    return '/etaxnnt/Request?&dse_sessionId=' + encodeURIComponent(EX.sid) + '&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=16&dse_processorState=viewTraCuuTkhai&dse_processorId=' + encodeURIComponent(gtForm('dse_processorId')) + '&dse_nextEventName=viewTBao&ctMaGDich=' + encodeURIComponent(ma);
  }
  async function moTrangEtax() {
    var html = '', fr = document.getElementById('tranFrame'), fd = null;
    try { fd = fr && fr.contentDocument; } catch (e) { fd = null; }
    if (fd && fd.getElementById('traCuuKhaiForm')) { html = fd.documentElement.outerHTML; LOG.ghi('[TRANG] Dung trang Tra cuu to khai dang mo'); }
    else {
      var src = ''; try { src = String(window.openPage || '') + ' ' + (fr ? fr.getAttribute('src') || '' : '') + ' ' + location.search; } catch (e) { }
      var m = src.match(/dse_sessionId=([^&"'\s]+)/);
      if (!m || typeof window.openPage !== 'function') throw new ApiError('session', 200, 'Chưa đăng nhập trang thuế điện tử');
      EX.sid = m[1];
      html = await call('/etaxnnt/Request?&dse_sessionId=' + encodeURIComponent(m[1]) + '&dse_applicationId=-1&dse_pageId=11&dse_operationName=traCuuToKhaiProc&dse_processorState=initial&dse_nextEventName=start', { once: true });
    }
    var d = new DOMParser().parseFromString(html, 'text/html');
    if (!hocTrang(d)) throw new ApiError('session', 200, 'Chưa mở được mục Tra cứu tờ khai (có thể chưa đăng nhập)');
    var sel = d.querySelector('select[name="maTKhai"]');
    EX.tatCa = sel && sel.options.length ? sel.options[0].value : '00';
    S.loaiTK = sel ? [].slice.call(sel.options).filter(function (o) { return o.value && / - /.test(o.textContent); }).map(function (o) { return [o.value, clean(o.textContent)]; }) : [];
    S.loaiTK.forEach(function (o) { S.loaiTKMap[o[0]] = o[1]; });
    S.maEtax = S.loaiTK.map(function (o) { return clean(o[1].split(' - ')[0]); }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(function (a, b) { return b.length - a.length; });
    LOG.ghi('[TRANG] Thue dien tu: da dang nhap. Danh muc to khai: ' + S.loaiTK.length + ' loai');
    return true;
  }
  // "01/GTGT-TỜ KHAI…", "05/QTT-TNCN-TỜ KHAI…", "TT133_VuaVaNho_LT_B01a-Bộ báo cáo…" → ký hiệu mẫu
  function maTkEtax(tk) {
    tk = clean(tk); var U = tk.toUpperCase();
    for (var i = 0; i < (S.maEtax || []).length; i++) { var c = S.maEtax[i]; if (U.indexOf(c.toUpperCase()) === 0 && /^\s*-/.test(tk.slice(c.length))) return c; }
    var p = tk.split('-'), out = [];
    for (var k = 0; k < p.length - 1; k++) { var seg = p[k].trim(); if (!seg || /\s/.test(seg)) break; out.push(seg); }
    return out.length ? out.join('-') : tk.slice(0, 40);
  }
  function docKetQuaEtax(html) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    hocTrang(d);
    var coForm = !!d.getElementById('traCuuKhaiForm'); boScript(d);
    var txt = clean(d.body ? d.body.textContent : '');
    var hi = null;
    [].some.call(d.querySelectorAll('tr'), function (tr) { var t = C.boDau(clean(tr.textContent)).toLowerCase(); if (tr.cells.length >= 8 && t.indexOf('ma giao dich') >= 0 && t.indexOf('ngay nop') >= 0) { hi = tr; return true; } return false; });
    var mt = txt.match(/Có\s*(\d+)\s*bản ghi/i), tp = txt.match(/Trang\s*\d+\s*\/\s*(\d+)/i);
    if (!hi) {
      if (coForm || /không có (dữ liệu|kết quả|bản ghi|hồ sơ)|không tìm thấy (dữ liệu|kết quả|bản ghi|hồ sơ)/i.test(txt)) return { ok: true, total: mt ? +mt[1] : 0, pages: 0, rows: [] };
      return { ok: false, msg: txt.slice(0, 220) };
    }
    var heads = [].map.call(hi.cells, function (c) { return C.boDau(clean(c.textContent)).toLowerCase(); });
    function idx(key, tru) { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf(key) >= 0 && (!tru || heads[i].indexOf(tru) < 0)) return i; return -1; }
    var I = { ma: idx('ma giao dich'), tk: idx('to khai'), ky: idx('ky tinh thue'), loai: idx('loai to khai'), lanBS: idx('lan bo sung'), lan: idx('lan nop', 'bo sung'), ngay: idx('ngay nop'), cqt: idx('noi nop'), tt: idx('trang thai') };
    if (I.tk === I.loai) I.tk = idx('phu luc');
    var rows = [], bang = hi.closest('table');
    [].forEach.call(bang.querySelectorAll('tr'), function (tr) {
      if (tr === hi || !tr.cells || tr.cells.length < heads.length - 2 || !/^\d+$/.test(clean(tr.cells[0].textContent))) return;
      var td = tr.cells; function c(k) { return I[k] >= 0 && td[I[k]] ? clean(td[I[k]].textContent) : ''; }
      var lk = tr.querySelector('[onclick*="downloadTkhai"]'), ma = c('ma');
      if (!ma && lk) ma = ((lk.getAttribute('onclick') || '').match(/downloadTkhai\(\s*'([^']+)'/) || [])[1] || '';
      if (!ma) return;
      var tk = c('tk'), code = maTkEtax(tk), ten = clean(tk.slice(code.length).replace(/^\s*-\s*/, ''));
      rows.push({ ma: ma, tthc: '', tk: code + ' - ' + ten, tkCode: code, ky: c('ky'), loai: c('loai'), lanBS: c('lanBS'), lan: c('lan'), cqt: c('cqt'), ngay: c('ngay'), tt: c('tt'), src: 'etax', noLink: !lk, coTB: !!tr.querySelector('[onclick*="thongBao"]') });
    });
    var total = mt ? +mt[1] : rows.length;
    return { ok: true, total: total, pages: tp ? +tp[1] : Math.max(1, Math.ceil(total / 10)), rows: rows };
  }
  function bodyEtax(tu, den, pn) {
    var p = new URLSearchParams(); (EX.form || []).forEach(function (kv) { p.set(kv[0], kv[1]); });
    p.set('maTKhai', S.maTK || EX.tatCa || '00'); p.set('qryFromDate', tu); p.set('qryToDate', den); p.set('dse_nextEventName', 'query'); p.set('pn', String(pn || 1));
    return p.toString();
  }
  function traEtax(tu, den, pn) { return call('/etaxnnt/Request', { method: 'POST', form: bodyEtax(tu, den, pn), html: true }); }
  function tenTuCD(cd) { var m = String(cd || '').match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i); try { return m ? decodeURIComponent(m[1]) : ''; } catch (e) { return m ? m[1] : ''; } }
  async function taiMotEtax(r, base, dir, kq) {
    if (r.noLink) throw new ApiError('nolink', 0, 'Trang thuế điện tử không có nút tải cho hồ sơ này');
    var res = await call(urlTaiEtax(r.ma), { bin: true });
    if (!res.file) throw new ApiError('reject', 200, 'Hồ sơ không hợp lệ – trang thuế điện tử trả về trang web thay vì file');
    var u8 = res.u8, ten = tenTuCD(res.cd), parts = null;
    if (!S.mstX) { var mm = new TextDecoder().decode(u8.slice(0, 8000)).match(/<mst>\s*(\d{10}(?:-\d{3})?)\s*<\/mst>/i); if (mm) S.mstX = mm[1]; }
    if (u8[0] === 0x50 && u8[1] === 0x4B) { try { parts = await C.unzip(u8); } catch (e) { parts = null; } }
    if (parts && parts.length) parts.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p, k) { var ext = extOf(p.name, 'bin'); kq.files.push([dir + (k === 0 && ext === 'xml' ? base + '.xml' : base + '_DinhKem' + k + '.' + ext), p.bytes]); });
    else kq.files.push([dir + base + '.' + extOf(ten, u8[0] === 0x25 ? 'pdf' : 'xml'), u8]);
    if (!J.tb || !r.coTB) return kq;
    try {
      var h = await call(urlTbEtax(r.ma), {}), d = new DOMParser().parseFromString(h, 'text/html'), f = d.forms.tkhaiForm || d.getElementById('tkhaiForm');
      var ds = [].slice.call(d.querySelectorAll('[onclick*="downloadFile"]')).map(function (a) {
        var id = ((a.getAttribute('onclick') || '').match(/downloadFile\(\s*'([^']+)'/) || [])[1], tr = a.closest('tr'), tenTB = '';
        if (tr) [].some.call(tr.cells, function (c) { var t = clean(c.textContent); if (/V\/v/i.test(t)) { tenTB = t.replace(/^V\/v:?\s*/i, ''); return true; } return false; });
        return { id: id, ten: tenTB };
      }).filter(function (x) { return x.id; });
      if (/gotoPage\(\s*[2-9]/.test(h) || /Trang\s*1\s*\/\s*[2-9]/.test(clean(boScript(d).body.textContent))) J.canhBao.push(r.tkCode + ' ' + (r.ky || '') + ': có hơn 1 trang thông báo – công cụ mới tải trang đầu');
      LOG.ghi('[TB] ' + r.ma + ': ' + ds.length + ' thong bao');
      if (ds.length && !f) throw new ApiError('data', 200, 'Không thấy form tải thông báo');
      for (var i = 0; i < ds.length; i++) {
        try {
          var p = new URLSearchParams(); truong(f).forEach(function (kv) { p.set(kv[0], kv[1]); }); p.set('messageId', ds[i].id); p.set('dse_nextEventName', 'download');
          var rt = await call('/etaxnnt/Request', { method: 'POST', form: p.toString(), bin: true });
          if (!rt.file) throw new ApiError('reject', 200, 'Trang thuế điện tử không trả file thông báo');
          kq.files.push([dir + base + '_TB' + (i + 1) + (ds[i].ten ? '_' + slug(ds[i].ten, 50) : '') + '.' + extOf(tenTuCD(rt.cd), 'xml'), rt.u8]); kq.tb++;
        } catch (e) { if (e.kind === 'session' || e.kind === 'stop') throw e; kq.tbLoi.push('Thông báo ' + (i + 1) + (ds[i].ten ? ' (' + ds[i].ten + ')' : '') + ': ' + (e.message || e)); }
      }
    } catch (e) { if (e.kind === 'session' || e.kind === 'stop') throw e; kq.tbLoi.push('Danh sách thông báo: ' + (e.message || e)); }
    return kq;
  }

  /* ---------- ngày ---------- */
  function d2(dmy) { return C.dmyToDate(dmy); }
  function chiaThang(tu, den) { return C.splitMonths(tu, den); } // mỗi đoạn trong 1 tháng dương lịch → luôn ≤ 30 ngày chênh lệch
  // Hồ sơ nộp trước 01/07/2025 nằm ở tab "Thuế điện tử": trang dịch vụ công cho tra khoảng dài (đã thử 18 tháng/1 mã, 02/11/2026) → mỗi lượt 12 tháng.
  // Từ 01/07/2025: tab DVC, tối đa 30 ngày/lượt → mỗi tháng 1 lượt.
  function chiaDoan(tu, den) {
    var out = [], mocDVC = d2(NGAY_DVC), a = d2(tu), b = d2(den);
    if (false && a < mocDVC) { // bản 1.1.0: hồ sơ trước 01/07/2025 tải trên thuedientu.gdt.gov.vn (tab "Thuế điện tử" của trang dịch vụ công báo lỗi với năm cũ)
      var cuoiTDT = b < mocDVC ? b : new Date(2025, 5, 30), cur = new Date(a);
      while (cur <= cuoiTDT) {
        var e = new Date(cur.getFullYear() + 1, cur.getMonth(), cur.getDate() - 1); if (e > cuoiTDT) e = new Date(cuoiTDT);
        out.push({ k: 'tdt', x: C.dateToDMY(cur), y: C.dateToDMY(e) });
        cur = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
      }
    }
    if (b >= mocDVC) chiaThang(C.dateToDMY(a < mocDVC ? mocDVC : a), den).forEach(function (m) { out.push({ k: 'dvc', x: m[0], y: m[1] }); });
    return out;
  }
  function ngayNop(s) { var m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/); return m ? { dmy: m[1] + '/' + m[2] + '/' + m[3], gio: m[4] ? m[4] + ':' + m[5] : '', k: m[3] + m[2] + m[1] + (m[4] || '00') + (m[5] || '00') } : { dmy: '', gio: '', k: '' }; }

  /* ---------- gom nhóm nhiều lần nộp ---------- */
  var RE_KHONG_HL = /hủy|từ chối|không (được )?chấp nhận|không hợp lệ|không tiếp nhận|trả lại|lỗi/i;
  var RE_CHO = /chờ|đang xử lý|đang tiếp nhận|đã tiếp nhận/i;
  function gomNhom(rows) {
    var g = {};
    rows.forEach(function (r) {
      r.__n = ngayNop(r.ngay);
      r.hieuLuc = !RE_KHONG_HL.test(r.tt);
      r.key = r.ky ? C.boDau(r.tkCode).toUpperCase() + '|' + r.ky : 'ma:' + r.ma;
      (g[r.key] = g[r.key] || []).push(r);
    });
    Object.keys(g).forEach(function (k) {
      var L = g[k].sort(function (a, b) { return a.__n.k < b.__n.k ? -1 : a.__n.k > b.__n.k ? 1 : 0; });
      var hl = L.filter(function (r) { return r.hieuLuc; }), cuoi = hl[hl.length - 1] || null;
      L.forEach(function (r, i) {
        r.nLan = L.length; r.thuTu = i + 1; r.cuoi = r === cuoi;
        var cb = [];
        if (!r.hieuLuc) cb.push('Trạng thái "' + r.tt + '" – không tính là lần nộp hiệu lực');
        if (L.length > 1 && r.ky) cb.push('Kỳ có ' + L.length + ' lần nộp' + (r.cuoi ? ' – đây là lần hiệu lực cuối' : r.hieuLuc ? ' – đã có lần nộp sau' : ''));
        if (r.cuoi && RE_CHO.test(r.tt)) cb.push('Lần cuối chưa có kết quả xử lý');
        if (r.ky && !cuoi) cb.push('Kỳ này chưa có lần nộp hợp lệ');
        r.canhBao = cb.join('; ');
      });
    });
    return g;
  }

  /* ---------- tên file ---------- */
  function slug(s, max) { return C.boDau(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max || 60).replace(/-+$/, ''); }
  function slugTK(code) { return slug(code, 40).toUpperCase() || 'KHAC'; }
  function slugKy(ky) {
    ky = String(ky || '').trim(); if (!ky) return '';
    var m;
    if ((m = ky.match(/^Q(\d)\/(\d{4})$/i))) return 'Q' + m[1] + '-' + m[2];
    if ((m = ky.match(/^(\d{1,2})\/(\d{4})$/))) return 'T' + C.pad(m[1]) + '-' + m[2];
    if ((m = ky.match(/^(\d{4})$/))) return 'Nam-' + m[1];
    return slug(ky, 30);
  }
  function tenGoc(r) {
    var p = [slugTK(r.tkCode)], k = slugKy(r.ky); if (k) p.push(k);
    p.push('Lan' + (r.lan || '1'));
    if (/bổ sung/i.test(r.loai)) p.push('BoSung' + (r.lanBS && r.lanBS !== '0' ? r.lanBS : ''));
    else if (/chính thức/i.test(r.loai)) p.push('ChinhThuc');
    else if (r.loai) p.push(slug(r.loai, 20).replace(/-/g, ''));
    p.push('nop-' + (r.__n.dmy || '').replace(/\//g, '-'));
    p.push(String(r.ma).split('-').pop());
    return p.join('_');
  }

  /* ---------- giao diện (Shadow DOM để không đụng CSS trang dịch vụ công) ---------- */
  function dateBox(id, label) {
    return '<div class="db" data-db="' + id + '" role="group" aria-label="' + label + '"><input data-p="d" inputmode="numeric" maxlength="2" placeholder="dd" aria-label="' + label + ': ngày">/' +
      '<input data-p="m" inputmode="numeric" maxlength="2" placeholder="mm" aria-label="' + label + ': tháng">/<input class="y" data-p="y" inputmode="numeric" maxlength="4" placeholder="yyyy" aria-label="' + label + ': năm"><input type="hidden" id="' + id + '"></div>';
  }
  var host = document.createElement('div'); host.id = 'qtt-tk-host';
  var W0 = Math.min(760, window.innerWidth - 24);
  host.style.cssText = 'position:fixed;z-index:2147483646;top:24px;left:' + Math.max(12, Math.round((window.innerWidth - W0) / 2)) + 'px;width:' + W0 + 'px;max-width:calc(100vw - 24px)';
  var root = host.attachShadow({ mode: 'open' });
  var CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.w{--bg:#FBF8F2;--bg2:#F7F2E8;--ink:#231E19;--mute:#6B6259;--line:#E3DACB;--line2:#D3C7B4;--amb:#B06A22;--amb-bg:#F6E7D3;--g:#2F7D4F;--g-bg:#E3F1E8;--red:#A63A2B;--red-bg:#F8E3DE;--blue:#2F5F8F;--blue-bg:#E2ECF5;' +
    'font:13.5px/1.5 "Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);border:1px solid var(--line2);border-radius:14px;box-shadow:0 18px 50px -12px rgba(35,30,25,.45);display:flex;flex-direction:column;max-height:calc(100vh - 48px);overflow:hidden}' +
    '.h{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:move;user-select:none;background:var(--bg2)}' +
    '.h img{width:32px;height:32px}.h .t{flex:1;line-height:1.25;min-width:0}.h .t b{font:600 14.5px "Lexend","Segoe UI",sans-serif;display:block}.h .t small{color:var(--mute);font-size:11.5px}' +
    '.ib{border:0;background:none;cursor:pointer;width:28px;height:28px;border-radius:7px;font-size:17px;color:var(--mute)}.ib:hover{background:var(--line)}' +
    '.b{padding:12px 14px;display:flex;flex-direction:column;gap:12px;overflow:auto}.min .b{display:none}.b>*{flex-shrink:0}' +
    '.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;white-space:nowrap}.ok{background:var(--g-bg);color:var(--g)}.bad{background:var(--red-bg);color:var(--red)}.info{background:var(--blue-bg);color:var(--blue)}.warn{background:var(--amb-bg);color:var(--amb)}.mut{background:var(--line);color:var(--mute)}' +
    '.lbl{font-size:12px;font-weight:600;color:var(--mute);display:block;margin-bottom:4px}.req{color:var(--red)}' +
    '.seg{display:inline-flex;border:1px solid var(--line2);border-radius:9px;padding:3px;background:var(--bg2);gap:3px}.seg button{border:0;background:none;padding:4px 12px;border-radius:7px;cursor:pointer;color:var(--mute);font:600 12.5px inherit;font-family:inherit}.seg button[aria-pressed=true]{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}' +
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    'input.in,select.in{width:100%;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:7px 9px;font:inherit;color:var(--ink);min-width:0}input.mono{font-family:Consolas,"IBM Plex Mono",monospace}' +
    '.chk{display:inline-flex;gap:7px;align-items:center;cursor:pointer}.chk input{width:15px;height:15px;accent-color:var(--amb);margin:0}' +
    '.btn{border:1px solid var(--line2);background:#fff;padding:8px 14px;border-radius:9px;cursor:pointer;font:600 13.5px inherit;font-family:inherit;color:var(--ink);display:inline-flex;gap:6px;align-items:center}.btn.pri{background:var(--amb);border-color:var(--amb);color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.sm{padding:5px 10px;font-size:12.5px}.btn.q{padding:4px 10px;font-size:12px;font-weight:600;color:var(--blue);border-color:var(--line2);background:var(--bg2)}' +
    '.hint{font-size:12px;color:var(--mute)}.msg{font-size:12.5px;padding:8px 10px;border-radius:8px}.msg.e{background:var(--red-bg);color:var(--red);font-weight:600}.msg.i{background:var(--blue-bg);color:var(--blue)}.msg.o{background:var(--g-bg);color:var(--g)}.msg.w{background:var(--amb-bg);color:#7a4a17;font-weight:600}' +
    '.tw{border:1px solid var(--line);border-radius:10px;max-height:340px;overflow:auto;background:#fff}table{border-collapse:collapse;width:100%;font-size:12px}th{position:sticky;top:0;background:var(--bg2);text-align:left;color:var(--mute);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line2);white-space:nowrap;z-index:1}td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}td.m{font-family:Consolas,monospace;font-size:11.5px;white-space:nowrap}td.nw{white-space:nowrap}tr.grp td{border-top:2px solid var(--line2)}tr.off td{color:#9a8f82}tr.off td .tkc{text-decoration:line-through}' +
    '.tkc{font-weight:600}.sub{display:block;font-size:11px;color:var(--mute)}' +
    '.out{border:1px solid var(--line);background:var(--bg2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px}' +
    '.bar{height:9px;background:var(--line);border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--amb);transition:width .25s}' +
    '.stats{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute)}.stats b{color:var(--ink)}' +
    '.red{color:var(--red);font-weight:600;font-size:12.5px;display:flex;gap:6px;align-items:flex-start}' +
    '.db{display:flex;align-items:center;gap:1px;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:4px 9px;font-family:Consolas,"IBM Plex Mono",monospace;color:var(--mute)}.db:focus-within{border-color:var(--amb);box-shadow:0 0 0 2px var(--amb-bg)}' +
    '.db input{border:0;outline:0;background:transparent;font:14px Consolas,"IBM Plex Mono",monospace;color:var(--ink);text-align:center;padding:3px 0;width:2.6ch}.db input.y{width:4.6ch}.db input::placeholder{color:#b9ad9c}.db input:focus{background:var(--amb-bg);border-radius:4px}' +
    '.scan{display:flex;gap:14px;align-items:center;border:1px solid var(--line);background:var(--bg2);border-radius:12px;padding:10px 14px}.scan .lup{width:56px;height:56px;flex:none;animation:lup 1.6s ease-in-out infinite;transform-origin:50% 60%}.scan-b{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}' +
    '@keyframes lup{0%,100%{transform:translate(0,0) rotate(-4deg)}25%{transform:translate(4px,-3px) rotate(3deg)}50%{transform:translate(0,-5px) rotate(-2deg)}75%{transform:translate(-4px,-2px) rotate(4deg)}}' +
    '@media (prefers-reduced-motion:reduce){.scan .lup{animation:none}}' +
    '.cap{border:1.5px solid var(--amb);background:#fff;border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:8px}.cap b{font-size:13.5px}.cap .capimg{height:46px;min-width:140px;border:1px solid var(--line2);border-radius:7px;background:#eee;object-fit:contain}.cap input.in{width:170px;font-size:16px;letter-spacing:2px}' +
    '.resume{border:1.5px solid var(--blue);background:var(--blue-bg);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:8px;color:var(--blue)}' +
    '[hidden]{display:none!important}';

  root.innerHTML = '<style>' + CSS + '</style>' +
    '<div class="w" id="w">' +
    '<div class="h" id="drag"><img src="' + DOM_ICON + '" alt=""><div class="t"><b>Tải tờ khai thuế đã nộp hàng loạt</b><small>Quản trị tử tế · bản ' + VER + ' · ' + (ETAX ? 'trang thuế điện tử' : 'trang dịch vụ công') + '</small></div><span id="ses"><span class="pill mut">Đang kiểm tra…</span></span><button class="ib" id="bmin" title="Thu nhỏ">–</button><button class="ib" id="bx" title="Đóng">×</button></div>' +
    '<div class="b">' +
    '<div class="resume" id="resume" hidden><b id="resumet"></b><div class="row"><button class="btn pri sm" id="bresume">Điền sẵn khoảng ngày còn lại</button><button class="btn sm" id="bresumex">Bỏ qua</button></div></div>' +
    '<div id="form">' +
    '<p class="msg i" style="margin:0 0 10px"><b>Nộp ở đâu – tải ở đó.</b> ' + (ETAX
      ? 'Trang này (thuedientu.gdt.gov.vn) có hồ sơ nộp trên Thuế điện tử – toàn bộ trước 01/07/2025 và phần nộp tại đây sau đó. Hồ sơ nộp trên trang dịch vụ công (từ 01/07/2025) → mở dichvucong.gdt.gov.vn và bấm lại nút này. Giai đoạn 07–12/2025 nên chạy ở cả 2 trang.'
      : 'Trang dịch vụ công có hồ sơ nộp từ 01/07/2025. Hồ sơ nộp trước 01/07/2025 (và hồ sơ 07–12/2025 nộp trên Thuế điện tử) → mở thuedientu.gdt.gov.vn, đăng nhập rồi bấm lại nút này.') + '</p>' +
    '<span class="lbl">Ngày nộp hồ sơ <span class="req">*</span></span>' +
    '<div class="g2">' + dateBox('dtu', 'Từ ngày') + dateBox('dden', 'Đến ngày') + '</div>' +
    '<div class="row" style="margin-top:6px;gap:6px"><button class="btn q" data-q="thangtruoc">Tháng trước</button><button class="btn q" data-q="quytruoc">Quý trước</button><button class="btn q" data-q="namnay">Năm nay</button><button class="btn q" data-q="namtruoc">Năm trước</button>' + (ETAX ? '<button class="btn q" data-q="tatca">Tất cả (từ 2015)</button>' : '') + '</div>' +
    '<p class="hint" id="khint" style="margin:6px 0 0"></p>' +
    '<div style="margin-top:10px"><span class="lbl">Loại tờ khai</span><select class="in" id="ltk"><option value="">Tất cả</option></select></div>' +
    '<div class="out" style="margin-top:10px"><span class="lbl" style="margin:0">Nhận về (1 file ZIP)</span><span class="hint" style="margin:0">Mỗi hồ sơ: file XML tờ khai' + (ETAX ? '' : ' + file đính kèm (nếu có)') + ', xếp theo thư mục từng loại tờ khai. Kèm Bảng kê Excel (danh sách hồ sơ, gom theo tờ khai & kỳ).' + (ETAX ? ' Chỉ hỏi chỗ lưu 1 lần cho cả file ZIP.' : '') + '</span>' +
    '<div class="row" style="gap:8px"><span class="lbl" style="margin:0">Chế độ</span><div class="seg" id="mode"><button data-v="day" aria-pressed="true">Đầy đủ – kèm thông báo của CQT</button><button data-v="nhanh" aria-pressed="false">Tải nhanh – chỉ tờ khai</button></div></div>' +
    '<span class="hint" id="modeh" style="margin:0"></span><input type="checkbox" id="otb" checked hidden>' +
    '<label class="chk"><input type="checkbox" id="olast"> Chỉ giữ lần hiệu lực cuối của mỗi kỳ (các lần nộp trước và hồ sơ hủy vẫn liệt kê trong Excel)</label>' +
    '<label class="chk"' + (ETAX ? ' hidden' : '') + '><input type="checkbox" id="obell"' + (ETAX ? '' : ' checked') + '> Gọi khi cần gõ mã: chuông + nhấp nháy tên tab + thông báo trên màn hình (làm việc khác trong lúc chờ)</label></div>' +
    '<p class="hint" style="margin:6px 0 0">Mẹo: mở ' + TEN + ' ở một <b>cửa sổ Chrome riêng</b> (không để thành tab ẩn phía sau) – Chrome làm chậm hẳn tab bị ẩn lâu.</p>' +
    '<div class="row" style="margin-top:12px"><button class="btn pri" id="bfind" disabled>Tra cứu &amp; tải</button><span class="hint" id="fmsg"></span></div>' +
    '</div>' +
    '<div class="cap" id="cap" hidden><b id="capt"></b>' +
    '<span class="hint">' + TENH + ' yêu cầu mã xác nhận cho mỗi lần tra và chỉ cho tải hồ sơ của lần tra gần nhất – nên công cụ tra xong lượt nào tải luôn lượt đó. Anh/chị đọc mã trong ảnh, gõ vào ô dưới, nhấn Enter. Công cụ không tự đọc mã.</span>' +
    '<div class="row"><img class="capimg" id="capimg" alt="Mã xác nhận của ' + TEN + '"><button class="btn sm" id="capnew" title="Lấy mã khác nếu khó đọc">↻ Đổi mã khác</button></div>' +
    '<div class="row"><input class="in mono" id="capin" maxlength="12" autocomplete="off" spellcheck="false" aria-label="Mã xác nhận"><button class="btn pri" id="capok">Tra &amp; tải</button><button class="btn sm" id="capskip">Bỏ qua lượt này</button><button class="btn sm" id="capstop">Dừng, lưu phần đã tải</button></div>' +
    '<p class="msg e" id="caperr" hidden></p></div>' +
    '<div class="scan" id="scan" hidden><img class="lup" src="' + DOM_LUP + '" alt="Đốm đang tra cứu"><div class="scan-b"><b id="scant">Đang đọc danh sách…</b><div class="bar"><i id="scanbar"></i></div><span class="hint" id="scanh"></span></div></div>' +
    '<div id="res" hidden style="display:flex;flex-direction:column;gap:10px">' +
    '<div class="row" id="sum"></div>' +
    '<p class="msg w" id="reswarn" hidden></p>' +
    '<div class="row"><span class="lbl" style="margin:0">Lọc nhanh</span><input class="in" id="flt" style="flex:1 1 200px" aria-label="Lọc nhanh" title="Lọc nhanh theo tờ khai, kỳ, mã hồ sơ, trạng thái"><div class="seg" id="srt"><button data-v="tk" aria-pressed="true">Theo tờ khai & kỳ</button><button data-v="ngay" aria-pressed="false">Theo ngày nộp</button></div></div>' +
    '<div class="tw"><table><thead><tr><th>Tờ khai</th><th>Kỳ</th><th>Loại · Lần</th><th>Ngày nộp</th><th>Trạng thái</th><th>Tải</th><th>Mã hồ sơ</th></tr></thead><tbody id="tb"></tbody></table></div>' +
    '</div>' +
    '<div id="prog" hidden style="display:flex;flex-direction:column;gap:8px">' +
    '<div class="row" style="justify-content:space-between"><b id="ptxt"></b><span class="hint" id="peta"></span></div><div class="bar"><i id="pbar"></i></div>' +
    '<div class="stats"><span>Thành công <b id="pok">0</b></span><span>Thông báo <b id="ptb">0</b></span><span>Lỗi <b id="perr">0</b></span><span id="pcur" style="font-family:Consolas,monospace"></span></div>' +
    '<p class="msg i" id="pnext" hidden></p>' +
    '<div class="red"><span>⚠</span><span>Không đóng tab, không tải lại trang và không đăng xuất ' + TEN + ' khi đang tải.</span></div>' +
    '<div class="row"><button class="btn sm" id="bstop">Dừng, lưu phần đã tải</button></div></div>' +
    '<div id="msg" class="msg" hidden></div>' +
    '</div></div>';
  document.documentElement.appendChild(host);
  var $ = function (id) { return root.getElementById(id); };
  window.__qttTK = { show: function () { if (!document.documentElement.contains(host)) document.documentElement.appendChild(host); $('w').classList.remove('min'); }, log: LOG, state: S };

  function say(text, type) { var m = $('msg'); if (!text) { m.hidden = true; return; } m.className = 'msg ' + (type || 'i'); m.textContent = text; m.hidden = false; }

  /* kéo thả, thu nhỏ, đóng */
  (function () {
    var drag = $('drag'), on = false, sx, sy, ox, oy;
    drag.addEventListener('mousedown', function (e) { if (e.target.closest('button')) return; on = true; sx = e.clientX; sy = e.clientY; var r = host.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; host.style.left = Math.max(0, Math.min(window.innerWidth - 80, ox + e.clientX - sx)) + 'px'; host.style.top = Math.max(0, Math.min(window.innerHeight - 40, oy + e.clientY - sy)) + 'px'; });
    window.addEventListener('mouseup', function () { on = false; });
    $('bmin').onclick = function () { $('w').classList.toggle('min'); };
    $('bx').onclick = function () {
      if (S.busy && !S.xacNhanDong) { S.xacNhanDong = 1; say('Đang chạy dở. Bấm × lần nữa để đóng (phần chưa lưu sẽ mất).', 'e'); return; }
      S.stop = true; host.remove(); window.__qttTK = null;
    };
  })();
  window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L') && document.documentElement.contains(host)) { e.preventDefault(); C.saveBlob(new Blob([LOG.text()], { type: 'text/plain;charset=utf-8' }), 'nhat-ky-tai-to-khai.txt'); } });
  window.addEventListener('beforeunload', function (e) { if (S.busy) { luuTiepTuc(); e.preventDefault(); e.returnValue = ''; } });

  /* ---------- ô ngày dd / mm / yyyy ---------- */
  function partsOf(id) { var box = root.querySelector('[data-db="' + id + '"]'); return { d: box.querySelector('[data-p=d]'), m: box.querySelector('[data-p=m]'), y: box.querySelector('[data-p=y]'), box: box }; }
  function syncDate(id) { var P = partsOf(id), d = P.d.value, m = P.m.value, y = P.y.value; $(id).value = (d.length === 1 ? '0' + d : d) + '/' + (m.length === 1 ? '0' + m : m) + '/' + y; capNhatGoiY(); }
  function setDate(id, v) { var p = String(v || '').split('/'), P = partsOf(id); P.d.value = p[0] || ''; P.m.value = p[1] || ''; P.y.value = p[2] || ''; syncDate(id); }
  function wireDate(id, nextId) {
    var P = partsOf(id), order = [P.d, P.m, P.y];
    function go(i) { var el = order[i]; if (!el) { if (nextId) { var n = partsOf(nextId).d; n.focus(); n.select(); } return; } el.focus(); el.select(); }
    order.forEach(function (el, i) {
      var max = i === 2 ? 4 : 2;
      el.addEventListener('dblclick', function () { el.select(); });
      el.addEventListener('mouseup', function (e) { if (el.selectionStart === el.selectionEnd) { e.preventDefault(); el.select(); } });
      el.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text') || '', m = t.match(/(\d{1,2})\D(\d{1,2})\D(\d{4})/);
        if (m) { e.preventDefault(); setDate(id, C.pad(m[1]) + '/' + C.pad(m[2]) + '/' + m[3]); go(3); }
      });
      el.addEventListener('input', function () {
        var v = el.value.replace(/\D/g, '').slice(0, max); el.value = v;
        if (i === 0 && v.length === 1 && +v >= 4) { el.value = '0' + v; v = el.value; }
        if (i === 1 && v.length === 1 && +v >= 2) { el.value = '0' + v; v = el.value; }
        syncDate(id); if (v.length === max) go(i + 1);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && el.value === '' && i > 0) { e.preventDefault(); go(i - 1); }
        else if ((e.key === '/' || e.key === '-' || e.key === '.') && i < 2) { e.preventDefault(); if (el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } go(i + 1); }
        else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && i > 0) { e.preventDefault(); go(i - 1); }
        else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && i < 2) { e.preventDefault(); go(i + 1); }
      });
      el.addEventListener('blur', function () { if (i < 2 && el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } });
    });
  }
  wireDate('dtu', 'dden'); wireDate('dden', null);

  function homNay() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function nhanh(q) {
    var t = homNay(), y = t.getFullYear(), m = t.getMonth(), a, b;
    if (q === 'thangtruoc') { a = new Date(y, m - 1, 1); b = new Date(y, m, 0); }
    else if (q === 'quytruoc') { var qq = Math.floor(m / 3) - 1, yy = y; if (qq < 0) { qq = 3; yy--; } a = new Date(yy, qq * 3, 1); b = new Date(yy, qq * 3 + 3, 0); }
    else if (q === 'namnay') { a = new Date(y, 0, 1); b = t; }
    else if (q === 'tatca') { a = new Date(2015, 0, 1); b = t; }
    else { a = new Date(y - 1, 0, 1); b = new Date(y - 1, 11, 31); }
    setDate('dtu', C.dateToDMY(a)); setDate('dden', C.dateToDMY(b));
  }
  [].forEach.call(root.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { if (!S.busy) nhanh(b.getAttribute('data-q')); }; });

  function kiemNgay() {
    var tu = $('dtu').value, den = $('dden').value;
    if (!C.validDMY(tu)) return { loi: 'Từ ngày chưa đúng (dd/mm/yyyy).' };
    if (!C.validDMY(den)) return { loi: 'Đến ngày chưa đúng (dd/mm/yyyy).' };
    if (d2(tu) > d2(den)) return { loi: 'Từ ngày đang lớn hơn Đến ngày.' };
    if (d2(tu) < new Date(2015, 0, 1)) return { loi: 'Từ ngày quá xa (từ 01/01/2015 trở đi).' };
    if (ETAX) return { tu: tu, den: den, doan: [{ k: 'etax', x: tu, y: den }] };
    var cat = false;
    if (d2(den) < d2(NGAY_DVC)) return { loi: 'Hồ sơ nộp trước 01/07/2025 không nằm trên trang dịch vụ công. Mở thuedientu.gdt.gov.vn, đăng nhập (chữ ký số) rồi bấm nút "Tải tờ khai" tại đó.', etax: true };
    if (d2(tu) < d2(NGAY_DVC)) { tu = NGAY_DVC; cat = true; }
    var doan = chiaDoan(tu, den);
    if (doan.filter(function (x) { return x.k === 'dvc'; }).length > 36) return { loi: 'Phần từ 01/07/2025 trở đi quá dài (tối đa 36 tháng mỗi lần tra).' };
    if (d2(tu) < new Date(2015, 0, 1)) return { loi: 'Từ ngày quá xa (từ 01/01/2015 trở đi).' };
    return { tu: tu, den: den, doan: doan, cat: cat };
  }
  function capNhatGoiY() {
    var el = $('khint'); if (!el) return;
    var k = kiemNgay();
    if (k.loi) { el.textContent = k.etax ? k.loi : 'Lọc theo ngày nộp. Tờ khai quý thường nộp trong tháng đầu quý sau (VD: Q3 nộp trong tháng 10).'; return; }
    if (ETAX) { el.textContent = 'Tra 1 lần cho cả khoảng ngày, không cần mã xác nhận; đọc trang nào tải trang đó (10 hồ sơ/trang). Lọc theo ngày nộp.'; return; }
    var nt = k.doan.filter(function (x) { return x.k === 'tdt'; }).length, nd = k.doan.length - nt, n = k.doan.length;
    var s = (k.cat ? 'Phần trước 01/07/2025 không tra ở đây (tải trên thuedientu.gdt.gov.vn) – chỉ tra từ 01/07/2025. ' : '') + 'Sẽ tra và tải lần lượt ' + n + ' lượt → gõ ' + n + ' mã xác nhận (mỗi tháng 1 lượt). Lượt nào tải xong mới hỏi mã lượt sau. Lọc theo ngày nộp (VD: tờ khai Q3 thường nộp trong tháng 10).';
    el.textContent = s;
  }

  /* ---------- phiên ---------- */
  function hienPhien(ok) {
    S.logged = ok;
    $('ses').innerHTML = ok ? '<span class="pill ok">● Đã đăng nhập</span>' : '<span class="pill bad">Chưa đăng nhập</span>';
    $('bfind').disabled = !ok;
  }
  async function batDau() {
    nhanh(ETAX ? 'namtruoc' : 'thangtruoc');
    try {
      if (ETAX) await moTrangEtax(); else await moTrangTraCuu();
      hienPhien(true);
      var sel = $('ltk'); S.loaiTK.forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
      var nho = store('ltk'); if (nho) sel.value = nho;
    } catch (e) {
      hienPhien(false);
      LOG.loi('Mo trang tra cuu', e && e.message);
      say(e.kind === 'session' ? 'Chưa thấy đăng nhập ' + TEN + '. Anh/chị đăng nhập ' + HOST + (ETAX ? ' (bằng chữ ký số)' : ' (tài khoản doanh nghiệp)') + ' rồi bấm lại nút "Tải tờ khai" trên thanh dấu trang.' : 'Chưa mở được mục ' + (ETAX ? 'Tra cứu tờ khai' : 'Tra cứu hồ sơ') + ' của ' + TEN + ': ' + (e.message || e) + '. Thử bấm lại nút sau ít phút.', 'e');
    }
    kiemTiepTuc();
  }

  /* ---------- hỏi mã xác nhận cho 1 tháng ---------- */
  function hoiMa(i, n, x, y, loi) {
    return new Promise(function (resolve, reject) {
      $('cap').hidden = false; $('capt').textContent = 'Lượt ' + i + '/' + n + ': ' + x + ' → ' + y + (S.kDoan === 'tdt' ? ' (hồ sơ trên thuế điện tử)' : '') + ' – gõ mã để tra và tải';
      $('w').classList.remove('min'); if (i > 1 && !loi) goiNguoiDung('Cần gõ mã xác nhận – lượt ' + i + '/' + n + ' (' + x + ' → ' + y + ')');
      $('caperr').hidden = !loi; $('caperr').textContent = loi || '';
      function xong() { thoiGoi(); $('cap').hidden = true; $('capnew').onclick = $('capok').onclick = $('capskip').onclick = $('capstop').onclick = $('capin').onkeydown = null; }
      function moi() {
        $('capin').value = '';
        var img = $('capimg');
        img.onerror = function () { $('caperr').hidden = false; $('caperr').textContent = 'Chưa tải được ảnh mã xác nhận. Bấm "Đổi mã khác" để thử lại.'; };
        img.src = BASE + 'getCaptcha?' + Date.now();
        setTimeout(function () { $('capin').focus(); }, 50);
      }
      $('capnew').onclick = moi;
      $('capok').onclick = function () { var v = $('capin').value.trim(); if (!v) { $('capin').focus(); return; } xong(); LOG.ghi('[MA] Nguoi dung nhap ma xac nhan cho thang ' + x + ' -> ' + y); resolve(v); };
      $('capin').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('capok').click(); } };
      $('capskip').onclick = function () { xong(); LOG.ghi('[MA] Nguoi dung bo qua thang ' + x + ' -> ' + y); resolve(null); };
      $('capstop').onclick = function () { xong(); reject(new ApiError('stop', 0, 'Đã dừng')); };
      moi();
    });
  }

  function scan(on, title, pct, hint) {
    $('scan').hidden = !on; if (!on) return;
    $('scant').textContent = title || ''; $('scanbar').style.width = Math.max(3, Math.min(100, pct || 0)) + '%'; $('scanh').textContent = hint || '';
  }

  /* ---------- tra cứu ---------- */
  /* ==========================================================================
     TRA CỨU & TẢI THEO TỪNG THÁNG
     Kiểm chứng trên trang dịch vụ công thật 02/11/2026: lệnh tải hồ sơ chỉ nhận hồ sơ thuộc LẦN TRA GẦN NHẤT
     (hồ sơ tháng khác báo 500 "Hồ sơ truyền lên không hợp lệ") → tra xong tháng nào tải luôn tháng đó.
     ========================================================================== */
  var J = null;
  var RE_KHL = /không hợp lệ|tải hồ sơ thất bại/i, RE_TB_LOI = /không hợp lệ|tải file thất bại/i;
  function b64(s) { var bin = atob(String(s || '').replace(/\s/g, '')), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  function extOf(n, def) { var m = String(n || '').match(/\.([A-Za-z0-9]{1,5})$/); return m ? m[1].toLowerCase() : def; }
  function uniqueName(n) { var base = n.replace(/(\.[^.\/]+)$/, ''), ext = (n.match(/(\.[^.\/]+)$/) || [''])[0], out = n, i = 2; while (J.names[out]) out = base + '_' + (i++) + ext; J.names[out] = 1; return out; }
  function chu(el) { var w = el.ownerDocument.createTreeWalker(el, 4), a = [], n; while ((n = w.nextNode())) a.push(n.nodeValue); return clean(a.join(' ')); }
  // các thông báo trên trang chi tiết hồ sơ: [{id, ten, gio}]
  function docThongBao(html) {
    var d = new DOMParser().parseFromString(html, 'text/html'), out = [];
    [].slice.call(d.querySelectorAll('[onclick*="downloadThongBao"]')).forEach(function (a) {
      var id = a.getAttribute('data-id'); if (!id) return;
      var el = a, txt = '';
      for (var k = 0; k < 5 && el; k++) { el = el.parentElement; if (!el) break; txt = chu(el); if (/V\/v/i.test(txt)) break; }
      var ten = (txt.match(/V\/v:?\s*(.+?)(?=\s+\d{1,2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}|\s+Tải xuống|$)/i) || [])[1] || '';
      var fn = ((a.getAttribute('onclick') || '').match(/(\w*downloadThongBao\w*)/) || [])[1] || '';
      var attrs = [].slice.call(a.attributes).filter(function (x) { return /^data-/.test(x.name); }).map(function (x) { return x.name + '=' + x.value; }).join(' ');
      out.push({ id: id, ten: clean(ten), loai: a.getAttribute('data-loai-tbao') || a.getAttribute('data-loaitbao') || '', fn: fn, attrs: attrs });
    });
    return out;
  }
  function soSanh(a, b) {
    var x = C.boDau(a.tkCode).localeCompare(C.boDau(b.tkCode)); if (x) return x;
    var ka = kySort(a.ky), kb = kySort(b.ky); if (ka !== kb) return ka < kb ? -1 : 1;
    return a.__n.k < b.__n.k ? -1 : a.__n.k > b.__n.k ? 1 : 0;
  }
  function kySort(ky) {
    var m; ky = String(ky || '');
    if ((m = ky.match(/^Q(\d)\/(\d{4})$/i))) return m[2] + '-' + C.pad(+m[1] * 3) + 'q';
    if ((m = ky.match(/^(\d{1,2})\/(\d{4})$/))) return m[2] + '-' + C.pad(m[1]) + 'm';
    if ((m = ky.match(/^(\d{4})$/))) return m[1] + '-13';
    if ((m = ky.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) return m[3] + '-' + m[2] + 'd' + m[1];
    return 'zzzz' + ky;
  }

  // tải 1 hồ sơ (đã nằm trong lần tra gần nhất). Trả về {files:[[tên, bytes]], tb}
  async function taiMot(r) {
    r.__n = r.__n || ngayNop(r.ngay);
    var base = tenGoc(r), dir = slugTK(r.tkCode) + '/', kq = { files: [], tb: 0, tbLoi: [] };
    if (r.src === 'etax') return taiMotEtax(r, base, dir, kq);
    var tdt = r.src === 'tdt';
    var j = await call(BASE + (tdt ? 'tchs/downloadhoso-tdt?loaiTraCuu=ETAX' : 'tchs/downloadhoso'), { method: 'POST', json: { maHoSo: r.ma }, khongThuLai: RE_KHL });
    if (!j || !j.content) throw new ApiError('data', 200, (j && (j.error || j.message)) || '' + TENH + ' không có nội dung file');
    var u8 = b64(j.content), parts = null;
    if (u8[0] === 0x50 && u8[1] === 0x4B) { try { parts = await C.unzip(u8); } catch (e) { parts = null; } }
    if (parts && parts.length) {
      parts.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p) {
        var nm = p.name.split('/').pop(), m = nm.match(/_(\d+)\.([A-Za-z0-9]+)$/), so = m ? +m[1] : 0, ext = extOf(nm, 'bin');
        kq.files.push([dir + (so === 0 && ext === 'xml' ? base + '.xml' : base + '_DinhKem' + (so || '') + '.' + ext), p.bytes]);
      });
    } else kq.files.push([dir + base + '.' + extOf(j.fileName, u8[0] === 0x50 ? 'zip' : 'xml'), u8]);
    if (J.tb && tdt) {
      // thuế điện tử: 1 lệnh trả về 1 gói ZIP chứa mọi thông báo của hồ sơ (đã kiểm 02/11/2026)
      try {
        var jz = await call(BASE + 'tchs/downloadthongbao-tdt?loaiTraCuu=ETAX', { method: 'POST', json: { idTbao: r.ma, loaiTBao: '' }, khongThuLai: RE_TB_LOI });
        if (!jz || !jz.content) throw new ApiError('data', 200, 'Không có nội dung thông báo');
        var tu8 = b64(jz.content), tp = null;
        if (tu8[0] === 0x50 && tu8[1] === 0x4B) { try { tp = await C.unzip(tu8); } catch (e) { tp = null; } }
        if (tp && tp.length) tp.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p, k) { kq.files.push([dir + base + '_TB' + (k + 1) + '.' + extOf(p.name, 'xml'), p.bytes]); kq.tb++; });
        else { kq.files.push([dir + base + '_TB1.' + extOf(jz.fileName, 'xml'), tu8]); kq.tb++; }
      } catch (e) {
        if (e.kind === 'session' || e.kind === 'stop') throw e;
        kq.tbLoi.push('Thông báo: ' + (e.message || e));
      }
    } else if (J.tb) {
      var ds = docThongBao(await call(BASE + 'tchs/files/detail/' + encodeURIComponent(r.ma) + '?loai=', {}));
      LOG.ghi('[TB] ' + r.ma + ': ' + ds.length + ' thong bao');
      for (var i = 0; i < ds.length; i++) {
        var t = ds[i];
        try {
          if (t.fn !== 'downloadThongBao' || t.attrs.split(' ').length > 1) LOG.ghi('[TB] Thong bao ' + (i + 1) + ' (' + t.ten + '): ham ' + t.fn + ' | ' + t.attrs);
          var jt = await call(BASE + 'tchs/downloadthongbao', { method: 'POST', json: { idTbao: t.id, loaiTBao: t.loai }, khongThuLai: RE_TB_LOI });
          if (!jt || !jt.content) throw new ApiError('data', 200, 'Không có nội dung thông báo');
          kq.files.push([dir + base + '_TB' + (i + 1) + (t.ten ? '_' + slug(t.ten, 50) : '') + '.' + extOf(jt.fileName, jt.fileType && /^[a-z]{2,5}$/i.test(jt.fileType) ? jt.fileType.toLowerCase() : 'xml'), b64(jt.content)]); kq.tb++;
        } catch (e) {
          if (e.kind === 'session' || e.kind === 'stop') throw e;
          kq.tbLoi.push('Thông báo ' + (i + 1) + (t.ten ? ' (' + t.ten + ')' : '') + ': ' + (e.message || e));
        }
      }
    }
    return kq;
  }

  /* ---------- gọi người dùng khi cần gõ mã (chuông, nhấp nháy tab, thông báo hệ thống) ---------- */
  var G = { t: null, title: '', ac: null, n: null };
  function chuong() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      G.ac = G.ac || new AC(); var ac = G.ac; if (ac.state === 'suspended') ac.resume();
      [[880, 0], [1175, 0.18], [880, 0.5], [1175, 0.68]].forEach(function (b) {
        var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + b[1];
        o.type = 'sine'; o.frequency.value = b[0]; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.18);
      });
    } catch (e) { }
  }
  function xinQuyenThongBao() { try { var AC = window.AudioContext || window.webkitAudioContext; if (AC && !G.ac && $('obell').checked) G.ac = new AC(); } catch (e) { } try { if ($('obell').checked && window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { } }
  function goiNguoiDung(txt) {
    if (!$('obell').checked) return;
    thoiGoi(); chuong(); G.lap = setInterval(chuong, 30000);
    G.title = document.title; var bat = false;
    G.t = setInterval(function () { bat = !bat; document.title = bat ? '🔔 Cần gõ mã xác nhận' : G.title; }, 900);
    try { if (window.Notification && Notification.permission === 'granted' && (document.hidden || !document.hasFocus())) { G.n = new Notification('Tải tờ khai – ' + txt, { body: 'Bấm vào đây để quay lại ' + TEN + ' và gõ mã.', tag: 'qtt-tk', requireInteraction: true }); G.n.onclick = function () { window.focus(); try { $('capin').focus(); } catch (e) { } G.n.close(); }; } } catch (e) { }
    LOG.ghi('[GOI] ' + txt);
  }
  function thoiGoi() { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title || document.title; } if (G.lap) { clearInterval(G.lap); G.lap = null; } if (G.n) { try { G.n.close(); } catch (e) { } G.n = null; } }
  window.addEventListener('focus', function () { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title; } });

  function progress(thang, n, i, m) {
    $('ptxt').textContent = (ETAX ? 'Trang ' : 'Lượt ') + thang + ': đang tải ' + Math.min(i + 1, m) + '/' + m + ' hồ sơ' + (ETAX && J.tong ? ' · tổng ' + Math.min((J.xl || 0) + 1, J.tong) + '/' + J.tong : '');
    $('pbar').style.width = (m ? i / m * 100 : 100) + '%';
    $('pok').textContent = J.ok; $('ptb').textContent = J.tbOk; $('perr').textContent = J.err;
    var ds = J.dur.slice().sort(function (a, b) { return a - b; }), per = ds.length ? ds[Math.floor(ds.length / 2)] / 1000 : (S.gap / 1000 + 0.4) * (J.tb ? 4 : 1), rem = Math.ceil((ETAX && J.tong ? J.tong - (J.xl || 0) : m - i) * per);
    var thoi = rem < 90 ? rem + ' giây' : Math.ceil(rem / 60) + ' phút';
    $('peta').textContent = i < m ? 'Còn khoảng ' + thoi : '';
    $('pnext').hidden = ETAX || !(J.conThang > 0 && i < m);
    $('pnext').textContent = 'Còn ' + J.conThang + ' lượt nữa. Lượt sau cần gõ mã sau khoảng ' + thoi + (($('obell').checked) ? ' – công cụ sẽ đổ chuông gọi anh/chị.' : '.');
  }

  // tải các hồ sơ của tháng vừa tra. pageOf: mã → số trang (để đọc lại trang nếu trang dịch vụ công báo "không hợp lệ")
  async function taiThang(nhan, rows, docLai) {
    var list = (J.last ? rows.filter(function (r) { return !RE_KHONG_HL.test(r.tt); }) : rows.slice()).sort(soSanh); // "chỉ lần cuối": hồ sơ hủy/không chấp nhận khỏi tải
    $('cap').hidden = true; scan(false); $('prog').hidden = false;
    for (var i = 0; i < list.length; i++) {
      var r = list[i], t0 = Date.now();
      progress(nhan, 0, i, list.length); $('pcur').textContent = r.tkCode + ' ' + (r.ky || '') + ' · ' + r.ma;
      var thu = 0;
      for (;;) {
        try {
          var kq = await taiMot(r);
          J.kq[r.ma] = { ok: true, pre: slugTK(r.tkCode) + '/' + tenGoc(r), files: kq.files.map(function (f) { return f[0].split('/').pop(); }), tb: kq.tb, tbLoi: kq.tbLoi, data: kq.files };
          J.ok++; J.tbOk += kq.tb; kq.tbLoi.forEach(function (m) { J.tbErrors.push([r.ma, r.tkCode + ' ' + (r.ky || ''), m]); });
          LOG.ghi('[TAI] OK ' + r.ma + ' -> ' + kq.files.length + ' file, ' + kq.tb + ' thong bao');
          break;
        } catch (e) {
          if (e.kind === 'session' || e.kind === 'stop') throw e;
          if (e.kind === 'nolink') { J.nl++; J.kq[r.ma] = { ok: false, noLink: true, loi: e.message }; J.errors.push([r.ma, r.tkCode + ' ' + (r.ky || '') + ': ' + e.message + ' (bấm tên tờ khai trên trang cũng không tải được)']); LOG.ghi('[TAI] ' + r.ma + ' khong co link tai'); break; }
          // trang dịch vụ công báo "không hợp lệ": đọc lại trang chứa hồ sơ (cùng điều kiện, không gửi mã) rồi thử lại 1 lần
          if (RE_KHL.test(e.message || '') && thu === 0) {
            thu++; LOG.ghi('[TAI] ' + r.ma + ' bao: ' + e.message + ' -> doc lai trang ket qua roi thu lai');
            try { await docLai(); } catch (e2) { if (e2.kind === 'session' || e2.kind === 'stop') throw e2; }
            continue;
          }
          J.err++; J.kq[r.ma] = { ok: false, loi: e.message || String(e) }; J.errors.push([r.ma, r.tkCode + ' ' + (r.ky || '') + ': ' + (e.message || e)]);
          LOG.loi('Tai ' + r.ma, e && e.message);
          break;
        }
      }
      J.dur.push(Date.now() - t0); if (J.dur.length > 40) J.dur.shift(); J.xl = (J.xl || 0) + 1;
    }
    progress(nhan, 0, list.length, list.length);
    $('prog').hidden = true;
  }

  async function search() {
    var k = kiemNgay(); if (k.loi) { say(k.loi, 'e'); return; }
    S.maTK = $('ltk').value; store('ltk', S.maTK);
    S.busy = true; S.stop = false; S.xacNhanDong = 0; say(''); $('res').hidden = true; $('form').hidden = true; $('resume').hidden = true;
    S.tu = k.tu; S.den = k.den; S.rows = []; S.mst = '';
    xinQuyenThongBao();
    J = { ok: 0, err: 0, nl: 0, xl: 0, tbOk: 0, names: {}, errors: [], tbErrors: [], kq: {}, dur: [], tb: $('otb').checked, last: $('olast').checked, boQua: [], canhBao: [], xongDen: null, dangThang: null };
    if (k.cat) J.canhBao.push('Phần trước 01/07/2025 không tra trên trang dịch vụ công – tải trên thuedientu.gdt.gov.vn');
    store('otb', J.tb ? '1' : '0'); store('olast', J.last ? '1' : '0');
    LOG.phanCach('Tra cứu & tải ' + k.tu + ' -> ' + k.den + (S.maTK ? ' | to khai ' + S.maTK : '') + (J.tb ? ' | kem thong bao' : '') + (J.last ? ' | chi lan cuoi' : ''));
    var map = {}, Q = k.doan.slice(), n = Q.length, ketThuc = 'xong', i = -1;
    function traTrang(dn, ma, page, size) {
      if (dn.k === 'tdt') return call(BASE + 'tchs/thuedientu', { method: 'POST', form: bodyTdt(dn.x, dn.y, ma, page, size), html: true, once: !!ma });
      return call(qs(dn.x, dn.y, ma, page ? '&page=' + page + '&size=' + size : ''), { html: true, once: !!ma });
    }
    try {
      while (Q.length) {
        var dn = Q.shift(); i++; n = i + 1 + Q.length;
        var x = dn.x, y = dn.y, loi = null, xong = false;
        J.dangThang = [x, y]; S.kDoan = dn.k;
        while (!xong) {
          scan(false);
          var ma = await hoiMa(i + 1, n, x, y, loi);
          if (ma === null) { J.boQua.push(x + ' → ' + y); break; }
          scan(true, 'Lượt ' + (i + 1) + '/' + n + ': đang tra ' + x + ' → ' + y, 30, 'Đã tải ' + J.ok + ' hồ sơ');
          var html;
          try { html = await traTrang(dn, ma); }
          catch (e1) {
            if (e1.kind === 'reject' || e1.kind === 'busy' || e1.kind === 'server' || e1.kind === 'network' || e1.kind === 'data') {
              LOG.ghi('[TRA] Lan tra bi cong tu choi: ' + e1.message);
              // thuế điện tử: trang dịch vụ công chê khoảng ngày (không phải lỗi mã) → chia đôi lượt này
              if (dn.k === 'tdt' && e1.kind === 'reject' && !/captcha|mã xác nhận|ma xac nhan/i.test(e1.message || '') && d2(y) - d2(x) > 40 * 86400000) {
                var mid = new Date((d2(x).getTime() + d2(y).getTime()) / 2), m1 = C.dateToDMY(mid), m2 = C.dateToDMY(new Date(mid.getFullYear(), mid.getMonth(), mid.getDate() + 1));
                Q.unshift({ k: 'tdt', x: x, y: m1 }, { k: 'tdt', x: m2, y: y }); i--; LOG.ghi('[TRA] Chia doi luot ' + x + ' -> ' + y);
                J.canhBao.push('' + TENH + ' báo "' + String(e1.message).slice(0, 80) + '" cho khoảng ' + x + ' → ' + y + ' – đã chia nhỏ'); xong = 'chia'; break;
              }
              loi = (e1.kind === 'reject' ? '' + TENH + ' báo: "' + String(e1.message || '').slice(0, 140) + '"' : '' + TENH + ' chưa phản hồi (' + e1.message + ')') + '. Anh/chị gõ mã mới để tra lại lượt này.';
              continue;
            }
            throw e1;
          }
          var kq = docKetQua(html, dn.k);
          if (!kq.ok) {
            LOG.ghi('[TRA] Cong khong tra bang ket qua: ' + kq.msg);
            loi = '' + TENH + ' chưa trả kết quả' + (kq.msg ? ': "' + kq.msg.slice(0, 140) + '"' : '') + '. Thường do gõ sai mã – anh/chị gõ lại mã mới.';
            continue;
          }
          LOG.ghi('[TRA] ' + (dn.k === 'tdt' ? 'TDT ' : '') + x + ' -> ' + y + ': tong ' + kq.total + ' ho so, trang 1 co ' + kq.rows.length);
          J.conThang = Q.length;
          var nhan = (i + 1) + '/' + n + ' (' + x + ' → ' + y + ')';
          var nhan0 = function (L) { var moi = L.filter(function (r) { return !map[r.ma]; }); moi.forEach(function (r) { map[r.ma] = r; r.__n = ngayNop(r.ngay); r.thang = x; S.rows.push(r); }); return moi; };
          // trang dịch vụ công chỉ cho tải hồ sơ thuộc TRANG kết quả vừa đọc → đọc trang nào tải trang đó
          if (kq.total <= kq.rows.length) {
            var m0 = nhan0(kq.rows);
            if (m0.length) await taiThang(nhan, m0, function () { return traTrang(dn, '', 1, SIZE); });
          } else {
            var sp = Math.ceil(kq.total / SIZE), doc = 0;
            for (var p = 1; p <= sp; p++) {
              scan(true, 'Lượt ' + (i + 1) + '/' + n + ': đọc trang ' + p + '/' + sp, 30 + 60 * p / sp, '');
              var pp = p, kp = docKetQua(await traTrang(dn, '', p, SIZE), dn.k);
              if (!kp.ok) { LOG.ghi('[TRA] Trang ' + p + ' khong doc duoc: ' + kp.msg); J.canhBao.push('Lượt ' + x + ' → ' + y + ': trang ' + p + ' chưa đọc được'); break; }
              doc += kp.rows.length;
              var mp = nhan0(kp.rows);
              if (mp.length) await taiThang(nhan + (sp > 1 ? ' · trang ' + p + '/' + sp : ''), mp, (function (q) { return function () { return traTrang(dn, '', q, SIZE); }; })(pp));
            }
            if (doc < kq.total) J.canhBao.push('Lượt ' + x + ' → ' + y + ': ' + TEN + ' báo ' + kq.total + ' hồ sơ, đọc được ' + doc);
          }
          J.xongDen = y;
          xong = true;
        }
      }
    } catch (e) {
      scan(false); $('cap').hidden = true; $('prog').hidden = true;
      if (e.kind === 'stop') ketThuc = 'dung';
      else if (e.kind === 'session') { ketThuc = 'phien'; hienPhien(false); }
      else { ketThuc = 'loi'; LOG.loi('Tra cuu & tai', e && e.message); J.loiChung = e.message || String(e); }
    }
    scan(false);
    // thuế điện tử: hồ sơ cùng tên tờ khai dùng chung ký hiệu mẫu nếu có ít nhất 1 dòng xác định được (để gom đúng nhiều lần nộp)
    var tenMa = {}; S.rows.forEach(function (r) { if (r.src === 'tdt' && /\//.test(r.tkCode) && r.tkCode.length < 25) tenMa[chuanTen(r.tk)] = r.tkCode; });
    S.rows.forEach(function (r) { if (r.src === 'tdt' && tenMa[chuanTen(r.tk)]) r.tkCode = tenMa[chuanTen(r.tk)]; });
    gomNhom(S.rows);
    var dem = {}; S.rows.forEach(function (r) { if (r.mstNop && (!r.mstNopThay || r.mstNopThay === 'null')) dem[r.mstNop] = (dem[r.mstNop] || 0) + 1; });
    S.mst = Object.keys(dem).sort(function (a, b) { return dem[b] - dem[a]; })[0] || '';
    await finish(ketThuc);
  }

  /* ---------- tra cứu & tải trên trang thuế điện tử: 1 lần tra cho cả khoảng ngày, đọc trang nào tải trang đó ---------- */
  async function searchEtax() {
    var k = kiemNgay(); if (k.loi) { say(k.loi, 'e'); return; }
    S.maTK = $('ltk').value; store('ltk', S.maTK);
    S.busy = true; S.stop = false; S.xacNhanDong = 0; say(''); $('res').hidden = true; $('form').hidden = true; $('resume').hidden = true;
    S.tu = k.tu; S.den = k.den; S.rows = []; S.mst = ''; S.mstX = '';
    J = { ok: 0, err: 0, nl: 0, xl: 0, tong: 0, tbOk: 0, names: {}, errors: [], tbErrors: [], kq: {}, dur: [], tb: $('otb').checked, last: $('olast').checked, boQua: [], canhBao: [], xongDen: null, dangThang: [k.tu, k.den] };
    store('otb', J.tb ? '1' : '0'); store('olast', J.last ? '1' : '0');
    LOG.phanCach('Tra cứu & tải (thuế điện tử) ' + k.tu + ' -> ' + k.den + (S.maTK ? ' | to khai ' + S.maTK : '') + (J.tb ? ' | kem thong bao' : '') + (J.last ? ' | chi lan cuoi' : ''));
    var map = {}, ketThuc = 'xong';
    function nhan0(L) { var moi = L.filter(function (r) { return !map[r.ma]; }); moi.forEach(function (r) { map[r.ma] = r; r.__n = ngayNop(r.ngay); r.thang = k.tu; S.rows.push(r); }); return moi; }
    try {
      scan(true, 'Đang tra ' + k.tu + ' → ' + k.den + ' trên trang thuế điện tử', 20, 'Không cần mã xác nhận');
      var kq = docKetQuaEtax(await traEtax(k.tu, k.den, 1));
      if (!kq.ok) { LOG.ghi('[TRA] Khong doc duoc ket qua: ' + kq.msg); throw new ApiError('reject', 200, 'Trang thuế điện tử chưa trả bảng kết quả' + (kq.msg ? ' ("' + kq.msg.slice(0, 120) + '")' : '')); }
      var sp = kq.total ? Math.max(1, kq.pages) : 0; J.tong = kq.total;
      LOG.ghi('[TRA] TDT ' + k.tu + ' -> ' + k.den + ': tong ' + kq.total + ' ho so, ' + sp + ' trang, trang 1 co ' + kq.rows.length);
      var doc = 0;
      for (var p = 1; p <= sp; p++) {
        var kp = kq;
        if (p > 1) { scan(true, 'Đọc trang ' + p + '/' + sp, 20 + 70 * p / sp, 'Đã tải ' + J.ok + ' hồ sơ'); kp = docKetQuaEtax(await traEtax(k.tu, k.den, p)); }
        if (!kp.ok || (!kp.rows.length && p <= sp)) { LOG.ghi('[TRA] Trang ' + p + ' khong doc duoc: ' + (kp.msg || 'khong co dong')); J.canhBao.push('Trang kết quả ' + p + '/' + sp + ' chưa đọc được'); continue; }
        doc += kp.rows.length;
        var moi = nhan0(kp.rows);
        if (moi.length) await taiThang(p + '/' + sp, moi, (function (q) { return function () { return traEtax(k.tu, k.den, q); }; })(p));
        scan(false);
      }
      if (doc < kq.total) J.canhBao.push('Trang thuế điện tử báo ' + kq.total + ' hồ sơ, đọc được ' + doc);
      J.xongDen = k.den;
    } catch (e) {
      scan(false); $('prog').hidden = true;
      if (e.kind === 'stop') ketThuc = 'dung';
      else if (e.kind === 'session') { ketThuc = 'phien'; hienPhien(false); }
      else { ketThuc = 'loi'; LOG.loi('Tra cuu & tai (TDT)', e && e.message); J.loiChung = e.message || String(e); }
    }
    scan(false);
    gomNhom(S.rows);
    S.mst = S.mstX || '';
    await finish(ketThuc);
  }

  /* ---------- bảng kết quả (để xem lại sau khi tải) ---------- */
  function visible() {
    var f = C.boDau(S.filter || '').toLowerCase().trim();
    var L = S.rows.filter(function (r) { return !f || C.boDau([r.tk, r.ky, r.ma, r.tt, r.loai, r.ngay].join(' ')).toLowerCase().indexOf(f) >= 0; });
    if (S.sort === 'ngay') L.sort(function (a, b) { return a.__n.k < b.__n.k ? 1 : a.__n.k > b.__n.k ? -1 : 0; });
    else L.sort(function (a, b) { var x = soSanh(a, b); if (x) return x; return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
    return L;
  }
  function trongZip(r) { var k = J && J.kq[r.ma]; if (!k || !k.ok) return false; return !J.last || (r.ky ? r.cuoi : r.hieuLuc); }
  function taiTxt(r) {
    var k = J && J.kq[r.ma];
    if (!k) return J && J.last && RE_KHONG_HL.test(r.tt) ? ['mut', 'Bỏ (hủy)'] : ['mut', 'Chưa tải'];
    if (!k.ok) return k.noLink ? ['mut', 'Trang không cho tải'] : ['bad', 'Lỗi'];
    if (!trongZip(r)) return ['mut', 'Bỏ (lần trước)'];
    return [k.tbLoi && k.tbLoi.length ? 'warn' : 'ok', 'Đã tải' + (k.tb ? ' + ' + k.tb + ' TB' : '') + (k.tbLoi && k.tbLoi.length ? ' (thiếu ' + k.tbLoi.length + ' TB)' : '')];
  }
  function render() {
    var L = visible(), html = [], prev = null;
    L.forEach(function (r) {
      var grp = S.sort === 'tk' && prev !== null && prev !== r.key; prev = r.key;
      var tag = r.nLan > 1 && r.ky ? ' <span class="pill ' + (r.cuoi ? 'ok' : 'mut') + '">' + (r.cuoi ? 'Lần hiệu lực cuối' : 'Lần ' + r.thuTu + '/' + r.nLan) + '</span>' : '';
      var ttCls = !r.hieuLuc ? 'bad' : RE_CHO.test(r.tt) ? 'warn' : 'ok', tt = taiTxt(r), k = J && J.kq[r.ma];
      html.push('<tr class="' + (grp ? 'grp ' : '') + (r.hieuLuc ? '' : 'off') + '" title="' + esc(r.tthc) + '">' +
        '<td><span class="tkc">' + esc(r.tkCode) + '</span>' + tag + '<span class="sub">' + esc(r.tk.split(' - ').slice(1).join(' - ').slice(0, 70)) + '</span></td>' +
        '<td class="nw">' + esc(r.ky || '–') + '</td>' +
        '<td class="nw">' + esc(r.loai) + (r.lan ? ' · lần ' + esc(r.lan) : '') + (r.lanBS && r.lanBS !== '0' ? '<span class="sub">bổ sung lần ' + esc(r.lanBS) + '</span>' : '') + '</td>' +
        '<td class="nw">' + esc(r.__n.dmy) + '<span class="sub">' + esc(r.__n.gio) + '</span></td>' +
        '<td><span class="pill ' + ttCls + '">' + esc(r.tt || '–') + '</span></td>' +
        '<td class="nw"><span class="pill ' + tt[0] + '"' + (k && !k.ok ? ' title="' + esc(k.loi) + '"' : '') + '>' + esc(tt[1]) + '</span></td>' +
        '<td class="m">' + esc(r.ma) + '</td></tr>');
    });
    $('tb').innerHTML = html.join('') || '<tr><td colspan="7" class="hint" style="text-align:center;padding:16px">Không có hồ sơ phù hợp.</td></tr>';
  }
  $('flt').oninput = function () { S.filter = $('flt').value; render(); };
  [].forEach.call(root.querySelectorAll('#srt button'), function (b) { b.onclick = function () { S.sort = b.getAttribute('data-v'); [].forEach.call(root.querySelectorAll('#srt button'), function (x) { x.setAttribute('aria-pressed', x === b); }); render(); }; });
  $('bfind').onclick = function () { if (!S.busy) (ETAX ? searchEtax : search)(); };
  $('bstop').onclick = function () { S.stop = true; LOG.ghi('[TAI] Nguoi dung bam Dung lai'); };
  function datMode(v) {
    $('otb').checked = v !== 'nhanh';
    [].forEach.call(root.querySelectorAll('#mode button'), function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-v') === v); });
    $('modeh').textContent = ETAX ? (v === 'nhanh' ? 'Chỉ tải tờ khai (XML), khoảng 1 giây/hồ sơ.' : 'Tờ khai + thông báo của cơ quan thuế (tiếp nhận, chấp nhận…), khoảng 3–4 giây/hồ sơ.')
      : v === 'nhanh' ? 'Chỉ tải tờ khai + file đính kèm, khoảng 1,5 giây/hồ sơ – thời gian chờ giữa 2 lần gõ mã ngắn nhất.' : 'Tờ khai + file đính kèm + thông báo của cơ quan thuế (tiếp nhận, chấp nhận…), khoảng 5 giây/hồ sơ.';
  }
  [].forEach.call(root.querySelectorAll('#mode button'), function (b) { b.onclick = function () { if (!S.busy) datMode(b.getAttribute('data-v')); }; });
  (function () { var a = store('otb'), b = store('olast'), c = store('obell'); datMode(a === '0' || (ETAX && a === null) ? 'nhanh' : 'day'); if (b !== null) $('olast').checked = b === '1'; if (c !== null) $('obell').checked = c === '1'; })();
  $('obell').onchange = function () { store('obell', $('obell').checked ? '1' : '0'); if ($('obell').checked) { xinQuyenThongBao(); chuong(); } };

  /* ---------- bảng kê Excel ---------- */
  function dongBangKe() {
    var ds = S.rows.slice().sort(soSanh);
    var s1 = {
      name: 'Danh sách hồ sơ',
      pre: [ETAX ? 'DANH SÁCH TỜ KHAI ĐÃ NỘP TRÊN TRANG THUẾ ĐIỆN TỬ (thuedientu.gdt.gov.vn)' : 'DANH SÁCH HỒ SƠ ĐÃ NỘP TRÊN CỔNG DỊCH VỤ CÔNG THUẾ', 'Ngày nộp từ ' + S.tu + ' đến ' + S.den + (S.mst ? ' · MST ' + S.mst : '') + ' · Lập lúc ' + C.dateToDMY(new Date()) + ' bằng công cụ Tải tờ khai hàng loạt (Quản trị tử tế)', ''],
      cols: [{ h: 'STT', t: 'i', w: 6 }, { h: 'Tờ khai', w: 16 }, { h: 'Kỳ tính thuế', w: 11 }, { h: 'Loại tờ khai', w: 12 }, { h: 'Lần nộp', t: 'i', w: 8 }, { h: 'Lần nộp bổ sung', w: 9 }, { h: 'Ngày nộp', t: 'd', w: 12 }, { h: 'Giờ nộp', w: 8 },
        { h: 'Trạng thái', w: 18 }, { h: 'Số lần nộp cùng kỳ', t: 'i', w: 9 }, { h: 'Lần hiệu lực cuối', w: 10 }, { h: 'Cảnh báo', w: 40 }, { h: 'Mã hồ sơ', w: 24 }, { h: 'Tên tờ khai đầy đủ', w: 40 }, { h: 'Thủ tục hành chính', w: 40 }, { h: 'Cơ quan thuế tiếp nhận', w: 30 },
        { h: 'Kết quả tải', w: 22 }, { h: 'Số thông báo', t: 'i', w: 9 }, { h: 'File trong ZIP', w: 50 }],
      rows: []
    };
    ds.forEach(function (r, i) {
      var k = J.kq[r.ma], kt = !k ? (J.last && RE_KHONG_HL.test(r.tt) ? 'Không tải (hồ sơ hủy / không chấp nhận)' : 'Chưa tải') : !k.ok ? 'Lỗi: ' + k.loi : trongZip(r) ? 'Đã tải' + (k.tbLoi && k.tbLoi.length ? ' (thiếu ' + k.tbLoi.length + ' thông báo – ' + TEN + ' báo lỗi)' : '') : 'Không đưa vào ZIP (không phải lần hiệu lực cuối)';
      s1.rows.push([i + 1, r.tkCode, r.ky, r.loai, r.lan, r.lanBS, r.__n.dmy, r.__n.gio, r.tt, r.ky ? r.nLan : '', r.ky && r.nLan > 1 ? (r.cuoi ? 'Có' : '') : '', r.canhBao, r.ma, r.tk, r.tthc, r.cqt, kt, k && k.ok ? k.tb : '', k && k.ok && trongZip(r) ? k.files.join('; ') : '']);
    });
    var g = {}; ds.forEach(function (r) { if (r.ky) (g[r.key] = g[r.key] || []).push(r); });
    var s2 = {
      name: 'Theo tờ khai & kỳ',
      pre: ['GOM THEO TỜ KHAI VÀ KỲ TÍNH THUẾ', 'Lần hiệu lực cuối = hồ sơ nộp sau cùng của cùng tờ khai + kỳ, không tính hồ sơ đã hủy / không được chấp nhận.', ''],
      cols: [{ h: 'Tờ khai', w: 16 }, { h: 'Kỳ tính thuế', w: 11 }, { h: 'Số lần nộp', t: 'i', w: 9 }, { h: 'Lần hiệu lực cuối – ngày nộp', t: 'd', w: 14 }, { h: 'Lần hiệu lực cuối – loại, lần', w: 18 }, { h: 'Lần hiệu lực cuối – trạng thái', w: 20 }, { h: 'Lần hiệu lực cuối – mã hồ sơ', w: 24 }, { h: 'Các lần nộp (theo thứ tự)', w: 70 }, { h: 'Cảnh báo', w: 36 }],
      rows: []
    };
    Object.keys(g).forEach(function (k) {
      var L = g[k], c = L.filter(function (r) { return r.cuoi; })[0];
      var cb = []; if (!c) cb.push('Chưa có lần nộp hợp lệ'); else if (RE_CHO.test(c.tt)) cb.push('Lần cuối chưa có kết quả xử lý');
      if (L.some(function (r) { return !r.hieuLuc; })) cb.push('Có hồ sơ hủy / không chấp nhận');
      s2.rows.push([L[0].tkCode, L[0].ky, L.length, c ? c.__n.dmy : '', c ? c.loai + ' · lần ' + c.lan + (c.lanBS && c.lanBS !== '0' ? ' (bổ sung ' + c.lanBS + ')' : '') : '', c ? c.tt : '', c ? c.ma : '',
        L.map(function (r, i) { return (i + 1) + ') ' + r.__n.dmy + ' ' + r.loai + ' lần ' + r.lan + ' – ' + r.tt; }).join('\n'), cb.join('; ')]);
    });
    return [s1, s2];
  }

  /* ---------- đóng gói ZIP ---------- */
  function cong(dmy, n) { var d = C.dmyToDate(dmy); return C.dateToDMY(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  async function finish(ketThuc) {
    thoiGoi(); $('prog').hidden = true; $('cap').hidden = true;
    var conTu = ketThuc === 'xong' ? null : (J.dangThang ? J.dangThang[0] : null);
    if (conTu) { store('resume', JSON.stringify({ t: Date.now(), tu: conTu, den: S.den, maTK: S.maTK })); LOG.ghi('[TIEP TUC] Con lai tu ' + conTu + ' den ' + S.den); }
    else store('resume', null);
    if (!S.rows.length && !J.ok) {
      S.busy = false; $('form').hidden = false; $('bfind').disabled = !S.logged;
      if (ketThuc === 'phien') say('' + TENH + ' đã hết phiên đăng nhập. Anh/chị đăng nhập lại rồi bấm nút "Tải tờ khai" để tra lại.', 'e');
      else if (ketThuc === 'dung') say('Đã dừng.', 'i');
      else if (ketThuc === 'loi') say('Tra cứu bị gián đoạn: ' + J.loiChung + '. Anh/chị thử lại sau ít phút.', 'e');
      else say('Không có hồ sơ nào nộp trong khoảng ngày này' + (S.maTK ? ' với loại tờ khai đã chọn' : '') + (J.boQua.length ? ' (đã bỏ qua ' + J.boQua.length + ' tháng)' : '') + '.', 'i');
      return;
    }
    say('Đang đóng gói file ZIP…', 'i');
    var nBo = 0;
    try {
      var z = new C.ZipWriter(), nm = (S.mst ? S.mst + '_' : '') + S.tu.replace(/\//g, '') + '-' + (ketThuc === 'xong' || ETAX ? S.den : (J.xongDen || S.tu)).replace(/\//g, '');
      // tên tờ khai được xác định lại sau khi gom (thuế điện tử) → đổi thư mục / tên file cho thống nhất
      S.rows.forEach(function (r) { var k = J.kq[r.ma]; if (!k || !k.ok || !k.pre) return; var moi = slugTK(r.tkCode) + '/' + tenGoc(r); if (moi === k.pre) return; k.data.forEach(function (f) { if (f[0].indexOf(k.pre) === 0) f[0] = moi + f[0].slice(k.pre.length); }); k.files = k.data.map(function (f) { return f[0].split('/').pop(); }); k.pre = moi; });
      S.rows.forEach(function (r) { var k = J.kq[r.ma]; if (k && k.ok) { if (trongZip(r)) k.data.forEach(function (f) { z.add(uniqueName(f[0]), f[1]); }); else nBo++; } });
      try { z.add('Bang-ke-to-khai.xlsx', await (await C.xlsxBlob(dongBangKe())).arrayBuffer(), { store: true }); }
      catch (e) { LOG.loi('Lap bang ke Excel', e && e.message); }
      var ghi = [];
      if (J.errors.length) ghi.push('HỒ SƠ (TỜ KHAI) CHƯA TẢI ĐƯỢC (' + J.errors.length + '):\r\n' + J.errors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.tbErrors.length) ghi.push('THÔNG BÁO CỦA CƠ QUAN THUẾ CHƯA TẢI ĐƯỢC (' + J.tbErrors.length + ') – tờ khai của các hồ sơ này ĐÃ tải đủ, chỉ thiếu thông báo; ' + TEN + ' báo lỗi cả khi gọi lại. Anh/chị có thể mở hồ sơ trên ' + TEN + ' để tải tay thông báo này:\r\n' + J.tbErrors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.boQua.length) ghi.push('Các tháng đã bỏ qua (chưa tra): ' + J.boQua.join(', '));
      if (conTu) ghi.push('Chưa tra / chưa tải xong: từ ' + conTu + ' đến ' + S.den + ' – bấm nút "Tải tờ khai" → "Điền sẵn khoảng ngày còn lại".');
      if (J.canhBao.length) ghi.push('Lưu ý khi đọc danh sách:\r\n' + J.canhBao.join('\r\n'));
      if (ghi.length) z.add('HS-chua-tai-duoc.txt', '﻿' + ghi.join('\r\n\r\n') + '\r\n');
      z.add('danh-sach.json', JSON.stringify({ congCu: 'tai-to-khai', ver: VER, nguon: ETAX ? HOST_ETAX : HOST_DVC, mst: S.mst, tu: S.tu, den: S.den, rows: S.rows.map(function (r) { var k = J.kq[r.ma]; return { ma: r.ma, tk: r.tk, ky: r.ky, loai: r.loai, lan: r.lan, lanBS: r.lanBS, ngay: r.ngay, tt: r.tt, cuoi: r.cuoi, nLan: r.nLan, tai: k ? { ok: k.ok, loi: k.loi, files: k.files, tb: k.tb } : null }; }) }, null, 1));
      LOG.ghi('[XONG] ' + ketThuc + ' | ' + J.ok + ' ho so OK, ' + J.tbOk + ' thong bao, ' + J.err + ' loi, ' + nBo + ' bo khoi ZIP (lan truoc)');
      z.add('nhat-ky.txt', LOG.text());
      C.saveBlob(await z.blob(), 'ToKhai_' + (ETAX ? 'ETAX_' : 'DVC_') + nm + (conTu ? '_chua-xong' : '') + '.zip');
      var dau = ketThuc === 'xong' ? 'Xong: ' : ketThuc === 'phien' ? '' + TENH + ' hết phiên đăng nhập – đã lưu phần đã tải: ' : ketThuc === 'dung' ? 'Đã dừng – đã lưu phần đã tải: ' : 'Bị gián đoạn (' + J.loiChung + ') – đã lưu phần đã tải: ';
      say(dau + J.ok + ' hồ sơ' + (J.tbOk ? ', ' + J.tbOk + ' thông báo' : '') + (nBo ? ' (' + nBo + ' lần nộp trước không đưa vào ZIP, vẫn có trong Excel)' : '') + (J.err ? ', ' + J.err + ' hồ sơ lỗi' : '') + (J.nl ? ', ' + J.nl + ' hồ sơ trang không cho tải' : '') + (J.tbErrors.length ? ', ' + J.tbErrors.length + ' thông báo ' + TEN + ' không cho tải (tờ khai vẫn đủ)' : '') + (J.err || J.nl || J.tbErrors.length ? ' – xem HS-chua-tai-duoc.txt' : '') + '. File ZIP đã lưu vào thư mục Tải về của trình duyệt.' + (conTu ? ' Còn từ ' + conTu + ' đến ' + S.den + ': ' + (ketThuc === 'phien' ? 'đăng nhập lại, ' : '') + 'bấm nút "Tải tờ khai" để tải tiếp.' : ''), ketThuc === 'xong' && !J.err ? 'o' : ketThuc === 'xong' ? 'w' : 'e');
    } catch (e) { LOG.loi('Dong goi ZIP', e && e.message); say('Không đóng gói được file ZIP: ' + (e.message || e), 'e'); }
    var nNhieu = 0, seen = {}; S.rows.forEach(function (r) { if (r.nLan > 1 && r.ky && !seen[r.key]) { seen[r.key] = 1; nNhieu++; } });
    var nHuy = S.rows.filter(function (r) { return !r.hieuLuc; }).length;
    $('sum').innerHTML = '<span>Tìm thấy</span><span class="pill info">' + S.rows.length + ' hồ sơ</span><span class="pill ok">Đã tải ' + J.ok + '</span>' + (J.err ? '<span class="pill bad">Lỗi ' + J.err + '</span>' : '') + (J.nl ? '<span class="pill mut">Trang không cho tải ' + J.nl + '</span>' : '') + (nNhieu ? '<span class="pill warn">' + nNhieu + ' kỳ nộp nhiều lần</span>' : '') + (nHuy ? '<span class="pill bad">' + nHuy + ' hủy / không chấp nhận</span>' : '');
    var w = []; if (J.boQua.length) w.push('Đã bỏ qua ' + J.boQua.length + ' tháng: ' + J.boQua.join(', ') + '.'); J.canhBao.forEach(function (c) { w.push(c + '.'); });
    $('reswarn').hidden = !w.length; $('reswarn').textContent = w.join(' ');
    S.busy = false; $('form').hidden = false; $('bfind').disabled = !S.logged; $('res').hidden = !S.rows.length; render();
    if (conTu) kiemTiepTuc();
  }

  /* ---------- tải tiếp khoảng ngày còn lại (sau khi hết phiên / dừng) ---------- */
  function kiemTiepTuc() {
    var raw = store('resume'); if (!raw) return;
    var R; try { R = JSON.parse(raw); } catch (e) { store('resume', null); return; }
    if (!R || !R.tu || Date.now() - R.t > 3 * 86400000) { store('resume', null); return; }
    var d = new Date(R.t);
    $('resumet').textContent = 'Lần trước dừng lúc ' + C.pad(d.getHours()) + ':' + C.pad(d.getMinutes()) + ' ' + C.dateToDMY(d) + ', còn khoảng ngày nộp ' + R.tu + ' → ' + R.den + ' chưa tải xong.';
    $('resume').hidden = false;
    $('bresumex').onclick = function () { store('resume', null); $('resume').hidden = true; };
    $('bresume').onclick = function () { setDate('dtu', R.tu); setDate('dden', R.den); if (R.maTK) $('ltk').value = R.maTK; $('resume').hidden = true; say('Đã điền khoảng ngày còn lại. Bấm "Tra cứu & tải" để tiếp tục.', 'i'); };
  }

  batDau();
})();

})();