# LƯU TRỮ – Bài học & chi tiết video v01–v08 (bản đầy đủ đến 20/10/2026)

> File lưu trữ, **không cần đọc đầu phiên**. Bản gọn đang dùng: `xuong-video/QUY-TRINH-VIDEO.md`. Chỉ mở file này khi cần tra một chi tiết kỹ thuật/bài học cụ thể (tìm theo tên video).


Skill đi kèm: **lam-short-cong-cu** (bản cập nhật 14/10 – gồm cả video có anh Minh Tuấn quay). Tài liệu này là bản tóm tắt; chi tiết vận hành nằm trong skill và `quantritute/xuong-video/README.md`. Bài học mới nhất: **v09 (20/10)** – xem mục riêng bên dưới.

## Quy tắc làm việc (anh chốt 15/10)
- **Mỗi hội thoại trong dự án chỉ làm 1 video**; đặt tên hội thoại theo tên video để anh dễ tìm lại và tối ưu token. Nếu anh yêu cầu làm nhiều hơn 1 video trong cùng hội thoại → **em nhắc anh** mở hội thoại mới.
- **Sau khi anh duyệt Cổng 3**, lưu video hoàn thiện vào `D:\0. Minh Tuấn 2026\Dự án 5.0\Video xây kênh\Source hoàn thiện\`, đặt tên có số thứ tự nối tiếp: `N. Tên video.mp4` (hiện có, anh đã đánh số lại: `1. Sự trở lại và bạn đồng hành mới 1410.mp4`, `2. Giới thiệu bộ công cụ trên website.mp4`, `3. Demo tạo văn bản hàng loạt 1410.mp4`, `4. Demo Cẩm nang tra cứu Thuế - Kế toán - Lao động.mp4`, `5. Giới thiệu công cụ tải & xử lý hóa đơn thuế.mp4`, `6. Tải hàng loạt hóa đơn bằng 1 nút.mp4`, `7. Chuyển đổi hàng loạt XML sang file Excel.mp4`, `8. Tạo tờ khai 01-GTGT tự động.mp4`; video tiếp theo bắt đầu từ số 9). Liệt kê thư mục để lấy số tiếp theo; không ghi đè file đã có (anh có thể đã tự chép bản duyệt – so kích thước/nội dung trước khi chép). Tên file không chứa "/" (Windows) – thay bằng "-".
- Sau khi duyệt: nạp nội dung đăng 3 kênh + lịch vào **Xưởng video** (migration `src/studio-schema.js`, anh chạy `npm run deploy:admin`) và bảng `Video xây kênh/Lich-dang-4-video-dau.html`.

## Chiến lược đăng (anh chốt 14/10)
- Sản xuất trước **5–10 video vào kho** rồi mới bắt đầu đăng, để giữ tần suất đều.
- Kế hoạch sản xuất các video tiếp theo + kịch bản từng video: làm ở hội thoại riêng.
- 3 kênh: TikTok @quantrithoidaiso, YouTube @Quantritute, Fanpage – cùng 1 file dọc 1080×1920. Giai đoạn đầu anh tự đăng. Lịch, quy tắc mô tả/hashtag: `00_TIẾN ĐỘ - Kênh video.md`.
- **Video demo công cụ (anh chốt 14/10):** đăng YouTube ở chế độ **Không công khai (Unlisted)** trước, dán link vào Quản trị → Công cụ → "Video demo" (admin chỉ nhận link YouTube, không up file); chuyển Công khai theo lịch tổng thể (đổi chế độ, không xóa–tải lại để giữ link).

## Tuyến "Giới thiệu công cụ" – cách làm (anh chốt 15/10)
- **Đây chính là tuyến (2) đã chốt 05/10, không thêm tuyến mới.**
- **Nội dung video gồm 2 loại** (không phải video nào cũng về công cụ anh tự làm):
  - Giới thiệu công cụ do anh tự làm (có trên quantritute.com).
  - Cách dùng **AI bên ngoài** để giải quyết một nỗi đau công việc cụ thể.
- **Phong cách kênh:** nhẹ nhàng, thong thả, chân thật. **Không làm hook giật gân.**
- **Hook = câu tiêu đề hiện ở đầu video**, nêu nỗi đau hoặc lợi ích của công cụ/cách làm (nằm trong phần mở đầu 5s chuẩn). Mỗi video có **ảnh thumbnail** thể hiện rõ cùng nỗi đau/lợi ích đó (làm bản dọc 1080×1920 cho Shorts và ngang 1280×720 cho YouTube/ảnh xem trước web).
- **Phân vai trong mỗi video:**
  - **Anh = "Vì sao":** giới thiệu lý do làm, nỗi đau cần giải quyết.
  - **Đốm = "Làm thế nào":** chia sẻ demo, giới thiệu tính năng, giải pháp, hướng dẫn chi tiết.
- **Kênh:** xây kênh chủ yếu bằng **video ngắn** (TikTok, YouTube Shorts, Fanpage). **Trên YouTube có thêm video dài** khi việc hướng dẫn cần chi tiết.
- **Mọi video phải có câu kêu gọi hành động + đoạn kết** (anh nhắc 20/10) – mẫu ở bài học v07.
- **Đề xuất, chờ anh duyệt khi làm video kế tiếp:**
  - Video ngắn: mở đầu chuẩn 5s (có câu tiêu đề) → anh nêu nỗi đau + lý do làm (ngắn, lời anh tự nói trước camera) → Đốm demo thật bằng ví dụ có sẵn + tính năng nổi trội → kết chuẩn 7s kèm lời mời dùng thử/góp ý.
  - Video dài YouTube: anh mở đầu nêu bối cảnh và nỗi đau → Đốm hướng dẫn từng bước, có chia chương → tổng kết.
  - Video về AI bên ngoài: giữ cùng phân vai anh – Đốm; cách quay (màn hình AI thật, ví dụ minh họa tự làm) sẽ chốt ở video đầu tiên thuộc loại này.
  - Đặt tên 2 dạng video (ngắn/dài) và cách dẫn từ video ngắn sang video dài: chưa chốt.
- **Lưu ý:** phần "lý do làm / nỗi đau" do anh nói bằng trải nghiệm thật của mình; em chỉ gợi khung câu hỏi hoặc đề xuất lời khi anh cho phép, anh sửa lại theo ý mình (anh thường nói khác kịch bản → phụ đề luôn theo phiên âm).

## Khung thumbnail chuẩn (anh chốt 15/10 – phương án D)
- **Nền nâu tối `#1b130b`**, tiêu đề **chữ trắng đậm Lexend 700, IN HOA, tối đa 2 dòng, căn giữa**; từ nhấn (tên Đốm / `&` / cụm chính) màu vàng `#EBB25B`. Cùng kiểu với thumb v02/v03/v04 để cả kênh đồng bộ.
- **Đốm bản `-toi`** (quầng sáng), biểu cảm khớp nỗi đau/lợi ích của video; ảnh gốc 512px nên đặt tối đa ~700px (bản dọc), ~380px (bản ngang) để không bị mờ. Không để Đốm che chữ trên ảnh chụp màn hình.
- **Nút/pill vàng** phía dưới (chữ tối, IN HOA, không xuống dòng – nút dài dùng cỡ 44px) nêu 1 ý ngắn bổ trợ tiêu đề (v01: "Người bạn mới của kênh"; v03: "Luật · Nghị định · Thông tư"; v04: "Giải quyết đúng việc"; v05: "Bảng kê · Tờ khai · MISA"; v06: "Không giới hạn · Free"; v07: "Tự báo hóa đơn cần xem lại"; v08: "Tự tính chỉ tiêu · Có phụ lục NQ 204").
- Chữ chính đặt ở **nửa trên** bản dọc để không bị nút/mô tả TikTok che; không hook giật gân. Tiêu đề dài (~20 ký tự/dòng như v07) dùng cỡ 72px bản dọc để không tràn; tiêu đề ngắn (v08) dùng 80–86px.
- **Bản dọc dạng lưới (từ 18/10):** `thumb-doc-luoi-1080x1920.png` – tiêu đề ~y 320–500, ảnh chụp màn hình nghiêng ở giữa (chụp bằng Playwright, không lấy khung video vì dính con trỏ), Đốm góc dưới trái, nút ~y 1440, tất cả nằm trong vùng TikTok cắt 3:4.
- Xuất vào `xuat/` của video: `thumb-doc-luoi-1080x1920.png`, `thumb-doc-1080x1920.png`, `thumb-ngang-1280x720.png`. Mã mẫu (HTML + Playwright): `xuong-video/scripts/tao_thumb_mau.py`; v05: `thumb/mk.py`, `mk2.py` trong `ma-dung-v05.tgz`; v07–v08: `thumb/mk.py`, `shot.py` trong `ma-dung-v07.tgz` / `ma-dung-v08.tgz`.
- Thumbnail v01 chưa có ảnh anh (khung hình quay bị nhắm mắt); nếu muốn thêm mặt anh, anh chọn khung hình ưng ý.

