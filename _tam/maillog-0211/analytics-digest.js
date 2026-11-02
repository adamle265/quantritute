/* ============================================================
 * Quản trị tử tế — Thư số liệu web hằng ngày (v1.21, 20/10/2026)
 * Worker quantritute-watch chạy 07:30 giờ VN (00:30 UTC): gom số liệu NGÀY HÔM QUA từ bảng Phân tích web
 * (wa_views, wa_events, tool_stats, requests, bookings, feedback, subscribers), so với hôm kia và trung bình 7 ngày trước,
 * rồi gửi 1 thư qua Resend tới WA_REPORT_TO (watch/wrangler.jsonc → vars).
 * Tác vụ Claude 08:00 đọc thư này trong Gmail, phân tích và báo cáo cho anh.
 *
 * Riêng tư: thư chỉ chứa SỐ ĐẾM (không email, SĐT, nội dung người dùng gõ, không mã người truy cập).
 * Gửi thử: Quản trị → Phân tích web → nút "Gửi thử thư số liệu" (POST /api/admin/analytics-digest).
 * ============================================================ */
import { now, vnDate } from './core.js';
import { ensureAnalyticsSchema, VITAL } from './analytics.js';
import { mailStatus, sendMail } from './mailer.js';

export const DIGEST_TAG = '[QTT-SO-LIEU]';
const DAY = 86400000;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dmy = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
const p75 = arr => { const a = arr.filter(v => v != null && Number.isFinite(v)).sort((x, y) => x - y); if (!a.length) return null; return a[Math.min(a.length - 1, Math.ceil(a.length * 0.75) - 1)]; };
/* ms của 00:00 giờ VN ngày yyyy-mm-dd */
const vnStart = d => Date.parse(d + 'T00:00:00+07:00');

