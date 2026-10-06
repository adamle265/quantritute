/* ============================================================
 * Quản trị tử tế — Bộ theo dõi văn bản pháp luật mới (cho Cẩm nang Thuế – Kế toán – Lao động)
 *
 * Luồng: đọc danh sách văn bản mới trên chinhphu.vn → bỏ văn bản đã xử lý → chấm điểm liên quan
 *        theo chỉ mục căn cứ của cẩm nang (src/legal-index.js) → văn bản đủ điểm: đọc trang chi tiết,
 *        nhờ AI tóm tắt (nếu có) → ghi vào bảng legal_docs với trạng thái "Chờ duyệt".
 *        CHỈ văn bản anh bấm "Duyệt" mới hiện trên trang cẩm nang.
 *
 * Dùng chung cho: watch/ (Worker chạy định kỳ 3 ngày/lần) và trang quản trị (nút "Quét ngay").
 * AI (không bắt buộc): ưu tiên Claude nếu có secret ANTHROPIC_API_KEY; nếu không, dùng Workers AI (binding AI);
 *        không có cả hai: chỉ chấm điểm theo quy tắc, nội dung tóm tắt lấy từ trích yếu.
 * ============================================================ */
import { LEGAL_INDEX } from './legal-index.js';

export const SOURCE = 'chinhphu';
const BASE = 'https://chinhphu.vn';
export const LIST_URLS = [
  ['Văn bản mới', '/he-thong-van-ban?classid=0&mode=1'],
  ['Văn bản QPPL', '/he-thong-van-ban?classid=1&mode=1'],
  ['VBQPPL của Bộ', '/he-thong-van-ban?classid=1&mode=1&orggroupid=4'],
  ['Văn bản chỉ đạo điều hành', '/he-thong-van-ban?classid=2&mode=1'],
  ['Quốc hội', '/he-thong-van-ban?classid=1&mode=1&orggroupid=1'],
];
const UA = 'Mozilla/5.0 (compatible; QuanTriTuTe-LegalWatch/1.0)';
export const DEFAULTS = { maxAgeDays: 60, maxEnrich: 8, keepDays: 200 };
export const LEVELS = { cao: 'Quan trọng', tb: 'Nên xem', thap: 'Tham khảo' };

