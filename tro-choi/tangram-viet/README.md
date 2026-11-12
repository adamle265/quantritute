# Tangram Việt – bản 0.5 (12/11/2026)

Game xếp hình 7 mảnh với **23 hình Việt** chia 4 bộ sưu tập, mỗi hình có mức Dễ / Vừa / Khó, tranh minh họa tự vẽ và một câu chuyện có nguồn.
Link: **https://quantritute.com/tro-choi/tangram-viet/** – từ bản 0.5 đã gắn lên web qua menu **Góc giải trí** (`/goc-giai-tri`), cho Google lập chỉ mục.
Quản trị: menu **Trò chơi → Tangram Việt** (bật/tắt, giới thiệu, sửa câu chuyện từng hình, báo cáo lượt truy cập/lượt chơi). Máy chủ: `src/games.js`.

## Lịch sử
- **0.5 (12/11 tối):** Đốm vui vẻ nói câu ngỏ trong hộp hội thoại · nút ← Bộ công cụ cạnh tiêu đề · nút **Chia sẻ** (popup chúc mừng) và **Chia sẻ thành tích** (bảng thành tích): tạo ảnh thành tích 1200×630, Chia sẻ ngay (điện thoại), Facebook, X, LinkedIn, sao chép lời + link, tải ảnh · đọc bật/tắt + câu chuyện đã sửa từ Quản trị (`/api/games/tangram-viet`), tắt thì hiện trang "tạm nghỉ" · đếm lượt truy cập / lượt chơi / lượt ghép xong (`/api/game-hit`, không gửi biệt danh hay thành tích) · bỏ `noindex`, ảnh chia sẻ mới `anh-chia-se-v05.jpg` · thêm `du-lieu.json` (câu chuyện gốc + tranh, để trang Quản trị hiện bản gốc) · điện thoại: thanh đầu gọn (chỉ số đã xong + thời gian, iPhone SE chỉ số đã xong).
- **0.4.1 (12/11 chiều):** thêm 2 hình **Hoa sen** (Làng quê, Dễ) và **Quốc kỳ** (Di sản & biểu tượng, Dễ – lá cờ đúng tỉ lệ 3:2) kèm tranh + câu chuyện → 23 hình; đổi tên bộ "Di sản" thành "Di sản & biểu tượng"; câu ngỏ dưới tiêu đề "Anh/chị đã làm việc rất chăm chỉ…"; dòng "Ghép 7 mảnh thành hình: …" chuyển vào bảng ghép, ngay trên hình mẫu.
- **0.4 (12/11 sáng):** vùng ghép tự co giãn theo màn hình (điện thoại to gấp khoảng 2 lần) · nút Toàn màn hình (Android/máy tính dùng toàn màn hình thật; iPhone ẩn phần đầu trang) · điện thoại: thanh "Chọn hình" gọn + 7 nút đáy chia đều, chạy cả màn 320px · kéo mượt theo khung hình, chạm vào mảnh là xoay ngay, vùng chạm rộng hơn · ghép xong mở popup chúc mừng + "Bạn có biết?" + câu chuyện chia đoạn · bỏ phần nguồn khỏi giao diện (nguồn vẫn liệt kê ở cuối file này) · Nhạc/Rung/Tiếng gom vào nút Cài đặt (Nhạc vẫn có nút riêng).
- **0.3 (12/11):** biệt danh khi vào lần đầu · 21 hình / 4 bộ sưu tập + Dễ/Vừa/Khó · câu chuyện + nguồn (nút "Đọc chuyện", đọc lại trong Thành tích) · bảng thành tích cá nhân (chỉ hình đã xong, lưu trên trình duyệt) · rung khi mảnh khớp + nút bật/tắt rung · nhạc nền thương hiệu + nút bật/tắt · ảnh chia sẻ riêng `anh-chia-se-v03.jpg`.
- **0.2 (11/11 10:40):** 8 tranh minh họa, mảnh ghép kiểu gỗ sơn, chữ/nút to rõ.
- **0.1 (11/11 09:10):** bản đầu, 8 hình.

## Bộ sưu tập (độ khó)
| Bộ | Dễ | Vừa | Khó |
|---|---|---|---|
| Làng quê | Mái nhà, Gà trống, Con mèo, Hoa sen | Nón lá, Người nông dân | Con trâu |
| Tết & lễ hội | Ấm trà | Cá chép, Con dê | Bánh chưng, Bao lì xì |
| Di sản & biểu tượng | Tháp Chăm, Quốc kỳ | Chùa Một Cột, Trống đồng | Cột cờ Hà Nội, Chùa Cầu |
| Sông nước & muông thú | Thuyền buồm, Con vịt | Con rùa, Con thỏ | Con voi |

Độ khó: máy đếm số cách xếp đúng của từng hình + độ "kín" của hình bóng, có tinh chỉnh tay. Sau khi có người chơi thật nên hiệu chỉnh theo thời gian giải trung bình.

## Dữ liệu người chơi
Biệt danh và thành tích không gửi lên máy chủ. Máy chủ chỉ nhận tín hiệu đếm ẩn danh {trò chơi, loại: visit|play|win} – nhận biết trùng bằng mã băm IP trong ngày, không lưu IP. `localStorage` khoá `tangramViet.v1`: biệt danh, hình đã xong (thời gian tốt nhất, số lượt, số gợi ý, ngày xong dd/mm/yyyy, số lần chơi), cài đặt nhạc/rung/tiếng, hình đang chơi.

## Kỹ thuật
- 1 file `index.html` (+ `du-lieu.json`, `anh-chia-se-v05.jpg`, `nhac-nen.mp3` 1,3 MB cắt từ "Nhạc nền quantritute.mp3", mono 80 kbps).
- Mỗi hình được **máy giải và kiểm chứng** (đủ 7 mảnh, không chồng); đã chạy thử tự động ghép xong cả 21 hình trên máy tính và điện thoại.
- Rung: dùng `navigator.vibrate` – Android Chrome có; **iPhone (Safari) không hỗ trợ rung**, nút Rung tự ẩn.
- Nhạc chỉ phát sau khi người chơi bấm (trình duyệt chặn tự phát).
- Xuất bản: nhấp đúp `xuat-ban-web.cmd` (chép file sang `site/public/tro-choi/tangram-viet/` rồi `npm run deploy:site`). `site/public/_routes.json` đã thêm `/tro-choi/*` vào exclude để phục vụ tĩnh.

## Nguồn câu chuyện
Ghi ngay trong từng hình (Wikipedia, Nhân Dân, Việt Nam News, VnExpress, SGGP, Báo Đầu tư, Đại biểu Nhân dân, cổng PBGDPL Cần Thơ…). Chi tiết các nguồn ghi khác nhau đã được bỏ (ví dụ người vẽ lá cờ – còn tranh cãi). Nguồn 2 hình mới: Cổng TTĐT Chính phủ (Quốc kỳ), Wikipedia Flag of Vietnam, Tuổi Trẻ (quốc hoa), Wikipedia Nelumbo nucifera.
