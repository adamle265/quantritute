/* Quản trị tử tế — trang khách. Dữ liệu lấy từ /api (database D1), quản trị ở trang riêng. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
  const api = async (path, opt = {}) => {
    const r = await fetch('/api/' + path, { headers: { 'content-type': 'application/json' }, ...opt });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Có lỗi, vui lòng thử lại.');
    return d;
  };

  /* ---------- công cụ: nhóm, trạng thái, giá, icon ---------- */
  const GRP = { kt: 'Kế toán – Tài chính', hc: 'Hành chính – Nhân sự', kn: 'Hỗ trợ khởi nghiệp', ht: 'Học tập' };
  const TABS = [['noi-bat', 'Tiện ích nổi bật', t => t.featured && t.status === 'ok'], ['ke-toan', GRP.kt, t => t.grp === 'kt'], ['hanh-chinh', GRP.hc, t => t.grp === 'hc'],
    ['khoi-nghiep', GRP.kn, t => t.grp === 'kn'], ['hoc-tap', GRP.ht, t => t.grp === 'ht'], ['tat-ca', 'Tất cả', () => true]];
  const TAB_G = { 'ke-toan': 'kt', 'hanh-chinh': 'hc', 'khoi-nghiep': 'kn', 'hoc-tap': 'ht' };
  const ST = { ok: ['ok', 'Dùng được'], soon: ['soon', 'Coming soon'], risk: ['risk', 'Đang rà soát'] };
  const ST_ORDER = { ok: 0, risk: 1, soon: 2 };
  const pill = st => `<span class="pill ${(ST[st] || ST.soon)[0]}">${(ST[st] || ST.soon)[1]}</span>`;
  const stBadge = st => st === 'ok' ? '<span class="stb on">Active</span>' : '<span class="stb">Coming soon</span>';
  const priceText = t => t.pricing === 'paid' ? (t.price > 0 ? money(t.price) + (t.price_note ? ' ' + t.price_note : '') : 'Có phí') : 'Free';
  const priceTag = (t, cls = '') => `<span class="price ${t.pricing === 'paid' ? 'paid' : 'free'} ${cls}">${esc(priceText(t))}</span>`;
  const tagsOf = t => String(t.tags || '').split(',').map(x => x.trim()).filter(Boolean);
  const lines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
  const safeUrl = u => /^(https?:\/\/|\/)/i.test(String(u || '').trim()) ? String(u).trim() : '';
  const ICON = {
    book: '<path d="M3 5.5c3-1.3 6-1.2 9 .8 3-2 6-2.1 9-.8V19c-3-1.3-6-1.2-9 .8-3-2-6-2.1-9-.8z"/><path d="M12 6.3v13.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    files: '<path d="M9 3h6.5L19 6.5V17H9z"/><path d="M15 3v4h4"/><path d="M6 7v14h10"/>',
    scale: '<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7l-3 6h6zM19 7l-3 6h6z"/><path d="M2 13a3 3 0 0 0 6 0M16 13a3 3 0 0 0 6 0"/>',
    import: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"/><path d="M3 12h11M10 8l4 4-4 4"/>',
    cart: '<path d="M3 4h2.2l2.3 11h10.3L20 8H6.4"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M20 17v-3"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 17v3h14v-3"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.6 20c.8-3.6 3.3-5.5 6.4-5.5s5.6 1.9 6.4 5.5"/><path d="M16 4.6a3.4 3.4 0 0 1 0 6.8M18 14.7c1.8.7 3 2.4 3.4 5.3"/>',
    clipboard: '<path d="M8.5 4H6v17h12V4h-2.5"/><rect x="8.5" y="2.5" width="7" height="3.2" rx="1"/><path d="M9 11h6M9 15h4"/>',
    checklist: '<path d="M10.5 6H20M10.5 12H20M10.5 18H20"/><path d="M3.5 6l1.6 1.6L8 4.8M3.5 12l1.6 1.6L8 10.8M3.5 18l1.6 1.6L8 16.8"/>',
    coins: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.4c-.5-1-1.5-1.6-2.6-1.6-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.6-2.6-1.6M12 6.3v1.5M12 16.2v1.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    language: '<path d="M3 5h10M8 3v2M5.5 5c.6 3 2.6 5.6 5.5 7.2M10.5 5c-.6 3.2-2.7 6.2-6.5 8"/><path d="M12.5 21l4.2-9.5L21 21M14 17.6h5.5"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12.2l2.8 2.8L16.5 9"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7v3h-7z"/><path d="M9 13.5h.01M12 13.5h.01M15 13.5h.01M9 17h.01M12 17h.01M15 17h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  };
  const icon = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ICON.spark}</svg>`;
  const CAT = { 'quan-tri': 'Quản trị', 'hanh-trinh': 'Hành trình trưởng thành', 'gia-dinh': 'Gia đình', sach: 'Sách', video: 'Video truyền cảm hứng' };
  /* Menu v1.7 (chốt 07/10/2026). Góc ngẫm, Về Minh Tuấn, Tách cà phê đang dùng tạm nội dung trang cũ đến khi module mới lên */
  /* v1.12 (góp ý 09/10): gộp Blog vào Góc ngẫm. Góc ngẫm có menu thả xuống: Tủ sách · Phòng chiếu · Bài viết */
  /* v1.14 (góp ý 12/10): "Về Minh Tuấn" → "Về Đốm", đứng đầu menu. Tên anh Minh Tuấn chỉ xuất hiện trong trang Về Đốm */
  /* v1.22 Hướng dẫn từng bước (trang tĩnh /huong-dan/, sinh bằng site/huong-dan-nguon/tao-trang.py) – gắn vào popup công cụ, trang Bộ công cụ, chân trang */
  const GUIDES = [
    ['hoa-don-thue', '/huong-dan/tai-hoa-don-dien-tu-hang-loat/', 'Tải hóa đơn điện tử hàng loạt từ cổng thuế'],
    ['hoa-don-thue', '/huong-dan/chuyen-xml-hoa-don-sang-excel/', 'Chuyển XML hóa đơn sang Excel hàng loạt'],
    ['hoa-don-thue', '/huong-dan/lap-to-khai-thue-gtgt-mau-01-gtgt/', 'Lập tờ khai thuế GTGT mẫu 01/GTGT từ hóa đơn'],
    ['van-ban-hang-loat', '/huong-dan/tao-van-ban-hang-loat-tu-excel/', 'Tạo hợp đồng, phiếu lương, giấy chứng nhận hàng loạt từ Excel'],
    ['tra-cuu-van-ban', '/huong-dan/tra-cuu-van-ban-phap-luat-thue-ke-toan/', 'Tra cứu văn bản thuế, kế toán, lao động theo từ khóa'],
  ];
  const guidesOf = slug => GUIDES.filter(g => g[0] === slug);
  const NAV = [['/ve-dom', 'Về Đốm'], ['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/goc-ngam', 'Góc ngẫm'], ['/tach-ca-phe', 'Tách cà phê']];
  const ROOMS = [['sach', 'Tủ sách', 'Những cuốn sách đổi cách nghĩ'], ['chieu', 'Phòng chiếu', 'Các kênh video đáng xem'], ['bai-viet', 'Bài viết', 'Ghi chép dưới ánh đèn']];
  const date = iso => iso ? iso.split('-').reverse().join('/') : '';

  let SITE = { settings: {}, tools: [], episodes: [] };
  /* v1.15d Bật / ẩn Góc ngẫm và từng phòng (cài trong quản trị) */
  const RKEY = { sach: 'sach', chieu: 'chieu', 'bai-viet': 'baiviet' };
  const isOn = (v, def) => v == null || v === '' ? def : v === true || v === 1 || String(v) === '1' || String(v) === 'true';
  const ngOn = room => isOn(SITE.settings.ngam_on, false) && (!room || isOn(SITE.settings['ngam_' + (RKEY[room] || room) + '_on'], true));
  const roomsOn = () => ngOn() ? ROOMS.filter(r => ngOn(r[0])) : [];

  /* ---------- đèn ---------- */
  const BULB = `<svg viewBox="0 0 20 20" aria-hidden="true"><path class="bulb-fill" d="M10 2.5a5.2 5.2 0 0 0-3 9.5c.6.5 1 1.2 1 2V15h4v-1c0-.8.4-1.5 1-2a5.2 5.2 0 0 0-3-9.5z" stroke="currentColor" stroke-width="1.4"/><path d="M8 17.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  let lamp = document.documentElement.dataset.lamp === 'off' ? 'off' : 'on';
  function applyLamp() {
    document.documentElement.dataset.lamp = lamp;
    document.querySelectorAll('[data-lamp-toggle]').forEach(b => { b.innerHTML = BULB + `<span>${lamp === 'on' ? 'Tắt đèn' : 'Bật đèn'}</span>`; b.setAttribute('aria-pressed', lamp === 'on'); });
    document.querySelectorAll('.pullcord .tag').forEach(t => { t.textContent = t.closest('.m-cord') ? (lamp === 'on' ? 'Tắt đèn' : 'Bật đèn') : (lamp === 'on' ? 'Kéo để tắt đèn' : 'Kéo để bật đèn'); });
  }
  function toggleLamp() {
    lamp = lamp === 'on' ? 'off' : 'on';
    try { sessionStorage.setItem('qtt-lamp', lamp); } catch (e) { }   // v1.12c: chỉ nhớ trong lượt truy cập – lần sau vào web đèn luôn sáng
    document.querySelectorAll('.pullcord').forEach(c => { c.classList.add('pulled'); setTimeout(() => c.classList.remove('pulled'), 380); });
    applyLamp();
  }

  /* ---------- markdown tối giản, an toàn ---------- */
  function md(src) {
    const inline = t => esc(t)
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const out = []; let list = null, para = [];
    const flush = () => { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } if (list) { out.push(`<${list.t}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.t}>`); list = null; } };
    for (const line of String(src || '').split('\n')) {
      let m;
      if (!line.trim()) { flush(); continue; }
      if ((m = line.match(/^###\s+(.*)/))) { flush(); out.push('<h3>' + inline(m[1]) + '</h3>'); continue; }
      if ((m = line.match(/^##\s+(.*)/))) { flush(); out.push('<h2>' + inline(m[1]) + '</h2>'); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)/))) { if (para.length) flush(); if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (para.length) flush(); if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      if (list) flush();
      para.push(line);
    }
    flush();
    return out.join('');
  }
  const ytFrame = (id, vert) => id ? `<div class="video${vert ? ' vert' : ''}"><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}" title="Video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>` : '';

  /* ---------- khung chung ---------- */
  const navLinks = active => NAV.map(([h, t]) => {
    const cur = `aria-current="${active && active.startsWith(h) ? 'page' : 'false'}"`;
    if (h !== '/goc-ngam') return `<a href="${h}" data-link ${cur}>${t}</a>`;
    if (!roomsOn().length) return ngOn() ? `<a href="${h}" data-link ${cur}>${t}</a>` : '';   // v1.19: bật Góc ngẫm mà chưa mở phòng nào → vẫn hiện, bấm vào ra trang "Đốm đang chuẩn bị góc này"
    return `<span class="nav-dd"><a href="${h}" data-link ${cur} aria-haspopup="true">${t}<i class="dd-caret" aria-hidden="true"></i></a>
      <span class="dd-menu" role="menu">${roomsOn().map(([k, n, d]) => `<a role="menuitem" href="/goc-ngam?phong=${k}" data-link><b>${n}</b><small>${d}</small></a>`).join('')}</span></span>`;
  }).join('');
  const subHead = active => `
    <header class="subhead"><div class="glow"></div><div class="lamp" aria-hidden="true"></div>
      <div class="wrap topnav">
        <a class="brand" href="/" data-link><span class="brand-name"><img class="brand-mark dv-sang" src="/assets/logo/dom-logo-sang.webp" alt="" width="80" height="80"><img class="brand-mark dv-toi" src="/assets/logo/dom-logo-toi.webp" alt="" width="80" height="80">Quản trị tử tế</span></a>
        <nav class="main" aria-label="Điều hướng chính">${navLinks(active)}${musicBtn()}<button class="lampbtn" data-lamp-toggle aria-label="Bật tắt đèn"></button></nav>
      </div></header>`;
  const footer = () => {
    const s = SITE.settings, soc = [['TikTok', s.social_tiktok], ['Fanpage', s.social_facebook], ['YouTube', s.social_youtube]].filter(x => x[1]);
    return `<footer class="site"><div class="wrap"><span class="hand" style="font-size:20px;color:var(--ink)">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}.</span>
      <span class="socials"><a href="/huong-dan/">Hướng dẫn</a>${soc.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}<span>© ${new Date().getFullYear()} quantritute.com</span></span></div></footer>`;
  };
  /* v1.12 nhạc nền thương hiệu: chỉ hiện nút khi có link nhạc trong Cài đặt. Trình duyệt chặn tự phát → người dùng bấm mới phát;
     nhạc tải khi bấm lần đầu (preload none), âm lượng nhỏ, tăng/giảm dần, chạy tiếp khi chuyển trang (web 1 trang) */
  let bgAudio = null, volAnim = 0;
  const musicOn = () => !!(bgAudio && !bgAudio.paused);
  // v1.12e biểu tượng nhạc: tắt = nốt nhạc có gạch chéo; bật = sóng âm chạy. Trang chủ: đặt trên bàn; trang con: nút trên menu
  const MUSIC_IC = '<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><g class="mi-off"><path class="mi-note" d="M9 17.2V5.6l10-2.1v11.4"/><ellipse class="mi-head" cx="6.6" cy="17.4" rx="2.6" ry="2.1"/><ellipse class="mi-head" cx="16.6" cy="15.2" rx="2.6" ry="2.1"/><path class="mi-cut" d="M3.5 3.5l17 17"/></g><g class="mi-on"><rect x="2.6" y="9" width="2.2" height="6" rx="1.1"/><rect x="6.9" y="6" width="2.2" height="12" rx="1.1"/><rect x="11.2" y="3" width="2.2" height="18" rx="1.1"/><rect x="15.5" y="6.5" width="2.2" height="11" rx="1.1"/><rect x="19.8" y="9.5" width="2.2" height="5" rx="1.1"/></g></svg>';
  const musicLabel = () => musicOn() ? 'Đang phát · ' + (SITE.settings.bg_music_title || 'Nhạc nền') + ' – bấm để tắt' : 'Bật nhạc nền';
  const musicBtn = (cls = '') => safeUrl(SITE.settings.bg_music_url) ? `<button type="button" class="musicbtn ${cls}${musicOn() ? ' on' : ''}" data-music aria-pressed="${musicOn()}" aria-label="${musicOn() ? 'Tắt nhạc nền' : 'Bật nhạc nền'}">${MUSIC_IC}<span class="mb-t">${esc(musicLabel())}</span></button>` : '';
  function paintMusic() {
    document.querySelectorAll('[data-music]').forEach(b => { const on = musicOn(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền'); const t = b.querySelector('.mb-t'); if (t) t.textContent = musicLabel(); });
  }
  function fadeVol(to, done) {
    cancelAnimationFrame(volAnim); const from = bgAudio.volume, t0 = performance.now();
    const tick = n => { const k = Math.min(1, (n - t0) / 700); bgAudio.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) volAnim = requestAnimationFrame(tick); else if (done) done(); };
    volAnim = requestAnimationFrame(tick);
  }
  function toggleMusic() {
    const url = safeUrl(SITE.settings.bg_music_url); if (!url) return;
    if (!bgAudio) { bgAudio = new Audio(url); bgAudio.loop = true; bgAudio.preload = 'none'; bgAudio.volume = 0; ['play', 'pause'].forEach(ev => bgAudio.addEventListener(ev, paintMusic)); }
    if (bgAudio.paused) bgAudio.play().then(() => fadeVol(.35)).catch(() => { });
    else fadeVol(0, () => bgAudio.pause());
  }
  /* v1.12 chân trang các kênh (Đốm): Facebook fanpage, Zalo, TikTok, YouTube, Email (lấy ở Cài đặt → Liên hệ & mạng xã hội) */
  const SOC_IC = {
    fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z"/>',
    zalo: '<rect x="3" y="4" width="18" height="14" rx="4"/><path d="M8 9h4l-4 4h4M14.5 9v4M17 11a1.5 1.5 0 1 1 0 .01"/><path d="M7 18l-2 3 5-3"/>',
    tt: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.6 2.4 4.4 5 4.6"/>',
    yt: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l5-2.8z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
  };
  const zaloUrl = v => { v = String(v || '').trim(); if (!v) return ''; if (/^https?:\/\//i.test(v)) return v; const d = v.replace(/[^\d]/g, ''); return d ? 'https://zalo.me/' + d : ''; };
  function channelsFoot() {
    const s = SITE.settings;
    const ch = [['fb', 'Facebook', safeUrl(s.social_facebook)], ['zalo', 'Zalo', zaloUrl(s.contact_zalo)], ['tt', 'TikTok', safeUrl(s.social_tiktok)], ['yt', 'YouTube', safeUrl(s.social_youtube)],
      ['mail', 'Email', /@/.test(s.contact_email || '') ? 'mailto:' + String(s.contact_email).trim() : '']];
    return `<footer class="ab-foot"><p class="mono">Kết nối với Đốm</p><div class="ab-ch">${ch.map(([k, n, u]) => u
      ? `<a href="${esc(u)}" ${k === 'mail' ? '' : 'target="_blank" rel="noopener"'} class="ab-c c-${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_IC[k]}</svg><span>${n}</span></a>`
      : `<span class="ab-c off" title="Sắp cập nhật"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_IC[k]}</svg><span>${n}</span></span>`).join('')}</div>
      ${s.contact_email ? `<p class="ab-mail">${esc(s.contact_email)}</p>` : ''}<p class="ab-sign hand">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}</p></footer>`;
  }
  const notice = () => SITE.settings.notice ? `<div class="notice">${esc(SITE.settings.notice)}</div>` : '';

  /* Bìa sách: mỗi NHÓM một màu (Kế toán xanh dương, Hành chính xanh lá, Khởi nghiệp cam đất, Học tập tím) – màu khai báo trong style.css */
  /* v1.11 số liệu thật từ bộ đếm (lượt truy cập: mỗi người 1 lượt/ngày; lượt dùng: mở/xem nội dung, tối đa 20/người/ngày) */
  const num = n => new Intl.NumberFormat('vi-VN').format(n || 0);
  const statsOf = t => t.stats || { visits: 0, uses: 0, downloads: 0, today_visits: 0 };
  /* v1.14: công cụ cho tải bản offline hiện thêm "lượt tải" (đếm khi bấm nút Tải bản offline); popup bỏ số "hôm nay" */
  const cardStats = t => t.status !== 'ok' ? '' : `<span class="cb-stats"><span>${num(statsOf(t).visits)} truy cập</span><span>${num(statsOf(t).uses)} lượt dùng</span>${safeUrl(t.download_url) ? `<span>${num(statsOf(t).downloads)} lượt tải</span>` : ''}</span>`;
  const bookStats = (t, dl) => { if (t.status !== 'ok') return ''; const s = statsOf(t);
    return `<div class="bk-stats" aria-label="Số liệu sử dụng"><span><b>${num(s.visits)}</b> lượt truy cập</span><span><b>${num(s.uses)}</b> lượt dùng</span>${dl ? `<span><b>${num(s.downloads)}</b> lượt tải</span>` : ''}</div>`; };
  const hit = (slug, kind) => { try { fetch('/api/hit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, kind }), keepalive: true }).catch(() => { }); } catch (e) { } };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>';
  /* Sách gập: bìa nổi bật Tên công cụ + Giải quyết vấn đề gì. star = hiện sao vàng nếu là công cụ nổi bật (không dùng trong tab Nổi bật) */
  /* v1.14 bìa: "Dành cho" (3 đối tượng đầu) + "Đang phải" (nỗi đau). Hiệu ứng rê chuột: bìa mở ra như lật sách, lộ trang lót */
  const whoShort = t => String(t.who || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 3).join(', ');
  const painText = p => { p = String(p || '').trim().replace(/[.。]+$/, ''); return p ? p[0].toLowerCase() + p.slice(1) : ''; };
  const toolCard = (t, star = true) => `<a class="cbook g-${esc(t.grp)} st-${esc(t.status)}" href="/cong-cu/${esc(t.slug)}" data-tool="${esc(t.slug)}" aria-haspopup="dialog">
      <span class="cb-pages" aria-hidden="true"></span>
      <span class="cb-inner" aria-hidden="true"><span class="cbi-ic">${icon(t.icon)}</span><span class="cbi-t hand">${t.status === 'ok' ? 'Mở sách xem chi tiết' : 'Sắp ra mắt – xem trước'}</span><span class="cbi-go">→</span></span>
      <span class="cb-cover">
        <span class="cb-spine" aria-hidden="true"></span>
        <span class="cb-top"><span class="cb-ic">${icon(t.icon)}</span>${star && t.featured ? `<span class="cb-star" title="Tiện ích nổi bật">${STAR}<span class="sr">Tiện ích nổi bật</span></span>` : ''}</span>
        <span class="cb-title">${esc(t.name)}</span>
        <span class="cb-rule" aria-hidden="true"></span>
        ${whoShort(t) ? `<span class="cb-for"><i>Dành cho</i>${esc(whoShort(t))}</span>` : ''}
        ${t.pain ? `<span class="cb-pain"><i>Đang phải</i>${esc(painText(t.pain))}</span>` : ''}
        <span class="cb-foot">${stBadge(t.status)}${priceTag(t)}</span>
        ${cardStats(t)}
      </span></a>`;
  /* Banner tượng trưng: ảnh riêng nếu có, không thì vẽ theo nhóm + icon */
  const artOf = t => {
    const img = safeUrl(t.banner_url);
    return img ? `<img src="${esc(img)}" alt="" loading="lazy">`
      : `<div class="art-gen"><span class="art-grid"></span><span class="art-ring r1"></span><span class="art-ring r2"></span>${icon(t.icon, 'art-icon')}</div>`;
  };

  /* ---------- Bảng ghim ---------- */
  /* v1.14 (góp ý 12/10): 3 cột – Mới phát hành (công cụ Active, mới nhất lên đầu) · Đang hoàn thiện (có ngày dự kiến) · Danh sách chờ (đề xuất, "Tôi cũng cần").
     Bỏ cột "Sẽ làm" và dòng thống kê. Đề xuất "Sẽ làm" có ngày dự kiến → Đang hoàn thiện, chưa có ngày → Danh sách chờ */
  const LANES = [['done', 'Mới phát hành', 'Đã thắp sáng, dùng được ngay'], ['build', 'Đang hoàn thiện', 'Đốm đang làm'], ['wait', 'Danh sách chờ', 'Anh/chị đang đề xuất']];
  const reqLane = n => n.status === 'done' ? 'done' : (n.status === 'building' || (n.status === 'planned' && n.eta)) ? 'build' : 'wait';
  const laneOf = n => LANES.find(l => l[0] === reqLane(n)) || LANES[2];
  const DONE_SHOW = 4;
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const voterId = () => { let c = store.get('qtt-cid', ''); if (!/^[a-z0-9]{12,40}$/.test(c)) { c = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('qtt-cid', c); } return c; };
  const toolOf = slug => slug ? (SITE.tools || []).find(t => t.slug === slug) : null;
  const tilt = id => (((hashN(String(id)) * 37) % 9) - 4) * 0.55;
  const shortDate = iso => { const p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; };
  const voteBtn = (n, voted) => `<button type="button" class="n-vote" data-vote="${n.id}" aria-pressed="${voted}"><span class="n-plus" aria-hidden="true">${voted ? '✓' : '+1'}</span>${voted ? 'Bạn cũng cần' : 'Tôi cũng cần'}<b>${n.votes || 0}</b></button>`;
  const etaHtml = n => { const late = n.eta && n.eta_prev && n.eta > n.eta_prev;
    return n.eta ? `<p class="n-eta">${late ? `Lùi sang <b>${date(n.eta)}</b><s title="Ngày dự kiến cũ">${shortDate(n.eta_prev)}</s>` : `Dự kiến phát hành <b>${date(n.eta)}</b>`}</p>` : ''; };
  /* Tờ note công cụ (Mới phát hành / Đang hoàn thiện): bấm mở đúng popup công cụ */
  function toolNote(t, lane) {
    return `<article class="pnote n-${lane} n-tool g-${esc(t.grp)}" style="--tilt:${tilt(t.slug)}deg" data-tool-note="${esc(t.slug)}" tabindex="0" role="button" aria-label="Xem công cụ: ${esc(t.name)}">
      <span class="n-pin" aria-hidden="true"></span>
      <span class="n-ic" aria-hidden="true">${icon(t.icon)}</span>
      <h3 class="hand">${esc(t.name)}</h3>
      ${t.pain ? `<p class="n-desc">Hết cảnh ${esc(painText(t.pain))}</p>` : ''}
      ${lane === 'done' ? (t.released ? `<p class="n-eta">Phát hành <b>${date(t.released)}</b></p>` : '') : `<p class="n-eta">Dự kiến phát hành <b>${date(t.eta)}</b></p>`}
      <div class="n-foot">${lane === 'done' ? `<a class="n-use" href="/cong-cu/${esc(t.slug)}" data-tool="${esc(t.slug)}">Dùng ngay →</a>` : '<span class="n-cnt hand">Đốm đang làm…</span>'}</div></article>`;
  }
  /* Tờ note đề xuất: tên, mô tả, ngày dự kiến (nếu có), lời Đốm, Tôi cũng cần */
  function noteCard(n, lane, voted) {
    return `<article class="pnote n-${lane}" style="--tilt:${tilt(n.id)}deg" data-note="${n.id}" tabindex="0" role="button" aria-label="Xem chi tiết: ${esc(n.board_title)}">
      <span class="n-pin" aria-hidden="true"></span>
      <h3 class="hand">${esc(n.board_title)}</h3>
      ${n.board_desc ? `<p class="n-desc">${esc(n.board_desc)}</p>` : ''}
      ${lane === 'build' ? etaHtml(n) : ''}
      ${n.board_note && lane !== 'done' ? `<p class="n-say hand">${esc(n.board_note)}</p>` : ''}
      <div class="n-foot">${lane === 'done' ? (n.votes ? `<span class="n-cnt">${n.votes} người đã cùng cần</span>` : '') : voteBtn(n, voted)}</div></article>`;
  }
  /* Popup chi tiết 1 đề xuất: dùng chung khung "sách mở" của popup công cụ */
  function noteModal(n, voted) {
    const [k, name] = laneOf(n), steps = [...LANES].reverse(), cur = steps.findIndex(l => l[0] === k);
    return `<div class="tm-backdrop" data-close></div>
    <div class="tm tm-book g-kn nm" role="dialog" aria-modal="true" aria-labelledby="tm-title">
      <button class="tm-x" data-close aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="bk-pages">
        <section class="bk-page bk-left">
          <span class="bk-grp">Bảng ghim · ${esc(name)}</span>
          <header class="bk-head"><span class="bk-ic">${icon('clipboard')}</span><h2 id="tm-title">${esc(n.board_title)}</h2></header>
          <div class="bk-meta"><span class="stb${k === 'done' ? ' on' : ''}">${esc(name)}</span>${k === 'build' && n.eta ? `<span class="nm-eta">Dự kiến ${date(n.eta)}</span>` : ''}${k === 'wait' ? `<span class="nm-eta">${n.votes || 0} người đang cần</span>` : ''}</div>
          ${n.board_desc ? `<div class="bk-blk"><h3>Việc cần giải quyết:</h3><p class="bk-pain">${esc(n.board_desc)}</p></div>` : ''}
          ${n.board_note ? `<div class="bk-blk"><h3>Lời Đốm:</h3><p class="nm-say hand">${esc(n.board_note)}</p></div>` : ''}
          <div class="bk-cta">${k === 'done' ? '' : voteBtn(n, voted)}<button type="button" class="btn ghost bk-sug" data-suggest="" data-about="${esc(n.board_title)}">Góp thêm ý cho đề xuất này</button></div>
        </section>
        <section class="bk-page bk-right">
          <div class="bk-blk"><h3>Hành trình của ý tưởng</h3>
            <ol class="nm-steps">${steps.map(([sk, sn, sd], i) => `<li class="${i < cur ? 'past' : i === cur ? 'now' : ''}"><b>${esc(sn)}</b><span>${esc(sd)}</span></li>`).join('')}</ol></div>
          <div class="nm-dom"><span class="nm-dom-img" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-24-ghim-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-24-ghim-toi.webp" alt=""></span>
            <p class="hand">${k === 'wait' ? 'Càng nhiều người bấm “Tôi cũng cần”, ý tưởng càng sớm được thắp sáng!' : k === 'done' ? 'Ý tưởng này đã thành công cụ rồi đó!' : 'Đốm đang làm từng ngày đây!'}</p></div>
        </section>
      </div>
    </div>`;
  }
  /* Popup "Xem thêm" – toàn bộ công cụ đã phát hành kèm ngày phát hành */
  function releasedModal(list) {
    return `<div class="tm-backdrop" data-close></div>
    <div class="tm tm-book g-hc nm rl" role="dialog" aria-modal="true" aria-labelledby="tm-title">
      <button class="tm-x" data-close aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="rl-in"><span class="bk-grp">Bảng ghim · Mới phát hành</span><h2 id="tm-title">Các công cụ đã thắp sáng</h2>
        <ol class="rl-list">${list.map(t => `<li><a href="/cong-cu/${esc(t.slug)}" data-tool="${esc(t.slug)}" class="g-${esc(t.grp)}"><span class="rl-ic">${icon(t.icon)}</span><b>${esc(t.name)}</b><span class="rl-d mono">${t.released ? date(t.released) : '—'}</span></a></li>`).join('')}</ol></div>
    </div>`;
  }
  const releasedTools = () => (SITE.tools || []).filter(t => t.status === 'ok').sort((a, b) => (b.released || '').localeCompare(a.released || '') || a.sort - b.sort);
  function renderBoard(items) {
    const voted = new Set(store.get('qtt-voted', []));
    const live = items.filter(n => n.status !== 'rejected');
    const doneTools = releasedTools(), doneSlugs = new Set(doneTools.map(t => t.slug));
    const buildTools = (SITE.tools || []).filter(t => t.status !== 'ok' && t.eta).sort((a, b) => a.eta.localeCompare(b.eta));
    const L = { done: [], build: [], wait: [] };
    doneTools.forEach(t => L.done.push({ at: t.released || '', html: lane => toolNote(t, lane) }));
    live.filter(n => reqLane(n) === 'done' && !doneSlugs.has(n.tool_slug)).forEach(n => L.done.push({ at: '', html: lane => noteCard(n, lane, false) }));
    buildTools.forEach(t => L.build.push({ at: t.eta, html: lane => toolNote(t, lane) }));
    live.filter(n => reqLane(n) === 'build').forEach(n => L.build.push({ at: n.eta || '9999', html: lane => noteCard(n, lane, voted.has(n.id)) }));
    L.build.sort((a, b) => a.at.localeCompare(b.at));
    const wait = live.filter(n => reqLane(n) === 'wait').sort((a, b) => b.votes - a.votes || b.id - a.id);
    wait.forEach(n => L.wait.push({ html: lane => noteCard(n, lane, voted.has(n.id)) }));
    const people = wait.reduce((s, n) => s + (n.votes || 0), 0);
    const lanes = LANES.map(([k, t, sub]) => {
      const list = L[k], show = k === 'done' ? list.slice(0, DONE_SHOW) : list;
      const count = k === 'wait' ? `<b title="Tổng số người đang cần">${people} người cần</b>` : `<b>${list.length}</b>`;
      return `<div class="lane l-${k}"><h2 class="lane-tag"><span>${t}</span>${count}</h2><p class="lane-sub hand">${sub}</p>
        <div class="lane-notes">${show.length ? show.map(x => x.html(k)).join('') : `<p class="lane-empty hand">${k === 'wait' ? 'Chưa có đề xuất nào – anh/chị ghim tờ đầu tiên nhé!' : 'Chưa có tờ nào'}</p>`}</div>
        ${k === 'done' && list.length > DONE_SHOW ? `<button type="button" class="lane-more" data-more-released>Xem thêm ${list.length - DONE_SHOW} công cụ →</button>` : ''}</div>`;
    }).join('');
    const rest = items.filter(n => n.status === 'rejected');
    $('#board').innerHTML = `<div class="cork-in">${lanes}</div>`;
    $('#bgRest').innerHTML = rest.length ? `<h2 class="mono">Chưa làm lúc này</h2><ul>${rest.map(n => `<li><b>${esc(n.board_title)}</b>${n.board_note ? `<span class="hand">${esc(n.board_note)}</span>` : ''}${safeUrl(n.board_link) ? `<a href="${esc(safeUrl(n.board_link))}" target="_blank" rel="noopener">Giải pháp khác ↗</a>` : ''}</li>`).join('')}</ul>` : '';
  }

  /* ---------- v1.8: Góc ngẫm · Về Minh Tuấn · Tách cà phê ---------- */
  const pad2 = n => String(n).padStart(2, '0');
  /* Trang Về Đốm: mỗi dịch vụ một dòng, kèm một dáng của Đốm hợp với việc đó (chọn theo từ khóa trong tên, không khớp thì lấy theo thứ tự) */
  const SVC_POSE = ['18-tai-len', '20-danh-gia', '19-hoan-thanh', '15-doc-sach', '17-ca-phe'];
  const svcPose = (name, i) => {
    const t = String(name).toLowerCase();
    const k = /\bai\b|agent/.test(t) ? 1 : /spa|sức khỏe|trị liệu/.test(t) ? 4 : /đào tạo|văn hóa|văn hoá/.test(t) ? 3 : /bộ máy|quy trình|vận hành/.test(t) ? 2 : /website|web|công cụ|tự động/.test(t) ? 0 : i % SVC_POSE.length;
    return SVC_POSE[k];
  };
  const SV_GO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const pipeRows = v => lines(v).map(l => l.split('|').map(x => x.trim()));
  const SPINE = ['#8E3B2F', '#2F4F6B', '#5B6B3A', '#6E4A86', '#B0743A', '#3D6E6A', '#7A3B4B', '#2E3A55'];
  const hashN = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const okColor = c => /^#[0-9a-f]{3,8}$/i.test(String(c || '').trim()) ? String(c).trim() : '';
  const ytThumb = id => `https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg`;
  const PLAY = '<span class="gn-play" aria-hidden="true"></span>';

  /* v1.14 Tủ sách (góp ý 12/10): 1 giá sách gỗ nhiều ngăn, mỗi ngăn 1 chủ đề → bấm ngăn mở danh sách sách trong ngăn
     → bấm 1 cuốn mở "sách mở" với 3 thẻ đánh dấu: Mục lục · Bài học giá trị · Đoạn sách hay */
  const shelvesOf = books => {
    const map = new Map();
    books.forEach(b => { const k = String(b.shelf || '').trim() || 'Sách khác'; if (!map.has(k)) map.set(k, { name: k, sort: b.shelf_sort ?? 100, list: [] }); const g = map.get(k); g.sort = Math.min(g.sort, b.shelf_sort ?? 100); g.list.push(b); });
    return [...map.values()].sort((a, b) => (a.name === 'Sách khác') - (b.name === 'Sách khác') || a.sort - b.sort || a.name.localeCompare(b.name, 'vi'));
  };
  const spineOf = (b, i, big) => {
    const h = hashN(b.slug || b.title), c = okColor(b.color) || SPINE[h % SPINE.length];
    const ht = big ? 214 + (h % 5) * 12 : 96 + (h % 5) * 8, w = big ? Math.max(46, Math.min(66, 34 + String(b.title).length * 1.1)) : 20 + (h % 4) * 4;
    const lean = !big && i % 5 === 4 ? ' lean' : '';
    return big ? `<button type="button" class="gn-spine" data-book="${esc(b.slug)}" style="--c:${c};--h:${ht}px;--w:${Math.round(w)}px" aria-label="Mở sách ${esc(b.title)}">
        <span class="gn-band" aria-hidden="true"></span><span class="gn-st">${esc(b.title)}</span>${b.author ? `<span class="gn-sa">${esc(b.author)}</span>` : ''}<span class="gn-band b" aria-hidden="true"></span></button>`
      : `<i class="bc-sp${lean}" style="--c:${c};--h:${ht}px;--w:${w}px" aria-hidden="true"></i>`;
  };
  /* v1.15 Tủ sách (góp ý 13/10): 1 giá sách gỗ cao nhiều tầng, mỗi tầng 1 chủ đề. Sách đứng có tên trên gáy, chặn sách, chồng sách nằm, chậu cây;
     biển đồng tên chủ đề gắn ở mép tầng; rê chuột đèn LED dưới tầng trên bật sáng. Bấm 1 tầng → danh sách sách của tầng đó */
  const tierSpine = (b, k) => {
    const h = hashN(b.slug || b.title), c = okColor(b.color) || SPINE[h % SPINE.length];
    const ht = 112 + (h % 6) * 7, w = Math.max(34, Math.min(52, 26 + String(b.title).length * 0.9));
    return `<i class="tb-sp${k % 6 === 4 ? ' lean' : ''}" style="--c:${c};--h:${ht}px;--w:${Math.round(w)}px"><b>${esc(b.title)}</b></i>`;
  };
  /* v1.15d Tủ sách (góp ý 13/10 lần 3): kệ TRƯNG BÌA kiểu thư viện – sách quay mặt bìa ra ngoài, cùng khổ, thẳng hàng trên thanh gỗ sồi sáng.
     Bìa là một bộ sưu tập thống nhất: số thứ tự, tên sách chữ ngang (Playfair), tác giả, hoạ tiết hình học riêng cho từng cuốn.
     Có ảnh bìa (tải trong quản trị) thì dùng ảnh. Bấm bìa → mở ghi chép */
  const COVER = ['#2F4A3A', '#22344F', '#9C4630', '#B07D2C', '#55344D', '#2E5A5C', '#6B2633', '#33343A', '#5F6E4E', '#E6DCC6', '#7A4A2A', '#3C4F6E'];
  const coverColor = b => okColor(b.color) || COVER[hashN(b.slug || b.title) % COVER.length];
  const isLight = c => { const m = String(c).replace('#', ''); const v = m.length === 3 ? m.split('').map(x => x + x).join('') : m.slice(0, 6); const n = parseInt(v, 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160; };
  const MOTIF = [
    '<circle cx="60" cy="96" r="38"/>',
    '<path d="M120 100a60 60 0 0 0-60-60M120 100a40 40 0 0 0-40-40M120 100a20 20 0 0 0-20-20" fill="none" stroke-width="3"/>',
    '<rect x="0" y="54" width="120" height="10"/><rect x="0" y="72" width="120" height="10"/><rect x="0" y="90" width="120" height="10"/>',
    '<path d="M0 100L38 52l22 26 18-18 42 40z"/>',
    '<g>' + Array.from({ length: 24 }, (_, i) => `<circle cx="${12 + (i % 6) * 19}" cy="${44 + Math.floor(i / 6) * 16}" r="3"/>`).join('') + '</g>',
    '<path d="M60 40l14 30 30 4-22 20 6 30-28-16-28 16 6-30-22-20 30-4z" transform="translate(0 -6) scale(1 .9)"/>',
  ];
  function coverHtml(b, i) {
    const c = coverColor(b), light = isLight(c), t = String(b.title || ''), h = hashN(b.slug || b.title);
    const fs = t.length <= 14 ? 21 : t.length <= 26 ? 18 : t.length <= 42 ? 15.5 : 13.5;
    const img = /^(https?:\/\/|\/)/i.test(String(b.cover_url || '').trim()) ? String(b.cover_url).trim() : '';
    return `<button type="button" class="lb-b" data-book="${esc(b.slug)}" aria-label="Mở ghi chép sách ${esc(t)}${b.author ? ' – ' + esc(b.author) : ''}">
      <span class="lb-c${light ? ' lt' : ''}${img ? ' im' : ''}" style="--c:${c};--fs:${fs}px">
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="lb-no">Nº ${pad2(i + 1)}</span>
        <span class="lb-tt">${esc(t)}</span><span class="lb-rule" aria-hidden="true"></span>${b.author ? `<span class="lb-au">${esc(b.author)}</span>` : ''}
        <svg class="lb-mo" viewBox="0 0 120 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${MOTIF[(h >> 4) % MOTIF.length]}</svg>`}
        <span class="lb-rib" aria-hidden="true"></span></span>
      <span class="lb-cap">Mở ghi chép</span></button>`;
  }
  function bookcaseHtml(books) {
    const list = [...books];
    return `<div class="lb"><div class="lb-wall">
        <p class="lb-plate"><span>Tủ sách</span><small>${list.length ? list.length + ' cuốn chọn lọc' : 'đang xếp sách'}</small></p>
        <div class="lb-grid">${list.map(coverHtml).join('')}
          <span class="lb-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-15-doc-sach-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-15-doc-sach-toi.webp" alt=""><i class="hand">${list.length ? 'Đốm đang đọc dở…' : 'Đốm đang chọn sách…'}</i></span></div></div>
      <p class="bc-hint hand">${list.length ? 'Những cuốn sách đã giúp thay đổi cách nghĩ – anh/chị chọn một cuốn để mở ghi chép nhé.' : ''}</p></div>`;
  }
  function shelfOpenHtml(g) {
    return `<div class="bc-open"><div class="bc-open-head"><button type="button" class="bc-back" data-shelf-back>← Về giá sách</button>
        <div><p class="mono">Ngăn sách</p><h2>${esc(g.name)}</h2></div><span class="bc-cnt mono">${g.list.length} cuốn</span></div>
      <div class="gn-shelf"><div class="gn-books">${g.list.map((b, i) => spineOf(b, i, true)).join('')}${plantHtml()}</div></div>
      <ul class="bc-list">${g.list.map(b => `<li><button type="button" data-book="${esc(b.slug)}"><b>${esc(b.title)}</b>${b.author ? `<span>${esc(b.author)}</span>` : ''}<i>Mở sách →</i></button></li>`).join('')}</ul></div>`;
  }
  const plantHtml = () => `<span class="gn-plant" aria-hidden="true"><i class="lf l1"></i><i class="lf l2"></i><i class="lf l3"></i><i class="pot"></i></span>`;
  function bookModal(b) {
    const h = hashN(b.slug || b.title), c = coverColor(b);
    const toc = lines(b.toc), lessons = lines(b.lessons), quotes = pipeRows(b.quotes);
    const tabs = [['toc', 'Mục lục', toc.length], ['ls', 'Bài học giá trị', lessons.length], ['q', 'Đoạn sách hay', quotes.length]].filter(t => t[2]);
    const pane = {
      toc: `<ol class="bm-toc">${toc.map((t, i) => `<li><span class="bm-no">${pad2(i + 1)}</span><span class="bm-tt">${esc(t)}</span></li>`).join('')}</ol>`,
      ls: `<div class="bm-ls">${lessons.map((t, i) => `<article class="bm-card"><span class="bm-k mono">Bài học ${pad2(i + 1)}</span><p>${esc(t)}</p></article>`).join('')}</div>`,
      q: `<div class="bm-qs">${quotes.map(([t, pg]) => `<figure class="bm-q"><span class="bm-mark" aria-hidden="true">“</span><blockquote>${esc(t)}</blockquote>${pg ? `<figcaption>${esc(pg)}</figcaption>` : ''}</figure>`).join('')}</div>`,
    };
    return `<div class="gn-modal bm${isLight(c) ? ' lt' : ''}" role="dialog" aria-modal="true" aria-label="${esc(b.title)}" style="--c:${c}"><div class="gn-dim" data-gn-close></div>
      <div class="bm-book"><button type="button" class="gn-x" data-gn-close aria-label="Đóng">×</button>
        <section class="bm-left"><div class="bm-cover"><span class="bm-band" aria-hidden="true"></span><span class="mono">Tủ sách</span><h2>${esc(b.title)}</h2>${b.author ? `<p class="bm-au">${esc(b.author)}</p>` : ''}<span class="bm-band b" aria-hidden="true"></span></div>
          <div class="bm-dom"><span aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-15-doc-sach-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-15-doc-sach-toi.webp" alt=""></span><p class="hand">${tabs.length ? 'Đốm đánh dấu sẵn mấy trang hay, anh/chị lật xem nhé!' : 'Đốm đang đọc và ghi chép cuốn này, anh/chị quay lại sau nhé!'}</p></div></section>
        <section class="bm-right">${tabs.length ? `<div class="bm-tabs" role="tablist">${tabs.map(([k, n, cnt], i) => `<button type="button" role="tab" data-bm="${k}" aria-selected="${i === 0}"><span>${n}</span><b>${cnt}</b></button>`).join('')}</div>
          ${tabs.map(([k], i) => `<div class="bm-pane" data-pane="${k}" ${i ? 'hidden' : ''}>${pane[k]}</div>`).join('')}` : '<p class="hand bm-wait">Trang ghi chép đang được viết…</p>'}</section>
      </div></div>`;
  }
  /* v1.12 Phòng chiếu: các KÊNH (danh sách phát) – TV lớn ở giữa – cuộn băng của kênh. Phát cả kênh / bấm 1 cuộn băng = phát video đó + cả danh sách */
  const channelsOf = videos => {
    const map = new Map();
    videos.filter(v => v.yt).forEach(v => { const k = (v.channel || '').trim() || 'Kênh chung'; if (!map.has(k)) map.set(k, { name: k, sort: v.channel_sort ?? 100, list: [] }); map.get(k).list.push(v); });
    return [...map.values()].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'vi'));
  };
  const ytPlay = (ids, i) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(ids[i])}?autoplay=1&rel=0&playlist=${ids.slice(i + 1).concat(ids.slice(0, i)).map(encodeURIComponent).join(',')}`;
  function cinemaHtml(chs, ci, vi, playing) {
    const knobs = '<div class="tv-side" aria-hidden="true"><span class="tv-knob"></span><span class="tv-knob"></span><span class="tv-grill"></span></div>';
    if (!chs.length) return `<div class="cn"><div class="tv-wrap cn-tv"><div class="tv"><div class="tv-screen tv-static"><p class="hand">Chưa có buổi chiếu nào.</p></div>${knobs}</div><div class="tv-legs" aria-hidden="true"></div></div></div>`;
    const ch = chs[ci], v = ch.list[vi], ids = ch.list.map(x => x.yt);
    return `<div class="cn cn2">
      <div class="cn2-main">
        <div class="tv-wrap cn-tv"><div class="tv"><div class="tv-screen" id="tvScreen">${playing
          ? `<iframe src="${ytPlay(ids, vi)}" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
          : `<button type="button" class="tv-play" data-playv="${vi}" aria-label="Phát video ${esc(v.title)}"><img src="${ytThumb(v.yt)}" alt="" loading="lazy">${PLAY}</button>`}
          <span class="tv-ch mono" aria-hidden="true">CH ${pad2(ci + 1)}</span></div>${knobs}</div><div class="tv-legs" aria-hidden="true"></div></div>
        <div class="cn-bar"><div><span class="mono">Đang chiếu · ${esc(ch.name)} · ${vi + 1}/${ch.list.length}</span><h2>${esc(v.title)}</h2>${v.author || v.duration ? `<p class="cn-au">${[v.author, v.duration ? '⏱ ' + v.duration : ''].filter(Boolean).map(esc).join(' · ')}</p>` : ''}</div></div>
        <article class="gn-note cn-note cn-dom"><span class="cn-dom-img" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-09-suy-nghi-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-09-suy-nghi-toi.webp" alt=""></span>
          <div class="gn-think"><span class="mono">Đốm ngẫm</span>${lines(v.reflection).length ? lines(v.reflection).map(p => `<p class="hand">${esc(p)}</p>`).join('') : '<p class="hand">Đốm đang xem kỹ video này và sẽ ghi lại suy nghĩ sớm nhé!</p>'}</div></article>
      </div>
      <aside class="cn2-side" aria-label="Kênh và danh sách video">
        <div class="cn2-chs" role="tablist" aria-label="Chọn kênh"><span class="mono">Kênh · ${chs.length}</span>${chs.map((c, i) => `<button type="button" role="tab" data-ch="${i}" aria-selected="${i === ci}"><span class="cn2-chn mono">CH ${pad2(i + 1)}</span><b>${esc(c.name)}</b><small>${c.list.length} video</small></button>`).join('')}</div>
        <div class="cn2-pl"><div class="cn2-plh"><div><b>${esc(ch.name)}</b><small>${ch.list.length} video · đang xem ${vi + 1}/${ch.list.length}</small></div>
          ${ids.length > 1 ? `<button type="button" class="cn2-all" data-playall title="Phát cả kênh">▶ Phát cả kênh</button>` : ''}</div>
          <ol class="cn2-list">${ch.list.map((x, j) => `<li><button type="button" class="cn2-it" data-tape="${j}" aria-current="${j === vi}">
            <span class="cn2-no" aria-hidden="true">${j === vi ? '▶' : j + 1}</span>
            <span class="cn2-th"><img src="${ytThumb(x.yt)}" alt="" loading="lazy">${x.duration ? `<em>${esc(x.duration)}</em>` : ''}</span>
            <span class="cn2-tx"><b>${esc(x.title)}</b><small>${esc(x.author || ch.name)}</small></span></button></li>`).join('')}</ol></div>
      </aside>
    </div>`;
  }
  /* v1.12 Bài viết: "Sổ ghi chép" – bài mở đầu lớn + các trang ghi theo tháng, tem ngày bên trái */
  function notebookHtml(list, T) {
    if (!list.length) return '';
    const hero = list[0], rest = list.slice(1), groups = [];
    rest.forEach(p => { const k = (p.published_at || '').slice(0, 7) || 'khac'; let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, list: [] }); g.list.push(p); });
    const mLabel = k => k === 'khac' ? 'Chưa ghi ngày' : `Tháng ${+k.slice(5, 7)} · ${k.slice(0, 4)}`;
    const stamp = p => { const d = (p.published_at || '').split('-'); return d.length === 3 ? `<span class="nb-stamp" aria-hidden="true"><b>${d[2]}</b><small>Th${+d[1]}</small></span>` : '<span class="nb-stamp" aria-hidden="true"><b>·</b></span>'; };
    return `<a class="nb-hero" href="/blog/${esc(hero.slug)}" target="_blank" rel="noopener"><span class="nb-hero-img">${blImg(hero)}<span class="bl-glow" aria-hidden="true"></span></span>
        <span class="nb-hero-txt"><span class="mono">${hero.featured ? 'Trang nổi bật' : 'Trang mới nhất'}</span><span class="bl-tags">${topicList(hero).map(x => blChip(x, T)).join('')}</span>
        <h2>${esc(hero.title)}</h2>${hero.excerpt ? `<span class="bl-ex">${esc(hero.excerpt)}</span>` : ''}<span class="bl-meta">${blMeta(hero)}</span><span class="bl-go">Đọc trang này →</span></span></a>
      ${groups.map(g => `<section class="nb-month"><h3 class="nb-mh hand">${mLabel(g.k)}</h3>${g.list.map(p => `<a class="nb-row" href="/blog/${esc(p.slug)}" target="_blank" rel="noopener">${stamp(p)}
        <span class="nb-txt"><span class="bl-tags">${topicList(p).map(x => blChip(x, T)).join('')}</span><b>${esc(p.title)}</b>${p.excerpt ? `<span class="bl-ex">${esc(p.excerpt)}</span>` : ''}<span class="bl-meta">${p.published_at ? date(p.published_at) : ''}</span></span>
        <span class="nb-thumb">${blImg(p)}</span></a>`).join('')}</section>`).join('')}`;
  }

  /* ---------- v1.9 Blog: "Viết dưới ánh đèn" ---------- */
  const vnSlug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const topicList = p => String(p.topics || '').split(',').map(x => x.trim()).filter(Boolean);
  const blChip = (slug, T, link) => { const t = T.find(x => x.slug === slug); if (!t) return '';
    return link ? `<a class="bl-tag blc-${esc(t.color)}" href="/goc-ngam?phong=bai-viet&chu-de=${esc(t.slug)}" data-link>${esc(t.name)}</a>` : `<span class="bl-tag blc-${esc(t.color)}">${esc(t.name)}</span>`; };
  const blMeta = p => p.published_at ? date(p.published_at) : '';   // v1.15: bỏ số phút đọc
  const blImg = (p, cls = '') => safeUrl(p.cover_url) ? `<img class="${cls}" src="${esc(safeUrl(p.cover_url))}" alt="${esc(p.cover_alt || '')}" loading="lazy">` : `<span class="bl-ph ${cls}" aria-hidden="true"><i></i></span>`;
  const blCard = (p, T) => `<a class="bl-card" href="/blog/${esc(p.slug)}" target="_blank" rel="noopener">
      <span class="bl-img">${blImg(p)}<span class="bl-glow" aria-hidden="true"></span></span>
      <span class="bl-txt"><span class="bl-tags">${topicList(p).map(s => blChip(s, T)).join('')}</span><h3>${esc(p.title)}</h3>
      ${p.excerpt ? `<span class="bl-ex">${esc(p.excerpt)}</span>` : ''}<span class="bl-meta">${blMeta(p)}</span></span></a>`;
  /* Nội dung bài: markdown của web + trích dẫn (>) + đường kẻ (---) + id cho tiêu đề mục để làm mục lục */
  function blogMd(src) {
    const out = [], toc = [], buf = [], q = [];
    const flush = () => { if (buf.length) { out.push(md(buf.join('\n'))); buf.length = 0; } if (q.length) { out.push(`<blockquote class="bp-quote">${md(q.join('\n'))}</blockquote>`); q.length = 0; } };
    for (const line of String(src || '').split('\n')) {
      if (/^\s*>\s?/.test(line)) { if (buf.length) { out.push(md(buf.join('\n'))); buf.length = 0; } q.push(line.replace(/^\s*>\s?/, '')); continue; }
      if (q.length) flush();
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { flush(); out.push('<hr class="bp-hr">'); continue; }
      buf.push(line);
    }
    flush();
    const used = {};
    const html = out.join('').replace(/<h2>(.*?)<\/h2>/g, (m, t) => {
      const txt = t.replace(/<[^>]+>/g, ''); let id = vnSlug(txt) || 'muc'; used[id] = (used[id] || 0) + 1; if (used[id] > 1) id += '-' + used[id];
      toc.push([id, txt]); return `<h2 id="${id}">${t}</h2>`;
    });
    return { html, toc };
  }
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('bpBar'), art = document.querySelector('.bp-prose'); if (!bar || !art) return;
    const r = art.getBoundingClientRect(), total = r.height - innerHeight * .6;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, total > 0 ? -r.top / total : 1))})`;
  }, { passive: true });

  /* v1.14 trang chủ: màn hình laptop trong ảnh "sống" – lần lượt chiếu trang Bộ công cụ và giao diện các công cụ đang dùng được.
     Toạ độ màn hình đo trên ảnh gốc 2752×1536 (mép trên hơi hẹp hơn mép dưới). Máy tắt hiệu ứng hoạt ảnh: đứng yên ở trang Bộ công cụ */
  function laptopScreen() {
    const W = 2752, H = 1536, x = 1037, y = 847, w = 680, h = 417, pc = (v, t) => (v / t * 100).toFixed(3) + '%';
    const shots = [['/assets/screen/bo-cong-cu.jpg', 'quantritute.com/cong-cu']].concat((SITE.tools || []).filter(t => t.status === 'ok').slice(0, 2).map(t => [safeUrl(t.banner_url) || `/assets/tools/${t.slug}.jpg`, 'quantritute.com/cong-cu/' + t.slug]));
    while (shots.length < 3) shots.push(shots[0]);
    const CUR = '<svg viewBox="0 0 20 24" aria-hidden="true"><path d="M2 1.5v18.2l4.6-4.4 3 6.8 3-1.3-3-6.7h6.4z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>';
    return `<span class="lap-glow" style="left:${pc(x - 160, W)};top:${pc(y + 120, H)};width:${pc(w + 320, W)};height:${pc(h + 300, H)}" aria-hidden="true"></span>
      <div class="lap" style="left:${pc(x, W)};top:${pc(y, H)};width:${pc(w, W)};height:${pc(h, H)}" aria-hidden="true">
        <div class="lap-bar"><i></i><i></i><i></i><span>${esc(shots[0][1])}</span></div>
        <div class="lap-slides">${shots.slice(0, 3).map(([src, u]) => `<div class="lap-s" data-u="${esc(u)}"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>`).join('')}</div>
        <span class="lap-cur">${CUR}</span><span class="lap-glare"></span></div>`;
  }

  /* ---------- các trang ---------- */
  const views = {
    home() {
      const s = SITE.settings;
      const H = [...(roomsOn().length || ngOn() ? [['/goc-ngam', 'Góc ngẫm', 312, 684, 634, 982]] : []), ['/cong-cu', 'Bộ công cụ', 692, 590, 1310, 1030], ['/bang-ghim', 'Bảng ghim', 1352, 926, 1712, 1064], ['/tach-ca-phe', 'Tách cà phê', 1414, 612, 1596, 944]];
      const p = (v, t) => (v / t * 100).toFixed(2) + '%';
      return { title: 'Quản trị tử tế', html: `${notice()}
      <div class="room photo-room">
        <div class="m-lamp" aria-hidden="true"></div><button class="pullcord m-cord" data-lamp-cord aria-label="Kéo dây để bật hoặc tắt đèn"><span class="tag"></span></button>
        <div class="homenav"><a class="brand" href="/" data-link><span class="brand-name">Quản trị tử tế</span></a>
          <nav class="main" aria-label="Điều hướng chính">${navLinks('')}</nav></div>
        <div class="photo">
          <img class="ph off" src="/assets/desk-off.webp" srcset="/assets/desk-off-1376.webp 1376w, /assets/desk-off.webp 2752w" sizes="(max-width: 760px) 100vw, max(100vw, 179.21vh)" alt="" aria-hidden="true" fetchpriority="high" decoding="async">
          <img class="ph on" src="/assets/desk-on.webp" srcset="/assets/desk-on-1376.webp 1376w, /assets/desk-on.webp 2752w" sizes="(max-width: 760px) 100vw, max(100vw, 179.21vh)" fetchpriority="high" decoding="async" alt="Bàn làm việc dưới ánh đèn tường: chồng sách, laptop, sổ tay, cốc cà phê">
          <svg class="vnflag" viewBox="0 0 60 70" aria-hidden="true">
            <rect x="29" y="6" width="2.2" height="42" rx="1.1" fill="#b9b2a6"/><circle cx="30.1" cy="5.4" r="2.3" fill="#d8c08a"/>
            <path d="M31.2 8 C38 6.5 44 9.5 57 7.5 V25.5 C44 27.5 38 24.5 31.2 26 Z" fill="#DA251D"/>
            <path d="M44 11 L45.4 15.3 H49.9 L46.25 17.95 L47.65 22.25 L44 19.6 L40.35 22.25 L41.75 17.95 L38.1 15.3 H42.6 Z" fill="#FFCD00"/>
            <path d="M16 70 L19 50 Q30 45 41 50 L44 70 Z" fill="#2B231D"/><ellipse cx="30" cy="50" rx="11" ry="3" fill="#4A3C31"/>
            <g class="shade" fill="#0b0f14"><rect x="29" y="6" width="2.2" height="42" rx="1.1"/><circle cx="30.1" cy="5.4" r="2.3"/><path d="M31.2 8 C38 6.5 44 9.5 57 7.5 V25.5 C44 27.5 38 24.5 31.2 26 Z"/><path d="M16 70 L19 50 Q30 45 41 50 L44 70 Z"/><ellipse cx="30" cy="50" rx="11" ry="3"/></g>
          </svg>
          ${laptopScreen()}
          ${H.map(([h, l, x1, y1, x2, y2]) => `<a class="spot" style="left:${p(x1, 2000)};top:${p(y1, 1116)};width:${p(x2 - x1, 2000)};height:${p(y2 - y1, 1116)}" href="${h}" data-link aria-label="${l}"><span class="tag">${l}</span></a>`).join('')}
          <button class="pullcord" data-lamp-cord aria-label="Kéo dây để bật hoặc tắt đèn"><span class="tag"></span></button>
          ${musicBtn('desk-music')}
          <div class="dust" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(37 + (i * 53) % 27).toFixed(1)}%;--d:${(9 + (i * 7) % 8)}s;--dl:${-(i * 1.7).toFixed(1)}s;--s:${2 + (i % 3)}px"></i>`).join('')}</div>
          <div class="photo-text"><h1>${esc(s.headline)}</h1><p>${esc(s.tagline)}</p></div>
        </div>
        <div class="deskchips">${[['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/goc-ngam', 'Góc ngẫm'], ['/tach-ca-phe', 'Tách cà phê']].filter(x => x[0] !== '/goc-ngam' || roomsOn().length || ngOn()).map(([h, t]) => `<a href="${h}" data-link>${t}</a>`).join('')}<button class="lampchip" data-lamp-cord>Bật / tắt đèn</button></div>
      </div>` };
    },

    tools(openSlug) {
      const s = SITE.settings;
      return { title: 'Bộ công cụ · Quản trị tử tế', html: `${notice()}${subHead('/cong-cu')}<main class="wrap"><section>
        <div class="tools-head"><h1 class="page-title">Bộ công cụ tiện ích</h1><button type="button" class="btn amber ts-open" id="tsOpen" aria-haspopup="dialog">🔔 Nhận thông báo công cụ mới</button></div>
        <figure class="tquote dq"><span class="dq-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-01-chao-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-01-chao-toi.webp" alt=""></span>
          <blockquote><p>Kho công cụ dưới đây được xây dựng để hỗ trợ anh/chị giải quyết các công việc lặp đi lặp lại một cách nhanh chóng, nâng cao hiệu suất làm việc để anh/chị có thêm thời gian ở bên người thân yêu. Nếu anh/chị chưa thấy công cụ phù hợp cho nhu cầu của mình, <button type="button" class="dq-link" data-suggest="">kể cho Đốm nghe nhé</button>, Đốm sẽ nghiên cứu và hỗ trợ anh/chị.</p></blockquote></figure>
        <div class="tbar"><div class="tabs" role="tablist" aria-label="Nhóm chủ đề">${TABS.map(([k, label]) => `<button role="tab" data-tab="${k}" class="${TAB_G[k] ? 'g-' + TAB_G[k] : ''}" aria-selected="${k === tab}">${k === 'noi-bat' ? `<span class="tab-star">${STAR}</span>` : ''}${label}</button>`).join('')}</div>
        <input class="search" id="q" type="search" placeholder="Tìm kiếm nhanh" aria-label="Tìm công cụ" value="${esc(query)}"></div>
        <p class="note" id="tabnote" role="status"></p>
        <div id="toolgroups"></div></section>
        <section class="tg-guides" aria-labelledby="tgG"><div class="tg-gh"><h2 id="tgG">Hướng dẫn từng bước</h2><a href="/huong-dan/">Xem tất cả →</a></div>
          <div class="tg-gl">${GUIDES.map(([, h, n]) => `<a href="${h}"><span>Hướng dẫn</span><b>${esc(n)}</b></a>`).join('')}</div></section>
        ${s.forms_open ? `<section id="dat-hang" class="dq-cta"><span class="dq-cta-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-09-suy-nghi-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-09-suy-nghi-toi.webp" alt=""></span>
          <div><p class="mono">Đề xuất công cụ</p><h2>Anh/chị đang “cày” việc gì lặp đi lặp lại?</h2>
          <p>Đốm sẵn sàng lắng nghe nhu cầu của anh/chị và sẽ cố gắng để hỗ trợ tìm ra giải pháp, công cụ phù hợp ạ!</p></div>
          <button type="button" class="btn amber" data-suggest="">Kể Đốm nghe</button></section>` : ''}
        </main>`,
        after: () => { renderGroups(); initToolSub(); if (openSlug) openTool(openSlug, null, true); else if (location.hash === '#dat-hang') $('#dat-hang')?.scrollIntoView({ behavior: 'smooth' }); } };
    },

    board() {
      const open = SITE.settings.forms_open !== false;
      return { title: 'Bảng ghim · Quản trị tử tế', html: `${notice()}${subHead('/bang-ghim')}<main class="wrap bg-main">
        <div class="bg-intro"><div><p class="mono">Bảng ghim</p><h1 class="page-title">Công cụ mọi người đang cần</h1>
          <p class="hand bg-lead">Mỗi tờ giấy là một việc lặp lại có người nhờ. Càng nhiều người cùng cần, Đốm càng làm sớm.</p></div>
          ${open ? '<button type="button" class="bg-cta" data-suggest="">+ Ghim một đề xuất</button>' : ''}</div>
        <div class="cork" id="board"><div class="loading">Đang tải…</div></div>
        <div class="bg-rest" id="bgRest"></div>
        </main>${footer()}`,
        after: async () => {
          let items = [];
          try { items = (await api('board')).items || []; renderBoard(items); }
          catch (e) { $('#board').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
          const vote = async b => {
            if (!b || b.getAttribute('aria-pressed') === 'true' || b.disabled) return;
            const id = +b.dataset.vote; b.disabled = true;
            try {
              const r = await api('board/' + id, { method: 'POST', body: JSON.stringify({ cid: voterId() }) });
              const v = new Set(store.get('qtt-voted', [])); v.add(id); store.set('qtt-voted', [...v]);
              const n = items.find(x => x.id === id); if (n) n.votes = r.votes;
              document.querySelectorAll(`[data-vote="${id}"]`).forEach(x => { x.setAttribute('aria-pressed', 'true'); x.innerHTML = `<span class="n-plus" aria-hidden="true">✓</span>Bạn cũng cần<b>${r.votes}</b>`; });
              b.closest('.pnote')?.classList.add('bump');
            } catch (e) { b.title = e.message; } finally { b.disabled = false; }
          };
          const openNote = el => {
            const n = items.find(x => x.id === +el.dataset.note); if (!n) return;
            if (toolOf(n.tool_slug)) { openTool(n.tool_slug, el); return; }
            const voted = new Set(store.get('qtt-voted', [])).has(n.id);
            openPanel(noteModal(n, voted), el, n.board_title);
            modalOpen.addEventListener('click', e => { const b = e.target.closest('[data-vote]'); if (b) vote(b); });
          };
          $('#board').addEventListener('click', ev => {
            const b = ev.target.closest('[data-vote]'); if (b) { vote(b); return; }
            if (ev.target.closest('[data-more-released]')) { openPanel(releasedModal(releasedTools()), ev.target.closest('button'), 'Công cụ đã phát hành'); return; }
            if (ev.target.closest('a,button')) return;
            const tn = ev.target.closest('[data-tool-note]'); if (tn) { openTool(tn.dataset.toolNote, tn); return; }
            const el = ev.target.closest('[data-note]'); if (el) openNote(el);
          });
          $('#board').addEventListener('keydown', ev => {
            if (ev.key !== 'Enter' && ev.key !== ' ') return;
            const tn = ev.target.closest('[data-tool-note]'); if (tn && ev.target === tn) { ev.preventDefault(); openTool(tn.dataset.toolNote, tn); return; }
            const el = ev.target.closest('[data-note]'); if (el && ev.target === el) { ev.preventDefault(); openNote(el); }
          });
        } };
    },

    /* Góc ngẫm / phòng đang ẩn: trang "đang chuẩn bị" (không lộ nội dung) */
    ngamPrep(what) {
      return { title: 'Góc ngẫm · Quản trị tử tế', html: `${notice()}${subHead('')}<main class="wrap"><div class="dom-lost gn-prep">
        <span class="gn-prep-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-15-doc-sach-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-15-doc-sach-toi.webp" alt=""></span>
        <p class="mono">${esc(what || 'Góc ngẫm')}</p><h1 class="page-title">Đốm đang chuẩn bị góc này</h1>
        <p class="hand gn-lead">Những trang ghi chép đang được viết cẩn thận. Anh/chị quay lại sau nhé – trong lúc chờ, mời anh/chị ghé Bộ công cụ.</p>
        <p><a class="btn" href="/cong-cu" data-link>Xem Bộ công cụ</a> <a class="btn ghost" href="/" data-link>Về trang chủ</a></p></div></main>${footer()}` };
    },
    ngam() {
      const q = new URLSearchParams(location.search), ph = q.get('phong'), RON = roomsOn();
      if (!RON.length) return views.ngamPrep();
      const room = RON.some(r => r[0] === ph) ? ph : RON[0][0];
      return { title: 'Góc ngẫm · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<main class="wrap">
        <div class="gn-intro"><p class="mono">Góc ngẫm</p><h1 class="page-title">Đọc, xem, viết và nghĩ lại</h1>
          <p class="hand gn-lead">Những cuốn sách, thước phim và trang ghi chép Đốm muốn chia sẻ cùng anh/chị.</p></div>
        <div class="gn-switch${RON.length < 2 ? ' one' : ''}" role="tablist" aria-label="Chọn phòng">${RON.map(([k, n]) => `<button type="button" role="tab" data-room="${k}" aria-selected="${room === k}">${n}</button>`).join('')}</div>
        <div id="gnRoom" class="gn-room"><div class="loading">Đang tải…</div></div></main>${footer()}`,
        after: async () => {
          const box = $('#gnRoom'); let cur = room, ci = 0, vi = 0, playing = false, data = null, posts = null, T = [], shelfI = null;
          const loadRefl = async () => { if (!data) data = (await api('reflections')).items || []; return data; };
          const loadPosts = async () => { if (!posts) { const [a, b] = await Promise.all([api('posts'), api('topics').catch(() => ({ topics: [] }))]); posts = a.posts || []; T = b.topics || []; } };
          const paint = async () => {
            document.querySelectorAll('[data-room]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.room === cur)));
            try {
              if (cur === 'bai-viet') {
                await loadPosts();
                const tp = new URLSearchParams(location.search).get('chu-de') || '', ct = T.find(t => t.slug === tp);
                const count = x => posts.filter(p => topicList(p).includes(x)).length;
                const list = tp ? posts.filter(p => topicList(p).includes(tp)) : posts;
                box.innerHTML = `<nav class="bl-topics nb-topics" aria-label="Lọc theo chủ đề">${posts.length ? `<a href="/goc-ngam?phong=bai-viet" data-topic="" aria-current="${!tp}">Tất cả <b>${posts.length}</b></a>` + T.filter(t => count(t.slug)).map(t => `<a href="/goc-ngam?phong=bai-viet&chu-de=${esc(t.slug)}" data-topic="${esc(t.slug)}" class="blc-${esc(t.color)}" aria-current="${tp === t.slug}">${esc(t.name)} <b>${count(t.slug)}</b></a>`).join('') : ''}</nav>
                  ${ct && ct.description ? `<p class="bl-tdesc">${esc(ct.description)}</p>` : ''}
                  <div class="nb">${list.length ? notebookHtml(list, T) : `<div class="bl-empty"><span class="bl-ph" aria-hidden="true"><i></i></span><p class="hand">${posts.length ? 'Chủ đề này chưa có bài.' : 'Trang ghi chép đầu tiên đang được viết dưới ánh đèn.'}</p></div>`}</div>`;
                return;
              }
              const items = await loadRefl();
              if (cur === 'chieu') box.innerHTML = cinemaHtml(channelsOf(items.filter(x => x.kind === 'video')), ci, vi, playing);
              else box.innerHTML = bookcaseHtml(items.filter(x => x.kind !== 'video'));
            } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
          };
          await paint();
          const setRoom = k => { cur = k; playing = false; shelfI = null; const u = new URL(location.href); u.searchParams.set('phong', k); if (k !== 'bai-viet') u.searchParams.delete('chu-de'); history.replaceState(null, '', u.pathname + u.search); paint(); };
          document.querySelector('.gn-switch').addEventListener('click', e => { const b = e.target.closest('[data-room]'); if (b && b.dataset.room !== cur) setRoom(b.dataset.room); });
          const closeBook = () => { const m = $('.gn-modal'); if (m) m.remove(); document.documentElement.classList.remove('gn-lock'); };
          box.addEventListener('click', e => {
            const tpa = e.target.closest('[data-topic]');
            if (tpa) { e.preventDefault(); e.stopPropagation(); const u = new URL(location.href); if (tpa.dataset.topic) u.searchParams.set('chu-de', tpa.dataset.topic); else u.searchParams.delete('chu-de'); history.replaceState(null, '', u.pathname + u.search); paint(); return; }
            const cell = e.target.closest('[data-shelf]');
            if (cell) { shelfI = +cell.dataset.shelf; paint().then(() => { box.querySelector('.bc-open')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); box.querySelector('.bc-back')?.focus({ preventScroll: true }); }); return; }
            if (e.target.closest('[data-shelf-back]')) { const k = shelfI; shelfI = null; paint().then(() => box.querySelector(`[data-shelf="${k}"]`)?.focus()); return; }
            const sp = e.target.closest('[data-book]');
            if (sp) {
              const b = data.find(x => x.slug === sp.dataset.book); if (!b) return;
              closeBook(); box.insertAdjacentHTML('beforeend', bookModal(b));
              document.documentElement.classList.add('gn-lock');
              const m = $('.gn-modal'); m.querySelector('.gn-x').focus();
              m.addEventListener('click', ev => {
                if (ev.target.closest('[data-gn-close]')) { closeBook(); sp.focus(); return; }
                const t = ev.target.closest('[data-bm]'); if (!t) return;
                m.querySelectorAll('[data-bm]').forEach(x => x.setAttribute('aria-selected', String(x === t)));
                m.querySelectorAll('.bm-pane').forEach(p => { p.hidden = p.dataset.pane !== t.dataset.bm; });
              });
              m.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeBook(); sp.focus(); } });
              return;
            }
            const ch = e.target.closest('[data-ch]'); if (ch) { ci = +ch.dataset.ch; vi = 0; playing = false; paint(); return; }
            if (e.target.closest('[data-playall]')) { vi = 0; playing = true; paint(); return; }
            const pv = e.target.closest('[data-playv]'); if (pv) { playing = true; paint(); return; }
            const tp = e.target.closest('[data-tape]');
            if (tp) { vi = +tp.dataset.tape; playing = true; paint().then(() => { if (innerWidth < 980) $('#tvScreen')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); else box.querySelector('.cn2-it[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }); }); }
          });
        } };
    },

    /* v1.14 Về Đốm (góp ý 12/10): đứng đầu menu; là trang DUY NHẤT nhắc tên anh Minh Tuấn.
       Lời chào → Tên của em (đom đóm dẫn đường) → Đốm kể nhỏ (anh Minh Tuấn + kỳ vọng) → Đốm cùng anh Minh Tuấn hỗ trợ → Các cổng kết nối. Nội dung sửa ở Cài đặt → Về Đốm */
    about() {
      const s = SITE.settings, photo = safeUrl(s.about_photo), services = pipeRows(s.about_services);
      const P = (v, cls = '') => lines(v).map(p => `<p class="${cls}">${esc(p)}</p>`).join('');
      const img = (code, cls = '') => `<span class="${cls}" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-${code}-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-${code}-toi.webp" alt=""></span>`;
      const flies = Array.from({ length: 22 }, (_, i) => `<i style="--x:${(i * 41) % 100}%;--y:${(i * 67) % 90 + 5}%;--d:${5 + (i * 7) % 6}s;--dl:-${(i * 1.3).toFixed(1)}s;--s:${3 + (i % 3)}px"></i>`).join('');
      const ch = [['fb', 'Facebook', safeUrl(s.social_facebook)], ['zalo', 'Zalo', zaloUrl(s.contact_zalo)], ['tt', 'TikTok', safeUrl(s.social_tiktok)], ['yt', 'YouTube', safeUrl(s.social_youtube)],
        ['mail', 'Email', /@/.test(s.contact_email || '') ? 'mailto:' + String(s.contact_email).trim() : '']];
      const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_IC[k]}</svg>`;
      return { title: 'Về Đốm · Quản trị tử tế', html: `${notice()}${subHead('/ve-dom')}<main class="vd">
        <section class="vd-hero wrap">
          <div class="vd-art">${img('01-chao', 'vd-dom')}<span class="vd-halo" aria-hidden="true"></span></div>
          <div class="vd-hi"><p class="mono">Về Đốm</p><h1 class="page-title">Em chào anh/chị,<br>em là <em>Đốm</em>!</h1>${P(s.dom_intro, 'vd-p')}
            <div class="vd-act"><a class="btn amber" href="/cong-cu" data-link>Xem bộ công cụ</a><button type="button" class="btn ghost" data-dom-talk>Gửi lời nhắn cho Đốm</button></div></div>
        </section>
        <section class="vd-name" data-dark><div class="vd-flies" aria-hidden="true">${flies}</div>
          <div class="wrap vd-name-in"><span class="vd-dom-s" aria-hidden="true"><img src="/assets/dom/dom-06-roi-den-toi.webp" alt=""></span><div><p class="mono">Tên của em</p><h2>Đom đóm dẫn đường</h2>${P(s.dom_name)}</div></div>
        </section>
        <section class="vd-story wrap"><h2 class="vd-h"><span class="hand">Đốm kể nhỏ</span></h2>
          <div class="vd-paper"><div class="vd-photo">${photo ? `<img src="${esc(photo)}" alt="Anh Minh Tuấn">` : '<span>MT</span>'}<span class="vd-tape" aria-hidden="true"></span><span class="vd-cap hand">anh Minh Tuấn</span></div>
            <div class="vd-tell">${P(s.dom_tuan)}${lines(s.dom_hope).length ? `<blockquote class="vd-hope"><span class="mono">Kỳ vọng khi tạo ra Đốm</span>${P(s.dom_hope, 'hand')}</blockquote>` : ''}</div></div>
        </section>
        ${services.length ? `<section class="vd-help wrap" id="vd-help"><h2 class="vd-h">Những việc em cùng anh Minh Tuấn có thể hỗ trợ anh/chị:</h2>
          <div class="vd-stage"><div class="vd-disc" aria-hidden="true">${services.map(([n], i) => img(svcPose(n, i), 'vd-pose' + (i === 0 ? ' on' : ''))).join('')}</div>
            <div class="vd-list">${services.map(([n], i) => `<a class="vd-li${i === 0 ? ' on' : ''}" data-i="${i}" href="/tach-ca-phe?dich-vu=${encodeURIComponent(n)}#cafe" data-link><span class="vd-n">${esc(n)}</span><span class="sv-go">Hẹn trò chuyện${SV_GO}</span></a>`).join('')}</div></div>
          <p class="vd-note hand">Chưa thấy đúng việc của mình? Anh/chị cứ <a href="/tach-ca-phe" data-link>hẹn một tách cà phê</a>, Đốm sẽ nói thật mình giúp được tới đâu.</p></section>` : ''}
        <section class="vd-ports wrap"><h2 class="vd-h">Các cổng kết nối với Đốm</h2>
          <div class="vd-gates">
            <button type="button" class="vd-gate" data-suggest="">${img('14-tai-lieu', 'vd-g-img')}<b>Đề xuất công cụ</b><span>Kể Đốm nghe việc anh/chị đang làm đi làm lại</span></button>
            <button type="button" class="vd-gate" data-dom-talk>${img('21-cam-on', 'vd-g-img')}<b>Gửi lời nhắn</b><span>Góp ý, hỏi đáp, hẹn trò chuyện 1:1</span></button>
            <a class="vd-gate" href="/bang-ghim" data-link>${img('24-ghim', 'vd-g-img')}<b>Bảng ghim</b><span>Xem công cụ mới, bấm “Tôi cũng cần”</span></a>
            <a class="vd-gate" href="/tach-ca-phe" data-link>${img('25-ca-phe-vui', 'vd-g-img')}<b>Tách cà phê</b><span>Ngồi lại trò chuyện, hoặc mời Đốm một tách</span></a>
          </div>
          <div class="ab-ch vd-ch">${ch.map(([k, n, u]) => u ? `<a href="${esc(u)}" ${k === 'mail' ? '' : 'target="_blank" rel="noopener"'} class="ab-c c-${k}">${svg(k)}<span>${n}</span></a>` : `<span class="ab-c off" title="Sắp cập nhật">${svg(k)}<span>${n}</span></span>`).join('')}</div>
          <p class="ab-sign hand">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}</p>
        </section>
        </main>${footer()}`,
        after: () => {
          /* Phương án B: rê chuột/focus vào dịch vụ → Đốm đổi dáng; trên cảm ứng chạm lần 1 để xem Đốm, chạm lần 2 để hẹn */
          const st = document.querySelector('.vd-stage'); if (!st) return;
          const lis = [...st.querySelectorAll('.vd-li')], poses = [...st.querySelectorAll('.vd-pose')];
          const on = i => { lis.forEach((l, k) => l.classList.toggle('on', k === i)); poses.forEach((p, k) => p.classList.toggle('on', k === i)); };
          lis.forEach((l, i) => {
            l.addEventListener('mouseenter', () => on(i));
            l.addEventListener('focus', () => on(i));
            l.addEventListener('click', e => { if (matchMedia('(hover:none)').matches && !l.classList.contains('on')) { e.preventDefault(); e.stopPropagation(); on(i); } });
          });
        } };
    },

    /* v1.14 Tách cà phê (góp ý 12/10): lời nhắn không bắt buộc; Đốm cầm cốc vui hào hứng; ẩn thông tin ngân hàng – chỉ còn tách cà phê + mã QR rõ ràng;
       góc cà phê thành một khung cảnh: ô cửa sổ nắng sớm (tắt đèn: trời đêm), bàn gỗ, tách sứ thật hơn với hơi nước bay, thẻ QR dựng cạnh tách */
    cafe() {
      const s = SITE.settings, wall = lines(s.thanks_wall);
      const CUP = `<svg class="cf3-cup" viewBox="0 0 320 230" aria-hidden="true"><defs>
          <linearGradient id="cfBody" x1="0" x2="1"><stop offset="0" stop-color="#d9cfc0"/><stop offset=".18" stop-color="#fbf7f0"/><stop offset=".5" stop-color="#fffdf8"/><stop offset=".82" stop-color="#efe6d8"/><stop offset="1" stop-color="#c9bba6"/></linearGradient>
          <radialGradient id="cfCoffee" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#c58b52"/><stop offset=".55" stop-color="#8a5326"/><stop offset="1" stop-color="#4a2a12"/></radialGradient>
          <linearGradient id="cfSaucer" x1="0" x2="1"><stop offset="0" stop-color="#cfc3b1"/><stop offset=".45" stop-color="#fbf6ee"/><stop offset="1" stop-color="#c4b59f"/></linearGradient>
          <radialGradient id="cfShadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(40,22,8,.45)"/><stop offset="1" stop-color="rgba(40,22,8,0)"/></radialGradient></defs>
        <ellipse cx="160" cy="214" rx="150" ry="14" fill="url(#cfShadow)"/>
        <ellipse cx="160" cy="196" rx="138" ry="24" fill="url(#cfSaucer)"/><ellipse cx="160" cy="190" rx="92" ry="13" fill="#e9dfd0"/><ellipse cx="160" cy="188" rx="84" ry="10" fill="rgba(120,90,60,.12)"/>
        <path d="M246 78c46-6 52 70 4 82" fill="none" stroke="#efe6d8" stroke-width="16" stroke-linecap="round"/><path d="M246 78c46-6 52 70 4 82" fill="none" stroke="rgba(160,140,115,.35)" stroke-width="3" stroke-linecap="round" transform="translate(3 4)"/>
        <path d="M60 52h196l-14 116c-3 18-20 30-38 30H112c-18 0-35-12-38-30z" fill="url(#cfBody)"/>
        <path d="M72 70c4 50 8 80 14 98" stroke="rgba(255,255,255,.85)" stroke-width="6" stroke-linecap="round" fill="none"/>
        <ellipse cx="158" cy="52" rx="98" ry="17" fill="#fffaf2"/><ellipse cx="158" cy="54" rx="88" ry="12.5" fill="url(#cfCoffee)"/>
        <path class="cf3-art" d="M158 66c-10-6-24-11-24-20 0-6 5-9 10-9 6 0 10 4 14 9 4-5 8-9 14-9 5 0 10 3 10 9 0 9-14 14-24 20z" fill="#f4e3c8" opacity=".92"/>
        <path d="M108 200c18 6 82 6 104 0" stroke="rgba(255,255,255,.7)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
      const STEAM = '<svg class="cf3-steam" viewBox="0 0 120 110" aria-hidden="true"><path d="M38 106c-12-16 12-26 0-42s10-28 2-46"/><path d="M60 106c-12-16 12-26 0-42s10-28 2-46"/><path d="M82 106c-12-16 12-26 0-42s10-28 2-46"/></svg>';
      const qr = s.donate_qr ? `<button type="button" class="cf3-qr" data-qrzoom aria-label="Phóng to mã QR"><img src="${esc(s.donate_qr)}" alt="Mã QR mời Đốm một tách cà phê" loading="lazy"><span class="cf3-qr-t hand">Quét mã mời Đốm một tách ☕</span></button>`
        : `<span class="cf3-qr none"><span class="hand">Mã QR sắp có</span></span>`;
      return { title: 'Tách cà phê · Quản trị tử tế', html: `${notice()}${subHead('/tach-ca-phe')}<main class="wrap cf2 cf3 cf4w cf5w cf6w">
        <section class="cf2-talk" id="hen-1-1"><p class="mono">Tách cà phê</p><h1 class="page-title">Ngồi lại trò chuyện</h1>
          <p class="cf2-lead">Anh/chị đang vướng chuyện vận hành, nhân sự hay một việc lặp đi lặp lại? Để lại vài dòng, Đốm sẽ liên hệ hẹn một buổi trò chuyện 1:1 cùng anh/chị.</p>
          ${s.booking_open ? `<form class="cf-form cf2-form" id="bookform" novalidate>
            <div class="bg-two"><label for="b-name">Tên anh/chị<input id="b-name" required></label>
            <label for="b-contact">Số điện thoại, Zalo hoặc Email<input id="b-contact" required></label></div>
            <label for="b-topic">Muốn trao đổi về<select id="b-topic"><option>Xây dựng website, công cụ tự động hóa theo nhu cầu riêng</option><option>Kinh nghiệm, kiến thức triển khai AI, AI agents</option><option>Tối ưu bộ máy, quy trình vận hành cho HKD hoặc SMEs</option><option>Xây dựng hệ thống đào tạo nội bộ, văn hóa doanh nghiệp</option><option>Setup &amp; vận hành spa chăm sóc sức khỏe</option><option>Khác</option></select></label>
            <label for="b-desc">Lời nhắn / mô tả nhu cầu, tình trạng cụ thể <small>(không bắt buộc)</small><textarea id="b-desc" rows="3" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
            <label class="cf-check"><input type="checkbox" id="b-consent"> Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.</label>
            <input type="text" id="b-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="bg-send"><button type="submit">Gửi lời hẹn</button><p id="b-msg" role="status"></p>
              <button type="button" class="dq-link cf2-tool" data-suggest="">Cần một công cụ? Kể Đốm nghe →</button></div></form>` : '<p class="hand cf-off">Hiện tạm ngừng nhận lịch trò chuyện.</p>'}
        </section>
        <aside class="cf6" aria-label="Mời Đốm một tách cà phê">
          <div class="cf6-photo">
            <img class="cf6-bg" src="/assets/cafe/cafe-view-1400.webp" srcset="/assets/cafe/cafe-view-900.webp 900w, /assets/cafe/cafe-view-1400.webp 1400w" sizes="(max-width:900px) 92vw, 600px" alt="Tách cà phê trắng trên bàn gỗ nhỏ, ghế bành và chăn len, nhìn ra thung lũng núi lúc bình minh, nắng xuyên mây" loading="lazy">
            <span class="cf6-sun" aria-hidden="true"></span>
            <div class="cf6-say"><span class="cf6-dom" aria-hidden="true"><img src="/assets/dom/dom-25-ca-phe-vui-dac.webp" alt=""></span>
              <p class="cf6-bubble hand">${esc(s.donate_note || 'Nếu anh/chị tìm được một công cụ hữu ích cho mình, thưởng cho Đốm để tạo nhiều giá trị hơn nhé.')}</p></div>
            <div class="cf6-card">
              <p class="cf6-k">Mời Đốm một tách cà phê</p>
              ${s.donate_qr ? `<button type="button" class="cf6-qr" data-qrzoom aria-label="Phóng to mã QR mời Đốm một tách cà phê"><img src="${esc(s.donate_qr)}" alt="Mã QR mời Đốm một tách cà phê" loading="lazy"></button>` : '<span class="cf6-qr none hand">Mã QR sắp có</span>'}
            </div>
          </div>
          ${s.cafe_thanks || wall.length ? `<div class="cf5-foot">${s.cafe_thanks ? `<p class="cf2-thanks hand">${esc(lines(s.cafe_thanks)[0])}</p>` : ''}
            ${wall.length ? `<div class="cf2-wall"><span class="mono">Cảm ơn những tách cà phê</span><p>${wall.slice(0, 12).map(n => `<span>${esc(n)}</span>`).join('')}</p></div>` : ''}</div>` : ''}
        </aside></main>`,
        after: () => {
          /* v1.15o Hộp thoại của Đốm: giữ các cụm từ đi liền (công cụ, giá trị…) trên cùng 1 dòng, rồi co hộp vừa khít chữ, các dòng dài đều nhau */
          const bub = document.querySelector('.cf6-bubble');
          if (bub) {
            const PH = ['tách cà phê', 'cà phê', 'công cụ', 'hữu ích', 'giá trị', 'tìm được', 'anh/chị', 'quản trị', 'tử tế', 'hỗ trợ', 'trò chuyện', 'đồng hành', 'cảm ơn', 'giúp đỡ', 'Đốm ơi'];
            let t = bub.textContent.trim().replace(/\s+/g, ' ');
            PH.forEach(p => { t = t.replace(new RegExp(p.replace(/[/]/g, '\\/'), 'gi'), m => m.replace(/ /g, '\u00A0')); });
            bub.textContent = t;
            const lines = () => { const r = document.createRange(); r.selectNodeContents(bub); const tops = new Set([...r.getClientRects()].map(x => Math.round(x.top))); return { n: tops.size, w: Math.max(0, ...[...r.getClientRects()].map(x => x.width)) }; };
            const fit = () => {
              bub.style.width = ''; const maxW = bub.getBoundingClientRect().width, cs = getComputedStyle(bub);
              const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), n0 = lines().n;
              if (!maxW || !n0) return;
              let lo = Math.max(80, maxW * .5), hi = maxW;
              while (hi - lo > 2) { const mid = (lo + hi) / 2; bub.style.width = mid + 'px'; if (lines().n > n0) lo = mid; else hi = mid; }
              bub.style.width = Math.ceil(hi) + 'px';
              const w = lines().w; if (w) bub.style.width = Math.ceil(w + pad + 2) + 'px';
              if (lines().n > n0) bub.style.width = Math.ceil(hi) + 'px';
            };
            fit(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => document.body.contains(bub) && fit(), 150); });
            document.fonts && document.fonts.ready.then(() => requestAnimationFrame(() => document.body.contains(bub) && fit()));
          }
          const qz = document.querySelector('[data-qrzoom]');
          if (qz) qz.addEventListener('click', () => {   /* v1.15j phóng to mã QR in trên cốc thành thẻ lớn dễ quét */
            const src = qz.querySelector('img')?.src; if (!src) return;
            const m = document.createElement('div'); m.className = 'cf6-zoom'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Mã QR mời Đốm một tách cà phê');
            m.innerHTML = `<div class="cf6-zcard"><p>Mời Đốm một tách cà phê</p><img src="${src}" alt="Mã QR">
              <div class="cf6-zbtns"><a class="cf6-zdl" href="/api/qr?tai=1" download="ma-qr-moi-dom-tach-ca-phe.png"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>Tải mã QR</a><button type="button" class="cf6-zx">Đóng</button></div>
              <small>Mở app ngân hàng → Quét QR → chọn ảnh vừa tải</small></div>`;
            const close = () => { m.remove(); document.removeEventListener('keydown', esc1); qz.focus(); }, esc1 = e => { if (e.key === 'Escape') close(); };
            m.addEventListener('click', e => { if (e.target === m || e.target.closest('.cf6-zx')) close(); }); document.addEventListener('keydown', esc1);
            document.body.append(m); m.querySelector('.cf6-zx').focus();
          });
          if (location.hash === '#cong-cu') setTimeout(() => document.querySelector('.cf2-tool')?.click(), 400);
        } };
    },

    blogPost(slug) {
      if (!ngOn('bai-viet') && !new URLSearchParams(location.search).get('xem-truoc')) return views.ngamPrep('Góc ngẫm · Bài viết');
      return { title: 'Blog · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<div class="bp-progress" aria-hidden="true"><span id="bpBar"></span></div><main class="wrap" id="bp"><div class="loading">Đang tải…</div></main>${footer()}`,
        after: async () => {
          const box = $('#bp'), key = new URLSearchParams(location.search).get('xem-truoc') || '';
          let d, T = [];
          try { [d, T] = await Promise.all([api('posts/' + encodeURIComponent(slug) + (key ? '?xem-truoc=' + encodeURIComponent(key) : '')), api('topics').then(r => r.topics || []).catch(() => [])]); }
          catch (e) { box.innerHTML = `<div class="bl-empty"><span class="bl-ph" aria-hidden="true"><i></i></span><p class="hand">Không tìm thấy bài viết này.</p><a class="bl-back" href="/goc-ngam?phong=bai-viet" data-link>← Về Góc ngẫm</a></div>`; return; }
          const p = d.post, { html, toc } = blogMd(p.body), link = location.origin + '/blog/' + p.slug, name = 'Quản trị tử tế';
          document.title = p.title + ' · Quản trị tử tế';
          box.innerHTML = `<article class="bp">
            ${p.preview ? '<p class="bp-preview">Bản xem trước – bài chưa đăng, chỉ người có link này xem được</p>' : ''}
            <header class="bp-head"><p class="bp-crumb"><a href="/goc-ngam?phong=bai-viet" data-link>Góc ngẫm · Bài viết</a>${topicList(p).map(s => blChip(s, T, true)).join('')}</p>
              <h1 class="bp-title">${esc(p.title)}</h1>${p.excerpt ? `<p class="bp-sapo">${esc(p.excerpt)}</p>` : ''}
              <p class="bp-meta"><a href="/ve-dom" data-link>${esc(name)}</a>${blMeta(p) ? ' · ' + blMeta(p) : ''}</p></header>
            ${safeUrl(p.cover_url) ? `<figure class="bp-cover"><img src="${esc(safeUrl(p.cover_url))}" alt="${esc(p.cover_alt || '')}"></figure>` : ''}
            <div class="bp-layout${toc.length >= 3 ? ' has-toc' : ''}">
              ${toc.length >= 3 ? `<aside class="bp-toc"><p class="mono">Trong bài này</p><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol></aside>` : ''}
              <div class="bp-prose prose">${html}</div></div>
            <footer class="bp-end">
              <div class="bp-share"><span class="mono">Chia sẻ bài viết</span><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}" target="_blank" rel="noopener">Facebook ↗</a><button type="button" id="bpCopy">Sao chép link</button></div>
              <div class="bp-cta"><a href="/bang-ghim" data-link><span class="mono">Bảng ghim</span><b>Bạn đang lặp lại việc gì mỗi ngày?</b><span>Đề xuất một công cụ →</span></a>
                <a href="/tach-ca-phe#hen-1-1" data-link><span class="mono">Tách cà phê</span><b>Muốn trao đổi sâu hơn?</b><span>Hẹn trò chuyện 1:1 →</span></a></div>
              ${(d.related || []).length ? `<div class="bp-next"><h2 class="vm-h">Đọc tiếp</h2><div class="bl-grid">${d.related.map(r => blCard(r, T)).join('')}</div></div>` : ''}
            </footer></article>`;
          $('#bpCopy').onclick = async () => { try { await navigator.clipboard.writeText(link); $('#bpCopy').textContent = 'Đã chép link'; setTimeout(() => { const b = $('#bpCopy'); if (b) b.textContent = 'Sao chép link'; }, 1600); } catch (e) { } };
        } };
    },

    journey() {
      return { title: 'Hành trình · Quản trị tử tế', html: `${notice()}${subHead('/hanh-trinh')}<main class="wrap"><section>
        <p class="mono">Hành trình</p><h1 class="page-title">Nhật ký làm thật</h1>
        <p class="muted" style="max-width:40em;margin-top:8px">Chặng đường xây doanh nghiệp một người cùng AI.</p>
        <div id="eps" class="eps" style="margin-top:24px"><div class="loading">Đang tải…</div></div></section></main>${footer()}`,
        after: async () => {
          const box = $('#eps');
          try {
            const { episodes } = await api('episodes');
            box.innerHTML = episodes.length ? episodes.map(e => `<article class="card" style="padding:20px;display:grid;gap:12px">
              <div><p class="mono">${esc(e.no)}${e.publish_date ? ' · ' + date(e.publish_date) : ''}</p><h2 style="font-family:var(--f-wall);font-weight:500;font-size:22px;margin-top:4px">${esc(e.title)}</h2></div>
              ${ytFrame(e.yt)}${e.summary ? `<div class="prose">${md(e.summary)}</div>` : ''}
              ${e.shorts.length ? `<div><p class="mono" style="margin-bottom:8px">Video ngắn từ tập này</p><div class="shorts" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${e.shorts.map(v => ytFrame(v.yt, true) || `<a class="short" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.label || 'Xem')}</a>`).join('')}</div></div>` : ''}
            </article>`).join('') : `<div class="empty">Tập đầu tiên sắp lên sóng.</div>`;
          } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
        } };
    },

    posts(cats, key, title, eyebrow) {
      return { title: title + ' · Quản trị tử tế', html: `${notice()}${subHead(key)}<main class="wrap"><section>
        <p class="mono">${eyebrow}</p><h1 class="page-title">${title}</h1>
        <div class="cols3" style="margin-top:24px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))" id="cats">${cats.map(c => `<div class="card cat"><h3>${CAT[c]}</h3><div class="postlist" data-cat="${c}" style="margin-top:12px"><p class="note">Đang tải…</p></div></div>`).join('')}</div>
        </section></main>${footer()}`,
        after: async () => {
          try {
            const { posts } = await api('posts');
            document.querySelectorAll('[data-cat]').forEach(box => {
              const list = posts.filter(p => p.category === box.dataset.cat);
              box.innerHTML = list.length ? list.map(p => `<a class="postitem" href="/blog/${esc(p.slug)}" data-link style="padding:0"><h3>${esc(p.title)}</h3><span class="note">${date(p.published_at)}</span>${p.excerpt ? `<span class="muted" style="font-size:14px">${esc(p.excerpt)}</span>` : ''}</a>`).join('') : `<div class="empty" style="margin-top:0">Chưa có bài đăng.</div>`;
            });
          } catch (e) { $('#cats').insertAdjacentHTML('beforebegin', `<p class="err">${esc(e.message)}</p>`); }
        } };
    },

    post(slug) {
      return { title: 'Bài viết · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<main class="wrap" id="post"><div class="loading">Đang tải…</div></main>${footer()}`,
        after: async () => {
          const box = $('#post');
          try {
            const { post: p } = await api('posts/' + encodeURIComponent(slug));
            document.title = p.title + ' · Quản trị tử tế';
            box.innerHTML = `<article><p class="crumb"><a href="/blog" data-link>Blog</a> / ${esc(CAT[p.category] || '')}</p>
              <h1 class="page-title" style="max-width:24ch">${esc(p.title)}</h1><p class="note" style="margin:8px 0 22px">${date(p.published_at)}</p>
              ${p.cover_url ? `<img src="${esc(p.cover_url)}" alt="" style="border-radius:14px;margin-bottom:22px;max-height:420px;object-fit:cover;width:100%">` : ''}
              <div class="prose">${md(p.body)}</div></article>`;
          } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)} <a href="/blog" data-link>Về Blog</a></div>`; }
        } };
    },

    contact(key = '/lien-he') {
      const s = SITE.settings;
      const items = [['Điện thoại', s.contact_phone], ['Zalo', s.contact_zalo], ['Email', s.contact_email]].filter(x => x[1]);
      const soc = [['TikTok', s.social_tiktok], ['Fanpage', s.social_facebook], ['YouTube', s.social_youtube]].filter(x => x[1]);
      return { title: 'Liên hệ · Quản trị tử tế', html: `${notice()}${subHead(key)}<main class="wrap"><section>
        <p class="mono">Liên hệ</p><h1 class="page-title">Kết nối với Đốm</h1>
        <div class="cols3" style="margin-top:24px">
          <div class="card cat"><h3>Kết nối</h3>
            ${items.length || soc.length ? `<dl class="kv" style="margin-top:12px">${items.map(([k, v]) => `<dt>${k}</dt><dd style="user-select:all">${esc(v)}</dd>`).join('')}</dl>
            <div class="socials" style="margin-top:12px">${soc.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n} ↗</a>`).join('')}</div>` : `<div class="empty">Thông tin liên hệ sẽ sớm cập nhật.</div>`}
          </div>
          <div class="card cat" id="cafe"><h3>Mời cà phê</h3><p class="muted" style="font-size:14px">${esc(s.donate_note)}</p>
            ${s.donate_qr ? `<img class="qr" src="${esc(s.donate_qr)}" alt="Mã QR chuyển khoản ủng hộ" loading="lazy">
              <dl class="kv" style="margin-top:12px"><dt>Ngân hàng</dt><dd>${esc(s.bank_name || s.bank_code)}</dd><dt>Số TK</dt><dd style="user-select:all">${esc(s.bank_acc)}</dd><dt>Chủ TK</dt><dd>${esc(s.bank_holder)}</dd><dt>Nội dung</dt><dd>${esc(s.donate_content)}</dd></dl>`
              : `<div class="empty">Mã QR sẽ thêm khi có tài khoản nhận.</div>`}
          </div>
          <div class="card cat"><h3>Đặt lịch tư vấn 1:1</h3>
            ${s.booking_open ? `<form class="form" id="bookform" style="margin-top:10px">
              <label for="b-name">Tên bạn<input id="b-name" required></label>
              <label for="b-contact">Số điện thoại, Zalo hoặc Email<input id="b-contact" required></label>
              <label for="b-topic">Bạn cần trao đổi về<select id="b-topic"><option>Xây dựng website, công cụ tự động hóa theo nhu cầu riêng</option><option>Kinh nghiệm, kiến thức triển khai AI, AI agents</option><option>Tối ưu bộ máy, quy trình vận hành cho HKD hoặc SMEs</option><option>Xây dựng hệ thống đào tạo nội bộ, văn hóa doanh nghiệp</option><option>Setup &amp; vận hành spa chăm sóc sức khỏe</option><option>Khác</option></select></label>
              <label for="b-desc">Lời nhắn / mô tả nhu cầu, tình trạng cụ thể (không bắt buộc)<textarea id="b-desc" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
              <label style="display:flex;gap:8px;font-weight:400;align-items:start"><input type="checkbox" id="b-consent" style="width:auto;margin-top:4px"> Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.</label>
              <input type="text" id="b-web" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
              <button class="btn amber" type="submit">Gửi yêu cầu</button><p id="b-msg" role="status"></p>
            </form>` : `<div class="empty">Hiện tạm ngừng nhận lịch tư vấn.</div>`}
          </div>
        </div></section></main>${footer()}`,
        after: () => { const dv = new URLSearchParams(location.search).get('dich-vu'), sel = dv && $('#b-topic'); if (sel) [...sel.options].forEach(o => { if (o.text === dv) sel.value = o.value || o.text; });
          if (location.hash === '#cafe') $('#cafe')?.scrollIntoView({ behavior: 'smooth' }); else if (key === '/tach-ca-phe') setTimeout(() => $('#cafe')?.scrollIntoView({ behavior: 'smooth' }), 80); } };
    },
  };

  /* ---------- danh sách công cụ theo tab ---------- */
  const TAB_KEYS = TABS.map(t => t[0]);
  let tab = 'noi-bat', query = '';
  const sortTools = list => list.slice().sort((a, b) => (ST_ORDER[a.status] ?? 3) - (ST_ORDER[b.status] ?? 3) || a.sort - b.sort);
  /* Nhận thông báo công cụ mới (danh sách 'bo-cong-cu'): bấm nút ở đầu trang → popup điền email → popup đổi sang nhắc xác nhận qua email */
  function initToolSub() {
    const open = $('#tsOpen'); if (!open) return;
    open.onclick = () => {
      document.querySelector('.ts-wrap')?.remove();
      const last = document.activeElement, w = document.createElement('div'); w.className = 'ts-wrap';
      w.innerHTML = `<div class="ts-back"></div><div class="ts-box" role="dialog" aria-modal="true" aria-labelledby="tsT"><button type="button" class="ts-x" aria-label="Đóng">×</button><div id="tsBody"></div></div>`;
      document.body.appendChild(w); document.body.classList.add('modal-open');
      const body = w.querySelector('#tsBody');
      const close = () => { w.remove(); document.body.classList.remove('modal-open'); document.removeEventListener('keydown', onKey); if (last && last.focus) last.focus(); };
      const onKey = e => { if (e.key === 'Escape') close(); };
      w.querySelector('.ts-x').onclick = close; w.querySelector('.ts-back').onclick = close; document.addEventListener('keydown', onKey);
      const done = j => {
        body.innerHTML = `<div class="ts-ico" aria-hidden="true">${j.mailed ? '✉️' : '✅'}</div>
          <h3 id="tsT">${j.mailed ? 'Anh/chị kiểm tra email để xác nhận nhé' : 'Em đã ghi nhận đăng ký'}</h3>
          ${j.mailed ? `<p>Em là Đốm, em vừa gửi thư xác nhận tới</p><div class="ts-em">${esc(j.email || '')}</div>
            <ol class="ts-steps"><li>Mở hộp thư, tìm thư <b>“Thư từ Quản trị tử tế”</b>.</li><li>Bấm nút <b>“Xác nhận nhận cập nhật”</b> trong thư.</li><li>Chưa thấy thư sau vài phút? Anh/chị xem mục <b>Spam</b> hoặc <b>Quảng cáo (Promotions)</b>.</li></ol>
            <p class="ts-note">Đăng ký chỉ hoàn tất sau khi anh/chị bấm xác nhận. Nếu chưa bấm, em sẽ chưa gửi thông báo nào.</p>` : `<p>${esc(j.message || 'Đã ghi nhận.')}</p>`}
          <button type="button" class="btn amber ts-ok">Đồng ý</button>`;
        const ok = body.querySelector('.ts-ok'); ok.onclick = close; ok.focus();
      };
      body.innerHTML = `<div class="ts-ico" aria-hidden="true">🔔</div><h3 id="tsT">Nhận thông báo công cụ mới</h3>
        <p>Anh/chị để lại email, mỗi khi Bộ công cụ có công cụ mới phát hành, Đốm sẽ gửi thư vào 10h sáng. Chưa có công cụ mới thì Đốm không làm phiền ạ.</p>
        <form id="tsForm" class="ts-form" novalidate>
          <input type="email" id="tsEmail" placeholder="Email của anh/chị" autocomplete="email" aria-label="Email nhận thông báo công cụ mới" required>
          <input type="text" id="tsHp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
          <label class="ts-consent"><input type="checkbox" id="tsConsent"> <span>Tôi đồng ý để Quản trị tử tế lưu email này và gửi thông báo khi có công cụ mới. Hủy bất cứ lúc nào bằng link trong mỗi email.</span></label>
          <p class="ts-msg" id="tsMsg" role="status"></p>
          <button type="submit" class="btn amber" id="tsBtn">Đăng ký nhận tin</button></form>`;
      const f = body.querySelector('#tsForm'), msg = body.querySelector('#tsMsg'), btn = body.querySelector('#tsBtn');
      setTimeout(() => body.querySelector('#tsEmail').focus(), 30);
      f.addEventListener('submit', async ev => {
        ev.preventDefault(); msg.className = 'ts-msg';
        const email = body.querySelector('#tsEmail').value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { msg.textContent = 'Email chưa đúng định dạng.'; msg.classList.add('bad'); return; }
        if (!body.querySelector('#tsConsent').checked) { msg.textContent = 'Anh/chị vui lòng tích ô đồng ý bên trên.'; msg.classList.add('bad'); return; }
        btn.disabled = true; msg.textContent = 'Đang gửi…';
        try {
          const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool: 'bo-cong-cu', email, consent: true, website: body.querySelector('#tsHp').value }) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) { msg.textContent = j.error || 'Chưa gửi được, anh/chị thử lại sau.'; msg.classList.add('bad'); }
          else done(j);
        } catch (e) { msg.textContent = 'Chưa gửi được, anh/chị thử lại sau.'; msg.classList.add('bad'); }
        btn.disabled = false;
      });
    };
  }
  function renderGroups() {
    const box = $('#toolgroups'); if (!box) return;
    const q = query.trim().toLowerCase();
    const note = $('#tabnote');
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', !q && b.dataset.tab === tab));
    if (q) {
      const list = sortTools(SITE.tools.filter(t => (t.name + ' ' + t.pain + ' ' + t.tags + ' ' + (GRP[t.grp] || '')).toLowerCase().includes(q)));
      note.textContent = list.length ? `${list.length} kết quả` : '';
      box.innerHTML = list.length ? `<div class="bgrid">${list.map(t => toolCard(t)).join('')}</div>`
        : `<div class="empty" style="margin-top:8px">Chưa có công cụ cho “${esc(query)}”. <button type="button" class="dq-link" data-suggest="">Kể Đốm nghe để Đốm tìm giải pháp</button>.</div>`;
      return;
    }
    note.textContent = '';
    const fn = (TABS.find(t => t[0] === tab) || TABS[0])[2];
    const list = sortTools(SITE.tools.filter(fn));
    if (!list.length) { box.innerHTML = `<div class="empty" style="margin-top:8px">Nhóm này đang được chuẩn bị. <button type="button" class="dq-link" data-suggest="">Kể Đốm nghe anh/chị cần gì</button>.</div>`; return; }
    if (tab === 'noi-bat') {
      box.innerHTML = `<div class="carousel" data-carousel><button class="car-btn prev" data-car="-1" aria-label="Công cụ trước">‹</button>
        <div class="car-track" tabindex="0" aria-label="Tiện ích nổi bật">${list.map(t => `<div class="car-item">${toolCard(t, false)}</div>`).join('')}</div>
        <button class="car-btn next" data-car="1" aria-label="Công cụ tiếp theo">›</button></div><div class="car-dots" role="tablist" aria-label="Chọn vị trí"></div>`;
      carousel(box.querySelector('[data-carousel]'));
      return;
    }
    if (tab === 'tat-ca') {
      box.innerHTML = Object.keys(GRP).filter(g => list.some(t => t.grp === g)).map(g => `<h2 class="group-title"><span class="gdot g-${g}"></span>${GRP[g]}</h2><div class="bgrid">${list.filter(t => t.grp === g).map(t => toolCard(t)).join('')}</div>`).join('');
      return;
    }
    box.innerHTML = `<div class="bgrid">${list.map(t => toolCard(t)).join('')}</div>`;
  }
  /* Carousel: 3 sách / lần trên máy tính, lướt ngang (kéo, vuốt, nút ‹ ›) */
  /* Carousel: 3 sách / lượt, mỗi lần bấm/vuốt chuyển 1 cuốn, chuyển động mượt (tự tính đường cong, không giật) */
  function carousel(el) {
    const tr = el.querySelector('.car-track'), prev = el.querySelector('.prev'), next = el.querySelector('.next'), dots = el.parentElement.querySelector('.car-dots');
    const items = [...tr.children];
    const step = () => items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : tr.clientWidth;
    const maxIdx = () => Math.max(0, Math.round((tr.scrollWidth - tr.clientWidth) / Math.max(1, step())));
    const cur = () => Math.round(tr.scrollLeft / Math.max(1, step()));
    let anim = 0, nDots = -1;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const goTo = i => {
      i = Math.max(0, Math.min(maxIdx(), i));
      const from = tr.scrollLeft, to = Math.min(i * step(), tr.scrollWidth - tr.clientWidth);
      cancelAnimationFrame(anim);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tr.scrollLeft = to; return; }
      tr.classList.add('moving'); const t0 = performance.now(), dur = 560;
      const tick = now => { const k = Math.min(1, (now - t0) / dur); tr.scrollLeft = from + (to - from) * ease(k);
        if (k < 1) anim = requestAnimationFrame(tick); else tr.classList.remove('moving'); };
      anim = requestAnimationFrame(tick);
    };
    const upd = () => {
      const m = maxIdx(), c = Math.min(m, cur());
      prev.disabled = tr.scrollLeft <= 2; next.disabled = tr.scrollLeft >= tr.scrollWidth - tr.clientWidth - 2;
      el.classList.toggle('static', m === 0);
      if (nDots !== m) { nDots = m; dots.innerHTML = m ? Array.from({ length: m + 1 }, (_, i) => `<button type="button" role="tab" data-dot="${i}" aria-label="Vị trí ${i + 1}"></button>`).join('') : ''; }
      dots.querySelectorAll('[data-dot]').forEach((d, i) => d.setAttribute('aria-selected', i === c));
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-car]'); if (b) goTo(cur() + +b.dataset.car); });
    dots.addEventListener('click', e => { const d = e.target.closest('[data-dot]'); if (d) goTo(+d.dataset.dot); });
    tr.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur() + (e.key === 'ArrowRight' ? 1 : -1)); } });
    tr.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
  }
  function setTab(k) {
    tab = TAB_KEYS.includes(k) ? k : 'noi-bat';
    query = ''; const q = $('#q'); if (q) q.value = '';
    const u = new URL(location.href);
    if (tab === 'noi-bat') u.searchParams.delete('nhom'); else u.searchParams.set('nhom', tab);
    history.replaceState(history.state, '', u.pathname + u.search);
    renderGroups();
  }

  /* ---------- popup chi tiết công cụ ---------- */
  let modalOpen = null, lastFocus = null, pushedModal = false, modalStay = false, prevTitle = '';
  const vnDate = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : '';
  const msDate = ms => ms ? new Date(ms + 7 * 3600000).toISOString().slice(0, 10) : '';
  /* Video demo: hiện ảnh xem trước, bấm mới tải YouTube (trang nhẹ, không tự chạy) */
  const liteYT = (v, label) => v.yt ? `<button type="button" class="ytlite${/shorts/.test(v.url) ? ' short' : ''}" data-yt="${esc(v.yt)}" aria-label="Phát video ${esc(label || '')}">
      <img src="https://i.ytimg.com/vi/${esc(v.yt)}/hqdefault.jpg" alt="" loading="lazy"><span class="yt-play" aria-hidden="true"></span></button>`
    : (safeUrl(v.url) ? `<a class="btn ghost sm" href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener">Xem video ↗</a>` : '');
  /* Ảnh giao diện công cụ (khung VIDEO DEMO): link anh nhập ở quản trị → ảnh chụp sẵn /assets/tools/<slug>.jpg → banner tự vẽ */
  const shotOf = t => {
    const img = safeUrl(t.banner_url) || `/assets/tools/${encodeURIComponent(t.slug)}.jpg`;
    return `<img src="${esc(img)}" alt="Giao diện ${esc(t.name)}" loading="lazy" onerror="this.remove()">${artOf({ ...t, banner_url: '' })}`;
  };
  /* Popup chi tiết = cuốn sách đang mở: trang trái giới thiệu, trang phải video demo + tiện ích nổi bật */
  /* tên file khi tải bản offline: lấy theo link, link kết thúc bằng / hoặc index.html thì đặt theo thư mục công cụ */
  const dlName = (t, dl) => { const seg = String(dl).split(/[?#]/)[0].split('/').filter(Boolean); const last = seg[seg.length - 1] || '';
    return /\.[a-z0-9]{2,5}$/i.test(last) && !/^index\.html?$/i.test(last) ? last : ((/^index\.html?$/i.test(last) ? seg[seg.length - 2] : last) || t.slug) + '.html'; };
  function toolModal(t) {
    const tags = tagsOf(t), hl = lines(t.highlights).map(x => x.split('|').map(y => y.trim()));
    const url = safeUrl(t.url), dl = safeUrl(t.download_url), usable = t.status === 'ok' && (url || dl);
    const vids = (t.videos || []).filter(v => v.yt || safeUrl(v.url));
    const ben = lines(t.benefits), v = vids[0], pub = vnDate(t.released), upd = vnDate(msDate(t.updated_at));
    const video = v && v.yt
      ? `<button type="button" class="vd-frame" data-yt="${esc(v.yt)}" aria-label="Phát video demo ${esc(t.name)}">${shotOf(t)}<span class="yt-play" aria-hidden="true"></span></button>`
      : v ? `<a class="vd-frame" href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener">${shotOf(t)}<span class="yt-play" aria-hidden="true"></span></a>`
      : `<div class="vd-frame none">${shotOf(t)}<span class="vd-soon">Video đang được chuẩn bị</span></div>`;
    return `<div class="tm-backdrop" data-close></div>
    <div class="tm tm-book g-${esc(t.grp)}" role="dialog" aria-modal="true" aria-labelledby="tm-title">
      <button class="tm-x" data-close aria-label="Đóng">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'}</button>
      <div class="bk-pages">
        <section class="bk-page bk-left">
          <span class="bk-grp">${esc(GRP[t.grp] || '')}</span>
          <header class="bk-head"><span class="bk-ic">${icon(t.icon)}</span><h2 id="tm-title">${esc(t.name)}</h2></header>
          <div class="bk-meta">${stBadge(t.status)}${priceTag(t)}</div>
          ${bookStats(t, dl)}
          ${tags.length ? `<div class="bk-tags">${tags.slice(0, 5).map(x => `<span>#${esc(x)}</span>`).join('')}</div>` : ''}
          ${ben.length ? `<div class="bk-blk"><h3>Công cụ này sẽ giúp bạn:</h3><ul class="bk-ben">${ben.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`
            : t.pain ? `<div class="bk-blk"><h3>Công cụ này sẽ giúp bạn:</h3><p class="bk-pain">${esc(t.pain)}</p></div>` : ''}
          ${t.who ? `<div class="bk-blk"><h3>Dành cho:</h3><p class="bk-who">${esc(t.who)}</p></div>` : ''}
          <div class="bk-cta">${usable ? `${url ? `<a class="btn bk-go" href="${esc(url)}" target="_blank" rel="noopener" data-newtab>${dl ? 'Dùng online ↗' : 'Dùng công cụ ↗'}</a>` : ''}${dl ? `<a class="btn ghost bk-dl" href="${esc(dl)}" download="${esc(dlName(t, dl))}" data-dl="${esc(t.slug)}">Tải bản offline</a>` : ''}`
            : ''}<button type="button" class="btn ghost bk-sug" data-suggest="${esc(t.slug)}">${usable ? 'Đề xuất thêm tính năng' : 'Góp ý cho công cụ này'}</button></div>
          ${pub || upd ? `<p class="bk-dates">${pub ? `Ngày xuất bản: ${pub}` : ''}${pub && upd ? ' · ' : ''}${upd ? `Phiên bản cập nhật ngày ${upd}` : ''}</p>` : ''}
        </section>
        <section class="bk-page bk-right">
          <div class="bk-blk"><h3>Video demo</h3>${video}</div>
          ${hl.length ? `<div class="bk-blk"><h3>Tiện ích nổi bật</h3><ol class="bk-hl">${hl.map(([a, b]) => `<li><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</li>`).join('')}</ol></div>` : ''}
          ${!hl.length && !t.pain ? `<p class="bk-who">Thông tin về công cụ đang được cập nhật.</p>` : ''}
          ${guidesOf(t.slug).length ? `<div class="bk-blk bk-guides"><h3>Hướng dẫn từng bước</h3><ul>${guidesOf(t.slug).map(([, h, n]) => `<li><a href="${h}">${esc(n)} →</a></li>`).join('')}</ul></div>` : ''}
        </section>
      </div>
    </div>`;
  }
  function openTool(slug, fromEl, fromRoute) {
    const t = SITE.tools.find(x => x.slug === slug);
    if (!t) { if (fromRoute) history.replaceState(null, '', '/cong-cu' + location.search); return; }
    closeTool(true);
    lastFocus = fromEl || document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'tm-wrap'; wrap.innerHTML = toolModal(t);
    document.body.append(wrap); document.documentElement.classList.add('modal-open');
    modalOpen = wrap; prevTitle = document.title; document.title = t.name + ' · Quản trị tử tế';
    modalStay = rendered !== 'tools';
    if (!fromRoute && !modalStay) { history.pushState({ modal: slug }, '', '/cong-cu/' + slug + location.search); pushedModal = true; } else pushedModal = false;
    const box = wrap.querySelector('.tm');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && box.animate) {
      let from = 'translateY(24px) scale(.94)';
      if (fromEl) {
        const a = fromEl.getBoundingClientRect(), b = box.getBoundingClientRect();
        const s = Math.max(.2, Math.min(.9, a.width / b.width));
        from = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${s})`;
      }
      box.animate([{ transform: from, opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
      wrap.querySelector('.tm-backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    }
    wrap.querySelector('.tm-x').focus({ preventScroll: true });
  }
  /* v1.12 popup "sách mở" với nội dung tuỳ ý (VD chi tiết 1 đề xuất trên Bảng ghim) – không đổi địa chỉ trang */
  function openPanel(html, fromEl, title) {
    closeTool(true);
    lastFocus = fromEl || document.activeElement;
    const wrap = document.createElement('div'); wrap.className = 'tm-wrap'; wrap.innerHTML = html;
    document.body.append(wrap); document.documentElement.classList.add('modal-open');
    modalOpen = wrap; modalStay = true; pushedModal = false; prevTitle = document.title; if (title) document.title = title + ' · Quản trị tử tế';
    const box = wrap.querySelector('.tm');
    if (box.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.animate([{ transform: 'translateY(24px) scale(.94)', opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      wrap.querySelector('.tm-backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    }
    wrap.querySelector('.tm-x').focus({ preventScroll: true });
  }
  function closeTool(silent, then) {
    if (!modalOpen) return;
    const w = modalOpen; modalOpen = null;
    document.documentElement.classList.remove('modal-open'); document.title = modalStay ? prevTitle : 'Bộ công cụ · Quản trị tử tế';
    const box = w.querySelector('.tm');
    if (!silent && box.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.96)', opacity: 0 }], { duration: 160, easing: 'ease-in' }).onfinish = () => w.remove();
      w.querySelector('.tm-backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
    } else w.remove();
    if (!silent) {
      if (pushedModal) { pushedModal = false; history.back(); } else if (!modalStay) history.replaceState(null, '', '/cong-cu' + location.search);
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }
    if (then) setTimeout(then, silent ? 0 : 170);
  }

  /* ---------- định tuyến ---------- */
  let rendered = '';
  function route() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    let m, v;
    const toolPath = path === '/cong-cu' || /^\/cong-cu\/[a-z0-9-]+$/.test(path);
    if (toolPath) {
      const nh = new URLSearchParams(location.search).get('nhom'); tab = TAB_KEYS.includes(nh) ? nh : 'noi-bat';
      const slug = (path.match(/^\/cong-cu\/([a-z0-9-]+)$/) || [])[1];
      if (rendered === 'tools') { if (slug) { if (!modalOpen) openTool(slug, null, true); } else closeTool(true); return; }
      v = views.tools(slug);
    }
    else if (path === '/') v = views.home();
    else if (path === '/hanh-trinh') v = views.journey();
    else if (path === '/bang-ghim') v = views.board();
    else if (path === '/blog') { history.replaceState(null, '', '/goc-ngam?phong=bai-viet' + (location.search ? '&' + location.search.slice(1) : '')); v = views.ngam(); }
    else if ((m = path.match(/^\/blog\/([a-z0-9-]+)$/))) v = views.blogPost(m[1]);
    /* v1.8: menu mới. Đường dẫn cũ /phat-trien, /lien-he chuyển về trang mới tương ứng */
    else if (path === '/goc-ngam' || path === '/phat-trien') v = views.ngam();
    else if (path === '/ve-dom') v = views.about();
    else if (path === '/ve-minh-tuan' || (path === '/lien-he' && location.hash !== '#cafe')) { history.replaceState(null, '', '/ve-dom'); v = views.about(); }
    else if (path === '/tach-ca-phe' || path === '/lien-he') v = views.cafe();
    /* v1.10: trang 404 có Đốm lạc đường */
    else v = { title: 'Không tìm thấy · Quản trị tử tế', html: `${subHead('')}<main class="wrap"><div class="dom-lost">
      <div class="dom-lost-art"><img class="dv-sang" src="/assets/dom/dom-22-lac-duong-sang.webp" alt="Đốm lạc đường"><img class="dv-toi" src="/assets/dom/dom-22-lac-duong-toi.webp" alt="Đốm lạc đường"></div>
      <p class="mono">Lỗi 404</p><h1 class="page-title">Đốm lạc đường mất rồi</h1>
      <p>Trang anh/chị tìm không tồn tại hoặc đã đổi địa chỉ. Để Đốm dẫn anh/chị quay lại nhé.</p>
      <div class="dom-lost-cta"><a class="btn" href="/" data-link>Về trang chủ</a><a class="btn ghost" href="/cong-cu" data-link>Xem Bộ công cụ</a></div></div></main>${footer()}` };
    closeTool(true);
    document.documentElement.classList.remove('gn-lock');
    rendered = toolPath ? 'tools' : path;
    document.title = v.title;
    $('#site').innerHTML = v.html;
    applyLamp();
    if (v.after) v.after();
    if (!location.hash) window.scrollTo(0, 0);
  }
  function go(href) { history.pushState(null, '', href); route(); }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-lamp-toggle],[data-lamp-cord]')) { e.preventDefault(); toggleLamp(); return; }
    if (e.target.closest('[data-music]')) { e.preventDefault(); toggleMusic(); return; }
    const dlb = e.target.closest('[data-dl]'); if (dlb) hit(dlb.dataset.dl, 'download'); // v1.11 đếm lượt tải bản offline, không chặn tải
    // v1.14: "Dùng online" mở công cụ ở tab mới, không đè trang đang xem; trình duyệt chặn tab mới (VD trong Zalo/Facebook) thì mở ngay tại tab này
    const nt = e.target.closest('a[data-newtab]');
    if (nt && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); const w = window.open(nt.href, '_blank'); if (w) { try { w.opener = null; } catch (er) { } } else location.href = nt.href; return; }
    const ct = e.target.closest('[data-close-to]');
    if (ct) { e.preventDefault(); closeTool(false, () => $('#' + ct.dataset.closeTo)?.scrollIntoView({ behavior: 'smooth' })); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeTool(false); return; }
    const yt = e.target.closest('[data-yt]');
    if (yt) { const f = document.createElement('iframe'); f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(yt.dataset.yt) + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = 'Video demo'; f.className = 'yt-frame' + (yt.classList.contains('short') ? ' short' : '') + (yt.classList.contains('vd-frame') ? ' vd-frame' : ''); yt.replaceWith(f); return; }
    const card = e.target.closest('a[data-tool]');
    if (card && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); openTool(card.dataset.tool, card); return; }
    const tb = e.target.closest('[data-tab]');
    if (tb) { setTab(tb.dataset.tab); return; }
    const hash = e.target.closest('a[href^="#"]');
    if (hash && hash.getAttribute('href').length > 1) { e.preventDefault(); $(hash.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); return; }
    const a = e.target.closest('a[data-link]');
    if (a && !e.metaKey && !e.ctrlKey && a.origin === location.origin) { e.preventDefault(); go(a.getAttribute('href')); return; }
  });
  document.addEventListener('keydown', e => {
    if (!modalOpen) {
      const tb = e.target.closest?.('[data-tab]');
      if (tb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const all = [...document.querySelectorAll('[data-tab]')], i = all.indexOf(tb), n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
        n.focus(); setTab(n.dataset.tab);
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); closeTool(false); return; }
    if (e.key === 'Tab') {
      const f = [...modalOpen.querySelectorAll('a[href],button,iframe,[tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 'q') { query = e.target.value; renderGroups(); } });
  document.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = f.querySelector('button[type=submit]');
    const isOrder = f.id === 'orderform';
    const msg = $(isOrder ? '#o-msg' : '#b-msg');
    const body = isOrder
      ? { pain: $('#o-pain').value, role: $('#o-role').value, contact: $('#o-contact').value, website: $('#o-web').value }
      : { name: $('#b-name').value, contact: $('#b-contact').value, topic: $('#b-topic').value, description: $('#b-desc').value, consent: $('#b-consent').checked, website: $('#b-web').value };
    btn.disabled = true; msg.className = 'note'; msg.textContent = 'Đang gửi…';
    try {
      await api(isOrder ? 'requests' : 'bookings', { method: 'POST', body: JSON.stringify(body) });
      f.reset(); msg.className = 'toast';
      msg.textContent = isOrder ? 'Cảm ơn anh/chị! Đốm đã nhận được đề xuất.' : 'Cảm ơn anh/chị! Đốm sẽ liên hệ lại sớm nhé.';
    } catch (err) { msg.className = 'err'; msg.textContent = err.message; }
    btn.disabled = false;
  });
  window.addEventListener('popstate', () => { pushedModal = false; route(); });
  /* v1.22 Bấm "Dùng online" trên điện thoại với công cụ cần máy tính → mời gửi link về email trước (mỗi phiên 1 lần/công cụ) */
  document.addEventListener('click', e => {
    const a = e.target instanceof Element && e.target.closest('a.bk-go'); const SL = window.QTTSendLink;
    if (!a || !SL || !SL.needs(a.href)) return;
    const tool = SL.folderOf(a.href); if (SL.seen(tool)) return;
    e.preventDefault(); e.stopImmediatePropagation(); SL.mark(tool);
    const t = SITE.tools.find(x => x.url && a.getAttribute('href') === x.url) || {};
    SL.open({ url: a.href, name: t.name, skipText: 'Vẫn mở trên điện thoại', onSkip: () => { location.href = a.href; } });
  }, true);

  /* v1.22 Tốc độ: khách quay lại dùng bản dữ liệu đã lưu (≤ 24 giờ) để hiện trang ngay; dữ liệu mới nạp ngầm cho lần chuyển trang sau */
  let cachedSite = null;
  try { const c = JSON.parse(localStorage.getItem('qtt-site') || 'null'); if (c && c.d && c.t > Date.now() - 864e5) cachedSite = c.d; } catch (e) { }
  if (cachedSite) { SITE = cachedSite; route(); }
  api('site').then(d => { SITE = d; try { localStorage.setItem('qtt-site', JSON.stringify({ t: Date.now(), d })); } catch (e) { } if (!cachedSite) route(); })
    .catch(() => { if (!cachedSite) route(); });
})();
