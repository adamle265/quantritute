// Tạo src/demo-data.js cho BẢN THỬ (chamcong-thu): tài khoản nhân viên mẫu + thông tin xem được trên trang nhân viên.
// Nguồn: dữ liệu mẫu HƯ CẤU của Phần mềm quản lý nhân sự (../nguon/assets/mau.b64). Không chứa CCCD, số tài khoản, địa chỉ, SĐT.
// Chạy (trong thư mục cham-cong-thu): node tao-du-lieu-thu.cjs   – chạy lại mỗi khi bộ dữ liệu mẫu đổi.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const src = process.argv[2] || path.join(__dirname, '..', 'nguon', 'assets', 'mau.b64'), out = process.argv[3] || path.join(__dirname, 'src', 'demo-data.js');
const j = JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(src, 'utf8').trim(), 'base64')).toString());
const PIN = '123456';
const CONG_W = { 'X': 1, 'X/2': 0.5, 'CT': 1, 'TB': 1 }, PHEP = { 'P': 1, 'R': 1 }, LE = { 'L': 1 };
const cty = j.units.map(u => {
  const d = u.data, ten = u.name.replace(/\s*\(dữ liệu mẫu\)\s*/, ''), ymC = Object.keys(d.CC || {}).filter(m => (d.BL || {})[m]).sort().pop(), ymB = Object.keys(d.BL || {}).sort().pop();
  const ds = (d.NV || []).filter(e => e['Mã NV'] && !e['Ngày nghỉ việc']).map(e => {
    const ma = e['Mã NV'], hds = (d.HD || []).filter(h => h['Mã NV'] === ma).sort((a, b) => String(a['Ngày hiệu lực']).localeCompare(String(b['Ngày hiệu lực'])));
    const hd = hds.filter(h => !/hết hạn|chấm dứt|thanh lý/i.test(h['Tình trạng'] || '')).pop() || hds[hds.length - 1];
    const qp = (d.QP || []).find(x => x['Mã NV'] === ma), bl = ((d.BL || {})[ymB] || []).find(x => x['Mã NV'] === ma);
    const cc = ((d.CC || {})[ymC] || []).filter(r => r['Mã NV'] === ma), ngay = {}; let cong = 0, phep = 0, le = 0, tc = 0;
    cc.forEach(r => { const k = String(r['Ký hiệu'] || '').trim().toUpperCase(), dd = String(r['Ngày']).slice(8, 10); if (!k) return; ngay[dd] = k; cong += CONG_W[k] || 0; phep += PHEP[k] || 0; le += LE[k] || 0; tc += +r['Giờ tăng ca'] || 0; });
    return {
      ma, ten: e['Họ và tên'], pb: e['Phòng ban'] || '', cd: e['Chức danh công việc'] || e['Chức vụ'] || '', vao: e['Ngày vào làm'] || '', tt: e['Trạng thái'] || '', email: e['Email công ty'] || '',
      hd: hd ? { so: hd['Số hợp đồng'], loai: hd['Loại hợp đồng'], hl: hd['Ngày hiệu lực'], het: hd['Ngày hết hạn'] || '' } : null,
      qp: qp ? { nam: 2026, tong: qp['Tổng phép năm 2026'], da: qp['Đã nghỉ'], con: qp['Còn lại'] } : null,
      bl: bl ? { ym: ymB, lcb: bl['Lương cơ bản'], pc: bl['Phụ cấp chức vụ'] || 0, cong: bl['Ngày công thực tế'], chuan: bl['Công chuẩn'], tc: bl['Tiền tăng ca'], tong: bl['Tổng thu nhập'], bh: (bl['BHXH (8%)'] || 0) + (bl['BHYT (1,5%)'] || 0) + (bl['BHTN (1%)'] || 0) + (bl['Đoàn phí công đoàn (1%)'] || 0), thue: bl['Thuế TNCN'] || 0, tu: bl['Tạm ứng'] || 0, tl: bl['Thực lĩnh'] } : null,
      cong: cc.length ? { ym: ymC, du_lieu: { cong, phep, le, huong: cong + phep + le, tc, ngay } } : null,
      don: (d.DON || []).filter(x => x['Mã NV'] === ma).map(x => ({ so: x['Số đơn'], loai: x['Loại nghỉ'], tu: String(x['Từ ngày']).slice(0, 10), den: String(x['Đến ngày'] || x['Từ ngày']).slice(0, 10), so_ngay: x['Số ngày'], trang_thai: x['Trạng thái'] }))
    };
  });
  return { ten, ds };
});
fs.writeFileSync(out, '// TỰ SINH bởi tao-du-lieu-thu.cjs – DỮ LIỆU MẪU HƯ CẤU cho bản thử. Không sửa tay.\nexport const DEMO_PIN = ' + JSON.stringify(PIN) + ';\nexport const DEMO = ' + JSON.stringify({ ver: j.ver || '', cty }) + ';\n');
console.log(cty.map(c => c.ten + ': ' + c.ds.length + ' người').join(' · '), '→', out, fs.statSync(out).size, 'byte');
