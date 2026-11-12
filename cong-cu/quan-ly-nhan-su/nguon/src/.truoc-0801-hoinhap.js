  /* =====================================================================
     MODULE HỘI NHẬP (bản 0.6.1 – BẢN THỬ, bắt đầu 11/11/2026 22:34)
     Anh Tuấn chốt 11/11 22:34: làm từng module, Hội nhập trước; xây ở bản web app thử (app/index.html),
     CHƯA đưa lên phiên bản trên web – hoàn thiện hết anh duyệt mới cập nhật lên bản mới.
     2 phần: (1) trang admin – thiết lập hành trình + checklist việc của phòng nhân sự (FILE NÀY, phần đang làm)
             (2) app nhân viên – quy trình hội nhập từng bước cho người mới (làm sau).
     Hành trình mẫu: vị trí phổ thông (văn phòng, sản xuất, kho) – chưa đi sâu đào tạo nghiệp vụ cho vị trí đặc thù.
     Tham khảo cấu trúc file "QUY TRÌNH TIẾP NHẬN NHÂN SỰ MỚI (tham khảo).xlsx" của anh (lộ trình · thời gian · hạng mục ·
     nội dung · mẫu biểu · người phụ trách); bỏ bước "đóng tiền cọc" (BLLĐ 2019 Điều 17 khoản 2 cấm) và ký thỏa thuận
     thử việc ngay ngày đầu (Điều 24) thay vì làm 7 ngày rồi mới ký.
     Căn cứ đã đối chiếu văn bản gốc (nguon/_nhanh-tuyen-dung/can-cu/45_2019_QH14.txt): BLLĐ 2019 Điều 17, 24, 25, 26, 27, 118.
     Chưa đối chiếu văn bản gốc: Luật ATVSLĐ 2015 (huấn luyện khi tuyển dụng), Luật BHXH 2024 (thời hạn đăng ký tham gia).
     Dữ liệu: u.hn = { v, seed, jr: [hành trình] } theo từng công ty. Một hành trình áp dụng cho nhiều công ty được lưu
     một bản ở mỗi công ty, cùng mã gid (sửa ở đâu cũng ghi lại vào tất cả công ty được chọn).
     ===================================================================== */
  var HN_SEED = '2026-11-12d'; // 12/11 12:33 anh: Kèm cặp → Người đồng hành, kho biểu mẫu hội nhập // trước: '2026-11-12c' // 12/11 07:49 anh: thêm Tiến độ hội nhập + dữ liệu mẫu 3 người mới
  var HN_PH = [
    ['pre', 'Trước ngày đi làm', 'Chuẩn bị để ngày đầu không ai bị động'],
    ['d1', 'Ngày đầu tiên', 'Đón, ký hồ sơ, phổ biến nội quy, bàn giao về bộ phận'],
    ['w1', 'Tuần đầu tiên', 'Đồng hành, giới thiệu, trao đổi cuối tuần'],
    ['pr', 'Trong thời gian thử việc', 'Theo dõi tiến độ, góp ý định kỳ'],
    ['end', 'Kết thúc thử việc', 'Đánh giá và thông báo kết quả'],
    ['off', 'Chính thức – chào đón', 'Ký hợp đồng, BHXH, chào đón thành viên mới']
  ];
  var HN_PHN = {}; HN_PH.forEach(function (p) { HN_PHN[p[0]] = p[1]; });
  var HN_ROLE = [
    ['hcns', 'Hành chính nhân sự', '#1D6A50'],
    ['tbp', 'Trưởng bộ phận', '#1F5F8B'],
    ['kc', 'Người đồng hành', '#8A4B9C'],
    ['kt', 'Kế toán', '#B4562B'],
    ['bgd', 'Ban giám đốc', '#2B6F77'],
    ['it', 'Phụ trách thiết bị, tài khoản', '#6B6F2A'],
    ['nv', 'Người mới', '#A76300']
  ];
  var HN_RN = {}; HN_ROLE.forEach(function (r) { HN_RN[r[0]] = r[1]; });
  var HN_GO = [['', '— Không —'], ['tdmoi', 'Kết quả phỏng vấn (thư mời nhận việc)'], ['hd', 'Hợp đồng'], ['nv', 'Danh sách nhân sự (cấp tài khoản)'], ['hoso', 'Hồ sơ nhân sự'], ['tochuc', 'Sơ đồ tổ chức'], ['ccwifi', 'Chấm công Wi‑Fi'], ['np', 'Nghỉ phép']];
  var HN_GON = {}; HN_GO.forEach(function (g) { HN_GON[g[0]] = g[1]; });

  // Menu: Hội nhập thành nhóm riêng có 2 mục – Thiết lập hành trình (chạy) + Theo dõi người mới (sắp có, phần 2)
  (function () {
    var i = MODS.map(function (m) { return m.id; }).indexOf('hoinhap');
    var items = [
      // 12/11 12:05 anh chốt: "Tiến độ hội nhập" đổi tên "Hội nhập nhân sự mới" và đưa lên trước "Thiết lập hành trình"
      { id: 'hntiendo', g: 'hn', t: 'Hội nhập nhân sự mới', st: 'ok', k: 'hoi nhap nhan su moi tien do theo doi nguoi moi cham moc check in check out viec qua han' },
      { id: 'hnlotrinh', g: 'hn', t: 'Thiết lập hành trình', st: 'ok', k: 'hoi nhap onboarding hanh trinh lo trinh checklist nhan su moi tiep nhan check in ngay dau' }
    ];
    if (i >= 0) MODS.splice.apply(MODS, [i, 1].concat(items)); else MODS.push.apply(MODS, items);
    var gi = GROUPS.map(function (g) { return g.id; }).indexOf('td');
    GROUPS.splice(gi + 1, 0, { id: 'hn', t: 'Hội nhập', d: 'Đón người mới từ trước ngày đi làm đến khi ký chính thức.' });
    var ti = TREE.indexOf('hoinhap'); if (ti >= 0) TREE[ti] = 'hn';
    IC.g_hn = IC.hoinhap; IC.hnlotrinh = IC.hoinhap;
    IC.hntiendo = '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="m15.5 11 2 2 4-4"/>';
    IC.hn_clock = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';
    IC.hn_doc = '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z"/><path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5"/>';
    IC.hn_law = '<path d="M12 4v16M5 20h14M6 8h12M6 8l-2.5 6a3 3 0 0 0 5 0zM18 8l-2.5 6a3 3 0 0 0 5 0z"/>';
    IC.hn_back = '<path d="M19 12H5M11 6l-6 6 6 6"/>'; IC.hn_undo = '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'; IC.hn_redo = '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>';
    IC.hn_copy = IC.td_copy; IC.hn_plus = IC.td_plus;
    IC.hn_up = '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 14.5V19a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4.5"/>'; IC.hn_map = '<path d="M3.5 12h17"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 5.5v2M12 16.5v2M18 5.5v2"/>'; IC.hn_tbl = '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>';
    if (SOON.tdmoi && SOON.tdmoi.now) SOON.tdmoi.now = ['hntiendo', 'Hội nhập nhân sự mới'];
  })();

  /* ---------------- Hành trình mẫu: vị trí phổ thông ----------------
     n theo giai đoạn: pre = số ngày trước ngày đi làm · d1 = ngày đầu (giờ t1–t2) · w1, pr = ngày thứ n kể từ ngày vào làm (ngày vào làm = ngày thứ 1)
     end = số ngày trước ngày kết thúc thử việc (0 = đúng ngày cuối) · off = số ngày sau ngày kết thúc thử việc */
  function hnSample() {
    // 12/11 09:37 anh: đổi tên "Hành trình hội nhập - CHUNG"; bỏ bước An toàn vệ sinh lao động; người mới tự cập nhật hồ sơ trên app;
    // giới thiệu công ty, nội quy, chế độ → người mới tự học khóa đào tạo nội bộ "Hội nhập" trên app; cột "Cần chuẩn bị" ghi đủ đồ cần chuẩn bị; bỏ các chỗ "nếu có".
    var S0 = [
      ['pre', 5, '', '', 'Xác nhận ngày đi làm, báo các bên liên quan', 'Xác nhận lại với người mới ngày giờ đi làm, địa điểm, người đón. Báo trưởng bộ phận và kế toán để chuẩn bị chỗ ngồi và tính lương từ ngày vào làm.', 'hcns', ['tbp', 'kt'], 'Thư mời nhận việc đã ký · Tên, số điện thoại người đón', 'tdmoi', 1, 1, ''],
      ['pre', 3, '', '', 'Gửi thư chào mừng và danh sách giấy tờ cần mang', 'Gửi qua email hoặc Zalo: giờ có mặt, địa chỉ, trang phục, người liên hệ. Ghi rõ giấy tờ mang theo để đối chiếu và nộp bản sao: CCCD, văn bằng, sổ BHXH, giấy khám sức khỏe.', 'hcns', [], 'Mẫu thư chào mừng · Danh sách giấy tờ cần mang · Bản đồ đường đến công ty', '', 1, 1, 'BLLĐ 2019 Điều 17 khoản 1 – không giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ'],
      ['pre', 2, '', '', 'Soạn sẵn bộ hồ sơ ký ngày đầu', 'Hợp đồng thử việc, thỏa thuận bảo mật thông tin, biên bản bàn giao tài sản. Kiểm tra lương thử việc, số ngày thử việc khớp với thư mời nhận việc.', 'hcns', [], 'Hợp đồng thử việc (2 bản) · Thỏa thuận bảo mật thông tin · Biên bản bàn giao tài sản', 'hd', 1, 0, 'BLLĐ 2019 Điều 24, 25 (thời gian thử việc), 26 (lương thử việc ít nhất 85%)'],
      ['pre', 2, '', '', 'Chuẩn bị chỗ ngồi, thiết bị, tài khoản', 'Sắp xếp chỗ ngồi, cài đặt máy tính; tạo email công ty, tài khoản phần mềm, thêm vào nhóm chat nội bộ; làm thẻ ra vào, đặt đồng phục đúng cỡ.', 'it', ['hcns'], 'Bàn ghế · Máy tính · Email công ty · Tài khoản phần mềm · Nhóm chat nội bộ · Thẻ ra vào · Đồng phục', '', 1, 0, ''],
      ['pre', 1, '', '', 'Phân công người đồng hành và lịch tuần đầu', 'Chọn một người cùng bộ phận đồng hành cùng người mới trong tháng đầu (có thể khác trưởng bộ phận). Lên lịch tuần đầu: ai hướng dẫn việc gì, ngày nào; gửi lịch cho phòng nhân sự.', 'tbp', ['kc'], 'Lịch tuần đầu · Danh sách đầu mối phối hợp', '', 1, 0, ''],
      ['pre', 1, '', '', 'Chuẩn bị quà chào đón', 'Chuẩn bị bộ quà tặng kèm thiệp chào mừng có chữ ký trưởng bộ phận – nhỏ nhưng tạo ấn tượng tốt ngày đầu.', 'hcns', [], 'Bộ quà tặng: sổ, bút, bình nước · Thiệp chào mừng có chữ ký trưởng bộ phận', '', 0, 0, ''],
      ['d1', 1, '08:00', '08:15', 'Đón người mới, giới thiệu người phụ trách hội nhập', 'Đón ở lối vào, mời nước, giới thiệu bản thân và lịch ngày đầu; tặng quà chào đón.', 'hcns', [], 'Bộ quà tặng · Lịch ngày đầu in sẵn · Nước uống', '', 1, 1, ''],
      ['d1', 1, '08:15', '08:45', 'Ký hồ sơ nhận việc, nhận bản sao giấy tờ', 'Người mới đọc kỹ rồi ký hợp đồng thử việc và các văn bản đã soạn. Giám đốc (hoặc người được ủy quyền) ký, giao lại người mới 01 bản. Chỉ nhận bản sao giấy tờ, đối chiếu bản chính rồi trả lại ngay.', 'hcns', ['bgd', 'nv'], 'Bộ hồ sơ ký ngày đầu (2 bản) · Con dấu · Túi hồ sơ lưu bản sao giấy tờ', 'hd', 1, 1, 'BLLĐ 2019 Điều 17 khoản 1, Điều 24'],
      ['d1', 1, '08:45', '09:00', 'Cấp tài khoản app, hướng dẫn người mới tự cập nhật hồ sơ', 'Cấp tài khoản app nhân viên, cùng người mới đăng nhập và chấm công thử một lần. Hướng dẫn người mới tự cập nhật hồ sơ trên app: CCCD, ngày sinh, địa chỉ, tài khoản ngân hàng, người phụ thuộc. Phòng nhân sự kiểm tra lại thông tin người mới gửi.', 'hcns', ['nv'], 'Tài khoản app nhân viên (mã đăng nhập, PIN) · Hướng dẫn chấm công Wi‑Fi', 'nv', 1, 1, ''],
      ['d1', 1, '09:00', '10:00', 'Tìm hiểu công ty, nội quy và chế độ trên app', 'Người mới tự đọc, xem khóa đào tạo nội bộ “Hội nhập” trên app nhân viên: lịch sử, sứ mệnh, giá trị, sơ đồ tổ chức, sản phẩm – dịch vụ; nội quy lao động, giờ làm, chấm công, nghỉ phép, kỳ trả lương, thưởng và phúc lợi. Học xong bấm xác nhận đã đọc nội quy; phòng nhân sự giải đáp thắc mắc.', 'nv', ['hcns'], 'Khóa đào tạo nội bộ “Hội nhập” trên app · Nội quy lao động · Sổ tay nhân viên', '', 1, 1, 'BLLĐ 2019 Điều 118 khoản 4 – nội quy lao động phải được thông báo đến người lao động'],
      ['d1', 1, '10:00', '10:30', 'Giới thiệu với các phòng ban, bàn giao về bộ phận', 'Dẫn người mới chào ban giám đốc, trưởng các bộ phận và đồng nghiệp; bàn giao cho trưởng bộ phận và người đồng hành.', 'hcns', ['tbp', 'kc'], 'Sơ đồ tổ chức · Danh sách người cần chào', 'tochuc', 1, 1, ''],
      ['d1', 1, '13:30', '14:30', 'Giao mô tả công việc và mục tiêu tuần đầu', 'Trưởng bộ phận trao đổi mô tả công việc, kết quả mong đợi trong thời gian thử việc, mục tiêu tuần đầu và cách đánh giá.', 'tbp', ['kc'], 'Mô tả công việc · Mục tiêu thử việc · Tiêu chí đánh giá', '', 1, 1, ''],
      ['d1', 1, '14:30', '15:00', 'Bàn giao tài sản, công cụ làm việc', 'Bàn giao máy tính, thiết bị, thẻ ra vào, đồng phục, chìa khóa tủ; hai bên ký biên bản.', 'hcns', ['it'], 'Biên bản bàn giao (2 bản) · Máy tính · Thẻ ra vào · Đồng phục · Chìa khóa tủ', '', 0, 1, ''],
      ['d1', 1, '16:30', '17:00', 'Hỏi thăm cuối ngày đầu', 'Trò chuyện 10–15 phút: ngày đầu thế nào, còn vướng gì, cần hỗ trợ gì; ghi lại để xử lý ngay.', 'hcns', [], 'Phiếu ghi nhận ý kiến ngày đầu', '', 0, 1, ''],
      ['w1', 2, '', '', 'Đồng hành trong công việc hằng ngày', 'Người đồng hành hướng dẫn quy trình, công cụ, đầu mối phối hợp; giao việc nhỏ để người mới làm thử và góp ý ngay trong ngày.', 'kc', ['tbp'], 'Danh sách việc giao thử · Tài liệu quy trình của bộ phận', '', 1, 1, ''],
      ['w1', 3, '', '', 'Giới thiệu người mới với toàn công ty', 'Đăng lời chào mừng trên nhóm chat hoặc bản tin nội bộ: tên, vị trí, bộ phận. Hỏi ý người mới trước khi đăng ảnh, thông tin cá nhân.', 'hcns', [], 'Ảnh và lời giới thiệu đã được người mới đồng ý', '', 0, 0, ''],
      ['w1', 7, '', '', 'Trò chuyện đánh giá tuần đầu', 'Người mới tự nhìn lại tuần đầu (thuận lợi, khó khăn, cần hỗ trợ); trưởng bộ phận nhận xét. Đây là trao đổi nội bộ để hỗ trợ kịp thời – không thay cho thông báo kết quả thử việc.', 'hcns', ['tbp', 'nv'], 'Phiếu trao đổi tuần đầu', '', 1, 1, ''],
      ['pr', 30, '', '', 'Gặp định kỳ giữa thời gian thử việc', 'Xem tiến độ so với mục tiêu thử việc, góp ý cụ thể, điều chỉnh hỗ trợ.', 'tbp', ['hcns'], 'Bảng theo dõi mục tiêu thử việc', '', 0, 1, ''],
      ['end', 7, '', '', 'Trưởng bộ phận đánh giá kết quả thử việc', 'Đánh giá theo mục tiêu đã giao ngày đầu; đề xuất Đạt / Không đạt gửi phòng nhân sự và ban giám đốc.', 'tbp', ['hcns'], 'Phiếu đánh giá kết quả thử việc', '', 1, 0, ''],
      ['end', 0, '', '', 'Thông báo kết quả thử việc cho người lao động', 'Thông báo khi kết thúc thời gian thử việc. Đạt: ký hợp đồng lao động. Không đạt: chấm dứt hợp đồng thử việc.', 'hcns', ['bgd'], 'Thông báo kết quả thử việc', 'hd', 1, 1, 'BLLĐ 2019 Điều 27'],
      ['off', 1, '', '', 'Ký hợp đồng lao động, đăng ký BHXH', 'Ký hợp đồng lao động, cập nhật lương chính thức. Kế toán đăng ký tham gia BHXH, BHYT, BHTN cho người lao động.', 'hcns', ['kt'], 'Hợp đồng lao động (2 bản) · Quyết định lương chính thức · Hồ sơ đăng ký BHXH', 'hd', 1, 1, 'Luật BHXH 2024 – thời hạn đăng ký tham gia (chưa trích điều)'],
      ['off', 3, '', '', 'Chào đón thành viên chính thức', 'Chúc mừng trong buổi họp hoặc nhóm chung; trao thẻ nhân viên, đồng phục. Hỏi người mới góp ý về quá trình hội nhập để cải thiện hành trình.', 'hcns', ['nv'], 'Thẻ nhân viên · Đồng phục · Quà chúc mừng · Phiếu góp ý hội nhập', '', 0, 1, ''],
      // 12/11 10:44: thêm việc người mới tự làm ở cuối thử việc (đặt cuối mảng để giữ nguyên mã các bước cũ)
      ['end', 10, '', '', 'Người mới tự đánh giá kết quả thử việc', 'Tự nhìn lại các mục tiêu đã giao: việc đã làm tốt, việc cần cải thiện, hỗ trợ cần thêm. Gửi trưởng bộ phận trước buổi đánh giá kết quả thử việc.', 'nv', ['tbp'], 'Phiếu tự đánh giá thử việc', '', 1, 1, '']
    ];
    var BM = { b08: ['BM01', 'BM02'], b13: ['BM03'], b17: ['BM04'], b21: ['BM06'], b22: ['BM07'], b23: ['BM05'] }; // 12/11 12:33: biểu mẫu người mới cần xem, điền
    return S0.map(function (a, i) { return { bm: (BM['b' + p2(i + 1)] || []).slice(), id: 'b' + p2(i + 1), ph: a[0], n: a[1], t1: a[2], t2: a[3], title: a[4], desc: a[5], own: a[6], own2: a[7].slice(), doc: a[8], go: a[9], req: !!a[10], nv: !!a[11], law: a[12] }; });
  }
  var HN_SNAME = 'Hành trình hội nhập - CHUNG';
  var HN_SDESC = 'Dùng chung cho mọi vị trí phổ thông (văn phòng, sản xuất, kho…), chưa gồm đào tạo nghiệp vụ chuyên môn của vị trí đặc thù. Sửa lại giờ giấc, người phụ trách, đồ cần chuẩn bị cho đúng thực tế công ty.';

  /* ---------------- KHO BIỂU MẪU HỘI NHẬP (anh 12/11 12:33) ----------------
     Biểu mẫu người mới cần xem, điền trong hành trình; gắn vào từng bước (cột "Biểu mẫu"). Người mới mở xem / tải ngay trên app.
     Lưu chung S.settings.hnBm (như Kho hợp đồng mẫu S.settings.hdTpl). 3 loại:
       soan – soạn trong phần mềm bằng ký hiệu như mẫu HĐ cũ (# tiêu đề, ^ căn giữa đậm, ~ căn giữa nghiêng, ## mục, **đậm**, {{truong}}, [CHU_KY]) – tự điền thông tin người mới
       hd   – lấy từ Kho hợp đồng mẫu: '@tv' hợp đồng thử việc / '@ld' hợp đồng lao động (tự chọn mẫu theo loại HĐ, khối) hoặc 1 mẫu cụ thể
       file – tải file có sẵn (PDF, Word, Excel, ảnh ≤ 300 KB – gửi kèm hồ sơ lên máy chủ chấm công khi đồng bộ) */
  var HN_BM_V = 2, HN_BM_MAX = 300 * 1024;
  var HN_BM_WHO = { hcns: 'Hành chính nhân sự', nv: 'Người mới' }; // 13:14 anh: ai hoàn thiện văn bản
  var HN_BM_DEF_WHO = { BM01: 'hcns', BM02: 'hcns', BM03: 'hcns', BM04: 'nv', BM05: 'nv', BM06: 'hcns', BM07: 'nv' };
  var HN_BM_TY = { soan: 'Soạn trong phần mềm', hd: 'Từ kho hợp đồng mẫu', file: 'File tải lên' };
  var HN_BM_KEYS = [['ngay_vao_lam', 'Ngày vào làm'], ['ngay_het_thu_viec', 'Ngày hết thử việc'], ['truong_bo_phan', 'Trưởng bộ phận'], ['nguoi_dong_hanh', 'Người đồng hành'], ['chuyen_vien_nhan_su', 'Chuyên viên nhân sự'], ['hom_nay', 'Hôm nay (ngày … tháng … năm …)']];
  var HN_BM_CHIPS = [['ho_ten', 'Họ và tên'], ['ma_nv', 'Mã NV'], ['chuc_danh', 'Chức danh'], ['phong_ban', 'Phòng ban'], ['cccd', 'Số CCCD'], ['sdt', 'Điện thoại'], ['ten_cong_ty', 'Tên công ty'], ['dia_chi_cong_ty', 'Địa chỉ công ty'], ['nguoi_dai_dien', 'Người đại diện'], ['chuc_vu_dai_dien', 'Chức vụ người đại diện']].concat(HN_BM_KEYS);
  function hnBmDefaults() {
    var L = function (a) { return a.join('\n'); }, dots = '……………………………………………………………………………………';
    return [
      { id: 'BM01', ten: 'Hợp đồng thử việc', loai: 'hd', tpl: '@tv', ghi: 'Bản chính thức sẽ do phòng nhân sự soạn và gửi tới bạn. Đọc trước để nắm nội dung; mang theo CCCD khi ký.' },
      { id: 'BM02', ten: 'Thỏa thuận bảo mật thông tin', loai: 'soan', ghi: 'Bản chính thức sẽ do phòng nhân sự soạn và gửi tới bạn, ký cùng hợp đồng thử việc trong ngày đầu.', nd: L(['^ CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', '^ Độc lập – Tự do – Hạnh phúc', '---', '', '# THỎA THUẬN BẢO MẬT THÔNG TIN', '~ Kèm theo hợp đồng thử việc, hợp đồng lao động', '', '_ Căn cứ khoản 2 Điều 21 Bộ luật Lao động số 45/2019/QH14;', '',
        '**BÊN A – NGƯỜI SỬ DỤNG LAO ĐỘNG: {{ten_cong_ty}}**', 'Địa chỉ: {{dia_chi_cong_ty}}', 'Người đại diện: {{nguoi_dai_dien}}    Chức vụ: {{chuc_vu_dai_dien}}', '', '**BÊN B – NGƯỜI LAO ĐỘNG: {{ho_ten}}**', 'Mã NV: {{ma_nv}}    Chức danh: {{chuc_danh}}    Bộ phận: {{phong_ban}}', 'Số CCCD: {{cccd}}    Điện thoại: {{sdt}}', '',
        '## Điều 1. Thông tin cần bảo mật', 'Thông tin khách hàng, đối tác, giá bán, chi phí, số liệu tài chính; dữ liệu cá nhân của người lao động và khách hàng; quy trình, tài liệu nội bộ; tài khoản phần mềm và các thông tin khác Bên A đánh dấu "Mật" hoặc thông báo cần bảo mật.',
        '## Điều 2. Trách nhiệm của Bên B', '1. Chỉ dùng thông tin cần bảo mật để làm công việc được giao; không sao chép, gửi, đăng tải ra ngoài khi chưa được Bên A đồng ý bằng văn bản.', '2. Không chia sẻ mật khẩu, tài khoản được cấp; báo ngay cho người quản lý khi phát hiện thông tin bị lộ.', '3. Khi nghỉ việc, bàn giao lại toàn bộ tài liệu, dữ liệu, thiết bị có chứa thông tin cần bảo mật.',
        '## Điều 3. Thời hạn bảo mật', 'Trong suốt thời gian làm việc và ……… tháng kể từ ngày chấm dứt hợp đồng.', '## Điều 4. Xử lý vi phạm', 'Vi phạm thỏa thuận này được xử lý theo nội quy lao động của Bên A và quy định của pháp luật; bên vi phạm bồi thường thiệt hại thực tế đã gây ra.', '',
        'Thỏa thuận lập thành 02 bản, mỗi bên giữ 01 bản, có hiệu lực từ ngày ký.', '[CHU_KY]']) },
      { id: 'BM03', ten: 'Biên bản bàn giao tài sản, công cụ làm việc', loai: 'soan', ghi: 'Bản chính thức sẽ do phòng nhân sự soạn và gửi tới bạn khi bàn giao. Kiểm tra từng món trước khi ký.', nd: L(['^ {{ten_cong_ty}}', '---', '', '# BIÊN BẢN BÀN GIAO TÀI SẢN, CÔNG CỤ LÀM VIỆC', '~ Ngày bàn giao: {{ngay_vao_lam}}', '',
        'Bên giao: Phòng Hành chính nhân sự – {{chuyen_vien_nhan_su}}', 'Bên nhận: **{{ho_ten}}**    Mã NV: {{ma_nv}}', 'Chức danh: {{chuc_danh}}    Bộ phận: {{phong_ban}}', '', '## Tài sản, công cụ bàn giao',
        '1. Máy tính (loại, số máy): ' + dots, '2. Thẻ ra vào số: ' + dots, '3. Đồng phục (số bộ, cỡ): ' + dots, '4. Chìa khóa tủ số: ' + dots, '5. Thiết bị, công cụ khác: ' + dots, '',
        'Bên nhận đã kiểm tra, nhận đủ các tài sản, công cụ trên trong tình trạng sử dụng tốt; có trách nhiệm giữ gìn, dùng đúng mục đích và bàn giao lại khi nghỉ việc hoặc khi công ty yêu cầu.', 'Biên bản lập thành 02 bản, mỗi bên giữ 01 bản.', '[CHU_KY]']) },
      { id: 'BM04', ten: 'Phiếu trao đổi tuần đầu', loai: 'soan', ghi: 'Ghi trước vài ý để buổi trò chuyện cuối tuần đầu hiệu quả hơn.', nd: L(['# PHIẾU TRAO ĐỔI TUẦN ĐẦU', '~ Người mới ghi trước buổi trò chuyện cuối tuần đầu', '',
        'Họ và tên: **{{ho_ten}}**    Chức danh: {{chuc_danh}}    Bộ phận: {{phong_ban}}', 'Ngày vào làm: {{ngay_vao_lam}}    Người đồng hành: {{nguoi_dong_hanh}}', '',
        '## 1. Điều bạn thấy thuận lợi trong tuần đầu', dots, dots, '## 2. Điều còn vướng, chưa rõ', dots, dots, '## 3. Hỗ trợ bạn cần thêm (tài liệu, công cụ, người hướng dẫn)', dots, dots, '## 4. Việc bạn muốn làm tốt hơn ở tuần tới', dots, dots, '## Nhận xét của trưởng bộ phận', dots, dots]) },
      { id: 'BM05', ten: 'Phiếu tự đánh giá kết quả thử việc', loai: 'soan', ghi: 'Điền rồi gửi trưởng bộ phận trước buổi đánh giá kết quả thử việc.', nd: L(['# PHIẾU TỰ ĐÁNH GIÁ KẾT QUẢ THỬ VIỆC', '',
        'Họ và tên: **{{ho_ten}}**    Mã NV: {{ma_nv}}', 'Chức danh: {{chuc_danh}}    Bộ phận: {{phong_ban}}', 'Thời gian thử việc: từ {{ngay_vao_lam}} đến {{ngay_het_thu_viec}}', 'Trưởng bộ phận: {{truong_bo_phan}}', '',
        '## 1. Kết quả theo mục tiêu đã giao', 'Mục tiêu 1: ……………………………… Kết quả: ……………………………… Tự chấm (1–5): ……', 'Mục tiêu 2: ……………………………… Kết quả: ……………………………… Tự chấm (1–5): ……', 'Mục tiêu 3: ……………………………… Kết quả: ……………………………… Tự chấm (1–5): ……',
        '## 2. Việc bạn đã làm tốt', dots, dots, '## 3. Việc cần cải thiện', dots, dots, '## 4. Hỗ trợ cần thêm từ công ty, bộ phận', dots, '## 5. Mong muốn, định hướng sau thời gian thử việc', dots, '',
        '~ Ngày …… tháng …… năm ……', '^ NGƯỜI TỰ ĐÁNH GIÁ', '~ (Ký, ghi rõ họ tên)', '', '', '^ {{ho_ten}}']) },
      { id: 'BM06', ten: 'Hợp đồng lao động', loai: 'hd', tpl: '@ld', ghi: 'Bản chính thức sẽ do phòng nhân sự soạn và gửi tới bạn.' },
      { id: 'BM07', ten: 'Phiếu góp ý hành trình hội nhập', loai: 'soan', ghi: 'Góp ý thật lòng để hành trình của người mới sau tốt hơn.', nd: L(['# PHIẾU GÓP Ý HÀNH TRÌNH HỘI NHẬP', '', 'Họ và tên: {{ho_ten}}    Bộ phận: {{phong_ban}}    Ngày vào làm: {{ngay_vao_lam}}', '',
        '## 1. Ngày đầu bạn có được chuẩn bị đủ chỗ ngồi, thiết bị, tài khoản không?', '☐ Đã đủ    ☐ Còn thiếu: ' + dots, '## 2. Người đồng hành có hỗ trợ bạn kịp thời không?', '☐ Rất kịp thời    ☐ Bình thường    ☐ Chưa kịp thời – vì: ' + dots,
        '## 3. Thông tin về nội quy, chế độ, cách làm việc có rõ ràng không?', '☐ Rõ ràng    ☐ Còn chưa rõ: ' + dots, '## 4. Công ty nên làm khác đi điều gì để người mới sau thuận lợi hơn?', dots, dots]) }
    ];
  }
  function hnBms() {
    if (!S.settings.hnBm) { S.settings.hnBm = hnBmDefaults().map(function (b) { b.nguoi = HN_BM_DEF_WHO[b.id] || 'nv'; return b; }); S.settings.hnBmV = HN_BM_V; try { saveSettings(); } catch (e) { } }
    else if ((S.settings.hnBmV || 1) < HN_BM_V) { var D = {}; hnBmDefaults().forEach(function (b) { D[b.id] = b; }); S.settings.hnBm.forEach(function (b) { if (!b.nguoi) b.nguoi = HN_BM_DEF_WHO[b.id] || (b.loai === 'hd' ? 'hcns' : 'nv'); if (D[b.id] && HN_BM_DEF_WHO[b.id] === 'hcns' && b.ghi && !/phòng nhân sự soạn/.test(b.ghi)) b.ghi = D[b.id].ghi; }); S.settings.hnBmV = HN_BM_V; try { saveSettings(); } catch (e) { } }
    return S.settings.hnBm;
  }
  function hnBmById(id) { return hnBms().filter(function (b) { return b.id === id; })[0] || null; }
  function hnBmNames(ids) { return (ids || []).map(function (id) { var b = hnBmById(id); return b ? b.ten : ''; }).filter(Boolean).join(', '); }
  function hnBmChips(s) { var L = (s.bm || []).map(hnBmById).filter(Boolean); return L.length ? L.map(function (b) { return '<span class="hn-bmt ' + b.loai + '">' + esc(b.ten) + '</span>'; }).join('') : '<span class="faint">— Chọn —</span>'; }
  function hnBmSave(L, txt) { S.settings.hnBm = L; S.settings.hnBmV = HN_BM_V; saveSettings(); log('Kho biểu mẫu hội nhập: ' + txt); }
  function hnBmTplName(t) { if (t === '@tv') return 'Hợp đồng thử việc – tự lấy mẫu theo loại hợp đồng'; if (t === '@ld') return 'Hợp đồng lao động – tự lấy mẫu theo loại hợp đồng, khối'; var tp = tpls().filter(function (x) { return x.id === t; })[0]; return tp ? tp.ten : '(mẫu đã bị xóa)'; }
  // Bước nào đang dùng biểu mẫu (trên mọi hành trình của các công ty)
  function hnBmUse(id) { var out = [], seen = {}; S.units.forEach(function (u) { hnOf(u).jr.forEach(function (j) { j.steps.forEach(function (st) { if ((st.bm || []).indexOf(id) >= 0 && !seen[j.gid + st.id]) { seen[j.gid + st.id] = 1; out.push({ j: j, s: st }); } }); }); }); return out; }
  // Giá trị điền vào biểu mẫu cho 1 người (o: hồ sơ hội nhập nếu có)
  function hnBmVals(u, ma, o) {
    var e = ma ? (nvIndex(u)[ma] || {}) : {}, hds = ma ? ((HRR.contractsOf(u.data) || {})[ma] || []) : [], h = hds[hds.length - 1] || { 'Mã NV': ma || '', 'Họ và tên': o ? o.name : '', 'Phòng ban': o ? o.pb : '', 'Chức danh': o ? o.cd : '' };
    var V = {}; try { V = tplVals(u, h); } catch (er) { try { V = tplBlankVals(u); } catch (er2) { } }
    if (!V.ho_ten && o) V.ho_ten = o.name; if (!V.phong_ban && o) V.phong_ban = o.pb; if (!V.chuc_danh && o) V.chuc_danh = o.cd;
    var st = o ? o.start : String(e['Ngày vào làm'] || '').slice(0, 10), pe = o ? o.pe : '';
    V.ngay_vao_lam = st ? vn(st) : ''; V.ngay_het_thu_viec = pe ? vn(pe) : ''; V.hom_nay = dChu(refDate());
    V.truong_bo_phan = o ? hnWhoOf(u, o, 'tbp') || '' : ''; V.nguoi_dong_hanh = o ? hnWhoOf(u, o, 'kc') || '' : ''; V.chuyen_vien_nhan_su = o ? hnWhoOf(u, o, 'hcns') || '' : '';
    return V;
  }
  // Hợp đồng theo mẫu: người đã có HĐ đúng loại thì lấy HĐ đó; chưa có thì dựng HĐ tạm (chỉ có thông tin người, phần còn lại để trống "……")
  function hnBmDoc(u, ma, o, b) {
    if (b.loai === 'soan') return { src: tplMdToHtml(b.nd || ''), V: hnBmVals(u, ma, o), tp: null };
    if (b.loai !== 'hd') return null;
    var hds = ma ? ((HRR.contractsOf(u.data) || {})[ma] || []) : [], tv = b.tpl === '@tv', ld = b.tpl === '@ld';
    var tp = !tv && !ld ? tpls().filter(function (x) { return x.id === b.tpl; })[0] : null;
    var want = tv || (tp && /thử việc/i.test(tp.ten + ' ' + (tp.loai || []).join(' ')));
    var h = hds.filter(function (x) { return !!HRR.isProb(x['Loại hợp đồng']) === !!want; }).pop();
    if (!h) h = { 'Mã NV': ma || '', 'Họ và tên': o ? o.name : '', 'Phòng ban': o ? o.pb : '', 'Chức danh': o ? o.cd : '', 'Loại hợp đồng': want ? 'Hợp đồng thử việc' : '' };
    if (!tp) { var e = ma ? nvIndex(u)[ma] || {} : {}, kh = typeof ccIsSxDept === 'function' && ccIsSxDept(ccOf(u), h['Phòng ban'] || e['Phòng ban']) ? 'sx' : 'vp';
      var L = h['Loại hợp đồng'] ? tpls().filter(function (x) { return (x.loai || []).indexOf(h['Loại hợp đồng']) >= 0; }) : [];
      if (!L.length) L = tpls().filter(function (x) { return want ? /thử việc/i.test(x.ten) : !/thử việc|bán thời gian|cộng tác/i.test(x.ten); });
      tp = L.filter(function (x) { return !x.khoi || x.khoi === kh; })[0] || L[0] || tpls()[0]; }
    if (!tp) return null;
    var V = tplVals(u, h); if (!V.ho_ten && o) V.ho_ten = o.name;
    return { src: tplDoc(tp), V: V, tp: tp };
  }
  function hnBmHtml(u, ma, o, b) {
    try { var d = hnBmDoc(u, ma, o, b); return d ? tplHtml(d.src, d.V, false) : ''; } catch (e) { logErr('Biểu mẫu hội nhập ' + b.id, e); }
    return '';
  }
  // Người để xem thử biểu mẫu: người mới đang hội nhập đầu tiên, không có thì nhân viên đầu tiên
  function hnBmSample() {
    var us = selUnits(), x = null;
    us.some(function (u) { var o = hnOf(u).ob.filter(function (z) { return z.st === 'run' && z.nv; })[0]; if (o) { x = { u: u, ma: o.nv, o: o }; return true; } return false; });
    if (!x && us[0]) { var e = (us[0].data.NV || [])[0]; x = { u: us[0], ma: e ? e['Mã NV'] : '', o: null }; }
    return x;
  }
  function hnBmPreview(b) {
    if (b.loai === 'file') {
      if (!b.f) return '<p class="muted">Chưa có file.</p>';
      var img = /^image\//.test(b.f.t);
      return '<div class="hn-bmfile">' + (img ? '<img src="data:' + esc(b.f.t) + ';base64,' + b.f.d + '" alt="' + esc(b.f.n) + '">' : ic('hn_doc', 22) + '<div><b>' + esc(b.f.n) + '</b><div class="muted" style="font-size:12px">' + Math.round(b.f.d.length * 0.75 / 1024) + ' KB · người mới bấm để tải về điện thoại</div></div><span style="flex:1"></span><a class="btn btn-sm" download="' + esc(b.f.n) + '" href="data:' + esc(b.f.t) + ';base64,' + b.f.d + '">Tải về</a>') + '</div>';
    }
    var x = hnBmSample(); if (!x) return '';
    return '<p class="muted" style="font-size:12.5px;margin:0 0 8px">Xem thử với <b>' + esc(x.o ? x.o.name : (nvIndex(x.u)[x.ma] || {})['Họ và tên'] || '') + '</b>' + (x.o ? ' (đang hội nhập)' : '') + ' – mỗi người mới thấy thông tin của chính mình.</p><div class="tp-paper">' + hnBmHtml(x.u, x.ma, x.o, b) + '</div>';
  }
  function hnKhoPage() {
    var L = hnBms(), cols = [['Tên biểu mẫu', 240, ''], ['Người hoàn thiện', 176, ''], ['Dùng ở bước', 262, ''], ['Hướng dẫn cho người mới', 240, ''], ['', 190, 'c']]; // 12:59 anh: bỏ cột Nội dung, nguồn
    var rows = L.map(function (b) {
      var use = hnBmUse(b.id), src = b.loai === 'hd' ? hnBmTplName(b.tpl) : b.loai === 'file' ? (b.f ? b.f.n + ' · ' + Math.round(b.f.d.length * 0.75 / 1024) + ' KB' : 'Chưa có file') : '';
      return '<tr><td><a href="#" class="hn-bmn" data-act="hn-bm-view" data-id="' + esc(b.id) + '">' + esc(b.ten) + '</a><div class="faint" style="font-size:11.5px">' + esc(b.id) + ' · ' + HN_BM_TY[b.loai] + (src ? ': ' + esc(src) : '') + '</div></td><td><span class="hn-bmw ' + (b.nguoi || 'nv') + '">' + HN_BM_WHO[b.nguoi || 'nv'] + '</span><div class="faint" style="font-size:11px;margin-top:4px">' + (b.nguoi === 'hcns' ? 'Soạn theo từng người, in ra để ký' : 'Người mới tải về, điền') + '</div></td>' +
        '<td><div class="hn-bmu">' + (use.length ? use.map(function (x) { return '<span>' + esc(HN_PHN[x.s.ph]) + ' · <b>' + esc(x.s.title) + '</b>' + (x.j.name !== HN_SNAME || hnAll().length > 1 ? ' <span class="faint">(' + esc(x.j.name) + ')</span>' : '') + '</span>'; }).join('') : '<span class="faint">Chưa gắn bước nào – gắn ở cột “Biểu mẫu” trong bảng checklist</span>') + '</div></td>' +
        '<td style="font-size:12.5px">' + esc(b.ghi || '') + '</td><td class="c"><span class="hn-sa">' + (b.nguoi === 'hcns' && b.loai !== 'file' ? '<button class="btn btn-sm btn-primary" data-act="hn-bm-soan" data-id="' + esc(b.id) + '" title="Soạn văn bản cho 1 nhân sự cụ thể rồi tải về, in">' + ic('hn_doc', 14) + 'Soạn</button>' : '') + '<button class="btn btn-sm" data-act="hn-bm-view" data-id="' + esc(b.id) + '" title="Xem thử">' + ic('eye', 14) + '</button><button class="btn btn-sm" data-act="hn-bm-dl" data-id="' + esc(b.id) + '" title="Tải biểu mẫu (Word)">' + ic('hn_up', 14).replace('M12 15V4M7.5 8.5 12 4l4.5 4.5', 'M12 4v11M7.5 10.5 12 15l4.5-4.5') + '</button><button class="btn btn-sm" data-act="hn-bm-edit" data-id="' + esc(b.id) + '" title="Sửa nội dung, cài đặt">' + ic('td_edit', 14) + '</button><button class="btn btn-sm" data-act="hn-bm-del" data-id="' + esc(b.id) + '" title="Xóa">' + ic('td_trash', 14) + '</button></span></td></tr>';
    }).join('');
    return '<div class="page-head"><div><p style="margin:0 0 12px"><button class="hn-backbtn" data-act="hn-kho-back">' + ic('hn_back', 16) + 'Danh sách hành trình</button></p><h1>Kho biểu mẫu hội nhập</h1><p class="muted">Biểu mẫu người mới cần xem, điền trong hành trình: phiếu, biên bản, thỏa thuận… Gắn biểu mẫu vào từng bước ở cột <b>Biểu mẫu</b> của bảng checklist – người mới bấm mở xem, tải ngay trên app nhân viên, thông tin của họ được điền sẵn. Hợp đồng lấy thẳng từ <a href="#" class="plink" data-act="hn-bm-hdkho">Kho hợp đồng mẫu</a>, không soạn lại.</p></div>' +
      '<div class="link-row" style="margin:0"><button class="btn" data-act="hn-bm-reset" title="Thêm lại các biểu mẫu gợi ý đã xóa">Khôi phục mẫu gợi ý</button><button class="btn btn-primary" data-act="hn-bm-edit" data-id="">' + ic('td_plus', 15) + 'Thêm biểu mẫu</button></div></div>' +
      (L.length ? '<div class="hn-tw hn-gw hn-bmk">' + hnGridOpen('bmkho', cols, '') + '<tbody>' + rows + '</tbody></table></div>' + hnGridFoot('bmkho') : '<div class="hn-empty"><h2>Kho đang trống</h2><p class="muted">Bấm “Thêm biểu mẫu” hoặc “Khôi phục mẫu gợi ý”.</p></div>');
  }
  // Tải biểu mẫu (anh 12:59): file Word để trống phần thông tin người mới (giống "Tải mẫu trống" ở Kho hợp đồng mẫu); file tải lên thì tải đúng file
  function hnBmTplOf(b) {
    if (b.loai !== 'hd') return null; if (b.tpl !== '@tv' && b.tpl !== '@ld') return tpls().filter(function (x) { return x.id === b.tpl; })[0] || null;
    var tv = b.tpl === '@tv', L = tpls().filter(function (x) { return tv ? /thử việc/i.test(x.ten) : !/thử việc|bán thời gian|cộng tác/i.test(x.ten); });
    return L.filter(function (x) { return !x.khoi || x.khoi === 'vp'; })[0] || L[0] || null;
  }
  function hnBmDownload(b) {
    var name = HR.stripAcc('Bieu_mau_' + b.ten).replace(/[^A-Za-z0-9]+/g, '_').replace(/_$/, '');
    if (b.loai === 'file') { if (!b.f) return; var a = document.createElement('a'); a.href = 'data:' + b.f.t + ';base64,' + b.f.d; a.download = b.f.n; document.body.appendChild(a); a.click(); a.remove(); return; }
    var u = selUnits()[0] || S.units[0]; if (!u) return;
    try {
      var tp = hnBmTplOf(b), V = tplBlankVals(u); HN_BM_KEYS.forEach(function (k) { V[k[0]] = ''; }); V.hom_nay = dChu('');
      var html = tp ? tplDoc(tp) : tplMdToHtml(b.nd || ''), L = signLbl(tp);
      saveDocx(tplDocx(html, V, [L[0][0], L[0][1], ''], [L[1][0], L[1][1], V.nguoi_dai_dien], true), name + '.docx');
      log('Tải biểu mẫu hội nhập "' + b.ten + '"'); toast('Đã tải "' + b.ten + '"', 'ok', 'File Word để trống phần thông tin người mới – điền tay hoặc sửa tiếp trong Word.');
    } catch (e) { logErr('Tải biểu mẫu hội nhập', e); toast('Chưa tạo được file Word', 'err'); }
  }
  // Soạn văn bản (anh 13:14): chọn nhân sự → văn bản điền đủ thông tin người đó → tải .docx / in ra để ký
  function hnBmPeople() {
    var out = [], seen = {}, R = refDate();
    selUnits().forEach(function (u) { hnOf(u).ob.filter(function (o) { return o.st === 'run'; }).forEach(function (o) { var k = u.id + '|' + (o.nv || '') + '|' + o.id; seen[u.id + '|' + o.nv] = 1; out.push({ k: k, g: 'Đang hội nhập', t: o.name + (o.nv ? ' · ' + o.nv : ' · chưa có mã NV') + ' · ' + (o.cd || o.pb || '') + (selUnits().length > 1 ? ' · ' + shortUnit(u.name) : '') }); }); });
    selUnits().forEach(function (u) { (u.data.NV || []).forEach(function (e) { var ma = e['Mã NV']; if (seen[u.id + '|' + ma] || HR.staffState(e, R) === 'left') return; out.push({ k: u.id + '|' + ma + '|', g: 'Nhân sự khác', t: e['Họ và tên'] + ' · ' + ma + ' · ' + (e['Phòng ban'] || '') + (selUnits().length > 1 ? ' · ' + shortUnit(u.name) : '') }); }); });
    return out;
  }
  function hnBmPick(k) { var a = String(k || '').split('|'), u = unitById(a[0]); if (!u) return null; var o = a[2] ? hnOf(u).ob.filter(function (z) { return z.id === a[2]; })[0] || null : null; return { u: u, ma: a[1] || '', o: o }; }
  function hnBmPrint(title, html) {
    var w = window.open('', '_blank'); if (!w) { toast('Trình duyệt chặn cửa sổ in', 'err', 'Cho phép cửa sổ bật lên rồi bấm lại, hoặc dùng Tải Word.'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>@page{size:A4;margin:2cm 2cm 2cm 3cm}body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.45;color:#000}p{margin:0 0 4pt;text-align:justify;white-space:pre-wrap}.tp-c,.tp-h1{text-align:center}.tp-h1{font-size:15pt;font-weight:bold}.tp-h2{font-weight:bold;margin-top:8pt}.tp-sign{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:16pt}.tp-sign div{display:flex;flex-direction:column}.tp-sign i{margin-bottom:60pt}.tf-blank,.tf-v{background:none!important;color:inherit!important}table{border-collapse:collapse;width:100%}td{border:1px solid #000;padding:3pt 5pt}.tp-mk{display:inline-block;width:1.3em}</style></head><body>' + html + '<script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  }
  ACTS['hn-bm-soan'] = function (a, id) {
    var b = hnBmById(id); if (!b) return; var P = hnBmPeople(); if (!P.length) { toast('Chưa có nhân sự nào', 'err'); return; }
    var groups = {}; P.forEach(function (x) { (groups[x.g] = groups[x.g] || []).push(x); });
    var cur = P[0].k;
    var body = '<div class="hn-bmf"><div class="field"><label for="bmP">Soạn cho nhân sự</label><select class="input" id="bmP">' + Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (x) { return '<option value="' + esc(x.k) + '">' + esc(x.t) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></div>' +
      '<div id="bmMiss" style="margin:12px 0 12px"></div><div class="hn-bmv"><div class="tp-paper" id="bmDoc" style="max-height:52vh"></div></div>' +
      '<div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Đóng</button><button class="btn" id="bmPr">' + ic('td_print', 14) + 'In</button><button class="btn btn-primary" id="bmWd">' + ic('hn_up', 14).replace('M12 15V4M7.5 8.5 12 4l4.5 4.5', 'M12 4v11M7.5 10.5 12 15l4.5-4.5') + 'Tải Word (.docx)</button></div></div>';
    var m = modal('Soạn: ' + b.ten, 'Văn bản điền sẵn thông tin của nhân sự được chọn – kiểm tra, tải về hoặc in ra để ký', body);
    function doc() { var x = hnBmPick(cur); return x ? { x: x, d: hnBmDoc(x.u, x.ma, x.o, b) } : null; }
    // 13:32 anh: thiếu thông tin công ty → nút "Bổ sung ngay" mở đúng hộp "Thông tin công ty trên hợp đồng" (lưu chung, hợp đồng và mọi văn bản dùng lại)
    var CO_F = [['dc', 'địa chỉ trụ sở', 'dia_chi_cong_ty'], ['mst', 'mã số thuế', 'mst_cong_ty'], ['dt', 'điện thoại', 'dien_thoai_cong_ty'], ['dd', 'người đại diện', 'nguoi_dai_dien'], ['cv', 'chức vụ người đại diện', 'chuc_vu_dai_dien'], ['nl', 'địa điểm làm việc', 'dia_diem_lam_viec']];
    function draw() {
      var r = doc(); if (!r || !r.d) { $('#bmDoc', m).innerHTML = '<p>Chưa dựng được văn bản.</p>'; return; }
      var html = tplHtml(r.d.src, r.d.V, false); $('#bmDoc', m).innerHTML = html;
      var used = {}; String(r.d.src).replace(/data-f="([^"]+)"/g, function (z, k) { used[k] = 1; });
      var c = coInfo(r.x.u), coMiss = CO_F.filter(function (f) { return used[f[2]] && !String(c[f[0]] || '').trim(); }), coKeys = {}; coMiss.forEach(function (f) { coKeys[f[2]] = 1; });
      var other = 0; Object.keys(used).forEach(function (k) { if (!coKeys[k] && (r.d.V[k] === '' || r.d.V[k] == null)) other++; });
      var out = '';
      if (coMiss.length) out += '<div class="notice warn" style="margin:0 0 8px;align-items:center">' + ic('info') + '<div style="flex:1">Chưa có thông tin công ty: <b>' + coMiss.map(function (f) { return f[1]; }).join(', ') + '</b> (' + esc(shortUnit(r.x.u.name)) + ').</div><button class="btn btn-sm btn-primary" id="bmCo" style="flex:none">Bổ sung ngay</button></div>';
      if (other) out += '<div class="notice" style="margin:0">' + ic('info') + '<div><b>' + other + ' ô thông tin nhân sự, hợp đồng còn trống</b> (chữ đỏ “……”) – bổ sung trong hồ sơ, hợp đồng của nhân sự rồi soạn lại, hoặc điền tay sau khi in.</div></div>';
      if (!out) out = '<div class="notice ok" style="margin:0">' + ic('check') + '<div>Đã điền đủ các ô thông tin.</div></div>';
      $('#bmMiss', m).innerHTML = out;
      var cb = $('#bmCo', m); if (cb) cb.addEventListener('click', function () {
        var before = $$('.modal-bg').length; ACTS['hd-co']();
        var bgs = $$('.modal-bg'), cm = bgs[bgs.length - 1], su = cm && $('#ciU', cm); if (su && su.value !== r.x.u.id) { su.value = r.x.u.id; su.dispatchEvent(new Event('change')); }
        var t = setInterval(function () { if ($$('.modal-bg').length <= before) { clearInterval(t); draw(); } }, 300);
      });
    }
    $('#bmP', m).addEventListener('change', function () { cur = this.value; draw(); }); draw();
    var fname = function (r) { return HR.stripAcc(b.ten + '_' + (r.d.V.ho_ten || r.x.ma)).replace(/[^A-Za-z0-9]+/g, '_').replace(/_$/, ''); };
    $('#bmWd', m).addEventListener('click', function () { var r = doc(); if (!r || !r.d) return; try { var L = signLbl(r.d.tp); saveDocx(tplDocx(r.d.src, r.d.V, [L[0][0], L[0][1], r.d.V.ho_ten || ''], [L[1][0], L[1][1], r.d.V.nguoi_dai_dien || '']), fname(r) + '.docx'); log('Soạn biểu mẫu hội nhập "' + b.ten + '" cho ' + (r.d.V.ho_ten || r.x.ma)); toast('Đã tải ' + fname(r) + '.docx', 'ok'); } catch (e) { logErr('Soạn biểu mẫu', e); toast('Chưa tạo được file Word', 'err'); } });
    $('#bmPr', m).addEventListener('click', function () { var r = doc(); if (r && r.d) hnBmPrint(b.ten + ' – ' + (r.d.V.ho_ten || ''), tplHtml(r.d.src, r.d.V, false)); });
  };
  ACTS['hn-bm-dl'] = function (a, id) { var b = hnBmById(id); if (b) hnBmDownload(b); };
  ACTS['hn-kho'] = function () { var f = ps('hn', { ed: null, role: '', view: 'tbl' }); f.kho = 1; window.scrollTo(0, 0); render(); };
  ACTS['hn-kho-back'] = function () { var f = ps('hn', { ed: null, role: '', view: 'tbl' }); f.kho = 0; window.scrollTo(0, 0); render(); };
  ACTS['hn-bm-hdkho'] = function () { go('hd'); setTimeout(function () { if (ACTS['hd-tab']) ACTS['hd-tab'](null, 'mau'); }, 60); };
  ACTS['hn-bm-view'] = function (a, id) {
    var b = hnBmById(id); if (!b) return;
    var m = modal(b.ten, HN_BM_TY[b.loai] + (b.ghi ? ' · ' + b.ghi : ''), '<div class="hn-bmv">' + hnBmPreview(b) + '</div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Đóng</button><button class="btn" id="hnBmD">' + ic('hn_up', 14).replace('M12 15V4M7.5 8.5 12 4l4.5 4.5', 'M12 4v11M7.5 10.5 12 15l4.5-4.5') + 'Tải biểu mẫu</button>' + (b.nguoi === 'hcns' && b.loai !== 'file' ? '<button class="btn" id="hnBmS">' + ic('hn_doc', 14) + 'Soạn cho nhân sự</button>' : '') + '<button class="btn btn-primary" id="hnBmE">' + ic('td_edit', 14) + 'Sửa biểu mẫu</button></div>');
    $('#hnBmE', m).addEventListener('click', function () { m.close(); ACTS['hn-bm-edit'](null, id); });
    $('#hnBmD', m).addEventListener('click', function () { hnBmDownload(b); });
    if ($('#hnBmS', m)) $('#hnBmS', m).addEventListener('click', function () { m.close(); ACTS['hn-bm-soan'](null, id); });
  };
  ACTS['hn-bm-del'] = function (a, id) {
    var b = hnBmById(id); if (!b) return; var use = hnBmUse(id);
    var m = modal('Xóa biểu mẫu?', b.ten, '<p>' + (use.length ? 'Biểu mẫu đang gắn ở <b>' + use.length + ' bước</b>; xóa sẽ gỡ khỏi các bước đó (người đang hội nhập không thấy biểu mẫu này nữa).' : 'Biểu mẫu chưa gắn bước nào.') + '</p><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Không xóa</button><button class="btn btn-danger" id="hnBmDel">Xóa</button></div>', true);
    $('#hnBmDel', m).addEventListener('click', function () {
      S.units.forEach(function (u) { var h = hnOf(u); h.jr.forEach(function (j) { j.steps.forEach(function (st) { if (st.bm) st.bm = st.bm.filter(function (x) { return x !== id; }); }); }); h.ob.forEach(function (o) { o.steps.forEach(function (st) { if (st.bm) st.bm = st.bm.filter(function (x) { return x !== id; }); }); }); });
      hnBmSave(hnBms().filter(function (x) { return x.id !== id; }), 'xóa "' + b.ten + '"'); hnSave('Gỡ biểu mẫu "' + b.ten + '" khỏi các bước'); m.close(); render();
    });
  };
  ACTS['hn-bm-reset'] = function () {
    var have = {}; hnBms().forEach(function (b) { have[b.id] = 1; }); var add = hnBmDefaults().filter(function (b) { return !have[b.id]; });
    if (!add.length) { toast('Kho đã đủ các biểu mẫu gợi ý', 'info'); return; }
    hnBmSave(hnBms().concat(add), 'khôi phục ' + add.length + ' mẫu gợi ý'); render(); toast('Đã thêm lại ' + add.length + ' biểu mẫu gợi ý', 'ok');
  };
  ACTS['hn-bm-edit'] = function (a, id) {
    var old = id ? hnBmById(id) : null, b = old ? JSON.parse(JSON.stringify(old)) : { id: '', ten: '', nguoi: 'nv', loai: 'soan', nd: '# TÊN BIỂU MẪU\n\nHọ và tên: {{ho_ten}}    Bộ phận: {{phong_ban}}\n\n## 1. Nội dung\n……………………………………………………', ghi: '' };
    var tplOpts = [['@tv', 'Hợp đồng thử việc – tự lấy mẫu theo loại hợp đồng'], ['@ld', 'Hợp đồng lao động – tự lấy mẫu theo loại hợp đồng, khối']].concat(tpls().map(function (t) { return [t.id, t.ten]; }));
    var body = '<div class="hn-bmf"><div class="hn-g2"><div class="field"><label for="bmTen">Tên biểu mẫu *</label><input class="input" id="bmTen" value="' + esc(b.ten) + '" placeholder="Ví dụ: Phiếu thông tin người thân liên hệ"></div>' +
      '<div class="field"><label for="bmGhi">Hướng dẫn cho người mới</label><input class="input" id="bmGhi" value="' + esc(b.ghi || '') + '" placeholder="Ví dụ: In, điền và nộp lại phòng nhân sự ngày đầu"></div></div>' +
      '<div class="field"><label>Ai hoàn thiện văn bản</label><div class="seg" id="bmWho">' + Object.keys(HN_BM_WHO).map(function (k) { return '<button type="button" class="td-pill' + ((b.nguoi || 'nv') === k ? ' on' : '') + '" data-w="' + k + '">' + HN_BM_WHO[k] + (k === 'hcns' ? ' – soạn theo từng người, in ra' : ' – tải về, tự điền') + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>Loại</label><div class="seg" id="bmTy">' + Object.keys(HN_BM_TY).map(function (k) { return '<button type="button" class="td-pill' + (b.loai === k ? ' on' : '') + '" data-ty="' + k + '">' + HN_BM_TY[k] + '</button>'; }).join('') + '</div></div><div id="bmBody"></div>' +
      '<div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="bmOk">' + (old ? 'Lưu thay đổi' : 'Thêm vào kho') + '</button></div></div>';
    var m = modal(old ? 'Sửa biểu mẫu' : 'Thêm biểu mẫu hội nhập', old ? old.ten : 'Người mới mở xem, tải ngay trên app nhân viên', body);
    function pv() { var el = $('#bmPv', m); if (el) el.innerHTML = hnBmPreview(b); }
    function draw() {
      var el = $('#bmBody', m);
      if (b.loai === 'soan') {
        el.innerHTML = '<div class="g2"><div class="field"><label for="bmNd">Nội dung</label><div class="chips">' + HN_BM_CHIPS.map(function (c) { return '<button type="button" data-k="' + c[0] + '" title="Chèn {{' + c[0] + '}}">' + esc(c[1]) + '</button>'; }).join('') + '</div><textarea class="input" id="bmNd" spellcheck="false">' + esc(b.nd || '') + '</textarea>' +
          '<div class="hint muted" style="font-size:11.5px;line-height:1.55;margin-top:6px">Ký hiệu đầu dòng: <b>#</b> tiêu đề lớn · <b>##</b> mục · <b>^</b> căn giữa, đậm · <b>~</b> căn giữa, nghiêng · <b>_</b> nghiêng · <b>---</b> gạch ngang · <b>[CHU_KY]</b> khối chữ ký 2 bên · <b>**chữ đậm**</b>. Bấm nút phía trên để chèn ô tự điền thông tin người mới.</div></div>' +
          '<div class="field"><label>Xem thử</label><div class="pv" id="bmPv"></div></div></div>';
        var ta = $('#bmNd', el), t0 = 0;
        ta.addEventListener('input', function () { b.nd = ta.value; clearTimeout(t0); t0 = setTimeout(pv, 250); });
        $$('.chips button', el).forEach(function (x) { x.addEventListener('click', function () { var k = '{{' + x.getAttribute('data-k') + '}}', p0 = ta.selectionStart || 0, p1 = ta.selectionEnd || 0; ta.value = ta.value.slice(0, p0) + k + ta.value.slice(p1); ta.focus(); ta.selectionStart = ta.selectionEnd = p0 + k.length; b.nd = ta.value; pv(); }); });
      } else if (b.loai === 'hd') {
        if (!b.tpl) b.tpl = '@tv';
        el.innerHTML = '<div class="field"><label for="bmTpl">Lấy từ mẫu</label><select class="input" id="bmTpl">' + tplOpts.map(function (o) { return opt(o[0], o[1], b.tpl); }).join('') + '</select><div class="hint muted" style="font-size:12px;margin-top:4px">Sửa nội dung hợp đồng ở <a href="#" class="plink" data-act="hn-bm-hdkho">Kho hợp đồng mẫu</a> – biểu mẫu này luôn lấy bản mới nhất. Người đã có hợp đồng trong phần mềm thấy đúng hợp đồng của mình; chưa có thì các ô chưa có thông tin để trống “……”.</div></div><div class="field"><label>Xem thử</label><div class="pv" id="bmPv"></div></div>';
        $('#bmTpl', el).addEventListener('change', function () { b.tpl = this.value; if (!$('#bmTen', m).value.trim()) $('#bmTen', m).value = /^@/.test(b.tpl) ? (b.tpl === '@tv' ? 'Hợp đồng thử việc' : 'Hợp đồng lao động') : this.options[this.selectedIndex].text; pv(); });
      } else {
        el.innerHTML = '<div class="field"><label for="bmFile">File biểu mẫu (PDF, Word, Excel, ảnh – tối đa 300 KB)</label><input type="file" class="input" id="bmFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"><div class="hint muted" style="font-size:12px;margin-top:4px">File được gửi kèm hồ sơ lên máy chủ chấm công khi đồng bộ để người mới tải trên điện thoại, nên giới hạn dung lượng. File Word lớn: lưu thành PDF trước.</div></div><div id="bmPv"></div>';
        $('#bmFile', el).addEventListener('change', function () {
          var fl = this.files && this.files[0]; if (!fl) return;
          if (fl.size > HN_BM_MAX) { toast('File ' + Math.round(fl.size / 1024) + ' KB – vượt 300 KB', 'err', 'Lưu thành PDF hoặc giảm chất lượng ảnh rồi tải lại.'); this.value = ''; return; }
          var rd = new FileReader(); rd.onload = function () { var u8 = String(rd.result), i = u8.indexOf(','); b.f = { n: fl.name, t: fl.type || 'application/octet-stream', d: u8.slice(i + 1) }; if (!$('#bmTen', m).value.trim()) $('#bmTen', m).value = fl.name.replace(/\.[^.]+$/, ''); pv(); }; rd.readAsDataURL(fl);
        });
      }
      pv();
    }
    $$('#bmWho button', m).forEach(function (x) { x.addEventListener('click', function () { b.nguoi = x.getAttribute('data-w'); $$('#bmWho button', m).forEach(function (y) { y.classList.toggle('on', y === x); }); }); });
    $$('#bmTy button', m).forEach(function (x) { x.addEventListener('click', function () { b.loai = x.getAttribute('data-ty'); $$('#bmTy button', m).forEach(function (y) { y.classList.toggle('on', y === x); }); draw(); }); });
    draw();
    $('#bmOk', m).addEventListener('click', function () {
      b.ten = $('#bmTen', m).value.trim(); b.ghi = $('#bmGhi', m).value.trim();
      if (!b.ten) { toast('Nhập tên biểu mẫu', 'err'); $('#bmTen', m).focus(); return; }
      if (b.loai === 'file' && !b.f) { toast('Chọn file biểu mẫu', 'err'); return; }
      if (b.loai === 'soan' && !String(b.nd || '').trim()) { toast('Nội dung đang trống', 'err'); return; }
      if (b.loai !== 'soan') delete b.nd; if (b.loai !== 'hd') delete b.tpl; if (b.loai !== 'file') delete b.f;
      var L = hnBms().slice();
      if (old) L = L.map(function (x) { return x.id === old.id ? b : x; });
      else { var mx = 0; L.forEach(function (x) { var q = /^BM(\d+)$/.exec(x.id); if (q) mx = Math.max(mx, +q[1]); }); b.id = 'BM' + p2(mx + 1); L.push(b); }
      hnBmSave(L, (old ? 'sửa "' : 'thêm "') + b.ten + '"'); m.close(); render(); toast(old ? 'Đã lưu biểu mẫu' : 'Đã thêm "' + b.ten + '" vào kho', 'ok', old ? '' : 'Gắn vào bước ở cột “Biểu mẫu” trong bảng checklist của hành trình.');
    });
  };
  // Chọn biểu mẫu cho 1 bước (bảng checklist)
  function hnBmPop(btn, id) {
    var open = HN_POP && HN_POP.getAttribute('data-id') === 'bm' + id; hnPopClose(); if (open) return;
    var d = hnEd(), s = d && d.steps.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var L = hnBms(), pop = document.createElement('div'); pop.className = 'hn-pop'; pop.setAttribute('data-id', 'bm' + id);
    pop.innerHTML = '<div class="hn-pop-h">Biểu mẫu người mới xem, điền ở bước này</div>' + (L.length ? L.map(function (b) { return '<label class="hn-chk"><input type="checkbox" value="' + esc(b.id) + '"' + ((s.bm || []).indexOf(b.id) >= 0 ? ' checked' : '') + '><span>' + esc(b.ten) + ' <span class="faint" style="font-size:11px">· ' + HN_BM_TY[b.loai] + '</span></span></label>'; }).join('') : '<p class="muted" style="margin:4px 0">Kho đang trống.</p>') +
      '<div class="hn-pop-f" style="justify-content:space-between"><button class="btn btn-sm" id="hnBmKho">Mở kho biểu mẫu</button><button class="btn btn-sm btn-primary" id="hnBmX">Xong</button></div>';
    document.body.appendChild(pop); HN_POP = pop;
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    pop.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    pop.addEventListener('change', function () { hnPush('Đổi biểu mẫu'); s.bm = $$('input', pop).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); btn.innerHTML = hnBmChips(s); hnDirty(); });
    $('#hnBmX', pop).addEventListener('click', hnPopClose);
    $('#hnBmKho', pop).addEventListener('click', function () { hnPopClose(); if (hnEd() && hnEd().dirty) { toast('Lưu hành trình trước khi mở kho biểu mẫu', 'info', 'Các thay đổi chưa lưu sẽ hỏi lại khi rời trang.'); return; } PS.hn.ed = null; ACTS['hn-kho'](); });
    setTimeout(function () { document.addEventListener('mousedown', hnPopOut, true); document.addEventListener('keydown', hnPopKey, true); window.addEventListener('scroll', hnPopClose, true); }, 0);
  }

  /* ---------------- Dữ liệu ---------------- */
  function hnOf(u) {
    if (!u.hn) u.hn = { v: 1, jr: [], ob: [] };
    if (!u.hn.jr) u.hn.jr = []; if (!u.hn.ob) u.hn.ob = [];
    if (u.source === 'sample' && u.hn.seed !== HN_SEED) {
      u.hn.seed = HN_SEED; u.hn.jr = [{ gid: 'HT01', name: HN_SNAME, desc: HN_SDESC, on: true, sc: { all: true, pb: [], cd: [] }, steps: hnSample(), at: '2026-11-11', upd: '2026-11-11' }]; u.hn.ob = [];
      try { hnSeedOb(u); } catch (e) { logErr('Tạo dữ liệu mẫu hội nhập', e); }
      HN_PREV[u.id] = JSON.stringify(u.hn); // mốc hoàn tác tính từ sau khi tạo dữ liệu mẫu
    }
    if (HN_PREV[u.id] === undefined) HN_PREV[u.id] = JSON.stringify(u.hn);
    return u.hn;
  }
  var HNV = 0, HN_PREV = {}, HN_UNDO = [], HN_REDO = [];
  function hnLbl(t) { return String(t || 'Thay đổi').replace(/\b(HN|HT)\d+(\/b\d+)?\s*/g, '').replace(/\s+/g, ' ').trim(); }
  function hnSave(txt) {
    HNV++; if (txt) log('Hội nhập: ' + txt);
    var prev = {}, changed = false;
    S.units.forEach(function (u) { if (!u.hn) return; var cur = JSON.stringify(u.hn); if (HN_PREV[u.id] !== undefined && HN_PREV[u.id] !== cur) { prev[u.id] = HN_PREV[u.id]; changed = true; } HN_PREV[u.id] = cur; });
    if (changed) { HN_UNDO.push({ l: hnLbl(txt), prev: prev }); if (HN_UNDO.length > 30) HN_UNDO.shift(); HN_REDO = []; hnSnack(hnLbl(txt), 'undo'); }
    saveUnits();
  }
  function hnSwap(from, to, verb) {
    var x = from.pop(); if (!x) { toast(verb === 'undo' ? 'Không còn thao tác nào để hoàn tác' : 'Không còn thao tác nào để làm lại', 'info'); return; }
    var back = {}; Object.keys(x.prev).forEach(function (id) { var u = unitById(id); if (!u) return; back[id] = JSON.stringify(u.hn); u.hn = JSON.parse(x.prev[id]); HN_PREV[id] = x.prev[id]; });
    to.push({ l: x.l, prev: back }); HNV++; log('Hội nhập: ' + (verb === 'undo' ? 'hoàn tác' : 'làm lại') + ' – ' + x.l); saveUnits(); hnRerender();
    hnSnack((verb === 'undo' ? 'Đã hoàn tác: ' : 'Đã làm lại: ') + x.l, verb === 'undo' ? 'redo' : 'undo');
  }
  function hnUndoSaved() { hnSwap(HN_UNDO, HN_REDO, 'undo'); }
  function hnRedoSaved() { hnSwap(HN_REDO, HN_UNDO, 'redo'); }
  // Thanh báo nhỏ có nút Hoàn tác / Làm lại (9 giây; Ctrl+Z / Ctrl+Y dùng được lâu hơn)
  function hnSnack(msg, btn) {
    var el = $('#hnSnack'); if (!el) { el = document.createElement('div'); el.id = 'hnSnack'; el.className = 'hn-snack'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (btn === 'undo' && HN_UNDO.length ? '<button data-act="hn-sundo">' + ic('hn_undo', 14) + 'Hoàn tác</button>' : btn === 'redo' && HN_REDO.length ? '<button data-act="hn-sredo">' + ic('hn_redo', 14) + 'Làm lại</button>' : '') + '<button class="x" data-act="hn-sclose" aria-label="Đóng">×</button>';
    el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('on'); }, 9000);
  }
  ACTS['hn-sundo'] = function () { hnUndoSaved(); };
  ACTS['hn-sredo'] = function () { hnRedoSaved(); };
  ACTS['hn-sclose'] = function () { var el = $('#hnSnack'); if (el) el.classList.remove('on'); };
  // Gom hành trình theo gid trên các công ty đang chọn
  function hnAll(us) {
    var by = {}, order = [];
    (us || S.units).forEach(function (u) { hnOf(u).jr.forEach(function (j) { if (!by[j.gid]) { by[j.gid] = { gid: j.gid, j: j, units: [] }; order.push(j.gid); } by[j.gid].units.push({ u: u, sc: j.sc, j: j }); }); });
    return order.map(function (g) { return by[g]; });
  }
  function hnNextGid() { var mx = 0; S.units.forEach(function (u) { hnOf(u).jr.forEach(function (j) { var m = /^HT(\d+)$/.exec(j.gid); if (m) mx = Math.max(mx, +m[1]); }); }); return 'HT' + p2(mx + 1); }
  function hnPos(e) { return String(e['Chức danh công việc'] || e['Chức vụ'] || '').trim(); }
  // Danh mục phòng ban → vị trí của 1 công ty: từ nhân sự (mọi trạng thái trừ đã nghỉ) + phiếu nhu cầu tuyển dụng
  function hnTree(u) {
    var R = refDate(), pbs = [], map = {};
    function add(pb, cd, working) { pb = String(pb || '').trim() || '(Chưa có phòng ban)'; cd = String(cd || '').trim(); if (!map[pb]) { map[pb] = { pb: pb, cds: {}, order: [] }; pbs.push(pb); } if (!cd) return; var x = map[pb].cds[cd]; if (!x) { x = map[pb].cds[cd] = { cd: cd, n: 0 }; map[pb].order.push(cd); } if (working) x.n++; }
    (u.data.PB || []).forEach(function (p) { add(p['Tên phòng ban'], ''); });
    (u.data.NV || []).forEach(function (e) { var st = HR.staffState(e, R); if (st === 'left') return; add(e['Phòng ban'], hnPos(e), true); });
    try { tdOf(u).rq.forEach(function (r) { if (r.st !== 'closed') add(r.pb, r.cd || r.pos, false); }); } catch (e) { }
    return pbs.map(function (pb) { var m = map[pb]; return { pb: pb, cds: m.order.map(function (c) { return m.cds[c]; }) }; });
  }
  // Mức cụ thể của phạm vi: vị trí (3) > phòng ban (2) > toàn công ty (1); 0 = không khớp
  function hnScore(sc, pb, cd) {
    if (!sc) return 0;
    if (sc.all) return 1;
    var okPb = !sc.pb.length || sc.pb.indexOf(pb) >= 0, okCd = !sc.cd.length || sc.cd.indexOf(cd) >= 0;
    if (!okPb || !okCd || (!sc.pb.length && !sc.cd.length)) return 0;
    return sc.cd.length ? 3 : 2;
  }
  function hnMatch(u, pb, cd) {
    var best = 0, hit = [];
    hnOf(u).jr.forEach(function (j) { if (!j.on) return; var s = hnScore(j.sc, pb, cd); if (!s) return; if (s > best) { best = s; hit = [j]; } else if (s === best) hit.push(j); });
    return hit;
  }
  function hnScText(u, sc) {
    if (!sc) return '';
    if (sc.all) return 'Toàn công ty';
    var a = [];
    if (sc.pb.length) a.push(sc.pb.join(', '));
    if (sc.cd.length) a.push(sc.cd.length <= 3 ? sc.cd.join(', ') : sc.cd.length + ' vị trí');
    return a.join(' · ') || 'Chưa chọn phòng ban, vị trí';
  }
  function hnWhen(s) {
    var n = +s.n || 0;
    if (s.ph === 'pre') return 'Trước ' + n + ' ngày';
    if (s.ph === 'd1') return s.t1 ? s.t1 + (s.t2 ? '–' + s.t2 : '') : 'Trong ngày';
    if (s.ph === 'w1' || s.ph === 'pr') return 'Ngày thứ ' + n;
    if (s.ph === 'end') return n ? 'Trước ' + n + ' ngày' : 'Ngày cuối thử việc';
    if (s.ph === 'off') return 'Sau ' + n + ' ngày';
    return '';
  }
  function hnSortKey(s) {
    var n = +s.n || 0, t = s.t1 ? +s.t1.replace(':', '') : 9999;
    return s.ph === 'pre' ? -n : s.ph === 'end' ? -n : s.ph === 'd1' ? t : n;
  }
  function hnSorted(steps, ph) { return steps.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return x.s.ph === ph; }).sort(function (a, b) { return hnSortKey(a.s) - hnSortKey(b.s) || a.i - b.i; }).map(function (x) { return x.s; }); }
  function hnRoleTag(r, small) { var x = HN_ROLE.filter(function (z) { return z[0] === r; })[0]; if (!x) return r ? '<span class="hn-role' + (small ? ' sm' : '') + '">' + esc(r) + '</span>' : ''; return '<span class="hn-role' + (small ? ' sm' : '') + '" style="--rc:' + x[2] + '">' + esc(x[1]) + '</span>'; }

  /* ---------------- CSS ---------------- */
  (function () {
    var css = [
      '.hn-gw{overflow:auto;max-height:calc(100vh - 150px);border:1px solid var(--line);border-radius:12px;background:var(--surface);overscroll-behavior:contain}.hn-g{border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:13px;min-width:100%}.hn-g td .btn{white-space:nowrap;max-width:100%}',
      '.hn-g th{position:sticky;top:0;z-index:2;background:var(--surface-2);text-align:left;font-size:12px;font-weight:700;color:var(--ink-2);padding:9px 8px;border-bottom:1px solid var(--line-2);border-right:1px solid var(--line);white-space:nowrap;overflow:hidden;vertical-align:middle}.hn-g td{border-bottom:1px solid var(--line);border-right:1px solid var(--line);vertical-align:top;background:var(--surface);overflow:hidden;overflow-wrap:anywhere;white-space:normal;padding:8px}.hn-g th.c,.hn-g td.c{text-align:center}.hn-g td.c{vertical-align:middle}',
      '.hn-g .s0{position:sticky;left:0;z-index:1}.hn-g .s1{position:sticky;left:var(--l1);z-index:1}.hn-g .s2{position:sticky;left:var(--l2);z-index:1;box-shadow:4px 0 6px -4px rgba(0,0,0,.18)}.hn-g th.s0,.hn-g th.s1,.hn-g th.s2{z-index:3}.hn-g .hn-tph td{background:var(--pri-soft);padding:0;border-right:none}.hn-g .hn-tph span{position:sticky;left:0;display:inline-flex;gap:10px;align-items:baseline;padding:8px 12px}.hn-g .hn-tph b{color:var(--pri-ink);font-size:13.5px}.hn-g .hn-tph small{color:var(--muted);font-size:12px}',
      '.hn-list{display:flex;flex-direction:column;gap:12px;margin-bottom:22px}',
      '.hn-jr{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 18px;align-items:start}.hn-jr.off{opacity:.72}',
      '.hn-jr h3{margin:0;font-size:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.hn-jr h3 a{color:inherit;text-decoration:none}.hn-jr h3 a:hover{color:var(--pri-ink);text-decoration:underline}.hn-jr p{margin:4px 0 0;font-size:13px;color:var(--muted);line-height:1.5}',
      '.hn-sc{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.hn-sc span{font-size:12.5px;background:var(--surface-2);border-radius:8px;padding:4px 9px;color:var(--ink-2)}.hn-sc b{font-weight:700;color:var(--ink)}',
      '.hn-strip{display:flex;gap:4px;margin-top:12px;flex-wrap:wrap}.hn-strip span{font-size:11.5px;border-radius:6px;padding:3px 8px;background:var(--pri-soft);color:var(--pri-ink);font-weight:600}.hn-strip span em{font-style:normal;opacity:.75;font-weight:500;margin-left:4px}',
      '.hn-acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}',
      '.hn-role{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--rc,var(--ink-2));background:color-mix(in srgb,var(--rc,#888) 12%,transparent);border-radius:999px;padding:2px 9px;white-space:nowrap}.hn-role:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--rc,#888)}.hn-role.sm{font-size:11px;padding:1px 7px;font-weight:500}',
      '.hn-ed{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.hn-box{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 18px}.hn-box>h3{margin:0 0 4px;font-size:15px;display:flex;align-items:center;gap:8px}.hn-box>h3 .num{width:22px;height:22px;border-radius:50%;background:var(--pri);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center;flex:none}.hn-box>p.muted{margin:0 0 12px;font-size:13px}',
      '.hn-g2{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:10px 14px}.hn-g2 textarea.input{min-height:64px;height:auto;padding:8px 11px;line-height:1.5;resize:vertical}',
      '.hn-co{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:10px}.hn-co.on{border-color:var(--pri-soft-2);background:color-mix(in srgb,var(--pri-soft) 40%,transparent)}.hn-co-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.hn-co-h label{display:flex;gap:8px;align-items:center;font-weight:700;font-size:14px;cursor:pointer}.hn-co-h .sp{flex:1}.hn-co-h small{color:var(--muted);font-size:12.5px}',
      '.hn-co-b{margin-top:10px;display:flex;flex-direction:column;gap:10px}.hn-pbrow{display:flex;gap:10px;align-items:flex-start}.hn-pbrow>.td-flab{width:92px}',
      '.hn-pb{border-top:1px dashed var(--line);padding-top:8px}.hn-pb:first-child{border-top:none;padding-top:0}.hn-pb-h{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;margin-bottom:6px}.hn-pb-h small{color:var(--muted);font-weight:500}',
      '.hn-sum{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}',
      '.hn-ph{margin-top:14px}.hn-ph:first-child{margin-top:4px}.hn-ph-h{display:flex;align-items:baseline;gap:10px;padding:8px 0 6px;border-bottom:2px solid var(--pri-soft-2)}.hn-ph-h b{font-size:14px;color:var(--pri-ink)}.hn-ph-h small{color:var(--muted);font-size:12.5px}.hn-ph-h .sp{flex:1}.hn-ph-h em{font-style:normal;font-size:12px;color:var(--muted)}',
      '.hn-st{display:grid;grid-template-columns:136px minmax(0,1fr) minmax(150px,210px) auto;gap:6px 14px;padding:10px 4px;border-bottom:1px solid var(--line);align-items:start}.hn-st:hover{background:var(--surface-2)}.hn-st.dim{opacity:.35}',
      '.hn-when{display:inline-flex;align-items:flex-start;gap:5px;font-size:12.5px;font-weight:700;color:var(--ink-2);font-variant-numeric:tabular-nums;padding-top:1px;line-height:1.35}.hn-when svg{width:14px;height:14px;color:var(--pri);flex:none}',
      '.hn-tt{font-weight:600;font-size:14px;line-height:1.4}.hn-tt .tag{font-size:10.5px;margin-left:6px;vertical-align:1px}.hn-ds{font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:3px}.hn-meta{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:6px;font-size:12px;color:var(--ink-2)}.hn-meta span{display:inline-flex;gap:5px;align-items:flex-start}.hn-meta svg{width:13px;height:13px;flex:none;margin-top:1px;color:var(--muted)}.hn-meta .law{color:var(--info)}.hn-meta .law svg{color:var(--info)}.hn-meta a{color:var(--pri-ink)}',
      '.hn-who{display:flex;flex-direction:column;gap:4px;align-items:flex-start}.hn-who .co{display:flex;flex-wrap:wrap;gap:3px}',
      '.hn-sa{display:flex;gap:4px}.hn-sa .btn{padding:0 8px;height:28px}',
      '.hn-add{margin-top:8px;border:1px dashed var(--line-2);background:none;border-radius:10px;width:100%;padding:8px;font:inherit;font-size:13px;color:var(--muted);cursor:pointer;display:flex;gap:6px;align-items:center;justify-content:center}.hn-add:hover{border-color:var(--pri);color:var(--pri-ink)}.hn-add svg{width:15px;height:15px}',
      '.hn-cov .tbl td,.hn-cov .tbl th{padding:9px 10px}.hn-cov .miss{color:var(--danger);font-weight:600}.hn-cov .dup{color:var(--warn);font-weight:600}.hn-cov td small{display:block;color:var(--muted);font-size:11.5px}',
      '.hn-bar{position:sticky;bottom:0;z-index:5;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 -6px 18px -12px rgba(0,0,0,.25)}.hn-bar .sp{flex:1}.hn-bar .dirty{color:var(--warn);font-size:13px;font-weight:600}',
      '.hn-chk{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.45}.hn-chk input{margin-top:3px}.hn-roles{display:flex;flex-wrap:wrap;gap:6px 14px}',
      '.hn-empty{background:var(--surface);border:1px dashed var(--line-2);border-radius:14px;padding:30px;text-align:center}.hn-empty h2{margin:0 0 6px}',
      '.hn-tw{overflow:auto;max-height:72vh;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.hn-t{border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:13px}.hn-t th{position:sticky;overflow:hidden}.hn-thx{display:block;overflow:hidden;text-overflow:ellipsis;padding-right:6px}.hn-rz{position:absolute;top:0;right:0;width:10px;height:100%;cursor:col-resize;z-index:4;touch-action:none}.hn-rz:after{content:"";position:absolute;top:18%;bottom:18%;right:1px;width:3px;border-radius:2px;background:var(--line-2)}.hn-rz:hover:after,.hn-rz.on:after{background:var(--pri)}body.hn-resizing,body.hn-resizing *{cursor:col-resize!important;user-select:none!important}.hn-tfoot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;font-size:12px;flex-wrap:wrap}',
      '.hn-t th{position:sticky;top:0;z-index:2;background:var(--surface-2);text-align:left;font-size:12px;font-weight:700;color:var(--ink-2);padding:9px 8px;border-bottom:1px solid var(--line-2);border-right:1px solid var(--line);white-space:nowrap}.hn-t th.c,.hn-t td.c{text-align:center}',
      '.hn-t td{padding:2px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);vertical-align:top;background:var(--surface)}.hn-t td.c{vertical-align:middle}.hn-t td.c input[type=checkbox]{width:17px;height:17px;accent-color:var(--pri);cursor:pointer}',
      '.hn-t .s0{position:sticky;left:0;z-index:1;color:var(--muted);font-size:12px;vertical-align:middle}.hn-t .s1{position:sticky;left:var(--l1,40px);z-index:1}.hn-t .s2{position:sticky;left:var(--l2,190px);z-index:1;box-shadow:4px 0 6px -4px rgba(0,0,0,.18)}.hn-t th.s0,.hn-t th.s1,.hn-t th.s2{z-index:3}',
      '.hn-t .ci{display:block;width:100%;box-sizing:border-box;border:1px solid transparent;background:transparent;font:inherit;font-size:13px;color:inherit;padding:6px 7px;border-radius:6px;min-height:32px;line-height:1.45}.hn-t textarea.ci{resize:none;overflow:hidden}.hn-t select.ci{cursor:pointer;padding-right:4px}.hn-t .ci:hover{border-color:var(--line-2)}.hn-t .ci:focus{outline:none;border-color:var(--pri);background:var(--surface);box-shadow:0 0 0 2px var(--pri-soft)}.hn-t .ci.bad{border-color:var(--danger);background:var(--danger-soft)}.hn-t .ct{font-weight:600}',
      '.hn-tm{display:flex;align-items:center;gap:4px;padding:3px 4px;font-size:12.5px;color:var(--ink-2);white-space:nowrap;flex-wrap:wrap}.hn-tm .ci{display:inline-block;width:auto;text-align:center;font-weight:700;padding:5px 4px}.hn-tm .tm{width:54px}.hn-tm .nn{width:44px}.hn-tm small{color:var(--muted);font-size:11px}',
      '.hn-cobtn{text-align:left;cursor:pointer;display:flex!important;flex-wrap:wrap;gap:3px;align-items:center}',
      '.hn-tph td{background:var(--pri-soft);border-right:none;padding:0}.hn-tph span{position:sticky;left:0;display:inline-flex;gap:10px;align-items:baseline;padding:8px 12px}.hn-tph b{color:var(--pri-ink);font-size:13.5px}.hn-tph small{color:var(--muted);font-size:12px}',
      '.hn-tadd td{border-right:none;padding:0 0 4px}.hn-tadd span{position:sticky;left:0;display:block;width:430px;max-width:calc(100vw - 80px);padding:4px 6px 0}.hn-tadd .hn-add{margin-top:0;padding:6px;justify-content:flex-start}',
      '.hn-t tr.dim td{opacity:.35}.hn-t tr.dim td.s0,.hn-t tr.dim td.s1,.hn-t tr.dim td.s2{opacity:1;color:var(--faint)}.hn-t tr.flash td{animation:hnFlash 1.6s ease}@keyframes hnFlash{0%,40%{background:var(--warn-soft)}100%{background:var(--surface)}}',
      '.hn-pop{position:fixed;z-index:400;background:var(--surface);border:1px solid var(--line-2);border-radius:12px;box-shadow:0 14px 34px -14px rgba(0,0,0,.4);padding:10px 12px;display:flex;flex-direction:column;gap:7px;min-width:220px}.hn-pop-h{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}.hn-pop-f{display:flex;justify-content:flex-end;margin-top:2px}',
      '.hn-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.hn-opt{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;border:1.5px solid var(--line-2);background:var(--surface);border-radius:14px;padding:16px;font:inherit;color:inherit;cursor:pointer;transition:border-color .12s,box-shadow .12s}.hn-opt:hover,.hn-opt.drag{border-color:var(--pri);box-shadow:0 0 0 3px var(--pri-soft)}.hn-opt b{font-size:14.5px}.hn-opt>span:not(.hn-opt-ic){font-size:12.5px;color:var(--muted);line-height:1.5}.hn-opt-ic{width:40px;height:40px;border-radius:12px;background:var(--pri-soft);color:var(--pri-ink);display:flex;align-items:center;justify-content:center}.hn-drop{border-style:dashed}.hn-drop em{font-style:normal;font-size:12px;color:var(--pri-ink);font-weight:600;margin-top:2px}.hn-pick{display:flex;flex-direction:column;gap:8px}',
      '.hn-b3h{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:4px}.hn-b3h h3{margin:0;font-size:15px;display:flex;align-items:center;gap:8px;flex:1}.hn-b3h h3 .num{width:22px;height:22px;border-radius:50%;background:var(--pri);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center}',
      '.hn-tabs{display:inline-flex;background:var(--surface-2);border-radius:11px;padding:3px;gap:2px}.hn-tabs button{border:none;background:none;font:inherit;font-size:13px;font-weight:600;color:var(--muted);padding:6px 12px;border-radius:8px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}.hn-tabs button.on{background:var(--surface);color:var(--pri-ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}',
      '.hn-t td.hn-warn{background:var(--danger-soft)}.hn-t td.hn-warn .ci{color:var(--danger)}',
      '.hn-rm{display:grid;grid-template-columns:repeat(6,minmax(232px,1fr));gap:12px;overflow-x:auto;padding:4px 2px 10px}.hn-lane{background:var(--surface-2);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0;transition:box-shadow .12s}.hn-lane.over{box-shadow:0 0 0 2px var(--pri) inset}',
      '.hn-lane-h{display:flex;gap:9px;align-items:flex-start;padding:2px 2px 8px;border-bottom:2px solid var(--pri-soft-2);position:relative}.hn-lane-h b{display:block;font-size:13.5px;color:var(--pri-ink)}.hn-lane-h small{display:block;font-size:11.5px;color:var(--muted);line-height:1.35}.hn-lane-h em{margin-left:auto;font-style:normal;font-size:12px;font-weight:700;background:var(--surface);border-radius:20px;padding:1px 8px;color:var(--muted)}.hn-lane-n{width:24px;height:24px;flex:none;border-radius:50%;background:var(--pri);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}',
      '.hn-lane-b{display:flex;flex-direction:column;gap:7px;min-height:40px}.hn-cardx{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--pri);border-radius:10px;padding:8px 10px;cursor:grab;user-select:none;transition:box-shadow .12s,transform .12s}.hn-cardx:hover{box-shadow:0 6px 14px -10px rgba(0,0,0,.35);transform:translateY(-1px)}.hn-cardx.drag{opacity:.4}.hn-cardx.dim{opacity:.35}.hn-cardx.warn{border-left-color:var(--danger);background:var(--danger-soft)}.hn-cardx.flash{animation:hnFlash 1.6s ease}',
      '.hn-cx-t{display:flex;align-items:center;gap:6px;justify-content:space-between}.hn-cx-t .tag{font-size:10px}.hn-cx-tt{font-size:13px;font-weight:600;line-height:1.4;margin:4px 0 6px}.hn-cx-f{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.hn-nvic{margin-left:auto;color:var(--info);display:inline-flex}.hn-dropmark{height:4px;border-radius:2px;background:var(--pri);margin:-2px 0}.hn-lane .hn-add{margin-top:2px}',
      '.hn-h2{font-size:17px;margin:22px 0 10px}.hn-todo{margin-bottom:16px}.hn-todo-h{padding:12px 12px 4px}.hn-todo-h h3{margin:0;font-size:15px}.hn-todo-h p{margin:2px 0 0;font-size:12.5px}.hn-ttbl tr.late td{background:color-mix(in srgb,var(--danger-soft) 55%,transparent)}.hn-due b{display:block;font-variant-numeric:tabular-nums;white-space:nowrap}.hn-due small{display:block;font-size:11.5px;color:var(--muted)}tr.late .hn-due small{color:var(--danger);font-weight:600}',
      '.hn-ck{width:22px;height:22px;border-radius:7px;border:1.8px solid var(--line-2);background:var(--surface);cursor:pointer;color:#fff;font-weight:700;font-size:13px;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0}.hn-ck:hover{border-color:var(--pri)}.hn-ck.on{background:var(--pri);border-color:var(--pri)}.hn-ck:disabled{opacity:.35;cursor:default}',
      '.hn-sug{padding:14px 16px;margin-bottom:16px;border-color:var(--warn-soft)}.hn-sug h3{margin:0 0 10px;font-size:15px;display:flex;gap:8px;align-items:center}.hn-sug-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}.hn-sug-i{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:10px}.hn-sug-i>div{flex:1;min-width:0}.hn-sug-i small{display:block;font-size:12px;color:var(--muted)}',
      '.av{width:38px;height:38px;flex:none;border-radius:50%;background:var(--pri-soft);color:var(--pri-ink);font-weight:700;font-size:13px;display:inline-flex;align-items:center;justify-content:center}',
      '.hn-obs{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}.hn-ob{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:12px}.hn-ob.late{border-color:color-mix(in srgb,var(--danger) 45%,var(--line))}.hn-ob-h{display:flex;gap:10px;align-items:center}.hn-ob-h .grow{flex:1;min-width:0}.hn-ob-h a{color:inherit;text-decoration:none}.hn-ob-h a:hover b{color:var(--pri-ink);text-decoration:underline}.hn-ob-h b{font-size:15px}.hn-ob-h small{display:block;font-size:12.5px;color:var(--muted)}',
      '.hn-ob-k{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hn-ob-k span{font-size:11.5px;color:var(--muted)}.hn-ob-k b{display:block;font-size:14px;color:var(--ink);font-variant-numeric:tabular-nums}.hn-ob-k small{display:block;font-size:11.5px}',
      '.hn-seg{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.hn-seg i{height:8px;border-radius:4px;background:var(--surface-3,#e7ebe9);overflow:hidden;display:block}.hn-seg i b{display:block;height:100%;background:var(--pri)}.hn-seg i.ok b{width:100%!important}.hn-seg i.late{background:var(--danger-soft)}.hn-seg i.late b{background:var(--danger)}.hn-seg i.cur{box-shadow:0 0 0 1.5px var(--pri)}.hn-seg i.na{background:repeating-linear-gradient(45deg,var(--surface-2),var(--surface-2) 3px,transparent 3px,transparent 6px)}',
      '.hn-seg-l{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:-6px}.hn-seg-l span{font-size:10.5px;color:var(--faint);line-height:1.25}.hn-seg-l span.on{color:var(--pri-ink);font-weight:700}',
      '.hn-ob-n{background:var(--surface-2);border-radius:10px;padding:8px 10px}.hn-ob-n span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}.hn-ob-n b{display:block;font-size:13.5px;margin:2px 0}.hn-ob-n small{font-size:12px;color:var(--muted)}.hn-ob-n.late{background:var(--danger-soft)}.hn-ob-n.late small{color:var(--danger);font-weight:600}.hn-ob-n.ok{background:var(--pri-soft)}.hn-ob-f{display:flex;align-items:center;justify-content:space-between;gap:8px}.hn-ob-f .btn{display:inline-flex;gap:4px}',
      '.hn-kpi{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:12px;overflow:hidden}.hn-kpi>div{padding:12px 14px;border-left:1px solid var(--line)}.hn-kpi>div:first-child{border-left:none}.hn-kpi small{display:block;font-size:11.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;font-weight:700}.hn-kpi b{display:block;font-size:20px;margin:2px 0;font-variant-numeric:tabular-nums}.hn-kpi span{font-size:12px;color:var(--muted)}.hn-kpi .bad b{color:var(--danger)}',
      '.hn-phs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:14px}.hn-phs>div{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px;position:relative}.hn-phs .n{width:24px;height:24px;border-radius:50%;background:var(--surface-2);color:var(--muted);font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-bottom:4px}.hn-phs b{display:block;font-size:12.5px;line-height:1.3}.hn-phs small{font-size:11.5px;color:var(--muted)}.hn-phs .ok .n{background:var(--pri);color:#fff}.hn-phs .cur{border-color:var(--pri);box-shadow:0 0 0 1px var(--pri)}.hn-phs .cur .n{background:var(--pri-soft);color:var(--pri-ink)}.hn-phs .late{border-color:var(--danger)}.hn-phs .late .n{background:var(--danger);color:#fff}.hn-phs .late small{color:var(--danger);font-weight:600}.hn-phs .na{opacity:.5}',
      '.hn-otbl td{vertical-align:top}.hn-otbl tr.fin .hn-tt{color:var(--muted)}.hn-otbl tr.late td{background:color-mix(in srgb,var(--danger-soft) 55%,transparent)}.hn-otbl tr.dim td{opacity:.35}.hn-otbl tr.flash td{animation:hnFlash 1.6s ease}.hn-otbl .hn-tph td{background:var(--pri-soft)}',
      '.hn-ok{color:var(--pri-ink);font-weight:600;font-size:12.5px}.hn-ok small,.hn-skip small{display:block;font-weight:500;color:var(--warn);font-size:11.5px}.hn-skip{color:var(--muted);font-weight:600;font-size:12.5px}.hn-skip small{color:var(--muted)}.hn-late{color:var(--danger);font-weight:700;font-size:12.5px}.hn-note{width:100%;margin-top:6px;border:1px solid transparent;background:transparent;border-radius:6px;padding:4px 6px;font:inherit;font-size:12.5px;color:var(--ink-2)}.hn-note:hover{border-color:var(--line-2)}.hn-note:focus{outline:none;border-color:var(--pri);background:var(--surface)}',
      '.hn-sech{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:20px 0 10px}.hn-sech .hn-h2{margin:0}.hn-sech .sp{flex:1}.hn-h2 small{font-size:12.5px;font-weight:500;color:var(--muted);margin-left:8px}',
      '.hn-obt td{vertical-align:middle}.hn-obt tr.late td{background:color-mix(in srgb,var(--danger-soft) 45%,transparent)}.hn-pp{display:flex;gap:10px;align-items:center;min-width:190px}.hn-pp .av{width:34px;height:34px;font-size:12px}.hn-mini{margin:5px 0 2px;max-width:170px}.hn-mini .hn-seg i{height:6px}',
      '.hn-wcs{display:flex;flex-wrap:wrap;gap:4px;max-width:300px}.hn-obt td{white-space:normal}.hn-obt td:first-child{min-width:210px;max-width:270px}.hn-obt td.hn-due{min-width:150px;max-width:200px}.hn-obt td.hn-due b{white-space:normal}.hn-obt .hn-wcs{display:grid;gap:3px;max-width:none;min-width:190px}.hn-obt .hn-wc{background:none;padding:0;white-space:nowrap;font-size:12.5px;border-radius:0}.hn-obt .hn-wc i{min-width:64px;text-align:center}.hn-obt .hn-wc.more{padding:0;font-size:11.5px}.hn-obt td:nth-child(4){min-width:160px}.hn-obt td:nth-child(5){min-width:180px;max-width:240px}.hn-wc{display:inline-flex;align-items:center;gap:5px;font-size:12px;background:var(--surface-2);border-radius:999px;padding:2px 9px 2px 3px;white-space:nowrap}.hn-wc i{font-style:normal;font-size:10.5px;font-weight:700;color:var(--pri-ink);background:var(--pri-soft);border-radius:999px;padding:1px 6px}.hn-wc.miss{color:var(--danger);background:var(--danger-soft)}.hn-wc.miss i{background:var(--surface);color:var(--danger)}.hn-wc.more{padding:2px 8px;color:var(--muted)}.hn-lbl{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:5px}',
      '.hn-ob .hn-wcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;max-width:none}.hn-ob .hn-wc{white-space:normal;align-items:flex-start;border-radius:8px;padding:3px 8px 3px 3px;font-size:12px}.hn-ob .hn-wc i{flex:none}',
      '.hn-whobox{padding:14px 16px;margin-bottom:12px}.hn-whobox h3{margin:0;font-size:15px;display:flex;gap:8px;align-items:center}.hn-whobox p{margin:4px 0 10px;font-size:12.5px}.hn-whog{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px 14px}.hn-whog .field label{margin-bottom:4px;display:block}.hn-self{display:flex;align-items:center;background:var(--surface-2);color:var(--muted)}.hn-wn{display:block;font-size:12px;margin-top:3px;color:var(--ink-2);font-weight:600}.hn-wn.miss{color:var(--danger);font-weight:500}',
      '.hn-pe{margin-top:8px;font-size:13px;background:var(--pri-soft);color:var(--pri-ink);border-radius:8px;padding:7px 10px}.td-form h4{margin:16px 0 8px}',
      '.hn-t td{padding:2px}.hn-t .hn-cobtn{flex-wrap:wrap;overflow:hidden}.hn-g .hn-role{max-width:100%;white-space:normal;line-height:1.3;align-items:flex-start}.hn-g .hn-role:before{margin-top:.45em;flex:none}.hn-t select.ci{text-overflow:ellipsis}',
      '.hn-t .hn-tm{gap:3px;padding:6px 5px;flex-wrap:wrap;white-space:normal;font-size:12.5px;line-height:1.9}.hn-t .hn-tm .ci{display:inline-block;width:36px;min-height:26px;padding:2px 3px;text-align:center;font-weight:700;color:var(--pri-ink);background:var(--pri-soft);border:1px solid var(--pri-soft-2);border-radius:6px;font-variant-numeric:tabular-nums;line-height:1.3}.hn-t .hn-tm .tm{width:52px}.hn-t .hn-tm .ci:hover{border-color:var(--pri)}.hn-t .hn-tm .ci:focus{background:var(--surface);border-color:var(--pri)}',
      '.hn-backbtn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--pri);background:var(--pri-soft);color:var(--pri-ink);font:inherit;font-weight:700;font-size:13.5px;border-radius:10px;padding:6px 14px 6px 10px;cursor:pointer;transition:background .12s,color .12s}.hn-backbtn:hover{background:var(--pri);color:#fff}',
      '.hn-bar .btn:disabled{opacity:.45;cursor:default}.hn-bar .btn{display:inline-flex;gap:6px;align-items:center}',
      '.hn-snack{position:fixed;left:50%;bottom:22px;transform:translate(-50%,160%);z-index:500;background:#1f2a25;color:#fff;border-radius:12px;padding:8px 8px 8px 16px;display:flex;gap:8px;align-items:center;font-size:13.5px;box-shadow:0 12px 30px -10px rgba(0,0,0,.45);transition:transform .2s;max-width:calc(100vw - 32px)}.hn-snack.on{transform:translate(-50%,0)}.hn-snack span{flex:1;min-width:0}.hn-snack button{border:none;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-weight:700;border-radius:8px;padding:6px 12px;cursor:pointer;display:inline-flex;gap:6px;align-items:center;white-space:nowrap}.hn-snack button:hover{background:rgba(255,255,255,.26)}.hn-snack .x{background:none;padding:4px 8px;font-size:18px;line-height:1}',
      '.hn-otbl .hn-tt{font-weight:600;font-size:13.5px;line-height:1.4}.hn-otbl .hn-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.hn-otbl .hn-tags .tag{font-size:10.5px}.hn-otbl .hn-ds{font-size:12.5px;color:var(--ink-2);line-height:1.5}.hn-otbl .hn-prep{font-size:12.5px;color:var(--ink-2);line-height:1.5}.hn-otbl tr.fin .hn-tt,.hn-otbl tr.fin .hn-ds,.hn-otbl tr.fin .hn-prep{color:var(--muted)}.hn-hr{display:block;font-size:12px;color:var(--pri-ink)}.hn-co2{margin-bottom:5px}.hn-co2 small{display:block;font-size:12px;color:var(--ink-2);margin:2px 0 0 4px}',
      '.hn-otbl textarea.hn-note{display:block;width:100%;box-sizing:border-box;resize:none;overflow:hidden;min-height:30px;line-height:1.45;margin:0}.hn-otbl .hn-meta{margin-top:6px}',
      '.hn-obt .hn-wc{white-space:normal}.hn-obt .hn-pp{min-width:0}',
      '.hn-info{border:none;background:var(--info-soft);color:var(--info);width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;margin-left:6px;vertical-align:-3px;flex:none}.hn-info:hover{background:var(--info);color:#fff}.hn-ipop{display:flex;flex-direction:column;gap:12px}.hn-ip>b{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:3px}.hn-ip div{font-size:13.5px;line-height:1.55}.hn-ip .law{color:var(--info)}',
      '.hn-sum2{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.hn-sum2 .sp{flex:1}.hn-orm{grid-template-columns:repeat(6,minmax(220px,1fr))}.hn-oc{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--pri);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:5px}.hn-oc.fin{border-left-color:var(--line-2);opacity:.75}.hn-oc.late{border-left-color:var(--danger);background:color-mix(in srgb,var(--danger-soft) 60%,var(--surface))}.hn-oc.dim{opacity:.35}.hn-oc.flash{animation:hnFlash 1.6s ease}',
      '.hn-oc-t{display:flex;align-items:center;gap:6px}.hn-oc-t .hn-when{flex:1}.hn-oc-t .hn-info{margin-left:0}.hn-oc .hn-cx-tt{margin:0}.hn-oc-f{display:flex;flex-direction:column;align-items:flex-start;gap:2px}.hn-oc-f small{font-size:12px;font-weight:600;color:var(--ink-2)}.hn-oc-f small.miss{color:var(--danger);font-weight:500}.hn-oc-s{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12px}.hn-lk{border:none;background:none;color:var(--pri-ink);font:inherit;font-size:12px;font-weight:600;cursor:pointer;padding:0;text-decoration:underline}.hn-oc-n{font-size:12px;color:var(--info);display:flex;gap:4px;align-items:flex-start}.hn-oc-n svg{flex:none;margin-top:2px}',
      '@media (max-width:1100px){.hn-kpi{grid-template-columns:repeat(3,minmax(0,1fr))}.hn-phs{grid-template-columns:repeat(3,minmax(0,1fr))}.hn-opts{grid-template-columns:1fr}}',
      '@media (max-width:640px){.hn-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.hn-kpi>div{border-left:none;border-top:1px solid var(--line)}.hn-phs{grid-template-columns:repeat(2,minmax(0,1fr))}.hn-obs{grid-template-columns:1fr}.hn-sug-l{grid-template-columns:1fr}.hn-seg-l{display:none}}',
      '@media (max-width:900px){.hn-t .s1,.hn-t .s2{position:static;box-shadow:none}.hn-tadd span{width:auto}.hn-st{grid-template-columns:minmax(0,1fr) auto}.hn-st>.hn-when{grid-column:1/-1}.hn-st>.hn-who{grid-column:1/2}.hn-jr{grid-template-columns:1fr}.hn-acts{justify-content:flex-start}.hn-g2{grid-template-columns:1fr}.hn-pbrow{flex-direction:column;gap:4px}}',
      /* 12/11 12:33: kho biểu mẫu hội nhập */
      '.hn-bmc{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-start;text-align:left;min-height:28px}.hn-bmc .hn-bmt{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;background:var(--pri-soft);color:var(--pri-ink);border-radius:6px;padding:2px 7px;line-height:1.35}',
      '.hn-bmw{display:inline-block;white-space:nowrap;font-size:12px;font-weight:700;border-radius:99px;padding:2px 10px}.hn-bmw.hcns{background:#E3EEE6;color:#1D6A50}.hn-bmw.nv{background:#F6ECDD;color:#8A5310}.hn-bmk .hn-sa{flex-wrap:wrap;justify-content:center}',
      '.hn-bmt.hd{background:#E6EEF7;color:#1F5F8B}.hn-bmt.file{background:#F6ECDD;color:#8A5310}',
      '.hn-bmk td{vertical-align:top}.hn-bmk .hn-bmn{font-weight:600;color:var(--ink)}.hn-bmk .hn-bmu{display:flex;flex-direction:column;gap:3px;font-size:12.5px}.hn-bmk .hn-bmu span{color:var(--ink-2)}',
      '.hn-bmf .seg{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 10px}.hn-bmf textarea.input{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.5;min-height:300px}',
      '.hn-bmf .chips{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 4px}.hn-bmf .chips button{font:inherit;font-size:11.5px;border:1px solid var(--line-2);background:var(--surface-2);border-radius:99px;padding:2px 9px;cursor:pointer;color:var(--ink-2)}.hn-bmf .chips button:hover{border-color:var(--pri);color:var(--pri-ink)}',
      '.hn-bmf .g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}.hn-bmf .pv{max-height:460px;overflow:auto}.hn-bmf .pv .tp-paper{padding:18px 20px;font-size:12.5px}@media (max-width:900px){.hn-bmf .g2{grid-template-columns:1fr}}',
      '.hn-bmv .tp-paper{max-height:65vh;overflow:auto}.hn-bmfile{display:flex;align-items:center;gap:10px;padding:12px;border:1px dashed var(--line-2);border-radius:10px;background:var(--surface-2)}.hn-bmfile img{max-width:100%;border-radius:8px}',
    ].join('\n');
    var st = document.createElement('style'); st.id = 'hn-css'; st.textContent = css; document.head.appendChild(st);
  })();

  /* =====================================================================
     TRANG THIẾT LẬP HÀNH TRÌNH
     ===================================================================== */
  var HN_GAP = { miss: [], dup: [] };
  PAGES.hnlotrinh = function () {
    var f = ps('hn', { ed: null, role: '', view: 'tbl' });
    if (f.ed) return hnEditor(f);
    if (f.kho) return hnKhoPage();
    var us = selUnits(), list = hnAll(us), R = refDate();
    var miss = [], dup = [];
    us.forEach(function (u) { hnTree(u).forEach(function (p) { p.cds.forEach(function (c) { var h = hnMatch(u, p.pb, c.cd), it = { u: u, pb: p.pb, cd: c.cd, n: c.n, h: h }; if (!h.length) miss.push(it); else if (h.length > 1) dup.push(it); }); }); });
    HN_GAP = { miss: miss, dup: dup };
    var run = 0, late = 0; us.forEach(function (u) { hnOf(u).ob.forEach(function (o) { if (o.st === 'run') { run++; if (hnObStat(o, R).late.length) late++; } }); });
    var onN = list.filter(function (x) { return x.j.on; }).length;
    var stats = tdStats('hn-k', '', [
      { id: 'list', n: onN, label: 'hành trình đang áp dụng', sub: list.length > onN ? (list.length - onN) + ' hành trình tạm tắt' : '', icon: 'hnlotrinh', tip: 'Danh sách hành trình' },
      { id: 'run', n: run, label: 'người mới đang hội nhập', sub: late ? late + ' người có việc quá hạn' : 'xem ở Hội nhập nhân sự mới', icon: 'hntiendo', tone: late ? 'warn' : '', tip: 'Mở Hội nhập nhân sự mới' },
      { id: 'miss', n: miss.length, label: 'vị trí chưa có hành trình', sub: miss.length ? 'bấm để xem danh sách' : 'mọi vị trí đều đã có', icon: 'info', tone: miss.length ? 'bad' : '', tip: 'Xem các vị trí chưa có hành trình' },
      { id: 'dup', n: dup.length, label: 'vị trí trùng 2 hành trình', sub: dup.length ? 'bấm để xem danh sách' : 'cùng mức phạm vi', icon: 'info', tone: dup.length ? 'warn' : '', tip: 'Xem các vị trí bị trùng' }]);
    var multi = us.length > 1;
    var cards = list.length ? '<div class="hn-list">' + list.map(function (x) {
      var j = x.j, cnt = {}; j.steps.forEach(function (s) { cnt[s.ph] = (cnt[s.ph] || 0) + 1; });
      var req = j.steps.filter(function (s) { return s.req; }).length, hcns = j.steps.filter(function (s) { return s.own === 'hcns'; }).length;
      var used = 0; S.units.forEach(function (u) { hnOf(u).ob.forEach(function (o) { if (o.gid === j.gid && o.st === 'run') used++; }); });
      return '<div class="hn-jr' + (j.on ? '' : ' off') + '"><div><h3><a href="#" data-act="hn-edit" data-id="' + esc(j.gid) + '">' + esc(j.name) + '</a><span class="tag ' + (j.on ? 'tag-ok' : 'tag-mute') + '">' + (j.on ? 'Đang áp dụng' : 'Tạm tắt') + '</span><span class="faint" style="font-size:12px;font-weight:500">' + esc(j.gid) + '</span></h3>' +
        (j.desc ? '<p>' + esc(j.desc) + '</p>' : '') +
        '<div class="hn-sc">' + x.units.map(function (z) { return '<span>' + (multi || S.units.length > 1 ? '<b>' + esc(shortUnit(z.u.name)) + ':</b> ' : 'Áp dụng: ') + esc(hnScText(z.u, z.sc)) + '</span>'; }).join('') + '</div>' +
        '<div class="hn-strip">' + HN_PH.filter(function (p) { return cnt[p[0]]; }).map(function (p) { return '<span>' + p[1] + '<em>' + cnt[p[0]] + '</em></span>'; }).join('') + '</div>' +
        '<p style="margin-top:8px">' + j.steps.length + ' bước · ' + req + ' bước bắt buộc · ' + hcns + ' việc của hành chính nhân sự' + (used ? ' · <a href="#" class="plink" data-act="hn-k" data-id="run">' + used + ' người đang đi theo hành trình này</a>' : '') + '</p></div>' +
        '<div class="hn-acts"><button class="btn btn-sm btn-primary" data-act="hn-edit" data-id="' + esc(j.gid) + '">' + ic('td_edit', 14) + 'Xem, sửa</button><button class="btn btn-sm" data-act="hn-print" data-id="' + esc(j.gid) + '">' + ic('td_print', 14) + 'In checklist</button><button class="btn btn-sm" data-act="hn-dup" data-id="' + esc(j.gid) + '">' + ic('td_copy', 14) + 'Nhân bản</button><button class="btn btn-sm" data-act="hn-onoff" data-id="' + esc(j.gid) + '">' + (j.on ? 'Tạm tắt' : 'Bật lại') + '</button><button class="btn btn-sm" data-act="hn-del" data-id="' + esc(j.gid) + '" title="Xóa hành trình">' + ic('td_trash', 14) + '</button></div></div>';
    }).join('') + '</div>' : '<div class="hn-empty" style="margin-bottom:22px;text-align:left"><h2 style="text-align:center">Chưa có hành trình hội nhập nào</h2><p class="muted" style="text-align:center">Chọn một cách để bắt đầu – sau đó sửa lại cho đúng thực tế công ty.</p>' + hnChooser() + '</div>';
    return '<div class="page-head"><div><h1>Thiết lập hành trình hội nhập</h1><p class="muted">Mỗi hành trình là checklist những việc phòng nhân sự và các bên cần làm khi đón một người mới – từ trước ngày đi làm đến khi ký chính thức. Chọn công ty, phòng ban, vị trí áp dụng: người mới thuộc phạm vi nào sẽ đi theo hành trình đó.</p></div><div class="link-row" style="margin:0"><button class="btn btn-kho" data-act="hn-kho" title="Biểu mẫu người mới cần xem, điền trong hành trình">' + ic('folder', 16) + 'Kho biểu mẫu hội nhập <b>' + hnBms().length + '</b></button><button class="btn btn-primary" data-act="hn-create">' + ic('td_plus', 15) + 'Tạo hành trình</button></div></div>' +
      // 12/11 12:05: bỏ dải "Bản thử 0.6.1" – anh chốt xuất bản 0.6.1
      stats + cards;
  };
  // Hộp chọn cách tạo hành trình: mẫu · đọc file quy trình có sẵn · trống
  function hnChooser() {
    return '<div class="hn-opts">' +
      '<button class="hn-opt" data-act="hn-new" data-id="mau"><span class="hn-opt-ic">' + ic('hnlotrinh', 22) + '</span><b>Bắt đầu từ hành trình mẫu</b><span>' + hnSample().length + ' bước cho vị trí phổ thông, từ trước ngày đi làm đến khi ký chính thức.</span></button>' +
      '<label class="hn-opt hn-drop" id="hnDrop"><span class="hn-opt-ic">' + ic('hn_up', 22) + '</span><b>Đọc từ file quy trình có sẵn</b><span>Tải file <b>PDF</b> (xuất từ Word, Excel) hoặc <b>Excel</b>. Phần mềm tự đọc bước, giờ, người phụ trách, đồ cần chuẩn bị – anh/chị kiểm tra rồi chỉnh.</span><input type="file" class="hn-file" accept=".pdf,.xlsx,.xls,application/pdf" hidden><em>Bấm để chọn file hoặc kéo thả vào đây</em></label>' +
      '<button class="hn-opt" data-act="hn-new" data-id=""><span class="hn-opt-ic">' + ic('td_plus', 22) + '</span><b>Tạo hành trình trống</b><span>Tự gõ từng bước trong bảng.</span></button></div>' +
      '<p class="muted" style="font-size:12.5px;margin:10px 2px 0">File chỉ được đọc ngay trên máy này, không gửi lên máy chủ nào.</p>';
  }
  BINDS.hnlotrinh = function () {
    hnBindGrids();
    var f = PS.hn; if (!f || !f.ed) return;
    var d = f.ed;
    [['hnName', 'name', 'Tên hành trình'], ['hnDesc', 'desc', 'Ghi chú']].forEach(function (k) { var el = $('#' + k[0]); if (el) { el.addEventListener('input', function () { if (!el._hnP) { el._hnP = 1; hnPush('Sửa ' + k[2]); } d[k[1]] = el.value; hnDirty(); }); el.addEventListener('change', function () { el._hnP = 0; }); } });
    var on = $('#hnOn'); if (on) on.addEventListener('change', function () { d.on = !on.checked; hnPush(on.checked ? 'Bật áp dụng' : 'Tạm tắt'); d.on = on.checked; hnDirty(); });
    hnBindTable(); hnBindMap();
  };
  // Hoàn tác trong trình sửa (anh 12/11 09:58): lưu ảnh chụp bản nháp trước mỗi thao tác, tối đa 80 bước
  var HN_FL = { title: 'Việc cần làm', desc: 'Nội dung', doc: 'Cần chuẩn bị', law: 'Căn cứ', own: 'Người phụ trách', go: 'Mở nhanh', bm: 'Biểu mẫu', req: 'Bắt buộc', nv: 'Người mới cùng làm', ph: 'Giai đoạn', n: 'Thời điểm', t1: 'Giờ bắt đầu', t2: 'Giờ kết thúc' };
  function hnSnapD(d) { return JSON.stringify({ name: d.name, desc: d.desc, on: d.on, steps: d.steps, sc: d.sc }); }
  function hnUndoUi() { var d = hnEd(), u = $('#hnUndoB'), r = $('#hnRedoB'); if (u) u.disabled = !(d && d.hist && d.hist.length); if (r) r.disabled = !(d && d.fut && d.fut.length); }
  function hnPush(label) { var d = hnEd(); if (!d) return; d.hist = d.hist || []; d.hist.push({ s: hnSnapD(d), l: label || 'Sửa' }); if (d.hist.length > 80) d.hist.shift(); d.fut = []; hnUndoUi(); }
  function hnDraftRestore(d, snap) { var x = JSON.parse(snap); d.name = x.name; d.desc = x.desc; d.on = x.on; d.steps = x.steps; d.sc = x.sc; d.dirty = true; }
  ACTS['hn-undo'] = function () { var d = hnEd(); if (!d || !d.hist || !d.hist.length) return; var h = d.hist.pop(); (d.fut = d.fut || []).push({ s: hnSnapD(d), l: h.l }); hnDraftRestore(d, h.s); hnPopClose(); hnRerender(); toast('Đã hoàn tác: ' + h.l, 'info', 'Bấm “Làm lại” (Ctrl+Y) nếu muốn quay lại.'); };
  ACTS['hn-redo'] = function () { var d = hnEd(); if (!d || !d.fut || !d.fut.length) return; var h = d.fut.pop(); d.hist.push({ s: hnSnapD(d), l: h.l }); hnDraftRestore(d, h.s); hnPopClose(); hnRerender(); toast('Đã làm lại: ' + h.l, 'info'); };
  function hnDirty() { if (PS.hn && PS.hn.ed) PS.hn.ed.dirty = true; var b = $('#hnDirty'); if (b) b.textContent = 'Có thay đổi chưa lưu'; }

  /* ---------------- Trình sửa hành trình (bản nháp trong PS.hn.ed) ---------------- */
  function hnDraftFrom(gid, mode) {
    var src = gid ? hnAll().filter(function (x) { return x.gid === gid; })[0] : null, d;
    if (src) {
      d = JSON.parse(JSON.stringify({ name: src.j.name, desc: src.j.desc || '', on: src.j.on, steps: src.j.steps }));
      d.sc = {}; src.units.forEach(function (z) { d.sc[z.u.id] = JSON.parse(JSON.stringify(z.sc)); d.sc[z.u.id].use = true; });
      d.gid = mode === 'dup' ? null : src.gid;
      if (mode === 'dup') { d.name += ' (bản sao)'; d.sc = {}; d.on = true; }
    } else {
      var mau = mode === 'mau';
      d = { gid: null, name: mau ? HN_SNAME : '', desc: mau ? HN_SDESC : '', on: true, steps: mau ? hnSample() : [], sc: {} };
      // mẫu: chọn sẵn các công ty chưa có hành trình nào áp dụng toàn công ty
      if (mau) S.units.forEach(function (u) { if (!hnOf(u).jr.some(function (j) { return j.on && j.sc && j.sc.all; })) d.sc[u.id] = { use: true, all: true, pb: [], cd: [] }; });
      else if (S.units.length === 1) d.sc[S.units[0].id] = { use: true, all: true, pb: [], cd: [] };
    }
    S.units.forEach(function (u) { if (!d.sc[u.id]) d.sc[u.id] = { use: false, all: true, pb: [], cd: [] }; });
    d.dirty = !src || mode === 'dup'; d.hist = []; d.fut = [];
    return d;
  }
  function hnEditor(f) {
    var d = f.ed, role = f.role || '';
    var head = '<div class="page-head"><div><p style="margin:0 0 12px"><button class="hn-backbtn" data-act="hn-back">' + ic('hn_back', 16) + 'Danh sách hành trình</button></p><h1>' + (d.gid ? esc(d.name || 'Hành trình') : 'Hành trình mới') + '</h1><p class="muted">' + (d.gid ? 'Mã ' + esc(d.gid) + ' · ' : '') + 'Sửa xong bấm “Lưu hành trình” ở cuối trang. Thay đổi chỉ áp dụng cho người mới bắt đầu hội nhập sau khi lưu.</p></div></div>';
    // 1. Thông tin chung
    var b1 = '<div class="hn-box"><h3><span class="num">1</span>Thông tin chung</h3><p class="muted">Đặt tên dễ nhận biết, ví dụ “Hành trình khối văn phòng”, “Hành trình công nhân sản xuất”.</p><div class="hn-g2">' +
      '<div class="field"><label for="hnName">Tên hành trình *</label><input class="input" id="hnName" value="' + esc(d.name) + '" placeholder="Ví dụ: Hành trình hội nhập – vị trí phổ thông"></div>' +
      '<div class="field"><label for="hnDesc">Ghi chú (dùng cho ai, lưu ý gì)</label><textarea class="input" id="hnDesc" rows="2">' + esc(d.desc) + '</textarea></div></div>' +
      '<label class="hn-chk" style="margin-top:10px"><input type="checkbox" id="hnOn"' + (d.on ? ' checked' : '') + '><span><b>Đang áp dụng</b> <span class="muted">(bỏ chọn để tạm tắt – người mới sẽ không được gắn hành trình này)</span></span></label></div>';
    // 2. Phạm vi áp dụng
    var b2 = '<div class="hn-box"><h3><span class="num">2</span>Áp dụng cho</h3><p class="muted">Chọn công ty, rồi chọn toàn công ty hoặc từng phòng ban, vị trí. Bỏ trống vị trí = mọi vị trí của phòng ban đã chọn.</p>' +
      S.units.map(function (u) { return hnScopeBox(u, d.sc[u.id]); }).join('') + '</div>';
    // 3. Các bước
    var cnt = {}; d.steps.forEach(function (s) { cnt[s.own] = (cnt[s.own] || 0) + 1; (s.own2 || []).forEach(function (r) { cnt['+' + r] = (cnt['+' + r] || 0) + 1; }); });
    var rolePills = tdPills('hn-role', role, [['', 'Tất cả', d.steps.length]].concat(HN_ROLE.filter(function (r) { return cnt[r[0]] || cnt['+' + r[0]]; }).map(function (r) { return [r[0], r[1], (cnt[r[0]] || 0) + (cnt['+' + r[0]] || 0), 'Việc ' + r[1] + ' phụ trách hoặc phối hợp']; })));
    var view = f.view === 'map' ? 'map' : 'tbl';
    var tabs = '<div class="hn-tabs" role="tablist"><button role="tab" class="' + (view === 'tbl' ? 'on' : '') + '" data-act="hn-view" data-id="tbl" aria-selected="' + (view === 'tbl') + '">' + ic('hn_tbl', 16) + 'Theo bảng</button><button role="tab" class="' + (view === 'map' ? 'on' : '') + '" data-act="hn-view" data-id="map" aria-selected="' + (view === 'map') + '">' + ic('hn_map', 16) + 'Theo thời điểm</button></div>';
    var b3 = '<div class="hn-box"><div class="hn-b3h"><h3><span class="num">3</span>Các bước – checklist</h3>' + tabs + '</div><p class="muted">' + (view === 'tbl' ? 'Sửa trực tiếp trong từng ô như bảng Excel. Đổi giờ, số ngày hoặc giai đoạn thì dòng tự xếp lại theo thời điểm. Bảng rộng – kéo ngang để xem hết các cột; 3 cột đầu luôn giữ cố định.' : 'Lộ trình theo 6 giai đoạn. Kéo thả thẻ để đổi thứ tự hoặc chuyển sang giai đoạn khác – thời điểm tự đổi theo vị trí mới. Bấm vào thẻ để sửa chi tiết trong bảng.') + '</p>' +
      (d.src ? '<div class="notice' + (d.src.warn ? ' warn' : '') + '" style="margin-bottom:12px">' + ic('info') + '<div>Đã đọc <b>' + d.src.n + ' bước</b> từ file <b>' + esc(d.src.file) + '</b>. Phần mềm đoán giai đoạn, giờ và người phụ trách theo chữ trong file – anh/chị kiểm tra lại từng dòng' + (d.src.warn ? '; <b style="color:var(--danger)">' + d.src.warn + ' bước có nội dung cần xem lại về pháp lý</b> (tô đỏ ở cột Căn cứ)' : '') + '.</div></div>' : '') +
      '<div class="hn-sum"><span class="td-flab" style="width:auto;padding:0 4px 0 0">Xem việc của</span>' + rolePills + '</div>' + (view === 'tbl' ? hnTable(d, role) : hnRoadmap(d, role)) + '</div>';
    var bar = '<div class="hn-bar"><button class="btn" id="hnUndoB" data-act="hn-undo" title="Hoàn tác thao tác vừa làm (Ctrl+Z)"' + (d.hist && d.hist.length ? '' : ' disabled') + '>' + ic('hn_undo', 15) + 'Hoàn tác</button><button class="btn" id="hnRedoB" data-act="hn-redo" title="Làm lại (Ctrl+Y)"' + (d.fut && d.fut.length ? '' : ' disabled') + '>' + ic('hn_redo', 15) + 'Làm lại</button><span id="hnDirty" class="dirty">' + (d.dirty ? 'Có thay đổi chưa lưu' : '') + '</span><span class="sp"></span><button class="btn" data-act="hn-back">Hủy</button><button class="btn btn-primary" data-act="hn-save">' + ic('check', 15) + 'Lưu hành trình</button></div>';
    return head + '<div class="hn-ed">' + b1 + b2 + b3 + bar + '</div>';
  }
  function hnScopeBox(u, sc) {
    var tree = hnTree(u), nWork = 0, nCd = 0;
    tree.forEach(function (p) { p.cds.forEach(function (c) { if (hnScore(Object.assign({}, sc, { all: sc.all }), p.pb, c.cd)) { nWork += c.n; nCd++; } }); });
    var other = hnOf(u).jr.filter(function (j) { return j.on && j.gid !== (PS.hn.ed.gid || ''); });
    var head = '<div class="hn-co-h"><label><input type="checkbox" data-act="hn-sc-u" data-u="' + u.id + '"' + (sc.use ? ' checked' : '') + '>' + esc(shortUnit(u.name)) + '</label>' +
      (sc.use ? tdPills('hn-sc-all', sc.all ? 'all' : 'part', [['all', 'Toàn công ty'], ['part', 'Chọn phòng ban, vị trí']]).replace(/data-act="hn-sc-all"/g, 'data-act="hn-sc-all" data-u="' + u.id + '"') : '') +
      '<span class="sp"></span><small>' + (sc.use ? (nCd ? 'Khớp ' + nCd + ' vị trí · ' + nWork + ' người đang làm' : 'Chưa khớp vị trí nào') : (other.length ? 'Đang có ' + other.length + ' hành trình khác' : 'Không áp dụng')) + '</small></div>';
    if (!sc.use || sc.all) return '<div class="hn-co' + (sc.use ? ' on' : '') + '">' + head + '</div>';
    var body = '<div class="hn-co-b">' + tree.map(function (p) {
      var onPb = sc.pb.indexOf(p.pb) >= 0;
      return '<div class="hn-pb"><div class="hn-pb-h"><button class="td-pill' + (onPb ? ' on' : '') + '" data-act="hn-sc-pb" data-u="' + u.id + '" data-id="' + esc(p.pb) + '" title="Chọn cả phòng ban">' + esc(p.pb) + '</button><small>' + (p.cds.length ? p.cds.length + ' vị trí' : 'chưa có vị trí') + '</small></div>' +
        (p.cds.length ? '<div class="td-pills">' + p.cds.map(function (c) { var on = sc.cd.indexOf(c.cd) >= 0; return '<button class="td-pill' + (on ? ' on' : '') + '" data-act="hn-sc-cd" data-u="' + u.id + '" data-pb="' + esc(p.pb) + '" data-id="' + esc(c.cd) + '">' + esc(c.cd) + '<em>' + c.n + '</em></button>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') + '<div class="hint muted" style="font-size:12px">Bấm tên phòng ban để chọn cả phòng ban; bấm vị trí để chỉ áp dụng cho vị trí đó. Số nhỏ = người đang làm.</div></div>';
    return '<div class="hn-co on">' + head + body + '</div>';
  }
  /* ---------------- Bảng checklist sửa trực tiếp (anh 22:51: dạng bảng, sửa ngay trên ô) ---------------- */
  /* Bảng dùng chung (anh 12/11 09:58): mọi bảng của module kéo được độ rộng cột; chữ trong ô tự xuống dòng theo độ rộng;
     khung bảng cao tối đa bằng màn hình nên thanh cuộn ngang luôn nằm trong tầm nhìn (không phải kéo xuống cuối danh sách). Độ rộng nhớ trên trình duyệt này. */
  var HN_COLS = [['#', 34, 's0 c'], ['Thời điểm', 128, 's1'], ['Việc cần làm *', 210, 's2'], ['Nội dung chi tiết', 300, ''], ['Người phụ trách', 160, ''], ['Phối hợp', 150, ''], ['Cần chuẩn bị', 220, ''], ['Biểu mẫu', 170, '', 'Biểu mẫu trong Kho biểu mẫu hội nhập – người mới mở xem, tải ngay trên app'], ['Mở nhanh tính năng', 140, ''], ['Bắt buộc', 70, 'c'], ['Người mới cùng làm', 84, 'c', 'Bước hiện trên app nhân viên của người mới'], ['Căn cứ pháp lý', 200, ''], ['Giai đoạn', 140, ''], ['', 76, 'c']];
  var HN_NCOL = HN_COLS.length, HN_GRIDS = {};
  function hnGKey(key) { return 'qtt-qlns-hn-v2-' + key; }
  function hnGW(key) { var c = HN_GRIDS[key] || [], w = null; try { w = JSON.parse(localStorage.getItem(hnGKey(key)) || 'null'); } catch (e) { } return c.map(function (x, i) { return w && w.length === c.length && +w[i] >= 32 ? +w[i] : x[1]; }); }
  function hnGWSave(key, W) { try { localStorage.setItem(hnGKey(key), JSON.stringify(W)); } catch (e) { } }
  function hnGridOpen(key, cols, cls) {
    HN_GRIDS[key] = cols; var W = hnGW(key), sum = W.reduce(function (a, b) { return a + b; }, 0);
    return '<table class="hn-g ' + (cls || '') + '" data-grid="' + key + '" style="width:' + sum + 'px;--l1:' + W[0] + 'px;--l2:' + (W[0] + (W[1] || 0)) + 'px"><colgroup>' + W.map(function (w) { return '<col style="width:' + w + 'px">'; }).join('') + '</colgroup><thead><tr>' +
      cols.map(function (c, i) { return '<th class="' + (c[2] || '') + '"' + (c[3] ? ' title="' + esc(c[3]) + '"' : '') + '><span class="hn-thx">' + c[0] + '</span>' + (i < cols.length - 1 ? '<span class="hn-rz" data-col="' + i + '" title="Kéo để chỉnh độ rộng cột · bấm đúp để về mặc định"></span>' : '') + '</th>'; }).join('') + '</tr></thead>';
  }
  function hnGridFoot(key) { return '<div class="hn-tfoot"><span class="faint">Kéo mép phải tiêu đề cột để chỉnh độ rộng · bấm đúp mép để về mặc định</span><button class="btn btn-sm" data-act="hn-gridreset" data-id="' + key + '">Đặt lại độ rộng cột</button></div>'; }
  function hnTable(d, role) {
    var no = 0, n = HN_COLS.length;
    var tb = HN_PH.map(function (p) {
      var ss = hnSorted(d.steps, p[0]);
      return '<tr class="hn-tph"><td colspan="' + n + '"><span><b>' + p[1] + '</b><small>' + p[2] + ' · ' + ss.length + ' bước</small></span></td></tr>' +
        ss.map(function (s) { return hnTRow(s, ++no, role); }).join('') +
        '<tr class="hn-tadd"><td colspan="' + n + '"><span><button class="hn-add" data-act="hn-st-new" data-id="' + p[0] + '">' + ic('td_plus') + 'Thêm dòng vào “' + p[1] + '”</button></span></td></tr>';
    }).join('');
    return '<div class="hn-tw hn-gw" id="hnTbl">' + hnGridOpen('buoc', HN_COLS, 'hn-t') + '<tbody>' + tb + '</tbody></table></div>' + hnGridFoot('buoc');
  }
  function hnBindResize(tbl) {
    var key = tbl.getAttribute('data-grid'), cols = $$('col', tbl), raf = 0;
    function fit() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; $$('textarea.ci', tbl).forEach(hnAuto); }); }
    function apply(W) { W.forEach(function (w, i) { if (cols[i]) cols[i].style.width = w + 'px'; }); tbl.style.width = W.reduce(function (a, b) { return a + b; }, 0) + 'px'; tbl.style.setProperty('--l1', W[0] + 'px'); tbl.style.setProperty('--l2', (W[0] + (W[1] || 0)) + 'px'); fit(); }
    $$('thead .hn-rz', tbl).forEach(function (h) {
      var i = +h.getAttribute('data-col');
      h.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation(); var W = hnGW(key), x0 = e.clientX, w0 = W[i]; h.classList.add('on'); document.body.classList.add('hn-resizing');
        try { h.setPointerCapture(e.pointerId); } catch (x) { }
        function mv(ev) { W[i] = Math.max(32, Math.round(w0 + ev.clientX - x0)); apply(W); }
        function up() { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); h.classList.remove('on'); document.body.classList.remove('hn-resizing'); hnGWSave(key, W); fit(); }
        h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
      });
      h.addEventListener('dblclick', function (e) { e.preventDefault(); var W = hnGW(key); W[i] = HN_GRIDS[key][i][1]; apply(W); hnGWSave(key, W); });
      h.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }
  function hnBindGrids() { $$('table.hn-g[data-grid]').forEach(hnBindResize); }
  function hnWhenCell(s) {
    if (s.ph === 'd1') return '<span class="hn-tm"><input class="ci tm" data-f="t1" value="' + esc(s.t1 || '') + '" maxlength="5" placeholder="08:00" aria-label="Từ giờ">–<input class="ci tm" data-f="t2" value="' + esc(s.t2 || '') + '" maxlength="5" placeholder="08:30" aria-label="Đến giờ"></span>';
    var pre = s.ph === 'w1' || s.ph === 'pr' ? 'Ngày thứ' : s.ph === 'off' ? 'Sau' : 'Trước', post = s.ph === 'w1' || s.ph === 'pr' ? '' : 'ngày';
    var tip = s.ph === 'pre' ? 'Số ngày trước ngày đi làm' : s.ph === 'end' ? 'Số ngày trước ngày kết thúc thử việc – ghi 0 = đúng ngày cuối' : s.ph === 'off' ? 'Số ngày sau ngày kết thúc thử việc' : 'Ngày thứ mấy kể từ ngày vào làm (ngày vào làm = ngày thứ 1)';
    return '<span class="hn-tm" title="' + tip + '">' + pre + '<input class="ci nn" data-f="n" inputmode="numeric" value="' + esc(s.n) + '" aria-label="' + tip + '">' + post + (s.ph === 'end' && !+s.n ? '<small>ngày cuối</small>' : '') + '</span>';
  }
  function hnCoHtml(s) { return (s.own2 || []).length ? s.own2.map(function (r) { return hnRoleTag(r, true); }).join('') : '<span class="faint">— Chọn —</span>'; }
  function hnTRow(s, no, role) {
    var dim = role && s.own !== role && (s.own2 || []).indexOf(role) < 0;
    var ta = function (f, ph) { return '<textarea class="ci" data-f="' + f + '" rows="1"' + (ph ? ' placeholder="' + ph + '"' : '') + '>' + esc(s[f] || '') + '</textarea>'; };
    return '<tr data-sid="' + esc(s.id) + '"' + (dim ? ' class="dim"' : '') + '><td class="s0 c">' + no + '</td><td class="s1">' + hnWhenCell(s) + '</td>' +
      '<td class="s2"><textarea class="ci ct" data-f="title" rows="1" placeholder="Ghi việc cần làm">' + esc(s.title) + '</textarea></td>' +
      '<td>' + ta('desc', 'Làm thế nào, cần chuẩn bị gì') + '</td>' +
      '<td><select class="ci" data-f="own">' + HN_ROLE.map(function (r) { return opt(r[0], r[1], s.own); }).join('') + '</select></td>' +
      '<td><button type="button" class="ci hn-cobtn" data-act="hn-co2" data-id="' + esc(s.id) + '">' + hnCoHtml(s) + '</button></td>' +
      '<td>' + ta('doc') + '</td>' +
      '<td><button type="button" class="ci hn-cobtn hn-bmc" data-act="hn-bm2" data-id="' + esc(s.id) + '">' + hnBmChips(s) + '</button></td>' +
      '<td><select class="ci" data-f="go">' + HN_GO.map(function (g) { return opt(g[0], g[1], s.go || ''); }).join('') + '</select></td>' +
      '<td class="c"><input type="checkbox" data-f="req"' + (s.req ? ' checked' : '') + ' aria-label="Bắt buộc"></td>' +
      '<td class="c"><input type="checkbox" data-f="nv"' + (s.nv ? ' checked' : '') + ' aria-label="Người mới cùng làm"></td>' +
      '<td' + (s.warn ? ' class="hn-warn" title="Nội dung bước này cần xem lại về pháp lý"' : '') + '>' + ta('law') + '</td>' +
      '<td><select class="ci" data-f="ph">' + HN_PH.map(function (p) { return opt(p[0], p[1], s.ph); }).join('') + '</select></td>' +
      '<td class="c"><span class="hn-sa"><button class="btn btn-sm" data-act="hn-st-copy" data-id="' + esc(s.id) + '" title="Nhân bản dòng">' + ic('td_copy', 14) + '</button><button class="btn btn-sm" data-act="hn-st-del" data-id="' + esc(s.id) + '" title="Xóa dòng">' + ic('td_trash', 14) + '</button></span></td></tr>';
  }
  function hnAuto(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  // Vẽ lại mà giữ nguyên vị trí cuộn của trang và của bảng
  function hnRerender(focusSel, flashId) {
    var y = window.scrollY, tw = $('#hnTbl') || $('#hnMap'), sx = tw ? tw.scrollLeft : 0, sy = tw ? tw.scrollTop : 0;
    render(); window.scrollTo(0, y);
    var t2 = $('#hnTbl') || $('#hnMap'); if (t2) { t2.scrollLeft = sx; t2.scrollTop = sy; }
    if (flashId) { var tr = $('#page [data-sid="' + flashId + '"]'); if (tr) { tr.classList.add('flash'); tr.scrollIntoView({ block: 'nearest', inline: 'nearest' }); setTimeout(function () { tr.classList.remove('flash'); }, 1600); } }
    if (focusSel) { var el = $(focusSel); if (el) { el.focus(); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
  }
  function hnTime(v) { v = String(v || '').trim().replace(/[hH.]/, ':'); var m = /^(\d{1,2})(?::(\d{1,2}))?$/.exec(v); return m && +m[1] < 24 && +(m[2] || 0) < 60 ? p2(+m[1]) + ':' + p2(+(m[2] || 0)) : null; }
  function hnBindTable() {
    var tw = $('#hnTbl'); if (!tw) return;
    $$('textarea.ci', tw).forEach(hnAuto);
    function stepOf(el) { var tr = el.closest('tr[data-sid]'), d = hnEd(); return tr && d ? d.steps.filter(function (x) { return x.id === tr.getAttribute('data-sid'); })[0] : null; }
    tw.addEventListener('input', function (e) {
      var el = e.target, f = el.getAttribute('data-f'), s = stepOf(el); if (!s || !f) return;
      if (el.tagName === 'TEXTAREA') { if (!el._hnP) { el._hnP = 1; hnPush('Sửa ô ' + (HN_FL[f] || '')); } s[f] = el.value; hnAuto(el); el.classList.remove('bad'); hnDirty(); }
    });
    tw.addEventListener('change', function (e) {
      var el = e.target, f = el.getAttribute('data-f'), s = stepOf(el); if (!s || !f) return;
      if (el.tagName === 'TEXTAREA') { el._hnP = 0; s[f] = el.value.trim(); el.value = s[f]; hnAuto(el); if (f === 'law' && s.warn) { s.warn = false; var tdw = el.closest('td'); if (tdw) tdw.classList.remove('hn-warn'); } hnDirty(); return; }
      hnPush('Sửa ô ' + (HN_FL[f] || ''));
      if (f === 'req' || f === 'nv') { s[f] = el.checked; hnDirty(); return; }
      if (f === 'go') { s.go = el.value; hnDirty(); return; }
      if (f === 'own') { s.own = el.value; s.own2 = (s.own2 || []).filter(function (r) { return r !== s.own; }); hnDirty(); if (PS.hn.role) hnRerender(null, s.id); else { var b = el.closest('tr').querySelector('.hn-cobtn'); if (b) b.innerHTML = hnCoHtml(s); } return; }
      if (f === 'ph') {
        var v = el.value; s.ph = v; if (v === 'd1') { s.n = 1; s.t1 = s.t1 || '08:00'; s.t2 = s.t2 || ''; } else { s.t1 = ''; s.t2 = ''; if (v === 'w1' && (s.n < 2 || s.n > 7)) s.n = 2; if (v === 'pr' && s.n < 8) s.n = 14; if (v === 'pre' && s.n < 1) s.n = 1; }
        hnDirty(); hnRerender(null, s.id); toast('Đã chuyển dòng sang “' + HN_PHN[v] + '”', 'info', 'Kiểm tra lại cột Thời điểm cho đúng.'); return;
      }
      if (f === 'n') { var nn = parseInt(String(el.value).replace(/\D/g, ''), 10); if (isNaN(nn)) nn = 0; if (s.ph !== 'end' && s.ph !== 'off' && nn < 1) nn = 1; s.n = nn; hnDirty(); hnRerender(null, s.id); return; }
      if (f === 't1' || f === 't2') {
        var t = hnTime(el.value);
        if (el.value.trim() && !t) { el.classList.add('bad'); toast('Giờ chưa đúng dạng', 'err', 'Gõ kiểu 08:00, 8:30 hoặc 14h.'); return; }
        if (f === 't1' && !t) { el.classList.add('bad'); return; }
        var mn = function (x) { return x ? +x.slice(0, 2) * 60 + +x.slice(3, 5) : null; }, hm = function (m) { m = Math.min(m, 23 * 60 + 59); return p2(Math.floor(m / 60)) + ':' + p2(m % 60); };
        if (f === 't1') { var o1 = mn(s.t1), o2 = mn(s.t2), dur = o1 !== null && o2 !== null && o2 > o1 ? o2 - o1 : 30; if (s.t2) s.t2 = hm(mn(t) + dur); } // đổi giờ bắt đầu: giờ kết thúc dời theo, giữ nguyên thời lượng
        else if (t && s.t1 && mn(t) <= mn(s.t1)) { el.classList.add('bad'); toast('Giờ kết thúc phải sau giờ bắt đầu', 'err', 'Bắt đầu ' + s.t1 + ' – sửa lại giờ kết thúc.'); return; }
        s[f] = t || ''; el.classList.remove('bad'); hnDirty(); hnRerender(null, s.id); return;
      }
    });
    tw.addEventListener('keydown', function (e) { // Enter ở ô một dòng = sang ô cùng cột dòng dưới (như Excel); Shift+Enter xuống dòng trong ô
      var el = e.target; if (e.key !== 'Enter' || e.shiftKey || !el.classList || !el.classList.contains('ci') || el.tagName === 'SELECT' || el.tagName === 'BUTTON') return;
      e.preventDefault(); el.blur(); var f = el.getAttribute('data-f'), tr = el.closest('tr'), nx = tr && tr.nextElementSibling;
      while (nx && !nx.hasAttribute('data-sid')) nx = nx.nextElementSibling;
      var t = nx && nx.querySelector('[data-f="' + f + '"]'); if (t) t.focus();
    });
  }
  // Ô Phối hợp: bảng chọn nổi (đặt ngoài bảng để không bị khung cuộn che)
  var HN_POP = null;
  function hnPopClose() { if (HN_POP) { HN_POP.remove(); HN_POP = null; document.removeEventListener('mousedown', hnPopOut, true); document.removeEventListener('keydown', hnPopKey, true); window.removeEventListener('scroll', hnPopClose, true); } }
  function hnPopOut(e) { if (HN_POP && !HN_POP.contains(e.target) && !e.target.closest('.hn-cobtn')) hnPopClose(); }
  function hnPopKey(e) { if (e.key === 'Escape') { e.stopPropagation(); hnPopClose(); } }
  function hnCoPop(btn, id) {
    var open = HN_POP && HN_POP.getAttribute('data-id') === id; hnPopClose(); if (open) return;
    var d = hnEd(), s = d && d.steps.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    var pop = document.createElement('div'); pop.className = 'hn-pop'; pop.setAttribute('data-id', id);
    pop.innerHTML = '<div class="hn-pop-h">Phối hợp cùng</div>' + HN_ROLE.filter(function (r) { return r[0] !== s.own; }).map(function (r) { return '<label class="hn-chk"><input type="checkbox" value="' + r[0] + '"' + ((s.own2 || []).indexOf(r[0]) >= 0 ? ' checked' : '') + '>' + r[1] + '</label>'; }).join('') + '<div class="hn-pop-f"><button type="button" class="btn btn-sm btn-primary">Xong</button></div>';
    document.body.appendChild(pop); HN_POP = pop;
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    pop.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    pop.addEventListener('change', function () { hnPush('Đổi người phối hợp'); s.own2 = $$('input', pop).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); btn.innerHTML = hnCoHtml(s); hnDirty(); });
    pop.querySelector('.hn-pop-f button').addEventListener('click', hnPopClose);
    setTimeout(function () { document.addEventListener('mousedown', hnPopOut, true); document.addEventListener('keydown', hnPopKey, true); window.addEventListener('scroll', hnPopClose, true); }, 0);
  }
  function hnValidate(d) {
    var err = [];
    if (!String(d.name || '').trim()) err.push('Chưa đặt tên hành trình');
    if (!d.steps.length) err.push('Hành trình chưa có bước nào');
    var blank = d.steps.filter(function (x) { return !String(x.title || '').trim(); }).length; if (blank) err.push(blank + ' dòng chưa ghi “Việc cần làm” (ô đánh dấu đỏ) – ghi vào hoặc xóa dòng');
    var used = S.units.filter(function (u) { return d.sc[u.id] && d.sc[u.id].use; });
    if (!used.length) err.push('Chưa chọn công ty áp dụng');
    used.forEach(function (u) { var sc = d.sc[u.id]; if (!sc.all && !sc.pb.length && !sc.cd.length) err.push(shortUnit(u.name) + ': chưa chọn phòng ban hoặc vị trí'); });
    return err;
  }
  function hnCommit(d) {
    var gid = d.gid || hnNextGid(), now = HR.isoToday(), names = [];
    S.units.forEach(function (u) {
      var h = hnOf(u), sc = d.sc[u.id], i = h.jr.map(function (j) { return j.gid; }).indexOf(gid);
      if (sc && sc.use) {
        var j = { gid: gid, name: d.name.trim(), desc: (d.desc || '').trim(), on: !!d.on, sc: { all: !!sc.all, pb: sc.all ? [] : sc.pb.slice(), cd: sc.all ? [] : sc.cd.slice() }, steps: JSON.parse(JSON.stringify(d.steps)).map(function (x) { ['title', 'desc', 'doc', 'law'].forEach(function (k) { x[k] = String(x[k] || '').trim(); }); return x; }), at: i >= 0 ? h.jr[i].at : now, upd: now };
        if (i >= 0) h.jr[i] = j; else h.jr.push(j);
        names.push(shortUnit(u.name));
      } else if (i >= 0) h.jr.splice(i, 1);
    });
    hnSave((d.gid ? 'Sửa' : 'Tạo') + ' hành trình ' + gid + ' "' + d.name + '" – ' + d.steps.length + ' bước, áp dụng: ' + names.join(', '));
    return gid;
  }
  function hnDupCheck(gid) {
    var out = [];
    S.units.forEach(function (u) { hnTree(u).forEach(function (p) { p.cds.forEach(function (c) { var h = hnMatch(u, p.pb, c.cd); if (h.length > 1 && h.some(function (j) { return j.gid === gid; })) out.push(c.cd); }); }); });
    return out;
  }

  /* ---------------- In checklist (A4, mở tab mới / in) ---------------- */
  function hnPrint(gid) {
    var x = hnAll().filter(function (z) { return z.gid === gid; })[0]; if (!x) return;
    var j = x.j;
    var rows = HN_PH.map(function (p) { var ss = hnSorted(j.steps, p[0]); if (!ss.length) return ''; return '<tr class="ph"><td colspan="5">' + esc(p[1]) + '</td></tr>' + ss.map(function (s) { return '<tr><td class="c">☐</td><td>' + esc(hnWhen(s)) + '</td><td><b>' + esc(s.title) + '</b>' + (s.req ? ' <i>(bắt buộc)</i>' : '') + (s.desc ? '<div>' + esc(s.desc) + '</div>' : '') + (s.law ? '<div class="law">Căn cứ: ' + esc(s.law) + '</div>' : '') + '</td><td>' + esc(HN_RN[s.own] || s.own) + ((s.own2 || []).length ? '<div class="co">Phối hợp: ' + s.own2.map(function (r) { return esc(HN_RN[r] || r); }).join(', ') + '</div>' : '') + '</td><td>' + esc(s.doc || '') + '</td></tr>'; }).join(''); }).join('');
    var html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>' + esc(j.name) + '</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:24px}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px;color:#444}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px 7px;vertical-align:top;text-align:left}th{background:#eef3f0}tr.ph td{background:#1D6A50;color:#fff;font-weight:700}td.c{width:22px;text-align:center;font-size:15px}td div{color:#444;margin-top:3px}td .law{color:#1F5F8B}td .co{font-size:11px}.k{display:flex;gap:30px;margin:6px 0 14px}.k span{border-bottom:1px dotted #777;min-width:220px;display:inline-block}@media print{body{margin:10mm}button{display:none}}</style></head><body>' +
      '<button onclick="print()" style="float:right;padding:6px 14px">In</button><h1>' + esc(j.name) + '</h1><p>' + esc(x.units.map(function (z) { return shortUnit(z.u.name) + ': ' + hnScText(z.u, z.sc); }).join(' · ')) + '</p>' +
      '<div class="k"><div>Người mới: <span></span></div><div>Vị trí: <span></span></div><div>Ngày vào làm: <span></span></div></div>' +
      '<table><thead><tr><th></th><th style="width:110px">Thời điểm</th><th>Việc cần làm</th><th style="width:150px">Người phụ trách</th><th style="width:170px">Cần chuẩn bị</th></tr></thead><tbody>' + rows + '</tbody></table></body></html>';
    var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(html); w.document.close(); } else toast('Trình duyệt chặn cửa sổ mới', 'err', 'Cho phép mở cửa sổ bật lên rồi bấm lại “In checklist”.');
  }

  /* ---------------- Hành động ---------------- */
  function hnEd() { return PS.hn && PS.hn.ed; }
  function hnGoEdit(d) { var f = ps('hn', { ed: null, role: '', view: 'tbl' }); f.ed = d; f.role = ''; if (location.hash !== '#hnlotrinh') location.hash = 'hnlotrinh'; else render(); }
  ACTS['hn-k'] = function (a, id) {
    if (id === 'run') { go('hntiendo'); return; }
    if (id === 'miss' || id === 'dup') {
      var L = HN_GAP[id], multi = S.units.length > 1;
      if (!L.length) { toast(id === 'miss' ? 'Mọi vị trí đều đã có hành trình' : 'Không có vị trí nào bị trùng', 'info'); return; }
      modal(id === 'miss' ? 'Vị trí chưa có hành trình hội nhập' : 'Vị trí khớp 2 hành trình cùng mức', L.length + ' vị trí · lấy từ nhân sự đang làm và phiếu nhu cầu tuyển dụng',
        '<div class="tbl-wrap" style="max-height:60vh"><table class="tbl"><thead><tr>' + (multi ? '<th>Công ty</th>' : '') + '<th>Phòng ban</th><th>Vị trí</th><th class="r">Đang làm</th>' + (id === 'dup' ? '<th>Các hành trình</th>' : '') + '</tr></thead><tbody>' +
        L.map(function (r) { return '<tr>' + (multi ? '<td>' + esc(shortUnit(r.u.name)) + '</td>' : '') + '<td>' + esc(r.pb) + '</td><td>' + esc(r.cd) + '</td><td class="r">' + r.n + '</td>' + (id === 'dup' ? '<td>' + r.h.map(function (j) { return esc(j.name); }).join('<br>') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="muted" style="margin-top:10px;font-size:13px">' + (id === 'miss' ? 'Mở rộng phạm vi một hành trình (ví dụ chọn Toàn công ty) hoặc tạo hành trình riêng cho các vị trí này.' : 'Thu hẹp phạm vi một hành trình để người mới chỉ đi theo một lộ trình.') + '</p>');
      return;
    }
    var el = $('.hn-list'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  function hnCloseModals() { $$('.modal-bg').forEach(function (m) { if (m.close) m.close(); else m.remove(); }); }
  ACTS['hn-create'] = function () { modal('Tạo hành trình hội nhập', 'Chọn một cách để bắt đầu', hnChooser()); };
  ACTS['hn-new'] = function (a, id) { hnCloseModals(); hnGoEdit(hnDraftFrom(null, id === 'mau' ? 'mau' : '')); };
  ACTS['hn-view'] = function (a, id) { PS.hn.view = id === 'map' ? 'map' : 'tbl'; hnRerender(); };
  ACTS['hn-card'] = function (a, id, e) { if (HN_DRAG.moved) return; PS.hn.view = 'tbl'; hnRerender('#hnTbl tr[data-sid="' + id + '"] [data-f="title"]', id); };
  ACTS['hn-edit'] = function (a, id) { hnGoEdit(hnDraftFrom(id)); };
  ACTS['hn-dup'] = function (a, id) { hnGoEdit(hnDraftFrom(id, 'dup')); toast('Đã tạo bản sao', 'info', 'Chọn công ty, phòng ban, vị trí áp dụng cho bản sao rồi lưu.'); };
  ACTS['hn-print'] = function (a, id) { hnPrint(id); };
  ACTS['hn-onoff'] = function (a, id) { var on = null; S.units.forEach(function (u) { hnOf(u).jr.forEach(function (j) { if (j.gid === id) { j.on = !j.on; on = j.on; j.upd = HR.isoToday(); } }); }); hnSave((on ? 'Bật lại' : 'Tạm tắt') + ' hành trình ' + id); render(); };
  ACTS['hn-del'] = function (a, id) {
    var x = hnAll().filter(function (z) { return z.gid === id; })[0]; if (!x) return;
    var m = modal('Xóa hành trình?', x.j.name, '<p>Hành trình sẽ bị xóa khỏi ' + x.units.length + ' công ty. Nếu chỉ muốn ngừng dùng một thời gian, bấm “Tạm tắt” thay vì xóa.</p><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Không xóa</button><button class="btn btn-danger" id="hnDelOk">Xóa hành trình</button></div>', true);
    $('#hnDelOk', m).addEventListener('click', function () { S.units.forEach(function (u) { var h = hnOf(u); h.jr = h.jr.filter(function (j) { return j.gid !== id; }); }); hnSave('Xóa hành trình ' + id + ' "' + x.j.name + '"'); m.close(); render(); });
  };
  ACTS['hn-back'] = function () {
    var d = hnEd(); if (!d) return;
    if (!d.dirty) { PS.hn.ed = null; render(); return; }
    var m = modal('Bỏ các thay đổi chưa lưu?', d.name || 'Hành trình mới', '<p>Những gì vừa sửa ở hành trình này sẽ không được lưu.</p><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Ở lại sửa tiếp</button><button class="btn btn-danger" id="hnBackOk">Bỏ thay đổi</button></div>', true);
    $('#hnBackOk', m).addEventListener('click', function () { PS.hn.ed = null; m.close(); render(); });
  };
  ACTS['hn-save'] = function () {
    var d = hnEd(); if (!d) return;
    var err = hnValidate(d);
    if (err.length) { toast('Chưa lưu được hành trình', 'err', err.join(' · ')); $$('#hnTbl textarea[data-f="title"]').forEach(function (t) { if (!t.value.trim()) t.classList.add('bad'); }); return; }
    var gid = hnCommit(d), dup = hnDupCheck(gid);
    PS.hn.ed = null; render();
    if (dup.length) toast('Đã lưu – có vị trí trùng hành trình', 'err', dup.slice(0, 4).join(', ') + (dup.length > 4 ? '…' : '') + ' đang khớp 2 hành trình cùng mức. Thu hẹp phạm vi một hành trình để người mới chỉ đi theo một lộ trình.');
  };
  ACTS['hn-role'] = function (a, id) { PS.hn.role = id || ''; hnRerender(); };
  ACTS['hn-sc-u'] = function (a) { var d = hnEd(); if (!d) return; hnPush('Chọn công ty áp dụng'); var sc = d.sc[a.getAttribute('data-u')]; sc.use = a.checked; d.dirty = true; hnRerender(); };
  ACTS['hn-sc-all'] = function (a, id) { var d = hnEd(); if (!d) return; hnPush('Đổi phạm vi áp dụng'); var sc = d.sc[a.getAttribute('data-u')]; sc.all = id === 'all'; d.dirty = true; hnRerender(); };
  ACTS['hn-sc-pb'] = function (a, id) {
    var d = hnEd(); if (!d) return; hnPush('Chọn phòng ban áp dụng'); var u = unitById(a.getAttribute('data-u')), sc = d.sc[u.id], i = sc.pb.indexOf(id);
    if (i >= 0) { sc.pb.splice(i, 1); var cds = (hnTree(u).filter(function (p) { return p.pb === id; })[0] || { cds: [] }).cds.map(function (c) { return c.cd; }); sc.cd = sc.cd.filter(function (c) { return cds.indexOf(c) < 0; }); }
    else sc.pb.push(id);
    d.dirty = true; hnRerender();
  };
  ACTS['hn-sc-cd'] = function (a, id) {
    var d = hnEd(); if (!d) return; hnPush('Chọn vị trí áp dụng'); var sc = d.sc[a.getAttribute('data-u')], pb = a.getAttribute('data-pb'), i = sc.cd.indexOf(id);
    if (i >= 0) sc.cd.splice(i, 1); else { sc.cd.push(id); if (sc.pb.indexOf(pb) < 0) sc.pb.push(pb); }
    d.dirty = true; hnRerender();
  };
  ACTS['hn-co2'] = function (a, id) { hnCoPop(a, id); };
  ACTS['hn-bm2'] = function (a, id) { hnBmPop(a, id); };
  ACTS['hn-gridreset'] = function (a, id) { try { localStorage.removeItem(hnGKey(id)); } catch (e) { } hnRerender(); toast('Đã đặt lại độ rộng cột', 'info'); };
  ACTS['hn-st-new'] = function (a, ph) {
    var d = hnEd(); if (!d) return; hnPush('Thêm dòng'); var mx = 0; d.steps.forEach(function (x) { var q = /^b(\d+)$/.exec(x.id); if (q) mx = Math.max(mx, +q[1]); });
    var same = hnSorted(d.steps, ph), last = same[same.length - 1];
    var s = { id: 'b' + p2(mx + 1), ph: ph, n: last ? last.n : (ph === 'pre' ? 1 : ph === 'w1' ? 2 : ph === 'pr' ? 14 : ph === 'end' ? 0 : 1), t1: ph === 'd1' ? (last && last.t2 ? last.t2 : '08:00') : '', t2: '', title: '', desc: '', own: 'hcns', own2: [], doc: '', go: '', req: false, nv: false, law: '' };
    d.steps.push(s); d.dirty = true; hnRerender('#hnTbl tr[data-sid="' + s.id + '"] [data-f="title"]', s.id);
  };
  ACTS['hn-st-copy'] = function (a, id) {
    var d = hnEd(); if (!d) return; var s = d.steps.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    hnPush('Nhân bản dòng'); var c = JSON.parse(JSON.stringify(s)), mx = 0; d.steps.forEach(function (x) { var q = /^b(\d+)$/.exec(x.id); if (q) mx = Math.max(mx, +q[1]); }); c.id = 'b' + p2(mx + 1); c.title += ' (bản sao)';
    d.steps.splice(d.steps.indexOf(s) + 1, 0, c); d.dirty = true; hnRerender('#hnTbl tr[data-sid="' + c.id + '"] [data-f="title"]', c.id);
  };
  ACTS['hn-st-del'] = function (a, id) {
    var d = hnEd(); if (!d) return; var i = d.steps.map(function (x) { return x.id; }).indexOf(id); if (i < 0) return;
    hnPush('Xóa dòng' + (d.steps[i].title ? ' “' + d.steps[i].title + '”' : '')); var s = d.steps.splice(i, 1)[0]; d.dirty = true; hnRerender();
    toast('Đã xóa dòng' + (s.title ? ' “' + s.title + '”' : ''), 'info', 'Bấm “Hoàn tác” ở cuối trang hoặc Ctrl+Z để lấy lại.');
  };

  /* =====================================================================
     ĐỌC FILE QUY TRÌNH CÓ SẴN (anh 12/11 07:49: "cho phép up file PDF để công cụ tự đọc và thiết lập trước")
     PDF có lớp chữ: pdf.js (loadPdfjs trong nhansu.js) – lấy từng mảnh chữ kèm toạ độ, tìm dòng tiêu đề bảng
     (Lộ trình · Thời gian · Hạng mục · Nội dung · Mẫu biểu · Người phụ trách), chia cột theo tiêu đề, mỗi ô "Hạng mục" = 1 bước.
     Không có bảng: đọc theo dòng (dòng bắt đầu bằng giờ hoặc chữ in hoa ngắn = bước mới).
     Excel: đọc thẳng theo cột (ô gộp → lấy giá trị dòng trên). Kết quả mở trong trình sửa để người dùng kiểm tra.
     ===================================================================== */
  var HN_HDR = [['ph', /lo trinh|giai doan|lo trinh hoi nhap/], ['time', /thoi gian|^thoi$|^gian$|thoi diem|moc thoi gian/], ['title', /hang muc|cong viec|viec can lam|buoc|nhiem vu/], ['desc', /noi dung|chi tiet|mo ta/], ['doc', /mau bieu|tai lieu|bieu mau/], ['own', /phu trach|nguoi phu|nguoi thuc hien|^trach$|bo phan thuc hien/]];
  function hnHdrKey(t) { var n = norm(t).replace(/\s+/g, ' ').trim(); if (!n || n.length > 40) return ''; for (var i = 0; i < HN_HDR.length; i++) if (HN_HDR[i][1].test(n)) return HN_HDR[i][0]; return ''; }
  var HN_ABBR = ['NSM', 'HCNS', 'TBP', 'BGĐ', 'CEO', 'HĐ', 'HĐLĐ', 'HĐTV', 'BHXH', 'BHYT', 'TTUD', 'TTĐT', 'TLV', 'BSTL', 'FB', 'IT', 'KPI', 'CV', 'NV', 'TD', 'BP', 'TP', 'GĐ', 'PGĐ', 'ATVSLĐ', 'PCCC', 'CCCD', 'QR'];
  function hnSentence(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    var letters = t.replace(/[^A-Za-zÀ-ỹ]/g, ''); if (!letters || letters !== letters.toUpperCase()) return t;
    var w = t.split(' ').map(function (x) { var core = x.replace(/[^A-Za-zÀ-ỹĐđ]/g, ''); return HN_ABBR.indexOf(core) >= 0 ? x : x.toLowerCase(); }).join(' ');
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  function hnRolesOf(t) {
    var n = norm(t), out = [];
    var R = [['hcns', /hcns|hanh chinh|nhan su(?! moi)|\bhr\b|phong ns/], ['tbp', /\btbp\b|truong (bo phan|phong|nhom)|quan ly|\btp\b|truong ban/], ['kc', /kem cap|dong hanh|buddy|nguoi huong dan|mentor/], ['kt', /ke toan/], ['bgd', /giam doc|\bbgd\b|\bceo\b|ban lanh dao|\bgd\b/], ['it', /\bit\b|ky thuat|thiet bi|cntt/], ['nv', /\bnsm\b|nhan su moi|nguoi moi|ung vien|nhan vien moi/]];
    R.forEach(function (r) { var m = r[1].exec(n); if (m) out.push({ r: r[0], i: m.index }); });
    out.sort(function (a, b) { return a.i - b.i; });
    var seen = {}; return out.filter(function (x) { if (seen[x.r]) return false; seen[x.r] = 1; return true; }).map(function (x) { return x.r; });
  }
  function hnPhOf(t) {
    var n = norm(t); if (!n) return '';
    if (/truoc ngay|truoc khi (di lam|nhan viec)|chuan bi truoc/.test(n)) return 'pre';
    if (/ngay dau|ngay 1\b|ngay nhan viec|ngay thu nhat/.test(n)) return 'd1';
    if (/ket thuc thu viec|het thu viec|danh gia thu viec|tot nghiep/.test(n)) return 'end';
    if (/chinh thuc|chao don|thanh vien moi/.test(n)) return 'off';
    if (/tuan dau|7 ngay|review|tuan thu nhat/.test(n)) return 'w1';
    if (/thu viec|thang dau|30 ngay/.test(n)) return 'pr';
    return '';
  }
  function hnTimeOf(t) {
    var n = String(t || '').replace(/\s+/g, ' ');
    var m = /(\d{1,2})\s*[hH:g]\s*(\d{0,2})(?:\s*(?:-|–|—|đến|den)\s*(\d{1,2})\s*[hH:g]\s*(\d{0,2}))?/.exec(n);
    var r = {};
    if (m && +m[1] < 24) { r.t1 = p2(+m[1]) + ':' + p2(+(m[2] || 0)); if (m[3] && +m[3] < 24) r.t2 = p2(+m[3]) + ':' + p2(+(m[4] || 0)); }
    var d = /(\d{1,3})\s*ngày/i.exec(n); if (d) r.n = +d[1];
    return r;
  }
  // Nội dung cần xem lại về pháp lý khi đọc file (gắn cờ, không tự xóa)
  var HN_FLAGS = [
    [/coc|dat coc|ky quy|tien bao dam/, 'Cần xem lại: BLLĐ 2019 Điều 17 khoản 2 – không được yêu cầu người lao động thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản. Chi phí đào tạo ràng buộc bằng hợp đồng đào tạo (Điều 62).'],
    [/giu ban (chinh|goc)|thu ban (chinh|goc)|nop ban (chinh|goc)/, 'Cần xem lại: BLLĐ 2019 Điều 17 khoản 1 – không giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động.']
  ];
  // rows: [{ ph, time, title, desc, doc, own }] (chuỗi) → các bước
  function hnRowsToSteps(rows) {
    var out = [], cur = 'd1', last = null, warn = 0;
    rows.forEach(function (r) {
      var title = String(r.title || '').trim(), desc = String(r.desc || '').trim(), time = String(r.time || '').trim();
      if (!title && !time && desc && last) { last.desc += (last.desc ? '\n' : '') + desc; return; }
      if (!title && !desc) { var ph0 = hnPhOf(r.ph); if (ph0) cur = ph0; return; }
      if (title && !desc && !String(r.own || '').trim() && !String(r.doc || '').trim() && (r.tc || !time)) { var ph1 = hnPhOf(r.ph); if (ph1) cur = ph1; return; } // dòng tiêu đề nhóm (ví dụ "TRUNG TÂM ỨNG DỤNG")
      var tm = hnTimeOf(time), ph = hnPhOf(r.ph) || hnPhOf(time) || hnPhOf(title) || (tm.t1 ? 'd1' : '') || cur;
      if (ph === 'd1' && !tm.t1 && hnPhOf(title) && hnPhOf(title) !== 'd1') ph = hnPhOf(title);
      cur = ph;
      var roles = hnRolesOf(r.own); if (!roles.length) roles = hnRolesOf(title).filter(function (x) { return x !== 'nv'; }).slice(0, 1);
      var own = roles[0] || 'hcns', own2 = roles.slice(1);
      var otherOwn = String(r.own || '').trim() && !hnRolesOf(r.own).length ? String(r.own).trim() : '';
      var s = { id: 'b' + p2(out.length + 1), ph: ph, n: 1, t1: '', t2: '', title: hnSentence(title || desc.split('\n')[0].replace(/^[-+•*\s]+/, '').slice(0, 90)), desc: desc.split('\n').map(function (x) { return x.replace(/^\s*[-•*]\s*/, '- ').trim(); }).filter(Boolean).join('\n') + (otherOwn ? (desc ? '\n' : '') + 'Người phụ trách ghi trong file: ' + otherOwn : ''), own: own, own2: own2, doc: String(r.doc || '').replace(/\s+/g, ' ').trim(), go: '', req: false, nv: /\bnsm\b|nhan su moi|nguoi moi|ung vien/.test(norm(title + ' ' + desc)), law: '' };
      if (ph === 'd1') { s.t1 = tm.t1 || (last && last.ph === 'd1' ? last.t1 : '08:00'); s.t2 = tm.t1 ? (tm.t2 || '') : (last && last.ph === 'd1' ? last.t2 : ''); }
      else if (ph === 'pre') s.n = tm.n || 1;
      else if (ph === 'w1') s.n = Math.min(Math.max(tm.n || 7, 2), 7);
      else if (ph === 'pr') s.n = tm.n || 30;
      else if (ph === 'end') s.n = 0;
      else s.n = tm.n && tm.n < 60 ? tm.n : 1;
      var all = norm(title + ' ' + desc);
      HN_FLAGS.forEach(function (f) { if (f[0].test(all) && !s.warn) { s.law = f[1]; s.warn = true; warn++; } });
      out.push(s); last = s;
    });
    out.warn = warn; return out;
  }
  // ---- Excel: mỗi trang tính có bảng = 1 quy trình
  function hnXlsTables(wb) {
    var tabs = [];
    wb.sheetNames.forEach(function (sn) {
      var rows = wb.getRows(sn) || [], hi = -1, cols = null;
      var txt = function (v) { if (v === null || v === undefined) return ''; if (XR.isXD && XR.isXD(v)) return ''; return String(v).trim(); };
      for (var i = 0; i < Math.min(rows.length, 40) && hi < 0; i++) { var m = {}, k = 0; (rows[i] || []).forEach(function (v, c) { var key = hnHdrKey(txt(v)); if (key && m[key] === undefined) { m[key] = c; k++; } }); if (k >= 2 && (m.title !== undefined || m.desc !== undefined)) { hi = i; cols = m; } }
      if (hi < 0) return;
      var title = ''; for (var t = hi - 1; t >= 0 && !title; t--) title = (rows[t] || []).map(txt).filter(Boolean).join(' ');
      var out = [], carry = { ph: '', time: '' };
      for (var r = hi + 1; r < rows.length; r++) {
        var row = rows[r] || [], g = function (k) { return cols[k] === undefined ? '' : txt(row[cols[k]]); };
        var o = { ph: g('ph'), time: g('time'), title: g('title'), desc: g('desc'), doc: g('doc'), own: g('own') };
        if (!o.title && !o.desc && !o.time && !o.doc && !o.own) { if (o.ph) out.push({ ph: o.ph }); continue; }
        if (o.ph) carry.ph = o.ph; else o.ph = carry.ph;
        if (o.time) carry.time = o.time; else if (o.title) o.time = carry.time;
        out.push(o);
      }
      tabs.push({ title: title || sn, rows: out, sheet: sn });
    });
    return tabs;
  }
  // ---- PDF: mảnh chữ có toạ độ (y tính từ trên xuống, cộng dồn theo trang)
  function hnPdfItems(u8) {
    return loadPdfjs().then(function (lib) { return lib.getDocument({ data: u8 }).promise; }).then(function (pdf) {
      var items = [], p = Promise.resolve(), off = 0;
      for (var i = 1; i <= Math.min(pdf.numPages, 40); i++) (function (n) {
        p = p.then(function () { return pdf.getPage(n).then(function (pg) { var vp = pg.getViewport({ scale: 1 }), H = vp.height; return pg.getTextContent().then(function (tc) {
          tc.items.forEach(function (it) { if (!it.str || !it.str.trim()) return; var tr = it.transform, rot = Math.abs(tr[0]) < 0.01 && Math.abs(tr[1]) > 0.01, fs = Math.hypot(tr[0], tr[1]) || Math.hypot(tr[2], tr[3]) || 10;
            if (rot) items.push({ s: it.str, x: tr[4] - fs, w: fs, y0: off + H - tr[5] - (tr[1] > 0 ? it.width : 0), y1: off + H - tr[5] + (tr[1] > 0 ? 0 : it.width), rot: true, pg: n });
            else items.push({ s: it.str, x: tr[4], w: it.width || 0, y: off + H - tr[5] - fs * 0.35, h: fs, pg: n }); });
          off += H + 40; }); }); });
      })(i);
      return p.then(function () { return items; });
    });
  }
  function hnPdfTables(items) {
    var flat = items.filter(function (i) { return !i.rot; }), rot = items.filter(function (i) { return i.rot; });
    if (!flat.length) return [];
    // gom thành dòng
    flat.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    var lines = []; flat.forEach(function (it) { var L = lines[lines.length - 1]; if (L && Math.abs(L.y - it.y) < Math.max(2.5, it.h * 0.3)) L.its.push(it); else lines.push({ y: it.y, its: [it] }); });
    // khoảng cách dòng ước theo cỡ chữ phổ biến (các cột xen kẽ nhau nên không đo được từ dòng liền kề)
    var lh = (function () { var hs = flat.map(function (i) { return i.h || 10; }).sort(function (a, b) { return a - b; }); return (hs[Math.floor(hs.length / 2)] || 10) * 1.25; })();
    // dòng tiêu đề bảng: có ≥2 nhãn cột (cho phép nhãn xuống 2 dòng, ví dụ "THỜI / GIAN")
    var heads = [];
    lines.forEach(function (L, li) {
      var band = lines.filter(function (M) { return M.y >= L.y - 1 && M.y - L.y <= lh * 1.7; }), its = []; band.forEach(function (M) { its = its.concat(M.its); });
      var keys = {}; its.forEach(function (it) { var k = hnHdrKey(it.s); if (k) (keys[k] = keys[k] || []).push(it); });
      var kn = Object.keys(keys).length;
      if (kn >= 3 && (keys.title || keys.desc) && !heads.some(function (h) { return Math.abs(h.y - L.y) < lh * 3; })) {
        var cols = Object.keys(keys).map(function (k) { var xs = keys[k]; var x0 = Math.min.apply(null, xs.map(function (i) { return i.x; })), x1 = Math.max.apply(null, xs.map(function (i) { return i.x + i.w; })); return { k: k, c: (x0 + x1) / 2 }; }).sort(function (a, b) { return a.c - b.c; });
        heads.push({ y: Math.max.apply(null, band.map(function (M) { return M.y; })), yTop: Math.min.apply(null, band.map(function (M) { return M.y; })), cols: cols, li: li });
      }
    });
    if (!heads.length) return [];
    return heads.map(function (H, hi) {
      var yEnd = hi + 1 < heads.length ? heads[hi + 1].yTop - lh * 4 : 1e12;
      var body = flat.filter(function (it) { return it.y > H.y + 1 && it.y < yEnd; });
      // ranh giới cột: điểm giữa tâm tiêu đề; cột chữ căn trái (nhiều dòng cùng điểm bắt đầu) lấy mép trái thật
      var C = H.cols, B = [];
      for (var k = 1; k < C.length; k++) {
        var lo = C[k - 1].c, hiC = C[k].c, cnt = {};
        // chỉ coi là cột căn trái khi nhiều dòng cùng mép trái nhưng độ dài khác nhau (ô căn giữa có chữ giống nhau như "HCNS" cũng trùng mép trái)
        body.forEach(function (it) { if (it.x > lo && it.x < hiC) { var rx = Math.round(it.x); (cnt[rx] = cnt[rx] || []).push(Math.round(it.w)); } });
        var sd = function (a) { var m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / a.length); };
        var best = null; Object.keys(cnt).forEach(function (x) { var ws = []; for (var d = -1; d <= 1; d++) ws = ws.concat(cnt[+x + d] || []); if (ws.length >= 4 && sd(ws) > 15 && (!best || ws.length > best.n)) best = { x: +x, n: ws.length }; });
        B.push(best && best.x < hiC ? { x: best.x - 3, left: true } : { x: (lo + hiC) / 2, left: false });
      }
      // cột căn trái so theo mép trái chữ; cột căn giữa so theo tâm chữ
      var colOf = function (it) { for (var k = 0; k < B.length; k++) if ((B[k].left ? it.x : it.x + it.w / 2) < B[k].x) return C[k].k; return C[C.length - 1].k; };
      // tiêu đề quy trình: dòng chữ gần nhất phía trên bảng
      var above = lines.filter(function (L) { return L.y < H.yTop - 2 && L.y > H.yTop - 160; }), title = above.length ? above[above.length - 1].its.map(function (i) { return i.s; }).join(' ').replace(/\s+/g, ' ').trim() : '';
      // các khối "Hạng mục" (ô nhiều dòng) = các bước
      var tl = []; body.filter(function (it) { return colOf(it) === 'title'; }).forEach(function (it) { var L = tl[tl.length - 1]; if (L && Math.abs(L.y - it.y) < 2.5) L.its.push(it); else tl.push({ y: it.y, its: [it] }); });
      // hai hàng 1 dòng sát nhau: tách khi cả dòng đầu khối và dòng mới đều có giờ thẳng hàng ở cột Thời gian
      var tys = body.filter(function (it) { return colOf(it) === 'time' && /\d\s*[hH:]/.test(it.s); }), tAt = function (y) { var m = tys.filter(function (t) { return Math.abs(t.y - y) < lh * 0.45; })[0]; return m ? m.s.trim() : ''; };
      var blocks = []; tl.forEach(function (L) { var b = blocks[blocks.length - 1], t0 = b ? tAt(b.y0) : ''; if (b && L.y - b.y1 < lh * 1.1 && !(tAt(L.y) && t0 && !/[-–—]$/.test(t0))) { b.y1 = L.y; b.ls.push(L); } else blocks.push({ y0: L.y, y1: L.y, ls: [L] }); });
      if (!blocks.length) return { title: title, rows: [] };
      blocks.forEach(function (b) { b.c = (b.y0 + b.y1) / 2; });
      // ranh giới 2 bước: khoảng trống lớn nhất giữa các dòng của cột Nội dung (ô khác nhau cách xa hơn dòng trong cùng ô); không đủ dữ liệu thì lấy điểm giữa
      var dys = []; body.forEach(function (it) { if (colOf(it) === 'desc' && !dys.some(function (y) { return Math.abs(y - it.y) < 2.5; })) dys.push(it.y); }); dys.sort(function (a, b) { return a - b; });
      var cutAt = blocks.map(function (b, i) { if (i + 1 >= blocks.length) return null; var a = b.c, z = blocks[i + 1].c, ys = dys.filter(function (y) { return y > a - lh && y < z + lh; }), best = null; for (var k = 1; k < ys.length; k++) { var g = ys[k] - ys[k - 1], mid = (ys[k] + ys[k - 1]) / 2; if (mid > a - lh * 0.5 && mid < z + lh * 0.5 && g > lh * 1.3 && (!best || g > best.g)) best = { g: g, m: mid }; } return best ? best.m : (a + z) / 2; });
      var rows = blocks.map(function (b, i) { var top = i ? cutAt[i - 1] : H.y, bot = i + 1 < blocks.length ? cutAt[i] : yEnd; return { top: top, bot: bot, c: b.c, cells: { title: [], time: [], desc: [], doc: [], own: [], ph: [] }, b: b }; });
      body.forEach(function (it) { var k = colOf(it); var r = rows.filter(function (r) { return it.y >= r.top && it.y < r.bot; })[0]; if (r && r.cells[k]) r.cells[k].push(it); });
      var join = function (arr) { var ls = []; arr.sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (it) { var L = ls[ls.length - 1]; if (L && Math.abs(L.y - it.y) < 2.5) L.t += (/\s$/.test(L.t) || /^\s/.test(it.s) ? '' : ' ') + it.s; else ls.push({ y: it.y, t: it.s }); }); return ls.map(function (l) { return l.t.replace(/\s+/g, ' ').trim(); }).filter(Boolean).join('\n'); };
      // chữ xoay dọc (cột Lộ trình gộp nhiều dòng) → giai đoạn cho các dòng nằm trong khoảng của nó
      var rb = []; rot.forEach(function (it) { var b = rb.filter(function (z) { return Math.abs(z.x - it.x) < 6 && it.y0 < z.y1 + 30 && it.y1 > z.y0 - 30; })[0]; if (b) { b.y0 = Math.min(b.y0, it.y0); b.y1 = Math.max(b.y1, it.y1); b.its.push(it); } else rb.push({ x: it.x, y0: it.y0, y1: it.y1, its: [it] }); });
      rb.forEach(function (b) { b.t = b.its.sort(function (a, c) { return a.y1 > c.y1 ? -1 : 1; }).map(function (i) { return i.s; }).join(' ').replace(/\s+/g, ' ').trim(); });
      var out = [], carry = '';
      rows.forEach(function (r) {
        var o = { title: join(r.b.ls.reduce(function (a, L) { return a.concat(L.its); }, [])), time: join(r.cells.time).replace(/\n/g, ' '), desc: join(r.cells.desc), doc: join(r.cells.doc).replace(/\n/g, ' '), own: join(r.cells.own).replace(/\n/g, ' / '), ph: join(r.cells.ph).replace(/\n/g, ' ') };
        var rr = rb.filter(function (b) { return r.c >= b.y0 - 4 && r.c <= b.y1 + 4; })[0]; if (rr) o.ph = rr.t + ' ' + o.ph;
        if (o.time) carry = o.time; else { o.time = carry; o.tc = true; }
        out.push(o);
      });
      // bỏ các dòng cuối không có nội dung (bảng khác dính vào, ví dụ bảng Từ viết tắt)
      while (out.length && !out[out.length - 1].desc && !out[out.length - 1].own && !out[out.length - 1].doc) out.pop();
      return { title: title, rows: out };
    }).filter(function (t) { return t.rows.length; });
  }
  // PDF không có bảng: đọc theo dòng
  function hnPdfPlain(items) {
    var flat = items.filter(function (i) { return !i.rot; }).sort(function (a, b) { return a.y - b.y || a.x - b.x; }), lines = [];
    flat.forEach(function (it) { var L = lines[lines.length - 1]; if (L && Math.abs(L.y - it.y) < 2.5) L.t += ' ' + it.s; else lines.push({ y: it.y, t: it.s }); });
    var rows = [], cur = null, ph = '';
    lines.forEach(function (L) {
      var t = L.t.replace(/\s+/g, ' ').trim(); if (!t) return;
      var p0 = hnPhOf(t), isHead = t.length < 70 && t === t.toUpperCase() && /[A-ZÀ-Ỹ]/.test(t);
      if (p0 && isHead && !/^\d/.test(t)) { ph = t; return; }
      var tm = /^(\d{1,2}\s*[hH:]\s*\d{0,2}(?:\s*[-–—]\s*\d{1,2}\s*[hH:]\s*\d{0,2})?)\s*[:\-–.]?\s*(.*)$/.exec(t), num = /^(?:\d{1,2}[.)]|bước\s*\d+[:.]?)\s*(.+)$/i.exec(t);
      if (tm && tm[2]) { cur = { ph: ph, time: tm[1], title: tm[2].split(/[:.]/)[0], desc: tm[2].indexOf(':') > 0 ? tm[2].slice(tm[2].indexOf(':') + 1).trim() : '', doc: '', own: '' }; rows.push(cur); }
      else if (num || (isHead && t.length < 60)) { cur = { ph: ph, time: '', title: (num ? num[1] : t).split(':')[0], desc: num && num[1].indexOf(':') > 0 ? num[1].slice(num[1].indexOf(':') + 1).trim() : '', doc: '', own: '' }; rows.push(cur); }
      else if (cur) { var pm = /^(?:người )?phụ trách\s*:\s*(.+)$/i.exec(t); if (pm) cur.own = pm[1]; else cur.desc += (cur.desc ? '\n' : '') + t; }
    });
    return rows.length ? [{ title: '', rows: rows }] : [];
  }
  function hnImportFile(f) {
    if (!f) return;
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (['pdf', 'xlsx', 'xls'].indexOf(ext) < 0) { toast('Chưa đọc được loại file này', 'err', 'Chọn file PDF hoặc Excel (.xlsx, .xls).'); return; }
    toast('Đang đọc file ' + f.name + '…', 'info');
    f.arrayBuffer().then(function (buf) {
      var u8 = new Uint8Array(buf);
      if (ext === 'pdf') return hnPdfItems(u8).then(function (items) {
        if (!items.length) throw { msg: 'File PDF không có lớp chữ (thường là file chụp, scan). Hãy dùng file PDF xuất từ Word/Excel, hoặc tải thẳng file Excel.' };
        var t = hnPdfTables(items); return t.length ? t : hnPdfPlain(items);
      });
      return hnXlsTables(XR.open(u8, f.name));
    }).then(function (tabs) {
      tabs = (tabs || []).map(function (t) { var st = hnRowsToSteps(t.rows); return { title: t.title, steps: st, warn: st.warn }; }).filter(function (t) { return t.steps.length; });
      log('Hội nhập: đọc file ' + f.name + ' – ' + tabs.length + ' quy trình [' + tabs.map(function (t) { return (t.title || '(không tên)') + ': ' + t.steps.length + ' bước'; }).join('; ') + ']');
      if (!tabs.length) { toast('Chưa tìm thấy bước nào trong file', 'err', 'Phần mềm cần bảng có cột kiểu Thời gian · Hạng mục / Việc cần làm · Nội dung · Người phụ trách, hoặc danh sách bước đánh số. Có thể tạo hành trình trống rồi dán nội dung vào bảng.'); return; }
      var open = function (t) { hnCloseModals(); var d = hnDraftFrom(null, ''); d.name = hnSentence(t.title || f.name.replace(/\.[^.]+$/, '')).replace(/^quy trình\s+/i, 'Hành trình – ').replace(/\s+/g, ' '); d.name = d.name.charAt(0).toUpperCase() + d.name.slice(1); d.desc = 'Đọc từ file ' + f.name + (t.title ? ' – ' + t.title : '') + '.'; d.steps = t.steps.map(function (s) { delete s.warn; return s; }); t.steps.forEach(function (s, i) { if (t.warnIx && t.warnIx[i]) s.warn = true; }); d.src = { file: f.name, n: t.steps.length, warn: t.warn }; d.dirty = true; hnGoEdit(d); };
      tabs.forEach(function (t) { t.warnIx = t.steps.map(function (s) { return !!s.warn; }); });
      if (tabs.length === 1) { open(tabs[0]); return; }
      var m = modal('File có ' + tabs.length + ' quy trình', 'Chọn quy trình muốn tạo thành hành trình (làm lần lượt nếu cần nhiều hành trình)', '<div class="hn-pick">' + tabs.map(function (t, i) { return '<button class="hn-opt" data-i="' + i + '"><b>' + esc(t.title || 'Quy trình ' + (i + 1)) + '</b><span>' + t.steps.length + ' bước' + (t.warn ? ' · <em style="color:var(--danger);font-style:normal">' + t.warn + ' bước cần xem lại pháp lý</em>' : '') + ' · ' + esc(t.steps.slice(0, 3).map(function (s) { return s.title; }).join(' · ')) + '…</span></button>'; }).join('') + '</div>');
      $$('.hn-pick [data-i]', m).forEach(function (b) { b.addEventListener('click', function () { open(tabs[+b.getAttribute('data-i')]); }); });
    }).catch(function (e) {
      if (e && e.offline) { toast('Chưa tải được bộ đọc PDF', 'err', 'Đọc PDF cần mạng để tải thư viện pdf.js lần đầu. Kiểm tra mạng, hoặc dùng file Excel.'); return; }
      if (e && e.msg) { toast('Chưa đọc được file', 'err', e.msg); return; }
      logErr('Đọc file quy trình hội nhập ' + f.name, e); toast('Chưa đọc được file', 'err', SUPPORT_MSG);
    });
  }
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.classList && t.classList.contains('hn-file') && t.files && t.files[0]) { var f = t.files[0]; t.value = ''; hnImportFile(f); } });
  document.addEventListener('dragover', function (e) { var z = e.target.closest && e.target.closest('.hn-drop'); if (z) { e.preventDefault(); z.classList.add('drag'); } });
  document.addEventListener('dragleave', function (e) { var z = e.target.closest && e.target.closest('.hn-drop'); if (z) z.classList.remove('drag'); });
  document.addEventListener('drop', function (e) { var z = e.target.closest && e.target.closest('.hn-drop'); if (z) { e.preventDefault(); z.classList.remove('drag'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) hnImportFile(f); } });

  /* =====================================================================
     LỘ TRÌNH THEO THỜI ĐIỂM – kéo thả (anh 12/11: chọn tab Theo bảng / Theo thời điểm, kéo thả thứ tự và chuyển giai đoạn)
     Thả vào vị trí mới → thời điểm tự đổi: ngày đầu lấy giờ ngay sau bước đứng trước (giữ thời lượng);
     giai đoạn khác lấy cùng mốc ngày với bước đứng trước (hoặc đứng sau). Thứ tự trùng mốc giữ theo vị trí thả.
     ===================================================================== */
  var HN_DRAG = { id: null, moved: false };
  function hnRoadmap(d, role) {
    return '<div class="hn-rm" id="hnMap">' + HN_PH.map(function (p, pi) {
      var ss = hnSorted(d.steps, p[0]);
      return '<div class="hn-lane" data-ph="' + p[0] + '"><div class="hn-lane-h"><span class="hn-lane-n">' + (pi + 1) + '</span><div><b>' + p[1] + '</b><small>' + p[2] + '</small></div><em>' + ss.length + '</em></div>' +
        '<div class="hn-lane-b" data-drop="' + p[0] + '">' + ss.map(function (s) {
          var dim = role && s.own !== role && (s.own2 || []).indexOf(role) < 0;
          return '<div class="hn-cardx' + (dim ? ' dim' : '') + (s.warn ? ' warn' : '') + '" draggable="true" data-sid="' + esc(s.id) + '" data-act="hn-card" data-id="' + esc(s.id) + '" title="Kéo để đổi thứ tự / giai đoạn · bấm để sửa trong bảng"><div class="hn-cx-t"><span class="hn-when">' + ic('hn_clock') + esc(hnWhen(s)) + '</span>' + (s.req ? '<span class="tag tag-warn">Bắt buộc</span>' : '') + '</div><div class="hn-cx-tt">' + (esc(s.title) || '<span class="faint">(chưa ghi việc)</span>') + '</div><div class="hn-cx-f">' + hnRoleTag(s.own, true) + ((s.own2 || []).length ? '<span class="faint" style="font-size:11px">+' + s.own2.length + ' phối hợp</span>' : '') + (s.nv ? '<span class="hn-nvic" title="Người mới cùng làm">' + ic('td_user', 13) + '</span>' : '') + ((s.bm || []).length ? '<span class="faint" style="font-size:11px" title="' + esc(hnBmNames(s.bm)) + '">' + ic('hn_doc', 12) + ' ' + s.bm.length + ' biểu mẫu</span>' : '') + '</div></div>';
        }).join('') + '</div><button class="hn-add" data-act="hn-st-new" data-id="' + p[0] + '">' + ic('td_plus') + 'Thêm bước</button></div>';
    }).join('') + '</div>';
  }
  function hnBindMap() {
    var mp = $('#hnMap'); if (!mp) return;
    var mark = document.createElement('div'); mark.className = 'hn-dropmark';
    function where(lane, y) { var cs = $$('.hn-cardx', lane).filter(function (c) { return c.getAttribute('data-sid') !== HN_DRAG.id; }); for (var i = 0; i < cs.length; i++) { var r = cs[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return cs[i]; } return null; }
    mp.addEventListener('dragstart', function (e) { var c = e.target.closest('.hn-cardx'); if (!c) return; HN_DRAG = { id: c.getAttribute('data-sid'), moved: false }; c.classList.add('drag'); try { e.dataTransfer.setData('text/plain', HN_DRAG.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
    mp.addEventListener('dragend', function (e) { var c = e.target.closest('.hn-cardx'); if (c) c.classList.remove('drag'); if (mark.parentNode) mark.remove(); $$('.hn-lane.over', mp).forEach(function (l) { l.classList.remove('over'); }); setTimeout(function () { HN_DRAG.moved = false; }, 50); });
    mp.addEventListener('dragover', function (e) { if (!HN_DRAG.id) return; var lane = e.target.closest('.hn-lane'); if (!lane) return; e.preventDefault(); $$('.hn-lane.over', mp).forEach(function (l) { if (l !== lane) l.classList.remove('over'); }); lane.classList.add('over'); var body = $('.hn-lane-b', lane), bef = where(body, e.clientY); if (bef) body.insertBefore(mark, bef); else body.appendChild(mark); });
    mp.addEventListener('drop', function (e) { if (!HN_DRAG.id) return; var lane = e.target.closest('.hn-lane'); if (!lane) return; e.preventDefault(); var body = $('.hn-lane-b', lane), bef = where(body, e.clientY), id = HN_DRAG.id; HN_DRAG.moved = true; if (mark.parentNode) mark.remove(); hnMoveStep(id, lane.getAttribute('data-ph'), bef ? bef.getAttribute('data-sid') : null); HN_DRAG.id = null; });
  }
  function hnMin(t) { return t ? +t.slice(0, 2) * 60 + +t.slice(3, 5) : null; }
  function hnHM(m) { m = Math.max(0, Math.min(m, 23 * 60 + 59)); return p2(Math.floor(m / 60)) + ':' + p2(m % 60); }
  function hnMoveStep(id, ph, beforeId) {
    var d = hnEd(); if (!d) return; var s = d.steps.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    hnPush('Kéo thả “' + (s.title || 'bước') + '”'); var oldPh = s.ph, oldWhen = hnWhen(s), list = hnSorted(d.steps, ph).filter(function (x) { return x !== s; });
    var next = beforeId ? list.filter(function (x) { return x.id === beforeId; })[0] : null, idx = next ? list.indexOf(next) : list.length, prev = list[idx - 1] || null;
    if (ph === 'd1') {
      var dur = s.t1 && s.t2 ? Math.max(5, hnMin(s.t2) - hnMin(s.t1)) : 30, st;
      if (prev) { st = hnMin(prev.t2 || prev.t1); if (next && st > hnMin(next.t1)) st = hnMin(next.t1); if (st < hnMin(prev.t1)) st = hnMin(prev.t1); }
      else st = next ? Math.max(0, hnMin(next.t1) - dur) : 8 * 60;
      s.t1 = hnHM(st); s.t2 = s.t2 || oldPh !== 'd1' ? hnHM(st + dur) : ''; s.n = 1;
    } else {
      var def = ph === 'pre' ? 1 : ph === 'w1' ? 2 : ph === 'pr' ? 14 : ph === 'end' ? 0 : 1;
      s.n = prev ? prev.n : next ? next.n : (oldPh === ph ? s.n : def); s.t1 = ''; s.t2 = '';
    }
    s.ph = ph;
    // đặt lại vị trí trong mảng để thứ tự trùng mốc đúng chỗ thả
    d.steps.splice(d.steps.indexOf(s), 1);
    if (next) d.steps.splice(d.steps.indexOf(next), 0, s); else if (prev) d.steps.splice(d.steps.indexOf(prev) + 1, 0, s); else d.steps.push(s);
    d.dirty = true; hnRerender(null, s.id);
    toast(oldPh !== ph ? 'Đã chuyển sang “' + HN_PHN[ph] + '”' : 'Đã đổi thứ tự', 'info', '“' + (s.title || 'Bước') + '”: ' + oldWhen + ' → ' + hnWhen(s) + '. Sửa lại ở bảng nếu cần.');
  }

  /* =====================================================================
     TIẾN ĐỘ HỘI NHẬP (anh 12/11 07:49: đổi tên module con "Người mới đang hội nhập" → "Tiến độ hội nhập", dữ liệu mẫu 2–3 người mới)
     Mỗi người mới = 1 hồ sơ hội nhập u.hn.ob[]: chép nguyên các bước của hành trình lúc bắt đầu (sửa hành trình sau đó
     không làm đổi người đang hội nhập). Hạn từng bước tính theo lịch:
       trước ngày đi làm = ngày vào làm − n · ngày đầu = ngày vào làm · tuần đầu, thử việc = ngày vào làm + (n − 1)
       kết thúc thử việc = ngày hết thử việc − n · chính thức = ngày hết thử việc + n. Không thử việc → 2 giai đoạn cuối "Không áp dụng".
     Trạng thái bước: todo · done (dAt) · skip (lý do; bước bắt buộc không cho bỏ qua) · na.
     ===================================================================== */
  function hnDue(o, s) {
    var n = +s.n || 0;
    if (s.ph === 'pre') return tdAdd(o.start, -n);
    if (s.ph === 'd1') return o.start;
    if (s.ph === 'w1' || s.ph === 'pr') return tdAdd(o.start, Math.max(0, n - 1));
    if (!o.pe) return null;
    return s.ph === 'end' ? tdAdd(o.pe, -n) : tdAdd(o.pe, n);
  }
  function hnObSteps(o) { return o.steps.map(function (s, i) { return { s: s, i: i, due: hnDue(o, s) }; }).sort(function (a, b) { var pa = HN_PH.map(function (p) { return p[0]; }).indexOf(a.s.ph), pb = HN_PH.map(function (p) { return p[0]; }).indexOf(b.s.ph); return (a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : pa - pb || ((a.s.t1 || '') < (b.s.t1 || '') ? -1 : (a.s.t1 || '') > (b.s.t1 || '') ? 1 : a.i - b.i); }); }
  function hnObStat(o, R) {
    R = R || refDate();
    var L = hnObSteps(o), on = L.filter(function (x) { return x.s.x !== 'na'; });
    var done = on.filter(function (x) { return x.s.x === 'done' || x.s.x === 'skip'; }), todo = on.filter(function (x) { return x.s.x !== 'done' && x.s.x !== 'skip'; });
    var late = todo.filter(function (x) { return x.due && x.due < R; }), soon = todo.filter(function (x) { return x.due && x.due >= R && tdDiff(R, x.due) <= 7; });
    var byPh = {}; HN_PH.forEach(function (p) { var a = on.filter(function (x) { return x.s.ph === p[0]; }); byPh[p[0]] = { n: a.length, done: a.filter(function (x) { return x.s.x === 'done' || x.s.x === 'skip'; }).length, late: a.filter(function (x) { return late.indexOf(x) >= 0; }).length }; });
    var next = todo[0] || null;
    return { all: on.length, done: done.length, todo: todo, late: late, soon: soon, next: next, byPh: byPh, pct: on.length ? Math.round(done.length * 100 / on.length) : 100, cur: next ? next.s.ph : 'xong' };
  }
  function hnProbEnd(u, nvId) {
    try { var L = (HRR.contractsOf(u.data)[nvId] || []).filter(function (c) { return HRR.isProb(c['Loại hợp đồng']) && c['Ngày hết hạn']; }); return L.length ? String(L[L.length - 1]['Ngày hết hạn']).slice(0, 10) : ''; } catch (e) { return ''; }
  }
  // 12/11 09:37 anh: hành trình đặt người phụ trách theo vai trò; khi có người mới thì chỉ định người cụ thể cho từng vai trò (việc sẽ hiện trên app người đó)
  var HN_RS = { hcns: 'Nhân sự', tbp: 'Trưởng BP', kc: 'Đồng hành', kt: 'Kế toán', bgd: 'Giám đốc', it: 'Thiết bị, TK', nv: 'Người mới' };
  function hnStaff(u, self) { var R = refDate(); return (u.data.NV || []).filter(function (e) { return e['Mã NV'] !== self && HR.staffState(e, R) !== 'left'; }); }
  function hnName(u, id) { var e = id ? hnNvOf(u, id) : null; return e ? e['Họ và tên'] : ''; }
  function hnDefWho(u, pb, self) {
    var L = hnStaff(u, self), R = refDate(), pick = function (re, inPb) { return L.filter(function (e) { return re.test(norm(hnPos(e))) && (!inPb || e['Phòng ban'] === inPb); })[0]; };
    var w = {}, x;
    x = pick(/hanh chinh|nhan su/) || L.filter(function (e) { return /nhan su|hanh chinh/.test(norm(e['Phòng ban'])); })[0]; if (x) w.hcns = x['Mã NV'];
    x = pick(/ke toan truong/) || pick(/ke toan/); if (x) w.kt = x['Mã NV'];
    x = L.filter(function (e) { return /^giam doc/.test(norm(hnPos(e))); })[0] || pick(/giam doc/); if (x) w.bgd = x['Mã NV'];
    var pr = (u.data.PB || []).filter(function (r) { return r['Tên phòng ban'] === pb; })[0], hid = pr ? pr['Mã NV trưởng bộ phận'] : '';
    if (hid && hid !== self && hnNvOf(u, hid)) w.tbp = hid; else { x = pick(/truong|quan ly|to truong|phu trach/, pb); if (x) w.tbp = x['Mã NV']; }
    var mates = L.filter(function (e) { return e['Phòng ban'] === pb && e['Mã NV'] !== w.tbp && (tdDiff(String(e['Ngày vào làm'] || '').slice(0, 10), R) || 0) >= 180; });
    // 12/11 12:33 anh: người đồng hành có thể khác trưởng bộ phận – ưu tiên đồng nghiệp cùng bộ phận (làm ≥ 6 tháng, rồi bất kỳ), không có mới lấy trưởng bộ phận
    if (!mates.length) mates = L.filter(function (e) { return e['Phòng ban'] === pb && e['Mã NV'] !== w.tbp && e['Mã NV'] !== self; });
    w.kc = mates[0] ? mates[0]['Mã NV'] : (w.tbp || '');
    w.it = w.hcns || '';
    return w;
  }
  function hnRolesUsed(steps) { var o = {}; (steps || []).forEach(function (s) { o[s.own] = 1; (s.own2 || []).forEach(function (r) { o[r] = 1; }); }); return HN_ROLE.map(function (r) { return r[0]; }).filter(function (r) { return o[r] && r !== 'nv'; }); }
  function hnWhoOf(u, o, r) { return r === 'nv' ? o.name : hnName(u, (o.who || {})[r]); }
  function hnWhoChips(u, o, max) {
    var rs = hnRolesUsed(o.steps); if (max) { var pri = ['hcns', 'tbp', 'kc']; rs = rs.filter(function (r) { return pri.indexOf(r) >= 0; }).concat(rs.filter(function (r) { return pri.indexOf(r) < 0; })); }
    var rest = max ? rs.slice(max).map(function (r) { return HN_RN[r] + ': ' + (hnWhoOf(u, o, r) || 'chưa chỉ định'); }).join('\n') : '';
    var out = rs.map(function (r) { var n = hnWhoOf(u, o, r); return '<span class="hn-wc' + (n ? '' : ' miss') + '" title="' + esc(HN_RN[r]) + '"><i>' + esc(HN_RS[r]) + '</i>' + (n ? esc(n) : 'chưa chỉ định') + '</span>'; });
    return '<span class="hn-wcs">' + (max && out.length > max ? out.slice(0, max).join('') + '<span class="hn-wc more" title="' + esc(rest) + '">+' + (out.length - max) + ' vai trò</span>' : out.join('')) + '</span>';
  }
  function hnWhoSel(u, self, r, val, attrs) { var L = hnStaff(u, self); return '<select class="input hn-wsel" data-r="' + r + '"' + (attrs || '') + '><option value="">— Chưa chỉ định —</option>' + L.map(function (e) { return opt(e['Mã NV'], e['Họ và tên'] + ' – ' + hnPos(e), val || ''); }).join('') + '</select>'; }
  function hnNvOf(u, id) { return (u.data.NV || []).filter(function (e) { return e['Mã NV'] === id; })[0]; }
  function hnNewOb(u, p) {
    var h = hnOf(u), mx = 0; h.ob.forEach(function (o) { var m = /^HN(\d+)$/.exec(o.id); if (m) mx = Math.max(mx, +m[1]); });
    var j = h.jr.filter(function (x) { return x.gid === p.gid; })[0];
    var o = { id: 'HN' + p2(mx + 1), nv: p.nv || null, cid: p.cid || null, name: p.name, pb: p.pb || '', cd: p.cd || '', start: p.start, pe: p.pe || '', pd: p.pe ? tdDiff(p.start, p.pe) + 1 : 0, who: p.who || hnDefWho(u, p.pb, p.nv), gid: j ? j.gid : '', jname: j ? j.name : '', st: 'run', at: refDate(), steps: JSON.parse(JSON.stringify(j ? j.steps : [])).map(function (s) { s.x = 'todo'; return s; }) };
    o.steps.forEach(function (s) { if (!o.pe && (s.ph === 'end' || s.ph === 'off')) s.x = 'na'; });
    h.ob.push(o); return o;
  }
  // Dữ liệu mẫu: Edu – Đặng Minh Khoa (giảng viên, đang thử việc) + Nguyễn Minh Thư (ứng viên đã nhận việc, sắp đi làm); Health – Phan Gia Bảo (công nhân, hết thử việc hôm nay)
  function hnSeedOb(u) {
    var R = refDate(), specs = [];
    if (/edu/i.test(u.name)) {
      specs.push({ nv: 'DS007', pe0: '2026-12-03', late: ['b18'], skip: { b16: 'Bộ phận giảng viên giới thiệu trong buổi họp chuyên môn thứ Hai' }, note: { b15: 'Dự giờ 3 buổi lớp kỹ năng mềm trước khi đứng lớp', b12: 'Mục tiêu: soạn xong giáo án 4 buổi đầu' }, lateDone: { b13: 2 } });
      try { var c = tdOf(u).cd.filter(function (c) { return c.stage === 'hired' && !c.nvId && c.offer && c.offer.start; })[0]; if (c) { var r = tdReq(u, c.rq) || {}; specs.push({ cid: c.id, name: c.name, pb: r.pb || '', cd: r.cd || r.pos || '', start: c.offer.start, pe: tdAdd(c.offer.start, (+c.offer.probDays || 60) - 1), late: [], note: { b01: 'Đã gọi xác nhận, người mới đồng ý đi làm đúng ngày' } }); } } catch (e) { }
    } else specs.push({ nv: 'SG005', pe0: '2026-11-12', late: [], lateDone: { b19: 1 }, note: { b13: 'Đã phát đồ bảo hộ: găng tay, khẩu trang, giày', b19: 'Tổ trưởng đề xuất Đạt – thao tác nhanh, đúng quy trình vệ sinh' } });
    specs.forEach(function (sp) {
      var e = sp.nv ? hnNvOf(u, sp.nv) : null; if (sp.nv && !e) return;
      var p = { gid: 'HT01', nv: sp.nv, cid: sp.cid, name: e ? e['Họ và tên'] : sp.name, pb: e ? e['Phòng ban'] : sp.pb, cd: e ? hnPos(e) : sp.cd, start: e ? String(e['Ngày vào làm']).slice(0, 10) : sp.start, pe: e ? (hnProbEnd(u, sp.nv) || sp.pe0) : sp.pe };
      p.who = hnDefWho(u, p.pb, sp.nv); var o = hnNewOb(u, p); o.at = tdAdd(o.start, -7);
      o.steps.forEach(function (s) {
        if (s.x === 'na') return; var due = hnDue(o, s);
        if (sp.note && sp.note[s.id]) s.note = sp.note[s.id];
        if (sp.skip && sp.skip[s.id] && due < R) { s.x = 'skip'; s.dAt = due; s.why = sp.skip[s.id]; return; }
        if (due && due < R && sp.late.indexOf(s.id) < 0) { s.x = 'done'; s.dAt = tdAdd(due, (sp.lateDone && sp.lateDone[s.id]) || 0); if (s.dAt > R) s.dAt = R; }
      });
    });
  }
  function hnObAll(us) { var out = []; (us || selUnits()).forEach(function (u) { hnOf(u).ob.forEach(function (o) { if (o.cid && !o.nv) { try { var c = tdCand(u, o.cid); if (c && c.nvId) { o.nv = c.nvId; } } catch (e) { } } out.push({ u: u, o: o }); }); }); return out; }
  // Người mới chưa bắt đầu hội nhập: nhân sự vào làm trong 30 ngày qua / sắp vào + ứng viên đã nhận việc chưa thành nhân sự
  function hnSuggest(us) {
    var R = refDate(), out = [];
    us.forEach(function (u) {
      var h = hnOf(u), hasNv = {}, hasC = {}; h.ob.forEach(function (o) { if (o.nv) hasNv[o.nv] = 1; if (o.cid) hasC[o.cid] = 1; });
      (u.data.NV || []).forEach(function (e) { var st = HR.staffState(e, R); if (st === 'left' || hasNv[e['Mã NV']]) return; var v = String(e['Ngày vào làm'] || '').slice(0, 10), dd = v ? tdDiff(R, v) : null; if (dd === null || dd < -30 || dd > 45) return; out.push({ u: u, nv: e['Mã NV'], name: e['Họ và tên'], pb: e['Phòng ban'], cd: hnPos(e), start: v, dd: dd }); });
      try { tdOf(u).cd.forEach(function (c) { if (c.stage !== 'hired' || c.nvId || hasC[c.id] || !c.offer || !c.offer.start) return; var dd = tdDiff(R, c.offer.start); if (dd === null || dd < -30) return; var r = tdReq(u, c.rq) || {}; out.push({ u: u, cid: c.id, name: c.name, pb: r.pb || '', cd: r.cd || r.pos || '', start: c.offer.start, dd: dd, pd: c.offer.probDays }); }); } catch (e) { }
    });
    return out.sort(function (a, b) { return b.dd - a.dd; });
  }
  function hnRel(R, due) { var d = tdDiff(R, due); return d === null ? '' : d === 0 ? 'hôm nay' : d === 1 ? 'ngày mai' : d === -1 ? 'hôm qua' : d < 0 ? 'quá ' + (-d) + ' ngày' : 'còn ' + d + ' ngày'; }
  function hnDayTxt(R, o) { var d = tdDiff(o.start, R); return d < 0 ? 'còn ' + (-d) + ' ngày nữa đi làm' : 'ngày thứ ' + (d + 1); }
  var HN_OST = { run: 'Đang hội nhập', done: 'Đã hoàn tất', stop: 'Tạm dừng' };

  PAGES.hntiendo = function () {
    var f = ps('hnt', { open: null, st: 'run', co: '', view: 'list', late: false }), R = refDate();
    if (f.open) { var u0 = unitById(f.open.u), o0 = u0 && hnOf(u0).ob.filter(function (o) { return o.id === f.open.id; })[0]; if (o0) return hnObPage(u0, o0, f); f.open = null; }
    var us = selUnits(), all = hnObAll(us), multi = us.length > 1;
    if (f.co && !us.some(function (u) { return u.id === f.co; })) f.co = '';
    var stOf = {}; all.forEach(function (x) { stOf[x.u.id + x.o.id] = hnObStat(x.o, R); });
    var run = all.filter(function (x) { return x.o.st === 'run'; }), latePp = run.filter(function (x) { return stOf[x.u.id + x.o.id].late.length; }), lateN = latePp.reduce(function (a, x) { return a + stOf[x.u.id + x.o.id].late.length; }, 0);
    var prep = hnSuggest(us);
    var head = '<div class="page-head"><div><h1>Hội nhập nhân sự mới</h1><p class="muted">Người mới đi theo hành trình đã thiết lập, mỗi vai trò có người phụ trách cụ thể. Việc của ai hiện trên app của người đó; ở đây phòng nhân sự theo dõi tiến độ chung.</p></div><div class="link-row" style="margin:0"><button class="btn" data-go="hnlotrinh">' + ic('hnlotrinh', 15) + 'Thiết lập hành trình</button></div></div>';
    var stats = tdStats('hnt-k', f.late ? 'late' : '', [
      { id: 'run', n: run.length, label: 'người mới đang hội nhập', icon: 'hntiendo', tip: 'Xem người đang hội nhập' },
      { id: 'late', n: latePp.length, label: 'người có việc quá hạn', sub: lateN ? lateN + ' việc quá hạn' : 'không có việc trễ', icon: 'info', tone: latePp.length ? 'bad' : '', tip: 'Lọc người có việc quá hạn' },
      { id: 'prep', n: prep.length, label: 'nhân sự chuẩn bị hội nhập', sub: 'đã nhận việc, chưa bắt đầu', icon: 'td_user', tone: prep.length ? 'warn' : '', tip: 'Xem danh sách chuẩn bị hội nhập' },
      { id: 'done', n: all.filter(function (x) { return x.o.st === 'done'; }).length, label: 'đã hoàn tất hội nhập', icon: 'check', tip: 'Xem người đã hoàn tất' }]);
    // 1) Người mới đang hội nhập – dạng danh sách hoặc thẻ
    var list = all.filter(function (x) { return (!f.co || x.u.id === f.co) && (f.st === 'all' || x.o.st === f.st) && (!f.late || stOf[x.u.id + x.o.id].late.length); });
    list.sort(function (a, b) { return a.o.start < b.o.start ? 1 : -1; });
    var cnt = function (st) { return all.filter(function (x) { return (!f.co || x.u.id === f.co) && (st === 'all' || x.o.st === st); }).length; };
    var fbox = tdFbox([multi ? { label: 'Công ty', act: 'hnt-co', cur: f.co, items: [['', 'Tất cả', all.length]].concat(us.map(function (u) { return [u.id, shortUnit(u.name), all.filter(function (x) { return x.u === u; }).length]; })) } : null,
      { label: 'Trạng thái', act: 'hnt-st', cur: f.st, items: [['run', 'Đang hội nhập', cnt('run')], ['done', 'Đã hoàn tất', cnt('done')], ['stop', 'Tạm dừng', cnt('stop')], ['all', 'Tất cả', cnt('all')]] }]);
    var vt = '<div class="hn-tabs" role="tablist"><button role="tab" class="' + (f.view !== 'card' ? 'on' : '') + '" data-act="hnt-view" data-id="list" aria-selected="' + (f.view !== 'card') + '">' + ic('hn_tbl', 16) + 'Danh sách</button><button role="tab" class="' + (f.view === 'card' ? 'on' : '') + '" data-act="hnt-view" data-id="card" aria-selected="' + (f.view === 'card') + '">' + ic('td_cols', 16) + 'Thẻ</button></div>';
    var body;
    if (!list.length) body = '<div class="hn-empty"><h2>Chưa có người mới ở mục này</h2><p class="muted">' + (prep.length ? 'Bấm “Bắt đầu” ở danh sách Chuẩn bị hội nhập bên dưới.' : 'Khi ứng viên đồng ý nhận việc hoặc có nhân sự mới vào làm, người đó hiện ở danh sách Chuẩn bị hội nhập.') + '</p></div>';
    else if (f.view === 'card') body = '<div class="hn-obs">' + list.map(function (x) { return hnObCard(x.u, x.o, R, multi); }).join('') + '</div>';
    else body = '<div class="hn-gw">' + hnGridOpen('dsnm2', [['Người mới', 220, ''], ['Thời gian', 170, ''], ['Người phụ trách', 230, ''], ['Tình trạng', 170, ''], ['Việc tiếp theo', 230, ''], ['', 132, 'c']], 'hn-obt') + '<tbody>' + list.map(function (x) {
      var u = x.u, o = x.o, st = stOf[u.id + o.id], n = st.next, curTxt = o.st !== 'run' ? '<span class="tag ' + (o.st === 'done' ? 'tag-ok' : 'tag-mute') + '">' + HN_OST[o.st] + '</span>' : n ? '<b>' + esc(HN_PHN[st.cur]) + '</b>' : '<b>Đã xong mọi việc</b>';
      return '<tr' + (st.late.length && o.st === 'run' ? ' class="late"' : '') + '><td><div class="hn-pp"><span class="av">' + esc(initials(o.name)) + '</span><div><a href="#" class="plink td-strong" data-act="hnt-open" data-u="' + u.id + '" data-id="' + esc(o.id) + '">' + esc(o.name) + '</a><small class="td-sub">' + esc(o.cd) + ' · ' + esc(o.pb) + (multi ? ' · ' + esc(shortUnit(u.name)) : '') + '</small></div></div></td>' +
        '<td class="hn-due"><b>' + vn(o.start) + (o.pe ? ' → ' + vn(o.pe) : '') + '</b><small>' + hnDayTxt(R, o) + ' · ' + (o.pe ? 'thử việc ' + (o.pd || (tdDiff(o.start, o.pe) + 1)) + ' ngày, ' + (o.pe < R ? 'đã hết' : hnRel(R, o.pe)) : 'không thử việc') + '</small></td>' +
        '<td>' + hnWhoChips(u, o, 3) + '</td>' +
        '<td>' + curTxt + '<div class="hn-mini">' + hnSegHtml(st) + '</div><small class="td-sub">' + st.pct + '% · ' + st.done + '/' + st.all + ' việc' + (st.late.length && o.st === 'run' ? ' · <b style="color:var(--danger)">' + st.late.length + ' quá hạn</b>' : '') + '</small></td>' +
        '<td>' + (o.st === 'run' && n ? '<b class="td-strong' + (n.due && n.due < R ? '" style="color:var(--danger)' : '') + '">' + esc(n.s.title) + '</b><small class="td-sub">' + (n.due ? vn(n.due) + ' · ' + hnRel(R, n.due) : '') + (hnWhoOf(u, o, n.s.own) ? ' · ' + esc(hnWhoOf(u, o, n.s.own)) : ' · ' + esc(HN_RN[n.s.own] || '')) + '</small>' : '<span class="faint">—</span>') + '</td>' +
        '<td class="c"><button class="btn btn-sm" data-act="hnt-open" data-u="' + u.id + '" data-id="' + esc(o.id) + '">Xem checklist</button></td></tr>';
    }).join('') + '</tbody></table></div>' + hnGridFoot('dsnm2');
    var sec1 = '<div class="hn-sech"><h2 class="hn-h2">Người mới đang hội nhập</h2>' + (f.late ? tdFilterChip('Đang lọc: người có việc quá hạn', 'hnt-k') : '') + '<span class="sp"></span>' + vt + '</div>' + fbox + body;
    // 2) Chuẩn bị hội nhập: đã nhận việc, chưa bắt đầu
    var sec2 = '<div class="hn-sech" id="hnPrep"><h2 class="hn-h2">Chuẩn bị hội nhập <small>' + prep.length + ' người · đã xác nhận nhận việc, chưa bắt đầu hội nhập</small></h2></div>' +
      (prep.length ? '<div class="hn-gw">' + hnGridOpen(multi ? 'cbhn2' : 'cbhn1', [['Người mới', 280, '']].concat(multi ? [['Công ty', 140, '']] : []).concat([['Ngày đi làm', 140, ''], ['Nguồn', 190, ''], ['Hành trình sẽ áp dụng', 220, ''], ['', 104, 'c']]), 'hn-obt') + '<tbody>' + prep.map(function (x) {
        var j = hnMatch(x.u, x.pb, x.cd)[0];
        return '<tr><td><div class="hn-pp"><span class="av">' + esc(initials(x.name)) + '</span><div><b class="td-strong">' + esc(x.name) + '</b><small class="td-sub">' + esc(x.cd || '') + ' · ' + esc(x.pb || '') + '</small></div></div></td>' + (multi ? '<td>' + esc(shortUnit(x.u.name)) + '</td>' : '') +
          '<td class="hn-due"><b>' + vn(x.start) + '</b><small>' + (x.dd > 0 ? 'còn ' + x.dd + ' ngày' : x.dd === 0 ? 'hôm nay' : 'đã đi làm ' + (-x.dd) + ' ngày') + '</small></td>' +
          '<td>' + (x.cid ? '<span class="tag tag-info">Tuyển dụng – đã nhận việc</span>' : '<span class="tag tag-mute">Hồ sơ nhân sự mới</span>') + '</td>' +
          '<td>' + (j ? esc(j.name) : '<span style="color:var(--danger)">Chưa có hành trình khớp</span>') + '</td>' +
          '<td class="c"><button class="btn btn-sm btn-primary" data-act="hnt-start" data-u="' + x.u.id + '"' + (x.nv ? ' data-nv="' + esc(x.nv) + '"' : ' data-cid="' + esc(x.cid) + '"') + '>Bắt đầu</button></td></tr>';
      }).join('') + '</tbody></table></div>' + hnGridFoot(multi ? 'cbhn2' : 'cbhn1') : '<div class="hn-empty"><p class="muted" style="margin:0">Chưa có ai. Ứng viên đồng ý nhận việc ở Tuyển dụng hoặc nhân sự mới vào làm (30 ngày gần đây) sẽ hiện ở đây.</p></div>');
    return head + '<div class="notice" style="margin-bottom:14px">' + ic('info') + '<div>Người mới thấy hành trình và tự xác nhận việc của mình trên <b>app nhân viên</b> (nút “Hoàn thiện hành trình hội nhập” ở màn hình chính); phần mềm tự cập nhật về đây. Việc của người phụ trách (nhân sự, trưởng bộ phận, người đồng hành) hiện trên app của họ – sẽ có ở bản sau.</div></div>' + stats + sec1 + sec2;
  };
  function hnSegHtml(st) { return '<span class="hn-seg">' + HN_PH.map(function (p) { var b = st.byPh[p[0]]; if (!b.n) return '<i class="na" title="' + p[1] + ': không áp dụng"></i>'; var cls = b.done === b.n ? 'ok' : b.late ? 'late' : st.cur === p[0] ? 'cur' : ''; return '<i class="' + cls + '" title="' + p[1] + ': ' + b.done + '/' + b.n + ' việc' + (b.late ? ' · ' + b.late + ' quá hạn' : '') + '"><b style="width:' + Math.round(b.done * 100 / b.n) + '%"></b></i>'; }).join('') + '</span>'; }
  function hnObCard(u, o, R, multi) {
    var st = hnObStat(o, R), n = st.next, whoN = n ? hnWhoOf(u, o, n.s.own) : '';
    var seg = HN_PH.map(function (p) { var b = st.byPh[p[0]]; if (!b.n) return '<i class="na" title="' + p[1] + ': không áp dụng"></i>'; var cls = b.done === b.n ? 'ok' : b.late ? 'late' : st.cur === p[0] ? 'cur' : ''; return '<i class="' + cls + '" title="' + p[1] + ': ' + b.done + '/' + b.n + ' việc' + (b.late ? ' · ' + b.late + ' quá hạn' : '') + '"><b style="width:' + Math.round(b.done * 100 / b.n) + '%"></b></i>'; }).join('');
    return '<div class="hn-ob' + (st.late.length && o.st === 'run' ? ' late' : '') + '"><div class="hn-ob-h"><span class="av">' + esc(initials(o.name)) + '</span><div class="grow"><a href="#" class="plink" data-act="hnt-open" data-u="' + u.id + '" data-id="' + esc(o.id) + '"><b>' + esc(o.name) + '</b></a><small>' + esc(o.cd) + ' · ' + esc(o.pb) + (multi ? ' · ' + esc(shortUnit(u.name)) : '') + '</small></div>' + (o.st !== 'run' ? '<span class="tag ' + (o.st === 'done' ? 'tag-ok' : 'tag-mute') + '">' + HN_OST[o.st] + '</span>' : st.late.length ? '<span class="tag tag-bad">' + st.late.length + ' việc quá hạn</span>' : '<span class="tag tag-ok">Đúng tiến độ</span>') + '</div>' +
      '<div class="hn-ob-k"><span>Vào làm <b>' + vn(o.start) + '</b><small>' + hnDayTxt(R, o) + '</small></span><span>Hết thử việc <b>' + (o.pe ? vn(o.pe) : '—') + '</b><small>' + (o.pe ? hnRel(R, o.pe) : 'không thử việc') + '</small></span><span>Hoàn thành <b>' + st.pct + '%</b><small>' + st.done + '/' + st.all + ' việc</small></span></div>' +
      '<div><span class="hn-lbl">Người phụ trách</span>' + hnWhoChips(u, o) + '</div><div class="hn-seg">' + seg + '</div><div class="hn-seg-l">' + HN_PH.map(function (p) { return '<span' + (st.cur === p[0] ? ' class="on"' : '') + '>' + p[1].replace('Trong thời gian ', '').replace(' – chào đón', '') + '</span>'; }).join('') + '</div>' +
      (o.st === 'run' && n ? '<div class="hn-ob-n' + (n.due && n.due < R ? ' late' : '') + '"><span>Việc tiếp theo</span><b>' + esc(n.s.title) + '</b><small>' + (n.due ? 'hạn ' + vn(n.due) + ' · ' + hnRel(R, n.due) + ' · ' : '') + esc(whoN || HN_RN[n.s.own] || '') + '</small></div>' : o.st === 'run' ? '<div class="hn-ob-n ok"><b>Đã xong mọi việc</b><small>Bấm “Kết thúc hội nhập” trong chi tiết để chuyển sang Đã hoàn tất</small></div>' : '') +
      '<div class="hn-ob-f"><span class="faint" style="font-size:12px">' + esc(o.jname || '') + '</span><button class="btn btn-sm" data-act="hnt-open" data-u="' + u.id + '" data-id="' + esc(o.id) + '">Xem checklist' + ic('td_arrow', 14) + '</button></div></div>';
  }
  function hnObPage(u, o, f) {
    var R = refDate(), st = hnObStat(o, R), role = f.role || '', multi = selUnits().length > 1;
    var nvBtn = o.nv ? '<button class="btn btn-sm" data-act="profile" data-u="' + u.id + '" data-id="' + esc(o.nv) + '">' + ic('td_user', 14) + 'Mở hồ sơ nhân sự</button>' : '';
    var head = '<div class="page-head"><div><p style="margin:0 0 12px"><button class="hn-backbtn" data-act="hnt-back">' + ic('hn_back', 16) + 'Hội nhập nhân sự mới</button></p><h1>' + esc(o.name) + '</h1><p class="muted">' + esc(o.cd) + ' · ' + esc(o.pb) + (multi ? ' · ' + esc(shortUnit(u.name)) : '') + ' · Hành trình: ' + esc(o.jname || '—') + ' · Mã ' + esc(o.id) + '</p></div><div class="link-row" style="margin:0">' + nvBtn + '<button class="btn btn-sm" data-act="hnt-edit">' + ic('td_cal', 14) + 'Sửa ngày</button><button class="btn btn-sm" data-act="hnt-print">' + ic('td_print', 14) + 'In checklist</button>' +
      (o.st === 'run' ? '<button class="btn btn-sm" data-act="hnt-status" data-id="stop">Tạm dừng</button>' + (st.todo.length ? '' : '<button class="btn btn-sm btn-primary" data-act="hnt-status" data-id="done">' + ic('check', 14) + 'Kết thúc hội nhập</button>') : '<button class="btn btn-sm btn-primary" data-act="hnt-status" data-id="run">Tiếp tục hội nhập</button>') + '<button class="btn btn-sm" data-act="hnt-del" title="Xóa hồ sơ hội nhập">' + ic('td_trash', 14) + '</button></div></div>';
    var warn = '';
    if (!o.nv && o.cid) warn = '<div class="notice warn" style="margin-bottom:14px">' + ic('info') + '<div>Người mới <b>chưa có hồ sơ nhân sự</b> (đang là ứng viên đã nhận việc). Khi người mới đến, vào Tuyển dụng → Kết quả phỏng vấn, bấm “Chuyển thành nhân sự” – hồ sơ hội nhập tự nối với hồ sơ nhân sự. <a href="#" class="plink" data-go="tdmoi">Mở Kết quả phỏng vấn</a></div></div>';
    if (o.st !== 'run') warn += '<div class="notice" style="margin-bottom:14px">' + ic('info') + '<div>Hồ sơ hội nhập đang ở trạng thái <b>' + HN_OST[o.st] + '</b>' + (o.endAt ? ' từ ' + vn(o.endAt) : '') + '. Việc của người này không tính vào quá hạn.</div></div>';
    var kpi = '<div class="hn-kpi"><div><small>Vào làm</small><b>' + vn(o.start) + '</b><span>' + hnDayTxt(R, o) + '</span></div><div><small>Hết thử việc</small><b>' + (o.pe ? vn(o.pe) : '—') + '</b><span>' + (o.pe ? hnRel(R, o.pe) : 'không thử việc') + '</span></div><div><small>Hoàn thành</small><b>' + st.pct + '%</b><span>' + st.done + '/' + st.all + ' việc</span></div><div class="' + (st.late.length ? 'bad' : '') + '"><small>Quá hạn</small><b>' + st.late.length + '</b><span>' + (st.late.length ? 'cần xử lý ngay' : 'không có') + '</span></div><div><small>7 ngày tới</small><b>' + st.soon.length + '</b><span>việc đến hạn</span></div></div>';
    var ph = '<div class="hn-phs">' + HN_PH.map(function (p, i) { var b = st.byPh[p[0]]; var cls = !b.n ? 'na' : b.done === b.n ? 'ok' : b.late ? 'late' : st.cur === p[0] ? 'cur' : ''; return '<div class="' + cls + '"><span class="n">' + (cls === 'ok' ? '✓' : i + 1) + '</span><b>' + p[1] + '</b><small>' + (b.n ? b.done + '/' + b.n + ' việc' + (b.late ? ' · ' + b.late + ' quá hạn' : '') : 'Không áp dụng') + '</small></div>'; }).join('') + '</div>';
    var cnt = {}; o.steps.forEach(function (s) { if (s.x === 'na') return; cnt[s.own] = (cnt[s.own] || 0) + 1; (s.own2 || []).forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; }); });
    var rolePills = tdPills('hnt-orole', role, [['', 'Tất cả', st.all]].concat(HN_ROLE.filter(function (r) { return cnt[r[0]]; }).map(function (r) { return [r[0], r[1], cnt[r[0]]]; })));
    var L = hnObSteps(o), OC = [['', 40, 's0 c'], ['Hạn', 100, 's1'], ['Việc cần làm', 230, 's2'], ['Cần chuẩn bị', 170, ''], ['Người phụ trách', 145, ''], ['Phối hợp', 130, ''], ['Trạng thái', 118, ''], ['Ghi chú', 140, ''], ['', 84, 'c']];
    var rows = HN_PH.map(function (p) {
      var ss = L.filter(function (x) { return x.s.ph === p[0]; }); if (!ss.length) return '';
      return '<tr class="hn-tph"><td colspan="' + OC.length + '"><span><b>' + p[1] + '</b><small>' + p[2] + ' · ' + ss.length + ' việc</small></span></td></tr>' + ss.map(function (x) {
        var s = x.s, done = s.x === 'done', skip = s.x === 'skip', na = s.x === 'na', late = !done && !skip && !na && x.due && x.due < R, dim = role && s.own !== role && (s.own2 || []).indexOf(role) < 0;
        var stt = na ? '<span class="faint">Không áp dụng</span>' : done ? '<span class="hn-ok">✓ Xong ' + vn(s.dAt) + (x.due && s.dAt > x.due ? '<small>trễ ' + tdDiff(x.due, s.dAt) + ' ngày</small>' : '') + '</span>' : skip ? '<span class="hn-skip">Bỏ qua<small>' + esc(s.why || '') + '</small></span>' : late ? '<span class="hn-late">Quá hạn ' + (-tdDiff(R, x.due)) + ' ngày</span>' : '<span class="faint">Chưa làm</span>';
        var nm = hnWhoOf(u, o, s.own);
        return '<tr data-sid="' + esc(s.id) + '" class="' + (done || skip || na ? 'fin ' : '') + (late ? 'late ' : '') + (dim ? 'dim' : '') + '">' +
          '<td class="s0 c">' + (na ? '' : '<button class="hn-ck' + (done ? ' on' : '') + '" data-act="hnt-done" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '" title="' + (done ? 'Bỏ đánh dấu' : 'Đánh dấu đã xong') + '"' + (skip ? ' disabled' : '') + '>' + (done ? '✓' : '') + '</button>') + '</td>' +
          '<td class="s1 hn-due">' + (x.due ? '<b>' + vn(x.due) + '</b>' + (s.ph === 'd1' && s.t1 ? '<b class="hn-hr">' + esc(s.t1) + (s.t2 ? '–' + esc(s.t2) : '') + '</b>' : '') + '<small>' + (done || skip || na ? (s.ph === 'd1' ? 'Ngày đầu tiên' : esc(hnWhen(s))) : hnRel(R, x.due)) + '</small>' : '<span class="faint">—</span>') + '</td>' +
          '<td class="s2"><div class="hn-tt">' + esc(s.title) + hnInfoBtn(u, o, s) + '</div><div class="hn-tags">' + (s.req ? '<span class="tag tag-warn">Bắt buộc</span>' : '') + (s.nv ? '<span class="tag tag-info">Người mới cùng làm</span>' : '') + '</div>' + (s.go ? '<div class="hn-meta"><span>' + ic('td_arrow') + '<a href="#" data-go="' + esc(s.go) + '">Mở: ' + esc(HN_GON[s.go] || s.go) + '</a></span></div>' : '') + '</td>' +
          '<td class="hn-prep">' + esc(s.doc || '') + '</td>' +
          '<td>' + hnRoleTag(s.own) + '<small class="hn-wn' + (nm ? '' : ' miss') + '">' + esc(nm || 'chưa chỉ định') + '</small></td>' +
          '<td>' + (s.own2 || []).map(function (r) { var n2 = hnWhoOf(u, o, r); return '<div class="hn-co2">' + hnRoleTag(r, true) + '<small>' + esc(n2 || 'chưa chỉ định') + '</small></div>'; }).join('') + '</td>' +
          '<td>' + stt + '</td>' +
          '<td><textarea class="hn-note" rows="1" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '" placeholder="Ghi chú…" aria-label="Ghi chú">' + esc(s.note || '') + '</textarea></td>' +
          '<td class="c">' + (na ? '' : done || skip ? '<button class="btn btn-sm" data-act="hnt-undo" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '" title="Đưa về chưa làm">Làm lại</button>' : s.req ? '<span class="faint" style="font-size:11.5px" title="Bước bắt buộc không bỏ qua được">Bắt buộc</span>' : '<button class="btn btn-sm" data-act="hnt-skip" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '">Bỏ qua</button>') + '</td></tr>';
      }).join('');
    }).join('');
    var rs = hnRolesUsed(o.steps);
    var whoBox = '<div class="card hn-whobox"><h3>' + ic('td_user', 17) + 'Người phụ trách cụ thể</h3><p class="muted">Hành trình đặt việc theo vai trò; chọn người cụ thể cho từng vai trò – việc của vai trò đó sẽ hiện trên app của người được chọn.</p><div class="hn-whog">' +
      rs.map(function (r) { return '<div class="field"><label>' + hnRoleTag(r) + '</label>' + hnWhoSel(u, o.nv, r, (o.who || {})[r], ' data-u="' + u.id + '" data-o="' + esc(o.id) + '"') + '</div>'; }).join('') +
      '<div class="field"><label>' + hnRoleTag('nv') + '</label><div class="input hn-self">' + esc(o.name) + '</div></div></div></div>';
    var dv = f.dview === 'card' ? 'card' : 'list';
    var vt = '<div class="hn-tabs" role="tablist"><button role="tab" class="' + (dv === 'list' ? 'on' : '') + '" data-act="hnt-dview" data-id="list" aria-selected="' + (dv === 'list') + '">' + ic('hn_tbl', 16) + 'Danh sách</button><button role="tab" class="' + (dv === 'card' ? 'on' : '') + '" data-act="hnt-dview" data-id="card" aria-selected="' + (dv === 'card') + '">' + ic('td_cols', 16) + 'Thẻ</button></div>';
    return head + warn + kpi + whoBox + ph + '<div class="hn-sum hn-sum2"><span class="td-flab" style="width:auto;padding:0 4px 0 0">Việc của</span>' + rolePills + '<span class="sp"></span>' + vt + '</div>' +
      (dv === 'card' ? hnObLanes(u, o, L, role, R) : '<div class="hn-gw">' + hnGridOpen('chitiet2', OC, 'hn-otbl') + '<tbody>' + rows + '</tbody></table></div>' + hnGridFoot('chitiet2'));
  }
  // Biểu tượng (i): bấm mở nội dung chi tiết của việc (nội dung, cần chuẩn bị, căn cứ, ghi chú)
  function hnInfoBtn(u, o, s) { return s.desc || s.law ? '<button class="hn-info" data-act="hnt-info" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '" title="Xem nội dung chi tiết" aria-label="Xem nội dung chi tiết">' + ic('info', 14) + '</button>' : ''; }
  // Popup (i) (anh 12/11 10:37): chỉ hiện thông tin KHÔNG có ở các cột của bảng – nội dung chi tiết và căn cứ pháp lý
  ACTS['hnt-info'] = function (a, id, e) {
    if (e) e.stopPropagation(); var x = hnObFind(a); if (!x) return; var s = x.s;
    var row = function (lab, val) { return val ? '<div class="hn-ip"><b>' + lab + '</b><div>' + val + '</div></div>' : ''; };
    modal(s.title, 'Nội dung chi tiết', '<div class="hn-ipop">' + row('Nội dung', esc(s.desc || '').replace(/\n/g, '<br>')) + row('Căn cứ', s.law ? '<span class="law">' + esc(s.law) + '</span>' : '') + '</div>', true);
  };
  ACTS['hnt-dview'] = function (a, id) { PS.hnt.dview = id === 'card' ? 'card' : 'list'; hnRerender(); };
  // Dạng Thẻ của chi tiết 1 người: 6 cột giai đoạn, mỗi việc 1 thẻ
  function hnObLanes(u, o, L, role, R) {
    return '<div class="hn-rm hn-orm">' + HN_PH.map(function (p, pi) {
      var ss = L.filter(function (x) { return x.s.ph === p[0]; }), dn = ss.filter(function (x) { return x.s.x === 'done' || x.s.x === 'skip'; }).length, na = ss.length && ss.every(function (x) { return x.s.x === 'na'; });
      return '<div class="hn-lane"><div class="hn-lane-h"><span class="hn-lane-n">' + (pi + 1) + '</span><div><b>' + p[1] + '</b><small>' + (na ? 'Không áp dụng' : dn + '/' + ss.length + ' việc') + '</small></div></div><div class="hn-lane-b">' +
        ss.map(function (x) {
          var s = x.s, done = s.x === 'done', skip = s.x === 'skip', nax = s.x === 'na', late = !done && !skip && !nax && x.due && x.due < R, dim = role && s.own !== role && (s.own2 || []).indexOf(role) < 0, nm = hnWhoOf(u, o, s.own);
          var st = nax ? '<span class="faint">Không áp dụng</span>' : done ? '<span class="hn-ok">✓ Xong ' + vn(s.dAt) + '</span>' : skip ? '<span class="hn-skip">Bỏ qua</span>' : late ? '<span class="hn-late">Quá hạn ' + (-tdDiff(R, x.due)) + ' ngày</span>' : '<span class="faint">' + (x.due ? hnRel(R, x.due) : '') + '</span>';
          return '<div class="hn-oc' + (done || skip || nax ? ' fin' : '') + (late ? ' late' : '') + (dim ? ' dim' : '') + '" data-sid="' + esc(s.id) + '"><div class="hn-oc-t">' + (nax ? '' : '<button class="hn-ck' + (done ? ' on' : '') + '" data-act="hnt-done" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '" title="' + (done ? 'Bỏ đánh dấu' : 'Đánh dấu đã xong') + '"' + (skip ? ' disabled' : '') + '>' + (done ? '✓' : '') + '</button>') +
            '<span class="hn-when">' + ic('hn_clock') + (x.due ? vn(x.due).slice(0, 5) : '—') + (s.ph === 'd1' && s.t1 ? ' · ' + esc(s.t1) : '') + '</span>' + hnInfoBtn(u, o, s) + '</div>' +
            '<div class="hn-cx-tt">' + esc(s.title) + (s.req ? ' <span class="tag tag-warn" style="font-size:10px">Bắt buộc</span>' : '') + '</div>' +
            '<div class="hn-oc-f">' + hnRoleTag(s.own, true) + '<small class="' + (nm ? '' : 'miss') + '">' + esc(nm || 'chưa chỉ định') + '</small></div><div class="hn-oc-s">' + st +
            (nax ? '' : done || skip ? '<button class="hn-lk" data-act="hnt-undo" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '">Làm lại</button>' : s.req ? '' : '<button class="hn-lk" data-act="hnt-skip" data-u="' + u.id + '" data-o="' + esc(o.id) + '" data-id="' + esc(s.id) + '">Bỏ qua</button>') + '</div>' +
            (s.note ? '<div class="hn-oc-n" title="Ghi chú">' + ic('hn_doc', 12) + esc(s.note) + '</div>' : '') + '</div>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  BINDS.hntiendo = function () {
    hnBindGrids();
    hnAppSync();
    $$('.hn-whobox .hn-wsel').forEach(function (el) { el.addEventListener('change', function () { var u = unitById(el.getAttribute('data-u')), o = u && hnOf(u).ob.filter(function (z) { return z.id === el.getAttribute('data-o'); })[0]; if (!o) return; o.who = o.who || {}; o.who[el.getAttribute('data-r')] = el.value; hnSave('Đổi người phụ trách ' + HN_RN[el.getAttribute('data-r')] + ' của ' + o.id + ' → ' + (hnName(u, el.value) || 'chưa chỉ định')); hnRerender(); }); });
    $$('textarea.hn-note').forEach(function (el) { hnAuto(el); el.addEventListener('input', function () { hnAuto(el); }); el.addEventListener('change', function () { var x = hnObFind(el); if (!x) return; x.s.note = el.value.trim(); hnSave('Ghi chú “' + x.s.title + '” – ' + x.o.name); }); });
  };
  function hnObFind(a) { var u = unitById(a.getAttribute('data-u')), o = u && hnOf(u).ob.filter(function (z) { return z.id === a.getAttribute('data-o'); })[0], s = o && o.steps.filter(function (z) { return z.id === a.getAttribute('data-id'); })[0]; return s ? { u: u, o: o, s: s } : null; }
  function hnObCur() { var f = PS.hnt; if (!f || !f.open) return null; var u = unitById(f.open.u), o = u && hnOf(u).ob.filter(function (z) { return z.id === f.open.id; })[0]; return o ? { u: u, o: o } : null; }
  ACTS['hnt-k'] = function (a, id) {
    var f = PS.hnt;
    if (id === 'prep') { var s = $('#hnPrep'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (id === 'late') { f.late = !f.late; f.st = 'run'; } else if (id === 'done') { f.late = false; f.st = 'done'; } else { f.late = false; f.st = 'run'; }
    hnRerender();
  };
  ACTS['hnt-view'] = function (a, id) { PS.hnt.view = id === 'card' ? 'card' : 'list'; hnRerender(); };
  ACTS['hnt-role'] = function (a, id) { PS.hnt.role = id || ''; hnRerender(); };
  ACTS['hnt-orole'] = function (a, id) { PS.hnt.role = id || ''; hnRerender(); };
  ACTS['hnt-co'] = function (a, id) { PS.hnt.co = id || ''; hnRerender(); };
  ACTS['hnt-st'] = function (a, id) { PS.hnt.st = id || 'run'; hnRerender(); };
  ACTS['hnt-more'] = function () { PS.hnt.more = true; hnRerender(); };
  ACTS['hnt-open'] = function (a, id) { var f = ps('hnt', { open: null, st: 'run', co: '', role: '', k: '' }); f.open = { u: a.getAttribute('data-u'), id: id }; f.role = ''; if (location.hash !== '#hntiendo') location.hash = 'hntiendo'; else render(); };
  ACTS['hnt-back'] = function () { PS.hnt.open = null; PS.hnt.role = ''; render(); };
  ACTS['hnt-done'] = function (a) { var x = hnObFind(a); if (!x) return; var was = x.s.x === 'done'; x.s.x = was ? 'todo' : 'done'; x.s.dAt = was ? '' : refDate(); hnSave((was ? 'Bỏ đánh dấu xong ' : 'Xong ') + x.o.id + '/' + x.s.id + ' "' + x.s.title + '" – ' + x.o.name); hnRerender(null, PS.hnt && PS.hnt.open ? x.s.id : null); };
  ACTS['hnt-undo'] = function (a) { var x = hnObFind(a); if (!x) return; x.s.x = 'todo'; x.s.dAt = ''; x.s.why = ''; hnSave('Đưa về chưa làm ' + x.o.id + '/' + x.s.id); hnRerender(null, x.s.id); };
  ACTS['hnt-skip'] = function (a) {
    var x = hnObFind(a); if (!x || x.s.req) return;
    var m = modal('Bỏ qua việc này?', x.s.title, '<div class="field"><label for="hnWhy">Lý do (để người sau hiểu vì sao không làm)</label><input class="input" id="hnWhy" placeholder="Ví dụ: Vị trí không cần đồ bảo hộ"></div><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Không</button><button class="btn btn-primary" id="hnWhyOk">Bỏ qua</button></div>', true);
    $('#hnWhyOk', m).addEventListener('click', function () { var w = $('#hnWhy', m).value.trim(); if (!w) { $('#hnWhy', m).classList.add('bad'); $('#hnWhy', m).focus(); return; } x.s.x = 'skip'; x.s.why = w; x.s.dAt = refDate(); hnSave('Bỏ qua ' + x.o.id + '/' + x.s.id + ': ' + w); m.close(); hnRerender(null, x.s.id); });
  };
  ACTS['hnt-status'] = function (a, id) { var c = hnObCur(); if (!c) return; c.o.st = id; c.o.endAt = id === 'run' ? '' : refDate(); hnSave(HN_OST[id] + ' – hồ sơ hội nhập ' + c.o.id + ' ' + c.o.name); render(); };
  ACTS['hnt-del'] = function () {
    var c = hnObCur(); if (!c) return;
    var m = modal('Xóa hồ sơ hội nhập?', c.o.name, '<p>Toàn bộ tiến độ, ghi chú của người này sẽ bị xóa. Hồ sơ nhân sự không bị ảnh hưởng. Nếu chỉ tạm ngừng, bấm “Tạm dừng”.</p><div class="link-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-close>Không xóa</button><button class="btn btn-danger" id="hnDelOb">Xóa</button></div>', true);
    $('#hnDelOb', m).addEventListener('click', function () { var h = hnOf(c.u); h.ob = h.ob.filter(function (z) { return z !== c.o; }); hnSave('Xóa hồ sơ hội nhập ' + c.o.id + ' ' + c.o.name); m.close(); PS.hnt.open = null; render(); });
  };
  function hnDboxIso(id, m) { var P = $$('#' + id + ' input', m); if (P.length !== 3) return ''; var d = +P[0].value, mo = +P[1].value, y = P[2].value; if (!d || !mo || y.length !== 4 || d > 31 || mo > 12) return ''; return y + '-' + p2(mo) + '-' + p2(d); }
  function hnProbHint() { return 'Tối đa theo BLLĐ 2019 Điều 25: 180 ngày (người quản lý doanh nghiệp) · 60 ngày (cao đẳng trở lên) · 30 ngày (trung cấp, công nhân kỹ thuật, nhân viên nghiệp vụ) · 6 ngày làm việc (công việc khác).'; }
  function hnProbBlock(pfx, start, pd, none) {
    return '<div class="td-g2" style="margin-top:10px">' + dbox(pfx + 'S', start, 'Ngày vào làm') + '<div class="field"><label for="' + pfx + 'D">Thời gian thử việc (ngày)</label><input class="input" id="' + pfx + 'D" inputmode="numeric" value="' + (none ? '' : (pd || '')) + '"' + (none ? ' disabled' : '') + ' placeholder="Ví dụ 60"></div></div>' +
      '<div class="hn-pe" id="' + pfx + 'E"></div><label class="hn-chk" style="margin-top:6px"><input type="checkbox" id="' + pfx + 'N"' + (none ? ' checked' : '') + '> Không thử việc (2 giai đoạn cuối không áp dụng)</label><div class="hint muted" style="font-size:11.5px;margin-top:4px">' + hnProbHint() + '</div>';
  }
  // Đọc + tự tính ngày hết thử việc = ngày vào làm + số ngày − 1
  function hnProbBind(m, pfx) {
    var D = $('#' + pfx + 'D', m), N = $('#' + pfx + 'N', m), E = $('#' + pfx + 'E', m);
    function val() { var s = hnDboxIso(pfx + 'S', m), none = N.checked, pd = parseInt(String(D.value).replace(/\D/g, ''), 10) || 0; return { s: s, none: none, pd: none ? 0 : pd, pe: !none && s && pd > 0 ? tdAdd(s, pd - 1) : '' }; }
    function show() { var v = val(); D.disabled = v.none; E.innerHTML = v.none ? '<span class="faint">Không thử việc</span>' : v.pe ? 'Hết thử việc: <b>' + vn(v.pe) + '</b> <span class="faint">(' + v.pd + ' ngày kể từ ngày vào làm)</span>' : '<span class="faint">Nhập ngày vào làm và số ngày thử việc để tự tính ngày hết thử việc</span>'; }
    $$('.dbox', m).forEach(bindDbox); D.addEventListener('input', show); N.addEventListener('change', show); $$('#' + pfx + 'S input', m).forEach(function (i) { i.addEventListener('input', show); i.addEventListener('change', show); }); show();
    return val;
  }
  ACTS['hnt-edit'] = function () {
    var c = hnObCur(); if (!c) return; var o = c.o;
    var m = modal('Sửa ngày vào làm, thời gian thử việc', o.name, hnProbBlock('hnE', o.start, o.pd || (o.pe ? tdDiff(o.start, o.pe) + 1 : ''), !o.pe) + '<p class="muted" style="font-size:12.5px;margin-top:10px">Hạn của các việc chưa xong tính lại theo ngày mới.</p><div class="link-row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="hnSOk">Lưu</button></div>', true);
    var get = hnProbBind(m, 'hnE');
    $('#hnSOk', m).addEventListener('click', function () {
      var v = get(); if (!v.s) { toast('Ngày vào làm chưa đúng', 'err'); return; } if (!v.none && !v.pd) { toast('Chưa nhập số ngày thử việc', 'err', 'Nhập số ngày, hoặc chọn Không thử việc.'); return; }
      o.start = v.s; o.pe = v.pe; o.pd = v.pd; o.steps.forEach(function (z) { if (z.ph === 'end' || z.ph === 'off') { if (!v.pe && z.x === 'todo') z.x = 'na'; else if (v.pe && z.x === 'na') z.x = 'todo'; } });
      hnSave('Sửa ngày hồ sơ hội nhập ' + o.id + ': vào làm ' + v.s + ', thử việc ' + (v.pd ? v.pd + ' ngày đến ' + v.pe : 'không')); m.close(); render();
    });
  };
  ACTS['hnt-print'] = function () {
    var c = hnObCur(); if (!c) return; var o = c.o, L = hnObSteps(o);
    var rows = HN_PH.map(function (p) { var ss = L.filter(function (x) { return x.s.ph === p[0] && x.s.x !== 'na'; }); if (!ss.length) return ''; return '<tr class="ph"><td colspan="5">' + esc(p[1]) + '</td></tr>' + ss.map(function (x) { var s = x.s; return '<tr><td class="c">' + (s.x === 'done' ? '☑' : s.x === 'skip' ? '–' : '☐') + '</td><td>' + (x.due ? vn(x.due) : '') + (s.ph === 'd1' && s.t1 ? '<div>' + esc(s.t1) + (s.t2 ? '–' + esc(s.t2) : '') + '</div>' : '') + '</td><td><b>' + esc(s.title) + '</b>' + (s.req ? ' <i>(bắt buộc)</i>' : '') + (s.desc ? '<div>' + esc(s.desc).replace(/\n/g, '<br>') + '</div>' : '') + (s.note ? '<div class="nt">Ghi chú: ' + esc(s.note) + '</div>' : '') + '</td><td>' + esc(HN_RN[s.own] || s.own) + '</td><td>' + (s.x === 'done' ? 'Xong ' + vn(s.dAt) : s.x === 'skip' ? 'Bỏ qua: ' + esc(s.why || '') : '') + '</td></tr>'; }).join(''); }).join('');
    var html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hội nhập – ' + esc(o.name) + '</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:24px}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 12px;color:#444}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px 7px;vertical-align:top;text-align:left}th{background:#eef3f0}tr.ph td{background:#1D6A50;color:#fff;font-weight:700}td.c{width:22px;text-align:center;font-size:15px}td div{color:#444;margin-top:3px}.nt{color:#1F5F8B!important}@media print{body{margin:10mm}button{display:none}}</style></head><body><button onclick="print()" style="float:right;padding:6px 14px">In</button>' +
      '<h1>Checklist hội nhập – ' + esc(o.name) + '</h1><p>' + esc(o.cd) + ' · ' + esc(o.pb) + ' · ' + esc(shortUnit(c.u.name)) + ' · Vào làm ' + vn(o.start) + (o.pe ? ' · Hết thử việc ' + vn(o.pe) : '') + ' · ' + esc(o.jname || '') + '</p><table><thead><tr><th></th><th style="width:90px">Hạn</th><th>Việc cần làm</th><th style="width:140px">Phụ trách</th><th style="width:140px">Kết quả</th></tr></thead><tbody>' + rows + '</tbody></table></body></html>';
    var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(html); w.document.close(); } else toast('Trình duyệt chặn cửa sổ mới', 'err', 'Cho phép mở cửa sổ bật lên rồi bấm lại.');
  };
  // Bắt đầu hội nhập (anh 12/11 09:37): chọn người mới → hành trình tự khớp → chỉ định người phụ trách cụ thể → nhập số ngày thử việc, tự tính ngày hết thử việc
  ACTS['hnt-start'] = function (a) {
    var us = selUnits(); if (!us.length) return;
    var u = a && a.getAttribute('data-u') ? unitById(a.getAttribute('data-u')) : us[0], R = refDate();
    var cur = { u: u, key: (a && (a.getAttribute('data-nv') || a.getAttribute('data-cid'))) || '', gid: '', who: null, pd: null, none: null, start: null };
    function people(u) {
      var L = hnSuggest([u]), ids = {}, has = {}; L.forEach(function (x) { ids[x.nv || x.cid] = 1; }); hnOf(u).ob.forEach(function (o) { if (o.nv) has[o.nv] = 1; });
      (u.data.NV || []).forEach(function (e) { if (ids[e['Mã NV']] || has[e['Mã NV']] || HR.staffState(e, R) === 'left') return; L.push({ u: u, nv: e['Mã NV'], name: e['Họ và tên'], pb: e['Phòng ban'], cd: hnPos(e), start: String(e['Ngày vào làm'] || '').slice(0, 10), old: true }); });
      return L;
    }
    var m = modal('Bắt đầu hội nhập', 'Chọn người mới, hành trình, người phụ trách và thời gian thử việc', '<div class="td-form" id="hnSt"></div>');
    function draw() {
      var L = people(cur.u); if (!cur.key && L.length) cur.key = L[0].nv || L[0].cid;
      var p = L.filter(function (x) { return (x.nv || x.cid) === cur.key; })[0] || L[0];
      var jr = hnOf(cur.u).jr.filter(function (j) { return j.on; }), auto = p ? hnMatch(cur.u, p.pb, p.cd) : [];
      var gid = cur.gid && jr.some(function (j) { return j.gid === cur.gid; }) ? cur.gid : auto[0] ? auto[0].gid : (jr[0] ? jr[0].gid : ''), J = jr.filter(function (j) { return j.gid === gid; })[0];
      if (!cur.who) cur.who = p ? hnDefWho(cur.u, p.pb, p.nv) : {};
      var pd0 = null, none0 = false;
      if (p && cur.pd === null) { if (p.cid) { pd0 = +p.pd || 60; } else { var pe0 = hnProbEnd(cur.u, p.nv); if (pe0) pd0 = tdDiff(p.start, pe0) + 1; else none0 = true; } }
      var start = cur.start || (p ? p.start : R), pd = cur.pd !== null ? cur.pd : pd0, none = cur.none !== null ? cur.none : none0;
      var newL = L.filter(function (x) { return !x.old; }), oldL = L.filter(function (x) { return x.old; });
      var rs = J ? hnRolesUsed(J.steps) : [];
      $('#hnSt', m).innerHTML = (us.length > 1 ? '<div class="field" style="max-width:340px"><label for="hnU">Công ty</label><select class="input" id="hnU">' + us.map(function (x) { return opt(x.id, shortUnit(x.name), cur.u.id); }).join('') + '</select></div>' : '') +
        '<h4>Người mới</h4><div class="field"><select class="input" id="hnP" aria-label="Người mới">' + (newL.length ? '<optgroup label="Chuẩn bị hội nhập (đã nhận việc)">' + newL.map(function (x) { return opt(x.nv || x.cid, x.name + ' – ' + (x.cd || x.pb) + (x.cid ? ' (ứng viên đã nhận việc)' : '') + ' · đi làm ' + vn(x.start), cur.key); }).join('') + '</optgroup>' : '') + (oldL.length ? '<optgroup label="Nhân sự khác">' + oldL.map(function (x) { return opt(x.nv, x.name + ' – ' + (x.cd || x.pb), cur.key); }).join('') + '</optgroup>' : '') + '</select></div>' +
        (p ? '<p class="muted" style="font-size:12.5px;margin:6px 0 0">' + esc(p.cd || '') + ' · ' + esc(p.pb || '') + (p.cid ? ' · thời gian thử việc lấy theo thư mời nhận việc' : p.nv && none0 ? ' · không tìm thấy hợp đồng thử việc – đã chọn “Không thử việc”, bỏ chọn nếu có thử việc' : p.nv && pd0 ? ' · thời gian thử việc lấy theo hợp đồng thử việc' : '') + '</p>' : '') +
        '<div class="field" style="margin-top:10px"><label for="hnJ">Hành trình</label><select class="input" id="hnJ">' + jr.map(function (j) { return opt(j.gid, j.name + (auto.length && auto[0].gid === j.gid ? ' (khớp phòng ban, vị trí)' : ''), gid); }).join('') + '</select>' + (!jr.length ? '<div class="hint" style="color:var(--danger)">Công ty chưa có hành trình đang áp dụng – vào Thiết lập hành trình để tạo.</div>' : '') + '</div>' +
        '<h4>Ngày vào làm, thời gian thử việc</h4>' + hnProbBlock('hnB', start, pd, none) +
        '<h4>Người phụ trách cụ thể</h4><p class="muted" style="font-size:12.5px;margin:0 0 8px">Gợi ý sẵn theo chức danh và trưởng phòng ban – đổi nếu cần. Việc của vai trò nào sẽ hiện trên app người được chọn.</p><div class="hn-whog">' +
        rs.map(function (r) { return '<div class="field"><label>' + hnRoleTag(r) + '</label>' + hnWhoSel(cur.u, p && p.nv, r, cur.who[r]) + '</div>'; }).join('') + '</div>' +
        '<label class="hn-chk" style="margin-top:12px"><input type="checkbox" id="hnPast" checked> Đánh dấu “đã xong” các việc có hạn trước hôm nay <span class="muted">(khi bắt đầu muộn, người mới đã đi làm)</span></label>' +
        '<div class="link-row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Hủy</button><button class="btn btn-primary" id="hnGo"' + (!p || !jr.length ? ' disabled' : '') + '>Bắt đầu hội nhập</button></div>';
      var get = hnProbBind(m, 'hnB');
      function keep() { var v = get(); cur.start = v.s || cur.start; cur.pd = parseInt(String($('#hnBD', m).value).replace(/\D/g, ''), 10) || 0; cur.none = v.none; }
      var su = $('#hnU', m); if (su) su.addEventListener('change', function () { cur = { u: unitById(su.value), key: '', gid: '', who: null, pd: null, none: null, start: null }; draw(); });
      $('#hnP', m).addEventListener('change', function () { cur.key = $('#hnP', m).value; cur.gid = ''; cur.who = null; cur.pd = null; cur.none = null; cur.start = null; draw(); });
      $('#hnJ', m).addEventListener('change', function () { keep(); cur.gid = $('#hnJ', m).value; draw(); });
      $$('#hnSt .hn-wsel', m).forEach(function (el) { el.addEventListener('change', function () { cur.who[el.getAttribute('data-r')] = el.value; }); });
      var go = $('#hnGo', m); if (go) go.addEventListener('click', function () {
        var v = get(); if (!v.s) { toast('Ngày vào làm chưa đúng', 'err'); return; } if (!v.none && !v.pd) { toast('Chưa nhập thời gian thử việc', 'err', 'Nhập số ngày thử việc, hoặc chọn Không thử việc.'); return; }
        var miss = rs.filter(function (r) { return !cur.who[r]; });
        var o = hnNewOb(cur.u, { gid: $('#hnJ', m).value, nv: p.nv, cid: p.cid, name: p.name, pb: p.pb, cd: p.cd, start: v.s, pe: v.pe, who: JSON.parse(JSON.stringify(cur.who)) }), past = 0;
        if ($('#hnPast', m).checked) o.steps.forEach(function (z) { if (z.x !== 'todo') return; var d = hnDue(o, z); if (d && d < R) { z.x = 'done'; z.dAt = R; z.note = 'Đánh dấu khi bắt đầu hội nhập muộn'; past++; } });
        hnSave('Bắt đầu hội nhập ' + o.id + ' ' + o.name + ' – ' + o.jname + ', thử việc ' + (o.pd ? o.pd + ' ngày' : 'không') + (past ? ' (' + past + ' việc đã qua đánh dấu xong)' : ''));
        m.close(); var f = ps('hnt', { open: null, st: 'run', co: '', view: 'list', late: false }); f.open = { u: cur.u.id, id: o.id }; if (location.hash !== '#hntiendo') location.hash = 'hntiendo'; else render();
        toast('Đã bắt đầu hội nhập cho ' + o.name, miss.length ? 'err' : 'info', miss.length ? 'Còn ' + miss.length + ' vai trò chưa chỉ định người: ' + miss.map(function (r) { return HN_RN[r]; }).join(', ') + ' – chọn ở khung Người phụ trách cụ thể.' : o.steps.filter(function (z) { return z.x !== 'na'; }).length + ' việc theo ' + o.jname);
      });
    }
    draw();
  };
  // Cảnh báo cho Việc cần xử lý
  Object.assign(HRR.KINDS, { hn_late: { name: 'Việc hội nhập quá hạn', law: '' }, hn_none: { name: 'Người mới chưa có hội nhập', law: '' } });
  var HNA = { key: null, list: [] };
  function hnAlerts() {
    var R = refDate(), out = [];
    selUnits().forEach(function (u) {
      hnOf(u).ob.forEach(function (o) {
        if (o.st !== 'run') return;
        hnObStat(o, R).late.forEach(function (t) { var d = tdDiff(R, t.due); out.push({ kind: 'hn_late', level: t.s.req || d <= -3 ? 'gap' : 'canh', id: o.nv || '', name: o.name, dept: o.pb, unit: u.name, unitId: u.id, title: o.name + ': ' + t.s.title + ' – quá hạn ' + (-d) + ' ngày', detail: HN_PHN[t.s.ph] + ' · phụ trách: ' + (HN_RN[t.s.own] || '') + (hnWhoOf(u, o, t.s.own) ? ' – ' + hnWhoOf(u, o, t.s.own) : ' (chưa chỉ định người)') + ' · Hội nhập → Hội nhập nhân sự mới', key: u.id + '|hn_late||' + o.id + '/' + t.s.id, days: d, due: t.due, sources: ['Hội nhập'] }); });
      });
    });
    hnSuggest(selUnits()).forEach(function (x) { if (x.dd > 3 || x.dd < -7) return; out.push({ kind: 'hn_none', level: 'nhac', id: x.nv || '', name: x.name, dept: x.pb, unit: x.u.name, unitId: x.u.id, title: x.name + (x.dd > 0 ? ' đi làm từ ' + vn(x.start) : ' đã vào làm từ ' + vn(x.start)) + ' – chưa bắt đầu hội nhập', detail: 'Hội nhập → Hội nhập nhân sự mới → Bắt đầu', key: x.u.id + '|hn_none||' + (x.nv || x.cid), days: x.dd, due: x.start, sources: ['Hội nhập'] }); });
    return out;
  }
  var _hnAlertBase = alertList;
  alertList = function () { var base = _hnAlertBase(), k = ACACHE.key + '#' + HNV + '#' + TDV + '#' + refDate(); if (HNA.key !== k) { try { HNA = { key: k, list: hnAlerts() }; } catch (e) { logErr('Tính cảnh báo hội nhập', e); HNA = { key: k, list: [] }; } } return base.concat(HNA.list); };


  /* =====================================================================
     APP NHÂN VIÊN (anh 12/11 10:44): người đang hội nhập thấy nút "HOÀN THIỆN HÀNH TRÌNH HỘI NHẬP" ở Home (dưới Chấm công),
     bấm mở lời chào + các giai đoạn + việc của mình / việc cùng tham gia (xem dạng bảng hoặc thẻ). Nút ẩn khi đã ký HĐLĐ chính thức
     (bước "Ký hợp đồng lao động" ở giai đoạn Chính thức đã xong) hoặc hồ sơ hội nhập đã kết thúc.
     Dữ liệu đi kèm gói hồ sơ gửi lên app (hsAppPayload → d.hn). Người mới tự bấm "Tôi đã làm xong" cho việc của chính mình
     (người phụ trách = Người mới) → máy chủ lưu (bảng hn_xong) → phần mềm kéo về ở trang Hội nhập nhân sự mới.
     ===================================================================== */
  function hnEnded(o) { return o.st === 'done' || o.steps.some(function (s) { return s.ph === 'off' && s.go === 'hd' && s.x === 'done'; }); }
  function hnAppPayload(u, ma) {
    var L = hnOf(u).ob.filter(function (o) { return o.nv === ma && o.st !== 'stop'; }); if (!L.length) return null;
    var o = L[L.length - 1], who = {};
    hnRolesUsed(o.steps).forEach(function (r) { var n = hnWhoOf(u, o, r); if (n) who[r] = n; });
    // 12/11 12:33: biểu mẫu của từng bước (bước của hồ sơ cũ chưa có thì lấy theo hành trình gốc) – gửi 1 lần ở bm{}, bước chỉ giữ mã
    var jr = hnOf(u).jr.filter(function (j) { return j.gid === o.gid; })[0], jbm = {}; if (jr) jr.steps.forEach(function (x) { jbm[x.id] = x.bm || []; });
    var bmOf = function (s) { return (s.bm ? s.bm : jbm[s.id] || []).filter(function (id) { return !!hnBmById(id); }); }, BMX = {};
    hnObSteps(o).forEach(function (x) { var s = x.s, mo = s.own === 'nv' || (s.own2 || []).indexOf('nv') >= 0 || s.nv; if (!mo || s.x === 'na') return; bmOf(s).forEach(function (id) { if (BMX[id]) return; var b = hnBmById(id), r = { ten: b.ten, loai: b.loai, ghi: b.ghi || '', nguoi: b.nguoi || 'nv' }; if (b.loai === 'file') r.f = b.f; else r.html = hnBmHtml(u, ma, o, b); BMX[id] = r; }); });
    return { v: 1, bm: BMX, id: o.id, ten: o.name, cty: String(u.name || '').replace(/\s*\(dữ liệu mẫu\)\s*$/i, ''), cd: o.cd, pb: o.pb, start: o.start, pe: o.pe || '', jname: o.jname, xong: hnEnded(o) ? 1 : 0, who: who,
      ph: HN_PH.map(function (p) { return [p[0], p[1], p[2]]; }), roles: HN_RN,
      steps: hnObSteps(o).filter(function (x) { return x.s.x !== 'na'; }).map(function (x) { var s = x.s; return { id: s.id, ph: s.ph, due: x.due || '', t1: s.t1 || '', t2: s.t2 || '', title: s.title, desc: s.desc || '', doc: s.doc || '', own: s.own, own2: s.own2 || [], x: s.x, dAt: s.dAt || '', req: s.req ? 1 : 0, law: s.law || '', bm: bmOf(s), moi: s.own === 'nv' ? 'own' : ((s.own2 || []).indexOf('nv') >= 0 || s.nv) ? 'co' : '' }; }) };
  }
  window.hnAppPayload = hnAppPayload;
  // dùng để sinh dữ liệu mẫu hội nhập cho máy chủ bản thử (cham-cong-thu/src/demo-hoinhap.js)
  window.hnDemoExport = function () { var o = {}; S.units.filter(function (u) { return u.source === 'sample'; }).forEach(function (u) { hnOf(u).ob.forEach(function (ob) { if (ob.nv) { var pl = hnAppPayload(u, ob.nv); if (pl) o[ob.nv] = pl; } }); }); return o; };
  function hnIsoAt(t) { var d = new Date(+t + 7 * 3600e3); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); }
  // Việc người mới tự xác nhận trên app → cập nhật hồ sơ hội nhập
  function hnApplyTicks(u, list) {
    var n = 0, h = hnOf(u);
    (list || []).forEach(function (r) {
      var o = h.ob.filter(function (z) { return z.nv === r.ma && z.st === 'run'; }).pop(); if (!o) return;
      var s = o.steps.filter(function (z) { return z.id === r.sid && z.own === 'nv'; })[0]; if (!s) return;
      if (+r.x && s.x !== 'done') { s.x = 'done'; s.dAt = hnIsoAt(r.at); s.app = 1; s.note = s.note || 'Người mới xác nhận trên app'; n++; }
      else if (!+r.x && s.app && s.x === 'done') { s.x = 'todo'; s.dAt = ''; s.app = 0; n++; }
    });
    return n;
  }
  var HN_APP_AT = 0;
  function hnAppSync() {
    if (Date.now() - HN_APP_AT < 45e3) return; HN_APP_AT = Date.now();
    selUnits().forEach(function (u) {
      var real = typeof wfOn === 'function' && wfOn(u), demo = !real && u.source === 'sample' && typeof wfDemoGet === 'function';
      if (!real && !demo) return;
      var get = real ? function (p, b) { return wfCall(u, p, b); } : wfDemoGet;
      get('hn-xong').then(function (j) {
        var n = hnApplyTicks(u, (j.list || []).filter(function (r) { return hnNvOf(u, r.ma); }));
        if (n) { hnSave('Cập nhật ' + n + ' việc người mới xác nhận trên app'); if (curPage === 'hntiendo') hnRerender(); }
        if (typeof hsAppSync === 'function') return hsAppSync(u, get, real);
      }).catch(function (e) { log('Hội nhập: chưa đồng bộ được với app nhân viên – ' + (e && e.message || e)); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || !/^hn/.test(curPage || '')) return;
    var k = String(e.key).toLowerCase(), t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if (typing || $('.modal-bg')) return;
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); if (hnEd()) ACTS['hn-undo'](); else hnUndoSaved(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); if (hnEd()) ACTS['hn-redo'](); else hnRedoSaved(); }
  });
  // Liên kết <a href="#"> của module: chặn đổi địa chỉ về "#" (nếu không trang sẽ nhảy về Bảng điều hành)
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href="#"][data-act^="hn"]'); if (a) e.preventDefault(); });
