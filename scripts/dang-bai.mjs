/* ============================================================
 * Đẩy 1 bài viết từ thư mục trên máy lên trang quản trị, trạng thái "Chờ duyệt" (KHÔNG tự đăng).
 * Cách dùng (PowerShell mở tại thư mục quantritute):   .\dang-bai.cmd blog\2026-10-07-ten-bai
 * Trong thư mục bài:
 *   bai-viet.md   – phần đầu (giữa 2 dòng ---) là thông tin bài, phía dưới là nội dung
 *   banner.jpg    – ảnh banner 16:9 (hoặc .png/.webp), tối đa ~1MB
 *   chia-se.jpg   – (không bắt buộc) ảnh chia sẻ Facebook/Zalo 1200×630
 * Bài đã "Đã đăng" thì script không ghi đè – sửa trực tiếp trong trang quản trị.
 * ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };
const die = (m, out) => { console.log(c.r('\n✖ ' + m)); if (out) console.log(String(out).slice(-1500)); process.exit(1); };
const DB = 'quantritute-db', CONF = ['--config', 'site/wrangler.jsonc'];
const TMP = join(tmpdir(), 'qtt-dang-bai'); mkdirSync(TMP, { recursive: true });

function d1(sql, json = false) {
  const f = join(TMP, (json ? 'q' : 'w') + Date.now() + '.sql'); writeFileSync(f, sql, 'utf8');
  const r = spawnSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', `--file="${f}"`, '--yes', ...(json ? ['--json'] : []), ...CONF], { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  rmSync(f, { force: true });
  const out = (r.stdout || '') + (r.stderr || '');
  if (r.status !== 0) die('Lệnh Cloudflare bị lỗi.', out);
  if (!json) return out;
  const s = r.stdout.indexOf('['); try { return JSON.parse(r.stdout.slice(s)); } catch (e) { die('Không đọc được kết quả từ Cloudflare.', out); }
}
const q = s => "'" + String(s ?? '').replace(/'/g, "''") + "'";
const vnSlug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const chunks = (s, n) => { const a = []; for (let i = 0; i < s.length; i += n) a.push(s.slice(i, i + n)); return a; };

/* ---- 1. đọc thư mục bài ---- */
const dirArg = process.argv[2];
if (!dirArg) die('Thiếu thư mục bài. Ví dụ:  .\\dang-bai.cmd blog\\2026-10-07-ten-bai');
const dir = resolve(dirArg);
const mdFile = join(dir, 'bai-viet.md');
if (!existsSync(mdFile)) die('Không thấy file bai-viet.md trong ' + dir);
const raw = readFileSync(mdFile, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!m) die('bai-viet.md phải bắt đầu bằng phần thông tin nằm giữa 2 dòng ---');
const meta = {};
for (const line of m[1].split('\n')) { const k = line.match(/^([a-z_]+)\s*:\s*(.*)$/); if (k) meta[k[1]] = k[2].trim().replace(/^["'](.*)["']$/, '$1'); }
const body = m[2].trim();
if (!meta.title) die('Thiếu dòng "title:" trong bai-viet.md');
const slug = vnSlug(meta.slug || meta.title);
if (!slug) die('Đường dẫn (slug) không hợp lệ.');
if (!body) die('Bài chưa có nội dung.');

function readImg(base) {
  for (const [ext, mime] of [['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
    const f = join(dir, base + '.' + ext);
    if (existsSync(f)) { const b = readFileSync(f); if (b.length > 1_000_000) die(`Ảnh ${base}.${ext} nặng ${(b.length / 1e6).toFixed(1)}MB – cần dưới 1MB (nhờ em thu nhỏ).`); return { mime, b64: b.toString('base64'), bytes: b.length }; }
  }
  return null;
}
const banner = readImg('banner'), share = readImg('chia-se');
console.log(c.b('\nBài: ') + meta.title + c.y('  (/blog/' + slug + ')'));
console.log('Ảnh banner: ' + (banner ? c.g('có') : c.y('không có')) + ' · Ảnh chia sẻ: ' + (share ? c.g('có') : 'không'));

/* ---- 2. kiểm tra bài đã đăng chưa + nâng cấp database nếu web vừa deploy ---- */
const st = d1(`SELECT value FROM settings WHERE key = 'site_url';`, true);
const base = ((st[0]?.results?.[0]?.value) || 'https://quantritute.pages.dev').replace(/\/+$/, '');
try { await fetch(base + '/api/topics'); } catch (e) { }
const cur = d1(`SELECT status FROM posts WHERE slug = ${q(slug)};`, true)[0]?.results?.[0];
if (cur && cur.status === 'published') die('Bài này đã ĐĂNG trên web – không ghi đè. Muốn sửa, vào Quản trị → Blog · Bài viết.');

/* ---- 3. ghi ảnh (cắt nhỏ vì D1 giới hạn 100KB mỗi câu lệnh) ---- */
const now = Date.now(), sqlParts = [];
function mediaSql(name, img) {
  const prefix = name.replace(/-\d+$/, '-');  /* xoá ảnh cũ của lần đẩy trước (dùng instr vì D1 giới hạn mẫu LIKE 50 byte) */
  const s = [`DELETE FROM media WHERE instr(name, ${q(prefix)}) = 1;`, `INSERT INTO media (name, mime, data, bytes, created_at) VALUES (${q(name)}, ${q(img.mime)}, '', ${img.bytes}, ${now});`];
  for (const ch of chunks(img.b64, 80000)) s.push(`UPDATE media SET data = data || '${ch}' WHERE name = ${q(name)};`);
  return s;
}
if (banner) sqlParts.push(...mediaSql(`blog/${slug}/banner-${now}`, banner));
if (share) sqlParts.push(...mediaSql(`blog/${slug}/chia-se-${now}`, share));
const mediaUrl = (n, img) => img ? `'/api/media/' || (SELECT id FROM media WHERE name = ${q(`blog/${slug}/${n}-${now}`)})` : null;

/* ---- 4. ghi bài: trạng thái Chờ duyệt ---- */
const cols = {
  title: q(meta.title), excerpt: q(meta.excerpt || meta.sapo || ''), topics: q((meta.topics || '').split(',').map(x => vnSlug(x)).filter(Boolean).join(',')),
  cover_alt: q(meta.cover_alt || ''), seo_title: q(meta.seo_title || ''), seo_desc: q(meta.seo_desc || ''), og_title: q(meta.og_title || ''), og_desc: q(meta.og_desc || ''),
};
const cover = mediaUrl('banner', banner) || q(meta.cover_url || ''), og = mediaUrl('chia-se', share) || q(meta.og_image || '');
sqlParts.push(`INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, seo_title, seo_desc, og_title, og_desc, og_image, status, published_at, preview_key, created_at, updated_at)
VALUES (${q(slug)}, ${cols.title}, ${cols.excerpt}, '', ${cover}, ${cols.cover_alt}, ${cols.topics}, ${cols.seo_title}, ${cols.seo_desc}, ${cols.og_title}, ${cols.og_desc}, ${og}, 'review', '', lower(hex(randomblob(12))), ${now}, ${now})
ON CONFLICT(slug) DO UPDATE SET title = excluded.title, excerpt = excluded.excerpt, body = '', cover_url = excluded.cover_url, cover_alt = excluded.cover_alt, topics = excluded.topics,
 seo_title = excluded.seo_title, seo_desc = excluded.seo_desc, og_title = excluded.og_title, og_desc = excluded.og_desc, og_image = excluded.og_image, status = 'review', updated_at = excluded.updated_at
 WHERE posts.status <> 'published';`);
let piece = '';
for (const ch of body.split(/(?<=\n)/)) {
  if (Buffer.byteLength(piece + ch, 'utf8') > 60000) { sqlParts.push(`UPDATE posts SET body = body || ${q(piece)} WHERE slug = ${q(slug)} AND status = 'review';`); piece = ''; }
  piece += ch;
}
if (piece) sqlParts.push(`UPDATE posts SET body = body || ${q(piece)} WHERE slug = ${q(slug)} AND status = 'review';`);
console.log('Đang gửi lên Cloudflare…');
d1(sqlParts.join('\n'));

const key = d1(`SELECT preview_key FROM posts WHERE slug = ${q(slug)};`, true)[0]?.results?.[0]?.preview_key || '';
console.log(c.g('\n✔ Đã đưa bài lên trang quản trị – trạng thái "Chờ duyệt" (chưa hiện trên web).'));
console.log('  Xem trước:  ' + c.b(`${base}/blog/${slug}?xem-truoc=${key}`));
console.log('  Duyệt:      Quản trị → Blog · Bài viết → bấm "✓ Duyệt & đăng"\n');
