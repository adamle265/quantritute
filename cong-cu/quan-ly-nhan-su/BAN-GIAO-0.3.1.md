# Bàn giao cho hội thoại mới – bản 0.3.1 Module Chấm công
> Viết 07/11/2026 12:20, khi đóng hội thoại làm bản 0.2.1. Hội thoại mới đọc file này trước, sau đó đọc `README.md` (mục nhật ký), `series/00_HO-SO-SERIES.md` và `../../../00_TIẾN ĐỘ CHUNG - Các hội thoại.md`.

## 1. Hiện trạng (07/11 12:20)
| Hạng mục | Trạng thái |
|---|---|
| Bản 0.1.1 Tổng quan | Đã lên web `/quan-ly-nhan-su/011/` (06/11) |
| Bản 0.2.1 Nhân sự | Anh chốt 09:37. Đã dựng `/quan-ly-nhan-su/021/` và trang Lịch sử trên máy. **Chưa deploy** |
| Ảnh chia sẻ | Mỗi trang có ảnh riêng: `og/quan-ly-nhan-su-021.jpg` (bản), `og/quan-ly-nhan-su-lich-su-021.jpg` (Lịch sử), `og/quan-ly-nhan-su.jpg` (trang /cong-cu) |
| Bộ công cụ trên web | `_mig_tools_v25`: Active, Nổi bật, sort 5, nhãn "Đang xây dựng", ô ghi chú ĐANG XÂY DỰNG, nút "Theo dõi hành trình & trải nghiệm ↗" dẫn tới `/quan-ly-nhan-su/`. **Chưa deploy** |
| Bài fanpage 0.2.1 | `04_Nội dung - Marketing/Series phần mềm nhân sự/bai-cap-nhat-0.2.1.md` + 10 ảnh `anh-021-01…10` (anh đã duyệt). Chờ anh đăng sau khi deploy |
| Bản 0.3.1 Chấm công | Phạm vi dự kiến ở `nguon/phien-ban-du-kien.json`, đang hiện thành thẻ "Đang làm" trên trang Lịch sử. Có bản thử chấm công Wi‑Fi cũ ở `cham-cong-thu/` (Cloudflare Worker, xem `HUONG-DAN-TEST.md`) |

**Anh cần chạy** (PowerShell tại `quantritute`):
1. Nhấp đúp `cong-cu\quan-ly-nhan-su\xuat-ban-web.cmd`, tương đương `npm run deploy:site`.
2. Chạy `npm run deploy:admin`, vì có sửa `src/core.js`.
3. Vào Facebook Sharing Debugger, bấm Scrape Again cho các link `/quan-ly-nhan-su/`, `/021/`, `/011/`, `/cong-cu/quan-ly-nhan-su`. Thử mỗi link có và không có dấu `/` cuối, và có kèm `?nguon=facebook`.

## 2. Quy ước đã chốt (giữ nguyên ở bản sau)
- **Số bản:** `0.B.C`, B là thứ tự module hoàn thành. Bản tiếp theo là **0.3.1**.
- **Khi anh chốt một bản:**
  1. Đóng băng mã nguồn: chép `nguon/src` và `assets/mau.b64` vào `nguon/_ban-0.3.1/`.
  2. Thêm mục vào `phien-ban.json`: `ban`, `ngay`, `gio`, `module`, `ten`, `nguon`, `hang_muc`, `moi[]` (xây dựng mới), `nang_cap[]` (nâng cấp/bổ sung/sửa đổi).
  3. Cập nhật `phien-ban-du-kien.json` sang module kế tiếp.
  4. Chạy `node xuat-ban.js 0.3.1`.
- **Ảnh chia sẻ, bắt buộc. Thiếu thì `xuat-ban.js` dừng và báo lỗi:**
  - Ảnh bản `og/quan-ly-nhan-su-031.jpg`: dựng bằng `nguon/og/og.html` + `tao-anh-og.js`, chụp màn hình module Chấm công.
  - Ảnh Lịch sử `og/quan-ly-nhan-su-lich-su-031.jpg`: dựng bằng `nguon/og/og-lich-su.html?d=<JSON>` + `tao-anh-og-2.js`. Dòng thời gian thêm 0.3.1 ✓ và module kế tiếp ở trạng thái đang làm.
  - Ảnh trang /cong-cu `og/quan-ly-nhan-su.jpg`: chỉ đổi khi thông điệp công cụ đổi.
  - Mỗi trang một ảnh, không dùng chung. Không để anh phải nhắc.
- **Bản ghi trên Bộ công cụ, khi lên bản mới:** viết migration mới `_mig_tools_v26` trở đi (kiểm tra số cuối trong `src/core.js` trước). Migration làm 3 việc:
  - Đổi `version = 'Bản 0.3.1'`.
  - Thêm 1 dòng đầu `changelog` (`0.3.1 | dd/mm/yyyy | ý 1; ý 2…`), có điều kiện `instr(changelog,'0.3.1 |') = 0`.
  - Bổ sung `highlights`/`benefits` nếu cần.
  - Bọc try/catch. Giữ `notice` cho tới khi xong toàn bộ, tức bản 1.x.
- **Trang bản công khai:**
  - Lần đầu mở hiện popup "Bản X · Đã hoàn thành", liệt kê cộng dồn các module đã xong, có nút "Trải nghiệm ngay với dữ liệu mẫu".
  - Mỗi bản dùng IndexedDB riêng.
  - Dữ liệu mẫu cập nhật theo mọi thay đổi anh yêu cầu. Khi sửa, đổi `SAMPLE_V` trong `src/app.js`.
- **Bài fanpage (series):**
  - Tiêu đề "📌 CHIA SẺ HÀNH TRÌNH XÂY PHẦN MỀM NHÂN SỰ - NGÀY N / BẢN X: MODULE …".
  - Sau đoạn mở đầu có câu "Những tính năng Tuấn mới xây dựng và cập nhật thêm vào bản này:".
  - Dùng `---` làm dấu ngăn, không dùng dấu gạch ngang dài.
  - Kết bằng lời mời dùng thử và góp ý, không đặt câu hỏi.
  - Link để ở bình luận đầu, kèm `?nguon=facebook` và có `/` cuối.
- **Ảnh bài đăng:**
  - KHÔNG ghi số thứ tự lên ảnh.
  - Dùng dữ liệu mẫu hư cấu Đốm Sáng Edu / Health.
  - Không chọn ảnh quá chi tiết. Đưa artifact cho anh chọn.
- **Giới hạn khi làm:**
  - Không sửa `nguon/_ban-*` của bản đã xuất.
  - Chỉ sửa `site/`, `src/` khi việc cần đến.
  - Lệnh Cloudflare do anh chạy. Không chép đè `wrangler.jsonc`.
- **Giao file về máy anh:** mỗi lần giao dùng thư mục tạm mới. Sau khi giao chạy `node build.js` trên máy anh và so md5.

## 3. Việc còn mở
- Mẫu văn bản hợp đồng `mau-van-ban-hop-dong/`: Word của KTT đã kiểm đạt. Nội dung pháp lý vẫn là mẫu tham khảo.
- "Miễn phí với gói Cloudflare miễn phí" mới là dự kiến. Phải kiểm chứng khi chạy thật bản Wi‑Fi (đã ghi rõ trên thẻ Đang làm).
