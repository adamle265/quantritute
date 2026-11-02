// Đăng nhập bằng mật khẩu (secret KHO_PASSWORD trên Cloudflare), phiên lưu cookie ký HMAC 30 ngày.
export const COOKIE = 'kho_s';
const DAYS = 30;
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function key(env) {
  return crypto.subtle.importKey('raw', enc.encode('kho-v1|' + env.KHO_PASSWORD + '|' + (env.KHO_SECRET || '')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function sign(env, msg) { return b64u(await crypto.subtle.sign('HMAC', await key(env), enc.encode(msg))); }

// So sánh mật khẩu không lộ thời gian: so 2 chữ ký HMAC
export async function checkPassword(env, given) {
  const a = await sign(env, 'pw|' + String(given || ''));
  const b = await sign(env, 'pw|' + env.KHO_PASSWORD);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
export async function makeSession(env) {
  const exp = Date.now() + DAYS * 864e5;
  return `${exp}.${await sign(env, 'ss|' + exp)}`;
}
export async function validSession(env, request) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  const good = await sign(env, 'ss|' + exp);
  if (good.length !== sig.length) return false;
  let d = 0; for (let i = 0; i < sig.length; i++) d |= sig.charCodeAt(i) ^ good.charCodeAt(i);
  return d === 0;
}
export function sessionCookie(value, maxAge = DAYS * 86400, secure = true) {
  return `${COOKIE}=${value}; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Strict; Max-Age=${maxAge}`;
}

// Bảng dữ liệu (tạo một lần mỗi lượt khởi động, IF NOT EXISTS nên chạy lại vô hại)
let ready = false;
export async function ensureTables(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS kho_notes (
      id TEXT PRIMARY KEY, loai TEXT NOT NULL, tieu_de TEXT NOT NULL DEFAULT '', noi_dung TEXT NOT NULL DEFAULT '',
      ngay TEXT NOT NULL, the TEXT NOT NULL DEFAULT '', video_ma TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS kho_picks (ma TEXT PRIMARY KEY, star INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS kho_login_fail (ip TEXT NOT NULL, ts INTEGER NOT NULL)`),
  ]);
  ready = true;
}
