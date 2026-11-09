// node tao-du-lieu-mau.js → assets/mau.b64 (kho dữ liệu mẫu tự dựng Đốm Sáng đã đọc sẵn, nén gzip, base64)
// Sửa dữ liệu mẫu: sửa tao-kho-du-lieu-mau.py → python tao-kho-du-lieu-mau.py → node tao-du-lieu-mau.js → node build.js
global.fflate = require('./vendor/fflate.umd.js');
const XR = require('./src/xlsx-reader.js'), HR = require('./src/core.js');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang');
function walk(d, base) { let out = []; for (const n of fs.readdirSync(d).sort()) { const p = path.join(d, n), st = fs.statSync(p); if (st.isDirectory()) out = out.concat(walk(p, base)); else if (/\.(xlsx|xlsm|xls)$/i.test(n) && !n.startsWith('~$')) out.push(p); } return out; }
function scanDir(root, logf) {
  const files = walk(root).map(p => {
    const rel = path.relative(root, p).split(path.sep).join('/');
    try { const wb = XR.open(fs.readFileSync(p), p); return { path: rel, mtime: fs.statSync(p).mtimeMs, sheets: wb.sheetNames.map(s => HR.parseSheet(wb.getRows(s), s, path.basename(p))) }; }
    catch (e) { return { path: rel, error: String(e.message || e) }; }
  });
  return HR.mergeFiles(files, logf);
}
if (require.main === module) {
  const lines = []; const r = scanDir(ROOT, l => lines.push(l));
  console.log(lines.join('\n')); console.log(HR.summary(r.data));
  const json = JSON.stringify({ name: 'Công ty TNHH Đốm Sáng (dữ liệu mẫu)', folder: 'Du_lieu_nhan_su_Dom_Sang', data: r.data, report: r.report.map(x => Object.assign({}, x)) });
  const gz = fflate.gzipSync(fflate.strToU8(json), { level: 9, mtime: 0 });
  fs.writeFileSync(path.join(__dirname, 'assets', 'mau.b64'), Buffer.from(gz).toString('base64'));
  console.log('JSON', (json.length / 1024).toFixed(0), 'KB → gzip base64', (gz.length * 4 / 3 / 1024).toFixed(0), 'KB');
}
module.exports = { scanDir };