/* ---------- Bảng dữ liệu ---------- */
export const LEGAL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS legal_docs (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL DEFAULT 'chinhphu', docid TEXT NOT NULL,
    so_hieu TEXT NOT NULL DEFAULT '', loai TEXT NOT NULL DEFAULT '', co_quan TEXT NOT NULL DEFAULT '', ngay_ban_hanh TEXT NOT NULL DEFAULT '',
    ngay_bh_iso TEXT NOT NULL DEFAULT '', hieu_luc TEXT NOT NULL DEFAULT '', trich_yeu TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
    pdf_url TEXT NOT NULL DEFAULT '', list_name TEXT NOT NULL DEFAULT '', score INTEGER NOT NULL DEFAULT 0, level TEXT NOT NULL DEFAULT '',
    topics TEXT NOT NULL DEFAULT '', matched TEXT NOT NULL DEFAULT '', reasons TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '', impact TEXT NOT NULL DEFAULT '', action TEXT NOT NULL DEFAULT '', ai TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', in_handbook INTEGER NOT NULL DEFAULT 0, admin_note TEXT NOT NULL DEFAULT '',
    found_at INTEGER NOT NULL DEFAULT 0, approved_at INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_src_doc ON legal_docs(source, docid)`,
  `CREATE INDEX IF NOT EXISTS idx_legal_status ON legal_docs(status, ngay_bh_iso)`,
  `CREATE TABLE IF NOT EXISTS legal_scans (id INTEGER PRIMARY KEY AUTOINCREMENT, trigger TEXT NOT NULL DEFAULT '', started_at INTEGER NOT NULL,
    finished_at INTEGER NOT NULL DEFAULT 0, ok INTEGER NOT NULL DEFAULT 0, fetched INTEGER NOT NULL DEFAULT 0, new_count INTEGER NOT NULL DEFAULT 0,
    candidates INTEGER NOT NULL DEFAULT 0, ai TEXT NOT NULL DEFAULT '', error TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '')`,
];
/* Cột bổ sung bản 1.3.2: điểm cập nhật chính, toàn văn, đề xuất duyệt/loại */
const LEGAL_EXTRA_COLS = { key_points: "TEXT NOT NULL DEFAULT ''", full_text: "TEXT NOT NULL DEFAULT ''", recommend: "TEXT NOT NULL DEFAULT ''", recommend_note: "TEXT NOT NULL DEFAULT ''" };
/* Đề xuất soạn sẵn cho lượt quét đầu tiên (05/10/2026) – chỉ áp vào văn bản còn "Chờ duyệt", chạy 1 lần */
const SEED_20261005 = [
  { so: '43/2026/QH16', recommend: 'approve', note: 'Giảm 30% thuế TNCN, TNDN cho DN và cá nhân kinh doanh doanh thu ≤ 10 tỷ – ảnh hưởng rộng. Đã đọc toàn văn (bản Word); nội dung đã bổ sung vào chủ đề TNCN, TNDN của cẩm nang.',
    level: 'cao', topics: 'tncn,tndn', hieu_luc: '24/08/2026 (áp dụng kỳ tính thuế 2026, 2027)',
    title: 'Giảm 30% thuế TNCN, TNDN năm 2026–2027 cho doanh nghiệp, cá nhân kinh doanh doanh thu không quá 10 tỷ đồng',
    summary: 'Nghị quyết của Quốc hội giảm 30% số thuế TNCN (thu nhập từ kinh doanh của cá nhân cư trú) và 30% số thuế TNDN phải nộp của kỳ tính thuế 2026 và 2027, áp dụng khi doanh thu hằng năm không quá 10 tỷ đồng.',
    key_points: 'Cá nhân cư trú có thu nhập từ kinh doanh, doanh thu năm 2026, 2027 không quá 10 tỷ đồng: giảm 30% số thuế TNCN phải nộp (Điều 1.1)\nDoanh nghiệp, tổ chức thành lập theo pháp luật Việt Nam, doanh thu năm 2026, 2027 không quá 10 tỷ đồng: giảm 30% số thuế TNDN phải nộp (Điều 1.2)\nKhông áp dụng cho doanh nghiệp hình thành từ chia, tách sau 24/08/2026 mà tổng doanh thu các doanh nghiệp sau chia, tách trên 10 tỷ đồng\nDoanh nghiệp đang hưởng ưu đãi thuế: mức giảm 30% tính trên số thuế phải nộp sau khi đã trừ ưu đãi\nHiệu lực từ 24/08/2026, áp dụng cho kỳ tính thuế 2026 và 2027; Chính phủ quy định chi tiết (Điều 2)',
    impact: 'Đã bổ sung vào chủ đề Thuế TNCN và Thuế TNDN (thẻ văn bản 43/2026/QH16).', action: 'Kế toán xác định doanh thu năm 2026 để biết doanh nghiệp / hộ kinh doanh có thuộc diện giảm 30% không; theo dõi Nghị định hướng dẫn trước khi quyết toán năm 2026.', in_handbook: 1 },
  { so: '10065/VPCP-KGVX', recommend: 'approve', note: 'Lịch nghỉ áp dụng cả doanh nghiệp, người lao động – liên quan chấm công, tính lương. Đã đọc toàn văn.',
    level: 'tb', topics: 'hdld', hieu_luc: '',
    title: 'Phương án nghỉ Lễ, Tết 2026 – 2027: Tết Đinh Mùi nghỉ 7 ngày, Quốc khánh 2027 nghỉ 4 ngày',
    summary: 'Văn phòng Chính phủ thông báo phương án nghỉ một số dịp Lễ, Tết năm 2026 và 2027 cho cơ quan nhà nước, doanh nghiệp và người lao động.',
    key_points: 'Ngày Văn hóa Việt Nam năm 2026: nghỉ 1 ngày\nTết Âm lịch Đinh Mùi 2027: nghỉ 7 ngày\nLễ Quốc khánh 2027: nghỉ 4 ngày\nÁp dụng cho cơ quan hành chính, sự nghiệp, tổ chức chính trị – xã hội, doanh nghiệp và người lao động\nNgày nghỉ cụ thể và việc làm bù (nếu có): xem văn bản gốc',
    impact: 'Chủ đề HĐLĐ – Lao động: phần thời giờ nghỉ ngơi, nghỉ lễ, Tết.', action: 'Bộ phận nhân sự cập nhật lịch nghỉ, chấm công và tính lương làm thêm giờ ngày lễ theo văn bản gốc.', in_handbook: 0 },
  { so: '43/2026/NQ-CP', recommend: 'approve', note: 'Liên quan thuế GTGT (chủ đề đã có) nhưng chỉ nhóm hàng xăng dầu → mức "Nên xem". Đã đọc toàn văn.',
    level: 'tb', topics: 'gtgt', hieu_luc: '01/10/2026 – 31/12/2026',
    title: 'Kéo dài áp dụng thuế GTGT, thuế BVMT, thuế nhập khẩu ưu đãi với xăng dầu đến 31/12/2026',
    summary: 'Chính phủ kéo dài thời hạn áp dụng thuế GTGT, thuế bảo vệ môi trường (theo Nghị quyết 19/2026/QH16) và thuế nhập khẩu ưu đãi với xăng, dầu, nguyên liệu sản xuất xăng dầu, nhiên liệu bay đến hết 31/12/2026.',
    key_points: 'Kéo dài thuế GTGT, thuế BVMT với xăng, dầu, nguyên liệu sản xuất xăng dầu và nhiên liệu bay theo Nghị quyết 19/2026/QH16 đến 31/12/2026 (Điều 2)\nKéo dài thuế nhập khẩu ưu đãi với xăng, dầu, nguyên liệu sản xuất xăng dầu (theo NQ 25/2026/NQ-CP, NĐ 72/2026/NĐ-CP) đến 31/12/2026 (Điều 1)\nVăn bản không nêu lại mức thuế cụ thể – tiếp tục áp dụng mức đang hiện hành\nHiệu lực 01/10/2026 – 31/12/2026 (Điều 3)',
    impact: 'Chủ đề Thuế GTGT: lưu ý thuế suất nhóm xăng dầu, nhiên liệu bay.', action: 'Doanh nghiệp kinh doanh hoặc dùng nhiều xăng dầu kiểm tra thuế suất GTGT trên hóa đơn đầu vào, đầu ra đến hết năm 2026.', in_handbook: 0 },
  ...[['371/2026/NĐ-CP', 'Chỉ cho lao động Việt Nam làm việc cho tổ chức, cá nhân nước ngoài – ít doanh nghiệp gặp'],
    ['22/2026/QH16', 'Lao động Việt Nam đi làm việc ở nước ngoài – ngoài phạm vi cẩm nang'],
    ['137/2026/TT-BTC', 'Chuẩn mực dành cho công ty kiểm toán, không phải kế toán doanh nghiệp'],
    ['64/2026/TT-BCT', 'Kiểm toán năng lượng – bộ lọc nhận nhầm từ "kiểm toán"'],
    ['21/2026/TT-BNV', 'Chế độ cựu chiến binh – không liên quan']].map(([so, note]) => ({ so, recommend: 'reject', note })),
];
async function migrateLegal(env) {
  await env.DB.batch(LEGAL_SCHEMA.map(s => env.DB.prepare(s)));
  const { results } = await env.DB.prepare('PRAGMA table_info(legal_docs)').all();
  const have = new Set(results.map(r => r.name));
  for (const [c, def] of Object.entries(LEGAL_EXTRA_COLS)) {
    if (have.has(c)) continue;
    try { await env.DB.prepare(`ALTER TABLE legal_docs ADD COLUMN ${c} ${def}`).run(); } catch (e) { if (!/duplicate column/i.test(String(e))) throw e; }
  }
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)').run();
  const done = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_legal_seed_20261005'`).first('value');
  if (!done) {
    const st = [];
    for (const x of SEED_20261005) {
      if (x.recommend === 'reject') st.push(env.DB.prepare(`UPDATE legal_docs SET recommend = 'reject', recommend_note = ?1 WHERE so_hieu = ?2 AND status = 'pending'`).bind(x.note, x.so));
      else st.push(env.DB.prepare(`UPDATE legal_docs SET recommend = 'approve', recommend_note = ?1, level = ?2, topics = ?3, hieu_luc = CASE WHEN ?4 = '' THEN hieu_luc ELSE ?4 END,
          title = ?5, summary = ?6, key_points = ?7, impact = ?8, action = ?9, in_handbook = ?10, ai = 'BuBu (đọc toàn văn)' WHERE so_hieu = ?11 AND status = 'pending'`)
        .bind(x.note, x.level, x.topics, x.hieu_luc, x.title, x.summary, x.key_points, x.impact, x.action, x.in_handbook, x.so));
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_legal_seed_20261005', '1')`));
    await env.DB.batch(st);
  }
}
let legalReady = null;
export function ensureLegalSchema(env) {
  if (!legalReady) legalReady = migrateLegal(env).catch(e => { legalReady = null; throw e; });
  return legalReady;
}