## Vai trò và 3 cổng duyệt
Anh duyệt: (1) ý tưởng, (2) kịch bản – **duyệt kỹ, đặc biệt lời Đốm**, (3) thành phẩm.

| Bước | Ai | Việc |
|---|---|---|
| 1 | Anh | Nêu chủ đề/công cụ |
| 2 | Em | Đọc tài liệu/công cụ, **chạy thử công cụ với dữ liệu thật**, đề xuất ý tưởng (mỗi ý = 1 tình huống/nỗi đau cụ thể) |
| 3 | **Anh – Cổng 1** | Chọn ý tưởng |
| 4 | Em | Kịch bản từng cảnh: hình + lời (anh/Đốm) + chữ trên hình + căn cứ; lời Đốm chia đoạn ngắn, mỗi đoạn ↔ 1 nhóm thao tác (bài học v05); có CTA + đoạn kết |
| 5 | **Anh – Cổng 2** | Duyệt kịch bản |
| 6 | Anh (nếu có phần tự quay) | Quay theo hướng dẫn, bỏ file vào `Dự án 5.0/Video xây kênh/Source gốc/` |
| 7 | Máy anh | Nhấp đúp file .cmd: phiên âm video anh quay + đọc giọng Đốm (Vbee) – em rà phiên âm trước khi báo anh bấm |
| 8 | Em | Quay web/công cụ thật, dựng HyperFrames, trộn âm -14 LUFS |
| 9 | **Anh – Cổng 3** | Duyệt thành phẩm + caption (+ tiêu đề, mô tả, hình thu nhỏ khi đăng YouTube) |
| 10 | Em | Lưu bản hoàn thiện vào `Video xây kênh/Source hoàn thiện/` (đánh số), nạp lịch + nội dung đăng vào Xưởng video, cập nhật Kho video + tiến độ |

## Khung video chuẩn của kênh
1. **Mở đầu 5s (dùng chung mọi video)**: phòng tối (ảnh bàn làm việc giống trang chủ web, laptop chiếu trang Bộ công cụ) → kéo dây, đèn chập chờn rồi sáng → logo Đốm chào + **TIÊU ĐỀ VIDEO** (chữ đậm tối trên tường sáng, `&` màu nhấn). 3–5 giây đầu nhạc thương hiệu (0,6), tiếng tách dây đèn.
2. **Thân video**: anh nói trước camera (phụ đề theo phiên âm, tô vàng từ khóa) và/hoặc Đốm dẫn (giọng Vbee) + cảnh web/công cụ quay thật trong khung trình duyệt.
3. **Kết 7s (dùng chung)**: tường sáng (không laptop) + logo + Đốm bản `-sang` (rõ nét) + nút **Follow** đỏ "& Đồng hành cùng Đốm nhé!" + "Cảm ơn anh chị! ♥" → Đốm bay lên kéo dây → đèn tắt → Đốm ngủ phát sáng → tối hẳn, nhạc tắt theo.
- Mã: `quantritute/xuong-video/mo-dau/` (`dung_mo_dau.py "DÒNG 1|DÒNG 2" <thư mục dự án>` → index.html mở đầu + ket.html kết; README). Tiêu đề dài: bản script hiện tại chưa có `TTL_FS` → sửa trực tiếp `style="font-size:64px"` cho `#ttl` (v05: 2 dòng dài cỡ 64; v06–v07: 66; v08 tiêu đề ngắn: 72). Phần kết phải render riêng (không cắt từ video cũ vì phụ đề lời kết bị dính).
- Thanh địa chỉ laptop trong mở đầu có chữ quantritute.com rất nhỏ – nếu anh muốn bỏ hẳn tên web khỏi video thì sửa ở mẫu chung (bản v06–v08 đã đổi thành "Bộ công cụ" – dùng `md/index.html` của video trước rồi thay tiêu đề, không dùng bản `dung_mo_dau.py` sinh ra vì còn chữ quantritute.com).

