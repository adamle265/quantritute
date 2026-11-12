# Bàn giao cho hội thoại mới – bản 0.4.1 Module Lương
> **Cập nhật 11/11/2026 18:50: đọc mục 7 trước** (chốt Module Lương bổ sung + App nhân viên; lệnh còn phải chạy; nội dung, ảnh cho bài viết).
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


## 7. Chốt 11/11/2026 18:50 – Module Lương bổ sung + App nhân viên (anh chốt tạm dừng ở đây)
> Hội thoại này đóng. Anh tiếp tục xuất bản, soạn bài, thiết kế ảnh ở hội thoại đang làm module Tuyển dụng. Đọc mục này + bảng nhật ký `README.md` (các dòng 11/11) + `cham-cong-thu/HUONG-DAN-TEST.md` (mục 0.4.2).

### 7.1 Hiện trạng
| Hạng mục | Trạng thái 11/11 18:50 |
|---|---|
| Phần mềm (bản web 0.4.1) | Mọi sửa đổi 11/11 đã chép thẳng vào `nguon/src` **và** `nguon/_ban-0.4.1` (không tách bản mới – anh chốt). Đã `node build.js` trên máy anh. **Chưa chạy `xuat-ban-web.cmd` cho các sửa đổi từ 16:12** |
| Máy chủ chấm công thử | `cham-cong-thu/src/worker.js`, `app.html`, `demo-data.js` mới nhất; `DEMO_SEED` = `2026-11-11d`; database lên schema 4 (tự thêm cột, bảng khi chạy). **Anh cần chạy `trien-khai.cmd` 1 lần** để đưa lên các sửa đổi từ 18:12 |
| Dữ liệu mẫu bản thử | `tao-du-lieu-thu.cjs` sinh `demo-data.js`: hồ sơ cho cả 23 người, phiếu lương T08–T10 (từ bảng lương mẫu), công T10–T11 Xưởng Đóng gói (đúng cách xếp lịch của phần mềm), lễ tết tính bằng chính thuật toán âm lịch của phần mềm, mỗi ngày tạo lại 1 đơn chờ duyệt cho mỗi quản lý |
| Bản lưu trước mỗi lần sửa | `quantritute/_tam/qlns-042-b1/` … `qlns-042-b25/` |
| Ảnh nguồn cho bài viết | `04_Nội dung - Marketing/Series phần mềm nhân sự/_nguon-anh-041b-11-11/` (21 ảnh trang nhân viên + 4 ảnh phần mềm, xem 7.5) |

**Lệnh anh cần chạy** (mỗi lệnh 1 lần, theo thứ tự):
1. Đứng ở `quantritute\cong-cu\quan-ly-nhan-su`: `.\xuat-ban-web.cmd`
2. Đứng ở `quantritute\cong-cu\quan-ly-nhan-su\cham-cong-thu`: `.\trien-khai.cmd`

Kiểm tra: https://quantritute.com/quan-ly-nhan-su/041 · https://chamcong-thu.quantritute.com (đăng nhập DS002, PIN 123456).

### 7.2 Các cập nhật trong ngày 11/11 (gộp theo nhóm, chi tiết kỹ thuật ở README)
**A. Phần mềm – Chấm công & Lương (sáng–trưa)**
1. **Tách Khối văn phòng / Khối sản xuất, vận hành**: Thiết lập chấm công thành 3 module con (Thiết lập chung · Khối văn phòng · Khối sản xuất, vận hành); Phân khối phòng ban; Tổng hợp công mỗi công ty 1 tab, mỗi khối 1 bảng.
2. **Lương theo giờ làm thực tế** cho khối sản xuất: đơn giá giờ = (lương cơ bản + trợ cấp cố định) ÷ giờ công chuẩn; làm đêm 22:00–06:00 +30%; tăng ca đêm; phụ cấp theo số ca; bảng lương thêm cột Giờ làm thực tế, Đơn giá giờ, Giờ làm đêm. Sửa lỗi: giờ ngoài ca chưa vượt chuẩn trước đây không được trả.
3. **Thiết lập ca + Xếp ca làm**: danh mục ca (F, Đ, S, C, T…, màu, % đơn giá); kỳ xếp ca ngày/tuần/tháng; Quản lý xếp hoặc Nhân viên đăng ký; 1 ngày làm nhiều ca (S+T), báo đỏ ca trùng giờ; khóa lịch, thông báo lịch tới app nhân viên.
4. **Xếp ca như bảng tính**: chọn vùng nhiều ô, Ctrl+C / Ctrl+V (dán được từ Excel), Delete, Ctrl+Z; gợi ý "Xếp tương tự cho cả tuần/tháng", "Xếp tương tự cho nhân sự phía dưới".
5. **Quy định tính công khối sản xuất** theo từng bộ phận (giờ tiêu chuẩn theo ngày nghỉ hoặc cố định), cảnh báo làm thêm vượt __ giờ/tháng, đi muộn quá mức thì không tính giờ ca; ngoại lệ chỉ còn Không cần chấm công / Không tính tăng ca.
6. **Ký hiệu công dùng chung 2 khối**; Bảng lương, Cơ cấu nhân sự, Danh sách nhân sự có cột/bộ lọc Khối; Kho hợp đồng mẫu tách HĐLĐ khối văn phòng / khối sản xuất.
7. Dữ liệu mẫu: Xưởng Đóng gói 6 người làm 3 ca, 2 tổ đổi ca ngày ↔ đêm theo tuần.