/* ---------- Chuẩn hoá chữ ---------- */
// Trang nguồn đôi khi gõ nhầm chữ Kirin trông giống chữ Latin (VD "NĐ-СР"): đổi về Latin để so khớp.
const CYR = { 'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y' };
export const fold = s => String(s ?? '').replace(/[АВСЕНКМОРТХасеорху]/g, c => CYR[c]);
const decode = s => String(s ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
export const soKey = so => fold(so).toUpperCase().replace(/Đ/g, 'D').replace(/\s+/g, '');
const NUM_RE = /\b\d{1,5}\/(?:\d{4}\/)?(?:QH\d{2}|NĐ-CP|ND-CP|TT-[A-ZĐ]+|QĐ-TTg|NQ-CP|VBHN-[A-ZĐ]+|UBTVQH\d{2}|TTLT-[A-ZĐ-]+|NQ-HĐTP|CT-TTg)\b/g;
export const toIso = d => { const m = String(d || '').match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };

/* ---------- Đọc trang nguồn ---------- */
export function parseList(html) {
  let a = html.indexOf('Số ký hiệu'); if (a < 0) a = 0;
  let b = html.indexOf('</table>', a); if (b < 0) b = html.length;
  const rows = [];
  for (const r of html.slice(a, b).split(/<tr[\s>]/).slice(1)) {
    const g = re => { const m = r.match(re); return m ? decode(m[1]).replace(/\s+/g, ' ').trim() : ''; };
    const so = fold(g(/class="code">([^<]*)</)), docid = g(/docid=(\d+)/);
    if (!so || !docid) continue;
    rows.push({ docid, so, ngay: g(/class="issued-date">([^<]*)</), trich_yeu: fold(g(/class="substract">([^<]*)</)), pdf: g(/bl-doc-file"><a href="([^"]+)"/) });
  }
  return rows;
}
export function parseDetail(html) {
  const a = html.indexOf('class="Content"');
  if (a < 0) return {};
  const part = html.slice(a, html.indexOf('</table>', a) + 1 || undefined);
  const f = {};
  for (const m of part.matchAll(/<td class="col1"[^>]*>([^<]*)<\/td>\s*<td>([\s\S]*?)<\/td>/g))
    f[decode(m[1]).trim()] = fold(decode(m[2].replace(/<[^>]+>/g, ' '))).replace(/\s+/g, ' ').trim();
  return { hieu_luc: (f['Ngày có hiệu lực'] || '').replace(/-/g, '/'), loai: f['Loại văn bản'] || '', co_quan: f['Cơ quan ban hành'] || '', nguoi_ky: f['Người ký'] || '' };
}
const docUrl = docid => `${BASE}/?pageid=27160&docid=${docid}`;
async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'vi,en;q=0.5' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}

/* ---------- Chấm điểm liên quan ---------- */
export function typeOf(so) {
  const k = soKey(so);
  if (/VBHN/.test(k)) return ['Văn bản hợp nhất', -10];
  if (/\/QH\d\d$/.test(k)) return ['Luật / Nghị quyết Quốc hội', 20];
  if (/UBTVQH/.test(k)) return ['Nghị quyết UBTVQH', 15];
  if (/ND-CP$/.test(k)) return ['Nghị định', 10];
  if (/NQ-CP$/.test(k)) return ['Nghị quyết Chính phủ', 10];
  if (/\/TT-/.test(k)) return ['Thông tư', 10];
  if (/QD-TTG$/.test(k)) return /\/\d{4}\//.test(k) ? ['Quyết định (QPPL)', 5] : ['Quyết định', 0];
  if (/CT-TTG$/.test(k)) return ['Chỉ thị', 5];
  if (/\/(BC|TB)-/.test(k)) return ['Báo cáo / Thông báo', -20];
  if (/VPCP/.test(k)) return ['Công văn Văn phòng Chính phủ', 0];
  return ['Văn bản khác', 0];
}
const ISSUER_RE = /-(BTC|BNV|BLDTBXH|BHXH)$/;
// Bỏ tên cơ quan khỏi trích yếu trước khi dò từ khóa (tránh "Bộ Lao động..." bị hiểu là văn bản lao động)
const STRIP_RE = /Bộ(?: trưởng Bộ)? Lao động\s*-\s*Thương binh và Xã hội|Bộ Lao động|Ngân hàng Chính sách xã hội/gi;
const NEG_RE = /(bổ nhiệm|điều động|kéo dài thời hạn giữ chức|kéo dài thời hạn phục vụ|nghỉ hưu|phê chuẩn kết quả bầu|thi đua|khen thưởng|huân chương|chuyển giao nguyên trạng|giải thể|kỷ luật đối với|quy hoạch|chủ trương đầu tư|thành lập thành phố|xếp lương viên chức|quy chuẩn kỹ thuật|chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức|cựu chiến binh|năng lượng|đi làm việc ở nước ngoài|chuẩn mực kiểm toán|cán bộ, công chức|viên chức)/i;

export function scoreDoc(it, idx = LEGAL_INDEX) {
  const k = soKey(it.so);
  const own = idx.known[k];
  if (own) return { score: 0, level: '', status: 'known', topics: own.topics, matched: [own.so], reasons: ['Văn bản này đã có trong cẩm nang'] };
  const text = fold(it.trich_yeu).replace(STRIP_RE, ' ');
  const low = text.toLowerCase();
  const tscore = {}; const reasons = []; const matched = [];
  for (const so of text.match(NUM_RE) || []) {
    const kn = idx.known[soKey(so)];
    if (kn && soKey(so) !== k && !matched.includes(kn.so)) { matched.push(kn.so); for (const t of kn.topics) tscore[t] = (tscore[t] || 0) + 60; }
  }
  let score = 0;
  if (matched.length) { score += 60; reasons.push('Nhắc tới văn bản đang dùng trong cẩm nang: ' + matched.join(', ')); }
  let kwBest = 0, kwTopics = 0;
  for (const t of idx.topics) {
    let best = 0, hit = '';
    for (const [w, pts] of t.keywords) if (low.includes(w.toLowerCase()) && pts > best) { best = pts; hit = w; }
    for (const [p, pts] of t.patterns) if (new RegExp(p, 'i').test(text) && pts > best) { best = pts; hit = 'nghỉ lễ, Tết'; }
    if (best) { tscore[t.key] = (tscore[t.key] || 0) + best; kwTopics++; kwBest = Math.max(kwBest, best); reasons.push(`Từ khóa "${hit}" → ${t.name}`); }
  }
  if (kwBest) score += kwBest + Math.min(20, (kwTopics - 1) * 10);
  if (score > 0) {
    const [tname, tb] = typeOf(it.so); score += tb; if (tb) reasons.push(`${tname} (${tb > 0 ? '+' : ''}${tb})`);
    if (ISSUER_RE.test(k)) { score += 10; reasons.push('Cơ quan ban hành thuộc lĩnh vực tài chính / lao động (+10)'); }
    if (NEG_RE.test(text)) { score -= 50; reasons.push('Có dấu hiệu văn bản nhân sự / tổ chức bộ máy (-50)'); }
  }
  const topics = Object.entries(tscore).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const level = score >= 60 ? 'cao' : score >= 45 ? 'tb' : score >= 30 ? 'thap' : '';
  // Chỉ đưa vào "Chờ duyệt" văn bản phổ biến, quan trọng (≥45) hoặc sửa đổi văn bản đang dùng trong cẩm nang.
  // Điểm 30–44: ghi nhận ở "Tự bỏ qua" để anh tra lại khi cần.
  const pending = score >= 45 || (matched.length && score >= 30);
  if (level && !pending) reasons.push('Điểm dưới 45 – ít phổ biến với kế toán, chủ DN nhỏ: chỉ ghi nhận');
  return { score, level, status: pending ? 'pending' : 'ignored', topics, matched, reasons };
}

/* ---------- AI tóm tắt (không bắt buộc) ---------- */
export const aiProvider = env => env.ANTHROPIC_API_KEY ? 'claude:' + (env.AI_MODEL || 'claude-haiku-4-5') : env.AI ? 'workers-ai:' + (env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast') : 'rule';
const SYS = 'Bạn là trợ lý pháp chế thuế – kế toán – lao động Việt Nam. Bạn chỉ dựa trên thông tin được cung cấp, KHÔNG suy đoán nội dung chi tiết (mức thuế, số tiền, thời hạn, đối tượng) nếu thông tin đó không có trong trích yếu. Trả lời đúng một đối tượng JSON, không thêm chữ nào khác.';
function buildPrompt(it, det, sc, idx = LEGAL_INDEX) {
  const topics = idx.topics.map(t => `- ${t.key}: ${t.name}. Văn bản chính: ${t.docs.slice(0, 6).map(d => d.so).join(', ')}`).join('\n');
  return `CÁC CHỦ ĐỀ TRONG CẨM NANG:\n${topics}\n\nVĂN BẢN MỚI:\n- Số hiệu: ${it.so}\n- Loại: ${det.loai || typeOf(it.so)[0]}\n- Cơ quan ban hành: ${det.co_quan || '(không rõ)'}\n- Ngày ban hành: ${it.ngay}\n- Ngày có hiệu lực: ${det.hieu_luc || '(trang nguồn chưa ghi)'}\n- Trích yếu: ${it.trich_yeu}\n- Bộ lọc tự động ghi nhận: ${sc.reasons.join('; ')}\n
Hãy đánh giá văn bản này có làm thay đổi / bổ sung nội dung cẩm nang cho kế toán, chủ doanh nghiệp nhỏ hay không. Trả về JSON:
{"lien_quan": true|false, "muc_do": "cao"|"tb"|"thap", "chu_de": ["mã chủ đề", ...], "tieu_de": "≤ 90 ký tự, nói văn bản làm gì", "tom_tat": "1–2 câu, chỉ dựa trên trích yếu", "anh_huong": "mục nào của cẩm nang có thể phải cập nhật và vì sao; nếu chưa chắc ghi: Cần đọc toàn văn để xác định", "viec_can_lam": "1 câu việc kế toán / chủ DN nên làm", "diem_chinh": ["các điểm cập nhật chính, mỗi ý 1 câu, chỉ lấy từ thông tin đã cho"], "de_xuat": "duyet"|"loai", "ly_do_de_xuat": "1 câu"}
Đề xuất "duyet" chỉ khi văn bản phổ biến với kế toán, chủ doanh nghiệp nhỏ và khớp chủ đề đã có trong cẩm nang; ngược lại "loai".
"cao" = thay đổi trực tiếp nghĩa vụ thuế, hóa đơn, lương, BHXH, hợp đồng lao động của doanh nghiệp; "tb" = có thể ảnh hưởng một nhóm doanh nghiệp; "thap" = chỉ cần biết.`;
}
async function callAI(env, prompt) {
  if (env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: AbortSignal.timeout(45000),
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.AI_MODEL || 'claude-haiku-4-5', max_tokens: 800, system: SYS, messages: [{ role: 'user', content: prompt }] }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('Claude API ' + r.status + ': ' + (d.error?.message || ''));
    return (d.content || []).map(c => c.text || '').join('');
  }
  if (env.AI) {
    const d = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [{ role: 'system', content: SYS }, { role: 'user', content: prompt }], max_tokens: 800 });
    return typeof d?.response === 'string' ? d.response : JSON.stringify(d?.response ?? '');
  }
  return '';
}
function parseAI(text, idx = LEGAL_INDEX) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  let o; try { o = JSON.parse(text.slice(a, b + 1)); } catch { return null; }
  const keys = new Set(idx.topics.map(t => t.key));
  const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  return {
    lien_quan: o.lien_quan !== false, muc_do: ['cao', 'tb', 'thap'].includes(o.muc_do) ? o.muc_do : '',
    chu_de: (Array.isArray(o.chu_de) ? o.chu_de : []).filter(k => keys.has(k)),
    tieu_de: str(o.tieu_de, 160), tom_tat: str(o.tom_tat, 800), anh_huong: str(o.anh_huong, 600), viec_can_lam: str(o.viec_can_lam, 400),
    diem_chinh: (Array.isArray(o.diem_chinh) ? o.diem_chinh : []).map(x => str(x, 400)).filter(Boolean).slice(0, 10),
    de_xuat: o.de_xuat === 'loai' ? 'reject' : o.de_xuat === 'duyet' ? 'approve' : '', ly_do: str(o.ly_do_de_xuat, 300),
    hieu_luc: str(o.hieu_luc, 80),
  };
}
const topicName = k => LEGAL_INDEX.topics.find(t => t.key === k)?.name || k;
function ruleText(it, det, sc) {
  const loai = det.loai || typeOf(it.so)[0];
  return {
    title: it.trich_yeu.length > 120 ? it.trich_yeu.slice(0, 117) + '…' : it.trich_yeu,
    summary: `${loai} ${it.so}${det.co_quan ? ' của ' + det.co_quan : ''}, ban hành ${it.ngay}${det.hieu_luc ? ', có hiệu lực từ ' + det.hieu_luc : ''}: ${it.trich_yeu}`,
    impact: sc.topics.length ? `Có thể liên quan chủ đề: ${sc.topics.map(topicName).join(', ')}. Cần đọc toàn văn để xác định mục cần cập nhật.` : 'Cần đọc toàn văn để xác định.',
    action: 'Đọc toàn văn văn bản gốc, đối chiếu với nội dung tương ứng trong cẩm nang trước khi áp dụng.',
  };
}

