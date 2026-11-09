  /* =====================================================================
     MODULE TUYỂN DỤNG (bản 0.5.1 – NHÁNH RIÊNG, bắt đầu 09/11/2026)
     Anh Tuấn chốt 09/11 16:04: làm đủ rồi anh xem 1 lượt; làm song song Module Lương nên để ở nhánh
     nguon/_nhanh-tuyen-dung/ – chưa tích hợp vào nguon/src. Toàn bộ module nằm trong file này
     (chèn sau phần Lương khi build) để khi ghép chỉ cần thêm 1 file + 1 dòng build.
       1) Nhu cầu tuyển dụng – phiếu do admin lập (không qua cấp duyệt), bật/tắt "Hiện trên cổng"
       2) Cổng tuyển dụng – trang mẫu danh sách vị trí + trang chi tiết vị trí + form ứng tuyển gửi CV.
          Chưa có máy chủ: bản xem trước chạy trong phần mềm, hồ sơ gửi thử đổ thẳng vào Ứng viên trên máy này.
          Phần kết nối Cloudflare để sau (form "Kết nối máy chủ" đã dựng sẵn) – thiết kế ở may-chu/THIET-KE-KET-NOI.md
       3) Ứng viên & phỏng vấn – các bước, lịch phỏng vấn, phiếu đánh giá, 3 biểu mẫu thư
          (mời phỏng vấn · mời nhận việc · cảm ơn & thông báo chưa trúng tuyển), chuyển ứng viên thành nhân sự
       4) Mời nhận việc – theo dõi thư mời, trả lời, ngày đi làm, chuyển hồ sơ, lập HĐ thử việc
     Căn cứ (đã đối chiếu văn bản gốc trong "Văn bản pháp lý"): BLLĐ 45/2019/QH14 Điều 3 khoản 8, Điều 8, 11, 16, 17, 24–27;
     Luật Việc làm 74/2025/QH15 Điều 5. Dữ liệu cá nhân ứng viên: Luật 91/2025/QH15 (chưa trích điều cụ thể).
     Dữ liệu lưu trong u.td (theo từng công ty, lưu cùng dữ liệu công ty trong trình duyệt); CV lưu ở kho file (kho: 'cv').
     ===================================================================== */
  var TD_SEED = '2026-11-09a', TDV = 0, TDA = { key: null, list: [] };
  var TD_STG = [['new', 'Mới nhận'], ['screen', 'Sàng lọc'], ['iv', 'Phỏng vấn'], ['offer', 'Mời nhận việc'], ['hired', 'Đồng ý nhận việc'], ['fail', 'Chưa phù hợp'], ['withdraw', 'Rút hồ sơ']];
  var TD_STN = {}; TD_STG.forEach(function (s) { TD_STN[s[0]] = s[1]; });
  var TD_LIVE = ['new', 'screen', 'iv', 'offer', 'hired'];
  var TD_RST = { draft: 'Nháp', open: 'Đang tuyển', paused: 'Tạm dừng', filled: 'Đã đủ người', closed: 'Đã đóng' };
  var TD_REASON = ['Thay người nghỉ việc', 'Bổ sung theo định biên', 'Mở rộng, thêm vị trí mới', 'Thời vụ', 'Khác'];
  var TD_LD = ['Toàn thời gian', 'Bán thời gian', 'Cộng tác viên'];
  // BLLĐ 2019 Điều 25 – thời gian thử việc tối đa theo loại công việc
  var TD_PROB = [['ql', 'Người quản lý doanh nghiệp', 180, 'ngày', 'khoản 1'], ['cd', 'Công việc cần trình độ từ cao đẳng trở lên', 60, 'ngày', 'khoản 2'], ['tc', 'Trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ', 30, 'ngày', 'khoản 3'], ['khac', 'Công việc khác', 6, 'ngày làm việc', 'khoản 4']];
  var TD_SRC = ['Cổng tuyển dụng', 'Fanpage công ty', 'Nhóm Facebook / Zalo', 'Trang việc làm', 'Người quen giới thiệu', 'Khác'];
  var TD_MODE = ['Trực tiếp tại công ty', 'Trực tuyến (Google Meet / Zoom)', 'Qua điện thoại'];
  var TD_CRIT0 = ['Chuyên môn, kỹ năng', 'Kinh nghiệm liên quan', 'Giao tiếp', 'Thái độ, tinh thần', 'Phù hợp văn hóa công ty'];
  var TD_COLORS = ['#1F5F8B', '#2E7D57', '#8A4B9C', '#B4562B', '#2B6F77'];
  var TD_LT = { pv: 'Thư mời phỏng vấn', nv: 'Thư mời nhận việc', tc: 'Thư cảm ơn & thông báo chưa trúng tuyển' };
  var TD_CV_MAX = 5 * 1024 * 1024;

  // Menu: 4 tính năng Tuyển dụng chạy được; "Tin tuyển dụng" đổi thành "Cổng tuyển dụng" (anh chốt 09/11: trang cổng + trang vị trí)
  MODS.forEach(function (m) { if (m.g === 'td') m.st = 'ok'; if (m.id === 'tdtin') { m.t = 'Cổng tuyển dụng'; m.k += ' cong tuyen dung trang chi tiet vi tri link chia se ung tuyen cv'; } if (m.id === 'tdungvien') m.k += ' thu moi phong van thu cam on chuyen nhan vien'; });
  Object.assign(IC, {
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
  function tdOf(u) {
    if (!u.td) u.td = { v: 1, rq: [], cd: [], cfg: tdCfg0(u) };
    var t = u.td; if (!t.cfg) t.cfg = tdCfg0(u); if (!t.rq) t.rq = []; if (!t.cd) t.cd = [];
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
  function tdPortalLink(u, r) { var c = tdOf(u).cfg; return 'https://tuyendung.quantritute.com/' + c.slug + (r ? '/' + r.slug : ''); }
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
    pv: { s: 'Thư mời phỏng vấn – {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\n{Công ty} cảm ơn Anh/Chị đã quan tâm và gửi hồ sơ ứng tuyển vị trí {Vị trí}. Sau khi xem hồ sơ, chúng tôi trân trọng mời Anh/Chị tham gia buổi phỏng vấn:\n\n• Thời gian: {Giờ phỏng vấn}, ngày {Ngày phỏng vấn}\n• Hình thức: {Hình thức phỏng vấn}\n• Địa điểm / đường dẫn: {Địa điểm phỏng vấn}\n• Người phỏng vấn: {Người phỏng vấn}\n\nKhi đến, Anh/Chị vui lòng mang theo bản sao CCCD và bản sao bằng cấp liên quan (không cần nộp bản chính). Công ty không thu bất kỳ khoản phí nào trong quá trình tuyển dụng.\n\nAnh/Chị vui lòng xác nhận tham gia qua email này hoặc số điện thoại {SĐT liên hệ}. Nếu cần đổi lịch, Anh/Chị cứ báo lại để chúng tôi sắp xếp.\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' },
    nv: { s: 'Thư mời nhận việc – {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\nCảm ơn Anh/Chị đã dành thời gian tham gia phỏng vấn. {Công ty} vui mừng thông báo Anh/Chị đã đạt yêu cầu và trân trọng mời Anh/Chị nhận việc với các thông tin sau:\n\n• Vị trí: {Vị trí} – {Phòng ban}\n• Ngày bắt đầu làm việc: {Ngày đi làm}\n• Địa điểm làm việc: {Địa điểm làm việc}\n• Thời gian làm việc: {Thời gian làm việc}\n• Hình thức: {Loại hợp đồng}\n• Thời gian thử việc: {Thời gian thử việc}\n• Lương trong thời gian thử việc: {Lương thử việc} đồng/tháng\n• Lương sau thử việc: {Lương chính thức} đồng/tháng\n• Chế độ khác: {Chế độ khác}\n\nNgày đầu đi làm, Anh/Chị vui lòng mang theo bản sao CCCD, bản sao bằng cấp và số tài khoản ngân hàng. Công ty chỉ đối chiếu bản chính rồi trả lại ngay, không giữ bản chính giấy tờ.\n\nThư này là lời mời nhận việc; hai bên sẽ ký hợp đồng trước khi Anh/Chị bắt đầu làm việc. Anh/Chị vui lòng phản hồi trước ngày {Hạn trả lời}.\n\nChào mừng Anh/Chị đến với {Công ty}!\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' },
    tc: { s: 'Cảm ơn Anh/Chị đã ứng tuyển vị trí {Vị trí} – {Công ty}', b: 'Chào Anh/Chị {Họ tên},\n\n{Công ty} chân thành cảm ơn Anh/Chị đã quan tâm và dành thời gian cho vị trí {Vị trí}.\n\nSau khi cân nhắc kỹ, chúng tôi rất tiếc chưa thể mời Anh/Chị nhận việc ở đợt tuyển dụng này. Kết quả này chỉ phản ánh mức độ phù hợp với yêu cầu hiện tại của vị trí, không phải đánh giá về năng lực chung của Anh/Chị.\n\nVới sự đồng ý của Anh/Chị khi nộp hồ sơ, chúng tôi lưu hồ sơ đến ngày {Hạn lưu hồ sơ} để liên hệ khi có vị trí phù hợp. Nếu Anh/Chị muốn xóa hồ sơ sớm hơn, vui lòng phản hồi email này hoặc gửi yêu cầu tới {Email liên hệ}.\n\nChúc Anh/Chị sớm tìm được công việc như mong muốn.\n\nTrân trọng,\n{Người liên hệ}\n{Công ty}' }
  };
  var TD_PH = ['Họ tên', 'Vị trí', 'Phòng ban', 'Công ty', 'Ngày phỏng vấn', 'Giờ phỏng vấn', 'Hình thức phỏng vấn', 'Địa điểm phỏng vấn', 'Người phỏng vấn', 'Ngày đi làm', 'Địa điểm làm việc', 'Thời gian làm việc', 'Loại hợp đồng', 'Thời gian thử việc', 'Lương thử việc', 'Lương chính thức', 'Chế độ khác', 'Hạn trả lời', 'Hạn lưu hồ sơ', 'Người liên hệ', 'SĐT liên hệ', 'Email liên hệ'];
  function tdTpl(u, t) { var x = tdOf(u).cfg.tpl[t]; return x && x.b ? x : TD_TPL0[t]; }
  function tdNextIv(c) { var l = (c.ivs || []).filter(function (v) { return v.st === 'plan'; }); return l[l.length - 1] || (c.ivs || [])[(c.ivs || []).length - 1] || null; }
  function tdVals(u, c) {
    var r = tdReq(u, c.rq) || {}, cf = tdOf(u).cfg, iv = tdNextIv(c) || {}, o = c.offer || {};
    var pk = TD_PROB.filter(function (p) { return p[0] === o.probKind; })[0];
    return { 'Họ tên': c.name, 'Vị trí': r.pos || '', 'Phòng ban': r.pb || '', 'Công ty': cf.name, 'Ngày phỏng vấn': iv.date ? vn(iv.date) : '…/…/……', 'Giờ phỏng vấn': iv.time || '…:…', 'Hình thức phỏng vấn': iv.mode || TD_MODE[0], 'Địa điểm phỏng vấn': iv.place || cf.addr || '…', 'Người phỏng vấn': iv.who || cf.contact,
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
      out.push({ u: u, pb: x.name, n: x.vac, kind: 'vac', why: 'Thiếu ' + x.vac + ' so với định biên ' + x.plan + (left[0] ? ' · ' + left[0].e['Họ và tên'] + ' (' + left[0].e['Chức danh công việc'] + ') nghỉ ' + vn(left[0].e['Ngày nghỉ việc']) : ''), thay: left[0] ? left[0].id : '', cd: left[0] ? left[0].e['Chức danh công việc'] : '', has: openPb[x.name] || [] });
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
        (c.ivs || []).forEach(function (v) { if (v.st !== 'plan' || !v.date) return; var d = tdDiff(R, v.date); if (d !== null && d >= 0 && d <= 1) push('td_iv', d === 0 ? 'canh' : 'nhac', 'Phỏng vấn ' + c.name + ' – ' + r.pos + ' lúc ' + (v.time || '') + (d === 0 ? ' hôm nay' : ' ngày mai'), (v.mode || '') + (v.who ? ' · Người phỏng vấn: ' + v.who : '') + ' · Xem ở Tuyển dụng → Ứng viên & phỏng vấn', c.id + v.id, { days: d, due: v.date }); });
        if (c.stage === 'new') { var dn = tdDiff(c.at, R); if (dn !== null && dn >= 3) push('td_new', 'canh', 'Hồ sơ ' + c.name + ' (' + r.pos + ') đã nhận ' + dn + ' ngày, chưa xem', 'Nên phản hồi ứng viên trong vài ngày để không mất người tốt · Tuyển dụng → Ứng viên & phỏng vấn', c.id, { days: -dn }); }
        if (c.stage === 'offer' && c.offer && c.offer.ans !== 'yes' && c.offer.ans !== 'no' && c.offer.replyBy && c.offer.replyBy < R) push('td_offer', 'canh', c.name + ' chưa trả lời thư mời nhận việc (hạn ' + vn(c.offer.replyBy) + ')', 'Gọi lại cho ứng viên hoặc ghi kết quả trả lời ở Tuyển dụng → Mời nhận việc', c.id, { days: tdDiff(R, c.offer.replyBy), due: c.offer.replyBy });
        if (c.stage === 'hired' && !c.nvId && c.offer && c.offer.start) { var ds = tdDiff(R, c.offer.start); if (ds !== null && ds <= 7) push('td_start', ds <= 2 ? 'gap' : 'canh', c.name + ' đi làm từ ' + vn(c.offer.start) + ' – chưa chuyển thành hồ sơ nhân sự', 'Bấm "Chuyển thành nhân sự" ở Tuyển dụng → Mời nhận việc (thông tin tự điền, không nhập lại), rồi lập hợp đồng trước ngày đi làm (BLLĐ 2019 Điều 13, 16).', c.id, { days: ds, due: c.offer.start }); }
        if ((c.stage === 'fail' || c.stage === 'withdraw') && tdKeepUntil(u, c) < R) push('td_keep', 'canh', 'Hồ sơ ' + c.name + ' (' + (r.pos || 'vị trí đã đóng') + ') đã quá thời hạn lưu ' + (t.cfg.keep || 6) + ' tháng', 'Công ty đã thông báo thời hạn lưu cho ứng viên – xóa hồ sơ và CV ở Tuyển dụng → Ứng viên & phỏng vấn → Đã đóng (nút "Xóa hồ sơ quá hạn lưu").', c.id, { days: tdDiff(R, tdKeepUntil(u, c)) });
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
      '.td-tpls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.td-tpl{display:flex;flex-direction:column;gap:8px}.td-tpl pre{white-space:pre-wrap;font:inherit;font-size:12.5px;line-height:1.5;color:var(--ink-2);background:var(--surface-2);border-radius:var(--r);padding:10px 12px;max-height:260px;overflow:auto;margin:0}',
      '.td-portal{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}.td-portal>div{min-width:0}.td-url{min-width:0}.td-side{display:flex;flex-direction:column;gap:14px}',
      '.td-browser{border:1px solid var(--line-2);border-radius:12px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow-pop)}.td-bbar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface-2);border-bottom:1px solid var(--line)}.td-bbar i{width:10px;height:10px;border-radius:50%;background:var(--line-2);flex:none}.td-url{flex:1;min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.td-stage{background:repeating-conic-gradient(var(--surface-2) 0 25%,var(--surface) 0 50%) 0 0/18px 18px;display:flex;justify-content:center;overflow:hidden;position:relative}.td-frame{border:none;display:block;width:100%;height:760px;background:#fff}.td-stage.pc .td-frame{width:1280px;height:880px;transform-origin:0 0;position:absolute;left:0;top:0}.td-stage.mob{padding:18px 0}.td-stage.mob .td-frame{width:390px;height:760px;border-radius:24px;box-shadow:0 0 0 8px #1d2329,0 12px 40px rgba(0,0,0,.25)}',
      '.td-links{display:flex;flex-direction:column;gap:10px}.td-link{border:1px solid var(--line);border-radius:var(--r);padding:10px 12px;display:flex;flex-direction:column;gap:6px}.td-link b{font-size:13.5px}.td-link code{font-size:11.5px;color:var(--muted);overflow-wrap:anywhere}.td-link .link-row{margin:0;gap:6px}',
      '.td-srv .field{margin-bottom:8px}.td-srv-st{display:flex;gap:8px;align-items:center;font-size:13px;font-weight:600;color:var(--warn);margin-bottom:8px}.td-srv-st i{width:9px;height:9px;border-radius:50%;background:var(--warn)}',
      '.td-full{position:fixed;inset:0;z-index:300;background:rgba(10,14,18,.72);display:flex;flex-direction:column}.td-full .td-bbar{background:#1d2329;border:none;color:#cfd6dc}.td-full .td-url{background:#2a3138;border-color:#2a3138;color:#cfd6dc}.td-full iframe{flex:1;border:none;background:#fff;width:100%}.td-full .btn{height:30px}',
      '.td-moi .hd-ti{display:grid;grid-template-columns:40px minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.15fr) minmax(150px,auto);align-items:center;gap:14px}',
      '.td-off{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 14px;font-size:13px}.td-off dt{color:var(--muted);font-size:12px}.td-off dd{margin:0 0 4px;font-weight:600}',
      '@media (max-width:1180px){.td-kpi{grid-template-columns:repeat(3,minmax(0,1fr))}.td-kpi>div:nth-child(4){border-left:none}.td-kpi>div:nth-child(n+4){border-top:1px solid var(--line)}.td-portal{grid-template-columns:1fr}.td-tpls{grid-template-columns:1fr}.td-cm{grid-template-columns:1fr}.td-letter{grid-template-columns:1fr}}',
      '@media (max-width:720px){.td-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.td-kpi>div{border-left:none;border-top:1px solid var(--line)}.td-kpi>div:nth-child(-n+2){border-top:none}.td-kpi>div:nth-child(even){border-left:1px solid var(--line)}.td-g2,.td-g3,.td-off{grid-template-columns:1fr}.td-reqs{grid-template-columns:1fr}.td-board{grid-template-columns:repeat(5,minmax(240px,1fr))}.td-frame{height:640px}.td-stage.mob .td-frame{width:100%;border-radius:0;box-shadow:none}.td-stage.mob{padding:0}.td-kv{grid-template-columns:100px 1fr}.td-moi .hd-ti{grid-template-columns:40px 1fr}.td-moi .hd-ti>*:nth-child(n+3){grid-column:2}.td-moi .hd-ti .link-row{justify-content:flex-start!important}}'
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
  PAGES.tdnhucau = function () {
    var f = ps('tdn', { f: 'open' }), R = refDate(), us = tdUnitsAll();
    var all = []; us.forEach(function (u) { tdOf(u).rq.forEach(function (r) { all.push({ u: u, r: r }); }); });
    var open = all.filter(function (x) { return x.r.st === 'open'; }), live = open.filter(function (x) { return tdLive(x.r, R); });
    var need = open.reduce(function (s, x) { return s + Math.max(0, x.r.sl - tdHiredCount(x.u, x.r)); }, 0);
    var cands = open.reduce(function (s, x) { return s + tdCandsOf(x.u, x.r.id).length; }, 0);
    var soon = open.filter(function (x) { var d = x.r.deadline ? tdDiff(R, x.r.deadline) : null; return d !== null && d <= 7; }).length;
    var kpi = '<div class="td-kpi"><div><b>' + open.length + '</b><span>vị trí đang tuyển</span></div><div><b>' + live.length + '</b><span>đang hiện trên cổng</span></div><div class="' + (need ? 'k-warn' : '') + '"><b>' + need + '</b><span>người còn cần tuyển</span></div><div><b>' + cands + '</b><span>hồ sơ của vị trí đang tuyển</span></div><div class="' + (soon ? 'k-warn' : '') + '"><b>' + soon + '</b><span>sắp hết / đã hết hạn nộp</span></div></div>';
    var sug = []; us.forEach(function (u) { sug = sug.concat(tdSuggest(u)); });
    var sugH = sug.length ? '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>Gợi ý từ định biên và người sắp nghỉ</h3><p>So số người đang làm với định biên trong Danh mục phòng ban, cộng người có ngày nghỉ việc trong 60 ngày tới</p></div></div><div class="td-sug">' + sug.map(function (s) {
      return '<div class="td-sug-i"><div><b>' + esc(s.pb) + (isMulti() ? ' · ' + esc(shortUnit(s.u.name)) : '') + '</b><small>' + esc(s.why) + (s.has.length ? ' · đã có phiếu ' + s.has.map(function (r) { return r.id + ' (' + TD_RST[r.st].toLowerCase() + ')'; }).join(', ') : '') + '</small></div>' +
        (s.has.length ? '<button class="btn btn-sm" data-act="td-req-edit" data-u="' + s.u.id + '" data-id="' + s.has[0].id + '">Mở phiếu</button>' : '<button class="btn btn-sm btn-primary" data-act="td-req-new" data-u="' + s.u.id + '" data-pb="' + esc(s.pb) + '" data-thay="' + esc(s.thay) + '" data-cd="' + esc(s.cd) + '" data-n="' + s.n + '" data-r="' + (s.kind === 'vac' ? (s.thay ? 'Thay người nghỉ việc' : 'Bổ sung theo định biên') : 'Thay người nghỉ việc') + '">' + ic('td_plus', 14) + 'Lập phiếu</button>') + '</div>';
    }).join('') + '</div></div>' : '';
    var rows = tdReqRows(f.f), cnt = function (k) { return tdReqRows(k).length; };
    var bar = '<div class="td-bar"><div class="seg">' + [['open', 'Đang tuyển'], ['wait', 'Nháp, tạm dừng'], ['done', 'Đã đủ người, đã đóng'], ['all', 'Tất cả']].map(function (s) { return '<button class="' + (f.f === s[0] ? 'on' : '') + '" data-act="td-nf" data-id="' + s[0] + '">' + s[1] + ' (' + cnt(s[0]) + ')</button>'; }).join('') + '</div><span class="sp"></span><button class="btn" data-go="tdtin">' + ic('eye', 15) + 'Xem cổng tuyển dụng</button></div>';
    return '<div class="page-head"><div><h1>Nhu cầu tuyển dụng</h1><p class="muted">Mỗi phiếu là một vị trí cần tuyển, ghi đủ thông tin để đăng lên cổng tuyển dụng. Bật “Hiện trên cổng” để ứng viên thấy và nộp hồ sơ.</p></div><div class="link-row" style="margin:0"><button class="btn btn-primary" data-act="td-req-new">' + ic('td_plus', 15) + 'Lập phiếu nhu cầu</button></div></div>' +
      kpi + sugH + bar + (rows.length ? '<div class="td-reqs">' + rows.map(function (x) { return tdReqCard(x.u, x.r); }).join('') + '</div>' : '<div class="card empty"><h2>Chưa có phiếu nào ở mục này</h2><p>Bấm “Lập phiếu nhu cầu” để bắt đầu, hoặc dùng gợi ý từ định biên ở trên.</p></div>');
  };
  ACTS['td-nf'] = function (a, id) { ps('tdn', {}).f = id; render(); };
  ACTS['td-req-new'] = function (a) { var u = a.getAttribute('data-u') ? unitById(a.getAttribute('data-u')) : selUnits()[0]; if (!u) return; tdReqForm(u, null, { pb: a.getAttribute('data-pb') || '', thay: a.getAttribute('data-thay') || '', cd: a.getAttribute('data-cd') || '', sl: +a.getAttribute('data-n') || 1, reason: a.getAttribute('data-r') || '' }); };
  ACTS['td-req-edit'] = function (a, id) { var u = unitById(a.getAttribute('data-u')); if (u) tdReqForm(u, tdReq(u, id)); };
  ACTS['td-req-cands'] = function (a, id) { var f = ps('tdu', { view: 'board', rq: '', q: '', src: '', closed: false }); f.rq = a.getAttribute('data-u') + '|' + id; go('tdungvien'); };
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
      return '<div class="td-form">' + (isNew ? tdUnitPick(us, u.id) : '') +
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
    var foot = '<div class="link-row nv-foot" style="margin-top:16px">' + (isNew ? '<span></span>' : '<span class="link-row" style="margin:0"><button class="btn" id="rDup">Nhân bản phiếu</button>' + (tdCandsOf(u, r.id).length ? '' : '<button class="btn btn-danger-ghost" id="rDel">Xóa phiếu</button>') + '</span>') + '<span class="link-row" style="margin:0"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="rSave">' + (isNew ? 'Lưu phiếu' : 'Lưu thay đổi') + '</button></span></div>';
    var m = modal(isNew ? 'Lập phiếu nhu cầu tuyển dụng' : r.pos, isNew ? 'Phiếu do người quản trị lập, không qua cấp duyệt. Trường có dấu * là bắt buộc.' : r.id + ' · ' + TD_RST[r.st] + (isMulti() ? ' · ' + shortUnit(u.name) : ''), '<div id="rBody">' + body(u) + '</div>' + foot);
    m.querySelector('.modal').classList.add('lg');
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
    return { mode: mode || 'preview', u: u.id, co: { name: cf.name, short: cf.short, tag: cf.tag, intro: cf.intro, addr: cf.addr, email: cf.email, phone: tdPhoneFmt(cf.phone), contact: cf.contact, policy: cf.policy, keep: cf.keep, color: cf.color, why: cf.why || [], steps: tdLines(cf.steps) }, jobs: jobs, base: tdPortalLink(u), api: cf.srv && cf.srv.on ? cf.srv.url : '' };
  }
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
      'function head(){return(D.mode==="preview"?\'<div class="pv">Bản xem trước của cổng tuyển dụng – hồ sơ gửi ở đây được lưu thẳng vào phần mềm trên máy này (chưa kết nối máy chủ)</div>\':"")+\'<header class="top"><div class="wrap"><div class="logo">\'+esc(ini)+\'</div><div class="brand"><b>\'+esc(D.co.short)+\'</b><small>Tuyển dụng</small></div><span class="sp"></span><nav><a href="#" data-home>Vị trí đang tuyển</a><a href="#ve-chung-toi" data-about>Về chúng tôi</a></nav></div></header>\'}' +
      'function foot(){return\'<footer><div class="wrap"><span>© \'+new Date().getFullYear()+" "+esc(D.co.name)+(D.co.addr?" · "+esc(D.co.addr):"")+\'</span><span>\'+(D.co.phone?"☎ "+esc(D.co.phone)+" · ":"")+(D.co.email?esc(D.co.email)+" · ":"")+(D.co.policy?\'<a href="\'+esc(D.co.policy)+\'" target="_blank" rel="noopener">Chính sách xử lý dữ liệu cá nhân</a>\':"")+\'</span></div></footer>\'}' +
      'function chips(j){return\'<div class="chips"><span>\'+I.team+esc(j.pb)+\'</span><span class="sal">\'+I.money+esc(j.sal)+\'</span><span>\'+I.clock+esc(j.ld)+\'</span>\'+(j.deadline?\'<span>\'+I.cal+"Hạn nộp "+esc(j.deadline)+\'</span>\':"")+\'</div>\'}' +
      'function list(){cur=null;var pbs={};D.jobs.forEach(function(j){pbs[j.pb]=1});var Q=q.toLowerCase();var js=D.jobs.filter(function(j){return(!pb||j.pb===pb)&&(!Q||(j.pos+" "+j.pb+" "+j.desc.join(" ")).toLowerCase().indexOf(Q)>=0)});' +
      'app.innerHTML=head()+\'<section class="hero"><div class="wrap"><small>Cơ hội nghề nghiệp</small><h1>Cùng \'+esc(D.co.short)+\' làm nên những điều tử tế</h1><p>\'+esc(D.co.tag||"")+\'</p><div class="find"><input id="q" placeholder="Tìm vị trí, ví dụ: nhân sự, giảng viên…" value="\'+esc(q)+\'"><select id="pb"><option value="">Tất cả bộ phận</option>\'+Object.keys(pbs).map(function(p){return\'<option\'+(p===pb?" selected":"")+\'>\'+esc(p)+\'</option>\'}).join("")+\'</select></div></div></section>\'+' +
      '\'<main><div class="wrap"><div class="sec-t"><h2>Vị trí đang tuyển</h2><span>\'+js.length+" vị trí"+\'</span></div>\'+(js.length?\'<div class="jobs">\'+js.map(function(j){return\'<button class="job" data-job="\'+esc(j.id)+\'"><div><h3>\'+esc(j.pos)+(j.left!==null&&j.left<=5?\'<span class="new hot">Sắp hết hạn</span>\':"")+(j.sl>1?\'<span class="new">Cần \'+j.sl+" người</span>":"")+\'</h3>\'+chips(j)+\'</div><span class="go">Xem chi tiết \'+I.arr+\'</span></button>\'}).join("")+\'</div>\':\'<div class="empty">\'+(D.jobs.length?"Không có vị trí phù hợp với tìm kiếm.":"Hiện chưa có vị trí đang tuyển. Bạn quay lại sau nhé!")+\'</div>\')+' +
      '\'<div class="why">\'+D.co.why.map(function(w){return\'<div><b>\'+I.star+\'</b>\'+esc(w)+\'</div>\'}).join("")+\'</div>\'+(D.co.intro?\'<div class="about" id="ve-chung-toi"><h2>Về \'+esc(D.co.short)+\'</h2><p style="margin:0">\'+esc(D.co.intro)+\'</p></div>\':"")+\'</div></main>\'+foot();' +
      'var qi=$("#q");qi.addEventListener("input",function(){q=qi.value;var p=qi.selectionStart;list();var n=$("#q");n.focus();try{n.setSelectionRange(p,p)}catch(e){}});$("#pb").addEventListener("change",function(){pb=this.value;list()});window.scrollTo(0,0)}' +
      'function blk(t,l){return l&&l.length?\'<div class="card blk"><h2>\'+t+\'</h2><ul>\'+l.map(function(x){return"<li>"+esc(x)+"</li>"}).join("")+\'</ul></div>\':""}' +
      'function job(j){cur=j;app.innerHTML=head()+\'<main><div class="wrap"><div class="crumb"><button data-home>← Tất cả vị trí</button></div><div class="dt"><div><div class="card"><h1>\'+esc(j.pos)+\'</h1>\'+chips(j)+\'<div class="facts"><div><small>Số lượng</small><b>\'+j.sl+" người</b></div><div><small>Thu nhập</small><b>"+esc(j.sal)+\'</b></div><div><small>Địa điểm</small><b>\'+esc(j.place)+\'</b></div><div><small>Thời gian làm việc</small><b>\'+esc(j.time||"")+\'</b></div><div><small>Hạn nhận hồ sơ</small><b>\'+esc(j.deadline||"Đến khi đủ người")+\'</b></div><div><small>Thử việc</small><b>\'+(j.prob?"Tối đa "+j.prob+(j.prob===6?" ngày làm việc":" ngày"):"Không")+\'</b></div></div><div class="share"><button data-share="copy">Sao chép link</button><button data-share="fb">Chia sẻ Facebook</button><button data-share="zalo">Gửi qua Zalo</button></div></div>\'+' +
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
      'FILE.arrayBuffer().then(function(buf){if(window.parent&&window.parent!==window&&D.mode==="preview"){var tm=setTimeout(function(){fail("Phần mềm chưa nhận được hồ sơ – thử lại.")},6000);window.__tdok=function(c){clearTimeout(tm);done(c)};window.parent.postMessage({type:"qtt-td-apply",u:D.u,d:data,file:{name:FILE.name,type:FILE.type,size:FILE.size,buf:buf}},"*",[buf])}' +
      'else if(D.api){var fd=new FormData();Object.keys(data).forEach(function(k){fd.append(k,data[k])});fd.append("cv",FILE);fetch(D.api.replace(/\\/$/,"")+"/api/ung-tuyen",{method:"POST",body:fd}).then(function(r){return r.json()}).then(function(r){if(r&&r.ok)done(r.code);else fail((r&&r.msg)||"Chưa gửi được hồ sơ, vui lòng thử lại.")}).catch(function(){fail("Mất kết nối, vui lòng thử lại.")})}' +
      'else fail("Đây là trang mẫu, chưa kết nối máy chủ nên hồ sơ chưa được gửi đi.")})})}' +
      'function alertBox(t){var d=document.createElement("div");d.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1d2329;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;z-index:50;max-width:90%";d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},4200)}' +
      'window.addEventListener("message",function(e){if(e.data&&e.data.type==="qtt-td-ok"&&window.__tdok)window.__tdok(e.data.code)});' +
      'document.addEventListener("click",function(e){var t=e.target.closest("[data-job],[data-home],[data-share],[data-goapply],[data-about]");if(!t)return;if(t.hasAttribute("data-about")){if(cur){e.preventDefault();list();setTimeout(function(){var a=$("#ve-chung-toi");if(a)a.scrollIntoView()},30)}return}e.preventDefault();' +
      'if(t.hasAttribute("data-job")){var j=D.jobs.filter(function(x){return x.id===t.getAttribute("data-job")})[0];if(j)job(j)}else if(t.hasAttribute("data-home"))list();else if(t.hasAttribute("data-goapply"))$("#ung-tuyen").scrollIntoView({behavior:"smooth"});' +
      'else{var link=D.base+"/"+cur.slug;if(D.mode==="preview")alertBox(t.getAttribute("data-share")==="copy"?"Link dự kiến: "+link+" (mở được khi cổng kết nối máy chủ)":"Chia sẻ hoạt động khi cổng đã có link thật trên máy chủ");else if(t.getAttribute("data-share")==="copy"){try{navigator.clipboard.writeText(location.href);alertBox("Đã sao chép link")}catch(x){}}else if(t.getAttribute("data-share")==="fb")window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(location.href));else window.open("https://zalo.me/share?u="+encodeURIComponent(location.href))}});' +
      'var sj=START.job&&D.jobs.filter(function(x){return x.id===START.job})[0];if(sj)job(sj);else list()})();';
    return '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tuyển dụng – ' + esc(D.co.short) + '</title><meta name="description" content="' + esc('Các vị trí đang tuyển tại ' + D.co.name) + '"><link rel="stylesheet" href="https://quantritute.com/assets/fonts/fonts.css?v=20261103"><style>' + css + '</style></head><body><div id="app"></div><script>' + js + SC + '</body></html>';
  }
  // Nhận hồ sơ gửi từ bản xem trước (iframe) → thêm vào Ứng viên, lưu CV vào kho file
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'qtt-td-apply') return;
    var fr = $$('iframe.td-frame').filter(function (f) { return f.contentWindow === e.source; })[0]; if (!fr) return;
    var u = unitById(d.u); if (!u) return;
    var t = tdOf(u), r = tdReq(u, d.d.job); if (!r) return;
    var c = { id: tdNext(t.cd, 'UV', 4), rq: r.id, name: d.d.name.replace(/(^|\s)(\S)/g, function (x, a, b) { return a + b.toUpperCase(); }), phone: d.d.phone, email: d.d.email, exp: d.d.exp, src: d.d.src || 'Cổng tuyển dụng', at: HR.isoToday(), stage: 'new', ivs: [], letters: [], hist: [], note: '',
      consent: { at: tdNow(), ver: 'xem-thu', how: 'Tích ô đồng ý trên cổng tuyển dụng (bản xem trước trên máy này)', text: d.d.consentText || '' } };
    tdHist(c, 'Nộp hồ sơ qua cổng tuyển dụng (bản xem trước) – biết tin qua: ' + c.src);
    t.cd.push(c);
    var p = Promise.resolve();
    if (d.file && d.file.buf) { var id = khoId(); c.cv = id; c.cvName = d.file.name; p = khoPut({ id: id, u: u.id, nv: c.id, kho: 'cv', ref: 'CV', name: d.file.name, type: d.file.type || 'application/pdf', size: d.file.size, at: tdNow().replace(' ', 'T'), blob: new Blob([d.file.buf], { type: d.file.type || 'application/pdf' }) }).catch(function (er) { logErr('Lưu CV ứng viên', er); c.cv = null; }); }
    p.then(function () { tdSave(u, 'Nhận hồ sơ ' + c.id + ' ' + c.name + ' – ' + r.pos + ' (cổng xem trước)'); try { e.source.postMessage({ type: 'qtt-td-ok', code: c.id }, '*'); } catch (x) { } toast('Có hồ sơ mới: ' + c.name, 'ok', r.pos + ' · đã vào Ứng viên & phỏng vấn (bước Mới nhận)' + (c.cv ? ', kèm CV' : '')); renderNav(); });
  });

  PAGES.tdtin = function () {
    var us = tdUnitsAll(), f = ps('tdc', { page: 'list', job: '', dev: window.innerWidth < 720 ? 'mob' : 'pc', u: '' }); if (!us.some(function (x) { return x.id === f.u; })) f.u = us[0] ? us[0].id : '';
    var u = unitById(f.u); if (!u) return '';
    var t = tdOf(u), cf = t.cfg, R = refDate(), live = t.rq.filter(function (r) { return tdLive(r, R); });
    if (f.page === 'job' && !live.some(function (r) { return r.id === f.job; })) { var rj = tdReq(u, f.job); if (!rj || !tdLive(rj, R)) { f.page = live.length ? 'job' : 'list'; f.job = live[0] ? live[0].id : ''; } }
    var url = tdPortalLink(u, f.page === 'job' ? tdReq(u, f.job) : null);
    var bar = '<div class="td-bar">' + (us.length > 1 ? '<div class="field"><label for="tdCU">Công ty</label><select class="input" id="tdCU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), u.id); }).join('') + '</select></div>' : '') +
      '<div class="field"><label>Trang</label><div class="seg"><button class="' + (f.page === 'list' ? 'on' : '') + '" data-act="td-cp" data-id="list">Danh sách vị trí</button><button class="' + (f.page === 'job' ? 'on' : '') + '" data-act="td-cp" data-id="job"' + (live.length ? '' : ' disabled') + '>Trang vị trí</button></div></div>' +
      (f.page === 'job' && live.length ? '<div class="field"><label for="tdCJ">Vị trí</label><select class="input" id="tdCJ">' + live.map(function (r) { return opt(r.id, r.pos, f.job); }).join('') + '</select></div>' : '') +
      '<div class="field"><label>Thiết bị</label><div class="seg"><button class="' + (f.dev === 'pc' ? 'on' : '') + '" data-act="td-cd" data-id="pc">' + ic('td_pc', 15) + ' Máy tính</button><button class="' + (f.dev === 'mob' ? 'on' : '') + '" data-act="td-cd" data-id="mob">' + ic('td_phone', 15) + ' Điện thoại</button></div></div><span class="sp"></span>' +
      '<button class="btn" data-act="td-cfull">' + ic('td_full', 15) + 'Xem toàn màn hình</button></div>';
    var prev = '<div class="td-browser"><div class="td-bbar"><i></i><i></i><i></i><span class="td-url" title="Link dự kiến – mở được khi cổng kết nối máy chủ">🔒 ' + esc(url.replace(/^https:\/\//, '')) + '</span><span class="tag tag-warn">Xem trước</span></div><div class="td-stage' + (f.dev === 'mob' ? ' mob' : ' pc') + '" id="tdStage"><iframe class="td-frame" id="tdFrame" title="Bản xem trước cổng tuyển dụng" sandbox="allow-scripts allow-forms allow-popups"></iframe></div></div>';
    var links = '<div class="card card-pad"><div class="card-head"><div><h3>Link chia sẻ</h3><p>' + live.length + ' vị trí đang hiện trên cổng. Link là link dự kiến – mở được khi cổng kết nối máy chủ.</p></div></div><div class="td-links"><div class="td-link"><b>Trang danh sách vị trí</b><code>' + esc(tdPortalLink(u)) + '</code><div class="link-row"><button class="btn btn-sm" data-act="td-clink" data-u="' + u.id + '">' + ic('td_link', 14) + 'Sao chép link</button></div></div>' +
      live.map(function (r) { return '<div class="td-link"><b>' + esc(r.pos) + '</b><code>' + esc(tdPortalLink(u, r)) + '</code><div class="link-row"><button class="btn btn-sm" data-act="td-clink" data-u="' + u.id + '" data-id="' + r.id + '">' + ic('td_link', 14) + 'Sao chép link</button><button class="btn btn-sm" data-act="td-req-post" data-u="' + u.id + '" data-id="' + r.id + '">' + ic('td_copy', 14) + 'Tin đăng</button></div></div>'; }).join('') +
      (live.length ? '' : '<p class="muted" style="margin:0">Chưa có vị trí nào hiện trên cổng. Vào <a href="#tdnhucau" data-go="tdnhucau">Nhu cầu tuyển dụng</a> → bật “Hiện trên cổng”.</p>') + '</div></div>';
    var info = '<div class="card card-pad"><div class="card-head"><div><h3>Thông tin công ty trên cổng</h3><p>Tên, giới thiệu, màu, liên hệ, chính sách dữ liệu, thời hạn lưu hồ sơ</p></div></div>' +
      '<dl class="td-kv"><dt>Tên hiển thị</dt><dd>' + esc(cf.short) + '</dd><dt>Liên hệ</dt><dd>' + esc(cf.contact) + (cf.phone ? '<br>' + esc(tdPhoneFmt(cf.phone)) : '') + (cf.email ? '<br>' + esc(cf.email) : '') + '</dd><dt>Chính sách dữ liệu</dt><dd>' + (cf.policy ? '<a href="' + esc(cf.policy) + '" target="_blank" rel="noopener">' + esc(cf.policy) + '</a>' : '<span class="miss">Chưa có – cần thêm trước khi nhận hồ sơ</span>') + '</dd><dt>Lưu hồ sơ</dt><dd>' + (cf.keep || 6) + ' tháng sau khi có kết quả</dd></dl>' +
      '<div class="link-row" style="margin-top:12px"><button class="btn btn-sm btn-primary" data-act="td-cfg" data-u="' + u.id + '">' + ic('td_edit', 14) + 'Sửa thông tin</button></div></div>';
    var srv = cf.srv || {};
    var server = '<div class="card card-pad td-srv"><div class="card-head"><div><h3>Kết nối máy chủ</h3><p>Đưa cổng lên Cloudflare để ứng viên mở link thật, nộp CV từ điện thoại</p></div></div><div class="td-srv-st"><i></i>Chưa kết nối – đang dùng bản xem trước trên máy này</div>' +
      '<div class="field"><label for="tdSU">Địa chỉ máy chủ</label><input class="input" id="tdSU" value="' + esc(srv.url || '') + '" placeholder="https://tuyendung.quantritute.com"></div><div class="field"><label for="tdSK">Mã kết nối của công ty</label><input class="input" id="tdSK" value="' + esc(srv.key || '') + '" placeholder="Cấp khi đăng ký cổng"></div>' +
      '<div class="link-row"><button class="btn btn-sm" data-act="td-srv" data-u="' + u.id + '">' + ic('td_srv', 14) + 'Lưu & thử kết nối</button><button class="btn btn-sm" data-act="td-sync" disabled title="Hoạt động khi đã kết nối">Đưa vị trí lên cổng</button><button class="btn btn-sm" data-act="td-sync" disabled title="Hoạt động khi đã kết nối">Lấy hồ sơ mới</button></div>' +
      '<p class="muted" style="font-size:12px;margin:10px 0 0">Khi kết nối: vị trí bật “Hiện trên cổng” tự đưa lên; hồ sơ, CV ứng viên nộp được lưu trên máy chủ (có ghi thời điểm đồng ý) rồi tự đổ về Ứng viên & phỏng vấn.</p></div>';
    return '<div class="page-head"><div><h1>Cổng tuyển dụng</h1><p class="muted">Trang tuyển dụng riêng của công ty: danh sách vị trí đang bật ở Nhu cầu tuyển dụng, trang chi tiết từng vị trí để chia sẻ, ứng viên đọc và nộp CV ngay trên trang.</p></div></div>' + bar +
      '<div class="td-portal"><div>' + prev + '<p class="muted" style="font-size:12.5px;margin:8px 2px 0">Thử nộp hồ sơ ngay trong khung xem trước: hồ sơ vào thẳng <a href="#tdungvien" data-go="tdungvien">Ứng viên & phỏng vấn</a> trên máy này. Mọi chữ, màu, vị trí trên trang lấy từ phiếu nhu cầu và thông tin công ty.</p></div><div class="td-side">' + links + info + server + '</div></div>';
  };
  BINDS.tdtin = function () {
    var f = PS.tdc, u = unitById(f.u); if (!u) return;
    var fr = $('#tdFrame'); if (fr) fr.srcdoc = tdPortalHtml(tdPortalData(u, 'preview'), f.page === 'job' ? { job: f.job } : {});
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
    bg.querySelector('iframe').srcdoc = tdPortalHtml(tdPortalData(u, 'preview'), f.page === 'job' ? { job: f.job } : {});
    function close() { bg.remove(); document.removeEventListener('keydown', k); if (curPage === 'tdtin') render(); }
    function k(e) { if (e.key === 'Escape') close(); }
    $('#tdFX', bg).addEventListener('click', close); document.addEventListener('keydown', k);
  };
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
      '<h4>Dữ liệu cá nhân ứng viên</h4><div class="td-g2">' + field('cPolicy', 'Link chính sách xử lý dữ liệu cá nhân *', cf.policy, ' placeholder="https://…/chinh-sach-du-lieu"') + field('cKeep', 'Thời hạn lưu hồ sơ không trúng tuyển (tháng)', cf.keep, ' inputmode="numeric"') + '</div>' +
      '<div class="notice" style="margin-top:10px">' + ic('info') + '<div>Form ứng tuyển thu họ tên, số điện thoại, email, CV. Ứng viên phải đọc được chính sách và tích đồng ý trước khi gửi (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 – em chưa trích được điều cụ thể, cần đối chiếu văn bản gốc). Thời hạn lưu do công ty quyết định, ghi rõ trong ô đồng ý và thư cảm ơn.</div></div></div>' +
      '<div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="cSave">Lưu</button></div>');
    m.querySelector('.modal').classList.add('lg');
    $('#cSave', m).addEventListener('click', function () {
      var v = function (k) { return ($('#' + k, m).value || '').trim(); };
      var pol = v('cPolicy'); if (pol && !/^https?:\/\//i.test(pol)) { toast('Link chính sách cần bắt đầu bằng https://', 'err'); return; }
      var kp = +v('cKeep'); if (!(kp >= 1 && kp <= 60)) { toast('Thời hạn lưu là số tháng từ 1 đến 60', 'err'); return; }
      var em = v('cEmail'); if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('Email chưa đúng', 'err'); return; }
      Object.assign(cf, { name: v('cName') || cf.name, short: v('cShort') || cf.short, tag: v('cTag'), intro: v('cIntro'), why: tdLines(v('cWhy')).slice(0, 6), steps: v('cSteps'), addr: v('cAddr'), contact: v('cContact'), phone: tdPhone(v('cPhone')), email: em, color: v('cColor') || cf.color, slug: tdSlug(v('cSlug') || cf.short), policy: pol, keep: kp });
      tdSave(u, 'Sửa thông tin công ty trên cổng tuyển dụng'); m.close(); render(); toast('Đã lưu thông tin cổng tuyển dụng', 'ok');
    });
  }

  /* =====================================================================
     3) ỨNG VIÊN & PHỎNG VẤN
     ===================================================================== */
  function tdDup(u, c) { var p = tdPhone(c.phone), e = String(c.email || '').toLowerCase(); return tdOf(u).cd.filter(function (x) { return x !== c && ((p && tdPhone(x.phone) === p) || (e && String(x.email || '').toLowerCase() === e)); }); }
  function tdExNv(u, c) { var p = tdPhone(c.phone); if (!p) return null; return u.data.NV.filter(function (e) { return tdPhone(e['Số điện thoại']) === p; })[0] || null; }
  function tdScore(v) { var k = Object.keys(v.score || {}); if (!k.length) return null; var s = 0; k.forEach(function (i) { s += +v.score[i] || 0; }); return Math.round(s / k.length * 10) / 10; }
  function tdLastScore(c) { var l = (c.ivs || []).filter(function (v) { return v.st === 'done' && tdScore(v) !== null; }); return l.length ? tdScore(l[l.length - 1]) : null; }
  function tdCandRows(f) {
    var out = [], q = norm(f.q);
    tdUnitsAll().forEach(function (u) { tdOf(u).cd.forEach(function (c) { var r = tdReq(u, c.rq) || { pos: '(phiếu đã xóa)', pb: '' }; out.push({ u: u, c: c, r: r }); }); });
    return out.filter(function (x) { return (!f.rq || f.rq === x.u.id + '|' + x.c.rq) && (!f.src || x.c.src === f.src) && (!q || norm([x.c.name, x.c.phone, x.c.email, x.r.pos, x.c.id].join(' ')).indexOf(q) >= 0); });
  }
  function tdCandCard(x) {
    var c = x.c, u = x.u, R = refDate(), tags = [], iv = (c.ivs || []).filter(function (v) { return v.st === 'plan'; })[0], sc = tdLastScore(c);
    if (iv) tags.push('<span class="tag ' + (iv.date === R ? 'tag-warn' : 'tag-info') + '">' + ic('td_cal', 12) + (iv.date === R ? 'Hôm nay ' : vn(iv.date).slice(0, 5) + ' ') + esc(iv.time || '') + '</span>');
    if (sc !== null) tags.push('<span class="tag tag-ok">★ ' + String(sc).replace('.', ',') + '</span>');
    if (tdDup(u, c).length) tags.push('<span class="tag tag-warn">Nộp trùng</span>');
    if (tdExNv(u, c)) tags.push('<span class="tag tag-info">Từng làm ở công ty</span>');
    if (c.consent === null || c.consent === undefined) tags.push('<span class="tag tag-bad">Chưa có đồng ý dữ liệu</span>');
    if (c.stage === 'offer' && c.offer) tags.push('<span class="tag tag-mute">' + (c.offer.ans === 'no' ? 'Từ chối' : 'Chờ trả lời') + '</span>');
    if (c.stage === 'hired') tags.push(c.nvId ? '<span class="tag tag-ok">Đã thành nhân sự ' + esc(c.nvId) + '</span>' : '<span class="tag tag-warn">Chưa chuyển hồ sơ</span>');
    if (!c.cv) tags.push('<span class="tag tag-mute">Chưa có CV</span>');
    var dn = tdDiff(c.at, R);
    return '<button class="td-cc" data-act="td-c" data-u="' + u.id + '" data-id="' + c.id + '"><div class="td-cc-h"><span class="td-av">' + esc(tdIni(c.name)) + '</span><div><b>' + esc(c.name) + (c.starred ? ' <span style="color:var(--dom)">★</span>' : '') + '</b><small>' + esc(x.r.pos) + '</small></div></div>' +
      '<small class="muted">' + esc(c.src || '') + ' · nộp ' + (dn === 0 ? 'hôm nay' : dn === 1 ? 'hôm qua' : dn + ' ngày trước') + (isMulti() ? ' · ' + esc(shortUnit(u.name)) : '') + '</small>' + (tags.length ? '<div class="td-tags">' + tags.join('') + '</div>' : '') + '</button>';
  }
  PAGES.tdungvien = function () {
    var f = ps('tdu', { view: 'board', rq: '', q: '', src: '', closed: false }), R = refDate(), us = tdUnitsAll();
    var rows = tdCandRows(f), all = tdCandRows({ q: '', rq: '', src: '' });
    var cnt = function (s) { return all.filter(function (x) { return x.c.stage === s; }).length; };
    var ivs = []; all.forEach(function (x) { (x.c.ivs || []).forEach(function (v) { if (v.st === 'plan' && v.date >= R && tdDiff(R, v.date) <= 7) ivs.push({ x: x, v: v }); }); }); ivs.sort(function (a, b) { return cmp(a.v.date + a.v.time, b.v.date + b.v.time); });
    var stale = all.filter(function (x) { return x.c.stage === 'new' && tdDiff(x.c.at, R) >= 3; }).length;
    var kpi = '<div class="td-kpi"><div class="' + (stale ? 'k-warn' : '') + '"><b>' + cnt('new') + '</b><span>hồ sơ mới' + (stale ? ' · ' + stale + ' chờ quá 3 ngày' : '') + '</span></div><div><b>' + cnt('screen') + '</b><span>đang sàng lọc</span></div><div><b>' + cnt('iv') + '</b><span>đang phỏng vấn</span></div><div class="' + (ivs.length ? 'k-warn' : '') + '"><b>' + ivs.length + '</b><span>lịch phỏng vấn 7 ngày tới</span></div><div><b>' + (cnt('offer') + cnt('hired')) + '</b><span>đã mời / đồng ý nhận việc</span></div></div>';
    var ivH = ivs.length ? '<div class="card card-pad" style="margin-bottom:16px"><div class="card-head"><div><h3>Lịch phỏng vấn sắp tới</h3></div></div><div class="td-ivs">' + ivs.map(function (o) { return '<button class="td-iv" data-act="td-c" data-u="' + o.x.u.id + '" data-id="' + o.x.c.id + '"><span class="ev-cal' + (o.v.date === R ? ' lv-canh' : '') + '"><small>Th' + (+o.v.date.slice(5, 7)) + '</small><b>' + (+o.v.date.slice(8, 10)) + '</b></span><span><b>' + esc(o.x.c.name) + '</b><small>' + (o.v.date === R ? 'Hôm nay ' : '') + esc(o.v.time || '') + ' · ' + esc(o.x.r.pos) + '</small><br><small>' + esc(o.v.mode || '') + '</small></span></button>'; }).join('') + '</div></div>' : '';
    var rqOpts = [['', 'Tất cả vị trí']]; us.forEach(function (u) { tdOf(u).rq.forEach(function (r) { rqOpts.push([u.id + '|' + r.id, (isMulti() ? shortUnit(u.name) + ' · ' : '') + r.pos + (r.st !== 'open' ? ' (' + TD_RST[r.st].toLowerCase() + ')' : '')]); }); });
    var bar = '<div class="td-bar filters card card-pad" style="margin-bottom:14px">' + searchBox('tdQ', f.q, 'Tên, số điện thoại, email…') + selectBox('tdR', 'Vị trí', rqOpts, f.rq, 240) + selectBox('tdS', 'Nguồn', [['', 'Tất cả nguồn']].concat(TD_SRC.map(function (s) { return [s, s]; })), f.src) +
      '</div>';
    var seg = '<div class="td-bar"><div class="seg"><button class="' + (f.view === 'board' ? 'on' : '') + '" data-act="td-uv" data-id="board">Theo bước</button><button class="' + (f.view === 'list' ? 'on' : '') + '" data-act="td-uv" data-id="list">Danh sách</button><button class="' + (f.view === 'tpl' ? 'on' : '') + '" data-act="td-uv" data-id="tpl">Biểu mẫu thư & tiêu chí</button></div></div>';
    var body;
    if (f.view === 'tpl') body = tdTplPage();
    else if (f.view === 'list') body = table('tdCand', [
      { t: 'Mã', f: function (x) { return x.c.id; }, mono: 1 }, { t: 'Họ và tên', f: function (x) { return x.c.name; }, h: function (x) { return '<a href="#" class="plink" data-act="td-c" data-u="' + x.u.id + '" data-id="' + x.c.id + '">' + esc(x.c.name) + '</a>'; } },
      { t: 'Vị trí', f: function (x) { return x.r.pos; } }, { t: 'Bước', f: function (x) { return TD_STN[x.c.stage]; }, s: function (x) { return TD_STG.map(function (s) { return s[0]; }).indexOf(x.c.stage); } },
      { t: 'Điện thoại', f: function (x) { return tdPhoneFmt(x.c.phone); }, mono: 1 }, { t: 'Email', f: function (x) { return x.c.email || ''; } }, { t: 'Nguồn', f: function (x) { return x.c.src || ''; } },
      { t: 'Ngày nộp', f: function (x) { return x.c.at; } }, { t: 'Điểm PV', f: function (x) { return tdLastScore(x.c); }, r: 1 }, { t: 'Đồng ý dữ liệu', f: function (x) { return x.c.consent ? 'Có – ' + tdVnAt(x.c.consent.at) : 'Chưa ghi nhận'; } },
      { t: 'Công ty', f: function (x) { return shortUnit(x.u.name); }, hide: !isMulti() }
    ], rows, { title: 'Danh sach ung vien', limit: 300 });
    else {
      var cols = TD_LIVE.map(function (s) { var l = rows.filter(function (x) { return x.c.stage === s; }).sort(function (a, b) { return cmp(b.c.at, a.c.at); }); return '<div class="td-col"><div class="td-col-h">' + TD_STN[s] + '<em>' + l.length + '</em></div>' + l.map(tdCandCard).join('') + (s === 'new' ? '<button class="btn btn-sm" data-act="td-c-add" style="justify-content:center">' + ic('td_plus', 14) + 'Thêm ứng viên</button>' : '') + '</div>'; }).join('');
      var cl = rows.filter(function (x) { return x.c.stage === 'fail' || x.c.stage === 'withdraw'; });
      var expired = cl.filter(function (x) { return tdKeepUntil(x.u, x.c) < R; });
      body = '<div class="td-board">' + cols + '</div><div class="card card-pad td-closed"><div class="card-head"><div><h3>Đã đóng: ' + cnt('fail') + ' chưa phù hợp · ' + cnt('withdraw') + ' rút hồ sơ</h3><p>Hồ sơ được lưu theo thời hạn công ty đã thông báo cho ứng viên' + (expired.length ? ' · <b style="color:var(--warn)">' + expired.length + ' hồ sơ đã quá hạn lưu</b>' : '') + '</p></div><div class="link-row" style="margin:0">' + (expired.length ? '<button class="btn btn-sm" data-act="td-purge">' + ic('td_trash', 14) + 'Xóa hồ sơ quá hạn lưu (' + expired.length + ')</button>' : '') + '<button class="btn btn-sm" data-act="td-closed">' + (f.closed ? 'Ẩn' : 'Xem') + '</button></div></div>' +
        (f.closed ? (cl.length ? '<div class="td-reqs" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">' + cl.map(tdCandCard).join('') + '</div>' : '<p class="muted">Chưa có hồ sơ nào.</p>') : '') + '</div>';
    }
    return '<div class="page-head"><div><h1>Ứng viên & phỏng vấn</h1><p class="muted">Mọi hồ sơ ở một chỗ – từ cổng tuyển dụng, fanpage, nhóm Zalo hay người giới thiệu. Bấm vào ứng viên để hẹn phỏng vấn, đánh giá, gửi thư và chuyển thành nhân sự.</p></div><div class="link-row" style="margin:0"><button class="btn" data-act="td-imp">' + ic('nhap', 15) + 'Nhập từ Excel</button><button class="btn" disabled title="Hoạt động khi cổng tuyển dụng đã kết nối máy chủ">' + ic('td_srv', 15) + 'Lấy hồ sơ từ cổng</button><button class="btn btn-primary" data-act="td-c-add">' + ic('td_plus', 15) + 'Thêm ứng viên</button></div></div>' + kpi + ivH + seg + (f.view === 'tpl' ? '' : bar) + body;
  };
  BINDS.tdungvien = function () {
    var f = PS.tdu; var q = $('#tdQ'), tm = null;
    if (q) q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { f.q = q.value; var p = q.selectionStart; render(); var n = $('#tdQ'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (e) { } } }, 250); });
    var r = $('#tdR'); if (r) r.addEventListener('change', function () { f.rq = r.value; render(); });
    var s = $('#tdS'); if (s) s.addEventListener('change', function () { f.src = s.value; render(); });
    tdTplBind();
  };
  ACTS['td-uv'] = function (a, id) { PS.tdu.view = id; render(); };
  ACTS['td-closed'] = function () { PS.tdu.closed = !PS.tdu.closed; render(); };
  ACTS['td-c'] = function (a, id, e) { if (e) e.preventDefault(); var u = unitById(a.getAttribute('data-u')); if (u && tdCand(u, id)) tdCandOpen(u, id); };
  ACTS['td-c-add'] = function () { tdCandForm(selUnits()[0], null); };
  ACTS['td-purge'] = function () {
    var R = refDate(), list = []; tdUnitsAll().forEach(function (u) { tdOf(u).cd.forEach(function (c) { if ((c.stage === 'fail' || c.stage === 'withdraw') && tdKeepUntil(u, c) < R) list.push({ u: u, c: c }); }); });
    if (!list.length) return;
    confirmBox('Xóa ' + list.length + ' hồ sơ quá hạn lưu?', 'Xóa hẳn thông tin và CV của: ' + list.map(function (x) { return x.c.name; }).join(', ') + '. Không khôi phục được. Nhật ký chỉ ghi mã hồ sơ, không ghi thông tin cá nhân.', 'Xóa hồ sơ', function () {
      list.forEach(function (x) { tdDelCand(x.u, x.c, true); }); list.map(function (x) { return x.u; }).filter(function (u, i, a) { return a.indexOf(u) === i; }).forEach(function (u) { tdSave(u, 'Xóa hồ sơ quá hạn lưu: ' + list.filter(function (x) { return x.u === u; }).map(function (x) { return x.c.id; }).join(', ')); });
      render(); toast('Đã xóa ' + list.length + ' hồ sơ quá hạn lưu', 'ok');
    });
  };
  function tdDelCand(u, c, quiet) { var t = tdOf(u); if (c.cv) khoDel(c.cv).catch(function () { }); KHO.meta.filter(function (fm) { return fm.u === u.id && fm.nv === c.id && fm.kho === 'cv'; }).forEach(function (fm) { khoDel(fm.id).catch(function () { }); }); t.cd = t.cd.filter(function (x) { return x !== c; }); if (!quiet) tdSave(u, 'Xóa hồ sơ ứng viên ' + c.id); }

  // ---- Thêm / sửa ứng viên ----
  function tdCandForm(u, c, after) {
    var isNew = !c, us = selUnits(), x = c || { name: '', phone: '', email: '', yob: '', edu: '', exp: '', src: TD_SRC[1], at: HR.isoToday(), rq: '', link: '', consent: null };
    function body(u) {
      var rqs = tdOf(u).rq.filter(function (r) { return r.st !== 'closed' || r.id === x.rq; });
      return '<div class="td-form">' + (isNew ? tdUnitPick(us, u.id) : '') + '<div class="td-g2">' +
        selectBox('cRq', 'Vị trí ứng tuyển *', [['', '— Chọn vị trí —']].concat(rqs.map(function (r) { return [r.id, r.pos + ' (' + TD_RST[r.st].toLowerCase() + ')']; })), x.rq || (PS.tdu && PS.tdu.rq && PS.tdu.rq.split('|')[0] === u.id ? PS.tdu.rq.split('|')[1] : '')) +
        field('cName', 'Họ và tên *', x.name) + field('cPhone', 'Số điện thoại *', x.phone ? tdPhoneFmt(x.phone) : '', ' inputmode="tel"') + field('cEmail', 'Email', x.email) +
        field('cYob', 'Năm sinh', x.yob || '', ' inputmode="numeric" placeholder="Không bắt buộc"') + field('cEdu', 'Trình độ', x.edu || '', ' placeholder="Đại học, Cao đẳng…"') +
        selectBox('cSrc', 'Nguồn hồ sơ', TD_SRC.map(function (s) { return [s, s]; }), x.src) + dbox('cAt', x.at, 'Ngày nhận hồ sơ') +
        '<div class="field" style="grid-column:1/-1"><label for="cExp">Kinh nghiệm, ghi chú ngắn</label><input class="input" id="cExp" value="' + esc(x.exp || '') + '"></div>' +
        '<div class="field" style="grid-column:1/-1"><label for="cLink">Link hồ sơ (nếu có)</label><input class="input" id="cLink" value="' + esc(x.link || '') + '" placeholder="Link Google Drive, LinkedIn…"></div></div>' +
        (isNew ? '<div class="field" style="margin-top:10px"><label>CV (PDF hoặc ảnh, tối đa 5 MB)</label><input type="file" id="cCv" accept=".pdf,image/*" class="input" style="padding:7px"></div>' : '') +
        '<label class="td-chk" style="margin-top:12px"><input type="checkbox" id="cCons"' + (x.consent ? ' checked' : '') + '> Ứng viên đã đồng ý cho công ty xử lý dữ liệu cá nhân để tuyển dụng <span class="muted">(ví dụ: tích ô đồng ý trên form, ghi trong email gửi hồ sơ)</span></label>' +
        '<div class="field" style="margin-top:6px"><label for="cConsHow">Cách ghi nhận đồng ý</label><input class="input" id="cConsHow" value="' + esc(x.consent ? x.consent.how || '' : '') + '" placeholder="Ví dụ: Ứng viên đồng ý trong email gửi hồ sơ ngày …"></div></div>';
    }
    var m = modal(isNew ? 'Thêm ứng viên' : 'Sửa thông tin ' + c.name, isNew ? 'Hồ sơ nhận qua fanpage, nhóm Zalo, email, người giới thiệu… Trường có dấu * là bắt buộc.' : c.id, '<div id="cBody">' + body(u) + '</div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="cSave">' + (isNew ? 'Thêm ứng viên' : 'Lưu') + '</button></div>');
    m.querySelector('.modal').classList.add('lg');
    function bind() { $$('.dbox', m).forEach(bindDbox); var up = $('#tdU', m); if (up) up.addEventListener('change', function () { u = unitById(up.value); $('#cBody', m).innerHTML = body(u); bind(); }); }
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
      var file = isNew && $('#cCv', m).files && $('#cCv', m).files[0];
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
      var steps = '<div class="td-steps">' + TD_LIVE.map(function (s, i) { return '<button class="' + (c.stage === s ? 'on' : idx > i ? 'done' : '') + '" data-st="' + s + '">' + (idx > i ? '✓ ' : '') + TD_STN[s] + '</button>'; }).join('') + '<span class="gap"></span>' + ['fail', 'withdraw'].map(function (s) { return '<button class="end' + (c.stage === s ? ' on' : '') + '" data-st="' + s + '">' + TD_STN[s] + '</button>'; }).join('') + '</div>';
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
        (c.link ? '<dt>Link hồ sơ</dt><dd><a href="' + esc(c.link) + '" target="_blank" rel="noopener">' + esc(c.link) + '</a></dd>' : '') + '<dt>Hạn lưu hồ sơ</dt><dd>' + (c.stage === 'fail' || c.stage === 'withdraw' ? vn(tdKeepUntil(u, c)) + (tdKeepUntil(u, c) < R ? ' <span class="tag tag-warn">đã quá hạn</span>' : '') : '<span class="muted">Tính từ khi có kết quả (' + (tdOf(u).cfg.keep || 6) + ' tháng)</span>') + '</dd></dl>' +
        '<div class="field" style="margin-top:12px"><label for="tdNote">Ghi chú nội bộ</label><textarea class="input" id="tdNote" style="min-height:64px;width:100%">' + esc(c.note || '') + '</textarea></div></div>';
      var ivH = (c.ivs || []).map(function (v, i) {
        var sc = tdScore(v), crit = tdOf(u).cfg.crit || TD_CRIT0;
        return '<div class="td-ivr"><div class="td-ivr-h"><b>Vòng ' + (i + 1) + ' · ' + vn(v.date) + ' ' + esc(v.time || '') + '</b>' + (v.st === 'plan' ? '<span class="tag ' + (v.date === R ? 'tag-warn' : v.date < R ? 'tag-bad' : 'tag-info') + '">' + (v.date === R ? 'Hôm nay' : v.date < R ? 'Đã qua – chưa đánh giá' : 'Đã hẹn') + '</span>' : v.st === 'cancel' ? '<span class="tag tag-mute">Đã hủy</span>' : '<span class="tag ' + (v.res === 'pass' ? 'tag-ok' : v.res === 'fail' ? 'tag-bad' : 'tag-warn') + '">' + (v.res === 'pass' ? 'Đạt' : v.res === 'fail' ? 'Chưa đạt' : 'Cân nhắc') + (sc !== null ? ' · ★ ' + String(sc).replace('.', ',') : '') + '</span>') + '</div>' +
          '<small class="muted">' + esc(v.mode || '') + (v.place ? ' · ' + esc(v.place) : '') + (v.who ? ' · ' + esc(v.who) : '') + '</small>' +
          (v.st === 'done' && sc !== null ? '<div class="td-score">' + Object.keys(v.score).map(function (k) { return '<span>' + esc(crit[k] || 'Tiêu chí ' + (+k + 1)) + ': <i>' + v.score[k] + '</i></span>'; }).join('') + '</div>' : '') + (v.note ? '<div>' + esc(v.note) + '</div>' : '') +
          '<div class="link-row" style="margin:0">' + (v.st !== 'cancel' ? '<button class="btn btn-sm' + (v.st === 'plan' && v.date <= R ? ' btn-primary' : '') + '" data-iv="' + i + '" data-x="eval">' + (v.st === 'done' ? 'Sửa đánh giá' : 'Đánh giá') + '</button>' : '') + (v.st === 'plan' ? '<button class="btn btn-sm" data-iv="' + i + '" data-x="ivedit">Đổi lịch</button><button class="btn btn-sm" data-iv="' + i + '" data-x="ivcancel">Hủy lịch</button>' : '') + '</div></div>';
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
      else if (x === 'eval') tdEvalForm(u, c, i, draw);
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
    function apply() { var old = c.stage; c.stage = s; if (s === 'fail' || s === 'withdraw') c.endAt = HR.isoToday(); else delete c.endAt; tdHist(c, 'Chuyển bước: ' + TD_STN[old] + ' → ' + TD_STN[s]); tdSave(u, c.id + ' → ' + TD_STN[s]); cb && cb(); render();
      if (s === 'fail' && !(c.letters || []).some(function (l) { return l.t === 'tc'; })) toast('Nhớ gửi thư cảm ơn cho ' + c.name, 'info', 'Bấm "Thư cảm ơn, chưa trúng tuyển" trong hồ sơ ứng viên – thư có sẵn thời hạn lưu hồ sơ và cách yêu cầu xóa.');
      if (s === 'iv' && !(c.ivs || []).some(function (v) { return v.st === 'plan'; })) toast('Hẹn lịch phỏng vấn cho ' + c.name, 'info', 'Bấm "Hẹn phỏng vấn", rồi gửi Thư mời phỏng vấn.');
    }
    if (s === 'offer' && !c.offer) { tdOfferForm(u, c, function () { cb && cb(); }); return; }
    if (s === 'hired' && (!c.offer || !c.offer.start)) { toast('Cần lập điều kiện mời nhận việc trước', 'info', 'Có ngày đi làm thì mới chuyển được sang Đồng ý nhận việc.'); tdOfferForm(u, c, cb); return; }
    if (s === 'hired' && c.offer) { c.offer.ans = 'yes'; c.offer.ansAt = c.offer.ansAt || tdNow(); }
    apply();
  }
  function tdIvForm(u, c, i, cb) {
    var v = i === null ? { date: tdAdd(refDate(), 2), time: '09:00', mode: TD_MODE[0], place: tdOf(u).cfg.addr, who: tdOf(u).cfg.contact, st: 'plan' } : c.ivs[i];
    var m = modal(i === null ? 'Hẹn phỏng vấn – ' + c.name : 'Đổi lịch phỏng vấn – ' + c.name, (tdReq(u, c.rq) || {}).pos || '', '<div class="td-form"><div class="td-g2">' + dbox('ivD', v.date, 'Ngày phỏng vấn *') + field('ivT', 'Giờ *', v.time, ' placeholder="09:00" maxlength="5"') + selectBox('ivM', 'Hình thức', TD_MODE.map(function (s) { return [s, s]; }), v.mode) + field('ivW', 'Người phỏng vấn', v.who) + '<div class="field" style="grid-column:1/-1"><label for="ivP">Địa điểm hoặc đường dẫn họp trực tuyến</label><input class="input" id="ivP" value="' + esc(v.place || '') + '"></div></div>' +
      '<label class="td-chk" style="margin-top:12px"><input type="checkbox" id="ivL" checked> Soạn Thư mời phỏng vấn ngay sau khi lưu</label></div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="ivS">Lưu lịch</button></div>', true);
    $$('.dbox', m).forEach(bindDbox);
    $('#ivS', m).addEventListener('click', function () {
      var d = $('#ivD', m)._get(), t = $('#ivT', m).value.trim().replace(/[h.]/i, ':'); if (/^\d{1,2}$/.test(t)) t += ':00'; if (/^\d:\d\d$/.test(t)) t = '0' + t;
      if (!d) { toast('Ngày phỏng vấn chưa đúng', 'err', 'Nhập dd/mm/yyyy.'); return; } if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) { toast('Giờ chưa đúng', 'err', 'Ví dụ 09:00, 14:30.'); return; }
      var o = { date: d, time: t, mode: $('#ivM', m).value, who: $('#ivW', m).value.trim(), place: $('#ivP', m).value.trim() };
      if (i === null) { c.ivs = c.ivs || []; c.ivs.push(Object.assign({ id: 'pv' + Date.now().toString(36), st: 'plan' }, o)); tdHist(c, 'Hẹn phỏng vấn vòng ' + c.ivs.length + ': ' + t + ' ' + vn(d)); } else { Object.assign(c.ivs[i], o); tdHist(c, 'Đổi lịch phỏng vấn vòng ' + (i + 1) + ': ' + t + ' ' + vn(d)); }
      if (TD_LIVE.indexOf(c.stage) < 2 || c.stage === 'fail' || c.stage === 'withdraw') c.stage = 'iv';
      tdSave(u, 'Lịch phỏng vấn ' + c.id); var go2 = $('#ivL', m).checked; m.close(); cb && cb(); render(); if (go2) tdLetter(u, c, 'pv', cb);
    });
  }
  function tdEvalForm(u, c, i, cb) {
    var v = c.ivs[i], crit = tdOf(u).cfg.crit || TD_CRIT0, sc = Object.assign({}, v.score || {}), res = v.res || '';
    var m = modal('Đánh giá phỏng vấn – ' + c.name, 'Vòng ' + (i + 1) + ' · ' + vn(v.date) + ' · chấm 1 (chưa đạt) đến 5 (rất tốt) theo cùng bộ tiêu chí', '<div class="td-crit" id="evC">' + crit.map(function (k, j) { return '<span>' + esc(k) + '</span><div class="td-stars" data-k="' + j + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" class="' + (+sc[j] === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div>'; }).join('') + '</div>' +
      '<div class="field" style="margin-top:14px"><label for="evN">Nhận xét</label><textarea class="input" id="evN" style="width:100%;min-height:80px">' + esc(v.note || '') + '</textarea></div>' +
      '<div class="field"><label>Kết quả</label><div class="seg" id="evR"><button type="button" data-r="pass" class="' + (res === 'pass' ? 'on' : '') + '">Đạt</button><button type="button" data-r="hold" class="' + (res === 'hold' ? 'on' : '') + '">Cân nhắc</button><button type="button" data-r="fail" class="' + (res === 'fail' ? 'on' : '') + '">Chưa đạt</button></div></div>' +
      '<p class="muted" style="font-size:12px">Bộ tiêu chí chung sửa ở Ứng viên & phỏng vấn → Biểu mẫu thư → Tiêu chí đánh giá.</p><div class="link-row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="evS">Lưu đánh giá</button></div>', true);
    $('#evC', m).addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; var g = b.parentNode; sc[g.getAttribute('data-k')] = +b.getAttribute('data-n'); $$('button', g).forEach(function (x) { x.classList.toggle('on', x === b); }); });
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
  function tdOfferForm(u, c, cb) {
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
      '<label class="td-chk" style="margin-top:10px"><input type="checkbox" id="oL" checked> Soạn Thư mời nhận việc ngay sau khi lưu</label></div><div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="oS">Lưu điều kiện</button></div>');
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
      var go2 = $('#oL', m).checked; m.close(); cb && cb(); render(); if (go2) tdLetter(u, c, 'nv', cb);
    });
  }
  // ---- Soạn thư ----
  function tdLetter(u, c, t, cb) {
    var tp = tdTpl(u, t), V = tdVals(u, c), subj = tdFill(tp.s, V), body = tdFill(tp.b, V), miss = (subj + body).match(/…/g);
    var warn = [];
    if (t === 'pv' && !(c.ivs || []).some(function (v) { return v.st === 'plan'; })) warn.push('Chưa có lịch phỏng vấn – bấm “Hẹn phỏng vấn” trước để thư tự điền ngày giờ.');
    if (t === 'nv' && !c.offer) warn.push('Chưa lập điều kiện mời nhận việc – thư chưa có lương, ngày đi làm.');
    if (t === 'nv' && !c.consent) warn.push('Chưa ghi nhận ứng viên đồng ý xử lý dữ liệu.');
    if (miss) warn.push('Còn ' + miss.length + ' chỗ “…” chưa có thông tin – điền tay trước khi gửi.');
    var m = modal(TD_LT[t] + ' – ' + c.name, (c.email || 'Chưa có email') + ' · ' + tdPhoneFmt(c.phone), (warn.length ? '<div class="notice warn" style="margin-bottom:12px">' + ic('info') + '<div>' + warn.map(esc).join('<br>') + '</div></div>' : '') +
      '<div class="td-letter"><div><div class="field"><label for="ltS">Tiêu đề</label><input class="input" id="ltS" value="' + esc(subj) + '"></div><div class="field"><label for="ltB">Nội dung (sửa trực tiếp được)</label><textarea class="input" id="ltB" style="width:100%">' + esc(body) + '</textarea></div></div>' +
      '<div><div class="td-sec"><h3>Gửi thư</h3><p class="muted" style="font-size:12.5px;margin:0 0 10px">Phần mềm chưa tự gửi email. Chọn một cách gửi; thư được ghi vào lịch sử ứng viên.</p><div class="link-row" style="flex-direction:column;align-items:stretch;gap:8px;margin:0">' +
      '<button class="btn btn-primary" id="ltM"' + (c.email ? '' : ' disabled title="Ứng viên chưa có email"') + '>' + ic('td_mail', 15) + 'Mở ứng dụng email</button><button class="btn" id="ltC">' + ic('td_copy', 15) + 'Sao chép để gửi Zalo / SMS</button><button class="btn" id="ltP">' + ic('td_print', 15) + 'In / lưu PDF</button></div></div>' +
      '<div class="td-sec"><h3>Mẫu thư</h3><p class="muted" style="font-size:12.5px;margin:0">Sửa mẫu dùng chung cho mọi ứng viên ở Ứng viên & phỏng vấn → Biểu mẫu thư.</p></div></div></div>');
    m.querySelector('.modal').classList.add('lg');
    function mark(ch) { (c.letters = c.letters || []).push({ t: t, at: tdNow(), ch: ch }); tdHist(c, 'Gửi ' + TD_LT[t].toLowerCase() + ' – ' + ch); tdSave(u, 'Gửi ' + TD_LT[t] + ' cho ' + c.id + ' (' + ch + ')'); if (t === 'nv' && c.offer && !c.offer.sentAt) c.offer.sentAt = tdNow(); cb && cb(); }
    $('#ltM', m).addEventListener('click', function () { var s = $('#ltS', m).value, b = $('#ltB', m).value; var href = 'mailto:' + encodeURIComponent(c.email) + '?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(b); if (href.length > 1900) { tdCopy(b, 'nội dung thư'); href = 'mailto:' + encodeURIComponent(c.email) + '?subject=' + encodeURIComponent(s); toast('Thư dài – đã sao chép nội dung', 'info', 'Ứng dụng email mở với tiêu đề sẵn; dán (Ctrl V) nội dung vào thân thư.'); } var a = document.createElement('a'); a.href = href; a.click(); mark('Email'); m.close(); });
    $('#ltC', m).addEventListener('click', function () { tdCopy($('#ltB', m).value, 'nội dung thư'); mark('Zalo / SMS'); });
    $('#ltP', m).addEventListener('click', function () {
      var cf = tdOf(u).cfg, w = window.open('', '_blank'); if (!w) { toast('Trình duyệt chặn cửa sổ mới', 'err', 'Cho phép cửa sổ bật lên rồi bấm lại.'); return; }
      w.document.write('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc($('#ltS', m).value) + '</title><style>body{font-family:"Times New Roman",serif;font-size:13.5pt;line-height:1.55;max-width:680px;margin:40px auto;padding:0 24px;color:#111}.h{display:flex;justify-content:space-between;border-bottom:2px solid ' + esc(cf.color) + ';padding-bottom:10px;margin-bottom:24px}.h b{font-size:15pt;color:' + esc(cf.color) + '}.h small{color:#555;font-size:10.5pt;text-align:right}h1{font-size:15pt;text-align:center;text-transform:uppercase;margin:0 0 22px}p{white-space:pre-wrap;margin:0}@media print{body{margin:0 auto}}</style></head><body><div class="h"><b>' + esc(cf.name) + '</b><small>' + esc(cf.addr || '') + '<br>' + esc([tdPhoneFmt(cf.phone), cf.email].filter(Boolean).join(' · ')) + '</small></div><h1>' + esc(TD_LT[t]) + '</h1><p>' + esc($('#ltB', m).value) + '</p><script>setTimeout(function(){print()},300)<' + '/script></body></html>');
      w.document.close(); mark('In / PDF');
    });
  }
  // ---- Biểu mẫu thư (sửa mẫu dùng chung) + tiêu chí đánh giá ----
  function tdTplUnit() { var us = tdUnitsAll(), f = PS.tdu; if (!f.tu || !us.some(function (x) { return x.id === f.tu; })) f.tu = us[0] ? us[0].id : ''; return unitById(f.tu); }
  function tdTplPage() {
    var u = tdTplUnit(); if (!u) return '';
    var us = selUnits(), cf = tdOf(u).cfg;
    return (us.length > 1 ? '<div class="td-bar"><div class="field"><label for="tdTU">Mẫu của công ty</label><select class="input" id="tdTU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), u.id); }).join('') + '</select></div></div>' : '') +
      '<div class="td-tpls">' + ['pv', 'nv', 'tc'].map(function (t) { var tp = tdTpl(u, t), own = cf.tpl[t] && cf.tpl[t].b; return '<div class="card card-pad td-tpl"><div class="card-head"><div><h3>' + TD_LT[t] + '</h3><p>' + (own ? 'Mẫu đã sửa riêng' : 'Mẫu gốc của phần mềm') + '</p></div></div><b style="font-size:13px">' + esc(tp.s) + '</b><pre>' + esc(tp.b) + '</pre><div class="link-row" style="margin:0"><button class="btn btn-sm btn-primary" data-act="td-tpl" data-id="' + t + '">' + ic('td_edit', 14) + 'Sửa mẫu</button>' + (own ? '<button class="btn btn-sm" data-act="td-tpl0" data-id="' + t + '">Về mẫu gốc</button>' : '') + '</div></div>'; }).join('') + '</div>' +
      '<div class="card card-pad" style="margin-top:14px"><div class="card-head"><div><h3>Tiêu chí đánh giá phỏng vấn</h3><p>Dùng chung cho mọi vị trí để so sánh ứng viên công bằng · chấm 1–5 mỗi tiêu chí</p></div><button class="btn btn-sm" data-act="td-crit">' + ic('td_edit', 14) + 'Sửa tiêu chí</button></div><div class="td-tags" style="display:flex;flex-wrap:wrap;gap:6px">' + (cf.crit || TD_CRIT0).map(function (k, i) { return '<span class="tag tag-info">' + (i + 1) + '. ' + esc(k) + '</span>'; }).join('') + '</div></div>' +
      '<div class="notice" style="margin-top:14px">' + ic('info') + '<div>Các mẫu đã có sẵn những câu theo quy định: <b>không thu phí tuyển dụng</b> (Điều 11 khoản 2 BLLĐ 2019), <b>không giữ bản chính giấy tờ</b> (Điều 17 khoản 1), thư mời nhận việc nêu rõ công việc, nơi làm, giờ làm, lương (Điều 16 khoản 1), lương thử việc tối thiểu 85% (Điều 26); thư cảm ơn nêu thời hạn lưu hồ sơ và cách yêu cầu xóa. Sửa mẫu nên giữ lại các câu này.</div></div>';
  }
  function tdTplBind() { var s = $('#tdTU'); if (s) s.addEventListener('change', function () { PS.tdu.tu = s.value; render(); }); }
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
      tdSave(u, 'Nhập ' + n + ' ứng viên từ ' + fname); m.close(); PS.tdu.view = 'board'; render(); toast('Đã nhập ' + n + ' ứng viên', 'ok', cons ? 'Vào bước Mới nhận.' : 'Chưa ghi nhận đồng ý xử lý dữ liệu – nhớ hỏi ứng viên khi liên hệ.');
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
     4) MỜI NHẬN VIỆC
     ===================================================================== */
  PAGES.tdmoi = function () {
    var R = refDate(), rows = [];
    tdUnitsAll().forEach(function (u) { tdOf(u).cd.forEach(function (c) { if (c.offer && (c.stage === 'offer' || c.stage === 'hired' || (c.stage === 'withdraw' && c.offer.ans === 'no'))) rows.push({ u: u, c: c, r: tdReq(u, c.rq) || { pos: '' } }); }); });
    var wait = rows.filter(function (x) { return x.c.stage === 'offer'; }), yes = rows.filter(function (x) { return x.c.stage === 'hired' && !x.c.nvId; }), nv = rows.filter(function (x) { return x.c.nvId; }), no = rows.filter(function (x) { return x.c.offer.ans === 'no'; });
    var late = wait.filter(function (x) { return x.c.offer.replyBy && x.c.offer.replyBy < R; }).length;
    var kpi = '<div class="td-kpi"><div class="' + (late ? 'k-warn' : '') + '"><b>' + wait.length + '</b><span>chờ trả lời' + (late ? ' · ' + late + ' quá hạn' : '') + '</span></div><div class="' + (yes.length ? 'k-warn' : '') + '"><b>' + yes.length + '</b><span>đồng ý – chưa có hồ sơ nhân sự</span></div><div><b>' + nv.length + '</b><span>đã thành nhân sự</span></div><div><b>' + no.length + '</b><span>từ chối</span></div><div><b>' + rows.length + '</b><span>thư mời đã lập</span></div></div>';
    function row(x) {
      var c = x.c, o = c.offer, u = x.u, ds = o.start ? tdDiff(R, o.start) : null;
      var st = c.nvId ? '<span class="tag tag-ok">Đã thành nhân sự ' + esc(c.nvId) + '</span>' : c.stage === 'hired' ? '<span class="tag tag-warn">Đồng ý – chưa chuyển hồ sơ</span>' : o.ans === 'no' ? '<span class="tag tag-mute">Từ chối</span>' : '<span class="tag ' + (o.replyBy && o.replyBy < R ? 'tag-bad' : 'tag-info') + '">Chờ trả lời' + (o.replyBy ? ' (hạn ' + vn(o.replyBy).slice(0, 5) + ')' : '') + '</span>';
      var sent = (c.letters || []).filter(function (l) { return l.t === 'nv'; }).pop();
      var acts = c.nvId ? '<button class="btn btn-sm" data-act="profile" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Hồ sơ</button><button class="btn btn-sm btn-primary" data-act="hd-new" data-u="' + u.id + '" data-id="' + esc(c.nvId) + '">Lập hợp đồng</button>' :
        c.stage === 'hired' ? '<button class="btn btn-sm btn-primary" data-act="td-tonv" data-u="' + u.id + '" data-id="' + c.id + '">' + ic('td_arrow', 14) + 'Chuyển thành nhân sự</button>' :
        o.ans === 'no' ? '' : (sent ? '' : '<button class="btn btn-sm btn-primary" data-act="td-lt" data-u="' + u.id + '" data-id="' + c.id + '" data-t="nv">' + ic('td_mail', 14) + 'Gửi thư mời</button>') + '<button class="btn btn-sm" data-act="td-ans" data-u="' + u.id + '" data-id="' + c.id + '" data-a="yes">Đồng ý</button><button class="btn btn-sm" data-act="td-ans" data-u="' + u.id + '" data-id="' + c.id + '" data-a="no">Từ chối</button>';
      return '<div class="hd-ti lv-' + (c.stage === 'hired' && !c.nvId && ds !== null && ds <= 2 ? 'gap' : 'canh') + '"><span class="op-av"><b style="font-size:14px">' + esc(tdIni(c.name)) + '</b></span><div class="hd-tx"><b><a href="#" class="plink" data-act="td-c" data-u="' + u.id + '" data-id="' + c.id + '">' + esc(c.name) + '</a></b><small>' + esc(x.r.pos) + (isMulti() ? ' · ' + esc(shortUnit(u.name)) : '') + '</small></div>' +
        '<div class="hd-now">Đi làm ' + (o.start ? vn(o.start) : '…') + '<small>' + (ds !== null && !c.nvId && o.ans !== 'no' ? (ds < 0 ? 'đã qua ' + (-ds) + ' ngày' : ds === 0 ? 'hôm nay' : 'còn ' + ds + ' ngày') + ' · ' : '') + 'lương ' + tdMil(o.sal) + (o.probKind !== 'none' && o.probSal ? ', thử việc ' + tdMil(o.probSal) : '') + '</small></div>' +
        '<div class="hd-why">' + st + '<small>' + (sent ? 'Đã gửi thư ' + tdVnAt(sent.at) + ' · ' + esc(sent.ch) : 'Chưa gửi thư mời') + '</small></div><div class="link-row" style="margin:0;gap:6px;flex-wrap:wrap;justify-content:flex-end">' + acts + '</div></div>';
    }
    var order = yes.concat(wait).concat(nv).concat(no);
    return '<div class="page-head"><div><h1>Mời nhận việc</h1><p class="muted">Theo dõi thư mời, câu trả lời và ngày đi làm. Người đồng ý chuyển thẳng thành hồ sơ nhân sự – không nhập lại – rồi lập hợp đồng thử việc.</p></div><div class="link-row" style="margin:0"><button class="btn" data-go="tdungvien">Ứng viên & phỏng vấn</button></div></div>' + kpi +
      (order.length ? '<div class="card card-pad hd-todo td-moi"><div class="hd-tl">' + order.map(row).join('') + '</div></div>' : '<div class="card empty"><h2>Chưa có thư mời nhận việc nào</h2><p>Khi ứng viên đạt phỏng vấn, mở hồ sơ ứng viên → “Lập điều kiện mời” để soạn thư mời nhận việc.</p></div>') +
      '<div class="notice" style="margin-top:16px">' + ic('info') + '<div>Thư mời nhận việc chưa phải hợp đồng lao động. Hai bên giao kết hợp đồng trước khi nhận người lao động vào làm việc (BLLĐ 2019 Điều 13, 16). Lương thử việc ít nhất 85% lương của công việc (Điều 26), thời gian thử việc theo Điều 25.</div></div>';
  };
  ACTS['td-tonv'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdToNv(u, c); };
  ACTS['td-lt'] = function (a, id) { var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (c) tdLetter(u, c, a.getAttribute('data-t'), function () { render(); }); };
  ACTS['td-ans'] = function (a, id) {
    var u = unitById(a.getAttribute('data-u')), c = u && tdCand(u, id); if (!c || !c.offer) return; var y = a.getAttribute('data-a') === 'yes';
    c.offer.ans = y ? 'yes' : 'no'; c.offer.ansAt = tdNow(); if (y) { c.stage = 'hired'; tdHist(c, 'Đồng ý nhận việc, đi làm từ ' + vn(c.offer.start)); } else { c.stage = 'withdraw'; c.endAt = HR.isoToday(); tdHist(c, 'Từ chối thư mời nhận việc'); }
    tdSave(u, c.id + (y ? ' đồng ý' : ' từ chối') + ' nhận việc'); render(); if (y) toast(c.name + ' đồng ý nhận việc', 'ok', 'Bấm "Chuyển thành nhân sự" để tạo hồ sơ (thông tin tự điền).');
  };

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