## Bộ công cụ đã chốt
| Khâu | Công cụ | Ghi chú |
|---|---|---|
| Giọng Đốm | Vbee PhuocPro (`n_laocai_male_phuocpro_children_vc`), tốc độ 1,2 (câu kết 1,05) | ~1 điểm/ký tự. ⚠ giọng cộng đồng – hỏi Vbee quyền thương mại trước khi kênh kiếm tiền. Từ nước ngoài viết phiên âm (bài học v05, v07, v08); từ phiên âm mới → đọc thử 1 câu ngắn trước |
| Phiên âm lời anh | faster-whisper `large-v3-turbo` chạy trên máy anh (`scripts/phien_am.py`) | Âm thanh tách sẵn WAV 16 kHz vào `phien-am/am-thanh/` (tránh lỗi thư viện av). Sửa tay lỗi nghe nhầm ("Đố mơ ơi" → "Đốm ơi", "lay hoay" → "loay hoay", "tuần" → "Tuấn", "khoa học công cụ" → "kho công cụ", "Đúng" → "Đốm"); bỏ câu ảo giác cuối file (vd "Hãy subscribe cho kênh…"). Máy chủ đám mây không tải được mô hình (huggingface bị chặn) → không tự nghe kiểm giọng được, cần anh nghe |
| Quay web/công cụ | Playwright + CDP screencast, chạy site local (`python3 -m http.server`/wrangler), viewport 800×1000 @2 (v06–v08) / 1000×1250 @1,5 (v05) / 1160×1315 (v03, v04) | Con trỏ giả, vòng chạm, tô vàng chữ, phông fontsource qua route. Từ 19/10 quay + dựng trong máy chủ đám mây |
| Dựng | HyperFrames 0.8.147 | Video lồng trong khối có data-start → lint báo lỗi; khối bọc video không đặt data-start, điều khiển hiện/ẩn bằng GSAP. Clip web cần mã hóa lại `-g 30 -keyint_min 30` để tránh giật khi seek |
| Âm thanh | Nhạc thương hiệu (brand/nhac), SFX tự tổng hợp (`scripts/tao_sfx.py`, cần `soundfile`) | Lời anh: highpass + afftdn + nén + loudnorm -16; giọng Đốm ×1,15; nhạc 0,12 dưới lời anh, 0,2 phần Đốm; video > 2 phút nối nhạc gốc bằng `acrossfade=d=4` (bắt buộc – thiếu là âm thanh cụt ở 120s, xem v08); xuất chung -14 LUFS |

## Bài học (v01 "Sự trở lại & Người bạn mới", 13–14/10)
- **Lời Đốm phải liền mạch**: viết thành đoạn có chủ ngữ, nối bằng "để…, và…"; mỗi đoạn đọc **1 file Vbee**; khoảng nghỉ giữa các đoạn ≤ 0,4s; **hình chạy theo lời** (chỉnh tốc độ clip web cho khớp), không bắt lời chờ hình.
- Xưng hô Đốm: xen "em" và "Đốm" cho đỡ lặp; gọi "anh chị".
- Cảnh web: hiển thị **đủ trang** (thu nhỏ khung, bỏ logo/tiêu đề phía trên); mỗi ý của lời nói ↔ 1 thao tác thật (lật bìa, xem chi tiết, dùng thử công cụ, đề xuất tính năng). Tốc độ tua tối đa ~1,6×.
- Chuyển cảnh anh → Đốm: đốm sáng hiện góc trên, đẩy khung, lóe sáng ấm rồi mở cảnh mới; Đốm xoay vào. Cảnh "anh làm việc" chọn đoạn **đang tập trung gõ phím** (dò bằng mật độ tiếng gõ), giữ tiếng gõ nhỏ.
- Đốm trên nền sáng dùng ảnh `-sang`; ảnh `-toi` (có quầng sáng) đặt trên nền sáng sẽ bị nhòe.
- Anh quay: dọc **1080p**, nhìn thẳng ống kính, quay liền 1 đoạn là ổn; video "đang làm việc" quay riêng.
- Giới hạn chuyển file: file gửi qua chat ≤ 30 MB → xuất bản ~2,4 Mbps (~27 MB cho 90s; video 100s dùng ~2,05 Mbps; 109–129s dùng ~1,65–1,9 Mbps; 140–143s dùng ~1,45–1,5 Mbps) để gửi + lưu về máy.
- Trước đó (cn01, 11–12/10): giọng VieNeu "vẫn khá AI" → Vbee; điểm quyết định là kịch bản (tình huống cụ thể, không liệt kê tính năng).

## Bài học (v02 "Hết sửa tên & số từng văn bản", 14/10 – video demo công cụ)
- **Video demo công cụ:** chạy **thật** bộ ví dụ có sẵn của công cụ từng bước đến khi tải về và thấy thành phẩm (quay Playwright, bắt file xuất thật), rồi mới nói tính năng nổi trội; kết bằng CTA mời dùng thử + góp ý + cảm ơn.
- **Mẫu minh họa tự làm** (công ty hư cấu, nhãn "Số liệu minh họa"); không dùng mẫu có tên tổ chức cũ (HaDu/MiTu/VCCI) trong video công khai.
- Quay nhiều clip dài rồi **chọn cửa sổ thời gian** cho từng câu lời (tua ≤ ~1,6×); chữ nhấn (con dấu "SAI TÊN!") đặt đúng nhịp câu.
- Hình thu nhỏ: làm cả bản dọc 1080×1920 (Shorts) và ngang 1280×720 (video thường/ảnh xem trước web).
- Việc còn lại sau khi duyệt: đăng YouTube Unlisted → gửi link → thay `DEMO_VIDEO_ID` trong công cụ + dán link ở admin "Video demo"; triển khai bản công cụ 1.7.2 và web 1.14–1.15.
- Cẩm nang thuế (v03): không dùng cụm "cập nhật mỗi ngày" (thực tế ~3 ngày/lần và có duyệt tay).

## Bài học (v03 "Cẩm nang Thuế", 14–15/10 – demo công cụ tra cứu pháp lý)
- **Chọn 1 ví dụ xuyên suốt** (Điều 5 Luật Thuế GTGT 48/2024) và đi qua từng tính năng bằng chính ví dụ đó; kiểm chứng số liệu/điều khoản trên công cụ thật trước khi viết lời (Điều dẫn chiếu, 28 nhóm, dòng thời gian).
- **Phụ đề ≠ lời đọc**: lời Vbee đọc bằng chữ ("Điều năm"), phụ đề hiển thị ký hiệu như trong công cụ (Điều 5, Luật Thuế GTGT 48, NĐ 181, TT 69). Thay thế chuỗi dài trước, rồi mới tách phụ đề thành các dòng.
- **Cần quãng nghỉ rõ giữa hai ý** thì tách thành **đoạn giọng riêng** (+ khoảng cách 0,9s), đừng dựa vào dấu phẩy/chấm trong một file.
- Tiêu đề mở đầu: giữ ≤ 2 dòng; tiêu đề 3 dòng làm nét gạch dưới đè lên chữ.
- Tính năng chỉ chạy khi online (cập nhật pháp lý, gửi email): quay trên bản local có **giả lập API** (route Playwright), lời thông báo lấy đúng chữ trong mã; ghi rõ cho anh biết đây là giả lập, không tạo đăng ký thật. Ẩn các dòng chữ trong công cụ lệch với lời đã duyệt khi quay, đồng thời báo anh để sửa chữ trong công cụ.
- Video nhiều tính năng (6) dài ~109s: vẫn ổn khi mỗi tính năng có nhãn đánh số ①–⑥ và tua ≤ 1,5×.
- Sau khi anh góp ý lần 2, đổi/thêm lời chỉ cần đọc lại các đoạn mới (file `kich-ban-v5-moi.json` + `doc-giong-v03b.cmd`), các đoạn cũ dùng lại để tiết kiệm điểm Vbee.
- **Gắn video vào công cụ:** công cụ *Tạo văn bản hàng loạt* nhúng video qua hằng `DEMO_VIDEO_ID` trong mã; *Cẩm nang thuế* thì **không có** ô này – chỉ cần dán link vào Quản trị → Công cụ → Cẩm nang thuế → "Video demo" (không sửa mã, không cần cap-nhat.cmd). Kiểm tra mã trước khi hứa bước "thay ID".

