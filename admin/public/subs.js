/* Quản trị tử tế — Dịch vụ & công cụ AI (v1.17c)
 * Bảng nhập trực tiếp: mọi trường nhập tay sửa ngay trên từng dòng (tự lưu khi rời ô).
 * Trường hệ thống tự tính (không nhập tay): Giá quy đổi (VND) = Giá gốc × tỷ giá; Gia hạn tiếp theo = Ngày kích hoạt + Loại gói.
 * Kéo mép cột để đổi độ rộng; nút "Cột hiển thị" để bật/tắt cột. Cả hai được nhớ trên trình duyệt này.
 * Dùng chung đăng nhập và hàm tiện ích của admin.js qua window.QTT. Dữ liệu: /api/admin/subs (src/subs-api.js).
 * Không lưu mật khẩu / API key. */
(() => {
  'use strict';
  const Q = window.QTT;
  if (!Q) return;
  const { esc, api, toast } = Q;
  const $ = s => document.querySelector(s);

  const CAT = { ai: 'Công cụ AI', infra: 'Hạ tầng', content: 'Nội dung', other: 'Khác' };
  const CYC = { unknown: '— Chọn —', free: 'Free', once: 'Trọn đời', month: 'Hàng tháng', year: 'Hàng năm' };
  const ST = { active: 'Đang dùng', trial: 'Dùng thử', paused: 'Tạm dừng', canceled: 'Đã hủy' };
  const WARN_DAYS = 14;

  /* ---------- cột của bảng: k = khoá, w = độ rộng mặc định, min = độ rộng tối thiểu, lock = luôn hiện, sys = hệ thống tự tính ---------- */
  const COLS = [
    { k: 'name', t: 'Dịch vụ', w: 190, min: 110, lock: 1 },
    { k: 'vendor', t: 'Nhà cung cấp', w: 140, min: 70 },
    { k: 'category', t: 'Phân loại', w: 140, min: 115 },
    { k: 'plan', t: 'Gói đang dùng', w: 150, min: 70 },
    { k: 'cycle', t: 'Loại gói', w: 145, min: 125 },
    { k: 'started', t: 'Ngày kích hoạt', w: 165, min: 145 },
    { k: 'price', t: 'Giá gốc', w: 200, min: 165 },
    { k: 'vnd', t: 'Giá quy đổi (VND)', sub: 'tự tính', w: 150, min: 90, sys: 1 },
    { k: 'renew', t: 'Gia hạn tiếp theo', sub: 'tự tính từ ngày kích hoạt', w: 160, min: 100, sys: 1 },
    { k: 'status', t: 'Trạng thái', w: 125, min: 100 },
    { k: 'purpose', t: 'Mục đích', w: 250, min: 80 },
    { k: 'url', t: 'Link', w: 180, min: 70 },
    { k: 'del', t: '', w: 48, min: 48, lock: 1, nopick: 1 },
  ];
  const LSKEY = 'qtt-subs-cols';
  let PREF = { w: {}, hide: [] };
  try { const p = JSON.parse(localStorage.getItem(LSKEY) || '{}'); if (p && typeof p === 'object') PREF = { w: p.w || {}, hide: Array.isArray(p.hide) ? p.hide : [] }; } catch (e) { }
  const savePref = () => { try { localStorage.setItem(LSKEY, JSON.stringify(PREF)); } catch (e) { } };
  const width = c => Math.max(c.min, +PREF.w[c.k] || c.w);
  const shown = () => COLS.filter(c => c.lock || !PREF.hide.includes(c.k));
  const tableW = () => shown().reduce((a, c) => a + width(c), 0);

  let D = { items: [], usd_rate: 0, today: '' };
  const F = { q: '', cat: '', st: '' };
  const load = async () => { D = await api('subs'); return D; };
  const itemOf = id => D.items.find(x => x.id === id);
  const put = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) });

  /* ---------- ngày & tiền ---------- */
  const dObj = s => new Date(s + 'T00:00:00Z');
  /* QUY ƯỚC: mọi ngày hiển thị và nhập ở dạng dd/mm/yyyy (không dùng ô date mặc định của trình duyệt vì nó đổi theo ngôn ngữ máy). Gửi/nhận API dạng yyyy-mm-dd. */
  const fmtD = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '';
  function parseD(v) { // 'dd/mm/yyyy' → 'yyyy-mm-dd' | '' (trống) | null (sai)
    v = String(v || '').trim(); if (!v) return '';
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!m) return null;
    const d = +m[1], mo = +m[2], y = +m[3], t = new Date(Date.UTC(y, mo - 1, d));
    if (y < 1990 || y > 2100 || t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  /* ---------- số tiền: hiển thị/nhập có dấu . phân tách hàng nghìn, dấu , cho phần thập phân (kiểu Việt Nam) ---------- */
  const fmtNum = n => n > 0 ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n) : '';
  const parseMoney = v => { const n = parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
  /** Định dạng ngay khi gõ, giữ vị trí con trỏ. allowDec: cho phép phần thập phân (USD, tỷ giá); gõ dấu chấm cũng được hiểu là dấu thập phân. */
  function maskMoney(el, allowDec, ev) {
    let raw = el.value, pos = el.selectionStart == null ? raw.length : el.selectionStart;
    if (ev && ev.data === '.' && allowDec && !/,/.test(raw.slice(0, pos - 1) + raw.slice(pos))) raw = raw.slice(0, pos - 1) + ',' + raw.slice(pos);
    const sig = t => (t.match(/[\d,]/g) || []).length;
    let before = sig(raw.slice(0, pos));
    const keep = raw.replace(allowDec ? /[^\d,]/g : /[^\d]/g, '');
    const hasDec = allowDec && keep.includes(',');
    const parts = keep.split(',');
    let ip = parts[0].replace(/^0+(?=\d)/, ''), dp = parts.slice(1).join('').slice(0, 2);
    if (hasDec && ip === '') { ip = '0'; before++; }
    const out = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (hasDec ? ',' + dp : '');
    el.value = out;
    let i = 0, n = 0;
    if (before > 0) for (i = 0; i < out.length; i++) { if (/[\d,]/.test(out[i])) n++; if (n === before) { i++; break; } }
    try { el.setSelectionRange(i, i); } catch (e) { }
  }
  /* ---------- ô ngày 3 phần dd / mm / yyyy: dấu / có sẵn, gõ đủ số tự nhảy sang phần kế tiếp ---------- */
  const SEG_LEN = { d: 2, m: 2, y: 4 };
  const segsOf = g => ['d', 'm', 'y'].map(k => g.querySelector(`[data-seg=${k}]`));
  function focusSeg(el, dir) {
    const list = segsOf(el.closest('.sb-date')), i = list.indexOf(el), t = list[i + (dir === 'next' ? 1 : -1)];
    if (!t) return; t.focus();
    if (dir === 'next') t.select(); else t.setSelectionRange(t.value.length, t.value.length);
  }
  function onSegInput(el) {
    const seg = el.dataset.seg, max = SEG_LEN[seg];
    let v = el.value.replace(/\D/g, '').slice(0, max);
    if ((seg === 'd' && v.length === 1 && +v > 3) || (seg === 'm' && v.length === 1 && +v > 1)) v = '0' + v; // gõ 5 → 05
    el.value = v;
    if (v.length >= max && seg !== 'y') focusSeg(el, 'next');
  }
  function onSegKey(e) {
    const el = e.target, seg = el.dataset.seg;
    if (e.key === 'Backspace' && el.value === '' && seg !== 'd') { e.preventDefault(); focusSeg(el, 'prev'); }
    else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && seg !== 'd') { e.preventDefault(); focusSeg(el, 'prev'); }
    else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && seg !== 'y') { e.preventDefault(); focusSeg(el, 'next'); }
    else if (['/', '.', '-', ' '].includes(e.key)) { e.preventDefault(); if (el.value && seg !== 'y') { if (el.value.length === 1) el.value = '0' + el.value; focusSeg(el, 'next'); } }
  }
  function onSegPaste(e) {
    const txt = (e.clipboardData || window.clipboardData).getData('text'); if (!txt) return;
    let parts = txt.trim().split(/\D+/).filter(Boolean);
    if (parts.length !== 3) { const dg = txt.replace(/\D/g, ''); if (dg.length !== 8) return; parts = [dg.slice(0, 2), dg.slice(2, 4), dg.slice(4)]; }
    e.preventDefault();
    const [d, m, y] = segsOf(e.target.closest('.sb-date'));
    d.value = parts[0].padStart(2, '0').slice(-2); m.value = parts[1].padStart(2, '0').slice(-2); y.value = parts[2].slice(0, 4); y.focus();
  }
  const daysTo = s => Math.round((dObj(s) - dObj(D.today)) / 86400000);
  const money = (n, cur) => cur === 'USD'
    ? '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0)
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + ' ₫';
  const live = x => x.status === 'active' || x.status === 'trial';
  const isFree = x => x.cycle === 'free';
  /* chi phí quy đổi theo tháng (chỉ gói hàng tháng / hàng năm; Free và Trọn đời không tính vào chi phí định kỳ) */
  const perMonthVnd = x => x.price_vnd == null ? 0 : x.cycle === 'month' ? x.price_vnd : x.cycle === 'year' ? x.price_vnd / 12 : 0;
  const perMonthUsd = x => x.price_vnd == null && x.currency === 'USD' ? (x.cycle === 'month' ? x.price : x.cycle === 'year' ? x.price / 12 : 0) : 0;

  function totals() {
    let vnd = 0, usd = 0, once = 0, onceUsd = 0;
    for (const x of D.items) {
      if (!live(x) || isFree(x) || !(x.price > 0)) continue;
      vnd += perMonthVnd(x); usd += perMonthUsd(x);
      if (x.cycle === 'once') { if (x.price_vnd != null) once += x.price_vnd; else onceUsd += x.price; }
    }
    return {
      vnd, usd, once, onceUsd, due: dueList().length, count: D.items.filter(live).length,
      noPrice: D.items.filter(x => live(x) && !isFree(x) && !(x.price > 0)).length,
      noRate: D.usd_rate ? 0 : D.items.filter(x => live(x) && !isFree(x) && x.currency === 'USD' && x.price > 0).length,
    };
  }
  const costLine = (vnd, usd) => [vnd > 0 ? money(vnd, 'VND') : '', usd > 0 ? money(usd, 'USD') : ''].filter(Boolean).join(' + ') || '—';
  const dueList = () => D.items.filter(x => live(x) && x.next_renew && daysTo(x.next_renew) <= WARN_DAYS).sort((a, b) => a.next_renew.localeCompare(b.next_renew));

  /* ---------- các ô tự tính ---------- */
  function vndCell(x) {
    if (isFree(x)) return '<b class="sb-free">Miễn phí</b>';
    if (!(x.price > 0)) return '<span class="sb-off">—</span>';
    if (x.price_vnd == null) return '<span class="sb-off">Nhập tỷ giá ở trên</span>';
    return `<b class="num">${esc(money(x.price_vnd, 'VND'))}</b>`;
  }
  function renewCell(x) {
    if (isFree(x)) return '<span class="sb-off">Free</span>';
    if (x.cycle === 'once') return '<span class="sb-off">Trọn đời</span>';
    if (!x.next_renew) return `<span class="sb-off">${live(x) ? (x.cycle === 'unknown' ? 'Chọn loại gói' : 'Nhập ngày kích hoạt') : '—'}</span>`;
    const d = daysTo(x.next_renew), cls = d < 0 ? 'late' : d <= WARN_DAYS ? 'soon' : '';
    const txt = d < 0 ? `trễ ${-d} ngày` : d === 0 ? 'hôm nay' : d === 1 ? 'ngày mai' : `còn ${d} ngày`;
    return `<span class="num">${esc(fmtD(x.next_renew))}</span><small class="sb-d ${cls}">${txt}</small>`;
  }
  const kpiHtml = () => {
    const T = totals();
    return `<section class="card sb-k"><small>Chi phí mỗi tháng (quy đổi)</small><b>${esc(costLine(T.vnd, T.usd))}</b><em>${T.noRate ? `${T.noRate} dịch vụ USD chưa quy đổi: nhập tỷ giá` : 'Tính các gói hàng tháng + hàng năm đang dùng'}</em></section>
      <section class="card sb-k"><small>Chi phí mỗi năm (quy đổi)</small><b>${esc(costLine(T.vnd * 12, T.usd * 12))}</b><em>${T.once > 0 || T.onceUsd > 0 ? `Gói trọn đời đã mua: ${esc(costLine(T.once, T.onceUsd))}` : 'Chưa có gói trọn đời'}</em></section>
      <section class="card sb-k${T.due ? ' warn' : ''}"><small>Đến hạn trong ${WARN_DAYS} ngày</small><b>${T.due}</b><em>${T.due ? 'Xem khối "Sắp đến hạn" bên dưới' : 'Chưa có dịch vụ nào cần gia hạn'}</em></section>
      <section class="card sb-k${T.noPrice ? ' warn' : ''}"><small>Chưa nhập giá</small><b>${T.noPrice}</b><em>${T.noPrice ? 'Tổng chi phí chưa tính các dịch vụ này (gói Free không tính)' : 'Đã đủ giá'}</em></section>`;
  };
  function dueHtml() {
    const due = dueList(); if (!due.length) return '';
    return `<h2>⏰ Sắp đến hạn / quá hạn</h2>${due.map(x => `<div class="sb-due-row"><b>${esc(x.name || '(chưa đặt tên)')}</b><span class="note">${esc(x.plan || CAT[x.category])}</span><span class="sb-due-r">${renewCell(x)}</span>${x.price > 0 ? `<span class="num">${esc(money(x.price, x.currency))}${x.currency === 'USD' && x.price_vnd != null ? ` ≈ ${esc(money(x.price_vnd, 'VND'))}` : ''}</span>` : ''}</div>`).join('')}`;
  }

  /* ---------- ô nhập tay (sửa trực tiếp) ---------- */
  const tx = (k, v, ph = '') => `<input class="sb-in" data-k="${k}" value="${esc(v)}" ${ph ? `placeholder="${esc(ph)}"` : ''} autocomplete="off" aria-label="${esc(k)}">`;
  const sel = (k, v, opt) => `<select class="sb-in" data-k="${k}" aria-label="${esc(k)}">${Object.entries(opt).map(([a, b]) => `<option value="${a}" ${v === a ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  const CELL = {
    name: x => tx('name', x.name, 'Tên dịch vụ'),
    vendor: x => tx('vendor', x.vendor, 'Nhà cung cấp'),
    category: x => sel('category', x.category, CAT),
    plan: x => tx('plan', x.plan, 'VD: Pro, Max…'),
    cycle: x => sel('cycle', x.cycle, CYC),
    started: x => { const [dd, mm, yy] = fmtD(x.started).split('/'); return `<div class="sb-date" role="group" aria-label="Ngày kích hoạt (dd/mm/yyyy)"><input class="sb-seg" data-seg="d" value="${dd || ''}" placeholder="dd" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Ngày"><span class="sb-sl">/</span><input class="sb-seg" data-seg="m" value="${mm || ''}" placeholder="mm" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Tháng"><span class="sb-sl">/</span><input class="sb-seg" data-seg="y" value="${yy || ''}" placeholder="yyyy" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Năm"><button type="button" class="sb-cal" data-cal tabindex="-1" title="Chọn từ lịch" aria-label="Chọn ngày từ lịch">📅</button><input type="date" class="sb-datepick" tabindex="-1" aria-hidden="true" value="${esc(x.started)}"></div>`; },
    price: x => `<div class="sb-price"><input class="sb-in num" type="text" inputmode="decimal" data-k="price" value="${fmtNum(x.price)}" placeholder="0" autocomplete="off" aria-label="Giá gốc">
      <div class="sb-cur" role="group" aria-label="Đơn vị tính">${['VND', 'USD'].map(c => `<button type="button" data-cur="${c}" class="${x.currency === c ? 'on' : ''}" aria-pressed="${x.currency === c}">${c}</button>`).join('')}</div></div>`,
    vnd: x => vndCell(x),
    renew: x => renewCell(x),
    status: x => sel('status', x.status, ST),
    purpose: x => tx('purpose', x.purpose, 'Dùng để làm gì'),
    url: x => tx('url', x.url, 'https://…'),
    del: () => '<button type="button" class="sb-del" data-del title="Xoá dịch vụ" aria-label="Xoá dịch vụ">✕</button>',
  };
  const rowHtml = x => `<tr data-id="${x.id}" class="${live(x) ? '' : 'off'}">${shown().map(c => `<td class="${c.k === 'name' ? 'sb-c-name' : ''}${c.sys ? ' sb-sys' : ''}"${c.sys ? ` data-calc="${c.k}"` : ''}>${CELL[c.k](x)}</td>`).join('')}</tr>`;
  const headHtml = () => `<tr>${shown().map(c => `<th class="${c.k === 'name' ? 'sb-c-name' : ''}${c.sys ? ' sb-sys' : ''}">${esc(c.t)}${c.sub ? `<small>${esc(c.sub)}</small>` : ''}${c.nopick ? '' : `<span class="sb-rz" data-rz="${c.k}" title="Kéo để đổi độ rộng · bấm đúp để về mặc định"></span>`}</th>`).join('')}</tr>`;
  const colgroup = () => shown().map(c => `<col data-col="${c.k}" style="width:${width(c)}px">`).join('');
  /* sắp xếp khi mở trang: đang dùng trước, ngày gia hạn gần nhất lên đầu, chưa có ngày xuống cuối */
  const sortItems = list => list.slice().sort((a, b) => (live(b) - live(a)) || ((a.next_renew || '9999') > (b.next_renew || '9999') ? 1 : (a.next_renew || '9999') < (b.next_renew || '9999') ? -1 : a.id - b.id));
  const visible = x => (!F.cat || x.category === F.cat) && (!F.st || x.status === F.st) && (!F.q || (x.name + ' ' + x.vendor + ' ' + x.purpose + ' ' + x.plan).toLowerCase().includes(F.q.toLowerCase()));

  /* vẽ lại phần bảng (đầu bảng + dòng + độ rộng) khi đổi bộ lọc hoặc cột hiển thị */
  function drawTable(focusId) {
    const t = $('#sb-table'); if (!t) return;
    t.style.width = tableW() + 'px';
    t.innerHTML = `<colgroup>${colgroup()}</colgroup><thead>${headHtml()}</thead><tbody id="sb-rows">${sortItems(D.items).filter(visible).map(rowHtml).join('') || `<tr class="empty"><td colspan="${shown().length}" class="note">Chưa có dịch vụ nào khớp bộ lọc.</td></tr>`}</tbody>`;
    refreshCalc();
    if (focusId) { const el = t.querySelector(`tr[data-id="${focusId}"] [data-k=name]`); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); el.select(); } }
  }

  /* =========================================================
   * Trang chính
   * ========================================================= */
  async function page(focusId) {
    await load();
    $('#main').innerHTML = Q.head('Hệ thống', 'Dịch vụ & công cụ AI',
      '<button class="btn ghost sm" id="sb-csv">Tải Excel (CSV)</button><button class="btn amber sm" id="sb-add">+ Thêm dịch vụ</button>', '<span id="sb-sum"></span>')
      + `<div class="sb-kpis" id="sb-kpis"></div>
      <div class="sb-rate card"><label>Tỷ giá 1 USD = <input type="text" inputmode="decimal" id="sb-rate" value="${fmtNum(D.usd_rate)}" placeholder="Nhập tỷ giá" autocomplete="off" aria-label="Tỷ giá USD sang VND"> ₫</label><button class="btn ghost sm" id="sb-rate-save">Lưu tỷ giá</button><span class="note">Dùng để tự điền cột "Giá quy đổi (VND)" cho các dịch vụ tính bằng USD. Em không tự điền tỷ giá.</span></div>
      <section class="card panel sb-due" id="sb-due"></section>
      <div class="tools"><input type="search" id="sb-q" placeholder="Tìm theo tên, nhà cung cấp, mục đích…" value="${esc(F.q)}" aria-label="Tìm">
        <select id="sb-fc" aria-label="Lọc phân loại"><option value="">Tất cả phân loại</option>${Object.entries(CAT).map(([k, l]) => `<option value="${k}" ${F.cat === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <select id="sb-fs" aria-label="Lọc trạng thái"><option value="">Mọi trạng thái</option>${Object.entries(ST).map(([k, l]) => `<option value="${k}" ${F.st === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <div class="sb-colpick"><button type="button" class="btn ghost sm" id="sb-cols" aria-expanded="false" aria-controls="sb-colpanel">☰ Cột hiển thị</button><div class="sb-colpanel" id="sb-colpanel" hidden></div></div>
        <span class="note" id="sb-count"></span></div>
      <div class="tbl-wrap sb-wrap"><table class="sb-tbl" id="sb-table"></table></div>
      <p class="note" style="margin-top:10px">Sửa trực tiếp trên từng dòng, tự lưu khi rời khỏi ô. Kéo mép phải của tiêu đề cột để đổi độ rộng. Hai cột "tự tính" (màu nền khác) không nhập tay. Không nhập mật khẩu hay API key.</p>`;
    drawTable(focusId);
    $('#sb-add').onclick = addRow;
    $('#sb-csv').onclick = () => Q.download('subs/export.csv', 'dich-vu-cong-cu-ai.csv');
    $('#sb-q').oninput = e => { F.q = e.target.value; drawTable(); };
    $('#sb-fc').onchange = e => { F.cat = e.target.value; drawTable(); };
    $('#sb-fs').onchange = e => { F.st = e.target.value; drawTable(); };
    $('#sb-rate-save').onclick = async () => {
      try { await put('subs/settings', { usd_rate: parseMoney($('#sb-rate').value) }); toast('Đã lưu tỷ giá.'); await reloadCalc(); } catch (e) { toast(e.message, true); }
    };
    $('#sb-rate').addEventListener('input', e => maskMoney(e.target, true, e));
    const tb = $('#sb-table');
    tb.addEventListener('change', onChange);
    tb.addEventListener('input', e => {
      const sg = e.target.closest('[data-seg]'); if (sg) return onSegInput(sg);
      const pr = e.target.closest('[data-k=price]'); if (pr) { const x = itemOf(+pr.closest('tr').dataset.id); maskMoney(pr, !!x && x.currency === 'USD', e); }
    });
    tb.addEventListener('keydown', e => { if (e.target.closest('[data-seg]')) onSegKey(e); });
    tb.addEventListener('paste', e => { if (e.target.closest('[data-seg]')) onSegPaste(e); });
    tb.addEventListener('focusout', e => { const g = e.target.closest('.sb-date'); if (g && !g.contains(e.relatedTarget)) commitDate(g); });
    tb.addEventListener('focusin', e => { const sg = e.target.closest('[data-seg]'); if (sg) sg.select(); });
    tb.addEventListener('click', onClick);
    tb.addEventListener('pointerdown', onResizeStart);
    tb.addEventListener('dblclick', e => { const rz = e.target.closest('[data-rz]'); if (rz) { delete PREF.w[rz.dataset.rz]; savePref(); drawTable(); } });
    setupColPicker();
  }

  /* ---------- chọn cột hiển thị ---------- */
  function setupColPicker() {
    const btn = $('#sb-cols'), panel = $('#sb-colpanel');
    const render = () => {
      panel.innerHTML = `<h3>Chọn cột hiển thị</h3>${COLS.filter(c => !c.nopick).map(c => `<label class="${c.lock ? 'lock' : ''}"><input type="checkbox" data-col="${c.k}" ${c.lock || !PREF.hide.includes(c.k) ? 'checked' : ''} ${c.lock ? 'disabled' : ''}> ${esc(c.t)}${c.sys ? ' <small class="note">(tự tính)</small>' : ''}</label>`).join('')}
        <button type="button" class="btn ghost sm sb-reset" id="sb-reset">Đặt lại cột về mặc định</button>`;
    };
    render();
    const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.onclick = e => { e.stopPropagation(); panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); };
    panel.onclick = e => e.stopPropagation();
    panel.onchange = e => {
      const cb = e.target.closest('input[data-col]'); if (!cb) return;
      const k = cb.dataset.col; PREF.hide = PREF.hide.filter(x => x !== k); if (!cb.checked) PREF.hide.push(k);
      savePref(); drawTable();
    };
    panel.addEventListener('click', e => { if (e.target.closest('#sb-reset')) { PREF = { w: {}, hide: [] }; savePref(); render(); drawTable(); } });
    document.addEventListener('click', function off(e) { if (!document.body.contains(btn)) return document.removeEventListener('click', off); if (!panel.contains(e.target) && e.target !== btn) close(); });
    document.addEventListener('keydown', function esc2(e) { if (!document.body.contains(btn)) return document.removeEventListener('keydown', esc2); if (e.key === 'Escape') close(); });
  }

  /* ---------- kéo co dãn cột ---------- */
  function onResizeStart(e) {
    const rz = e.target.closest('[data-rz]'); if (!rz) return;
    e.preventDefault();
    const c = COLS.find(x => x.k === rz.dataset.rz), col = $(`#sb-table col[data-col="${c.k}"]`), start = e.clientX, w0 = width(c);
    rz.setPointerCapture(e.pointerId); rz.classList.add('on'); document.body.classList.add('sb-resizing');
    const move = ev => {
      const w = Math.max(c.min, Math.round(w0 + ev.clientX - start));
      PREF.w[c.k] = w; col.style.width = w + 'px'; $('#sb-table').style.width = tableW() + 'px';
    };
    const up = () => { rz.removeEventListener('pointermove', move); rz.removeEventListener('pointerup', up); rz.removeEventListener('pointercancel', up); rz.classList.remove('on'); document.body.classList.remove('sb-resizing'); savePref(); };
    rz.addEventListener('pointermove', move); rz.addEventListener('pointerup', up); rz.addEventListener('pointercancel', up);
  }

  /* cập nhật các ô tự tính + thẻ tổng hợp mà không đụng tới ô đang nhập */
  function refreshCalc() {
    $('#sb-kpis').innerHTML = kpiHtml();
    const dh = dueHtml(), box = $('#sb-due'); box.innerHTML = dh; box.hidden = !dh;
    document.querySelectorAll('#sb-rows tr[data-id]').forEach(tr => {
      const x = itemOf(+tr.dataset.id); if (!x) return;
      const v = tr.querySelector('[data-calc=vnd]'), r = tr.querySelector('[data-calc=renew]');
      if (v) v.innerHTML = vndCell(x);
      if (r) r.innerHTML = renewCell(x);
      tr.classList.toggle('off', !live(x));
    });
    const T = totals();
    $('#sb-count').textContent = `${D.items.filter(visible).length}/${D.items.length} dịch vụ`;
    $('#sb-sum').textContent = `${T.count} đang dùng${T.due ? ` · ${T.due} sắp đến hạn` : ''}`;
  }
  async function reloadCalc() { await load(); refreshCalc(); }

  /* ---------- lưu từng ô ---------- */
  async function save(id, patch, onFail) {
    try { await put('subs/item/' + id, patch); await reloadCalc(); }
    catch (e) { toast(e.message, true); if (onFail) onFail(); }
  }
  /* lưu ô ngày khi rời khỏi cả cụm dd/mm/yyyy (hoặc sau khi chọn từ lịch) */
  function commitDate(g) {
    const tr = g.closest('tr'), x = tr && itemOf(+tr.dataset.id); if (!x) return;
    const [dd, mm, yy] = segsOf(g), old = x.started || '';
    if (dd.value.length === 1) dd.value = '0' + dd.value;
    if (mm.value.length === 1) mm.value = '0' + mm.value;
    const setSegs = iso => { const f = fmtD(iso).split('/'); dd.value = f[0] || ''; mm.value = f[1] || ''; yy.value = f[2] || ''; };
    let val;
    if (!dd.value && !mm.value && !yy.value) val = '';
    else { val = parseD(`${dd.value}/${mm.value}/${yy.value}`); if (val === null) { toast('Ngày chưa đủ hoặc không hợp lệ. Anh nhập theo dạng dd/mm/yyyy, ví dụ 25/12/2026.', true); setSegs(old); return; } }
    setSegs(val);
    if (val !== old) save(x.id, { started: val }, () => setSegs(old));
  }
  function onChange(e) {
    const pick = e.target.closest('.sb-datepick'); // chọn từ lịch → đổ vào 3 ô rồi lưu
    if (pick) { const g = pick.closest('.sb-date'), f = fmtD(pick.value).split('/'); segsOf(g).forEach((el, i) => { el.value = f[i] || ''; }); return commitDate(g); }
    const el = e.target.closest('[data-k]'); if (!el) return;
    const id = +el.closest('tr').dataset.id, k = el.dataset.k, x = itemOf(id); if (!x) return;
    if (k === 'price') { const n = parseMoney(el.value), old = x.price || 0; el.value = fmtNum(n); if (n === old) return; return save(id, { price: n }, () => { el.value = fmtNum(old); }); }
    const old = x[k] ?? '';
    save(id, { [k]: el.value }, () => { el.value = old; });
  }
  function onClick(e) {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const id = +tr.dataset.id, x = itemOf(id); if (!x) return;
    const cal = e.target.closest('[data-cal]');
    if (cal) { const p = cal.closest('.sb-date').querySelector('.sb-datepick'); p.value = x.started || ''; try { p.showPicker(); } catch (er) { p.focus(); p.click(); } return; }
    const cur = e.target.closest('[data-cur]');
    if (cur) {
      if (cur.dataset.cur === x.currency) return;
      const paint = c => tr.querySelectorAll('[data-cur]').forEach(b => { const on = b.dataset.cur === c; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      paint(cur.dataset.cur);
      const patch = { currency: cur.dataset.cur };
      if (patch.currency === 'VND' && x.price % 1 !== 0) { patch.price = Math.round(x.price); tr.querySelector('[data-k=price]').value = fmtNum(patch.price); } // VND không có phần lẻ
      return save(id, patch, () => { paint(x.currency); tr.querySelector('[data-k=price]').value = fmtNum(x.price); });
    }
    const del = e.target.closest('[data-del]');
    if (del) {
      if (del.dataset.c !== '1') { del.dataset.c = '1'; del.textContent = 'Xoá?'; del.classList.add('ask'); setTimeout(() => { if (del.isConnected) { del.dataset.c = ''; del.textContent = '✕'; del.classList.remove('ask'); } }, 3500); return; }
      api('subs/item/' + id, { method: 'DELETE' }).then(async () => { toast('Đã xoá.'); tr.remove(); await reloadCalc(); }).catch(er => toast(er.message, true));
    }
  }
  async function addRow() {
    try { const r = await api('subs/item', { method: 'POST', body: JSON.stringify({ name: 'Dịch vụ mới', currency: 'USD' }) }); F.q = ''; F.cat = ''; F.st = ''; await page(r.id); toast('Đã thêm một dòng mới, anh nhập thông tin ngay trên dòng.'); }
    catch (e) { toast(e.message, true); }
  }

  Object.assign(Q.pages, { subs: page });
})();