/* ---------- AI đọc toàn văn (anh dán nội dung bản Word / PDF có chữ) ---------- */
export async function summarizeFullText(env, row, text, idx = LEGAL_INDEX) {
  if (!env.ANTHROPIC_API_KEY && !env.AI) throw new Error('Chưa bật AI (Workers AI hoặc Claude) cho trang quản trị.');
  const body = String(text || '').replace(/[ \t]+\n/g, '\n').slice(0, 24000);
  const topics = idx.topics.map(t => `- ${t.key}: ${t.name}`).join('\n');
  const prompt = `CÁC CHỦ ĐỀ TRONG CẨM NANG:\n${topics}\n\nTOÀN VĂN VĂN BẢN ${row.so_hieu || ''} (${row.trich_yeu || ''}):\n<<<\n${body}\n>>>\n
Đọc toàn văn trên và trả về JSON cho kế toán, chủ doanh nghiệp nhỏ:
{"tieu_de": "≤ 110 ký tự, nêu điểm mới quan trọng nhất", "tom_tat": "2–3 câu", "diem_chinh": ["mỗi điểm cập nhật 1 câu, có số liệu, đối tượng, điều kiện, thời hạn ĐÚNG như văn bản, ghi (Điều x) nếu có"], "hieu_luc": "ngày có hiệu lực / thời gian áp dụng như văn bản ghi", "anh_huong": "chủ đề nào của cẩm nang cần sửa, sửa gì", "viec_can_lam": "1–2 câu", "chu_de": ["mã chủ đề"], "muc_do": "cao"|"tb"|"thap", "lien_quan": true|false, "de_xuat": "duyet"|"loai", "ly_do_de_xuat": "1 câu"}
Chỉ dùng thông tin có trong văn bản. Không có thì để chuỗi rỗng.`;
  const a = parseAI(await callAI(env, prompt));
  if (!a) throw new Error('AI trả lời không đúng định dạng, anh bấm thử lại.');
  return { title: a.tieu_de, summary: a.tom_tat, key_points: a.diem_chinh.join('\n'), hieu_luc: a.hieu_luc, impact: a.anh_huong, action: a.viec_can_lam,
    topics: a.chu_de.join(','), level: a.muc_do, recommend: a.de_xuat, recommend_note: a.ly_do, ai: aiProvider(env) };
}

