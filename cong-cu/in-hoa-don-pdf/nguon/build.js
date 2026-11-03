// node build.js  →  build/index.html (1 file: bản web + bản tải về dùng không cần mạng)
const fs = require('fs');
const VER = '1.2.1', NGAY = '03/11/2026';
const rd = p => fs.readFileSync(p, 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = rd('src/ui.html');
const rep = { VER, NGAY, DOM: rd('dom64.txt').trim(), DOM02S: rd('assets/dom02s.txt').trim(), DOM02T: rd('assets/dom02t.txt').trim(), ENGINE: safe(rd('src/engine.js')),
  FFLATE: safe(rd('vendor/fflate.umd.js')), PDFLIB: safe(rd('vendor/pdf-lib.min.js')),
  PDFJS: safe(rd('vendor/pdf.min.js')), PDFJS_WORKER: safe(rd('vendor/pdf.worker.min.js')) };
for (const k in rep) html = html.split('{{' + k + '}}').join(rep[k]);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('placeholder left: ' + html.match(/\{\{[A-Z_]+\}\}/)[0]);
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/index.html', html);
console.log('build/index.html', (html.length / 1024).toFixed(0) + ' KB', 'ver', VER);
