# Bộ xử lý hóa đơn điện tử – Tổng hợp để làm video

Cập nhật: 19/10/2026 · Bản công cụ: **1.5.4** (đưa lên web 18/10/2026)
Dùng cho hội thoại làm video. Mọi tính năng ghi ở đây đều đã có thật trong công cụ. Những gì **chưa kiểm chứng** có ghi riêng ở mục 7: video không được khẳng định các điểm đó.

---

## 1. Thông tin nhanh

| Mục | Nội dung |
|---|---|
| Tên trên web | **Bộ công cụ hóa đơn thuế** (anh tự đặt trong Quản trị). Tiêu đề bên trong công cụ: "Bộ xử lý hóa đơn điện tử" |
| Link dùng | https://quantritute.com/tools/xu-ly-hoa-don/ · trang giới thiệu: https://quantritute.com/cong-cu/hoa-don-thue |
| Nhóm | Kế toán – Tài chính (bìa sách màu xanh dương), **Nổi bật**, Active, **miễn phí**, không cần đăng ký |
| Dành cho | Kế toán, kế toán trưởng, kế toán dịch vụ, chủ doanh nghiệp nhỏ và hộ kinh doanh tự làm sổ sách |
| Nỗi đau (câu trên bìa) | Đang phải: *tải từng hóa đơn trên cổng thuế rồi gõ lại vào Excel, tờ khai và MISA* |
| Cam kết | **Hóa đơn không rời máy của anh/chị.** Xử lý ngay trên trình duyệt, không gửi dữ liệu ra ngoài. Công cụ không hỏi và không lưu mật khẩu thuế |
| Thư mục | `Dự án 5.0/quantritute/cong-cu/xu-ly-hoa-don/` (app, nguon, README.md, video/ke-hoach-video.md) |
| Ảnh giao diện trên web | `quantritute/site/public/assets/tools/hoa-don-thue.jpg` |

## 2. Câu chuyện ra đời (chất liệu kể chuyện)
- Kế toán làm thuế mỗi tháng/quý phải vào hoadondientu.gdt.gov.vn. Cổng chỉ cho **tải từng hóa đơn một**. Sau đó lại gõ số liệu sang Excel, tờ khai GTGT, phần mềm kế toán MISA.
- Có phần mềm trả phí làm được việc tải hàng loạt (vợ anh, một kế toán trưởng, đang dùng). Anh muốn làm bản **miễn phí**, chạy ngay trên trình duyệt và không đưa hóa đơn lên máy chủ của ai.
- Làm theo kiểu "nghĩ cùng người dùng thật": vợ anh (KTT) test bằng dữ liệu quý 3/2026 của một doanh nghiệp thật. Mỗi lần chị phát hiện chỗ sai, công cụ được sửa ngay (xem mục 5).
- Toàn bộ được xây trong khoảng 2 ngày 17–18/10/2026, qua nhiều vòng góp ý. Có vòng anh gửi 27 góp ý một lúc.

## 3. Luồng dùng tổng thể: 1 nút → 1 file ZIP → 4 việc
1. **Cài 1 lần:** kéo nút xanh dương "Tải HĐ hàng loạt" lên thanh dấu trang của Chrome.
2. Đăng nhập cổng thuế như thường ngày → bấm nút trên thanh dấu trang. Bảng điều khiển hiện ngay giữa trang thuế.
3. Chọn bán ra / mua vào, khoảng ngày → **Tìm** → **Tải**. Nhận **1 file ZIP** gồm XML, bản gốc và bảng kê Excel.
4. Kéo file ZIP vào công cụ, rồi dùng tiếp cho 4 việc: **bảng kê Excel**, **in bản gốc**, **tờ khai 01/GTGT**, **file nhập MISA**.

## 4. Tính năng chi tiết (5 thẻ)

