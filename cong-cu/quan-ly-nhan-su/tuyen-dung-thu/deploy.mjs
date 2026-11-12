// Đưa Worker cổng tuyển dụng thử lên Cloudflare, tự xử lý lỗi 10021 "binding DB of type d1 failed to generate" (11/11/2026 20:05).
// Lỗi này nằm phía Cloudflare, gặp cả với database cũ; các dự án khác xử lý bằng cách chạy lại (vd. github.com/Artemev009/takt-shifts/pull/6).
// Cách làm: deploy đầy đủ → nếu 10021: deploy 1 lần bản "khung" không nối database (để Cloudflare tạo xong Worker + tên miền) → thử lại bản đầy đủ tối đa 6 lần, cách 30 giây.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), WR = process.argv[2];
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
function deploy(cfg) {
  const r = spawnSync('"' + WR + '"', ['deploy', '--config', cfg], { cwd: here, encoding: 'utf8', shell: true });
  const out = (r.stdout || '') + (r.stderr || ''); process.stdout.write(out);
  return { ok: r.status === 0, e10021: /10021|failed to generate/i.test(out) };
}
let r = deploy('wrangler.jsonc');
if (r.ok) process.exit(0);
if (!r.e10021) process.exit(1);
console.log('\n>> Gap loi 10021 phia Cloudflare. Dua len ban "khung" chua noi database truoc...');
const tmp = join(here, 'wrangler.khung.jsonc');
writeFileSync(tmp, readFileSync(join(here, 'wrangler.jsonc'), 'utf8').replace(/"d1_databases":\s*\[[\s\S]*?\],/, '').replace(/"triggers":\s*\{[\s\S]*?\},/, ''));
const k = deploy('wrangler.khung.jsonc'); try { unlinkSync(tmp); } catch (e) { }
console.log(k.ok ? '>> Ban khung da len. Thu lai ban day du...' : '>> Ban khung cung chua len duoc. Van thu lai ban day du...');
for (let i = 1; i <= 6; i++) {
  console.log('\n>> Doi 30 giay roi thu lai lan ' + i + '/6 ...'); await sleep(30);
  r = deploy('wrangler.jsonc'); if (r.ok) { console.log('>> Thanh cong o lan thu ' + i + '.'); process.exit(0); }
  if (!r.e10021) process.exit(1);
}
console.log('\n>> Sau 6 lan van loi 10021. Chup man hinh gui em; co the thu lai sau 15-30 phut.');
process.exit(1);
