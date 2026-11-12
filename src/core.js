/* ============================================================
 * Quản trị tử tế — phần dùng chung cho máy chủ (Pages Functions + D1)
 * ============================================================ */
import { ensureLegalSchema } from './legal-watch.js';
import { ensureStudioSchema } from './studio-schema.js'; // v1.16 Xưởng video (tự bắt lỗi, không làm sập API chung)
import { ensureSubsSchema } from './subs-schema.js'; // v1.17 Dịch vụ & công cụ AI (tự bắt lỗi)

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
  // v1.15i Phòng chiếu: mỗi kênh = 1 danh sách phát (video gắn kênh theo tên – đổi tên kênh tự đổi ở video)
  `CREATE TABLE IF NOT EXISTS video_channels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, note TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 100, visible INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)`,
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
  // v1.22 Gửi link công cụ về email (khách xem bằng điện thoại, mở lại trên máy tính)
  `CREATE TABLE IF NOT EXISTS link_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, tool_slug TEXT NOT NULL DEFAULT '', email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sent',
    subscribe INTEGER NOT NULL DEFAULT 0, admin_note TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  // v1.11 Bộ đếm công cụ: số lượt theo ngày (giờ VN). hit_seen chống đếm trùng: k = mã băm (IP + công cụ + loại), xoá sau 2 ngày, không lưu IP gốc
  `CREATE TABLE IF NOT EXISTS tool_stats (slug TEXT NOT NULL, day TEXT NOT NULL, visits INTEGER NOT NULL DEFAULT 0, uses INTEGER NOT NULL DEFAULT 0,
    downloads INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day))`,
  `CREATE TABLE IF NOT EXISTS hit_seen (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))`,
];
/* Cột bổ sung cho bảng tools (bản 1.2). Tự thêm khi database cũ còn thiếu. */
export const TOOL_EXTRA_COLS = {
  pricing: "TEXT NOT NULL DEFAULT 'free'", price_note: "TEXT NOT NULL DEFAULT ''", featured: 'INTEGER NOT NULL DEFAULT 0',
  icon: "TEXT NOT NULL DEFAULT ''", tags: "TEXT NOT NULL DEFAULT ''", features: "TEXT NOT NULL DEFAULT ''", highlights: "TEXT NOT NULL DEFAULT ''",
  guide: "TEXT NOT NULL DEFAULT ''", version: "TEXT NOT NULL DEFAULT ''", released: "TEXT NOT NULL DEFAULT ''", author: "TEXT NOT NULL DEFAULT ''",
  download_url: "TEXT NOT NULL DEFAULT ''", banner_url: "TEXT NOT NULL DEFAULT ''",
  benefits: "TEXT NOT NULL DEFAULT ''",
  // v1.14: ngày dự kiến phát hành (công cụ chưa Active) – hiện ở cột "Đang hoàn thiện" trên Bảng ghim
  eta: "TEXT NOT NULL DEFAULT ''",
  // Thông báo công cụ mới tới người đăng ký: announce_at = lúc anh bấm "Thông báo" (gửi vào 10h sáng kế tiếp), announced_at = lúc đã gửi
  announce_at: 'INTEGER NOT NULL DEFAULT 0', announced_at: 'INTEGER NOT NULL DEFAULT 0',
  // 07/11/2026: ghi chú nổi bật trong popup (dòng 1 = nhãn, VD ĐANG XÂY DỰNG; các dòng sau = lời ghi chú) + chữ trên nút dùng công cụ
  notice: "TEXT NOT NULL DEFAULT ''", cta_label: "TEXT NOT NULL DEFAULT ''",
  // v1.26: Lịch sử cập nhật tính năng – mỗi dòng "Phiên bản | dd/mm/yyyy | nội dung; nội dung…" (nút trong popup công cụ)
  changelog: "TEXT NOT NULL DEFAULT ''",
  // 03/11/2026: đã gửi thư "Báo cập nhật" cho bản nào, lúc nào (Quản trị → Công cụ → 🔔 Báo cập nhật)
  upd_sent_ver: "TEXT NOT NULL DEFAULT ''", upd_sent_at: 'INTEGER NOT NULL DEFAULT 0',
};
/* v1.26 Góc cảm ơn: các cột công khai cho góp ý (feedback) và đề xuất tính năng (requests) – chỉ hiện khi anh bật pub_show */
/* 02/11/2026: câu mặc định cho ô "Kết quả xử lý (công khai)" khi chọn 2 trạng thái mới ở Góc cảm ơn (anh sửa tay được) */
export const PUB_DEFAULT_RESULT = { wait: 'Đã phân tích và gửi thông tin xác nhận tới người góp ý', cancel: 'Hủy do không nhận được phản hồi từ người góp ý' };
export const PUB_COLS = { pub_show: 'INTEGER NOT NULL DEFAULT 0', pub_name: "TEXT NOT NULL DEFAULT ''", pub_title: "TEXT NOT NULL DEFAULT ''", pub_result: "TEXT NOT NULL DEFAULT ''",
  // 31/10/2026: trích nguyên văn feedback (công khai, anh duyệt/biên tập ở Quản trị – không lấy thẳng nội dung gốc vì có thể chứa thông tin riêng)
  pub_quote: "TEXT NOT NULL DEFAULT ''",
  // 31/10: trạng thái xử lý hiện ở Góc cảm ơn ('' = theo trạng thái chính; new · doing · done · skip)
  // 02/11: thêm wait = Chờ phản hồi từ người góp ý · cancel = Hủy (Kết quả xử lý tự điền câu mặc định, sửa tay được) – xem PUB_DEFAULT_RESULT
  pub_status: "TEXT NOT NULL DEFAULT ''",
  // 01/11: lúc Đốm (AI) đã phân tích ý kiến này (0 = chưa)
  ai_at: 'INTEGER NOT NULL DEFAULT 0' };

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
/* 18/10/2026 – Bộ xử lý hóa đơn điện tử (thư mục cong-cu/xu-ly-hoa-don, bản 1.5.4). Anh Tuấn chốt: GỘP 1 cuốn, Nổi bật.
   Trên web thật anh đã đổi bản ghi "doc-hoa-don-xml" thành slug "hoa-don-thue" – "Bộ công cụ hóa đơn thuế" (sort 10) → dùng bản ghi đó
   (giữ tên anh đặt), ẩn "tai-hoa-don-hang-loat" (đã nằm trong bộ này). Chỉ chạy khi bản ghi còn Coming soon (url = '');
   trường anh đã tự nhập thì giữ nguyên (trừ giá trị mặc định cũ). */
const MIGRATE_TOOLS_V7 = [
  `UPDATE tools SET
    name = CASE WHEN name = '' THEN 'Bộ xử lý hóa đơn điện tử' ELSE name END,
    url = '/tools/xu-ly-hoa-don/',
    download_url = CASE WHEN download_url = '' THEN '/tools/xu-ly-hoa-don/index.html' ELSE download_url END,
    status = 'ok', featured = 1, grp = 'kt',
    icon = CASE WHEN icon IN ('', 'download') THEN 'receipt' ELSE icon END, eta = '',
    tags = CASE WHEN tags IN ('', 'Hóa đơn điện tử, XML', 'Hóa đơn điện tử, Cổng thuế') THEN 'Hóa đơn điện tử, Cổng thuế, XML, Tờ khai GTGT, MISA' ELSE tags END,
    pain = CASE WHEN pain IN ('', 'Mở từng file XML hóa đơn mà chỉ thấy toàn ký tự', 'Nhận file XML mà mở ra chỉ thấy toàn ký tự.') THEN 'Tải từng hóa đơn trên cổng thuế rồi gõ lại vào Excel, tờ khai và MISA' ELSE pain END,
    released = CASE WHEN released = '' THEN '2026-10-18' ELSE released END,
    version = CASE WHEN version = '' THEN 'Bản 1.5.4' ELSE version END,
    who = CASE WHEN who IN ('', 'Kế toán') THEN 'Kế toán, Kế toán trưởng, Kế toán dịch vụ, chủ doanh nghiệp nhỏ và hộ kinh doanh tự làm sổ sách' ELSE who END,
    benefits = CASE WHEN benefits = '' THEN 'Tải hàng loạt hóa đơn mua vào, bán ra (cả hóa đơn có mã từ máy tính tiền) trên cổng thuế về một file ZIP gồm XML, bản gốc và bảng kê.
Gộp hàng trăm file XML thành bảng kê Excel: danh sách hóa đơn, chi tiết hàng hóa, tổng hợp theo thuế suất.
Lập sẵn số liệu tờ khai thuế GTGT mẫu 01/GTGT từ hóa đơn, xuất Excel và XML.
Tạo file nhập chứng từ mua, bán và danh mục nhà cung cấp, hàng hóa lên MISA AMIS.' ELSE benefits END,
    highlights = CASE WHEN highlights = '' THEN 'Tải đủ, không sót | Quét nhiều lượt theo số tháng, gộp kết quả, nhắc quét lại khi cổng thuế trả thiếu.
Một lần tải, dùng cho mọi việc | Cùng một file ZIP dùng cho bảng kê, in bản gốc, tờ khai và file nhập MISA.
Tờ khai tự tổng hợp | Tách đúng theo thuế suất, trừ chiết khấu, lấy số kỳ trước từ XML tờ khai cũ.
Dữ liệu không rời máy | Xử lý ngay trên trình duyệt, không hỏi và không lưu mật khẩu thuế.' ELSE highlights END,
    features = CASE WHEN features = '' THEN 'Nút "Tải HĐ hàng loạt" cài một lần lên thanh dấu trang, dùng ngay trên trang hoadondientu.gdt.gov.vn
Lọc bán ra / mua vào, hóa đơn điện tử và hóa đơn có mã từ máy tính tiền, trạng thái, kết quả kiểm tra
Tự chia khoảng ngày theo tháng, quét nhiều lượt và gộp kết quả; nút Quét lại 1 lượt
File ZIP gồm XML gốc, bản thể hiện và bảng kê Excel; danh sách hóa đơn cổng thuế không lưu XML gốc
Bảng kê tách mua vào / bán ra, chi tiết hàng hóa, tổng hợp thuế suất, tra cứu mẫu người bán (sao chép mã, MST)
In bản gốc hóa đơn từ XML
Tờ khai 01/GTGT: chỉ tiêu tự tính, sửa tay thuế suất, lấy thông tin và số kỳ trước từ XML tờ khai cũ, xuất Excel và XML
Tạo file nhập MISA AMIS: chứng từ mua hàng, mua dịch vụ, bán hàng, nghiệp vụ khác; danh mục nhà cung cấp, hàng hóa; đối chiếu danh mục có sẵn' ELSE features END,
    guide = CASE WHEN guide = '' THEN 'Bấm "Dùng công cụ", công cụ mở ngay trên trình duyệt, không cần cài đặt hay đăng nhập.
Kéo nút "Tải HĐ hàng loạt" lên thanh dấu trang của Chrome (làm một lần). Đăng nhập hoadondientu.gdt.gov.vn như thường ngày rồi bấm nút đó, chọn khoảng ngày, bấm Tìm rồi Tải.
Kéo file ZIP vừa tải vào công cụ để xem bảng kê, in bản gốc, lập tờ khai hoặc tạo file nhập MISA.' ELSE guide END
   WHERE slug = 'hoa-don-thue' AND url = ''`,
  `UPDATE tools SET visible = 0 WHERE slug IN ('tai-hoa-don-hang-loat', 'doc-hoa-don-xml') AND url = ''`,
];
/* 22/10/2026 – Ghép & đối chiếu 2 file Excel (thư mục cong-cu/ghep-doi-chieu, bản 1.7.8). Anh Tuấn chốt: DÙNG LẠI cuốn Coming soon
   "doi-chieu-sao-ke" (Đối chiếu sao kê và sổ phụ ngân hàng) – đổi tên thành Ghép & đối chiếu 2 file Excel, giữ slug và Nổi bật.
   Chỉ chạy khi bản ghi còn Coming soon (url = ''); trường anh đã tự nhập thì giữ nguyên (trừ giá trị mặc định cũ).
   Phòng khi trên web không còn cuốn đó: thêm bản ghi mới slug ghep-doi-chieu nếu chưa có cuốn nào trỏ tới /tools/ghep-doi-chieu/. */
const MIGRATE_TOOLS_V8 = [
  `UPDATE tools SET
    name = 'Ghép & đối chiếu 2 file Excel',
    url = '/tools/ghep-doi-chieu/',
    download_url = CASE WHEN download_url = '' THEN '/tools/ghep-doi-chieu/index.html' ELSE download_url END,
    status = 'ok', grp = 'kt', featured = 1, eta = '',
    icon = CASE WHEN icon = '' THEN 'files' ELSE icon END,
    tags = CASE WHEN tags IN ('', 'Ngân hàng, Đối chiếu') THEN 'Đối chiếu, Sao kê ngân hàng, Excel, Công nợ, Hóa đơn' ELSE tags END,
    pain = CASE WHEN pain = '' THEN 'Đối chiếu sao kê, sổ sách bằng VLOOKUP cả buổi vẫn sót – lệch ngày, tách khoản là không khớp.' ELSE pain END,
    who = CASE WHEN who IN ('', 'Kế toán') THEN 'Kế toán, Kế toán trưởng, Kiểm soát nội bộ, Sales admin, Hành chính – Nhân sự, chủ doanh nghiệp nhỏ' ELSE who END,
    released = CASE WHEN released = '' THEN '2026-10-22' ELSE released END,
    version = CASE WHEN version = '' THEN 'Bản 1.7.8' ELSE version END,
    benefits = CASE WHEN benefits = '' THEN 'Đối chiếu sao kê ngân hàng với sổ tiền gửi, TK 112: tiền vào – tiền ra, lệch ngày ghi sổ, tách khoản.
Tìm ngay dòng có ở file này mà file kia không có: đơn chưa ghi sổ, mã khách sai, nhân sự thiếu chấm công.
So số tiền từng dòng, tô vàng ô lệch và tách tổng chênh lệch do dòng lệch hay dòng thiếu.
Xuất Excel đã tô màu theo trạng thái, lưu thiết lập để tháng sau chạy lại.' ELSE benefits END,
    highlights = CASE WHEN highlights = '' THEN 'Không cần công thức | Chọn cặp cột hoặc bấm Gợi ý, công cụ tự ghép – không cần VLOOKUP hay Power Query.
Hiểu cách ghi sổ | Khớp ngày bỏ qua giờ, tiền vào – tiền ra, cảnh báo lệch ngày và tách khoản (VD nộp BHXH).
File lớn vẫn nhanh | 200.000 dòng ghép trong vài giây ngay trên trình duyệt.
Dữ liệu không rời máy | File xử lý trên máy bạn, không tải lên máy chủ.' ELSE highlights END,
    features = CASE WHEN features = '' THEN 'Thả 1 hoặc 2 file Excel/CSV là vào việc ngay; thiếu file nào công cụ nhắc
