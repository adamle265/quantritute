/* ===========================================================================
   PHẦN MỀM QUẢN LÝ NHÂN SỰ – GIAO DIỆN – khung, đọc thư mục, Bảng điều hành, Cài đặt
   (các trang dữ liệu, cảnh báo, nạp tháng mới, xuất báo cáo ở phần PAGES bên dưới)
   =========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); }
  var SUPPORT_MSG = 'Nếu lỗi lặp lại, vào Cài đặt → Nhật ký → bấm "Tải file nhật ký" rồi gửi file nhat-ky.txt cho người hỗ trợ.';
  var CAN_PICK = typeof window.showDirectoryPicker === 'function';

  /* ---------------- Định dạng số ---------------- */
  function fmtInt(n) { if (n === null || n === undefined || n === '' || isNaN(n)) return ''; return Math.round(+n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fmtTy(n) { return (n / 1e9).toFixed(2).replace('.', ','); }
  function fmtPct(x) { return (x > 0 ? '+' : '') + x.toFixed(1).replace('.', ',') + '%'; }
  function nowVn() { var d = new Date(); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); }

  /* ---------------- Nhật ký ---------------- */
  var LOG = [], LOG_MAX = 6000, logTimer = null;
  function log(msg) {
    var line = '[' + nowVn() + '] ' + HR.maskDigits(String(msg));
    LOG.push(line); if (LOG.length > LOG_MAX) LOG.splice(0, LOG.length - LOG_MAX);
    clearTimeout(logTimer); logTimer = setTimeout(function () { dbSet('log', LOG).catch(function () {}); }, 600);
    if (curPage === 'caidat') { var el = $('#logBox'); if (el) { el.textContent = LOG.slice(-300).join('\n'); el.scrollTop = el.scrollHeight; } }
  }
  function logErr(ctx, e) { log('LỖI – ' + ctx + ': ' + (e && e.stack ? e.stack : e)); }

  /* ---------------- Lưu trữ trên trình duyệt (IndexedDB) ---------------- */
  var dbP = null, DB_OK = true;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (res, rej) {
      try {
        var rq = indexedDB.open('qtt-quan-ly-nhan-su', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('kv'); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error); };
      } catch (e) { rej(e); }
    });
    dbP.catch(function () { DB_OK = false; });
    return dbP;
  }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('kv', mode), st = t.objectStore('kv'), out = fn(st); t.oncomplete = function () { res(out && out.result); }; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); }; }); }); }
  function dbGet(k) { return tx('readonly', function (s) { return s.get(k); }); }
  function dbSet(k, v) { return tx('readwrite', function (s) { s.put(v, k); }); }
  function dbClear() { return tx('readwrite', function (s) { s.clear(); }); }

  /* ---------------- Trạng thái ---------------- */
  var DEF = { refMode: 'today', refDate: null, unit: 'all', month: null, theme: 'auto', color: 'ngoc', pick: null, cfg: null, maskExport: true };
  var S = { settings: Object.assign({}, DEF, { cfg: Object.assign({}, HRR.DEF) }), units: [], done: {} };
  function cfg() { return S.settings.cfg; }
  function saveDone() { return dbSet('done', S.done).catch(function (e) { logErr('Lưu đánh dấu đã xử lý', e); }); }
  var curPage = 'dash';
  var REF_DAY = null; // 0.3.1: 'Tính đến' = hôm nay → app mở qua đêm thì tự nhảy sang ngày mới
  setInterval(function () { try { var t = HR.isoToday(); if (REF_DAY && t !== REF_DAY && S.settings && S.settings.refMode === 'today') { REF_DAY = t; render(); } else REF_DAY = t; } catch (e) { } }, 60000);
  function refDate() { return S.settings.refMode === 'fixed' && S.settings.refDate ? S.settings.refDate : HR.isoToday(); }
  function selUnits() { if (S.settings.unit === 'all' || !S.units.some(function (u) { return u.id === S.settings.unit; })) { var pk = pickIds(); return S.units.filter(function (u) { return pk.indexOf(u.id) >= 0; }); } return S.units.filter(function (u) { return u.id === S.settings.unit; }); }
  // 06/11/2026 – nhiều công ty độc lập (anh sửa 07:39: không phải mẹ – con), xem từng công ty hoặc Tổng các công ty
  // 06/11/2026: các công ty là đơn vị ĐỘC LẬP (không phân mẹ – con). "Tổng các công ty" = gộp các công ty được tích chọn
  var SAMPLE_V = '2026-11-07e';   // 07/11 17:42: thêm bảng lương tháng 10 (đã hoàn thành); 'Tính đến' mặc định hôm nay
  //  (bản 2026-11-07d) 07/11 15:20: thêm chấm công 01–07/11, ngày chốt mẫu 07/11/2026, tháng 08–10 đã chốt công
  var SAMPLE_REF = '2026-11-07'; //   // 07/11 09:45: DS007 thử việc đủ 60 ngày, Health bỏ 'công ty mẹ'
  // trước: '2026-11-07b' – 06/11 23:35: Health có Ban Giám đốc   // đổi khi dữ liệu mẫu thay đổi → trình duyệt tự nạp lại bộ mẫu mới
  function groupLabel() { return 'Tổng các công ty'; }
  function pickIds() { var all = S.units.map(function (u) { return u.id; }), p = (S.settings.pick || []).filter(function (id) { return all.indexOf(id) >= 0; }); return p.length ? p : all; }
  function whoUnits(us) { return us.length <= 3 ? us.map(function (u) { return esc(shortUnit(u.name)); }).join(' + ') : 'gộp ' + us.length + ' công ty'; }
  function shortUnit(n) { return String(n || '').replace(/\s*\(dữ liệu mẫu\)\s*$/i, '').replace(/^Công ty\s+(TNHH|CP|Cổ phần)\s+/i, ''); }
  function unitOrder() { return S.units.slice(); }
  function saveSettings() { return dbSet('settings', S.settings).catch(function (e) { logErr('Lưu cài đặt', e); }); }
  function saveUnits() {
    var clean = S.units.map(function (u) { var o = {}; Object.keys(u).forEach(function (k) { if (k.charAt(0) !== '_') o[k] = u[k]; }); return o; });
    return dbSet('units', clean).catch(function (e) {
      logErr('Lưu dữ liệu vào trình duyệt', e);
      toast('Chưa lưu được dữ liệu vào trình duyệt', 'err', 'Phần mềm vẫn dùng được trong lần mở này; lần sau mở lại sẽ phải chọn lại thư mục. ' + SUPPORT_MSG);
    });
  }
  function uid() { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------------- Thông báo ---------------- */
  function toast(msg, type, sub) {
    var el = document.createElement('div'); el.className = 'toast toast-' + (type || 'ok');
    el.innerHTML = esc(msg) + (sub ? '<small>' + esc(sub) + '</small>' : '');
    $('#toasts').appendChild(el);
    setTimeout(function () { el.remove(); }, type === 'err' ? 12000 : 5000);
    el.addEventListener('click', function () { el.remove(); });
  }
  function showErr(title, e, hint) {
    logErr(title, e);
    var msg = e && e.friendly ? e.message : (hint || 'Vui lòng thử lại.');
    toast(title, 'err', msg + ' ' + SUPPORT_MSG);
  }
  window.addEventListener('error', function (ev) { logErr('Lỗi không mong muốn', ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function (ev) { logErr('Lỗi không mong muốn (bất đồng bộ)', ev.reason); });

  /* ---------------- Biểu tượng ---------------- */
  var IC = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    viec: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    nv: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>',
    hd: '<path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7h5M9 12h7M9 16h5"/>',
    cc: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    np: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4"/>',
    bl: '<rect x="2.5" y="6" width="19" height="12.5" rx="2"/><circle cx="12" cy="12.2" r="2.8"/><path d="M6 9.5v5.5M18 9.5v5.5"/>',
    dm: '<path d="M4 5h16M4 12h16M4 19h10"/>',
    dinhky: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M15 15.5a3 3 0 1 1-.9-2.1M15 12.3v2h-2"/>',
    nhap: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M4 14.5v5h16v-5"/>',
    xuat: '<path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5"/><path d="M4 14.5v5h16v-5"/>',
    caidat: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    folder: '<path d="M3 6.5a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    files: '<path d="M7 3h7l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
    sample: '<path d="M9 3h6M10 3v6L4.5 18.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    g_tq: '<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>',
    g_ns: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c1-4 3.9-6 7.5-6s6.5 2 7.5 6"/>',
    g_tg: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.8 1.8M9.5 2.5h5"/>',
    g_lg: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15h4"/>',
    g_pt: '<path d="M4 19.5 9.5 14l3.5 3.5 7-8"/><path d="M15 9.5h5v5"/>',
    g_ht: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    tochuc: '<rect x="9" y="3" width="6" height="4.5" rx="1"/><rect x="3" y="16.5" width="6" height="4.5" rx="1"/><rect x="15" y="16.5" width="6" height="4.5" rx="1"/><path d="M12 7.5v4.5M6 16.5V12h12v4.5"/>',
    hoso: '<path d="M4 5.5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2V18.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="12" r="2.3"/><path d="M8.3 17.5c.6-1.6 2-2.5 3.7-2.5s3.1.9 3.7 2.5"/>',
    taikhoan: '<rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
    ccwifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.5a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1.2"/>',
    thietlapcc: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M19 3.5l1.5 1.5M5 3.5 3.5 5"/>',
    phieuluong: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    congthuc: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 7h8M8 11.5h2M14 11.5h2M8 15.5h2M14 15.5h2M8 19h.01"/>',
    g_td: '<circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/>',
    tdnhucau: '<rect x="5" y="3.5" width="14" height="18" rx="2"/><path d="M9 3.5h6v3H9zM8.5 11h7M8.5 15h4"/>',
    tdtin: '<path d="M3.5 10v4h3l7 4.5v-13L6.5 10z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    tdungvien: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.3 0 2.5.3 3.5.9"/><circle cx="17" cy="16" r="3"/><path d="m21.5 20.5-2.3-2.3"/>',
    tdmoi: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/><path d="m14.5 16.5 2 2 4-4"/>',
    tuyendung: '<circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5M10.5 8v5M8 10.5h5"/>',
    hoinhap: '<path d="M5 21V4.5"/><path d="M5 4.5h11l-2 3.5 2 3.5H5"/>',
    daotao: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2V11M21.5 9v5"/>',
    bhxh: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    appnv: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    ext: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    theme: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'
  };
  function ic(n, sz) { return '<svg viewBox="0 0 24 24" ' + (sz ? 'width="' + sz + '" height="' + sz + '" ' : '') + 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>'; }

  /* ---------------- Menu 2 tầng: nhóm (thanh trái) → module (cột thứ hai) ----------------
     st: 'ok' = đã chạy trong phần mềm · 'thu' = bản thử chạy online riêng · số = phần của series sẽ làm */
  var GROUPS = [
    { id: 'tq', t: 'Tổng quan', d: 'Nhìn nhanh tình hình và những việc cần xử lý trước.' },
    { id: 'ns', t: 'Nhân sự', d: 'Ai đang làm ở đâu, hồ sơ, hợp đồng và tài khoản của từng người.' },
    { id: 'tg', t: 'Chấm công', d: 'Chấm công, tổng hợp công và nghỉ phép.' },
    { id: 'lg', t: 'Lương', d: 'Bảng lương, phiếu lương và cách đơn vị tự đặt công thức tính.' },
    { id: 'td', t: 'Tuyển dụng', d: 'Từ nhu cầu tuyển đến ngày người mới đi làm.' },
    { id: 'ht', t: 'Cài đặt hệ thống', s: 'Cài đặt', d: 'Nhập – xuất dữ liệu, danh mục và cài đặt.' }
  ];
  var MODS = [
    { id: 'dash', g: 'tq', t: 'Bảng điều hành', st: 'ok', k: 'tong quan dashboard' },
    { id: 'viec', g: 'tq', t: 'Việc cần xử lý', st: 'ok', k: 'canh bao viec gap' },
    { id: 'tochuc', g: 'ns', t: 'Sơ đồ tổ chức', st: 'ok', k: 'phong ban so do' },
    { id: 'nv', g: 'ns', t: 'Danh sách nhân sự', st: 'ok', k: 'danh sach nhan vien tai khoan dang nhap pin' }, // gộp Tài khoản nhân viên (anh chốt 01/11 23:28)
    { id: 'hoso', g: 'ns', t: 'Hồ sơ nhân sự', st: 'ok', k: 'giay to bang cap ly lich' },
    { id: 'hd', g: 'ns', t: 'Hợp đồng', st: 'ok', k: 'hop dong lao dong het han' },
    { id: 'cc', g: 'tg', t: 'Tổng hợp công', st: 'ok', k: 'cham cong bang cong' },
    { id: 'ccwifi', g: 'tg', t: 'Chấm công Wi‑Fi', st: 'ok', k: 'cham cong wifi qr dien thoai' },
    { id: 'np', g: 'tg', t: 'Nghỉ phép', st: 'ok', k: 'don nghi phep quy phep' },
    { id: 'thietlapcc', g: 'tg', t: 'Thiết lập chấm công', st: 'ok', k: 'ca lam gio vao ra di muon' },
    { id: 'bl', g: 'lg', t: 'Bảng lương', st: 'ok', k: 'luong thuc linh' },
    { id: 'phieuluong', g: 'lg', t: 'Phiếu lương', st: 5, k: 'phieu luong gui nhan vien' },
    { id: 'congthuc', g: 'lg', t: 'Thiết lập công thức lương', st: 5, k: 'cong thuc tinh luong bhxh giam tru' },
    { id: 'tdnhucau', g: 'td', t: 'Nhu cầu tuyển dụng', st: 7, k: 'tuyen dung ke hoach dinh bien vi tri can tuyen' },
    { id: 'tdtin', g: 'td', t: 'Tin tuyển dụng', st: 7, k: 'tuyen dung dang tin mo ta cong viec' },
    { id: 'tdungvien', g: 'td', t: 'Ứng viên & phỏng vấn', st: 7, k: 'tuyen dung ung vien ho so phong van danh gia' },
    { id: 'tdmoi', g: 'td', t: 'Mời nhận việc', st: 7, k: 'tuyen dung offer thu moi nhan viec' },
    { id: 'hoinhap', g: null, t: 'Hội nhập', st: 7, k: 'hoi nhap onboarding check in' },
    { id: 'daotao', g: null, t: 'Đào tạo nội bộ', st: 7, k: 'dao tao khoa hoc' },
    { id: 'bhxh', g: null, t: 'Bảo hiểm xã hội', st: 7, k: 'bhxh bao hiem' },
    { id: 'nhap', g: 'ht', t: 'Nhập dữ liệu', st: 'ok', k: 'nap file excel thang moi' },
    { id: 'xuat', g: 'ht', t: 'Xuất báo cáo', st: 'ok', k: 'bao cao excel' },
    { id: 'dm', g: 'ht', t: 'Danh mục', st: 'ok', k: 'danh muc phong ban chuc vu ca ky hieu' },
    { id: 'dinhky', g: 'ht', t: 'Việc định kỳ', st: 'ok', k: 'viec dinh ky lap lai hang thang nhac chot cong luong' },
    { id: 'appnv', g: 'ht', t: 'Ứng dụng nhân viên', st: 2, k: 'app dien thoai nhan vien' },
    { id: 'caidat', g: 'ht', t: 'Cài đặt', st: 'ok', k: 'cai dat nguong xoa du lieu' }
  ];
  var NAV = MODS; // giữ tên cũ cho phần kiểm tra trang hợp lệ
  function modOf(id) { return MODS.filter(function (m) { return m.id === id; })[0]; }
  function groupOf(id) { var m = modOf(id); return m ? m.g : 'tq'; } // null = module chính đứng riêng, không thuộc nhóm
  var TREE = ['tq', 'ns', 'tg', 'lg', 'td', 'hoinhap', 'daotao', 'bhxh', 'ht']; // thứ tự trên thanh công cụ
  function isSoon(m) { return m && typeof m.st === 'number'; }
  function navItem(m) {
    var meta = m.id === 'viec' && navBadge() ? '<span class="badge">' + navBadge() + '</span>' :
      '';
    return '<button class="nav-item' + (curPage === m.id ? ' active' : '') + '" data-go="' + m.id + '"' + (curPage === m.id ? ' aria-current="page"' : '') + '>' + ic(m.id) + '<span>' + m.t + '</span>' + meta + '</button>';
  }
  // Menu cây: nhóm cha mở sẵn; bấm tên nhóm để ẩn / hiện. Lưu nhóm đang ẩn trong trình duyệt (chỉ là tiện ích).
  var CLOSED = {}; try { CLOSED = JSON.parse(localStorage.getItem('qtt-qlns-nav') || '{}') || {}; } catch (e) { CLOSED = {}; }
  function saveClosed() { try { localStorage.setItem('qtt-qlns-nav', JSON.stringify(CLOSED)); } catch (e) { } }
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  function renderNav() {
    var cg = groupOf(curPage === 'start' ? 'dash' : curPage), bad = navBadge();
    var ready = MODS.filter(function (m) { return !isSoon(m); }).length;
    $('#nav').innerHTML = TREE.map(function (key) {
      var g = GROUPS.filter(function (x) { return x.id === key; })[0];
      if (!g) { // module chính đứng riêng
        var tm = modOf(key), on = curPage === key;
        return '<button type="button" class="tg-h tg-top' + (on ? ' on' : '') + '" data-go="' + key + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(key) + '<span>' + tm.t + '</span></button>';
      }
      var ms = MODS.filter(function (m) { return m.g === g.id; }), closed = !!CLOSED[g.id];
      var items = ms;
      var gb = closed && g.id === 'tq' && bad ? '<span class="badge">' + bad + '</span>' : '';
      return '<div class="tg' + (closed ? ' closed' : '') + (g.id === cg ? ' cur' : '') + '"><button type="button" class="tg-h" data-tg="' + g.id + '" aria-expanded="' + (!closed) + '" title="' + esc(g.d) + '">' + ic('g_' + g.id) + '<span>' + g.t + '</span>' + gb + '<span class="tg-n">' + ms.length + '</span>' + CHEV + '</button>' +
        '<div class="tg-b">' + items.map(navItem).join('') + '</div></div>';
    }).join('');
    var allClosed = GROUPS.every(function (g) { return CLOSED[g.id]; });
    $('#sbAll').textContent = allClosed ? 'Mở tất cả' : 'Thu gọn';
    $('#sbCount').textContent = MODS.length + ' tính năng';
    $('#mbar').innerHTML = GROUPS.map(function (g) {
      return '<button class="' + (g.id === cg ? 'on' : '') + '" data-mgroup="' + g.id + '">' + ic('g_' + g.id) + '<span>' + (g.s || g.t) + '</span></button>';
    }).join('');
    var m = modOf(curPage), cgObj = GROUPS.filter(function (g) { return g.id === cg; })[0];
    $('#crumb').innerHTML = curPage === 'start' ? '<b>Bắt đầu</b>' : cgObj ? cgObj.t + ' <i>/</i> <b>' + (m ? m.t : '') + '</b>' : '<b>' + (m ? m.t : '') + '</b>';
    document.title = (curPage === 'start' ? 'Bắt đầu' : m ? m.t : 'Quản lý nhân sự') + ' · Quản lý nhân sự';
  }
  document.addEventListener('click', function (e) {
    var h = e.target.closest('[data-tg]');
    if (h) { var gid = h.getAttribute('data-tg'); if (CLOSED[gid]) delete CLOSED[gid]; else CLOSED[gid] = 1; saveClosed(); renderNav(); var nh = $('[data-tg="' + gid + '"]'); if (nh) nh.focus(); return; }
    if (e.target.closest('[data-act="nav-all"]')) { var allC = GROUPS.every(function (g) { return CLOSED[g.id]; }); CLOSED = {}; if (!allC) GROUPS.forEach(function (g) { CLOSED[g.id] = 1; }); saveClosed(); renderNav(); return; }
    var mb = e.target.closest('[data-mgroup]');
    if (mb) {
      var mg = mb.getAttribute('data-mgroup'); delete CLOSED[mg]; saveClosed(); renderNav();
      document.body.classList.add('nav-open'); e.stopPropagation();
      var t = $('[data-tg="' + mg + '"]'); if (t) setTimeout(function () { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
    }
  });

  /* ---------------- Trang module sắp có (theo lộ trình series) ---------------- */
  var SOON = {
    tdnhucau: { h: 'Biết cần tuyển ai, bao nhiêu người, trước ngày nào.', b: ['Gợi ý vị trí còn thiếu so với định biên của từng phòng ban', 'Ghi lý do tuyển: thay người nghỉ việc, mở rộng, thời vụ', 'Người phụ trách duyệt nhu cầu trước khi đăng tin'], now: ['dm', 'Định biên trong Danh mục'] },
    tdtin: { h: 'Soạn tin tuyển dụng một lần, dùng cho nhiều kênh.', b: ['Mẫu tin theo vị trí: mô tả công việc, yêu cầu, quyền lợi', 'Sao chép nhanh để đăng fanpage, nhóm, trang việc làm', 'Theo dõi tin đang mở và hạn nhận hồ sơ'] },
    tdungvien: { h: 'Mọi hồ sơ ứng viên ở một chỗ, biết ai đang ở bước nào.', b: ['Nhận hồ sơ và gắn với vị trí đang tuyển', 'Xếp lịch phỏng vấn, ghi đánh giá theo cùng một bộ tiêu chí', 'Theo dõi từng bước: mới nhận, phỏng vấn, đạt, chưa phù hợp'] },
    tdmoi: { h: 'Chốt người được nhận và chuyển thẳng thành nhân viên.', b: ['Thư mời nhận việc theo mẫu: vị trí, mức lương, ngày đi làm', 'Người nhận việc chuyển thành hồ sơ nhân sự, không phải nhập lại', 'Mở sẵn lộ trình Hội nhập cho người mới'], now: ['hoinhap', 'Hội nhập'] },
    tochuc: { h: 'Nhìn một lần biết ai thuộc phòng nào, ai phụ trách ai.', b: ['Vẽ sơ đồ từ danh mục phòng ban và danh sách nhân viên đã có, không phải nhập lại', 'Bấm vào một ô để xem người trong phòng và mở hồ sơ', 'Hiện định biên ngay trên sơ đồ để thấy phòng nào thiếu, phòng nào thừa'], now: ['dm', 'Danh mục phòng ban'], now2: ['nv', 'Danh sách nhân viên'] },
    hoso: { h: 'Giấy tờ của từng người ở một chỗ, biết ngay ai còn thiếu gì.', b: ['Danh sách giấy tờ cần có theo vị trí, đánh dấu đã nộp – còn thiếu', 'Lý lịch, bằng cấp, quá trình công tác trên cùng một trang', 'Nhân viên tự cập nhật thông tin trên điện thoại, người quản lý duyệt'], now: ['nv', 'Hồ sơ 7 mục trong trang Nhân viên'] },
    taikhoan: { h: 'Cấp tài khoản để nhân viên tự chấm công, xem công, gửi đơn trên điện thoại.', b: ['Tài khoản theo mã nhân viên và mã PIN, như bản thử chấm công Wi‑Fi', 'Khoá, mở, đặt lại PIN ngay tại đây', 'Thông tin nhân viên tự sửa chỉ được lưu sau khi người quản lý duyệt'], now: ['ccwifi', 'Bản thử chấm công Wi‑Fi'] },
    thietlapcc: { h: 'Đơn vị tự đặt ca làm và luật tính công của mình.', b: ['Ca làm, giờ vào – ra, thời gian nghỉ trưa', 'Mức đi muộn, về sớm được chấp nhận', 'Mạng Wi‑Fi văn phòng dùng để chấm công', 'Ngày nghỉ lễ, ngày làm bù trong năm'], now: ['caidat', 'Cách tính công trong Cài đặt'] },
    phieuluong: { h: 'Mỗi người nhận phiếu lương của mình trên điện thoại.', b: ['Phiếu lương từng người lấy từ bảng lương đã chốt', 'Gửi lên ứng dụng nhân viên, không phải in hay gửi từng email', 'Nhân viên hỏi lại một dòng trên phiếu, người quản lý trả lời tại chỗ'], now: ['bl', 'Bảng lương (xem và đối chiếu)'], note: 'Phần lương cần chị kế toán trưởng duyệt cách tính trước khi đưa ra dùng. Đơn vị vẫn phải rà lại kết quả, phần mềm không thay việc kiểm tra.' },
    congthuc: { h: 'Đơn vị tự đặt công thức lương, không gắn cứng.', b: ['Chọn các khoản thu nhập, phụ cấp, khấu trừ của đơn vị', 'Mức đóng BHXH, giảm trừ gia cảnh là cài đặt sửa được khi quy định thay đổi', 'Xem trước kết quả trên vài người trước khi áp cho cả tháng'], now: ['bl', 'Bảng lương (xem và đối chiếu)'], note: 'Lương, BHXH, thuế TNCN: đơn vị cần rà lại kết quả theo quy định hiện hành. Phần này chờ chị kế toán trưởng duyệt nghiệp vụ.' },
    tuyendung: { h: 'Theo dõi ứng viên từ lúc nhận hồ sơ đến ngày đi làm.', b: ['Danh sách vị trí đang tuyển', 'Ứng viên theo từng bước: nhận hồ sơ, phỏng vấn, mời làm', 'Người được nhận chuyển thẳng thành hồ sơ nhân viên'] },
    hoinhap: { h: 'Người mới có lộ trình ngày đầu, tuần đầu rõ ràng.', b: ['Danh sách việc cần làm khi nhận người mới', 'Check-in, check-out các mốc hội nhập', 'Người phụ trách thấy ai đang chậm mốc nào'] },
    daotao: { h: 'Ghi lại ai đã học gì, khoá nào sắp tới.', b: ['Lịch khoá học nội bộ', 'Danh sách người tham gia và kết quả', 'Lịch sử đào tạo hiện trong hồ sơ từng người'] },
    bhxh: { h: 'Theo dõi tăng – giảm lao động và mức đóng bảo hiểm.', b: ['Danh sách người tham gia và mức đóng', 'Nhắc khi có người vào, nghỉ, đổi lương cần báo tăng – giảm', 'Mức đóng là cài đặt sửa được, không gắn cứng'], note: 'Phần BHXH cần chị kế toán trưởng duyệt nghiệp vụ trước khi đưa ra dùng.' },
    appnv: { h: 'Ứng dụng riêng cho nhân viên, mở trên điện thoại.', b: ['Chấm công một chạm qua Wi‑Fi văn phòng, có QR dự phòng', 'Xem bảng công, gửi đơn nghỉ phép', 'Xem phiếu lương, cập nhật thông tin cá nhân'], now: ['ccwifi', 'Bản thử chấm công Wi‑Fi'] }
  };
  var PARTS = [[1, 'Lý do bắt đầu, hướng đi'], [2, 'Nhân sự, sơ đồ tổ chức, tài khoản, nhập dữ liệu, chấm công'], [3, 'Thiết lập chấm công, nghỉ phép'], [4, 'Hồ sơ nhân sự'], [5, 'Bảng lương, phiếu lương, công thức'], [6, 'Báo cáo, bảng điều hành'], [7, 'Hội nhập, BHXH, đào tạo, tuyển dụng']];
  function roadHtml(cur) { return '<div class="road">' + PARTS.map(function (p) { return '<div' + (p[0] === cur ? ' class="me"' : '') + '><b>Phần ' + p[0] + '</b><span>' + p[1] + '</span></div>'; }).join('') + '</div>'; }
  function pageSoon(id) {
    var m = modOf(id), x = SOON[id] || { h: '', b: [] };
    var now = x.now ? '<div class="card"><h3>Trong lúc chờ</h3><p>Phần đang dùng được có liên quan:</p><div class="link-row"><button class="btn btn-sm" data-go="' + x.now[0] + '">' + ic(x.now[0], 15) + x.now[1] + '</button>' + (x.now2 ? '<button class="btn btn-sm" data-go="' + x.now2[0] + '">' + ic(x.now2[0], 15) + x.now2[1] + '</button>' : '') + '</div></div>' : '';
    return '<div class="page-head"><div><h1>' + m.t + '</h1></div></div>' +
      '<div class="soon-wrap"><div class="card soon-main"><h2 style="margin-top:0">' + x.h + '</h2>' +
      '<ul class="soon-list">' + x.b.map(function (t) { return '<li>' + ic('check') + '<span>' + t + '</span></li>'; }).join('') + '</ul>' +
      (x.note ? '<div class="notice warn" style="margin-top:18px">' + ic('info') + '<div>' + x.note + '</div></div>' : '') +
      '<div class="link-row" style="margin-top:22px"><button class="btn btn-primary" data-act="feedback">Góp ý cho phần này</button></div></div>' +
      '<div class="soon-side">' + now + '<div class="card"><h3>Lộ trình xây dựng</h3>' + roadHtml(m.st) + '</div></div></div>';
  }
  // 08/11: bỏ trang Chấm công Wi‑Fi cũ (bản thử 0.2.1, có 'Lộ trình xây dựng', 'Khi ghép vào phần mềm') – trang mới ở chamcong.js

  /* ---------------- Tìm nhanh (Ctrl K) ---------------- */
  var cmdEl = null;
  function initials(n) { var w = String(n || '').trim().split(/\s+/); return ((w.length > 1 ? w[w.length - 2].charAt(0) : '') + (w[w.length - 1] || '').charAt(0)).toUpperCase(); }
  function openCmd() {
    if (cmdEl) return;
    cmdEl = document.createElement('div'); cmdEl.className = 'cmd-bg';
    cmdEl.innerHTML = '<div class="cmd" role="dialog" aria-modal="true" aria-label="Tìm nhanh"><div class="cmd-in"><img src="' + DOM_SRC + '" alt=""><input id="cmdQ" autocomplete="off" aria-label="Tìm nhân viên hoặc chức năng" placeholder="Gõ tên nhân viên, mã NV hoặc chức năng"></div><div class="cmd-list" id="cmdList"></div><div class="cmd-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> chọn</span><span><span class="kbd">Enter</span> mở</span><span><span class="kbd">Esc</span> đóng</span></div></div>';
    document.body.appendChild(cmdEl);
    var q = $('#cmdQ', cmdEl), list = $('#cmdList', cmdEl), items = [], sel = 0;
    var ACTIONS = [
      { t: 'Nạp file tháng mới', k: 'nap file thang moi nhap', icon: 'nhap', run: function () { go('nhap'); } },
      { t: 'Đổi ngày tính đến', k: 'ngay tham chieu tinh den', icon: 'np', run: openRefModal },
      { t: 'Đổi màu giao diện', k: 'doi mau giao dien xanh ngoc reu duong vang kem nen toi theme', icon: 'theme', run: function () { setTimeout(function () { openPalette(null); }, 30); } },
      { t: 'Đổi nền sáng / tối', k: 'giao dien sang toi theme', icon: 'theme', run: toggleTheme },
      { t: 'Hướng dẫn sử dụng', k: 'huong dan', icon: 'info', run: function () { ACTS.guide(); } }
    ];
    function draw() {
      var v = norm(q.value).trim(), html = '', out = [];
      var qw = v.split(/\s+/).filter(Boolean);
      function hit(t) { if (!qw.length) return true; var w = norm(t).split(/[\s\-·,()\/]+/); return qw.every(function (x) { return w.some(function (y) { return y.indexOf(x) === 0; }); }); }
      var mods = MODS.filter(function (m) { return hit(m.t + ' ' + m.k); });
      var acts = ACTIONS.filter(function (a) { return v && hit(a.t + ' ' + a.k); });
      var ppl = [];
      if (v && S.units.length) selUnits().forEach(function (u) { (u.data.NV || []).forEach(function (e) { if (ppl.length < 8 && hit((e['Họ và tên'] || e['Họ tên'] || '') + ' ' + e['Mã NV'] + ' ' + (e['Phòng ban'] || ''))) ppl.push({ u: u, e: e }); }); });
      if (ppl.length) { html += '<div class="cmd-g">Nhân viên</div>'; ppl.forEach(function (p) { var nm = p.e['Họ và tên'] || p.e['Họ tên'] || p.e['Mã NV']; out.push(function () { openProfile(p.u.id, p.e['Mã NV']); }); html += '<button class="cmd-it" data-i="' + (out.length - 1) + '"><span class="av">' + esc(initials(nm)) + '</span><span>' + esc(nm) + '</span><small>' + esc(p.e['Mã NV'] + (p.e['Phòng ban'] ? ' · ' + p.e['Phòng ban'] : '')) + '</small></button>'; }); }
      if (mods.length) { html += '<div class="cmd-g">Chức năng</div>'; mods.forEach(function (m) { out.push(function () { go(m.id); }); html += '<button class="cmd-it" data-i="' + (out.length - 1) + '">' + ic(m.id) + '<span>' + m.t + '</span><small>' + ((m.g ? GROUPS.filter(function (g) { return g.id === m.g; })[0].t : 'Module chính')) + '</small></button>'; }); }
      if (acts.length) { html += '<div class="cmd-g">Thao tác</div>'; acts.forEach(function (a) { out.push(a.run); html += '<button class="cmd-it" data-i="' + (out.length - 1) + '">' + ic(a.icon) + '<span>' + a.t + '</span></button>'; }); }
      if (v && !S.units.length) html += '<div class="cmd-empty" style="padding:12px">Chưa nạp dữ liệu nên chưa tìm được nhân viên.</div>';
      if (!out.length) html = '<div class="cmd-empty">Không thấy "' + esc(q.value) + '". Thử gõ tên không dấu hoặc mã NV.</div>';
      items = out; sel = 0; list.innerHTML = html; mark();
    }
    function mark() { $$('.cmd-it', list).forEach(function (b, i) { b.classList.toggle('on', i === sel); if (i === sel) b.scrollIntoView({ block: 'nearest' }); }); }
    function pick(i) { var f = items[i]; closeCmd(); if (f) f(); }
    q.addEventListener('input', draw);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
    });
    list.addEventListener('click', function (e) { var b = e.target.closest('.cmd-it'); if (b) pick(+b.getAttribute('data-i')); });
    list.addEventListener('mousemove', function (e) { var b = e.target.closest('.cmd-it'); if (b && +b.getAttribute('data-i') !== sel) { sel = +b.getAttribute('data-i'); mark(); } });
    cmdEl.addEventListener('click', function (e) { if (e.target === cmdEl) closeCmd(); });
    draw(); setTimeout(function () { q.focus(); }, 20);
  }
  function closeCmd() { if (cmdEl) { cmdEl.remove(); cmdEl = null; } }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (cmdEl) closeCmd(); else openCmd(); }
    else if (e.key === 'Escape' && cmdEl) closeCmd();
  });
  function isDarkNow() { var t = S.settings.theme; return t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  function toggleTheme() { S.settings.theme = isDarkNow() ? 'light' : 'dark'; applyTheme(); saveSettings(); refreshPal(); }

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.getAttribute('data-go')); document.body.classList.remove('nav-open'); }
  });
  $('#menuBtn').addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
  document.body.addEventListener('click', function (e) { if (document.body.classList.contains('nav-open') && !e.target.closest('#side') && !e.target.closest('#menuBtn')) document.body.classList.remove('nav-open'); });
  function go(p) { if (location.hash !== '#' + p) location.hash = p; else render(); }
  window.addEventListener('hashchange', render);

  /* ---------------- Thanh trên ---------------- */
  function renderTop() {
    var has = S.units.length > 0;
    $('#unitChip').hidden = !has;
    if (has) {
      var opts = (S.units.length > 1 ? '<option value="all">' + esc(groupLabel()) + '</option>' : '') +
        unitOrder().map(function (u) { return '<option value="' + u.id + '">' + (S.units.length > 1 ? '\u00a0\u00a0' : '') + esc(S.units.length > 1 ? shortUnit(u.name) : u.name) + '</option>'; }).join('');
      var sel = $('#unitSel'); sel.innerHTML = opts;
      sel.value = S.units.length > 1 ? S.settings.unit : S.units[0].id;
    }
    var pb = $('#pickBtn'), showPick = has && S.units.length > 1 && (S.settings.unit === 'all' || !S.units.some(function (u) { return u.id === S.settings.unit; }));
    pb.hidden = !showPick; if (showPick) $('#pickN').textContent = pickIds().length + '/' + S.units.length; if (!showPick) closePick();
    $('#refTxt').textContent = HR.vnDate(refDate()) + (S.settings.refMode === 'today' ? ' (hôm nay)' : '');
    var us = selUnits(), last = us.map(function (u) { return u.scannedAt; }).filter(Boolean).sort().pop();
    var tables = us.reduce(function (a, u) { return a + (u.report || []).filter(function (r) { return r.used; }).length; }, 0);
    var files = us.reduce(function (a, u) { var s = {}; (u.report || []).forEach(function (r) { s[r.path] = 1; }); return a + Object.keys(s).length; }, 0);
    $('#scanTxt').innerHTML = has ? (us.length && us.every(function (u) { return u.source === 'sample'; }) ? '<span class="tag tag-info">Dữ liệu mẫu</span> ' : '') + (S.units.length > 1 && S.settings.unit === 'all' ? '<b>' + esc(groupLabel()) + '</b> · ' + whoUnits(us) + ' · ' : '') + 'Đọc <b>' + tables + '</b> bảng từ <b>' + files + '</b> file' + (last ? ' · quét lúc ' + esc(last) : '') : '';
    $('#rescanBtn').hidden = !has || !us.some(function (u) { return u.source !== 'sample'; });
  }
  $('#unitSel').addEventListener('change', function () { S.settings.unit = this.value; saveSettings(); render(); if (this.value === 'all') openPick(); });
  /* Tổng các công ty: tích chọn công ty gộp dữ liệu */
  var pickEl = null;
  function closePick() { if (pickEl) { pickEl.remove(); pickEl = null; document.removeEventListener('mousedown', pickOut, true); } }
  function pickOut(e) { if (pickEl && !pickEl.contains(e.target) && !e.target.closest('#pickBtn')) closePick(); }
  function pickHtml() { var pk = pickIds(); return '<div class="pick-h"><b>Gộp dữ liệu các công ty</b><button type="button" class="pal-x" data-pk="x" aria-label="Đóng">×</button></div>' +
    S.units.map(function (u) { return '<label class="pick-r"><input type="checkbox" data-pk="' + u.id + '"' + (pk.indexOf(u.id) >= 0 ? ' checked' : '') + '><span>' + esc(shortUnit(u.name)) + '</span></label>'; }).join('') +
    '<div class="pick-f"><button type="button" class="btn btn-sm" data-pk="all">Chọn tất cả</button><span class="faint">Cần ít nhất 1 công ty</span></div>'; }
  function openPick() { if (S.units.length < 2) return; if (pickEl) { pickEl.innerHTML = pickHtml(); return; } var b = $('#pickBtn'); if (!b || b.hidden) return; pickEl = document.createElement('div'); pickEl.className = 'pick-pop'; pickEl.setAttribute('role', 'dialog'); pickEl.innerHTML = pickHtml(); document.body.appendChild(pickEl); var r = b.getBoundingClientRect(); pickEl.style.top = (r.bottom + 6) + 'px'; pickEl.style.left = Math.max(8, Math.min(r.left, innerWidth - pickEl.offsetWidth - 8)) + 'px'; document.addEventListener('mousedown', pickOut, true); }
  $('#pickBtn').addEventListener('click', function () { pickEl ? closePick() : openPick(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pk]'); if (!t || !pickEl || !pickEl.contains(t)) return; var k = t.getAttribute('data-pk');
    if (k === 'x') { closePick(); return; }
    if (k === 'all') S.settings.pick = null;
    else { var p = pickIds().slice(), i = p.indexOf(k); if (t.checked) { if (i < 0) p.push(k); } else if (i >= 0) { if (p.length === 1) { t.checked = true; toast('Cần giữ ít nhất 1 công ty', 'info'); return; } p.splice(i, 1); } S.settings.pick = p.length === S.units.length ? null : p; }
    saveSettings(); render(); if (pickEl) pickEl.innerHTML = pickHtml();
  });
  $('#refChip').addEventListener('click', openRefModal);
  $('#rescanBtn').addEventListener('click', function () { rescanUnits(selUnits().filter(function (u) { return u.source !== 'sample'; })); });

  /* ---------------- Đọc file Excel ---------------- */
  var busyEl = null;
  function busy(title) {
    if (!busyEl) { busyEl = document.createElement('div'); busyEl.className = 'busy'; busyEl.innerHTML = '<div class="busy-box"><b></b><div class="bar"><i></i></div><small></small></div>'; document.body.appendChild(busyEl); }
    $('b', busyEl).textContent = title; $('i', busyEl).style.width = '0'; $('small', busyEl).textContent = '';
    return {
      set: function (pct, msg) { $('i', busyEl).style.width = Math.max(0, Math.min(100, pct)) + '%'; if (msg !== undefined) $('small', busyEl).textContent = msg; },
      done: function () { if (busyEl) { busyEl.remove(); busyEl = null; } }
    };
  }
  function isExcelName(n) { return /\.(xlsx|xlsm|xls)$/i.test(n) && n.indexOf('~$') !== 0; }
  function titleCaseCompany(s) {
    var keep = { tnhh: 'TNHH', cp: 'CP', mtv: 'MTV', jsc: 'JSC', tm: 'TM', dv: 'DV', xnk: 'XNK', sx: 'SX', 'tm-dv': 'TM-DV' };
    var w = String(s).trim().toLowerCase().split(/\s+/);
    return w.map(function (x, i) { if (keep[x]) return keep[x]; if (i === 0 || i >= 3) return x.charAt(0).toUpperCase() + x.slice(1); return x; }).join(' ').replace(/^Công ty/, 'Công ty');
  }
  // entries: [{path, file: File | () => Promise<File>}]
  function readEntries(entries, title) {
    var b = busy(title || 'Đang đọc dữ liệu Excel…'), out = [], company = null, t0 = Date.now();
    entries = entries.filter(function (e) { return isExcelName(e.path.split('/').pop()); }).sort(function (a, b) { return a.path.localeCompare(b.path, 'vi'); });
    log('----- Bắt đầu quét ' + entries.length + ' file Excel -----');
    var i = 0;
    function next() {
      if (i >= entries.length) {
        b.done();
        var m = HR.mergeFiles(out, log);
        log('----- Quét xong sau ' + ((Date.now() - t0) / 1000).toFixed(1) + ' giây -----');
        m.company = company; return m;
      }
      var en = entries[i++];
      b.set(Math.round((i - 1) / entries.length * 100), en.path);
      return Promise.resolve(typeof en.file === 'function' ? en.file() : en.file).then(function (f) {
        return f.arrayBuffer().then(function (buf) {
          var wb = XR.open(new Uint8Array(buf), f.name), sheets = [];
          wb.sheetNames.forEach(function (sn) {
            try {
              var rows = wb.getRows(sn);
              if (!company && rows[0] && typeof rows[0][0] === 'string' && /c[ôo]ng ty|cty/i.test(rows[0][0])) company = titleCaseCompany(rows[0][0]);
              sheets.push(HR.parseSheet(rows, sn, f.name));
            } catch (e) { logErr('Đọc sheet "' + sn + '" của file ' + en.path, e); sheets.push({ sheet: sn, type: null, error: 'Không đọc được sheet này', rows: [], missing: [] }); }
          });
          out.push({ path: en.path, mtime: f.lastModified || 0, sheets: sheets });
        });
      }).catch(function (e) {
        logErr('Đọc file ' + en.path, e);
        var why = e && e.name === 'NotReadableError' ? 'File đang bị khóa (đang mở trong Excel?) hoặc không có quyền đọc' : e && e.friendly ? e.message : 'File hỏng hoặc không phải file Excel chuẩn';
        out.push({ path: en.path, error: why });
      }).then(function () { return sleep(0); }).then(next);
    }
    return next();
  }
  function walkHandle(dir, base) {
    var list = [];
    function rec(d, pre) {
      var it = d.values(), arr = [];
      function step() {
        return it.next().then(function (r) {
          if (r.done) return Promise.all(arr);
          var h = r.value, p = pre ? pre + '/' + h.name : h.name;
          if (h.kind === 'directory') arr.push(rec(h, p));
          else if (isExcelName(h.name)) list.push({ path: p, file: function () { return h.getFile(); } });
          return step();
        });
      }
      return step();
    }
    return rec(dir, '').then(function () { return list; });
  }
  function ensurePerm(h) {
    if (!h || !h.queryPermission) return Promise.resolve(false);
    return h.queryPermission({ mode: 'read' }).then(function (p) { return p === 'granted' ? true : h.requestPermission({ mode: 'read' }).then(function (q) { return q === 'granted'; }); });
  }

  /* ---------------- Thêm / quét đơn vị ---------------- */
  var pendingTarget = null; // id đơn vị đang chọn lại thư mục (null = thêm mới)
  function applyResult(m, src, target) {
    var u = target ? S.units.filter(function (x) { return x.id === target; })[0] : null;
    if (!u) {
      u = { id: uid(), name: m.company || src.folder || 'Đơn vị ' + (S.units.length + 1) };
      S.units.push(u);
    }
    u.source = src.source; u.folder = src.folder || ''; u.handle = src.handle || null;
    u.base = m.data; u.report = m.report; u.scannedAt = nowVn();
    if (u.ovr && Object.keys(u.ovr).some(function (t) { return Object.keys(u.ovr[t]).length; })) { u.data = JSON.parse(JSON.stringify(m.data)); rebuildUnit(u); log('Áp lại ' + ovrCount(u) + ' thay đổi làm trong phần mềm lên dữ liệu vừa đọc của ' + u.name); } else { u.data = JSON.parse(JSON.stringify(m.data)); u.ver = (u.ver || 0) + 1; }
    var used = m.report.filter(function (r) { return r.used; }).length;
    var nv = m.data.NV.length, cc = Object.keys(m.data.CC).length, bl = Object.keys(m.data.BL).length;
    log('TỔNG KẾT QUÉT "' + u.name + '": ' + HR.summary(m.data) + '; dùng ' + used + ' bảng; ' + m.report.filter(function (r) { return r.error; }).length + ' mục đọc lỗi');
    if (S.units.length === 1) S.settings.unit = u.id;
    saveUnits(); saveSettings();
    if (!nv) toast('Chưa thấy bảng Hồ sơ nhân viên', 'err', 'Đã đọc ' + used + ' bảng nhưng chưa có danh sách nhân viên (cần các cột Mã NV, Họ và tên, Ngày vào làm, Trạng thái). Xem chi tiết ở trang Nhập dữ liệu.');
    else toast('Đã đọc xong "' + u.name + '"', 'ok', nv + ' hồ sơ · ' + cc + ' tháng chấm công · ' + bl + ' tháng lương');
    return u;
  }
  function pickFolder(target) {
    pendingTarget = target || null;
    if (!CAN_PICK) { $('#fileDir').value = ''; $('#fileDir').click(); return; }
    window.showDirectoryPicker({ id: 'qlns', mode: 'read' }).then(function (h) {
      log('Người dùng chọn thư mục: ' + h.name);
      return walkHandle(h).then(function (list) {
        if (!list.length) { toast('Thư mục "' + h.name + '" không có file Excel nào', 'err', 'Hãy chọn thư mục chứa các file .xlsx dữ liệu nhân sự (có thể có thư mục con).'); return; }
        return readEntries(list, 'Đang đọc thư mục "' + h.name + '"…').then(function (m) { applyResult(m, { source: 'folder', folder: h.name, handle: h }, pendingTarget); go(curPage === 'start' ? 'dash' : curPage); render(); });
      });
    }).catch(function (e) { if (e && e.name === 'AbortError') return; showErr('Chưa đọc được thư mục', e); });
  }
  function filesFromInput(inp, kind) {
    var fl = Array.prototype.slice.call(inp.files || []);
    if (!fl.length) return;
    var folder = '';
    var list = fl.map(function (f) { var p = f.webkitRelativePath || f.name; if (!folder && f.webkitRelativePath) folder = f.webkitRelativePath.split('/')[0]; return { path: f.webkitRelativePath ? p.split('/').slice(1).join('/') : p, file: f }; });
    log('Người dùng chọn ' + (kind === 'dir' ? 'thư mục ' + folder : fl.length + ' file') + ' (cách chọn không ghi nhớ thư mục)');
    if (!list.filter(function (e) { return isExcelName(e.path); }).length) { toast('Không có file Excel nào trong lựa chọn', 'err', 'Hãy chọn thư mục/các file .xlsx dữ liệu nhân sự.'); return; }
    readEntries(list).then(function (m) { applyResult(m, { source: 'files', folder: folder || (fl.length + ' file đã chọn') }, pendingTarget); go('dash'); render(); })
      .catch(function (e) { showErr('Chưa đọc được dữ liệu', e); });
  }
  $('#fileDir').addEventListener('change', function () { filesFromInput(this, 'dir'); });
  $('#fileMulti').addEventListener('change', function () { filesFromInput(this, 'files'); });
  function pickFiles(target) { pendingTarget = target || null; $('#fileMulti').value = ''; $('#fileMulti').click(); }
  function rescanUnits(list) {
    if (!list.length) return;
    var chain = Promise.resolve();
    list.forEach(function (u) {
      chain = chain.then(function () {
        if (u.source === 'folder' && u.handle) {
          return ensurePerm(u.handle).then(function (ok) {
            if (!ok) { toast('Chưa được cấp quyền đọc thư mục "' + u.folder + '"', 'err', 'Bấm "Quét lại thư mục" và chọn "Cho phép" khi trình duyệt hỏi.'); return; }
            log('Quét lại thư mục "' + u.folder + '" của đơn vị ' + u.name);
            return walkHandle(u.handle).then(function (l) { return readEntries(l, 'Đang quét lại "' + u.name + '"…'); }).then(function (m) { applyResult(m, { source: 'folder', folder: u.folder, handle: u.handle }, u.id); });
          });
        }
        toast('Đơn vị "' + u.name + '" được nạp bằng cách chọn file', 'info', 'Trình duyệt không ghi nhớ được thư mục này. Hãy chọn lại thư mục để quét.');
        pickFolder(u.id);
      });
    });
    chain.then(render).catch(function (e) { showErr('Chưa quét lại được thư mục', e); });
  }
  function loadSample(target) {
    var b = busy('Đang nạp dữ liệu mẫu…');
    setTimeout(function () {
      try {
        var bin = atob(MAU_B64), u8 = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        var j = JSON.parse(fflate.strFromU8(fflate.gunzipSync(u8)));
        b.done();
        var list = j.units && j.units.length ? j.units : [{ name: j.name, folder: j.folder, data: j.data, report: j.report }];
        list.forEach(function (x) {
          log('Nạp dữ liệu mẫu ' + x.name + ' (đọc sẵn từ thư mục ' + x.folder + ')');
          var exist = S.units.filter(function (u) { return u.source === 'sample' && (u.folder === x.folder || (!u.folder && list.length === 1)); })[0];
          applyResult({ data: x.data, report: x.report, company: x.name }, { source: 'sample', folder: x.folder }, exist && exist.id);
          var nu = S.units.filter(function (u) { return u.source === 'sample' && u.folder === x.folder; })[0]; if (nu) { delete nu.role; nu.name = x.name; nu.sv = SAMPLE_V; }
        });
        if (list.length > 1) { S.settings.unit = 'all'; S.settings.pick = null; }
        try { S.units.forEach(function (u) { if (u.source === 'sample') bcSampleInit(u, SAMPLE_REF.slice(0, 7)); }); } catch (e) { logErr('Chốt công dữ liệu mẫu', e); }
        saveUnits(); saveSettings();
        try { if (KHO.ready) khoSeedSamples().then(function () { render(); }); } catch (e) { }
        if (S.settings.refMode === 'fixed' && (S.settings.refDate === '2026-10-31' || S.settings.refDate === SAMPLE_REF)) { // 07/11 17:42: anh chốt 'Tính đến' mặc định hôm nay, sang ngày mới tự nhảy
          S.settings.refMode = 'today'; saveSettings();
          toast('"Tính đến" đã về mặc định: hôm nay', 'info', 'Sang ngày mới số liệu tự tính đến ngày mới. Muốn xem đúng như lúc lập file mẫu thì bấm ô "Tính đến" → Dùng ngày chốt dữ liệu mẫu.');
        }
        go('dash'); render();
      } catch (e) { b.done(); showErr('Chưa nạp được dữ liệu mẫu', e); }
    }, 30);
  }
  // Kéo thả thư mục/file vào vùng nạp
  function bindDrop(el) {
    if (!el) return;
    ['dragenter', 'dragover'].forEach(function (t) { el.addEventListener(t, function (e) { e.preventDefault(); el.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (t) { el.addEventListener(t, function (e) { e.preventDefault(); el.classList.remove('drag'); }); });
    el.addEventListener('drop', function (e) {
      var items = Array.prototype.slice.call(e.dataTransfer.items || []);
      var first = items[0];
      if (first && first.getAsFileSystemHandle) {
        var hs = items.map(function (it) { return it.getAsFileSystemHandle(); });
        Promise.all(hs).then(function (handles) {
          var dirs = handles.filter(function (h) { return h && h.kind === 'directory'; });
          if (dirs.length === 1 && handles.length === 1) {
            var h = dirs[0];
            return walkHandle(h).then(function (l) { return readEntries(l, 'Đang đọc thư mục "' + h.name + '"…'); }).then(function (m) { applyResult(m, { source: 'folder', folder: h.name, handle: h }, null); go('dash'); render(); });
          }
          var list = [], pend = [];
          handles.forEach(function (h) {
            if (!h) return;
            if (h.kind === 'directory') pend.push(walkHandle(h).then(function (l) { l.forEach(function (x) { x.path = h.name + '/' + x.path; list.push(x); }); }));
            else list.push({ path: h.name, file: function () { return h.getFile(); } });
          });
          return Promise.all(pend).then(function () { return readEntries(list); }).then(function (m) { applyResult(m, { source: 'files', folder: list.length + ' file kéo thả' }, null); go('dash'); render(); });
        }).catch(function (er) { showErr('Chưa đọc được dữ liệu kéo thả', er); });
        return;
      }
      var files = Array.prototype.slice.call(e.dataTransfer.files || []).map(function (f) { return { path: f.name, file: f }; });
      if (files.length) readEntries(files).then(function (m) { applyResult(m, { source: 'files', folder: files.length + ' file kéo thả' }, null); go('dash'); render(); });
    });
  }

  /* ---------------- Trang bắt đầu ---------------- */
  function pageStart() {
    var h = '<div class="start">' +
      '<div class="card hero"><img class="dom-img" alt="Đốm"><div><h1>Mọi hồ sơ nhân sự ở một chỗ, việc cần xử lý hiện ngay</h1>' +
      '<p>Phần mềm đọc thẳng thư mục Excel nhân sự của đơn vị (hồ sơ, hợp đồng, chấm công, nghỉ phép, bảng lương), tự nối các file qua cột <b>Mã NV</b> và tổng hợp lên Bảng điều hành. File gốc chỉ được đọc, không bị sửa; mọi xử lý diễn ra ngay trên máy anh/chị.</p></div></div>' +
      '<div class="choices">' +
      '<button class="choice" data-act="pick-folder"' + '><span class="ic">' + ic('folder') + '</span><h3>Chọn thư mục dữ liệu</h3><p>Chọn thư mục chứa các file Excel nhân sự (có thể gồm nhiều thư mục con). ' + (CAN_PICK ? 'Lần sau mở lại chỉ cần bấm "Quét lại thư mục".' : 'Trình duyệt này không ghi nhớ được thư mục, mỗi lần quét lại phải chọn lại.') + '</p><span class="meta">' + (CAN_PICK ? 'Khuyên dùng · Chrome, Edge' : 'Dùng Chrome hoặc Edge để được ghi nhớ thư mục') + '</span></button>' +
      '<button class="choice" data-act="pick-files"><span class="ic">' + ic('files') + '</span><h3>Chọn các file Excel</h3><p>Chọn một hoặc nhiều file .xlsx. Phần mềm tự nhận ra file nào là hồ sơ, hợp đồng, chấm công… theo tên cột, không phụ thuộc tên file.</p><span class="meta">Mọi trình duyệt</span></button>' +
      '<button class="choice" data-act="sample"><span class="ic">' + ic('sample') + '</span><h3>Dùng dữ liệu mẫu</h3><p>Xem thử với dữ liệu hư cấu của Công ty TNHH Đốm Sáng – 2 công ty độc lập (Edu, Health): hồ sơ, hợp đồng, chấm công từ tháng 8/2026 đến hôm nay, công và lương tháng 8–10/2026 đã hoàn thành, đơn nghỉ.</p><span class="meta">Xóa được bất cứ lúc nào trong Cài đặt</span></button>' +
      '</div>' +
      '<div class="drop" id="dropZone">Hoặc kéo thả thư mục / các file Excel vào đây</div>' +
      '<div class="card card-pad"><div class="card-head"><div><h3>Thư mục dữ liệu nên có những gì?</h3><p>Không bắt buộc đúng tên file hay tên thư mục; phần mềm nhận diện theo tên cột, tự tìm dòng tiêu đề và bỏ dòng TỔNG CỘNG, chữ ký.</p></div></div>' +
      '<div class="how"><div><b>Hồ sơ</b>Danh sách nhân viên, danh mục phòng ban, chức vụ, ca, ký hiệu công</div><div><b>Hợp đồng</b>Sổ theo dõi hợp đồng, lịch sử điều chỉnh lương</div><div><b>Chấm công</b>Mỗi tháng 1 file, chi tiết từng ngày</div><div><b>Nghỉ phép</b>Đơn nghỉ, quỹ phép năm</div><div><b>Lương</b>Bảng lương, mỗi tháng 1 sheet hoặc 1 file</div></div></div>' +
      '</div>';
    return h;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (!a) return;
    var act = a.getAttribute('data-act'), id = a.getAttribute('data-id');
    if (act === 'pick-folder') pickFolder(id);
    else if (act === 'pick-files') pickFiles(id);
    else if (act === 'sample') loadSample();
    else if (act === 'rescan') rescanUnits(S.units.filter(function (u) { return u.id === id; }));
    else if (act === 'del-unit') delUnit(id);
    else if (act === 'reset-all') openResetModal();
    else if (act === 'dl-log') downloadLog();
    else if (act === 'clear-log') { LOG = []; log('Đã xóa nhật ký cũ theo yêu cầu người dùng'); render(); }
    else if (act === 'list') openList(a.getAttribute('data-list'));
    else if (act === 'add-unit') openAddUnit();
    else if (act === 'cmd') openCmd();
    else if (act === 'theme') toggleTheme();
    else if (act === 'palette') openPalette(a);
    else if (ACTS[act]) ACTS[act](a, id, e);
    else if (act === 'pay-table') { var t = $('#payTable'); if (t) { t.hidden = !t.hidden; a.textContent = t.hidden ? 'Xem dạng bảng' : 'Ẩn bảng'; } }
  });

  /* ---------------- Bảng điều hành (0.10.0 – bố cục mới, anh duyệt hướng 02/11/2026) ----------------
     Lời chào (không còn câu số liệu) · Đội ngũ dạng sơ đồ chỗ ngồi · 45 ngày tới dạng thước thời gian ·
     Quỹ lương đơn vị TRIỆU + một đồng lương chia về đâu · Nhịp đi làm dạng lịch ô màu · Việc cần xử lý gấp */
  var lastDash = null;
  var THU_VN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function fmtTr(n) { var v = (+n || 0) / 1e6; return v >= 1000 ? fmtInt(v) : v.toFixed(1).replace('.', ','); }
  function dowOf(iso) { return new Date(HR.dnum(iso) * 86400000).getUTCDay(); }
  function isoOfN(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
  // Lời chào theo buổi (anh duyệt 05/11/2026): sáng < 12h, chiều 12–18h, tối từ 18h (và trước 5h sáng). Mỗi buổi chọn ngẫu nhiên 1 câu, giữ nguyên trong lần mở phần mềm
  var WISH = {
    sang: ['Chúc anh/chị một ngày làm việc hiệu quả!', 'Ngày mới, năng lượng mới – chúc anh/chị làm việc thật suôn sẻ!', 'Một tách cà phê, một danh sách việc gọn gàng – mình bắt đầu thôi anh/chị!',
      'Việc cần nhắc đã có Đốm lo, anh/chị cứ tập trung vào việc quan trọng nhé!', 'Chúc anh/chị một buổi sáng nhẹ nhàng và nhiều niềm vui!'],
    chieu: ['Cảm ơn anh/chị đã nỗ lực, nhanh chóng hoàn thành công việc để trở về với gia đình nào!', 'Chỉ còn một chút nữa thôi, cố lên anh/chị nhé!', 'Buổi chiều rồi, anh/chị nhớ uống nước và cho mắt nghỉ vài phút nhé!',
      'Hoàn thành nốt vài việc còn lại rồi về sớm với gia đình anh/chị nhé!', 'Cảm ơn anh/chị vì một ngày làm việc tận tâm!'],
    toi: ['Anh/chị thật chăm chỉ, mau hoàn thành công việc và yêu thương bản thân nhé!', 'Muộn rồi, xong việc này anh/chị nghỉ ngơi sớm nhé!', 'Cảm ơn anh/chị đã cố gắng cả ngày – việc còn lại để mai Đốm nhắc tiếp!',
      'Làm việc buổi tối nhớ giữ sức khỏe, anh/chị nhé!', 'Một ngày dài đã qua, anh/chị dành chút thời gian cho bản thân nhé!']
  };
  var WISH_PICK = {};
  function buoi() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'sang' : h >= 12 && h < 18 ? 'chieu' : 'toi'; }
  function greet() { return { sang: 'Chào buổi sáng', chieu: 'Chào buổi chiều', toi: 'Chào buổi tối' }[buoi()]; }
  function wish() { var b = buoi(), L = WISH[b]; if (WISH_PICK[b] == null) WISH_PICK[b] = Math.floor(Math.random() * L.length); return L[WISH_PICK[b]]; }
  function givenName(n) { var p = String(n || '').trim().split(/\s+/); return p[p.length - 1] || '?'; }
  function pageDash() {
    var us = selUnits(), R = refDate();
    var d = lastDash = HR.dashboard(us.map(function (u) { return { name: u.name, data: ccData(u) }; }), { ref: R, month: S.settings.month, contractDays: cfg().contractDays });
    var h = heroHtml(us, R);
    if (!us.some(function (u) { return u.data.NV.length; })) h += '<div class="notice warn">' + ic('info') + '<div>Chưa có bảng Hồ sơ nhân viên nên các số liệu nhân sự đang trống. Xem trang <a href="#nhap" data-go="nhap">Nhập dữ liệu</a> để biết phần mềm đã đọc được những gì.</div></div><div style="height:14px"></div>';
    h += '<div class="db-grid">' + teamCard(d, us, R) + soonCard(d, us, R) + payCard(d, us) + rhythmCard(us, R) + '</div><div style="height:16px"></div>';
    h += urgentCard();
    return h;
  }
  function heroHtml(us, R) {
    var today = HR.isoToday(), who = us.length > 1 ? esc(groupLabel()) + ' · ' + whoUnits(us) : esc(us[0].name.replace(/\s*\(dữ liệu mẫu\)\s*$/, ''));
    return '<section class="db-hero"><div class="db-hero-txt">' +
      '<div class="db-hero-date"><span class="lamp" aria-hidden="true"></span>' + THU_VN[dowOf(today)] + ', ' + HR.vnDate(today) + '</div>' +
      '<h1>' + greet() + '!</h1><div class="db-wish">' + esc(wish()) + '</div>' +
      '<p>' + who + ' · số liệu tính đến ' + HR.vnDate(R) + (S.settings.refMode === 'today' ? ' (hôm nay)' : '') + '</p>' +
      '<div class="db-hero-act"><button type="button" class="db-pill" data-go="viec">Xem việc cần xử lý</button><button type="button" class="db-pill" data-go="nhap">Nạp file tháng mới</button><button type="button" class="db-pill" data-go="xuat">Xuất báo cáo</button></div>' +
      '</div><div class="db-dom" aria-hidden="true"><img src="' + DOM_HERO + '" alt=""></div></section>';
  }
  // ẢNH ĐẠI DIỆN – ưu tiên ảnh nhân sự tự đặt (cột "Ảnh đại diện"); dữ liệu mẫu dùng ảnh minh họa vẽ sẵn; còn lại dùng chữ cái đầu
  var AV_BG = ['#CFE8E4', '#F6E3C4', '#DCE4F5', '#E8DDF0', '#F3D9D3', '#DDEBD3', '#F1E6CF', '#D9E6EC', '#EADBD0'];
  var AV_SHIRT = ['#0E8A80', '#3E6FB0', '#B5651D', '#6B5B95', '#2F7D4F', '#C0475A', '#455A64', '#8D6E63', '#1F8A9C'];
  var AV_SKIN = ['#F3D2B8', '#EBC3A3', '#F5D9C4', '#E6B896'], AV_HAIR = ['#2B211C', '#3B2A20', '#1E1A18', '#4A3326'];
  function hashStr(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function sampleAvatar(e) {
    var h = hashStr(String(e['Mã NV']) + e['Họ và tên']), f = /nữ/i.test(e['Giới tính'] || ''), bg = AV_BG[h % 9], sh = AV_SHIRT[(h >>> 3) % 9], sk = AV_SKIN[(h >>> 6) % 4], hr = AV_HAIR[(h >>> 8) % 4], gl = (h >>> 10) % 4 === 0;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="' + bg + '"/>';
    if (f) s += '<path d="M15.5 31C15 15 49 15 48.5 31L50.5 53C44 57 20 57 13.5 53Z" fill="' + hr + '"/>';
    s += '<path d="M8 66C10 51 21 46.5 32 46.5S54 51 56 66Z" fill="' + sh + '"/><path d="M27 46.6h10L32 53Z" fill="#fff" opacity=".9"/>';
    s += '<rect x="28" y="37" width="8" height="11" rx="3.5" fill="' + sk + '"/><rect x="28" y="40" width="8" height="3" fill="#000" opacity=".06"/>';
    s += '<ellipse cx="32" cy="29" rx="11" ry="12.5" fill="' + sk + '"/>';
    s += f ? '<path d="M20.5 29C19.5 17.5 26 14 32 14C39.5 14 44.5 18 43.5 29C40.5 22 35 20.5 29.5 22C26 23 22.5 25.5 20.5 29Z" fill="' + hr + '"/>'
      : '<path d="M20.6 27.5C19.6 16.5 25.5 12.5 32 12.5C40 12.5 45 16.5 43.4 27.5C41.5 22.5 37.5 20.5 32 20.8C26.5 21 22.6 23.5 20.6 27.5Z" fill="' + hr + '"/>';
    s += '<circle cx="27.6" cy="30.2" r="1.5" fill="#2B2420"/><circle cx="36.4" cy="30.2" r="1.5" fill="#2B2420"/>';
    if (gl) s += '<g fill="none" stroke="#3A3A3A" stroke-width="1.1"><circle cx="27.6" cy="30.2" r="3.6"/><circle cx="36.4" cy="30.2" r="3.6"/><path d="M31.2 30.2h1.6"/></g>';
    if (f) s += '<circle cx="25" cy="34.2" r="1.9" fill="#F09A9A" opacity=".45"/><circle cx="39" cy="34.2" r="1.9" fill="#F09A9A" opacity=".45"/>';
    s += '<path d="M28.6 35.3Q32 38 35.4 35.3" stroke="#9A5A45" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function avatarOf(e, isSample) { var a = e['Ảnh đại diện']; if (a && /^(data:image|https?:)/.test(String(a))) return String(a); return isSample ? sampleAvatar(e) : null; }
  function shortName(n) { var p = String(n || '').trim().split(/\s+/); return p.length >= 3 ? p.slice(-2).join(' ') : p.join(' '); }
  // ĐỘI NGŨ – mỗi người 1 "chỗ ngồi" theo bộ phận; chỗ trống theo định biên; >48 người thì thu thành chấm nhỏ
  function teamCard(d, us, R) {
    var r = HR.dnum(R), multi = us.length > 1, prob = {}, isNew = {}, smp = {};
    us.forEach(function (u) { if (u.source === 'sample') smp[u.name] = 1; var by = HRR.contractsOf(u.data); Object.keys(by).forEach(function (id) { var c = HRR.currentContract(by[id], r); if (c && HRR.isProb(c['Loại hợp đồng']) && HRR.contractState(c, r) === 'Đang hiệu lực') prob[u.name + '|' + id] = 1; }); });
    d.moves.joined.forEach(function (x) { isNew[x.unit + '|' + x.e['Mã NV']] = 1; });
    var key = function (p) { return p.unit + '|' + p.e['Mã NV']; };
    var dots = d.staff.active > 48, nProb = d.people.filter(function (p) { return prob[key(p)]; }).length;
    function seat(p, left) {
      var e = p.e, k = key(p), c = left ? 'left' : (p.state === 'maternity' ? 'mat' : '') + (prob[k] ? ' prob' : '');
      var tip = e['Họ và tên'] + ' · ' + (e['Chức danh công việc'] || e['Chức vụ'] || '') + (p.state === 'maternity' && !left ? ' · nghỉ thai sản' : '') + (prob[k] ? ' · đang thử việc' : '') + (isNew[k] ? ' · mới vào tháng này' : '') + (left ? ' · đã nghỉ việc ' + HR.vnDate(e['Ngày nghỉ việc']) : '');
      var src = avatarOf(e, smp[p.unit]), g = givenName(e['Họ và tên']);
      return '<span class="seat ' + c + (dots ? ' dot' : '') + '" title="' + esc(tip) + '"><i>' + (src && !dots ? '<img src="' + src + '" alt="">' : esc(g.charAt(0).toUpperCase())) + '</i>' + (isNew[k] && !left ? '<em class="nw">Mới</em>' : '') + '<b>' + esc(shortName(e['Họ và tên'])) + '</b></span>';
    }
    var prevU = null;
    var rows = d.depts.map(function (x, di) {
      var ps = d.people.filter(function (p) { return p.unit === x.unit && (p.e['Phòng ban'] || '(Chưa ghi phòng ban)') === x.name; });
      var lf = d.moves.left.filter(function (p) { return p.unit === x.unit && p.e['Phòng ban'] === x.name; });
      var empty = x.plan !== null ? Math.max(0, x.plan - ps.length) : 0, over = x.plan !== null && ps.length > x.plan;
      if (!ps.length && !lf.length && !empty) return '';
      var uh = '';
      if (multi && x.unit !== prevU) { prevU = x.unit; var nU = d.people.filter(function (p) { return p.unit === x.unit; }).length; uh = '<div class="db-unit-h"><b>' + esc(shortUnit(x.unit)) + '</b><span class="n">' + nU + ' người</span></div>'; }
      var s = ps.map(function (p) { return seat(p); }).join('') + lf.map(function (p) { return seat(p, true); }).join('');
      if (!dots) for (var i = 0; i < Math.min(empty, 12); i++) s += '<span class="seat vac" title="Còn trống theo định biên"><i>+</i><b>Trống</b></span>';
      return uh + '<div class="db-dept"><div class="db-dept-n">' + esc(shortDept(x.name)) + '<small' + (over ? ' class="over"' : '') + '>' + ps.length + (x.plan !== null ? ' / ' + x.plan + ' định biên' : ' người') + '</small></div><div class="db-seats" data-dk="' + esc(x.unit + '|' + x.name) + '">' + s + '</div></div>';
    }).join('');
    var mv = d.moves;
    return '<div class="card card-pad db-team"><div class="card-head"><div><h3>Đội ngũ</h3><p>Xếp theo bộ phận · rê chuột vào ảnh để xem họ tên, chức danh</p></div><button type="button" class="btn btn-sm" data-act="list" data-list="staff">Danh sách</button></div>' +
      '<div class="db-total"><button type="button" class="big num" data-act="list" data-list="staff">' + d.staff.active + '</button><span class="lab">người đang làm</span>' +
      '<span class="db-chips"><span class="db-chip"><b>' + d.staff.working + '</b> đang đi làm</span>' + (d.staff.maternity ? '<span class="db-chip mat"><b>' + d.staff.maternity + '</b> nghỉ thai sản</span>' : '') + (nProb ? '<span class="db-chip prob"><b>' + nProb + '</b> thử việc</span>' : '') +
      '<span class="db-chip">Tháng ' + HR.ymLabel(mv.month) + ': <b class="up">+' + mv.joined.length + '</b> · <b class="' + (mv.left.length ? 'down' : '') + '">−' + mv.left.length + '</b></span></span></div>' +
      (rows || '<p class="muted">Chưa có dữ liệu nhân viên.</p>') +
      (dots ? '' : '<div class="db-leg"><span><i class="seat-lg"></i>Đang đi làm</span><span><i class="seat-lg mat"></i>Nghỉ thai sản</span><span><i class="seat-lg prob"></i>Thử việc</span><span><i class="seat-lg new"></i>Mới vào</span><span><i class="seat-lg left"></i>Đã nghỉ trong tháng</span><span><i class="seat-lg vac"></i>Chỗ trống theo định biên</span></div>') + '</div>';
  }
  // SỰ KIỆN / CÔNG VIỆC CẦN CHÚ Ý – chọn 7 / 30 / 45 ngày; ô đếm theo loại (bấm để lọc) + danh sách nhóm theo mốc thời gian, mỗi mốc là 1 tờ lịch
  var EV_FILTER = null;
  var EV_T = { over: 'Quá hạn', hd: 'Hợp đồng', don: 'Đơn nghỉ', ts: 'Thai sản', sn: 'Sinh nhật' };
  function evIcon(k) {
    var p = { over: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2v.1"/>', hd: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
      don: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M10 13.5l4 4M14 13.5l-4 4"/>', ts: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
      sn: '<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1"/>' };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p[k] + '</svg>';
  }
  function soonCard(d, us, R) {
    var r = HR.dnum(R), W = [7, 30, 45].indexOf(+S.settings.evDays) >= 0 ? +S.settings.evDays : 30, ev = [], mu = us.length > 1, wu = function (n, un) { return n + (mu && un ? ' · ' + shortUnit(un) : ''); };
    d.contracts.overdue.concat(d.contracts.soon).forEach(function (x) {
      var tv = HRR.isProb(x.h['Loại hợp đồng']);
      ev.push({ days: x.days, k: 'hd', t: x.days < 0 ? 'HĐ đã hết hạn, chưa ký mới' : tv ? 'Hết hạn thử việc' : 'Hết hạn hợp đồng', who: wu(x.e['Họ và tên'], x.unit), go: 'hd' });
    });
    d.leaves.pending.forEach(function (x) { if (x.days === null) return; ev.push({ days: x.days, k: 'don', t: (x.days < 0 ? 'Đơn nghỉ chưa duyệt, đã qua ngày nghỉ' : 'Duyệt đơn nghỉ · ' + (x.x['Số ngày'] || '?') + ' ngày'), who: wu(x.x['Họ và tên'], x.unit), go: 'np' }); });
    us.forEach(function (u) {
      u.data.DON.forEach(function (x) {
        if (x['Loại nghỉ'] !== 'Nghỉ thai sản' || x['Trạng thái'] !== 'Đã duyệt' || !x['Đến ngày']) return;
        var dd = HR.dnum(x['Đến ngày']) + 1 - r;
        if (dd >= 0 && dd <= 45) ev.push({ days: dd, k: 'ts', t: 'Đi làm lại sau thai sản', who: wu(x['Họ và tên'], u.name), go: 'np' });
      });
    });
    d.people.forEach(function (p) {
      var b = p.e['Ngày sinh']; if (!b) return;
      var y = +R.slice(0, 4), t = HR.dnum(y + String(b).slice(4)); if (t === null) return; if (t < r) t = HR.dnum((y + 1) + String(b).slice(4));
      if (t !== null && t - r <= 45) ev.push({ days: t - r, k: 'sn', t: 'Sinh nhật', who: wu(p.e['Họ và tên'], p.unit), go: 'nv' });
    });
    ev = ev.filter(function (e) { return e.days <= W; }).sort(function (a, b) { return a.days - b.days; });
    var cnt = { over: 0, hd: 0, don: 0, ts: 0, sn: 0 };
    ev.forEach(function (e) { if (e.days < 0) cnt.over++; else cnt[e.k]++; });
    var tiles = ['over', 'hd', 'don', 'ts', 'sn'].map(function (k) {
      return '<button type="button" class="ev-tile k-' + k + (EV_FILTER === k ? ' on' : '') + (cnt[k] ? '' : ' zero') + '" data-evk="' + k + '"><span class="ev-ic">' + evIcon(k) + '</span><b class="num">' + cnt[k] + '</b><span>' + EV_T[k] + '</span></button>';
    }).join('');
    var list = ev.filter(function (e) { return !EV_FILTER || (EV_FILTER === 'over' ? e.days < 0 : e.days >= 0 && e.k === EV_FILTER); });
    var groups = [{ t: 'Quá hạn', f: function (x) { return x < 0; } }, { t: 'Trong 7 ngày', f: function (x) { return x >= 0 && x <= 7; } }, { t: '8 – 30 ngày', f: function (x) { return x > 7 && x <= 30; } }, { t: '31 – 45 ngày', f: function (x) { return x > 30; } }];
    var shown = 0, MAX = 7, body = groups.map(function (g) {
      var it = list.filter(function (e) { return g.f(e.days); }); if (!it.length) return '';
      var rows = it.map(function (e) {
        if (shown >= MAX) return ''; shown++;
        var iso = isoOfN(r + e.days), kk = e.days < 0 ? 'over' : e.k;
        return '<button type="button" class="ev-row" data-go="' + e.go + '"><span class="ev-cal k-' + kk + '"><small>Th' + (+iso.slice(5, 7)) + '</small><b>' + (+iso.slice(8, 10)) + '</b></span>' +
          '<span class="ev-t"><b>' + esc(e.t) + '</b><span>' + esc(e.who) + '</span></span><span class="ev-d' + (e.days < 0 ? ' bad' : e.days <= 3 ? ' warn' : '') + '">' + (e.days < 0 ? 'Quá ' + (-e.days) + ' ngày' : e.days === 0 ? 'Hôm nay' : 'Còn ' + e.days + ' ngày') + '</span></button>';
      }).join('');
      return rows ? '<div class="ev-g"><div class="ev-gh">' + g.t + '<span>' + it.length + '</span></div>' + rows + '</div>' : '';
    }).join('');
    var more = list.length - shown;
    return '<div class="card card-pad db-soon"><div class="card-head"><div><h3>Sự kiện / Công việc cần chú ý</h3><p>Tính từ ' + HR.vnDate(R) + (EV_FILTER ? ' · đang lọc: ' + EV_T[EV_FILTER] + ' (bấm lại để bỏ lọc)' : ' · bấm ô để lọc') + '</p></div>' +
      '<select id="evDays" class="input input-sm" aria-label="Khoảng thời gian">' + [7, 30, 45].map(function (n) { return '<option value="' + n + '"' + (n === W ? ' selected' : '') + '>' + (n < 10 ? '0' + n : n) + ' ngày tới</option>'; }).join('') + '</select></div>' +
      '<div class="ev-tiles">' + tiles + '</div>' +
      (body || '<p class="muted" style="margin-top:14px">Không có sự kiện nào trong ' + W + ' ngày tới.</p>') +
      (more > 0 ? '<button type="button" class="link-more" data-go="viec">+ ' + more + ' mục khác → Việc cần xử lý</button>' : '') + '</div>';
  }
  // QUỸ LƯƠNG – tổng chi phí nhân sự (triệu) = lương + phụ cấp + thưởng KPI + bảo hiểm công ty đóng
  function costOf(us, ym) {
    var n = function (v) { return +v || 0; }, rate = (cfg().bhCoRate != null ? +cfg().bhCoRate : 21.5) / 100, o = { luong: 0, pc: 0, kpi: 0, bh: 0, gross: 0, people: 0 };
    us.forEach(function (u) { (u.data.BL[ym] || []).forEach(function (x) {
      var lcb = n(x['Lương cơ bản']), pcv = n(x['Phụ cấp chức vụ']), ltg = n(x['Lương thời gian']), part = lcb + pcv ? ltg * pcv / (lcb + pcv) : 0;
      var pc = part + n(x['Phụ cấp làm đêm']) + n(x['Tiền ăn ca']) + n(x['Phụ cấp xăng xe']) + n(x['Phụ cấp điện thoại']) + n(x['Phụ cấp chuyên cần']);
      var kpi = n(x['Thưởng KPI']), g = n(x['Tổng thu nhập']);
      o.pc += pc; o.kpi += kpi; o.luong += g - pc - kpi; o.gross += g; o.bh += n(x['Lương đóng BH']) * rate; o.people++;
    }); });
    o.total = o.gross + o.bh; return o;
  }
  function payCard(d, us) {
    var ms = d.months;
    if (!ms.length) return '<div class="card card-pad db-pay"><div class="card-head"><div><h3>Quỹ lương</h3><p>Chưa có bảng lương nào.</p></div></div></div>';
    var ym = d.month, c = costOf(us, ym), pi = ms.map(function (m) { return m.ym; }).indexOf(ym), pv = pi > 0 ? costOf(us, ms[pi - 1].ym) : null;
    var rate = cfg().bhCoRate != null ? +cfg().bhCoRate : 21.5;
    var seg = [{ c: 'var(--s1)', t: 'Lương (ngày công, tăng ca)', v: c.luong }, { c: 'var(--s2)', t: 'Phụ cấp', v: c.pc }, { c: '#8E6BBF', t: 'Thưởng KPI', v: c.kpi }, { c: 'var(--info)', t: 'Bảo hiểm (công ty đóng)', v: c.bh }].filter(function (x) { return x.v > 0; });
    var G = c.total || 1, opts = ms.map(function (m) { return '<option value="' + m.ym + '"' + (m.ym === ym ? ' selected' : '') + '>' + HR.ymLabel(m.ym) + '</option>'; }).join('');
    var all = ms.slice(-8).map(function (m) { return { ym: m.ym, v: costOf(us, m.ym).total }; }), max = 0; all.forEach(function (x) { max = Math.max(max, x.v); });
    var cols = all.map(function (m) { return '<button type="button" class="db-m' + (m.ym === ym ? ' on' : '') + '" data-pay-m="' + m.ym + '" title="Tháng ' + HR.ymLabel(m.ym) + ': ' + fmtInt(m.v) + ' đ"><em>' + fmtTr(m.v) + '</em><i style="height:' + Math.max(6, m.v / (max || 1) * 46) + 'px"></i><span>' + HR.ymLabel(m.ym).slice(0, 2) + '/' + m.ym.slice(2, 4) + '</span></button>'; }).join('');
    return '<div class="card card-pad db-pay"><div class="card-head"><div><h3>Quỹ lương</h3><p>Đơn vị: triệu đồng · chi phí nhân sự của công ty</p></div><select id="monthSel" class="input input-sm" aria-label="Chọn tháng lương">' + opts + '</select></div>' +
      '<div class="db-money"><span class="big num">' + fmtTr(c.total) + '</span><span class="u">triệu</span>' + (pv && pv.total ? '<span class="chg ' + (c.total >= pv.total ? 'up' : 'down') + '">' + fmtPct((c.total - pv.total) / pv.total * 100) + ' so với tháng trước</span>' : '') + '</div>' +
      '<div class="db-money-sub">Tổng chi phí nhân sự tháng ' + HR.ymLabel(ym) + ' · ' + c.people + ' người · bình quân ' + fmtTr(c.total / (c.people || 1)) + ' triệu/người</div>' +
      '<div class="db-split-h">Cơ cấu chi phí</div><div class="db-split">' + seg.map(function (x) { return '<i style="width:' + (x.v / G * 100) + '%;background:' + x.c + '" title="' + esc(x.t) + ': ' + fmtInt(x.v) + ' đ"></i>'; }).join('') + '</div>' +
      '<div class="db-split-leg">' + seg.map(function (x) { return '<span><i style="background:' + x.c + '"></i>' + esc(x.t) + '<b class="num">' + fmtTr(x.v) + '</b><em>' + (x.v / G * 100).toFixed(0) + '%</em></span>'; }).join('') + '</div>' +
      (us.length > 1 ? '<div class="db-split-h">Theo công ty</div><div class="db-units">' + (function () { var L = us.map(function (u) { return { u: u, c: costOf([u], ym) }; }), mx = 0; L.forEach(function (x) { mx = Math.max(mx, x.c.total); }); return L.map(function (x) { return '<div class="db-u"><span class="nm">' + esc(shortUnit(x.u.name)) + '<small>' + x.c.people + ' người</small></span><span class="bar"><i style="width:' + (mx ? x.c.total / mx * 100 : 0) + '%"></i></span><b class="num">' + fmtTr(x.c.total) + '</b><em>' + (c.total ? (x.c.total / c.total * 100).toFixed(0) : 0) + '%</em></div>'; }).join(''); })() + '</div>' : '') +
      '<p class="db-note">Bảo hiểm công ty đóng tạm tính ' + String(rate).replace('.', ',') + '% × lương đóng bảo hiểm – tỷ lệ sẽ chỉnh được trong Thiết lập công thức lương.</p>' +
      '<div class="db-months">' + cols + '</div></div>';
  }
  // NHỊP ĐI LÀM – lịch tháng: loại ngày (đi làm, nghỉ lễ, teambuilding, cuối tuần) + ký hiệu trong ô (đi muộn, tăng ca, sinh nhật, nghỉ phép)
  function dayIcon(k) {
    var p = { late: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>', ot: '<path d="M13 3 6 13.5h5L10 21l7-10.5h-5z"/>',
      sn: '<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1"/>', leave: '<path d="M3.5 12a8.5 8.5 0 0 1 17 0Z"/><path d="M12 12v6.5a2 2 0 0 0 4 0"/>' };
    return '<svg class="di di-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + p[k] + '</svg>';
  }
  function rhythmCard(us, R) {
    var months = {}; us.forEach(function (u) { Object.keys(ccData(u).CC).forEach(function (m) { if (m <= R.slice(0, 7)) months[m] = 1; }); });
    var ml = Object.keys(months).sort(), ym = ml[ml.length - 1];
    if (!ym) return '<div class="card card-pad db-rhythm"><div class="card-head"><div><h3>Lịch đi làm</h3><p>Chưa có bảng chấm công.</p></div></div></div>';
    var W = HRR.codes(cfg().workCodes), LV = HRR.codes(cfg().leaveCodes), day = {}, late = 0, pres = 0, ot = 0, off = 0;
    var push = function (a, v) { if (a.indexOf(v) < 0) a.push(v); };
    us.forEach(function (u) { (ccData(u).CC[ym] || []).forEach(function (x) {
      var dd = String(x['Ngày'] || '').slice(0, 10); if (!dd) return;
      var k = String(x['Ký hiệu'] || '').toUpperCase(), nm = shortName(x['Họ và tên']), o = day[dd] = day[dd] || { work: 0, hol: 0, tb: 0, late: [], ot: [], leave: [], sn: [] };
      if (k === 'L') { o.hol++; return; } if (k === 'TS') return;
      if (k === 'TB') o.tb++;
      if (W[k]) { o.work++; pres++; } else if (LV[k] || k === 'KP') { off++; push(o.leave, nm + ' (' + k + ')'); }
      if (+x['Đi muộn (phút)'] > 0) { push(o.late, nm + ' ' + x['Đi muộn (phút)'] + ' phút'); late++; }
      if (+x['Giờ tăng ca'] > 0) { push(o.ot, nm + ' ' + String(x['Giờ tăng ca']).replace('.', ',') + 'h'); ot += +x['Giờ tăng ca']; }
    }); });
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7), nd = new Date(Date.UTC(y, m, 0)).getUTCDate(), first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    var bd = {}; var dash0 = HR.dashboard(us.map(function (u) { return { name: u.name, data: ccData(u) }; }), { ref: HRR.lastDayOf(ym), contractDays: 45 });
    dash0.people.forEach(function (p) { var b = p.e['Ngày sinh']; if (b && +String(b).slice(5, 7) === m) (bd[ym + String(b).slice(7, 10)] = bd[ym + String(b).slice(7, 10)] || []).push(shortName(p.e['Họ và tên'])); });
    var c = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (t) { return '<span class="hd">' + t + '</span>'; }).join('');
    for (var i = 0; i < first; i++) c += '<span class="c blank"></span>';
    for (var dn = 1; dn <= nd; dn++) {
      var iso = ym + '-' + (dn < 10 ? '0' : '') + dn, o = day[iso], dw = (first + dn - 1) % 7, cls = 'c', lab = '', tip = [THU_VN[(dw + 1) % 7] + ' ' + HR.vnDate(iso)], ics = '';
      if (o && o.tb && o.tb >= o.work / 2) { cls += ' team'; lab = 'Team'; tip.push('Teambuilding'); }
      else if (o && o.hol && !o.work) { cls += ' hol'; lab = 'Lễ'; tip.push('Nghỉ lễ'); }
      else if (o && (o.work || o.leave.length)) { cls += ' work' + (dw >= 5 ? ' wkx' : ''); if (dw >= 5) tip.push('Làm ngày cuối tuần'); tip.push(o.work + ' người đi làm'); }
      else { cls += dw >= 5 ? ' off' : ' none'; tip.push(dw >= 5 ? 'Nghỉ cuối tuần' : 'Không có dữ liệu chấm công'); }
      if (o && o.late.length) { ics += dayIcon('late'); tip.push('Đi muộn: ' + o.late.join(', ')); }
      if (o && o.ot.length) { ics += dayIcon('ot'); tip.push('Tăng ca: ' + o.ot.join(', ')); }
      if (bd[iso]) { ics += dayIcon('sn'); tip.push('Sinh nhật: ' + bd[iso].join(', ')); }
      if (o && o.leave.length) { ics += dayIcon('leave'); tip.push('Nghỉ: ' + o.leave.join(', ')); }
      c += '<span class="' + cls + '" title="' + esc(tip.join('\n')) + '"><em>' + dn + '</em>' + (lab ? '<small>' + lab + '</small>' : '') + (ics ? '<span class="ics">' + ics + '</span>' : '') + '</span>';
    }
    var ontime = pres ? Math.round((pres - late) / pres * 1000) / 10 : 0;
    return '<div class="card card-pad db-rhythm"><div class="card-head"><div><h3>Lịch đi làm tháng ' + HR.ymLabel(ym) + '</h3><p>Rê chuột vào từng ngày để xem ai đi muộn, tăng ca, nghỉ phép, sinh nhật</p></div><button type="button" class="btn btn-sm" data-go="cc">Tổng hợp công</button></div>' +
      '<div class="db-rh"><div><div class="db-cal">' + c + '</div>' +
      '<div class="db-scale"><span class="lg"><span class="sw-c work"></span>Ngày đi làm</span><span class="lg"><span class="sw-c hol"></span>Nghỉ lễ</span><span class="lg"><span class="sw-c team"></span>Teambuilding</span><span class="lg"><span class="sw-c off"></span>Cuối tuần</span></div>' +
      '<div class="db-scale"><span class="lg">' + dayIcon('late') + 'Có đi muộn</span><span class="lg">' + dayIcon('ot') + 'Có tăng ca</span><span class="lg">' + dayIcon('sn') + 'Có sinh nhật</span><span class="lg">' + dayIcon('leave') + 'Có nghỉ phép</span></div></div>' +
      '<div class="db-st"><div><b class="num">' + String(ontime).replace('.', ',') + '%</b><span>lượt đi làm đúng giờ</span></div><div><b class="num">' + late + '</b><span>lượt đi muộn</span></div><div><b class="num">' + String(Math.round(ot * 10) / 10).replace('.', ',') + '</b><span>giờ tăng ca</span></div><div><b class="num">' + off + '</b><span>ngày nghỉ (phép, ốm, không lương)</span></div></div></div></div>';
  }
  // Co giãn khối Đội ngũ (anh chốt 05/11/2026): ít người giữ cỡ ảnh thường; có phòng vượt 2 dòng → cả khối thu gọn;
  // thu gọn rồi vẫn vượt 2 dòng → phòng đó chỉ hiện 2 dòng, ô cuối là "+n" (bấm để mở hết, có nút Thu gọn)
  var TEAM_OPEN = {};
  function fitTeam() {
    var card = $('.db-team'); if (!card || card.querySelector('.seat.dot')) return;
    var boxes = $$('.db-seats', card);
    card.classList.remove('compact');
    boxes.forEach(function (b) { $$('.seat', b).forEach(function (x) { x.classList.remove('hid'); }); $$('.seat-more', b).forEach(function (x) { x.remove(); }); });
    var rowsOf = function (b) { var t = {}; [].forEach.call(b.children, function (c) { if (!c.classList.contains('hid')) t[c.offsetTop] = 1; }); return Object.keys(t).length; };
    if (!boxes.some(function (b) { return rowsOf(b) > 2; })) return;
    card.classList.add('compact');
    boxes.forEach(function (b) {
      if (rowsOf(b) <= 2) return;
      var k = b.getAttribute('data-dk'), all = $$('.seat', b), top0 = all[0].offsetTop;
      var cap = all.filter(function (x) { return x.offsetTop === top0; }).length, max = cap * 2;
      var ppl = all.filter(function (x) { return !x.classList.contains('vac'); }), vac = all.filter(function (x) { return x.classList.contains('vac'); });
      var btn = function (txt, sub, fn) { var e = document.createElement('button'); e.type = 'button'; e.className = 'seat seat-more'; e.innerHTML = '<i>' + txt + '</i><b>' + sub + '</b>'; e.addEventListener('click', fn); b.appendChild(e); };
      if (TEAM_OPEN[k]) { btn('–', 'Thu gọn', function () { TEAM_OPEN[k] = 0; fitTeam(); }); return; }
      if (ppl.length <= max) { vac.slice(max - ppl.length).forEach(function (x) { x.classList.add('hid'); }); return; }
      var show = max - 1, n = ppl.length - show;
      ppl.slice(show).forEach(function (x) { x.classList.add('hid'); }); vac.forEach(function (x) { x.classList.add('hid'); });
      btn('+' + n, 'Xem thêm', function () { TEAM_OPEN[k] = 1; fitTeam(); });
    });
  }
  window.__fitTeam = fitTeam;
  var fitT = null; window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fitTeam, 120); });
  function bindDash() {
    fitTeam();
    var ms = $('#monthSel'); if (ms) ms.addEventListener('change', function () { S.settings.month = this.value; saveSettings(); render(); });
    var ed = $('#evDays'); if (ed) ed.addEventListener('change', function () { S.settings.evDays = +this.value; saveSettings(); render(); });
    $$('[data-evk]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-evk'); EV_FILTER = EV_FILTER === k ? null : k; render(); }); });
    $$('[data-pay-m]').forEach(function (b) { b.addEventListener('click', function () { S.settings.month = b.getAttribute('data-pay-m'); saveSettings(); render(); }); });
  }
  function shortDept(n) { return String(n || '').replace(/^Phòng\s+/, ''); }

  /* ---------------- Danh sách khi bấm vào ô số ---------------- */
  function openList(kind) {
    var d = lastDash; if (!d) return;
    var multi = selUnits().length > 1, title, sub, cols, rows;
    var U = multi ? [{ t: 'Đơn vị', f: function (r) { return r.unit; } }] : [];
    if (kind === 'staff') {
      title = 'Nhân viên đang làm'; sub = d.staff.active + ' người tính đến ' + HR.vnDate(d.ref);
      cols = U.concat([{ t: 'Mã NV', f: function (r) { return r.e['Mã NV']; }, m: 1 }, { t: 'Họ và tên', f: function (r) { return r.e['Họ và tên']; } }, { t: 'Phòng ban', f: function (r) { return r.e['Phòng ban']; } },
        { t: 'Chức danh', f: function (r) { return r.e['Chức danh công việc'] || r.e['Chức vụ']; } }, { t: 'Ngày vào làm', f: function (r) { return HR.vnDate(r.e['Ngày vào làm']); } },
        { t: 'Tình trạng', f: function (r) { return r.state === 'maternity' ? 'Nghỉ thai sản' : 'Đang đi làm'; } }]);
      rows = d.people;
      var mv = d.moves;
      if (mv.joined.length || mv.left.length) sub += ' · tháng ' + HR.ymLabel(mv.month) + ': vào ' + mv.joined.map(function (x) { return x.e['Họ và tên']; }).join(', ') + (mv.left.length ? ' · nghỉ ' + mv.left.map(function (x) { return x.e['Họ và tên']; }).join(', ') : '');
    } else if (kind === 'contracts') {
      title = 'Hợp đồng sắp hết hạn / đã hết hạn chưa ký mới'; sub = 'Trong ' + cfg().contractDays + ' ngày tính từ ' + HR.vnDate(d.ref) + ' · đổi số ngày trong Cài đặt';
      rows = d.contracts.overdue.concat(d.contracts.soon);
      cols = U.concat([{ t: 'Mã NV', f: function (r) { return r.h['Mã NV']; }, m: 1 }, { t: 'Họ và tên', f: function (r) { return r.e['Họ và tên']; } }, { t: 'Phòng ban', f: function (r) { return r.e['Phòng ban']; } },
        { t: 'Loại hợp đồng', f: function (r) { return r.h['Loại hợp đồng']; } }, { t: 'Số hợp đồng', f: function (r) { return r.h['Số hợp đồng']; }, m: 1 },
        { t: 'Ngày hết hạn', f: function (r) { return HR.vnDate(r.h['Ngày hết hạn']); } },
        { t: 'Còn lại', h: function (r) { return r.days < 0 ? '<span class="tag tag-bad">Quá hạn ' + (-r.days) + ' ngày</span>' : '<span class="tag ' + (r.days <= 15 ? 'tag-warn' : 'tag-mute') + '">' + r.days + ' ngày</span>'; }, f: function (r) { return r.days; } }]);
    } else if (kind === 'leaves') {
      title = 'Đơn nghỉ chờ duyệt'; sub = d.leaves.pending.length + ' đơn · tính đến ' + HR.vnDate(d.ref);
      rows = d.leaves.pending;
      cols = U.concat([{ t: 'Số đơn', f: function (r) { return r.x['Số đơn']; }, m: 1 }, { t: 'Mã NV', f: function (r) { return r.x['Mã NV']; }, m: 1 }, { t: 'Họ và tên', f: function (r) { return r.x['Họ và tên']; } },
        { t: 'Loại nghỉ', f: function (r) { return r.x['Loại nghỉ']; } }, { t: 'Từ – đến', f: function (r) { return HR.vnDate(r.x['Từ ngày']) + ' – ' + HR.vnDate(r.x['Đến ngày']); } },
        { t: 'Số ngày', f: function (r) { return r.x['Số ngày']; }, r: 1 }, { t: 'Người duyệt', f: function (r) { return r.x['Người duyệt']; } },
        { t: 'Ngày nghỉ', h: function (r) { return r.days === null ? '' : r.days < 0 ? '<span class="tag tag-bad">Đã qua ' + (-r.days) + ' ngày</span>' : '<span class="tag ' + (r.days <= 7 ? 'tag-warn' : 'tag-mute') + '">Còn ' + r.days + ' ngày</span>'; }, f: function (r) { return r.days; } }]);
    }
    var body = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input class="input" id="listQ" placeholder="Tìm tên, mã NV, phòng ban…" style="flex:1;min-width:220px"><span class="muted" id="listN"></span></div><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
      cols.map(function (c) { return '<th' + (c.r ? ' class="r"' : '') + '>' + c.t + '</th>'; }).join('') + '</tr></thead><tbody id="listBody"></tbody></table></div>';
    var m = modal(title, sub, body);
    function draw() {
      var q = HR.stripAcc(($('#listQ', m).value || '').toLowerCase());
      var list = rows.filter(function (r) { if (!q) return true; return HR.stripAcc(cols.map(function (c) { return c.f(r); }).join(' ').toLowerCase()).indexOf(q) >= 0; });
      $('#listN', m).textContent = list.length + ' dòng';
      $('#listBody', m).innerHTML = list.length ? list.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td' + (c.r ? ' class="r"' : c.m ? ' class="mono"' : '') + '>' + (c.h ? c.h(r) : esc(c.f(r))) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + cols.length + '" class="muted">Không có dòng nào.</td></tr>';
    }
    $('#listQ', m).addEventListener('input', draw); draw();
  }
  function modal(title, sub, body, small) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal' + (small ? ' sm' : '') + '" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div><button class="x-btn" data-close>Đóng</button></div><div class="modal-body">' + body + '</div></div>';
    document.body.appendChild(bg);
    function close() { bg.remove(); document.removeEventListener('keydown', onKey); }
    // bg.guard(e) trả false = không đóng (trình soạn mẫu HĐ dùng để hỏi trước khi đóng, Esc đóng bảng chọn trước)
    function onKey(e) { if (e.key === 'Escape') { if (bg.guard && bg.guard(e) === false) return; close(); } }
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-close]')) { if (bg.guard && bg.guard(e) === false) return; close(); } });
    document.addEventListener('keydown', onKey);
    bg.close = close;
    var f = bg.querySelector('input,select,button'); if (f) setTimeout(function () { f.focus(); }, 30);
    return bg;
  }

  /* ---------------- Ô ngày dd/mm/yyyy ---------------- */
  function dateInput(id, iso) { return '<span class="datebox"><input class="input" id="' + id + '" inputmode="numeric" placeholder="dd/mm/yyyy" maxlength="10" value="' + (iso ? HR.vnDate(iso) : '') + '"></span>'; }
  // 07/11/2026 (góp ý anh 14:44): khung dd/mm/yyyy hiện sẵn khi gõ, đủ 2 số ngày tự sang tháng, đủ 2 số tháng tự sang năm;
  // gõ 1 số rồi "/" (hoặc ngày đầu > 3, tháng đầu > 1) tự thêm số 0; dán được 24/10/2026, 24102026, 2026-10-24. Mọi ô .datebox tự gắn khi được chọn.
  function dateFmt(raw, del) {
    var iso = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(raw); if (iso) return p2(+iso[3]) + '/' + p2(+iso[2]) + '/' + iso[1];
    var seg = ['', '', ''], i = 0, max = [2, 2, 4];
    for (var k = 0; k < raw.length; k++) {
      var ch = raw.charAt(k);
      if (/\d/.test(ch)) {
        if (seg[i].length >= max[i]) { if (i < 2) i++; else continue; }
        if (!seg[i].length && ((i === 0 && +ch > 3) || (i === 1 && +ch > 1))) { seg[i] = '0' + ch; if (i < 2) i++; continue; }
        seg[i] += ch; if (i < 2 && seg[i].length === max[i] && k < raw.length - 1) i++;
      } else if (/[\/.\-\s]/.test(ch) && i < 2 && seg[i].length) { if (seg[i].length === 1) seg[i] = '0' + seg[i]; i++; }
    }
    var o = seg[0];
    if (seg[0].length === 2 && (seg[1] || i >= 1 || !del)) o += '/';
    if (seg[1] || i >= 1) { o += seg[1]; if (seg[1].length === 2 && (seg[2] || i >= 2 || !del)) o += '/'; }
    if (seg[2]) o += seg[2];
    return o;
  }
  function bindDateInput(el) {
    if (!el || el._dm) return; el._dm = 1;
    var box = el.parentNode, mk = null, T = 'dd/mm/yyyy';
    if (box && box.classList && box.classList.contains('datebox')) { mk = document.createElement('span'); mk.className = 'dmask'; mk.setAttribute('aria-hidden', 'true'); box.appendChild(mk); }
    function place() { if (!mk) return; var cs = getComputedStyle(el); mk.style.left = (el.offsetLeft + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)) + 'px'; mk.style.font = cs.font; mk.style.letterSpacing = cs.letterSpacing; }
    function paint() { if (mk) mk.innerHTML = '<i>' + esc(el.value) + '</i>' + T.slice(el.value.length); }
    el.addEventListener('focus', function () { place(); paint(); });
    el.addEventListener('input', function (e) {
      var atEnd = el.selectionStart === el.value.length, del = e && e.inputType && e.inputType.indexOf('delete') === 0;
      if (atEnd) el.value = dateFmt(el.value, del); else el.value = el.value.replace(/[^\d\/]/g, '').slice(0, 10);
      if (atEnd) try { el.setSelectionRange(el.value.length, el.value.length); } catch (x) { }
      el.classList.toggle('bad', el.value.length === 10 && !HR.parseVn(el.value)); paint();
    });
    el.addEventListener('blur', function () { if (/^\d\/\d{1,2}\/\d{4}$|^\d{1,2}\/\d\/\d{4}$/.test(el.value)) { var p = el.value.split('/'); el.value = p2(+p[0]) + '/' + p2(+p[1]) + '/' + p[2]; } });
  }
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && t.tagName === 'INPUT' && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('datebox') && !t._dm) { bindDateInput(t); var cs = getComputedStyle(t); var mk = t.parentNode.querySelector('.dmask'); if (mk) { mk.style.left = (t.offsetLeft + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth)) + 'px'; mk.style.font = cs.font; mk.innerHTML = '<i>' + esc(t.value) + '</i>' + 'dd/mm/yyyy'.slice(t.value.length); } } });

  /* ---------------- Hộp ngày tham chiếu ---------------- */
  function openRefModal() {
    var st = S.settings;
    var body = '<p class="muted">Mọi số liệu "sắp hết hạn", "đang làm", "đã qua ngày nghỉ"… được tính theo ngày này. Mặc định là ngày hôm nay của máy; khi xem lại dữ liệu cũ (hoặc dữ liệu mẫu), chọn ngày cố định để số liệu đúng như tại thời điểm đó.</p>' +
      '<label class="radio"><input type="radio" name="refm" value="today"' + (st.refMode === 'today' ? ' checked' : '') + '> Hôm nay (' + HR.vnDate(HR.isoToday()) + ')</label>' +
      '<label class="radio"><input type="radio" name="refm" value="fixed"' + (st.refMode === 'fixed' ? ' checked' : '') + '> Ngày cố định: ' + dateInput('refIn', st.refDate) + '</label>' +
      (S.units.some(function (u) { return u.source === 'sample'; }) ? '<button class="btn btn-sm" id="refSample" style="align-self:flex-start">Dùng ngày chốt dữ liệu mẫu (' + HR.vnDate(SAMPLE_REF) + ')</button>' : '') +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="refSave">Áp dụng</button></div>';
    var m = modal('Ngày tham chiếu', '', body, true), inp = $('#refIn', m);
    bindDateInput(inp);
    inp.addEventListener('focus', function () { $('input[value="fixed"]', m).checked = true; });
    var sb = $('#refSample', m); if (sb) sb.addEventListener('click', function () { inp.value = HR.vnDate(SAMPLE_REF); $('input[value="fixed"]', m).checked = true; });
    $('#refSave', m).addEventListener('click', function () {
      var mode = $('input[name="refm"]:checked', m).value;
      if (mode === 'fixed') { var iso = HR.parseVn(inp.value); if (!iso) { inp.classList.add('bad'); inp.focus(); toast('Ngày chưa đúng', 'err', 'Nhập theo dạng dd/mm/yyyy, ví dụ 31/10/2026.'); return; } st.refDate = iso; }
      st.refMode = mode; saveSettings(); log('Đổi ngày tham chiếu: ' + (mode === 'today' ? 'hôm nay' : HR.vnDate(st.refDate))); m.close(); render();
    });
  }

  /* ---------------- Nhập dữ liệu (Cụm 1: kết quả quét) ---------------- */
  function srcLabel(u) { return u.source === 'sample' ? 'Dữ liệu mẫu có sẵn trong phần mềm' : u.source === 'folder' ? 'Thư mục "' + u.folder + '" (đã ghi nhớ)' : (u.folder || 'File đã chọn') + ' (không ghi nhớ thư mục)'; }
  function pageNhap() {
    var h = '<div class="page-head"><div><h1>Nhập dữ liệu</h1><p>Phần mềm chỉ đọc file Excel, không sửa, không xóa file nào. Bấm "Quét lại" sau khi thêm/sửa file trong thư mục.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" data-act="add-unit">+ Thêm đơn vị</button></div></div>';
    if (!S.units.length) return h + '<div class="card empty"><p>Chưa có dữ liệu.</p><button class="btn btn-primary" data-go="dash">Bắt đầu</button></div>';
    h += importCardHtml();
    S.units.forEach(function (u) {
      var rep = u.report || [];
      h += '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>' + esc(u.name) + '</h3><p>' + esc(srcLabel(u)) + (u.scannedAt ? ' · quét lúc ' + esc(u.scannedAt) : '') + ' · ' + esc(HR.summary(u.data)) + '</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">' +
        (u.source === 'folder' ? '<button class="btn btn-sm" data-act="rescan" data-id="' + u.id + '">' + ic('refresh') + 'Quét lại</button>' : '') +
        (u.source !== 'sample' ? '<button class="btn btn-sm" data-act="pick-folder" data-id="' + u.id + '">' + ic('folder') + 'Chọn lại thư mục</button>' : '') + '</div></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>File</th><th>Sheet</th><th>Nhận ra là</th><th>Tháng</th><th class="r">Dòng tiêu đề</th><th class="r">Số dòng</th><th>Tình trạng</th></tr></thead><tbody>' +
        rep.map(function (r) {
          var t = r.type ? HR.TYPE[r.type].name : '—', stt;
          if (r.error) stt = '<span class="tag tag-bad">' + esc(r.error) + '</span>';
          else if (!r.type) stt = '<span class="tag tag-mute">' + esc(r.note || 'Bỏ qua') + '</span>';
          else if (!r.used) stt = '<span class="tag tag-warn">' + esc(r.note || 'Không dùng') + '</span>';
          else stt = (r.missing && r.missing.length ? '<span class="tag tag-warn" title="' + esc(r.missing.join(', ')) + '">Thiếu ' + r.missing.length + ' cột</span>' : '<span class="tag tag-ok">Đủ cột</span>') + (r.skipped ? ' <span class="faint" style="font-size:12px">bỏ ' + r.skipped + ' dòng tổng/chữ ký</span>' : '');
          return '<tr><td class="mono" style="font-size:12px">' + esc(r.path) + '</td><td>' + esc(r.sheet) + '</td><td>' + esc(t) + '</td><td>' + (r.month ? HR.ymLabel(r.month) : '') + '</td><td class="r">' + (r.headerRow || '') + '</td><td class="r">' + (r.type ? fmtInt(r.count) : '') + '</td><td>' + stt + (r.missing && r.missing.length && r.used ? '<div class="faint" style="font-size:11.5px;margin-top:3px">Thiếu: ' + esc(r.missing.join(', ')) + '</div>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    });
    return h;
  }
  function openAddUnit() {
    var body = '<p class="muted">Mỗi công ty là một thư mục dữ liệu riêng, độc lập với nhau. Ô "Đơn vị" trên thanh trên cùng cho chọn xem từng công ty hoặc "Tổng các công ty" để xem gộp.</p>' +
      '<div class="choices" style="grid-template-columns:1fr">' +
      '<button class="choice" data-act="pick-folder"><span class="ic">' + ic('folder') + '</span><h3>Chọn thư mục dữ liệu</h3><p>' + (CAN_PICK ? 'Ghi nhớ thư mục, lần sau chỉ cần bấm Quét lại.' : 'Trình duyệt này không ghi nhớ thư mục.') + '</p></button>' +
      '<button class="choice" data-act="pick-files"><span class="ic">' + ic('files') + '</span><h3>Chọn các file Excel</h3><p>Chọn một hoặc nhiều file .xlsx.</p></button>' +
      (S.units.some(function (u) { return u.source === 'sample'; }) ? '' : '<button class="choice" data-act="sample"><span class="ic">' + ic('sample') + '</span><h3>Dùng dữ liệu mẫu</h3><p>Thêm bộ dữ liệu mẫu làm một đơn vị.</p></button>') + '</div>';
    var m = modal('Thêm đơn vị', '', body, true);
    m.addEventListener('click', function (e) { if (e.target.closest('[data-act]')) m.close(); });
  }

  /* ---------------- Cài đặt ---------------- */
  function pageCaidat() {
    var st = S.settings;
    var h = '<div class="page-head"><div><h1>Cài đặt</h1><p>Mọi thiết lập đều chỉnh ở đây, không cần sửa file nào.</p></div></div><div class="set-grid">';
    // Đơn vị
    h += '<div class="card card-pad"><div class="card-head"><div><h3>Đơn vị</h3><p>Mỗi công ty là một đơn vị dữ liệu riêng, độc lập. Ô chọn đơn vị ở thanh trên cho xem từng công ty, hoặc chọn \"Tổng các công ty\" rồi tích các công ty cần gộp. File Excel không bị ảnh hưởng.</p></div><button class="btn btn-sm" data-act="add-unit">+ Thêm đơn vị</button></div>' +
      (S.units.length ? S.units.map(function (u) {
        return '<div class="unit-row"><div class="grow"><input class="input" data-rename="' + u.id + '" value="' + esc(u.name) + '" aria-label="Tên đơn vị"><div class="faint" style="font-size:12px;margin-top:4px">' + esc(srcLabel(u)) + (u.scannedAt ? ' · quét lúc ' + esc(u.scannedAt) : '') + '</div></div>' +
          (u.source === 'folder' ? '<button class="btn btn-sm" data-act="rescan" data-id="' + u.id + '">Quét lại</button>' : '') +
          '<button class="btn btn-sm" data-act="del-unit" data-id="' + u.id + '">Gỡ</button></div>';
      }).join('') : '<p class="muted">Chưa có đơn vị nào.</p>') + '</div>';
    // Ngày tham chiếu + ngưỡng
    h += '<div class="card card-pad"><div class="card-head"><div><h3>Ngày tham chiếu &amp; ngưỡng</h3><p>Ngày dùng để tính mọi cảnh báo và số liệu.</p></div></div>' +
      '<dl class="kv"><dt>Tính số liệu đến</dt><dd><b>' + HR.vnDate(refDate()) + '</b> ' + (st.refMode === 'today' ? '(hôm nay)' : '(ngày cố định)') + ' <button class="btn btn-sm" id="refEdit" style="margin-left:6px">Đổi</button></dd>' +
      '<dt>Màu giao diện</dt><dd><div class="pal-row">' + palOpts() + '</div>' + palAutoHtml() + '</dd></dl></div>';
    // Nhật ký
    h += '<div class="card card-pad"><div class="card-head"><div><h3>Nhật ký</h3><p>Ghi lại mỗi lần mở, quét, lỗi. Số CCCD, tài khoản đã được che. Khi cần hỗ trợ, tải file này gửi cho người hỗ trợ.</p></div><div style="display:flex;gap:8px"><button class="btn btn-sm" data-act="dl-log">Tải file nhật ký</button><button class="btn btn-sm" data-act="clear-log">Xóa nhật ký</button></div></div>' +
      '<div class="log" id="logBox"></div><dl class="kv" style="margin-top:10px"><dt>Phiên bản</dt><dd>' + APP_VER + '</dd><dt>Lưu trên trình duyệt</dt><dd>' + (DB_OK ? 'Có (dữ liệu nằm trong trình duyệt của máy này)' : 'Không dùng được – mở lại sẽ phải nạp lại dữ liệu') + '</dd><dt>Ghi nhớ thư mục</dt><dd>' + (CAN_PICK ? 'Có' : 'Không (trình duyệt này không hỗ trợ; dùng Chrome hoặc Edge)') + '</dd></dl></div>';
    // Xóa
    h += '<div class="card card-pad" style="border-color:color-mix(in srgb,var(--danger) 40%,var(--border))"><div class="card-head"><div><h3>Xóa toàn bộ dữ liệu</h3><p>Xóa mọi dữ liệu phần mềm đã nạp, thư mục đã nhớ, cài đặt và nhật ký – phần mềm trở về trống như lần đầu mở. File Excel trong thư mục của anh/chị không bị động tới.</p></div></div>' +
      '<button class="btn btn-danger" data-act="reset-all">Xóa toàn bộ dữ liệu…</button></div>';
    return h + '</div>' + settingsRulesHtml();
  }
  function bindCaidat() {
    var lb = $('#logBox'); if (lb) { lb.textContent = LOG.slice(-300).join('\n'); lb.scrollTop = lb.scrollHeight; }
    $$('[data-rename]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var u = S.units.filter(function (x) { return x.id === inp.getAttribute('data-rename'); })[0]; var v = inp.value.trim();
        if (!u || !v) { inp.value = u ? u.name : ''; return; }
        log('Đổi tên đơn vị "' + u.name + '" → "' + v + '"'); u.name = v; saveUnits(); renderTop(); toast('Đã đổi tên đơn vị', 'ok');
      });
    });
    var re = $('#refEdit'); if (re) re.addEventListener('click', openRefModal);
    bindRules();
  }
  /* ---------------- Màu giao diện (0.9.0): 5 màu sáng + 1 nền tối chung ---------------- */
  var COLORS = [
    { k: 'ngoc', n: 'Xanh ngọc', sw: 'linear-gradient(135deg,#0B5F5A,#17958B)' },
    { k: 'reu', n: 'Xanh rêu', sw: 'linear-gradient(135deg,#2F4A2B,#557A42)' },
    { k: 'duong', n: 'Xanh dương', sw: 'linear-gradient(135deg,#12407A,#2468B8)' },
    { k: 'vang', n: 'Vàng', sw: 'linear-gradient(135deg,#7A4E05,#BF8418)' },
    { k: 'kem', n: 'Kem', sw: 'linear-gradient(135deg,#F6EEDF,#D9BE94)' },
    { k: 'dark', n: 'Nền tối', sw: 'linear-gradient(135deg,#13171C 55%,#3BBDB1 55%)' }
  ];
  function curColor() { var c = S.settings.color; return COLORS.some(function (x) { return x.k === c && c !== 'dark'; }) ? c : 'ngoc'; }
  function curPal() { return isDarkNow() ? 'dark' : curColor(); }
  function applyTheme() {
    var t = S.settings.theme, de = document.documentElement;
    if (t === 'light' || t === 'dark') de.setAttribute('data-theme', t); else de.removeAttribute('data-theme');
    de.setAttribute('data-color', curColor());
  }
  function palOpts() {
    var on = curPal();
    return COLORS.map(function (c) { return '<button type="button" class="pal-opt' + (c.k === on ? ' on' : '') + '" data-pal="' + c.k + '" aria-pressed="' + (c.k === on) + '"><span class="pal-sw" style="background:' + c.sw + '"></span>' + c.n + '</button>'; }).join('');
  }
  function palAutoHtml() { return '<label class="pal-auto"><input type="checkbox" data-pal-auto' + (S.settings.theme === 'auto' ? ' checked' : '') + '> Theo máy: tự chuyển nền tối khi máy để chế độ tối</label>'; }
  function refreshPal() {
    var on = curPal();
    $$('[data-pal]').forEach(function (b) { var y = b.getAttribute('data-pal') === on; b.classList.toggle('on', y); b.setAttribute('aria-pressed', y); });
    $$('[data-pal-auto]').forEach(function (x) { x.checked = S.settings.theme === 'auto'; });
  }
  function setPal(k) {
    if (k === 'dark') S.settings.theme = 'dark'; else { S.settings.color = k; S.settings.theme = 'light'; }
    applyTheme(); saveSettings(); refreshPal();
  }
  var palEl = null;
  function closePalette() { if (palEl) { palEl.remove(); palEl = null; document.removeEventListener('mousedown', palOut, true); document.removeEventListener('keydown', palKey, true); } }
  function palOut(e) { if (palEl && !palEl.contains(e.target) && !e.target.closest('[data-act="palette"]')) closePalette(); }
  function palKey(e) { if (e.key === 'Escape') closePalette(); }
  function openPalette(anchor) {
    if (palEl) { closePalette(); return; }
    palEl = document.createElement('div'); palEl.className = 'palpop'; palEl.setAttribute('role', 'dialog'); palEl.setAttribute('aria-label', 'Màu giao diện');
    palEl.innerHTML = '<button type="button" class="pal-x" aria-label="Đóng" title="Đóng (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button><h4>Màu giao diện</h4><div class="pal-grid">' + palOpts() + '</div>' + palAutoHtml();
    document.body.appendChild(palEl);
    palEl.querySelector('.pal-x').addEventListener('click', closePalette);
    var w = palEl.offsetWidth, h = palEl.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, left, top;
    if (anchor && anchor.getBoundingClientRect) {
      var r = anchor.getBoundingClientRect();
      left = r.right - w; if (left < 8) left = r.left;
      top = r.bottom + 8; if (top + h > vh - 8) top = r.top - h - 8;
    } else { left = vw - w - 16; top = 64; }
    palEl.style.left = Math.max(8, Math.min(left, vw - w - 8)) + 'px'; palEl.style.top = Math.max(8, Math.min(top, vh - h - 8)) + 'px';
    setTimeout(function () { document.addEventListener('mousedown', palOut, true); document.addEventListener('keydown', palKey, true); }, 0);
    var f = palEl.querySelector('.pal-opt.on'); if (f) f.focus();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-pal]'); if (b) setPal(b.getAttribute('data-pal')); });
  document.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('[data-pal-auto]')) return;
    S.settings.theme = e.target.checked ? 'auto' : (isDarkNow() ? 'dark' : 'light'); applyTheme(); saveSettings(); refreshPal();
  });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); var onMq = function () { if (S.settings.theme === 'auto') refreshPal(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq); }
  function delUnit(id) {
    var u = S.units.filter(function (x) { return x.id === id; })[0]; if (!u) return;
    var m = modal('Gỡ đơn vị "' + u.name + '"?', '', '<p>Dữ liệu của đơn vị này sẽ bị xóa khỏi phần mềm. File Excel trong thư mục không bị ảnh hưởng; muốn xem lại chỉ cần chọn lại thư mục.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="delOk">Gỡ đơn vị</button></div>', true);
    $('#delOk', m).addEventListener('click', function () {
      S.units = S.units.filter(function (x) { return x.id !== id; }); try { khoDelUnit(id); } catch (e) { }
      if (S.settings.unit === id) S.settings.unit = S.units.length > 1 ? 'all' : (S.units[0] ? S.units[0].id : 'all');
      log('Gỡ đơn vị "' + u.name + '"'); saveUnits(); saveSettings(); m.close(); toast('Đã gỡ đơn vị', 'ok'); render();
    });
  }
  function openResetModal() {
    var m = modal('Xóa toàn bộ dữ liệu?', '', '<p>Thao tác này <b>không hoàn tác được</b>: xóa mọi dữ liệu đã nạp (' + S.units.length + ' đơn vị), thư mục đã nhớ, cài đặt, nhật ký và các file đã tải lên kho lưu trữ (hồ sơ, hợp đồng đã ký) trong trình duyệt. File Excel trên máy không bị động tới.</p>' +
      '<div class="field"><label for="rsIn">Gõ chữ XOA để xác nhận</label><input class="input" id="rsIn" autocomplete="off"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="rsOk" disabled>Xóa toàn bộ</button></div>', true);
    var inp = $('#rsIn', m), ok = $('#rsOk', m);
    inp.addEventListener('input', function () { ok.disabled = inp.value.trim().toUpperCase() !== 'XOA'; });
    ok.addEventListener('click', function () {
      try { khoClear(); } catch (e) { }
      dbClear().catch(function () {}).then(function () {
        S = { settings: Object.assign({}, DEF, { cfg: Object.assign({}, HRR.DEF) }), units: [], done: {} }; LOG = [];
        applyTheme(); log('===== Đã xóa toàn bộ dữ liệu theo yêu cầu người dùng – phần mềm trở về trống ====='); m.close(); toast('Đã xóa toàn bộ dữ liệu', 'ok'); go('dash'); render();
      });
    });
  }
  function downloadLog() {
    var head = 'NHẬT KÝ – Phần mềm quản lý nhân sự (Quản trị tử tế) · phiên bản ' + APP_VER + '\nTải lúc: ' + nowVn() + '\nTrình duyệt: ' + navigator.userAgent + '\n\n';
    var blob = new Blob(['﻿' + head + LOG.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nhat-ky.txt'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

/*@@PAGES@@*/

/*@@NHANSU@@*/

/*@@CHAMCONG@@*/

  /* ---------------- Vẽ trang ---------------- */
  function render() {
    var p = (location.hash || '#dash').slice(1) || 'dash';
    if (!NAV.some(function (n) { return n.id === p; })) p = 'dash';
    curPage = p;
    var html;
    try {
      var mm = modOf(p);
      if (isSoon(mm)) html = pageSoon(p);
      else if (p === 'ccwifi') html = PAGES.ccwifi(); /* 0.3.1: trang Chấm công Wi‑Fi trong chamcong.js */
      else if (!S.units.length && p !== 'caidat' && p !== 'nhap') { curPage = 'start'; html = pageStart(); }
      else if (p === 'dash') html = pageDash();
      else if (p === 'nhap') html = pageNhap();
      else if (p === 'caidat') html = pageCaidat();
      else html = PAGES[p] ? PAGES[p]() : pageDash();
    } catch (e) { logErr('Vẽ trang ' + p, e); html = '<div class="card empty"><h2>Trang này đang gặp lỗi khi hiển thị</h2><p>' + esc(SUPPORT_MSG) + '</p></div>'; }
    $('#page').innerHTML = html;
    document.body.classList.remove('nav-open');
    renderNav(); renderTop();
    $$('img.dom-img').forEach(function (i) { if (!i.src) i.src = DOM_SRC; });
    if (curPage === 'dash') bindDash();
    if (curPage === 'caidat') bindCaidat();
    if (BINDS[curPage]) BINDS[curPage]();
    if (curPage === 'nhap') bindImport();
    if (curPage === 'start') bindDrop($('#dropZone'));
    window.scrollTo(0, 0);
  }

  /* ---------------- Khởi động ---------------- */
  function boot() {
    $$('img.dom-img').forEach(function (i) { i.src = DOM_SRC; });
    var b = $('#bback'); if (b && /quantritute\.com$/.test(location.hostname)) b.href = '/cong-cu';
    XR.setSheetJS(['xlsx.full.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js']);
    Promise.all([dbGet('settings'), dbGet('units'), dbGet('log'), dbGet('done')]).then(function (r) {
      if (r[0]) { S.settings = Object.assign({}, DEF, r[0]); S.settings.refMode = 'today'; /* 08/11 anh: mỗi lần mở phần mềm 'Tính đến' về hôm nay; chọn ngày cố định chỉ dùng trong lần mở đó */ S.settings.cfg = Object.assign({}, HRR.DEF, r[0].cfg || {}, r[0].contractDays ? { contractDays: r[0].contractDays } : {}); }
      if (S.settings.cfg.workCodes === 'X, CT') S.settings.cfg.workCodes = 'X, CT, TB';   // 0.10.1: thêm ký hiệu Teambuilding
      if (r[3]) S.done = r[3];
      if (r[1]) S.units = r[1];
      if (r[2]) LOG = r[2];
    }).catch(function (e) { DB_OK = false; logErr('Mở bộ nhớ trình duyệt', e); }).then(function () {
      applyTheme();
      log('===== Mở phần mềm =====');
      log('Phiên bản ' + APP_VER + ' | Trình duyệt: ' + navigator.userAgent + ' | Địa chỉ: ' + location.origin + location.pathname);
      // 0.9.2 – gỡ dữ liệu mẫu cũ Tân Phát còn lưu trong trình duyệt (đã bỏ hẳn từ 02/11/2026), thay bằng bộ mẫu Đốm Sáng
      var OLD_RE = /t[âa]n\s*_?ph[áa]t/i, oldU = S.units.filter(function (u) { return OLD_RE.test(HR.stripAcc(u.name || '')) || OLD_RE.test(HR.stripAcc(u.folder || '')) || OLD_RE.test(u.name || ''); });
      if (oldU.length) {
        S.units = S.units.filter(function (u) { return oldU.indexOf(u) < 0; });
        if (S.settings.unit !== 'all' && !S.units.some(function (u) { return u.id === S.settings.unit; })) S.settings.unit = S.units.length > 1 ? 'all' : (S.units[0] ? S.units[0].id : 'all');
        log('Đã gỡ ' + oldU.length + ' đơn vị dữ liệu mẫu cũ (Tân Phát) còn lưu trong trình duyệt'); saveUnits(); saveSettings();
        if (!S.units.length) { S.settings.refMode = 'today'; setTimeout(function () { loadSample(); toast('Đã thay dữ liệu mẫu cũ bằng bộ mẫu mới', 'info', 'Dữ liệu Tân Phát không còn dùng nữa. Phần mềm đã nạp bộ mẫu Công ty TNHH Đốm Sáng.'); }, 50); }
      }
      // 06/11/2026 – bộ mẫu đổi sang 2 công ty độc lập Đốm Sáng Edu + Đốm Sáng Health: gỡ bộ mẫu cũ còn lưu trong trình duyệt rồi nạp lại
      var NEW_F = ['Du_lieu_nhan_su_Dom_Sang_Edu', 'Du_lieu_nhan_su_Dom_Sang_Health'], oldS = S.units.filter(function (u) { return u.source === 'sample' && (NEW_F.indexOf(u.folder) < 0 || u.sv !== SAMPLE_V); });
      if (oldS.length) { oldS.forEach(function (u) { try { khoDelUnit(u.id); } catch (e) { } }); S.units = S.units.filter(function (u) { return oldS.indexOf(u) < 0; }); S.settings.unit = 'all'; S.settings.pick = null; saveUnits(); saveSettings(); log('Đã gỡ ' + oldS.length + ' đơn vị dữ liệu mẫu cũ'); setTimeout(function () { loadSample(); }, 50); }
      log('Thiết lập: ' + S.units.length + ' đơn vị [' + S.units.map(function (u) { return u.name + ' – ' + srcLabel(u); }).join('; ') + ']; ngày tham chiếu = ' + (S.settings.refMode === 'today' ? 'hôm nay' : HR.vnDate(S.settings.refDate)) + '; HĐ sắp hết hạn trong ' + cfg().contractDays + ' ngày; ghi nhớ thư mục: ' + (CAN_PICK ? 'có' : 'không'));
      if (!S.units.length && /^\/phan-mem\/?$/.test(location.pathname)) setTimeout(function () { loadSample(); }, 50); // 08/11: mở từ máy chủ chấm công thử → nạp sẵn dữ liệu mẫu
      render();
    });
  }
  boot();
})();