## Bài học (v04 "Chọn đúng công cụ – Giải quyết đúng việc", 16/10 – anh tự quay 1 đoạn liền + Đốm)
**Góp ý của anh sau bản 1 (áp dụng cho các video sau):**
- **Chữ trên hình** đặt ở **phần trên khung** (trên đầu anh), **chỉ ý thật sự quan trọng** (~5 ý cho 2 phút), không rải mỗi câu một hộp. Cụm từ khóa liên tiếp làm dạng **thẻ hiện lần lượt** theo lời (Vibe code · AI agent · …).
- **Phụ đề thấp hơn** (top ~1470/1920, vẫn trong vùng an toàn TikTok); phụ đề **đúng lời anh nói**, chỉ sửa lỗi nghe nhầm.
- **Chuyển cảnh không đơn điệu, vẫn chân thành:** luân phiên dải ánh sáng ấm lướt qua, lia nhanh có nhòe, đốm sáng bay vào rồi **mở cảnh web bằng vòng tròn**, khung web thu nhỏ bay lên góc, khung trượt lên, vòng tròn đóng lại; đoạn tự hỏi dùng nhòe nhẹ + viền tối ấm.
- **Cảnh web phải đúng ý lời nói:** nói về "kho công cụ" → trang **Bộ công cụ**, chuyển qua từng tab (thấy công cụ đã có và Coming soon); nói về 2 công cụ đã làm → bắt đầu từ tab **Tiện ích nổi bật** (không chuyển sang Tất cả), mở đúng công cụ đúng lúc nhắc tên.
- **Lời kêu gọi dùng thử/góp ý → quay thao tác thật:** Bảng ghim bấm "Tôi cũng cần"; "Ghim một đề xuất" gõ ví dụ và bấm gửi; mở 1 công cụ → "Đề xuất thêm tính năng" gõ góp ý và gửi; **phóng to vào form** khi gõ cho dễ đọc. Quay trên bản sao web local (không ghi vào web thật), báo anh.
- **Đốm xuất hiện:** cắt trước lúc anh giơ tay dừng máy; Đốm vào bằng cảnh riêng (đốm sáng bay vào, lóe sáng → tia sáng xoay, vòng sáng, hạt sáng, Đốm chào + đổi tư thế) rồi bay lên nối vào kết chuẩn.
- **Màu video anh v04** (phòng ánh sáng vàng): `colortemperature=temperature=3900:mix=0.75, eq=contrast=1.08:saturation=1.15:gamma=1.08, curves (đỏ +, xanh dương −), vignette=PI/4.5`. ⚠ Không áp lại cho buổi quay ánh sáng trắng – xem bài học v05.

**Kỹ thuật (v04, máy ảo trên máy anh):**
- Mỗi lệnh chạy tối đa ~3 phút và **tiến trình nền bị tắt khi lệnh kết thúc** → render HyperFrames **theo đoạn ≤ 10s** (~2 phút/đoạn, 2,5 khung/giây), mỗi đoạn là 1 trang dùng `tl.tweenFromTo(w0, w1)` trên timeline gốc (không dời/cắt tween – làm sai trạng thái đầu đoạn), rồi ghép `concat -c copy`. Mã: `tap/v04-chon-dung-cong-cu/dung/ban-2/` (`build_v05.py`, `window.py`, `part2.sh`, `prep_web.py`, `mix4.py`).
- **Web local chạy được trong máy ảo**: bật wrangler + bản sao D1 và quay trong **cùng 1 lệnh** (`rec.sh`, `rec_v04b.py`); phông Google bị chặn → nạp phông fontsource (Lexend, Be Vietnam Pro, Patrick Hand, IBM Plex Mono) qua route Playwright. Ưu điểm: em tự quay lại nhiều lần, không cần anh chạy .cmd.
- GSAP: `fromTo` đặt `immediateRender:false` + `gsap.set` trạng thái đầu cho mọi phần tử; **thuộc tính ở trạng thái đầu phải có trong trạng thái đích** (thiếu `opacity` → khung web không hiện khi render tuần tự, dù chụp thử vẫn đúng).
- Clip web đệm **0,6s đầu / 1,5s cuối** (khung giữ ảnh) để khung không trắng khi vào/ra cảnh.
- **Render lại mở đầu xong phải chép sang thư mục dựng** và xem khung giây 2–3 (lỗi tiêu đề vỡ dòng ở bản 2 do quên chép).
- Kiểm tra trước khi gửi: bảng khung hình các mốc chính + so độ sáng ở ranh giới các đoạn render.

## Bài học (v05 "Công cụ tải & xử lý hàng loạt hóa đơn thuế", 19/10 – anh tự quay + Đốm giới thiệu 5 tính năng, 143,5s)
**Góp ý của anh sau bản 1 (áp dụng cho các video sau):**
- **Video giới thiệu ≠ video hướng dẫn:** Đốm mở bằng "Dạ vâng, Đốm rất vui được gặp lại anh chị. Đốm xin giới thiệu các tính năng…" rồi đi lần lượt từng tính năng; demo chỉ lướt. Cảnh Đốm chào: **mở trang Bộ công cụ → bấm cuốn sách → Dùng online** rồi mới vào công cụ.
- **Lời phải phủ kín hình:** rất hạn chế cảnh thao tác không có lời. Viết lời Đốm thành **nhiều đoạn ngắn (mỗi đoạn 1 file Vbee) ↔ 1 nhóm thao tác** (bấm nút, chọn ngày, chọn loại, Tìm, Tải…); tốc độ hình tự tính = độ dài hình / (độ dài lời + 0,45s), tối đa 1,6×; đoạn chờ máy chạy thì cắt bỏ, không tua nhanh. Lời mô tả thao tác nào thì hình đang làm đúng thao tác đó (đọc tên 6 bảng đúng lúc bấm từng bảng).
- **Không show nội dung hóa đơn cụ thể** khi in (dừng ở bấm "In / Lưu PDF"); tờ khai **không phóng to dòng**, chỉ cuộn tổng quát từ trên xuống.
- **Phiên âm từ nước ngoài cho Vbee** (phụ đề vẫn hiện chữ gốc): Excel = "ích xeo", XML = **"ích em eo"** (từ 20/10 – giọng PhuocPro bỏ mất "mờ lờ", xem bài học v07), ZIP = "díp", PDF = "pê đê ép", QR = "kiu a" (đọc "QR" thành "QD"), MISA = "Mi sa"; số/mẫu viết bằng chữ ("mẫu số không một", "Thông tư tám mươi chín"); GTGT = "giá trị gia tăng" (v08).
- **Không nhắc tên website trong lời** (tránh vi phạm nền tảng); cần thì nói "link ở bai ô của kênh" (phụ đề: "bio"). Trên hình cũng bỏ tên web ở nhãn cảnh và thanh địa chỉ.
- **Màu đoạn anh quay:** anh chê bản vàng/tối/không nét (công thức v04 quá ấm với phòng ánh sáng trắng). Công thức chốt v05: `colortemperature=temperature=5600:mix=0.4, eq=brightness=0.08:contrast=1.08:saturation=1.08:gamma=1.15, curves=r='0/0 0.5/0.52 1/1', unsharp=5:5:1.0` – sáng, trung tính, nét. **Chỉnh màu theo ánh sáng từng buổi quay, so khung hình trước/sau**, không áp cứng 1 công thức.
- Phụ đề lời anh lấy **đúng phiên âm** (anh thường nói khác kịch bản), bỏ câu ảo giác cuối của Whisper; cắt trước lúc anh giơ tay tắt máy.