Tự dò dòng tiêu đề, tự bỏ dòng Cộng, Số dư, chữ ký cuối sổ; bỏ tick từng dòng không muốn đối chiếu
Gộp dòng theo khóa (cộng tiền theo số hóa đơn, mã khách…) trước khi đối chiếu
2 nhóm điều kiện: Thỏa mãn đồng thời (VÀ) và Thỏa mãn một trong (HOẶC) – VD tiền vào = Nợ HOẶC tiền ra = Có
Gợi ý cặp đối chiếu theo tên cột trùng hoặc dữ liệu khớp từ 80%
Làm sạch khóa: khoảng trắng, hoa/thường, Unicode, ngày bỏ qua giờ, chỉ giữ chữ và số, bỏ dấu, chuẩn hoá số điện thoại
Cho phép số tiền lệch ± đồng hoặc ± % (phí chuyển khoản, làm tròn); ghép 1–1 khi nhiều khoản cùng số tiền
7 kiểu ghép; báo cáo tra soát: khớp, lệch giá trị (tô vàng ô lệch), chỉ có ở A, chỉ có ở B, cột số chênh lệch
Cảnh báo dòng trùng số liệu nhưng lệch ngày (chọn số ngày) và 1 dòng bằng tổng nhiều dòng cùng ngày
Bảng đối chiếu tổng tiền A − B; xem, lọc, tìm kiếm toàn bộ kết quả; chọn lại cột ngay ở màn kết quả
Xuất Excel tô màu, mỗi trạng thái một sheet; lưu thiết lập để lần sau nạp lại' ELSE features END,
    guide = CASE WHEN guide = '' THEN 'Bấm "Dùng online", thả 2 file cần đối chiếu (file chính và file đối chiếu) vào khung tải file.
Bước 2: chọn cặp cột ở nhóm Thỏa mãn đồng thời hoặc Thỏa mãn một trong – bấm Gợi ý cặp đối chiếu cho nhanh.
Bước 3: chọn kiểu ghép; muốn so số tiền từng dòng thì chọn Báo cáo tra soát toàn diện, bấm Chạy.
Bước 4: xem, lọc dòng lệch, tải Excel. Bấm Lưu thiết lập để tháng sau dùng lại.' ELSE guide END,
    updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'doi-chieu-sao-ke' AND url = ''`,
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits)
   SELECT 'ghep-doi-chieu', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'Ghép & đối chiếu 2 file Excel', 'kt', 'Kế toán – tài chính',
     'Đối chiếu sao kê, sổ sách bằng VLOOKUP cả buổi vẫn sót – lệch ngày, tách khoản là không khớp.',
     'Kế toán, Kế toán trưởng, Kiểm soát nội bộ, Sales admin, Hành chính – Nhân sự, chủ doanh nghiệp nhỏ',
     'ok', 0, '/tools/ghep-doi-chieu/', 0, '[]', '', (SELECT COALESCE(MAX(sort), 0) + 1 FROM tools), 1,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 1, 'files', 'Đối chiếu, Sao kê ngân hàng, Excel, Công nợ, Hóa đơn',
     'Thả 1 hoặc 2 file Excel/CSV là vào việc ngay; thiếu file nào công cụ nhắc
Tự dò dòng tiêu đề, tự bỏ dòng Cộng, Số dư, chữ ký cuối sổ; bỏ tick từng dòng không muốn đối chiếu
Gộp dòng theo khóa (cộng tiền theo số hóa đơn, mã khách…) trước khi đối chiếu
2 nhóm điều kiện: Thỏa mãn đồng thời (VÀ) và Thỏa mãn một trong (HOẶC) – VD tiền vào = Nợ HOẶC tiền ra = Có
Gợi ý cặp đối chiếu theo tên cột trùng hoặc dữ liệu khớp từ 80%
Làm sạch khóa: khoảng trắng, hoa/thường, Unicode, ngày bỏ qua giờ, chỉ giữ chữ và số, bỏ dấu, chuẩn hoá số điện thoại
Cho phép số tiền lệch ± đồng hoặc ± % (phí chuyển khoản, làm tròn); ghép 1–1 khi nhiều khoản cùng số tiền
7 kiểu ghép; báo cáo tra soát: khớp, lệch giá trị (tô vàng ô lệch), chỉ có ở A, chỉ có ở B, cột số chênh lệch
Cảnh báo dòng trùng số liệu nhưng lệch ngày (chọn số ngày) và 1 dòng bằng tổng nhiều dòng cùng ngày
Bảng đối chiếu tổng tiền A − B; xem, lọc, tìm kiếm toàn bộ kết quả; chọn lại cột ngay ở màn kết quả
Xuất Excel tô màu, mỗi trạng thái một sheet; lưu thiết lập để lần sau nạp lại',
     'Không cần công thức | Chọn cặp cột hoặc bấm Gợi ý, công cụ tự ghép – không cần VLOOKUP hay Power Query.
Hiểu cách ghi sổ | Khớp ngày bỏ qua giờ, tiền vào – tiền ra, cảnh báo lệch ngày và tách khoản (VD nộp BHXH).
File lớn vẫn nhanh | 200.000 dòng ghép trong vài giây ngay trên trình duyệt.
Dữ liệu không rời máy | File xử lý trên máy bạn, không tải lên máy chủ.',
     'Bấm "Dùng online", thả 2 file cần đối chiếu (file chính và file đối chiếu) vào khung tải file.
Bước 2: chọn cặp cột ở nhóm Thỏa mãn đồng thời hoặc Thỏa mãn một trong – bấm Gợi ý cặp đối chiếu cho nhanh.
Bước 3: chọn kiểu ghép; muốn so số tiền từng dòng thì chọn Báo cáo tra soát toàn diện, bấm Chạy.
Bước 4: xem, lọc dòng lệch, tải Excel. Bấm Lưu thiết lập để tháng sau dùng lại.',
     'Bản 1.7.8', '2026-10-22', 'Tuấn · Quản trị tử tế', '/tools/ghep-doi-chieu/index.html', '',
     'Đối chiếu sao kê ngân hàng với sổ tiền gửi, TK 112: tiền vào – tiền ra, lệch ngày ghi sổ, tách khoản.
Tìm ngay dòng có ở file này mà file kia không có: đơn chưa ghi sổ, mã khách sai, nhân sự thiếu chấm công.
So số tiền từng dòng, tô vàng ô lệch và tách tổng chênh lệch do dòng lệch hay dòng thiếu.
Xuất Excel đã tô màu theo trạng thái, lưu thiết lập để tháng sau chạy lại.'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'ghep-doi-chieu' OR url = '/tools/ghep-doi-chieu/')`,
];
/* 26/10/2026 – Bộ xử lý hóa đơn điện tử bản 1.7.1: cổng thuế bắt nhập mã xác nhận khi tra HĐ máy tính tiền (tối đa 10 ngày/lần);
   công cụ cho người dùng tự gõ mã. Cập nhật mô tả trên web + đẩy "Phiên bản cập nhật ngày". Dùng replace() theo đúng câu cũ
   (bản v7) → câu anh đã tự sửa trong Quản trị thì giữ nguyên. */
const MIGRATE_TOOLS_V9 = [
  `UPDATE tools SET
    version = CASE WHEN version IN ('', 'Bản 1.5.4', 'Bản 1.6.0', 'Bản 1.7.0') THEN 'Bản 1.7.1' ELSE version END,
    benefits = replace(benefits, 'Tải hàng loạt hóa đơn mua vào, bán ra (cả hóa đơn có mã từ máy tính tiền) trên cổng thuế về một file ZIP gồm XML, bản gốc và bảng kê.',
      'Tải hàng loạt hóa đơn mua vào, bán ra trên cổng thuế về một file ZIP gồm XML, bản gốc và bảng kê; hóa đơn máy tính tiền chỉ cần gõ mã xác nhận của cổng thuế, mỗi 10 ngày 1 mã.'),
    features = replace(features, 'Lọc bán ra / mua vào, hóa đơn điện tử và hóa đơn có mã từ máy tính tiền, trạng thái, kết quả kiểm tra',
      'Lọc bán ra / mua vào, hóa đơn điện tử và hóa đơn có mã từ máy tính tiền, trạng thái, kết quả kiểm tra' || char(10) ||
      'Hóa đơn máy tính tiền: tự chia đoạn 10 ngày, người dùng gõ mã xác nhận do cổng thuế cấp (công cụ không tự đọc mã); đổi mã khác, bỏ qua phần này'),
    guide = replace(guide, 'chọn khoảng ngày, bấm Tìm rồi Tải.',
      'chọn khoảng ngày, bấm Tìm rồi Tải. Có hóa đơn máy tính tiền thì gõ mã xác nhận hiện trên bảng điều khiển cho từng đoạn 10 ngày.' || char(10) ||
      'Khi công cụ có bản mới: vào thẻ Tải hàng loạt, kéo lại nút "Tải HĐ hàng loạt" lên thanh dấu trang (xóa nút cũ); số bản hiện ở góc trên bảng điều khiển.'),
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
   WHERE slug = 'hoa-don-thue' AND url = '/tools/xu-ly-hoa-don/'`,
];
/* 26/10/2026 – Bộ xử lý hóa đơn: anh yêu cầu đưa tóm tắt mục "Hóa đơn máy tính tiền: nhập mã xác nhận" vào Tiện ích nổi bật, chữ đỏ.
   Dòng bắt đầu bằng "!" = cập nhật mới (app.js v1.24). Chỉ thêm 1 lần, không đụng 4 dòng anh đã có. */
const MIGRATE_TOOLS_V10 = [
  `UPDATE tools SET highlights = '!Cập nhật 26/10/2026: hóa đơn máy tính tiền | Cổng thuế yêu cầu mã xác nhận mỗi lần tra, tối đa 10 ngày. Công cụ tự chia đoạn 10 ngày, hiện mã để anh/chị gõ (không tự đọc mã); tải XML không cần mã.' || char(10) || highlights,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
   WHERE slug = 'hoa-don-thue' AND instr(highlights, 'Cập nhật 26/10/2026: hóa đơn máy tính tiền') = 0`,
];
/* 29/10/2026 – Bảng kê & Tờ khai thuế GTGT (thư mục cong-cu/to-khai-gtgt). Công cụ đặt hàng của anh Phương (kế toán), anh Tuấn chốt
   đưa lên web chung 29/10. Chưa có cuốn Coming soon cùng chủ đề trên web (đối chiếu /api/site 29/10) → thêm bản ghi mới slug to-khai-gtgt,
   chỉ thêm khi chưa có cuốn nào trỏ tới /tools/to-khai-gtgt/. Nội dung em soạn từ tính năng thật của bản 29/10/2026, anh duyệt/sửa ở Quản trị. */
const MIGRATE_TOOLS_V11 = [
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits)
   SELECT 'to-khai-gtgt', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'Bảng kê & Tờ khai thuế GTGT từ Excel', 'kt', 'Kế toán – tài chính',
     'Lọc, cộng tay mấy file danh sách hóa đơn chỉ để soát lại tờ khai GTGT',
     'Kế toán, Kế toán trưởng, Kế toán dịch vụ, Kiểm soát nội bộ, chủ doanh nghiệp nhỏ',
     'ok', 0, '/tools/to-khai-gtgt/', 0, '[]', '', (SELECT COALESCE(MAX(sort), 0) + 1 FROM tools), 1,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 0, 'calc', 'Tờ khai GTGT, Bảng kê hóa đơn, Hóa đơn điện tử, Đối chiếu, Excel',
     'Kéo thả nhiều file "Danh sách hóa đơn" xuất từ cổng thuế: bán ra, mua vào, hóa đơn có mã, không mã, máy tính tiền; nạp được file nhiều tháng để khai quý
Tự nhận MST doanh nghiệp, chiều bán ra / mua vào của từng file (chọn lại được), báo loại danh sách còn thiếu; bỏ trùng khi nạp trùng file
Tự loại hóa đơn đã bị thay thế, đã bị hủy; giữ đúng dấu hóa đơn điều chỉnh; ô Tính vào tờ khai, ô Được khấu trừ sửa được từng hóa đơn
Giá trị mua chưa VAT tính vào [23] theo cách MISA: hóa đơn công ty = tổng tiền chưa thuế + tổng tiền phí; hóa đơn hộ kinh doanh (tự nhận mẫu số 2 hoặc hóa đơn không có tiền chưa thuế, tiền thuế; tick lại được) = tổng tiền thanh toán
Danh sách không có thuế suất: công cụ suy từ tỷ lệ thuế / giá trị, tách ước tính hóa đơn nhiều thuế suất (VD 8% + 10%) để xác nhận hoặc sửa tay
Hóa đơn điều chỉnh, thay thế: chọn lý do (thương mại / sửa sai cùng kỳ / sửa sai kỳ trước) để xác định kỳ kê khai theo TT 91/2026, NĐ 252/2026, NĐ 181/2025
Thêm hóa đơn sửa sai lập kỳ sau cho hóa đơn gốc thuộc kỳ đang lập; hóa đơn gốc bị thay thế tự không tính
Bảng kê tổng hợp Excel 4 sheet: Hóa đơn mua vào, Mua vào điều chỉnh – thay thế, Hóa đơn bán ra, Bán ra điều chỉnh – thay thế; tách giá trị, thuế theo từng thuế suất
Tờ khai 01/GTGT theo TT 89/2026 (chọn được mẫu TT 80/2021): Excel gồm tờ khai, bảng kê theo nhóm, phụ lục giảm thuế NQ 204; file XML theo cấu trúc HTKK
Đối chiếu 27 chỉ tiêu với tờ khai lập trên phần mềm kế toán: nạp file XML tờ khai (cấu trúc HTKK) hoặc gõ số, chỉ ra chỉ tiêu lệch và gợi ý nguyên nhân
Lấy [22] và thông tin người nộp thuế từ XML tờ khai kỳ trước; số tự nhập nhớ theo từng kỳ
Tải bản dùng offline: 1 file HTML, mở bằng Chrome / Edge, không cần mạng',
     'Đủ mọi loại danh sách | Kéo thả nhiều file một lúc, tự nhận bán ra / mua vào, hóa đơn có mã, không mã, máy tính tiền, tự bỏ trùng.
Thuế suất tự suy ra | Danh sách cổng thuế không có thuế suất: công cụ suy từ tỷ lệ thuế, tách ước tính hóa đơn vừa 8% vừa 10% để kế toán xác nhận.
Soát lại tờ khai phần mềm | Nạp XML tờ khai (cấu trúc HTKK) hoặc gõ số, so 27 chỉ tiêu, chỉ ra chỉ tiêu lệch và gợi ý nguyên nhân.
Dữ liệu không rời máy | File xử lý trên trình duyệt của bạn, có bản tải về dùng không cần mạng.',
     'Bấm "Dùng online". Trên hoadondientu.gdt.gov.vn → Tra cứu hóa đơn, xuất Excel danh sách bán ra, mua vào (có mã, không mã, máy tính tiền) của kỳ.
Bước 1: kéo thả các file vào công cụ, kiểm tra MST doanh nghiệp và chiều bán ra / mua vào của từng file.
Bước 2: xác nhận thuế suất ước tính (ô viền cam), chọn lý do cho hóa đơn điều chỉnh / thay thế, bỏ tick hóa đơn không tính hoặc không được khấu trừ; tải bảng kê Excel.
Bước 3: chọn kỳ, nhập [22] và các chỉ tiêu tự nhập; tải Excel hoặc XML tờ khai; nạp XML tờ khai từ phần mềm kế toán để đối chiếu.',
     'Bản 1.0.0', '2026-10-29', 'Tuấn · Quản trị tử tế', '/tools/to-khai-gtgt/index.html', '',
     'Gộp các file danh sách hóa đơn tải từ cổng thuế thành 1 bảng kê Excel: mua vào, bán ra, hóa đơn điều chỉnh – thay thế, tách theo thuế suất.
