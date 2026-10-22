/* ============================================================
 * Quản trị tử tế — API "Xưởng video" v1.18 (gọn lại: lịch đăng + nội dung đăng từng kênh)
 * Nằm trong API quản trị, cần ADMIN_TOKEN như mọi mục khác.
 *   GET    /api/admin/studio              Toàn bộ video + bài đăng theo kênh
 *   POST   /api/admin/studio/video        Thêm video
 *   PUT    /api/admin/studio/video/:id    Sửa video (gửi trường nào sửa trường đó)
 *   DELETE /api/admin/studio/video/:id    Xoá video + bài đăng của video
 *   PUT    /api/admin/studio/post         Thêm/sửa nội dung + trạng thái 1 kênh {video_id, channel, ...}
 * ============================================================ */
import { json, now, int, clean, cleanMultiline, vnDate } from './core.js';

export const CHANNELS = ['tiktok', 'youtube', 'facebook'];
/* Trạng thái từng kênh. 'ready' là giá trị cũ (v1.16) – coi như "Chưa đăng". */
const POST_STATUS = ['todo', 'scheduled', 'posted', 'skip', 'ready'];
/* Bước video: v1.18 chỉ dùng 'edit' (đang sản xuất) và 'saved' (đã hoàn thiện); giữ các giá trị cũ để không lỗi dữ liệu cũ */
const STAGES = ['edit', 'saved', 'idea', 'script', 'shoot', 'voice', 'review', 'scheduled', 'posted'];
const OK_KEYS = ['title', 'caption', 'tags'];

const text = max => ({ t: 'text', max });
const long = max => ({ t: 'long', max });
const VIDEO = {
  code: text(12), title: { t: 'text', max: 200, req: true }, stage: { t: 'enum', values: STAGES },
  plan_date: { t: 'date' }, plan_time: { t: 'time' }, duration: text(12),
  file_path: text(500), thumb_path: text(500), notes: long(4000), pin_comment: long(1000), pin_ok: { t: 'bool' },
};
const POST = {
  status: { t: 'enum', values: POST_STATUS }, url: text(500), title: text(100), caption: long(4000), tags: text(500), note: long(1000),
  ok: { t: 'ok' },
};

/** Chuẩn hoá dữ liệu gửi lên theo bảng định nghĩa. partial: chỉ lấy trường có mặt */
function norm(defs, body, partial) {
  const out = {}, errs = [];
  for (const [k, d] of Object.entries(defs)) {
    if (!(k in (body || {}))) { if (!partial && d.req) errs.push('Hãy nhập tên video.'); continue; }
    let v = body[k];
    switch (d.t) {
      case 'enum': v = d.values.includes(v) ? v : d.values[0]; break;
      case 'bool': v = v ? 1 : 0; break;
      case 'date': v = clean(v, 10); if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { errs.push('Ngày đăng chưa đúng dạng dd/mm/yyyy.'); continue; } break;
      case 'time': v = clean(v, 5); if (v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) { errs.push('Giờ đăng chưa đúng dạng HH:MM.'); continue; } break;
      case 'ok': { const o = {}; if (v && typeof v === 'object') for (const x of OK_KEYS) if (v[x]) o[x] = 1; v = JSON.stringify(o); break; }
      case 'long': v = cleanMultiline(v, d.max); break;
      default: v = clean(v, d.max);
    }
    if (d.req && !v) { errs.push('Hãy nhập tên video.'); continue; }
    out[k] = v;
  }
  return { out, errs };
}
const vnNow = () => new Date(now() + 7 * 3600000).toISOString().slice(0, 16);

async function nextCode(env) {
  const { results } = await env.DB.prepare(`SELECT code FROM video_items`).all();
  let m = 0; for (const r of results) { const n = parseInt(String(r.code).replace(/\D/g, ''), 10); if (n > m) m = n; }
  return 'v' + String(m + 1).padStart(2, '0');
}

