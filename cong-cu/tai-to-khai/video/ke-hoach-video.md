# Kế hoạch video – Tải tờ khai thuế đã nộp hàng loạt (anh chốt 03/11/2026 10:24)

> Tài liệu tổng hợp để làm video của công cụ (theo QUY-TRINH-VIDEO mục 1). Mỗi video **1 hội thoại riêng**; Cổng 2 (kịch bản) làm ở hội thoại đó, sau khi chạy thử.
> Tách 2 video theo bài học v14a/v14b: **v19 anh kể "Vì sao"**, **v20 Đốm "Làm thế nào"** – v20 không lặp lại câu chuyện của v19.
> Điểm truyền thông: `diem-noi-bat-truyen-thong.md` · Bài fanpage đã đăng: `04_Nội dung - Marketing/bai-dang-tai-to-khai.md` (lời anh chốt – dùng làm xương sống lời kể v19).

## 1. Trạng thái
| Mã | Video | Ai | Dài | Đăng (đề xuất, anh kéo thả đổi được) | Thư mục | Trạng thái |
|---|---|---|---|---|---|---|
| **v19** | Đặt vấn đề: "Tải lại tờ khai cả năm trên trang dịch vụ công – vì sao Tuấn làm công cụ này" | **Anh nói chính**, Đốm chỉ câu kết | 1:30–2:00 | T6 06/11 19:00 | `xuong-video/tap/v19-tai-to-khai-dat-van-de/` | ✅ Xong 04/11 13:45 – Source `19. Tải tờ khai thuế đã nộp hàng loạt_Đặt vấn đề.mp4` (1:30), D01 sửa: "Cảm ơn anh Tuấn. Em sẽ giới thiệu và hướng dẫn anh chị sử dụng công cụ này ở video tiếp theo ạ." |
| **v20** | Ra mắt + hướng dẫn: "Tải cả năm tờ khai trong một lần" (= **Video demo** của công cụ, dán link vào Quản trị → Công cụ) | **Đốm** giới thiệu + hướng dẫn | 2:30–2:50 | T7 07/11 19:00 | `xuong-video/tap/v20-tai-to-khai-huong-dan/` | 🔧 **Đang làm 03/11 10:35** (hội thoại "v20 – Tải tờ khai: Hướng dẫn sử dụng") ✅ **Xong 03/11** (anh duyệt 13:08) – `Source hoàn thiện/20. Tải tờ khai thuế đã nộp hàng loạt_Hướng dẫn sử dụng.mp4` (2:41), `_mig_studio_v20`, caption `xuat/youtube-v20.md` |
| sau | Nộp bổ sung nhiều lần: biết ngay lần nào có hiệu lực | Đốm | 45–60s | – | – | Chờ KTT xác nhận quy tắc "lần hiệu lực cuối" + góp ý người dùng |
| sau | Hồ sơ trước 01/07/2025: 12 tháng chỉ 1 mã | Đốm | 45–60s | – | – | Chờ chạy thật tab Thuế điện tử qua công cụ |
Migration Xưởng video: v18 dùng `_mig_studio_v18` → **v19 `_mig_studio_v19`, v20 `_mig_studio_v20`**.

## 2. Câu chuyện ra đời (đúng sự thật, anh đã chốt lời ở bài fanpage 02/11)
- Vợ Tuấn (kế toán trưởng) cần tải lại tờ khai thuế **các năm trước** đã nộp trên **trang dịch vụ công** (dichvucong.gdt.gov.vn → Tra cứu hồ sơ). Làm tay gặp 5 vấn đề:
  1. Mỗi lần tra chỉ được **tối đa 30 ngày** → cả năm phải tra 12 lần.
  2. Lần tra nào cũng phải **gõ mã xác nhận**.
  3. **Không có nút tải hàng loạt** – mở và tải từng hồ sơ.
  4. Mở xem một tờ khai xong **không có nút quay lại**, phải tra lại từ đầu.
  5. Kỳ nào **nộp nhiều lần** (chính thức + bổ sung) phải tự so xem lần nào là lần cuối.