Lập tờ khai 01/GTGT, phụ lục giảm thuế NQ 204 và file XML theo cấu trúc HTKK ngay từ bảng kê.
Đối chiếu từng chỉ tiêu với tờ khai lập trên phần mềm kế toán, biết ngay chỉ tiêu nào lệch, lệch bao nhiêu.
Xác định kỳ kê khai hóa đơn điều chỉnh, thay thế theo TT 91/2026, NĐ 252/2026; tự loại hóa đơn đã bị thay thế, bị hủy.'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'to-khai-gtgt' OR url = '/tools/to-khai-gtgt/')`,
];
/* 29/10/2026 – v1.25 bìa sách gọn: rút ngắn câu "Đang phải" (pain) cho dễ đọc trên bìa (anh yêu cầu).
   Chỉ đổi khi câu hiện tại còn đúng nguyên văn bản cũ (anh đã tự sửa thì giữ nguyên); không đổi updated_at để ngày "Cập nhật" trên bìa không nhảy. */
const MIGRATE_TOOLS_V12 = [
  `UPDATE tools SET pain = 'Cộng tay nhiều file hóa đơn để soát tờ khai GTGT' WHERE slug = 'to-khai-gtgt' AND pain = 'Lọc, cộng tay mấy file danh sách hóa đơn chỉ để soát lại tờ khai GTGT'`,
  `UPDATE tools SET pain = 'Dò cả buổi tìm khoản lệch giữa sao kê và sổ sách' WHERE slug = 'doi-chieu-sao-ke' AND pain = 'Dò cả buổi để tìm khoản lệch vài trăm nghìn giữa sao kê và sổ sách'`,
  `UPDATE tools SET pain = 'Tải từng hóa đơn rồi gõ lại vào Excel, MISA' WHERE slug = 'hoa-don-thue' AND pain = 'Tải từng hóa đơn trên cổng thuế rồi gõ lại vào Excel, tờ khai và MISA'`,
  `UPDATE tools SET pain = 'Sửa tay từng tên, từng số trên hàng chục văn bản' WHERE slug = 'van-ban-hang-loat' AND pain = 'Sửa tay từng tên, từng con số cho hàng chục giấy mời, hợp đồng, phiếu lương'`,
  `UPDATE tools SET pain = 'Lục tìm văn bản còn hiệu lực, điều khoản đã sửa' WHERE slug = 'tra-cuu-van-ban' AND pain = 'Lục tìm xem văn bản nào còn hiệu lực, điều khoản nào đã bị sửa'`,
  `UPDATE tools SET pain = 'Tìm hồ sơ nhân sự nằm rải rác nhiều file' WHERE slug = 'quan-ly-nhan-su' AND pain = 'Đi tìm hồ sơ nhân sự nằm rải rác ở nhiều file'`,
  `UPDATE tools SET pain = 'Lo sót hạng mục, phát sinh chi phí khi mở spa' WHERE slug = 'checklist-setup-spa' AND pain = 'Lo sót hạng mục khi mở spa, phát sinh chi phí không lường trước'`,
  `UPDATE tools SET pain = 'Giải thích lại lương, hoa hồng mỗi kỳ' WHERE slug = 'thu-nhap-tri-lieu-vien' AND pain = 'Giải thích lại cơ chế lương, hoa hồng mỗi kỳ vì dễ gây tranh cãi'`,
  `UPDATE tools SET pain = 'Ước chừng bao lâu thu hồi được vốn' WHERE slug = 'dong-tien-du-an' AND pain = 'Ước chừng xem bao lâu mới thu hồi được vốn'`,
  `UPDATE tools SET pain = 'Nhắc mãi vì ca nào cũng quên vài việc' WHERE slug = 'checklist-van-hanh' AND pain = 'Nhắc đi nhắc lại vì ca nào cũng quên vài việc'`,
  `UPDATE tools SET pain = 'Tự học đọc tiếng Anh mà không có lộ trình' WHERE slug = 'luyen-doc-tieng-anh' AND pain = 'Tự mò cách đọc tiếng Anh đều mỗi ngày mà không có lộ trình'`,
  `UPDATE tools SET pain = 'Việc nhiều, nhớ không hết' WHERE slug = 'tro-ly-ca-nhan' AND pain = 'Việc nhiều, nhớ không hết.'`,
  `UPDATE tools SET pain = 'Đoán mò lãi lỗ dù bán rất nhiều đơn' WHERE slug = 'loi-nhuan-san-tmdt' AND pain = 'Đoán mò lãi lỗ cuối tháng dù bán rất nhiều đơn'`,
];

/* 30/10/2026 – v1.26: Lịch sử cập nhật của Bảng kê & Tờ khai thuế GTGT từ Excel (chỉ điền khi ô còn trống) + góp ý đầu tiên (chị Hằng, "Tick toàn bộ")
   đã xử lý ở bản 1.0.3 – điền sẵn nội dung công khai nhưng KHÔNG bật hiện (pub_show = 0): anh bật ở Quản trị → Góp ý khi chị đồng ý. */
const MIGRATE_TOOLS_V13 = [
  `UPDATE tools SET changelog = '1.0.0 | 29/10/2026 | Ra mắt trên kho công cụ; Gộp các file danh sách hóa đơn tải từ cổng thuế thành bảng kê Excel 4 sheet (mua vào, bán ra, hóa đơn điều chỉnh – thay thế); Lập tờ khai 01/GTGT, phụ lục và file XML theo cấu trúc HTKK; Đối chiếu từng chỉ tiêu với tờ khai lập trên phần mềm kế toán; Xác định kỳ kê khai hóa đơn điều chỉnh, thay thế; Bản tải về dùng không cần mạng
1.0.1 | 29/10/2026 | Giá trị mua chưa VAT [23] lấy theo cách MISA: hóa đơn công ty = tổng tiền chưa thuế + tổng tiền phí, hóa đơn hộ kinh doanh = tổng tiền thanh toán; Tự nhận hóa đơn hộ kinh doanh, tick lại được; Thêm bộ lọc "HĐ hộ kinh doanh"
1.0.2 | 29/10/2026 | Chặn nhập trùng hóa đơn sửa sai nhập tay, báo rõ các dòng nhập tay đã lưu từ lần trước; Thêm nút "Xóa tất cả dòng nhập tay" và "↺ Làm lại từ đầu"
1.0.3 | 29/10/2026 | Ô "Tất cả" ở cột Tính vào TK: tick / bỏ tick cùng lúc các hóa đơn đang lọc, kèm nút "↺ mặc định" để hoàn tác (theo góp ý của người dùng)' WHERE slug = 'to-khai-gtgt' AND changelog = ''`,
  `UPDATE feedback SET status = 'done', pub_name = CASE WHEN pub_name = '' THEN 'Chị Hằng' ELSE pub_name END,
     pub_title = CASE WHEN pub_title = '' THEN 'Thêm ô tick / bỏ tick toàn bộ hóa đơn (sau khi lọc) ở cột Tính vào TK' ELSE pub_title END,
     pub_result = CASE WHEN pub_result = '' THEN 'Đã thêm ở bản 1.0.3 (29/10/2026): ô "Tất cả" ở cột Tính vào TK cho các hóa đơn đang lọc, kèm nút "↺ mặc định" để hoàn tác' ELSE pub_result END
   WHERE tool_slug = 'to-khai-gtgt' AND instr(content, 'Tick toàn bộ') > 0`,
];

/* 31/10/2026 – Góc cảm ơn trích nguyên văn feedback: điền sẵn ô "Trích nguyên văn" cho góp ý của chị Hằng (đã hiện công khai) từ nội dung gốc,
   chỉ khi ô còn trống. Anh kiểm tra lại ở Quản trị → Góp ý (bỏ thông tin riêng nếu có). */
/* 31/10/2026 – Góc cảm ơn: đề xuất "HĐ bị thay thế/điều chỉnh bởi HĐ nào" (Bảng ghim, Bộ công cụ hóa đơn thuế) đã xử lý ở bản 1.8.1 –
   viết lại Đề xuất + Kết quả cho dễ hiểu (anh yêu cầu), trạng thái Góc cảm ơn = Đã xử lý; góp ý chị Hằng cũng gắn Đã xử lý */
const MIGRATE_TOOLS_V15 = [
  `UPDATE requests SET pub_status = 'done',
     pub_title = 'Ghi rõ hóa đơn bị thay thế / bị điều chỉnh bởi hóa đơn số mấy, ngày nào – không phải mở từng hóa đơn',
     pub_result = 'Đã thêm ở bản 1.8.1 (31/10/2026): file Bảng kê ghi rõ hóa đơn thay thế / điều chỉnh cho hóa đơn số mấy, ngày nào; hóa đơn gốc ghi "bị thay thế / bị điều chỉnh bởi" hóa đơn nào. Ở thẻ XML → Excel có thêm ô lọc nhanh các hóa đơn này'
   WHERE tool_ref = 'hoa-don-thue' AND instr(pain, 'thay thay thế') > 0`,
  `UPDATE feedback SET pub_status = 'done' WHERE pub_status = '' AND status = 'done' AND pub_title <> ''`,
];
/* 02/11/2026 – Công cụ mới "In hóa đơn PDF hàng loạt theo danh sách" (từ đề xuất Bảng ghim 02/11 của chị Thủy - HRM; anh chốt làm công cụ riêng,
   đưa lên kho công cụ, gắn Nổi bật). Bản ghi mới slug in-hoa-don-pdf (thư mục cong-cu/in-hoa-don-pdf), xếp đầu kho (sort nhỏ nhất).
   Tờ note đề xuất gốc: gắn slug công cụ, chuyển "Mới phát hành", bỏ tool_ref hoa-don-thue (Đốm AI gợi ý thêm tính năng – nay là công cụ riêng). */
const MIGRATE_TOOLS_V16 = [
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits, changelog)
   SELECT 'in-hoa-don-pdf', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'In hóa đơn PDF hàng loạt theo danh sách', 'kt', 'Kế toán – tài chính',
     'In nghìn hóa đơn PDF bị lẫn thứ tự, sót tờ',
     'Kế toán, Kế toán trưởng, Kế toán dịch vụ, Hành chính – Nhân sự, Kiểm toán nội bộ',
     'ok', 0, '/tools/in-hoa-don-pdf/', 0, '[]', '', (SELECT COALESCE(MIN(sort), 10) - 5 FROM tools), 1,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 1, 'printer', 'In hóa đơn, Hóa đơn PDF, Ghép PDF, Đối chiếu, Lưu trữ chứng từ',
     'Nạp nhiều file PDF, cả thư mục (kéo thả hoặc nút chọn) hoặc file ZIP chứa PDF; nạp nhiều lần, tự bỏ file trùng
Đọc danh sách Excel (.xlsx) hoặc CSV: tự tìm dòng tiêu đề và cột số hóa đơn, ký hiệu, MST người bán, ngày, tên; chọn lại được trang tính, dòng tiêu đề, từng cột
Khớp theo tên file (ký hiệu + số hóa đơn, MST); tên file không đủ thông tin thì đọc chữ trong file PDF (ký hiệu, số, MST) để khớp
Phân biệt hóa đơn cùng số của nhiều người bán; bản sao "(1)", "Copy" xếp sau bản gốc; dòng lặp lại trong danh sách không in lại
Báo hóa đơn thiếu file, file không có trong danh sách, file trùng, file lỗi, bản scan không có chữ; gán tay file cho dòng thiếu, bỏ khớp
Excel đối chiếu: kết quả từng dòng danh sách kèm lô in, trang trong lô; sheet riêng các file không khớp
Ghép thành lô 50 / 100 / 200 / 500 hóa đơn hoặc 1 file, đúng thứ tự danh sách; số thứ tự ở góc trên phải mỗi trang (0001/2000 · ký hiệu-số)
Tùy chọn in 2 mặt (mỗi hóa đơn bắt đầu tờ mới), chèn trang "Thiếu hóa đơn" đúng vị trí, trang đầu mỗi lô
Mở từng lô để in, tải từng lô, lưu tất cả vào một thư mục (Chrome / Edge) hoặc tải ZIP
Không có danh sách: xếp theo tên file (số tự nhiên: 2 trước 10)
Thử với dữ liệu mẫu; tải bản dùng offline: 1 file HTML, mở bằng Chrome / Edge, không cần mạng',
     'Đúng thứ tự danh sách | Xếp hàng nghìn file PDF theo đúng thứ tự dòng của bảng kê Excel, ghép thành từng lô để in một lệnh.
Tên file lộn xộn vẫn khớp | Tên file không có số hóa đơn thì công cụ đọc ký hiệu, số, MST trong file; hóa đơn cùng số của nhiều người bán không bị nhầm.
Biết ngay thiếu, thừa, trùng | Báo hóa đơn chưa có file, file ngoài danh sách, file tải 2 lần; xuất Excel đối chiếu để lưu hồ sơ.
Rơi giấy vẫn xếp lại được | Số thứ tự in nhỏ ở góc mỗi trang; có tùy chọn in 2 mặt, trang báo thiếu hóa đơn đúng vị trí.',
     'Bấm "Dùng online", công cụ mở ngay trên trình duyệt (Chrome / Edge). File xử lý trên máy bạn, không gửi đi đâu.
Bước 1: chọn các file PDF hóa đơn, cả thư mục hoặc file ZIP.
Bước 2: chọn file danh sách Excel (sắp sẵn theo thứ tự muốn in), kiểm tra cột số hóa đơn, ký hiệu, MST người bán.
Bước 3: bấm Khớp, xem các nhóm Thiếu file, File chưa khớp, File trùng; gán tay nếu cần, tải Excel đối chiếu.
Bước 4: chọn số hóa đơn mỗi lô, bấm Ghép file; mở từng lô và in, in xong lô này mới in lô sau.',
     'Bản 1.0.0', '2026-11-02', 'Tuấn · Quản trị tử tế', '/tools/in-hoa-don-pdf/index.html', '',
     'Xếp hàng nghìn file hóa đơn PDF theo đúng thứ tự danh sách Excel đang có, không phải xếp giấy bằng tay.
