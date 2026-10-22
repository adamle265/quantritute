# Xưởng video Quản trị tử tế

Quy trình làm video kênh Quản trị tử tế (skill: lam-short-cong-cu). Cập nhật 14/10/2026 – chi tiết: Project doc `claude/quy-trinh-video.md`.

**Chiến lược:** làm trước 5–10 video vào kho rồi mới đăng đều.

## 3 cổng anh duyệt
1. Ý tưởng video cho công cụ → 2. Kịch bản → 3. Thành phẩm. Giai đoạn đầu anh tự đăng.

## Anh cần làm gì
| Khi nào | Việc |
|---|---|
| Lần đầu | Có sẵn `khoa-api.txt` (App ID + Token Vbee). Không gửi file này cho ai |
| Sau khi duyệt kịch bản | Nhấp đúp file `doc-giong-<mã tập>.cmd` em gửi → đợi chữ HOÀN TẤT → nhắn em |
| Nhận thành phẩm | Xem file trong `tap/<mã>/xuat/`, duyệt hoặc góp ý |

## Cấu trúc
- `tap/<mã>/` – kich-ban-*.json, `giong/` (file giọng), `xuat/` (video thành phẩm)
- `scripts/tao_giong_vbee.py` – đọc kịch bản bằng Vbee API (chạy trên máy anh)
- `scripts/quay_demo_cam_nang.py` – mẫu quay demo công cụ (Playwright, con trỏ, chạm, tô vàng)
- `scripts/tao_sfx.py` – tạo tiếng chạm, gõ phím, con dấu, nhạc nền
- `hyperframes/build_v3.py` + `template_v3.html` – mẫu dựng 9:16 (hook, demo, phụ đề nhấn từ khóa, Đốm)
- `remotion/`, `tao-giong-dom.cmd` (VieNeu) – phương án dự phòng

## Giọng Đốm
Vbee PhuocPro (`n_laocai_male_phuocpro_children_vc`), tốc độ 1,2, nghỉ câu 0,2 giây. Mỗi short khoảng 600–900 ký tự ≈ 600–900 điểm Vbee.

## Bổ sung 14/10/2026 (video v01)
- `mo-dau/` – mở đầu 5s (bật đèn + logo + tiêu đề) và kết 7s (Follow + Đốm kéo dây tắt đèn) dùng chung mọi video. Xem `mo-dau/README.md`.
- `scripts/phien_am.py` + file `.cmd` – phiên âm video anh quay (faster-whisper, chạy trên máy anh) để làm phụ đề, cắt khớp lời.
- Video anh quay để ở `Dự án 5.0/Video xây kênh/Source gốc/` (dọc 1080p).
- Mỗi tập: `tap/<mã>/kich-ban-vN.json`, `phien-am/`, `giong/`, `dung/` (mã dựng), `xuat/` (thành phẩm).
- Lời Đốm: mỗi đoạn liền mạch = 1 file giọng; hình chạy theo lời.
