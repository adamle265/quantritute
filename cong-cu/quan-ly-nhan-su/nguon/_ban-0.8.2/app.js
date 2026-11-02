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
  var DEF = { refMode: 'today', refDate: null, unit: 'all', month: null, theme: 'auto', cfg: null, maskExport: true };
  var S = { settings: Object.assign({}, DEF, { cfg: Object.assign({}, HRR.DEF) }), units: [], done: {} };
  function cfg() { return S.settings.cfg; }
  function saveDone() { return dbSet('done', S.done).catch(function (e) { logErr('Lưu đánh dấu đã xử lý', e); }); }
  var curPage = 'dash';
  function refDate() { return S.settings.refMode === 'fixed' && S.settings.refDate ? S.settings.refDate : HR.isoToday(); }
  function selUnits() { if (S.settings.unit === 'all' || !S.units.some(function (u) { return u.id === S.settings.unit; })) return S.units; return S.units.filter(function (u) { return u.id === S.settings.unit; }); }
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
    { id: 'tochuc', g: 'ns', t: 'Sơ đồ tổ chức', st: 2, k: 'phong ban so do' },
    { id: 'nv', g: 'ns', t: 'Danh sách nhân sự', st: 'ok', k: 'danh sach nhan vien tai khoan dang nhap pin' }, // gộp Tài khoản nhân viên (anh chốt 01/11 23:28)
    { id: 'hoso', g: 'ns', t: 'Hồ sơ nhân sự', st: 4, k: 'giay to bang cap ly lich' },
    { id: 'hd', g: 'ns', t: 'Hợp đồng', st: 'ok', k: 'hop dong lao dong het han' },
    { id: 'cc', g: 'tg', t: 'Tổng hợp công', st: 'ok', k: 'cham cong bang cong' },
    { id: 'ccwifi', g: 'tg', t: 'Chấm công Wi‑Fi', st: 'thu', k: 'cham cong wifi qr dien thoai' },
    { id: 'np', g: 'tg', t: 'Nghỉ phép', st: 'ok', k: 'don nghi phep quy phep' },
    { id: 'thietlapcc', g: 'tg', t: 'Thiết lập chấm công', st: 3, k: 'ca lam gio vao ra di muon' },
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
  var CC_URL = 'https://chamcong-thu.quantritute.com';
  function pageCcWifi() {
    return '<div class="page-head"><div><h1>Chấm công Wi‑Fi</h1><p>Nhân viên bấm một chạm trên điện thoại khi đang bắt Wi‑Fi văn phòng. Bản thử đang chạy online riêng, sẽ ghép vào phần mềm ở Phần 2.</p></div></div>' +
      '<div class="soon-wrap"><div class="card soon-main"><span class="soon-part"><i></i>Bản thử 0.2.1 · chạy online</span><h2>Ba màn hình, mở bằng trình duyệt</h2>' +
      '<ul class="soon-list">' +
      '<li>' + ic('appnv') + '<span><b>Nhân viên</b> – đăng nhập bằng mã NV và PIN, bấm Vào ca / Ra ca.</span></li>' +
      '<li>' + ic('dash') + '<span><b>Màn hình chung</b> đặt ở văn phòng – báo mạng văn phòng, hiện QR đổi mỗi 30 giây để quét khi Wi‑Fi trục trặc.</span></li>' +
      '<li>' + ic('caidat') + '<span><b>Quản lý</b> – danh sách nhân viên, lượt chấm, chấm bổ sung, tải file tháng.</span></li>' +
      '<li>' + ic('bhxh') + '<span>Chỉ <b>phát hiện</b> máy dùng chung cho nhiều người và máy lạ để người quản lý xem lại. Không chặn, không chụp ảnh.</span></li></ul>' +
      '<div class="link-row" style="margin-top:22px"><a class="btn btn-primary" href="' + CC_URL + '/quan-ly" target="_blank" rel="noopener">Mở trang quản lý ' + ic('ext', 15) + '</a><a class="btn" href="' + CC_URL + '/tram" target="_blank" rel="noopener">Màn hình chung</a><a class="btn" href="' + CC_URL + '/" target="_blank" rel="noopener">Trang nhân viên</a></div></div>' +
      '<div class="soon-side"><div class="card"><h3>Khi ghép vào phần mềm</h3><p>Lượt chấm sẽ chảy thẳng vào <b>Tổng hợp công</b>, không phải tải file từ máy chấm công rồi nhập lại. Mỗi đơn vị dùng tài khoản Cloudflare của mình, dữ liệu không nằm ở máy chủ của Quản trị tử tế.</p><div class="link-row"><button class="btn btn-sm" data-go="cc">' + ic('cc', 15) + 'Tổng hợp công hiện tại</button></div></div>' +
      '<div class="card"><h3>Lộ trình xây dựng</h3>' + roadHtml(2) + '</div></div></div>';
  }

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
  function toggleTheme() { S.settings.theme = isDarkNow() ? 'light' : 'dark'; applyTheme(); saveSettings(); }

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
      var opts = (S.units.length > 1 ? '<option value="all">Tất cả đơn vị (' + S.units.length + ')</option>' : '') +
        S.units.map(function (u) { return '<option value="' + u.id + '">' + esc(u.name) + '</option>'; }).join('');
      var sel = $('#unitSel'); sel.innerHTML = opts;
      sel.value = S.units.length > 1 ? S.settings.unit : S.units[0].id;
    }
    $('#refTxt').textContent = HR.vnDate(refDate()) + (S.settings.refMode === 'today' ? ' (hôm nay)' : '');
    var us = selUnits(), last = us.map(function (u) { return u.scannedAt; }).filter(Boolean).sort().pop();
    var tables = us.reduce(function (a, u) { return a + (u.report || []).filter(function (r) { return r.used; }).length; }, 0);
    var files = us.reduce(function (a, u) { var s = {}; (u.report || []).forEach(function (r) { s[r.path] = 1; }); return a + Object.keys(s).length; }, 0);
    $('#scanTxt').innerHTML = has ? (us.some(function (u) { return u.source === 'sample'; }) && us.length === 1 ? '<span class="tag tag-info">Dữ liệu mẫu</span> ' : '') + 'Đọc <b>' + tables + '</b> bảng từ <b>' + files + '</b> file' + (last ? ' · quét lúc ' + esc(last) : '') : '';
    $('#rescanBtn').hidden = !has || !us.some(function (u) { return u.source !== 'sample'; });
  }
  $('#unitSel').addEventListener('change', function () { S.settings.unit = this.value; saveSettings(); render(); });
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
    u.data = m.data; u.report = m.report; u.scannedAt = nowVn();
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
        log('Nạp dữ liệu mẫu ' + j.name + ' (đọc sẵn từ thư mục ' + j.folder + ')');
        var exist = S.units.filter(function (u) { return u.source === 'sample'; })[0];
        applyResult({ data: j.data, report: j.report, company: j.name }, { source: 'sample', folder: j.folder }, target || (exist && exist.id));
        if (S.settings.refMode === 'today') {
          S.settings.refMode = 'fixed'; S.settings.refDate = '2026-10-31'; saveSettings();
          toast('Đã đặt ngày tham chiếu 31/10/2026', 'info', 'Đây là ngày chốt của dữ liệu mẫu, để số liệu đúng như lúc lập file. Bấm ô "Tính đến" ở thanh trên để đổi.');
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
      '<button class="choice" data-act="sample"><span class="ic">' + ic('sample') + '</span><h3>Dùng dữ liệu mẫu</h3><p>Xem thử với dữ liệu hư cấu của Công ty TNHH Đốm Sáng – công ty nhỏ 9 hồ sơ vừa chuyển văn phòng: hợp đồng, chấm công tháng 8–10/2026, bảng lương tháng 8–9/2026.</p><span class="meta">Xóa được bất cứ lúc nào trong Cài đặt</span></button>' +
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
    else if (ACTS[act]) ACTS[act](a, id, e);
    else if (act === 'pay-table') { var t = $('#payTable'); if (t) { t.hidden = !t.hidden; a.textContent = t.hidden ? 'Xem dạng bảng' : 'Ẩn bảng'; } }
  });

  /* ---------------- Bảng điều hành ---------------- */
  var lastDash = null;
  function pageDash() {
    var us = selUnits(), R = refDate();
    var d = lastDash = HR.dashboard(us.map(function (u) { return { name: u.name, data: u.data }; }), { ref: R, month: S.settings.month, contractDays: cfg().contractDays });
    var multi = us.length > 1, N = cfg().contractDays;
    var h = briefHtml(d, us, R);
    if (!us.some(function (u) { return u.data.NV.length; })) h += '<div class="notice warn">' + ic('info') + '<div>Chưa có bảng Hồ sơ nhân viên nên các số liệu nhân sự đang trống. Xem trang <a href="#nhap" data-go="nhap">Nhập dữ liệu</a> để biết phần mềm đã đọc được những gì.</div></div><div style="height:14px"></div>';
    // KPI
    var mv = d.moves, pay = d.payroll, prev = d.prevPayroll;
    var monthOpts = d.months.map(function (m) { return '<option value="' + m.ym + '"' + (m.ym === d.month ? ' selected' : '') + '>' + HR.ymLabel(m.ym) + '</option>'; }).join('');
    h += '<div class="grid kpis">' +
      '<button class="kpi" data-act="list" data-list="staff"><span class="kpi-label">Nhân viên đang làm</span><span class="kpi-value num">' + d.staff.active + '<small>người</small></span>' +
      '<span class="kpi-sub"><b>' + d.staff.working + '</b> đang đi làm · <b>' + d.staff.maternity + '</b> nghỉ thai sản</span>' +
      '<span class="kpi-sub">Tháng ' + HR.ymLabel(mv.month) + ': <b class="up">+' + mv.joined.length + '</b> vào · <b class="' + (mv.left.length ? 'down' : '') + '">−' + mv.left.length + '</b> nghỉ</span></button>' +
      '<div class="kpi"><span class="kpi-label">Quỹ lương tháng' + (d.months.length ? '<select id="monthSel" aria-label="Chọn tháng lương">' + monthOpts + '</select>' : '') + '</span>' +
      (pay ? '<span class="kpi-value num">' + fmtTy(pay.gross) + '<small>tỷ</small></span><span class="kpi-sub">Thực lĩnh <b>' + fmtTy(pay.net) + ' tỷ</b>' +
        (prev ? ' · <span class="' + (pay.gross >= prev.gross ? 'up' : 'down') + '">' + fmtPct((pay.gross - prev.gross) / prev.gross * 100) + '</span> so với tháng trước' : '') + '</span><span class="kpi-sub">' + pay.people + ' người trên bảng lương</span>'
        : '<span class="kpi-value">—</span><span class="kpi-sub">Chưa có bảng lương</span>') + '</div>' +
      '<button class="kpi' + (d.contracts.overdue.length ? ' alert' : '') + '" data-act="list" data-list="contracts"><span class="kpi-label">Hợp đồng sắp hết hạn</span><span class="kpi-value num">' + d.contracts.soon.length + '<small>trong ' + N + ' ngày</small></span>' +
      '<span class="kpi-sub">' + (d.contracts.overdue.length ? '<b class="down">' + d.contracts.overdue.length + '</b> đã hết hạn, chưa thấy HĐ mới' : 'Không có HĐ đã hết hạn mà chưa ký mới') + '</span><span class="kpi-more">Xem danh sách →</span></button>' +
      '<button class="kpi' + (d.leaves.overdue ? ' alert' : '') + '" data-act="list" data-list="leaves"><span class="kpi-label">Đơn nghỉ chờ duyệt</span><span class="kpi-value num">' + d.leaves.pending.length + '<small>đơn</small></span>' +
      '<span class="kpi-sub">' + (d.leaves.overdue ? '<b class="down">' + d.leaves.overdue + '</b> đã qua ngày nghỉ · ' : '') + '<b>' + d.leaves.soon + '</b> nghỉ trong 7 ngày tới</span><span class="kpi-more">Xem danh sách →</span></button>' +
      '</div><div style="height:16px"></div>';
    // Biểu đồ
    h += '<div class="grid row2">' + deptCard(d, multi) + payCard(d) + '</div><div style="height:16px"></div>';
    h += urgentCard();
    return h;
  }
  // Câu tóm tắt đầu trang: đọc như một câu, mỗi con số bấm được
  function briefHtml(d, us, R) {
    var gap = 0; try { gap = alertList().filter(function (a) { return a.level === 'gap' && !isDone(a); }).length; } catch (e) { }
    var who = us.length > 1 ? us.length + ' đơn vị' : esc(us[0].name.replace(/\s*\(dữ liệu mẫu\)\s*$/, ''));
    var lnk = function (txt, attr, hot) { return '<button type="button" ' + attr + (hot ? ' class="hot"' : '') + '>' + txt + '</button>'; };
    var parts = [];
    if (gap) parts.push(lnk(gap + ' việc gấp', 'data-go="viec"', true));
    if (d.leaves.pending.length) parts.push(lnk(d.leaves.pending.length + ' đơn nghỉ', 'data-act="list" data-list="leaves"', d.leaves.overdue) + ' chờ duyệt');
    if (d.contracts.soon.length || d.contracts.overdue.length) parts.push(lnk((d.contracts.soon.length + d.contracts.overdue.length) + ' hợp đồng', 'data-act="list" data-list="contracts"', d.contracts.overdue.length) + ' sắp hoặc đã hết hạn');
    var tail = parts.length ? ' Cần để mắt tới ' + (parts.length > 1 ? parts.slice(0, -1).join(', ') + ' và ' + parts[parts.length - 1] : parts[0]) + '.' : ' Chưa có việc nào cần xử lý gấp.';
    return '<section class="brief"><div class="brief-date"><span class="lamp" aria-hidden="true"></span>Tính đến ' + HR.vnDate(R) + (S.settings.refMode === 'today' ? ', hôm nay' : '') + '</div>' +
      ('<h1>' + who + ' có ' + lnk(d.staff.active + ' người', 'data-act="list" data-list="staff"') + ' đang làm.' + tail + '</h1></section>').replace(/(<button[^>]*>[^<]*<\/button>)([,.])/g, '<span class="nowrap">$1$2</span>');
  }
  function deptCard(d, multi) {
    var max = 1; d.depts.forEach(function (x) { max = Math.max(max, x.working + x.maternity, x.plan || 0); });
    var rows = d.depts.map(function (x) {
      var tot = x.working + x.maternity, over = x.plan !== null && tot > x.plan;
      var w1 = x.working / max * 100, w2 = x.maternity / max * 100;
      var tip = (multi ? x.unit + ' · ' : '') + x.name + ': ' + x.working + ' đang đi làm' + (x.maternity ? ', ' + x.maternity + ' nghỉ thai sản' : '') + (x.plan !== null ? ' · định biên ' + x.plan : '');
      return '<div class="dept" title="' + esc(tip) + '"><span class="dept-name">' + esc((multi ? x.unit + ' · ' : '') + shortDept(x.name)) + '</span><span class="dept-bar"><span class="dept-fill">' +
        (x.working ? '<i style="width:' + w1 + '%"></i>' : '') + (x.maternity ? '<i class="mat" style="width:' + Math.max(w2, 1.5) + '%"></i>' : '') + '</span>' +
        (x.plan !== null ? '<span class="dept-plan" style="left:' + (x.plan / max * 100) + '%"></span>' : '') + '</span>' +
        '<span class="dept-num' + (over ? ' over' : '') + '">' + tot + (x.plan !== null ? ' / ' + x.plan : '') + '</span></div>';
    }).join('');
    var overTxt = d.overStaff.length ? '<span class="tag tag-warn">' + d.overStaff.map(function (x) { return esc(shortDept(x.name)) + ' vượt ' + (x.working + x.maternity - x.plan); }).join(' · ') + '</span>' : '';
    return '<div class="card card-pad"><div class="card-head"><div><h3>Nhân sự theo phòng ban</h3><p>Người đang làm so với định biên trong danh mục phòng ban</p></div>' + overTxt + '</div>' +
      (rows || '<p class="muted">Chưa có dữ liệu phòng ban.</p>') +
      '<div class="legend"><span><i class="sw" style="background:var(--s1)"></i>Đang đi làm</span><span><i class="sw mat"></i>Nghỉ thai sản</span><span><i class="sw plan"></i>Định biên</span></div></div>';
  }
  function shortDept(n) { return String(n || '').replace(/^Phòng\s+/, ''); }
  function payCard(d) {
    var ms = d.months;
    if (!ms.length) return '<div class="card card-pad"><div class="card-head"><div><h3>Quỹ lương theo tháng</h3><p>Chưa có bảng lương nào.</p></div></div></div>';
    var W = 560, H = 250, L = 44, Rr = 8, T = 22, B = 30, cw = (W - L - Rr) / ms.length;
    var max = 0; ms.forEach(function (m) { max = Math.max(max, m.gross); });
    var step = niceStep(max / 1e9), top = Math.ceil(max / 1e9 / step) * step || 1;
    var y = function (v) { return T + (H - T - B) * (1 - v / 1e9 / top); };
    var bw = Math.min(34, (cw - 18) / 2), labels = ms.length <= 6;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biểu đồ cột quỹ lương theo tháng: tổng thu nhập và thực lĩnh">';
    for (var g = 0; g <= top + 1e-9; g += step) { var gy = y(g * 1e9); s += '<line class="grid-l" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + gy + '" y2="' + gy + '"/><text class="ax" x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end">' + (Math.round(g * 100) / 100).toString().replace('.', ',') + '</text>'; }
    ms.forEach(function (m, i) {
      var cx = L + cw * i + cw / 2, x1 = cx - bw - 1, x2 = cx + 1;
      if (m.ym === d.month) s += '<rect class="sel" x="' + (L + cw * i + 3) + '" y="' + (T - 14) + '" width="' + (cw - 6) + '" height="' + (H - T - B + 14) + '" rx="8"/>';
      s += barPath(x1, y(m.gross), bw, y(0), 'bar1') + barPath(x2, y(m.net), bw, y(0), 'bar2');
      if (labels) s += '<text class="lbl" x="' + (x1 + bw / 2) + '" y="' + (y(m.gross) - 5) + '" text-anchor="middle">' + fmtTy(m.gross) + '</text><text class="lbl" x="' + (x2 + bw / 2) + '" y="' + (y(m.net) - 5) + '" text-anchor="middle">' + fmtTy(m.net) + '</text>';
      s += '<text class="ax" x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle">' + HR.ymLabel(m.ym) + '</text>';
      s += '<rect class="hit" data-i="' + i + '" x="' + (L + cw * i) + '" y="' + T + '" width="' + cw + '" height="' + (H - T - B) + '"/>';
    });
    s += '</svg>';
    var tbl = '<div class="tbl-wrap" id="payTable" hidden style="margin-top:10px"><table class="tbl"><thead><tr><th>Tháng</th><th class="r">Số người</th><th class="r">Tổng thu nhập (đ)</th><th class="r">Thực lĩnh (đ)</th></tr></thead><tbody>' +
      ms.map(function (m) { return '<tr><td>' + HR.ymLabel(m.ym) + '</td><td class="r">' + m.people + '</td><td class="r">' + fmtInt(m.gross) + '</td><td class="r">' + fmtInt(m.net) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return '<div class="card card-pad"><div class="card-head"><div><h3>Quỹ lương theo tháng</h3><p>Đơn vị: tỷ đồng · tháng đang chọn được tô nền</p></div><button class="btn btn-sm" data-act="pay-table">Xem dạng bảng</button></div>' +
      '<div class="pay-chart" id="payChart">' + s + '</div>' +
      '<div class="legend"><span><i class="sw" style="background:var(--s1)"></i>Tổng thu nhập</span><span><i class="sw" style="background:var(--s2)"></i>Thực lĩnh (sau bảo hiểm, thuế, tạm ứng)</span></div>' + tbl + '</div>';
  }
  function niceStep(v) { if (v <= 0) return 0.5; var raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function barPath(x, yTop, w, y0, cls) {
    var h = Math.max(0, y0 - yTop), r = Math.min(4, h, w / 2);
    return '<path class="' + cls + '" d="M' + x + ' ' + y0 + 'V' + (yTop + r) + 'Q' + x + ' ' + yTop + ' ' + (x + r) + ' ' + yTop + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + yTop + ' ' + (x + w) + ' ' + (yTop + r) + 'V' + y0 + 'Z"/>';
  }
  function bindDash() {
    var ms = $('#monthSel'); if (ms) ms.addEventListener('change', function () { S.settings.month = this.value; saveSettings(); render(); });
    var pc = $('#payChart'); if (!pc || !lastDash) return;
    var tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; pc.appendChild(tip);
    pc.addEventListener('mousemove', function (e) {
      var t = e.target.closest('.hit'); if (!t) { tip.hidden = true; return; }
      var m = lastDash.months[+t.getAttribute('data-i')], prev = lastDash.months[+t.getAttribute('data-i') - 1];
      tip.innerHTML = '<b>Tháng ' + HR.ymLabel(m.ym) + '</b><div><span>Tổng thu nhập</span><span class="num">' + fmtInt(m.gross) + ' đ</span></div><div><span>Thực lĩnh</span><span class="num">' + fmtInt(m.net) + ' đ</span></div><div><span>Số người</span><span class="num">' + m.people + '</span></div>' + (prev ? '<div><span>So với tháng trước</span><span class="num">' + fmtPct((m.gross - prev.gross) / prev.gross * 100) + '</span></div>' : '');
      tip.hidden = false;
      var r = pc.getBoundingClientRect(), x = e.clientX - r.left + 14, yv = e.clientY - r.top - 10;
      if (x + 200 > r.width) x = e.clientX - r.left - 214;
      tip.style.left = x + 'px'; tip.style.top = yv + 'px';
    });
    pc.addEventListener('mouseleave', function () { tip.hidden = true; });
    pc.addEventListener('click', function (e) { var t = e.target.closest('.hit'); if (!t) return; S.settings.month = lastDash.months[+t.getAttribute('data-i')].ym; saveSettings(); render(); });
  }

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
    function onKey(e) { if (e.key === 'Escape') close(); }
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    bg.close = close;
    var f = bg.querySelector('input,select,button'); if (f) setTimeout(function () { f.focus(); }, 30);
    return bg;
  }

  /* ---------------- Ô ngày dd/mm/yyyy ---------------- */
  function dateInput(id, iso) { return '<span class="datebox"><input class="input" id="' + id + '" inputmode="numeric" placeholder="dd/mm/yyyy" maxlength="10" value="' + (iso ? HR.vnDate(iso) : '') + '"></span>'; }
  function bindDateInput(el) {
    el.addEventListener('input', function () {
      var v = el.value.replace(/[^\d]/g, '').slice(0, 8), o = v;
      if (v.length > 4) o = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4); else if (v.length > 2) o = v.slice(0, 2) + '/' + v.slice(2);
      el.value = o; el.classList.toggle('bad', o.length === 10 && !HR.parseVn(o));
    });
  }

  /* ---------------- Hộp ngày tham chiếu ---------------- */
  function openRefModal() {
    var st = S.settings;
    var body = '<p class="muted">Mọi số liệu "sắp hết hạn", "đang làm", "đã qua ngày nghỉ"… được tính theo ngày này. Mặc định là ngày hôm nay của máy; khi xem lại dữ liệu cũ (hoặc dữ liệu mẫu), chọn ngày cố định để số liệu đúng như tại thời điểm đó.</p>' +
      '<label class="radio"><input type="radio" name="refm" value="today"' + (st.refMode === 'today' ? ' checked' : '') + '> Hôm nay (' + HR.vnDate(HR.isoToday()) + ')</label>' +
      '<label class="radio"><input type="radio" name="refm" value="fixed"' + (st.refMode === 'fixed' ? ' checked' : '') + '> Ngày cố định: ' + dateInput('refIn', st.refDate) + '</label>' +
      (S.units.some(function (u) { return u.source === 'sample'; }) ? '<button class="btn btn-sm" id="refSample" style="align-self:flex-start">Dùng ngày chốt dữ liệu mẫu (31/10/2026)</button>' : '') +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="refSave">Áp dụng</button></div>';
    var m = modal('Ngày tham chiếu', '', body, true), inp = $('#refIn', m);
    bindDateInput(inp);
    inp.addEventListener('focus', function () { $('input[value="fixed"]', m).checked = true; });
    var sb = $('#refSample', m); if (sb) sb.addEventListener('click', function () { inp.value = '31/10/2026'; $('input[value="fixed"]', m).checked = true; });
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
    var body = '<p class="muted">Mỗi đơn vị (công ty mẹ, công ty con, chi nhánh) là một thư mục dữ liệu riêng. Thanh trên cùng có ô chọn đơn vị, chọn "Tất cả đơn vị" để xem gộp.</p>' +
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
    h += '<div class="card card-pad"><div class="card-head"><div><h3>Đơn vị</h3><p>Đổi tên hiển thị, quét lại hoặc gỡ đơn vị khỏi phần mềm (file Excel không bị ảnh hưởng).</p></div><button class="btn btn-sm" data-act="add-unit">+ Thêm đơn vị</button></div>' +
      (S.units.length ? S.units.map(function (u) {
        return '<div class="unit-row"><div class="grow"><input class="input" data-rename="' + u.id + '" value="' + esc(u.name) + '" aria-label="Tên đơn vị"><div class="faint" style="font-size:12px;margin-top:4px">' + esc(srcLabel(u)) + (u.scannedAt ? ' · quét lúc ' + esc(u.scannedAt) : '') + '</div></div>' +
          (u.source === 'folder' ? '<button class="btn btn-sm" data-act="rescan" data-id="' + u.id + '">Quét lại</button>' : '') +
          '<button class="btn btn-sm" data-act="del-unit" data-id="' + u.id + '">Gỡ</button></div>';
      }).join('') : '<p class="muted">Chưa có đơn vị nào.</p>') + '</div>';
    // Ngày tham chiếu + ngưỡng
    h += '<div class="card card-pad"><div class="card-head"><div><h3>Ngày tham chiếu &amp; ngưỡng</h3><p>Ngày dùng để tính mọi cảnh báo và số liệu.</p></div></div>' +
      '<dl class="kv"><dt>Tính số liệu đến</dt><dd><b>' + HR.vnDate(refDate()) + '</b> ' + (st.refMode === 'today' ? '(hôm nay)' : '(ngày cố định)') + ' <button class="btn btn-sm" id="refEdit" style="margin-left:6px">Đổi</button></dd>' +
      '<dt>Giao diện</dt><dd><select class="input" id="themeSel" style="width:auto"><option value="auto">Theo máy</option><option value="light">Sáng</option><option value="dark">Tối</option></select></dd></dl></div>';
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
    var th = $('#themeSel'); if (th) { th.value = S.settings.theme || 'auto'; th.addEventListener('change', function () { S.settings.theme = th.value; applyTheme(); saveSettings(); }); }
  }
  function applyTheme() { var t = S.settings.theme; if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  function delUnit(id) {
    var u = S.units.filter(function (x) { return x.id === id; })[0]; if (!u) return;
    var m = modal('Gỡ đơn vị "' + u.name + '"?', '', '<p>Dữ liệu của đơn vị này sẽ bị xóa khỏi phần mềm. File Excel trong thư mục không bị ảnh hưởng; muốn xem lại chỉ cần chọn lại thư mục.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="delOk">Gỡ đơn vị</button></div>', true);
    $('#delOk', m).addEventListener('click', function () {
      S.units = S.units.filter(function (x) { return x.id !== id; });
      if (S.settings.unit === id) S.settings.unit = S.units.length > 1 ? 'all' : (S.units[0] ? S.units[0].id : 'all');
      log('Gỡ đơn vị "' + u.name + '"'); saveUnits(); saveSettings(); m.close(); toast('Đã gỡ đơn vị', 'ok'); render();
    });
  }
  function openResetModal() {
    var m = modal('Xóa toàn bộ dữ liệu?', '', '<p>Thao tác này <b>không hoàn tác được</b>: xóa mọi dữ liệu đã nạp (' + S.units.length + ' đơn vị), thư mục đã nhớ, cài đặt và nhật ký trong trình duyệt. File Excel trên máy không bị động tới.</p>' +
      '<div class="field"><label for="rsIn">Gõ chữ XOA để xác nhận</label><input class="input" id="rsIn" autocomplete="off"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-danger" id="rsOk" disabled>Xóa toàn bộ</button></div>', true);
    var inp = $('#rsIn', m), ok = $('#rsOk', m);
    inp.addEventListener('input', function () { ok.disabled = inp.value.trim().toUpperCase() !== 'XOA'; });
    ok.addEventListener('click', function () {
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

  /* ---------------- Vẽ trang ---------------- */
  function render() {
    var p = (location.hash || '#dash').slice(1) || 'dash';
    if (!NAV.some(function (n) { return n.id === p; })) p = 'dash';
    curPage = p;
    var html;
    try {
      var mm = modOf(p);
      if (isSoon(mm)) html = pageSoon(p);
      else if (p === 'ccwifi') html = pageCcWifi();
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
      if (r[0]) { S.settings = Object.assign({}, DEF, r[0]); S.settings.cfg = Object.assign({}, HRR.DEF, r[0].cfg || {}, r[0].contractDays ? { contractDays: r[0].contractDays } : {}); }
      if (r[3]) S.done = r[3];
      if (r[1]) S.units = r[1];
      if (r[2]) LOG = r[2];
    }).catch(function (e) { DB_OK = false; logErr('Mở bộ nhớ trình duyệt', e); }).then(function () {
      applyTheme();
      log('===== Mở phần mềm =====');
      log('Phiên bản ' + APP_VER + ' | Trình duyệt: ' + navigator.userAgent + ' | Địa chỉ: ' + location.origin + location.pathname);
      log('Thiết lập: ' + S.units.length + ' đơn vị [' + S.units.map(function (u) { return u.name + ' – ' + srcLabel(u); }).join('; ') + ']; ngày tham chiếu = ' + (S.settings.refMode === 'today' ? 'hôm nay' : HR.vnDate(S.settings.refDate)) + '; HĐ sắp hết hạn trong ' + cfg().contractDays + ' ngày; ghi nhớ thư mục: ' + (CAN_PICK ? 'có' : 'không'));
      render();
    });
  }
  boot();
})();
