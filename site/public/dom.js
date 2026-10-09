/* Đốm – linh vật đồng hành của Quản trị tử tế (bản thử v1).
   Chạy độc lập với app.js: tự theo dõi đổi trang (#site) và đổi đèn (html[data-lamp]).
   Ảnh: /assets/dom/dom-<mã>-<toi|sang>.webp  (toi = cho nền tối, sang = cho nền sáng) */
(() => {
  'use strict';
  const root = document.documentElement;
  const IMG = (code, v) => `/assets/dom/dom-${code}-${v}.webp`;
  const POSE = { idle: '07-nghi', sleep: '12-ngu', hello: '01-chao', burst: '19-hoan-thanh', happy: '10-vui' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const store = {
    get: (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } },
    set: (k, v, s = localStorage) => { try { v == null ? s.removeItem(k) : s.setItem(k, v); } catch (e) { } },
  };
  const lampOn = () => root.dataset.lamp !== 'off';
  const isHome = () => (location.pathname.replace(/\/+$/, '') || '/') === '/';
  const wait = ms => new Promise(r => setTimeout(r, reduce.matches ? 0 : ms));
  // trên trang chủ nền ảnh luôn tối → dùng bản "toi"; các trang khác theo đèn
  const variant = () => (isHome() || !lampOn()) ? 'toi' : 'sang';

  /* ---------- nút Đốm nổi (góc phải dưới) ---------- */
  const dock = document.createElement('div');
  dock.className = 'dom-dock';
  dock.hidden = true;
  dock.innerHTML = `
    <div class="dom-panel" role="dialog" aria-label="Đốm giúp gì được anh/chị?" hidden>
      <p class="dom-say"></p>
      <div class="dom-menu"></div>
    </div>
    <button class="dom-btn" type="button" aria-label="Đốm – trợ lý của Quản trị tử tế" aria-expanded="false">
      <img class="dom-img" alt="" width="256" height="256"></button>
    <button class="dom-recall" type="button" aria-label="Gọi Đốm" hidden><span></span>Gọi Đốm</button>`;
  document.body.appendChild(dock);
  const btn = dock.querySelector('.dom-btn'), img = dock.querySelector('.dom-img'),
    panel = dock.querySelector('.dom-panel'), say = dock.querySelector('.dom-say'),
    menu = dock.querySelector('.dom-menu'), recall = dock.querySelector('.dom-recall');

  const MENU_ON = `
    <a href="/cong-cu" data-dom-go="/cong-cu"><b>Tìm công cụ phù hợp</b><span>Kho công cụ miễn phí cho việc văn phòng</span></a>
    <button type="button" data-dom-form="order"><b>Đề xuất công cụ mới</b><span>Anh/chị đang mất thời gian vì việc gì?</span></button>
    <button type="button" data-dom-form="talk"><b>Gửi lời nhắn cho Tuấn</b><span>Góp ý, hỏi đáp, hẹn trò chuyện 1:1</span></button>
    <button type="button" class="dom-hide">Ẩn Đốm</button>`;
  const MENU_OFF = `
    <button type="button" class="dom-wake"><b>Bật đèn</b><span>Đánh thức Đốm và chuyển sang giao diện sáng</span></button>
    ${MENU_ON}`;

  function paintDock(pose) {
    const p = pose || (lampOn() ? POSE.idle : POSE.sleep);
    img.src = IMG(p, variant());
    dock.classList.toggle('sleep', !lampOn() && !pose);
  }
  function openPanel(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open);
    if (open) {
      say.textContent = lampOn() ? 'Đốm giúp gì được anh/chị?' : 'Đốm đang ngủ… Anh/chị bật đèn giúp Đốm nhé?';
      menu.innerHTML = lampOn() ? MENU_ON : MENU_OFF;
    }
  }
  function setHidden(h) {
    store.set('qtt-dom-an', h ? '1' : null);
    openPanel(false);
    btn.hidden = h; recall.hidden = !h;
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

  /* ---------- popup form: Đề xuất công cụ (giống form cuối trang Bộ công cụ) + Gửi lời nhắn (giống form cuối trang Tách cà phê) ---------- */
  let SETTINGS = null;
  const getSettings = () => SETTINGS ? Promise.resolve(SETTINGS)
    : fetch('/api/site').then(r => r.json()).then(d => (SETTINGS = d.settings || {})).catch(() => ({}));
  const modal = document.createElement('div');
  modal.className = 'dom-modal'; modal.hidden = true;
  document.body.appendChild(modal);
  // Đốm nằm nửa trên nền tối mờ của popup → luôn dùng bản "toi"
  const ART = `<div class="dom-m-art" aria-hidden="true"><img src="${IMG(POSE.hello, 'toi')}" alt=""></div>`;
  const ORDER_FORM = open => open ? `<form class="cf-form dom-f" data-kind="order" novalidate>
      <label for="dm-o-pain">Việc lặp lại bạn đang làm<textarea id="dm-o-pain" rows="4" required minlength="10" placeholder="Ví dụ: mỗi tháng mình phải gộp 12 file chấm công thành một bảng…"></textarea></label>
      <div class="bg-two"><label for="dm-o-role">Bạn làm vị trí<select id="dm-o-role"><option>Kế toán</option><option>Hành chính – nhân sự</option><option>Bán hàng online</option><option>Chủ cơ sở, chủ spa</option><option>Khác</option></select></label>
      <label for="dm-o-contact">Email hoặc Zalo (nếu muốn nhận tin khi có tool)<input id="dm-o-contact" placeholder="Không bắt buộc"></label></div>
      <input type="text" id="dm-o-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="bg-send"><button type="submit">Gửi đặt hàng</button><p class="dom-msg" role="status"></p></div></form>`
    : '<p class="hand cf-off">Hiện tạm ngừng nhận đề xuất công cụ.</p>';
  const BOOK_FORM = open => open ? `<form class="cf-form dom-f" data-kind="book" novalidate>
      <div class="bg-two"><label for="dm-b-name">Tên bạn<input id="dm-b-name" required placeholder="Nguyễn Văn A"></label>
      <label for="dm-b-contact">Số điện thoại, Zalo hoặc email<input id="dm-b-contact" required></label></div>
      <label for="dm-b-topic">Bạn cần trao đổi về<select id="dm-b-topic"><option>Setup vận hành, quy trình</option><option>Nhân sự, cơ chế thu nhập</option><option>Setup, vận hành spa</option><option>Ứng dụng AI, công cụ</option><option>Khác</option></select></label>
      <label for="dm-b-desc">Tình huống cụ thể<textarea id="dm-b-desc" rows="4" placeholder="Quy mô, vấn đề đang gặp, mong muốn…"></textarea></label>
      <label class="cf-check"><input type="checkbox" id="dm-b-consent"> Tôi đồng ý để Tuấn lưu thông tin này và liên hệ lại.</label>
      <input type="text" id="dm-b-web" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="bg-send"><button type="submit">Gửi lời hẹn</button><p class="dom-msg" role="status"></p></div></form>`
    : '<p class="hand cf-off">Hiện tạm ngừng nhận lịch trò chuyện.</p>';
  let lastFocus = null;
  async function openForm(kind) {
    lastFocus = document.activeElement;
    const s = await getSettings();
    const ordersOpen = String(s.forms_open) === '1' || s.forms_open === true, bookOpen = String(s.booking_open) === '1' || s.booking_open === true;
    const head = kind === 'order'
      ? `<p class="mono">Đặt hàng công cụ</p><h2 class="dom-m-title" id="dom-m-t">Bạn đang mất thời gian nhất vì việc gì?</h2><p class="dom-m-lead">Tuấn đọc từng yêu cầu và ưu tiên làm việc nhiều người cùng gặp.</p>`
      : `<p class="mono">Tách cà phê</p><h2 class="dom-m-title" id="dom-m-t">Ngồi lại trò chuyện</h2>
         <div class="cf-tabs" role="tablist"><button type="button" role="tab" data-dm-tab="hen" aria-selected="true">Hẹn trò chuyện 1:1</button><button type="button" role="tab" data-dm-tab="cong-cu" aria-selected="false">Tôi cần một công cụ</button></div>`;
    const body = kind === 'order' ? ORDER_FORM(ordersOpen)
      : `<div class="dom-m-pane" data-pane="hen">${BOOK_FORM(bookOpen)}</div><div class="dom-m-pane" data-pane="cong-cu" hidden>${ORDER_FORM(ordersOpen)}</div>`;
    modal.innerHTML = `<div class="dom-m-dim" data-dm-close></div>
      <div class="dom-m-card" role="dialog" aria-modal="true" aria-labelledby="dom-m-t">${ART}
        <button type="button" class="dom-m-x" data-dm-close aria-label="Đóng">×</button>
        <div class="dom-m-head">${head}</div>${body}</div>`;
    modal.hidden = false;
    document.documentElement.classList.add('dom-lock');
    setTimeout(() => modal.querySelector('.dom-m-card textarea, .dom-m-card input:not(.hp)')?.focus(), 60);
  }
  function closeForm() {
    if (modal.hidden) return;
    modal.hidden = true; modal.innerHTML = '';
    document.documentElement.classList.remove('dom-lock');
    lastFocus?.focus?.();
  }
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
    const f = e.target, btn = f.querySelector('button[type=submit]'), msg = f.querySelector('.dom-msg'), v = id => f.querySelector('#' + id);
    const order = f.dataset.kind === 'order';
    const body = order
      ? { pain: v('dm-o-pain').value, role: v('dm-o-role').value, contact: v('dm-o-contact').value, website: v('dm-o-web').value }
      : { name: v('dm-b-name').value, contact: v('dm-b-contact').value, topic: v('dm-b-topic').value, description: v('dm-b-desc').value, consent: v('dm-b-consent').checked, website: v('dm-b-web').value };
    btn.disabled = true; msg.className = 'dom-msg note'; msg.textContent = 'Đang gửi…';
    try {
      const r = await fetch('/api/' + (order ? 'requests' : 'bookings'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Có lỗi, vui lòng thử lại.');
      f.reset(); msg.className = 'dom-msg toast';
      msg.textContent = order ? 'Cảm ơn bạn! Tuấn đã nhận được đặt hàng.' : 'Cảm ơn bạn! Tuấn sẽ liên hệ lại sớm.';
      paintDock(POSE.happy); setTimeout(() => paintDock(), 4000);
    } catch (err) { msg.className = 'dom-msg err'; msg.textContent = err.message; }
    btn.disabled = false;
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
    else openPanel(false);
  }

  /* ---------- Đốm trên đèn ở trang chủ ---------- */
  let perch = null, bubble = null, busy = false;
  function buildPerch() {
    const photo = document.querySelector('.photo-room .photo');
    bubble?.remove(); perch = bubble = null;
    if (!photo || mobile.matches) return false;
    perch = document.createElement('button');
    perch.type = 'button'; perch.className = 'dom-perch';
    perch.innerHTML = `<img alt="" width="256" height="256"><span class="dom-tip"></span>`;
    bubble = document.createElement('div');
    bubble.className = 'dom-bubble'; bubble.hidden = true;
    bubble.innerHTML = `<p>Đèn sáng rồi! Đốm dẫn anh/chị xem bộ công cụ nhé.</p>
      <div class="dom-bubble-cta"><a class="btn sm amber" href="/cong-cu" data-link>Xem bộ công cụ</a><button type="button" class="btn sm ghost dom-later">Để sau</button></div>`;
    photo.append(perch); document.body.appendChild(bubble);
    perch.addEventListener('click', () => { if (!lampOn()) pullCord(); else if (perch.dataset.state === 'greet') toDock(); });
    bubble.querySelector('.dom-later').addEventListener('click', toDock);
    bubble.querySelector('a').addEventListener('click', () => store.set('qtt-dom-chao', '1', sessionStorage));
    return true;
  }
  // bong bóng lời chào đặt cạnh Đốm, không tràn khỏi màn hình
  function placeBubble() {
    if (!perch || !bubble || bubble.hidden) return;
    const r = perch.getBoundingClientRect(), bw = bubble.offsetWidth, gap = 8;
    // đặt ngay dưới Đốm, căn phải theo Đốm
    let left = Math.min(r.right + r.width * .25, innerWidth - 16) - bw;
    bubble.style.left = Math.max(12, left) + 'px';
    bubble.style.top = (r.bottom - r.height * .12 + gap) + 'px';
  }
  addEventListener('resize', placeBubble);
  addEventListener('scroll', () => { if (bubble && !bubble.hidden && scrollY > 120) toDock(); }, { passive: true });
  function perchState(state, pose) {
    if (!perch) return;
    perch.dataset.state = state;
    perch.querySelector('img').src = IMG(pose, 'toi');
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
    perchState('greet', POSE.hello);
    await wait(650);
    if (perch?.dataset.state !== 'greet') { busy = false; return; }
    bubble.hidden = false; placeBubble();
    busy = false;
    clearTimeout(greetTimer);
    greetTimer = setTimeout(toDock, 9000);
  }
  // bay từ đèn về góc phải dưới
  async function toDock() {
    clearTimeout(greetTimer);
    store.set('qtt-dom-chao', '1', sessionStorage);
    if (!perch || perch.dataset.state === 'gone') { showDock(true); return; }
    bubble.hidden = true;
    const from = perch.getBoundingClientRect();
    showDock(true); dock.classList.add('arriving');
    const to = btn.getBoundingClientRect();
    if (!reduce.matches && from.width) {
      const fly = document.createElement('img');
      fly.className = 'dom-fly'; fly.src = IMG(POSE.happy, 'toi');
      Object.assign(fly.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
      document.body.appendChild(fly);
      perchState('gone', POSE.idle);
      fly.getBoundingClientRect();
      fly.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;
      await wait(950);
      fly.remove();
    } else perchState('gone', POSE.idle);
    dock.classList.remove('arriving');
  }

  /* ---------- theo dõi đổi trang + đổi đèn ---------- */
  function onRoute() {
    clearTimeout(greetTimer); busy = false;
    closeForm();
    if (!isHome()) { bubble?.remove(); perch = bubble = null; }
    if (document.querySelector('.dom-lost')) { showDock(false); return; }   // trang 404 đã có Đốm riêng
    if (isHome() && buildPerch()) {
      if (!lampOn()) { showDock(false); perchState('sleep', POSE.sleep); }
      else if (store.get('qtt-dom-chao', sessionStorage) !== '1') { perchState('greet', POSE.hello); greet(false); }
      else { perchState('gone', POSE.idle); showDock(true); }
      return;
    }
    if (isHome() && mobile.matches && lampOn() && store.get('qtt-dom-chao', sessionStorage) !== '1') {
      showDock(true); store.set('qtt-dom-chao', '1', sessionStorage);
      paintDock(POSE.hello); openPanel(true);
      say.textContent = 'Chào anh/chị! Đốm dẫn anh/chị xem bộ công cụ nhé.';
      menu.innerHTML = '<div class="dom-bubble-cta"><a class="btn sm amber" href="/cong-cu" data-link>Xem bộ công cụ</a><button type="button" class="btn sm ghost dom-close">Để sau</button></div>';
      clearTimeout(greetTimer); greetTimer = setTimeout(() => { openPanel(false); paintDock(); }, 9000);
      return;
    }
    showDock(true);
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
    openPanel(false);
    if (on && !btn.hidden) { paintDock(POSE.burst); dock.classList.add('burst'); await wait(1300); dock.classList.remove('burst'); }
    paintDock();
  }
  new MutationObserver(onLamp).observe(root, { attributes: true, attributeFilter: ['data-lamp'] });
  const site = document.getElementById('site');
  if (site) new MutationObserver(() => { if (!site.querySelector(':scope > .loading')) onRoute(); }).observe(site, { childList: true });
  mobile.addEventListener?.('change', onRoute);
})();
