# Phòng làm việc cùng Đốm – Bản thử 0.1 (Nấc 1)

Ý tưởng coworking online, nấc 1: một người dùng, chạy hoàn toàn trên trình duyệt, chưa gắn vào web quantritute.

- Bản xem online (artifact): https://claude.ai/artifact/DGXggKKyUZMB486hc9CQy3
- Bản trên máy: mở `ban-thu-0.1/index.html` bằng Chrome/Edge (cần giữ nguyên thư mục `assets/`).

## Có gì trong bản 0.1
- 3 chỗ ngồi: Bàn làm việc dưới đèn (dây kéo bật/tắt đèn), Bên cửa sổ đêm mưa (vẽ bằng canvas), Góc tối giản.
- Đồng hồ Pomodoro hiện ngay trên màn hình laptop (màn rộng); màn hẹp chuyển thành thẻ nổi.
- Nhịp 25·5, 50·10, 90·20, tự đặt; nghỉ dài sau N phiên; tự chuyển phiên; giữ màn hình sáng; thông báo trình duyệt (nếu được phép).
- Nhạc: Nhạc nền Quản trị tử tế, Glass Wing Sonata (lặp). Âm nền tự tạo bằng Web Audio: mưa, sóng biển, ồn nâu.
- Giấy note ghi mục tiêu phiên; Đốm nhắc theo từng giai đoạn (bắt đầu, nửa chặng, xong, nghỉ, tạm dừng, ngủ gật khi để lâu).
- Hôm nay: số phiên xong, phút tập trung, chuỗi ngày, biểu đồ 7 ngày, danh sách phiên. Lưu localStorage trên máy người dùng, không gửi máy chủ.
- Phím tắt: Space, F, H, Esc.

## Ảnh & nhạc dùng lại
- `assets/ban-bat.webp`, `ban-tat.webp`: cắt từ `site/public/assets/desk-on/off.webp` (bỏ góc có dấu Gemini), 1920×1080.
- `assets/dom/*-toi.webp`: chép từ `site/public/assets/dom/`.
- `assets/nhac/`: chép từ `Nhạc nền quantritute.mp3`, `Glass Wing Sonata.mp3`.
- Toạ độ màn hình laptop trong ảnh: left .40625, top .58889, width .26328, height .28889 (đo trên ảnh gốc).
