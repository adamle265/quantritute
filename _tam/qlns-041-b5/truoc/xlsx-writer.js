/* Ghi file .xlsx gọn (nhiều sheet, dòng tiêu đề đậm có nền, cố định dòng tiêu đề, bộ lọc, số có dấu chấm ngăn cách).
   sheets: [{ name, title?, note?, cols: [{ t, w?, num? }], rows: [[...]] }] → Uint8Array */
var XW = (function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function safeName(n, used) { var s = String(n || 'Sheet').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Sheet', b = s, i = 2; while (used[s.toLowerCase()]) { s = b.slice(0, 28) + ' ' + i++; } used[s.toLowerCase()] = 1; return s; }
  function sheetXml(sh) {
    var rows = [], r = 0, cols = sh.cols, top = 0;
    function cell(ref, v, style) {
      if (v === null || v === undefined || v === '') return style ? '<c r="' + ref + '" s="' + style + '"/>' : '';
      if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + (style || (Number.isInteger(v) ? 3 : 4)) + '"><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
    }
    if (sh.title) { rows.push('<row r="' + (++r) + '">' + cell('A' + r, sh.title, 5) + '</row>'); }
    if (sh.note) { rows.push('<row r="' + (++r) + '">' + cell('A' + r, sh.note, 6) + '</row>'); }
    if (sh.title || sh.note) r++;
    top = r + 1;
    rows.push('<row r="' + top + '">' + cols.map(function (c, i) { return cell(col(i) + top, c.t, c.hl ? 7 : 2); }).join('') + '</row>');
    r = top;
    sh.rows.forEach(function (row, ri) { r++; var bold = sh.bold && sh.bold.indexOf(ri) >= 0; rows.push('<row r="' + r + '">' + row.map(function (v, i) { var num = typeof v === 'number', hl = cols[i] && cols[i].hl; return cell(col(i) + r, v, hl ? (num ? 8 : 9) : bold ? (num ? 10 : 11) : 0); }).join('') + '</row>'); }); // 0.4.1: cột tô màu (hl), dòng đậm (sh.bold)
    var last = col(Math.max(0, cols.length - 1)) + Math.max(top, r);
    var widths = '<cols>' + cols.map(function (c, i) { var w = c.w || Math.min(48, Math.max(8, String(c.t).length + 2, sh.rows.slice(0, 200).reduce(function (m, row) { var v = row[i]; return Math.max(m, v === null || v === undefined ? 0 : String(typeof v === 'number' ? v.toLocaleString('vi-VN') : v).length + 1); }, 0))); return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + top + '" topLeftCell="A' + (top + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      widths + '<sheetData>' + rows.join('') + '</sheetData>' + (sh.rows.length ? '<autoFilter ref="A' + top + ':' + last + '"/>' : '') + '</worksheet>';
  }
  function build(sheets) {
    var used = {}, names = sheets.map(function (s) { return safeName(s.name, used); });
    var enc = function (s) { return fflate.strToU8(s); };
    var files = {
      '[Content_Types].xml': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        names.map(function (n, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>'),
      '_rels/.rels': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      'xl/workbook.xml': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        names.map(function (n, i) { return '<sheet name="' + esc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
        '<definedNames>' + names.map(function (n, i) { var sh = sheets[i]; if (!sh.rows.length) return ''; var top = (sh.title || sh.note) ? (sh.title ? 1 : 0) + (sh.note ? 1 : 0) + 2 : 1; return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + esc(n.replace(/'/g, "''")) + '\'!$A$' + top + ':$' + col(sh.cols.length - 1) + '$' + (top + sh.rows.length) + '</definedName>'; }).join('') + '</definedNames></workbook>'),
      'xl/_rels/workbook.xml.rels': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        names.map(function (n, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (names.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
      'xl/styles.xml': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##"/></numFmts>' +
        '<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF6B6259"/><name val="Calibri"/></font></fonts>' +
        '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F1E8"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8CBAD"/></patternFill></fill></fills>' +
        '<borders count="2"><border/><border><bottom style="thin"><color rgb="FF2F7D4F"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="12"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>' +
        '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1"/>' +
        '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="3" fontId="1" fillId="3" borderId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="1" fillId="0" borderId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
    };
    sheets.forEach(function (s, i) { files['xl/worksheets/sheet' + (i + 1) + '.xml'] = enc(sheetXml(s)); });
    return fflate.zipSync(files, { level: 6 });
  }
  return { build: build };
})();
if (typeof module !== 'undefined') module.exports = XW;
