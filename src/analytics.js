/* ============================================================
 * Quản trị tử tế — Phân tích web (v1.20, 18/10/2026)
 * Đo lường tự xây, dữ liệu nằm trong D1 của web, xem ở Quản trị → Phân tích web.
 *
 * NGUYÊN TẮC RIÊNG TƯ
 *  - Không cookie, không lưu IP, không lưu nội dung người dùng gõ/nạp.
 *  - "Người truy cập" = mã băm (IP + trình duyệt + ngày + muối bí mật) → chỉ đếm được trong 1 ngày, không lần ra người.
 *  - Phiên = mã ngẫu nhiên trong sessionStorage của tab (hết khi đóng tab hoặc 30 phút không thao tác).
 *  - Nút bấm chỉ ghi chữ trên nút của chính web (tối đa 60 ký tự) + đường dẫn đích.
 *  - Dữ liệu cũ hơn 400 ngày tự xoá.
 *
 * Bảng:
 *  wa_views  : 1 dòng = 1 lần xem trang (kèm thời gian ở lại, độ cuộn, tốc độ tải đo trên máy người dùng)
 *  wa_events : nút được bấm (click), chuyển đổi (conv: đăng ký nhận tin, gửi đề xuất, đặt lịch, góp ý), dùng công cụ (tool_use)
 *
 * API công khai : POST /api/t        (gọi từ /qtt-analytics.js và /qtt-track.js, dạng sendBeacon)
 * API quản trị  : GET  /api/admin/analytics?days=7|30|90|1
 * ============================================================ */
import { json, now, vnDate, sha256, clean } from './core.js';

