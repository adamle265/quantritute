  /* ---------- Hành trình: lịch bóc (v1.7) ---------- */
  const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const pad2 = n => String(n).padStart(2, '0');
  const dayNoOf = e => { const m = String(e.no || '').match(/\d+/); return m ? +m[0] : 0; };
  const dParts = iso => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
  const chapLines = e => lines(e.chapters).map(l => {
    const m = l.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s*[|–-]\s*(.+)$/);
    return m ? { t: (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]), at: (m[1] ? m[1] + ':' : '') + pad2(m[2]) + ':' + m[3], label: m[4] } : null;
  }).filter(Boolean);
  const toolOf = slug => slug ? (SITE.tools || []).find(t => t.slug === slug) : null;
  const HANG = '<svg class="lb-hang" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><path d="M8 30 L100 3 L192 30" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  function lbFront(e) {
    const p = dParts(e.publish_date), dn = dayNoOf(e), dt = p ? new Date(p.y, p.m - 1, p.d) : null, lu = p ? lunar(p.d, p.m, p.y) : null;
    return `<div class="lb-face lb-front${dt && dt.getDay() === 0 ? ' sun' : ''}">
      <div class="lb-perf" aria-hidden="true"></div>
      <div class="lb-row"><span>${p ? 'Tháng ' + pad2(p.m) + ' · ' + p.y : 'Hành trình'}</span><span>${lu ? 'Năm ' + canChi(lu[2]) : ''}</span></div>
      <p class="lb-kicker">Ngày</p>
      <p class="lb-num">${dn ? pad2(dn) : '··'}</p>
      ${dt ? `<p class="lb-wd">${WD[dt.getDay()]}<span>${pad2(p.d)} / ${pad2(p.m)} / ${p.y}</span></p>` : ''}
      <h2 class="lb-title">${esc(e.title)}</h2>
      ${lu || e.lesson ? `<div class="lb-bottom${lu ? '' : ' one'}">
        ${lu ? `<div class="lb-lunar"><span class="mono">Âm lịch</span><b>${pad2(lu[0])}</b><span>Tháng ${lu[1]}${lu[3] ? ' nhuận' : ''}</span></div>` : ''}
        ${e.lesson ? `<blockquote class="lb-lesson"><span class="mono">Bài học hôm nay</span><p class="hand">${esc(e.lesson)}</p></blockquote>` : ''}
      </div>` : ''}
    </div>`;
  }
  function lbBack(e) {
    const dn = dayNoOf(e), ch = chapLines(e), tool = toolOf(e.tool_slug);
    return `<div class="lb-face lb-back">
      <div class="lb-perf" aria-hidden="true"></div>
      <div class="lb-row"><span>${dn ? 'Ngày ' + pad2(dn) : 'Hành trình'}</span><span>${e.publish_date ? date(e.publish_date) : ''}</span></div>
      <h2 class="lb-btitle">${esc(e.title)}</h2>
      ${e.yt ? `<div class="video lb-video" data-yt="${esc(e.yt)}"><button type="button" class="lb-thumb" aria-label="Phát video"><img src="https://i.ytimg.com/vi/${esc(e.yt)}/hqdefault.jpg" alt="" loading="lazy"><span class="lb-play" aria-hidden="true"></span></button></div>` : ''}
      ${ch.length ? `<ol class="lb-chaps">${ch.map(c => `<li><button type="button" data-t="${c.t}"><span class="mono">${c.at}</span><span>${esc(c.label)}</span></button></li>`).join('')}</ol>` : ''}
      ${e.problem ? `<div class="lb-blk"><p class="mono">Vấn đề đã giải quyết</p><p>${esc(e.problem)}</p></div>` : ''}
      ${tool ? `<a class="lb-tool g-${esc(tool.grp)}" href="/cong-cu/${esc(tool.slug)}" data-link>${icon(tool.icon)}<span><span class="mono">Công cụ làm ra hôm nay</span><b>${esc(tool.name)}</b></span><span class="lb-arr" aria-hidden="true">→</span></a>` : ''}
      ${e.summary ? `<div class="lb-blk"><p class="mono">Ghi chép</p><div class="prose">${md(e.summary)}</div></div>` : ''}
      ${(e.shorts || []).length ? `<div class="lb-blk"><p class="mono">Video ngắn</p><div class="lb-shorts">${e.shorts.map(v => v.yt
        ? `<a href="https://www.youtube.com/shorts/${esc(v.yt)}" target="_blank" rel="noopener" title="${esc(v.label || '')}"><img src="https://i.ytimg.com/vi/${esc(v.yt)}/hqdefault.jpg" alt="${esc(v.label || 'Video ngắn')}" loading="lazy"></a>`
        : `<a class="txt" href="${esc(safeUrl(v.url))}" target="_blank" rel="noopener">${esc(v.label || 'Xem')}</a>`).join('')}</div></div>` : ''}
    </div>`;
  }
  const lbMini = (e, i) => { const p = dParts(e.publish_date);
    return `<button type="button" class="lb-mini" data-i="${i}"><span class="mm">${p ? pad2(p.d) + '/' + pad2(p.m) : '&nbsp;'}</span><b>${pad2(dayNoOf(e) || i + 1)}</b><span class="t">${esc(e.title)}</span></button>`; };
  const lbNext = n => { const p = dParts(n.publish_date), dn = dayNoOf(n);
    return `<div class="lb-mini next"><span class="mm">${p ? pad2(p.d) + '/' + pad2(p.m) : '&nbsp;'}</span><b>${dn ? pad2(dn) : '··'}</b><span class="t">${esc(n.title)}</span><span class="soon">Sắp lên</span></div>`; };

  function journeyCal(box, eps, next) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, empty = !eps.length;
    const q = +new URLSearchParams(location.search).get('ngay');
    let idx = Math.max(0, eps.findIndex(e => q && dayNoOf(e) === q)), side = 'front', busy = false;
    box.innerHTML = `<div class="lb-pad">
        <div class="lb-board">${HANG}<span class="lb-nail" aria-hidden="true"></span><div class="lb-binding" aria-hidden="true"></div>
          <div class="lb-stackwrap"><div class="lb-under" aria-hidden="true"></div><div class="lb-sheet" tabindex="0" aria-live="polite"></div></div></div>
        ${empty ? '' : `<div class="lb-ctrl"><button type="button" data-act="newer">‹ Ngày sau</button><button type="button" data-act="flip"></button><button type="button" data-act="older">Bóc tờ ›</button></div><p class="lb-count mono"></p>`}
      </div>
      <aside class="lb-side"><p class="mono">Xấp lịch${empty ? '' : ' · ' + eps.length + ' tờ'}</p>
        <div class="lb-mini-grid">${next ? lbNext(next) : ''}${eps.map((e, i) => lbMini(e, i)).join('')}</div></aside>`;
    const sheet = box.querySelector('.lb-sheet'), $b = s => box.querySelector(s);
    const paint = url => {
      if (empty) { sheet.innerHTML = lbFront({ no: '1', title: 'Tờ lịch đầu tiên sắp được bóc', publish_date: next ? next.publish_date : '' }); sheet.classList.add('is-empty'); return; }
      const e = eps[idx];
      sheet.innerHTML = side === 'front' ? lbFront(e) : lbBack(e);
      sheet.classList.toggle('is-back', side === 'back');
      $b('[data-act=newer]').disabled = idx === 0;
      $b('[data-act=older]').disabled = idx === eps.length - 1;
      $b('[data-act=flip]').textContent = side === 'front' ? 'Lật mặt sau ↻' : '↺ Mặt trước';
      $b('.lb-count').textContent = `Tờ ${idx + 1} / ${eps.length}`;
      box.querySelectorAll('.lb-mini[data-i]').forEach(b => b.setAttribute('aria-current', String(+b.dataset.i === idx)));
      if (url) { const dn = dayNoOf(e); history.replaceState(null, '', '/hanh-trinh' + (dn ? '?ngay=' + pad2(dn) : '')); }
    };
    const go = ni => {
      if (busy || empty || ni < 0 || ni >= eps.length || ni === idx) return;
      const older = ni > idx;
      if (reduce || !sheet.animate) { idx = ni; side = 'front'; paint(true); return; }
      busy = true;
      if (older) {
        const g = sheet.cloneNode(true);
        g.className = 'lb-sheet lb-ghost'; g.removeAttribute('tabindex'); g.removeAttribute('aria-live'); g.style.height = sheet.offsetHeight + 'px';
        g.querySelectorAll('iframe').forEach(f => f.remove());
        sheet.parentNode.appendChild(g);
        idx = ni; side = 'front'; paint(true);
        g.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(10px,18px) rotate(3deg)', opacity: 1, offset: .35 }, { transform: 'translate(46px,120px) rotate(14deg)', opacity: 0 }],
          { duration: 620, easing: 'cubic-bezier(.45,0,.8,.4)' }).onfinish = () => { g.remove(); busy = false; };
      } else {
        idx = ni; side = 'front'; paint(true);
        sheet.animate([{ transform: 'translateY(-28px) rotate(-3deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { busy = false; };
      }
    };
    const flip = () => {
      if (busy || empty) return;
      const swap = () => { side = side === 'front' ? 'back' : 'front'; paint(); if (sheet.getBoundingClientRect().top < 0) sheet.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
      if (reduce || !sheet.animate) return swap();
      busy = true;
      sheet.animate([{ transform: 'perspective(1400px) rotateY(0)' }, { transform: 'perspective(1400px) rotateY(90deg)' }], { duration: 170, easing: 'ease-in' }).onfinish = () => {
        swap();
        sheet.animate([{ transform: 'perspective(1400px) rotateY(-90deg)' }, { transform: 'perspective(1400px) rotateY(0)' }], { duration: 210, easing: 'ease-out' }).onfinish = () => { busy = false; };
      };
    };
    const playAt = (v, t) => { v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.dataset.yt)}?autoplay=1&rel=0${t ? '&start=' + t : ''}" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`; };
    box.addEventListener('click', ev => {
      const a = ev.target.closest('[data-act]');
      if (a) { if (a.dataset.act === 'flip') flip(); else go(idx + (a.dataset.act === 'older' ? 1 : -1)); return; }
      const m = ev.target.closest('.lb-mini[data-i]');
      if (m) { go(+m.dataset.i); if (matchMedia('(max-width:860px)').matches) box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
      const th = ev.target.closest('.lb-thumb'); if (th) { playAt(th.closest('.lb-video'), 0); return; }
      const c = ev.target.closest('.lb-chaps [data-t]'); if (c) { const v = sheet.querySelector('.lb-video'); if (v) playAt(v, +c.dataset.t); return; }
      if (ev.target.closest('.lb-front') && !ev.target.closest('a,button')) flip();
    });
    sheet.addEventListener('keydown', ev => {
      if (ev.target !== sheet) return;
      if (ev.key === 'ArrowRight') { ev.preventDefault(); go(idx + 1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(idx - 1); }
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); }
    });
    let tx = 0, ty = 0;
    sheet.addEventListener('touchstart', ev => { tx = ev.touches[0].clientX; ty = ev.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', ev => {
      const dx = ev.changedTouches[0].clientX - tx, dy = ev.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    paint(false);
  }