**B. App nhân viên trên điện thoại (chiều – tối, 6 vòng góp ý)**
1. Giao diện mới: lời chào theo buổi trên nền cảnh đồi xanh, mặt trời / trăng đổi theo giờ, đồng hồ lớn, ca hôm nay; 5 mục dưới đáy **Home · Lịch · Công · Đơn · Lương**; trên máy tính hiện trong khung điện thoại.
2. **Home**: chấm vào/ra ca, quét mã QR bằng camera ngay trong app, Việc cần làm (đơn chờ duyệt, xác nhận công, đăng ký lịch, phiếu lương mới), 4 chỉ số tháng (giờ công, phép còn, tăng ca, lương tạm tính – ẩn số, bấm mới hiện), ngày lễ sắp tới.
3. **Lịch**: khối văn phòng xem lịch tháng (ngày làm, ngày nghỉ, lễ tết, ngày nghỉ có đơn, hôm nay nổi bật), bấm ngày xem thông tin ngày lễ hoặc đơn đã gửi; khối sản xuất xem lịch ca đã chốt + đăng ký ca.
4. **Công**: bảng công dạng lịch tháng theo ký hiệu (màu theo loại, có chú giải), 3 tháng gần nhất + tháng cũ hơn; bấm ngày xem giờ vào/ra, đi muộn, về sớm, giờ công, tăng ca; **Báo sai ngày này** → phần mềm tô góc đỏ ô công ngày đó ở Tổng hợp công, có danh sách để kế toán xử lý.
5. **Đơn**: người duyệt tự là **quản lý trực tiếp** (theo sơ đồ tổ chức, không sửa); chọn **người phụ trách thay** khi vắng; quản lý **duyệt / từ chối ngay trên app**, phần mềm nhận kết quả khi đồng bộ; ô ngày nhập **dd/mm/yyyy**.
6. **Lương**: thực lĩnh tháng gần nhất + chênh lệch tháng trước, **Biến động cả năm** (biểu đồ 12 tháng, tổng, bình quân, cao/thấp nhất), danh sách phiếu các tháng – bấm mở phiếu chi tiết, hỏi lại từng dòng.
7. **Bạn**: ảnh đại diện (tự tải lên), tình trạng, thâm niên, quản lý trực tiếp; **Sơ đồ tổ chức** (bộ phận của mình + sơ đồ cây cả công ty, cấp dưới lùi vào trong); **Hồ sơ cá nhân** (số giấy tờ chỉ hiện 4 số cuối, giấy tờ đã nộp, nút Xem / Tải bản scan); **Hợp đồng** (xem nội dung hợp đồng, bản scan đã ký); **Hành trình làm việc** (vào làm, ký hợp đồng, điều chỉnh lương, khen thưởng – bấm mốc xem văn bản); đổi mã PIN; đăng xuất.
8. Phần mềm gửi kèm khi bấm Đồng bộ: hồ sơ, quản lý trực tiếp, lương cơ bản + phụ cấp (để ước tính lương tạm), quỹ phép, tuần làm việc / ca, lễ tết, ký hiệu công, giờ vào/ra từng ngày, file scan trong kho (tối đa 8 file ≤ 1,2 MB mỗi lần).