Đối chiếu danh sách với file: biết hóa đơn nào thiếu file, file nào thừa, file nào tải trùng.
Ghép thành từng lô PDF có số thứ tự ở góc trang, in một lệnh mỗi lô, không lẫn, không sót.
Lưu Excel đối chiếu kèm số lô, số trang để lưu hồ sơ chứng từ.',
     '1.0.0 | 02/11/2026 | Ra mắt trên kho công cụ; Xếp file hóa đơn PDF theo thứ tự danh sách Excel, khớp theo tên file hoặc đọc chữ trong file; Báo hóa đơn thiếu file, file thừa, file trùng, xuất Excel đối chiếu; Ghép lô có số thứ tự góc trang, in 2 mặt, trang báo thiếu hóa đơn'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'in-hoa-don-pdf' OR url = '/tools/in-hoa-don-pdf/')`,
  `UPDATE requests SET tool_slug = 'in-hoa-don-pdf', tool_ref = '', status = 'done', updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE tool_slug = '' AND created_at >= 1793552400000 AND instr(pain, '2000') > 0 AND instr(pain, 'theo danh s') > 0 AND instr(pain, 'pdf') + instr(pain, 'PDF') > 0`,
];
/* 02/11/2026 – Công cụ mới "Tải tờ khai thuế đã nộp hàng loạt" (nhu cầu do KTT – vợ anh đề xuất). Bản ghi mới slug tai-to-khai (thư mục cong-cu/tai-to-khai),
   xếp đầu kho, ĐANG ẨN (visible = 0) – 03/11 anh bật Hiển thị + bấm "Báo người đăng ký" ở Quản trị → Công cụ. Chưa gắn Nổi bật (anh bấm ★ nếu muốn). */
const MIGRATE_TOOLS_V17 = [
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits, changelog)
   SELECT 'tai-to-khai', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), 'Tải tờ khai thuế đã nộp hàng loạt', 'kt', 'Kế toán – tài chính',
     'Tải từng tờ khai, mỗi lần chỉ 30 ngày',
     'Kế toán, Kế toán trưởng, Kế toán dịch vụ, Chủ doanh nghiệp nhỏ',
     'ok', 0, '/tools/tai-to-khai/', 0, '[]', '', (SELECT COALESCE(MIN(sort), 10) - 5 FROM tools), 0,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 0, 'download', 'Tờ khai thuế, Dịch vụ công thuế, Tải hàng loạt, Thông báo thuế, Kế toán thuế',
     'Chạy ngay trên trang dichvucong.gdt.gov.vn bằng nút trên thanh dấu trang, dùng phiên đăng nhập sẵn có; không hỏi, không lưu mật khẩu
Chọn khoảng ngày nộp dài: tháng, quý, cả năm, nhiều năm (nút nhanh Tháng trước, Quý trước, Năm nay, Năm trước); lọc theo loại tờ khai
Tự chia lượt đúng giới hạn của trang dịch vụ công: hồ sơ từ 01/07/2025 mỗi tháng 1 lượt (tab DVC), hồ sơ trước 01/07/2025 mỗi 12 tháng 1 lượt (tab Thuế điện tử)
Mỗi lượt gõ 1 mã xác nhận ngay trên bảng điều khiển; công cụ không tự đọc mã, không dùng lại mã
Tra lượt nào tải luôn lượt đó, đọc trang nào tải trang đó (đúng cách trang dịch vụ công cho phép); khi cần gõ mã có chuông, nhấp nháy tên tab và thông báo trên màn hình
Tải tờ khai XML, file đính kèm và thông báo của cơ quan thuế (tiếp nhận, chấp nhận…); chế độ Tải nhanh chỉ lấy tờ khai
Gom các lần nộp theo tờ khai + kỳ tính thuế, đánh dấu lần hiệu lực cuối, gạch hồ sơ hủy / không chấp nhận; tùy chọn chỉ giữ lần hiệu lực cuối trong file ZIP
1 file ZIP: thư mục theo loại tờ khai, tên file ghi kỳ, lần nộp, chính thức / bổ sung, ngày nộp; Bảng kê Excel 2 sheet (danh sách hồ sơ, gom theo tờ khai & kỳ)
Hết phiên đăng nhập hoặc dừng giữa chừng: tự lưu phần đã tải, lần sau điền sẵn khoảng ngày còn lại để tải tiếp',
     'Cả năm trong một lần | Chọn cả năm hoặc nhiều năm; công cụ tự chia lượt đúng giới hạn 30 ngày của trang dịch vụ công và tải lần lượt.
Ít mã xác nhận nhất | Hồ sơ trước 01/07/2025: 12 tháng chỉ 1 mã. Đến lượt gõ mã có chuông gọi, không phải ngồi canh.
Biết ngay lần nộp nào có hiệu lực | Gom các lần nộp chính thức, bổ sung của cùng tờ khai, cùng kỳ; đánh dấu lần hiệu lực cuối.
Đủ hồ sơ trong 1 file ZIP | Tờ khai, phụ lục, thông báo của cơ quan thuế xếp theo từng loại, kèm Bảng kê Excel.',
     'Bấm "Dùng online", kéo nút "Tải tờ khai" lên thanh dấu trang của Chrome / Edge (làm 1 lần).
Bước 1: đăng nhập dichvucong.gdt.gov.vn như thường ngày, bấm nút "Tải tờ khai" trên thanh dấu trang.
Bước 2: chọn khoảng ngày nộp (tháng, quý, cả năm), chế độ Đầy đủ hoặc Tải nhanh, bấm Tra cứu & tải.
Bước 3: gõ mã xác nhận cho từng lượt; công cụ tải xong lượt này mới hỏi mã lượt sau.
Bước 4: nhận 1 file ZIP gồm tờ khai, thông báo và Bảng kê Excel.',
     'Bản 1.0.0', '2026-11-03', 'Tuấn · Quản trị tử tế', '', '',
     'Tải hàng loạt tờ khai đã nộp trên trang dịch vụ công, cả năm trong một lần, không phải bấm từng tờ.
Tự chia lượt theo giới hạn của trang dịch vụ công, mỗi lượt chỉ gõ 1 mã xác nhận, có chuông gọi khi đến lượt.
Gom các lần nộp chính thức, bổ sung theo tờ khai và kỳ, đánh dấu lần hiệu lực cuối.
Lưu tờ khai, phụ lục, thông báo của cơ quan thuế và Bảng kê Excel trong 1 file ZIP.',
     '1.0.0 | 03/11/2026 | Ra mắt trên kho công cụ; Tải hàng loạt tờ khai, phụ lục, thông báo của cơ quan thuế trên trang dịch vụ công; Hồ sơ trước 01/07/2025 mỗi 12 tháng chỉ 1 mã xác nhận; Gom các lần nộp, đánh dấu lần hiệu lực cuối, Bảng kê Excel'
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'tai-to-khai' OR url = '/tools/tai-to-khai/')`,
];
/* 02/11/2026 tối – tách riêng: v17 đã chạy trên web trước khi thêm tờ ghim nên câu này không chạy được trong v17 */
const MIGRATE_BOARD_V1 = [
  /* Tờ ghim cột "Đang hoàn thiện" trên Bảng ghim (công cụ đang ẩn nên dùng tờ đề xuất), dự kiến phát hành 03/11/2026.
     03/11 anh vào Quản trị → Đề xuất, chuyển tờ này sang "Mới phát hành" – tờ tự nhường chỗ cho tờ công cụ ở cột Mới phát hành */
  `INSERT INTO requests (pain, role, contact, status, votes, tool_slug, admin_note, ip_hash, created_at, updated_at, on_board, board_title, board_desc, board_note, eta)
   SELECT 'Tải hàng loạt tờ khai thuế các năm trước đã nộp trên trang dịch vụ công: mỗi lần chỉ tra được 30 ngày, lần nào cũng gõ mã xác nhận, không có nút tải hàng loạt, nộp nhiều lần phải tự đối chiếu',
     'Kế toán trưởng', '', 'building', 1, 'tai-to-khai', 'Tờ ghim tạo sẵn 02/11/2026 cho công cụ Tải tờ khai thuế đã nộp hàng loạt (nhu cầu do KTT đề xuất). 03/11: chuyển trạng thái sang Mới phát hành.', '',
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000, 1,
     'Tải tờ khai thuế đã nộp hàng loạt', 'Tải cả năm tờ khai, phụ lục, thông báo của cơ quan thuế trên trang dịch vụ công trong một lần, có Bảng kê Excel',
     'Đốm đang hoàn tất những bước cuối', '2026-11-03'
   WHERE NOT EXISTS (SELECT 1 FROM requests WHERE tool_slug = 'tai-to-khai' AND on_board = 1)`,
];
/* 03/11/2026 – In hóa đơn PDF 1.1.0: giao diện mới (trang chủ + tiến độ 4 bước, xem trước lô) – nâng bản + thêm dòng Lịch sử cập nhật (chỉ chạy 1 lần, không đè nếu anh đã tự thêm) */
const MIGRATE_TOOLS_V18 = [
  `UPDATE tools SET version = 'Bản 1.1.0',
     changelog = '1.1.0 | 03/11/2026 | Giao diện mới: trang đầu có ô tải file, các bước theo thanh tiến độ ngang (Tải file → Khớp & kiểm tra → Ghép file để in → In & tải về); Thả cùng lúc file PDF và file danh sách ở trang đầu; Xem trước các trang của lô ngay trên màn hình trước khi in' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'in-hoa-don-pdf' AND instr(changelog, '1.1.0 |') = 0`,
];
/* 03/11/2026 – In hóa đơn PDF 1.2.0: góp ý người dùng – đổi tên file theo cú pháp + tải file nén; nhiều trang tính; sửa chọn thư mục (chỉ chạy 1 lần, không đè nếu đã có dòng 1.2.0) */
const MIGRATE_TOOLS_V19 = [
  `UPDATE tools SET version = 'Bản 1.2.0',
     changelog = '1.2.0 | 03/11/2026 | Mới: Lưu file mềm – đổi tên hàng loạt file PDF theo cú pháp STT_YYMM_Ký hiệu mẫu số_Ký hiệu hóa đơn_MST người bán_Số hóa đơn_Tên công ty (kéo thả đổi thứ tự, bỏ dấu tiếng Việt, bỏ dấu cách), lưu vào một thư mục hoặc tải 1 file nén kèm Excel đối chiếu; Danh sách Excel nhiều trang tính: tick chọn trang dùng để in, chọn/bỏ chọn tất cả, kéo thả sắp thứ tự trang; Chọn cả thư mục: tự sang bước tiếp theo và tự nhận file Excel danh sách trong thư mục' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'in-hoa-don-pdf' AND instr(changelog, '1.2.0 |') = 0`,
];
/* 03/11/2026 – In hóa đơn PDF 1.2.1: góp ý người dùng (tờ khai nhập khẩu làm lệch STT; file trùng/mật khẩu không đổi tên) + kéo thả + cú pháp mặc định mới (chỉ chạy 1 lần) */
const MIGRATE_TOOLS_V20 = [
  `UPDATE tools SET version = 'Bản 1.2.1',
     changelog = '1.2.1 | 03/11/2026 | Sửa lệch số thứ tự khi danh sách có tờ khai hải quan nhập khẩu (không có số hóa đơn, MST): dòng tờ khai giữ đúng STT và khớp được file PDF tờ khai theo số tờ khai; Lưu file mềm tải kèm file trùng, file có mật khẩu, file không có trong danh sách với chữ đầu tên Trùng_, Mật khẩu_, Không trong DS_ để biết ngay là file nào; Cú pháp tên mặc định mới STT_YYMM_Ký hiệu mẫu số_Ký hiệu hóa đơn_MST người bán_Số hóa đơn_Tên công ty; Giữ và kéo thả để đổi thứ tự các phần trong tên file và thứ tự trang tính' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'in-hoa-don-pdf' AND instr(changelog, '1.2.1 |') = 0`,
];
/* 03/11/2026 tối: Tải tờ khai 1.1.0 – thêm trang thuế điện tử (góp ý: năm 2021–2023 báo lỗi) */
const MIGRATE_TOOLS_V21 = [
  `UPDATE tools SET version = 'Bản 1.1.0',
     changelog = '1.1.0 | 03/11/2026 | Sửa lỗi không tải được tờ khai các năm cũ (2021–2023…): hồ sơ nộp trước 01/07/2025 nay tải trên trang thuế điện tử thuedientu.gdt.gov.vn – cùng 1 nút, tự nhận trang; Trang thuế điện tử: tra nhiều năm trong 1 lần, không cần mã xác nhận, chỉ chọn chỗ lưu 1 lần cho cả file ZIP; Quy tắc Nộp ở đâu – tải ở đó: trước 01/07/2025 tải trên thuế điện tử, 07–12/2025 chạy ở cả 2 trang, từ 2026 chủ yếu trang dịch vụ công; Trang dịch vụ công báo rõ khi chọn khoảng ngày trước 01/07/2025 thay vì báo lỗi' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'tai-to-khai' AND instr(changelog, '1.1.0 |') = 0`,
];
/* 04/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT 1.0.5: đưa lên web ở chế độ ẨN (visible=0) để anh test; anh tự bật Hiển thị trong Quản trị (chỉ chạy 1 lần) */
const T22_FEAT = `Đọc thẳng file xuất từ TikTok Shop Seller Center: Đơn hàng (OrderSKUList) và Income (Chi tiết đơn hàng, Báo cáo, Lịch sử rút tiền); nạp nhiều file nhiều tháng cùng lúc, tự bỏ dòng trùng
Đối chiếu từng đơn với tiền sàn quyết toán: đơn đã về tiền, đơn giao rồi chưa về tiền, đơn hủy / trả vẫn bị trừ phí, đơn có tiền mà không có trong file đơn hàng
Bảng đơn giao theo ngày: đơn nào đã giao thành công trong ngày để lập hóa đơn, kèm doanh thu theo giá bán và sau giảm giá của shop
Cảnh báo đơn trả hàng / hoàn tiền sau khi đã giao (cần lập hóa đơn điều chỉnh), đánh dấu đã xử lý từng đơn
Dòng tiền ví: tiền quyết toán theo ngày khớp tiền vào ví (Earnings), các lần rút về ngân hàng, số dư đầu kỳ / cuối kỳ
Báo cáo lợi nhuận theo đơn, sản phẩm, ngày, tháng: doanh thu, giá vốn, phí sàn (giao dịch, hoa hồng, liên kết, voucher, vận chuyển…), phí đơn hủy / trả; tỷ lệ % trên doanh thu
Giá vốn nhập tay hoặc nạp file Excel; SKU combo khai thành phần (VD 2 hộp trà + 1 bình) để tự tính giá vốn; nhắc SKU thiếu giá vốn
Biểu đồ Tổng quan theo ngày / tháng, chọn 1 hoặc nhiều chỉ tiêu; Dashboard lợi nhuận một màn hình khi đã đủ giá vốn
Xuất Excel nhiều sheet; xuất Báo cáo HTML gửi sếp (mở bằng trình duyệt, chỉ xem); chạy hoàn toàn trên máy, không tải dữ liệu lên mạng`;
const T22_HL = `Biết đơn nào đã về tiền | Khớp từng đơn hàng với tiền sàn quyết toán, chỉ ra đơn giao rồi chưa về tiền và đơn hủy / trả vẫn bị trừ phí.
Không sót hóa đơn điều chỉnh | Liệt kê đơn trả hàng sau khi đã giao để lập hóa đơn điều chỉnh, đánh dấu đơn đã xử lý.
Lãi thật sau mọi loại phí | Doanh thu trừ giá vốn, phí sàn, phí hủy / trả; xem theo đơn, sản phẩm, ngày, tháng, kèm % trên doanh thu.
Báo cáo gửi sếp trong 1 nút | Dashboard lợi nhuận, file Excel nhiều sheet và báo cáo HTML mở được trên mọi máy.`;
const T22_GUIDE = `Bước 1: trên TikTok Shop Seller Center, xuất file Đơn hàng và file Income (thu nhập) cho cùng khoảng thời gian.
Bước 2: bấm "Thêm file", chọn cả 2 file (nhiều tháng cũng được); công cụ tự nhận loại file.
Bước 3: xem Tổng quan, Đối soát đơn – tiền, Đơn giao theo ngày, Đơn trả cần điều chỉnh HĐ, Dòng tiền ví.
Bước 4: thẻ Giá vốn – nhập giá vốn từng SKU hoặc nạp file Excel giá vốn; SKU combo khai thành phần.
Bước 5: thẻ Lợi nhuận – xem báo cáo, mở Dashboard, xuất Excel hoặc Báo cáo HTML gửi sếp.`;
const T22_CL = '1.0.5 | 04/11/2026 | Bản đầu tiên: đối chiếu đơn hàng TikTok Shop với tiền quyết toán; bảng đơn giao theo ngày để lập hóa đơn; cảnh báo đơn trả cần hóa đơn điều chỉnh; dòng tiền ví; báo cáo lợi nhuận có giá vốn (kể cả SKU combo), phí sàn, phí hủy / trả; biểu đồ chọn chỉ tiêu; Dashboard lợi nhuận; xuất Excel và Báo cáo HTML';
const T22_SET = {
  name: 'Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT', sub: 'Kế toán – tài chính',
  pain: 'Bán nhiều đơn mà không biết lãi lỗ thật', who: 'Chủ shop online, Kế toán bán hàng sàn TMĐT, Kế toán dịch vụ',
  tags: 'Sàn TMĐT, TikTok Shop, Đối soát, Lợi nhuận, Hóa đơn điều chỉnh, Giá vốn',
  benefits: 'Đối chiếu từng đơn với tiền sàn trả về ví, nhắc đơn trả cần hóa đơn điều chỉnh và tính lãi thật sau giá vốn, phí sàn – từ chính file xuất của TikTok Shop, chạy trên máy, không gửi dữ liệu đi đâu.',
};
const q22 = s => "'" + String(s).replace(/'/g, "''") + "'";
const MIGRATE_TOOLS_V22 = [
  `UPDATE tools SET name = ${q22(T22_SET.name)}, sub = ${q22(T22_SET.sub)}, pain = ${q22(T22_SET.pain)}, who = ${q22(T22_SET.who)},
     status = 'ok', url = '/tools/loi-nhuan-san-tmdt/', download_url = '/tools/loi-nhuan-san-tmdt/index.html', visible = 0,
     pricing = 'free', icon = CASE WHEN icon = '' THEN 'chart' ELSE icon END, tags = ${q22(T22_SET.tags)}, benefits = ${q22(T22_SET.benefits)},
     features = ${q22(T22_FEAT)}, highlights = ${q22(T22_HL)}, guide = ${q22(T22_GUIDE)},
     version = 'Bản 1.0.5', released = '2026-11-04', author = 'Tuấn · Quản trị tử tế', changelog = ${q22(T22_CL)},
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND url = ''`,
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits, changelog)
   SELECT 'loi-nhuan-san-tmdt', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), ${q22(T22_SET.name)}, 'kt', ${q22(T22_SET.sub)},
     ${q22(T22_SET.pain)}, ${q22(T22_SET.who)}, 'ok', 0, '/tools/loi-nhuan-san-tmdt/', 0, '[]', '', 130, 0,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 0, 'chart', ${q22(T22_SET.tags)}, ${q22(T22_FEAT)}, ${q22(T22_HL)}, ${q22(T22_GUIDE)},
     'Bản 1.0.5', '2026-11-04', 'Tuấn · Quản trị tử tế', '/tools/loi-nhuan-san-tmdt/index.html', '', ${q22(T22_SET.benefits)}, ${q22(T22_CL)}
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'loi-nhuan-san-tmdt')`,
];
/* 06/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT 1.1.0: ghi lịch sử cập nhật (giữ nguyên tên, trạng thái hiển thị anh đã đặt) */
const MIGRATE_TOOLS_V23 = [
  `UPDATE tools SET version = 'Bản 1.1.0',
     changelog = '1.1.0 | 06/11/2026 | Theo góp ý chị kế toán dùng thử: thẻ mới Hàng về kho – theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu, mã vận đơn, ô nhập ngày hàng về kho và ghi chú; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách ở Đối chiếu đơn hàng, thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số; Kỳ chọn ở một thẻ áp dụng cho mọi thẻ (kể cả Giao theo ngày); số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; sửa lỗi Tổng quan không hiện trong Báo cáo HTML gửi sếp' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(changelog, '1.1.0 |') = 0`,
];
/* 06/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT: viết lại dòng 1.1.0 của Lịch sử cập nhật cho gọn (8 ý = 8 dòng trong thư Báo cập nhật), đổi nhãn Beta 05.11 → Beta 06.11 (chỉ chạy 1 lần; anh đã sửa tay thì không đụng) */
const MIGRATE_TOOLS_V24 = [
  `UPDATE tools SET changelog = replace(changelog, '1.1.0 | 06/11/2026 | Theo góp ý chị kế toán dùng thử: thẻ mới Hàng về kho – theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu, mã vận đơn, ô nhập ngày hàng về kho và ghi chú; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách ở Đối chiếu đơn hàng, thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số; Kỳ chọn ở một thẻ áp dụng cho mọi thẻ (kể cả Giao theo ngày); số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; sửa lỗi Tổng quan không hiện trong Báo cáo HTML gửi sếp', '1.1.0 | 06/11/2026 | Thẻ mới Hàng về kho: theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu và mã vận đơn; Ghi ngày hàng về kho và ghi chú cho từng đơn, xuất được ra Excel; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách đơn; Đối chiếu đơn hàng: thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); Thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số các đơn này; Chọn kỳ ở một thẻ thì mọi thẻ cùng theo kỳ đó; Số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; Sửa lỗi phần Tổng quan không hiện trong Báo cáo HTML gửi sếp'), updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(changelog, '1.1.0 | 06/11/2026 | Theo góp ý chị kế toán dùng thử: thẻ mới Hàng về kho – theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu, mã vận đơn, ô nhập ngày hàng về kho và ghi chú; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách ở Đối chiếu đơn hàng, thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số; Kỳ chọn ở một thẻ áp dụng cho mọi thẻ (kể cả Giao theo ngày); số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; sửa lỗi Tổng quan không hiện trong Báo cáo HTML gửi sếp') > 0`,
  `UPDATE tools SET name = replace(name, 'Beta 05.11', 'Beta 06.11'), updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(name, 'Beta 05.11') > 0`,
];
/* 07/11/2026 – Phần mềm quản lý nhân sự: đưa lên Bộ công cụ (Active, Nổi bật, đứng đầu) với ghi chú ĐANG XÂY DỰNG; nút dẫn ra trang Lịch sử phiên bản /quan-ly-nhan-su/.
   Chỉ chạy khi bản ghi còn chưa có link (url = ''); ô nào anh đã tự nhập thì giữ nguyên. */
const MIGRATE_TOOLS_V25 = [
  `UPDATE tools SET status = 'ok', featured = 1, sort = 5, visible = 1, url = '/quan-ly-nhan-su/',
     version = 'Bản 0.2.1', released = CASE WHEN released = '' THEN '2026-11-06' ELSE released END,
     who = CASE WHEN who IN ('', 'Hành chính – nhân sự') THEN 'Hành chính – Nhân sự, C&B, Chủ doanh nghiệp nhỏ' ELSE who END,
     benefits = CASE WHEN benefits = '' THEN replace('Nắm nhanh tình hình nhân sự và việc cần xử lý trên một bảng điều hành\nTheo dõi hồ sơ, giấy tờ còn thiếu của từng người\nLập hợp đồng lao động có kiểm tra thời gian, lương thử việc theo Bộ luật Lao động 2019\nSoạn mẫu hợp đồng như Word, xuất file điền sẵn cho từng người', '\n', char(10)) ELSE benefits END,
     highlights = CASE WHEN highlights = '' THEN replace('Bảng điều hành | Đội ngũ, sự kiện sắp tới, quỹ lương và việc cần xử lý theo hạn\nHồ sơ nhân sự | Mỗi người một bảng giấy tờ, kho lưu bản scan, nhắc phần còn thiếu\nHợp đồng lao động | Nhắc người cần ký, kiểm tra thử việc và số lần ký theo Bộ luật Lao động 2019\nKho hợp đồng mẫu | Soạn như Word, kéo thả trường thông tin, xuất file Word điền sẵn', '\n', char(10)) ELSE highlights END,
     changelog = CASE WHEN changelog = '' THEN replace('0.2.1 | 07/11/2026 | Module Nhân sự: Sơ đồ tổ chức tự vẽ từ danh mục phòng ban, thêm sửa chuyển phòng ban ngay trên sơ đồ; Danh sách nhân sự: lọc nhanh có số đếm, chọn cột hiển thị, xuất Excel, thêm sửa người có kiểm tra dữ liệu; Hồ sơ nhân sự: bảng giấy tờ từng người, kho lưu bản scan xem phóng to; Hợp đồng: danh sách người cần ký, lập hợp đồng có kiểm tra theo Bộ luật Lao động 2019; Kho hợp đồng mẫu soạn như Word, ghép trường bằng kéo thả hoặc gõ /, xuất file Word điền sẵn; Việc cần xử lý lọc theo hạn (Quá hạn, Trong 07 / 14 / 30 ngày, Sau 30 ngày), gộp giấy tờ còn thiếu thành một việc\n0.1.1 | 06/11/2026 | Bản mở đầu – module Tổng quan: Bảng điều hành (đội ngũ, sự kiện sắp tới, quỹ lương, lịch đi làm); Việc cần xử lý: tự đối chiếu hồ sơ, hợp đồng, chấm công, nghỉ phép, bảng lương để nhắc việc dễ sót; Việc định kỳ hằng tháng tự nhắc khi sắp đến hạn; Xem nhiều công ty hoặc gộp dữ liệu các công ty', '\n', char(10)) ELSE changelog END,
     notice = CASE WHEN notice = '' THEN replace('ĐANG XÂY DỰNG\nTheo dõi hành trình và trải nghiệm các tính năng đã hoàn thành: mỗi bản có link dùng thử ngay trên trình duyệt với dữ liệu mẫu.', '\n', char(10)) ELSE notice END,
     cta_label = CASE WHEN cta_label = '' THEN 'Theo dõi hành trình & trải nghiệm ↗' ELSE cta_label END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND url = ''`,
];
/* 08/11/2026: Phần mềm nhân sự lên bản 0.3.1 (module Chấm công) – đổi bản, thêm 1 dòng đầu nhật ký, bổ sung điểm nổi bật; giữ notice ĐANG XÂY DỰNG */
const MIGRATE_TOOLS_V26 = [
  `UPDATE tools SET version = 'Bản 0.3.1',
     changelog = replace('0.3.1 | 08/11/2026 | Module Chấm công: Thiết lập chấm công (nhiều ca, thứ Bảy cách tuần, tăng ca tự tính hoặc chờ xác nhận, mức trả 150/200/300%, lịch lễ tết có âm lịch và nghỉ bù); Tổng hợp công tự tính từ giờ chấm, đơn nghỉ, lịch lễ, sửa tay có nhật ký, chốt công tháng; Nghỉ phép: duyệt đơn, quỹ phép năm tự tính theo thâm niên; Chấm công Wi‑Fi trên điện thoại miễn phí, dự phòng bằng mã QR, nhân viên xem và xác nhận công, gửi đơn nghỉ; bản chạy thử chamcong-thu.quantritute.com', '\n', char(10)) || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     highlights = CASE WHEN instr(highlights, 'Chấm công Wi‑Fi |') = 0 THEN 'Chấm công Wi‑Fi | Bấm Vào ca / Ra ca trên điện thoại khi bắt Wi‑Fi văn phòng, không cần mua máy chấm công' || char(10) || 'Tổng hợp công | Tự tính công, tăng ca, nghỉ phép theo thiết lập của từng công ty' || CASE WHEN highlights = '' THEN '' ELSE char(10) || highlights END ELSE highlights END,
     benefits = CASE WHEN instr(benefits, 'máy chấm công') = 0 THEN benefits || CASE WHEN benefits = '' THEN '' ELSE char(10) END || 'Chấm công bằng điện thoại qua Wi‑Fi văn phòng, không cần mua máy chấm công' || char(10) || 'Bảng công tự tính và chốt tháng, nhân viên tự xem và xác nhận công trên điện thoại' ELSE benefits END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.3.1 |') = 0`,
];
/* 09/11/2026 – Bộ công cụ hóa đơn thuế 1.9.0 (góp ý Bảng ghim 09/11 "tải nhiều tháng không cần nhập captcha" + góp ý 07/11 "nhập 1–2 mã thì báo hết phiên").
   Kiểm tra cổng thật cùng anh 09/11: HĐ máy tính tiền tra được 1 tháng/lần (trước 10 ngày), vẫn cần mã mỗi lần tra và mỗi lần sang trang.
   Cập nhật bản, lịch sử, các dòng mô tả còn ghi "10 ngày" (replace: dòng anh đã sửa tay thì không đổi), Kết quả tờ note đề xuất (chỉ khi còn trống). */
