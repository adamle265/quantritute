(function () {
  'use strict';
  var C = HDCore, LOG = new C.Logger(), $ = function (id) { return document.getElementById(id); };
  LOG.phanCach('Mở công cụ'); LOG.ghi('Phiên bản: {{VER}} | ' + navigator.userAgent);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('qtt-tk-' + k); localStorage.setItem('qtt-tk-' + k, v); } catch (e) { return null; } }
  function jget(k) { try { return JSON.parse(store(k) || 'null'); } catch (e) { return null; } }
  var tt; function toast(t) { var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 4500); }
  window.addEventListener('error', function (e) { LOG.loi('Loi trang: ' + e.message + ' @' + e.lineno); });
  var M = C.fmtMoney;
  /* ---- lưu file: trong trang claude.ai dùng quyền "downloads" (trình duyệt chặn tải trực tiếp); chạy thường thì tải như cũ ---- */
  var DLP = (window.claude && window.claude.use) ? window.claude.use('downloads').catch(function () { return null; }) : null;
  async function luu(blob, name) {
    var d = DLP ? await DLP : null;
    if (!d) { C.saveBlob(blob, name); return true; }
    if (/\.xml$/i.test(name)) { var z = new C.ZipWriter(); z.add(name, new Uint8Array(await blob.arrayBuffer())); blob = await z.blob(); name = name.replace(/\.xml$/i, '.zip'); }
    try { await d.save({ filename: name, data: blob }); return true; }
    catch (e) { var c = e && e.code; toast(c === 'declined' ? 'Đã hủy lưu file.' : c === 'rate_limited' ? 'Đang có hộp thoại lưu file mở, anh/chị xử lý xong rồi bấm lại.' : 'Không lưu được file trong trang này (' + (c || 'lỗi') + '). Anh/chị tải bản offline để dùng.'); return false; }
  }

  /* ---- thẻ ---- */
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  function show(id) { tabs.forEach(function (t) { var on = t.id === id; t.setAttribute('aria-selected', on); $(t.getAttribute('aria-controls')).hidden = !on; }); render(); window.scrollTo({ top: 0 }); }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.id); }); });
  $('go2').addEventListener('click', function () { show('t2'); });

  /* ---- trạng thái ---- */
  var S = { files: [], fid: 0, my: '', myUser: false, st: { sua: {}, ok: {}, khongDK: {}, tk: {}, dc: {}, hkd: {} }, tay: [], G: null, R: null, side: 'mua', lim: 200, edit: '', cmp: null, inp: {} };
  function stLoad() { var o = jget('st-' + S.my) || {}; S.st = { sua: o.sua || {}, ok: o.ok || {}, khongDK: o.khongDK || {}, tk: o.tk || {}, dc: o.dc || {}, hkd: o.hkd || {} }; }
  function stSave() { if (S.my) store('st-' + S.my, JSON.stringify(S.st)); }

  /* ---- bước 1: nạp file ---- */
  function readFile(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(new Uint8Array(r.result)); }; r.onerror = function () { no(r.error); }; r.readAsArrayBuffer(f); }); }
  async function addFiles(list) {
    list = [].slice.call(list || []); if (!list.length) return;
    $('busy').hidden = false;
    for (var i = 0; i < list.length; i++) {
      $('busy-t').textContent = 'Đang đọc ' + (i + 1) + '/' + list.length + ': ' + list[i].name;
      var rec = { id: ++S.fid, name: list[i].name, invs: [], chieu: '' };
      try { Object.assign(rec, await TKDS.readList(await readFile(list[i]), list[i].name)); rec.name = list[i].name; }
      catch (e) { rec.err = e.message; LOG.loi('Doc file loi ' + list[i].name, e && e.stack); }
      if (S.files.some(function (f) { return f.name === rec.name && f.invs.length === rec.invs.length && !rec.err; })) { toast('File "' + rec.name + '" đã nạp rồi, bỏ qua.'); continue; }
      S.files.push(rec);
    }
    $('busy').hidden = true;
    LOG.ghi('[FILE] ' + S.files.length + ' file, ' + S.files.reduce(function (a, f) { return a + f.invs.length; }, 0) + ' dong');
    if (!S.myUser) { var g = TKDS.doanMST(S.files.filter(function (f) { return !f.err; })); if (g && g !== S.my) { S.my = g; $('mymst').value = g; stLoad(); S.cmp = null; } }
    recompute(true);
  }
  var drop = $('drop');
  $('fin').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  /* Làm lại từ đầu: xóa dữ liệu làm việc đã lưu của MST đang chọn (dòng nhập tay, ô sửa/tick, số gõ tay, số đối chiếu – mọi kỳ);
     giữ file đã nạp, tên DN, thông tin NNT trên XML, mẫu tờ khai. Hỏi xác nhận bằng khung ngay dưới (không dùng hộp thoại trình duyệt). */
  function khoaCuaMST(m) {
    var re = new RegExp('^qtt-tk-(st-' + m + '$|tay-' + m + '-|in-' + m + '-|cmp-in-' + m + '-)'), out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (re.test(k)) out.push(k); } } catch (e) { }
    return out;
  }
  $('freset').addEventListener('click', function () {
    var m = S.my || 'chung', ks = khoaCuaMST(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), box = $('freset-hoi');
    var nTay = 0; ks.forEach(function (k) { if (/^qtt-tk-tay-/.test(k)) { var a = jget(k.slice(7)); nTay += a ? a.length : 0; } });
    if (!ks.length) { box.hidden = true; toast('MST ' + m + ' chưa có dữ liệu nào được lưu – đang là bản sạch.'); return; }
    box.innerHTML = '<span><b>Làm lại từ đầu cho MST ' + esc(m) + '?</b> Sẽ xóa ' + (nTay ? nTay + ' dòng hóa đơn nhập tay, ' : '') + 'các ô đã sửa / tick (Tính vào TK, Khấu trừ, thuế suất, HĐ hộ KD, lý do điều chỉnh), số gõ tay ở bước 3 và số đối chiếu – <b>của mọi kỳ</b>. Giữ các file đã nạp, tên doanh nghiệp và thông tin cơ quan thuế.</span><span class="rh-nut"><button class="btn sm ghost-b" type="button" id="freset-huy">Thôi</button><button class="btn sm pri" type="button" id="freset-ok">Xóa và làm lại</button></span>';
    box.hidden = false; $('freset-ok').focus();
  });
  $('freset-hoi').addEventListener('click', function (e) {
    var box = $('freset-hoi');
    if (e.target.closest('#freset-huy')) { box.hidden = true; return; }
    if (!e.target.closest('#freset-ok')) return;
    var m = S.my || 'chung', ks = khoaCuaMST(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    ks.forEach(function (k) { try { localStorage.removeItem(k); } catch (er) { } });
    box.hidden = true; stLoad(); S.tay = []; S.inp = {}; S.kk = null; S.cmp = null; S.edit = ''; recompute(true);
    if (LOG && LOG.ghi) LOG.ghi('[LAM LAI] Xoa ' + ks.length + ' muc da luu cua MST ' + m);
    toast('Đã làm lại từ đầu cho MST ' + m + ': xóa ' + ks.length + ' mục đã lưu. Bảng kê đang tính lại từ các file đã nạp.');
  });
  $('fclear').addEventListener('click', function () { S.files = []; S.G = null; S.R = null; S.cmp = null; recompute(); });
  $('mymst').addEventListener('change', function () { var v = $('mymst').value.replace(/\s/g, ''); S.myUser = !!v; S.my = v; stLoad(); S.cmp = null; recompute(true); });
  $('myten').addEventListener('change', function () { if (S.my) store('ten-' + S.my, $('myten').value.trim()); });
  $('ftbl').addEventListener('change', function (e) { var id = e.target.getAttribute('data-ch'); if (!id) return; S.files.forEach(function (f) { if (f.id === +id) f.chieu = e.target.value; }); recompute(); });
  $('ftbl').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; S.files = S.files.filter(function (f) { return f.id !== +b.getAttribute('data-rm'); }); recompute(); });

  function tenDN() {
    var t = S.my ? store('ten-' + S.my) : ''; if (t) return t;
    var L = S.G ? S.G.list : []; for (var i = 0; i < L.length; i++) { if (L[i].banMST === S.my && L[i].banTen) return L[i].banTen; if (L[i].muaMST === S.my && L[i].muaTen) return L[i].muaTen; }
    return '';
  }
  function renderFiles() {
    $('fbox').hidden = !S.files.length; $('go2').disabled = !(S.G && S.G.list.length);
    if (!S.files.length) return;
    if (document.activeElement !== $('myten')) $('myten').value = tenDN();
    $('ftbl').innerHTML = '<thead><tr><th>File</th><th>Danh sách</th><th>Khoảng ngày trong file</th><th class="r">Số HĐ</th><th>Nhận là</th><th></th></tr></thead><tbody>' + S.files.map(function (f) {
      if (f.err) return '<tr><td class="mono">' + esc(f.name) + '</td><td colspan="4"><span class="pill bad">Không đọc được</span> ' + esc(f.err) + '</td><td><button class="fl-x btn sm ghost-b" type="button" data-rm="' + f.id + '" title="Gỡ file">×</button></td></tr>';
      var au = TKDS.chieuFile(f, S.my), lab = { ban: 'Bán ra', mua: 'Mua vào', '': 'Không rõ' };
      return '<tr><td class="mono" style="white-space:normal;word-break:break-all;min-width:180px">' + esc(f.name) + '</td><td>' + (f.mtt ? 'Máy tính tiền' : 'HĐ điện tử') + '</td><td class="mono">' + esc(f.tu ? f.tu + ' – ' + f.den : '–') + '</td><td class="r">' + f.invs.length + '</td>' +
        '<td><select class="in" data-ch="' + f.id + '"><option value=""' + (f.chieu ? '' : ' selected') + '>Tự nhận: ' + lab[au] + '</option><option value="ban"' + (f.chieu === 'ban' ? ' selected' : '') + '>Bán ra</option><option value="mua"' + (f.chieu === 'mua' ? ' selected' : '') + '>Mua vào</option></select></td>' +
        '<td><button class="btn sm ghost-b" type="button" data-rm="' + f.id + '" title="Gỡ file">×</button></td></tr>';
    }).join('') + '</tbody>';
    var W = [], L = S.G ? S.G.list : [];
    if (!S.my) W.push(['bad', 'Chưa xác định được MST doanh nghiệp. Anh/chị nhập MST ở ô trên để công cụ phân biệt bán ra / mua vào.']);
    var khac = L.filter(function (v) { return v.loai === 'Khác'; }).length;
    if (khac) W.push(['bad', khac + ' hóa đơn không có MST ' + S.my + ' ở bên bán hay bên mua – không đưa vào tờ khai. Kiểm tra lại MST hoặc chọn "Nhận là" cho file.']);
    if (S.G && S.G.trung) W.push(['info', S.G.trung + ' dòng trùng giữa các file (cùng MST người bán, mẫu số, ký hiệu, số HĐ) – chỉ tính 1 lần.']);
    var has = {}; L.forEach(function (v) { has[v.loai + '|' + v.loaiHD] = 1; });
    var nhom = [['Bán ra', 'Có mã'], ['Bán ra', 'Máy tính tiền'], ['Mua vào', 'Có mã'], ['Mua vào', 'Không mã'], ['Mua vào', 'Máy tính tiền']];
    var thieu = nhom.filter(function (n) { return !has[n[0] + '|' + n[1]] && !(n[0] === 'Bán ra' && has['Bán ra|Không mã']); }).map(function (n) { return n[0].toLowerCase() + ' ' + (n[1] === 'Có mã' ? 'HĐ điện tử có mã' : n[1] === 'Không mã' ? 'HĐ không mã' : 'HĐ máy tính tiền'); });
    if (L.length && thieu.length) W.push(['warn', 'Chưa thấy: ' + thieu.join(' · ') + '. Nếu kỳ này có phát sinh, tải thêm danh sách đó ở cổng thuế và nạp vào, nếu không tờ khai sẽ thiếu.']);
    $('fwarn').innerHTML = W.map(wHtml).join('');
  }
  function wHtml(w) { return '<div class="warn' + (w[0] === 'bad' ? ' bad' : '') + '"><span class="pill ' + w[0] + '">' + (w[0] === 'bad' ? 'Quan trọng' : w[0] === 'warn' ? 'Kiểm tra' : 'Lưu ý') + '</span><span>' + esc(w[1]) + '</span></div>'; }

  /* ---- tính lại ---- */
  function recompute(guess) {
    var ok = S.files.filter(function (f) { return !f.err; });
    var G = function () { return ok.length ? TKDS.gop(ok.map(function (f) { return { name: f.name, invs: f.invs, chieu: f.chieu }; }), S.my, S.st, S.tay) : null; };
    S.G = G();
    if (S.G && (guess || !$('k-nam').value)) kGuess();
    if (kLoadInp()) S.G = G();
    S.R = S.G ? TKDS.compute(S.G.list, kInp()) : null;
    render();
  }
  function render() {
    renderFiles();
    if (!$('p2').hidden) renderBK();
    if (!$('p3').hidden) renderTK();
  }

  /* ---- bước 2: bảng kê ---- */
  [].forEach.call(document.querySelectorAll('#b-side button'), function (b) { b.addEventListener('click', function () { S.side = b.getAttribute('data-s'); S.lim = 200; S.edit = ''; [].forEach.call(document.querySelectorAll('#b-side button'), function (x) { x.setAttribute('aria-pressed', x === b); }); renderBK(); }); });
  ['b-q', 'b-f', 'b-loai'].forEach(function (id) { $(id).addEventListener(id === 'b-q' ? 'input' : 'change', function () { S.lim = 200; renderBK(); }); });
  $('b-more').querySelector('button').addEventListener('click', function () { S.lim += 300; renderBK(); });
  function tsText(v) { return v.parts.map(function (x) { return x.ts; }).join(' + '); }
  function tinhTK(v) { return v.tinh ? 'Có' : 'Không – ' + (v.lyDo || 'không tính'); }
  function autoTK(v) { return !!(v.trongKy && !v.loaiTru); }
  function locBK() {
    var q = C.boDau($('b-q').value).toLowerCase().trim(), f = $('b-f').value, lo = $('b-loai').value, dc = /^dc/.test(S.side), want = S.side === 'ban' || S.side === 'dcb' ? 'Bán ra' : 'Mua vào';
    return S.G.list.filter(function (v) {
      if (v.loai !== want || (dc && TKDS.nhomDC(v) < 0)) return false;
      if (lo && v.loaiHD !== lo) return false;
      if (f === 'xn' && !v.canXacNhan) return false; if (f === 'ut' && !v.uocTinh) return false;
      if (f === 'off' && v.tinh) return false; if (f === 'dc' && TKDS.nhomDC(v) < 0) return false; if (f === 'tay' && !v.manual) return false; if (f === 'dcx' && !v.dcCan) return false; if (f === 'ksb' && !v.ksb) return false;
      if (f === '5tr' && !v.tu5tr) return false; if (f === 'kdk' && !v.khongDK) return false; if (f === 'hkd' && !v.hoKD) return false;
      if (q) { var h = C.boDau([v.kyHieu, v.so, v.kyHieu + '-' + v.so, v.banTen, v.banMST, v.muaTen, v.muaMST].join(' ')).toLowerCase(); if (h.indexOf(q) < 0) return false; }
      return true;
    }).sort(dc ? function (a, b) { return TKDS.nhomDC(a) - TKDS.nhomDC(b) || a.loai.localeCompare(b.loai) || C.ymdCompact(a.ngay).localeCompare(C.ymdCompact(b.ngay)); } : undefined);
  }
  function dcSel(v) {
    var cur = v.dcLyDo || v.dcGoiY, o = [['', '— Chọn lý do —']].concat(v.dcNhom === 3 ? [['tm', 'Điều chỉnh thương mại (CKTM, trả hàng…)']] : []).concat([['ss-cung', 'Sửa sai – HĐ gốc cùng kỳ'], ['ss-truoc', 'Sửa sai – HĐ gốc kỳ trước']]);
    return '<select class="in dcsel' + (v.dcCan ? ' est' : '') + '" data-dc="' + esc(v.key) + '" title="Lý do lập hóa đơn ' + (v.dcNhom === 3 ? 'điều chỉnh' : 'thay thế') + ' – quyết định kỳ kê khai (TT 91/2026 Điều 10)">' + o.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === cur ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      (v.dcGoiY && !v.dcLyDo ? '<span class="fn">gợi ý: có HĐ đã bị thay thế của cùng đối tác trong kỳ</span>' : v.dcCan ? '<span class="fn" style="color:var(--amb)">cần chọn lý do</span>' : v.ksb ? '<span class="fn">→ khai bổ sung kỳ của HĐ gốc</span>' : v.kyPhatHien ? '<span class="fn">→ tăng thuế đầu vào: kê kỳ phát hiện (kỳ này)</span>' : '');
  }
  /* Góp ý chị Mai Ngọc Hằng 29/10: "Tick toàn bộ" cột Tính vào TK cho các HĐ đang lọc (cả HĐ chưa hiện do giới hạn số dòng) */
  function tkAllHtml(L) {
    var X = L.filter(function (v) { return v.loai !== 'Khác'; }); if (!X.length) return '';
    var n = X.filter(function (v) { return v.tinh; }).length, sua = X.filter(function (v) { return S.st.tk[v.key]; }).length;
    return '<span class="tkall"><label title="Tick / bỏ tick Tính vào TK cho tất cả ' + X.length + ' HĐ đang lọc"><input type="checkbox" id="b-tkall"' + (n === X.length ? ' checked' : '') + (n && n < X.length ? ' data-mix="1"' : '') + '> Tất cả (' + X.length + ')</label>' +
      (sua ? '<button type="button" class="lnk" id="b-tkmd" title="Bỏ các lựa chọn tay, quay về mặc định theo trạng thái HĐ (cho HĐ đang lọc)">↺ mặc định</button>' : '') + '</span>';
  }
  function tkAll(val) {
    var X = locBK().filter(function (v) { return v.loai !== 'Khác'; }), n = 0, rui = 0;
    X.forEach(function (v) {
      if (val === null) { if (S.st.tk[v.key]) { delete S.st.tk[v.key]; n++; } return; }
      if (!!v.tinh === val) return; // đã đúng như muốn – giữ nguyên (kể cả mặc định)
      n++; if (val && !v.manual && (v.loaiTru || !v.trongKy || v.ksb || v.biThayTay)) rui++;
      S.st.tk[v.key] = val ? 'co' : 'khong';
    });
    stSave(); recompute();
    toast(val === null ? 'Đã đưa ' + n + ' HĐ đang lọc về mặc định theo trạng thái hóa đơn.' : (val ? 'Đã tính vào tờ khai ' : 'Đã bỏ khỏi tờ khai ') + n + ' HĐ đang lọc.' + (rui ? ' Lưu ý: ' + rui + ' HĐ đã bị thay thế / bị hủy / ngoài kỳ / thuộc khai bổ sung cũng đang được tính – kiểm tra lại, hoặc bấm "↺ mặc định" ở cột Tính vào TK' + (locBK().length ? '' : ' (chọn bộ lọc "Tất cả hóa đơn")') + ' để hoàn tác.' : ''));
  }
  function renderBK() {
    if (!S.G || !S.G.list.length) { $('b-main').hidden = true; $('b-empty').hidden = false; return; }
    $('b-empty').hidden = true; $('b-main').hidden = false;
    var R = S.R, all = S.G.list, isBan = S.side === 'ban' || S.side === 'dcb', dc = /^dc/.test(S.side), khauTru = !isBan;
    var cnt = function (lo) { return all.filter(function (v) { return v.loai === lo; }).length; };
    var xn = all.filter(function (v) { return v.canXacNhan && v.tinh; }).length, nDC = all.filter(function (v) { return TKDS.nhomDC(v) >= 0; }).length;
    var nDCm = all.filter(function (v) { return v.loai === 'Mua vào' && TKDS.nhomDC(v) >= 0; }).length, nDCb = all.filter(function (v) { return v.loai === 'Bán ra' && TKDS.nhomDC(v) >= 0; }).length;
    $('b-side').querySelector('[data-s=dcm]').textContent = 'Mua vào điều chỉnh / thay thế (' + nDCm + ')'; $('b-side').querySelector('[data-s=dcb]').textContent = 'Bán ra điều chỉnh / thay thế (' + nDCb + ')';
    $('b-kpis').innerHTML = [['HĐ mua vào (đã bỏ trùng)', cnt('Mua vào')], ['HĐ bán ra (đã bỏ trùng)', cnt('Bán ra')], ['Kỳ đang lập', R ? R.ky.nhan : '–'], ['Thuế suất cần xác nhận', xn]].map(function (k, i) { return '<div class="kpi"' + (i === 3 && xn ? ' style="border-color:var(--amb)"' : '') + '><small>' + k[0] + '</small><b>' + k[1] + '</b></div>'; }).join('');
    var L = locBK(), mix810 = all.filter(function (v) { return v.canXacNhan && v.goiY.kind === 'mix' && tsText(v) === '8% + 10%'; }).length;
    $('b-okall').hidden = !mix810; $('b-okall').textContent = '✓ Xác nhận ' + mix810 + ' HĐ tách ước tính 8% + 10%';
    $('b-hint').innerHTML = dc ? 'Theo dõi HĐ <b>đã bị điều chỉnh, đã bị thay thế, đã bị hủy</b> và HĐ <b>điều chỉnh, thay thế</b> ' + (isBan ? 'bán ra' : 'mua vào') + ' (kể cả HĐ nhập tay) để đối chiếu cặp HĐ gốc – HĐ mới. Chọn <b>Lý do</b> cho HĐ điều chỉnh / thay thế để công cụ xác định kỳ kê khai. Bỏ / tick ô <b>Tính vào TK</b> nếu cần kê khác mặc định.'
      : 'Bấm ô <b>Thuế suất</b> để sửa / tách theo từng mức thuế. Ô viền cam = <b>ước tính</b>: bấm ✓ nếu đồng ý, hoặc sửa theo hóa đơn gốc. Ô <b>Tính vào TK</b> mặc định theo trạng thái HĐ, bỏ tick để không kê (tick lại HĐ đang "Không" để kê vào kỳ này); ô <b>Tất cả</b> ở đầu cột tick / bỏ tick cùng lúc mọi HĐ đang lọc.' + (isBan ? '' : ' Bỏ tick <b>Khấu trừ</b> với HĐ không đủ điều kiện (vẫn vào [23]/[24], không vào [25]). Giá trị [23] tính như MISA: tổng tiền chưa thuế + tổng tiền phí; HĐ <b>hộ kinh doanh</b> (tick cột HĐ hộ KD, mẫu số 2 tự nhận) lấy ở tổng tiền thanh toán.');
    var tot = { ct: 0, th: 0, tong: 0, n: 0 };
    L.forEach(function (v) { if (v.tinh) { tot.gt = (tot.gt || 0) + (v.gtMua || 0); tot.ct += v.ctVND; tot.th += v.thVND; tot.tong += v.tong * (v.tienTe !== 'VND' ? v.tyGia : 1); tot.n++; } });
    var cols = 9 + (khauTru ? 2 : 0);
    var body = L.slice(0, S.lim).map(function (v, i) {
      var on = !!v.tinh, vb = v.loai === 'Bán ra', dt = vb ? (v.muaTen || '(Người mua không lấy HĐ)') : v.banTen, ms = vb ? v.muaMST : v.banMST;
      var tsb = v.manual ? '<span class="tsv">' + esc(tsText(v)) + '</span>' : '<button type="button" class="tsv' + (v.canXacNhan ? ' est' : '') + '" data-ed="' + esc(v.key) + '" title="Bấm để sửa / tách thuế suất">' + esc(tsText(v)) + (v.sua ? ' <span class="hint">(đã sửa)</span>' : v.uocTinh ? ' <span class="hint">' + (v.canXacNhan ? 'ước tính' : 'đã xác nhận') + '</span>' : '') + ' ✎</button>' + (v.canXacNhan && on ? ' <button type="button" class="okbtn" data-ok="' + esc(v.key) + '" title="Đồng ý thuế suất ước tính">✓</button>' : '');
      var notes = v.notes.slice(); if (v.tu5tr && on) notes.push('≥ 5 triệu: cần chứng từ TT không dùng tiền mặt'); if (v.files.length > 1) notes.push('trùng ' + v.files.length + ' file');
      var nh = TKDS.nhomDC(v);
      var tk = v.loai === 'Khác' ? '<span class="pill">Không rõ bán/mua</span>' : '<label class="tkc"><input type="checkbox" data-tk="' + esc(v.key) + '"' + (on ? ' checked' : '') + '> ' + (on ? '<span class="pill ok">Có</span>' : '<span class="pill">Không</span>') + '</label>' + (on && v.tkSet === 'co' ? '<span class="fn">đã chọn kê</span>' : !on && v.lyDo ? '<span class="fn">' + esc(v.lyDo) + '</span>' : '');
      var tr = '<tr class="' + (on ? '' : 'off') + (S.edit === v.key ? ' ed' : '') + '"><td class="mono">' + (i + 1) + '</td><td class="mono">' + esc(v.kyHieu + '-' + v.so) + '<span class="fn">' + esc(v.ngay) + ' · ' + esc(v.loaiHD) + (v.manual ? ' · thêm lúc ' + tgThem(v.mid) : '') + '</span>' + (v.manual ? '<button type="button" class="btn sm ghost-b" data-del="' + esc(v.mid) + '" title="Xóa dòng nhập tay">× Xóa</button>' : '') + '</td>' +
        '<td style="white-space:normal;min-width:180px">' + esc(dt) + '<span class="fn">' + esc(ms || '') + (notes.length ? ' · ' + esc(notes.join(' · ')) : '') + '</span></td>' +
        '<td class="r">' + M(v.ctVND) + (khauTru && v.tinh && v.gtMua !== v.ctVND ? '<span class="fn" title="Giá trị mua chưa VAT tính vào [23] (cách MISA)">[23]: ' + M(v.gtMua) + (v.hoKD ? ' · HĐ hộ KD' : ' · gồm phí') + '</span>' : '') + '</td><td class="r">' + M(v.thVND) + '</td><td class="keep">' + tsb + '</td><td class="r">' + M(v.tong) + '</td>' +
        '<td style="white-space:normal;min-width:' + (nh >= 3 && !v.manual ? 230 : 120) + 'px">' + (nh >= 0 ? '<span class="pill ' + (nh < 3 ? 'amb' : 'info') + '">' + esc(TKDS.NH[nh][1]) + '</span>' + (v.manual ? '<span class="fn">' + esc(v.tthaiTen) + '</span>' : '') + (nh >= 3 && !v.manual ? dcSel(v) : '') : esc(v.tthaiTen)) + '</td><td class="keep">' + tk + '</td>' +
        (khauTru ? '<td class="keep" style="text-align:center">' + (!on ? '' : '<input type="checkbox" data-kt="' + esc(v.key) + '"' + (v.khongDK ? '' : ' checked') + ' title="Được khấu trừ thuế đầu vào">') + '</td><td class="keep" style="text-align:center"><input type="checkbox" data-hkd="' + esc(v.key) + '"' + (v.hoKD ? ' checked' : '') + (v.manual ? ' disabled' : '') + ' title="Hóa đơn của hộ kinh doanh: giá trị mua chưa VAT lấy ở Tổng tiền thanh toán">' + (v.hoKDTu && !v.manual ? '<span class="fn">tự nhận</span>' : '') + '</td>' : '') + '</tr>';
      if (S.edit === v.key) tr += '<tr class="ed"><td></td><td colspan="' + (cols - 1) + '">' + editor(v) + '</td></tr>';
      return tr;
    }).join('');
    $('b-tbl').innerHTML = '<thead><tr><th>#</th><th>Hóa đơn</th><th>' + (isBan ? 'Người mua' : 'Người bán') + '</th><th class="r">Tổng chưa thuế</th><th class="r">Tiền thuế</th><th>Thuế suất</th><th class="r">Tổng thanh toán</th><th>Trạng thái</th><th class="tkth">Tính vào TK' + tkAllHtml(L) + '</th>' + (khauTru ? '<th>Khấu trừ</th><th title="Hóa đơn hộ kinh doanh – giá trị lấy ở Tổng tiền thanh toán">HĐ hộ KD</th>' : '') + '</tr></thead><tbody>' + (body || '<tr><td colspan="' + cols + '" class="hint">Không có hóa đơn khớp bộ lọc.</td></tr>') + '</tbody>' +
      '<tfoot><tr><td></td><td colspan="2">Tổng ' + tot.n + ' HĐ tính vào tờ khai (theo bộ lọc)' + '' + '</td><td class="r">' + M(tot.ct) + '</td><td class="r">' + M(tot.th) + '</td><td></td><td class="r">' + M(tot.tong) + '</td><td colspan="' + (cols - 7) + '"></td></tr>' + (khauTru ? '<tr><td></td><td colspan="' + (cols - 1) + '" style="font-weight:600">Giá trị mua chưa VAT tính vào [23]: ' + M(tot.gt || 0) + ' <span class="hint" style="font-weight:400">– cách MISA: HĐ công ty lấy tổng tiền chưa thuế + tổng tiền phí; HĐ hộ kinh doanh lấy tổng tiền thanh toán</span></td></tr>' : '') + '</tfoot>';
    var tkca = $('b-tkall'); if (tkca && tkca.getAttribute('data-mix')) tkca.indeterminate = true;
    $('b-more').hidden = L.length <= S.lim; $('b-more').querySelector('button').textContent = 'Hiện thêm (còn ' + (L.length - S.lim) + ' HĐ)';
    renderTay();
  }
  var ED_TS = ['10%', '8%', '5%', '0%', 'KCT', 'KKKNT'];
  function editor(v) {
    var cur = {}; v.parts.forEach(function (x) { var k = x.ts === '0%/KCT' ? 'KCT' : x.ts; cur[k] = cur[k] || { ct: 0, th: 0 }; cur[k].ct += x.ct; cur[k].th += x.th; });
    return '<div class="edbox" data-edk="' + esc(v.key) + '"><div><b>Tách thuế suất HĐ ' + esc(v.kyHieu + '-' + v.so) + '</b> <span class="hint">· tổng chưa thuế ' + M(v.ctVND) + ' · tiền thuế ' + M(v.thVND) + ' · gợi ý: ' + esc(v.goiY.parts.map(function (x) { return x.ts + ' ' + M(x.ct); }).join(' + ')) + '</span></div>' +
      '<div class="edgrid">' + ED_TS.map(function (t) { var c = cur[t] || {}, noTax = t === '0%' || t === 'KCT' || t === 'KKKNT'; return '<div class="f"><label>Giá trị ' + t + '</label><input class="in mono" data-money data-et="' + t + '" data-ef="ct" value="' + (c.ct ? M(c.ct) : '') + '" inputmode="numeric"></div>' + (noTax ? '' : '<div class="f"><label>Thuế ' + t + '</label><input class="in mono" data-money data-et="' + t + '" data-ef="th" value="' + (c.th ? M(c.th) : '') + '" inputmode="numeric"></div>'); }).join('') + '</div>' +
      '<div class="edsum" data-esum></div><div class="actions"><button class="btn sm pri" type="button" data-esave>Lưu thuế suất</button><button class="btn sm" type="button" data-ereset>Dùng lại gợi ý</button><button class="btn sm ghost-b" type="button" data-eclose>Đóng</button></div>' +
      '<p class="hint">Gõ số âm thêm dấu "-" phía trước (HĐ điều chỉnh giảm). Tổng các ô phải bằng đúng tổng chưa thuế và tiền thuế của hóa đơn.</p></div>';
  }
  function edRead(box) {
    var parts = [], sct = 0, sth = 0;
    ED_TS.forEach(function (t) {
      var g = function (f) { var el = box.querySelector('[data-et="' + t + '"][data-ef="' + f + '"]'); if (!el) return 0; var s = el.value.trim(), neg = /^-/.test(s); var n = +(s.replace(/\D/g, '')) || 0; return neg ? -n : n; };
      var ct = g('ct'), th = g('th'); if (ct || th) { parts.push({ ts: t, ct: ct, th: th }); sct += ct; sth += th; }
    });
    return { parts: parts, sct: sct, sth: sth };
  }
  function edSum(box) {
    var v = byKey(box.getAttribute('data-edk')), r = edRead(box), el = box.querySelector('[data-esum]');
    var ok = r.sct === v.ctVND && r.sth === v.thVND;
    el.className = 'edsum' + (ok ? '' : ' bad'); el.textContent = 'Đang nhập: giá trị ' + M(r.sct) + ' / ' + M(v.ctVND) + ' · thuế ' + M(r.sth) + ' / ' + M(v.thVND) + (ok ? ' – khớp.' : ' – chưa khớp (lệch giá trị ' + M(r.sct - v.ctVND) + ', thuế ' + M(r.sth - v.thVND) + ').');
    return ok ? r : null;
  }
  function byKey(k) { var L = S.G.list; for (var i = 0; i < L.length; i++) if (L[i].key === k) return L[i]; return null; }
  $('b-tbl').addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-ed]'))) { var k = b.getAttribute('data-ed'); S.edit = S.edit === k ? '' : k; renderBK(); var bx = $('b-tbl').querySelector('.edbox'); if (bx) { edSum(bx); var i0 = bx.querySelector('input'); if (i0) i0.focus(); } return; }
    if ((b = t.closest('[data-ok]'))) { S.st.ok[b.getAttribute('data-ok')] = 1; stSave(); recompute(); return; }
    var box = t.closest('.edbox'); if (!box) return; var key = box.getAttribute('data-edk');
    if (t.closest('[data-eclose]')) { S.edit = ''; renderBK(); return; }
    if (t.closest('[data-ereset]')) { delete S.st.sua[key]; delete S.st.ok[key]; stSave(); S.edit = ''; recompute(); toast('Đã quay lại thuế suất gợi ý.'); return; }
    if (t.closest('[data-esave]')) { var r = edSum(box); if (!r) { toast('Tổng các ô chưa khớp với hóa đơn – kiểm tra lại.'); return; } if (!r.parts.length) r.parts = [{ ts: '0%', ct: 0, th: 0 }]; S.st.sua[key] = r.parts; stSave(); S.edit = ''; recompute(); toast('Đã lưu thuế suất cho HĐ này (nhớ theo MST doanh nghiệp).'); }
  });
  $('b-tbl').addEventListener('input', function (e) { var box = e.target.closest('.edbox'); if (box) edSum(box); });
  $('b-tbl').addEventListener('keydown', function (e) { var box = e.target.closest && e.target.closest('.edbox'); if (!box) return; if (e.key === 'Enter') { e.preventDefault(); box.querySelector('[data-esave]').click(); } if (e.key === 'Escape') { S.edit = ''; renderBK(); } });
  $('b-tbl').addEventListener('change', function (e) {
    var hk = e.target.getAttribute('data-hkd'); if (hk) { var vv = byKey(hk); if (e.target.checked === !!(vv && vv.hoKDTu)) delete S.st.hkd[hk]; else S.st.hkd[hk] = e.target.checked ? 1 : 0; stSave(); recompute(); toast(e.target.checked ? 'Đã đánh dấu HĐ hộ kinh doanh: giá trị [23] lấy ở Tổng tiền thanh toán.' : 'Đã bỏ đánh dấu HĐ hộ kinh doanh.'); return; }
    var d = e.target.getAttribute('data-dc'); if (d) { if (e.target.value) S.st.dc[d] = e.target.value; else delete S.st.dc[d]; stSave(); recompute(); return; }
    if (e.target.id === 'b-tkall') { tkAll(e.target.checked); return; }
    var k = e.target.getAttribute('data-tk'); if (!k) return; var v = byKey(k); if (!v) return;
    if (e.target.checked === autoTK(v)) delete S.st.tk[k]; else S.st.tk[k] = e.target.checked ? 'co' : 'khong';
    stSave(); recompute(); toast(e.target.checked ? 'HĐ ' + v.kyHieu + '-' + v.so + ' được tính vào tờ khai.' : 'HĐ ' + v.kyHieu + '-' + v.so + ' không tính vào tờ khai.');
  });
  $('b-tbl').addEventListener('click', function (e) {
    if (e.target.closest('#b-tkmd')) { tkAll(null); return; }
    var b = e.target.closest('[data-del]'); if (!b) return; var id = b.getAttribute('data-del');
    S.tay = S.tay.filter(function (o) { return String(o.id) !== id; }); tSave(); recompute(); toast('Đã xóa dòng nhập tay.');
  });
  /* ---- thêm dòng nhập tay: HĐ điều chỉnh / thay thế kỳ sau (góp ý anh Phương 28/10) ---- */
  $('tay-n').addEventListener('click', function (e) {
    if (!e.target.closest('#tay-xoahet')) return;
    var want = S.side === 'ban' ? 'Bán ra' : 'Mua vào', n0 = S.tay.length;
    S.tay = S.tay.filter(function (o) { return o.loai !== want; }); tSave(); recompute(); toast('Đã xóa ' + (n0 - S.tay.length) + ' dòng nhập tay ' + want.toLowerCase() + ' của kỳ này.');
  });
  function tSave() { store('tay-' + kKey().slice(3), JSON.stringify(S.tay)); }
  var TS_TY = { '10%': 0.1, '8%': 0.08, '5%': 0.05 };
  function tgThem(id) { var d = new Date(+id); return isNaN(d) ? '' : C.pad(d.getHours()) + ':' + C.pad(d.getMinutes()) + ' ' + C.pad(d.getDate()) + '/' + C.pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function soAm(el) { var s = el.value.trim(), n = +(s.replace(/\D/g, '')) || 0; return /^-/.test(s) ? -n : n; }
  function renderTay() {
    var box = $('tay-box'); box.hidden = /^dc/.test(S.side) || !S.R;
    if (box.hidden) return;
    var ban = S.side === 'ban', n = S.tay.filter(function (o) { return o.loai === (ban ? 'Bán ra' : 'Mua vào'); }).length;
    $('tay-h').textContent = 'Thêm hóa đơn sửa sai lập kỳ sau · ' + (ban ? 'bán ra' : 'mua vào') + ' · ' + S.R.ky.nhan;
    var seen = {}, nTrung = 0; S.tay.forEach(function (o) { if (o.loai !== (ban ? 'Bán ra' : 'Mua vào')) return; var k = String(o.kh || '').toUpperCase() + '|' + parseInt(String(o.so).replace(/\D/g, ''), 10) + '|' + (o.mst || ''); if (seen[k]) nTrung++; seen[k] = 1; });
    $('tay-n').innerHTML = n ? '<span class="tay-luu"><b>Đang có ' + n + ' dòng nhập tay</b> (' + (ban ? 'bán ra' : 'mua vào') + ', ' + esc(S.R.ky.nhan.toLowerCase()) + ', MST ' + esc(S.my || 'chưa rõ') + ') – được lưu trên trình duyệt này, <b>kể cả dòng thêm từ lần mở trước</b>; hiện trong bảng phía trên, nhãn "Nhập tay". <button type="button" class="btn sm ghost-b" id="tay-xoahet">Xóa tất cả ' + n + ' dòng nhập tay ' + (ban ? 'bán ra' : 'mua vào') + ' kỳ này</button>' + (nTrung ? '<br><b style="color:var(--bad,#b42318)">Có ' + nTrung + ' dòng trùng ký hiệu + số hóa đơn với dòng khác – xóa bớt để không kê trùng.</b>' : '') + '</span>' : '';
    $('ty-mst-l').textContent = ban ? 'MST người mua' : 'MST người bán'; $('ty-ten-l').textContent = ban ? 'Tên người mua' : 'Tên người bán';
    $('ty-ct-l').textContent = $('ty-nhom').value === 'Thay thế do sai sót' ? 'Tổng tiền chưa thuế (HĐ thay thế)' : 'Số điều chỉnh chưa thuế (giảm ghi -)';
  }
  /* tìm hóa đơn gốc trong danh sách đã nạp theo ký hiệu + số (cùng chiều bán / mua) */
  function timGoc() {
    var kh = $('ty-gkh').value.trim().toUpperCase(), so = parseInt($('ty-gso').value.replace(/\D/g, ''), 10), want = S.side === 'ban' ? 'Bán ra' : 'Mua vào', mst = $('ty-mst').value.replace(/\s/g, '');
    if (!kh || !so || !S.G) return null;
    var L = S.G.list.filter(function (v) { return !v.manual && v.loai === want && v.kyHieu === kh && parseInt(v.so, 10) === so; });
    if (mst && L.length > 1) L = L.filter(function (v) { return (want === 'Bán ra' ? v.muaMST : v.banMST) === mst; }).concat(L).slice(0, 1);
    return L[0] || null;
  }
  function gocInfo() {
    var g = timGoc(), el = $('ty-ginfo'); renderTay();
    if (!$('ty-gkh').value.trim() || !$('ty-gso').value.trim()) { el.innerHTML = ''; return; }
    if (!g) { el.innerHTML = '<span class="pill">Không thấy trong danh sách đã nạp</span> Nhập ngày hóa đơn gốc để kiểm tra kỳ.'; return; }
    var ban = g.loai === 'Bán ra'; tyGNgay.set(g.ngay);
    /* 1.0.4 (góp ý 30/10): thuế suất lấy theo HĐ gốc thay vì mặc định 10%; HĐ gốc nhiều mức thì lấy mức có tiền chưa thuế lớn nhất */
    var P = (g.parts || []).slice().sort(function (x, y) { return Math.abs(y.ct) - Math.abs(x.ct); }), ts0 = P[0] ? P[0].ts : '';
    if (ts0 === '0%/KCT') ts0 = 'KCT';
    var tsSel = $('ty-ts'), tsOk = [].some.call(tsSel.options, function (o) { return o.value === ts0; });
    if (tsOk) { tsSel.value = ts0; tyThue(); }
    var tsNote = tsOk ? ' · thuế suất HĐ gốc: <b>' + esc(tsText(g)) + '</b>' + (P.length > 1 ? ' (nhiều mức – đã chọn ' + esc(ts0) + ', kiểm tra lại)' : '') + (g.canXacNhan ? ' (đang là ước tính – kiểm tra lại)' : '') : '';
    if (!$('ty-mst').value) $('ty-mst').value = ban ? g.muaMST : g.banMST; if (!$('ty-ten').value) $('ty-ten').value = ban ? (g.muaTen || '') : g.banTen; $('ty-mau').value = g.mauSo || '1';
    el.innerHTML = (g.trongKy ? '<span class="pill ok">Tìm thấy – thuộc ' + esc(S.R.ky.nhan.toLowerCase()) + '</span> ' : '<span class="pill bad">Tìm thấy – KHÔNG thuộc kỳ đang lập</span> ') + esc(g.kyHieu + '-' + g.so + ' ngày ' + g.ngay + ' · ' + (ban ? g.muaTen || 'người mua không lấy HĐ' : g.banTen) + ' · chưa thuế ' + M(g.ctVND) + ', thuế ' + M(g.thVND) + ' · ' + g.tthaiTen) + tsNote;
  }
  ['ty-gkh', 'ty-gso'].forEach(function (id) { $(id).addEventListener('change', gocInfo); });
  $('ty-nhom').addEventListener('change', renderTay);
  $('ty-ct').addEventListener('input', tyThue); $('ty-ts').addEventListener('change', tyThue);
  $('ty-th').addEventListener('input', function () { $('ty-th').dataset.tay = '1'; });
  function tyThue() { if ($('ty-th').dataset.tay) return; var r = TS_TY[$('ty-ts').value] || 0, v = Math.round(soAm($('ty-ct')) * r); $('ty-th').value = v ? (v < 0 ? '-' : '') + M(Math.abs(v)) : ''; }
  /* ô ngày dd / mm / yyyy (nguyên tắc anh chốt): dấu / có sẵn; đủ 2 số ngày tự nhảy sang tháng, đủ tháng tự nhảy sang năm;
     gõ 4–9 ở ngày hoặc 2–9 ở tháng tự thêm số 0; bấm / nháy đúp vào phần nào thì chọn cả phần đó để gõ đè;
     Backspace ở ô trống lùi về ô trước; gõ / . - để sang ô sau; dán "01/07/2026" hoặc "01072026" tự tách */
  function dateBox(box) {
    var P = [].slice.call(box.querySelectorAll('input'));
    // chỉ đặt vùng chọn, không gọi select() trễ (select() kéo con trỏ quay lại ô cũ khi gõ nhanh)
    function selAll(el) { try { el.setSelectionRange(0, el.value.length); } catch (e) { } }
    function go(i) { if (P[i]) { P[i].focus(); selAll(P[i]); } }
    P.forEach(function (el, i) {
      var len = i === 2 ? 4 : 2;
      el.addEventListener('focus', function () { selAll(el); });
      el.addEventListener('mouseup', function (e) { e.preventDefault(); selAll(el); });
      el.addEventListener('dblclick', function () { selAll(el); });
      el.addEventListener('input', function () {
        var v = el.value.replace(/\D/g, '').slice(0, len); el.value = v;
        if (i === 0 && v.length === 1 && +v > 3) { el.value = '0' + v; go(1); return; }
        if (i === 1 && v.length === 1 && +v > 1) { el.value = '0' + v; go(2); return; }
        if (v.length === len && i < 2) go(i + 1);
      });
      el.addEventListener('keydown', function (e) {
        if (/^[\/.\-]$/.test(e.key)) { e.preventDefault(); if (!el.value) return; if (el.value.length === 1 && i < 2) el.value = '0' + el.value; go(i + 1); return; } // ô vừa nhảy sang còn trống: bỏ qua dấu / gõ theo thói quen
        if (e.key === 'Backspace' && !el.value && i > 0) { e.preventDefault(); var t = P[i - 1]; t.value = t.value.slice(0, -1); t.focus(); try { t.setSelectionRange(t.value.length, t.value.length); } catch (er) { } return; }
        if (e.key === 'ArrowLeft' && el.selectionStart === 0 && i > 0) { e.preventDefault(); go(i - 1); }
        if (e.key === 'ArrowRight' && el.selectionEnd === el.value.length && i < 2) { e.preventDefault(); go(i + 1); }
      });
      el.addEventListener('blur', function () { if (el.value.length === 1 && i < 2) el.value = '0' + el.value; if (i === 2 && el.value.length === 2) el.value = '20' + el.value; });
      el.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text').trim(), m = t.match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})$/) || t.match(/^(\d{2})(\d{2})(\d{4})$/);
        if (m) { e.preventDefault(); P[0].value = C.pad(m[1]); P[1].value = C.pad(m[2]); P[2].value = m[3]; go(2); }
      });
    });
    return { set: function (d) { var m = String(d || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (m) { P[0].value = m[1]; P[1].value = m[2]; P[2].value = m[3]; } }, get: function () { return P[0].value && P[1].value && P[2].value ? C.pad(P[0].value) + '/' + C.pad(P[1].value) + '/' + P[2].value : ''; }, clear: function () { P.forEach(function (x) { x.value = ''; }); }, focus: function () { go(0); } };
  }
  var tyNgay = dateBox($('ty-ngay')), tyGNgay = dateBox($('ty-gngay'));
  $('ty-add').addEventListener('click', function () {
    var ngay = tyNgay.get(), so = $('ty-so').value.trim(), ct = soAm($('ty-ct')), th = soAm($('ty-th'));
    var gkh = $('ty-gkh').value.trim().toUpperCase(), gso = $('ty-gso').value.trim(), gngay = tyGNgay.get(), g = timGoc(), thayThe = $('ty-nhom').value === 'Thay thế do sai sót';
    if (!gkh || !gso) { toast('Nhập ký hiệu và số của hóa đơn gốc bị sai.'); $(gkh ? 'ty-gso' : 'ty-gkh').focus(); return; }
    if (g) gngay = g.ngay;
    if (!C.validDMY(gngay)) { toast('Nhập ngày hóa đơn gốc (dd/mm/yyyy).'); tyGNgay.focus(); return; }
    var gd = C.dmyToDate(gngay); if (!(gd >= S.R.ky.from && gd <= S.R.ky.to)) { toast('Hóa đơn gốc ngày ' + gngay + ' không thuộc ' + S.R.ky.nhan.toLowerCase() + '. Hóa đơn sửa sai được kê vào kỳ của hóa đơn gốc: lập (hoặc khai bổ sung) tờ khai kỳ đó.'); return; }
    if (g && g.loaiTru) { toast('Hóa đơn gốc ' + gkh + '-' + gso + ' đang ở trạng thái "' + g.tthaiTen + '" – kiểm tra lại, có thể hóa đơn thay thế đã có trong danh sách.'); return; }
    if (!so) { toast('Nhập số hóa đơn.'); $('ty-so').focus(); return; }
    if (!C.validDMY(ngay)) { toast('Ngày lập chưa đúng (dd/mm/yyyy).'); tyNgay.focus(); return; }
    if (!ct && !th) { toast('Nhập tổng tiền chưa thuế hoặc tiền thuế (số âm nếu điều chỉnh giảm).'); $('ty-ct').focus(); return; }
    var loaiTy = S.side === 'ban' ? 'Bán ra' : 'Mua vào', khTy = $('ty-kh').value.trim().toUpperCase(), mstTy = $('ty-mst').value.replace(/\s/g, ''), soN = parseInt(so.replace(/\D/g, ''), 10);
    var cungSo = function (kh, s2, mst2) { return String(kh || '').toUpperCase() === khTy && parseInt(String(s2).replace(/\D/g, ''), 10) === soN && (!mstTy || !mst2 || mst2 === mstTy); };
    var trung = S.tay.filter(function (x) { return x.loai === loaiTy && cungSo(x.kh, x.so, x.mst); })[0];
    if (trung) { toast('HĐ ' + (khTy ? khTy + '-' : '') + so + ' đã có trong các dòng nhập tay (thêm lúc ' + tgThem(trung.id) + '). Không thêm lần nữa để tránh kê trùng; cần sửa thì xóa dòng cũ rồi thêm lại.'); return; }
    var daNap = S.G.list.filter(function (v) { return !v.manual && v.loai === loaiTy && cungSo(v.kyHieu, v.so, loaiTy === 'Bán ra' ? v.muaMST : v.banMST); })[0];
    if (daNap) { toast('HĐ ' + (khTy ? khTy + '-' : '') + so + ' đã có trong danh sách hóa đơn đã nạp (ngày ' + daNap.ngay + ') – không cần nhập tay, tránh kê trùng.'); return; }
    var o = { id: Date.now(), loai: loaiTy, nhom: $('ty-nhom').value, mau: $('ty-mau').value.trim() || '1', kh: $('ty-kh').value.trim(), so: so, ngay: C.dmy(ngay), mst: $('ty-mst').value.replace(/\s/g, ''), ten: $('ty-ten').value.trim(), ct: ct, ts: $('ty-ts').value, th: th, ghiChu: $('ty-gc').value.trim(), gocKh: gkh, gocSo: gso, gocNgay: gngay, gocKey: g ? g.key : '' };
    S.tay.push(o); tSave();
    tyNgay.clear(); tyGNgay.clear(); $('ty-ginfo').innerHTML = ''; ['ty-gkh', 'ty-gso', 'ty-kh', 'ty-so', 'ty-mst', 'ty-ten', 'ty-ct', 'ty-th', 'ty-gc'].forEach(function (id) { $(id).value = ''; }); delete $('ty-th').dataset.tay;
    recompute(); toast('Đã thêm HĐ ' + (o.kh ? o.kh + '-' : '') + o.so + ' (' + o.nhom.toLowerCase() + ' cho HĐ ' + gkh + '-' + gso + ') vào ' + S.R.ky.nhan.toLowerCase() + '.' + (thayThe ? (g ? ' HĐ gốc tự chuyển sang "Không tính".' : ' Không thấy HĐ gốc trong danh sách: nếu HĐ gốc đang được tính, bỏ tick "Tính vào TK" của nó.') : ''));
  });
  $('b-tbl').addEventListener('change', function (e) { var k = e.target.getAttribute('data-kt'); if (!k) return; if (e.target.checked) delete S.st.khongDK[k]; else S.st.khongDK[k] = 1; stSave(); recompute(); });
  $('b-okall').addEventListener('click', function () { var n = 0; S.G.list.forEach(function (v) { if (v.canXacNhan && v.goiY.kind === 'mix' && tsText(v) === '8% + 10%') { S.st.ok[v.key] = 1; n++; } }); stSave(); recompute(); toast('Đã xác nhận ' + n + ' HĐ tách 8% + 10%.'); });
  $('b-xuat').addEventListener('click', async function () {
    if (!S.G) return;
    try {
      var info = { mst: S.my, ten: tenDN(), nFile: S.files.filter(function (f) { return !f.err; }).length };
      var sh = TKDS.bangKe(S.G.list, info, S.R), tag = S.R ? (S.R.ky.from.getMonth() === S.R.ky.to.getMonth() ? 'T' + C.pad(S.R.ky.from.getMonth() + 1) : 'Q' + (Math.floor(S.R.ky.from.getMonth() / 3) + 1)) + '-' + S.R.ky.from.getFullYear() : '';
      if (!await luu(await C.xlsxBlob(sh), 'Bang-ke-tong-hop_' + (S.my || 'MST') + (tag ? '_' + tag : '') + '.xlsx')) return;
      LOG.ghi('[BK] Xuat bang ke ' + S.G.list.length + ' HD'); toast('Đã lưu bảng kê tổng hợp (4 sheet) vào thư mục Tải về.');
    } catch (er) { LOG.loi('Xuat bang ke loi', er && er.stack); toast('Không tạo được file. Anh/chị thử lại; nếu vẫn lỗi, bấm Ctrl+Alt+L lưu nhật ký gửi người hỗ trợ.'); }
  });

  /* ---- bước 3: tờ khai ---- */
  var KI = [['c22', '[22] Thuế GTGT còn được khấu trừ kỳ trước chuyển sang'], ['c32b', '[32b] HHDV bán ra không tính vào giá tính thuế', 1], ['c34a', '[34a] HHDV bán ra không thuộc phạm vi luật thuế GTGT', 1], ['c37', '[37] Điều chỉnh giảm thuế còn được khấu trừ kỳ trước'], ['c38', '[38] Điều chỉnh tăng thuế còn được khấu trừ kỳ trước'], ['c39a', '[39a] Thuế GTGT nhận bàn giao được khấu trừ'], ['c40b', '[40b] Thuế GTGT dự án đầu tư bù trừ với SXKD'], ['c42', '[42] Thuế GTGT đề nghị hoàn']];
  function kKey() { return 'in-' + (S.my || 'chung') + '-' + $('k-kieu').value + $('k-so').value + '-' + $('k-nam').value; }
  function kLoadInp() { if (S.kk === kKey()) return false; S.kk = kKey(); S.inp = jget(kKey()) || {}; S.tay = jget('tay-' + kKey().slice(3)) || []; kInputs(); if (S.tay.length) setTimeout(function () { toast('Lưu ý: kỳ này đang có ' + S.tay.length + ' dòng hóa đơn nhập tay đã lưu từ trước (nhãn "Nhập tay" trong bảng kê). Không dùng nữa thì bấm × Xóa hoặc "Xóa tất cả".'); }, 600); return true; }
  function kInp() { return Object.assign({}, S.inp, { kieu: $('k-kieu').value, so: $('k-so').value, nam: $('k-nam').value, mau: $('k-mau').value, plTenMua: $('k-plm').value.trim(), plTenBan: $('k-plb').value.trim() }); }
  function kSoOpts() { var q = $('k-kieu').value === 'quy', n = q ? 4 : 12, cur = $('k-so').value; $('k-so-l').textContent = q ? 'Quý' : 'Tháng'; $('k-so').innerHTML = Array.apply(null, Array(n)).map(function (_, i) { return '<option value="' + (i + 1) + '">' + (q ? 'Quý ' : 'Tháng ') + (i + 1) + '</option>'; }).join(''); if (cur && +cur <= n) $('k-so').value = cur; }
  function kGuess() {
    var g = {}; S.G.list.forEach(function (v) { var p = C.parseDate(v.ngay); if (p) { var k = p.y * 100 + p.m; g[k] = (g[k] || 0) + 1; } });
    var ks = Object.keys(g).map(Number); if (!ks.length) return;
    var best = ks.sort(function (a, b) { return g[b] - g[a]; })[0], y = Math.floor(best / 100), m = best % 100;
    // dữ liệu từ 2 tháng trở lên trong cùng 1 quý → khai quý
    var big = ks.filter(function (k) { return g[k] >= 3 && Math.floor(k / 100) === y && Math.ceil((k % 100) / 3) === Math.ceil(m / 3); });
    $('k-kieu').value = big.length >= 2 ? 'quy' : 'thang'; $('k-nam').value = y; kSoOpts(); $('k-so').value = $('k-kieu').value === 'quy' ? Math.ceil(m / 3) : m;
  }
  function kInputs() {
    var tt89 = $('k-mau').value !== 'TT80';
    $('k-inp').innerHTML = KI.filter(function (f) { return tt89 || !f[2]; }).map(function (f) { var v = S.inp[f[0]]; return '<div class="f"><label for="ki-' + f[0] + '">' + f[1] + '</label><input class="in mono" style="text-align:right" id="ki-' + f[0] + '" data-c="' + f[0] + '" data-money inputmode="numeric" value="' + (v ? M(v) : '') + '" placeholder="0"></div>'; }).join('');
  }
  function renderTK() {
    var R = S.R;
    if (!R || !S.my) { $('k-main').hidden = true; $('k-empty').hidden = false; $('k-empty-t').textContent = !S.G ? 'Chưa có hóa đơn. Nạp file ở bước 1.' : 'Hãy nhập MST doanh nghiệp ở bước 1.'; return; }
    $('k-empty').hidden = true; $('k-main').hidden = false;
    var c = R.c;
    $('k-kpis').innerHTML = [['HĐ bán ra trong kỳ', R.dem.ban], ['HĐ mua vào trong kỳ', R.dem.mua], ['Thuế đầu ra [35]', M(c.c35)], ['Thuế đầu vào được khấu trừ [25]', M(c.c25)], [c.c41 ? 'Còn được khấu trừ [41]' : 'Thuế còn phải nộp [40]', M(c.c41 || c.c40)]].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><b>' + k[1] + '</b></div>'; }).join('');
    var W = [];
    if (!R.dem.ban) W.push(['bad', 'Trong ' + R.ky.nhan.toLowerCase() + ' chưa có hóa đơn bán ra. Nếu có phát sinh, nạp thêm danh sách bán ra ở bước 1.']);
    if (!R.dem.mua) W.push(['bad', 'Trong ' + R.ky.nhan.toLowerCase() + ' chưa có hóa đơn mua vào. Nếu có phát sinh, nạp thêm danh sách mua vào ở bước 1.']);
    if (R.dem.uocTinh) W.push(['warn', R.dem.uocTinh + ' hóa đơn trong kỳ có thuế suất ước tính chưa xác nhận (HĐ nhiều thuế suất hoặc không có tiền thuế). Số [26], [29]–[33] và phụ lục 8% có thể lệch – xác nhận ở bước 2 (bộ lọc "Thuế suất cần xác nhận").']);
    if (R.dem.ngoaiKy) W.push(['info', R.dem.ngoaiKy + ' hóa đơn nằm ngoài ' + R.ky.nhan.toLowerCase() + ' nên không tính.']);
    if (R.dem.loaiTru) W.push(['info', R.dem.loaiTru + ' hóa đơn đã bị thay thế / bị hủy nên không kê.']);
    if (R.dem.khac) W.push(['bad', R.dem.khac + ' hóa đơn không xác định được bán ra hay mua vào của MST ' + S.my + ', không đưa vào tờ khai.']);
    if (R.dem.dcCan) W.push(['warn', R.dem.dcCan + ' hóa đơn điều chỉnh / thay thế chưa chọn lý do – đang tạm tính vào kỳ này. Chọn lý do ở bước 2, thẻ "HĐ điều chỉnh / thay thế" (bộ lọc "Lý do điều chỉnh cần chọn"): thương mại → kỳ này; sửa sai HĐ kỳ trước → khai bổ sung kỳ gốc.']);
    if (R.dem.ksb) W.push(['info', R.dem.ksb + ' hóa đơn sửa sai cho HĐ kỳ trước không tính vào kỳ này – lập tờ khai bổ sung (01/KHBS) cho kỳ của HĐ gốc (NĐ 252/2026 Điều 12 khoản 6 điểm a; mua vào: NĐ 181/2025 Điều 23 khoản 6 điểm a). Nếu sai sót chỉ làm thay đổi số thuế còn được khấu trừ chuyển kỳ sau thì tick lại "Tính vào TK" để kê chênh lệch vào kỳ này.']);
    if (R.dem.kyPhatHien) W.push(['info', R.dem.kyPhatHien + ' hóa đơn mua vào điều chỉnh tăng thuế đầu vào của HĐ kỳ trước được kê vào kỳ này – kỳ phát hiện (Luật Thuế GTGT 48/2024 Điều 14; NĐ 181/2025 Điều 23 khoản 6 điểm b).']);
    if (R.dem.nhapTay) W.push(['info', R.dem.nhapTay + ' hóa đơn nhập tay (điều chỉnh / thay thế kỳ sau, bổ sung) được tính vào ' + R.ky.nhan.toLowerCase() + '.']);
    if (R.dem.boTay) W.push(['info', R.dem.boTay + ' hóa đơn anh/chị đã bỏ tick "Tính vào TK" nên không kê.']);
    if (R.dem.themTay) W.push(['warn', R.dem.themTay + ' hóa đơn ngoài kỳ / đã bị thay thế được anh/chị chọn kê vào kỳ này – kiểm tra lại.']);
    var dc = S.G.list.filter(function (v) { return v.dieuChinh && v.tinh; }).length;
    if (dc) W.push(['warn', dc + ' hóa đơn điều chỉnh trong kỳ được tính theo đúng dấu số tiền trên danh sách (âm = giảm). Kiểm tra lại HĐ điều chỉnh tăng/giảm trước khi nộp.']);
    var t5 = S.G.list.filter(function (v) { return v.tu5tr && v.tinh && !v.khongDK; }).length;
    if (t5) W.push(['info', t5 + ' hóa đơn mua vào từ 5 triệu đồng trở lên đang tính khấu trừ: cần có chứng từ thanh toán không dùng tiền mặt (lọc "Mua vào từ 5 triệu đồng" ở bước 2).']);
    R.warns.forEach(function (t) { W.push(['warn', t]); });
    W.push(['info', 'Danh sách hóa đơn trên cổng thuế chưa phải toàn bộ đầu vào/đầu ra: tờ khai hải quan hàng nhập khẩu ([23a]/[24a]), chứng từ khác, hóa đơn giấy… phải tự cộng thêm. Cổng thuế có lúc trả thiếu hóa đơn – nên tải lại danh sách 1 lần nữa ở kỳ quan trọng để so số lượng.']);
    $('k-wbox').hidden = !W.length; $('k-wh').textContent = 'Cần xem lại trước khi khai (' + W.length + ')';
    $('k-warns').innerHTML = W.map(wHtml).join('');
    $('k-th').textContent = 'Tờ khai 01/GTGT · ' + R.ky.nhan;
    if (S.nntMst !== S.my) { S.nntMst = S.my; kNntRender(); }
    var F = function (v) { return v === '' ? '' : (typeof v === 'number' ? M(v) : esc(v)); };
    var cmp = S.cmp ? S.cmp.c : null, dcell = function (code, val) {
      if (!cmp || !code) return ''; var k = 'c' + code.replace(/[\[\]]/g, ''); if (cmp[k] === undefined) return ''; var d = (typeof val === 'number' ? val : 0) - cmp[k];
      return d ? ' <span class="diff" title="Đối chiếu: ' + M(cmp[k]) + '">(' + (d > 0 ? '+' : '') + M(d) + ')</span>' : ' <span class="same" title="Khớp">✓</span>';
    };
    $('k-tbl').innerHTML = '<thead><tr><th>STT</th><th>Chỉ tiêu</th><th>Mã</th><th class="r">Giá trị HHDV (chưa thuế)</th><th>Mã</th><th class="r">Thuế GTGT</th></tr></thead><tbody>' + HDToKhai.rows(R, $('k-mau').value).map(function (r) {
      var big = /^[A-C]$|^[IV]+$|^VI$/.test(r[0]), hl = /\[(40|41|43)\]/.test(r[4]) && r[5];
      return '<tr' + (big ? ' style="font-weight:700;background:var(--paper2)"' : '') + '><td class="mono">' + esc(r[0]) + '</td><td style="white-space:normal;min-width:280px">' + esc(r[1]) + '</td><td class="mono">' + esc(r[2]) + '</td><td class="r">' + F(r[3]) + (r[2] && r[2] !== '[21]' ? dcell(r[2], r[3]) : '') + '</td><td class="mono">' + esc(r[4]) + '</td><td class="r"' + (hl ? ' style="font-weight:700;color:var(--red)"' : '') + '>' + F(r[5]) + (r[4] ? dcell(r[4], r[5]) : '') + '</td></tr>';
    }).join('') + '</tbody>';
    $('k-pl').innerHTML = '<thead><tr><th>Mục</th><th>Tên hàng hóa, dịch vụ</th><th class="r">Giá trị chưa thuế 8%</th><th class="r">Thuế GTGT được giảm / thuế 8%</th></tr></thead><tbody>' +
      (R.plMua.concat(R.plBan).length ? R.plMua.map(function (x) { return '<tr><td>I. Mua vào</td><td>' + esc(x.ten) + '</td><td class="r">' + M(x.ct) + '</td><td class="r">' + M(x.giam) + '</td></tr>'; }).join('') + R.plBan.map(function (x) { return '<tr><td>II. Bán ra</td><td>' + esc(x.ten) + '</td><td class="r">' + M(x.ct) + '</td><td class="r">' + M(x.giam) + '</td></tr>'; }).join('')
        : '<tr><td colspan="4" class="hint">Kỳ này không có hóa đơn 8%.</td></tr>') + '</tbody>';
    renderCmp();
  }
  /* ---- đối chiếu ---- */
  var CMP = [['22', 'Thuế còn được khấu trừ kỳ trước'], ['23', 'Giá trị HHDV mua vào'], ['24', 'Thuế GTGT HHDV mua vào'], ['23a', 'Giá trị HHDV nhập khẩu'], ['24a', 'Thuế GTGT HHDV nhập khẩu'], ['25', 'Thuế GTGT mua vào được khấu trừ'], ['26', 'Bán ra không chịu thuế'], ['27', 'Bán ra chịu thuế'], ['28', 'Thuế GTGT bán ra'], ['29', 'Bán ra thuế suất 0%'], ['30', 'Bán ra thuế suất 5%'], ['31', 'Thuế bán ra 5%'], ['32', 'Bán ra thuế suất 10% (gồm 8%)'], ['33', 'Thuế bán ra 10% (gồm 8%)'], ['32a', 'Bán ra không phải kê khai, tính nộp'], ['34', 'Tổng doanh thu bán ra'], ['35', 'Tổng thuế GTGT bán ra'], ['36', 'Thuế GTGT phát sinh trong kỳ'], ['37', 'Điều chỉnh giảm'], ['38', 'Điều chỉnh tăng'], ['39a', 'Thuế nhận bàn giao'], ['40a', 'Thuế phải nộp SXKD'], ['40b', 'Thuế dự án đầu tư bù trừ'], ['40', 'Thuế còn phải nộp'], ['41', 'Thuế chưa khấu trừ hết'], ['42', 'Đề nghị hoàn'], ['43', 'Chuyển kỳ sau']];
  var GOIY = { '23': 'HĐ mua vào chưa hạch toán / hạch toán kỳ khác trên phần mềm, HĐ không mã hoặc máy tính tiền chưa nạp danh sách, HĐ điều chỉnh.', '24': 'như [23]; thêm HĐ có thuế suất khác nhau giữa hóa đơn và chứng từ nhập.', '25': 'HĐ không đủ điều kiện khấu trừ (bỏ tick ở bước 2), HĐ ≥ 5 triệu chưa có chứng từ TT không dùng tiền mặt.', '26': 'thuế suất KCT / 0% của HĐ không có tiền thuế (xác nhận ở bước 2).', '29': 'thuế suất 0% / KCT của HĐ không có tiền thuế.', '32': 'HĐ bán ra nhiều thuế suất (ước tính), HĐ bán ra chưa ghi sổ, HĐ thay thế/điều chỉnh.', '33': 'như [32].' };
  function renderCmp() {
    var on = !!S.cmp; $('k-cmpbox').hidden = !on; if (!on) return;
    var c = S.R.c, cm = S.cmp.c, lech = [];
    $('k-cmpsrc').textContent = S.cmp.src;
    $('k-ctbl').innerHTML = '<thead><tr><th>Mã</th><th>Chỉ tiêu</th><th class="r">Công cụ (từ danh sách HĐ)</th><th class="r">Tờ khai đối chiếu</th><th class="r">Chênh lệch</th></tr></thead><tbody>' + CMP.map(function (x) {
      var k = 'c' + x[0], a = c[k] || 0, b = cm[k], has = b !== undefined && b !== null && b !== '', d = has ? a - b : 0; if (has && d) lech.push(x[0]);
      var inp = S.cmp.man ? '<input class="in mono cmp-in" data-money data-cm="' + k + '" value="' + (has ? M(b) : '') + '" placeholder="–">' : (has ? M(b) : '<span class="hint">–</span>');
      return '<tr><td class="mono">[' + x[0] + ']</td><td>' + esc(x[1]) + '</td><td class="r">' + M(a) + '</td><td class="r">' + inp + '</td><td class="r">' + (!has ? '' : d ? '<span class="diff">' + (d > 0 ? '+' : '') + M(d) + '</span>' : '<span class="same">✓ khớp</span>') + '</td></tr>';
    }).join('') + '</tbody>';
    var W = [];
    var nHas = CMP.filter(function (x) { var b = cm['c' + x[0]]; return b !== undefined && b !== null && b !== ''; }).length;
    if (!nHas) W.push(['info', 'Gõ số của tờ khai trên phần mềm kế toán vào cột "Tờ khai đối chiếu" (để trống ô nào thì bỏ qua ô đó).']);
    else if (!lech.length) W.push(['info', 'Khớp toàn bộ ' + nHas + ' chỉ tiêu đã đối chiếu.']);
    else { W.push(['bad', 'Lệch ' + lech.length + ' chỉ tiêu: ' + lech.map(function (x) { return '[' + x + ']'; }).join(', ') + '. Chênh lệch = số công cụ − số tờ khai đối chiếu.']); lech.forEach(function (x) { if (GOIY[x]) W.push(['warn', '[' + x + '] thường lệch do: ' + GOIY[x]]); }); }
    if (S.cmp.ky && S.cmp.kyCK && S.cmp.kyCK !== S.cmp.ky) W.push(['bad', 'File đối chiếu là kỳ ' + S.cmp.kyCK + ', công cụ đang lập ' + S.R.ky.nhan + '. Kiểm tra lại kỳ khai.']);
    if (S.cmp.mst && S.cmp.mst !== S.my) W.push(['bad', 'File đối chiếu là của MST ' + S.cmp.mst + ', khác MST doanh nghiệp ' + S.my + '.']);
    $('k-cmpinfo').innerHTML = W.map(wHtml).join('');
  }
  $('k-cmp').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () {
      try {
        var x = TKDS.docXmlSoSanh(String(r.result).replace(/^﻿/, ''));
        var kyNow = $('k-kieu').value === 'quy' ? (+$('k-so').value) + '/' + $('k-nam').value : C.pad($('k-so').value) + '/' + $('k-nam').value;
        S.cmp = { c: x.c, src: 'File ' + f.name + (x.dvu ? ' · lập bằng ' + x.dvu : '') + (x.ky ? ' · kỳ ' + x.ky : '') + (x.mst ? ' · MST ' + x.mst : ''), mst: x.mst, kyCK: x.ky, ky: kyNow };
        LOG.ghi('[DOI CHIEU] Nap XML ' + f.name); renderTK(); $('k-cmpbox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (er) { toast('Không đọc được file XML tờ khai: ' + er.message); }
    }; r.readAsText(f, 'utf-8'); e.target.value = '';
  });
  $('k-cmpman').addEventListener('click', function () { if (!S.cmp || !S.cmp.man) S.cmp = { c: S.cmp ? S.cmp.c : (jget('cmp-' + kKey()) || {}), src: 'Số gõ tay từ tờ khai trên phần mềm kế toán (nhớ theo kỳ).', man: true }; renderTK(); $('k-cmpbox').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('k-cmpoff').addEventListener('click', function () { S.cmp = null; renderTK(); });
  $('k-ctbl').addEventListener('change', function (e) { var k = e.target.getAttribute('data-cm'); if (!k) return; var s = e.target.value.trim(); if (s === '') delete S.cmp.c[k]; else S.cmp.c[k] = (/^-/.test(s) ? -1 : 1) * (+(s.replace(/\D/g, '')) || 0); store('cmp-' + kKey(), JSON.stringify(S.cmp.c)); renderTK(); });

  // ô nhập tiền: tự thêm dấu chấm hàng nghìn khi gõ (giữ dấu - ở đầu)
  document.addEventListener('input', function (e) {
    var el = e.target; if (!el.hasAttribute || !el.hasAttribute('data-money')) return;
    var pos = el.selectionStart, neg = /^\s*-/.test(el.value), digitsBefore = el.value.slice(0, pos).replace(/\D/g, '').length;
    var d = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''), f = (neg ? '-' : '') + d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    el.value = f; var p = neg ? 1 : 0, seen = 0; while (p < f.length && seen < digitsBefore) { if (/\d/.test(f[p])) seen++; p++; } try { el.setSelectionRange(p, p); } catch (er) { }
  });
  $('k-inp').addEventListener('change', function (e) { var k = e.target.getAttribute('data-c'); if (!k) return; var v = +(e.target.value.replace(/\D/g, '')) || 0; S.inp[k] = v; e.target.value = v ? M(v) : ''; store(kKey(), JSON.stringify(S.inp)); recompute(); });
  $('k-kieu').addEventListener('change', function () { kSoOpts(); S.cmp = null; recompute(); });
  $('k-so').addEventListener('change', function () { S.cmp = null; recompute(); });
  $('k-nam').addEventListener('change', function () { S.cmp = null; recompute(); });
  $('k-mau').addEventListener('change', function () { if (S.my) store('mau-' + S.my, $('k-mau').value); kInputs(); recompute(); });
  ['k-plm', 'k-plb'].forEach(function (id) { $(id).addEventListener('change', function () { if (S.my) store(id + '-' + S.my, $(id).value.trim()); recompute(); }); });

  // thông tin ghi trên XML tờ khai (nhớ theo MST)
  var NNTF = [['ten', 'Tên người nộp thuế', ''], ['dchi', 'Địa chỉ', ''], ['nguoiKy', 'Người ký', ''], ['maTinh', 'Mã tỉnh/thành', ''], ['tenTinh', 'Tên tỉnh/thành', ''], ['dthoai', 'Điện thoại', ''], ['maCQT', 'Mã cơ quan thuế nơi nộp', ''], ['tenCQT', 'Tên cơ quan thuế nơi nộp', ''], ['email', 'Email', '']];
  function kNnt() {
    var o = jget('nnt-' + S.my) || {};
    if (!o.ten) o.ten = tenDN();
    if (!o.dchi && S.G) S.G.list.some(function (v) { if (v.muaMST === S.my && v.muaDC) { o.dchi = v.muaDC; return true; } });
    o.mst = S.my; return o;
  }
  var PLM = 'Hàng hóa, dịch vụ mua vào áp dụng thuế suất 8%', PLB = 'Hàng hóa, dịch vụ bán ra áp dụng thuế suất 8%';
  function kNntRender() {
    var o = kNnt(); var mu = store('mau-' + S.my); if (mu) $('k-mau').value = mu;
    $('k-plm').value = store('k-plm-' + S.my) || PLM; $('k-plb').value = store('k-plb-' + S.my) || PLB;
    $('k-nntf').innerHTML = NNTF.map(function (f) { return '<div class="f"><label for="kn-' + f[0] + '">' + f[1] + '</label><input class="in" id="kn-' + f[0] + '" data-kn="' + f[0] + '" value="' + esc(o[f[0]] || '') + '" placeholder="' + esc(f[2]) + '"></div>'; }).join('');
  }
  $('k-nnt').addEventListener('change', function (e) {
    var f = e.target.getAttribute('data-kn');
    if (f) { var o = kNnt(); o[f] = e.target.value.trim(); store('nnt-' + S.my, JSON.stringify(o)); return; }
    if (e.target.id === 'kn-cu' && e.target.files[0]) {
      var r = new FileReader(); r.onload = function () {
        try {
          var x = HDToKhai.docXmlCu(String(r.result).replace(/^﻿/, '')), o = kNnt(), dien = 0;
          NNTF.forEach(function (f) { if (x[f[0]] && !o[f[0]]) { o[f[0]] = x[f[0]]; dien++; } }); store('nnt-' + S.my, JSON.stringify(o));
          S.inp.c22 = x.ct43; store(kKey(), JSON.stringify(S.inp)); kInputs(); kNntRender(); recompute();
          toast('Đã lấy từ tờ khai kỳ ' + x.ky + ': điền ' + dien + ' ô còn trống, [22] = ' + M(x.ct43) + '.' + (x.mst && x.mst !== S.my ? ' Lưu ý: file là của MST ' + x.mst + '.' : ''));
        } catch (er) { toast('Không đọc được file XML tờ khai: ' + er.message); }
      }; r.readAsText(e.target.files[0], 'utf-8'); e.target.value = '';
    }
  });
  function tagKy() { return ($('k-kieu').value === 'quy' ? 'Q' + $('k-so').value : 'T' + C.pad($('k-so').value)) + '-' + $('k-nam').value; }
  $('k-xml').addEventListener('click', async function () {
    var R = S.R; if (!R) return;
    if ($('k-mau').value !== 'TT80' && (R.c.c32b || R.c.c34a)) { toast('File XML đang theo cấu trúc mẫu TT 80 (chưa có [32b], [34a]). Tờ khai có số ở [32b]/[34a] nên chưa xuất được XML.'); return; }
    var o = kNnt(), thieu = ['maCQT', 'tenCQT', 'maTinh'].filter(function (k) { return !o[k]; });
    if (thieu.length) { $('k-nnt').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Anh/chị điền mã/tên cơ quan thuế và mã tỉnh (hoặc lấy từ XML tờ khai kỳ trước) rồi bấm lại.'); return; }
    var inp = { kieu: $('k-kieu').value, so: $('k-so').value, nam: $('k-nam').value };
    if (!await luu(new Blob([HDToKhai.xml(R, inp, o)], { type: 'application/xml' }), 'To-khai-01GTGT_' + S.my + '_' + tagKy() + '.xml')) return;
    LOG.ghi('[TK] Xuat XML ' + tagKy()); toast('Đã lưu file XML tờ khai (cấu trúc HTKK, mẫu TT 80)' + (DLP ? ', nén trong file .zip – giải nén trước khi mở bằng HTKK' : '') + '. Kiểm tra lại trước khi ký nộp.');
  });
  $('k-xuat').addEventListener('click', async function () {
    var R = S.R; if (!R) return;
    try {
      var sh = HDToKhai.sheets(R, { mau: $('k-mau').value }, { mst: S.my, ten: tenDN() });
      sh[0].pre[3] = 'Đơn vị tiền: Đồng Việt Nam. Số liệu do công cụ Quản trị tử tế tổng hợp từ file Danh sách hóa đơn của cổng thuế – đối chiếu trước khi nộp.';
      if (S.cmp) {
        var c = R.c, cm = S.cmp.c;
        sh.push({ name: 'Doi chieu', pre: ['ĐỐI CHIẾU TỜ KHAI 01/GTGT', 'Kỳ: ' + R.ky.nhan + ' · ' + S.cmp.src], noFilter: true, cols: [{ h: 'Mã', t: 's', w: 8 }, { h: 'Chỉ tiêu', t: 's', w: 40 }, { h: 'Công cụ', t: 'n', w: 18 }, { h: 'Tờ khai đối chiếu', t: 'n', w: 18 }, { h: 'Chênh lệch', t: 'n', w: 16 }],
          rows: CMP.map(function (x) { var k = 'c' + x[0], b = cm[k], has = b !== undefined && b !== ''; return ['[' + x[0] + ']', x[1], c[k] || 0, has ? b : '', has ? (c[k] || 0) - b : '']; }) });
      }
      if (!await luu(await C.xlsxBlob(sh), 'To-khai-01GTGT_' + S.my + '_' + tagKy() + '.xlsx')) return;
      LOG.ghi('[TK] Xuat Excel ' + tagKy() + ' ban ' + R.dem.ban + ' mua ' + R.dem.mua + ' [40] ' + R.c.c40 + ' [43] ' + R.c.c43); toast('Đã lưu file tờ khai vào thư mục Tải về.');
    } catch (er) { LOG.loi('Xuat to khai loi', er && er.stack); toast('Không tạo được file. Anh/chị thử lại; nếu vẫn lỗi, bấm Ctrl+Alt+L lưu nhật ký gửi người hỗ trợ.'); }
  });

  kSoOpts(); kInputs();
  // nút tải bản offline: chỉ hiện khi đang dùng online (trên web); bản đã tải về mở bằng file thì ẩn
  if (/^https?:$/.test(location.protocol) && !/claudeusercontent|claude\.ai/.test(location.hostname)) { var bo = $('boff'); bo.href = location.pathname.replace(/\/?$/, '').replace(/\/index\.html$/, '') + '/index.html'; bo.hidden = false; }
  window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); luu(new Blob([LOG.text()], { type: 'text/plain;charset=utf-8' }), 'nhat-ky.txt'); } });
  /* ---- góp ý cho Đốm: POST /api/feedback, tool = to-khai-gtgt → Quản trị → Góp ý ---- */
  [].forEach.call(document.querySelectorAll('img[data-dom]'), function (im) { var src = document.querySelector('header.top img.' + im.getAttribute('data-dom')); if (src) im.src = src.src; });
  var FB = { stars: 0, type: 'Đánh giá chung' };
  function fbOpen() { FB = { stars: 0, type: 'Đánh giá chung' }; $('fb-form').reset(); fbMsg(''); $('fb-send').disabled = false; $('fb-send').textContent = 'Gửi góp ý'; [].forEach.call($('fb-stars').children, function (b) { b.classList.remove('on'); }); [].forEach.call($('fb-types').children, function (b, i) { b.classList.toggle('on', i === 0); }); $('fb-ov').hidden = false; setTimeout(function () { $('fb-content').focus(); }, 30); }
  function fbClose() { $('fb-ov').hidden = true; }
  function fbMsg(t, c) { var m = $('fb-msg'); m.textContent = t; m.className = 'fb-msg ' + (c || ''); }
  $('fb-open').addEventListener('click', fbOpen); $('fb-x').addEventListener('click', fbClose); $('fb-close').addEventListener('click', fbClose);
  $('fb-ov').addEventListener('click', function (e) { if (e.target === $('fb-ov')) fbClose(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('fb-ov').hidden) fbClose(); });
  $('fb-stars').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; FB.stars = +b.getAttribute('data-n'); [].forEach.call($('fb-stars').children, function (x, i) { x.classList.toggle('on', i < FB.stars); }); });
  $('fb-types').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; FB.type = b.textContent; [].forEach.call($('fb-types').children, function (x) { x.classList.toggle('on', x === b); }); });
  $('fb-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var content = $('fb-content').value.trim(), name = $('fb-name').value.trim(), phone = $('fb-phone').value.trim();
    if (content.length < 5) { fbMsg('Anh/chị nhập nội dung góp ý (ít nhất 5 ký tự).', 'err'); $('fb-content').focus(); return; }
    if (name.length < 2) { fbMsg('Anh/chị nhập họ tên để Đốm tiện phản hồi.', 'err'); $('fb-name').focus(); return; }
    if (phone && !/^[0-9 +().-]{8,20}$/.test(phone)) { fbMsg('Số điện thoại chưa đúng (có thể để trống).', 'err'); return; }
    var step = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    if (!$('fb-consent').checked) { fbMsg('Anh/chị tích ô đồng ý để Đốm lưu thông tin và phản hồi giúp em nhé.', 'err'); return; }
    var body = { tool: 'to-khai-gtgt', name: name, phone: phone, consent: true, content: '[' + FB.type + ']' + (FB.stars ? ' · Đánh giá: ' + FB.stars + '/5 ★' : '') + '\n' + content, page: 'Bảng kê & Tờ khai thuế GTGT từ Excel · ' + (step ? step.textContent.trim().replace(/^\d+\s*/, 'Bước ' + step.textContent.trim().charAt(0) + ': ') : '') + ' · bản {{NGAY}}', website: $('fb-hp').value };
    var btn = $('fb-send'); btn.disabled = true; fbMsg('Đang gửi…');
    var online = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname);
    var req = online
      ? fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Chưa gửi được, anh/chị thử lại giúp Đốm.'); return j.message; }); })
      : fetch('https://quantritute.com/api/feedback', { method: 'POST', mode: 'no-cors', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body) }).then(function () { return 'Cảm ơn anh/chị! Góp ý đã được gửi tới Đốm.'; });
    req.then(function (msg) { fbMsg(msg || 'Cảm ơn anh/chị đã góp ý!', 'ok'); btn.textContent = 'Đã gửi'; setTimeout(fbClose, 2200); },
      function (er) { btn.disabled = false; fbMsg(er && er.message && !/fetch|network/i.test(er.message) ? er.message : 'Chưa gửi được (kiểm tra kết nối mạng), anh/chị thử lại giúp Đốm.', 'err'); });
  });
  window.__TK = S; // phục vụ kiểm thử
})();
