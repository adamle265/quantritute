/* Quản trị tử tế — Phân tích web (v1.20, 18/10/2026)
 * Số liệu tự đo của web (src/analytics.js): lưu lượng & nguồn, hành vi, phễu Bộ công cụ, chuyển đổi, tốc độ tải thực tế.
 * Heatmap + xem lại phiên: Microsoft Clarity (nhập mã dự án ở cuối trang; người dùng phải bấm Đồng ý mới nạp).
 * Dùng chung đăng nhập và tiện ích của admin.js qua window.QTT. */
(() => {
  'use strict';
  const Q = window.QTT;
  if (!Q) return;
  const { esc, api, toast } = Q;
  const $ = s => document.querySelector(s);
  let days = 30;

  const nf = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
  const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;
  const pctS = v => String(v).replace('.', ',') + '%';
  const dur = ms => { ms = Math.round((ms || 0) / 1000); if (!ms) return '–'; const m = Math.floor(ms / 60), s = ms % 60; return m ? `${m} phút ${String(s).padStart(2, '0')} giây` : `${s} giây`; };
  const durS = ms => { ms = Math.round((ms || 0) / 1000); if (!ms) return '–'; const m = Math.floor(ms / 60), s = ms % 60; return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`; };
  const ddmm = d => d.slice(8, 10) + '/' + d.slice(5, 7);
  const dmy = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
  const COUNTRY = { VN: 'Việt Nam', US: 'Hoa Kỳ', SG: 'Singapore', JP: 'Nhật Bản', KR: 'Hàn Quốc', AU: 'Úc', DE: 'Đức', FR: 'Pháp', GB: 'Anh', CA: 'Canada', TW: 'Đài Loan', CN: 'Trung Quốc', TH: 'Thái Lan', MY: 'Malaysia', '': 'Không rõ' };
  const PAGE = { '/': 'Trang chủ', '/cong-cu': 'Bộ công cụ', '/bang-ghim': 'Bảng ghim', '/goc-ngam': 'Góc ngẫm', '/goc-ngam?phong=sach': 'Góc ngẫm · Tủ sách', '/goc-ngam?phong=chieu': 'Góc ngẫm · Phòng chiếu',
    '/goc-ngam?phong=bai-viet': 'Góc ngẫm · Bài viết', '/tach-ca-phe': 'Tách cà phê', '/ve-dom': 'Về Đốm', '/hanh-trinh': 'Hành trình' };
  let TN = {};
  const pageName = p => { if (!p) return '–'; if (PAGE[p]) return PAGE[p]; if (TN[p]) return (p.startsWith('/tools/') ? 'Dùng công cụ: ' : 'Chi tiết công cụ: ') + TN[p];
    if (p.startsWith('/blog/')) return 'Bài viết: ' + p.slice(6); return p; };
  const pageCell = p => `<span title="${esc(p)}">${esc(pageName(p))}</span>${pageName(p) !== p ? `<small class="wa-path">${esc(p)}</small>` : ''}`;
  const delta = (a, b, inv) => { if (!b) return '<span class="wa-d">– kỳ trước</span>'; const d = Math.round((a - b) / b * 100); if (!d) return '<span class="wa-d">= kỳ trước</span>';
    const good = inv ? d < 0 : d > 0; return `<span class="wa-d ${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}% so với kỳ trước</span>`; };

  /* danh sách có thanh tỷ lệ (1 màu, chữ dùng màu chữ thường) */
  const barList = (rows, opt = {}) => {
    const tot = opt.total || rows.reduce((a, r) => a + (r.n || 0), 0), max = Math.max(1, ...rows.map(r => r.n || 0));
    if (!rows.length) return '<p class="note">Chưa có số liệu trong kỳ này.</p>';
    return `<ul class="wa-bars">${rows.map(r => `<li title="${esc((opt.name ? opt.name(r.k) : r.k) || 'Không rõ')}: ${nf(r.n)} (${pctS(pct(r.n, tot))})">
      <span class="wa-bl">${esc((opt.name ? opt.name(r.k) : r.k) || 'Không rõ')}</span><span class="wa-bv">${nf(r.n)}<small>${pctS(pct(r.n, tot))}</small></span>
      <i style="width:${Math.max(2, r.n / max * 100)}%"></i></li>`).join('')}</ul>`;
  };

  /* biểu đồ đường theo ngày: 1 chuỗi (lượt xem), rê chuột xem cả phiên và người */
  function lineChart(series) {
    const W = 900, H = 220, P = { l: 44, r: 14, t: 14, b: 26 };
    const max = Math.max(4, ...series.map(d => d.views)), step = Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1);
    const top = Math.ceil(max / step) * step, n = series.length;
    const x = i => P.l + (n === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (n - 1)), y = v => H - P.b - v / top * (H - P.t - P.b);
    const grid = []; for (let v = 0; v <= top; v += step) grid.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="wa-grid"/><text x="${P.l - 8}" y="${y(v) + 4}" class="wa-ax" text-anchor="end">${nf(v)}</text>`);
    const lab = []; const every = Math.ceil(n / 10); series.forEach((d, i) => { if (i % every === 0 || i === n - 1) lab.push(`<text x="${x(i)}" y="${H - 8}" class="wa-ax" text-anchor="middle">${ddmm(d.day)}</text>`); });
    const pts = series.map((d, i) => `${x(i)},${y(d.views)}`).join(' ');
    const area = `${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`;
    return `<div class="wa-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lượt xem trang theo ngày">${grid.join('')}${lab.join('')}
      <polygon points="${area}" class="wa-area"/><polyline points="${pts}" class="wa-line"/>
      ${n <= 45 ? series.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.views)}" r="3" class="wa-dot"/>`).join('') : ''}
      <line class="wa-cross" y1="${P.t}" y2="${H - P.b}" x1="0" x2="0" style="display:none"/>
      ${series.map((d, i) => `<rect class="wa-hit" x="${x(i) - (W - P.l - P.r) / Math.max(1, n - 1) / 2}" y="${P.t}" width="${(W - P.l - P.r) / Math.max(1, n - 1)}" height="${H - P.t - P.b}" data-i="${i}"/>`).join('')}
    </svg><div class="wa-tip" hidden></div></div>`;
  }
  function wireChart(series) {
    const box = $('.wa-chart'); if (!box) return;
    const svg = box.querySelector('svg'), tip = box.querySelector('.wa-tip'), cross = box.querySelector('.wa-cross');
    box.addEventListener('mousemove', e => {
      const r = e.target.closest && e.target.closest('.wa-hit'); if (!r) return;
      const d = series[+r.dataset.i], cx = +r.getAttribute('x') + +r.getAttribute('width') / 2;
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.display = '';
      tip.hidden = false; tip.innerHTML = `<b>${dmy(d.day)}</b><span>Lượt xem: <b>${nf(d.views)}</b></span><span>Phiên: ${nf(d.sessions)}</span><span>Người: ${nf(d.visitors)}</span>`;
      const bb = svg.getBoundingClientRect(), px = cx / 900 * bb.width; tip.style.left = Math.min(bb.width - 170, Math.max(0, px + 12)) + 'px';
    });
    box.addEventListener('mouseleave', () => { tip.hidden = true; cross.style.display = 'none'; });
  }

  /* tốc độ: ngưỡng Google (tốt / cần cải thiện / kém), luôn kèm chữ + biểu tượng, không chỉ màu */
  const VN = { lcp: ['LCP', 'Tải xong phần nội dung chính'], inp: ['INP', 'Độ nhạy khi bấm'], cls: ['CLS', 'Độ ổn định bố cục'], ttfb: ['TTFB', 'Máy chủ phản hồi'] };
  const fmtV = (k, v) => v == null ? '–' : k === 'cls' ? String(Math.round(v * 100) / 100).replace('.', ',') : v >= 1000 ? String(Math.round(v / 100) / 10).replace('.', ',') + ' s' : Math.round(v) + ' ms';
  const rate = (k, v, th) => v == null ? '' : v <= th[k][0] ? '<span class="wa-st good">✓ Tốt</span>' : v <= th[k][1] ? '<span class="wa-st warn">! Cần cải thiện</span>' : '<span class="wa-st bad">✕ Kém</span>';

  async function page() {
    const [d, st] = await Promise.all([api('analytics?days=' + days), api('settings')]);
    TN = d.toolName || {};
    const c = d.cur || {}, p = d.prev || {}, th = d.vitals.th;
    const ser = []; const by = Object.fromEntries((d.daily || []).map(r => [r.day, r]));
    for (let i = d.days - 1; i >= 0; i--) { const day = new Date(Date.parse(d.today + 'T00:00:00Z') - i * 86400000).toISOString().slice(0, 10); ser.push({ day, views: 0, sessions: 0, visitors: 0, ...(by[day] || {}) }); }
    const bounce = pct(c.bounces, c.sessions), bounceP = pct(p.bounces, p.sessions), retR = pct(c.ret_sessions, c.sessions);
    const F = d.funnel, fsteps = [['Phiên truy cập web', F.s0], ['Xem trang Bộ công cụ', F.s1], ['Mở chi tiết một công cụ', F.s2], ['Mở trang công cụ (Dùng online)', F.s3], ['Dùng công cụ (bấm, nạp file)', F.s4]];
    const cid = (st.settings.clarity_id || '').trim(), site = Q.siteBase();
    const V = d.vitals.all;
    $('#main').innerHTML = `<div class="wa-root">${Q.head('Tổng quan', 'Phân tích web', `<div class="wa-per">${[[1, 'Hôm nay'], [7, '7 ngày'], [30, '30 ngày'], [90, '90 ngày']].map(([n, t]) => `<button class="btn sm ${n === days ? '' : 'ghost'}" data-wdays="${n}">${t}</button>`).join('')}</div>`,
        `${d.days === 1 ? 'Hôm nay ' + dmy(d.today) : dmy(d.from) + ' → ' + dmy(d.today)} · <span class="wa-live"><i></i>${nf(d.live)} người đang xem (5 phút gần nhất)</span>`)}
      <div class="stats wa-kpi">
        <div class="card stat"><p class="mono">Lượt xem trang</p><p class="v">${nf(c.views)}</p>${delta(c.views, p.views)}</div>
        <div class="card stat"><p class="mono">Phiên truy cập</p><p class="v">${nf(c.sessions)}</p>${delta(c.sessions, p.sessions)}</div>
        <div class="card stat"><p class="mono">Người truy cập</p><p class="v">${nf(c.visitors)}</p>${delta(c.visitors, p.visitors)}</div>
        <div class="card stat"><p class="mono">Thời gian TB / phiên</p><p class="v">${durS(c.avg_dur)}</p>${delta(c.avg_dur, p.avg_dur)}</div>
        <div class="card stat"><p class="mono">Trang / phiên</p><p class="v">${String(c.pv_per_s || 0).replace('.', ',')}</p>${delta(c.pv_per_s, p.pv_per_s)}</div>
        <div class="card stat"><p class="mono">Tỷ lệ thoát</p><p class="v">${pctS(bounce)}</p>${delta(bounce, bounceP, true)}</div>
        <div class="card stat"><p class="mono">Khách quay lại</p><p class="v">${pctS(retR)}</p><span class="wa-d">${nf(c.ret_sessions)} phiên</span></div>
        <div class="card stat"><p class="mono">Chuyển đổi</p><p class="v">${nf((d.convs || []).reduce((a, r) => a + r.n, 0))}</p><span class="wa-d">đăng ký, đề xuất, đặt lịch</span></div>
      </div>

      <div class="card panel wa-sec"><h2>Lượt xem trang theo ngày</h2>${lineChart(ser)}</div>

      <h2 class="wa-h">1. Lưu lượng & nguồn</h2>
      <div class="wa-grid3">
        <div class="card panel"><h3>Nguồn vào web</h3><p class="note">Tính theo phiên. "Trực tiếp": gõ địa chỉ, dấu trang hoặc app không gửi nguồn.</p>${barList(d.sources)}</div>
        <div class="card panel"><h3>Thiết bị</h3>${barList(d.devices)}<h3 style="margin-top:14px">Hệ điều hành</h3>${barList(d.oss)}</div>
        <div class="card panel"><h3>Trình duyệt / app</h3>${barList(d.browsers)}<h3 style="margin-top:14px">Quốc gia</h3>${barList(d.countries, { name: k => COUNTRY[k] || k })}</div>
      </div>
      <div class="two">
        <div class="card panel"><h3>Trang giới thiệu (web khác dẫn link)</h3>${barList(d.refs)}</div>
        <div class="card panel"><h3>Chiến dịch (link gắn utm_ hoặc ?nguon=)</h3>${(d.utm || []).length ? `<div class="tbl-wrap"><table><thead><tr><th>Nguồn</th><th>Kênh</th><th>Chiến dịch</th><th>Phiên</th></tr></thead><tbody>${d.utm.map(r => `<tr><td>${esc(r.s || '–')}</td><td>${esc(r.m || '–')}</td><td>${esc(r.c || '–')}</td><td>${nf(r.n)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Chưa có. Khi đăng link lên kênh, gắn thêm <code>?nguon=tiktok</code> (hoặc <code>utm_source</code>, <code>utm_campaign</code>) để biết bài nào kéo người vào.</p>'}</div>
      </div>

      <h2 class="wa-h">2. Hành vi trên trang</h2>
      <div class="card panel"><h3>Trang được xem nhiều</h3><div class="tbl-wrap"><table><thead><tr><th>Trang</th><th class="r">Lượt xem</th><th class="r">Phiên</th><th class="r">Thời gian TB</th><th class="r">Cuộn TB</th></tr></thead>
        <tbody>${(d.pages || []).map(r => `<tr><td>${pageCell(r.k)}</td><td class="r">${nf(r.views)}</td><td class="r">${nf(r.sessions)}</td><td class="r">${durS(r.dur)}</td><td class="r">${r.scroll == null ? '–' : r.scroll + '%'}</td></tr>`).join('') || '<tr><td colspan="5" class="note">Chưa có số liệu.</td></tr>'}</tbody></table></div></div>
      <div class="wa-grid3">
        <div class="card panel"><h3>Trang vào đầu tiên</h3>${barList(d.entries, { name: pageName })}</div>
        <div class="card panel"><h3>Trang rời web</h3>${barList(d.exits, { name: pageName })}</div>
        <div class="card panel"><h3>Đường đi phổ biến</h3>${(d.flows || []).length ? `<ul class="wa-flow">${d.flows.map(r => `<li><span>${esc(pageName(r.a))}</span><b>→</b><span>${esc(pageName(r.b))}</span><em>${nf(r.n)}</em></li>`).join('')}</ul>` : '<p class="note">Chưa có số liệu.</p>'}</div>
      </div>
      <div class="card panel wa-sec"><h3>Nút & link được bấm</h3><div class="tbl-wrap"><table><thead><tr><th>Nút / link</th><th>Dẫn tới</th><th>Ở trang</th><th class="r">Lượt bấm</th><th class="r">Phiên</th></tr></thead>
        <tbody>${(d.clicks || []).map(r => `<tr><td>${esc(r.k)}</td><td>${r.to_ ? esc(pageName(r.to_)) : '–'}</td><td>${esc(pageName(r.path))}</td><td class="r">${nf(r.n)}</td><td class="r">${nf(r.s)}</td></tr>`).join('') || '<tr><td colspan="5" class="note">Chưa có số liệu.</td></tr>'}</tbody></table></div></div>

      <h2 class="wa-h">3. Phễu chuyển đổi</h2>
      <div class="two">
        <div class="card panel"><h3>Phễu Bộ công cụ (đếm theo phiên)</h3><ol class="wa-fun">${fsteps.map(([t, n], i) => `<li><div><span>${i + 1}. ${t}</span><b>${nf(n)}</b></div><i style="width:${Math.max(1, pct(n, fsteps[0][1] || 1))}%"></i>
          <small>${i ? `${pctS(pct(n, fsteps[i - 1][1]))} từ bước trước · ${pctS(pct(n, fsteps[0][1]))} tổng phiên` : '100%'}</small></li>`).join('')}</ol></div>
        <div class="card panel"><h3>Chuyển đổi khác</h3>${(d.convs || []).length ? `<div class="tbl-wrap"><table><thead><tr><th>Hành động</th><th class="r">Lượt</th><th class="r">Phiên</th><th class="r">Tỷ lệ / phiên</th></tr></thead><tbody>${d.convs.map(r => `<tr><td>${esc(r.k)}</td><td class="r">${nf(r.n)}</td><td class="r">${nf(r.s)}</td><td class="r">${pctS(pct(r.s, c.sessions))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Chưa có lượt đăng ký nhận tin, gửi đề xuất, đặt lịch hay góp ý nào trong kỳ này.</p>'}</div>
      </div>

      <h2 class="wa-h">4. Tốc độ thực tế của người dùng</h2>
      <p class="note">Số đo trên máy người dùng thật, giá trị p75 (75% lượt xem nhanh hơn mức này), ngưỡng theo chuẩn Core Web Vitals của Google. ${nf(V.n)} lượt đo trong kỳ.</p>
      <div class="stats wa-vit">${['lcp', 'inp', 'cls', 'ttfb'].map(k => `<div class="card stat"><p class="mono">${VN[k][0]} · ${VN[k][1]}</p><p class="v">${fmtV(k, V[k])}</p>${rate(k, V[k], th) || '<span class="wa-d">chưa đủ số đo</span>'}<small class="note">Tốt ≤ ${fmtV(k, th[k][0])}</small></div>`).join('')}</div>
      <div class="wa-vt">
        <div class="card panel"><h3>Theo thiết bị</h3>${vtable(d.vitals.devices, th, k => esc(k))}</div>
        <div class="card panel"><h3>Theo trang (trang mở đầu tiên trong tab)</h3>${vtable(d.vitals.pages, th, pageCell)}</div>
      </div>

      <h2 class="wa-h">Heatmap & xem lại phiên (Microsoft Clarity)</h2>
      <div class="card panel wa-cl">
        <div><label for="wa-cid">Mã dự án Clarity (Project ID)</label>
          <div class="wa-cl-row"><input id="wa-cid" value="${esc(cid)}" placeholder="VD: abcd1234ef" maxlength="20" autocomplete="off"><button class="btn sm" id="wa-csave">Lưu</button>
          ${cid ? `<a class="btn sm ghost" href="https://clarity.microsoft.com/projects/view/${esc(cid)}/dashboard" target="_blank" rel="noopener">Mở Clarity ↗</a>` : ''}</div>
          <p class="note">${cid ? '✓ Đang bật. Người dùng thấy một ô hỏi đồng ý ở góc dưới; chỉ ai bấm "Đồng ý" mới được ghi heatmap, phiên xem lại. Trang công cụ (/tools/…) không bao giờ nạp Clarity.' : 'Chưa bật. Làm 1 lần:'}</p>
          ${cid ? '' : `<ol class="note wa-steps"><li>Vào <a href="https://clarity.microsoft.com" target="_blank" rel="noopener">clarity.microsoft.com</a>, đăng nhập bằng tài khoản Microsoft hoặc Google.</li><li>Bấm <b>New project</b>, tên: Quản trị tử tế, Website URL: https://quantritute.com.</li><li>Vào <b>Settings → Overview</b>, chép <b>Project ID</b> (chuỗi khoảng 10 ký tự) dán vào ô trên rồi bấm Lưu. Không cần dán đoạn mã cài đặt.</li></ol>`}
        </div>
        <div class="wa-me"><h3>Không đếm máy của anh</h3><p class="note">Mở link dưới trên từng máy/trình duyệt anh hay dùng để lượt xem của chính anh không làm lệch số liệu.</p>
          <p><a class="btn sm ghost" href="${esc(site)}/?khong-dem=1" target="_blank" rel="noopener">Không đếm trình duyệt này ↗</a> <a class="note" href="${esc(site)}/?dem-lai=1" target="_blank" rel="noopener">Đếm lại</a></p></div>
      </div>
      <p class="note" style="margin-top:12px">Riêng tư: không cookie, không lưu IP, không ghi nội dung người dùng gõ hay nạp vào công cụ. "Người truy cập" là ước tính trong từng ngày (cộng dồn các ngày). Dữ liệu tự xoá sau 400 ngày.</p></div>`;
    wireChart(ser);
    $('#main').querySelectorAll('[data-wdays]').forEach(b => b.onclick = () => { days = +b.dataset.wdays; Q.nav('analytics'); });
    $('#wa-csave').onclick = async () => {
      const v = $('#wa-cid').value.trim();
      if (v && !/^[a-z0-9]{6,20}$/i.test(v)) { toast('Mã dự án Clarity chỉ gồm chữ và số (6–20 ký tự).'); return; }
      await api('settings', { method: 'POST', body: JSON.stringify({ clarity_id: v }) });
      toast(v ? 'Đã lưu. Clarity bật trên web trong vòng 1 phút.' : 'Đã tắt Clarity.'); Q.nav('analytics');
    };
  }
  function vtable(rows, th, name) {
    if (!rows || !rows.length) return '<p class="note">Chưa có số đo.</p>';
    return `<div class="tbl-wrap"><table><thead><tr><th></th><th class="r">Lượt đo</th>${['lcp', 'inp', 'cls', 'ttfb'].map(k => `<th class="r">${VN[k][0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr><td style="white-space:normal">${name(r.k)}</td><td class="r">${nf(r.n)}</td>${['lcp', 'inp', 'cls', 'ttfb'].map(k => `<td class="r">${fmtV(k, r[k])} ${rate(k, r[k], th)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  Object.assign(Q.pages, { analytics: page });
})();