/** parts = ['api','admin','studio', sub, id]. Trả về Response */
export async function handleStudio({ env, parts, M, body }) {
  const sub = parts[3] || '', id = int(parts[4], 0);

  if (!sub && M === 'GET') {
    const [v, p] = await Promise.all([
      env.DB.prepare(`SELECT id, code, title, stage, plan_date, plan_time, duration, file_path, thumb_path, notes, pin_comment, pin_ok, updated_at
        FROM video_items ORDER BY CASE WHEN plan_date = '' THEN 1 ELSE 0 END, plan_date, plan_time, id`).all(),
      env.DB.prepare(`SELECT id, video_id, channel, status, url, title, caption, tags, note, ok, updated_at FROM video_posts ORDER BY video_id, id`).all(),
    ]);
    return json({ videos: v.results, posts: p.results, today: vnDate(now()), now_vn: vnNow() });
  }

  if (sub === 'video') {
    if (M === 'POST') {
      const { out, errs } = norm(VIDEO, body, false);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      if (!out.code) out.code = await nextCode(env);
      out.code = out.code.toLowerCase();
      if (!out.stage) out.stage = 'edit';
      if (!('plan_time' in out) || !out.plan_time) out.plan_time = '19:00';
      out.created_at = out.updated_at = now();
      const keys = Object.keys(out);
      try {
        const r = await env.DB.prepare(`INSERT INTO video_items (${keys.join(',')}) VALUES (${keys.map((_, i) => '?' + (i + 1)).join(',')}) RETURNING id`).bind(...keys.map(k => out[k])).first();
        return json({ ok: true, id: r.id }, 201);
      } catch (e) { if (String(e).includes('UNIQUE')) return json({ error: `Mã video "${out.code}" đã có, hãy đặt mã khác.` }, 409); throw e; }
    }
    if (id && M === 'PUT') {
      const { out, errs } = norm(VIDEO, body, true);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      if (!await env.DB.prepare(`SELECT 1 AS x FROM video_items WHERE id = ?1`).bind(id).first('x')) return json({ error: 'Không tìm thấy video.' }, 404);
      if ('code' in out) { out.code = out.code.toLowerCase(); if (!out.code) delete out.code; }
      out.updated_at = now();
      const keys = Object.keys(out);
      try {
        await env.DB.prepare(`UPDATE video_items SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${keys.length + 1}`).bind(...keys.map(k => out[k]), id).run();
        return json({ ok: true });
      } catch (e) { if (String(e).includes('UNIQUE')) return json({ error: 'Mã video này đã có, hãy đặt mã khác.' }, 409); throw e; }
    }
    if (id && M === 'DELETE') {
      await env.DB.batch([env.DB.prepare(`DELETE FROM video_posts WHERE video_id = ?1`).bind(id), env.DB.prepare(`DELETE FROM video_items WHERE id = ?1`).bind(id)]);
      return json({ ok: true });
    }
  }

  if (sub === 'post' && M === 'PUT') {
    const vid = int(body.video_id, 0), ch = String(body.channel || '');
    if (!vid || !CHANNELS.includes(ch)) return json({ error: 'Thiếu video hoặc kênh.' }, 422);
    if (!await env.DB.prepare(`SELECT 1 AS x FROM video_items WHERE id = ?1`).bind(vid).first('x')) return json({ error: 'Không tìm thấy video.' }, 404);
    const { out, errs } = norm(POST, body, true);
    if (errs.length) return json({ error: errs.join(' ') }, 422);
    const t = now();
    if (out.status === 'posted') out.posted_at = vnDate(t);
    const cur = await env.DB.prepare(`SELECT id FROM video_posts WHERE video_id = ?1 AND channel = ?2`).bind(vid, ch).first('id');
    if (cur) {
      out.updated_at = t; const keys = Object.keys(out);
      await env.DB.prepare(`UPDATE video_posts SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${keys.length + 1}`).bind(...keys.map(k => out[k]), cur).run();
    } else {
      const rec = { video_id: vid, channel: ch, ...out, created_at: t, updated_at: t }; const keys = Object.keys(rec);
      await env.DB.prepare(`INSERT INTO video_posts (${keys.join(',')}) VALUES (${keys.map((_, i) => '?' + (i + 1)).join(',')})`).bind(...keys.map(k => rec[k])).run();
    }
    return json({ ok: true });
  }

  return json({ error: 'Không tìm thấy.' }, 404);
}

/** Số video đã tới giờ đăng mà còn kênh chưa xử lý (huy hiệu menu Quản trị) */
export async function studioDue(env) {
  try {
    const t = vnNow(), d = t.slice(0, 10), hm = t.slice(11, 16);
    return (await env.DB.prepare(`SELECT COUNT(*) AS n FROM video_items v WHERE v.plan_date <> ''
        AND (v.plan_date < ?1 OR (v.plan_date = ?1 AND v.plan_time <= ?2))
        AND (SELECT COUNT(*) FROM video_posts p WHERE p.video_id = v.id AND p.status IN ('posted', 'skip')) < 3`).bind(d, hm).first('n')) || 0;
  } catch { return 0; }
}
