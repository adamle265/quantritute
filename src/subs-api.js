/* ============================================================
 * Quản trị tử tế — API "Dịch vụ & công cụ AI" (nằm trong API quản trị, cần ADMIN_TOKEN)
 *   GET    /api/admin/subs                 Toàn bộ dịch vụ (kèm ngày gia hạn tiếp theo + giá quy đổi VND đã tự tính) + tỷ giá
 *   POST   /api/admin/subs/item            Thêm
 *   PUT    /api/admin/subs/item/:id        Sửa (gửi trường nào sửa trường đó)
 *   DELETE /api/admin/subs/item/:id        Xoá
 *   PUT    /api/admin/subs/settings        Lưu tỷ giá USD→VND (anh tự nhập)
 *   GET    /api/admin/subs/export.csv      Tải bảng tổng hợp (Excel)
 * Trường hệ thống tự tính (không cho nhập tay): next_renew (từ Ngày kích hoạt + Loại gói), price_vnd (từ Giá gốc + tỷ giá).
 * Không lưu mật khẩu / API key.
 * ============================================================ */
import { json, now, clean, cleanMultiline, vnDate, int } from './core.js';

export const CATEGORIES = ['ai', 'infra', 'content', 'other'];
export const CYCLES = ['unknown', 'free', 'once', 'month', 'year'];
const STATUSES = ['active', 'trial', 'paused', 'canceled'];
const LINES = ['shared', 'main', 'side']; // không còn hiển thị trên giao diện; giữ cột cũ, mặc định "shared"
const CURRENCIES = ['VND', 'USD'];
const text = max => ({ t: 'text', max });

const ITEM = {
  name: { t: 'text', max: 120, req: true }, vendor: text(120), url: text(500), category: { t: 'enum', values: CATEGORIES }, line: { t: 'enum', values: LINES },
  purpose: { t: 'long', max: 600 }, plan: text(120), cycle: { t: 'enum', values: CYCLES }, price: { t: 'money' }, currency: { t: 'enum', values: CURRENCIES },
  started: { t: 'date' }, auto_renew: { t: 'bool' }, status: { t: 'enum', values: STATUSES },
  value: { t: 'stars' }, notes: { t: 'long', max: 3000 },
};

function norm(body, partial) {
  const out = {}, errs = [];
  for (const [k, d] of Object.entries(ITEM)) {
    if (!(k in (body || {}))) { if (!partial && d.req) errs.push('Hãy nhập tên dịch vụ.'); continue; }
    let v = body[k];
    switch (d.t) {
      case 'enum': v = d.values.includes(v) ? v : d.values[0]; break;
      case 'money': v = Math.max(0, Math.round((parseFloat(v) || 0) * 100) / 100); break;
      case 'stars': v = Math.min(5, Math.max(0, int(v, 0))); break;
      case 'bool': v = v === true || v === 1 || v === '1' ? 1 : 0; break;
      case 'date': v = clean(v, 10); if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { errs.push(`"${k}" phải theo dạng YYYY-MM-DD.`); continue; } break;
      case 'long': v = cleanMultiline(v, d.max); break;
      default: v = clean(v, d.max);
    }
    if (d.req && !v) { errs.push('Hãy nhập tên dịch vụ.'); continue; }
    out[k] = v;
  }
  return { out, errs };
}
const logAdd = (log, msg) => {
  let a; try { a = JSON.parse(log || '[]'); } catch { a = []; }
  if (!Array.isArray(a)) a = [];
  a.push({ m: msg, at: now() });
  return JSON.stringify(a.slice(-30));
};
const dmy = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : (s || ''); // ngày xuất ra luôn dạng dd/mm/yyyy
const csvCell = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const NAME = {
  category: { ai: 'Công cụ AI', infra: 'Hạ tầng (tên miền, hosting, email)', content: 'Sản xuất nội dung', other: 'Khác' },
  cycle: { month: 'Hàng tháng', year: 'Hàng năm', once: 'Trọn đời', free: 'Free', unknown: '' },
  status: { active: 'Đang dùng', trial: 'Dùng thử', paused: 'Tạm dừng', canceled: 'Đã hủy' },
};

/* ---------- tự tính (xử lý ngày như chuỗi YYYY-MM-DD, không lệch múi giờ) ---------- */
const dUTC = s => new Date(s + 'T00:00:00Z');
function addMonths(s, n) {
  const d = dUTC(s), day = d.getUTCDate();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(day, last));
  return t.toISOString().slice(0, 10);
}
/** (Free, Trọn đời, chưa chọn loại gói, tạm dừng, đã hủy → không có ngày gia hạn)
 *  Ngày gia hạn tiếp theo = ngày kích hoạt + k chu kỳ, lấy mốc đầu tiên không nhỏ hơn hôm nay.
 *  Chưa tới ngày kích hoạt → chính ngày kích hoạt. Trọn đời / chưa chọn loại gói / tạm dừng / đã hủy → trống. */
