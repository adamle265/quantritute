/* Chấm công Wi-Fi – BẢN THỬ NGHIỆM (Quản trị tử tế)
   Cloudflare Worker + D1. Một file máy chủ, giao diện trong app.html.
   - Nhân viên bấm Vào ca / Ra ca: máy chủ so IP của lượt bấm với IP văn phòng (Wi-Fi).
   - Màn hình chung (/tram): mỗi lần mở/làm mới báo IP văn phòng hiện tại + hiện QR động 30 giây (dự phòng).
   - Quản lý (/quan-ly): nhân viên, lượt chấm, IP văn phòng, lượt bị từ chối, cài đặt, tải CSV.
   Giờ chấm lấy theo đồng hồ máy chủ (không tin giờ điện thoại). Hiển thị theo giờ Việt Nam (UTC+7). */
import qrcode from './qrcode.mjs';
import APP_HTML from './app.html';
import { ICON_PNG_B64, ICON_SVG } from './icon.js';

const VER = '0.3.1';  // 07/11/2026: nối Phần mềm quản lý nhân sự (đồng bộ nhân viên, lượt chấm, đơn nghỉ, xác nhận công)
const VN = 7 * 3600e3;
const QR_STEP = 30e3;          // QR đổi mỗi 30 giây
const QR_GRACE = 5e3;          // mã vừa đổi trong 5 giây vẫn nhận mã ngay trước đó (đang quét đúng lúc đổi)
const PASS_MS = 120e3;         // quét đúng mã → được 2 phút để đăng nhập/bấm chấm (thẻ qua cửa ký số)
const DUP_MS = 120e3;          // bấm trùng cùng loại trong 2 phút → không ghi thêm
const DEF = { che_do: 'wifi_hoac_qr', ip_gio: '72', hien_ip: '1', ten_cty: '' };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS cfg (k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS nv (ma TEXT PRIMARY KEY, ten TEXT NOT NULL, pin TEXT, salt TEXT, active INTEGER DEFAULT 1, fail INTEGER DEFAULT 0, lock_until INTEGER DEFAULT 0, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS phien (tok TEXT PRIMARY KEY, vai TEXT NOT NULL, ma TEXT, created INTEGER, last INTEGER, tb TEXT)`,
  `CREATE TABLE IF NOT EXISTS ip_vp (ip TEXT PRIMARY KEY, nguon TEXT, first INTEGER, last INTEGER)`,
  `CREATE TABLE IF NOT EXISTS cham (id INTEGER PRIMARY KEY AUTOINCREMENT, ma TEXT NOT NULL, t INTEGER NOT NULL, loai TEXT NOT NULL, cach TEXT NOT NULL, ip TEXT, wifi INTEGER, tb TEXT, ghi TEXT, huy INTEGER DEFAULT 0, nguoi TEXT)`,
  `CREATE INDEX IF NOT EXISTS cham_t ON cham(t)`,
  `CREATE TABLE IF NOT EXISTS tu_choi (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER, ma TEXT, ip TEXT, ly_do TEXT, tb TEXT)`,
  /* 0.2: mã máy – mỗi trình duyệt một mã riêng (cookie qtt_may), đăng xuất không mất. Một máy dùng cho ≥ 2 nhân viên → cảnh báo chấm hộ */
  `CREATE TABLE IF NOT EXISTS may_nv (may TEXT NOT NULL, ma TEXT NOT NULL, nhan TEXT, first INTEGER, last INTEGER, so_dn INTEGER DEFAULT 0, so_cham INTEGER DEFAULT 0, PRIMARY KEY (may, ma))`,
  `CREATE TABLE IF NOT EXISTS may_bo_qua (may TEXT PRIMARY KEY, ghi TEXT, t INTEGER)`,
  /* 0.3.1: đơn nghỉ nhân viên gửi trên điện thoại; công tháng đã chốt gửi nhân viên xác nhận */
  `CREATE TABLE IF NOT EXISTS don (so TEXT PRIMARY KEY, ma TEXT NOT NULL, loai TEXT, tu TEXT, den TEXT, so_ngay REAL, ly_do TEXT, tao INTEGER, trang_thai TEXT, nguoi_duyet TEXT, ngay_duyet TEXT, ly_do_tc TEXT, nguon TEXT, cap_nhat INTEGER)`,
  `CREATE INDEX IF NOT EXISTS don_ma ON don(ma)`,
  `CREATE TABLE IF NOT EXISTS cong (ym TEXT NOT NULL, ma TEXT NOT NULL, du_lieu TEXT, chot INTEGER, nguoi TEXT, xn INTEGER DEFAULT 0, xn_at INTEGER, phan_hoi TEXT, PRIMARY KEY (ym, ma))`
];
const MIGRATE_V2 = ['ALTER TABLE cham ADD COLUMN may TEXT', 'ALTER TABLE phien ADD COLUMN may TEXT', 'ALTER TABLE tu_choi ADD COLUMN may TEXT'];
const MIGRATE_V3 = ['ALTER TABLE nv ADD COLUMN pb TEXT', 'ALTER TABLE nv ADD COLUMN ncc INTEGER DEFAULT 0', 'ALTER TABLE nv ADD COLUMN nguon TEXT'];
let schemaOk = false;
async function ensureSchema(db) {
  if (schemaOk) return;
  await db.batch(SCHEMA.map(s => db.prepare(s)));
  const v = await db.prepare("SELECT v FROM cfg WHERE k = 'schema_v'").first();
  const sv = v ? Number(v.v) : 0;
  if (sv < 3) {
    for (const sql of (sv < 2 ? MIGRATE_V2 : []).concat(MIGRATE_V3)) { try { await db.prepare(sql).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; } }
    await db.prepare("INSERT INTO cfg (k, v) VALUES ('schema_v', '3') ON CONFLICT(k) DO UPDATE SET v = '3'").run();
  }
  schemaOk = true;
}

/* ---------- tiện ích ---------- */
const enc = new TextEncoder();
function hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function randHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
async function hashPin(pin, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 1000 }, key, 256);
  return hex(bits);
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function b32(bytes) { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < bytes.length; i++) s += A[bytes[i] & 31]; return s; }
function json(o, status = 200, headers = {}) {
  return new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
function bad(msg, status = 400) { return json({ ok: false, loi: msg }, status); }
/* 0.3.1: API đồng bộ cho Phần mềm quản lý nhân sự (chạy trên trình duyệt của kế toán, khác tên miền) – xác thực bằng Mã kết nối, không dùng cookie */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type', 'access-control-max-age': '86400' };
function jc(o, status = 200) { return json(o, status, CORS); }
function isoVN(t) { const q = vnParts(t); return q.y + '-' + q.m + '-' + q.d; }
function cookies(req) { const o = {}; (req.headers.get('cookie') || '').split(/;\s*/).forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); }); return o; }
function setCookie(name, val, maxAge) { return name + '=' + encodeURIComponent(val) + '; Path=/; Max-Age=' + maxAge + '; HttpOnly; Secure; SameSite=Lax'; }
function vnDayStart(t) { return Math.floor((t + VN) / 864e5) * 864e5 - VN; }
function pad(n) { return String(n).padStart(2, '0'); }
function vnParts(t) { const d = new Date(t + VN); return { d: pad(d.getUTCDate()), m: pad(d.getUTCMonth() + 1), y: d.getUTCFullYear(), h: pad(d.getUTCHours()), mi: pad(d.getUTCMinutes()), s: pad(d.getUTCSeconds()) }; }
function shortUA(ua) {
  ua = ua || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : 'Khác';
  const br = /EdgA?\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Zalo/i.test(ua) ? 'Zalo' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt khác';
  return os + ' · ' + br;
}

/* ---------- IP ---------- */
function clientIP(req, env) {
  if (env.DEV === '1' && req.headers.get('x-test-ip')) return req.headers.get('x-test-ip');
  return req.headers.get('cf-connecting-ip') || '';
}
function expandV6(ip) {
  ip = ip.split('%')[0].toLowerCase();
  if (ip.includes('.')) return null; // IPv4 nhúng – bỏ qua
  const [h, t] = ip.split('::');
  const hp = h ? h.split(':') : [], tp = t !== undefined ? (t ? t.split(':') : []) : null;
  let parts = tp === null ? hp : hp.concat(Array(8 - hp.length - tp.length).fill('0'), tp);
  if (parts.length !== 8) return null;
  return parts.map(p => p.padStart(4, '0'));
}
function ipKind(ip) { return ip.includes(':') ? 'IPv6' : 'IPv4'; }
function sameNet(a, b) {
  if (!a || !b) return false;
  if (ipKind(a) !== ipKind(b)) return false;
  if (ipKind(a) === 'IPv4') return a === b;
  const x = expandV6(a), y = expandV6(b);
  if (!x || !y) return a === b;
  return x.slice(0, 4).join(':') === y.slice(0, 4).join(':'); // cùng dải /64
}
async function officeIPs(db, cfg, now) {
  const hours = Math.max(1, Number(cfg.ip_gio) || 72);
  const { results } = await db.prepare('SELECT ip, nguon, first, last FROM ip_vp ORDER BY last DESC').all();
  return results.map(r => ({ ...r, hieu_luc: r.nguon === 'tay' || r.last > now - hours * 3600e3 }));
}
function matchOffice(ip, list) { return list.some(r => r.hieu_luc && sameNet(ip, r.ip)); }

/* ---------- cấu hình, phiên ---------- */
async function getCfg(db) {
  const { results } = await db.prepare('SELECT k, v FROM cfg').all();
  const o = { ...DEF }; results.forEach(r => { o[r.k] = r.v; }); return o;
}
async function setCfg(db, obj) {
  await db.batch(Object.entries(obj).map(([k, v]) => db.prepare('INSERT INTO cfg (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, String(v))));
}
const COOKIE = { nv: 'qtt_nv', ql: 'qtt_ql', tram: 'qtt_tram' };
const AGE = { nv: 180 * 864e2, ql: 12 * 3600, tram: 365 * 864e2 };
async function newSession(db, vai, ma, req) {
  const tok = randHex(32), now = Date.now();
  await db.prepare('INSERT INTO phien (tok, vai, ma, created, last, tb, may) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(await sha256(tok), vai, ma || null, now, now, shortUA(req.headers.get('user-agent')), req.may || null).run();
  return setCookie(COOKIE[vai], tok, AGE[vai]);
}
async function session(db, req, vai) {
  const tok = cookies(req)[COOKIE[vai]];
  if (!tok) return null;
  const row = await db.prepare('SELECT * FROM phien WHERE tok = ? AND vai = ?').bind(await sha256(tok), vai).first();
  if (!row) return null;
  if (vai === 'ql' && row.created < Date.now() - AGE.ql * 1000) return null;
  if (row.last < Date.now() - 3600e3) await db.prepare('UPDATE phien SET last = ? WHERE tok = ?').bind(Date.now(), row.tok).run();
  if (vai === 'nv') {
    const nv = await db.prepare('SELECT ma, ten, active, ncc FROM nv WHERE ma = ?').bind(row.ma).first();
    if (!nv || !nv.active) return null;
    row.nv = nv;
  }
  return row;
}

/* ---------- QR động ---------- */
async function qrToken(secret, w) { return b32((await hmac(secret, 'qr:' + w)).slice(0, 12)); }
async function verifyQR(secret, t, now) {
  if (!t || !secret) return false;
  const w = Math.floor(now / QR_STEP);
  if (t === await qrToken(secret, w)) return true;
  return now - w * QR_STEP < QR_GRACE && t === await qrToken(secret, w - 1);
}
/* Quét QR hợp lệ (kiểm tra NGAY lúc mở link) → nhận "thẻ qua cửa" ký số, dùng để bấm chấm trong 2 phút. */
async function makePass(secret, now) { return now + '.' + b32(await hmac(secret, 'pass:' + now)); }
async function verifyPass(secret, p, now) {
  const m = /^(\d{13})\.([A-Z2-9]+)$/.exec(String(p || ''));
  if (!m || !secret) return false;
  const t0 = Number(m[1]);
  if (t0 > now + 5e3 || now - t0 > PASS_MS) return false;
  return m[2] === b32(await hmac(secret, 'pass:' + t0));
}
function qrSvg(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); }

/* ---------- dữ liệu chấm ---------- */
async function punchesBetween(db, from, to, ma) {
  const sql = 'SELECT c.id, c.ma, n.ten, c.t, c.loai, c.cach, c.ip, c.wifi, c.tb, c.may, c.ghi, c.huy, c.nguoi FROM cham c LEFT JOIN nv n ON n.ma = c.ma WHERE c.t >= ? AND c.t < ?' + (ma ? ' AND c.ma = ?' : '') + ' ORDER BY c.t';
  const st = ma ? db.prepare(sql).bind(from, to, ma) : db.prepare(sql).bind(from, to);
  return (await st.all()).results;
}
async function logReject(db, ma, ip, lyDo, req) {
  await db.prepare('INSERT INTO tu_choi (t, ma, ip, ly_do, tb, may) VALUES (?, ?, ?, ?, ?, ?)').bind(Date.now(), ma || null, ip, lyDo, shortUA(req.headers.get('user-agent')), req.may || null).run();
}
async function noteDevice(db, req, ma, kind) {
  if (!req.may || !ma) return;
  const now = Date.now(), dn = kind === 'dn' ? 1 : 0, ch = kind === 'cham' ? 1 : 0;
  await db.prepare('INSERT INTO may_nv (may, ma, nhan, first, last, so_dn, so_cham) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(may, ma) DO UPDATE SET last = excluded.last, nhan = excluded.nhan, so_dn = so_dn + excluded.so_dn, so_cham = so_cham + excluded.so_cham')
    .bind(req.may, ma, shortUA(req.headers.get('user-agent')), now, now, dn, ch).run();
}
/* Máy dùng chung: một mã máy gắn với ≥ 2 nhân viên, trừ máy quản lý đã đánh dấu "đã kiểm tra" */
async function sharedDevices(db) {
  const { results } = await db.prepare('SELECT m.may, m.ma, n.ten, m.nhan, m.first, m.last, m.so_dn, m.so_cham, b.ghi AS bo_qua_ghi, b.t AS bo_qua_t FROM may_nv m LEFT JOIN nv n ON n.ma = m.ma LEFT JOIN may_bo_qua b ON b.may = m.may WHERE m.may IN (SELECT may FROM may_nv GROUP BY may HAVING COUNT(*) > 1) ORDER BY m.may, m.first').all();
  const by = {};
  results.forEach(r => { const o = by[r.may] || (by[r.may] = { may: r.may, nhan: r.nhan, last: 0, bo_qua: r.bo_qua_t ? { ghi: r.bo_qua_ghi, t: r.bo_qua_t } : null, nv: [] }); o.nv.push({ ma: r.ma, ten: r.ten || r.ma, first: r.first, last: r.last, so_dn: r.so_dn, so_cham: r.so_cham }); if (r.last > o.last) { o.last = r.last; o.nhan = r.nhan; } });
  return Object.values(by).sort((a, b) => b.last - a.last);
}

/* ---------- API ---------- */
async function api(req, env, url) {
  const db = env.DB; await ensureSchema(db);
  const p = url.pathname, now = Date.now(), ip = clientIP(req, env);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const cfg = await getCfg(db);
  const isSetup = !!cfg.ql_pin;

  /* ----- 0.3.1: ĐỒNG BỘ VỚI PHẦN MỀM QUẢN LÝ NHÂN SỰ (xác thực: Authorization: Bearer <Mã kết nối>) -----
     Máy chủ này là nơi lưu chính lượt chấm, đơn nghỉ gửi từ điện thoại, xác nhận công.
     Phần mềm nhân sự: đẩy danh sách nhân viên + mã PIN, kéo lượt chấm, kéo đơn, trả kết quả duyệt đơn, gửi công tháng đã chốt. */
  if (p.startsWith('/api/sync/')) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const key = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!cfg.sync_key || !key || await sha256(key) !== cfg.sync_key) return jc({ ok: false, loi: 'Mã kết nối không đúng hoặc chưa tạo. Vào trang Quản lý → Cài đặt → Kết nối Phần mềm quản lý nhân sự.' }, 401);
    const r = p.slice(10);
    if (r === 'ping') {
      const n = await db.prepare('SELECT COUNT(*) AS n, SUM(CASE WHEN pin IS NOT NULL THEN 1 ELSE 0 END) AS c FROM nv WHERE active = 1').first();
      return jc({ ok: true, ver: VER, ten_cty: cfg.ten_cty, che_do: cfg.che_do, so_nv: n.n || 0, co_pin: n.c || 0, now });
    }
    if (r === 'nhan-vien' && req.method === 'POST') {
      const list = Array.isArray(body.list) ? body.list.slice(0, 2000) : [], out = { them: 0, sua: 0, chua_pin: [] }, st = [];
      for (const x of list) {
        const ma = String(x.ma || '').trim().toUpperCase(), ten = String(x.ten || '').trim().slice(0, 120);
        if (!/^[A-Z0-9._-]{1,20}$/.test(ma) || !ten) continue;
        const old = await db.prepare('SELECT ma, pin FROM nv WHERE ma = ?').bind(ma).first();
        if (!old) { st.push(db.prepare("INSERT INTO nv (ma, ten, active, created, pb, ncc, nguon) VALUES (?, ?, ?, ?, ?, ?, 'phan-mem')").bind(ma, ten, x.active ? 1 : 0, now, String(x.pb || '').slice(0, 120), x.ncc ? 1 : 0)); out.them++; out.chua_pin.push(ma); }
        else { st.push(db.prepare("UPDATE nv SET ten = ?, active = ?, pb = ?, ncc = ?, nguon = 'phan-mem' WHERE ma = ?").bind(ten, x.active ? 1 : 0, String(x.pb || '').slice(0, 120), x.ncc ? 1 : 0, ma)); out.sua++; if (!old.pin) out.chua_pin.push(ma); }
        if (!x.active) st.push(db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, ...out });
    }
    if (r === 'pin' && req.method === 'POST') {
      const ma = String(body.ma || '').trim().toUpperCase(), pin = String(body.pin || '');
      if (!/^\d{4,8}$/.test(pin)) return jc({ ok: false, loi: 'Mã PIN 4–8 chữ số.' }, 400);
      const old = await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first(), salt = randHex(16), h = await hashPin(pin, salt);
      if (old) await db.prepare('UPDATE nv SET pin = ?, salt = ?, fail = 0, lock_until = 0, active = 1 WHERE ma = ?').bind(h, salt, ma).run();
      else { const ten = String(body.ten || '').trim().slice(0, 120); if (!ten) return jc({ ok: false, loi: 'Thiếu họ tên.' }, 400); await db.prepare("INSERT INTO nv (ma, ten, pin, salt, active, created, pb, nguon) VALUES (?, ?, ?, ?, 1, ?, ?, 'phan-mem')").bind(ma, ten, h, salt, now, String(body.pb || '').slice(0, 120)).run(); }
      await db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma).run();
      return jc({ ok: true });
    }
    if (r === 'cham') {
      const tu = String(url.searchParams.get('tu') || ''), den = String(url.searchParams.get('den') || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den)) return jc({ ok: false, loi: 'tu, den dạng YYYY-MM-DD' }, 400);
      const from = Date.UTC(+tu.slice(0, 4), +tu.slice(5, 7) - 1, +tu.slice(8, 10)) - VN, to = Date.UTC(+den.slice(0, 4), +den.slice(5, 7) - 1, +den.slice(8, 10)) - VN + 864e5;
      const rows = (await punchesBetween(db, from, to)).filter(x => !x.huy).map(x => ({ id: x.id, ma: x.ma, t: x.t, loai: x.loai, cach: x.cach, ghi: x.ghi || '' }));
      return jc({ ok: true, list: rows });
    }
    if (r === 'don') {
      const tu = String(url.searchParams.get('tu') || '2000-01-01');
      return jc({ ok: true, list: (await db.prepare('SELECT * FROM don WHERE den >= ? ORDER BY tao').bind(tu).all()).results });
    }
    if (r === 'don-cap-nhat' && req.method === 'POST') {
      const list = Array.isArray(body.list) ? body.list.slice(0, 1000) : [], st = [];
      for (const x of list) {
        if (!['Đã duyệt', 'Từ chối', 'Chờ duyệt'].includes(x.trang_thai)) continue;
        st.push(db.prepare('UPDATE don SET trang_thai = ?, nguoi_duyet = ?, ngay_duyet = ?, ly_do_tc = ?, so_ngay = COALESCE(?, so_ngay), cap_nhat = ? WHERE so = ?').bind(x.trang_thai, String(x.nguoi_duyet || '').slice(0, 80), String(x.ngay_duyet || ''), String(x.ly_do_tc || '').slice(0, 300), x.so_ngay == null ? null : Number(x.so_ngay), now, String(x.so)));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, n: st.length });
    }
    if (r === 'cong' && req.method === 'POST') {
      const ym = String(body.ym || ''); if (!/^\d{4}-\d{2}$/.test(ym)) return jc({ ok: false, loi: 'ym dạng YYYY-MM' }, 400);
      const list = Array.isArray(body.list) ? body.list.slice(0, 2000) : [], st = [];
      for (const x of list) {
        const ma = String(x.ma || '').toUpperCase(), dl = JSON.stringify(x.du_lieu || {}).slice(0, 20000);
        const old = await db.prepare('SELECT du_lieu FROM cong WHERE ym = ? AND ma = ?').bind(ym, ma).first();
        if (old && old.du_lieu === dl) continue; // không đổi → giữ xác nhận cũ
        st.push(db.prepare('INSERT INTO cong (ym, ma, du_lieu, chot, nguoi, xn, xn_at, phan_hoi) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL) ON CONFLICT(ym, ma) DO UPDATE SET du_lieu = excluded.du_lieu, chot = excluded.chot, nguoi = excluded.nguoi, xn = 0, xn_at = NULL, phan_hoi = NULL').bind(ym, ma, dl, now, String(body.nguoi || '').slice(0, 80)));
      }
      if (st.length) await db.batch(st);
      return jc({ ok: true, n: st.length });
    }
    if (r === 'cong-xac-nhan') {
      const ym = String(url.searchParams.get('ym') || '');
      return jc({ ok: true, list: (await db.prepare('SELECT ma, xn, xn_at, phan_hoi, chot FROM cong WHERE ym = ?').bind(ym).all()).results });
    }
    return jc({ ok: false, loi: 'Không có API này' }, 404);
  }


  if (p === '/api/trang-thai') {
    const s = await session(db, req, 'nv');
    const offices = await officeIPs(db, cfg, now);
    const o = { ok: true, ver: VER, setup: isSetup, ten_cty: cfg.ten_cty, che_do: cfg.che_do, ip: cfg.hien_ip === '1' ? ip : null, ip_loai: ipKind(ip), wifi: matchOffice(ip, offices), co_ip_vp: offices.some(r => r.hieu_luc), now };
    if (s) {
      o.me = { ma: s.nv.ma, ten: s.nv.ten };
      const d0 = vnDayStart(now), m = vnParts(now);
      const mStart = Date.UTC(m.y, Number(m.m) - 1, 1) - VN;
      o.thang = (await punchesBetween(db, mStart, d0 + 864e5, s.nv.ma)).filter(r => !r.huy).map(r => ({ t: r.t, loai: r.loai, cach: r.cach }));
      o.me.ncc = !!s.nv.ncc; o.ket_noi = !!cfg.sync_key;
      o.don = (await db.prepare('SELECT so, loai, tu, den, so_ngay, ly_do, trang_thai, ly_do_tc, nguoi_duyet FROM don WHERE ma = ? ORDER BY tu DESC LIMIT 15').bind(s.nv.ma).all()).results;
      o.cong = (await db.prepare('SELECT ym, du_lieu, chot, xn, xn_at, phan_hoi FROM cong WHERE ma = ? ORDER BY ym DESC LIMIT 3').bind(s.nv.ma).all()).results.map(r => ({ ...r, du_lieu: JSON.parse(r.du_lieu || '{}') }));
    }
    return json(o);
  }

  if (p === '/api/cai-dat-lan-dau' && req.method === 'POST') {
    if (isSetup) return bad('Đã cài đặt rồi.', 409);
    const pin = String(body.pin || ''), ten = String(body.ten_cty || '').trim().slice(0, 120);
    if (!/^\d{6,12}$/.test(pin)) return bad('Mã PIN quản lý cần 6–12 chữ số.');
    if (!ten) return bad('Nhập tên đơn vị.');
    const salt = randHex(16);
    await setCfg(db, { ql_pin: await hashPin(pin, salt), ql_salt: salt, qr_secret: randHex(32), ten_cty: ten });
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'ql', null, req) });
  }

  if (p === '/api/dang-nhap' && req.method === 'POST') {
    const ma = String(body.ma || '').trim().toUpperCase(), pin = String(body.pin || '');
    const nv = await db.prepare('SELECT * FROM nv WHERE ma = ?').bind(ma).first();
    if (!nv || !nv.active || !nv.pin) return bad('Sai mã nhân viên hoặc mã PIN.', 401);
    if (nv.lock_until > now) return bad('Nhập sai nhiều lần. Thử lại sau ' + Math.ceil((nv.lock_until - now) / 60e3) + ' phút hoặc nhờ kế toán mở khóa.', 429);
    if (await hashPin(pin, nv.salt) !== nv.pin) {
      const f = nv.fail + 1;
      await db.prepare('UPDATE nv SET fail = ?, lock_until = ? WHERE ma = ?').bind(f >= 5 ? 0 : f, f >= 5 ? now + 15 * 60e3 : 0, ma).run();
      return bad('Sai mã nhân viên hoặc mã PIN.', 401);
    }
    await db.prepare('UPDATE nv SET fail = 0, lock_until = 0 WHERE ma = ?').bind(ma).run();
    await noteDevice(db, req, ma, 'dn');
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'nv', ma, req) });
  }

  if (p === '/api/dang-nhap-ql' && req.method === 'POST') {
    if (!isSetup) return bad('Chưa cài đặt.', 409);
    const lock = Number(cfg.ql_lock || 0);
    if (lock > now) return bad('Nhập sai nhiều lần. Thử lại sau ' + Math.ceil((lock - now) / 60e3) + ' phút.', 429);
    if (await hashPin(String(body.pin || ''), cfg.ql_salt) !== cfg.ql_pin) {
      const f = Number(cfg.ql_fail || 0) + 1;
      await setCfg(db, f >= 5 ? { ql_fail: 0, ql_lock: now + 15 * 60e3 } : { ql_fail: f });
      return bad('Sai mã PIN quản lý.', 401);
    }
    await setCfg(db, { ql_fail: 0, ql_lock: 0 });
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'ql', null, req) });
  }

  if (p === '/api/dang-xuat' && req.method === 'POST') {
    const vai = ['nv', 'ql', 'tram'].includes(body.vai) ? body.vai : 'nv';
    const tok = cookies(req)[COOKIE[vai]];
    if (tok) await db.prepare('DELETE FROM phien WHERE tok = ?').bind(await sha256(tok)).run();
    return json({ ok: true }, 200, { 'set-cookie': setCookie(COOKIE[vai], '', 0) });
  }

  if (p === '/api/qr' && req.method === 'POST') {
    if (await verifyQR(cfg.qr_secret, String(body.t || ''), now)) return json({ ok: true, pass: await makePass(cfg.qr_secret, now), het: now + PASS_MS });
    const s = await session(db, req, 'nv');
    await logReject(db, s ? s.nv.ma : null, ip, 'Quét mã QR đã đổi (quá 30 giây)', req);
    return json({ ok: false, loi: 'Mã QR này đã đổi. Hãy quét mã đang hiện trên màn hình chung (mã đổi mỗi 30 giây).' }, 403);
  }

  if (p === '/api/cham' && req.method === 'POST') {
    const s = await session(db, req, 'nv');
    if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const loai = body.loai === 'ra' ? 'ra' : 'vao';
    const offices = await officeIPs(db, cfg, now);
    const wifi = matchOffice(ip, offices);
    const hasQR = !!(body.pass || body.t), qrOk = hasQR && (body.pass ? await verifyPass(cfg.qr_secret, body.pass, now) : await verifyQR(cfg.qr_secret, String(body.t), now));
    let ok, lyDo = '';
    if (cfg.che_do === 'chi_wifi') ok = wifi;
    else if (cfg.che_do === 'chi_qr') ok = qrOk;
    else ok = wifi || qrOk;
    if (!ok) {
      if (hasQR && !qrOk) lyDo = 'Lượt quét QR không còn hiệu lực (quá 2 phút hoặc mã không đúng). Hãy quét lại mã đang hiện trên màn hình chung.';
      else if (cfg.che_do === 'chi_qr') lyDo = 'Đơn vị đang dùng chế độ chỉ chấm bằng QR. Hãy quét mã trên màn hình chung.';
      else if (!offices.some(r => r.hieu_luc)) lyDo = 'Chưa có IP văn phòng. Hãy mở Màn hình chung (hoặc nhờ kế toán thêm IP văn phòng) rồi thử lại.';
      else lyDo = 'Không nhận ra mạng Wi-Fi văn phòng (' + ipKind(ip) + '). Hãy bắt Wi-Fi văn phòng' + (cfg.che_do === 'chi_wifi' ? '' : ' hoặc quét mã QR trên màn hình chung') + '.';
      await logReject(db, s.nv.ma, ip, (hasQR ? (qrOk ? 'QR hợp lệ' : 'QR quá 2 phút') : 'Không có QR') + ' · ' + (wifi ? 'IP khớp' : 'IP không khớp') + ' · chế độ ' + cfg.che_do, req);
      return json({ ok: false, loi: lyDo, ip: cfg.hien_ip === '1' ? ip : null }, 403);
    }
    const last = await db.prepare('SELECT t, loai FROM cham WHERE ma = ? AND huy = 0 AND t <= ? ORDER BY t DESC LIMIT 1').bind(s.nv.ma, now).first();
    if (last && last.loai === loai && now - last.t < DUP_MS) return json({ ok: true, trung: true, t: last.t, loai, cach: qrOk ? 'qr' : 'wifi' });
    const cach = wifi ? 'wifi' : 'qr';
    await db.prepare('INSERT INTO cham (ma, t, loai, cach, ip, wifi, tb, may) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(s.nv.ma, now, loai, cach, ip, wifi ? 1 : 0, shortUA(req.headers.get('user-agent')), req.may || null).run();
    await noteDevice(db, req, s.nv.ma, 'cham');
    return json({ ok: true, t: now, loai, cach });
  }

  /* ----- 0.3.1: nhân viên gửi / hủy đơn nghỉ, xác nhận công tháng ----- */
  if (p === '/api/don' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    if (body.huy) { const r = await db.prepare("UPDATE don SET trang_thai = 'Đã hủy', cap_nhat = ? WHERE so = ? AND ma = ? AND trang_thai = 'Chờ duyệt'").bind(now, String(body.huy), s.nv.ma).run(); return r.meta.changes ? json({ ok: true }) : bad('Chỉ hủy được đơn đang chờ duyệt.'); }
    const LOAI = ['Nghỉ phép năm', 'Nghỉ việc riêng có lương', 'Nghỉ ốm', 'Nghỉ thai sản', 'Nghỉ không lương'];
    const loai = LOAI.includes(body.loai) ? body.loai : null, tu = String(body.tu || ''), den = String(body.den || body.tu || ''), ly = String(body.ly_do || '').trim().slice(0, 300);
    if (!loai) return bad('Chọn loại nghỉ.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tu) || !/^\d{4}-\d{2}-\d{2}$/.test(den) || den < tu) return bad('Chọn ngày nghỉ (đến ngày không trước từ ngày).');
    if (den > isoVN(now + 366 * 864e5) || tu < isoVN(now - 62 * 864e5)) return bad('Ngày nghỉ chỉ trong khoảng 2 tháng trước đến 1 năm tới.');
    const trung = await db.prepare("SELECT so FROM don WHERE ma = ? AND trang_thai IN ('Chờ duyệt','Đã duyệt') AND tu <= ? AND den >= ?").bind(s.nv.ma, den, tu).first();
    if (trung) return bad('Đã có đơn ' + trung.so + ' trùng ngày.');
    const so = 'DT-' + isoVN(now).replace(/-/g, '').slice(2) + '-' + randHex(2).toUpperCase();
    await db.prepare("INSERT INTO don (so, ma, loai, tu, den, ly_do, tao, trang_thai, nguon, cap_nhat) VALUES (?, ?, ?, ?, ?, ?, ?, 'Chờ duyệt', 'Điện thoại', ?)").bind(so, s.nv.ma, loai, tu, den, ly, now, now).run();
    return json({ ok: true, so });
  }
  if (p === '/api/xac-nhan-cong' && req.method === 'POST') {
    const s = await session(db, req, 'nv'); if (!s) return bad('Phiên đăng nhập đã hết. Đăng nhập lại.', 401);
    const ym = String(body.ym || ''), dong_y = !!body.dong_y, ph = String(body.phan_hoi || '').trim().slice(0, 500);
    if (!dong_y && !ph) return bad('Ghi rõ ngày nào sai, sai thế nào để kế toán kiểm tra.');
    const r = await db.prepare('UPDATE cong SET xn = ?, xn_at = ?, phan_hoi = ? WHERE ym = ? AND ma = ?').bind(dong_y ? 1 : 2, now, ph, ym, s.nv.ma).run();
    return r.meta.changes ? json({ ok: true }) : bad('Không có công tháng này.');
  }

  /* ----- màn hình chung ----- */
  if (p === '/api/tram/kich-hoat' && req.method === 'POST') {
    if (!await session(db, req, 'ql')) return bad('Cần đăng nhập quản lý.', 401);
    return json({ ok: true }, 200, { 'set-cookie': await newSession(db, 'tram', null, req) });
  }
  if (p === '/api/tram') {
    const s = await session(db, req, 'tram');
    if (!s) return bad('Màn hình chung chưa kích hoạt.', 401);
    if (ip) {
      const row = await db.prepare('SELECT last FROM ip_vp WHERE ip = ?').bind(ip).first();
      if (!row) await db.prepare("INSERT INTO ip_vp (ip, nguon, first, last) VALUES (?, 'tram', ?, ?)").bind(ip, now, now).run();
      else if (now - row.last > 60e3) await db.prepare('UPDATE ip_vp SET last = ? WHERE ip = ?').bind(now, ip).run();
      if (now - Number(cfg.tram_last || 0) > 60e3) await setCfg(db, { tram_last: now, tram_ip: ip });
    }
    const w = Math.floor(now / QR_STEP);
    const link = url.origin + '/q?t=' + await qrToken(cfg.qr_secret, w);
    const d0 = vnDayStart(now);
    const list = (await punchesBetween(db, d0, d0 + 864e5)).filter(r => !r.huy);
    const byNv = {};
    list.forEach(r => { const o = byNv[r.ma] || (byNv[r.ma] = { ma: r.ma, ten: r.ten || r.ma, luot: [] }); o.luot.push({ t: r.t, loai: r.loai, cach: r.cach }); });
    const vuaCham = list.filter(r => now - r.t < 90e3 && r.t <= now).slice(-3).reverse().map(r => ({ ten: r.ten || r.ma, t: r.t, loai: r.loai, cach: r.cach }));
    const nvCount = (await db.prepare('SELECT COUNT(*) AS n FROM nv WHERE active = 1').first()).n;
    return json({ ok: true, ten_cty: cfg.ten_cty, che_do: cfg.che_do, ip, ip_loai: ipKind(ip), now, het_han: (w + 1) * QR_STEP, qr: cfg.che_do === 'chi_wifi' ? null : qrSvg(link), hom_nay: Object.values(byNv).sort((a, b) => b.luot[b.luot.length - 1].t - a.luot[a.luot.length - 1].t), vua_cham: vuaCham, so_nv: nvCount, ...(env.DEV === '1' ? { _link: link } : {}) });
  }

  /* ----- quản lý ----- */
  if (p.startsWith('/api/ql/')) {
    if (!await session(db, req, 'ql')) return bad('Cần đăng nhập quản lý.', 401);
    const r = p.slice(8);
    if (r === 'tong-quan') {
      const ngay = String(url.searchParams.get('ngay') || '');
      let d0 = vnDayStart(now);
      const mm = ngay.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (mm) d0 = Date.UTC(+mm[3], +mm[2] - 1, +mm[1]) - VN;
      const [nv, cham, tc, ph] = await Promise.all([
        db.prepare('SELECT ma, ten, active, lock_until, pb, ncc, nguon, (pin IS NOT NULL) AS co_pin FROM nv ORDER BY ma').all(),
        punchesBetween(db, d0, d0 + 864e5),
        db.prepare('SELECT * FROM tu_choi ORDER BY t DESC LIMIT 100').all(),
        db.prepare("SELECT ma, tb, last FROM phien WHERE vai = 'nv'").all()
      ]);
      const tb = {}; ph.results.forEach(x => { (tb[x.ma] = tb[x.ma] || []).push(x.tb + ' (' + fmtShort(x.last) + ')'); });
      const ips = await officeIPs(db, cfg, now);
      const may_chung = await sharedDevices(db);
      const { ql_pin, ql_salt, qr_secret, ql_fail, ql_lock, schema_v, sync_key, ...pub } = cfg; pub.ket_noi = !!sync_key;
      return json({ ok: true, ngay0: d0, now, ip, ip_loai: ipKind(ip), wifi: matchOffice(ip, ips), cfg: pub, nv: nv.results.map(x => ({ ...x, thiet_bi: tb[x.ma] || [], khoa: x.lock_until > now })), cham, tu_choi: tc.results, ip_vp: ips, may_chung, may_toi: req.may });
    }
    if (r === 'nv' && req.method === 'POST') {
      const ma = String(body.ma || '').trim().toUpperCase(), ten = String(body.ten || '').trim().slice(0, 120);
      if (!/^[A-Z0-9._-]{1,20}$/.test(ma)) return bad('Mã nhân viên chỉ gồm chữ, số, dấu chấm, gạch (tối đa 20 ký tự).');
      const old = await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first();
      if (body.pin !== undefined && body.pin !== '' && !/^\d{4,8}$/.test(String(body.pin))) return bad('Mã PIN nhân viên cần 4–8 chữ số.');
      if (!old) {
        if (!ten) return bad('Nhập họ tên.');
        if (!body.pin) return bad('Đặt mã PIN ban đầu cho nhân viên.');
        const salt = randHex(16);
        await db.prepare('INSERT INTO nv (ma, ten, pin, salt, active, created) VALUES (?, ?, ?, ?, 1, ?)').bind(ma, ten, await hashPin(String(body.pin), salt), salt, now).run();
      } else {
        if (ten) await db.prepare('UPDATE nv SET ten = ? WHERE ma = ?').bind(ten, ma).run();
        if (body.pin) { const salt = randHex(16); await db.prepare('UPDATE nv SET pin = ?, salt = ?, fail = 0, lock_until = 0 WHERE ma = ?').bind(await hashPin(String(body.pin), salt), salt, ma).run(); }
        if (body.active !== undefined) await db.prepare('UPDATE nv SET active = ? WHERE ma = ?').bind(body.active ? 1 : 0, ma).run();
        if (body.mo_khoa) await db.prepare('UPDATE nv SET fail = 0, lock_until = 0 WHERE ma = ?').bind(ma).run();
      }
      if (body.go_thiet_bi || body.pin || body.active === false) await db.prepare("DELETE FROM phien WHERE vai = 'nv' AND ma = ?").bind(ma).run();
      return json({ ok: true });
    }
    if (r === 'ip' && req.method === 'POST') {
      if (body.xoa) { await db.prepare('DELETE FROM ip_vp WHERE ip = ?').bind(String(body.xoa)).run(); return json({ ok: true }); }
      const v = String(body.ip || ip).trim();
      if (!/^[0-9a-fA-F:.]{2,45}$/.test(v)) return bad('IP không hợp lệ.');
      await db.prepare("INSERT INTO ip_vp (ip, nguon, first, last) VALUES (?, 'tay', ?, ?) ON CONFLICT(ip) DO UPDATE SET nguon = 'tay', last = excluded.last").bind(v, now, now).run();
      return json({ ok: true });
    }
    if (r === 'cfg' && req.method === 'POST') {
      const o = {};
      if (['wifi_hoac_qr', 'chi_wifi', 'chi_qr'].includes(body.che_do)) o.che_do = body.che_do;
      if (body.ip_gio !== undefined) o.ip_gio = Math.min(24 * 30, Math.max(1, Number(body.ip_gio) || 72));
      if (body.hien_ip !== undefined) o.hien_ip = body.hien_ip ? '1' : '0';
      if (body.ten_cty) o.ten_cty = String(body.ten_cty).trim().slice(0, 120);
      if (body.pin_moi) {
        if (!/^\d{6,12}$/.test(String(body.pin_moi))) return bad('Mã PIN quản lý cần 6–12 chữ số.');
        const salt = randHex(16); o.ql_pin = await hashPin(String(body.pin_moi), salt); o.ql_salt = salt;
      }
      if (body.doi_qr) o.qr_secret = randHex(32);
      let maKetNoi = null; if (body.tao_ma_ket_noi) { maKetNoi = 'QTT-' + randHex(12).toUpperCase(); o.sync_key = await sha256(maKetNoi); o.sync_at = String(now); }
      if (Object.keys(o).length) await setCfg(db, o);
      if (body.pin_moi) await db.prepare("DELETE FROM phien WHERE vai = 'ql'").run();
      return json({ ok: true, dang_xuat: !!body.pin_moi, ma_ket_noi: maKetNoi });
    }
    if (r === 'cham' && req.method === 'POST') {
      if (body.huy) { await db.prepare('UPDATE cham SET huy = ?, ghi = COALESCE(ghi, \'\') || ? WHERE id = ?').bind(body.khoi_phuc ? 0 : 1, body.khoi_phuc ? '' : ' [Hủy ' + fmtShort(now) + ']', Number(body.huy)).run(); return json({ ok: true }); }
      const ma = String(body.ma || '').toUpperCase(), m1 = String(body.ngay || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/), m2 = String(body.gio || '').match(/^(\d{1,2}):(\d{2})$/);
      if (!m1 || !m2) return bad('Ngày dạng dd/mm/yyyy, giờ dạng HH:MM.');
      if (!String(body.ghi || '').trim()) return bad('Ghi lý do chấm bổ sung (vd: quên chấm, có xác nhận của quản lý).');
      if (!await db.prepare('SELECT ma FROM nv WHERE ma = ?').bind(ma).first()) return bad('Không có nhân viên này.');
      const t = Date.UTC(+m1[3], +m1[2] - 1, +m1[1], +m2[1], +m2[2]) - VN;
      await db.prepare("INSERT INTO cham (ma, t, loai, cach, ip, wifi, tb, ghi, nguoi) VALUES (?, ?, ?, 'tay', ?, 0, ?, ?, 'Quản lý')").bind(ma, t, body.loai === 'ra' ? 'ra' : 'vao', ip, shortUA(req.headers.get('user-agent')), String(body.ghi).trim().slice(0, 200)).run();
      return json({ ok: true });
    }
    if (r === 'xuat') {
      const th = String(url.searchParams.get('thang') || '').match(/^(\d{2})\/(\d{4})$/);
      if (!th) return bad('Tháng dạng mm/yyyy.');
      const from = Date.UTC(+th[2], +th[1] - 1, 1) - VN, to = Date.UTC(+th[2], +th[1], 1) - VN;
      const rows = await punchesBetween(db, from, to);
      const esc = v => { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      const CACH = { wifi: 'Wi-Fi', qr: 'QR', tay: 'Nhập tay' };
      const shared = {}; (await sharedDevices(db)).forEach(d => { if (!d.bo_qua) shared[d.may] = d.nv; });
      const lines = [['Mã NV', 'Họ tên', 'Ngày', 'Giờ', 'Loại', 'Cách chấm', 'IP', 'Thiết bị', 'Mã máy', 'Cảnh báo', 'Ghi chú', 'Trạng thái'].join(',')];
      rows.forEach(x => {
        const q = vnParts(x.t), sh = x.may && shared[x.may] ? shared[x.may].filter(o => o.ma !== x.ma) : [];
        lines.push([x.ma, x.ten || '', q.d + '/' + q.m + '/' + q.y, q.h + ':' + q.mi + ':' + q.s, x.loai === 'ra' ? 'Ra' : 'Vào', CACH[x.cach] || x.cach, x.ip, x.tb, x.may ? x.may.slice(0, 6) : '', sh.length ? 'Máy dùng chung với ' + sh.map(o => o.ma).join(', ') : '', x.ghi, x.huy ? 'Đã hủy' : 'Hợp lệ'].map(esc).join(','));
      });
      return new Response('﻿' + lines.join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="Cham_cong_' + th[2] + '_' + th[1] + '.csv"', 'cache-control': 'no-store' } });
    }
    if (r === 'may' && req.method === 'POST') {
      const may = String(body.may || '');
      if (!/^[0-9a-f]{12,32}$/.test(may)) return bad('Mã máy không hợp lệ.');
      if (body.bat_lai) await db.prepare('DELETE FROM may_bo_qua WHERE may = ?').bind(may).run();
      else await db.prepare('INSERT INTO may_bo_qua (may, ghi, t) VALUES (?, ?, ?) ON CONFLICT(may) DO UPDATE SET ghi = excluded.ghi, t = excluded.t').bind(may, String(body.ghi || '').trim().slice(0, 200) || 'Đã kiểm tra', now).run();
      return json({ ok: true });
    }
    if (r === 'xoa-du-lieu' && req.method === 'POST') {
      if (body.xac_nhan !== 'XOA') return bad('Gõ XOA để xác nhận.');
      await db.batch([db.prepare('DELETE FROM cham'), db.prepare('DELETE FROM tu_choi')]);
      return json({ ok: true });
    }
  }
  return bad('Không có địa chỉ này.', 404);
}
function fmtShort(t) { const q = vnParts(t); return q.h + ':' + q.mi + ' ' + q.d + '/' + q.m; }

/* ---------- trang ---------- */
const MANIFEST = JSON.stringify({ name: 'Chấm công', short_name: 'Chấm công', start_url: '/', scope: '/', display: 'standalone', background_color: '#F4EFE5', theme_color: '#2F7D4F', icons: [{ src: '/icon.png', sizes: '512x512', type: 'image/png' }, { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] });
function b64ToBytes(b64) { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
const SEC = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    let may = cookies(req).qtt_may, newMay = false;
    if (!/^[0-9a-f]{16}$/.test(may || '')) { may = randHex(8); newMay = true; }
    req.may = may;
    const withMay = res => { if (newMay) res.headers.append('set-cookie', 'qtt_may=' + may + '; Path=/; Max-Age=' + (2 * 365 * 864e2) + '; HttpOnly; Secure; SameSite=Lax'); return res; };
    try {
      if (url.pathname.startsWith('/api/')) return withMay(await api(req, env, url));
      if (url.pathname === '/manifest.webmanifest') return new Response(MANIFEST, { headers: { 'content-type': 'application/manifest+json', 'cache-control': 'max-age=3600' } });
      if (url.pathname === '/icon.png') return new Response(b64ToBytes(ICON_PNG_B64), { headers: { 'content-type': 'image/png', 'cache-control': 'max-age=86400' } });
      if (url.pathname === '/icon.svg') return new Response(ICON_SVG, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=86400' } });
      const ROUTES = { '/': 'nv', '/q': 'q', '/tram': 'tram', '/quan-ly': 'ql' };
      const route = ROUTES[url.pathname.replace(/\/+$/, '') || '/'];
      if (!route) return new Response('Không có trang này', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      const html = APP_HTML.replace('{{ROUTE}}', route).replace(/{{VER}}/g, VER);
      return withMay(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SEC } }));
    } catch (e) {
      return json({ ok: false, loi: 'Lỗi máy chủ: ' + (e && e.message || e) }, 500);
    }
  }
};
