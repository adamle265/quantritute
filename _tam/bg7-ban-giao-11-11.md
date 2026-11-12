

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