### Thẻ 1 – Tải hàng loạt (nút bookmark chạy trên trang thuế)
- Dùng luôn phiên đăng nhập sẵn có trên trình duyệt. Nút không hết hạn, không cần đăng ký. Không kéo được thì có cách tạo nút bằng tay (nút "Sao chép mã nút").
- Bảng điều khiển ra giữa màn hình, có nút ⤢ để mở rộng.
- Lọc được:
  - bán ra / mua vào;
  - hóa đơn điện tử và hóa đơn có mã từ máy tính tiền;
  - trạng thái hóa đơn, kết quả kiểm tra;
  - mục "Lọc thêm (không bắt buộc)".
- **Ô ngày dd / mm / yyyy thông minh:**
  - gõ liền 8 số là tự nhảy ô, tự sang ô "Đến ngày";
  - gõ "5" ở ô ngày thì tự thành 05;
  - bấm vào ô nào thì bôi đen ô đó để gõ đè;
  - dán "01/07/2026" thì tự tách.
- **Tự chia theo tháng:** cổng thuế chỉ cho tra tối đa 1 tháng mỗi lần, công cụ tự chia nên người dùng chọn cả quý cũng được.
- **Quét nhiều lượt để không sót hóa đơn:** 1 tháng quét 2 lượt, cứ thêm 1 tháng thì thêm 1 lượt (1 quý = 4 lượt). Mỗi lượt chia khoảng ngày và sắp xếp theo cách khác, rồi gộp kết quả và bỏ trùng. Có nút **"Quét lại 1 lượt"** (gộp với lần trước), nhắc bấm khi khoảng ngày dài hơn 1 tháng hoặc khi lượt cuối vẫn tìm thêm hóa đơn.
- **Đốm cầm kính lúp** chuyển động nhẹ khi quét, kèm thanh tiến độ % **chỉ tăng, không bao giờ tụt** và dòng "Hệ thống tự động quét N lần (N tháng)…".
- **Xử lý giờ UTC của cổng thuế:**
  - cổng lưu ngày lập theo giờ quốc tế, công cụ đổi về giờ Việt Nam;
  - tra thêm 1 ngày liền trước ngày bắt đầu để bắt hóa đơn lập trước 7h sáng ngày đầu kỳ.
- **Tải bền bỉ:**
  - nghỉ giữa các lần tải;
  - lỗi mạng thì tự thử lại;
  - bị cổng tạm chặn thì tự chờ;
  - hết phiên đăng nhập thì tạm dừng, cho đăng nhập lại rồi "Tiếp tục tải" hoặc "Lưu phần đã tải".
- **File ZIP:**
  - XML đặt tên dễ tìm (ngày_ký hiệu_số_tên đối tác);
  - bản gốc của cổng thuế;
  - Bang-ke-hoa-don.xlsx;
  - danh sách hóa đơn chưa tải được;
  - danh sách hóa đơn cổng thuế **không lưu XML gốc** (điện lực, ngân hàng, viễn thông…). Các hóa đơn này vẫn vào bảng kê bằng số tổng.
- Người hỗ trợ lấy nhật ký kỹ thuật bằng phím ẩn Ctrl+Alt+L. Nhật ký không lộ phiên đăng nhập.

### Thẻ 2 – XML → Excel
- Nhận nhiều file một lúc: ZIP tải từ thẻ 1, XML lẻ, hoặc gói ZIP tải tay từ trang thuế. Hóa đơn trùng tự bỏ.
- Có danh sách file dùng chung cho thẻ 2, 4, 5: gỡ từng file (×), "+ Thêm file", "Gỡ tất cả".
- Hiện thẻ số liệu tổng: số hóa đơn, dòng hàng, tiền chưa thuế, tiền thuế, tổng thanh toán.
- **"Cần xem lại trước khi dùng số liệu":**
  - hóa đơn trùng, bị thay thế, bị hủy (vẫn liệt kê nhưng không cộng vào tổng);
  - lệch tổng, ngoại tệ;
  - không có XML gốc.
