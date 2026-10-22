# Quy trình video – Quản trị tử tế (bản gọn, cập nhật 20/10/2026 16:25 – sau v09)

> Bản gốc: `Dự án 5.0/quantritute/xuong-video/QUY-TRINH-VIDEO.md` (sửa ở đây, Project `claude/quy-trinh-video.md` chỉ là bản sao).
> Bài học chi tiết từng video v01–v09: `xuong-video/BAI-HOC-VIDEO-LUU-TRU.md` – **chỉ mở khi cần tra một chi tiết kỹ thuật cụ thể.**
> Hội thoại mới: đọc `Video xây kênh/00_BẮT ĐẦU VIDEO MỚI.md` trước tiên.

## 1. Quy tắc làm việc (anh chốt)
- **Mỗi hội thoại chỉ làm 1 video**, tên hội thoại = "vNN – Tên video". Anh yêu cầu > 1 video → nhắc anh mở hội thoại mới.
- **3 cổng duyệt:** (1) ý tưởng · (2) kịch bản – duyệt kỹ lời Đốm · (3) thành phẩm. Em không tạo giọng trước Cổng 2.
- Viết kịch bản **sau khi chạy thử công cụ thật với dữ liệu** (phát hiện nút cần thông tin bắt buộc, chữ chưa kiểm chứng, số liệu thật).
- Sau Cổng 3: lưu `Video xây kênh/Source hoàn thiện/N. Tên video.mp4` (liệt kê thư mục lấy số; không ghi đè; tên file không có "/") → nạp lịch + nội dung 3 kênh vào Xưởng video (migration `src/studio-schema.js` `_mig_studio_vN` – kế tiếp **v8**, anh chạy `npm run deploy:admin`) + thêm dòng vào `Video xây kênh/Lich-dang-4-video-dau.html` (`youtube.desc` = `youtube.caption`) → cập nhật tiến độ + file bàn giao + bài học.
- Lệnh Cloudflare/deploy do anh chạy. Không ghi mật khẩu/API key.

## 2. Định hướng kênh
- 3 kênh: TikTok @quantrithoidaiso, YouTube @Quantritute (Shorts), Fanpage (Reels) – cùng 1 file dọc 1080×1920, **cùng 19:00 mỗi ngày**. Làm trước 5–10 video vào kho rồi đăng đều.
- Phong cách: nhẹ nhàng, chân thật, **không hook giật gân**. Hook = câu tiêu đề ở mở đầu 5s + thumbnail cùng ý.
- Phân vai: **Anh = "Vì sao"** (nỗi đau, lý do làm – anh tự nói, phụ đề theo phiên âm) · **Đốm = "Làm thế nào"** (demo, hướng dẫn).
- Video **giới thiệu** (demo lướt, Đốm mở "Dạ vâng, Đốm rất vui được gặp lại anh chị…") ≠ video **hướng dẫn** (đánh số bước ①…, đi đúng thứ tự trên → dưới của trang, câu cuối dẫn sang video sau).
- **Mọi video có CTA + đoạn kết.**
- **Nội dung đăng (caption) viết theo LỢI ÍCH** (anh chốt 20/10 16:08): mỗi tính năng giúp người dùng đỡ việc gì, yên tâm điều gì (dòng ✔), không liệt kê các bước ①②③ khô khan; mẫu `BENEFIT` trong `xuong-video/_series/dong_bo_series_hoa_don.py`.
- Không nhắc tên website trong lời ("link ở bai ô của kênh"); TikTok không ghi web; YouTube/Facebook có link `…?nguon=youtube|facebook`.

