  /* =====================================================================
     MODULE ĐÀO TẠO NỘI BỘ (bổ sung vào bản 0.6.1 – bắt đầu 12/11/2026 15:16)
     Anh Tuấn chốt 12/11 15:16: (1) video chỉ dán link (YouTube, Google Drive…), không tải video lên;
     (2) bài kiểm tra có câu tự luận, trắc nghiệm chọn 1, chọn nhiều; (3) chưa làm đào tạo bên ngoài, thỏa thuận bồi hoàn;
     (4) chưa làm mẫu huấn luyện an toàn lao động – chỉ cần cho tạo khóa học mới; (5) không làm điểm danh.
     B1 (file này): Kho khóa học (soạn bài, bài kiểm tra, xác nhận đã đọc, giao cho ai, hạn, học lại định kỳ),
     Theo dõi học tập (ai cần học gì, tiến độ, chấm câu tự luận), nhắc ở Việc cần xử lý, xem thử như nhân viên.
     B2 (làm sau): nhân viên học, làm bài trên app → máy chủ → phần mềm kéo kết quả về; bước Hội nhập tự xong khi đạt khóa Hội nhập.
     Dữ liệu: khóa học lưu chung S.settings.dtKh (như Kho biểu mẫu hội nhập); kết quả theo từng công ty u.dt.kq[Mã NV][mã khóa].
     ===================================================================== */
  var DT_SEED = '2026-11-12a', DTV = 0;
  var DT_COL = ['#3F6B35', '#1F5F8B', '#8A4B9C', '#B4562B', '#2B6F77', '#A76300'];
  var DT_QT = { mot: 'Trắc nghiệm – chọn 1', nhieu: 'Trắc nghiệm – chọn nhiều', tl: 'Tự luận' };
  var DT_BT = { doc: 'Bài đọc', video: 'Video (dán link)', link: 'Tài liệu (dán link)' };
  var DT_ST = { chua: ['Chưa học', 'mute'], hoc: ['Đang học', 'info'], cho: ['Chờ chấm', 'warn'], dat: ['Đạt', 'ok'], khong: ['Chưa đạt', 'bad'], lai: ['Cần học lại', 'warn'] };
  var DT_VARS = [['ho_ten', 'Họ tên người học'], ['cong_ty', 'Tên công ty'], ['phong_ban', 'Phòng ban'], ['so_do_to_chuc', 'Sơ đồ tổ chức (tự lấy)']];

  // Menu: Đào tạo nội bộ thành nhóm riêng có 2 mục
  (function () {
    var i = MODS.map(function (m) { return m.id; }).indexOf('daotao');
    var items = [
      { id: 'dtkhoa', g: 'dt', t: 'Kho khóa học', st: 'ok', k: 'dao tao noi bo khoa hoc bai hoc video bai kiem tra trac nghiem tu luan noi quy' },
      { id: 'dtketqua', g: 'dt', t: 'Theo dõi học tập', st: 'ok', k: 'dao tao ket qua hoc tap ai da hoc cham bai tu luan qua han hoc lai' }
    ];
    if (i >= 0) MODS.splice.apply(MODS, [i, 1].concat(items)); else MODS.push.apply(MODS, items);
    var gi = GROUPS.map(function (g) { return g.id; }).indexOf('hn'); if (gi < 0) gi = GROUPS.map(function (g) { return g.id; }).indexOf('td');
    GROUPS.splice(gi + 1, 0, { id: 'dt', t: 'Đào tạo nội bộ', d: 'Khóa học nội bộ, ai đã học gì, ai còn phải học.' });
    var ti = TREE.indexOf('daotao'); if (ti >= 0) TREE[ti] = 'dt';
    IC.g_dt = IC.daotao; IC.dtkhoa = IC.daotao;
    IC.dtketqua = '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12.5h5"/><path d="m13.5 16.5 1.8 1.8 3.2-3.3"/>';
    IC.dt_play = '<circle cx="12" cy="12" r="8.5"/><path d="m10 8.8 5.2 3.2-5.2 3.2z"/>';
    IC.dt_doc = '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>';
    IC.dt_link = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>';
    IC.dt_quiz = '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.6v.1"/>';
    IC.dt_pause = '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>'; IC.dt_sign = '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/>'; IC.dt_flag = '<path d="M5 21V4.5M5 4.5h11l-2 4 2 4H5"/>';
    IC.dt_ok = '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/>';
  })();

  /* ---------------- Dữ liệu ---------------- */
  function dtId(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function dtHasSample() { return S.units.some(function (u) { return u.source === 'sample'; }); }
  function dtKh() {
    if (!Array.isArray(S.settings.dtKh) || (dtHasSample() && S.settings.dtSeed !== DT_SEED)) {
      var keep = Array.isArray(S.settings.dtKh) ? S.settings.dtKh.filter(function (k) { return !k.mau; }) : [];
      S.settings.dtKh = dtSample(dtHasSample()).concat(keep); S.settings.dtSeed = DT_SEED;
      try { saveSettings(); } catch (e) { }
    }
    return S.settings.dtKh;
  }
  function dtById(id) { return dtKh().filter(function (k) { return k.id === id; })[0] || null; }
  function dtOf(u) {
    if (!u.dt) u.dt = { v: 1, kq: {} }; if (!u.dt.kq) u.dt.kq = {};
    if (u.source === 'sample' && u.dt.seed !== DT_SEED) { u.dt.seed = DT_SEED; u.dt.kq = {}; try { dtSeedKq(u); } catch (e) { logErr('Tạo dữ liệu mẫu đào tạo', e); } }
    return u.dt;
  }
  function dtSave(txt) { DTV++; if (txt) log('Đào tạo nội bộ: ' + txt); saveSettings(); saveUnits(); }
  function dtUnitName(u) { return String(u.name || '').replace(/\s*\(dữ liệu mẫu\)\s*$/i, ''); }
  function dtNq(k) { return (k.kt && k.kt.on ? k.kt.cau.length : 0); }
  function dtPts(k) { return (k.kt && k.kt.on ? k.kt.cau : []).reduce(function (a, q) { return a + (+q.diem || 1); }, 0); }
  function dtAddM(iso, m) { var y = +iso.slice(0, 4), mo = +iso.slice(5, 7) - 1 + m, d = +iso.slice(8, 10); var t = new Date(Date.UTC(y, mo, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); return t.getUTCFullYear() + '-' + p2(t.getUTCMonth() + 1) + '-' + p2(Math.min(d, last)); }

  // Ai phải học khóa này: công ty / phòng ban / vị trí; "chỉ người mới" = vào làm từ ngày giao khóa trở đi
  function dtApplies(k, u, e) {
    var sc = k.sc || {};
    if (sc.us && sc.us.length && sc.us.indexOf(u.id) < 0) return false;
    if (sc.pb && sc.pb.length && sc.pb.indexOf(e['Phòng ban'] || '') < 0) return false;
    if (sc.cd && sc.cd.length && sc.cd.indexOf(e['Chức danh công việc'] || '') < 0) return false;
    if (sc.moi && !(e['Ngày vào làm'] && k.giao && e['Ngày vào làm'] >= k.giao)) return false;
    return true;
  }
  function dtScText(k) {
    var sc = k.sc || {}, a = [];
    a.push(sc.us && sc.us.length ? sc.us.map(function (id) { var u = unitById(id); return u ? shortUnit(u.name) : ''; }).filter(Boolean).join(', ') : (S.units.length > 1 ? 'Tất cả công ty' : 'Toàn công ty'));
    if (sc.pb && sc.pb.length) a.push(sc.pb.length <= 2 ? sc.pb.join(', ') : sc.pb.length + ' phòng ban');
    if (sc.cd && sc.cd.length) a.push(sc.cd.length <= 2 ? sc.cd.join(', ') : sc.cd.length + ' vị trí');
    if (sc.moi) a.push('người mới vào');
    return a.join(' · ');
  }
  // Trạng thái 1 người với 1 khóa
  function dtRow(u, e, k, R) {
    var id = e['Mã NV'], r = (dtOf(u).kq[id] || {})[k.id] || null;
    var vao = e['Ngày vào làm'] || '', start = k.sc && k.sc.moi ? vao : (vao && vao > (k.giao || '') ? vao : (k.giao || vao || R));
    var due = +k.han > 0 && start ? addDays(start, +k.han) : '';
    var st = r ? r.st : 'chua';
    if (st === 'dat' && +k.lap > 0 && r.xong && dtAddM(r.xong, +k.lap) <= R) { st = 'lai'; due = dtAddM(r.xong, +k.lap); }
    var late = st !== 'dat' && st !== 'cho' && due && due < R;
    return { u: u, e: e, id: id, k: k, r: r, st: st, due: due, start: start, late: !!late, days: due ? tdDiff(R, due) : null };
  }
  function dtRows(us, R, fk) {
    var out = [], mat = {};
    us.forEach(function (u) {
      mat[u.id] = HR.maternitySet(u.data, R);
      (u.data.NV || []).forEach(function (e) {
        if (!e['Mã NV'] || HR.staffState(e, R, mat[u.id]) === 'left') return;
        if (e['Ngày vào làm'] && e['Ngày vào làm'] > R) return;
        dtKh().forEach(function (k) { if (!k.on || (fk && k.id !== fk)) return; if (dtApplies(k, u, e)) out.push(dtRow(u, e, k, R)); });
      });
    });
    return out;
  }

  // Chấm điểm: trắc nghiệm tự chấm, tự luận người quản lý chấm
  function dtScore(k, ans, tl) {
    var Q = k.kt && k.kt.on ? k.kt.cau : [], got = 0, tot = 0, wait = false;
    Q.forEach(function (q) {
      var d = +q.diem || 1; tot += d; var a = ans ? ans[q.id] : null;
      if (q.loai === 'tl') { var g = tl && tl[q.id]; if (g && g.d !== undefined && g.d !== '' && g.d !== null) got += Math.min(d, Math.max(0, +g.d)); else wait = true; return; }
      var ok = (q.dung || []).slice().sort().join(','), my = (a || []).slice().sort().join(',');
      if (ok && my === ok) got += d;
    });
    return { got: Math.round(got * 100) / 100, tot: tot, pct: tot ? Math.round(got / tot * 100) : 100, wait: wait };
  }
  function dtFinal(k, r) { var sc = dtScore(k, r.ans, r.tl); r.diem = sc.got; r.pct = sc.pct; r.st = sc.wait ? 'cho' : (sc.pct >= (+k.kt.dat || 0) ? 'dat' : 'khong'); return r; }

  /* ---------------- Nội dung bài: định dạng đơn giản ----------------
     # Tiêu đề · ## Tiêu đề nhỏ · - gạch đầu dòng · 1. đánh số · **in đậm** · link http… · {{ho_ten}} {{cong_ty}} {{phong_ban}} {{so_do_to_chuc}} */
  function dtOrg(u) {
    if (!u) return '<p class="faint">(Sơ đồ tổ chức của công ty sẽ hiện ở đây)</p>';
    var nv = nvIndex(u), R = refDate(), mat = HR.maternitySet(u.data, R);
    var rows = (u.data.PB || []).map(function (p) {
      var h = p['Mã NV trưởng bộ phận'] ? nv[p['Mã NV trưởng bộ phận']] : null, n = (u.data.NV || []).filter(function (e) { return e['Phòng ban'] === p['Tên phòng ban'] && HR.staffState(e, R, mat) !== 'left'; }).length;
      return '<li><b>' + esc(p['Tên phòng ban']) + '</b>' + (h ? ' – phụ trách: ' + esc(h['Họ và tên']) + (h['Chức danh công việc'] ? ' (' + esc(h['Chức danh công việc']) + ')' : '') : '') + ' · ' + n + ' người</li>';
    }).join('');
    return rows ? '<ul class="dt-org">' + rows + '</ul>' : '<p class="faint">(Chưa có danh mục phòng ban)</p>';
  }
  function dtMd(t, ctx) {
    ctx = ctx || {};
    var V = { ho_ten: ctx.ho_ten || '(Họ tên người học)', cong_ty: ctx.cong_ty || '(Tên công ty)', phong_ban: ctx.phong_ban || '(Phòng ban)' };
    var inl = function (s) {
      return String(s).split('**').map(function (x, i) {
        var h = esc(x).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (m, k) { return V[k] !== undefined ? '<span class="dt-var">' + esc(V[k]) + '</span>' : m; })
          .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        return i % 2 && h ? '<strong>' + h + '</strong>' : h;
      }).join('');
    };
    var out = [], list = null;
    function flush() { if (list) { out.push('<' + list.t + '>' + list.it.join('') + '</' + list.t + '>'); list = null; } }
    String(t || '').replace(/\r/g, '').split('\n').forEach(function (ln) {
      var s = ln.trim(), m;
      if (/^\{\{\s*so_do_to_chuc\s*\}\}$/.test(s)) { flush(); out.push(dtOrg(ctx.u)); return; }
      if ((m = /^[-*•]\s+(.*)$/.exec(s))) { if (!list || list.t !== 'ul') { flush(); list = { t: 'ul', it: [] }; } list.it.push('<li>' + inl(m[1]) + '</li>'); return; }
      if ((m = /^\d+[.)]\s+(.*)$/.exec(s))) { if (!list || list.t !== 'ol') { flush(); list = { t: 'ol', it: [] }; } list.it.push('<li>' + inl(m[1]) + '</li>'); return; }
      flush();
      if (!s) return;
      if (/^##\s/.test(s)) out.push('<h4>' + inl(s.slice(3)) + '</h4>');
      else if (/^#\s/.test(s)) out.push('<h3>' + inl(s.slice(2)) + '</h3>');
      else if (/^_.+_$/.test(s)) out.push('<p class="dt-it"><em>' + inl(s.slice(1, -1)) + '</em></p>');
      else out.push('<p>' + inl(s) + '</p>');
    });
    flush();
    return out.join('');
  }
  // Link video: YouTube, Google Drive → khung xem ngay; link khác → nút mở
  function dtEmbed(url) {
    var s = String(url || '').trim(), m;
    if ((m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(s))) return { kind: 'YouTube', src: 'https://www.youtube-nocookie.com/embed/' + m[1] };
    if ((m = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(s)) || (m = /drive\.google\.com\/open\?id=([\w-]+)/.exec(s))) return { kind: 'Google Drive', src: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
    if ((m = /vimeo\.com\/(\d+)/.exec(s))) return { kind: 'Vimeo', src: 'https://player.vimeo.com/video/' + m[1] };
    if (/^https?:\/\//.test(s)) return { kind: 'Link', src: '' };
    return null;
  }

  /* ---------------- Dữ liệu mẫu ---------------- */
  function dtSample(withSamples) {
    var hn = {
      id: 'KH01', mau: 1, ten: 'Hội nhập: Chào mừng bạn đến với công ty', mo: 'Khóa tự học cho người mới: giới thiệu công ty, sơ đồ tổ chức, nội quy, chế độ và cách dùng app nhân viên. Học xong làm bài kiểm tra ngắn và xác nhận đã đọc nội quy.',
      mau_c: DT_COL[0], on: true, bb: true, han: 7, lap: 0, giao: '2026-09-01', sc: { us: [], pb: [], cd: [], moi: true }, at: '2026-11-12', upd: '2026-11-12', by: 'Quản trị viên',
      bai: [
        { id: 'b1', loai: 'doc', t: 'Chào mừng {{ho_ten}}', nd: '# Chào mừng bạn đến với {{cong_ty}}\nCảm ơn bạn đã chọn đồng hành cùng chúng tôi. Khóa học này mất khoảng **30 phút** – bạn học trên điện thoại, lúc nào rảnh cũng được, trong **7 ngày đầu** đi làm.\n## Bạn sẽ biết sau khóa học\n- Công ty làm gì, ai phụ trách bộ phận nào\n- Giờ làm việc, cách chấm công, xin nghỉ trên app\n- Nội quy và các chế độ: lương, phép, bảo hiểm\n- Gặp vướng mắc thì hỏi ai\n_Phòng nhân sự sửa nội dung này cho đúng với công ty mình ở Kho khóa học._' },
        { id: 'b2', loai: 'video', t: 'Video giới thiệu công ty', url: '', nd: 'Dán link video giới thiệu công ty (YouTube, Google Drive…) ở Kho khóa học – video hiện ngay trong bài, nhân viên không phải tải về.' },
        { id: 'b3', loai: 'doc', t: 'Sơ đồ tổ chức – ai làm gì', nd: '# Các bộ phận trong công ty\nDanh sách dưới đây phần mềm tự lấy từ Sơ đồ tổ chức – luôn đúng với hiện tại.\n{{so_do_to_chuc}}\n## Cần hỏi gì?\n- Việc chuyên môn: hỏi **trưởng bộ phận** hoặc **người đồng hành** của bạn\n- Hồ sơ, hợp đồng, lương, bảo hiểm: hỏi **phòng nhân sự**' },
        { id: 'b4', loai: 'doc', t: 'Giờ làm việc, chấm công, nghỉ phép', nd: '# Giờ làm việc và chấm công\n- Giờ làm việc theo ca của bộ phận – xem ở mục **Công** trên app\n- Chấm công bằng app: bấm **Chấm công vào** khi đến, **Chấm công ra** khi về (cần bắt Wi‑Fi công ty)\n- Quên chấm công hoặc chấm sai: gửi **Báo sai** ngay trên app trong ngày\n# Nghỉ phép\n- Xin nghỉ bằng mục **Đơn** trên app, gửi trước ít nhất 1 ngày (trừ trường hợp đột xuất)\n- Xem số ngày phép còn lại ở mục **Bạn**' },
        { id: 'b5', loai: 'doc', t: 'Nội quy lao động – những điểm chính', nd: '# Những điểm chính của nội quy\n1. Đi làm đúng giờ; đi muộn, về sớm phải báo trưởng bộ phận\n2. Giữ bí mật thông tin khách hàng, học viên, dữ liệu của công ty\n3. Ứng xử lịch sự với đồng nghiệp, khách hàng\n4. Giữ gìn tài sản, thiết bị được giao\n5. Không làm việc riêng ảnh hưởng đến công việc chung\n**Bản nội quy đầy đủ:** phòng nhân sự gửi kèm ở bài Tài liệu tiếp theo.' },
        { id: 'b6', loai: 'link', t: 'Nội quy lao động (bản đầy đủ)', url: '', nd: 'Dán link file nội quy lao động (Google Drive, OneDrive…) để nhân viên mở xem.' },
        { id: 'b7', loai: 'doc', t: 'Lương, phép, bảo hiểm', nd: '# Lương\n- Lương trả hằng tháng; phiếu lương xem trên app ở mục **Lương**\n- Có thắc mắc về phiếu lương: hỏi phòng nhân sự trong 3 ngày sau khi nhận\n# Phép năm và bảo hiểm\n- Phép năm tính theo thời gian làm việc, xem trên app\n- Bảo hiểm xã hội, y tế, thất nghiệp: công ty đăng ký khi bạn ký hợp đồng lao động theo quy định' }
      ],
      kt: { on: true, dat: 70, lai: true, cau: [
        { id: 'q1', loai: 'mot', hoi: 'Quên chấm công thì bạn làm gì?', pa: ['Không cần làm gì', 'Gửi Báo sai trên app trong ngày', 'Chờ cuối tháng báo kế toán'], dung: [1], diem: 1 },
        { id: 'q2', loai: 'nhieu', hoi: 'Những việc nào bạn làm được trên app nhân viên? (chọn tất cả ý đúng)', pa: ['Chấm công vào, ra', 'Gửi đơn xin nghỉ', 'Xem phiếu lương', 'Sửa bảng lương của mình'], dung: [0, 1, 2], diem: 2 },
        { id: 'q3', loai: 'mot', hoi: 'Có thắc mắc về hồ sơ, hợp đồng, bảo hiểm, bạn hỏi ai trước?', pa: ['Phòng nhân sự', 'Bất kỳ đồng nghiệp nào', 'Giám đốc'], dung: [0], diem: 1 },
        { id: 'q4', loai: 'tl', hoi: 'Theo bạn, vì sao phải giữ bí mật thông tin khách hàng, học viên? Nêu 1 việc cụ thể bạn sẽ làm.', goi_y: 'Nêu được: tôn trọng quyền riêng tư, tránh rủi ro pháp lý, giữ uy tín công ty; việc cụ thể như không chụp màn hình gửi ra ngoài, khóa máy khi rời chỗ.', diem: 2 }
      ] },
      xn: { on: true, nd: 'Tôi đã đọc, hiểu nội quy lao động và các quy định của công ty, cam kết thực hiện.' }
    };
    if (!withSamples) return [hn];
    var at = {
      id: 'KH02', mau: 1, ten: 'Bảo mật thông tin và dữ liệu cá nhân', mo: 'Cách giữ an toàn dữ liệu khách hàng, học viên và đồng nghiệp trong công việc hằng ngày. Bắt buộc với mọi người, học lại mỗi năm.',
      mau_c: DT_COL[1], on: true, bb: true, han: 14, lap: 12, giao: '2026-11-02', sc: { us: [], pb: [], cd: [], moi: false }, at: '2026-10-15', upd: '2026-10-15', by: 'Quản trị viên',
      bai: [
        { id: 'b1', loai: 'doc', t: 'Dữ liệu cá nhân là gì', nd: '# Dữ liệu cá nhân quanh ta\n- Họ tên, số điện thoại, email, địa chỉ của khách hàng, học viên\n- Số CCCD, tài khoản ngân hàng, thông tin sức khỏe\n- Hồ sơ, lương của đồng nghiệp\n**Nguyên tắc:** chỉ dùng đúng việc, đúng người được giao.' },
        { id: 'b2', loai: 'doc', t: '5 thói quen giữ an toàn', nd: '1. Khóa màn hình máy tính khi rời chỗ\n2. Không gửi danh sách khách hàng qua nhóm chat cá nhân\n3. Không dùng chung mật khẩu, mã PIN\n4. Kiểm tra kỹ người nhận trước khi gửi email có file\n5. Thấy dấu hiệu lộ dữ liệu: báo ngay trưởng bộ phận' },
        { id: 'b3', loai: 'video', t: 'Video hướng dẫn', url: '', nd: 'Dán link video hướng dẫn bảo mật của công ty.' }
      ],
      kt: { on: true, dat: 80, lai: true, cau: [
        { id: 'q1', loai: 'nhieu', hoi: 'Thông tin nào là dữ liệu cá nhân?', pa: ['Số điện thoại học viên', 'Số CCCD của khách hàng', 'Giờ mở cửa văn phòng', 'Lương của đồng nghiệp'], dung: [0, 1, 3], diem: 2 },
        { id: 'q2', loai: 'mot', hoi: 'Rời chỗ ngồi 10 phút, bạn làm gì với máy tính?', pa: ['Để nguyên', 'Khóa màn hình', 'Tắt màn hình'], dung: [1], diem: 1 }
      ] },
      xn: { on: true, nd: 'Tôi cam kết giữ bí mật dữ liệu cá nhân và thông tin của công ty.' }
    };
    var ts = {
      id: 'KH03', mau: 1, ten: 'Kỹ năng tư vấn tuyển sinh', mo: 'Quy trình tư vấn 5 bước, cách lắng nghe nhu cầu học viên và xử lý câu hỏi thường gặp.',
      mau_c: DT_COL[3], on: true, bb: false, han: 30, lap: 0, giao: '2026-10-01', sc: { us: [], pb: ['Phòng Tuyển sinh'], cd: [], moi: false }, at: '2026-10-01', upd: '2026-10-01', by: 'Quản trị viên',
      bai: [
        { id: 'b1', loai: 'doc', t: 'Quy trình tư vấn 5 bước', nd: '1. Chào hỏi, giới thiệu bản thân\n2. Hỏi để hiểu mục tiêu học của học viên\n3. Giới thiệu khóa phù hợp, không giới thiệu tất cả\n4. Trả lời băn khoăn về học phí, lịch học\n5. Hẹn bước tiếp theo rõ ràng' },
        { id: 'b2', loai: 'link', t: 'Bộ câu hỏi thường gặp', url: '', nd: 'Dán link tài liệu câu hỏi thường gặp của phòng Tuyển sinh.' }
      ],
      kt: { on: true, dat: 60, lai: true, cau: [
        { id: 'q1', loai: 'mot', hoi: 'Bước nào nên làm trước khi giới thiệu khóa học?', pa: ['Báo học phí', 'Hỏi mục tiêu học của học viên', 'Gửi tất cả tài liệu'], dung: [1], diem: 1 },
        { id: 'q2', loai: 'tl', hoi: 'Học viên nói "học phí cao quá". Bạn trả lời thế nào?', goi_y: 'Ghi nhận băn khoăn, hỏi lại mục tiêu, nêu giá trị khóa học, giới thiệu hình thức trả góp/ưu đãi nếu có – không hạ giá tùy tiện.', diem: 3 }
      ] },
      xn: { on: false, nd: '' }
    };
    var sx = {
      id: 'KH04', mau: 1, ten: 'Quy trình đóng gói và kiểm hàng', mo: 'Các bước đóng gói, dán nhãn, kiểm hàng trước khi xuất kho cho khối sản xuất, kho.',
      mau_c: DT_COL[4], on: true, bb: true, han: 14, lap: 0, giao: '2026-11-01', sc: { us: [], pb: ['Xưởng Đóng gói', 'Kho hàng'], cd: [], moi: false }, at: '2026-10-20', upd: '2026-10-20', by: 'Quản trị viên',
      bai: [
        { id: 'b1', loai: 'doc', t: 'Các bước đóng gói', nd: '1. Kiểm tra lô hàng, hạn dùng trên phiếu\n2. Vệ sinh bàn đóng gói, đeo găng tay\n3. Đóng gói theo quy cách, dán nhãn đúng lô\n4. Ghi sổ số lượng, bàn giao kho' },
        { id: 'b2', loai: 'video', t: 'Video thao tác mẫu', url: '', nd: 'Dán link video quay thao tác đóng gói mẫu tại xưởng.' }
      ],
      kt: { on: true, dat: 75, lai: true, cau: [
        { id: 'q1', loai: 'mot', hoi: 'Việc đầu tiên khi nhận lô hàng cần đóng gói?', pa: ['Dán nhãn ngay', 'Kiểm tra lô, hạn dùng trên phiếu', 'Bàn giao kho'], dung: [1], diem: 1 },
        { id: 'q2', loai: 'nhieu', hoi: 'Trước khi đóng gói cần làm gì?', pa: ['Vệ sinh bàn đóng gói', 'Đeo găng tay', 'Tắt đèn xưởng'], dung: [0, 1], diem: 1 }
      ] },
      xn: { on: false, nd: '' }
    };
    return [hn, at, ts, sx];
  }
  // Kết quả mẫu: vài người đã đạt, đang học, chờ chấm, quá hạn
  function dtSeedKq(u) {
    var R = refDate(), kq = u.dt.kq, mat = HR.maternitySet(u.data, R), ppl = (u.data.NV || []).filter(function (e) { return e['Mã NV'] && HR.staffState(e, R, mat) !== 'left'; });
    var put = function (id, kid, r) { (kq[id] = kq[id] || {})[kid] = r; };
    ppl.forEach(function (e, i) {
      var id = e['Mã NV'];
      dtKh().forEach(function (k) {
        if (!k.on || !dtApplies(k, u, e)) return;
        var pick = (i * 7 + k.id.charCodeAt(3)) % 6, d0 = addDays(R, -(2 + (i % 8)));
        if (k.id === 'KH01') pick = [4, 2, 1, 4][i % 4];
        if (pick === 0) return; // chưa học
        if (pick === 1) { put(id, k.id, { st: 'hoc', bd: d0, bai: k.bai.slice(0, 1 + (i % k.bai.length)).map(function (b) { return b.id; }) }); return; }
        var ans = {}, tl = {};
        k.kt.cau.forEach(function (q, qi) {
          if (q.loai === 'tl') { ans[q.id] = 'Em sẽ không gửi thông tin ra ngoài và khóa máy khi rời chỗ, vì lộ thông tin làm mất uy tín công ty và ảnh hưởng tới khách hàng.'; if (pick !== 2) tl[q.id] = { d: (+q.diem || 1) - (qi % 2 ? 0.5 : 0), nx: 'Ý đúng, nêu được việc cụ thể.' }; }
          else ans[q.id] = (i + qi) % 7 === 0 ? [((q.dung || [0])[0] + 1) % q.pa.length] : (q.dung || []).slice();
        });
        var r = { st: 'hoc', bd: addDays(d0, -2), xong: d0, lan: 1, bai: k.bai.map(function (b) { return b.id; }), ans: ans, tl: tl, xn: k.xn && k.xn.on ? d0 : '' };
        dtFinal(k, r); if (pick === 2 && r.st === 'cho') { /* giữ chờ chấm */ }
        put(id, k.id, r);
      });
    });
  }

  /* ---------------- Trang Kho khóa học ---------------- */
  PAGES.dtkhoa = function () {
    var f = ps('dt', { ed: null });
    if (f.ed) return dtEditor(f.ed);
    var L = dtKh(), R = refDate(), us = selUnits(), all = dtRows(us, R);
    var by = {}; all.forEach(function (x) { var b = by[x.k.id] = by[x.k.id] || { n: 0, dat: 0, late: 0, cho: 0 }; b.n++; if (x.st === 'dat') b.dat++; if (x.late) b.late++; if (x.st === 'cho') b.cho++; });
    var on = L.filter(function (k) { return k.on; }), nDat = all.filter(function (x) { return x.st === 'dat'; }).length;
    var kpi = '<div class="org-kpi"><div><b>' + on.length + '</b><span>khóa đang mở</span></div><div><b>' + on.filter(function (k) { return k.bb; }).length + '</b><span>khóa bắt buộc</span></div><div><b>' + all.length + '</b><span>lượt cần học</span></div><div><b>' + (all.length ? Math.round(nDat / all.length * 100) : 0) + '%</b><span>đã đạt</span></div>' +
      '<div class="' + (all.some(function (x) { return x.late; }) ? 'k-bad' : '') + '"><b>' + all.filter(function (x) { return x.late; }).length + '</b><span>lượt quá hạn</span></div><div class="' + (all.some(function (x) { return x.st === 'cho'; }) ? 'k-warn' : '') + '"><b>' + all.filter(function (x) { return x.st === 'cho'; }).length + '</b><span>bài chờ chấm</span></div></div>';
    var cards = L.map(function (k) {
      var b = by[k.id] || { n: 0, dat: 0, late: 0, cho: 0 }, pct = b.n ? Math.round(b.dat / b.n * 100) : 0, nv = k.bai.filter(function (x) { return x.loai === 'video'; }).length;
      return '<div class="dt-card' + (k.on ? '' : ' off') + '" style="--dc:' + (k.mau_c || DT_COL[0]) + '"><div class="dt-cbar"></div><div class="dt-cb">' +
        '<div class="dt-ctags">' + (k.on ? '' : '<span class="tag tag-mute">Đang tắt</span>') + (k.bb ? '<span class="tag tag-warn">Bắt buộc</span>' : '<span class="tag tag-mute">Tự chọn</span>') + (k.sc && k.sc.moi ? '<span class="tag tag-info">Người mới</span>' : '') + (+k.lap ? '<span class="tag tag-info">Học lại ' + k.lap + ' tháng</span>' : '') + '</div>' +
        '<h3>' + esc(k.ten) + '</h3><p class="dt-cmo">' + esc(k.mo || '') + '</p>' +
        '<div class="dt-cmeta"><span>' + ic('dt_doc', 14) + k.bai.length + ' bài' + (nv ? ' · ' + nv + ' video' : '') + '</span><span>' + ic('dt_quiz', 14) + (dtNq(k) ? dtNq(k) + ' câu hỏi · đạt từ ' + k.kt.dat + '%' : 'Không có bài kiểm tra') + '</span>' + (+k.han ? '<span>' + ic('hn_clock', 14) + 'Hạn ' + k.han + ' ngày' + (k.sc && k.sc.moi ? ' từ ngày vào làm' : '') + '</span>' : '') + '</div>' +
        '<div class="dt-cfor">Áp dụng: <b>' + esc(dtScText(k)) + '</b></div>' +
        '<button class="dt-cprog" data-act="dt-res" data-id="' + k.id + '" title="Xem ai đã học, ai chưa"><span class="dt-bar"><i style="width:' + pct + '%"></i></span><span><b>' + b.dat + '/' + b.n + '</b> người đã đạt' + (b.late ? ' · <em class="down">' + b.late + ' quá hạn</em>' : '') + (b.cho ? ' · <em class="warn">' + b.cho + ' chờ chấm</em>' : '') + '</span></button>' +
        '<div class="dt-cact"><button class="btn btn-sm" data-act="dt-view" data-id="' + k.id + '">' + ic('dt_play', 14) + 'Xem thử</button><button class="btn btn-sm btn-primary" data-act="dt-edit" data-id="' + k.id + '">Sửa</button><span class="sp"></span><button class="btn btn-sm dt-ib" data-act="dt-dup" data-id="' + k.id + '" title="Nhân bản khóa học" aria-label="Nhân bản">' + ic('td_copy', 15) + '</button><button class="btn btn-sm dt-ib" data-act="dt-onoff" data-id="' + k.id + '" title="' + (k.on ? 'Tắt khóa học (giữ kết quả, không giao thêm)' : 'Bật lại khóa học') + '" aria-label="' + (k.on ? 'Tắt' : 'Bật') + '">' + ic(k.on ? 'dt_pause' : 'dt_play', 15) + '</button><button class="btn btn-sm dt-ib dt-del" data-act="dt-del" data-id="' + k.id + '" title="Xóa khóa học" aria-label="Xóa">' + ic('td_trash', 15) + '</button></div></div></div>';
    }).join('');
    return pageHead('Kho khóa học', 'Khóa học nội bộ: bài đọc, video (dán link), tài liệu, bài kiểm tra và xác nhận đã đọc. Nhân viên học trên app; phần mềm theo dõi ai đã học, ai còn phải học.', '<button class="btn btn-primary" data-act="dt-new">' + ic('td_plus', 15) + 'Tạo khóa học</button>') +
      kpi + '<div class="dt-grid">' + cards + '<button class="dt-card dt-add" data-act="dt-new"><span>' + ic('td_plus', 26) + '</span><b>Tạo khóa học mới</b><small>Bắt đầu từ trang trống hoặc nhân bản một khóa có sẵn</small></button></div>' +
      '<div class="notice" style="margin-top:14px">' + ic('info') + '<div><b>Bản thử:</b> nhân viên học và làm bài trên app sẽ có ở bước tiếp theo – hiện tại bấm <b>Xem thử</b> để học và làm bài như nhân viên; kết quả mẫu ở trang <b>Theo dõi học tập</b> là dữ liệu hư cấu.</div></div>';
  };
  BINDS.dtkhoa = function () { if (PS.dt && PS.dt.ed) dtBindEditor(); };
  function dtBlank() { return { id: dtId('KH'), ten: '', mo: '', mau_c: DT_COL[dtKh().length % DT_COL.length], on: true, bb: true, han: 14, lap: 0, giao: HR.isoToday(), sc: { us: [], pb: [], cd: [], moi: false }, bai: [{ id: dtId('b'), loai: 'doc', t: 'Bài 1', nd: '' }], kt: { on: true, dat: 70, lai: true, cau: [] }, xn: { on: false, nd: 'Tôi đã đọc, hiểu và cam kết thực hiện đúng nội dung khóa học.' } }; }
  ACTS['dt-new'] = function () { PS.dt.ed = { k: dtBlank(), isNew: true, dirty: false }; render(); window.scrollTo(0, 0); };
  ACTS['dt-edit'] = function (a, id) { var k = dtById(id); if (!k) return; PS.dt.ed = { k: JSON.parse(JSON.stringify(k)), isNew: false, dirty: false }; render(); window.scrollTo(0, 0); };
  ACTS['dt-dup'] = function (a, id) { var k = dtById(id); if (!k) return; var c = JSON.parse(JSON.stringify(k)); c.id = dtId('KH'); c.ten = k.ten + ' (bản sao)'; delete c.mau; c.giao = HR.isoToday(); PS.dt.ed = { k: c, isNew: true, dirty: true }; render(); window.scrollTo(0, 0); toast('Đã tạo bản sao – sửa rồi bấm Lưu khóa học', 'info'); };
  ACTS['dt-onoff'] = function (a, id) { var k = dtById(id); if (!k) return; k.on = !k.on; dtSave((k.on ? 'Bật' : 'Tắt') + ' khóa ' + k.ten); render(); };
  ACTS['dt-del'] = function (a, id) {
    var k = dtById(id); if (!k) return; var n = 0; S.units.forEach(function (u) { if (u.dt) Object.keys(u.dt.kq || {}).forEach(function (m) { if (u.dt.kq[m][id]) n++; }); });
    confirmBox('Xóa khóa "' + k.ten + '"?', (n ? 'Khóa đã có ' + n + ' lượt học – kết quả học của khóa này cũng bị xóa. ' : '') + 'Muốn giữ kết quả thì bấm Tắt thay vì Xóa.', 'Xóa khóa học', function () {
      S.settings.dtKh = dtKh().filter(function (x) { return x.id !== id; }); S.units.forEach(function (u) { if (u.dt) Object.keys(u.dt.kq || {}).forEach(function (m) { delete u.dt.kq[m][id]; }); });
      dtSave('Xóa khóa ' + k.ten); toast('Đã xóa khóa học', 'ok'); render();
    });
  };
  ACTS['dt-res'] = function (a, id) { ps('dtk', { co: '', pb: '', kh: '', st: '', q: '', view: 'list' }).kh = id; go('dtketqua'); };

  /* ---------------- Trình soạn khóa học ---------------- */
  function dtOpts(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function dtAllPb() { var o = {}; S.units.forEach(function (u) { (u.data.PB || []).forEach(function (p) { if (p['Tên phòng ban']) o[p['Tên phòng ban']] = 1; }); }); return Object.keys(o).sort(); }
  function dtAllCd(pbs) { var o = {}; S.units.forEach(function (u) { (u.data.NV || []).forEach(function (e) { if (e['Chức danh công việc'] && (!pbs || !pbs.length || pbs.indexOf(e['Phòng ban']) >= 0)) o[e['Chức danh công việc']] = 1; }); }); return Object.keys(o).sort(); }
  function dtChips(name, all, sel) { return '<div class="dt-chips">' + all.map(function (v) { return '<label class="dt-chip' + (sel.indexOf(v) >= 0 ? ' on' : '') + '"><input type="checkbox" data-sc="' + name + '" value="' + esc(v) + '"' + (sel.indexOf(v) >= 0 ? ' checked' : '') + '>' + esc(v) + '</label>'; }).join('') + '</div>'; }
  function dtEditor(ed) {
    var k = ed.k, sc = k.sc, multi = S.units.length > 1;
    var bai = k.bai.map(function (b, i) {
      var em = b.loai !== 'doc' ? dtEmbed(b.url) : null;
      return '<div class="dt-blk" data-bi="' + i + '"><div class="dt-bh"><span class="dt-num">' + (i + 1) + '</span><input class="input dt-bt" data-bf="t" value="' + esc(b.t) + '" placeholder="Tên bài"><select class="input dt-bsel" data-bf="loai">' + dtOpts(Object.keys(DT_BT).map(function (x) { return [x, DT_BT[x]]; }), b.loai) + '</select>' +
        '<span class="dt-mv"><button type="button" class="btn btn-sm" data-act="dt-bmv" data-id="' + i + '" data-d="-1" title="Lên"' + (i ? '' : ' disabled') + '>↑</button><button type="button" class="btn btn-sm" data-act="dt-bmv" data-id="' + i + '" data-d="1" title="Xuống"' + (i < k.bai.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" class="btn btn-sm" data-act="dt-bdel" data-id="' + i + '" title="Xóa bài">✕</button></span></div>' +
        (b.loai !== 'doc' ? '<div class="field"><label>' + (b.loai === 'video' ? 'Link video (YouTube, Google Drive, Vimeo…)' : 'Link tài liệu (Google Drive, OneDrive, trang web…)') + '</label><input class="input" data-bf="url" value="' + esc(b.url || '') + '" placeholder="https://…"><small class="dt-emb" data-emb="' + i + '">' + dtEmbTxt(b) + '</small></div>' : '') +
        '<div class="field"><label>' + (b.loai === 'doc' ? 'Nội dung bài' : 'Ghi chú cho người học (không bắt buộc)') + '</label><textarea class="input dt-nd" data-bf="nd" rows="' + (b.loai === 'doc' ? 7 : 2) + '">' + esc(b.nd || '') + '</textarea></div></div>';
    }).join('');
    var cau = (k.kt.cau || []).map(function (q, i) {
      var pa = q.loai === 'tl' ? '<div class="field"><label>Gợi ý đáp án (chỉ người chấm thấy)</label><textarea class="input" data-qf="goi_y" rows="2">' + esc(q.goi_y || '') + '</textarea></div>'
        : '<div class="dt-pa">' + (q.pa || []).map(function (p, j) { var on = (q.dung || []).indexOf(j) >= 0; return '<div class="dt-pai' + (on ? ' ok' : '') + '"><label title="Đánh dấu đáp án đúng"><input type="' + (q.loai === 'mot' ? 'radio' : 'checkbox') + '" name="dtq' + i + '" data-qok="' + j + '"' + (on ? ' checked' : '') + '><span>Đúng</span></label><input class="input" data-qpa="' + j + '" value="' + esc(p) + '" placeholder="Phương án ' + String.fromCharCode(65 + j) + '"><button type="button" class="btn btn-sm" data-act="dt-padel" data-id="' + i + '" data-j="' + j + '" title="Xóa phương án"' + (q.pa.length > 2 ? '' : ' disabled') + '>✕</button></div>'; }).join('') +
          '<button type="button" class="lnk-btn" data-act="dt-paadd" data-id="' + i + '">+ Thêm phương án</button></div>';
      return '<div class="dt-blk dt-q" data-qi="' + i + '"><div class="dt-bh"><span class="dt-num q">' + (i + 1) + '</span><select class="input dt-bsel" data-qf="loai">' + dtOpts(Object.keys(DT_QT).map(function (x) { return [x, DT_QT[x]]; }), q.loai) + '</select><label class="dt-pt">Điểm <input class="input num" type="number" min="0.5" step="0.5" data-qf="diem" value="' + (q.diem || 1) + '"></label>' +
        '<span class="dt-mv"><button type="button" class="btn btn-sm" data-act="dt-qmv" data-id="' + i + '" data-d="-1"' + (i ? '' : ' disabled') + '>↑</button><button type="button" class="btn btn-sm" data-act="dt-qmv" data-id="' + i + '" data-d="1"' + (i < k.kt.cau.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" class="btn btn-sm" data-act="dt-qdel" data-id="' + i + '" title="Xóa câu hỏi">✕</button></span></div>' +
        '<textarea class="input" data-qf="hoi" rows="2" placeholder="Nội dung câu hỏi">' + esc(q.hoi || '') + '</textarea>' + pa + '</div>';
    }).join('');
    var usOpt = multi ? '<div class="field"><label>Công ty</label><div class="dt-chips">' + S.units.map(function (u) { var on = !sc.us.length || sc.us.indexOf(u.id) >= 0; return '<label class="dt-chip' + (on ? ' on' : '') + '"><input type="checkbox" data-sc="us" value="' + u.id + '"' + (on ? ' checked' : '') + '>' + esc(shortUnit(u.name)) + '</label>'; }).join('') + '</div></div>' : '';
    var side = '<div class="card card-pad dt-side"><h3>Giao cho ai</h3>' + usOpt +
      '<div class="field"><label>Phòng ban <span class="faint">(không chọn = tất cả)</span></label>' + dtChips('pb', dtAllPb(), sc.pb) + '</div>' +
      (function () { var cds = dtAllCd(sc.pb).concat(sc.cd.filter(function (c) { return dtAllCd(sc.pb).indexOf(c) < 0; })); return '<details class="dt-det"' + (sc.cd.length || PS.dt.cdOpen ? ' open' : '') + '><summary>Vị trí <span class="faint">' + (sc.cd.length ? 'đã chọn ' + sc.cd.length : 'không chọn = tất cả') + (sc.pb.length ? ' · trong phòng ban đã chọn' : '') + '</span></summary>' + dtChips('cd', cds, sc.cd) + '</details>'; })() +
      '<label class="radio"><input type="checkbox" data-kf="moi"' + (sc.moi ? ' checked' : '') + '> Chỉ người mới vào làm (từ ngày giao khóa)</label>' +
      '<label class="radio"><input type="checkbox" data-kf="bb"' + (k.bb ? ' checked' : '') + '> Bắt buộc – nhắc ở Việc cần xử lý khi quá hạn</label>' +
      '<div class="dt-2"><div class="field"><label>Hạn hoàn thành</label><span class="dt-in"><input class="input num" type="number" min="0" max="365" data-kf="han" value="' + (+k.han || 0) + '"> ngày</span><small class="faint">' + (sc.moi ? 'tính từ ngày vào làm' : 'tính từ ngày giao khóa') + '; 0 = không hạn</small></div>' +
      '<div class="field"><label>Học lại định kỳ</label><select class="input" data-kf="lap">' + dtOpts([[0, 'Không'], [6, 'Mỗi 6 tháng'], [12, 'Mỗi 12 tháng'], [24, 'Mỗi 24 tháng']], +k.lap || 0) + '</select></div></div>' +
      '<div class="field"><label>Ngày giao khóa</label>' + dateInput('dtGiao', k.giao) + '</div>' +
      '<div class="dt-cnt" id="dtCnt"></div>' +
      '<div class="dt-sbtn"><button class="btn" data-act="dt-prev">' + ic('dt_play', 15) + 'Xem thử</button><button class="btn btn-primary" data-act="dt-save">Lưu khóa học</button><button class="btn" data-act="dt-cancel">Hủy</button></div></div>';
    var main = '<div class="card card-pad"><h3 class="dt-sh">Thông tin khóa học</h3><div class="field"><label>Tên khóa học <i class="req">*</i></label><input class="input" data-kf="ten" value="' + esc(k.ten) + '" placeholder="Ví dụ: Hội nhập cho nhân viên mới" maxlength="120"></div>' +
      '<div class="field"><label>Mô tả ngắn</label><textarea class="input" data-kf="mo" rows="2" maxlength="400">' + esc(k.mo || '') + '</textarea></div>' +
      '<div class="field"><label>Màu thẻ khóa học</label><div class="dt-cols">' + DT_COL.map(function (c) { return '<button type="button" class="dt-colb' + (c === k.mau_c ? ' on' : '') + '" style="background:' + c + '" data-act="dt-col" data-id="' + c + '" aria-label="Chọn màu"></button>'; }).join('') + '</div></div></div>' +
      '<div class="card card-pad"><div class="dt-shr"><h3 class="dt-sh">Bài học <span class="faint">' + k.bai.length + '</span></h3><span class="dt-add2"><button class="btn btn-sm" data-act="dt-badd" data-id="doc">+ Bài đọc</button><button class="btn btn-sm" data-act="dt-badd" data-id="video">+ Video</button><button class="btn btn-sm" data-act="dt-badd" data-id="link">+ Tài liệu</button></span></div>' +
      '<p class="dt-help">Định dạng nội dung: <code># Tiêu đề</code> · <code>## Tiêu đề nhỏ</code> · <code>- gạch đầu dòng</code> · <code>1. đánh số</code> · <code>**in đậm**</code> · <code>_dòng in nghiêng_</code> · dán link http… · chèn dữ liệu tự lấy: ' + DT_VARS.map(function (v) { return '<button type="button" class="lnk-chip" data-act="dt-var" data-id="' + v[0] + '" title="Chèn vào bài đang soạn">' + v[1] + '</button>'; }).join(' ') + '</p>' +
      (bai || '<p class="muted">Chưa có bài nào.</p>') + '</div>' +
      '<div class="card card-pad"><div class="dt-shr"><h3 class="dt-sh">Bài kiểm tra <span class="faint">' + (k.kt.cau || []).length + ' câu · ' + dtPts(Object.assign({}, k, { kt: Object.assign({}, k.kt, { on: true }) })) + ' điểm</span></h3><label class="radio"><input type="checkbox" data-tf="on"' + (k.kt.on ? ' checked' : '') + '> Có bài kiểm tra</label></div>' +
      (k.kt.on ? '<div class="dt-2 dt-ktset"><div class="field"><label>Điểm đạt</label><span class="dt-in"><input class="input num" type="number" min="0" max="100" data-tf="dat" value="' + (+k.kt.dat || 0) + '"> % tổng điểm</span></div><label class="radio" style="align-self:end;padding-bottom:8px"><input type="checkbox" data-tf="lai"' + (k.kt.lai ? ' checked' : '') + '> Cho làm lại khi chưa đạt</label></div>' +
        cau + '<div class="dt-add2" style="margin-top:8px"><button class="btn btn-sm" data-act="dt-qadd" data-id="mot">+ Trắc nghiệm chọn 1</button><button class="btn btn-sm" data-act="dt-qadd" data-id="nhieu">+ Trắc nghiệm chọn nhiều</button><button class="btn btn-sm" data-act="dt-qadd" data-id="tl">+ Câu tự luận</button></div>' +
        '<p class="dt-help" style="margin-top:8px">Trắc nghiệm phần mềm tự chấm. Câu tự luận người quản lý chấm ở <b>Theo dõi học tập</b> – bài có câu tự luận ở trạng thái <b>Chờ chấm</b> đến khi chấm xong.</p>' : '') + '</div>' +
      '<div class="card card-pad"><div class="dt-shr"><h3 class="dt-sh">Xác nhận cuối khóa</h3><label class="radio"><input type="checkbox" data-xf="on"' + (k.xn.on ? ' checked' : '') + '> Yêu cầu nhân viên xác nhận</label></div>' +
      (k.xn.on ? '<div class="field"><label>Nội dung nhân viên xác nhận (lưu kèm thời gian xác nhận)</label><textarea class="input" data-xf="nd" rows="2">' + esc(k.xn.nd || '') + '</textarea></div>' : '<p class="dt-help">Dùng cho khóa nội quy, quy chế: nhân viên bấm xác nhận đã đọc, phần mềm lưu lại ngày giờ làm bằng chứng.</p>') + '</div>';
    return '<button class="btn hn-back" data-act="dt-cancel">' + ic('hn_back', 16) + 'Kho khóa học</button>' +
      pageHead(ed.isNew ? 'Tạo khóa học' : 'Sửa khóa học', ed.isNew ? 'Soạn bài học, bài kiểm tra rồi chọn giao cho ai.' : esc(k.ten)) +
      '<div class="dt-ed"><div class="dt-main">' + main + '</div>' + side + '</div>';
  }
  function dtEmbTxt(b) { var em = dtEmbed(b.url); return !b.url ? (b.loai === 'video' ? 'Chưa có link – dán link video, phần mềm tự nhận YouTube, Google Drive, Vimeo' : 'Chưa có link') : !em ? '<span class="down">Link chưa đúng – cần bắt đầu bằng https://</span>' : em.src ? '<span class="ok">✓ Nhận ra ' + em.kind + ' – video hiện ngay trong bài</span>' : (b.loai === 'video' ? 'Link không phải YouTube, Google Drive, Vimeo – nhân viên bấm mở trang video' : '✓ Nhân viên bấm để mở tài liệu'); }
  function dtEdK() { return PS.dt && PS.dt.ed ? PS.dt.ed.k : null; }
  function dtDirty() { if (PS.dt.ed) PS.dt.ed.dirty = true; }
  function dtRe() { var y = window.scrollY; render(); window.scrollTo(0, y); }
  function dtCount() {
    var k = dtEdK(), el = $('#dtCnt'); if (!k || !el) return;
    var R = refDate(), n = 0, by = {}; S.units.forEach(function (u) { var mat = HR.maternitySet(u.data, R); (u.data.NV || []).forEach(function (e) { if (!e['Mã NV'] || HR.staffState(e, R, mat) === 'left') return; if (dtApplies(k, u, e)) { n++; by[shortUnit(u.name)] = (by[shortUnit(u.name)] || 0) + 1; } }); });
    el.innerHTML = k.sc.moi ? '<b>Chỉ người mới</b> vào làm từ ' + vn(k.giao) + ' trở đi' + (n ? ' · hiện có ' + n + ' người' : '') : '<b>' + n + ' người</b> phải học' + (S.units.length > 1 && n ? ' (' + Object.keys(by).map(function (x) { return x + ' ' + by[x]; }).join(', ') + ')' : '');
  }
  function dtBindEditor() {
    var k = dtEdK(); if (!k) return;
    dtCount();
    $$('[data-kf]').forEach(function (el) {
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
        var f = el.getAttribute('data-kf'), v = el.type === 'checkbox' ? el.checked : el.value;
        if (f === 'moi') { k.sc.moi = v; dtDirty(); dtRe(); return; }
        if (f === 'han' || f === 'lap') v = Math.max(0, Math.round(+v || 0));
        k[f] = v; dtDirty(); if (f === 'bb') dtCount();
      });
    });
    var gi = $('#dtGiao'); if (gi) gi.addEventListener('change', function () { var v = HR.parseVn(gi.value); if (v) { k.giao = v; dtDirty(); dtCount(); } });
    $$('[data-sc]').forEach(function (el) {
      el.addEventListener('change', function () {
        var f = el.getAttribute('data-sc');
        if (f === 'us') { var all = $$('[data-sc="us"]').filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); if (!all.length) { el.checked = true; toast('Chọn ít nhất 1 công ty', 'info'); return; } k.sc.us = all.length === S.units.length ? [] : all; }
        else k.sc[f] = $$('[data-sc="' + f + '"]').filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
        el.parentNode.classList.toggle('on', el.checked); dtDirty(); dtCount(); if (f === 'pb') { var d = $('.dt-det'); PS.dt.cdOpen = d && d.open; dtRe(); }
      });
    });
    $$('[data-bi]').forEach(function (box) {
      var b = k.bai[+box.getAttribute('data-bi')];
      $$('[data-bf]', box).forEach(function (el) {
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          var f = el.getAttribute('data-bf'); b[f] = el.value; dtDirty();
          if (f === 'loai') dtRe(); else if (f === 'url') { var t = $('[data-emb]', box); if (t) t.innerHTML = dtEmbTxt(b); }
        });
        if (el.tagName === 'TEXTAREA') el.addEventListener('focus', function () { PS.dt.lastTa = el; });
      });
    });
    $$('[data-qi]').forEach(function (box) {
      var q = k.kt.cau[+box.getAttribute('data-qi')];
      $$('[data-qf]', box).forEach(function (el) {
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
          var f = el.getAttribute('data-qf');
          if (f === 'loai') { q.loai = el.value; if (q.loai !== 'tl' && (!q.pa || q.pa.length < 2)) q.pa = ['', '']; if (q.loai === 'mot') q.dung = (q.dung || []).slice(0, 1); if (q.loai !== 'tl' && !q.dung) q.dung = []; dtDirty(); dtRe(); return; }
          q[f] = f === 'diem' ? Math.max(0.5, +el.value || 1) : el.value; dtDirty();
        });
      });
      $$('[data-qpa]', box).forEach(function (el) { el.addEventListener('input', function () { q.pa[+el.getAttribute('data-qpa')] = el.value; dtDirty(); }); });
      $$('[data-qok]', box).forEach(function (el) {
        el.addEventListener('change', function () {
          var j = +el.getAttribute('data-qok');
          if (q.loai === 'mot') q.dung = [j]; else { q.dung = (q.dung || []).filter(function (x) { return x !== j; }); if (el.checked) q.dung.push(j); q.dung.sort(); }
          $$('.dt-pai', box).forEach(function (p, pi) { p.classList.toggle('ok', q.dung.indexOf(pi) >= 0); }); dtDirty();
        });
      });
    });
    $$('[data-tf]').forEach(function (el) { el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () { var f = el.getAttribute('data-tf'); k.kt[f] = el.type === 'checkbox' ? el.checked : Math.min(100, Math.max(0, +el.value || 0)); dtDirty(); if (f === 'on') dtRe(); }); });
    $$('[data-xf]').forEach(function (el) { el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () { var f = el.getAttribute('data-xf'); k.xn[f] = el.type === 'checkbox' ? el.checked : el.value; dtDirty(); if (f === 'on') dtRe(); }); });
  }
  function dtMove(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var x = arr[i]; arr[i] = arr[j]; arr[j] = x; }
  ACTS['dt-col'] = function (a, c) { dtEdK().mau_c = c; dtDirty(); dtRe(); };
  ACTS['dt-badd'] = function (a, t) { var k = dtEdK(); k.bai.push({ id: dtId('b'), loai: t, t: t === 'video' ? 'Video' : t === 'link' ? 'Tài liệu' : 'Bài ' + (k.bai.length + 1), url: '', nd: '' }); dtDirty(); dtRe(); setTimeout(function () { var x = $$('.dt-bt'); if (x.length) { x[x.length - 1].focus(); x[x.length - 1].select(); x[x.length - 1].scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 40); };
  ACTS['dt-bmv'] = function (a, i) { dtMove(dtEdK().bai, +i, +a.getAttribute('data-d')); dtDirty(); dtRe(); };
  ACTS['dt-bdel'] = function (a, i) { var k = dtEdK(), b = k.bai[+i]; var go2 = function () { k.bai.splice(+i, 1); dtDirty(); dtRe(); }; if ((b.nd || b.url) && b.nd !== '') confirmBox('Xóa bài "' + (b.t || '') + '"?', 'Nội dung bài này sẽ mất.', 'Xóa bài', go2); else go2(); };
  ACTS['dt-qadd'] = function (a, t) { var k = dtEdK(); k.kt.cau.push(t === 'tl' ? { id: dtId('q'), loai: 'tl', hoi: '', goi_y: '', diem: 2 } : { id: dtId('q'), loai: t, hoi: '', pa: ['', '', ''], dung: [], diem: 1 }); dtDirty(); dtRe(); setTimeout(function () { var x = $$('[data-qf="hoi"]'); if (x.length) { x[x.length - 1].focus(); x[x.length - 1].scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 40); };
  ACTS['dt-qmv'] = function (a, i) { dtMove(dtEdK().kt.cau, +i, +a.getAttribute('data-d')); dtDirty(); dtRe(); };
  ACTS['dt-qdel'] = function (a, i) { dtEdK().kt.cau.splice(+i, 1); dtDirty(); dtRe(); };
  ACTS['dt-paadd'] = function (a, i) { var q = dtEdK().kt.cau[+i]; q.pa.push(''); dtDirty(); dtRe(); };
  ACTS['dt-padel'] = function (a, i) { var q = dtEdK().kt.cau[+i], j = +a.getAttribute('data-j'); q.pa.splice(j, 1); q.dung = (q.dung || []).filter(function (x) { return x !== j; }).map(function (x) { return x > j ? x - 1 : x; }); dtDirty(); dtRe(); };
  ACTS['dt-var'] = function (a, v) {
    var ta = PS.dt.lastTa && document.body.contains(PS.dt.lastTa) ? PS.dt.lastTa : $('.dt-nd'); if (!ta) return;
    var s = ta.selectionStart || ta.value.length, ins = v === 'so_do_to_chuc' ? '\n{{so_do_to_chuc}}\n' : '{{' + v + '}}';
    ta.value = ta.value.slice(0, s) + ins + ta.value.slice(ta.selectionEnd || s); ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length; ta.dispatchEvent(new Event('input', { bubbles: true }));
  };
  function dtCheck(k) {
    var er = [];
    if (!String(k.ten || '').trim()) er.push('Chưa có tên khóa học');
    if (!k.bai.length) er.push('Khóa học cần ít nhất 1 bài');
    k.bai.forEach(function (b, i) { if (!String(b.t || '').trim()) er.push('Bài ' + (i + 1) + ' chưa có tên'); if (b.loai === 'doc' && !String(b.nd || '').trim()) er.push('Bài ' + (i + 1) + ' chưa có nội dung'); if (b.loai !== 'doc' && b.url && !/^https?:\/\//.test(b.url)) er.push('Bài ' + (i + 1) + ': link cần bắt đầu bằng https://'); });
    if (k.kt.on) {
      if (!k.kt.cau.length) er.push('Bài kiểm tra chưa có câu hỏi (hoặc bỏ tích "Có bài kiểm tra")');
      k.kt.cau.forEach(function (q, i) {
        var n = 'Câu ' + (i + 1); if (!String(q.hoi || '').trim()) er.push(n + ' chưa có nội dung câu hỏi');
        if (q.loai !== 'tl') { var pa = (q.pa || []).filter(function (p) { return String(p).trim(); }); if (pa.length < 2) er.push(n + ' cần ít nhất 2 phương án'); if ((q.pa || []).some(function (p) { return !String(p).trim(); })) er.push(n + ' có phương án để trống'); if (!(q.dung || []).length) er.push(n + ' chưa đánh dấu đáp án đúng'); if (q.loai === 'mot' && (q.dung || []).length > 1) er.push(n + ' chọn 1 nhưng có nhiều đáp án đúng'); }
      });
    }
    if (k.xn.on && !String(k.xn.nd || '').trim()) er.push('Chưa có nội dung xác nhận cuối khóa');
    return er;
  }
  ACTS['dt-save'] = function () {
    var ed = PS.dt.ed, k = ed.k, er = dtCheck(k);
    if (er.length) { toast('Chưa lưu được – còn ' + er.length + ' chỗ cần sửa', 'err', er.slice(0, 4).join(' · ') + (er.length > 4 ? ' …' : '')); return; }
    k.ten = k.ten.trim(); k.upd = HR.isoToday(); if (!k.at) k.at = k.upd; k.by = typeof ccUser === 'function' ? ccUser() : '';
    var L = dtKh(), i = L.map(function (x) { return x.id; }).indexOf(k.id);
    if (i >= 0) L[i] = k; else L.push(k);
    PS.dt.ed = null; dtSave((ed.isNew ? 'Tạo khóa ' : 'Sửa khóa ') + k.ten); toast(ed.isNew ? 'Đã tạo khóa học' : 'Đã lưu khóa học', 'ok', k.ten); render(); window.scrollTo(0, 0);
  };
  ACTS['dt-cancel'] = function () { var ed = PS.dt.ed; var leave = function () { PS.dt.ed = null; render(); window.scrollTo(0, 0); }; if (ed && ed.dirty) confirmBox('Bỏ các thay đổi chưa lưu?', 'Nội dung vừa soạn sẽ mất.', 'Bỏ thay đổi', leave); else leave(); };
  ACTS['dt-prev'] = function () { var k = dtEdK(); if (k) dtPlayer(k, null, null, true); };
  ACTS['dt-view'] = function (a, id) { var k = dtById(id); if (k) dtPlayer(k, null, null, true); };

  /* ---------------- Xem thử như nhân viên: học từng bài, làm bài kiểm tra, xác nhận ---------------- */
  function dtPlayer(k, u, e, demo) {
    u = u || selUnits()[0] || S.units[0]; if (!e && u) { var R = refDate(), mat = HR.maternitySet(u.data, R); e = (u.data.NV || []).filter(function (x) { return HR.staffState(x, R, mat) !== 'left' && dtApplies(k, u, x); })[0] || null; }
    var ctx = { u: u, ho_ten: e ? e['Họ và tên'] : '', cong_ty: u ? dtUnitName(u) : '', phong_ban: e ? e['Phòng ban'] : '' };
    var steps = k.bai.map(function (b) { return { t: 'b', b: b }; }); if (k.kt.on && k.kt.cau.length) steps.push({ t: 'kt' }); if (k.xn.on) steps.push({ t: 'xn' }); steps.push({ t: 'end' });
    var st = { i: 0, seen: {}, ans: {}, done: false, res: null, xn: false };
    var m = modal(k.ten, demo ? 'Xem thử như nhân viên' + (e ? ' – ' + e['Họ và tên'] : '') + ' · không lưu kết quả' : '', '<div class="dt-pl"><nav class="dt-nav" id="dtNav"></nav><section class="dt-view" id="dtView"></section></div>');
    m.querySelector('.modal').classList.add('dt-modal');
    function navHtml() {
      return steps.map(function (s, i) {
        var lab = s.t === 'b' ? s.b.t.replace(/\{\{\s*ho_ten\s*\}\}/g, ctx.ho_ten || 'bạn') : s.t === 'kt' ? 'Bài kiểm tra' : s.t === 'xn' ? 'Xác nhận' : 'Hoàn thành';
        var icn = s.t === 'b' ? (s.b.loai === 'video' ? 'dt_play' : s.b.loai === 'link' ? 'dt_link' : 'dt_doc') : s.t === 'kt' ? 'dt_quiz' : s.t === 'xn' ? 'dt_sign' : 'dt_flag';
        var ok = s.t === 'b' ? st.seen[i] : s.t === 'kt' ? !!st.res : s.t === 'xn' ? st.xn : st.done;
        return '<button type="button" class="dt-ni' + (i === st.i ? ' on' : '') + (ok ? ' ok' : '') + '" data-ni="' + i + '">' + ic(ok ? 'dt_ok' : icn, 16) + '<span>' + esc(lab) + '</span></button>';
      }).join('') + '<div class="dt-nprog"><span class="dt-bar"><i style="width:' + Math.round(Object.keys(st.seen).length / k.bai.length * 100) + '%"></i></span><small>' + Object.keys(st.seen).length + '/' + k.bai.length + ' bài</small></div>';
    }
    function viewHtml() {
      var s = steps[st.i], foot = function (next) { return '<div class="dt-vf">' + (st.i ? '<button class="btn" data-pv="-1">← Trước</button>' : '<span></span>') + (next ? '<button class="btn btn-primary" data-pv="1">' + next + '</button>' : '') + '</div>'; };
      if (s.t === 'b') {
        var b = s.b, em = b.loai !== 'doc' ? dtEmbed(b.url) : null, body = '';
        if (b.loai === 'video') body = em && em.src ? '<div class="dt-vid"><iframe src="' + esc(em.src) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" title="' + esc(b.t) + '"></iframe></div>' : b.url ? '<a class="btn btn-primary" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + ic('dt_play', 15) + 'Mở video</a>' : '<div class="dt-ph">' + ic('dt_play', 34) + '<b>Chưa có link video</b><small>Phòng nhân sự dán link ở Kho khóa học → Sửa</small></div>';
        if (b.loai === 'link') body = b.url ? '<a class="dt-lnk" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + ic('dt_link', 20) + '<span><b>' + esc(b.t) + '</b><small>' + esc(b.url.replace(/^https?:\/\//, '').slice(0, 60)) + '</small></span><em>Mở →</em></a>' : '<div class="dt-ph">' + ic('dt_link', 30) + '<b>Chưa có link tài liệu</b></div>';
        return '<div class="dt-vh"><small>Bài ' + (k.bai.indexOf(b) + 1) + '/' + k.bai.length + ' · ' + DT_BT[b.loai] + '</small><h3>' + dtMd(b.t, ctx).replace(/^<p>|<\/p>$/g, '') + '</h3></div>' + body + (b.nd ? '<div class="dt-md">' + dtMd(b.nd, ctx) + '</div>' : '') +
          foot(st.i < steps.length - 1 ? (steps[st.i + 1].t === 'b' ? 'Bài tiếp theo →' : steps[st.i + 1].t === 'kt' ? 'Làm bài kiểm tra →' : 'Tiếp tục →') : '');
      }
      if (s.t === 'kt') {
        if (st.res) { var r = st.res; return '<div class="dt-vh"><small>Bài kiểm tra</small><h3>Kết quả</h3></div><div class="dt-score ' + (r.wait ? 'wait' : r.pct >= k.kt.dat ? 'ok' : 'bad') + '"><b>' + (r.wait ? 'Chờ chấm' : r.pct + '%') + '</b><span>' + (r.wait ? 'Trắc nghiệm đạt ' + r.got + '/' + r.tot + ' điểm · câu tự luận chờ người quản lý chấm' : (r.pct >= k.kt.dat ? 'Đạt' : 'Chưa đạt') + ' · ' + r.got + '/' + r.tot + ' điểm · cần từ ' + k.kt.dat + '%') + '</span></div>' + dtReview(k, st.ans, null) + '<div class="dt-vf"><button class="btn" data-redo="1"' + (k.kt.lai ? '' : ' disabled') + '>Làm lại</button><button class="btn btn-primary" data-pv="1">Tiếp tục →</button></div>'; }
        return '<div class="dt-vh"><small>Bài kiểm tra · ' + k.kt.cau.length + ' câu · đạt từ ' + k.kt.dat + '%</small><h3>Làm bài kiểm tra</h3></div><div class="dt-qz">' + k.kt.cau.map(function (q, qi) {
          var a = st.ans[q.id];
          return '<div class="dt-qi"><div class="dt-qh"><b>Câu ' + (qi + 1) + '.</b> ' + esc(q.hoi) + ' <span class="faint">(' + (q.diem || 1) + ' điểm · ' + (q.loai === 'nhieu' ? 'chọn nhiều' : q.loai === 'mot' ? 'chọn 1' : 'tự luận') + ')</span></div>' +
            (q.loai === 'tl' ? '<textarea class="input" rows="3" data-ta="' + q.id + '" placeholder="Viết câu trả lời của bạn…">' + esc(a || '') + '</textarea>'
              : q.pa.map(function (p, j) { return '<label class="dt-opt"><input type="' + (q.loai === 'mot' ? 'radio' : 'checkbox') + '" name="pq' + q.id + '" data-qa="' + q.id + '" value="' + j + '"' + ((a || []).indexOf(j) >= 0 ? ' checked' : '') + '><span>' + String.fromCharCode(65 + j) + '. ' + esc(p) + '</span></label>'; }).join('')) + '</div>';
        }).join('') + '</div><div class="dt-vf"><button class="btn" data-pv="-1">← Trước</button><button class="btn btn-primary" data-sub="1">Nộp bài</button></div>';
      }
      if (s.t === 'xn') return '<div class="dt-vh"><small>Bước cuối</small><h3>Xác nhận</h3></div><label class="dt-xn"><input type="checkbox" id="dtXn"' + (st.xn ? ' checked' : '') + '><span>' + esc(k.xn.nd) + '</span></label>' + foot('Hoàn thành khóa học');
      var miss = k.bai.length - Object.keys(st.seen).length, ok = !miss && (!k.kt.on || !k.kt.cau.length || st.res) && (!k.xn.on || st.xn);
      st.done = ok;
      return '<div class="dt-end">' + ic(ok ? 'dt_ok' : 'info', 46) + '<h3>' + (ok ? 'Bạn đã hoàn thành khóa học' : 'Còn bước chưa xong') + '</h3><p>' + (ok ? (st.res && st.res.wait ? 'Bài kiểm tra có câu tự luận – kết quả có sau khi người quản lý chấm.' : st.res ? 'Kết quả: ' + st.res.pct + '% – ' + (st.res.pct >= k.kt.dat ? 'Đạt' : 'Chưa đạt') : 'Cảm ơn bạn đã học.') : [miss ? 'còn ' + miss + ' bài chưa xem' : '', k.kt.on && k.kt.cau.length && !st.res ? 'chưa làm bài kiểm tra' : '', k.xn.on && !st.xn ? 'chưa xác nhận' : ''].filter(Boolean).join(', ')) + '</p>' + (demo ? '<p class="faint">Đây là bản xem thử – kết quả không được lưu.</p>' : '') + '<button class="btn btn-primary" data-close>Đóng</button></div>';
    }
    function draw() {
      var s = steps[st.i]; if (s.t === 'b') st.seen[st.i] = 1;
      $('#dtView', m).innerHTML = viewHtml(); $('#dtNav', m).innerHTML = navHtml(); $('#dtView', m).scrollTop = 0;
      $$('[data-ta]', m).forEach(function (t) { t.addEventListener('input', function () { st.ans[t.getAttribute('data-ta')] = t.value; }); });
      $$('[data-qa]', m).forEach(function (c) { c.addEventListener('change', function () { var q = c.getAttribute('data-qa'); st.ans[q] = $$('[data-qa="' + q + '"]', m).filter(function (x) { return x.checked; }).map(function (x) { return +x.value; }); }); });
      var xn = $('#dtXn', m); if (xn) xn.addEventListener('change', function () { st.xn = xn.checked; $('#dtNav', m).innerHTML = navHtml(); });
    }
    m.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-ni],[data-pv],[data-sub],[data-redo]'); if (!t) return;
      if (t.hasAttribute('data-ni')) st.i = +t.getAttribute('data-ni');
      else if (t.hasAttribute('data-pv')) st.i = Math.max(0, Math.min(steps.length - 1, st.i + +t.getAttribute('data-pv')));
      else if (t.hasAttribute('data-sub')) {
        var miss = k.kt.cau.filter(function (q) { var a = st.ans[q.id]; return q.loai === 'tl' ? !String(a || '').trim() : !(a || []).length; });
        if (miss.length) { toast('Còn ' + miss.length + ' câu chưa trả lời', 'info', 'Câu ' + miss.map(function (q) { return k.kt.cau.indexOf(q) + 1; }).join(', ')); return; }
        st.res = dtScore(k, st.ans, null);
      } else if (t.hasAttribute('data-redo')) { st.res = null; st.ans = {}; }
      draw();
    });
    draw();
  }
  // Xem lại bài làm (dùng cho xem thử và chấm bài)
  function dtReview(k, ans, tl) {
    return '<div class="dt-rv">' + (k.kt.cau || []).map(function (q, qi) {
      var a = ans ? ans[q.id] : null;
      if (q.loai === 'tl') { var g = tl && tl[q.id]; return '<div class="dt-rvi"><b>Câu ' + (qi + 1) + '.</b> ' + esc(q.hoi) + '<div class="dt-rva">' + (a ? esc(a) : '<span class="faint">(chưa trả lời)</span>') + '</div>' + (g && g.d !== undefined && g.d !== '' ? '<small class="ok">Chấm ' + g.d + '/' + (q.diem || 1) + (g.nx ? ' · ' + esc(g.nx) : '') + '</small>' : '<small class="warn">Tự luận – chờ chấm</small>') + '</div>'; }
      var ok = (q.dung || []).slice().sort().join(',') === (a || []).slice().sort().join(',');
      return '<div class="dt-rvi ' + (ok ? 'ok' : 'bad') + '"><b>Câu ' + (qi + 1) + '.</b> ' + esc(q.hoi) + ' <span class="tag ' + (ok ? 'tag-ok' : 'tag-bad') + '">' + (ok ? 'Đúng' : 'Sai') + '</span><ul>' + q.pa.map(function (p, j) { var my = (a || []).indexOf(j) >= 0, cr = (q.dung || []).indexOf(j) >= 0; return '<li class="' + (cr ? 'cr' : '') + (my ? ' my' : '') + '">' + String.fromCharCode(65 + j) + '. ' + esc(p) + (my ? ' <em>(đã chọn)</em>' : '') + (cr ? ' ✓' : '') + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>';
  }

  /* ---------------- Trang Theo dõi học tập ---------------- */
  PAGES.dtketqua = function () {
    var f = ps('dtk', { co: '', pb: '', kh: '', st: '', q: '', view: 'list' }), R = refDate(), us = selUnits(), multi = us.length > 1;
    var base = dtRows(us, R).filter(function (x) { return (!f.co || x.u.id === f.co) && (!f.pb || (x.e['Phòng ban'] || '') === f.pb) && (!f.kh || x.k.id === f.kh); });
    var cnt = { all: base.length, dat: 0, hoc: 0, chua: 0, cho: 0, late: 0, khong: 0 }; base.forEach(function (x) { if (x.late) cnt.late++; if (x.st === 'dat') cnt.dat++; else if (x.st === 'cho') cnt.cho++; else if (x.st === 'hoc') cnt.hoc++; else if (x.st === 'khong' || x.st === 'lai') cnt.khong++; else cnt.chua++; });
    var q = norm(f.q || ''), rows = base.filter(function (x) {
      if (f.st === 'late' ? !x.late : f.st === 'khong' ? (x.st !== 'khong' && x.st !== 'lai') : f.st && x.st !== f.st) return false;
      return !q || norm(x.e['Họ và tên'] + ' ' + x.id).indexOf(q) >= 0;
    }).sort(function (a, b) { return (b.late - a.late) || ((a.st === 'cho' ? 0 : 1) - (b.st === 'cho' ? 0 : 1)) || String(a.due || '9').localeCompare(String(b.due || '9')) || a.e['Họ và tên'].localeCompare(b.e['Họ và tên']); });
    var tiles = [['', cnt.all, 'lượt cần học', ''], ['dat', cnt.dat, 'đã đạt', 'ok'], ['hoc', cnt.hoc, 'đang học', 'info'], ['chua', cnt.chua, 'chưa bắt đầu', ''], ['cho', cnt.cho, 'bài chờ chấm', cnt.cho ? 'warn' : ''], ['khong', cnt.khong, 'chưa đạt, cần học lại', cnt.khong ? 'warn' : ''], ['late', cnt.late, 'quá hạn', cnt.late ? 'bad' : '']];
    var tl = '<div class="anv-k dt-k">' + tiles.map(function (t) { return '<button class="anv-t ' + t[3] + (f.st === t[0] ? ' on' : '') + '" data-act="dtk-st" data-id="' + t[0] + '"><b>' + t[1] + '</b><span>' + t[2] + '</span></button>'; }).join('') + '</div>';
    var pbs = {}; dtRows(us, R).forEach(function (x) { if (x.e['Phòng ban']) pbs[x.e['Phòng ban']] = 1; });
    var sel = function (id, lab, opts, v) { return '<select class="input" id="' + id + '" aria-label="' + lab + '">' + dtOpts(opts, v) + '</select>'; };
    var bar = '<div class="anv-bar"><input class="input" id="dtkQ" placeholder="Tìm tên, mã NV" value="' + esc(f.q || '') + '">' + (multi ? sel('dtkCo', 'Công ty', [['', 'Tất cả công ty']].concat(us.map(function (u) { return [u.id, shortUnit(u.name)]; })), f.co) : '') +
      sel('dtkPb', 'Phòng ban', [['', 'Tất cả phòng ban']].concat(Object.keys(pbs).sort().map(function (x) { return [x, x]; })), f.pb) + sel('dtkKh', 'Khóa học', [['', 'Tất cả khóa học']].concat(dtKh().filter(function (k) { return k.on; }).map(function (k) { return [k.id, k.ten]; })), f.kh) +
      '<span class="sp"></span><div class="hn-tabs"><button class="' + (f.view !== 'mx' ? 'on' : '') + '" data-act="dtk-view" data-id="list">' + ic('hn_tbl', 15) + 'Danh sách</button><button class="' + (f.view === 'mx' ? 'on' : '') + '" data-act="dtk-view" data-id="mx">' + ic('td_cols', 15) + 'Theo người</button></div><button class="btn btn-sm" data-act="dtk-xl">' + ic('xuat', 14) + 'Xuất Excel</button></div>';
    var stTag = function (x) { var s = DT_ST[x.st] || DT_ST.chua; return '<span class="tag tag-' + s[1] + '">' + s[0] + '</span>' + (x.late ? ' <span class="tag tag-bad">Quá hạn ' + (-x.days) + ' ngày</span>' : ''); };
    var body;
    if (f.view === 'mx') {
      var ks = dtKh().filter(function (k) { return k.on && (!f.kh || k.id === f.kh) && rows.some(function (x) { return x.k.id === k.id; }); }), ppl = {}, ord = [];
      rows.forEach(function (x) { var key = x.u.id + '|' + x.id; if (!ppl[key]) { ppl[key] = { u: x.u, e: x.e, id: x.id, c: {} }; ord.push(key); } ppl[key].c[x.k.id] = x; });
      ord.sort(function (a, b) { return ppl[a].e['Họ và tên'].localeCompare(ppl[b].e['Họ và tên']); });
      var cols = [['Nhân sự', 220, '']].concat(ks.map(function (k) { return [esc(k.ten.length > 28 ? k.ten.slice(0, 27) + '…' : k.ten), 150, 'c', k.ten]; }));
      body = ord.length ? '<div class="hn-tw hn-gw">' + hnGridOpen('dtmx', cols, 'dt-g') + '<tbody>' + ord.map(function (key) {
        var p = ppl[key];
        return '<tr><td>' + personLink(p.u, p.id, p.e['Họ và tên']) + '<div class="anv-sub">' + esc(p.id + ' · ' + (p.e['Phòng ban'] || '') + (multi ? ' · ' + shortUnit(p.u.name) : '')) + '</div></td>' + ks.map(function (k) { var x = p.c[k.id]; if (!x) return '<td class="c faint">—</td>'; var s = DT_ST[x.st]; return '<td class="c"><button class="dt-cell st-' + x.st + (x.late ? ' dt-lt' : '') + '" data-act="dtk-one" data-u="' + x.u.id + '" data-id="' + esc(x.id) + '" data-k="' + k.id + '" title="' + esc(s[0] + (x.late ? ' · quá hạn' : '') + (x.r && x.r.pct != null && x.st !== 'cho' ? ' · ' + x.r.pct + '%' : '')) + '">' + s[0] + (x.r && x.r.pct != null && (x.st === 'dat' || x.st === 'khong') ? ' · ' + x.r.pct + '%' : '') + '</button></td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' + hnGridFoot('dtmx') : '<div class="card card-pad"><p class="muted" style="margin:0">Không có ai ở mục này.</p></div>';
    } else {
      var cols2 = [['Nhân sự', 210, '']].concat(multi ? [['Công ty', 110, '']] : []).concat([['Khóa học', 230, ''], ['Hạn', 120, ''], ['Tiến độ', 150, ''], ['Kết quả', 170, ''], ['', 150, '']]);
      body = rows.length ? '<div class="hn-tw hn-gw">' + hnGridOpen('dtls', cols2, 'dt-g') + '<tbody>' + rows.slice(0, 500).map(function (x) {
        var r = x.r || {}, nb = (r.bai || []).length, k = x.k;
        var kq = x.st === 'cho' ? 'Trắc nghiệm xong · chờ chấm tự luận' : r.pct != null ? '<b>' + r.pct + '%</b> · ' + r.diem + '/' + dtPts(k) + ' điểm' + (r.lan > 1 ? ' · lần ' + r.lan : '') : '<span class="faint">—</span>';
        return '<tr' + (x.late ? ' class="dt-late"' : '') + '><td>' + personLink(x.u, x.id, x.e['Họ và tên']) + '<div class="anv-sub">' + esc(x.id + ' · ' + (x.e['Phòng ban'] || '')) + '</div></td>' + (multi ? '<td>' + esc(shortUnit(x.u.name)) + '</td>' : '') +
          '<td><span class="dt-dot" style="background:' + (k.mau_c || DT_COL[0]) + '"></span>' + esc(k.ten) + (k.bb ? '' : ' <span class="faint">(tự chọn)</span>') + '</td>' +
          '<td>' + (x.due ? vn(x.due) + '<div class="anv-sub' + (x.late ? ' down' : '') + '">' + (x.st === 'dat' ? 'đã xong' : x.days < 0 ? 'quá ' + (-x.days) + ' ngày' : x.days === 0 ? 'hôm nay' : 'còn ' + x.days + ' ngày') + '</div>' : '<span class="faint">Không hạn</span>') + '</td>' +
          '<td>' + stTag(x) + '<div class="anv-sub">' + (x.st === 'chua' ? 'chưa mở bài nào' : nb + '/' + k.bai.length + ' bài' + (r.xn ? ' · đã xác nhận' : '')) + '</div></td>' +
          '<td>' + kq + (r.xong ? '<div class="anv-sub">nộp ' + vn(r.xong) + '</div>' : '') + '</td>' +
          '<td><span class="anv-acts">' + (x.st === 'cho' ? '<button class="btn btn-sm btn-primary" data-act="dtk-cham" data-u="' + x.u.id + '" data-id="' + esc(x.id) + '" data-k="' + k.id + '">Chấm bài</button>' : '') + '<button class="btn btn-sm" data-act="dtk-one" data-u="' + x.u.id + '" data-id="' + esc(x.id) + '" data-k="' + k.id + '">Chi tiết</button></span></td></tr>';
      }).join('') + '</tbody></table></div>' + hnGridFoot('dtls') + (rows.length > 500 ? '<p class="faint">Hiện 500/' + rows.length + ' dòng – lọc thêm để xem hết.</p>' : '') : '<div class="card card-pad"><p class="muted" style="margin:0">Không có lượt học nào ở mục này.</p></div>';
    }
    return pageHead('Theo dõi học tập', 'Ai phải học khóa nào, đã học đến đâu, kết quả bài kiểm tra · tính đến ' + vn(R), '<button class="btn" data-go="dtkhoa">' + ic('dtkhoa', 15) + 'Kho khóa học</button>') + tl + bar + body +
      '<div class="notice" style="margin-top:14px">' + ic('info') + '<div>Danh sách tự tính từ phạm vi giao của từng khóa và nhân sự đang làm. Người học ngoài app (học trực tiếp) – bấm <b>Chi tiết → Ghi nhận đã hoàn thành</b>. Khóa có <b>học lại định kỳ</b> tự chuyển sang "Cần học lại" khi đến kỳ.</div></div>';
  };
  BINDS.dtketqua = function () {
    hnBindGrids();
    [['dtkCo', 'co'], ['dtkPb', 'pb'], ['dtkKh', 'kh']].forEach(function (m) { var el = $('#' + m[0]); if (el) el.addEventListener('change', function () { PS.dtk[m[1]] = el.value; if (m[0] === 'dtkCo') PS.dtk.pb = ''; render(); }); });
    var q = $('#dtkQ'); if (q) { var t = 0; q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { PS.dtk.q = q.value; var pos = q.selectionStart; render(); var q2 = $('#dtkQ'); if (q2) { q2.focus(); q2.selectionStart = q2.selectionEnd = pos; } }, 250); }); }
  };
  ACTS['dtk-st'] = function (a, id) { PS.dtk.st = PS.dtk.st === id ? '' : id; render(); };
  ACTS['dtk-view'] = function (a, id) { PS.dtk.view = id; render(); };
  ACTS['dtk-xl'] = function () {
    var f = PS.dtk, R = refDate(), us = selUnits(), multi = us.length > 1;
    var rows = dtRows(us, R).filter(function (x) { return (!f.co || x.u.id === f.co) && (!f.pb || (x.e['Phòng ban'] || '') === f.pb) && (!f.kh || x.k.id === f.kh); });
    saveXlsx([{ name: 'Hoc tap', title: 'THEO DÕI HỌC TẬP – ĐÀO TẠO NỘI BỘ', note: 'Tính đến ' + vn(R), cols: [{ t: 'Mã NV' }, { t: 'Họ và tên' }, { t: 'Phòng ban' }].concat(multi ? [{ t: 'Công ty' }] : []).concat([{ t: 'Khóa học' }, { t: 'Bắt buộc' }, { t: 'Hạn' }, { t: 'Trạng thái' }, { t: 'Quá hạn' }, { t: 'Số bài đã học' }, { t: 'Điểm (%)' }, { t: 'Ngày nộp' }, { t: 'Xác nhận lúc' }]),
      rows: rows.map(function (x) { var r = x.r || {}; return [x.id, x.e['Họ và tên'], x.e['Phòng ban'] || ''].concat(multi ? [shortUnit(x.u.name)] : []).concat([x.k.ten, x.k.bb ? 'Có' : '', x.due ? vn(x.due) : '', DT_ST[x.st][0], x.late ? 'Quá ' + (-x.days) + ' ngày' : '', (r.bai || []).length + '/' + x.k.bai.length, r.pct != null && x.st !== 'cho' ? r.pct : '', r.xong ? vn(r.xong) : '', r.xn ? vn(r.xn) : '']); }) }], 'Theo_doi_hoc_tap.xlsx');
  };
  function dtFind(a) { var u = unitById(a.getAttribute('data-u')), id = a.getAttribute('data-id'), k = dtById(a.getAttribute('data-k')); if (!u || !k) return null; var e = nvIndex(u)[id]; if (!e) return null; return dtRow(u, e, k, refDate()); }
  ACTS['dtk-one'] = function (a) {
    var x = dtFind(a); if (!x) return; var r = x.r || {}, k = x.k, s = DT_ST[x.st];
    var row = function (l, v) { return '<div class="anv-ir"><span>' + l + '</span><div>' + v + '</div></div>'; };
    var m = modal(x.e['Họ và tên'] + ' – ' + k.ten, x.id + ' · ' + (x.e['Phòng ban'] || '') + ' · ' + shortUnit(x.u.name), '<div class="anv-info">' +
      row('Trạng thái', '<span class="tag tag-' + s[1] + '">' + s[0] + '</span>' + (x.late ? ' <span class="tag tag-bad">Quá hạn ' + (-x.days) + ' ngày</span>' : '')) +
      row('Hạn hoàn thành', x.due ? vn(x.due) : 'Không hạn') + row('Bắt đầu học', r.bd ? vn(r.bd) : '—') +
      row('Bài đã học', (r.bai || []).length + '/' + k.bai.length + ' bài') +
      (k.kt.on ? row('Bài kiểm tra', r.ans ? (x.st === 'cho' ? 'Đã nộp ' + (r.xong ? vn(r.xong) : '') + ' · chờ chấm tự luận' : '<b>' + r.pct + '%</b> (' + r.diem + '/' + dtPts(k) + ' điểm, đạt từ ' + k.kt.dat + '%)' + (r.lan > 1 ? ' · làm ' + r.lan + ' lần' : '') + (r.xong ? ' · nộp ' + vn(r.xong) : '')) : 'Chưa làm') : '') +
      (k.xn.on ? row('Xác nhận', r.xn ? '✓ ' + vn(r.xn) + '<small>' + esc(k.xn.nd) + '</small>' : 'Chưa xác nhận') : '') +
      (r.tay ? row('Ghi chú', 'Ghi nhận hoàn thành ngoài app bởi ' + esc(r.tay) + (r.ghi ? ' – ' + esc(r.ghi) : '')) : '') + '</div>' +
      (r.ans && k.kt.on ? '<h4 style="margin:16px 0 6px">Bài làm</h4>' + dtReview(k, r.ans, r.tl) : '') +
      '<div class="anv-ifoot">' + (x.st !== 'chua' ? '<button class="btn btn-danger-soft" id="dtReset">Cho học lại từ đầu</button>' : '') + '<span class="sp"></span>' + (x.st === 'cho' ? '<button class="btn btn-primary" id="dtCham">Chấm bài</button>' : '') + (x.st !== 'dat' ? '<button class="btn" id="dtTay">Ghi nhận đã hoàn thành</button>' : '') + '<button class="btn" data-close>Đóng</button></div>');
    var ch = $('#dtCham', m); if (ch) ch.addEventListener('click', function () { m.close(); ACTS['dtk-cham'](a); });
    var rs = $('#dtReset', m); if (rs) rs.addEventListener('click', function () { confirmBox('Cho ' + x.e['Họ và tên'] + ' học lại khóa này?', 'Xóa tiến độ, bài làm và kết quả cũ của khóa này; nhân viên học lại từ đầu.', 'Cho học lại', function () { delete (dtOf(x.u).kq[x.id] || {})[k.id]; dtSave('Cho học lại: ' + x.e['Họ và tên'] + ' – ' + k.ten); m.close(); toast('Đã đặt lại – nhân viên học lại từ đầu', 'ok'); render(); }); });
    var ty = $('#dtTay', m); if (ty) ty.addEventListener('click', function () {
      var m2 = modal('Ghi nhận đã hoàn thành', x.e['Họ và tên'] + ' – ' + k.ten, '<p style="margin-top:0">Dùng khi nhân viên đã học trực tiếp hoặc ngoài app. Kết quả ghi là <b>Đạt</b>.</p><div class="field"><label>Ngày hoàn thành</label>' + dateInput('dtTayD', HR.isoToday()) + '</div><div class="field"><label>Ghi chú</label><input class="input" id="dtTayG" placeholder="Ví dụ: học trực tiếp buổi 10/11"></div><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="dtTayOk">Ghi nhận</button></div>', true);
      $('#dtTayOk', m2).addEventListener('click', function () { var d = HR.parseVn($('#dtTayD', m2).value); if (!d) { toast('Ngày chưa đúng dạng dd/mm/yyyy', 'err'); return; } var kq = dtOf(x.u).kq; (kq[x.id] = kq[x.id] || {})[k.id] = { st: 'dat', bd: (r.bd || d), xong: d, bai: k.bai.map(function (b) { return b.id; }), pct: 100, diem: dtPts(k), tay: typeof ccUser === 'function' ? ccUser() : 'Quản trị viên', ghi: $('#dtTayG', m2).value.trim(), xn: k.xn.on ? d : '' }; dtSave('Ghi nhận hoàn thành: ' + x.e['Họ và tên'] + ' – ' + k.ten); m2.close(); m.close(); toast('Đã ghi nhận hoàn thành', 'ok'); render(); });
    });
  };
  // Chấm câu tự luận
  ACTS['dtk-cham'] = function (a) {
    var x = dtFind(a); if (!x || !x.r) return; var r = x.r, k = x.k, sc0 = dtScore(k, r.ans, null);
    var Q = k.kt.cau.filter(function (q) { return q.loai === 'tl'; });
    var m = modal('Chấm bài – ' + x.e['Họ và tên'], k.ten + ' · nộp ' + (r.xong ? vn(r.xong) : ''), '<p class="dt-help" style="margin-top:0">Phần trắc nghiệm đã tự chấm: <b>' + sc0.got + '</b> điểm. Chấm ' + Q.length + ' câu tự luận dưới đây – đạt khi tổng từ <b>' + k.kt.dat + '%</b> của ' + dtPts(k) + ' điểm.</p>' +
      Q.map(function (q) { var g = (r.tl || {})[q.id] || {}; return '<div class="dt-cham"><div class="dt-qh"><b>Câu ' + (k.kt.cau.indexOf(q) + 1) + '.</b> ' + esc(q.hoi) + ' <span class="faint">(' + (q.diem || 1) + ' điểm)</span></div><div class="dt-rva">' + (r.ans && r.ans[q.id] ? esc(r.ans[q.id]) : '<span class="faint">(không trả lời)</span>') + '</div>' + (q.goi_y ? '<div class="dt-gy"><b>Gợi ý đáp án:</b> ' + esc(q.goi_y) + '</div>' : '') +
        '<div class="dt-2"><div class="field"><label>Điểm (0 – ' + (q.diem || 1) + ')</label><input class="input num" type="number" min="0" max="' + (q.diem || 1) + '" step="0.5" data-cd="' + q.id + '" value="' + (g.d !== undefined ? g.d : '') + '"></div><div class="field"><label>Nhận xét</label><input class="input" data-cn="' + q.id + '" value="' + esc(g.nx || '') + '" placeholder="Không bắt buộc"></div></div></div>'; }).join('') +
      '<div class="dt-chsum" id="dtChS"></div><div class="link-row" style="justify-content:flex-end"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="dtChOk">Lưu điểm</button></div>');
    function tmp() { var tl = {}; Q.forEach(function (q) { var v = $('[data-cd="' + q.id + '"]', m).value; tl[q.id] = { d: v === '' ? '' : Math.min(+q.diem || 1, Math.max(0, +v)), nx: $('[data-cn="' + q.id + '"]', m).value.trim() }; }); return tl; }
    function sum() { var s = dtScore(k, r.ans, tmp()); $('#dtChS', m).innerHTML = s.wait ? 'Còn câu chưa chấm' : 'Tổng: <b>' + s.got + '/' + s.tot + '</b> điểm = <b>' + s.pct + '%</b> → <span class="tag ' + (s.pct >= k.kt.dat ? 'tag-ok">Đạt' : 'tag-bad">Chưa đạt') + '</span>'; }
    $$('[data-cd]', m).forEach(function (i) { i.addEventListener('input', sum); }); sum();
    $('#dtChOk', m).addEventListener('click', function () { var tl = tmp(); if (Q.some(function (q) { return tl[q.id].d === ''; })) { toast('Chấm đủ điểm các câu tự luận', 'info'); return; } r.tl = tl; r.cham = (typeof ccUser === 'function' ? ccUser() : '') + ' · ' + HR.isoToday(); dtFinal(k, r); dtSave('Chấm bài ' + x.e['Họ và tên'] + ' – ' + k.ten + ': ' + r.pct + '%'); m.close(); toast('Đã lưu điểm: ' + r.pct + '% – ' + (r.st === 'dat' ? 'Đạt' : 'Chưa đạt'), 'ok'); render(); });
  };

  /* ---------------- Nhắc ở Việc cần xử lý ---------------- */
  Object.assign(HRR.KINDS, { dt_late: { name: 'Khóa đào tạo bắt buộc quá hạn', law: '' }, dt_cham: { name: 'Bài kiểm tra chờ chấm', law: '' } });
  if (typeof AL_FIX !== 'undefined') { AL_FIX.dt_late = ['Xem người quá hạn', 'go:dtketqua']; AL_FIX.dt_cham = ['Chấm bài', 'go:dtketqua']; }
  // Bấm nút xử lý ở Việc cần xử lý → mở Theo dõi học tập đã lọc sẵn đúng khóa, đúng trạng thái
  if (ACTS['al-fix']) { var _dtFix = ACTS['al-fix']; ACTS['al-fix'] = function (b) { try { var a = findAlert(b.getAttribute('data-key')); if (a && (a.kind === 'dt_late' || a.kind === 'dt_cham')) { var f = ps('dtk', { co: '', pb: '', kh: '', st: '', q: '', view: 'list' }), p = String(a.key).split('||')[1] || ''; f.kh = p.split('/')[a.kind === 'dt_late' ? 0 : 1] || ''; f.st = a.kind === 'dt_late' ? 'late' : 'cho'; f.co = ''; f.pb = ''; f.q = ''; f.view = 'list'; } } catch (e) { } return _dtFix.apply(this, arguments); }; }
  var DTA = { key: null, list: [] };
  function dtAlerts() {
    var R = refDate(), out = [], grp = {};
    dtRows(selUnits(), R).forEach(function (x) {
      if (x.late && x.k.bb) { var g = x.u.id + '|' + x.k.id; (grp[g] = grp[g] || { u: x.u, k: x.k, L: [] }).L.push(x); }
      if (x.st === 'cho') out.push({ kind: 'dt_cham', level: 'nhac', id: x.id, name: x.e['Họ và tên'], dept: x.e['Phòng ban'], unit: x.u.name, unitId: x.u.id, title: x.e['Họ và tên'] + ' đã nộp bài "' + x.k.ten + '" – chờ chấm câu tự luận', detail: 'Nộp ' + (x.r.xong ? vn(x.r.xong) : '') + ' · Đào tạo nội bộ → Theo dõi học tập → Chấm bài', key: x.u.id + '|dt_cham||' + x.id + '/' + x.k.id, sources: ['Đào tạo nội bộ'] });
    });
    // khóa bắt buộc quá hạn: gộp theo khóa + công ty để không tràn danh sách việc
    Object.keys(grp).forEach(function (g) {
      var G = grp[g], L = G.L.sort(function (a, b) { return a.days - b.days; }), worst = L[0];
      out.push({ kind: 'dt_late', level: worst.days <= -7 ? 'gap' : 'canh', id: L.length === 1 ? worst.id : '', name: L.length === 1 ? worst.e['Họ và tên'] : L.length + ' người', dept: L.length === 1 ? worst.e['Phòng ban'] : '', unit: G.u.name, unitId: G.u.id,
        title: 'Khóa "' + G.k.ten + '": ' + (L.length === 1 ? worst.e['Họ và tên'] + ' quá hạn ' + (-worst.days) + ' ngày' : L.length + ' người quá hạn'), detail: L.slice(0, 6).map(function (x) { return x.e['Họ và tên'] + ' (' + (-x.days) + ' ngày)'; }).join(', ') + (L.length > 6 ? '…' : '') + ' · Đào tạo nội bộ → Theo dõi học tập',
        key: G.u.id + '|dt_late||' + G.k.id, days: worst.days, due: worst.due, sources: ['Đào tạo nội bộ'] });
    });
    return out;
  }
  var _dtAlertBase = alertList;
  alertList = function () { var base = _dtAlertBase(), k = ACACHE.key + '#' + DTV + '#' + refDate() + '#' + selUnits().map(function (u) { return u.id; }).join(','); if (DTA.key !== k) { try { DTA = { key: k, list: dtAlerts() }; } catch (e) { logErr('Tính cảnh báo đào tạo', e); DTA = { key: k, list: [] }; } } return base.concat(DTA.list); };

  /* ---------------- Giao diện ---------------- */
  (function () {
    var css = [
      '.dt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px;margin-top:4px}',
      '.dt-card{position:relative;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm,0 1px 2px rgba(0,0,0,.04))}.dt-card.off{opacity:.62}',
      '.dt-cbar{height:8px;background:linear-gradient(90deg,var(--dc),color-mix(in srgb,var(--dc) 55%,#fff))}.dt-cb{padding:14px 16px 14px;display:flex;flex-direction:column;gap:8px;flex:1}',
      '.dt-ctags{display:flex;gap:5px;flex-wrap:wrap}.dt-card h3{margin:2px 0 0;font-size:16px;line-height:1.35;color:var(--ink)}.dt-cmo{margin:0;font-size:13px;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '.dt-cmeta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px;color:var(--ink-2)}.dt-cmeta span{display:inline-flex;gap:5px;align-items:center}.dt-cmeta svg{color:var(--dc)}',
      '.dt-cfor{font-size:12.5px;color:var(--muted)}.dt-cfor b{color:var(--ink-2);font-weight:600}',
      '.dt-cprog{display:flex;flex-direction:column;gap:5px;border:0;background:var(--surface-2);border-radius:10px;padding:8px 10px;text-align:left;font:inherit;font-size:12.5px;color:var(--ink-2);cursor:pointer;margin-top:auto}.dt-cprog:hover{background:var(--pri-soft)}.dt-cprog em{font-style:normal;font-weight:600}.dt-cprog em.down{color:var(--danger)}.dt-cprog em.warn{color:#9A6200}',
      '.dt-bar{display:block;height:6px;border-radius:99px;background:var(--line);overflow:hidden}.dt-bar i{display:block;height:100%;background:var(--dc,var(--pri));border-radius:99px}',
      '.dt-cact{display:flex;gap:6px;align-items:center}.dt-cact .sp{flex:1}.dt-ib{padding:5px 7px;min-width:32px;justify-content:center}.dt-del:hover{color:var(--danger);border-color:var(--danger)}',
      '.dt-add{align-items:center;justify-content:center;gap:6px;border:2px dashed var(--line-2);background:transparent;min-height:220px;cursor:pointer;color:var(--muted);font:inherit;box-shadow:none}.dt-add:hover{border-color:var(--pri);color:var(--pri-ink);background:var(--pri-soft)}.dt-add b{color:var(--ink-2);font-size:15px}.dt-add small{max-width:220px;text-align:center}',
      '.dt-ed{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}.dt-main{display:flex;flex-direction:column;gap:14px}.dt-side{position:sticky;top:76px;display:flex;flex-direction:column;gap:10px}.dt-side h3{margin:0}',
      '.dt-sh{margin:0 0 10px;font-size:15px}.dt-shr{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}.dt-shr .dt-sh{margin:0}.dt-add2{display:flex;gap:6px;flex-wrap:wrap}',
      '.dt-help{font-size:12.5px;color:var(--muted);margin:0 0 10px;line-height:1.7}.dt-help code{background:var(--surface-2);border-radius:5px;padding:1px 5px;font-size:12px}',
      '.dt-blk{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:10px;display:flex;flex-direction:column;gap:8px;background:var(--surface)}.dt-blk .field{margin:0}',
      '.dt-bh{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.dt-num{width:26px;height:26px;border-radius:50%;background:var(--pri-soft);color:var(--pri-ink);display:grid;place-items:center;font-weight:700;font-size:12.5px;flex:none}.dt-num.q{background:#FFF1D6;color:#7A4E05}',
      '.dt-bt{flex:1;min-width:160px;font-weight:600}.dt-bsel{width:auto;min-width:170px}.dt-mv{display:flex;gap:4px;margin-left:auto}.dt-mv .btn{min-width:30px;padding:4px 8px}',
      '.dt-emb{display:block;margin-top:4px;font-size:12px;color:var(--muted)}.dt-emb .ok{color:var(--ok,#2E7D32);font-weight:600}.dt-emb .down{color:var(--danger)}',
      '.dt-pt{display:inline-flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted)}.dt-pt .input{width:70px}',
      '.dt-pa{display:flex;flex-direction:column;gap:6px}.dt-pai{display:flex;gap:8px;align-items:center;border-radius:10px;padding:2px 4px}.dt-pai.ok{background:color-mix(in srgb,var(--pri-soft) 70%,transparent)}.dt-pai label{display:inline-flex;gap:4px;align-items:center;font-size:12px;color:var(--muted);cursor:pointer;min-width:62px}.dt-pai.ok label{color:var(--pri-ink);font-weight:700}.dt-pai .input{flex:1}',
      '.dt-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.dt-in{display:inline-flex;gap:6px;align-items:center}.dt-in .input{width:90px}',
      '.dt-chips{display:flex;flex-wrap:wrap;gap:5px}.dt-chip{display:inline-flex;align-items:center;border:1px solid var(--line-2);border-radius:99px;padding:3px 10px;font-size:12.5px;cursor:pointer;background:var(--surface);color:var(--ink-2)}.dt-chip input{display:none}.dt-chip.on{background:var(--pri-soft);border-color:var(--pri);color:var(--pri-ink);font-weight:600}',
      '.dt-det summary{cursor:pointer;font-size:13px;font-weight:600;color:var(--ink-2);margin-bottom:6px}.dt-det .dt-chips{max-height:220px;overflow:auto;padding:2px}.dt-cnt{background:var(--surface-2);border-radius:10px;padding:8px 10px;font-size:13px}.dt-sbtn{display:flex;gap:6px;flex-wrap:wrap}.dt-sbtn .btn-primary{flex:1}',
      '.dt-cols{display:flex;gap:8px}.dt-colb{width:28px;height:28px;border-radius:50%;border:3px solid var(--surface);box-shadow:0 0 0 1px var(--line-2);cursor:pointer}.dt-colb.on{box-shadow:0 0 0 2px var(--ink)}',
      '.dt-modal{max-width:1040px!important;width:calc(100vw - 32px)}.dt-pl{display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px;min-height:60vh}',
      '.dt-nav{display:flex;flex-direction:column;gap:3px;border-right:1px solid var(--line);padding-right:12px}.dt-ni{display:flex;gap:8px;align-items:center;text-align:left;border:0;background:none;border-radius:9px;padding:7px 8px;font:inherit;font-size:13px;color:var(--ink-2);cursor:pointer}.dt-ni:hover{background:var(--surface-2)}.dt-ni.on{background:var(--pri-soft);color:var(--pri-ink);font-weight:600}.dt-ni.ok svg{color:var(--ok,#2E7D32)}.dt-ni svg{flex:none}',
      '.dt-nprog{margin-top:auto;padding-top:10px;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)}',
      '.dt-view{min-width:0;max-height:68vh;overflow:auto;padding-right:4px}.dt-vh small{color:var(--muted);font-size:12px}.dt-vh h3{margin:2px 0 12px;font-size:19px}',
      '.dt-md{font-size:14.5px;line-height:1.65;color:var(--ink)}.dt-md h3{font-size:17px;margin:14px 0 6px}.dt-md h4{font-size:15px;margin:12px 0 4px}.dt-md p{margin:6px 0}.dt-md ul,.dt-md ol{margin:6px 0;padding-left:22px}.dt-md li{margin:3px 0}.dt-md a{color:var(--pri-ink)}.dt-var{font-weight:inherit}.dt-it{color:var(--muted)}',
      '.dt-org{list-style:none;padding:0!important;display:flex;flex-direction:column;gap:4px}.dt-org li{background:var(--surface-2);border-radius:8px;padding:6px 10px}',
      '.dt-vid{position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000;margin-bottom:10px}.dt-vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
      '.dt-ph{display:flex;flex-direction:column;align-items:center;gap:6px;padding:34px 16px;border:2px dashed var(--line-2);border-radius:12px;color:var(--muted);margin-bottom:10px}.dt-ph b{color:var(--ink-2)}',
      '.dt-lnk{display:flex;gap:12px;align-items:center;border:1px solid var(--line-2);border-radius:12px;padding:12px 14px;text-decoration:none;color:var(--ink);margin-bottom:10px}.dt-lnk:hover{border-color:var(--pri);background:var(--pri-soft)}.dt-lnk span{display:flex;flex-direction:column;flex:1;min-width:0}.dt-lnk small{color:var(--muted)}.dt-lnk em{font-style:normal;color:var(--pri-ink);font-weight:600}',
      '.dt-vf{display:flex;justify-content:space-between;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line)}',
      '.dt-qz{display:flex;flex-direction:column;gap:14px}.dt-qi{border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}.dt-qh{font-size:14px;line-height:1.5}',
      '.dt-opt{display:flex;gap:8px;align-items:flex-start;padding:7px 10px;border-radius:9px;cursor:pointer;border:1px solid transparent}.dt-opt:hover{background:var(--surface-2)}.dt-opt:has(input:checked){background:var(--pri-soft);border-color:var(--pri-soft-2)}.dt-opt input{margin-top:3px}',
      '.dt-score{display:flex;gap:14px;align-items:center;border-radius:14px;padding:14px 16px;margin-bottom:12px;background:var(--surface-2)}.dt-score b{font-size:28px}.dt-score.ok{background:var(--pri-soft);color:var(--pri-ink)}.dt-score.bad{background:#FDE8E6;color:#8C1D18}.dt-score.wait{background:#FFF1D6;color:#7A4E05}',
      '.dt-rv{display:flex;flex-direction:column;gap:8px}.dt-rvi{border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:13.5px}.dt-rvi.ok{border-left:4px solid var(--ok,#2E7D32)}.dt-rvi.bad{border-left:4px solid var(--danger)}.dt-rvi ul{margin:6px 0 0;padding-left:18px}.dt-rvi li.cr{color:var(--ok,#2E7D32);font-weight:600}.dt-rvi li.my:not(.cr){color:var(--danger)}.dt-rvi em{font-style:normal;font-size:12px}.dt-rvi small{display:block;margin-top:4px}.dt-rvi small.ok{color:var(--ok,#2E7D32)}.dt-rvi small.warn{color:#9A6200}',
      '.dt-rva{background:var(--surface-2);border-radius:8px;padding:8px 10px;margin-top:6px;white-space:pre-wrap;font-size:13.5px}',
      '.dt-xn{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line-2);border-radius:12px;padding:14px;font-size:14.5px;cursor:pointer}.dt-xn input{margin-top:4px;transform:scale(1.2)}',
      '.dt-end{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:30px 10px}.dt-end svg{color:var(--pri)}.dt-end h3{margin:4px 0 0}',
      '.dt-cham{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px}.dt-cham .field{margin:0}.dt-gy{background:#FFF8EA;border-radius:8px;padding:8px 10px;font-size:13px;color:#6B4A0F}.dt-chsum{margin:6px 0 12px;font-size:14px}',
      '.dt-k{grid-template-columns:repeat(7,minmax(0,1fr))}@media (max-width:1200px){.dt-k{grid-template-columns:repeat(4,minmax(0,1fr))}}@media (max-width:640px){.dt-k{grid-template-columns:repeat(2,minmax(0,1fr))}}.dt-k .anv-t{min-width:0}.dt-g .c{text-align:center}.dt-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:1px}tr.dt-late td:first-child{box-shadow:inset 3px 0 0 var(--danger)}',
      '.dt-cell{border:0;border-radius:99px;padding:3px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;background:var(--surface-2);color:var(--muted)}.dt-cell.st-dat{background:var(--pri-soft);color:var(--pri-ink)}.dt-cell.st-hoc{background:#E3EEF9;color:#1F5F8B}.dt-cell.st-cho,.dt-cell.st-lai{background:#FFF1D6;color:#7A4E05}.dt-cell.st-khong{background:#FDE8E6;color:#8C1D18}.dt-cell.dt-lt{box-shadow:inset 0 0 0 1.5px var(--danger)}',
      '@media (max-width:1100px){.dt-ed{grid-template-columns:1fr}.dt-side{position:static}}',
      '@media (max-width:760px){.dt-pl{grid-template-columns:1fr}.dt-nav{flex-direction:row;overflow:auto;border-right:0;border-bottom:1px solid var(--line);padding:0 0 8px}.dt-ni{white-space:nowrap}.dt-nprog{display:none}.dt-view{max-height:none}.dt-2{grid-template-columns:1fr}.dt-mv{margin-left:0}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'dt-css'; st.textContent = css; document.head.appendChild(st);
  })();
