/* Quản trị tử tế — Trò chơi (12/11/2026)
 * Menu "Trò chơi" → mỗi trò chơi 1 mục con (trang 'g-<slug>'). Mỗi trò chơi có 3 thẻ:
 *   Thiết lập   bật/tắt hiển thị trên Góc giải trí + lời giới thiệu
 *   Câu chuyện  sửa sự thật thú vị + câu chuyện của từng hình (bản gốc đọc từ /tro-choi/<slug>/du-lieu.json trên web khách)
 *   Báo cáo     lượt truy cập, lượt chơi, lượt ghép xong theo ngày
 * Máy chủ: src/games.js · Dùng chung tiện ích của admin.js qua window.QTT. */
(() => {
  'use strict';
  const Q = window.QTT;
  if (!Q) return;
  const { esc, api, toast } = Q;
  const $ = s => document.querySelector(s);
  const nf = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
  const dmy = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '–';
  const ddmm = d => d.slice(8, 10) + '/' + d.slice(5, 7);
  const dmyMs = ms => { if (!ms) return ''; const x = new Date(ms + 7 * 3600000).toISOString(); return `${x.slice(8, 10)}/${x.slice(5, 7)}/${x.slice(0, 4)}`; };
  const GAMES = [['tangram-viet', 'Tangram Việt']]; // thêm trò chơi mới: thêm 1 dòng ở đây + 1 mục con trong MENU (admin.js)
  const DIFF = { de: 'Dễ', vua: 'Vừa', kho: 'Khó', 1: 'Dễ', 2: 'Vừa', 3: 'Khó', easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };
  const st = { tab: 'set', days: 30, col: '', open: '' };
  const DEF = {}; // bản gốc theo trò chơi

  async function loadDefaults(g) {
    if (DEF[g.slug]) return DEF[g.slug];
    const base = Q.siteBase();
    const r = await fetch(base + (g.url || '/tro-choi/' + g.slug + '/').replace(/\/?$/, '/') + 'du-lieu.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('Chưa đọc được dữ liệu gốc của trò chơi trên web (du-lieu.json). Anh kiểm tra đã xuất bản trò chơi chưa.');
    return (DEF[g.slug] = await r.json());
  }
  const svgImg = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const outlineSvg = (pts, bg) => { if (!pts || !pts.length) return '';
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0 || 1, h = Math.max(...ys) - y0 || 1, pad = Math.max(w, h) * .08;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0 - pad} ${y0 - pad} ${w + 2 * pad} ${h + 2 * pad}"><polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${bg}"/></svg>`; };

  async function page(slug) {
    const d = await api(`games/${slug}?days=${st.days}`);
    const g = d.game;
    const head = `<div class="bar"><div><p class="mono">Trò chơi</p><h1>${esc(g.name)}</h1>
        <p class="note">${g.enabled ? '<span class="gm-on">● Đang bật</span> – hiện trên Góc giải trí' : '<span class="gm-off">● Đang tắt</span> – đã ẩn khỏi Góc giải trí, ai mở link trò chơi sẽ thấy thông báo tạm nghỉ'}</p></div>
        <div class="bar-r"><a class="btn ghost sm" href="${esc(Q.siteBase() + g.url)}" target="_blank" rel="noopener">Mở trò chơi ↗</a><a class="btn ghost sm" href="${esc(Q.siteBase())}/goc-giai-tri" target="_blank" rel="noopener">Xem Góc giải trí ↗</a></div></div>
      <nav class="ttabs gm-tabs">${[['set', 'Thiết lập'], ['story', 'Câu chuyện từng hình'], ['report', 'Báo cáo']].map(([k, l]) => `<button class="ttab" data-gtab="${k}" aria-current="${k === st.tab ? 'page' : 'false'}">${l}${k === 'story' && d.stories.length ? `<span class="gm-cnt">${d.stories.length} đã sửa</span>` : ''}</button>`).join('')}</nav>`;
    $('#main').innerHTML = head + '<div id="gm-body"><p class="note">Đang tải…</p></div>';
    $('#main').querySelectorAll('[data-gtab]').forEach(b => b.onclick = () => { st.tab = b.dataset.gtab; st.open = ''; page(slug); });
    const body = $('#gm-body');
    if (st.tab === 'set') return setTab(body, slug, g);
    if (st.tab === 'report') return reportTab(body, slug, d);
    try { await storyTab(body, slug, g, d.stories); } catch (e) { body.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  }

  /* ---------- Thiết lập ---------- */
  function setTab(body, slug, g) {
    body.innerHTML = `<div class="card panel gm-set">
        <div class="gm-sw-row"><div><h2>Hiển thị trên web</h2><p class="note">Tắt: trò chơi ẩn khỏi trang Góc giải trí, link trò chơi hiện thông báo tạm nghỉ, không đếm lượt. Thành tích người chơi đã lưu trên máy họ vẫn giữ nguyên.</p></div>
          <button type="button" class="gm-sw${g.enabled ? ' on' : ''}" id="gm-en" role="switch" aria-checked="${g.enabled ? 'true' : 'false'}"><i></i><span>${g.enabled ? 'Đang bật' : 'Đang tắt'}</span></button></div>
      </div>
      <form class="card panel form gm-set" id="gm-f" style="margin-top:16px"><h2>Hộp giới thiệu trên Góc giải trí</h2>
        <label>Tên trò chơi<input name="name" value="${esc(g.name)}" maxlength="80" required></label>
        <label>Câu giới thiệu ngắn <small class="note">(chữ viết tay màu cam dưới tên)</small><input name="tagline" value="${esc(g.tagline)}" maxlength="160"></label>
        <label>Điểm nổi bật <small class="note">(mỗi dòng 1 ý, hiện thành gạch đầu dòng)</small><textarea name="intro" rows="4" maxlength="1200">${esc(g.intro)}</textarea></label>
        <div class="gm-act"><button class="btn" type="submit">Lưu giới thiệu</button><span class="note">Web cập nhật sau khoảng 1 phút.</span></div>
      </form>`;
    $('#gm-en').onclick = async e => {
      const b = e.currentTarget, on = !b.classList.contains('on'); b.disabled = true;
      try { await api(`games/${slug}`, { method: 'PUT', body: JSON.stringify({ enabled: on ? 1 : 0 }) }); toast(on ? 'Đã bật – trò chơi hiện trên Góc giải trí.' : 'Đã tắt – trò chơi ẩn khỏi Góc giải trí.'); page(slug); }
      catch (err) { toast(err.message, true); b.disabled = false; }
    };
    $('#gm-f').onsubmit = async e => {
      e.preventDefault(); const f = new FormData(e.target);
      try { await api(`games/${slug}`, { method: 'PUT', body: JSON.stringify({ name: f.get('name'), tagline: f.get('tagline'), intro: f.get('intro') }) }); toast('Đã lưu giới thiệu.'); page(slug); }
      catch (err) { toast(err.message, true); }
    };
  }

  /* ---------- Câu chuyện từng hình ---------- */
  async function storyTab(body, slug, g, edited) {
    const def = await loadDefaults(g);
    const ed = Object.fromEntries(edited.map(r => [r.fig, r]));
    const cols = def.collections || [];
    const levels = def.levels || [];
    const list = levels.filter(l => !st.col || l.col === st.col || (st.col === '_ed' && ed[l.id]));
    const thumb = l => `<span class="gm-th">${l.illus ? `<img src="${svgImg(l.illus)}" alt="">` : ''}<img class="gm-ol" src="${svgImg(outlineSvg(l.outline, '#B06A22'))}" alt=""></span>`;
    const row = l => { const e = ed[l.id], open = st.open === l.id, story = e ? e.story : (l.story || []).join('\n\n'), fact = e ? e.fact : (l.fact || '');
      return `<div class="gm-fig${open ? ' open' : ''}${e ? ' edited' : ''}" data-fig="${esc(l.id)}">
        <button type="button" class="gm-fh" data-fopen="${esc(l.id)}">${thumb(l)}<span class="gm-fn"><b>${esc(l.name)}</b><small>${esc((cols.find(c => c.id === l.col) || {}).name || '')} · ${DIFF[l.diff] || esc(l.diff)}</small></span>
          <span class="gm-fs">${e ? `<span class="pill p-done">Đã sửa ${dmyMs(e.updated_at)}</span>` : '<span class="pill">Bản gốc</span>'}</span><span class="gm-fx">${open ? 'Thu gọn' : 'Sửa'}</span></button>
        ${open ? `<form class="form gm-ff" data-fsave="${esc(l.id)}">
          <div class="gm-ff-art">${l.illus ? `<img src="${svgImg(l.illus)}" alt="Tranh minh họa ${esc(l.name)}">` : ''}<img class="gm-ol" src="${svgImg(outlineSvg(l.outline, '#B06A22'))}" alt="Hình ghép ${esc(l.name)}"></div>
          <div class="gm-ff-in">
            <label>Sự thật thú vị <small class="note">(1 câu ngắn, hiện đậm đầu popup chúc mừng)</small><input name="fact" value="${esc(fact)}" maxlength="300"></label>
            <label>Câu chuyện <small class="note">(để 1 dòng trống giữa các đoạn)</small><textarea name="story" rows="10" maxlength="4000" required>${esc(story)}</textarea></label>
            <div class="gm-act"><button class="btn" type="submit">Lưu câu chuyện</button>${e ? `<button class="btn ghost" type="button" data-freset="${esc(l.id)}">Dùng lại bản gốc</button>` : ''}<button class="btn ghost" type="button" data-fopen="${esc(l.id)}">Huỷ</button>
              <span class="note gm-len"></span></div>
            ${e ? `<details class="gm-orig"><summary>Xem bản gốc</summary><p><b>${esc(l.fact || '')}</b></p>${(l.story || []).map(p => `<p>${esc(p)}</p>`).join('')}</details>` : ''}
          </div></form>` : ''}</div>`; };
    body.innerHTML = `<div class="gm-filter">${[['', `Tất cả (${levels.length})`], ...cols.map(c => [c.id, `${c.name} (${levels.filter(l => l.col === c.id).length})`]), ['_ed', `Đã sửa (${edited.length})`]]
        .map(([k, t]) => `<button class="btn sm ${st.col === k ? '' : 'ghost'}" data-fcol="${esc(k)}">${esc(t)}</button>`).join('')}</div>
      <p class="note" style="margin:10px 0 14px">Hình chưa sửa dùng câu chuyện có sẵn trong trò chơi (bản ${esc(def.version || '')}). Sửa xong, người chơi thấy bản mới sau khoảng 1 phút.</p>
      <div class="gm-figs">${list.map(row).join('') || '<p class="note">Chưa có hình nào trong nhóm này.</p>'}</div>`;
    body.querySelectorAll('[data-fcol]').forEach(b => b.onclick = () => { st.col = b.dataset.fcol; st.open = ''; storyTab(body, slug, g, edited); });
    body.querySelectorAll('[data-fopen]').forEach(b => b.onclick = () => { st.open = st.open === b.dataset.fopen ? '' : b.dataset.fopen; storyTab(body, slug, g, edited).then(() => { const el = body.querySelector(`[data-fig="${st.open}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
    const reload = async () => { const d = await api(`games/${slug}?days=${st.days}`); await storyTab(body, slug, g, d.stories);
      const tb = $('#main [data-gtab="story"]'); if (tb) tb.innerHTML = 'Câu chuyện từng hình' + (d.stories.length ? `<span class="gm-cnt">${d.stories.length} đã sửa</span>` : ''); };
    body.querySelectorAll('[data-fsave]').forEach(f => {
      const ta = f.querySelector('textarea'), len = f.querySelector('.gm-len');
      const upd = () => { const n = ta.value.split(/\n\s*\n/).filter(x => x.trim()).length; len.textContent = `${n} đoạn · ${nf(ta.value.trim().split(/\s+/).filter(Boolean).length)} chữ`; };
      ta.oninput = upd; upd();
      f.onsubmit = async e => { e.preventDefault(); const fd = new FormData(f);
        try { await api(`games/${slug}/story/${f.dataset.fsave}`, { method: 'PUT', body: JSON.stringify({ fact: fd.get('fact'), story: fd.get('story') }) }); toast('Đã lưu câu chuyện.'); st.open = ''; await reload(); }
        catch (err) { toast(err.message, true); } };
    });
    body.querySelectorAll('[data-freset]').forEach(b => b.onclick = async () => {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Bấm lần nữa để xác nhận'; b.classList.add('danger'); return; }
      try { await api(`games/${slug}/story/${b.dataset.freset}`, { method: 'DELETE' }); toast('Đã dùng lại bản gốc.'); st.open = ''; await reload(); } catch (err) { toast(err.message, true); }
    });
  }

  /* ---------- Báo cáo ---------- */
  function reportTab(body, slug, d) {
    const t = d.totals || {}, c = d.corner || {};
    const days = []; for (let i = d.days - 1; i >= 0; i--) days.push(new Date(Date.now() + 7 * 3600000 - i * 86400000).toISOString().slice(0, 10));
    const by = Object.fromEntries(d.daily.map(r => [r.day, r]));
    const max = Math.max(1, ...days.map(x => Math.max((by[x] || {}).visits || 0, (by[x] || {}).plays || 0)));
    const rate = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
    body.innerHTML = `<div class="gm-days">${[7, 30, 90].map(n => `<button class="btn sm ${n === d.days ? '' : 'ghost'}" data-gdays="${n}">${n} ngày</button>`).join('')}<span class="note">${dmy(d.from)} → ${dmy(d.today)}</span></div>
      <div class="stats gm-stats">
        <div class="card stat"><p class="mono">Lượt truy cập</p><p class="v">${nf(t.range_visits)}</p><p class="note">hôm nay ${nf(t.today_visits)} · tổng ${nf(t.visits)}</p></div>
        <div class="card stat"><p class="mono">Lượt chơi</p><p class="v">${nf(t.range_plays)}</p><p class="note">hôm nay ${nf(t.today_plays)} · tổng ${nf(t.plays)}</p></div>
        <div class="card stat"><p class="mono">Lượt ghép xong</p><p class="v">${nf(t.range_wins)}</p><p class="note">hoàn thành ${rate(t.range_wins, t.range_plays)} lượt chơi</p></div>
        <div class="card stat"><p class="mono">Mở trang Góc giải trí</p><p class="v">${nf(c.range_visits)}</p><p class="note">hôm nay ${nf(c.today_visits)} · tổng ${nf(c.visits)}</p></div>
      </div>
      <div class="card panel" style="margin-top:16px"><h2>Theo ngày</h2>
        <div class="gm-chart" aria-label="Biểu đồ lượt truy cập và lượt chơi mỗi ngày">${days.map(x => { const r = by[x] || {};
          return `<span title="${ddmm(x)}: ${nf(r.visits)} truy cập · ${nf(r.plays)} lượt chơi · ${nf(r.wins)} ghép xong"><i class="v" style="height:${(r.visits || 0) / max * 100}%"></i><i class="p" style="height:${(r.plays || 0) / max * 100}%"></i></span>`; }).join('')}</div>
        <p class="note gm-leg"><span class="k v"></span>Lượt truy cập <span class="k p"></span>Lượt chơi · rê chuột lên cột để xem số</p>
        <div class="tbl-wrap" style="margin-top:12px"><table class="gm-tbl"><thead><tr><th>Ngày</th><th>Lượt truy cập</th><th>Lượt chơi</th><th>Lượt ghép xong</th><th>Tỷ lệ hoàn thành</th></tr></thead>
          <tbody>${days.slice().reverse().filter(x => by[x]).map(x => { const r = by[x]; return `<tr><td>${dmy(x)}</td><td>${nf(r.visits)}</td><td>${nf(r.plays)}</td><td>${nf(r.wins)}</td><td>${rate(r.wins, r.plays)}</td></tr>`; }).join('')
            || `<tr><td colspan="5" class="note">Chưa có lượt nào trong ${d.days} ngày.</td></tr>`}</tbody></table></div>
        <p class="note" style="margin-top:10px">Lượt truy cập: mỗi người 1 lượt/ngày khi mở trò chơi. Lượt chơi: mỗi lần bắt đầu kéo mảnh ở 1 hình (tối đa 40 lượt/người/ngày). Lượt ghép xong: mỗi lần hoàn thành 1 hình. Nhận biết "người" bằng mã băm IP trong ngày, không lưu IP. Bản xem thử ngoài web không đếm. Bắt đầu đếm: ${dmy(t.first_day)}.</p></div>`;
    body.querySelectorAll('[data-gdays]').forEach(b => b.onclick = () => { st.days = +b.dataset.gdays; page(slug); });
  }

  const pages = {};
  GAMES.forEach(([slug]) => { pages['g-' + slug] = () => page(slug); });
  Object.assign(Q.pages, pages);
})();
