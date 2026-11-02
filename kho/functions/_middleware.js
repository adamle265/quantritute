// Cổng đăng nhập cho TOÀN BỘ trang (kể cả file dữ liệu). Chưa đăng nhập → chỉ thấy trang nhập mật khẩu.
import { checkPassword, makeSession, validSession, sessionCookie, ensureTables } from '../lib/auth.js';

const SEC = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
};
const MAX_FAIL = 8, WINDOW_MS = 15 * 60 * 1000;

function page(msg, status = 200, extra = {}) {
  return new Response(loginHTML(msg), { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SEC, ...extra } });
}

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  const https = url.protocol === 'https:';

  if (!env.KHO_PASSWORD || String(env.KHO_PASSWORD).length < 10) {
    return page('Trang chưa được đặt mật khẩu (tối thiểu 10 ký tự). Anh chạy lại trien-khai-kho.cmd để đặt.', 503);
  }

  if (url.pathname === '/dang-xuat') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': sessionCookie('x', 0, https), ...SEC } });
  }

  if (url.pathname === '/dang-nhap' && request.method === 'POST') {
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Date.now();
    await ensureTables(env.DB);
    await env.DB.prepare('DELETE FROM kho_login_fail WHERE ts < ?').bind(now - WINDOW_MS).run();
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM kho_login_fail WHERE ip = ?').bind(ip).first();
    if (n >= MAX_FAIL) return page('Nhập sai quá nhiều lần. Anh đợi 15 phút rồi thử lại.', 429);
    const form = await request.formData();
    if (await checkPassword(env, form.get('pw'))) {
      await env.DB.prepare('DELETE FROM kho_login_fail WHERE ip = ?').bind(ip).run();
      return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': sessionCookie(await makeSession(env), undefined, https), ...SEC } });
    }
    await env.DB.prepare('INSERT INTO kho_login_fail (ip, ts) VALUES (?, ?)').bind(ip, now).run();
    await new Promise(r => setTimeout(r, 600));
    return page(`Mật khẩu chưa đúng. Còn ${Math.max(0, MAX_FAIL - n - 1)} lần thử trong 15 phút.`, 401);
  }

  if (!(await validSession(env, request))) {
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Phiên đăng nhập đã hết. Tải lại trang để đăng nhập.' }), { status: 401, headers: { 'Content-Type': 'application/json', ...SEC } });
    }
    if (url.pathname === '/robots.txt') return next();
    return page('');
  }

  const res = await next();
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SEC)) if (k !== 'Cache-Control' || !out.headers.get('Cache-Control')) out.headers.set(k, v);
  return out;
}

function loginHTML(msg) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Kho riêng · Quản trị tử tế</title>
<style>
:root{--bg:#f7f3ea;--card:#fffdf8;--ink:#26221b;--muted:#6f675a;--line:#e6dfd0;--acc:#b7791f;--err:#b42318}
@media (prefers-color-scheme:dark){:root{--bg:#14120e;--card:#1b1914;--ink:#efe8da;--muted:#a69d8c;--line:#332e25;--acc:#f0b44c;--err:#f97066}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font:15px/1.5 "Be Vietnam Pro","Segoe UI",system-ui,sans-serif;padding:16px}
form{width:min(380px,100%);background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
h1{font-size:19px;margin:0 0 4px}p{margin:0 0 18px;color:var(--muted);font-size:13.5px}
label{font-size:13px;font-weight:600}input{width:100%;margin:6px 0 14px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:transparent;color:inherit;font:inherit}
input:focus{outline:2px solid var(--acc);outline-offset:1px}
button{width:100%;padding:11px;border:0;border-radius:10px;background:var(--acc);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.err{color:var(--err);font-size:13.5px;margin:-4px 0 12px}
</style></head><body>
<form method="post" action="/dang-nhap">
<h1>📓 Kho riêng của Tuấn</h1><p>Kho nghiên cứu video và Sổ tay. Chỉ dành cho chủ trang.</p>
${msg ? `<div class="err" role="alert">${msg}</div>` : ''}
<label for="pw">Mật khẩu</label><input id="pw" name="pw" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Vào kho</button></form></body></html>`;
}