- Anh nghiên cứu cách đã làm ở Bộ công cụ hóa đơn (nút trên thanh dấu trang, chạy ngay trên trang đã đăng nhập) → xây trong ngày 02/11, vợ anh chạy thử, sửa 2 lượt (lỗi "hồ sơ không hợp lệ" vì trang chỉ cho tải hồ sơ của lần tra gần nhất; thông báo của CQT lỗi do chính trang dịch vụ công) → **chia sẻ miễn phí 03/11**.
- Cách gọi đã chốt: "**vợ Tuấn**" (KHÔNG "chị nhà mình"), "**trang dịch vụ công**" (KHÔNG "cổng thuế"), tên công cụ "**Tải tờ khai thuế đã nộp hàng loạt**".

## 3. Tính năng (bản 1.0.0 – dùng cho v20)
| Tính năng | Trên giao diện | Câu lợi ích |
|---|---|---|
| Nút trên thanh dấu trang, chạy trên trang dịch vụ công đã đăng nhập | Kéo nút từ trang công cụ `/cong-cu/tai-to-khai` | Không cài đặt, không nhập mật khẩu vào công cụ |
| Chọn nhanh khoảng ngày | Tháng trước · Quý trước · **Năm nay** · **Năm trước** (hoặc gõ dd/mm/yyyy) | Chọn cả năm, công cụ tự chia lượt đúng giới hạn của trang |
| Tự chia lượt 2 tab | Hồ sơ từ 01/07/2025: mỗi tháng 1 lượt · Trước 01/07/2025 (tab Thuế điện tử): 12 tháng 1 lượt | Mỗi lượt chỉ gõ 1 mã xác nhận |
| Gọi khi đến lượt gõ mã | Chuông + nháy tab + thông báo; báo trước giờ đến lượt sau (`#pnext`); mẹo mở cửa sổ Chrome riêng | Đi làm việc khác, đến lượt công cụ gọi |
| 2 chế độ | **Đầy đủ – kèm thông báo của CQT** / **Tải nhanh – chỉ tờ khai** | Cần nhanh thì bỏ thông báo |
| Gom lần nộp | Ô **Chỉ giữ lần hiệu lực cuối của mỗi kỳ**; bảng kết quả 2 cách xem **Theo ngày nộp / Theo tờ khai & kỳ** | Biết ngay lần nộp sau cùng của từng kỳ |
| Kết quả 1 file ZIP | Thư mục theo tờ khai, tờ khai + phụ lục + thông báo, `Bang-ke-to-khai.xlsx` (2 sheet), `HS-chua-tai-duoc.txt` | Lưu trữ gọn, có bảng kê để kiểm |
| Dừng giữa chừng | **Dừng, lưu phần đã tải** · lần sau **Điền sẵn khoảng ngày còn lại** | Không phải tải lại từ đầu |
| Nói rõ phần thiếu | Thông báo CQT lỗi ghi riêng, tờ khai vẫn đủ ("Đã tải (thiếu N TB)") | Thiếu gì công cụ nói rõ |

## 4. KHÔNG được nói
- Không nói công cụ "vượt / bỏ qua / tự nhập mã xác nhận" – **người dùng tự gõ mã**, công cụ chỉ gọi khi đến lượt. Không nói "tự động 100%", "không bao giờ lỗi".
- Chỉ **đọc và tải** hồ sơ, không nộp / bổ sung / hủy hồ sơ – nói được câu này (lợi ích an toàn), không nói ngược lại.
- "Lần hiệu lực cuối" = **hồ sơ nộp sau cùng** của cùng tờ khai + kỳ (không tính hồ sơ hủy / không được chấp nhận). **KTT chưa xác nhận quy tắc** → nói "đánh dấu lần nộp sau cùng của mỗi kỳ", không nói "lần có giá trị pháp lý".
- Chưa kiểm chứng trên trang thật: tháng > 50 hồ sơ, tài khoản **đại lý thuế** (chưa hỗ trợ), hết phiên đăng nhập thật → không nêu.
- Hồ sơ nộp trước 01/07/2025: **anh xác nhận 03/11 11:37 công cụ đã tải được trên trang dịch vụ công** → được nói ("mỗi 12 tháng chỉ cần 1 mã"); v20 chỉ nói thêm 1 câu, không làm ví dụ.
- Không nêu số liệu thời gian ("tải 1 năm trong X phút") khi chưa đo trên dữ liệu thật của anh.
- Không lộ MST/tên doanh nghiệp thật (ảnh chụp anh gửi 02/11 có dữ liệu thật → che hoặc dùng trang giả lập).