/* ---------- Quét ---------- */
export async function scan(env, opt = {}) {
  const o = { ...DEFAULTS, ...opt };
  await ensureLegalSchema(env);
  const t0 = Date.now();
  const running = await env.DB.prepare(`SELECT id FROM legal_scans WHERE finished_at = 0 AND started_at > ?1 LIMIT 1`).bind(t0 - 5 * 60000).first();
  if (running && !o.force) return { ok: false, error: 'Đang có một lượt quét chạy, vui lòng chờ vài phút.' };
  const scanId = (await env.DB.prepare(`INSERT INTO legal_scans (trigger, started_at, ai) VALUES (?1, ?2, ?3) RETURNING id`).bind(o.trigger || 'manual', t0, aiProvider(env)).first()).id;
  const notes = [];
  const log = { ok: false, fetched: 0, new_count: 0, candidates: 0, ai: aiProvider(env), error: '' };
  try {
    const all = new Map();
    for (const [label, path] of LIST_URLS) {
      try {
        const rows = parseList(await get(BASE + path));
        if (!rows.length) notes.push(`${label}: đọc được 0 văn bản (trang nguồn có thể đã đổi cấu trúc)`);
        for (const x of rows) if (!all.has(x.docid)) all.set(x.docid, { ...x, list: label });
      } catch (e) { notes.push(`${label}: ${e.message || e}`); }
    }
    log.fetched = all.size;
    if (!all.size) throw new Error('Không đọc được văn bản nào từ chinhphu.vn. ' + notes.join(' · '));

    const ids = [...all.keys()]; const have = new Set();
    for (let i = 0; i < ids.length; i += 80) {
      const part = ids.slice(i, i + 80);
      const { results } = await env.DB.prepare(`SELECT docid FROM legal_docs WHERE source = ?1 AND docid IN (${part.map((_, j) => '?' + (j + 2)).join(',')})`).bind(SOURCE, ...part).all();
      for (const r of results) have.add(r.docid);
    }
    const fresh = ids.filter(i => !have.has(i)).map(i => all.get(i));
    log.new_count = fresh.length;

    const now = Date.now();
    const rows = fresh.map(it => {
      const sc = scoreDoc(it); const iso = toIso(it.ngay);
      let status = sc.status;
      if (status === 'pending' && iso && (now - Date.parse(iso)) / 864e5 > o.maxAgeDays) {
        status = 'ignored'; sc.reasons.push(`Ban hành trước hơn ${o.maxAgeDays} ngày – chỉ ghi nhận, nên rà xem cẩm nang đã có chưa`);
      }
      return { it, sc, iso, status, det: {}, ai: null };
    });
    const cands = rows.filter(r => r.status === 'pending').sort((a, b) => b.sc.score - a.sc.score);
    log.candidates = cands.length;
    for (const [i, r] of cands.entries()) {
      if (i >= o.maxEnrich) { r.sc.reasons.push('Vượt số văn bản phân tích mỗi lượt – chưa đọc trang chi tiết'); continue; }
      try { r.det = parseDetail(await get(docUrl(r.it.docid))); } catch (e) { notes.push(`Chi tiết ${r.it.so}: ${e.message}`); }
      if (log.ai !== 'rule') {
        try { r.ai = parseAI(await callAI(env, buildPrompt(r.it, r.det, r.sc))); if (!r.ai) notes.push(`AI ${r.it.so}: trả lời không đúng định dạng`); }
        catch (e) { notes.push(`AI ${r.it.so}: ${e.message}`); }
      }
      if (r.ai && !r.ai.lien_quan && r.sc.score < 45) { r.status = 'ignored'; r.sc.reasons.push('AI đánh giá không liên quan'); }
      else if (r.ai && !r.ai.lien_quan) r.sc.reasons.push('AI cho rằng ít liên quan – anh xem lại');
    }

    const stmts = rows.map(r => {
      const rt = ruleText(r.it, r.det, r.sc); const a = r.ai;
      const topics = (a?.chu_de?.length ? a.chu_de : r.sc.topics).join(',');
      const level = r.status === 'pending' ? (a?.muc_do || r.sc.level) : r.sc.level;
      return env.DB.prepare(`INSERT OR IGNORE INTO legal_docs (source, docid, so_hieu, loai, co_quan, ngay_ban_hanh, ngay_bh_iso, hieu_luc, trich_yeu, url, pdf_url, list_name,
          score, level, topics, matched, reasons, title, summary, impact, action, ai, status, found_at, created_at, updated_at, key_points, recommend, recommend_note)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?24,?24,?25,?26,?27)`)
        .bind(SOURCE, r.it.docid, r.it.so, r.det.loai || typeOf(r.it.so)[0], r.det.co_quan || '', r.it.ngay, r.iso, r.det.hieu_luc || '', r.it.trich_yeu,
          docUrl(r.it.docid), r.it.pdf || '', r.it.list, r.sc.score, level, topics, r.sc.matched.join(', '), r.sc.reasons.join(' · '),
          a?.tieu_de || rt.title, a?.tom_tat || rt.summary, a?.anh_huong || rt.impact, a?.viec_can_lam || rt.action,
          r.status === 'pending' ? (a ? log.ai : 'rule') : '', r.status, now,
          (a?.diem_chinh || []).join('\n'),
          r.status !== 'pending' ? '' : a?.de_xuat || (r.sc.score >= 45 ? 'approve' : 'reject'),
          r.status !== 'pending' ? '' : a?.ly_do || (r.sc.score >= 60 ? 'Điểm lọc cao, khớp chủ đề cẩm nang' : 'Khớp chủ đề cẩm nang – anh xem văn bản gốc trước khi duyệt'));
    });
    stmts.push(env.DB.prepare(`DELETE FROM legal_docs WHERE status IN ('ignored','known') AND found_at < ?1`).bind(now - o.keepDays * 864e5));
    stmts.push(env.DB.prepare(`DELETE FROM legal_scans WHERE started_at < ?1`).bind(now - 365 * 864e5));
    for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
    log.ok = true;
    log.pending = rows.filter(r => r.status === 'pending').map(r => ({ so: r.it.so, score: r.sc.score, level: r.ai?.muc_do || r.sc.level }));
  } catch (e) {
    log.error = String(e.message || e).slice(0, 1000);
  }
  await env.DB.prepare(`UPDATE legal_scans SET finished_at = ?1, ok = ?2, fetched = ?3, new_count = ?4, candidates = ?5, error = ?6, detail = ?7 WHERE id = ?8`)
    .bind(Date.now(), log.ok ? 1 : 0, log.fetched, log.new_count, log.candidates, log.error, notes.join(' · ').slice(0, 3000), scanId).run();
  log.notes = notes; log.scanId = scanId;
  return log;
}

