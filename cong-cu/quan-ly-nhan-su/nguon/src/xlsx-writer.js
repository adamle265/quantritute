/* Ghi file .xlsx gọn (nhiều sheet, dòng tiêu đề đậm có nền, cố định dòng tiêu đề, bộ lọc, số có dấu chấm ngăn cách).
   sheets: [{ name, title?, note?, cols: [{ t, w?, num? }], rows: [[...]] }] → Uint8Array */
var XW = (function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function safeName(n, used) { var s = String(n || 'Sheet').replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 31) || 'Sheet', b = s, i = 2; while (used[s.toLowerCase()]) { s = b.slice(0, 28) + ' ' + i++; } used[s.toLowerCase()] = 1; return s; }
  // 10/11 anh: tiêu đề dài xuống dòng cân đối ("Trợ cấp\nchức vụ", "Xăng xe,\nđi lại") thay vì để Excel ngắt lẻ 1 chữ
  // 10/11 anh: giữ từ ghép tiếng Việt trên cùng 1 dòng khi tiêu đề xuống dòng ("Xăng xe, / đi lại", "Người / phụ thuộc") – nối bằng khoảng trắng không ngắt
  var HD_WORDS = ['trợ cấp', 'phụ cấp', 'chức vụ', 'chức danh', 'xăng xe', 'đi lại', 'điện thoại', 'trang phục', 'chuyên cần', 'ăn ca', 'nhà ở', 'thâm niên', 'trách nhiệm', 'độc hại', 'nguy hiểm', 'khu vực', 'thu hút', 'phụ thuộc', 'cam kết', 'thu nhập', 'giảm trừ', 'bản thân', 'đoàn viên', 'công đoàn', 'đoàn phí', 'kinh phí', 'đơn giá', 'tăng ca', 'thiệt hại', 'bồi thường', 'tạm ứng', 'khấu trừ', 'lao động', 'bộ phận', 'hiệu suất', 'mục tiêu', 'thực nhận', 'thực lĩnh', 'chi phí', 'công ty', 'hợp đồng', 'bảo hiểm', 'ngày công', 'công chuẩn', 'đi làm', 'nghỉ phép', 'có lương', 'không lương', 'hưởng lương', 'tỷ lệ', 'ngày thường', 'thời gian', 'đi muộn', 'về sớm', 'ghi chú', 'lưu ý', 'tổng cộng', 'dự kiến', 'đủ công', 'chịu thuế', 'tính thuế', 'giờ làm', 'số người', 'nhân viên', 'nhân sự', 'phòng ban', 'quy đổi', 'thưởng khác', 'trả thêm', 'tiền lương', 'mức lương', 'thỏa thuận', 'quyết định', 'hiệu lực', 'bắt đầu', 'kết thúc', 'nghỉ việc', 'ký nhận', 'tài khoản', 'ngân hàng'];
  var HD_RE = new RegExp('(^|[^0-9A-Za-zÀ-ỹ])(' + HD_WORDS.map(function (w) { return w.replace(' ', ') (').replace(/^/, '').replace(/$/, ''); }).map(function (w) { return '(?:' + w.replace(/[()]/g, '') .replace(' ', ' ') + ')'; }).join('|') + ')(?=$|[^0-9A-Za-zÀ-ỹ])', 'gi');
  function hdJoin(t) { return String(t == null ? '' : t).split(/(<[^>]*>)/).map(function (seg) { return seg.charAt(0) === '<' ? seg : seg.replace(HD_RE, function (m, a, w) { return a + w.replace(/ /g, '\u00a0'); }); }).join(''); }
  function hdBal(t, w) {
    t = hdJoin(t); if (!w || t.indexOf('\n') >= 0 || t.length <= w - 1) return t;
    var ws = t.split(' '), N = ws.length, best = null;
    function part(n) { // chia N từ thành n dòng, cực tiểu dòng dài nhất (rồi tổng bình phương)
      var memo = {};
      function go(i, k) { var key = i + ',' + k; if (memo[key]) return memo[key]; var r = null;
        if (k === 1) { var L = ws.slice(i).join(' ').length; r = { m: L, q: L * L, cut: [] }; }
        else for (var j = i + 1; j <= N - k + 1; j++) { var L2 = ws.slice(i, j).join(' ').length, sub = go(j, k - 1), m = Math.max(L2, sub.m), q = L2 * L2 + sub.q; if (!r || m < r.m || (m === r.m && q < r.q)) r = { m: m, q: q, cut: [j].concat(sub.cut) }; }
        return (memo[key] = r); }
      return go(0, n);
    }
    for (var n = 2; n <= Math.min(4, N); n++) { var p = part(n); if (!best || p.m < best.m) best = { m: p.m, cut: p.cut }; if (p.m <= w - 1) break; }
    if (!best) return t; var out = [], st = 0; best.cut.concat([N]).forEach(function (c) { out.push(ws.slice(st, c).join(' ')); st = c; }); return out.join('\n');
  }
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
    var merges = [];
    if (sh.groups && sh.groups.length) { // 09/11 21:30: dòng nhóm cột có ô gộp phía trên (như bảng lương mẫu); cột không thuộc nhóm gộp dọc 2 dòng
      var g0 = r + 1, gAt = {}; sh.groups.forEach(function (g) { for (var i = g.from; i <= g.to; i++) gAt[i] = g; if (g.to > g.from) merges.push(col(g.from) + g0 + ':' + col(g.to) + g0); });
      rows.push('<row r="' + g0 + '">' + cols.map(function (c, i) { var g = gAt[i]; if (!g) { merges.push(col(i) + g0 + ':' + col(i) + (g0 + 1)); return cell(col(i) + g0, hdBal(c.t, c.w), c.hl ? 7 : 2); } return cell(col(i) + g0, i === g.from ? g.t : '', 2); }).join('') + '</row>');
      r = g0;
    }
    top = r + 1;
    rows.push('<row r="' + top + '">' + cols.map(function (c, i) { return cell(col(i) + top, hdBal(c.t, c.w), c.hl ? 7 : 2); }).join('') + '</row>');
    r = top;
    sh.rows.forEach(function (row, ri) { r++; var bold = sh.bold && sh.bold.indexOf(ri) >= 0; rows.push('<row r="' + r + '">' + row.map(function (v, i) { var num = typeof v === 'number', hl = cols[i] && cols[i].hl; return cell(col(i) + r, v, hl ? (num ? 8 : 9) : bold ? (num ? 10 : 11) : 0); }).join('') + '</row>'); }); // 0.4.1: cột tô màu (hl), dòng đậm (sh.bold)
    var last = col(Math.max(0, cols.length - 1)) + Math.max(top, r);
    var widths = '<cols>' + cols.map(function (c, i) { var w = c.w || Math.min(48, Math.max(8, String(c.t).length + 2, sh.rows.slice(0, 200).reduce(function (m, row) { var v = row[i]; return Math.max(m, v === null || v === undefined ? 0 : String(typeof v === 'number' ? v.toLocaleString('vi-VN') : v).length + 1); }, 0))); return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + top + '" topLeftCell="A' + (top + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      widths + '<sheetData>' + rows.join('') + '</sheetData>' + (sh.rows.length ? '<autoFilter ref="A' + top + ':' + last + '"/>' : '') + (merges.length ? '<mergeCells count="' + merges.length + '">' + merges.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('') + '</mergeCells>' : '') + '</worksheet>';
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
        '<definedNames>' + names.map(function (n, i) { var sh = sheets[i]; if (!sh.rows.length) return ''; var top = ((sh.title || sh.note) ? (sh.title ? 1 : 0) + (sh.note ? 1 : 0) + 2 : 1) + (sh.groups && sh.groups.length ? 1 : 0); return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + esc(n.replace(/'/g, "''")) + '\'!$A$' + top + ':$' + col(sh.cols.length - 1) + '$' + (top + sh.rows.length) + '</definedName>'; }).join('') + '</definedNames></workbook>'),
      'xl/_rels/workbook.xml.rels': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        names.map(function (n, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (names.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'),
      'xl/styles.xml': enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##"/></numFmts>' +
        '<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF6B6259"/><name val="Calibri"/></font></fonts>' +
        '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3F1E8"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8CBAD"/></patternFill></fill></fills>' +
        '<borders count="2"><border/><border><bottom style="thin"><color rgb="FF2F7D4F"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="12"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center" horizontal="center"/></xf>' +
        '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/>' +
        '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1"/>' +
        '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center" horizontal="center"/></xf><xf numFmtId="3" fontId="1" fillId="3" borderId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="1" fillId="0" borderId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>')
    };
    sheets.forEach(function (s, i) { files['xl/worksheets/sheet' + (i + 1) + '.xml'] = enc(sheetXml(s)); });
    return fflate.zipSync(files, { level: 6 });
  }
  return { build: build, join: hdJoin };
})();
if (typeof module !== 'undefined') module.exports = XW;
