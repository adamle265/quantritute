/* Quản trị tử tế – bộ đếm công cụ (v1.11)
 * Chỉ gửi: tên thư mục công cụ + loại sự kiện (visit | use). KHÔNG gửi nội dung file, dữ liệu nhập hay thông tin cá nhân.
 * - visit: mở link công cụ (máy chủ tính mỗi người 1 lượt/ngày)
 * - use: mở, xem nội dung trong công cụ – mỗi lần bấm làm thay đổi nội dung đang xem, hoặc nạp file (máy chủ giới hạn 20 lượt/người/ngày)
 * Bản offline (mở file từ máy) không nạp được file này nên không đếm. Công cụ có thể gọi QTT.used() để báo 1 lượt dùng rõ ràng.
 */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;
  const m = location.pathname.match(/^\/tools\/([a-z0-9-]+)/i);
  if (!m) return;
  const tool = m[1].toLowerCase();
  const send = kind => {
    try {
      fetch('/api/hit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool, kind }), keepalive: true, credentials: 'omit' }).catch(() => { });
    } catch (e) { }
  };
  send('visit');

  let last = 0;
  const used = () => { const t = Date.now(); if (t - last < 4000) return; last = t; send('use'); };
  window.QTT = Object.assign(window.QTT || {}, { used });

  // Bấm vào một mục và nội dung trang thay đổi sau đó = mở/xem nội dung
  const PICK = 'a,button,summary,label,select,[onclick],[role=button],[role=tab],[role=link],[role=option],[tabindex]';
  document.addEventListener('click', e => {
    if (!e.isTrusted || !(e.target instanceof Element) || !e.target.closest(PICK)) return;
    let changed = false;
    const mo = new MutationObserver(() => { changed = true; });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(() => { mo.disconnect(); if (changed) used(); }, 700);
  }, true);
  // Nạp file vào công cụ cũng là dùng
  document.addEventListener('change', e => { if (e.target && e.target.type === 'file' && e.target.files && e.target.files.length) used(); }, true);
  document.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) setTimeout(used, 300); }, true);
})();
