/* ============================================================
 * Quản trị tử tế — API quản trị (chạy ở dự án Pages riêng: quantritute-admin)
 * Mọi yêu cầu cần header: Authorization: Bearer <ADMIN_TOKEN>
 *   GET    /api/admin/ping                 Kiểm tra mật khẩu
 *   GET    /api/admin/dashboard            Số liệu tổng quan
 *   GET    /api/admin/:entity              Danh sách (?q=&status=&page=)
 *   POST   /api/admin/:entity              Thêm mới
 *   GET    /api/admin/:entity/:id          Chi tiết
 *   PUT    /api/admin/:entity/:id          Sửa (gửi trường nào sửa trường đó)
 *   DELETE /api/admin/:entity/:id          Xoá
 *   GET/POST /api/admin/settings           Cài đặt
 *   GET    /api/admin/export/:entity.csv   Tải file mở bằng Excel
 *   POST   /api/admin/legal-scan           Quét văn bản mới trên chinhphu.vn ngay
 *   GET    /api/admin/legal-scans          10 lượt quét gần nhất
 *   GET    /api/admin/stats?days=30        Thống kê lượt truy cập / dùng / tải của từng công cụ theo ngày
 *   POST   /api/admin/legal-ai/:id         AI đọc toàn văn anh dán vào → trả về bản tóm tắt đề xuất (chưa lưu, anh xem rồi bấm Lưu/Duyệt)
 *   entity: tools | episodes | posts | requests | bookings | legal (văn bản pháp luật mới)
 * ============================================================ */
import { scan, toIso, aiProvider, summarizeFullText, cronDue } from './legal-watch.js';
import { mailStatus, sendMail, sendConfirm, sendDigest } from './mailer.js';
import { json, now, int, clean, cleanMultiline, safeEqual, vnDate as vnDay, ensureSchema, getSettings, SETTINGS, ENTITIES, validate, vnTime, vnDate } from './core.js';

function isAdmin(request, env) {
  const h = request.headers.get('authorization') || '';
  return !!env.ADMIN_TOKEN && env.ADMIN_TOKEN.length >= 8 && safeEqual(h, `Bearer ${env.ADMIN_TOKEN}`);
}
function csv(rows) {
  const e = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + rows.map(r => r.map(e).join(',')).join('\r\n');
}
const LABELS = {
  topics: { slug: 'Đường dẫn', name: 'Tên chủ đề', color: 'Màu', description: 'Mô tả', sort: 'Thứ tự', visible: 'Hiển thị' },
  reflections: { kind: 'Loại', slug: 'Đường dẫn', title: 'Tên sách / video', author: 'Tác giả / kênh', color: 'Màu gáy', before_text: 'Trước khi đọc', after_text: 'Sau khi đọc', quotes: 'Trích dẫn', lessons: 'Bài học', youtube_url: 'Link YouTube', summary: 'Mô tả', reflection: 'Điều tôi ngẫm', question: 'Câu hỏi suy ngẫm', script: 'Script (nội bộ)', status: 'Trạng thái', published_at: 'Ngày đăng', sort: 'Thứ tự', visible: 'Hiển thị' },
  tools: { slug: 'Đường dẫn', no: 'Số', name: 'Tên công cụ', grp: 'Nhóm chủ đề', sub: 'Nhóm (cũ)', pain: 'Giải quyết vấn đề', who: 'Đối tượng', status: 'Trạng thái', pricing: 'Free/Có phí', price: 'Giá', price_note: 'Đơn vị giá', featured: 'Nổi bật', icon: 'Icon', tags: 'Tag', highlights: 'Tính năng nổi bật', benefits: 'Công cụ này sẽ giúp bạn', features: 'Tính năng hữu ích', guide: 'Cách sử dụng', version: 'Phiên bản', released: 'Ngày cập nhật', author: 'Tác giả', url: 'Link tool', download_url: 'Link tải về', banner_url: 'Ảnh banner', embed: 'Nhúng', videos: 'Video', body: 'Mô tả', sort: 'Thứ tự', visible: 'Hiển thị' },
  episodes: { no: 'Số tập', title: 'Tên tập', summary: 'Tóm tắt', youtube_url: 'Link YouTube', shorts: 'Shorts', status: 'Trạng thái', publish_date: 'Ngày đăng', sort: 'Thứ tự', visible: 'Hiển thị' },
  posts: { slug: 'Đường dẫn', title: 'Tiêu đề', category: 'Chuyên mục', excerpt: 'Tóm tắt', body: 'Nội dung', cover_url: 'Ảnh bìa', status: 'Trạng thái', published_at: 'Ngày đăng' },
  requests: { pain: 'Việc lặp lại', role: 'Vị trí', contact: 'Liên hệ', status: 'Trạng thái', votes: 'Lượt cùng cần', tool_slug: 'Tool liên quan', admin_note: 'Ghi chú', on_board: 'Trên Bảng ghim', board_title: 'Tên đề xuất (bảng)', board_desc: 'Mô tả (bảng)', board_note: 'Lời Tuấn (bảng)', board_link: 'Link giải pháp khác', eta: 'Ngày dự kiến' },
  legal: { so_hieu: 'Số hiệu', loai: 'Loại', co_quan: 'Cơ quan', ngay_ban_hanh: 'Ngày ban hành', hieu_luc: 'Hiệu lực', trich_yeu: 'Trích yếu', url: 'Link', pdf_url: 'File PDF', title: 'Tiêu đề hiển thị', summary: 'Tóm tắt', key_points: 'Điểm cập nhật chính', full_text: 'Toàn văn', recommend: 'Đề xuất', recommend_note: 'Lý do đề xuất', impact: 'Ảnh hưởng tới cẩm nang', action: 'Việc nên làm', level: 'Mức độ', topics: 'Chủ đề', status: 'Trạng thái', in_handbook: 'Đã cập nhật vào cẩm nang', admin_note: 'Ghi chú' },
  feedback: { tool_slug: 'Công cụ', name: 'Họ tên', phone: 'SĐT', content: 'Nội dung góp ý', page: 'Trang', status: 'Trạng thái', admin_note: 'Ghi chú' },
  subscribers: { tool_slug: 'Công cụ', email: 'Email', status: 'Trạng thái', admin_note: 'Ghi chú' },
  bookings: { name: 'Tên', contact: 'Liên hệ', topic: 'Chủ đề', description: 'Tình huống', status: 'Trạng thái', scheduled_at: 'Lịch hẹn', admin_note: 'Ghi chú' },
};

