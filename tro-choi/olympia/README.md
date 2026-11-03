# Game giáo dục · Đường lên đỉnh Olympia (bản thử 0.1 – 03/11/2026)

Trò chơi 1 file HTML, chạy trực tiếp trên trình duyệt, dành cho giáo viên trình chiếu trong lớp (học sinh tiểu học, 2–4 đội).

## File
- `index.html` – bản chạy trên web quantritute.com (phông tự lưu `https://quantritute.com/assets/fonts/fonts.css?v=20261103`, không Google Fonts). Mở trực tiếp bằng Chrome/Edge cũng chạy (phông dự phòng của máy).
- Bản xem thử trên claude.ai: artifact "Đường lên đỉnh Olympia" (dùng Google Fonts chỉ cho bản xem thử).

## Đã có
- 4 vòng: Khởi động (mỗi đội 5 câu, 15 giây, 10 điểm) · Vượt chướng ngại vật (4 hàng ngang + tranh 4 mảnh + ô trung tâm, từ khóa 40 điểm, đoán sai bị dừng vòng) · Tăng tốc (4 câu, 20 giây, 10–20–30–40 hoặc chế độ theo tốc độ 40–30–20–10) · Về đích (mỗi đội chọn mức 20/30/40 cho 3 câu, ngôi sao hy vọng ×2, giành quyền trả lời).
- Nút: Bắt đầu, Chọn đội, Chọn đáp án (máy tự chấm câu trắc nghiệm), Đúng/Sai, Hiện đáp án, Câu tiếp theo, Quay lại (hoàn tác từng bước, điểm tính lại), Chơi lại; sửa điểm tay ±10 dưới mỗi bục.
- Đồng hồ đếm ngược (bấm để dừng/chạy), bảng xếp hạng sau mỗi vòng, màn chung cuộc: pháo hoa, vỗ tay, "CHÚC MỪNG NHÀ VÔ ĐỊCH!", bảng điểm theo từng vòng.
- Âm thanh tự tổng hợp bằng Web Audio (nhạc nền, đúng, sai, tích tắc, hết giờ, vỗ tay) – không dùng file nhạc bên ngoài, không lo bản quyền nhạc.
- Thiết lập giáo viên: tên trò chơi, môn, lớp, chủ đề, số đội, tên đội, số câu/thời gian/điểm từng vòng, bật/tắt ngôi sao hy vọng và trừ điểm; soạn từng câu, dán nhiều câu từ Excel (Câu hỏi · A · B · C · D · Đáp án), tải ảnh bí ẩn; lưu/mở bộ câu hỏi ra file JSON hoặc sao chép mã.
- Bộ câu hỏi mẫu lớp 4–5 (49 câu) – **cần giáo viên/anh rà lại nội dung trước khi công bố**.
- Lưu trên trình duyệt người dùng (localStorage); trận đang chơi tự lưu, tải lại trang vẫn tiếp tục. Không gửi dữ liệu lên máy chủ, không thu thông tin cá nhân.
- Phím tắt: Cách (đồng hồ), → (tiếp), ← (quay lại), 1–4 (đáp án), F (toàn màn hình), M (nhạc).

## Chưa làm / cần anh quyết
- Tên "Đường lên đỉnh Olympia" là tên chương trình của VTV → trước khi đưa lên web công khai nên đổi tên mặc định (tên trò chơi sửa được trong Thiết lập) và không dùng logo/nhạc hiệu của chương trình.
- Chưa đưa lên quantritute.com (chưa có bản ghi database, ảnh giao diện, mục "Trò chơi" trên web).
- Câu hỏi phụ khi hòa điểm chung cuộc: hiện hiển thị "đồng hạng nhất".