export const WA_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS wa_views (id TEXT PRIMARY KEY, sid TEXT NOT NULL, vis TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL, day TEXT NOT NULL,
    path TEXT NOT NULL, prev TEXT NOT NULL DEFAULT '', entry INTEGER NOT NULL DEFAULT 0, src TEXT NOT NULL DEFAULT '', ref_host TEXT NOT NULL DEFAULT '',
    utm_source TEXT NOT NULL DEFAULT '', utm_medium TEXT NOT NULL DEFAULT '', utm_campaign TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '', browser TEXT NOT NULL DEFAULT '', os TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', ret INTEGER NOT NULL DEFAULT 0,
    dur INTEGER NOT NULL DEFAULT 0, scroll INTEGER NOT NULL DEFAULT 0, lcp INTEGER, inp INTEGER, cls REAL, ttfb INTEGER, updated_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_wa_views_day ON wa_views(day)`,
  `CREATE INDEX IF NOT EXISTS idx_wa_views_sid ON wa_views(sid, ts)`,
  `CREATE TABLE IF NOT EXISTS wa_events (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT NOT NULL, ts INTEGER NOT NULL, day TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', target TEXT NOT NULL DEFAULT '')`,
  `CREATE INDEX IF NOT EXISTS idx_wa_events_day ON wa_events(day, kind)`,
];
let ready = null;
export function ensureAnalyticsSchema(env) {
  if (!ready) ready = env.DB.batch(WA_SCHEMA.map(s => env.DB.prepare(s))).catch(e => { ready = null; console.error('analytics schema', e); });
  return ready;
}

/* ---------------- phân loại (chạy trên máy chủ, không lưu chuỗi UA gốc) ---------------- */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|zalo.*preview|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|httpclient|phantom|selenium|puppeteer|playwright/i;
export function parseUA(ua = '', vw = 0) {
  const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /cros/i.test(ua) ? 'ChromeOS' : /linux/i.test(ua) ? 'Linux' : 'Khác';
  const browser = /zalo/i.test(ua) ? 'Zalo (trong app)' : /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua) ? 'Facebook (trong app)' : /instagram/i.test(ua) ? 'Instagram (trong app)'
    : /tiktok|musical_ly|bytedancewebview/i.test(ua) ? 'TikTok (trong app)' : /coc_coc|coccoc/i.test(ua) ? 'Cốc Cốc' : /edg\//i.test(ua) ? 'Edge'
    : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet' : /firefox|fxios/i.test(ua) ? 'Firefox'
    : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Khác';
  const device = /ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua)) ? 'Máy tính bảng' : /mobi|iphone|ipod|android/i.test(ua) ? 'Điện thoại' : vw && vw < 760 ? 'Điện thoại' : 'Máy tính';
  return { os, browser, device };
}
const SRC_HOST = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, 'Facebook'], [/(^|\.)zalo\.(me|vn)$|zaloapp/, 'Zalo'], [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'], [/(^|\.)instagram\.com$/, 'Instagram'], [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'], [/(^|\.)threads\.net$/, 'Threads'],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'X (Twitter)'], [/(^|\.)coccoc\.com$/, 'Cốc Cốc'], [/(^|\.)bing\.com$/, 'Bing'], [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/, 'Email'], [/(^|\.)(chatgpt\.com|openai\.com|claude\.ai|perplexity\.ai|gemini\.google\.com)$/, 'Trợ lý AI'],
];
const SRC_UTM = { 'facebook-group': 'Facebook (group)', facebook: 'Facebook', fb: 'Facebook', zalo: 'Zalo', tiktok: 'TikTok', youtube: 'YouTube', google: 'Google', email: 'Email', newsletter: 'Email', instagram: 'Instagram', linkedin: 'LinkedIn' };
export function sourceOf({ refHost = '', utmSource = '', utmMedium = '', browser = '', selfHost = '' }) {
  const us = utmSource.toLowerCase(), um = utmMedium.toLowerCase();
  if (um === 'email' || us === 'email' || us === 'newsletter') return 'Email';
  if (us && SRC_UTM[us]) return SRC_UTM[us];
  if (us) return us.slice(0, 30);
  const h = refHost.toLowerCase();
  if (h && h !== selfHost && !h.endsWith('.' + selfHost)) { for (const [re, n] of SRC_HOST) if (re.test(h)) return n; return 'Trang khác'; }
  if (/Zalo/.test(browser)) return 'Zalo';
  if (/Facebook/.test(browser)) return 'Facebook';
  if (/TikTok/.test(browser)) return 'TikTok';
  if (/Instagram/.test(browser)) return 'Instagram';
  return 'Trực tiếp';
}
/* chuẩn hoá đường dẫn: bỏ query trừ ?phong= của Góc ngẫm; bỏ / cuối; tối đa 120 ký tự */
export function normPath(p = '/') {
  let u; try { u = new URL(p, 'https://x.local'); } catch { return '/'; }
  let path = (u.pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/').toLowerCase();
  if (/^\/tools\/[a-z0-9-]+/.test(path)) path = path.match(/^\/tools\/[a-z0-9-]+/)[0] + '/';
  const ph = u.searchParams.get('phong');
  if (path === '/goc-ngam' && ph && /^[a-z0-9-]{1,30}$/.test(ph)) path += '?phong=' + ph;
  return path.slice(0, 120);
}
const ID = v => /^[A-Za-z0-9_-]{8,40}$/.test(String(v || '')) ? String(v) : '';
const int = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };
const KINDS = new Set(['click', 'conv', 'tool_use']);

async function salt(env) {
  let s = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_wa_salt'`).first('value');
  if (!s) { s = crypto.randomUUID() + crypto.randomUUID(); await env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('_wa_salt', ?1)`).bind(s).run(); s = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_wa_salt'`).first('value'); }
  return s;
}

