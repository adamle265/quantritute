// node _kiem-tra-mau.js → in cảnh báo của dữ liệu mẫu tại ngày chốt 31/10/2026 + kiểm tra file tháng mới
global.fflate = require('./vendor/fflate.umd.js');
const HR = require('./src/core.js'); global.HR = HR; const HRR = require('./src/rules.js'), XR = require('./src/xlsx-reader.js');
const fs = require('fs'), path = require('path'); const { scanDir } = require('./tao-du-lieu-mau.js');
const FOLDER = process.argv[2] || 'Du_lieu_nhan_su_Dom_Sang_Edu';
const r = scanDir(path.join(__dirname, 'du-lieu-mau', FOLDER), () => {});
const unit = { id: 'u1', name: FOLDER, data: r.data }, R = process.env.REF || '2026-10-31';
console.log(HR.summary(r.data));
const d = HR.dashboard([unit], { ref: R, contractDays: 45 });
console.log('Đang làm', d.staff.working, '· thai sản', d.staff.maternity, '· vào T10', d.moves.joined.length, '· nghỉ T10', d.moves.left.length, '· HĐ sắp hết', d.contracts.soon.length, '· quá hạn', d.contracts.overdue.length);
d.months.forEach(m => console.log('  Lương', m.ym, m.people, 'người, tổng TN', HRR.fmtMoney(m.gross), 'thực lĩnh', HRR.fmtMoney(m.net)));
const al = HRR.alerts(unit, R); console.log('CẢNH BÁO:', al.length);
al.forEach(a => console.log(' [' + HRR.LV[a.level] + '] ' + a.kind + ' ' + (a.id || '-') + ' ' + a.name + ': ' + a.title));
['2026-08', '2026-09'].forEach(m => { const pc = HRR.payrollCheck(r.data, m); const bad = Object.keys(pc.byId).filter(k => pc.byId[k].length); console.log('Đối chiếu lương', m, bad.length ? bad.map(k => k + ': ' + pc.byId[k].map(x => x.t).join('; ')).join(' | ') : 'khớp hết'); });
const f = path.join(__dirname, 'du-lieu-mau', 'thang-moi', 'Bang_luong_2026_T10.xlsx'); if (process.argv[2]) process.exit(0); const wb = XR.open(fs.readFileSync(f), f);
const sh = HR.parseSheet(wb.getRows(wb.sheetNames[0]), wb.sheetNames[0], path.basename(f));
console.log('Nạp thử lương T10:', sh.type, sh.month, sh.count, 'dòng'); console.log(JSON.stringify(HRR.checkImport(unit, sh), null, 1));