**Dữ liệu thật trong video (chuỗi Hóa đơn thuế):**
- Đổi thông tin DN ở **lớp dữ liệu** (bản sao ZIP: XML, gói gốc `invoice.html` – giải mã thực thể HTML trước khi thay, `danh-sach.json`, bảng kê), kể cả QR (chuỗi `qrcodeContent` chứa MST), chữ ký số (CN=…), email/SĐT/CCCD người mua cá nhân → mã `tap/_hoa-don-chung/an_danh.py`; dữ liệu giả ở `tap/_hoa-don-chung/du-lieu-gia/`. Dò lại toàn bộ chuỗi nhạy cảm sau khi thay (kể cả tên file trong ZIP).
- **MST ví dụ 9876543210** (9 số đầu cho số kiểm tra = 10 → không MST thật nào trùng). MST giả cũ 0700922112 hợp lệ về số kiểm tra → không dùng.
- Cảnh tải trên cổng thuế: **trang mô phỏng** (route Playwright trả danh sách + gói gốc từ dữ liệu giả, chạy nút bookmark thật của công cụ), nhãn "TRANG MÔ PHỎNG" + dòng "Thông tin doanh nghiệp đã được thay đổi" ở mọi cảnh có dữ liệu.

**Kỹ thuật (từ 19/10 dựng trong máy chủ đám mây, không còn giới hạn 3 phút/lệnh):** render HyperFrames cả video 1 lần (~9 khung/giây, ~10 phút cho 2,5 phút video); web local wrangler + D1 bản sao (thêm bản ghi công cụ bằng SQL nếu web thật đã đổi slug); mã dựng: `tap/v05-gioi-thieu-hoa-don-thue/dung/ma-dung-v05.tgz` (`build2.py` tự khớp tốc độ hình theo từng đoạn giọng, `rec_v05.py` quay, `mock.py` trang thuế mô phỏng).

**Xưởng video (admin):** nội dung đăng 3 kênh nạp qua migration trong `src/studio-schema.js` (`_mig_studio_v3`: đổi mã ý tưởng "tên tạm" v05–v07 thành `…-tam` để nhường mã); TikTok không ghi web ("Link chi tiết … ở phần Bio"), YouTube/Facebook có link `?nguon=`. Anh chạy `npm run deploy:admin`.

## Bài học (v06 "Tải hàng loạt hóa đơn bằng 1 nút", 19/10 – Đốm dẫn 100%, video hướng dẫn từng bước, 99,7s, anh duyệt ngay bản 1)
- **Video hướng dẫn chi tiết 1 tính năng:** đánh số bước ①–⑤ trên nhãn vàng đầu khung, mở bằng cảnh "cách cũ" (tải tay từng hóa đơn trên trang mô phỏng) rồi đi từng bước; kết bằng câu dẫn sang video sau ("Video sau, Đốm sẽ chỉ anh chị…").
- **Góp ý kịch bản của anh:** ví dụ (cả quý) chỉ là minh họa – lời nói về **chọn linh động theo khoảng ngày cần**; không nói chi tiết kỹ thuật nội bộ (số lượt quét/quý), chỉ nói điều người dùng thấy và bấm (nút "Quét lại 1 lượt").
- **Thao tác ngoài trang web (kéo nút lên thanh dấu trang):** Playwright không chụp được giao diện Chrome → dựng **khung Chrome mô phỏng** (thanh địa chỉ + thanh dấu trang) bằng HTML, công cụ chạy trong iframe; nút "ma" bay theo con trỏ, thả vào ô gạch nét "Thả vào đây". Trang thuế mô phỏng dùng cùng khung (`rec/chrome.py`).
- **Phím tắt cho Vbee:** Ctrl + Shift + B → "Con trôn, Síp, Bê"; Chrome → "Crôm" (anh duyệt nghe ổn).
- **Cảnh gõ ngày cần đủ dài để khớp lời:** trước khi gõ, rê con trỏ + viền sáng lần lượt 2 ô ngày (~2s), gõ 330ms/ký tự; nếu hình ngắn hơn lời thì cho chạy chậm tới 0,8× trước khi phải giữ khung.
- **Phụ đề không được chồng nhau:** gom tất cả câu phụ đề, cắt điểm kết của câu trước ≤ điểm bắt đầu câu sau (`flush_subs` trong `build_v06.py`).
- **Phóng to khung web:** chỉ phóng khi vùng cần đọc hẹp (nút cài, dòng phím tắt, ô MST phiên đăng nhập, cảnh báo đỏ khi tải); bảng điều khiển trải hết bề ngang thì giữ 1,0× (phóng sẽ cắt mất ô "Đến ngày").
- **Kiểm tra dữ liệu nhạy cảm cả trong ảnh minh họa của công cụ:** thẻ 1 (bản 1.5.4) có ảnh bảng điều khiển hiện MST 0700922112 → ẩn khối đó khi quay; đã báo anh để thay ảnh trong công cụ.
- **Kỹ thuật máy chủ đám mây (2 nhân):** CDP screencast trả khung bằng kích thước CSS (800×1000, không nhân DPR) → phóng lên 1000×1250 bằng `lanczos + unsharp=5:5:0.6`; HyperFrames phải trỏ `HYPERFRAMES_BROWSER_PATH` tới `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`, `-w 2` (~3000 khung ≈ 11 phút); dùng Chrome thường thì rất chậm (~0,6 khung/giây). Lệnh quay dài (>2 phút) chạy nền, không dùng `timeout` (bị cắt giữa lúc ffmpeg ghép khung → mất mốc thời gian).
- Mã dựng: `tap/v06-tai-ca-quy-hoa-don/dung/ma-dung-v06.tgz` (`rec_v06.py` 5 cảnh s1–s5, `chrome.py`, `mock.py`; `build_v06.py`, `mix_v06.py`; `thumb/mk.py`). File ZIP tải từ trang mô phỏng (dùng lại cho v07) do `rec_v06.py s3` tạo ra.

