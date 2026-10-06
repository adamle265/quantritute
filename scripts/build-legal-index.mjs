/* ============================================================
 * Dựng "chỉ mục căn cứ pháp lý" cho bộ theo dõi văn bản mới
 * Đọc:  cong-cu/cam-nang-thue-2026/app/index.html (dữ liệu TOPICS của cẩm nang)
 * Ghi:  src/legal-index.js
 * Chạy lại mỗi khi anh sửa nội dung cẩm nang:  npm run legal:index
 * ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = 'cong-cu/cam-nang-thue-2026/app/index.html';
const OUT = 'src/legal-index.js';

const html = readFileSync(SRC, 'utf8');
const s0 = html.lastIndexOf('<script');
const js = html.slice(html.indexOf('>', s0) + 1);
const stop = js.indexOf('function lawbookAvailable');
if (stop < 0) throw new Error('Không tìm thấy dữ liệu TOPICS trong cẩm nang (cấu trúc file đã đổi?).');
const ctx = {};
vm.runInNewContext(js.slice(0, stop) + '\nthis.__T = TOPICS;', ctx);
const TOPICS = ctx.__T;

/* Từ khóa nhận diện văn bản mới theo từng chủ đề của cẩm nang.
 * w = điểm cộng khi trích yếu chứa từ khóa. Sửa trực tiếp ở đây nếu cần. */
const KEYWORDS = {
  gtgt: [['thuế giá trị gia tăng', 35], ['GTGT', 35], ['hoàn thuế', 20], ['khấu trừ thuế', 20]],
  hoadon: [['hóa đơn', 35], ['hoá đơn', 35], ['chứng từ điện tử', 35], ['chứng từ khấu trừ', 30], ['máy tính tiền', 30]],
  tndn: [['thu nhập doanh nghiệp', 35], ['TNDN', 35], ['ưu đãi thuế', 25]],
  tncn: [['thu nhập cá nhân', 35], ['TNCN', 35], ['giảm trừ gia cảnh', 35]],
  gdlk: [['giao dịch liên kết', 40], ['chuyển giá', 30]],
  qlt: [['quản lý thuế', 35], ['chế độ kế toán', 35], ['chuẩn mực kế toán', 35], ['Luật Kế toán', 35], ['kế toán', 25],
    ['hộ kinh doanh', 30], ['cá nhân kinh doanh', 30], ['lệ phí môn bài', 30], ['xử phạt vi phạm hành chính về thuế', 35], ['khai thuế', 30],
    ['nộp thuế', 30], ['tiền thuế', 30], ['mã số thuế', 30], ['đăng ký thuế', 30], ['gia hạn thời hạn nộp', 35], ['miễn thuế', 25], ['giảm thuế', 25],
    ['thuế tiêu thụ đặc biệt', 25], ['thuế bảo vệ môi trường', 20], ['thuế suất', 20]],
  hdld: [['Bộ luật Lao động', 40], ['hợp đồng lao động', 35], ['người lao động', 30], ['tiền lương', 30], ['lương tối thiểu', 40], ['thời giờ làm việc', 35],
    ['thời giờ nghỉ ngơi', 35], ['an toàn, vệ sinh lao động', 30], ['công đoàn', 25], ['Luật Việc làm', 30], ['việc làm', 20], ['kỷ luật lao động', 35]],
  bhxh: [['bảo hiểm xã hội', 40], ['BHXH', 40], ['bảo hiểm thất nghiệp', 35], ['bảo hiểm y tế', 20], ['bảo hiểm tai nạn lao động', 35], ['lương hưu', 30], ['trợ cấp hưu trí', 30]],
};
/* Mẫu nhận diện thêm (biểu thức chính quy) */
const PATTERNS = {
  hdld: [['nghỉ[^.]{0,40}(lễ|tết)', 45]],
};

const NUM_RE = /\b\d{1,5}\/(?:\d{4}\/)?(?:QH\d{2}|NĐ-CP|ND-CP|TT-[A-ZĐ]+|QĐ-TTg|NQ-CP|VBHN-[A-ZĐ]+|UBTVQH\d{2}|TTLT-[A-ZĐ-]+|NQ-HĐTP|CT-TTg)\b/g;
const key = so => String(so).toUpperCase().replace(/Đ/g, 'D').replace(/\s+/g, '');

const topics = [];
const known = {}; // key → { so, topics: [..], core: bool }
for (const [k, t] of Object.entries(TOPICS)) {
  const name = String(t.name).replace(/&amp;/g, '&');
  const docs = (t.docs || []).map(d => ({ so: d.so, loai: d.loai, ten: d.ten, hieuluc: String(d.hieuluc || '').replace(/&amp;/g, '&'), tinhtrang: d.tinhtrang }));
  topics.push({ key: k, name, docs, keywords: KEYWORDS[k] || [], patterns: PATTERNS[k] || [] });
  for (const d of t.docs || []) {
    const kk = key(d.so); known[kk] = known[kk] || { so: d.so, topics: [], core: false };
    known[kk].core = true; if (!known[kk].topics.includes(k)) known[kk].topics.push(k);
  }
  // các số hiệu được nhắc trong nội dung chủ đề (memory, faq, quiz, lawbook liên quan…)
  const blob = JSON.stringify(t);
  for (const so of blob.match(NUM_RE) || []) {
    const kk = key(so); known[kk] = known[kk] || { so, topics: [], core: false };
    if (!known[kk].topics.includes(k)) known[kk].topics.push(k);
  }
}
// số hiệu chỉ xuất hiện ở phần khác của cẩm nang (tủ văn bản, công cụ…): vẫn ghi nhận là "đã có"
for (const so of html.match(NUM_RE) || []) { const kk = key(so); if (!known[kk]) known[kk] = { so, topics: [], core: false }; }

const out = `/* TỰ SINH bởi scripts/build-legal-index.mjs – không sửa tay. Nguồn: ${SRC}
 * Sinh lúc: ${new Date().toISOString()} · ${topics.length} chủ đề · ${Object.keys(known).length} số hiệu văn bản */
export const LEGAL_INDEX = ${JSON.stringify({ tool: 'cam-nang-thue-2026', generated: new Date().toISOString(), topics, known })};
`;
writeFileSync(OUT, out);
console.log(`Đã ghi ${OUT}: ${topics.length} chủ đề, ${Object.keys(known).length} số hiệu (${Object.values(known).filter(x => x.core).length} văn bản chính).`);
