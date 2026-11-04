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


/* v10 (23/10/2026, anh duyệt Cổng 3 09:22): Ra mắt Ghép & đối chiếu 2 file Excel – đăng T3 27/10/2026 19:00. */
const SEED_V8 = [{
 "code": "v10",
 "title": "Ra mắt Ghép & đối chiếu 2 file Excel – không cần công thức",
 "date": "2026-10-27",
 "dur": "2:59",
 "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\10. Ra mắt Ghép & đối chiếu 2 file Excel.mp4",
 "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v10-ra-mat-ghep-doi-chieu\\xuat\\thumb-doc-luoi-1080x1920.png",
 "pin": "Các bạn đang phải đối chiếu 2 file Excel nào hằng tháng: sao kê – sổ chi tiết, chấm công – danh sách nhân sự, hay việc khác? Các bạn bình luận để Tuấn và Đốm làm video hướng dẫn đúng việc đó nhé.",
 "tiktok": {
  "caption": "Có bao giờ các bạn phải dò từng dòng giữa 2 file Excel hàng trăm, hàng nghìn dòng – sao kê ngân hàng với sổ chi tiết, chấm công với danh sách nhân sự?\n\nTuấn và Đốm ra mắt công cụ Ghép & đối chiếu 2 file Excel – không cần công thức:\n✔ Thả 2 file vào là bắt đầu: công cụ tự nhận dòng tiêu đề, tự bỏ dòng số dư, dòng tổng cộng\n✔ Tên cột ở 2 file khác nhau vẫn đối chiếu được; có gợi ý cặp cột kèm tỷ lệ khớp để chọn nhanh\n✔ Dữ liệu thô chưa chuẩn hóa vẫn khớp: thừa khoảng trắng, lẫn chữ hoa chữ thường, ngày có giờ hay khác định dạng\n✔ Thấy ngay dòng khớp, dòng chỉ có ở một file, dữ liệu 2 file đặt cạnh nhau – biết ngay dòng nào cần kiểm tra lại\n✔ Tải kết quả về Excel, mỗi mục một sheet riêng\n✔ Dùng được cả với file dữ liệu lớn; chạy ngay trên trình duyệt, file không rời máy, hoàn toàn miễn phí\n\nCông cụ chỉ ra chỗ khớp, chỗ lệch – còn quyết định thế nào vẫn là các bạn.\n\nLink dùng thử Tuấn và Đốm để ở phần Bio nhé. Các bạn dùng thử và góp ý giúp Tuấn và Đốm hoàn thiện thêm nha!\n\n#quantritute #excel #doichieudulieu #saokenganhang #ketoan #nhansu",
  "note": "Xưng hô: Tuấn và Đốm · gọi người xem là \"các bạn\" (video có cả Tuấn và Đốm). Kiểm tra Bio TikTok đã có link trước giờ đăng."
 },
 "youtube": {
  "title": "Ghép & đối chiếu 2 file Excel không cần công thức | Sao kê ↔ sổ chi tiết, chấm công ↔ nhân sự – miễn phí",
  "caption": "Có bao giờ các bạn phải dò từng dòng giữa 2 file Excel hàng trăm, hàng nghìn dòng – sao kê ngân hàng với sổ chi tiết, chấm công với danh sách nhân sự?\n\nTuấn và Đốm ra mắt công cụ Ghép & đối chiếu 2 file Excel – không cần công thức:\n✔ Thả 2 file vào là bắt đầu: công cụ tự nhận dòng tiêu đề, tự bỏ dòng số dư, dòng tổng cộng\n✔ Tên cột ở 2 file khác nhau vẫn đối chiếu được; có gợi ý cặp cột kèm tỷ lệ khớp để chọn nhanh\n✔ Dữ liệu thô chưa chuẩn hóa vẫn khớp: thừa khoảng trắng, lẫn chữ hoa chữ thường, ngày có giờ hay khác định dạng\n✔ Thấy ngay dòng khớp, dòng chỉ có ở một file, dữ liệu 2 file đặt cạnh nhau – biết ngay dòng nào cần kiểm tra lại\n✔ Tải kết quả về Excel, mỗi mục một sheet riêng\n✔ Dùng được cả với file dữ liệu lớn; chạy ngay trên trình duyệt, file không rời máy, hoàn toàn miễn phí\n\nCông cụ chỉ ra chỗ khớp, chỗ lệch – còn quyết định thế nào vẫn là các bạn.\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu thật, các thông tin nhạy cảm (tên người, nội dung giao dịch, số tài khoản) đã được làm mờ.\n\nCác bạn dùng thử và góp ý ở bình luận giúp Tuấn và Đốm nhé. Cảm ơn các bạn!\n\n#quantritute #excel #doichieudulieu #saokenganhang #ketoan #nhansu",
  "tags": "đối chiếu 2 file Excel, ghép dữ liệu Excel, thay VLOOKUP, đối chiếu sao kê ngân hàng, sổ chi tiết tiền gửi, kế toán, nhân sự, quantritute",
  "note": "Shorts dọc 2:59 (YouTube nhận Shorts đến 3 phút). Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 27/10/2026, 19:00. Sau khi có link, dán vào Quản trị → Công cụ → Ghép & đối chiếu 2 file Excel → Video demo."
 },
 "facebook": {
  "caption": "Có bao giờ các bạn phải dò từng dòng giữa 2 file Excel hàng trăm, hàng nghìn dòng – sao kê ngân hàng với sổ chi tiết, chấm công với danh sách nhân sự?\n\nTuấn và Đốm ra mắt công cụ Ghép & đối chiếu 2 file Excel – không cần công thức:\n✔ Thả 2 file vào là bắt đầu: công cụ tự nhận dòng tiêu đề, tự bỏ dòng số dư, dòng tổng cộng\n✔ Tên cột ở 2 file khác nhau vẫn đối chiếu được; có gợi ý cặp cột kèm tỷ lệ khớp để chọn nhanh\n✔ Dữ liệu thô chưa chuẩn hóa vẫn khớp: thừa khoảng trắng, lẫn chữ hoa chữ thường, ngày có giờ hay khác định dạng\n✔ Thấy ngay dòng khớp, dòng chỉ có ở một file, dữ liệu 2 file đặt cạnh nhau – biết ngay dòng nào cần kiểm tra lại\n✔ Tải kết quả về Excel, mỗi mục một sheet riêng\n✔ Dùng được cả với file dữ liệu lớn; chạy ngay trên trình duyệt, file không rời máy, hoàn toàn miễn phí\n\nCông cụ chỉ ra chỗ khớp, chỗ lệch – còn quyết định thế nào vẫn là các bạn.\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu thật, các thông tin nhạy cảm (tên người, nội dung giao dịch, số tài khoản) đã được làm mờ.\n\nCác bạn dùng thử và góp ý ở bình luận giúp Tuấn và Đốm hoàn thiện thêm nhé. Cảm ơn các bạn!\n\n#quantritute #excel #doichieudulieu #saokenganhang #ketoan #nhansu",
  "note": "Đăng dạng Reels."
 }
}];
async function migrateV8(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v8'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V8) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'doi-chieu-sao-ke', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v8', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v8', e); }
}

