/* ============================================================
 * Quản trị tử tế — Xưởng video: bảng dữ liệu (D1) + dữ liệu khởi tạo (v1.16) + cột/lịch mới (v1.18)
 * Tự chạy trong ensureSchema() (core.js). Mọi lỗi ở đây chỉ ghi log, KHÔNG làm sập API chung.
 *   video_items : 1 dòng = 1 video (bước quy trình, ngày dự kiến đăng, nội dung đăng chung, đường dẫn file trên máy)
 *   video_posts : 1 dòng = 1 video × 1 kênh (youtube | tiktok | facebook): trạng thái, giờ hẹn, link bài, chỉ số
 * ============================================================ */
export const STUDIO_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS video_items (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'other', tool_slug TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL DEFAULT 'idea',
    plan_date TEXT NOT NULL DEFAULT '', duration TEXT NOT NULL DEFAULT '', hook TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '', hashtags TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
    file_path TEXT NOT NULL DEFAULT '', thumb_path TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', log TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS video_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, video_id INTEGER NOT NULL, channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo', privacy TEXT NOT NULL DEFAULT 'public', scheduled_at TEXT NOT NULL DEFAULT '', posted_at TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, comments INTEGER NOT NULL DEFAULT 0, shares INTEGER NOT NULL DEFAULT 0,
    followers INTEGER NOT NULL DEFAULT 0, clicks INTEGER NOT NULL DEFAULT 0, watch_pct REAL NOT NULL DEFAULT 0, metrics_at TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL DEFAULT 0, UNIQUE(video_id, channel))`,
  `CREATE INDEX IF NOT EXISTS idx_video_posts_video ON video_posts(video_id)`,
];

const FILE_DIR = 'D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\';
/* Dữ liệu khởi tạo: đúng hiện trạng anh chốt 15/10/2026 (3 video đã hoàn thành + 4 video mới theo thứ tự đăng từ 19/10). Chỉ chạy 1 lần, không đè dữ liệu anh đã sửa. */
const SEED = [
  { code: 'v01', title: 'Sự trở lại & Người bạn mới', kind: 'brand', stage: 'saved', plan: '2026-10-19', dur: '1:30', file: '1. Sự trở lại và bạn đồng hành mới 1410.mp4' },
  { code: 'v04', title: 'Giới thiệu Bộ công cụ tiện ích & lý do làm (tên tạm)', kind: 'brand', stage: 'idea', plan: '2026-10-20' },
  { code: 'v05', title: 'Nỗi đau & lý do làm công cụ Tạo văn bản, thiết kế hàng loạt (tên tạm)', kind: 'why', tool: 'van-ban-hang-loat', stage: 'idea', plan: '2026-10-21' },
  { code: 'v02', title: 'Hết sửa tên & số từng văn bản – demo Tạo văn bản hàng loạt', kind: 'demo', tool: 'van-ban-hang-loat', stage: 'scheduled', plan: '2026-10-22', dur: '1:14', file: '2. Demo tạo văn bản hàng loạt 1410.mp4',
    yt: { url: 'https://youtube.com/shorts/61ViuSOMFrA', at: '2026-10-14' } },
  { code: 'v06', title: 'Nỗi đau & lý do làm công cụ Cẩm nang thuế (tên tạm)', kind: 'why', tool: 'tra-cuu-van-ban', stage: 'idea', plan: '2026-10-23' },
  { code: 'v03', title: 'Tra Điều luật & văn bản hướng dẫn trong một trang – demo Cẩm nang Thuế', kind: 'demo', tool: 'tra-cuu-van-ban', stage: 'scheduled', plan: '2026-10-24', dur: '1:49', file: '3. Demo Cẩm nang tra cứu Thuế - Kế toán - Lao động.mp4',
    yt: { url: 'https://youtube.com/shorts/-S_ZZN7rNBw', at: '2026-10-15' } },
  { code: 'v07', title: 'Hướng tiếp cận AI hợp lý trong thời đại hiện tại (tên tạm)', kind: 'ai', stage: 'idea', plan: '2026-10-25' },
];


/* v1.18 (18/10/2026): lịch đăng 4 video đầu anh chốt + nội dung đăng từng kênh (chỉ điền ô còn trống, không đè nội dung anh đã sửa) */
const SEED_V2 = [
 {
  "code": "v01",
  "title": "Sự trở lại và bạn đồng hành mới",
  "date": "2026-10-18",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\1. Sự trở lại và bạn đồng hành mới 1410.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v01-tro-lai-cung-dom\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Các bạn đang mất nhiều thời gian nhất cho việc gì lặp đi lặp lại mỗi ngày? Các bạn chia sẻ ở bình luận nhé, Tuấn và Đốm sẽ ưu tiên làm công cụ và video cho đúng việc đó.",
  "tiktok": {
   "caption": "Chào các bạn, Tuấn đã trở lại kênh, và lần này có thêm một người bạn nhỏ đồng hành cùng Tuấn: Đốm.\n\nSau một thời gian dừng lại để nghiên cứu và thử nghiệm, Tuấn nhận ra nhiều bạn có chuyên môn rất tốt nhưng vẫn loay hoay với câu hỏi: làm sao dùng công nghệ, dùng AI để công việc nhẹ nhàng hơn.\n\nTừ hôm nay, Tuấn và Đốm sẽ chia sẻ:\n• Những công cụ miễn phí, mỗi công cụ giải quyết đúng một việc lặp đi lặp lại\n• Cách ứng dụng AI vào công việc văn phòng một cách thực tế, dễ làm theo\n\nLink chi tiết Tuấn và Đốm để ở phần Bio nhé.\n\nMong các bạn theo dõi và đồng hành cùng Tuấn và Đốm. Cảm ơn các bạn!\n\n#quantritute #ungdungAI #AIchodanvanphong #congcumienphi #danvanphong",
   "note": "Video đầu tiên của đợt trở lại: sau khi đăng, ghim video này lên đầu trang cá nhân. Xưng hô: Tuấn và Đốm · gọi người xem là \"các bạn\" (video có cả Tuấn và Đốm)"
  },
  "youtube": {
   "title": "Trở lại cùng Đốm | Công cụ miễn phí & cách ứng dụng AI cho dân văn phòng",
   "caption": "Chào các bạn, Tuấn đã trở lại kênh Quản trị tử tế, và lần này có thêm một người bạn nhỏ đồng hành: Đốm.\n\nCông nghệ và AI đang thay đổi rất nhanh cách chúng ta sống và làm việc. Tuấn nhận ra có nhiều anh chị, bạn bè, đồng nghiệp có kinh nghiệm và chuyên môn rất tốt, nhưng vẫn đang loay hoay với câu hỏi: làm sao để công việc hiệu quả hơn nhờ công nghệ số.\n\nSau một thời gian dừng lại để nghiên cứu và thử nghiệm, từ hôm nay Tuấn và Đốm sẽ chia sẻ trên kênh:\n• Những công cụ miễn phí, mỗi công cụ giải quyết đúng một việc lặp đi lặp lại trong công việc văn phòng\n• Cách ứng dụng AI vào công việc một cách thực tế, dễ làm theo\n• Những gì Tuấn học được trên hành trình này\n\nMục tiêu nhỏ của kênh: để những việc lặp đi lặp lại không còn lấy mất thời gian của các bạn, và các bạn có thêm thời gian cho những người thân yêu.\n\n🔗 Kho công cụ miễn phí: https://quantritute.com/cong-cu\n\nCác bạn đăng ký kênh để đồng hành cùng Tuấn và Đốm nhé. Cảm ơn các bạn!\n\n#quantritute #ungdungAI #AIchodanvanphong #congcumienphi",
   "tags": "Quản trị tử tế, quantritute, ứng dụng AI, AI cho dân văn phòng, công cụ miễn phí, công cụ văn phòng, tự động hóa công việc",
   "note": "Tải lên mới. Chế độ hiển thị → Lên lịch → 18/10/2026, 19:00."
  },
  "facebook": {
   "caption": "Chào các bạn, Tuấn đã trở lại 🌱\n\nLần này, Tuấn có thêm một người bạn nhỏ đồng hành: Đốm.\n\nSau một thời gian dừng lại để nghiên cứu và thử nghiệm, Tuấn nhận ra nhiều anh chị, bạn bè có chuyên môn rất tốt nhưng vẫn loay hoay với câu hỏi: làm sao dùng công nghệ, dùng AI để công việc nhẹ nhàng hơn.\n\nTừ hôm nay, Tuấn và Đốm sẽ chia sẻ:\n• Những công cụ miễn phí, mỗi công cụ giải quyết đúng một việc lặp đi lặp lại\n• Cách ứng dụng AI vào công việc văn phòng một cách thực tế, dễ làm theo\n\nMong rằng những việc lặp đi lặp lại sẽ không còn lấy mất thời gian của các bạn, để các bạn có thêm thời gian cho những người thân yêu.\n\n🔗 Kho công cụ miễn phí: https://quantritute.com/cong-cu\n\nCác bạn theo dõi trang để đồng hành cùng Tuấn và Đốm nhé. Cảm ơn các bạn!\n\n#quantritute #ungdungAI #AIchodanvanphong #congcumienphi",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v04",
  "title": "Giới thiệu bộ công cụ trên website",
  "date": "2026-10-19",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\4. Giới thiệu bộ công cụ trên website.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v04-chon-dung-cong-cu\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Kho công cụ còn đang dang dở, Tuấn rất mong được nghe các bạn: các bạn cần một công cụ cho việc gì? Các bạn bình luận ở đây hoặc gửi ở Bảng ghim trên quantritute.com nhé.",
  "tiktok": {
   "caption": "AI ngày càng giỏi, nhưng công việc của mình đã thật sự nhanh hơn chưa? Mình đã có thêm thời gian cho gia đình chưa, hay lại bận hơn?\n\nTừ những gì trải nghiệm và quan sát được, Tuấn bắt tay xây một kho công cụ nhỏ:\n• Mỗi công cụ giải quyết đúng một việc\n• Không cần kiến thức AI cao siêu, mở ra là dùng\n• Miễn phí\n\nHiện kho đã có 2 công cụ cho các bạn làm kế toán, nhân sự:\n1. Cẩm nang tra cứu Thuế – Kế toán – Lao động\n2. Tạo văn bản hàng loạt\n\nCác bạn dùng thử miễn phí, link chi tiết Tuấn và Đốm để ở phần Bio nhé. Ở video sau, Đốm sẽ giới thiệu chi tiết từng công cụ. Tuấn và Đốm rất mong nhận được góp ý của các bạn để kho thật sự hữu ích.\n\n#quantritute #congcumienphi #ketoan #nhansu #ungdungAI",
   "note": "Trong video có câu \"link Tuấn để ở phần profile\": kiểm tra tiểu sử TikTok đã có quantritute.com trước giờ đăng. Xưng hô: Tuấn và Đốm · gọi người xem là \"các bạn\" (Tuấn nói, cuối video có Đốm)"
  },
  "youtube": {
   "title": "Chọn đúng công cụ, giải quyết đúng việc | Công cụ miễn phí cho kế toán, nhân sự",
   "caption": "Một năm trước, chúng ta còn loay hoay học viết câu lệnh cho AI. Bây giờ, người không biết code cũng tự làm được website, ứng dụng. Mỗi tuần lại có một mô hình mới, một khóa học AI mới, và cảm giác sợ bị bỏ lại phía sau chắc nhiều bạn cũng từng có.\n\nTuấn mời các bạn chậm lại một chút để tự hỏi: AI ngày càng giỏi, nhưng công việc của mình đã thật sự nhanh hơn chưa? Mình có thêm thời gian cho gia đình chưa?\n\nTừ những gì trải nghiệm và quan sát được, Tuấn bắt tay xây một kho công cụ nhỏ trên website: mỗi công cụ giải quyết đúng một việc, không cần kiến thức AI cao siêu, mở ra là dùng, miễn phí.\n\nHiện kho đã có 2 công cụ cho các bạn làm kế toán, nhân sự:\n1. Cẩm nang tra cứu Thuế – Kế toán – Lao động\n2. Tạo văn bản hàng loạt\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu\n📌 Cần công cụ cho việc gì, các bạn gửi ở Bảng ghim trên website hoặc để lại bình luận.\n\nỞ video sau, Đốm sẽ giới thiệu chi tiết từng công cụ. Cảm ơn các bạn đã đồng hành cùng Tuấn và Đốm!\n\n#quantritute #congcumienphi #ketoan #nhansu",
   "tags": "công cụ miễn phí, công cụ cho kế toán, công cụ cho nhân sự, ứng dụng AI, AI cho dân văn phòng, Quản trị tử tế, quantritute",
   "note": "Tải lên mới. Chế độ hiển thị → Lên lịch → 19/10/2026, 19:00."
  },
  "facebook": {
   "caption": "AI ngày càng giỏi, nhưng công việc của mình đã thật sự nhanh hơn chưa? Mình đã có thêm thời gian cho gia đình chưa?\n\nTừ những gì trải nghiệm và quan sát được, Tuấn bắt tay xây một kho công cụ nhỏ:\n• Mỗi công cụ giải quyết đúng một việc\n• Không cần kiến thức AI cao siêu, mở ra là dùng\n• Miễn phí\n\nHiện kho đã có 2 công cụ cho các bạn làm kế toán, nhân sự:\n1. Cẩm nang tra cứu Thuế – Kế toán – Lao động\n2. Tạo văn bản hàng loạt\n\n🔗 Dùng thử: https://quantritute.com/cong-cu\n\nKho còn đang dang dở, Tuấn vẫn đang lắng nghe để hoàn thiện thêm. Các bạn cần công cụ cho việc gì, hãy để lại bình luận nhé. Ở bài sau, Đốm sẽ giới thiệu chi tiết từng công cụ. Cảm ơn các bạn!\n\n#quantritute #congcumienphi #ketoan #nhansu",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v02",
  "title": "Demo tạo văn bản hàng loạt",
  "date": "2026-10-20",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\2. Demo tạo văn bản hàng loạt 1410.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v02-tao-van-ban-hang-loat\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị hay phải làm hàng loạt loại văn bản nào: phiếu lương, giấy mời, giấy chứng nhận hay hợp đồng? Anh chị chia sẻ ở bình luận để Đốm làm video hướng dẫn đúng mẫu đó nhé.",
  "tiktok": {
   "caption": "Anh chị từng ngồi sửa tên, sửa số tiền trong từng tờ phiếu lương, từng giấy mời chưa? Mỏi tay mà vẫn sợ sai.\n\nĐốm xin giới thiệu công cụ Tạo văn bản hàng loạt. Anh chị chỉ cần 1 file mẫu và 1 danh sách Excel, công cụ sẽ xuất mỗi người một file, giữ nguyên phông chữ, bảng biểu, màu sắc như mẫu gốc.\n\n• Làm được với Word, Excel, PDF và ảnh\n• Mẫu cũ chưa đánh dấu, hay bản scan: anh chị kéo khung vào chỗ cần điền là được\n• Chạy ngay trên máy anh chị, file không bị gửi đi đâu\n• Hoàn toàn miễn phí\n\nLink chi tiết Đốm để ở phần Bio nhé. Anh chị dùng thử rồi chia sẻ cho Đốm cảm nhận và góp ý nha. Đốm cảm ơn anh chị!\n\n#quantritute #tronthuword #phieuluong #ketoan #nhansu",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\" (video chỉ có Đốm)"
  },
  "youtube": {
   "title": "Tạo phiếu lương, giấy mời hàng loạt từ 1 file mẫu + danh sách Excel | Miễn phí",
   "caption": "Anh chị từng ngồi sửa tên, sửa số tiền trong từng tờ phiếu lương, từng giấy mời chưa? Trong video này, Đốm dẫn anh chị làm thử một lượt với công cụ Tạo văn bản hàng loạt, từ đầu đến khi tải về, bằng bộ ví dụ có sẵn: phiếu lương của 8 nhân viên.\n\nCác bước:\n1. Chuẩn bị 1 file mẫu (chỗ cần điền ghi tên cột trong ngoặc vuông) và 1 danh sách Excel\n2. Ghép trường: công cụ tự nối từng chỗ trong mẫu với cột cùng tên; cột chưa khớp thì kéo thả, chọn luôn cách hiển thị ngày và số tiền\n3. Xem thử từng bản\n4. Xuất file: mỗi người một file, lưu thẳng vào thư mục\n\nĐiểm nổi bật:\n• Làm được với Word, Excel, PDF và ảnh\n• Mẫu cũ chưa đánh dấu hay bản scan: kéo khung vào chỗ cần điền, chữ cũ được xóa mà nền và hoa văn vẫn giữ nguyên\n• Giấy chứng nhận, thiệp mời thiết kế sẵn: xuất ra PDF hoặc ảnh là dùng được\n• Chạy ngay trên máy anh chị, file không bị gửi đi đâu\n• Hoàn toàn miễn phí\n\n🔗 Dùng thử: https://quantritute.com/cong-cu\n\nAnh chị dùng thử rồi chia sẻ cho Đốm cảm nhận hoặc góp ý để cải thiện tính năng nhé. Đốm cảm ơn anh chị nhiều!\n\n#quantritute #tronthuword #phieuluong #ketoan",
   "tags": "trộn thư, trộn thư word, mail merge, tạo văn bản hàng loạt, phiếu lương, giấy mời hàng loạt, kế toán, nhân sự, quantritute",
   "note": "Video này đã có trên YouTube ở chế độ Không công khai. Không tải lại: mở video có sẵn trong YouTube Studio, dán tiêu đề, mô tả, rồi Chế độ hiển thị → Lên lịch → 20/10/2026, 19:00. Giữ nguyên link vì công cụ đang nhúng video này."
  },
  "facebook": {
   "caption": "Anh chị từng ngồi sửa tên, sửa số tiền trong từng tờ phiếu lương, từng giấy mời chưa? Mỏi tay mà vẫn sợ sai.\n\nĐốm xin giới thiệu công cụ Tạo văn bản hàng loạt. Anh chị chỉ cần 1 file mẫu và 1 danh sách Excel, công cụ sẽ xuất mỗi người một file, giữ nguyên phông chữ, bảng biểu, màu sắc như mẫu gốc.\n\n• Làm được với Word, Excel, PDF và ảnh\n• Mẫu cũ chưa đánh dấu, hay bản scan: anh chị kéo khung vào chỗ cần điền là được\n• Giấy chứng nhận, thiệp mời: xuất ra PDF hoặc ảnh là dùng được\n• Chạy ngay trên máy anh chị, file không bị gửi đi đâu\n• Hoàn toàn miễn phí\n\n🔗 Dùng thử: https://quantritute.com/cong-cu\n\nAnh chị dùng thử rồi chia sẻ cho Đốm cảm nhận và góp ý nhé. Đốm cảm ơn anh chị!\n\n#quantritute #tronthuword #phieuluong #ketoan",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v03",
  "title": "Demo Cẩm nang tra cứu Thuế - Kế toán - Lao động",
  "date": "2026-10-21",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\3. Demo Cẩm nang tra cứu Thuế - Kế toán - Lao động.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v03-cam-nang-thue\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị hay phải tra cứu quy định nào nhất trong công việc? Anh chị chia sẻ ở bình luận để Đốm bổ sung vào Cẩm nang đúng chủ đề anh chị cần nhé.",
  "tiktok": {
   "caption": "Khách hỏi: \"Mặt hàng này có chịu thuế GTGT không?\" Anh chị mở luật, rồi lại lần sang nghị định, thông tư, mà luật thì đã sửa mấy lần...\n\nĐốm xin giới thiệu Cẩm nang tra cứu Thuế – Kế toán – Lao động, giúp anh chị tra Điều luật và văn bản hướng dẫn ngay trong một trang:\n• Đọc nguyên văn Điều luật, bấm vào Điều dẫn chiếu trong Nghị định, Thông tư là xem ngay bên cạnh\n• Tìm bằng từ khóa trong cả Luật, Nghị định, Thông tư\n• Bảng đối chiếu Luật – Nghị định – Thông tư theo từng chủ đề\n• Dòng thời gian hiệu lực, lịch sử sửa đổi\n• Đăng ký email để nhận thông báo khi có văn bản mới\n\nAnh chị dùng miễn phí, link chi tiết Đốm để ở phần Bio nhé.\nLưu ý: nội dung tổng hợp để tham khảo, anh chị vui lòng đối chiếu văn bản gốc trước khi áp dụng.\n\n#quantritute #thuegtgt #ketoanthue #luatthue #tracuuphapluat",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\" (video chỉ có Đốm)"
  },
  "youtube": {
   "title": "Tra Điều luật thuế & văn bản hướng dẫn trong một trang | Cẩm nang Thuế – Kế toán – Lao động",
   "caption": "Khách hỏi một câu về thuế, anh chị mở luật rồi lại phải lần sang nghị định, thông tư, mà luật thì đã sửa mấy lần? Trong video này, Đốm chỉ anh chị cách tra nhanh trong Cẩm nang tra cứu Thuế – Kế toán – Lao động (công cụ miễn phí của Quản trị tử tế), lấy ví dụ Điều 5 Luật Thuế GTGT số 48/2024/QH15 về đối tượng không chịu thuế.\n\nCác tính năng trong video:\n1. Tra cứu văn bản: đọc nguyên văn Điều luật; bấm vào các Điều dẫn chiếu (trong cùng luật, Nghị định 181, Thông tư 69) là xem ngay bên cạnh\n2. Tìm kiếm bằng từ khóa: ra cả Luật, Nghị định, Thông tư có chứa từ khóa, đoạn trích được tô sáng\n3. Bảng đối chiếu Luật – Nghị định – Thông tư theo từng chủ đề\n4. Dòng thời gian hiệu lực và lịch sử sửa đổi, kèm tình trạng hiệu lực của từng văn bản\n5. Đăng ký email để nhận thông báo khi có văn bản mới được rà soát\n6. Ghi nhớ nhanh, tự kiểm tra, hỏi đáp và 5 công cụ tương tác (như tính thuế thu nhập cá nhân, tra ngưỡng hóa đơn điện tử)\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu\n\nLưu ý: nội dung tổng hợp để tham khảo, anh chị vui lòng đối chiếu văn bản gốc trước khi áp dụng.\n\nAnh chị dùng thử rồi chia sẻ cho Đốm cảm nhận hoặc góp ý nhé. Đốm cảm ơn anh chị nhiều!\n\n#quantritute #thuegtgt #ketoanthue #luatthue",
   "tags": "thuế GTGT, luật thuế GTGT 2024, tra cứu văn bản pháp luật, kế toán thuế, nghị định 181, thông tư 69, cẩm nang thuế, quantritute",
   "note": "Video này đã có trên YouTube Shorts ở chế độ Không công khai: https://youtube.com/shorts/-S_ZZN7rNBw. Không tải lại: sửa tiêu đề, mô tả, rồi Lên lịch → 21/10/2026, 19:00."
  },
  "facebook": {
   "caption": "Khách hỏi: \"Mặt hàng này có chịu thuế GTGT không?\" Anh chị mở luật, rồi lại lần sang nghị định, thông tư, mà luật thì đã sửa mấy lần...\n\nĐốm xin giới thiệu Cẩm nang tra cứu Thuế – Kế toán – Lao động, giúp anh chị tra Điều luật và văn bản hướng dẫn ngay trong một trang:\n• Đọc nguyên văn Điều luật, bấm vào Điều dẫn chiếu trong Nghị định, Thông tư là xem ngay bên cạnh\n• Tìm bằng từ khóa trong cả Luật, Nghị định, Thông tư\n• Bảng đối chiếu Luật – Nghị định – Thông tư theo từng chủ đề\n• Dòng thời gian hiệu lực, lịch sử sửa đổi\n• Đăng ký email để nhận thông báo khi có văn bản mới\n\n🔗 Dùng miễn phí: https://quantritute.com/cong-cu\n\nLưu ý: nội dung tổng hợp để tham khảo, anh chị vui lòng đối chiếu văn bản gốc trước khi áp dụng. Anh chị dùng thử rồi góp ý cho Đốm nhé. Đốm cảm ơn anh chị!\n\n#quantritute #thuegtgt #ketoanthue #luatthue",
   "note": "Đăng dạng Reels."
  }
 }
];

/* Cột mới v1.18 – mỗi lệnh chạy riêng, cột đã có thì bỏ qua */
const ALTER_V2 = [
  `ALTER TABLE video_items ADD COLUMN plan_time TEXT NOT NULL DEFAULT '19:00'`,
  `ALTER TABLE video_items ADD COLUMN pin_comment TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE video_items ADD COLUMN pin_ok INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE video_posts ADD COLUMN tags TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE video_posts ADD COLUMN ok TEXT NOT NULL DEFAULT '{}'`,
];

async function migrateV2(env) {
  for (const s of ALTER_V2) { try { await env.DB.prepare(s).run(); } catch (e) { /* cột đã có */ } }
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v2'`).first('value')) return;
    const t = Date.now(), st = [];
    /* Bản YouTube "Không công khai" cũ chưa phải là đã đăng công khai → về "Chưa đăng" (giữ link) */
    st.push(env.DB.prepare(`UPDATE video_posts SET status = 'todo', updated_at = ?1 WHERE status = 'posted' AND privacy <> 'public'`).bind(t));
    st.push(env.DB.prepare(`UPDATE video_posts SET status = 'todo', updated_at = ?1 WHERE status = 'ready'`).bind(t));
    /* Video tên tạm (chưa sản xuất) bỏ khỏi lịch, nằm ở mục "Chưa xếp lịch" */
    st.push(env.DB.prepare(`UPDATE video_items SET plan_date = '', stage = 'edit', updated_at = ?1 WHERE instr(title, '(tên tạm)') > 0 AND code NOT IN ('v01','v02','v03','v04')`).bind(t));
    st.push(env.DB.prepare(`UPDATE video_items SET stage = 'edit' WHERE stage IN ('idea','script','shoot','voice','review')`));
    for (const v of SEED_V2) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, stage, plan_date, plan_time, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'saved', ?3, '19:00', ?4, ?5, ?6, '[]', ?7, ?7)`).bind(v.code, v.title, v.date, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET
          title = CASE WHEN instr(title, '(tên tạm)') > 0 OR title = '' THEN ?2 ELSE title END,
          stage = 'saved', plan_date = ?3, plan_time = '19:00',
          file_path = CASE WHEN file_path = '' THEN ?4 ELSE file_path END,
          thumb_path = ?5,
          pin_comment = CASE WHEN pin_comment = '' THEN ?6 ELSE pin_comment END, updated_at = ?7
        WHERE code = ?1`).bind(v.code, v.title, v.date, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET
            title = CASE WHEN title = '' THEN ?3 ELSE title END,
            caption = CASE WHEN caption = '' THEN ?4 ELSE caption END,
            tags = CASE WHEN tags = '' THEN ?5 ELSE tags END,
            note = CASE WHEN note = '' THEN ?6 ELSE note END, updated_at = ?7
          WHERE channel = ?2 AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v2', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v2', e); }
}


