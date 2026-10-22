/* Quản trị tử tế – Phân tích web (v1.20, 18/10/2026)
 * Gửi về /api/t (cùng tên miền) để xem ở Quản trị → Phân tích web. KHÔNG dùng cookie, KHÔNG gửi nội dung người dùng gõ hay nạp.
 * Ghi: trang đã xem, nguồn vào web, thời gian ở lại, độ cuộn, chữ trên nút được bấm, chuyển đổi (đăng ký, đề xuất, đặt lịch), tốc độ tải (LCP, INP, CLS, TTFB).
 * Phiên: mã ngẫu nhiên trong sessionStorage của tab, hết hạn sau 30 phút không thao tác.
 * Không đếm máy của anh: mở https://quantritute.com/?khong-dem=1 (bật lại: ?dem-lai=1).
 * Microsoft Clarity: chỉ nạp khi Quản trị có nhập mã dự án VÀ người dùng bấm "Đồng ý". Trang công cụ (/tools/…) không nạp Clarity.
 * Trang công cụ dùng /qtt-track.js (gọi window.QTTA nếu có, hoặc tự gửi lượt xem). */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol) || window.QTTA) return;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } } };
  const SS = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { } } };
  const qs = new URLSearchParams(location.search);
  if (qs.has('khong-dem')) LS.set('qtt-wa-off', '1');
  if (qs.has('dem-lai')) LS.set('qtt-wa-off', null);
  const OFF = LS.get('qtt-wa-off') === '1' || navigator.webdriver;

  const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return [...a].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 16); };
  /* ---------- phiên ---------- */
  const IDLE = 30 * 60000;
  let sid = SS.get('qtt-wa-sid'), last = +SS.get('qtt-wa-last') || 0, entry = false, handFrom = '';
  if (!sid) { // tab mới mở từ nút "Dùng online" (target=_blank, noopener) → nối tiếp phiên của tab cũ nếu vừa bấm trong 15 giây
    try { const h = JSON.parse(LS.get('qtt-wa-hand') || 'null'); if (h && h.sid && Date.now() - h.ts < 15000 && h.to === location.pathname) { sid = h.sid; last = Date.now(); SS.set('qtt-wa-sid', sid); handFrom = h.from || ''; } } catch (e) { }
    LS.set('qtt-wa-hand', null);
  }
  if (!sid || Date.now() - last > IDLE) { sid = rid(); entry = true; SS.set('qtt-wa-sid', sid); }
  const touch = () => SS.set('qtt-wa-last', String(Date.now()));
  touch();
  const ret = LS.get('qtt-wa-seen') === '1'; LS.set('qtt-wa-seen', '1');

  const send = body => {
    if (OFF) return;
    body.sid = sid;
    const s = JSON.stringify(body);
    try { if (navigator.sendBeacon && navigator.sendBeacon('/api/t', new Blob([s], { type: 'text/plain' }))) return; } catch (e) { }
    try { fetch('/api/t', { method: 'POST', body: s, keepalive: true, credentials: 'omit', headers: { 'content-type': 'text/plain' } }).catch(() => { }); } catch (e) { }
  };

  /* ---------- trang đang xem ---------- */
  const pathNow = () => location.pathname + (location.pathname.replace(/\/+$/, '') === '/goc-ngam' && qs2().get('phong') ? '?phong=' + qs2().get('phong') : '');
  const qs2 = () => new URLSearchParams(location.search);
  const norm = p => (p.replace(/\/+$/, '') || '/').toLowerCase();
  let cur = null, prevPath = handFrom, evq = [], firstLoad = true;
  const vit = { lcp: null, inp: null, cls: 0, ttfb: null };
  const scrollPct = () => { const h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight); return Math.min(100, Math.round((scrollY + innerHeight) / (max + innerHeight) * 100)); };
  let maxSc = 0, visStart = 0, visTotal = 0;
  const visOn = () => { if (!visStart && document.visibilityState === 'visible') visStart = performance.now(); };
  const visOff = () => { if (visStart) { visTotal += performance.now() - visStart; visStart = 0; } };

  function endView(final) {
    if (!cur) return;
    visOff();
    const b = { t: 'end', id: cur.id, p: cur.p, dur: Math.round(visTotal), sc: maxSc };
    if (cur.hard) { b.lcp = vit.lcp == null ? null : Math.round(vit.lcp); b.inp = vit.inp == null ? null : Math.round(vit.inp); b.cls = Math.round(vit.cls * 1000) / 1000; b.ttfb = vit.ttfb == null ? null : Math.round(vit.ttfb); }
    if (evq.length) { b.ev = evq; evq = []; }
    send(b);
    if (!final) { prevPath = cur.p; cur = null; }
  }
  function startView() {
    const p = pathNow();
    if (cur && norm(cur.p) === norm(p)) return;
    if (cur) endView(false);
    cur = { id: rid(), p, hard: firstLoad }; maxSc = scrollPct(); visTotal = 0; visStart = 0; visOn();
    const b = { t: 'pv', id: cur.id, p, prev: prevPath, vw: innerWidth, ret: ret ? 1 : 0 };
    if (entry) {
      entry = false; b.entry = 1;
      try { const r = document.referrer ? new URL(document.referrer) : null; if (r && r.host !== location.host) b.ref = r.origin + '/'; } catch (e) { }
      const u = qs2(); b.us = u.get('utm_source') || u.get('nguon') || ''; b.um = u.get('utm_medium') || ''; b.uc = u.get('utm_campaign') || '';
      if (!b.us && u.get('fbclid')) b.us = 'facebook';
      if (!b.us && u.get('zarsrc')) b.us = 'zalo';
    }
    firstLoad = false;
    send(b);
  }
  // ứng dụng 1 trang: theo dõi pushState/replaceState/popstate
  let navT;
  const onNav = () => { clearTimeout(navT); navT = setTimeout(startView, 250); };
  ['pushState', 'replaceState'].forEach(fn => { const o = history[fn]; history[fn] = function () { const r = o.apply(this, arguments); onNav(); return r; }; });
  addEventListener('popstate', onNav);

  addEventListener('scroll', () => { const s = scrollPct(); if (s > maxSc) maxSc = s; }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') endView(true); /* gửi tổng cộng dồn, máy chủ lấy MAX */ else { touch(); visOn(); } });
  addEventListener('pagehide', () => endView(true));

  /* ---------- nút được bấm ---------- */
  const label = el => {
    const t = el.getAttribute('data-track') || el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || (el.querySelector('img') && el.querySelector('img').alt) || '';
    return t.replace(/\s+/g, ' ').trim().slice(0, 60);
  };
  const target = el => {
    const h = el.getAttribute && el.getAttribute('href'); if (!h || h.startsWith('#') || h.startsWith('javascript')) return '';
    try { const u = new URL(h, location.href); return u.host === location.host ? u.pathname + (u.pathname === '/goc-ngam' && u.searchParams.get('phong') ? '?phong=' + u.searchParams.get('phong') : '') : u.host; } catch (e) { return ''; }
  };
  let nClick = 0;
  document.addEventListener('click', e => {
    touch();
    if (!e.isTrusted || !(e.target instanceof Element)) return;
    const el = e.target.closest('[data-track],a,button,[role=button],summary,[data-tool]'); if (!el || el.closest('[data-track-off]')) return;
    if (++nClick > 80) return;
    const n = label(el); if (!n && !target(el)) return;
    if (el.target === '_blank' && el.href) { try { const u = new URL(el.href); if (u.host === location.host) LS.set('qtt-wa-hand', JSON.stringify({ sid, ts: Date.now(), to: u.pathname, from: cur ? cur.p : '' })); } catch (e) { } }
    push({ k: 'click', n: n || target(el), to: target(el), p: cur ? cur.p : pathNow() });
  }, true);
  function push(ev) { evq.push(ev); if (evq.length >= 15 && cur) { send({ t: 'ev', p: cur.p, ev: evq }); evq = []; } }

  /* ---------- chuyển đổi: theo dõi các form gửi thành công lên /api ---------- */
  const CONV = [[/\/api\/subscribe\/?$/, 'Đăng ký nhận tin'], [/\/api\/requests\/?$/, 'Gửi đề xuất công cụ'], [/\/api\/bookings\/?$/, 'Đặt lịch trò chuyện'], [/\/api\/feedback\/?$/, 'Gửi góp ý'], [/\/api\/send-link\/?$/, 'Gửi link công cụ về email'], [/\/api\/board\/\d+/, 'Bấm "Tôi cũng cần"']];
  const of = window.fetch;
  if (of) window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '', m = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const p = of.apply(this, arguments);
    if (m === 'POST') { const c = CONV.find(([re]) => re.test(url)); if (c) p.then(r => { if (r && r.ok) { push({ k: 'conv', n: c[1], p: cur ? cur.p : pathNow() }); if (cur) { send({ t: 'ev', p: cur.p, ev: evq }); evq = []; } } }).catch(() => { }); }
    return p;
  };

  /* ---------- tốc độ tải đo trên máy người dùng ---------- */
  try {
    const nav = performance.getEntriesByType('navigation')[0]; if (nav) vit.ttfb = Math.max(0, nav.responseStart - nav.startTime);
    new PerformanceObserver(l => { const es = l.getEntries(); const e = es[es.length - 1]; if (e) vit.lcp = e.renderTime || e.loadTime || e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    let sv = 0, se = [];
    new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.hadRecentInput) continue; const f = se[0], la = se[se.length - 1]; if (se.length && (e.startTime - la.startTime > 1000 || e.startTime - f.startTime > 5000)) { sv = 0; se = []; } se.push(e); sv += e.value; if (sv > vit.cls) vit.cls = sv; } }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId && (vit.inp == null || e.duration > vit.inp)) vit.inp = e.duration; }).observe({ type: 'event', buffered: true, durationThreshold: 40 });
  } catch (e) { }

  /* ---------- API cho trang khác (trang công cụ) ---------- */
  window.QTTA = { ev: (k, n, to) => { if (['click', 'conv', 'tool_use'].includes(k)) push({ k, n: String(n || '').slice(0, 60), to: to || '', p: cur ? cur.p : pathNow() }); }, flush: () => { if (cur && evq.length) { send({ t: 'ev', p: cur.p, ev: evq }); evq = []; } } };

  startView();

  /* ---------- Microsoft Clarity (hỏi đồng ý) ---------- */
  function clarity(id) {
    if (!/^[a-z0-9]{6,20}$/i.test(id) || window.clarity || /^\/tools\//.test(location.pathname)) return;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', id);
  }
  function consentBar(id) {
    if (document.querySelector('.wa-consent')) return;
    const d = document.createElement('div'); d.className = 'wa-consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Đồng ý dùng cookie phân tích');
    d.setAttribute('data-track-off', '');
    d.innerHTML = '<p>Đốm muốn dùng <b>Microsoft Clarity</b> (có cookie) để xem anh/chị dùng web thế nào và làm web dễ dùng hơn. Chữ anh/chị gõ vào ô nhập luôn được che.</p><div><button type="button" class="wa-yes">Đồng ý</button><button type="button" class="wa-no">Không, cảm ơn</button></div>';
    const st = document.createElement('style');
    st.textContent = '.wa-consent{position:fixed;left:16px;bottom:16px;z-index:80;max-width:min(380px,calc(100vw - 32px));padding:14px 16px;border-radius:14px;background:var(--card,#F8F5EF);color:var(--ink,#231E19);border:1px solid var(--line,#D9D1C4);box-shadow:0 18px 40px rgba(0,0,0,.18);font-size:13.5px;line-height:1.5}.wa-consent p{margin:0 0 10px}.wa-consent div{display:flex;gap:8px;flex-wrap:wrap}.wa-consent button{border:1.5px solid var(--ink,#231E19);border-radius:999px;padding:5px 14px;font:inherit;font-weight:600;cursor:pointer;background:transparent;color:inherit}.wa-consent .wa-yes{background:var(--ink,#231E19);color:var(--card,#F8F5EF)}';
    d.prepend(st);
    d.addEventListener('click', e => { const y = e.target.closest('.wa-yes'), n = e.target.closest('.wa-no'); if (!y && !n) return; LS.set('qtt-clarity', y ? 'yes' : 'no'); d.remove(); if (y) clarity(id); });
    document.body.append(d);
  }
  if (!OFF && !/^\/tools\//.test(location.pathname)) fetch('/api/site').then(r => r.json()).then(d => {
    const id = (d && d.settings && d.settings.clarity_id || '').trim(); if (!id) return;
    const c = LS.get('qtt-clarity');
    if (c === 'yes') clarity(id); else if (c !== 'no') setTimeout(() => consentBar(id), 2500);
  }).catch(() => { });
})();
