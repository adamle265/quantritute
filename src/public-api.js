/* ============================================================
 * Quản trị tử tế — API cho trang khách (chỉ đọc + 2 form gửi lên)
 *   GET  /api/site                 Cài đặt công khai + danh sách tool + tập mới nhất
 *   GET  /api/tools                Danh sách tool đang hiển thị
 *   GET  /api/tools/:slug          Chi tiết 1 tool
 *   GET  /api/episodes             Các tập Hành trình đã đăng
 *   GET  /api/posts?category=      Bài viết đã đăng
 *   GET  /api/posts/:slug          Chi tiết bài viết
 *   GET  /api/legal-updates        Văn bản pháp luật mới ĐÃ DUYỆT (khối cập nhật trên Cẩm nang)
 *   POST /api/requests             Đặt hàng công cụ
 *   GET  /api/topics               Blog: nhóm chủ đề đang hiện (+ số bài)
 *   GET  /api/media/:id            Ảnh blog (banner, ảnh chia sẻ)
 *   GET  /api/reflections          Góc ngẫm: sách + video đã đăng (không gửi script)
 *   GET  /api/board                Bảng ghim: đề xuất đã được duyệt lên bảng (chỉ tên, mô tả đã biên tập, trạng thái, ngày dự kiến)
 *   POST /api/board/:id            "Tôi cũng cần" (mỗi trình duyệt 1 lần / đề xuất)
 *   POST /api/bookings             Đặt lịch tư vấn 1:1
 *   POST /api/t                    v1.20 Phân tích web: lượt xem, nút bấm, tốc độ (xem src/analytics.js) – không cookie, không lưu IP
 *   POST /api/hit                  Bộ đếm công cụ {tool|slug, kind: visit|use|download} – không nhận dữ liệu người dùng
 * Trang khách KHÔNG có địa chỉ quản trị nào: quản trị chạy ở dự án riêng.
 * ============================================================ */