/* v05 (19/10/2026, anh duyệt 18:38): Giới thiệu công cụ tải & xử lý hóa đơn thuế – đăng T5 22/10/2026 19:00.
   Mã v05–v07 của dữ liệu khởi tạo cũ là ý tưởng "tên tạm" → đổi mã thành v05-tam… để giữ ý tưởng, nhường mã cho video thật. */
const SEED_V3 = [
 {
  "code": "v05",
  "title": "Giới thiệu công cụ tải & xử lý hóa đơn thuế",
  "date": "2026-10-22",
  "dur": "2:23",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\5. Giới thiệu công cụ tải & xử lý hóa đơn thuế.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v05-gioi-thieu-hoa-don-thue\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Các bạn đang mất nhiều thời gian nhất ở khâu nào với hóa đơn: tải, lập bảng kê, tờ khai hay nhập MISA? Các bạn chia sẻ ở bình luận để Tuấn và Đốm ưu tiên hướng dẫn chi tiết khâu đó nhé.",
  "tiktok": {
   "caption": "Cuối mỗi quý, các bạn kế toán vẫn đang tải từng hóa đơn một trên cổng thuế, rồi gõ lại sang Excel, sang tờ khai, sang phần mềm kế toán?\n\nTuấn và Đốm giới thiệu Bộ công cụ hóa đơn thuế, được hoàn thiện cùng sự kiểm thử và góp ý của một kế toán trưởng:\n• Tải hóa đơn hàng loạt trên cổng thuế theo khoảng thời gian tự chọn: mua vào, bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gọn trong 1 file ZIP\n• Bảng kê Excel: mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, tra cứu mẫu người bán\n• In bản gốc hoặc lưu PDF, giữ nguyên mã QR và chữ ký\n• Lập số liệu tờ khai GTGT mẫu 01/GTGT từ chính hóa đơn, kèm phụ lục giảm thuế\n• Tạo file nhập lên MISA: mua hàng, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n\nChạy ngay trên trình duyệt: hóa đơn không rời máy, không hỏi mật khẩu thuế, hoàn toàn miễn phí.\n\nLink chi tiết Tuấn và Đốm để ở phần Bio nhé. Các bạn dùng thử và góp ý giúp Tuấn và Đốm hoàn thiện thêm nhé!\n\n#quantritute #hoadondientu #ketoan #thuegtgt #misa",
   "note": "Xưng hô: Tuấn và Đốm · gọi người xem là \"các bạn\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Tải cả quý hóa đơn trên cổng thuế bằng 1 nút | Bảng kê, tờ khai GTGT, file nhập MISA – miễn phí",
   "caption": "Cuối mỗi quý, các bạn kế toán vẫn đang tải từng hóa đơn một trên cổng thuế, rồi gõ lại sang Excel, sang tờ khai, sang phần mềm kế toán?\n\nTuấn và Đốm giới thiệu Bộ công cụ hóa đơn thuế, được hoàn thiện cùng sự kiểm thử và góp ý của một kế toán trưởng:\n• Tải hóa đơn hàng loạt trên cổng thuế theo khoảng thời gian tự chọn: mua vào, bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gọn trong 1 file ZIP\n• Bảng kê Excel: mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, tra cứu mẫu người bán\n• In bản gốc hoặc lưu PDF, giữ nguyên mã QR và chữ ký\n• Lập số liệu tờ khai GTGT mẫu 01/GTGT từ chính hóa đơn, kèm phụ lục giảm thuế\n• Tạo file nhập lên MISA: mua hàng, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n\nChạy ngay trên trình duyệt: hóa đơn không rời máy, không hỏi mật khẩu thuế, hoàn toàn miễn phí.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh tải hóa đơn quay trên trang mô phỏng. Số liệu tờ khai và file nhập MISA để các bạn đối chiếu, kiểm tra lại trước khi nộp hoặc nhập.\n\nCác bạn dùng thử và góp ý ở bình luận giúp Tuấn và Đốm nhé. Cảm ơn các bạn!\n\n#quantritute #hoadondientu #ketoan #thuegtgt #misa",
   "tags": "hóa đơn điện tử, tải hóa đơn hàng loạt, cổng thuế, bảng kê hóa đơn, tờ khai GTGT, 01/GTGT, MISA, kế toán, quantritute",
   "note": "Tải lên mới (Shorts dọc 2:23). Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 22/10/2026, 19:00. Sau khi có link, dán vào Quản trị → Công cụ → Bộ công cụ hóa đơn thuế → Video demo."
  },
  "facebook": {
   "caption": "Cuối mỗi quý, các bạn kế toán vẫn đang tải từng hóa đơn một trên cổng thuế, rồi gõ lại sang Excel, sang tờ khai, sang phần mềm kế toán?\n\nTuấn và Đốm giới thiệu Bộ công cụ hóa đơn thuế, được hoàn thiện cùng sự kiểm thử và góp ý của một kế toán trưởng:\n• Tải hóa đơn hàng loạt trên cổng thuế theo khoảng thời gian tự chọn: mua vào, bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gọn trong 1 file ZIP\n• Bảng kê Excel: mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, tra cứu mẫu người bán\n• In bản gốc hoặc lưu PDF, giữ nguyên mã QR và chữ ký\n• Lập số liệu tờ khai GTGT mẫu 01/GTGT từ chính hóa đơn, kèm phụ lục giảm thuế\n• Tạo file nhập lên MISA: mua hàng, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n\nChạy ngay trên trình duyệt: hóa đơn không rời máy, không hỏi mật khẩu thuế, hoàn toàn miễn phí.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nCác bạn dùng thử và góp ý ở bình luận giúp Tuấn và Đốm hoàn thiện thêm nhé. Cảm ơn các bạn!\n\n#quantritute #hoadondientu #ketoan #thuegtgt #misa",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV3(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v3'`).first('value')) return;
    const t = Date.now(), st = [];
    st.push(env.DB.prepare(`UPDATE video_items SET code = code || '-tam', updated_at = ?1 WHERE code IN ('v05','v06','v07') AND instr(title, '(tên tạm)') > 0`).bind(t));
    for (const v of SEED_V3) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET
            title = CASE WHEN title = '' THEN ?3 ELSE title END,
            caption = CASE WHEN caption = '' THEN ?4 ELSE caption END,
            tags = CASE WHEN tags = '' THEN ?5 ELSE tags END,
            note = CASE WHEN note = '' THEN ?6 ELSE note END, updated_at = ?7
          WHERE channel = ?2 AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v3', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v3', e); }
}

/* v06 (19/10/2026, anh duyệt 20:54): Tải hàng loạt hóa đơn bằng 1 nút – đăng T6 23/10/2026 19:00. */
const SEED_V4 = [
 {
  "code": "v06",
  "title": "Tải hàng loạt hóa đơn bằng 1 nút",
  "date": "2026-10-23",
  "dur": "1:40",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\6. Tải hàng loạt hóa đơn bằng 1 nút.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v06-tai-ca-quy-hoa-don\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị thường tải hóa đơn theo tháng hay theo quý? Có bước nào trong video anh chị muốn Đốm hướng dẫn kỹ hơn không ạ?",
  "tiktok": {
   "caption": "Mỗi kỳ kê khai, anh chị vẫn vào trang thuế tải từng hóa đơn một?\n\nĐốm hướng dẫn tải hàng loạt hóa đơn bằng 1 nút, theo đúng khoảng ngày anh chị cần:\n① Cài nút \"Tải HĐ hàng loạt\" lên thanh dấu trang Chrome (làm 1 lần)\n② Đăng nhập trang hóa đơn điện tử như thường ngày, bấm nút\n③ Chọn mua vào/bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gõ khoảng ngày\n④ Bấm Tìm: kỳ dài hơn 1 tháng, công cụ tự chia theo tháng và nhắc \"Quét lại 1 lượt\"\n⑤ Bấm Tải: nhận 1 file ZIP gồm XML, bảng kê Excel, gói gốc\n\nKhông hỏi mật khẩu thuế, xử lý ngay trên máy anh chị, miễn phí.\n\nLink chi tiết Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Tải hàng loạt hóa đơn điện tử bằng 1 nút | Theo khoảng ngày tùy chọn, 1 file ZIP – miễn phí",
   "caption": "Mỗi kỳ kê khai, anh chị vẫn vào trang thuế tải từng hóa đơn một?\n\nĐốm hướng dẫn tải hàng loạt hóa đơn bằng 1 nút, theo đúng khoảng ngày anh chị cần:\n① Cài nút \"Tải HĐ hàng loạt\" lên thanh dấu trang Chrome (làm 1 lần)\n② Đăng nhập trang hóa đơn điện tử như thường ngày, bấm nút\n③ Chọn mua vào/bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gõ khoảng ngày\n④ Bấm Tìm: kỳ dài hơn 1 tháng, công cụ tự chia theo tháng và nhắc \"Quét lại 1 lượt\"\n⑤ Bấm Tải: nhận 1 file ZIP gồm XML, bảng kê Excel, gói gốc\n\nKhông hỏi mật khẩu thuế, xử lý ngay trên máy anh chị, miễn phí.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh trên trang thuế quay ở trang mô phỏng.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt",
   "tags": "tải hóa đơn hàng loạt, hóa đơn điện tử, cổng thuế, hóa đơn máy tính tiền, file XML hóa đơn, bảng kê hóa đơn, kế toán, quantritute",
   "note": "Shorts dọc 1:40. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 23/10/2026, 19:00."
  },
  "facebook": {
   "caption": "Mỗi kỳ kê khai, anh chị vẫn vào trang thuế tải từng hóa đơn một?\n\nĐốm hướng dẫn tải hàng loạt hóa đơn bằng 1 nút, theo đúng khoảng ngày anh chị cần:\n① Cài nút \"Tải HĐ hàng loạt\" lên thanh dấu trang Chrome (làm 1 lần)\n② Đăng nhập trang hóa đơn điện tử như thường ngày, bấm nút\n③ Chọn mua vào/bán ra, hóa đơn điện tử và hóa đơn máy tính tiền, gõ khoảng ngày\n④ Bấm Tìm: kỳ dài hơn 1 tháng, công cụ tự chia theo tháng và nhắc \"Quét lại 1 lượt\"\n⑤ Bấm Tải: nhận 1 file ZIP gồm XML, bảng kê Excel, gói gốc\n\nKhông hỏi mật khẩu thuế, xử lý ngay trên máy anh chị, miễn phí.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh trên trang thuế quay ở trang mô phỏng.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV4(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v4'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V4) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET
            title = CASE WHEN title = '' THEN ?3 ELSE title END,
            caption = CASE WHEN caption = '' THEN ?4 ELSE caption END,
            tags = CASE WHEN tags = '' THEN ?5 ELSE tags END,
            note = CASE WHEN note = '' THEN ?6 ELSE note END, updated_at = ?7
          WHERE channel = ?2 AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v4', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v4', e); }
}

/* v07 (20/10/2026, anh duyệt 09:54): Chuyển đổi hàng loạt XML sang file Excel – đăng T7 24/10/2026 19:00. */
const SEED_V5 = [
 {
  "code": "v07",
  "title": "Chuyển đổi hàng loạt XML sang file Excel",
  "date": "2026-10-24",
  "dur": "1:41",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\7. Chuyển đổi hàng loạt XML sang file Excel.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v07-zip-ra-bang-ke\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Mỗi kỳ kê khai, anh chị đối chiếu hóa đơn trên Excel hay trên phần mềm kế toán ạ? Bảng nào trong 6 bảng anh chị thấy cần nhất?",
  "tiktok": {
   "caption": "Có cả trăm file XML hóa đơn mua vào, bán ra, mà vẫn phải mở từng file chép sang Excel?\n\nĐốm hướng dẫn chuyển đổi hàng loạt XML sang file Excel, kèm kiểm tra từng hóa đơn:\n① Kéo thả cùng lúc file ZIP mua vào, bán ra (nhận cả XML lẻ, gói ZIP tải tay từ trang thuế)\n② Xem nhanh số hóa đơn, dòng hàng hóa, tổng tiền\n③ Mục \"Cần xem lại\": hóa đơn không có XML gốc, hóa đơn trùng (tự bỏ), hóa đơn bị hủy/thay thế (không cộng vào tổng)\n④ Xem từng bảng: bảng kê mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, gộp một bảng, tra cứu mẫu người bán\n→ Xuất Excel: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài.\n\nLink chi tiết Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Chuyển đổi hàng loạt XML hóa đơn sang file Excel | Tự báo hóa đơn cần xem lại – miễn phí",
   "caption": "Có cả trăm file XML hóa đơn mua vào, bán ra, mà vẫn phải mở từng file chép sang Excel?\n\nĐốm hướng dẫn chuyển đổi hàng loạt XML sang file Excel, kèm kiểm tra từng hóa đơn:\n① Kéo thả cùng lúc file ZIP mua vào, bán ra (nhận cả XML lẻ, gói ZIP tải tay từ trang thuế)\n② Xem nhanh số hóa đơn, dòng hàng hóa, tổng tiền\n③ Mục \"Cần xem lại\": hóa đơn không có XML gốc, hóa đơn trùng (tự bỏ), hóa đơn bị hủy/thay thế (không cộng vào tổng)\n④ Xem từng bảng: bảng kê mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, gộp một bảng, tra cứu mẫu người bán\n→ Xuất Excel: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan",
   "tags": "chuyển XML sang Excel, đọc file XML hóa đơn, bảng kê hóa đơn, hóa đơn điện tử, tổng hợp thuế suất, kế toán, kê khai thuế GTGT, quantritute",
   "note": "Shorts dọc 1:41. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 24/10/2026, 19:00."
  },
  "facebook": {
   "caption": "Có cả trăm file XML hóa đơn mua vào, bán ra, mà vẫn phải mở từng file chép sang Excel?\n\nĐốm hướng dẫn chuyển đổi hàng loạt XML sang file Excel, kèm kiểm tra từng hóa đơn:\n① Kéo thả cùng lúc file ZIP mua vào, bán ra (nhận cả XML lẻ, gói ZIP tải tay từ trang thuế)\n② Xem nhanh số hóa đơn, dòng hàng hóa, tổng tiền\n③ Mục \"Cần xem lại\": hóa đơn không có XML gốc, hóa đơn trùng (tự bỏ), hóa đơn bị hủy/thay thế (không cộng vào tổng)\n④ Xem từng bảng: bảng kê mua vào, bán ra, chi tiết hàng hóa, tổng hợp thuế suất, gộp một bảng, tra cứu mẫu người bán\n→ Xuất Excel: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV5(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v5'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V5) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET
            title = CASE WHEN title = '' THEN ?3 ELSE title END,
            caption = CASE WHEN caption = '' THEN ?4 ELSE caption END,
            tags = CASE WHEN tags = '' THEN ?5 ELSE tags END,
            note = CASE WHEN note = '' THEN ?6 ELSE note END, updated_at = ?7
          WHERE channel = ?2 AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v5', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v5', e); }
}

const SEED_V6 = [
 {
  "code": "v08",
  "title": "Tạo tờ khai 01/GTGT tự động",
  "date": "2026-10-25",
  "dur": "2:20",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\8. Tạo tờ khai 01-GTGT tự động.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v08-to-khai-01gtgt\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị đang lập tờ khai GTGT từ bảng kê Excel hay từ phần mềm kế toán ạ? Bước nào anh chị thấy tốn thời gian nhất?",
  "tiktok": {
   "caption": "Mùa kê khai thuế GTGT, vẫn phải cộng tay từng hóa đơn để ra số liệu tờ khai?\n\nĐốm hướng dẫn tạo tờ khai 01/GTGT tự động từ chính hóa đơn điện tử:\n① Mở thẻ Tờ khai thuế – dùng luôn hóa đơn đã nạp\n② Chọn kỳ khai (quý/tháng) và mẫu: Thông tư 89, hoặc Thông tư 80 nếu hệ thống kế toán chưa cập nhật mẫu mới\n③ Xem nhanh thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n④ Nhập chỉ tiêu hóa đơn không có, như [22] lấy từ [43] kỳ trước – số đã nhập được nhớ theo kỳ\n⑤ \"Cần xem lại trước khi khai\": hóa đơn không có XML gốc → tải XML bổ sung, hoặc sửa thuế suất gợi ý rồi bấm ✓\n⑥ Thông tin ghi trên file XML tờ khai: gõ một lần, công cụ tự nhớ; hoặc lấy từ XML tờ khai kỳ trước\n⑦ Tải Excel (tờ khai, bảng kê bán ra, mua vào, phụ lục giảm thuế NQ 204) và file XML tờ khai\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài. Anh chị nhớ đối chiếu với sổ sách trước khi ký nộp.\n\nLink chi tiết Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Tạo tờ khai thuế GTGT 01/GTGT tự động từ hóa đơn điện tử | Có phụ lục NQ 204 – miễn phí",
   "caption": "Mùa kê khai thuế GTGT, vẫn phải cộng tay từng hóa đơn để ra số liệu tờ khai?\n\nĐốm hướng dẫn tạo tờ khai 01/GTGT tự động từ chính hóa đơn điện tử:\n① Mở thẻ Tờ khai thuế – dùng luôn hóa đơn đã nạp\n② Chọn kỳ khai (quý/tháng) và mẫu: Thông tư 89, hoặc Thông tư 80 nếu hệ thống kế toán chưa cập nhật mẫu mới\n③ Xem nhanh thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n④ Nhập chỉ tiêu hóa đơn không có, như [22] lấy từ [43] kỳ trước – số đã nhập được nhớ theo kỳ\n⑤ \"Cần xem lại trước khi khai\": hóa đơn không có XML gốc → tải XML bổ sung, hoặc sửa thuế suất gợi ý rồi bấm ✓\n⑥ Thông tin ghi trên file XML tờ khai: gõ một lần, công cụ tự nhớ; hoặc lấy từ XML tờ khai kỳ trước\n⑦ Tải Excel (tờ khai, bảng kê bán ra, mua vào, phụ lục giảm thuế NQ 204) và file XML tờ khai\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài. Công cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; thông tin người ký, cơ quan thuế là thông tin ví dụ minh họa; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan",
   "tags": "tờ khai 01/GTGT, tờ khai thuế GTGT, kê khai thuế GTGT quý, phụ lục giảm thuế NQ 204, Thông tư 89/2026, hóa đơn điện tử, kế toán thuế, quantritute",
   "note": "Shorts dọc 2:20 (dài hơn 60s – YouTube vẫn nhận Shorts đến 3 phút). Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 25/10/2026, 19:00."
  },
  "facebook": {
   "caption": "Mùa kê khai thuế GTGT, vẫn phải cộng tay từng hóa đơn để ra số liệu tờ khai?\n\nĐốm hướng dẫn tạo tờ khai 01/GTGT tự động từ chính hóa đơn điện tử:\n① Mở thẻ Tờ khai thuế – dùng luôn hóa đơn đã nạp\n② Chọn kỳ khai (quý/tháng) và mẫu: Thông tư 89, hoặc Thông tư 80 nếu hệ thống kế toán chưa cập nhật mẫu mới\n③ Xem nhanh thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n④ Nhập chỉ tiêu hóa đơn không có, như [22] lấy từ [43] kỳ trước – số đã nhập được nhớ theo kỳ\n⑤ \"Cần xem lại trước khi khai\": hóa đơn không có XML gốc → tải XML bổ sung, hoặc sửa thuế suất gợi ý rồi bấm ✓\n⑥ Thông tin ghi trên file XML tờ khai: gõ một lần, công cụ tự nhớ; hoặc lấy từ XML tờ khai kỳ trước\n⑦ Tải Excel (tờ khai, bảng kê bán ra, mua vào, phụ lục giảm thuế NQ 204) và file XML tờ khai\n\nMiễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài. Công cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; thông tin người ký, cơ quan thuế là thông tin ví dụ minh họa; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV6(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v6'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V6) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET
            title = CASE WHEN title = '' THEN ?3 ELSE title END,
            caption = CASE WHEN caption = '' THEN ?4 ELSE caption END,
            tags = CASE WHEN tags = '' THEN ?5 ELSE tags END,
            note = CASE WHEN note = '' THEN ?6 ELSE note END, updated_at = ?7
          WHERE channel = ?2 AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v6', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v6', e); }
}

/* v06–v09 (20/10/2026, anh duyệt 15:42): gộp thành series "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn" Phần 1–4 – đổi tên, nội dung 3 kênh (chỉ bài chưa đăng), thumbnail mới; thêm v09 đăng T2 26/10/2026 19:00. */
const SEED_V7 = [
 {
  "code": "v06",
  "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1: Tải hàng loạt hóa đơn",
  "date": "2026-10-23",
  "dur": "1:40",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\6. Tải hàng loạt hóa đơn bằng 1 nút.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v06-tai-ca-quy-hoa-don\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị thường tải hóa đơn theo tháng hay theo quý? Có bước nào trong video anh chị muốn Đốm hướng dẫn kỹ hơn không ạ?",
  "tiktok": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1/4: Tải hàng loạt hóa đơn\n\nCuối kỳ kê khai, việc tốn thời gian nhất thường không phải là làm số, mà là ngồi tải từng hóa đơn trên trang thuế.\n\nVới tính năng Tải hàng loạt hóa đơn, anh chị được:\n✔ Đỡ hẳn việc bấm tải từng hóa đơn: chọn khoảng ngày, bấm một nút, nhận hóa đơn mua vào hoặc bán ra gọn trong 1 file ZIP\n✔ Chọn cả quý cũng được: công cụ tự chia theo tháng, quét nhiều lượt và nhắc khi nên quét lại, để hạn chế sót hóa đơn\n✔ Có sẵn bảng kê Excel và file XML ngay trong gói tải về, dùng luôn cho các bước sau\n✔ Yên tâm về dữ liệu: dùng phiên đăng nhập sẵn có, không hỏi mật khẩu thuế, hóa đơn không rời máy anh chị\n✔ Cài nút một lần, không cần đăng ký, hoàn toàn miễn phí\n\nThời gian tiết kiệm được, anh chị dành cho việc kiểm tra số liệu – phần thật sự cần đến chuyên môn của kế toán.\n\n▶ Phần tiếp theo – Phần 2: Chuyển XML sang Excel\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt #botcongcuhoadon",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1/4: Tải hàng loạt hóa đơn điện tử bằng 1 nút",
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1/4: Tải hàng loạt hóa đơn\n\nCuối kỳ kê khai, việc tốn thời gian nhất thường không phải là làm số, mà là ngồi tải từng hóa đơn trên trang thuế.\n\nVới tính năng Tải hàng loạt hóa đơn, anh chị được:\n✔ Đỡ hẳn việc bấm tải từng hóa đơn: chọn khoảng ngày, bấm một nút, nhận hóa đơn mua vào hoặc bán ra gọn trong 1 file ZIP\n✔ Chọn cả quý cũng được: công cụ tự chia theo tháng, quét nhiều lượt và nhắc khi nên quét lại, để hạn chế sót hóa đơn\n✔ Có sẵn bảng kê Excel và file XML ngay trong gói tải về, dùng luôn cho các bước sau\n✔ Yên tâm về dữ liệu: dùng phiên đăng nhập sẵn có, không hỏi mật khẩu thuế, hóa đơn không rời máy anh chị\n✔ Cài nút một lần, không cần đăng ký, hoàn toàn miễn phí\n\nThời gian tiết kiệm được, anh chị dành cho việc kiểm tra số liệu – phần thật sự cần đến chuyên môn của kế toán.\n\n▶ Phần tiếp theo – Phần 2: Chuyển XML sang Excel\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh trên trang thuế quay ở trang mô phỏng.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt #botcongcuhoadon",
   "tags": "tải hóa đơn hàng loạt, hóa đơn điện tử, cổng thuế, hóa đơn máy tính tiền, file XML hóa đơn, bảng kê hóa đơn, kế toán, quantritute",
   "note": "Shorts dọc 1:40. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 23/10/2026, 19:00. Thêm vào danh sách phát \"Hướng dẫn tính năng bộ công cụ xử lý hóa đơn\" (tạo 1 lần ở Phần 1)."
  },
  "facebook": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1/4: Tải hàng loạt hóa đơn\n\nCuối kỳ kê khai, việc tốn thời gian nhất thường không phải là làm số, mà là ngồi tải từng hóa đơn trên trang thuế.\n\nVới tính năng Tải hàng loạt hóa đơn, anh chị được:\n✔ Đỡ hẳn việc bấm tải từng hóa đơn: chọn khoảng ngày, bấm một nút, nhận hóa đơn mua vào hoặc bán ra gọn trong 1 file ZIP\n✔ Chọn cả quý cũng được: công cụ tự chia theo tháng, quét nhiều lượt và nhắc khi nên quét lại, để hạn chế sót hóa đơn\n✔ Có sẵn bảng kê Excel và file XML ngay trong gói tải về, dùng luôn cho các bước sau\n✔ Yên tâm về dữ liệu: dùng phiên đăng nhập sẵn có, không hỏi mật khẩu thuế, hóa đơn không rời máy anh chị\n✔ Cài nút một lần, không cần đăng ký, hoàn toàn miễn phí\n\nThời gian tiết kiệm được, anh chị dành cho việc kiểm tra số liệu – phần thật sự cần đến chuyên môn của kế toán.\n\n▶ Phần tiếp theo – Phần 2: Chuyển XML sang Excel\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh trên trang thuế quay ở trang mô phỏng.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #taihoadon #ketoan #thuegtgt #botcongcuhoadon",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v07",
  "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 2: Chuyển XML sang Excel",
  "date": "2026-10-24",
  "dur": "1:41",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\7. Chuyển đổi hàng loạt XML sang file Excel.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v07-zip-ra-bang-ke\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Mỗi kỳ kê khai, anh chị đối chiếu hóa đơn trên Excel hay trên phần mềm kế toán ạ? Bảng nào trong 6 bảng anh chị thấy cần nhất?",
  "tiktok": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 2/4: Chuyển XML sang Excel\n\nFile XML hóa đơn có đủ thông tin, nhưng mở ra đọc thì rất khó, còn chép tay sang Excel lại dễ sai.\n\nVới tính năng Chuyển XML sang Excel, anh chị được:\n✔ Kéo thả cả file ZIP hay hàng trăm file XML cùng lúc, có ngay bảng kê Excel mua vào, bán ra\n✔ Biết ngay hóa đơn nào cần xem lại: hóa đơn trùng được tự bỏ, hóa đơn bị hủy hoặc thay thế không cộng vào tổng, hóa đơn không có XML gốc được đánh dấu riêng\n✔ Có sẵn các bảng hay dùng: chi tiết hàng hóa, tổng hợp theo thuế suất, tra cứu mẫu người bán\n✔ File Excel dùng được ngay: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n✔ Xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài, miễn phí\n\nBớt được phần chép số, anh chị có thêm thời gian để đối chiếu và soát lỗi.\n\n◀ Phần trước – Phần 1: Tải hàng loạt hóa đơn\n▶ Phần tiếp theo – Phần 3: Tạo tờ khai 01/GTGT\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan #botcongcuhoadon",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 2/4: Chuyển hàng loạt XML hóa đơn sang Excel",
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 2/4: Chuyển XML sang Excel\n\nFile XML hóa đơn có đủ thông tin, nhưng mở ra đọc thì rất khó, còn chép tay sang Excel lại dễ sai.\n\nVới tính năng Chuyển XML sang Excel, anh chị được:\n✔ Kéo thả cả file ZIP hay hàng trăm file XML cùng lúc, có ngay bảng kê Excel mua vào, bán ra\n✔ Biết ngay hóa đơn nào cần xem lại: hóa đơn trùng được tự bỏ, hóa đơn bị hủy hoặc thay thế không cộng vào tổng, hóa đơn không có XML gốc được đánh dấu riêng\n✔ Có sẵn các bảng hay dùng: chi tiết hàng hóa, tổng hợp theo thuế suất, tra cứu mẫu người bán\n✔ File Excel dùng được ngay: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n✔ Xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài, miễn phí\n\nBớt được phần chép số, anh chị có thêm thời gian để đối chiếu và soát lỗi.\n\n◀ Phần trước – Phần 1: Tải hàng loạt hóa đơn\n▶ Phần tiếp theo – Phần 3: Tạo tờ khai 01/GTGT\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan #botcongcuhoadon",
   "tags": "chuyển XML sang Excel, đọc file XML hóa đơn, bảng kê hóa đơn, hóa đơn điện tử, tổng hợp thuế suất, kế toán, kê khai thuế GTGT, quantritute",
   "note": "Shorts dọc 1:41. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 24/10/2026, 19:00. Thêm vào danh sách phát \"Hướng dẫn tính năng bộ công cụ xử lý hóa đơn\" (tạo 1 lần ở Phần 1)."
  },
  "facebook": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 2/4: Chuyển XML sang Excel\n\nFile XML hóa đơn có đủ thông tin, nhưng mở ra đọc thì rất khó, còn chép tay sang Excel lại dễ sai.\n\nVới tính năng Chuyển XML sang Excel, anh chị được:\n✔ Kéo thả cả file ZIP hay hàng trăm file XML cùng lúc, có ngay bảng kê Excel mua vào, bán ra\n✔ Biết ngay hóa đơn nào cần xem lại: hóa đơn trùng được tự bỏ, hóa đơn bị hủy hoặc thay thế không cộng vào tổng, hóa đơn không có XML gốc được đánh dấu riêng\n✔ Có sẵn các bảng hay dùng: chi tiết hàng hóa, tổng hợp theo thuế suất, tra cứu mẫu người bán\n✔ File Excel dùng được ngay: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc\n✔ Xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài, miễn phí\n\nBớt được phần chép số, anh chị có thêm thời gian để đối chiếu và soát lỗi.\n\n◀ Phần trước – Phần 1: Tải hàng loạt hóa đơn\n▶ Phần tiếp theo – Phần 3: Tạo tờ khai 01/GTGT\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #hoadondientu #xmlsangexcel #bangkehoadon #ketoan #botcongcuhoadon",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v08",
  "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 3: Tạo tờ khai 01/GTGT",
  "date": "2026-10-25",
  "dur": "2:20",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\8. Tạo tờ khai 01-GTGT tự động.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v08-to-khai-01gtgt\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị đang lập tờ khai GTGT từ bảng kê Excel hay từ phần mềm kế toán ạ? Bước nào anh chị thấy tốn thời gian nhất?",
  "tiktok": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 3/4: Tạo tờ khai 01/GTGT\n\nĐến kỳ kê khai thuế GTGT, cộng tay từng hóa đơn theo từng thuế suất vừa lâu vừa dễ lệch.\n\nVới tính năng Tạo tờ khai 01/GTGT, anh chị được:\n✔ Số liệu tờ khai tính sẵn từ chính hóa đơn: thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n✔ Tách theo từng thuế suất, trừ chiết khấu thương mại, kèm phụ lục giảm thuế theo Nghị quyết 204\n✔ Được nhắc trước những hóa đơn cần lưu ý, như hóa đơn không có XML gốc\n✔ Chỉ tiêu tự nhập (như [22] lấy từ kỳ trước) và thông tin người nộp chỉ gõ một lần, công cụ tự nhớ\n✔ Chọn mẫu theo Thông tư 89 hoặc Thông tư 80; tải ra Excel (tờ khai, bảng kê, phụ lục) và file XML tờ khai\n✔ Miễn phí, xử lý ngay trên máy anh chị\n\nCông cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.\n\n◀ Phần trước – Phần 2: Chuyển XML sang Excel\n▶ Phần tiếp theo – Phần 4: Tạo sẵn file nhập lên MISA\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan #botcongcuhoadon",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 3/4: Tạo tờ khai 01/GTGT tự động từ hóa đơn",
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 3/4: Tạo tờ khai 01/GTGT\n\nĐến kỳ kê khai thuế GTGT, cộng tay từng hóa đơn theo từng thuế suất vừa lâu vừa dễ lệch.\n\nVới tính năng Tạo tờ khai 01/GTGT, anh chị được:\n✔ Số liệu tờ khai tính sẵn từ chính hóa đơn: thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n✔ Tách theo từng thuế suất, trừ chiết khấu thương mại, kèm phụ lục giảm thuế theo Nghị quyết 204\n✔ Được nhắc trước những hóa đơn cần lưu ý, như hóa đơn không có XML gốc\n✔ Chỉ tiêu tự nhập (như [22] lấy từ kỳ trước) và thông tin người nộp chỉ gõ một lần, công cụ tự nhớ\n✔ Chọn mẫu theo Thông tư 89 hoặc Thông tư 80; tải ra Excel (tờ khai, bảng kê, phụ lục) và file XML tờ khai\n✔ Miễn phí, xử lý ngay trên máy anh chị\n\nCông cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.\n\n◀ Phần trước – Phần 2: Chuyển XML sang Excel\n▶ Phần tiếp theo – Phần 4: Tạo sẵn file nhập lên MISA\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; thông tin người ký, cơ quan thuế là thông tin ví dụ minh họa; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan #botcongcuhoadon",
   "tags": "tờ khai 01/GTGT, tờ khai thuế GTGT, kê khai thuế GTGT quý, phụ lục giảm thuế NQ 204, Thông tư 89/2026, hóa đơn điện tử, kế toán thuế, quantritute",
   "note": "Shorts dọc 2:20 (dài hơn 60s – YouTube vẫn nhận Shorts đến 3 phút). Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 25/10/2026, 19:00. Thêm vào danh sách phát \"Hướng dẫn tính năng bộ công cụ xử lý hóa đơn\" (tạo 1 lần ở Phần 1)."
  },
  "facebook": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 3/4: Tạo tờ khai 01/GTGT\n\nĐến kỳ kê khai thuế GTGT, cộng tay từng hóa đơn theo từng thuế suất vừa lâu vừa dễ lệch.\n\nVới tính năng Tạo tờ khai 01/GTGT, anh chị được:\n✔ Số liệu tờ khai tính sẵn từ chính hóa đơn: thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp\n✔ Tách theo từng thuế suất, trừ chiết khấu thương mại, kèm phụ lục giảm thuế theo Nghị quyết 204\n✔ Được nhắc trước những hóa đơn cần lưu ý, như hóa đơn không có XML gốc\n✔ Chỉ tiêu tự nhập (như [22] lấy từ kỳ trước) và thông tin người nộp chỉ gõ một lần, công cụ tự nhớ\n✔ Chọn mẫu theo Thông tư 89 hoặc Thông tư 80; tải ra Excel (tờ khai, bảng kê, phụ lục) và file XML tờ khai\n✔ Miễn phí, xử lý ngay trên máy anh chị\n\nCông cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.\n\n◀ Phần trước – Phần 2: Chuyển XML sang Excel\n▶ Phần tiếp theo – Phần 4: Tạo sẵn file nhập lên MISA\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; thông tin người ký, cơ quan thuế là thông tin ví dụ minh họa; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #tokhaithue #thueGTGT #hoadondientu #ketoan #botcongcuhoadon",
   "note": "Đăng dạng Reels."
  }
 },
 {
  "code": "v09",
  "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 4: Tạo sẵn file nhập lên MISA",
  "date": "2026-10-26",
  "dur": "1:08",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\9. Tạo sẵn file nhập lên MISA.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v09-file-nhap-misa\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị đang nhập chứng từ mua vào lên MISA bằng tay hay bằng file Excel ạ? Loại chứng từ nào anh chị muốn Đốm hướng dẫn kỹ hơn?",
  "tiktok": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 4/4: Tạo sẵn file nhập lên MISA\n\nĐã có đủ hóa đơn trong tay, nhưng nhập lại từng chứng từ vào MISA vẫn tốn cả buổi và dễ gõ nhầm.\n\nVới tính năng Tạo file nhập lên MISA, anh chị được:\n✔ Bớt việc gõ tay: chứng từ được dựng sẵn từ hóa đơn theo mẫu nhập khẩu của MISA – mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n✔ Đỡ lo trùng nhà cung cấp: tải lên danh mục từ MISA, công cụ đối chiếu mã số thuế và tự điền mã; nhà cung cấp mới có sẵn file danh mục để nhập trước\n✔ Đỡ phân loại từng món: ăn uống, xăng dầu, phí ngân hàng được gợi ý là nghiệp vụ khác, không cần tạo mã hàng – anh chị chỉ rà lại và xác nhận\n✔ Biết trước chỗ còn thiếu: ô thông tin bắt buộc còn trống được liệt kê để bổ sung trước khi nhập\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài\n\nAnh chị nên nhập thử vài chứng từ trước khi nhập cả kỳ. Tính năng này được nhiều anh chị kế toán quan tâm, Đốm đang tiếp tục tối ưu để dễ dùng và tiện hơn nữa.\n\n◀ Phần trước – Phần 3: Tạo tờ khai 01/GTGT\nĐây là phần cuối của series. Anh chị xem đủ 4 phần trên kênh để đi trọn quy trình: tải hóa đơn → bảng kê Excel → tờ khai 01/GTGT → file nhập MISA.\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #misa #hoadondientu #ketoan #phanmemketoan #botcongcuhoadon",
   "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."
  },
  "youtube": {
   "title": "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 4/4: Tạo sẵn file nhập lên MISA từ hóa đơn",
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 4/4: Tạo sẵn file nhập lên MISA\n\nĐã có đủ hóa đơn trong tay, nhưng nhập lại từng chứng từ vào MISA vẫn tốn cả buổi và dễ gõ nhầm.\n\nVới tính năng Tạo file nhập lên MISA, anh chị được:\n✔ Bớt việc gõ tay: chứng từ được dựng sẵn từ hóa đơn theo mẫu nhập khẩu của MISA – mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n✔ Đỡ lo trùng nhà cung cấp: tải lên danh mục từ MISA, công cụ đối chiếu mã số thuế và tự điền mã; nhà cung cấp mới có sẵn file danh mục để nhập trước\n✔ Đỡ phân loại từng món: ăn uống, xăng dầu, phí ngân hàng được gợi ý là nghiệp vụ khác, không cần tạo mã hàng – anh chị chỉ rà lại và xác nhận\n✔ Biết trước chỗ còn thiếu: ô thông tin bắt buộc còn trống được liệt kê để bổ sung trước khi nhập\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài\n\nAnh chị nên nhập thử vài chứng từ trước khi nhập cả kỳ. Tính năng này được nhiều anh chị kế toán quan tâm, Đốm đang tiếp tục tối ưu để dễ dùng và tiện hơn nữa.\n\n◀ Phần trước – Phần 3: Tạo tờ khai 01/GTGT\nĐây là phần cuối của series. Anh chị xem đủ 4 phần trên kênh để đi trọn quy trình: tải hóa đơn → bảng kê Excel → tờ khai 01/GTGT → file nhập MISA.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; tài khoản 6422 là ví dụ minh họa; chi tiết phần bán ra đã được làm mờ.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #misa #hoadondientu #ketoan #phanmemketoan #botcongcuhoadon",
   "tags": "file nhập MISA, MISA AMIS, nhập khẩu chứng từ MISA, hóa đơn điện tử, nghiệp vụ khác, danh mục nhà cung cấp, kế toán, quantritute",
   "note": "Shorts dọc 1:08. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 26/10/2026, 19:00. Thêm vào danh sách phát \"Hướng dẫn tính năng bộ công cụ xử lý hóa đơn\" (tạo 1 lần ở Phần 1)."
  },
  "facebook": {
   "caption": "📚 Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 4/4: Tạo sẵn file nhập lên MISA\n\nĐã có đủ hóa đơn trong tay, nhưng nhập lại từng chứng từ vào MISA vẫn tốn cả buổi và dễ gõ nhầm.\n\nVới tính năng Tạo file nhập lên MISA, anh chị được:\n✔ Bớt việc gõ tay: chứng từ được dựng sẵn từ hóa đơn theo mẫu nhập khẩu của MISA – mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ\n✔ Đỡ lo trùng nhà cung cấp: tải lên danh mục từ MISA, công cụ đối chiếu mã số thuế và tự điền mã; nhà cung cấp mới có sẵn file danh mục để nhập trước\n✔ Đỡ phân loại từng món: ăn uống, xăng dầu, phí ngân hàng được gợi ý là nghiệp vụ khác, không cần tạo mã hàng – anh chị chỉ rà lại và xác nhận\n✔ Biết trước chỗ còn thiếu: ô thông tin bắt buộc còn trống được liệt kê để bổ sung trước khi nhập\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài\n\nAnh chị nên nhập thử vài chứng từ trước khi nhập cả kỳ. Tính năng này được nhiều anh chị kế toán quan tâm, Đốm đang tiếp tục tối ưu để dễ dùng và tiện hơn nữa.\n\n◀ Phần trước – Phần 3: Tạo tờ khai 01/GTGT\nĐây là phần cuối của series. Anh chị xem đủ 4 phần trên kênh để đi trọn quy trình: tải hóa đơn → bảng kê Excel → tờ khai 01/GTGT → file nhập MISA.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; tài khoản 6422 là ví dụ minh họa; chi tiết phần bán ra đã được làm mờ.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n#quantritute #misa #hoadondientu #ketoan #phanmemketoan #botcongcuhoadon",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV7(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v7b'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V7) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, thumb_path = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.thumb, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v7b', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v7', e); }
}

export async function ensureStudioSchema(env) {
  try {
    await env.DB.batch(STUDIO_SCHEMA.map(s => env.DB.prepare(s)));
    const done = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v1'`).first('value');
    if (done) { await migrateV2(env); await migrateV3(env); await migrateV4(env); await migrateV5(env); await migrateV6(env); return migrateV7(env); }
    const t = Date.now(), st = [];
    for (const v of SEED) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, duration, file_path, log, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10)`)
        .bind(v.code, v.title, v.kind, v.tool || '', v.stage, v.plan || '', v.dur || '', v.file ? FILE_DIR + v.file : '', JSON.stringify([{ s: v.stage, at: t, by: 'khởi tạo' }]), t));
      if (v.yt) st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, privacy, posted_at, url, created_at, updated_at)
        SELECT id, 'youtube', 'posted', 'unlisted', ?2, ?3, ?4, ?4 FROM video_items WHERE code = ?1`).bind(v.code, v.yt.at, v.yt.url, t));
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v1', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio schema', e); }
  await migrateV2(env);
  await migrateV3(env);
  await migrateV4(env);
  await migrateV5(env);
  await migrateV6(env);
  await migrateV7(env);
}
