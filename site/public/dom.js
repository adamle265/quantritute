/* Đốm – linh vật đồng hành của Quản trị tử tế (v1.12, góp ý 09/10/2026).
   Chạy độc lập với app.js: tự theo dõi đổi trang (#site) và đổi đèn (html[data-lamp]).
   Ảnh: /assets/dom/dom-<mã>-<toi|sang>.webp  (toi = cho nền tối, sang = cho nền sáng)
   - Nút Đốm nổi ở khoảng 1/3 chiều cao màn hình (không bị chữ hệ thống ở góc dưới che), to hơn
   - Lời thoại "Đốm luôn ở đây để hỗ trợ anh/chị!" khi mới vào trang và khi bật đèn, giữ 10 giây
   - Chuyển động: đổi tư thế mờ dần, lơ lửng + lắc nhẹ + toả sáng, bay theo đường cong, bong bóng bật ra
   - 1 form Đề xuất chung (công cụ mới / thêm tính năng) – mở từ mọi nút có data-suggest */
(() => {
  'use strict';
  const root = document.documentElement;
  const IMG = (code, v) => `/assets/dom/dom-${code}-${v}.webp`;
  const POSE = { idle: '07-nghi', sleep: '12-ngu', hello: '01-chao', burst: '19-hoan-thanh', happy: '10-vui', thanks: '21-cam-on', paper: '14-tai-lieu' };
  const TALK = 'Đốm luôn ở đây để hỗ trợ anh/chị!';
  const HOLD = 10000;
  // Theo cấu hình máy người dùng: máy tắt "hiệu ứng hoạt ảnh" thì Đốm đứng yên, đổi tư thế/vị trí ngay (không bay, không lơ lửng)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LANDED = 'Đốm vẫn ở đây, sẵn sàng hỗ trợ anh/chị!';
  const mobile = matchMedia('(max-width: 760px)');
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
    set: (k, v, s = localStorage) => { try { v == null ? s.removeItem(k) : s.setItem(k, v); } catch (e) { } },
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lampOn = () => root.dataset.lamp !== 'off';
  const isHome = () => (location.pathname.replace(/\/+$/, '') || '/') === '/';
  const wait = ms => new Promise(r => setTimeout(r, reduce.matches ? 0 : ms));
  // trên trang chủ nền ảnh luôn tối → dùng bản "toi"; các trang khác theo đèn
  const variant = () => (isHome() || !lampOn()) ? 'toi' : 'sang';
  const preload = src => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = src; });

  /* Đổi ảnh mờ dần (2 lớp ảnh chồng nhau) – luôn chỉ còn 1 ảnh hiện; lệnh đổi sau thắng lệnh trước (tránh 2 Đốm chồng nhau) */
  function swapImg(box, src) {
    const want = box.dataset.want;
    if (want === src) return;
    box.dataset.want = src;
    preload(src).then(() => {
      if (box.dataset.want !== src) return;               // đã có lệnh đổi mới hơn
      const olds = [...box.querySelectorAll('img')];
      const nx = document.createElement('img'); nx.alt = ''; nx.width = 256; nx.height = 256; nx.className = 'dom-layer'; nx.src = src;
      box.appendChild(nx);
      void nx.offsetWidth;                                 // ép trình duyệt vẽ trước khi bật mờ dần (không phụ thuộc requestAnimationFrame)
      nx.classList.add('on');
      olds.forEach(o => { o.classList.remove('on'); setTimeout(() => o.remove(), 450); });
    });
  }

  /* ---------- nút Đốm nổi ---------- */
  const dock = document.createElement('div');
  dock.className = 'dom-dock';
  dock.hidden = true;
  dock.innerHTML = `
    <div class="dom-panel" role="dialog" aria-label="Đốm giúp gì được anh/chị?" hidden>
      <p class="dom-say"></p>
      <div class="dom-menu"></div>
    </div>
    <p class="dom-talk" role="status" hidden></p>
    <button class="dom-btn" type="button" aria-label="Đốm – trợ lý của Quản trị tử tế" aria-expanded="false"><span class="dom-glow" aria-hidden="true"></span><span class="dom-pic"></span></button>
    <button class="dom-recall" type="button" aria-label="Gọi Đốm" hidden><span></span>Gọi Đốm</button>`;
  document.body.appendChild(dock);
  const btn = dock.querySelector('.dom-btn'), pic = dock.querySelector('.dom-pic'), talkEl = dock.querySelector('.dom-talk'),
    panel = dock.querySelector('.dom-panel'), say = dock.querySelector('.dom-say'),
    menu = dock.querySelector('.dom-menu'), recall = dock.querySelector('.dom-recall');

  const MENU_ON = `
    <a href="/cong-cu" data-dom-go="/cong-cu"><b>Tìm công cụ phù hợp</b><span>Kho công cụ miễn phí cho việc văn phòng</span></a>
    <button type="button" data-dom-form="order"><b>Đề xuất công cụ / tính năng</b><span>Anh/chị đang “cày” việc gì lặp đi lặp lại?</span></button>
    <button type="button" data-dom-form="talk"><b>Gửi lời nhắn cho Tuấn</b><span>Góp ý, hỏi đáp, hẹn trò chuyện 1:1</span></button>
    <button type="button" class="dom-hide">Ẩn Đốm</button>`;
  const MENU_OFF = `
    <button type="button" class="dom-wake"><b>Bật đèn</b><span>Đánh thức Đốm và chuyển sang giao diện sáng</span></button>
    ${MENU_ON}`;

  function paintDock(pose) {
    const p = pose || (lampOn() ? POSE.idle : POSE.sleep);
    swapImg(pic, IMG(p, variant()));
    dock.classList.toggle('sleep', !lampOn() && !pose);
  }
  let talkTimer = 0;
  // ms = 0: lời thoại đứng yên, không tự ẩn (Đốm ở chỗ đứng)
  function talk(text, ms = HOLD, pose = POSE.hello) {
    if (dock.hidden || btn.hidden || !panel.hidden) return;
    clearTimeout(talkTimer);
    talkEl.textContent = text; talkEl.hidden = false; talkEl.classList.remove('out');
    paintDock(pose);
    if (ms) talkTimer = setTimeout(hush, reduce.matches ? Math.max(ms, 4000) : ms);
  }
  // Đốm ở chỗ đứng khi đèn sáng: luôn kèm lời thoại "Đốm vẫn ở đây…"; bấm Đốm/lời thoại mới mở hộp chọn
  function rest() { if (lampOn()) talk(LANDED, 0, POSE.idle); }
  function hush() {
    clearTimeout(talkTimer);
    if (talkEl.hidden) return;
    talkEl.classList.add('out');
    setTimeout(() => { talkEl.hidden = true; talkEl.classList.remove('out'); }, reduce.matches ? 0 : 260);
    paintDock();
  }
  talkEl.addEventListener('click', () => openPanel(true));   // bấm vào lời thoại = mở hộp chọn
  const HI = ['Đốm đây! Anh/chị cần Đốm giúp gì nào?', 'Ơi, Đốm nghe đây! Hôm nay mình tìm gì nhỉ?', 'Đốm luôn ở đây để hỗ trợ anh/chị!', 'Có việc lặp đi lặp lại nào làm anh/chị mệt không? Kể Đốm nghe!'];
  let hiN = 0;
  function openPanel(open) {
    if (open) hush();
    const was = !panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    if (!open && was) { paintDock(); rest(); }
    if (open) {
      say.textContent = lampOn() ? HI[hiN++ % HI.length] : 'Đốm đang ngủ… Anh/chị bật đèn giúp Đốm nhé?';
      if (lampOn()) { paintDock(POSE.hello); dock.classList.remove('poke'); void dock.offsetWidth; dock.classList.add('poke'); setTimeout(() => dock.classList.remove('poke'), 650); }
      menu.innerHTML = lampOn() ? MENU_ON : MENU_OFF;
    }
  }
  function setHidden(h) {
    store.set('qtt-dom-an', h ? '1' : null);
    openPanel(false); hush();
    btn.hidden = h; recall.hidden = !h;
    if (!h) rest();
  }
  btn.addEventListener('click', () => openPanel(panel.hidden));
  recall.addEventListener('click', () => setHidden(false));
  dock.addEventListener('click', e => {
    if (e.target.closest('.dom-hide')) { setHidden(true); return; }
    if (e.target.closest('.dom-close')) { openPanel(false); paintDock(); return; }
    if (e.target.closest('.dom-wake')) { openPanel(false); pullCord(); return; }
    const go = e.target.closest('[data-dom-go]');
    if (go) { e.preventDefault(); e.stopPropagation(); openPanel(false); navigate(go.dataset.domGo); return; }
    const f = e.target.closest('[data-dom-form]');
    if (f) { openPanel(false); openForm(f.dataset.domForm); }
  });

  /* ---------- chuyển trang qua bộ định tuyến của app.js (popstate) ---------- */
  function navigate(href) {
    const same = location.pathname.replace(/\/+$/, '') === href && !location.search;
    if (!same) { history.pushState(null, '', href); dispatchEvent(new PopStateEvent('popstate')); }
    scrollTo({ top: 0, behavior: same ? 'smooth' : 'auto' });
  }

  /* ---------- popup form: Đề xuất (1 form chung) + Gửi lời nhắn ---------- */
  let SITE = null;
  const getSite = () => SITE ? Promise.resolve(SITE)
    : fetch('/api/site').then(r => r.json()).then(d => (SITE = { settings: d.settings || {}, tools: d.tools || [] })).catch(() => ({ settings: {}, tools: [] }));
  const modal = document.createElement('div');
  modal.className = 'dom-modal'; modal.hidden = true;
  document.body.appendChild(modal);
  // Đốm nằm nửa trên nền tối mờ của popup → luôn dùng bản "toi"
  const ART = pose => `<div class="dom-m-art" aria-hidden="true"><img src="${IMG(pose, 'toi')}" alt=""></div>`;
  const ROLES = ['Kế toán', 'Hành chính – nhân sự', 'Bán hàng online', 'Chủ cơ sở, chủ spa', 'Quản lý, chủ doanh nghiệp', 'Khác'];
  const SUGGEST_FORM = (open, tools, pre, about) => open ? `<form class="cf-form dom-f" data-kind="order" novalidate>
      <label for="dm-o-ref">Anh/chị muốn đề xuất<select id="dm-o-ref"><option value="">🆕 Một công cụ mới</option>${tools.map(t => `<option value="${esc(t.slug)}" ${t.slug === pre ? 'selected' : ''}>➕ Thêm tính năng cho: ${esc(t.name)}</option>`).join('')}</select></label>
      <label for="dm-o-pain">Kể Đốm nghe việc anh/chị muốn được giúp<textarea id="dm-o-pain" rows="4" required minlength="10" placeholder="VD: Mỗi tháng em gộp 12 file chấm công thành 1 bảng, mất trọn buổi chiều…">${about ? esc('Về ý tưởng “' + about + '”: ') : ''}</textarea></label>
      <div class="bg-two"><label for="dm-o-role">Anh/chị đang làm<select id="dm-o-role">${ROLES.map(r => `<option>${r}</option>`).join('')}</select></label>
      <label for="dm-o-contact">Zalo hoặc email – để Đốm báo tin khi xong<input id="dm-o-contact" placeholder="Không bắt buộc"></label></div>
      <input type="text" id="dm-o-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="bg-priv">Đốm chỉ dùng liên hệ để báo tin, không hiện trên Bảng ghim.</p>
      <div class="bg-send"><button type="submit">Gửi cho Đốm</button><p class="dom-msg" role="status"></p></div></form>`
    : '<p class="hand cf-off">Đốm đang tạm nghỉ nhận đề xuất, anh/chị quay lại sau nhé.</p>';
  const BOOK_FORM = open => open ? `<form class="cf-form dom-f" data-kind="book" novalidate>
      <div class="bg-two"><label for="dm-b-name">Tên anh/chị<input id="dm-b-name" required placeholder="Nguyễn Văn A"></label>
      <label for="dm-b-contact">Số điện thoại, Zalo hoặc email<input id="dm-b-contact" required></label></div>
      <label for="dm-b-topic">Muốn trao đổi về<select id="dm-b-topic"><option>Setup vận hành, quy trình</option><option>Nhân sự, cơ chế thu nhập</option><option>Setup, vận hành spa</option><option>Ứng dụng AI, công cụ</option><option>Khác</option></select></label>
      <label for="dm-b-desc">Tình huống cụ thể<textarea id="dm-b-desc" rows="4" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
      <label class="cf-check"><input type="checkbox" id="dm-b-consent"> Tôi đồng ý để Tuấn lưu thông tin này và liên hệ lại.</label>
      <input type="text" id="dm-b-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="bg-send"><button type="submit">Gửi lời hẹn</button><p class="dom-msg" role="status"></p></div></form>`
    : '<p class="hand cf-off">Hiện tạm ngừng nhận lịch trò chuyện.</p>';
  let lastFocus = null;
  async function openForm(kind, opt = {}) {
    lastFocus = document.activeElement;
    hush(); openPanel(false);
    const { settings: s, tools } = await getSite();
    const live = tools.filter(t => t.status === 'ok').concat(tools.filter(t => t.status !== 'ok'));
    const ordersOpen = String(s.forms_open) === '1' || s.forms_open === true, bookOpen = String(s.booking_open) === '1' || s.booking_open === true;
    const pre = opt.tool || '', preTool = tools.find(t => t.slug === pre);
    const head = kind === 'order'
      ? `<p class="mono">Đề xuất cho Đốm</p><h2 class="dom-m-title" id="dom-m-t">${preTool ? 'Công cụ này cần thêm gì nữa?' : 'Anh/chị đang “cày” việc gì lặp đi lặp lại?'}</h2>
         <p class="dom-m-lead">${preTool ? `Kể Đốm nghe tính năng anh/chị mong có ở <b>${esc(preTool.name)}</b>. Nhiều người cùng cần, Đốm nhắc anh Tuấn làm trước!` : 'Kể Đốm nghe một chút. Việc nào nhiều người cùng khổ, Đốm nhắc anh Tuấn thắp đèn làm trước. Có công cụ rồi, Đốm báo ngay!'}</p>`
      : `<p class="mono">Tách cà phê</p><h2 class="dom-m-title" id="dom-m-t">Ngồi lại trò chuyện</h2>
         <div class="cf-tabs" role="tablist"><button type="button" role="tab" data-dm-tab="hen" aria-selected="true">Hẹn trò chuyện 1:1</button><button type="button" role="tab" data-dm-tab="cong-cu" aria-selected="false">Tôi cần một công cụ</button></div>`;
    const body = kind === 'order' ? SUGGEST_FORM(ordersOpen, live, pre, opt.about)
      : `<div class="dom-m-pane" data-pane="hen">${BOOK_FORM(bookOpen)}</div><div class="dom-m-pane" data-pane="cong-cu" hidden>${SUGGEST_FORM(ordersOpen, live, '', '')}</div>`;
    modal.innerHTML = `<div class="dom-m-dim" data-dm-close></div>
      <div class="dom-m-card" role="dialog" aria-modal="true" aria-labelledby="dom-m-t">${ART(kind === 'order' ? POSE.paper : POSE.hello)}
        <button type="button" class="dom-m-x" data-dm-close aria-label="Đóng">×</button>
        <div class="dom-m-head">${head}</div>${body}</div>`;
    modal.hidden = false;
    document.documentElement.classList.add('dom-lock');
    setTimeout(() => { const t = modal.querySelector('.dom-m-card textarea, .dom-m-card input:not(.hp)'); if (t) { t.focus(); if (t.tagName === 'TEXTAREA') t.setSelectionRange(t.value.length, t.value.length); } }, 60);
  }
  window.Dom = Object.assign(window.Dom || {}, { suggest: (tool, about) => openForm('order', { tool, about }), talk });
  function closeForm() {
    if (modal.hidden) return;
    modal.hidden = true; modal.innerHTML = '';
    document.documentElement.classList.remove('dom-lock');
    lastFocus?.focus?.();
    if (!dock.hidden && !btn.hidden) rest();
  }
  // Mọi nút có data-suggest trên web (Bộ công cụ, popup công cụ, Bảng ghim, Tách cà phê) mở cùng 1 form
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-suggest]'); if (!b) return;
    e.preventDefault(); openForm('order', { tool: b.dataset.suggest || '', about: b.dataset.about || '' });
  });
  modal.addEventListener('click', e => {
    if (e.target.closest('[data-dm-close]')) { closeForm(); return; }
    const t = e.target.closest('[data-dm-tab]');
    if (t) {
      modal.querySelectorAll('[data-dm-tab]').forEach(x => x.setAttribute('aria-selected', String(x === t)));
      modal.querySelectorAll('.dom-m-pane').forEach(p => { p.hidden = p.dataset.pane !== t.dataset.dmTab; });
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) { e.stopPropagation(); closeForm(); } }, true);
  modal.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const f = [...modal.querySelectorAll('button,input:not(.hp),select,textarea,a[href]')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // gửi form riêng của popup (chặn không cho app.js xử lý nhầm form trên trang)
  modal.addEventListener('submit', async e => {
    e.preventDefault(); e.stopPropagation();
    const f = e.target, sb = f.querySelector('button[type=submit]'), msg = f.querySelector('.dom-msg'), v = id => f.querySelector('#' + id);
    const order = f.dataset.kind === 'order';
    const body = order
      ? { pain: v('dm-o-pain').value, role: v('dm-o-role').value, contact: v('dm-o-contact').value, tool_ref: v('dm-o-ref').value, website: v('dm-o-web').value }
      : { name: v('dm-b-name').value, contact: v('dm-b-contact').value, topic: v('dm-b-topic').value, description: v('dm-b-desc').value, consent: v('dm-b-consent').checked, website: v('dm-b-web').value };
    sb.disabled = true; msg.className = 'dom-msg note'; msg.textContent = 'Đốm đang chạy đi gửi…';
    try {
      const r = await fetch('/api/' + (order ? 'requests' : 'bookings'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Có lỗi, anh/chị thử lại giúp Đốm nhé.');
      f.reset(); msg.className = 'dom-msg toast';
      msg.textContent = order ? 'Đốm nhận rồi! Anh Tuấn sẽ đọc kỹ và ghim lên Bảng ghim khi đã rõ việc.' : 'Đốm đã chuyển lời. Anh Tuấn sẽ liên hệ lại sớm!';
      const art = modal.querySelector('.dom-m-art img'); if (art) art.src = IMG(POSE.thanks, 'toi');
      paintDock(POSE.happy); setTimeout(() => paintDock(), 4000);
    } catch (err) { msg.className = 'dom-msg err'; msg.textContent = err.message; }
    sb.disabled = false;
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { openPanel(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!panel.hidden && !dock.contains(e.target)) openPanel(false); });

  function pullCord() {
    const c = document.querySelector('[data-lamp-cord],[data-lamp-toggle]');
    if (c) c.click();
  }
  function showDock(show) {
    dock.hidden = !show; dock.classList.toggle('on-home', isHome());
    if (show) { const h = store.get('qtt-dom-an') === '1'; btn.hidden = h; recall.hidden = !h; paintDock(); }
    else { openPanel(false); hush(); }
  }

  /* ---------- Đốm trên đèn ở trang chủ ---------- */
  let perch = null, bubble = null, busy = false;
  function buildPerch() {
    const photo = document.querySelector('.photo-room .photo');
    bubble?.remove(); perch = bubble = null;
    if (!photo || mobile.matches) return false;
    perch = document.createElement('button');
    perch.type = 'button'; perch.className = 'dom-perch';
    perch.innerHTML = `<span class="dom-pic"></span><span class="dom-tip"></span>`;
    bubble = document.createElement('div');
    bubble.className = 'dom-bubble'; bubble.hidden = true;
    bubble.innerHTML = `<p>Đèn sáng rồi! ${TALK}</p>
      <div class="dom-bubble-cta"><a class="btn sm amber" href="/cong-cu" data-link>Xem bộ công cụ</a><button type="button" class="btn sm ghost dom-later">Để sau</button></div>`;
    photo.append(perch); document.body.appendChild(bubble);
    perch.addEventListener('click', () => { if (!lampOn()) pullCord(); else if (perch.dataset.state === 'greet') toDock().then(() => openPanel(true)); });
    bubble.querySelector('.dom-later').addEventListener('click', toDock);
    bubble.querySelector('a').addEventListener('click', () => { store.set('qtt-dom-chao', '1', sessionStorage); });
    return true;
  }
  // bong bóng lời chào đặt cạnh Đốm, không tràn khỏi màn hình
  function placeBubble() {
    if (!perch || !bubble || bubble.hidden) return;
    const r = perch.getBoundingClientRect(), bw = bubble.offsetWidth, gap = 8;
    let left = Math.min(r.right + r.width * .25, innerWidth - 16) - bw;
    bubble.style.left = Math.max(12, left) + 'px';
    bubble.style.top = (r.bottom - r.height * .12 + gap) + 'px';
  }
  addEventListener('resize', placeBubble);
  addEventListener('scroll', () => { if (bubble && !bubble.hidden && scrollY > 120) toDock(); }, { passive: true });
  function perchState(state, pose) {
    if (!perch) return;
    perch.dataset.state = state;
    swapImg(perch.querySelector('.dom-pic'), IMG(pose, 'toi'));
    const tip = perch.querySelector('.dom-tip');
    tip.textContent = state === 'sleep' ? 'Kéo dây bật đèn để đánh thức Đốm' : '';
    perch.setAttribute('aria-label', state === 'sleep' ? 'Đốm đang ngủ. Bấm để bật đèn' : 'Đốm');
    perch.tabIndex = state === 'gone' ? -1 : 0;
  }
  let greetTimer = 0;
  async function greet(fromDark) {
    if (!perch || busy) return;
    busy = true; showDock(false);
    if (fromDark) { perchState('burst', POSE.burst); await wait(1300); }
    if (!lampOn() || !perch) { busy = false; return; }   // đèn đã tắt lại trong lúc bừng sáng
    perchState('greet', POSE.hello);
    await wait(650);
    if (perch?.dataset.state !== 'greet' || !lampOn()) { busy = false; return; }
    bubble.hidden = false; placeBubble();
    busy = false;
    clearTimeout(greetTimer);
    greetTimer = setTimeout(toDock, HOLD);
  }
  // bay từ đèn xuống chỗ đứng của Đốm, theo đường cong (lên nhẹ rồi lượn xuống)
  async function toDock() {
    clearTimeout(greetTimer);
    store.set('qtt-dom-chao', '1', sessionStorage);
    if (!perch || perch.dataset.state === 'gone') { showDock(true); return; }
    bubble.hidden = true;
    const from = perch.getBoundingClientRect();
    showDock(true); dock.classList.add('arriving');
    const to = btn.getBoundingClientRect();
    if (!reduce.matches && from.width && document.body.animate) {
      const fly = document.createElement('img');
      fly.className = 'dom-fly'; fly.src = IMG(POSE.happy, 'toi');
      Object.assign(fly.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
      document.body.appendChild(fly);
      perchState('gone', POSE.idle);
      const dx = to.left - from.left, dy = to.top - from.top, k = to.width / from.width;
      const a = fly.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx * .35}px, ${Math.min(-40, dy * .1)}px) scale(${1 + (k - 1) * .35}) rotate(-14deg)`, offset: .35 },
        { transform: `translate(${dx * .8}px, ${dy * .75}px) scale(${1 + (k - 1) * .85}) rotate(8deg)`, offset: .75 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(0deg)` },
      ], { duration: 1100, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
      await new Promise(r => { a.onfinish = r; setTimeout(r, 1300); });
      fly.remove();
    } else perchState('gone', POSE.idle);
    dock.classList.remove('arriving');
    dock.classList.add('landed'); setTimeout(() => dock.classList.remove('landed'), 700);
    if (!btn.hidden && panel.hidden) rest();   // về chỗ đứng: hiện Đốm + lời thoại bên ngoài (không ẩn); bấm vào mới mở hộp chọn
  }

  /* ---------- theo dõi đổi trang + đổi đèn ---------- */
  const firstTalk = () => {
    if (store.get('qtt-dom-noi', sessionStorage) === '1' || !lampOn()) return;
    store.set('qtt-dom-noi', '1', sessionStorage);
    setTimeout(() => talk(TALK), 700);
  };
  function onRoute() {
    clearTimeout(greetTimer); busy = false;
    closeForm(); hush();
    if (!isHome()) { bubble?.remove(); perch = bubble = null; }
    if (document.querySelector('.dom-lost')) { showDock(false); return; }   // trang 404 đã có Đốm riêng
    if (isHome() && buildPerch()) {
      if (!lampOn()) { showDock(false); perchState('sleep', POSE.sleep); }
      else if (store.get('qtt-dom-chao', sessionStorage) !== '1') { store.set('qtt-dom-noi', '1', sessionStorage); perchState('greet', POSE.hello); greet(false); }
      else { perchState('gone', POSE.idle); showDock(true); rest(); }
      return;
    }
    showDock(true);
    if (isHome() && mobile.matches && lampOn() && store.get('qtt-dom-chao', sessionStorage) !== '1') {
      store.set('qtt-dom-chao', '1', sessionStorage); store.set('qtt-dom-noi', '1', sessionStorage);
      setTimeout(() => talk(TALK), 500);
      setTimeout(rest, 500 + HOLD + 300);
      return;
    }
    rest();
  }
  let lastLamp = lampOn();
  async function onLamp() {
    const on = lampOn();
    if (on === lastLamp) return;
    lastLamp = on;
    if (perch && isHome()) {
      if (!on) { clearTimeout(greetTimer); bubble.hidden = true; showDock(false); perchState('sleep', POSE.sleep); }
      else greet(true);
      return;
    }
    if (dock.hidden) return;
    openPanel(false); hush();
    if (on && !btn.hidden) { paintDock(POSE.burst); dock.classList.add('burst'); await wait(1300); dock.classList.remove('burst'); rest(); return; }
    paintDock();
  }
  new MutationObserver(onLamp).observe(root, { attributes: true, attributeFilter: ['data-lamp'] });
  const site = document.getElementById('site');
  if (site) new MutationObserver(() => { if (!site.querySelector(':scope > .loading')) onRoute(); }).observe(site, { childList: true });
  // app.js có thể đã vẽ trang trước khi file này chạy (dữ liệu về nhanh) → tự bắt nhịp ngay
  if (site && site.children.length && !site.querySelector(':scope > .loading')) onRoute();
  mobile.addEventListener?.('change', onRoute);
})();
