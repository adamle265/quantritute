// NHÁNH TUYỂN DỤNG 0.5.1 – build riêng (anh Tuấn yêu cầu 09/11: làm song song Module Lương, chưa tích hợp)
// node build.js  →  build/index.html (bản web + bản tải offline 1 file), rồi chép sang ../app/index.html
// Nếu đổi dữ liệu mẫu trong du-lieu-mau/: chạy  node tao-du-lieu-mau.js  trước.
const fs = require('fs'), path = require('path');
const VER = '0.5.1-thu'; // 09/11 14:45: bắt đầu Module Lương (B1 Thiết lập công thức lương – src/luong.js)
const rd = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = rd('src/ui.html');
const parts = {
  VER, DOM: rd('assets/dom64.txt').trim(), DOM_HERO: rd('assets/dom-hero.txt').trim(), MAU: rd('assets/mau.b64').trim(),
  FFLATE: safe(rd('vendor/fflate.umd.js')), TIPTAP: safe(rd('vendor/tiptap.iife.js')), JSQR: safe(rd('vendor/jsQR.min.js')), XLSX_READER: safe(rd('src/xlsx-reader.js')), CORE: safe(rd('src/core.js')), RULES: safe(rd('src/rules.js')), XLSX_WRITER: safe(rd('src/xlsx-writer.js')),
  APP: safe(rd('src/app.js').replace('/*@@PAGES@@*/', () => rd('src/pages.js')).replace('/*@@NHANSU@@*/', () => rd('src/nhansu.js')).replace('/*@@SOAN@@*/', () => rd('src/soanmau.js')).replace('/*@@CHAMCONG@@*/', () => rd('src/chamcong.js')).replace('/*@@LUONG@@*/', () => rd('src/luong.js') + '\n' + rd('src/bangluong.js') + '\n' + rd('src/phieuluong.js') + '\n' + rd('tuyendung.js')).replace('/*@@WFIMG@@*/null', () => (fs.existsSync(path.join(__dirname, 'assets/wf-huongdan.json')) ? fs.readFileSync(path.join(__dirname, 'assets/wf-huongdan.json'), 'utf8').trim() : 'null')))
};
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in parts)) throw new Error('Thiếu ' + k); return parts[k]; });
fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'build', 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'build', 'index.html'), path.join(__dirname, 'app', 'index.html')); // NHÁNH TUYỂN DỤNG: chỉ ghi vào _nhanh-tuyen-dung/app, không đụng app/ và cham-cong-thu/
console.log('build/index.html', (html.length / 1024).toFixed(0) + ' KB', 'bản', VER, '→ _nhanh-tuyen-dung/app/index.html');