/* ---------------- POST /api/t ---------------- */
export async function collect(request, env, ctx) {
  const ok = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  const ua = request.headers.get('user-agent') || '';
  if (!ua || BOT.test(ua)) return ok();
  let b; try { const t = await request.text(); if (t.length > 8000) return ok(); b = JSON.parse(t); } catch { return ok(); }
  if (!b || typeof b !== 'object') return ok();
  await ensureAnalyticsSchema(env);
  const sid = ID(b.sid), t = now(), day = vnDate(t);
  if (!sid) return ok();
  const selfHost = new URL(request.url).hostname.replace(/^www\./, '');
  const stmts = [];
  if (b.t === 'pv') {
    const id = ID(b.id); if (!id) return ok();
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const vis = (await sha256([await salt(env), day, ip, ua].join('|'))).slice(0, 20);
    const { os, browser, device } = parseUA(ua, int(b.vw, 0, 10000) || 0);
    let refHost = ''; try { refHost = b.ref ? new URL(String(b.ref)).hostname.replace(/^www\./, '').slice(0, 80) : ''; } catch { }
    const entry = b.entry ? 1 : 0;
    const src = entry ? sourceOf({ refHost, utmSource: clean(b.us, 40), utmMedium: clean(b.um, 40), browser, selfHost }) : '';
    stmts.push(env.DB.prepare(`INSERT OR IGNORE INTO wa_views (id, sid, vis, ts, day, path, prev, entry, src, ref_host, utm_source, utm_medium, utm_campaign, device, browser, os, country, ret, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?4)`).bind(
      id, sid, vis, t, day, normPath(b.p), b.prev ? normPath(b.prev) : '', entry, src, entry && refHost !== selfHost ? refHost : '',
      entry ? clean(b.us, 40) : '', entry ? clean(b.um, 40) : '', entry ? clean(b.uc, 60) : '', device, browser, os,
      clean((request.cf && request.cf.country) || '', 4), b.ret ? 1 : 0));
  } else if (b.t === 'end') {
    const id = ID(b.id); if (!id) return ok();
    const dur = int(b.dur, 0, 3 * 3600 * 1000), sc = int(b.sc, 0, 100);
    const lcp = b.lcp == null ? null : int(b.lcp, 0, 120000), inp = b.inp == null ? null : int(b.inp, 0, 60000), ttfb = b.ttfb == null ? null : int(b.ttfb, 0, 120000);
    const cls = b.cls == null || !Number.isFinite(+b.cls) ? null : Math.min(10, Math.max(0, Math.round(+b.cls * 1000) / 1000));
    stmts.push(env.DB.prepare(`UPDATE wa_views SET dur = MAX(dur, ?3), scroll = MAX(scroll, ?4), lcp = COALESCE(?5, lcp), inp = COALESCE(?6, inp),
      cls = COALESCE(?7, cls), ttfb = COALESCE(?8, ttfb), updated_at = ?9 WHERE id = ?1 AND sid = ?2`).bind(id, sid, dur || 0, sc || 0, lcp, inp, cls, ttfb, t));
  }
  // sự kiện đi kèm (nút bấm, chuyển đổi, dùng công cụ) – tối đa 30 mỗi lần gửi
  const evs = Array.isArray(b.ev) ? b.ev.slice(0, 30) : [];
  for (const e of evs) {
    if (!e || !KINDS.has(e.k)) continue;
    stmts.push(env.DB.prepare(`INSERT INTO wa_events (sid, ts, day, path, kind, name, target) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`)
      .bind(sid, t, day, normPath(e.p || b.p || '/'), e.k, clean(e.n, 60), clean(e.to, 120)));
  }
  if (!stmts.length) return ok();
  // dọn dữ liệu > 400 ngày, thỉnh thoảng (≈1/300 lần ghi)
  if (Math.random() < 1 / 300) {
    const old = vnDate(t - 400 * 86400000);
    stmts.push(env.DB.prepare(`DELETE FROM wa_views WHERE day < ?1`).bind(old), env.DB.prepare(`DELETE FROM wa_events WHERE day < ?1`).bind(old));
  }
  const run = env.DB.batch(stmts).catch(e => console.error('wa collect', e));
  if (ctx && ctx.waitUntil) ctx.waitUntil(run); else await run;
  return ok();
}

