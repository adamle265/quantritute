# Mã dựng v01 – Trở lại cùng Đốm (chạy trong máy chủ của Claude, không chạy trên máy anh)
- `rec_web.py` (thư viện quay màn hình web: con trỏ giả, chạm, tô vàng, CDP screencast), `rec_web2.py`, `rec_web3.py` – quay các cảnh web (cần chạy site local: `wrangler pages dev public --port 8790`).
- `build3.py` + `template3.html` – dựng HyperFrames bản cuối (lời anh + phụ đề từ phiên âm, chuyển cảnh luồng sáng, Đốm, cảnh web đổi theo từng ý lời Đốm). `mix2.py` – trộn nhạc/giọng/SFX (đọc mix json do build sinh ra).
- Mở đầu/kết dùng chung: `xuong-video/mo-dau/`. Quy trình: Project doc `claude/quy-trinh-video.md`.
