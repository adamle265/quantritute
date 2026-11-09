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
 *   GET    /api/admin/tool-announce-preview?id=  Xem trước thư tin công cụ mới (không gửi) · POST /api/admin/tool-announce-now {id}  Gửi ngay
 *   GET    /api/admin/maillog[/:id]        Email đã gửi trong ngày (?day=YYYY-MM-DD) / nội dung 1 email
 *   GET    /api/admin/mailqueue            Email chờ gửi theo lịch 10h sáng (?preview=ban-tin|cong-cu-moi kèm nguyên thư)
 *   POST   /api/admin/legal-scan           Quét văn bản mới trên chinhphu.vn ngay
 *   GET    /api/admin/legal-scans          10 lượt quét gần nhất
 *   GET    /api/admin/stats?days=30        Thống kê lượt truy cập / dùng / tải của từng công cụ theo ngày
 *   POST   /api/admin/legal-ai/:id         AI đọc toàn văn anh dán vào → trả về bản tóm tắt đề xuất (chưa lưu, anh xem rồi bấm Lưu/Duyệt)
 *   GET/POST/PUT/DELETE /api/admin/studio[/video|post|export.csv|calendar.ics]  Xưởng video (xem src/studio-api.js)
 *   GET/POST/PUT/DELETE /api/admin/subs[/item|settings|export.csv]  Dịch vụ & công cụ AI (xem src/subs-api.js)
 *   entity: tools | episodes | posts | requests | bookings | legal (văn bản pháp luật mới)
 * ============================================================ */
import { scan, toIso, aiProvider, summarizeFullText, cronDue } from './legal-watch.js';
import { handleStudio, studioDue } from './studio-api.js';
import { handleSubs, subsDue } from './subs-api.js';
import { report as waReport } from './analytics.js'; // v1.20 Phân tích web
import { sendAnalyticsDigest } from './analytics-digest.js'; // v1.21 thư số liệu hằng ngày
import { mailStatus, mailToday, mailLogDay, mailLogItem, mailQueue, sendMail, sendConfirm, sendDigest, sendToolAnnounce, previewToolAnnounce, previewToolUpdate, sendToolUpdate } from './mailer.js';
import { json, now, int, clean, cleanMultiline, safeEqual, vnDate as vnDay, ensureSchema, getSettings, SETTINGS, ENTITIES, validate, vnTime, vnDate, PUB_DEFAULT_RESULT } from './core.js';

/* v1.29 (02/11/2026): công cụ vừa chuyển sang công khai (Dùng được + Đang hiện), chưa từng hẹn/gửi tin → tự hẹn gửi 10h sáng kế tiếp.
 * Anh muốn gửi luôn thì bấm ⚡ Gửi ngay; không muốn gửi thì bấm hủy hẹn. Chưa bật email thì bỏ qua. */
async function autoQueue(env, id, old) {
  try {
    const cur = await env.DB.prepare(`SELECT status, visible, announce_at, announced_at FROM tools WHERE id = ?1`).bind(id).first();
    if (!cur || cur.status !== 'ok' || !cur.visible || cur.announce_at > 0 || cur.announced_at > 0) return false;
    if (old && old.status === 'ok' && old.visible) return false;
    if (!(await mailStatus(env)).ready) return false;
    await env.DB.prepare(`UPDATE tools SET announce_at = ?1, announced_at = 0 WHERE id = ?2 AND announce_at = 0 AND announced_at = 0`).bind(now(), id).run();
    return true;
  } catch (e) { console.error('autoQueue', e); return false; }
}

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
  feedback: { tool_slug: 'Công cụ', name: 'Họ tên', phone: 'SĐT', email: 'Email', notify: 'Nhận tin cập nhật', content: 'Nội dung góp ý', page: 'Trang', status: 'Trạng thái', admin_note: 'Ghi chú', pub_show: 'Hiện ở Góc cảm ơn', pub_name: 'Tên hiển thị', pub_title: 'Đề xuất (công khai)', pub_result: 'Kết quả xử lý (công khai)', pub_status: 'Trạng thái Góc cảm ơn' },
  subscribers: { tool_slug: 'Công cụ', email: 'Email', status: 'Trạng thái', admin_note: 'Ghi chú' },
  linkreqs: { tool_slug: 'Công cụ', email: 'Email', status: 'Trạng thái', subscribe: 'Muốn nhận tin', admin_note: 'Ghi chú' },
  bookings: { name: 'Tên', contact: 'Liên hệ', topic: 'Chủ đề', description: 'Tình huống', status: 'Trạng thái', scheduled_at: 'Lịch hẹn', admin_note: 'Ghi chú' },
};