## 5. Khung kịch bản v19 – Đặt vấn đề (anh nói chính)
Khung (v14a/v17/v18): **câu đầu của anh (hook) → bật đèn 5s → phần còn lại của anh (chèn hình) → Đốm 1 câu kết → kết 7s.** Phụ đề theo phiên âm (`phien-am-v19.cmd`), phiên âm lại từng câu sau khi cắt (bài học 8e).
| # | Ý anh nói (gợi ý – anh nói tự nhiên, không đọc thuộc) | Hình chèn đề xuất |
|---|---|---|
| A1 hook (≤ 15 tiếng, ~3s) | Phương án: (a) "Tải lại tờ khai thuế cả năm, mà mỗi lần chỉ được tra 30 ngày?" · (b) "12 tháng tờ khai, 12 lần gõ mã, mở từng tờ một." · (c) anh tự nói theo cách của anh | Chữ hook lớn trên hình anh |
| — | *Bật đèn 5s: logo Đốm + tiêu đề, vd "TẢI TỜ KHAI CẢ NĂM / TRONG MỘT LẦN"* | |
| A2 bối cảnh | "Mới đây vợ Tuấn – một kế toán trưởng – có chia sẻ nhu cầu tải hàng loạt tờ khai thuế các năm trước đã nộp trên trang dịch vụ công…" | Trang Tra cứu hồ sơ (che MST) |
| A3 nỗi đau | Kể 5 vấn đề (mục 2) – có thể gộp: 30 ngày/lần + gõ mã mỗi lần · không có nút tải hàng loạt + không có nút quay lại · nộp nhiều lần phải tự so | Mỗi ý 1 cảnh chèn 3–4s: thông báo giới hạn 30 ngày, ô mã xác nhận, danh sách hồ sơ từng dòng, nhiều dòng cùng kỳ |
| A4 cái giá | Ước lượng theo trải nghiệm của vợ anh (anh tự nói con số anh biết – em không bịa số) | Anh nói |
| A5 điểm xoay | "Tuấn đã xây một công cụ để tối ưu việc này, và hôm nay chia sẻ miễn phí tới anh chị có nhu cầu." (+ 1 câu về việc vợ anh đã chạy thử, nếu đúng) | Tờ ghim Bảng ghim "Đang hoàn thiện → Mới phát hành" hoặc trang công cụ (web thật) |
| A6 dẫn | "Cách dùng thế nào thì video sau Đốm sẽ hướng dẫn chi tiết nhé." | Anh nói → hòa sang Đốm |
| D01 (Đốm – câu duy nhất) | Phương án đề xuất: "Video sau, Đốm sẽ hướng dẫn anh chị tải cả năm tờ khai chỉ với một nút bấm. Link dùng thử, Đốm để ở bai ô của kênh nhé!" (hoặc chép nguyên D14 v07: "Link dùng thử, Đốm để ở bai ô của kênh. Anh chị dùng thử, và góp ý để Đốm hoàn thiện thêm nhé!") – **chốt ở Cổng 2** | Đốm cảm ơn + nút vàng "🔗 Link dùng thử ở bio" |
| Kết 7s | Chuẩn | |
**Anh chuẩn bị trước khi mở hội thoại v19:** quay 1 đoạn 60–90s (dọc, đủ sáng, mic gần) → để vào `Video xây kênh/Source gốc/<ngày quay ddmmyy>/`; nếu muốn cảnh chèn trang thật: chụp màn hình các chỗ vướng (đã che MST) hoặc để em dựng cảnh trang dịch vụ công giả lập.
Thumbnail đề xuất: "TẢI TỜ KHAI THUẾ / CẢ NĂM TRONG MỘT LẦN" (từ nhấn màu `#EBB25B` = "cả năm trong một lần" – cùng ý ảnh bài đăng), nút vàng **MIỄN PHÍ**.

