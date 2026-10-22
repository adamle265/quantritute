/* ============================================================
 * Quản trị tử tế — Dịch vụ & công cụ AI: bảng dữ liệu (D1) + dữ liệu khởi tạo (v1.17)
 * Tự chạy trong ensureSchema() (core.js). Mọi lỗi chỉ ghi log, KHÔNG làm sập API chung.
 *   subs : 1 dòng = 1 dịch vụ / công cụ AI / gói trả phí. KHÔNG lưu mật khẩu, API key.
 * ============================================================ */
export const SUBS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS subs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, vendor TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'ai', line TEXT NOT NULL DEFAULT 'shared', purpose TEXT NOT NULL DEFAULT '', plan TEXT NOT NULL DEFAULT '',
    cycle TEXT NOT NULL DEFAULT 'unknown', price REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'VND',
    started TEXT NOT NULL DEFAULT '', next_renew TEXT NOT NULL DEFAULT '', auto_renew INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', value INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', log TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_subs_renew ON subs(next_renew)`,
];

/* Dữ liệu khởi tạo: CHỈ tên + mục đích + gói đã được anh nói rõ. Giá, chu kỳ, ngày gia hạn để trống – anh nhập sau.
 * Chạy 1 lần (khoá _mig_subs_v1), không đè dữ liệu anh đã sửa. */
const SEED = [
  { name: 'Vbee', vendor: 'Vbee', category: 'ai', line: 'shared', plan: 'VIP (gói năm, có API)', purpose: 'Giọng đọc Đốm cho video (giọng PhuocPro)', cycle: 'year' },
  { name: 'Resend', vendor: 'Resend', category: 'infra', line: 'shared', plan: 'Pro', purpose: 'Gửi email cho web Quản trị tử tế và web đặt lịch của Thành' },
  { name: 'Tên miền quantritute.com', vendor: 'Mắt Bão', category: 'infra', line: 'shared', purpose: 'Tên miền chính của web Quản trị tử tế' },
  { name: 'Cloudflare', vendor: 'Cloudflare', category: 'infra', line: 'shared', purpose: 'Chạy web, trang quản trị, database D1 (tài khoản riêng của anh, dùng cả cho Nhungdao)' },
  { name: 'Claude', vendor: 'Anthropic', category: 'ai', line: 'shared', purpose: 'Trợ lý BuBu, xây web/công cụ, dựng video' },
  { name: 'Suno', vendor: 'Suno', category: 'ai', line: 'shared', purpose: 'Tạo nhạc nền thương hiệu' },
  { name: 'Gemini / Flow', vendor: 'Google', category: 'ai', line: 'shared', purpose: 'Tạo ảnh, hình ảnh nhân vật Đốm' },
];

export async function ensureSubsSchema(env) {
  try {
    await env.DB.batch(SUBS_SCHEMA.map(s => env.DB.prepare(s)));
    const done = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_subs_v1'`).first('value');
    if (done) return;
    const t = Date.now(), st = [];
    for (const v of SEED) {
      st.push(env.DB.prepare(`INSERT INTO subs (name, vendor, category, line, purpose, plan, cycle, status, notes, log, created_at, updated_at)
        SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, 'active', 'Cần anh nhập giá gốc, loại gói và ngày kích hoạt.', '[]', ?8, ?8
        WHERE NOT EXISTS (SELECT 1 FROM subs WHERE name = ?1)`)
        .bind(v.name, v.vendor, v.category, v.line, v.purpose, v.plan || '', v.cycle || 'unknown', t));
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_subs_v1', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('subs schema', e); }
}
