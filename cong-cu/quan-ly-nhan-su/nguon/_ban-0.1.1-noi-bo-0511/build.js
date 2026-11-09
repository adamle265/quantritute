// node build.js  →  build/index.html (bản web + bản tải offline 1 file), rồi chép sang ../app/index.html
// Nếu đổi dữ liệu mẫu trong du-lieu-mau/: chạy  node tao-du-lieu-mau.js  trước.
const fs = require('fs'), path = require('path');
const VER = '0.1.1';
const rd = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = rd('src/ui.html');
const parts = {
  VER, DOM: rd('assets/dom64.txt').trim(), DOM_HERO: rd('assets/dom-hero.txt').trim(), MAU: rd('assets/mau.b64').trim(),
  FFLATE: safe(rd('vendor/fflate.umd.js')), XLSX_READER: safe(rd('src/xlsx-reader.js')), CORE: safe(rd('src/core.js')), RULES: safe(rd('src/rules.js')), XLSX_WRITER: safe(rd('src/xlsx-writer.js')),
  APP: safe(rd('src/app.js').replace('/*@@PAGES@@*/', () => rd('src/pages.js')))
};
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in parts)) throw new Error('Thiếu ' + k); return parts[k]; });
fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'build', 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'build', 'index.html'), path.join(__dirname, '..', 'app', 'index.html'));
console.log('build/index.html', (html.length / 1024).toFixed(0) + ' KB', 'bản', VER, '→ đã chép sang app/index.html');