## 6. Khung kịch bản v20 – Đốm giới thiệu & hướng dẫn (video demo)
Video **hướng dẫn**: đánh số bước ①…, đi đúng thứ tự thao tác; Đốm là người thử nghiệm ("Đốm sẽ thử…, anh chị cùng xem nhé"); Vbee 1,1, đuôi " Vâng." + `cat16.py`; không chào hỏi dài, câu đầu là hook; không lặp câu chuyện v19.
| Mã | Ý lời Đốm (viết chi tiết ở Cổng 2) | Hình | Nhãn vàng |
|---|---|---|---|
| D00 hook | Vd "Cả năm tờ khai thuế, chỉ cần gõ mỗi tháng một mã." | Panel đang chạy, thanh tiến độ | |
| D01 | Giới thiệu: công cụ Tải tờ khai thuế đã nộp hàng loạt – tải tờ khai, phụ lục, thông báo của cơ quan thuế trên trang dịch vụ công, cả năm trong một lần | Trang công cụ trên web | |
| D02 | ① Kéo nút vào thanh dấu trang (làm 1 lần) | Trang công cụ → kéo nút lên thanh dấu trang | ① Kéo nút |
| D03 | ② Đăng nhập trang dịch vụ công, vào Tra cứu hồ sơ, bấm nút vừa kéo → bảng điều khiển hiện ngay trên trang | Trang Tra cứu hồ sơ (giả lập) + panel | ② Mở trên trang dịch vụ công |
| D04 | ③ Chọn khoảng ngày: bấm Năm nay / Năm trước; công cụ báo trước sẽ chia mấy lượt (hồ sơ trước 01/07/2025 thì 12 tháng 1 lượt) | Bấm "Năm trước" → dòng số lượt | ③ Chọn khoảng ngày |
| D05 | Chọn chế độ Đầy đủ (kèm thông báo của CQT) hoặc Tải nhanh; ô Chỉ giữ lần hiệu lực cuối; bật chuông | Các tùy chọn | |
| D06 | ④ Bấm Tra cứu & tải, gõ mã xác nhận cho lượt đầu → công cụ tự tra và tải từng trang | Ô mã → thanh tiến độ "đang tải x/y" | ④ Gõ mã & tải |
| D07 | Đến lượt sau, công cụ rung chuông, nháy tab, hiện thông báo – anh chị làm việc khác được; báo trước còn bao lâu tới lượt sau | Chuyển cửa sổ khác → thông báo góc màn hình | ★ Có chuông gọi |
| D08 | ⑤ Xong: một file ZIP, thư mục theo từng tờ khai, kèm Bảng kê Excel; nhiều lần nộp cùng kỳ được gom, đánh dấu lần sau cùng | Mở ZIP → thư mục → Excel 2 sheet (mô phỏng đủ cột thật) | ⑤ File ZIP & Bảng kê |
| D09 | Hồ sơ nào trang dịch vụ công không cho tải, công cụ ghi rõ trong file riêng; dừng giữa chừng thì lần sau Điền sẵn khoảng ngày còn lại | HS-chua-tai-duoc.txt · banner Điền sẵn | |
| K01 | Cam kết (đọc theo công cụ, không chép D13 v07 vì khác nội dung): miễn phí, chạy ngay trên trình duyệt của anh chị, chỉ đọc và tải hồ sơ, không nộp hay sửa gì trên trang | Dòng cam kết trên trang công cụ | Miễn phí · Chỉ đọc & tải |
| K02 | Chép D14 v07 (link ở bio + góp ý) | Đốm cảm ơn | |
**Dữ liệu quay:** dùng **trang dịch vụ công giả lập** (`cong-cu/tai-to-khai/nguon/test/mock_test.py`, chế độ `shot`/`thumb`, MST 0123456789) – không quay tài khoản thật; dòng "Thông tin doanh nghiệp đã được thay đổi" ở mọi cảnh có dữ liệu. Cảnh kéo nút + trang công cụ quay trên web thật `/cong-cu/tai-to-khai`. Trước Cổng 2: chạy thử công cụ bản mới nhất (`app/index.html`, build `nguon/build.js`) và **kiểm lại đúng chữ trên nút** (các nhãn ở mục 3 lấy từ `tk-panel.js` bản 1.0.0).
Phiên âm Vbee: ZIP "díp" · Excel "ích xeo" · CQT "cơ quan thuế" · "01/07/2025" đọc "một tháng bảy năm hai nghìn không trăm hai mươi lăm" · bio "bai ô".
Thumbnail đề xuất: "HƯỚNG DẪN / TẢI TỜ KHAI THUẾ / CẢ NĂM TRONG MỘT LẦN", nút vàng **MIỄN PHÍ – DÙNG NGAY**.
Sau khi đăng v20: dán link vào Quản trị → Công cụ → Tải tờ khai → Video demo.

