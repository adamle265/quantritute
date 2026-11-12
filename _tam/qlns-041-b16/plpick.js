  /* 16:59 10/11 anh: Gửi email / Gửi lên điện thoại → mở bảng chọn người (tick tất cả hoặc vài người) + xem trước, sửa nội dung trước khi gửi.
     Email: chưa có máy chủ gửi → bấm Gửi hiện thông báo "Chưa thiết lập gửi email tự động". Điện thoại: gửi thật (máy chủ chấm công / bản thử), kèm lời nhắn. */
  var PL_MAIL0 = { sub: 'Phiếu lương tháng {thang} – {ho_ten}', body: 'Chào anh/chị {ho_ten},\n\n{cong_ty} gửi anh/chị phiếu lương tháng {thang}.\nThực lĩnh tháng này: {thuc_linh} đồng.\n\nChi tiết từng khoản ở phiếu lương đính kèm. Anh/chị có thắc mắc vui lòng phản hồi trước ngày {han}.\n\nTrân trọng,\n{nguoi_gui}' };
  var PL_APP0 = 'Phiếu lương tháng {thang} đã có. Anh/chị xem chi tiết, dòng nào chưa rõ bấm "Hỏi lại dòng này" trước ngày {han}.';
  var PL_VARS = [['ho_ten', 'Họ tên'], ['thang', 'Tháng'], ['thuc_linh', 'Thực lĩnh'], ['han', 'Hạn hỏi lại'], ['cong_ty', 'Công ty']];
  function plEmail(u, id) { var e = (u.data.NV || []).filter(function (x) { return x['Mã NV'] === id; })[0] || {}; return String(e['Email công ty'] || e['Email'] || '').trim(); }
  function plVars(u, ym, r, L) { var d = plData(u, ym, r, L); return { ho_ten: r.name, ma_nv: r.id, thang: HR.ymLabel(ym), cong_ty: d.cty, thuc_linh: lgMoney(r.pay), han: d.han || '……', nguoi_gui: ccUser() }; }
  function plFill(t, V) { return String(t || '').replace(/\{(\w+)\}/g, function (m, k) { return k in V ? V[k] : m; }); }
  function plPick(kind) {
    var u = plUnit(), ym = PS.pl.ym, L = u.lgm[ym].lock, P = plState(u, ym), S0 = plSet(u), mail = kind === 'mail', dm = !wfOn(u);
    var T = mail ? Object.assign({}, PL_MAIL0, S0.mail || {}) : { body: S0.app != null ? S0.app : PL_APP0 };
    var rows = L.rows.map(function (r) { var em = mail ? plEmail(u, r.id) : ''; return { r: r, em: em, ok: !mail || !!em, b: P.by[r.id] || {} }; });
    var sel = {}; rows.forEach(function (x) { if (x.ok) sel[x.r.id] = 1; });
    var list = '<div class="pk-all"><label><input type="checkbox" id="pkAll" checked> <b>Chọn tất cả</b></label><span id="pkN" class="faint"></span></div><input class="input" id="pkQ" placeholder="Tìm tên, mã NV" style="margin:0 0 8px"><div class="pk-list">' +
      rows.map(function (x) { var st = mail ? (x.em ? '<span class="faint">' + esc(x.em) + '</span>' : '<span class="tag tag-warn">chưa có email</span>') : (x.b.xem ? '<span class="tag tag-ok">đã xem ' + esc(x.b.xem) + '</span>' : x.b.gui ? '<span class="tag">đã gửi ' + esc(x.b.gui.slice(0, 10)) + '</span>' : '<span class="faint">chưa gửi</span>');
        return '<label class="pk-it" data-q="' + esc(HR.stripAcc((x.r.id + ' ' + x.r.name).toLowerCase())) + '"><input type="checkbox" data-pk="' + esc(x.r.id) + '"' + (x.ok ? ' checked' : ' disabled') + '><span class="pk-nm"><b>' + esc(x.r.name) + '</b><small>' + esc(x.r.id) + ' · ' + esc(x.r.dept || '') + '</small></span><span class="pk-st">' + st + '</span></label>'; }).join('') + '</div>';
    var chips = '<div class="pk-chips"><span class="faint">Chèn:</span>' + PL_VARS.map(function (v) { return '<button type="button" class="pk-chip" data-v="{' + v[0] + '}">' + v[1] + '</button>'; }).join('') + '<button type="button" class="pk-chip pk-rs" id="pkRs">Về mẫu mặc định</button></div>';
    var ed = mail ? '<div class="field"><label for="pkSub">Tiêu đề email</label><input class="input" id="pkSub" value="' + esc(T.sub) + '" maxlength="150"></div><div class="field"><label for="pkBody">Nội dung email</label><textarea class="input" id="pkBody" rows="8">' + esc(T.body) + '</textarea></div>'
      : '<div class="field"><label for="pkBody">Lời nhắn hiện trên điện thoại, phía trên phiếu lương</label><textarea class="input" id="pkBody" rows="3" maxlength="400">' + esc(T.body) + '</textarea></div>';
    var right = ed + chips + '<div class="pk-pvh"><b>Xem trước</b><select class="input" id="pkWho" aria-label="Xem trước cho"></select></div><div class="pk-pv" id="pkPv"></div>';
    var m = modal(mail ? 'Gửi phiếu lương qua email' : 'Gửi phiếu lương lên điện thoại' + (dm ? ' (bản thử)' : ''), 'Tháng ' + HR.ymLabel(ym) + ' · ' + shortUnit(u.name) + ' · ' + L.rows.length + ' phiếu',
      '<div class="pk"><div class="pk-l">' + list + '</div><div class="pk-r">' + right + '</div></div><div class="pk-ft"><span class="faint" id="pkFt"></span><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="pkGo"></button></div>');
    var box = m.querySelector('.modal'); if (box) box.classList.add('pk-modal');
    var ids = function () { return rows.filter(function (x) { return sel[x.r.id]; }).map(function (x) { return x.r; }); };
    var cur = function () { return { sub: mail ? $('#pkSub', m).value : '', body: $('#pkBody', m).value }; };
    var pv = function () {
      var who = $('#pkWho', m), list = ids(), keep = who.value;
      who.innerHTML = list.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('') || '<option value="">Chưa chọn người nào</option>';
      if (list.some(function (r) { return r.id === keep; })) who.value = keep;
      var r = list.filter(function (x) { return x.id === who.value; })[0], c = cur(), out = $('#pkPv', m);
      if (!r) { out.innerHTML = '<p class="faint" style="margin:0">Tick chọn ít nhất 1 người để xem trước.</p>'; }
      else { var V = plVars(u, ym, r, L), d = plData(u, ym, r, L);
        out.innerHTML = mail ? '<div class="pk-mail"><div class="pk-mh"><span>Đến</span><b>' + esc(plEmail(u, r.id)) + '</b><span>Tiêu đề</span><b>' + esc(plFill(c.sub, V)) + '</b></div><div class="pk-mb">' + esc(plFill(c.body, V)) + '</div><div class="pk-att">📎 Phieu_luong_' + esc(ym.replace('-', '_')) + '_' + esc(r.id) + '.pdf</div><div class="pk-slip">' + plHtml(d) + '</div></div>'
          : '<div class="pk-phone"><div class="pk-ph-top">Trang nhân viên · ' + esc(r.name) + '</div>' + (c.body.trim() ? '<div class="pk-ph-msg">' + esc(plFill(c.body, V)) + '</div>' : '') + '<div class="pk-ph-card"><b>Phiếu lương tháng ' + HR.ymLabel(ym) + '</b><small>' + esc(d.cty) + ' · ' + esc(d.cong) + '</small>' +
            d.dong.filter(function (x) { return x.g === 'tn'; }).slice(0, 6).map(function (x) { return '<div class="pk-ph-l"><span>' + esc(x.t) + '</span><span>' + lgMoney(x.v) + '</span></div>'; }).join('') + '<div class="pk-ph-l"><span>… bảo hiểm, thuế, khấu trừ</span><span></span></div><div class="pk-ph-l tl"><span>Thực lĩnh</span><span>' + lgMoney(d.tl) + ' đ</span></div><a>Hỏi lại dòng này</a></div></div>'; }
      var n = list.length, nok = rows.filter(function (x) { return x.ok; }).length;
      $('#pkN', m).textContent = n + '/' + nok + ' người'; $('#pkFt', m).textContent = mail && nok < rows.length ? (rows.length - nok) + ' người chưa có email – bổ sung ở Hồ sơ nhân sự' : '';
      $('#pkAll', m).checked = n === nok && nok > 0; $('#pkAll', m).indeterminate = n > 0 && n < nok;
      var go = $('#pkGo', m); go.disabled = !n; go.textContent = (mail ? 'Gửi email' : 'Gửi lên điện thoại') + ' (' + n + ' người)';
    };
    m.addEventListener('change', function (e) {
      var t = e.target; if (t.id === 'pkAll') { rows.forEach(function (x) { if (x.ok) sel[x.r.id] = t.checked ? 1 : 0; }); Array.prototype.forEach.call(m.querySelectorAll('[data-pk]'), function (c) { if (!c.disabled) c.checked = t.checked; }); pv(); }
      else if (t.dataset && t.dataset.pk) { sel[t.dataset.pk] = t.checked ? 1 : 0; pv(); } else if (t.id === 'pkWho') pv();
    });
    var last = null; m.addEventListener('focusin', function (e) { if (e.target.id === 'pkSub' || e.target.id === 'pkBody') last = e.target; });
    m.addEventListener('input', function (e) { if (e.target.id === 'pkQ') { var q = HR.stripAcc(e.target.value.toLowerCase().trim()); Array.prototype.forEach.call(m.querySelectorAll('.pk-it'), function (l) { l.hidden = !!q && l.getAttribute('data-q').indexOf(q) < 0; }); } else if (e.target.id === 'pkSub' || e.target.id === 'pkBody') pv(); });
    m.addEventListener('click', function (e) {
      var c = e.target.closest('.pk-chip'); if (!c) return; e.preventDefault();
      if (c.id === 'pkRs') { if (mail) { $('#pkSub', m).value = PL_MAIL0.sub; $('#pkBody', m).value = PL_MAIL0.body; } else $('#pkBody', m).value = PL_APP0; pv(); return; }
      var el = last || $('#pkBody', m), s = el.selectionStart != null ? el.selectionStart : el.value.length, v = c.getAttribute('data-v'); el.value = el.value.slice(0, s) + v + el.value.slice(el.selectionEnd != null ? el.selectionEnd : s); el.focus(); el.selectionStart = el.selectionEnd = s + v.length; pv();
    });
    $('#pkGo', m).onclick = function () {
      var c = cur(), list = ids(), btn = this; if (!list.length) return;
      if (mail) { S0.mail = { sub: c.sub, body: c.body }; lgSave(u, 'mẫu email phiếu lương'); modal('Gửi email phiếu lương', '', '<div class="pl-mail"><p>Chưa thiết lập gửi email tự động. Anh/chị sẽ thiết lập tại phần <b>Cài đặt</b> khi bản hoàn thiện phát hành.</p><p class="faint" style="font-size:13px">Đã lưu tiêu đề, nội dung email vừa soạn để dùng cho lần sau (' + list.length + ' người được chọn).</p><div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" data-close>Đã hiểu</button></div></div>', true); return; }
      S0.app = c.body; btn.disabled = true; P.sentIso = HR.isoToday();
      var pay = list.map(function (r) { var d = plData(u, ym, r, L); d.loi_nhan = plFill(c.body, plVars(u, ym, r, L)).trim(); return { ma: r.id, du_lieu: d }; });
      plCall(u, 'phieu', { ym: ym, chot: L.at, nguoi: ccUser(), list: pay }).then(function () {
        var now = nowVn(); list.forEach(function (r) { (P.by[r.id] = P.by[r.id] || {}).gui = now; }); P.sent = now; P.n = Object.keys(P.by).filter(function (k) { return P.by[k].gui; }).length;
        if (wfOn(u)) wfLog(u, 'Gửi phiếu lương ' + HR.ymLabel(ym) + ': ' + list.length + ' người'); log('Gửi phiếu lương ' + HR.ymLabel(ym) + ' lên điện thoại (' + u.name + '): ' + list.length + ' người'); lgSave(u, 'lời nhắn phiếu lương'); saveUnits();
        m.close(); toast('Đã gửi ' + list.length + ' phiếu lương lên điện thoại', 'ok'); render();
      }).catch(function (e) { btn.disabled = false; showErr('Chưa gửi được phiếu lương', e); });
    };
    pv();
  }
  ACTS['pl-mail'] = function () { plPick('mail'); };
  ACTS['pl-send'] = function () { plPick('app'); };
