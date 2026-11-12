/* ============================================================
 * Quản trị tử tế — Góc giải trí (12/11/2026)
 * Tự tạo bảng riêng, tự bắt lỗi: lỗi ở đây KHÔNG làm sập API chung.
 *   games        1 dòng / trò chơi: bật/tắt, tên, lời giới thiệu trên trang Góc giải trí
 *   game_stories Câu chuyện anh sửa cho từng hình (chỉ lưu hình đã sửa; hình chưa sửa dùng câu chuyện có sẵn trong trò chơi)
 *   game_stats   Số lượt theo ngày (giờ VN): visits = mở trang trò chơi, plays = bắt đầu ghép 1 hình, wins = ghép xong
 *                slug '_goc' = lượt mở trang Góc giải trí
 * API công khai (src/public-api.js gọi publicGames):
 *   GET  /api/games            Trò chơi đang bật (cho trang Góc giải trí)
 *   GET  /api/games/:slug      Bật/tắt + câu chuyện đã sửa (trò chơi đọc khi mở)
 *   POST /api/game-hit         {slug, kind: visit|play|win} – không nhận dữ liệu người dùng; chống đếm trùng bằng mã băm IP trong ngày (hit_seen)
 * API quản trị (src/admin-api.js gọi adminGames):
 *   GET  /api/admin/games                     Danh sách + tổng lượt
 *   GET  /api/admin/games/:slug?days=30       Chi tiết + câu chuyện đã sửa + số liệu theo ngày
 *   PUT  /api/admin/games/:slug               {enabled, name, tagline, intro}
 *   PUT  /api/admin/games/:slug/story/:fig    {fact, story}   · DELETE → dùng lại câu chuyện gốc
 * ============================================================ */
import { json, now, clean, cleanMultiline, sha256, vnDate } from './core.js';

