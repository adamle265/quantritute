  /* =====================================================================
     KHO VĂN BẢN & QUY CHẾ (0.4.1 – anh 10/11/2026 11:06) – tab "Văn bản & quy chế" trong Thiết lập công thức lương
       1) Văn bản pháp luật làm căn cứ tính lương (số hiệu, dùng cho phần nào, tình trạng đối chiếu)
       2) Quy chế / văn bản nội bộ đơn vị cần soạn – lý do, căn cứ, mẫu gợi ý xem trước + tải Word (điền sẵn tên công ty, danh sách khoản từ thiết lập)
     Mẫu là GỢI Ý – đơn vị điều chỉnh, kế toán trưởng / luật sư rà soát trước khi ban hành.
     ===================================================================== */
  var LG_VB = [
    ['Bộ luật Lao động 45/2019/QH14', 'Mức lương, phụ cấp trong HĐ (Đ21), phụ lục HĐ (Đ22), thang bảng lương (Đ93), nguyên tắc trả lương (Đ94), tạm ứng (Đ101), khấu trừ (Đ102), thưởng (Đ104), giờ làm thêm (Đ107), cấm phạt tiền (Đ127)', 'goc'],
    ['Thông tư 10/2020/TT-BLĐTBXH', 'Cách ghi mức lương, phụ cấp, khoản bổ sung trong HĐLĐ; phúc lợi (ăn ca, xăng xe, điện thoại…) ghi thành mục riêng (Đ3.5)', 'goc'],
    ['Nghị định 145/2020/NĐ-CP', 'Đơn giá tiền lương làm thêm giờ (Đ55), làm đêm, nghỉ có hưởng lương', 'goc'],
    ['Luật Bảo hiểm xã hội 41/2024/QH15', 'Đối tượng, tiền lương đóng (Đ31), mức đóng (Đ32–34), tháng không đóng (Đ33.5)', 'trich'],
    ['Nghị định 158/2025/NĐ-CP', 'Tiền lương làm căn cứ đóng BHXH: mức lương HĐ + phụ cấp + khoản bổ sung ổn định; loại trừ khoản biến động theo kết quả công việc (Đ7)', 'trich'],
    ['Luật Việc làm 74/2025/QH15', 'Bảo hiểm thất nghiệp: đối tượng, mức đóng, trần (Đ31, 33, 34)', 'goc'],
    ['Luật Bảo hiểm y tế (VBHN 40/VBHN-VPQH)', 'Mức đóng BHYT (Đ13)', 'goc'],
    ['Nghị định 58/2020/NĐ-CP', 'Mức đóng bảo hiểm tai nạn lao động – bệnh nghề nghiệp 0,5% / 0,3%', 'goc'],
    ['Luật Công đoàn 50/2024/QH15', 'Kinh phí công đoàn 2% (Đ29)', 'goc'],
    ['Quyết định 61/QĐ-TLĐ', 'Đoàn phí công đoàn 0,5% lương đóng BHXH, tối đa 10% lương cơ sở (Đ1.3)', 'goc'],
    ['Nghị định 161/2026/NĐ-CP', 'Lương cơ sở / mức tham chiếu 2.530.000 từ 01/07/2026 – trần đóng BHXH, BHYT 20 lần', 'goc'],
    ['Nghị định 293/2025/NĐ-CP · 399/2026/NĐ-CP', 'Lương tối thiểu vùng 2026 · từ 01/01/2027', 'trich'],
    ['Luật Thuế TNCN 109/2025/QH15', 'Thu nhập miễn thuế (Đ4), giảm trừ gia cảnh (Đ10), biểu thuế 5 bậc (Đ9)', 'goc'],
    ['Nghị định 253/2026/NĐ-CP', 'Khoản không tính thuế: ăn ca, khoán điện thoại, trang phục (Đ8); tăng ca (Đ26); khấu trừ 10% (Đ50)', 'trich'],
    ['Nghị định 320/2025/NĐ-CP', 'Chi trang phục bằng tiền tối đa 5 triệu/người/năm được trừ khi tính thuế TNDN (Đ10)', 'trich']
  ];
  var LG_VBST = { goc: ['tag-ok', 'Có văn bản gốc'], trich: ['tag-info', 'Đối chiếu bản trích nguyên văn'] };
  function lgQcItems(s, cats) { return s.items.filter(function (x) { return cats.indexOf(x.cat) >= 0; }); }
  function lgQcLine(it) {
    var lv = function (v, u) { return +v > 0 ? lgMoney(v) + ' ' + u : 'mức theo chức danh, vị trí tại Bảng mức kèm theo (' + u + ')'; };
    var how = it.kind === 'qty' ? lv(it.price, 'đồng/ngày') + ' × số ngày đi làm thực tế' : it.kind === 'cond' ? lv(it.amt, 'đồng/tháng') + ' nếu đạt từ ' + (+it.cond || 100) + '% ngày công' : it.cat === 'cd' ? (it.src === 'hd' ? 'mức ghi trong HĐLĐ / quyết định' : lv(it.amt, 'đồng/tháng')) + ', trả đủ tháng' : lv(it.amt, 'đồng/tháng') + ' × tỷ lệ ngày công thực tế';
    return '- ' + it.t + ': ' + how + (it.tax === 'free' ? ' (không tính thuế TNCN trong mức quy định)' : '') + '.';
  }
  // Mẫu gợi ý – dạng chữ như mẫu hợp đồng (^ căn giữa đậm, # tiêu đề, ## mục, ~ nghiêng giữa, [CHU_KY] khối chữ ký)
  var LG_QC = [
    { id: 'thang', t: 'Thang lương, bảng lương', why: 'Bắt buộc xây dựng làm cơ sở thỏa thuận mức lương trong HĐ; tham khảo tổ chức đại diện người lao động (nếu có) và công bố công khai trước khi áp dụng.', law: 'BLLĐ Điều 93; TT 10/2020 Điều 3.5.a; NĐ 158/2025 Điều 7.1.a', use: 'Lương cơ bản trong HĐ và Cơ cấu nhân sự',
      md: function (u, s) { var vg = Math.max(1, Math.min(4, +s.vung || 1)), lt = (lgAt('lttv', refDate()).v || [])[vg - 1] || 0, b = function (k) { return lgMoney(Math.ceil(lt * k / 10000) * 10000); }; return ['^ {{ten_cong_ty}}', '---', '# THANG LƯƠNG, BẢNG LƯƠNG', '~ (Ban hành kèm theo Quyết định số ……/QĐ-…… ngày …… của ……)', '',
        '## 1. Căn cứ xây dựng', 'Bộ luật Lao động 2019 Điều 93; lương tối thiểu vùng ' + vg + ' hiện hành ' + lgMoney(lt) + ' đồng/tháng (' + (lgAt('lttv', refDate()).s || '') + '). Mức lương bậc 1 không thấp hơn lương tối thiểu vùng; khoảng cách giữa các bậc do công ty tự quyết định (pháp luật hiện hành không quy định mức tối thiểu; các mức dưới đây dùng ví dụ 5–6%).',
        '## 2. Bảng lương theo chức danh (đồng/tháng – mức lương ghi trong HĐLĐ, là căn cứ đóng BHXH)',
        'Nhóm I – Nhân viên, công nhân: Bậc 1: ' + b(1) + ' · Bậc 2: ' + b(1.05) + ' · Bậc 3: ' + b(1.1) + ' · Bậc 4: ' + b(1.16) + ' · Bậc 5: ' + b(1.22),
        'Nhóm II – Chuyên viên, phụ trách bộ phận: Bậc 1: ' + b(1.2) + ' · Bậc 2: ' + b(1.26) + ' · Bậc 3: ' + b(1.32) + ' · Bậc 4: ' + b(1.39),
        'Nhóm III – Trưởng phòng: Bậc 1: ' + b(1.6) + ' · Bậc 2: ' + b(1.68) + ' · Bậc 3: ' + b(1.76),
        'Nhóm IV – Ban giám đốc: Bậc 1: ' + b(2.4) + ' · Bậc 2: ' + b(2.6) + ' · Bậc 3: ' + b(2.8),
        '_ (Các mức trên chỉ là ví dụ tính từ lương tối thiểu vùng – công ty tự đặt theo thực tế.)',
        '## 3. Chuyển bậc, nâng bậc', 'Xét nâng bậc định kỳ …… tháng/lần theo kết quả đánh giá; người lao động được xếp bậc ghi rõ trong HĐLĐ hoặc quyết định lương.',
        '## 4. Thủ tục ban hành', 'Đã tham khảo ý kiến tổ chức đại diện người lao động tại cơ sở (nếu có) ngày ……; công bố công khai tại nơi làm việc ngày …… trước khi thực hiện.', '', '[CHU_KY]']; } },
    { id: 'quyche', t: 'Quy chế lương, thưởng và phúc lợi', why: 'Căn cứ chi trả các trợ cấp theo ngày công, phúc lợi (ăn ca, điện thoại, xăng xe, trang phục…), kỳ trả lương, tạm ứng, khấu trừ; HĐLĐ dẫn chiếu "theo quy chế từng thời kỳ" cho các khoản này.', law: 'BLLĐ Điều 93, 94, 95, 98, 101, 102, 104; TT 10/2020 Điều 3.5 (phúc lợi ghi mục riêng)', use: 'Trợ cấp theo ngày công, thưởng, khấu trừ trên Bảng lương',
      md: function (u, s) { var cd = lgQcItems(s, ['cd']), nc = lgQcItems(s, ['nc']); return ['^ {{ten_cong_ty}}', '---', '# QUY CHẾ LƯƠNG, THƯỞNG VÀ PHÚC LỢI', '~ (Ban hành kèm theo Quyết định số ……/QĐ-…… ngày ……)', '',
        '## Điều 1. Phạm vi, đối tượng', 'Áp dụng cho người lao động làm việc theo hợp đồng lao động tại {{ten_cong_ty}}. Cộng tác viên, người làm theo hợp đồng dịch vụ thực hiện theo hợp đồng đã ký.',
        '## Điều 2. Cơ cấu thu nhập', 'Thu nhập hằng tháng gồm: (1) Lương cơ bản theo thang lương, bảng lương – ghi trong HĐLĐ, là căn cứ đóng BHXH; (2) Phụ cấp, trợ cấp cố định ghi trong HĐLĐ; (3) Lương hiệu suất theo Quy chế đánh giá hiệu suất; (4) Trợ cấp theo ngày công và phúc lợi theo Quy chế này; (5) Thưởng; (6) Tiền lương làm thêm giờ.',
        '## Điều 3. Tiền lương theo ngày công', 'Lương tháng = Lương cơ bản × số công hưởng lương ÷ công chuẩn của tháng. Công hưởng lương gồm ngày đi làm, ngày nghỉ phép năm, nghỉ lễ, tết, nghỉ việc riêng có hưởng lương. Công chuẩn = số ngày làm việc theo lịch của công ty trong tháng.',
        '## Điều 4. Phụ cấp, trợ cấp cố định (tính vào lương đóng BHXH)'].concat(cd.length ? cd.map(lgQcLine) : ['- (Chưa có khoản nào – ghi theo thực tế)'], ['Các khoản này ghi mức cụ thể trong HĐLĐ hoặc phụ lục HĐLĐ.',
        '## Điều 5. Trợ cấp theo ngày công và phúc lợi (không tính vào lương đóng BHXH)'], nc.length ? nc.map(lgQcLine) : ['- (Chưa có khoản nào – ghi theo thực tế)'], ['Mức hưởng tính theo ngày công thực tế; tháng nghỉ không lương, nghỉ hưởng BHXH thì không hưởng tương ứng. Mức khoán điện thoại, trang phục theo Quy chế tài chính của công ty.',
        '## Điều 6. Thưởng', 'Thưởng theo kết quả sản xuất kinh doanh, mức độ hoàn thành công việc; thưởng lễ, tết; thưởng sáng kiến. Mức và điều kiện do Giám đốc quyết định từng đợt (BLLĐ Điều 104).',
        '## Điều 7. Làm thêm giờ', 'Trả theo BLLĐ Điều 98 và NĐ 145/2020 Điều 55: ít nhất 150% ngày thường, 200% ngày nghỉ hằng tuần, 300% ngày lễ, tết, ngày nghỉ có hưởng lương. Làm thêm phải có yêu cầu hoặc đồng ý bằng văn bản; tối đa 40 giờ/tháng.',
        '## Điều 8. Kỳ trả lương, tạm ứng, khấu trừ', 'Trả lương một lần mỗi tháng, chậm nhất ngày …… tháng sau, bằng chuyển khoản; kèm bảng kê (phiếu lương) cho từng người (BLLĐ Điều 95.3).', 'Tạm ứng không quá …… % lương tháng, không tính lãi (BLLĐ Điều 101). Chỉ khấu trừ lương để bồi thường thiệt hại tài sản, tối đa 30% tiền lương thực trả sau khi trừ BHXH, BHYT, BHTN, thuế (BLLĐ Điều 102). Không áp dụng phạt tiền, cắt lương thay việc xử lý kỷ luật (BLLĐ Điều 127.2).',
        '## Điều 9. Hiệu lực', 'Quy chế có hiệu lực từ ngày ……; đã tham khảo ý kiến tổ chức đại diện người lao động (nếu có) và công bố công khai tại nơi làm việc.', '', '[CHU_KY]']); } },
    { id: 'hieusuat', t: 'Quy chế đánh giá hiệu suất', why: 'Lương hiệu suất chỉ không đóng BHXH khi thực sự biến động theo kết quả công việc – cần tiêu chí, thang điểm, quy trình đánh giá và bảng điểm lưu hồ sơ hằng tháng.', law: 'NĐ 158/2025 Điều 7.1.b–c; BLLĐ Điều 93, 104', use: 'Lương hiệu suất mục tiêu × tỷ lệ đạt trên Bảng lương',
      md: function () { return ['^ {{ten_cong_ty}}', '---', '# QUY CHẾ ĐÁNH GIÁ HIỆU SUẤT VÀ CHI TRẢ LƯƠNG HIỆU SUẤT', '~ (Ban hành kèm theo Quyết định số ……/QĐ-…… ngày ……)', '',
        '## Điều 1. Mục đích', 'Gắn một phần thu nhập với kết quả thực hiện công việc. Lương hiệu suất không cố định, được chi trả theo kết quả đánh giá hằng tháng.',
        '## Điều 2. Mức lương hiệu suất mục tiêu', 'Mức mục tiêu của từng người ghi trong HĐLĐ / phụ lục HĐLĐ hoặc quyết định lương. Lương hiệu suất thực nhận = Mức mục tiêu × Tỷ lệ ngày công × Tỷ lệ đạt.',
        '## Điều 3. Tiêu chí đánh giá', 'Mỗi vị trí có 3–5 chỉ tiêu đo được, tổng trọng số 100% (ví dụ: doanh số / sản lượng, tiến độ hoàn thành công việc, chất lượng – tỷ lệ lỗi, phản hồi khách hàng, tuân thủ quy trình). Danh mục chỉ tiêu từng vị trí tại Phụ lục kèm theo. Không dùng "đi làm đủ công" làm chỉ tiêu hiệu suất.',
        '## Điều 4. Thang quy đổi', 'Dưới 50 điểm: 0% · 50–69 điểm: 50% · 70–84 điểm: 80% · 85–100 điểm: 100% · Vượt chỉ tiêu: tối đa 120% (ví dụ – công ty tự quy định).',
        '## Điều 5. Quy trình hằng tháng', '1. Trước ngày …… người lao động tự đánh giá; 2. Quản lý trực tiếp chấm điểm, trao đổi với người lao động; 3. Trưởng bộ phận / Giám đốc duyệt; 4. Phòng nhân sự nhập tỷ lệ đạt vào bảng lương; 5. Người lao động được xem kết quả và phản hồi trong …… ngày.',
        '## Điều 6. Lưu hồ sơ', 'Bảng điểm đánh giá có xác nhận của người đánh giá và người được đánh giá được lưu cùng bảng lương tháng.',
        '## Điều 7. Hiệu lực', 'Quy chế có hiệu lực từ ngày ……; đã tham khảo ý kiến tổ chức đại diện người lao động (nếu có) và công bố công khai.', '', '[CHU_KY]']; } },
    { id: 'taichinh', t: 'Quy chế tài chính – mức khoán chi', why: 'Khoán điện thoại, trang phục… chỉ không tính thuế TNCN trong mức ghi ở quy chế tài chính / quy chế nội bộ; chi trang phục bằng tiền tối đa 5 triệu/người/năm.', law: 'NĐ 253/2026 Điều 8.2.đ; NĐ 320/2025 Điều 10', use: 'Ô "Miễn thuế đến" của khoản điện thoại, trang phục (Thiết lập → Khoản lương)',
      md: function () { return ['^ {{ten_cong_ty}}', '---', '# QUY CHẾ TÀI CHÍNH', '~ (Trích phần mức khoán chi cho người lao động)', '',
        '## Điều …. Khoán chi điện thoại', 'Người lao động thường xuyên dùng điện thoại cho công việc được khoán: Ban giám đốc …… đồng/tháng; Trưởng phòng …… đồng/tháng; nhân viên kinh doanh, chăm sóc khách hàng …… đồng/tháng. Chi trả cùng kỳ lương, theo ngày công thực tế.',
        '## Điều …. Trang phục', 'Chi trang phục bằng tiền tối đa …… đồng/người/năm (không vượt 5.000.000 đồng/người/năm theo NĐ 320/2025 Điều 10); chi bằng hiện vật có hóa đơn, chứng từ.',
        '## Điều …. Công tác phí, đi lại', 'Thanh toán theo chứng từ thực tế hoặc khoán theo định mức tại Phụ lục ……; khoản hỗ trợ xăng xe trả cố định cùng lương là thu nhập chịu thuế TNCN.',
        '## Điều …. Ăn giữa ca', 'Mức ăn giữa ca …… đồng/ngày làm việc thực tế; trả bằng tiền thì phần vượt 1.200.000 đồng/tháng tính vào thu nhập chịu thuế TNCN (NĐ 253/2026 Điều 8.2.g).', '', '[CHU_KY]']; } },
    { id: 'noiquy', t: 'Nội quy lao động (phần thời giờ làm việc, kỷ luật)', why: 'Căn cứ xử lý đi muộn, về sớm, vi phạm – bằng hình thức kỷ luật, KHÔNG phạt tiền, cắt lương; đơn vị từ 10 lao động phải có nội quy bằng văn bản và đăng ký.', law: 'BLLĐ Điều 118, 119, 124, 127.2', use: 'Thiết lập "Thời gian đi muộn" (không trả lương đúng số phút không làm việc)',
      md: function () { return ['^ {{ten_cong_ty}}', '---', '# NỘI QUY LAO ĐỘNG', '~ (Trích các điều về thời giờ làm việc và kỷ luật lao động)', '',
        '## Thời giờ làm việc', 'Giờ làm việc: từ …… đến ……, nghỉ giữa ca …… phút; làm việc từ thứ …… đến thứ ……. Chấm công bằng ……',
        '## Đi muộn, về sớm', 'Thời gian đi muộn, về sớm không làm việc thì không được trả lương cho đúng thời gian đó. Đi muộn, về sớm từ …… lần/tháng không có lý do chính đáng bị xử lý kỷ luật theo hình thức khiển trách.',
        '## Hình thức kỷ luật', 'Khiển trách; kéo dài thời hạn nâng lương không quá 06 tháng; cách chức; sa thải (BLLĐ Điều 124). Nghiêm cấm phạt tiền, cắt lương thay việc xử lý kỷ luật lao động (BLLĐ Điều 127.2).',
        '## Trình tự xử lý kỷ luật', 'Theo BLLĐ Điều 122 và NĐ 145/2020: chứng minh lỗi, có sự tham gia của tổ chức đại diện người lao động (nếu là thành viên), người lao động được tự bào chữa, lập biên bản.', '', '[CHU_KY]']; } },
    { id: 'phuluc', t: 'Phụ lục HĐLĐ điều chỉnh lương, phụ cấp', why: 'Thay đổi lương cơ bản, phụ cấp cố định hoặc lương hiệu suất mục tiêu ghi trong HĐLĐ phải lập phụ lục (không được thay đổi thời hạn HĐ bằng phụ lục).', law: 'BLLĐ Điều 22; TT 10/2020 Điều 3.5', use: 'Khi Cơ cấu nhân sự đổi khoản cố định khác HĐ',
      md: function () { return ['^ CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', '^ Độc lập – Tự do – Hạnh phúc', '---', '', '# PHỤ LỤC HỢP ĐỒNG LAO ĐỘNG', '~ Số: ……/PLHĐ-……', '',
        'Căn cứ Hợp đồng lao động số …… ký ngày …… giữa:', 'Bên A (Người sử dụng lao động): {{ten_cong_ty}}, địa chỉ {{dia_chi_cong_ty}}, đại diện ông/bà {{nguoi_dai_dien}} – {{chuc_vu_dai_dien}}.', 'Bên B (Người lao động): ông/bà ……, mã nhân viên ……',
        'Hai bên thỏa thuận sửa đổi Điều 3 – Tiền lương, phụ cấp của hợp đồng như sau, áp dụng từ ngày ……:',
        '1. Mức lương (lương cơ bản – căn cứ đóng BHXH): …… đồng/tháng.', '2. Phụ cấp chức vụ: …… đồng/tháng.', '3. Lương hiệu suất mục tiêu: …… đồng/tháng – chi trả theo Quy chế đánh giá hiệu suất.', '4. Các nội dung khác của hợp đồng giữ nguyên.',
        'Phụ lục là bộ phận không tách rời của hợp đồng, lập thành 02 bản, mỗi bên giữ 01 bản.', '', '[CHU_KY]']; } },
    { id: 'qdluong', t: 'Quyết định điều chỉnh lương', why: 'Căn cứ ghi Lịch sử điều chỉnh lương và tự cập nhật Cơ cấu nhân sự tháng có hiệu lực.', law: 'BLLĐ Điều 93; Thang lương, bảng lương của công ty', use: 'Lịch sử lương → Cơ cấu nhân sự ("Lấy dữ liệu từ tháng trước")',
      md: function () { return ['^ {{ten_cong_ty}}', '~ Số: ……/QĐ-……', '---', '# QUYẾT ĐỊNH', '^ Về việc điều chỉnh lương', '',
        'Căn cứ Thang lương, bảng lương và Quy chế lương, thưởng của công ty; căn cứ kết quả đánh giá ……;', '## Điều 1.', 'Điều chỉnh lương cho ông/bà ……, chức danh ……, bộ phận …… từ ngày ……:', '- Lương cơ bản: từ …… lên …… đồng/tháng (bậc ……);', '- Phụ cấp chức vụ: …… đồng/tháng;', '- Lương hiệu suất mục tiêu: …… đồng/tháng.',
        '## Điều 2.', 'Hai bên ký phụ lục hợp đồng lao động ghi nhận mức mới. Phòng nhân sự, kế toán và ông/bà có tên tại Điều 1 thi hành quyết định này.', '', '[CHU_KY]']; } }
  ];
  function lgTabVb(u, s) {
    var laws = '<div class="card card-pad"><h3 style="margin:0">Văn bản pháp luật làm căn cứ</h3><p class="lg-law" style="margin:4px 0 10px">Các điều dùng để tính đã được đối chiếu khi xây dựng phần mềm (cột Đối chiếu). Văn bản có thể được sửa đổi, thay thế – khi có văn bản mới, thêm mức mới theo ngày hiệu lực ở tab <b>Tham số theo luật</b>.</p><div class="tbl-wrap" style="max-height:none"><table class="tbl lg-vb"><thead><tr><th>Văn bản</th><th>Dùng cho</th><th>Đối chiếu</th></tr></thead><tbody>' +
      LG_VB.map(function (x) { var t = LG_VBST[x[2]]; return '<tr><td><b>' + esc(x[0]) + '</b></td><td class="lg-law">' + esc(x[1]) + '</td><td><span class="tag ' + t[0] + '">' + t[1] + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
    var qc = '<div class="card card-pad" style="margin-top:14px"><h3 style="margin:0">Quy chế, văn bản nội bộ cần soạn</h3><p class="lg-law" style="margin:4px 0 10px">Mẫu gợi ý đã điền sẵn tên công ty và các khoản lương đang thiết lập – <b>đơn vị điều chỉnh cho phù hợp, kế toán trưởng / luật sư rà soát trước khi ban hành</b>. Quy chế lương, thưởng và thang lương, bảng lương phải tham khảo tổ chức đại diện người lao động (nếu có) và công bố công khai trước khi áp dụng.</p><div class="lg-qc">' +
      LG_QC.map(function (q, i) { return '<div class="lg-qc-it"><div style="flex:1;min-width:0"><b>' + (i + 1) + '. ' + esc(q.t) + '</b><div class="lg-law">' + esc(q.why) + '</div><div class="lg-law"><b>Căn cứ:</b> ' + esc(q.law) + ' · <b>Dùng cho:</b> ' + esc(q.use) + '</div></div><div class="link-row" style="gap:6px;flex-wrap:nowrap"><button class="btn btn-sm" data-act="lg-qc" data-id="' + q.id + '">Xem mẫu</button><button class="btn btn-sm" data-act="lg-qc-dl" data-id="' + q.id + '">' + ic('xuat', 14) + 'Tải Word</button></div></div>'; }).join('') + '</div></div>';
    return laws + qc;
  }
  function lgQcVals(u) { var c = coInfo(u); return { ten_cong_ty: c.ten, dia_chi_cong_ty: c.dc || '……', mst_cong_ty: c.mst || '……', nguoi_dai_dien: c.dd || '……', chuc_vu_dai_dien: c.cv || 'Giám đốc' }; }
  function lgQcHtml(u, q) { return tplMdToHtml(q.md(u, lgOf(u)).join('\n')); }
  function lgQcSign(q, V) { return q.id === 'phuluc' ? [['NGƯỜI LAO ĐỘNG', '(Ký, ghi rõ họ tên)', ''], ['NGƯỜI SỬ DỤNG LAO ĐỘNG', '(Ký, đóng dấu, ghi rõ họ tên)', V.nguoi_dai_dien]] : [['NGƯỜI LẬP', '(Ký, ghi rõ họ tên)', ''], [String(V.chuc_vu_dai_dien || 'GIÁM ĐỐC').toUpperCase(), '(Ký, đóng dấu, ghi rõ họ tên)', V.nguoi_dai_dien]]; }
  ACTS['lg-qc-dl'] = function (a, id) { var u = lgUnit(), q = LG_QC.filter(function (x) { return x.id === id; })[0]; if (!q) return; var V = lgQcVals(u), sg = lgQcSign(q, V); saveDocx(tplDocx(lgQcHtml(u, q), V, sg[0], sg[1]), HR.stripAcc('Mau ' + q.t + ' ' + shortUnit(u.name)).replace(/[^A-Za-z0-9]+/g, '_').replace(/_$/, '') + '.docx'); log('Tải mẫu "' + q.t + '" – ' + u.name); toast('Đã tải mẫu ' + q.t, 'ok', 'Mẫu gợi ý – rà soát trước khi ban hành'); };
  ACTS['lg-qc'] = function (a, id) {
    var u = lgUnit(), q = LG_QC.filter(function (x) { return x.id === id; })[0]; if (!q) return;
    modal(q.t + ' (mẫu gợi ý)', shortUnit(u.name) + ' · ' + q.law, '<div class="notice warn" style="margin-bottom:10px">' + ic('info') + '<div>Mẫu gợi ý để đơn vị chỉnh sửa – không thay thế tư vấn pháp lý. Các chỗ "……" đơn vị tự điền.</div></div><div class="tp-paper" style="max-height:62vh;overflow:auto">' + tplHtml(lgQcHtml(u, q), lgQcVals(u)) + '</div><div class="link-row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="btn" data-close>Đóng</button><button class="btn btn-primary" data-act="lg-qc-dl" data-id="' + q.id + '">Tải Word</button></div>');
  };