export async function handle(request, env) {
  const url = new URL(request.url);
  try {
    if (!env.DB) return json({ error: 'Chưa gắn database (DB).' }, 500);
    if (!isAdmin(request, env)) return json({ error: 'Sai mật khẩu quản trị.' }, 401);
    await ensureSchema(env);
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/'); // ['api','admin',...]
    const [, , a, b] = parts;
    const M = request.method;
    const body = (M === 'POST' || M === 'PUT') ? await request.json().catch(() => ({})) : {};

    if (a === 'ping') return json({ ok: true });

    /* v1.9 Blog: tải ảnh lên (dataURL JPEG/PNG/WebP, tối đa ~1MB sau khi trình duyệt đã thu nhỏ) → trả về link /api/media/:id */
    if (a === 'media' && M === 'POST') {
      const m = String(body.data || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!m) return json({ error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.' }, 422);
      if (m[2].length > 1400000) return json({ error: 'Ảnh quá lớn (tối đa khoảng 1MB). Hãy chọn ảnh nhỏ hơn.' }, 413);
      const name = 'up/' + now() + '-' + clean(body.name, 60).replace(/[^a-z0-9.-]/gi, '').toLowerCase();
      const r = await env.DB.prepare(`INSERT INTO media (name, mime, data, bytes, created_at) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id`)
        .bind(name, m[1], m[2], Math.round(m[2].length * 0.75), now()).first();
      return json({ ok: true, id: r.id, url: '/api/media/' + r.id }, 201);
    }

    if (a === 'stats' && M === 'GET') {
      const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days'), 10) || 30));
      const from = vnDate(now() - (days - 1) * 86400000), today = vnDate(now());
      const q = (sql, ...p) => env.DB.prepare(sql).bind(...p).all().then(r => r.results);
      const [tools, daily, totals] = await Promise.all([
        q(`SELECT slug, name, status, released FROM tools ORDER BY sort, id`),
        q(`SELECT slug, day, visits, uses, downloads FROM tool_stats WHERE day >= ?1 ORDER BY day`, from),
        q(`SELECT slug, SUM(visits) AS visits, SUM(uses) AS uses, SUM(downloads) AS downloads, MIN(day) AS first_day,
             SUM(CASE WHEN day = ?1 THEN visits ELSE 0 END) AS today_visits, SUM(CASE WHEN day = ?1 THEN uses ELSE 0 END) AS today_uses,
             SUM(CASE WHEN day >= ?2 THEN visits ELSE 0 END) AS range_visits, SUM(CASE WHEN day >= ?2 THEN uses ELSE 0 END) AS range_uses,
             SUM(CASE WHEN day >= ?2 THEN downloads ELSE 0 END) AS range_downloads FROM tool_stats GROUP BY slug`, today, from),
      ]);
      return json({ days, from, today, tools, daily, totals });
    }
    if (a === 'dashboard') {
      const q = sql => env.DB.prepare(sql).all().then(r => r.results);
      const [tools, reqs, books, eps, posts, recentReq, recentBook, legal, lastScan] = await Promise.all([
        q(`SELECT status, COUNT(*) AS n FROM tools GROUP BY status`),
        q(`SELECT status, COUNT(*) AS n FROM requests GROUP BY status`),
        q(`SELECT status, COUNT(*) AS n FROM bookings GROUP BY status`),
        q(`SELECT status, COUNT(*) AS n FROM episodes GROUP BY status`),
        q(`SELECT status, COUNT(*) AS n FROM posts GROUP BY status`),
        q(`SELECT id, pain, role, status, created_at FROM requests ORDER BY created_at DESC LIMIT 6`),
        q(`SELECT id, name, topic, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 6`),
        q(`SELECT 'fb_' || status AS status, COUNT(*) AS n FROM feedback GROUP BY status
           UNION ALL SELECT status, COUNT(*) AS n FROM legal_docs GROUP BY status
           UNION ALL SELECT 'need_full' AS status, COUNT(*) AS n FROM legal_docs WHERE status = 'pending' AND recommend <> 'reject' AND TRIM(full_text) = '' AND ai NOT LIKE 'BuBu%'`),
        q(`SELECT started_at, finished_at, ok, fetched, new_count, candidates, error FROM legal_scans ORDER BY id DESC LIMIT 1`),
      ]);
      const since = now() - 29 * 86400000;
      const daily = await q(`SELECT strftime('%Y-%m-%d', (created_at/1000) + 7*3600, 'unixepoch') AS day, COUNT(*) AS n FROM requests WHERE created_at >= ${since} GROUP BY day ORDER BY day`);
      const s = await getSettings(env);
      const by = rows => Object.fromEntries(rows.map(r => [r.status, r.n]));
      return json({
        tools: by(tools), requests: by(reqs), bookings: by(books), episodes: by(eps), posts: by(posts),
        recentRequests: recentReq, recentBookings: recentBook, dailyRequests: daily, legal: by(legal), lastScan: lastScan[0] || null,
        checklist: { bank: !!(s.bank_acc && s.bank_code), contact: !!(s.contact_phone || s.contact_zalo || s.contact_email), social: !!(s.social_tiktok || s.social_facebook || s.social_youtube) },
      });
    }

    if (a === 'settings') {
      if (M === 'GET') {
        const s = await getSettings(env);
        return json({ settings: s, meta: SETTINGS });
      }
      if (M === 'POST') {
        const stmts = [];
        for (const [k, v0] of Object.entries(body || {})) {
          const d = SETTINGS[k]; if (!d) continue;
          const v = d.bool ? (v0 === true || v0 === '1' || v0 === 1 ? '1' : '0') : d.long ? cleanMultiline(v0, 4000) : clean(v0, k === 'donate_note' || k === 'notice' ? 600 : 300);
          stmts.push(env.DB.prepare('INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(k, v));
        }
        if (stmts.length) await env.DB.batch(stmts);
        return json({ ok: true });
      }
    }

    if (a === 'legal-scan' && M === 'POST') {
      const log = await scan(env, { trigger: 'manual' });
      return json(log, log.ok ? 200 : (log.error?.startsWith('Đang có') ? 409 : 502));
    }
    if (a === 'legal-ai' && M === 'POST' && b) {
      const row = await env.DB.prepare(`SELECT id, so_hieu, trich_yeu FROM legal_docs WHERE id = ?1`).bind(int(b, 0)).first();
      if (!row) return json({ error: 'Không tìm thấy văn bản.' }, 404);
      const text = String(body.full_text || '').slice(0, 60000);
      if (text.trim().length < 200) return json({ error: 'Anh dán toàn văn văn bản (ít nhất vài đoạn) rồi bấm lại.' }, 422);
      await env.DB.prepare(`UPDATE legal_docs SET full_text = ?1, updated_at = ?2 WHERE id = ?3`).bind(text, now(), row.id).run();
      try { return json({ ok: true, suggestion: await summarizeFullText(env, row, text) }); }
      catch (e) { return json({ error: String(e.message || e) }, 502); }
    }
    // Cài đặt & trạng thái riêng của công cụ Cẩm nang thuế
    if (a === 'tool-status' && M === 'GET') {
      const st = await mailStatus(env);
      const q = sql => env.DB.prepare(sql).all().then(r => Object.fromEntries(r.results.map(x => [x.status, x.n])));
      return json({ mail: { ...st, lastResult: st.lastResult ? JSON.parse(st.lastResult) : null }, schedule: await cronDue(env), ai: aiProvider(env),
        subscribers: await q(`SELECT status, COUNT(*) AS n FROM subscribers GROUP BY status`), feedback: await q(`SELECT status, COUNT(*) AS n FROM feedback GROUP BY status`),
        legal: await q(`SELECT status, COUNT(*) AS n FROM legal_docs GROUP BY status`) });
    }
    if (a === 'mail-test' && M === 'POST') {
      const st = await mailStatus(env); const to = clean(body.to, 160);
      if (!st.hasKey) return json({ error: 'Chưa cài khóa RESEND_API_KEY (xem hướng dẫn).' }, 422);
      if (!/@/.test(st.from)) return json({ error: 'Chưa nhập "Email gửi đi".' }, 422);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)) return json({ error: 'Email nhận thử chưa đúng.' }, 422);
      try { await sendMail(env, st, { to, subject: 'Thử gửi email – Quản trị tử tế', html: '<p>Kênh gửi email đã hoạt động.</p>', text: 'Kênh gửi email đã hoạt động.' }); return json({ ok: true }); }
      catch (e) { return json({ error: e.message }, 502); }
    }
    if (a === 'mail-confirm-pending' && M === 'POST') {
      const st = await mailStatus(env); if (!st.ready) return json({ error: 'Chưa bật gửi email hoặc thiếu khóa / email gửi đi.' }, 422);
      const { results } = await env.DB.prepare(`SELECT email, token FROM subscribers WHERE status = 'pending' AND token <> '' LIMIT 90`).all();
      let sent = 0; const errs = [];
      for (const s of results) { try { await sendConfirm(env, st, s); sent++; } catch (e) { errs.push(e.message); if (errs.length > 3) break; } }
      return json({ ok: !errs.length, sent, errors: errs });
    }
    if (a === 'mail-digest' && M === 'POST') return json(await sendDigest(env));

    if (a === 'legal-scans' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM legal_scans ORDER BY id DESC LIMIT 10`).all();
      return json({ scans: results, ai: aiProvider(env), schedule: await cronDue(env) });
    }

    if (a === 'export') {
      const m = String(b || '').match(/^(\w+)\.csv$/);
      const ent = m && ENTITIES[m[1]];
      if (!ent) return json({ error: 'Không tìm thấy.' }, 404);
      const { results } = await env.DB.prepare(`SELECT * FROM ${ent.table} ORDER BY ${ent.order} LIMIT 20000`).all();
      const keys = Object.keys(ent.fields);
      const rows = [['ID', ...keys.map(k => LABELS[m[1]][k] || k), 'Tạo lúc', 'Sửa lúc']];
      for (const r of results) rows.push([r.id, ...keys.map(k => r[k]), vnTime(r.created_at), vnTime(r.updated_at)]);
      return new Response(csv(rows), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${m[1]}-${vnDate(now())}.csv"` } });
    }

    const ent = ENTITIES[a];
    if (!ent) return json({ error: 'Không tìm thấy.' }, 404);
    const id = b ? int(b, 0) : 0;

    if (!b && M === 'GET') {
      const w = [], binds = [];
      const q = clean(url.searchParams.get('q'), 80).toLowerCase();
      if (q) { binds.push(q); w.push('(' + ent.search.map(f => `instr(LOWER(${f}), ?${binds.length}) > 0`).join(' OR ') + ')'); }
      const st = clean(url.searchParams.get('status'), 30);
      if (st && ent.fields[ent.filter]?.values?.includes(st)) { binds.push(st); w.push(`${ent.filter} = ?${binds.length}`); }
      const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
      const page = Math.max(1, int(url.searchParams.get('page'), 1)), size = 100;
      const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${ent.table} ${where}`).bind(...binds).first('n');
      const { results } = await env.DB.prepare(`SELECT * FROM ${ent.table} ${where} ORDER BY ${ent.order} LIMIT ${size} OFFSET ${(page - 1) * size}`).bind(...binds).all();
      return json({ items: results, total, page, pages: Math.max(1, Math.ceil(total / size)) });
    }
    if (!b && M === 'POST') {
      const { out, errs } = validate(a, body, false);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      const t = now(); out.created_at = t; out.updated_at = t;
      if (a === 'posts') { out.preview_key = [...crypto.getRandomValues(new Uint8Array(12))].map(x => x.toString(16).padStart(2, '0')).join(''); if (out.status === 'published' && !out.published_at) out.published_at = vnDay(t); }
      if (a === 'legal') { out.source = 'manual'; out.docid = 'm' + t; out.ngay_bh_iso = toIso(out.ngay_ban_hanh); out.found_at = t; out.ai = 'manual'; if (out.status === 'approved') out.approved_at = t; }
      const keys = Object.keys(out);
      try {
        const r = await env.DB.prepare(`INSERT INTO ${ent.table} (${keys.join(',')}) VALUES (${keys.map((_, i) => '?' + (i + 1)).join(',')}) RETURNING id`).bind(...keys.map(k => out[k])).first();
        return json({ ok: true, id: r.id }, 201);
      } catch (e) {
        if (String(e).includes('UNIQUE')) return json({ error: 'Đường dẫn (slug) này đã có, hãy chọn tên khác.' }, 409);
        throw e;
      }
    }
    if (id && M === 'GET') {
      const r = await env.DB.prepare(`SELECT * FROM ${ent.table} WHERE id = ?1`).bind(id).first();
      return r ? json({ item: r }) : json({ error: 'Không tìm thấy.' }, 404);
    }
    if (id && M === 'PUT') {
      const { out, errs } = validate(a, body, true);
      if (errs.length) return json({ error: errs.join(' ') }, 422);
      out.updated_at = now();
      if (a === 'legal' && 'ngay_ban_hanh' in out) out.ngay_bh_iso = toIso(out.ngay_ban_hanh);
      /* Blog: duyệt đăng mà chưa có ngày đăng → lấy ngày hôm nay (giờ VN) */
      if (a === 'posts' && out.status === 'published' && !out.published_at) {
        const cur = await env.DB.prepare(`SELECT published_at FROM posts WHERE id = ?1`).bind(id).first('published_at');
        if (!cur) out.published_at = vnDay(now());
      }
      /* Bảng ghim: dời ngày dự kiến muộn hơn → lưu ngày cũ để bảng ghi trung thực "Lùi sang …" */
      if (a === 'requests' && 'eta' in out) {
        const old = (await env.DB.prepare(`SELECT eta FROM requests WHERE id = ?1`).bind(id).first('eta')) || '';
        if (old && out.eta && out.eta > old) out.eta_prev = old;
        else if (out.eta !== old) out.eta_prev = '';
      }
      if (a === 'legal' && out.status === 'approved') await env.DB.prepare(`UPDATE legal_docs SET approved_at = ?1 WHERE id = ?2 AND approved_at = 0`).bind(now(), id).run();
      if (a === 'legal' && out.status && out.status !== 'approved') out.approved_at = 0;
      const keys = Object.keys(out);
      try {
        const r = await env.DB.prepare(`UPDATE ${ent.table} SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${keys.length + 1}`).bind(...keys.map(k => out[k]), id).run();
        return r.meta.changes ? json({ ok: true }) : json({ error: 'Không tìm thấy.' }, 404);
      } catch (e) {
        if (String(e).includes('UNIQUE')) return json({ error: 'Đường dẫn (slug) này đã có, hãy chọn tên khác.' }, 409);
        throw e;
      }
    }
    if (id && M === 'DELETE') {
      await env.DB.prepare(`DELETE FROM ${ent.table} WHERE id = ?1`).bind(id).run();
      return json({ ok: true });
    }
    return json({ error: 'Không tìm thấy.' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Lỗi hệ thống, vui lòng thử lại.' }, 500);
  }
}
