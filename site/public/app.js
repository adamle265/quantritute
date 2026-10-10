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
  const NAV = [['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/goc-ngam', 'Góc ngẫm'], ['/ve-minh-tuan', 'Về Minh Tuấn'], ['/tach-ca-phe', 'Tách cà phê']];
  const ROOMS = [['sach', 'Tủ sách', 'Những cuốn sách đổi cách nghĩ'], ['chieu', 'Phòng chiếu', 'Các kênh video đáng xem'], ['bai-viet', 'Bài viết', 'Ghi chép dưới ánh đèn']];
  const date = iso => iso ? iso.split('-').reverse().join('/') : '';

  let SITE = { settings: {}, tools: [], episodes: [] };

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
    return `<span class="nav-dd"><a href="${h}" data-link ${cur} aria-haspopup="true">${t}<i class="dd-caret" aria-hidden="true"></i></a>
      <span class="dd-menu" role="menu">${ROOMS.map(([k, n, d]) => `<a role="menuitem" href="/goc-ngam?phong=${k}" data-link><b>${n}</b><small>${d}</small></a>`).join('')}</span></span>`;
  }).join('');
  const subHead = active => `
    <header class="subhead"><div class="glow"></div><div class="lamp" aria-hidden="true"></div>
      <div class="wrap topnav">
        <a class="brand" href="/" data-link><span class="brand-name"><svg class="brand-mark" viewBox="4 4 56 56" aria-hidden="true"><path d="M40.45 12.61A23 23 0 1 1 23.55 12.61" fill="none" stroke="currentColor" stroke-width="4"/><circle class="g" cx="32" cy="11" r="5.5"/><path class="g" d="M32 19L38 35H26Z"/><path d="M26 35L32 52L38 35" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/></svg>Quản trị tử tế</span></a>
        <nav class="main" aria-label="Điều hướng chính">${navLinks(active)}${musicBtn()}<button class="lampbtn" data-lamp-toggle aria-label="Bật tắt đèn"></button></nav>
      </div></header>`;
  const footer = () => {
    const s = SITE.settings, soc = [['TikTok', s.social_tiktok], ['Fanpage', s.social_facebook], ['YouTube', s.social_youtube]].filter(x => x[1]);
    return `<footer class="site"><div class="wrap"><span class="hand" style="font-size:20px;color:var(--ink)">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}.</span>
      <span class="socials">${soc.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}<span>© ${new Date().getFullYear()} quantritute.vn</span></span></div></footer>`;
  };
  /* v1.12 nhạc nền thương hiệu: chỉ hiện nút khi có link nhạc trong Cài đặt. Trình duyệt chặn tự phát → người dùng bấm mới phát;
     nhạc tải khi bấm lần đầu (preload none), âm lượng nhỏ, tăng/giảm dần, chạy tiếp khi chuyển trang (web 1 trang) */
  let bgAudio = null, volAnim = 0;
  const musicOn = () => !!(bgAudio && !bgAudio.paused);
  const musicBtn = () => safeUrl(SITE.settings.bg_music_url) ? `<button type="button" class="musicbtn${musicOn() ? ' on' : ''}" data-music aria-pressed="${musicOn()}" title="${esc(SITE.settings.bg_music_title || 'Nhạc nền')}" aria-label="Bật tắt nhạc nền"><span class="mb-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mb-t">${musicOn() ? 'Tắt nhạc' : 'Nghe nhạc'}</span></button>` : '';
  function paintMusic() {
    document.querySelectorAll('[data-music]').forEach(b => { const on = musicOn(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const t = b.querySelector('.mb-t'); if (t) t.textContent = on ? 'Tắt nhạc' : 'Nghe nhạc'; });
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
  /* v1.12 chân trang các kênh của Tuấn: Facebook fanpage, Zalo, TikTok, YouTube, Email (lấy ở Cài đặt → Liên hệ & mạng xã hội) */
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
    return `<footer class="ab-foot"><p class="mono">Kết nối với Tuấn</p><div class="ab-ch">${ch.map(([k, n, u]) => u
      ? `<a href="${esc(u)}" ${k === 'mail' ? '' : 'target="_blank" rel="noopener"'} class="ab-c c-${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_IC[k]}</svg><span>${n}</span></a>`
      : `<span class="ab-c off" title="Sắp cập nhật"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOC_IC[k]}</svg><span>${n}</span></span>`).join('')}</div>
      ${s.contact_email ? `<p class="ab-mail">${esc(s.contact_email)}</p>` : ''}<p class="ab-sign hand">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}</p></footer>`;
  }
  const notice = () => SITE.settings.notice ? `<div class="notice">${esc(SITE.settings.notice)}</div>` : '';

  /* Bìa sách: mỗi NHÓM một màu (Kế toán xanh dương, Hành chính xanh lá, Khởi nghiệp cam đất, Học tập tím) – màu khai báo trong style.css */
  /* v1.11 số liệu thật từ bộ đếm (lượt truy cập: mỗi người 1 lượt/ngày; lượt dùng: mở/xem nội dung, tối đa 20/người/ngày) */
  const num = n => new Intl.NumberFormat('vi-VN').format(n || 0);
  const statsOf = t => t.stats || { visits: 0, uses: 0, downloads: 0, today_visits: 0 };
  const cardStats = t => t.status !== 'ok' ? '' : `<span class="cb-stats"><span>${num(statsOf(t).visits)} truy cập</span><span>${num(statsOf(t).uses)} lượt dùng</span></span>`;
  const bookStats = (t, dl) => { if (t.status !== 'ok') return ''; const s = statsOf(t);
    return `<div class="bk-stats" aria-label="Số liệu sử dụng"><span><b>${num(s.visits)}</b> lượt truy cập</span><span><b>${num(s.today_visits)}</b> hôm nay</span><span><b>${num(s.uses)}</b> lượt dùng</span>${dl ? `<span><b>${num(s.downloads)}</b> lượt tải</span>` : ''}</div>`; };
  const hit = (slug, kind) => { try { fetch('/api/hit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, kind }), keepalive: true }).catch(() => { }); } catch (e) { } };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>';
  /* Sách gập: bìa nổi bật Tên công cụ + Giải quyết vấn đề gì. star = hiện sao vàng nếu là công cụ nổi bật (không dùng trong tab Nổi bật) */
  const toolCard = (t, star = true) => `<a class="cbook g-${esc(t.grp)} st-${esc(t.status)}" href="/cong-cu/${esc(t.slug)}" data-tool="${esc(t.slug)}" aria-haspopup="dialog">
      <span class="cb-pages" aria-hidden="true"></span>
      <span class="cb-cover">
        <span class="cb-spine" aria-hidden="true"></span>
        <span class="cb-top"><span class="cb-ic">${icon(t.icon)}</span>${star && t.featured ? `<span class="cb-star" title="Tiện ích nổi bật">${STAR}<span class="sr">Tiện ích nổi bật</span></span>` : ''}</span>
        <span class="cb-title">${esc(t.name)}</span>
        <span class="cb-rule" aria-hidden="true"></span>
        ${t.pain ? `<span class="cb-pain">${esc(t.pain)}</span>` : ''}
        <span class="cb-foot">${stBadge(t.status)}${priceTag(t)}</span>
        ${cardStats(t)}
      </span></a>`;
  /* Banner tượng trưng: ảnh riêng nếu có, không thì vẽ theo nhóm + icon */
  const artOf = t => {
    const img = safeUrl(t.banner_url);
    return img ? `<img src="${esc(img)}" alt="" loading="lazy">`
      : `<div class="art-gen"><span class="art-grid"></span><span class="art-ring r1"></span><span class="art-ring r2"></span>${icon(t.icon, 'art-icon')}</div>`;
  };

  /* ---------- Bảng ghim (v1.7): đề xuất công cụ trên bảng bần ---------- */
  /* v1.12 (góp ý 09/10): 4 cột theo thứ tự Mới phát hành → Đang hoàn thiện → Sẽ làm → Trong đề xuất */
  const LANES = [['done', 'Mới phát hành', s => s === 'done', 'Đã thắp sáng, dùng được ngay'], ['build', 'Đang hoàn thiện', s => s === 'building', 'Anh Tuấn đang làm'],
    ['plan', 'Sẽ làm', s => s === 'planned', 'Đã lên lịch làm'], ['xet', 'Trong đề xuất', s => s === 'new' || s === 'reviewing', 'Chờ thêm người cùng cần']];
  const laneOf = st => (LANES.find(l => l[2](st)) || LANES[3]);
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const voterId = () => { let c = store.get('qtt-cid', ''); if (!/^[a-z0-9]{12,40}$/.test(c)) { c = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('qtt-cid', c); } return c; };
  const toolOf = slug => slug ? (SITE.tools || []).find(t => t.slug === slug) : null;
  const tilt = id => (((id * 37) % 9) - 4) * 0.55;
  const shortDate = iso => { const p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; };
  const voteBtn = (n, voted) => `<button type="button" class="n-vote" data-vote="${n.id}" aria-pressed="${voted}"><span class="n-plus" aria-hidden="true">${voted ? '✓' : '+1'}</span>${voted ? 'Bạn cũng cần' : 'Tôi cũng cần'}<b>${n.votes || 0}</b></button>`;
  const etaHtml = n => { const late = n.eta && n.eta_prev && n.eta > n.eta_prev;
    return n.eta ? `<p class="n-eta${late ? ' late' : ''}">${late ? `Lùi sang <b>${date(n.eta)}</b><s title="Ngày dự kiến cũ">${shortDate(n.eta_prev)}</s>` : `Dự kiến <b>${date(n.eta)}</b>`}</p>` : ''; };
  /* Giấy note: Mới phát hành = tên, giá trị, ngày phát hành, số người đã cần, Dùng ngay · Đang hoàn thiện / Sẽ làm = tên, mô tả, ngày dự kiến, Tôi cũng cần
     · Trong đề xuất = tên, mô tả, lời Tuấn, Tôi cũng cần. Bấm vào tờ note → popup chi tiết (có công cụ gắn kèm thì mở đúng popup công cụ) */
  function noteCard(n, lane, voted) {
    const tool = toolOf(n.tool_slug);
    const rel = lane === 'done' ? (tool && tool.released ? date(tool.released) : (n.updated_at ? new Date(n.updated_at + 7 * 3600000).toISOString().slice(0, 10).split('-').reverse().join('/') : '')) : '';
    const foot = lane === 'done'
      ? `${n.votes ? `<span class="n-cnt">${n.votes} người đã cùng cần</span>` : ''}${tool ? `<a class="n-use" href="/cong-cu/${esc(tool.slug)}" data-tool="${esc(tool.slug)}">Dùng ngay →</a>` : ''}`
      : voteBtn(n, voted);
    return `<article class="pnote n-${lane}" style="--tilt:${tilt(n.id)}deg" data-note="${n.id}" tabindex="0" role="button" aria-label="Xem chi tiết: ${esc(n.board_title)}">
      <span class="n-pin" aria-hidden="true"></span>
      <h3 class="hand">${esc(n.board_title)}</h3>
      ${n.board_desc ? `<p class="n-desc">${esc(n.board_desc)}</p>` : ''}
      ${lane === 'done' ? (rel ? `<p class="n-eta">Phát hành <b>${rel}</b></p>` : '') : (lane !== 'xet' ? etaHtml(n) : '')}
      ${n.board_note && lane !== 'done' ? `<p class="n-say hand">${esc(n.board_note)}</p>` : ''}
      <div class="n-foot">${foot}</div></article>`;
  }
  /* Popup chi tiết 1 đề xuất (khi chưa gắn công cụ): dùng chung khung "sách mở" của popup công cụ */
  function noteModal(n, voted) {
    const [k, name] = laneOf(n.status), steps = [...LANES].reverse(), cur = steps.findIndex(l => l[0] === k);
    return `<div class="tm-backdrop" data-close></div>
    <div class="tm tm-book g-kn nm" role="dialog" aria-modal="true" aria-labelledby="tm-title">
      <button class="tm-x" data-close aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="bk-pages">
        <section class="bk-page bk-left">
          <span class="bk-grp">Bảng ghim · ${esc(name)}</span>
          <header class="bk-head"><span class="bk-ic">${icon('clipboard')}</span><h2 id="tm-title">${esc(n.board_title)}</h2></header>
          <div class="bk-meta"><span class="stb${k === 'done' ? ' on' : ''}">${esc(name)}</span>${k !== 'xet' && k !== 'done' && n.eta ? `<span class="nm-eta">Dự kiến ${date(n.eta)}</span>` : ''}</div>
          ${n.board_desc ? `<div class="bk-blk"><h3>Việc cần giải quyết:</h3><p class="bk-pain">${esc(n.board_desc)}</p></div>` : ''}
          ${n.board_note ? `<div class="bk-blk"><h3>Lời anh Tuấn:</h3><p class="nm-say hand">${esc(n.board_note)}</p></div>` : ''}
          <div class="bk-cta">${k === 'done' ? '' : voteBtn(n, voted)}<button type="button" class="btn ghost bk-sug" data-suggest="" data-about="${esc(n.board_title)}">Đề xuất thêm tính năng</button></div>
        </section>
        <section class="bk-page bk-right">
          <div class="bk-blk"><h3>Hành trình của ý tưởng</h3>
            <ol class="nm-steps">${steps.map(([sk, sn, , sd], i) => `<li class="${i < cur ? 'past' : i === cur ? 'now' : ''}"><b>${esc(sn)}</b><span>${esc(sd)}</span></li>`).join('')}</ol></div>
          <div class="nm-dom"><span class="nm-dom-img" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-07-nghi-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-07-nghi-toi.webp" alt=""></span>
            <p class="hand">${k === 'xet' ? 'Càng nhiều người bấm “Tôi cũng cần”, ý tưởng càng sớm được thắp sáng!' : k === 'done' ? 'Ý tưởng này đã thành công cụ rồi đó!' : 'Đốm đang nhắc anh Tuấn từng ngày đây!'}</p></div>
        </section>
      </div>
    </div>`;
  }
  function renderBoard(items) {
    const voted = new Set(store.get('qtt-voted', []));
    const lanes = LANES.map(([k, t, f]) => {
      let list = items.filter(n => f(n.status));
      if (k === 'plan' || k === 'build') list.sort((a, b) => (a.eta || '9999').localeCompare(b.eta || '9999') || b.votes - a.votes);
      else if (k === 'done') list.sort((a, b) => b.updated_at - a.updated_at);
      else list.sort((a, b) => b.votes - a.votes || b.id - a.id);
      return `<div class="lane l-${k}"><h2 class="lane-tag"><span>${t}</span><b>${list.length}</b></h2><p class="lane-sub hand">${LANES.find(l => l[0] === k)[3]}</p>
        <div class="lane-notes">${list.length ? list.map(n => noteCard(n, k, voted.has(n.id))).join('') : '<p class="lane-empty hand">Chưa có tờ nào</p>'}</div></div>`;
    }).join('');
    const rest = items.filter(n => n.status === 'rejected');
    $('#board').innerHTML = `<div class="cork-in">${lanes}</div>`;
    const tot = items.filter(n => n.status !== 'rejected');
    $('#bgStats').innerHTML = tot.length ? `<span><b>${tot.length}</b> đề xuất trên bảng</span><span><b>${tot.reduce((s, n) => s + (n.votes || 0), 0)}</b> lượt cùng cần</span><span><b>${tot.filter(n => n.status === 'done').length}</b> đã phát hành</span>` : '';
    $('#bgRest').innerHTML = rest.length ? `<h2 class="mono">Chưa làm lúc này</h2><ul>${rest.map(n => `<li><b>${esc(n.board_title)}</b>${n.board_note ? `<span class="hand">${esc(n.board_note)}</span>` : ''}${safeUrl(n.board_link) ? `<a href="${esc(safeUrl(n.board_link))}" target="_blank" rel="noopener">Giải pháp khác ↗</a>` : ''}</li>`).join('')}</ul>` : '';
  }

  /* ---------- v1.8: Góc ngẫm · Về Minh Tuấn · Tách cà phê ---------- */
  const pad2 = n => String(n).padStart(2, '0');
  const pipeRows = v => lines(v).map(l => l.split('|').map(x => x.trim()));
  const SPINE = ['#8E3B2F', '#2F4F6B', '#5B6B3A', '#6E4A86', '#B0743A', '#3D6E6A', '#7A3B4B', '#2E3A55'];
  const hashN = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const okColor = c => /^#[0-9a-f]{3,8}$/i.test(String(c || '').trim()) ? String(c).trim() : '';
  const ytThumb = id => `https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg`;
  const PLAY = '<span class="gn-play" aria-hidden="true"></span>';

  /* Tủ sách: gáy sách đứng trên kệ gỗ; bấm vào mở sách 2 trang */
  function shelfHtml(books) {
    if (!books.length) return `<div class="gn-shelf"><div class="gn-books is-empty"><p class="hand gn-wait">Kệ đang được xếp những cuốn sách đầu tiên.</p>${plantHtml()}</div></div>`;
    return `<div class="gn-shelf"><div class="gn-books">${books.map((b, i) => {
      const h = hashN(b.slug || b.title), c = okColor(b.color) || SPINE[h % SPINE.length];
      const ht = 214 + (h % 5) * 12, w = Math.max(46, Math.min(66, 34 + String(b.title).length * 1.1));
      return `<button type="button" class="gn-spine" data-book="${i}" style="--c:${c};--h:${ht}px;--w:${Math.round(w)}px" aria-label="Mở sách ${esc(b.title)}">
        <span class="gn-band" aria-hidden="true"></span><span class="gn-st">${esc(b.title)}</span>${b.author ? `<span class="gn-sa">${esc(b.author)}</span>` : ''}<span class="gn-band b" aria-hidden="true"></span></button>`;
    }).join('')}${plantHtml()}</div></div>`;
  }
  const plantHtml = () => `<span class="gn-plant" aria-hidden="true"><i class="lf l1"></i><i class="lf l2"></i><i class="lf l3"></i><i class="pot"></i></span>`;
  /* v1.12 Tủ sách: bấm 1 cuốn → bộ THẺ (bìa · từng câu trích có thể lật xem "Tuấn nghĩ" · bài học · câu hỏi) */
  function deckModal(b) {
    const h = hashN(b.slug || b.title), c = okColor(b.color) || SPINE[h % SPINE.length];
    const quotes = pipeRows(b.quotes), lessons = lines(b.lessons), cards = [];
    cards.push(`<div class="dk-card dk-cover"><span class="mono">Tủ sách · Đổi cách nghĩ</span><h2>${esc(b.title)}</h2>${b.author ? `<p class="dk-au">${esc(b.author)}</p>` : ''}
      ${b.before_text || b.after_text ? `<div class="dk-shift">${b.before_text ? `<p><span class="mono">Trước khi đọc, Tuấn nghĩ</span>${esc(b.before_text)}</p>` : ''}${b.after_text ? `<p><span class="mono">Sau khi đọc, Tuấn</span>${esc(b.after_text)}</p>` : ''}</div>` : ''}
      <p class="dk-hint hand">${quotes.length ? quotes.length + ' câu đáng nhớ trong cuốn này. Lật thẻ tiếp →' : 'Lật thẻ tiếp →'}</p></div>`);
    quotes.forEach(([t, pg, my], i) => cards.push(`<div class="dk-card dk-q${my ? ' can-flip' : ''}" ${my ? 'data-flip tabindex="0" role="button" aria-label="Lật thẻ xem Tuấn nghĩ gì"' : ''}>
      <div class="dk-face dk-front"><span class="dk-no mono">Trích ${pad2(i + 1)}/${pad2(quotes.length)}</span><span class="dk-mark" aria-hidden="true">“</span><p class="dk-quote">${esc(t)}</p>${pg ? `<cite>${esc(pg)}</cite>` : ''}${my ? '<span class="dk-turn">Tuấn nghĩ gì? Lật thẻ ↻</span>' : ''}</div>
      ${my ? `<div class="dk-face dk-back"><span class="mono">Tuấn nghĩ</span><p class="hand">${esc(my)}</p><span class="dk-turn">↻ Xem lại câu trích</span></div>` : ''}</div>`));
    if (lessons.length) cards.push(`<div class="dk-card dk-ls"><span class="mono">Bài học Tuấn rút ra</span><ol>${lessons.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>`);
    if (b.question) cards.push(`<div class="dk-card dk-ask"><span class="mono">Câu hỏi cho anh/chị</span><p class="hand">${esc(b.question)}</p></div>`);
    return `<div class="gn-modal dk" role="dialog" aria-modal="true" aria-label="${esc(b.title)}" style="--c:${c}"><div class="gn-dim" data-gn-close></div>
      <div class="dk-stage"><button type="button" class="gn-x" data-gn-close aria-label="Đóng">×</button>
        <div class="dk-deck">${cards.map((x, i) => x.replace('class="dk-card', `data-i="${i}" class="dk-card`)).join('')}</div>
        <div class="dk-nav"><button type="button" class="dk-btn" data-dk="-1" aria-label="Thẻ trước">‹</button><span class="dk-count mono" aria-live="polite"></span><button type="button" class="dk-btn" data-dk="1" aria-label="Thẻ sau">›</button></div>
      </div></div>`;
  }
  function deckInit(m) {
    const cards = [...m.querySelectorAll('.dk-card')], cnt = m.querySelector('.dk-count'); let cur = 0;
    const paint = () => {
      cards.forEach((c, i) => { const d = i - cur; c.dataset.pos = d < 0 ? 'gone' : d > 3 ? 'far' : String(d); c.setAttribute('aria-hidden', String(d !== 0)); if (d !== 0) c.classList.remove('flipped'); });
      cnt.textContent = `${cur + 1} / ${cards.length}`;
      m.querySelector('[data-dk="-1"]').disabled = cur === 0; m.querySelector('[data-dk="1"]').disabled = cur === cards.length - 1;
    };
    const go = d => { cur = Math.max(0, Math.min(cards.length - 1, cur + d)); paint(); };
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-dk]'); if (b) { go(+b.dataset.dk); return; }
      const f = e.target.closest('[data-flip]'); if (f && f.dataset.pos === '0') f.classList.toggle('flipped');
      else if (e.target.closest('.dk-card') && e.target.closest('.dk-card').dataset.pos !== '0') go(+e.target.closest('.dk-card').dataset.i - cur);
    });
    m.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('[data-flip]')) { e.preventDefault(); e.target.closest('[data-flip]').classList.toggle('flipped'); }
    });
    let x0 = null; const deck = m.querySelector('.dk-deck');
    deck.addEventListener('pointerdown', e => { x0 = e.clientX; });
    deck.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(e.clientX < x0 ? 1 : -1); x0 = null; });
    paint();
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
    return `<div class="cn">
      <div class="cn-chs" role="tablist" aria-label="Chọn kênh">${chs.map((c, i) => `<button type="button" role="tab" data-ch="${i}" aria-selected="${i === ci}"><span class="mono">CH ${pad2(i + 1)}</span><b>${esc(c.name)}</b><small>${c.list.length} video</small></button>`).join('')}</div>
      <div class="tv-wrap cn-tv"><div class="tv"><div class="tv-screen" id="tvScreen">${playing
        ? `<iframe src="${ytPlay(ids, vi)}" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        : `<button type="button" class="tv-play" data-playv="${vi}" aria-label="Phát video ${esc(v.title)}"><img src="${ytThumb(v.yt)}" alt="" loading="lazy">${PLAY}</button>`}
        <span class="tv-ch mono" aria-hidden="true">CH ${pad2(ci + 1)}</span></div>${knobs}</div><div class="tv-legs" aria-hidden="true"></div></div>
      <div class="cn-bar"><div><span class="mono">Đang chiếu · ${esc(ch.name)}</span><h2>${esc(v.title)}</h2>${v.author ? `<p class="cn-au">${esc(v.author)}</p>` : ''}</div>
        ${ids.length > 1 ? `<button type="button" class="btn amber" data-playall>▶ Phát cả kênh (${ids.length})</button>` : ''}</div>
      ${ch.list.length ? `<div class="gn-tapes"><div class="gn-tape-row">${ch.list.map((x, j) => `<button type="button" class="gn-tape" data-tape="${j}" aria-current="${j === vi}"><span class="gn-tl hand">${esc(x.title)}</span><span class="gn-reels" aria-hidden="true"><i></i><i></i></span></button>`).join('')}</div></div>` : ''}
      ${v.summary || v.reflection || v.question ? `<article class="gn-note cn-note">${v.summary ? `<p class="gn-sum">${esc(v.summary)}</p>` : ''}
        ${v.reflection ? `<div class="gn-think"><span class="mono">Điều Tuấn ngẫm</span>${lines(v.reflection).map(p => `<p class="hand">${esc(p)}</p>`).join('')}</div>` : ''}
        ${v.question ? `<div class="gn-ask"><span class="mono">Câu hỏi cho anh/chị</span><p class="hand">${esc(v.question)}</p></div>` : ''}</article>` : ''}
    </div>`;
  }
  /* v1.12 Bài viết: "Sổ ghi chép" – bài mở đầu lớn + các trang ghi theo tháng, tem ngày bên trái */
  function notebookHtml(list, T) {
    if (!list.length) return '';
    const hero = list[0], rest = list.slice(1), groups = [];
    rest.forEach(p => { const k = (p.published_at || '').slice(0, 7) || 'khac'; let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, list: [] }); g.list.push(p); });
    const mLabel = k => k === 'khac' ? 'Chưa ghi ngày' : `Tháng ${+k.slice(5, 7)} · ${k.slice(0, 4)}`;
    const stamp = p => { const d = (p.published_at || '').split('-'); return d.length === 3 ? `<span class="nb-stamp" aria-hidden="true"><b>${d[2]}</b><small>Th${+d[1]}</small></span>` : '<span class="nb-stamp" aria-hidden="true"><b>·</b></span>'; };
    return `<a class="nb-hero" href="/blog/${esc(hero.slug)}" data-link><span class="nb-hero-img">${blImg(hero)}<span class="bl-glow" aria-hidden="true"></span></span>
        <span class="nb-hero-txt"><span class="mono">${hero.featured ? 'Trang nổi bật' : 'Trang mới nhất'}</span><span class="bl-tags">${topicList(hero).map(x => blChip(x, T)).join('')}</span>
        <h2>${esc(hero.title)}</h2>${hero.excerpt ? `<span class="bl-ex">${esc(hero.excerpt)}</span>` : ''}<span class="bl-meta">${blMeta(hero)}</span><span class="bl-go">Đọc trang này →</span></span></a>
      ${groups.map(g => `<section class="nb-month"><h3 class="nb-mh hand">${mLabel(g.k)}</h3>${g.list.map(p => `<a class="nb-row" href="/blog/${esc(p.slug)}" data-link>${stamp(p)}
        <span class="nb-txt"><span class="bl-tags">${topicList(p).map(x => blChip(x, T)).join('')}</span><b>${esc(p.title)}</b>${p.excerpt ? `<span class="bl-ex">${esc(p.excerpt)}</span>` : ''}<span class="bl-meta">${p.read_min ? p.read_min + ' phút đọc' : ''}</span></span>
        <span class="nb-thumb">${blImg(p)}</span></a>`).join('')}</section>`).join('')}`;
  }

  /* ---------- v1.9 Blog: "Viết dưới ánh đèn" ---------- */
  const vnSlug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const topicList = p => String(p.topics || '').split(',').map(x => x.trim()).filter(Boolean);
  const blChip = (slug, T, link) => { const t = T.find(x => x.slug === slug); if (!t) return '';
    return link ? `<a class="bl-tag blc-${esc(t.color)}" href="/goc-ngam?phong=bai-viet&chu-de=${esc(t.slug)}" data-link>${esc(t.name)}</a>` : `<span class="bl-tag blc-${esc(t.color)}">${esc(t.name)}</span>`; };
  const blMeta = p => [p.published_at ? date(p.published_at) : '', p.read_min ? p.read_min + ' phút đọc' : ''].filter(Boolean).join(' · ');
  const blImg = (p, cls = '') => safeUrl(p.cover_url) ? `<img class="${cls}" src="${esc(safeUrl(p.cover_url))}" alt="${esc(p.cover_alt || '')}" loading="lazy">` : `<span class="bl-ph ${cls}" aria-hidden="true"><i></i></span>`;
  const blCard = (p, T) => `<a class="bl-card" href="/blog/${esc(p.slug)}" data-link>
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

  /* ---------- các trang ---------- */
  const views = {
    home() {
      const s = SITE.settings;
      const H = [['/goc-ngam', 'Góc ngẫm', 312, 684, 634, 982], ['/cong-cu', 'Bộ công cụ', 692, 590, 1310, 1030], ['/bang-ghim', 'Bảng ghim', 1352, 926, 1712, 1064], ['/tach-ca-phe', 'Tách cà phê', 1414, 612, 1596, 944]];
      const p = (v, t) => (v / t * 100).toFixed(2) + '%';
      return { title: 'Quản trị tử tế', html: `${notice()}
      <div class="room photo-room">
        <div class="m-lamp" aria-hidden="true"></div><button class="pullcord m-cord" data-lamp-cord aria-label="Kéo dây để bật hoặc tắt đèn"><span class="tag"></span></button>
        <div class="homenav"><a class="brand" href="/" data-link><span class="brand-name">Quản trị tử tế</span></a>
          <nav class="main" aria-label="Điều hướng chính">${navLinks('')}${musicBtn()}</nav></div>
        <div class="photo">
          <img class="ph off" src="/assets/desk-off.jpg" alt="" aria-hidden="true">
          <img class="ph on" src="/assets/desk-on.jpg" alt="Bàn làm việc dưới ánh đèn tường: chồng sách, laptop, sổ tay, cốc cà phê">
          <svg class="vnflag" viewBox="0 0 60 70" aria-hidden="true">
            <rect x="29" y="6" width="2.2" height="42" rx="1.1" fill="#b9b2a6"/><circle cx="30.1" cy="5.4" r="2.3" fill="#d8c08a"/>
            <path d="M31.2 8 C38 6.5 44 9.5 57 7.5 V25.5 C44 27.5 38 24.5 31.2 26 Z" fill="#DA251D"/>
            <path d="M44 11 L45.4 15.3 H49.9 L46.25 17.95 L47.65 22.25 L44 19.6 L40.35 22.25 L41.75 17.95 L38.1 15.3 H42.6 Z" fill="#FFCD00"/>
            <path d="M16 70 L19 50 Q30 45 41 50 L44 70 Z" fill="#2B231D"/><ellipse cx="30" cy="50" rx="11" ry="3" fill="#4A3C31"/>
            <g class="shade" fill="#0b0f14"><rect x="29" y="6" width="2.2" height="42" rx="1.1"/><circle cx="30.1" cy="5.4" r="2.3"/><path d="M31.2 8 C38 6.5 44 9.5 57 7.5 V25.5 C44 27.5 38 24.5 31.2 26 Z"/><path d="M16 70 L19 50 Q30 45 41 50 L44 70 Z"/><ellipse cx="30" cy="50" rx="11" ry="3"/></g>
          </svg>
          ${H.map(([h, l, x1, y1, x2, y2]) => `<a class="spot" style="left:${p(x1, 2000)};top:${p(y1, 1116)};width:${p(x2 - x1, 2000)};height:${p(y2 - y1, 1116)}" href="${h}" data-link aria-label="${l}"><span class="tag">${l}</span></a>`).join('')}
          <button class="pullcord" data-lamp-cord aria-label="Kéo dây để bật hoặc tắt đèn"><span class="tag"></span></button>
          <div class="dust" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(37 + (i * 53) % 27).toFixed(1)}%;--d:${(9 + (i * 7) % 8)}s;--dl:${-(i * 1.7).toFixed(1)}s;--s:${2 + (i % 3)}px"></i>`).join('')}</div>
          <div class="photo-text"><h1>${esc(s.headline)}</h1><p>${esc(s.tagline)}</p></div>
        </div>
        <div class="deskchips">${[['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/goc-ngam', 'Góc ngẫm'], ['/tach-ca-phe', 'Tách cà phê']].map(([h, t]) => `<a href="${h}" data-link>${t}</a>`).join('')}<button class="lampchip" data-lamp-cord>Bật / tắt đèn</button></div>
      </div>` };
    },

    tools(openSlug) {
      const s = SITE.settings;
      return { title: 'Bộ công cụ · Quản trị tử tế', html: `${notice()}${subHead('/cong-cu')}<main class="wrap"><section>
        <div class="tools-head"><h1 class="page-title">Bộ công cụ tiện ích</h1></div>
        <figure class="tquote dq"><span class="dq-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-01-chao-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-01-chao-toi.webp" alt=""></span>
          <blockquote><p>Công cụ ở đây anh Tuấn làm từ chính những việc lặp đi lặp lại anh từng “vật lộn” ở văn phòng, kèm vài món hay của bạn bè anh. Đồ dùng thật, không phải đồ trưng bày! Chưa thấy món hợp với mình? <button type="button" class="dq-link" data-suggest="">Kể Đốm nghe</button>, Đốm chuyển ngay cho anh Tuấn.</p></blockquote></figure>
        <div class="tbar"><div class="tabs" role="tablist" aria-label="Nhóm chủ đề">${TABS.map(([k, label]) => `<button role="tab" data-tab="${k}" class="${TAB_G[k] ? 'g-' + TAB_G[k] : ''}" aria-selected="${k === tab}">${k === 'noi-bat' ? `<span class="tab-star">${STAR}</span>` : ''}${label}</button>`).join('')}</div>
        <input class="search" id="q" type="search" placeholder="Tìm kiếm nhanh" aria-label="Tìm công cụ" value="${esc(query)}"></div>
        <p class="note" id="tabnote" role="status"></p>
        <div id="toolgroups"></div></section>
        ${s.forms_open ? `<section id="dat-hang" class="dq-cta"><span class="dq-cta-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-09-suy-nghi-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-09-suy-nghi-toi.webp" alt=""></span>
          <div><p class="mono">Đề xuất công cụ</p><h2>Anh/chị đang “cày” việc gì lặp đi lặp lại?</h2>
          <p>Kể Đốm nghe một chút. Việc nào nhiều người cùng khổ, Đốm nhắc anh Tuấn thắp đèn làm trước. Có công cụ rồi, Đốm báo ngay!</p></div>
          <button type="button" class="btn amber" data-suggest="">Kể Đốm nghe</button></section>` : ''}
        </main>`,
        after: () => { renderGroups(); if (openSlug) openTool(openSlug, null, true); else if (location.hash === '#dat-hang') $('#dat-hang')?.scrollIntoView({ behavior: 'smooth' }); } };
    },

    board() {
      const open = SITE.settings.forms_open !== false;
      return { title: 'Bảng ghim · Quản trị tử tế', html: `${notice()}${subHead('/bang-ghim')}<main class="wrap">
        <div class="bg-intro"><div><p class="mono">Bảng ghim</p><h1 class="page-title">Công cụ mọi người đang cần</h1>
          <p class="hand bg-lead">Mỗi tờ giấy là một việc lặp lại có người nhờ. Càng nhiều người cùng cần, tờ đó càng được làm sớm.</p></div>
          ${open ? '<button type="button" class="bg-cta" data-suggest="">+ Ghim một đề xuất</button>' : ''}</div>
        <div class="bg-stats" id="bgStats"></div>
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
            if (ev.target.closest('a,button')) return;
            const el = ev.target.closest('[data-note]'); if (el) openNote(el);
          });
          $('#board').addEventListener('keydown', ev => { const el = ev.target.closest('[data-note]'); if (el && ev.target === el && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openNote(el); } });
        } };
    },

    ngam() {
      const q = new URLSearchParams(location.search), ph = q.get('phong');
      const room = ROOMS.some(r => r[0] === ph) ? ph : 'sach';
      return { title: 'Góc ngẫm · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<main class="wrap">
        <div class="gn-intro"><p class="mono">Góc ngẫm</p><h1 class="page-title">Đọc, xem, viết và nghĩ lại</h1>
          <p class="hand gn-lead">Những cuốn sách, thước phim và trang ghi chép đã làm Tuấn đổi cách nghĩ.</p></div>
        <div class="gn-switch" role="tablist" aria-label="Chọn phòng">${ROOMS.map(([k, n]) => `<button type="button" role="tab" data-room="${k}" aria-selected="${room === k}">${n}</button>`).join('')}</div>
        <div id="gnRoom" class="gn-room"><div class="loading">Đang tải…</div></div></main>${footer()}`,
        after: async () => {
          const box = $('#gnRoom'); let cur = room, ci = 0, vi = 0, playing = false, data = null, posts = null, T = [];
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
              else box.innerHTML = shelfHtml(items.filter(x => x.kind !== 'video'));
            } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
          };
          await paint();
          const setRoom = k => { cur = k; playing = false; const u = new URL(location.href); u.searchParams.set('phong', k); if (k !== 'bai-viet') u.searchParams.delete('chu-de'); history.replaceState(null, '', u.pathname + u.search); paint(); };
          document.querySelector('.gn-switch').addEventListener('click', e => { const b = e.target.closest('[data-room]'); if (b && b.dataset.room !== cur) setRoom(b.dataset.room); });
          const closeBook = () => { const m = $('.gn-modal'); if (m) m.remove(); document.documentElement.classList.remove('gn-lock'); };
          box.addEventListener('click', e => {
            const tpa = e.target.closest('[data-topic]');
            if (tpa) { e.preventDefault(); e.stopPropagation(); const u = new URL(location.href); if (tpa.dataset.topic) u.searchParams.set('chu-de', tpa.dataset.topic); else u.searchParams.delete('chu-de'); history.replaceState(null, '', u.pathname + u.search); paint(); return; }
            const sp = e.target.closest('[data-book]');
            if (sp) {
              const books = data.filter(x => x.kind !== 'video');
              closeBook(); box.insertAdjacentHTML('beforeend', deckModal(books[+sp.dataset.book]));
              document.documentElement.classList.add('gn-lock');
              const m = $('.gn-modal'); deckInit(m); m.querySelector('.dk-card[data-pos="0"]')?.focus?.(); m.querySelector('.gn-x').focus();
              m.addEventListener('click', ev => { if (ev.target.closest('[data-gn-close]')) { closeBook(); sp.focus(); } });
              m.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeBook(); sp.focus(); } });
              return;
            }
            const ch = e.target.closest('[data-ch]'); if (ch) { ci = +ch.dataset.ch; vi = 0; playing = false; paint(); return; }
            if (e.target.closest('[data-playall]')) { vi = 0; playing = true; paint(); return; }
            const pv = e.target.closest('[data-playv]'); if (pv) { playing = true; paint(); return; }
            const tp = e.target.closest('[data-tape]');
            if (tp) { vi = +tp.dataset.tape; playing = true; paint().then(() => $('#tvScreen')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); }
          });
        } };
    },

    /* v1.12 Về Minh Tuấn: trang profile mộc mạc – trọng tâm "Tuấn có thể giúp gì" – chân trang các kênh */
    about() {
      const s = SITE.settings, name = s.about_name || 'Minh Tuấn';
      const intro = lines(s.about_intro), career = pipeRows(s.about_career), values = pipeRows(s.about_values), services = pipeRows(s.about_services);
      const ini = name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(-2).toUpperCase();
      const photo = safeUrl(s.about_photo);
      return { title: 'Về ' + name + ' · Quản trị tử tế', html: `${notice()}${subHead('/ve-minh-tuan')}<main class="wrap ab">
        <section class="ab-hero">
          <div class="ab-photo">${photo ? `<img src="${esc(photo)}" alt="Ảnh ${esc(name)}">` : `<span>${esc(ini)}</span>`}<span class="ab-tape" aria-hidden="true"></span></div>
          <div class="ab-hi"><p class="mono">Về Minh Tuấn</p><h1 class="page-title">Xin chào, mình là ${esc(name)}</h1>
            ${s.about_role ? `<p class="ab-role">${esc(s.about_role)}</p>` : ''}
            ${intro.map(p => `<p class="ab-p">${esc(p)}</p>`).join('')}
            <p class="ab-motto hand">“${esc(s.about_motto || s.headline || 'Quản trị lấy Con người làm gốc')}”</p>
            <div class="ab-act"><a class="btn amber" href="#ab-help">Tuấn có thể giúp gì?</a><a class="btn ghost" href="/tach-ca-phe" data-link>Hẹn trò chuyện 1:1</a></div></div>
        </section>
        ${services.length ? `<section class="ab-sec" id="ab-help"><h2 class="ab-h"><span class="mono">01</span>Tuấn có thể giúp anh/chị</h2>
          <div class="ab-help">${services.map(([n, w, how], i) => `<article class="ab-card"><span class="ab-no">${pad2(i + 1)}</span><h3>${esc(n)}</h3>
            ${w ? `<p class="ab-who"><span class="mono">Phù hợp với</span>${esc(w)}</p>` : ''}${how ? `<p class="ab-how">${esc(how)}</p>` : ''}</article>`).join('')}</div>
          <p class="ab-note hand">Chưa thấy đúng việc của mình? Cứ kể Tuấn nghe ở <a href="/tach-ca-phe" data-link>Tách cà phê</a>, Tuấn sẽ nói thật mình giúp được tới đâu.</p></section>` : ''}
        ${values.length ? `<section class="ab-sec"><h2 class="ab-h"><span class="mono">02</span>Cách Tuấn làm việc</h2>
          <ol class="ab-vals">${values.map(([t, d]) => `<li><b>${esc(t)}</b>${d ? `<span>${esc(d)}</span>` : ''}</li>`).join('')}</ol></section>` : ''}
        ${career.length ? `<section class="ab-sec"><h2 class="ab-h"><span class="mono">03</span>Chặng đường đã đi</h2>
          <ol class="ab-road">${career.map(([t, r, l]) => `<li><span class="mono">${esc(t || '')}</span><b>${esc(r || '')}</b>${l ? `<span class="hand">${esc(l)}</span>` : ''}</li>`).join('')}</ol></section>` : ''}
        ${channelsFoot()}
        </main>`,
        after: () => { document.querySelectorAll('a[href="#ab-help"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); $('#ab-help')?.scrollIntoView({ behavior: 'smooth' }); })); } };
    },

    /* v1.12 Tách cà phê gọn 1 màn hình: "Ngồi lại trò chuyện" là chính; Đốm mời cà phê tế nhị, mã QR in trên tách (chỉnh ở Cài đặt → Tách cà phê) */
    cafe() {
      const s = SITE.settings, wall = lines(s.thanks_wall);
      const CUP = `<svg class="cf2-cupsvg" viewBox="0 0 260 200" aria-hidden="true"><ellipse class="cf-saucer-sh" cx="130" cy="188" rx="118" ry="10"/><ellipse class="cf-saucer" cx="130" cy="178" rx="112" ry="16"/><ellipse class="cf-saucer-in" cx="130" cy="175" rx="70" ry="9"/>
        <path class="cf-handle" d="M204 58c40-4 46 54 2 66" fill="none" stroke-width="14" stroke-linecap="round"/><path class="cf-body" d="M36 26h176l-12 118c-2 18-18 30-36 30H84c-18 0-34-12-36-30z"/>
        <ellipse class="cf-rim" cx="124" cy="26" rx="88" ry="14"/><ellipse class="cf-coffee" cx="124" cy="27" rx="77" ry="10"/></svg>`;
      const STEAM = '<svg class="cf-steam" viewBox="0 0 120 90" aria-hidden="true"><path d="M40 86c-10-14 10-22 0-36s8-24 2-40"/><path d="M60 86c-10-14 10-22 0-36s8-24 2-40"/><path d="M80 86c-10-14 10-22 0-36s8-24 2-40"/></svg>';
      return { title: 'Tách cà phê · Quản trị tử tế', html: `${notice()}${subHead('/tach-ca-phe')}<main class="wrap cf2">
        <section class="cf2-talk" id="hen-1-1"><p class="mono">Tách cà phê</p><h1 class="page-title">Ngồi lại trò chuyện</h1>
          <p class="cf2-lead">Anh/chị đang vướng chuyện vận hành, nhân sự hay một việc lặp đi lặp lại? Để lại vài dòng, Tuấn sẽ liên hệ hẹn một buổi trò chuyện 1:1.</p>
          ${s.booking_open ? `<form class="cf-form cf2-form" id="bookform" novalidate>
            <div class="bg-two"><label for="b-name">Tên anh/chị<input id="b-name" required placeholder="Nguyễn Văn A"></label>
            <label for="b-contact">Số điện thoại, Zalo hoặc email<input id="b-contact" required></label></div>
            <div class="bg-two"><label for="b-topic">Muốn trao đổi về<select id="b-topic"><option>Setup vận hành, quy trình</option><option>Nhân sự, cơ chế thu nhập</option><option>Setup, vận hành spa</option><option>Ứng dụng AI, công cụ</option><option>Khác</option></select></label>
            <label for="b-desc">Tình huống cụ thể<textarea id="b-desc" rows="2" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label></div>
            <label class="cf-check"><input type="checkbox" id="b-consent"> Tôi đồng ý để Tuấn lưu thông tin này và liên hệ lại.</label>
            <input type="text" id="b-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="bg-send"><button type="submit">Gửi lời hẹn</button><p id="b-msg" role="status"></p>
              <button type="button" class="dq-link cf2-tool" data-suggest="">Cần một công cụ? Kể Đốm nghe →</button></div></form>` : '<p class="hand cf-off">Hiện tạm ngừng nhận lịch trò chuyện.</p>'}
        </section>
        <aside class="cf2-cafe" aria-label="Mời Đốm một tách cà phê">
          <div class="cf2-say"><span class="cf2-dom" aria-hidden="true"><img class="dv-sang" src="/assets/dom/dom-17-ca-phe-sang.webp" alt=""><img class="dv-toi" src="/assets/dom/dom-17-ca-phe-toi.webp" alt=""></span>
            <p class="cf2-bubble hand">${esc(s.donate_note || 'Nếu anh/chị tìm được một công cụ hữu ích cho mình, thưởng cho Đốm để tạo nhiều giá trị hơn nhé.')}</p></div>
          <div class="cf2-cup">${STEAM}${CUP}${s.donate_qr ? `<button type="button" class="cf2-qr" data-qrzoom aria-label="Phóng to mã QR"><img src="${esc(s.donate_qr)}" alt="Mã QR chuyển khoản mời Đốm cà phê" loading="lazy"></button>` : `<span class="cf2-qr none hand">QR sắp có</span>`}</div>
          ${s.bank_acc ? `<dl class="cf2-bank"><dt>Ngân hàng</dt><dd>${esc(s.bank_name || s.bank_code)}</dd><dt>Số tài khoản</dt><dd><b>${esc(s.bank_acc)}</b><button type="button" class="cf-copy" data-copy="${esc(s.bank_acc)}">Sao chép</button></dd><dt>Chủ tài khoản</dt><dd>${esc(s.bank_holder)}</dd>${s.donate_content ? `<dt>Nội dung</dt><dd>${esc(s.donate_content)}</dd>` : ''}</dl>` : ''}
          ${s.cafe_thanks ? `<p class="cf2-thanks hand">${esc(lines(s.cafe_thanks)[0])}</p>` : ''}
          ${wall.length ? `<div class="cf2-wall"><span class="mono">Cảm ơn những tách cà phê</span><p>${wall.slice(0, 12).map(n => `<span>${esc(n)}</span>`).join('')}</p></div>` : ''}
        </aside></main>`,
        after: () => {
          document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; setTimeout(() => { b.textContent = 'Sao chép'; }, 1600); } catch (e) { }
          }));
          const qz = document.querySelector('[data-qrzoom]'); if (qz) qz.addEventListener('click', () => qz.classList.toggle('zoom'));
          if (location.hash === '#cong-cu') setTimeout(() => document.querySelector('.cf2-tool')?.click(), 400);
        } };
    },

    blogPost(slug) {
      return { title: 'Blog · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<div class="bp-progress" aria-hidden="true"><span id="bpBar"></span></div><main class="wrap" id="bp"><div class="loading">Đang tải…</div></main>${footer()}`,
        after: async () => {
          const box = $('#bp'), key = new URLSearchParams(location.search).get('xem-truoc') || '';
          let d, T = [];
          try { [d, T] = await Promise.all([api('posts/' + encodeURIComponent(slug) + (key ? '?xem-truoc=' + encodeURIComponent(key) : '')), api('topics').then(r => r.topics || []).catch(() => [])]); }
          catch (e) { box.innerHTML = `<div class="bl-empty"><span class="bl-ph" aria-hidden="true"><i></i></span><p class="hand">Không tìm thấy bài viết này.</p><a class="bl-back" href="/goc-ngam?phong=bai-viet" data-link>← Về Góc ngẫm</a></div>`; return; }
          const p = d.post, { html, toc } = blogMd(p.body), link = location.origin + '/blog/' + p.slug, name = SITE.settings.about_name || 'Minh Tuấn';
          document.title = p.title + ' · Quản trị tử tế';
          box.innerHTML = `<article class="bp">
            ${p.preview ? '<p class="bp-preview">Bản xem trước – bài chưa đăng, chỉ người có link này xem được</p>' : ''}
            <header class="bp-head"><p class="bp-crumb"><a href="/goc-ngam?phong=bai-viet" data-link>Góc ngẫm · Bài viết</a>${topicList(p).map(s => blChip(s, T, true)).join('')}</p>
              <h1 class="bp-title">${esc(p.title)}</h1>${p.excerpt ? `<p class="bp-sapo">${esc(p.excerpt)}</p>` : ''}
              <p class="bp-meta"><a href="/ve-minh-tuan" data-link>${esc(name)}</a>${blMeta(p) ? ' · ' + blMeta(p) : ''}</p></header>
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
        <p class="mono">Liên hệ</p><h1 class="page-title">Kết nối với Tuấn</h1>
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
              <label for="b-name">Tên bạn<input id="b-name" required placeholder="Nguyễn Văn A"></label>
              <label for="b-contact">Số điện thoại, Zalo hoặc email<input id="b-contact" required></label>
              <label for="b-topic">Bạn cần trao đổi về<select id="b-topic"><option>Setup vận hành, quy trình</option><option>Nhân sự, cơ chế thu nhập</option><option>Setup, vận hành spa</option><option>Ứng dụng AI, công cụ</option><option>Khác</option></select></label>
              <label for="b-desc">Tình huống cụ thể<textarea id="b-desc" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
              <label style="display:flex;gap:8px;font-weight:400;align-items:start"><input type="checkbox" id="b-consent" style="width:auto;margin-top:4px"> Tôi đồng ý để Tuấn lưu thông tin này và liên hệ lại.</label>
              <input type="text" id="b-web" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
              <button class="btn amber" type="submit">Gửi yêu cầu</button><p id="b-msg" role="status"></p>
            </form>` : `<div class="empty">Hiện tạm ngừng nhận lịch tư vấn.</div>`}
          </div>
        </div></section></main>${footer()}`,
        after: () => { if (location.hash === '#cafe') $('#cafe')?.scrollIntoView({ behavior: 'smooth' }); else if (key === '/tach-ca-phe') setTimeout(() => $('#cafe')?.scrollIntoView({ behavior: 'smooth' }), 80); } };
    },
  };

  /* ---------- danh sách công cụ theo tab ---------- */
  const TAB_KEYS = TABS.map(t => t[0]);
  let tab = 'noi-bat', query = '';
  const sortTools = list => list.slice().sort((a, b) => (ST_ORDER[a.status] ?? 3) - (ST_ORDER[b.status] ?? 3) || a.sort - b.sort);
  function renderGroups() {
    const box = $('#toolgroups'); if (!box) return;
    const q = query.trim().toLowerCase();
    const note = $('#tabnote');
    document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', !q && b.dataset.tab === tab));
    if (q) {
      const list = sortTools(SITE.tools.filter(t => (t.name + ' ' + t.pain + ' ' + t.tags + ' ' + (GRP[t.grp] || '')).toLowerCase().includes(q)));
      note.textContent = list.length ? `${list.length} kết quả` : '';
      box.innerHTML = list.length ? `<div class="bgrid">${list.map(t => toolCard(t)).join('')}</div>`
        : `<div class="empty" style="margin-top:8px">Chưa có công cụ cho “${esc(query)}”. <button type="button" class="dq-link" data-suggest="">Kể Đốm nghe để anh Tuấn làm</button>.</div>`;
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
          ${t.who ? `<div class="bk-blk"><h3>Công cụ phù hợp với:</h3><p class="bk-who">${esc(t.who)}</p></div>` : ''}
          <div class="bk-cta">${usable ? `${url ? `<a class="btn bk-go" href="${esc(url)}">${dl ? 'Dùng online ↗' : 'Dùng công cụ ↗'}</a>` : ''}${dl ? `<a class="btn ghost bk-dl" href="${esc(dl)}" download="${esc(dlName(t, dl))}" data-dl="${esc(t.slug)}">Tải bản offline</a>` : ''}`
            : ''}<button type="button" class="btn ghost bk-sug" data-suggest="${esc(t.slug)}">${usable ? 'Đề xuất thêm tính năng' : 'Góp ý cho công cụ này'}</button></div>
          ${pub || upd ? `<p class="bk-dates">${pub ? `Ngày xuất bản: ${pub}` : ''}${pub && upd ? ' · ' : ''}${upd ? `Phiên bản cập nhật ngày ${upd}` : ''}</p>` : ''}
        </section>
        <section class="bk-page bk-right">
          <div class="bk-blk"><h3>Video demo</h3>${video}</div>
          ${hl.length ? `<div class="bk-blk"><h3>Tiện ích nổi bật</h3><ol class="bk-hl">${hl.map(([a, b]) => `<li><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ''}</li>`).join('')}</ol></div>` : ''}
          ${!hl.length && !t.pain ? `<p class="bk-who">Thông tin về công cụ đang được cập nhật.</p>` : ''}
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
    else if (path === '/ve-minh-tuan' || (path === '/lien-he' && location.hash !== '#cafe')) v = views.about();
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
      msg.textContent = isOrder ? 'Cảm ơn bạn! Tuấn đã nhận được đặt hàng.' : 'Cảm ơn bạn! Tuấn sẽ liên hệ lại sớm.';
    } catch (err) { msg.className = 'err'; msg.textContent = err.message; }
    btn.disabled = false;
  });
  window.addEventListener('popstate', () => { pushedModal = false; route(); });

  api('site').then(d => { SITE = d; route(); }).catch(() => { route(); });
})();
