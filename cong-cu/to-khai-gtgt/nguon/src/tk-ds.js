/* ==========================================================================
   TK-DS – Bảng kê tổng hợp & tờ khai 01/GTGT từ file "DANH SÁCH HÓA ĐƠN" (Excel)
   tải ở trang hoadondientu.gdt.gov.vn (Tra cứu hóa đơn → Xuất Excel).
   Đặt hàng của anh Phương (kế toán) qua anh Minh Tuấn, 28/10/2026.
   Dùng lại: HDCore (đọc .xlsx, ghi .xlsx, ngày tháng, số tiền),
             HDToKhai (dòng tờ khai, bảng kê theo nhóm, file XML HTKK) – không sửa 2 file đó.
   Quy tắc:
   - HĐ "đã bị thay thế", "đã bị hủy": liệt kê nhưng KHÔNG tính. HĐ "đã bị điều chỉnh" vẫn tính;
     HĐ "điều chỉnh" tính theo đúng dấu số tiền trên danh sách (âm = giảm) và cảnh báo kiểm tra.
   - Trùng (cùng MST người bán + mẫu số + ký hiệu + số HĐ) chỉ tính 1 lần.
   - Danh sách không có thuế suất → suy ra từ Tiền thuế / Tổng chưa thuế:
     khớp 1 mức (10%, 8%, 5%) thì lấy mức đó; không khớp → HĐ nhiều thuế suất, tách
     bằng 2 mức kề nhau (VD 8% + 10%) và đánh dấu "ước tính" để người dùng xác nhận / sửa.
   - HĐ 8% (NQ 204/2025/QH15) kê vào [32]/[33] với số thuế thực tế + phụ lục giảm thuế.
   ========================================================================== */
