/* Quản trị tử tế — Xưởng video (v1.18, làm lại gọn 18/10/2026)
 * 2 trang: Lịch đăng (tuần/tháng) và Kho video. Bấm 1 video → cửa sổ chi tiết:
 * sửa nội dung từng kênh, tick "Xác nhận", "Sao chép" lấy đúng nội dung trong ô, tick trạng thái Đã lên lịch / Đã đăng.
 * Dùng chung đăng nhập và hàm tiện ích của admin.js qua window.QTT. Dữ liệu: /api/admin/studio (src/studio-api.js). */
(() => {
  'use strict';
  const Q = window.QTT;
  if (!Q) return;
  const { esc, api, toast } = Q;
  const $ = s => document.querySelector(s);

  /* ---------- danh mục ---------- */
  const CH = [['tiktok', 'TikTok', 'TT'], ['youtube', 'YouTube', 'YT'], ['facebook', 'Facebook', 'FB']];
  const CH_NAME = Object.fromEntries(CH.map(c => [c[0], c[1]]));
  const ST = [['todo', 'Chưa đăng'], ['scheduled', 'Đã lên lịch'], ['posted', 'Đã đăng'], ['skip', 'Không đăng']];
  const ST_NAME = Object.fromEntries(ST);
  /* Ô nội dung của từng kênh: [khoá, nhãn, số dòng, giới hạn ký tự] */
  const FIELDS = {
    tiktok: [['caption', 'Chú thích + hashtag', 9, 4000]],
    youtube: [['title', 'Tiêu đề', 1, 100], ['caption', 'Mô tả', 9, 4000], ['tags', 'Thẻ (tags)', 2, 500]],
    facebook: [['caption', 'Nội dung bài + hashtag', 9, 4000]],
  };
  const LINKS = {
    tiktok: ['Mở TikTok Studio', 'https://www.tiktok.com/tiktokstudio/upload'],
    youtube: ['Mở YouTube Studio', 'https://studio.youtube.com/'],
    facebook: ['Mở Meta Business Suite', 'https://business.facebook.com/latest/home'],
  };

  /* ---------- dữ liệu ---------- */
  let D = { videos: [], posts: [], today: '', now_vn: '' };
  let page = 'studio', view = 'week', anchor = '', q = '';
  try { view = localStorage.getItem('qtt-vx-view') === 'month' ? 'month' : 'week'; } catch (e) { }
  async function load() { D = await api('studio'); if (!anchor) anchor = D.today; return D; }
  const vOf = id => D.videos.find(v => v.id === id);
  const postOf = (vid, ch) => D.posts.find(p => p.video_id === vid && p.channel === ch);
  const stOf = (vid, ch) => { const s = (postOf(vid, ch) || {}).status || 'todo'; return s === 'ready' ? 'todo' : s; };
  const okOf = p => { try { return JSON.parse((p && p.ok) || '{}') || {}; } catch (e) { return {}; } };
  const put = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) });

  /* ---------- ngày giờ (giờ Việt Nam, xử lý như chuỗi YYYY-MM-DD) ---------- */
  const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dObj = s => new Date(s + 'T00:00:00Z');
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (s, n) => iso(new Date(dObj(s).getTime() + n * 86400000));
  const dmy = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '';
  const dm = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '';
  const wd = s => WD[dObj(s).getUTCDay()];
  const monday = s => addDays(s, -((dObj(s).getUTCDay() + 6) % 7));
  const parseDmy = t => {
    t = String(t || '').trim(); if (!t) return '';
    const m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/); if (!m) return null;
    const s = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const d = dObj(s); return !isNaN(d) && iso(d) === s ? s : null;
  };
  const parseHm = t => { t = String(t || '').trim().replace('h', ':'); const m = t.match(/^(\d{1,2}):(\d{2})$/); if (!m || +m[1] > 23 || +m[2] > 59) return null; return m[1].padStart(2, '0') + ':' + m[2]; };

  /* ---------- trạng thái tổng của 1 video ---------- */
  function overall(v) {
    const s = CH.map(([c]) => stOf(v.id, c)), active = s.filter(x => x !== 'skip');
    if (active.length && active.every(x => x === 'posted')) return ['done', 'Đã đăng đủ'];
    if (!active.length) return ['skip', 'Không đăng'];
    const due = v.plan_date && (v.plan_date < D.today || (v.plan_date === D.today && (v.plan_time || '19:00') <= D.now_vn.slice(11, 16)));
    if (active.every(x => x !== 'todo')) return due ? ['live', 'Chờ đánh dấu đã đăng'] : ['sched', 'Đã lên lịch đủ'];
    if (due) return ['late', 'Quá giờ, còn kênh chưa đăng'];
    if (v.stage !== 'saved') return ['prod', 'Đang sản xuất'];
    return ['ready', 'Chờ lên lịch'];
  }
  const dots = v => `<span class="vx-dots">${CH.map(([c, n, s]) => `<i class="vx-dot d-${stOf(v.id, c)}" title="${esc(n)}: ${esc(ST_NAME[stOf(v.id, c)])}">${s}</i>`).join('')}</span>`;
  const legend = `<p class="vx-legend note"><i class="vx-dot d-todo">TT</i> chưa đăng <i class="vx-dot d-scheduled">TT</i> đã lên lịch <i class="vx-dot d-posted">TT</i> đã đăng <i class="vx-dot d-skip">TT</i> không đăng</p>`;

  /* ---------- sao chép ---------- */
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const t = Object.assign(document.createElement('textarea'), { value: text }); t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch (er) { } t.remove(); }
  }

  /* =========================================================
   * 1. LỊCH ĐĂNG (tuần / tháng)
   * ========================================================= */
  const byDay = d => D.videos.filter(v => v.plan_date === d).sort((a, b) => (a.plan_time || '').localeCompare(b.plan_time || ''));
  const firstPlan = () => D.videos.map(v => v.plan_date).filter(Boolean).sort()[0] || D.today;
  function vcard(v, compact) {
    const [k, label] = overall(v);
    return `<button type="button" class="vx-card o-${k}" data-open="${v.id}" title="${esc(v.title)} · ${esc(label)}">
      <span class="vx-ct"><b class="num">${esc(v.plan_time || '')}</b><span class="vs-code">${esc(v.code)}</span></span>
      <span class="vx-tt">${esc(v.title)}</span>${compact ? dots(v) : `${dots(v)}<span class="vx-ol">${esc(label)}</span>`}</button>`;
  }
  function weekHtml() {
    const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), start = firstPlan();
    return `<div class="vx-week">${days.map(d => {
      const list = byDay(d), gap = !list.length && d >= D.today && d >= start;
      return `<section class="vx-day${d === D.today ? ' today' : ''}${d < D.today ? ' past' : ''}"><header><b>${d === D.today ? 'Hôm nay' : wd(d)}</b><span class="num">${d === D.today ? wd(d) + ' ' : ''}${dm(d)}</span></header>
        <div class="vx-day-b">${list.map(v => vcard(v)).join('') || `<p class="vx-empty${gap ? ' gap' : ''}">${gap ? 'Chưa có video' : '–'}</p>`}</div></section>`;
    }).join('')}</div>`;
  }
  function monthHtml() {
    const m0 = anchor.slice(0, 8) + '01', s = monday(m0), start = firstPlan();
    const cells = Array.from({ length: 42 }, (_, i) => addDays(s, i));
    const rows = cells[35].slice(0, 7) === m0.slice(0, 7) ? 6 : 5;
    return `<div class="vx-month"><div class="vx-mh">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => `<b>${x}</b>`).join('')}</div>
      <div class="vx-mg">${cells.slice(0, rows * 7).map(d => {
        const list = byDay(d), out = d.slice(0, 7) !== m0.slice(0, 7), gap = !list.length && !out && d >= D.today && d >= start;
        return `<div class="vx-cell${out ? ' out' : ''}${d === D.today ? ' today' : ''}${gap ? ' gap' : ''}"><span class="vx-cd num">${+d.slice(8, 10)}</span>${list.map(v => vcard(v, true)).join('')}</div>`;
      }).join('')}</div></div>`;
  }
  function rangeLabel() {
    if (view === 'month') return `Tháng ${+anchor.slice(5, 7)}/${anchor.slice(0, 4)}`;
    const e = addDays(anchor, 6);
    return `${anchor === D.today ? 'Hôm nay → ' : ''}${dm(anchor)} – ${dmy(e)}`;
  }
  async function calPage() {
    page = 'studio'; await load();
    const unplanned = D.videos.filter(v => !v.plan_date);
    const due = D.videos.filter(v => overall(v)[0] === 'late').length;
    const next7 = Array.from({ length: 7 }, (_, i) => addDays(D.today, i)), start = firstPlan();
    const gaps = next7.filter(d => d >= start && !byDay(d).length).length;
    $('#main').innerHTML = Q.head('Kênh video · Xưởng video', 'Lịch đăng', '<button class="btn amber sm" id="vx-add">+ Thêm video</button>',
      `Đăng mỗi ngày 1 video, cùng giờ trên cả 3 kênh.${due ? ` <b class="vx-warn">${due} video quá giờ còn kênh chưa đăng.</b>` : ''}${gaps ? ` 7 ngày tới còn <b>${gaps}</b> ngày chưa có video.` : ''}`)
      + `<div class="vx-tool card"><div class="vx-seg" role="group" aria-label="Kiểu xem"><button type="button" data-view="week" aria-pressed="${view === 'week'}">Tuần</button><button type="button" data-view="month" aria-pressed="${view === 'month'}">Tháng</button></div>
        <div class="vx-nav"><button type="button" class="btn ghost sm" data-step="-1" aria-label="Trước">‹</button><button type="button" class="btn ghost sm" data-step="0">Hôm nay</button><button type="button" class="btn ghost sm" data-step="1" aria-label="Sau">›</button></div>
        <b class="vx-range">${esc(rangeLabel())}</b></div>`
      + (view === 'week' ? weekHtml() : monthHtml()) + legend
      + `<section class="card vx-un"><h2>Chưa xếp lịch <span class="note">${unplanned.length} video</span></h2>
        ${unplanned.length ? `<div class="vx-un-l">${unplanned.map(v => `<button type="button" class="vx-chip" data-open="${v.id}"><span class="vs-code">${esc(v.code)}</span>${esc(v.title)}</button>`).join('')}</div>` : '<p class="note">Mọi video đã có ngày đăng.</p>'}</section>`;
    bindPage();
    $('#main').querySelectorAll('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; anchor = D.today; try { localStorage.setItem('qtt-vx-view', view); } catch (e) { } calPage(); });
    $('#main').querySelectorAll('[data-step]').forEach(b => b.onclick = () => {
      const n = +b.dataset.step;
      if (!n) anchor = D.today;
      else if (view === 'week') anchor = addDays(anchor, 7 * n);
      else { const y = +anchor.slice(0, 4), m = +anchor.slice(5, 7) - 1 + n; anchor = iso(new Date(Date.UTC(y, m, 1))); }
      calPage();
    });
  }

  /* =========================================================
   * 2. KHO VIDEO (danh sách)
   * ========================================================= */
  async function listPage() {
    page = 'vlist'; await load();
    $('#main').innerHTML = Q.head('Kênh video · Xưởng video', 'Kho video', '<button class="btn amber sm" id="vx-add">+ Thêm video</button>', `${D.videos.length} video · bấm một dòng để mở chi tiết`)
      + `<div class="tools"><input type="search" id="vx-q" placeholder="Tìm mã hoặc tên video" value="${esc(q)}" aria-label="Tìm video"></div>
      <div class="tbl-wrap"><table class="vx-tbl"><thead><tr><th>Mã</th><th>Tên video</th><th>Ngày đăng</th>${CH.map(c => `<th>${c[1]}</th>`).join('')}<th>Tình trạng</th></tr></thead><tbody id="vx-rows"></tbody></table></div>`;
    const draw = () => {
      const k = q.toLowerCase(), rows = D.videos.filter(v => !k || (v.code + ' ' + v.title).toLowerCase().includes(k));
      $('#vx-rows').innerHTML = rows.map(v => { const [o, l] = overall(v); return `<tr class="row" data-open="${v.id}"><td><span class="vs-code">${esc(v.code)}</span></td><td><b>${esc(v.title)}</b></td>
        <td class="num">${v.plan_date ? `${wd(v.plan_date)} ${dmy(v.plan_date)} · ${esc(v.plan_time || '')}` : '<span class="note">Chưa xếp lịch</span>'}</td>
        ${CH.map(([c]) => `<td><span class="vx-st s-${stOf(v.id, c)}">${ST_NAME[stOf(v.id, c)]}</span></td>`).join('')}<td><span class="vx-ov o-${o}">${esc(l)}</span></td></tr>`; }).join('')
        || `<tr><td colspan="7" class="note">${D.videos.length ? 'Không có video khớp từ khoá.' : 'Chưa có video nào. Bấm "+ Thêm video".'}</td></tr>`;
    };
    draw(); bindPage();
    $('#vx-q').oninput = e => { q = e.target.value; draw(); $('#vx-rows').querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => openVideo(+el.dataset.open))); };
  }

  function bindPage() {
    const add = $('#vx-add'); if (add) add.onclick = newVideo;
    $('#main').querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => openVideo(+el.dataset.open)));
  }
  const refresh = () => (page === 'vlist' ? listPage : calPage)();

  /* =========================================================
   * 3. CỬA SỔ (dùng lại khung .vs-modal của v1.16)
   * ========================================================= */
  function closeModal() { const m = document.querySelector('.vs-modal'); if (m) m.remove(); document.body.classList.remove('vs-lock'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.vs-modal.vx')) { closeModal(); refresh(); } });
  function modal(html) {
    closeModal();
    const m = document.createElement('div'); m.className = 'vs-modal vx'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="vs-sheet vx-sheet">${html}</div>`;
    m.addEventListener('mousedown', e => { if (e.target === m) m.dataset.down = '1'; else delete m.dataset.down; });
    m.addEventListener('click', e => { if (e.target === m && m.dataset.down) { closeModal(); refresh(); } });
    document.body.append(m); document.body.classList.add('vs-lock');
    return m;
  }

  function newVideo() {
    const m = modal(`<header class="vx-mhd"><div><p class="mono">Xưởng video</p><h2>Thêm video</h2></div><button type="button" class="btn ghost sm" data-close aria-label="Đóng">✕</button></header>
      <div class="vx-grid">
        <label class="full">Tên video<input id="vx-n-title" type="text" maxlength="200" placeholder="Ví dụ: Demo Bộ xử lý hóa đơn"></label>
        <label>Ngày đăng (dd/mm/yyyy)<input id="vx-n-date" type="text" inputmode="numeric" placeholder="dd/mm/yyyy"></label>
        <label>Giờ đăng<input id="vx-n-time" type="text" inputmode="numeric" value="19:00" placeholder="19:00"></label>
      </div>
      <p class="err" id="vx-err"></p>
      <div class="vx-foot"><span></span><button type="button" class="btn amber" id="vx-create">Tạo video</button></div>`);
    m.querySelector('#vx-n-title').focus();
    m.addEventListener('click', async e => {
      if (e.target.closest('[data-close]')) { closeModal(); return; }
      if (!e.target.closest('#vx-create')) return;
      const title = m.querySelector('#vx-n-title').value.trim(), date = parseDmy(m.querySelector('#vx-n-date').value), time = parseHm(m.querySelector('#vx-n-time').value || '19:00');
      const err = m.querySelector('#vx-err');
      if (!title) return err.textContent = 'Hãy nhập tên video.';
      if (date === null) return err.textContent = 'Ngày đăng chưa đúng dạng dd/mm/yyyy.';
      if (time === null) return err.textContent = 'Giờ đăng chưa đúng dạng HH:MM.';
      try {
        const r = await api('studio/video', { method: 'POST', body: JSON.stringify({ title, plan_date: date, plan_time: time }) });
        await load(); openVideo(r.id); toast('Đã tạo video.');
      } catch (er) { err.textContent = er.message; }
    });
  }

  /* ---------- chi tiết video ---------- */
  let tabCh = 'tiktok';
  const copyField = (id, label, value, o = {}) => `<div class="vx-f${o.ok !== undefined ? ' has-ok' : ''}" data-fid="${id}">
      <div class="vx-fh"><span class="vx-lab">${esc(label)}</span>${o.max ? `<span class="vx-cnt num" data-cnt>${[...(value || '')].length}/${o.max}</span>` : ''}
        ${o.ok !== undefined ? `<label class="vx-ok"><input type="checkbox" data-ok ${o.ok ? 'checked' : ''}> Xác nhận</label>` : ''}
        <button type="button" class="btn sm amber vx-copy" data-copy>Sao chép</button></div>
      ${o.rows > 1 ? `<textarea rows="${o.rows}" data-val ${o.max ? `maxlength="${o.max}"` : ''} aria-label="${esc(label)}">${esc(value || '')}</textarea>` : `<input type="text" data-val ${o.max ? `maxlength="${o.max}"` : ''} value="${esc(value || '')}" aria-label="${esc(label)}">`}</div>`;

  function chanPanel(v, ch) {
    const p = postOf(v.id, ch) || {}, ok = okOf(p), st = stOf(v.id, ch);
    return `<div class="vx-panel" data-ch="${ch}" ${ch === tabCh ? '' : 'hidden'}>
      <div class="vx-strow"><span class="vx-lab">Trạng thái ${esc(CH_NAME[ch])}</span><div class="vx-seg vx-stseg" role="group" aria-label="Trạng thái ${esc(CH_NAME[ch])}">
        ${ST.map(([k, l]) => `<button type="button" data-st="${k}" aria-pressed="${st === k}">${st === k ? '✓ ' : ''}${l}</button>`).join('')}</div>
        <a class="btn ghost sm" href="${LINKS[ch][1]}" target="_blank" rel="noopener">${esc(LINKS[ch][0])} ↗</a></div>
      ${p.note ? `<div class="vx-note"><span class="vx-lab">Lưu ý khi đăng</span><textarea rows="2" data-pnote aria-label="Lưu ý khi đăng">${esc(p.note)}</textarea></div>` : ''}
      ${FIELDS[ch].map(([k, label, rows, max]) => copyField(`${ch}.${k}`, label, p[k], { rows, max, ok: !!ok[k] })).join('')}
      <label class="vx-url">Link bài đã đăng<input type="url" data-purl value="${esc(p.url || '')}" placeholder="https://…"></label>
    </div>`;
  }

  function openVideo(id) {
    const v = vOf(id); if (!v) return;
    const m = modal(`<header class="vx-mhd"><div class="vx-mt"><p class="mono">Xưởng video · <span class="vs-code">${esc(v.code)}</span> · <span class="vx-ov o-${overall(v)[0]}">${esc(overall(v)[1])}</span></p>
        <input class="vx-title" data-vk="title" type="text" maxlength="200" value="${esc(v.title)}" aria-label="Tên video"></div>
        <button type="button" class="btn ghost sm" data-close aria-label="Đóng">✕</button></header>
      <div class="vx-grid vx-top">
        <label>Ngày đăng<input data-vk="plan_date" type="text" inputmode="numeric" placeholder="dd/mm/yyyy" value="${esc(dmy(v.plan_date))}"></label>
        <label>Giờ đăng<input data-vk="plan_time" type="text" inputmode="numeric" placeholder="19:00" value="${esc(v.plan_time || '')}"></label>
        <label class="vx-check"><input type="checkbox" data-vk="stage" ${v.stage === 'saved' ? 'checked' : ''}> Video đã hoàn thiện</label>
      </div>
      ${copyField('v.file_path', 'File video trên máy', v.file_path, { rows: 1 })}
      ${copyField('v.thumb_path', 'Ảnh bìa', v.thumb_path, { rows: 1 })}
      <div class="vx-tabs" role="tablist">${CH.map(([c, n]) => `<button type="button" role="tab" data-tab="${c}" aria-selected="${c === tabCh}"><i class="vx-dot d-${stOf(v.id, c)}" data-tdot="${c}"></i>${esc(n)}</button>`).join('')}</div>
      ${CH.map(([c]) => chanPanel(v, c)).join('')}
      <div class="vx-common">${copyField('v.pin_comment', 'Bình luận ghim (dùng chung 3 kênh)', v.pin_comment, { rows: 2, ok: !!v.pin_ok })}
        <label class="vx-notes">Ghi chú riêng<textarea rows="2" data-vk="notes">${esc(v.notes || '')}</textarea></label></div>
      <p class="err" id="vx-err"></p>
      <div class="vx-foot"><button type="button" class="btn danger sm" id="vx-del">Xoá video</button><span class="note" id="vx-saved"></span><button type="button" class="btn" data-close>Xong</button></div>`);

    const err = m.querySelector('#vx-err'), saved = m.querySelector('#vx-saved');
    const say = (msg, bad) => { err.textContent = bad ? msg : ''; if (!bad) { saved.textContent = msg; clearTimeout(saved._h); saved._h = setTimeout(() => saved.textContent = '', 2500); } };
    const saveVideo = async body => { try { await put('studio/video/' + id, body); Object.assign(v, body); say('Đã lưu'); return true; } catch (e) { say(e.message, true); return false; } };
    const savePost = async (ch, body) => {
      try {
        await put('studio/post', { video_id: id, channel: ch, ...body });
        let p = postOf(id, ch); if (!p) { p = { video_id: id, channel: ch, status: 'todo', ok: '{}' }; D.posts.push(p); }
        Object.assign(p, body, body.ok ? { ok: JSON.stringify(body.ok) } : {});
        say('Đã lưu'); return true;
      } catch (e) { say(e.message, true); return false; }
    };
    /* giá trị đã lưu của 1 ô nội dung */
    const stored = fid => { const [a, k] = fid.split('.'); return a === 'v' ? (v[k] || '') : ((postOf(id, a) || {})[k] || ''); };
    const okState = ch => { const o = okOf(postOf(id, ch)); m.querySelectorAll(`.vx-panel[data-ch="${ch}"] .vx-f`).forEach(f => { const k = f.dataset.fid.split('.')[1]; if (f.querySelector('[data-ok]').checked) o[k] = 1; else delete o[k]; }); return o; };
    async function saveField(f) {
      const fid = f.dataset.fid, [a, k] = fid.split('.'), val = f.querySelector('[data-val]').value, okEl = f.querySelector('[data-ok]');
      if (a === 'v') return saveVideo(k === 'pin_comment' ? { pin_comment: val, pin_ok: okEl && okEl.checked ? 1 : 0 } : { [k]: val });
      return savePost(a, { [k]: val, ok: okState(a) });
    }

    m.addEventListener('input', e => {
      const f = e.target.closest('.vx-f'); if (!f || !e.target.matches('[data-val]')) return;
      const c = f.querySelector('[data-cnt]'); if (c) c.textContent = [...e.target.value].length + c.textContent.slice(c.textContent.indexOf('/'));
      const ok = f.querySelector('[data-ok]'); if (ok && ok.checked && e.target.value !== stored(f.dataset.fid)) { ok.checked = false; f.classList.add('dirty'); }
    });
    m.addEventListener('change', async e => {
      const t = e.target;
      const f = t.closest('.vx-f');
      if (f && (t.matches('[data-val]') || t.matches('[data-ok]'))) { f.classList.remove('dirty'); return saveField(f); }
      if (t.matches('[data-pnote]')) return savePost(t.closest('.vx-panel').dataset.ch, { note: t.value });
      if (t.matches('[data-purl]')) return savePost(t.closest('.vx-panel').dataset.ch, { url: t.value });
      const k = t.dataset.vk; if (!k) return;
      if (k === 'title') { if (!t.value.trim()) { t.value = v.title; return say('Tên video không được để trống.', true); } return saveVideo({ title: t.value.trim() }); }
      if (k === 'plan_date') { const d = parseDmy(t.value); if (d === null) return say('Ngày đăng chưa đúng dạng dd/mm/yyyy.', true); t.value = dmy(d); return saveVideo({ plan_date: d }); }
      if (k === 'plan_time') { const h = t.value.trim() ? parseHm(t.value) : ''; if (h === null) return say('Giờ đăng chưa đúng dạng HH:MM (ví dụ 19:00).', true); t.value = h; return saveVideo({ plan_time: h }); }
      if (k === 'stage') return saveVideo({ stage: t.checked ? 'saved' : 'edit' });
      if (k === 'notes') return saveVideo({ notes: t.value });
    });
    m.addEventListener('click', async e => {
      if (e.target.closest('[data-close]')) { closeModal(); refresh(); return; }
      const tb = e.target.closest('[data-tab]');
      if (tb) { tabCh = tb.dataset.tab; m.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b === tb)); m.querySelectorAll('.vx-panel').forEach(p => p.hidden = p.dataset.ch !== tabCh); return; }
      const sb = e.target.closest('[data-st]');
      if (sb) {
        const ch = sb.closest('.vx-panel').dataset.ch, st = sb.dataset.st;
        if (await savePost(ch, { status: st })) {
          sb.parentElement.querySelectorAll('[data-st]').forEach(b => { const on = b.dataset.st === st; b.setAttribute('aria-pressed', on); b.textContent = (on ? '✓ ' : '') + ST_NAME[b.dataset.st]; });
          const dt = m.querySelector(`[data-tdot="${ch}"]`); dt.className = 'vx-dot d-' + st;
          toast(`${CH_NAME[ch]}: ${ST_NAME[st]}.`);
        }
        return;
      }
      const cb = e.target.closest('[data-copy]');
      if (cb) {
        const f = cb.closest('.vx-f'), val = f.querySelector('[data-val]').value, ok = f.querySelector('[data-ok]');
        if (val !== stored(f.dataset.fid)) await saveField(f);
        await copy(val);
        cb.textContent = 'Đã chép'; cb.classList.add('done'); setTimeout(() => { cb.textContent = 'Sao chép'; cb.classList.remove('done'); }, 1400);
        toast(ok && !ok.checked ? 'Đã sao chép. Nội dung này chưa được xác nhận.' : 'Đã sao chép.');
        return;
      }
      const del = e.target.closest('#vx-del');
      if (del) {
        if (!del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Bấm lần nữa để xoá hẳn'; setTimeout(() => { if (del.isConnected) { delete del.dataset.sure; del.textContent = 'Xoá video'; } }, 4000); return; }
        try { await api('studio/video/' + id, { method: 'DELETE' }); toast('Đã xoá video.'); closeModal(); refresh(); } catch (er) { say(er.message, true); }
      }
    });
  }

  Object.assign(Q.pages, { studio: calPage, vlist: listPage });
})();
