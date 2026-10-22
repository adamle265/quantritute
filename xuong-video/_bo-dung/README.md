# Bộ dựng video dùng chung (cập nhật 20/10/2026, từ v08)

Một gói để hội thoại mới dựng môi trường làm video trên máy chủ đám mây bằng **1 lần chuyển file + 1 lệnh**.

## Cách dùng
1. Chuyển `bo-dung-chung.tgz` vào máy chủ (device_stage_files), giải nén vào `/home/claude/bo-dung`.
2. `bash /home/claude/bo-dung/setup.sh v09 "DÒNG 1|DÒNG 2"` (~3–4 phút: cài npm, phông, sfx, render mở đầu + kết).
3. Chuyển thêm: bản công cụ mới nhất (`cong-cu/<công cụ>/app/index.html` → `/home/claude/w/<mã>/rec/site/tool.html`), dữ liệu giả (`tap/_hoa-don-chung/du-lieu-gia/*.zip` → `/home/claude/w/<mã>/gia/`), giọng đọc (`tap/<mã>/giong/...wav` → `/home/claude/w/<mã>/dung/hf/assets/a/`, kịch bản json → `/home/claude/w/<mã>/kich-ban-v1.json`).
4. Bật web local: `cd /home/claude/w/<mã>/rec/site && nohup python3 -m http.server 8794 &`.

## Trong gói
| Thư mục | Nội dung |
|---|---|
| `assets/brand` | Đốm (sáng/tối), logo, nhạc thương hiệu `nhac-noi.flac` (bản gốc 2 phút nối acrossfade thành ~4 phút – dùng cho mọi video) |
| `assets/site` | Ảnh bàn làm việc, màn Bộ công cụ cho cảnh mở đầu |
| `mo-dau/` | `md-mau.html` (mở đầu chuẩn, thanh laptop ghi "Bộ công cụ"), `dung_mo_dau.py` (tạo `ket.html`), CSS |
| `scripts/` | `tao_sfx.py`, `tao_giong_vbee.py` |
| `mau/` | Mã mẫu v08: `rec_lib.py` (con trỏ, quay CDP), `chrome.py` (khung Chrome mô phỏng), `rec_v08.py` (quay công cụ trong iframe + khung Excel mô phỏng nhiều sheet), `build_v08.py` (khớp tốc độ hình theo giọng, nhãn bước, Đốm góc, CTA), `mix_v08.py`, `template.html`, `thumb_mk.py`, `thumb_shot.py` |

## Sửa cho video mới (chỉ 3 chỗ trong build)
`BEATS` (đoạn giọng ↔ cửa sổ thời gian quay), `PL` (nhãn bước), `IMG` (tư thế Đốm từng cảnh), `DKW` (từ khóa tô vàng), `ZM` (phóng – mặc định 1,0; chỉ phóng khối sát mép trái `0% y`). CTA cuối dùng đoạn giọng cuối cùng (`D19` ở v08 – đổi theo kịch bản).

## Render
`cd dung && python3 build_<mã>.py && cd hf && HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell ../../../npm/node_modules/.bin/hyperframes render -q high -w 2 -o ../render.mp4` (chạy nền, ~11 khung/giây) → `python3 mix_<mã>.py` → ghép `-b:v 1500k` (≤140s) cho file ≤ 30 MB. Kiểm tra độ dài mix.wav = độ dài hình.