export function nextRenew(started, cycle, status, today) {
  if (!started || (cycle !== 'month' && cycle !== 'year') || (status !== 'active' && status !== 'trial')) return '';
  if (started >= today) return started;
  const step = cycle === 'year' ? 12 : 1;
  for (let k = 1; k < 1200; k++) { const d = addMonths(started, k * step); if (d >= today) return d; }
  return '';
}
const toVnd = (price, cur, rate, cycle) => cycle === 'free' || !(price > 0) ? 0 : cur === 'VND' ? Math.round(price) : rate > 0 ? Math.round(price * rate) : null;
const decorate = (r, today, rate) => ({ ...r, next_renew: nextRenew(r.started, r.cycle, r.status, today), price_vnd: toVnd(r.price, r.currency, rate, r.cycle) });
const getRate = async env => parseFloat(await env.DB.prepare(`SELECT value FROM settings WHERE key = 'subs_usd_rate'`).first('value')) || 0;

/** parts = ['api','admin','subs', sub, id] */
export async function handleSubs({ env, parts, M, body }) {
  const sub = parts[3] || '', id = int(parts[4], 0);

  if (!sub && M === 'GET') {
    const [r, rate] = await Promise.all([env.DB.prepare(`SELECT * FROM subs ORDER BY id`).all(), getRate(env)]);
    const today = vnDate(now());
    return json({ items: r.results.map(x => decorate(x, today, rate)), usd_rate: rate, today });
  }

  if (sub === 'item') {
    if (M === 'POST') {
      const { out, errs } = norm(body, false);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      out.log = logAdd('[]', 'Tạo mới'); out.created_at = out.updated_at = now();
      const keys = Object.keys(out);
      const r = await env.DB.prepare(`INSERT INTO subs (${keys.join(',')}) VALUES (${keys.map((_, i) => '?' + (i + 1)).join(',')}) RETURNING id`).bind(...keys.map(k => out[k])).first();
      return json({ ok: true, id: r.id }, 201);
    }
    if (id && M === 'PUT') {
      const { out, errs } = norm(body, true);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      const cur = await env.DB.prepare(`SELECT status, price, currency, plan, cycle, started, log FROM subs WHERE id = ?1`).bind(id).first();
      if (!cur) return json({ error: 'Không tìm thấy dịch vụ.' }, 404);
      const notes = [];
      if (out.status && out.status !== cur.status) notes.push(`Trạng thái → ${NAME.status[out.status]}`);
      if ('price' in out && out.price !== cur.price) notes.push(`Giá gốc → ${out.price} ${out.currency || cur.currency}`);
      if ('currency' in out && out.currency !== cur.currency) notes.push(`Đơn vị tính → ${out.currency}`);
      if ('plan' in out && out.plan !== cur.plan) notes.push(`Gói → ${out.plan || 'bỏ trống'}`);
      if ('cycle' in out && out.cycle !== cur.cycle) notes.push(`Loại gói → ${NAME.cycle[out.cycle] || 'bỏ trống'}`);
      if ('started' in out && out.started !== cur.started) notes.push(`Ngày kích hoạt → ${out.started || 'bỏ trống'}`);
      if (notes.length) out.log = logAdd(cur.log, notes.join('; '));
      out.updated_at = now();
      const keys = Object.keys(out);
      await env.DB.prepare(`UPDATE subs SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${keys.length + 1}`).bind(...keys.map(k => out[k]), id).run();
      return json({ ok: true });
    }
    if (id && M === 'DELETE') {
      await env.DB.prepare(`DELETE FROM subs WHERE id = ?1`).bind(id).run();
      return json({ ok: true });
    }
  }

  if (sub === 'settings' && M === 'PUT') {
    const rate = Math.max(0, parseFloat(body?.usd_rate) || 0);
    await env.DB.prepare(`INSERT INTO settings (key, value) VALUES ('subs_usd_rate', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).bind(String(rate)).run();
    return json({ ok: true, usd_rate: rate });
  }

  if (sub === 'export.csv' && M === 'GET') {
    const [r, rate] = await Promise.all([env.DB.prepare(`SELECT * FROM subs ORDER BY category, name`).all(), getRate(env)]);
    const today = vnDate(now());
    const rows = [['Tên', 'Nhà cung cấp', 'Phân loại', 'Gói đang dùng', 'Loại gói', 'Ngày kích hoạt', 'Giá gốc', 'Đơn vị tính', 'Giá quy đổi (VND)', 'Gia hạn tiếp theo', 'Trạng thái', 'Mục đích', 'Link']];
    for (const x of r.results.map(x => decorate(x, today, rate))) rows.push([x.name, x.vendor, NAME.category[x.category], x.plan, NAME.cycle[x.cycle], dmy(x.started), x.price || '', x.currency, x.price_vnd ?? '', dmy(x.next_renew), NAME.status[x.status], x.purpose, x.url]);
    return new Response('﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="dich-vu-cong-cu-ai-${vnDate(now())}.csv"` } });
  }

  return json({ error: 'Không tìm thấy.' }, 404);
}

/** Số dịch vụ đang dùng / dùng thử có ngày gia hạn tiếp theo trong ≤ 14 ngày (huy hiệu menu) */
export async function subsDue(env) {
  try {
    const today = vnDate(now()), lim = vnDate(now() + 14 * 86400000);
    const { results } = await env.DB.prepare(`SELECT started, cycle, status FROM subs WHERE status IN ('active','trial') AND started <> ''`).all();
    return results.filter(r => { const d = nextRenew(r.started, r.cycle, r.status, today); return d && d <= lim; }).length;
  } catch { return 0; }
}