### 7.3 Phải nhớ / chưa kiểm chứng
- **Ngày Văn hóa Việt Nam 24/11** đang được thiết lập mẫu tích là ngày nghỉ hưởng lương – **chưa đối chiếu văn bản gốc**; trước khi nói trong bài viết cần kiểm tra lại.
- **Quét mã QR bằng camera** chưa thử trên điện thoại thật (máy kiểm thử không có camera). iPhone tải thêm thư viện đọc mã jsQR từ jsDelivr ở lần quét đầu.
- **Gửi file kho bản chính thức** (hồ sơ, hợp đồng scan) mới kiểm cú pháp, chưa chạy với tài khoản thật. Bản thử dùng ảnh scan **mẫu tự vẽ** ghi rõ "hư cấu", không đưa file thật lên máy chủ dùng chung.
- Bản thử: đổi mã PIN bị khóa (PIN chung 123456); ảnh đại diện chỉ lưu trên máy đang dùng; báo sai ngày giữ 3 ngày.
- Lương tạm tính trên app là **ước tính** (chưa gồm tăng ca, phụ cấp khác, chưa trừ bảo hiểm, thuế) – nói rõ khi giới thiệu.
- Xưởng Đóng gói chưa có bảng lương T10 trong dữ liệu mẫu phần mềm → app hiện "Chưa có phiếu lương"; muốn có thì vào Phiếu lương → Gửi lên điện thoại.
- Các cách tính lương theo giờ, làm đêm, tăng ca đêm: vẫn cần **kế toán trưởng duyệt nghiệp vụ** như quy ước Module Lương.

### 7.4 Nội dung gợi ý để anh soạn (anh soạn và đăng ở hội thoại Tuyển dụng)
**a) Bài fanpage – Hành trình ngày 6 (11/11/2026)**
- Góc kể: *"Ngày 6: phần mềm nhân sự xuống tận điện thoại của từng người"* – hôm nay làm cho 2 nhóm người dùng thật: **xưởng làm theo ca** (lương theo giờ thực tế, xếp ca như Excel) và **mọi nhân viên** (app trên điện thoại: chấm công, xem công, gửi đơn, xem lương, xem hồ sơ).
- 3–4 ý chính, mỗi ý gắn 1 "nỗi đau":
  1. Xưởng làm ca: trước phải tự cộng giờ, giờ đêm bằng tay → giờ xếp ca xong, bảng lương tự ra giờ làm thực tế, phụ trội đêm.
  2. Nhân viên hỏi đi hỏi lại "tháng này mình bao nhiêu công, còn mấy ngày phép" → mở app là thấy, sai ngày nào bấm "Báo sai" ngay ngày đó.
  3. Đơn nghỉ đi vòng qua kế toán → giờ gửi thẳng quản lý trực tiếp, chọn người làm thay, quản lý duyệt trên điện thoại.
  4. Hồ sơ, hợp đồng của mình nằm trong ngăn kéo phòng nhân sự → giờ nhân viên tự xem, tải bản scan, xem hành trình làm việc.
- Giới hạn nói thẳng: lương tạm tính chỉ là ước tính; bản thử dùng dữ liệu mẫu hư cấu, mã PIN chung; quét QR bằng camera mới có ở bản này, góp ý giúp mình nếu máy không mở được.
- Số liệu: chỉ dùng số đã có căn cứ (ví dụ lượt dùng thử – lấy số anh đã nói trong video v25 hoặc số đếm thật trên admin tại thời điểm đăng, ghi mốc ngày).
- Kêu gọi: thử bằng tài khoản mẫu (DS002 – kế toán trưởng có đơn chờ duyệt, SG012 – công nhân làm ca), PIN 123456; link ở bình luận đầu.
- Bộ ảnh gợi ý (8 ảnh, khổ dọc): bìa "Ngày 6" + 01 khung điện thoại · 02 Home · 06 Công dạng lịch · 08 Báo sai ngày · 09 Đơn chờ duyệt · 12 Biến động lương cả năm · 16 Sơ đồ cây · ảnh phần mềm Xếp ca làm (hr-xepca).

