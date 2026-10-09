/* ============================================================
 * Quản trị tử tế — phần dùng chung cho máy chủ (Pages Functions + D1)
 * ============================================================ */
import { ensureLegalSchema } from './legal-watch.js';

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

export const now = () => Date.now();
export const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
export const safeJson = (v, d) => { try { return JSON.parse(v); } catch { return d; } };

export function clean(v, max = 200) {
  return String(v ?? '').replace(/[\u0000-\u0008\u000B-\u001f]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, max);
}
export function cleanMultiline(v, max = 5000) {
  return String(v ?? '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').slice(0, max);
}
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0;
}
export async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export const vnTime = ms => {
  if (!ms) return '';
  const x = new Date(ms + 7 * 3600000).toISOString();
  return `${x.slice(8, 10)}/${x.slice(5, 7)}/${x.slice(0, 4)} ${x.slice(11, 16)}`;
};
export const vnDate = ms => new Date(ms + 7 * 3600000).toISOString().slice(0, 10);

/* ---------------- Database ---------------- */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS tools (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, no TEXT NOT NULL DEFAULT '', name TEXT NOT NULL,
    grp TEXT NOT NULL DEFAULT 'kt', sub TEXT NOT NULL DEFAULT '', pain TEXT NOT NULL DEFAULT '', who TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'soon',
    price INTEGER NOT NULL DEFAULT 0, url TEXT NOT NULL DEFAULT '', embed INTEGER NOT NULL DEFAULT 0, videos TEXT NOT NULL DEFAULT '[]', body TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 100, visible INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS episodes (id INTEGER PRIMARY KEY AUTOINCREMENT, no TEXT NOT NULL DEFAULT '', title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
    youtube_url TEXT NOT NULL DEFAULT '', shorts TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', publish_date TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 100, visible INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'quan-tri',
    excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', cover_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY AUTOINCREMENT, pain TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new', votes INTEGER NOT NULL DEFAULT 1, tool_slug TEXT NOT NULL DEFAULT '', admin_note TEXT NOT NULL DEFAULT '',
    ip_hash TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact TEXT NOT NULL, topic TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', scheduled_at TEXT NOT NULL DEFAULT '', admin_note TEXT NOT NULL DEFAULT '',
    ip_hash TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  // v1.9 Blog: nhóm chủ đề + kho ảnh (ảnh lưu base64 trong D1, phục vụ qua /api/media/:id)
  `CREATE TABLE IF NOT EXISTS post_topics (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT 'amber',
    description TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 100, visible INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, mime TEXT NOT NULL DEFAULT 'image/jpeg', data TEXT NOT NULL DEFAULT '',
    bytes INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  // v1.8 Góc ngẫm: sách "đổi cách nghĩ" (kind=book) và video truyền cảm hứng (kind=video). script chỉ dùng nội bộ, không hiện ra web
  `CREATE TABLE IF NOT EXISTS reflections (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL DEFAULT 'book', slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '', before_text TEXT NOT NULL DEFAULT '', after_text TEXT NOT NULL DEFAULT '',
    quotes TEXT NOT NULL DEFAULT '', lessons TEXT NOT NULL DEFAULT '', youtube_url TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '',
    reflection TEXT NOT NULL DEFAULT '', question TEXT NOT NULL DEFAULT '', script TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
    published_at TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 100, visible INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  // v1.7 Bảng ghim: mỗi người (trình duyệt) bấm "Tôi cũng cần" 1 lần cho mỗi đề xuất
  `CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL, voter TEXT NOT NULL, ip_hash TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, PRIMARY KEY (request_id, voter))`,
  // Dữ liệu riêng của từng công cụ (tool_slug): góp ý và đăng ký nhận email
  `CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, tool_slug TEXT NOT NULL DEFAULT '', name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL, page TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, tool_slug TEXT NOT NULL DEFAULT '', email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL DEFAULT '', consent_at INTEGER NOT NULL DEFAULT 0, confirmed_at INTEGER NOT NULL DEFAULT 0, last_sent_at INTEGER NOT NULL DEFAULT 0,
    admin_note TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_tool_email ON subscribers(tool_slug, email)`,
];
/* Cột bổ sung cho bảng tools (bản 1.2). Tự thêm khi database cũ còn thiếu. */
export const TOOL_EXTRA_COLS = {
  pricing: "TEXT NOT NULL DEFAULT 'free'", price_note: "TEXT NOT NULL DEFAULT ''", featured: 'INTEGER NOT NULL DEFAULT 0',
  icon: "TEXT NOT NULL DEFAULT ''", tags: "TEXT NOT NULL DEFAULT ''", features: "TEXT NOT NULL DEFAULT ''", highlights: "TEXT NOT NULL DEFAULT ''",
  guide: "TEXT NOT NULL DEFAULT ''", version: "TEXT NOT NULL DEFAULT ''", released: "TEXT NOT NULL DEFAULT ''", author: "TEXT NOT NULL DEFAULT ''",
  download_url: "TEXT NOT NULL DEFAULT ''", banner_url: "TEXT NOT NULL DEFAULT ''",
  benefits: "TEXT NOT NULL DEFAULT ''",
};

/* Chuyển dữ liệu tool sang bố cục mới (chạy 1 lần, chạy lại vẫn an toàn) */
const MIGRATE_TOOLS_V2 = [
  // 4 nhóm chủ đề mới
  `UPDATE tools SET grp = 'kt' WHERE grp = 'vp' AND (sub LIKE 'Kế toán%' OR slug IN ('doc-hoa-don-xml','doi-chieu-sao-ke','import-misa-sao-ke','doi-soat-san-tmdt','loi-nhuan-san-tmdt','tai-hoa-don-hang-loat','tra-cuu-van-ban'))`,
  `UPDATE tools SET grp = 'hc' WHERE grp = 'vp'`,
  // Giá: tool trước đây để trạng thái "Có phí" → giá Có phí; mặc định Free
  `UPDATE tools SET pricing = 'paid' WHERE status = 'paid'`,
  // Trạng thái: chỉ tool đã có link mới là Dùng được; còn lại Coming soon
  `UPDATE tools SET status = 'soon' WHERE url = '' OR status = 'paid'`,
  `UPDATE tools SET status = 'ok' WHERE url <> '' AND status = 'soon'`,
  `UPDATE tools SET author = 'Tuấn · Quản trị tử tế' WHERE author = ''`,
  ...[
    ['tra-cuu-van-ban', 'book', 'Thuế, Kế toán, Lao động, Văn bản pháp luật', 1],
    ['doc-hoa-don-xml', 'receipt', 'Hóa đơn điện tử, XML', 1],
    ['van-ban-hang-loat', 'files', 'Văn bản, Trộn thư, Thiết kế hàng loạt', 1],
    ['doi-chieu-sao-ke', 'scale', 'Ngân hàng, Đối chiếu', 1],
    ['import-misa-sao-ke', 'import', 'MISA, Ngân hàng, Import', 1],
    ['doi-soat-san-tmdt', 'cart', 'Sàn TMĐT, Đối soát, Shopee, TikTok Shop', 1],
    ['loi-nhuan-san-tmdt', 'chart', 'Sàn TMĐT, Lợi nhuận, Báo cáo', 1],
    ['tai-hoa-don-hang-loat', 'download', 'Hóa đơn điện tử, Cổng thuế', 0],
    ['quan-ly-nhan-su', 'users', 'Nhân sự, Chấm công, Hội nhập', 0],
    ['checklist-setup-spa', 'clipboard', 'Spa, Setup, Checklist', 0],
    ['thu-nhap-tri-lieu-vien', 'coins', 'Spa, Lương – hoa hồng', 0],
    ['dong-tien-du-an', 'trend', 'Dòng tiền, Thu hồi vốn', 0],
    ['checklist-van-hanh', 'checklist', 'Spa, Vận hành, Checklist', 0],
    ['luyen-doc-tieng-anh', 'language', 'Tiếng Anh, Tự học', 0],
    ['quan-ly-cong-viec', 'kanban', 'Năng suất, Việc cá nhân', 0],
  ].map(([slug, icon, tags, feat]) =>
    `UPDATE tools SET icon = CASE WHEN icon = '' THEN '${icon}' ELSE icon END, tags = CASE WHEN tags = '' THEN '${tags}' ELSE tags END${feat ? ', featured = 1' : ''} WHERE slug = '${slug}'`),
  // Thông tin chi tiết Cẩm nang (lấy từ nội dung bản gốc)
  `UPDATE tools SET
    version = CASE WHEN version = '' THEN 'Nội dung cập nhật 08/2026' ELSE version END,
    released = CASE WHEN released = '' THEN '2026-10-05' ELSE released END,
    who = CASE WHEN who IN ('', 'Kế toán', 'Kế toán, chủ doanh nghiệp nhỏ') THEN 'Kế toán, chủ doanh nghiệp nhỏ, người tự học thuế – kế toán' ELSE who END,
    highlights = CASE WHEN highlights = '' THEN 'Đối chiếu Luật – Nghị định – Thông tư | Xem song song quy định ở từng tầng văn bản, đến tận Chương, Điều.
So sánh trước & sau cải cách 2025-2026 | Thấy ngay điểm thay đổi của chính sách thuế để tránh áp dụng nhầm điều khoản cũ.
Công cụ tính, tra tương tác | Máy tính thuế TNCN, tra ngưỡng hóa đơn điện tử, bảng thuế suất GTGT ngay trong trang.' ELSE highlights END,
    features = CASE WHEN features = '' THEN 'Nghiên cứu theo 8 chủ đề kiến thức
Tủ văn bản pháp luật, mục lục Chương – Điều, mở toàn văn
Máy tính thuế TNCN lũy tiến từng phần
Tra ngưỡng bắt buộc hóa đơn điện tử
Bảng tra thuế suất GTGT theo nhóm hàng
Checklist tự rà soát rủi ro tuân thủ
Hỏi đáp nhanh
Đánh dấu mục "Hay dùng" để mở lại nhanh' ELSE features END,
    guide = CASE WHEN guide = '' THEN 'Bấm "Truy cập công cụ", cẩm nang mở ngay trên trình duyệt, không cần cài đặt hay đăng nhập.
Chọn cách tra: Đối chiếu văn bản, Nghiên cứu theo chủ đề, Tủ văn bản hoặc Công cụ tương tác ở menu bên trái.
Gặp điều khoản quan trọng, đối chiếu lại văn bản gốc mới nhất trước khi áp dụng cho số liệu chính thức.' ELSE guide END
   WHERE slug = 'tra-cuu-van-ban'`,
];

/* Bản 1.5: tiện ích nổi bật của Cẩm nang – chỉ thay khi anh chưa tự sửa trong quản trị */
const MIGRATE_TOOLS_V3 = [
  `UPDATE tools SET highlights = 'Tra cứu từ tổng quát đến chi tiết | Đi từ 8 chủ đề đến từng văn bản, Chương, Điều, khoản cần tìm.
Đối chiếu theo lịch sử thay đổi | Thấy ngay văn bản nào sửa đổi, thay thế văn bản nào, điều khoản nào đang có hiệu lực.
Tự động cập nhật văn bản mới mỗi ngày | Văn bản mới được rà soát, tóm tắt điểm chính, ngày hiệu lực và link văn bản gốc.
Tìm kiếm nhanh | Gõ từ khóa là ra văn bản, chủ đề, điều khoản cần tra.'
   WHERE slug = 'tra-cuu-van-ban' AND instr(highlights, 'Xem song song quy định ở từng tầng văn bản') > 0`,
];
/* Bản 1.6.3: popup – "Công cụ này sẽ giúp bạn" + "Công cụ phù hợp với" của Cẩm nang (chỉ điền khi anh chưa tự sửa) */
const MIGRATE_TOOLS_V4 = [
  `UPDATE tools SET benefits = 'Nắm rõ quy định thuế, hóa đơn, lao động – BHXH đang có hiệu lực theo từng chủ đề, đến tận Chương, Điều.
Đối chiếu Luật – Nghị định – Thông tư của cùng một vấn đề, biết văn bản nào đã được sửa đổi, thay thế.
So sánh quy định trước và sau cải cách 2025–2026 để không áp dụng nhầm điều khoản cũ.
Tự tính nhanh thuế TNCN, tra ngưỡng hóa đơn điện tử và thuế suất GTGT ngay trong trang.'
   WHERE slug = 'tra-cuu-van-ban' AND benefits = ''`,
  `UPDATE tools SET who = 'Kế toán, Hành chính – Nhân sự, C&B (lương, bảo hiểm), chủ doanh nghiệp nhỏ, người tự học thuế – kế toán'
   WHERE slug = 'tra-cuu-van-ban' AND who = 'Kế toán, chủ doanh nghiệp nhỏ, người tự học thuế – kế toán'`,
];
/* Bản 2.0: đưa công cụ "Tạo văn bản hàng loạt" lên web (thư mục cong-cu/tao-van-ban-hang-loat).
   Chỉ chạy khi bản ghi chưa có link; trường nào anh đã tự nhập trong quản trị thì giữ nguyên. */
const MIGRATE_TOOLS_V5 = [
  `UPDATE tools SET
    url = '/tools/tao-van-ban-hang-loat/',
    status = 'ok',
    released = CASE WHEN released = '' THEN '2026-10-09' ELSE released END,
    version = CASE WHEN version = '' THEN 'Bản 1.7.2' ELSE version END,
    who = CASE WHEN who IN ('', 'Hành chính, marketing') THEN 'Hành chính – Nhân sự, C&B (lương), Đào tạo – Sự kiện, Marketing, Kế toán, chủ doanh nghiệp nhỏ' ELSE who END,
    benefits = CASE WHEN benefits = '' THEN 'Tạo nhanh hàng loạt hợp đồng, giấy mời, phiếu lương, chứng chỉ từ một file mẫu và một danh sách Excel.
Giữ đúng phông chữ, bảng biểu, màu sắc, công thức của file mẫu – chỉ thay đúng chỗ cần điền.
Kiểm tra từng bản trước khi tạo, ghép trường bằng cách bấm hoặc kéo thả cột vào chỗ cần điền.
Tải về mỗi người một file hoặc gộp tất cả vào một file Word, Excel, PDF hay ảnh.' ELSE benefits END,
    highlights = CASE WHEN highlights = '' THEN 'Đánh dấu [Tên cột] là xong | Gõ [Họ và tên] ngay trong Word, Excel; công cụ tự nhận diện, có mẫu phiếu lương làm sẵn.
Dùng được cả mẫu cũ, bản scan | Mẫu chưa đánh dấu hay PDF scan: bấm ô chờ hoặc kéo khung, chữ cũ được xoá mà giữ nền, hoa văn.
Xem thử trước khi tạo | Duyệt từng bản theo dòng danh sách, chỉnh định dạng ngày, số tiền, chữ in hoa.
Dữ liệu không rời máy | Xử lý hoàn toàn trên trình duyệt, tải về dùng được cả khi không có mạng.' ELSE highlights END,
    features = CASE WHEN features = '' THEN 'Nhận diện ký hiệu [Tên cột], {{Tên cột}}, «Tên cột» trong file mẫu
File mẫu Word, Excel, PDF (có lớp chữ hoặc bản scan), ảnh PNG/JPG
Danh sách Excel hoặc CSV; tải danh sách trống đúng tên cột từ file mẫu
Ô chờ và bảng chọn cột khi file mẫu chưa có ký hiệu
Định dạng ngày, số tiền, chữ in hoa, thêm số 0 phía trước
Xuất tách từng file (nén ZIP hoặc lưu thẳng vào thư mục) hoặc gộp một file
Word xuất được PDF; PDF có tuỳ chọn dạng ảnh
Bộ ví dụ phiếu lương để dùng thử ngay' ELSE features END,
    guide = CASE WHEN guide = '' THEN 'Bấm "Dùng công cụ", công cụ mở ngay trên trình duyệt, không cần cài đặt hay đăng nhập. Muốn dùng khi không có mạng, bấm "Tải về máy" ở góc trên.
Tải lên file mẫu (đã gõ [Tên cột] vào chỗ cần điền) và file danh sách Excel; chưa có thì bấm "Thử ngay với ví dụ" để xem cách làm.
Kiểm tra phần ghép trường và bản xem thử, chọn định dạng, cách tải về rồi bấm Tạo.' ELSE guide END
   WHERE slug = 'van-ban-hang-loat' AND url = ''`,
];
/* Bản 2.0.1: nút "Tải bản offline" cho Tạo văn bản hàng loạt (chỉ điền khi anh chưa nhập link tải) */
const MIGRATE_TOOLS_V6 = [
  `UPDATE tools SET download_url = '/tools/tao-van-ban-hang-loat/index.html' WHERE slug = 'van-ban-hang-loat' AND download_url = ''`,
];
/* Cột bổ sung cho bảng requests (bản 1.7 – Bảng ghim công khai). Chỉ các cột board_* và eta được hiện ra ngoài. */
export const REQ_EXTRA_COLS = {
  on_board: 'INTEGER NOT NULL DEFAULT 0', board_title: "TEXT NOT NULL DEFAULT ''", board_desc: "TEXT NOT NULL DEFAULT ''",
  board_note: "TEXT NOT NULL DEFAULT ''", board_link: "TEXT NOT NULL DEFAULT ''", eta: "TEXT NOT NULL DEFAULT ''", eta_prev: "TEXT NOT NULL DEFAULT ''",
};
/* Thêm cột còn thiếu – lỗi chỉ ghi log, không làm sập API */
async function addCols(env, table, cols) {
  try {
    const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
    const have = new Set(results.map(r => r.name));
    for (const [c, def] of Object.entries(cols)) {
      if (have.has(c)) continue;
      try { await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${c} ${def}`).run(); }
      catch (e) { if (!/duplicate column/i.test(String(e))) console.error('add_col', table, c, e); }
    }
  } catch (e) { console.error('add_cols', table, e); }
}
/* Cột bổ sung cho bảng posts (bản 1.9 – Blog) */
export const POST_EXTRA_COLS = {
  topics: "TEXT NOT NULL DEFAULT ''", cover_alt: "TEXT NOT NULL DEFAULT ''", featured: 'INTEGER NOT NULL DEFAULT 0',
  seo_title: "TEXT NOT NULL DEFAULT ''", seo_desc: "TEXT NOT NULL DEFAULT ''", og_title: "TEXT NOT NULL DEFAULT ''", og_desc: "TEXT NOT NULL DEFAULT ''",
  og_image: "TEXT NOT NULL DEFAULT ''", noindex: 'INTEGER NOT NULL DEFAULT 0', preview_key: "TEXT NOT NULL DEFAULT ''",
};
const MIGRATE_BLOG_V1 = [
  `INSERT OR IGNORE INTO post_topics (slug, name, color, sort, created_at, updated_at) VALUES ('quan-tri', 'Quản trị', 'blue', 10, 0, 0)`,
  `INSERT OR IGNORE INTO post_topics (slug, name, color, sort, created_at, updated_at) VALUES ('hanh-trinh', 'Hành trình trưởng thành', 'amber', 20, 0, 0)`,
  `INSERT OR IGNORE INTO post_topics (slug, name, color, sort, created_at, updated_at) VALUES ('gia-dinh', 'Gia đình', 'green', 30, 0, 0)`,
  `UPDATE posts SET topics = category WHERE topics = '' AND category IN ('quan-tri', 'hanh-trinh', 'gia-dinh')`,
  `UPDATE posts SET preview_key = lower(hex(randomblob(12))) WHERE preview_key = ''`,
];
let schemaReady = null;
async function migrate(env) {
  await env.DB.batch(SCHEMA.map(s => env.DB.prepare(s)));
  await ensureLegalSchema(env);
  const { results } = await env.DB.prepare('PRAGMA table_info(tools)').all();
  const have = new Set(results.map(r => r.name));
  for (const [c, def] of Object.entries(TOOL_EXTRA_COLS)) {
    if (have.has(c)) continue;
    try { await env.DB.prepare(`ALTER TABLE tools ADD COLUMN ${c} ${def}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e))) throw e; }
  }
  await addCols(env, 'requests', REQ_EXTRA_COLS);
  await addCols(env, 'posts', POST_EXTRA_COLS);
  try {
    const doneB = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_blog_v1'`).first('value');
    if (!doneB) await env.DB.batch([...MIGRATE_BLOG_V1, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_blog_v1', '1')`].map(s => env.DB.prepare(s)));
  } catch (e) { console.error('mig_blog_v1', e); }
  const done = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v2'`).first('value');
  if (!done) {
    await env.DB.batch([...MIGRATE_TOOLS_V2, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v2', '1')`].map(s => env.DB.prepare(s)));
  }
  const done3 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v3'`).first('value');
  /* Migration nội dung: lỗi thì ghi log, KHÔNG làm sập toàn bộ API (D1 giới hạn mẫu LIKE 50 byte nên dùng instr) */
  if (!done3) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V3, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v3', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v3', e); }
  }
  const done4 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v4'`).first('value');
  if (!done4) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V4, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v4', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v4', e); }
  }
  const done5 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v5'`).first('value');
  if (!done5) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V5, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v5', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v5', e); }
  }
  const done6 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v6'`).first('value');
  if (!done6) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V6, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v6', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v6', e); }
  }
}
export function ensureSchema(env) {
  if (!schemaReady) schemaReady = migrate(env).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

/* ---------------- Cài đặt ---------------- */
export const SETTINGS = {
  site_url: { label: 'Địa chỉ trang khách (VD: https://quantritute.vn)', def: '', public: false },
  headline: { label: 'Câu định vị (trang chủ)', def: 'Quản trị lấy Con người làm gốc', public: true },
  tagline: { label: 'Câu phụ (trang chủ)', def: 'Chia sẻ hành trình học, tạo giá trị mỗi ngày.', public: true },
  notice: { label: 'Thông báo đầu trang (để trống nếu không có)', def: '', public: true },
  contact_phone: { label: 'Số điện thoại', def: '', public: true },
  contact_zalo: { label: 'Zalo (số hoặc link)', def: '', public: true },
  contact_email: { label: 'Email liên hệ', def: '', public: true },
  social_tiktok: { label: 'Link TikTok', def: '', public: true },
  social_facebook: { label: 'Link Fanpage', def: '', public: true },
  social_youtube: { label: 'Link YouTube', def: '', public: true },
  /* Cài đặt riêng của công cụ Cẩm nang thuế (hiện ở Quản trị → Cẩm nang thuế → Cài đặt công cụ) */
  legal_scan_every_days: { label: 'Quét văn bản pháp luật mới: cứ mấy ngày quét 1 lần (1 = hằng ngày, tối đa 30). Giờ quét: 08:00', def: '1', public: false, tool: 'cam-nang-thue-2026' },
  feedback_open: { label: 'Nhận góp ý từ người dùng (popup Góp ý trên cẩm nang)', def: '1', public: false, bool: true, tool: 'cam-nang-thue-2026' },
  subscribe_open: { label: 'Hiện form đăng ký nhận cập nhật qua email', def: '1', public: false, bool: true, tool: 'cam-nang-thue-2026' },
  mail_enabled: { label: 'Bật gửi email (xác nhận đăng ký + bản tin 17:00 hằng ngày khi có văn bản mới được duyệt)', def: '0', public: false, bool: true, tool: 'cam-nang-thue-2026' },
  mail_from: { label: 'Email gửi đi (thuộc tên miền đã xác minh ở Resend, VD: capnhat@quantritute.vn)', def: '', public: false, tool: 'cam-nang-thue-2026' },
  mail_from_name: { label: 'Tên người gửi', def: 'Quản trị tử tế', public: false, tool: 'cam-nang-thue-2026' },
  forms_open: { label: 'Nhận đặt hàng công cụ', def: '1', public: true, bool: true },
  booking_open: { label: 'Nhận đặt lịch tư vấn 1:1', def: '1', public: true, bool: true },
  /* v1.8 Về Minh Tuấn (long = ô nhiều dòng) */
  about_name: { label: 'Tên hiển thị', def: 'Minh Tuấn', public: true },
  about_role: { label: 'Dòng giới thiệu ngắn dưới tên', def: '', public: true },
  about_photo: { label: 'Link ảnh chân dung (để trống: hiện chữ viết tắt)', def: '', public: true },
  about_motto: { label: 'Phương châm sống (hiện trên tờ giấy ghim)', def: '', public: true },
  about_intro: { label: 'Lời giới thiệu (mỗi đoạn 1 dòng)', def: '', public: true, long: true },
  about_career: { label: 'Hành trình sự nghiệp – mỗi dòng 1 ngăn kéo: Thời gian | Vai trò, nơi làm | Điều học được', def: '', public: true, long: true },
  about_values: { label: 'Định hướng tạo giá trị – mỗi dòng: Tiêu đề | Mô tả', def: 'Công cụ miễn phí cho việc lặp lại | Kho công cụ nhỏ, miễn phí, giúp người làm văn phòng bớt những việc làm đi làm lại mỗi ngày.\nChỉ thu phí khi thực sự đặc thù | Công cụ đặc thù, độc nhất mới tính phí theo lượt hoặc thuê bao.\nGiới thiệu đúng công cụ | Khi đã có công cụ tốt của bên khác, giới thiệu để bạn dùng ngay, không phải chờ.\nĐồng hành 1:1 khi có việc cụ thể | Cùng bạn gỡ một tình huống thật về vận hành, nhân sự hoặc công cụ.', public: true, long: true },
  about_services: { label: 'Dịch vụ – mỗi dòng 1 tấm danh thiếp: Tên dịch vụ | Phù hợp với (không bắt buộc)', def: 'Setup vận hành, quy trình\nNhân sự, cơ chế thu nhập\nSetup, vận hành spa\nỨng dụng AI, công cụ', public: true, long: true },
  /* v1.8 Tách cà phê */
  cafe_thanks: { label: 'Lời cảm ơn (dưới mã QR)', def: '', public: true, long: true },
  thanks_wall: { label: 'Bức tường cảm ơn – mỗi dòng 1 tên hoặc biệt danh (chỉ ghi khi người ủng hộ đồng ý)', def: '', public: true, long: true },
  bank_code: { label: 'Mã ngân hàng VietQR (VD: MB, VCB, TCB)', def: '', public: true },
  bank_name: { label: 'Tên ngân hàng', def: '', public: true },
  bank_acc: { label: 'Số tài khoản nhận ủng hộ', def: '', public: true },
  bank_holder: { label: 'Chủ tài khoản', def: '', public: true },
  donate_content: { label: 'Nội dung chuyển khoản gợi ý', def: 'CAFE QTT', public: true },
  donate_note: { label: 'Lời ngỏ – thư tay cạnh tách cà phê', def: 'Nếu một công cụ giúp được bạn, ủng hộ tùy tâm để kho công cụ có thêm tool mới.', public: true },
};
export async function getSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const [k, v] of Object.entries(SETTINGS)) s[k] = v.def;
  for (const r of results) if (r.key in SETTINGS && r.value != null) s[r.key] = r.value;
  return s;
}