## 3. Khung video chuẩn
1. **Mở đầu 5s:** phòng tối → kéo dây đèn → logo Đốm + TIÊU ĐỀ (≤ 2 dòng). Mẫu: `md-mau.html` trong bộ dựng (thanh laptop ghi "Bộ công cụ"); cỡ chữ 64–72px tùy độ dài.
2. **Thân:** Đốm dẫn (Vbee) + cảnh công cụ quay thật trong khung Chrome mô phỏng; nhãn vàng đầu khung (bước ①…); Đốm nhỏ góc dưới trái đổi tư thế theo cảnh; dòng "Thông tin doanh nghiệp đã được thay đổi" ở mọi cảnh có dữ liệu.
3. **CTA mẫu (đã duyệt, có sẵn giọng):** "Công cụ hoàn toàn miễn phí, xử lý ngay trên máy của anh chị, không gửi hóa đơn ra ngoài." (cảnh dòng cam kết) → cảnh Đốm cảm ơn + nút vàng "🔗 Link dùng thử ở bio của kênh" + "Dùng thử & góp ý cho Đốm nhé!" ("Link dùng thử, Đốm để ở bai ô của kênh. Anh chị dùng thử, và góp ý để Đốm hoàn thiện thêm nhé!", tốc độ 1,05). File giọng: `tap/v07-zip-ra-bang-ke/giong/kich-ban-v1-…/D13.wav`, `D14.wav` – **chép lại, không đọc lại**.
4. **Kết 7s chuẩn:** tường sáng, Follow "& Đồng hành cùng Đốm nhé!", đèn tắt.

## 4. Lời Đốm & giọng Vbee
- Giọng `n_laocai_male_phuocpro_children_vc`, tốc độ 1,2 (câu kết 1,05). Mỗi đoạn lời ngắn = 1 file giọng ↔ 1 nhóm thao tác; lời phủ kín hình; xưng "Đốm/em", gọi "anh chị".
- Kịch bản json: `loi` (phiên âm cho Vbee) + `phu_de` (chữ gốc). File chạy: `xuong-video/doc-giong-vNN.cmd` (anh nhấp đúp).
- **Phiên âm đã chốt:** XML = "ích em eo" · Excel = "ích xeo" · ZIP = "díp" · PDF = "pê đê ép" · QR = "kiu a" · MISA = "Mi sa" · GTGT = "giá trị gia tăng" · 01/GTGT = "mẫu số không một" · Chrome = "Crôm" · bio = "bai ô" · Ctrl+Shift+B = "Con trôn, Síp, Bê" · số, năm, chỉ tiêu [22], Thông tư 89, NQ 204 đọc bằng chữ · "+" = "và" · ✎/✓ = "biểu tượng cây bút"/"dấu tích".
- **Trước khi báo anh tạo giọng:** chạy regex dò chữ số, chữ viết tắt (≥ 2 chữ hoa), ký hiệu `[]/+%…✎→` trong `loi`; từ phiên âm mới → đọc thử 1 câu ngắn trước.

## 5. Dữ liệu trong video (chuỗi Hóa đơn thuế)
- Dữ liệu thật đã đổi tên ở lớp dữ liệu: `tap/_hoa-don-chung/du-lieu-gia/` (mua vào 61 HĐ, bán ra 80 HĐ T7–T8). MST giả **9876543210**, "CÔNG TY TNHH MINH HỌA ĐỐM SÁNG", khách cá nhân Nguyễn Văn A / Trần Thị B. Giữ nguyên số liệu, tên NCC.
- Bán ra chỉ hiện mức hóa đơn/số tổng; không mở chi tiết hàng hóa bán ra (phụ lục NQ 204 chỉ lướt nhanh).
- Ô người dùng tự điền → gõ **thông tin ví dụ** có nhãn "Thông tin ví dụ minh họa"/"Số ví dụ"; không bịa số liệu làm đổi kết quả trên hình.
- **Không nói:** nộp thẳng HTKK/eTax, nhập MISA không lỗi, 100% không sót, thời hạn kê khai cụ thể. Chữ trong công cụ trái với điều này → ẩn khi quay + báo anh sửa.

## 6. Thumbnail chuẩn
**Video thuộc series** (anh chốt 20/10): tiêu đề = "HƯỚNG DẪN TÍNH NĂNG / <BỘ CÔNG CỤ> / PHẦN N/x" (Phần N cỡ lớn màu `#EBB25B`), nút = tên tính năng; tên trong Xưởng video "<Series> – Phần N: <tính năng>"; caption mở đầu "📚 <Series> – Phần N/x: …", trước link có ◀ phần trước / ▶ phần sau; YouTube tiêu đề "<Series> – Phần N/x: …" + danh sách phát. Mẫu: `xuong-video/_series/` (mk.py, dong_bo_series_hoa_don.py).
Nền `#1b130b`, tiêu đề Lexend 700 IN HOA trắng ≤ 2 dòng (từ nhấn `#EBB25B`), Đốm bản `-toi`, nút vàng IN HOA không xuống dòng (44–50px). 3 file vào `xuat/`: `thumb-doc-luoi-1080x1920.png` (có ảnh chụp công cụ nghiêng), `thumb-doc-1080x1920.png`, `thumb-ngang-1280x720.png`. Mã: `mau/thumb_mk.py`, `thumb_shot.py` trong bộ dựng.

