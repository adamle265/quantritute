-- NỘI DUNG MẪU (đường dẫn bắt đầu bằng mau-). Xóa bằng .\xoa-mau.cmd
INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, featured, status, published_at, preview_key, seo_desc, created_at, updated_at)
VALUES ('mau-chuyen-o-west-point', 'Chuyện ở West Point', 'Vì sao một học viện quân sự lại “sản xuất” nhiều nhà lãnh đạo doanh nghiệp đến vậy? Câu trả lời nằm ở cách họ rèn con người mỗi ngày.', 'Bài viết kể về Học viện Quân sự West Point của Mỹ – nơi không chỉ đào tạo sĩ quan mà còn cho ra đời rất nhiều lãnh đạo doanh nghiệp. Điều làm nên khác biệt không phải là tố chất bẩm sinh, mà là một quy trình rèn luyện bền bỉ, khắt khe và có hệ thống.

## Rèn con người bằng quy trình, không bằng may mắn
Sinh viên được đặt vào lịch sinh hoạt chặt chẽ: thể lực, học tập, kỷ luật, làm việc nhóm. Mỗi ngày đều có mục tiêu cụ thể. Với người làm quản trị, đây là gợi ý quan trọng: muốn có đội ngũ giỏi, hãy thiết kế môi trường và thói quen giúp họ giỏi lên.

> Con người tốt lên nhờ thói quen được thiết kế, không phải nhờ khẩu hiệu.

## Ba điều có thể mang vào công việc văn phòng
- **Quan sát tỉnh táo:** nhìn kỹ vấn đề trước khi ra quyết định.
- **Rèn luyện liên tục:** mỗi tuần học thêm một kỹ năng nhỏ, đều đặn.
- **Quản lý thời gian:** lên kế hoạch cho từng ngày thay vì để việc cuốn đi.

## Góc nhìn Quản trị tử tế
Tử tế với nhân viên không có nghĩa là dễ dãi. Đặt ra chuẩn mực rõ ràng, đồng hành để họ đạt được chuẩn mực đó – đó mới là lấy con người làm gốc.

---

## Câu hỏi cho bạn
Trong đội của bạn, thói quen nào đang giúp mọi người giỏi lên – và thói quen nào đang kéo lùi?

---

*Bài mẫu để xem giao diện: tóm ý và cảm nhận từ bài gốc của Tony Buổi Sáng. Đọc toàn văn tại [tonybuoisangonline.com](https://www.tonybuoisangonline.com/chuyen-o-west-point-wp.html).*', '/assets/blog-mau/mau-1.jpg', 'Ảnh minh họa mẫu: ánh đèn bàn chiếu xuống mặt bàn gỗ', 'quan-tri', 1, 'published', '2026-10-06', lower(hex(randomblob(12))), 'Vì sao một học viện quân sự lại “sản xuất” nhiều nhà lãnh đạo doanh nghiệp đến vậy? Câu trả lời nằm ở cách họ rèn con người mỗi ngày.', strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, cover_url=excluded.cover_url, cover_alt=excluded.cover_alt, topics=excluded.topics, featured=excluded.featured, status=excluded.status, published_at=excluded.published_at, seo_desc=excluded.seo_desc, updated_at=excluded.updated_at;
INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, featured, status, published_at, preview_key, seo_desc, created_at, updated_at)
VALUES ('mau-chon-ban-lam-an', 'Chọn bạn làm ăn (Bài 1)', 'Hợp tác làm ăn dễ tan vỡ nhất khi chọn sai người. Phẩm chất đầu tiên cần tìm ở một người cộng sự là gì?', 'Bài viết mở đầu loạt bài về chọn đối tác, nhấn mạnh rằng rất nhiều công ty không chết vì thị trường mà chết vì nội bộ những người sáng lập.

## Phẩm chất đầu tiên: hào sảng
Theo tác giả, điều kiện cần của một người bạn làm ăn là sự hào sảng – sẵn sàng chịu thiệt một chút vì cái chung. Người chỉ nhăm nhăm phần lợi cho mình sớm muộn sẽ làm rạn vỡ sự hợp tác.

> Chọn cộng sự là chọn người cùng mình đi qua những ngày khó, không chỉ ngày vui.

## Dấu hiệu nên dè chừng
- Tính toán chi li từng phần lợi nhỏ.
- Nói nhiều về quyền, ít nói về trách nhiệm.
- Khi có sự cố thì tìm người để đổ lỗi.

## Áp dụng khi tuyển người cho đội nhỏ
Với doanh nghiệp nhỏ, mỗi người như một cộng sự. Khi phỏng vấn, hãy hỏi về một lần họ đã nhường phần lợi cho đồng đội – câu trả lời nói nhiều hơn bằng cấp.

---

*Bài mẫu để xem giao diện: tóm ý và cảm nhận từ bài gốc của Tony Buổi Sáng. Đọc toàn văn tại [tonybuoisangonline.com](https://www.tonybuoisangonline.com/chon-ban-lam-an-bai-1.html).*', '/assets/blog-mau/mau-2.jpg', 'Ảnh minh họa mẫu: ánh đèn bàn chiếu xuống mặt bàn gỗ', 'quan-tri', 0, 'published', '2026-10-05', lower(hex(randomblob(12))), 'Hợp tác làm ăn dễ tan vỡ nhất khi chọn sai người. Phẩm chất đầu tiên cần tìm ở một người cộng sự là gì?', strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, cover_url=excluded.cover_url, cover_alt=excluded.cover_alt, topics=excluded.topics, featured=excluded.featured, status=excluded.status, published_at=excluded.published_at, seo_desc=excluded.seo_desc, updated_at=excluded.updated_at;
INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, featured, status, published_at, preview_key, seo_desc, created_at, updated_at)
VALUES ('mau-chong-chenh-tuoi-25', 'Chông chênh tuổi 25', 'Bỏ công việc lương cao để về quê làm nông sản – một lá thư tuổi 25 về việc đi tìm điều có ý nghĩa.', 'Bài viết là lá thư của một cô gái 25 tuổi rời công ty đa quốc gia để khởi nghiệp xuất khẩu nông sản, với mong muốn giúp bà con quê mình không còn bị ép giá.

## Khi công việc ổn định nhưng thấy thiếu
Văn phòng máy lạnh, lương tốt, nhưng mỗi ngày trôi qua giống nhau. Cảm giác "chông chênh" không đến từ thiếu tiền, mà từ thiếu một lý do để cố gắng.

> “Có dượng, tuổi 25 của con đã không còn chông chênh.” — Tony Buổi Sáng

## Ba điều rút ra
1. Sứ mạng quan trọng hơn sự an toàn.
2. Kiến thức chỉ có giá trị khi được đem ra làm.
3. Tuổi trẻ là lúc tốt nhất để dấn thân và sai.

## Câu hỏi cho bạn
Nếu không phải lo về tiền trong một năm tới, bạn sẽ dành thời gian để giải quyết vấn đề gì?

---

*Bài mẫu để xem giao diện: tóm ý và cảm nhận từ bài gốc của Tony Buổi Sáng. Đọc toàn văn tại [tonybuoisangonline.com](https://www.tonybuoisangonline.com/chong-chenh-tuoi-25.html).*', '/assets/blog-mau/mau-3.jpg', 'Ảnh minh họa mẫu: ánh đèn bàn chiếu xuống mặt bàn gỗ', 'hanh-trinh', 0, 'published', '2026-10-04', lower(hex(randomblob(12))), 'Bỏ công việc lương cao để về quê làm nông sản – một lá thư tuổi 25 về việc đi tìm điều có ý nghĩa.', strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, cover_url=excluded.cover_url, cover_alt=excluded.cover_alt, topics=excluded.topics, featured=excluded.featured, status=excluded.status, published_at=excluded.published_at, seo_desc=excluded.seo_desc, updated_at=excluded.updated_at;
INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, featured, status, published_at, preview_key, seo_desc, created_at, updated_at)
VALUES ('mau-chuyen-tien-chuyen-bac', 'Chuyện tiền chuyện bạc', 'Tiền không thay đổi con người – tiền làm lộ ra con người. Vài câu chuyện đời thường về cách mỗi người đối xử với đồng tiền.', 'Bài viết kể những câu chuyện thật về tiền bạc: người bạn cũ, những tình nguyện viên… và cách thái độ của họ thay đổi khi có lợi ích vật chất.

## Tiền là phép thử
Lúc chưa có gì, ai cũng hào phóng bằng lời. Khi có lợi ích thật, bản chất mới hiện ra. Vì vậy hãy quan sát cách một người xử lý những khoản tiền nhỏ.

> Dò sông dò biển dễ dò, nào ai lấy thước mà đo lòng người. — Ca dao

## Giữ mình trước đồng tiền
- Rõ ràng sổ sách, kể cả với người thân.
- Thỏa thuận bằng văn bản trước khi góp vốn.
- Biết đủ, để đồng tiền là công cụ chứ không là ông chủ.

## Liên hệ công việc kế toán
Minh bạch dòng tiền là nền tảng của niềm tin trong doanh nghiệp. Một bảng đối chiếu rõ ràng mỗi tháng tránh được rất nhiều hiểu lầm.

---

*Bài mẫu để xem giao diện: tóm ý và cảm nhận từ bài gốc của Tony Buổi Sáng. Đọc toàn văn tại [tonybuoisangonline.com](https://www.tonybuoisangonline.com/chuyen-tien-chuyen-bac.html).*', '/assets/blog-mau/mau-4.jpg', 'Ảnh minh họa mẫu: ánh đèn bàn chiếu xuống mặt bàn gỗ', 'hanh-trinh,gia-dinh', 0, 'published', '2026-10-03', lower(hex(randomblob(12))), 'Tiền không thay đổi con người – tiền làm lộ ra con người. Vài câu chuyện đời thường về cách mỗi người đối xử với đồng tiền.', strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, cover_url=excluded.cover_url, cover_alt=excluded.cover_alt, topics=excluded.topics, featured=excluded.featured, status=excluded.status, published_at=excluded.published_at, seo_desc=excluded.seo_desc, updated_at=excluded.updated_at;
INSERT INTO posts (slug, title, excerpt, body, cover_url, cover_alt, topics, featured, status, published_at, preview_key, seo_desc, created_at, updated_at)
VALUES ('mau-oc-lanh-loi', 'Óc lanh lợi', 'Bài mẫu ở trạng thái Chờ duyệt – dùng để anh thử nút “Duyệt & đăng” trong trang quản trị.', '## Bài này để thử tính năng
Mở bài này trong Quản trị → Blog · Bài viết, xem link "Xem trước bài trên web", rồi bấm "✓ Duyệt & đăng" để thấy bài xuất hiện ngoài trang Blog với ngày đăng hôm nay.

## Thử thêm
- Đổi chủ đề, tải ảnh banner khác.
- Sửa tiêu đề SEO và xem khung xem trước Google / Facebook thay đổi.

## Sau khi thử
Chạy lệnh xóa mẫu để dọn sạch.

---

*Bài mẫu ở trạng thái CHỜ DUYỆT để anh thử quy trình duyệt. Tham khảo bài gốc của Tony Buổi Sáng tại [tonybuoisangonline.com](https://www.tonybuoisangonline.com/oc-lanh-loi.html).*', '/assets/blog-mau/mau-5.jpg', 'Ảnh minh họa mẫu: ánh đèn bàn chiếu xuống mặt bàn gỗ', 'quan-tri', 0, 'review', '', lower(hex(randomblob(12))), 'Bài mẫu ở trạng thái Chờ duyệt – dùng để anh thử nút “Duyệt & đăng” trong trang quản trị.', strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, cover_url=excluded.cover_url, cover_alt=excluded.cover_alt, topics=excluded.topics, featured=excluded.featured, status=excluded.status, published_at=excluded.published_at, seo_desc=excluded.seo_desc, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, youtube_url, summary, reflection, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('video', 'mau-v-ngung-tri-hoan', 'Cách chấm dứt hẳn thói trì hoãn', 'Better Version', 'https://www.youtube.com/watch?v=L4vSH66xzaE', 'Video tóm tắt sách về sự trì hoãn của kênh Better Version: vì sao ta trì hoãn và cách bắt đầu việc khó.', '[MẪU] Trì hoãn thường không phải do lười, mà do việc quá to và chưa rõ bước đầu tiên.
[MẪU] Chia việc thành bước 5 phút là cách Tuấn hay dùng khi làm công cụ mới.', 'Việc nào bạn đã hoãn hơn một tuần – bước 5 phút đầu tiên của nó là gì?', 'published', '2026-10-06', 10, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, youtube_url=excluded.youtube_url, summary=excluded.summary, reflection=excluded.reflection, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, youtube_url, summary, reflection, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('video', 'mau-v-tinh-tao-giua-dam-dong', 'Giữ đầu óc tỉnh táo giữa đám đông ồn ào', 'Better Version', 'https://www.youtube.com/watch?v=CORjd1BYJHI', 'Video tóm tắt sách tâm lý học đám đông: cách giữ suy nghĩ độc lập khi xung quanh nhiều luồng ý kiến.', '[MẪU] Trong cuộc họp, ý kiến đầu tiên dễ trở thành ý kiến của cả phòng.
[MẪU] Người quản lý nên để mọi người viết ý kiến riêng trước khi thảo luận.', 'Lần gần nhất bạn đổi ý chỉ vì mọi người đều nghĩ khác là khi nào?', 'published', '2026-10-05', 11, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, youtube_url=excluded.youtube_url, summary=excluded.summary, reflection=excluded.reflection, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, youtube_url, summary, reflection, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('video', 'mau-v-tuc-gian', 'Tư duy này quyết định tính khí của bạn', 'Better Version', 'https://www.youtube.com/watch?v=qGUDoUoQVgU', 'Video tóm tắt sách “Bạn có thể tức giận, nhưng đừng càng nghĩ càng giận” của kênh Better Version.', '[MẪU] Tức giận là tín hiệu, càng nghĩ càng giận mới là lựa chọn.
[MẪU] Một quy tắc nhỏ: không trả lời tin nhắn công việc khi đang bực.', 'Điều gì thường khiến bạn “càng nghĩ càng giận” trong công việc?', 'published', '2026-10-04', 12, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, youtube_url=excluded.youtube_url, summary=excluded.summary, reflection=excluded.reflection, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, youtube_url, summary, reflection, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('video', 'mau-v-su-an-bai', 'Những gì diễn ra không như ý là sự an bài khác của số phận', 'Better Version', 'https://www.youtube.com/watch?v=F2IOBPVn47Y', 'Video của kênh Better Version về cách nhìn lại những biến cố không như ý.', '[MẪU] Có những ngã rẽ chỉ hiểu được khi nhìn lại sau vài năm.', 'Một điều không như ý nào trước đây đã dẫn bạn đến điều tốt hôm nay?', 'published', '2026-10-03', 13, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, youtube_url=excluded.youtube_url, summary=excluded.summary, reflection=excluded.reflection, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;

-- 10 SÁCH MẪU cho Tủ sách (danh sách tham khảo: Fahasa – Top 10 sách self-help). Nội dung Trước/Sau và trích dẫn là [MẪU]
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-7-thoi-quen', '7 Thói Quen Hiệu Quả', 'Stephen R. Covey', '#2F4F6B', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Bắt đầu với mục tiêu trong đầu; ưu tiên việc quan trọng trước việc khẩn cấp
Tư duy cùng thắng thay vì thắng – thua
Lắng nghe để hiểu trước khi muốn được hiểu', 'Tuần này, việc quan trọng nhưng không khẩn cấp nào bạn lại để lùi?', 'published', '2026-10-07', 20, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-nha-gia-kim', 'Nhà Giả Kim', 'Paulo Coelho', '#B0743A', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Theo đuổi điều mình thật sự muốn là một hành trình, không phải một đích đến
Những trở ngại trên đường cũng là một phần của bài học', 'Ước mơ nào bạn đã cất đi vì "chưa phải lúc"?', 'published', '2026-10-07', 21, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-tu-duy-nhanh-cham', 'Tư Duy Nhanh Và Chậm', 'Daniel Kahneman', '#3D6E6A', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Bộ não có hai hệ thống: nhanh – trực giác và chậm – cân nhắc
Nhiều quyết định sai đến từ lối tắt của tư duy nhanh
Quyết định quan trọng cần được làm chậm lại có chủ đích', 'Quyết định gần nhất bạn làm "theo cảm giác" là gì – nếu làm chậm lại, kết quả có khác?', 'published', '2026-10-07', 22, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-dam-bi-ghet', 'Dám Bị Ghét', 'Kishimi Ichiro & Koga Fumitake', '#7A3B4B', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Tách bạch việc của mình và việc của người khác
Sống theo kỳ vọng của người khác khiến ta mất tự do
Hạnh phúc đến từ cảm giác đóng góp', 'Bạn đang gánh "việc của người khác" nào mà không cần thiết?', 'published', '2026-10-07', 23, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-nguoi-giau-babylon', 'Người Giàu Nhất Thành Babylon', 'George S. Clason', '#C9A15A', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Trả cho mình trước: để dành một phần thu nhập đều đặn
Để đồng tiền làm việc cho mình
Học hỏi từ người có kinh nghiệm trước khi đầu tư', 'Tháng này bạn đã "trả cho mình trước" bao nhiêu phần trăm thu nhập?', 'published', '2026-10-07', 24, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-nghi-giau-lam-giau', 'Nghĩ Giàu Làm Giàu', 'Napoleon Hill', '#5B6B3A', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Mong muốn rõ ràng là điểm khởi đầu của thành tựu
Kiên trì và kế hoạch cụ thể biến mong muốn thành hiện thực
Nhóm cộng sự cùng chí hướng nhân sức mạnh lên', 'Mục tiêu năm nay của bạn đã được viết ra thành kế hoạch cụ thể chưa?', 'published', '2026-10-07', 25, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-atomic-habits', 'Atomic Habits', 'James Clear', '#8E3B2F', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Thay đổi nhỏ 1% mỗi ngày cộng dồn thành khác biệt lớn
Thiết kế môi trường để thói quen tốt dễ làm hơn
Gắn thói quen với bản sắc: "tôi là người…"', 'Thói quen nhỏ nào bạn có thể bắt đầu ngay hôm nay trong 2 phút?', 'published', '2026-10-07', 26, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-cha-giau-cha-ngheo', 'Cha Giàu, Cha Nghèo', 'Robert T. Kiyosaki & Sharon L. Lechter', '#6E4A86', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Phân biệt tài sản và tiêu sản
Học về tài chính quan trọng không kém học để đi làm
Để tiền làm việc cho mình thay vì chỉ làm việc vì tiền', 'Thứ bạn đang gọi là "tài sản" có thật sự mang tiền về cho bạn không?', 'published', '2026-10-07', 27, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-minh-la-ca', 'Mình Là Cá, Việc Của Mình Là Bơi', 'Takeshi Furukawa', '#2E3A55', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Chấp nhận bản thân là bước đầu để sống vui
Bớt so sánh với người khác
Những thói quen nhỏ giúp vượt qua suy nghĩ tiêu cực', 'Bạn đang cố "trèo cây" ở việc gì, trong khi điểm mạnh của bạn là "bơi"?', 'published', '2026-10-07', 28, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
INSERT INTO reflections (kind, slug, title, author, color, before_text, after_text, quotes, lessons, question, status, published_at, sort, visible, created_at, updated_at)
VALUES ('book', 'mau-s-doi-ngan-dung-ngu-dai', 'Đời Ngắn Đừng Ngủ Dài', 'Robin Sharma', '#B44A35', '[MẪU] Chỗ này anh ghi: trước khi đọc, anh từng nghĩ thế nào về chủ đề của cuốn sách.', '[MẪU] Chỗ này anh ghi: sau khi đọc, anh đã nghĩ khác và làm khác điều gì.', '[MẪU] Câu anh gạch chân trong sách (chép nguyên văn, ngắn) | tr. ...', 'Thời gian là tài sản quý nhất, đừng trì hoãn điều quan trọng
Sống có mục đích và theo đuổi đam mê
Mỗi ngày là cơ hội để làm tốt hơn hôm qua', 'Nếu chỉ còn một năm, bạn sẽ ngừng làm điều gì ngay?', 'published', '2026-10-07', 29, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)
ON CONFLICT(slug) DO UPDATE SET title=excluded.title, author=excluded.author, color=excluded.color, before_text=excluded.before_text, after_text=excluded.after_text, quotes=excluded.quotes, lessons=excluded.lessons, question=excluded.question, status=excluded.status, sort=excluded.sort, updated_at=excluded.updated_at;