/* ---------- Dữ liệu cho trang cẩm nang ---------- */
/* Tần suất quét: Worker được gọi mỗi ngày 08:00, tự bỏ qua nếu chưa đủ số ngày đặt trong Cài đặt (legal_scan_every_days) */
export async function cronDue(env) {
  await ensureLegalSchema(env);
  const v = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'legal_scan_every_days'`).first('value').catch(() => null);
  const days = Math.min(30, Math.max(1, parseInt(v || '1', 10) || 1));
  const last = await env.DB.prepare(`SELECT started_at FROM legal_scans WHERE trigger = 'cron' AND ok = 1 ORDER BY id DESC LIMIT 1`).first('started_at');
  const due = !last || Date.now() - last >= days * 864e5 - 3 * 3600e3; // trừ hao 3 giờ để không lệch sang hôm sau
  return { due, days, last: last || 0 };
}

/* ---------- Dữ liệu cho trang cẩm nang: tin theo tháng + lịch sử ---------- */
const idx_has = k => !!k && LEGAL_INDEX.topics.some(t => t.key === k);
const VN_MONTH = `strftime('%Y-%m', approved_at / 1000 + 7 * 3600, 'unixepoch')`;
const vnDay = ms => { const d = new Date(ms + 7 * 3600e3); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
export async function publicUpdates(env, opt = {}) {
  await ensureLegalSchema(env);
  const { results: months } = await env.DB.prepare(`SELECT ${VN_MONTH} AS month, COUNT(*) AS n FROM legal_docs WHERE status = 'approved' AND approved_at > 0 GROUP BY month ORDER BY month DESC`).all();
  const nowMonth = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);
  let month = String(opt.month || '');
  let fallback = false;
  if (month !== 'all' && !/^\d{4}-\d{2}$/.test(month)) {
    month = nowMonth;
    if (!months.some(m => m.month === month) && months.length) { month = months[0].month; fallback = true; }
  }
  const topic = idx_has(opt.topic) ? opt.topic : '';
  const conds = [], binds = [];
  if (month !== 'all') { binds.push(month); conds.push(`${VN_MONTH} = ?${binds.length}`); }
  if (topic) { binds.push(topic); conds.push(`instr(',' || topics || ',', ',' || ?${binds.length} || ',') > 0`); }
  const { results } = await env.DB.prepare(`SELECT id, so_hieu, loai, co_quan, ngay_ban_hanh, hieu_luc, title, summary, key_points, impact, action, level, topics, url, pdf_url, in_handbook, approved_at
      FROM legal_docs WHERE status = 'approved' AND approved_at > 0 ${conds.map(c => 'AND ' + c).join(' ')} ORDER BY approved_at DESC, id DESC LIMIT 300`).bind(...binds).all();
  const { results: allTopics } = await env.DB.prepare(`SELECT topics FROM legal_docs WHERE status = 'approved' AND approved_at > 0`).all();
  const topic_counts = {}; for (const r of allTopics) for (const k of String(r.topics || '').split(',').filter(Boolean)) topic_counts[k] = (topic_counts[k] || 0) + 1;
  const sub = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'subscribe_open'`).first('value').catch(() => null);
  const { results: pend } = await env.DB.prepare(`SELECT so_hieu, title, url, topics FROM legal_docs WHERE status = 'approved' AND in_handbook = 0 ORDER BY approved_at DESC LIMIT 50`).all();
  const last = await env.DB.prepare(`SELECT finished_at FROM legal_scans WHERE ok = 1 ORDER BY id DESC LIMIT 1`).first('finished_at');
  const split = v => v ? v.split(',').filter(Boolean) : [];
  return {
    month, topic, topic_counts, total: allTopics.length, subscribe_open: sub !== '0', current_month: nowMonth, fallback, months,
    updates: results.map(r => ({ ...r, posted: vnDay(r.approved_at), topics: split(r.topics), key_points: r.key_points ? r.key_points.split('\n').map(x => x.trim()).filter(Boolean) : [], level_label: LEVELS[r.level] || '' })),
    handbook_pending: pend.map(r => ({ ...r, topics: split(r.topics) })),
    topics: Object.fromEntries(LEGAL_INDEX.topics.map(t => [t.key, t.name])),
    last_scan: last || 0, source: 'Cổng TTĐT Chính phủ (chinhphu.vn)',
  };
}