## 7. v21 – Góp ý → bản 1.1.0 (anh giao 03/11/2026 21:56, CHƯA lập kịch bản – làm ở hội thoại video riêng)
**Ý anh:** nói về feedback của người dùng và tính năng đã cập nhật ở bản mới; CTA: khi góp ý có thể để lại **email/SĐT** để Đốm báo khi công cụ thay đổi.
Chất liệu (đều là thật, không bịa):
- Góp ý thật (03/11, 5★, "Đánh giá chung"): "Tải tờ khai thuế: không tải được những năm cũ VD 2021-2023 không tải được (báo lỗi)". Hiển thị tên: chỉ khi người góp ý đồng ý (Góc cảm ơn).
- Nguyên nhân anh tìm ra: **nộp ở đâu – tải ở đó** – trước 01/07/2025 nằm trên thuedientu.gdt.gov.vn; 07–12/2025 ở 1 trong 2 trang; từ 2026 chủ yếu trang dịch vụ công (nhưng vẫn có hồ sơ nộp trên thuế điện tử, VD BCTC 02/2026).
- Bản 1.1.0 (cùng tối 03/11): cùng 1 nút cho 2 trang · trang thuế điện tử tra nhiều năm 1 lần, **không cần mã xác nhận** · tải tay mỗi tờ khai phải chọn thư mục + xác nhận → công cụ chỉ hỏi chỗ lưu **1 lần** cho cả ZIP · dòng trang không cho tải ghi rõ.
- Form Góp ý mọi công cụ có thêm ô **Email (không bắt buộc)** + Quản trị có nút **🔔 Báo cập nhật** gửi thư bản mới cho người đăng ký và người góp ý có để lại email (có link bỏ nhận).
**KHÔNG được nói:** số lượng người dùng/lượt tải chưa có số liệu; "tải được mọi tài khoản" (mới kiểm tài khoản doanh nghiệp, chưa kiểm cá nhân/đại lý thuế).
**Lưu ý v20 (đã dựng theo bản 1.0.0):** cảnh D04 nói "hồ sơ trước 01/07/2025 thì 12 tháng 1 lượt" – **không còn đúng từ bản 1.1.0** (trang dịch vụ công không còn tra năm cũ). Cần sửa lời D04 / thêm phụ đề trước khi đăng v20.
Quay: thuedientu giả lập `nguon/test/mock_etax.py` (chế độ `shot`), không quay tài khoản thật.
