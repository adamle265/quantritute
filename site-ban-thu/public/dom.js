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
    <a href="/cong-cu" data-link><b>Tìm công cụ phù hợp</b><span>Kho công cụ miễn phí cho việc văn phòng</span></a>
    <a href="/cong-cu#dat-hang" data-link data-dom-hash="dat-hang"><b>Đề xuất công cụ mới</b><span>Anh/chị đang mất thời gian vì việc gì?</span></a>
    <a href="/tach-ca-phe" data-link><b>Gửi lời nhắn cho Tuấn</b><span>Góp ý, hỏi đáp, mời một tách cà phê</span></a>
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
    const a = e.target.closest('a[data-link]');
    if (a) {
      openPanel(false);
      const h = a.dataset.domHash;
      if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth' }), 350);
    }
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
  if (site) new MutationObserver(() => { if (!site.querySelector('.loading')) onRoute(); }).observe(site, { childList: true });
  mobile.addEventListener?.('change', onRoute);
})();