export async function buildDigest(env, { day } = {}) {
  await ensureAnalyticsSchema(env);
  const t = now();
  const D = /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day : vnDate(t - DAY);   // mặc định: hôm qua
  const back = n => vnDate(vnStart(D) - n * DAY + 3600000);
  const D1 = back(1), W0 = back(7), W1 = back(1), H14 = back(13);
  const q = (sql, ...p) => env.DB.prepare(sql).bind(...p).all().then(r => r.results).catch(() => []);
  const one = (sql, ...p) => env.DB.prepare(sql).bind(...p).first().catch(() => null);
  const SESS = `WITH s AS (SELECT sid, COUNT(*) AS pv, SUM(dur) AS dur FROM wa_views WHERE day >= ?1 AND day <= ?2 GROUP BY sid),
    c AS (SELECT DISTINCT sid FROM wa_events WHERE day >= ?1 AND day <= ?2 AND kind IN ('click','conv','tool_use'))`;
  const kpi = (a, b) => one(`${SESS} SELECT (SELECT COUNT(*) FROM wa_views WHERE day >= ?1 AND day <= ?2) AS views, COUNT(*) AS sessions,
      (SELECT COUNT(DISTINCT vis || day) FROM wa_views WHERE day >= ?1 AND day <= ?2) AS visitors,
      ROUND(AVG(s.dur)) AS avg_dur_ms, ROUND(AVG(s.pv), 2) AS pages_per_session,
      SUM(CASE WHEN s.pv = 1 AND c.sid IS NULL THEN 1 ELSE 0 END) AS bounces,
      (SELECT COUNT(*) FROM wa_views WHERE day >= ?1 AND day <= ?2 AND entry = 1 AND ret = 1) AS returning_sessions
    FROM s LEFT JOIN c ON c.sid = s.sid`, a, b);
  const funnel = (a, b) => one(`SELECT COUNT(DISTINCT sid) AS all_sessions,
      COUNT(DISTINCT CASE WHEN path = '/cong-cu' OR path LIKE '/cong-cu/%' THEN sid END) AS saw_toolshelf,
      COUNT(DISTINCT CASE WHEN path LIKE '/cong-cu/%' THEN sid END) AS opened_tool_detail,
      COUNT(DISTINCT CASE WHEN path LIKE '/tools/%' THEN sid END) AS opened_tool,
      (SELECT COUNT(DISTINCT sid) FROM wa_events WHERE day >= ?1 AND day <= ?2 AND kind = 'tool_use') AS used_tool
    FROM wa_views WHERE day >= ?1 AND day <= ?2`, a, b);
  const startD = vnStart(D), endD = startD + DAY;
  const cnt = (table, extra = '') => one(`SELECT COUNT(*) AS n FROM ${table} WHERE created_at >= ?1 AND created_at < ?2 ${extra}`, startD, endD).then(r => r ? r.n : 0);

  const [kD, kD1, kW, daily, srcD, srcW, devD, brD, osD, ctyD, pagesD, entD, exitD, flowD, clickD, convD, convW, useD, fD, fW, vit, refD, utmD, toolsT, tsD, tsW,
    nReq, nBook, nFb, nSub, nSubOk] = await Promise.all([
    kpi(D, D), kpi(D1, D1), kpi(W0, W1),
    q(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT sid) AS sessions, COUNT(DISTINCT vis) AS visitors FROM wa_views WHERE day >= ?1 AND day <= ?2 GROUP BY day ORDER BY day`, H14, D),
    q(`SELECT src AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY src ORDER BY n DESC`, D),
    q(`SELECT src AS k, COUNT(*) AS n FROM wa_views WHERE day >= ?1 AND day <= ?2 AND entry = 1 GROUP BY src ORDER BY n DESC`, W0, W1),
    q(`SELECT device AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY device ORDER BY n DESC`, D),
    q(`SELECT browser AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY browser ORDER BY n DESC LIMIT 8`, D),
    q(`SELECT os AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY os ORDER BY n DESC`, D),
    q(`SELECT country AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY country ORDER BY n DESC LIMIT 6`, D),
    q(`SELECT path AS k, COUNT(*) AS views, COUNT(DISTINCT sid) AS sessions, ROUND(AVG(CASE WHEN dur > 0 THEN dur END)) AS avg_dur_ms, ROUND(AVG(CASE WHEN dur > 0 THEN scroll END)) AS avg_scroll_pct
       FROM wa_views WHERE day = ?1 GROUP BY path ORDER BY views DESC LIMIT 15`, D),
    q(`SELECT path AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 GROUP BY path ORDER BY n DESC LIMIT 8`, D),
    q(`SELECT v.path AS k, COUNT(*) AS n FROM wa_views v JOIN (SELECT sid, MAX(ts) AS mt FROM wa_views WHERE day = ?1 GROUP BY sid) l ON l.sid = v.sid AND l.mt = v.ts
       WHERE v.day = ?1 GROUP BY v.path ORDER BY n DESC LIMIT 8`, D),
    q(`SELECT prev AS a, path AS b, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND prev <> '' AND prev <> path GROUP BY prev, path ORDER BY n DESC LIMIT 10`, D),
    q(`SELECT name AS k, target AS to_, path, COUNT(*) AS n, COUNT(DISTINCT sid) AS sessions FROM wa_events WHERE day = ?1 AND kind = 'click' GROUP BY name, target ORDER BY n DESC LIMIT 15`, D),
    q(`SELECT name AS k, COUNT(*) AS n, COUNT(DISTINCT sid) AS sessions FROM wa_events WHERE day = ?1 AND kind = 'conv' GROUP BY name ORDER BY n DESC`, D),
    q(`SELECT name AS k, COUNT(*) AS n FROM wa_events WHERE day >= ?1 AND day <= ?2 AND kind = 'conv' GROUP BY name ORDER BY n DESC`, W0, W1),
    q(`SELECT path AS k, COUNT(*) AS n, COUNT(DISTINCT sid) AS sessions FROM wa_events WHERE day = ?1 AND kind = 'tool_use' GROUP BY path ORDER BY n DESC`, D),
    funnel(D, D), funnel(W0, W1),
    q(`SELECT path, device, lcp, inp, cls, ttfb FROM wa_views WHERE day >= ?1 AND day <= ?2 AND (lcp IS NOT NULL OR inp IS NOT NULL OR cls IS NOT NULL OR ttfb IS NOT NULL) LIMIT 5000`, W0, D),
    q(`SELECT ref_host AS k, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 AND ref_host <> '' GROUP BY ref_host ORDER BY n DESC LIMIT 8`, D),
    q(`SELECT utm_source AS s, utm_medium AS m, utm_campaign AS c, COUNT(*) AS n FROM wa_views WHERE day = ?1 AND entry = 1 AND (utm_source <> '' OR utm_campaign <> '') GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 8`, D),
    q(`SELECT slug, name, status, url FROM tools`),
    q(`SELECT slug, visits, uses, downloads FROM tool_stats WHERE day = ?1`, D),
    q(`SELECT slug, SUM(visits) AS visits, SUM(uses) AS uses, SUM(downloads) AS downloads FROM tool_stats WHERE day >= ?1 AND day <= ?2 GROUP BY slug`, W0, W1),
    cnt('requests'), cnt('bookings'), cnt('feedback'), cnt('subscribers'),
    one(`SELECT COUNT(*) AS n FROM subscribers WHERE confirmed_at >= ?1 AND confirmed_at < ?2`, startD, endD).then(r => r ? r.n : 0),
  ]);

  const avg7 = k => kW && kW[k] != null ? Math.round(kW[k] / 7 * 10) / 10 : null;
  const sumV = rows => ({ samples: rows.length, lcp_ms: p75(rows.map(r => r.lcp)), inp_ms: p75(rows.map(r => r.inp)), cls: p75(rows.map(r => r.cls)), ttfb_ms: p75(rows.map(r => r.ttfb)) });
  const grp = key => { const m = {}; vit.forEach(r => (m[r[key]] = m[r[key]] || []).push(r)); return Object.entries(m).map(([k, rows]) => ({ k, ...sumV(rows) })).sort((a, b) => b.samples - a.samples); };
  const toolName = {}; toolsT.forEach(x => { toolName['/cong-cu/' + x.slug] = x.name; const m = String(x.url || '').match(/^\/tools\/([a-z0-9-]+)/); if (m) toolName['/tools/' + m[1] + '/'] = x.name; });
  const tsMap = {}; toolsT.forEach(x => (tsMap[x.slug] = { slug: x.slug, name: x.name, status: x.status, day: { visits: 0, uses: 0, downloads: 0 }, prev7_total: { visits: 0, uses: 0, downloads: 0 } }));
  tsD.forEach(r => { if (tsMap[r.slug]) tsMap[r.slug].day = { visits: r.visits, uses: r.uses, downloads: r.downloads }; });
  tsW.forEach(r => { if (tsMap[r.slug]) tsMap[r.slug].prev7_total = { visits: r.visits, uses: r.uses, downloads: r.downloads }; });
  const tools = Object.values(tsMap).filter(x => x.day.visits + x.day.uses + x.day.downloads + x.prev7_total.visits + x.prev7_total.uses + x.prev7_total.downloads > 0)
    .sort((a, b) => (b.day.visits + b.day.uses) - (a.day.visits + a.day.uses));

  return {
    version: 'qtt-digest-1', generated_at_vn: new Date(t + 7 * 3600000).toISOString().slice(0, 16).replace('T', ' '),
    report_day: D, report_day_vn: dmy(D), compare: { day_before: D1, prev7_from: W0, prev7_to: W1 },
    notes: 'Số đếm từ module Phân tích web tự xây (không cookie). visitors = ước tính trong ngày. Thời lượng tính bằng mili giây. prev7_avg = trung bình/ngày của 7 ngày trước ngày báo cáo. Lượt của máy anh Tuấn đã bật "Không đếm" thì không tính.',
    kpi: { day: kD, day_before: kD1, prev7_avg: kW ? { views: avg7('views'), sessions: avg7('sessions'), visitors: avg7('visitors'), bounces: avg7('bounces'), returning_sessions: avg7('returning_sessions'), avg_dur_ms: kW.avg_dur_ms, pages_per_session: kW.pages_per_session } : null },
    daily_14d: daily,
    sources: { day: srcD, prev7_total: srcW }, referrers_day: refD, utm_day: utmD,
    audience_day: { devices: devD, browsers: brD, os: osD, countries: ctyD },
    pages_day: pagesD, entry_pages_day: entD, exit_pages_day: exitD, flows_day: flowD,
    clicks_day: clickD, conversions: { day: convD, prev7_total: convW }, tool_use_day: useD,
    funnel_toolshelf: { day: fD, prev7_total: fW },
    web_vitals_p75_last8d: { thresholds_good_poor: VITAL, all: sumV(vit), by_device: grp('device'), by_page: grp('path').slice(0, 8) },
    tool_counters: tools, tool_names: toolName,
    new_records_day: { tool_requests: nReq, consult_bookings: nBook, feedback: nFb, email_signups: nSub, email_confirmed: nSubOk },
  };
}

function html(d) {
  const k = d.kpi.day || {}, p = d.kpi.day_before || {}, w = d.kpi.prev7_avg || {};
  const row = (label, key) => `<tr><td>${label}</td><td align="right"><b>${esc(k[key] ?? 0)}</b></td><td align="right">${esc(p[key] ?? 0)}</td><td align="right">${esc(w[key] ?? '–')}</td></tr>`;
  const list = rows => rows && rows.length ? rows.map(r => `${esc(r.k || '(trống)')}: ${esc(r.n ?? r.views)}`).join(' · ') : '–';
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:680px">
  <h2 style="margin:0 0 4px">Số liệu web quantritute.com – ngày ${esc(d.report_day_vn)}</h2>
  <p style="color:#666;margin:0 0 12px">Thư tự động từ Worker quantritute-watch, dành cho tác vụ báo cáo hằng ngày. Chỉ chứa số đếm.</p>
  <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd"><tr style="background:#f5f1e8"><th align="left">Chỉ số</th><th>Hôm qua</th><th>Hôm kia</th><th>TB 7 ngày</th></tr>
  ${row('Lượt xem trang', 'views')}${row('Phiên', 'sessions')}${row('Người truy cập (ước tính)', 'visitors')}${row('Phiên thoát ngay', 'bounces')}${row('Phiên khách quay lại', 'returning_sessions')}</table>
  <p><b>Nguồn:</b> ${list(d.sources.day)}</p><p><b>Trang xem nhiều:</b> ${list(d.pages_day.slice(0, 6))}</p>
  <p><b>Chuyển đổi:</b> ${list(d.conversions.day)} · <b>Bản ghi mới:</b> đề xuất tool ${d.new_records_day.tool_requests}, đặt lịch ${d.new_records_day.consult_bookings}, góp ý ${d.new_records_day.feedback}, đăng ký email ${d.new_records_day.email_signups}</p>
  <p style="color:#999;font-size:12px">Dữ liệu đầy đủ (JSON) nằm trong phần văn bản thuần của thư, giữa 2 dòng QTT-JSON-BEGIN / QTT-JSON-END.</p>
  <pre style="font-size:11px;white-space:pre-wrap;background:#fafafa;border:1px solid #eee;padding:8px">===QTT-JSON-BEGIN===\n${esc(JSON.stringify(d))}\n===QTT-JSON-END===</pre></div>`;
}

/* Gửi thư. Không cần bật "gửi email cho người đăng ký" – chỉ cần RESEND_API_KEY + email gửi đi. */
export async function sendAnalyticsDigest(env, opt = {}) {
  const to = (opt.to || env.WA_REPORT_TO || '').trim();
  if (!/@/.test(to)) return { ok: false, error: 'Chưa có email nhận (WA_REPORT_TO trong watch/wrangler.jsonc)' };
  const st = await mailStatus(env);
  if (!st.hasKey) return { ok: false, error: 'Thiếu RESEND_API_KEY' };
  const sender = { ...st, from: /@/.test(st.from) ? st.from : 'capnhat@quantritute.com', fromName: 'Số liệu Quản trị tử tế' };
  const d = await buildDigest(env, opt);
  const subject = `${DIGEST_TAG} Số liệu web ngày ${d.report_day_vn}`;
  const text = `Số liệu web quantritute.com – ngày ${d.report_day_vn}\n\n===QTT-JSON-BEGIN===\n${JSON.stringify(d)}\n===QTT-JSON-END===\n`;
  await sendMail(env, sender, { to, subject, html: html(d), text });
  await env.DB.prepare(`INSERT INTO settings (key, value) VALUES ('_wa_digest_last', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .bind(JSON.stringify({ at: now(), day: d.report_day, to })).run().catch(() => {});
  return { ok: true, day: d.report_day, to, views: d.kpi.day ? d.kpi.day.views : 0 };
}