/* ---------------- Các loại dữ liệu quản trị ----------------
 * type: text | long | int | bool | enum | json | date | slug
 */
export const ENTITIES = {
  tools: {
    table: 'tools', order: 'sort ASC, id ASC', search: ['name', 'slug', 'pain', 'tags'], filter: 'status',
    fields: {
      slug: { type: 'slug', req: true }, no: { type: 'text', max: 10 }, name: { type: 'text', req: true, max: 160 },
      grp: { type: 'enum', values: ['kt', 'hc', 'kn', 'ht'] }, sub: { type: 'text', max: 80 }, pain: { type: 'text', max: 300 },
      who: { type: 'text', max: 200 }, status: { type: 'enum', values: ['soon', 'ok', 'risk'] },
      pricing: { type: 'enum', values: ['free', 'paid'] }, price: { type: 'int' }, price_note: { type: 'text', max: 40 },
      featured: { type: 'bool' }, icon: { type: 'text', max: 30 }, tags: { type: 'text', max: 200 },
      highlights: { type: 'long', max: 3000 }, benefits: { type: 'long', max: 2000 }, features: { type: 'long', max: 4000 }, guide: { type: 'long', max: 3000 },
      version: { type: 'text', max: 60 }, released: { type: 'date' }, author: { type: 'text', max: 80 },
      url: { type: 'text', max: 500 }, download_url: { type: 'text', max: 500 }, banner_url: { type: 'text', max: 500 },
      embed: { type: 'bool' }, videos: { type: 'json' }, body: { type: 'long', max: 20000 },
      sort: { type: 'int' }, visible: { type: 'bool' },
    },
  },
  episodes: {
    table: 'episodes', order: 'sort ASC, id DESC', search: ['title', 'no', 'summary'], filter: 'status',
    fields: {
      no: { type: 'text', max: 20 }, title: { type: 'text', req: true, max: 200 }, summary: { type: 'long', max: 4000 },
      youtube_url: { type: 'text', max: 500 }, shorts: { type: 'json' }, status: { type: 'enum', values: ['draft', 'scheduled', 'published'] },
      publish_date: { type: 'date' }, sort: { type: 'int' }, visible: { type: 'bool' },
    },
  },
  reflections: {
    table: 'reflections', order: "sort ASC, COALESCE(NULLIF(published_at,''),'9999') DESC, id DESC", search: ['title', 'author', 'slug'], filter: 'status',
    fields: {
      kind: { type: 'enum', values: ['book', 'video'] }, slug: { type: 'slug', req: true }, title: { type: 'text', req: true, max: 200 },
      author: { type: 'text', max: 160 }, color: { type: 'text', max: 20 }, before_text: { type: 'long', max: 1500 }, after_text: { type: 'long', max: 1500 },
      quotes: { type: 'long', max: 4000 }, lessons: { type: 'long', max: 3000 }, youtube_url: { type: 'text', max: 500 }, summary: { type: 'long', max: 2000 },
      reflection: { type: 'long', max: 4000 }, question: { type: 'text', max: 300 }, script: { type: 'long', max: 60000 },
      status: { type: 'enum', values: ['draft', 'published'] }, published_at: { type: 'date' }, sort: { type: 'int' }, visible: { type: 'bool' },
    },
  },
  topics: {
    table: 'post_topics', order: 'sort ASC, id ASC', search: ['name', 'slug'], filter: 'visible',
    fields: {
      slug: { type: 'slug', req: true }, name: { type: 'text', req: true, max: 80 }, color: { type: 'enum', values: ['amber', 'blue', 'green', 'red', 'purple', 'teal'] },
      description: { type: 'text', max: 300 }, sort: { type: 'int' }, visible: { type: 'bool' },
    },
  },
  posts: {
    table: 'posts', order: "COALESCE(NULLIF(published_at,''),'9999') DESC, id DESC", search: ['title', 'slug', 'excerpt'], filter: 'status',
    fields: {
      slug: { type: 'slug', req: true }, title: { type: 'text', req: true, max: 200 },
      category: { type: 'enum', values: ['quan-tri', 'hanh-trinh', 'gia-dinh', 'sach', 'video'] },
      excerpt: { type: 'text', max: 400 }, body: { type: 'long', max: 60000 }, cover_url: { type: 'text', max: 500 },
      status: { type: 'enum', values: ['draft', 'review', 'published', 'hidden'] }, published_at: { type: 'date' },
      topics: { type: 'text', max: 300 }, cover_alt: { type: 'text', max: 200 }, featured: { type: 'bool' },
      seo_title: { type: 'text', max: 90 }, seo_desc: { type: 'text', max: 300 }, og_title: { type: 'text', max: 120 }, og_desc: { type: 'text', max: 300 },
      og_image: { type: 'text', max: 500 }, noindex: { type: 'bool' },
    },
  },
  requests: {
    table: 'requests', order: 'created_at DESC', search: ['pain', 'role', 'contact'], filter: 'status',
    fields: {
      pain: { type: 'long', req: true, max: 2000 }, role: { type: 'text', max: 80 }, contact: { type: 'text', max: 160 },
      status: { type: 'enum', values: ['new', 'reviewing', 'planned', 'building', 'done', 'rejected'] }, votes: { type: 'int' },
      tool_slug: { type: 'text', max: 80 }, admin_note: { type: 'long', max: 4000 },
      on_board: { type: 'bool' }, board_title: { type: 'text', max: 120 }, board_desc: { type: 'long', max: 600 },
      board_note: { type: 'text', max: 300 }, board_link: { type: 'text', max: 500 }, eta: { type: 'date' },
    },
  },
  feedback: {
    table: 'feedback', order: 'created_at DESC', search: ['name', 'phone', 'content'], filter: 'status',
    fields: {
      tool_slug: { type: 'text', max: 80 }, name: { type: 'text', max: 120 }, phone: { type: 'text', max: 40 }, content: { type: 'long', req: true, max: 4000 },
      page: { type: 'text', max: 200 }, status: { type: 'enum', values: ['new', 'read', 'done'] }, admin_note: { type: 'long', max: 4000 },
    },
  },
  subscribers: {
    table: 'subscribers', order: 'created_at DESC', search: ['email'], filter: 'status',
    fields: {
      tool_slug: { type: 'text', max: 80 }, email: { type: 'text', req: true, max: 160 },
      status: { type: 'enum', values: ['pending', 'active', 'unsubscribed'] }, admin_note: { type: 'long', max: 2000 },
    },
  },
  legal: {
    table: 'legal_docs', order: "CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, ngay_bh_iso DESC, id DESC",
    search: ['so_hieu', 'trich_yeu', 'title', 'topics'], filter: 'status',
    fields: {
      so_hieu: { type: 'text', req: true, max: 60 }, loai: { type: 'text', max: 60 }, co_quan: { type: 'text', max: 120 },
      ngay_ban_hanh: { type: 'text', max: 12 }, hieu_luc: { type: 'text', max: 60 }, trich_yeu: { type: 'long', req: true, max: 2000 },
      url: { type: 'text', max: 500 }, pdf_url: { type: 'text', max: 500 }, title: { type: 'text', max: 160 },
      summary: { type: 'long', max: 1500 }, impact: { type: 'long', max: 1500 }, action: { type: 'long', max: 600 },
      level: { type: 'enum', values: ['tb', 'cao', 'thap'] }, topics: { type: 'text', max: 120 },
      status: { type: 'enum', values: ['pending', 'approved', 'rejected', 'ignored', 'known'] },
      in_handbook: { type: 'bool' }, admin_note: { type: 'long', max: 2000 },
      key_points: { type: 'long', max: 4000 }, full_text: { type: 'long', max: 60000 },
      recommend: { type: 'enum', values: ['approve', 'reject'] }, recommend_note: { type: 'text', max: 400 },
    },
  },
  bookings: {
    table: 'bookings', order: 'created_at DESC', search: ['name', 'contact', 'topic', 'description'], filter: 'status',
    fields: {
      name: { type: 'text', req: true, max: 120 }, contact: { type: 'text', req: true, max: 160 }, topic: { type: 'text', max: 120 },
      description: { type: 'long', max: 4000 }, status: { type: 'enum', values: ['new', 'contacted', 'scheduled', 'done', 'cancelled'] },
      scheduled_at: { type: 'text', max: 40 }, admin_note: { type: 'long', max: 4000 },
    },
  },
};

