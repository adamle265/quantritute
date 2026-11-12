// Tạo src/demo-data.js cho BẢN THỬ (chamcong-thu): tài khoản nhân viên mẫu + thông tin xem được trên trang nhân viên.
// Nguồn: dữ liệu mẫu HƯ CẤU của Phần mềm quản lý nhân sự (../nguon/assets/mau.b64). Không chứa CCCD, số tài khoản, địa chỉ, SĐT.
// Chạy (trong thư mục cham-cong-thu): node tao-du-lieu-thu.cjs   – chạy lại mỗi khi bộ dữ liệu mẫu đổi.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const src = process.argv[2] || path.join(__dirname, '..', 'nguon', 'assets', 'mau.b64'), out = process.argv[3] || path.join(__dirname, 'src', 'demo-data.js');
const j = JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(src, 'utf8').trim(), 'base64')).toString());
const PIN = '123456';
// 11/11 15:32: lễ tết lấy đúng thuật toán của phần mềm (LUNAR + holBuild trong chamcong.js) – không gõ tay ngày lễ
const ccSrc = fs.readFileSync(process.argv[4] || path.join(__dirname, '..', 'nguon', 'src', 'chamcong.js'), 'utf8');
const cut = (a, b) => { const i = ccSrc.indexOf(a); const j = ccSrc.indexOf(b, i); if (i < 0 || j < 0) throw new Error('Không tìm thấy ' + a); return ccSrc.slice(i, j); };
const HOL = new Function('HR', cut('var CC_CODES = [', '/* ---------- Âm lịch') + cut('var LUNAR = (function', 'return { toSolar: toSolar };') + 'return { toSolar: toSolar }; })();\n' +
  'function p2(n){return (n<10?"0":"")+n;} function ccIso(y,m,d){return y+"-"+p2(m)+"-"+p2(d);} function ccAdd(iso,n){var d=new Date(Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))+n*864e5);return ccIso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());} function ccDow(iso){return new Date(Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))).getUTCDay();}\n' +
  cut('  function holBuild(', '  function holOf(') + '\nreturn { holBuild: holBuild, codes: CC_CODES };')({ vnDate: iso => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) });