## 7. Kỹ thuật – bộ dựng dùng chung
`quantritute/xuong-video/_bo-dung/` (`bo-dung-chung.tgz` + `setup.sh` + README): 1 lần chuyển + `bash setup.sh vNN "DÒNG 1|DÒNG 2"` → môi trường đủ (npm, phông, sfx, Đốm, mở đầu + kết đã render, mã mẫu quay/dựng/trộn/thumb của v08). Chỉ cần chuyển thêm: công cụ mới nhất, dữ liệu giả, giọng + kịch bản json.

## 8. Lỗi đã gặp – kiểm tra trước khi gửi Cổng 3
1. Video > 2 phút: dùng nhạc `nhac-noi.flac`; **độ dài mix.wav phải bằng độ dài hình** (v08 từng cụt ở 120s).
2. Phóng khung web: bảng rộng giữ 1,0×; chỉ phóng khối sát mép trái (`0% y`) – gốc `100%`/giữa cắt chữ.
3. Tốc độ hình ≤ 1,6×; hình ngắn hơn lời thì chậm tới 0,8× rồi mới giữ khung; đoạn chờ máy chạy thì cắt.
4. Phụ đề không chồng nhau (`flush_subs`).
5. Dropdown/select gốc không hiện khi quay → dựng danh sách mô phỏng; giao diện Chrome → khung Chrome mô phỏng.
6. Khung Excel mô phỏng: dựng từ đúng file công cụ xuất; dòng tiêu đề gộp `colspan`; nhãn "KHUNG MÔ PHỎNG".
7. Số trên màn hình khớp lời (không dừng hình ở số đếm cả bản trùng).
8. Ảnh minh họa trong công cụ cũng có thể lộ MST/dữ liệu → ẩn khi quay.
9. Chờ lệnh nền theo **file đầu ra**, không dùng vòng `pgrep -f` (tự khớp chính nó, treo).
10. Render: `HYPERFRAMES_BROWSER_PATH=…headless_shell`, `-w 2`, chạy nền (~11 khung/giây). Xem bảng khung hình các mốc + tiêu đề mở đầu trước khi gửi.
11. File gửi ≤ 30 MB: ~1,5 Mbps cho 140s, ~2 Mbps cho 100s; âm thanh -14 LUFS.
12. **Bán ra:** không lộ tên hàng hóa/khách hàng bán ra – khi bấm sang Bán ra thì làm mờ (CSS `filter:blur`) bảng KH, hàng hóa, khung lỗi; chỉ để hiện số tổng/nút xuất (v09).
13. Bấm nút làm bảng vẽ lại (✓, áp dụng…) rồi gọi lại phần tử cũ → Playwright treo 30s → cắt khúc đó trong BEATS; hình thừa thì chia BEATS thành nhiều mảnh, không để khoảng lặng (v09).

## 9. Kho video (tóm tắt)
| Mã | Tên | Bản lưu | Đăng |
|---|---|---|---|
| v01 | Sự trở lại & Người bạn mới | 1. | 18/10 |
| v04 | Chọn đúng công cụ – Giải quyết đúng việc | 2. | 19/10 |
| v02 | Hết sửa tên & số từng văn bản (Tạo văn bản hàng loạt) | 3. | 20/10 |
| v03 | Cẩm nang Thuế – Kế toán – Lao động | 4. | 21/10 |
| v05 | Công cụ tải & xử lý hóa đơn thuế (giới thiệu) | 5. | T5 22/10 |
| v06 | Tải hàng loạt hóa đơn bằng 1 nút | 6. | T6 23/10 |
| v07 | Chuyển đổi hàng loạt XML sang file Excel | 7. | T7 24/10 |
| v08 | Tạo tờ khai 01/GTGT tự động (140s) | 8. | CN 25/10 |
| v09 | Tạo sẵn file nhập lên MISA (68s) | 9. | T2 26/10 |
v06–v09 = series "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn" Phần 1–4 (tên trong Xưởng video có "Phần N").
Chi tiết từng video (file, thumb, nút, migration): `BAI-HOC-VIDEO-LUU-TRU.md` mục Kho video.
