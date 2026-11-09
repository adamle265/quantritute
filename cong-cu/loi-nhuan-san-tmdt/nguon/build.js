// node build.js  →  build/index.html (1 file: bản web + bản tải về dùng không cần mạng)
const fs = require('fs');
const VER='1.1.0', NGAY = '06/11/2026', SLUG = 'loi-nhuan-san-tmdt';
const rd = p => fs.readFileSync(p, 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = rd('src/ui.html');
const rep = { VER, NGAY, SLUG, DOM: rd('dom64.txt').trim(), BASECSS: rd('src/base.css'), CORE: safe(rd('src/core.js')), SAMPLE: safe(rd('src/sample.js')), APP: safe(rd('src/app.js')) };
// thay lần lượt; nội dung thay thế không được chứa {{…}} của bước sau
for (const k of ['BASECSS','CORE','SAMPLE','APP','VER','NGAY','SLUG','DOM']) html = html.split('{{' + k + '}}').join(rep[k]);
if (/\{\{(VER|NGAY|SLUG|DOM|BASECSS|CORE|SAMPLE|APP)\}\}/.test(html)) throw new Error('placeholder left');
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/index.html', html);
console.log('build/index.html', (html.length / 1024).toFixed(0) + ' KB', 'ver', VER);