/* 10/11/2026 – Phần mềm quản lý nhân sự bản 0.4.1 (Module Lương), anh duyệt xuất bản 16:10. Chỉ chạy khi lịch sử chưa có dòng 0.4.1. */
const MIGRATE_TOOLS_V28 = [
  `UPDATE tools SET version = 'Bản 0.4.1',
     changelog = '0.4.1 | 10/11/2026 | Module Lương: Cơ cấu nhân sự (chế độ từng người mỗi tháng, quỹ lương dự kiến, duyệt trước hạn); Bảng lương tự tính từ cơ cấu đã duyệt và bảng công đã chốt (ngày công, tăng ca, lương hiệu suất, trợ cấp, BHXH, thuế TNCN), nhập KPI thưởng tạm ứng từ Excel, chốt, xuất Excel, in có chữ ký; Phiếu lương in PDF hoặc gửi lên điện thoại, nhân viên hỏi lại từng dòng; Bảng chi lương tiền mặt ký nhận và bảng đổ lương ngân hàng; Thiết lập tính lương sửa được theo quy định mới, văn bản căn cứ, kho quy chế mẫu' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     highlights = CASE WHEN instr(highlights, 'Bảng lương |') = 0 THEN 'Bảng lương | Tự tính từ bảng công đã chốt: lương ngày công, tăng ca, trợ cấp, bảo hiểm, thuế TNCN' || char(10) || 'Phiếu lương & chi lương | Phiếu lương gửi điện thoại, bảng chi tiền mặt ký nhận, bảng đổ lương ngân hàng' || CASE WHEN highlights = '' THEN '' ELSE char(10) || highlights END ELSE highlights END,
     benefits = CASE WHEN instr(benefits, 'bảng lương tự tính') = 0 THEN benefits || CASE WHEN benefits = '' THEN '' ELSE char(10) END || 'Bảng lương tự tính từ bảng công, bấm vào tên xem từng bước tính và căn cứ pháp lý' || char(10) || 'Phiếu lương gửi lên điện thoại nhân viên, bảng đổ lương ngân hàng lập trong 1 phút' ELSE benefits END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.4.1 |') = 0`,
];
/* 11/11/2026 – Phần mềm quản lý nhân sự bản 0.5.1 (Module Tuyển dụng), anh chốt 18:43. Chỉ chạy khi lịch sử chưa có dòng 0.5.1. */
const MIGRATE_TOOLS_V29 = [
  `UPDATE tools SET version = 'Bản 0.5.1',
     changelog = '0.5.1 | 11/11/2026 | Module Tuyển dụng: Nhu cầu tuyển dụng (lập phiếu, gợi ý từ định biên, bật hiện trên cổng); Cổng tuyển dụng xem trước (trang vị trí, ứng viên nộp CV kèm đồng ý dữ liệu); Ngân hàng ứng viên (đổi nhanh tình trạng, việc tiếp theo, xem dạng cột kéo thả); tải CV PDF/ảnh tự đọc và điền thông tin ngay trên máy; Lịch phỏng vấn tháng/tuần, kéo thả dời lịch; Kết quả phỏng vấn: ghi chú, mẫu thư mời phỏng vấn, dời lịch, mời nhận việc, cảm ơn; chuyển ứng viên thành hồ sơ nhân sự; App nhân viên trên điện thoại làm mới: chấm công, quét mã QR, xem công dạng lịch và báo sai từng ngày, gửi đơn cho quản lý trực tiếp duyệt, xem lương cả năm, hồ sơ, hợp đồng, sơ đồ tổ chức của mình; Chấm công tách Khối văn phòng và Khối sản xuất, vận hành; Khối sản xuất: xếp ca làm như bảng tính (dán từ Excel, hoàn tác), báo ca trùng giờ, thông báo lịch tới điện thoại nhân viên; Lương theo giờ làm thực tế cho người làm ca: đơn giá giờ, phụ trội làm đêm, tăng ca đêm, phụ cấp theo số ca; Tổng hợp công hiện ô nhân viên báo sai để kế toán xử lý' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     highlights = CASE WHEN instr(highlights, 'Tuyển dụng |') = 0 THEN 'Tuyển dụng | Từ nhu cầu tuyển, cổng nhận CV, lịch phỏng vấn đến thư mời và hồ sơ nhân sự' || CASE WHEN highlights = '' THEN '' ELSE char(10) || highlights END ELSE highlights END,
     benefits = CASE WHEN instr(benefits, 'tự đọc CV') = 0 THEN benefits || CASE WHEN benefits = '' THEN '' ELSE char(10) END || 'Tải CV lên, phần mềm tự đọc CV và điền họ tên, số điện thoại, email ngay trên máy' || char(10) || 'Ứng viên đạt chuyển thẳng thành hồ sơ nhân sự, không nhập lại' ELSE benefits END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.5.1 |') = 0`,
];
/* 11/11/2026 19:25 – anh nhắc: dòng 0.5.1 trên thẻ công cụ thiếu các bổ sung 11/11 (app nhân viên, khối sản xuất). v29 đã chạy trên web nên nối thêm vào đúng dòng 0.5.1. Chạy 1 lần. */
const MIGRATE_TOOLS_V30 = [
  `UPDATE tools SET changelog = replace(changelog, '; chuyển ứng viên thành hồ sơ nhân sự', '; chuyển ứng viên thành hồ sơ nhân sự; App nhân viên trên điện thoại làm mới: chấm công, quét mã QR, xem công dạng lịch và báo sai từng ngày, gửi đơn cho quản lý trực tiếp duyệt, xem lương cả năm, hồ sơ, hợp đồng, sơ đồ tổ chức của mình; Chấm công tách Khối văn phòng và Khối sản xuất, vận hành; Khối sản xuất: xếp ca làm như bảng tính (dán từ Excel, hoàn tác), báo ca trùng giờ, thông báo lịch tới điện thoại nhân viên; Lương theo giờ làm thực tế cho người làm ca: đơn giá giờ, phụ trội làm đêm, tăng ca đêm, phụ cấp theo số ca; Tổng hợp công hiện ô nhân viên báo sai để kế toán xử lý'),
     highlights = CASE WHEN instr(highlights, 'App nhân viên |') = 0 THEN 'App nhân viên | Chấm công, xem công theo lịch, gửi đơn cho quản lý duyệt, xem lương ngay trên điện thoại' || char(10) || highlights ELSE highlights END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.5.1 |') > 0 AND instr(changelog, 'App nhân viên trên điện thoại làm mới') = 0`,
];
/* 12/11/2026 – Phần mềm nhân sự bản 0.6.1: Module Hội nhập (Hội nhập nhân sự mới, Thiết lập hành trình, hành trình trên app nhân viên). */
const MIGRATE_TOOLS_V31 = [
  `UPDATE tools SET version = 'Bản 0.6.1',
     changelog = '0.6.1 | 12/11/2026 | Module Hội nhập: hành trình mẫu 23 bước từ trước ngày đi làm đến ký hợp đồng chính thức, áp dụng theo công ty, phòng ban, vị trí; checklist dạng bảng sửa trên ô, kéo chỉnh độ rộng cột, dạng lộ trình kéo thả, hoàn tác; tạo hành trình từ file quy trình PDF, Excel có sẵn; Hội nhập nhân sự mới: người phụ trách cụ thể từng vai trò, tiến độ dạng danh sách hoặc thẻ, việc quá hạn, bắt đầu hội nhập kèm số ngày thử việc tự tính ngày hết thử việc; App nhân viên: nút Hoàn thiện hành trình hội nhập, người mới xem các giai đoạn và tự xác nhận việc đã làm' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     highlights = CASE WHEN instr(highlights, 'Hội nhập |') = 0 THEN 'Hội nhập | Đón người mới theo hành trình từ trước ngày đi làm đến khi ký chính thức, người mới tự theo dõi trên app' || CASE WHEN highlights = '' THEN '' ELSE char(10) || highlights END ELSE highlights END,
     benefits = CASE WHEN instr(benefits, 'file quy trình hội nhập') = 0 THEN benefits || CASE WHEN benefits = '' THEN '' ELSE char(10) END || 'Tải file quy trình hội nhập PDF, Excel có sẵn, phần mềm tự dựng checklist để chỉnh tiếp' ELSE benefits END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.6.1 |') = 0`,
];
/* 12/11/2026 18:30 – Phần mềm nhân sự bản 0.6.1 bổ sung Module Đào tạo nội bộ (nối ý vào dòng 0.6.1, như V30 với 0.5.1). */
const MIGRATE_TOOLS_V32 = [
  `UPDATE tools SET changelog = replace(changelog, '0.6.1 | 12/11/2026 | Module Hội nhập:', '0.6.1 | 12/11/2026 | Module Đào tạo nội bộ: kho khóa học chia chương, bài đọc, tài liệu, video dán link, bài kiểm tra trắc nghiệm và tự luận; điều kiện hoàn thành bài, khóa; giao theo phòng ban, vị trí, người mới, hạn và học lại định kỳ; theo dõi học tập, chấm bài tự luận, hồ sơ từng người có tab Đào tạo; nhân viên học và làm bài ngay trên app (tab Học); khóa mẫu Hội nhập 15 bài, kiểm tra 20 câu. Module Hội nhập:'),
     highlights = CASE WHEN instr(highlights, 'Đào tạo nội bộ |') = 0 THEN 'Đào tạo nội bộ | Soạn khóa học, bài kiểm tra; nhân viên học trên app, phần mềm theo dõi ai đã học, ai còn phải học' || char(10) || highlights ELSE highlights END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.6.1 |') > 0 AND instr(changelog, 'Module Đào tạo nội bộ:') = 0`,
];
/* 12/11/2026 19:10 – Phần mềm nhân sự 0.6.1 bổ sung Bảo hiểm xã hội (nối ý vào dòng 0.6.1). */
const MIGRATE_TOOLS_V33 = [
  `UPDATE tools SET changelog = replace(changelog, '0.6.1 | 12/11/2026 | ', '0.6.1 | 12/11/2026 | Bảo hiểm xã hội (trong Lương): danh sách đóng BH theo bảng lương, số phải nộp từng quỹ, cần báo tăng, giảm, điều chỉnh mức đóng; đối chiếu C12 tải từ cổng BHXH với bảng lương – số lao động, quỹ lương, số phải đóng, nợ, lãi chậm đóng; Thiết lập BHXH gom tỷ lệ đóng, mức tham chiếu, TNLĐ – BNN. Cài đặt chọn mục hiện trên thanh tính năng. '),
     highlights = CASE WHEN instr(highlights, 'Đối chiếu C12 |') = 0 THEN 'Đối chiếu C12 | Tải file C12 của cơ quan BHXH, phần mềm so với bảng lương và chỉ ra người chưa báo tăng, giảm' || char(10) || highlights ELSE highlights END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND instr(changelog, '0.6.1 |') > 0 AND instr(changelog, 'Bảo hiểm xã hội (trong Lương):') = 0`,
];
/* 09/11/2026 – Trạng thái đề xuất (Bảng ghim): bỏ "Sẽ làm" (planned) và "Chưa làm" (rejected), thêm "Đã xử lý" (resolved) và "Hủy" (cancel).
   Dữ liệu cũ: Sẽ làm có ngày dự kiến → Đang hoàn thiện; Sẽ làm chưa có ngày → Đang xem; Chưa làm → Hủy. Chỉ chạy 1 lần. */
