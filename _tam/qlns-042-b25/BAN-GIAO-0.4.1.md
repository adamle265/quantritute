# Bàn giao cho hội thoại mới – bản 0.4.1 Module Lương
> Viết 09/11/2026 13:20, khi đóng hội thoại làm bản 0.3.1 (Chấm công) và các bổ sung 08–09/11.
> Cập nhật 09/11/2026 13:55: chốt bài fanpage riêng cho bổ sung 09/11 (bản copy: https://claude.ai/artifact/LERThvZqSPwAwod897mVm8), đổi "không trọn thời gian" → "bán thời gian". Hội thoại 0.3.1 đóng tại đây.
> Hội thoại mới đọc theo thứ tự: file này → `README.md` (bảng nhật ký, các dòng 08/11–09/11) → `BAN-GIAO-0.3.1.md` mục 2 (quy ước xuất bản, ảnh chia sẻ, migration – vẫn giữ nguyên) → `series/00_HO-SO-SERIES.md` → `../../../00_TIẾN ĐỘ CHUNG - Các hội thoại.md`.

## 1. Hiện trạng (09/11 13:20)
| Hạng mục | Trạng thái |
|---|---|
| Bản 0.3.1 Chấm công | Anh duyệt 08/11 14:20, đã xuất bản `/quan-ly-nhan-su/031/`. Nguồn chốt `nguon/_ban-0.3.1/` |
| Bổ sung 09/11 | **Không tách bản 0.3.2** (anh chốt 11:34): đã chép thẳng vào `_ban-0.3.1` và xuất lại /031. **Đổi 13:18: KHÔNG đưa vào thông báo 0.4.1** – anh đăng bài fanpage riêng cho các cập nhật này trên 0.3.1 (`04_Nội dung - Marketing/Series phần mềm nhân sự/bai-cap-nhat-0.3.1-bo-sung.md` + 8 ảnh `anh-031b-cap-nhat-09-11/`). Danh sách lưu ở `nguon/phien-ban-du-kien.json` → `cap_nhat_031_09_11` |
| `nguon/src` | **Giống hệt `_ban-0.3.1`** (code + `mau.b64`). Bắt đầu Module Lương: làm ở `src`, KHÔNG sửa `_ban-0.3.1` nữa |
| `build.js` | VER `0.3.1` – đổi sang `0.4.1` khi bắt đầu |
| Bản chạy thử chấm công | `cham-cong-thu/` (chamcong-thu.quantritute.com). `DEMO_SEED` 2026-11-09a, có ảnh chia sẻ `/og-ql.jpg`, `/og-nv.jpg`. `/phan-mem` phục vụ bản build mới nhất của `src` (build.js tự chép) |
| Dữ liệu mẫu | 2 công ty: Đốm Sáng Edu (11 hồ sơ, gồm DS010 bán thời gian, DS011 cộng tác viên – vào 02/11) + Đốm Sáng Health (7 hồ sơ). Bảng lương mẫu T08–T10 (T10 đã hoàn thành). `SAMPLE_V` 2026-11-09a |
| Bài fanpage 0.3.1 | Đã duyệt; 14 ảnh bản cuối ở `04_Nội dung - Marketing/Series phần mềm nhân sự/anh-031-final/`, 4 bình luận riêng |
| Email báo cập nhật | Admin cho sửa Tiêu đề + Nội dung (nút `[Tên nút](link)`); nội dung gộp 0.1.1→0.3.1 ở `Series phần mềm nhân sự/email-cap-nhat-0.3.1.md`. Anh tự gửi |
| Đếm lượt | `site/public/qtt-track.js`: `/quan-ly-nhan-su` = truy cập, `/quan-ly-nhan-su/<bản>/` = dùng |

**Lệnh anh có thể còn phải chạy** (nếu chưa chạy sau 13:15 ngày 09/11):
- Đứng ở `quantritute\cong-cu\quan-ly-nhan-su`: `.\xuat-ban-web.cmd`
- Đứng ở `quantritute\cong-cu\quan-ly-nhan-su\cham-cong-thu`: `.\trien-khai.cmd` (nạp lại dữ liệu mẫu máy chủ thử – xóa lượt chấm thử cũ)
- Đứng ở `quantritute`: `.\trien-khai-quan-tri.cmd` (email báo cập nhật sửa được nội dung, nút đúng link)
- PowerShell phải gõ `.\` trước tên file `.cmd`. Khi đưa lệnh cho anh: ghi rõ thư mục đứng + mỗi lệnh 1 khối riêng để bấm sao chép.

## 2. Việc tiếp theo – bản 0.4.1 Module Lương
Phạm vi dự kiến (`nguon/phien-ban-du-kien.json`): (1) **Thiết lập công thức lương** – đơn vị tự chọn khoản thu nhập, phụ cấp, khấu trừ; mức đóng BH, giảm trừ gia cảnh, biểu thuế là cài đặt sửa được; xem trước trên vài người. (2) **Bảng lương** – tự lấy ngày công, tăng ca từ bảng công đã chốt, lương theo HĐ + quyết định lương; đối chiếu bảng lương đang dùng; chốt, xuất Excel. (3) **Phiếu lương** – từ bảng lương đã chốt, gửi lên trang nhân viên trên điện thoại, nhân viên hỏi lại 1 dòng.
**Phải nhớ khi làm Lương:**
- Cách tính lương, BH, thuế cần **kế toán trưởng (vợ anh) duyệt nghiệp vụ** trước khi đưa ra dùng.
- Đầu vào mới từ 09/11: **Loại lao động** (`ldOf(e)`: Toàn thời gian / Bán thời gian / Cộng tác viên). Bán thời gian, CTV: bảng công có `p.sum.hours` (đã làm tròn theo `rule.hrRound` 15 phút, `hrRoundMode` xuống) – lương theo giờ. CTV: hợp đồng dịch vụ, không BHXH; khấu trừ 10% TNCN khi chi từ 5 triệu/lần (Nghị định 253/2026 – mới tra báo, chưa xem văn bản gốc). Bán thời gian: BHXH bắt buộc nếu HĐ ≥ 1 tháng và lương ≥ mức tham chiếu (`cfg.refWage`, mặc định 2.530.000 – chưa có số hiệu văn bản).
- Đi muộn: `p.sum.late`, `p.sum.lateMin` (đã trừ phần sửa tay; ô sửa tay giữ `lateAuto`).
- Cảnh báo `luong_cc` hiện coi người có công mà không có trên bảng lương là lỗi – khi làm Lương cần xử lý CTV/bán thời gian cho đúng.
- Bản chạy thử đã có chỗ cho phiếu lương ở trang nhân viên (`bl` trong `demo-data.js`).

## 3. Bổ sung đã làm 08–09/11 (đã có bài fanpage riêng – thông báo 0.4.1 KHÔNG nhắc lại)
Đã có trong `cap_nhat_031_09_11`: Loại lao động · loại HĐ + 2 mẫu gốc (bán thời gian, CTV) · chấm công theo giờ · cảnh báo BHXH bán thời gian / CTV có dấu hiệu HĐLĐ / loại HĐ không khớp · báo sai ngày công ở Việc cần xử lý, Bảng điều hành, Tổng hợp công · điền hồ sơ từ ảnh CCCD (mã QR, jsQR) · 2 màu Hồng đậm, Hồng nhạt + sửa popup Tài khoản nhân viên.
**Thêm 13:20 (3 ý cuối trong danh sách):** làm tròn giờ bán thời gian/CTV (Quy định tính công) · số phút đi muộn trong ô + cột Đi muộn trên Bảng công · tab báo cáo **Đi muộn** (đổi "Cách xem" → "Báo cáo") · sửa tay phút đi muộn (số cũ gạch, lịch sử sửa ngay trong ô).
**Đổi chữ 13:40:** "không trọn thời gian" → **"bán thời gian"** trên toàn phần mềm (loại HĐ, mẫu gốc, Excel mẫu, máy chủ thử). Dữ liệu cũ trong trình duyệt tự đổi theo (`TPL_NEW_V = 3` ở `nhansu.js`); `rules.js` vẫn nhận chữ cũ để tương thích. `SAMPLE_V` / `DEMO_SEED` = `2026-11-09b`.

## 4. Việc còn treo / cần anh
- **Chấm công nhiều điểm (anh chốt 09/11 17:08: có làm, làm SAU Lương):** IP tự học qua lượt quét QR hợp lệ (bỏ qua lượt đi 4G) · đặt tên chi nhánh cho IP · cảnh báo khi thêm IP bằng 4G · (chờ chốt) giới hạn NV theo chi nhánh, chấm theo định vị cho người làm ngoài (dữ liệu vị trí là dữ liệu nhạy cảm – NĐ 356/2025).
- Ảnh CCCD thật: anh chưa thử nút "Điền từ ảnh CCCD" bằng thẻ thật (mới thử ảnh tự dựng; thẻ Căn cước mẫu 2024 chưa chắc cùng định dạng QR).
- Mã màu chuẩn HaDu cho 2 màu hồng (đang dùng mã tạm).
- 2 mẫu HĐ mới (bán thời gian, CTV) nên nhờ kế toán trưởng / pháp chế rà.
- Bản chính thức (GĐ3) còn thiếu: tạo công ty trống + tải bộ 9 file Excel mẫu trống; **sao lưu / khôi phục toàn bộ dữ liệu trình duyệt**; dùng nhiều máy; hướng dẫn + chính sách dữ liệu (Luật 91/2025). Xóa hẳn hồ sơ nhân sự đã có trong Excel: chưa có (chỉ "Cho nghỉ việc").

## 5. Quy ước giữ nguyên
- Sửa `nguon/src/*` → `cd nguon` → `node build.js` (tự chép `app/index.html` + `cham-cong-thu/src/phan-mem.html`). Sinh lại dữ liệu mẫu: xem `du-lieu-mau/README-KHO-DU-LIEU-MAU.md` (thêm bước `python them-ctv-ban-thoi-gian.py` sau các bộ sinh khác).
- Kiểm tra cảnh báo nhanh: `REF=2026-11-09 node _kiem-tra-mau.js`.
- Lệnh Cloudflare do anh chạy. Không chép đè `wrangler.jsonc`. Mỗi thay đổi ghi 1 dòng bảng nhật ký `README.md`; sao lưu bản cũ vào `quantritute/_tam/...` trước khi sửa.
- Văn phong: tiếng Việt, ngắn gọn, bảng/gạch đầu dòng, cuối có Hành động gợi ý; không bịa – thông tin chưa kiểm chứng phải ghi rõ.


## 6. Kết quả hội thoại 0.4.1 (09/11/2026 16:40)
- Đã làm đủ B1–B4 ở `nguon/src` (`luong.js`, `bangluong.js`, `phieuluong.js`; `build.js` VER 0.4.1), máy chủ chấm công 0.4.1 (`cham-cong-thu/src/worker.js`, `app.html`). CHƯA chép `_ban-0.4.1`, CHƯA xuất bản web.
- Căn cứ: `CAN-CU-PHAP-LY-LUONG.md` (+ văn bản gốc ở `Văn bản pháp lý/`, bản chữ ở `nguon/can-cu-luong/`).
- Thuyết minh cho kế toán trưởng (7 điểm cần xác nhận): https://claude.ai/artifact/2k2DXpQCytQ8jezPcKxnAQ
- Việc tiếp: anh xem 1 lượt → sửa theo góp ý + ý kiến chị → chép `_ban-0.4.1`, thêm mục 0.4.1 vào `phien-ban.json`, xuất bản `/041`, bài fanpage, ảnh chia sẻ, `DEMO_SEED` máy chủ thử (phiếu lương mẫu trên trang nhân viên hiện vẫn là dạng cũ `bl` khi chưa kết nối).
- Chưa làm (để sau): đưa bảng lương đã chốt vào Bảng điều hành (quỹ lương) và cảnh báo `luong_cc`; câu hỏi phiếu lương vào Việc cần xử lý; file chuyển khoản ngân hàng; gửi phiếu qua email.