## Bài học (v07 "Chuyển đổi hàng loạt XML sang file Excel", 20/10 – Đốm dẫn 100%, 100,7s, anh duyệt bản 2, chỉ sửa giọng)
- **Chạy thử công cụ với dữ liệu thật trước khi viết kịch bản** để thấy chỗ trùng lặp: file ZIP của thẻ 1 đã có sẵn bảng kê 5 sheet → nếu video chỉ "kéo ZIP → xuất Excel", người xem sẽ hỏi "để làm gì". Kịch bản nói thẳng điều này (D02) rồi nhấn vào giá trị riêng của thẻ 2: gộp mua vào + bán ra, XML lẻ, tự bỏ trùng, mục "Cần xem lại", tải XML bổ sung. Anh đồng ý hướng này.
- **Không dựng giả tình huống không có trong dữ liệu:** dữ liệu không có HĐ hủy/thay thế → chỉ nói bằng lời; tính năng bỏ trùng thì demo thật (thêm lại 1 XML đã có).
- **Anh nhắc: video phải có câu kêu gọi hành động + đoạn kết.** Mẫu đã duyệt: câu dẫn sang video sau → "Công cụ hoàn toàn miễn phí, xử lý ngay trên máy của anh chị, không gửi hóa đơn ra ngoài." (cảnh dòng cam kết trong công cụ) → cảnh riêng Đốm cảm ơn + nút vàng "🔗 Link dùng thử ở bio của kênh" + "Dùng thử & góp ý cho Đốm nhé!" (đọc tốc độ 1,05) → kết chuẩn 7s.
- **Phiên âm XML:** Vbee PhuocPro **bỏ mất "mờ lờ"** với mọi cách viết đã thử (ích mờ lờ / ích-mờ-lờ / Ích Mờ Lờ / ích mơ lơ / "ích, mờ lờ" / tốc độ 1,0). **Anh chốt "ích em eo".** Từ phiên âm mới → đọc thử 1 câu ngắn trước khi đọc cả kịch bản.
- **Không mở chi tiết hàng hóa bán ra:** bảng xem trước "Chi tiết hàng hóa" và "Gộp một bảng" xếp dòng Bán ra lên đầu → khi quay ẩn các dòng có Loại = "Bán ra" (`HIDE_BR` trong `rec_v07.py`); bảng kê bán ra (mức hóa đơn, người mua đã đổi tên) được hiện.
- **Cảnh mở Excel:** khung Excel mô phỏng (HTML) dựng từ đúng file .xlsx công cụ xuất ra (openpyxl): tab sheet, mũi tên lọc, demo lọc theo người bán; nhãn "KHUNG MÔ PHỎNG · file Excel xuất từ công cụ" trên thanh tiêu đề. Bảng đặt bề rộng cố định (`table-layout:fixed` + width) để không tràn cột.
- **Phóng khung web:** đặt điểm gốc phóng sát mép có nội dung (`0% y` hoặc `100% y`). Gốc ở giữa với mức phóng 1,15–1,3× làm cắt chữ hai mép (lỗi ở bản dựng đầu).
- **Con số trên màn hình phải khớp lời:** danh sách file hiện "142 hóa đơn" (đếm cả bản trùng), trong khi thẻ số liệu là 141 → không dừng hình hay viền sáng ở số 142.
- **Dựng lại trên máy chủ mới:** tài nguyên lấy từ `tap/v05-…/dung/_assets.tar` (Đốm, logo, ảnh bàn, nhạc) + `tap/v06-…/dung/_bo-sung.tgz` (mo-dau, scripts); phông, gsap, hyperframes cài bằng npm. Mở đầu: chép `md/index.html` của v06 rồi thay tiêu đề. Mã dựng: `tap/v07-zip-ra-bang-ke/dung/ma-dung-v07.tgz` (`rec_v07.py`: s1 thư mục ZIP, s2 thẻ 2, s3 khung Excel; `build_v07.py`, `mix_v07.py`; `thumb/mk.py`, `shot.py`).
- **Chờ lệnh nền:** vòng chờ dùng `pgrep -f "<lệnh>"` tự khớp với chính nó nên bị treo → chờ theo điều kiện file đầu ra.

## Bài học (v08 "Tạo tờ khai 01/GTGT tự động", 20/10 – Đốm dẫn 100%, 140,3s, anh duyệt ngay bản 1)
- **Góp ý kịch bản của anh (áp dụng cho video hướng dẫn sau):**
  - Demo **đúng thứ tự từ trên xuống** của trang công cụ. Không nhảy khối.
  - **Không đọc chi tiết từng chỉ tiêu** tờ khai ([23], [24], [32]…). Chỉ nói "tính sẵn từ hóa đơn" và cuộn nhanh bảng.
  - Tính năng có **2 cách làm** thì nói đủ cả 2. Ví dụ hóa đơn không có XML gốc: (1) tải XML bổ sung; (2) bấm ✎ ở ô thuế suất gợi ý, chọn thuế suất rồi bấm ✓.
  - Ô thông tin cần người dùng tự điền thì **gõ thông tin ví dụ minh họa** (có nhãn "Thông tin ví dụ minh họa"), không dùng dữ liệu thật. Nói rõ công cụ tự nhớ cho lần sau, hoặc lấy từ file kỳ trước (chỉ đúng nút).
  - Câu chọn mẫu tờ khai dùng lời anh: "có thể chọn mẫu theo TT 80 nếu mẫu mới theo TT 89 chưa được hệ thống kế toán cập nhật". **Không nói thời hạn kê khai.**
  - Phụ lục NQ 204 được cho xem, nhưng chỉ **lướt nhanh**.
  - Tiêu đề và nút thumb do anh đặt: "TẠO TỜ KHAI 01/GTGT TỰ ĐỘNG" · "Tự tính chỉ tiêu · Có phụ lục NQ 204".
- **Phiên âm (anh nhắc kỹ trước khi tạo giọng):**
  - GTGT = "giá trị gia tăng"; 01/GTGT = "mẫu số không một".
  - [22]/[43] = "chỉ tiêu hai mươi hai/bốn mươi ba"; NQ 204 = "Nghị quyết hai trăm linh bốn"; năm 2026 đọc đầy đủ bằng chữ.
  - "+" = "và"; ✎/✓ = "biểu tượng cây bút"/"dấu tích".
  - Sau khi viết lời, chạy **regex dò chữ số, chữ viết tắt, ký hiệu** còn sót trong lời Vbee rồi mới báo anh tạo giọng.
  - Câu CTA giống video trước thì **chép lại file giọng cũ** (D13–D14 của v07 → D18–D19), không tốn điểm.
