# Kế hoạch video – Bảng kê & Tờ khai thuế GTGT từ Excel

> Theo `xuong-video/QUY-TRINH-VIDEO.md`. File này dùng cho **Cổng 1** (danh sách video). Kịch bản + dựng của từng video làm ở **hội thoại riêng** (anh mở hội thoại mới cho từng video).
> Định dạng: video dọc 1080×1920, đăng chung TikTok / YouTube Shorts / Fanpage Reels, 19:00. Video dài ngang YouTube: làm sau, khi anh yêu cầu.
> **Dữ liệu quay:** chỉ dùng bộ file giả `nguon/du-lieu-thu/` (MST 0123456789, sinh bằng `nguon/tao_du_lieu_gia.py`; có sẵn 1 HĐ hộ kinh doanh mẫu số 2). KHÔNG dùng file của anh Phương (dữ liệu thật của khách).
> Mã video: **v14a, v14b, v15, v16** (anh chốt 30/10 07:54: tách v14 thành 2 video vì ghép sẽ dài – 14a "Cùng tối ưu và chia sẻ" dựng từ 2 video anh quay, 14b = hook + phần cảm ơn + phần Đốm giới thiệu). Đăng 19:00: v14a T7 31/10 · v14b CN 01/11 · v15 T2 02/11 · v16 T3 03/11. 14a + 14b làm chung 1 hội thoại (anh chốt).
> **Anh chốt 29/10/2026 11:38: làm 3 video** (bỏ phương án 4 video).

## 1. Danh sách video (Cổng 1) – ĐÃ DUYỆT 29/10/2026
| Thứ tự | Mã | Tiêu đề (hook) | Ví dụ xuyên suốt | Nội dung (1–2 câu) | Ai | Dài | Đăng 19:00 |
|---|---|---|---|---|---|---|---|
| 1 | v14 | Video ra mắt (= Video demo): "Một anh kế toán đặt làm công cụ này – rồi đồng ý mở miễn phí cho tất cả" | Công ty mẫu, tháng 09/2026: 3 file danh sách (bán ra máy tính tiền, mua vào có mã, không mã) | 15s đầu anh kể: kế toán dùng MISA đặt làm công cụ soát tờ khai, góp ý từng chi tiết, nhận xong gửi tiền cafe và đồng ý để công cụ miễn phí cho mọi người. Còn lại Đốm chạy nhanh 1 lượt: thả file → bảng kê 4 sheet → tờ khai 01/GTGT | Anh + Đốm | 75–90s | T7 31/10 |
| 2 | v15 | Phần 1 – Bảng kê tổng hợp: "Thả file cổng thuế vào, có ngay bảng kê mua – bán, kể cả HĐ sửa sai về muộn" | Cùng công ty mẫu T09/2026; HĐ nhà hàng 8% + 10%; 1 HĐ hộ kinh doanh; 1 HĐ điều chỉnh do sai sót lập tháng 10 cho HĐ tháng 09 | Tính năng nổi bật bước 2: tự bỏ trùng, tách thuế suất ước tính + ✓ hàng loạt, [23] theo cách MISA (phí, HĐ hộ KD tự nhận), thẻ mua/bán điều chỉnh – thay thế; **thêm HĐ sửa sai lập kỳ sau** vào đúng kỳ HĐ gốc, chặn nhập trùng; tải Excel 4 sheet | Đốm 100% | 70–90s | T2 02/11 |
| 3 | v16 | Phần 2 – Tờ khai: "Tờ khai trên MISA có khớp cổng thuế không? Biết trong 1 phút" | Cùng công ty mẫu T09/2026 | Bước 3: tờ khai 01/GTGT lập từ bảng kê → **đối chiếu từng chỉ tiêu với tờ khai trên phần mềm** (dòng lệch tô đỏ) → **xuất XML tờ khai** | Đốm 100% | 60–80s | T3 03/11 |

