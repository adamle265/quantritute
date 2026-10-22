/* Quản trị tử tế – v1.22 "Gửi link công cụ về email" (dùng chung cho trang khách và trang công cụ)
 * Vì sao: khách đến từ TikTok/Facebook chủ yếu bằng điện thoại, còn các công cụ làm file (hóa đơn, văn bản hàng loạt)
 * cần máy tính. Trên điện thoại, Đốm mời gửi link về email (hoặc sao chép link) để mở lại trên máy tính.
 * Chỉ áp dụng cho công cụ cần máy tính (DESKTOP). Email gửi qua /api/send-link (Resend), không lưu dữ liệu khác.
 */
(() => {
  'use strict';
  if (window.QTTSendLink) return;
  const DESKTOP = ['xu-ly-hoa-don', 'tao-van-ban-hang-loat'];
  const folderOf = u => { const m = String(u || '').match(/\/tools\/([a-z0-9-]+)/i); return m ? m[1].toLowerCase() : ''; };
  const isPhone = () => { try { return matchMedia('(pointer:coarse)').matches && Math.min(screen.width, innerWidth) < 820; } catch (e) { return false; } };
  const needs = u => isPhone() && DESKTOP.includes(folderOf(u));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ev = (k, n) => { try { window.QTTA && window.QTTA.ev(k, n); } catch (e) { } };
  const CSS = `.qsl-bg{position:fixed;inset:0;background:rgba(12,10,8,.55);z-index:2147483000;display:flex;align-items:flex-end;justify-content:center}
.qsl{background:#FBF8F2;color:#231E19;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:22px 20px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.25);font:15px/1.55 "Be Vietnam Pro","Segoe UI",system-ui,sans-serif;max-height:92vh;overflow:auto}
.qsl h3{font-size:18px;line-height:1.35;margin:0 0 6px;font-weight:700}.qsl p{margin:0 0 12px;color:#4A4038}
.qsl .qsl-ic{font-size:26px;line-height:1;margin-bottom:8px}
.qsl input[type=email]{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid #D3C7B4;border-radius:10px;background:#fff;color:#231E19}
.qsl input[type=email]:focus{outline:2px solid #C08B2C;border-color:#C08B2C}
.qsl label{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;color:#4A4038;margin:10px 0 4px}.qsl label input{margin-top:3px;width:18px;height:18px;flex:none}
.qsl .qsl-msg{min-height:20px;font-size:14px;margin:6px 0}.qsl .qsl-msg.bad{color:#A63A2B}.qsl .qsl-msg.ok{color:#2F7D4F}
.qsl button{font:inherit;font-weight:600;border-radius:10px;padding:12px 16px;cursor:pointer;width:100%;margin-top:8px}
.qsl .qsl-go{background:#C08B2C;color:#1a1208;border:0}.qsl .qsl-go:disabled{opacity:.6}
.qsl .qsl-copy{background:transparent;border:1.5px solid #D3C7B4;color:#231E19}
.qsl .qsl-skip{background:none;border:0;color:#6B6259;text-decoration:underline;font-weight:500;padding:8px}
@media (prefers-reduced-motion:no-preference){.qsl{animation:qslUp .22s ease-out}@keyframes qslUp{from{transform:translateY(30px);opacity:0}}}`;
  function open({ url, name, onSkip, skipText } = {}) {
    const link = new URL(url || location.href, location.origin); link.hash = '';
    const tool = folderOf(link.pathname);
    if (!document.getElementById('qsl-css')) { const st = document.createElement('style'); st.id = 'qsl-css'; st.textContent = CSS; document.head.append(st); }
    const bg = document.createElement('div'); bg.className = 'qsl-bg';
    bg.innerHTML = `<div class="qsl" role="dialog" aria-modal="true" aria-labelledby="qslT">
      <div class="qsl-ic" aria-hidden="true">💻</div>
      <h3 id="qslT">Công cụ này dùng thoải mái nhất trên máy tính</h3>
      <p>${name ? `<b>${esc(name)}</b> làm việc với file Excel, Word, XML nên cần máy tính. ` : ''}Anh/chị để lại email, em gửi link ngay để lúc ngồi máy tính mở ra dùng luôn ạ.</p>
      <form novalidate><input type="email" placeholder="Email của anh/chị" autocomplete="email" aria-label="Email nhận link công cụ" required>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <label><input type="checkbox"> <span>Báo cho tôi khi có công cụ mới (chỉ gửi khi có công cụ mới, hủy bất cứ lúc nào)</span></label>
        <p class="qsl-msg" role="status"></p>
        <button type="submit" class="qsl-go">Gửi link về email</button></form>
      <button type="button" class="qsl-copy">Sao chép link (dán vào Zalo "Cloud của tôi")</button>
      <button type="button" class="qsl-skip">${esc(skipText || 'Vẫn xem trên điện thoại')}</button></div>`;
    document.body.append(bg);
    const $ = s => bg.querySelector(s), msg = $('.qsl-msg'), btn = $('.qsl-go'), em = $('input[type=email]');
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    ev('click', 'Mời gửi link về email');
    $('.qsl-skip').addEventListener('click', () => { ev('click', 'Vẫn xem trên điện thoại'); close(); if (onSkip) onSkip(); });
    $('.qsl-copy').addEventListener('click', async () => {
      const u = link.href;
      try { await navigator.clipboard.writeText(u); msg.className = 'qsl-msg ok'; msg.textContent = 'Đã sao chép link. Anh/chị dán vào Zalo hoặc ghi chú để mở trên máy tính nhé.'; ev('click', 'Sao chép link công cụ'); }
      catch (e) { msg.className = 'qsl-msg'; msg.textContent = u; }
    });
    $('form').addEventListener('submit', async e => {
      e.preventDefault(); e.stopPropagation(); msg.className = 'qsl-msg';
      const email = em.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { msg.textContent = 'Email chưa đúng định dạng ạ.'; msg.classList.add('bad'); em.focus(); return; }
      btn.disabled = true; msg.textContent = 'Em đang gửi…';
      try {
        const r = await fetch('/api/send-link', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tool, email, subscribe: $('label input').checked, website: $('input[name=website]').value }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { msg.textContent = j.error || 'Chưa gửi được, anh/chị thử lại sau ạ.'; msg.classList.add('bad'); btn.disabled = false; return; }
        msg.classList.add('ok'); msg.textContent = j.message || 'Em đã gửi link vào email của anh/chị.';
        btn.textContent = 'Đã gửi ✓'; try { sessionStorage.setItem('qsl-done-' + tool, '1'); } catch (er) { }
      } catch (er) { msg.textContent = 'Chưa gửi được, anh/chị thử lại sau ạ.'; msg.classList.add('bad'); btn.disabled = false; }
    });
  }
  const seen = tool => { try { return !!(sessionStorage.getItem('qsl-done-' + tool) || sessionStorage.getItem('qsl-seen-' + tool)); } catch (e) { return false; } };
  const mark = tool => { try { sessionStorage.setItem('qsl-seen-' + tool, '1'); } catch (e) { } };
  window.QTTSendLink = { open, needs, isPhone, folderOf, seen, mark, DESKTOP };
})();