- **Số ví dụ để minh họa thao tác nhập:** gõ số ví dụ vào ô [22] có nhãn "Số ví dụ" để người xem thấy ô tự thêm dấu chấm, rồi xóa ngay để tờ khai trên hình vẫn là số thật.
- **Nút cần thông tin bắt buộc:** nút "Tải file XML tờ khai" chỉ xuất được khi đã có mã/tên cơ quan thuế và mã tỉnh. Chạy thử trước khi viết kịch bản để biết thứ tự cảnh: điền thông tin trước, bấm tải sau.
- **Chữ trong công cụ chưa kiểm chứng:** câu "Mở bằng HTKK hoặc nộp qua eTax" dưới khối thông tin XML đã được ẩn khi quay, và đã báo anh sửa trong công cụ.
- **Dropdown gốc của trình duyệt** (thẻ select) không hiện trong CDP screencast, nên dựng một danh sách mô phỏng ngay dưới ô chọn (`__dd` trong `rec_v08.py`).
- **Khung Excel mô phỏng nhiều sheet:**
  - Dựng tất cả sheet và chuyển tab bằng JS.
  - Dòng tiêu đề chỉ có ô đầu thì gộp `colspan`, nếu không sẽ bị cắt chữ "TỜ…".
  - Cuộn sheet bằng dời bảng (`sy()`).
  - Mỗi sheet giữ khoảng 2–3s để tua ≤ 1,6×.
- **Phóng khung web:** điểm gốc `100% y` với mức phóng 1,2× vẫn cắt mất cột trái của bảng (mã hóa đơn, nhãn ô). Bảng rộng trải hết khung thì giữ 1,0×. Chỉ phóng khối nằm sát mép trái (`0% y`).
- **Video > 2 phút:** nhạc gốc chỉ dài 120s và mix lấy nhạc làm chuẩn độ dài (`duration=first`), nên âm thanh bị cụt ở 119,6s. Phải nối nhạc `acrossfade=d=4` (`brand/nhac/nhac-noi.wav`) trước khi trộn, và kiểm tra độ dài mix.wav bằng độ dài hình.
- **Lịch:**
  - Lưu bản hoàn thiện `8. Tạo tờ khai 01-GTGT tự động.mp4`; tên file Windows không chứa "/", nên dùng "-".
  - Xưởng video nạp qua `_mig_studio_v6`.
  - Bảng `Lich-dang-4-video-dau.html` thêm dòng v08. Trường `youtube.desc` = `youtube.caption`.
- Mã dựng: `tap/v08-to-khai-01gtgt/dung/ma-dung-v08.tgz`:
  - `rec_v08.py`: s1 thẻ 4 từ trên xuống, s2 khung Excel 4 sheet;
  - `build_v08.py`, `mix_v08.py`;
  - `thumb/mk.py`, `shot.py`;
  - `md/index.html`.

## Thư mục
`quantritute/xuong-video/`: `mo-dau/` (mở đầu/kết chuẩn), `tap/<mã>/` (kịch bản, `phien-am/`, `giong/`, `dung/` mã dựng, `xuat/` thành phẩm), `tap/_hoa-don-chung/` (dữ liệu giả + mã đổi tên dùng chung chuỗi Hóa đơn thuế), `scripts/` (tao_giong_vbee.py, phien_am.py, tao_thumb_mau.py, …), các file .cmd. Source anh quay: `Dự án 5.0/Video xây kênh/Source gốc/`. **Bản hoàn thiện đã duyệt: `Dự án 5.0/Video xây kênh/Source hoàn thiện/`** (đánh số 1, 2, 3, 4, 5, 6, 7, 8, …).

## Kho video
| Mã | Tên | Trạng thái |
|---|---|---|
| v01 | Sự trở lại & Người bạn mới (89,8s) | Hoàn thành 14/10 – `tap/v01-tro-lai-cung-dom/xuat/v01-tro-lai-cung-dom-v3.mp4`; bản lưu: `Source hoàn thiện/1. …`. **Thumbnail (anh chọn mẫu D, 15/10):** `xuat/thumb-doc-1080x1920.png` + `thumb-ngang-1280x720.png`, tiêu đề "TRỞ LẠI CÙNG ĐỐM", nút "Người bạn mới của kênh". Đăng 18/10 |
| v02 | Hết sửa tên & số từng văn bản – demo "Tạo văn bản hàng loạt" (74s) | **Anh duyệt 14/10** – `tap/v02-tao-van-ban-hang-loat/xuat/v02-tao-van-ban-hang-loat-v1.mp4` + thumb dọc/ngang; bản lưu: `Source hoàn thiện/3. Demo tạo văn bản hàng loạt 1410.mp4`. Lịch đăng 20/10 |
| v03 | Tra Điều luật & văn bản hướng dẫn trong một trang – demo "Cẩm nang Thuế, Kế toán, Lao động" (109s, 6 tính năng) | **Anh duyệt 15/10** – `tap/v03-cam-nang-thue/xuat/v03-cam-nang-thue-v2.mp4` + thumb dọc/ngang + `youtube-v03.md`; bản lưu: `Source hoàn thiện/4. Demo Cẩm nang tra cứu Thuế - Kế toán - Lao động.mp4`. **YouTube Shorts (Không công khai) 15/10:** https://youtube.com/shorts/-S_ZZN7rNBw; lịch công khai 21/10 |
| v04 | Chọn đúng công cụ – Giải quyết đúng việc: vì sao có kho công cụ nhỏ (anh tự quay + Đốm, 128,8s) | **Anh duyệt 16/10** (bản duyệt 3) – `tap/v04-chon-dung-cong-cu/xuat/v04-ban-duyet-3.mp4` + thumb; bản lưu: `Source hoàn thiện/2. Giới thiệu bộ công cụ trên website.mp4`. Đăng 19/10 |
| v05 | Công cụ tải & xử lý hàng loạt hóa đơn thuế – giới thiệu 5 tính năng Bộ công cụ hóa đơn thuế (anh tự quay + Đốm, 143,5s) | **Anh duyệt 19/10 18:38** (bản 3) – `tap/v05-gioi-thieu-hoa-don-thue/xuat/v05-gioi-thieu-hoa-don-thue-ban3.mp4` + `thumb-doc-luoi-1080x1920.png` / `thumb-doc-1080x1920.png` / `thumb-ngang-1280x720.png` (tiêu đề "TẢI & XỬ LÝ HÓA ĐƠN THUẾ", Đốm 18-tải-lên, nút "Bảng kê · Tờ khai · MISA") + `youtube-v05.md`; bản lưu: `Source hoàn thiện/5. Giới thiệu công cụ tải & xử lý hóa đơn thuế.mp4`. **Lịch đăng T5 22/10/2026 19:00, 3 kênh** (nội dung đã nạp Xưởng video, chờ `npm run deploy:admin`) |
| v06 | Tải hàng loạt hóa đơn bằng 1 nút – hướng dẫn 5 bước thẻ 1 Bộ công cụ hóa đơn thuế (Đốm dẫn 100%, 99,7s) | **Anh duyệt 19/10 20:54** (bản 1) – `tap/v06-tai-ca-quy-hoa-don/xuat/v06-tai-hang-loat-hoa-don-ban1.mp4` + 3 thumb (tiêu đề "TẢI HÀNG LOẠT HÓA ĐƠN BẰNG 1 NÚT", Đốm 16-kính-lúp, nút "Không giới hạn · Free") + `youtube-v06.md`; bản lưu: `Source hoàn thiện/6. Tải hàng loạt hóa đơn bằng 1 nút.mp4`. **Lịch đăng T6 23/10/2026 19:00, 3 kênh** (đã nạp Xưởng video `_mig_studio_v4`, chờ `npm run deploy:admin`) |
| v07 | Chuyển đổi hàng loạt XML sang file Excel – hướng dẫn thẻ 2 Bộ công cụ hóa đơn thuế (Đốm dẫn 100%, 100,7s) | **Anh duyệt 20/10 09:54** (bản 2, sửa giọng XML) – `tap/v07-zip-ra-bang-ke/xuat/v07-chuyen-doi-xml-sang-excel-ban2.mp4` + 3 thumb (tiêu đề "CHUYỂN ĐỔI HÀNG LOẠT XML SANG FILE EXCEL", Đốm 14-tài-liệu, nút "Tự báo hóa đơn cần xem lại") + `youtube-v07.md`; bản lưu: `Source hoàn thiện/7. Chuyển đổi hàng loạt XML sang file Excel.mp4`. **Lịch đăng T7 24/10/2026 19:00, 3 kênh** (đã nạp Xưởng video `_mig_studio_v5`, chờ `npm run deploy:admin`) |
| v08 | Tạo tờ khai 01/GTGT tự động – hướng dẫn 7 bước thẻ 4 Bộ công cụ hóa đơn thuế (Đốm dẫn 100%, 140,3s) | **Anh duyệt 20/10 11:37** (bản 1) – `tap/v08-to-khai-01gtgt/xuat/v08-tao-to-khai-01gtgt-ban1.mp4` + 3 thumb (tiêu đề "TẠO TỜ KHAI 01/GTGT TỰ ĐỘNG", Đốm 19-hoàn-thành, nút "Tự tính chỉ tiêu · Có phụ lục NQ 204") + `youtube-v08.md`; bản lưu: `Source hoàn thiện/8. Tạo tờ khai 01-GTGT tự động.mp4`. **Lịch đăng CN 25/10/2026 19:00, 3 kênh** (đã nạp Xưởng video `_mig_studio_v6`, chờ `npm run deploy:admin`) |
| cn01 | Cẩm nang thuế (bản mẫu) | Bản mẫu, không đăng |