- **"Tải lên file XML bổ sung":** XML người bán gửi qua email thay thế đúng hóa đơn "không có XML gốc", cảnh báo tự mất.
- Excel nhiều sheet, cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc:
  - **Bảng kê** (có cả mua vào và bán ra thì tách 2 sheet);
  - **Chi tiết hàng hóa**;
  - **Tổng hợp thuế suất**;
  - **Gộp một bảng**;
  - **Tra cứu mẫu người bán**.
- **Tra cứu mẫu người bán**, để xem hóa đơn đúng mẫu người bán gửi khách:
  - mã tra cứu đọc từ XML, bấm để sao chép;
  - **MST người bán cũng bấm để sao chép**;
  - nút "Mở trang tra cứu";
  - **chỉ đưa vào những trang đã mở thử được**: MISA, Bkav, Viettel, Thái Sơn, M-Invoice, EasyInvoice, MobiFone, Sapo, Fast. Trang chưa chắc chắn thì hiện "Tìm trang tra cứu" (tìm trên Google theo tên người bán);
  - nút **"+ Thêm trang"** (sửa bằng "✎ Sửa trang"): người dùng tự lưu trang tra cứu cho từng người bán, lần sau tự hiện.

### Thẻ 3 – In bản gốc
- In hóa đơn đúng bản thể hiện của cổng thuế (bản gốc trong file ZIP), giữ nguyên mã QR và chữ ký.

### Thẻ 4 – Tờ khai thuế GTGT 01/GTGT
- Chọn tháng/quý, năm. Chọn mẫu theo **TT 89/2026**, hoặc **TT 80/2021** cho trường hợp HTKK/eTax chưa nâng cấp.
- **Tự tính các chỉ tiêu** từ hóa đơn: [21], [23]–[36], [40a], [40], [41], [43]. Ô tự nhập ([22], [32b], [37]…) được nhớ theo MST và theo kỳ.
- Tách đúng theo thuế suất, **trừ đúng chiết khấu thương mại**, kê hóa đơn 8% (giảm thuế theo NQ 204/2025) kèm **phụ lục giảm thuế**.
- Mua vào: tick "Không đủ điều kiện khấu trừ" để chuyển sang nhóm 4. Hóa đơn bị thay thế/hủy không được kê.
- **Bảng hóa đơn không có XML gốc:**
  - thuế suất gợi ý; bấm vào để **sửa tay** (0%, 5%, 8%, 10%, KCT, KKKNT) rồi bấm ✓;
  - tải XML bổ sung thì lấy thuế suất thật;
  - bấm số hóa đơn để mở trang giải thích cách lấy bản gốc.
- Ô số tự thêm dấu chấm hàng nghìn ngay khi gõ.
- **Xuất Excel**: tờ khai, bảng kê bán ra, bảng kê mua vào, phụ lục giảm thuế.
- **Xuất file XML tờ khai**:
  - theo cấu trúc file mẫu HTKK 5.8.1 anh gửi;
  - lưới thông tin 3×3;
  - nút xanh **"Lấy từ XML tờ khai kỳ trước"**: chỉ điền ô còn trống, và tự lấy [22] = [43] của kỳ trước.

### Thẻ 5 – Tạo file nhập lên Misa (MISA AMIS Kế toán)
- **5 mẫu chứng từ**: Mua hàng trong nước (nhập kho / không qua kho), Mua dịch vụ, Nghiệp vụ khác, Bán hàng, Bán dịch vụ. Tiêu đề cột khớp 100% mẫu nhập khẩu của MISA.
- Mặc định do anh chốt: TK công nợ 331, TK thuế 1331, "Chưa thanh toán". Chiết khấu được phân bổ đúng vào các dòng cùng thuế suất. Cảnh báo hóa đơn thanh toán tiền mặt từ 5 triệu.
- **Nhà cung cấp:**
  - tải lên danh mục NCC xuất từ MISA để đối chiếu MST, tự điền mã và ẩn NCC đã có;
  - cột Địa chỉ, TK công nợ;
  - **xuất Excel danh mục NCC** theo mẫu MISA.
