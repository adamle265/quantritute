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
  const TABS = [['noi-bat', 'Tiện ích nổi bật', t => t.featured], ['ke-toan', GRP.kt, t => t.grp === 'kt'], ['hanh-chinh', GRP.hc, t => t.grp === 'hc'],
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
  const NAV = [['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/blog', 'Blog'], ['/goc-ngam', 'Góc ngẫm'], ['/ve-minh-tuan', 'Về Minh Tuấn'], ['/tach-ca-phe', 'Tách cà phê']];
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
    try { localStorage.setItem('qtt-lamp', lamp); } catch (e) { }
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
  const navLinks = active => NAV.map(([h, t]) => `<a href="${h}" data-link aria-current="${active.startsWith(h) ? 'page' : 'false'}">${t}</a>`).join('');
  const subHead = active => `
    <header class="subhead"><div class="glow"></div><div class="lamp" aria-hidden="true"></div>
      <div class="wrap topnav">
        <a class="brand" href="/" data-link><span class="brand-name"><svg class="brand-mark" viewBox="4 4 56 56" aria-hidden="true"><path d="M40.45 12.61A23 23 0 1 1 23.55 12.61" fill="none" stroke="currentColor" stroke-width="4"/><circle class="g" cx="32" cy="11" r="5.5"/><path class="g" d="M32 19L38 35H26Z"/><path d="M26 35L32 52L38 35" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/></svg>Quản trị tử tế</span></a>
        <nav class="main" aria-label="Điều hướng chính">${navLinks(active)}<button class="lampbtn" data-lamp-toggle aria-label="Bật tắt đèn"></button></nav>
      </div></header>`;
  const footer = () => {
    const s = SITE.settings, soc = [['TikTok', s.social_tiktok], ['Fanpage', s.social_facebook], ['YouTube', s.social_youtube]].filter(x => x[1]);
    return `<footer class="site"><div class="wrap"><span class="hand" style="font-size:20px;color:var(--ink)">${esc(s.headline || 'Quản trị lấy Con người làm gốc')}.</span>
      <span class="socials">${soc.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}<span>© ${new Date().getFullYear()} quantritute.vn</span></span></div></footer>`;
  };
  const notice = () => SITE.settings.notice ? `<div class="notice">${esc(SITE.settings.notice)}</div>` : '';

  /* Bìa sách: mỗi NHÓM một màu (Kế toán xanh dương, Hành chính xanh lá, Khởi nghiệp cam đất, Học tập tím) – màu khai báo trong style.css */
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
      </span></a>`;
  /* Banner tượng trưng: ảnh riêng nếu có, không thì vẽ theo nhóm + icon */
  const artOf = t => {
    const img = safeUrl(t.banner_url);
    return img ? `<img src="${esc(img)}" alt="" loading="lazy">`
      : `<div class="art-gen"><span class="art-grid"></span><span class="art-ring r1"></span><span class="art-ring r2"></span>${icon(t.icon, 'art-icon')}</div>`;
  };

  /* ---------- Bảng ghim (v1.7): đề xuất công cụ trên bảng bần ---------- */
  const LANES = [['xet', 'Đang cân nhắc', s => s === 'new' || s === 'reviewing'], ['plan', 'Sẽ làm', s => s === 'planned'],
    ['build', 'Đang làm', s => s === 'building'], ['done', 'Đã phát hành', s => s === 'done']];
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const voterId = () => { let c = store.get('qtt-cid', ''); if (!/^[a-z0-9]{12,40}$/.test(c)) { c = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('qtt-cid', c); } return c; };
  const toolOf = slug => slug ? (SITE.tools || []).find(t => t.slug === slug) : null;
  const tilt = id => (((id * 37) % 9) - 4) * 0.55;
  const shortDate = iso => { const p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; };
  function noteCard(n, lane, voted) {
    const late = n.eta && n.eta_prev && n.eta > n.eta_prev;
    const eta = lane === 'plan' || lane === 'build'
      ? (n.eta ? `<p class="n-eta${late ? ' late' : ''}">${late ? `Lùi sang <b>${date(n.eta)}</b><s title="Ngày dự kiến cũ">${shortDate(n.eta_prev)}</s>` : `Dự kiến <b>${date(n.eta)}</b>`}</p>` : '') : '';
    const tool = lane === 'done' ? toolOf(n.tool_slug) : null;
    const foot = lane === 'done'
      ? (tool ? `<a class="n-use" href="/cong-cu/${esc(tool.slug)}" data-link>Dùng ngay →</a>` : '')
      : `<button type="button" class="n-vote" data-vote="${n.id}" aria-pressed="${voted}"><span class="n-plus" aria-hidden="true">${voted ? '✓' : '+1'}</span>${voted ? 'Bạn cũng cần' : 'Tôi cũng cần'}<b>${n.votes || 0}</b></button>`;
    return `<article class="pnote n-${lane}" style="--tilt:${tilt(n.id)}deg">
      <span class="n-pin" aria-hidden="true"></span>
      <h3 class="hand">${esc(n.board_title)}</h3>
      ${n.board_desc ? `<p class="n-desc">${esc(n.board_desc)}</p>` : ''}
      ${eta}${n.board_note ? `<p class="n-say hand">${esc(n.board_note)}</p>` : ''}
      <div class="n-foot">${foot}</div></article>`;
  }
  function renderBoard(items) {
    const voted = new Set(store.get('qtt-voted', []));
    const lanes = LANES.map(([k, t, f]) => {
      let list = items.filter(n => f(n.status));
      if (k === 'plan' || k === 'build') list.sort((a, b) => (a.eta || '9999').localeCompare(b.eta || '9999') || b.votes - a.votes);
      else if (k === 'done') list.sort((a, b) => b.updated_at - a.updated_at);
      else list.sort((a, b) => b.votes - a.votes || b.id - a.id);
      return `<div class="lane l-${k}"><h2 class="lane-tag"><span>${t}</span><b>${list.length}</b></h2>
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
  function bookModal(b) {
    const h = hashN(b.slug || b.title), c = okColor(b.color) || SPINE[h % SPINE.length];
    const quotes = pipeRows(b.quotes), lessons = lines(b.lessons);
    return `<div class="gn-modal" role="dialog" aria-modal="true" aria-label="${esc(b.title)}"><div class="gn-dim" data-gn-close></div>
      <div class="gn-open" style="--c:${c}"><button type="button" class="gn-x" data-gn-close aria-label="Đóng">×</button>
        <div class="gn-pg gn-l">
          <p class="mono">Tủ sách · Đổi cách nghĩ</p><h2>${esc(b.title)}</h2>${b.author ? `<p class="gn-au">${esc(b.author)}</p>` : ''}
          ${b.before_text || b.after_text ? `<div class="gn-shift">
            ${b.before_text ? `<div class="gn-bf"><span class="mono">Trước khi đọc, tôi nghĩ</span><p>${esc(b.before_text)}</p></div>` : ''}
            ${b.before_text && b.after_text ? '<span class="gn-arr" aria-hidden="true">↓</span>' : ''}
            ${b.after_text ? `<div class="gn-af"><span class="mono">Sau khi đọc, tôi</span><p>${esc(b.after_text)}</p></div>` : ''}</div>` : ''}
          ${lessons.length ? `<div class="gn-ls"><span class="mono">Bài học</span><ul>${lessons.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
        </div>
        <div class="gn-pg gn-r">
          ${quotes.length ? `<span class="mono">Những dòng đã gạch chân</span>${quotes.map(([t, p]) => `<blockquote class="gn-q"><p><mark>${esc(t)}</mark></p>${p ? `<cite>${esc(p)}</cite>` : ''}</blockquote>`).join('')}` : ''}
          ${b.question ? `<div class="gn-ask"><span class="mono">Câu hỏi cho bạn</span><p class="hand">${esc(b.question)}</p></div>` : ''}
        </div></div></div>`;
  }
  /* Phòng chiếu: TV cũ + ghi chú "Điều tôi ngẫm" + các cuộn băng */
  function cinemaHtml(videos, i) {
    const knobs = '<div class="tv-side" aria-hidden="true"><span class="tv-knob"></span><span class="tv-knob"></span><span class="tv-grill"></span></div>';
    if (!videos.length) return `<div class="gn-cinema"><div class="tv-wrap"><div class="tv"><div class="tv-screen tv-static"><p class="hand">Chưa có buổi chiếu nào.</p></div>${knobs}</div><div class="tv-legs" aria-hidden="true"></div></div></div>`;
    const v = videos[i];
    return `<div class="gn-cinema">
      <div class="tv-wrap"><div class="tv"><div class="tv-screen" id="tvScreen">${v.yt ? `<button type="button" class="tv-play" data-play="${esc(v.yt)}" aria-label="Phát video ${esc(v.title)}"><img src="${ytThumb(v.yt)}" alt="" loading="lazy">${PLAY}</button>` : `<p class="hand">Video sắp có</p>`}</div>${knobs}</div><div class="tv-legs" aria-hidden="true"></div></div>
      <article class="gn-note">${v.author ? `<p class="mono">${esc(v.author)}</p>` : ''}<h2>${esc(v.title)}</h2>
        ${v.summary ? `<p class="gn-sum">${esc(v.summary)}</p>` : ''}
        ${v.reflection ? `<div class="gn-think"><span class="mono">Điều tôi ngẫm</span>${lines(v.reflection).map(p => `<p class="hand">${esc(p)}</p>`).join('')}</div>` : ''}
        ${v.question ? `<div class="gn-ask"><span class="mono">Câu hỏi cho bạn</span><p class="hand">${esc(v.question)}</p></div>` : ''}
      </article></div>
      ${videos.length > 1 ? `<div class="gn-tapes"><p class="mono">Những cuộn băng</p><div class="gn-tape-row">${videos.map((x, j) => `<button type="button" class="gn-tape" data-tape="${j}" aria-current="${j === i}"><span class="gn-tl hand">${esc(x.title)}</span><span class="gn-reels" aria-hidden="true"><i></i><i></i></span></button>`).join('')}</div></div>` : ''}`;
  }

  /* ---------- v1.9 Blog: "Viết dưới ánh đèn" ---------- */
  const vnSlug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const topicList = p => String(p.topics || '').split(',').map(x => x.trim()).filter(Boolean);
  const blChip = (slug, T, link) => { const t = T.find(x => x.slug === slug); if (!t) return '';
    return link ? `<a class="bl-tag blc-${esc(t.color)}" href="/blog?chu-de=${esc(t.slug)}" data-link>${esc(t.name)}</a>` : `<span class="bl-tag blc-${esc(t.color)}">${esc(t.name)}</span>`; };
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
          <nav class="main" aria-label="Điều hướng chính">${NAV.map(([h, t]) => `<a href="${h}" data-link>${t}</a>`).join('')}</nav></div>
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
          <div class="photo-text"><h1>${esc(s.headline)}</h1><p>${esc(s.tagline)}</p></div>
        </div>
        <div class="deskchips">${[['/cong-cu', 'Bộ công cụ'], ['/bang-ghim', 'Bảng ghim'], ['/goc-ngam', 'Góc ngẫm'], ['/tach-ca-phe', 'Tách cà phê']].map(([h, t]) => `<a href="${h}" data-link>${t}</a>`).join('')}<button class="lampchip" data-lamp-cord>Bật / tắt đèn</button></div>
      </div>${footer()}` };
    },

    tools(openSlug) {
      const s = SITE.settings;
      return { title: 'Bộ công cụ · Quản trị tử tế', html: `${notice()}${subHead('/cong-cu')}<main class="wrap"><section>
        <div class="tools-head"><h1 class="page-title">Bộ công cụ tiện ích</h1></div>
        <figure class="tquote"><blockquote>
          <p>Các công cụ dưới đây Tuấn làm để giải quyết những vấn đề cụ thể, những tác vụ lặp đi lặp lại trong nhiều công việc nhỏ, dựa trên kinh nghiệm quản trị của Tuấn ở khối văn phòng. Tuấn cũng tổng hợp thêm một số công cụ của các cá nhân ở lĩnh vực khác mà Tuấn thấy hữu ích cho các bạn. Hi vọng bạn sẽ tối ưu được công việc của mình.</p>
          <p>Nếu bạn chưa tìm được công cụ phù hợp cho vấn đề của mình, đừng ngại chia sẻ với Tuấn ở <a href="#dat-hang">form bên dưới</a>, có thể Tuấn sẽ giúp được bạn.</p>
          <p>Cảm ơn bạn đã tin tưởng.</p></blockquote><figcaption>— Minh Tuấn</figcaption></figure>
        <div class="tbar"><div class="tabs" role="tablist" aria-label="Nhóm chủ đề">${TABS.map(([k, label]) => `<button role="tab" data-tab="${k}" class="${TAB_G[k] ? 'g-' + TAB_G[k] : ''}" aria-selected="${k === tab}">${k === 'noi-bat' ? `<span class="tab-star">${STAR}</span>` : ''}${label}</button>`).join('')}</div>
        <input class="search" id="q" type="search" placeholder="Tìm kiếm nhanh" aria-label="Tìm công cụ" value="${esc(query)}"></div>
        <p class="note" id="tabnote" role="status"></p>
        <div id="toolgroups"></div></section>
        ${s.forms_open ? `<section id="dat-hang"><div class="card order">
          <div><p class="mono">Đặt hàng công cụ</p><h2 class="page-title" style="font-size:clamp(24px,3vw,34px)">Bạn đang mất thời gian nhất vì việc gì?</h2>
          <p class="muted" style="margin-top:10px">Tuấn đọc từng yêu cầu và ưu tiên làm việc nhiều người cùng gặp.</p></div>
          <form class="form" id="orderform">
            <label for="o-pain">Việc lặp lại bạn đang làm<textarea id="o-pain" required minlength="10" placeholder="Ví dụ: mỗi tháng mình phải gộp 12 file chấm công thành một bảng…"></textarea></label>
            <label for="o-role">Bạn làm vị trí<select id="o-role"><option>Kế toán</option><option>Hành chính – nhân sự</option><option>Bán hàng online</option><option>Chủ cơ sở, chủ spa</option><option>Khác</option></select></label>
            <label for="o-contact">Email hoặc Zalo (nếu muốn nhận tin khi có tool)<input id="o-contact" placeholder="Không bắt buộc"></label>
            <input type="text" name="website" id="o-web" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
            <button class="btn" type="submit">Gửi đặt hàng</button><p id="o-msg" role="status"></p>
          </form></div></section>` : ''}
        </main>${footer()}`,
        after: () => { renderGroups(); if (openSlug) openTool(openSlug, null, true); else if (location.hash === '#dat-hang') $('#dat-hang')?.scrollIntoView({ behavior: 'smooth' }); } };
    },

    board() {
      const open = SITE.settings.forms_open !== false;
      return { title: 'Bảng ghim · Quản trị tử tế', html: `${notice()}${subHead('/bang-ghim')}<main class="wrap">
        <div class="bg-intro"><div><p class="mono">Bảng ghim</p><h1 class="page-title">Công cụ mọi người đang cần</h1>
          <p class="hand bg-lead">Mỗi tờ giấy là một việc lặp lại có người nhờ. Càng nhiều người cùng cần, tờ đó càng được làm sớm.</p></div>
          ${open ? '<a class="bg-cta" href="#ghim-de-xuat">+ Ghim một đề xuất</a>' : ''}</div>
        <div class="bg-stats" id="bgStats"></div>
        <div class="cork" id="board"><div class="loading">Đang tải…</div></div>
        <div class="bg-rest" id="bgRest"></div>
        ${open ? `<div class="bg-add" id="ghim-de-xuat"><form class="bg-paper" id="pinform" novalidate>
          <span class="n-pin" aria-hidden="true"></span>
          <h2 class="hand">Bạn đang lặp lại việc gì mỗi ngày?</h2>
          <label>Việc đang làm thủ công<textarea id="p-pain" rows="4" required placeholder="VD: Mỗi cuối tháng mình chép tay 200 dòng sao kê sang Excel để đối chiếu…"></textarea></label>
          <div class="bg-two"><label>Vị trí của bạn<input id="p-role" placeholder="Kế toán, Hành chính – Nhân sự…"></label>
          <label>Zalo hoặc email (không bắt buộc)<input id="p-contact" placeholder="Để Tuấn báo khi có công cụ"></label></div>
          <input id="p-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p class="bg-priv">Thông tin liên hệ chỉ dùng để báo bạn khi có công cụ, không hiện trên bảng.</p>
          <div class="bg-send"><button type="submit">Gửi đề xuất</button><span id="p-msg" class="note" role="status"></span></div>
        </form></div>` : ''}
        </main>${footer()}`,
        after: async () => {
          let items = [];
          try { items = (await api('board')).items || []; renderBoard(items); }
          catch (e) { $('#board').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
          $('#board').addEventListener('click', async ev => {
            const b = ev.target.closest('[data-vote]'); if (!b || b.getAttribute('aria-pressed') === 'true' || b.disabled) return;
            const id = +b.dataset.vote; b.disabled = true;
            try {
              const r = await api('board/' + id, { method: 'POST', body: JSON.stringify({ cid: voterId() }) });
              const v = new Set(store.get('qtt-voted', [])); v.add(id); store.set('qtt-voted', [...v]);
              const n = items.find(x => x.id === id); if (n) n.votes = r.votes;
              b.setAttribute('aria-pressed', 'true'); b.innerHTML = `<span class="n-plus" aria-hidden="true">✓</span>Bạn cũng cần<b>${r.votes}</b>`;
              b.closest('.pnote').classList.add('bump');
            } catch (e) { b.title = e.message; } finally { b.disabled = false; }
          });
          const f = $('#pinform');
          if (f) f.addEventListener('submit', async ev => {
            ev.preventDefault(); ev.stopPropagation();
            const btn = f.querySelector('button[type=submit]'), msg = $('#p-msg');
            btn.disabled = true; msg.className = 'note'; msg.textContent = 'Đang gửi…';
            try {
              await api('requests', { method: 'POST', body: JSON.stringify({ pain: $('#p-pain').value, role: $('#p-role').value, contact: $('#p-contact').value, website: $('#p-web').value }) });
              f.reset(); msg.className = 'toast'; msg.textContent = 'Đã nhận. Tuấn đọc từng đề xuất và ghim lên bảng khi đã rõ việc cần làm.';
            } catch (e) { msg.className = 'err'; msg.textContent = e.message; }
            btn.disabled = false;
          });
        } };
    },

    ngam() {
      const room = new URLSearchParams(location.search).get('phong') === 'chieu' ? 'chieu' : 'sach';
      return { title: 'Góc ngẫm · Quản trị tử tế', html: `${notice()}${subHead('/goc-ngam')}<main class="wrap">
        <div class="gn-intro"><p class="mono">Góc ngẫm</p><h1 class="page-title">Đọc, xem và nghĩ lại</h1>
          <p class="hand gn-lead">Những cuốn sách và thước phim đã làm Tuấn đổi cách nghĩ.</p></div>
        <div class="gn-switch" role="tablist" aria-label="Chọn phòng">
          <button type="button" role="tab" data-room="sach" aria-selected="${room === 'sach'}">Tủ sách</button>
          <button type="button" role="tab" data-room="chieu" aria-selected="${room === 'chieu'}">Phòng chiếu</button></div>
        <div id="gnRoom" class="gn-room"><div class="loading">Đang tải…</div></div></main>${footer()}`,
        after: async () => {
          const box = $('#gnRoom'); let items = [], cur = room, vi = 0;
          try { items = (await api('reflections')).items || []; } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
          const books = items.filter(x => x.kind !== 'video'), videos = items.filter(x => x.kind === 'video');
          const paint = () => {
            box.innerHTML = cur === 'chieu' ? cinemaHtml(videos, vi) : shelfHtml(books);
            document.querySelectorAll('[data-room]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.room === cur)));
          };
          paint();
          const closeBook = () => { const m = $('.gn-modal'); if (m) m.remove(); document.documentElement.classList.remove('gn-lock'); };
          document.querySelector('.gn-switch').addEventListener('click', e => {
            const b = e.target.closest('[data-room]'); if (!b || b.dataset.room === cur) return;
            cur = b.dataset.room; history.replaceState(null, '', '/goc-ngam' + (cur === 'chieu' ? '?phong=chieu' : '')); paint();
          });
          box.addEventListener('click', e => {
            const sp = e.target.closest('[data-book]');
            if (sp) {
              closeBook(); box.insertAdjacentHTML('beforeend', bookModal(books[+sp.dataset.book]));
              document.documentElement.classList.add('gn-lock');
              const m = $('.gn-modal'); m.querySelector('.gn-x').focus();
              m.addEventListener('click', ev => { if (ev.target.closest('[data-gn-close]')) { closeBook(); sp.focus(); } });
              m.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeBook(); sp.focus(); } });
              return;
            }
            const pl = e.target.closest('[data-play]');
            if (pl) { pl.outerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(pl.dataset.play)}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; return; }
            const tp = e.target.closest('[data-tape]');
            if (tp) { vi = +tp.dataset.tape; paint(); $('#tvScreen')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          });
        } };
    },

    about() {
      const s = SITE.settings, name = s.about_name || 'Minh Tuấn';
      const intro = lines(s.about_intro), career = pipeRows(s.about_career), values = pipeRows(s.about_values), services = pipeRows(s.about_services);
      const ini = name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(-2).toUpperCase();
      const photo = safeUrl(s.about_photo);
      const items = [['Điện thoại', s.contact_phone], ['Zalo', s.contact_zalo], ['Email', s.contact_email]].filter(x => x[1]);
      const soc = [['TikTok', s.social_tiktok], ['Fanpage', s.social_facebook], ['YouTube', s.social_youtube]].filter(x => safeUrl(x[1]));
      return { title: 'Về ' + name + ' · Quản trị tử tế', html: `${notice()}${subHead('/ve-minh-tuan')}<main class="wrap">
        <div class="vm-hero">
          <div class="vm-frame"><div class="vm-photo">${photo ? `<img src="${esc(photo)}" alt="Ảnh ${esc(name)}">` : `<span>${esc(ini)}</span>`}</div></div>
          <div class="vm-txt"><p class="mono">Về Minh Tuấn</p><h1 class="page-title">${esc(name)}</h1>
            ${s.about_role ? `<p class="vm-role">${esc(s.about_role)}</p>` : ''}
            ${intro.map(p => `<p class="vm-p">${esc(p)}</p>`).join('')}
            <div class="vm-motto"><span class="n-pin" aria-hidden="true"></span><span class="mono">${s.about_motto ? 'Phương châm sống' : 'Điều Tuấn tin'}</span><p class="hand">${esc(s.about_motto || s.headline || 'Quản trị lấy Con người làm gốc')}</p></div>
          </div></div>
        ${career.length ? `<div class="vm-sec"><h2 class="vm-h">Hành trình sự nghiệp</h2><div class="vm-cab">${career.map(([t, r, l], i) => `<div class="vm-dr">
            <button type="button" class="vm-front" aria-expanded="false" aria-controls="vmdr${i}"><span class="mono">${esc(t || '')}</span><span class="vm-dr-role">${esc(r || '')}</span><span class="vm-handle" aria-hidden="true"></span></button>
            <div class="vm-dr-body" id="vmdr${i}"><div><div class="vm-paper">${l ? `<span class="mono">Điều học được</span><p class="hand">${esc(l)}</p>` : '<p class="hand">…</p>'}</div></div></div></div>`).join('')}</div></div>` : ''}
        ${values.length ? `<div class="vm-sec"><h2 class="vm-h">Định hướng tạo giá trị</h2><ol class="vm-vals">${values.map(([t, d], i) => `<li><span class="vm-no">${pad2(i + 1)}</span><h3>${esc(t)}</h3>${d ? `<p>${esc(d)}</p>` : ''}</li>`).join('')}</ol></div>` : ''}
        ${services.length ? `<div class="vm-sec"><h2 class="vm-h">Dịch vụ</h2><div class="vm-biz">${services.map(([n, w]) => `<div class="vm-card" tabindex="0"><div class="vm-in">
            <div class="vm-f"><span class="mono">Quản trị tử tế</span><h3>${esc(n)}</h3><span class="vm-rule" aria-hidden="true"></span><span class="hand">${esc(name)}</span></div>
            <div class="vm-b">${w ? `<span class="mono">Phù hợp với</span><p>${esc(w)}</p>` : `<p>Trao đổi 1:1 theo tình huống cụ thể của bạn.</p>`}<a href="/tach-ca-phe#hen-1-1" data-link>Hẹn trò chuyện →</a></div></div></div>`).join('')}</div></div>` : ''}
        <div class="vm-sec vm-contact"><div class="vm-env"><p class="mono">Liên hệ</p>
          ${items.length ? `<dl>${items.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : `<p class="hand vm-soon">Thông tin liên hệ sẽ sớm cập nhật.</p>`}
          ${soc.length ? `<div class="vm-soc">${soc.map(([n, u]) => `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${n} ↗</a>`).join('')}</div>` : ''}
          <a class="vm-go" href="/tach-ca-phe" data-link>Ghé Tách cà phê →</a></div></div>
        </main>${footer()}`,
        after: () => {
          document.querySelectorAll('.vm-front').forEach(b => b.addEventListener('click', () => {
            const d = b.closest('.vm-dr'), on = !d.classList.contains('open'); d.classList.toggle('open', on); b.setAttribute('aria-expanded', String(on));
          }));
          document.querySelectorAll('.vm-card').forEach(c => {
            c.addEventListener('click', e => { if (!e.target.closest('a')) c.classList.toggle('on'); });
            c.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === c) c.classList.toggle('on'); });
          });
        } };
    },

    cafe() {
      const s = SITE.settings, wall = lines(s.thanks_wall), tab = location.hash === '#cong-cu' ? 'cong-cu' : 'hen';
      const STEAM = '<svg class="cf-steam" viewBox="0 0 120 90" aria-hidden="true"><path d="M40 86c-10-14 10-22 0-36s8-24 2-40"/><path d="M60 86c-10-14 10-22 0-36s8-24 2-40"/><path d="M80 86c-10-14 10-22 0-36s8-24 2-40"/></svg>';
      const CUP = `<svg class="cf-cup" viewBox="0 0 260 170" aria-hidden="true"><ellipse class="cf-saucer-sh" cx="130" cy="158" rx="118" ry="11"/><ellipse class="cf-saucer" cx="130" cy="148" rx="112" ry="16"/><ellipse class="cf-saucer-in" cx="130" cy="145" rx="70" ry="9"/>
        <path class="cf-handle" d="M196 52c34-4 40 46 2 58" fill="none" stroke-width="13" stroke-linecap="round"/><path class="cf-body" d="M44 30h156l-10 92c-2 16-16 26-32 26H86c-16 0-30-10-32-26z"/>
        <ellipse class="cf-rim" cx="122" cy="30" rx="78" ry="13"/><ellipse class="cf-coffee" cx="122" cy="31" rx="68" ry="9"/><path class="cf-shine" d="M66 46c-2 26 2 52 10 70" fill="none" stroke-width="6" stroke-linecap="round"/></svg>`;
      return { title: 'Tách cà phê · Quản trị tử tế', html: `${notice()}${subHead('/tach-ca-phe')}<main class="wrap">
        <div class="cf-hero">
          <div class="cf-table">${STEAM}${CUP}</div>
          <div class="cf-letter"><p class="mono">Tách cà phê</p><h1 class="page-title">Mời Tuấn một tách cà phê</h1>
            <div class="cf-paper"><p class="hand">${esc(s.donate_note || '')}</p><p class="hand cf-sign">— Minh Tuấn</p></div></div></div>
        <div class="cf-qr-sec">
          <div class="cf-coaster">${s.donate_qr ? `<img src="${esc(s.donate_qr)}" alt="Mã QR chuyển khoản mời cà phê" loading="lazy">` : `<p class="hand">Mã QR sẽ có khi tài khoản nhận được cập nhật.</p>`}</div>
          <div class="cf-bank">${s.bank_acc ? `<dl><dt>Ngân hàng</dt><dd>${esc(s.bank_name || s.bank_code)}</dd><dt>Số tài khoản</dt><dd><b>${esc(s.bank_acc)}</b><button type="button" class="cf-copy" data-copy="${esc(s.bank_acc)}">Sao chép</button></dd><dt>Chủ tài khoản</dt><dd>${esc(s.bank_holder)}</dd>${s.donate_content ? `<dt>Nội dung</dt><dd>${esc(s.donate_content)}</dd>` : ''}</dl>` : ''}
            ${s.cafe_thanks ? lines(s.cafe_thanks).map(p => `<p class="hand cf-thanks">${esc(p)}</p>`).join('') : ''}</div></div>
        ${wall.length ? `<div class="cf-wall"><h2 class="mono">Bức tường cảm ơn</h2><ul>${wall.map(n => `<li class="hand" style="--t:${tilt(hashN(n)) * .8}deg">${esc(n)}</li>`).join('')}</ul></div>` : ''}
        <div class="cf-talk" id="hen-1-1"><h2 class="vm-h">Ngồi lại trò chuyện</h2>
          <div class="cf-tabs" role="tablist"><button type="button" role="tab" data-cf="hen" aria-selected="${tab === 'hen'}">Hẹn trò chuyện 1:1</button><button type="button" role="tab" data-cf="cong-cu" aria-selected="${tab === 'cong-cu'}">Tôi cần một công cụ</button></div>
          <div class="cf-pane" data-pane="hen" ${tab === 'hen' ? '' : 'hidden'}>${s.booking_open ? `<form class="cf-form" id="bookform" novalidate>
            <div class="bg-two"><label for="b-name">Tên bạn<input id="b-name" required placeholder="Nguyễn Văn A"></label>
            <label for="b-contact">Số điện thoại, Zalo hoặc email<input id="b-contact" required></label></div>
            <label for="b-topic">Bạn cần trao đổi về<select id="b-topic"><option>Setup vận hành, quy trình</option><option>Nhân sự, cơ chế thu nhập</option><option>Setup, vận hành spa</option><option>Ứng dụng AI, công cụ</option><option>Khác</option></select></label>
            <label for="b-desc">Tình huống cụ thể<textarea id="b-desc" rows="4" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
            <label class="cf-check"><input type="checkbox" id="b-consent"> Tôi đồng ý để Tuấn lưu thông tin này và liên hệ lại.</label>
            <input type="text" id="b-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="bg-send"><button type="submit">Gửi lời hẹn</button><p id="b-msg" role="status"></p></div></form>` : '<p class="hand cf-off">Hiện tạm ngừng nhận lịch trò chuyện.</p>'}</div>
          <div class="cf-pane" data-pane="cong-cu" ${tab === 'cong-cu' ? '' : 'hidden'}>${s.forms_open ? `<form class="cf-form" id="orderform" novalidate>
            <label for="o-pain">Việc bạn đang làm thủ công, lặp đi lặp lại<textarea id="o-pain" rows="4" required placeholder="VD: Mỗi cuối tháng mình chép tay 200 dòng sao kê sang Excel để đối chiếu…"></textarea></label>
            <div class="bg-two"><label for="o-role">Vị trí của bạn<input id="o-role" placeholder="Kế toán, Hành chính – Nhân sự…"></label>
            <label for="o-contact">Zalo hoặc email (không bắt buộc)<input id="o-contact"></label></div>
            <input type="text" id="o-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <p class="bg-priv">Đề xuất được Tuấn đọc và ghim lên <a href="/bang-ghim" data-link>Bảng ghim</a> khi đã rõ việc cần làm. Thông tin liên hệ không hiện trên bảng.</p>
            <div class="bg-send"><button type="submit">Gửi đề xuất</button><p id="o-msg" role="status"></p></div></form>` : '<p class="hand cf-off">Hiện tạm ngừng nhận đề xuất công cụ.</p>'}</div>
        </div></main>${footer()}`,
        after: () => {
          const tabs = document.querySelector('.cf-tabs');
          tabs.addEventListener('click', e => {
            const b = e.target.closest('[data-cf]'); if (!b) return;
            tabs.querySelectorAll('[data-cf]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
            document.querySelectorAll('.cf-pane').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.cf; });
          });
          document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; setTimeout(() => { b.textContent = 'Sao chép'; }, 1600); } catch (e) { }
          }));
          if (location.hash === '#hen-1-1' || location.hash === '#cong-cu') setTimeout(() => $('#hen-1-1')?.scrollIntoView({ behavior: 'smooth' }), 80);
        } };
    },

    blog() {
      return { title: 'Blog · Quản trị tử tế', html: `${notice()}${subHead('/blog')}<main class="wrap">
        <div class="bl-intro"><p class="mono">Blog</p><h1 class="page-title">Viết dưới ánh đèn</h1>
          <p class="hand bl-lead">Mỗi ngày một trang ghi chép về quản trị, con người và những điều Tuấn đang học.</p></div>
        <nav class="bl-topics" id="blTopics" aria-label="Lọc theo chủ đề"></nav>
        <div id="blBody" class="bl-body"><div class="loading">Đang tải…</div></div></main>${footer()}`,
        after: async () => {
          let posts = [], T = [], shown = 9;
          try { const [a, b] = await Promise.all([api('posts'), api('topics')]); posts = a.posts || []; T = b.topics || []; }
          catch (e) { $('#blBody').innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
          const paint = () => {
            const cur = new URLSearchParams(location.search).get('chu-de') || '', ct = T.find(t => t.slug === cur);
            const count = s => posts.filter(p => topicList(p).includes(s)).length;
            $('#blTopics').innerHTML = posts.length ? `<a href="/blog" data-topic="" aria-current="${!cur}">Tất cả <b>${posts.length}</b></a>` + T.filter(t => count(t.slug)).map(t => `<a href="/blog?chu-de=${esc(t.slug)}" data-topic="${esc(t.slug)}" class="blc-${esc(t.color)}" aria-current="${cur === t.slug}">${esc(t.name)} <b>${count(t.slug)}</b></a>`).join('') : '';
            const list = cur ? posts.filter(p => topicList(p).includes(cur)) : posts;
            if (!list.length) { $('#blBody').innerHTML = `<div class="bl-empty"><span class="bl-ph" aria-hidden="true"><i></i></span><p class="hand">${posts.length ? 'Chủ đề này chưa có bài.' : 'Bài viết đầu tiên đang được viết dưới ánh đèn.'}</p></div>`; return; }
            const hero = cur ? null : (list.find(p => p.featured) || list[0]), rest = list.filter(p => p !== hero);
            $('#blBody').innerHTML = `${ct && ct.description ? `<p class="bl-tdesc">${esc(ct.description)}</p>` : ''}
              ${hero ? `<a class="bl-hero" href="/blog/${esc(hero.slug)}" data-link><span class="bl-hero-img">${blImg(hero)}<span class="bl-glow" aria-hidden="true"></span></span>
                <span class="bl-hero-txt"><span class="mono bl-new">${hero.featured ? 'Bài nổi bật' : 'Bài mới nhất'}</span><span class="bl-tags">${topicList(hero).map(s => blChip(s, T)).join('')}</span>
                <h2>${esc(hero.title)}</h2>${hero.excerpt ? `<span class="bl-ex">${esc(hero.excerpt)}</span>` : ''}<span class="bl-meta">${blMeta(hero)}</span><span class="bl-go">Đọc bài →</span></span></a>` : ''}
              ${rest.length ? `<div class="bl-grid">${rest.slice(0, shown).map(p => blCard(p, T)).join('')}</div>` : ''}
              ${rest.length > shown ? `<div class="bl-more"><button type="button" id="blMore">Xem thêm bài</button></div>` : ''}`;
            const mb = $('#blMore'); if (mb) mb.onclick = () => { shown += 9; paint(); };
          };
          paint();
          $('#blTopics').addEventListener('click', e => {
            const a = e.target.closest('[data-topic]'); if (!a) return;
            e.preventDefault(); e.stopPropagation(); shown = 9;
            history.replaceState(null, '', '/blog' + (a.dataset.topic ? '?chu-de=' + a.dataset.topic : '')); paint();
          });
        } };
    },

    blogPost(slug) {
      return { title: 'Blog · Quản trị tử tế', html: `${notice()}${subHead('/blog')}<div class="bp-progress" aria-hidden="true"><span id="bpBar"></span></div><main class="wrap" id="bp"><div class="loading">Đang tải…</div></main>${footer()}`,
        after: async () => {
          const box = $('#bp'), key = new URLSearchParams(location.search).get('xem-truoc') || '';
          let d, T = [];
          try { [d, T] = await Promise.all([api('posts/' + encodeURIComponent(slug) + (key ? '?xem-truoc=' + encodeURIComponent(key) : '')), api('topics').then(r => r.topics || []).catch(() => [])]); }
          catch (e) { box.innerHTML = `<div class="bl-empty"><span class="bl-ph" aria-hidden="true"><i></i></span><p class="hand">Không tìm thấy bài viết này.</p><a class="bl-back" href="/blog" data-link>← Về Blog</a></div>`; return; }
          const p = d.post, { html, toc } = blogMd(p.body), link = location.origin + '/blog/' + p.slug, name = SITE.settings.about_name || 'Minh Tuấn';
          document.title = p.title + ' · Quản trị tử tế';
          box.innerHTML = `<article class="bp">
            ${p.preview ? '<p class="bp-preview">Bản xem trước – bài chưa đăng, chỉ người có link này xem được</p>' : ''}
            <header class="bp-head"><p class="bp-crumb"><a href="/blog" data-link>Blog</a>${topicList(p).map(s => blChip(s, T, true)).join('')}</p>
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
      return { title: 'Bài viết · Quản trị tử tế', html: `${notice()}${subHead('/blog')}<main class="wrap" id="post"><div class="loading">Đang tải…</div></main>${footer()}`,
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
        : `<div class="empty" style="margin-top:8px">Chưa có công cụ cho “${esc(query)}”. <a href="#dat-hang">Gửi yêu cầu cho Tuấn</a>.</div>`;
      return;
    }
    note.textContent = '';
    const fn = (TABS.find(t => t[0] === tab) || TABS[0])[2];
    const list = sortTools(SITE.tools.filter(fn));
    if (!list.length) { box.innerHTML = `<div class="empty" style="margin-top:8px">Nhóm này đang được chuẩn bị. <a href="#dat-hang">Gửi yêu cầu cho Tuấn</a>.</div>`; return; }
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
  let modalOpen = null, lastFocus = null, pushedModal = false;
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
          ${tags.length ? `<div class="bk-tags">${tags.slice(0, 5).map(x => `<span>#${esc(x)}</span>`).join('')}</div>` : ''}
          ${ben.length ? `<div class="bk-blk"><h3>Công cụ này sẽ giúp bạn:</h3><ul class="bk-ben">${ben.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`
            : t.pain ? `<div class="bk-blk"><h3>Công cụ này sẽ giúp bạn:</h3><p class="bk-pain">${esc(t.pain)}</p></div>` : ''}
          ${t.who ? `<div class="bk-blk"><h3>Công cụ phù hợp với:</h3><p class="bk-who">${esc(t.who)}</p></div>` : ''}
          <div class="bk-cta">${usable ? `${url ? `<a class="btn bk-go" href="${esc(url)}" target="_blank" rel="noopener">Dùng công cụ ↗</a>` : ''}${dl ? `<a class="btn ghost" href="${esc(dl)}" download>Tải về máy</a>` : ''}`
            : `<a class="btn ghost" href="#dat-hang" data-close-to="dat-hang">Nhận tin khi ra mắt</a>`}</div>
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
    modalOpen = wrap; document.title = t.name + ' · Quản trị tử tế';
    if (!fromRoute) { history.pushState({ modal: slug }, '', '/cong-cu/' + slug + location.search); pushedModal = true; } else pushedModal = false;
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
  function closeTool(silent, then) {
    if (!modalOpen) return;
    const w = modalOpen; modalOpen = null;
    document.documentElement.classList.remove('modal-open'); document.title = 'Bộ công cụ · Quản trị tử tế';
    const box = w.querySelector('.tm');
    if (!silent && box.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.96)', opacity: 0 }], { duration: 160, easing: 'ease-in' }).onfinish = () => w.remove();
      w.querySelector('.tm-backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 });
    } else w.remove();
    if (!silent) {
      if (pushedModal) { pushedModal = false; history.back(); } else history.replaceState(null, '', '/cong-cu' + location.search);
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
    else if (path === '/blog') v = views.blog();
    else if ((m = path.match(/^\/blog\/([a-z0-9-]+)$/))) v = views.blogPost(m[1]);
    /* v1.8: menu mới. Đường dẫn cũ /phat-trien, /lien-he chuyển về trang mới tương ứng */
    else if (path === '/goc-ngam' || path === '/phat-trien') v = views.ngam();
    else if (path === '/ve-minh-tuan' || (path === '/lien-he' && location.hash !== '#cafe')) v = views.about();
    else if (path === '/tach-ca-phe' || path === '/lien-he') v = views.cafe();
    else v = { title: 'Không tìm thấy · Quản trị tử tế', html: `${subHead('')}<main class="wrap"><div class="empty">Trang này không tồn tại. <a href="/" data-link>Về trang chủ</a></div></main>${footer()}` };
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
