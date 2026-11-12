/* ===========================================================================
   PHẦN MỀM QUẢN LÝ NHÂN SỰ – LÕI DỮ LIỆU (chạy được cả trong trình duyệt và Node)
   Quản trị tử tế · đọc file Excel ngay trên máy người dùng, không gửi đi đâu.
   - Nhận diện bảng theo TÊN CỘT (không theo tên file), tự tìm dòng tiêu đề,
     bỏ dòng TỔNG CỘNG / chữ ký / dòng không có mã.
   - Gộp nhiều file thành dữ liệu 1 đơn vị; báo cáo từng file/sheet.
   - Tính số liệu Bảng điều hành theo NGÀY THAM CHIẾU.
   =========================================================================== */
var HR = (function () {
  'use strict';

  /* ---------------- Danh mục loại bảng ---------------- */
  // khóa ngắn → tên hiển thị, cột bắt buộc để nhận diện, cột cần dùng, cột khóa
  var TYPES = [
    { k: 'BL', name: 'Bảng lương', need: ['Mã NV', 'Tổng thu nhập', 'Thực lĩnh'], monthly: true,
      cols: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Lương cơ bản', 'Phụ cấp chức vụ', 'Công chuẩn', 'Ngày công thực tế',
        'Nghỉ phép/việc riêng có lương', 'Nghỉ lễ', 'Nghỉ ốm (BHXH trả)', 'Nghỉ không lương/không phép', 'Nghỉ thai sản', 'Lương thời gian',
        'Giờ tăng ca ngày thường', 'Giờ tăng ca Chủ nhật', 'Tiền tăng ca', 'Giờ làm đêm', 'Phụ cấp làm đêm', 'Tiền ăn ca', 'Phụ cấp xăng xe',
        'Phụ cấp điện thoại', 'Phụ cấp chuyên cần', 'Tổng thu nhập', 'Lương đóng BH', 'BHXH (8%)', 'BHYT (1,5%)', 'BHTN (1%)',
        'Đoàn phí công đoàn (1%)', 'Thu nhập chịu thuế', 'Số người phụ thuộc', 'Giảm trừ gia cảnh', 'Thu nhập tính thuế', 'Thuế TNCN',
        'Tạm ứng', 'Thực lĩnh', 'Số tài khoản', 'Ngân hàng', 'Ghi chú'] },
    { k: 'CC', name: 'Chấm công', need: ['Mã NV', 'Ngày', 'Ký hiệu'], monthly: true,
      cols: ['STT', 'Ngày', 'Thứ', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Tổ', 'Ca', 'Giờ vào', 'Giờ ra', 'Số giờ công', 'Đi muộn (phút)',
        'Giờ tăng ca', 'Loại tăng ca', 'Ký hiệu', 'Ghi chú'] },
    { k: 'HD', name: 'Sổ hợp đồng', need: ['Mã NV', 'Số hợp đồng', 'Loại hợp đồng'],
      cols: ['STT', 'Số hợp đồng', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Loại hợp đồng', 'Ngày ký', 'Ngày hiệu lực',
        'Ngày hết hạn', 'Mức lương theo HĐ', 'Phụ cấp chức vụ', 'Lương hiệu suất mục tiêu', 'Tình trạng', 'Ngày chấm dứt', 'Lý do chấm dứt'] },
    { k: 'LS', name: 'Lịch sử lương', need: ['Mã NV', 'Ngày hiệu lực', 'Lương mới'],
      cols: ['STT', 'Số quyết định', 'Ngày quyết định', 'Ngày hiệu lực', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Lương cũ',
        'Lương mới', 'Mức tăng', 'Tỷ lệ tăng (%)', 'Phụ cấp chức vụ', 'Lương hiệu suất mục tiêu', 'Lý do'] },
    { k: 'DON', name: 'Đơn nghỉ phép', need: ['Mã NV', 'Số đơn', 'Loại nghỉ'],
      cols: ['STT', 'Số đơn', 'Ngày tạo đơn', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Loại nghỉ', 'Từ ngày', 'Đến ngày', 'Số ngày', 'Lý do',
        'Người duyệt', 'Trạng thái', 'Ngày duyệt'] },
    { k: 'QP', name: 'Quỹ phép năm', need: ['Mã NV', 'Phép cơ bản', 'Còn lại'],
      cols: ['Mã NV', 'Họ và tên', 'Phòng ban', 'Ngày vào làm', 'Thâm niên (năm)', 'Phép cơ bản', 'Phép thâm niên', 'Tổng phép năm*',
        'Đã nghỉ', 'Còn lại', 'Ghi chú'] },
    { k: 'NV', name: 'Hồ sơ nhân viên', need: ['Mã NV', 'Họ và tên', 'Ngày vào làm', 'Trạng thái'],
      cols: ['Mã NV', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Số CCCD/Mã số thuế', 'Ngày cấp CCCD', 'Dân tộc', 'Quê quán',
        'Địa chỉ thường trú', 'Số điện thoại', 'Email công ty', 'Phòng ban', 'Chức vụ', 'Chức danh công việc', 'Tổ/Ca', 'Ngày vào làm',
        'Trình độ', 'Tình trạng hôn nhân', 'Số người phụ thuộc', 'Số con từ 6 tuổi trở xuống', 'Người thân liên hệ', 'Quan hệ với người thân', 'SĐT người thân liên hệ',
        'Số sổ BHXH', 'Ngân hàng', 'Số tài khoản', 'Trạng thái', 'Ngày nghỉ việc', 'Lý do nghỉ việc', 'Mã chấm công', 'Loại lao động'],
      opt: ['Số con từ 6 tuổi trở xuống', 'Người thân liên hệ', 'Quan hệ với người thân', 'SĐT người thân liên hệ', 'Lý do nghỉ việc', 'Mã chấm công', 'Loại lao động'] }, // 09/11 0.3.2: Loại lao động = Toàn thời gian (trống) / Bán thời gian / Cộng tác viên
    { k: 'PB', name: 'Danh mục phòng ban', need: ['Mã phòng ban', 'Tên phòng ban'], key: 'Mã phòng ban',
      cols: ['Mã phòng ban', 'Tên phòng ban', 'Mã NV trưởng bộ phận', 'Trưởng bộ phận', 'Định biên', 'Nhân sự hiện có', 'Lịch làm việc'] },
    { k: 'CV', name: 'Danh mục chức vụ', need: ['Mã chức vụ', 'Tên chức vụ'], key: 'Mã chức vụ',
      cols: ['Mã chức vụ', 'Tên chức vụ', 'Cấp bậc', 'Phụ cấp chức vụ (đồng/tháng)'] },
    { k: 'CA', name: 'Ca làm việc', need: ['Mã ca', 'Tên ca'], key: 'Mã ca',
      cols: ['Mã ca', 'Tên ca', 'Giờ bắt đầu', 'Giờ kết thúc', 'Nghỉ giữa ca', 'Áp dụng'] },
    { k: 'KH', name: 'Ký hiệu chấm công', need: ['Ký hiệu', 'Ý nghĩa'], key: 'Ký hiệu',
      cols: ['Ký hiệu', 'Ý nghĩa', 'Công ty trả lương'] },
    // 07/11/2026 – module Nhân sự: hồ sơ giấy tờ (mỗi người 1 dòng, mỗi loại giấy tờ 1 cột: ngày nộp dd/mm/yyyy · "Không áp dụng" · trống = còn thiếu)
    { k: 'GT', name: 'Hồ sơ giấy tờ', need: ['Mã NV', 'Sơ yếu lý lịch'],
      cols: ['Mã NV', 'Họ và tên', 'Sơ yếu lý lịch', 'CV', 'Bản sao CCCD', 'Bằng cấp, chứng chỉ', 'Giấy khám sức khỏe', 'Ảnh 3x4', 'Đơn xin việc', 'Xác nhận thông tin cư trú', 'Cam kết bảo mật, nội quy', 'Ghi chú hồ sơ'],
      opt: ['CV', 'Bản sao CCCD', 'Bằng cấp, chứng chỉ', 'Giấy khám sức khỏe', 'Ảnh 3x4', 'Đơn xin việc', 'Xác nhận thông tin cư trú', 'Cam kết bảo mật, nội quy', 'Ghi chú hồ sơ'] },
    // quá trình học tập, công tác trước khi vào công ty, khen thưởng, kỷ luật (mỗi dòng 1 mục, khóa Mã dòng)
    { k: 'QT', name: 'Quá trình học tập, công tác', need: ['Mã dòng', 'Mã NV', 'Loại quá trình'], key: 'Mã dòng',
      cols: ['Mã dòng', 'Mã NV', 'Họ và tên', 'Loại quá trình', 'Từ tháng', 'Đến tháng', 'Nội dung', 'Nơi', 'Ghi chú'] }
  ];
  var TYPE = {}; TYPES.forEach(function (t) { TYPE[t.k] = t; });

  // Tên cột viết khác → tên chuẩn (Giai đoạn 2 sẽ cho người dùng tự thêm trong Cài đặt)
  var ALIAS = {
    'mã nhân viên': 'Mã NV', 'ma nv': 'Mã NV', 'ma nhan vien': 'Mã NV', 'mnv': 'Mã NV', 'mã nv': 'Mã NV',
    'họ tên': 'Họ và tên', 'ho ten': 'Họ và tên', 'ho va ten': 'Họ và tên', 'họ và tên': 'Họ và tên'
  };
  var TEXT_COLS = { 'Số CCCD/Mã số thuế': 1, 'Số tài khoản': 1, 'Số sổ BHXH': 1, 'Số điện thoại': 1, 'Mã NV': 1, 'Số hợp đồng': 1,
    'Số quyết định': 1, 'Số đơn': 1, 'Mã phòng ban': 1, 'Mã chức vụ': 1, 'Mã ca': 1, 'Ký hiệu': 1, 'Mã NV trưởng bộ phận': 1,
    'Tổ': 1, 'Tổ/Ca': 1, 'Ca': 1, 'Mã dòng': 1, 'Từ tháng': 1, 'Đến tháng': 1, 'SĐT người thân liên hệ': 1, 'Mã chấm công': 1 };
  var TIME_COLS = { 'Giờ vào': 1, 'Giờ ra': 1, 'Giờ bắt đầu': 1, 'Giờ kết thúc': 1 };
  var KNOWN = {}; TYPES.forEach(function (t) { t.need.concat(t.cols).forEach(function (c) { KNOWN[c.replace(/\*$/, '')] = 1; }); });
  var MA_NV_RE = /^[A-Za-z]{1,6}[-_.]?\d+$/;

  /* ---------------- Tiện ích ---------------- */
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function stripAcc(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  function normHeader(h) {
    if (h === null || h === undefined) return null;
    var s = String(h).replace(/\s+/g, ' ').trim();
    if (!s) return null;
    var low = s.toLowerCase();
    if (ALIAS[low]) return ALIAS[low];
    if (ALIAS[stripAcc(low)]) return ALIAS[stripAcc(low)];
    return s;
  }
  function isDateCol(c) { return (/^Ngày/.test(c) && c !== 'Ngày công thực tế') || c === 'Từ ngày' || c === 'Đến ngày'; }
  function isXD(v) { return v && typeof v === 'object' && typeof v.s === 'number'; }
  function serialToISO(s) { var d = new Date(Date.UTC(1899, 11, 30) + Math.round(s * 86400000)); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); }
  function serialToHM(s) { var f = s - Math.floor(s), m = Math.round(f * 1440) % 1440; return p2(Math.floor(m / 60)) + ':' + p2(m % 60); }
  var VN_DATE = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/, ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})/;

  function normVal(col, v) {
    if (v === null || v === undefined) return null;
    if (isXD(v)) {
      if (TIME_COLS[col]) return serialToHM(v.s);
      return serialToISO(v.s);
    }
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') {
      if (isNaN(v)) return null;
      if (TEXT_COLS[col]) return Number.isInteger(v) ? String(v) : String(v);
      if (TIME_COLS[col] && v >= 0 && v < 1) return serialToHM(v);
      if (isDateCol(col) && v > 20000 && v < 80000) return serialToISO(v);
      return Number.isInteger(v) ? v : Math.round(v * 10000) / 10000;
    }
    var s = String(v).trim();
    if (!s) return null;
    if (isDateCol(col)) {
      var m = VN_DATE.exec(s); if (m) return m[3] + '-' + p2(+m[2]) + '-' + p2(+m[1]);
      m = ISO_DATE.exec(s); if (m) return m[1] + '-' + p2(+m[2]) + '-' + p2(+m[3]);
    }
    return s;
  }

  /* ---------------- Đọc 1 sheet ---------------- */
  function findHeader(rows) {
    function score(r) { if (!r) return 0; var n = 0; for (var i = 0; i < r.length; i++) { var h = normHeader(r[i]); if (h && KNOWN[h]) n++; } return n; }
    if (rows.length >= 5 && score(rows[4]) >= 2) return 4;           // chuẩn: tiêu đề ở dòng 5
    var lim = Math.min(rows.length, 40);
    for (var i = 0; i < lim; i++) if (score(rows[i]) >= 2) return i;
    return -1;
  }
  function detectType(headers) {
    var set = {}; headers.forEach(function (h) { if (h) set[h] = 1; });
    for (var i = 0; i < TYPES.length; i++) {
      var t = TYPES[i];
      if (t.need.every(function (c) { return set[c]; })) return t;
    }
    return null;
  }
  function missingCols(t, headers) {
    var set = {}; headers.forEach(function (h) { if (h) set[h] = 1; });
    return t.cols.filter(function (c) {
      if (t.opt && t.opt.indexOf(c) >= 0) return false; // cột không bắt buộc: không báo thiếu
      if (/\*$/.test(c)) { var pre = c.slice(0, -1); return !headers.some(function (h) { return h && h.indexOf(pre) === 0; }); }
      return !set[c];
    }).map(function (c) { return c.replace(/\*$/, '…'); });
  }
  function monthFromTitle(rows, sheetName, fileName) {
    var txt = '';
    for (var i = 0; i < Math.min(4, rows.length); i++) if (rows[i]) txt += ' ' + rows[i].filter(function (x) { return typeof x === 'string'; }).join(' ');
    var m = /TH[ÁA]NG\s*(\d{1,2})\s*[\/\-]\s*(\d{4})/i.exec(txt) || /THANG\s*(\d{1,2})\s*[\/\-]\s*(\d{4})/i.exec(stripAcc(txt));
    if (m) return m[2] + '-' + p2(+m[1]);
    var ms = /T(\d{1,2})\b/i.exec(sheetName || ''), my = /(20\d\d)/.exec(fileName || '') || /(20\d\d)/.exec(txt);
    if (ms && my && +ms[1] >= 1 && +ms[1] <= 12) return my[1] + '-' + p2(+ms[1]);
    return null;
  }

  // rows: mảng các dòng (mảng ô) đọc từ sheet. Trả về 1 mục kết quả.
  function parseSheet(rows, sheetName, fileName) {
    var it = { sheet: sheetName, type: null, headerRow: null, rows: [], count: 0, skipped: 0, missing: [], month: null, note: '' };
    var hi = findHeader(rows);
    if (hi < 0) { it.note = 'Không thấy dòng tiêu đề quen thuộc, bỏ qua sheet này'; return it; }
    var raw = rows[hi] || [], headers = [];
    for (var j = 0; j < raw.length; j++) headers[j] = normHeader(raw[j]);
    var t = detectType(headers);
    it.headerRow = hi + 1;
    if (!t) { it.note = 'Không nhận ra đây là bảng nào'; return it; }
    it.type = t.k; it.missing = missingCols(t, headers);
    var key = t.key || 'Mã NV', out = [];
    for (var r = hi + 1; r < rows.length; r++) {
      var row = rows[r]; if (!row) continue;
      var rec = {}, any = false;
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c]; if (!h || rec.hasOwnProperty(h)) continue;
        var v = normVal(h, row[c]); rec[h] = v; if (v !== null) any = true;
      }
      if (!any) continue;
      var kv = rec[key], ok;
      if (key === 'Mã NV') ok = typeof kv === 'string' && MA_NV_RE.test(kv);
      else ok = kv !== null && kv !== '' && !/^tong\b/.test(stripAcc(String(kv)).toLowerCase());
      if (!ok) { it.skipped++; continue; }
      out.push(rec);
    }
    it.rows = out; it.count = out.length;
    if (t.k === 'CC') {
      var cnt = {}; out.forEach(function (x) { if (x['Ngày']) { var ym = String(x['Ngày']).slice(0, 7); cnt[ym] = (cnt[ym] || 0) + 1; } });
      var best = null; for (var ym in cnt) if (!best || cnt[ym] > cnt[best]) best = ym; it.month = best;
    } else if (t.k === 'BL') it.month = monthFromTitle(rows, sheetName, fileName);
    if (t.k === 'BL' && it.skipped) it.note = 'Đã bỏ qua ' + it.skipped + ' dòng tổng cộng/chữ ký/không có mã';
    return it;
  }

  /* ---------------- Gộp nhiều file thành dữ liệu 1 đơn vị ---------------- */
  // files: [{path, mtime, sheets:[parseSheet(...)] , error}]
  function mergeFiles(files, log) {
    log = log || function () {};
    var data = { NV: [], PB: [], CV: [], CA: [], KH: [], HD: [], LS: [], DON: [], QP: [], GT: [], QT: [], CC: {}, BL: {} };
    var report = [], cand = {};
    files.forEach(function (f) {
      if (f.error) { report.push({ path: f.path, sheet: '', type: null, error: f.error }); log('  ✕ ' + f.path + ': KHÔNG ĐỌC ĐƯỢC – ' + f.error + '. Các file khác vẫn đọc tiếp.'); return; }
      f.sheets.forEach(function (s) {
        var item = { path: f.path, sheet: s.sheet, type: s.type, month: s.month, headerRow: s.headerRow, count: s.count, skipped: s.skipped, missing: s.missing, note: s.note, error: s.error };
        report.push(item);
        if (s.error) { log('  ✕ ' + f.path + ' [' + s.sheet + ']: ' + s.error); return; }
        if (!s.type) { log('  – ' + f.path + ' [' + s.sheet + ']: ' + s.note); return; }
        var t = TYPE[s.type];
        log('  ✓ ' + f.path + ' [' + s.sheet + '] → ' + t.name + (s.month ? ' tháng ' + s.month : '') + ': tiêu đề ở dòng ' + s.headerRow +
          ', dữ liệu từ dòng ' + (s.headerRow + 1) + ', đọc được ' + s.count + ' dòng' + (s.skipped ? ', bỏ qua ' + s.skipped + ' dòng tổng cộng/chữ ký/không có mã' : '') +
          '; ' + (s.missing.length ? 'THIẾU CỘT: ' + s.missing.join(', ') : 'đủ cột cần dùng'));
        var k = s.type + '|' + (s.month || '');
        (cand[k] = cand[k] || []).push({ s: s, item: item, mtime: f.mtime || 0 });
      });
    });
    Object.keys(cand).forEach(function (k) {
      var list = cand[k].sort(function (a, b) { return (b.s.count - a.s.count) || (b.mtime - a.mtime); });
      var win = list[0], tk = k.split('|')[0], ym = k.split('|')[1];
      if (TYPE[tk].monthly) {
        if (!ym) { win.item.note = 'Không xác định được tháng nên chưa dùng'; log('  ! ' + win.item.path + ' [' + win.item.sheet + ']: không xác định được tháng, chưa dùng bảng này'); return; }
        data[tk][ym] = win.s.rows;
      } else data[tk] = win.s.rows;
      win.item.used = true;
      list.slice(1).forEach(function (o) { o.item.note = 'Trùng với ' + win.item.path + ', không dùng'; log('  ! Trùng ' + TYPE[tk].name + (ym ? ' tháng ' + ym : '') + ': dùng ' + win.item.path + ', bỏ qua ' + o.item.path); });
    });
    ['CC', 'BL'].forEach(function (k) { var o = {}; Object.keys(data[k]).sort().forEach(function (m) { o[m] = data[k][m]; }); data[k] = o; });
    TYPES.forEach(function (t) { if (!t.monthly && !data[t.k].length) log('  ! Không tìm thấy bảng ' + t.name); });
    return { data: data, report: report };
  }

  /* ---------------- Ngày ---------------- */
  function isoToday() { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function dnum(iso) { if (!iso) return null; var m = ISO_DATE.exec(iso); if (!m) return null; return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000; }
  function vnDate(iso) { if (!iso) return ''; var m = ISO_DATE.exec(iso); return m ? p2(+m[3]) + '/' + p2(+m[2]) + '/' + m[1] : String(iso); }
  function parseVn(s) { var m = VN_DATE.exec(String(s || '').trim()); if (!m) return null; var d = +m[1], mo = +m[2], y = +m[3]; if (mo < 1 || mo > 12 || d < 1) return null; var dt = new Date(Date.UTC(y, mo - 1, d)); if (dt.getUTCDate() !== d) return null; return y + '-' + p2(mo) + '-' + p2(d); }
  function ymLabel(ym) { return ym ? ym.slice(5, 7) + '/' + ym.slice(0, 4) : ''; }
  function addMonths(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + p2(m + 1); }

  /* ---------------- Trạng thái nhân viên tại ngày tham chiếu ---------------- */
  var ST_LEFT = 'Đã nghỉ việc', ST_MAT = 'Nghỉ thai sản';
  // mat: tập Mã NV đang nghỉ thai sản tại ngày R theo đơn đã duyệt (null = không có dữ liệu đơn → dùng cột Trạng thái)
  function staffState(e, R, mat) {
    var r = dnum(R), vao = dnum(e['Ngày vào làm']), nghi = dnum(e['Ngày nghỉ việc']), st = e['Trạng thái'] || '';
    if (vao !== null && vao > r) return 'future';
    if (nghi !== null && nghi < r) return 'left';
    if (st === ST_LEFT && nghi === null) return 'left';
    if (mat && mat.known) return mat[e['Mã NV']] ? 'maternity' : 'working';
    if (st === ST_MAT) return 'maternity';
    return 'working';
  }
  function maternitySet(d, R) {
    var r = dnum(R), m = { known: false };
    d.DON.forEach(function (x) {
      if (x['Loại nghỉ'] !== 'Nghỉ thai sản' || x['Trạng thái'] !== 'Đã duyệt') return;
      m.known = true;
      var a = dnum(x['Từ ngày']), b = dnum(x['Đến ngày']);
      if (a !== null && a <= r && (b === null || b >= r)) m[x['Mã NV']] = true;
    });
    return m;
  }
  function isActive(e, R, mat) { var s = staffState(e, R, mat); return s === 'working' || s === 'maternity'; }

  /* ---------------- Số liệu Bảng điều hành ---------------- */
  // units: [{id,name,data}], opts: {ref, month, contractDays}
  function dashboard(units, opts) {
    var R = opts.ref, r = dnum(R), N = opts.contractDays || 45, refYm = R.slice(0, 7);
    var res = { ref: R, staff: { working: 0, maternity: 0, active: 0 }, people: [], depts: [], months: [], month: null,
      payroll: null, prevPayroll: null, contracts: { soon: [], overdue: [] }, leaves: { pending: [], soon: 0, overdue: 0 },
      moves: { month: refYm, joined: [], left: [] }, overStaff: [] };
    var payByMonth = {};
    units.forEach(function (u) {
      var d = u.data, nvById = {}, mat = maternitySet(d, R);
      d.NV.forEach(function (e) { nvById[e['Mã NV']] = e; });
      var deptCount = {};
      d.NV.forEach(function (e) {
        var s = staffState(e, R, mat);
        if (s === 'working' || s === 'maternity') {
          res.staff[s]++; res.staff.active++;
          res.people.push({ unit: u.name, e: e, state: s });
          var dk = e['Phòng ban'] || '(Chưa ghi phòng ban)';
          deptCount[dk] = deptCount[dk] || { working: 0, maternity: 0 }; deptCount[dk][s]++;
        }
        if (e['Ngày vào làm'] && String(e['Ngày vào làm']).slice(0, 7) === refYm && dnum(e['Ngày vào làm']) <= r) res.moves.joined.push({ unit: u.name, e: e });
        if (e['Ngày nghỉ việc'] && String(e['Ngày nghỉ việc']).slice(0, 7) === refYm && dnum(e['Ngày nghỉ việc']) <= r) res.moves.left.push({ unit: u.name, e: e });
      });
      // phòng ban theo thứ tự danh mục, kèm định biên
      var seen = {};
      d.PB.forEach(function (p) {
        var name = p['Tên phòng ban']; seen[name] = 1;
        var c = deptCount[name] || { working: 0, maternity: 0 };
        var item = { unit: u.name, name: name, code: p['Mã phòng ban'], working: c.working, maternity: c.maternity, plan: typeof p['Định biên'] === 'number' ? p['Định biên'] : null };
        res.depts.push(item);
        if (item.plan !== null && item.working + item.maternity > item.plan) res.overStaff.push(item);
      });
      Object.keys(deptCount).forEach(function (name) { if (!seen[name]) res.depts.push({ unit: u.name, name: name, working: deptCount[name].working, maternity: deptCount[name].maternity, plan: null }); });
      // quỹ lương theo tháng
      Object.keys(d.BL).forEach(function (ym) {
        var p = payByMonth[ym] = payByMonth[ym] || { ym: ym, gross: 0, net: 0, people: 0 };
        d.BL[ym].forEach(function (x) { p.gross += +x['Tổng thu nhập'] || 0; p.net += +x['Thực lĩnh'] || 0; p.people++; });
      });
      // hợp đồng: xét theo NGÀY (không theo cột Tình trạng, vì cột này chỉ đúng tại ngày lập file)
      var byNv = {};
      d.HD.forEach(function (h) { (byNv[h['Mã NV']] = byNv[h['Mã NV']] || []).push(h); });
      Object.keys(byNv).forEach(function (id) {
        var e = nvById[id]; if (!e || !isActive(e, R, mat)) return;
        var list = byNv[id].slice().sort(function (a, b) { return (dnum(a['Ngày hiệu lực']) || 0) - (dnum(b['Ngày hiệu lực']) || 0); });
        var signed = list.filter(function (h) { var k = dnum(h['Ngày ký']) !== null ? dnum(h['Ngày ký']) : dnum(h['Ngày hiệu lực']); return k === null || k <= r; });
        if (!signed.length) return;
        var cur = signed[signed.length - 1];               // HĐ mới nhất đã ký tính đến ngày R
        var end = dnum(cur['Ngày chấm dứt']); if (end !== null && end < r) return;
        var exp = dnum(cur['Ngày hết hạn']); if (exp === null) return;   // không xác định thời hạn
        var rec = { unit: u.name, h: cur, e: e, days: exp - r };
        if (exp < r) res.contracts.overdue.push(rec); else if (exp - r <= N) res.contracts.soon.push(rec);
      });
      // đơn nghỉ chờ duyệt
      d.DON.forEach(function (x) {
        if (x['Trạng thái'] !== 'Chờ duyệt') return;
        var days = x['Từ ngày'] ? dnum(x['Từ ngày']) - r : null;
        res.leaves.pending.push({ unit: u.name, x: x, days: days });
        if (days !== null && days < 0) res.leaves.overdue++; else if (days !== null && days <= 7) res.leaves.soon++;
      });
    });
    res.contracts.soon.sort(function (a, b) { return a.days - b.days; });
    res.contracts.overdue.sort(function (a, b) { return a.days - b.days; });
    res.leaves.pending.sort(function (a, b) { return (a.days === null ? 1e9 : a.days) - (b.days === null ? 1e9 : b.days); });
    res.months = Object.keys(payByMonth).sort().map(function (k) { return payByMonth[k]; });
    // tháng hiển thị: tháng chọn, nếu không có thì tháng lương gần nhất không sau ngày tham chiếu
    var avail = res.months.map(function (m) { return m.ym; });
    var mon = opts.month && avail.indexOf(opts.month) >= 0 ? opts.month : null;
    if (!mon) { var le = avail.filter(function (m) { return m <= refYm; }); mon = le.length ? le[le.length - 1] : (avail[avail.length - 1] || null); }
    res.month = mon;
    if (mon) {
      res.payroll = payByMonth[mon];
      var pm = addMonths(mon, -1); res.prevPayroll = payByMonth[pm] || null;
    }
    return res;
  }

  /* ---------------- Tổng kết sau khi quét (ghi nhật ký) ---------------- */
  function summary(data) {
    var parts = [];
    parts.push(data.NV.length + ' hồ sơ nhân viên');
    parts.push(Object.keys(data.CC).length + ' tháng chấm công' + (Object.keys(data.CC).length ? ' (' + Object.keys(data.CC).map(ymLabel).join(', ') + ')' : ''));
    parts.push(Object.keys(data.BL).length + ' tháng lương' + (Object.keys(data.BL).length ? ' (' + Object.keys(data.BL).map(ymLabel).join(', ') + ')' : ''));
    parts.push(data.HD.length + ' hợp đồng, ' + data.LS.length + ' quyết định lương, ' + data.DON.length + ' đơn nghỉ');
    return parts.join('; ');
  }

  /* ---------------- Che thông tin nhạy cảm (nhật ký, màn hình) ---------------- */
  function maskDigits(s) {
    return String(s).replace(/\d{9,}/g, function (m) { return new Array(m.length - 2).join('*') + m.slice(-3); });
  }
  function maskValue(v) { if (v === null || v === undefined || v === '') return ''; var s = String(v); if (s.length <= 3) return s; return new Array(s.length - 2).join('*') + s.slice(-3); }

  return {
    TYPES: TYPES, TYPE: TYPE, parseSheet: parseSheet, mergeFiles: mergeFiles, dashboard: dashboard, summary: summary,
    staffState: staffState, isActive: isActive, maternitySet: maternitySet, isoToday: isoToday, dnum: dnum, vnDate: vnDate, parseVn: parseVn, ymLabel: ymLabel,
    addMonths: addMonths, maskDigits: maskDigits, maskValue: maskValue, stripAcc: stripAcc, normHeader: normHeader
  };
})();
if (typeof module !== 'undefined') module.exports = HR;