- **Hàng hóa, dịch vụ hiện từng dòng theo từng hóa đơn** (quý 3 thử nghiệm có 218 dòng):
  - mã MISA dùng chung cho cả mặt hàng; Loại và TK riêng từng dòng;
  - lọc theo tên, lọc theo số hóa đơn, **"Lọc theo hàng hóa đang chọn"** (hiện mọi dòng của các món đã tick trên mọi hóa đơn);
  - "Chọn tất cả dòng đang lọc", "Chọn hết hàng hóa cùng hóa đơn", áp dụng Loại/TK hàng loạt;
  - cột **✓ Xác nhận**: chỉ bấm được khi dòng đã đủ mã và TK. Tick "Chỉ hiện dòng còn thiếu dữ liệu" thì dòng đã xác nhận tự ẩn;
  - **gợi ý Nghiệp vụ khác** cho đồ ăn uống, xăng dầu, vé máy bay, phí ngân hàng (ô mã ghi "Không cần sinh mã"). Quý 3 thử nghiệm: 129/149 mặt hàng được gợi ý đúng loại này;
  - chọn TK từ danh sách, tên TK theo TT 133;
  - tải lên danh mục hàng hóa từ MISA để khớp mã; **xuất Excel danh mục hàng hóa**.
- Bấm số hóa đơn để mở hóa đơn ở tab mới.

## 5. Hành trình cải thiện theo góp ý (chất liệu cho video "làm công cụ cùng người dùng thật")

