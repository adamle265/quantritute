// Ráp file công cụ: node build.js  (chạy trong thư mục nguon)
// Lõi HDCore + HDToKhai lấy từ Bộ xử lý hóa đơn (../../xu-ly-hoa-don/nguon/src) – chỉ đọc, không sửa.
const fs = require('fs'), path = require('path');
const VER = '1.0.4';
const NGAY = '30/10/2026'; // hiện ở góc trên: "Phiên bản cập nhật ngày …" (anh chốt 28/10)
const XL = fs.existsSync('src/hd-core.js') ? 'src' : path.join('..', '..', 'xu-ly-hoa-don', 'nguon', 'src');
const rd = f => fs.readFileSync(f, 'utf8');
const dom = JSON.parse(rd(fs.existsSync('dom.json') ? 'dom.json' : path.join('..', '..', 'xu-ly-hoa-don', 'nguon', 'dom.json')));
let html = rd('src/app.html');
html = html.split('{{CSS}}').join(rd(path.join(XL, 'style.css')));
html = html.split('{{CORE}}').join(rd(path.join(XL, 'hd-core.js')));
html = html.split('{{TOKHAI}}').join(rd(path.join(XL, 'hd-tokhai.js')));
html = html.split('{{TKDS}}').join(rd('src/tk-ds.js'));
html = html.split('{{APP}}').join(rd('src/app.js'));
for (const k in dom) html = html.split('{{' + k + '}}').join(dom[k]);
html = html.split('{{VER}}').join(VER).split('{{NGAY}}').join(NGAY);
const left = html.match(/\{\{[A-Za-z0-9-]+\}\}/); if (left) throw new Error('placeholder left: ' + left[0]);
// 29/10/2026: đưa lên web chung (anh chốt) – bỏ thẻ noindex của bản dùng thử riêng
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/index.html', html);
console.log('index.html', html.length, 'bytes, ban', VER);
// Bản đăng trang claude.ai (Artifact): bỏ khung doctype/html/head/body (trang tự bọc), bỏ script theo dõi của web
let art = html.replace(/<!DOCTYPE html>\s*/i, '').replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
  .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '').replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
  .replace(/<meta charset="utf-8">\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '').replace(/<script src="\/qtt-track\.js" defer><\/script>\s*/, '');
fs.writeFileSync('build/artifact.html', art);
console.log('artifact.html', art.length);
