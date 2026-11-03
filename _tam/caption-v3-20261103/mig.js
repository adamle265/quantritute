
/* v17b (03/11/2026 19:30): viết lại caption v17 theo CAM-NANG-CAPTION bản 3 / skill viet-caption-social bản 3 (#quantritute đứng đầu, câu kêu gọi mẫu, link trang công cụ, câu hỏi chuyển sang bình luận ghim). Chỉ sửa kênh chưa đăng. */
const SEED_V17B = [
{
 "code": "v17",
 "pin": "Công cụ bạn đang dùng còn thiếu nút nào khiến bạn phải bấm tay từng dòng? Kể Tuấn và Đốm nghe nhé 👇",
 "tiktok": {
  "caption": "Góp ý đầu tiên cho công cụ kế toán của mình, ngay trong ngày đã thành tính năng mới 🧡\n\nChị Hằng đề xuất 1 ô để tick hoặc bỏ tick cả danh sách hóa đơn sau khi lọc. Giờ chỉ cần 1 lần bấm. Cảm ơn chị!\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại bio👇\n\n#quantritute #ketoan #hoadondientu #thuegtgt #bangkehoadon",
  "note": "Anh mở đầu + Đốm demo – thân bài xưng \"mình\". Caption bản 3 (03/11 19:30, viết lại theo CAM-NANG-CAPTION bản 3). Không link."
 },
 "youtube": {
  "title": "Góp ý đầu tiên thành tính năng mới của công cụ kế toán",
  "caption": "Góp ý đầu tiên cho công cụ kế toán của mình, ngay trong ngày đã thành tính năng mới 🧡\n\nChị Hằng, một chị kế toán đang dùng công cụ Bảng kê & Tờ khai thuế GTGT từ Excel, đề xuất thêm một ô để tick hoặc bỏ tick cả danh sách hóa đơn sau khi lọc. Chi tiết nhỏ thôi, nhưng ai từng bấm tay vài chục dòng mới thấy đỡ thế nào. Cảm ơn chị Hằng!\n\nĐể góp ý không bị trôi đi, mình mở thêm Góc cảm ơn: ghi lại từng góp ý, trạng thái và kết quả xử lý. Mỗi công cụ cũng có thêm nút Lịch sử cập nhật tính năng.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#quantritute #bangkehoadon #tokhaithuegtgt #congcuketoan #hoadondientu #ketoan",
  "tags": "bảng kê hóa đơn từ excel, tờ khai thuế GTGT, lập tờ khai 01/GTGT, công cụ kế toán miễn phí, chọn nhiều hóa đơn cùng lúc, hóa đơn điện tử, góp ý người dùng, quantritute",
  "note": "Shorts dọc 2:23. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 04/11/2026 19:00. Thêm vào danh sách phát: Bảng kê & Tờ khai thuế GTGT từ Excel – Hướng dẫn tính năng."
 },
 "facebook": {
  "caption": "Bộ công cụ vừa nhận được góp ý đầu tiên, và ngay trong ngày đã thành tính năng mới 🧡\n\nChị Mai Ngọc Hằng, một chị kế toán đang dùng công cụ Bảng kê & Tờ khai thuế GTGT từ Excel, đề xuất thêm một ô để tick hoặc bỏ tick cả danh sách hóa đơn sau khi lọc. Chi tiết nhỏ thôi, nhưng ai từng bấm tay vài chục dòng mới thấy đỡ thế nào. Cảm ơn chị Hằng!\n\nĐể góp ý không bị trôi đi, mình mở thêm Góc cảm ơn: ghi lại từng góp ý, trạng thái và kết quả xử lý. Mỗi công cụ cũng có thêm nút Lịch sử cập nhật tính năng.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=facebook\n\n#quantritute #ketoan #bangkehoadon #tokhaithuegtgt #thuegtgt #hoadondientu #congcuketoan #ketoanvien #meovanphong",
  "note": "Đăng dạng Reels."
 }
}
];
async function migrateV17b(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v17b'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V17B) {
      st.push(env.DB.prepare(`UPDATE video_items SET pin_comment = ?2, updated_at = ?3 WHERE code = ?1`).bind(v.code, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v17b', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v17b', e); }
}

