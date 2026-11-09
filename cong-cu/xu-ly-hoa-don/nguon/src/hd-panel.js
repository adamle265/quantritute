/* ==========================================================================
   HD-PANEL – bảng điều khiển "Tải HĐ hàng loạt" chạy trên hoadondientu.gdt.gov.vn
   Quản trị tử tế · quantritute.com
   - Dùng phiên đăng nhập sẵn có của trình duyệt (cookie jwt). Không hỏi, không lưu mật khẩu.
   - Chỉ gọi tới chính trang thuế. Không gửi dữ liệu đi nơi khác.
   ========================================================================== */
(function () {
  'use strict';
  var DOM_LUP = '__DOM_LUP__';
  var C = HDCore, VER = '1.9.0', HOST = 'hoadondientu.gdt.gov.vn';
  var DOM_ICON = '__DOM_ICON__';

  if (window.__qttHD && window.__qttHD.show) { window.__qttHD.show(); return; }

  /* ---------- kiểm tra đang ở đúng trang ---------- */
  if (location.hostname !== HOST) {
    var t = document.createElement('div');
    t.textContent = 'Nút "Tải HĐ hàng loạt" chỉ chạy trên trang ' + HOST + '. Hãy mở trang đó, đăng nhập, rồi bấm lại nút.';
    t.style.cssText = 'position:fixed;z-index:2147483647;top:16px;right:16px;max-width:360px;background:#A63A2B;color:#fff;padding:14px 16px;border-radius:10px;font:14px/1.5 Segoe UI,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 9000); return;
  }

  var LOG = new C.Logger('nhat-ky');
  LOG.phanCach('Mở bảng điều khiển');
  LOG.ghi('Phiên bản công cụ: ' + VER + ' | lõi ' + C.VERSION);
  LOG.ghi('Trình duyệt: ' + navigator.userAgent);
  LOG.ghi('Trang: ' + location.href);

  /* ---------- phiên đăng nhập ---------- */
  function jwt() { var m = document.cookie.match(/(?:^|; )jwt=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
  function session() {
    var t = jwt(); if (!t) return null;
    try {
      var p = JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))));
      return { mst: String(p.sub || p.username || p.mst || '').trim(), exp: p.exp ? p.exp * 1000 : 0 };
    } catch (e) { return { mst: '', exp: 0 }; }
  }
  function minutesLeft(s) { return s && s.exp ? Math.floor((s.exp - Date.now()) / 60000) : null; }

  /* ---------- gọi máy chủ thuế ---------- */
  var EP = '/tra-cuu/tra-cuu-hoa-don';
  function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })); }
  function headers(action) { return { 'Accept': 'application/json, text/plain, */*', 'Accept-Language': 'vi', 'Action': encodeURIComponent(action), 'Authorization': 'Bearer ' + jwt(), 'End-Point': EP, 'request-id': uuid() }; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ApiError(kind, status, msg) { this.kind = kind; this.status = status; this.message = msg; }

  // một lần gọi, có thử lại. kind lỗi: 'session' | 'blocked' | 'server' | 'network' | 'data'
  // opt.hdr: header bổ sung; opt.once: không tự thử lại (dùng cho lệnh tra có mã xác nhận – mã do người dùng gõ, không gửi lặp)
  async function call(path, action, asBinary, opt) {
    var waits = [2000, 4000, 8000], waitsBlocked = [5000, 10000, 20000], last, lim = opt && opt.once ? 0 : 3;
    for (var attempt = 0; attempt <= lim; attempt++) {
      if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
      var t0 = Date.now(), r;
      LOG.ghi('[MANG] GET ' + path + (attempt ? ' (thử lại lần ' + attempt + ')' : ''));
      var hh = headers(action); if (opt && opt.hdr) for (var hk in opt.hdr) hh[hk] = opt.hdr[hk];
      // 26/10/2026: cổng thuế có lúc treo đúng 60 giây rồi trả 504 (thường gặp ở tải XML HĐ máy tính tiền), gọi lại thì xong ngay
      // → tự ngắt sau HAN giây và gọi lại sớm, thay vì chờ đủ 60 giây mỗi lần.
      var HAN = asBinary ? 20000 : 30000, ac = window.AbortController ? new AbortController() : null, hen = ac ? setTimeout(function () { ac.abort(); }, HAN) : 0, buf;
      S.cho = { t0: t0, path: path };
      try { r = await fetch(path, { headers: hh, credentials: 'include', signal: ac ? ac.signal : undefined }); buf = await r.arrayBuffer(); }
      catch (e) {
        clearTimeout(hen); S.cho = null;
        var treo = e && e.name === 'AbortError';
        last = new ApiError(treo ? 'server' : 'network', 0, treo ? 'Cổng thuế không phản hồi sau ' + HAN / 1000 + ' giây' : 'Không kết nối được tới máy chủ thuế (' + (e && e.message) + ')');
        LOG.ghi('[MANG] -> ' + (treo ? 'qua ' + HAN / 1000 + ' giay khong phan hoi, ngat va goi lai' : 'loi ket noi: ' + (e && e.message)));
        if (attempt < lim) { await sleep(treo ? 1000 : waits[attempt]); continue; } throw last;
      }
      clearTimeout(hen); S.cho = null;
      var u8 = new Uint8Array(buf), ct = r.headers.get('content-type') || '';
      LOG.ghi('[MANG] -> ma tra ve ' + r.status + ' | kieu: ' + (ct || 'khong ro') + ' | ' + u8.length + ' byte | ' + (Date.now() - t0) + ' ms');
      if (r.status === 200) {
        if (S.gap > 250 && ++S.okRun >= 20) { S.gap -= 250; S.okRun = 0; } // cổng ổn định lại → trả nhịp về dần
        if (asBinary) {
          if (u8[0] === 0x50 && u8[1] === 0x4B) return u8;
          var bodyTxt = new TextDecoder().decode(u8.slice(0, 500));
          LOG.ghi('[MANG] -> NGUYEN VAN (khong phai file ZIP): ' + bodyTxt);
          last = new ApiError('data', 200, 'Máy chủ không trả về file hóa đơn: ' + bodyTxt.slice(0, 160));
          if (attempt < lim) { await sleep(waits[attempt]); continue; } throw last;
        }
        try { return JSON.parse(new TextDecoder().decode(u8)); }
        catch (e) { last = new ApiError('data', 200, 'Máy chủ trả về dữ liệu không đọc được'); LOG.ghi('[MANG] -> NGUYEN VAN: ' + new TextDecoder().decode(u8.slice(0, 500))); if (attempt < lim) { await sleep(waits[attempt]); continue; } throw last; }
      }
      var raw = new TextDecoder().decode(u8.slice(0, 500)), msg = raw;
      try { var j = JSON.parse(new TextDecoder().decode(u8)); msg = j.message || j.error || raw; } catch (e) { }
      LOG.ghi('[MANG] -> NGUYEN VAN loi tu may chu: ' + raw);
      // 26/10/2026 (KTT báo: tải cả quý lâu, trang thuế hiện màn đăng nhập nhưng bảng điều khiển vẫn còn):
      // hết phiên → TẠM DỪNG, chờ người dùng tự đăng nhập lại ngay trên trang, rồi chạy tiếp đúng lệnh đang dở.
      // Không tự gia hạn/giữ phiên. Lệnh có mã xác nhận thì báo để người dùng nhập mã mới.
      // 09/11/2026 (góp ý 07/11: "nhập 1–2 mã thì báo hết phiên dù vừa đăng nhập"): lệnh có mã xác nhận bị cổng từ chối
      // (mã sai / hết hạn / đã dùng) trong khi phiên đăng nhập vẫn còn hạn → là LỖI MÃ, không phải hết phiên.
      if (opt && opt.ma && r.status >= 400 && r.status < 500 && r.status !== 429 && !/hành vi|chặn/i.test(msg) && (laMaLoi(msg) || conPhien())) {
        LOG.ghi('[MTT] Cong thue tu choi ma xac nhan (ma ' + r.status + '), phien van con han -> xin ma moi');
        throw new ApiError('captcha', r.status, msg);
      }
      if ((r.status === 401 || (r.status === 403 && !/hành vi|chặn/i.test(msg))) && !(opt && opt.noWait)) {
        await choDangNhapLai();
        if (opt && opt.once) throw new ApiError('relogin', r.status, 'Đã đăng nhập lại');
        attempt--; continue;
      }
      if (r.status === 401) throw new ApiError('session', 401, 'Phiên đăng nhập trang thuế đã hết hạn.');
      if (r.status === 403 && /hành vi|chặn/i.test(msg)) { last = new ApiError('blocked', 403, msg); if (attempt < lim) { LOG.ghi('[CHO] May chu tam chan, cho ' + waitsBlocked[attempt] / 1000 + ' giay'); await sleep(waitsBlocked[attempt]); continue; } throw last; }
      if (r.status === 403) throw new ApiError('session', 403, 'Phiên đăng nhập không còn hiệu lực (' + msg + ').');
      if (/không tồn tại hồ sơ gốc/i.test(msg)) throw new ApiError('noxml', r.status, msg);
      if (r.status === 400 || r.status === 404) throw new ApiError('server', r.status, msg);
      last = new ApiError('server', r.status, msg);
      // 429 = cổng báo gọi dồn dập → giãn nhịp các lệnh sau (tối đa 1,5 giây/lệnh), nhẹ cho tài khoản
      if (r.status === 429) { S.gap = Math.min(1500, (S.gap || 250) + 250); S.okRun = 0; LOG.ghi('[CHO] Cong thue bao goi nhanh (429) -> gian nhip ' + S.gap + ' ms/lenh'); }
      if (attempt < lim) { await sleep(r.status === 504 ? 1000 : waits[attempt]); continue; }
      throw last;
    }
    throw last;
  }

  function laMaLoi(m) { return /ckey|cvalue|captcha|m\u00e3 x\u00e1c nh\u1eadn|m\u00e3 ki\u1ec3m tra/i.test(String(m || '')); }
  function conPhien() { var s = session(); return !!(jwt() && s && (!s.exp || s.exp - Date.now() > 60000)); }

  // chờ người dùng đăng nhập lại trên chính trang thuế (bảng điều khiển thu nhỏ để không che ô đăng nhập)
  async function choDangNhapLai() {
    var cu = jwt(), w = $('w'), daThuNho = w.classList.contains('min'), t0 = Date.now();
    LOG.ghi('[PHIEN] Het phien dang nhap -> cho nguoi dung dang nhap lai');
    var m = $('msg'), giu = m.hidden ? null : [m.className, m.textContent];
    say('Trang thuế đã hết phiên đăng nhập. Anh/chị đăng nhập lại ngay trên trang này (KHÔNG tải lại trang, không đóng tab). Đăng nhập xong, công cụ tự chạy tiếp từ chỗ đang dở, không mất phần đã tải.', 'e');
    $('relog').hidden = false; w.classList.add('min'); $('w').classList.add('w-relog');
    try {
      for (;;) {
        if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
        await sleep(2000);
        var t = jwt(), ss = session();
        if (t && t !== cu && ss && (!ss.exp || ss.exp - Date.now() > 60000)) break;
      }
    } finally {
      $('relog').hidden = true; $('w').classList.remove('w-relog'); if (!daThuNho) w.classList.remove('min');
    }
    refreshSession();
    LOG.ghi('[PHIEN] Da dang nhap lai sau ' + Math.round((Date.now() - t0) / 1000) + ' giay -> chay tiep');
    if (giu) { m.className = giu[0]; m.textContent = giu[1]; m.hidden = false; } else say('Đã đăng nhập lại, công cụ đang chạy tiếp.', 'o');
  }

  /* ---------- trạng thái ---------- */
  var S = { dir: 'ban', kinds: { dt: true, mtt: true }, rows: [], sel: {}, busy: false, stop: false, filter: '' };
  var KQ = [['', 'Tất cả'], ['0', 'Cục Thuế đã nhận'], ['1', 'Đang tiến hành kiểm tra điều kiện cấp mã'], ['2', 'CQT từ chối hóa đơn theo từng lần phát sinh'], ['3', 'Hóa đơn đủ điều kiện cấp mã'], ['4', 'Hóa đơn không đủ điều kiện cấp mã'], ['5', 'Đã cấp mã hóa đơn'], ['6', 'Cục Thuế đã nhận không mã'], ['7', 'Đã kiểm tra định kỳ HĐĐT không có mã'], ['8', 'Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền']];
  var TT = [['', 'Tất cả'], ['1', 'Hóa đơn mới'], ['2', 'Hóa đơn thay thế'], ['3', 'Hóa đơn điều chỉnh'], ['4', 'Hóa đơn đã bị thay thế'], ['5', 'Hóa đơn đã bị điều chỉnh'], ['6', 'Hóa đơn đã bị hủy']];
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('qtt-hd-' + k); localStorage.setItem('qtt-hd-' + k, v); } catch (e) { return null; } }

  // ô ngày 3 phần dd / mm / yyyy: gõ đủ tự nhảy ô, bấm hoặc nháy đúp vào ô nào thì bôi đen để gõ đè
  function dateBox(id, label) {
    return '<div class="db" data-db="' + id + '" role="group" aria-label="' + label + '"><input data-p="d" inputmode="numeric" maxlength="2" placeholder="dd" aria-label="' + label + ': ngày">/' +
      '<input data-p="m" inputmode="numeric" maxlength="2" placeholder="mm" aria-label="' + label + ': tháng">/<input class="y" data-p="y" inputmode="numeric" maxlength="4" placeholder="yyyy" aria-label="' + label + ': năm"><input type="hidden" id="' + id + '"></div>';
  }
  /* ---------- giao diện (Shadow DOM để không đụng CSS trang thuế) ---------- */
  var host = document.createElement('div'); host.id = 'qtt-hd-host';
  var W0 = Math.min(720, window.innerWidth - 24);
  host.style.cssText = 'position:fixed;z-index:2147483646;top:24px;left:' + Math.max(12, Math.round((window.innerWidth - W0) / 2)) + 'px;width:' + W0 + 'px;max-width:calc(100vw - 24px)';
  var root = host.attachShadow({ mode: 'open' });
  var CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.w{--bg:#FBF8F2;--bg2:#F7F2E8;--ink:#231E19;--mute:#6B6259;--line:#E3DACB;--line2:#D3C7B4;--amb:#B06A22;--amb-bg:#F6E7D3;--g:#2F7D4F;--g-bg:#E3F1E8;--red:#A63A2B;--red-bg:#F8E3DE;--blue:#2F5F8F;--blue-bg:#E2ECF5;' +
    'font:13.5px/1.5 "Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);border:1px solid var(--line2);border-radius:14px;box-shadow:0 18px 50px -12px rgba(35,30,25,.45);display:flex;flex-direction:column;max-height:calc(100vh - 48px);overflow:hidden}' +
    '.h{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:move;user-select:none;background:var(--bg2)}' +
    '.h img{width:32px;height:32px}.h .t{flex:1;line-height:1.25;min-width:0}.h .t b{font:600 14.5px "Lexend","Segoe UI",sans-serif;display:block}.h .t small{color:var(--mute);font-size:11.5px}' +
    '.ib{border:0;background:none;cursor:pointer;width:28px;height:28px;border-radius:7px;font-size:17px;color:var(--mute)}.ib:hover{background:var(--line)}' +
    '.b{padding:12px 14px;display:flex;flex-direction:column;gap:12px;overflow:auto}' +
    '.min .b{display:none}.b>*{flex-shrink:0}' +
    '.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;white-space:nowrap}.ok{background:var(--g-bg);color:var(--g)}.bad{background:var(--red-bg);color:var(--red)}.info{background:var(--blue-bg);color:var(--blue)}.warn{background:var(--amb-bg);color:var(--amb)}' +
    '.lbl{font-size:12px;font-weight:600;color:var(--mute);display:block;margin-bottom:4px}.req{color:var(--red)}' +
    '.seg{display:inline-flex;border:1px solid var(--line2);border-radius:9px;padding:3px;background:var(--bg2);gap:3px}.seg button{border:0;background:none;padding:5px 14px;border-radius:7px;cursor:pointer;color:var(--mute);font:600 13px inherit;font-family:inherit}.seg button[aria-pressed=true]{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}' +
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}' +
    'input.in,select.in{width:100%;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:7px 9px;font:inherit;color:var(--ink);min-width:0}input.mono{font-family:Consolas,"IBM Plex Mono",monospace}' +
    '.chk{display:inline-flex;gap:7px;align-items:center;cursor:pointer}.chk input{width:15px;height:15px;accent-color:var(--amb);margin:0}' +
    'details summary{cursor:pointer;color:var(--blue);font-weight:600;font-size:12.5px}details .g3{margin-top:8px}' +
    '.btn{border:1px solid var(--line2);background:#fff;padding:8px 14px;border-radius:9px;cursor:pointer;font:600 13.5px inherit;font-family:inherit;color:var(--ink);display:inline-flex;gap:6px;align-items:center}.btn.pri{background:var(--amb);border-color:var(--amb);color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.sm{padding:5px 10px;font-size:12.5px}' +
    '.hint{font-size:12px;color:var(--mute)}.msg{font-size:12.5px;padding:8px 10px;border-radius:8px}.msg.e{background:var(--red-bg);color:var(--red);font-weight:600}.msg.i{background:var(--blue-bg);color:var(--blue)}.msg.o{background:var(--g-bg);color:var(--g)}.msg.w{background:var(--amb-bg);color:#7a4a17;font-weight:600}' +
    '.tw{border:1px solid var(--line);border-radius:10px;max-height:340px;overflow:auto;background:#fff}table{border-collapse:collapse;width:100%;font-size:12px}th{position:sticky;top:0;background:var(--bg2);text-align:left;color:var(--mute);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line2);white-space:nowrap}td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}td.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}td.m{font-family:Consolas,monospace;font-size:11.5px;white-space:nowrap}' +
    '.out{border:1px solid var(--line);background:var(--bg2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px}' +
    '.bar{height:9px;background:var(--line);border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--amb);transition:width .25s}' +
    '.stats{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute)}.stats b{color:var(--ink)}' +
    '.red{color:var(--red);font-weight:600;font-size:12.5px;display:flex;gap:6px;align-items:flex-start}' +
    '.db{display:flex;align-items:center;gap:1px;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:4px 9px;font-family:Consolas,"IBM Plex Mono",monospace;color:var(--mute)}.db:focus-within{border-color:var(--amb);box-shadow:0 0 0 2px var(--amb-bg)}' +
    '.db input{border:0;outline:0;background:transparent;font:14px Consolas,"IBM Plex Mono",monospace;color:var(--ink);text-align:center;padding:3px 0;width:2.6ch}.db input.y{width:4.6ch}.db input::placeholder{color:#b9ad9c}.db input:focus{background:var(--amb-bg);border-radius:4px}' +
    '.scan{display:flex;gap:14px;align-items:center;border:1px solid var(--line);background:var(--bg2);border-radius:12px;padding:10px 14px}.scan .lup{width:64px;height:64px;flex:none;animation:lup 1.6s ease-in-out infinite;transform-origin:50% 60%}.scan-b{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}' +
    '.scan .bar i{transition:width .4s ease;background:linear-gradient(90deg,var(--amb),#d89a52,var(--amb));background-size:200% 100%;animation:shine 1.2s linear infinite}' +
    '@keyframes lup{0%,100%{transform:translate(0,0) rotate(-4deg)}25%{transform:translate(4px,-3px) rotate(3deg)}50%{transform:translate(0,-5px) rotate(-2deg)}75%{transform:translate(-4px,-2px) rotate(4deg)}}@keyframes shine{to{background-position:-200% 0}}' +
    '@media (prefers-reduced-motion:reduce){.scan .lup,.scan .bar i{animation:none}}' +
    '.cap{border:1.5px solid var(--amb);background:#fff;border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:8px}.cap b{font-size:13.5px}.cap .capimg{height:50px;min-width:150px;border:1px solid var(--line2);border-radius:7px;background:#fff;object-fit:contain}.cap input.in{width:170px;font-size:16px;letter-spacing:2px}' +
    '.relog{display:block;margin-top:3px;font-size:12px;font-weight:700;color:#fff;background:var(--red);border-radius:6px;padding:2px 8px}.w.w-relog{border:2px solid var(--red)}' +
    '[hidden]{display:none!important}';
  root.innerHTML = '<style>' + CSS + '</style>' +
    '<div class="w" id="w">' +
    '<div class="h" id="drag"><img src="' + DOM_ICON + '" alt=""><div class="t"><b>Tải HĐ hàng loạt</b><small>Quản trị tử tế · bản ' + VER + '</small><span class="relog" id="relog" hidden>Hết phiên – đăng nhập lại trên trang, công cụ tự chạy tiếp</span></div><span id="ses"></span><button class="ib" id="bwide" title="Mở rộng / thu hẹp">⤢</button><button class="ib" id="bmin" title="Thu nhỏ">–</button><button class="ib" id="bx" title="Đóng">×</button></div>' +
    '<div class="b">' +
    '<div class="row"><div><span class="lbl">Loại hóa đơn</span><div class="seg" id="dir"><button aria-pressed="true" data-v="ban">Bán ra</button><button aria-pressed="false" data-v="mua">Mua vào</button></div></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px;margin-left:auto"><label class="chk"><input type="checkbox" id="kdt" checked> Hóa đơn điện tử</label><label class="chk"><input type="checkbox" id="kmtt" checked> HĐ có mã từ máy tính tiền</label></div></div>' +
    '<div><span class="lbl">Ngày lập hóa đơn <span class="req">*</span></span><div class="g2">' + dateBox('dtu', 'Từ ngày') + dateBox('dden', 'Đến ngày') + '</div></div>' +
    '<div class="g2"><div><span class="lbl">Trạng thái hóa đơn <span class="req">*</span></span><select class="in" id="stt">' + TT.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div>' +
    '<div><span class="lbl">Kết quả kiểm tra <span class="req">*</span></span><select class="in" id="skq">' + KQ.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
    '<details><summary>Lọc thêm (không bắt buộc)</summary><div class="g3"><div><span class="lbl" id="lmst">MST người mua</span><input class="in mono" id="omst"></div><div><span class="lbl">Ký hiệu HĐ</span><input class="in mono" id="okh" placeholder="C26TAA"></div><div><span class="lbl">Số HĐ</span><input class="in mono" id="oso" inputmode="numeric"></div></div></details>' +
    '<div class="row"><button class="btn pri" id="bfind">Tìm hóa đơn</button><span class="hint" id="fmsg"></span></div>' +
    '<div class="scan" id="scan" hidden><img class="lup" src="' + DOM_LUP + '" alt="Đốm đang tra cứu"><div class="scan-b"><div class="row" style="justify-content:space-between"><b id="scant">Đang quét lần 1, anh/chị vui lòng chờ…</b><span class="hint" id="scanpct">0%</span></div>' +
    '<div class="bar"><i id="scanbar"></i></div><span class="hint" id="scanmax">Hệ thống tự động quét nhiều lần để đảm bảo đủ hóa đơn.</span></div></div>' +
    '<div class="cap" id="cap" hidden><b id="capt">Hóa đơn máy tính tiền</b>' +
    '<span class="hint">Cổng thuế yêu cầu nhập mã xác nhận mỗi lần tra hóa đơn máy tính tiền và mỗi lần sang trang (mỗi trang 50 hóa đơn). Anh/chị đọc mã trong ảnh rồi gõ vào ô dưới. Công cụ không tự đọc mã. Gõ xong các mã, phần còn lại công cụ tự chạy.</span>' +
    '<div class="row"><img class="capimg" id="capimg" alt="Mã xác nhận của cổng thuế"><button class="btn sm" id="capnew" title="Lấy mã khác nếu khó đọc">↻ Đổi mã khác</button></div>' +
    '<div class="row"><input class="in mono" id="capin" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Gõ mã ở đây"><button class="btn pri" id="capok" disabled>Tra đoạn này</button><button class="btn sm" id="capskip">Bỏ qua phần máy tính tiền</button></div>' +
    '<p class="msg e" id="caperr" hidden></p></div>' +
    '<p class="msg w" id="rescanhint" hidden></p>' +
    '<div class="row" id="rescanrow" hidden><button class="btn" id="brescan" title="Quét lại cổng thuế với đúng điều kiện trên, gộp với kết quả đã có. Không mất hóa đơn đã tìm thấy.">Quét lại 1 lượt</button><span class="hint">Không bắt buộc. Kết quả được gộp với lần trước.</span></div>' +
    '<div id="res" hidden style="display:flex;flex-direction:column;gap:10px">' +
    '<div class="row" id="sum"></div>' +
    '<div class="row"><input class="in" id="flt" placeholder="Tìm nhanh theo tên, MST, số HĐ…" style="flex:1"><span class="hint" id="seln"></span></div>' +
    '<div class="tw" id="tw"><table><thead><tr><th><input type="checkbox" id="all" checked title="Chọn tất cả"></th><th>Ngày</th><th>Ký hiệu - Số</th><th id="thdt">Người mua</th><th style="text-align:right">Thanh toán</th><th>Trạng thái</th></tr></thead><tbody id="tb"></tbody></table></div>' +
    '<div class="out"><span class="lbl" style="margin:0">Nhận về (1 file ZIP)</span><label class="chk"><input type="checkbox" id="oxml" checked> File XML của từng hóa đơn</label><label class="chk"><input type="checkbox" id="oxls" checked> Bảng kê Excel (5 sheet: bảng kê, chi tiết hàng, thuế suất, gộp, tra cứu mẫu người bán)</label><label class="chk"><input type="checkbox" id="ogoc"> Giữ gói gốc của từng HĐ (để in bản gốc, nặng ~0,3 MB/HĐ)</label></div>' +
    '<div class="row"><button class="btn pri" id="bdl">Tải hóa đơn</button><span class="hint" id="eta"></span></div>' +
    '</div>' +
    '<div id="prog" hidden style="display:flex;flex-direction:column;gap:8px">' +
    '<div class="row" style="justify-content:space-between"><b id="ptxt"></b><span class="hint" id="peta"></span></div><div class="bar"><i id="pbar"></i></div>' +
    '<div class="stats"><span>Thành công <b id="pok">0</b></span><span>Không có XML gốc <b id="pnx">0</b></span><span>Lỗi <b id="perr">0</b></span><span id="pcur" style="font-family:Consolas,monospace"></span></div>' +
    '<div class="red" id="pwarn"><span>⚠</span><span>Không đóng tab này và không đăng xuất trang thuế khi đang tải.</span></div>' +
    '<div class="row"><button class="btn sm" id="bstop">Dừng lại</button><button class="btn sm" id="bpart" hidden>Lưu phần đã tải</button><button class="btn sm" id="bcont" hidden>Tiếp tục tải</button></div></div>' +
    '<div id="msg" class="msg" hidden></div>' +
    '</div></div>';
  document.documentElement.appendChild(host);
  var $ = function (id) { return root.getElementById(id); };

  /* ---------- ô ngày ---------- */
  function partsOf(id) { var box = root.querySelector('[data-db="' + id + '"]'); return { d: box.querySelector('[data-p=d]'), m: box.querySelector('[data-p=m]'), y: box.querySelector('[data-p=y]'), box: box }; }
  function syncDate(id) { var P = partsOf(id), d = P.d.value, m = P.m.value, y = P.y.value; $(id).value = (d.length === 1 ? '0' + d : d) + '/' + (m.length === 1 ? '0' + m : m) + '/' + y; }
  function setDate(id, v) { var p = String(v || '').split('/'), P = partsOf(id); P.d.value = p[0] || ''; P.m.value = p[1] || ''; P.y.value = p[2] || ''; syncDate(id); }
  function wireDate(id, nextId) {
    var P = partsOf(id), order = [P.d, P.m, P.y];
    function go(i) { var el = order[i]; if (!el) { if (nextId) { var n = partsOf(nextId).d; n.focus(); n.select(); } return; } el.focus(); el.select(); }
    order.forEach(function (el, i) {
      var max = i === 2 ? 4 : 2;
      el.addEventListener('dblclick', function () { el.select(); });
      el.addEventListener('mouseup', function (e) { if (el.selectionStart === el.selectionEnd) { e.preventDefault(); el.select(); } });
      el.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text').trim(), m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (m) { e.preventDefault(); P.d.value = ('0' + m[1]).slice(-2); P.m.value = ('0' + m[2]).slice(-2); P.y.value = m[3]; syncDate(id); go(3); }
      });
      el.addEventListener('input', function () {
        var v = el.value.replace(/\D/g, '').slice(0, max); el.value = v;
        // gõ 1 chữ số không thể đứng đầu ngày/tháng (ngày 4–9, tháng 2–9) thì tự thêm số 0 và nhảy ô
        if (v.length === 1 && ((i === 0 && +v > 3) || (i === 1 && +v > 1))) { el.value = '0' + v; v = el.value; }
        syncDate(id);
        if (v.length === max) go(i + 1);
      });
      el.addEventListener('keydown', function (e) {
        // ô đã đủ số mà không bôi đen: gõ số mới thì thay cả ô (không chèn thêm, không làm nhảy số sang ô khác)
        if (/^\d$/.test(e.key) && el.value.length >= max && el.selectionStart === el.selectionEnd) el.value = '';
        if (e.key === 'Backspace' && !el.value && i > 0) { e.preventDefault(); var pv = order[i - 1]; pv.focus(); var l = pv.value.length; pv.setSelectionRange(l, l); }
        else if (e.key === '/' || e.key === '.' || e.key === '-') { e.preventDefault(); if (el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } go(i + 1); }
        else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && el.selectionEnd === el.value.length && i < 2) { e.preventDefault(); go(i + 1); }
        else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) { e.preventDefault(); go(i - 1); }
        else if (e.key === 'Enter') { $('bfind').click(); }
      });
      el.addEventListener('blur', function () { if (i < 2 && el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } });
    });
  }

  /* ---------- khung đang quét: Đốm cầm kính lúp + thanh tiến độ ---------- */
  function scanStart(total) { S.scan = { done: 0, total: Math.max(1, total), p: 3 }; $('scan').hidden = false; $('fmsg').textContent = ''; $('scanbar').style.width = '3%'; $('scanpct').textContent = '3%'; }
  function scanStep(label) {
    if (!S.scan) return; S.scan.done++;
    if (label) $('scant').textContent = label;
    // Thanh tiến độ CHỈ TĂNG (18/10/2026): tổng số lệnh có thể tăng giữa chừng (lượt 3, tra lại khi cổng trả thiếu)
    // → không bao giờ lùi; nếu ước lượng tụt thì nhích chậm dần về 95% cho tới khi số thực đuổi kịp.
    var muc = Math.min(95, S.scan.done / S.scan.total * 100), cu = S.scan.p || 3;
    S.scan.p = muc > cu ? muc : cu + (95 - cu) * 0.03;
    var pct = Math.floor(S.scan.p); $('scanbar').style.width = Math.max(3, S.scan.p) + '%'; $('scanpct').textContent = Math.max(3, pct) + '%';
  }
  function scanEnd() { if (S.scan) { $('scanbar').style.width = '100%'; $('scanpct').textContent = '100%'; } setTimeout(function () { $('scan').hidden = true; }, 350); S.scan = null; }

  /* ---------- tiện ích hiển thị ---------- */
  function say(text, type) { var m = $('msg'); if (!text) { m.hidden = true; return; } m.className = 'msg ' + (type || 'i'); m.textContent = text; m.hidden = false; }
  function sayErr(text) { say(text, 'e'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function refreshSession() {
    var s = session(), el = $('ses');
    if (!s) { el.innerHTML = '<span class="pill bad">Chưa đăng nhập</span>'; return null; }
    var left = minutesLeft(s);
    el.innerHTML = '<span class="pill ' + (left !== null && left < 10 ? 'warn' : 'ok') + '" title="' + (left !== null ? 'Phiên còn khoảng ' + left + ' phút' : '') + '">● ' + esc(s.mst || 'Đã đăng nhập') + '</span>';
    return s;
  }
  refreshSession(); setInterval(refreshSession, 30000);

  // ngày mặc định: tháng trước
  (function () {
    var d = new Date(), a = new Date(d.getFullYear(), d.getMonth() - 1, 1), b = new Date(d.getFullYear(), d.getMonth(), 0);
    wireDate('dtu', 'dden'); wireDate('dden', null);
    setDate('dtu', store('tu') || C.dateToDMY(a)); setDate('dden', store('den') || C.dateToDMY(b));
    var dir = store('dir'); if (dir === 'mua') setDir('mua');
  })();

  /* ---------- kéo, thu nhỏ, đóng ---------- */
  (function () {
    var drag = $('drag'), sx, sy, ox, oy, on = false;
    drag.addEventListener('mousedown', function (e) { if (e.target.closest('button')) return; on = true; sx = e.clientX; sy = e.clientY; var r = host.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; host.style.left = Math.max(0, Math.min(window.innerWidth - 80, ox + e.clientX - sx)) + 'px'; host.style.top = Math.max(0, Math.min(window.innerHeight - 40, oy + e.clientY - sy)) + 'px'; host.style.right = 'auto'; });
    window.addEventListener('mouseup', function () { on = false; });
    $('bmin').onclick = function () { $('w').classList.toggle('min'); };
    // mở rộng / thu hẹp, luôn căn giữa màn hình
    $('bwide').onclick = function () {
      var wide = !host.dataset.wide; host.dataset.wide = wide ? '1' : '';
      var w = Math.min(wide ? 1180 : 720, window.innerWidth - 24); host.style.width = w + 'px';
      host.style.left = Math.max(12, Math.round((window.innerWidth - w) / 2)) + 'px';
      $('tw').style.maxHeight = wide ? '55vh' : '';
    };
    $('bx').onclick = function () { if (S.busy && !window.__qttConfirmClose) { window.__qttConfirmClose = 1; say('Đang tải dở. Bấm × lần nữa để đóng (phần đang tải sẽ mất).', 'e'); return; } host.remove(); delete window.__qttHD; };
  })();
  window.__qttHD = { show: function () { if (!document.documentElement.contains(host)) document.documentElement.appendChild(host); $('w').classList.remove('min'); }, log: LOG, state: S };

  function setDir(v) {
    S.dir = v; store('dir', v);
    Array.prototype.forEach.call(root.querySelectorAll('#dir button'), function (b) { b.setAttribute('aria-pressed', b.dataset.v === v); });
    $('lmst').textContent = v === 'ban' ? 'MST người mua' : 'MST người bán';
    $('thdt').textContent = v === 'ban' ? 'Người mua' : 'Người bán';
    $('res').hidden = true; S.rows = []; S.dkKey = ''; $('rescanrow').hidden = true; $('rescanhint').hidden = true; say('');
  }
  Array.prototype.forEach.call(root.querySelectorAll('#dir button'), function (b) { b.onclick = function () { if (!S.busy) setDir(b.dataset.v); }; });

  /* ---------- tra cứu ---------- */
  function actionSearch() { return 'Tìm kiếm (hóa đơn ' + (S.dir === 'ban' ? 'bán ra' : 'mua vào') + ')'; }
  function actionExport() { return 'Xuất xml (Hóa đơn ' + (S.dir === 'ban' ? 'bán ra' : 'mua vào') + ')'; }
  function basePath(kind) { return kind === 'mtt' ? '/api/sco-query' : '/api/query'; }

  // tra 1 khoảng ngày, lật hết trang. sort: 'desc' | 'asc' (đổi chiều sắp xếp để không nhận lại đúng kết quả cũ).
  // Nếu máy chủ báo total lớn hơn số HĐ nhận được → tra lại tối đa 2 lần.
  // ma: {key, val, tiep} – mã xác nhận người dùng tự gõ (HĐ máy tính tiền). Không tự tra lại, không thử lại.
  // 09/11/2026: cổng thuế hỏi mã MỚI cả khi sang trang 2 → mỗi trang dùng 1 mã người dùng gõ (ma.tiep(trang) xin mã kế tiếp);
  // KHÔNG dùng lại mã của trang trước. Người dùng bỏ qua giữa chừng → trả phần đã có, out.__dung = true.
  async function queryRange(kind, tu, den, extra, sort, label, ma) {
    var q = 'tdlap=ge=' + tu + 'T00:00:00;tdlap=le=' + den + 'T23:59:59' + extra;
    var path = basePath(kind) + '/invoices/' + (S.dir === 'ban' ? 'sold' : 'purchase');
    var duoi = '', opt = null;
    function datMa(m) { duoi = '&ckey=' + encodeURIComponent(m.key) + '&cvalue=' + encodeURIComponent(m.val); opt = { once: true, ma: true, hdr: { 'Ckey': m.key, 'Cvalue': m.val } }; }
    if (ma) datMa(ma);
    sort = sort || 'desc';
    for (var lan = 0; lan < (ma ? 1 : 3); lan++) {
      var out = [], state = null, page = 0, total = null;
      LOG.ghi('[TRA CUU] ' + kind + ' ' + S.dir + ' ' + tu + ' -> ' + den + ' | sap xep ' + sort + (lan ? ' | tra lai lan ' + (lan + 1) : '') + ' | dieu kien: ' + q);
      do {
        if (ma && page > 0) {
          var m2 = await ma.tiep(page + 1, total);
          if (!m2) { out.__dung = true; LOG.ghi('[MTT] Nguoi dung bo qua tu trang ' + (page + 1)); break; }
          datMa(m2);
        }
        var url = path + '?sort=tdlap:' + sort + '&size=50&search=' + q + (state ? '&state=' + encodeURIComponent(state) : '') + duoi;
        var j;
        try { j = await call(url, actionSearch(), false, opt); }
        catch (e) { if (ma && page > 0) { e.trang = page + 1; e.daCo = out; } throw e; }
        page++; var d = (j && j.datas) || []; out = out.concat(d); state = j && j.state;
        if (total === null && j && typeof j.total === 'number') total = j.total;
        scanStep(label);
        if (!d.length) break;
        await sleep(S.gap || 250);
      } while (state && page < 400);
      LOG.ghi('[TRA CUU] -> ' + out.length + ' HD sau ' + page + ' trang | may chu bao total=' + (total === null ? 'khong co' : total));
      out.__total = total;
      if (total === null || out.length >= total || ma) return out;
      LOG.ghi('[DOI SOAT] Nhan ' + out.length + ' < total ' + total + ' -> tra lai');
      await sleep(1500);
    }
    return out;
  }
  function mo(dmy, n) { var d = C.dmyToDate(dmy); return C.dateToDMY(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  // chia khoảng ngày [tu, den] thành n đoạn
  function chia(tu, den, n) {
    var a = C.dmyToDate(tu), b = C.dmyToDate(den), days = Math.round((b - a) / 864e5) + 1, out = [];
    n = Math.max(1, Math.min(n, days));
    for (var i = 0; i < n; i++) {
      var s0 = new Date(a.getFullYear(), a.getMonth(), a.getDate() + Math.floor(i * days / n));
      var e0 = new Date(a.getFullYear(), a.getMonth(), a.getDate() + Math.floor((i + 1) * days / n) - 1);
      out.push([C.dateToDMY(s0), C.dateToDMY(e0)]);
    }
    return out;
  }

  /* ---------- mã xác nhận HĐ máy tính tiền (từ 26/10/2026) ----------
     Người dùng tự đọc và gõ mã do chính cổng thuế cấp. Công cụ KHÔNG đọc/giải mã, KHÔNG lưu, KHÔNG dùng lại mã cho lần tra khác. */
  async function layMa() {
    var j = await call('/api/captcha', actionSearch(), false, { once: true });
    if (!j || !j.key || !j.content) throw new ApiError('data', 200, 'cổng thuế không trả về mã');
    return j;
  }
  function anhMa(c) {
    var t = String(c).trim();
    if (/^<svg/i.test(t)) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t);
    if (/^data:image\//i.test(t)) return t;
    return 'data:image/png;base64,' + t;
  }
  // trả về {key, val} khi người dùng gõ mã, null khi bấm "Bỏ qua phần máy tính tiền"
  function hoiMa(i, n, x, y, loi, trang) {
    return new Promise(function (resolve, reject) {
      var cur = null;
      $('cap').hidden = false; $('capt').textContent = 'Hóa đơn máy tính tiền · đoạn ' + i + '/' + n + ': ' + x + ' → ' + y + (trang > 1 ? ' · trang ' + trang : '');
      $('capok').textContent = trang > 1 ? 'Tra trang ' + trang : 'Tra đoạn này';
      $('caperr').hidden = !loi; $('caperr').textContent = loi || '';
      function xong() { $('cap').hidden = true; $('capnew').onclick = $('capok').onclick = $('capskip').onclick = $('capin').onkeydown = null; }
      function moi() {
        cur = null; $('capok').disabled = true; $('capimg').removeAttribute('src'); $('capin').value = '';
        layMa().then(function (c) { cur = c; $('capimg').src = anhMa(c.content); $('capok').disabled = false; $('capin').focus(); })
          .catch(function (e) {
            if (e.kind === 'session' || e.kind === 'stop') { xong(); reject(e); return; }
            if (e.kind === 'relogin') { moi(); return; }
            $('caperr').hidden = false; $('caperr').textContent = 'Chưa lấy được mã xác nhận từ cổng thuế (' + (e.message || e) + '). Bấm "Đổi mã khác" để thử lại.';
          });
      }
      $('capnew').onclick = moi;
      $('capok').onclick = function () { var v = $('capin').value.trim(); if (!cur || !v) { $('capin').focus(); return; } xong(); LOG.ghi('[MTT] Nguoi dung nhap ma xac nhan cho doan ' + x + ' -> ' + y + (trang > 1 ? ' trang ' + trang : '')); resolve({ key: cur.key, val: v }); };
      $('capin').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('capok').click(); } };
      $('capskip').onclick = function () { xong(); resolve(null); };
      moi();
    });
  }
  // chia khoảng ngày thành các đoạn ≤ MTT_NGAY ngày cho HĐ máy tính tiền, luôn gồm cả 1 ngày liền trước kỳ
  // (HĐ lập trước 7h sáng ngày đầu kỳ lưu theo giờ UTC). 26/10/2026 cổng giới hạn 10 ngày/lần;
  // 09/11/2026 kiểm tra trên cổng thật cùng anh Tuấn: tra được 01–30/09 và 01–31/10 (31 ngày) trong 1 lần → MTT_NGAY = 31.
  // 1 quý (91–93 ngày) = 3 đoạn = 3 mã. Nếu cổng đổi lại, chỉ cần sửa MTT_NGAY.
  var MTT_NGAY = 31;
  function chiaMTT(tu, den) {
    var a = mo(tu, -1), days = Math.round((C.dmyToDate(den) - C.dmyToDate(a)) / 864e5) + 1;
    return chia(a, den, Math.ceil(days / MTT_NGAY));
  }

  async function search() {
    say(''); var s = refreshSession();
    if (!s) { sayErr('Anh/chị chưa đăng nhập trang thuế. Hãy đăng nhập ở trang này rồi bấm Tìm lại.'); return; }
    var tu = $('dtu').value.trim(), den = $('dden').value.trim();
    if (!C.validDMY(tu) || !C.validDMY(den)) { sayErr('Ngày chưa đúng. Nhập theo dạng dd/mm/yyyy, ví dụ 01/09/2026.'); return; }
    if (C.dmyToDate(tu) > C.dmyToDate(den)) { sayErr('"Từ ngày" đang sau "Đến ngày". Hãy đổi lại.'); return; }
    var kinds = []; if ($('kdt').checked) kinds.push('dt'); if ($('kmtt').checked) kinds.push('mtt');
    if (!kinds.length) { sayErr('Chưa chọn loại nào. Tick "Hóa đơn điện tử" hoặc "HĐ có mã từ máy tính tiền".'); return; }
    store('tu', tu); store('den', den);
    var tt = $('stt').value, kq = $('skq').value, mst = $('omst').value.trim(), kh = $('okh').value.trim().toUpperCase(), so = $('oso').value.trim();
    var common = (tt ? ';tthai==' + tt : '') + (mst ? (S.dir === 'ban' ? ';nmmst==' : ';nbmst==') + mst : '') + (kh ? ';khhdon==' + kh : '') + (so ? ';shdon==' + so : '');
    var months = C.splitMonths(tu, den);
    LOG.phanCach('Tìm hóa đơn');
    LOG.ghi('Loai: ' + S.dir + ' | nhom: ' + kinds.join(',') + ' | ' + tu + ' -> ' + den + ' (' + months.length + ' thang) | trang thai: ' + (tt || 'tat ca') + ' | ket qua kiem tra: ' + (kq || 'tat ca'));
    S.busy = true; $('bfind').disabled = true; $('brescan').disabled = true; $('res').hidden = true;
    var rows = [], seen = {}, warn = [];
    // 26/10/2026: cổng thuế bắt nhập mã xác nhận (captcha) cho mỗi lần tra HĐ máy tính tiền, tối đa 10 ngày/lần.
    // Bản 1.7.0: HĐ điện tử quét tự động như cũ; HĐ máy tính tiền tra riêng theo đoạn 10 ngày, mỗi đoạn NGƯỜI DÙNG tự gõ mã.
    // Không tự đọc mã, không lưu/dùng lại mã, không tự thử lại lệnh có mã.
    var kindsDT = kinds.filter(function (k) { return k !== 'mtt'; }), coMTT = kinds.indexOf('mtt') >= 0;
    var mttBo = false, mttThieu = 0, mttDoan = [], mttXong = 0;
    var laCaptcha = function (e) { return /ckey|cvalue|captcha|m\u00e3 x\u00e1c nh\u1eadn/i.test(String((e && e.message) || e || '')); };
    // bấm Tìm lại với đúng điều kiện cũ → GỘP với kết quả lần trước (cổng thuế có lúc trả thiếu, bấm lại không làm mất HĐ đã tìm thấy)
    var dkKey = [S.dir, tu, den, kinds.join(','), common, kq].join('|'), cu = 0;
    if (S.dkKey === dkKey && ((S.rows && S.rows.length) || S.mttXong)) { S.rows.forEach(function (r) { seen[r.__key] = 1; rows.push(r); }); cu = rows.length; LOG.ghi('[DOI SOAT] Tim lai cung dieu kien: gop voi ' + cu + ' HD lan truoc'); }
    try {
      var bosung = 0;
      function addRows(got, kind) {
        var n = 0;
        got.forEach(function (d) {
          var key = d.id || C.keyOf(d.nbmst, d.khmshdon, d.khhdon, d.shdon);
          if (seen[key]) return; seen[key] = 1; n++;
          d.__kind = kind; d.__key = key; d.__ngay = C.ngayVN(d.tdlap); rows.push(d);
        });
        return n;
      }
      // TRA ĐỐI SOÁT (17/10/2026): cổng thuế có lúc trả thiếu HĐ cho cùng một lệnh tra (MTT 9/2026: 11 rồi 16;
      // Q3 mua vào: 57 rồi 61). Lượt 1 tra theo tháng; lượt 2 kiểm tra lại bằng cách chia nửa tháng + đổi chiều sắp xếp
      // (để không nhận lại kết quả cũ). Số lượt tối đa: xem QUY ƯỚC SỐ LƯỢT ngay dưới.
      // QUY ƯỚC SỐ LƯỢT (anh Tuấn chốt 18/10/2026): khoảng 1 tháng quét tối đa 2 lượt, mỗi tháng thêm 1 lượt
      // (3 tháng → 4 lượt). Lần tìm đầu chạy ĐỦ số lượt, không dừng sớm (lượt trống chưa đủ tin:
      // Q3 thực tế dừng ở lượt 2 vì lượt 2 không thêm HĐ nhưng vẫn thiếu). Quét lại: tối đa 2 lượt. Lượt cuối còn thêm HĐ → cảnh báo bấm "Quét lại 1 lượt".
      var maxL = cu ? 2 : Math.max(2, months.length + 1), MAU = [1, 2, 3, 2, 3, 1], LUOT = [];
      for (var li = 0; li < maxL; li++) LUOT.push({ n: MAU[li % MAU.length], sort: li % 2 ? 'asc' : 'desc' });
      $('scanmax').textContent = cu ? 'Quét lại tối đa 2 lần, kết quả được gộp với lần trước.' : 'Hệ thống tự động quét ' + maxL + ' lần (' + months.length + ' tháng) để đảm bảo đủ hóa đơn.';
      // ước lượng số lệnh tra để chạy thanh tiến độ (lượt 1 + lượt 2; nếu phải tra lượt 3 thì cộng thêm)
      // HĐ máy tính tiền: quét lại không hỏi mã lần nữa nếu lần trước đã tra đủ các đoạn
      var canMTT = coMTT && !(kq && kq !== '8') && !(cu && S.mttXong);
      if (coMTT && kq && kq !== '8') LOG.ghi('[MTT] Ket qua kiem tra ' + kq + ' khong ap dung cho HD may tinh tien -> khong tra phan nay');
      if (canMTT) mttDoan = chiaMTT(tu, den);
      if (!kindsDT.length) { maxL = 0; LUOT = []; }
      $('scanmax').textContent = (kindsDT.length ? $('scanmax').textContent + ' ' : '') + (canMTT ? 'Hóa đơn máy tính tiền: ' + mttDoan.length + ' đoạn (tối đa ' + MTT_NGAY + ' ngày/đoạn), mỗi đoạn anh/chị nhập 1 mã xác nhận (đoạn có trên 50 HĐ thì mỗi trang thêm 1 mã).' : '');
      var nSupp = kq ? 0 : kindsDT.length * 2;
      scanStart(kindsDT.length * months.length * (1 + nSupp / Math.max(1, kindsDT.length)) + kindsDT.length + LUOT.slice(1).reduce(function (a, l) { return a + kindsDT.length * months.length * l.n; }, 0) + mttDoan.length);
      // ---- HĐ máy tính tiền LÀM TRƯỚC (bản 1.9.0, 09/11/2026): người dùng gõ liền các mã ngay sau khi bấm Tìm,
      // xong phần này công cụ tự quét HĐ điện tử và (khi bấm Tải) tải XML, không hỏi gì thêm.
      // Mỗi đoạn ≤ 1 tháng = 1 mã; đoạn có trên 50 HĐ thì mỗi trang tiếp theo xin thêm 1 mã (cổng hỏi mã khi sang trang).
      // Không tự đọc mã, không lưu/dùng lại mã, không tự thử lại lệnh có mã.
      var soMa = 0;
      for (var di = 0; di < mttDoan.length && !mttBo; di++) {
        var dx = mttDoan[di][0], dy = mttDoan[di][1], loi = '', loiMa = 0;
        var hx = di === 0 ? tu : dx; // đoạn đầu tra từ 1 ngày trước kỳ (giờ UTC) nhưng hiện cho người dùng đúng ngày họ chọn
        var nhan = 'Đang tra hóa đơn máy tính tiền, đoạn ' + (di + 1) + '/' + mttDoan.length + '…';
        var tiep = (function (i, x, y) {
          return async function (trang, total) {
            $('scant').textContent = 'Chờ anh/chị nhập mã xác nhận (HĐ máy tính tiền, đoạn ' + (i + 1) + '/' + mttDoan.length + ', trang ' + trang + ')…';
            var m = await hoiMa(i + 1, mttDoan.length, x, y, total ? 'Đoạn này có ' + total + ' hóa đơn, cổng thuế yêu cầu mã mới cho trang ' + trang + ' (mỗi trang 50 hóa đơn).' : '', trang);
            if (m) soMa++;
            $('scant').textContent = nhan;
            return m;
          };
        })(di, hx, dy);
        for (;;) {
          $('scant').textContent = 'Chờ anh/chị nhập mã xác nhận (HĐ máy tính tiền, đoạn ' + (di + 1) + '/' + mttDoan.length + ')…';
          var ma = await hoiMa(di + 1, mttDoan.length, hx, dy, loi, 1);
          if (!ma) { mttBo = true; LOG.ghi('[MTT] Nguoi dung bo qua phan HD may tinh tien tu doan ' + (di + 1) + '/' + mttDoan.length); break; }
          soMa++; ma.tiep = tiep; $('scant').textContent = nhan;
          try {
            var gm = await queryRange('mtt', dx, dy, common + ';ttxly==8', 'desc', nhan, ma);
            addRows(gm, 'mtt');
            if (gm.__dung) { mttBo = true; mttThieu += Math.max(0, (gm.__total || 0) - gm.length); }
            else mttXong++;
            if (!gm.__dung && typeof gm.__total === 'number' && gm.length < gm.__total) { mttThieu += gm.__total - gm.length; LOG.ghi('[MTT] Doan ' + dx + ' -> ' + dy + ': nhan ' + gm.length + ' < total ' + gm.__total); }
            break;
          } catch (e) {
            if (e.kind === 'session' || e.kind === 'stop') throw e;
            // lỗi ở trang 2 trở đi: giữ các HĐ đã nhận, tra lại đoạn này từ đầu (cổng không cho tiếp trang bằng mã mới sau khi lỗi)
            if (e.daCo && e.daCo.length) addRows(e.daCo, 'mtt');
            LOG.ghi('[MTT] Tra doan ' + dx + ' -> ' + dy + (e.trang ? ' trang ' + e.trang : '') + ' loi: ' + (e.message || e));
            var laMa = e.kind === 'captcha' || laCaptcha(e);
            if (laMa) loiMa++;
            // gõ mã 2 lần liền vẫn bị từ chối: kiểm tra phiên bằng 1 lệnh tra HĐ điện tử 1 ngày (không cần mã).
            // Phiên đã hết → bảng điều khiển tự chờ anh/chị đăng nhập lại như mọi lệnh khác.
            if (laMa && loiMa === 2) {
              try { await queryRange('dt', dx, dx, common, 'desc', nhan); LOG.ghi('[MTT] Kiem tra phien: van con han'); }
              catch (e2) { if (e2.kind === 'session' || e2.kind === 'stop') throw e2; }
            }
            loi = e.kind === 'relogin' ? 'Đã đăng nhập lại. Mã cũ không còn dùng được, anh/chị nhập mã mới cho đoạn này.'
              : laMa ? 'Mã chưa đúng hoặc đã hết hạn. Anh/chị nhập mã mới bên dưới.'
              : 'Cổng thuế báo lỗi khi tra đoạn này (' + (e.message || 'không rõ') + '). Anh/chị nhập mã mới để tra lại, hoặc bấm "Bỏ qua phần máy tính tiền".';
          }
        }
      }
      $('cap').hidden = true;
      if (canMTT && !mttBo && mttDoan.length) { LOG.ghi('[MTT] Nguoi dung da nhap ' + soMa + ' ma'); if (kindsDT.length) say('Đã xong phần hóa đơn máy tính tiền (' + soMa + ' mã). Phần còn lại công cụ tự chạy, anh/chị có thể làm việc khác.', 'o'); }
      var luot = [], onDinh = false;
      for (var L = 0; L < LUOT.length; L++) {
        var them = 0, lbl = cu ? (L === 0 ? 'Đang quét lại, anh/chị vui lòng chờ…' : 'Sắp xong rồi, anh/chị vui lòng chờ…') : (L === 0 ? 'Đang quét lần 1, anh/chị vui lòng chờ…' : L === maxL - 1 ? 'Sắp xong rồi, anh/chị vui lòng chờ…' : 'Đang quét lần ' + (L + 1) + ' để đảm bảo đầy đủ…');
        for (var k = 0; k < kindsDT.length; k++) {
          var kind = kindsDT[k];
          var supp = L === 0 && !kq ? ['5', '6'] : [];
          for (var m = 0; m < months.length; m++) {
            var parts = chia(months[m][0], months[m][1], LUOT[L].n);
            for (var pi = 0; pi < parts.length; pi++) {
              var x = parts[pi][0], y = parts[pi][1];
              var got;
              try { got = await queryRange(kind, x, y, common + (kq ? ';ttxly==' + kq : ''), LUOT[L].sort, lbl); }
              catch (e) {
                if (e.kind === 'session' || e.kind === 'stop' || L === 0 || LUOT[L].sort === 'desc') throw e;
                // máy chủ không nhận sắp xếp tăng dần → dùng giảm dần
                LOG.ghi('[DOI SOAT] Sap xep asc loi (' + (e.message || e) + '), dung desc'); LUOT[L].sort = 'desc';
                got = await queryRange(kind, x, y, common + (kq ? ';ttxly==' + kq : ''), 'desc', lbl);
              }
              them += addRows(got, kind);
            }
            for (var c = 0; c < supp.length; c++) {
              try { them += addRows(await queryRange(kind, months[m][0], months[m][1], common + ';ttxly==' + supp[c], 'desc', lbl), kind); }
              catch (e) { if (e.kind === 'session' || e.kind === 'stop') throw e; LOG.ghi('[DOI SOAT] Tra bo sung ma ' + supp[c] + ' loi, bo qua: ' + (e.message || e)); }
            }
          }
        }
        // biên đầu kỳ: cổng lưu giờ UTC, HĐ lập trước 7h sáng ngày đầu kỳ (giờ VN) nằm ở ngày hôm trước theo UTC
        // → tra thêm đúng 1 ngày liền trước (không nới khoảng chính vì cổng giới hạn tối đa 1 tháng/lần tra), lọc lại ở cuối
        if (L === 0) for (var kb = 0; kb < kindsDT.length; kb++) {
          var truoc = mo(tu, -1);
          try { addRows(await queryRange(kindsDT[kb], truoc, truoc, common + (kq ? ';ttxly==' + kq : ''), 'desc', lbl), kindsDT[kb]); }
          catch (e) { if (e.kind === 'session' || e.kind === 'stop') throw e; LOG.ghi('[DOI SOAT] Tra bien dau ky loi, bo qua: ' + (e.message || e)); }
        }
        luot.push(them);
        LOG.ghi('[DOI SOAT] Luot ' + (L + 1) + ' (chia ' + LUOT[L].n + ' doan/thang, ' + LUOT[L].sort + '): them ' + them + ' HD, tong ' + rows.length);
        if (cu && L >= 1 && them === 0) break;
        await sleep(300);
      }
      if (canMTT) LOG.ghi('[MTT] Da tra ' + mttXong + '/' + mttDoan.length + ' doan' + (mttBo ? ' (nguoi dung bo qua phan con lai)' : ''));
      onDinh = !kindsDT.length || (luot.length > 1 && luot[luot.length - 1] === 0);
      bosung = luot.slice(1).reduce(function (s, v) { return s + v; }, 0);
      if (mttThieu) warn.push('Cổng thuế báo còn ' + mttThieu + ' HĐ máy tính tiền chưa trả về.');
      if (!onDinh) warn.push('Cổng thuế trả kết quả chưa ổn định: lượt kiểm tra cuối vẫn tìm thêm ' + luot[luot.length - 1] + ' HĐ. Danh sách có thể còn thiếu: chờ vài phút rồi bấm Tìm lại để đối chiếu.');
      S.luot = luot; S.onDinh = onDinh;
      // giữ đúng HĐ có ngày lập (giờ Việt Nam) trong khoảng người dùng chọn
      var lo = C.ymdCompact(tu), hi = C.ymdCompact(den), ngoai = 0;
      rows = rows.filter(function (r) { var v = C.ymdCompact(r.__ngay); if (v >= lo && v <= hi) return true; ngoai++; return false; });
      LOG.ghi('[DOI SOAT] Loc theo ngay VN ' + tu + ' - ' + den + ': bo ' + ngoai + ' HD ngoai khoang');
    } catch (e) {
      scanEnd(); $('cap').hidden = true; S.busy = false; $('bfind').disabled = false; $('brescan').disabled = false; $('fmsg').textContent = '';
      if (e.kind === 'session') sayErr(e.message + ' Đăng nhập lại trên trang này rồi bấm Tìm.');
      else if (e.kind === 'blocked') sayErr('Máy chủ thuế tạm chặn vì gọi nhiều. Chờ 2–3 phút rồi bấm Tìm lại. (Máy chủ báo: ' + e.message + ')');
      else sayErr('Không tìm được hóa đơn. Máy chủ thuế báo: ' + (e.message || 'không rõ') + '.');
      LOG.loi('Tra cuu that bai', e.message || e);
      return;
    }
    scanEnd();
    rows.sort(function (a, b) { return String(b.tdlap).localeCompare(String(a.tdlap)); });
    S.dkKey = dkKey; S.rows = rows; S.sel = {}; rows.forEach(function (r) { S.sel[r.__key] = true; });
    // đã tra đủ mọi đoạn HĐ máy tính tiền → "Quét lại 1 lượt" chỉ quét HĐ điện tử, không hỏi mã lần nữa
    S.mttXong = canMTT ? (!mttBo && !mttThieu && mttXong === mttDoan.length ? 1 : 0) : (coMTT && cu ? S.mttXong : 0);
    S.mttBo = coMTT && mttBo;
    S.busy = false; $('bfind').disabled = false; $('brescan').disabled = false;
    // nút Quét lại (không bắt buộc): cổng thuế có lúc trả thiếu, quét thêm 1 lượt gộp kết quả. Khuyến khích khi khoảng ngày > 1 tháng.
    S.quet = cu ? (S.quet || 1) + 1 : 1; S.tongLuot = (cu ? S.tongLuot || 0 : 0) + S.luot.length;
    $('rescanrow').hidden = false;
    $('brescan').className = 'btn' + (months.length > 1 && S.quet === 1 ? ' pri' : '');
    var ndt = rows.filter(function (r) { return r.__kind === 'dt'; }).length, nmtt = rows.length - ndt;
    $('fmsg').textContent = (S.tongLuot ? 'Đã quét ' + S.tongLuot + ' lượt.' : '') + (canMTT ? ' HĐ máy tính tiền: đã tra ' + mttXong + '/' + mttDoan.length + ' đoạn.' : '') + (cu ? (rows.length > cu ? ' Lần quét lại tìm thêm ' + (rows.length - cu) + ' HĐ.' : ' Lần quét lại không có HĐ mới, danh sách đã đầy đủ.') : '');
    $('rescanhint').hidden = !((months.length > 1 && S.quet === 1) || warn.length);
    $('rescanhint').textContent = warn.length ? (mttThieu ? warn[0] + ' ' : '') + 'Cổng thuế trả kết quả chưa ổn định, danh sách có thể còn thiếu. Anh/chị vui lòng bấm nút "Quét lại 1 lượt" dưới đây.'
      : 'Vì thời gian chọn lớn hơn 1 tháng, để đảm bảo quét đủ, anh/chị vui lòng bấm nút "Quét lại 1 lượt" dưới đây.';
    $('sum').innerHTML = '<span>Tìm thấy</span>' + (kinds.indexOf('dt') >= 0 ? '<span class="pill info">' + ndt + ' HĐ điện tử</span>' : '') + (kinds.indexOf('mtt') >= 0 ? (mttBo ? '<span class="pill warn">' + nmtt + ' HĐ máy tính tiền · đã bỏ qua ' + (mttDoan.length - mttXong) + '/' + mttDoan.length + ' đoạn</span>' : '<span class="pill info">' + nmtt + ' HĐ máy tính tiền</span>') : '');
    LOG.ghi('[TRA CUU] Tong: ' + rows.length + ' HD (dien tu ' + ndt + ', may tinh tien ' + nmtt + ')');
    $('res').hidden = false; render();
    if (mttBo) say('Anh/chị đã bỏ qua ' + (mttDoan.length - mttXong) + '/' + mttDoan.length + ' đoạn hóa đơn máy tính tiền nên danh sách CHƯA đủ phần này. Muốn lấy đủ: bấm "Quét lại 1 lượt" rồi nhập mã cho từng đoạn. Hóa đơn điện tử không bị ảnh hưởng.', 'w');
    else if (!rows.length) say('Không có hóa đơn nào khớp điều kiện.', 'i');
    else say('');
  }

  function partner(r) { return S.dir === 'ban' ? (r.nmten || r.nmtnmua || '') : (r.nbten || ''); }
  function partnerMST(r) { return S.dir === 'ban' ? (r.nmmst || '') : (r.nbmst || ''); }
  function visible() {
    var f = C.boDau(S.filter).toLowerCase(); if (!f) return S.rows;
    return S.rows.filter(function (r) { return C.boDau([partner(r), partnerMST(r), r.shdon, r.khhdon].join(' ')).toLowerCase().indexOf(f) >= 0; });
  }
  function render() {
    var v = visible(), html = [], lim = Math.min(v.length, 1500);
    for (var i = 0; i < lim; i++) {
      var r = v[i];
      html.push('<tr><td><input type="checkbox" data-k="' + esc(r.__key) + '"' + (S.sel[r.__key] ? ' checked' : '') + '></td><td class="m">' + C.dmy(r.__ngay) + '</td><td class="m">' + esc(r.khhdon) + '-' + esc(r.shdon) + (r.__kind === 'mtt' ? ' <span class="pill warn">MTT</span>' : '') + '</td><td>' + esc(partner(r)) + '</td><td class="r">' + C.fmtMoney(r.tgtttbso) + '</td><td>' + esc(C.TTHAI[String(r.tthai)] || r.tthai || '') + '</td></tr>');
    }
    if (v.length > lim) html.push('<tr><td colspan="6" class="hint">… và ' + (v.length - lim) + ' HĐ khác (vẫn được tải nếu đang chọn)</td></tr>');
    $('tb').innerHTML = html.join('');
    count();
  }
  function count() {
    var n = 0, tot = 0; S.rows.forEach(function (r) { if (S.sel[r.__key]) { n++; tot += C.num(r.tgtttbso); } });
    $('seln').textContent = 'Đã chọn ' + n + '/' + S.rows.length + ' · ' + C.fmtMoney(tot) + ' đ';
    $('bdl').textContent = 'Tải ' + n + ' hóa đơn'; $('bdl').disabled = !n;
    var sec = n * 0.75, s = session(), left = minutesLeft(s);
    $('eta').innerHTML = n ? 'Ước tính ' + (sec < 90 ? Math.ceil(sec) + ' giây' : Math.ceil(sec / 60) + ' phút') + (left !== null && left * 60 < sec + 60 ? ' · <b style="color:var(--red)">Phiên đăng nhập chỉ còn ~' + left + ' phút: nên đăng nhập lại trước khi tải.</b>' : '') : '';
    var vis = visible(); $('all').checked = vis.length > 0 && vis.every(function (r) { return S.sel[r.__key]; });
  }
  $('tb').addEventListener('change', function (e) { var k = e.target.getAttribute('data-k'); if (k) { S.sel[k] = e.target.checked; count(); } });
  $('all').onchange = function () { var on = $('all').checked; visible().forEach(function (r) { S.sel[r.__key] = on; }); render(); };
  $('flt').oninput = function () { S.filter = $('flt').value; render(); };
  $('bfind').onclick = function () { if (!S.busy) search(); };
  $('brescan').onclick = function () { if (!S.busy) search(); };
  // nhật ký kỹ thuật: không hiện cho người dùng; người hỗ trợ lấy bằng phím tắt Ctrl+Alt+L khi bảng điều khiển đang mở
  window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L') && document.documentElement.contains(host)) { e.preventDefault(); C.saveBlob(new Blob([LOG.text()], { type: 'text/plain;charset=utf-8' }), 'nhat-ky.txt'); } });

  /* ---------- tải hóa đơn ---------- */
  var J = null; // công việc tải hiện tại
  function job() {
    var list = S.rows.filter(function (r) { return S.sel[r.__key]; });
    return { list: list, i: 0, ok: 0, err: 0, files: [], names: {}, errors: [], invs: [], meta: {}, noxml: [], listOnly: [], goc: $('ogoc').checked, xml: $('oxml').checked, xls: $('oxls').checked, t0: Date.now(), dur: [], tHD: 0, dir: S.dir, tu: $('dtu').value, den: $('dden').value, mst: (session() || {}).mst || '' };
  }
  function listInvoice(r) {
    var ts = [], raw = r.thttltsuat;
    if (Array.isArray(raw)) raw.forEach(function (t) { ts.push({ ts: String(t.tsuat || t.TSuat || ''), thanhTien: C.num(t.thtien || t.ThTien), thue: C.num(t.tthue || t.TThue) }); });
    return { file: '(không có XML gốc trên cổng thuế)', noXml: true, pban: '', loaiHD: '', mauSo: String(r.khmshdon || ''), kyHieu: r.khhdon || '', so: String(r.shdon || ''), ngay: r.__ngay || C.ngayVN(r.tdlap),
      tienTe: r.dvtte || 'VND', tyGia: C.num(r.tgia) || 1, httt: r.htttoan || r.thtttoan || '', mstTCGP: '', lq: null,
      banMST: r.nbmst || '', banTen: r.nbten || '', banDC: r.nbdchi || '', muaMST: r.nmmst || '', muaTen: r.nmten || r.nmtnmua || '', muaDC: r.nmdchi || '', muaNguoi: r.nmtnmua || '',
      chuaThue: C.num(r.tgtcthue), thue: C.num(r.tgtthue), ck: C.num(r.ttcktmai), phi: C.num(r.tgtphi), tong: C.num(r.tgtttbso), bangChu: r.tgtttbchu || '', mccqt: r.mhdon || '', items: [], thueSuat: ts };
  }
  function uniqueName(base) { var n = base, i = 2; while (J.names[n]) n = base + '_' + (i++); J.names[n] = 1; return n; }
  function progress(cur) {
    var n = J.list.length, done = J.i;
    $('ptxt').textContent = (done < n ? 'Đang tải ' : 'Đã tải ') + done + '/' + n;
    $('pbar').style.width = (n ? done / n * 100 : 0) + '%';
    $('pok').textContent = J.ok; $('pnx').textContent = J.noxml.length; $('perr').textContent = J.err; $('pcur').textContent = cur || '';
    // ước tính theo thời gian TRUNG VỊ mỗi HĐ (không để 1 HĐ cổng thuế treo lâu làm số giây nhảy lung tung)
    var ds = J.dur.slice().sort(function (a, b) { return a - b; }), per = ds.length ? Math.max(0.5, ds[Math.floor(ds.length / 2)] / 1000 + (S.gap || 250) / 1000) : 0.9, rem = Math.ceil((n - done) * per);
    J.cur = cur || '';
    $('peta').textContent = done < n ? 'còn khoảng ' + (rem < 90 ? rem + ' giây' : Math.ceil(rem / 60) + ' phút') : '';
  }
  async function runDownload() {
    S.busy = true; S.stop = false; say('');
    $('prog').hidden = false; $('pwarn').hidden = false; $('bstop').hidden = false; $('bpart').hidden = true; $('bcont').hidden = true; $('bdl').disabled = true; $('bfind').disabled = true; $('brescan').disabled = true;
    // cổng thuế phản hồi chậm: hiện số giây đang chờ để người dùng biết công cụ không bị treo
    var nhip = setInterval(function () {
      var w = S.cho ? Math.floor((Date.now() - S.cho.t0) / 1000) : 0;
      if (w >= 4) $('pcur').textContent = (J.cur || '') + ' · cổng thuế phản hồi chậm, đã chờ ' + w + ' giây';
    }, 1000);
    while (J.i < J.list.length) {
      if (S.stop) break;
      var r = J.list[J.i]; J.tHD = Date.now();
      var base = uniqueName(C.tenFileHD(r.__ngay, r.khhdon, r.shdon, partner(r)));
      progress(r.khhdon + '-' + r.shdon);
      var q = 'nbmst=' + encodeURIComponent(r.nbmst) + '&khhdon=' + encodeURIComponent(r.khhdon) + '&shdon=' + encodeURIComponent(r.shdon) + '&khmshdon=' + encodeURIComponent(r.khmshdon);
      try {
        var zip = await call(basePath(r.__kind) + '/invoices/export-xml?' + q, actionExport(), true);
        var parts = await C.unzip(zip), x = null;
        for (var p = 0; p < parts.length; p++) if (/\.xml$/i.test(parts[p].name) && parts[p].bytes) { x = parts[p]; break; }
        if (!x) throw new ApiError('data', 200, 'Gói tải về không có file XML');
        if (J.xml) J.files.push(['XML/' + base + '.xml', x.bytes]);
        if (J.goc) J.files.push(['GOC/' + base + '.zip', zip]);
        try {
          var inv = C.parseInvoiceXML(new TextDecoder().decode(x.bytes), base + '.xml');
          J.invs.push(inv);
          J.meta[C.invKey(inv)] = { tthai: r.tthai, ttxly: r.ttxly, loai: J.dir === 'ban' ? 'Bán ra' : 'Mua vào', kind: r.__kind };
        } catch (pe) { LOG.loi('Khong doc duoc XML ' + base, pe.message); }
        J.ok++; LOG.ghi('[TAI] THANH CONG ' + base + '.xml (' + x.bytes.length + ' byte)');
        J.i++;
      } catch (e) {
        if (e.kind === 'stop') break;
        if (e.kind === 'noxml') {
          // cổng thuế không lưu XML gốc (thường gặp ở HĐ không mã của điện lực, ngân hàng, viễn thông):
          // vẫn đưa vào bảng kê bằng số liệu của danh sách tra cứu
          var li = listInvoice(r);
          J.invs.push(li); J.noxml.push([r.khhdon + '-' + r.shdon, C.dmy(r.__ngay), partner(r), C.fmtMoney(r.tgtttbso)]);
          J.meta[C.invKey(li)] = { tthai: r.tthai, ttxly: r.ttxly, loai: J.dir === 'ban' ? 'Bán ra' : 'Mua vào', kind: r.__kind };
          J.listOnly.push(li);
          LOG.ghi('[TAI] KHONG CO XML GOC ' + base + ' – dua vao bang ke bang so lieu danh sach tra cuu');
          J.i++; await sleep(S.gap || 250); continue;
        }
        if (e.kind === 'session') {
          LOG.ghi('[TAI] Phien het han tai HD thu ' + (J.i + 1));
          say('Phiên đăng nhập trang thuế đã hết hạn. Đăng nhập lại ngay trên trang này (bảng điều khiển vẫn giữ nguyên), rồi bấm "Tiếp tục tải". Hoặc bấm "Lưu phần đã tải" để lấy ' + J.ok + ' HĐ đã xong.', 'e');
          $('bcont').hidden = false; $('bpart').hidden = false; $('bstop').hidden = true; clearInterval(nhip); S.busy = false; progress('tạm dừng'); try { $('msg').scrollIntoView({ block: 'nearest' }); } catch (x) { } return;
        }
        if (e.kind === 'blocked') {
          LOG.ghi('[TAI] May chu chan lien tuc tai HD thu ' + (J.i + 1));
          say('Máy chủ thuế đang tạm chặn vì tải nhiều. Chờ khoảng 3–5 phút rồi bấm "Tiếp tục tải". Hoặc "Lưu phần đã tải" để lấy ' + J.ok + ' HĐ đã xong.', 'e');
          $('bcont').hidden = false; $('bpart').hidden = false; $('bstop').hidden = true; clearInterval(nhip); S.busy = false; progress('tạm dừng'); try { $('msg').scrollIntoView({ block: 'nearest' }); } catch (x) { } return;
        }
        J.err++; J.errors.push([r.khhdon + '-' + r.shdon, C.dmy(r.__ngay), partner(r), e.message || String(e)]);
        LOG.loi('Khong tai duoc ' + base, e.message || e);
        J.i++;
      }
      J.dur.push(Date.now() - J.tHD);
      await sleep(S.gap || 250);
    }
    progress(S.stop ? 'đã dừng' : '');
    clearInterval(nhip);
    await finish(S.stop);
  }
  async function finish(stopped) {
    $('ptxt').textContent = 'Đang đóng gói file ZIP…';
    try {
      var z = new C.ZipWriter();
      J.files.forEach(function (f) { z.add(f[0], f[1], { store: /\.zip$/i.test(f[0]) }); });
      if (J.xls && J.invs.length) {
        var res = C.analyze(J.invs, J.meta, { myMST: J.mst });
        z.add('Bang-ke-hoa-don.xlsx', new Uint8Array(await (await C.xlsxBlob(C.buildSheets(res))).arrayBuffer()), { store: true });
        LOG.ghi('[EXCEL] ' + res.list.length + ' HD, ' + res.tot.dong + ' dong hang, canh bao: ' + res.warns.length);
      }
      if (J.noxml.length) z.add('HD-khong-co-XML-goc.txt', '\ufeffCác hóa đơn cổng thuế không lưu XML gốc ("Không tồn tại hồ sơ gốc của hóa đơn"). Đã đưa vào bảng kê bằng số liệu tổng của danh sách tra cứu, không có chi tiết hàng hóa:\r\n' + J.noxml.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.errors.length) z.add('HD-chua-tai-duoc.txt', '﻿Các hóa đơn chưa tải được (tải lại bằng cách tìm theo đúng ký hiệu/số):\r\n' + J.errors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      z.add('danh-sach.json', JSON.stringify({ congCu: 'Quản trị tử tế · Tải HĐ hàng loạt ' + VER, mst: J.mst, loai: J.dir, tu: J.tu, den: J.den, taiLuc: new Date().toISOString(), meta: J.meta, listOnly: J.listOnly }));
      LOG.ghi('[TAI] ===== Ket thuc: thanh cong ' + J.ok + ' | khong co XML goc ' + J.noxml.length + ' | loi ' + J.err + (stopped ? ' | nguoi dung dung' : '') + ' | ' + Math.round((Date.now() - J.t0) / 1000) + ' giay');
      var name = 'HoaDon_' + (J.dir === 'ban' ? 'BanRa' : 'MuaVao') + '_' + (J.mst || 'MST') + '_' + J.tu.replace(/\//g, '') + '-' + J.den.replace(/\//g, '') + (stopped || J.i < J.list.length ? '_mot-phan' : '') + '.zip';
      var blob = await z.blob();
      window.__qttHD.lastZip = blob;
      C.saveBlob(blob, name);
      $('ptxt').textContent = 'Xong: ' + J.ok + ' HĐ có XML' + (J.noxml.length ? ', ' + J.noxml.length + ' HĐ không có XML gốc' : '') + (J.err ? ', ' + J.err + ' lỗi' : '');
      say('Đã lưu file ' + name + ' (' + (blob.size / 1048576).toFixed(1) + ' MB) vào thư mục Tải về của trình duyệt.' + (S.mttBo ? ' Lưu ý: file này CHƯA đủ hóa đơn máy tính tiền (anh/chị đã bỏ qua một số đoạn).' : '') + (J.noxml.length ? ' ' + J.noxml.length + ' HĐ cổng thuế không lưu XML gốc vẫn có trong bảng kê (số tổng, không có chi tiết hàng), xem HD-khong-co-XML-goc.txt.' : '') + (J.err ? ' Có ' + J.err + ' HĐ chưa tải được, xem file HD-chua-tai-duoc.txt trong ZIP.' : '') + ' Muốn xem chi tiết, cảnh báo: kéo file ZIP vào thẻ 2 của công cụ.', J.err ? 'w' : 'o');
    } catch (e) {
      LOG.loi('Loi khi dong goi ZIP', e && e.stack || e);
      sayErr('Không đóng gói được file ZIP (' + (e && e.message) + ').');
    }
    S.busy = false; $('bdl').disabled = false; $('bfind').disabled = false; $('brescan').disabled = false; $('bstop').hidden = true; $('bcont').hidden = true; $('bpart').hidden = true; $('pwarn').hidden = true;
    try { $('msg').scrollIntoView({ block: 'nearest' }); } catch (e) { }
  }
  $('bdl').onclick = function () {
    if (S.busy) return; var s = refreshSession(); if (!s) { sayErr('Anh/chị chưa đăng nhập trang thuế.'); return; }
    J = job(); if (!J.list.length) return;
    if (!J.xml && !J.xls && !J.goc) { sayErr('Chưa chọn loại file nhận về.'); return; }
    LOG.phanCach('Tải ' + J.list.length + ' hóa đơn'); runDownload();
  };
  $('bstop').onclick = function () { S.stop = true; LOG.ghi('[TAI] Nguoi dung bam Dung lai'); };
  $('bcont').onclick = function () { if (!refreshSession()) { sayErr('Vẫn chưa thấy đăng nhập. Hãy đăng nhập trang thuế trước.'); return; } LOG.ghi('[TAI] Tiep tuc tu HD thu ' + (J.i + 1)); runDownload(); };
  $('bpart').onclick = function () { $('bpart').hidden = true; $('bcont').hidden = true; finish(true); };

  window.addEventListener('beforeunload', function (e) { if (S.busy) { e.preventDefault(); e.returnValue = ''; } });
})();
