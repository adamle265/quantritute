/* ==========================================================================
   HD-TOKHAI – lập số liệu tờ khai thuế GTGT mẫu 01/GTGT (phương pháp khấu trừ)
   từ hóa đơn đã nạp ở thẻ 2.
   Căn cứ cấu trúc: mẫu 01/GTGT theo TT 89/2026/TT-BTC (chỉ tiêu [21]–[43], có [32b], [34a])
   và file tờ khai Q2/2026 xuất từ MISA anh Minh Tuấn gửi 17/10/2026.
   Quy tắc đã chốt:
   - HĐ 8% (giảm thuế NQ 204/2025/QH15) kê vào nhóm 10%: [32] giá trị, [33] số thuế thực tế 8%;
     kèm phụ lục giảm thuế: mục I mua vào (cột thuế = giá trị × 8%, anh xác nhận 17/10),
     mục II bán ra (thuế được giảm = giá trị × 2%).
   - HĐ đã bị thay thế / đã bị hủy: không kê.
   - Không đủ điều kiện khấu trừ: người dùng đánh dấu (nhóm 4) → vẫn vào [23]/[24], không vào [25].
   ========================================================================== */
var HDToKhai = (function () {
  'use strict';
  var C = HDCore;
  function r0(n) { return Math.round(C.num(n)); }

  function periodOf(kieu, so, nam) {
    nam = +nam; so = +so;
    if (kieu === 'quy') return { from: new Date(nam, (so - 1) * 3, 1), to: new Date(nam, so * 3, 0), nhan: 'Quý ' + so + ' năm ' + nam };
    return { from: new Date(nam, so - 1, 1), to: new Date(nam, so, 0), nhan: 'Tháng ' + C.pad(so) + ' năm ' + nam };
  }
  function inPeriod(inv, p) { var d = C.dmyToDate(C.dmy(inv.ngay)); return d && d >= p.from && d <= p.to; }

  // nhóm thuế suất bán ra
  function nhomBan(ts) {
    var s = String(ts || '').toUpperCase().replace(/\s/g, '');
    if (s === 'KCT') return 'kct';
    if (s === 'KKKNT') return 'kkknt';
    var m = s.match(/^(\d+(?:[.,]\d+)?)%?$/); if (m) { var v = parseFloat(m[1].replace(',', '.')); if (v === 0) return '0'; if (v === 5) return '5'; if (v === 10) return '10'; if (v === 8) return '8'; return 'khac'; }
    return s ? 'khac' : 'khongro';
  }
  // tách hóa đơn theo thuế suất: ưu tiên bảng tổng hợp thuế suất (LTSuat) của HĐ, không có thì cộng từ dòng hàng
  // tách theo thuế suất, khớp tổng chưa thuế / tiền thuế của HĐ (xem HDCore.tachTS)
  function parts(inv) { return C.tachTS(inv); }

  // mặt hàng 8% của 1 HĐ cho phụ lục NQ 204: dòng hàng (tính chất 1, 2) được co giãn cho khớp tổng 8% của HĐ
  // (để trừ chiết khấu thương mại ghi thành dòng riêng)
  function pl8(inv, P, tg, out) {
    var target = 0; P.forEach(function (x) { if (nhomBan(x.ts) === '8') target += x.ct; }); if (!target) return;
    var its = inv.items.filter(function (it) { return (it.tc === '1' || it.tc === '2' || it.tc === '') && nhomBan(it.ts) === '8' && it.thanhTien; });
    var sum = its.reduce(function (s, it) { return s + it.thanhTien; }, 0);
    if (!sum) { out.push({ ten: '(HĐ ' + inv.kyHieu + '-' + inv.so + ' không có chi tiết hàng hóa)', ct: r0(target * tg) }); return; }
    var k = target / sum, acc = 0;
    its.forEach(function (it, i) { var v = i === its.length - 1 ? r0(target * tg) - acc : r0(it.thanhTien * k * tg); acc += v; out.push({ ten: it.ten, ct: v }); });
  }

  /* inp: {kieu, so, nam, mau:'TT89'|'TT80', c22, c32b, c34a, c37, c38, c39a, c40b, c42, khongPS}
     invMap: {invKey: {nhom, khongDK}} (dùng chung với thẻ 5) */
  function compute(res, inp, invMap) {
    invMap = invMap || {};
    var p = periodOf(inp.kieu, inp.so, inp.nam), warns = [];
    var ban = [], mua = [], pl8Mua = [], pl8Ban = [];
    var c = { c23: 0, c24: 0, c23a: 0, c24a: 0, c25: 0, c26: 0, c29: 0, c30: 0, c31: 0, c32: 0, c33: 0, c32a: 0 };
    var nB = 0, nM = 0, ngoaiKy = 0, loaiTru = 0, khac = 0;
    res.list.forEach(function (inv) {
      if (inv.loai !== 'Bán ra' && inv.loai !== 'Mua vào') { khac++; return; }
      if (!inPeriod(inv, p)) { ngoaiKy++; return; }
      if (inv.loaiTru) { loaiTru++; return; }
      if (inv.tienTe && inv.tienTe !== 'VND' && inv.tyGia && inv.tyGia !== 1) warns.push('HĐ ' + inv.kyHieu + '-' + inv.so + ' lập bằng ' + inv.tienTe + ': số liệu đã quy đổi theo tỷ giá ' + inv.tyGia + ' ghi trên HĐ.');
      var tg = inv.tienTe && inv.tienTe !== 'VND' ? (inv.tyGia || 1) : 1;
      if (inv.tthai === '3' || (inv.lq && inv.lq.tc === '2')) warns.push('HĐ điều chỉnh ' + inv.kyHieu + '-' + inv.so + ' (' + (inv.loai === 'Bán ra' ? inv.muaTen : inv.banTen) + '): kiểm tra dấu tăng/giảm trước khi nộp.');
      if (inv.noXml && !inv.chuaThue && !inv.thue && inv.tong) warns.push('HĐ ' + inv.kyHieu + '-' + inv.so + ' (' + (inv.loai === 'Bán ra' ? inv.muaTen : inv.banTen) + ') không có XML gốc và cổng thuế không trả số tiền chưa thuế/tiền thuế (chỉ có tổng ' + C.fmtMoney(inv.tong) + ' đ): PHẢI tự nhập số liệu HĐ này.');
      else if (inv.noXml) warns.push('HĐ ' + inv.kyHieu + '-' + inv.so + ' không có XML gốc: chỉ có số tổng' + (inv.thueSuat.length ? '' : ', chưa rõ thuế suất – đang xếp theo tỷ lệ thuế/giá trị') + '.');
      // HĐ không có XML gốc: người dùng có thể tự chọn thuế suất (inp.tsSua) thay cho thuế suất gợi ý theo tỷ lệ
      var tsSua = inv.noXml && inp.tsSua ? inp.tsSua[C.invKey(inv)] : '';
      var P = tsSua ? [{ ts: tsSua, ct: inv.chuaThue, th: inv.thue }] : parts(inv);
      if (inv.loai === 'Bán ra') {
        nB++;
        P.forEach(function (x) {
          var g = nhomBan(x.ts), ct = r0(x.ct * tg), th = r0(x.th * tg);
          if (g === 'khongro') { var rr = ct ? th / ct : 0; g = rr > 0.095 ? '10' : rr > 0.07 ? '8' : rr > 0.04 ? '5' : (th ? 'khac' : (ct ? '0' : '10')); }
          if (g === 'kct') c.c26 += ct; else if (g === '0') c.c29 += ct; else if (g === '5') { c.c30 += ct; c.c31 += th; }
          else if (g === '10' || g === '8') { c.c32 += ct; c.c33 += th; }
          else if (g === 'kkknt') c.c32a += ct;
          else { c.c32 += ct; c.c33 += th; warns.push('HĐ ' + inv.kyHieu + '-' + inv.so + ' có thuế suất "' + x.ts + '" – đang tạm kê vào [32]/[33], cần kiểm tra.'); }
          ban.push({ nhom: g === '8' ? '10' : (g === 'khongro' || g === 'khac' ? '10' : g), inv: inv, ct: ct, th: th, ts: x.ts });
        });
        pl8(inv, P, tg, pl8Ban);
      } else {
        nM++;
        var m = invMap[C.invKey(inv)] || {}, nhom = m.khongDK ? '4' : (m.nhom || inp.defNhom || '1');
        var ct = 0, th = 0; P.forEach(function (x) { ct += r0(x.ct * tg); th += r0(x.th * tg); });
        c.c23 += ct; c.c24 += th; if (nhom !== '4') c.c25 += th;
        mua.push({ nhom: nhom, inv: inv, ct: ct, th: th, ts: P.map(function (x) { return x.ts; }).filter(Boolean).join(', ') });
        pl8(inv, P, tg, pl8Mua);
      }
    });
    // chỉ tiêu nhập tay
    var v = function (k) { return r0(inp[k] || 0); };
    c.c22 = v('c22'); c.c32b = inp.mau === 'TT80' ? 0 : v('c32b'); c.c34a = inp.mau === 'TT80' ? 0 : v('c34a');
    c.c37 = v('c37'); c.c38 = v('c38'); c.c39a = v('c39a'); c.c40b = v('c40b'); c.c42 = v('c42');
    c.c27 = c.c29 + c.c30 + c.c32 + c.c32a - c.c32b;
    c.c28 = c.c31 + c.c33;
    c.c34 = c.c26 + c.c27 + c.c34a;
    c.c35 = c.c28;
    c.c36 = c.c35 - c.c25;
    var x = c.c36 - c.c22 + c.c37 - c.c38 - c.c39a;
    c.c40a = Math.max(x, 0); c.c41 = Math.max(-x, 0);
    if (c.c40b > c.c40a) warns.push('[40b] lớn hơn [40a] – kiểm tra lại số bù trừ dự án đầu tư.');
    c.c40 = c.c40a - c.c40b;
    if (c.c42 > c.c41) warns.push('[42] (đề nghị hoàn) không được lớn hơn [41].');
    c.c43 = c.c41 - c.c42;
    c.khongPS = !nB && !nM;
    // phụ lục giảm thuế: gom theo tên hàng
    function gom(a) { var g = {}; a.forEach(function (x) { var k = C.boDau(x.ten).toLowerCase().trim(); (g[k] = g[k] || { ten: x.ten, ct: 0 }).ct += x.ct; }); return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return a.ten.localeCompare(b.ten); }); }
    var plMua = gom(pl8Mua).map(function (x) { return { ten: x.ten, ct: x.ct, giam: r0(x.ct * 0.08) }; });
    var plBan = gom(pl8Ban).map(function (x) { return { ten: x.ten, ct: x.ct, giam: r0(x.ct * 0.02) }; });
    if (ban.some(function (b) { return b.inv.noXml; }) || mua.some(function (b) { return b.inv.noXml; })) warns.push('Có HĐ không có XML gốc: phụ lục giảm thuế NQ 204 có thể thiếu mặt hàng 8% của các HĐ này.');
    return { ky: p, c: c, ban: ban, mua: mua, plMua: plMua, plBan: plBan, warns: warns, dem: { ban: nB, mua: nM, ngoaiKy: ngoaiKy, loaiTru: loaiTru, khac: khac } };
  }

  // các dòng tờ khai (đúng thứ tự mẫu)
  function rows(R, mau) {
    var c = R.c, tt89 = mau !== 'TT80';
    var L = [
      ['A', 'Không phát sinh hoạt động mua, bán trong kỳ (đánh dấu "X")', '[21]', c.khongPS ? 'X' : '', '', ''],
      ['B', 'Thuế giá trị gia tăng còn được khấu trừ kỳ trước chuyển sang', '', '', '[22]', c.c22],
      ['C', 'Kê khai thuế giá trị gia tăng phải nộp ngân sách nhà nước', '', '', '', ''],
      ['I', 'Hàng hóa, dịch vụ (HHDV) mua vào trong kỳ', '', '', '', ''],
      ['1', 'Giá trị và thuế giá trị gia tăng của hàng hóa, dịch vụ mua vào', '[23]', c.c23, '[24]', c.c24],
      ['', 'Trong đó: hàng hóa, dịch vụ nhập khẩu', '[23a]', c.c23a, '[24a]', c.c24a],
      ['2', 'Thuế giá trị gia tăng của hàng hóa, dịch vụ mua vào được khấu trừ kỳ này', '', '', '[25]', c.c25],
      ['II', 'Hàng hóa, dịch vụ bán ra trong kỳ', '', '', '', ''],
      ['1', 'Hàng hóa, dịch vụ bán ra không chịu thuế giá trị gia tăng', '[26]', c.c26, '', ''],
      ['2', 'Hàng hóa, dịch vụ bán ra chịu thuế giá trị gia tăng ([27]=[29]+[30]+[32]+[32a]' + (tt89 ? '-[32b]' : '') + '; [28]=[31]+[33])', '[27]', c.c27, '[28]', c.c28],
      ['a', 'Hàng hóa, dịch vụ bán ra chịu thuế suất 0%', '[29]', c.c29, '', ''],
      ['b', 'Hàng hóa, dịch vụ bán ra chịu thuế suất 5%', '[30]', c.c30, '[31]', c.c31],
      ['c', 'Hàng hóa, dịch vụ bán ra chịu thuế suất 10%', '[32]', c.c32, '[33]', c.c33],
      ['d', 'Hàng hóa, dịch vụ bán ra không phải kê khai, tính nộp thuế', '[32a]', c.c32a, '', '']
    ];
    if (tt89) {
      L.push(['e', 'Hàng hóa, dịch vụ bán ra không tính vào giá tính thuế giá trị gia tăng', '[32b]', c.c32b, '', '']);
      L.push(['3', 'Hàng hóa, dịch vụ bán ra không thuộc phạm vi điều chỉnh của pháp luật thuế giá trị gia tăng', '[34a]', c.c34a, '', '']);
    }
    L.push([tt89 ? '4' : '3', 'Tổng doanh thu và thuế giá trị gia tăng của hàng hóa, dịch vụ bán ra ([34]=[26]+[27]' + (tt89 ? '+[34a]' : '') + '; [35]=[28])', '[34]', c.c34, '[35]', c.c35]);
    L.push(['III', 'Thuế giá trị gia tăng phát sinh trong kỳ ([36]=[35]-[25])', '', '', '[36]', c.c36]);
    L.push(['IV', 'Điều chỉnh tăng, giảm thuế giá trị gia tăng còn được khấu trừ của các kỳ trước', '', '', '', '']);
    L.push(['1', 'Điều chỉnh giảm', '', '', '[37]', c.c37]);
    L.push(['2', 'Điều chỉnh tăng', '', '', '[38]', c.c38]);
    L.push(['V', 'Thuế giá trị gia tăng nhận bàn giao được khấu trừ trong kỳ', '', '', '[39a]', c.c39a]);
    L.push(['VI', 'Xác định nghĩa vụ thuế giá trị gia tăng phải nộp trong kỳ:', '', '', '', '']);
    L.push(['1', 'Thuế GTGT phải nộp của hoạt động sản xuất kinh doanh trong kỳ {[40a]=([36]-[22]+[37]-[38]-[39a]) ≥ 0}', '', '', '[40a]', c.c40a]);
    L.push(['2', 'Thuế GTGT mua vào của dự án đầu tư được bù trừ với thuế GTGT còn phải nộp của hoạt động SXKD cùng kỳ', '', '', '[40b]', c.c40b]);
    L.push(['3', 'Thuế giá trị gia tăng còn phải nộp trong kỳ ([40]=[40a]-[40b])', '', '', '[40]', c.c40]);
    L.push(['4', 'Thuế GTGT chưa khấu trừ hết kỳ này {[41]=([36]-[22]+[37]-[38]-[39a]) ≤ 0}', '', '', '[41]', c.c41]);
    L.push(['4.1', 'Thuế giá trị gia tăng đề nghị hoàn ([42] ≤ [41])', '', '', '[42]', c.c42]);
    L.push(['4.2', 'Thuế giá trị gia tăng còn được khấu trừ chuyển kỳ sau ([43]=[41]-[42])', '', '', '[43]', c.c43]);
    return L;
  }

  var NHOM_BAN = [['kct', '1. Hàng hóa, dịch vụ không chịu thuế giá trị gia tăng (GTGT):'], ['0', '2. Hàng hóa, dịch vụ chịu thuế suất thuế GTGT 0%:'], ['5', '3. Hàng hóa, dịch vụ chịu thuế suất thuế GTGT 5%:'], ['10', '4. Hàng hóa, dịch vụ chịu thuế suất thuế GTGT 10% (gồm HĐ 8% giảm thuế theo NQ 204/2025/QH15, ghi số thuế thực tế):'], ['kkknt', '5. Hàng hóa, dịch vụ không phải kê khai, tính nộp thuế GTGT:']];
  var NHOM_MUA = [['1', '1. Hàng hóa, dịch vụ dùng riêng cho SXKD chịu thuế GTGT và sử dụng cho các hoạt động cung cấp hàng hóa, dịch vụ không kê khai, nộp thuế GTGT đủ điều kiện khấu trừ thuế:'], ['2', '2. Hàng hóa, dịch vụ dùng chung cho SXKD chịu thuế và không chịu thuế đủ điều kiện khấu trừ thuế:'], ['3', '3. Hàng hóa, dịch vụ dùng cho dự án đầu tư đủ điều kiện được khấu trừ thuế:'], ['4', '4. Hàng hóa, dịch vụ không đủ điều kiện được khấu trừ:'], ['5', '5. Hàng hóa, dịch vụ không phải tổng hợp trên tờ khai 01/GTGT:']];

  function sheets(R, inp, info) {
    var tt89 = inp.mau !== 'TT80';
    var head = ['TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu số 01/GTGT – ' + (tt89 ? 'theo Thông tư 89/2026/TT-BTC' : 'theo Thông tư 80/2021/TT-BTC') + ')', 'Kỳ tính thuế: ' + R.ky.nhan, 'Người nộp thuế: ' + (info.ten || '') + '   Mã số thuế: ' + (info.mst || ''), 'Đơn vị tiền: Đồng Việt Nam. Số liệu do công cụ Quản trị tử tế tổng hợp từ hóa đơn điện tử – đối chiếu trước khi nộp.'];
    var tk = { name: 'To khai 01-GTGT', pre: head, noFilter: true, cols: [{ h: 'STT', t: 's', w: 6 }, { h: 'Chỉ tiêu', t: 's', w: 78 }, { h: 'Mã', t: 's', w: 8 }, { h: 'Giá trị HHDV (chưa có thuế GTGT)', t: 'n', w: 20 }, { h: 'Mã', t: 's', w: 8 }, { h: 'Thuế GTGT', t: 'n', w: 18 }], rows: rows(R, inp.mau) };
    function bk(name, title, groups, list, isBan) {
      var cols = [{ h: 'STT', t: 'i', w: 6 }, { h: 'Số hóa đơn', t: 's', w: 12 }, { h: 'Ngày, tháng, năm lập hóa đơn', t: 'd', w: 13 }, { h: 'Ký hiệu', t: 's', w: 10 }, { h: isBan ? 'Tên người mua' : 'Tên người bán', t: 's', w: 40 }, { h: isBan ? 'Mã số thuế người mua' : 'Mã số thuế người bán', t: 's', w: 16 }, { h: isBan ? 'Doanh thu chưa có thuế GTGT' : 'Giá trị HHDV mua vào chưa có thuế', t: 'n', w: 18 }, { h: isBan ? 'Thuế GTGT' : 'Thuế GTGT', t: 'n', w: 15 }, { h: 'Thuế suất', t: 's', w: 9 }, { h: 'Ghi chú', t: 's', w: 30 }];
      var rr = [], tct = 0, tth = 0;
      groups.forEach(function (g, gi) {
        rr.push(['', g[1], '', '', '', '', '', '', '', '']);
        var i = 0, sct = 0, sth = 0;
        list.filter(function (x) { return x.nhom === g[0]; }).sort(function (a, b) { return C.ymdCompact(a.inv.ngay).localeCompare(C.ymdCompact(b.inv.ngay)); }).forEach(function (x) {
          i++; sct += x.ct; sth += x.th; var v = x.inv;
          rr.push([i, v.so, v.ngay, v.kyHieu, isBan ? v.muaTen : v.banTen, isBan ? v.muaMST : v.banMST, x.ct, x.th, x.ts || '', (v.noXml ? 'Không có XML gốc' : '') + (x.nhom === '4' ? 'Không đủ ĐK khấu trừ' : '')]);
        });
        rr.push(['', 'Tổng nhóm ' + (gi + 1), '', '', '', '', sct, sth, '', '']);
        tct += sct; tth += sth;
      });
      return { name: name, pre: [title, 'Kỳ tính thuế: ' + R.ky.nhan + ' · ' + (info.ten || '') + ' · MST ' + (info.mst || '')], noFilter: true, cols: cols, rows: rr, foot: ['', 'TỔNG CỘNG', '', '', '', '', tct, tth, '', ''] };
    }
    var out = [tk, bk('Bang ke ban ra', 'BẢNG KÊ HÓA ĐƠN, CHỨNG TỪ HÀNG HÓA, DỊCH VỤ BÁN RA', NHOM_BAN, R.ban, true), bk('Bang ke mua vao', 'BẢNG KÊ HÓA ĐƠN, CHỨNG TỪ CỦA HÀNG HÓA, DỊCH VỤ MUA VÀO', NHOM_MUA, R.mua, false)];
    if (R.plMua.length || R.plBan.length) {
      var pr = [['', 'I. Hàng hóa, dịch vụ mua vào trong kỳ được áp dụng mức thuế suất thuế GTGT 8%', '', '', '', '']];
      R.plMua.forEach(function (x, i) { pr.push([i + 1, x.ten, x.ct, '', '', x.giam]); });
      pr.push(['', 'Tổng cộng mục I', R.plMua.reduce(function (s, x) { return s + x.ct; }, 0), '', '', R.plMua.reduce(function (s, x) { return s + x.giam; }, 0)]);
      pr.push(['', 'II. Hàng hóa, dịch vụ bán ra trong kỳ', '', '', '', '']);
      R.plBan.forEach(function (x, i) { pr.push([i + 1, x.ten, x.ct, '10', '8', x.giam]); });
      pr.push(['', 'Tổng cộng mục II', R.plBan.reduce(function (s, x) { return s + x.ct; }, 0), '', '', R.plBan.reduce(function (s, x) { return s + x.giam; }, 0)]);
      out.push({ name: 'PL giam thue NQ204', pre: ['GIẢM THUẾ GIÁ TRỊ GIA TĂNG THEO NGHỊ QUYẾT SỐ 204/2025/QH15', 'Kỳ tính thuế: ' + R.ky.nhan], noFilter: true,
        cols: [{ h: 'STT', t: 'i', w: 6 }, { h: 'Tên hàng hóa, dịch vụ', t: 's', w: 50 }, { h: 'Giá trị HHDV chưa có thuế GTGT / Doanh thu HHDV chịu thuế', t: 'n', w: 22 }, { h: 'Thuế suất theo quy định (%)', t: 's', w: 12 }, { h: 'Thuế suất sau giảm (%)', t: 's', w: 12 }, { h: 'Thuế GTGT được giảm', t: 'n', w: 18 }], rows: pr });
    }
    return out;
  }
  /* ---------- file XML tờ khai 01/GTGT theo cấu trúc HTKK (TT 80/2021, pbanTKhaiXML 2.8.3) ----------
     Lập theo file XML mẫu anh Minh Tuấn gửi 18/10/2026 (tờ khai Q3/2026 xuất từ HTKK 5.8.1, maTKhai 842).
     Không có chữ ký số: ký khi nộp qua eTax. Kỳ tháng (kieuKy M, kyKKhai mm/yyyy) CHƯA đối chiếu file mẫu thật. */
  function xesc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ymd(d) { return d.getFullYear() + '-' + C.pad(d.getMonth() + 1) + '-' + C.pad(d.getDate()); }
  function xml(R, inp, nnt) {
    var c = R.c, q = inp.kieu === 'quy', p = R.ky, today = new Date(), t = function (tag, v) { return '<' + tag + '>' + xesc(v) + '</' + tag + '>'; }, e = function (tag) { return '<' + tag + ' />'; };
    var n = function (v) { return String(Math.round(+v || 0)); };
    var L = [];
    L.push('<?xml version="1.0" encoding="UTF-8"?>');
    L.push('<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">');
    L.push('<HSoKhaiThue id="ID-NODETOSIGN-XML"><TTinChung>');
    L.push('<TTinDVu>' + t('maDVu', 'HTKK') + t('tenDVu', 'HỖ TRỢ KÊ KHAI THUẾ') + t('pbanDVu', '5.8.1') + t('ttinNhaCCapDVu', '383FB56A226311FF1A726ACDE182258B') + '</TTinDVu>');
    L.push('<TTinTKhaiThue><TKhaiThue>' + t('maTKhai', '842') + t('tenTKhai', 'TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (Mẫu số 01/GTGT)') + t('moTaBMau', '(Ban hành kèm theo Thông tư số 80/2021/TT-BTC ngày 29 tháng 9 năm 2021 của Bộ trưởng Bộ Tài chính)') + t('pbanTKhaiXML', '2.8.3') + t('loaiTKhai', 'C') + t('soLan', '0'));
    L.push('<KyKKhaiThue>' + t('kieuKy', q ? 'Q' : 'M') + t('kyKKhai', q ? (+inp.so) + '/' + inp.nam : C.pad(inp.so) + '/' + inp.nam) + t('kyKKhaiTuNgay', C.dateToDMY(p.from)) + t('kyKKhaiDenNgay', C.dateToDMY(p.to)) + e('kyKKhaiTuThang') + e('kyKKhaiDenThang') + '</KyKKhaiThue>');
    L.push(t('maCQTNoiNop', nnt.maCQT) + t('tenCQTNoiNop', nnt.tenCQT) + t('ngayLapTKhai', ymd(today)) + '<GiaHan>' + e('maLyDoGiaHan') + e('lyDoGiaHan') + '</GiaHan>' + t('nguoiKy', nnt.nguoiKy) + t('ngayKy', ymd(today)) + e('nganhNgheKD') + '</TKhaiThue>');
    L.push('<NNT>' + t('mst', nnt.mst) + t('tenNNT', nnt.ten) + t('dchiNNT', nnt.dchi) + e('phuongXa') + e('maHuyenNNT') + e('tenHuyenNNT') + t('maTinhNNT', nnt.maTinh) + t('tenTinhNNT', nnt.tenTinh) + (nnt.dthoai ? t('dthoaiNNT', nnt.dthoai) : e('dthoaiNNT')) + e('faxNNT') + (nnt.email ? t('emailNNT', nnt.email) : e('emailNNT')) + '</NNT>');
    L.push('</TTinTKhaiThue></TTinChung>');
    L.push('<CTieuTKhaiChinh>' + t('ma_NganhNghe', '00') + t('ten_NganhNghe', 'Hoạt động sản xuất kinh doanh thông thường') + t('tieuMucHachToan', '1701') +
      '<Header>' + e('ct09') + e('ct10') + '<DiaChiHDSXKDKhacTinhNDTSC>' + e('ct11a_phuongXa_ma') + e('ct11a_phuongXa_ten') + e('ct11b_quanHuyen_ma') + e('ct11b_quanHuyen_ten') + e('ct11c_tinhTP_ma') + e('ct11c_tinhTP_ten') + '</DiaChiHDSXKDKhacTinhNDTSC></Header>' +
      t('ct21', c.khongPS ? '1' : '0') + t('ct22', n(c.c22)) + '<GiaTriVaThueGTGTHHDVMuaVao>' + t('ct23', n(c.c23)) + t('ct24', n(c.c24)) + '</GiaTriVaThueGTGTHHDVMuaVao>' +
      '<HangHoaDichVuNhapKhau>' + t('ct23a', n(c.c23a)) + t('ct24a', n(c.c24a)) + '</HangHoaDichVuNhapKhau>' + t('ct25', n(c.c25)) + t('ct26', n(c.c26)) +
      '<HHDVBRaChiuThueGTGT>' + t('ct27', n(c.c27)) + t('ct28', n(c.c28)) + '</HHDVBRaChiuThueGTGT>' + t('ct29', n(c.c29)) +
      '<HHDVBRaChiuTSuat5>' + t('ct30', n(c.c30)) + t('ct31', n(c.c31)) + '</HHDVBRaChiuTSuat5><HHDVBRaChiuTSuat10>' + t('ct32', n(c.c32)) + t('ct33', n(c.c33)) + '</HHDVBRaChiuTSuat10>' + t('ct32a', n(c.c32a)) +
      '<TongDThuVaThueGTGTHHDVBRa>' + t('ct34', n(c.c34)) + t('ct35', n(c.c35)) + '</TongDThuVaThueGTGTHHDVBRa>' + t('ct36', n(c.c36)) + t('ct37', n(c.c37)) + t('ct38', n(c.c38)) + t('ct39a', n(c.c39a)) +
      t('ct40a', n(c.c40a)) + t('ct40b', n(c.c40b)) + t('ct40', n(c.c40)) + t('ct41', n(c.c41)) + t('ct42', n(c.c42)) + t('ct43', n(c.c43)) + '</CTieuTKhaiChinh>');
    if (R.plMua.length || R.plBan.length) {
      var tm = 0, tmt = 0, tb = 0, tbg = 0;
      L.push('<PLuc><PL_NQ142_GTGT><HH_DV_MuaVaoTrongKy>');
      R.plMua.forEach(function (x, i) { tm += x.ct; tmt += x.giam; L.push('<BangKeTenHHDV ID="ID_' + (i + 1) + '">' + t('tenHHDVMuaVao', x.ten) + t('giaTriHHDVMuaVao', n(x.ct)) + t('thueGTGTHHDV', n(x.giam)) + '</BangKeTenHHDV>'); });
      L.push(t('tongCongGiaTriHHDVMuaVao', n(tm)) + t('tongCongThueGTGTHHDV', n(tmt)) + '</HH_DV_MuaVaoTrongKy><HH_DV_BanRaTrongKy>');
      R.plBan.forEach(function (x, i) { tb += x.ct; tbg += x.giam; L.push('<BangKeTenHHDV ID="ID_' + (i + 1) + '">' + t('tenHHDV', x.ten) + t('giaTriHHDV', n(x.ct)) + t('thueSuatTheoQuyDinh', '10') + t('thueSuatSauGiam', '8') + t('thueGTGTDuocGiam', n(x.giam)) + '</BangKeTenHHDV>'); });
      // ct9 = thuế được giảm của bán ra − thuế GTGT của mua vào 8% (khớp file mẫu: 4.313.965 − 4.704.282 = −390.317)
      L.push(t('tongCongGiaTriHHDV', n(tb)) + t('tongCongThueGTGTDuocGiam', n(tbg)) + '</HH_DV_BanRaTrongKy><ChenhLech>' + t('ct9', n(tbg - tmt)) + '</ChenhLech></PL_NQ142_GTGT></PLuc>');
    }
    L.push('</HSoKhaiThue></HSoThueDTu>');
    return L.join('\n');
  }
  // đọc file XML tờ khai kỳ trước: lấy thông tin người nộp thuế, cơ quan thuế và [43] để điền [22]
  function docXmlCu(text) {
    var d = new DOMParser().parseFromString(text, 'application/xml');
    var g = function (tag) { var el = d.getElementsByTagName(tag)[0]; return el ? el.textContent.trim() : ''; };
    if (!g('maTKhai')) throw new Error('Không phải file XML tờ khai');
    return { mst: g('mst'), ten: g('tenNNT'), dchi: g('dchiNNT'), maTinh: g('maTinhNNT'), tenTinh: g('tenTinhNNT'), maCQT: g('maCQTNoiNop'), tenCQT: g('tenCQTNoiNop'), nguoiKy: g('nguoiKy'), dthoai: g('dthoaiNNT'), email: g('emailNNT'),
      ky: g('kyKKhai'), kieuKy: g('kieuKy'), ct43: +g('ct43') || 0 };
  }
  return { periodOf: periodOf, compute: compute, rows: rows, sheets: sheets, nhomBan: nhomBan, xml: xml, docXmlCu: docXmlCu };
})();