/* v20 (03/11/2026, anh duyệt Cổng 3 13:08): Tải tờ khai thuế đã nộp hàng loạt – Hướng dẫn sử dụng (Đốm, = Video demo) – đăng T7 07/11/2026 19:00. Caption theo CAM-NANG-CAPTION bản 3. */
const SEED_V20 = [
{
 "code": "v20",
 "title": "Tải tờ khai thuế đã nộp hàng loạt – Hướng dẫn sử dụng",
 "date": "2026-11-07",
 "dur": "2:41",
 "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\20. Tải tờ khai thuế đã nộp hàng loạt_Hướng dẫn sử dụng.mp4",
 "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v20-tai-to-khai-huong-dan\\xuat\\thumb-doc-luoi-1080x1920.png",
 "pin": "Bạn đang lưu tờ khai thuế các năm trước ở đâu: máy tính, ổ chung hay cần mới tải lại? Kể Đốm nghe nhé 👇",
 "tiktok": {
  "caption": "Tải lại tờ khai thuế đã nộp cả năm trong 1 lần, không phải mở từng tờ 📂\n\nĐốm chọn Năm nay, mỗi tháng gõ 1 mã xác nhận, đến lượt công cụ đổ chuông gọi. Xong có ngay 1 file ZIP xếp theo từng tờ khai, kèm bảng kê Excel.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại bio👇\n\n#quantritute #tokhaithue #ketoan #thuedientu #ketoanthue",
  "note": "Đốm dẫn 100% – thân bài xưng \"Đốm\", gọi \"anh chị\"; câu kêu gọi gọi \"bạn\". Theo CAM-NANG-CAPTION bản 3. Không link."
 },
 "youtube": {
  "title": "Tải tờ khai thuế đã nộp cả năm trong 1 lần",
  "caption": "Tải lại tờ khai thuế đã nộp cả năm trong 1 lần, không phải mở từng tờ 📂\n\nTrang dịch vụ công chỉ cho tra 30 ngày mỗi lần, lần nào cũng phải gõ mã xác nhận. Đốm thử công cụ Tải tờ khai thuế đã nộp hàng loạt với tờ khai từ đầu năm của một công ty ví dụ.\n\nChọn Năm nay, công cụ tự chia mỗi tháng một lượt. Anh chị gõ mã cho từng lượt rồi cứ làm việc khác, đến lượt công cụ đổ chuông gọi. Hồ sơ nộp trước 01/07/2025 thì cứ 12 tháng chỉ cần một mã.\n\nKết quả là một file ZIP xếp thư mục theo từng tờ khai, kèm thông báo của cơ quan thuế và Bảng kê Excel. Kỳ nào nộp nhiều lần được gom lại, đánh dấu lần nộp sau cùng. Công cụ chỉ tra cứu và tải về, không nộp, không sửa hồ sơ nào.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/tai-to-khai?nguon=youtube\n\n#quantritute #taitokhaithue #tokhaithuedanop #tracuuhosothue #thuedientu #ketoan",
  "tags": "tải tờ khai thuế đã nộp, tải tờ khai thuế hàng loạt, tra cứu hồ sơ thuế đã nộp, tải lại tờ khai thuế năm trước, dịch vụ công thuế, tờ khai thuế, công cụ kế toán miễn phí, quantritute",
  "note": "Shorts dọc 2:41. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 07/11/2026 19:00. Video này là Video demo của công cụ Tải tờ khai: có link YouTube thì dán vào Quản trị → Công cụ → Tải tờ khai → Video demo."
 },
 "facebook": {
  "caption": "Tải lại tờ khai thuế đã nộp cả năm trong 1 lần, không phải mở từng tờ 📂\n\nTrang dịch vụ công chỉ cho tra 30 ngày mỗi lần, lần nào cũng phải gõ mã xác nhận. Đốm thử công cụ Tải tờ khai thuế đã nộp hàng loạt với tờ khai từ đầu năm của một công ty ví dụ.\n\nChọn Năm nay, công cụ tự chia mỗi tháng một lượt. Anh chị gõ mã cho từng lượt rồi cứ làm việc khác, đến lượt công cụ đổ chuông gọi. Hồ sơ nộp trước 01/07/2025 thì cứ 12 tháng chỉ cần một mã.\n\nKết quả là một file ZIP xếp thư mục theo từng tờ khai, kèm thông báo của cơ quan thuế và Bảng kê Excel. Kỳ nào nộp nhiều lần được gom lại, đánh dấu lần nộp sau cùng. Công cụ chỉ tra cứu và tải về, không nộp, không sửa hồ sơ nào.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/tai-to-khai?nguon=facebook\n\n#quantritute #tokhaithue #taitokhaithue #tokhaithuedanop #tracuuhosothue #thuedientu #ketoan #ketoanthue #ketoanvien #meovanphong",
  "note": "Đăng dạng Reels."
 }
}
];
async function migrateV20(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v20'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V20) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'tai-to-khai', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v20', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v20', e); }
}
