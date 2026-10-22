// node build.js  →  build/index.html (bản web + bản tải offline 1 file)
const fs = require('fs'), path = require('path');
const VER = '1.7.8';
const fflate = fs.readFileSync('vendor/fflate.umd.js', 'utf8');
const engine = fs.readFileSync('src/engine.js', 'utf8');
const shell = fs.readFileSync('src/worker-shell.js', 'utf8');
let worker = fflate + '\n;var fflate = self.fflate || (typeof module!=="undefined"&&module.exports) ;\n' + engine + '\nself.GDC = GDC;\n' + shell;
if (worker.indexOf('</script') >= 0) worker = worker.replace(/<\/script/gi, '<\\/script');
const dom = fs.readFileSync('dom64.txt', 'utf8').trim();
const dom16s = fs.readFileSync('assets/dom16s.txt', 'utf8').trim(), dom16t = fs.readFileSync('assets/dom16t.txt', 'utf8').trim(); // Đốm kính lúp (ảnh minh họa trang đầu)
let html = fs.readFileSync('src/ui.html', 'utf8');
html = html.split('{{VER}}').join(VER).split('{{DOM}}').join(dom).split('{{DOM16S}}').join(dom16s).split('{{DOM16T}}').join(dom16t);
html = html.replace('{{WORKER_SRC}}', () => worker);
if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error('placeholder left');
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/index.html', html);
console.log('build/index.html', (html.length / 1024).toFixed(0) + ' KB', 'ver', VER);
