// 11/11 19:55: database mới qtt-tuyen-dung-thu-db báo lỗi 10021 khi nối → dùng chung qtt-cham-cong-thu-db, mọi bảng có tiền tố td_ (không đụng bảng chấm công)
// CỔNG TUYỂN DỤNG – BẢN THỬ NGHIỆM (recruit.quantritute.com) · 11/11/2026, anh Tuấn chốt 19:32: "phương án 1, link recruit.quantritute.com, không dùng R2"
// Phạm vi: dữ liệu mẫu của bản dùng thử Phần mềm nhân sự. Mỗi trình duyệt dùng thử có 1 mã cổng (tok, công khai trong link) + 1 khóa bí mật (key, chỉ trình duyệt đó giữ).
//  - Trang cổng: GET /t/<tok>/<công ty>[/<vị trí>]  → HTML do phần mềm dựng sẵn và gửi lên (tdPortalHtml, mode 'live').
//  - Ứng viên nộp: POST /api/ung-tuyen (multipart) → lưu hồ sơ + CV (D1, CV chia phần ≤ 1,5 MB vì D1 giới hạn 2 MB mỗi dòng).
//  - Phần mềm: POST /api/cong (đưa trang lên), GET /api/cong/ho-so (lấy hồ sơ mới), GET /api/cong/cv (tải CV), POST /api/cong/da-lay (xóa sau khi lấy), POST /api/cong/tat.
//  - Tự xóa: hồ sơ, CV, trang cổng quá 24 giờ (cron mỗi giờ + dọn khi có yêu cầu). Hồ sơ đã lấy về phần mềm bị xóa ngay trên máy chủ.
const TTL = 24 * 3600 * 1000, CV_MAX = 5 * 1024 * 1024, PART = 1500000;
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS td_cong (tok TEXT PRIMARY KEY, key_hash TEXT NOT NULL, slug TEXT, ten TEXT, html TEXT, jobs TEXT, tao INTEGER, cap_nhat INTEGER)`,
  `CREATE TABLE IF NOT EXISTS td_ho_so (ma TEXT PRIMARY KEY, tok TEXT NOT NULL, job TEXT, du_lieu TEXT, cv_ten TEXT, cv_loai TEXT, cv_size INTEGER, cv_parts INTEGER DEFAULT 0, ip TEXT, tao INTEGER)`,
  `CREATE INDEX IF NOT EXISTS td_ho_so_tok ON td_ho_so (tok, tao)`,
  `CREATE TABLE IF NOT EXISTS td_cv_part (ma TEXT NOT NULL, i INTEGER NOT NULL, data BLOB, PRIMARY KEY (ma, i))`
];
let READY = false;
async function ensure(db) { if (READY) return; await db.batch(SCHEMA.map(s => db.prepare(s))); READY = true; }
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Robots-Tag': 'noindex, nofollow' };
const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...SEC } });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okTok = t => /^[a-z0-9]{8,16}$/.test(t || '');
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function auth(db, tok, key) { if (!okTok(tok) || !key || key.length < 20) return null; const r = await db.prepare('SELECT * FROM td_cong WHERE tok = ?').bind(tok).first(); if (!r) return null; return r.key_hash === await sha(key) ? r : false; }
async function clean(db) {
  const lim = Date.now() - TTL;
  await db.batch([db.prepare('DELETE FROM td_cv_part WHERE ma IN (SELECT ma FROM td_ho_so WHERE tao < ?)').bind(lim), db.prepare('DELETE FROM td_ho_so WHERE tao < ?').bind(lim), db.prepare('DELETE FROM td_cong WHERE cap_nhat < ?').bind(lim)]);
}
async function delHs(db, mas) { if (!mas.length) return; const q = mas.map(() => '?').join(','); await db.batch([db.prepare('DELETE FROM td_cv_part WHERE ma IN (' + q + ')').bind(...mas), db.prepare('DELETE FROM td_ho_so WHERE ma IN (' + q + ')').bind(...mas)]); }
// giới hạn nộp đơn đơn giản theo IP (trong bộ nhớ của máy chủ đang chạy – đủ chặn bấm liên tục)
const HITS = new Map();
function tooMany(ip) { const now = Date.now(), a = (HITS.get(ip) || []).filter(t => now - t < 600000); a.push(now); HITS.set(ip, a); if (HITS.size > 5000) HITS.clear(); return a.length > 12; }

function page(title, body, st = 200) {
  return new Response('<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="icon" href="https://quantritute.com/favicon.svg"><title>' + esc(title) + '</title><style>body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;background:#F4EFE5;color:#231E19;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}.b{max-width:560px;background:#fff;border:1px solid #E3D9C6;border-radius:18px;padding:28px}h1{font-size:22px;margin:0 0 10px}p{line-height:1.6;color:#5c544a;margin:0 0 10px}a{color:#3E6B34;font-weight:600}</style></head><body><div class="b">' + body + '</div></body></html>', { status: st, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...SEC } });
}
const HOME = '<h1>Cổng tuyển dụng – bản thử nghiệm</h1><p>Đây là máy chủ thử của Phần mềm quản lý nhân sự (Quản trị tử tế). Mỗi người dùng thử có một link cổng riêng, chạy với <b>dữ liệu mẫu hư cấu</b>; trang và hồ sơ tự xóa sau 24 giờ.</p><p>Mở phần mềm tại <a href="https://quantritute.com/quan-ly-nhan-su">quantritute.com/quan-ly-nhan-su</a> → Tuyển dụng → Cổng tuyển dụng → Mở link.</p>';
const GONE = '<h1>Link cổng thử đã hết hạn</h1><p>Link cổng tuyển dụng thử nghiệm chỉ dùng được trong 24 giờ, sau đó trang và hồ sơ tự xóa.</p><p>Người dùng thử mở lại phần mềm → Tuyển dụng → Cổng tuyển dụng → <b>Mở link</b> để có link mới.</p>';

export default {
  async scheduled(ev, env) { await ensure(env.DB); await clean(env.DB); },
  async fetch(req, env, ctx) {
    const url = new URL(req.url), p = url.pathname.replace(/\/+$/, '') || '/', db = env.DB;
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      await ensure(db);
      if (Math.random() < 0.05) ctx.waitUntil(clean(db));
      // ---- trang cổng ----
      if (req.method === 'GET' && (p === '/' || p === '/index.html')) return page('Cổng tuyển dụng thử nghiệm', HOME);
      if (req.method === 'GET' && (p === '/favicon.ico' || p === '/favicon.svg')) return Response.redirect('https://quantritute.com' + p, 302);
      if (req.method === 'GET' && p === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } });
      let m = /^\/t\/([a-z0-9]{8,16})(?:\/([a-z0-9-]{1,80}))?(?:\/([a-z0-9-]{1,120}))?$/.exec(p);
      if (req.method === 'GET' && m) {
        const r = await db.prepare('SELECT html, slug, jobs, cap_nhat FROM td_cong WHERE tok = ?').bind(m[1]).first();
        if (!r || r.cap_nhat < Date.now() - TTL) return page('Link đã hết hạn', GONE, 410);
        if (m[2] && m[2] !== r.slug) return page('Không tìm thấy', '<h1>Không tìm thấy trang</h1><p>Link không đúng công ty. Kiểm tra lại link được gửi.</p>', 404);
        if (!m[2]) return Response.redirect(url.origin + '/t/' + m[1] + '/' + r.slug, 302);
        if (m[3] && m[3] !== 've-chung-toi' && JSON.parse(r.jobs || '[]').indexOf(m[3]) < 0) return page('Vị trí đã đóng', '<h1>Vị trí này không còn nhận hồ sơ</h1><p><a href="/t/' + esc(m[1]) + '/' + esc(r.slug) + '">Xem các vị trí đang tuyển →</a></p>', 404);
        return new Response(r.html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...SEC } });
      }
      // ---- ứng viên nộp hồ sơ ----
      if (req.method === 'POST' && p === '/api/ung-tuyen') {
        const ip = req.headers.get('CF-Connecting-IP') || '';
        if (tooMany(ip)) return json({ ok: false, msg: 'Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút.' }, 429);
        const f = await req.formData(), tok = String(f.get('tok') || ''), job = String(f.get('job') || '');
        if (!okTok(tok)) return json({ ok: false, msg: 'Link cổng không đúng.' }, 400);
        const c = await db.prepare('SELECT jobs, cap_nhat FROM td_cong WHERE tok = ?').bind(tok).first();
        if (!c || c.cap_nhat < Date.now() - TTL) return json({ ok: false, msg: 'Link cổng thử đã hết hạn (24 giờ).' }, 410);
        const name = String(f.get('name') || '').trim().replace(/\s+/g, ' ').slice(0, 80), phone = String(f.get('phone') || '').replace(/[^\d]/g, ''), email = String(f.get('email') || '').trim().slice(0, 120);
        if (name.split(' ').length < 2 || !/^0\d{9}$/.test(phone) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, msg: 'Thông tin chưa đúng – kiểm tra họ tên, số điện thoại, email.' }, 400);
        if (String(f.get('consent')) !== 'true') return json({ ok: false, msg: 'Cần đồng ý xử lý dữ liệu cá nhân để gửi hồ sơ.' }, 400);
        const n = await db.prepare('SELECT COUNT(*) n FROM td_ho_so WHERE tok = ?').bind(tok).first('n'); if (n >= 60) return json({ ok: false, msg: 'Cổng thử này đã nhận đủ số hồ sơ thử trong ngày.' }, 429);
        const cv = f.get('cv'); if (!cv || typeof cv === 'string' || !cv.size) return json({ ok: false, msg: 'Vui lòng đính kèm CV.' }, 400);
        if (cv.size > CV_MAX || !(/^image\/|application\/pdf/.test(cv.type) || /\.(pdf|jpe?g|png|webp)$/i.test(cv.name))) return json({ ok: false, msg: 'CV cần là PDF hoặc ảnh, tối đa 5 MB.' }, 400);
        const ma = 'HS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(), buf = new Uint8Array(await cv.arrayBuffer()), parts = Math.ceil(buf.length / PART) || 1;
        const d = { job, name, phone, email, exp: String(f.get('exp') || '').slice(0, 1000), src: String(f.get('src') || 'Cổng tuyển dụng').slice(0, 60), consentText: String(f.get('consentText') || '').slice(0, 1200), consentAt: new Date().toISOString() };
        const st = [db.prepare('INSERT INTO td_ho_so (ma, tok, job, du_lieu, cv_ten, cv_loai, cv_size, cv_parts, ip, tao) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(ma, tok, job, JSON.stringify(d), String(cv.name).slice(0, 120), cv.type || 'application/pdf', buf.length, parts, ip, Date.now())];
        for (let i = 0; i < parts; i++) st.push(db.prepare('INSERT INTO td_cv_part (ma, i, data) VALUES (?,?,?)').bind(ma, i, buf.slice(i * PART, (i + 1) * PART).buffer));
        await db.batch(st);
        return json({ ok: true, code: ma });
      }
      // ---- phần mềm (cần khóa bí mật) ----
      if (req.method === 'POST' && p === '/api/cong') {
        const b = await req.json(), tok = String(b.tok || ''), key = String(b.key || '');
        if (!okTok(tok) || key.length < 20) return json({ ok: false, msg: 'Mã cổng không đúng' }, 400);
        const html = String(b.html || ''); if (!html || html.length > 400000) return json({ ok: false, msg: 'Trang cổng trống hoặc quá lớn' }, 400);
        const slug = String(b.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) || 'cong-ty', jobs = (Array.isArray(b.jobs) ? b.jobs : []).map(x => String(x).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120)).slice(0, 50);
        const cur = await auth(db, tok, key); if (cur === false) return json({ ok: false, msg: 'Mã cổng đã được dùng ở máy khác' }, 403);
        const now = Date.now();
        if (cur) await db.prepare('UPDATE td_cong SET slug=?, ten=?, html=?, jobs=?, cap_nhat=? WHERE tok=?').bind(slug, String(b.ten || '').slice(0, 120), html, JSON.stringify(jobs), now, tok).run();
        else await db.prepare('INSERT INTO td_cong (tok, key_hash, slug, ten, html, jobs, tao, cap_nhat) VALUES (?,?,?,?,?,?,?,?)').bind(tok, await sha(key), slug, String(b.ten || '').slice(0, 120), html, JSON.stringify(jobs), now, now).run();
        return json({ ok: true, base: url.origin + '/t/' + tok + '/' + slug, het_han: now + TTL });
      }
      if (req.method === 'GET' && p === '/api/cong/ho-so') {
        const c = await auth(db, url.searchParams.get('tok'), url.searchParams.get('key')); if (!c) return json({ ok: false, msg: 'Chưa có cổng hoặc sai khóa' }, c === null ? 404 : 403);
        const rs = await db.prepare('SELECT ma, job, du_lieu, cv_ten, cv_loai, cv_size, tao FROM td_ho_so WHERE tok = ? ORDER BY tao LIMIT 30').bind(c.tok).all();
        return json({ ok: true, ds: (rs.results || []).map(r => ({ ma: r.ma, job: r.job, d: JSON.parse(r.du_lieu || '{}'), cv: { name: r.cv_ten, type: r.cv_loai, size: r.cv_size }, tao: r.tao })), het_han: c.cap_nhat + TTL });
      }
      if (req.method === 'GET' && p === '/api/cong/cv') {
        const c = await auth(db, url.searchParams.get('tok'), url.searchParams.get('key')); if (!c) return json({ ok: false }, 403);
        const h = await db.prepare('SELECT cv_loai, cv_parts FROM td_ho_so WHERE ma = ? AND tok = ?').bind(url.searchParams.get('ma'), c.tok).first(); if (!h) return json({ ok: false, msg: 'Không còn CV' }, 404);
        const ps = await db.prepare('SELECT data FROM td_cv_part WHERE ma = ? ORDER BY i').bind(url.searchParams.get('ma')).all();
        const bufs = (ps.results || []).map(r => new Uint8Array(r.data)), out = new Uint8Array(bufs.reduce((s, x) => s + x.length, 0)); let o = 0; bufs.forEach(x => { out.set(x, o); o += x.length; });
        return new Response(out, { headers: { 'Content-Type': h.cv_loai || 'application/octet-stream', 'Cache-Control': 'no-store', ...CORS, ...SEC } });
      }
      if (req.method === 'POST' && (p === '/api/cong/da-lay' || p === '/api/cong/tat')) {
        const b = await req.json(), c = await auth(db, b.tok, b.key); if (!c) return json({ ok: false }, 403);
        if (p === '/api/cong/da-lay') { const mas = (Array.isArray(b.ma) ? b.ma : []).map(String).slice(0, 50); const own = mas.length ? (await db.prepare('SELECT ma FROM td_ho_so WHERE tok = ? AND ma IN (' + mas.map(() => '?').join(',') + ')').bind(c.tok, ...mas).all()).results.map(r => r.ma) : []; await delHs(db, own); return json({ ok: true, xoa: own.length }); }
        const all = (await db.prepare('SELECT ma FROM td_ho_so WHERE tok = ?').bind(c.tok).all()).results.map(r => r.ma); await delHs(db, all); await db.prepare('DELETE FROM td_cong WHERE tok = ?').bind(c.tok).run(); return json({ ok: true });
      }
      return page('Không tìm thấy', '<h1>Không tìm thấy trang</h1><p><a href="/">Về trang giới thiệu</a></p>', 404);
    } catch (e) {
      console.error(e);
      return p.startsWith('/api/') ? json({ ok: false, msg: 'Máy chủ thử đang lỗi, vui lòng thử lại.' }, 500) : page('Lỗi', '<h1>Trang đang lỗi</h1><p>Vui lòng thử lại sau ít phút.</p>', 500);
    }
  }
};
