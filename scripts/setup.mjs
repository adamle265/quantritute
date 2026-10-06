// ============================================================
// Cài đặt tự động "Quản trị tử tế" lên Cloudflare
//   - 1 database D1 dùng chung:  quantritute-db
//   - Trang khách:               dự án Pages "quantritute"
//   - Trang quản trị (link riêng): dự án Pages "quantritute-admin"
// Chạy: npm run setup   (chạy lại nhiều lần vẫn an toàn, dữ liệu cũ được giữ)
// ============================================================
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const DB = 'quantritute-db';
const SITE = 'quantritute';
const ADMIN = 'quantritute-admin';
const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };
const step = (n, t) => console.log('\n' + c.b(`[${n}/7] ${t}`));

function wr(args, { cwd, input, show } = {}) {
  const r = spawnSync('npx', ['wrangler', ...args], {
    cwd, shell: true, encoding: 'utf8',
    input, stdio: show ? 'inherit' : [input !== undefined ? 'pipe' : 'inherit', 'pipe', 'pipe'],
  });
  return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') };
}
function die(msg, out) { console.log(c.r('\n✖ ' + msg)); if (out) console.log(out.slice(-2000)); process.exit(1); }

const rl = createInterface({ input: stdin, output: stdout });

step(1, 'Đăng nhập Cloudflare');
let who = wr(['whoami']);
if (!/associated with the email|You are logged in/i.test(who.out)) {
  console.log('Trình duyệt sẽ mở ra, anh bấm "Allow" để cho phép.');
  if (!wr(['login'], { show: true }).ok) die('Đăng nhập không thành công.');
}
console.log(c.g('✔ Đã đăng nhập.'));

step(2, 'Database D1');
let dbId = '';
const list = wr(['d1', 'list', '--json']);
try { dbId = (JSON.parse(list.out.slice(list.out.indexOf('['))).find(d => d.name === DB) || {}).uuid || ''; } catch { }
if (!dbId) {
  const cr = wr(['d1', 'create', DB]);
  const m = cr.out.match(/"?database_id"?\s*[:=]\s*"([0-9a-f-]{36})"/i);
  if (!m) die('Không tạo được database.', cr.out);
  dbId = m[1];
  console.log(c.g('✔ Đã tạo database ' + DB));
} else console.log(c.g('✔ Dùng database có sẵn ' + DB));
for (const f of ['site/wrangler.jsonc', 'admin/wrangler.jsonc', 'watch/wrangler.jsonc']) {
  const s = readFileSync(f, 'utf8').replace(/"database_id":\s*"[^"]*"/, `"database_id": "${dbId}"`);
  writeFileSync(f, s);
}

step(3, 'Tạo bảng và dữ liệu ban đầu');
const init = wr(['d1', 'execute', DB, '--remote', '--file=schema.sql', '--yes', '--config', 'site/wrangler.jsonc']);
if (!init.ok) die('Không chạy được schema.sql.', init.out);
console.log(c.g('✔ Database sẵn sàng (dữ liệu cũ được giữ nguyên).'));

step(4, 'Tạo 2 dự án Cloudflare Pages');
for (const p of [SITE, ADMIN]) {
  const r = wr(['pages', 'project', 'create', p, '--production-branch', 'main']);
  if (r.ok) console.log(c.g('✔ Đã tạo ' + p));
  else if (/already exists|8000002/i.test(r.out)) console.log(c.g('✔ Đã có ' + p));
  else die('Không tạo được dự án ' + p, r.out);
}

step(5, 'Mật khẩu trang quản trị');
const ans = (await rl.question('Đặt mật khẩu mới? (Enter = giữ mật khẩu cũ, gõ "y" = đặt mới / lần đầu): ')).trim().toLowerCase();
if (ans === 'y') {
  let pw = '';
  while (pw.length < 10) { pw = (await rl.question('Nhập mật khẩu quản trị (tối thiểu 10 ký tự): ')).trim(); if (pw.length < 10) console.log(c.y('Mật khẩu quá ngắn.')); }
  const r = wr(['pages', 'secret', 'put', 'ADMIN_TOKEN', '--project-name', ADMIN], { input: pw + '\n' });
  if (!r.ok) die('Không lưu được mật khẩu.', r.out);
  console.log(c.g('✔ Đã lưu mật khẩu. Ghi lại ở nơi an toàn.'));
}
rl.close();

step(6, 'Đưa trang khách lên mạng');
const d1 = wr(['pages', 'deploy', '--project-name', SITE, '--branch', 'main', '--commit-dirty=true'], { cwd: 'site' });
if (!d1.ok) die('Đưa trang khách lên không thành công.', d1.out);
const u1 = (d1.out.match(/https:\/\/[^\s]+\.pages\.dev/g) || []).pop();

step(7, 'Đưa trang quản trị lên mạng');
const d2 = wr(['pages', 'deploy', '--project-name', ADMIN, '--branch', 'main', '--commit-dirty=true'], { cwd: 'admin' });
if (!d2.ok) die('Đưa trang quản trị lên không thành công.', d2.out);
const u2 = (d2.out.match(/https:\/\/[^\s]+\.pages\.dev/g) || []).pop();

console.log('\n' + c.g(c.b('HOÀN TẤT')));
console.log('Trang khách:     ' + c.b(`https://${SITE}.pages.dev`) + (u1 ? `  (bản vừa đưa lên: ${u1})` : ''));
console.log('Trang quản trị:  ' + c.b(`https://${ADMIN}.pages.dev`) + (u2 ? `  (bản vừa đưa lên: ${u2})` : ''));
console.log(c.y('Lưu ý: lần đầu có thể mất 1–2 phút để địa chỉ .pages.dev hoạt động.'));