/* ============================================================
 * 01/11/2026 – Đốm tự phân tích ý kiến người dùng (đề xuất Bảng ghim, góp ý trong công cụ)
 * Điền sẵn: tên đề xuất + mô tả (Bảng ghim), đề xuất cho công cụ nào, tên hiển thị ẩn danh, trích nguyên văn (đã bỏ SĐT, email),
 * gợi ý xử lý (ghi chú nội bộ). Chỉ điền ô đang trống (force = ghi đè các ô này); KHÔNG tự bật hiện Bảng ghim / Góc cảm ơn – anh chọn.
 * AI: Claude (ANTHROPIC_API_KEY) hoặc Workers AI (binding AI); không có AI thì điền theo quy tắc đơn giản.
 * ============================================================ */
const UA_SYS = 'Bạn là Đốm, trợ lý của trang Quản trị tử tế – kho công cụ miễn phí cho kế toán, nhân sự, chủ doanh nghiệp nhỏ. Bạn đọc ý kiến người dùng gửi và điền thông tin giúp anh Tuấn xử lý. Chỉ trả về 1 đối tượng JSON hợp lệ, tiếng Việt có dấu. Không bịa thông tin không có trong ý kiến.';
const stripPrivate = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}/g, '[số điện thoại]').trim();
async function uaCall(env, prompt) {
  if (env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: AbortSignal.timeout(40000),
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-4-5', max_tokens: 700, system: UA_SYS, messages: [{ role: 'user', content: prompt }] }) });
    const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error('Claude API ' + r.status);
    return (d.content || []).map(c => c.text || '').join('');
  }
  if (env.AI) {
    const d = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [{ role: 'system', content: UA_SYS }, { role: 'user', content: prompt }], max_tokens: 700 });
    return typeof d?.response === 'string' ? d.response : JSON.stringify(d?.response ?? '');
  }
  return '';
}
async function analyzeUser(env, a, id, force) {
  const row = await env.DB.prepare(`SELECT * FROM ${a === 'requests' ? 'requests' : 'feedback'} WHERE id = ?1`).bind(id).first();
  if (!row) throw new Error('Không tìm thấy.');
  const tools = (await env.DB.prepare(`SELECT slug, name, pain, url FROM tools WHERE visible = 1 AND status = 'ok' ORDER BY sort, id`).all()).results;
  const text = a === 'requests' ? row.pain : String(row.content || '').replace(/^\[[^\]]+\]\s*(·[^\n]*)?\n?/, '').trim();
  const kindHint = a === 'requests' ? (row.tool_ref ? 'Đề xuất thêm tính năng cho công cụ: ' + row.tool_ref : 'Đề xuất từ nút "Kể Đốm nghe" (có thể là công cụ mới hoặc tính năng cho công cụ đang có)') : 'Góp ý gửi từ bên trong công cụ: ' + row.tool_slug + (row.content.match(/^\[([^\]]+)\]/) ? ' – người dùng chọn loại "' + row.content.match(/^\[([^\]]+)\]/)[1] + '"' : '');
  const prompt = `CÁC CÔNG CỤ ĐANG CÓ (slug: tên – việc giải quyết):\n${tools.map(t => `- ${t.slug}: ${t.name} – ${t.pain}`).join('\n')}\n\nÝ KIẾN NGƯỜI DÙNG:\n- Nguồn: ${kindHint}\n- Vị trí / người gửi tự ghi: ${a === 'requests' ? row.role || '(không ghi)' : '(có ghi tên, không dùng tên thật)'}\n- Nội dung: """${stripPrivate(text).slice(0, 1800)}"""\n\nTrả về JSON:\n{"loai": "cong_cu_moi" | "tinh_nang" | "gop_y" | "bao_loi", "cong_cu": "slug công cụ liên quan trong danh sách trên, hoặc rỗng nếu là công cụ mới", "tieu_de": "≤ 70 ký tự, bắt đầu bằng động từ, nói rõ người dùng cần gì", "mo_ta": "1–2 câu ≤ 220 ký tự, Đốm kể lại nhu cầu cho người xem Bảng ghim", "ten_hien_thi": "cách gọi ẩn danh theo vị trí / ngành nghề nhắc trong ý kiến, VD 'Một bạn kế toán bán lẻ'; không dùng tên thật", "trich_dan": "nguyên văn ý kiến, giữ nguyên lời, chỉ bỏ tên người, tên công ty, số điện thoại, email", "goi_y_xu_ly": "1–2 câu cho anh Tuấn: công cụ đang có đã đáp ứng được chưa (nói rõ công cụ nào), nếu chưa thì cần làm gì"}`;
  let o = null, src = 'quy tắc';
  try { const t = await uaCall(env, prompt); const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i >= 0 && j > i) { o = JSON.parse(t.slice(i, j + 1)); src = env.ANTHROPIC_API_KEY ? 'Claude' : 'AI'; } } catch (e) { o = null; }
  const str = (v, n) => { const t = String(v ?? '').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; const c = t.slice(0, n), k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[\s,;:\-–(\[]+$/, '') + '…'; };
  const role = a === 'requests' ? str(row.role, 60) : '';
  const res = {
    loai: ['cong_cu_moi', 'tinh_nang', 'gop_y', 'bao_loi'].includes(o?.loai) ? o.loai : (a === 'requests' ? (row.tool_ref ? 'tinh_nang' : 'cong_cu_moi') : (/lỗi/i.test(row.content) ? 'bao_loi' : 'gop_y')),
    cong_cu: tools.some(t => t.slug === o?.cong_cu) ? o.cong_cu : '',
    tieu_de: str(o?.tieu_de, 90) || str(stripPrivate(text).split(/[.!?\n]/)[0], 70),
    mo_ta: str(o?.mo_ta, 260) || str(stripPrivate(text), 220),
    ten: str(o?.ten_hien_thi, 60) || (role ? 'Một bạn ' + role.toLowerCase() : 'Người dùng ẩn danh'),
    trich: stripPrivate(String(o?.trich_dan || text).trim()).slice(0, 1500),
    goi_y: str(o?.goi_y_xu_ly, 400),
  };
  const LOAI = { cong_cu_moi: 'Đề xuất công cụ mới', tinh_nang: 'Đề xuất tính năng', gop_y: 'Góp ý', bao_loi: 'Báo lỗi' };
  const set = {}, put = (k, v) => { if (v && (force || !String(row[k] || '').trim())) set[k] = v; };
  if (a === 'requests') { put('board_title', res.tieu_de); put('board_desc', res.mo_ta); if (res.cong_cu && !row.tool_ref) set.tool_ref = res.cong_cu; }
  put('pub_name', res.ten); put('pub_title', res.tieu_de); put('pub_quote', res.trich);
  const note = `🤖 Đốm (${src}): ${LOAI[res.loai]}${res.cong_cu ? ' · ' + res.cong_cu : ''}${res.goi_y ? ' – ' + res.goi_y : ''}`;
  if (force || !String(row.admin_note || '').trim()) set.admin_note = force && String(row.admin_note || '').trim() && !/^🤖 Đốm/.test(row.admin_note) ? row.admin_note + '\n' + note : note;
  set.ai_at = now();
  const ks = Object.keys(set);
  await env.DB.prepare(`UPDATE ${a === 'requests' ? 'requests' : 'feedback'} SET ${ks.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${ks.length + 1}`).bind(...ks.map(k => set[k]), id).run();
  return { ok: true, src, loai: LOAI[res.loai], filled: ks.filter(k => k !== 'ai_at'), title: res.tieu_de };
}

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
    /* 31/10 tối: Hộp thư người dùng – gom MỌI thứ người dùng gửi (đề xuất công cụ mới / tính năng ở Bảng ghim, góp ý – báo lỗi trong công cụ, hẹn trò chuyện)
       về 1 danh sách có cột Phân loại + trạng thái chung (new · doing · done · skip). Sửa từng mục vẫn ở trang gốc (requests / feedback / bookings) */
    /* 01/11: Đốm phân tích 1 ý kiến – POST /api/admin/analyze/requests-12 (hoặc feedback-3), ?force=1 ghi đè */
    if (a === 'analyze' && M === 'POST' && b) {
      const [ent, idS] = b.split('-'); if (!['requests', 'feedback'].includes(ent) || !+idS) return json({ error: 'Sai mục.' }, 400);
      try { return json(await analyzeUser(env, ent, +idS, url.searchParams.get('force') === '1')); } catch (e) { return json({ error: e.message }, 500); }
    }
    if (a === 'inbox' && M === 'GET') {
      /* 01/11: SELECT * – thiếu cột nào cũng không làm mất cả bảng; lỗi được báo lên màn hình thay vì im lặng */
      const errors = [], q = sql => env.DB.prepare(sql).all().then(r => r.results).catch(e => { errors.push(String(e.message || e)); return []; });
      const [rq, fb, bk, tl] = await Promise.all([
        q(`SELECT * FROM requests ORDER BY created_at DESC LIMIT 1000`),
        q(`SELECT * FROM feedback ORDER BY created_at DESC LIMIT 1000`),
        q(`SELECT id, created_at, name, contact, topic, description, status, scheduled_at FROM bookings ORDER BY created_at DESC LIMIT 1000`),
        q(`SELECT slug, name, url FROM tools`),
      ]);
      const toolName = sl => { if (!sl) return ''; const t = tl.find(x => x.slug === sl) || tl.find(x => String(x.url || '').includes('/tools/' + sl + '/')); return t ? t.name : sl; };
      const RQ = { new: 'new', reviewing: 'doing', planned: 'doing', building: 'doing', done: 'done', rejected: 'skip' };
      const FB = { new: 'new', read: 'doing', doing: 'doing', done: 'done' };
      const BK = { new: 'new', contacted: 'doing', scheduled: 'doing', done: 'done', cancelled: 'skip' };
      const fbKind = c => { const m = String(c || '').match(/^\[([^\]]+)\]/); const k = m ? m[1].trim() : ''; return /lỗi/i.test(k) ? 'Báo lỗi' : /tính năng/i.test(k) ? 'Đề xuất tính năng' : 'Góp ý / đánh giá'; };
      const items = [
        ...rq.map(r => ({ ent: 'requests', id: r.id, at: r.created_at, kind: r.tool_ref ? 'Đề xuất tính năng' : 'Đề xuất công cụ mới', src: 'Bảng ghim', tool: toolName(r.tool_ref), who: r.role || '', contact: r.contact || '', text: r.pain || '', st: r.status, ust: RQ[r.status] || 'new', pub: r.pub_show ? 1 : 0, votes: r.votes || 0, board: r.on_board ? 1 : 0, title: r.board_title || r.pub_title || '', ai: r.ai_at ? 1 : 0 })),
        ...fb.map(r => ({ ent: 'feedback', id: r.id, at: r.created_at, kind: fbKind(r.content), src: 'Trong công cụ', tool: toolName(r.tool_slug), who: r.name || '', contact: [r.phone, r.email].filter(Boolean).join(' · '), text: String(r.content || '').replace(/^\[[^\]]+\]\s*(·\s*)?/, ''), st: r.status, ust: FB[r.status] || 'new', pub: r.pub_show ? 1 : 0, title: r.pub_title || '', ai: r.ai_at ? 1 : 0 })),
        ...bk.map(r => ({ ent: 'bookings', id: r.id, at: r.created_at, kind: 'Hẹn trò chuyện', src: 'Tách cà phê', tool: '', who: r.name || '', contact: r.contact || '', text: [r.topic, r.description].filter(Boolean).join(' – '), st: r.status, ust: BK[r.status] || 'new', when: r.scheduled_at || '' })),
      ].sort((x, y) => y.at - x.at);
      return json({ items, errors });
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
      const refl = await q(`SELECT kind || '_' || status AS status, COUNT(*) AS n FROM reflections GROUP BY kind, status`).catch(() => []);
      const toolVis = await q(`SELECT CASE WHEN visible = 1 THEN 'shown' ELSE 'hidden' END AS status, COUNT(*) AS n FROM tools GROUP BY visible`).catch(() => []);
      const since = now() - 29 * 86400000;
      const daily = await q(`SELECT strftime('%Y-%m-%d', (created_at/1000) + 7*3600, 'unixepoch') AS day, COUNT(*) AS n FROM requests WHERE created_at >= ${since} GROUP BY day ORDER BY day`);
      /* 31/10: Tổng quan mới – danh sách việc cần xử lý (đề xuất, góp ý mới · lời hẹn đang mở · văn bản chờ duyệt) */
      const [newReq, newFb, openBook, pendLegal] = await Promise.all([
        q(`SELECT id, pain, role, tool_ref, created_at FROM requests WHERE status = 'new' ORDER BY created_at DESC LIMIT 12`).catch(() => []),
        q(`SELECT id, tool_slug, name, content, created_at FROM feedback WHERE status = 'new' ORDER BY created_at DESC LIMIT 12`).catch(() => []),
        q(`SELECT id, name, topic, contact, status, scheduled_at, created_at FROM bookings WHERE status IN ('new', 'contacted', 'scheduled') ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, created_at DESC LIMIT 12`).catch(() => []),
        q(`SELECT id, so_hieu, loai, trich_yeu, title, ngay_ban_hanh, level, recommend FROM legal_docs WHERE status = 'pending' ORDER BY CASE recommend WHEN 'approve' THEN 0 ELSE 1 END, ngay_bh_iso DESC, id DESC LIMIT 12`).catch(() => []),
      ]);
      const s = await getSettings(env);
      const by = rows => Object.fromEntries(rows.map(r => [r.status, r.n]));
      return json({
        tools: by(tools), requests: by(reqs), bookings: by(books), episodes: by(eps), posts: by(posts),
        studio: { due: await studioDue(env) },
        subs: { due: await subsDue(env) },
        newReq, newFb, openBook, pendLegal, mailToday: await mailToday(env),
        recentRequests: recentReq, recentBookings: recentBook, dailyRequests: daily, reflections: by(refl), toolVis: by(toolVis), legal: by(legal), lastScan: lastScan[0] || null,
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

    /* v1.16 Xưởng video: quy trình sản xuất, lịch đăng, bài đăng theo kênh, chỉ số */
    if (a === 'studio') return handleStudio({ env, parts, M, body, url });

    /* v1.17 Dịch vụ & công cụ AI: gói trả phí, ngày gia hạn, chi phí */
    if (a === 'subs') return handleSubs({ env, parts, M, body });

    /* v1.20 Phân tích web: lưu lượng, nguồn, hành vi, phễu, tốc độ (src/analytics.js) */
    if (a === 'analytics' && M === 'GET') return waReport(env, url);
    /* v1.21 Gửi thử thư số liệu web (bình thường Worker tự gửi 07:30). Email nhận: body.to hoặc WA_REPORT_TO */
    if (a === 'analytics-digest' && M === 'POST') {
      const r = await sendAnalyticsDigest({ ...env, WA_REPORT_TO: env.WA_REPORT_TO || 'minhtuan.hadu@gmail.com' }, { to: body && body.to, day: body && body.day }).catch(e => ({ ok: false, error: e.message }));
      return json(r, r.ok ? 200 : 502);
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
        subscribers: await q(`SELECT status, COUNT(*) AS n FROM subscribers WHERE tool_slug = 'cam-nang-thue-2026' GROUP BY status`), toolsubs: await q(`SELECT status, COUNT(*) AS n FROM subscribers WHERE tool_slug = 'bo-cong-cu' GROUP BY status`), feedback: await q(`SELECT status, COUNT(*) AS n FROM feedback GROUP BY status`),
        legal: await q(`SELECT status, COUNT(*) AS n FROM legal_docs GROUP BY status`) });
    }
    /* 02/11/2026: nhật ký email gửi đi – GET /api/admin/maillog?day=YYYY-MM-DD (mặc định hôm nay) · GET /api/admin/maillog/:id (kèm nội dung đầy đủ) */
    if (a === 'maillog' && M === 'GET') {
      if (b) { const r = await mailLogItem(env, int(b)); return r ? json(r) : json({ error: 'Không tìm thấy email này.' }, 404); }
      return json(await mailLogDay(env, url.searchParams.get('day') || ''));
    }
    /* 04/11/2026: email chờ gửi theo lịch (lượt 10h sáng) – chỉ đọc, không gửi */
    if (a === 'mailqueue' && M === 'GET') return json(await mailQueue(env, { preview: String(url.searchParams.get('preview') || '') }));
    if (a === 'mail-test' && M === 'POST') {
      const st = await mailStatus(env); const to = clean(body.to, 160);
      if (!st.hasKey) return json({ error: 'Chưa cài khóa RESEND_API_KEY (xem hướng dẫn).' }, 422);
      if (!/@/.test(st.from)) return json({ error: 'Chưa nhập "Email gửi đi".' }, 422);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)) return json({ error: 'Email nhận thử chưa đúng.' }, 422);
      try { await sendMail(env, st, { kind: 'gui-thu', to, subject: 'Thử gửi email – Quản trị tử tế', html: '<p>Kênh gửi email đã hoạt động.</p>', text: 'Kênh gửi email đã hoạt động.' }); return json({ ok: true }); }
      catch (e) { return json({ error: e.message }, 502); }
    }
    if (a === 'mail-confirm-pending' && M === 'POST') {
      const st = await mailStatus(env); if (!st.ready) return json({ error: 'Chưa bật gửi email hoặc thiếu khóa / email gửi đi.' }, 422);
      const { results } = await env.DB.prepare(`SELECT email, token, tool_slug FROM subscribers WHERE status = 'pending' AND token <> '' LIMIT 90`).all();
      let sent = 0; const errs = [];
      for (const s of results) { try { await sendConfirm(env, st, s); sent++; } catch (e) { errs.push(e.message); if (errs.length > 3) break; } }
      return json({ ok: !errs.length, sent, errors: errs });
    }
    if (a === 'mail-digest' && M === 'POST') {
      const law = await sendDigest(env), tl = await sendToolAnnounce(env).catch(e => ({ ok: false, errors: [String(e.message || e)] }));
      return json({ ...law, tools_sent: tl.sent || 0, tools_skipped: tl.skipped || '', tools_errors: tl.errors || [], ok: law.ok && tl.ok });
    }
    /* Anh bấm "Thông báo" (on = true) → công cụ được gửi tới người đăng ký vào 10h sáng kế tiếp; bấm lại khi chưa gửi (on = false) → hủy hẹn */
    if (a === 'tool-announce' && M === 'POST') {
      const id2 = int(body.id, 0); const t = id2 ? await env.DB.prepare(`SELECT id, status, visible, announce_at, announced_at FROM tools WHERE id = ?1`).bind(id2).first() : null;
      if (!t) return json({ error: 'Không tìm thấy công cụ.' }, 404);
      if (body.on) {
        if (t.status !== 'ok') return json({ error: 'Chỉ thông báo được khi công cụ ở trạng thái "Dùng được".' }, 422);
        if (!t.visible) return json({ error: 'Công cụ đang ẩn trên web. Hãy bật hiển thị trước khi thông báo.' }, 422);
        const st = await mailStatus(env); if (!st.ready) return json({ error: 'Chưa bật gửi email (xem Cẩm nang thuế → Cài đặt công cụ).' }, 422);
        await env.DB.prepare(`UPDATE tools SET announce_at = ?1, announced_at = 0 WHERE id = ?2`).bind(now(), id2).run();
      } else if (!t.announced_at) await env.DB.prepare(`UPDATE tools SET announce_at = 0 WHERE id = ?1`).bind(id2).run();
      return json({ ok: true });
    }
    /* v1.29 (02/11/2026) Xem trước thư tin công cụ mới – không gửi gì */
    if (a === 'tool-announce-preview' && M === 'GET') {
      const r = await previewToolAnnounce(env, int(url.searchParams.get('id'), 0));
      return r ? json(r) : json({ error: 'Không tìm thấy công cụ.' }, 404);
    }
    /* v1.29 Gửi ngay tin công cụ mới tới mọi người đã xác nhận (không chờ 10h sáng) */
    if (a === 'tool-announce-now' && M === 'POST') {
      const id2 = int(body.id, 0); const t = id2 ? await env.DB.prepare(`SELECT id, status, visible FROM tools WHERE id = ?1`).bind(id2).first() : null;
      if (!t) return json({ error: 'Không tìm thấy công cụ.' }, 404);
      if (t.status !== 'ok') return json({ error: 'Chỉ gửi được khi công cụ ở trạng thái "Dùng được".' }, 422);
      if (!t.visible) return json({ error: 'Công cụ đang ẩn trên web. Hãy bật hiển thị trước khi gửi.' }, 422);
      const st = await mailStatus(env); if (!st.ready) return json({ error: 'Chưa bật gửi email (xem Hệ thống → Email gửi đi).' }, 422);
      const r = await sendToolAnnounce(env, { ids: [id2] });
      return json(r, r.ok ? 200 : 502);
    }

    /* 03/11/2026 🔔 Báo cập nhật công cụ: xem trước (note = lời nhắn thêm) · gửi ngay tới người đăng ký + người góp ý có để lại email */
    if (a === 'tool-update-preview' && M === 'GET') {
      const r = await previewToolUpdate(env, int(url.searchParams.get('id'), 0), String(url.searchParams.get('note') || '').slice(0, 1500));
      return r ? json(r) : json({ error: 'Không tìm thấy công cụ.' }, 404);
    }
    if (a === 'tool-update-now' && M === 'POST') {
      const id2 = int(body.id, 0); const t = id2 ? await env.DB.prepare(`SELECT id, status, visible FROM tools WHERE id = ?1`).bind(id2).first() : null;
      if (!t) return json({ error: 'Không tìm thấy công cụ.' }, 404);
      if (t.status !== 'ok' || !t.visible) return json({ error: 'Chỉ báo cập nhật khi công cụ ở trạng thái "Dùng được" và đang hiện trên web.' }, 422);
      const r = await sendToolUpdate(env, { id: id2, note: String(body.note || '').slice(0, 1500) });
      return json(r, r.ok ? 200 : (r.error ? 422 : 502));
    }
    if (a === 'legal-scans' && M === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM legal_scans ORDER BY id DESC LIMIT 10`).all();
      return json({ scans: results, ai: aiProvider(env), schedule: await cronDue(env) });
    }

    /* v1.15 kéo thả đổi vị trí: nhận danh sách id theo thứ tự mới → sort = 10, 20, 30… */
    if (a === 'reorder' && b && M === 'POST') {
      const ent = ENTITIES[b];
      if (!ent || !ent.fields.sort) return json({ error: 'Mục này không sắp xếp được.' }, 400);
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(x => int(x, 0)).filter(Boolean).slice(0, 500);
      if (!ids.length) return json({ error: 'Thiếu danh sách.' }, 422);
      await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${ent.table} SET sort = ?1, updated_at = ?2 WHERE id = ?3`).bind((i + 1) * 10, now(), id)));
      return json({ ok: true });
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
      // v1.15 lọc thêm theo loại (Tủ sách / Phòng chiếu), nhóm công cụ, hiển thị
      for (const f of ['kind', 'grp']) { const v = clean(url.searchParams.get(f), 30); if (v && ent.fields[f]?.values?.includes(v)) { binds.push(v); w.push(`${f} = ?${binds.length}`); } }
      const tl = clean(url.searchParams.get('tool'), 60); if (tl && ent.fields.tool_slug) { binds.push(tl); w.push(`tool_slug = ?${binds.length}`); } // Đăng ký email: lọc theo danh sách
      const vis = url.searchParams.get('visible'); if ((vis === '0' || vis === '1') && ent.fields.visible) { binds.push(+vis); w.push(`visible = ?${binds.length}`); }
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
        const queued = a === 'tools' ? await autoQueue(env, r.id, null) : false;
        return json({ ok: true, id: r.id, ...(queued ? { queued } : {}) }, 201);
      } catch (e) {
        if (String(e).includes('UNIQUE')) return json({ error: a === 'channels' ? 'Đã có kênh trùng tên này.' : 'Đường dẫn (slug) này đã có, hãy chọn tên khác.' }, 409);
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
      /* Đăng ký nhận email: sửa email gõ sai → chuẩn hóa, kiểm tra định dạng, đổi token (link cũ trong thư hết hiệu lực) */
      if (a === 'subscribers') {
        if ('email' in out) {
          out.email = out.email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(out.email)) return json({ error: 'Email chưa đúng định dạng.' }, 422);
          const cur = await env.DB.prepare(`SELECT email, tool_slug FROM subscribers WHERE id = ?1`).bind(id).first();
          if (cur && cur.email !== out.email) {
            if (await env.DB.prepare(`SELECT 1 AS x FROM subscribers WHERE tool_slug = ?1 AND email = ?2 AND id <> ?3`).bind(cur.tool_slug, out.email, id).first('x')) return json({ error: 'Email này đã có trong danh sách.' }, 409);
            out.token = [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join('');
          }
        }
        if (out.status === 'active') await env.DB.prepare(`UPDATE subscribers SET confirmed_at = ?1 WHERE id = ?2 AND confirmed_at = 0`).bind(now(), id).run();
      }
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
      /* Kênh Phòng chiếu: đổi tên kênh → đổi luôn tên kênh ghi ở các video */
      /* 02/11: Góc cảm ơn – chọn "Chờ phản hồi từ người góp ý" / "Hủy" mà ô Kết quả xử lý để trống → điền câu mặc định */
      if ((a === 'feedback' || a === 'requests') && PUB_DEFAULT_RESULT[out.pub_status]) {
        const curRes = 'pub_result' in out ? out.pub_result : await env.DB.prepare(`SELECT pub_result FROM ${ent.table} WHERE id = ?1`).bind(id).first('pub_result');
        if (!String(curRes || '').trim()) out.pub_result = PUB_DEFAULT_RESULT[out.pub_status];
      }
      const oldTool = a === 'tools' && ('status' in out || 'visible' in out) ? await env.DB.prepare(`SELECT status, visible, announce_at, announced_at FROM tools WHERE id = ?1`).bind(id).first() : null;
      const oldCh = a === 'channels' && out.name ? await env.DB.prepare(`SELECT name FROM video_channels WHERE id = ?1`).bind(id).first('name') : null;
      const keys = Object.keys(out);
      try {
        if (oldCh && oldCh !== out.name && await env.DB.prepare(`SELECT 1 AS x FROM video_channels WHERE name = ?1 AND id <> ?2`).bind(out.name, id).first('x')) return json({ error: 'Đã có kênh trùng tên này.' }, 409);
        if (oldCh && oldCh !== out.name) await env.DB.prepare(`UPDATE reflections SET channel = ?1, updated_at = ?2 WHERE kind = 'video' AND channel = ?3`).bind(out.name, now(), oldCh).run();
        const r = await env.DB.prepare(`UPDATE ${ent.table} SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')} WHERE id = ?${keys.length + 1}`).bind(...keys.map(k => out[k]), id).run();
        if (!r.meta.changes) return json({ error: 'Không tìm thấy.' }, 404);
        const queued = oldTool ? await autoQueue(env, id, oldTool) : false;
        return json({ ok: true, ...(queued ? { queued } : {}) });
      } catch (e) {
        if (String(e).includes('UNIQUE')) return json({ error: 'Đường dẫn (slug) này đã có, hãy chọn tên khác.' }, 409);
        throw e;
      }
    }
    if (id && M === 'DELETE') {
      /* Xoá kênh: video trong kênh KHÔNG bị xoá, chuyển về "Chưa xếp kênh" */
      if (a === 'channels') { const nm = await env.DB.prepare(`SELECT name FROM video_channels WHERE id = ?1`).bind(id).first('name'); if (nm) await env.DB.prepare(`UPDATE reflections SET channel = '', updated_at = ?1 WHERE kind = 'video' AND channel = ?2`).bind(now(), nm).run(); }
      await env.DB.prepare(`DELETE FROM ${ent.table} WHERE id = ?1`).bind(id).run();
      return json({ ok: true });
    }
    return json({ error: 'Không tìm thấy.' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Lỗi hệ thống, vui lòng thử lại.' }, 500);
  }
}