const LE_D = [].concat(HOL.holBuild(2026, { tet: '2+3', qk: '1/9', vh: true }, null), HOL.holBuild(2027, { tet: '2+3', qk: '1/9', vh: true }, null)).map(x => ({ d: x.d, t: x.t }));
const KTYPE = {}; HOL.codes.forEach(x => { KTYPE[x[0].toUpperCase()] = x[2]; });
const vnD = v => { v = String(v || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.slice(8, 10) + '/' + v.slice(5, 7) + '/' + v.slice(0, 4) : v; };
const money = v => Math.round(+v || 0).toLocaleString('vi-VN').replace(/,/g, '.');
const GT_SKIP = ['Mã NV', 'Họ và tên', 'Ghi chú hồ sơ'];
function slip(bl, cty, ym) { // phiếu lương mẫu đúng khuôn phiếu phần mềm gửi (/api/sync/phieu)
  const L = (g, t, v, f) => (+v ? { g, t, v: +v, f: f || '' } : null);
  const dong = [L('tn', 'Lương thời gian', bl['Lương thời gian'], '(' + money(bl['Lương cơ bản']) + (+bl['Phụ cấp chức vụ'] ? ' + phụ cấp chức vụ ' + money(bl['Phụ cấp chức vụ']) : '') + ') × ' + bl['Ngày công thực tế'] + '/' + bl['Công chuẩn'] + ' công'), L('tn', 'Lương hiệu suất', bl['Lương hiệu suất']), L('tn', 'Tiền tăng ca', bl['Tiền tăng ca'], (bl['Giờ tăng ca ngày thường'] || 0) + ' giờ ngày thường, ' + (bl['Giờ tăng ca Chủ nhật'] || 0) + ' giờ Chủ nhật'),
    L('tn', 'Phụ cấp làm đêm', bl['Phụ cấp làm đêm']), L('tn', 'Tiền ăn ca', bl['Tiền ăn ca']), L('tn', 'Phụ cấp xăng xe', bl['Phụ cấp xăng xe']), L('tn', 'Phụ cấp điện thoại', bl['Phụ cấp điện thoại']), L('tn', 'Phụ cấp chuyên cần', bl['Phụ cấp chuyên cần']), L('tn', 'Thưởng KPI', bl['Thưởng KPI']),
    L('bh', 'BHXH (8%)', bl['BHXH (8%)'], 'trên ' + money(bl['Lương đóng BH'])), L('bh', 'BHYT (1,5%)', bl['BHYT (1,5%)']), L('bh', 'BHTN (1%)', bl['BHTN (1%)']), L('bh', 'Đoàn phí công đoàn (1%)', bl['Đoàn phí công đoàn (1%)']), L('tax', 'Thuế TNCN', bl['Thuế TNCN'], 'thu nhập tính thuế ' + money(bl['Thu nhập tính thuế'])), L('kt', 'Tạm ứng', bl['Tạm ứng'])].filter(Boolean);
  const sum = g => dong.filter(x => x.g === g).reduce((t, x) => t + x.v, 0);
  // thu nhập = Tổng thu nhập trên bảng lương (dòng lẻ là các khoản cấu thành)
  return { cty, cong: 'Công ' + bl['Ngày công thực tế'] + '/' + bl['Công chuẩn'], tn: +bl['Tổng thu nhập'] || sum('tn'), bh: sum('bh'), thue: sum('tax'), kt: sum('kt'), tl: +bl['Thực lĩnh'] || 0, dong, mau: 1, ym };
}
// 11/11: phòng ban khối sản xuất, vận hành của dữ liệu mẫu (làm theo lịch xếp ca – khớp lcSample trong phần mềm) → máy chủ thử không tự sinh giờ chấm cố định 08–17
const SX_PB = ['Kho hàng', 'Xưởng Sản xuất', 'Xưởng Đóng gói'];
const CONG_W = { 'X': 1, 'X/2': 0.5, 'CT': 1, 'TB': 1, 'DM': 1, 'VS': 1 }, PHEP = { 'P': 1, 'R': 1 }, LE = { 'L': 1 };
function congOf(cc) {
  if (!cc.length) return null; const ngay = {}, ct = {}; let cong = 0, phep = 0, le = 0, tc = 0;
  cc.forEach(r => { const k = String(r['Ký hiệu'] || '').trim().toUpperCase(), dd = String(r['Ngày']).slice(8, 10); if (r['Giờ vào'] || r['Giờ ra']) ct[dd] = [r['Giờ vào'] || '', r['Giờ ra'] || '', +r['Đi muộn (phút)'] || 0, 0, r['Số giờ công'] != null ? +r['Số giờ công'] : null, +r['Giờ tăng ca'] || 0]; if (!k) return; ngay[dd] = k; cong += CONG_W[k] || 0; phep += PHEP[k] || 0; le += LE[k] || 0; tc += +r['Giờ tăng ca'] || 0; });
  const r2 = v => Math.round(v * 100) / 100; return { cong: r2(cong), phep: r2(phep), le: r2(le), huong: r2(cong + phep + le), tc: r2(tc), ngay, ct };
}
// 11/11 15:32: Xưởng Đóng gói không có bảng công trong file mẫu – phần mềm tự xếp lịch 3 ca (lcSample trong lichca.js). Chép đúng cách xếp đó để có công tháng 10, 11 trên trang nhân viên.
const SH_H = { F: ['08:00', '17:00', 8], 'Đ': ['22:00', '07:00', 8], S: ['07:00', '11:00', 4], C: ['13:00', '17:00', 4], T: ['18:00', '22:00', 4] };
const addD = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10), dowOf = iso => new Date(iso + 'T00:00:00Z').getUTCDay(), daysB = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
function dgSchedule(NV) {
  const DG = 'Xưởng Đóng gói', SXD = ['Kho hàng', 'Xưởng Sản xuất', DG], base = '2026-09-28', END = '2026-11-10', out = {}; let iDG = 0, iAll = 0;
  const restDow = (k, w) => [2, 5, 0, 3, 6, 1, 4][(k * 3 + w * 2) % 7];
  const dgPlan = (j, wk, dow) => { if (j < 4) { const A = (Math.floor(j / 2) + wk) % 2 === 0; return A ? 'F' : 'Đ'; } if (j === 4) return dow === 3 ? 'C' : 'S+T'; return dow === 5 ? 'S+C' : dow === 2 ? 'T' : 'C+T'; };
  NV.forEach(e => { const d0 = e['Phòng ban'], id = e['Mã NV']; if (!SXD.includes(d0) || !id) return; const join = String(e['Ngày vào làm'] || '').slice(0, 10), j = d0 === DG ? iDG++ : -1, k = iAll++; if (j < 0) return; const m = out[id] = {};
    for (let mo = '2026-07-27'; mo <= END; mo = addD(mo, 7)) { const w = daysB('2026-07-27', mo) / 7; if (mo < base) continue; const wk = daysB(base, mo) / 7;
      const rd = j < 4 && wk > 0 && dgPlan(j, wk - 1, 0) === 'Đ' && dgPlan(j, wk, 1) === 'F' ? 1 : restDow(k, w);
      for (let x = 0; x < 7; x++) { const iso = addD(mo, x); if (iso > END || (join && iso < join)) continue; m[iso] = dowOf(iso) === rd ? 'N' : dgPlan(j, wk, dowOf(iso)); } } });
  if (out.SG010) for (let z = '2026-11-02'; z <= '2026-11-08'; z = addD(z, 1)) if (out.SG010[z] === 'N') out.SG010[z] = out.SG010['2026-11-04'];
  if (out.SG012) out.SG012['2026-10-23'] = 'KL'; if (out.SG013) out.SG013['2026-11-06'] = 'P';
  return out;
}
function dgCong(m, ym, tam, upTo) { // công từ lịch: mã ca → giờ theo ca
  const ngay = {}, ct = {}; let cong = 0, gio = 0, phep = 0;
  Object.keys(m).filter(d => d.slice(0, 7) === ym && d <= upTo).forEach(d => { const k = m[d], dd = d.slice(8, 10); ngay[dd] = k; if (k === 'N') return; if (k === 'P') { phep++; return; } if (k === 'KL') return;
    const ps = k.split('+').map(x => SH_H[x]).filter(Boolean); if (!ps.length) return; const h = ps.reduce((t, x) => t + x[2], 0); cong++; gio += h; ct[dd] = [ps[0][0], ps[ps.length - 1][1], 0, 0, h, 0]; });
  if (!Object.keys(ngay).length) return null; return { cong, phep, le: 0, huong: cong + phep, tc: 0, gio, ngay, ct, ...(tam ? { tam: true } : {}) };
}
let REF = '';
const REF0 = (() => { let r = ''; j.units.forEach(u => Object.keys(u.data.CC || {}).forEach(ym => (u.data.CC[ym] || []).forEach(x => { const v = String(x['Ngày']).slice(0, 10); if (v > r) r = v; }))); return r; })();
const cty = j.units.map(u => {
  const d = u.data, ten = u.name.replace(/\s*\(dữ liệu mẫu\)\s*/, ''), ymC = Object.keys(d.CC || {}).filter(m => (d.BL || {})[m]).sort().pop(), ymB = Object.keys(d.BL || {}).sort().pop();
  const live = (d.NV || []).filter(e => e['Mã NV'] && !e['Ngày nghỉ việc']), byId = {}; live.forEach(e => { byId[e['Mã NV']] = e; });
  const head = {}; (d.PB || []).forEach(x => { if (x['Tên phòng ban'] && byId[x['Mã NV trưởng bộ phận']]) head[x['Tên phòng ban']] = x['Mã NV trưởng bộ phận']; });
  const gd = (live.find(e => /^giám đốc/i.test(String(e['Chức vụ'] || '').trim())) || {})['Mã NV'] || '';
  const kh = (d.KH || []).map(x => [x['Ký hiệu'], x['Ý nghĩa'], KTYPE[String(x['Ký hiệu']).toUpperCase()] || (/^Không$/.test(x['Công ty trả lương']) ? 'unpaid' : 'other')]);
  const DGS = dgSchedule(d.NV || []);
  const ds = live.map(e => {
    const ma = e['Mã NV'], hds = (d.HD || []).filter(h => h['Mã NV'] === ma).sort((a, b) => String(a['Ngày hiệu lực']).localeCompare(String(b['Ngày hiệu lực'])));
    const hd = hds.filter(h => !/hết hạn|chấm dứt|thanh lý/i.test(h['Tình trạng'] || '')).pop() || hds[hds.length - 1];
    const qp = (d.QP || []).find(x => x['Mã NV'] === ma), bl = ((d.BL || {})[ymB] || []).find(x => x['Mã NV'] === ma);
    // 08/11: bảng công từng tháng (các tháng đã chốt + tháng đang mở tạm tính) để nhân viên xem lại trên điện thoại
    const months = Object.keys(d.CC || {}).sort(), ymOpen = months[months.length - 1];
    const congs = months.map(ym => { const dl = congOf(((d.CC || {})[ym] || []).filter(r => r['Mã NV'] === ma)); if (!dl) return null; if (ym === ymOpen) dl.tam = true; return { ym, du_lieu: dl }; }).filter(Boolean);
    if (DGS[ma]) ['2026-10', '2026-11'].forEach(ym => { if (congs.some(c => c.ym === ym)) return; const dl = dgCong(DGS[ma], ym, ym === ymOpen, REF0); if (dl) congs.push({ ym, du_lieu: dl }); });
    // lượt chấm mẫu tháng đang mở (có giờ vào/ra trong file) → máy chủ thử nạp sẵn
    const p = (((d.CC || {})[ymOpen]) || []).filter(r => r['Mã NV'] === ma && (r['Giờ vào'] || r['Giờ ra'])).map(r => [String(r['Ngày']).slice(0, 10), r['Giờ vào'] || '', r['Giờ ra'] || '']);
    return {
      ma, ten: e['Họ và tên'], ld: /c[oộ]ng t[aá]c/i.test(e['Loại lao động'] || '') ? 'ctv' : /b[aá]n th[oờ]i/i.test(e['Loại lao động'] || '') ? 'pt' : '', pb: e['Phòng ban'] || '', // 09/11: loại lao động → giờ chấm mẫu cd: e['Chức danh công việc'] || e['Chức vụ'] || '', vao: e['Ngày vào làm'] || '', tt: e['Trạng thái'] || '', email: e['Email công ty'] || '',
      hd: hd ? { so: hd['Số hợp đồng'], loai: hd['Loại hợp đồng'], hl: hd['Ngày hiệu lực'], het: hd['Ngày hết hạn'] || '' } : null,
      qp: qp ? { nam: 2026, tong: qp['Tổng phép năm 2026'], da: qp['Đã nghỉ'], con: qp['Còn lại'] } : null,
      bl: bl ? { ym: ymB, lcb: bl['Lương cơ bản'], pc: bl['Phụ cấp chức vụ'] || 0, cong: bl['Ngày công thực tế'], chuan: bl['Công chuẩn'], tc: bl['Tiền tăng ca'], tong: bl['Tổng thu nhập'], bh: (bl['BHXH (8%)'] || 0) + (bl['BHYT (1,5%)'] || 0) + (bl['BHTN (1%)'] || 0) + (bl['Đoàn phí công đoàn (1%)'] || 0), thue: bl['Thuế TNCN'] || 0, tu: bl['Tạm ứng'] || 0, tl: bl['Thực lĩnh'] } : null,
      congs, p, sx: SX_PB.includes(e['Phòng ban']) ? 1 : 0,
      hs: (() => { // 11/11 15:32: hồ sơ cho mục Tôi (cùng khuôn phần mềm gửi khi bấm Đồng bộ; không có CCCD, số tài khoản, địa chỉ, SĐT)
        const pb = e['Phòng ban'] || '', hp = head[pb], ql = hp && hp !== ma ? hp : gd && gd !== ma ? gd : '', lss = (d.LS || []).filter(x => x['Mã NV'] === ma && String(x['Ngày hiệu lực']) <= REF0).sort((a, b) => String(a['Ngày hiệu lực']).localeCompare(String(b['Ngày hiệu lực']))), ls = lss[lss.length - 1];
        const ev = [];
        if (e['Ngày vào làm']) ev.push({ k: e['Ngày vào làm'], ty: 'vao', b: 'Vào làm – ' + pb, s: e['Chức danh công việc'] || e['Chức vụ'] || '' });
        hds.forEach(h => ev.push({ k: h['Ngày hiệu lực'] || h['Ngày ký'], ty: /thử việc/i.test(h['Loại hợp đồng']) ? 'tv' : 'hd', b: 'Ký ' + h['Loại hợp đồng'], s: 'Số ' + (h['Số hợp đồng'] || '') + (h['Ngày hết hạn'] ? ' · đến ' + vnD(h['Ngày hết hạn']) : ' · không thời hạn') }));
        lss.forEach(x => { if (x['Lương cũ']) ev.push({ k: x['Ngày hiệu lực'], ty: 'luong', b: 'Điều chỉnh lương', s: money(x['Lương cũ']) + ' → ' + money(x['Lương mới']) + (x['Lý do'] ? ' · ' + x['Lý do'] : '') }); });
        (d.QT || []).filter(x => x['Mã NV'] === ma && /Khen thưởng|Kỷ luật/.test(x['Loại quá trình'])).forEach(x => { const m = /^(\d{2})\/(\d{4})$/.exec(x['Từ tháng'] || ''); ev.push({ k: m ? m[2] + '-' + m[1] : '0000', t: x['Từ tháng'] || '', ty: x['Loại quá trình'] === 'Kỷ luật' ? 'kl' : 'kt', b: x['Loại quá trình'] + ': ' + (x['Nội dung'] || ''), s: x['Nơi'] || '' }); });
        ev.sort((a, b) => String(b.k).localeCompare(String(a.k)));
        const gt = (d.GT || []).find(x => x['Mã NV'] === ma) || {};
        return { ten: e['Họ và tên'], cty: ten, pb, cd: e['Chức danh công việc'] || e['Chức vụ'] || '', cv: e['Chức vụ'] || '', vao: e['Ngày vào làm'] || '', khoi: SX_PB.includes(pb) ? 'Sản xuất, vận hành' : 'Văn phòng', tt: e['Trạng thái'] || 'Đang làm việc',
          info: [['Ngày sinh', vnD(e['Ngày sinh'])], ['Giới tính', e['Giới tính']], ['Email', e['Email công ty']], ['Trình độ', e['Trình độ']], ['Tình trạng hôn nhân', e['Tình trạng hôn nhân']], ['Người phụ thuộc', e['Số người phụ thuộc']]].filter(x => x[1] != null && String(x[1]).trim() !== ''),
          hanh_trinh: ev.map(x => ({ t: x.t || vnD(x.k), ty: x.ty, b: x.b, s: x.s })),
          giay_to: Object.keys(gt).filter(k => !GT_SKIP.includes(k) && gt[k] !== 'Không áp dụng').map(k => ({ ten: k, tt: gt[k] ? 'Đã nộp' : 'Còn thiếu', ngay: gt[k] || '', n: 0 })),
          hop_dong: hds.slice().reverse().map(h => ({ so: h['Số hợp đồng'] || '', loai: h['Loại hợp đồng'] || '', hl: h['Ngày hiệu lực'] || '', het: h['Ngày hết hạn'] || '', tt: h['Tình trạng'] || '', hien_tai: h === hd ? 1 : 0, html: 0 })),
          kho: { hoso: 0, hd: 0 }, qp: qp ? { nam: 2026, tong: qp['Tổng phép năm 2026'], da: qp['Đã nghỉ'], cho: 0, con: qp['Còn lại'] } : null, ql, ql_ten: ql ? byId[ql]['Họ và tên'] : '', truong: hp === ma ? 1 : 0,
          luong: ls ? { lcb: +ls['Lương mới'] || 0, pc: +ls['Phụ cấp chức vụ'] || 0 } : null,
          lich: { tuan: SX_PB.includes(pb) ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5], ca: SX_PB.includes(pb) ? null : { ten: 'Ca hành chính', vao: '08:00', ra: '17:00' }, sx: SX_PB.includes(pb) ? 1 : 0 }, le: LE_D, kh };
      })(),
      phieu: Object.keys(d.BL || {}).sort().map(ym => { const b = (d.BL[ym] || []).find(x => x['Mã NV'] === ma); return b ? slip(b, ten, ym) : null; }).filter(Boolean),
      don: (d.DON || []).filter(x => x['Mã NV'] === ma).map(x => ({ so: x['Số đơn'], loai: x['Loại nghỉ'], tu: String(x['Từ ngày']).slice(0, 10), den: String(x['Đến ngày'] || x['Từ ngày']).slice(0, 10), so_ngay: x['Số ngày'], trang_thai: x['Trạng thái'] }))
    };
  });
  Object.keys(d.CC || {}).forEach(ym => (d.CC[ym] || []).forEach(r => { const x = String(r['Ngày']).slice(0, 10); if (x > REF) REF = x; }));
  return { ten, ds, kh };
});
fs.writeFileSync(out, '// TỰ SINH bởi tao-du-lieu-thu.cjs – DỮ LIỆU MẪU HƯ CẤU cho bản thử. Không sửa tay.\nexport const DEMO_PIN = ' + JSON.stringify(PIN) + ';\nexport const DEMO = ' + JSON.stringify({ ver: j.ver || '', ref: REF, ca: { vao: '08:00', ra: '17:00', thu: [1, 2, 3, 4, 5] }, cty }) + ';\n');
console.log(cty.map(c => c.ten + ': ' + c.ds.length + ' người').join(' · '), '→', out, fs.statSync(out).size, 'byte');
