/* ==========================================================================
   TK-PANEL – bảng điều khiển "Tải tờ khai hàng loạt" chạy trên dichvucong.gdt.gov.vn
   Quản trị tử tế · quantritute.com
   - Dùng phiên đăng nhập sẵn có của trình duyệt. Không hỏi, không lưu mật khẩu.
   - Chỉ gọi tới chính cổng thuế, đúng các lệnh tra cứu / tải mà trang "Tra cứu hồ sơ" đang dùng.
   - Mã xác nhận: người dùng tự đọc, tự gõ cho từng tháng. Công cụ không tự đọc mã, không dùng lại mã.
   - Chỉ đọc: không gọi bất kỳ lệnh nộp / bổ sung / hủy hồ sơ nào.
   ========================================================================== */
(function () {
  'use strict';
  var DOM_LUP = '__DOM_LUP__';
  var DOM_ICON = '__DOM_ICON__';
  var C = HDCore, VER = '__VER__', HOST = 'dichvucong.gdt.gov.vn', BASE = '/tthc/';
  var SIZE = 50, NGAY_DVC = '01/07/2025';

  if (window.__qttTK && window.__qttTK.show) { window.__qttTK.show(); return; }

  if (location.hostname !== HOST) {
    var t = document.createElement('div');
    t.textContent = 'Nút "Tải tờ khai" chỉ chạy trên trang ' + HOST + '. Hãy mở trang đó, đăng nhập, rồi bấm lại nút.';
    t.style.cssText = 'position:fixed;z-index:2147483647;top:16px;right:16px;max-width:360px;background:#A63A2B;color:#fff;padding:14px 16px;border-radius:10px;font:14px/1.5 Segoe UI,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 9000); return;
  }

  var LOG = new C.Logger('nhat-ky');
  LOG.phanCach('Mở bảng điều khiển');
  LOG.ghi('Phiên bản công cụ: ' + VER + ' | lõi ' + C.VERSION);
  LOG.ghi('Trình duyệt: ' + navigator.userAgent);
  LOG.ghi('Trang: ' + location.pathname);

  var S = { busy: false, stop: false, gap: 1200, okRun: 0, last: 0, rows: [], sel: {}, filter: '', sort: 'tk', token: '', loaiTK: [], mst: '', logged: null };

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ApiError(kind, status, msg) { this.kind = kind; this.status = status; this.message = msg; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('qtt-tk-' + k); if (v === null) localStorage.removeItem('qtt-tk-' + k); else localStorage.setItem('qtt-tk-' + k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* ---------- mã chống giả mạo yêu cầu (CSRF) của trang ---------- */
  function csrf() {
    var m = document.querySelector('meta[name="csrf-token"]');
    if (m && m.content) return m.content;
    if (S.token) return S.token;
    var c = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/); return c ? decodeURIComponent(c[1]) : '';
  }

  /* ---------- gọi cổng thuế ----------
     Giãn nhịp giữa các lệnh (mặc định 1,2 giây), cổng báo 429 thì giãn thêm và chờ.
     Hết phiên: cổng chuyển về trang đăng nhập → báo 'session'.
     opt: {method, json, html, once} */
  function laTrangDangNhap(r, text) {
    var u = String(r.url || '');
    if (/\/(homelogin|login|dang-nhap)(\b|\?|$)/i.test(u) || /sso|cas\/login/i.test(u)) return true;
    if (r.status === 401) return true;
    return false;
  }
  async function call(path, opt) {
    opt = opt || {};
    var waits = [2000, 4000, 8000], waits429 = [6000, 12000, 24000], last, lim = opt.once ? 0 : 3;
    for (var attempt = 0; attempt <= lim; attempt++) {
      if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
      var cho = S.last + S.gap - Date.now(); if (cho > 0) await sleep(cho);
      if (S.stop) throw new ApiError('stop', 0, 'Đã dừng');
      S.last = Date.now();
      var t0 = Date.now(), method = opt.method || 'GET', r, text;
      LOG.ghi('[MANG] ' + method + ' ' + path.replace(/captcha=[^&]*/, 'captcha=***') + (attempt ? ' (thử lại lần ' + attempt + ')' : ''));
      var hh = {};
      if (opt.html) { hh['accept'] = 'text/html-partial'; hh['HX-Request'] = 'true'; }
      if (method === 'POST') { hh['Content-Type'] = 'application/json'; hh['X-XSRF-TOKEN'] = csrf(); hh['Accept'] = 'application/json, text/javascript, */*; q=0.01'; hh['X-Requested-With'] = 'XMLHttpRequest'; }
      var ac = window.AbortController ? new AbortController() : null, hen = ac ? setTimeout(function () { ac.abort(); }, 45000) : 0;
      try {
        r = await fetch(path, { method: method, headers: hh, credentials: 'same-origin', body: opt.json ? JSON.stringify(opt.json) : undefined, signal: ac ? ac.signal : undefined });
        text = await r.text();
      } catch (e) {
        clearTimeout(hen);
        var treo = e && e.name === 'AbortError';
        last = new ApiError(treo ? 'server' : 'network', 0, treo ? 'Cổng thuế không phản hồi sau 45 giây' : 'Không kết nối được tới cổng thuế (' + (e && e.message) + ')');
        LOG.ghi('[MANG] -> ' + last.message);
        if (attempt < lim) { await sleep(treo ? 1000 : waits[attempt]); continue; } throw last;
      }
      clearTimeout(hen);
      LOG.ghi('[MANG] -> ' + r.status + ' | ' + text.length + ' ký tự | ' + (Date.now() - t0) + ' ms');
      if (laTrangDangNhap(r, text)) { LOG.ghi('[PHIEN] Cong chuyen ve trang dang nhap: ' + String(r.url).replace(/\?.*$/, '')); throw new ApiError('session', r.status, 'Phiên đăng nhập cổng thuế đã hết.'); }
      if (r.status === 200) {
        if (S.gap > 1200 && ++S.okRun >= 15) { S.gap = Math.max(1200, S.gap - 300); S.okRun = 0; }
        if (method === 'POST') {
          var j; try { j = JSON.parse(text); } catch (e) {
            if (/<html|<!doctype/i.test(text)) { LOG.ghi('[PHIEN] POST tra ve trang HTML -> coi nhu het phien'); throw new ApiError('session', 200, 'Phiên đăng nhập cổng thuế đã hết.'); }
            last = new ApiError('data', 200, 'Cổng thuế trả về dữ liệu không đọc được'); LOG.ghi('[MANG] -> NGUYEN VAN: ' + text.slice(0, 300));
            if (attempt < lim) { await sleep(waits[attempt]); continue; } throw last;
          }
          return j;
        }
        return text;
      }
      var msg = text;
      try { var jj = JSON.parse(text); msg = jj.error || jj.message || text; } catch (e) { msg = clean(text.replace(/<[^>]+>/g, ' ')); }
      msg = String(msg).slice(0, 200);
      LOG.ghi('[MANG] -> NGUYEN VAN loi: ' + msg);
      if (r.status === 403) throw new ApiError('session', 403, 'Cổng thuế từ chối (403) – có thể phiên đăng nhập đã hết. ' + msg);
      if (r.status === 429) {
        S.gap = Math.min(5000, S.gap + 800); S.okRun = 0;
        last = new ApiError('busy', 429, 'Cổng thuế báo gọi quá nhanh');
        LOG.ghi('[CHO] Cong bao 429 -> gian nhip ' + S.gap + ' ms/lenh, cho ' + waits429[Math.min(attempt, 2)] / 1000 + ' giay');
        if (attempt < lim) { await sleep(waits429[attempt]); continue; } throw last;
      }
      if (opt.khongThuLai && opt.khongThuLai.test(msg)) throw new ApiError('reject', r.status, msg); // lỗi nghiệp vụ, gọi lại cũng vậy
      last = new ApiError(r.status >= 500 ? 'server' : 'reject', r.status, msg);
      if (r.status >= 500 && attempt < lim) { await sleep(waits[attempt]); continue; }
      throw last;
    }
    throw last;
  }

  /* ---------- trang Tra cứu hồ sơ: kiểm tra đăng nhập, lấy danh mục tờ khai ---------- */
  async function moTrangTraCuu() {
    var html = await call(BASE + 'tchs', { once: true });
    var d = new DOMParser().parseFromString(html, 'text/html');
    if (!d.getElementById('form-search-advanced')) throw new ApiError('session', 200, 'Chưa đăng nhập cổng thuế');
    var m = d.querySelector('meta[name="csrf-token"]'); if (m) S.token = m.getAttribute('content') || '';
    var sel = d.querySelector('select[name="maToKhai"]');
    S.loaiTK = sel ? [].slice.call(sel.options).filter(function (o) { return o.value; }).map(function (o) { return [o.value, clean(o.textContent)]; }) : [];
    LOG.ghi('[TRANG] Da dang nhap. Danh muc to khai: ' + S.loaiTK.length + ' loai');
    return true;
  }

  /* ---------- đọc bảng kết quả tra cứu (HTML) ---------- */
  function docKetQua(html) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    var txt = clean(d.body ? d.body.textContent : '');
    var mt = txt.match(/Tổng số bản ghi:?\s*(\d+)/i), tp = d.getElementById('totalPage');
    var heads = [].slice.call(d.querySelectorAll('thead th')).map(function (th) { return C.boDau(clean(th.textContent)).toLowerCase(); });
    var bang = heads.some(function (h) { return h.indexOf('ma ho so') >= 0; });
    if (!mt && !bang) {
      if (/không có (dữ liệu|kết quả|bản ghi|hồ sơ)|không tìm thấy/i.test(txt)) return { ok: true, total: 0, pages: 0, rows: [] };
      return { ok: false, msg: txt.slice(0, 220) };
    }
    function idx(key) { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf(key) >= 0) return i; return -1; }
    var I = { ma: idx('ma ho so'), tthc: idx('ten tthc'), tk: idx('to khai'), ky: idx('ky tinh thue'), loai: idx('loai to khai'), lanBS: idx('lan nop bo sung'), cqt: idx('co quan thue'), ngay: idx('ngay nop'), tt: idx('trang thai') };
    I.lan = (function () { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf('lan nop') === 0 && heads[i].indexOf('bo sung') < 0) return i; return -1; })();
    var rows = [];
    [].slice.call(d.querySelectorAll('tbody tr')).forEach(function (tr) {
      var td = tr.cells; if (!td || td.length < 6) return;
      function c(k) { return I[k] >= 0 && td[I[k]] ? clean(td[I[k]].textContent) : ''; }
      var eye = tr.querySelector('[data-ma-ho-so]'), bs = tr.querySelector('[onclick*="kkhaiBSung"]');
      var ma = c('ma') || (eye ? eye.getAttribute('data-ma-ho-so') : '');
      if (!ma) return;
      var tk = c('tk');
      rows.push({
        ma: ma, tthc: c('tthc'), tk: tk, tkCode: clean(tk.split(' - ')[0]), ky: c('ky'), loai: c('loai'), lanBS: c('lanBS'), lan: c('lan'),
        cqt: c('cqt'), ngay: c('ngay'), tt: c('tt'),
        mstNop: bs ? (bs.getAttribute('data-mst-nop') || '') : '', mstNopThay: bs ? (bs.getAttribute('data-mst-nop-thay') || '') : ''
      });
    });
    var total = mt ? +mt[1] : rows.length, pages = tp ? +clean(tp.textContent) || 1 : 1;
    return { ok: true, total: total, pages: pages, rows: rows };
  }
  function qs(tu, den, ma, extra) {
    var p = 'maNghiepVu=&maTTHC=&maToKhai=' + encodeURIComponent(S.maTK || '') + '&maHoSo=&tuNgay=' + encodeURIComponent(tu) + '&denNgay=' + encodeURIComponent(den) + '&scope_tdt1=SELF&mstUyQuyen_tdt1=&captcha=' + encodeURIComponent(ma || '');
    return BASE + 'ho-so/search?' + p + (extra || '');
  }

  /* ---------- ngày ---------- */
  function d2(dmy) { return C.dmyToDate(dmy); }
  function chiaThang(tu, den) { return C.splitMonths(tu, den); } // mỗi đoạn trong 1 tháng dương lịch → luôn ≤ 30 ngày chênh lệch
  function ngayNop(s) { var m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/); return m ? { dmy: m[1] + '/' + m[2] + '/' + m[3], gio: m[4] ? m[4] + ':' + m[5] : '', k: m[3] + m[2] + m[1] + (m[4] || '00') + (m[5] || '00') } : { dmy: '', gio: '', k: '' }; }

  /* ---------- gom nhóm nhiều lần nộp ---------- */
  var RE_KHONG_HL = /hủy|từ chối|không (được )?chấp nhận|không hợp lệ|không tiếp nhận|trả lại|lỗi/i;
  var RE_CHO = /chờ|đang xử lý|đang tiếp nhận|đã tiếp nhận/i;
  function gomNhom(rows) {
    var g = {};
    rows.forEach(function (r) {
      r.__n = ngayNop(r.ngay);
      r.hieuLuc = !RE_KHONG_HL.test(r.tt);
      r.key = r.ky ? C.boDau(r.tkCode).toUpperCase() + '|' + r.ky : 'ma:' + r.ma;
      (g[r.key] = g[r.key] || []).push(r);
    });
    Object.keys(g).forEach(function (k) {
      var L = g[k].sort(function (a, b) { return a.__n.k < b.__n.k ? -1 : a.__n.k > b.__n.k ? 1 : 0; });
      var hl = L.filter(function (r) { return r.hieuLuc; }), cuoi = hl[hl.length - 1] || null;
      L.forEach(function (r, i) {
        r.nLan = L.length; r.thuTu = i + 1; r.cuoi = r === cuoi;
        var cb = [];
        if (!r.hieuLuc) cb.push('Trạng thái "' + r.tt + '" – không tính là lần nộp hiệu lực');
        if (L.length > 1 && r.ky) cb.push('Kỳ có ' + L.length + ' lần nộp' + (r.cuoi ? ' – đây là lần hiệu lực cuối' : r.hieuLuc ? ' – đã có lần nộp sau' : ''));
        if (r.cuoi && RE_CHO.test(r.tt)) cb.push('Lần cuối chưa có kết quả xử lý');
        if (r.ky && !cuoi) cb.push('Kỳ này chưa có lần nộp hợp lệ');
        r.canhBao = cb.join('; ');
      });
    });
    return g;
  }

  /* ---------- tên file ---------- */
  function slug(s, max) { return C.boDau(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max || 60).replace(/-+$/, ''); }
  function slugTK(code) { return slug(code, 30).toUpperCase() || 'KHAC'; }
  function slugKy(ky) {
    ky = String(ky || '').trim(); if (!ky) return '';
    var m;
    if ((m = ky.match(/^Q(\d)\/(\d{4})$/i))) return 'Q' + m[1] + '-' + m[2];
    if ((m = ky.match(/^(\d{1,2})\/(\d{4})$/))) return 'T' + C.pad(m[1]) + '-' + m[2];
    if ((m = ky.match(/^(\d{4})$/))) return 'Nam-' + m[1];
    return slug(ky, 30);
  }
  function tenGoc(r) {
    var p = [slugTK(r.tkCode)], k = slugKy(r.ky); if (k) p.push(k);
    p.push('Lan' + (r.lan || '1'));
    if (/bổ sung/i.test(r.loai)) p.push('BoSung' + (r.lanBS && r.lanBS !== '0' ? r.lanBS : ''));
    else if (/chính thức/i.test(r.loai)) p.push('ChinhThuc');
    else if (r.loai) p.push(slug(r.loai, 20).replace(/-/g, ''));
    p.push('nop-' + (r.__n.dmy || '').replace(/\//g, '-'));
    p.push(String(r.ma).split('-').pop());
    return p.join('_');
  }

  /* ---------- giao diện (Shadow DOM để không đụng CSS trang thuế) ---------- */
  function dateBox(id, label) {
    return '<div class="db" data-db="' + id + '" role="group" aria-label="' + label + '"><input data-p="d" inputmode="numeric" maxlength="2" placeholder="dd" aria-label="' + label + ': ngày">/' +
      '<input data-p="m" inputmode="numeric" maxlength="2" placeholder="mm" aria-label="' + label + ': tháng">/<input class="y" data-p="y" inputmode="numeric" maxlength="4" placeholder="yyyy" aria-label="' + label + ': năm"><input type="hidden" id="' + id + '"></div>';
  }
  var host = document.createElement('div'); host.id = 'qtt-tk-host';
  var W0 = Math.min(760, window.innerWidth - 24);
  host.style.cssText = 'position:fixed;z-index:2147483646;top:24px;left:' + Math.max(12, Math.round((window.innerWidth - W0) / 2)) + 'px;width:' + W0 + 'px;max-width:calc(100vw - 24px)';
  var root = host.attachShadow({ mode: 'open' });
  var CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.w{--bg:#FBF8F2;--bg2:#F7F2E8;--ink:#231E19;--mute:#6B6259;--line:#E3DACB;--line2:#D3C7B4;--amb:#B06A22;--amb-bg:#F6E7D3;--g:#2F7D4F;--g-bg:#E3F1E8;--red:#A63A2B;--red-bg:#F8E3DE;--blue:#2F5F8F;--blue-bg:#E2ECF5;' +
    'font:13.5px/1.5 "Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);border:1px solid var(--line2);border-radius:14px;box-shadow:0 18px 50px -12px rgba(35,30,25,.45);display:flex;flex-direction:column;max-height:calc(100vh - 48px);overflow:hidden}' +
    '.h{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:move;user-select:none;background:var(--bg2)}' +
    '.h img{width:32px;height:32px}.h .t{flex:1;line-height:1.25;min-width:0}.h .t b{font:600 14.5px "Lexend","Segoe UI",sans-serif;display:block}.h .t small{color:var(--mute);font-size:11.5px}' +
    '.ib{border:0;background:none;cursor:pointer;width:28px;height:28px;border-radius:7px;font-size:17px;color:var(--mute)}.ib:hover{background:var(--line)}' +
    '.b{padding:12px 14px;display:flex;flex-direction:column;gap:12px;overflow:auto}.min .b{display:none}.b>*{flex-shrink:0}' +
    '.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;white-space:nowrap}.ok{background:var(--g-bg);color:var(--g)}.bad{background:var(--red-bg);color:var(--red)}.info{background:var(--blue-bg);color:var(--blue)}.warn{background:var(--amb-bg);color:var(--amb)}.mut{background:var(--line);color:var(--mute)}' +
    '.lbl{font-size:12px;font-weight:600;color:var(--mute);display:block;margin-bottom:4px}.req{color:var(--red)}' +
    '.seg{display:inline-flex;border:1px solid var(--line2);border-radius:9px;padding:3px;background:var(--bg2);gap:3px}.seg button{border:0;background:none;padding:4px 12px;border-radius:7px;cursor:pointer;color:var(--mute);font:600 12.5px inherit;font-family:inherit}.seg button[aria-pressed=true]{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}' +
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    'input.in,select.in{width:100%;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:7px 9px;font:inherit;color:var(--ink);min-width:0}input.mono{font-family:Consolas,"IBM Plex Mono",monospace}' +
    '.chk{display:inline-flex;gap:7px;align-items:center;cursor:pointer}.chk input{width:15px;height:15px;accent-color:var(--amb);margin:0}' +
    '.btn{border:1px solid var(--line2);background:#fff;padding:8px 14px;border-radius:9px;cursor:pointer;font:600 13.5px inherit;font-family:inherit;color:var(--ink);display:inline-flex;gap:6px;align-items:center}.btn.pri{background:var(--amb);border-color:var(--amb);color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.sm{padding:5px 10px;font-size:12.5px}.btn.q{padding:4px 10px;font-size:12px;font-weight:600;color:var(--blue);border-color:var(--line2);background:var(--bg2)}' +
    '.hint{font-size:12px;color:var(--mute)}.msg{font-size:12.5px;padding:8px 10px;border-radius:8px}.msg.e{background:var(--red-bg);color:var(--red);font-weight:600}.msg.i{background:var(--blue-bg);color:var(--blue)}.msg.o{background:var(--g-bg);color:var(--g)}.msg.w{background:var(--amb-bg);color:#7a4a17;font-weight:600}' +
    '.tw{border:1px solid var(--line);border-radius:10px;max-height:340px;overflow:auto;background:#fff}table{border-collapse:collapse;width:100%;font-size:12px}th{position:sticky;top:0;background:var(--bg2);text-align:left;color:var(--mute);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line2);white-space:nowrap;z-index:1}td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}td.m{font-family:Consolas,monospace;font-size:11.5px;white-space:nowrap}td.nw{white-space:nowrap}tr.grp td{border-top:2px solid var(--line2)}tr.off td{color:#9a8f82}tr.off td .tkc{text-decoration:line-through}' +
    '.tkc{font-weight:600}.sub{display:block;font-size:11px;color:var(--mute)}' +
    '.out{border:1px solid var(--line);background:var(--bg2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:6px}' +
    '.bar{height:9px;background:var(--line);border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;width:0;background:var(--amb);transition:width .25s}' +
    '.stats{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--mute)}.stats b{color:var(--ink)}' +
    '.red{color:var(--red);font-weight:600;font-size:12.5px;display:flex;gap:6px;align-items:flex-start}' +
    '.db{display:flex;align-items:center;gap:1px;border:1px solid var(--line2);background:#fff;border-radius:8px;padding:4px 9px;font-family:Consolas,"IBM Plex Mono",monospace;color:var(--mute)}.db:focus-within{border-color:var(--amb);box-shadow:0 0 0 2px var(--amb-bg)}' +
    '.db input{border:0;outline:0;background:transparent;font:14px Consolas,"IBM Plex Mono",monospace;color:var(--ink);text-align:center;padding:3px 0;width:2.6ch}.db input.y{width:4.6ch}.db input::placeholder{color:#b9ad9c}.db input:focus{background:var(--amb-bg);border-radius:4px}' +
    '.scan{display:flex;gap:14px;align-items:center;border:1px solid var(--line);background:var(--bg2);border-radius:12px;padding:10px 14px}.scan .lup{width:56px;height:56px;flex:none;animation:lup 1.6s ease-in-out infinite;transform-origin:50% 60%}.scan-b{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}' +
    '@keyframes lup{0%,100%{transform:translate(0,0) rotate(-4deg)}25%{transform:translate(4px,-3px) rotate(3deg)}50%{transform:translate(0,-5px) rotate(-2deg)}75%{transform:translate(-4px,-2px) rotate(4deg)}}' +
    '@media (prefers-reduced-motion:reduce){.scan .lup{animation:none}}' +
    '.cap{border:1.5px solid var(--amb);background:#fff;border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:8px}.cap b{font-size:13.5px}.cap .capimg{height:46px;min-width:140px;border:1px solid var(--line2);border-radius:7px;background:#eee;object-fit:contain}.cap input.in{width:170px;font-size:16px;letter-spacing:2px}' +
    '.resume{border:1.5px solid var(--blue);background:var(--blue-bg);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column;gap:8px;color:var(--blue)}' +
    '[hidden]{display:none!important}';

  root.innerHTML = '<style>' + CSS + '</style>' +
    '<div class="w" id="w">' +
    '<div class="h" id="drag"><img src="' + DOM_ICON + '" alt=""><div class="t"><b>Tải tờ khai hàng loạt</b><small>Quản trị tử tế · bản ' + VER + '</small></div><span id="ses"><span class="pill mut">Đang kiểm tra…</span></span><button class="ib" id="bmin" title="Thu nhỏ">–</button><button class="ib" id="bx" title="Đóng">×</button></div>' +
    '<div class="b">' +
    '<div class="resume" id="resume" hidden><b id="resumet"></b><div class="row"><button class="btn pri sm" id="bresume">Điền sẵn khoảng ngày còn lại</button><button class="btn sm" id="bresumex">Bỏ qua</button></div></div>' +
    '<div id="form">' +
    '<span class="lbl">Ngày nộp hồ sơ <span class="req">*</span></span>' +
    '<div class="g2">' + dateBox('dtu', 'Từ ngày') + dateBox('dden', 'Đến ngày') + '</div>' +
    '<div class="row" style="margin-top:6px;gap:6px"><button class="btn q" data-q="thangtruoc">Tháng trước</button><button class="btn q" data-q="quytruoc">Quý trước</button><button class="btn q" data-q="namnay">Năm nay</button><button class="btn q" data-q="namtruoc">Năm trước</button></div>' +
    '<p class="hint" id="khint" style="margin:6px 0 0"></p>' +
    '<div style="margin-top:10px"><span class="lbl">Loại tờ khai</span><select class="in" id="ltk"><option value="">Tất cả</option></select></div>' +
    '<div class="out" style="margin-top:10px"><span class="lbl" style="margin:0">Nhận về (1 file ZIP)</span><span class="hint" style="margin:0">Mỗi hồ sơ: file XML tờ khai + file đính kèm (nếu có), xếp theo thư mục từng loại tờ khai. Kèm Bảng kê Excel (danh sách hồ sơ, gom theo tờ khai & kỳ).</span>' +
    '<div class="row" style="gap:8px"><span class="lbl" style="margin:0">Chế độ</span><div class="seg" id="mode"><button data-v="day" aria-pressed="true">Đầy đủ – kèm thông báo của CQT</button><button data-v="nhanh" aria-pressed="false">Tải nhanh – chỉ tờ khai</button></div></div>' +
    '<span class="hint" id="modeh" style="margin:0"></span><input type="checkbox" id="otb" checked hidden>' +
    '<label class="chk"><input type="checkbox" id="olast"> Chỉ giữ lần hiệu lực cuối của mỗi kỳ (các lần nộp trước và hồ sơ hủy vẫn liệt kê trong Excel)</label>' +
    '<label class="chk"><input type="checkbox" id="obell" checked> Gọi khi cần gõ mã: chuông + nhấp nháy tên tab + thông báo trên màn hình (làm việc khác trong lúc chờ)</label></div>' +
    '<p class="hint" style="margin:6px 0 0">Mẹo: mở trang thuế ở một <b>cửa sổ Chrome riêng</b> (không để thành tab ẩn phía sau) – Chrome làm chậm hẳn tab bị ẩn lâu.</p>' +
    '<div class="row" style="margin-top:12px"><button class="btn pri" id="bfind" disabled>Tra cứu &amp; tải</button><span class="hint" id="fmsg"></span></div>' +
    '</div>' +
    '<div class="cap" id="cap" hidden><b id="capt"></b>' +
    '<span class="hint">Cổng thuế yêu cầu mã xác nhận cho mỗi lần tra (tối đa 30 ngày/lần) và chỉ cho tải hồ sơ của lần tra gần nhất – nên công cụ tra xong tháng nào tải luôn tháng đó. Anh/chị đọc mã trong ảnh, gõ vào ô dưới, nhấn Enter. Công cụ không tự đọc mã.</span>' +
    '<div class="row"><img class="capimg" id="capimg" alt="Mã xác nhận của cổng thuế"><button class="btn sm" id="capnew" title="Lấy mã khác nếu khó đọc">↻ Đổi mã khác</button></div>' +
    '<div class="row"><input class="in mono" id="capin" maxlength="12" autocomplete="off" spellcheck="false" aria-label="Mã xác nhận"><button class="btn pri" id="capok">Tra &amp; tải tháng này</button><button class="btn sm" id="capskip">Bỏ qua tháng này</button><button class="btn sm" id="capstop">Dừng, lưu phần đã tải</button></div>' +
    '<p class="msg e" id="caperr" hidden></p></div>' +
    '<div class="scan" id="scan" hidden><img class="lup" src="' + DOM_LUP + '" alt="Đốm đang tra cứu"><div class="scan-b"><b id="scant">Đang đọc danh sách…</b><div class="bar"><i id="scanbar"></i></div><span class="hint" id="scanh"></span></div></div>' +
    '<div id="res" hidden style="display:flex;flex-direction:column;gap:10px">' +
    '<div class="row" id="sum"></div>' +
    '<p class="msg w" id="reswarn" hidden></p>' +
    '<div class="row"><span class="lbl" style="margin:0">Lọc nhanh</span><input class="in" id="flt" style="flex:1 1 200px" aria-label="Lọc nhanh" title="Lọc nhanh theo tờ khai, kỳ, mã hồ sơ, trạng thái"><div class="seg" id="srt"><button data-v="tk" aria-pressed="true">Theo tờ khai & kỳ</button><button data-v="ngay" aria-pressed="false">Theo ngày nộp</button></div></div>' +
    '<div class="tw"><table><thead><tr><th>Tờ khai</th><th>Kỳ</th><th>Loại · Lần</th><th>Ngày nộp</th><th>Trạng thái</th><th>Tải</th><th>Mã hồ sơ</th></tr></thead><tbody id="tb"></tbody></table></div>' +
    '</div>' +
    '<div id="prog" hidden style="display:flex;flex-direction:column;gap:8px">' +
    '<div class="row" style="justify-content:space-between"><b id="ptxt"></b><span class="hint" id="peta"></span></div><div class="bar"><i id="pbar"></i></div>' +
    '<div class="stats"><span>Thành công <b id="pok">0</b></span><span>Thông báo <b id="ptb">0</b></span><span>Lỗi <b id="perr">0</b></span><span id="pcur" style="font-family:Consolas,monospace"></span></div>' +
    '<p class="msg i" id="pnext" hidden></p>' +
    '<div class="red"><span>⚠</span><span>Không đóng tab, không tải lại trang và không đăng xuất cổng thuế khi đang tải.</span></div>' +
    '<div class="row"><button class="btn sm" id="bstop">Dừng, lưu phần đã tải</button></div></div>' +
    '<div id="msg" class="msg" hidden></div>' +
    '</div></div>';
  document.documentElement.appendChild(host);
  var $ = function (id) { return root.getElementById(id); };
  window.__qttTK = { show: function () { if (!document.documentElement.contains(host)) document.documentElement.appendChild(host); $('w').classList.remove('min'); }, log: LOG, state: S };

  function say(text, type) { var m = $('msg'); if (!text) { m.hidden = true; return; } m.className = 'msg ' + (type || 'i'); m.textContent = text; m.hidden = false; }

  /* kéo thả, thu nhỏ, đóng */
  (function () {
    var drag = $('drag'), on = false, sx, sy, ox, oy;
    drag.addEventListener('mousedown', function (e) { if (e.target.closest('button')) return; on = true; sx = e.clientX; sy = e.clientY; var r = host.getBoundingClientRect(); ox = r.left; oy = r.top; e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (!on) return; host.style.left = Math.max(0, Math.min(window.innerWidth - 80, ox + e.clientX - sx)) + 'px'; host.style.top = Math.max(0, Math.min(window.innerHeight - 40, oy + e.clientY - sy)) + 'px'; });
    window.addEventListener('mouseup', function () { on = false; });
    $('bmin').onclick = function () { $('w').classList.toggle('min'); };
    $('bx').onclick = function () {
      if (S.busy && !S.xacNhanDong) { S.xacNhanDong = 1; say('Đang chạy dở. Bấm × lần nữa để đóng (phần chưa lưu sẽ mất).', 'e'); return; }
      S.stop = true; host.remove(); window.__qttTK = null;
    };
  })();
  window.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L') && document.documentElement.contains(host)) { e.preventDefault(); C.saveBlob(new Blob([LOG.text()], { type: 'text/plain;charset=utf-8' }), 'nhat-ky-tai-to-khai.txt'); } });
  window.addEventListener('beforeunload', function (e) { if (S.busy) { luuTiepTuc(); e.preventDefault(); e.returnValue = ''; } });

  /* ---------- ô ngày dd / mm / yyyy ---------- */
  function partsOf(id) { var box = root.querySelector('[data-db="' + id + '"]'); return { d: box.querySelector('[data-p=d]'), m: box.querySelector('[data-p=m]'), y: box.querySelector('[data-p=y]'), box: box }; }
  function syncDate(id) { var P = partsOf(id), d = P.d.value, m = P.m.value, y = P.y.value; $(id).value = (d.length === 1 ? '0' + d : d) + '/' + (m.length === 1 ? '0' + m : m) + '/' + y; capNhatGoiY(); }
  function setDate(id, v) { var p = String(v || '').split('/'), P = partsOf(id); P.d.value = p[0] || ''; P.m.value = p[1] || ''; P.y.value = p[2] || ''; syncDate(id); }
  function wireDate(id, nextId) {
    var P = partsOf(id), order = [P.d, P.m, P.y];
    function go(i) { var el = order[i]; if (!el) { if (nextId) { var n = partsOf(nextId).d; n.focus(); n.select(); } return; } el.focus(); el.select(); }
    order.forEach(function (el, i) {
      var max = i === 2 ? 4 : 2;
      el.addEventListener('dblclick', function () { el.select(); });
      el.addEventListener('mouseup', function (e) { if (el.selectionStart === el.selectionEnd) { e.preventDefault(); el.select(); } });
      el.addEventListener('paste', function (e) {
        var t = (e.clipboardData || window.clipboardData).getData('text') || '', m = t.match(/(\d{1,2})\D(\d{1,2})\D(\d{4})/);
        if (m) { e.preventDefault(); setDate(id, C.pad(m[1]) + '/' + C.pad(m[2]) + '/' + m[3]); go(3); }
      });
      el.addEventListener('input', function () {
        var v = el.value.replace(/\D/g, '').slice(0, max); el.value = v;
        if (i === 0 && v.length === 1 && +v >= 4) { el.value = '0' + v; v = el.value; }
        if (i === 1 && v.length === 1 && +v >= 2) { el.value = '0' + v; v = el.value; }
        syncDate(id); if (v.length === max) go(i + 1);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && el.value === '' && i > 0) { e.preventDefault(); go(i - 1); }
        else if ((e.key === '/' || e.key === '-' || e.key === '.') && i < 2) { e.preventDefault(); if (el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } go(i + 1); }
        else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && i > 0) { e.preventDefault(); go(i - 1); }
        else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && i < 2) { e.preventDefault(); go(i + 1); }
      });
      el.addEventListener('blur', function () { if (i < 2 && el.value.length === 1) { el.value = '0' + el.value; syncDate(id); } });
    });
  }
  wireDate('dtu', 'dden'); wireDate('dden', null);

  function homNay() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function nhanh(q) {
    var t = homNay(), y = t.getFullYear(), m = t.getMonth(), a, b;
    if (q === 'thangtruoc') { a = new Date(y, m - 1, 1); b = new Date(y, m, 0); }
    else if (q === 'quytruoc') { var qq = Math.floor(m / 3) - 1, yy = y; if (qq < 0) { qq = 3; yy--; } a = new Date(yy, qq * 3, 1); b = new Date(yy, qq * 3 + 3, 0); }
    else if (q === 'namnay') { a = new Date(y, 0, 1); b = t; }
    else { a = new Date(y - 1, 0, 1); b = new Date(y - 1, 11, 31); }
    setDate('dtu', C.dateToDMY(a)); setDate('dden', C.dateToDMY(b));
  }
  [].forEach.call(root.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { if (!S.busy) nhanh(b.getAttribute('data-q')); }; });

  function kiemNgay() {
    var tu = $('dtu').value, den = $('dden').value;
    if (!C.validDMY(tu)) return { loi: 'Từ ngày chưa đúng (dd/mm/yyyy).' };
    if (!C.validDMY(den)) return { loi: 'Đến ngày chưa đúng (dd/mm/yyyy).' };
    if (d2(tu) > d2(den)) return { loi: 'Từ ngày đang lớn hơn Đến ngày.' };
    var thang = chiaThang(tu, den);
    if (thang.length > 36) return { loi: 'Khoảng ngày quá dài (tối đa 36 tháng mỗi lần tra).' };
    return { tu: tu, den: den, thang: thang };
  }
  function capNhatGoiY() {
    var el = $('khint'); if (!el) return;
    var k = kiemNgay();
    if (k.loi) { el.textContent = 'Lọc theo ngày nộp. Tờ khai quý thường nộp trong tháng đầu quý sau (VD: Q3 nộp trong tháng 10).'; return; }
    var n = k.thang.length, s = 'Sẽ tra và tải lần lượt ' + n + ' tháng → gõ ' + n + ' mã xác nhận (tháng nào tải xong mới hỏi mã tháng sau). Lọc theo ngày nộp (VD: tờ khai Q3 thường nộp trong tháng 10).';
    if (d2(k.tu) < d2(NGAY_DVC)) s += ' Lưu ý: hồ sơ nộp trước 01/07/2025 nằm ở tab "Thuế điện tử" của cổng, bản này chưa tải được phần đó.';
    el.textContent = s;
  }

  /* ---------- phiên ---------- */
  function hienPhien(ok) {
    S.logged = ok;
    $('ses').innerHTML = ok ? '<span class="pill ok">● Đã đăng nhập</span>' : '<span class="pill bad">Chưa đăng nhập</span>';
    $('bfind').disabled = !ok;
  }
  async function batDau() {
    nhanh('thangtruoc');
    try {
      await moTrangTraCuu(); hienPhien(true);
      var sel = $('ltk'); S.loaiTK.forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
      var nho = store('ltk'); if (nho) sel.value = nho;
    } catch (e) {
      hienPhien(false);
      LOG.loi('Mo trang tra cuu', e && e.message);
      say(e.kind === 'session' ? 'Chưa thấy đăng nhập cổng thuế. Anh/chị đăng nhập dichvucong.gdt.gov.vn (tài khoản doanh nghiệp) rồi bấm lại nút "Tải tờ khai" trên thanh dấu trang.' : 'Chưa mở được trang Tra cứu hồ sơ của cổng thuế: ' + (e.message || e) + '. Thử bấm lại nút sau ít phút.', 'e');
    }
    kiemTiepTuc();
  }

  /* ---------- hỏi mã xác nhận cho 1 tháng ---------- */
  function hoiMa(i, n, x, y, loi) {
    return new Promise(function (resolve, reject) {
      $('cap').hidden = false; $('capt').textContent = 'Tháng ' + i + '/' + n + ': ' + x + ' → ' + y + ' – gõ mã để tra và tải tháng này';
      $('w').classList.remove('min'); if (i > 1 && !loi) goiNguoiDung('Cần gõ mã xác nhận – tháng ' + x.slice(3) + ' (' + i + '/' + n + ')');
      $('caperr').hidden = !loi; $('caperr').textContent = loi || '';
      function xong() { thoiGoi(); $('cap').hidden = true; $('capnew').onclick = $('capok').onclick = $('capskip').onclick = $('capstop').onclick = $('capin').onkeydown = null; }
      function moi() {
        $('capin').value = '';
        var img = $('capimg');
        img.onerror = function () { $('caperr').hidden = false; $('caperr').textContent = 'Chưa tải được ảnh mã xác nhận. Bấm "Đổi mã khác" để thử lại.'; };
        img.src = BASE + 'getCaptcha?' + Date.now();
        setTimeout(function () { $('capin').focus(); }, 50);
      }
      $('capnew').onclick = moi;
      $('capok').onclick = function () { var v = $('capin').value.trim(); if (!v) { $('capin').focus(); return; } xong(); LOG.ghi('[MA] Nguoi dung nhap ma xac nhan cho thang ' + x + ' -> ' + y); resolve(v); };
      $('capin').onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); $('capok').click(); } };
      $('capskip').onclick = function () { xong(); LOG.ghi('[MA] Nguoi dung bo qua thang ' + x + ' -> ' + y); resolve(null); };
      $('capstop').onclick = function () { xong(); reject(new ApiError('stop', 0, 'Đã dừng')); };
      moi();
    });
  }

  function scan(on, title, pct, hint) {
    $('scan').hidden = !on; if (!on) return;
    $('scant').textContent = title || ''; $('scanbar').style.width = Math.max(3, Math.min(100, pct || 0)) + '%'; $('scanh').textContent = hint || '';
  }

  /* ---------- tra cứu ---------- */
  /* ==========================================================================
     TRA CỨU & TẢI THEO TỪNG THÁNG
     Kiểm chứng trên cổng thật 02/11/2026: lệnh tải hồ sơ chỉ nhận hồ sơ thuộc LẦN TRA GẦN NHẤT
     (hồ sơ tháng khác báo 500 "Hồ sơ truyền lên không hợp lệ") → tra xong tháng nào tải luôn tháng đó.
     ========================================================================== */
  var J = null;
  var RE_KHL = /không hợp lệ/i;
  function b64(s) { var bin = atob(String(s || '').replace(/\s/g, '')), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  function extOf(n, def) { var m = String(n || '').match(/\.([A-Za-z0-9]{1,5})$/); return m ? m[1].toLowerCase() : def; }
  function uniqueName(n) { var base = n.replace(/(\.[^.\/]+)$/, ''), ext = (n.match(/(\.[^.\/]+)$/) || [''])[0], out = n, i = 2; while (J.names[out]) out = base + '_' + (i++) + ext; J.names[out] = 1; return out; }
  function chu(el) { var w = el.ownerDocument.createTreeWalker(el, 4), a = [], n; while ((n = w.nextNode())) a.push(n.nodeValue); return clean(a.join(' ')); }
  // các thông báo trên trang chi tiết hồ sơ: [{id, ten, gio}]
  function docThongBao(html) {
    var d = new DOMParser().parseFromString(html, 'text/html'), out = [];
    [].slice.call(d.querySelectorAll('[onclick*="downloadThongBao"]')).forEach(function (a) {
      var id = a.getAttribute('data-id'); if (!id) return;
      var el = a, txt = '';
      for (var k = 0; k < 5 && el; k++) { el = el.parentElement; if (!el) break; txt = chu(el); if (/V\/v/i.test(txt)) break; }
      var ten = (txt.match(/V\/v:?\s*(.+?)(?=\s+\d{1,2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}|\s+Tải xuống|$)/i) || [])[1] || '';
      out.push({ id: id, ten: clean(ten), loai: a.getAttribute('data-loai-tbao') || '' });
    });
    return out;
  }
  function soSanh(a, b) {
    var x = C.boDau(a.tkCode).localeCompare(C.boDau(b.tkCode)); if (x) return x;
    var ka = kySort(a.ky), kb = kySort(b.ky); if (ka !== kb) return ka < kb ? -1 : 1;
    return a.__n.k < b.__n.k ? -1 : a.__n.k > b.__n.k ? 1 : 0;
  }
  function kySort(ky) {
    var m; ky = String(ky || '');
    if ((m = ky.match(/^Q(\d)\/(\d{4})$/i))) return m[2] + '-' + C.pad(+m[1] * 3) + 'q';
    if ((m = ky.match(/^(\d{1,2})\/(\d{4})$/))) return m[2] + '-' + C.pad(m[1]) + 'm';
    if ((m = ky.match(/^(\d{4})$/))) return m[1] + '-13';
    if ((m = ky.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) return m[3] + '-' + m[2] + 'd' + m[1];
    return 'zzzz' + ky;
  }

  // tải 1 hồ sơ (đã nằm trong lần tra gần nhất). Trả về {files:[[tên, bytes]], tb}
  async function taiMot(r) {
    r.__n = r.__n || ngayNop(r.ngay);
    var base = tenGoc(r), dir = slugTK(r.tkCode) + '/', kq = { files: [], tb: 0, tbLoi: [] };
    var j = await call(BASE + 'tchs/downloadhoso', { method: 'POST', json: { maHoSo: r.ma }, khongThuLai: RE_KHL });
    if (!j || !j.content) throw new ApiError('data', 200, (j && (j.error || j.message)) || 'Cổng không có nội dung file');
    var u8 = b64(j.content), parts = null;
    if (u8[0] === 0x50 && u8[1] === 0x4B) { try { parts = await C.unzip(u8); } catch (e) { parts = null; } }
    if (parts && parts.length) {
      parts.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p) {
        var nm = p.name.split('/').pop(), m = nm.match(/_(\d+)\.([A-Za-z0-9]+)$/), so = m ? +m[1] : 0, ext = extOf(nm, 'bin');
        kq.files.push([dir + (so === 0 && ext === 'xml' ? base + '.xml' : base + '_DinhKem' + (so || '') + '.' + ext), p.bytes]);
      });
    } else kq.files.push([dir + base + '.' + extOf(j.fileName, u8[0] === 0x50 ? 'zip' : 'xml'), u8]);
    if (J.tb) {
      var ds = docThongBao(await call(BASE + 'tchs/files/detail/' + encodeURIComponent(r.ma) + '?loai=', {}));
      LOG.ghi('[TB] ' + r.ma + ': ' + ds.length + ' thong bao');
      for (var i = 0; i < ds.length; i++) {
        var t = ds[i];
        try {
          var jt = await call(BASE + 'tchs/downloadthongbao', { method: 'POST', json: { idTbao: t.id, loaiTBao: t.loai }, khongThuLai: RE_KHL });
          if (!jt || !jt.content) throw new ApiError('data', 200, 'Không có nội dung thông báo');
          kq.files.push([dir + base + '_TB' + (i + 1) + (t.ten ? '_' + slug(t.ten, 50) : '') + '.' + extOf(jt.fileName, jt.fileType && /^[a-z]{2,5}$/i.test(jt.fileType) ? jt.fileType.toLowerCase() : 'xml'), b64(jt.content)]); kq.tb++;
        } catch (e) {
          if (e.kind === 'session' || e.kind === 'stop') throw e;
          kq.tbLoi.push('Thông báo ' + (i + 1) + (t.ten ? ' (' + t.ten + ')' : '') + ': ' + (e.message || e));
        }
      }
    }
    return kq;
  }

  /* ---------- gọi người dùng khi cần gõ mã (chuông, nhấp nháy tab, thông báo hệ thống) ---------- */
  var G = { t: null, title: '', ac: null, n: null };
  function chuong() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      G.ac = G.ac || new AC(); var ac = G.ac; if (ac.state === 'suspended') ac.resume();
      [[880, 0], [1175, 0.18], [880, 0.5], [1175, 0.68]].forEach(function (b) {
        var o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + b[1];
        o.type = 'sine'; o.frequency.value = b[0]; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + 0.18);
      });
    } catch (e) { }
  }
  function xinQuyenThongBao() { try { var AC = window.AudioContext || window.webkitAudioContext; if (AC && !G.ac && $('obell').checked) G.ac = new AC(); } catch (e) { } try { if ($('obell').checked && window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { } }
  function goiNguoiDung(txt) {
    if (!$('obell').checked) return;
    thoiGoi(); chuong(); G.lap = setInterval(chuong, 30000);
    G.title = document.title; var bat = false;
    G.t = setInterval(function () { bat = !bat; document.title = bat ? '🔔 Cần gõ mã xác nhận' : G.title; }, 900);
    try { if (window.Notification && Notification.permission === 'granted' && (document.hidden || !document.hasFocus())) { G.n = new Notification('Tải tờ khai – ' + txt, { body: 'Bấm vào đây để quay lại trang thuế và gõ mã.', tag: 'qtt-tk', requireInteraction: true }); G.n.onclick = function () { window.focus(); try { $('capin').focus(); } catch (e) { } G.n.close(); }; } } catch (e) { }
    LOG.ghi('[GOI] ' + txt);
  }
  function thoiGoi() { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title || document.title; } if (G.lap) { clearInterval(G.lap); G.lap = null; } if (G.n) { try { G.n.close(); } catch (e) { } G.n = null; } }
  window.addEventListener('focus', function () { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title; } });

  function progress(thang, n, i, m) {
    $('ptxt').textContent = 'Tháng ' + thang + ': đang tải ' + Math.min(i + 1, m) + '/' + m + ' hồ sơ';
    $('pbar').style.width = (m ? i / m * 100 : 100) + '%';
    $('pok').textContent = J.ok; $('ptb').textContent = J.tbOk; $('perr').textContent = J.err;
    var ds = J.dur.slice().sort(function (a, b) { return a - b; }), per = ds.length ? ds[Math.floor(ds.length / 2)] / 1000 : (S.gap / 1000 + 0.4) * (J.tb ? 4 : 1), rem = Math.ceil((m - i) * per);
    var thoi = rem < 90 ? rem + ' giây' : Math.ceil(rem / 60) + ' phút';
    $('peta').textContent = i < m ? 'Tháng này còn khoảng ' + thoi : '';
    $('pnext').hidden = !(J.conThang > 0 && i < m);
    $('pnext').textContent = 'Còn ' + J.conThang + ' tháng nữa. Tháng sau cần gõ mã sau khoảng ' + thoi + (($('obell').checked) ? ' – công cụ sẽ đổ chuông gọi anh/chị.' : '.');
  }

  // tải các hồ sơ của tháng vừa tra. pageOf: mã → số trang (để đọc lại trang nếu cổng báo "không hợp lệ")
  async function taiThang(nhan, rows, x, y, pageOf) {
    var list = (J.last ? rows.filter(function (r) { return !RE_KHONG_HL.test(r.tt); }) : rows.slice()).sort(soSanh); // "chỉ lần cuối": hồ sơ hủy/không chấp nhận khỏi tải
    $('cap').hidden = true; scan(false); $('prog').hidden = false;
    for (var i = 0; i < list.length; i++) {
      var r = list[i], t0 = Date.now();
      progress(nhan, 0, i, list.length); $('pcur').textContent = r.tkCode + ' ' + (r.ky || '') + ' · ' + r.ma;
      var thu = 0;
      for (;;) {
        try {
          var kq = await taiMot(r);
          J.kq[r.ma] = { ok: true, files: kq.files.map(function (f) { return f[0].split('/').pop(); }), tb: kq.tb, tbLoi: kq.tbLoi, data: kq.files };
          J.ok++; J.tbOk += kq.tb; kq.tbLoi.forEach(function (m) { J.errors.push([r.ma, m]); });
          LOG.ghi('[TAI] OK ' + r.ma + ' -> ' + kq.files.length + ' file, ' + kq.tb + ' thong bao');
          break;
        } catch (e) {
          if (e.kind === 'session' || e.kind === 'stop') throw e;
          // cổng báo "không hợp lệ": đọc lại trang chứa hồ sơ (cùng điều kiện, không gửi mã) rồi thử lại 1 lần
          if (RE_KHL.test(e.message || '') && thu === 0) {
            thu++; LOG.ghi('[TAI] ' + r.ma + ' bao khong hop le -> doc lai trang ' + (pageOf[r.ma] || 1) + ' roi thu lai');
            try { await call(qs(x, y, '', '&page=' + (pageOf[r.ma] || 1) + '&size=' + SIZE), { html: true }); } catch (e2) { if (e2.kind === 'session' || e2.kind === 'stop') throw e2; }
            continue;
          }
          J.err++; J.kq[r.ma] = { ok: false, loi: e.message || String(e) }; J.errors.push([r.ma, r.tkCode + ' ' + (r.ky || '') + ': ' + (e.message || e)]);
          LOG.loi('Tai ' + r.ma, e && e.message);
          break;
        }
      }
      J.dur.push(Date.now() - t0); if (J.dur.length > 40) J.dur.shift();
    }
    progress(nhan, 0, list.length, list.length);
    $('prog').hidden = true;
  }

  async function search() {
    var k = kiemNgay(); if (k.loi) { say(k.loi, 'e'); return; }
    S.maTK = $('ltk').value; store('ltk', S.maTK);
    S.busy = true; S.stop = false; S.xacNhanDong = 0; say(''); $('res').hidden = true; $('form').hidden = true; $('resume').hidden = true;
    S.tu = k.tu; S.den = k.den; S.rows = []; S.mst = '';
    xinQuyenThongBao();
    J = { ok: 0, err: 0, tbOk: 0, names: {}, errors: [], kq: {}, dur: [], tb: $('otb').checked, last: $('olast').checked, boQua: [], canhBao: [], xongDen: null, dangThang: null };
    store('otb', J.tb ? '1' : '0'); store('olast', J.last ? '1' : '0');
    LOG.phanCach('Tra cứu & tải ' + k.tu + ' -> ' + k.den + (S.maTK ? ' | to khai ' + S.maTK : '') + (J.tb ? ' | kem thong bao' : '') + (J.last ? ' | chi lan cuoi' : ''));
    var map = {}, n = k.thang.length, ketThuc = 'xong';
    try {
      for (var i = 0; i < n; i++) {
        var x = k.thang[i][0], y = k.thang[i][1], loi = null, xong = false;
        J.dangThang = [x, y];
        while (!xong) {
          scan(false);
          var ma = await hoiMa(i + 1, n, x, y, loi);
          if (ma === null) { J.boQua.push(x + ' → ' + y); break; }
          scan(true, 'Tháng ' + (i + 1) + '/' + n + ': đang tra ' + x + ' → ' + y, 30, 'Đã tải ' + J.ok + ' hồ sơ');
          var html;
          try { html = await call(qs(x, y, ma), { html: true, once: true }); }
          catch (e1) {
            if (e1.kind === 'reject' || e1.kind === 'busy' || e1.kind === 'server' || e1.kind === 'network' || e1.kind === 'data') {
              LOG.ghi('[TRA] Lan tra bi cong tu choi: ' + e1.message);
              loi = (e1.kind === 'reject' ? 'Cổng thuế báo: "' + String(e1.message || '').slice(0, 140) + '"' : 'Cổng thuế chưa phản hồi (' + e1.message + ')') + '. Anh/chị gõ mã mới để tra lại tháng này.';
              continue;
            }
            throw e1;
          }
          var kq = docKetQua(html);
          if (!kq.ok) {
            LOG.ghi('[TRA] Cong khong tra bang ket qua: ' + kq.msg);
            loi = 'Cổng thuế chưa trả kết quả' + (kq.msg ? ': "' + kq.msg.slice(0, 140) + '"' : '') + '. Thường do gõ sai mã – anh/chị gõ lại mã mới.';
            continue;
          }
          LOG.ghi('[TRA] ' + x + ' -> ' + y + ': tong ' + kq.total + ' ho so, trang 1 co ' + kq.rows.length);
          var got = kq.rows.slice(), pageOf = {};
          got.forEach(function (r) { pageOf[r.ma] = 0; });
          if (kq.total > got.length) {
            got = []; var sp = Math.ceil(kq.total / SIZE);
            for (var p = 1; p <= sp; p++) {
              scan(true, 'Tháng ' + (i + 1) + '/' + n + ': đọc trang ' + p + '/' + sp, 30 + 60 * p / sp, '');
              var kp = docKetQua(await call(qs(x, y, '', '&page=' + p + '&size=' + SIZE), { html: true }));
              if (!kp.ok) { LOG.ghi('[TRA] Trang ' + p + ' khong doc duoc: ' + kp.msg); J.canhBao.push('Tháng ' + x + ': trang ' + p + ' chưa đọc được'); break; }
              kp.rows.forEach(function (r) { pageOf[r.ma] = p; });
              got = got.concat(kp.rows);
            }
            if (got.length < kq.total) J.canhBao.push('Tháng ' + x + ' → ' + y + ': cổng báo ' + kq.total + ' hồ sơ, đọc được ' + got.length);
          }
          var moi = got.filter(function (r) { return !map[r.ma]; });
          moi.forEach(function (r) { map[r.ma] = r; r.__n = ngayNop(r.ngay); r.thang = x; S.rows.push(r); });
          // pageOf = 0: hồ sơ nằm ở trang 1 mặc định (10 dòng) → đọc lại trang theo cỡ 10
          var po = {}; moi.forEach(function (r) { po[r.ma] = pageOf[r.ma] || 1; });
          J.conThang = n - i - 1;
          if (moi.length) await taiThang((i + 1) + '/' + n + ' (' + x.slice(3) + ')', moi, x, y, po);
          J.xongDen = y;
          xong = true;
        }
      }
    } catch (e) {
      scan(false); $('cap').hidden = true; $('prog').hidden = true;
      if (e.kind === 'stop') ketThuc = 'dung';
      else if (e.kind === 'session') { ketThuc = 'phien'; hienPhien(false); }
      else { ketThuc = 'loi'; LOG.loi('Tra cuu & tai', e && e.message); J.loiChung = e.message || String(e); }
    }
    scan(false);
    gomNhom(S.rows);
    var dem = {}; S.rows.forEach(function (r) { if (r.mstNop && (!r.mstNopThay || r.mstNopThay === 'null')) dem[r.mstNop] = (dem[r.mstNop] || 0) + 1; });
    S.mst = Object.keys(dem).sort(function (a, b) { return dem[b] - dem[a]; })[0] || '';
    await finish(ketThuc);
  }

  /* ---------- bảng kết quả (để xem lại sau khi tải) ---------- */
  function visible() {
    var f = C.boDau(S.filter || '').toLowerCase().trim();
    var L = S.rows.filter(function (r) { return !f || C.boDau([r.tk, r.ky, r.ma, r.tt, r.loai, r.ngay].join(' ')).toLowerCase().indexOf(f) >= 0; });
    if (S.sort === 'ngay') L.sort(function (a, b) { return a.__n.k < b.__n.k ? 1 : a.__n.k > b.__n.k ? -1 : 0; });
    else L.sort(function (a, b) { var x = soSanh(a, b); if (x) return x; return a.key < b.key ? -1 : a.key > b.key ? 1 : 0; });
    return L;
  }
  function trongZip(r) { var k = J && J.kq[r.ma]; if (!k || !k.ok) return false; return !J.last || (r.ky ? r.cuoi : r.hieuLuc); }
  function taiTxt(r) {
    var k = J && J.kq[r.ma];
    if (!k) return J && J.last && RE_KHONG_HL.test(r.tt) ? ['mut', 'Bỏ (hủy)'] : ['mut', 'Chưa tải'];
    if (!k.ok) return ['bad', 'Lỗi'];
    if (!trongZip(r)) return ['mut', 'Bỏ (lần trước)'];
    return ['ok', 'Đã tải' + (k.tb ? ' + ' + k.tb + ' TB' : '')];
  }
  function render() {
    var L = visible(), html = [], prev = null;
    L.forEach(function (r) {
      var grp = S.sort === 'tk' && prev !== null && prev !== r.key; prev = r.key;
      var tag = r.nLan > 1 && r.ky ? ' <span class="pill ' + (r.cuoi ? 'ok' : 'mut') + '">' + (r.cuoi ? 'Lần hiệu lực cuối' : 'Lần ' + r.thuTu + '/' + r.nLan) + '</span>' : '';
      var ttCls = !r.hieuLuc ? 'bad' : RE_CHO.test(r.tt) ? 'warn' : 'ok', tt = taiTxt(r), k = J && J.kq[r.ma];
      html.push('<tr class="' + (grp ? 'grp ' : '') + (r.hieuLuc ? '' : 'off') + '" title="' + esc(r.tthc) + '">' +
        '<td><span class="tkc">' + esc(r.tkCode) + '</span>' + tag + '<span class="sub">' + esc(r.tk.split(' - ').slice(1).join(' - ').slice(0, 70)) + '</span></td>' +
        '<td class="nw">' + esc(r.ky || '–') + '</td>' +
        '<td class="nw">' + esc(r.loai) + (r.lan ? ' · lần ' + esc(r.lan) : '') + (r.lanBS && r.lanBS !== '0' ? '<span class="sub">bổ sung lần ' + esc(r.lanBS) + '</span>' : '') + '</td>' +
        '<td class="nw">' + esc(r.__n.dmy) + '<span class="sub">' + esc(r.__n.gio) + '</span></td>' +
        '<td><span class="pill ' + ttCls + '">' + esc(r.tt || '–') + '</span></td>' +
        '<td class="nw"><span class="pill ' + tt[0] + '"' + (k && !k.ok ? ' title="' + esc(k.loi) + '"' : '') + '>' + esc(tt[1]) + '</span></td>' +
        '<td class="m">' + esc(r.ma) + '</td></tr>');
    });
    $('tb').innerHTML = html.join('') || '<tr><td colspan="7" class="hint" style="text-align:center;padding:16px">Không có hồ sơ phù hợp.</td></tr>';
  }
  $('flt').oninput = function () { S.filter = $('flt').value; render(); };
  [].forEach.call(root.querySelectorAll('#srt button'), function (b) { b.onclick = function () { S.sort = b.getAttribute('data-v'); [].forEach.call(root.querySelectorAll('#srt button'), function (x) { x.setAttribute('aria-pressed', x === b); }); render(); }; });
  $('bfind').onclick = function () { if (!S.busy) search(); };
  $('bstop').onclick = function () { S.stop = true; LOG.ghi('[TAI] Nguoi dung bam Dung lai'); };
  function datMode(v) {
    $('otb').checked = v !== 'nhanh';
    [].forEach.call(root.querySelectorAll('#mode button'), function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-v') === v); });
    $('modeh').textContent = v === 'nhanh' ? 'Chỉ tải tờ khai + file đính kèm, khoảng 1,5 giây/hồ sơ – thời gian chờ giữa 2 lần gõ mã ngắn nhất.' : 'Tờ khai + file đính kèm + thông báo của cơ quan thuế (tiếp nhận, chấp nhận…), khoảng 5 giây/hồ sơ.';
  }
  [].forEach.call(root.querySelectorAll('#mode button'), function (b) { b.onclick = function () { if (!S.busy) datMode(b.getAttribute('data-v')); }; });
  (function () { var a = store('otb'), b = store('olast'), c = store('obell'); datMode(a === '0' ? 'nhanh' : 'day'); if (b !== null) $('olast').checked = b === '1'; if (c !== null) $('obell').checked = c === '1'; })();
  $('obell').onchange = function () { store('obell', $('obell').checked ? '1' : '0'); if ($('obell').checked) { xinQuyenThongBao(); chuong(); } };

  /* ---------- bảng kê Excel ---------- */
  function dongBangKe() {
    var ds = S.rows.slice().sort(soSanh);
    var s1 = {
      name: 'Danh sách hồ sơ',
      pre: ['DANH SÁCH HỒ SƠ ĐÃ NỘP TRÊN CỔNG DỊCH VỤ CÔNG THUẾ', 'Ngày nộp từ ' + S.tu + ' đến ' + S.den + (S.mst ? ' · MST ' + S.mst : '') + ' · Lập lúc ' + C.dateToDMY(new Date()) + ' bằng công cụ Tải tờ khai hàng loạt (Quản trị tử tế)', ''],
      cols: [{ h: 'STT', t: 'i', w: 6 }, { h: 'Tờ khai', w: 16 }, { h: 'Kỳ tính thuế', w: 11 }, { h: 'Loại tờ khai', w: 12 }, { h: 'Lần nộp', t: 'i', w: 8 }, { h: 'Lần nộp bổ sung', w: 9 }, { h: 'Ngày nộp', t: 'd', w: 12 }, { h: 'Giờ nộp', w: 8 },
        { h: 'Trạng thái', w: 18 }, { h: 'Số lần nộp cùng kỳ', t: 'i', w: 9 }, { h: 'Lần hiệu lực cuối', w: 10 }, { h: 'Cảnh báo', w: 40 }, { h: 'Mã hồ sơ', w: 24 }, { h: 'Tên tờ khai đầy đủ', w: 40 }, { h: 'Thủ tục hành chính', w: 40 }, { h: 'Cơ quan thuế tiếp nhận', w: 30 },
        { h: 'Kết quả tải', w: 22 }, { h: 'Số thông báo', t: 'i', w: 9 }, { h: 'File trong ZIP', w: 50 }],
      rows: []
    };
    ds.forEach(function (r, i) {
      var k = J.kq[r.ma], kt = !k ? (J.last && RE_KHONG_HL.test(r.tt) ? 'Không tải (hồ sơ hủy / không chấp nhận)' : 'Chưa tải') : !k.ok ? 'Lỗi: ' + k.loi : trongZip(r) ? 'Đã tải' : 'Không đưa vào ZIP (không phải lần hiệu lực cuối)';
      s1.rows.push([i + 1, r.tkCode, r.ky, r.loai, r.lan, r.lanBS, r.__n.dmy, r.__n.gio, r.tt, r.ky ? r.nLan : '', r.ky && r.nLan > 1 ? (r.cuoi ? 'Có' : '') : '', r.canhBao, r.ma, r.tk, r.tthc, r.cqt, kt, k && k.ok ? k.tb : '', k && k.ok && trongZip(r) ? k.files.join('; ') : '']);
    });
    var g = {}; ds.forEach(function (r) { if (r.ky) (g[r.key] = g[r.key] || []).push(r); });
    var s2 = {
      name: 'Theo tờ khai & kỳ',
      pre: ['GOM THEO TỜ KHAI VÀ KỲ TÍNH THUẾ', 'Lần hiệu lực cuối = hồ sơ nộp sau cùng của cùng tờ khai + kỳ, không tính hồ sơ đã hủy / không được chấp nhận.', ''],
      cols: [{ h: 'Tờ khai', w: 16 }, { h: 'Kỳ tính thuế', w: 11 }, { h: 'Số lần nộp', t: 'i', w: 9 }, { h: 'Lần hiệu lực cuối – ngày nộp', t: 'd', w: 14 }, { h: 'Lần hiệu lực cuối – loại, lần', w: 18 }, { h: 'Lần hiệu lực cuối – trạng thái', w: 20 }, { h: 'Lần hiệu lực cuối – mã hồ sơ', w: 24 }, { h: 'Các lần nộp (theo thứ tự)', w: 70 }, { h: 'Cảnh báo', w: 36 }],
      rows: []
    };
    Object.keys(g).forEach(function (k) {
      var L = g[k], c = L.filter(function (r) { return r.cuoi; })[0];
      var cb = []; if (!c) cb.push('Chưa có lần nộp hợp lệ'); else if (RE_CHO.test(c.tt)) cb.push('Lần cuối chưa có kết quả xử lý');
      if (L.some(function (r) { return !r.hieuLuc; })) cb.push('Có hồ sơ hủy / không chấp nhận');
      s2.rows.push([L[0].tkCode, L[0].ky, L.length, c ? c.__n.dmy : '', c ? c.loai + ' · lần ' + c.lan + (c.lanBS && c.lanBS !== '0' ? ' (bổ sung ' + c.lanBS + ')' : '') : '', c ? c.tt : '', c ? c.ma : '',
        L.map(function (r, i) { return (i + 1) + ') ' + r.__n.dmy + ' ' + r.loai + ' lần ' + r.lan + ' – ' + r.tt; }).join('\n'), cb.join('; ')]);
    });
    return [s1, s2];
  }

  /* ---------- đóng gói ZIP ---------- */
  function cong(dmy, n) { var d = C.dmyToDate(dmy); return C.dateToDMY(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  async function finish(ketThuc) {
    thoiGoi(); $('prog').hidden = true; $('cap').hidden = true;
    var conTu = ketThuc === 'xong' ? null : (J.dangThang ? J.dangThang[0] : null);
    if (conTu) { store('resume', JSON.stringify({ t: Date.now(), tu: conTu, den: S.den, maTK: S.maTK })); LOG.ghi('[TIEP TUC] Con lai tu ' + conTu + ' den ' + S.den); }
    else store('resume', null);
    if (!S.rows.length && !J.ok) {
      S.busy = false; $('form').hidden = false; $('bfind').disabled = !S.logged;
      if (ketThuc === 'phien') say('Cổng thuế đã hết phiên đăng nhập. Anh/chị đăng nhập lại rồi bấm nút "Tải tờ khai" để tra lại.', 'e');
      else if (ketThuc === 'dung') say('Đã dừng.', 'i');
      else if (ketThuc === 'loi') say('Tra cứu bị gián đoạn: ' + J.loiChung + '. Anh/chị thử lại sau ít phút.', 'e');
      else say('Không có hồ sơ nào nộp trong khoảng ngày này' + (S.maTK ? ' với loại tờ khai đã chọn' : '') + (J.boQua.length ? ' (đã bỏ qua ' + J.boQua.length + ' tháng)' : '') + '.', 'i');
      return;
    }
    say('Đang đóng gói file ZIP…', 'i');
    var nBo = 0;
    try {
      var z = new C.ZipWriter(), nm = (S.mst ? S.mst + '_' : '') + S.tu.replace(/\//g, '') + '-' + (ketThuc === 'xong' ? S.den : (J.xongDen || S.tu)).replace(/\//g, '');
      S.rows.forEach(function (r) { var k = J.kq[r.ma]; if (k && k.ok) { if (trongZip(r)) k.data.forEach(function (f) { z.add(uniqueName(f[0]), f[1]); }); else nBo++; } });
      try { z.add('Bang-ke-to-khai.xlsx', await (await C.xlsxBlob(dongBangKe())).arrayBuffer(), { store: true }); }
      catch (e) { LOG.loi('Lap bang ke Excel', e && e.message); }
      var ghi = [];
      if (J.errors.length) ghi.push('Các hồ sơ / thông báo tải bị lỗi (' + J.errors.length + '):\r\n' + J.errors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.boQua.length) ghi.push('Các tháng đã bỏ qua (chưa tra): ' + J.boQua.join(', '));
      if (conTu) ghi.push('Chưa tra / chưa tải xong: từ ' + conTu + ' đến ' + S.den + ' – bấm nút "Tải tờ khai" → "Điền sẵn khoảng ngày còn lại".');
      if (J.canhBao.length) ghi.push('Lưu ý khi đọc danh sách:\r\n' + J.canhBao.join('\r\n'));
      if (ghi.length) z.add('HS-chua-tai-duoc.txt', '﻿' + ghi.join('\r\n\r\n') + '\r\n');
      z.add('danh-sach.json', JSON.stringify({ congCu: 'tai-to-khai', ver: VER, mst: S.mst, tu: S.tu, den: S.den, rows: S.rows.map(function (r) { var k = J.kq[r.ma]; return { ma: r.ma, tk: r.tk, ky: r.ky, loai: r.loai, lan: r.lan, lanBS: r.lanBS, ngay: r.ngay, tt: r.tt, cuoi: r.cuoi, nLan: r.nLan, tai: k ? { ok: k.ok, loi: k.loi, files: k.files, tb: k.tb } : null }; }) }, null, 1));
      LOG.ghi('[XONG] ' + ketThuc + ' | ' + J.ok + ' ho so OK, ' + J.tbOk + ' thong bao, ' + J.err + ' loi, ' + nBo + ' bo khoi ZIP (lan truoc)');
      z.add('nhat-ky.txt', LOG.text());
      C.saveBlob(await z.blob(), 'ToKhai_' + nm + (conTu ? '_chua-xong' : '') + '.zip');
      var dau = ketThuc === 'xong' ? 'Xong: ' : ketThuc === 'phien' ? 'Cổng thuế hết phiên đăng nhập – đã lưu phần đã tải: ' : ketThuc === 'dung' ? 'Đã dừng – đã lưu phần đã tải: ' : 'Bị gián đoạn (' + J.loiChung + ') – đã lưu phần đã tải: ';
      say(dau + J.ok + ' hồ sơ' + (J.tbOk ? ', ' + J.tbOk + ' thông báo' : '') + (nBo ? ' (' + nBo + ' lần nộp trước không đưa vào ZIP, vẫn có trong Excel)' : '') + (J.err ? ', ' + J.err + ' hồ sơ lỗi (xem HS-chua-tai-duoc.txt)' : '') + '. File ZIP đã lưu vào thư mục Tải về của trình duyệt.' + (conTu ? ' Còn từ ' + conTu + ' đến ' + S.den + ': ' + (ketThuc === 'phien' ? 'đăng nhập lại, ' : '') + 'bấm nút "Tải tờ khai" để tải tiếp.' : ''), ketThuc === 'xong' && !J.err ? 'o' : ketThuc === 'xong' ? 'w' : 'e');
    } catch (e) { LOG.loi('Dong goi ZIP', e && e.message); say('Không đóng gói được file ZIP: ' + (e.message || e), 'e'); }
    var nNhieu = 0, seen = {}; S.rows.forEach(function (r) { if (r.nLan > 1 && r.ky && !seen[r.key]) { seen[r.key] = 1; nNhieu++; } });
    var nHuy = S.rows.filter(function (r) { return !r.hieuLuc; }).length;
    $('sum').innerHTML = '<span>Tìm thấy</span><span class="pill info">' + S.rows.length + ' hồ sơ</span><span class="pill ok">Đã tải ' + J.ok + '</span>' + (J.err ? '<span class="pill bad">Lỗi ' + J.err + '</span>' : '') + (nNhieu ? '<span class="pill warn">' + nNhieu + ' kỳ nộp nhiều lần</span>' : '') + (nHuy ? '<span class="pill bad">' + nHuy + ' hủy / không chấp nhận</span>' : '');
    var w = []; if (J.boQua.length) w.push('Đã bỏ qua ' + J.boQua.length + ' tháng: ' + J.boQua.join(', ') + '.'); J.canhBao.forEach(function (c) { w.push(c + '.'); });
    $('reswarn').hidden = !w.length; $('reswarn').textContent = w.join(' ');
    S.busy = false; $('form').hidden = false; $('bfind').disabled = !S.logged; $('res').hidden = !S.rows.length; render();
    if (conTu) kiemTiepTuc();
  }

  /* ---------- tải tiếp khoảng ngày còn lại (sau khi hết phiên / dừng) ---------- */
  function kiemTiepTuc() {
    var raw = store('resume'); if (!raw) return;
    var R; try { R = JSON.parse(raw); } catch (e) { store('resume', null); return; }
    if (!R || !R.tu || Date.now() - R.t > 3 * 86400000) { store('resume', null); return; }
    var d = new Date(R.t);
    $('resumet').textContent = 'Lần trước dừng lúc ' + C.pad(d.getHours()) + ':' + C.pad(d.getMinutes()) + ' ' + C.dateToDMY(d) + ', còn khoảng ngày nộp ' + R.tu + ' → ' + R.den + ' chưa tải xong.';
    $('resume').hidden = false;
    $('bresumex').onclick = function () { store('resume', null); $('resume').hidden = true; };
    $('bresume').onclick = function () { setDate('dtu', R.tu); setDate('dden', R.den); if (R.maTK) $('ltk').value = R.maTK; $('resume').hidden = true; say('Đã điền khoảng ngày còn lại. Bấm "Tra cứu & tải" để tiếp tục.', 'i'); };
  }

  batDau();
})();