/** Kiểm tra & chuẩn hoá dữ liệu gửi lên. partial=true: chỉ những trường có mặt */
export function validate(entity, body, partial = false) {
  const def = ENTITIES[entity]; const out = {}; const errs = [];
  for (const [k, f] of Object.entries(def.fields)) {
    if (!(k in (body || {}))) { if (!partial && f.req) errs.push(`Thiếu trường "${k}".`); continue; }
    let v = body[k];
    switch (f.type) {
      case 'int': v = int(v, 0); break;
      case 'bool': v = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0; break;
      case 'enum': v = f.values.includes(v) ? v : f.values[0]; break;
      case 'json': {
        const arr = typeof v === 'string' ? safeJson(v || '[]', null) : v;
        if (!Array.isArray(arr)) { errs.push(`"${k}" phải là danh sách.`); continue; }
        v = JSON.stringify(arr.slice(0, 50).map(x => ({ label: clean(x?.label, 120), url: clean(x?.url, 500) })).filter(x => x.label || x.url));
        break;
      }
      case 'date': v = clean(v, 10); if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { errs.push(`"${k}" phải theo dạng YYYY-MM-DD.`); continue; } break;
      case 'slug': v = clean(v, 80).toLowerCase(); if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) { errs.push('Đường dẫn (slug) chỉ gồm chữ thường không dấu, số và dấu gạch ngang.'); continue; } break;
      case 'long': v = cleanMultiline(v, f.max || 5000); break;
      default: v = clean(v, f.max || 200);
    }
    if (f.req && (v === '' || v == null)) { errs.push(`"${k}" không được để trống.`); continue; }
    out[k] = v;
  }
  return { out, errs };
}

/** Bóc tách mã sinh video YouTube để nhúng an toàn */
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{6,15})/);
  return m ? m[1] : '';
}