import { publicUpdates } from './legal-watch.js';
import { collect as waCollect } from './analytics.js'; // v1.20 Phân tích web
import { mailStatus, sendConfirm, sendWelcome, sendToolLink } from './mailer.js';
const TOOL_SLUGS = ['cam-nang-thue-2026', 'bo-cong-cu', 'ghep-doi-chieu']; // danh sách đăng ký: Cẩm nang thuế / thông báo công cụ mới
const html = (title, msg, back, backTxt = 'Mở Cẩm nang Thuế – Kế toán – Lao động →') => new Response(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f6f7fb;display:grid;place-items:center;min-height:100vh"><div style="background:#fff;border:1px solid #e2e6ee;border-radius:14px;padding:28px;max-width:440px;margin:16px;text-align:center">
<h1 style="font-size:20px;color:#1F3864">${title}</h1><p style="color:#333;line-height:1.6">${msg}</p><p><a href="${back}" style="color:#2c4d80;font-weight:700">${backTxt}</a></p></div></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
const newToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
import { ngamOn, json, now, clean, cleanMultiline, sha256, safeJson, ensureSchema, getSettings, SETTINGS, youtubeId, vnDate } from './core.js';

const TOOL_COLS = 'slug, name, grp, pain, who, status, pricing, price, price_note, featured, icon, tags, highlights, benefits, features, guide, version, released, author, url, download_url, banner_url, eta, videos, body, sort, updated_at';
const pubTool = t => ({ ...t, videos: safeJson(t.videos, []).map(v => ({ ...v, yt: youtubeId(v.url) })), featured: !!t.featured });
const pubEp = e => ({ ...e, shorts: safeJson(e.shorts, []).map(v => ({ ...v, yt: youtubeId(v.url) })), yt: youtubeId(e.youtube_url) });

async function publicSettings(env) {
  const s = await getSettings(env);
  const out = {};
  for (const [k, d] of Object.entries(SETTINGS)) if (d.public) out[k] = d.bool ? String(s[k]) === '1' : s[k];
  out.forms_open = s.forms_open === '1';
  out.booking_open = s.booking_open === '1';
  out.donate_qr = s.bank_acc && s.bank_code
    ? `https://vietqr.app/img?${new URLSearchParams({ acc: s.bank_acc, bank: s.bank_code, des: s.donate_content || '', template: 'qr_only' })}`
    : '';
  return out;
}

async function rateLimited(env, table, ipHash, max = 5) {
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ip_hash = ?1 AND created_at > ?2`)
    .bind(ipHash, now() - 3600000).first('n');
  return n >= max;
}
const ipOf = request => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '0.0.0.0';

/* ---------- v1.11 Bộ đếm công cụ ----------
 * visit: mở link công cụ – mỗi người 1 lượt/ngày/công cụ
 * use: mở, xem nội dung trong công cụ – tối đa 20 lượt/người/ngày/công cụ
 * download: bấm "Tải bản offline" – mỗi người 1 lượt/ngày/công cụ (bản offline không gửi tín hiệu nào)
 * "Người" nhận biết bằng mã băm IP trong ngày, bảng hit_seen tự xoá sau 2 ngày. */
const HIT_MAX = { visit: 1, use: 20, download: 1 };
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|zalo.*preview|preview|headless|lighthouse|pingdom|monitor|curl|wget|python-requests/i;
async function toolStats(env) {
  const today = vnDate(now());
  const { results } = await env.DB.prepare(`SELECT slug, SUM(visits) AS visits, SUM(uses) AS uses, SUM(downloads) AS downloads,
    SUM(CASE WHEN day = ?1 THEN visits ELSE 0 END) AS today_visits FROM tool_stats GROUP BY slug`).bind(today).all();
  return Object.fromEntries(results.map(r => [r.slug, { visits: r.visits || 0, uses: r.uses || 0, downloads: r.downloads || 0, today_visits: r.today_visits || 0 }]));
}
const withStats = (t, st) => ({ ...t, stats: st[t.slug] || { visits: 0, uses: 0, downloads: 0, today_visits: 0 } });
async function countHit(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false }, 400); }
  const kind = String(body.kind || ''), max = HIT_MAX[kind];
  if (!max || BOT_UA.test(request.headers.get('user-agent') || '')) return json({ ok: true });
  const ref = clean(body.slug || body.tool, 80).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(ref)) return json({ ok: false }, 400);
  // nhận cả slug database lẫn tên thư mục công cụ (link /tools/<thư-mục>/…, có thể là link đầy đủ https://…)
  const t = await env.DB.prepare(`SELECT slug FROM tools WHERE visible = 1 AND (slug = ?1 OR instr(url || '/', '/tools/' || ?1 || '/') > 0) ORDER BY slug = ?1 DESC LIMIT 1`)
    .bind(ref).first();
  if (!t) return json({ ok: false }, 404);
  const day = vnDate(now());
  const k = (await sha256(['hit', ipOf(request), t.slug, kind].join('|'))).slice(0, 24);
  const r = await env.DB.prepare(`INSERT INTO hit_seen (day, k, n) VALUES (?1, ?2, 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1 WHERE n < ?3`)
    .bind(day, k, max).run();
  if (r.meta && r.meta.changes > 0) {
    const col = kind === 'visit' ? 'visits' : kind === 'use' ? 'uses' : 'downloads';
    await env.DB.prepare(`INSERT INTO tool_stats (slug, day, ${col}) VALUES (?1, ?2, 1) ON CONFLICT(slug, day) DO UPDATE SET ${col} = ${col} + 1`).bind(t.slug, day).run();
  }
  if (Math.random() < 0.03) await env.DB.prepare(`DELETE FROM hit_seen WHERE day < ?1`).bind(vnDate(now() - 2 * 86400000)).run();
  return json({ ok: true }, 200, { 'cache-control': 'no-store' });
}

/* v1.22 Tốc độ: lưu đệm /api/site và /api/tools tại máy chủ biên Cloudflare 60 giây
 * (lượt đầu của khách mới không phải chờ database ~1 giây). Sửa ở Quản trị sẽ hiện trên web chậm nhất sau 1 phút. */
const EDGE_TTL = 60;
export async function handle(request, env, ctx) {
  const p = new URL(request.url).pathname.replace(/\/+$/, '');
  const edge = request.method === 'GET' && (p === '/api/site' || p === '/api/tools') && typeof caches !== 'undefined' && caches.default;
  if (!edge) return handleInner(request, env, ctx);
  const key = new Request(new URL(request.url).origin + p, { method: 'GET' });
  try { const hit = await caches.default.match(key); if (hit) return hit; } catch (e) { }
  const res = await handleInner(request, env, ctx);
  if (res.status !== 200) return res;
  const out = new Response(res.body, res);
  out.headers.set('cache-control', `public, max-age=20, s-maxage=${EDGE_TTL}`);
  try { const put = caches.default.put(key, out.clone()); if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put; } catch (e) { }
  return out;
}
async function handleInner(request, env, ctx) {
  const url = new URL(request.url);
  try {
    if (!env.DB) return json({ error: 'Chưa gắn database (DB).' }, 500);
    await ensureSchema(env);
    const [, a, b] = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    const M = request.method;

    /* v1.15q Tải mã QR (Tách cà phê): máy chủ lấy ảnh QR từ cài đặt tài khoản rồi trả về cùng tên miền, để nút "Tải mã QR" lưu được file */
    if (a === 'qr' && M === 'GET') {
      const s = await getSettings(env);
      if (!(s.bank_acc && s.bank_code)) return json({ error: 'Chưa cài tài khoản nhận.' }, 404);
      const src = `https://vietqr.app/img?${new URLSearchParams({ acc: s.bank_acc, bank: s.bank_code, des: s.donate_content || '', template: 'qr_only' })}`;
      const r = await fetch(src, { cf: { cacheTtl: 3600 } });
      if (!r.ok) return json({ error: 'Chưa tải được mã QR, anh/chị thử lại sau.' }, 502);
      const ct = r.headers.get('content-type') || 'image/png', ext = /jpe?g/.test(ct) ? 'jpg' : /svg/.test(ct) ? 'svg' : 'png';
      return new Response(r.body, { headers: { 'content-type': ct, 'cache-control': 'public, max-age=600',
        ...(url.searchParams.get('tai') ? { 'content-disposition': `attachment; filename="ma-qr-moi-dom-tach-ca-phe.${ext}"` } : {}) } });
    }
    if (a === 'site' && M === 'GET') {
      const [settings, tools, eps, st] = await Promise.all([
        publicSettings(env),
        env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 ORDER BY sort, id`).all(),
        env.DB.prepare(`SELECT * FROM episodes WHERE visible = 1 AND status = 'published' ORDER BY sort, id DESC LIMIT 3`).all(),
        toolStats(env).catch(() => ({})),
      ]);
      return json({ settings, tools: tools.results.map(t => withStats(pubTool(t), st)), episodes: eps.results.map(pubEp) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'tools' && M === 'GET' && !b) {
      const [{ results }, st] = await Promise.all([env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 ORDER BY sort, id`).all(), toolStats(env).catch(() => ({}))]);
      return json({ tools: results.map(t => withStats(pubTool(t), st)) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'tools' && M === 'GET' && b) {
      const t = await env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 AND slug = ?1`).bind(clean(b, 80)).first();
      return t ? json({ tool: withStats(pubTool(t), await toolStats(env).catch(() => ({}))) }) : json({ error: 'Không tìm thấy công cụ.' }, 404);
    }
    if (a === 't' && M === 'POST') return await waCollect(request, env, ctx);
    if (a === 'hit' && M === 'POST') return await countHit(request, env);
    if (a === 'legal-updates' && M === 'GET') {
      const data = await publicUpdates(env, { month: clean(url.searchParams.get('month'), 7), topic: clean(url.searchParams.get('topic'), 10) });
      return json(data, 200, { 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*' });
    }
    if (a === 'episodes' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM episodes WHERE visible = 1 AND status = 'published' ORDER BY sort, id DESC`).all();
      return json({ episodes: results.map(pubEp) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if ((a === 'posts' && !(b && url.searchParams.get('xem-truoc')) || a === 'topics') && M === 'GET' && !ngamOn(await getSettings(env), 'baiviet'))
      return json(a === 'topics' ? { topics: [] } : b ? { error: 'Mục Bài viết đang được chuẩn bị.' } : { posts: [] }, b ? 404 : 200, { 'cache-control': 'public, max-age=20' });
    if (a === 'posts' && M === 'GET' && !b) {
      const cat = clean(url.searchParams.get('category'), 30);
      const st = env.DB.prepare(`SELECT slug, title, category, topics, excerpt, cover_url, cover_alt, featured, published_at, (length(body) / 1100) + 1 AS read_min
        FROM posts WHERE status = 'published' ${cat ? 'AND category = ?1' : ''} ORDER BY published_at DESC, id DESC LIMIT 300`);
      const { results } = await (cat ? st.bind(cat) : st).all();
      return json({ posts: results.map(p => ({ ...p, featured: !!p.featured })) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'posts' && M === 'GET' && b) {
      const key = clean(url.searchParams.get('xem-truoc'), 40);
      const p = await env.DB.prepare(`SELECT id, slug, title, category, topics, excerpt, body, cover_url, cover_alt, published_at, status, (length(body) / 1100) + 1 AS read_min
        FROM posts WHERE slug = ?1 AND (status = 'published' OR (?2 <> '' AND preview_key = ?2))`).bind(clean(b, 80), key).first();
      if (!p) return json({ error: 'Không tìm thấy bài viết.' }, 404);
      const first = String(p.topics || '').split(',').map(x => x.trim()).filter(Boolean)[0] || '';
      const { results: related } = await env.DB.prepare(`SELECT slug, title, topics, excerpt, cover_url, cover_alt, published_at, (length(body) / 1100) + 1 AS read_min FROM posts
        WHERE status = 'published' AND slug <> ?1 ORDER BY (instr(',' || replace(topics, ' ', '') || ',', ',' || ?2 || ',') > 0) DESC, published_at DESC, id DESC LIMIT 3`).bind(p.slug, first).all();
      return json({ post: { ...p, preview: p.status !== 'published' }, related }, 200, { 'cache-control': key ? 'no-store' : 'public, max-age=20' });
    }
    if (a === 'topics' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT slug, name, color, description FROM post_topics WHERE visible = 1 ORDER BY sort, id`).all();
      return json({ topics: results }, 200, { 'cache-control': 'public, max-age=60' });
    }
    if (a === 'media' && b && M === 'GET') {
      const r = await env.DB.prepare(`SELECT mime, data FROM media WHERE id = ?1`).bind(parseInt(b, 10) || 0).first();
      if (!r) return new Response('Không tìm thấy ảnh', { status: 404 });
      const bin = atob(r.data), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Response(buf, { headers: { 'content-type': r.mime, 'cache-control': 'public, max-age=31536000, immutable' } });
    }

    // Xác nhận / hủy đăng ký nhận email (link trong thư)
    if ((a === 'subscribe' && b === 'confirm' || a === 'unsubscribe') && M === 'GET') {
      let back = '/tools/cam-nang-thue-2026/#cap-nhat', backTxt = 'Mở Cẩm nang Thuế – Kế toán – Lao động →';
      const tk = clean(url.searchParams.get('token'), 64);
      const sub = tk.length === 32 ? await env.DB.prepare(`SELECT id, status, email, token, tool_slug FROM subscribers WHERE token = ?1`).bind(tk).first() : null;
      if (sub?.tool_slug === 'bo-cong-cu') { back = '/cong-cu'; backTxt = 'Mở Bộ công cụ →'; }
      if (!sub) return html('Liên kết không hợp lệ', 'Liên kết đã hết hạn hoặc không đúng. Bạn có thể đăng ký lại trên trang web.', back, backTxt);
      if (a === 'unsubscribe') { await env.DB.prepare(`UPDATE subscribers SET status = 'unsubscribed', updated_at = ?1 WHERE id = ?2`).bind(now(), sub.id).run();
        return html('Đã hủy đăng ký', 'Bạn sẽ không nhận thêm email từ danh sách này. Cảm ơn bạn đã theo dõi.', back, backTxt); }
      await env.DB.prepare(`UPDATE subscribers SET status = 'active', confirmed_at = ?1, updated_at = ?1 WHERE id = ?2`).bind(now(), sub.id).run();
      if (sub.status !== 'active') { // Thư 2: "Xác nhận đăng ký thành công" kèm nguyên tắc gửi thư (chỉ gửi lần đầu xác nhận)
        try { const st = await mailStatus(env); if (st.ready) await sendWelcome(env, { ...st, siteUrl: url.origin }, sub); } catch (e) { console.error(e); }
      }
      return html('Đã xác nhận', (sub.tool_slug === 'bo-cong-cu' ? 'Từ nay anh/chị sẽ nhận email lúc 10h sáng khi Bộ công cụ có công cụ mới.' : 'Từ nay anh/chị sẽ nhận email lúc 10h sáng vào ngày có cập nhật pháp lý mới đã được rà soát.') + ' Em cũng vừa gửi một thư báo đăng ký thành công vào hộp thư của anh/chị.', back, backTxt);
    }

    /* v1.22 Gửi link công cụ về email: khách xem bằng điện thoại, cần mở lại trên máy tính */
    if (a === 'send-link' && M === 'POST' && !b) {
      let body; try { body = await request.json(); } catch { return json({ error: 'Dữ liệu không hợp lệ.' }, 400); }
      if (body.website) return json({ ok: true, message: 'Em đã gửi link vào email của anh/chị.' }); // bẫy bot
      const email = clean(body.email, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ error: 'Email chưa đúng định dạng ạ.' }, 422);
      const ref = clean(body.tool, 80).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(ref)) return json({ error: 'Không rõ công cụ.' }, 400);
      const tool = await env.DB.prepare(`SELECT slug, name, url FROM tools WHERE visible = 1 AND status = 'ok' AND (slug = ?1 OR instr(url || '/', '/tools/' || ?1 || '/') > 0) ORDER BY slug = ?1 DESC LIMIT 1`).bind(ref).first();
      if (!tool || !/^\/tools\//.test(tool.url || '')) return json({ error: 'Không tìm thấy công cụ.' }, 404);
      const ipHash = (await sha256('qtt|' + ipOf(request))).slice(0, 24), t = now();
      if (await rateLimited(env, 'link_requests', ipHash, 5)) return json({ error: 'Anh/chị đã gửi nhiều lần trong một giờ, thử lại sau ít phút nhé.' }, 429);
      const st = await mailStatus(env);
      if (!st.ready) return json({ error: 'Kênh gửi thư đang bảo trì, anh/chị bấm "Sao chép link" giúp em nhé.' }, 503);
      const base = new URL(request.url).origin;
      const link = `${base}${tool.url.split('#')[0]}${tool.url.includes('?') ? '&' : '?'}utm_source=email&utm_medium=gui-link`;
      let status = 'sent';
      try { await sendToolLink(env, { ...st, siteUrl: base }, { email, name: tool.name, link }); } catch (e) { console.error('send-link', e); status = 'failed'; }
      await env.DB.prepare(`INSERT INTO link_requests (tool_slug, email, status, subscribe, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)
        .bind(tool.slug, email, status, body.subscribe ? 1 : 0, ipHash, t).run();
      if (status !== 'sent') return json({ error: 'Chưa gửi được thư, anh/chị bấm "Sao chép link" giúp em nhé.' }, 502);
      let extra = '';
      if (body.subscribe) {  // tích "Báo khi có công cụ mới" → danh sách bo-cong-cu, vẫn cần bấm xác nhận trong thư riêng
        const old = await env.DB.prepare(`SELECT id, status FROM subscribers WHERE tool_slug = 'bo-cong-cu' AND email = ?1`).bind(email).first();
        if (old?.status !== 'active') {
          const token = newToken();
          if (old) await env.DB.prepare(`UPDATE subscribers SET status = 'pending', token = ?1, consent_at = ?2, ip_hash = ?3, updated_at = ?2 WHERE id = ?4`).bind(token, t, ipHash, old.id).run();
          else await env.DB.prepare(`INSERT INTO subscribers (tool_slug, email, status, token, consent_at, ip_hash, created_at, updated_at) VALUES ('bo-cong-cu', ?1, 'pending', ?2, ?3, ?4, ?3, ?3)`).bind(email, token, t, ipHash).run();
          try { await sendConfirm(env, { ...st, siteUrl: base }, { email, token, tool_slug: 'bo-cong-cu' }); extra = ' Em gửi thêm 1 thư xác nhận nhận tin công cụ mới, anh/chị bấm xác nhận giúp em nhé.'; } catch (e) { console.error(e); }
        }
      }
      return json({ ok: true, message: `Em đã gửi link vào ${email}. Anh/chị xem cả mục Spam/Quảng cáo nếu chưa thấy thư ạ.${extra}` }, 201);
    }
    if ((a === 'feedback' || a === 'subscribe') && M === 'POST' && !b) {
      let body; try { body = await request.json(); } catch { return json({ error: 'Dữ liệu không hợp lệ.' }, 400); }
      if (body.website) return json({ ok: true }); // bẫy bot
      const tool = TOOL_SLUGS.includes(body.tool) ? body.tool : TOOL_SLUGS[0];
      const s = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN ('feedback_open','subscribe_open')`).all().then(r => Object.fromEntries(r.results.map(x => [x.key, x.value])));
      const ipHash = (await sha256('qtt|' + ipOf(request))).slice(0, 24);
      const t = now();
      if (a === 'feedback') {
        if (s.feedback_open === '0') return json({ error: 'Hiện tạm ngừng nhận góp ý.' }, 403);
        const name = clean(body.name, 120), phone = clean(body.phone, 40), content = cleanMultiline(body.content, 4000).trim();
        const errs = [];
        if (name.length < 2) errs.push('Vui lòng nhập họ tên.');
        if (phone && !/^[0-9 +().-]{8,20}$/.test(phone)) errs.push('Số điện thoại chưa đúng (có thể để trống).');
        if (content.length < 5) errs.push('Vui lòng nhập nội dung góp ý.');
        if (errs.length) return json({ error: errs.join(' ') }, 422);
        if (await rateLimited(env, 'feedback', ipHash, 5)) return json({ error: 'Bạn đã gửi nhiều lần trong một giờ. Vui lòng thử lại sau.' }, 429);
        await env.DB.prepare(`INSERT INTO feedback (tool_slug, name, phone, content, page, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`)
          .bind(tool, name, phone, content, clean(body.page, 200), ipHash, t).run();
        return json({ ok: true, message: 'Cảm ơn anh/chị đã góp ý! Đốm sẽ xem và phản hồi sớm.' }, 201);
      }
      if (s.subscribe_open === '0') return json({ error: 'Hiện tạm ngừng nhận đăng ký.' }, 403);
      const email = clean(body.email, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ error: 'Email chưa đúng định dạng.' }, 422);
      if (!body.consent) return json({ error: 'Vui lòng tích đồng ý để chúng tôi lưu email và gửi cập nhật.' }, 422);
      if (await rateLimited(env, 'subscribers', ipHash, 5)) return json({ error: 'Bạn đã gửi nhiều lần trong một giờ. Vui lòng thử lại sau.' }, 429);
      const old = await env.DB.prepare(`SELECT id, status, token FROM subscribers WHERE tool_slug = ?1 AND email = ?2`).bind(tool, email).first();
      if (old?.status === 'active') return json({ ok: true, message: 'Email này đã đăng ký và đang nhận cập nhật.' });
      const token = newToken();
      if (old) await env.DB.prepare(`UPDATE subscribers SET status = 'pending', token = ?1, consent_at = ?2, ip_hash = ?3, updated_at = ?2 WHERE id = ?4`).bind(token, t, ipHash, old.id).run();
      else await env.DB.prepare(`INSERT INTO subscribers (tool_slug, email, status, token, consent_at, ip_hash, created_at, updated_at) VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?4, ?4)`).bind(tool, email, token, t, ipHash).run();
      const st = await mailStatus(env);
      if (st.ready) {
        try { await sendConfirm(env, { ...st, siteUrl: new URL(request.url).origin }, { email, token, tool_slug: tool }); return json({ ok: true, mailed: true, email, message: 'Em đã gửi thư xác nhận tới ' + email + '. Anh/chị mở hộp thư (kể cả mục Spam hoặc Quảng cáo) và bấm nút "Xác nhận nhận cập nhật" để hoàn tất đăng ký nhé.' }, 201); }
        catch (e) { console.error(e); }
      }
      return json({ ok: true, message: 'Đã ghi nhận email của bạn. Chúng tôi sẽ gửi thư xác nhận ngay khi kênh gửi thư được kích hoạt.' }, 201);
    }

    if (a === 'reflections' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT id, kind, slug, title, author, color, quotes, lessons, toc, shelf, shelf_sort, youtube_url, summary, reflection, published_at, channel, channel_sort, duration, cover_url
        FROM reflections WHERE visible = 1 AND status = 'published' ORDER BY sort, COALESCE(NULLIF(published_at,''),'9999') DESC, id DESC LIMIT 300`).all();
      const ss = await getSettings(env), on = { book: ngamOn(ss, 'sach'), video: ngamOn(ss, 'chieu') };
      /* v1.15i kênh = danh sách phát: thứ tự + ẩn/hiện lấy từ bảng kênh */
      const { results: chs } = await env.DB.prepare(`SELECT name, sort, visible FROM video_channels ORDER BY sort, id`).all().catch(() => ({ results: [] }));
      const chMap = new Map(chs.map((c, i) => [c.name, { sort: i, visible: !!c.visible }]));
      const items = results.filter(r => on[r.kind === 'video' ? 'video' : 'book']).filter(r => r.kind !== 'video' || !r.channel || !chMap.has(r.channel) || chMap.get(r.channel).visible)
        .map(r => ({ ...r, channel_sort: r.kind === 'video' ? (chMap.has(r.channel) ? chMap.get(r.channel).sort : 9999) : r.channel_sort, yt: youtubeId(r.youtube_url) }));
      return json({ items }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'board' && !b && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT id, board_title, board_desc, board_note, board_link, status, votes, eta, eta_prev, tool_slug, updated_at
        FROM requests WHERE on_board = 1 AND board_title <> '' ORDER BY votes DESC, id DESC LIMIT 300`).all();
      return json({ items: results }, 200, { 'cache-control': 'public, max-age=15' });
    }
    if (a === 'board' && b && M === 'POST') {
      const id = parseInt(b, 10) || 0;
      let body = {}; try { body = await request.json(); } catch { }
      const voter = clean(body.cid, 40);
      if (!/^[a-z0-9]{12,40}$/i.test(voter)) return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
      const r = await env.DB.prepare(`SELECT id FROM requests WHERE id = ?1 AND on_board = 1 AND status NOT IN ('done', 'rejected')`).bind(id).first();
      if (!r) return json({ error: 'Không tìm thấy.' }, 404);
      const ipHash = (await sha256('qtt|' + ipOf(request))).slice(0, 24);
      const sameIp = await env.DB.prepare(`SELECT COUNT(*) AS n FROM request_votes WHERE request_id = ?1 AND ip_hash = ?2`).bind(id, ipHash).first('n');
      let added = false;
      if (sameIp < 5) {
        const ins = await env.DB.prepare(`INSERT OR IGNORE INTO request_votes (request_id, voter, ip_hash, created_at) VALUES (?1, ?2, ?3, ?4)`).bind(id, voter, ipHash, now()).run();
        added = !!ins.meta.changes;
        if (added) await env.DB.prepare(`UPDATE requests SET votes = votes + 1 WHERE id = ?1`).bind(id).run();
      }
      const votes = await env.DB.prepare(`SELECT votes FROM requests WHERE id = ?1`).bind(id).first('votes');
      return json({ ok: true, votes, added });
    }
    if ((a === 'requests' || a === 'bookings') && M === 'POST') {
      let body; try { body = await request.json(); } catch { return json({ error: 'Dữ liệu không hợp lệ.' }, 400); }
      if (body.website) return json({ ok: true }); // bẫy bot: giả vờ thành công
      const s = await getSettings(env);
      const ipHash = (await sha256('qtt|' + ipOf(request))).slice(0, 24);
      const t = now();
      if (a === 'requests') {
        if (s.forms_open !== '1') return json({ error: 'Hiện Đốm tạm ngừng nhận đề xuất, anh/chị quay lại sau nhé.' }, 403);
        const pain = cleanMultiline(body.pain, 2000).trim();
        if (pain.length < 10) return json({ error: 'Anh/chị kể cụ thể hơn một chút giúp Đốm nhé (ít nhất 10 ký tự).' }, 422);
        if (await rateLimited(env, 'requests', ipHash)) return json({ error: 'Bạn đã gửi nhiều lần trong một giờ. Vui lòng thử lại sau.' }, 429);
        // v1.12: tool_ref = đề xuất thêm tính năng cho công cụ đang có (phải là công cụ có thật), để trống = công cụ mới
        let ref = clean(body.tool_ref, 80).toLowerCase();
        if (ref && !(await env.DB.prepare(`SELECT 1 AS x FROM tools WHERE slug = ?1`).bind(ref).first('x'))) ref = '';
        await env.DB.prepare(`INSERT INTO requests (pain, role, contact, tool_ref, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)
          .bind(pain, clean(body.role, 80), clean(body.contact, 160), ref, ipHash, t).run();
        return json({ ok: true }, 201);
      }
      if (s.booking_open !== '1') return json({ error: 'Hiện tạm ngừng nhận lịch tư vấn.' }, 403);
      const name = clean(body.name, 120), contact = clean(body.contact, 160);
      const errs = [];
      if (name.length < 2) errs.push('Vui lòng nhập tên.');
      if (contact.length < 6) errs.push('Vui lòng để lại số điện thoại, Zalo hoặc Email.');
      if (!body.consent) errs.push('Anh/chị tích đồng ý để Đốm lưu thông tin và liên hệ lại giúp em nhé.');
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      if (await rateLimited(env, 'bookings', ipHash, 3)) return json({ error: 'Bạn đã gửi nhiều lần trong một giờ. Vui lòng thử lại sau.' }, 429);
      await env.DB.prepare(`INSERT INTO bookings (name, contact, topic, description, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)
        .bind(name, contact, clean(body.topic, 120), cleanMultiline(body.description, 4000), ipHash, t).run();
      return json({ ok: true }, 201);
    }
    return json({ error: 'Không tìm thấy.' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Lỗi hệ thống, vui lòng thử lại.' }, 500);
  }
}
