# Xưởng video Quản trị tử tế (bản thử 11/10/2026)

Quy trình 1 short giới thiệu công cụ:
1. `tap/<mã>/kich-ban.json`: kịch bản theo khung F1 (cảnh, lời Đốm, chữ trên hình, tư thế Đốm). Anh duyệt.
2. `tao-giong-dom.cmd` (nhấp đúp): VieNeu-TTS đọc từng câu → `tap/<mã>/giong/<giọng>/`. Thêm `--chi-giong-chon` để chỉ đọc giọng đã chọn.
3. `scripts/chup_demo.py`: Playwright tự mở công cụ, chụp màn hình dọc (1080 px) từng tính năng.
4. `remotion/`: mẫu dựng 9:16 (phòng tối – đèn vàng – Đốm – khung công cụ – phụ đề). `node build-data.mjs ../tap/<mã>` rồi `npx remotion render src/index.jsx Short out.mp4`.
5. Chuẩn hóa âm lượng -14 LUFS (ffmpeg loudnorm) → `tap/<mã>/xuat/`.

Nhạc nền: `scripts/tao_nhac.py` tự tổng hợp, không dùng nhạc bên thứ ba.
