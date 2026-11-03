// node kiem-thu/t8-doi-ten.js – kiểm lõi đặt tên file (bản 1.2.0) với 2 file Excel mẫu thật
const fs = require('fs'), path = require('path');
global.fflate = require('fflate');
const E = require('../src/engine.js');
const ok = (c, m) => { if (!c) { console.error('SAI:', m); process.exitCode = 1; } else console.log('đạt:', m); };
// 1. danh sách mẫu thật
const sh = E.readXlsx(new Uint8Array(fs.readFileSync(path.join(__dirname, 'Bảng kê hóa đơn đầu vào.xlsx'))));
const s = sh.find(x => x.name === '2609'); const hr = E.findHeaderRow(s.aoa), cols = E.guessCols(s.aoa[hr]);
ok(cols.mau === 1 && cols.kh === 2 && cols.so === 3 && cols.ngay === 4 && cols.ten === 6, 'nhận đúng cột mẫu số/ký hiệu/số/ngày/tên ' + JSON.stringify(cols));
const rows = E.buildRows(s.aoa, hr, cols);
const cfg = JSON.parse(JSON.stringify(E.DEFAULT_NAME));
const n2 = E.makeName(rows[1], 2, 4, cfg);
console.log('  ', n2);
ok(n2 === '0002_1_2609_1579_CÔNG TY TNHH VIẾT HẢI LOGISTICS', 'cú pháp mặc định STT_Mẫu số_YYMM_Số_Tên');
ok(E.makeName(rows[1], 2, 4, Object.assign({}, cfg, { boDau: true })) === '0002_1_2609_1579_CONG TY TNHH VIET HAI LOGISTICS', 'bỏ dấu tiếng Việt');
ok(E.makeName(rows[1], 2, 4, Object.assign({}, cfg, { boDau: true, noSpace: true })) === '0002_1_2609_1579_CONGTYTNHHVIETHAILOGISTICS', 'bỏ dấu + bỏ dấu cách');
// 2. ký tự cấm, tên quá dài, phần trống
const r = { mau: '', ngay: '2026-04-25', so: '98', ten: 'CÔNG TY A/B: "X" <Y> ' + 'RẤT DÀI '.repeat(40), khRaw: 'C26TAB', mst: '0110928376' };
const nm = E.makeName(r, 7, 4, cfg); console.log('  ', nm.slice(0, 90) + '…', nm.length);
ok(!/[\\/:*?"<>|]/.test(nm) && nm.length <= 170 && nm.startsWith('0007_2604_98_CÔNG TY A-B- -X- -Y-'), 'bỏ ký tự cấm, phần trống không để 2 dấu nối, cắt tên dài');
// 3. trùng tên
const u = E.uniqueNamer(); ok([u('a'), u('A'), u('a')].join('|') === 'a|A (2)|a (3)', 'trùng tên thêm (2), (3)');
// 4. không có danh sách
ok(E.makeName(null, 12, 4, cfg, 'Scan:01.pdf') === '0012_Scan-01', 'không danh sách: STT + tên gốc');
// 5. khớp tên file MISA với dòng danh sách
const k = E.extractKeys('0110928376_1_C26TAB_00000098_25042026_congtytnhhviethailogistics.pdf', false);
ok(k.pairs.has('C26TAB|98') && k.msts.has('0110928376'), 'tên file MISA: nhận ký hiệu + số + MST');
// 6. cả bảng mẫu: liệt kê vài tên + tên khác mẫu
let all = 0, bad = 0;
sh.forEach(x => {
  const h = E.findHeaderRow(x.aoa); if (h < 0) return; const c = E.guessCols(x.aoa[h]); if (c.so == null) return;
  E.buildRows(x.aoa, h, c).forEach((rw, i) => {
    all++; const n = E.makeName(rw, i + 1, 4, cfg);
    if (!/^\d{4}_\d+_\d{4}_\d+_\S/.test(n)) { bad++; if (bad < 8) console.log('   khác mẫu:', x.name, '|', n); }
  });
});
console.log('  tổng', all, 'dòng ở', sh.length, 'trang tính; tên khác mẫu STT_mẫu_YYMM_số_tên:', bad);
