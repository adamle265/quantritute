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
 *   POST /api/bookings             Đặt lịch tư vấn 1:1
 * Trang khách KHÔNG có địa chỉ quản trị nào: quản trị chạy ở dự án riêng.
 * ============================================================ */
import { publicUpdates } from './legal-watch.js';
import { mailStatus, sendConfirm } from './mailer.js';
const TOOL_SLUGS = ['cam-nang-thue-2026'];
const html = (title, msg, back) => new Response(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f6f7fb;display:grid;place-items:center;min-height:100vh"><div style="background:#fff;border:1px solid #e2e6ee;border-radius:14px;padding:28px;max-width:440px;margin:16px;text-align:center">
<h1 style="font-size:20px;color:#1F3864">${title}</h1><p style="color:#333;line-height:1.6">${msg}</p><p><a href="${back}" style="color:#2c4d80;font-weight:700">Mở Cẩm nang Thuế – Kế toán – Lao động →</a></p></div></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
const newToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
import { json, now, clean, cleanMultiline, sha256, safeJson, ensureSchema, getSettings, SETTINGS, youtubeId } from './core.js';

const TOOL_COLS = 'slug, name, grp, pain, who, status, pricing, price, price_note, featured, icon, tags, highlights, features, guide, version, released, author, url, download_url, banner_url, videos, body, sort, updated_at';
const pubTool = t => ({ ...t, videos: safeJson(t.videos, []).map(v => ({ ...v, yt: youtubeId(v.url) })), featured: !!t.featured });
const pubEp = e => ({ ...e, shorts: safeJson(e.shorts, []).map(v => ({ ...v, yt: youtubeId(v.url) })), yt: youtubeId(e.youtube_url) });

async function publicSettings(env) {
  const s = await getSettings(env);
  const out = {};
  for (const [k, d] of Object.entries(SETTINGS)) if (d.public) out[k] = s[k];
  out.forms_open = s.forms_open === '1';
  out.booking_open = s.booking_open === '1';
  out.donate_qr = s.bank_acc && s.bank_code
    ? `https://vietqr.app/img?${new URLSearchParams({ acc: s.bank_acc, bank: s.bank_code, des: s.donate_content || '', template: 'compact' })}`
    : '';
  return out;
}

async function rateLimited(env, table, ipHash, max = 5) {
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ip_hash = ?1 AND created_at > ?2`)
    .bind(ipHash, now() - 3600000).first('n');
  return n >= max;
}
const ipOf = request => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '0.0.0.0';

export async function handle(request, env, ctx) {
  const url = new URL(request.url);
  try {
    if (!env.DB) return json({ error: 'Chưa gắn database (DB).' }, 500);
    await ensureSchema(env);
    const [, a, b] = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    const M = request.method;

    if (a === 'site' && M === 'GET') {
      const [settings, tools, eps] = await Promise.all([
        publicSettings(env),
        env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 ORDER BY sort, id`).all(),
        env.DB.prepare(`SELECT * FROM episodes WHERE visible = 1 AND status = 'published' ORDER BY sort, id DESC LIMIT 3`).all(),
      ]);
      return json({ settings, tools: tools.results.map(pubTool), episodes: eps.results.map(pubEp) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'tools' && M === 'GET' && !b) {
      const { results } = await env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 ORDER BY sort, id`).all();
      return json({ tools: results.map(pubTool) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'tools' && M === 'GET' && b) {
      const t = await env.DB.prepare(`SELECT ${TOOL_COLS} FROM tools WHERE visible = 1 AND slug = ?1`).bind(clean(b, 80)).first();
      return t ? json({ tool: pubTool(t) }) : json({ error: 'Không tìm thấy công cụ.' }, 404);
    }
    if (a === 'legal-updates' && M === 'GET') {
      const data = await publicUpdates(env, { month: clean(url.searchParams.get('month'), 7), topic: clean(url.searchParams.get('topic'), 10) });
      return json(data, 200, { 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*' });
    }
    if (a === 'episodes' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM episodes WHERE visible = 1 AND status = 'published' ORDER BY sort, id DESC`).all();
      return json({ episodes: results.map(pubEp) }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'posts' && M === 'GET' && !b) {
      const cat = clean(url.searchParams.get('category'), 30);
      const st = env.DB.prepare(`SELECT slug, title, category, excerpt, cover_url, published_at FROM posts WHERE status = 'published' ${cat ? 'AND category = ?1' : ''} ORDER BY published_at DESC, id DESC LIMIT 200`);
      const { results } = await (cat ? st.bind(cat) : st).all();
      return json({ posts: results }, 200, { 'cache-control': 'public, max-age=20' });
    }
    if (a === 'posts' && M === 'GET' && b) {
      const p = await env.DB.prepare(`SELECT slug, title, category, excerpt, body, cover_url, published_at FROM posts WHERE status = 'published' AND slug = ?1`).bind(clean(b, 80)).first();
      return p ? json({ post: p }) : json({ error: 'Không tìm thấy bài viết.' }, 404);
    }

    // Xác nhận / hủy đăng ký nhận email (link trong thư)
    if ((a === 'subscribe' && b === 'confirm' || a === 'unsubscribe') && M === 'GET') {
      const back = '/tools/cam-nang-thue-2026/#cap-nhat';
      const tk = clean(url.searchParams.get('token'), 64);
      const sub = tk.length === 32 ? await env.DB.prepare(`SELECT id, status FROM subscribers WHERE token = ?1`).bind(tk).first() : null;
      if (!sub) return html('Liên kết không hợp lệ', 'Liên kết đã hết hạn hoặc không đúng. Bạn có thể đăng ký lại trên Cẩm nang.', back);
      if (a === 'unsubscribe') { await env.DB.prepare(`UPDATE subscribers SET status = 'unsubscribed', updated_at = ?1 WHERE id = ?2`).bind(now(), sub.id).run();
        return html('Đã hủy đăng ký', 'Bạn sẽ không nhận thêm email cập nhật pháp lý. Cảm ơn bạn đã theo dõi.', back); }
      await env.DB.prepare(`UPDATE subscribers SET status = 'active', confirmed_at = ?1, updated_at = ?1 WHERE id = ?2`).bind(now(), sub.id).run();
      return html('Đã xác nhận', 'Từ nay bạn sẽ nhận email khi có cập nhật pháp lý mới đã được rà soát (chỉ gửi vào ngày có tin mới).', back);
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
        return json({ ok: true, message: 'Cảm ơn anh/chị đã góp ý! Tuấn sẽ xem và phản hồi sớm.' }, 201);
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
        try { await sendConfirm(env, { ...st, siteUrl: new URL(request.url).origin }, { email, token }); return json({ ok: true, message: 'Đã ghi nhận. Bạn mở email (kể cả mục Spam/Quảng cáo) và bấm "Xác nhận" để bắt đầu nhận cập nhật.' }, 201); }
        catch (e) { console.error(e); }
      }
      return json({ ok: true, message: 'Đã ghi nhận email của bạn. Chúng tôi sẽ gửi thư xác nhận ngay khi kênh gửi thư được kích hoạt.' }, 201);
    }

    if ((a === 'requests' || a === 'bookings') && M === 'POST') {
      let body; try { body = await request.json(); } catch { return json({ error: 'Dữ liệu không hợp lệ.' }, 400); }
      if (body.website) return json({ ok: true }); // bẫy bot: giả vờ thành công
      const s = await getSettings(env);
      const ipHash = (await sha256('qtt|' + ipOf(request))).slice(0, 24);
      const t = now();
      if (a === 'requests') {
        if (s.forms_open !== '1') return json({ error: 'Hiện tạm ngừng nhận đặt hàng công cụ.' }, 403);
        const pain = cleanMultiline(body.pain, 2000).trim();
        if (pain.length < 10) return json({ error: 'Bạn mô tả việc đang làm cụ thể hơn một chút nhé (ít nhất 10 ký tự).' }, 422);
        if (await rateLimited(env, 'requests', ipHash)) return json({ error: 'Bạn đã gửi nhiều lần trong một giờ. Vui lòng thử lại sau.' }, 429);
        await env.DB.prepare(`INSERT INTO requests (pain, role, contact, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)`)
          .bind(pain, clean(body.role, 80), clean(body.contact, 160), ipHash, t).run();
        return json({ ok: true }, 201);
      }
      if (s.booking_open !== '1') return json({ error: 'Hiện tạm ngừng nhận lịch tư vấn.' }, 403);
      const name = clean(body.name, 120), contact = clean(body.contact, 160);
      const errs = [];
      if (name.length < 2) errs.push('Vui lòng nhập tên.');
      if (contact.length < 6) errs.push('Vui lòng để lại số điện thoại, Zalo hoặc email.');
      if (!body.consent) errs.push('Vui lòng đồng ý để Tuấn lưu thông tin và liên hệ lại.');
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
