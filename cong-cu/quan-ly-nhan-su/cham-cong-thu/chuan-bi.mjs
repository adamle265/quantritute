// Tạo database D1 "qtt-cham-cong-thu-db" nếu chưa có, rồi điền database_id vào wrangler.jsonc.
// Gọi từ trien-khai.cmd: node chuan-bi.mjs "<đường dẫn wrangler.cmd>"
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const WR = process.argv[2];
const NAME = 'qtt-cham-cong-thu-db';
const cfgPath = join(here, 'wrangler.jsonc');
function run(args) { return execSync('"' + WR + '" ' + args, { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }); }
function findDb() {
  const out = run('d1 list --json');
  const a = out.indexOf('['), b = out.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('Khong doc duoc danh sach database:\n' + out);
  return JSON.parse(out.slice(a, b + 1)).find(d => d.name === NAME);
}
// 11/11/2026: database đã có id trong wrangler.jsonc → bỏ qua bước hỏi danh sách (bước này hay lỗi khi phiên đăng nhập Cloudflare hết hạn / mạng chập chờn)
const cur = /"database_name":\s*"qtt-cham-cong-thu-db",\s*"database_id":\s*"([0-9a-f-]{36})"/.exec(readFileSync(cfgPath, 'utf8'));
if (cur) { console.log('Database: ' + NAME + ' (' + cur[1] + ') – đã có, bỏ qua bước kiểm tra'); process.exit(0); }
let db;
try { db = findDb(); } catch (e) { console.error('[Loi] Khong hoi duoc danh sach database tren Cloudflare. Thu: dang nhap lai bang lenh  npx wrangler login  (o thu muc quantritute) roi chay lai.'); process.exit(1); }
if (!db) {
  console.log('Tao database ' + NAME + ' ...');
  run('d1 create ' + NAME);
  db = findDb();
}
if (!db) { console.error('[Loi] Khong tao/tim thay database ' + NAME); process.exit(1); }
const id = db.uuid || db.database_id || db.id;
const cfg = readFileSync(cfgPath, 'utf8').replace(/("database_name":\s*"qtt-cham-cong-thu-db",\s*"database_id":\s*")[^"]*(")/, '$1' + id + '$2');
writeFileSync(cfgPath, cfg);
console.log('Database: ' + NAME + ' (' + id + ')');
