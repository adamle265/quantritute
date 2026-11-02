// API Sổ tay + ★/ghi chú video. Chỉ chạy sau khi _middleware.js xác nhận đã đăng nhập.
import { ensureTables } from '../../lib/auth.js';

const LOAI = ['Kỷ niệm', 'Nhật ký', 'Bài học', 'Ý tưởng'];
const J = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const bad = msg => J({ error: msg }, 400);
const nowISO = () => new Date().toISOString();
const ID_RE = /^[a-z0-9-]{8,40}$/i;
const MA_RE = /^[A-Za-z]{1,12}-\d{1,4}$/;

function cleanNote(b, id) {
  const loai = LOAI.includes(b.loai) ? b.loai : null;
  if (!loai) return [null, 'Loại không hợp lệ'];
  const ngay = String(b.ngay || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return [null, 'Ngày không hợp lệ'];
  const noi_dung = String(b.noi_dung || '');
  const tieu_de = String(b.tieu_de || '').trim().slice(0, 300);
  if (!noi_dung.trim() && !tieu_de) return [null, 'Bài viết đang trống'];
  if (noi_dung.length > 200000) return [null, 'Bài quá dài (tối đa 200.000 ký tự)'];
  const the = String(b.the || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20).join(', ').slice(0, 500);
  const video_ma = MA_RE.test(String(b.video_ma || '')) ? String(b.video_ma) : '';
  return [{ id, loai, tieu_de, noi_dung, ngay, the, video_ma }, null];
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  await ensureTables(db);
  const seg = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const [a, b, c] = seg; const m = request.method;
  let body = {};
  if (m === 'POST' || m === 'PUT') { try { body = await request.json(); } catch { return bad('Dữ liệu gửi lên không đọc được'); } }

  if (a === 'ping') return J({ ok: true });

  // Toàn bộ dữ liệu khi mở trang
  if (a === 'state' && m === 'GET') {
    const [p, n] = await db.batch([
      db.prepare('SELECT ma, star, note FROM kho_picks'),
      db.prepare('SELECT * FROM kho_notes ORDER BY ngay, created_at'),
    ]);
    return J({ picks: p.results, notes: n.results });
  }

  // ★ và ghi chú cho từng video
  if (a === 'picks' && b && m === 'PUT') {
    if (!MA_RE.test(b)) return bad('Mã video không hợp lệ');
    const star = body.star ? 1 : 0; const note = String(body.note || '').slice(0, 50000);
    if (!star && !note.trim()) await db.prepare('DELETE FROM kho_picks WHERE ma = ?').bind(b).run();
    else await db.prepare(`INSERT INTO kho_picks (ma, star, note, updated_at) VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(ma) DO UPDATE SET star = ?2, note = ?3, updated_at = ?4`).bind(b, star, note, nowISO()).run();
    return J({ ok: true });
  }

  if (a === 'notes') {
    if (!b && m === 'POST') {
      const id = ID_RE.test(String(body.id || '')) ? body.id : crypto.randomUUID();
      const [n, err] = cleanNote(body, id); if (err) return bad(err);
      const t = nowISO();
      await db.prepare(`INSERT INTO kho_notes (id, loai, tieu_de, noi_dung, ngay, the, video_ma, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(n.id, n.loai, n.tieu_de, n.noi_dung, n.ngay, n.the, n.video_ma, t, t).run();
      return J(await db.prepare('SELECT * FROM kho_notes WHERE id = ?').bind(n.id).first(), 201);
    }
    if (!b || !ID_RE.test(b)) return bad('Thiếu mã bài');
    if (!c && m === 'PUT') {
      const [n, err] = cleanNote(body, b); if (err) return bad(err);
      const r = await db.prepare(`UPDATE kho_notes SET loai=?, tieu_de=?, noi_dung=?, ngay=?, the=?, video_ma=?, updated_at=? WHERE id=?`)
        .bind(n.loai, n.tieu_de, n.noi_dung, n.ngay, n.the, n.video_ma, nowISO(), b).run();
      if (!r.meta.changes) return J({ error: 'Không tìm thấy bài' }, 404);
      return J(await db.prepare('SELECT * FROM kho_notes WHERE id = ?').bind(b).first());
    }
    if (!c && m === 'DELETE') {
      // Lần 1: chuyển vào thùng rác. Xóa hẳn chỉ khi bài đã ở thùng rác và có ?han=1
      if (new URL(request.url).searchParams.get('han') === '1') {
        await db.prepare('DELETE FROM kho_notes WHERE id = ? AND deleted_at IS NOT NULL').bind(b).run();
      } else {
        await db.prepare('UPDATE kho_notes SET deleted_at = ? WHERE id = ?').bind(nowISO(), b).run();
      }
      return J({ ok: true });
    }
    if (c === 'khoi-phuc' && m === 'POST') {
      await db.prepare('UPDATE kho_notes SET deleted_at = NULL WHERE id = ?').bind(b).run();
      return J(await db.prepare('SELECT * FROM kho_notes WHERE id = ?').bind(b).first());
    }
  }

  // Khôi phục từ file sao lưu (.json): gộp, không ghi đè bài mới hơn
  if (a === 'nhap' && m === 'POST') {
    let nNotes = 0, nPicks = 0;
    const stmts = [];
    for (const x of (Array.isArray(body.notes) ? body.notes : []).slice(0, 5000)) {
      if (!ID_RE.test(String(x.id || ''))) continue;
      const [n, err] = cleanNote(x, x.id); if (err) continue;
      const cr = String(x.created_at || nowISO()), up = String(x.updated_at || cr);
      stmts.push(db.prepare(`INSERT INTO kho_notes (id, loai, tieu_de, noi_dung, ngay, the, video_ma, created_at, updated_at, deleted_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET loai=?2, tieu_de=?3, noi_dung=?4, ngay=?5, the=?6, video_ma=?7, updated_at=?9, deleted_at=?10
        WHERE excluded.updated_at > kho_notes.updated_at`)
        .bind(n.id, n.loai, n.tieu_de, n.noi_dung, n.ngay, n.the, n.video_ma, cr, up, x.deleted_at || null));
      nNotes++;
    }
    const picks = body.picks && typeof body.picks === 'object' ? body.picks : {};
    for (const [ma, v] of Object.entries(picks).slice(0, 5000)) {
      if (!MA_RE.test(ma)) continue;
      const star = v && v.star ? 1 : 0, note = String((v && v.note) || '').slice(0, 50000);
      if (!star && !note.trim()) continue;
      // Gộp: giữ ★ nếu một bên có; ghi chú server trống thì lấy ghi chú từ file
      stmts.push(db.prepare(`INSERT INTO kho_picks (ma, star, note, updated_at) VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(ma) DO UPDATE SET star = MAX(kho_picks.star, ?2), note = CASE WHEN kho_picks.note = '' THEN ?3 ELSE kho_picks.note END, updated_at = ?4`)
        .bind(ma, star, note, nowISO()));
      nPicks++;
    }
    for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
    return J({ ok: true, notes: nNotes, picks: nPicks });
  }

  return J({ error: 'Không có đường dẫn này' }, 404);
}