/* v12 (23/10/2026, anh duyệt Cổng 3 22:05): Ghép & đối chiếu – Phần 1/2: Cảnh báo lệch ngày & khớp tổng – đăng T4 28/10/2026 19:00 (anh đổi 24/10). */
const SEED_V9 = [
 {
  "code": "v12",
  "title": "Ghép & đối chiếu 2 file Excel – Phần 1: Cảnh báo lệch ngày & khớp tổng",
  "date": "2026-10-28",
  "dur": "2:23",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\11. Ghép & đối chiếu_Phần 1_Cảnh báo lệch ngày & khớp tổng.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v11-lech-ngay-khop-tong\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị hay gặp kiểu lệch nào nhất khi đối chiếu sao kê với sổ: lệch ngày ghi sổ, một lệnh tách nhiều bút toán, hay trừ phí chuyển khoản? Anh chị bình luận để Đốm thử tiếp nhé!",
  "tiktok": {
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 1/2: Cảnh báo lệch ngày & khớp tổng\n\nSố tiền khớp từng đồng, mà vẫn báo không khớp? Ngân hàng ghi ngày 27, kế toán ghi sổ ngày 28. Một lệnh chi trên sao kê, trên sổ lại tách thành nhiều bút toán.\n\nVới 2 cảnh báo trong Báo cáo tra soát, anh chị được:\n✔ Thấy ngay cặp dòng trùng số liệu nhưng lệch ngày, đặt cạnh nhau, ghi rõ lệch mấy ngày – tự chọn số ngày cho phép lệch\n✔ Thấy ngay 1 dòng bằng tổng nhiều dòng cùng ngày (1 lệnh ngân hàng = nhiều bút toán), dò cả 2 chiều – không phải tự cộng\n✔ Đỡ dò tay từng ngày, từng khoản ở những dòng \"cứng đầu\" cuối tháng\n✔ Yên tâm: công cụ chỉ cảnh báo, không tự tính là khớp – anh chị xem và tự quyết\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n▶ Phần sau – Phần 2: Tên có dấu, không dấu, số điện thoại gõ mỗi nơi một kiểu, vẫn khớp được\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #excel #doichieusaoke #ketoan #doichieudulieu",
   "note": "Xưng hô: Đốm + \"anh chị\" (video chỉ có Đốm). Series Phần 1/2 – thumbnail PHẦN 1/2. Kiểm tra Bio TikTok có link trước giờ đăng."
  },
  "youtube": {
   "title": "Ghép & đối chiếu 2 file Excel – Phần 1/2: Số khớp mà vẫn báo lệch? Cảnh báo lệch ngày & khớp tổng",
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 1/2: Cảnh báo lệch ngày & khớp tổng\n\nSố tiền khớp từng đồng, mà vẫn báo không khớp? Ngân hàng ghi ngày 27, kế toán ghi sổ ngày 28. Một lệnh chi trên sao kê, trên sổ lại tách thành nhiều bút toán.\n\nVới 2 cảnh báo trong Báo cáo tra soát, anh chị được:\n✔ Thấy ngay cặp dòng trùng số liệu nhưng lệch ngày, đặt cạnh nhau, ghi rõ lệch mấy ngày – tự chọn số ngày cho phép lệch\n✔ Thấy ngay 1 dòng bằng tổng nhiều dòng cùng ngày (1 lệnh ngân hàng = nhiều bút toán), dò cả 2 chiều – không phải tự cộng\n✔ Đỡ dò tay từng ngày, từng khoản ở những dòng \"cứng đầu\" cuối tháng\n✔ Yên tâm: công cụ chỉ cảnh báo, không tự tính là khớp – anh chị xem và tự quyết\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Video ra mắt công cụ: Ghép & đối chiếu 2 file Excel không cần công thức\n▶ Phần sau – Phần 2: Gõ khác kiểu vẫn khớp – các lựa chọn làm sạch dữ liệu\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa của một công ty mẫu.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieusaoke #ketoan #doichieudulieu",
   "desc": "📚 Ghép & đối chiếu 2 file Excel – Phần 1/2: Cảnh báo lệch ngày & khớp tổng\n\nSố tiền khớp từng đồng, mà vẫn báo không khớp? Ngân hàng ghi ngày 27, kế toán ghi sổ ngày 28. Một lệnh chi trên sao kê, trên sổ lại tách thành nhiều bút toán.\n\nVới 2 cảnh báo trong Báo cáo tra soát, anh chị được:\n✔ Thấy ngay cặp dòng trùng số liệu nhưng lệch ngày, đặt cạnh nhau, ghi rõ lệch mấy ngày – tự chọn số ngày cho phép lệch\n✔ Thấy ngay 1 dòng bằng tổng nhiều dòng cùng ngày (1 lệnh ngân hàng = nhiều bút toán), dò cả 2 chiều – không phải tự cộng\n✔ Đỡ dò tay từng ngày, từng khoản ở những dòng \"cứng đầu\" cuối tháng\n✔ Yên tâm: công cụ chỉ cảnh báo, không tự tính là khớp – anh chị xem và tự quyết\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Video ra mắt công cụ: Ghép & đối chiếu 2 file Excel không cần công thức\n▶ Phần sau – Phần 2: Gõ khác kiểu vẫn khớp – các lựa chọn làm sạch dữ liệu\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa của một công ty mẫu.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieusaoke #ketoan #doichieudulieu",
   "tags": "đối chiếu sao kê ngân hàng, lệch ngày ghi sổ, đối chiếu 2 file Excel, khớp tổng nhiều dòng, sổ tiền gửi 112, kế toán, quantritute",
   "note": "Shorts dọc 2:23. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 28/10/2026 19:00. Tạo danh sách phát \"Ghép & đối chiếu 2 file Excel – Hướng dẫn tính năng\" và thêm video vào."
  },
  "facebook": {
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 1/2: Cảnh báo lệch ngày & khớp tổng\n\nSố tiền khớp từng đồng, mà vẫn báo không khớp? Ngân hàng ghi ngày 27, kế toán ghi sổ ngày 28. Một lệnh chi trên sao kê, trên sổ lại tách thành nhiều bút toán.\n\nVới 2 cảnh báo trong Báo cáo tra soát, anh chị được:\n✔ Thấy ngay cặp dòng trùng số liệu nhưng lệch ngày, đặt cạnh nhau, ghi rõ lệch mấy ngày – tự chọn số ngày cho phép lệch\n✔ Thấy ngay 1 dòng bằng tổng nhiều dòng cùng ngày (1 lệnh ngân hàng = nhiều bút toán), dò cả 2 chiều – không phải tự cộng\n✔ Đỡ dò tay từng ngày, từng khoản ở những dòng \"cứng đầu\" cuối tháng\n✔ Yên tâm: công cụ chỉ cảnh báo, không tự tính là khớp – anh chị xem và tự quyết\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n▶ Phần sau – Phần 2: Gõ khác kiểu vẫn khớp – các lựa chọn làm sạch dữ liệu\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa của một công ty mẫu.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm hoàn thiện thêm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieusaoke #ketoan #doichieudulieu",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV9(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v9'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V9) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'doi-chieu-sao-ke', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v9', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v9', e); }
}

/* 24/10/2026: anh đổi v12 đăng T4 28/10 + đổi tên file thành số 11 (cập nhật cả khi _mig_studio_v9 đã chạy; không đụng bài đã đăng). */
async function migrateV10(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v10'`).first('value')) return;
    const t = Date.now();
    await env.DB.batch([
      env.DB.prepare(`UPDATE video_items SET plan_date = '2026-10-28', file_path = ?1, updated_at = ?2 WHERE code IN ('v11', 'v12') AND title LIKE '%Phần 1%'`)
        .bind("D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\11. Ghép & đối chiếu_Phần 1_Cảnh báo lệch ngày & khớp tổng.mp4", t),
      env.DB.prepare(`UPDATE video_posts SET note = replace(note, '29/10/2026', '28/10/2026'), updated_at = ?1 WHERE status <> 'posted' AND video_id IN (SELECT id FROM video_items WHERE code IN ('v11', 'v12') AND title LIKE '%Phần 1%')`).bind(t),
      env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v10', '1')`),
    ]);
  } catch (e) { console.error('studio v10', e); }
}

/* 24/10/2026 09:02: anh đổi mã – video "Phần 1: Lệch ngày & khớp tổng" là v11 (Phần 2 sẽ là v12); ý tưởng v11 cũ "Vợ mình nhận thêm việc" tạm dừng, chưa đánh số. */
async function migrateV11(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v11'`).first('value')) return;
    const t = Date.now();
    await env.DB.batch([
      env.DB.prepare(`UPDATE video_items SET code = 'v11', thumb_path = replace(thumb_path, 'v12-lech-ngay-khop-tong', 'v11-lech-ngay-khop-tong'), updated_at = ?1
        WHERE code = 'v12' AND title LIKE '%Phần 1%' AND NOT EXISTS (SELECT 1 FROM video_items WHERE code = 'v11')`).bind(t),
      env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v11', '1')`),
    ]);
  } catch (e) { console.error('studio v11', e); }
}

/* v12 (24/10/2026, anh duyệt Cổng 3 18:20): Ghép & đối chiếu – Phần 2/2: Gõ khác kiểu vẫn khớp (Làm sạch dữ liệu) – đăng T5 29/10/2026 19:00. */
const SEED_V12 = [
 {
  "code": "v12",
  "title": "Ghép & đối chiếu 2 file Excel – Phần 2: Gõ khác kiểu vẫn khớp (Làm sạch dữ liệu)",
  "date": "2026-10-29",
  "dur": "2:12",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\12. Ghép & đối chiếu_Phần 2_Gõ khác kiểu vẫn khớp.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v12-lam-sach\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị hay phải đối chiếu 2 danh sách nào mà mỗi nơi gõ một kiểu: nhân sự với chấm công, khách hàng với đơn hàng, hay đăng ký với điểm danh? Anh chị bình luận để Đốm thử tiếp nhé!",
  "tiktok": {
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 2/2: Gõ khác kiểu vẫn khớp\n\nCùng một người, mà máy vẫn báo không khớp? Bên đăng ký ghi \"Trần Bình\", bên check-in ghi \"Tran Binh\". Số điện thoại chỗ có dấu chấm, chỗ thêm 84, chỗ mất luôn số 0 ở đầu.\n\nVới các lựa chọn làm sạch dữ liệu, anh chị được:\n✔ Ghép đúng tên có dấu với tên không dấu – không phải gõ lại từng ô\n✔ Số điện thoại gõ mỗi nơi một kiểu (dấu cách, dấu chấm, +84, mất số 0 ở đầu) vẫn nhận ra là cùng một số\n✔ Mã có dấu gạch, dấu cách vẫn khớp với mã viết liền; số tiền lệch vì phí chuyển khoản vẫn ghép được\n✔ Bấm \"Kiểm tra dữ liệu\" là biết ngay tỉ lệ khớp, trước khi chạy\n✔ Thấy luôn ai đã đăng ký mà chưa đến, ai check-in mà chưa đăng ký\n✔ Yên tâm: các lựa chọn chỉ dùng khi so khớp, không sửa dữ liệu trong file của anh chị\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Phần trước – Phần 1: Số khớp mà vẫn báo lệch? Cảnh báo lệch ngày & khớp tổng\n\nLink dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n#quantritute #excel #doichieudulieu #lamsachdulieu #vanphong",
   "note": "Xưng hô: Đốm + \"anh chị\" (video chỉ có Đốm). Series Phần 2/2 – thumbnail PHẦN 2/2. Kiểm tra Bio TikTok có link trước giờ đăng."
  },
  "youtube": {
   "title": "Ghép & đối chiếu 2 file Excel – Phần 2/2: Cùng 1 người mà vẫn báo không khớp? Làm sạch dữ liệu",
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 2/2: Gõ khác kiểu vẫn khớp\n\nCùng một người, mà máy vẫn báo không khớp? Bên đăng ký ghi \"Trần Bình\", bên check-in ghi \"Tran Binh\". Số điện thoại chỗ có dấu chấm, chỗ thêm 84, chỗ mất luôn số 0 ở đầu.\n\nVới các lựa chọn làm sạch dữ liệu, anh chị được:\n✔ Ghép đúng tên có dấu với tên không dấu – không phải gõ lại từng ô\n✔ Số điện thoại gõ mỗi nơi một kiểu (dấu cách, dấu chấm, +84, mất số 0 ở đầu) vẫn nhận ra là cùng một số\n✔ Mã có dấu gạch, dấu cách vẫn khớp với mã viết liền; số tiền lệch vì phí chuyển khoản vẫn ghép được\n✔ Bấm \"Kiểm tra dữ liệu\" là biết ngay tỉ lệ khớp, trước khi chạy\n✔ Thấy luôn ai đã đăng ký mà chưa đến, ai check-in mà chưa đăng ký\n✔ Yên tâm: các lựa chọn chỉ dùng khi so khớp, không sửa dữ liệu trong file của anh chị\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Phần trước – Phần 1: Số khớp mà vẫn báo lệch? Cảnh báo lệch ngày & khớp tổng\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieudulieu #lamsachdulieu #vanphong",
   "desc": "📚 Ghép & đối chiếu 2 file Excel – Phần 2/2: Gõ khác kiểu vẫn khớp\n\nCùng một người, mà máy vẫn báo không khớp? Bên đăng ký ghi \"Trần Bình\", bên check-in ghi \"Tran Binh\". Số điện thoại chỗ có dấu chấm, chỗ thêm 84, chỗ mất luôn số 0 ở đầu.\n\nVới các lựa chọn làm sạch dữ liệu, anh chị được:\n✔ Ghép đúng tên có dấu với tên không dấu – không phải gõ lại từng ô\n✔ Số điện thoại gõ mỗi nơi một kiểu (dấu cách, dấu chấm, +84, mất số 0 ở đầu) vẫn nhận ra là cùng một số\n✔ Mã có dấu gạch, dấu cách vẫn khớp với mã viết liền; số tiền lệch vì phí chuyển khoản vẫn ghép được\n✔ Bấm \"Kiểm tra dữ liệu\" là biết ngay tỉ lệ khớp, trước khi chạy\n✔ Thấy luôn ai đã đăng ký mà chưa đến, ai check-in mà chưa đăng ký\n✔ Yên tâm: các lựa chọn chỉ dùng khi so khớp, không sửa dữ liệu trong file của anh chị\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Phần trước – Phần 1: Số khớp mà vẫn báo lệch? Cảnh báo lệch ngày & khớp tổng\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=youtube\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieudulieu #lamsachdulieu #vanphong",
   "tags": "làm sạch dữ liệu Excel, bỏ dấu tiếng Việt, chuẩn hoá số điện thoại, đối chiếu 2 danh sách, ghép 2 file Excel không cần VLOOKUP, quantritute",
   "note": "Shorts dọc 2:12. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 29/10/2026 19:00. Thêm vào danh sách phát \"Ghép & đối chiếu 2 file Excel – Hướng dẫn tính năng\"."
  },
  "facebook": {
   "caption": "📚 Ghép & đối chiếu 2 file Excel – Phần 2/2: Gõ khác kiểu vẫn khớp\n\nCùng một người, mà máy vẫn báo không khớp? Bên đăng ký ghi \"Trần Bình\", bên check-in ghi \"Tran Binh\". Số điện thoại chỗ có dấu chấm, chỗ thêm 84, chỗ mất luôn số 0 ở đầu.\n\nVới các lựa chọn làm sạch dữ liệu, anh chị được:\n✔ Ghép đúng tên có dấu với tên không dấu – không phải gõ lại từng ô\n✔ Số điện thoại gõ mỗi nơi một kiểu (dấu cách, dấu chấm, +84, mất số 0 ở đầu) vẫn nhận ra là cùng một số\n✔ Mã có dấu gạch, dấu cách vẫn khớp với mã viết liền; số tiền lệch vì phí chuyển khoản vẫn ghép được\n✔ Bấm \"Kiểm tra dữ liệu\" là biết ngay tỉ lệ khớp, trước khi chạy\n✔ Thấy luôn ai đã đăng ký mà chưa đến, ai check-in mà chưa đăng ký\n✔ Yên tâm: các lựa chọn chỉ dùng khi so khớp, không sửa dữ liệu trong file của anh chị\n✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi file ra ngoài\n\n◀ Phần trước – Phần 1: Số khớp mà vẫn báo lệch? Cảnh báo lệch ngày & khớp tổng\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/doi-chieu-sao-ke?nguon=facebook\n\nLưu ý: dữ liệu trong video là dữ liệu minh họa.\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm hoàn thiện thêm nhé. Cảm ơn anh chị!\n\n#quantritute #excel #doichieudulieu #lamsachdulieu #vanphong",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV12(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v12'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V12) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'doi-chieu-sao-ke', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v12', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v12', e); }
}

/* v9.1 (26/10/2026, anh duyệt Cổng 3 20:33): video cập nhật nóng – HĐ máy tính tiền nhập mã xác nhận (Bộ công cụ hóa đơn thuế). Đăng ngay tối 26/10, ngoài lịch 19:00; lịch v10–v12 giữ nguyên. */
const SEED_V91 = [
 {
  "code": "v9.1",
  "title": "Cập nhật quan trọng 26/10: Hóa đơn máy tính tiền nhập mã xác nhận",
  "date": "2026-10-26",
  "time": "21:00",
  "dur": "2:18",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\9.1. Cập nhật quan trọng 26-10_HĐ máy tính tiền nhập mã xác nhận.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v9.1-cap-nhat-hd-may-tinh-tien\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị đã thử tải hóa đơn máy tính tiền với bản cập nhật mới chưa ạ? Có chỗ nào còn vướng, anh chị bình luận để Đốm hỗ trợ nhé!",
  "tiktok": {
   "caption": "⚠️ CẬP NHẬT QUAN TRỌNG 26/10 – Hóa đơn máy tính tiền phải gõ mã xác nhận\n\nCổng thuế vừa thay đổi: mỗi lần tra hóa đơn máy tính tiền phải nhập mã, tối đa 10 ngày/lần. Một quý là 9–10 lần gõ mã.\n✔ Anh chị chỉ gõ mã – công cụ tự chia đoạn 10 ngày, lật trang, tải XML vào 1 file ZIP\n✔ Hết phiên giữa chừng: đăng nhập lại, công cụ tự chạy tiếp\n✔ Không giữ mật khẩu thuế, không lách mã xác nhận\n👉 Đã cài nút: vào thẻ 1 của công cụ, xóa nút cũ, kéo nút mới lên.\n\nLink dùng thử Đốm để ở phần Bio nhé!\n\n#hoadondientu #hoadonmaytinhtien #ketoan #thue #botcongcuhoadon",
   "note": "Video cập nhật nóng – đăng ngay tối 26/10 (ngoài lịch 19:00). Kiểm tra Bio TikTok có link."
  },
  "youtube": {
   "title": "⚠ Cập nhật 26/10: Hóa đơn máy tính tiền phải gõ mã xác nhận – Bộ công cụ hóa đơn thuế",
   "caption": "⚠️ CHÚ Ý – CẬP NHẬT QUAN TRỌNG 26/10: Hóa đơn máy tính tiền phải gõ mã xác nhận\n\nCổng thuế vừa thay đổi: tra hóa đơn có mã khởi tạo từ máy tính tiền phải nhập mã xác nhận, mỗi lần tối đa 10 ngày. Một quý là 9–10 lần gõ mã, chưa kể lật từng trang, tải từng hóa đơn.\n\nBộ công cụ hóa đơn thuế đã cập nhật để anh chị đỡ phần việc còn lại:\n✔ Chỉ cần gõ mã ngay trong bảng điều khiển – công cụ tự chia kỳ thành từng đoạn 10 ngày\n✔ Tự lật hết trang, tải XML vào chung 1 file ZIP với hóa đơn điện tử\n✔ Hết phiên đăng nhập giữa chừng: đăng nhập lại ngay trên trang, công cụ tự chạy tiếp\n✔ Không hỏi, không giữ mật khẩu thuế; không lách mã xác nhận – tài khoản thuế của doanh nghiệp không phải chỗ để thử\n\n👉 Đã cài nút \"Tải HĐ hàng loạt\": vào thẻ 1 của công cụ, xóa nút cũ trên thanh dấu trang và kéo nút mới lên.\n\n🔗 Dùng miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n📖 Hướng dẫn chi tiết: https://quantritute.com/huong-dan/tai-hoa-don-dien-tu-hang-loat/?nguon=youtube\n\nLưu ý: video dùng trang thuế mô phỏng, thông tin doanh nghiệp đã được thay đổi.\n\n#hoadondientu #hoadonmaytinhtien #ketoan #thue #botcongcuhoadon #quantritute",
   "tags": "hóa đơn máy tính tiền, mã xác nhận cổng thuế, tải hóa đơn hàng loạt, hóa đơn điện tử, kế toán, quantritute",
   "note": "Shorts dọc 2:18. Hình thu nhỏ: thumb-ngang-1280x720.png. Thêm vào danh sách phát series hóa đơn.",
   "desc": "⚠️ CHÚ Ý – CẬP NHẬT QUAN TRỌNG 26/10: Hóa đơn máy tính tiền phải gõ mã xác nhận\n\nCổng thuế vừa thay đổi: tra hóa đơn có mã khởi tạo từ máy tính tiền phải nhập mã xác nhận, mỗi lần tối đa 10 ngày. Một quý là 9–10 lần gõ mã, chưa kể lật từng trang, tải từng hóa đơn.\n\nBộ công cụ hóa đơn thuế đã cập nhật để anh chị đỡ phần việc còn lại:\n✔ Chỉ cần gõ mã ngay trong bảng điều khiển – công cụ tự chia kỳ thành từng đoạn 10 ngày\n✔ Tự lật hết trang, tải XML vào chung 1 file ZIP với hóa đơn điện tử\n✔ Hết phiên đăng nhập giữa chừng: đăng nhập lại ngay trên trang, công cụ tự chạy tiếp\n✔ Không hỏi, không giữ mật khẩu thuế; không lách mã xác nhận – tài khoản thuế của doanh nghiệp không phải chỗ để thử\n\n👉 Đã cài nút \"Tải HĐ hàng loạt\": vào thẻ 1 của công cụ, xóa nút cũ trên thanh dấu trang và kéo nút mới lên.\n\n🔗 Dùng miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n📖 Hướng dẫn chi tiết: https://quantritute.com/huong-dan/tai-hoa-don-dien-tu-hang-loat/?nguon=youtube\n\nLưu ý: video dùng trang thuế mô phỏng, thông tin doanh nghiệp đã được thay đổi.\n\n#hoadondientu #hoadonmaytinhtien #ketoan #thue #botcongcuhoadon #quantritute"
  },
  "facebook": {
   "caption": "⚠️ CHÚ Ý – CẬP NHẬT QUAN TRỌNG 26/10: Hóa đơn máy tính tiền phải gõ mã xác nhận\n\nCổng thuế vừa thay đổi: tra hóa đơn có mã khởi tạo từ máy tính tiền phải nhập mã xác nhận, mỗi lần tối đa 10 ngày. Một quý là 9–10 lần gõ mã, chưa kể lật từng trang, tải từng hóa đơn.\n\nBộ công cụ hóa đơn thuế đã cập nhật để anh chị đỡ phần việc còn lại:\n✔ Chỉ cần gõ mã ngay trong bảng điều khiển – công cụ tự chia kỳ thành từng đoạn 10 ngày\n✔ Tự lật hết trang, tải XML vào chung 1 file ZIP với hóa đơn điện tử\n✔ Hết phiên đăng nhập giữa chừng: đăng nhập lại ngay trên trang, công cụ tự chạy tiếp\n✔ Không hỏi, không giữ mật khẩu thuế; không lách mã xác nhận – tài khoản thuế của doanh nghiệp không phải chỗ để thử\n\n👉 Đã cài nút \"Tải HĐ hàng loạt\": vào thẻ 1 của công cụ, xóa nút cũ trên thanh dấu trang và kéo nút mới lên.\n\n🔗 Dùng miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n📖 Hướng dẫn chi tiết: https://quantritute.com/huong-dan/tai-hoa-don-dien-tu-hang-loat/?nguon=facebook\n\nLưu ý: video dùng trang thuế mô phỏng, thông tin doanh nghiệp đã được thay đổi.\n\n#hoadondientu #hoadonmaytinhtien #ketoan #thue #botcongcuhoadon #quantritute",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV91(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v9_1'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V91) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, ?9, ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t, v.time));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v9_1', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v9.1', e); }
}

/* v13 (29/10/2026, anh duyệt Cổng 3 21:02; caption bản 2 23:20 theo CAM-NANG-CAPTION.md – khóa _mig_studio_v13b): Phần thưởng đầu tiên của Đốm – chỉ số Bộ công cụ (đến 29/10) + kêu gọi gửi nhu cầu ở Bảng ghim – đăng T6 30/10/2026 19:00. */
const SEED_V13 = [
 {
  "code": "v13",
  "title": "Phần thưởng đầu tiên của Đốm 🧡 – 297 lượt dùng công cụ & lời cảm ơn",
  "date": "2026-10-30",
  "dur": "2:11",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\13. Phần thưởng đầu tiên của Đốm.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v13-chi-so-bo-cong-cu\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Việc gì đang ngốn thời gian của bạn nhất mỗi tuần? Kể cho mình nghe nhé 👇",
  "tiktok": {
   "caption": "Một người lạ gọi: \"Em làm công cụ kế toán cho anh được không?\" 😅\n\nMình làm bộ công cụ này cho vợ – một kế toán trưởng, rồi chia sẻ miễn phí. Tính đến 29/10: 297 lượt dùng. Và hôm qua, Đốm nhận phần thưởng đầu tiên 🧡\n\nBạn đang \"cày\" việc gì lặp đi lặp lại? Comment để mình làm tiếp nhé 👇\n\n#congcuvanphong #ketoan #excel #tudonghoa",
   "note": "Anh nói – caption xưng \"mình\", gọi \"bạn\". ~300 ký tự."
  },
  "youtube": {
   "title": "Công cụ kế toán miễn phí: 297 lượt dùng & phần thưởng đầu tiên 🧡",
   "caption": "Làm công cụ kế toán miễn phí cho vợ – và một cuộc gọi lạ hỏi \"Em làm cho anh được không?\"\n\nTính đến 29/10/2026, bộ công cụ văn phòng miễn phí đã có 297 lượt dùng. Hôm qua, Đốm nhận phần thưởng đầu tiên 🧡 Cảm ơn mọi người!\n\nBạn đang mất thời gian cho việc gì lặp đi lặp lại? Kể cho mình ở Bảng ghim:\n📌 https://quantritute.com/bang-ghim?nguon=youtube\n\n#congcuketoan #excel #tudonghoa",
   "desc": "Làm công cụ kế toán miễn phí cho vợ – và một cuộc gọi lạ hỏi \"Em làm cho anh được không?\"\n\nTính đến 29/10/2026, bộ công cụ văn phòng miễn phí đã có 297 lượt dùng. Hôm qua, Đốm nhận phần thưởng đầu tiên 🧡 Cảm ơn mọi người!\n\nBạn đang mất thời gian cho việc gì lặp đi lặp lại? Kể cho mình ở Bảng ghim:\n📌 https://quantritute.com/bang-ghim?nguon=youtube\n\n#congcuketoan #excel #tudonghoa",
   "tags": "công cụ kế toán miễn phí, công cụ văn phòng, tự động hóa Excel, kế toán, quản trị tử tế",
   "note": "Shorts dọc 2:11. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 30/10/2026 19:00."
  },
  "facebook": {
   "caption": "Hôm qua đi ăn trưa, mình nhận một cuộc gọi lạ.\n\"Em là lập trình viên à? Em làm giúp anh một công cụ kế toán được không? Chi phí bao nhiêu?\"\n\nBộ công cụ ấy, mình làm cho vợ – một kế toán trưởng – rồi chia sẻ miễn phí cho mọi người.\n\nHôm qua vào web xem: 297 lượt dùng (tính đến 29/10). Và Đốm nhận được phần thưởng đầu tiên 🧡 Cảm ơn mọi người thật nhiều!\n\nCòn bạn – việc gì đang lặp đi lặp lại, ngốn thời gian của bạn mỗi tuần? Kể ở bình luận hoặc ghim lên Bảng ghim, mình làm tiếp nhé 👇\n📌 https://quantritute.com/bang-ghim?nguon=facebook\n\n#congcuvanphong #ketoan #tudonghoa",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV13(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v13b'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V13) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'why', '', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v13b', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v13', e); }
}

/* v14a (30/10/2026, anh duyệt Cổng 3 10:08): Cùng tối ưu và chia sẻ – câu chuyện anh Phương đặt làm Bảng kê & Tờ khai GTGT, đồng ý mở miễn phí – đăng T7 31/10/2026 19:00. Lịch mới: v14b 01/11, v15 02/11, v16 03/11. */
const SEED_V14 = [
 {
  "code": "v14a",
  "title": "Cùng tối ưu và chia sẻ – kế toán đặt làm công cụ, mở miễn phí cho tất cả",
  "date": "2026-10-31",
  "dur": "2:06",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\14a. Cùng tối ưu và chia sẻ.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v14-ra-mat-to-khai-gtgt\\xuat\\v14a\\thumb-doc-luoi-1080x1920.png",
  "pin": "Việc gì lặp đi lặp lại đang ngốn thời gian của bạn nhất? Kể mình nghe nhé 👇",
  "tiktok": {
   "caption": "Một anh kế toán nhờ mình làm công cụ đối chiếu tờ khai thuế – rồi đồng ý mở miễn phí cho tất cả 🧡\n\n1 buổi tối, 1 buổi sáng, 5–6 lần sửa theo góp ý. Cảm ơn anh Phương!\n\nBạn đang lặp đi lặp lại việc gì mỗi tuần? Kể mình nghe nhé 👇\n\n#ketoan #congcuketoan #thuegtgt #tudonghoa",
   "note": "Anh nói – xưng \"mình\", gọi \"bạn\". Theo CAM-NANG-CAPTION."
  },
  "youtube": {
   "title": "Kế toán đặt làm công cụ – rồi mở miễn phí cho tất cả",
   "caption": "Một anh kế toán nhờ mình làm công cụ lập bảng kê, tờ khai thuế GTGT để đối chiếu lại số liệu – rồi đồng ý mở miễn phí cho mọi người.\n\n1 buổi tối, 1 buổi sáng, 5–6 lần cập nhật theo góp ý của anh Phương. Cảm ơn anh 🧡 Video sau, Đốm sẽ giới thiệu chi tiết công cụ.\n\nBạn có việc lặp đi lặp lại nào cần tối ưu? Kể mình ở Bảng ghim:\n📌 https://quantritute.com/bang-ghim?nguon=youtube\n\n#congcuketoan #thuegtgt #tudonghoa",
   "desc": "Một anh kế toán nhờ mình làm công cụ lập bảng kê, tờ khai thuế GTGT để đối chiếu lại số liệu – rồi đồng ý mở miễn phí cho mọi người.\n\n1 buổi tối, 1 buổi sáng, 5–6 lần cập nhật theo góp ý của anh Phương. Cảm ơn anh 🧡 Video sau, Đốm sẽ giới thiệu chi tiết công cụ.\n\nBạn có việc lặp đi lặp lại nào cần tối ưu? Kể mình ở Bảng ghim:\n📌 https://quantritute.com/bang-ghim?nguon=youtube\n\n#congcuketoan #thuegtgt #tudonghoa",
   "tags": "công cụ kế toán miễn phí, bảng kê tờ khai thuế GTGT, tối ưu công việc, kế toán, quản trị tử tế",
   "note": "Shorts dọc 2:06. Hình thu nhỏ: v14a/thumb-ngang-1280x720.png. Lên lịch 31/10/2026 19:00."
  },
  "facebook": {
   "caption": "Tiếp câu chuyện cuộc gọi lạ hôm trước 😊\n\nNgười gọi là anh Phương, một anh kế toán. Anh đã dùng phần mềm kế toán trả phí, nhưng vẫn muốn có công cụ tự lập bảng kê, tờ khai để đối chiếu lại số liệu một lần nữa.\n\nMột buổi tối, một buổi sáng – anh góp ý, mình sửa, gửi lại, cứ thế 5–6 lần đến bản hoàn thiện. Anh còn gửi Đốm một phần thưởng nhỏ 🧡\n\nNhưng điều mình vui hơn: anh đồng ý để công cụ lên kho chung, ai cần cũng được dùng miễn phí. Cảm ơn anh Phương!\n\nCòn bạn – việc gì lặp đi lặp lại đang muốn tối ưu? Kể mình nghe ở bình luận hoặc Bảng ghim nhé 👇\n📌 https://quantritute.com/bang-ghim?nguon=facebook\n\n#congcuketoan #thuegtgt #tudonghoa",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV14(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v14'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V14) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'why', 'to-khai-gtgt', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v14', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v14', e); }
}

/* v14b (30/10/2026, anh duyệt Cổng 3 10:39): Ra mắt Bảng kê & Tờ khai thuế GTGT từ Excel (= Video demo của công cụ) – hook lời cảm ơn anh Phương + Đốm giới thiệu – đăng CN 01/11/2026 19:00. */
const SEED_V14B = [
 {
  "code": "v14b",
  "title": "Ra mắt Bảng kê & Tờ khai thuế GTGT từ Excel – kế toán đặt làm, mở miễn phí",
  "date": "2026-11-01",
  "dur": "1:48",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\14b. Ra mắt Bảng kê & Tờ khai thuế GTGT từ Excel.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v14-ra-mat-to-khai-gtgt\\xuat\\v14b\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị đang soát tờ khai thuế GTGT hằng tháng bằng cách nào ạ?",
  "tiktok": {
   "caption": "Lập bảng kê, tờ khai thuế GTGT từ file Excel cổng thuế – và đối chiếu với tờ khai trên phần mềm 📊\n\nMột anh kế toán đặt làm, rồi đồng ý mở miễn phí cho mọi người. Đốm chạy thử trọn 3 bước trong video!\n\nAnh chị đang soát tờ khai hằng tháng bằng cách nào? 👇\n\n#ketoan #thuegtgt #tokhaithue #hoadondientu",
   "note": "Đốm dẫn – xưng \"Đốm\", gọi \"anh chị\". Theo CAM-NANG-CAPTION."
  },
  "youtube": {
   "title": "Bảng kê & tờ khai thuế GTGT từ Excel cổng thuế – miễn phí",
   "caption": "Thả file danh sách hóa đơn tải ở cổng thuế – có ngay bảng kê, tờ khai 01/GTGT, và đối chiếu với tờ khai XML từ công cụ khác.\n\n✔ Tự nhận file bán ra, mua vào; tách riêng hóa đơn điều chỉnh, thay thế\n✔ Chỉ tiêu lệch được tô đỏ, kèm gợi ý nguyên nhân\n✔ Chạy ngay trên trình duyệt, hóa đơn không rời máy\n\nCông cụ do một anh kế toán đặt làm và đồng ý mở miễn phí cho mọi người 🧡\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #thuegtgt #tokhaithue",
   "desc": "Thả file danh sách hóa đơn tải ở cổng thuế – có ngay bảng kê, tờ khai 01/GTGT, và đối chiếu với tờ khai XML từ công cụ khác.\n\n✔ Tự nhận file bán ra, mua vào; tách riêng hóa đơn điều chỉnh, thay thế\n✔ Chỉ tiêu lệch được tô đỏ, kèm gợi ý nguyên nhân\n✔ Chạy ngay trên trình duyệt, hóa đơn không rời máy\n\nCông cụ do một anh kế toán đặt làm và đồng ý mở miễn phí cho mọi người 🧡\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #thuegtgt #tokhaithue",
   "tags": "bảng kê hóa đơn, tờ khai thuế GTGT, tờ khai 01/GTGT, danh sách hóa đơn cổng thuế, đối chiếu tờ khai, kế toán thuế, quantritute",
   "note": "Shorts dọc 1:48. Hình thu nhỏ: v14b/thumb-ngang-1280x720.png. Lên lịch 01/11/2026 19:00. Đăng xong dán link vào Quản trị → Công cụ → Video demo."
  },
  "facebook": {
   "caption": "Mỗi tháng tải danh sách hóa đơn ở cổng thuế, rồi ngồi gộp tay thành bảng kê, lập tờ khai, xong lại dò xem có khớp với tờ khai trên phần mềm không… Anh chị có đang như vậy không ạ?\n\nCông cụ Bảng kê & Tờ khai thuế GTGT từ Excel ra đời từ đặt hàng của một anh kế toán, và anh đã đồng ý mở miễn phí cho mọi người 🧡\n\nTrong video, Đốm chạy thử trọn 3 bước:\n✔ Thả cùng lúc mọi file danh sách – công cụ tự nhận file bán ra, mua vào, nhắc cả loại còn thiếu\n✔ Có ngay bảng kê tổng hợp, tờ khai 01/GTGT lập từ bảng kê\n✔ Tải lên tờ khai XML từ công cụ khác để đối chiếu – chỉ tiêu lệch tô đỏ, kèm gợi ý nguyên nhân\n\nHóa đơn xử lý ngay trên trình duyệt, không gửi ra ngoài.\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=facebook\n\nAnh chị đang soát tờ khai hằng tháng bằng cách nào? Chia sẻ với Đốm nhé 👇\n\n#ketoan #thuegtgt #tokhaithue",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV14b(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v14b'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V14B) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'to-khai-gtgt', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v14b', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v14b', e); }
}

/* v15 (30/10/2026, anh duyệt Cổng 3 12:07): Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 1/2: Bảng kê tổng hợp (Đốm 100%, 2:10) – đăng T2 02/11/2026 19:00. */
const SEED_V15 = [
 {
  "code": "v15",
  "title": "Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 1: Bảng kê tổng hợp",
  "date": "2026-11-02",
  "dur": "2:10",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\15. Bảng kê & Tờ khai thuế GTGT từ Excel_Phần 1_Bảng kê tổng hợp.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v15-bang-ke-tong-hop\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Mỗi kỳ anh chị đang gộp bao nhiêu file hóa đơn để làm bảng kê ạ?",
  "tiktok": {
   "caption": "Gộp bảng kê hóa đơn mua vào, bán ra từ file Excel cổng thuế – không cần gộp tay 📊\n\nĐốm thả 3 file tháng 9: hóa đơn trùng tự bỏ, thuế suất tách sẵn, tải về 1 file Excel 4 sheet có cả dòng tổng cộng.\n\nMỗi kỳ anh chị gộp bao nhiêu file hóa đơn? 👇\n\n#ketoan #bangkethue #hoadondientu #excel",
   "note": "Đốm dẫn – xưng \"Đốm\", gọi \"anh chị\". Theo CAM-NANG-CAPTION. Series Phần 1/2."
  },
  "youtube": {
   "title": "Bảng kê hóa đơn từ Excel cổng thuế – Phần 1/2: Bảng kê tổng hợp",
   "caption": "Thả các file danh sách hóa đơn tải ở cổng thuế – có ngay bảng kê tổng hợp mua vào, bán ra, không cần gộp tay hay viết công thức.\n\n✔ Tự bỏ hóa đơn trùng, tách riêng hóa đơn điều chỉnh, thay thế\n✔ File danh sách không có thuế suất – công cụ tự suy ra, tách sẵn tiền hàng, tiền thuế theo từng mức\n✔ Tải 1 file Excel 4 sheet, có cột tính vào tờ khai, khấu trừ, file nguồn và dòng tổng cộng\n\n📚 Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 1/2\n▶ Phần sau – Phần 2/2: Lập tờ khai & đối chiếu với tờ khai trên phần mềm\n\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #bangkethue #hoadondientu",
   "desc": "Thả các file danh sách hóa đơn tải ở cổng thuế – có ngay bảng kê tổng hợp mua vào, bán ra, không cần gộp tay hay viết công thức.\n\n✔ Tự bỏ hóa đơn trùng, tách riêng hóa đơn điều chỉnh, thay thế\n✔ File danh sách không có thuế suất – công cụ tự suy ra, tách sẵn tiền hàng, tiền thuế theo từng mức\n✔ Tải 1 file Excel 4 sheet, có cột tính vào tờ khai, khấu trừ, file nguồn và dòng tổng cộng\n\n📚 Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 1/2\n▶ Phần sau – Phần 2/2: Lập tờ khai & đối chiếu với tờ khai trên phần mềm\n\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #bangkethue #hoadondientu",
   "tags": "bảng kê hóa đơn, bảng kê tổng hợp, danh sách hóa đơn cổng thuế, thuế suất 8% 10%, tờ khai thuế GTGT, kế toán thuế, quantritute",
   "note": "Shorts dọc 2:10. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 02/11/2026 19:00. Thêm vào danh sách phát: Bảng kê & Tờ khai thuế GTGT từ Excel – Hướng dẫn tính năng."
  },
  "facebook": {
   "caption": "Mỗi kỳ, cổng thuế trả về nhiều file: có mã, không mã, máy tính tiền, mua vào, bán ra… Gộp tay, lọc trùng, rồi ngồi tách từng mức thuế suất. Anh chị có đang làm vậy không ạ?\n\nĐốm thử thả 3 file danh sách tháng 9 vào công cụ Bảng kê & Tờ khai thuế GTGT từ Excel:\n✔ Hóa đơn trùng tự được bỏ, chia sẵn mua vào, bán ra, điều chỉnh – thay thế\n✔ Thuế suất tự suy ra, hóa đơn có cả 8% và 10% tách ước tính – đối chiếu xong, 1 lần bấm là xác nhận\n✔ Tải về 1 file Excel 4 sheet: tiền hàng, tiền thuế tách theo từng mức, có dòng tổng cộng\n\n📚 Phần 1/2 · ▶ Phần 2: lập tờ khai & đối chiếu với tờ khai trên phần mềm\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=facebook\n\nMỗi kỳ anh chị đang gộp bao nhiêu file hóa đơn? Chia sẻ với Đốm nhé 👇\n\n#ketoan #bangkethue #hoadondientu",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV15(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v15'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V15) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'to-khai-gtgt', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v15', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v15', e); }
}

const SEED_V16 = [
 {
  "code": "v16",
  "title": "Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 2: Tờ khai & đối chiếu",
  "date": "2026-11-03",
  "dur": "2:26",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\16. Bảng kê & Tờ khai thuế GTGT từ Excel_Phần 2_Tờ khai & đối chiếu.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v16-to-khai-doi-chieu\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Anh chị thường soát tờ khai với hóa đơn trên cổng thuế bằng cách nào ạ?",
  "tiktok": {
   "caption": "Tờ khai thuế GTGT trên phần mềm kế toán có khớp hóa đơn cổng thuế không? 🔍\n\nĐốm lập tờ khai từ bảng kê ở Phần 1, tải file XML tờ khai của phần mềm lên đối chiếu: 27 chỉ tiêu, chỗ nào lệch tô đỏ, kèm gợi ý chỗ cần tìm.\n\nAnh chị soát tờ khai bằng cách nào? 👇\n\n#ketoan #tokhaithue #thuegtgt #hoadondientu",
   "note": "Đốm dẫn – xưng \"Đốm\", gọi \"anh chị\". Theo CAM-NANG-CAPTION. Series Phần 2/2. Không nhắc tên thương hiệu phần mềm."
  },
  "youtube": {
   "title": "Tờ khai thuế GTGT có khớp cổng thuế? – Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 2/2",
   "caption": "Từ bảng kê tổng hợp ở Phần 1, công cụ lập sẵn tờ khai 01/GTGT, rồi đối chiếu từng chỉ tiêu với tờ khai trên phần mềm kế toán của anh chị.\n\n✔ Tờ khai lập sẵn từ danh sách hóa đơn cổng thuế\n✔ Khung \"Cần xem lại trước khi khai\" nhắc những hóa đơn cần kiểm tra trước khi khai\n✔ Tải file XML tờ khai từ phần mềm lên (chưa có XML thì gõ số): so đủ 27 chỉ tiêu – chỉ tiêu nào lệch, lệch bao nhiêu, nên tìm ở đâu – thấy ngay\n✔ Tải tờ khai ra Excel (tờ khai, 2 bảng kê, phụ lục giảm thuế) và XML theo cấu trúc HTKK – mở kiểm tra trên HTKK trước khi ký nộp\n\n📚 Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 2/2\n◀ Phần trước – Phần 1/2: Bảng kê tổng hợp\n\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #tokhaithue #thuegtgt",
   "desc": "Từ bảng kê tổng hợp ở Phần 1, công cụ lập sẵn tờ khai 01/GTGT, rồi đối chiếu từng chỉ tiêu với tờ khai trên phần mềm kế toán của anh chị.\n\n✔ Tờ khai lập sẵn từ danh sách hóa đơn cổng thuế\n✔ Khung \"Cần xem lại trước khi khai\" nhắc những hóa đơn cần kiểm tra trước khi khai\n✔ Tải file XML tờ khai từ phần mềm lên (chưa có XML thì gõ số): so đủ 27 chỉ tiêu – chỉ tiêu nào lệch, lệch bao nhiêu, nên tìm ở đâu – thấy ngay\n✔ Tải tờ khai ra Excel (tờ khai, 2 bảng kê, phụ lục giảm thuế) và XML theo cấu trúc HTKK – mở kiểm tra trên HTKK trước khi ký nộp\n\n📚 Bảng kê & Tờ khai thuế GTGT từ Excel – Phần 2/2\n◀ Phần trước – Phần 1/2: Bảng kê tổng hợp\n\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=youtube\n\n#ketoan #tokhaithue #thuegtgt",
   "tags": "tờ khai thuế GTGT, đối chiếu tờ khai, tờ khai 01/GTGT, file XML tờ khai, bảng kê hóa đơn, kế toán thuế, quantritute",
   "note": "Shorts dọc 2:26. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 03/11/2026 19:00. Thêm vào danh sách phát: Bảng kê & Tờ khai thuế GTGT từ Excel – Hướng dẫn tính năng."
  },
  "facebook": {
   "caption": "Tờ khai trên phần mềm kế toán lập từ chứng từ đã hạch toán. Hóa đơn chưa hạch toán, hay hạch toán nhầm kỳ, thì tờ khai vẫn lệch mà rất khó phát hiện. Anh chị đang soát lại thế nào ạ?\n\nĐốm đi tiếp từ bảng kê ở Phần 1, thử lập tờ khai và đối chiếu bằng công cụ Bảng kê & Tờ khai thuế GTGT từ Excel:\n✔ Tờ khai 01/GTGT lập sẵn, kèm khung \"Cần xem lại trước khi khai\"\n✔ Tải file XML tờ khai từ phần mềm lên – so đủ 27 chỉ tiêu, khớp hiện ✓, lệch tô đỏ kèm gợi ý chỗ cần tìm\n✔ Tải tờ khai ra Excel và XML theo cấu trúc HTKK để kiểm tra trước khi ký nộp\n\n📚 Phần 2/2 · ◀ Phần 1: Bảng kê tổng hợp\n🔗 https://quantritute.com/cong-cu/to-khai-gtgt?nguon=facebook\n\nAnh chị soát tờ khai với hóa đơn cổng thuế bằng cách nào? Chia sẻ với Đốm nhé 👇\n\n#ketoan #tokhaithue #thuegtgt",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV16(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v16'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V16) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'to-khai-gtgt', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v16', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v16', e); }
}

const SEED_V17 = [
 {
  "code": "v17",
  "title": "Góp ý đầu tiên đã thành tính năng mới",
  "date": "2026-11-04",
  "dur": "2:23",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\17. Góp ý đầu tiên đã thành tính năng mới.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v17-feedback-dau-tien\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Công cụ bạn đang dùng còn thiếu nút nào khiến bạn phải bấm tay từng dòng? Kể Đốm nghe nhé 👇",
  "tiktok": {
   "caption": "Góp ý đầu tiên cho công cụ kế toán của mình – ngay trong ngày đã thành tính năng mới 🧡\n\nChị Hằng đề xuất 1 ô tick để chọn / bỏ cả danh sách hóa đơn sau khi lọc. Giờ chỉ cần 1 lần bấm. Cảm ơn chị!\n\nBạn đang phải bấm tay từng dòng ở đâu? 👇\n\n#ketoan #congcuketoan #hoadondientu #thuegtgt",
   "note": "Anh nói mở đầu + Đốm demo – caption xưng \"mình\", gọi \"bạn\". Theo CAM-NANG-CAPTION. Không ghi link."
  },
  "youtube": {
   "title": "Góp ý đầu tiên của người dùng – thành tính năng mới trong ngày",
   "caption": "Chị Hằng, một chị kế toán, góp ý cho công cụ Bảng kê & Tờ khai thuế GTGT từ Excel: thêm 1 ô để tick / bỏ tick toàn bộ hóa đơn sau khi lọc. Ngay trong ngày, tính năng đã có.\n\nTừ nay mọi góp ý được ghi lại công khai ở Góc cảm ơn, kèm trạng thái và kết quả xử lý; mỗi công cụ có thêm nút Lịch sử cập nhật tính năng.\n\nBạn muốn công cụ có thêm tính năng gì? Gửi Đốm tại đây:\n💛 https://quantritute.com/goc-cam-on?nguon=youtube\n\n#congcuketoan #thuegtgt #hoadondientu",
   "desc": "Chị Hằng, một chị kế toán, góp ý cho công cụ Bảng kê & Tờ khai thuế GTGT từ Excel: thêm 1 ô để tick / bỏ tick toàn bộ hóa đơn sau khi lọc. Ngay trong ngày, tính năng đã có.\n\nTừ nay mọi góp ý được ghi lại công khai ở Góc cảm ơn, kèm trạng thái và kết quả xử lý; mỗi công cụ có thêm nút Lịch sử cập nhật tính năng.\n\nBạn muốn công cụ có thêm tính năng gì? Gửi Đốm tại đây:\n💛 https://quantritute.com/goc-cam-on?nguon=youtube\n\n#congcuketoan #thuegtgt #hoadondientu",
   "tags": "góp ý người dùng, công cụ kế toán, bảng kê hóa đơn, tờ khai thuế GTGT, góc cảm ơn, quantritute",
   "note": "Shorts dọc 2:23. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 04/11/2026 19:00. Thêm vào danh sách phát: Bảng kê & Tờ khai thuế GTGT từ Excel – Hướng dẫn tính năng."
  },
  "facebook": {
   "caption": "Bộ công cụ vừa nhận được feedback đầu tiên 🧡\n\nChị Mai Ngọc Hằng – một chị kế toán đang dùng công cụ Bảng kê & Tờ khai thuế GTGT từ Excel – chấm 5/5 và đề xuất: thêm một ô để tick / bỏ tick toàn bộ hóa đơn sau khi lọc.\n\nMột chi tiết rất nhỏ, nhưng ai từng bấm tay vài chục dòng mới thấy nó tiết kiệm thời gian thế nào. Ngay trong ngày, mình đã cập nhật xong. Cảm ơn chị Hằng!\n\nĐể những góp ý như vậy không bị trôi đi, mình mở thêm Góc cảm ơn: ghi lại từng góp ý, tính năng đề xuất, trạng thái và kết quả xử lý. Mỗi công cụ cũng có thêm nút Lịch sử cập nhật tính năng.\n\nBạn dùng công cụ thấy chỗ nào chưa tiện? Góp ý cho Đốm nhé 👇\n💛 https://quantritute.com/goc-cam-on?nguon=facebook\n\n#congcuketoan #thuegtgt #hoadondientu",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV17(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v17'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V17) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'to-khai-gtgt', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v17', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v17', e); }
}

const SEED_V18 = [
 {
  "code": "v18",
  "title": "Ra mắt In hóa đơn PDF hàng loạt theo danh sách",
  "date": "2026-11-05",
  "dur": "2:54",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\18. Ra mắt In hóa đơn PDF hàng loạt theo danh sách.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v18-ra-mat-in-hoa-don-pdf\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Bạn đang xếp hóa đơn để in theo thứ tự nào: số hóa đơn, ngày lập hay theo bảng kê? Kể Tuấn và Đốm nghe nhé 👇",
  "tiktok": {
   "caption": "Tải về 2.000 file PDF hóa đơn, in sao cho đúng thứ tự, không lẫn? 🖨️\n\nMột chị trưởng phòng nhân sự hỏi vậy, mình làm luôn công cụ in hàng loạt theo danh sách Excel: tự khớp, chia lô, đánh số trang.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại bio👇\n\n#quantritute #inhoadon #hoadondientu #ketoan #gopfilepdf",
   "note": "Anh nói + Đốm demo. Khung CTA + hashtag theo mẫu anh sửa 03/11 (CAM-NANG-CAPTION bản 2). Không link, không nêu tên người đề xuất."
  },
  "youtube": {
   "title": "In 2.000 hóa đơn PDF theo danh sách Excel, không lẫn",
   "caption": "Tải về 2.000 file PDF hóa đơn, in sao cho đúng thứ tự danh sách mà không lẫn? 😊\n\nĐó là câu hỏi một chị trưởng phòng nhân sự gửi lên Bảng ghim. Nhu cầu in hàng loạt theo một danh sách có sẵn đâu chỉ có ở hóa đơn, nên mình làm thành một công cụ riêng.\n\nThả cả thư mục PDF và danh sách Excel vào, công cụ tự khớp, báo thiếu, báo trùng, rồi ghép thành từng lô để in một lệnh. Góc mỗi trang có số thứ tự, lỡ rơi giấy vẫn xếp lại nhanh. Không có danh sách thì xếp theo tên file, dùng được cả với tài liệu PDF khác.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/in-hoa-don-pdf?nguon=youtube\n\n#quantritute #inhoadonhangloat #inpdfhangloat #gopfilepdf #hoadondientu #ketoan",
   "desc": "Tải về 2.000 file PDF hóa đơn, in sao cho đúng thứ tự danh sách mà không lẫn? 😊\n\nĐó là câu hỏi một chị trưởng phòng nhân sự gửi lên Bảng ghim. Nhu cầu in hàng loạt theo một danh sách có sẵn đâu chỉ có ở hóa đơn, nên mình làm thành một công cụ riêng.\n\nThả cả thư mục PDF và danh sách Excel vào, công cụ tự khớp, báo thiếu, báo trùng, rồi ghép thành từng lô để in một lệnh. Góc mỗi trang có số thứ tự, lỡ rơi giấy vẫn xếp lại nhanh. Không có danh sách thì xếp theo tên file, dùng được cả với tài liệu PDF khác.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/in-hoa-don-pdf?nguon=youtube\n\n#quantritute #inhoadonhangloat #inpdfhangloat #gopfilepdf #hoadondientu #ketoan",
   "tags": "in hóa đơn PDF hàng loạt, in hóa đơn theo danh sách excel, in nhiều file PDF cùng lúc, gộp file PDF theo thứ tự, ghép file PDF hóa đơn, in hóa đơn điện tử, hóa đơn điện tử, công cụ kế toán miễn phí, quantritute",
   "note": "Shorts dọc 2:54. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 05/11/2026 19:00. Video này cũng là Video demo của công cụ: có link YouTube thì gắn vào DEMO_VIDEO của công cụ."
  },
  "facebook": {
   "caption": "Tải về 2.000 file PDF hóa đơn, in sao cho đúng thứ tự danh sách mà không lẫn? 😊\n\nĐó là câu hỏi một chị trưởng phòng nhân sự gửi lên Bảng ghim. Nhu cầu in hàng loạt theo một danh sách có sẵn đâu chỉ có ở hóa đơn, nên mình làm thành một công cụ riêng.\n\nThả cả thư mục PDF và danh sách Excel vào, công cụ tự khớp, báo thiếu, báo trùng, rồi ghép thành từng lô để in một lệnh. Góc mỗi trang có số thứ tự, lỡ rơi giấy vẫn xếp lại nhanh. Không có danh sách thì xếp theo tên file, dùng được cả với tài liệu PDF khác.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu/in-hoa-don-pdf?nguon=facebook\n\n#quantritute #inhoadon #inhoadonhangloat #inpdfhangloat #gopfilepdf #hoadondientu #ketoan #ketoanvien #congcuketoan #meovanphong",
   "note": "Đăng dạng Reels."
  }
 }
];
async function migrateV18(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v18'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V18) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'in-hoa-don-pdf', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v18', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v18', e); }
}

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

/* v21 (04/11/2026, anh duyệt Cổng 3 13:02): Góp ý xong, làm sao biết Tuấn đã sửa? (anh nói 100%, nguồn Source gốc 041126/V17.0) – Góc cảm ơn + Lịch sử cập nhật + nhận thông báo qua email – đăng T5 05/11/2026 08:00. Caption theo CAM-NANG-CAPTION bản 3. */
const SEED_V21 = [
 {
  "code": "v21",
  "title": "Góp ý xong, làm sao biết Tuấn đã sửa?",
  "date": "2026-11-05",
  "time": "08:00",
  "dur": "2:27",
  "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\21. Góp ý xong, làm sao biết Tuấn đã sửa.mp4",
  "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v21-goc-cam-on-nhan-thong-bao\\xuat\\thumb-doc-luoi-1080x1920.png",
  "pin": "Bạn đang mất thời gian vào việc lặp đi lặp lại nào nhất? Kể Tuấn nghe nhé 👇",
  "tiktok": {
   "caption": "Góp ý cho công cụ xong, làm sao biết Tuấn đã sửa chưa? 🧡\n\nMình mở Góc cảm ơn: mọi góp ý, đề xuất đều được ghi lại kèm tình trạng xử lý. Mỗi công cụ có thêm Lịch sử cập nhật.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại bio👇\n\n#quantritute #ketoan #congcumienphi #meovanphong #excel",
   "note": "Anh nói 100% – thân bài xưng \"mình\"/\"Tuấn\"; câu kêu gọi gọi \"bạn\". Theo CAM-NANG-CAPTION bản 3. Không link. Đăng 05/11 08:00."
  },
  "youtube": {
   "title": "Góp ý xong, làm sao biết công cụ đã được sửa?",
   "caption": "Góp ý cho công cụ xong, làm sao biết Tuấn đã sửa chưa? 🧡\n\n7 ngày qua, web có hơn 2.100 người truy cập. Nhiều anh chị nhắn tin cảm ơn, đề xuất tính năng mới, góp ý cải thiện công cụ cũ. Nhưng phần lớn không để lại email hay số điện thoại, nên khi sửa xong, mình khó báo lại.\n\nVì vậy mình mở Góc cảm ơn: ghi lại từng góp ý, đề xuất và tình trạng xử lý. Mỗi công cụ cũng có Lịch sử cập nhật phiên bản. Muốn nhận tin khi có công cụ hoặc tính năng mới, anh chị bấm \"Nhận thông báo công cụ mới\" và để lại email.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu?nguon=youtube\n\n#quantritute #congcumienphi #congcuketoan #meovanphong #ketoan",
   "tags": "công cụ kế toán miễn phí, công cụ văn phòng miễn phí, góp ý người dùng, góc cảm ơn, lịch sử cập nhật phiên bản, nhận thông báo công cụ mới, tự động hóa công việc văn phòng, quantritute",
   "note": "Shorts dọc 2:27. Hình thu nhỏ: thumb-ngang-1280x720.png. Lên lịch 05/11/2026 08:00. Video không gắn 1 công cụ → link về kho /cong-cu."
  },
  "facebook": {
   "caption": "Góp ý cho công cụ xong, làm sao biết Tuấn đã sửa chưa? 🧡\n\n7 ngày qua, web có hơn 2.100 người truy cập. Nhiều anh chị nhắn tin cảm ơn, đề xuất tính năng mới, góp ý cải thiện công cụ cũ. Nhưng phần lớn không để lại email hay số điện thoại, nên khi sửa xong, mình khó báo lại.\n\nVì vậy mình mở Góc cảm ơn: ghi lại từng góp ý, đề xuất và tình trạng xử lý. Mỗi công cụ cũng có Lịch sử cập nhật phiên bản. Muốn nhận tin khi có công cụ hoặc tính năng mới, anh chị bấm \"Nhận thông báo công cụ mới\" và để lại email.\n\nNếu bạn cần, hãy sử dụng và góp ý nhé.\nCông cụ miễn phí tại 👇\n📌 https://quantritute.com/cong-cu?nguon=facebook\n\n#quantritute #ketoan #congcumienphi #congcuketoan #meovanphong #ketoanvien #excel #tudonghoa",
   "note": "Đăng dạng Reels, 05/11 08:00."
  }
 }
];
async function migrateV21(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v21'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V21) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'why', '', 'saved', ?3, ?4, ?5, ?6, ?7, ?8, '[]', ?9, ?9)`).bind(v.code, v.title, v.date, v.time, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, pin_comment = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.pin, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v21', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v21', e); }
}

export async function ensureStudioSchema(env) {
  try {
    await env.DB.batch(STUDIO_SCHEMA.map(s => env.DB.prepare(s)));
    const done = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v1'`).first('value');
    if (done) { await migrateV2(env); await migrateV3(env); await migrateV4(env); await migrateV5(env); await migrateV6(env); await migrateV7(env); await migrateV8(env); await migrateV9(env); await migrateV10(env); await migrateV11(env); await migrateV12(env); await migrateV91(env); await migrateV13(env); await migrateV14(env); await migrateV14b(env); await migrateV15(env); await migrateV16(env); await migrateV17(env); await migrateV18(env); await migrateV17b(env); await migrateV20(env); return migrateV21(env); }
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
  await migrateV8(env);
  await migrateV9(env);
  await migrateV10(env);
  await migrateV11(env);
  await migrateV12(env);
  await migrateV91(env);
  await migrateV13(env);
  await migrateV14(env);
  await migrateV14b(env);
  await migrateV15(env);
  await migrateV16(env);
  await migrateV17(env);
  await migrateV18(env);
  await migrateV17b(env);
  await migrateV20(env);
  await migrateV21(env);
}