| Bản | Anh / KTT phát hiện hoặc yêu cầu | Đã làm | Giá trị cho người dùng |
|---|---|---|---|
| 1.0.0 (17/10) | Ý tưởng: tải hàng loạt từ cổng thuế | Nghiên cứu, kiểm chứng cách cổng thuế hoạt động trên tài khoản doanh nghiệp thật; giao diện 0.1 anh duyệt; thẻ 1–3 | Tải cả quý bằng 1 nút |
| 1.1.0 | Anh gửi mẫu nhập khẩu MISA | Thẻ 5: 5 mẫu chứng từ, đúng quy tắc anh chốt | Không gõ lại chứng từ vào MISA |
| 1.1.1 | So với công cụ khác: mình ra 49/56, công cụ kia 61 hóa đơn | Phát hiện **cổng thuế trả thiếu hóa đơn không ổn định** (cùng lệnh tra, lần 11 lần 16) → tra bổ sung theo mã kết quả kiểm tra; hóa đơn không có XML gốc vẫn vào bảng kê | Không sót hóa đơn dù cổng trả thiếu |
| 1.2.0 | Cần tờ khai | Thẻ 4: tờ khai 01/GTGT TT 89 (chọn được TT 80), phụ lục giảm thuế NQ 204 | Có số liệu tờ khai từ chính hóa đơn |
| 1.2.1 | KTT test quý 3: lần đầu 57, bấm lại ra 61 | Quét nhiều lượt, đổi cách chia ngày và sắp xếp, đối chiếu tổng số máy chủ báo | Kết quả ổn định ngay lần đầu |
| 1.2.2 | Anh test: 60/61 | Phát hiện **cổng lưu ngày lập theo giờ UTC** → hóa đơn trước 7h sáng ngày đầu kỳ bị lệch → đổi về giờ Việt Nam | Ngày trên bảng kê và tên file đúng |
| 1.2.3 | Lỗi "khoảng tìm kiếm không được lớn hơn 1 tháng"; anh không muốn người dùng đợi lâu | Chỉ tra thêm đúng 1 ngày liền trước kỳ; giảm số lượt; bấm Tìm lại thì gộp kết quả | Nhanh, không lỗi |
| 1.2.4 | Anh test: **đúng 61/61** | Thêm nút "Quét lại" (không bắt buộc) | Yên tâm với kỳ dài |
| 1.3.0 | Phần mềm trả phí có "gợi ý tra cứu" mẫu người bán | Sheet Tra cứu mẫu người bán: mã + trang tra cứu đọc từ XML | Xem hóa đơn đúng mẫu người bán gửi |
| 1.4.0 | **27 góp ý** (A1–8, B1–4, C1–4, D1–5) | Bảng điều khiển ra giữa, ô ngày 3 phần tự nhảy; danh sách file dùng chung, XML bổ sung; ô số tự phân cách, xuất XML tờ khai theo mẫu HTKK; chọn TK từ danh sách, đối chiếu và xuất danh mục NCC/hàng hóa MISA, quy ước Nghiệp vụ khác, xưng "anh/chị" | Dùng mượt như phần mềm chuyên nghiệp |
| 1.4.1 | **KTT phát hiện [23] quý 3 thừa 35.833 đ** | Có hóa đơn ghi bảng thuế suất theo giá trị *trước* chiết khấu → lấy tổng của hóa đơn làm chuẩn, trừ đúng chiết khấu. [23] = 59.784.986 khớp tổng 61 hóa đơn | Tờ khai đúng tới từng đồng |
| 1.5.0 | Góp ý vòng 3 | Đốm kính lúp + thanh tiến độ; tách bảng kê mua/bán; sửa thuế suất tay có ✓; nút xanh lấy XML tờ khai kỳ trước; MISA theo từng dòng hóa đơn + lọc + ✓ | Ít thao tác, ít sai |
| 1.5.1–1.5.2 | Hoàn thiện tra cứu mẫu người bán; anh mở thử thấy vài link lỗi | Tra tài liệu 15 nhà cung cấp; **mở thử từng trang**, chỉ giữ trang mở được; nút "+ Thêm trang" gọn | Link nào hiện ra cũng dùng được |
| 1.5.3 | Thanh tiến độ tụt 80% → 60%; thiếu nút sao chép MST | Thanh tiến độ chỉ tăng; nút sao chép MST; nút kéo bookmark đổi sang xanh dương nổi bật (anh chê bản xanh lá có nét đứt "thô") | Cảm giác "sắp xong" |
| 1.5.4 | Quét 2 lần vẫn thiếu | **Quy ước anh chốt:** 1 tháng 2 lượt, mỗi tháng thêm 1 lượt; lần đầu chạy đủ số lượt, không dừng sớm | Đủ hóa đơn ngay lần đầu |
| + (18/10) | Lọc nhanh khi gán loại/TK MISA | Nút "Lọc theo hàng hóa đang chọn" | Gán cả nhóm món ăn trong 1 lần |
| Lên web 18/10 | "Tạm dùng bản này, đưa lên web" | Gộp các cuốn cũ thành 1 cuốn "Bộ công cụ hóa đơn thuế", Active, Nổi bật; có bộ đếm lượt dùng | Ai cũng dùng được miễn phí |

## 6. Con số có thật dùng được trong video
- Tải thử trên cổng thật: lật 9 trang, **446/446** hóa đơn; 12 lần tải liên tiếp không bị chặn.
- Quý 3/2026 mua vào (doanh nghiệp thử nghiệm): **61/61** hóa đơn = 23 hóa đơn điện tử + 38 hóa đơn máy tính tiền (bằng phần mềm trả phí).
- Trang thuế giả lập 120 hóa đơn, nhiều kịch bản cổng trả thiếu: đủ 120/120 sau khi quét đủ lượt.
- Tờ khai quý 3: [23] = 59.784.986, [24] = 4.182.740, khớp tổng 61 hóa đơn (sau khi KTT phát hiện và sửa chiết khấu).
- Thẻ 5: 218 dòng hàng hóa; 129/149 mặt hàng được gợi ý đúng là Nghiệp vụ khác.
- Tra cứu mẫu người bán: 9 trang tra cứu đã mở thử thành công; 28/37 hóa đơn có mã đã có sẵn trang tra cứu.
- Thời gian làm: khoảng 2 ngày (17–18/10/2026), hơn 15 phiên bản.

