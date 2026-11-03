/* ==========================================================================
   TK-PANEL – bảng điều khiển "Tải tờ khai hàng loạt" chạy trên dichvucong.gdt.gov.vn
   Quản trị tử tế · quantritute.com
   - Dùng phiên đăng nhập sẵn có của trình duyệt. Không hỏi, không lưu mật khẩu.
   - Chỉ gọi tới chính trang dịch vụ công, đúng các lệnh tra cứu / tải mà trang "Tra cứu hồ sơ" đang dùng.
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

  var S = { busy: false, stop: false, gap: 1200, okRun: 0, last: 0, rows: [], sel: {}, filter: '', sort: 'tk', token: '', loaiTK: [], loaiTKMap: {}, mst: '', logged: null };

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

  /* ---------- gọi trang dịch vụ công ----------
     Giãn nhịp giữa các lệnh (mặc định 1,2 giây), trang dịch vụ công báo 429 thì giãn thêm và chờ.
     Hết phiên: trang dịch vụ công chuyển về trang đăng nhập → báo 'session'.
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
      if (method === 'POST') { hh['Content-Type'] = opt.form ? 'application/x-www-form-urlencoded' : 'application/json'; hh['X-XSRF-TOKEN'] = csrf(); hh['Accept'] = 'application/json, text/javascript, */*; q=0.01'; hh['X-Requested-With'] = 'XMLHttpRequest'; }
      var ac = window.AbortController ? new AbortController() : null, hen = ac ? setTimeout(function () { ac.abort(); }, 45000) : 0;
      try {
        r = await fetch(path, { method: method, headers: hh, credentials: 'same-origin', body: opt.form ? opt.form : opt.json ? JSON.stringify(opt.json) : undefined, signal: ac ? ac.signal : undefined });
        text = await r.text();
      } catch (e) {
        clearTimeout(hen);
        var treo = e && e.name === 'AbortError';
        last = new ApiError(treo ? 'server' : 'network', 0, treo ? 'Trang dịch vụ công không phản hồi sau 45 giây' : 'Không kết nối được tới trang dịch vụ công (' + (e && e.message) + ')');
        LOG.ghi('[MANG] -> ' + last.message);
        if (attempt < lim) { await sleep(treo ? 1000 : waits[attempt]); continue; } throw last;
      }
      clearTimeout(hen);
      LOG.ghi('[MANG] -> ' + r.status + ' | ' + text.length + ' ký tự | ' + (Date.now() - t0) + ' ms');
      if (laTrangDangNhap(r, text)) { LOG.ghi('[PHIEN] Cong chuyen ve trang dang nhap: ' + String(r.url).replace(/\?.*$/, '')); throw new ApiError('session', r.status, 'Phiên đăng nhập trang dịch vụ công đã hết.'); }
      if (r.status === 200) {
        if (S.gap > 1200 && ++S.okRun >= 15) { S.gap = Math.max(1200, S.gap - 300); S.okRun = 0; }
        if (method === 'POST' && !opt.html) {
          var j; try { j = JSON.parse(text); } catch (e) {
            if (/<html|<!doctype/i.test(text)) { LOG.ghi('[PHIEN] POST tra ve trang HTML -> coi nhu het phien'); throw new ApiError('session', 200, 'Phiên đăng nhập trang dịch vụ công đã hết.'); }
            last = new ApiError('data', 200, 'Trang dịch vụ công trả về dữ liệu không đọc được'); LOG.ghi('[MANG] -> NGUYEN VAN: ' + text.slice(0, 300));
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
      if (r.status === 403) throw new ApiError('session', 403, 'Trang dịch vụ công từ chối (403) – có thể phiên đăng nhập đã hết. ' + msg);
      if (r.status === 429) {
        S.gap = Math.min(5000, S.gap + 800); S.okRun = 0;
        last = new ApiError('busy', 429, 'Trang dịch vụ công báo gọi quá nhanh');
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
    if (!d.getElementById('form-search-advanced')) throw new ApiError('session', 200, 'Chưa đăng nhập trang dịch vụ công');
    var m = d.querySelector('meta[name="csrf-token"]'); if (m) S.token = m.getAttribute('content') || '';
    var sel = d.querySelector('select[name="maToKhai"]');
    S.loaiTK = sel ? [].slice.call(sel.options).filter(function (o) { return o.value; }).map(function (o) { return [o.value, clean(o.textContent)]; }) : [];
    S.loaiTK.forEach(function (o) { S.loaiTKMap[o[0]] = o[1]; });
    LOG.ghi('[TRANG] Da dang nhap. Danh muc to khai: ' + S.loaiTK.length + ' loai');
    return true;
  }

  /* ---------- đọc bảng kết quả tra cứu (HTML) ---------- */
  function docKetQua(html, mode) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    var txt = clean(d.body ? d.body.textContent : '');
    var mt = txt.match(/Tổng số bản ghi:?\s*(\d+)/i), tp = d.getElementById('totalPage');
    var heads = [].slice.call(d.querySelectorAll('thead th')).map(function (th) { return C.boDau(clean(th.textContent)).toLowerCase(); });
    var bang = heads.some(function (h) { return h.indexOf('ma ho so') >= 0 || h.indexOf('ma giao dich') >= 0; });
    if (!mt && !bang) {
      if (/không có (dữ liệu|kết quả|bản ghi|hồ sơ)|không tìm thấy/i.test(txt)) return { ok: true, total: 0, pages: 0, rows: [] };
      return { ok: false, msg: txt.slice(0, 220) };
    }
    function idx(key) { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf(key) >= 0) return i; return -1; }
    function or(a, b) { return a >= 0 ? a : b; }
    var I = { ma: or(idx('ma ho so'), idx('ma giao dich')), tthc: idx('ten tthc'), tk: idx('to khai'), ky: idx('ky tinh thue'), loai: idx('loai to khai'), lanBS: or(idx('lan nop bo sung'), idx('lan bo sung')), cqt: or(idx('co quan thue'), idx('noi nop')), ngay: idx('ngay nop'), tt: idx('trang thai') };
    I.lan = (function () { for (var i = 0; i < heads.length; i++) if (heads[i].indexOf('lan nop') === 0 && heads[i].indexOf('bo sung') < 0) return i; return -1; })();
    var rows = [];
    [].slice.call(d.querySelectorAll('tbody tr')).forEach(function (tr) {
      var td = tr.cells; if (!td || td.length < 6) return;
      function c(k) { return I[k] >= 0 && td[I[k]] ? clean(td[I[k]].textContent) : ''; }
      var eye = tr.querySelector('[data-ma-ho-so]'), bs = tr.querySelector('[onclick*="kkhaiBSung"]');
      var ma = c('ma') || (eye ? eye.getAttribute('data-ma-ho-so') : '');
      if (!ma) return;
      var tk = c('tk'), r = {
        ma: ma, tthc: c('tthc'), tk: tk, tkCode: clean(tk.split(' - ')[0]), ky: c('ky'), loai: c('loai'), lanBS: c('lanBS'), lan: c('lan'),
        cqt: c('cqt'), ngay: c('ngay'), tt: c('tt'), src: mode === 'tdt' ? 'tdt' : 'dvc',
        mstNop: bs ? (bs.getAttribute('data-mst-nop') || '') : '', mstNopThay: bs ? (bs.getAttribute('data-mst-nop-thay') || '') : ''
      };
      if (mode === 'tdt') { r.maTKhai = bs ? (bs.getAttribute('data-ma-tkhai') || '') : ''; r.tkCode = maToKhaiTDT(r); }
      rows.push(r);
    });
    var total = mt ? +mt[1] : rows.length, pages = tp ? +clean(tp.textContent) || 1 : 1;
    return { ok: true, total: total, pages: pages, rows: rows };
  }
  // tab Thuế điện tử chỉ ghi TÊN tờ khai → tìm ký hiệu mẫu (01/GTGT…): theo mã tờ khai trên nút bổ sung, không có thì so tên với danh mục của trang dịch vụ công (chỉ nhận khi khớp đúng 1 mẫu)
  function chuanTen(t) { return C.boDau(String(t || '')).toUpperCase().replace(/M[AẪ]U\s+S[OỐ]\s+\S+/g, '').replace(/[^A-Z0-9]/g, ''); }
  function maToKhaiTDT(r) {
    if (r.maTKhai && S.loaiTKMap[r.maTKhai]) return clean(S.loaiTKMap[r.maTKhai].split(' - ')[0]);
    var n = chuanTen(r.tk), hit = [];
    S.loaiTK.forEach(function (o) { var p = o[1].split(' - '); if (p.length < 2) return; var core = chuanTen(p.slice(1).join(' - ')); if (core.length > 12 && n.indexOf(core) === 0) hit.push(clean(p[0])); });
    hit = hit.filter(function (v, i) { return hit.indexOf(v) === i; });
    if (hit.length === 1) return hit[0];
    return clean(r.tk.replace(/\(.*$/, '')).slice(0, 60) || r.tk.slice(0, 60);
  }
  function bodyTdt(tu, den, ma, page, size) {
    var p = new URLSearchParams();
    p.set('_csrf', csrf()); p.set('page', page ? String(page) : ''); p.set('size', size ? String(size) : ''); p.set('maToKhai_tdt', S.maTK || ''); p.set('maGiaoDichTthc_tdt', '');
    p.set('tuNgay_tdt', tu); p.set('denNgay_tdt', den); p.set('scope_tdt2', 'SELF'); p.set('mstUyQuyen_tdt2', ''); p.set('captcha', ma || '');
    return p.toString();
  }
  function qs(tu, den, ma, extra) {
    var p = 'maNghiepVu=&maTTHC=&maToKhai=' + encodeURIComponent(S.maTK || '') + '&maHoSo=&tuNgay=' + encodeURIComponent(tu) + '&denNgay=' + encodeURIComponent(den) + '&scope_tdt1=SELF&mstUyQuyen_tdt1=&captcha=' + encodeURIComponent(ma || '');
    return BASE + 'ho-so/search?' + p + (extra || '');
  }

  /* ---------- ngày ---------- */
  function d2(dmy) { return C.dmyToDate(dmy); }
  function chiaThang(tu, den) { return C.splitMonths(tu, den); } // mỗi đoạn trong 1 tháng dương lịch → luôn ≤ 30 ngày chênh lệch
  // Hồ sơ nộp trước 01/07/2025 nằm ở tab "Thuế điện tử": trang dịch vụ công cho tra khoảng dài (đã thử 18 tháng/1 mã, 02/11/2026) → mỗi lượt 12 tháng.
  // Từ 01/07/2025: tab DVC, tối đa 30 ngày/lượt → mỗi tháng 1 lượt.
  function chiaDoan(tu, den) {
    var out = [], mocDVC = d2(NGAY_DVC), a = d2(tu), b = d2(den);
    if (a < mocDVC) {
      var cuoiTDT = b < mocDVC ? b : new Date(2025, 5, 30), cur = new Date(a);
      while (cur <= cuoiTDT) {
        var e = new Date(cur.getFullYear() + 1, cur.getMonth(), cur.getDate() - 1); if (e > cuoiTDT) e = new Date(cuoiTDT);
        out.push({ k: 'tdt', x: C.dateToDMY(cur), y: C.dateToDMY(e) });
        cur = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
      }
    }
    if (b >= mocDVC) chiaThang(C.dateToDMY(a < mocDVC ? mocDVC : a), den).forEach(function (m) { out.push({ k: 'dvc', x: m[0], y: m[1] }); });
    return out;
  }
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
  function slugTK(code) { return slug(code, 40).toUpperCase() || 'KHAC'; }
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

  /* ---------- giao diện (Shadow DOM để không đụng CSS trang dịch vụ công) ---------- */
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
    '<div class="h" id="drag"><img src="' + DOM_ICON + '" alt=""><div class="t"><b>Tải tờ khai thuế đã nộp hàng loạt</b><small>Quản trị tử tế · bản ' + VER + '</small></div><span id="ses"><span class="pill mut">Đang kiểm tra…</span></span><button class="ib" id="bmin" title="Thu nhỏ">–</button><button class="ib" id="bx" title="Đóng">×</button></div>' +
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
    '<p class="hint" style="margin:6px 0 0">Mẹo: mở trang dịch vụ công ở một <b>cửa sổ Chrome riêng</b> (không để thành tab ẩn phía sau) – Chrome làm chậm hẳn tab bị ẩn lâu.</p>' +
    '<div class="row" style="margin-top:12px"><button class="btn pri" id="bfind" disabled>Tra cứu &amp; tải</button><span class="hint" id="fmsg"></span></div>' +
    '</div>' +
    '<div class="cap" id="cap" hidden><b id="capt"></b>' +
    '<span class="hint">Trang dịch vụ công yêu cầu mã xác nhận cho mỗi lần tra và chỉ cho tải hồ sơ của lần tra gần nhất – nên công cụ tra xong lượt nào tải luôn lượt đó. Anh/chị đọc mã trong ảnh, gõ vào ô dưới, nhấn Enter. Công cụ không tự đọc mã.</span>' +
    '<div class="row"><img class="capimg" id="capimg" alt="Mã xác nhận của trang dịch vụ công"><button class="btn sm" id="capnew" title="Lấy mã khác nếu khó đọc">↻ Đổi mã khác</button></div>' +
    '<div class="row"><input class="in mono" id="capin" maxlength="12" autocomplete="off" spellcheck="false" aria-label="Mã xác nhận"><button class="btn pri" id="capok">Tra &amp; tải</button><button class="btn sm" id="capskip">Bỏ qua lượt này</button><button class="btn sm" id="capstop">Dừng, lưu phần đã tải</button></div>' +
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
    '<div class="red"><span>⚠</span><span>Không đóng tab, không tải lại trang và không đăng xuất trang dịch vụ công khi đang tải.</span></div>' +
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
    var doan = chiaDoan(tu, den);
    if (doan.filter(function (x) { return x.k === 'dvc'; }).length > 36) return { loi: 'Phần từ 01/07/2025 trở đi quá dài (tối đa 36 tháng mỗi lần tra).' };
    if (d2(tu) < new Date(2015, 0, 1)) return { loi: 'Từ ngày quá xa (từ 01/01/2015 trở đi).' };
    return { tu: tu, den: den, doan: doan };
  }
  function capNhatGoiY() {
    var el = $('khint'); if (!el) return;
    var k = kiemNgay();
    if (k.loi) { el.textContent = 'Lọc theo ngày nộp. Tờ khai quý thường nộp trong tháng đầu quý sau (VD: Q3 nộp trong tháng 10).'; return; }
    var nt = k.doan.filter(function (x) { return x.k === 'tdt'; }).length, nd = k.doan.length - nt, n = k.doan.length;
    var s = 'Sẽ tra và tải lần lượt ' + n + ' lượt → gõ ' + n + ' mã xác nhận (' + (nt ? nt + ' lượt cho hồ sơ trước 01/07/2025, mỗi lượt tối đa 12 tháng' : '') + (nt && nd ? '; ' : '') + (nd ? nd + ' lượt cho hồ sơ từ 01/07/2025, mỗi tháng 1 lượt' : '') + '). Lượt nào tải xong mới hỏi mã lượt sau. Lọc theo ngày nộp (VD: tờ khai Q3 thường nộp trong tháng 10).';
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
      say(e.kind === 'session' ? 'Chưa thấy đăng nhập trang dịch vụ công. Anh/chị đăng nhập dichvucong.gdt.gov.vn (tài khoản doanh nghiệp) rồi bấm lại nút "Tải tờ khai" trên thanh dấu trang.' : 'Chưa mở được mục Tra cứu hồ sơ của trang dịch vụ công: ' + (e.message || e) + '. Thử bấm lại nút sau ít phút.', 'e');
    }
    kiemTiepTuc();
  }

  /* ---------- hỏi mã xác nhận cho 1 tháng ---------- */
  function hoiMa(i, n, x, y, loi) {
    return new Promise(function (resolve, reject) {
      $('cap').hidden = false; $('capt').textContent = 'Lượt ' + i + '/' + n + ': ' + x + ' → ' + y + (S.kDoan === 'tdt' ? ' (hồ sơ trên thuế điện tử)' : '') + ' – gõ mã để tra và tải';
      $('w').classList.remove('min'); if (i > 1 && !loi) goiNguoiDung('Cần gõ mã xác nhận – lượt ' + i + '/' + n + ' (' + x + ' → ' + y + ')');
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
     Kiểm chứng trên trang dịch vụ công thật 02/11/2026: lệnh tải hồ sơ chỉ nhận hồ sơ thuộc LẦN TRA GẦN NHẤT
     (hồ sơ tháng khác báo 500 "Hồ sơ truyền lên không hợp lệ") → tra xong tháng nào tải luôn tháng đó.
     ========================================================================== */
  var J = null;
  var RE_KHL = /không hợp lệ|tải hồ sơ thất bại/i, RE_TB_LOI = /không hợp lệ|tải file thất bại/i;
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
      var fn = ((a.getAttribute('onclick') || '').match(/(\w*downloadThongBao\w*)/) || [])[1] || '';
      var attrs = [].slice.call(a.attributes).filter(function (x) { return /^data-/.test(x.name); }).map(function (x) { return x.name + '=' + x.value; }).join(' ');
      out.push({ id: id, ten: clean(ten), loai: a.getAttribute('data-loai-tbao') || a.getAttribute('data-loaitbao') || '', fn: fn, attrs: attrs });
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
    var tdt = r.src === 'tdt';
    var j = await call(BASE + (tdt ? 'tchs/downloadhoso-tdt?loaiTraCuu=ETAX' : 'tchs/downloadhoso'), { method: 'POST', json: { maHoSo: r.ma }, khongThuLai: RE_KHL });
    if (!j || !j.content) throw new ApiError('data', 200, (j && (j.error || j.message)) || 'Trang dịch vụ công không có nội dung file');
    var u8 = b64(j.content), parts = null;
    if (u8[0] === 0x50 && u8[1] === 0x4B) { try { parts = await C.unzip(u8); } catch (e) { parts = null; } }
    if (parts && parts.length) {
      parts.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p) {
        var nm = p.name.split('/').pop(), m = nm.match(/_(\d+)\.([A-Za-z0-9]+)$/), so = m ? +m[1] : 0, ext = extOf(nm, 'bin');
        kq.files.push([dir + (so === 0 && ext === 'xml' ? base + '.xml' : base + '_DinhKem' + (so || '') + '.' + ext), p.bytes]);
      });
    } else kq.files.push([dir + base + '.' + extOf(j.fileName, u8[0] === 0x50 ? 'zip' : 'xml'), u8]);
    if (J.tb && tdt) {
      // thuế điện tử: 1 lệnh trả về 1 gói ZIP chứa mọi thông báo của hồ sơ (đã kiểm 02/11/2026)
      try {
        var jz = await call(BASE + 'tchs/downloadthongbao-tdt?loaiTraCuu=ETAX', { method: 'POST', json: { idTbao: r.ma, loaiTBao: '' }, khongThuLai: RE_TB_LOI });
        if (!jz || !jz.content) throw new ApiError('data', 200, 'Không có nội dung thông báo');
        var tu8 = b64(jz.content), tp = null;
        if (tu8[0] === 0x50 && tu8[1] === 0x4B) { try { tp = await C.unzip(tu8); } catch (e) { tp = null; } }
        if (tp && tp.length) tp.filter(function (p) { return p.bytes && !/\/$/.test(p.name); }).forEach(function (p, k) { kq.files.push([dir + base + '_TB' + (k + 1) + '.' + extOf(p.name, 'xml'), p.bytes]); kq.tb++; });
        else { kq.files.push([dir + base + '_TB1.' + extOf(jz.fileName, 'xml'), tu8]); kq.tb++; }
      } catch (e) {
        if (e.kind === 'session' || e.kind === 'stop') throw e;
        kq.tbLoi.push('Thông báo: ' + (e.message || e));
      }
    } else if (J.tb) {
      var ds = docThongBao(await call(BASE + 'tchs/files/detail/' + encodeURIComponent(r.ma) + '?loai=', {}));
      LOG.ghi('[TB] ' + r.ma + ': ' + ds.length + ' thong bao');
      for (var i = 0; i < ds.length; i++) {
        var t = ds[i];
        try {
          if (t.fn !== 'downloadThongBao' || t.attrs.split(' ').length > 1) LOG.ghi('[TB] Thong bao ' + (i + 1) + ' (' + t.ten + '): ham ' + t.fn + ' | ' + t.attrs);
          var jt = await call(BASE + 'tchs/downloadthongbao', { method: 'POST', json: { idTbao: t.id, loaiTBao: t.loai }, khongThuLai: RE_TB_LOI });
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
    try { if (window.Notification && Notification.permission === 'granted' && (document.hidden || !document.hasFocus())) { G.n = new Notification('Tải tờ khai – ' + txt, { body: 'Bấm vào đây để quay lại trang dịch vụ công và gõ mã.', tag: 'qtt-tk', requireInteraction: true }); G.n.onclick = function () { window.focus(); try { $('capin').focus(); } catch (e) { } G.n.close(); }; } } catch (e) { }
    LOG.ghi('[GOI] ' + txt);
  }
  function thoiGoi() { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title || document.title; } if (G.lap) { clearInterval(G.lap); G.lap = null; } if (G.n) { try { G.n.close(); } catch (e) { } G.n = null; } }
  window.addEventListener('focus', function () { if (G.t) { clearInterval(G.t); G.t = null; document.title = G.title; } });

  function progress(thang, n, i, m) {
    $('ptxt').textContent = 'Lượt ' + thang + ': đang tải ' + Math.min(i + 1, m) + '/' + m + ' hồ sơ';
    $('pbar').style.width = (m ? i / m * 100 : 100) + '%';
    $('pok').textContent = J.ok; $('ptb').textContent = J.tbOk; $('perr').textContent = J.err;
    var ds = J.dur.slice().sort(function (a, b) { return a - b; }), per = ds.length ? ds[Math.floor(ds.length / 2)] / 1000 : (S.gap / 1000 + 0.4) * (J.tb ? 4 : 1), rem = Math.ceil((m - i) * per);
    var thoi = rem < 90 ? rem + ' giây' : Math.ceil(rem / 60) + ' phút';
    $('peta').textContent = i < m ? 'Còn khoảng ' + thoi : '';
    $('pnext').hidden = !(J.conThang > 0 && i < m);
    $('pnext').textContent = 'Còn ' + J.conThang + ' lượt nữa. Lượt sau cần gõ mã sau khoảng ' + thoi + (($('obell').checked) ? ' – công cụ sẽ đổ chuông gọi anh/chị.' : '.');
  }

  // tải các hồ sơ của tháng vừa tra. pageOf: mã → số trang (để đọc lại trang nếu trang dịch vụ công báo "không hợp lệ")
  async function taiThang(nhan, rows, docLai) {
    var list = (J.last ? rows.filter(function (r) { return !RE_KHONG_HL.test(r.tt); }) : rows.slice()).sort(soSanh); // "chỉ lần cuối": hồ sơ hủy/không chấp nhận khỏi tải
    $('cap').hidden = true; scan(false); $('prog').hidden = false;
    for (var i = 0; i < list.length; i++) {
      var r = list[i], t0 = Date.now();
      progress(nhan, 0, i, list.length); $('pcur').textContent = r.tkCode + ' ' + (r.ky || '') + ' · ' + r.ma;
      var thu = 0;
      for (;;) {
        try {
          var kq = await taiMot(r);
          J.kq[r.ma] = { ok: true, pre: slugTK(r.tkCode) + '/' + tenGoc(r), files: kq.files.map(function (f) { return f[0].split('/').pop(); }), tb: kq.tb, tbLoi: kq.tbLoi, data: kq.files };
          J.ok++; J.tbOk += kq.tb; kq.tbLoi.forEach(function (m) { J.tbErrors.push([r.ma, r.tkCode + ' ' + (r.ky || ''), m]); });
          LOG.ghi('[TAI] OK ' + r.ma + ' -> ' + kq.files.length + ' file, ' + kq.tb + ' thong bao');
          break;
        } catch (e) {
          if (e.kind === 'session' || e.kind === 'stop') throw e;
          // trang dịch vụ công báo "không hợp lệ": đọc lại trang chứa hồ sơ (cùng điều kiện, không gửi mã) rồi thử lại 1 lần
          if (RE_KHL.test(e.message || '') && thu === 0) {
            thu++; LOG.ghi('[TAI] ' + r.ma + ' bao: ' + e.message + ' -> doc lai trang ket qua roi thu lai');
            try { await docLai(); } catch (e2) { if (e2.kind === 'session' || e2.kind === 'stop') throw e2; }
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
    J = { ok: 0, err: 0, tbOk: 0, names: {}, errors: [], tbErrors: [], kq: {}, dur: [], tb: $('otb').checked, last: $('olast').checked, boQua: [], canhBao: [], xongDen: null, dangThang: null };
    store('otb', J.tb ? '1' : '0'); store('olast', J.last ? '1' : '0');
    LOG.phanCach('Tra cứu & tải ' + k.tu + ' -> ' + k.den + (S.maTK ? ' | to khai ' + S.maTK : '') + (J.tb ? ' | kem thong bao' : '') + (J.last ? ' | chi lan cuoi' : ''));
    var map = {}, Q = k.doan.slice(), n = Q.length, ketThuc = 'xong', i = -1;
    function traTrang(dn, ma, page, size) {
      if (dn.k === 'tdt') return call(BASE + 'tchs/thuedientu', { method: 'POST', form: bodyTdt(dn.x, dn.y, ma, page, size), html: true, once: !!ma });
      return call(qs(dn.x, dn.y, ma, page ? '&page=' + page + '&size=' + size : ''), { html: true, once: !!ma });
    }
    try {
      while (Q.length) {
        var dn = Q.shift(); i++; n = i + 1 + Q.length;
        var x = dn.x, y = dn.y, loi = null, xong = false;
        J.dangThang = [x, y]; S.kDoan = dn.k;
        while (!xong) {
          scan(false);
          var ma = await hoiMa(i + 1, n, x, y, loi);
          if (ma === null) { J.boQua.push(x + ' → ' + y); break; }
          scan(true, 'Lượt ' + (i + 1) + '/' + n + ': đang tra ' + x + ' → ' + y, 30, 'Đã tải ' + J.ok + ' hồ sơ');
          var html;
          try { html = await traTrang(dn, ma); }
          catch (e1) {
            if (e1.kind === 'reject' || e1.kind === 'busy' || e1.kind === 'server' || e1.kind === 'network' || e1.kind === 'data') {
              LOG.ghi('[TRA] Lan tra bi cong tu choi: ' + e1.message);
              // thuế điện tử: trang dịch vụ công chê khoảng ngày (không phải lỗi mã) → chia đôi lượt này
              if (dn.k === 'tdt' && e1.kind === 'reject' && !/captcha|mã xác nhận|ma xac nhan/i.test(e1.message || '') && d2(y) - d2(x) > 40 * 86400000) {
                var mid = new Date((d2(x).getTime() + d2(y).getTime()) / 2), m1 = C.dateToDMY(mid), m2 = C.dateToDMY(new Date(mid.getFullYear(), mid.getMonth(), mid.getDate() + 1));
                Q.unshift({ k: 'tdt', x: x, y: m1 }, { k: 'tdt', x: m2, y: y }); i--; LOG.ghi('[TRA] Chia doi luot ' + x + ' -> ' + y);
                J.canhBao.push('Trang dịch vụ công báo "' + String(e1.message).slice(0, 80) + '" cho khoảng ' + x + ' → ' + y + ' – đã chia nhỏ'); xong = 'chia'; break;
              }
              loi = (e1.kind === 'reject' ? 'Trang dịch vụ công báo: "' + String(e1.message || '').slice(0, 140) + '"' : 'Trang dịch vụ công chưa phản hồi (' + e1.message + ')') + '. Anh/chị gõ mã mới để tra lại lượt này.';
              continue;
            }
            throw e1;
          }
          var kq = docKetQua(html, dn.k);
          if (!kq.ok) {
            LOG.ghi('[TRA] Cong khong tra bang ket qua: ' + kq.msg);
            loi = 'Trang dịch vụ công chưa trả kết quả' + (kq.msg ? ': "' + kq.msg.slice(0, 140) + '"' : '') + '. Thường do gõ sai mã – anh/chị gõ lại mã mới.';
            continue;
          }
          LOG.ghi('[TRA] ' + (dn.k === 'tdt' ? 'TDT ' : '') + x + ' -> ' + y + ': tong ' + kq.total + ' ho so, trang 1 co ' + kq.rows.length);
          J.conThang = Q.length;
          var nhan = (i + 1) + '/' + n + ' (' + x + ' → ' + y + ')';
          var nhan0 = function (L) { var moi = L.filter(function (r) { return !map[r.ma]; }); moi.forEach(function (r) { map[r.ma] = r; r.__n = ngayNop(r.ngay); r.thang = x; S.rows.push(r); }); return moi; };
          // trang dịch vụ công chỉ cho tải hồ sơ thuộc TRANG kết quả vừa đọc → đọc trang nào tải trang đó
          if (kq.total <= kq.rows.length) {
            var m0 = nhan0(kq.rows);
            if (m0.length) await taiThang(nhan, m0, function () { return traTrang(dn, '', 1, SIZE); });
          } else {
            var sp = Math.ceil(kq.total / SIZE), doc = 0;
            for (var p = 1; p <= sp; p++) {
              scan(true, 'Lượt ' + (i + 1) + '/' + n + ': đọc trang ' + p + '/' + sp, 30 + 60 * p / sp, '');
              var pp = p, kp = docKetQua(await traTrang(dn, '', p, SIZE), dn.k);
              if (!kp.ok) { LOG.ghi('[TRA] Trang ' + p + ' khong doc duoc: ' + kp.msg); J.canhBao.push('Lượt ' + x + ' → ' + y + ': trang ' + p + ' chưa đọc được'); break; }
              doc += kp.rows.length;
              var mp = nhan0(kp.rows);
              if (mp.length) await taiThang(nhan + (sp > 1 ? ' · trang ' + p + '/' + sp : ''), mp, (function (q) { return function () { return traTrang(dn, '', q, SIZE); }; })(pp));
            }
            if (doc < kq.total) J.canhBao.push('Lượt ' + x + ' → ' + y + ': trang dịch vụ công báo ' + kq.total + ' hồ sơ, đọc được ' + doc);
          }
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
    // thuế điện tử: hồ sơ cùng tên tờ khai dùng chung ký hiệu mẫu nếu có ít nhất 1 dòng xác định được (để gom đúng nhiều lần nộp)
    var tenMa = {}; S.rows.forEach(function (r) { if (r.src === 'tdt' && /\//.test(r.tkCode) && r.tkCode.length < 25) tenMa[chuanTen(r.tk)] = r.tkCode; });
    S.rows.forEach(function (r) { if (r.src === 'tdt' && tenMa[chuanTen(r.tk)]) r.tkCode = tenMa[chuanTen(r.tk)]; });
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
    return [k.tbLoi && k.tbLoi.length ? 'warn' : 'ok', 'Đã tải' + (k.tb ? ' + ' + k.tb + ' TB' : '') + (k.tbLoi && k.tbLoi.length ? ' (thiếu ' + k.tbLoi.length + ' TB)' : '')];
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
      var k = J.kq[r.ma], kt = !k ? (J.last && RE_KHONG_HL.test(r.tt) ? 'Không tải (hồ sơ hủy / không chấp nhận)' : 'Chưa tải') : !k.ok ? 'Lỗi: ' + k.loi : trongZip(r) ? 'Đã tải' + (k.tbLoi && k.tbLoi.length ? ' (thiếu ' + k.tbLoi.length + ' thông báo – trang dịch vụ công báo lỗi)' : '') : 'Không đưa vào ZIP (không phải lần hiệu lực cuối)';
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
      if (ketThuc === 'phien') say('Trang dịch vụ công đã hết phiên đăng nhập. Anh/chị đăng nhập lại rồi bấm nút "Tải tờ khai" để tra lại.', 'e');
      else if (ketThuc === 'dung') say('Đã dừng.', 'i');
      else if (ketThuc === 'loi') say('Tra cứu bị gián đoạn: ' + J.loiChung + '. Anh/chị thử lại sau ít phút.', 'e');
      else say('Không có hồ sơ nào nộp trong khoảng ngày này' + (S.maTK ? ' với loại tờ khai đã chọn' : '') + (J.boQua.length ? ' (đã bỏ qua ' + J.boQua.length + ' tháng)' : '') + '.', 'i');
      return;
    }
    say('Đang đóng gói file ZIP…', 'i');
    var nBo = 0;
    try {
      var z = new C.ZipWriter(), nm = (S.mst ? S.mst + '_' : '') + S.tu.replace(/\//g, '') + '-' + (ketThuc === 'xong' ? S.den : (J.xongDen || S.tu)).replace(/\//g, '');
      // tên tờ khai được xác định lại sau khi gom (thuế điện tử) → đổi thư mục / tên file cho thống nhất
      S.rows.forEach(function (r) { var k = J.kq[r.ma]; if (!k || !k.ok || !k.pre) return; var moi = slugTK(r.tkCode) + '/' + tenGoc(r); if (moi === k.pre) return; k.data.forEach(function (f) { if (f[0].indexOf(k.pre) === 0) f[0] = moi + f[0].slice(k.pre.length); }); k.files = k.data.map(function (f) { return f[0].split('/').pop(); }); k.pre = moi; });
      S.rows.forEach(function (r) { var k = J.kq[r.ma]; if (k && k.ok) { if (trongZip(r)) k.data.forEach(function (f) { z.add(uniqueName(f[0]), f[1]); }); else nBo++; } });
      try { z.add('Bang-ke-to-khai.xlsx', await (await C.xlsxBlob(dongBangKe())).arrayBuffer(), { store: true }); }
      catch (e) { LOG.loi('Lap bang ke Excel', e && e.message); }
      var ghi = [];
      if (J.errors.length) ghi.push('HỒ SƠ (TỜ KHAI) CHƯA TẢI ĐƯỢC (' + J.errors.length + '):\r\n' + J.errors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.tbErrors.length) ghi.push('THÔNG BÁO CỦA CƠ QUAN THUẾ CHƯA TẢI ĐƯỢC (' + J.tbErrors.length + ') – tờ khai của các hồ sơ này ĐÃ tải đủ, chỉ thiếu thông báo; trang dịch vụ công báo lỗi cả khi gọi lại. Anh/chị có thể mở hồ sơ trên trang dịch vụ công để tải tay thông báo này:\r\n' + J.tbErrors.map(function (e) { return e.join(' | '); }).join('\r\n'));
      if (J.boQua.length) ghi.push('Các tháng đã bỏ qua (chưa tra): ' + J.boQua.join(', '));
      if (conTu) ghi.push('Chưa tra / chưa tải xong: từ ' + conTu + ' đến ' + S.den + ' – bấm nút "Tải tờ khai" → "Điền sẵn khoảng ngày còn lại".');
      if (J.canhBao.length) ghi.push('Lưu ý khi đọc danh sách:\r\n' + J.canhBao.join('\r\n'));
      if (ghi.length) z.add('HS-chua-tai-duoc.txt', '﻿' + ghi.join('\r\n\r\n') + '\r\n');
      z.add('danh-sach.json', JSON.stringify({ congCu: 'tai-to-khai', ver: VER, mst: S.mst, tu: S.tu, den: S.den, rows: S.rows.map(function (r) { var k = J.kq[r.ma]; return { ma: r.ma, tk: r.tk, ky: r.ky, loai: r.loai, lan: r.lan, lanBS: r.lanBS, ngay: r.ngay, tt: r.tt, cuoi: r.cuoi, nLan: r.nLan, tai: k ? { ok: k.ok, loi: k.loi, files: k.files, tb: k.tb } : null }; }) }, null, 1));
      LOG.ghi('[XONG] ' + ketThuc + ' | ' + J.ok + ' ho so OK, ' + J.tbOk + ' thong bao, ' + J.err + ' loi, ' + nBo + ' bo khoi ZIP (lan truoc)');
      z.add('nhat-ky.txt', LOG.text());
      C.saveBlob(await z.blob(), 'ToKhai_' + nm + (conTu ? '_chua-xong' : '') + '.zip');
      var dau = ketThuc === 'xong' ? 'Xong: ' : ketThuc === 'phien' ? 'Trang dịch vụ công hết phiên đăng nhập – đã lưu phần đã tải: ' : ketThuc === 'dung' ? 'Đã dừng – đã lưu phần đã tải: ' : 'Bị gián đoạn (' + J.loiChung + ') – đã lưu phần đã tải: ';
      say(dau + J.ok + ' hồ sơ' + (J.tbOk ? ', ' + J.tbOk + ' thông báo' : '') + (nBo ? ' (' + nBo + ' lần nộp trước không đưa vào ZIP, vẫn có trong Excel)' : '') + (J.err ? ', ' + J.err + ' hồ sơ lỗi' : '') + (J.tbErrors.length ? ', ' + J.tbErrors.length + ' thông báo trang dịch vụ công không cho tải (tờ khai vẫn đủ)' : '') + (J.err || J.tbErrors.length ? ' – xem HS-chua-tai-duoc.txt' : '') + '. File ZIP đã lưu vào thư mục Tải về của trình duyệt.' + (conTu ? ' Còn từ ' + conTu + ' đến ' + S.den + ': ' + (ketThuc === 'phien' ? 'đăng nhập lại, ' : '') + 'bấm nút "Tải tờ khai" để tải tiếp.' : ''), ketThuc === 'xong' && !J.err ? 'o' : ketThuc === 'xong' ? 'w' : 'e');
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