**b) Lịch sử cập nhật trên trang công cụ (`nguon/phien-ban.json`, bản 0.4.1, mục `nang_cap`) – đề xuất thêm các dòng (đã viết gọn để dán):**
1. "Chấm công tách Khối văn phòng và Khối sản xuất, vận hành: thiết lập, quy định tính công, tổng hợp công riêng từng khối; phân khối phòng ban ở Thiết lập chung"
2. "Khối sản xuất: thiết lập ca, xếp ca làm theo ngày/tuần/tháng (quản lý xếp hoặc nhân viên đăng ký), 1 ngày nhiều ca, báo ca trùng giờ, khóa và thông báo lịch tới điện thoại nhân viên; thao tác như bảng tính (chọn vùng, sao chép, dán từ Excel, hoàn tác) và gợi ý xếp nhanh"
3. "Lương theo giờ làm thực tế cho người làm ca: đơn giá giờ, phụ trội làm đêm, tăng ca đêm, phụ cấp theo số ca; bảng lương thêm cột giờ làm thực tế, đơn giá giờ, giờ làm đêm"
4. "Ký hiệu công dùng chung 2 khối; cột và bộ lọc Khối ở Danh sách nhân sự, Cơ cấu nhân sự, Bảng lương; mẫu HĐLĐ riêng khối văn phòng / khối sản xuất"
5. "Trang nhân viên trên điện thoại làm mới: Home (chấm công, quét mã QR bằng camera, việc cần làm, chỉ số tháng), Lịch, Công dạng lịch tháng – báo sai từng ngày, Đơn – gửi quản lý trực tiếp duyệt ngay trên điện thoại, chọn người phụ trách thay, Lương – biến động cả năm và phiếu từng tháng"
6. "Mục Bạn trên điện thoại: ảnh đại diện, sơ đồ tổ chức, hồ sơ cá nhân, hợp đồng, hành trình làm việc, xem và tải bản scan; phần mềm gửi kèm khi Đồng bộ"
7. "Tổng hợp công hiện ô công nhân viên báo sai (góc đỏ) và danh sách để xử lý"
8. "Dữ liệu mẫu: Xưởng Đóng gói làm 3 ca, hồ sơ – phiếu lương – đơn chờ duyệt cho mọi nhân sự trên bản thử điện thoại"

**c) Trang Hành trình tổng thể – mốc 11/11/2026 (gợi ý 1 đoạn):**
"Ngày 6 – Phần mềm quản lý nhân sự có app cho nhân viên. Bổ sung khối sản xuất làm ca (xếp ca như bảng tính, lương theo giờ thực tế, phụ trội làm đêm) và làm mới trang nhân viên trên điện thoại: chấm công, xem công theo lịch, gửi đơn cho quản lý trực tiếp duyệt, xem lương cả năm, hồ sơ – hợp đồng – hành trình của chính mình."

**d) Trang Quản trị – nội dung cập nhật / email báo cập nhật:**
- Tiêu đề gợi ý: "Phần mềm nhân sự 0.4.1: thêm khối sản xuất làm ca và app nhân viên trên điện thoại".
- Nội dung: 3 gạch đầu dòng = mục b) 2, 3, 5 rút gọn + nút `[Dùng thử bản 0.4.1](https://quantritute.com/quan-ly-nhan-su/041)` và `[Thử trang nhân viên](https://chamcong-thu.quantritute.com)`.
- Nếu admin có ghi chú phiên bản công cụ: ghi "0.4.1 – cập nhật 11/11/2026", trỏ về `phien-ban.json`.

### 7.5 Ảnh nguồn (`04_Nội dung - Marketing/Series phần mềm nhân sự/_nguon-anh-041b-11-11/`)
Chụp từ bản chạy thử trên máy em, dữ liệu mẫu hư cấu, khổ 390×844 @2x (trang nhân viên) và 1500×950 @2x (phần mềm). Anh dùng làm nguồn để thiết kế ảnh theo màu thương hiệu.
| File | Nội dung |
|---|---|
| 01-khung-dien-thoai-may-tinh | Trang nhân viên trên máy tính (khung điện thoại) |
| 02-home | Home: lời chào, chấm công, việc cần làm |
| 03-huong-dan-thu | Bảng hướng dẫn thử 4 bước (nút ? vàng) |
| 04-lich-thang · 05-lich-bam-ngay-nghi | Lịch tháng khối văn phòng; bấm ngày nghỉ xem đơn |
| 06-cong-lich-thang · 07-cong-chi-tiet-ngay · 08-cong-bao-sai-ngay | Bảng công dạng lịch; chi tiết 1 ngày; báo sai ngày |
| 09-don-can-duyet · 10-tao-don-ngay-dd-mm-yyyy | Đơn chờ quản lý duyệt; bảng tạo đơn |
| 11-luong · 12-luong-ca-nam · 13-phieu-luong | Lương: danh sách phiếu, biến động cả năm, phiếu chi tiết |
| 14-ban · 15-ban-org · 16-so-do-cay | Mục Bạn; bộ phận của mình; sơ đồ cây công ty |
| 17-ban-hd · 18-ban-ht · 19-ban-hs | Hợp đồng; hành trình làm việc; hồ sơ + bản scan |
| 20-sx-lich-tuan-dang-ky · 21-sx-cong-theo-ca | Công nhân làm ca: lịch tuần + đăng ký; công theo ca |
| hr-xepca · hr-tlsx · hr-cc-sx · hr-bao-sai | Phần mềm: Xếp ca làm; Thiết lập ca; Tổng hợp công khối sản xuất; ô báo sai góc đỏ |