const SEED = {
  slug: 'tangram-viet', name: 'Tangram Việt', sort: 1, url: '/tro-choi/tangram-viet/', cover: '/tro-choi/tangram-viet/anh-chia-se-v05.jpg',
  tagline: 'Ghép 7 mảnh gỗ thành hình quen thuộc của quê hương',
  intro: '23 hình ghép trong 4 bộ sưu tập: Làng quê, Tết & lễ hội, Di sản & biểu tượng, Sông nước & muông thú – chia mức Dễ, Vừa, Khó.\nGhép xong mỗi hình, một câu chuyện nhỏ về hình đó sẽ mở ra.\nChơi ngay trên trình duyệt, không cần tài khoản – thành tích lưu trên máy của anh/chị.',
};
let ready = false;
async function ensure(env) {
  if (ready) return true;
  try {
    await env.DB.batch([
      `CREATE TABLE IF NOT EXISTS games (slug TEXT PRIMARY KEY, name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0,
        tagline TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE IF NOT EXISTS game_stories (game TEXT NOT NULL, fig TEXT NOT NULL, fact TEXT NOT NULL DEFAULT '', story TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (game, fig))`,
      `CREATE TABLE IF NOT EXISTS game_stats (slug TEXT NOT NULL, day TEXT NOT NULL, visits INTEGER NOT NULL DEFAULT 0, plays INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day))`,
      `CREATE TABLE IF NOT EXISTS hit_seen (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`,
    ].map(q => env.DB.prepare(q)));
    await env.DB.prepare(`INSERT OR IGNORE INTO games (slug, name, enabled, sort, tagline, intro, url, cover, updated_at) VALUES (?1, ?2, 1, ?3, ?4, ?5, ?6, ?7, ?8)`)
      .bind(SEED.slug, SEED.name, SEED.sort, SEED.tagline, SEED.intro, SEED.url, SEED.cover, now()).run();
    ready = true;
  } catch (e) { console.error('games schema', e); }
  return ready;
}
const paras = s => String(s || '').split(/\n\s*\n/).map(x => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
const okSlug = s => /^[a-z0-9-]{1,40}$/.test(s);
const ipOf = r => r.headers.get('cf-connecting-ip') || r.headers.get('x-forwarded-for') || '0.0.0.0';
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|zalo.*preview|preview|headless|lighthouse|pingdom|monitor|curl|wget|python-requests/i;
const HIT = { visit: ['visits', 1], play: ['plays', 40], win: ['wins', 40] }; // tối đa mỗi người / ngày / trò chơi
const pubGame = g => ({ slug: g.slug, name: g.name, tagline: g.tagline, intro: g.intro, url: g.url, cover: g.cover });

/* trả Response nếu là đường dẫn của Góc giải trí, null nếu không phải */
export async function publicGames(request, env, a, b) {
  if (a !== 'games' && a !== 'game-hit') return null;
  const M = request.method;
  if (!(await ensure(env))) return a === 'games' && M === 'GET' && !b ? json({ games: [] }) : json({ ok: false }, 503);
  if (a === 'games' && M === 'GET' && !b) {
    const [{ results }, st] = await Promise.all([
      env.DB.prepare(`SELECT * FROM games WHERE enabled = 1 ORDER BY sort, slug`).all(),
      env.DB.prepare(`SELECT slug, SUM(plays) AS plays, SUM(wins) AS wins FROM game_stats GROUP BY slug`).all(),
    ]);
    const by = Object.fromEntries(st.results.map(r => [r.slug, r]));
    return json({ games: results.map(g => ({ ...pubGame(g), plays: (by[g.slug] || {}).plays || 0, wins: (by[g.slug] || {}).wins || 0 })) }, 200, { 'cache-control': 'public, max-age=30' });
  }
  if (a === 'games' && M === 'GET' && b) {
    if (!okSlug(b)) return json({ error: 'Không tìm thấy trò chơi.' }, 404);
    const g = await env.DB.prepare(`SELECT * FROM games WHERE slug = ?1`).bind(b).first();
    if (!g) return json({ error: 'Không tìm thấy trò chơi.' }, 404);
    const { results } = await env.DB.prepare(`SELECT fig, fact, story FROM game_stories WHERE game = ?1`).bind(b).all();
    const stories = Object.fromEntries(results.map(r => [r.fig, { fact: r.fact, story: paras(r.story) }]));
    return json({ game: { ...pubGame(g), enabled: !!g.enabled }, stories }, 200, { 'cache-control': 'public, max-age=30' });
  }
  if (a === 'game-hit' && M === 'POST') {
    let body; try { body = await request.json(); } catch { return json({ ok: false }, 400); }
    const kind = String(body.kind || ''), h = HIT[kind], slug = clean(body.slug, 40).toLowerCase();
    if (!h || BOT_UA.test(request.headers.get('user-agent') || '')) return json({ ok: true });
    if (slug !== '_goc' && !okSlug(slug)) return json({ ok: false }, 400);
    if (slug === '_goc' ? kind !== 'visit' : !(await env.DB.prepare(`SELECT 1 FROM games WHERE slug = ?1 AND enabled = 1`).bind(slug).first())) return json({ ok: false }, 404);
    const day = vnDate(now()), k = (await sha256(['game', ipOf(request), slug, kind].join('|'))).slice(0, 24);
    const r = await env.DB.prepare(`INSERT INTO hit_seen (day, k, n) VALUES (?1, ?2, 1) ON CONFLICT(day, k) DO UPDATE SET n = n + 1 WHERE n < ?3`).bind(day, k, h[1]).run();
    if (r.meta && r.meta.changes > 0)
      await env.DB.prepare(`INSERT INTO game_stats (slug, day, ${h[0]}) VALUES (?1, ?2, 1) ON CONFLICT(slug, day) DO UPDATE SET ${h[0]} = ${h[0]} + 1`).bind(slug, day).run();
    return json({ ok: true });
  }
  return json({ error: 'Không có đường dẫn này.' }, 404);
}

/* parts = ['api','admin','games', slug?, 'story'?, fig?] */
export async function adminGames(env, parts, M, body, url) {
  if (!(await ensure(env))) return json({ error: 'Chưa tạo được bảng Trò chơi, anh thử tải lại trang.' }, 500);
  const [, , , slug, sub, fig] = parts;
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days'), 10) || 30));
  const from = vnDate(now() - (days - 1) * 86400000), today = vnDate(now());
  const totals = (where, ...p) => env.DB.prepare(`SELECT slug, SUM(visits) AS visits, SUM(plays) AS plays, SUM(wins) AS wins, MIN(day) AS first_day,
      SUM(CASE WHEN day = ?1 THEN visits ELSE 0 END) AS today_visits, SUM(CASE WHEN day = ?1 THEN plays ELSE 0 END) AS today_plays, SUM(CASE WHEN day = ?1 THEN wins ELSE 0 END) AS today_wins,
      SUM(CASE WHEN day >= ?2 THEN visits ELSE 0 END) AS range_visits, SUM(CASE WHEN day >= ?2 THEN plays ELSE 0 END) AS range_plays, SUM(CASE WHEN day >= ?2 THEN wins ELSE 0 END) AS range_wins
      FROM game_stats ${where} GROUP BY slug`).bind(today, from, ...p).all().then(r => r.results);
  if (!slug && M === 'GET') {
    const [{ results }, tot, n] = await Promise.all([env.DB.prepare(`SELECT * FROM games ORDER BY sort, slug`).all(), totals(''),
      env.DB.prepare(`SELECT game, COUNT(*) AS n FROM game_stories GROUP BY game`).all()]);
    const ns = Object.fromEntries(n.results.map(r => [r.game, r.n]));
    return json({ days, from, today, games: results.map(g => ({ ...g, edited: ns[g.slug] || 0 })), totals: tot });
  }
  if (!okSlug(slug || '')) return json({ error: 'Không tìm thấy trò chơi.' }, 404);
  const g = await env.DB.prepare(`SELECT * FROM games WHERE slug = ?1`).bind(slug).first();
  if (!g) return json({ error: 'Không tìm thấy trò chơi.' }, 404);
  if (!sub && M === 'GET') {
    const [st, tot, corner, daily] = await Promise.all([
      env.DB.prepare(`SELECT fig, fact, story, updated_at FROM game_stories WHERE game = ?1`).bind(slug).all(),
      totals('WHERE slug = ?3', slug), totals(`WHERE slug = '_goc'`),
      env.DB.prepare(`SELECT day, visits, plays, wins FROM game_stats WHERE slug = ?1 AND day >= ?2 ORDER BY day`).bind(slug, from).all(),
    ]);
    return json({ days, from, today, game: g, stories: st.results, totals: tot[0] || {}, corner: corner[0] || {}, daily: daily.results });
  }
  if (!sub && M === 'PUT') {
    const set = {};
    if ('enabled' in body) set.enabled = body.enabled ? 1 : 0;
    if ('name' in body) { set.name = clean(body.name, 80); if (!set.name) return json({ error: 'Tên trò chơi không được để trống.' }, 422); }
    if ('tagline' in body) set.tagline = clean(body.tagline, 160);
    if ('intro' in body) set.intro = cleanMultiline(body.intro, 1200).trim();
    const keys = Object.keys(set);
    if (!keys.length) return json({ error: 'Không có gì để lưu.' }, 422);
    await env.DB.prepare(`UPDATE games SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')}, updated_at = ?${keys.length + 1} WHERE slug = ?${keys.length + 2}`)
      .bind(...keys.map(k => set[k]), now(), slug).run();
    return json({ ok: true });
  }
  if (sub === 'story' && fig && /^[a-z0-9-]{1,40}$/.test(fig)) {
    if (M === 'DELETE') { await env.DB.prepare(`DELETE FROM game_stories WHERE game = ?1 AND fig = ?2`).bind(slug, fig).run(); return json({ ok: true }); }
    if (M === 'PUT') {
      const fact = clean(body.fact, 300), story = cleanMultiline(body.story, 4000).trim();
      if (!story) return json({ error: 'Câu chuyện không được để trống (muốn dùng lại bản gốc thì bấm "Dùng lại bản gốc").' }, 422);
      await env.DB.prepare(`INSERT INTO game_stories (game, fig, fact, story, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(game, fig) DO UPDATE SET fact = ?3, story = ?4, updated_at = ?5`).bind(slug, fig, fact, story, now()).run();
      return json({ ok: true });
    }
  }
  return json({ error: 'Không có đường dẫn này.' }, 404);
}