const MIGRATE_REQ_STATUS_V1 = [
  `UPDATE requests SET status = 'building' WHERE status = 'planned' AND eta <> ''`,
  `UPDATE requests SET status = 'reviewing' WHERE status = 'planned'`,
  `UPDATE requests SET status = 'cancel' WHERE status = 'rejected'`,
];
const MIGRATE_TOOLS_V27 = [
  `UPDATE tools SET version = 'Bản 1.9.0',
     changelog = '1.9.0 | 09/11/2026 | Hóa đơn máy tính tiền: cổng thuế nay cho tra 1 tháng/lần nên 1 quý chỉ cần gõ 3 mã xác nhận (trước khoảng 10 mã); Gõ mã ngay sau khi bấm Tìm, xong phần này công cụ tự quét hóa đơn điện tử, anh/chị không phải ngồi canh; Cổng thuế hỏi mã mới khi sang trang: đoạn có trên 50 hóa đơn thì công cụ hiện thêm mã cho trang tiếp theo, không dùng lại mã cũ; Sửa lỗi gõ mã sai bị báo nhầm là hết phiên đăng nhập; Công cụ vẫn không tự đọc mã và không giữ mật khẩu thuế' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     benefits = replace(benefits, 'mỗi 10 ngày 1 mã.', 'mỗi tháng 1 mã (1 quý 3 mã), gõ ngay từ đầu rồi công cụ tự chạy.'),
     features = replace(features, 'Hóa đơn máy tính tiền: tự chia đoạn 10 ngày, người dùng gõ mã xác nhận do cổng thuế cấp (công cụ không tự đọc mã); đổi mã khác, bỏ qua phần này',
       'Hóa đơn máy tính tiền: tự chia đoạn 1 tháng, người dùng gõ mã xác nhận do cổng thuế cấp ngay sau khi bấm Tìm (công cụ không tự đọc mã); mỗi trang trên 50 hóa đơn thêm 1 mã; đổi mã khác, bỏ qua phần này'),
     guide = replace(guide, 'gõ mã xác nhận hiện trên bảng điều khiển cho từng đoạn 10 ngày.', 'gõ mã xác nhận hiện trên bảng điều khiển ngay sau khi bấm Tìm (mỗi tháng 1 mã), sau đó công cụ tự chạy.'),
     highlights = replace(highlights, '!Cập nhật 26/10/2026: hóa đơn máy tính tiền | Cổng thuế yêu cầu mã xác nhận mỗi lần tra, tối đa 10 ngày. Công cụ tự chia đoạn 10 ngày, hiện mã để anh/chị gõ (không tự đọc mã); tải XML không cần mã.',
       '!Cập nhật 09/11/2026: hóa đơn máy tính tiền | Cổng thuế nay cho tra 1 tháng/lần: 1 quý chỉ gõ 3 mã xác nhận, gõ ngay sau khi bấm Tìm rồi công cụ tự chạy. Công cụ không tự đọc mã, không giữ mật khẩu thuế; tải XML không cần mã.'),
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'hoa-don-thue' AND instr(changelog, '1.9.0 |') = 0`,
  `UPDATE requests SET pub_result = 'Đã cải tiến ở bản 1.9.0 (09/11/2026): cổng thuế vẫn yêu cầu mã xác nhận và Quản trị tử tế không tự đọc mã, không giữ mật khẩu thuế để tài khoản doanh nghiệp an toàn. Cổng nay cho tra 1 tháng/lần nên 1 quý chỉ cần gõ 3 mã, gõ ngay từ đầu rồi công cụ tự quét và tải toàn bộ'
   WHERE tool_ref = 'hoa-don-thue' AND pub_result = '' AND instr(pain, 'captcha') > 0 AND instr(pain, 'nhiều tháng') > 0`,
];

const MIGRATE_TOOLS_V14 = [
  `UPDATE feedback SET pub_quote = trim(content) WHERE pub_quote = '' AND tool_slug = 'to-khai-gtgt' AND instr(content, 'Tick toàn bộ') > 0`,
];

/* Cột bổ sung cho bảng requests (bản 1.7 – Bảng ghim công khai). Chỉ các cột board_* và eta được hiện ra ngoài. */
export const REQ_EXTRA_COLS = {
  on_board: 'INTEGER NOT NULL DEFAULT 0', board_title: "TEXT NOT NULL DEFAULT ''", board_desc: "TEXT NOT NULL DEFAULT ''",
  board_note: "TEXT NOT NULL DEFAULT ''", board_link: "TEXT NOT NULL DEFAULT ''", eta: "TEXT NOT NULL DEFAULT ''", eta_prev: "TEXT NOT NULL DEFAULT ''",
  // v1.12: đề xuất thêm tính năng cho công cụ nào (slug công cụ; để trống = đề xuất công cụ mới)
  tool_ref: "TEXT NOT NULL DEFAULT ''",
  // 09/11/2026: tên người gửi (ô "Tên anh/chị" – không bắt buộc, cần đồng ý rq-v2)
  name: "TEXT NOT NULL DEFAULT ''",
};
/* v1.12 Phòng chiếu: video thuộc kênh (danh sách phát) nào, thứ tự kênh */
export const REFL_EXTRA_COLS = { channel: "TEXT NOT NULL DEFAULT ''", channel_sort: 'INTEGER NOT NULL DEFAULT 100',
  // v1.14 Tủ sách nhiều ngăn: ngăn (chủ đề) của cuốn sách + mục lục
  shelf: "TEXT NOT NULL DEFAULT ''", shelf_sort: 'INTEGER NOT NULL DEFAULT 100', toc: "TEXT NOT NULL DEFAULT ''",
  // v1.15 Phòng chiếu: thời lượng video (VD 12:34) hiện trên cuộn băng
  duration: "TEXT NOT NULL DEFAULT ''",
  // v1.15d Tủ sách trưng bìa: ảnh bìa (không bắt buộc – trống thì web tự thiết kế bìa chữ)
  cover_url: "TEXT NOT NULL DEFAULT ''" };
/* v1.14 (góp ý 12/10/2026): câu trên bìa công cụ đọc theo mẫu "Dành cho … · Đang phải …".
   Chỉ đổi câu "Giải quyết vấn đề gì" khi anh CHƯA sửa (còn đúng câu gốc) – câu anh đã tự viết giữ nguyên. */
