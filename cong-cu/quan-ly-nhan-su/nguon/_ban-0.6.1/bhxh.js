  /* =====================================================================
     MODULE BẢO HIỂM XÃ HỘI (bổ sung vào bản 0.6.1 – 12/11/2026 18:32, anh Tuấn yêu cầu)
       1. BHXH là module con trong nhóm Lương: Danh sách đóng BH · Đối chiếu C12 · Thiết lập BHXH
       2. Mọi thiết lập liên quan BHXH chuyển về Thiết lập BHXH: mã đơn vị, cơ quan BHXH, mức đóng TNLĐ–BNN, khoản trả thêm Điều 168,
          tỷ lệ đóng BH + KPCĐ, mức tham chiếu (lương cơ sở) – Thiết lập tính lương không còn hiện các mục này
       3. Đối chiếu C12: tải lên file PDF mẫu C12-TS (QĐ 505/QĐ-BHXH) tải từ cổng BHXH → đọc ngay trên máy (pdf.js) →
          so số lao động, quỹ lương, số phải đóng từng quỹ với bảng lương cùng tháng; chỉ ra người cần báo tăng/giảm, đổi mức đóng
     Dữ liệu theo công ty: u.bh = { cfg: { maDv, coQuan }, c12: { 'yyyy-mm': kết quả đọc C12 }, mau: phiên bản mẫu }
     Số liệu bảng lương lấy từ bảng lương đã chốt (nếu có), chưa chốt thì tính theo lgCalc như trang Bảng lương.
     ===================================================================== */
  var BH_F = [['od', 'BHXH ốm đau, thai sản', 'ÔĐ, TS'], ['ht', 'BHXH hưu trí, tử tuất', 'HTTT'], ['yt', 'BHYT', 'BHYT'], ['tn', 'BHTN', 'BHTN'], ['ld', 'BHTNLĐ, BNN', 'TNLĐ-BNN']];
  var BH_MAU_V = '2026-11-12b';
  (function () {
    var i = MODS.map(function (m) { return m.id; }).indexOf('bhxh'); if (i >= 0) MODS.splice(i, 1);
    var j = MODS.map(function (m) { return m.id; }).indexOf('congthuc');
    MODS.splice(j + 1, 0,
      { id: 'bhxh', g: 'lg', t: 'Bảo hiểm xã hội', st: 'ok', par: 1, go: 'bhds', k: 'bhxh bao hiem xa hoi bhyt bhtn' },
      { id: 'bhds', g: 'lg', p: 'bhxh', t: 'Danh sách đóng BH', st: 'ok', k: 'bhxh danh sach dong bao hiem tang giam lao dong muc dong quy luong' },
      { id: 'bhc12', g: 'lg', p: 'bhxh', t: 'Đối chiếu C12', st: 'ok', k: 'bhxh c12 doi chieu ket qua dong bao hiem co quan bhxh lech no lai cham dong' },
      { id: 'bhtl', g: 'lg', p: 'bhxh', t: 'Thiết lập BHXH', st: 'ok', k: 'thiet lap bhxh ty le dong muc tham chieu luong co so ma don vi tnld dieu 168' });
    var t = TREE.indexOf('bhxh'); if (t >= 0) TREE.splice(t, 1);
    IC.bhds = IC.bhxh; IC.bhc12 = '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4"/><path d="m9.5 14 2 2 3.5-3.8"/>'; IC.bhtl = IC.bhxh;
  })();
  if (typeof SOON !== 'undefined' && SOON.bhxh) delete SOON.bhxh;

  function bhW(u) { u.bh = u.bh || {}; u.bh.cfg = u.bh.cfg || {}; u.bh.c12 = u.bh.c12 || {}; return u.bh; }
  function bhSave(u, msg) { u.ver = (u.ver || 0) + 1; saveUnits(); if (msg) log('BHXH (' + u.name + '): ' + msg); }
  function bhUnit() { var f = ps('bh', { u: '', ym: '', c: '' }), us = selUnits().length ? selUnits() : S.units; var u = us.filter(function (x) { return x.id === f.u; })[0] || us[0]; f.u = u ? u.id : ''; return u; }
  function bhM(v) { return v == null || v === '' || isNaN(v) ? '—' : lgMoney(v); }
  function bhYmTxt(ym) { return 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4); }
  function bhPrev(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1; if (!m) { m = 12; y--; } return y + '-' + (m < 10 ? '0' : '') + m; }
  function bhPayMonths(u) { try { return blMonths(u).filter(function (m) { return m <= refDate().slice(0, 7); }); } catch (e) { return []; } }

  /* ---------- Số liệu BH theo bảng lương 1 tháng ---------- */
  function bhPay(u, ym) {
    var rows; try { if (typeof blSampleLock === 'function') blSampleLock(); rows = bhPayMonths(u).indexOf(ym) >= 0 ? blRows(u, ym) || [] : []; } catch (e) { logErr('BHXH: tính bảng lương ' + ym, e); rows = []; }
    var days = bcDays(ym), last = days[days.length - 1], T = lgAt('tl', last).v, ref = +lgAt('ref', last).v || 0, s = lgOf(u), vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (lgAt('lttv', last).v || [])[vg] || 0, tnld = +s.tnld || 0;
    var rDn = T.dnOm + T.dnHt + tnld, ppl = [], out = [];
    rows.forEach(function (r) {
      var c = r.c || {}, base = +c.bhBase || 0;
      if (!base) { out.push({ id: r.id, name: r.name, dept: r.dept, why: r.bhWhy || 'Không thuộc diện đóng tháng này', ld: r.ld, ctype: r.ctype }); return; }
      var b1 = Math.min(Math.max(base, ref), 20 * ref), b2 = Math.min(Math.max(base, ref), 20 * ltM), dn = r.dn || [], dXh = dn[0] ? +dn[0][1] || 0 : b1 * rDn / 100;
      var x = { id: r.id, name: r.name, dept: r.dept, ld: r.ld, ctype: r.ctype, base: base, b1: b1, b2: b2,
        nl: { xh: +c.bhxh || 0, yt: +c.bhyt || 0, tn: +c.bhtn || 0 }, dn: { xh: dXh, yt: dn[1] ? +dn[1][1] || 0 : 0, tn: dn[2] ? +dn[2][1] || 0 : 0, kp: dn[3] ? +dn[3][1] || 0 : 0 } };
      x.f = { od: rDn ? dXh * T.dnOm / rDn : 0, ht: x.nl.xh + (rDn ? dXh * T.dnHt / rDn : 0), yt: x.nl.yt + x.dn.yt, tn: x.nl.tn + x.dn.tn, ld: rDn ? dXh * tnld / rDn : 0 };
      x.nlT = x.nl.xh + x.nl.yt + x.nl.tn; x.dnT = x.dn.xh + x.dn.yt + x.dn.tn; x.tot = x.nlT + x.dnT;
      ppl.push(x);
    });
    var sum = function (k) { return ppl.reduce(function (t, x) { return t + (k.call ? k(x) : x[k]); }, 0); };
    var A = { ym: ym, n: ppl.length, ppl: ppl, out: out, ref: ref, ltM: ltM, T: T, tnld: tnld, locked: !!(lgM(u, ym) || {}).lock, has: rows.length > 0,
      q: { od: sum('b1'), ht: sum('b1'), yt: sum('b1'), tn: sum('b2'), ld: sum('b1') }, f: {}, nl: sum('nlT'), dn: sum('dnT'), kp: sum(function (x) { return x.dn.kp; }) };
    BH_F.forEach(function (f) { A.f[f[0]] = Math.round(sum(function (x) { return x.f[f[0]]; })); });
    A.f.cong = BH_F.reduce(function (t, f) { return t + A.f[f[0]]; }, 0);
    A.rate = { od: T.dnOm, ht: T.dnHt + T.nlXh, yt: T.dnYt + T.nlYt, tn: T.dnTn + T.nlTn, ld: tnld };
    return A;
  }
  // tăng / giảm / đổi mức so với tháng trước
  function bhDiff(u, ym, A) {
    var P = bhPay(u, bhPrev(ym)); if (!P.has) return { ok: false, tang: [], giam: [], doi: [] };
    var by = {}; P.ppl.forEach(function (x) { by[x.id] = x; }); var now = {}; A.ppl.forEach(function (x) { now[x.id] = x; });
    var out = {}; A.out.forEach(function (x) { out[x.id] = x; });
    return { ok: true, prev: P,
      tang: A.ppl.filter(function (x) { return !by[x.id]; }),
      giam: P.ppl.filter(function (x) { return !now[x.id]; }).map(function (x) { var o = out[x.id]; return Object.assign({}, x, { why: o ? o.why : 'Không còn trên bảng lương tháng này (đã nghỉ việc?)' }); }),
      doi: A.ppl.filter(function (x) { return by[x.id] && Math.round(by[x.id].b1) !== Math.round(x.b1); }).map(function (x) { return Object.assign({}, x, { b0: by[x.id].b1 }); }) };
  }

  /* ---------- Đọc file C12 (PDF) ---------- */
  function bhNum(s, ratio) {
    s = String(s || '').trim(); if (!s) return null;
    if (ratio) { var r = +s.replace(',', '.'); return isNaN(r) ? null : r; }
    if (/^-?\d{1,3}([.,]\d{3})+$/.test(s)) return +s.replace(/[.,]/g, '');
    if (/^-?\d+$/.test(s)) return +s;
    var f = +s.replace(/,/g, ''); return isNaN(f) ? null : f;
  }
  function bhIsNum(s) { return /^-?[\d.,]+$/.test(String(s).trim()) && /\d/.test(s); }
  // items: [{ p, s, x, y, w }] (y tính từ trên xuống) → kết quả C12
  function bhParseC12(items) {
    var lines = [], cur = null;
    items.slice().sort(function (a, b) { return a.p - b.p || a.y - b.y || a.x - b.x; }).forEach(function (t) {
      if (cur && cur.p === t.p && Math.abs(cur.y - t.y) <= 3) cur.it.push(t); else { cur = { p: t.p, y: t.y, it: [t] }; lines.push(cur); }
    });
    lines.forEach(function (l) { l.it.sort(function (a, b) { return a.x - b.x; }); l.txt = l.it.map(function (t) { return t.s; }).join(' ').replace(/\s+/g, ' ').trim(); });
    var all = lines.map(function (l) { return l.txt; }).join('\n');
    // cột: tâm các tiêu đề ÔĐ, TS · HTTT · BHYT · BHTN · BNN · CỘNG
    var hd = function (re) { var t = items.filter(function (x) { return re.test(x.s.trim()); })[0]; return t ? t.x + t.w / 2 : null; };
    var cols = [hd(/^ÔĐ,?\s*TS$/i), hd(/^HTTT$/i), hd(/^BHYT$/i), hd(/^BHTN$/i), hd(/^BNN$/i) || hd(/^BHTNLĐ/i), hd(/^CỘNG$/i)];
    if (cols.some(function (c) { return c == null; })) throw new Error('Không thấy bảng số liệu của mẫu C12 (thiếu tiêu đề cột ÔĐ, TS / HTTT / BHYT / BHTN / BNN / CỘNG). File có phải C12 tải từ cổng BHXH không?');
    var colOf = function (t) { var r = t.x + t.w, k = -1; cols.forEach(function (c, i) { if (r > c - 4) k = i; }); return k; };
    var R = {}, sec = '', last = '';
    lines.forEach(function (l) {
      var code = l.it.filter(function (t) { return t.x < 42 && /^([A-DĐ]|\d(\.\d)?)$/.test(t.s.trim()); })[0], lab = l.it.filter(function (t) { return t.x >= 40 && t.x < 180 && !bhIsNum(t.s); }).map(function (t) { return t.s; }).join(' ').trim();
      var nums = l.it.filter(function (t) { return t.x >= 150 && bhIsNum(t.s); });
      var key = '';
      if (code) { var c = code.s.trim(); if (/^[A-DĐ]$/.test(c)) { sec = c; key = c; } else key = sec + '.' + c; }
      else if (/^Trong đó/i.test(lab) && last) key = last + '.nt';
      else return;
      if (!sec) return;
      last = key.replace(/\.nt$/, '');
      var v = [null, null, null, null, null, null], ratio = /5\.2$/.test(key) || /tỷ lệ/i.test(lab);
      nums.forEach(function (t) { var k = colOf(t); if (k >= 0) v[k] = bhNum(t.s, ratio); });
      R[key] = { lab: lab, v: v };
    });
    var g = function (k, i) { return R[k] ? R[k].v[i] : null; }, row = function (k) { var o = {}; BH_F.forEach(function (f, i) { o[f[0]] = g(k, i); }); o.cong = g(k, 5); return o; };
    var m = /Tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i.exec(all), ma = /Mã đơn vị:\s*([A-Z0-9]+)/i.exec(all), kg = /Kính gửi:\s*(.+)/i.exec(all), cq = /^(BẢO HIỂM XÃ HỘI[^\n]*?)\s*(Mẫu|$)/im.exec(all);
    if (!m) throw new Error('Không đọc được tháng trên file C12 (dòng "Tháng … năm …")');
    var X = { ym: m[2] + '-' + (m[1].length < 2 ? '0' : '') + m[1], maDv: ma ? ma[1] : '', ten: kg ? kg[1].replace(/\s+/g, ' ').trim() : '', coQuan: cq ? cq[1].trim() : '',
      truoc: { tong: row('A'), ld: row('A.1'), thua: row('A.2.1'), thieu: row('A.2.2'), lai: row('A.3') },
      ps: { tong: row('B'), tang: row('B.1.1'), giam: row('B.1.2'), quy: row('B.2'), quyTang: row('B.2.1'), quyGiam: row('B.2.2'), phai: row('B.3'), phaiTang: row('B.3.1'), phaiGiam: row('B.3.2'), dcTang: row('B.4.1'), dcGiam: row('B.4.2'), dc: row('B.4.3'), laiSo: row('B.5.1'), laiTl: row('B.5.2'), lai: row('B.5.3') },
      nop: row('C'), pbPhai: row('D.1'), pbLai: row('D.2'),
      sau: { tong: row('Đ'), ld: row('Đ.1'), thua: row('Đ.2.1'), thieu: row('Đ.2.2'), lai: row('Đ.3') }, den: {}, ghi: [] };
    var reD = /đã đóng\s+(BHXH|BHTN|BHTNLĐ,?\s*BNN|BHYT)\s+bắt buộc cho\s+(\d+)\s+lao động đến hết tháng\s+(\d{2})\/(\d{4})/gi, md;
    var flat = all.replace(/\n/g, ' ');
    while ((md = reD.exec(flat))) { var fk = /TNLĐ/i.test(md[1]) ? 'ld' : /BHTN/i.test(md[1]) ? 'tn' : /BHYT/i.test(md[1]) ? 'yt' : 'xh'; X.den[fk] = { n: +md[2], ym: md[4] + '-' + md[3] }; }
    var mn = /Tổng số nộp\s+(thiếu|thừa)\s+là\s+([\d.,]+)\s+đồng.*?trước ngày\s+(\d{2}\/\d{2}\/\d{4})/i.exec(flat);
    if (mn) { X.tongNo = { loai: mn[1].toLowerCase(), v: bhNum(mn[2]), han: mn[3] }; }
    var mk = /kiểm tra điều\s*chỉnh trước ngày\s+(\d{2}\/\d{2}\/\d{4})/i.exec(flat); if (mk) X.hanKt = mk[1];
    if (X.ps.quy.cong == null && X.ps.quy.od == null && X.ps.phai.cong == null) throw new Error('Không đọc được số liệu phát sinh trong kỳ (quỹ lương, phải đóng) trên file C12');
    return X;
  }
  function bhPdfItems(file) {
    return file.arrayBuffer().then(function (buf) { return loadPdfjs().then(function (lib) { return lib.getDocument({ data: new Uint8Array(buf) }).promise; }); }).then(function (pdf) {
      var out = [], chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) (function (i) { chain = chain.then(function () { return pdf.getPage(i).then(function (pg) { var vp = pg.getViewport({ scale: 1 }); return pg.getTextContent().then(function (tc) { tc.items.forEach(function (t) { if (!String(t.str || '').trim()) return; out.push({ p: i, s: t.str, x: t.transform[4], y: vp.height - t.transform[5], w: t.width }); }); }); }); }); })(i);
      return chain.then(function () { return out; });
    });
  }

  /* ---------- So C12 với bảng lương ---------- */
  function bhCompare(u, C) {
    var A = bhPay(u, C.ym), D = A.has ? bhDiff(u, C.ym, A) : { ok: false, tang: [], giam: [], doi: [] }, rows = [], tolM = 1000;
    var cell = function (lab, kind, c12, pay, tol) { var o = { lab: lab, kind: kind, c: c12, p: pay, cols: {} }; ['od', 'ht', 'yt', 'tn', 'ld', 'cong'].forEach(function (k) { var a = c12 ? c12[k] : null, b = pay ? pay[k] : null; if (a == null && b == null) return; var d = (a || 0) - (b || 0); o.cols[k] = { c: a, p: b, d: d, bad: Math.abs(d) > tol }; }); o.bad = Object.keys(o.cols).some(function (k) { return o.cols[k].bad; }); rows.push(o); return o; };
    var nAll = { od: A.n, ht: A.n, yt: A.n, tn: A.n, ld: A.n };
    if (A.has) {
      var ldC = {}; BH_F.forEach(function (f) { ldC[f[0]] = C.sau.ld[f[0]] != null ? C.sau.ld[f[0]] : C.truoc.ld[f[0]] != null ? (C.truoc.ld[f[0]] || 0) + (C.ps.tang[f[0]] || 0) - (C.ps.giam[f[0]] || 0) : null; });
      cell('Số lao động tham gia (cuối kỳ)', 'n', ldC, nAll, 0);
      if (D.ok) { var tg = {}, gm = {}, tC = {}, gC = {}; BH_F.forEach(function (f) { tg[f[0]] = D.tang.length; gm[f[0]] = D.giam.length; tC[f[0]] = C.ps.tang[f[0]] || 0; gC[f[0]] = C.ps.giam[f[0]] || 0; }); cell('Lao động tăng trong tháng', 'n', tC, tg, 0); cell('Lao động giảm trong tháng', 'n', gC, gm, 0); }
      var qC = {}; BH_F.forEach(function (f) { qC[f[0]] = C.ps.quy[f[0]]; }); cell('Quỹ lương đóng BH', 'm', qC, A.q, tolM);
      var pP = {}; BH_F.forEach(function (f) { pP[f[0]] = A.f[f[0]]; }); pP.cong = A.f.cong; cell('Số phải đóng trong tháng', 'm', C.ps.phai, pP, tolM);
    }
    // gợi ý nguyên nhân
    var hint = [], r0 = rows[0], nC = r0 && r0.cols.ht ? r0.cols.ht.c : null;
    if (A.has && nC != null && nC !== A.n) {
      if (A.n > nC) hint.push({ lv: 'bad', t: 'Bảng lương có <b>' + A.n + '</b> người đóng BH, C12 chỉ ghi <b>' + nC + '</b> – có thể chưa <b>báo tăng</b> trên cổng BHXH' + (D.tang.length ? ' cho: ' + D.tang.map(function (x) { return personLink(u, x.id, x.name); }).join(', ') : '; so danh sách người đóng tháng này với danh sách lao động tham gia trên cổng BHXH để tìm người còn thiếu') + '.' });
      else hint.push({ lv: 'bad', t: 'C12 ghi <b>' + nC + '</b> người, bảng lương chỉ có <b>' + A.n + '</b> người đóng BH – có thể chưa <b>báo giảm</b>' + (D.giam.length ? ': ' + D.giam.map(function (x) { return personLink(u, x.id, x.name) + ' <span class="faint">(' + esc(x.why) + ')</span>'; }).join(', ') : ' người đã nghỉ việc, nghỉ không lương từ 14 ngày') + '.' });
    }
    var rq = rows.filter(function (x) { return x.lab === 'Quỹ lương đóng BH'; })[0];
    if (rq && rq.cols.ht && rq.cols.ht.bad && (!r0 || !r0.bad)) hint.push({ lv: 'bad', t: 'Số người khớp nhưng quỹ lương lệch <b>' + bhM(rq.cols.ht.d) + ' đ</b> – kiểm tra người đổi mức lương đóng BH chưa báo điều chỉnh' + (D.doi.length ? ': ' + D.doi.map(function (x) { return personLink(u, x.id, x.name) + ' <span class="faint">(' + bhM(x.b0) + ' → ' + bhM(x.b1) + ')</span>'; }).join(', ') : '') + '.' });
    if (A.has) BH_F.forEach(function (f) { var q = C.ps.quy[f[0]], p = C.ps.phai[f[0]]; if (!q || p == null) return; var rt = Math.round(p / q * 10000) / 100; if (Math.abs(rt - A.rate[f[0]]) >= 0.05) hint.push({ lv: 'warn', t: '<b>' + f[1] + '</b>: C12 tính ' + String(rt).replace('.', ',') + '% quỹ lương, phần mềm đang đặt ' + String(A.rate[f[0]]).replace('.', ',') + '%' + (f[0] === 'ld' ? ' – kiểm tra mức đóng TNLĐ–BNN (0,5% hay 0,3%) ở Thiết lập BHXH' : ' – kiểm tra tỷ lệ đóng ở Thiết lập BHXH') + '.' }); });
    if (D.ok && D.tang.length && (C.ps.tang.ht || 0) < D.tang.length) hint.push({ lv: 'warn', t: 'Người mới vào diện đóng tháng này theo bảng lương: ' + D.tang.map(function (x) { return personLink(u, x.id, x.name); }).join(', ') + ' – C12 ghi tăng ' + (C.ps.tang.ht || 0) + ' người.' });
    // tình hình nộp tiền
    var no = [], thieu = C.sau.thieu.cong || 0, phai = C.ps.phai.cong || 0, laiPs = C.ps.lai.cong || 0, laiNo = C.sau.lai.cong || 0;
    var oldD = Math.max(0, (C.truoc.thieu.cong || 0) - (C.nop.cong || 0)); if (oldD < 1000 && thieu > phai + 1000) oldD = thieu - phai;
    if (oldD > 1000) no.push({ lv: 'bad', t: 'Còn nợ <b>' + bhM(oldD) + ' đ</b> tiền đóng của các kỳ trước chưa nộp (ngoài số phải đóng tháng này ' + bhM(phai) + ' đ) – số này bị tính lãi chậm đóng.' });
    if (laiPs > 0) no.push({ lv: 'bad', t: 'Lãi chậm đóng phát sinh trong tháng: <b>' + bhM(laiPs) + ' đ</b>' + (laiNo ? ' · tổng lãi còn thiếu chuyển kỳ sau: <b>' + bhM(laiNo) + ' đ</b>' : '') + '.' });
    var denLate = Object.keys(C.den).filter(function (k) { return C.den[k].ym < bhPrev(C.ym); });
    if (denLate.length) no.push({ lv: 'warn', t: 'Kết quả đóng mới đến hết: ' + denLate.map(function (k) { return ({ xh: 'BHXH', yt: 'BHYT', tn: 'BHTN', ld: 'TNLĐ–BNN' })[k] + ' tháng ' + C.den[k].ym.slice(5) + '/' + C.den[k].ym.slice(0, 4); }).join(', ') + ' – người lao động có thể bị gián đoạn quyền lợi (chốt sổ, thai sản, BHYT).' });
    var cf = bhW(u).cfg; if (cf.maDv && C.maDv && cf.maDv.toUpperCase() !== C.maDv.toUpperCase()) hint.unshift({ lv: 'bad', t: 'Mã đơn vị trên C12 là <b>' + esc(C.maDv) + '</b>, khác mã đã lưu cho ' + esc(shortUnit(u.name)) + ' (<b>' + esc(cf.maDv) + '</b>) – có thể tải nhầm file của công ty khác.' });
    var nBad = rows.filter(function (x) { return x.bad; }).length;
    return { A: A, D: D, rows: rows, hint: hint, no: no, nBad: nBad, st: !A.has ? 'none' : nBad ? 'lech' : 'khop' };
  }

  /* ---------- Dữ liệu mẫu: C12 hư cấu khớp bảng lương mẫu, tháng 10 cố ý lệch để thử ---------- */
  function bhSample(u) {
    if (u.source !== 'sample') return; var B = bhW(u); if (B.mau === BH_MAU_V) return;
    var edu = /edu/i.test(u.name);
    if (!B.cfg.maDv) { B.cfg.maDv = edu ? 'TD1234A' : 'TD5678B'; B.cfg.coQuan = 'Bảo hiểm xã hội thành phố Hà Nội'; }
    Object.keys(B.c12).forEach(function (k) { if (B.c12[k].mau) delete B.c12[k]; });
    var ms = ['2026-08', '2026-09', '2026-10'], carry = 0, prevPhai = 0;
    ms.forEach(function (ym, mi) {
      var A = bhPay(u, ym); if (!A.has || !A.n) return; var D = mi ? bhDiff(u, ym, A) : { ok: false, tang: [], giam: [] };
      var oct = ym === '2026-10', drop = oct && edu ? (D.tang[0] || A.ppl[A.ppl.length - 1]) : null;
      var ppl = A.ppl.filter(function (x) { return x !== drop; }), q = function (k) { return ppl.reduce(function (t, x) { return t + x[k]; }, 0); };
      var rate = Object.assign({}, A.rate); if (oct && !edu) rate.ld = A.rate.ld === 0.3 ? 0.5 : 0.3; // Health tháng 10: C12 tính TNLĐ–BNN khác mức đang đặt
      var o = function (fn) { var r = {}; BH_F.forEach(function (f) { r[f[0]] = fn(f[0]); }); r.cong = BH_F.reduce(function (t, f) { return t + (r[f[0]] || 0); }, 0); return r; }, z = o(function () { return 0; });
      var split = function (v, base) { return o(function (k) { return base.cong ? Math.round(v * base[k] / base.cong) : 0; }); };
      var quy = o(function (k) { return k === 'tn' ? q('b2') : q('b1'); }); quy.cong = null;
      var phai = o(function (k) { return Math.round(quy[k] * rate[k] / 100); });
      // Edu: đóng đủ hằng tháng · Health: tháng 9 chưa nộp → tháng 10 còn nợ kỳ trước, bị tính lãi
      var truoc = carry, lai = truoc ? o(function (k) { return Math.round(split(truoc, phai)[k] * 0.00644); }) : z;
      var nop = !edu && ym !== '2026-08' ? 0 : phai.cong, sauV = truoc + phai.cong + lai.cong - nop;
      var ldO = function (n) { var r = o(function () { return n; }); r.cong = null; return r; };
      var nTang = mi ? D.tang.filter(function (x) { return x !== drop; }).length : 0, nGiam = mi ? D.giam.length + (drop && D.tang.indexOf(drop) < 0 ? 0 : 0) : 0;
      var X = { ym: ym, mau: 1, file: 'C12 mẫu – ' + u.name + ' – ' + bhYmTxt(ym) + '.pdf', at: '0' + (mi + 1) + '/' + String(+ym.slice(5) + 1).padStart(2, '0') + '/2026 09:00:00', by: 'Dữ liệu mẫu', maDv: B.cfg.maDv, ten: u.name, coQuan: 'BẢO HIỂM XÃ HỘI THÀNH PHỐ HÀ NỘI',
        truoc: { tong: split(truoc, phai), ld: ldO(ppl.length - nTang + nGiam), thua: z, thieu: split(truoc, phai), lai: z },
        ps: { tong: o(function (k) { return phai[k] + lai[k]; }), tang: ldO(nTang), giam: ldO(nGiam), quy: quy, quyTang: z, quyGiam: z, phai: phai, phaiTang: z, phaiGiam: z, dcTang: z, dcGiam: z, dc: z, laiSo: truoc ? split(truoc, phai) : z, laiTl: z, lai: lai },
        nop: split(nop, phai), pbPhai: split(Math.min(nop, phai.cong), phai), pbLai: z, den: {}, ghi: [] };
      X.sau = { tong: split(sauV, phai), ld: ldO(ppl.length), thua: z, thieu: split(sauV - lai.cong, phai), lai: lai };
      var d1 = nop ? ym : bhPrev(ym), d0 = truoc ? bhPrev(bhPrev(ym)) : d1;
      X.den = { xh: { n: ppl.length, ym: d0 }, tn: { n: ppl.length, ym: d0 }, ld: { n: ppl.length, ym: d0 }, yt: { n: ppl.length, ym: d1 } };
      X.tongNo = { loai: sauV > 0 ? 'thiếu' : 'thừa', v: Math.abs(sauV), han: '01/' + String(+ym.slice(5) + 2 > 12 ? 1 : +ym.slice(5) + 2).padStart(2, '0') + '/' + (+ym.slice(5) + 2 > 12 ? '2027' : '2026') };
      carry = sauV - lai.cong > 0 ? sauV - lai.cong : 0; prevPhai = phai.cong; B.c12[ym] = X;
    });
    B.mau = BH_MAU_V; try { saveUnits(); } catch (e) { }
  }

  /* ---------- Giao diện chung ---------- */
  function bhUnitsBar(u, act) { var us = selUnits().length ? selUnits() : S.units; return us.length > 1 ? '<div class="tl-units"><span class="vc-lbl">Công ty</span><div class="seg">' + us.map(function (x) { return '<button class="' + (x.id === u.id ? 'on' : '') + '" data-act="' + act + '" data-id="' + x.id + '">' + esc(shortUnit(x.name)) + '</button>'; }).join('') + '</div></div>' : ''; }
  ACTS['bh-u'] = function (a, id) { PS.bh.u = id; PS.bh.ym = ''; PS.bh.c = ''; render(); };
  function bhKt(n, lab, cls, act, id) { return '<' + (act ? 'button type="button" data-act="' + act + '" data-id="' + (id || '') + '"' : 'div') + ' class="bh-kt' + (cls ? ' ' + cls : '') + '"><b>' + n + '</b><span>' + lab + '</span></' + (act ? 'button' : 'div') + '>'; }

  /* ---------- Trang: Danh sách đóng BH ---------- */
  PAGES.bhds = function () {
    var f = ps('bh', { u: '', ym: '', c: '' }), u = bhUnit(); if (!u) return pageHead('Danh sách đóng bảo hiểm') + noData('dữ liệu');
    lgStyle(); var ms = bhPayMonths(u); if (!ms.length) return pageHead('Danh sách đóng bảo hiểm') + bhUnitsBar(u, 'bh-u') + '<div class="card card-pad"><p class="muted" style="margin:0">Chưa có bảng lương tháng nào để lập danh sách đóng bảo hiểm.</p></div>';
    if (ms.indexOf(f.ym) < 0) f.ym = ms[ms.length - 1];
    var ym = f.ym, A = bhPay(u, ym), D = bhDiff(u, ym, A), C = bhW(u).c12[ym];
    var pick = '<div class="bh-bar">' + bhUnitsBar(u, 'bh-u') + '<select class="input" id="bhYm" style="width:auto" aria-label="Tháng">' + ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === ym ? ' selected' : '') + '>' + bhYmTxt(m) + '</option>'; }).join('') + '</select>' +
      '<span class="tag ' + (A.locked ? 'tag-ok">Bảng lương đã chốt' : 'tag-warn">Bảng lương chưa chốt – số tạm tính') + '</span>' + (C ? '<button class="btn btn-sm" data-act="bh-go-c12" data-id="' + ym + '">' + ic('bhc12', 15) + 'Xem đối chiếu C12 tháng này</button>' : '') + '</div>';
    var kpi = '<div class="bh-kpi">' + bhKt(A.n, 'người đóng BH', '', 'bh-sc', 'ppl') + bhKt(bhM(A.q.ht), 'quỹ lương đóng BH (đ)') + bhKt(bhM(A.nl), 'người lao động đóng (đ)') + bhKt(bhM(A.dn), 'công ty đóng (đ)') + bhKt(bhM(A.f.cong), 'tổng phải nộp cơ quan BHXH (đ)', 'ok') +
      bhKt(D.ok ? D.tang.length + ' / ' + D.giam.length : '—', 'tăng / giảm so với tháng trước', D.ok && (D.tang.length || D.giam.length || D.doi.length) ? 'warn' : '', 'bh-sc', 'chg') + bhKt(A.out.length, 'người không đóng tháng này', '', 'bh-sc', 'out') + '</div>';
    var fund = '<div class="card card-pad"><h3 style="margin:0 0 8px">Số phải nộp theo từng quỹ <span class="faint" style="font-weight:400;font-size:13px">– cùng cách chia như mẫu C12</span></h3><div class="tbl-wrap" style="max-height:none"><table class="tbl bh-ft"><thead><tr><th></th>' + BH_F.map(function (x) { return '<th class="r">' + x[1] + '</th>'; }).join('') + '<th class="r">Cộng</th></tr></thead><tbody>' +
      '<tr><td>Tỷ lệ (người lao động + công ty)</td>' + BH_F.map(function (x) { return '<td class="r">' + String(A.rate[x[0]]).replace('.', ',') + '%</td>'; }).join('') + '<td class="r">' + String(BH_F.reduce(function (t, x) { return t + A.rate[x[0]]; }, 0)).replace('.', ',') + '%</td></tr>' +
      '<tr><td>Quỹ lương đóng</td>' + BH_F.map(function (x) { return '<td class="r">' + bhM(A.q[x[0]]) + '</td>'; }).join('') + '<td></td></tr>' +
      '<tr class="b"><td>Phải đóng</td>' + BH_F.map(function (x) { return '<td class="r">' + bhM(A.f[x[0]]) + '</td>'; }).join('') + '<td class="r">' + bhM(A.f.cong) + '</td></tr></tbody></table></div><p class="lg-law" style="margin:8px 0 0">Kinh phí công đoàn (' + String(A.T.kpcd).replace('.', ',') + '%, nộp cho công đoàn, không nằm trong C12): ' + bhM(A.kp) + ' đ · mức tham chiếu ' + bhM(A.ref) + ' đ, trần đóng BHXH, BHYT 20 lần = ' + bhM(20 * A.ref) + ' đ, trần BHTN 20 lần lương tối thiểu vùng = ' + bhM(20 * A.ltM) + ' đ.</p></div>';
    var chg = '';
    if (D.ok && (D.tang.length || D.giam.length || D.doi.length)) chg = '<div class="card card-pad" id="bhChg"><h3 style="margin:0 0 4px">Cần báo cơ quan BHXH trong ' + bhYmTxt(ym).toLowerCase() + '</h3><p class="lg-law" style="margin:0 0 10px">So với bảng lương ' + bhYmTxt(bhPrev(ym)).toLowerCase() + ' – lập hồ sơ tăng, giảm, điều chỉnh mức đóng trên cổng BHXH (mẫu D02-LT) để C12 tháng này khớp.</p><div class="bh-chg">' +
      (D.tang.length ? '<div><b class="ok">Báo tăng (' + D.tang.length + ')</b>' + D.tang.map(function (x) { return '<div>' + personLink(u, x.id, x.name) + ' <span class="faint">· ' + esc(x.dept || '') + ' · mức đóng ' + bhM(x.b1) + '</span></div>'; }).join('') + '</div>' : '') +
      (D.giam.length ? '<div><b class="bad">Báo giảm (' + D.giam.length + ')</b>' + D.giam.map(function (x) { return '<div>' + personLink(u, x.id, x.name) + ' <span class="faint">· ' + esc(x.why) + '</span></div>'; }).join('') + '</div>' : '') +
      (D.doi.length ? '<div><b class="warn">Điều chỉnh mức đóng (' + D.doi.length + ')</b>' + D.doi.map(function (x) { return '<div>' + personLink(u, x.id, x.name) + ' <span class="faint">· ' + bhM(x.b0) + ' → ' + bhM(x.b1) + '</span></div>'; }).join('') + '</div>' : '') + '</div></div>';
    else if (!D.ok) chg = '<div class="card card-pad"><p class="muted" style="margin:0">Chưa có bảng lương ' + bhYmTxt(bhPrev(ym)).toLowerCase() + ' nên chưa so được tăng, giảm lao động.</p></div>';
    var tbl = '<div class="card card-pad" id="bhPpl"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="margin:0">Người đóng bảo hiểm ' + bhYmTxt(ym).toLowerCase() + ' (' + A.n + ')</h3><button class="btn btn-sm" data-act="bh-xls">' + ic('xuat', 15) + 'Xuất Excel</button></div><div class="tbl-wrap" style="max-height:none;margin-top:8px"><table class="tbl bh-pt"><thead><tr><th>Nhân sự</th><th class="r">Lương đóng BH</th><th class="r">NLĐ đóng 10,5%</th><th class="r">Công ty đóng</th><th class="r">Tổng</th><th>Ghi chú</th></tr></thead><tbody>' +
      A.ppl.map(function (x) { var t = D.ok && D.tang.indexOf(x) >= 0 ? '<span class="tag tag-ok">Tăng mới</span>' : '', d = D.ok ? D.doi.filter(function (y) { return y.id === x.id; })[0] : null; return '<tr><td>' + personLink(u, x.id, x.name) + '<div class="anv-sub">' + esc(x.id + ' · ' + (x.dept || '')) + '</div></td><td class="r">' + bhM(x.b1) + (x.b1 !== x.base ? '<div class="anv-sub">lương ' + bhM(x.base) + ' (giới hạn trần/sàn)</div>' : '') + '</td><td class="r">' + bhM(x.nlT) + '</td><td class="r">' + bhM(x.dnT) + '</td><td class="r"><b>' + bhM(x.tot) + '</b></td><td>' + t + (d ? '<span class="tag tag-warn">Đổi mức ' + bhM(d.b0) + ' → ' + bhM(d.b1) + '</span>' : '') + '</td></tr>'; }).join('') +
      '<tr class="b"><td>Cộng</td><td class="r">' + bhM(A.q.ht) + '</td><td class="r">' + bhM(A.nl) + '</td><td class="r">' + bhM(A.dn) + '</td><td class="r">' + bhM(A.nl + A.dn) + '</td><td></td></tr></tbody></table></div>' +
      (A.out.length ? '<details class="bh-out" id="bhOut"' + (f.c === 'out' ? ' open' : '') + '><summary>Không đóng bảo hiểm tháng này (' + A.out.length + ')</summary>' + A.out.map(function (x) { return '<div>' + personLink(u, x.id, x.name) + ' <span class="faint">· ' + esc(x.why) + '</span></div>'; }).join('') + '</details>' : '') + '</div>';
    return pageHead('Danh sách đóng bảo hiểm', 'Ai đóng, mức đóng, số phải nộp từng quỹ theo bảng lương ' + bhYmTxt(ym).toLowerCase() + ' của <b>' + esc(shortUnit(u.name)) + '</b>.', '<a class="btn" href="#bhc12">' + ic('bhc12', 15) + 'Đối chiếu C12</a>') + pick + kpi + chg + fund + tbl;
  };
  BINDS.bhds = function () { var s = $('#bhYm'); if (s) s.addEventListener('change', function () { PS.bh.ym = s.value; render(); }); };
  ACTS['bh-sc'] = function (a, id) { var el = id === 'chg' ? $('#bhChg') : id === 'out' ? $('#bhOut') : $('#bhPpl'); if (id === 'out' && el) el.open = true; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  ACTS['bh-go-c12'] = function (a, id) { PS.bh.c = id; go('bhc12'); };
  ACTS['bh-xls'] = function () {
    var u = bhUnit(), ym = PS.bh.ym, A = bhPay(u, ym), D = bhDiff(u, ym, A);
    saveXlsx([{ name: 'Dong BH ' + ym, title: 'DANH SÁCH ĐÓNG BẢO HIỂM ' + bhYmTxt(ym).toUpperCase(), note: u.name + ' · theo bảng lương ' + (A.locked ? 'đã chốt' : 'chưa chốt (tạm tính)') + ' · đơn vị: đồng',
      cols: [{ t: 'Mã NV' }, { t: 'Họ và tên' }, { t: 'Phòng ban' }, { t: 'Lương đóng BH' }, { t: 'NLĐ – BHXH' }, { t: 'NLĐ – BHYT' }, { t: 'NLĐ – BHTN' }, { t: 'Công ty – BHXH (gồm TNLĐ)' }, { t: 'Công ty – BHYT' }, { t: 'Công ty – BHTN' }, { t: 'Tổng' }, { t: 'Ghi chú' }],
      rows: A.ppl.map(function (x) { var d = D.ok ? D.doi.filter(function (y) { return y.id === x.id; })[0] : null; return [x.id, x.name, x.dept || '', Math.round(x.b1), Math.round(x.nl.xh), Math.round(x.nl.yt), Math.round(x.nl.tn), Math.round(x.dn.xh), Math.round(x.dn.yt), Math.round(x.dn.tn), Math.round(x.tot), D.ok && D.tang.indexOf(x) >= 0 ? 'Tăng mới' : d ? 'Đổi mức ' + bhM(d.b0) + ' → ' + bhM(d.b1) : '']; })
        .concat(A.out.map(function (x) { return [x.id, x.name, x.dept || '', '', '', '', '', '', '', '', '', 'Không đóng: ' + x.why]; })) }], 'Dong_BH_' + ym + '.xlsx');
  };

  /* ---------- Trang: Đối chiếu C12 ---------- */
  var BH_ST = { khop: ['Khớp bảng lương', 'ok'], lech: ['Có lệch', 'bad'], none: ['Chưa có bảng lương tháng này', 'mute'] };
  PAGES.bhc12 = function () {
    var f = ps('bh', { u: '', ym: '', c: '' }), u = bhUnit(); if (!u) return pageHead('Đối chiếu C12') + noData('dữ liệu');
    lgStyle(); bhSample(u); var B = bhW(u), ks = Object.keys(B.c12).sort().reverse();
    if (ks.indexOf(f.c) < 0) f.c = ks[0] || '';
    var up = '<label class="bh-up" id="bhDrop"><input type="file" id="bhFile" accept="application/pdf,.pdf" multiple hidden>' + ic('bhc12', 30) + '<span><b>Tải lên file C12 (PDF)</b><small>Kéo thả hoặc bấm để chọn – tải được nhiều tháng một lần. Lấy file trên cổng BHXH: Tra cứu → Kết quả đóng (mẫu C12-TS). File chỉ đọc trên máy này, không gửi đi đâu.</small></span></label><div id="bhUpMsg"></div>';
    var list = ks.length ? '<div class="card card-pad"><h3 style="margin:0 0 8px">C12 đã tải lên – ' + esc(shortUnit(u.name)) + '</h3><div class="tbl-wrap" style="max-height:none"><table class="tbl bh-lt"><thead><tr><th>Tháng</th><th>Mã đơn vị</th><th class="r">Lao động cuối kỳ</th><th class="r">Phải đóng trong tháng</th><th class="r">Còn thiếu chuyển kỳ sau</th><th>Đối chiếu bảng lương</th><th></th></tr></thead><tbody>' +
      ks.map(function (k) { var C = B.c12[k], R = bhCompare(u, C), s = BH_ST[R.st]; return '<tr class="' + (k === f.c ? 'on' : '') + '"><td><a href="#" data-act="bh-c" data-id="' + k + '"><b>' + bhYmTxt(k) + '</b></a>' + (C.mau ? ' <span class="tag tag-mute">mẫu</span>' : '') + '<div class="anv-sub">' + esc(C.file || '') + '</div></td><td class="mono">' + esc(C.maDv || '—') + '</td><td class="r">' + bhM(C.sau.ld.ht) + '</td><td class="r">' + bhM(C.ps.phai.cong) + '</td><td class="r' + (R.no.some(function (h) { return h.lv === 'bad'; }) ? ' down' : '') + '">' + bhM(C.sau.tong.cong) + '</td><td><span class="tag tag-' + s[1] + '">' + s[0] + (R.st === 'lech' ? ' ' + R.nBad + ' mục' : '') + '</span>' + (R.no.length ? ' <span class="tag tag-warn">nợ, lãi</span>' : '') + '</td><td><span class="anv-acts"><button class="btn btn-sm' + (k === f.c ? ' btn-primary' : '') + '" data-act="bh-c" data-id="' + k + '">Xem</button><button class="btn btn-sm dt-ib" data-act="bh-del" data-id="' + k + '" title="Xóa C12 tháng này" aria-label="Xóa">' + ic('td_trash', 14) + '</button></span></td></tr>'; }).join('') + '</tbody></table></div></div>' : '';
    var det = f.c ? bhDetail(u, B.c12[f.c]) : '<div class="card card-pad"><p class="muted" style="margin:0">Chưa có file C12 nào. Tải lên C12 các tháng để phần mềm so với bảng lương.</p></div>';
    return pageHead('Đối chiếu C12', 'So kết quả đóng BHXH, BHYT, BHTN của cơ quan BHXH (mẫu C12-TS) với bảng lương của <b>' + esc(shortUnit(u.name)) + '</b>: số lao động, quỹ lương, số phải đóng từng quỹ, tiền còn thiếu, lãi chậm đóng.', '<a class="btn" href="#bhds">' + ic('bhds', 15) + 'Danh sách đóng BH</a>') +
      '<div class="bh-bar">' + bhUnitsBar(u, 'bh-u') + '</div>' + up + list + det;
  };
  function bhDetail(u, C) {
    var R = bhCompare(u, C), s = BH_ST[R.st], A = R.A, cols = BH_F.map(function (x) { return [x[0], x[2]]; }).concat([['cong', 'Cộng']]);
    var head = '<div class="bh-dh"><div><h2>C12 ' + bhYmTxt(C.ym).toLowerCase() + ' <span class="tag tag-' + s[1] + '">' + s[0] + (R.st === 'lech' ? ' – ' + R.nBad + ' mục' : '') + '</span></h2><p class="muted">' + esc(C.coQuan || '') + (C.maDv ? ' · mã đơn vị <b class="mono">' + esc(C.maDv) + '</b>' : '') + (C.ten ? ' · ' + esc(C.ten) : '') + ' · tải lên ' + esc(C.at || '') + (C.by ? ' – ' + esc(C.by) : '') + '</p></div>' +
      (A.has ? '<a class="btn btn-sm" href="#bhds" data-act="bh-go-ds" data-id="' + C.ym + '">Bảng lương, danh sách đóng BH ' + bhYmTxt(C.ym).toLowerCase() + '</a>' : '') + '</div>';
    var cf = bhW(u).cfg, save = !cf.maDv && C.maDv ? '<div class="notice" style="margin-bottom:12px">' + ic('info') + '<div>Chưa lưu mã đơn vị BHXH cho ' + esc(shortUnit(u.name)) + '. <button class="btn btn-sm" data-act="bh-savema" data-id="' + esc(C.maDv) + '">Lưu mã ' + esc(C.maDv) + '</button> – lần sau phần mềm tự nhận ra file C12 của công ty nào.</div></div>' : '';
    var cmp = '';
    if (!A.has) cmp = '<div class="notice warn">' + ic('info') + '<div>Chưa có bảng lương ' + bhYmTxt(C.ym).toLowerCase() + ' của ' + esc(shortUnit(u.name)) + ' để đối chiếu. Phần dưới chỉ hiện số liệu đọc từ C12.</div></div>';
    else cmp = '<div class="card card-pad"><h3 style="margin:0 0 8px">So với bảng lương ' + bhYmTxt(C.ym).toLowerCase() + (A.locked ? '' : ' <span class="tag tag-warn">bảng lương chưa chốt</span>') + '</h3><div class="tbl-wrap" style="max-height:none"><table class="tbl bh-cmp"><thead><tr><th>Nội dung</th><th></th>' + cols.map(function (c) { return '<th class="r">' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      R.rows.map(function (r) { var fm = function (v) { return v == null ? '<span class="faint">—</span>' : r.kind === 'n' ? fmtInt(v) : bhM(v); };
        return '<tr class="g' + (r.bad ? ' bad' : '') + '"><td rowspan="3"><b>' + esc(r.lab) + '</b>' + (r.bad ? '<div><span class="tag tag-bad">lệch</span></div>' : '<div><span class="tag tag-ok">khớp</span></div>') + '</td><td class="faint">C12</td>' + cols.map(function (c) { var x = r.cols[c[0]]; return '<td class="r">' + (x ? fm(x.c) : '') + '</td>'; }).join('') + '</tr>' +
          '<tr><td class="faint">Bảng lương</td>' + cols.map(function (c) { var x = r.cols[c[0]]; return '<td class="r">' + (x ? fm(x.p) : '') + '</td>'; }).join('') + '</tr>' +
          '<tr class="d"><td class="faint">Chênh lệch</td>' + cols.map(function (c) { var x = r.cols[c[0]]; return '<td class="r' + (x && x.bad ? ' bad' : '') + '">' + (x && x.c != null && x.p != null ? (x.d ? (x.d > 0 ? '+' : '') + (r.kind === 'n' ? x.d : bhM(x.d)) : '0') : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="lg-law" style="margin:8px 0 0">Chênh lệch = C12 − bảng lương. Số tiền lệch dưới 1.000 đồng (làm tròn) coi là khớp. Số liệu bảng lương: lương đóng BH (đã áp sàn, trần) và tỷ lệ ở Thiết lập BHXH.</p></div>';
    var hint = R.hint.length ? '<div class="card card-pad"><h3 style="margin:0 0 8px">Cần kiểm tra</h3><div class="bh-hint">' + R.hint.map(function (h) { return '<div class="' + h.lv + '">' + ic('info', 16) + '<span>' + h.t + '</span></div>'; }).join('') + '</div></div>' : (A.has ? '<div class="notice ok">' + ic('info') + '<div><b>C12 khớp bảng lương</b> về số lao động, quỹ lương và số phải đóng từng quỹ.</div></div>' : '');
    var tot = function (o) { return o && o.cong != null ? o.cong : null; };
    var pay = '<div class="card card-pad"><h3 style="margin:0 0 8px">Tình hình nộp tiền theo C12</h3><div class="bh-kpi c5">' + bhKt(bhM(tot(C.truoc.tong)), 'kỳ trước mang sang (đ)') + bhKt(bhM(tot(C.ps.tong)), 'phát sinh trong tháng (đ)') + bhKt(bhM(tot(C.nop)), 'đã nộp trong tháng (đ)') + bhKt(bhM(tot(C.ps.lai)), 'lãi chậm đóng phát sinh (đ)', tot(C.ps.lai) ? 'bad' : '') + bhKt(bhM(tot(C.sau.tong)), 'chuyển kỳ sau (đ)', R.no.some(function (h) { return h.lv === 'bad'; }) ? 'bad' : 'warn') + '</div>' +
      (R.no.length ? '<div class="bh-hint" style="margin-top:10px">' + R.no.map(function (h) { return '<div class="' + h.lv + '">' + ic('info', 16) + '<span>' + h.t + '</span></div>'; }).join('') + '</div>' : '') +
      (Object.keys(C.den).length ? '<div class="bh-den">' + [['xh', 'BHXH'], ['yt', 'BHYT'], ['tn', 'BHTN'], ['ld', 'TNLĐ–BNN']].filter(function (k) { return C.den[k[0]]; }).map(function (k) { var d = C.den[k[0]]; return '<span><b>' + k[1] + '</b> đã đóng đến hết tháng ' + d.ym.slice(5) + '/' + d.ym.slice(0, 4) + ' (' + d.n + ' người)</span>'; }).join('') + '</div>' : '') +
      (C.tongNo ? '<p class="lg-law" style="margin:8px 0 0">C12 ghi: tổng số nộp ' + esc(C.tongNo.loai) + ' <b>' + bhM(C.tongNo.v) + ' đ</b>' + (C.tongNo.han ? ', nộp trước ngày <b>' + esc(C.tongNo.han) + '</b>' : '') + (C.hanKt ? ' · số liệu chưa thống nhất thì làm việc với cơ quan BHXH trước ' + esc(C.hanKt) : '') + '.</p>' : '') + '</div>';
    var raw = '<details class="card card-pad bh-raw"><summary><b>Số liệu đọc từ C12</b> <span class="faint">– xem lại để chắc phần mềm đọc đúng file</span></summary><div class="tbl-wrap" style="max-height:none;margin-top:8px"><table class="tbl"><thead><tr><th>Mục</th>' + cols.map(function (c) { return '<th class="r">' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      [['A. Kỳ trước mang sang', C.truoc.tong], ['A.1 Số lao động', C.truoc.ld, 1], ['A.2.2 Thiếu', C.truoc.thieu], ['A.3 Thiếu lãi', C.truoc.lai], ['B. Phát sinh trong kỳ', C.ps.tong], ['B.1.1 Lao động tăng', C.ps.tang, 1], ['B.1.2 Lao động giảm', C.ps.giam, 1], ['B.2 Quỹ lương', C.ps.quy], ['B.3 Phải đóng', C.ps.phai], ['B.4 Điều chỉnh kỳ trước (tăng)', C.ps.dcTang], ['B.4 Điều chỉnh kỳ trước (giảm)', C.ps.dcGiam], ['B.5.3 Tiền lãi', C.ps.lai], ['C. Đã nộp trong kỳ', C.nop], ['Đ. Chuyển kỳ sau', C.sau.tong], ['Đ.1 Số lao động', C.sau.ld, 1], ['Đ.2.1 Thừa', C.sau.thua], ['Đ.2.2 Thiếu', C.sau.thieu], ['Đ.3 Thiếu lãi', C.sau.lai]]
        .map(function (r) { return '<tr><td>' + r[0] + '</td>' + cols.map(function (c) { var v = r[1] ? r[1][c[0]] : null; return '<td class="r">' + (v == null ? '' : r[2] ? fmtInt(v) : bhM(v)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
    return '<div class="bh-det">' + head + save + hint + cmp + pay + raw + '</div>';
  }
  BINDS.bhc12 = function () {
    var inp = $('#bhFile'), drop = $('#bhDrop'); if (!inp) return;
    inp.addEventListener('change', function () { bhUpload(Array.prototype.slice.call(inp.files || [])); inp.value = ''; });
    ['dragover', 'dragenter'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove('on'); if (e === 'drop') bhUpload(Array.prototype.slice.call(ev.dataTransfer.files || []).filter(function (f) { return /pdf$/i.test(f.name) || f.type === 'application/pdf'; })); }); });
  };
  function bhUpload(files) {
    if (!files.length) return; var msg = $('#bhUpMsg'), u0 = bhUnit(), us = selUnits().length ? selUnits() : S.units, done = [], err = [];
    if (msg) msg.innerHTML = '<div class="notice">' + ic('info') + '<div>Đang đọc ' + files.length + ' file C12…</div></div>';
    var chain = Promise.resolve();
    files.forEach(function (fl) {
      chain = chain.then(function () { return bhPdfItems(fl).then(function (items) {
        var X = bhParseC12(items), u = us.filter(function (x) { var m = bhW(x).cfg.maDv; return m && X.maDv && m.toUpperCase() === X.maDv.toUpperCase(); })[0] || u0, B = bhW(u);
        X.file = fl.name; X.at = nowVn(); X.by = (typeof ccUser === 'function' ? ccUser() : '') || '';
        var had = !!B.c12[X.ym]; B.c12[X.ym] = X; done.push({ u: u, ym: X.ym, had: had, file: fl.name });
      }).catch(function (e) { err.push(fl.name + ': ' + (e && e.offline ? 'chưa tải được bộ đọc PDF – kiểm tra kết nối mạng rồi thử lại' : (e && e.message) || e)); }); });
    });
    chain.then(function () {
      done.forEach(function (d) { bhSave(d.u, 'tải lên C12 ' + bhYmTxt(d.ym) + (d.had ? ' (thay bản trước)' : '') + ' – ' + d.file); });
      if (done.length) { PS.bh.u = done[0].u.id; PS.bh.c = done[done.length - 1].ym; toast('Đã đọc ' + done.length + ' file C12', 'ok', done.map(function (d) { return bhYmTxt(d.ym) + ' – ' + shortUnit(d.u.name); }).join(', ')); }
      render(); var m2 = $('#bhUpMsg'); if (m2 && err.length) m2.innerHTML = '<div class="notice bad">' + ic('info') + '<div><b>Chưa đọc được ' + err.length + ' file:</b><br>' + err.map(esc).join('<br>') + '</div></div>';
    });
  }
  ACTS['bh-c'] = function (a, id) { PS.bh.c = id; render(); var d = $('.bh-det'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  ACTS['bh-go-ds'] = function (a, id) { PS.bh.ym = id; go('bhds'); };
  ACTS['bh-savema'] = function (a, id) { var u = bhUnit(); bhW(u).cfg.maDv = id; bhSave(u, 'lưu mã đơn vị BHXH ' + id); toast('Đã lưu mã đơn vị', 'ok'); render(); };
  ACTS['bh-del'] = function (a, id) { var u = bhUnit(); confirmBox('Xóa C12 ' + bhYmTxt(id).toLowerCase() + '?', 'Chỉ xóa số liệu đã đọc từ file trong phần mềm, không ảnh hưởng bảng lương. Tải lên lại được bất cứ lúc nào.', 'Xóa', function () { delete bhW(u).c12[id]; if (PS.bh.c === id) PS.bh.c = ''; bhSave(u, 'xóa C12 ' + bhYmTxt(id)); render(); }); };

  /* ---------- Trang: Thiết lập BHXH ---------- */
  PAGES.bhtl = function () {
    var u = bhUnit(); if (!u) return pageHead('Thiết lập BHXH') + noData('dữ liệu');
    lgStyle(); PS.lg = PS.lg || {}; ps('lg', { tab: 'kh', u: '', ym: '', pick: null }).u = u.id;
    var s = lgOf(u), cf = bhW(u).cfg, last = refDate(), T = lgAt('tl', last).v, ref = +lgAt('ref', last).v || 0, vg = Math.max(1, Math.min(4, +s.vung || 1)) - 1, ltM = (lgAt('lttv', last).v || [])[vg] || 0;
    var info = '<div class="card card-pad"><h3 style="margin:0 0 10px">Đơn vị tham gia BHXH – ' + esc(shortUnit(u.name)) + '</h3><div class="form-grid"><div class="field"><label for="bhMa">Mã đơn vị BHXH</label><input class="input mono" id="bhMa" value="' + esc(cf.maDv || '') + '" placeholder="Ví dụ: TD1234A" maxlength="20"><small class="faint">In ở góc trên C12, D02-LT – dùng nhận file C12 đúng công ty</small></div><div class="field"><label for="bhCq">Cơ quan BHXH quản lý</label><input class="input" id="bhCq" value="' + esc(cf.coQuan || '') + '" placeholder="Ví dụ: Bảo hiểm xã hội thành phố Hà Nội"></div></div><div class="link-row" style="justify-content:flex-end"><button class="btn btn-primary" id="bhCfgOk">Lưu</button></div></div>';
    var opt = lgTabBt(u, s, ['tnld', 'd168']).opt;
    var law = lgTabLaw(u, ['tl', 'ref'], 'Tỷ lệ đóng và mức tham chiếu (dùng chung mọi công ty)');
    var rel = '<div class="card card-pad"><h3 style="margin:0 0 6px">Liên quan, đặt ở Thiết lập tính lương</h3><p class="lg-law" style="margin:0">Vùng lương tối thiểu của ' + esc(shortUnit(u.name)) + ': <b>Vùng ' + ['I', 'II', 'III', 'IV'][vg] + '</b> – lương tối thiểu ' + bhM(ltM) + ' đ/tháng: là mức sàn lương đóng BH và trần đóng BHTN (20 lần = ' + bhM(20 * ltM) + ' đ). <a href="#congthuc" data-act="lg-tab" data-id="ct">Sửa ở Thiết lập tính lương ›</a></p></div>';
    var rule = '<div class="card card-pad"><h3 style="margin:0 0 6px">Phần mềm đang tính bảo hiểm như sau</h3><ul class="bh-rule">' +
      '<li><b>Lương đóng BH</b> = lương cơ bản + trợ cấp cố định ghi trong HĐ; thấp nhất bằng mức tham chiếu (' + bhM(ref) + ' đ), cao nhất 20 lần mức tham chiếu (' + bhM(20 * ref) + ' đ); BHTN cao nhất 20 lần lương tối thiểu vùng. <span class="lg-law">Luật BHXH 41/2024 Điều 31; NĐ 158/2025 Điều 7</span></li>' +
      '<li><b>Tỷ lệ</b> người lao động ' + String(T.nlXh + T.nlYt + T.nlTn).replace('.', ',') + '% (BHXH ' + String(T.nlXh).replace('.', ',') + '%, BHYT ' + String(T.nlYt).replace('.', ',') + '%, BHTN ' + String(T.nlTn).replace('.', ',') + '%) · công ty ' + String(T.dnOm + T.dnHt + (+s.tnld || 0) + T.dnYt + T.dnTn).replace('.', ',') + '% (ốm đau, thai sản ' + String(T.dnOm).replace('.', ',') + '%, hưu trí ' + String(T.dnHt).replace('.', ',') + '%, TNLĐ–BNN ' + String(+s.tnld || 0).replace('.', ',') + '%, BHYT ' + String(T.dnYt).replace('.', ',') + '%, BHTN ' + String(T.dnTn).replace('.', ',') + '%) + kinh phí công đoàn ' + String(T.kpcd).replace('.', ',') + '%.</li>' +
      '<li><b>Không đóng</b>: cộng tác viên, hợp đồng dịch vụ; HĐ thử việc riêng; HĐLĐ dưới 01 tháng; bán thời gian có lương tháng thấp hơn mức tham chiếu; tháng nghỉ không lương, nghỉ ốm từ 14 ngày làm việc trở lên. <span class="lg-law">Luật BHXH 41/2024 Điều 2, 33, 34; Luật Việc làm 74/2025 Điều 31, 33</span></li>' +
      '<li>Người có HĐLĐ nhưng không thuộc diện đóng: ' + (s.d168 ? 'đang <b>trả thêm</b> khoản tương đương mức công ty đóng (Điều 168.3) – xem lựa chọn ở trên.' : 'chưa trả thêm khoản Điều 168.3 – chọn ở mục trên nếu công ty áp dụng.') + '</li></ul>' +
      '<p class="lg-law" style="margin:8px 0 0">Mức BHYT 4,5% và BHTN 1% + 1% lấy theo nghị định hướng dẫn – phần đánh dấu "chưa đối chiếu" ở bảng tỷ lệ là mục phần mềm chưa đối chiếu đủ văn bản gốc, công ty nên rà lại trước khi dùng.</p></div>';
    return pageHead('Thiết lập BHXH', 'Mã đơn vị, tỷ lệ đóng, mức tham chiếu và các lựa chọn bảo hiểm của <b>' + esc(shortUnit(u.name)) + '</b> – bảng lương, danh sách đóng BH, đối chiếu C12 đều dùng các thiết lập này.') + '<div class="bh-bar">' + bhUnitsBar(u, 'bh-u') + '</div>' + info + opt + law + rel + rule;
  };
  BINDS.bhtl = function () { var b = $('#bhCfgOk'); if (b) b.addEventListener('click', function () { var u = bhUnit(), cf = bhW(u).cfg; cf.maDv = $('#bhMa').value.trim().toUpperCase(); cf.coQuan = $('#bhCq').value.trim(); bhSave(u, 'thông tin đơn vị BHXH: mã ' + (cf.maDv || '(trống)')); toast('Đã lưu', 'ok'); render(); }); };

  /* ---------- Việc cần xử lý: C12 lệch, nợ BH ---------- */
  Object.assign(HRR.KINDS, { bh_c12: { name: 'C12 lệch bảng lương', law: '' }, bh_no: { name: 'Nợ tiền đóng bảo hiểm', law: '' } });
  if (typeof AL_FIX !== 'undefined') { AL_FIX.bh_c12 = ['Xem đối chiếu C12', 'go:bhc12']; AL_FIX.bh_no = ['Xem C12', 'go:bhc12']; }
  var BHA = { key: null, list: [] };
  var _bhAlertBase = alertList;
  alertList = function () {
    var base = _bhAlertBase(), k = ACACHE.key + '#' + selUnits().map(function (u) { return u.id + ':' + (u.ver || 0); }).join(',');
    if (BHA.key !== k) { var out = []; try { selUnits().forEach(function (u) { var B = u.bh; if (!B || !B.c12) return; var ks = Object.keys(B.c12).sort(); if (!ks.length) return; var ym = ks[ks.length - 1], C = B.c12[ym], R = bhCompare(u, C);
        if (R.st === 'lech') out.push({ kind: 'bh_c12', level: 'canh', id: '', name: '', dept: '', unit: u.name, unitId: u.id, title: 'C12 ' + bhYmTxt(ym).toLowerCase() + ' lệch bảng lương ' + R.nBad + ' mục', detail: R.hint.map(function (h) { return h.t.replace(/<[^>]+>/g, ''); }).slice(0, 2).join(' ') || 'Lương → Bảo hiểm xã hội → Đối chiếu C12', key: u.id + '|bh_c12||' + ym, sources: ['Đối chiếu C12'] });
        if (R.no.some(function (h) { return h.lv === 'bad'; })) out.push({ kind: 'bh_no', level: 'gap', id: '', name: '', dept: '', unit: u.name, unitId: u.id, title: 'Nợ tiền đóng bảo hiểm theo C12 ' + bhYmTxt(ym).toLowerCase(), detail: R.no.map(function (h) { return h.t.replace(/<[^>]+>/g, ''); }).join(' '), key: u.id + '|bh_no||' + ym, sources: ['Đối chiếu C12'] });
      }); } catch (e) { logErr('Tính cảnh báo BHXH', e); } BHA = { key: k, list: out }; }
    return base.concat(BHA.list);
  };
  if (ACTS['al-fix']) { var _bhFix = ACTS['al-fix']; ACTS['al-fix'] = function (b) { try { var a = findAlert(b.getAttribute('data-key')); if (a && (a.kind === 'bh_c12' || a.kind === 'bh_no')) { var f = ps('bh', { u: '', ym: '', c: '' }); f.u = a.unitId; f.c = String(a.key).split('||')[1] || ''; } } catch (e) { } return _bhFix.apply(this, arguments); }; }

  (function () {
    var css = '.bh-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.bh-bar .tl-units{margin:0}' +
      '.bh-kpi{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:0 0 14px}.bh-kpi.c5{grid-template-columns:repeat(5,minmax(0,1fr));margin:0}' +
      '.bh-kt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-align:center;border:1px solid var(--line);background:var(--surface);border-radius:12px;padding:12px 8px;font:inherit;color:var(--ink)}button.bh-kt{cursor:pointer}button.bh-kt:hover{border-color:var(--pri,#3F6B35)}.bh-kt b{font-size:20px;line-height:1.15;font-variant-numeric:tabular-nums}.bh-kt span{font-size:12px;color:var(--muted)}.bh-kt.ok b{color:var(--pri-ink)}.bh-kt.bad b{color:var(--danger)}.bh-kt.warn b{color:#B45309}' +
      '.bh-ft td,.bh-ft th,.bh-pt td,.bh-pt th,.bh-cmp td,.bh-cmp th,.bh-lt td,.bh-lt th{white-space:nowrap}.bh-ft tr.b td,.bh-pt tr.b td{font-weight:700;background:var(--surface-2)}' +
      '.bh-chg{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.bh-chg>div{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:5px;font-size:13.5px}.bh-chg b.ok{color:var(--pri-ink)}.bh-chg b.bad{color:var(--danger)}.bh-chg b.warn{color:#B45309}' +
      '.bh-out{margin-top:10px;font-size:13.5px}.bh-out summary{cursor:pointer;font-weight:600}.bh-out>div{padding:4px 0 0 14px}' +
      '.bh-up{display:flex;gap:14px;align-items:center;border:2px dashed var(--line);border-radius:14px;padding:18px 20px;background:var(--surface);cursor:pointer;margin:0 0 14px;color:var(--pri-ink)}.bh-up.on,.bh-up:hover{border-color:var(--pri,#3F6B35);background:color-mix(in srgb,var(--pri,#3F6B35) 5%,var(--surface))}.bh-up span{display:flex;flex-direction:column;gap:2px;color:var(--ink)}.bh-up small{color:var(--muted);font-size:12.5px}' +
      '.bh-lt td:first-child{white-space:normal;min-width:220px}.bh-lt tr.on td{background:color-mix(in srgb,var(--pri,#3F6B35) 7%,transparent)}.bh-lt td.down{color:var(--danger);font-weight:600}' +
      '.bh-dh{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin:6px 0 10px}.bh-dh h2{font-size:20px;margin:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.bh-dh p{margin:4px 0 0;font-size:13px}' +
      '.bh-cmp tr.g td{border-top:2px solid var(--line)}.bh-cmp tr.d td{color:var(--muted)}.bh-cmp td.bad{color:var(--danger);font-weight:700;background:color-mix(in srgb,var(--danger) 8%,transparent)}' +
      '.bh-hint{display:flex;flex-direction:column;gap:8px}.bh-hint>div{display:flex;gap:8px;align-items:flex-start;border-radius:10px;padding:9px 12px;font-size:13.5px;line-height:1.5;background:var(--surface-2)}.bh-hint>div svg{flex:none;margin-top:2px}.bh-hint .bad{background:var(--danger-soft);color:var(--ink)}.bh-hint .bad svg{color:var(--danger)}.bh-hint .warn{background:#FFF4E0}.bh-hint .warn svg{color:#B45309}' +
      '.bh-den{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.bh-den span{font-size:12.5px;background:var(--surface-2);border-radius:99px;padding:5px 12px}' +
      '.bh-raw summary{cursor:pointer}.bh-det>.card,.bh-det>.notice{margin-bottom:14px}.bh-rule{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.55}' +
      '@media (max-width:1100px){.bh-kpi{grid-template-columns:repeat(4,minmax(0,1fr))}.bh-kpi.c5{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (max-width:700px){.bh-kpi,.bh-kpi.c5{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    var st = document.createElement('style'); st.id = 'bh-css'; st.textContent = css; document.head.appendChild(st);
  })();
  window.bhParseC12 = bhParseC12; // để kiểm tra bộ đọc C12