## 2. Điều kiện / lưu ý trước khi quay (hội thoại làm video đọc mục này)
- **Video 1:** nêu **tên anh Phương** chỉ khi anh Phương đồng ý; chưa hỏi → kể "một anh kế toán dùng MISA".
- **Video 2:** phần HĐ điều chỉnh / thay thế chỉ nói **thao tác** (chọn lý do, thêm HĐ sửa sai lập kỳ sau); câu về căn cứ (TT 91/2026, NĐ 252/2026) chỉ nói khi anh Phương / KTT đã xác nhận cách áp dụng. Không nói "[23] khớp 100% MISA" khi anh Phương chưa thử kỳ có HĐ hộ KD thật.
- **Video 3 – 2 điểm CHƯA kiểm chứng, không được nói quá:**
  - **"So sánh với tờ khai từ MISA":** nạp file XML tờ khai MISA AMIS **chưa thử** (mới thử XML cấu trúc HTKK). Quay bằng cách **gõ số tờ khai MISA vào ô đối chiếu** (đã chạy chắc chắn) hoặc nạp XML mẫu HTKK. Nếu trước ngày quay anh Phương thử XML AMIS thành công thì mới quay cảnh nạp XML AMIS.
  - **"XML sẵn sàng nộp":** XML công cụ xuất theo cấu trúc HTKK nhưng **chưa thử nhập vào HTKK / nộp thử trên eTax**. Trước khi dùng câu "sẵn sàng nộp" cần 1 lần nhập thử vào HTKK thành công (nhờ anh Phương hoặc chị nhà). Chưa thử → nói "xuất XML tờ khai theo cấu trúc HTKK, mở kiểm tra trên HTKK trước khi nộp".
- **Bản 1.0.3 (29/10 21:50):** cột Tính vào TK có ô "Tất cả (N)" + "↺ mặc định" (góp ý người dùng đầu tiên chị Mai Ngọc Hằng, 5/5★) – v15 nên có 1 cảnh: lọc → bỏ/tick Tất cả. Quay sau khi anh đã chạy `.\cap-nhat.cmd` (kiểm tra web có ô Tất cả). Lời khen của chị Hằng chỉ đưa vào video khi chị đồng ý.
- Cảnh quay dùng bản trên web `https://quantritute.com/tools/to-khai-gtgt/` (bản 1.0.2), không quay bản offline.
- Điểm nổi bật để viết lời: `video/diem-noi-bat-truyen-thong.md`.

**Thứ tự đăng:** 1 → 2 → 3, cách nhau 2–3 ngày. Lịch cụ thể xếp trong Quản trị → Xưởng video.

## 3. Trạng thái
| Video | Cổng 1 | Kịch bản (Cổng 2) | Giọng | Dựng | Cổng 3 | Source hoàn thiện | Lên lịch 3 kênh |
|---|---|---|---|---|---|---|---|
| v14a – Cùng tối ưu và chia sẻ (T7 31/10) | Anh chốt 30/10 | Từ 2 video anh quay (Source gốc 3010) | – | Bản 1 xong 30/10 09:35 (2:06) | Duyệt 30/10 10:08 | 14a. Cùng tối ưu và chia sẻ.mp4 | `_mig_studio_v14` (chờ deploy:admin) |
| v14b – Ra mắt / Video demo (CN 01/11) | Đã duyệt 29/10 | Anh OK v2 (29/10 16:42) | Xong 29/10 | Bản 2 (1:48, hook chỉ lời cảm ơn) | Duyệt 30/10 10:39 | 14b. Ra mắt Bảng kê & Tờ khai thuế GTGT từ Excel.mp4 | `_mig_studio_v14b` (chờ deploy:admin) |
| v15 – Bảng kê tổng hợp (T2 02/11) | Đã duyệt 29/10 | v2 anh OK 30/10 10:58 (trọng tâm: trải nghiệm bước 2 + file bảng kê tổng hợp) | Xong 30/10 | Bản 1 (2:10) | Duyệt 30/10 12:07 | 15. Bảng kê & Tờ khai thuế GTGT từ Excel_Phần 1_Bảng kê tổng hợp.mp4 | `_mig_studio_v15` (chờ deploy:admin) |
| v16 – Tờ khai & đối chiếu (T3 03/11) | Đã duyệt 29/10 | v2 anh duyệt 30/10 12:34 (nối Phần 1; bỏ chữ MISA → "phần mềm kế toán") | Xong 30/10 12:41 | Bản 2 (2:26) – đối chiếu chính = nạp XML, bỏ B04/B05/gõ số chi tiết, sửa cắt "Vâng" | Duyệt 30/10 16:26 | 16. Bảng kê & Tờ khai thuế GTGT từ Excel_Phần 2_Tờ khai & đối chiếu.mp4 | `_mig_studio_v16` (chờ deploy:admin) |
| v17 – Feedback đầu tiên (T4 04/11) | Anh giao 30/10 08:08 | Anh duyệt 31/10 07:46 (anh quay mở đầu + Đốm 8 đoạn) | Xong 31/10 08:19 | Bản 4 (2:23) – chống rung, hòa hình, khung feedback nguyên văn | Duyệt 31/10 14:23 | 17. Góp ý đầu tiên đã thành tính năng mới.mp4 | `_mig_studio_v17` (chờ deploy:admin) |

Video ra mắt đăng xong → dán link vào Quản trị → Công cụ → Video demo.
