/* ==========================================================================
   HD-MISA – tạo file nhập chứng từ MISA AMIS Kế toán từ hóa đơn XML
   5 mẫu: Mua hàng trong nước (MH), Mua dịch vụ (MDV), Nghiệp vụ khác (NVK),
          Bán hàng (BH), Bán dịch vụ (BDV) – tiêu đề cột lấy nguyên văn từ mẫu MISA.
   Quy tắc anh Minh Tuấn chốt 17/10/2026:
   - Mặc định: TK công nợ 331, TK thuế 1331, "Chưa thanh toán", nhóm HHDV 1
   - Loại hàng hóa/dịch vụ: công cụ gợi ý, người dùng xác nhận
   - Chiết khấu thương mại trên hóa đơn → cột "Tiền chiết khấu"
   - Không đủ điều kiện khấu trừ: người dùng đánh dấu (nhóm 4), công cụ cảnh báo
   ========================================================================== */
var HDMisa = (function () {
  'use strict';
  var C = HDCore;
  var TPL = __MISA_TEMPLATES__;

  var DEF = {
    muaTKCongNo: '331', muaTKThue: '1331', muaPTTT: 'Chưa thanh toán', muaNhanHD: 'Nhận kèm hóa đơn', muaNhom: '1',
    tkHangHoa: '1561', tkDichVu: '', tkNVK: '', maKho: '',
    banTKNo: '131', banTKDTHang: '5111', banTKDTDV: '5113', banTKThue: '33311', banPTTT: 'Chưa thu tiền',
    banKiemXuat: 'Không', banMaKho: '', banTKGV: '632', banTKKho: '1561', banTKCK: '',
    nvkDongThue: 'Có', ghepKyHieu: 'Không',
    pre: { NK: 'NK', KQK: 'MH', MDV: 'MDV', NVK: 'NVK', BH: 'BH', BDV: 'BDV', XK: 'XK' }, soBatDau: 1, doDai: 4
  };
  var LOAI_MUA = [['NK', 'Hàng hóa – nhập kho'], ['KQK', 'Hàng hóa – không qua kho'], ['DV', 'Dịch vụ'], ['NVK', 'Nghiệp vụ khác']];
  var LOAI_BAN = [['HH', 'Hàng hóa'], ['DV', 'Dịch vụ']];
  var DVT_DV = /^(lan|lượt|luot|goi|gói|thang|tháng|nam|năm|ky|kỳ|khoa|khóa|buoi|buổi|gio|giờ|cong|công|chuyen|chuyến|dich vu|dịch vụ|ngay|ngày|dem|đêm|phong|phòng|ve|vé|suat|suất|hop dong|hợp đồng|tuan|tuần|km|nguoi|người|ca|lop|lớp|tiet|tiết|dv|dvu|trọn gói|tron goi|lần)$/i;
  var TEN_DV = /(phí|cước|dịch vụ|dich vu|vận chuyển|van chuyen|thuê|thue nha|tư vấn|tu van|sửa chữa|sua chua|bảo trì|bao tri|bảo dưỡng|khóa học|khoa hoc|đào tạo|dao tao|quảng cáo|quang cao|thiết kế|thiet ke|lắp đặt|lap dat|vé |ăn uống|an uong|lưu trú|phòng nghỉ|internet|điện thoại|bảo hiểm|kiểm toán|gia công|hosting|tên miền|phần mềm|license|bản quyền)/i;

  function norm(s) { return C.boDau(String(s || '')).toLowerCase().replace(/\s+/g, ' ').trim(); }
  function partnerKey(dir, inv) {
    if (dir === 'mua') return 'mua|' + (inv.banMST ? inv.banMST : 'ten:' + norm(inv.banTen));
    return 'ban|' + (inv.muaMST ? inv.muaMST : '__khachle__');
  }
  function partnerOf(dir, inv) {
    if (dir === 'mua') return { mst: inv.banMST, ten: inv.banTen, dc: inv.banDC };
    if (!inv.muaMST) return { mst: '', ten: 'Khách lẻ / không có MST', dc: '', le: true };
    return { mst: inv.muaMST, ten: inv.muaTen, dc: inv.muaDC };
  }
  // cách ghép của 1 dòng = cách ghép chung của mặt hàng (mã, ...) + phần riêng của dòng đó trong hóa đơn (loại, TK, đã xác nhận)
  function mapOf(map, lk, ik) { var a = (map.items || {})[ik] || {}, b = (map.lines || {})[lk] || {}, o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b).forEach(function (k) { if (b[k] !== '' && b[k] != null) o[k] = b[k]; }); return o; }
  function itemKey(dir, it) { return dir + '|' + norm(it.ten) + '|' + norm(it.dvt); }
  // Quy ước anh Minh Tuấn 18/10/2026: đồ ăn, đồ uống, xăng dầu, vé máy bay, phí ngân hàng → gợi ý "Nghiệp vụ khác" (không cần sinh mã hàng)
  var NVK_TEN = /(^set |ăn uống|đồ ăn|đồ uống|suất ăn|set ăn|set menu|buffet|lẩu|nướng|cơm|phở|bún|miến|cháo|bánh|bia|rượu|nước suối|nước ngọt|nước ép|nước khoáng|trà sữa|trà |cà phê|cafe|coffee|sinh tố|sữa chua|pizza|sushi|sashimi|udon|ramen|salad|hải sản|tôm|mực|cá |gà |bò |heo|lợn|vịt|dê|rau|dasani|aquafina|lavie|coca|pepsi|7up|sting|redbull|xăng|dầu diesel|dầu do|ron ?9[25]|e5 ron|nhiên liệu|vé máy bay|chặng bay|hàng không|airline|phí ngân hàng|phí dịch vụ ngân hàng|phí chuyển tiền|phí sms|phí rút tiền|phí quản lý tài khoản|phí duy trì tài khoản|phí giao dịch ngân hàng)/i;
  var NVK_BAN = /(nhà hàng|ẩm thực|ăn uống|cà phê|cafe|coffee|pizza|sushi|bbq|lẩu|quán |bakery|xăng dầu|petrolimex|petro|hàng không|airlines|vietjet|ngân hàng)/i;
  // hóa đơn nhà hàng/quán: nếu từ 40% số dòng hàng trở lên là đồ ăn uống thì cả hóa đơn gợi ý Nghiệp vụ khác
  function hdAnUong(inv) {
    if (!inv) return false; if (inv.__nvk !== undefined) return inv.__nvk;
    var L = inv.items.filter(function (it) { return it.tc !== '3' && it.tc !== '4'; }), n = L.filter(function (it) { return NVK_TEN.test(String(it.ten || '').normalize('NFC').toLowerCase()); }).length;
    try { Object.defineProperty(inv, '__nvk', { value: L.length > 0 && n / L.length >= 0.4, enumerable: false, configurable: true }); } catch (e) { }
    return inv.__nvk;
  }
  function laNVK(it, inv) { return NVK_TEN.test(String(it.ten || '').normalize('NFC').toLowerCase()) || !!(inv && (NVK_BAN.test(String(inv.banTen || '').normalize('NFC').toLowerCase()) || hdAnUong(inv))); }
  function suggest(dir, it, inv) {
    if (dir === 'mua' && laNVK(it, inv)) return 'NVK';
    var laDV = TEN_DV.test(it.ten || '') || (it.dvt && DVT_DV.test(norm(it.dvt))) || (!it.dvt && !it.sl);
    if (dir === 'ban') return laDV ? 'DV' : 'HH';
    return laDV ? 'DV' : 'NK';
  }
  function rateOf(ts) {
    var s = String(ts || '').trim().toUpperCase();
    if (!s) return { ts: '', pct: null };
    var m = s.match(/^(\d+(?:[.,]\d+)?)\s*%?$/); if (m) { var v = parseFloat(m[1].replace(',', '.')); return { ts: String(v), pct: v }; }
    m = s.match(/^KHAC[:\s]*(\d+(?:[.,]\d+)?)/); if (m) { var k = parseFloat(m[1].replace(',', '.')); return { ts: 'KHAC', khac: k, pct: k }; }
    if (s === 'KCT' || s === 'KKKNT') return { ts: s, pct: 0 };
    return { ts: s, pct: null };
  }

  /* ---------- mô hình: đối tác, mặt hàng, hóa đơn theo chiều mua/bán ---------- */
  function model(res, dir) {
    var partners = {}, items = {}, lines = {}, invs = [], skipped = 0;
    res.list.forEach(function (inv) {
      if ((dir === 'mua' ? 'Mua vào' : 'Bán ra') !== inv.loai) return;
      if (inv.loaiTru) { skipped++; return; }
      invs.push(inv);
      var pk = partnerKey(dir, inv), p = partnerOf(dir, inv);
      var P = partners[pk] || (partners[pk] = { key: pk, mst: p.mst, ten: p.ten, dc: p.dc, le: p.le, n: 0, tong: 0 });
      if (!P.dc && p.dc) P.dc = p.dc;
      P.n++; P.tong += inv.tong;
      inv.items.forEach(function (it) {
        if (it.tc === '3' || it.tc === '4') return;
        var ik = itemKey(dir, it);
        var I = items[ik] || (items[ik] = { key: ik, ten: it.ten, dvt: it.dvt, ma: it.ma, ts: it.ts, n: 0, tien: 0, goiY: suggest(dir, it, inv), hd: [] });
        I.n++; I.tien += it.thanhTien;
        var hk = C.invKey(inv); if (!I.hd.some(function (h) { return h.k === hk; })) I.hd.push({ k: hk, so: String(inv.so).replace(/^0+/, '') || inv.so, kh: inv.kyHieu });
        // từng dòng theo hóa đơn (cùng mặt hàng trong 1 HĐ thì gộp 1 dòng)
        var lk = hk + '#' + ik, Ln = lines[lk] || (lines[lk] = { key: lk, ik: ik, hk: hk, ten: it.ten, dvt: it.dvt, ma: it.ma, ts: it.ts, so: String(inv.so).replace(/^0+/, '') || inv.so, kh: inv.kyHieu, ngay: inv.ngay, ban: inv.banTen, tien: 0, goiY: suggest(dir, it, inv) });
        Ln.tien += it.thanhTien;
        if (!I.ma && it.ma) I.ma = it.ma;
      });
    });
    var arr = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
    return { dir: dir, partners: arr(partners).sort(function (a, b) { return b.n - a.n; }), items: arr(items).sort(function (a, b) { return b.n - a.n || b.tien - a.tien; }), lines: arr(lines).sort(function (a, b) { return C.ymdCompact(a.ngay).localeCompare(C.ymdCompact(b.ngay)) || String(a.kh + a.so).localeCompare(String(b.kh + b.so)); }), invs: invs, skipped: skipped };
  }

  /* ---------- cảnh báo khấu trừ ---------- */
  function cashWarn(inv) {
    var h = norm(inv.httt);
    return inv.tong >= 5000000 && (h === 'tm' || h === 'tien mat' || h === 'tiền mặt' || /^tien mat$/.test(h));
  }

  /* ---------- tách dòng hàng, phân bổ chiết khấu, tính thuế từng dòng ---------- */
  function lines(inv) {
    var goods = [], ckLines = [], notes = [];
    inv.items.forEach(function (it) { if (it.tc === '3') ckLines.push(it); else if (it.tc === '4') notes.push(it); else goods.push(it); });
    var L = goods.map(function (it) {
      var r = rateOf(it.ts);
      return { it: it, rate: r, sl: it.sl, dg: it.dg, tt: it.thanhTien, ck: it.ck || 0, tlck: it.tlck || 0, thue: it.tienThue || 0, km: it.tc === '2', note: false };
    });
    // chiết khấu thương mại dạng dòng riêng → phân bổ vào cột Tiền chiết khấu của các dòng cùng thuế suất
    ckLines.forEach(function (c) {
      var r = rateOf(c.ts), pool = L.filter(function (l) { return !l.km && (!r.ts || l.rate.ts === r.ts); });
      if (!pool.length) pool = L.filter(function (l) { return !l.km; });
      var tot = pool.reduce(function (s, l) { return s + l.tt; }, 0); if (!tot) return;
      var amt = Math.abs(c.thanhTien), used = 0;
      pool.forEach(function (l, i) { var a = i === pool.length - 1 ? amt - used : Math.round(amt * l.tt / tot); l.ck += a; used += a; l.ckPhanBo = true; });
    });
    // thuế từng dòng: lấy trên hóa đơn nếu có, không thì tính; khớp lại với tổng thuế theo thuế suất của hóa đơn
    var byRate = {};
    L.forEach(function (l) {
      if (!l.thue && l.rate.pct) l.thue = Math.round((l.tt - l.ck) * l.rate.pct / 100);
      if (!l.sl) { l.sl = 1; l.dg = l.tt; }
      (byRate[l.rate.ts] = byRate[l.rate.ts] || []).push(l);
    });
    (inv.thueSuat || []).forEach(function (t) {
      var r = rateOf(t.ts), g = byRate[r.ts]; if (!g || !g.length) return;
      var s = g.reduce(function (a, l) { return a + l.thue; }, 0), d = Math.round(t.thue - s);
      if (d && Math.abs(d) <= Math.max(5, g.length * 2)) { var big = g.slice().sort(function (a, b) { return b.tt - a.tt; })[0]; big.thue += d; }
    });
    notes.forEach(function (n) { L.push({ it: n, rate: { ts: '' }, note: true, tt: 0 }); });
    return L;
  }

  /* ---------- đánh số chứng từ ---------- */
  function Numberer(st) { this.st = st; this.n = {}; }
  Numberer.prototype.next = function (kind) { var v = (this.n[kind] = (this.n[kind] || (+this.st.soBatDau || 1) - 1) + 1); return (this.st.pre[kind] || kind) + C.pad(v, +this.st.doDai || 4); };

  /* ---------- dựng các sheet xuất ---------- */
  function sheetOf(k) { var t = TPL[k]; return { name: t.sheet, pre: t.pre, grp: t.grp, noFilter: true, cols: t.hdr.map(function (h) { return { h: h || '', t: 's', w: Math.min(40, Math.max(10, String(h || '').length + 2)) }; }), rows: [] }; }
  function setTypes(sh, types) { Object.keys(types).forEach(function (i) { if (sh.cols[i]) sh.cols[i].t = types[i]; }); }
  function kyHieu(st, inv) { return st.ghepKyHieu === 'Có' ? String(inv.mauSo || '') + inv.kyHieu : inv.kyHieu; }

  /* map: {partners:{key:ma}, items:{key:{loai,ma,tk,ok}}, inv:{invKey:{nhom,khongDK}}} */
  function build(res, dir, map, st, onlyCheck) {
    st = Object.assign({}, DEF, st || {}); st.pre = Object.assign({}, DEF.pre, (st && st.pre) || {});
    var M = model(res, dir), num = new Numberer(st), missing = [], out = {}, counts = {};
    var invs = M.invs.slice().sort(function (a, b) { return C.ymdCompact(a.ngay).localeCompare(C.ymdCompact(b.ngay)) || (+a.so - +b.so); });
    function need(v, what, inv) { if (v === '' || v == null) missing.push(what + ' – HĐ ' + inv.kyHieu + '-' + inv.so); return v; }
    function sheet(k) { if (!out[k]) { out[k] = sheetOf(k); counts[k] = { ct: 0, dong: 0 }; } return out[k]; }
    invs.forEach(function (inv) {
      var pk = partnerKey(dir, inv), P = partnerOf(dir, inv), maDT = (map.partners || {})[pk] || '', tkCN = (map.pTK || {})[pk] || st.muaTKCongNo;
      var ik = C.invKey(inv), im = (map.inv || {})[ik] || {};
      var nhom = im.khongDK ? '4' : (im.nhom || st.muaNhom || '1');
      if (inv.noXml) { missing.push('Không có chi tiết hàng (HĐ không có XML gốc, cần nhập tay vào MISA) – HĐ ' + inv.kyHieu + '-' + inv.so); return; }
      var L = lines(inv), groups = {};
      L.forEach(function (l) {
        var ik0 = itemKey(dir, l.it), m = l.note ? null : mapOf(map, C.invKey(inv) + '#' + ik0, ik0);
        var loai = l.note ? null : (m.loai || suggest(dir, l.it, inv));
        l.map = m; l.loai = loai;
      });
      // dòng ghi chú đi theo nhóm của dòng hàng đầu tiên
      var firstLoai = (L.filter(function (l) { return !l.note; })[0] || {}).loai;
      L.forEach(function (l) { var g = l.note ? firstLoai : l.loai; if (!g) return; (groups[g] = groups[g] || []).push(l); });
      Object.keys(groups).forEach(function (g) {
        var G = groups[g], ngay = inv.ngay;
        if (dir === 'mua' && (g === 'NK' || g === 'KQK')) {
          var sh = sheet('MH'), soPN = g === 'NK' ? num.next('NK') : '', soGN = g === 'KQK' ? num.next('KQK') : ''; counts.MH.ct++;
          setTypes(sh, { 3: 'd', 4: 'd', 8: 'd', 23: 'n4', 24: 'n4', 25: 'n', 26: 'n4', 27: 'n', 30: 'n' });
          G.forEach(function (l) {
            if (l.note) return;
            var tk = l.map.tk || (g === 'NK' ? st.tkHangHoa : '');
            sh.rows.push([g === 'NK' ? 'Mua hàng trong nước nhập kho' : 'Mua hàng trong nước không qua kho', st.muaPTTT, st.muaNhanHD, ngay, ngay, soPN, soGN, inv.so, ngay,
              need(maDT, 'Mã nhà cung cấp', inv), P.ten, P.dc, P.mst, '', '', '', 'Mua hàng của ' + P.ten,
              need(l.map.ma, 'Mã hàng "' + l.it.ten + '"', inv), l.it.ten, g === 'NK' ? (st.maKho || '') : '', need(tk, 'TK kho/chi phí "' + l.it.ten + '"', inv), tkCN,
              l.it.dvt, l.sl, l.dg, l.tt, l.tlck || '', l.ck || '', l.rate.ts, l.rate.khac || '', l.thue, st.muaTKThue, '', nhom]);
            counts.MH.dong++;
          });
        } else if (dir === 'mua' && g === 'DV') {
          var s2 = sheet('MDV'), so = num.next('MDV'); counts.MDV.ct++;
          setTypes(s2, { 3: 'd', 4: 'd', 28: 'd', 19: 'n4', 20: 'n4', 21: 'n', 22: 'n4', 23: 'n', 26: 'n' });
          G.forEach(function (l) {
            var tk = l.note ? '' : (l.map.tk || st.tkDichVu);
            s2.rows.push([st.muaPTTT, st.muaNhanHD, 'Không', ngay, ngay, so, '', '', maDT, P.ten, P.dc, 'Mua dịch vụ của ' + P.ten,
              l.note ? '' : need(l.map.ma, 'Mã dịch vụ "' + l.it.ten + '"', inv), l.it.ten, l.note ? 'Có' : 'Không', l.note ? '' : need(tk, 'TK chi phí "' + l.it.ten + '"', inv), l.note ? '' : tkCN, maDT,
              l.note ? '' : l.it.dvt, l.note ? '' : l.sl, l.note ? '' : l.dg, l.note ? '' : l.tt, l.note ? '' : (l.tlck || ''), l.note ? '' : (l.ck || ''), l.note ? '' : l.rate.ts, l.rate.khac || '', l.note ? '' : l.thue, l.note ? '' : st.muaTKThue,
              ngay, inv.so, inv.mauSo, kyHieu(st, inv), nhom, need(maDT, 'Mã nhà cung cấp', inv), P.ten, P.mst, P.dc]);
            counts.MDV.dong++;
          });
        } else if (dir === 'mua' && g === 'NVK') {
          var s3 = sheet('NVK'), so3 = num.next('NVK'); counts.NVK.ct++;
          setTypes(s3, { 0: 'd', 1: 'd', 19: 'd', 7: 'n', 14: 'n', 17: 'n' });
          G.forEach(function (l) {
            if (l.note) return;
            var tk = l.map.tk || st.tkNVK, net = l.tt - (l.ck || 0);
            s3.rows.push([ngay, ngay, so3, 'Hóa đơn ' + inv.kyHieu + '-' + inv.so + ' của ' + P.ten, l.it.ten, need(tk, 'TK Nợ (chi phí) "' + l.it.ten + '"', inv), tkCN, net, '', need(maDT, 'Mã nhà cung cấp', inv),
              'Không', 'Thuế GTGT ' + l.it.ten, 'Có', 'Tăng thuế đầu vào', net, l.rate.ts, l.rate.khac || '', l.thue, st.muaTKThue, ngay, inv.so, nhom, maDT, P.ten, P.mst]);
            counts.NVK.dong++;
            if (st.nvkDongThue === 'Có' && l.thue) { s3.rows.push([ngay, ngay, so3, 'Hóa đơn ' + inv.kyHieu + '-' + inv.so + ' của ' + P.ten, 'Thuế GTGT', st.muaTKThue, tkCN, l.thue, '', maDT, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']); counts.NVK.dong++; }
          });
        } else if (dir === 'ban' && g === 'HH') {
          var s4 = sheet('BH'), so4 = num.next('BH'), xk = st.banKiemXuat === 'Có' ? num.next('XK') : ''; counts.BH.ct++;
          setTypes(s4, { 5: 'd', 6: 'd', 12: 'd', 31: 'n4', 32: 'n4', 33: 'n', 34: 'n4', 35: 'n', 43: 'n' });
          G.forEach(function (l) {
            var kx = st.banKiemXuat === 'Có';
            s4.rows.push(['Bán hàng hóa trong nước', st.banPTTT, st.banKiemXuat, 'Có', 'Đã lập', ngay, ngay, so4, xk, inv.mauSo, kyHieu(st, inv), inv.so, ngay,
              need(maDT, 'Mã khách hàng', inv), inv.muaTen || P.ten, P.dc, P.mst, '', '', '', '', 'Bán hàng cho ' + (inv.muaTen || P.ten), kx ? 'Xuất kho bán hàng cho ' + (inv.muaTen || P.ten) : '',
              l.note ? '' : need(l.map.ma, 'Mã hàng "' + l.it.ten + '"', inv), l.it.ten, l.note ? 'Có' : 'Không', l.km ? 'Có' : 'Không', '', l.note ? '' : st.banTKNo, l.note ? '' : (l.map.tk || st.banTKDTHang),
              l.note ? '' : l.it.dvt, l.note ? '' : l.sl, l.note ? '' : l.dg, l.note ? '' : l.tt, l.note ? '' : (l.tlck || ''), l.note ? '' : (l.ck || ''), l.ck ? st.banTKCK : '', '', '', '', '',
              l.note ? '' : l.rate.ts, l.rate.khac || '', l.note ? '' : l.thue, l.note ? '' : st.banTKThue, 'Không', kx && !l.note ? st.banMaKho : '', kx && !l.note ? st.banTKGV : '', kx && !l.note ? st.banTKKho : '', '', '', '']);
            counts.BH.dong++;
          });
        } else if (dir === 'ban' && g === 'DV') {
          var s5 = sheet('BDV'), so5 = num.next('BDV'); counts.BDV.ct++;
          setTypes(s5, { 3: 'd', 4: 'd', 9: 'd', 26: 'n4', 27: 'n4', 28: 'n', 29: 'n4', 30: 'n', 34: 'n' });
          G.forEach(function (l) {
            s5.rows.push([st.banPTTT, 'Có', 'Đã lập', ngay, ngay, so5, inv.mauSo, kyHieu(st, inv), inv.so, ngay, need(maDT, 'Mã khách hàng', inv), inv.muaTen || P.ten, P.dc, P.mst, '', '', '', 'Cung cấp dịch vụ cho ' + (inv.muaTen || P.ten), '',
              l.note ? '' : need(l.map.ma, 'Mã dịch vụ "' + l.it.ten + '"', inv), l.it.ten, l.note ? 'Có' : 'không', l.km ? 'Có' : 'Không', l.note ? '' : st.banTKNo, l.note ? '' : (l.map.tk || st.banTKDTDV),
              l.note ? '' : l.it.dvt, l.note ? '' : l.sl, l.note ? '' : l.dg, l.note ? '' : l.tt, l.note ? '' : (l.tlck || ''), l.note ? '' : (l.ck || ''), l.ck ? st.banTKCK : '', l.note ? '' : l.rate.ts, l.rate.khac || '', l.note ? '' : l.thue, l.note ? '' : st.banTKThue, 'Không']);
            counts.BDV.dong++;
          });
        }
      });
    });
    // gom thiếu sót trùng nhau
    var uniq = {}; missing.forEach(function (m) { var k = m.replace(/ – HĐ .*/, ''); uniq[k] = (uniq[k] || 0) + 1; });
    return { sheets: out, counts: counts, missing: Object.keys(uniq).map(function (k) { return { what: k, n: uniq[k] }; }), model: M };
  }

  /* ---------- danh mục: hệ thống tài khoản (rút gọn, tên theo TT 133/2016; TK 1561 theo TT 200) ---------- */
  var TK = [['111', 'Tiền mặt'], ['1111', 'Tiền Việt Nam'], ['112', 'Tiền gửi ngân hàng'], ['1121', 'Tiền Việt Nam (gửi ngân hàng)'], ['131', 'Phải thu của khách hàng'], ['133', 'Thuế GTGT được khấu trừ'],
    ['1331', 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ'], ['1332', 'Thuế GTGT được khấu trừ của TSCĐ'], ['138', 'Phải thu khác'], ['141', 'Tạm ứng'], ['152', 'Nguyên liệu, vật liệu'], ['153', 'Công cụ, dụng cụ'],
    ['154', 'Chi phí sản xuất, kinh doanh dở dang'], ['155', 'Thành phẩm'], ['156', 'Hàng hóa'], ['1561', 'Giá mua hàng hóa'], ['1562', 'Chi phí thu mua hàng hóa'], ['157', 'Hàng gửi đi bán'],
    ['211', 'Tài sản cố định'], ['2111', 'TSCĐ hữu hình'], ['2113', 'TSCĐ vô hình'], ['214', 'Hao mòn tài sản cố định'], ['242', 'Chi phí trả trước'], ['331', 'Phải trả cho người bán'],
    ['333', 'Thuế và các khoản phải nộp Nhà nước'], ['3331', 'Thuế GTGT phải nộp'], ['33311', 'Thuế GTGT đầu ra'], ['334', 'Phải trả người lao động'], ['335', 'Chi phí phải trả'], ['338', 'Phải trả, phải nộp khác'],
    ['341', 'Vay và nợ thuê tài chính'], ['411', 'Vốn đầu tư của chủ sở hữu'], ['421', 'Lợi nhuận sau thuế chưa phân phối'], ['511', 'Doanh thu bán hàng và cung cấp dịch vụ'], ['5111', 'Doanh thu bán hàng hóa'],
    ['5112', 'Doanh thu bán thành phẩm'], ['5113', 'Doanh thu cung cấp dịch vụ'], ['515', 'Doanh thu hoạt động tài chính'], ['611', 'Mua hàng'], ['631', 'Giá thành sản xuất'], ['632', 'Giá vốn hàng bán'],
    ['635', 'Chi phí tài chính'], ['642', 'Chi phí quản lý kinh doanh'], ['6421', 'Chi phí bán hàng'], ['6422', 'Chi phí quản lý doanh nghiệp'], ['711', 'Thu nhập khác'], ['811', 'Chi phí khác'],
    ['821', 'Chi phí thuế thu nhập doanh nghiệp'], ['911', 'Xác định kết quả kinh doanh']];
  // thứ tự ưu tiên hiện đầu danh sách
  var TK_UU_TIEN = { kho: ['1561', '152', '153', '156', '1562', '155', '211'], cp: ['6421', '6422', '242', '154', '635', '811', '1331'], dt: ['5111', '5113', '5112', '711'], cn: ['331', '1111', '1121', '141'] };
  function tkList(kind) { var first = TK_UU_TIEN[kind] || []; return first.map(function (c) { return TK.filter(function (t) { return t[0] === c; })[0]; }).filter(Boolean).concat(TK.filter(function (t) { return first.indexOf(t[0]) < 0; })); }

  /* ---------- danh mục NCC, VTHH để nhập vào MISA (theo 2 file mẫu anh gửi 18/10/2026) ---------- */
  var PRE_DM = function (loai) { return ['FILE MẪU DANH SÁCH ' + loai + ' ĐỂ NHẬP VÀO PHẦN MỀM AMIS ACCOUNTING', 'Hướng dẫn:', '- Điền dữ liệu vào các cột tương ứng trên file này', '- Các cột có dấu (*) là những cột bắt buộc', '- Nếu muốn nhập nhiều thông tin hơn người dùng có thể tải mẫu đầy đủ' + (loai === 'NHÀ CUNG CẤP' ? '/hoặc tự thêm cột trên mẫu cơ bản' : ' hoặc thêm cột trên mẫu cơ bản'), '- Các dòng dữ liệu phía dưới chỉ là ví dụ minh họa', ''];
  };
  function sheetNCC(rows) {
    return { name: 'Mẫu cơ bản', pre: PRE_DM('NHÀ CUNG CẤP'), noFilter: true, cols: [{ h: 'Mã nhà cung cấp (*)', t: 's', w: 18 }, { h: 'Tên nhà cung cấp (*)', t: 's', w: 44 }, { h: 'Địa chỉ', t: 's', w: 50 }, { h: 'Mã số thuế', t: 's', w: 16 }, { h: 'Mã nhóm nhà cung cấp', t: 's', w: 16 }, { h: 'Tài khoản \ncông nợ phải trả', t: 's', w: 14 }], rows: rows };
  }
  function sheetVTHH(rows) {
    return { name: 'Mẫu cơ bản', pre: PRE_DM('VẬT TƯ HÀNG HÓA'), noFilter: true, cols: [{ h: 'Mã (*)', t: 's', w: 18 }, { h: 'Tên (*)', t: 's', w: 44 }, { h: 'Tính chất', t: 's', w: 14 }, { h: 'Đơn vị tính chính', t: 's', w: 12 }, { h: 'Mã nhóm VTHH', t: 's', w: 12 }, { h: 'Thuế suất GTGT (%)', t: 's', w: 12 }, { h: '% thuế suất KHAC', t: 's', w: 12 }, { h: 'Đơn giá bán ', t: 'n', w: 14 }], rows: rows };
  }
  // thuế suất cho cột "Thuế suất GTGT (%)": 8%, 10% → 8, 10; KCT, KKKNT giữ nguyên; khác → KHAC + % ở cột sau
  function tsDM(ts) { var r = rateOf(ts); if (r.ts === 'KHAC') return ['KHAC', String(r.khac)]; return [r.ts || '', '']; }

  /* ---------- đọc danh mục xuất từ MISA (bảng: dòng tiêu đề + dữ liệu) ---------- */
  function timCot(rows, need) {
    for (var r = 0; r < Math.min(rows.length, 25); r++) {
      var h = rows[r].map(function (v) { return norm(v); }), map = {}, ok = true;
      Object.keys(need).forEach(function (k) { var i = -1; need[k].some(function (re) { i = h.findIndex(function (x) { return re.test(x); }); return i >= 0; }); map[k] = i; if (i < 0 && k !== 'tc' && k !== 'dc' && k !== 'mst' && k !== 'ten') ok = false; });
      if (ok && map.ma >= 0) return { row: r, col: map };
    }
    return null;
  }
  function docDanhMucNCC(rows) {
    var f = timCot(rows, { ma: [/^ma (nha cung cap|ncc|doi tuong)/, /^ma\s*\(\*\)/, /^ma$/], ten: [/^ten/], mst: [/ma so thue|^mst/], dc: [/^dia chi/] });
    if (!f || f.col.mst < 0) throw new Error('Không tìm thấy cột "Mã" và "Mã số thuế" trong file danh mục nhà cung cấp');
    var out = {}, n = 0;
    rows.slice(f.row + 1).forEach(function (r) { var mst = String(r[f.col.mst] || '').replace(/\s/g, ''), ma = String(r[f.col.ma] || '').trim(); if (mst && ma) { out[mst] = ma; n++; } });
    return { byMST: out, n: n };
  }
  function docDanhMucVTHH(rows) {
    var f = timCot(rows, { ma: [/^ma (vat tu|hang|vthh)/, /^ma\s*\(\*\)/, /^ma$/], ten: [/^ten/], tc: [/tinh chat/] });
    if (!f || f.col.ten < 0) throw new Error('Không tìm thấy cột "Mã" và "Tên" trong file danh mục vật tư hàng hóa');
    var byMa = {}, byTen = {}, n = 0;
    rows.slice(f.row + 1).forEach(function (r) { var ma = String(r[f.col.ma] || '').trim(), ten = String(r[f.col.ten] || '').trim(); if (!ma || !ten) return; var o = { ma: ma, ten: ten, tc: f.col.tc >= 0 ? String(r[f.col.tc] || '') : '' }; byMa[norm(ma)] = o; byTen[norm(ten)] = o; n++; });
    return { byMa: byMa, byTen: byTen, n: n };
  }

  var TEN_FILE = { MH: 'Mua_hang_trong_nuoc', MDV: 'Mua_dich_vu', NVK: 'Nghiep_vu_khac', BH: 'Ban_hang', BDV: 'Ban_dich_vu' };
  var TEN_MAU = { MH: 'Mua hàng trong nước', MDV: 'Mua dịch vụ', NVK: 'Nghiệp vụ khác', BH: 'Bán hàng', BDV: 'Bán dịch vụ' };
  return { mapOf: mapOf, TK: TK, tkList: tkList, sheetNCC: sheetNCC, sheetVTHH: sheetVTHH, tsDM: tsDM, docDanhMucNCC: docDanhMucNCC, docDanhMucVTHH: docDanhMucVTHH, norm: norm, laNVK: laNVK, DEF: DEF, LOAI_MUA: LOAI_MUA, LOAI_BAN: LOAI_BAN, model: model, build: build, suggest: suggest, itemKey: itemKey, partnerKey: partnerKey, cashWarn: cashWarn, rateOf: rateOf, lines: lines, TEN_FILE: TEN_FILE, TEN_MAU: TEN_MAU };
})();