## 7. KHÔNG được nói trong video (chưa kiểm chứng)
- ❌ "Nộp thẳng file XML tờ khai lên HTKK/eTax": **chưa thử** HTKK/eTax có nhận file này không. Chỉ nói "lập sẵn số liệu tờ khai, xuất Excel và XML".
- ❌ "Nhập thẳng vào MISA không lỗi": **chưa nhập thử thật**; tiêu đề cột khớp mẫu nhưng định dạng danh mục, thuế suất MISA chấp nhận chưa kiểm.
- ❌ "Mở thẳng hóa đơn bằng 1 cú bấm ở trang tra cứu": chưa nhà cung cấp nào cho mở kèm mã. Thực tế là sao chép mã và MST rồi dán vào trang.
- ❌ "Đảm bảo 100% không sót hóa đơn": nếu cổng thuế thiếu cùng một hóa đơn ở mọi lượt thì không công cụ nào phát hiện được. Nên nói "quét nhiều lượt, nhắc quét lại khi cần".
- ❌ Hóa đơn máy tính tiền **bán ra** chưa kiểm (tài khoản thử chưa có); Firefox/Safari chưa kiểm; tải > 150 hóa đơn liên tục trên cổng thật chưa kiểm.
- ❌ Tờ khai kỳ **tháng** (XML) chưa có file mẫu đối chiếu; mẫu TT 89 có [32b]/[34a] khác 0 thì công cụ chặn xuất XML.

## 8. Lưu ý khi quay
- **Không để lộ dữ liệu thật**: che MST, tên doanh nghiệp, tên đối tác, số tiền của doanh nghiệp thử nghiệm. Ưu tiên dữ liệu giả lập: ảnh bảng điều khiển trong thẻ 1 đã dùng MST giả 0700922112 với các khách hàng giả.
- Quay trên trang thuế thật thì che phần thông tin tài khoản.
- Dùng đúng bản mới: kéo lại nút bookmark từ trang công cụ (bản 1.5.4, nút xanh dương). Trên web có ô hỏi đồng ý Clarity ở góc dưới (nếu anh đã bật): bấm chọn trước khi quay để ô không lọt vào hình.
- Xưng hô trên giao diện là "anh/chị". Nhân vật Đốm xuất hiện ở bảng quét (cầm kính lúp).
- Kế hoạch quay đã có: `cong-cu/xu-ly-hoa-don/video/ke-hoach-video.md`, gồm 8 cảnh, video ngang 60–90s và 2 video ngắn dọc:
  - "Tải cả quý hóa đơn trong 1 phút";
  - "Từ hóa đơn ra file nhập MISA".
- Gắn `?nguon=tiktok` / `?nguon=youtube` / `?nguon=facebook` vào link trong mô tả video để Quản trị → Phân tích web biết video nào kéo người vào.
- Tài liệu chung của kênh (Project): `claude/quy-trinh-video.md`, `claude/xuong-video-van-hanh.md`, `claude/nhan-vat-dom.md`, `claude/nhan-dien-thuong-hieu.md`.

## 9. Gợi ý thông điệp (để anh chọn)
- Hook nỗi đau: "Cuối quý, 61 hóa đơn, tải từng cái một?" → "1 nút, 1 file ZIP".
- Hook niềm tin: "Hóa đơn không rời máy của anh/chị. Công cụ không hỏi mật khẩu thuế."
- Hook hành trình: "Vợ tôi là kế toán trưởng. Chị tìm ra lỗi lệch 35.833 đồng, và công cụ được sửa ngay trong đêm."
- Hook so sánh: "Làm được việc của phần mềm trả phí, miễn phí, chạy ngay trên trình duyệt."
- CTA: "Dùng miễn phí tại quantritute.com → Bộ công cụ."