const MIGRATE_PAIN_V1 = [
  ['doc-hoa-don-xml', 'Nhận file XML mà mở ra chỉ thấy toàn ký tự.', 'Mở từng file XML hóa đơn mà chỉ thấy toàn ký tự'],
  ['van-ban-hang-loat', '50 giấy mời, 50 lần sửa tên bằng tay.', 'Sửa tay từng tên, từng con số cho hàng chục giấy mời, hợp đồng, phiếu lương'],
  ['doi-chieu-sao-ke', 'Lệch vài trăm nghìn mà dò cả buổi không ra.', 'Dò cả buổi để tìm khoản lệch vài trăm nghìn giữa sao kê và sổ sách'],
  ['import-misa-sao-ke', 'Sao kê hàng trăm dòng, nhập tay vào phần mềm.', 'Nhập tay hàng trăm dòng sao kê vào phần mềm kế toán'],
  ['doi-soat-san-tmdt', 'Sàn trả tiền thiếu mà không biết thiếu ở đơn nào.', 'Dò từng đơn khi sàn trả tiền thiếu mà không biết thiếu ở đâu'],
  ['loi-nhuan-san-tmdt', 'Bán nhiều mà cuối tháng không biết lãi bao nhiêu.', 'Đoán mò lãi lỗ cuối tháng dù bán rất nhiều đơn'],
  ['tai-hoa-don-hang-loat', 'Tải từng hóa đơn một trên cổng thuế.', 'Tải từng hóa đơn một trên cổng thuế'],
  ['tra-cuu-van-ban', 'Không chắc văn bản nào còn hiệu lực, điều khoản nào đã bị sửa.', 'Lục tìm xem văn bản nào còn hiệu lực, điều khoản nào đã bị sửa'],
  ['quan-ly-nhan-su', 'Hồ sơ nhân sự nằm rải rác nhiều file.', 'Đi tìm hồ sơ nhân sự nằm rải rác ở nhiều file'],
  ['checklist-setup-spa', 'Mở spa mà sót hạng mục, phát sinh chi phí.', 'Lo sót hạng mục khi mở spa, phát sinh chi phí không lường trước'],
  ['thu-nhap-tri-lieu-vien', 'Cơ chế lương, hoa hồng gây tranh cãi mỗi kỳ.', 'Giải thích lại cơ chế lương, hoa hồng mỗi kỳ vì dễ gây tranh cãi'],
  ['dong-tien-du-an', 'Không biết bao lâu thu hồi vốn.', 'Ước chừng xem bao lâu mới thu hồi được vốn'],
  ['checklist-van-hanh', 'Ca nào cũng quên một vài việc.', 'Nhắc đi nhắc lại vì ca nào cũng quên vài việc'],
  ['luyen-doc-tieng-anh', 'Muốn đọc đều mỗi ngày mà không có lộ trình.', 'Tự mò cách đọc tiếng Anh đều mỗi ngày mà không có lộ trình'],
  ['quan-ly-cong-viec', 'Việc nhiều, nhớ không hết.', 'Cố nhớ hết một danh sách việc ngày càng dài'],
].map(([slug, from, to]) => `UPDATE tools SET pain = '${to}' WHERE slug = '${slug}' AND pain = '${from}'`);
/* v1.12 Góp ý 09/10/2026: slogan phụ trang chủ + lời mời cà phê (anh Tuấn chốt câu chữ) */
const MIGRATE_COPY_V1 = [
  `INSERT OR REPLACE INTO settings (key, value) VALUES ('tagline', 'Chia sẻ và tạo giá trị mỗi ngày')`,
  `INSERT OR REPLACE INTO settings (key, value) VALUES ('donate_note', 'Nếu anh/chị tìm được một công cụ hữu ích cho mình, thưởng cho Đốm để tạo nhiều giá trị hơn nhé.')`,
];
/* Thêm cột còn thiếu – lỗi chỉ ghi log, không làm sập API */
/* 03/11/2026 Pháp lý (Luật BVDLCN 91/2025): lưu vết đồng ý = thời điểm + mã câu chữ (fb-v1, rq-v1, bk-v1, sub-v1, sl-v1 – xem quantritute/phap-ly/MAU-CAU-DONG-Y.md) */
export const CONSENT_COLS = { consent_at: 'INTEGER NOT NULL DEFAULT 0', consent_ver: "TEXT NOT NULL DEFAULT ''" };
/* 03/11/2026: form Góp ý có thêm Email (không bắt buộc) – để Đốm báo khi công cụ có bản cập nhật. notify = 0 khi người nhận bấm bỏ nhận; notify_token = mã link bỏ nhận */
export const FB_EMAIL_COLS = { email: "TEXT NOT NULL DEFAULT ''", notify: 'INTEGER NOT NULL DEFAULT 1', notify_token: "TEXT NOT NULL DEFAULT ''" };
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
  await ensureStudioSchema(env);
  await ensureSubsSchema(env);
  const { results } = await env.DB.prepare('PRAGMA table_info(tools)').all();
  const have = new Set(results.map(r => r.name));
  for (const [c, def] of Object.entries(TOOL_EXTRA_COLS)) {
    if (have.has(c)) continue;
    try { await env.DB.prepare(`ALTER TABLE tools ADD COLUMN ${c} ${def}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e))) throw e; }
  }
  await addCols(env, 'requests', REQ_EXTRA_COLS);
  await addCols(env, 'posts', POST_EXTRA_COLS);
  await addCols(env, 'reflections', REFL_EXTRA_COLS);
  await addCols(env, 'feedback', PUB_COLS);
  await addCols(env, 'requests', PUB_COLS);
  await addCols(env, 'feedback', CONSENT_COLS);
  await addCols(env, 'feedback', FB_EMAIL_COLS);
  await addCols(env, 'requests', CONSENT_COLS);
  await addCols(env, 'bookings', CONSENT_COLS);
  await addCols(env, 'subscribers', { consent_ver: CONSENT_COLS.consent_ver });
  const doneCopy = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_copy_v1'`).first('value');
  if (!doneCopy) {
    try { await env.DB.batch([...MIGRATE_COPY_V1, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_copy_v1', '1')`].map(q => env.DB.prepare(q))); }
    catch (e) { console.error('mig_copy_v1', e); }
  }
  // v1.12d nhạc nền thương hiệu: điền sẵn file trong web nếu anh chưa nhập (không đè giá trị anh đã nhập)
  const doneMusic = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_music_v1'`).first('value');
  if (!doneMusic) {
    try { await env.DB.batch([
      `INSERT INTO settings (key, value) VALUES ('bg_music_url', '/assets/nhac/glass-wing-sonata.mp3') ON CONFLICT(key) DO UPDATE SET value = excluded.value WHERE settings.value = ''`,
      `INSERT INTO settings (key, value) VALUES ('bg_music_title', 'Glass Wing Sonata') ON CONFLICT(key) DO UPDATE SET value = excluded.value WHERE settings.value = ''`,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_music_v1', '1')`].map(q => env.DB.prepare(q))); }
    catch (e) { console.error('mig_music_v1', e); }
  }
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
  const done7 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v7'`).first('value');
  if (!done7) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V7, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v7', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v7', e); }
  }
  const done8 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v8'`).first('value');
  if (!done8) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V8, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v8', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v8', e); }
  }
  const done9 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v9'`).first('value');
  if (!done9) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V9, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v9', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v9', e); }
  }
  const done10 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v10'`).first('value');
  if (!done10) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V10, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v10', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v10', e); }
  }
  const done11 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v11'`).first('value');
  if (!done11) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V11, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v11', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v11', e); }
  }
  const done12 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v12'`).first('value');
  if (!done12) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V12, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v12', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v12', e); }
  }
  const done13 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v13'`).first('value');
  if (!done13) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V13, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v13', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v13', e); }
  }
  const done14 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v14'`).first('value');
  if (!done14) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V14, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v14', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v14', e); }
  }
  const done15 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v15'`).first('value');
  if (!done15) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V15, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v15', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v15', e); }
  }
  const done16 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v16'`).first('value');
  if (!done16) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V16, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v16', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v16', e); }
  }
  const done18 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v18'`).first('value');
  if (!done18) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V18, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v18', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v18', e); }
  }
  const done19 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v19'`).first('value');
  if (!done19) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V19, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v19', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v19', e); }
  }
  const done20 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v20'`).first('value');
  if (!done20) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V20, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v20', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v20', e); }
  }
  const done17 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v17'`).first('value');
  if (!done17) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V17, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v17', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v17', e); }
  }
  const done21 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v21'`).first('value');
  if (!done21) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V21, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v21', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v21', e); }
  }
  const done22 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v22'`).first('value');
  if (!done22) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V22, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v22', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v22', e); }
  }
  const done23 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v23'`).first('value');
  if (!done23) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V23, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v23', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v23', e); }
  }
  const done24 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v24'`).first('value');
  if (!done24) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V24, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v24', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v24', e); }
  }
  const done25 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v25'`).first('value');
  if (!done25) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V25, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v25', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v25', e); }
  }
  const done26 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v26'`).first('value');
  if (!done26) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V26, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v26', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v26', e); }
  }
  const done27 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v27'`).first('value');
  if (!done27) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V27, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v27', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v27', e); }
  }
  const done28 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v28'`).first('value');
  if (!done28) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V28, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v28', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v28', e); }
  }
  const done29 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v29'`).first('value');
  if (!done29) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V29, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v29', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v29', e); }
  }
  const done30 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v30'`).first('value');
  if (!done30) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V30, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v30', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v30', e); }
  }
  const done31 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v31'`).first('value');
  if (!done31) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V31, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v31', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v31', e); }
  }
  const done32 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v32'`).first('value');
  if (!done32) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V32, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v32', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v32', e); }
  }
  const done33 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v33'`).first('value');
  if (!done33) {
    try { await env.DB.batch([...MIGRATE_TOOLS_V33, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v33', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_tools_v33', e); }
  }
  const doneReqSt1 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_req_status_v1'`).first('value');
  if (!doneReqSt1) {
    try { await env.DB.batch([...MIGRATE_REQ_STATUS_V1, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_req_status_v1', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_req_status_v1', e); }
  }
  const doneBoard1 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_board_v1'`).first('value');
  if (!doneBoard1) {
    try { await env.DB.batch([...MIGRATE_BOARD_V1, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_board_v1', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_board_v1', e); }
  }
  const doneDom = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_domname_v1'`).first('value');
  if (!doneDom) {
    try { await env.DB.batch([env.DB.prepare(`UPDATE settings SET value = replace(value, ' Rất mong anh/chị tin tưởng', char(10) || 'Rất mong anh/chị tin tưởng') WHERE key = 'dom_name' AND instr(value, char(10) || 'Rất mong anh/chị tin tưởng') = 0`),
      env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_domname_v1', '1')`)]); }
    catch (e) { console.error('mig_domname_v1', e); }
  }
  const donePain = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_pain_v1'`).first('value');
  if (!donePain) {
    try { await env.DB.batch([...MIGRATE_PAIN_V1, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_pain_v1', '1')`].map(s => env.DB.prepare(s))); }
    catch (e) { console.error('mig_pain_v1', e); }
  }
  /* v1.15t nhạc thương hiệu mới (13/10): thay bản Glass Wing Sonata cũ – chỉ đổi khi anh chưa tự nhập bài khác */
  const doneMusic2 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_music_v2'`).first('value');
  if (!doneMusic2) {
    try { await env.DB.batch([
      `UPDATE settings SET value = '/assets/nhac/quan-tri-tu-te.mp3' WHERE key = 'bg_music_url' AND (value = '' OR value = '/assets/nhac/glass-wing-sonata.mp3')`,
      `UPDATE settings SET value = 'Nhạc thương hiệu Quản trị tử tế' WHERE key = 'bg_music_title' AND (value = '' OR value = 'Glass Wing Sonata')`,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_music_v2', '1')`].map(q => env.DB.prepare(q))); }
    catch (e) { console.error('mig_music_v2', e); }
  }
  /* 15/10/2026: cập nhật 5 dịch vụ ở "Về Đốm" – chỉ ghi đè khi anh chưa tự sửa (vẫn là 4 thẻ mặc định cũ hoặc để trống) */
  const doneSvc = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_services_v2'`).first('value');
  if (!doneSvc) {
    try {
      const cur = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'about_services'`).first('value');
      const untouched = cur == null || cur.trim() === '' || (cur.includes('Setup vận hành, quy trình |') && cur.includes('Công cụ và AI cho việc văn phòng') && !cur.includes('Xây dựng website, công cụ tự động hóa'));
      const st = [env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_services_v2', '1')`)];
      if (untouched && cur != null) st.unshift(env.DB.prepare(`UPDATE settings SET value = ?1 WHERE key = 'about_services'`).bind(SETTINGS.about_services.def));
      await env.DB.batch(st);
    } catch (e) { console.error('mig_services_v2', e); }
  }
  /* 15/10/2026 (v3): thẻ dịch vụ chỉ còn tên + hình minh họa. Ghi đè nếu anh chưa tự sửa (vẫn là bản mặc định cũ / bản có mô tả) */
  const doneSvc3 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_services_v3'`).first('value');
  if (!doneSvc3) {
    try {
      const cur = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'about_services'`).first('value');
      const untouched = cur == null || cur.trim() === '' || cur.includes('Trao đổi nhu cầu thực tế, rồi thiết kế') || (cur.includes('Setup vận hành, quy trình |') && cur.includes('Công cụ và AI cho việc văn phòng'));
      const st = [env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_services_v3', '1')`)];
      if (untouched && cur != null) st.unshift(env.DB.prepare(`UPDATE settings SET value = ?1 WHERE key = 'about_services'`).bind(SETTINGS.about_services.def));
      await env.DB.batch(st);
    } catch (e) { console.error('mig_services_v3', e); }
  }
  /* v1.15i tạo danh sách kênh từ các kênh đang ghi ở video (giữ thứ tự kênh cũ) */
  const doneCh = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_channels_v1'`).first('value');
  if (!doneCh) {
    try { await env.DB.batch([`INSERT OR IGNORE INTO video_channels (name, sort, visible, created_at, updated_at)
        SELECT TRIM(channel), MIN(channel_sort), 1, 0, 0 FROM reflections WHERE kind = 'video' AND TRIM(channel) <> '' GROUP BY TRIM(channel)`,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_channels_v1', '1')`].map(q => env.DB.prepare(q))); }
    catch (e) { console.error('mig_channels_v1', e); }
  }
  /* v1.22 Văn bản hàng loạt: bản web tách nhẹ (index.html), bản tải offline 1 file là tao-van-ban-hang-loat.html */
  const doneDl = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_dl_v1'`).first('value');
  if (!doneDl) {
    try { await env.DB.batch([`UPDATE tools SET download_url = '/tools/tao-van-ban-hang-loat/tao-van-ban-hang-loat.html' WHERE download_url IN ('/tools/tao-van-ban-hang-loat/index.html', '/tools/tao-van-ban-hang-loat/')`,
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_dl_v1', '1')`].map(q => env.DB.prepare(q))); }
    catch (e) { console.error('mig_dl_v1', e); }
  }
}
/* v1.30 (30/10/2026): migrate() chạy ~70 truy vấn nối tiếp → mỗi lần Cloudflare khởi động lại isolate (web ít khách nên gần như mỗi lượt)
 * trang chờ ~15 giây, Facebook hết thời gian chờ khi đọc link. Nay: lưu "chữ ký" của mã migrate vào settings._schema_sig;
 * chữ ký khớp → bỏ qua migrate (1 truy vấn). Sửa SCHEMA / migrate / các ensure*Schema → chữ ký tự đổi → migrate chạy lại 1 lần. */
const SCHEMA_SIG = (() => {
  const src = [SCHEMA.join('\n'), migrate, ensureLegalSchema, ensureStudioSchema, ensureSubsSchema, addCols, JSON.stringify(TOOL_EXTRA_COLS),
    /* 01/11: thêm danh sách cột phụ – trước đây thêm cột vào PUB_COLS (ai_at) chữ ký không đổi → không migrate → Hộp thư mất đề xuất, góp ý */
    JSON.stringify([PUB_COLS, REQ_EXTRA_COLS, POST_EXTRA_COLS, REFL_EXTRA_COLS, CONSENT_COLS, FB_EMAIL_COLS])].map(String).join('|');
  let h = 5381; for (let i = 0; i < src.length; i++) h = ((h * 33) ^ src.charCodeAt(i)) >>> 0;
  return 'v1.30-' + h.toString(36) + '-' + src.length;
})();
async function migrateIfNeeded(env) {
  try {
    const cur = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_schema_sig'`).first('value');
    if (cur === SCHEMA_SIG) return;
  } catch (e) { /* DB mới, chưa có bảng settings → chạy migrate */ }
  await migrate(env);
  await env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_schema_sig', ?1)`).bind(SCHEMA_SIG).run();
}
export function ensureSchema(env) {
  if (!schemaReady) schemaReady = migrateIfNeeded(env).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

/* ---------------- Cài đặt ---------------- */
export const SETTINGS = {
  site_url: { label: 'Địa chỉ trang khách (VD: https://quantritute.com)', def: '', public: false },
  headline: { label: 'Câu định vị (trang chủ)', def: 'Quản trị lấy Con người làm gốc', public: true },
  tagline: { label: 'Câu phụ (trang chủ)', def: 'Chia sẻ và tạo giá trị mỗi ngày', public: true },
  /* v1.12 nhạc nền thương hiệu: để trống = không hiện nút nhạc. Người dùng tự bấm mới phát (trình duyệt chặn tự phát) */
  bg_music_url: { label: 'Link file nhạc nền (mp3, VD /assets/nhac/ten-bai.mp3 hoặc link https). Để trống: không hiện nút nhạc', def: '/assets/nhac/quan-tri-tu-te.mp3', public: true },
  bg_music_title: { label: 'Tên bài nhạc (hiện khi rê chuột vào nút nhạc)', def: 'Nhạc thương hiệu Quản trị tử tế', public: true },
  notice: { label: 'Thông báo đầu trang (để trống nếu không có)', def: '', public: true },
  contact_phone: { label: 'Số điện thoại', def: '', public: true },
  contact_zalo: { label: 'Zalo (số hoặc link)', def: '', public: true },
  contact_email: { label: 'Email liên hệ', def: '', public: true },
  social_tiktok: { label: 'Link TikTok', def: '', public: true },
  social_facebook: { label: 'Link Fanpage', def: '', public: true },
  social_youtube: { label: 'Link YouTube', def: '', public: true },
  /* Cài đặt riêng của công cụ Cẩm nang thuế (hiện ở Quản trị → Cẩm nang thuế → Cài đặt công cụ) */
  legal_scan_every_days: { label: 'Quét văn bản pháp luật mới: cứ mấy ngày quét 1 lần (1 = hằng ngày, tối đa 30). Giờ quét: 08:00', def: '1', public: false, tool: 'cam-nang-thue-2026' },
  feedback_open: { label: 'Nhận góp ý từ người dùng qua nút "Góp ý cho Đốm" trong các công cụ (tắt = tạm ngừng nhận ở mọi công cụ)', def: '1', public: false, bool: true, tool: 'bo-cong-cu' },
  subscribe_open: { label: 'Hiện form đăng ký nhận cập nhật pháp lý qua email trên Cẩm nang thuế', def: '1', public: false, bool: true, tool: 'cam-nang-thue-2026' },
  mail_enabled: { label: 'Bật gửi email (xác nhận đăng ký + bản tin 10:00 sáng hằng ngày khi có văn bản mới được duyệt)', def: '0', public: false, bool: true, tool: 'cam-nang-thue-2026' },
  mail_from: { label: 'Email gửi đi (thuộc tên miền đã xác minh ở Resend, VD: capnhat@quantritute.com)', def: '', public: false, tool: 'cam-nang-thue-2026' },
  mail_from_name: { label: 'Tên người gửi', def: 'Quản trị tử tế', public: false, tool: 'cam-nang-thue-2026' },
  forms_open: { label: 'Nhận đề xuất công cụ / tính năng', def: '1', public: true, bool: true },
  booking_open: { label: 'Nhận đặt lịch tư vấn 1:1', def: '1', public: true, bool: true },
  /* v1.15d Bật / ẩn Góc ngẫm và từng phòng (ẩn = bỏ khỏi menu, trang chủ, sơ đồ trang; link trực tiếp hiện "đang chuẩn bị") */
  ngam_on: { label: 'Hiện mục Góc ngẫm trên web', def: '0', public: true, bool: true },
  ngam_sach_on: { label: 'Hiện phòng Tủ sách', def: '1', public: true, bool: true },
  ngam_chieu_on: { label: 'Hiện phòng Phòng chiếu', def: '1', public: true, bool: true },
  ngam_baiviet_on: { label: 'Hiện phòng Bài viết', def: '1', public: true, bool: true },
  /* v1.20 Phân tích web: mã dự án Microsoft Clarity (heatmap, xem lại phiên). Trống = không nạp Clarity. Chỉ nạp khi người dùng bấm Đồng ý. */
  clarity_id: { label: 'Mã dự án Microsoft Clarity (Project ID, VD: abcd1234ef). Để trống: tắt Clarity', def: '', public: true },
  /* v1.8 Về Minh Tuấn (long = ô nhiều dòng) */
  about_name: { label: 'Tên hiển thị', def: 'Minh Tuấn', public: true },
  about_role: { label: 'Dòng giới thiệu ngắn dưới tên', def: 'Người làm công cụ nhỏ cho việc văn phòng · Quản trị lấy Con người làm gốc', public: true },
  about_photo: { label: 'Ảnh anh Minh Tuấn (hiện ở mục "Đốm kể nhỏ" trang Về Đốm; để trống: hiện chữ viết tắt)', def: '', public: true, image: true },
  /* v1.15 ảnh bìa trang Tổng quan của trang quản trị (để trống: dùng ảnh bàn làm việc của trang chủ) */
  admin_cover: { label: 'Ảnh bìa trang Tổng quan (quản trị)', def: '', public: false, image: true },
  about_motto: { label: 'Phương châm sống (hiện trên tờ giấy ghim)', def: '', public: true },
  about_intro: { label: 'Lời giới thiệu (mỗi đoạn 1 dòng)', def: 'Tuấn đã nhiều năm làm quản trị ở khối văn phòng và trực tiếp setup, vận hành các mô hình dịch vụ. Những bảng tính làm đi làm lại mỗi tháng, những quy trình rối, Tuấn đều đã đi qua.\nGiờ Tuấn chia sẻ hành trình học, làm công cụ cùng AI, và đồng hành với những ai đang gặp đúng những việc đó.', public: true, long: true },
  about_career: { label: 'Hành trình sự nghiệp – mỗi dòng 1 ngăn kéo: Thời gian | Vai trò, nơi làm | Điều học được', def: '', public: true, long: true },
  about_values: { label: 'Định hướng tạo giá trị – mỗi dòng: Tiêu đề | Mô tả', def: 'Công cụ miễn phí cho việc lặp lại | Kho công cụ nhỏ, miễn phí, giúp người làm văn phòng bớt những việc làm đi làm lại mỗi ngày.\nChỉ thu phí khi thực sự đặc thù | Công cụ đặc thù, độc nhất mới tính phí theo lượt hoặc thuê bao.\nGiới thiệu đúng công cụ | Khi đã có công cụ tốt của bên khác, giới thiệu để bạn dùng ngay, không phải chờ.\nĐồng hành 1:1 khi có việc cụ thể | Cùng bạn gỡ một tình huống thật về vận hành, nhân sự hoặc công cụ.', public: true, long: true },
  about_services: { label: 'Về Đốm – Đốm cùng anh Minh Tuấn có thể hỗ trợ – mỗi dòng 1 thẻ: mỗi dòng là tên một dịch vụ, hiện kèm hình minh họa (nên giữ từ khóa web/AI/quy trình/đào tạo/spa trong tên để hình khớp)', def: 'Xây dựng website, công cụ tự động hóa theo nhu cầu riêng\nKinh nghiệm, kiến thức triển khai AI, AI agents\nTối ưu bộ máy, quy trình vận hành cho HKD hoặc SMEs\nXây dựng hệ thống đào tạo nội bộ, văn hóa doanh nghiệp\nSetup & vận hành spa chăm sóc sức khỏe', public: true, long: true },
  /* v1.14 Về Đốm (trang /ve-dom, đứng đầu menu) – em soạn sẵn, anh duyệt/sửa trong Cài đặt */
  dom_intro: { label: 'Về Đốm – Lời chào của Đốm (mỗi đoạn 1 dòng)', def: 'Em được anh Minh Tuấn tạo ra để trở thành người đồng hành, hỗ trợ anh/chị trong việc tìm và dùng những công cụ nhỏ, giúp gỡ bớt các việc lặp đi lặp lại ở văn phòng, để công việc nhẹ nhàng và hiệu quả hơn.', public: true, long: true },
  dom_name: { label: 'Về Đốm – Tên của Đốm (mỗi đoạn 1 dòng)', def: 'Tên của em được anh Minh Tuấn đặt từ cảm hứng "đom đóm dẫn đường": một đốm sáng nhỏ, đủ để soi rõ lối đi trong đêm.\nEm rất mong được đồng hành và hỗ trợ anh/chị. Em luôn lắng nghe và không ngừng học hỏi, cải thiện.\nRất mong anh/chị tin tưởng và ủng hộ Đốm!', public: true, long: true },
  dom_tuan: { label: 'Về Đốm – Đốm kể nhỏ: anh Minh Tuấn là người… (mỗi đoạn 1 dòng)', def: 'Anh Minh Tuấn là người đã có hơn mười năm làm nhân sự, tài chính và vận hành. Anh đã đi qua rất nhiều bảng tính làm đi làm lại mỗi tháng, những quy trình rối, và gặp rất nhiều người giỏi đang mệt vì việc lặp lại.\nAnh tin quản trị phải lấy con người làm gốc.', public: true, long: true },
  dom_hope: { label: 'Về Đốm – Kỳ vọng của anh Minh Tuấn khi tạo ra Đốm (mỗi đoạn 1 dòng)', def: 'Khi tạo ra em, anh Minh Tuấn mong mỗi công cụ nhỏ ở đây giúp anh/chị bớt được một giờ làm việc vô nghĩa, để có thêm thời gian ở bên người thân yêu.', public: true, long: true },
  /* v1.8 Tách cà phê */
  cafe_thanks: { label: 'Lời cảm ơn (dưới mã QR)', def: '', public: true, long: true },
  thanks_intro: { label: 'Góc cảm ơn – lời cảm ơn ở đầu trang (mỗi dòng 1 đoạn)', def: 'Cảm ơn anh/chị đã dành thời gian góp ý và đề xuất tính năng.\nMỗi góp ý là một viên gạch để kho công cụ thêm hữu ích, giúp mọi người làm việc nhẹ nhàng và hiệu quả hơn. Cảm ơn anh/chị đã cùng Đốm chung tay xây dựng kho công cụ này.', public: true, long: true },
  thanks_wall: { label: 'Bức tường cảm ơn – mỗi dòng 1 tên hoặc biệt danh (chỉ ghi khi người ủng hộ đồng ý)', def: '', public: true, long: true },
  bank_code: { label: 'Mã ngân hàng VietQR (VD: MB, VCB, TCB)', def: '', public: true },
  bank_name: { label: 'Tên ngân hàng', def: '', public: true },
  bank_acc: { label: 'Số tài khoản nhận ủng hộ', def: '', public: true },
  bank_holder: { label: 'Chủ tài khoản', def: '', public: true },
  donate_content: { label: 'Nội dung chuyển khoản gợi ý', def: 'CAFE QTT', public: true },
  donate_note: { label: 'Lời Đốm mời cà phê (cạnh tách cà phê có mã QR). Từ v1.14 trang chỉ hiện mã QR, không hiện số tài khoản', def: 'Nếu anh/chị tìm được một công cụ hữu ích cho mình, thưởng cho Đốm để tạo nhiều giá trị hơn nhé.', public: true },
};
/* Phòng Góc ngẫm có đang hiện không: room = 'sach' | 'chieu' | 'baiviet' (bỏ trống = cả mục) */
export const ngamOn = (s, room) => String(s.ngam_on ?? '0') !== '0' && (!room || String(s['ngam_' + room + '_on'] ?? '1') !== '0');
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
      version: { type: 'text', max: 60 }, released: { type: 'date' }, author: { type: 'text', max: 80 }, changelog: { type: 'long', max: 12000 },
      url: { type: 'text', max: 500 }, download_url: { type: 'text', max: 500 }, banner_url: { type: 'text', max: 500 }, eta: { type: 'date' },
      notice: { type: 'long', max: 600 }, cta_label: { type: 'text', max: 60 },
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
      channel: { type: 'text', max: 80 }, channel_sort: { type: 'int' },
      shelf: { type: 'text', max: 80 }, shelf_sort: { type: 'int' }, toc: { type: 'long', max: 4000 }, duration: { type: 'text', max: 12 }, cover_url: { type: 'text', max: 500 },
      status: { type: 'enum', values: ['draft', 'published'] }, published_at: { type: 'date' }, sort: { type: 'int' }, visible: { type: 'bool' },
    },
  },
  channels: {
    table: 'video_channels', order: 'sort ASC, id ASC', search: ['name', 'note'], filter: 'visible',
    fields: { name: { type: 'text', req: true, max: 80 }, note: { type: 'text', max: 300 }, sort: { type: 'int' }, visible: { type: 'bool' } },
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
    table: 'requests', order: 'created_at DESC', search: ['pain', 'name', 'role', 'contact'], filter: 'status',
    fields: {
      pain: { type: 'long', req: true, max: 2000 }, name: { type: 'text', max: 120 }, role: { type: 'text', max: 80 }, contact: { type: 'text', max: 160 },
      status: { type: 'enum', values: ['new', 'reviewing', 'building', 'done', 'resolved', 'cancel', 'planned', 'rejected'] }, votes: { type: 'int' }, // planned/rejected: giá trị cũ, chỉ giữ để không lỗi
      tool_slug: { type: 'text', max: 80 }, tool_ref: { type: 'text', max: 80 }, admin_note: { type: 'long', max: 4000 },
      on_board: { type: 'bool' }, board_title: { type: 'text', max: 120 }, board_desc: { type: 'long', max: 600 },
      board_note: { type: 'text', max: 300 }, board_link: { type: 'text', max: 500 }, eta: { type: 'date' },
      pub_show: { type: 'bool' }, pub_name: { type: 'text', max: 80 }, pub_title: { type: 'text', max: 300 }, pub_result: { type: 'long', max: 600 }, pub_quote: { type: 'long', max: 1500 }, pub_status: { type: 'enum', values: ['', 'new', 'doing', 'done', 'skip', 'wait', 'cancel'] },
    },
  },
  feedback: {
    table: 'feedback', order: 'created_at DESC', search: ['name', 'phone', 'email', 'content'], filter: 'status',
    fields: {
      tool_slug: { type: 'text', max: 80 }, name: { type: 'text', max: 120 }, phone: { type: 'text', max: 40 }, email: { type: 'text', max: 160 }, notify: { type: 'bool' }, content: { type: 'long', req: true, max: 4000 },
      page: { type: 'text', max: 200 }, status: { type: 'enum', values: ['new', 'read', 'doing', 'done'] }, admin_note: { type: 'long', max: 4000 },
      pub_show: { type: 'bool' }, pub_name: { type: 'text', max: 80 }, pub_title: { type: 'text', max: 300 }, pub_result: { type: 'long', max: 600 }, pub_quote: { type: 'long', max: 1500 }, pub_status: { type: 'enum', values: ['', 'new', 'doing', 'done', 'skip', 'wait', 'cancel'] },
    },
  },
  subscribers: {
    table: 'subscribers', order: 'created_at DESC', search: ['email'], filter: 'status',
    fields: {
      tool_slug: { type: 'text', max: 80 }, email: { type: 'text', req: true, max: 160 },
      status: { type: 'enum', values: ['pending', 'active', 'unsubscribed'] }, admin_note: { type: 'long', max: 2000 },
    },
  },
  linkreqs: {
    table: 'link_requests', order: 'created_at DESC', search: ['email'], filter: 'status',
    fields: { tool_slug: { type: 'text', max: 80 }, email: { type: 'text', req: true, max: 160 }, status: { type: 'enum', values: ['sent', 'failed'] }, admin_note: { type: 'long', max: 2000 } },
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