## Bài học (v09 "Tạo sẵn file nhập lên MISA", 20/10 – Đốm dẫn 100%, 67,7s, anh duyệt ngay bản 1 · hết đợt 1)
- Nội dung chỉ "vận hành + tác dụng", không demo chi tiết (chờ KTT nhập thử thật). Không nói "nhập thẳng MISA không lỗi", không dùng số "129/149 gợi ý đúng" vì chạy thật thấy vài gợi ý loại sai (vd "Chè long nhãn" → Dịch vụ, "Hoa cẩm tú cầu" → Nhập kho) → lời chỉ nói "gợi ý", nhấn "rà lại".
- Anh tự thêm đoạn D08 "nhiều anh chị kế toán quan tâm… Đốm đang tiếp tục tối ưu" – em đổi "rất nhiều" → "nhiều" (chưa có số liệu chứng minh mức độ).
- Số liệu thẻ 5 (dữ liệu giả Q3): NCC 28; 218 dòng/149 mặt hàng; gợi ý NV khác 129, DV 11, NK 9; xuất mua 3 file (Mua hàng trong nước 5 CT/10 dòng, Mua DV 6/11, NV khác 45/386), bán 2 file (Bán hàng 34/35, Bán DV 46/46). Thiết lập mặc định: 331, 1331, Chưa thanh toán, TK kho 1561, tiền tố NK/MH/MDV/NVK.
- **Bán ra lộ chi tiết** ở bản quay đầu (tên dịch vụ/sản phẩm, 1 khách hàng là doanh nghiệp) → quay lại: `fr.add_style_tag(BLUR)` cho `#m-ptbl,#m-itbl,#m-miss,#m-fcount,#m-dmvt-t` khi ở Bán ra, nhảy thẳng (`scrollTo`) tới `#m-out`, quay về Mua vào rồi mới gỡ mờ; D07 dùng khung đỏ mua vào.
- Bảng hàng hóa rộng: cột TK + ✓ nằm khuất bên phải → cuộn ngang `.tbl-wrap` (`closest('.tbl-wrap').scrollLeft`). TK gõ "6422" + nhãn "TK ví dụ minh họa". Sau khi bấm ✓, `pulse(okbtn,False)` treo 30s (nút được vẽ lại) → cắt trong BEATS.
- BEATS nhiều mảnh để bỏ thao tác thừa: tổng từ 77s → 67,7s, lời phủ kín hình (D04: 2 mảnh – 3 dòng đầu + lọc "Xăng"; D06: mua vào 3 file + bán ra 2 file).
- Thumbnail ở `#m-out` phải chụp `full_page` với clip theo tọa độ trang (khối nằm cuối trang, không cuộn tới đỉnh được) và ẩn `#m-miss` (chữ "MISA sẽ báo lỗi" không hợp thumbnail).
- **Series (anh chốt sau Cổng 3):** v06–v09 = "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn – Phần 1–4". Làm lại 12 thumbnail (giữ ảnh chụp + tư thế Đốm từng tập; ảnh v06 lấy lại bằng cách xoay thẳng thumbnail cũ −3°), bản cũ ở `xuat/_thumb-cu/`. Nội dung 3 kênh sinh từ 1 script `xuong-video/_series/dong_bo_series_hoa_don.py` (đọc SEED_V4–V6, thêm v09, sinh SEED_V7 + `_mig_studio_v7` ghi đè tên/nội dung bài chưa đăng, cập nhật bảng lịch HTML + `youtube-vNN.md`).
- Mã dựng: `tap/v09-file-nhap-misa/dung/ma-dung-v09.tgz`. Kho video: v09 · `9. Tạo sẵn file nhập lên MISA.mp4` · thumb nút "TẠO SẴN FILE NHẬP LÊN MISA" (Phần 4/4, Đốm 18-tải-lên) · T2 26/10 19:00 · `_mig_studio_v7`.