var TKDS = (function () {
  'use strict';
  var C = HDCore;
  var RATES = ['10%', '8%', '5%', '0%', 'KCT', 'KKKNT'];
  function r0(n) { return Math.round(+n || 0); }
  function low(s) { return C.boDau(String(s == null ? '' : s)).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function N(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    var s = String(v).trim().replace(/\s/g, '');
    if (/^-?\d+(\.\d+)?(e[-+]?\d+)?$/i.test(s)) return parseFloat(s);
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return C.num(s);
  }
  function mst(s) { return String(s == null ? '' : s).replace(/\s/g, '').trim(); }
  function ngay(v) {
    var s = String(v == null ? '' : v).trim();
    if (/^\d{4,5}(\.\d+)?$/.test(s)) { var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000); return C.pad(d.getUTCDate()) + '/' + C.pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
    return C.dmy(s);
  }

  /* ---------- đọc 1 file danh sách ---------- */
  var MAP = [
    ['mau', /^ky hieu mau so/], ['kh', /^ky hieu hoa don/], ['so', /^so hoa don/], ['ngay', /^ngay lap/],
    ['banMST', /^mst nguoi ban/], ['banTen', /^ten nguoi ban/], ['banDC', /^dia chi nguoi ban/],
    ['muaMST', /^mst nguoi mua/], ['muaTen', /^ten nguoi mua/], ['muaDC', /^dia chi nguoi mua/], ['cccd', /^can cuoc/],
    ['ct', /^tong tien chua thue/], ['th', /^tong tien thue/], ['ck', /^tong tien chiet khau/], ['phi', /^tong tien phi/],
    ['tong', /^tong tien thanh toan/], ['tienTe', /^don vi tien te/], ['tyGia', /^ty gia/], ['tthai', /^trang thai hoa don/], ['kq', /^ket qua kiem tra/]
  ];
  async function readList(u8, name) {
    var rows = await C.readTable(u8, name), hi = -1, title = '', tu = '', den = '';
    for (var i = 0; i < Math.min(rows.length, 40); i++) {
      var line = (rows[i] || []).map(low);
      if (line.indexOf('so hoa don') >= 0 && line.some(function (x) { return /^ky hieu hoa don/.test(x); })) { hi = i; break; }
      var raw = (rows[i] || []).filter(Boolean).join(' ');
      if (/danh sach hoa don/i.test(low(raw))) title = raw.trim();
      var m = raw.match(/(\d{1,2}\/\d{1,2}\/\d{4}).*?(\d{1,2}\/\d{1,2}\/\d{4})/); if (m && /tu ngay/.test(low(raw))) { tu = C.dmy(m[1]); den = C.dmy(m[2]); }
    }
    if (hi < 0) throw new Error('Không thấy dòng tiêu đề "Số hóa đơn / Ký hiệu hóa đơn". File này không phải "Danh sách hóa đơn" tải từ cổng hoadondientu.gdt.gov.vn.');
    var H = rows[hi].map(low), idx = {};
    MAP.forEach(function (m) { for (var j = 0; j < H.length; j++) if (m[1].test(H[j]) && idx[m[0]] === undefined) { idx[m[0]] = j; break; } });
    ['kh', 'so', 'ngay', 'ct', 'th'].forEach(function (k) { if (idx[k] === undefined) throw new Error('Thiếu cột "' + { kh: 'Ký hiệu hóa đơn', so: 'Số hóa đơn', ngay: 'Ngày lập', ct: 'Tổng tiền chưa thuế', th: 'Tổng tiền thuế' }[k] + '" trong file.'); });
    var mtt = /may tinh tien/.test(low(title)), out = [];
    for (var r = hi + 1; r < rows.length; r++) {
      var row = rows[r] || [], g = function (k) { return idx[k] === undefined ? '' : (row[idx[k]] == null ? '' : String(row[idx[k]]).trim()); };
      if (!g('so') && !g('kh')) continue;
      var v = {
        mauSo: g('mau'), kyHieu: g('kh').toUpperCase(), so: g('so').replace(/\.0+$/, ''), ngay: ngay(g('ngay')),
        banMST: mst(g('banMST')), banTen: g('banTen'), banDC: g('banDC'), muaMST: mst(g('muaMST')), muaTen: g('muaTen'), muaDC: g('muaDC'), cccd: g('cccd'),
        chuaThue: N(g('ct')), thue: N(g('th')), ck: N(g('ck')), phi: N(g('phi')), tong: N(g('tong')),
        tienTe: (g('tienTe') || 'VND').toUpperCase(), tyGia: N(g('tyGia')) || 1, tthaiTen: g('tthai'), kq: g('kq'), file: name, dong: r + 1
      };
      v.loaiHD = (mtt || /may tinh tien/.test(low(v.kq))) ? 'Máy tính tiền' : (/^K/.test(v.kyHieu) ? 'Không mã' : 'Có mã');
      out.push(v);
    }
    return { name: name, title: title, tu: tu, den: den, mtt: mtt, invs: out };
  }

  // MST doanh nghiệp: MST xuất hiện đứng yên (cùng 1 giá trị) ở cột người bán hoặc người mua của nhiều file nhất
  function doanMST(files) {
    var sc = {};
    files.forEach(function (f) {
      ['banMST', 'muaMST'].forEach(function (k) {
        var cnt = {}; f.invs.forEach(function (v) { if (v[k]) cnt[v[k]] = (cnt[v[k]] || 0) + 1; });
        Object.keys(cnt).forEach(function (m) { if (cnt[m] >= f.invs.length * 0.9) sc[m] = (sc[m] || 0) + 1 + cnt[m] / 1e6; });
      });
    });
    return Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; })[0] || '';
  }
  // chiều của file: 'ban' | 'mua' | ''
  function chieuFile(f, my) {
    if (!my) return '';
    var b = 0, m = 0; f.invs.forEach(function (v) { if (v.banMST === my) b++; if (v.muaMST === my) m++; });
    return b > m ? 'ban' : m > b ? 'mua' : (b ? 'ban' : '');
  }

  /* ---------- thuế suất suy ra từ số tổng ---------- */
  function tachGoiY(ct, th, ban) {
    var zero = ban ? 'KCT' : '0%/KCT';
    if (!ct && !th) return { parts: [{ ts: ban ? '0%' : '0%/KCT', ct: 0, th: 0 }], kind: 'zero' };
    if (!th) return { parts: [{ ts: zero, ct: ct, th: 0 }], kind: 'th0' };
    if (!ct) return { parts: [{ ts: '10%', ct: 0, th: th }], kind: 'odd' };
    var a = Math.abs(ct), tol = Math.max(1.5, a * 0.001), cand = [0.1, 0.08, 0.05];
    for (var i = 0; i < cand.length; i++) if (Math.abs(th - ct * cand[i]) <= tol) return { parts: [{ ts: (cand[i] * 100) + '%', ct: ct, th: th }], kind: 'one' };
    var r = th / ct;
    if (r <= 0 || r > 0.1) { var best = cand.slice().sort(function (x, y) { return Math.abs(r - x) - Math.abs(r - y); })[0]; return { parts: [{ ts: (best * 100) + '%', ct: ct, th: th }], kind: 'odd' }; }
    var lv = [0, 0.05, 0.08, 0.1], lo = 0, hi = 0.1;
    lv.forEach(function (x) { if (x < r && x >= lo) lo = x; }); lv.slice().reverse().forEach(function (x) { if (x > r && x <= hi) hi = x; });
    var vHi = r0((th - lo * ct) / (hi - lo)), vLo = ct - vHi, tLo = lo ? r0(vLo * lo) : 0, tHi = th - tLo;
    var lab = function (x) { return x ? (x * 100) + '%' : zero; };
    return { parts: [{ ts: lab(lo), ct: vLo, th: tLo }, { ts: lab(hi), ct: vHi, th: tHi }], kind: 'mix' };
  }
  function nhomTS(ts) {
    var s = String(ts || '').toUpperCase().replace(/\s/g, '');
    if (s === 'KCT' || s === '0%/KCT') return 'kct';
    if (s === 'KKKNT') return 'kkknt';
    if (s === '0%') return '0'; if (s === '5%') return '5'; if (s === '8%') return '8'; if (s === '10%') return '10';
    return 'khac';
  }

  /* ---------- gộp các file → danh sách hóa đơn ---------- */
  // files: [{name, invs, chieu (đã chọn hoặc tự nhận)}]; my: MST doanh nghiệp; st: {sua:{key:parts}, ok:{key:1}, khongDK:{key:1}}
  /* HĐ nhập tay (góp ý anh Phương 28/10): HĐ điều chỉnh / thay thế lập kỳ sau, HĐ bổ sung khác – luôn tính vào kỳ đang lập */
  function taoTay(o, my) {
    var ban = o.loai === 'Bán ra', ct = r0(o.ct), th = r0(o.th), ts = o.ts || '10%';
    return { manual: true, mid: o.id, key: 'tay|' + o.id, loai: ban ? 'Bán ra' : 'Mua vào', loaiHD: 'Nhập tay', mauSo: o.mau || '1', kyHieu: String(o.kh || '').toUpperCase(), so: String(o.so || ''), ngay: o.ngay || '',
      banMST: ban ? my : (o.mst || ''), banTen: ban ? '' : (o.ten || ''), banDC: '', muaMST: ban ? (o.mst || '') : my, muaTen: ban ? (o.ten || '') : '', muaDC: '',
      chuaThue: ct, thue: th, ck: 0, phi: 0, tong: ct + th, tienTe: 'VND', tyGia: 1, tthaiTen: (o.nhom || 'Hóa đơn điều chỉnh') + (/nhập tay/.test(o.nhom || '') ? '' : ' (nhập tay)'), gocKey: o.gocKey || '', gocTxt: o.gocKh || o.gocSo ? (o.gocKh || '') + '-' + (o.gocSo || '') + (o.gocNgay ? ' ngày ' + o.gocNgay : '') : '', kq: 'Nhập tay', files: ['Nhập tay'],
      ctVND: ct, thVND: th, parts: [{ ts: ts, ct: ct, th: th }], goiY: { parts: [{ ts: ts, ct: ct, th: th }], kind: 'one' }, sua: null, uocTinh: false, canXacNhan: false,
      loaiTru: '', dieuChinh: false, khongDK: !!o.khongDK, phiVND: 0, tongVND: ct + th, hoKD: false, hoKDTu: false, gtMua: ct, notes: [o.gocKh || o.gocSo ? 'Cho HĐ gốc ' + (o.gocKh || '') + '-' + (o.gocSo || '') + (o.gocNgay ? ' ngày ' + o.gocNgay : '') : ''].concat(o.ghiChu ? [o.ghiChu] : []).filter(Boolean), tu5tr: !ban && Math.abs(ct + th) >= 5000000 };
  }
  function gop(files, my, st, tay) {
    st = st || {}; var seen = {}, list = [], trung = 0;
    files.forEach(function (f) {
      f.invs.forEach(function (v0) {
        var v = Object.assign({}, v0);
        var ch = f.chieu || (v.banMST === my ? 'ban' : v.muaMST === my ? 'mua' : '');
        v.loai = ch === 'ban' ? 'Bán ra' : ch === 'mua' ? 'Mua vào' : 'Khác';
        v.key = C.keyOf(v.banMST, v.mauSo, v.kyHieu, v.so);
        if (seen[v.key]) { trung++; seen[v.key].files.push(f.name); return; }
        v.files = [f.name]; seen[v.key] = v;
        var s = low(v.tthaiTen), kq = low(v.kq), notes = [];
        v.loaiTru = /da bi thay the|da bi huy|^huy|xoa bo/.test(s) ? (/huy|xoa/.test(s) ? 'Đã bị hủy' : 'Đã bị thay thế') : '';
        if (!v.loaiTru && /tu choi|khong du dieu kien/.test(kq)) v.loaiTru = 'CQT từ chối / không đủ ĐK cấp mã';
        v.dieuChinh = /dieu chinh/.test(s) && !/da bi/.test(s);
        if (v.dieuChinh) notes.push('HĐ điều chỉnh: kiểm tra dấu tăng/giảm');
        if (v.tienTe !== 'VND' && v.tyGia !== 1) notes.push('Ngoại tệ ' + v.tienTe + ', đã quy đổi × ' + v.tyGia);
        var tg = v.tienTe !== 'VND' ? v.tyGia : 1;
        v.ctVND = r0(v.chuaThue * tg); v.thVND = r0(v.thue * tg);
        var gy = tachGoiY(v.ctVND, v.thVND, v.loai === 'Bán ra');
        v.goiY = gy; v.sua = st.sua && st.sua[v.key] ? st.sua[v.key] : null;
        v.parts = v.sua || gy.parts;
        v.canXacNhan = !v.sua && !v.loaiTru && (gy.kind === 'mix' || gy.kind === 'odd' || (v.loai === 'Bán ra' && gy.kind === 'th0')) && !(st.ok && st.ok[v.key]);
        v.uocTinh = !v.sua && (gy.kind === 'mix' || gy.kind === 'odd' || (v.loai === 'Bán ra' && gy.kind === 'th0'));
        v.khongDK = !!(st.khongDK && st.khongDK[v.key]);
        /* Giá trị mua chưa VAT tính vào [23] theo cách MISA (góp ý anh Phương 29/10): Tổng tiền chưa thuế + Tổng tiền phí;
           HĐ của hộ kinh doanh (hóa đơn bán hàng, mẫu số 2 – không có thuế GTGT) lấy ở Tổng tiền thanh toán.
           Tự nhận HĐ hộ KD: mẫu số 2, hoặc không có tiền chưa thuế lẫn tiền thuế nhưng có tổng thanh toán; người dùng tick lại được. */
        v.phiVND = r0((v.phi || 0) * tg); v.tongVND = r0(v.tong * tg);
        v.hoKDTu = v.loai === 'Mua vào' && (String(v.mauSo).trim() === '2' || (!v.ctVND && !v.thVND && v.tongVND !== 0));
        var hk = st.hkd ? st.hkd[v.key] : undefined; v.hoKD = v.loai === 'Mua vào' && (hk === 1 ? true : hk === 0 ? false : v.hoKDTu);
        v.gtMua = v.hoKD ? v.tongVND - v.thVND : v.ctVND + v.phiVND;
        if (v.loai === 'Mua vào' && my && v.muaMST && v.muaMST !== my) notes.push('MST người mua ' + v.muaMST + ' khác MST doanh nghiệp');
        if (v.loai === 'Mua vào' && Math.abs(v.tong * tg) >= 5000000) v.tu5tr = true;
        v.notes = notes; list.push(v);
      });
    });
    (tay || []).forEach(function (o) { var v = taoTay(o, my); if (st.khongDK && st.khongDK[v.key]) v.khongDK = true; list.push(v); });
    list.forEach(function (v) { v.tkSet = (st.tk && st.tk[v.key]) || ''; });
    /* Lý do HĐ điều chỉnh / thay thế (TT 91/2026 Đ10): 'tm' thương mại – khoản 5; 'ss-cung' sửa sai, HĐ gốc cùng kỳ; 'ss-truoc' sửa sai, HĐ gốc kỳ trước */
    var byKey = {}; list.forEach(function (v) { byKey[v.key] = v; });
    var biTT = {}; list.forEach(function (v) { if (/da bi thay the/.test(low(v.tthaiTen))) { var dt = v.loai === 'Bán ra' ? v.muaMST || v.muaTen : v.banMST; biTT[v.loai + '|' + dt] = 1; } });
    list.forEach(function (v) {
      var nh = nhomDC(v); v.dcNhom = nh;
      if (v.manual) { if (nh === 4 && v.gocKey && byKey[v.gocKey]) byKey[v.gocKey].biThayTay = v.kyHieu + '-' + v.so; v.dcLyDo = 'ss-cung'; return; }
      if (nh !== 3 && nh !== 4) return;
      v.dcLyDo = (st.dc && st.dc[v.key]) || '';
      if (nh === 4 && v.dcLyDo === 'tm') v.dcLyDo = '';
      var dt = v.loai === 'Bán ra' ? v.muaMST || v.muaTen : v.banMST;
      v.dcGoiY = !v.dcLyDo && nh === 4 && biTT[v.loai + '|' + dt] ? 'ss-cung' : '';
      v.dcCan = !v.dcLyDo && !v.dcGoiY;
    });
    list.sort(function (a, b) { return C.ymdCompact(a.ngay).localeCompare(C.ymdCompact(b.ngay)) || a.kyHieu.localeCompare(b.kyHieu) || (parseInt(a.so, 10) || 0) - (parseInt(b.so, 10) || 0); });
    return { list: list, trung: trung };
  }

  /* ---------- tính tờ khai: trả về đúng dạng HDToKhai.compute để dùng lại rows/sheets/xml ---------- */
  function compute(list, inp) {
    var p = HDToKhai.periodOf(inp.kieu, inp.so, inp.nam), warns = [];
    var ban = [], mua = [], s8b = 0, s8m = 0;
    var c = { c23: 0, c24: 0, c23a: 0, c24a: 0, c25: 0, c26: 0, c29: 0, c30: 0, c31: 0, c32: 0, c33: 0, c32a: 0 };
    var dem = { ban: 0, mua: 0, ngoaiKy: 0, loaiTru: 0, khac: 0, uocTinh: 0, boTay: 0, themTay: 0, nhapTay: 0, dcCan: 0, ksb: 0, kyPhatHien: 0 };
    list.forEach(function (v) {
      if (v.loai === 'Khác') { v.tinh = false; v.lyDo = 'không rõ bán/mua'; dem.khac++; return; }
      var d = C.dmyToDate(v.ngay); v.trongKy = v.manual || !!(d && d >= p.from && d <= p.to);
      var auto = v.trongKy && !v.loaiTru; v.lyDo = v.loaiTru ? v.loaiTru.toLowerCase() : !v.trongKy ? 'ngoài kỳ' : '';
      if (auto && v.biThayTay) { auto = false; v.lyDo = 'đã bị thay thế bởi HĐ nhập tay ' + v.biThayTay; }
      v.ksb = false; v.kyPhatHien = false;
      if (auto && (v.dcLyDo || v.dcGoiY) === 'ss-truoc') {
        // Mua vào điều chỉnh TĂNG thuế đầu vào: khai vào kỳ phát hiện (Luật 48/2024 Đ14 k1 điểm đ; NĐ 181/2025 Đ23 k6 điểm b)
        if (v.loai === 'Mua vào' && v.dcNhom === 3 && v.thVND > 0) v.kyPhatHien = true;
        // Còn lại: khai bổ sung kỳ của HĐ gốc (NĐ 252/2026 Đ12 k6 điểm a; NĐ 181/2025 Đ23 k6 điểm a)
        else { auto = false; v.ksb = true; v.lyDo = 'sửa sai HĐ kỳ trước – khai bổ sung kỳ gốc'; }
      }
      v.tinh = v.tkSet === 'co' ? true : v.tkSet === 'khong' ? false : auto;
      if (v.tkSet === 'khong') v.lyDo = 'người dùng bỏ';
      if (!v.tinh) { if (v.ksb && v.tkSet !== 'khong') dem.ksb++; if (v.tkSet === 'khong') dem.boTay++; else if (!v.trongKy) dem.ngoaiKy++; else dem.loaiTru++; return; }
      if (!auto) dem.themTay++;
      if (v.manual) dem.nhapTay++;
      if (v.dcCan) dem.dcCan++;
      if (v.kyPhatHien) dem.kyPhatHien++;
      if (v.canXacNhan) dem.uocTinh++;
      var sh = { so: v.so, ngay: v.ngay, kyHieu: v.kyHieu, muaTen: v.muaTen || (v.loai === 'Bán ra' ? 'Người mua không lấy hóa đơn' : ''), muaMST: v.muaMST, banTen: v.banTen, banMST: v.banMST };
      if (v.loai === 'Bán ra') {
        dem.ban++;
        v.parts.forEach(function (x) {
          var g = nhomTS(x.ts), ct = r0(x.ct), th = r0(x.th);
          if (g === 'kct') c.c26 += ct; else if (g === '0') c.c29 += ct; else if (g === '5') { c.c30 += ct; c.c31 += th; }
          else if (g === '10' || g === '8') { c.c32 += ct; c.c33 += th; if (g === '8') s8b += ct; }
          else if (g === 'kkknt') c.c32a += ct;
          else { c.c32 += ct; c.c33 += th; warns.push('HĐ ' + v.kyHieu + '-' + v.so + ' thuế suất "' + x.ts + '" chưa rõ – tạm kê vào [32]/[33].'); }
          ban.push({ nhom: g === '8' ? '10' : (g === 'khac' ? '10' : g), inv: sh, ct: ct, th: th, ts: x.ts + (v.uocTinh ? ' (ước tính)' : '') });
        });
      } else {
        dem.mua++;
        var ct = 0, th = 0; v.parts.forEach(function (x) { ct += r0(x.ct); th += r0(x.th); if (nhomTS(x.ts) === '8') s8m += r0(x.ct); });
        ct = v.hoKD ? (v.tongVND || 0) - th : ct + (v.phiVND || 0); v.gtMua = ct;
        c.c23 += ct; c.c24 += th; if (!v.khongDK) c.c25 += th;
        mua.push({ nhom: v.khongDK ? '4' : '1', inv: sh, ct: ct, th: th, ts: v.parts.map(function (x) { return x.ts; }).join(' + ') + (v.uocTinh ? ' (ước tính)' : '') });
      }
    });
    var n = function (k) { return r0(inp[k] || 0); };
    c.c22 = n('c22'); c.c32b = inp.mau === 'TT80' ? 0 : n('c32b'); c.c34a = inp.mau === 'TT80' ? 0 : n('c34a');
    c.c37 = n('c37'); c.c38 = n('c38'); c.c39a = n('c39a'); c.c40b = n('c40b'); c.c42 = n('c42');
    c.c27 = c.c29 + c.c30 + c.c32 + c.c32a - c.c32b; c.c28 = c.c31 + c.c33; c.c34 = c.c26 + c.c27 + c.c34a; c.c35 = c.c28; c.c36 = c.c35 - c.c25;
    var x = c.c36 - c.c22 + c.c37 - c.c38 - c.c39a; c.c40a = Math.max(x, 0); c.c41 = Math.max(-x, 0);
    if (c.c40b > c.c40a) warns.push('[40b] lớn hơn [40a] – kiểm tra lại số bù trừ dự án đầu tư.');
    c.c40 = c.c40a - c.c40b; if (c.c42 > c.c41) warns.push('[42] (đề nghị hoàn) không được lớn hơn [41].'); c.c43 = c.c41 - c.c42;
    c.khongPS = !dem.ban && !dem.mua;
    var tenMua = inp.plTenMua || 'Hàng hóa, dịch vụ mua vào áp dụng thuế suất 8%', tenBan = inp.plTenBan || 'Hàng hóa, dịch vụ bán ra áp dụng thuế suất 8%';
    var plMua = s8m ? [{ ten: tenMua, ct: s8m, giam: r0(s8m * 0.08) }] : [], plBan = s8b ? [{ ten: tenBan, ct: s8b, giam: r0(s8b * 0.02) }] : [];
    return { ky: p, c: c, ban: ban, mua: mua, plMua: plMua, plBan: plBan, warns: warns, dem: dem };
  }

  /* ---------- nhóm theo dõi điều chỉnh / thay thế ---------- */
  var TKDS_NH = [['da bi dieu chinh', 'Đã bị điều chỉnh'], ['da bi thay the', 'Đã bị thay thế'], ['da bi huy', 'Đã bị hủy'], ['dieu chinh', 'Hóa đơn điều chỉnh'], ['thay the', 'Hóa đơn thay thế']];
  var LYDO = { tm: 'Điều chỉnh thương mại (CKTM, trả hàng, quyết toán) – kê kỳ lập/nhận HĐ', 'ss-cung': 'Sửa sai – HĐ gốc thuộc kỳ đang lập', 'ss-truoc': 'Sửa sai – HĐ gốc thuộc kỳ trước' };
  function nhomDC(v) { var s = low(v.tthaiTen); for (var i = 0; i < TKDS_NH.length; i++) if (s.indexOf(TKDS_NH[i][0]) >= 0) return i; return -1; }
  /* ---------- bảng kê tổng hợp ---------- */
  function phanTS(v) {
    var o = {};
    v.parts.forEach(function (x) { var g = nhomTS(x.ts); o['ct' + g] = (o['ct' + g] || 0) + r0(x.ct); o['th' + g] = (o['th' + g] || 0) + r0(x.th); });
    return o;
  }
  function bangKe(list, info, R) {
    function tinh(v) { if (v.tinh === false) return 'Không – ' + (v.lyDo || ''); if (v.tinh) return v.tkSet === 'co' && v.lyDo ? 'Có (người dùng chọn)' : v.kyPhatHien ? 'Có – kỳ phát hiện (tăng thuế đầu vào)' : 'Có'; return v.loaiTru ? 'Không – ' + v.loaiTru.toLowerCase() : 'Có'; }
    function co(v) { return /^Có/.test(tinh(v)); }
    function sheet(isBan) {
      var L = list.filter(function (v) { return v.loai === (isBan ? 'Bán ra' : 'Mua vào'); });
      var cols = [{ h: 'STT', t: 'i', w: 6 }, { h: 'Loại hóa đơn', t: 's', w: 13 }, { h: 'Ký hiệu mẫu số', t: 's', w: 8 }, { h: 'Ký hiệu hóa đơn', t: 's', w: 10 }, { h: 'Số hóa đơn', t: 's', w: 11 }, { h: 'Ngày lập', t: 'd', w: 11 },
        { h: isBan ? 'MST người mua' : 'MST người bán', t: 's', w: 15 }, { h: isBan ? 'Tên người mua' : 'Tên người bán', t: 's', w: 38 }, { h: isBan ? 'Địa chỉ người mua' : 'Địa chỉ người bán', t: 's', w: 30 },
        { h: 'Tổng tiền chưa thuế', t: 'n', w: 15 }, { h: 'Tổng tiền thuế', t: 'n', w: 13 }, { h: 'Thuế suất', t: 's', w: 12 }, { h: 'Chiết khấu thương mại', t: 'n', w: 12 }];
      if (!isBan) cols.push({ h: 'Tổng tiền phí', t: 'n', w: 11 });
      cols = cols.concat([{ h: 'Tổng tiền thanh toán', t: 'n', w: 15 }, { h: 'Đơn vị tiền tệ', t: 's', w: 7 }, { h: 'Tỷ giá', t: 'n4', w: 8 }, { h: 'Trạng thái hóa đơn', t: 's', w: 18 }, { h: 'Kết quả kiểm tra hóa đơn', t: 's', w: 26 }, { h: 'Tính vào tờ khai', t: 's', w: 14 }]);
      if (!isBan) cols.push({ h: 'Được khấu trừ', t: 's', w: 10 }, { h: 'HĐ hộ kinh doanh', t: 's', w: 10 }, { h: 'Giá trị mua chưa VAT tính vào [23]', t: 'n', w: 16 });
      var tsCols = isBan ? [['ctkct', 'Doanh thu KCT'], ['ct0', 'Doanh thu 0%'], ['ct5', 'Doanh thu 5%'], ['th5', 'Thuế 5%'], ['ct8', 'Doanh thu 8%'], ['th8', 'Thuế 8%'], ['ct10', 'Doanh thu 10%'], ['th10', 'Thuế 10%'], ['ctkkknt', 'Doanh thu KKKNT']]
        : [['ctkct', 'Giá trị 0%/KCT'], ['ct5', 'Giá trị 5%'], ['th5', 'Thuế 5%'], ['ct8', 'Giá trị 8%'], ['th8', 'Thuế 8%'], ['ct10', 'Giá trị 10%'], ['th10', 'Thuế 10%']];
      tsCols.forEach(function (t) { cols.push({ h: t[1] + ' (VND)', t: 'n', w: 13 }); });
      cols.push({ h: 'Ghi chú', t: 's', w: 34 }, { h: 'File nguồn', t: 's', w: 26 });
      var tot = {}, rows = L.map(function (v, i) {
        var P = phanTS(v), on = co(v);
        if (!isBan && P.ct0) { P.ctkct = (P.ctkct || 0) + P.ct0; }
        var note = v.notes.slice(); if (v.uocTinh) note.unshift(v.canXacNhan ? 'Thuế suất ước tính từ tỷ lệ thuế – cần xác nhận' : 'Thuế suất ước tính, đã xác nhận'); if (v.sua) note.unshift('Thuế suất do người dùng nhập');
        if (v.tu5tr && on) note.push('Tổng thanh toán từ 5 triệu: cần chứng từ thanh toán không dùng tiền mặt'); if (v.files.length > 1) note.push('Trùng ở ' + v.files.length + ' file, chỉ tính 1 lần');
        var row = [i + 1, v.loaiHD, v.mauSo, v.kyHieu, v.so, v.ngay, isBan ? v.muaMST : v.banMST, isBan ? (v.muaTen || '') : v.banTen, isBan ? v.muaDC : v.banDC, v.chuaThue, v.thue,
          v.parts.map(function (x) { return x.ts; }).join(' + '), v.ck];
        if (!isBan) row.push(v.phi);
        row = row.concat([v.tong, v.tienTe, v.tyGia, v.tthaiTen, v.kq, tinh(v)]);
        if (!isBan) { row.push(!on ? '' : v.khongDK ? 'Không' : 'Có', v.hoKD ? 'Có' : '', on ? v.gtMua : ''); if (on) tot.gt = (tot.gt || 0) + v.gtMua; }
        if (!isBan && v.hoKD) note.push('HĐ hộ kinh doanh: giá trị lấy ở Tổng tiền thanh toán'); else if (!isBan && v.phiVND) note.push('Giá trị [23] gồm Tổng tiền phí ' + C.fmtMoney(v.phiVND));
        tsCols.forEach(function (t) { var x = on ? (P[t[0]] || '') : ''; row.push(x); if (x) tot[t[0]] = (tot[t[0]] || 0) + x; });
        row.push(note.join('; '), v.files.join(', '));
        if (on) ['ct', 'th', 'ck', 'phi', 'tong'].forEach(function (k, j) { var val = [v.ctVND, v.thVND, v.ck, v.phi, v.tong][j]; tot[k] = (tot[k] || 0) + (+val || 0); });
        return row;
      });
      var foot = ['', 'TỔNG CỘNG (HĐ tính vào tờ khai)', '', '', '', '', '', '', '', tot.ct || 0, tot.th || 0, '', tot.ck || 0];
      if (!isBan) foot.push(tot.phi || 0);
      foot = foot.concat([tot.tong || 0, '', '', '', '', '']); if (!isBan) foot.push('', '', tot.gt || 0);
      tsCols.forEach(function (t) { foot.push(tot[t[0]] || 0); }); foot.push('', '');
      var nCo = L.filter(function (v) { return co(v); }).length;
      return { name: isBan ? 'HĐ bán ra' : 'HĐ mua vào', pre: [(isBan ? 'BẢNG KÊ TỔNG HỢP HÓA ĐƠN BÁN RA' : 'BẢNG KÊ TỔNG HỢP HÓA ĐƠN MUA VÀO'),
        'Doanh nghiệp: ' + (info.ten || '') + '   MST: ' + (info.mst || '') + (R ? '   Kỳ: ' + R.ky.nhan : ''),
        'Tổng hợp từ ' + info.nFile + ' file "Danh sách hóa đơn" tải từ cổng hoadondientu.gdt.gov.vn · ' + L.length + ' hóa đơn, ' + nCo + ' hóa đơn tính vào tờ khai. Thuế suất không có trên danh sách: công cụ suy ra từ tỷ lệ thuế/giá trị (xem cột Ghi chú).', isBan ? '' : 'Giá trị mua chưa VAT tính vào [23] theo cách MISA: HĐ công ty = Tổng tiền chưa thuế + Tổng tiền phí; HĐ hộ kinh doanh (mẫu số 2 hoặc người dùng đánh dấu) = Tổng tiền thanh toán. Xem cột "Giá trị mua chưa VAT tính vào [23]".'],
        cols: cols, rows: rows, foot: foot };
    }
    // Sheet 3 (góp ý anh Phương): theo dõi HĐ bị điều chỉnh / bị thay thế / bị hủy và HĐ điều chỉnh, thay thế
    var NH = TKDS_NH;
    // góp ý anh Phương 29/10: tách riêng mua vào / bán ra cho dễ theo dõi
    function sheetDC(isBan) {
    var L3 = list.filter(function (v) { return nhomDC(v) >= 0 && v.loai === (isBan ? 'Bán ra' : 'Mua vào'); }).sort(function (a, b) { return nhomDC(a) - nhomDC(b) || C.ymdCompact(a.ngay).localeCompare(C.ymdCompact(b.ngay)); });
    var rows3 = L3.map(function (v, i) { var ban = isBan; return [i + 1, NH[nhomDC(v)][1], v.loaiHD, v.mauSo, v.kyHieu, v.so, v.ngay, ban ? v.muaMST : v.banMST, ban ? (v.muaTen || '') : v.banTen, v.ctVND, v.thVND, v.tong, v.tthaiTen, LYDO[v.dcLyDo || v.dcGoiY] || (v.dcNhom >= 3 ? 'Chưa xác nhận' : ''), tinh(v), v.notes.join('; '), v.files.join(', ')]; });
    return { name: isBan ? 'Bán ra ĐC - TT' : 'Mua vào ĐC - TT', pre: [isBan ? 'BẢNG THEO DÕI HÓA ĐƠN BÁN RA ĐIỀU CHỈNH, THAY THẾ, BỊ HỦY' : 'BẢNG THEO DÕI HÓA ĐƠN MUA VÀO ĐIỀU CHỈNH, THAY THẾ, BỊ HỦY', 'Doanh nghiệp: ' + (info.ten || '') + '   MST: ' + (info.mst || '') + (R ? '   Kỳ: ' + R.ky.nhan : ''), 'Gồm HĐ ' + (isBan ? 'bán ra' : 'mua vào') + ' đã bị điều chỉnh, đã bị thay thế, đã bị hủy và HĐ điều chỉnh, thay thế (kể cả HĐ nhập tay) để đối chiếu cặp HĐ gốc – HĐ điều chỉnh/thay thế. ' + L3.length + ' hóa đơn.', ''],
      cols: [{ h: 'STT', t: 'i', w: 6 }, { h: 'Nhóm', t: 's', w: 18 }, { h: 'Loại hóa đơn', t: 's', w: 13 }, { h: 'Ký hiệu mẫu số', t: 's', w: 8 }, { h: 'Ký hiệu hóa đơn', t: 's', w: 10 }, { h: 'Số hóa đơn', t: 's', w: 11 }, { h: 'Ngày lập', t: 'd', w: 11 }, { h: isBan ? 'MST người mua' : 'MST người bán', t: 's', w: 15 }, { h: isBan ? 'Tên người mua' : 'Tên người bán', t: 's', w: 38 }, { h: 'Tổng tiền chưa thuế', t: 'n', w: 15 }, { h: 'Tổng tiền thuế', t: 'n', w: 13 }, { h: 'Tổng tiền thanh toán', t: 'n', w: 15 }, { h: 'Trạng thái hóa đơn', t: 's', w: 22 }, { h: 'Lý do điều chỉnh / thay thế', t: 's', w: 30 }, { h: 'Tính vào tờ khai', t: 's', w: 26 }, { h: 'Ghi chú', t: 's', w: 30 }, { h: 'File nguồn', t: 's', w: 24 }], rows: rows3 };
    }
    return [sheet(false), sheetDC(false), sheet(true), sheetDC(true)];
  }

  /* ---------- đọc tờ khai XML (HTKK / AMIS / eTax) để đối chiếu ---------- */
  function docXmlSoSanh(text) {
    var d = new DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('File XML lỗi cấu trúc');
    var main = d.getElementsByTagName('CTieuTKhaiChinh')[0]; if (!main) throw new Error('Không thấy phần chỉ tiêu tờ khai (CTieuTKhaiChinh) – có thể không phải tờ khai 01/GTGT');
    var o = {}, all = main.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) { var m = all[i].localName.match(/^ct(\d+[a-z]?)$/); if (m && !all[i].children.length) o['c' + m[1]] = r0(N(all[i].textContent)); }
    var g = function (t) { var e = d.getElementsByTagName(t)[0]; return e ? e.textContent.trim() : ''; };
    return { c: o, mst: g('mst'), ky: g('kyKKhai'), kieuKy: g('kieuKy'), dvu: g('tenDVu') || g('maDVu') };
  }

  return { LYDO: LYDO, taoTay: taoTay, nhomDC: nhomDC, NH: TKDS_NH, readList: readList, doanMST: doanMST, chieuFile: chieuFile, tachGoiY: tachGoiY, nhomTS: nhomTS, gop: gop, compute: compute, bangKe: bangKe, docXmlSoSanh: docXmlSoSanh, RATES: RATES, N: N };
})();