/* ---------------- GET /api/admin/analytics ---------------- */
const p75 = arr => { const a = arr.filter(v => v != null && Number.isFinite(v)).sort((x, y) => x - y); if (!a.length) return null; return a[Math.min(a.length - 1, Math.ceil(a.length * 0.75) - 1)]; };
export const VITAL = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25], ttfb: [800, 1800] };
export async function report(env, url) {
  await ensureAnalyticsSchema(env);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days'), 10) || 30));
  const t = now(), today = vnDate(t), from = vnDate(t - (days - 1) * 86400000);
  const prevFrom = vnDate(t - (2 * days - 1) * 86400000), prevTo = vnDate(t - days * 86400000);
  const q = (sql, ...p) => env.DB.prepare(sql).bind(...p).all().then(r => r.results);
  const one = (sql, ...p) => env.DB.prepare(sql).bind(...p).first();
  // phiên trong kỳ: tóm tắt mỗi phiên bằng SQL (số trang, có bấm, tổng thời gian)
  const SESS = `WITH s AS (SELECT sid, COUNT(*) AS pv, SUM(dur) AS dur, MIN(ts) AS t0 FROM wa_views WHERE day >= ?1 AND day <= ?2 GROUP BY sid),
    c AS (SELECT DISTINCT sid FROM wa_events WHERE day >= ?1 AND day <= ?2 AND kind IN ('click','conv','tool_use'))`;
  const kpi = (a, b) => one(`${SESS} SELECT (SELECT COUNT(*) FROM wa_views WHERE day >= ?1 AND day <= ?2) AS views, COUNT(*) AS sessions,
      (SELECT COUNT(DISTINCT vis || day) FROM wa_views WHERE day >= ?1 AND day <= ?2) AS visitors,
      ROUND(AVG(s.dur)) AS avg_dur, ROUND(AVG(s.pv), 2) AS pv_per_s,
      SUM(CASE WHEN s.pv = 1 AND c.sid IS NULL THEN 1 ELSE 0 END) AS bounces,
      (SELECT COUNT(*) FROM wa_views WHERE day >= ?1 AND day <= ?2 AND entry = 1 AND ret = 1) AS ret_sessions
    FROM s LEFT JOIN c ON c.sid = s.sid`, a, b);
  const [cur, prev, live, daily, sources, devices, browsers, oss, countries, pages, entries, exits, flows, clicks, convs, toolUse, toolsT, vitals, utm, refs] = await Promise.all([
    kpi(from, today), kpi(prevFrom, prevTo),
    one(`SELECT COUNT(DISTINCT sid) AS n FROM wa_views WHERE updated_at >= ?1`, t - 5 * 60000),
    q(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT sid) AS sessions, COUNT(DISTINCT vis) AS visitors FROM wa_views WHERE day >= ?1 GROUP BY day ORDER BY day`, from),
    q(`SELECT src AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY src ORDER BY n DESC`, from),
    q(`SELECT device AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY device ORDER BY n DESC`, from),
    q(`SELECT browser AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY browser ORDER BY n DESC LIMIT 10`, from),
    q(`SELECT os AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY os ORDER BY n DESC`, from),
    q(`SELECT country AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY country ORDER BY n DESC LIMIT 10`, from),
    q(`SELECT path AS k, COUNT(*) AS views, COUNT(DISTINCT sid) AS sessions, ROUND(AVG(CASE WHEN dur > 0 THEN dur END)) AS dur, ROUND(AVG(CASE WHEN dur > 0 THEN scroll END)) AS scroll
       FROM wa_views WHERE day >= ?1 GROUP BY path ORDER BY views DESC LIMIT 25`, from),
    q(`SELECT path AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 GROUP BY path ORDER BY n DESC LIMIT 10`, from),
    q(`SELECT v.path AS k, COUNT(*) AS n FROM wa_views v JOIN (SELECT sid, MAX(ts) AS mt FROM wa_views WHERE day >= ?1 GROUP BY sid) l ON l.sid = v.sid AND l.mt = v.ts
       WHERE v.day >= ?1 GROUP BY v.path ORDER BY n DESC LIMIT 10`, from),
    q(`SELECT prev AS a, path AS b, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND prev <> '' AND prev <> path GROUP BY prev, path ORDER BY n DESC LIMIT 15`, from),
    q(`SELECT name AS k, target AS to_, path, COUNT(*) AS n, COUNT(DISTINCT sid) AS s FROM wa_events WHERE day >= ?1 AND kind = 'click' GROUP BY name, target ORDER BY n DESC LIMIT 25`, from),
    q(`SELECT name AS k, COUNT(*) AS n, COUNT(DISTINCT sid) AS s FROM wa_events WHERE day >= ?1 AND kind = 'conv' GROUP BY name ORDER BY n DESC`, from),
    q(`SELECT COUNT(DISTINCT sid) AS s FROM wa_events WHERE day >= ?1 AND kind = 'tool_use'`, from),
    q(`SELECT slug, name, url FROM tools`),
    q(`SELECT path, device, lcp, inp, cls, ttfb FROM wa_views WHERE day >= ?1 AND (lcp IS NOT NULL OR inp IS NOT NULL OR cls IS NOT NULL OR ttfb IS NOT NULL) ORDER BY ts DESC LIMIT 5000`, from),
    q(`SELECT utm_source AS s, utm_medium AS m, utm_campaign AS c, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 AND (utm_source <> '' OR utm_campaign <> '') GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 15`, from),
    q(`SELECT ref_host AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND entry = 1 AND ref_host <> '' GROUP BY ref_host ORDER BY n DESC LIMIT 10`, from),
  ]);
  // phễu Bộ công cụ (đếm theo phiên)
  const fun = await one(`SELECT COUNT(DISTINCT sid) AS s0,
      COUNT(DISTINCT CASE WHEN path = '/cong-cu' OR path LIKE '/cong-cu/%' THEN sid END) AS s1,
      COUNT(DISTINCT CASE WHEN path LIKE '/cong-cu/%' THEN sid END) AS s2,
      COUNT(DISTINCT CASE WHEN path LIKE '/tools/%' THEN sid END) AS s3 FROM wa_views WHERE day >= ?1`, from);
  // tốc độ: p75 toàn web, theo thiết bị, theo trang
  const pick = (rows, k) => rows.map(r => r[k]);
  const sum = rows => ({ n: rows.length, lcp: p75(pick(rows, 'lcp')), inp: p75(pick(rows, 'inp')), cls: p75(pick(rows, 'cls')), ttfb: p75(pick(rows, 'ttfb')) });
  const group = key => { const m = {}; vitals.forEach(r => (m[r[key]] = m[r[key]] || []).push(r)); return Object.entries(m).map(([k, rows]) => ({ k, ...sum(rows) })).sort((a, b) => b.n - a.n); };
  const toolName = {}; toolsT.forEach(x => { toolName['/cong-cu/' + x.slug] = x.name; const m = String(x.url || '').match(/^\/tools\/([a-z0-9-]+)/); if (m) toolName['/tools/' + m[1] + '/'] = x.name; });
  return json({
    days, from, today, prevFrom, prevTo, cur, prev, live: live ? live.n : 0, daily, sources, devices, browsers, oss, countries, pages, entries, exits, flows, clicks, convs, utm, refs,
    funnel: { s0: fun.s0, s1: fun.s1, s2: fun.s2, s3: fun.s3, s4: (toolUse[0] || {}).s || 0 }, toolName,
    vitals: { all: sum(vitals), devices: group('device'), pages: group('path').slice(0, 12), th: VITAL },
  });
}
