  /* =====================================================================
     MODULE TUYỂN DỤNG (bản 0.5.1 – NHÁNH RIÊNG, bắt đầu 09/11/2026)
     Anh Tuấn chốt 09/11 16:04: làm đủ rồi anh xem 1 lượt; làm song song Module Lương nên để ở nhánh
     nguon/_nhanh-tuyen-dung/ – chưa tích hợp vào nguon/src. Toàn bộ module nằm trong file này
     (chèn sau phần Lương khi build) để khi ghép chỉ cần thêm 1 file + 1 dòng build.
       1) Nhu cầu tuyển dụng – phiếu do admin lập (không qua cấp duyệt), bật/tắt "Hiện trên cổng"
       2) Cổng tuyển dụng – trang mẫu danh sách vị trí + trang chi tiết vị trí + form ứng tuyển gửi CV.
          Chưa có máy chủ: bản xem trước chạy trong phần mềm, hồ sơ gửi thử đổ thẳng vào Ứng viên trên máy này.
          Phần kết nối Cloudflare để sau (form "Kết nối máy chủ" đã dựng sẵn) – thiết kế ở may-chu/THIET-KE-KET-NOI.md
       3) Ngân hàng ứng viên – các bước, lịch phỏng vấn, phiếu đánh giá, 3 biểu mẫu thư
          (mời phỏng vấn · mời nhận việc · cảm ơn & thông báo chưa trúng tuyển), chuyển ứng viên thành nhân sự
       4) Mời nhận việc – theo dõi thư mời, trả lời, ngày đi làm, chuyển hồ sơ, lập HĐ thử việc
     Căn cứ (đã đối chiếu văn bản gốc trong "Văn bản pháp lý"): BLLĐ 45/2019/QH14 Điều 3 khoản 8, Điều 8, 11, 16, 17, 24–27;
     Luật Việc làm 74/2025/QH15 Điều 5. Dữ liệu cá nhân ứng viên: Luật 91/2025/QH15 (chưa trích điều cụ thể).
     Dữ liệu lưu trong u.td (theo từng công ty, lưu cùng dữ liệu công ty trong trình duyệt); CV lưu ở kho file (kho: 'cv').
     ===================================================================== */
  var TD_SEED = '2026-11-09a', TDV = 0, TDA = { key: null, list: [] };
  var TD_STG = [['new', 'Mới nhận'], ['screen', 'Sàng lọc'], ['iv', 'Phỏng vấn'], ['hold', 'Công ty cân nhắc'], ['offer', 'Mời nhận việc'], ['hired', 'Đồng ý nhận việc'], ['ivcancel', 'Hủy phỏng vấn'], ['fail', 'Chưa phù hợp'], ['withdraw', 'Rút hồ sơ']]; // 11/11 18:04: thêm Công ty cân nhắc, Hủy phỏng vấn
  var TD_STN = {}; TD_STG.forEach(function (s) { TD_STN[s[0]] = s[1]; });
  var TD_LIVE = ['new', 'screen', 'iv', 'hold', 'offer', 'hired'];
  function tdClosedSt(s) { return s === 'fail' || s === 'withdraw' || s === 'ivcancel'; }
  var TD_RST = { draft: 'Nháp', open: 'Đang tuyển', paused: 'Tạm dừng', filled: 'Đã đủ người', closed: 'Đã đóng' };
  var TD_REASON = ['Thay người nghỉ việc', 'Bổ sung theo định biên', 'Mở rộng, thêm vị trí mới', 'Thời vụ', 'Khác'];
  var TD_LD = ['Toàn thời gian', 'Bán thời gian', 'Cộng tác viên'];
  // BLLĐ 2019 Điều 25 – thời gian thử việc tối đa theo loại công việc
  var TD_PROB = [['ql', 'Người quản lý doanh nghiệp', 180, 'ngày', 'khoản 1'], ['cd', 'Công việc cần trình độ từ cao đẳng trở lên', 60, 'ngày', 'khoản 2'], ['tc', 'Trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ', 30, 'ngày', 'khoản 3'], ['khac', 'Công việc khác', 6, 'ngày làm việc', 'khoản 4']];
  var TD_SRC = ['Cổng tuyển dụng', 'Fanpage công ty', 'Nhóm Facebook / Zalo', 'Trang việc làm', 'Người quen giới thiệu', 'Khác'];
  var TD_MODE = ['Trực tiếp tại công ty', 'Trực tuyến (Google Meet / Zoom)', 'Qua điện thoại'];
  var TD_CRIT0 = ['Chuyên môn, kỹ năng', 'Kinh nghiệm liên quan', 'Giao tiếp', 'Thái độ, tinh thần', 'Phù hợp văn hóa công ty'];
  var TD_COLORS = ['#1F5F8B', '#2E7D57', '#8A4B9C', '#B4562B', '#2B6F77'];
  var TD_LT = { pv: 'Thư mời phỏng vấn', nv: 'Thư mời nhận việc', tc: 'Thư cảm ơn & thông báo chưa trúng tuyển', dl: 'Thư thông báo dời lịch phỏng vấn' };
  var TD_CV_MAX = 5 * 1024 * 1024;
  var TD_SCORE = false; // 11/11 16:29 anh: tạm bỏ tiêu chí đánh giá, chấm điểm ở giai đoạn này (dữ liệu điểm cũ vẫn giữ, bật lại = true)

  // Menu: 4 tính năng Tuyển dụng chạy được; "Tin tuyển dụng" đổi thành "Cổng tuyển dụng" (anh chốt 09/11: trang cổng + trang vị trí)
  MODS.forEach(function (m) { if (m.g === 'td') m.st = 'ok'; if (m.id === 'tdtin') { m.t = 'Cổng tuyển dụng'; m.k += ' cong tuyen dung trang chi tiet vi tri link chia se ung tuyen cv'; } if (m.id === 'tdungvien') m.k += ' thu moi phong van thu cam on chuyen nhan vien'; });
  // 11/11 (anh 15:45): thứ tự Tuyển dụng – Nhu cầu → Ngân hàng ứng viên → Lịch phỏng vấn → Kết quả phỏng vấn (đổi tên từ Mời nhận việc) → Cổng tuyển dụng
  (function () {
    var get = function (id) { return MODS.filter(function (m) { return m.id === id; })[0]; };
    if (!get('tdlich')) MODS.push({ id: 'tdlich', g: 'td', t: 'Lịch phỏng vấn', st: 'ok', k: 'lich phong van thang hen phong van ung vien' });
    get('tdungvien').t = 'Ngân hàng ứng viên'; get('tdungvien').k += ' ngan hang ung vien du lieu data'; get('tdmoi').t = 'Kết quả phỏng vấn'; get('tdmoi').k += ' ket qua phong van thu moi nhan viec thu cam on bieu mau';
    var items = ['tdnhucau', 'tdungvien', 'tdlich', 'tdmoi', 'tdtin'].map(get), first = MODS.indexOf(get('tdnhucau'));
    for (var i = MODS.length - 1; i >= 0; i--) if (MODS[i].g === 'td') MODS.splice(i, 1);
    MODS.splice.apply(MODS, [Math.min(first, MODS.length), 0].concat(items));
  })();
  Object.assign(IC, {
    tdlich: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>',
    td_search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    td_list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    td_cols: '<rect x="3.5" y="4" width="5" height="16" rx="1.2"/><rect x="10" y="4" width="5" height="10" rx="1.2"/><rect x="16.5" y="4" width="4" height="13" rx="1.2"/>',
    td_plus: '<path d="M12 5v14M5 12h14"/>',
    td_mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    td_copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    td_cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    td_link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    td_user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    td_print: '<path d="M7 9V3.5h10V9M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2"/><rect x="7" y="14" width="10" height="6.5" rx="1"/>',
    td_pc: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>',
    td_phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    td_full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    td_star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    td_trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/>',
    td_edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    td_arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    td_srv: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>'
  });
  Object.assign(HRR.KINDS, {
    td_iv: { name: 'Lịch phỏng vấn', law: '' },
    td_new: { name: 'Hồ sơ ứng viên chờ xem', law: '' },
    td_offer: { name: 'Thư mời nhận việc quá hạn trả lời', law: '' },
    td_start: { name: 'Người mới sắp đi làm chưa có hồ sơ', law: 'BLLĐ 2019 Điều 13, 16' },
    td_dead: { name: 'Tin tuyển dụng quá hạn nhận hồ sơ', law: '' },
    td_fair: { name: 'Tin tuyển dụng có từ ngữ cần xem lại', law: 'BLLĐ 2019 Điều 3 khoản 8, Điều 8, 11, 17; Luật Việc làm 2025 Điều 5' },
    td_keep: { name: 'Hồ sơ ứng viên quá thời hạn lưu', law: 'Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (chưa trích điều)' },
    td_policy: { name: 'Cổng tuyển dụng chưa có chính sách dữ liệu', law: 'Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (chưa trích điều)' }
  });

  /* ---------------- Tiện ích ---------------- */
  function tdAdd(iso, n) { var d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function tdDiff(a, b) { var x = HR.dnum(a), y = HR.dnum(b); return x === null || y === null ? null : y - x; } // b − a (ngày)
  function tdNow() { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function tdVnAt(s) { if (!s) return ''; var d = String(s).slice(0, 10); return vn(d) + (String(s).length > 10 ? ' ' + String(s).slice(11, 16) : ''); }
  function tdSlug(s) { return HR.stripAcc(String(s || '')).replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'vi-tri'; }
  function tdMoney(v) { return v ? fmtInt(v) : ''; }
  function tdMil(v) { if (!v) return ''; var m = v / 1e6; return (Math.round(m * 10) / 10).toString().replace('.', ',') + ' triệu'; }
  function tdLines(s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.replace(/^\s*[-•+*·]\s*/, '').trim(); }).filter(Boolean); }
  function tdPhone(s) { return String(s || '').replace(/[\s.\-()]/g, '').replace(/^\+84/, '0'); }
  function tdPhoneFmt(s) { var p = tdPhone(s); return /^0\d{9}$/.test(p) ? p.slice(0, 4) + ' ' + p.slice(4, 7) + ' ' + p.slice(7) : String(s || ''); }
  function tdCopy(txt, what) {
    function ok() { toast('Đã sao chép ' + (what || 'nội dung'), 'ok', 'Dán (Ctrl V) vào nơi cần đăng hoặc gửi.'); }
    function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Chưa sao chép được', 'err', 'Bôi đen nội dung rồi bấm Ctrl C.'); } ta.remove(); }
    try { if (navigator.clipboard && window.isSecureContext !== false) navigator.clipboard.writeText(txt).then(ok, fb); else fb(); } catch (e) { fb(); }
  }
  function tdCfg0(u) {
    var nm = String(u.name || '').replace(/\s*\(dữ liệu mẫu\)\s*$/i, ''), i = Math.max(0, S.units.indexOf(u));
    return { name: nm, short: shortUnit(nm), tag: 'Cùng nhau làm việc tử tế, phát triển bền vững', intro: '', addr: '', email: '', phone: '', contact: 'Bộ phận Tuyển dụng', policy: '', keep: 6, color: TD_COLORS[i % TD_COLORS.length],
      why: ['Môi trường làm việc rõ ràng, được hướng dẫn từ ngày đầu', 'Đóng bảo hiểm đầy đủ theo quy định', 'Lộ trình phát triển theo năng lực'], crit: TD_CRIT0.slice(), tpl: {}, slug: tdSlug(shortUnit(nm)), srv: { url: '', key: '' }, steps: 'Nhận và xem hồ sơ\nPhỏng vấn\nThông báo kết quả, gửi thư mời nhận việc\nKý hợp đồng và bắt đầu làm việc' };
  }
  /* Trang "Về chúng tôi" trên cổng (11/11 19:37 anh: tách thành trang con riêng, thiết lập trong phần mềm, có văn bản mẫu sửa được).
     Văn bản mẫu viết chung, không nêu số liệu, năm thành lập hay thành tích – công ty tự sửa cho đúng thực tế. Con số (nhân sự, phòng ban, vị trí đang tuyển) lấy từ dữ liệu phần mềm. */
  function tdAbout0(u) {
    var sh = shortUnit(String(u.name || '').replace(/\s*\(dữ liệu mẫu\)\s*$/i, ''));
    return { story: 'Tại ' + sh + ', chúng tôi tin rằng một tổ chức tốt bắt đầu từ những con người được tôn trọng và được tạo điều kiện để làm tốt công việc của mình. Mỗi ngày, đội ngũ cùng nhau phục vụ khách hàng tận tâm, làm việc rõ ràng và giữ lời hứa.',
      mission: 'Mang đến cho khách hàng sản phẩm, dịch vụ chất lượng bằng sự tử tế và chuyên nghiệp; tạo môi trường để mỗi thành viên được học hỏi, phát triển và gắn bó lâu dài.',
      values: 'Tử tế: Tôn trọng khách hàng, đồng nghiệp và đối tác trong mọi việc\nTrách nhiệm: Nói được, làm được; chủ động nhận việc và làm đến cùng\nHọc hỏi: Mỗi ngày tốt hơn một chút, sẵn sàng chia sẻ điều mình biết\nMinh bạch: Quy định, lương thưởng, đánh giá rõ ràng',
      env: 'Người mới được hướng dẫn từ ngày đầu và có người phụ trách kèm cặp. Công việc có mô tả và tiêu chí rõ ràng; quản lý lắng nghe, góp ý thẳng thắn và hỗ trợ khi cần.',
      perks: 'Ký hợp đồng lao động, đóng BHXH, BHYT, BHTN theo quy định\nNghỉ phép năm, nghỉ lễ tết hưởng lương theo Bộ luật Lao động\nXem xét điều chỉnh lương theo năng lực và kết quả công việc\nĐược đào tạo, hướng dẫn hội nhập khi mới vào',
      stats: true };
  }
  function tdOf(u) {
    if (!u.td) u.td = { v: 1, rq: [], cd: [], cfg: tdCfg0(u) };
    var t = u.td; if (!t.cfg) t.cfg = tdCfg0(u); if (!t.rq) t.rq = []; if (!t.cd) t.cd = []; if (!t.cfg.ab) t.cfg.ab = tdAbout0(u);
    if (u.source === 'sample' && t.seed !== TD_SEED) { try { tdSeed(u); } catch (e) { logErr('Tạo dữ liệu mẫu tuyển dụng', e); } }
    return t;
  }
  function tdSave(u, txt) { TDV++; TDA.key = null; if (txt) log('Tuyển dụng [' + u.name + ']: ' + txt); saveUnits(); }
  function tdReq(u, id) { return tdOf(u).rq.filter(function (r) { return r.id === id; })[0]; }
  function tdCand(u, id) { return tdOf(u).cd.filter(function (c) { return c.id === id; })[0]; }
  function tdNext(list, pre, w) { var mx = 0; list.forEach(function (x) { var m = new RegExp('^' + pre + '(\\d+)$').exec(x.id || ''); if (m) mx = Math.max(mx, +m[1]); }); var n = String(mx + 1); while (n.length < w) n = '0' + n; return pre + n; }
  function tdHist(c, txt) { (c.hist = c.hist || []).unshift({ at: tdNow(), txt: txt }); }
  function tdCandsOf(u, rq) { return tdOf(u).cd.filter(function (c) { return !rq || c.rq === rq; }); }
  function tdHiredCount(u, r) { return tdCandsOf(u, r.id).filter(function (c) { return c.stage === 'hired'; }).length; }
  function tdUnitsAll() { var us = selUnits(); us.forEach(tdOf); return us; }
  /* Cổng tuyển dụng – máy chủ THỬ NGHIỆM recruit.quantritute.com (11/11 19:32 anh chốt: bản thử, đổi link sang recruit.quantritute.com, không dùng R2).
     Mỗi trình duyệt có mã cổng (tok, nằm trong link) + khóa bí mật (key) lưu ở cfg.thu; link sống 24 giờ kể từ lần đưa lên gần nhất. */
  var TD_THU = window.QTT_TD_THU || 'https://recruit.quantritute.com', TD_THU_TTL = 24 * 3600 * 1000;
  function tdThu(u) { var x = tdOf(u).cfg.thu; return x && x.tok && x.at && Date.now() - x.at < TD_THU_TTL - 60000 ? x : null; }
  function tdPortalLink(u, r) { var c = tdOf(u).cfg, th = tdThu(u); return (th ? TD_THU + '/t/' + th.tok + '/' : TD_THU + '/') + c.slug + (r ? '/' + r.slug : ''); }
  function tdRand(n) { var a = new Uint8Array(n), s = 'abcdefghijklmnopqrstuvwxyz0123456789'; crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return s[x % 36]; }).join(''); }
  function tdThuPush(u, again) {
    var cf = tdOf(u).cfg; if (!cf.thu || !cf.thu.tok || !cf.thu.key) cf.thu = { tok: tdRand(10), key: tdRand(32) };
    var th = cf.thu, D = tdPortalData(u, 'live'); D.api = TD_THU; D.tok = th.tok; D.thu = 1; D.base = TD_THU + '/t/' + th.tok + '/' + cf.slug;
    return fetch(TD_THU + '/api/cong', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tok: th.tok, key: th.key, slug: cf.slug, ten: cf.short, html: tdPortalHtml(D, {}), jobs: D.jobs.map(function (j) { return j.slug; }) }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 403 && !again) { cf.thu = null; return tdThuPush(u, true); }
        if (!r.ok || !j.ok) throw new Error(j.msg || ('Máy chủ trả lỗi ' + r.status));
        th.at = Date.now(); th.exp = j.het_han; tdSave(u, 'Đưa cổng tuyển dụng lên máy chủ thử (' + D.jobs.length + ' vị trí)'); tdThuTimer(); return j; }); });
  }
  // Lấy hồ sơ ứng viên nộp trên cổng thử về Ngân hàng ứng viên (kèm CV), lấy xong máy chủ xóa ngay
  var TD_PULLING = {};
  function tdThuPull(u, quiet) {
    var th = tdThu(u); if (!th) { if (!quiet) toast('Cổng thử chưa bật', 'info', 'Bấm Mở link hoặc Đưa vị trí lên cổng trước.'); return Promise.resolve(0); }
    if (TD_PULLING[u.id]) return TD_PULLING[u.id];
    var q = '?tok=' + th.tok + '&key=' + th.key;
    var pr = fetch(TD_THU + '/api/cong/ho-so' + q, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.msg || 'Không lấy được hồ sơ');
      var got = [], s = Promise.resolve();
      (j.ds || []).forEach(function (h) { s = s.then(function () {
        return fetch(TD_THU + '/api/cong/cv' + q + '&ma=' + encodeURIComponent(h.ma)).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).catch(function () { return null; })
          .then(function (buf) { return tdImportApp(u, h.d, buf ? { name: h.cv.name, type: h.cv.type, size: buf.byteLength, buf: buf } : null, 'cong-thu', h.ma); })
          .then(function (c) { got.push(h.ma); if (c) toast('Có hồ sơ mới từ cổng tuyển dụng: ' + c.name, 'ok', (tdReq(u, c.rq) || {}).pos + ' · đã vào Ngân hàng ứng viên' + (c.cv ? ', kèm CV' : '')); });
      }); });
      return s.then(function () { if (got.length) return fetch(TD_THU + '/api/cong/da-lay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tok: th.tok, key: th.key, ma: got }) }).catch(function () { }); })
        .then(function () { if (got.length) { renderNav(); if (/^td/.test(curPage)) render(); } else if (!quiet) toast('Chưa có hồ sơ mới trên cổng', 'info', ''); return got.length; });
    }).catch(function (e) { if (!quiet) toast('Chưa lấy được hồ sơ từ cổng', 'warn', String(e && e.message || e)); logErr('Lấy hồ sơ cổng thử', e); return 0; })
      .then(function (n) { delete TD_PULLING[u.id]; return n; });
    TD_PULLING[u.id] = pr; return pr;
  }
  // Tự lấy hồ sơ mỗi 45 giây khi đang mở phần mềm và cổng thử còn hạn (ứng viên nộp trên điện thoại → hiện ngay trên phần mềm)
  var TD_TIMER = null;
  function tdThuTimer() { if (TD_TIMER) return; TD_TIMER = setInterval(function () { if (document.visibilityState !== 'visible') return; var any = 0; (S.units || []).forEach(function (u) { if (u.td && tdThu(u)) { any = 1; tdThuPull(u, true); } }); if (!any) { clearInterval(TD_TIMER); TD_TIMER = null; } }, 45000); }
  function tdLive(r, R) { return r.st === 'open' && r.pub && (!r.deadline || r.deadline >= R); }
  function tdEndAt(c) { if (c.endAt) return c.endAt; var l = (c.letters || []).filter(function (x) { return x.t === 'tc'; })[0]; return l ? String(l.at).slice(0, 10) : c.at; }
  function tdKeepUntil(u, c) { var k = +tdOf(u).cfg.keep || 6, d = new Date(tdEndAt(c) + 'T00:00:00'); d.setMonth(d.getMonth() + k); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function tdUnitPick(us, cur) { return us.length > 1 ? '<div class="field" style="max-width:340px"><label for="tdU">Công ty</label><select class="input" id="tdU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), cur); }).join('') + '</select></div>' : ''; }
  function tdCo(u) { return isMulti() ? '<span class="tag tag-mute">' + esc(shortUnit(u.name)) + '</span>' : ''; }
  function tdIni(n) { var w = String(n || '').trim().split(/\s+/); return (w[w.length - 1] || '?').charAt(0).toUpperCase(); }

  /* ---------------- Kiểm tra từ ngữ tin tuyển dụng (BLLĐ 2019 Điều 3 khoản 8 · Điều 8 · Điều 11 · Điều 17; Luật Việc làm 2025 Điều 5) ---------------- */
  var TD_FAIR = [
    [/(giới tính\s*[:\-–]?\s*(nam|nữ)\b)|((ưu tiên|chỉ tuyển|chỉ nhận|tuyển|cần)\s+(nam|nữ)\b(?!\s*(và|\/|,)\s*(nữ|nam)))|(^|\n)\s*[-•+*]?\s*(nam|nữ)\s*(,|\.|;|\n|$)|\b(nữ|nam)\s+(giới|tuổi|từ\s+\d|dưới|trên)/i, 'giới tính', 'Điều 3 khoản 8 BLLĐ 2019 liệt kê giới tính là căn cứ không được phân biệt.'],
    [/(dưới|trên|không quá|tối đa|từ)\s*\d{2}\s*tuổi|tuổi\s*(từ\s*)?\d{2}\s*(-|–|đến|tới)\s*\d{2}|độ tuổi|\d{2}\s*(-|–|đến)\s*\d{2}\s*tuổi/i, 'độ tuổi', 'Điều 3 khoản 8 BLLĐ 2019 liệt kê độ tuổi là căn cứ không được phân biệt (trừ giới hạn tuổi lao động theo luật).'],
    [/ngoại hình|ưa nhìn|xinh|chiều cao|cân nặng|vóc dáng|dáng chuẩn/i, 'ngoại hình', 'Chỉ nêu khi là yêu cầu đặc thù của công việc và ghi rõ lý do.'],
    [/chưa (lập gia đình|kết hôn|có con)|độc thân|không (mang thai|có thai)|(cam kết )?không sinh con|đã có gia đình/i, 'tình trạng hôn nhân, thai sản', 'Điều 3 khoản 8 BLLĐ 2019: tình trạng hôn nhân, thai sản, trách nhiệm gia đình là căn cứ không được phân biệt.'],
    [/hộ khẩu|quê (ở|tại)|người (miền|tỉnh)|không nhận người|dân tộc|tôn giáo|theo đạo/i, 'quê quán, dân tộc, tôn giáo', 'Điều 3 khoản 8 BLLĐ 2019: nguồn gốc xã hội, dân tộc, tôn giáo là căn cứ không được phân biệt.'],
    [/\bhiv\b|không (bị )?khuyết tật|lành lặn/i, 'khuyết tật, HIV', 'Điều 3 khoản 8 BLLĐ 2019.'],
    [/((nộp|đóng|thu)\s+(phí|lệ phí|tiền))|phí (hồ sơ|tuyển dụng|đào tạo ban đầu)|đặt cọc|tiền cọc|tiền (giữ chỗ|đồng phục)/i, 'thu tiền của ứng viên', 'Điều 11 khoản 2 BLLĐ 2019: người lao động không phải trả chi phí tuyển dụng; Điều 17 khoản 2: không được yêu cầu bảo đảm bằng tiền.'],
    [/(nộp|giữ|để lại)\s+(bản chính|bản gốc)|bằng gốc|cccd gốc/i, 'giữ giấy tờ bản chính', 'Điều 17 khoản 1 BLLĐ 2019: không được giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động.']
  ];
  function tdFair(r) {
    var txt = [r.pos, r.desc, r.reqs, r.bens, r.note].join('\n'), out = [];
    TD_FAIR.forEach(function (f) { var m = f[0].exec(txt); if (m) out.push({ what: f[1], hit: m[0].trim().replace(/^[-•+*\s]+/, ''), why: f[2] }); });
    return out;
  }
  function tdFairHtml(list) {
    if (!list.length) return '';
    return '<div class="notice warn td-fair">' + ic('info') + '<div><b>Tin có từ ngữ dễ bị coi là phân biệt đối xử hoặc trái quy định</b><ul>' + list.map(function (x) { return '<li>“' + esc(x.hit) + '” – ' + esc(x.what) + '. <span class="muted">' + esc(x.why) + '</span></li>'; }).join('') + '</ul><small>Phân biệt xuất phát từ yêu cầu đặc thù của công việc thì không bị xem là phân biệt đối xử (Điều 3 khoản 8 BLLĐ 2019) – nếu vậy, ghi rõ lý do trong tin.</small></div></div>';
  }

  /* ---------------- Mẫu thư ---------------- */
  var TD_TPL0 = {
    dl: { s: 'Thông báo dời lịch phỏng vấn – {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\n{Công ty} xin thông báo lịch phỏng vấn vị trí {Vị trí} của Anh/Chị được dời sang thời gian mới:\n\n• Thời gian mới: {Giờ phỏng vấn}, ngày {Ngày phỏng vấn}\n• Lịch cũ: {Lịch cũ}\n• Hình thức: {Hình thức phỏng vấn}\n• Địa điểm / đường dẫn: {Địa điểm phỏng vấn}\n• Người phỏng vấn: {Người phỏng vấn}\n\nChúng tôi xin lỗi vì sự thay đổi này. Nếu thời gian mới chưa phù hợp, Anh/Chị vui lòng phản hồi qua email này hoặc số {SĐT liên hệ} để chúng tôi sắp xếp lại.\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' },
    pv: { s: 'Thư mời phỏng vấn – {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\n{Công ty} cảm ơn Anh/Chị đã quan tâm và gửi hồ sơ ứng tuyển vị trí {Vị trí}. Sau khi xem hồ sơ, chúng tôi trân trọng mời Anh/Chị tham gia buổi phỏng vấn:\n\n• Thời gian: {Giờ phỏng vấn}, ngày {Ngày phỏng vấn}\n• Hình thức: {Hình thức phỏng vấn}\n• Địa điểm / đường dẫn: {Địa điểm phỏng vấn}\n• Người phỏng vấn: {Người phỏng vấn}\n\nKhi đến, Anh/Chị vui lòng mang theo bản sao CCCD và bản sao bằng cấp liên quan (không cần nộp bản chính). Công ty không thu bất kỳ khoản phí nào trong quá trình tuyển dụng.\n\nAnh/Chị vui lòng xác nhận tham gia qua email này hoặc số điện thoại {SĐT liên hệ}. Nếu cần đổi lịch, Anh/Chị cứ báo lại để chúng tôi sắp xếp.\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' },
    nv: { s: 'Thư mời nhận việc – {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\nCảm ơn Anh/Chị đã dành thời gian tham gia phỏng vấn. {Công ty} vui mừng thông báo Anh/Chị đã đạt yêu cầu và trân trọng mời Anh/Chị nhận việc với các thông tin sau:\n\n• Vị trí: {Vị trí} – {Phòng ban}\n• Ngày bắt đầu làm việc: {Ngày đi làm}\n• Địa điểm làm việc: {Địa điểm làm việc}\n• Thời gian làm việc: {Thời gian làm việc}\n• Hình thức: {Loại hợp đồng}\n• Thời gian thử việc: {Thời gian thử việc}\n• Lương trong thời gian thử việc: {Lương thử việc} đồng/tháng\n• Lương sau thử việc: {Lương chính thức} đồng/tháng\n• Chế độ khác: {Chế độ khác}\n\nNgày đầu đi làm, Anh/Chị vui lòng mang theo bản sao CCCD, bản sao bằng cấp và số tài khoản ngân hàng. Công ty chỉ đối chiếu bản chính rồi trả lại ngay, không giữ bản chính giấy tờ.\n\nThư này là lời mời nhận việc; hai bên sẽ ký hợp đồng trước khi Anh/Chị bắt đầu làm việc. Anh/Chị vui lòng phản hồi trước ngày {Hạn trả lời}.\n\nChào mừng Anh/Chị đến với {Công ty}!\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' },
    tc: { s: 'Cảm ơn Anh/Chị đã ứng tuyển vị trí {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\n{Công ty} chân thành cảm ơn Anh/Chị đã quan tâm và dành thời gian cho vị trí {Vị trí}.\n\nSau khi cân nhắc kỹ, chúng tôi rất tiếc chưa thể mời Anh/Chị nhận việc ở đợt tuyển dụng này. Kết quả này chỉ phản ánh mức độ phù hợp với yêu cầu hiện tại của vị trí, không phải đánh giá về năng lực chung của Anh/Chị.\n\nVới sự đồng ý của Anh/Chị khi nộp hồ sơ, chúng tôi lưu hồ sơ đến ngày {Hạn lưu hồ sơ} để liên hệ khi có vị trí phù hợp. Nếu Anh/Chị muốn xóa hồ sơ sớm hơn, vui lòng phản hồi email này hoặc gửi yêu cầu tới {Email liên hệ}.\n\nChúc Anh/Chị sớm tìm được công việc như mong muốn.\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' }
  };
  var TD_PH = ['Họ tên', 'Vị trí', 'Phòng ban', 'Công ty', 'Ngày phỏng vấn', 'Giờ phỏng vấn', 'Hình thức phỏng vấn', 'Địa điểm phỏng vấn', 'Người phỏng vấn', 'Lịch cũ', 'Ngày đi làm', 'Địa điểm làm việc', 'Thời gian làm việc', 'Loại hợp đồng', 'Thời gian thử việc', 'Lương thử việc', 'Lương chính thức', 'Chế độ khác', 'Hạn trả lời', 'Hạn lưu hồ sơ', 'Người liên hệ', 'SĐT liên hệ', 'Email liên hệ'];
  function tdTpl(u, t) { var x = tdOf(u).cfg.tpl[t]; return x && x.b ? x : TD_TPL0[t]; }
  function tdNextIv(c) { var l = (c.ivs || []).filter(function (v) { return v.st === 'plan'; }); return l[l.length - 1] || (c.ivs || [])[(c.ivs || []).length - 1] || null; }
  function tdVals(u, c) {
    var r = tdReq(u, c.rq) || {}, cf = tdOf(u).cfg, iv = tdNextIv(c) || {}, o = c.offer || {};
    var pk = TD_PROB.filter(function (p) { return p[0] === o.probKind; })[0];
    return { 'Họ tên': c.name, 'Vị trí': r.pos || '', 'Phòng ban': r.pb || '', 'Công ty': cf.name, 'Ngày phỏng vấn': iv.date ? vn(iv.date) : '…/…/……', 'Giờ phỏng vấn': iv.time || '…:…', 'Hình thức phỏng vấn': iv.mode || TD_MODE[0], 'Địa điểm phỏng vấn': iv.place || cf.addr || '…', 'Người phỏng vấn': iv.who || cf.contact, 'Lịch cũ': iv.old || '…',
      'Ngày đi làm': o.start ? vn(o.start) : '…/…/……', 'Địa điểm làm việc': o.place || r.place || cf.addr || '…', 'Thời gian làm việc': o.time || r.time || '…', 'Loại hợp đồng': o.hd || '…', 'Thời gian thử việc': o.probKind === 'none' ? 'Không thử việc' : (o.probDays ? o.probDays + ' ' + (pk ? pk[3] : 'ngày') : '…'),
      'Lương thử việc': o.probKind === 'none' ? 'không áp dụng' : (o.probSal ? fmtInt(o.probSal) : '…'), 'Lương chính thức': o.sal ? fmtInt(o.sal) : '…', 'Chế độ khác': o.other || 'Đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp theo quy định; nghỉ phép năm theo Bộ luật Lao động', 'Hạn trả lời': o.replyBy ? vn(o.replyBy) : '…/…/……',
      'Hạn lưu hồ sơ': vn(tdKeepUntil(u, c)), 'Người liên hệ': cf.contact, 'SĐT liên hệ': cf.phone || '…', 'Email liên hệ': cf.email || '…' };
  }
  function tdFill(s, v) { return String(s || '').replace(/\{([^{}]+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }

  /* ---------------- Dữ liệu mẫu (hư cấu, ngày tính theo hôm nay) ---------------- */
  function tdSeed(u) {
    var R = HR.isoToday(), D = function (n) { return tdAdd(R, n); }, edu = /edu/i.test((u.folder || '') + u.name), t = u.td;
    t.seed = TD_SEED; t.rq = []; t.cd = []; t.cfg = tdCfg0(u); var cf = t.cfg;
    cf.email = edu ? 'tuyendung@domsang-edu.example' : 'tuyendung@domsang-health.example'; cf.phone = edu ? '0901000200' : '0901000300';
    cf.addr = edu ? 'Số 12 phố Hoa Sữa, phường Mẫu, Hà Nội (địa chỉ mẫu)' : 'Lô B3 cụm công nghiệp Mẫu, xã Ánh Sáng, Hưng Yên (địa chỉ mẫu)';
    cf.policy = edu ? 'https://domsang-edu.example/chinh-sach-du-lieu' : ''; // Health cố ý để trống → nhắc ở Việc cần xử lý
    cf.contact = edu ? 'Nguyễn Thị Thu Hà – Kế toán trưởng, phụ trách nhân sự' : 'Trịnh Thị Kim Ngân – Kế toán kho, phụ trách nhân sự';
    cf.tag = edu ? 'Đào tạo nghề – học để làm được việc' : 'Thảo dược sạch cho sức khỏe mỗi ngày';
    cf.intro = edu ? 'Đốm Sáng Edu (công ty mẫu hư cấu) đào tạo nghề ngắn hạn và kỹ năng làm việc cho người đi làm. Đội ngũ nhỏ, làm việc trực tiếp với học viên và doanh nghiệp đối tác.' : 'Đốm Sáng Health (công ty mẫu hư cấu) nghiên cứu, sản xuất và phân phối sản phẩm thảo dược chăm sóc sức khỏe. Xưởng sản xuất đạt chuẩn vệ sinh, quy trình rõ ràng.';
    cf.why = edu ? ['Làm việc với học viên thật, thấy rõ giá trị công việc mỗi ngày', 'Được đào tạo nội bộ và tham gia miễn phí các khóa của công ty', 'Đóng bảo hiểm đầy đủ, nghỉ phép theo Bộ luật Lao động'] : ['Quy trình sản xuất rõ ràng, có người hướng dẫn tận nơi', 'Ca làm ổn định, có phụ cấp ăn trưa', 'Đóng bảo hiểm đầy đủ, thưởng theo sản lượng'];
    function rq(o) { o.slug = tdSlug(o.pos); o.at = o.at || D(-20) + ' 09:00'; o.upd = o.at; o.sl = o.sl || 1; o.owner = o.owner || cf.contact.split(' – ')[0]; t.rq.push(o); return o; }
    var cvJobs = [];
    function cd(r, name, ph, o) {
      var c = Object.assign({ id: tdNext(t.cd, 'UV', 4), rq: r.id, name: name, phone: ph, email: HR.stripAcc(name).toLowerCase().replace(/\s+/g, '.') + '@mail.example', src: 'Cổng tuyển dụng', stage: 'new', ivs: [], letters: [], hist: [], note: '' }, o);
      if (!c.consent && c.consent !== null) c.consent = { at: c.at + ' 20:15', ver: 'mẫu', how: c.src === 'Cổng tuyển dụng' ? 'Tích ô đồng ý trên cổng tuyển dụng' : 'Ứng viên đồng ý trong email gửi hồ sơ' };
      c.hist = (c.hist || []).concat([{ at: c.at + ' 20:15', txt: 'Nộp hồ sơ qua ' + c.src.toLowerCase() }]);
      t.cd.push(c); cvJobs.push(c); return c;
    }
    function ivDone(date, time, who, sc, res, note) { return { id: 'pv' + date + time, date: date, time: time, mode: TD_MODE[0], place: cf.addr, who: who, st: 'done', score: sc, res: res, note: note || '' }; }
    if (edu) {
      var e0 = rq({ id: 'TD001', pos: 'Kế toán viên (thay thế nghỉ thai sản)', pb: 'Phòng Kế toán', cd: 'Kế toán viên', reason: 'Thay người nghỉ việc', ld: 'Toàn thời gian', prob: 'cd', salMin: 9000000, salMax: 11000000, salShow: true, place: cf.addr, time: 'Thứ Hai – Thứ Sáu, 08:00–17:00', deadline: D(-230), needBy: D(-215), desc: 'Hạch toán chứng từ thu chi hằng ngày\nĐối chiếu công nợ học viên, đối tác', reqs: 'Tốt nghiệp cao đẳng trở lên chuyên ngành kế toán', bens: 'Lương thỏa thuận theo năng lực', st: 'closed', pub: false, at: D(-262) + ' 09:00' });
      var e1 = rq({ id: 'TD002', pos: 'Chuyên viên hành chính – nhân sự', pb: 'Phòng Kế toán', cd: 'Chuyên viên hành chính – nhân sự', reason: 'Thay người nghỉ việc', thay: 'DS003', ld: 'Toàn thời gian', prob: 'cd', salMin: 10000000, salMax: 13000000, salShow: true, place: cf.addr, time: 'Thứ Hai – Thứ Sáu, 08:00–17:00; sáng Thứ Bảy luân phiên', deadline: D(14), needBy: D(21), st: 'open', pub: true, at: D(-15) + ' 10:20',
        desc: 'Quản lý hồ sơ nhân sự, hợp đồng lao động, theo dõi ngày hết hạn\nTổng hợp chấm công, nghỉ phép hằng tháng, phối hợp kế toán làm lương\nLàm thủ tục tăng – giảm bảo hiểm xã hội\nTổ chức tuyển dụng, hội nhập người mới\nQuản lý văn phòng phẩm, lịch phòng học, hồ sơ hành chính',
        reqs: 'Tốt nghiệp cao đẳng trở lên các ngành quản trị nhân lực, luật, quản trị kinh doanh hoặc liên quan\nCó ít nhất 1 năm làm hành chính – nhân sự\nNắm được quy định cơ bản về hợp đồng lao động, bảo hiểm xã hội\nDùng thành thạo Excel, Word; cẩn thận, giữ bí mật thông tin',
        bens: 'Lương 10–13 triệu đồng/tháng theo năng lực, xét tăng lương mỗi năm\nĐóng BHXH, BHYT, BHTN đầy đủ từ khi ký hợp đồng lao động\n12 ngày phép năm, thưởng Tết, sinh nhật, du lịch hằng năm\nĐược học miễn phí các khóa kỹ năng của công ty' });
      var e2 = rq({ id: 'TD003', pos: 'Giảng viên kỹ năng giao tiếp (cộng tác theo khóa)', pb: 'Bộ phận Giảng viên', cd: 'Giảng viên cộng tác', reason: 'Mở rộng, thêm vị trí mới', ld: 'Cộng tác viên', prob: 'none', salMin: 0, salMax: 0, salShow: false, salTxt: 'Thù lao theo buổi dạy, thỏa thuận khi phỏng vấn', place: cf.addr + ' và lớp tại doanh nghiệp đối tác', time: 'Theo lịch lớp, chủ yếu tối các ngày trong tuần và cuối tuần', deadline: D(20), needBy: D(35), st: 'open', pub: true, at: D(-9) + ' 15:40', note: 'Định biên Bộ phận Giảng viên đang đủ 3 – vị trí cộng tác cho khóa mới tháng 12',
        desc: 'Giảng dạy khóa Kỹ năng giao tiếp nơi làm việc (8 buổi/khóa)\nChuẩn bị bài tập tình huống, chấm bài, nhận xét học viên\nPhối hợp Phòng Tuyển sinh tư vấn lộ trình học',
        reqs: 'Có ít nhất 2 năm giảng dạy hoặc đào tạo nội bộ về kỹ năng mềm\nGiọng nói rõ, biết tổ chức lớp học tương tác\nCó thể dạy tối hoặc cuối tuần',
        bens: 'Thù lao theo buổi, thanh toán cuối mỗi khóa\nĐược dùng giáo trình, tài liệu có sẵn của công ty\nCơ hội trở thành giảng viên chính thức' });
      rq({ id: 'TD004', pos: 'Nhân viên tư vấn tuyển sinh', pb: 'Phòng Tuyển sinh', cd: 'Nhân viên tư vấn tuyển sinh', reason: 'Mở rộng, thêm vị trí mới', ld: 'Toàn thời gian', prob: 'tc', salMin: 7000000, salMax: 9000000, salShow: true, place: cf.addr, time: 'Thứ Hai – Thứ Bảy, ca hành chính', deadline: D(30), needBy: D(45), st: 'draft', pub: false, at: D(-1) + ' 16:30', note: 'Nháp – Phòng Tuyển sinh đang vượt định biên (3/2), cần xem lại trước khi đăng',
        desc: 'Tư vấn khóa học qua điện thoại, tin nhắn fanpage\nChăm sóc học viên trong suốt khóa học',
        reqs: 'Nữ, tuổi từ 20 đến 28, ngoại hình ưa nhìn\nGiọng nói dễ nghe\nNộp phí hồ sơ 200.000 đồng khi phỏng vấn',
        bens: 'Lương cứng + thưởng theo số học viên' });
      cd(e0, 'Đinh Thu Hiền', '0901000210', { at: D(-250), edu: 'Đại học', exp: '3 năm kế toán dịch vụ', stage: 'fail', endAt: D(-232), ivs: [ivDone(D(-240), '09:00', 'Nguyễn Thị Thu Hà', { 0: 3, 1: 3, 2: 4, 3: 4, 4: 3 }, 'fail')], letters: [{ t: 'tc', at: D(-232) + ' 10:00', ch: 'Email' }] });
      cd(e0, 'Cao Bảo Ngọc', '0901000211', { at: D(-245), edu: 'Cao đẳng', exp: 'Mới tốt nghiệp', src: 'Trang việc làm', stage: 'fail', endAt: D(-235), letters: [{ t: 'tc', at: D(-235) + ' 10:05', ch: 'Email' }] });
      cd(e1, 'Nguyễn Minh Thư', '0901000201', { at: D(-12), yob: 1996, edu: 'Đại học', exp: '3 năm hành chính – nhân sự tại công ty giáo dục', stage: 'hired', starred: true,
        ivs: [ivDone(D(-6), '09:00', 'Nguyễn Thị Thu Hà – Kế toán trưởng', { 0: 4, 1: 5, 2: 4, 3: 5, 4: 4 }, 'pass', 'Nắm chắc quy trình hợp đồng, BHXH; giao tiếp tốt.')],
        offer: { sal: 12000000, probSal: 11000000, probKind: 'cd', probDays: 60, hd: 'Hợp đồng thử việc, sau đó hợp đồng lao động xác định thời hạn 12 tháng', start: D(7), replyBy: D(-1), place: cf.addr, time: e1.time, sentAt: D(-3) + ' 16:10', ans: 'yes', ansAt: D(-2) + ' 08:45' },
        letters: [{ t: 'pv', at: D(-8) + ' 14:20', ch: 'Email' }, { t: 'nv', at: D(-3) + ' 16:10', ch: 'Email' }],
        hist: [{ at: D(-2) + ' 08:45', txt: 'Đồng ý nhận việc, đi làm từ ' + vn(D(7)) }] });
      cd(e1, 'Trần Đức Anh', '0901000202', { at: D(-9), yob: 1994, edu: 'Đại học', exp: '2 năm nhân sự tổng hợp', stage: 'iv', src: 'Trang việc làm', ivs: [{ id: 'pv1', date: R, time: '14:00', mode: TD_MODE[0], place: cf.addr, who: 'Nguyễn Thị Thu Hà – Kế toán trưởng', st: 'plan' }], letters: [{ t: 'pv', at: D(-2) + ' 09:30', ch: 'Email' }] });
      cd(e1, 'Lê Thị Ngọc Anh', '0900000103', { at: D(-1), yob: 1995, edu: 'Đại học', exp: 'Từng làm chuyên viên hành chính – nhân sự tại Đốm Sáng Edu', note: '' });
      cd(e1, 'Phạm Hoài Nam', '0901000204', { at: D(-6), yob: 1998, edu: 'Cao đẳng', exp: '1 năm hành chính văn phòng', stage: 'screen', src: 'Người quen giới thiệu' });
      cd(e1, 'Vũ Ngọc Bích', '0901000205', { at: D(-5), yob: 1999, edu: 'Đại học', exp: 'Thực tập nhân sự 6 tháng' });
      cd(e1, 'Vũ Ngọc Bích', '0901 000 205', { at: D(-2), yob: 1999, edu: 'Đại học', exp: 'Thực tập nhân sự 6 tháng', src: 'Fanpage công ty' });
      cd(e2, 'Hồ Quang Vinh', '0901000207', { at: D(-7), yob: 1990, edu: 'Thạc sĩ', exp: '5 năm đào tạo kỹ năng mềm cho doanh nghiệp', stage: 'iv', ivs: [{ id: 'pv2', date: D(2), time: '10:00', mode: TD_MODE[1], place: 'meet.example/dom-sang-pv', who: 'Bùi Văn Thắng – Giảng viên chính', st: 'plan' }], letters: [{ t: 'pv', at: D(-1) + ' 11:00', ch: 'Email' }] });
      cd(e2, 'Mai Thanh Tâm', '0901000208', { at: D(-4), yob: 1993, edu: 'Đại học', exp: '3 năm MC, dẫn chương trình', stage: 'screen', src: 'Nhóm Facebook / Zalo', consent: null });
      cd(e2, 'Kiều Thị Anh', '0901000209', { at: D(-10), yob: 1997, edu: 'Đại học', exp: '1 năm trợ giảng', stage: 'fail', endAt: D(-3), ivs: [ivDone(D(-5), '15:00', 'Bùi Văn Thắng – Giảng viên chính', { 0: 3, 1: 2, 2: 4, 3: 4, 4: 3 }, 'fail', 'Kinh nghiệm đứng lớp còn ít so với yêu cầu khóa doanh nghiệp.')], letters: [{ t: 'tc', at: D(-3) + ' 17:00', ch: 'Email' }] });
    } else {
      var h1 = rq({ id: 'TD001', pos: 'Công nhân sản xuất thảo dược', pb: 'Xưởng Sản xuất', cd: 'Công nhân sản xuất', sl: 2, reason: 'Bổ sung theo định biên', ld: 'Toàn thời gian', prob: 'khac', salMin: 7000000, salMax: 8500000, salShow: true, place: cf.addr, time: 'Ca ngày 07:30–16:30, Thứ Hai – Thứ Bảy', deadline: D(10), needBy: D(16), st: 'open', pub: true, at: D(-14) + ' 08:40', note: 'Xưởng thiếu 1 so với định biên 4 + 1 người cho đơn hàng Tết',
        desc: 'Sơ chế, sấy, đóng gói sản phẩm thảo dược theo quy trình\nVệ sinh máy móc, khu vực làm việc cuối ca\nGhi sổ sản lượng, báo tổ trưởng khi có sự cố',
        reqs: 'Sức khỏe phù hợp làm việc đứng theo ca (có giấy khám sức khỏe khi nhận việc)\nCẩn thận, tuân thủ quy định vệ sinh an toàn thực phẩm\nKhông yêu cầu kinh nghiệm – được hướng dẫn tại xưởng',
        bens: 'Lương 7–8,5 triệu đồng/tháng + thưởng sản lượng\nPhụ cấp ăn trưa, đồng phục, bảo hộ lao động do công ty cấp\nĐóng BHXH, BHYT, BHTN đầy đủ' });
      rq({ id: 'TD002', pos: 'Nhân viên kho – giao nhận', pb: 'Kho hàng', cd: 'Nhân viên kho', reason: 'Thời vụ', ld: 'Bán thời gian', prob: 'khac', salMin: 0, salMax: 0, salShow: false, salTxt: '30.000 đồng/giờ', place: cf.addr, time: 'Theo ca, 4 giờ/ngày', deadline: D(25), needBy: D(30), st: 'paused', pub: false, at: D(-4) + ' 11:00', note: 'Tạm dừng – chờ chốt kế hoạch đơn Tết',
        desc: 'Nhận hàng, kiểm đếm, sắp xếp kho\nĐóng gói đơn hàng thương mại điện tử', reqs: 'Cẩn thận, trung thực', bens: 'Trả lương theo giờ, thanh toán cuối tháng' });
      cd(h1, 'Bùi Văn Hùng', '0901000212', { at: D(-8), yob: 2000, edu: 'Trung cấp', exp: '1 năm công nhân đóng gói thực phẩm', stage: 'offer', src: 'Nhóm Facebook / Zalo',
        ivs: [ivDone(D(-4), '08:30', 'Lê Văn Phát – Tổ trưởng sản xuất', { 0: 4, 1: 4, 2: 3, 3: 5, 4: 4 }, 'pass', 'Đã quen làm theo ca, chủ động hỏi quy trình vệ sinh.')],
        offer: { sal: 8000000, probSal: 6800000, probKind: 'khac', probDays: 6, hd: 'Thỏa thuận thử việc trong hợp đồng lao động xác định thời hạn 12 tháng', start: D(9), replyBy: D(-1), place: cf.addr, time: h1.time, sentAt: D(-3) + ' 15:00', ans: 'pending' },
        letters: [{ t: 'pv', at: D(-6) + ' 10:00', ch: 'Zalo / SMS' }, { t: 'nv', at: D(-3) + ' 15:00', ch: 'Zalo / SMS' }] });
      cd(h1, 'Tạ Thị Lan', '0901000213', { at: D(-6), yob: 1992, edu: 'Phổ thông', exp: '4 năm công nhân may', stage: 'iv', ivs: [ivDone(D(-1), '09:30', 'Lê Văn Phát – Tổ trưởng sản xuất', { 0: 3, 1: 3, 2: 4, 3: 5, 4: 4 }, 'pass', 'Chăm chỉ, đồng ý làm ca ngày.')] });
      cd(h1, 'Lương Văn Quý', '0901000214', { at: D(-1), yob: 2003, edu: 'Phổ thông', exp: 'Chưa có kinh nghiệm' });
      cd(h1, 'Châu Minh Nhật', '0901000215', { at: D(-9), yob: 2001, edu: 'Cao đẳng', exp: '6 tháng kho vận', stage: 'withdraw', endAt: D(-4), hist: [{ at: D(-4) + ' 09:10', txt: 'Ứng viên báo rút hồ sơ – đã nhận việc nơi khác' }] });
    }
    // CV minh họa (ảnh vẽ bằng mã, ghi rõ hư cấu) – tạo sau khi kho file sẵn sàng
    setTimeout(function () { tdSeedCv(u, cvJobs); }, 400);
  }
  function tdSeedCv(u, list) {
    if (!KHO.ready) { setTimeout(function () { tdSeedCv(u, list); }, 600); return; }
    var p = Promise.resolve();
    list.forEach(function (c) {
      if (c.stage === 'fail' && /Hiền|Ngọc/.test(c.name)) return; // 2 hồ sơ cũ: để xem cảnh báo quá hạn lưu (không cần ảnh)
      p = p.then(function () { return sampleImg('a4', 'HỒ SƠ ỨNG VIÊN (CV MẪU)', ['Họ và tên: ' + c.name, 'Năm sinh: ' + (c.yob || ''), 'Trình độ: ' + (c.edu || ''), 'Kinh nghiệm: ' + (c.exp || ''), 'Điện thoại: ' + tdPhoneFmt(c.phone)]); })
        .then(function (b) { if (!b) return; var id = khoId(); c.cv = id; c.cvName = 'CV_' + HR.stripAcc(c.name).replace(/\s+/g, '_') + '.jpg'; return khoPut({ id: id, u: u.id, nv: c.id, kho: 'cv', ref: 'CV', name: c.cvName, type: 'image/jpeg', size: b.size, at: (c.at || '') + 'T20:15', blob: b, seed: 1 }); });
    });
    p.then(function () { saveUnits(); }).catch(function (e) { logErr('Tạo CV mẫu', e); });
  }

  /* ---------------- Gợi ý nhu cầu từ định biên + người sắp nghỉ ---------------- */
  function tdSuggest(u) {
    var R = refDate(), o, out = [], t = tdOf(u);
    try { o = orgOf(u, R); } catch (e) { return out; }
    var openPb = {}; t.rq.forEach(function (r) { if (r.st === 'open' || r.st === 'draft' || r.st === 'paused') openPb[r.pb] = (openPb[r.pb] || []).concat([r]); });
    o.depts.forEach(function (x) {
      if (!x.vac) return;
      var left = (x.left || []).filter(function (p) { return p.e['Ngày nghỉ việc']; }).sort(function (a, b) { return cmp(b.e['Ngày nghỉ việc'], a.e['Ngày nghỉ việc']); });
      out.push({ u: u, pb: x.name, n: x.vac, kind: 'vac', why: 'Thiếu ' + x.vac + ' so với định biên ' + x.plan + (left[0] ? ' · ' + left[0].e['Họ và tên'] + ' (' + left[0].e['Chức danh công việc'] + ') nghỉ ' + vn(left[0].e['Ngày nghỉ việc']) : ''), thay: left[0] ? left[0].id : '', cd: left[0] ? left[0].e['Chức danh công việc'] : (function () { var c = {}; x.members.forEach(function (p) { var t = String(p.e['Chức danh công việc'] || '').replace(/\s*\(.*\)\s*$/, ''); if (t && !/trưởng|giám đốc|tổ trưởng/i.test(t)) c[t] = (c[t] || 0) + 1; }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0] || ''; })(), has: openPb[x.name] || [] });
    });
    u.data.NV.forEach(function (e) { var d = e['Ngày nghỉ việc']; if (d && d > R && tdDiff(R, d) <= 60) out.push({ u: u, pb: e['Phòng ban'], n: 1, kind: 'leave', why: e['Họ và tên'] + ' (' + (e['Chức danh công việc'] || '') + ') sẽ nghỉ từ ' + vn(d), thay: e['Mã NV'], cd: e['Chức danh công việc'] || '', has: openPb[e['Phòng ban']] || [] }); });
    return out;
  }

  /* ---------------- Cảnh báo cho Việc cần xử lý ---------------- */
  function tdAlerts() {
    var R = refDate(), out = [];
    selUnits().forEach(function (u) {
      var t = tdOf(u);
      function push(kind, level, title, detail, k, ex) { out.push(Object.assign({ kind: kind, level: level, id: '', name: '', dept: '', unit: u.name, unitId: u.id, title: title, detail: detail || '', key: u.id + '|' + kind + '||' + k, days: null, sources: ['Tuyển dụng'] }, ex || {})); }
      t.cd.forEach(function (c) {
        var r = tdReq(u, c.rq) || { pos: '' };
        (c.ivs || []).forEach(function (v) { if (v.st !== 'plan' || !v.date) return; var d = tdDiff(R, v.date); if (d !== null && d >= 0 && d <= 1) push('td_iv', d === 0 ? 'canh' : 'nhac', 'Phỏng vấn ' + c.name + ' – ' + r.pos + ' lúc ' + (v.time || '') + (d === 0 ? ' hôm nay' : ' ngày mai'), (v.mode || '') + (v.who ? ' · Người phỏng vấn: ' + v.who : '') + ' · Xem ở Tuyển dụng → Ngân hàng ứng viên', c.id + v.id, { days: d, due: v.date }); });
        if (c.stage === 'new') { var dn = tdDiff(c.at, R); if (dn !== null && dn >= 3) push('td_new', 'canh', 'Hồ sơ ' + c.name + ' (' + r.pos + ') đã nhận ' + dn + ' ngày, chưa xem', 'Nên phản hồi ứng viên trong vài ngày để không mất người tốt · Tuyển dụng → Ngân hàng ứng viên', c.id, { days: -dn }); }
        if (c.stage === 'offer' && c.offer && c.offer.ans !== 'yes' && c.offer.ans !== 'no' && c.offer.replyBy && c.offer.replyBy < R) push('td_offer', 'canh', c.name + ' chưa trả lời thư mời nhận việc (hạn ' + vn(c.offer.replyBy) + ')', 'Gọi lại cho ứng viên hoặc ghi kết quả trả lời ở Tuyển dụng → Kết quả phỏng vấn', c.id, { days: tdDiff(R, c.offer.replyBy), due: c.offer.replyBy });
        if (c.stage === 'hired' && !c.nvId && c.offer && c.offer.start) { var ds = tdDiff(R, c.offer.start); if (ds !== null && ds <= 7) push('td_start', ds <= 2 ? 'gap' : 'canh', c.name + ' đi làm từ ' + vn(c.offer.start) + ' – chưa chuyển thành hồ sơ nhân sự', 'Bấm "Chuyển thành nhân sự" ở Tuyển dụng → Kết quả phỏng vấn (thông tin tự điền, không nhập lại), rồi lập hợp đồng trước ngày đi làm (BLLĐ 2019 Điều 13, 16).', c.id, { days: ds, due: c.offer.start }); }
        if (tdClosedSt(c.stage) && tdKeepUntil(u, c) < R) push('td_keep', 'canh', 'Hồ sơ ' + c.name + ' (' + (r.pos || 'vị trí đã đóng') + ') đã quá thời hạn lưu ' + (t.cfg.keep || 6) + ' tháng', 'Công ty đã thông báo thời hạn lưu cho ứng viên – mở hồ sơ ứng viên ở Tuyển dụng → Ngân hàng ứng viên → "Xóa hồ sơ" (xóa cả CV).', c.id, { days: tdDiff(R, tdKeepUntil(u, c)) });
      });
      t.rq.forEach(function (r) {
        if (r.st === 'open' && r.pub && r.deadline && r.deadline < R) push('td_dead', 'canh', 'Tin "' + r.pos + '" vẫn hiện trên cổng nhưng đã hết hạn nhận hồ sơ ' + vn(r.deadline), 'Gia hạn hoặc tắt "Hiện trên cổng" ở Tuyển dụng → Nhu cầu tuyển dụng', r.id, { days: tdDiff(R, r.deadline), due: r.deadline });
        if (r.st !== 'closed' && r.st !== 'filled') { var f = tdFair(r); if (f.length) push('td_fair', r.pub ? 'gap' : 'canh', 'Tin "' + r.pos + '" có từ ngữ cần xem lại: ' + f.map(function (x) { return x.what; }).join(', '), f.map(function (x) { return '“' + x.hit + '”'; }).join(' · ') + ' – sửa ở Tuyển dụng → Nhu cầu tuyển dụng', r.id); }
      });
      if (t.rq.some(function (r) { return tdLive(r, R); }) && !t.cfg.policy) push('td_policy', 'canh', 'Cổng tuyển dụng đang nhận hồ sơ nhưng chưa có link chính sách xử lý dữ liệu cá nhân', 'Form ứng tuyển thu họ tên, số điện thoại, email, CV – cần có chính sách để ứng viên đọc trước khi đồng ý. Thêm ở Tuyển dụng → Cổng tuyển dụng → Thông tin công ty.', 'cfg');
    });
    return out;
  }
  var _tdAlertBase = alertList;
  alertList = function () { var base = _tdAlertBase(), k = ACACHE.key + '#' + TDV; if (TDA.key !== k) { try { TDA = { key: k, list: tdAlerts() }; } catch (e) { logErr('Tính cảnh báo tuyển dụng', e); TDA = { key: k, list: [] }; } } return base.concat(TDA.list); };

  /* ---------------- Giao diện riêng của module (chèn 1 lần) ---------------- */
  (function () {
    var css = [
      '.td-kpi{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;margin-bottom:16px}',
      '.td-kpi>div{padding:14px 16px;border-left:1px solid var(--line);min-width:0}.td-kpi>div:first-child{border-left:none}.td-kpi b{display:block;font-size:24px;line-height:1.2;font-weight:700;font-variant-numeric:tabular-nums}.td-kpi span{font-size:12.5px;color:var(--muted)}.td-kpi .k-warn b{color:var(--warn)}.td-kpi .k-bad b{color:var(--danger)}',
      '.td-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px}.td-bar .sp{flex:1}',
      '.td-kpi>button{padding:14px 16px;border:none;border-left:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;min-width:0;position:relative;transition:background .12s}.td-kpi>button:first-child{border-left:none}.td-kpi>button:hover{background:var(--surface-2)}.td-kpi>button.on{background:var(--pri-soft);box-shadow:inset 0 -3px 0 var(--pri)}.td-kpi>button em{position:absolute;right:12px;top:12px;color:var(--pri);opacity:0;transition:opacity .12s}.td-kpi>button:hover em,.td-kpi>button.on em{opacity:1}',
      '.td-tabs{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line);margin-bottom:10px}.td-tabs-l{font-size:11.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;flex:none;width:84px}.td-tab-row{display:flex;gap:2px;overflow-x:auto;scrollbar-width:thin;min-width:0}.td-tab-row button{border:none;background:none;font:inherit;font-size:13.5px;font-weight:600;color:var(--muted);padding:9px 12px 8px;border-bottom:2.5px solid transparent;white-space:nowrap;cursor:pointer}.td-tab-row button:hover{color:var(--ink)}.td-tab-row button.on{color:var(--pri-ink);border-bottom-color:var(--pri)}.td-tab-row button em{font-style:normal;font-size:11.5px;background:var(--surface-2);border-radius:20px;padding:1px 7px;margin-left:6px;color:var(--muted)}.td-tab-row button.on em{background:var(--pri-soft);color:var(--pri-ink)}',
      '.td-gco{margin:22px 0 4px;font-size:17px;display:flex;align-items:baseline;gap:10px}.td-gco small{font-size:12.5px;color:var(--muted);font-weight:500}.td-gpb{margin:14px 0 8px;font-size:13.5px;font-weight:700;color:var(--ink-2);display:flex;gap:8px;align-items:center}.td-gpb:before{content:"";width:4px;height:15px;border-radius:2px;background:var(--pri)}.td-gpb small{color:var(--muted);font-weight:500}',
      '.td-flt{display:inline-flex;align-items:center;gap:8px;background:var(--pri-soft);color:var(--pri-ink);border-radius:22px;padding:4px 5px 4px 12px;font-size:13px;font-weight:600}.td-flt svg{width:14px;height:14px}',
      '.td-rtbl{padding:6px}.td-rtbl .tbl-wrap{max-height:none;border:none}.td-rtbl .tbl td{padding:10px 10px}.td-rtbl .tbl th{padding:10px 10px}.td-rtbl .tbl td.wrap{min-width:170px;max-width:270px}.td-ivc{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}.td-ivc .btn{height:26px;padding:0 7px}.td-sub{display:block;font-size:11.5px;color:var(--muted);margin-top:2px}.td-rtbl td.td-sal{min-width:100px;max-width:150px;white-space:normal}.td-rtbl td.wrap{min-width:180px}.td-rtbl .td-sw i{width:30px;height:18px}.td-rtbl .td-sw i:after{width:14px;height:14px}.td-rtbl .td-sw.on i:after{left:14px}.td-tacts{display:inline-flex;gap:4px}.td-tacts .btn{padding:0 8px}',
      '.td-sugbox{border:1px solid var(--pri-soft-2);background:var(--pri-soft);border-radius:var(--r-lg);padding:12px 12px 10px;margin-bottom:14px}.td-sugbox h5{margin:0 0 2px;font-size:13.5px}.td-sugbox p{margin:0 0 10px;font-size:12.5px}.td-sugbox .td-sug-i{background:var(--surface);border-style:solid;border-color:var(--line)}.td-sugbox .td-sug-i.used{border-color:var(--pri);box-shadow:0 0 0 1px var(--pri)}.td-sugbox.none{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--pri-ink)}.td-sugbox.none svg{flex:none}',
      '.td-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(178px,1fr));gap:12px;margin-bottom:16px}.td-stat{position:relative;display:flex;gap:12px;align-items:flex-start;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;font:inherit;color:inherit;cursor:pointer;transition:border-color .12s,box-shadow .12s,transform .12s;min-width:0}.td-stat:hover{border-color:var(--pri-soft-2);box-shadow:0 6px 18px -10px rgba(22,33,43,.28);transform:translateY(-1px)}.td-stat.on{border-color:var(--pri);box-shadow:0 0 0 1px var(--pri)}',
      '.td-stat-ic{width:38px;height:38px;border-radius:11px;background:var(--pri-soft);color:var(--pri-ink);display:flex;align-items:center;justify-content:center;flex:none}.td-stat.t-warn .td-stat-ic{background:var(--warn-soft);color:var(--warn)}.td-stat.t-bad .td-stat-ic{background:var(--danger-soft);color:var(--danger)}.td-stat-tx{min-width:0}.td-stat-tx b{display:block;font-size:24px;line-height:1.15;font-weight:700;font-variant-numeric:tabular-nums}.td-stat.t-warn .td-stat-tx b{color:var(--warn)}.td-stat.t-bad .td-stat-tx b{color:var(--danger)}.td-stat-tx>span{display:block;font-size:12.5px;color:var(--ink-2);line-height:1.35;margin-top:2px}.td-stat-tx small{display:block;font-size:11.5px;color:var(--muted);margin-top:3px}.td-stat-go{position:absolute;right:10px;top:10px;color:var(--pri);opacity:0;transition:opacity .12s}.td-stat:hover .td-stat-go,.td-stat.on .td-stat-go{opacity:1}',
      '.td-fbox{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px}.td-fbox-top{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding-bottom:12px;border-bottom:1px dashed var(--line)}.td-fbox-top .sp{flex:1}.td-frow{display:flex;gap:12px;align-items:flex-start}.td-flab{width:86px;flex:none;font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding-top:7px}.td-pills{display:flex;flex-wrap:wrap;gap:6px;min-width:0}',
      '.td-pill{border:1px solid var(--line-2);background:var(--surface);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:background .12s,border-color .12s}.td-pill:hover{border-color:var(--pri);color:var(--pri-ink)}.td-pill em{font-style:normal;font-size:11.5px;background:var(--surface-2);border-radius:20px;padding:0 7px;color:var(--muted);font-weight:600}.td-pill.on{background:var(--pri);border-color:var(--pri);color:#fff}.td-pill.on em{background:rgba(255,255,255,.22);color:#fff}',
      '.td-search{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line-2);border-radius:10px;padding:0 10px;height:36px;background:var(--surface);min-width:240px;flex:0 1 320px}.td-search svg{color:var(--muted);flex:none}.td-search input{border:none;outline:none;background:none;font:inherit;font-size:13.5px;color:var(--ink);width:100%;min-width:0}.td-search:focus-within{border-color:var(--pri);box-shadow:0 0 0 3px var(--pri-soft)}.td-srcsel{height:36px;max-width:200px}',
      '.td-strong{font-weight:600}.td-who{display:flex;gap:10px;align-items:flex-start}.td-who .td-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.td-who .tag{font-size:11px}.td-ivd{display:inline-flex;gap:5px;align-items:center;font-size:13px;white-space:nowrap}.td-ivd svg{color:var(--pri)}.td-next{display:inline-flex;gap:6px;flex-wrap:wrap}.td-q2{display:inline-flex;gap:4px}.td-done{display:inline-flex;gap:5px;align-items:center;font-size:12.5px;color:var(--pri-ink);white-space:nowrap}',
      '.td-stsel{appearance:none;-webkit-appearance:none;border:1px solid transparent;border-radius:999px;padding:4px 26px 4px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;background:var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M1 1l4 4 4-4%27 fill=%27none%27 stroke=%27%23667%27 stroke-width=%271.6%27/%3E%3C/svg%3E") no-repeat right 9px center;color:var(--ink-2)}.td-stsel:hover{border-color:var(--line-2)}.td-stsel.s-new{background-color:var(--info-soft);color:var(--info)}.td-stsel.s-screen{background-color:var(--surface-3)}.td-stsel.s-iv{background-color:var(--warn-soft);color:var(--warn)}.td-stsel.s-offer{background-color:var(--pri-soft);color:var(--pri-ink)}.td-stsel.s-hired{background-color:var(--pri);color:#fff}.td-stsel.s-fail{background-color:var(--danger-soft);color:var(--danger)}.td-stsel.s-withdraw{color:var(--muted)}',
      'tr.td-hl td{animation:tdhl 2.4s ease}@keyframes tdhl{0%,40%{background:var(--dom-soft)}100%{background:transparent}}tr.td-hl .td-next .btn-primary{animation:tdpulse 1.2s ease 2}@keyframes tdpulse{0%,100%{box-shadow:0 0 0 0 rgba(242,169,59,0)}50%{box-shadow:0 0 0 5px rgba(242,169,59,.45)}}',
      '.td-pubc{display:inline-flex;gap:8px;align-items:center}.td-openlink{white-space:nowrap}',
      '.td-mnav{display:inline-flex;align-items:center;gap:6px}.td-mnav b{min-width:120px;text-align:center;font-size:15px}.td-leg{display:inline-flex;flex-wrap:wrap;gap:4px 12px;align-items:center;font-size:12px;color:var(--muted)}.td-leg i{width:10px;height:10px;border-radius:3px;display:inline-block;margin-right:-6px}',
      '.td-cal{overflow:hidden;margin-bottom:16px}.td-cal-h,.td-cal-g{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.td-cal-h span{padding:9px 10px;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line);background:var(--surface-2)}.td-day{min-height:128px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:6px;display:flex;flex-direction:column;gap:4px;min-width:0}.td-day:nth-child(7n){border-right:none}.td-day.wk{background:color-mix(in srgb,var(--surface-2) 45%,transparent)}.td-day.oth{background:var(--surface-2)}.td-day.oth .td-dh span{color:var(--faint)}.td-day.today{box-shadow:inset 0 0 0 2px var(--pri)}.td-day.today .td-dh span{background:var(--pri);color:#fff;border-radius:20px;padding:0 7px}',
      '.td-dh{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700}.td-dadd{border:none;background:none;width:22px;height:22px;border-radius:6px;color:var(--muted);font-size:16px;line-height:1;cursor:pointer;opacity:0}.td-day:hover .td-dadd{opacity:1}.td-dadd:hover{background:var(--pri-soft);color:var(--pri-ink)}',
      '.td-ev{display:block;width:100%;text-align:left;border:none;border-left:3px solid var(--info);background:var(--info-soft);border-radius:6px;padding:4px 6px;font:inherit;font-size:12px;line-height:1.3;color:var(--ink);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.td-ev b{font-variant-numeric:tabular-nums}.td-ev small{display:block;color:var(--muted);font-size:11px;overflow:hidden;text-overflow:ellipsis}.td-ev:hover{filter:brightness(.96)}',
      '.td-ev.s-late,.td-leg .s-late{border-left-color:var(--danger);background:var(--danger-soft)}.td-ev.s-done,.td-leg .s-done{border-left-color:var(--pri);background:var(--pri-soft)}.td-ev.s-fail,.td-leg .s-fail{border-left-color:var(--muted);background:var(--surface-3)}.td-ev.s-cancel,.td-leg .s-cancel{border-left-color:var(--faint);background:var(--surface-2);text-decoration:line-through;color:var(--muted)}.td-leg .s-plan{background:var(--info-soft);border-left:3px solid var(--info)}.td-more{border:none;background:none;font:inherit;font-size:11.5px;color:var(--pri-ink);font-weight:600;text-align:left;cursor:pointer;padding:0 4px}',
      '.td-agenda .td-ag{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.td-agenda .card-head+.td-ag{border-top:none}.td-ag .td-ev{white-space:normal;flex:1;padding:6px 10px;font-size:13px}.td-ag .ev-cal{flex:none}.td-daylist .td-ag{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 0;border-top:1px solid var(--line)}.td-daylist .td-ag .td-ev{flex:1 1 100%;white-space:normal;font-size:13px;padding:6px 10px}',
      '.td-res{display:grid;grid-template-columns:minmax(260px,360px) minmax(0,1fr);gap:16px;align-items:start}.td-rlist{display:flex;flex-direction:column;gap:6px;max-height:calc(100vh - 140px);overflow:auto;position:sticky;top:12px;padding-right:2px}.td-ri{display:flex;gap:10px;align-items:flex-start;text-align:left;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:10px 12px;font:inherit;color:inherit;cursor:pointer}.td-ri:hover{border-color:var(--pri-soft-2)}.td-ri.on{border-color:var(--pri);box-shadow:0 0 0 1px var(--pri);background:var(--pri-soft)}.td-ri-tx{min-width:0;display:flex;flex-direction:column;gap:2px}.td-ri-tx b{font-size:13.5px}.td-ri-tx small{font-size:12px;color:var(--muted)}.td-ri-st{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin-top:3px}.td-ri-m{font-size:11.5px;font-weight:600;color:var(--muted)}.td-ri-m.t-warn{color:var(--warn)}.td-ri-m.t-bad{color:var(--danger)}.td-ri-m.t-ok{color:var(--pri-ink)}.td-ri-m.t-info{color:var(--info)}',
      '.td-rp-h{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:10px}.td-rp-h h2{margin:0;font-size:20px}.td-rp-h p{margin:3px 0 0;font-size:13px}.td-rp-iv{background:var(--surface-2);border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px}.td-rp-sec{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.td-rp-sec h3{margin:0;font-size:14px}.td-rp-off{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px}.td-rp-ans{display:flex;flex-wrap:wrap;gap:8px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:13.5px}.td-rp-ans .sp{flex:1}.td-rp-ans.ok{border-color:var(--pri-soft-2);background:var(--pri-soft)}',
      '.td-ltb{min-height:340px;width:100%;line-height:1.55;font-size:13.5px}.td-lsend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.td-sentnote{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--pri-ink);background:var(--pri-soft);border-radius:8px;padding:6px 10px;margin-bottom:10px}',
      '.td-tbar{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;padding:8px 6px 12px;border-bottom:1px solid var(--line);margin-bottom:6px}.td-tbar .sp{flex:1}.td-tbar .td-search{height:34px;flex:0 1 250px;min-width:170px}.td-pill.st.on{background:var(--info);border-color:var(--info)}.td-pill.st:hover{border-color:var(--info);color:var(--info)}.td-pill.st.on:hover{color:#fff}.pl-mail p{margin:0 0 14px}',
      '.td-tbar2{border-bottom:none;padding-top:0;margin-bottom:0}.td-dd{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 11px;border:1px solid var(--line-2);border-radius:10px;background:var(--surface);font:inherit;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;max-width:300px}.td-dd span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-dd svg{color:var(--muted);flex:none}.td-dd em{font-style:normal;font-size:11.5px;background:var(--pri);color:#fff;border-radius:20px;padding:0 7px}.td-dd i{font-style:normal;color:var(--muted);font-size:11px}.td-dd.on{border-color:var(--pri);color:var(--pri-ink)}',
      '.td-ddp{position:absolute;z-index:250;width:380px;max-width:calc(100vw - 16px);background:var(--surface);border:1px solid var(--line-2);border-radius:12px;box-shadow:var(--shadow-pop);display:flex;flex-direction:column}.td-ddp-h,.td-ddp-f{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px}.td-ddp-h{border-bottom:1px solid var(--line)}.td-ddp-h span{display:inline-flex;gap:4px}.td-ddp-f{border-top:1px solid var(--line)}.td-ddp-l{max-height:340px;overflow:auto;padding:6px}.td-ddp-g{font-size:11.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;padding:8px 8px 4px}.td-ddp-i{display:flex;gap:10px;align-items:flex-start;padding:7px 8px;border-radius:8px;cursor:pointer;font-size:13.5px}.td-ddp-i:hover{background:var(--surface-2)}.td-ddp-i input{margin-top:3px;accent-color:var(--pri)}.td-ddp-i span{flex:1;min-width:0}.td-ddp-i small{display:block;color:var(--muted);font-size:11.5px}.td-ddp-i em{font-style:normal;font-size:12px;color:var(--muted)}',
      '.td-starf.on{background:var(--dom);border-color:var(--dom);color:#3a2600}.td-starf.on em{background:rgba(255,255,255,.4);color:#3a2600}.td-starbtn{border:none;background:none;padding:0 3px;font-size:15px;line-height:1;cursor:pointer;color:var(--faint);vertical-align:-1px}.td-starbtn.on{color:var(--dom)}.td-starbtn:hover{color:var(--dom)}',
      '.td-cvbar{display:flex;gap:14px;align-items:center;border:1.5px dashed var(--pri-soft-2);background:var(--pri-soft);border-radius:12px;padding:12px 14px;margin:4px 0 12px}.td-cvbar.over{border-color:var(--pri);background:var(--pri-soft-2)}.td-cvbar b{display:block;font-size:13.5px}.td-cvbar .faint{display:block;font-size:12px;margin-top:2px;line-height:1.45}.td-cvbar .btn{flex:none}.td-cvprog{align-items:center}.td-spin{width:16px;height:16px;border-radius:50%;border:2px solid var(--pri-soft-2);border-top-color:var(--pri);animation:tdspin .8s linear infinite;flex:none}@keyframes tdspin{to{transform:rotate(360deg)}}.td-cvtxt{margin-top:6px}.td-cvtxt summary{cursor:pointer;font-size:12px;color:var(--muted)}.td-cvtxt pre{white-space:pre-wrap;font:inherit;font-size:12px;max-height:160px;overflow:auto;background:var(--surface);border-radius:8px;padding:8px;margin:6px 0 0}#cCvRes .notice{margin-bottom:12px}',
      '.td-cal .td-tbar,.td-week .td-tbar{padding:12px 14px;margin:0}.td-dndhint{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--muted);padding:8px 14px;border-bottom:1px solid var(--line);background:var(--surface-2)}.td-dndhint svg{flex:none}',
      '.td-ev-1{display:block;overflow:hidden;text-overflow:ellipsis}.td-ev-3{display:flex!important;gap:5px;align-items:center;margin-top:2px}.td-ev .md{font-style:normal;font-size:10px;font-weight:700;border-radius:4px;padding:0 4px;flex:none}.md-on{background:#E3ECFB;color:#2453A6}.md-off{background:#E6F2EA;color:#22663F}.md-ph{background:#F6EBDD;color:#8A5300}.td-ev.drag{cursor:grab}.td-ev.dragging{opacity:.45}body.td-dragging .td-day,body.td-dragging .td-slot{transition:background .1s}.td-day.drop-ok,.td-slot.drop-ok{background:var(--pri-soft)!important;box-shadow:inset 0 0 0 2px var(--pri)}.td-day.drop-no,.td-slot.drop-no{background:var(--danger-soft)!important}.td-day.past .td-dh span{opacity:.75}',
      '.td-week{overflow:hidden;margin-bottom:16px}.td-wk-scroll{max-height:640px;overflow:auto}.td-wk-h,.td-wk-r{display:grid;grid-template-columns:58px repeat(7,minmax(0,1fr))}.td-wk-h{position:sticky;top:0;z-index:2;background:var(--surface-2);border-bottom:1px solid var(--line)}.td-wk-h span{padding:8px;font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}.td-wk-h span b{display:block;color:var(--ink);font-size:13px;letter-spacing:0}.td-wk-h span.today b{color:var(--pri)}.td-wk-r .td-wk-t{font-size:11.5px;color:var(--muted);padding:2px 6px;text-align:right;font-variant-numeric:tabular-nums}.td-slot{min-height:30px;border-left:1px solid var(--line);border-top:1px dashed var(--line);padding:2px 3px;display:flex;flex-direction:column;gap:2px}.td-wk-r.hr .td-slot{border-top-style:solid}.td-slot.today{background:color-mix(in srgb,var(--pri-soft) 45%,transparent)}.td-slot.past{background:var(--surface-2)}.td-slot .td-ev{font-size:11.5px;padding:2px 5px}',
      '.td-tbox{display:flex;flex-direction:column;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 14px;margin-bottom:14px}.td-tbox .td-flab{padding-top:7px}',
      '.td-resbox{border:1px solid var(--pri-soft-2);background:color-mix(in srgb,var(--pri-soft) 55%,var(--surface));border-radius:12px;padding:12px 14px;margin:12px 0}.td-resbox-h{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;justify-content:space-between;margin-bottom:8px}.td-resbox-h h3{margin:0;font-size:14px}.td-resbox-h .muted{font-size:12px}.td-resbox textarea{width:100%;min-height:76px;line-height:1.5;background:var(--surface)}.td-resbox-s{display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap}.td-resbox-s .td-flab{width:auto;padding:0}.td-resbox-f{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:10px}.td-resbox-f .muted{font-size:12px}.td-pill.cur{border-style:dashed}',
      '.td-ivp .td-kv{grid-template-columns:130px 1fr}.td-ivp .md{font-style:normal;font-size:11px;font-weight:700;border-radius:4px;padding:1px 5px}',
      '.td-kbwrap{padding:10px}.td-kb{display:grid;grid-template-columns:repeat(6,minmax(168px,1fr));gap:8px;overflow-x:auto;padding:4px 2px 8px;align-items:start}.td-kb2{grid-template-columns:repeat(3,minmax(200px,1fr));margin-top:6px}.td-kb2 .td-kcol{min-height:110px}.td-kb2 .td-kcol-b{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}.td-kcol{background:var(--surface-2);border-radius:12px;padding:8px;min-height:180px;border:2px solid transparent;transition:border-color .12s,background .12s}.td-kcol.drop-ok{border-color:var(--pri);background:var(--pri-soft)}.td-kcol-h{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;padding:2px 4px 8px;border-bottom:3px solid var(--line-2);margin-bottom:8px}.td-kcol-h em{font-style:normal;font-size:12px;color:var(--muted);background:var(--surface);border-radius:20px;padding:1px 8px}',
      '.k-new .td-kcol-h{border-color:var(--info)}.k-iv .td-kcol-h,.k-hold .td-kcol-h{border-color:var(--warn)}.k-offer .td-kcol-h,.k-hired .td-kcol-h{border-color:var(--pri)}.k-fail .td-kcol-h{border-color:var(--danger)}.k-ivcancel .td-kcol-h,.k-withdraw .td-kcol-h{border-color:var(--faint)}',
      '.td-kcol-b{display:flex;flex-direction:column;gap:8px}.td-kc{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:7px;cursor:grab;box-shadow:0 1px 2px rgba(22,33,43,.05)}.td-kc:hover{border-color:var(--pri-soft-2)}.td-kc.dragging{opacity:.4}.td-kc-h{display:flex;gap:8px;align-items:flex-start}.td-kc-h>div{min-width:0}.td-kc-h small{display:block;font-size:11.5px;color:var(--muted);margin-top:1px}.td-kc-m{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:12px}.td-kc .td-tags{display:flex;flex-wrap:wrap;gap:4px}.td-kc .tag{font-size:10.5px}.td-kc-n .td-next,.td-kc-n .td-q2{display:flex;flex-wrap:wrap;gap:4px;width:100%}.td-kc-n .btn{font-size:12px;min-height:28px;height:auto;padding:4px 8px;white-space:normal;line-height:1.25;flex:1 1 auto;justify-content:center;text-align:center}.td-kc-n .td-done{white-space:normal}.td-kc-h a{overflow-wrap:anywhere}.td-kc.td-hl{animation:tdhl 2.4s ease}.td-kempty{font-size:12px;color:var(--faint);text-align:center;padding:18px 6px;border:1.5px dashed var(--line-2);border-radius:10px}',
      '.td-vtabs{display:flex;justify-content:center;margin:2px 0 14px}.td-vtabs-in{display:inline-flex;gap:4px;padding:4px;background:var(--surface);border:1px solid var(--line-2);border-radius:14px;box-shadow:0 1px 2px rgba(22,33,43,.05)}.td-vtabs-in button{display:inline-flex;align-items:center;gap:8px;border:none;background:none;font:inherit;font-size:14px;font-weight:700;color:var(--muted);padding:9px 22px;border-radius:10px;cursor:pointer;transition:background .12s,color .12s}.td-vtabs-in button:hover{color:var(--ink);background:var(--surface-2)}.td-vtabs-in button.on{background:var(--pri);color:#fff;box-shadow:0 2px 8px -3px rgba(29,106,80,.5)}',
      '.td-sug{display:flex;flex-direction:column;gap:8px}.td-sug-i{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px dashed var(--line-2);border-radius:var(--r);background:var(--surface-2)}.td-sug-i>div{flex:1;min-width:0}.td-sug-i b{display:block}.td-sug-i small{color:var(--muted)}',
      '.td-reqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}',
      '.td-rq{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:16px 16px 12px;display:flex;flex-direction:column;gap:10px;min-width:0}.td-rq.off{opacity:.78}',
      '.td-rq-h{display:flex;gap:10px;align-items:flex-start}.td-rq-h>div{flex:1;min-width:0}.td-rq-h h3{margin:0;font-size:16px;line-height:1.35}.td-rq-h small{display:block;color:var(--muted);margin-top:2px}',
      '.td-meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--ink-2)}.td-meta span{display:inline-flex;gap:5px;align-items:center}.td-meta svg{width:14px;height:14px;color:var(--muted)}',
      '.td-pipe{display:flex;gap:3px}.td-pipe>span{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 2px;border-radius:6px;background:var(--surface-2);color:var(--muted);white-space:nowrap;overflow:hidden;min-width:0}.td-pipe b{font-size:15px;line-height:1.2}.td-pipe small{font-size:10.5px;font-weight:600}.td-pipe>span.has{background:var(--pri-soft);color:var(--pri-ink)}.td-pipe>span.hired.has{background:var(--pri);color:#fff}',
      '.td-rq-f{display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid var(--line);padding-top:10px;margin-top:2px}.td-rq-f .sp{flex:1}',
      '.td-sw{display:inline-flex;align-items:center;gap:8px;border:none;background:none;padding:0;font:inherit;font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer;white-space:nowrap}.td-sw i{width:34px;height:20px;border-radius:20px;background:var(--line-2);position:relative;transition:background .15s}.td-sw i:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .15s}.td-sw.on{color:var(--pri-ink)}.td-sw.on i{background:var(--pri)}.td-sw.on i:after{left:16px}',
      '.td-fair ul{margin:6px 0 4px;padding-left:18px}.td-fair li{margin:2px 0}.td-fair small{color:var(--muted)}',
      '.td-form h4{margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}.td-form h4:first-child{margin-top:0}.td-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}.td-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px}.td-form textarea.input{min-height:96px;resize:vertical;line-height:1.5;padding:9px 11px;height:auto}.td-form .hint{font-size:12px;color:var(--muted);margin-top:4px}.td-form .field{min-width:0}.td-chk{display:flex;gap:8px;align-items:flex-start;font-size:13px}.td-chk input{margin-top:3px}',
      '.td-board{display:grid;grid-template-columns:repeat(5,minmax(200px,1fr));gap:12px;overflow-x:auto;padding-bottom:6px}',
      '.td-col{background:var(--surface-2);border-radius:var(--r-lg);padding:10px;min-height:120px;display:flex;flex-direction:column;gap:8px}.td-col-h{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;padding:2px 4px 4px}.td-col-h em{font-style:normal;font-size:12px;color:var(--muted);background:var(--surface);border-radius:20px;padding:1px 8px}',
      '.td-cc{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:10px 11px;text-align:left;font:inherit;color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:5px;width:100%}.td-cc:hover{border-color:var(--pri)}.td-cc-h{display:flex;gap:8px;align-items:center}.td-av{width:30px;height:30px;border-radius:50%;background:var(--pri-soft);color:var(--pri-ink);display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}.td-cc-h b{font-size:13.5px;line-height:1.3}.td-cc-h small{display:block;font-size:11.5px;color:var(--muted)}.td-cc .td-tags{display:flex;flex-wrap:wrap;gap:4px}.td-cc .tag{font-size:11px}',
      '.td-closed{margin-top:14px}.td-ivs{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px}.td-iv{flex:0 0 auto;min-width:220px;border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;background:var(--surface);display:flex;gap:10px;align-items:center;cursor:pointer;font:inherit;color:inherit;text-align:left}.td-iv .ev-cal{flex:none}.td-iv b{display:block;font-size:13.5px}.td-iv small{color:var(--muted);font-size:12px}',
      '.td-cm{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:16px}.td-sec{border:1px solid var(--line);border-radius:var(--r-lg);padding:14px;background:var(--surface)}.td-sec+.td-sec{margin-top:14px}.td-sec h3{margin:0 0 10px;font-size:14px;display:flex;align-items:center;gap:8px}.td-sec h3 .sp{flex:1}',
      '.td-kv{display:grid;grid-template-columns:120px 1fr;gap:6px 10px;font-size:13px}.td-kv dt{color:var(--muted)}.td-kv dd{margin:0;min-width:0;overflow-wrap:anywhere}',
      '.td-steps{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px}.td-steps button{border:1px solid var(--line-2);background:var(--surface);border-radius:20px;padding:5px 12px;font:inherit;font-size:12.5px;font-weight:600;color:var(--muted);cursor:pointer}.td-steps button.on{background:var(--pri);border-color:var(--pri);color:#fff}.td-steps button.done{background:var(--pri-soft);border-color:var(--pri-soft-2);color:var(--pri-ink)}.td-steps button.end.on{background:var(--ink-2);border-color:var(--ink-2)}.td-steps .gap{width:10px}',
      '.td-ivr{border-top:1px solid var(--line);padding:10px 0;display:flex;flex-direction:column;gap:6px;font-size:13px}.td-ivr:first-of-type{border-top:none;padding-top:0}.td-ivr-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.td-ivr-h b{flex:1}.td-score{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:var(--muted)}.td-score i{font-style:normal;color:var(--ink);font-weight:700}',
      '.td-lt{display:flex;flex-direction:column;gap:6px;font-size:13px}.td-lt-i{display:flex;gap:8px;align-items:center}.td-lt-i svg{width:15px;height:15px;color:var(--pri)}.td-lbtn{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
      '.td-hist{list-style:none;margin:0;padding:0;font-size:12.5px;max-height:180px;overflow:auto}.td-hist li{display:flex;gap:10px;padding:4px 0;border-bottom:1px dashed var(--line)}.td-hist li span{color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.td-warn{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}',
      '.td-stars{display:flex;gap:4px}.td-stars button{width:34px;height:32px;border:1px solid var(--line-2);border-radius:8px;background:var(--surface);font:inherit;font-weight:700;cursor:pointer;color:var(--muted)}.td-stars button.on{background:var(--pri);border-color:var(--pri);color:#fff}.td-crit{display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center;font-size:13.5px}',
      '.td-letter{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:16px}.td-letter textarea.input{min-height:380px;font-size:13.5px;line-height:1.55}.td-ph{display:flex;flex-wrap:wrap;gap:4px}.td-ph button{border:1px solid var(--line-2);background:var(--surface);border-radius:6px;padding:2px 7px;font:inherit;font-size:11.5px;cursor:pointer;color:var(--ink-2)}.td-ph button:hover{border-color:var(--pri);color:var(--pri-ink)}',
      '.td-tpls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.td-tpl{display:flex;flex-direction:column;gap:8px}.td-tpl pre{white-space:pre-wrap;font:inherit;font-size:12.5px;line-height:1.5;color:var(--ink-2);background:var(--surface-2);border-radius:var(--r);padding:10px 12px;max-height:260px;overflow:auto;margin:0}',
      '.td-portal{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}.td-portal>div{min-width:0}.td-url{min-width:0}.td-side{display:flex;flex-direction:column;gap:14px}',
      '.td-browser{border:1px solid var(--line-2);border-radius:12px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow-pop)}.td-bbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface-2);border-bottom:1px solid var(--line)}.td-bbar i{width:10px;height:10px;border-radius:50%;background:var(--line-2);flex:none}.td-url{flex:1;min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.td-stage{background:repeating-conic-gradient(var(--surface-2) 0 25%,var(--surface) 0 50%) 0 0/18px 18px;display:flex;justify-content:center;overflow:hidden;position:relative}.td-frame{border:none;display:block;width:100%;height:760px;background:#fff}.td-stage.pc .td-frame{width:1280px;height:880px;transform-origin:0 0;position:absolute;left:0;top:0}.td-stage.mob{padding:18px 0}.td-stage.mob .td-frame{width:390px;height:760px;border-radius:24px;box-shadow:0 0 0 8px #1d2329,0 12px 40px rgba(0,0,0,.25)}',
      '.td-links{display:flex;flex-direction:column;gap:10px}.td-link{border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;display:flex;flex-direction:column;gap:6px}.td-link b{font-size:13.5px}.td-link code{font-size:11.5px;color:var(--muted);overflow-wrap:anywhere}.td-link .link-row{margin:0;gap:6px}',
      '.td-srv-st.on{color:var(--ok,#2F7D4F)}.td-srv-st.on i{background:var(--ok,#2F7D4F)!important}.td-srv .field{margin-bottom:8px}.td-srv-st{display:flex;gap:8px;align-items:center;font-size:13px;font-weight:600;color:var(--warn);margin-bottom:8px}.td-srv-st i{width:9px;height:9px;border-radius:50%;background:var(--warn)}',
      '.td-full{position:fixed;inset:0;z-index:300;background:rgba(10,14,18,.72);display:flex;flex-direction:column}.td-full .td-bbar{background:#1d2329;border:none;color:#cfd6dc}.td-full .td-url{background:#2a3138;border-color:#2a3138;color:#cfd6dc}.td-full iframe{flex:1;border:none;background:#fff;width:100%}.td-full .btn{height:30px}',
      '.td-moi .hd-ti{display:grid;grid-template-columns:40px minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.15fr) minmax(150px,auto);align-items:center;gap:14px}',
      '.td-off{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px;font-size:13px}.td-off dt{color:var(--muted);font-size:12px}.td-off dd{margin:0 0 4px;font-weight:600}',
      '@media (max-width:1180px){.td-kpi{grid-template-columns:repeat(3,minmax(0,1fr))}.td-kpi>*:nth-child(4){border-left:none}.td-kpi>*:nth-child(n+4){border-top:1px solid var(--line)}.td-portal{grid-template-columns:1fr}.td-tpls{grid-template-columns:1fr}.td-cm{grid-template-columns:1fr}.td-letter{grid-template-columns:1fr}}',
      '@media (max-width:720px){.td-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.td-kpi>*{border-left:none;border-top:1px solid var(--line)}.td-kpi>*:nth-child(-n+2){border-top:none}.td-kpi>*:nth-child(even){border-left:1px solid var(--line)}.td-tabs{flex-direction:column;align-items:stretch;gap:0}.td-tabs-l{width:auto;padding-top:6px}.td-frow{flex-direction:column;gap:6px;min-width:0;max-width:100%}.td-fbox,.td-tbox{min-width:0;max-width:100%}.td-frow>.td-pills{width:100%}.td-resbox-s .td-pills{flex-wrap:wrap;overflow:visible}.td-resbox-f{flex-direction:column;align-items:stretch}.td-flab{width:auto;padding-top:0}.td-pills{flex-wrap:nowrap;overflow-x:auto;max-width:100%;padding-bottom:2px}.td-search{min-width:0;flex:1 1 100%}.td-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.td-stat{padding:11px;gap:9px}.td-stat-ic{width:30px;height:30px}.td-stat-tx b{font-size:20px}.td-cal .td-cal-h,.td-cal .td-cal-g,.td-dndhint,.td-week .td-wk-scroll{display:none}.td-cal .td-tbar,.td-week .td-tbar{border-bottom:none}.td-res{grid-template-columns:1fr}.td-rlist{position:static;max-height:none}.td-g2,.td-g3,.td-off{grid-template-columns:1fr}.td-reqs{grid-template-columns:1fr}.td-board{grid-template-columns:repeat(5,minmax(240px,1fr))}.td-frame{height:640px}.td-stage.mob .td-frame{width:100%;border-radius:0;box-shadow:none}.td-stage.mob{padding:0}.td-kv{grid-template-columns:100px 1fr}.td-moi .hd-ti{grid-template-columns:40px 1fr}.td-moi .hd-ti>*:nth-child(n+3){grid-column:2}.td-moi .hd-ti .link-row{justify-content:flex-start!important}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'td-css'; st.textContent = css; document.head.appendChild(st);
  })();

  /* =====================================================================
     1) NHU CẦU TUYỂN DỤNG
     ===================================================================== */
  function tdReqRows(f) {
    var R = refDate(), out = [];
    tdUnitsAll().forEach(function (u) { tdOf(u).rq.forEach(function (r) { out.push({ u: u, r: r }); }); });
    out = out.filter(function (x) { var s = x.r.st; return f === 'all' ? true : f === 'open' ? s === 'open' : f === 'wait' ? (s === 'draft' || s === 'paused') : (s === 'filled' || s === 'closed'); });
    out.sort(function (a, b) { return cmp(b.r.at, a.r.at); });
    return out;
  }
  function tdPipe(u, r) {
    var cs = tdCandsOf(u, r.id), n = {}; cs.forEach(function (c) { n[c.stage] = (n[c.stage] || 0) + 1; });
    return '<div class="td-pipe" title="Ứng viên theo từng bước">' + TD_LIVE.map(function (s) { return '<span class="' + s + (n[s] ? ' has' : '') + '" title="' + TD_STN[s] + ': ' + (n[s] || 0) + ' người"><b>' + (n[s] || 0) + '</b><small>' + (s === 'new' ? 'Mới nhận' : s === 'screen' ? 'Sàng lọc' : s === 'iv' ? 'Phỏng vấn' : s === 'offer' ? 'Đã mời' : 'Nhận việc') + '</small></span>'; }).join('') + '</div>';
  }
  function tdReqCard(u, r) {
    var R = refDate(), cs = tdCandsOf(u, r.id), hired = tdHiredCount(u, r), fair = tdFair(r), live = tdLive(r, R);
    var dl = r.deadline ? tdDiff(R, r.deadline) : null;
    var stTag = '<span class="tag ' + (r.st === 'open' ? 'tag-ok' : r.st === 'draft' ? 'tag-mute' : r.st === 'paused' ? 'tag-warn' : 'tag-info') + '">' + TD_RST[r.st] + '</span>';
    var sal = r.salShow && (r.salMin || r.salMax) ? (r.salMin && r.salMax ? tdMil(r.salMin).replace(' triệu', '') + '–' + tdMil(r.salMax) : tdMil(r.salMin || r.salMax)) : (r.salTxt || 'Thỏa thuận');
    var can = r.st !== 'closed' && r.st !== 'filled';
    return '<div class="td-rq' + (can ? '' : ' off') + '"><div class="td-rq-h"><div><h3>' + esc(r.pos) + '</h3><small>' + esc(r.pb) + ' · ' + esc(r.reason || '') + ' · ' + esc(r.id) + '</small></div>' + stTag + '</div>' +
      (isMulti() ? '<div>' + tdCo(u) + '</div>' : '') +
      '<div class="td-meta"><span>' + ic('td_user') + 'Cần ' + r.sl + ' · đã nhận ' + hired + '</span><span>' + ic('bl') + esc(sal) + '</span><span>' + ic('cc') + esc(r.ld || '') + '</span>' +
      (r.deadline ? '<span' + (dl !== null && dl < 0 && can ? ' style="color:var(--danger)"' : dl !== null && dl <= 7 && can ? ' style="color:var(--warn)"' : '') + '>' + ic('td_cal') + 'Hạn nộp ' + vn(r.deadline) + (can && dl !== null ? (dl < 0 ? ' (đã qua)' : ' (còn ' + dl + ' ngày)') : '') + '</span>' : '') + (r.needBy ? '<span>' + ic('np') + 'Cần người trước ' + vn(r.needBy) + '</span>' : '') + '</div>' +
      tdPipe(u, r) + (r.note ? '<div class="muted" style="font-size:12.5px">' + esc(r.note) + '</div>' : '') +
      (fair.length ? '<div class="notice warn" style="padding:8px 10px;font-size:12.5px">' + ic('info') + '<div>Có từ ngữ cần xem lại: <b>' + esc(fair.map(function (x) { return x.what; }).join(', ')) + '</b></div></div>' : '') +
      '<div class="td-rq-f">' + (can ? '<button class="td-sw' + (r.pub ? ' on' : '') + '" data-act="td-pub" data-u="' + u.id + '" data-id="' + r.id + '" title="Bật để vị trí này hiện trên cổng tuyển dụng và nhận hồ sơ"><i></i>' + (r.pub ? (live ? 'Đang hiện trên cổng' : 'Bật – chưa hiện (' + (r.st !== 'open' ? TD_RST[r.st].toLowerCase() : 'hết hạn nộp') + ')') : 'Hiện trên cổng') + '</button>' : '<span class="muted" style="font-size:12.5px">Đã đóng – không hiện trên cổng</span>') + '<span class="sp"></span>' +
      '<button class="btn btn-sm" data-act="td-req-edit" data-u="' + u.id + '" data-id="' + r.id + '">' + ic('td_edit', 14) + 'Sửa</button>' +
      '<button class="btn btn-sm" data-act="td-req-cands" data-u="' + u.id + '" data-id="' + r.id + '">Ứng viên (' + cs.length + ')</button>' +
      (can ? '<button class="btn btn-sm" data-act="td-req-view" data-u="' + u.id + '" data-id="' + r.id + '" title="Xem trang vị trí trên cổng tuyển dụng">' + ic('eye', 14) + 'Xem</button><button class="btn btn-sm" data-act="td-req-post" data-u="' + u.id + '" data-id="' + r.id + '" title="Sao chép nội dung tin để đăng fanpage, nhóm Zalo">' + ic('td_copy', 14) + 'Tin đăng</button>' : '') + '</div></div>';
  }
  /* ---------- Thành phần giao diện dùng chung (11/11 – góp ý anh 15:45: chỉ số dạng box, bộ lọc trong khung bo góc có viền, dạng bảng) ---------- */
  // items: [{ id, n, label, sub, tone: ''|'warn'|'bad'|'ok', icon }]
  function tdStats(act, cur, items) {
    return '<div class="td-stats">' + items.map(function (x) {
      return '<button class="td-stat' + (x.tone ? ' t-' + x.tone : '') + (cur === x.id ? ' on' : '') + '" data-act="' + act + '" data-id="' + esc(x.id) + '" title="' + esc(x.tip || '') + '"><span class="td-stat-ic">' + ic(x.icon || 'info', 18) + '</span><span class="td-stat-tx"><b>' + x.n + '</b><span>' + x.label + '</span>' + (x.sub ? '<small>' + x.sub + '</small>' : '') + '</span><i class="td-stat-go">' + ic('td_arrow', 14) + '</i></button>';
    }).join('') + '</div>';
  }
  // rows: [{ label, act, cur, items: [[id, nhãn, số đếm]] }]
  function tdFbox(rows, top) {
    return '<div class="td-fbox">' + (top ? '<div class="td-fbox-top">' + top + '</div>' : '') + rows.filter(Boolean).map(function (r) {
      return '<div class="td-frow"><span class="td-flab">' + r.label + '</span><div class="td-pills">' + r.items.map(function (it) {
        return '<button class="td-pill' + (String(r.cur) === String(it[0]) ? ' on' : '') + '" data-act="' + r.act + '" data-id="' + esc(it[0]) + '"' + (it[3] ? ' title="' + esc(it[3]) + '"' : '') + '>' + esc(it[1]) + (it[2] !== undefined && it[2] !== null ? '<em>' + it[2] + '</em>' : '') + '</button>';
      }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  function tdPills(act, cur, items, cls) { return '<div class="td-pills">' + items.map(function (it) { return '<button class="td-pill' + (cls ? ' ' + cls : '') + (String(cur) === String(it[0]) ? ' on' : '') + '" data-act="' + act + '" data-id="' + esc(it[0]) + '"' + (it[3] ? ' title="' + esc(it[3]) + '"' : '') + '>' + esc(it[1]) + (it[2] !== undefined && it[2] !== null ? '<em>' + it[2] + '</em>' : '') + '</button>'; }).join('') + '</div>'; }
  function tdSearch(id, val, ph) { return '<label class="td-search">' + ic('td_search', 16) + '<input id="' + id + '" value="' + esc(val || '') + '" placeholder="' + esc(ph) + '" autocomplete="off"></label>'; }
  function tdBindSearch(id, key, prop) { var q = $('#' + id), tm = null; if (!q) return; q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { PS[key][prop] = q.value; var p = q.selectionStart; render(); var n = $('#' + id); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (e) { } } }, 250); }); }
  function tdFilterChip(txt, act) { return '<span class="td-flt">' + ic('info', 14) + txt + '<button class="btn btn-sm" data-act="' + act + '" data-id="">Bỏ lọc</button></span>'; }
  /* Mở link cổng tuyển dụng (11/11 19:25 anh: "hoàn thiện để mở được các link, nút Mở link thay cho Sao chép link").
     Đã kết nối máy chủ → mở link thật. Chưa kết nối → dựng đúng trang đó (danh sách / từng vị trí) và mở ở TAB MỚI của trình duyệt;
     ứng viên nộp thử ở tab đó thì hồ sơ gửi về tab phần mềm (window.opener) → vào Ngân hàng ứng viên. Trình duyệt chặn cửa sổ mới → mở toàn màn hình như cũ. */
  var TD_TABS = [];
  function tdOpenTab(u, jobId) {
    var isAb = jobId === '@about'; if (isAb) jobId = '';
    var cf = tdOf(u).cfg, r = jobId ? tdReq(u, jobId) : null;
    if (cf.srv && cf.srv.on && cf.srv.url) { window.open(tdPortalLink(u, r), '_blank', 'noopener'); return true; }
    var D = tdPortalData(u, 'preview'); if (jobId && !D.jobs.some(function (j) { return j.id === jobId; })) { toast('Vị trí này chưa hiện trên cổng', 'warn', 'Vào Nhu cầu tuyển dụng → bật “Hiện trên cổng” rồi mở lại.'); return true; }
    var w = null; try { w = window.open('', '_blank'); } catch (x) { w = null; }
    if (!w) return false;
    try { w.document.write('<!doctype html><meta charset="utf-8"><title>Đang mở cổng tuyển dụng…</title><body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;color:#555">Đang mở cổng tuyển dụng…</body>'); w.document.close(); } catch (x) { }
    TD_TABS = TD_TABS.filter(function (x) { try { return !x.closed; } catch (e) { return false; } }); TD_TABS.push(w);
    function local(why) {
      var url = URL.createObjectURL(new Blob([tdPortalHtml(D, isAb ? { about: 1 } : jobId ? { job: jobId } : {})], { type: 'text/html;charset=utf-8' }));
      try { w.location.href = url; } catch (x) { }
      setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
      toast('Chưa kết nối được cổng thử recruit.quantritute.com', 'warn', 'Đang mở trang ngay trên máy này' + (why ? ' (' + why + ')' : '') + ' – hồ sơ nộp ở tab đó vẫn vào Ngân hàng ứng viên.');
    }
    if (!navigator.onLine) local('máy không có mạng');
    else tdThuPush(u).then(function () { try { w.location.href = tdPortalLink(u, r) + (isAb ? '/ve-chung-toi' : ''); } catch (x) { } if (curPage === 'tdtin') render(); })
      .catch(function (e) { logErr('Đưa cổng lên máy chủ thử', e); local(String(e && e.message || e)); });
    log('Mở link cổng tuyển dụng ' + (isAb ? 'Về chúng tôi' : r ? r.pos : 'trang danh sách') + ' (' + shortUnit(u.name) + ') ở tab mới');
    return true;
  }
  ACTS['td-olink'] = function (a, id) { var u = unitById(a.getAttribute('data-u')); if (!u) return; if (!tdOpenTab(u, id || '')) { toast('Trình duyệt đang chặn mở tab mới', 'warn', 'Cho phép cửa sổ bật lên (popup) cho trang này, hoặc dùng Xem toàn màn hình.'); tdOpenPortal(u, id || '', true); } };
  // Mở trang vị trí trên cổng (nút Mở tin ở Nhu cầu tuyển dụng): mở tab mới; bị chặn thì mở bản xem trước toàn màn hình
  function tdOpenPortal(u, jobId, noTab) {
    var cf = tdOf(u).cfg, r = jobId ? tdReq(u, jobId) : null;
    if (!noTab && tdOpenTab(u, jobId)) return;
    var bg = document.createElement('div'); bg.className = 'td-full';
    bg.innerHTML = '<div class="td-bbar"><span class="td-url">🔒 ' + esc(tdPortalLink(u, r).replace(/^https:\/\//, '')) + '</span><span class="tag tag-warn">Xem trước – chưa kết nối máy chủ</span><button class="btn btn-sm" id="tdFC">' + ic('td_link', 14) + 'Mở link</button><button class="btn btn-sm" id="tdFX">Đóng (Esc)</button></div><iframe class="td-frame" sandbox="allow-scripts allow-forms allow-popups" title="Cổng tuyển dụng"></iframe>';
    document.body.appendChild(bg);
    bg.querySelector('iframe').srcdoc = tdPortalHtml(tdPortalData(u, 'preview'), jobId ? { job: jobId } : {});
    function close() { bg.remove(); document.removeEventListener('keydown', k); render(); }
    function k(e) { if (e.key === 'Escape') close(); }
    $('#tdFX', bg).addEventListener('click', close); document.addEventListener('keydown', k);
    $('#tdFC', bg).addEventListener('click', function () { if (!tdOpenTab(u, jobId)) toast('Trình duyệt đang chặn mở tab mới', 'warn', 'Cho phép cửa sổ bật lên (popup) cho trang này.'); });
  }
  ACTS['td-open-job'] = function (a, id) { var u = unitById(a.getAttribute('data-u')); if (u) tdOpenPortal(u, id); };

  /* ---------- Trang Nhu cầu tuyển dụng (chỉ dạng bảng) ---------- */
  function tdDeptIdx(u) { var o = {}; (u.data.PB || []).forEach(function (p, i) { o[p['Tên phòng ban']] = i; }); return o; }
  function tdNeedLeft(x) { return Math.max(0, x.r.sl - tdHiredCount(x.u, x.r)); }
  var TD_NK = { pub: 'Đang hiện trên cổng', need: 'Còn thiếu người', soon: 'Hạn nộp còn 7 ngày trở xuống' };
  PAGES.tdnhucau = function () {
    var f = ps('tdn', { f: 'open', co: '', pb: '', k: '', q: '' }), R = refDate(), us = tdUnitsAll(), uix = {};
    us.forEach(function (u, i) { uix[u.id] = i; });
    if (f.co && uix[f.co] === undefined) f.co = '';
    var all = []; us.forEach(function (u) { tdOf(u).rq.forEach(function (r) { all.push({ u: u, r: r }); }); });
    var open = all.filter(function (x) { return x.r.st === 'open'; }), live = open.filter(function (x) { return tdLive(x.r, R); });
    var needL = open.filter(function (x) { return tdNeedLeft(x) > 0; }), need = needL.reduce(function (s, x) { return s + tdNeedLeft(x); }, 0);
    var cands = open.reduce(function (s, x) { return s + tdCandsOf(x.u, x.r.id).filter(function (c) { return TD_LIVE.indexOf(c.stage) >= 0; }).length; }, 0);
    var soonL = open.filter(function (x) { var d = x.r.deadline ? tdDiff(R, x.r.deadline) : null; return d !== null && d <= 7; });
    var curK = f.k || (f.f === 'open' ? 'open' : '');
    var stats = tdStats('td-nk', curK, [
      { id: 'open', n: open.length, label: 'vị trí đang tuyển', icon: 'tdnhucau', tip: 'Xem các phiếu đang tuyển' },
      { id: 'pub', n: live.length, label: 'đang hiện trên cổng', icon: 'td_link', tip: 'Lọc các vị trí đang hiện trên cổng tuyển dụng' },
      { id: 'need', n: need, label: 'người còn cần tuyển', sub: needL.length ? needL.length + ' vị trí còn thiếu' : '', icon: 'td_user', tone: need ? 'warn' : '', tip: 'Lọc các vị trí còn thiếu người' },
      { id: 'cand', n: cands, label: 'hồ sơ đang xét', sub: 'của vị trí đang tuyển', icon: 'tdungvien', tip: 'Mở Ngân hàng ứng viên' },
      { id: 'soon', n: soonL.length, label: 'sắp hết / đã hết hạn nộp', sub: 'còn 7 ngày trở xuống', icon: 'td_cal', tone: soonL.length ? 'warn' : '', tip: 'Lọc các vị trí sắp hết hạn nhận hồ sơ' }]);
    function stOk(x, k) { var s = x.r.st; return k === 'all' ? true : k === 'open' ? s === 'open' : k === 'wait' ? (s === 'draft' || s === 'paused') : (s === 'filled' || s === 'closed'); }
    var q = norm(f.q);
    var base = (f.k === 'pub' ? live : f.k === 'need' ? needL : f.k === 'soon' ? soonL : all.filter(function (x) { return stOk(x, f.f); })).filter(function (x) { return !q || norm([x.r.id, x.r.pos, x.r.pb, x.r.cd].join(' ')).indexOf(q) >= 0; });
    var byCo = base.filter(function (x) { return !f.co || x.u.id === f.co; });
    var pbs = {}, pbIx = {}; byCo.forEach(function (x) { pbs[x.r.pb] = (pbs[x.r.pb] || 0) + 1; var di = tdDeptIdx(x.u)[x.r.pb]; pbIx[x.r.pb] = Math.min(pbIx[x.r.pb] === undefined ? 1e6 : pbIx[x.r.pb], (uix[x.u.id] || 0) * 100 + (di === undefined ? 99 : di)); });
    if (f.pb && !pbs[f.pb]) f.pb = '';
    var rows = byCo.filter(function (x) { return !f.pb || x.r.pb === f.pb; });
    rows.sort(function (a, b) { var di = tdDeptIdx(a.u), dj = tdDeptIdx(b.u); return (uix[a.u.id] - uix[b.u.id]) || ((di[a.r.pb] === undefined ? 99 : di[a.r.pb]) - (dj[b.r.pb] === undefined ? 99 : dj[b.r.pb])) || cmp(a.r.pb, b.r.pb) || cmp(b.r.at, a.r.at); });
    var stCnt = function (k) { return all.filter(function (x) { return stOk(x, k); }).length; };
    // 11/11 16:29 anh: Công ty + Phòng ban lên đầu thành khung riêng; Trạng thái (màu khác khi chọn), ô tìm, nút Xem cổng ở thanh ngay trên bảng
    var sec = tdFbox([
      us.length > 1 ? { label: 'Công ty', act: 'td-nco', cur: f.co, items: [['', 'Tất cả', base.length]].concat(us.map(function (u) { return [u.id, shortUnit(u.name), base.filter(function (x) { return x.u === u; }).length]; })) } : null,
      { label: 'Phòng ban', act: 'td-npb', cur: f.pb, items: [['', 'Tất cả', byCo.length]].concat(Object.keys(pbs).sort(function (a, b) { return pbIx[a] - pbIx[b] || cmp(a, b); }).map(function (p) { return [p, p, pbs[p]]; })) }
    ]);
    var bar = '<div class="td-tbar">' + (f.k ? tdFilterChip('Đang lọc: ' + TD_NK[f.k] + ' (' + base.length + ')', 'td-nk') : tdPills('td-nf', f.f, [['open', 'Đang tuyển', stCnt('open')], ['wait', 'Nháp, tạm dừng', stCnt('wait')], ['done', 'Đã đủ người, đã đóng', stCnt('done')], ['all', 'Tất cả', stCnt('all')]], 'st')) +
      '<span class="sp"></span>' + tdSearch('tdNQ', f.q, 'Tìm vị trí, mã phiếu…') + '<button class="btn btn-sm" data-go="tdtin">' + ic('eye', 14) + 'Xem cổng tuyển dụng</button></div>';
    var body = rows.length ? tdReqTable(rows, R, bar) : '<div class="card td-rtbl">' + bar + '<div class="empty" style="padding:28px;text-align:center"><h2>Không có phiếu nào ở mục này</h2><p class="muted">' + (f.k || f.q ? 'Bấm “Bỏ lọc” hoặc xóa ô tìm để xem lại tất cả.' : 'Bấm “Lập phiếu nhu cầu” để bắt đầu – form có sẵn gợi ý vị trí còn thiếu theo định biên.') + '</p></div></div>';
    return '<div class="page-head"><div><h1>Nhu cầu tuyển dụng</h1><p class="muted">Mỗi phiếu là một vị trí cần tuyển, ghi đủ thông tin để đăng lên cổng tuyển dụng. Bật “Trên cổng” để ứng viên thấy và nộp hồ sơ.</p></div><div class="link-row" style="margin:0"><button class="btn btn-primary" data-act="td-req-new">' + ic('td_plus', 15) + 'Lập phiếu nhu cầu</button></div></div>' +
      stats + '<div id="tdList"></div>' + sec + body;
  };
  function tdReqTable(rows, R, bar) {
    var multi = selUnits().length > 1;
    var salTxt = function (r) { return r.salShow && (r.salMin || r.salMax) ? (r.salMin && r.salMax ? tdMil(r.salMin).replace(' triệu', '') + '–' + tdMil(r.salMax) : tdMil(r.salMin || r.salMax)) : (r.salTxt || 'Thỏa thuận'); };
    var liveC = function (x) { return tdCandsOf(x.u, x.r.id).filter(function (c) { return TD_LIVE.indexOf(c.stage) >= 0; }).length; };
    return '<div class="card td-rtbl">' + (bar || '') + table('tdReq', [
      { t: 'Mã', f: function (x) { return x.r.id; }, hide: true },
      { t: 'Vị trí', f: function (x) { return x.r.pos; }, h: function (x) { var fr = tdFair(x.r); return '<a href="#" class="plink td-strong" data-act="td-req-edit" data-u="' + x.u.id + '" data-id="' + x.r.id + '">' + esc(x.r.pos) + '</a><small class="td-sub">' + esc(x.r.id) + ' · ' + esc(x.r.reason || '') + '</small>' + (fr.length ? '<span class="tag tag-warn" style="margin-top:4px" title="' + esc(fr.map(function (z) { return z.what; }).join(', ')) + '">Cần xem lại từ ngữ</span>' : ''); }, wrap: 1 },
      { t: 'Công ty', f: function (x) { return shortUnit(x.u.name); }, hide: true },
      { t: 'Phòng ban', f: function (x) { return x.r.pb; }, h: function (x) { return esc(x.r.pb) + (multi ? '<small class="td-sub">' + esc(shortUnit(x.u.name)) + '</small>' : ''); } },
      { t: 'Trạng thái', f: function (x) { return TD_RST[x.r.st]; }, h: function (x) { var s = x.r.st; return '<span class="tag ' + (s === 'open' ? 'tag-ok' : s === 'draft' ? 'tag-mute' : s === 'paused' ? 'tag-warn' : 'tag-info') + '">' + TD_RST[s] + '</span>'; } },
      { t: 'Trên cổng', f: function (x) { return x.r.pub ? (tdLive(x.r, R) ? 'Đang hiện' : 'Bật – chưa hiện') : 'Không'; }, h: function (x) { var can = x.r.st !== 'closed' && x.r.st !== 'filled', lv = tdLive(x.r, R); return can ? '<span class="td-pubc"><button class="td-sw' + (x.r.pub ? ' on' : '') + '" data-act="td-pub" data-u="' + x.u.id + '" data-id="' + x.r.id + '" title="' + (x.r.pub ? (lv ? 'Đang hiện trên cổng – bấm để tắt' : 'Đã bật nhưng chưa hiện (chưa ở trạng thái Đang tuyển hoặc hết hạn nộp)') : 'Bật để hiện trên cổng') + '"><i></i></button>' + (lv ? '<button class="btn btn-sm td-openlink" data-act="td-open-job" data-u="' + x.u.id + '" data-id="' + x.r.id + '" title="Mở trang tin tuyển dụng của vị trí này trên cổng">' + ic('td_link', 13) + 'Mở tin</button>' : '') + '</span>' : '<span class="muted">—</span>'; } },
      { t: 'Cần / nhận', title: 'Số cần tuyển / số đã đồng ý nhận việc', f: function (x) { return x.r.sl; }, r: 1, h: function (x) { var h = tdHiredCount(x.u, x.r); return '<b>' + x.r.sl + '</b> / ' + (h >= x.r.sl ? '<span style="color:var(--pri);font-weight:700">' + h + '</span>' : h); } },
      { t: 'Đã nhận', f: function (x) { return tdHiredCount(x.u, x.r); }, hide: true },
      { t: 'Hồ sơ', title: 'Hồ sơ đang xét (chưa đóng)', f: liveC, r: 1, h: function (x) { var n = liveC(x); return n ? '<a href="#" class="plink" data-act="td-req-cands" data-u="' + x.u.id + '" data-id="' + x.r.id + '" title="Xem hồ sơ ứng viên của vị trí này">' + n + '</a>' : '0'; } },
      { t: 'Lương', f: function (x) { return salTxt(x.r); }, wrap: 1, cls: 'td-sal' },
      { t: 'Loại lao động', f: function (x) { return x.r.ld || ''; }, hide: true },
      { t: 'Hạn nộp', f: function (x) { return x.r.deadline || ''; }, h: function (x) { if (!x.r.deadline) return ''; var d = tdDiff(R, x.r.deadline), on = x.r.st === 'open'; return '<span' + (on && d < 0 ? ' style="color:var(--danger);font-weight:600"' : on && d <= 7 ? ' style="color:var(--warn);font-weight:600"' : '') + '>' + vn(x.r.deadline) + '</span>' + (on && d !== null ? '<small class="td-sub">' + (d < 0 ? 'đã qua ' + (-d) + ' ngày' : 'còn ' + d + ' ngày') + '</small>' : ''); } },
      { t: 'Cần người trước', f: function (x) { return x.r.needBy || ''; }, hide: true },
      { t: 'Lý do', f: function (x) { return x.r.reason || ''; }, hide: true },
      { t: '', nosort: 1, f: function () { return ''; }, h: function (x) { return '<span class="td-tacts"><button class="btn btn-sm" data-act="td-req-edit" data-u="' + x.u.id + '" data-id="' + x.r.id + '" title="Sửa phiếu">' + ic('td_edit', 14) + '</button><button class="btn btn-sm" data-act="td-req-post" data-u="' + x.u.id + '" data-id="' + x.r.id + '" title="Sao chép tin đăng fanpage, Zalo">' + ic('td_copy', 14) + '</button></span>'; } }
    ], rows, { title: 'Nhu cau tuyen dung', limit: 300 }) + '</div>';
  }
  BINDS.tdnhucau = function () { var f = PS.tdn; tdBindSearch('tdNQ', 'tdn', 'q'); if (f && f.scroll) { f.scroll = 0; setTimeout(function () { var el = $('#tdList'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); } };
  ACTS['td-nf'] = function (a, id) { var f = ps('tdn', {}); f.f = id; f.k = ''; f.pb = ''; render(); };
  ACTS['td-nk'] = function (a, id) {
    var f = ps('tdn', {});
    if (id === 'cand') { var g = ps('tdu', {}); g.rqs = []; g.q = ''; g.src = ''; g.k = ''; g.st = 'live'; g.co = ''; g.star = false; go('tdungvien'); return; }
    if (id === 'open' || !id) { f.k = ''; f.f = 'open'; } else f.k = f.k === id ? '' : id;
    f.co = ''; f.pb = ''; f.scroll = 1; render();
  };
  ACTS['td-nco'] = function (a, id) { var f = ps('tdn', {}); f.co = id; f.pb = ''; render(); };
  ACTS['td-npb'] = function (a, id) { ps('tdn', {}).pb = id; render(); };
  ACTS['td-req-new'] = function (a) { var u = a.getAttribute('data-u') ? unitById(a.getAttribute('data-u')) : selUnits()[0]; if (!u) return; tdReqForm(u, null, { pb: a.getAttribute('data-pb') || '', thay: a.getAttribute('data-thay') || '', cd: a.getAttribute('data-cd') || '', sl: +a.getAttribute('data-n') || 1, reason: a.getAttribute('data-r') || '' }); };
  ACTS['td-req-edit'] = function (a, id) { var u = unitById(a.getAttribute('data-u')); if (u) tdReqForm(u, tdReq(u, id)); };
  ACTS['td-req-cands'] = function (a, id) { var f = ps('tdu', { q: '', rqs: [], src: '', st: 'live', co: '', k: '' }); f.rqs = [a.getAttribute('data-u') + '|' + id]; f.k = ''; f.st = 'all'; f.co = ''; f.star = false; go('tdungvien'); };
  ACTS['td-req-view'] = function (a, id) { var f = ps('tdc', { page: 'list', job: '', dev: window.innerWidth < 720 ? 'mob' : 'pc', u: '' }); f.u = a.getAttribute('data-u'); f.page = 'job'; f.job = id; go('tdtin'); };
  ACTS['td-req-post'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), r = u && tdReq(u, id); if (r) tdPostModal(u, r); };
  ACTS['td-pub'] = function (a, id) {
    var u = unitById(a.getAttribute('data-u')), r = u && tdReq(u, id); if (!r) return;
    function apply() { r.pub = !r.pub; r.upd = tdNow(); tdSave(u, (r.pub ? 'Bật' : 'Tắt') + ' hiện trên cổng: ' + r.pos); render(); toast(r.pub ? 'Đã bật hiện trên cổng: ' + r.pos : 'Đã tắt: ' + r.pos, 'ok', r.pub ? (tdLive(r, refDate()) ? 'Ứng viên xem và nộp hồ sơ được ngay khi cổng kết nối máy chủ. Hiện đang xem thử ở Cổng tuyển dụng.' : 'Phiếu chưa ở trạng thái Đang tuyển hoặc đã hết hạn nộp – vị trí sẽ hiện khi đủ điều kiện.') : 'Vị trí không còn hiện trên cổng; hồ sơ đã nhận vẫn giữ nguyên.'); }
    if (r.pub) return apply();
    var warn = [], fair = tdFair(r);
    if (r.st !== 'open') warn.push('Phiếu đang ở trạng thái "' + TD_RST[r.st] + '" – cần chuyển sang Đang tuyển thì mới hiện.');
    if (r.deadline && r.deadline < refDate()) warn.push('Hạn nhận hồ sơ (' + vn(r.deadline) + ') đã qua.');
    if (!tdOf(u).cfg.policy) warn.push('Cổng chưa có link chính sách xử lý dữ liệu cá nhân – ứng viên cần đọc được trước khi tích đồng ý (Cổng tuyển dụng → Thông tin công ty).');
    if (fair.length) warn.push('Tin có từ ngữ dễ bị coi là phân biệt đối xử / trái quy định: ' + fair.map(function (x) { return '“' + x.hit + '”'; }).join(', ') + '.');
    if (!warn.length) return apply();
    var m = modal('Bật hiện trên cổng: ' + r.pos, 'Kiểm tra trước khi đăng', '<div class="notice warn">' + ic('info') + '<div><ul style="margin:0;padding-left:18px">' + warn.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div></div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" id="tdPE">Sửa phiếu</button><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="tdPO">Vẫn bật</button></div>', true);
    $('#tdPO', m).addEventListener('click', function () { m.close(); apply(); });
    $('#tdPE', m).addEventListener('click', function () { m.close(); tdReqForm(u, r); });
  };

  function tdReqForm(u, r, pre) {
    var isNew = !r, us = selUnits(); pre = pre || {};
    var x = r ? JSON.parse(JSON.stringify(r)) : { pos: pre.cd || '', pb: pre.pb || '', cd: pre.cd || '', sl: pre.sl || 1, reason: pre.reason || 'Bổ sung theo định biên', thay: pre.thay || '', ld: 'Toàn thời gian', prob: 'cd', salMin: 0, salMax: 0, salShow: true, place: tdOf(u).cfg.addr, time: 'Thứ Hai – Thứ Sáu, 08:00–17:00', deadline: tdAdd(refDate(), 21), needBy: tdAdd(refDate(), 30), owner: tdOf(u).cfg.contact.split(' – ')[0], desc: '', reqs: '', bens: '', st: 'open', pub: false, note: '' };
    function body(u) {
      var pbs = u.data.PB.map(function (p) { return p['Tên phòng ban']; }); if (x.pb && pbs.indexOf(x.pb) < 0) pbs.push(x.pb);
      var nvs = u.data.NV.filter(function (e) { return e['Ngày nghỉ việc']; });
      return '<div class="td-form">' + (isNew ? tdUnitPick(us, u.id) + '<div id="rSug">' + sugHtml(u) + '</div>' : '') +
        '<h4>Vị trí cần tuyển</h4><div class="td-g2">' +
        '<div class="field" style="grid-column:1/-1"><label for="rPos">Tên vị trí đăng tuyển *</label><input class="input" id="rPos" value="' + esc(x.pos) + '" placeholder="Ví dụ: Chuyên viên hành chính – nhân sự"><div class="hint">Tên hiện trên cổng tuyển dụng và tin đăng.</div></div>' +
        selectBox('rPb', 'Phòng ban *', [['', '— Chọn phòng ban —']].concat(pbs.map(function (p) { return [p, p]; })), x.pb) +
        field('rCd', 'Chức danh ghi trên hợp đồng', x.cd, ' placeholder="Ví dụ: Chuyên viên hành chính – nhân sự"') +
        field('rSl', 'Số lượng cần tuyển *', x.sl, ' inputmode="numeric"') +
        selectBox('rReason', 'Lý do tuyển', TD_REASON.map(function (s) { return [s, s]; }), x.reason) +
        selectBox('rThay', 'Thay cho (nếu thay người nghỉ)', [['', '— Không —']].concat(nvs.map(function (e) { return [e['Mã NV'], e['Họ và tên'] + ' – nghỉ ' + vn(e['Ngày nghỉ việc'])]; })), x.thay) +
        field('rOwner', 'Người phụ trách tuyển', x.owner) + '</div>' +
        '<h4>Điều kiện làm việc</h4><div class="td-g3">' +
        selectBox('rLd', 'Loại lao động', TD_LD.map(function (s) { return [s, s]; }), x.ld) +
        selectBox('rProb', 'Thử việc theo loại công việc', TD_PROB.map(function (p) { return [p[0], p[1] + ' – tối đa ' + p[2] + ' ' + p[3]]; }).concat([['none', 'Không thử việc']]), x.prob) +
        field('rTime', 'Thời gian làm việc', x.time) +
        field('rMin', 'Lương từ (đồng/tháng)', x.salMin ? fmtInt(x.salMin) : '', ' inputmode="numeric" placeholder="Ví dụ 10.000.000"') +
        field('rMax', 'Lương đến (đồng/tháng)', x.salMax ? fmtInt(x.salMax) : '', ' inputmode="numeric"') +
        field('rSalTxt', 'Hoặc ghi cách trả lương', x.salTxt || '', ' placeholder="Ví dụ: thỏa thuận, theo giờ…"') +
        '<div class="field" style="grid-column:1/-1"><label for="rPlace">Địa điểm làm việc</label><input class="input" id="rPlace" value="' + esc(x.place || '') + '"></div></div>' +
        '<label class="td-chk" style="margin-top:8px"><input type="checkbox" id="rSalShow"' + (x.salShow ? ' checked' : '') + '> Hiện mức lương trên cổng tuyển dụng <span class="muted">(nên hiện – ứng viên thường lướt qua tin không ghi lương)</span></label>' +
        '<div id="rProbH" class="hint" style="margin-top:6px"></div>' +
        '<h4>Nội dung tin (hiện trên trang vị trí)</h4><div class="td-g3">' +
        '<div class="field"><label for="rDesc">Mô tả công việc</label><textarea class="input" id="rDesc" placeholder="Mỗi dòng một ý">' + esc(x.desc || '') + '</textarea></div>' +
        '<div class="field"><label for="rReqs">Yêu cầu</label><textarea class="input" id="rReqs" placeholder="Mỗi dòng một ý">' + esc(x.reqs || '') + '</textarea></div>' +
        '<div class="field"><label for="rBens">Quyền lợi</label><textarea class="input" id="rBens" placeholder="Mỗi dòng một ý">' + esc(x.bens || '') + '</textarea></div></div>' +
        '<div id="rFair" style="margin-top:8px"></div>' +
        '<h4>Thời hạn và trạng thái</h4><div class="td-g3">' + dbox('rDl', x.deadline, 'Hạn nhận hồ sơ') + dbox('rNeed', x.needBy, 'Cần người trước ngày') +
        selectBox('rSt', 'Trạng thái', Object.keys(TD_RST).map(function (k) { return [k, TD_RST[k]]; }), x.st) + '</div>' +
        '<div class="field" style="margin-top:10px"><label for="rNote">Ghi chú nội bộ (không hiện trên cổng)</label><input class="input" id="rNote" value="' + esc(x.note || '') + '"></div>' +
        '<label class="td-chk" style="margin-top:10px"><input type="checkbox" id="rPub"' + (x.pub ? ' checked' : '') + '> Hiện trên cổng tuyển dụng khi ở trạng thái Đang tuyển và còn hạn nhận hồ sơ</label></div>';
    }
    var SG = [];
    function sugHtml(u) {
      SG = tdSuggest(u);
      if (!SG.length) return '<div class="td-sugbox none">' + ic('check', 15) + '<span>Theo định biên trong Danh mục phòng ban, ' + esc(shortUnit(u.name)) + ' không thiếu người ở phòng ban nào và không có ai sắp nghỉ trong 60 ngày tới.</span></div>';
      return '<div class="td-sugbox"><h5>Gợi ý từ định biên và người sắp nghỉ – ' + esc(shortUnit(u.name)) + '</h5><p class="muted">So số người đang làm với định biên trong Danh mục phòng ban, cộng người có ngày nghỉ việc trong 60 ngày tới. Bấm “Dùng gợi ý” để điền sẵn phòng ban, chức danh, số lượng, lý do.</p><div class="td-sug">' + SG.map(function (g, i) {
        return '<div class="td-sug-i" data-sgi="' + i + '"><div><b>' + esc(g.pb) + ' · cần ' + g.n + '</b><small>' + esc(g.why) + (g.has.length ? ' · <b style="display:inline;color:var(--warn)">đã có phiếu ' + g.has.map(function (r) { return r.id + ' (' + TD_RST[r.st].toLowerCase() + ')'; }).join(', ') + '</b>' : '') + '</small></div>' +
          (g.has.length ? '<button type="button" class="btn btn-sm" data-sgo="' + g.has[0].id + '">Mở phiếu ' + g.has[0].id + '</button>' : '') + '<button type="button" class="btn btn-sm' + (g.has.length ? '' : ' btn-primary') + '" data-sg="' + i + '">Dùng gợi ý</button></div>';
      }).join('') + '</div></div>';
    }
    var foot = '<div class="link-row nv-foot" style="margin-top:16px">' + (isNew ? '<span></span>' : '<span class="link-row" style="margin:0"><button class="btn" id="rDup">Nhân bản phiếu</button>' + (tdCandsOf(u, r.id).length ? '' : '<button class="btn btn-danger-ghost" id="rDel">Xóa phiếu</button>') + '</span>') + '<span class="link-row" style="margin:0"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="rSave">' + (isNew ? 'Lưu phiếu' : 'Lưu thay đổi') + '</button></span></div>';
    var m = modal(isNew ? 'Lập phiếu nhu cầu tuyển dụng' : r.pos, isNew ? 'Phiếu do người quản trị lập, không qua cấp duyệt. Trường có dấu * là bắt buộc.' : r.id + ' · ' + TD_RST[r.st] + (isMulti() ? ' · ' + shortUnit(u.name) : ''), '<div id="rBody">' + body(u) + '</div>' + foot);
    m.querySelector('.modal').classList.add('lg');
    m.addEventListener('click', function (e) {
      var o = e.target.closest('[data-sgo]'); if (o) { var rr = tdReq(u, o.getAttribute('data-sgo')); m.close(); if (rr) tdReqForm(u, rr); return; }
      var b = e.target.closest('[data-sg]'); if (!b) return; var g = SG[+b.getAttribute('data-sg')]; if (!g) return;
      function set(id, v) { var el = $('#' + id, m); if (!el || v === '' || v == null) return; if (el.tagName === 'SELECT' && !$$('option', el).some(function (op) { return op.value === String(v); })) return; el.value = v; el.classList.add('qr-fill'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      set('rPb', g.pb); set('rSl', g.n); set('rReason', g.thay ? 'Thay người nghỉ việc' : 'Bổ sung theo định biên'); set('rThay', g.thay); set('rCd', g.cd);
      if (!$('#rPos', m).value.trim() && g.cd) set('rPos', g.cd.replace(/\s*\(.*\)\s*$/, ''));
      $$('.td-sug-i', m).forEach(function (el) { el.classList.toggle('used', el.getAttribute('data-sgi') === b.getAttribute('data-sg')); });
      b.textContent = '✓ Đã điền'; var p = $('#rPos', m); if (p) { p.focus(); p.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
    function bind() {
      $$('.dbox', m).forEach(bindDbox);
      ['rMin', 'rMax'].forEach(function (k) { var el = $('#' + k, m); el.addEventListener('input', function () { var d = el.value.replace(/\D/g, ''); el.value = d ? fmtInt(+d) : ''; }); });
      function hint() {
        var p = $('#rProb', m).value, ld = $('#rLd', m).value, pk = TD_PROB.filter(function (z) { return z[0] === p; })[0];
        $('#rProbH', m).innerHTML = (ld === 'Cộng tác viên' ? '<span class="tag tag-warn">Cộng tác viên</span> Ký hợp đồng dịch vụ, không áp dụng thử việc theo BLLĐ. Nếu công việc có đủ dấu hiệu quan hệ lao động (trả lương, chịu quản lý, điều hành) thì phải ký hợp đồng lao động. ' : '') +
          (pk ? 'Thử việc tối đa <b>' + pk[2] + ' ' + pk[3] + '</b> (BLLĐ 2019 Điều 25 ' + pk[4] + '), chỉ thử việc 1 lần cho một công việc; lương thử việc ít nhất 85% lương của công việc đó (Điều 26). Không áp dụng thử việc nếu hợp đồng dưới 1 tháng (Điều 24 khoản 3).' : '');
      }
      $('#rProb', m).addEventListener('change', hint); $('#rLd', m).addEventListener('change', function () { if ($('#rLd', m).value === 'Cộng tác viên') $('#rProb', m).value = 'none'; hint(); }); hint();
      function fair() { $('#rFair', m).innerHTML = tdFairHtml(tdFair({ pos: $('#rPos', m).value, desc: $('#rDesc', m).value, reqs: $('#rReqs', m).value, bens: $('#rBens', m).value })); }
      ['rPos', 'rDesc', 'rReqs', 'rBens'].forEach(function (k) { $('#' + k, m).addEventListener('input', fair); }); fair();
    }
    bind();
    function onU() { var up = $('#tdU', m); u = unitById(up.value); x.place = tdOf(u).cfg.addr; x.pb = ''; x.thay = ''; $('#rBody', m).innerHTML = body(u); bind(); var up2 = $('#tdU', m); if (up2) up2.addEventListener('change', onU); }
    var up0 = $('#tdU', m); if (up0) up0.addEventListener('change', onU);
    $('#rSave', m).addEventListener('click', function () {
      var v = function (k) { var el = $('#' + k, m); return el ? el.value.trim() : ''; };
      var bad = function (k, t, s) { var el = $('#' + k, m); if (el) { el.classList.add('bad'); el.focus(); el.addEventListener('input', function () { el.classList.remove('bad'); }, { once: true }); } toast(t, 'err', s || ''); };
      if (!v('rPos')) return bad('rPos', 'Chưa có tên vị trí');
      if (!v('rPb')) return bad('rPb', 'Chưa chọn phòng ban');
      if (!/^\d{1,3}$/.test(v('rSl')) || +v('rSl') < 1) return bad('rSl', 'Số lượng cần tuyển là số từ 1');
      var mn = +v('rMin').replace(/\D/g, '') || 0, mx = +v('rMax').replace(/\D/g, '') || 0;
      if (mn && mx && mn > mx) return bad('rMax', 'Lương "đến" nhỏ hơn lương "từ"');
      var dl = $('#rDl', m)._get(), nb = $('#rNeed', m)._get();
      if (dl === null) return bad('rDl-d', 'Hạn nhận hồ sơ chưa đúng', 'Nhập dd/mm/yyyy.');
      if (nb === null) return bad('rNeed-d', 'Ngày cần người chưa đúng', 'Nhập dd/mm/yyyy.');
      var t = tdOf(u), o = r || { id: tdNext(t.rq, 'TD', 3), at: tdNow() };
      var oldSlug = o.slug;
      Object.assign(o, { pos: v('rPos').replace(/\s+/g, ' '), pb: v('rPb'), cd: v('rCd'), sl: +v('rSl'), reason: v('rReason'), thay: v('rThay'), owner: v('rOwner'), ld: v('rLd'), prob: v('rProb'), time: v('rTime'), salMin: mn, salMax: mx, salTxt: v('rSalTxt'), salShow: $('#rSalShow', m).checked, place: v('rPlace'), desc: $('#rDesc', m).value.trim(), reqs: $('#rReqs', m).value.trim(), bens: $('#rBens', m).value.trim(), deadline: dl || '', needBy: nb || '', st: v('rSt'), note: v('rNote'), pub: $('#rPub', m).checked, upd: tdNow() });
      if (!oldSlug || isNew) { var sl = tdSlug(o.pos), s2 = sl, i = 2; while (t.rq.some(function (z) { return z !== o && z.slug === s2; })) s2 = sl + '-' + i++; o.slug = s2; }
      if (isNew) t.rq.push(o);
      tdSave(u, (isNew ? 'Lập phiếu ' : 'Sửa phiếu ') + o.id + ' ' + o.pos);
      m.close(); ps('tdn', { f: 'open' }).f = o.st === 'open' ? 'open' : o.st === 'draft' || o.st === 'paused' ? 'wait' : 'done'; render();
      var fr = tdFair(o); toast((isNew ? 'Đã lập phiếu ' : 'Đã lưu ') + o.pos, fr.length ? 'info' : 'ok', fr.length ? 'Tin còn từ ngữ cần xem lại: ' + fr.map(function (z) { return z.what; }).join(', ') + '.' : (o.pub && o.st === 'open' ? 'Vị trí đang hiện trên cổng tuyển dụng.' : 'Bật "Hiện trên cổng" khi sẵn sàng nhận hồ sơ.'));
    });
    var dp = $('#rDup', m); if (dp) dp.addEventListener('click', function () { var t = tdOf(u), o = JSON.parse(JSON.stringify(r)); o.id = tdNext(t.rq, 'TD', 3); o.pos = r.pos + ' (bản sao)'; o.slug = tdSlug(o.pos); o.st = 'draft'; o.pub = false; o.at = o.upd = tdNow(); t.rq.push(o); tdSave(u, 'Nhân bản phiếu ' + r.id + ' → ' + o.id); m.close(); ps('tdn', {}).f = 'wait'; render(); toast('Đã nhân bản thành phiếu nháp ' + o.id, 'ok'); });
    var dd = $('#rDel', m); if (dd) dd.addEventListener('click', function () { confirmBox('Xóa phiếu ' + r.pos + '?', 'Phiếu chưa có ứng viên nào. Xóa xong không khôi phục được.', 'Xóa phiếu', function () { var t = tdOf(u); t.rq = t.rq.filter(function (z) { return z !== r; }); tdSave(u, 'Xóa phiếu ' + r.id); m.close(); render(); }); });
  }

  function tdPostText(u, r) {
    var cf = tdOf(u).cfg, sal = r.salShow && (r.salMin || r.salMax) ? (r.salMin && r.salMax ? fmtInt(r.salMin) + ' – ' + fmtInt(r.salMax) + ' đồng/tháng' : fmtInt(r.salMin || r.salMax) + ' đồng/tháng') : (r.salTxt || 'Thỏa thuận');
    var L = function (t, s) { var l = tdLines(s); return l.length ? '\n' + t + '\n' + l.map(function (x) { return '✔ ' + x; }).join('\n') + '\n' : ''; };
    return '📣 ' + cf.short.toUpperCase() + ' TUYỂN ' + r.pos.toUpperCase() + (r.sl > 1 ? ' (' + r.sl + ' người)' : '') + '\n\n' +
      '📍 Nơi làm việc: ' + (r.place || cf.addr) + '\n🕗 Thời gian: ' + (r.time || '') + '\n💰 Thu nhập: ' + sal + '\n📅 Hạn nhận hồ sơ: ' + (r.deadline ? vn(r.deadline) : 'đến khi đủ người') + '\n' +
      L('Công việc:', r.desc) + L('Yêu cầu:', r.reqs) + L('Quyền lợi:', r.bens) +
      '\n👉 Xem chi tiết và nộp CV tại: ' + tdPortalLink(u, r) + '\n' + (cf.phone ? '☎ Hỏi thêm: ' + tdPhoneFmt(cf.phone) + (cf.email ? ' · ' + cf.email : '') + '\n' : '') + '\nCông ty không thu bất kỳ khoản phí nào khi tuyển dụng.';
  }
  function tdPostModal(u, r) {
    var txt = tdPostText(u, r), fair = tdFair(r);
    var m = modal('Tin đăng: ' + r.pos, 'Dùng cho fanpage, nhóm Facebook / Zalo, trang việc làm – link dẫn về trang vị trí trên cổng', tdFairHtml(fair) + '<textarea class="input" id="tdPT" style="width:100%;min-height:380px;line-height:1.55;margin-top:' + (fair.length ? '12' : '0') + 'px">' + esc(txt) + '</textarea><div class="notice" style="margin-top:10px">' + ic('info') + '<div>Link <code>' + esc(tdPortalLink(u, r)) + '</code> là link dự kiến – chỉ mở được khi cổng tuyển dụng đã kết nối máy chủ.</div></div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Đóng</button><button class="btn btn-primary" id="tdPC">' + ic('td_copy', 15) + 'Sao chép tin</button></div>');
    $('#tdPC', m).addEventListener('click', function () { tdCopy($('#tdPT', m).value, 'tin tuyển dụng'); });
  }

  /* =====================================================================
     2) CỔNG TUYỂN DỤNG – trang mẫu (danh sách vị trí + chi tiết vị trí + form ứng tuyển)
        Hàm tdPortalHtml dựng 1 trang HTML độc lập; khi kết nối máy chủ, trang này đưa lên Cloudflare
        (dữ liệu vị trí gửi lên kèm D.api) – xem may-chu/THIET-KE-KET-NOI.md
     ===================================================================== */
  function tdPortalData(u, mode) {
    var t = tdOf(u), cf = t.cfg, R = refDate();
    var jobs = t.rq.filter(function (r) { return tdLive(r, R); }).map(function (r) {
      return { id: r.id, slug: r.slug, pos: r.pos, pb: r.pb, sl: r.sl, ld: r.ld, place: r.place || cf.addr, time: r.time, deadline: r.deadline ? vn(r.deadline) : '', left: r.deadline ? tdDiff(R, r.deadline) : null,
        sal: r.salShow && (r.salMin || r.salMax) ? (r.salMin && r.salMax ? tdMil(r.salMin).replace(' triệu', '') + ' – ' + tdMil(r.salMax) : 'Từ ' + tdMil(r.salMin || r.salMax)) : (r.salTxt || 'Thỏa thuận'),
        desc: tdLines(r.desc), reqs: tdLines(r.reqs), bens: tdLines(r.bens), prob: r.prob === 'none' ? '' : (TD_PROB.filter(function (p) { return p[0] === r.prob; })[0] || [])[2] || '', posted: vn(String(r.at || '').slice(0, 10)) };
    });
    var ab = cf.ab || tdAbout0(u), nNv = (u.data && u.data.NV || []).filter(function (e) { try { return HR.isActive(e, R); } catch (x) { return false; } }).length, nPb = (u.data && u.data.PB || []).length;
    var abD = { story: ab.story || '', mission: ab.mission || '', env: ab.env || '', values: tdLines(ab.values).map(function (l) { var k = l.indexOf(':'); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : [l, '']; }), perks: tdLines(ab.perks), stats: ab.stats === false ? [] : [[nNv, 'nhân sự đang làm việc'], [nPb, 'phòng ban, bộ phận'], [jobs.length, 'vị trí đang tuyển']].filter(function (x) { return x[0] > 0; }) };
    return { mode: mode || 'preview', u: u.id, ab: abD, co: { name: cf.name, short: cf.short, tag: cf.tag, intro: cf.intro, addr: cf.addr, email: cf.email, phone: tdPhoneFmt(cf.phone), contact: cf.contact, policy: cf.policy, keep: cf.keep, color: cf.color, why: cf.why || [], steps: tdLines(cf.steps) }, jobs: jobs, base: tdPortalLink(u), api: cf.srv && cf.srv.on ? cf.srv.url : '' };
  }
  /* eslint-disable no-undef */
  function tdAboutPage(nn) {
    cur = null; if (!nn) nav('ve-chung-toi');
    var A = D.ab || { values: [], perks: [], stats: [] }, c = D.co, P = function (s) { return s ? '<p>' + esc(s) + '</p>' : ''; };
    var ct = [c.contact, c.addr, c.phone ? '☎ ' + c.phone : '', c.email].filter(Boolean).map(esc).join(' · ');
    app.innerHTML = head() + '<section class="hero"><div class="wrap"><small>Về chúng tôi</small><h1>' + esc(c.name) + '</h1><p>' + esc(c.tag || '') + '</p></div></section><main><div class="wrap ab">' +
      '<div class="crumb"><button data-home>← Vị trí đang tuyển</button></div>' +
      (A.stats && A.stats.length ? '<div class="stats">' + A.stats.map(function (s) { return '<div><b>' + s[0] + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="abg">' + (c.intro || A.story ? '<div class="card blk"><h2>Câu chuyện của chúng tôi</h2>' + P(c.intro) + P(A.story) + '</div>' : '') + (A.mission ? '<div class="card blk mis"><h2>Sứ mệnh</h2>' + P(A.mission) + '</div>' : '') + '</div>' +
      (A.values.length ? '<h2 class="h2">Giá trị cốt lõi</h2><div class="vals">' + A.values.map(function (v) { return '<div><b>' + esc(v[0]) + '</b>' + P(v[1]) + '</div>'; }).join('') + '</div>' : '') +
      '<div class="abg">' + (A.env ? '<div class="card blk"><h2>Môi trường làm việc</h2>' + P(A.env) + '</div>' : '') + (A.perks.length ? '<div class="card blk"><h2>Chế độ cho người lao động</h2><ul>' + A.perks.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') + '</div>' +
      '<div class="cta"><div><h2>Cùng làm việc với ' + esc(c.short) + '</h2><p>' + (D.jobs.length ? D.jobs.length + ' vị trí đang nhận hồ sơ' : 'Hiện chưa mở vị trí mới – hãy quay lại sau') + '</p></div><button class="go" data-home>Xem vị trí đang tuyển →</button></div>' +
      (ct ? '<div class="card blk"><h2>Liên hệ</h2><p>' + ct + '</p></div>' : '') + '</div></main>' + foot();
    window.scrollTo(0, 0);
  }
  /* eslint-enable no-undef */
  // Favicon trang cổng = hình Đốm của phần mềm (11/11 20:42 anh: link mở từ cổng đang để favicon mặc định)
  function tdFav() { var l = document.querySelector('link[rel~="icon"]'); return (l && l.href) || 'https://quantritute.com/favicon.svg'; }
  function tdPortalHtml(D, start) {
    var SC = '<' + '/script>';
    var css = ':root{--c:' + D.co.color + ';--ink:#17212B;--mut:#5C6873;--line:#E3E8EC;--bg:#F6F8FA;--soft:color-mix(in srgb,var(--c) 10%,#fff);--soft2:color-mix(in srgb,var(--c) 18%,#fff)}' +
      '*{box-sizing:border-box}html,body{margin:0}body{font-family:"Be Vietnam Pro","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}' +
      'a{color:var(--c)}button,input,select,textarea{font:inherit}.wrap{max-width:1080px;margin:0 auto;padding:0 20px}' +
      '.pv{background:#FFF4D6;color:#6B4B00;font-size:12.5px;padding:7px 16px;text-align:center;border-bottom:1px solid #F1DE9F}' +
      'header.top{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}header.top .wrap{display:flex;align-items:center;gap:12px;height:62px}.logo{width:38px;height:38px;border-radius:10px;background:var(--c);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:-.02em;flex:none}.brand b{display:block;font-size:15px;line-height:1.2}.brand small{color:var(--mut);font-size:12px}.top .sp{flex:1}.top nav a{font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);padding:8px 12px;border-radius:8px}.top nav a:hover{background:var(--bg)}' +
      '.hero{background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));color:#fff;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;right:-80px;top:-80px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.18),transparent 70%)}.hero .wrap{padding:52px 20px 44px;position:relative}.hero small{text-transform:uppercase;letter-spacing:.12em;font-size:12px;opacity:.85;font-weight:700}.hero h1{font-size:36px;line-height:1.15;margin:8px 0 12px;letter-spacing:-.02em;max-width:640px}.hero p{max-width:620px;opacity:.92;margin:0}' +
      '.find{display:flex;gap:8px;margin-top:24px;max-width:620px}.find input,.find select{flex:1;height:46px;border-radius:10px;border:none;padding:0 14px;color:var(--ink);min-width:0}.find select{flex:0 0 190px}' +
      'main{padding:32px 0 48px}.sec-t{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 14px}.sec-t h2{margin:0;font-size:22px;letter-spacing:-.01em}.sec-t span{color:var(--mut);font-size:14px}' +
      '.jobs{display:grid;gap:12px}.job{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;display:flex;gap:16px;align-items:center;cursor:pointer;transition:border-color .15s,box-shadow .15s;text-align:left;color:inherit;width:100%}.job:hover{border-color:var(--c);box-shadow:0 6px 22px -12px rgba(0,0,0,.25)}.job>div{flex:1;min-width:0}.job h3{margin:0 0 6px;font-size:17px;line-height:1.35}.chips{display:flex;flex-wrap:wrap;gap:6px 14px;color:var(--mut);font-size:13.5px}.chips span{display:inline-flex;align-items:center;gap:5px}.chips svg{width:15px;height:15px}.sal{color:var(--c);font-weight:700}' +
      '.go{flex:none;height:40px;padding:0 16px;border-radius:10px;background:var(--soft);color:var(--c);font-weight:700;border:none;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.job:hover .go{background:var(--c);color:#fff}.new{display:inline-block;font-size:11px;font-weight:700;background:#E8F5EE;color:#1F7A4C;border-radius:6px;padding:1px 7px;margin-left:8px;vertical-align:2px}.hot{background:#FDECEA;color:#B03A2E}' +
      '.why{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:36px}.why div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}.why b{display:flex;width:34px;height:34px;border-radius:10px;background:var(--soft);color:var(--c);align-items:center;justify-content:center;margin-bottom:10px}.about{margin-top:36px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px}.about h2{margin:0 0 8px;font-size:18px}' +
      '.ab .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}.ab .stats div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px}.ab .stats b{display:block;font-size:30px;color:var(--c);line-height:1.1}.ab .stats span{color:var(--mut);font-size:14px}' +
      '.abg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:14px;align-items:start}.abg .card+.card{margin-top:0}.ab .blk p{margin:0 0 10px}.ab .blk p:last-child{margin:0}.mis{background:var(--soft);border-color:var(--soft2)}.mis p{font-size:17px;line-height:1.55}' +
      '.ab .h2{font-size:22px;margin:26px 0 12px}.vals{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:24px}.vals div{background:#fff;border:1px solid var(--line);border-top:4px solid var(--c);border-radius:12px;padding:16px}.vals b{font-size:16px}.vals p{margin:6px 0 0;color:var(--mut);font-size:14px}' +
      '.cta{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:linear-gradient(135deg,var(--c),color-mix(in srgb,var(--c) 70%,#000));color:#fff;border-radius:16px;padding:22px 24px;margin:6px 0 14px}.cta h2{margin:0 0 4px;font-size:20px}.cta p{margin:0;opacity:.85}.cta .go{background:#fff;color:var(--c)}' +
      '.about .go{margin-top:12px}' +
      '.empty{background:#fff;border:1px dashed var(--line);border-radius:14px;padding:36px;text-align:center;color:var(--mut)}' +
      'footer{background:#fff;border-top:1px solid var(--line);padding:24px 0;color:var(--mut);font-size:13.5px}footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}' +
      '.crumb{font-size:14px;margin-bottom:14px}.crumb button{border:none;background:none;color:var(--c);font-weight:600;cursor:pointer;padding:0}.dt{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;align-items:start}.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px}.card+.card{margin-top:14px}' +
      '.dt h1{font-size:28px;line-height:1.2;margin:0 0 10px;letter-spacing:-.015em}.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0 4px}.facts div{background:var(--bg);border-radius:10px;padding:10px 12px}.facts small{display:block;color:var(--mut);font-size:12px}.facts b{font-size:14px}' +
      '.blk h2{font-size:17px;margin:0 0 10px}.blk ul{margin:0;padding-left:0;list-style:none}.blk li{position:relative;padding-left:24px;margin:7px 0}.blk li:before{content:"";position:absolute;left:4px;top:9px;width:8px;height:8px;border-radius:50%;background:var(--c)}.steps{counter-reset:s;display:grid;gap:8px}.steps div{display:flex;gap:10px;align-items:center}.steps div:before{counter-increment:s;content:counter(s);width:26px;height:26px;border-radius:50%;background:var(--soft);color:var(--c);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}' +
      '.share{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.share button{border:1px solid var(--line);background:#fff;border-radius:9px;height:36px;padding:0 12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--ink)}' +
      '.apply{position:sticky;top:78px}.apply h2{margin:0 0 4px;font-size:18px}.apply p.s{margin:0 0 14px;color:var(--mut);font-size:13.5px}.f{margin-bottom:12px}.f label{display:block;font-size:13px;font-weight:600;margin-bottom:5px}.f input,.f select,.f textarea{width:100%;border:1px solid #CFD7DD;border-radius:9px;padding:10px 12px;background:#fff;color:var(--ink)}.f textarea{min-height:80px;resize:vertical}.f input:focus,.f select:focus,.f textarea:focus{outline:2px solid var(--soft2);border-color:var(--c)}.f.bad input,.f.bad .drop{border-color:#C0392B;background:#FFF6F5}.f .err{color:#C0392B;font-size:12.5px;margin-top:4px;display:none}.f.bad .err{display:block}' +
      '.drop{border:1.5px dashed #BFC9D0;border-radius:10px;padding:14px;text-align:center;cursor:pointer;font-size:13.5px;color:var(--mut);background:var(--bg)}.drop b{color:var(--c)}.drop.ok{border-style:solid;border-color:var(--c);background:var(--soft);color:var(--ink)}' +
      '.cons{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5;margin:6px 0 14px}.cons input{width:18px;height:18px;margin-top:1px;flex:none;accent-color:var(--c)}.cons.bad{color:#C0392B}' +
      '.sub{width:100%;height:48px;border:none;border-radius:11px;background:var(--c);color:#fff;font-weight:700;font-size:15.5px;cursor:pointer}.sub:disabled{opacity:.6;cursor:wait}.fine{font-size:12px;color:var(--mut);margin-top:10px;text-align:center}' +
      '.ok{text-align:center;padding:12px 4px}.ok i{display:flex;width:56px;height:56px;border-radius:50%;background:#E8F5EE;color:#1F7A4C;align-items:center;justify-content:center;margin:0 auto 12px}.ok h2{margin:0 0 6px}.ok code{background:var(--bg);padding:2px 8px;border-radius:6px;font-weight:700}' +
      '.mob-apply{display:none}' +
      '@media (max-width:820px){.dt{grid-template-columns:1fr}.apply{position:static}.why{grid-template-columns:1fr}.hero h1{font-size:28px}.hero .wrap{padding:36px 20px 32px}.find{flex-direction:column}.find input,.find select{flex:none;width:100%}.top nav{display:none}.job{flex-direction:column;align-items:stretch}.go{justify-content:center}.facts{grid-template-columns:1fr 1fr}.mob-apply{display:block;position:sticky;bottom:0;padding:10px 16px;background:#fff;border-top:1px solid var(--line);z-index:4}.dt h1{font-size:23px}}';
    var js = '(function(){var D=' + JSON.stringify(D).replace(/</g, '\\u003c') + ',START=' + JSON.stringify(start || {}) + ';' +
      'var $=function(s,r){return(r||document).querySelector(s)};function esc(s){return String(s==null?"":s).replace(/[&<>"\']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\'":"&#39;"}[c]})}' +
      'var I={pin:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>\',money:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>\',clock:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>\',team:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/></svg>\',cal:\'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>\',arr:\'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>\',chk:\'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>\',star:\'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>\'};' +
      'var ini=(D.co.short||D.co.name).split(/\\s+/).filter(function(w){return w.length}).slice(-2).map(function(w){return w.charAt(0)}).join("").toUpperCase();' +
      'var app=document.getElementById("app"),cur=null,q="",pb="";' +
      'function head(){return(D.thu?\'<div class="pv">Trang thử nghiệm của Phần mềm nhân sự (Quản trị tử tế) – dữ liệu mẫu hư cấu. Vui lòng không nhập thông tin thật; hồ sơ tự xóa sau 24 giờ.</div>\':"")+(D.mode==="preview"?\'<div class="pv">Bản xem trước của cổng tuyển dụng – hồ sơ gửi ở đây được lưu thẳng vào phần mềm trên máy này (chưa kết nối máy chủ)</div>\':"")+\'<header class="top"><div class="wrap"><div class="logo">\'+esc(ini)+\'</div><div class="brand"><b>\'+esc(D.co.short)+\'</b><small>Tuyển dụng</small></div><span class="sp"></span><nav><a href="#" data-home>Vị trí đang tuyển</a><a href="#ve-chung-toi" data-about>Về chúng tôi</a></nav></div></header>\'}' +
      'function foot(){return\'<footer><div class="wrap"><span>© \'+new Date().getFullYear()+" "+esc(D.co.name)+(D.co.addr?" · "+esc(D.co.addr):"")+\'</span><span>\'+(D.co.phone?"☎ "+esc(D.co.phone)+" · ":"")+(D.co.email?esc(D.co.email)+" · ":"")+(D.co.policy?\'<a href="\'+esc(D.co.policy)+\'" target="_blank" rel="noopener">Chính sách xử lý dữ liệu cá nhân</a>\':"")+\'</span></div></footer>\'}' +
      'function chips(j){return\'<div class="chips"><span>\'+I.team+esc(j.pb)+\'</span><span class="sal">\'+I.money+esc(j.sal)+\'</span><span>\'+I.clock+esc(j.ld)+\'</span>\'+(j.deadline?\'<span>\'+I.cal+"Hạn nộp "+esc(j.deadline)+\'</span>\':"")+\'</div>\'}' +
      'function list(nn){cur=null;if(!nn)nav("");var pbs={};D.jobs.forEach(function(j){pbs[j.pb]=1});var Q=q.toLowerCase();var js=D.jobs.filter(function(j){return(!pb||j.pb===pb)&&(!Q||(j.pos+" "+j.pb+" "+j.desc.join(" ")).toLowerCase().indexOf(Q)>=0)});' +
      'app.innerHTML=head()+\'<section class="hero"><div class="wrap"><small>Cơ hội nghề nghiệp</small><h1>Cùng \'+esc(D.co.short)+\' làm nên những điều tử tế</h1><p>\'+esc(D.co.tag||"")+\'</p><div class="find"><input id="q" placeholder="Tìm vị trí, ví dụ: nhân sự, giảng viên…" value="\'+esc(q)+\'"><select id="pb"><option value="">Tất cả bộ phận</option>\'+Object.keys(pbs).map(function(p){return\'<option\'+(p===pb?" selected":"")+\'>\'+esc(p)+\'</option>\'}).join("")+\'</select></div></div></section>\'+' +
      '\'<main><div class="wrap"><div class="sec-t"><h2>Vị trí đang tuyển</h2><span>\'+js.length+" vị trí"+\'</span></div>\'+(js.length?\'<div class="jobs">\'+js.map(function(j){return\'<button class="job" data-job="\'+esc(j.id)+\'"><div><h3>\'+esc(j.pos)+(j.left!==null&&j.left<=5?\'<span class="new hot">Sắp hết hạn</span>\':"")+(j.sl>1?\'<span class="new">Cần \'+j.sl+" người</span>":"")+\'</h3>\'+chips(j)+\'</div><span class="go">Xem chi tiết \'+I.arr+\'</span></button>\'}).join("")+\'</div>\':\'<div class="empty">\'+(D.jobs.length?"Không có vị trí phù hợp với tìm kiếm.":"Hiện chưa có vị trí đang tuyển. Bạn quay lại sau nhé!")+\'</div>\')+' +
      '\'<div class="why">\'+D.co.why.map(function(w){return\'<div><b>\'+I.star+\'</b>\'+esc(w)+\'</div>\'}).join("")+\'</div>\'+\'<div class="about"><h2>Về \'+esc(D.co.short)+\'</h2><p style="margin:0">\'+esc(D.co.intro||(D.ab&&D.ab.story)||D.co.tag||"")+\'</p><button class="go" data-about>Tìm hiểu về chúng tôi →</button></div>\'+\'</div></main>\'+foot();' +
      'var qi=$("#q");qi.addEventListener("input",function(){q=qi.value;var p=qi.selectionStart;list();var n=$("#q");n.focus();try{n.setSelectionRange(p,p)}catch(e){}});$("#pb").addEventListener("change",function(){pb=this.value;list()});window.scrollTo(0,0)}' +
      'function blk(t,l){return l&&l.length?\'<div class="card blk"><h2>\'+t+\'</h2><ul>\'+l.map(function(x){return"<li>"+esc(x)+"</li>"}).join("")+\'</ul></div>\':""}' +
      'function nav(x){if(D.mode!=="live"||!history.pushState)return;var b=D.base.replace(/^https?:\\/\\/[^\\/]+/,""),pth=b+(x?"/"+x:"");try{if(location.pathname!==pth)history.pushState(null,"",pth)}catch(e){}}window.addEventListener("popstate",function(){route()});function route(){var seg=location.pathname.split("/").filter(Boolean),js=seg.length>3?seg[3]:"",j=D.jobs.filter(function(x){return x.slug===js})[0];if(js==="ve-chung-toi")about(1);else if(j)job(j,1);else list(1)}' + String(tdAboutPage).replace(/^function tdAboutPage/, 'function about') + ';' +
      'function job(j,nn){cur=j;if(!nn)nav(j.slug);app.innerHTML=head()+\'<main><div class="wrap"><div class="crumb"><button data-home>← Tất cả vị trí</button></div><div class="dt"><div><div class="card"><h1>\'+esc(j.pos)+\'</h1>\'+chips(j)+\'<div class="facts"><div><small>Số lượng</small><b>\'+j.sl+" người</b></div><div><small>Thu nhập</small><b>"+esc(j.sal)+\'</b></div><div><small>Địa điểm</small><b>\'+esc(j.place)+\'</b></div><div><small>Thời gian làm việc</small><b>\'+esc(j.time||"")+\'</b></div><div><small>Hạn nhận hồ sơ</small><b>\'+esc(j.deadline||"Đến khi đủ người")+\'</b></div><div><small>Thử việc</small><b>\'+(j.prob?"Tối đa "+j.prob+(j.prob===6?" ngày làm việc":" ngày"):"Không")+\'</b></div></div><div class="share"><button data-share="copy">Sao chép link</button><button data-share="fb">Chia sẻ Facebook</button><button data-share="zalo">Gửi qua Zalo</button></div></div>\'+' +
      'blk("Mô tả công việc",j.desc)+blk("Yêu cầu",j.reqs)+blk("Quyền lợi",j.bens)+(D.co.steps.length?\'<div class="card blk"><h2>Quy trình tuyển dụng</h2><div class="steps">\'+D.co.steps.map(function(s){return"<div>"+esc(s)+"</div>"}).join("")+\'</div></div>\':"")+\'</div><div class="card apply" id="ung-tuyen">\'+form(j)+\'</div></div></div></main><div class="mob-apply"><button class="sub" data-goapply>Ứng tuyển ngay</button></div>\'+foot();bindForm(j);window.scrollTo(0,0)}' +
      'function form(j){return\'<h2>Ứng tuyển vị trí này</h2><p class="s">Điền thông tin và đính kèm CV. Chúng tôi sẽ liên hệ trong vài ngày làm việc.</p><form id="fm" novalidate>\'+' +
      'fl("fn","Họ và tên *","text","Nguyễn Văn A","Vui lòng nhập họ và tên đầy đủ")+fl("fp","Số điện thoại *","tel","0912 345 678","Số điện thoại gồm 10 số, bắt đầu bằng 0")+fl("fe","Email *","email","ban@email.com","Email chưa đúng định dạng")+' +
      '\'<div class="f" id="f-cv"><label>CV / hồ sơ xin việc *</label><div class="drop" id="drop">Bấm để chọn file <b>PDF hoặc ảnh</b> (tối đa 5 MB)</div><input type="file" id="cv" accept=".pdf,image/*" hidden><div class="err" id="cvErr">Vui lòng đính kèm CV (PDF hoặc ảnh, tối đa 5 MB)</div></div>\'+' +
      '\'<div class="f"><label for="fx">Giới thiệu ngắn về kinh nghiệm</label><textarea id="fx" placeholder="Không bắt buộc"></textarea></div><div class="f"><label for="fs">Bạn biết tin tuyển dụng qua đâu?</label><select id="fs"><option>Cổng tuyển dụng</option><option>Fanpage công ty</option><option>Nhóm Facebook / Zalo</option><option>Trang việc làm</option><option>Người quen giới thiệu</option><option>Khác</option></select></div>\'+' +
      '\'<label class="cons" id="cons"><input type="checkbox" id="fc"><span>Tôi đồng ý để \'+esc(D.co.name)+\' xử lý dữ liệu cá nhân trong hồ sơ này (họ tên, số điện thoại, email, CV) cho mục đích tuyển dụng; hồ sơ được lưu tối đa \'+(D.co.keep||6)+\' tháng kể từ khi có kết quả, tôi có thể yêu cầu xóa bất cứ lúc nào\'+(D.co.email?" qua "+esc(D.co.email):"")+\'. \'+(D.co.policy?\'<a href="\'+esc(D.co.policy)+\'" target="_blank" rel="noopener">Xem chính sách xử lý dữ liệu cá nhân</a>\':\'<em>(Công ty chưa đăng chính sách xử lý dữ liệu cá nhân.)</em>\')+\'</span></label>\'+' +
      '\'<button class="sub" type="submit" id="sb">Gửi hồ sơ ứng tuyển</button><p class="fine">Công ty không thu bất kỳ khoản phí nào khi tuyển dụng.</p></form>\'}' +
      'function fl(id,l,t,ph,er){return\'<div class="f" id="f-\'+id+\'"><label for="\'+id+\'">\'+l+\'</label><input id="\'+id+\'" type="\'+t+\'" placeholder="\'+ph+\'"\'+(t==="tel"?\' inputmode="tel"\':"")+\'><div class="err">\'+er+\'</div></div>\'}' +
      'var FILE=null;function bindForm(j){FILE=null;var cv=$("#cv"),dr=$("#drop");dr.addEventListener("click",function(){cv.click()});cv.addEventListener("change",function(){var f=cv.files&&cv.files[0];if(!f)return;var okT=/^image\\/|application\\/pdf/.test(f.type)||/\\.(pdf|jpe?g|png|webp)$/i.test(f.name);if(!okT||f.size>' + TD_CV_MAX + '){FILE=null;dr.className="drop";dr.innerHTML=(okT?"File lớn hơn 5 MB":"Chỉ nhận file PDF hoặc ảnh")+" – bấm để chọn lại";$("#f-cv").classList.add("bad");return}FILE=f;dr.className="drop ok";dr.innerHTML="✓ "+esc(f.name)+" · "+Math.max(1,Math.round(f.size/1024))+" KB";$("#f-cv").classList.remove("bad")});' +
      '["fn","fp","fe"].forEach(function(k){$("#"+k).addEventListener("input",function(){$("#f-"+k).classList.remove("bad")})});$("#fc").addEventListener("change",function(){$("#cons").classList.remove("bad")});' +
      '$("#fm").addEventListener("submit",function(e){e.preventDefault();var n=$("#fn").value.trim().replace(/\\s+/g," ").split(" ").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(" "),p=$("#fp").value.replace(/[\\s.\\-()]/g,"").replace(/^\\+84/,"0"),m=$("#fe").value.trim(),bad=0;' +
      'function B(k,c){if(c){$("#f-"+k).classList.add("bad");if(!bad)$("#"+(k==="cv"?"drop":k)).scrollIntoView({block:"center"});bad++}}B("fn",n.split(" ").length<2);B("fp",!/^0\\d{9}$/.test(p));B("fe",!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(m));B("cv",!FILE);if(!$("#fc").checked){$("#cons").classList.add("bad");bad++}if(bad)return;' +
      'var sb=$("#sb");sb.disabled=true;sb.textContent="Đang gửi…";var data={job:j.id,name:n,phone:p,email:m,exp:$("#fx").value.trim(),src:$("#fs").value,consent:true,consentText:$("#cons span").textContent};' +
      'function done(code){$("#ung-tuyen").innerHTML=\'<div class="ok"><i>\'+I.chk+\'</i><h2>Đã nhận hồ sơ!</h2><p>Cảm ơn \'+esc(n)+\' đã ứng tuyển vị trí <b>\'+esc(j.pos)+\'</b>.<br>Mã hồ sơ: <code>\'+esc(code)+\'</code></p><p class="s" style="color:var(--mut);font-size:13.5px">\'+esc(D.co.contact)+\' sẽ liên hệ qua số điện thoại hoặc email bạn đã để lại.</p><button class="share" style="border:none;background:none;color:var(--c);font-weight:700;cursor:pointer" data-home>← Xem các vị trí khác</button></div>\';window.scrollTo(0,0)}' +
      'function fail(t){sb.disabled=false;sb.textContent="Gửi hồ sơ ứng tuyển";alertBox(t)}' +
      'FILE.arrayBuffer().then(function(buf){var TG=window.parent&&window.parent!==window?window.parent:(window.opener&&!window.opener.closed?window.opener:null);if(D.mode==="preview"&&!TG){fail("Tab phần mềm đã đóng nên chưa nhận được hồ sơ. Mở lại link từ phần mềm (Cổng tuyển dụng → Mở link).");return}if(TG&&D.mode==="preview"){var tm=setTimeout(function(){fail("Phần mềm chưa nhận được hồ sơ – giữ tab phần mềm đang mở rồi thử lại.")},6000);window.__tdok=function(c){clearTimeout(tm);done(c)};TG.postMessage({type:"qtt-td-apply",u:D.u,d:data,file:{name:FILE.name,type:FILE.type,size:FILE.size,buf:buf}},"*",[buf])}' +
      'else if(D.api){var fd=new FormData();Object.keys(data).forEach(function(k){fd.append(k,data[k])});if(D.tok)fd.append("tok",D.tok);fd.append("cv",FILE);fetch(D.api.replace(/\\/$/,"")+"/api/ung-tuyen",{method:"POST",body:fd}).then(function(r){return r.json()}).then(function(r){if(r&&r.ok)done(r.code);else fail((r&&r.msg)||"Chưa gửi được hồ sơ, vui lòng thử lại.")}).catch(function(){fail("Mất kết nối, vui lòng thử lại.")})}' +
      'else fail("Đây là trang mẫu, chưa kết nối máy chủ nên hồ sơ chưa được gửi đi.")})})}' +
      'function alertBox(t){var d=document.createElement("div");d.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d2329;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;z-index:50;max-width:90%";d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},4200)}' +
      'window.addEventListener("message",function(e){if(e.data&&e.data.type==="qtt-td-ok"&&window.__tdok)window.__tdok(e.data.code)});' +
      'document.addEventListener("click",function(e){var t=e.target.closest("[data-job],[data-home],[data-share],[data-goapply],[data-about]");if(!t)return;if(t.hasAttribute("data-about")){e.preventDefault();about();return}e.preventDefault();' +
      'if(t.hasAttribute("data-job")){var j=D.jobs.filter(function(x){return x.id===t.getAttribute("data-job")})[0];if(j)job(j)}else if(t.hasAttribute("data-home"))list();else if(t.hasAttribute("data-goapply"))$("#ung-tuyen").scrollIntoView({behavior:"smooth"});' +
      'else{var link=D.base+"/"+cur.slug;if(D.mode==="preview")alertBox(t.getAttribute("data-share")==="copy"?"Link dự kiến: "+link+" (mở được khi cổng kết nối máy chủ)":"Chia sẻ hoạt động khi cổng đã có link thật trên máy chủ");else if(t.getAttribute("data-share")==="copy"){try{navigator.clipboard.writeText(location.href);alertBox("Đã sao chép link")}catch(x){}}else if(t.getAttribute("data-share")==="fb")window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(location.href));else window.open("https://zalo.me/share?u="+encodeURIComponent(location.href))}});' +
      'if(D.mode==="live"){route()}else{var sj=START.job&&D.jobs.filter(function(x){return x.id===START.job})[0];if(START.about)about(1);else if(sj)job(sj);else list()}})();';
    return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tuyển dụng – ' + esc(D.co.short) + '</title><link rel="icon" href="' + esc(tdFav()) + '"><meta name="description" content="' + esc('Các vị trí đang tuyển tại ' + D.co.name) + '"><link rel="stylesheet" href="https://quantritute.com/assets/fonts/fonts.css?v=20261103"><style>' + css + '</style></head><body><div id="app"></div><script>' + js + SC + '</body></html>';
  }
  // Nhận hồ sơ gửi từ bản xem trước (iframe) → thêm vào Ứng viên, lưu CV vào kho file
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'qtt-td-apply') return;
    var fr = $$('iframe.td-frame').filter(function (f) { return f.contentWindow === e.source; })[0]; if (!fr && TD_TABS.indexOf(e.source) < 0) return;
    var u = unitById(d.u); if (!u) return;
    tdImportApp(u, d.d, d.file, 'xem-thu').then(function (c) { if (!c) return; try { e.source.postMessage({ type: 'qtt-td-ok', code: c.id }, '*'); } catch (x) { } toast('Có hồ sơ mới: ' + c.name, 'ok', (tdReq(u, c.rq) || {}).pos + ' · đã vào Ngân hàng ứng viên (bước Mới nhận)' + (c.cv ? ', kèm CV' : '')); renderNav(); });
  });
  function tdImportApp(u, dd, file, via, ma) {
    var t = tdOf(u), r = tdReq(u, dd.job) || t.rq.filter(function (x) { return x.slug === dd.job; })[0]; if (!r) return Promise.resolve(null);
    var thu = via === 'cong-thu';
    var c = { id: tdNext(t.cd, 'UV', 4), rq: r.id, name: String(dd.name || '').replace(/(^|\s)(\S)/g, function (x, a, b) { return a + b.toUpperCase(); }), phone: dd.phone, email: dd.email, exp: dd.exp, src: dd.src || 'Cổng tuyển dụng', at: HR.isoToday(), stage: 'new', ivs: [], letters: [], hist: [], note: '',
      consent: { at: thu && dd.consentAt ? dd.consentAt.replace('T', ' ').slice(0, 19) : tdNow(), ver: via, how: thu ? 'Tích ô đồng ý trên cổng tuyển dụng thử nghiệm recruit.quantritute.com (mã nộp ' + ma + ')' : 'Tích ô đồng ý trên cổng tuyển dụng (bản xem trước trên máy này)', text: dd.consentText || '' } };
    tdHist(c, 'Nộp hồ sơ qua cổng tuyển dụng ' + (thu ? 'thử nghiệm (máy chủ)' : '(bản xem trước)') + ' – biết tin qua: ' + c.src);
    t.cd.push(c);
    var p = Promise.resolve();
    if (file && file.buf) { var id = khoId(); c.cv = id; c.cvName = file.name; p = khoPut({ id: id, u: u.id, nv: c.id, kho: 'cv', ref: 'CV', name: file.name, type: file.type || 'application/pdf', size: file.size, at: tdNow().replace(' ', 'T'), blob: new Blob([file.buf], { type: file.type || 'application/pdf' }) }).catch(function (er) { logErr('Lưu CV ứng viên', er); c.cv = null; }); }
    return p.then(function () { tdSave(u, 'Nhận hồ sơ ' + c.id + ' ' + c.name + ' – ' + r.pos + (thu ? ' (cổng thử)' : ' (cổng xem trước)')); if (PS.tdu) PS.tdu.pulse = u.id + '|' + c.id; return c; });
  }

  PAGES.tdtin = function () {
    var us = tdUnitsAll(), f = ps('tdc', { page: 'list', job: '', dev: window.innerWidth < 720 ? 'mob' : 'pc', u: '' }); if (!us.some(function (x) { return x.id === f.u; })) f.u = us[0] ? us[0].id : '';
    var u = unitById(f.u); if (!u) return '';
    var t = tdOf(u), cf = t.cfg, R = refDate(), live = t.rq.filter(function (r) { return tdLive(r, R); });
    if (f.page === 'job' && !live.some(function (r) { return r.id === f.job; })) { var rj = tdReq(u, f.job); if (!rj || !tdLive(rj, R)) { f.page = live.length ? 'job' : 'list'; f.job = live[0] ? live[0].id : ''; } }
    var url = tdPortalLink(u, f.page === 'job' ? tdReq(u, f.job) : null);
    var bar = '<div class="td-bar">' + (us.length > 1 ? '<div class="field"><label for="tdCU">Công ty</label><select class="input" id="tdCU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), u.id); }).join('') + '</select></div>' : '') +
      '<div class="field"><label>Trang</label><div class="seg"><button class="' + (f.page === 'list' ? 'on' : '') + '" data-act="td-cp" data-id="list">Danh sách vị trí</button><button class="' + (f.page === 'job' ? 'on' : '') + '" data-act="td-cp" data-id="job"' + (live.length ? '' : ' disabled') + '>Trang vị trí</button><button class="' + (f.page === 'about' ? 'on' : '') + '" data-act="td-cp" data-id="about">Về chúng tôi</button></div></div>' +
      (f.page === 'job' && live.length ? '<div class="field"><label for="tdCJ">Vị trí</label><select class="input" id="tdCJ">' + live.map(function (r) { return opt(r.id, r.pos, f.job); }).join('') + '</select></div>' : '') +
      '<div class="field"><label>Thiết bị</label><div class="seg"><button class="' + (f.dev === 'pc' ? 'on' : '') + '" data-act="td-cd" data-id="pc">' + ic('td_pc', 15) + ' Máy tính</button><button class="' + (f.dev === 'mob' ? 'on' : '') + '" data-act="td-cd" data-id="mob">' + ic('td_phone', 15) + ' Điện thoại</button></div></div><span class="sp"></span>' +
      '<button class="btn" data-act="td-cfull">' + ic('td_full', 15) + 'Xem toàn màn hình</button></div>';
    var prev = '<div class="td-browser"><div class="td-bbar"><i></i><i></i><i></i><span class="td-url" title="Link chính thức khi cổng kết nối máy chủ – bấm Mở link để mở trang này ở tab mới">🔒 ' + esc(url.replace(/^https:\/\//, '')) + '</span><span class="tag tag-warn">Xem trước</span><button class="btn btn-sm" data-act="td-olink" data-u="' + u.id + '" data-id="' + (f.page === 'job' ? esc(f.job || '') : f.page === 'about' ? '@about' : '') + '">' + ic('td_link', 14) + 'Mở link</button></div><div class="td-stage' + (f.dev === 'mob' ? ' mob' : ' pc') + '" id="tdStage"><iframe class="td-frame" id="tdFrame" title="Bản xem trước cổng tuyển dụng" sandbox="allow-scripts allow-forms allow-popups"></iframe></div></div>';
    var links = '<div class="card card-pad"><div class="card-head"><div><h3>Link chia sẻ</h3><p>' + live.length + ' vị trí đang hiện trên cổng. Bấm Mở link để mở trang ở tab mới – nộp thử hồ sơ ở đó, hồ sơ vào thẳng Ngân hàng ứng viên. Địa chỉ bên dưới là link chính thức khi cổng kết nối máy chủ.</p></div></div><div class="td-links"><div class="td-link"><b>Trang danh sách vị trí</b><code>' + esc(tdPortalLink(u)) + '</code><div class="link-row"><button class="btn btn-sm btn-primary" data-act="td-olink" data-u="' + u.id + '">' + ic('td_link', 14) + 'Mở link</button></div></div>' +
      '<div class="td-link"><b>Trang Về chúng tôi</b><code>' + esc(tdPortalLink(u) + '/ve-chung-toi') + '</code><div class="link-row"><button class="btn btn-sm btn-primary" data-act="td-olink" data-u="' + u.id + '" data-id="@about">' + ic('td_link', 14) + 'Mở link</button><button class="btn btn-sm" data-act="td-cfg" data-u="' + u.id + '">' + ic('td_edit', 14) + 'Sửa nội dung</button></div></div>' +
      live.map(function (r) { return '<div class="td-link"><b>' + esc(r.pos) + '</b><code>' + esc(tdPortalLink(u, r)) + '</code><div class="link-row"><button class="btn btn-sm btn-primary" data-act="td-olink" data-u="' + u.id + '" data-id="' + r.id + '">' + ic('td_link', 14) + 'Mở link</button><button class="btn btn-sm" data-act="td-req-post" data-u="' + u.id + '" data-id="' + r.id + '">' + ic('td_copy', 14) + 'Tin đăng</button></div></div>'; }).join('') +
      (live.length ? '' : '<p class="muted" style="margin:0">Chưa có vị trí nào hiện trên cổng. Vào <a href="#tdnhucau" data-go="tdnhucau">Nhu cầu tuyển dụng</a> → bật “Hiện trên cổng”.</p>') + '</div></div>';
    var info = '<div class="card card-pad"><div class="card-head"><div><h3>Thông tin công ty trên cổng</h3><p>Tên, giới thiệu, màu, liên hệ, chính sách dữ liệu, thời hạn lưu hồ sơ</p></div></div>' +
      '<dl class="td-kv"><dt>Tên hiển thị</dt><dd>' + esc(cf.short) + '</dd><dt>Liên hệ</dt><dd>' + esc(cf.contact) + (cf.phone ? '<br>' + esc(tdPhoneFmt(cf.phone)) : '') + (cf.email ? '<br>' + esc(cf.email) : '') + '</dd><dt>Chính sách dữ liệu</dt><dd>' + (cf.policy ? '<a href="' + esc(cf.policy) + '" target="_blank" rel="noopener">' + esc(cf.policy) + '</a>' : '<span class="miss">Chưa có – cần thêm trước khi nhận hồ sơ</span>') + '</dd><dt>Lưu hồ sơ</dt><dd>' + (cf.keep || 6) + ' tháng sau khi có kết quả</dd></dl>' +
      '<div class="link-row" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="td-cfg" data-u="' + u.id + '">' + ic('td_edit', 14) + 'Sửa thông tin</button></div></div>';
    var th = tdThu(u), hh = th ? new Date(th.at + TD_THU_TTL) : null;
    var server = '<div class="card card-pad td-srv"><div class="card-head"><div><h3>Cổng thử trên máy chủ</h3><p>recruit.quantritute.com – mở link trên điện thoại, máy khác; ứng viên nộp CV, hồ sơ tự về phần mềm</p></div></div>' +
      '<div class="td-srv-st' + (th ? ' on' : '') + '"><i></i>' + (th ? 'Đang bật – link dùng được đến ' + p2(hh.getHours()) + ':' + p2(hh.getMinutes()) + ' ngày ' + p2(hh.getDate()) + '/' + p2(hh.getMonth() + 1) : 'Chưa bật – bấm Mở link hoặc Đưa vị trí lên cổng') + '</div>' +
      '<div class="link-row"><button class="btn btn-sm btn-primary" data-act="td-thu-push" data-u="' + u.id + '">' + ic('td_srv', 14) + (th ? 'Cập nhật vị trí lên cổng' : 'Đưa vị trí lên cổng') + '</button><button class="btn btn-sm" data-act="td-thu-pull" data-u="' + u.id + '"' + (th ? '' : ' disabled') + '>Lấy hồ sơ mới</button>' + (th ? '<button class="btn btn-sm" data-act="td-thu-off" data-u="' + u.id + '">Tắt cổng thử</button>' : '') + '</div>' +
      '<p class="muted" style="font-size:12px;margin:10px 0 0">Bản thử dùng dữ liệu mẫu: link sống 24 giờ kể từ lần đưa lên gần nhất. Phần mềm tự lấy hồ sơ mới mỗi 45 giây khi đang mở; hồ sơ lấy về xong máy chủ xóa ngay, chưa lấy thì tự xóa sau 24 giờ. Bản chính thức: mỗi công ty có mã kết nối riêng.</p></div>';
    return '<div class="page-head"><div><h1>Cổng tuyển dụng</h1><p class="muted">Trang tuyển dụng riêng của công ty: danh sách vị trí đang bật ở Nhu cầu tuyển dụng, trang chi tiết từng vị trí để chia sẻ, ứng viên đọc và nộp CV ngay trên trang.</p></div></div>' + bar +
      '<div class="td-portal"><div>' + prev + '<p class="muted" style="font-size:12.5px;margin:8px 2px 0">Thử nộp hồ sơ ngay trong khung xem trước: hồ sơ vào thẳng <a href="#tdungvien" data-go="tdungvien">Ngân hàng ứng viên</a> trên máy này. Mọi chữ, màu, vị trí trên trang lấy từ phiếu nhu cầu và thông tin công ty.</p></div><div class="td-side">' + links + info + server + '</div></div>';
  };
  BINDS.tdtin = function () {
    selUnits().forEach(function (x) { if (x.td && tdThu(x)) { tdThuPull(x, true); tdThuTimer(); } });
    var f = PS.tdc, u = unitById(f.u); if (!u) return;
    var fr = $('#tdFrame'); if (fr) fr.srcdoc = tdPortalHtml(tdPortalData(u, 'preview'), f.page === 'job' ? { job: f.job } : f.page === 'about' ? { about: 1 } : {});
    var stg = $('#tdStage'); if (stg && f.dev !== 'mob') { var fit = function () { if (!document.body.contains(stg)) { window.removeEventListener('resize', fit); return; } var w = stg.clientWidth, k = Math.min(1, w / 1280); fr.style.transform = 'scale(' + k + ')'; stg.style.height = Math.round(880 * k) + 'px'; }; fit(); window.addEventListener('resize', fit); }
    var cu = $('#tdCU'); if (cu) cu.addEventListener('change', function () { f.u = cu.value; f.page = 'list'; render(); });
    var cj = $('#tdCJ'); if (cj) cj.addEventListener('change', function () { f.job = cj.value; render(); });
  };
  ACTS['td-cp'] = function (a, id) { var f = PS.tdc; f.page = id; if (id === 'job' && !f.job) { var u = unitById(f.u), l = tdOf(u).rq.filter(function (r) { return tdLive(r, refDate()); }); f.job = l[0] ? l[0].id : ''; } render(); };
  ACTS['td-cd'] = function (a, id) { PS.tdc.dev = id; render(); };
  ACTS['td-clink'] = function (a, id) { var u = unitById(a.getAttribute('data-u')); tdCopy(tdPortalLink(u, id ? tdReq(u, id) : null), 'link (dự kiến)'); };
  ACTS['td-cfull'] = function () {
    var f = PS.tdc, u = unitById(f.u); if (!u) return;
    var bg = document.createElement('div'); bg.className = 'td-full';
    bg.innerHTML = '<div class="td-bbar"><span class="td-url">🔒 ' + esc(tdPortalLink(u).replace(/^https:\/\//, '')) + '</span><button class="btn btn-sm" id="tdFX">Đóng (Esc)</button></div><iframe class="td-frame" sandbox="allow-scripts allow-forms allow-popups" title="Cổng tuyển dụng"></iframe>';
    document.body.appendChild(bg);
    bg.querySelector('iframe').srcdoc = tdPortalHtml(tdPortalData(u, 'preview'), f.page === 'job' ? { job: f.job } : f.page === 'about' ? { about: 1 } : {});
    function close() { bg.remove(); document.removeEventListener('keydown', k); if (curPage === 'tdtin') render(); }
    function k(e) { if (e.key === 'Escape') close(); }
    $('#tdFX', bg).addEventListener('click', close); document.addEventListener('keydown', k);
  };
  ACTS['td-thu-push'] = function (a) { var u = unitById(a.getAttribute('data-u')); if (!u) return; a.disabled = true; tdThuPush(u).then(function (j) { toast('Đã đưa ' + tdPortalData(u, 'live').jobs.length + ' vị trí lên cổng thử', 'ok', 'Link dùng được 24 giờ: ' + j.base); render(); }).catch(function (e) { a.disabled = false; toast('Chưa kết nối được cổng thử', 'warn', String(e && e.message || e) + ' – kiểm tra mạng rồi thử lại.'); }); };
  ACTS['td-thu-pull'] = function (a) { var u = unitById(a.getAttribute('data-u')); if (u) tdThuPull(u, false); };
  ACTS['td-thu-off'] = function (a) { var u = unitById(a.getAttribute('data-u')), cf = u && tdOf(u).cfg; if (!cf || !cf.thu) return; var th = cf.thu; tdThuPull(u, true).then(function () { return fetch(TD_THU + '/api/cong/tat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tok: th.tok, key: th.key }) }); }).catch(function () { }).then(function () { cf.thu = null; tdSave(u, 'Tắt cổng tuyển dụng thử'); toast('Đã tắt cổng thử', 'ok', 'Trang cổng và hồ sơ chưa lấy đã xóa trên máy chủ.'); render(); }); };
  ACTS['td-srv'] = function (a) {
    var u = unitById(a.getAttribute('data-u')), cf = tdOf(u).cfg; cf.srv = cf.srv || {};
    cf.srv.url = ($('#tdSU').value || '').trim(); cf.srv.key = ($('#tdSK').value || '').trim(); tdSave(u, 'Lưu cấu hình máy chủ cổng tuyển dụng');
    toast('Đã lưu thông tin kết nối', 'info', 'Máy chủ cổng tuyển dụng chưa dựng xong – phần kết nối sẽ làm ở bước sau. Hiện vẫn dùng bản xem trước trên máy này.');
  };
  ACTS['td-cfg'] = function (a) { var u = unitById(a.getAttribute('data-u')); if (u) tdCfgForm(u); };
  function tdCfgForm(u) {
    var cf = tdOf(u).cfg;
    var m = modal('Thông tin công ty trên cổng tuyển dụng', shortUnit(u.name), '<div class="td-form"><div class="td-g2">' + field('cName', 'Tên đầy đủ', cf.name) + field('cShort', 'Tên ngắn hiển thị', cf.short) +
      '<div class="field" style="grid-column:1/-1"><label for="cTag">Câu giới thiệu ngắn (dưới tiêu đề trang)</label><input class="input" id="cTag" value="' + esc(cf.tag) + '"></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="cIntro">Giới thiệu công ty</label><textarea class="input" id="cIntro">' + esc(cf.intro) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="cWhy">3 lý do nên làm việc ở đây (mỗi dòng 1 ý)</label><textarea class="input" id="cWhy" style="min-height:76px">' + esc((cf.why || []).join('\n')) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="cSteps">Quy trình tuyển dụng (mỗi dòng 1 bước)</label><textarea class="input" id="cSteps" style="min-height:76px">' + esc(cf.steps || '') + '</textarea></div>' +
      field('cAddr', 'Địa chỉ', cf.addr) + field('cContact', 'Người / bộ phận liên hệ', cf.contact) + field('cPhone', 'Số điện thoại', cf.phone) + field('cEmail', 'Email nhận yêu cầu', cf.email) +
      '<div class="field"><label for="cColor">Màu chủ đạo</label><input class="input" id="cColor" type="color" value="' + esc(cf.color) + '" style="height:40px;padding:4px"></div>' + field('cSlug', 'Đường dẫn cổng', cf.slug, ' placeholder="dom-sang-edu"') + '</div>' +
      '<h4>Trang Về chúng tôi <button type="button" class="btn btn-sm" id="cAb0" style="margin-left:8px">Điền lại văn bản mẫu</button></h4><p class="muted" style="margin:-4px 0 8px;font-size:12.5px">Trang con riêng trên cổng tuyển dụng. Văn bản mẫu viết chung – sửa cho đúng thực tế công ty, không ghi số liệu, thành tích chưa có căn cứ.</p><div class="td-g2">' +
      '<div class="field" style="grid-column:1/-1"><label for="abStory">Câu chuyện của chúng tôi</label><textarea class="input" id="abStory" style="min-height:76px">' + esc(cf.ab.story) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="abMission">Sứ mệnh</label><textarea class="input" id="abMission" style="min-height:60px">' + esc(cf.ab.mission) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="abValues">Giá trị cốt lõi (mỗi dòng: Tên: mô tả)</label><textarea class="input" id="abValues" style="min-height:96px">' + esc(cf.ab.values) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="abEnv">Môi trường làm việc</label><textarea class="input" id="abEnv" style="min-height:60px">' + esc(cf.ab.env) + '</textarea></div>' +
      '<div class="field" style="grid-column:1/-1"><label for="abPerks">Chế độ chung cho người lao động (mỗi dòng 1 ý)</label><textarea class="input" id="abPerks" style="min-height:96px">' + esc(cf.ab.perks) + '</textarea></div>' +
      '<label class="td-chk" style="grid-column:1/-1"><input type="checkbox" id="abStats"' + (cf.ab.stats === false ? '' : ' checked') + '> Hiện con số lấy từ phần mềm: số nhân sự đang làm, số phòng ban, số vị trí đang tuyển</label></div>' +
      '<h4>Dữ liệu cá nhân ứng viên</h4><div class="td-g2">' + field('cPolicy', 'Link chính sách xử lý dữ liệu cá nhân *', cf.policy, ' placeholder="https://…/chinh-sach-du-lieu"') + field('cKeep', 'Thời hạn lưu hồ sơ không trúng tuyển (tháng)', cf.keep, ' inputmode="numeric"') + '</div>' +
      '<div class="notice" style="margin-top:10px">' + ic('info') + '<div>Form ứng tuyển thu họ tên, số điện thoại, email, CV. Ứng viên phải đọc được chính sách và tích đồng ý trước khi gửi (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 – em chưa trích được điều cụ thể, cần đối chiếu văn bản gốc). Thời hạn lưu do công ty quyết định, ghi rõ trong ô đồng ý và thư cảm ơn.</div></div></div>' +
      '<div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="cSave">Lưu</button></div>');
    m.querySelector('.modal').classList.add('lg');
    $('#cAb0', m).addEventListener('click', function () { var d = tdAbout0(u); $('#abStory', m).value = d.story; $('#abMission', m).value = d.mission; $('#abValues', m).value = d.values; $('#abEnv', m).value = d.env; $('#abPerks', m).value = d.perks; toast('Đã điền lại văn bản mẫu', 'info', 'Bấm Lưu để dùng.'); });
    $('#cSave', m).addEventListener('click', function () {
      var v = function (k) { return ($('#' + k, m).value || '').trim(); };
      var pol = v('cPolicy'); if (pol && !/^https?:\/\//i.test(pol)) { toast('Link chính sách cần bắt đầu bằng https://', 'err'); return; }
      var kp = +v('cKeep'); if (!(kp >= 1 && kp <= 60)) { toast('Thời hạn lưu là số tháng từ 1 đến 60', 'err'); return; }
      var em = v('cEmail'); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('Email chưa đúng', 'err'); return; }
      Object.assign(cf, { name: v('cName') || cf.name, short: v('cShort') || cf.short, tag: v('cTag'), intro: v('cIntro'), why: tdLines(v('cWhy')).slice(0, 6), steps: v('cSteps'), addr: v('cAddr'), contact: v('cContact'), phone: tdPhone(v('cPhone')), email: em, color: v('cColor') || cf.color, slug: tdSlug(v('cSlug') || cf.short), policy: pol, keep: kp, ab: { story: v('abStory'), mission: v('abMission'), values: v('abValues'), env: v('abEnv'), perks: v('abPerks'), stats: $('#abStats', m).checked } });
      tdSave(u, 'Sửa thông tin công ty trên cổng tuyển dụng'); m.close(); render(); toast('Đã lưu thông tin cổng tuyển dụng', 'ok');
    });
  }

  /* =====================================================================
     3) ỨNG VIÊN & PHỎNG VẤN
     ===================================================================== */
  function tdDup(u, c) { var p = tdPhone(c.phone), e = String(c.email || '').toLowerCase(); return tdOf(u).cd.filter(function (x) { return x !== c && ((p && tdPhone(x.phone) === p) || (e && String(x.email || '').toLowerCase() === e)); }); }
  function tdExNv(u, c) { var p = tdPhone(c.phone); if (!p) return null; return u.data.NV.filter(function (e) { return tdPhone(e['Số điện thoại']) === p; })[0] || null; }
  function tdScore(v) { if (!TD_SCORE) return null; var k = Object.keys(v.score || {}); if (!k.length) return null; var s = 0; k.forEach(function (i) { s += +v.score[i] || 0; }); return Math.round(s / k.length * 10) / 10; }
  function tdLastScore(c) { var l = (c.ivs || []).filter(function (v) { return v.st === 'done' && tdScore(v) !== null; }); return l.length ? tdScore(l[l.length - 1]) : null; }
  /* ---------- Ghi chú kết quả phỏng vấn + chuyển trạng thái (11/11 18:04 anh) – dùng ở popup lịch phỏng vấn và Kết quả phỏng vấn ---------- */
  var TD_NEXT = [['ivcancel', 'Hủy phỏng vấn'], ['offer', 'Mời nhận việc'], ['hold', 'Cân nhắc'], ['fail', 'Chưa phù hợp']];
  function tdTargetIv(c) { var p = tdPlanIv(c); if (p) return p; var L = (c.ivs || []).map(function (v, i) { return { v: v, i: i }; }).filter(function (x) { return x.v.st !== 'cancel'; }); return L[L.length - 1] || ((c.ivs || []).length ? { v: c.ivs[c.ivs.length - 1], i: c.ivs.length - 1 } : null); }
  function tdResultBox(u, c, p, iv) {
    var t = iv || tdTargetIv(c), note = t ? (t.v.note || '') : (c.resNote || '');
    return '<div class="td-resbox" id="' + p + 'Box"><div class="td-resbox-h"><h3>Ghi chú kết quả phỏng vấn</h3><span class="muted">' + (t ? 'Vòng ' + (t.i + 1) + ' · ' + vn(t.v.date) + ' ' + esc(t.v.time || '') : 'Chưa có lịch phỏng vấn') + ' · đang: <b>' + TD_STN[c.stage] + '</b></span></div>' +
      '<textarea class="input" id="' + p + 'N" placeholder="Nhận xét sau phỏng vấn: điểm mạnh, điểm cần lưu ý, mức lương mong muốn, thời gian có thể đi làm…">' + esc(note) + '</textarea>' +
      '<div class="td-resbox-s"><span class="td-flab">Chuyển trạng thái</span><div class="td-pills">' + TD_NEXT.map(function (s) { return '<button type="button" class="td-pill st' + (c.stage === s[0] ? ' cur' : '') + '" data-ns="' + s[0] + '">' + s[1] + (c.stage === s[0] ? ' ✓' : '') + '</button>'; }).join('') + '</div></div>' +
      '<div class="td-resbox-f"><span class="muted" id="' + p + 'H">Chọn trạng thái tiếp theo (không bắt buộc) rồi bấm Lưu.</span><button type="button" class="btn btn-primary" id="' + p + 'S">Lưu</button></div></div>';
  }
  var TD_NS_HINT = { ivcancel: 'Lịch đang hẹn sẽ đánh dấu Đã hủy. Nhớ báo lại cho ứng viên.', offer: 'Ghi kết quả Đạt → lập điều kiện mời (lương, thử việc, ngày đi làm) rồi gửi thư mời nhận việc.', hold: 'Ghi kết quả Cân nhắc – ứng viên chuyển sang “Công ty cân nhắc”.', fail: 'Ghi kết quả Chưa đạt → nên gửi thư cảm ơn & thông báo kết quả.' };
  function tdResultBind(root, u, c, p, iv, cb) {
    var box = $('#' + p + 'Box', root); if (!box) return; var pick = '';
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-ns]'); if (!b) return; pick = pick === b.getAttribute('data-ns') ? '' : b.getAttribute('data-ns'); $$('[data-ns]', box).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-ns') === pick); }); $('#' + p + 'H', box).textContent = pick ? TD_NS_HINT[pick] : 'Chọn trạng thái tiếp theo (không bắt buộc) rồi bấm Lưu.'; });
    $('#' + p + 'S', box).addEventListener('click', function () { tdApplyResult(u, c, pick, $('#' + p + 'N', box).value.trim(), iv || tdTargetIv(c), cb); });
  }
  function tdApplyResult(u, c, s, note, t, cb) {
    var v = t ? t.v : null, R = refDate();
    if (v) v.note = note; else c.resNote = note;
    if (!s) { tdHist(c, 'Ghi chú kết quả phỏng vấn'); tdSave(u, 'Ghi chú kết quả PV ' + c.id); toast('Đã lưu ghi chú', 'ok', c.name); cb && cb(); return; }
    var lab = TD_NEXT.filter(function (x) { return x[0] === s; })[0][1];
    if (s === 'ivcancel') { (c.ivs || []).forEach(function (x) { if (x.st === 'plan') x.st = 'cancel'; }); }
    else if (v) { v.st = 'done'; v.res = s === 'offer' ? 'pass' : s === 'hold' ? 'hold' : 'fail'; }
    tdHist(c, 'Kết quả phỏng vấn: ' + lab + (note ? ' – ' + note.slice(0, 120) : ''));
    if (s === 'offer') { tdSave(u, 'Kết quả PV ' + c.id + ': ' + lab); if (!c.offer) { tdOfferForm(u, c, function () { cb && cb(); }, { noLetter: true }); cb && cb(); return; } }
    if (c.stage === s) { tdSave(u, 'Kết quả PV ' + c.id); cb && cb(); } else tdSetStage(u, c, s, cb);
  }
  // Popup chi tiết lịch phỏng vấn (bấm thẻ trên Lịch phỏng vấn)
  function tdIvPopup(u, c, i) {
    var v = c.ivs[i]; if (!v) { tdCandOpen(u, c.id); return; }
    var r = tdReq(u, c.rq) || { pos: '' }, R = refDate(), stx = v.st === 'cancel' ? 'Đã hủy' : v.st === 'done' ? 'Đã phỏng vấn' + (v.res ? ' – ' + (v.res === 'pass' ? 'Đạt' : v.res === 'fail' ? 'Chưa đạt' : 'Cân nhắc') : '') : v.date < R ? 'Đã qua giờ – chưa ghi kết quả' : v.date === R ? 'Hôm nay' : 'Đã hẹn';
    var m = modal('Lịch phỏng vấn – ' + c.name, r.pos + (isMulti() ? ' · ' + shortUnit(u.name) : '') + ' · vòng ' + (i + 1), '<div id="tdIvP"></div>');
    m.querySelector('.modal').classList.add('lg');
    function draw() {
      var hasPv = (c.letters || []).some(function (l) { return l.t === 'pv'; });
      $('#tdIvP', m).innerHTML = '<div class="td-ivp"><dl class="td-kv"><dt>Thời gian</dt><dd><b>' + esc(v.time || '') + ' · ' + ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][new Date(v.date + 'T00:00:00').getDay()] + ', ' + vn(v.date) + '</b>' + (v.old ? ' <span class="muted">(dời từ ' + esc(v.old) + ')</span>' : '') + '</dd><dt>Hình thức</dt><dd><i class="md md-' + (tdModeShort(v.mode) === 'Online' ? 'on' : tdModeShort(v.mode) === 'Điện thoại' ? 'ph' : 'off') + '">' + tdModeShort(v.mode) + '</i> ' + esc(v.mode || '') + '</dd><dt>Địa điểm / link</dt><dd>' + esc(v.place || '—') + '</dd><dt>Người phỏng vấn</dt><dd>' + esc(v.who || '—') + '</dd><dt>Ứng viên</dt><dd>' + esc(tdPhoneFmt(c.phone)) + (c.email ? ' · ' + esc(c.email) : '') + ' · đang: <b>' + TD_STN[c.stage] + '</b></dd><dt>Trạng thái lịch</dt><dd>' + esc(stx) + '</dd></dl>' +
        '<div class="link-row" style="margin:12px 0 0;flex-wrap:wrap"><button class="btn btn-sm" data-y="open">' + ic('eye', 14) + 'Mở hồ sơ ứng viên</button>' + (v.st === 'plan' ? '<button class="btn btn-sm" data-y="move">' + ic('td_cal', 14) + 'Đổi lịch</button><button class="btn btn-sm" data-y="mail">' + ic('td_mail', 14) + (v.old && hasPv ? 'Gửi thông báo dời lịch' : 'Gửi thư mời phỏng vấn') + '</button>' : '') + '</div></div>' + tdResultBox(u, c, 'ivp', { v: v, i: i });
      tdResultBind(m, u, c, 'ivp', { v: v, i: i }, function () { m.close(); render(); });
    }
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-y]'); if (!b) return; var y = b.getAttribute('data-y'); if (y === 'open') { m.close(); tdCandOpen(u, c.id); } else if (y === 'move') { m.close(); tdIvForm(u, c, i, function () { render(); }); } else if (y === 'mail') { m.close(); tdLetter(u, c, v.old && (c.letters || []).some(function (l) { return l.t === 'pv'; }) ? 'dl' : 'pv', function () { render(); }); } });
    draw();
  }
  ACTS['td-ivp'] = function (a, id, e) { if (e) e.preventDefault(); var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdIvPopup(u, c, +a.getAttribute('data-i')); };
  // Đề xuất gửi thông báo dời lịch sau khi kéo thả / đổi lịch
  function tdAskMoveMail(u, c, v, old) {
    var m = modal('Đã dời lịch phỏng vấn', c.name + ' · ' + old + ' → ' + vn(v.date) + ' ' + v.time, '<p>Gửi email thông báo dời lịch phỏng vấn cho ứng viên? Thư soạn sẵn có lịch cũ, lịch mới, hình thức, địa điểm, người phỏng vấn – sửa được trước khi gửi.</p><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Để sau</button><button class="btn btn-primary" id="tdMvM">' + ic('td_mail', 15) + 'Soạn thư thông báo dời lịch</button></div>', true);
    $('#tdMvM', m).addEventListener('click', function () { m.close(); tdLetter(u, c, 'dl', function () { render(); }); });
  }
  // Dạng "Theo trạng thái": cột như Trello, kéo thả thẻ giữa các cột để chuyển trạng thái (11/11 18:04 anh)
  function tdBoard(rows, R, pulse) {
    var us = selUnits();
    function col(s) {
      var L = rows.filter(function (x) { return x.c.stage === s[0]; });
      return '<div class="td-kcol k-' + s[0] + '" data-col="' + s[0] + '"><div class="td-kcol-h"><span>' + s[1] + '</span><em>' + L.length + '</em></div><div class="td-kcol-b">' + L.map(function (x) {
        var c = x.c, hl = pulse === x.u.id + '|' + c.id, tg = [];
        if (tdDup(x.u, c).length) tg.push('<span class="tag tag-warn">Nộp trùng</span>'); if (tdExNv(x.u, c)) tg.push('<span class="tag tag-info">Từng làm</span>'); if (!c.consent) tg.push('<span class="tag tag-bad">Chưa có đồng ý DL</span>');
        return '<div class="td-kc' + (hl ? ' td-hl' : '') + '" draggable="true" data-cd="' + x.u.id + '|' + c.id + '"><div class="td-kc-h"><span class="td-av">' + esc(tdIni(c.name)) + '</span><div><a href="#" class="plink td-strong" data-act="td-c" data-u="' + x.u.id + '" data-id="' + c.id + '">' + esc(c.name) + '</a><button class="td-starbtn' + (c.starred ? ' on' : '') + '" data-act="td-star" data-u="' + x.u.id + '" data-id="' + c.id + '" title="Đánh dấu nổi bật">' + (c.starred ? '★' : '☆') + '</button><small>' + esc(x.r.pos) + (us.length > 1 ? ' · ' + esc(shortUnit(x.u.name)) : '') + '</small></div></div>' +
          '<div class="td-kc-m">' + tdIvCell(c, R) + '<span class="muted">nộp ' + vn(c.at).slice(0, 5) + '</span></div>' + (tg.length ? '<div class="td-tags">' + tg.join('') + '</div>' : '') + '<div class="td-kc-n">' + tdNextAct(x.u, c, R) + '</div></div>';
      }).join('') + (L.length ? '' : '<div class="td-kempty">Kéo thẻ vào đây</div>') + '</div></div>';
    }
    // hàng trên: 6 trạng thái đang xét; hàng dưới: 3 trạng thái kết thúc – vừa 1 màn hình, không phải cuộn ngang khi kéo
    return '<div class="td-kb">' + TD_STG.filter(function (s) { return TD_LIVE.indexOf(s[0]) >= 0; }).map(col).join('') + '</div><div class="td-kb td-kb2">' + TD_STG.filter(function (s) { return tdClosedSt(s[0]); }).map(col).join('') + '</div>';
  }
  function tdBoardBind() {
    var page = $('#page'); if (page._tdKb) return; page._tdKb = 1; var drag = null;
    page.addEventListener('dragstart', function (e) { var t = e.target.closest && e.target.closest('[data-cd]'); if (!t) return; drag = t.getAttribute('data-cd'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) { } t.classList.add('dragging'); });
    page.addEventListener('dragend', function () { drag = null; $$('.td-kc.dragging,.td-kcol.drop-ok').forEach(function (x) { x.classList.remove('dragging', 'drop-ok'); }); });
    page.addEventListener('dragover', function (e) { if (!drag) return; var col = e.target.closest('[data-col]'); if (!col) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; $$('.td-kcol.drop-ok').forEach(function (x) { if (x !== col) x.classList.remove('drop-ok'); }); col.classList.add('drop-ok'); });
    page.addEventListener('drop', function (e) {
      if (!drag) return; var col = e.target.closest('[data-col]'); if (!col) return; e.preventDefault();
      var k = drag.split('|'), u = unitById(k[0]), c = u && tdCand(u, k[1]), s = col.getAttribute('data-col'); drag = null; if (!c || c.stage === s) { render(); return; }
      if (PS.tdu) PS.tdu.pulse = u.id + '|' + c.id;
      tdSetStage(u, c, s, tdAfter(u, c));
      setTimeout(function () { if (c.stage !== s) render(); }, 0);
      if (c.stage === s && TD_STAGE_TIP[s]) toast(c.name + ' → ' + TD_STN[s], 'info', TD_STAGE_TIP[s]);
    });
  }
  var TD_STAGE_TIP = { iv: 'Bấm “Hẹn phỏng vấn” trên thẻ để đặt lịch và gửi thư mời phỏng vấn.', fail: 'Bấm “Gửi thông báo kết quả” để gửi thư cảm ơn & thông báo chưa trúng tuyển.', hired: 'Bấm “Chuyển thành nhân sự” để tạo hồ sơ nhân sự.', hold: 'Công ty đang cân nhắc – bấm “Chốt kết quả” khi đã quyết định.', ivcancel: 'Lịch đang hẹn đã đánh dấu Hủy. Bấm “Hẹn lại phỏng vấn” nếu cần.' };
  /* =====================================================================
     NGÂN HÀNG ỨNG VIÊN (11/11 – anh: module số 2; tập trung data: thấy vị trí, tình trạng, đổi nhanh tình trạng,
     hẹn nhanh lịch phỏng vấn, gửi thông báo kết quả, gửi thư mời làm việc – nút gợi ý xuất hiện theo tình trạng)
     ===================================================================== */
  var TD_UST = [['live', 'Đang xét'], ['new', 'Mới nhận'], ['screen', 'Sàng lọc'], ['iv', 'Phỏng vấn'], ['hold', 'Cân nhắc'], ['offer', 'Mời nhận việc'], ['hired', 'Đồng ý nhận việc'], ['closed', 'Đã đóng'], ['all', 'Tất cả']];
  function tdUstOk(c, st) { return st === 'all' ? true : st === 'live' ? TD_LIVE.indexOf(c.stage) >= 0 : st === 'closed' ? tdClosedSt(c.stage) : c.stage === st; }
  function tdLastDone(c) { var l = (c.ivs || []).filter(function (v) { return v.st === 'done' && v.res; }); return l[l.length - 1] || null; }
  function tdHasLt(c, t) { return (c.letters || []).filter(function (l) { return l.t === t; }).pop() || null; }
  function tdPvSent(c, p) { return (c.letters || []).some(function (l) { return (l.t === 'pv' || l.t === 'dl') && (!p.v.at || String(l.at) >= String(p.v.at)); }); }
  function tdPlanIv(c) { var l = (c.ivs || []).map(function (v, i) { return { v: v, i: i }; }).filter(function (x) { return x.v.st === 'plan'; }); return l[0] || null; }
  // Việc cần làm ngay cho từng ứng viên (gợi ý xuất hiện khi đổi tình trạng)
  function tdNextAct(u, c, R) {
    var B = function (x, txt, pri, extra) { return '<button class="btn btn-sm' + (pri ? ' btn-primary' : '') + '" data-act="td-q" data-x="' + x + '" data-u="' + u.id + '" data-id="' + c.id + '"' + (extra || '') + '>' + txt + '</button>'; };
    var M = function (t) { return '<span class="td-done">' + ic('check', 13) + t + '</span>'; };
    var p = tdPlanIv(c), ld = tdLastDone(c);
    var MV = function () { return p.v.old && (c.letters || []).some(function (l) { return l.t === 'pv'; }) ? B('dlmail', ic('td_mail', 13) + 'Gửi thông báo dời lịch', true) : B('pvmail', ic('td_mail', 13) + 'Gửi thư mời PV', true); };
    if (c.stage === 'hold') return B('result', 'Chốt kết quả', true);
    if (c.stage === 'ivcancel') return B('iv', ic('td_cal', 13) + 'Hẹn lại phỏng vấn', true);
    if (c.stage === 'new' || c.stage === 'screen') return p ? (tdPvSent(c, p) ? M('Đã gửi thư mời PV') : MV()) : B('iv', ic('td_cal', 13) + 'Hẹn phỏng vấn', true);
    if (c.stage === 'iv') {
      if (p && p.v.date <= R) return B('eval', 'Ghi kết quả phỏng vấn', true, ' data-i="' + p.i + '"');
      if (p) return tdPvSent(c, p) ? M('Đã gửi thư mời PV') : MV();
      if (ld && ld.res === 'pass') return B('offer', ic('td_mail', 13) + 'Gửi thư mời nhận việc', true);
      if (ld && ld.res === 'fail') return B('tcmail', ic('td_mail', 13) + 'Gửi thông báo kết quả', true);
      if (ld && ld.res === 'hold') return B('result', 'Chốt kết quả', true);
      return B('iv', ic('td_cal', 13) + 'Hẹn phỏng vấn', true);
    }
    if (c.stage === 'offer') { if (!c.offer) return B('offer', 'Lập điều kiện mời', true); if (!tdHasLt(c, 'nv')) return B('nvmail', ic('td_mail', 13) + 'Gửi thư mời nhận việc', true); return '<span class="td-q2">' + B('ans-yes', 'Đồng ý', true) + B('ans-no', 'Từ chối') + '</span>'; }
    if (c.stage === 'hired') return c.nvId ? '<button class="btn btn-sm" data-act="hd-new" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Lập hợp đồng</button>' : B('tonv', ic('td_arrow', 13) + 'Chuyển thành nhân sự', true);
    if (c.stage === 'fail') { var l = tdHasLt(c, 'tc'); return l ? M('Đã gửi thông báo ' + vn(String(l.at).slice(0, 10)).slice(0, 5)) : B('tcmail', ic('td_mail', 13) + 'Gửi thông báo kết quả', true); }
    return '<span class="muted">—</span>';
  }
  function tdIvCell(c, R) {
    if (c.stage === 'ivcancel') return '<span class="tag tag-mute">Đã hủy phỏng vấn</span>';
    var p = tdPlanIv(c), ld = tdLastDone(c);
    if (p) { var d = p.v.date; return d === R ? '<span class="tag tag-warn">' + ic('td_cal', 12) + 'Hôm nay ' + esc(p.v.time || '') + '</span>' : d < R ? '<span class="tag tag-bad">Quá lịch ' + vn(d).slice(0, 5) + ' – chưa đánh giá</span>' : '<span class="td-ivd">' + ic('td_cal', 13) + vn(d).slice(0, 5) + ' · ' + esc(p.v.time || '') + '</span>'; }
    if (ld) { var s = tdScore(ld); return '<span class="tag ' + (ld.res === 'pass' ? 'tag-ok' : ld.res === 'fail' ? 'tag-bad' : 'tag-warn') + '">' + (ld.res === 'pass' ? 'Đạt' : ld.res === 'fail' ? 'Chưa đạt' : 'Cân nhắc') + (s !== null ? ' · ★ ' + String(s).replace('.', ',') : '') + '</span>'; }
    return '<span class="muted">—</span>';
  }
  function tdCandAll() { var out = []; tdUnitsAll().forEach(function (u) { tdOf(u).cd.forEach(function (c) { out.push({ u: u, c: c, r: tdReq(u, c.rq) || { pos: '(phiếu đã xóa)', pb: '', id: '' } }); }); }); return out; }
  function tdTodo(x) { var c = x.c, ld = tdLastDone(c); return (c.stage === 'fail' && !tdHasLt(c, 'tc')) || (c.stage === 'iv' && ld && !tdPlanIv(c) && (ld.res === 'pass' || ld.res === 'fail')) || (c.stage === 'offer' && !tdHasLt(c, 'nv')); }
  var TD_UK = { todo: 'Cần gửi thông báo / thư mời', tonv: 'Đồng ý nhận việc – chưa chuyển hồ sơ', stale: 'Hồ sơ mới chờ quá 3 ngày' };
  PAGES.tdungvien = function () {
    var f = ps('tdu', { q: '', rqs: [], src: '', st: 'live', co: '', k: '', star: false, view: 'list' }); if (!f.st) f.st = 'live'; if (!f.rqs) f.rqs = []; if (f.view !== 'board') f.view = 'list';
    var R = refDate(), us = tdUnitsAll(), all = tdCandAll();
    if (f.co && !us.some(function (u) { return u.id === f.co; })) f.co = '';
    var liveN = all.filter(function (x) { return tdUstOk(x.c, 'live'); }).length, stale = all.filter(function (x) { return x.c.stage === 'new' && tdDiff(x.c.at, R) >= 3; });
    var iv7 = 0; all.forEach(function (x) { (x.c.ivs || []).forEach(function (v) { if (v.st === 'plan' && v.date >= R && tdDiff(R, v.date) <= 7) iv7++; }); });
    var todo = all.filter(tdTodo), tonv = all.filter(function (x) { return x.c.stage === 'hired' && !x.c.nvId; });
    var cur = f.k || (f.st === 'live' ? 'live' : f.st === 'new' ? 'new' : f.st === 'iv' ? 'iv' : '');
    var stats = tdStats('td-uk', cur, [
      { id: 'live', n: liveN, label: 'hồ sơ đang xét', sub: all.length + ' hồ sơ tất cả', icon: 'tdungvien' },
      { id: 'new', n: all.filter(function (x) { return x.c.stage === 'new'; }).length, label: 'hồ sơ mới nhận', sub: stale.length ? stale.length + ' chờ quá 3 ngày' : '', tone: stale.length ? 'warn' : '', icon: 'td_plus' },
      { id: 'iv', n: all.filter(function (x) { return x.c.stage === 'iv'; }).length, label: 'đang phỏng vấn', sub: iv7 ? iv7 + ' lịch trong 7 ngày tới' : '', icon: 'td_cal' },
      { id: 'todo', n: todo.length, label: 'cần gửi kết quả / thư mời', tone: todo.length ? 'warn' : '', icon: 'td_mail', tip: 'Ứng viên đã có kết quả nhưng chưa gửi thông báo hoặc thư mời nhận việc' },
      { id: 'tonv', n: tonv.length, label: 'đồng ý – chưa thành nhân sự', tone: tonv.length ? 'bad' : '', icon: 'td_arrow' }]);
    var q = norm(f.q);
    var base = (f.k === 'todo' ? todo : f.k === 'tonv' ? tonv : f.k === 'stale' ? stale : all.filter(function (x) { return tdUstOk(x.c, f.st); }))
      .filter(function (x) { return (!f.src || x.c.src === f.src) && (!q || norm([x.c.name, x.c.phone, x.c.email, x.r.pos, x.c.id].join(' ')).indexOf(q) >= 0); });
    var byCo = base.filter(function (x) { return !f.co || x.u.id === f.co; });
    var rqKeys = {}; us.forEach(function (u) { tdOf(u).rq.forEach(function (r) { rqKeys[u.id + '|' + r.id] = 1; }); });
    f.rqs = f.rqs.filter(function (k) { return rqKeys[k]; });
    var starN = byCo.filter(function (x) { return x.c.starred; }).length;
    var rows = byCo.filter(function (x) { return (!f.rqs.length || f.rqs.indexOf(x.u.id + '|' + x.c.rq) >= 0) && (!f.star || x.c.starred); });
    var pulse = f.pulse || '';
    if (pulse && !rows.some(function (x) { return x.u.id + '|' + x.c.id === pulse; })) { var px = all.filter(function (x) { return x.u.id + '|' + x.c.id === pulse; })[0]; if (px) { px.kept = 1; rows.push(px); } } // dòng vừa đổi tình trạng vẫn hiện để bấm việc tiếp theo
    var uix = {}; us.forEach(function (u, i) { uix[u.id] = i; });
    var stOrd = TD_STG.map(function (s) { return s[0]; });
    rows.sort(function (a, b) { return (uix[a.u.id] - uix[b.u.id]) || cmp(a.r.pos, b.r.pos) || (stOrd.indexOf(a.c.stage) - stOrd.indexOf(b.c.stage)) || cmp(b.c.at, a.c.at); });
    var stAll = all.filter(function (x) { return (!f.co || x.u.id === f.co); });
    // 11/11 16:29 anh: chỉ Công ty (đầu trang) và Tình trạng dạng tab; Vị trí chọn 1 hoặc nhiều trong menu thả xuống; nút lọc nhanh ứng viên nổi bật
    // 11/11 18:20 anh: cách hiển thị tách thành phần riêng – 2 tab đặt giữa, ngay trên bảng dữ liệu
    var sec = (us.length > 1 ? tdFbox([{ label: 'Công ty', act: 'td-uco', cur: f.co, items: [['', 'Tất cả', base.length]].concat(us.map(function (u) { return [u.id, shortUnit(u.name), base.filter(function (x) { return x.u === u; }).length]; })) }]) : '') +
      '<div class="td-vtabs" role="tablist"><div class="td-vtabs-in"><button role="tab" aria-selected="' + (f.view === 'list') + '" class="' + (f.view === 'list' ? 'on' : '') + '" data-act="td-uview" data-id="list">' + ic('td_list', 16) + 'Theo danh sách</button><button role="tab" aria-selected="' + (f.view === 'board') + '" class="' + (f.view === 'board' ? 'on' : '') + '" data-act="td-uview" data-id="board" title="Cột theo trạng thái – kéo thả thẻ để chuyển trạng thái">' + ic('td_cols', 16) + 'Theo trạng thái</button></div></div>';
    var rqLab = !f.rqs.length ? 'Tất cả vị trí' : f.rqs.length === 1 ? (function () { var k = f.rqs[0].split('|'), r = tdReq(unitById(k[0]), k[1]); return r ? r.pos : '1 vị trí'; })() : f.rqs.length + ' vị trí';
    var bar = (f.view === 'board' && !f.k ? '' : '<div class="td-tbar">' + (f.k ? tdFilterChip('Đang lọc: ' + TD_UK[f.k] + ' (' + base.length + ')', 'td-uk') : tdPills('td-ust', f.st, TD_UST.map(function (s) { return [s[0], s[1], stAll.filter(function (x) { return tdUstOk(x.c, s[0]); }).length]; }), 'st')) + '</div>') +
      '<div class="td-tbar td-tbar2">' + tdSearch('tdUQ', f.q, 'Tên, số điện thoại, email, mã hồ sơ…') +
      '<button class="td-dd' + (f.rqs.length ? ' on' : '') + '" data-act="td-urqm" title="Chọn một hoặc nhiều vị trí">' + ic('tdnhucau', 15) + '<span>' + esc(rqLab) + '</span>' + (f.rqs.length ? '<em>' + f.rqs.length + '</em>' : '') + '<i>▾</i></button>' +
      '<select class="input input-sm td-srcsel" id="tdUS" title="Nguồn hồ sơ">' + [['', 'Tất cả nguồn']].concat(TD_SRC.map(function (s) { return [s, s]; })).map(function (o) { return opt(o[0], o[1], f.src); }).join('') + '</select>' +
      '<button class="td-pill td-starf' + (f.star ? ' on' : '') + '" data-act="td-ustar" title="Chỉ hiện ứng viên đánh dấu nổi bật">★ Nổi bật<em>' + starN + '</em></button>' +
      '<span class="sp"></span>' + (f.view === 'board' ? '<span class="muted" style="font-size:12px">Kéo thả thẻ giữa các cột để chuyển trạng thái</span>' : '') + '</div>';
    if (f.view === 'board') { var bRows = (f.k ? base : all).filter(function (x) { return (!f.co || x.u.id === f.co) && (!f.src || x.c.src === f.src) && (!q || norm([x.c.name, x.c.phone, x.c.email, x.r.pos, x.c.id].join(' ')).indexOf(q) >= 0) && (!f.rqs.length || f.rqs.indexOf(x.u.id + '|' + x.c.rq) >= 0) && (!f.star || x.c.starred); }); return '<div class="page-head"><div><h1>Ngân hàng ứng viên</h1><p class="muted">Theo trạng thái: mỗi cột là một trạng thái, kéo thả thẻ ứng viên sang cột khác để chuyển trạng thái – nút việc tiếp theo trên thẻ đổi theo.</p></div><div class="link-row" style="margin:0"><button class="btn" data-act="td-imp">' + ic('nhap', 15) + 'Nhập từ Excel</button><button class="btn btn-primary" data-act="td-c-add">' + ic('td_plus', 15) + 'Thêm ứng viên</button></div></div>' + stats + '<div id="tdUList"></div>' + sec + '<div class="card td-rtbl td-kbwrap">' + bar + tdBoard(bRows, R, pulse) + '</div>'; }
    var tbl = rows.length ? '<div class="card td-rtbl">' + bar + table('tdCand', [
      { t: 'Ứng viên', f: function (x) { return x.c.name; }, h: function (x) { var c = x.c, tg = []; if (tdDup(x.u, c).length) tg.push('<span class="tag tag-warn">Nộp trùng</span>'); if (tdExNv(x.u, c)) tg.push('<span class="tag tag-info">Từng làm ở công ty</span>'); if (!c.consent) tg.push('<span class="tag tag-bad" title="Chưa ghi nhận ứng viên đồng ý xử lý dữ liệu cá nhân">Chưa có đồng ý DL</span>'); return '<span class="td-who"><span class="td-av">' + esc(tdIni(c.name)) + '</span><span><a href="#" class="plink td-strong" data-act="td-c" data-u="' + x.u.id + '" data-id="' + c.id + '">' + esc(c.name) + '</a><button class="td-starbtn' + (c.starred ? ' on' : '') + '" data-act="td-star" data-u="' + x.u.id + '" data-id="' + c.id + '" title="' + (c.starred ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu ứng viên nổi bật') + '">' + (c.starred ? '★' : '☆') + '</button><small class="td-sub">' + esc(tdPhoneFmt(c.phone)) + ' · ' + esc(c.id) + (c.cv ? ' · có CV' : '') + '</small>' + (tg.length ? '<span class="td-tags">' + tg.join('') + '</span>' : '') + '</span></span>'; }, wrap: 1 },
      { t: 'Vị trí ứng tuyển', f: function (x) { return x.r.pos; }, h: function (x) { return esc(x.r.pos) + (us.length > 1 ? '<small class="td-sub">' + esc(shortUnit(x.u.name)) + '</small>' : ''); }, wrap: 1 },
      { t: 'Nộp', f: function (x) { return x.c.at; }, h: function (x) { var d = tdDiff(x.c.at, R); return vn(x.c.at) + '<small class="td-sub">' + esc(x.c.src || '') + (x.c.stage === 'new' && d >= 3 ? ' · <b style="color:var(--warn)">chờ ' + d + ' ngày</b>' : '') + '</small>'; } },
      { t: 'Tình trạng', f: function (x) { return TD_STN[x.c.stage]; }, s: function (x) { return stOrd.indexOf(x.c.stage); }, h: function (x) { return '<select class="td-stsel s-' + x.c.stage + '" data-u="' + x.u.id + '" data-id="' + x.c.id + '" title="Đổi nhanh tình trạng">' + TD_STG.map(function (s) { return opt(s[0], s[1], x.c.stage); }).join('') + '</select>'; } },
      { t: 'Phỏng vấn', f: function (x) { var p = tdPlanIv(x.c); return p ? p.v.date : (tdLastDone(x.c) ? 'z' : ''); }, h: function (x) { var live = TD_LIVE.indexOf(x.c.stage) >= 0 && x.c.stage !== 'hired'; return '<span class="td-ivc">' + tdIvCell(x.c, R) + (live ? '<button class="btn btn-sm" data-act="td-q" data-x="iv" data-u="' + x.u.id + '" data-id="' + x.c.id + '" title="' + (tdPlanIv(x.c) ? 'Đổi lịch phỏng vấn' : 'Hẹn nhanh lịch phỏng vấn') + '">' + ic('td_cal', 13) + '</button>' : '') + '</span>'; } },
      { t: 'Việc tiếp theo', nosort: 1, f: function () { return ''; }, h: function (x) { return '<span class="td-next">' + tdNextAct(x.u, x.c, R) + '</span>'; } },
      { t: 'Email', f: function (x) { return x.c.email || ''; }, hide: true }, { t: 'Điện thoại', f: function (x) { return tdPhoneFmt(x.c.phone); }, hide: true },
      { t: 'Công ty', f: function (x) { return shortUnit(x.u.name); }, hide: true }, { t: 'Nguồn', f: function (x) { return x.c.src || ''; }, hide: true },
      { t: 'Đồng ý dữ liệu', f: function (x) { return x.c.consent ? 'Có – ' + tdVnAt(x.c.consent.at) : 'Chưa ghi nhận'; }, hide: true }
    ], rows, { title: 'Du lieu ung vien', limit: 300, rowAttr: function (x) { return pulse === x.u.id + '|' + x.c.id ? ' class="td-hl"' + (x.kept ? ' title="Vừa đổi tình trạng – vẫn hiện tạm để làm việc tiếp theo"' : '') : ''; } }) + '</div>' :
      '<div class="card td-rtbl">' + bar + '<div class="empty" style="padding:28px;text-align:center"><h2>Không có hồ sơ nào ở mục này</h2><p class="muted">' + (f.k || f.q || f.src || f.star || f.rqs.length ? 'Bấm “Bỏ lọc”, bỏ chọn vị trí / nổi bật hoặc xóa ô tìm để xem lại tất cả.' : 'Thêm ứng viên, nhập từ Excel, hoặc thử nộp hồ sơ trên Cổng tuyển dụng.') + '</p></div></div>';
    return '<div class="page-head"><div><h1>Ngân hàng ứng viên</h1><p class="muted">Mọi hồ sơ ở một chỗ – từ cổng tuyển dụng, fanpage, nhóm Zalo hay người giới thiệu. Đổi nhanh tình trạng ngay trên bảng; cột “Việc tiếp theo” gợi ý hẹn phỏng vấn, gửi kết quả, gửi thư mời nhận việc theo đúng tình trạng.</p></div><div class="link-row" style="margin:0"><button class="btn" data-act="td-imp">' + ic('nhap', 15) + 'Nhập từ Excel</button><button class="btn" disabled title="Hoạt động khi cổng tuyển dụng đã kết nối máy chủ">' + ic('td_srv', 15) + 'Lấy hồ sơ từ cổng</button><button class="btn btn-primary" data-act="td-c-add">' + ic('td_plus', 15) + 'Thêm ứng viên</button></div></div>' +
      stats + '<div id="tdUList"></div>' + sec + tbl;
  };
  BINDS.tdungvien = function () {
    selUnits().forEach(function (x) { if (x.td && tdThu(x)) { tdThuPull(x, true); tdThuTimer(); } });
    tdBoardBind();
    var f = PS.tdu; tdBindSearch('tdUQ', 'tdu', 'q');
    var s = $('#tdUS'); if (s) s.addEventListener('change', function () { f.src = s.value; render(); });
    if (f.scroll) { f.scroll = 0; setTimeout(function () { var el = $('#tdUList'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }
    var hl = $('tr.td-hl'); if (hl && f.pulse !== f.pulseShown) { f.pulseShown = f.pulse; setTimeout(function () { hl.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 40); }
    if (f.pulse) { clearTimeout(f.pulseT); f.pulseT = setTimeout(function () { f.pulse = ''; f.pulseShown = ''; }, 15000); }
  };
  ACTS['td-uk'] = function (a, id) { var f = ps('tdu', {}); if (id === 'live' || id === 'new' || id === 'iv' || !id) { f.k = ''; f.st = id || 'live'; } else f.k = f.k === id ? '' : id; f.rqs = []; f.co = ''; f.star = false; f.scroll = 1; render(); };
  ACTS['td-ust'] = function (a, id) { var f = ps('tdu', {}); f.st = id; f.k = ''; render(); };
  ACTS['td-uco'] = function (a, id) { var f = ps('tdu', {}); f.co = id; f.rqs = []; render(); };
  ACTS['td-uview'] = function (a, id) { var f = ps('tdu', {}); f.view = id; render(); };
  ACTS['td-ustar'] = function () { var f = ps('tdu', {}); f.star = !f.star; render(); };
  ACTS['td-star'] = function (a, id, e) { if (e) e.stopPropagation(); var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (!c) return; c.starred = !c.starred; tdHist(c, c.starred ? 'Đánh dấu nổi bật' : 'Bỏ đánh dấu nổi bật'); tdSave(u); render(); };
  // Menu thả xuống chọn 1 hoặc nhiều vị trí
  ACTS['td-urqm'] = function (a) {
    var f = ps('tdu', {}), old = $('.td-ddp'); if (old) { old.remove(); return; }
    var us = tdUnitsAll().filter(function (u) { return !f.co || u.id === f.co; }), all = tdCandAll();
    var cnt = function (k) { return all.filter(function (x) { return x.u.id + '|' + x.c.rq === k && tdUstOk(x.c, f.st || 'live'); }).length; };
    var pn = document.createElement('div'); pn.className = 'td-ddp';
    pn.innerHTML = '<div class="td-ddp-h"><b>Vị trí ứng tuyển</b><span><button class="btn btn-sm" data-x="all">Chọn tất cả</button><button class="btn btn-sm" data-x="none">Bỏ chọn</button></span></div><div class="td-ddp-l">' + us.map(function (u) {
      var rs = tdOf(u).rq.slice().sort(function (x, y) { return (x.st === 'open' ? 0 : 1) - (y.st === 'open' ? 0 : 1) || cmp(x.pos, y.pos); });
      return (us.length > 1 ? '<div class="td-ddp-g">' + esc(shortUnit(u.name)) + '</div>' : '') + rs.map(function (r) { var k = u.id + '|' + r.id; return '<label class="td-ddp-i"><input type="checkbox" value="' + esc(k) + '"' + (f.rqs.indexOf(k) >= 0 ? ' checked' : '') + '><span>' + esc(r.pos) + '<small>' + esc(r.pb) + ' · ' + TD_RST[r.st] + '</small></span><em>' + cnt(k) + '</em></label>'; }).join('');
    }).join('') + '</div><div class="td-ddp-f"><span class="muted" style="font-size:12px">Số bên phải: hồ sơ theo tình trạng đang chọn</span><button class="btn btn-sm btn-primary" data-x="ok">Xong</button></div>';
    document.body.appendChild(pn);
    var rc = a.getBoundingClientRect(); pn.style.top = (rc.bottom + window.scrollY + 6) + 'px'; pn.style.left = Math.max(8, Math.min(rc.left + window.scrollX, window.innerWidth - pn.offsetWidth - 8)) + 'px';
    function sync() { f.rqs = $$('input', pn).filter(function (i) { return i.checked; }).map(function (i) { return i.value; }); }
    function close() { pn.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key); render(); }
    function out(e) { if (!pn.contains(e.target) && !e.target.closest('[data-act="td-urqm"]')) close(); }
    function key(e) { if (e.key === 'Escape') close(); }
    pn.addEventListener('change', sync);
    pn.addEventListener('click', function (e) { var b = e.target.closest('[data-x]'); if (!b) return; var x = b.getAttribute('data-x'); if (x === 'ok') return close(); $$('input', pn).forEach(function (i) { i.checked = x === 'all'; }); sync(); });
    setTimeout(function () { document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key); }, 0);
  };
  ACTS['td-c'] = function (a, id, e) { if (e) e.preventDefault(); var u = unitById(a.getAttribute('data-u')); if (u && tdCand(u, id)) tdCandOpen(u, id); };
  ACTS['td-c-add'] = function () { tdCandForm(selUnits()[0], null); };
  function tdAfter(u, c) { return function () { if (PS.tdu) PS.tdu.pulse = u.id + '|' + c.id; render(); }; }
  ACTS['td-q'] = function (a, id) {
    var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (!c) return; var x = a.getAttribute('data-x'), cb = tdAfter(u, c);
    if (x === 'iv') { var p = tdPlanIv(c); tdIvForm(u, c, p ? p.i : null, cb); }
    else if (x === 'eval') tdIvPopup(u, c, +a.getAttribute('data-i'));
    else if (x === 'dlmail') tdLetter(u, c, 'dl', cb);
    else if (x === 'pvmail') tdLetter(u, c, 'pv', cb);
    else if (x === 'offer') { if (c.offer) tdLetter(u, c, 'nv', cb); else tdOfferForm(u, c, cb); }
    else if (x === 'nvmail') tdLetter(u, c, 'nv', cb);
    else if (x === 'offeredit') tdOfferForm(u, c, cb, { noLetter: true });
    else if (x === 'tcmail') tdLetter(u, c, 'tc', cb);
    else if (x === 'result') { var tg = tdTargetIv(c); if (tg) tdIvPopup(u, c, tg.i); else { var m0 = modal('Chốt kết quả – ' + c.name, (tdReq(u, c.rq) || {}).pos || '', tdResultBox(u, c, 'rb0', null)); tdResultBind(m0, u, c, 'rb0', null, function () { m0.close(); cb(); }); } }
    else if (x === 'ans-yes' || x === 'ans-no') tdAnswer(u, c, x === 'ans-yes');
    else if (x === 'tonv') tdToNv(u, c);
  };
  function tdAnswer(u, c, y) {
    if (!c.offer) return; c.offer.ans = y ? 'yes' : 'no'; c.offer.ansAt = tdNow();
    if (y) { c.stage = 'hired'; tdHist(c, 'Đồng ý nhận việc, đi làm từ ' + vn(c.offer.start)); } else { c.stage = 'withdraw'; c.endAt = HR.isoToday(); tdHist(c, 'Từ chối thư mời nhận việc'); }
    tdSave(u, c.id + (y ? ' đồng ý' : ' từ chối') + ' nhận việc'); if (PS.tdu) PS.tdu.pulse = u.id + '|' + c.id; render();
    if (y) toast(c.name + ' đồng ý nhận việc', 'ok', 'Bấm "Chuyển thành nhân sự" để tạo hồ sơ (thông tin tự điền), rồi lập hợp đồng trước ngày đi làm.');
  }
  // Đổi nhanh tình trạng trên bảng → hiện gợi ý việc tiếp theo ngay trên dòng đó
  document.addEventListener('change', function (e) {
    var s = e.target; if (!s.classList || !s.classList.contains('td-stsel')) return;
    var u = unitById(s.getAttribute('data-u')), c = u && tdCand(u, s.getAttribute('data-id')); if (!c) return;
    var v = s.value, cb = tdAfter(u, c); if (PS.tdu) PS.tdu.pulse = u.id + '|' + c.id;
    tdSetStage(u, c, v, cb);
    setTimeout(function () { if (c.stage !== v) render(); }, 0); // mở form (mời nhận việc) mà chưa lưu → bảng trả về tình trạng cũ
    var nx = TD_STAGE_TIP[v];
    if (nx && c.stage === v) toast(c.name + ' → ' + TD_STN[v], 'info', nx);
  });

  /* =====================================================================
     LỊCH PHỎNG VẤN – lịch cả tháng, mỗi ngày hiện tên ứng viên, vị trí, giờ; bấm để mở hồ sơ
     ===================================================================== */
  function tdIvEvents(f) {
    var ev = []; tdUnitsAll().forEach(function (u) { if (f.co && u.id !== f.co) return; tdOf(u).cd.forEach(function (c) { var r = tdReq(u, c.rq) || { pos: '' }; (c.ivs || []).forEach(function (v, i) { if (!v.date || (v.st === 'cancel' && !f.cancel)) return; ev.push({ u: u, c: c, r: r, v: v, i: i, n: i + 1 }); }); }); });
    ev.sort(function (a, b) { return cmp(a.v.date + (a.v.time || ''), b.v.date + (b.v.time || '')); }); return ev;
  }
  // 11/11 16:29 anh: thẻ lịch hiện thêm người phỏng vấn, hình thức (trực tiếp / online); kéo thả để dời lịch (giữ nguyên các thông tin khác)
  function tdModeShort(m) { m = String(m || ''); return /tr[ựu]c\s*tuy[ếe]n|online|meet|zoom/i.test(m) ? 'Online' : /[đd]i[ệe]n\s*tho[ạa]i|phone/i.test(m) ? 'Điện thoại' : 'Trực tiếp'; }
  function tdWhoShort(w) { return String(w || '').split(/\s+[–-]\s+/)[0]; }
  function tdEvChip(e, R, compact) {
    var st = e.v.st === 'cancel' ? 'cancel' : e.v.st === 'done' ? (e.v.res === 'fail' ? 'fail' : 'done') : (e.v.date < R ? 'late' : 'plan');
    var drag = e.v.st === 'plan', md = tdModeShort(e.v.mode);
    return '<button class="td-ev s-' + st + (drag ? ' drag' : '') + '"' + (drag ? ' draggable="true" data-ev="' + e.u.id + '|' + e.c.id + '|' + e.i + '"' : '') + ' data-act="td-ivp" data-i="' + e.i + '" data-u="' + e.u.id + '" data-id="' + e.c.id + '" title="' + esc(e.c.name + ' – ' + e.r.pos + '\n' + vn(e.v.date) + ' ' + (e.v.time || '') + ' · ' + (e.v.mode || '') + (e.v.who ? '\nNgười phỏng vấn: ' + e.v.who : '') + (e.v.place ? '\n' + e.v.place : '') + (st === 'late' ? '\nĐã qua giờ, chưa đánh giá' : '') + (drag ? '\n(Kéo sang ô khác để dời lịch · bấm để xem chi tiết)' : '\n(Bấm để xem chi tiết)')) + '">' +
      '<span class="td-ev-1"><b>' + esc(e.v.time || '') + '</b> ' + esc(e.c.name) + '</span><small>' + esc(e.r.pos) + (e.n > 1 ? ' · vòng ' + e.n : '') + '</small>' +
      (compact ? '' : '<small class="td-ev-3"><i class="md md-' + (md === 'Online' ? 'on' : md === 'Điện thoại' ? 'ph' : 'off') + '">' + md + '</i>' + (e.v.who ? esc(tdWhoShort(e.v.who)) : '') + '</small>') + '</button>';
  }
  function tdMonday(iso) { var d = new Date(iso + 'T00:00:00'); return tdAdd(iso, -((d.getDay() + 6) % 7)); }
  var TD_SLOT0 = 7, TD_SLOT1 = 19; // khung giờ ở dạng Tuần: 07:00 – 19:00, mỗi ô 30 phút
  PAGES.tdlich = function () {
    var R = refDate(), f = ps('tdl', { ym: R.slice(0, 7), co: '', cancel: false, view: 'month', wk: tdMonday(R) }), us = tdUnitsAll();
    if (!f.view) f.view = 'month'; if (!f.wk) f.wk = tdMonday(R);
    if (f.co && !us.some(function (u) { return u.id === f.co; })) f.co = '';
    var ev = tdIvEvents(f), y = +f.ym.slice(0, 4), mo = +f.ym.slice(5, 7);
    var plan = ev.filter(function (e) { return e.v.st === 'plan'; });
    var today = plan.filter(function (e) { return e.v.date === R; }), week = plan.filter(function (e) { return e.v.date >= R && tdDiff(R, e.v.date) <= 7; }), late = plan.filter(function (e) { return e.v.date < R; });
    var inM = ev.filter(function (e) { return e.v.date.slice(0, 7) === f.ym; });
    var stats = tdStats('td-lk', '', [
      { id: 'today', n: today.length, label: 'phỏng vấn hôm nay', sub: today.map(function (e) { return e.v.time; }).join(', '), tone: today.length ? 'warn' : '', icon: 'td_cal' },
      { id: 'week', n: week.length, label: 'lịch trong 7 ngày tới', icon: 'td_cal' },
      { id: 'month', n: inM.length, label: 'lịch trong tháng ' + mo + '/' + y, sub: inM.filter(function (e) { return e.v.st === 'done'; }).length + ' đã phỏng vấn', icon: 'tdlich' },
      { id: 'late', n: late.length, label: 'đã qua giờ – chưa đánh giá', tone: late.length ? 'bad' : '', icon: 'info', tip: 'Bấm để xem và đánh giá' }]);
    var sec = us.length > 1 ? tdFbox([{ label: 'Công ty', act: 'td-lco', cur: f.co, items: [['', 'Tất cả']].concat(us.map(function (u) { return [u.id, shortUnit(u.name)]; })) }]) : '';
    var wkEnd = tdAdd(f.wk, 6), title = f.view === 'week' ? 'Tuần ' + vn(f.wk).slice(0, 5) + ' – ' + vn(wkEnd) : 'Tháng ' + mo + ' / ' + y;
    var bar = '<div class="td-tbar"><div class="td-mnav"><button class="btn btn-sm" data-act="td-lm" data-id="-1" aria-label="Trước">‹</button><b>' + title + '</b><button class="btn btn-sm" data-act="td-lm" data-id="1" aria-label="Sau">›</button><button class="btn btn-sm" data-act="td-lm" data-id="0">Hôm nay</button></div>' +
      tdPills('td-lv', f.view, [['month', 'Tháng'], ['week', 'Tuần (theo giờ)']], 'st') + tdPills('td-lcx', f.cancel ? '1' : '', [['', 'Đang hẹn & đã PV'], ['1', 'Gồm cả lịch đã hủy']]) +
      '<span class="sp"></span><span class="td-leg"><i class="s-plan"></i>Đã hẹn<i class="s-late"></i>Quá giờ, chưa đánh giá<i class="s-done"></i>Đã phỏng vấn<i class="s-fail"></i>Chưa đạt' + (f.cancel ? '<i class="s-cancel"></i>Đã hủy' : '') + '</span></div>' +
      '<div class="td-dndhint">' + ic('info', 14) + 'Kéo thẻ lịch đang hẹn sang ô khác để dời lịch – ' + (f.view === 'week' ? 'ngày và giờ đổi theo ô thả, ' : 'ngày đổi theo ô thả, giờ giữ nguyên (muốn đổi cả giờ: dùng dạng Tuần), ') + 'người phỏng vấn, hình thức, địa điểm giữ nguyên.</div>';
    var byD = {}; ev.forEach(function (e) { (byD[e.v.date] = byD[e.v.date] || []).push(e); });
    var cal;
    if (f.view === 'week') {
      var days = []; for (var di = 0; di < 7; di++) days.push(tdAdd(f.wk, di));
      var DN = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
      var head = '<div class="td-wk-h"><span></span>' + days.map(function (d, i) { return '<span class="' + (d === R ? 'today' : '') + '">' + DN[i] + '<b>' + vn(d).slice(0, 5) + '</b></span>'; }).join('') + '</div>';
      var slot = function (t) { var h = +String(t || '00:00').slice(0, 2), mi = +String(t || '00:00').slice(3, 5), k = (h - TD_SLOT0) * 2 + (mi >= 30 ? 1 : 0); return Math.max(0, Math.min((TD_SLOT1 - TD_SLOT0) * 2 - 1, k)); };
      var rows = '';
      for (var k = 0; k < (TD_SLOT1 - TD_SLOT0) * 2; k++) {
        var hh = p2(TD_SLOT0 + Math.floor(k / 2)) + ':' + (k % 2 ? '30' : '00');
        rows += '<div class="td-wk-r' + (k % 2 ? '' : ' hr') + '"><span class="td-wk-t">' + (k % 2 ? '' : hh) + '</span>' + days.map(function (d) { var L = (byD[d] || []).filter(function (e) { return slot(e.v.time) === k; }); return '<div class="td-slot' + (d === R ? ' today' : '') + (d < R ? ' past' : '') + '" data-d="' + d + '" data-t="' + hh + '">' + L.map(function (e) { return tdEvChip(e, R); }).join('') + '</div>'; }).join('') + '</div>';
      }
      cal = '<div class="card td-week">' + bar + '<div class="td-wk-scroll">' + head + rows + '</div></div>';
    } else {
      var first = new Date(y, mo - 1, 1), off = (first.getDay() + 6) % 7, start = tdAdd(f.ym + '-01', -off), cells = '';
      var nW = Math.ceil((off + new Date(y, mo, 0).getDate()) / 7);
      for (var i = 0; i < nW * 7; i++) {
        var d = tdAdd(start, i), L = byD[d] || [], other = d.slice(0, 7) !== f.ym, wk = i % 7 >= 5;
        cells += '<div class="td-day' + (other ? ' oth' : '') + (d === R ? ' today' : '') + (wk ? ' wk' : '') + (d < R ? ' past' : '') + '" data-d="' + d + '"><div class="td-dh"><span>' + (+d.slice(8, 10)) + (d.slice(8, 10) === '01' ? '/' + (+d.slice(5, 7)) : '') + '</span>' + (d >= R ? '<button class="td-dadd" data-act="td-ladd" data-id="' + d + '" title="Hẹn phỏng vấn ngày ' + vn(d) + '">+</button>' : '') + '</div>' +
          L.slice(0, 3).map(function (e) { return tdEvChip(e, R); }).join('') + (L.length > 3 ? '<button class="td-more" data-act="td-lday" data-id="' + d + '">+' + (L.length - 3) + ' lịch nữa</button>' : '') + '</div>';
      }
      cal = '<div class="card td-cal">' + bar + '<div class="td-cal-h">' + ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'].map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div><div class="td-cal-g">' + cells + '</div></div>';
    }
    var lst = f.view === 'week' ? ev.filter(function (e) { return e.v.date >= f.wk && e.v.date <= wkEnd; }) : inM;
    var agenda = '<div class="card card-pad td-agenda"><div class="card-head"><div><h3>Danh sách lịch ' + (f.view === 'week' ? 'tuần ' + vn(f.wk).slice(0, 5) + ' – ' + vn(wkEnd).slice(0, 5) : 'tháng ' + mo + '/' + y) + '</h3><p>' + lst.length + ' lịch · bấm để mở hồ sơ ứng viên</p></div></div>' + (lst.length ? lst.map(function (e) { return '<div class="td-ag"><span class="ev-cal' + (e.v.date === R ? ' lv-canh' : '') + '"><small>' + ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(e.v.date + 'T00:00:00').getDay()] + '</small><b>' + (+e.v.date.slice(8, 10)) + '</b></span>' + tdEvChip(e, R) + '</div>'; }).join('') : '<p class="muted" style="margin:0">Chưa có lịch phỏng vấn trong khoảng này.</p>') + '</div>';
    return '<div class="page-head"><div><h1>Lịch phỏng vấn</h1><p class="muted">Lịch phỏng vấn của mọi vị trí. Bấm vào thẻ để xem hồ sơ ứng viên, đánh giá hoặc đổi lịch; kéo thẻ sang ô khác để dời lịch; bấm “+” ở một ngày để hẹn phỏng vấn ngày đó.</p></div><div class="link-row" style="margin:0"><button class="btn btn-primary" data-act="td-ladd" data-id="">' + ic('td_plus', 15) + 'Hẹn phỏng vấn</button></div></div>' + stats + sec + cal + agenda;
  };
  // Kéo thả dời lịch
  BINDS.tdlich = function () {
    var page = $('#page'); if (page._tdDnd) return; page._tdDnd = 1; var drag = null; // gắn 1 lần cho vùng trang
    page.addEventListener('dragstart', function (e) { var t = e.target.closest && e.target.closest('[data-ev]'); if (!t) return; drag = t.getAttribute('data-ev'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) { } t.classList.add('dragging'); document.body.classList.add('td-dragging'); });
    page.addEventListener('dragend', function (e) { drag = null; $$('.dragging,.drop-ok,.drop-no').forEach(function (x) { x.classList.remove('dragging', 'drop-ok', 'drop-no'); }); document.body.classList.remove('td-dragging'); });
    page.addEventListener('dragover', function (e) { if (!drag) return; var c = e.target.closest('[data-d]'); if (!c) return; e.preventDefault(); var ok = c.getAttribute('data-d') >= refDate(); e.dataTransfer.dropEffect = ok ? 'move' : 'none'; $$('.drop-ok,.drop-no').forEach(function (x) { if (x !== c) x.classList.remove('drop-ok', 'drop-no'); }); c.classList.add(ok ? 'drop-ok' : 'drop-no'); });
    page.addEventListener('drop', function (e) {
      if (!drag) return; var c = e.target.closest('[data-d]'); if (!c) return; e.preventDefault();
      var k = drag.split('|'), u = unitById(k[0]), cd = u && tdCand(u, k[1]), v = cd && cd.ivs[+k[2]]; drag = null; if (!v || v.st !== 'plan') return;
      var d = c.getAttribute('data-d'), t = c.getAttribute('data-t') || v.time, R = refDate();
      if (d < R) { toast('Không dời lịch về ngày đã qua', 'err', 'Chọn ô từ hôm nay trở đi.'); render(); return; }
      if (d === v.date && t === v.time) { render(); return; }
      var old = (v.time || '') + ' ' + vn(v.date); v.old = old; v.date = d; v.time = t; v.at = tdNow();
      tdHist(cd, 'Dời lịch phỏng vấn ' + old + ' → ' + vn(d) + ' ' + t + ' (kéo thả trên Lịch phỏng vấn)'); tdSave(u, 'Dời lịch phỏng vấn ' + cd.id + ' → ' + d + ' ' + t);
      var clash = []; tdUnitsAll().forEach(function (uu) { tdOf(uu).cd.forEach(function (cc) { (cc.ivs || []).forEach(function (vv) { if (vv !== v && vv.st === 'plan' && vv.date === d && vv.time === t && (!v.who || !vv.who || tdWhoShort(vv.who) === tdWhoShort(v.who))) clash.push(cc.name); }); }); });
      render(); if (clash.length) toast('Trùng giờ với: ' + clash.join(', '), 'info', 'Kiểm tra lại người phỏng vấn / phòng phỏng vấn.'); tdAskMoveMail(u, cd, v, old);
    });
  };
  ACTS['td-lv'] = function (a, id) { var f = PS.tdl; f.view = id; if (id === 'week') { var R = refDate(); f.wk = f.ym === R.slice(0, 7) ? tdMonday(R) : tdMonday(f.ym + '-01'); } else f.ym = tdAdd(f.wk, 3).slice(0, 7); render(); };
  ACTS['td-lm'] = function (a, id) {
    var f = PS.tdl, n = +id, R = refDate();
    if (f.view === 'week') { f.wk = n ? tdAdd(f.wk, 7 * n) : tdMonday(R); f.ym = tdAdd(f.wk, 3).slice(0, 7); render(); return; }
    if (!n) f.ym = R.slice(0, 7); else { var y = +f.ym.slice(0, 4), m = +f.ym.slice(5, 7) + n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } f.ym = y + '-' + p2(m); } render();
  };
  ACTS['td-lco'] = function (a, id) { PS.tdl.co = id; render(); };
  ACTS['td-lcx'] = function (a, id) { PS.tdl.cancel = !!id; render(); };
  ACTS['td-lk'] = function (a, id) {
    var R = refDate(), f = PS.tdl, ev = tdIvEvents(f).filter(function (e) { return e.v.st === 'plan'; });
    if (id === 'month') return;
    var L = id === 'today' ? ev.filter(function (e) { return e.v.date === R; }) : id === 'week' ? ev.filter(function (e) { return e.v.date >= R && tdDiff(R, e.v.date) <= 7; }) : ev.filter(function (e) { return e.v.date < R; });
    tdDayList(id === 'today' ? 'Phỏng vấn hôm nay ' + vn(R) : id === 'week' ? 'Lịch phỏng vấn 7 ngày tới' : 'Lịch đã qua giờ – chưa đánh giá', L, id === 'late');
  };
  ACTS['td-lday'] = function (a, d) { tdDayList('Lịch phỏng vấn ngày ' + vn(d), tdIvEvents(PS.tdl).filter(function (e) { return e.v.date === d; }), false); };
  function tdDayList(title, L, evalBtn) {
    var R = refDate();
    var m = modal(title, L.length + ' lịch', L.length ? '<div class="td-daylist">' + L.map(function (e) { return '<div class="td-ag">' + tdEvChip(e, R) + '<span class="muted" style="font-size:12.5px">' + vn(e.v.date) + ' · ' + esc(e.v.mode || '') + (e.v.who ? ' · ' + esc(e.v.who) : '') + '</span>' + (evalBtn || (e.v.st === 'plan' && e.v.date <= R) ? '<button class="btn btn-sm btn-primary" data-act="td-q" data-x="eval" data-i="' + e.i + '" data-u="' + e.u.id + '" data-id="' + e.c.id + '">Đánh giá</button>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted">Không có lịch.</p>', true);
    m.addEventListener('click', function (ev) { if (ev.target.closest('[data-act]')) m.close(); });
  }
  // Hẹn phỏng vấn từ lịch: chọn ứng viên rồi đặt lịch (ngày bấm sẵn)
  ACTS['td-ladd'] = function (a, d) {
    var L = tdCandAll().filter(function (x) { return (PS.tdl && PS.tdl.co ? x.u.id === PS.tdl.co : true) && (x.c.stage === 'new' || x.c.stage === 'screen' || x.c.stage === 'iv'); });
    if (!L.length) { toast('Chưa có ứng viên nào đang xét để hẹn phỏng vấn', 'info'); return; }
    var groups = {}; L.forEach(function (x) { var k = (isMulti() ? shortUnit(x.u.name) + ' · ' : '') + x.r.pos; (groups[k] = groups[k] || []).push(x); });
    var m = modal('Hẹn phỏng vấn' + (d ? ' ngày ' + vn(d) : ''), 'Chọn ứng viên', '<div class="field"><label for="tdLP">Ứng viên</label><select class="input" id="tdLP">' + Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (x) { var p = tdPlanIv(x.c); return opt(x.u.id + '|' + x.c.id, x.c.name + ' – ' + TD_STN[x.c.stage] + (p ? ' (đã hẹn ' + vn(p.v.date).slice(0, 5) + ')' : '')); }).join('') + '</optgroup>'; }).join('') + '</select></div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="tdLPo">Tiếp tục</button></div>', true);
    $('#tdLPo', m).addEventListener('click', function () { var k = $('#tdLP', m).value.split('|'), u = unitById(k[0]), c = u && tdCand(u, k[1]); m.close(); if (c) tdIvForm(u, c, null, function () { render(); }, d || null); });
  };
  ACTS['td-purge'] = function () {
    var R = refDate(), list = []; tdUnitsAll().forEach(function (u) { tdOf(u).cd.forEach(function (c) { if (tdClosedSt(c.stage) && tdKeepUntil(u, c) < R) list.push({ u: u, c: c }); }); });
    if (!list.length) return;
    confirmBox('Xóa ' + list.length + ' hồ sơ quá hạn lưu?', 'Xóa hẳn thông tin và CV của: ' + list.map(function (x) { return x.c.name; }).join(', ') + '. Không khôi phục được. Nhật ký chỉ ghi mã hồ sơ, không ghi thông tin cá nhân.', 'Xóa hồ sơ', function () {
      list.forEach(function (x) { tdDelCand(x.u, x.c, true); }); list.map(function (x) { return x.u; }).filter(function (u, i, a) { return a.indexOf(u) === i; }).forEach(function (u) { tdSave(u, 'Xóa hồ sơ quá hạn lưu: ' + list.filter(function (x) { return x.u === u; }).map(function (x) { return x.c.id; }).join(', ')); });
      render(); toast('Đã xóa ' + list.length + ' hồ sơ quá hạn lưu', 'ok');
    });
  };
  function tdDelCand(u, c, quiet) { var t = tdOf(u); if (c.cv) khoDel(c.cv).catch(function () { }); KHO.meta.filter(function (fm) { return fm.u === u.id && fm.nv === c.id && fm.kho === 'cv'; }).forEach(function (fm) { khoDel(fm.id).catch(function () { }); }); t.cd = t.cd.filter(function (x) { return x !== c; }); if (!quiet) tdSave(u, 'Xóa hồ sơ ứng viên ' + c.id); }

  /* ---------- Đọc CV (PDF / ảnh) để tự điền form Thêm ứng viên – 11/11 16:29 anh ----------
     PDF có chữ: pdf.js 3.11.174 (cdnjs, cùng bản phần mềm đang dùng) đọc lớp chữ. PDF scan / ảnh: Tesseract.js 5.1.1 (jsDelivr)
     nhận dạng chữ tiếng Việt + tiếng Anh NGAY TRÊN MÁY – file CV không gửi đi đâu; lần đầu cần mạng để tải bộ đọc (~ vài MB). */
  var TD_PDFJS_V = '3.11.174', TD_TESS_V = '5.1.1', tdTessP = null;
  function tdLoadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('Không tải được ' + src)); }; document.head.appendChild(s); }); }
  function tdPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    var b = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + TD_PDFJS_V + '/';
    return tdLoadScript(b + 'pdf.min.js').then(function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = b + 'pdf.worker.min.js'; return window.pdfjsLib; });
  }
  function tdTess(prog) {
    if (!tdTessP) tdTessP = (window.Tesseract ? Promise.resolve() : tdLoadScript('https://cdn.jsdelivr.net/npm/tesseract.js@' + TD_TESS_V + '/dist/tesseract.min.js'))
      .then(function () { return window.Tesseract.createWorker('vie+eng', 1, { logger: function (m) { if (tdTess.cb && m && m.status) tdTess.cb(m); } }); })
      .catch(function (e) { tdTessP = null; throw e; });
    tdTess.cb = prog; return tdTessP;
  }
  function tdOcr(img, prog, label) {
    return tdTess(function (m) { prog((/recogniz/i.test(m.status) ? 'Đang đọc chữ ' + label : /load|init/i.test(m.status) ? 'Đang tải bộ đọc chữ (lần đầu cần mạng)' : 'Đang chuẩn bị') + (m.progress ? ' ' + Math.round(m.progress * 100) + '%' : '')); })
      .then(function (w) { return w.recognize(img); }).then(function (r) { return (r && r.data && r.data.text) || ''; });
  }
  // Gom chữ PDF thành dòng THEO TỪNG CỘT (CV 2 cột: cột trái thông tin cá nhân, cột phải kinh nghiệm – 11/11 18:27 anh thử CV thật)
  function tdPdfLines(items, W) {
    var its = items.filter(function (it) { return it.str && it.str.trim(); }).map(function (it) { return { x: it.transform[4], y: it.transform[5], w: it.width || 0, h: it.height || Math.abs(it.transform[3]) || 0, s: it.str }; });
    // Tìm khe dọc trống giữa trang (ranh giới 2 cột): đếm số chữ phủ qua từng vị trí x
    var cut = null, n = its.length;
    if (n > 15) {
      var cov = []; for (var X = 0; X <= W; X += 2) cov.push(0);
      its.forEach(function (z) { for (var X = Math.floor(z.x / 2); X <= Math.min(cov.length - 1, Math.floor((z.x + z.w) / 2)); X++) cov[X]++; });
      var best = null, st = -1;
      for (var k = 0; k < cov.length; k++) {
        var free = cov[k] <= Math.max(1, n * 0.02);
        if (free && st < 0) st = k;
        if ((!free || k === cov.length - 1) && st >= 0) { var a = st * 2, b = k * 2; if (a > W * 0.15 && b < W * 0.85 && b - a >= 10 && (!best || b - a > best[1] - best[0])) best = [a, b]; st = -1; }
      }
      if (best) { var L = its.filter(function (z) { return z.x + z.w <= best[0] + 4; }).length, R = its.filter(function (z) { return z.x >= best[1] - 4; }).length; if (L >= 5 && R >= 5) cut = (best[0] + best[1]) / 2; }
    }
    var cols = cut == null ? [its] : [its.filter(function (z) { return z.x < cut; }), its.filter(function (z) { return z.x >= cut; })], out = [];
    cols.forEach(function (C, ci) {
      var rows = [];
      C.forEach(function (z) { var r = rows.filter(function (q) { return Math.abs(q.y - z.y) < 3.5; })[0]; if (!r) { r = { y: z.y, its: [] }; rows.push(r); } r.its.push(z); });
      rows.sort(function (a, b) { return b.y - a.y; });
      var edge = Math.max.apply(null, C.map(function (z) { return z.x + z.w; }).concat([0]));
      rows.forEach(function (r) {
        r.its.sort(function (a, b) { return a.x - b.x; });
        var s = '', end = -1e9, h = 0;
        r.its.forEach(function (z) { var gap = z.x - end; s += (s && gap > 1.5 && !/\s$/.test(s) && !/^\s/.test(z.s) ? ' ' : '') + z.s; end = Math.max(end, z.x + z.w); if (z.s.trim()) h = Math.max(h, z.h); });
        s = s.replace(/[\uE000-\uF8FF\u2022\u25CF\u25AA\u25A0\u2023\u2043\u2219]/g, ' ').replace(/\s+/g, ' ').trim(); if (s) out.push({ s: s, h: h, col: ci, x: r.its[0].x, end: end, edge: edge, y: r.y });
      });
    });
    return out;
  }
  function tdReadCv(file, prog) {
    var isPdf = /pdf/i.test(file.type) || /\.pdf$/i.test(file.name);
    if (!isPdf) return tdOcr(file, prog, 'trong ảnh').then(function (t) { return { text: t, how: 'đọc chữ trong ảnh' }; });
    prog('Đang mở file PDF');
    return file.arrayBuffer().then(function (buf) { return tdPdfjs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(buf) }).promise; }); }).then(function (pdf) {
      var n = Math.min(pdf.numPages, 3), pages = [], p = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (k) { p = p.then(function () { return pdf.getPage(k); }).then(function (pg) { pages.push(pg); return pg.getTextContent().then(function (tc) { pg.lines = tdPdfLines(tc.items, pg.getViewport({ scale: 1 }).width); pg.lines.forEach(function (l) { l.pg = k; }); }); }); })(i);
      return p.then(function () {
        var lines = [].concat.apply([], pages.map(function (pg) { return pg.lines || []; })), txt = lines.map(function (l) { return l.s; }).join('\n');
        if (txt.replace(/\s/g, '').length >= 60) return { text: txt, lines: lines, how: 'lớp chữ PDF' + (lines.some(function (l) { return l.col; }) ? ', bố cục 2 cột' : '') };
        // PDF scan: vẽ trang ra ảnh rồi đọc chữ
        var out = [], q = Promise.resolve();
        pages.slice(0, 2).forEach(function (pg, ix) { q = q.then(function () { var vp = pg.getViewport({ scale: 2 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () { return tdOcr(cv, prog, 'trang ' + (ix + 1)); }).then(function (t) { out.push(t); }); }); });
        return q.then(function () { return { text: out.join('\n'), how: 'đọc chữ trên ảnh trang PDF' }; });
      });
    });
  }
  function tdTitle(s) { return String(s || '').toLowerCase().replace(/(^|\s)(\S)/g, function (z, a, b) { return a + b.toUpperCase(); }); }
  var TD_MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  // Nhận diện trường thông tin từ chữ đọc được (lines: dòng kèm cỡ chữ/cột khi đọc từ PDF có chữ)
  function tdParseCv(text, lines) {
    var T = String(text || '').replace(/\r/g, ''), LN = lines && lines.length ? lines : T.split('\n').map(function (l) { return { s: l }; });
    LN = LN.map(function (l) { return Object.assign({}, l, { s: String(l.s).replace(/[\uE000-\uF8FF]/g, ' ').replace(/^[\s•●▪■◆►✓✔☎✉📞📧🏠\-–:|]+/, '').replace(/\s+/g, ' ').trim() }); }).filter(function (l) { return l.s; });
    var L = LN.map(function (l) { return l.s; }), o = {};
    var em = T.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/); if (em) o.email = em[0].replace(/[.,;]+$/, '');
    var phs = T.match(/(\+84|\(\+84\)|0)[\s.\-]?\d{2,3}[\s.\-]?\d{3}[\s.\-]?\d{3,4}/g) || [];
    for (var i = 0; i < phs.length; i++) { var p = phs[i].replace(/[^\d+]/g, '').replace(/^\+?84/, '0'); if (/^0\d{9}$/.test(p)) { o.phone = p; break; } }
    // Họ tên: có nhãn → lấy theo nhãn; không → dòng chữ CỠ LỚN NHẤT trông như tên người; ảnh/scan → dòng đầu trông như tên
    var BAD = /(curriculum|vitae|resume|h[ồo]\s*s[ơo]|th[ôo]ng\s*tin|m[ụu]c\s*ti[êe]u|kinh\s*nghi[ệe]m|h[ọo]c\s*v[ấa]n|k[ỹy]\s*n[ăa]ng|li[êe]n\s*h[ệe]|s[ởo]\s*th[íi]ch|profile|contact|objective|education|skills|experience|interests|summary|reference|certificat|project|activit|[đd][ịi]a\s*ch[ỉi]|email|phone|[đd]i[ệe]n\s*tho[ạa]i|ng[àa]y\s*sinh|c[ôo]ng\s*ty|jsc|ltd|company|\d|@|www|http)/i;
    function nameLike(s) { var l = s.replace(/^[^A-Za-zÀ-ỹĐđ]+|[^A-Za-zÀ-ỹĐđ]+$/g, ''), w = l.split(' '); return w.length >= 2 && w.length <= 5 && !BAD.test(l) && w.every(function (x) { return /^[A-ZÀ-ỸĐ][a-zà-ỹđ]*$/.test(x) || /^[A-ZÀ-ỸĐ]+$/.test(x); }) ? l : ''; }
    var lab = T.match(/(?:h[ọo]\s*(?:v[àa]\s*)?t[êe]n|full\s*name|name)\s*[:\-–]\s*([^\n|•]{3,50})/i);
    if (lab && nameLike(lab[1].replace(/\s*[-–|,].*$/, '').trim())) o.name = lab[1].replace(/\s*[-–|,].*$/, '').trim();
    if (!o.name && LN.some(function (l) { return l.h; })) {
      var cand = LN.filter(function (l) { return l.pg === 1 && nameLike(l.s); }).sort(function (a, b) { return b.h - a.h || b.y - a.y; })[0]; if (cand) o.name = nameLike(cand.s);
    }
    if (!o.name) for (var j = 0; j < Math.min(L.length, 12); j++) { var nl = nameLike(L[j]); if (nl) { o.name = nl; break; } }
    if (o.name) o.name = tdTitle(o.name);
    // Năm sinh: có nhãn; hoặc ngày đứng riêng 1 dòng (26/05/1993, May 26, 1993, 26 May 1993) – năm hợp lệ 1950–2012
    var yOk = function (y) { y = +y; return y >= 1950 && y <= 2012 ? y : 0; };
    var dob = T.match(/(?:ng[àa]y\s*sinh|n[ăa]m\s*sinh|sinh\s*ng[àa]y|date\s*of\s*birth|d\.?o\.?b|birthday|birth)[^\d\n]{0,25}(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]((?:19|20)\d{2})|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+((?:19|20)\d{2})|\d{1,2}\s+[A-Za-z]{3,9}\.?,?\s+((?:19|20)\d{2})|((?:19|20)\d{2}))/i);
    if (dob) o.yob = yOk(dob[1] || dob[2] || dob[3] || dob[4]) || undefined;
    if (!o.yob) for (var d = 0; d < L.length && !o.yob; d++) {
      var s = L[d], m1;
      if (s.length > 22) continue;
      if ((m1 = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-]((?:19|20)\d{2})$/))) o.yob = yOk(m1[3]);
      else if ((m1 = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+((?:19|20)\d{2})$/)) && TD_MON[m1[1].slice(0, 3).toLowerCase()]) o.yob = yOk(m1[3]);
      else if ((m1 = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+((?:19|20)\d{2})$/)) && TD_MON[m1[2].slice(0, 3).toLowerCase()]) o.yob = yOk(m1[3]);
      if (!o.yob) delete o.yob;
    }
    var edu = [['Tiến sĩ', /ti[ếe]n\s*s[ĩi]|ph\.?\s?d\b|doctor/i], ['Thạc sĩ', /th[ạa]c\s*s[ĩi]|master|\bmba\b/i], ['Đại học', /[đd][ạa]i\s*h[ọo]c|h[ọo]c\s*vi[ệe]n|c[ửu]\s*nh[âa]n|k[ỹy]\s*s[ưu]|bachelor|university|academy|\bgpa\b/i], ['Cao đẳng', /cao\s*[đd][ẳa]ng|college/i], ['Trung cấp', /trung\s*c[ấa]p/i]];
    for (var k = 0; k < edu.length; k++) if (edu[k][1].test(T)) { o.edu = edu[k][0]; break; }
    // Kinh nghiệm: số năm ghi rõ; nếu không có → tính từ mốc bắt đầu sớm nhất trong mục Kinh nghiệm làm việc
    var yrs = T.match(/(\d{1,2})\s*\+?\s*(?:năm|nam)\s*kinh\s*nghi[ệe]m/i) || T.match(/(\d{1,2})\s*\+?\s*years?\s*(?:of\s*)?experience/i);
    var exH = -1; L.forEach(function (l, ix) { if (exH < 0 && /^(kinh\s*nghi[ệe]m(\s*l[àa]m\s*vi[ệe]c)?|qu[áa]\s*tr[ìi]nh\s*(l[àa]m\s*vi[ệe]c|c[ôo]ng\s*t[áa]c)|(work(ing)?|professional|employment)\s*(experience|history)|experience)\s*:?$/i.test(l)) exH = ix; });
    var exL = '', yTxt = '';
    if (exH >= 0) {
      var sec = L.slice(exH + 1, exH + 60), stop = sec.findIndex(function (l) { return /^(h[ọo]c\s*v[ấa]n|education|k[ỹy]\s*n[ăa]ng|skills|s[ởo]\s*th[íi]ch|interests|objective|m[ụu]c\s*ti[êe]u|ch[ứu]ng\s*ch[ỉi]|certificat\w*|references?|ng[ưu][ờo]i\s*tham\s*chi[ếe]u)\s*:?$/i.test(l); });
      if (stop >= 0) sec = sec.slice(0, stop);
      exL = sec.filter(function (l) { return !/^[-+•]/.test(l); }).slice(0, 2).join(' · ');
      if (!yrs) {
        var st0 = 9999, now = new Date().getFullYear();
        sec.join('\n').replace(/(?:\b\d{1,2}[\/.\-]|\b[A-Za-z]{3,9}\.?\s+|\bth[áa]ng\s*\d{1,2}[\/.\-]?\s*)?((?:19|20)\d{2})\s*[-–—~]\s*(?:\d{1,2}[\/.\-]|[A-Za-z]{3,9}\.?\s+|th[áa]ng\s*\d{1,2}[\/.\-]?\s*)?((?:19|20)\d{2}|now|present|current|nay|hi[ệe]n\s*(?:t[ạa]i|nay))/gi, function (z, a) { if (+a >= 1970 && +a <= now) st0 = Math.min(st0, +a); return z; });
        if (st0 < 9999 && now - st0 > 0) yTxt = '~' + (now - st0) + ' năm kinh nghiệm (đi làm từ ' + st0 + ')';
      }
    }
    if (yrs) yTxt = yrs[1] + ' năm kinh nghiệm';
    o.exp = (yTxt && exL.toLowerCase().indexOf(yTxt.replace(/^~/, '').split(' (')[0]) >= 0 ? exL : [yTxt, exL].filter(Boolean).join(' – ')).slice(0, 200);
    // Link hồ sơ: nối phần link bị xuống dòng (link dài chạm mép cột, dòng sau chỉ là 1 cụm liền không dấu cách)
    var lk = null;
    for (var q = 0; q < LN.length && !lk; q++) {
      var mm = LN[q].s.match(/(https?:\/\/[^\s]+|(?:www\.)?(?:linkedin|facebook|github|behance|tiktok|youtube)\.com\/[^\s]+|(?:www\.)?fb\.com\/[^\s]+)/i); if (!mm) continue;
      lk = mm[0]; var cur = LN[q], nx = LN[q + 1];
      if (nx && /^[A-Za-z0-9._~\/\-?=&%#@+]+$/.test(nx.s) && !/@.+\./.test(nx.s) && LN[q].s.slice(-lk.length) === lk && (cur.edge == null || (nx.col === cur.col && cur.end >= cur.edge - 25)) && (cur.y == null || Math.abs(cur.y - nx.y) < 30)) lk += nx.s;
    }
    if (lk) o.link = (/^http/i.test(lk) ? lk : 'https://' + lk).replace(/[.,;)]+$/, '');
    return o;
  }
  // ---- Thêm / sửa ứng viên ----
  function tdCandForm(u, c, after) {
    var CVF = null, isNew = !c, us = selUnits(), x = c || { name: '', phone: '', email: '', yob: '', edu: '', exp: '', src: TD_SRC[1], at: HR.isoToday(), rq: '', link: '', consent: null };
    function body(u) {
      var rqs = tdOf(u).rq.filter(function (r) { return r.st !== 'closed' || r.id === x.rq; });
      return '<div class="td-form">' + (isNew ? tdUnitPick(us, u.id) + '<div class="td-cvbar" id="cCvBar"><button type="button" class="btn btn-primary" id="cCvB">' + ic('files', 16) + (CVF ? 'Đổi file CV' : 'Tải CV lên để tự điền') + '</button><div><b>' + (CVF ? esc(CVF.name) + ' · ' + kbSize(CVF.size) : 'Kéo thả hoặc chọn file CV (PDF hoặc ảnh, tối đa 5 MB)') + '</b><span class="faint">Phần mềm đọc chữ ngay trên máy này rồi điền họ tên, số điện thoại, email, năm sinh, trình độ, kinh nghiệm – kiểm tra lại trước khi lưu. File CV được lưu kèm hồ sơ. Lần đầu đọc ảnh / PDF scan cần mạng để tải bộ đọc chữ.</span></div><input type="file" id="cCv" accept=".pdf,image/*" hidden></div><div id="cCvRes"></div>' : '') + '<div class="td-g2">' +
        selectBox('cRq', 'Vị trí ứng tuyển *', [['', '— Chọn vị trí —']].concat(rqs.map(function (r) { return [r.id, r.pos + ' (' + TD_RST[r.st].toLowerCase() + ')']; })), x.rq || (PS.tdu && PS.tdu.rqs && PS.tdu.rqs[0] && PS.tdu.rqs[0].split('|')[0] === u.id ? PS.tdu.rqs[0].split('|')[1] : '')) +
        field('cName', 'Họ và tên *', x.name) + field('cPhone', 'Số điện thoại *', x.phone ? tdPhoneFmt(x.phone) : '', ' inputmode="tel"') + field('cEmail', 'Email', x.email) +
        field('cYob', 'Năm sinh', x.yob || '', ' inputmode="numeric" placeholder="Không bắt buộc"') + field('cEdu', 'Trình độ', x.edu || '', ' placeholder="Đại học, Cao đẳng…"') +
        selectBox('cSrc', 'Nguồn hồ sơ', TD_SRC.map(function (s) { return [s, s]; }), x.src) + dbox('cAt', x.at, 'Ngày nhận hồ sơ') +
        '<div class="field" style="grid-column:1/-1"><label for="cExp">Kinh nghiệm, ghi chú ngắn</label><input class="input" id="cExp" value="' + esc(x.exp || '') + '"></div>' +
        '<div class="field" style="grid-column:1/-1"><label for="cLink">Link hồ sơ (nếu có)</label><input class="input" id="cLink" value="' + esc(x.link || '') + '" placeholder="Link Google Drive, LinkedIn…"></div></div>' +
        '<label class="td-chk" style="margin-top:12px"><input type="checkbox" id="cCons"' + (x.consent ? ' checked' : '') + '> Ứng viên đã đồng ý cho công ty xử lý dữ liệu cá nhân để tuyển dụng <span class="muted">(ví dụ: tích ô đồng ý trên form, ghi trong email gửi hồ sơ)</span></label>' +
        '<div class="field" style="margin-top:6px"><label for="cConsHow">Cách ghi nhận đồng ý</label><input class="input" id="cConsHow" value="' + esc(x.consent ? x.consent.how || '' : '') + '" placeholder="Ví dụ: Ứng viên đồng ý trong email gửi hồ sơ ngày …"></div></div>';
    }
    var m = modal(isNew ? 'Thêm ứng viên' : 'Sửa thông tin ' + c.name, isNew ? 'Hồ sơ nhận qua fanpage, nhóm Zalo, email, người giới thiệu… Trường có dấu * là bắt buộc.' : c.id, '<div id="cBody">' + body(u) + '</div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="cSave">' + (isNew ? 'Thêm ứng viên' : 'Lưu') + '</button></div>');
    m.querySelector('.modal').classList.add('lg');
    function bind() {
      $$('.dbox', m).forEach(bindDbox); var up = $('#tdU', m); if (up) up.addEventListener('change', function () { u = unitById(up.value); $('#cBody', m).innerHTML = body(u); bind(); });
      var bar = $('#cCvBar', m); if (!bar) return;
      $('#cCvB', m).addEventListener('click', function () { $('#cCv', m).click(); });
      $('#cCv', m).addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) takeCv(f); });
      bar.addEventListener('dragover', function (e) { e.preventDefault(); bar.classList.add('over'); });
      bar.addEventListener('dragleave', function () { bar.classList.remove('over'); });
      bar.addEventListener('drop', function (e) { e.preventDefault(); bar.classList.remove('over'); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeCv(f); });
    }
    // Nhận file CV → đọc chữ → điền các ô còn trống (ô đã có chữ giữ nguyên)
    function takeCv(f) {
      if (!(/^image\/|application\/pdf/.test(f.type) || /\.(pdf|jpe?g|png|webp)$/i.test(f.name)) || f.size > TD_CV_MAX) { toast('CV cần là file PDF hoặc ảnh, tối đa 5 MB', 'err', 'File Word: mở bằng Word → Lưu thành PDF.'); return; }
      CVF = f; var bar = $('#cCvBar', m); bar.querySelector('b').textContent = f.name + ' · ' + kbSize(f.size); $('#cCvB', m).lastChild.textContent = 'Đổi file CV';
      var res = $('#cCvRes', m), prog = function (t) { res.innerHTML = '<div class="notice td-cvprog"><span class="td-spin"></span><div>' + esc(t) + '…</div></div>'; };
      prog('Đang đọc CV');
      tdReadCv(f, prog).then(function (r) {
        if (CVF !== f) return;
        var o = tdParseCv(r.text, r.lines), done = [], kept = [];
        function set(id, v, lab) { var el = $('#' + id, m); if (!el || v === '' || v == null) return; if (el.value.trim() && !el.classList.contains('qr-fill')) { if (el.value.trim() !== String(v)) kept.push(lab); return; } el.value = v; el.classList.add('qr-fill'); done.push(lab); }
        set('cName', o.name, 'Họ và tên'); set('cPhone', o.phone ? tdPhoneFmt(o.phone) : '', 'Số điện thoại'); set('cEmail', o.email, 'Email'); set('cYob', o.yob, 'Năm sinh'); set('cEdu', o.edu, 'Trình độ'); set('cExp', o.exp, 'Kinh nghiệm'); set('cLink', o.link, 'Link hồ sơ');
        var miss = [['Họ và tên', o.name], ['Số điện thoại', o.phone], ['Email', o.email]].filter(function (z) { return !z[1]; }).map(function (z) { return z[0]; });
        res.innerHTML = '<div class="notice' + (done.length ? '' : ' warn') + '">' + ic(done.length ? 'check' : 'info') + '<div>' + (done.length ? 'Đã điền từ CV (' + esc(r.how) + '): <b>' + esc(done.join(', ')) + '</b>. Ô tô xanh là ô tự điền – kiểm tra lại, nhất là tên có dấu.' : 'Chưa nhận ra thông tin nào trong CV – nhập tay giúp em.') + (miss.length ? '<br><span class="muted">Chưa tìm thấy: ' + esc(miss.join(', ')) + '.</span>' : '') + (kept.length ? '<br><span class="muted">Giữ nguyên ô anh/chị đã nhập: ' + esc(kept.join(', ')) + '.</span>' : '') + '<details class="td-cvtxt"><summary>Xem chữ đọc được</summary><pre>' + esc(r.text.slice(0, 3000)) + '</pre></details></div></div>';
        log('Đọc CV ' + f.name + ' (' + r.how + '): điền ' + done.join(', '));
      }).catch(function (e) {
        logErr('Đọc CV', e); try { console.warn('[QLNS] Đọc CV chưa được:', e && (e.message || e)); } catch (x) { }
        res.innerHTML = '<div class="notice warn">' + ic('info') + '<div>Chưa đọc được CV tự động' + (/tải được|Failed to fetch|NetworkError/i.test(String(e && e.message)) ? ' – máy đang không có mạng để tải bộ đọc chữ' : '') + '. File CV vẫn được lưu kèm hồ sơ; nhập các ô bằng tay giúp em.</div></div>';
      });
    }
    bind();
    $('#cSave', m).addEventListener('click', function () {
      var v = function (k) { var el = $('#' + k, m); return el ? el.value.trim() : ''; };
      var bad = function (k, t, s) { var el = $('#' + k, m); if (el) { el.classList.add('bad'); el.focus(); el.addEventListener('input', function () { el.classList.remove('bad'); }, { once: true }); } toast(t, 'err', s || ''); };
      if (!v('cRq')) return bad('cRq', 'Chưa chọn vị trí ứng tuyển');
      var name = v('cName').replace(/\s+/g, ' ').replace(/(^|\s)(\S)/g, function (z, a, b) { return a + b.toUpperCase(); }); if (!name) return bad('cName', 'Chưa có họ và tên');
      var ph = tdPhone(v('cPhone')); if (!/^0\d{9}$/.test(ph)) return bad('cPhone', 'Số điện thoại cần 10 số, bắt đầu bằng 0');
      var em = v('cEmail'); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return bad('cEmail', 'Email chưa đúng');
      var yb = v('cYob'); if (yb && !/^(19|20)\d{2}$/.test(yb)) return bad('cYob', 'Năm sinh gồm 4 số, ví dụ 1998');
      var at = $('#cAt', m)._get(); if (!at) return bad('cAt-d', 'Ngày nhận hồ sơ chưa đúng', 'Nhập dd/mm/yyyy.');
      var file = isNew ? CVF : null;
      if (file && (!(/^image\/|application\/pdf/.test(file.type) || /\.(pdf|jpe?g|png|webp)$/i.test(file.name)) || file.size > TD_CV_MAX)) return bad('cCv', 'CV cần là file PDF hoặc ảnh, tối đa 5 MB', 'File Word: mở bằng Word → Lưu thành PDF.');
      var t = tdOf(u), o = c || { id: tdNext(t.cd, 'UV', 4), stage: 'new', ivs: [], letters: [], hist: [], note: '' };
      var cons = $('#cCons', m).checked ? { at: (o.consent && o.consent.at) || tdNow(), ver: 'nhap-tay', how: v('cConsHow') || 'Người quản trị ghi nhận ứng viên đã đồng ý' } : null;
      Object.assign(o, { rq: v('cRq'), name: name, phone: ph, email: em, yob: yb ? +yb : '', edu: v('cEdu'), src: v('cSrc'), at: at, exp: v('cExp'), link: v('cLink'), consent: cons });
      if (isNew) { tdHist(o, 'Thêm hồ sơ – nguồn: ' + o.src); t.cd.push(o); } else tdHist(o, 'Sửa thông tin ứng viên');
      var p = Promise.resolve();
      if (file) { var fid = khoId(); o.cv = fid; o.cvName = file.name; p = khoPut({ id: fid, u: u.id, nv: o.id, kho: 'cv', ref: 'CV', name: file.name, type: file.type || 'application/pdf', size: file.size, at: tdNow().replace(' ', 'T'), blob: file }); }
      p.then(function () {
        tdSave(u, (isNew ? 'Thêm ứng viên ' : 'Sửa ứng viên ') + o.id); m.close(); render();
        var dup = tdDup(u, o), ex = tdExNv(u, o);
        toast(isNew ? 'Đã thêm ' + name : 'Đã lưu', dup.length || ex || !cons ? 'info' : 'ok', [dup.length ? 'Trùng số điện thoại/email với ' + dup.map(function (z) { return z.id; }).join(', ') + '.' : '', ex ? 'Từng là nhân sự ' + ex['Mã NV'] + '.' : '', !cons ? 'Chưa ghi nhận ứng viên đồng ý xử lý dữ liệu.' : ''].join(' ').trim());
        if (after) after(o); else if (isNew) tdCandOpen(u, o.id);
      }).catch(function (e) { showErr('Chưa lưu được CV', e); });
    });
  }

  // ---- Hồ sơ ứng viên (cửa sổ chi tiết) ----
  function tdCandOpen(u, id) {
    var m = modal('', '', '<div id="tdCB"></div>'); m.querySelector('.modal').classList.add('lg'); m.classList.add('td-cmodal');
    function draw() {
      var c = tdCand(u, id); if (!c) { m.close(); return; }
      var r = tdReq(u, c.rq) || { pos: '(phiếu đã xóa)', pb: '' }, R = refDate();
      m.querySelector('.modal-head h2').textContent = c.name; var sub = m.querySelector('.modal-head p'); if (!sub) { sub = document.createElement('p'); m.querySelector('.modal-head div').appendChild(sub); }
      sub.textContent = c.id + ' · ' + r.pos + (isMulti() ? ' · ' + shortUnit(u.name) : '') + ' · nộp ' + vn(c.at);
      var idx = TD_LIVE.indexOf(c.stage);
      var steps = '<div class="td-steps">' + TD_LIVE.map(function (s, i) { return '<button class="' + (c.stage === s ? 'on' : idx > i ? 'done' : '') + '" data-st="' + s + '">' + (idx > i ? '✓ ' : '') + TD_STN[s] + '</button>'; }).join('') + '<span class="gap"></span>' + ['ivcancel', 'fail', 'withdraw'].map(function (s) { return '<button class="end' + (c.stage === s ? ' on' : '') + '" data-st="' + s + '">' + TD_STN[s] + '</button>'; }).join('') + '</div>';
      var warns = [], dup = tdDup(u, c), ex = tdExNv(u, c);
      if (dup.length) warns.push('<div class="notice warn">' + ic('info') + '<div>Nộp trùng: cùng số điện thoại/email với ' + dup.map(function (z) { return '<a href="#" data-cj="' + z.id + '">' + esc(z.id) + ' – ' + esc((tdReq(u, z.rq) || {}).pos || '') + ' (' + TD_STN[z.stage].toLowerCase() + ')</a>'; }).join(', ') + '. Xem lại trước khi liên hệ để không gọi 2 lần.</div></div>');
      if (ex) warns.push('<div class="notice">' + ic('info') + '<div>Từng là nhân sự của công ty: <b>' + esc(ex['Mã NV']) + ' ' + esc(ex['Họ và tên']) + '</b> – ' + esc(ex['Chức danh công việc'] || '') + (ex['Ngày nghỉ việc'] ? ', nghỉ ' + vn(ex['Ngày nghỉ việc']) : '') + '. <a href="#" data-act="profile" data-u="' + u.id + '" data-id="' + esc(ex['Mã NV']) + '">Mở hồ sơ cũ</a></div></div>');
      if (!c.consent) warns.push('<div class="notice warn">' + ic('info') + '<div>Chưa ghi nhận ứng viên đồng ý cho xử lý dữ liệu cá nhân. Hỏi ứng viên (ví dụ trong thư mời phỏng vấn) rồi tích ở “Sửa thông tin”.</div></div>');
      var cvs = KHO.meta.filter(function (fm) { return fm.u === u.id && fm.nv === c.id && fm.kho === 'cv'; });
      var info = '<div class="td-sec"><h3>' + ic('td_user', 16) + 'Thông tin ứng viên<span class="sp"></span><button class="btn btn-sm" data-x="edit">' + ic('td_edit', 14) + 'Sửa</button></h3><dl class="td-kv">' +
        '<dt>Điện thoại</dt><dd><a href="tel:' + esc(c.phone) + '">' + esc(tdPhoneFmt(c.phone)) + '</a></dd><dt>Email</dt><dd>' + (c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : '<span class="muted">—</span>') + '</dd>' +
        (c.yob ? '<dt>Năm sinh</dt><dd>' + esc(c.yob) + '</dd>' : '') + (c.edu ? '<dt>Trình độ</dt><dd>' + esc(c.edu) + '</dd>' : '') + (c.exp ? '<dt>Kinh nghiệm</dt><dd>' + esc(c.exp) + '</dd>' : '') +
        '<dt>Nguồn</dt><dd>' + esc(c.src || '') + '</dd><dt>Đồng ý dữ liệu</dt><dd>' + (c.consent ? 'Có – ' + esc(tdVnAt(c.consent.at)) + '<br><small class="muted">' + esc(c.consent.how || '') + '</small>' : '<span class="miss">Chưa ghi nhận</span>') + '</dd>' +
        '<dt>CV</dt><dd>' + (cvs.length ? cvs.map(function (fm, i) { return '<a href="#" data-cv="' + i + '">' + ic('pdf', 14) + ' ' + esc(fm.name) + '</a> <small class="muted">' + kbSize(fm.size || 0) + '</small>'; }).join('<br>') : '<span class="muted">Chưa có</span>') + ' <button class="btn btn-sm" data-x="cvup" style="margin-left:4px">Tải CV lên</button><input type="file" id="tdCvF" accept=".pdf,image/*" hidden></dd>' +
        (c.link ? '<dt>Link hồ sơ</dt><dd><a href="' + esc(c.link) + '" target="_blank" rel="noopener">' + esc(c.link) + '</a></dd>' : '') + '<dt>Hạn lưu hồ sơ</dt><dd>' + (tdClosedSt(c.stage) ? vn(tdKeepUntil(u, c)) + (tdKeepUntil(u, c) < R ? ' <span class="tag tag-warn">đã quá hạn</span>' : '') : '<span class="muted">Tính từ khi có kết quả (' + (tdOf(u).cfg.keep || 6) + ' tháng)</span>') + '</dd></dl>' +
        '<div class="field" style="margin-top:12px"><label for="tdNote">Ghi chú nội bộ</label><textarea class="input" id="tdNote" style="min-height:64px;width:100%">' + esc(c.note || '') + '</textarea></div></div>';
      var ivH = (c.ivs || []).map(function (v, i) {
        var sc = tdScore(v), crit = tdOf(u).cfg.crit || TD_CRIT0;
        return '<div class="td-ivr"><div class="td-ivr-h"><b>Vòng ' + (i + 1) + ' · ' + vn(v.date) + ' ' + esc(v.time || '') + '</b>' + (v.st === 'plan' ? '<span class="tag ' + (v.date === R ? 'tag-warn' : v.date < R ? 'tag-bad' : 'tag-info') + '">' + (v.date === R ? 'Hôm nay' : v.date < R ? 'Đã qua – chưa đánh giá' : 'Đã hẹn') + '</span>' : v.st === 'cancel' ? '<span class="tag tag-mute">Đã hủy</span>' : '<span class="tag ' + (v.res === 'pass' ? 'tag-ok' : v.res === 'fail' ? 'tag-bad' : 'tag-warn') + '">' + (v.res === 'pass' ? 'Đạt' : v.res === 'fail' ? 'Chưa đạt' : 'Cân nhắc') + (sc !== null ? ' · ★ ' + String(sc).replace('.', ',') : '') + '</span>') + '</div>' +
          '<small class="muted">' + esc(v.mode || '') + (v.place ? ' · ' + esc(v.place) : '') + (v.who ? ' · ' + esc(v.who) : '') + '</small>' +
          (v.st === 'done' && sc !== null ? '<div class="td-score">' + Object.keys(v.score).map(function (k) { return '<span>' + esc(crit[k] || 'Tiêu chí ' + (+k + 1)) + ': <i>' + v.score[k] + '</i></span>'; }).join('') + '</div>' : '') + (v.note ? '<div>' + esc(v.note) + '</div>' : '') +
          '<div class="link-row" style="margin:0">' + (v.st !== 'cancel' ? '<button class="btn btn-sm' + (v.st === 'plan' && v.date <= R ? ' btn-primary' : '') + '" data-iv="' + i + '" data-x="eval">' + (v.st === 'done' ? 'Sửa kết quả' : 'Ghi kết quả') + '</button>' : '') + (v.st === 'plan' ? '<button class="btn btn-sm" data-iv="' + i + '" data-x="ivedit">Đổi lịch</button><button class="btn btn-sm" data-iv="' + i + '" data-x="ivcancel">Hủy lịch</button>' : '') + '</div></div>';
      }).join('');
      var iv = '<div class="td-sec"><h3>' + ic('td_cal', 16) + 'Phỏng vấn & đánh giá<span class="sp"></span><button class="btn btn-sm btn-primary" data-x="ivnew">' + ic('td_plus', 14) + 'Hẹn phỏng vấn</button></h3>' + (ivH || '<p class="muted" style="margin:0">Chưa có lịch phỏng vấn.</p>') + '</div>';
      var o = c.offer, off = '<div class="td-sec"><h3>' + ic('tdmoi', 16) + 'Mời nhận việc<span class="sp"></span><button class="btn btn-sm' + (o ? '' : ' btn-primary') + '" data-x="offer">' + (o ? 'Sửa điều kiện' : 'Lập điều kiện mời') + '</button></h3>' +
        (o ? '<dl class="td-off"><div><dt>Lương chính thức</dt><dd>' + tdMoney(o.sal) + ' đ</dd></div><div><dt>Lương thử việc</dt><dd>' + (o.probKind === 'none' ? 'Không thử việc' : tdMoney(o.probSal) + ' đ · ' + o.probDays + ' ' + ((TD_PROB.filter(function (p) { return p[0] === o.probKind; })[0] || [])[3] || 'ngày')) + '</dd></div><div><dt>Ngày đi làm</dt><dd>' + vn(o.start) + '</dd></div><div><dt>Hạn trả lời</dt><dd>' + (o.replyBy ? vn(o.replyBy) : '—') + '</dd></div><div style="grid-column:1/-1"><dt>Hình thức</dt><dd>' + esc(o.hd || '') + '</dd></div></dl>' +
          '<div class="link-row" style="margin:8px 0 0;align-items:center"><span>Trả lời: <b>' + (o.ans === 'yes' ? 'Đồng ý nhận việc' : o.ans === 'no' ? 'Từ chối' : 'Chưa trả lời') + '</b>' + (o.ansAt ? ' <small class="muted">(' + tdVnAt(o.ansAt) + ')</small>' : '') + '</span><span class="sp" style="flex:1"></span>' + (o.ans !== 'yes' ? '<button class="btn btn-sm" data-x="ansyes">Đồng ý</button>' : '') + (o.ans !== 'no' ? '<button class="btn btn-sm" data-x="ansno">Từ chối</button>' : '') + '</div>' : '<p class="muted" style="margin:0">Khi ứng viên đạt phỏng vấn: lập điều kiện mời (lương, thử việc, ngày đi làm) rồi gửi Thư mời nhận việc.</p>') + '</div>';
      var lts = (c.letters || []).slice().reverse();
      var ltH = '<div class="td-sec"><h3>' + ic('td_mail', 16) + 'Thư gửi ứng viên</h3>' + (lts.length ? '<div class="td-lt">' + lts.map(function (l) { return '<div class="td-lt-i">' + ic('check') + '<span>' + TD_LT[l.t] + ' – ' + tdVnAt(l.at) + (l.ch ? ' · ' + esc(l.ch) : '') + '</span></div>'; }).join('') + '</div>' : '<p class="muted" style="margin:0">Chưa gửi thư nào.</p>') +
        '<div class="td-lbtn"><button class="btn btn-sm" data-lt="pv">' + ic('td_mail', 14) + 'Thư mời phỏng vấn</button><button class="btn btn-sm" data-lt="nv">' + ic('td_mail', 14) + 'Thư mời nhận việc</button><button class="btn btn-sm" data-lt="tc">' + ic('td_mail', 14) + 'Thư cảm ơn, chưa trúng tuyển</button></div></div>';
      var hist = '<div class="td-sec"><h3>Lịch sử</h3><ul class="td-hist">' + (c.hist || []).map(function (h) { return '<li><span>' + tdVnAt(h.at) + '</span>' + esc(h.txt) + '</li>'; }).join('') + '</ul></div>';
      var nvBtn = c.nvId ? '<span class="link-row" style="margin:0"><span class="tag tag-ok">Đã là nhân sự ' + esc(c.nvId) + '</span><button class="btn" data-act="profile" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Mở hồ sơ nhân sự</button><button class="btn" data-act="hd-new" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Lập hợp đồng</button></span>' : '<button class="btn ' + (c.stage === 'hired' ? 'btn-primary' : '') + '" data-x="tonv">' + ic('td_arrow', 15) + 'Chuyển thành nhân sự</button>';
      $('#tdCB', m).innerHTML = steps + (warns.length ? '<div class="td-warn">' + warns.join('') + '</div>' : '') + '<div class="td-cm"><div>' + info + hist + '</div><div>' + iv + off + ltH + '</div></div>' +
        '<div class="link-row nv-foot" style="margin-top:16px"><span class="link-row" style="margin:0"><button class="btn btn-danger-ghost" data-x="del">' + ic('td_trash', 15) + 'Xóa hồ sơ</button><button class="btn" data-x="star">' + (c.starred ? '★ Bỏ đánh dấu' : '☆ Đánh dấu nổi bật') + '</button></span>' + nvBtn + '</div>';
      var nt = $('#tdNote', m); nt.addEventListener('change', function () { c.note = nt.value; tdSave(u); });
      var cf = $('#tdCvF', m); cf.addEventListener('change', function () { var file = cf.files && cf.files[0]; cf.value = ''; if (!file) return; if (!(/^image\/|application\/pdf/.test(file.type) || /\.(pdf|jpe?g|png|webp)$/i.test(file.name)) || file.size > TD_CV_MAX) { toast('CV cần là file PDF hoặc ảnh, tối đa 5 MB', 'err'); return; } var fid = khoId(); khoPut({ id: fid, u: u.id, nv: c.id, kho: 'cv', ref: 'CV', name: file.name, type: file.type || 'application/pdf', size: file.size, at: tdNow().replace(' ', 'T'), blob: file }).then(function () { c.cv = fid; c.cvName = file.name; tdHist(c, 'Tải CV lên: ' + file.name); tdSave(u); draw(); toast('Đã lưu CV', 'ok'); }).catch(function (e) { showErr('Chưa lưu được CV', e); }); });
    }
    m.addEventListener('click', function (e) {
      var c = tdCand(u, id); if (!c) return;
      var st = e.target.closest('[data-st]'); if (st) { tdSetStage(u, c, st.getAttribute('data-st'), draw); return; }
      var cj = e.target.closest('[data-cj]'); if (cj) { e.preventDefault(); m.close(); tdCandOpen(u, cj.getAttribute('data-cj')); return; }
      if (e.target.closest('[data-act="profile"],[data-act="hd-new"]')) { m.close(); return; }
      var cv = e.target.closest('[data-cv]'); if (cv) { e.preventDefault(); var L = KHO.meta.filter(function (fm) { return fm.u === u.id && fm.nv === c.id && fm.kho === 'cv'; }); khoView(L, +cv.getAttribute('data-cv'), function () { return 'CV – ' + c.name; }); return; }
      var lt = e.target.closest('[data-lt]'); if (lt) { tdLetter(u, c, lt.getAttribute('data-lt'), draw); return; }
      var b = e.target.closest('[data-x]'); if (!b) return; var x = b.getAttribute('data-x'), i = +b.getAttribute('data-iv');
      if (x === 'edit') tdCandForm(u, c, function () { draw(); });
      else if (x === 'cvup') $('#tdCvF', m).click();
      else if (x === 'ivnew') tdIvForm(u, c, null, draw);
      else if (x === 'ivedit') tdIvForm(u, c, i, draw);
      else if (x === 'ivcancel') confirmBox('Hủy lịch phỏng vấn?', 'Lịch vòng ' + (i + 1) + ' ngày ' + vn(c.ivs[i].date) + ' sẽ đánh dấu Đã hủy. Nhớ báo lại cho ứng viên.', 'Hủy lịch', function () { c.ivs[i].st = 'cancel'; tdHist(c, 'Hủy lịch phỏng vấn vòng ' + (i + 1)); tdSave(u); draw(); });
      else if (x === 'eval') { m.close(); tdIvPopup(u, c, i); }
      else if (x === 'offer') tdOfferForm(u, c, draw);
      else if (x === 'ansyes' || x === 'ansno') { c.offer.ans = x === 'ansyes' ? 'yes' : 'no'; c.offer.ansAt = tdNow(); if (x === 'ansyes') { c.stage = 'hired'; tdHist(c, 'Đồng ý nhận việc, đi làm từ ' + vn(c.offer.start)); } else { c.stage = 'withdraw'; c.endAt = HR.isoToday(); tdHist(c, 'Từ chối thư mời nhận việc'); } tdSave(u, c.id + (x === 'ansyes' ? ' đồng ý nhận việc' : ' từ chối nhận việc')); draw(); render(); if (x === 'ansyes') toast(c.name + ' đồng ý nhận việc', 'ok', 'Bước tiếp: bấm "Chuyển thành nhân sự" để tạo hồ sơ (thông tin tự điền), rồi lập hợp đồng trước ngày đi làm.'); }
      else if (x === 'tonv') { m.close(); tdToNv(u, c); }
      else if (x === 'star') { c.starred = !c.starred; tdSave(u); draw(); render(); }
      else if (x === 'del') confirmBox('Xóa hồ sơ ' + c.name + '?', 'Xóa hẳn thông tin, lịch phỏng vấn, đánh giá và CV của ứng viên này. Không khôi phục được.', 'Xóa hồ sơ', function () { tdDelCand(u, c); m.close(); render(); toast('Đã xóa hồ sơ ' + c.id, 'ok'); });
    });
    draw();
  }
  function tdSetStage(u, c, s, cb) {
    if (s === c.stage) return;
    function apply() { var old = c.stage; c.stage = s; if (tdClosedSt(s)) c.endAt = HR.isoToday(); else delete c.endAt; if (s === 'ivcancel') (c.ivs || []).forEach(function (v) { if (v.st === 'plan') { v.st = 'cancel'; } }); tdHist(c, 'Chuyển bước: ' + TD_STN[old] + ' → ' + TD_STN[s]); tdSave(u, c.id + ' → ' + TD_STN[s]); cb && cb(); render();
      if (s === 'fail' && !(c.letters || []).some(function (l) { return l.t === 'tc'; })) toast('Nhớ gửi thư cảm ơn cho ' + c.name, 'info', 'Bấm "Thư cảm ơn, chưa trúng tuyển" trong hồ sơ ứng viên – thư có sẵn thời hạn lưu hồ sơ và cách yêu cầu xóa.');
      if (s === 'iv' && !(c.ivs || []).some(function (v) { return v.st === 'plan'; })) toast('Hẹn lịch phỏng vấn cho ' + c.name, 'info', 'Bấm "Hẹn phỏng vấn", rồi gửi Thư mời phỏng vấn.');
    }
    if (s === 'offer' && !c.offer) { tdOfferForm(u, c, function () { cb && cb(); }); return; }
    if (s === 'hired' && (!c.offer || !c.offer.start)) { toast('Cần lập điều kiện mời nhận việc trước', 'info', 'Có ngày đi làm thì mới chuyển được sang Đồng ý nhận việc.'); tdOfferForm(u, c, cb); return; }
    if (s === 'hired' && c.offer) { c.offer.ans = 'yes'; c.offer.ansAt = c.offer.ansAt || tdNow(); }
    apply();
  }
  function tdIvForm(u, c, i, cb, d0) {
    var v = i === null ? { date: d0 || tdAdd(refDate(), 2), time: '09:00', mode: TD_MODE[0], place: tdOf(u).cfg.addr, who: tdOf(u).cfg.contact, st: 'plan' } : c.ivs[i];
    var m = modal(i === null ? 'Hẹn phỏng vấn – ' + c.name : 'Đổi lịch phỏng vấn – ' + c.name, (tdReq(u, c.rq) || {}).pos || '', '<div class="td-form"><div class="td-g2">' + dbox('ivD', v.date, 'Ngày phỏng vấn *') + field('ivT', 'Giờ *', v.time, ' placeholder="09:00" maxlength="5"') + selectBox('ivM', 'Hình thức', TD_MODE.map(function (s) { return [s, s]; }), v.mode) + field('ivW', 'Người phỏng vấn', v.who) + '<div class="field" style="grid-column:1/-1"><label for="ivP">Địa điểm hoặc đường dẫn họp trực tuyến</label><input class="input" id="ivP" value="' + esc(v.place || '') + '"></div></div>' +
      '<label class="td-chk" style="margin-top:12px"><input type="checkbox" id="ivL" checked> Soạn Thư mời phỏng vấn ngay sau khi lưu</label></div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ivS">Lưu lịch</button></div>', true);
    $$('.dbox', m).forEach(bindDbox);
    $('#ivS', m).addEventListener('click', function () {
      var d = $('#ivD', m)._get(), t = $('#ivT', m).value.trim().replace(/[h.]/i, ':'); if (/^\d{1,2}$/.test(t)) t += ':00'; if (/^\d:\d\d$/.test(t)) t = '0' + t;
      if (!d) { toast('Ngày phỏng vấn chưa đúng', 'err', 'Nhập dd/mm/yyyy.'); return; } if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) { toast('Giờ chưa đúng', 'err', 'Ví dụ 09:00, 14:30.'); return; }
      var o = { date: d, time: t, mode: $('#ivM', m).value, who: $('#ivW', m).value.trim(), place: $('#ivP', m).value.trim() };
      if (i === null) { c.ivs = c.ivs || []; c.ivs.push(Object.assign({ id: 'pv' + Date.now().toString(36), st: 'plan', at: tdNow() }, o)); tdHist(c, 'Hẹn phỏng vấn vòng ' + c.ivs.length + ': ' + t + ' ' + vn(d)); } else { var oldS = (c.ivs[i].time || '') + ' ' + vn(c.ivs[i].date), moved = c.ivs[i].date !== o.date || c.ivs[i].time !== o.time; Object.assign(c.ivs[i], o, { at: tdNow() }, moved ? { old: oldS } : {}); tdHist(c, 'Đổi lịch phỏng vấn vòng ' + (i + 1) + ': ' + t + ' ' + vn(d)); }
      if (TD_LIVE.indexOf(c.stage) < 2 || tdClosedSt(c.stage) || c.stage === 'hold') c.stage = 'iv';
      tdSave(u, 'Lịch phỏng vấn ' + c.id); var go2 = $('#ivL', m).checked; m.close(); cb && cb(); render(); if (go2) tdLetter(u, c, i !== null && c.ivs[i].old && (c.letters || []).some(function (l) { return l.t === 'pv'; }) ? 'dl' : 'pv', cb);
    });
  }
  function tdEvalForm(u, c, i, cb) {
    var v = c.ivs[i], crit = tdOf(u).cfg.crit || TD_CRIT0, sc = Object.assign({}, v.score || {}), res = v.res || '';
    var m = modal('Đánh giá phỏng vấn – ' + c.name, 'Vòng ' + (i + 1) + ' · ' + vn(v.date) + ' ' + (v.time || '') + (TD_SCORE ? ' · chấm 1 (chưa đạt) đến 5 (rất tốt) theo cùng bộ tiêu chí' : ' · ghi kết quả và nhận xét'), (TD_SCORE ? '<div class="td-crit" id="evC">' + crit.map(function (k, j) { return '<span>' + esc(k) + '</span><div class="td-stars" data-k="' + j + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (+sc[j] === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>'; }).join('') + '</div>' : '') +
      '<div class="field" style="margin-top:14px"><label for="evN">Nhận xét</label><textarea class="input" id="evN" style="width:100%;min-height:80px">' + esc(v.note || '') + '</textarea></div>' +
      '<div class="field"><label>Kết quả</label><div class="seg" id="evR"><button type="button" data-r="pass" class="' + (res === 'pass' ? 'on' : '') + '">Đạt</button><button type="button" data-r="hold" class="' + (res === 'hold' ? 'on' : '') + '">Cân nhắc</button><button type="button" data-r="fail" class="' + (res === 'fail' ? 'on' : '') + '">Chưa đạt</button></div></div>' +
      (TD_SCORE ? '<p class="muted" style="font-size:12px">Bộ tiêu chí chung sửa ở Kết quả phỏng vấn → Biểu mẫu thư.</p>' : '') + '<div class="link-row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="evS">Lưu đánh giá</button></div>', true);
    if ($('#evC', m)) $('#evC', m).addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; var g = b.parentNode; sc[g.getAttribute('data-k')] = +b.getAttribute('data-n'); $$('button', g).forEach(function (x) { x.classList.toggle('on', x === b); }); });
    $('#evR', m).addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (!b) return; res = b.getAttribute('data-r'); $$('button', $('#evR', m)).forEach(function (x) { x.classList.toggle('on', x === b); }); });
    $('#evS', m).addEventListener('click', function () {
      if (!res) { toast('Chọn kết quả: Đạt, Cân nhắc hoặc Chưa đạt', 'err'); return; }
      v.score = sc; v.res = res; v.note = $('#evN', m).value.trim(); v.st = 'done'; var s = tdScore(v);
      tdHist(c, 'Đánh giá phỏng vấn vòng ' + (i + 1) + ': ' + (res === 'pass' ? 'Đạt' : res === 'fail' ? 'Chưa đạt' : 'Cân nhắc') + (s !== null ? ' (★ ' + String(s).replace('.', ',') + ')' : ''));
      tdSave(u, 'Đánh giá phỏng vấn ' + c.id); m.close(); cb && cb(); render();
      if (res === 'pass') toast(c.name + ' đạt phỏng vấn', 'ok', 'Bước tiếp: "Lập điều kiện mời" rồi gửi Thư mời nhận việc.');
      if (res === 'fail') confirmBox('Chuyển ' + c.name + ' sang "Chưa phù hợp"?', 'Sau đó nên gửi Thư cảm ơn & thông báo chưa trúng tuyển.', 'Chuyển và soạn thư', function () { c.stage = 'fail'; c.endAt = HR.isoToday(); tdHist(c, 'Chuyển bước → Chưa phù hợp'); tdSave(u); cb && cb(); render(); tdLetter(u, c, 'tc', cb); });
    });
  }
  function tdOfferForm(u, c, cb, opt2) {
    opt2 = opt2 || {};
    var r = tdReq(u, c.rq) || {}, o = c.offer || { sal: r.salMax || r.salMin || 0, probKind: r.prob || 'cd', probDays: 0, probSal: 0, hd: r.ld === 'Cộng tác viên' ? 'Hợp đồng dịch vụ (cộng tác viên)' : 'Hợp đồng thử việc, sau đó hợp đồng lao động xác định thời hạn 12 tháng', start: r.needBy && r.needBy > refDate() ? r.needBy : tdAdd(refDate(), 7), replyBy: tdAdd(refDate(), 3), place: r.place || tdOf(u).cfg.addr, time: r.time || '', other: '' };
    var pk = function (k) { return TD_PROB.filter(function (p) { return p[0] === k; })[0]; };
    if (!o.probDays && pk(o.probKind)) o.probDays = pk(o.probKind)[2];
    if (!o.probSal && o.sal) o.probSal = Math.ceil(o.sal * 0.85 / 1000) * 1000;
    var m = modal('Điều kiện mời nhận việc – ' + c.name, r.pos || '', '<div class="td-form"><div class="td-g2">' + field('oSal', 'Lương chính thức (đồng/tháng) *', o.sal ? fmtInt(o.sal) : '', ' inputmode="numeric"') +
      selectBox('oPk', 'Thử việc theo loại công việc', TD_PROB.map(function (p) { return [p[0], p[1] + ' – tối đa ' + p[2] + ' ' + p[3]]; }).concat([['none', 'Không thử việc']]), o.probKind) +
      field('oPd', 'Số ngày thử việc', o.probDays || '', ' inputmode="numeric"') + field('oPs', 'Lương thử việc (đồng/tháng)', o.probSal ? fmtInt(o.probSal) : '', ' inputmode="numeric"') +
      dbox('oSt', o.start, 'Ngày đi làm *') + dbox('oRb', o.replyBy, 'Hạn trả lời') +
      '<div class="field" style="grid-column:1/-1"><label for="oHd">Hình thức hợp đồng</label><input class="input" id="oHd" value="' + esc(o.hd || '') + '"></div>' + field('oPl', 'Địa điểm làm việc', o.place) + field('oTi', 'Thời gian làm việc', o.time) +
      '<div class="field" style="grid-column:1/-1"><label for="oOt">Chế độ khác (để trống = dùng câu mặc định về BHXH, phép năm)</label><input class="input" id="oOt" value="' + esc(o.other || '') + '"></div></div><div id="oChk" style="margin-top:10px"></div>' +
      (opt2.noLetter ? '' : '<label class="td-chk" style="margin-top:10px"><input type="checkbox" id="oL" checked> Soạn Thư mời nhận việc ngay sau khi lưu</label>') + '</div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="oS">Lưu điều kiện</button></div>');
    m.querySelector('.modal').classList.add('lg'); $$('.dbox', m).forEach(bindDbox);
    var num = function (k) { return +($('#' + k, m).value || '').replace(/\D/g, '') || 0; };
    ['oSal', 'oPs'].forEach(function (k) { var el = $('#' + k, m); el.addEventListener('input', function () { var d = el.value.replace(/\D/g, ''); el.value = d ? fmtInt(+d) : ''; chk(); }); });
    $('#oPk', m).addEventListener('change', function () { var p = pk($('#oPk', m).value); $('#oPd', m).value = p ? p[2] : ''; chk(); }); $('#oPd', m).addEventListener('input', chk);
    function chk() {
      var sal = num('oSal'), ps0 = num('oPs'), k = $('#oPk', m).value, p = pk(k), d = +$('#oPd', m).value || 0, out = [];
      if (k !== 'none') {
        if (sal && ps0 && ps0 < Math.ceil(sal * 0.85)) out.push(['bad', 'Lương thử việc ' + fmtInt(ps0) + ' thấp hơn 85% lương chính thức (' + fmtInt(Math.ceil(sal * 0.85)) + ') – trái Điều 26 BLLĐ 2019.']);
        else if (sal && ps0) out.push(['ok', 'Lương thử việc bằng ' + Math.round(ps0 / sal * 100) + '% lương chính thức – đạt mức tối thiểu 85% (Điều 26 BLLĐ 2019).']);
        if (p && d > p[2]) out.push(['bad', 'Thử việc ' + d + ' ' + p[3] + ' vượt mức tối đa ' + p[2] + ' ' + p[3] + ' cho "' + p[1].toLowerCase() + '" (Điều 25 ' + p[4] + ' BLLĐ 2019).']);
        out.push(['info', 'Chỉ thử việc 1 lần cho một công việc (Điều 25); hợp đồng dưới 1 tháng thì không thử việc (Điều 24 khoản 3).']);
      }
      $('#oChk', m).innerHTML = out.map(function (x) { return '<div class="notice' + (x[0] === 'bad' ? ' warn' : '') + '" style="margin-top:6px;padding:8px 12px">' + ic(x[0] === 'ok' ? 'check' : 'info') + '<div>' + esc(x[1]) + '</div></div>'; }).join('');
      return out.filter(function (x) { return x[0] === 'bad'; }).length;
    }
    chk();
    $('#oS', m).addEventListener('click', function () {
      var sal = num('oSal'), st = $('#oSt', m)._get(), rb = $('#oRb', m)._get(), k = $('#oPk', m).value;
      if (!sal) { toast('Chưa có lương chính thức', 'err'); return; } if (!st) { toast('Ngày đi làm chưa đúng', 'err', 'Nhập dd/mm/yyyy.'); return; } if (rb === null) { toast('Hạn trả lời chưa đúng', 'err'); return; }
      if (chk()) { toast('Điều kiện thử việc chưa đúng luật', 'err', 'Sửa lương hoặc số ngày thử việc theo cảnh báo màu đỏ.'); return; }
      c.offer = Object.assign(c.offer || { ans: 'pending' }, { sal: sal, probKind: k, probDays: k === 'none' ? 0 : +$('#oPd', m).value || 0, probSal: k === 'none' ? 0 : num('oPs'), start: st, replyBy: rb || '', hd: $('#oHd', m).value.trim(), place: $('#oPl', m).value.trim(), time: $('#oTi', m).value.trim(), other: $('#oOt', m).value.trim() });
      if (c.stage !== 'hired') { c.stage = 'offer'; if (c.offer.ans !== 'yes') c.offer.ans = 'pending'; }
      tdHist(c, 'Lập điều kiện mời nhận việc: lương ' + fmtInt(sal) + ', đi làm ' + vn(st)); tdSave(u, 'Điều kiện mời nhận việc ' + c.id);
      var go2 = !opt2.noLetter && $('#oL', m).checked; m.close(); cb && cb(); render(); if (go2) tdLetter(u, c, 'nv', cb);
    });
  }
  // ---- Soạn thư: phần lõi dùng chung cho cửa sổ soạn thư và khung xem trước ở Kết quả phỏng vấn ----
  function tdLetterWarn(u, c, t, subj, body) {
    var warn = [], miss = (subj + body).match(/…/g);
    if (t === 'pv' && !tdPlanIv(c)) warn.push('Chưa có lịch phỏng vấn – bấm “Hẹn phỏng vấn” trước để thư tự điền ngày giờ.');
    if (t === 'nv' && !c.offer) warn.push('Chưa lập điều kiện mời nhận việc – thư chưa có lương, ngày đi làm.');
    if (t === 'nv' && !c.consent) warn.push('Chưa ghi nhận ứng viên đồng ý xử lý dữ liệu.');
    if (miss) warn.push('Còn ' + miss.length + ' chỗ “…” chưa có thông tin – điền tay trước khi gửi.');
    return warn;
  }
  function tdLetterHtml(u, c, t, p, inline) {
    var tp = tdTpl(u, t), V = tdVals(u, c), subj = tdFill(tp.s, V), body = tdFill(tp.b, V), warn = tdLetterWarn(u, c, t, subj, body), last = tdHasLt(c, t);
    var btns = '<button class="btn btn-primary" id="' + p + 'M"' + (c.email ? '' : ' disabled title="Ứng viên chưa có email"') + '>' + ic('td_mail', 15) + 'Gửi qua email</button><button class="btn" id="' + p + 'C">' + ic('td_copy', 15) + 'Sao chép gửi Zalo / SMS</button><button class="btn" id="' + p + 'P">' + ic('td_print', 15) + 'In / lưu PDF</button>';
    var w = warn.length ? '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>' + warn.map(esc).join('<br>') + '</div></div>' : '';
    var sent = last ? '<div class="td-sentnote">' + ic('check', 14) + 'Đã gửi ' + TD_LT[t].toLowerCase() + ' ' + tdVnAt(last.at) + (last.ch ? ' · ' + esc(last.ch) : '') + ' – gửi lại nếu cần</div>' : '';
    if (inline) return w + sent + '<div class="field"><label for="' + p + 'S">Tiêu đề</label><input class="input" id="' + p + 'S" value="' + esc(subj) + '"></div><div class="field"><label for="' + p + 'B">Nội dung thư (sửa trực tiếp được)</label><textarea class="input td-ltb" id="' + p + 'B">' + esc(body) + '</textarea></div><div class="td-lsend">' + btns + '</div><p class="muted" style="font-size:12px;margin:8px 0 0">Gửi email tự động sẽ thiết lập ở Cài đặt khi bản hoàn thiện phát hành. Hiện có thể sao chép gửi Zalo / SMS hoặc in; mỗi lần gửi được ghi vào lịch sử ứng viên.</p>';
    return w + sent + '<div class="td-letter"><div><div class="field"><label for="' + p + 'S">Tiêu đề</label><input class="input" id="' + p + 'S" value="' + esc(subj) + '"></div><div class="field"><label for="' + p + 'B">Nội dung (sửa trực tiếp được)</label><textarea class="input td-ltb" id="' + p + 'B" style="width:100%">' + esc(body) + '</textarea></div></div>' +
      '<div><div class="td-sec"><h3>Gửi thư</h3><p class="muted" style="font-size:12.5px;margin:0 0 10px">Gửi email tự động sẽ thiết lập ở Cài đặt khi bản hoàn thiện phát hành. Hiện có thể sao chép gửi Zalo / SMS hoặc in; mỗi lần gửi được ghi vào lịch sử ứng viên.</p><div class="link-row" style="flex-direction:column;align-items:stretch;gap:8px;margin:0">' + btns + '</div></div>' +
      '<div class="td-sec"><h3>Mẫu thư</h3><p class="muted" style="font-size:12.5px;margin:0">Sửa mẫu dùng chung ở Tuyển dụng → Kết quả phỏng vấn → Biểu mẫu thư.</p></div></div></div>';
  }
  function tdLetterBind(root, u, c, t, p, cb) {
    function mark(ch) {
      (c.letters = c.letters || []).push({ t: t, at: tdNow(), ch: ch }); tdHist(c, 'Gửi ' + TD_LT[t].toLowerCase() + ' – ' + ch);
      if (t === 'nv' && c.offer && !c.offer.sentAt) c.offer.sentAt = tdNow();
      if (t === 'nv' && c.offer && (c.stage === 'iv' || c.stage === 'screen' || c.stage === 'new')) c.stage = 'offer';
      if (t === 'tc' && !tdClosedSt(c.stage)) { c.stage = 'fail'; c.endAt = HR.isoToday(); tdHist(c, 'Chuyển bước → Chưa phù hợp (đã gửi thông báo kết quả)'); }
      tdSave(u, 'Gửi ' + TD_LT[t] + ' cho ' + c.id + ' (' + ch + ')'); cb && cb();
    }
    var S = $('#' + p + 'S', root), B = $('#' + p + 'B', root);
    // 11/11 16:29 anh: giai đoạn này bấm Gửi qua email báo giống nút gửi email ở Phiếu lương – chưa gửi thật, không ghi là đã gửi
    $('#' + p + 'M', root).addEventListener('click', function () { var c0 = tdOf(u).cfg; c0.lastMail = { t: t, s: S.value }; saveUnits(); modal('Gửi ' + TD_LT[t].toLowerCase() + ' qua email', c.name + (c.email ? ' · ' + c.email : ''), '<div class="pl-mail"><p>Chưa thiết lập gửi email tự động. Anh/chị sẽ thiết lập tại phần <b>Cài đặt</b> khi bản hoàn thiện phát hành.</p><p class="faint" style="font-size:13px">Thư chưa được gửi đi. Trong lúc chờ, có thể bấm <b>Sao chép gửi Zalo / SMS</b> hoặc <b>In / lưu PDF</b> – phần mềm ghi lại vào lịch sử ứng viên.</p><div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" data-close>Đã hiểu</button></div></div>', true); });
    $('#' + p + 'C', root).addEventListener('click', function () { tdCopy(B.value, 'nội dung thư'); mark('Zalo / SMS'); });
    $('#' + p + 'P', root).addEventListener('click', function () {
      var cf = tdOf(u).cfg, w = window.open('', '_blank'); if (!w) { toast('Trình duyệt chặn cửa sổ mới', 'err', 'Cho phép cửa sổ bật lên rồi bấm lại.'); return; }
      w.document.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(S.value) + '</title><style>body{font-family:"Times New Roman",serif;font-size:13.5pt;line-height:1.55;max-width:680px;margin:40px auto;padding:0 24px;color:#111}.h{display:flex;justify-content:space-between;border-bottom:2px solid ' + esc(cf.color) + ';padding-bottom:10px;margin-bottom:24px}.h b{font-size:15pt;color:' + esc(cf.color) + '}.h small{color:#555;font-size:10.5pt;text-align:right}h1{font-size:15pt;text-align:center;text-transform:uppercase;margin:0 0 22px}p{white-space:pre-wrap;margin:0}@media print{body{margin:0 auto}}</style></head><body><div class="h"><b>' + esc(cf.name) + '</b><small>' + esc(cf.addr || '') + '<br>' + esc([tdPhoneFmt(cf.phone), cf.email].filter(Boolean).join(' · ')) + '</small></div><h1>' + esc(TD_LT[t]) + '</h1><p>' + esc(B.value) + '</p><script>setTimeout(function(){print()},300)<' + '/script></body></html>');
      w.document.close(); mark('In / PDF');
    });
  }
  function tdLetter(u, c, t, cb) {
    var m = modal(TD_LT[t] + ' – ' + c.name, (c.email || 'Chưa có email') + ' · ' + tdPhoneFmt(c.phone), tdLetterHtml(u, c, t, 'lt', false));
    m.querySelector('.modal').classList.add('lg');
    tdLetterBind(m, u, c, t, 'lt', function () { m.close(); cb && cb(); });
  }
  // ---- Biểu mẫu thư (sửa mẫu dùng chung) + tiêu chí đánh giá ----
  function tdTplUnit() { var us = tdUnitsAll(), f = ps('tdk', { tab: 'list' }); if (!f.tu || !us.some(function (x) { return x.id === f.tu; })) f.tu = us[0] ? us[0].id : ''; return unitById(f.tu); }
  function tdTplPage() {
    var u = tdTplUnit(); if (!u) return '';
    var us = selUnits(), cf = tdOf(u).cfg;
    return (us.length > 1 ? '<div class="td-bar"><div class="field"><label for="tdTU">Mẫu của công ty</label><select class="input" id="tdTU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), u.id); }).join('') + '</select></div></div>' : '') +
      '<div class="td-tpls">' + ['pv', 'dl', 'nv', 'tc'].map(function (t) { var tp = tdTpl(u, t), own = cf.tpl[t] && cf.tpl[t].b; return '<div class="card card-pad td-tpl"><div class="card-head"><div><h3>' + TD_LT[t] + '</h3><p>' + (own ? 'Mẫu đã sửa riêng' : 'Mẫu gốc của phần mềm') + '</p></div></div><b style="font-size:13px">' + esc(tp.s) + '</b><pre>' + esc(tp.b) + '</pre><div class="link-row" style="margin:0"><button class="btn btn-sm btn-primary" data-act="td-tpl" data-id="' + t + '">' + ic('td_edit', 14) + 'Sửa mẫu</button>' + (own ? '<button class="btn btn-sm" data-act="td-tpl0" data-id="' + t + '">Về mẫu gốc</button>' : '') + '</div></div>'; }).join('') + '</div>' +
      (TD_SCORE ? '<div class="card card-pad" style="margin-top:14px"><div class="card-head"><div><h3>Tiêu chí đánh giá phỏng vấn</h3><p>Dùng chung cho mọi vị trí để so sánh ứng viên công bằng · chấm 1–5 mỗi tiêu chí</p></div><button class="btn btn-sm" data-act="td-crit">' + ic('td_edit', 14) + 'Sửa tiêu chí</button></div><div class="td-tags" style="display:flex;flex-wrap:wrap;gap:6px">' + (cf.crit || TD_CRIT0).map(function (k, i) { return '<span class="tag tag-info">' + (i + 1) + '. ' + esc(k) + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="notice" style="margin-top:14px">' + ic('info') + '<div>Các mẫu đã có sẵn những câu theo quy định: <b>không thu phí tuyển dụng</b> (Điều 11 khoản 2 BLLĐ 2019), <b>không giữ bản chính giấy tờ</b> (Điều 17 khoản 1), thư mời nhận việc nêu rõ công việc, nơi làm, giờ làm, lương (Điều 16 khoản 1), lương thử việc tối thiểu 85% (Điều 26); thư cảm ơn nêu thời hạn lưu hồ sơ và cách yêu cầu xóa. Sửa mẫu nên giữ lại các câu này.</div></div>';
  }
  function tdTplBind() { var s = $('#tdTU'); if (s) s.addEventListener('change', function () { PS.tdk.tu = s.value; render(); }); }
  ACTS['td-tpl'] = function (a, t) {
    var u = tdTplUnit(), cf = tdOf(u).cfg, tp = tdTpl(u, t);
    var m = modal('Sửa mẫu: ' + TD_LT[t], 'Bấm tên trường để chèn vào vị trí con trỏ · trường trong {ngoặc nhọn} tự điền theo ứng viên', '<div class="td-letter"><div><div class="field"><label for="tpS">Tiêu đề</label><input class="input" id="tpS" value="' + esc(tp.s) + '"></div><div class="field"><label for="tpB">Nội dung</label><textarea class="input" id="tpB" style="width:100%">' + esc(tp.b) + '</textarea></div></div><div><div class="td-sec"><h3>Trường tự điền</h3><div class="td-ph">' + TD_PH.map(function (p) { return '<button type="button" data-ph="' + esc(p) + '">{' + esc(p) + '}</button>'; }).join('') + '</div></div></div></div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="tpOk">Lưu mẫu</button></div>');
    m.querySelector('.modal').classList.add('lg');
    var last = $('#tpB', m); $('#tpS', m).addEventListener('focus', function () { last = $('#tpS', m); }); $('#tpB', m).addEventListener('focus', function () { last = $('#tpB', m); });
    m.addEventListener('click', function (e) { var b = e.target.closest('[data-ph]'); if (!b) return; var el = last, s = el.selectionStart || el.value.length, ins = '{' + b.getAttribute('data-ph') + '}'; el.value = el.value.slice(0, s) + ins + el.value.slice(el.selectionEnd || s); el.focus(); try { el.setSelectionRange(s + ins.length, s + ins.length); } catch (x) { } });
    $('#tpOk', m).addEventListener('click', function () { var b = $('#tpB', m).value.trim(); if (!b) { toast('Nội dung mẫu đang trống', 'err'); return; } cf.tpl[t] = { s: $('#tpS', m).value.trim(), b: b }; tdSave(u, 'Sửa mẫu ' + TD_LT[t]); m.close(); render(); toast('Đã lưu mẫu ' + TD_LT[t].toLowerCase(), 'ok'); });
  };
  ACTS['td-tpl0'] = function (a, t) { var u = tdTplUnit(); confirmBox('Về mẫu gốc?', 'Mẫu ' + TD_LT[t].toLowerCase() + ' đã sửa sẽ bị thay bằng mẫu gốc của phần mềm.', 'Về mẫu gốc', function () { delete tdOf(u).cfg.tpl[t]; tdSave(u, 'Đặt lại mẫu ' + TD_LT[t]); render(); }); };
  ACTS['td-crit'] = function () {
    var u = tdTplUnit(), cf = tdOf(u).cfg;
    var m = modal('Tiêu chí đánh giá phỏng vấn', 'Mỗi dòng 1 tiêu chí, tối đa 8 · đổi tiêu chí không làm mất điểm đã chấm', '<textarea class="input" id="crT" style="width:100%;min-height:180px;line-height:1.6">' + esc((cf.crit || TD_CRIT0).join('\n')) + '</textarea><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="crOk">Lưu</button></div>', true);
    $('#crOk', m).addEventListener('click', function () { var l = tdLines($('#crT', m).value).slice(0, 8); if (l.length < 2) { toast('Cần ít nhất 2 tiêu chí', 'err'); return; } cf.crit = l; tdSave(u, 'Sửa tiêu chí đánh giá'); m.close(); render(); });
  };

  // ---- Nhập ứng viên từ Excel (ví dụ file xuất Google Form, trang việc làm) ----
  ACTS['td-imp'] = function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.csv'; inp.onchange = function () { var f = inp.files && inp.files[0]; if (f) tdImport(f); }; inp.click();
  };
  function tdImport(file) {
    var b = busy('Đang đọc ' + file.name + '…');
    file.arrayBuffer().then(function (buf) {
      var rows;
      if (/\.csv$/i.test(file.name)) { var txt = new TextDecoder('utf-8').decode(buf).replace(/^\uFEFF/, ''); var sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ','; rows = txt.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { var out = [], cur = '', q = false; for (var i = 0; i < l.length; i++) { var ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; }); }
      else { var wb = XR.open(new Uint8Array(buf), file.name); rows = wb.getRows(wb.sheetNames[0]); }
      b.done(); tdImportMap(file.name, rows || []);
    }).catch(function (e) { b.done(); showErr('Chưa đọc được file', e, 'Kiểm tra file có đóng trong Excel chưa, hoặc lưu lại dạng .xlsx.'); });
  }
  function tdImportMap(fname, rows) {
    var MAP = [['name', /^(ho (va )?ten|ten ung vien|full ?name|name|ho ten)$/], ['phone', /(dien thoai|sdt|so dt|phone|di dong)/], ['email', /(e-?mail|thu dien tu)/], ['pos', /(vi tri|position|chuc danh)/], ['yob', /(nam sinh|ngay sinh|birth)/], ['edu', /(trinh do|hoc van|education)/], ['exp', /(kinh nghiem|gioi thieu|experience)/], ['at', /(ngay nop|ngay ung tuyen|dau thoi gian|timestamp|thoi gian)/], ['link', /(link|cv|ho so)/], ['src', /(nguon|biet tin)/], ['cons', /(dong y|consent)/]];
    var hi = -1, col = {};
    for (var i = 0; i < Math.min(rows.length, 10) && hi < 0; i++) { var r = rows[i] || [], c0 = {}; r.forEach(function (v, j) { var h = norm(v).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); MAP.forEach(function (mp) { if (!(mp[0] in c0) && mp[1].test(h)) c0[mp[0]] = j; }); }); if ('name' in c0 && ('phone' in c0 || 'email' in c0)) { hi = i; col = c0; } }
    if (hi < 0) { toast('Chưa nhận ra cột Họ tên, Điện thoại/Email', 'err', 'Dòng tiêu đề cần có cột "Họ và tên" và "Số điện thoại" hoặc "Email".'); return; }
    var u = selUnits()[0], us = selUnits();
    function cell(r, k) { var v = k in col ? r[col[k]] : ''; if (v instanceof Date) return v.getFullYear() + '-' + p2(v.getMonth() + 1) + '-' + p2(v.getDate()); return v == null ? '' : String(v).trim(); }
    var list = rows.slice(hi + 1).filter(function (r) { return r && cell(r, 'name'); }).map(function (r) { var at = cell(r, 'at'), yob = cell(r, 'yob'); var iso = /^\d{4}-\d{2}-\d{2}/.test(at) ? at.slice(0, 10) : (HR.parseVn((at.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || [''])[0].replace(/^(\d)\//, '0$1/').replace(/\/(\d)\//, '/0$1/')) || ''); var y = (String(yob).match(/(19|20)\d{2}/) || [''])[0]; return { name: cell(r, 'name').replace(/\s+/g, ' '), phone: tdPhone(cell(r, 'phone')), email: cell(r, 'email'), pos: cell(r, 'pos'), yob: y ? +y : '', edu: cell(r, 'edu'), exp: cell(r, 'exp').slice(0, 300), at: iso || HR.isoToday(), link: /^https?:/.test(cell(r, 'link')) ? cell(r, 'link') : '', src: cell(r, 'src'), cons: cell(r, 'cons') }; });
    function body() {
      var rqs = tdOf(u).rq.filter(function (r) { return r.st !== 'closed'; });
      var badP = list.filter(function (x) { return x.phone && !/^0\d{9}$/.test(x.phone); }).length;
      return tdUnitPick(us, u.id) + '<p>Đọc được <b>' + list.length + '</b> ứng viên từ <b>' + esc(fname) + '</b> · nhận ra cột: ' + Object.keys(col).map(function (k) { return { name: 'Họ tên', phone: 'Điện thoại', email: 'Email', pos: 'Vị trí', yob: 'Năm sinh', edu: 'Trình độ', exp: 'Kinh nghiệm', at: 'Ngày nộp', link: 'Link', src: 'Nguồn', cons: 'Đồng ý' }[k]; }).join(', ') + (badP ? ' · <span class="miss">' + badP + ' số điện thoại chưa đúng 10 số</span>' : '') + '</p>' +
        '<div class="td-g2">' + selectBox('imRq', 'Gắn vào vị trí *' + ('pos' in col ? ' (dòng có cột Vị trí trùng tên phiếu sẽ tự gắn đúng phiếu)' : ''), [['', '— Chọn vị trí —']].concat(rqs.map(function (r) { return [r.id, r.pos]; })), rqs.length === 1 ? rqs[0].id : '') + selectBox('imSrc', 'Nguồn (khi file không có cột nguồn)', TD_SRC.map(function (s) { return [s, s]; }), 'Trang việc làm') + '</div>' +
        '<label class="td-chk" style="margin-top:10px"><input type="checkbox" id="imC"' + ('cons' in col ? ' checked' : '') + '> Ứng viên trong file đã đồng ý cho xử lý dữ liệu cá nhân (ví dụ form có ô đồng ý bắt buộc)</label>' +
        '<div class="tbl-wrap" style="max-height:260px;margin-top:12px"><table class="tbl"><thead><tr><th>Họ và tên</th><th>Điện thoại</th><th>Email</th><th>Vị trí trong file</th><th>Ngày nộp</th></tr></thead><tbody>' + list.slice(0, 50).map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td class="mono">' + esc(tdPhoneFmt(x.phone)) + '</td><td>' + esc(x.email) + '</td><td>' + esc(x.pos) + '</td><td>' + vn(x.at) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    var m = modal('Nhập ứng viên từ Excel', 'Kiểm tra trước khi nhập · trùng số điện thoại/email với hồ sơ đã có sẽ được đánh dấu "Nộp trùng"', '<div id="imB">' + body() + '</div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="imOk">Nhập ' + list.length + ' ứng viên</button></div>');
    m.querySelector('.modal').classList.add('lg');
    function bind() { var up = $('#tdU', m); if (up) up.addEventListener('change', function () { u = unitById(up.value); $('#imB', m).innerHTML = body(); bind(); }); }
    bind();
    $('#imOk', m).addEventListener('click', function () {
      var def = $('#imRq', m).value, rqs = tdOf(u).rq, t = tdOf(u), n = 0, cons = $('#imC', m).checked;
      if (!def && !list.every(function (x) { return rqs.some(function (r) { return norm(r.pos) === norm(x.pos); }); })) { toast('Chọn vị trí để gắn ứng viên', 'err'); return; }
      list.forEach(function (x) { var r = rqs.filter(function (z) { return x.pos && norm(z.pos) === norm(x.pos); })[0]; var c = { id: tdNext(t.cd, 'UV', 4), rq: r ? r.id : def, name: x.name.replace(/(^|\s)(\S)/g, function (z, a, b2) { return a + b2.toUpperCase(); }), phone: x.phone, email: x.email, yob: x.yob, edu: x.edu, exp: x.exp, link: x.link, at: x.at, src: TD_SRC.indexOf(x.src) >= 0 ? x.src : $('#imSrc', m).value, stage: 'new', ivs: [], letters: [], hist: [], note: '', consent: cons ? { at: x.at + ' 00:00', ver: 'nhap-excel', how: 'Đồng ý trên form gốc (nhập từ file ' + fname + ')' } : null }; tdHist(c, 'Nhập từ file ' + fname); t.cd.push(c); n++; });
      tdSave(u, 'Nhập ' + n + ' ứng viên từ ' + fname); m.close(); var g = ps('tdu', {}); g.st = 'new'; g.k = ''; render(); toast('Đã nhập ' + n + ' ứng viên', 'ok', cons ? 'Vào bước Mới nhận.' : 'Chưa ghi nhận đồng ý xử lý dữ liệu – nhớ hỏi ứng viên khi liên hệ.');
    });
  }

  /* ---------------- Chuyển ứng viên thành nhân sự (mở sẵn form Thêm nhân sự, tự điền) ---------------- */
  function tdToNv(u, c) {
    var r = tdReq(u, c.rq) || {}, o = c.offer || {};
    function go2() {
      var before = {}; u.data.NV.forEach(function (e) { before[e['Mã NV']] = 1; });
      openNvForm(u, null);
      var bgs = $$('.modal-bg'), m = bgs[bgs.length - 1]; if (!m) return;
      var done = [];
      function setI(id, v, lab) { var el = $('#' + id, m); if (!el || v === '' || v == null) return; if (el.tagName === 'SELECT' && !$$('option', el).some(function (op) { return op.value === String(v); })) return; el.value = v; el.classList.add('qr-fill'); el.dispatchEvent(new Event('change', { bubbles: true })); done.push(lab); }
      function setD(id, iso, lab) { var box = $('#' + id, m); if (!box || !iso) return; var P = box.querySelectorAll('input'); P[0].value = iso.slice(8, 10); P[1].value = iso.slice(5, 7); P[2].value = iso.slice(0, 4); box.classList.add('qr-fill'); done.push(lab); }
      setI('fName', c.name, 'Họ và tên'); setI('fSdt', tdPhone(c.phone), 'Số điện thoại'); setI('fPb', r.pb, 'Phòng ban'); setI('fCd', r.cd || r.pos, 'Chức danh'); setI('fLd', r.ld, 'Loại lao động'); setD('fVao', o.start, 'Ngày vào làm');
      var td = $('#fTd', m); if (td && c.edu) { var hit = $$('option', td).filter(function (op) { return norm(op.value) === norm(c.edu) || norm(op.textContent) === norm(c.edu); })[0]; if (hit) { td.value = hit.value; td.classList.add('qr-fill'); done.push('Trình độ'); } else if (td.tagName === 'INPUT') setI('fTd', c.edu, 'Trình độ'); }
      var res = $('#fQrRes', m); if (res) res.innerHTML = '<div class="notice" style="margin-bottom:10px">' + ic('info') + '<div>Đã điền từ hồ sơ ứng viên <b>' + esc(c.id) + '</b>: ' + esc(done.join(', ')) + '. Bổ sung CCCD, ngày sinh, địa chỉ… (có thể bấm “Điền từ ảnh CCCD”). Email cá nhân của ứng viên: ' + esc(c.email || '—') + '.</div></div>';
      var ob = new MutationObserver(function () {
        if (document.body.contains(m)) return; ob.disconnect();
        var nu = S.units.filter(function (x) { return x.data.NV.some(function (e) { return !before[e['Mã NV']] && x === u; }); })[0];
        var e = u.data.NV.filter(function (e) { return !before[e['Mã NV']]; })[0];
        if (!e) return; // đóng form không lưu
        c.nvId = e['Mã NV']; c.stage = 'hired'; tdHist(c, 'Chuyển thành hồ sơ nhân sự ' + c.nvId); tdSave(u, 'Chuyển ứng viên ' + c.id + ' thành nhân sự ' + c.nvId);
        var rr = tdReq(u, c.rq); if (rr && rr.st === 'open' && tdHiredCount(u, rr) >= rr.sl && tdCandsOf(u, rr.id).filter(function (z) { return z.stage === 'hired' && z.nvId; }).length >= rr.sl) { rr.st = 'filled'; rr.pub = false; rr.upd = tdNow(); tdSave(u, 'Phiếu ' + rr.id + ' đã đủ người'); toast('Phiếu "' + rr.pos + '" đã đủ người', 'info', 'Đã chuyển sang Đã đủ người và tắt hiện trên cổng.'); }
        render();
        var bx = modal('Đã tạo hồ sơ nhân sự ' + c.nvId, c.name, '<p>Bước tiếp theo nên làm trước ngày đi làm ' + (o.start ? vn(o.start) : '') + ':</p><ul class="soon-list">' +
          '<li>' + ic('check') + '<span>Lập <b>hợp đồng thử việc</b> (hoặc HĐLĐ có thỏa thuận thử việc) theo điều kiện đã mời: lương thử việc ' + (o.probSal ? fmtInt(o.probSal) : '…') + ', ' + (o.probDays || '…') + ' ngày</span></li><li>' + ic('check') + '<span>Cấp tài khoản nhân viên để chấm công, nhận phiếu lương trên điện thoại</span></li><li>' + ic('check') + '<span>Nhận bản sao giấy tờ (không giữ bản chính – Điều 17 BLLĐ 2019)</span></li></ul>' +
          '<div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Để sau</button><button class="btn" data-act="profile" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Mở hồ sơ</button><button class="btn btn-primary" data-act="hd-new" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Lập hợp đồng</button></div>', true);
        bx.addEventListener('click', function (ev) { if (ev.target.closest('[data-act]')) bx.close(); });
      });
      ob.observe(document.body, { childList: true });
    }
    if (c.stage !== 'hired') confirmBox('Chuyển ' + c.name + ' thành nhân sự?', 'Ứng viên đang ở bước "' + TD_STN[c.stage] + '", chưa ghi nhận đồng ý nhận việc. Vẫn tạo hồ sơ nhân sự?', 'Vẫn chuyển', go2);
    else go2();
  }

  /* =====================================================================
     4) KẾT QUẢ PHỎNG VẤN (trước đây: Mời nhận việc)
     ===================================================================== */
  /* =====================================================================
     KẾT QUẢ PHỎNG VẤN (đổi tên từ Mời nhận việc – 11/11): danh sách ứng viên đã có kết quả,
     xem trước đúng mẫu thư (Đạt → thư mời nhận việc · Chưa đạt → thư cảm ơn & thông báo), gửi hoặc chuyển thành nhân sự;
     tab Biểu mẫu thư & tiêu chí đánh giá
     ===================================================================== */
  function tdResOf(u, c) {
    var ld = tdLastDone(c), lt = null, res = null, txt = '', tone = '';
    if (c.stage === 'hired') { res = 'pass'; lt = 'nv'; txt = c.nvId ? 'Đã thành nhân sự ' + c.nvId : 'Đồng ý nhận việc – chưa chuyển hồ sơ'; tone = c.nvId ? 'ok' : 'bad'; }
    else if (c.stage === 'offer') { res = 'pass'; lt = 'nv'; var s = tdHasLt(c, 'nv'); txt = !c.offer ? 'Đạt – chưa lập điều kiện mời' : s ? 'Đã gửi thư mời – chờ trả lời' + (c.offer.replyBy ? ' (hạn ' + vn(c.offer.replyBy).slice(0, 5) + ')' : '') : 'Đạt – chưa gửi thư mời'; tone = s ? (c.offer.replyBy && c.offer.replyBy < refDate() ? 'bad' : 'info') : 'warn'; }
    else if (c.stage === 'fail') { if (!ld && !tdHasLt(c, 'tc')) return null; res = 'fail'; lt = 'tc'; txt = tdHasLt(c, 'tc') ? 'Đã gửi thông báo kết quả' : 'Chưa đạt – chưa gửi thông báo'; tone = tdHasLt(c, 'tc') ? 'mute' : 'warn'; }
    else if (c.stage === 'hold') { res = 'hold'; txt = 'Công ty đang cân nhắc – chưa chốt'; tone = 'warn'; }
    else if (c.stage === 'ivcancel') { if (!(c.ivs || []).length) return null; res = 'cancel'; txt = 'Đã hủy phỏng vấn'; tone = 'mute'; }
    else if (c.stage === 'withdraw' && c.offer && c.offer.ans === 'no') { res = 'decline'; txt = 'Từ chối nhận việc'; tone = 'mute'; }
    else if (c.stage === 'iv' && ld && !tdPlanIv(c)) { res = ld.res; lt = ld.res === 'pass' ? 'nv' : ld.res === 'fail' ? 'tc' : null; txt = ld.res === 'pass' ? 'Đạt – chưa lập điều kiện mời' : ld.res === 'fail' ? 'Chưa đạt – chưa gửi thông báo' : 'Cân nhắc – chưa chốt kết quả'; tone = 'warn'; }
    else return null;
    var sent = lt ? !!tdHasLt(c, lt) : null;
    return { res: res, lt: lt, sent: sent, txt: txt, tone: tone, ld: ld };
  }
  var TD_RES = { pass: 'Đạt', hold: 'Cân nhắc', fail: 'Chưa đạt', cancel: 'Hủy phỏng vấn', decline: 'Từ chối nhận việc' };
  var TD_KK = { passto: 'Đạt – chưa gửi thư mời', wait: 'Chờ trả lời thư mời', tonv: 'Đồng ý – chưa thành nhân sự', failto: 'Chưa đạt – chưa gửi thông báo', hold: 'Cân nhắc – chưa chốt' };
  function tdResRows() { var out = []; tdCandAll().forEach(function (x) { var k = tdResOf(x.u, x.c); if (k) { x.k = k; out.push(x); } }); return out; }
  function tdKkOk(x, k) { var c = x.c; return k === 'passto' ? (x.k.res === 'pass' && !x.k.sent && c.stage !== 'hired') : k === 'wait' ? (c.stage === 'offer' && x.k.sent && c.offer && c.offer.ans === 'pending') : k === 'tonv' ? (c.stage === 'hired' && !c.nvId) : k === 'failto' ? (x.k.res === 'fail' && !x.k.sent) : k === 'hold' ? x.k.res === 'hold' : true; }
  PAGES.tdmoi = function () {
    var f = ps('tdk', { tab: 'list', res: '', mail: '', co: '', pb: '', k: '', sel: '', tu: '' }), us = tdUnitsAll();
    if (f.co && !us.some(function (u) { return u.id === f.co; })) f.co = '';
    var tabs = '<div class="td-bar"><div class="seg"><button class="' + (f.tab === 'list' ? 'on' : '') + '" data-act="td-kt" data-id="list">Kết quả & gửi thư</button><button class="' + (f.tab === 'tpl' ? 'on' : '') + '" data-act="td-kt" data-id="tpl">Biểu mẫu thư</button></div></div>';
    var head = '<div class="page-head"><div><h1>Kết quả phỏng vấn</h1><p class="muted">Ứng viên đã có kết quả phỏng vấn: xem trước đúng mẫu thư (Đạt → thư mời nhận việc, Chưa đạt → thư cảm ơn & thông báo kết quả), gửi cho ứng viên, ghi câu trả lời và chuyển người nhận việc thành hồ sơ nhân sự.</p></div></div>';
    if (f.tab === 'tpl') return head + tabs + tdTplPage();
    var all = tdResRows(), cnt = function (k) { return all.filter(function (x) { return tdKkOk(x, k); }).length; };
    var stats = tdStats('td-kk', f.k, [
      { id: 'passto', n: cnt('passto'), label: 'đạt – chưa gửi thư mời', tone: cnt('passto') ? 'warn' : '', icon: 'td_mail' },
      { id: 'wait', n: cnt('wait'), label: 'chờ trả lời thư mời', icon: 'td_cal' },
      { id: 'tonv', n: cnt('tonv'), label: 'đồng ý – chưa thành nhân sự', tone: cnt('tonv') ? 'bad' : '', icon: 'td_arrow' },
      { id: 'failto', n: cnt('failto'), label: 'chưa đạt – chưa gửi thông báo', tone: cnt('failto') ? 'warn' : '', icon: 'td_mail' },
      { id: 'hold', n: cnt('hold'), label: 'cân nhắc – chưa chốt kết quả', icon: 'info' }]);
    var base = all.filter(function (x) { return f.k ? tdKkOk(x, f.k) : true; });
    var byCo = base.filter(function (x) { return !f.co || x.u.id === f.co; });
    var pbs = {}; byCo.forEach(function (x) { pbs[x.r.pb] = (pbs[x.r.pb] || 0) + 1; }); if (f.pb && !pbs[f.pb]) f.pb = '';
    var byPb = byCo.filter(function (x) { return !f.pb || x.r.pb === f.pb; });
    var byRes = byPb.filter(function (x) { return !f.res || x.k.res === f.res; });
    var rows = byRes.filter(function (x) { return !f.mail || (f.mail === 'todo' ? x.k.sent === false : x.k.sent === true); });
    var tone = { warn: 0, bad: 0, info: 1, ok: 2, mute: 3 };
    rows.sort(function (a, b) { return (tone[a.k.tone] - tone[b.k.tone]) || cmp(b.c.at, a.c.at); });
    // 11/11 18:04 anh: Công ty + Phòng ban lên đầu thành khung riêng; Kết quả, Thư ở thanh ngay trên danh sách
    var sec = tdFbox([
      us.length > 1 ? { label: 'Công ty', act: 'td-kco', cur: f.co, items: [['', 'Tất cả', base.length]].concat(us.map(function (u) { return [u.id, shortUnit(u.name), base.filter(function (x) { return x.u === u; }).length]; })) } : null,
      { label: 'Phòng ban', act: 'td-kpb', cur: f.pb, items: [['', 'Tất cả', byCo.length]].concat(Object.keys(pbs).sort(function (a, b) { return cmp(a, b); }).map(function (p) { return [p, p, pbs[p]]; })) }]);
    var fb = sec + '<div class="td-tbox">' + (f.k ? '<div class="td-frow">' + tdFilterChip('Đang lọc: ' + TD_KK[f.k] + ' (' + base.length + ')', 'td-kk') + '</div>' : '') + '<div class="td-frow"><span class="td-flab">Kết quả</span>' + tdPills('td-kres', f.res, [['', 'Tất cả', byPb.length]].concat(['pass', 'hold', 'fail', 'cancel', 'decline'].map(function (r) { return [r, TD_RES[r], byPb.filter(function (x) { return x.k.res === r; }).length]; })), 'st') + '</div>' +
      '<div class="td-frow"><span class="td-flab">Thư</span>' + tdPills('td-kmail', f.mail, [['', 'Tất cả', byRes.length], ['todo', 'Chưa gửi', byRes.filter(function (x) { return x.k.sent === false; }).length], ['sent', 'Đã gửi', byRes.filter(function (x) { return x.k.sent === true; }).length]], 'st') + '</div></div>';
    if (!rows.length) return head + tabs + stats + fb + '<div class="card empty"><h2>Chưa có ứng viên nào ở mục này</h2><p>Khi đánh giá phỏng vấn (Ngân hàng ứng viên → Đánh giá) hoặc chuyển ứng viên sang Mời nhận việc / Chưa phù hợp, ứng viên sẽ hiện ở đây để gửi thư.</p></div>';
    if (!rows.some(function (x) { return x.u.id + '|' + x.c.id === f.sel; })) f.sel = rows[0].u.id + '|' + rows[0].c.id;
    var list = '<div class="td-rlist">' + rows.map(function (x) {
      var s = x.u.id + '|' + x.c.id, sc = x.k.ld ? tdScore(x.k.ld) : null;
      return '<button class="td-ri' + (f.sel === s ? ' on' : '') + '" data-act="td-ksel" data-id="' + esc(s) + '"><span class="td-av">' + esc(tdIni(x.c.name)) + '</span><span class="td-ri-tx"><b>' + esc(x.c.name) + '</b><small>' + esc(x.r.pos) + (us.length > 1 ? ' · ' + esc(shortUnit(x.u.name)) : '') + '</small><span class="td-ri-st"><span class="tag ' + (x.k.res === 'pass' ? 'tag-ok' : x.k.res === 'fail' ? 'tag-bad' : x.k.res === 'hold' ? 'tag-warn' : 'tag-mute') + '">' + TD_RES[x.k.res] + (sc !== null ? ' · ★ ' + String(sc).replace('.', ',') : '') + '</span><span class="td-ri-m t-' + x.k.tone + '">' + esc(x.k.txt) + '</span></span></span></button>';
    }).join('') + '</div>';
    var cur = rows.filter(function (x) { return x.u.id + '|' + x.c.id === f.sel; })[0];
    return head + tabs + stats + fb + '<div class="td-res">' + list + '<div class="td-rpane card card-pad" id="tdRP">' + tdResPane(cur) + '</div></div>';
  };
  function tdResPane(x) {
    var u = x.u, c = x.c, k = x.k, o = c.offer, R = refDate(), ld = k.ld, sc = ld ? tdScore(ld) : null, crit = tdOf(u).cfg.crit || TD_CRIT0;
    var h = '<div class="td-rp-h"><div><h2><a href="#" class="plink" data-act="td-c" data-u="' + u.id + '" data-id="' + c.id + '" title="Mở hồ sơ ứng viên">' + esc(c.name) + '</a></h2><p class="muted">' + esc(x.r.pos) + ' · ' + esc(x.r.pb) + (isMulti() ? ' · ' + esc(shortUnit(u.name)) : '') + ' · ' + esc(tdPhoneFmt(c.phone)) + (c.email ? ' · ' + esc(c.email) : '') + '</p></div><span class="tag ' + (k.res === 'pass' ? 'tag-ok' : k.res === 'fail' ? 'tag-bad' : k.res === 'hold' ? 'tag-warn' : 'tag-mute') + '" style="font-size:13px;padding:4px 10px">' + TD_RES[k.res] + (sc !== null ? ' · ★ ' + String(sc).replace('.', ',') : '') + '</span></div>';
    if (ld) h += '<div class="td-rp-iv"><b>Phỏng vấn ' + vn(ld.date) + ' ' + esc(ld.time || '') + '</b>' + (ld.who ? ' · ' + esc(ld.who) : '') + (sc !== null ? '<div class="td-score">' + Object.keys(ld.score).map(function (q) { return '<span>' + esc(crit[q] || 'Tiêu chí ' + (+q + 1)) + ': <i>' + ld.score[q] + '</i></span>'; }).join('') + '</div>' : '') + '</div>';
    h += tdResultBox(u, c, 'kr', null);
    if (k.res === 'hold') return h + '<div class="notice warn" style="margin-top:12px">' + ic('info') + '<div>Công ty đang cân nhắc. Khi đã quyết định, chọn “Mời nhận việc” hoặc “Chưa phù hợp” ở khung trên rồi bấm Lưu – phần mềm hiện đúng mẫu thư để gửi.</div></div>';
    if (k.res === 'cancel') return h + '<div class="notice" style="margin-top:12px">' + ic('info') + '<div>Đã hủy phỏng vấn. Muốn hẹn lại: mở <a href="#" data-act="td-q" data-x="iv" data-u="' + u.id + '" data-id="' + c.id + '">Hẹn lại phỏng vấn</a>.</div></div>';
    if (k.res === 'decline') return h + '<div class="notice" style="margin-top:12px">' + ic('info') + '<div>Ứng viên đã từ chối thư mời nhận việc' + (o && o.ansAt ? ' (' + tdVnAt(o.ansAt) + ')' : '') + '. Hồ sơ được lưu theo thời hạn đã thông báo, đến ' + vn(tdKeepUntil(u, c)) + '.</div></div>';
    var act = '';
    if (k.lt === 'nv') {
      act += '<div class="td-rp-off"><div class="td-rp-sec"><h3>Điều kiện mời nhận việc</h3><button class="btn btn-sm" data-act="td-q" data-x="offeredit" data-u="' + u.id + '" data-id="' + c.id + '">' + ic('td_edit', 13) + (o ? 'Sửa' : 'Lập điều kiện mời') + '</button></div>' +
        (o ? '<dl class="td-off"><div><dt>Lương chính thức</dt><dd>' + tdMoney(o.sal) + ' đ</dd></div><div><dt>Thử việc</dt><dd>' + (o.probKind === 'none' ? 'Không thử việc' : tdMoney(o.probSal) + ' đ · ' + o.probDays + ' ' + ((TD_PROB.filter(function (p) { return p[0] === o.probKind; })[0] || [])[3] || 'ngày')) + '</dd></div><div><dt>Ngày đi làm</dt><dd>' + vn(o.start) + '</dd></div><div><dt>Hạn trả lời</dt><dd>' + (o.replyBy ? vn(o.replyBy) : '—') + '</dd></div></dl>' : '<div class="notice warn">' + ic('info') + '<div>Chưa có lương, thử việc, ngày đi làm – bấm “Lập điều kiện mời” để thư tự điền và kiểm tra lương thử việc ≥ 85% (Điều 26 BLLĐ 2019).</div></div>') + '</div>';
      if (c.stage === 'offer' && o && tdHasLt(c, 'nv')) act += '<div class="td-rp-ans"><span>Ứng viên trả lời: <b>' + (o.ans === 'yes' ? 'Đồng ý' : o.ans === 'no' ? 'Từ chối' : 'Chưa trả lời') + '</b></span><span class="sp"></span><button class="btn btn-sm btn-primary" data-act="td-q" data-x="ans-yes" data-u="' + u.id + '" data-id="' + c.id + '">Đồng ý nhận việc</button><button class="btn btn-sm" data-act="td-q" data-x="ans-no" data-u="' + u.id + '" data-id="' + c.id + '">Từ chối</button></div>';
      if (c.stage === 'hired') act += '<div class="td-rp-ans ok"><span>' + (c.nvId ? 'Đã tạo hồ sơ nhân sự <b>' + esc(c.nvId) + '</b>' : '<b>Đồng ý nhận việc</b>, đi làm ' + (o ? vn(o.start) : '') + ' – chưa có hồ sơ nhân sự') + '</span><span class="sp"></span>' + (c.nvId ? '<button class="btn btn-sm" data-act="profile" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Mở hồ sơ</button><button class="btn btn-sm btn-primary" data-act="hd-new" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Lập hợp đồng</button>' : '<button class="btn btn-sm btn-primary" data-act="td-q" data-x="tonv" data-u="' + u.id + '" data-id="' + c.id + '">' + ic('td_arrow', 14) + 'Chuyển thành nhân sự</button>') + '</div>';
    }
    if (c.stage === 'hired' && c.nvId) return h + act;
    return h + act + '<div class="td-rp-sec" style="margin-top:14px"><h3>Xem trước: ' + TD_LT[k.lt] + '</h3></div>' + tdLetterHtml(u, c, k.lt, 'kp', true);
  }
  BINDS.tdmoi = function () {
    var f = PS.tdk; if (f.tab === 'tpl') { tdTplBind(); return; }
    var p = f.sel ? f.sel.split('|') : null, u = p && unitById(p[0]), c = u && tdCand(u, p[1]), k = c && tdResOf(u, c), rp = $('#tdRP');
    if (rp && c) tdResultBind(rp, u, c, 'kr', null, function () { render(); });
    if (rp && k && k.lt && $('#kpB', rp)) tdLetterBind(rp, u, c, k.lt, 'kp', function () { render(); toast('Đã ghi nhận gửi ' + TD_LT[k.lt].toLowerCase(), 'ok', c.name); });
  };
  ACTS['td-kt'] = function (a, id) { PS.tdk.tab = id; render(); };
  ACTS['td-kk'] = function (a, id) { var f = PS.tdk; f.k = f.k === id ? '' : id; f.res = ''; f.mail = ''; f.co = ''; f.pb = ''; render(); };
  ACTS['td-kres'] = function (a, id) { PS.tdk.res = id; render(); };
  ACTS['td-kmail'] = function (a, id) { PS.tdk.mail = id; render(); };
  ACTS['td-kco'] = function (a, id) { PS.tdk.co = id; PS.tdk.pb = ''; render(); };
  ACTS['td-kpb'] = function (a, id) { PS.tdk.pb = id; render(); };
  ACTS['td-ksel'] = function (a, id) { PS.tdk.sel = id; render(); var rp = $('#tdRP'); if (rp && window.innerWidth < 1180) setTimeout(function () { rp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); };
  ACTS['td-kfix'] = function (a, id) {
    var p = PS.tdk.sel.split('|'), u = unitById(p[0]), c = u && tdCand(u, p[1]); if (!c) return; var ld = tdLastDone(c); if (!ld) return;
    ld.res = id; tdHist(c, 'Chốt kết quả phỏng vấn: ' + TD_RES[id]); if (id === 'fail') { c.stage = 'fail'; c.endAt = HR.isoToday(); } tdSave(u, 'Chốt kết quả ' + c.id + ': ' + TD_RES[id]); render();
    if (id === 'pass' && !c.offer) tdOfferForm(u, c, function () { render(); }, { noLetter: true });
  };
  ACTS['td-tonv'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdToNv(u, c); };
  ACTS['td-lt'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdLetter(u, c, a.getAttribute('data-t'), function () { render(); }); };
  ACTS['td-ans'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdAnswer(u, c, a.getAttribute('data-a') === 'yes'); };

  /* ---------------- Gắn vào Bảng điều hành + Sơ đồ tổ chức ---------------- */
  function tdOpenByDept(u) { var o = {}; tdOf(u).rq.forEach(function (r) { if (r.st === 'open') (o[r.pb] = o[r.pb] || []).push(r); }); return o; }
  var _tdBindDash = BINDS.dash;
  BINDS.dash = function () {
    if (_tdBindDash) try { _tdBindDash(); } catch (e) { logErr('Bảng điều hành (gốc)', e); }
    try {
      selUnits().forEach(function (u) {
        var by = tdOpenByDept(u);
        Object.keys(by).forEach(function (pb) {
          var box = $$('.db-seats').filter(function (el) { return el.getAttribute('data-dk') === u.name + '|' + pb; })[0]; if (!box) return;
          var n = by[pb].reduce(function (s, r) { return s + tdCandsOf(u, r.id).filter(function (c) { return TD_LIVE.indexOf(c.stage) >= 0; }).length; }, 0);
          $$('.seat.vac', box).forEach(function (s) { s.title = 'Đang tuyển: ' + by[pb].map(function (r) { return r.pos; }).join(', ') + ' · ' + n + ' ứng viên'; var bb = s.querySelector('b'); if (bb) bb.textContent = 'Đang tuyển'; s.style.cursor = 'pointer'; s.addEventListener('click', function () { go('tdnhucau'); }); });
        });
      });
    } catch (e) { logErr('Gắn tuyển dụng vào Bảng điều hành', e); }
  };
  var _tdBindOrg = BINDS.tochuc;
  BINDS.tochuc = function () {
    if (_tdBindOrg) try { _tdBindOrg(); } catch (e) { logErr('Sơ đồ tổ chức (gốc)', e); }
    try {
      selUnits().forEach(function (u) {
        var by = tdOpenByDept(u);
        $$('.od-h[data-act="od-edit"][data-u="' + u.id + '"]').forEach(function (h) {
          var l = by[h.getAttribute('data-id')]; if (!l) return;
          var tg = document.createElement('a'); tg.href = '#tdnhucau'; tg.className = 'tag tag-info'; tg.style.cssText = 'margin:6px 10px 0;display:inline-flex'; tg.textContent = 'Đang tuyển: ' + l.map(function (r) { return r.pos + (r.sl > 1 ? ' (' + r.sl + ')' : ''); }).join(', ');
          tg.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go('tdnhucau'); });
          h.parentNode.insertBefore(tg, h.nextSibling);
        });
      });
    } catch (e) { logErr('Gắn tuyển dụng vào Sơ đồ tổ chức', e); }
  };
