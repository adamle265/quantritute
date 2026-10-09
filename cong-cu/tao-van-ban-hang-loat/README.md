# Tạo văn bản hàng loạt

- **Slug:** `tao-van-ban-hang-loat` (link trên web: `/tools/tao-van-ban-hang-loat/`)
- **Nhóm:** Hành chính – Nhân sự (`hc`, bìa xanh lá)
- **Nỗi đau giải quyết:** Phải gõ lại cùng một hợp đồng, giấy mời, giấy chứng nhận cho hàng chục người, vừa mất thời gian vừa dễ sai tên.
- **Người dùng:** Hành chính – Nhân sự, C&B, Kế toán, Đào tạo – Sự kiện, chủ doanh nghiệp nhỏ
- **Trạng thái:** DONE – chốt mốc 09/10/2026 (bản 1.7.2). Anh duyệt 09/10/2026, đưa lên web. Dùng trực tiếp tại `/tools/tao-van-ban-hang-loat/` hoặc bấm "Tải về máy" để dùng không cần mạng
- **Hình thức:** 1 file HTML duy nhất (~3,8 MB), chạy offline bằng Chrome/Edge. Trên web có nút "Tải về máy".

## Luồng trải nghiệm (bản 1.3)
- **Trang đầu:** banner thương hiệu – trái: tên công cụ, lợi ích; phải: ô tải file, chọn "File thành phẩm mẫu" hoặc "File danh sách" (Word/PDF/ảnh tự nhận là mẫu, CSV tự nhận là danh sách). Dưới: "Cách hoạt động" 4 bước, nút hướng dẫn & tải mẫu.
- **Tải mẫu trước:** có ký hiệu → xác nhận, tải danh sách trống nếu cần → Danh sách → Ghép → Xem thử → Xuất. Không có ký hiệu → 2 lựa chọn: (1) Làm lại theo hướng dẫn (ví dụ hợp đồng đánh dấu dựng như trang in) rồi tải lại; (2) Ghép thủ công sau khi tải danh sách. Ảnh/PDF scan → báo kéo khung ở bước Ghép.
- **Tải danh sách trước:** bước File mẫu có 2 lựa chọn: "Tôi đã có file mẫu" / "Hướng dẫn tạo file mẫu" (kèm nút tải **file Word khởi đầu có sẵn ký hiệu tất cả các cột của danh sách**).
- Thanh bước đổi thứ tự theo file tải trước; nút "↺ Làm lại từ đầu" trên đầu trang.
- Đã bỏ nút "Dùng phông gốc của máy" (anh yêu cầu 07/10/2026).

## Bản 1.7.1 – chọn trang tính của file danh sách
- File danh sách Excel có nhiều trang tính (sheet): hiện khung "File có N trang tính – chọn trang tính lấy dữ liệu" ngay dưới tên file, mỗi trang tính một nút (kèm số dòng ước tính; trang tính trống bị mờ). Đổi trang tính → lấy lại dữ liệu, đặt lại phần ghép trường
- Khi tải lên, công cụ lấy trang tính đầu tiên có dữ liệu và báo cho người dùng biết đang lấy trang nào
- Dữ liệu thử: du-lieu-thu/danh-sach-nhieu-sheet.xlsx (Tháng 9, Tháng 10, Ghi chú trống)

## Bản 1.7 – ghép thủ công mẫu Word + xuất PDF từ Word
- Mẫu Word chưa có ký hiệu: không tự ghép theo giá trị nữa. Dòng chấm/gạch dưới để điền (≥4 ký tự) thành "ô chờ" viền xanh; bấm ô → bảng chọn cột (nổi cố định, không tự biến mất, ghi nhãn của dòng, đánh dấu cột trùng tên nhãn nhưng không tự chọn); hoặc kéo cột thả vào ô
- Ghép theo vị trí: mỗi ô chấm là một trường riêng, chỉ thay đúng chỗ đã chọn (trước đây thay mọi dãy chấm giống nhau). Bôi đen một đoạn chữ cũng ghép đúng chỗ đó
- Mẫu Word đã điền thật (không có dòng chấm): các chỗ trùng giá trị danh sách thành ô chờ; khi chọn cột có tuỳ chọn "ghép luôn N chỗ cùng chữ"
- Trang mẫu Word: cột rộng hơn, nút phóng to/thu nhỏ/vừa khung; sửa lỗi phần tô màu bị giãn thành dải làm lệch dòng
- Mẫu Word xuất được PDF (tách từng file hoặc gộp): dựng trang trên máy rồi chụp từng trang (giống bản in, chữ không chọn được). Thư viện mới: html2canvas (đã thêm vào package.json)
- Dữ liệu thử: du-lieu-thu/phieu-luong-dong-cham.docx (phiếu lương dòng chấm của anh), chung-chi-ban-scan.pdf + ds-chung-chi-ngay-hoc.xlsx

## Bản 1.6 – xử lý lỗi Windows chặn giải nén ZIP
So với tool chứng chỉ (giải nén được): tool đó nén ZIP kiểu mặc định (không nén lại, chỉ đóng gói), tên file dùng dấu gạch dưới, PDF là ảnh JPEG (jsPDF).
- ZIP đóng gói giống hệt tool chứng chỉ: bỏ nén DEFLATE và các tuỳ chọn ngày/quyền/hệ điều hành (bản cũ ghi "cần phiên bản 1.0" nhưng lại nén DEFLATE – không khớp chuẩn)
- Tên file không dấu: khoảng trắng → dấu gạch dưới
- Làm sạch mọi PDF xuất ra: bỏ JavaScript, lệnh tự chạy, file đính kèm, XFA, dấu mã hoá sót lại; đặt Producer/Creator "Quan tri tu te"
- Thêm định dạng "PDF dạng ảnh" (giống tool chứng chỉ): mỗi trang thành ảnh nét cao – dùng khi PDF thường vẫn bị chặn
- Chưa kiểm chứng được trên Windows thật (máy thử của em là Linux): anh thử lại; nếu còn chặn, mở Windows Security → Protection history để xem tên mối đe doạ và gửi em

### Bổ sung 1.6 (08/10/2026, theo góp ý của anh)
- Bỏ ô "Dùng đúng phông gốc" và ô "Phông chữ cho mọi khung". Công cụ tự chọn phông nhúng sẵn gần giống phông gốc nhất: theo tên phông (Times, Arial…), hoặc khi tên bị ẩn (CIDFont+F1…) thì so độ rộng chữ thật trong PDF với 4 kiểu (có chân/không chân × thường/đậm)
- Lệch quá 6% (phông trang trí, đơn cách…) → cảnh báo cam ở đầu khung phải, khung đó gắn "⚠ chọn phông"; người dùng chọn Có chân/Không chân trong từng khung
- Lưu vào thư mục: ghi rõ chọn thư mục trong ổ D (không phải ổ C chứa hệ thống), ví dụ D:\\VanBan
- Bộ ví dụ mới là phiếu lương (thay hợp đồng): mau-phieu-luong.docx (thiết kế mới), mau-phieu-luong.xlsx, danh-sach-luong-mau.xlsx (8 nhân viên, 25 cột); nút "Thử ngay với ví dụ" ở trang đầu nạp sẵn cả hai file → vào thẳng bước Ghép trường (dùng để quay video)
- Số liệu lương là minh hoạ: bảo hiểm 8% / 1,5% / 1% trên lương cơ bản; thuế TNCN tính giản lược (giảm trừ 15,5 tr + 6,2 tr/người phụ thuộc, biểu 5 bậc) – không dùng làm căn cứ tính lương thật
- Tạo lại bộ ví dụ: `python nguon/samples/tao-bo-phieu-luong.py nguon/samples` rồi build lại
- Nút chuyển bước đặt thêm ở góc trên bên phải, ngang tiêu đề mỗi bước (Quay lại · Xem thử/Xuất file…); bước Xuất file có thêm nút "Tạo N bản và tải về" ở trên. Nút dưới cuối trang vẫn giữ
- Sửa lỗi màn hình điện thoại bị tràn ngang ở bước Ghép trường (mẫu Word)

### Bổ sung 1.6b (08/10/2026) – mẫu PDF/ảnh chưa có ký hiệu
- PDF scan / ảnh: kéo khung quanh chữ cũ → tự bắt cỡ chữ, đậm/thường, màu, đường chân chữ; khi tạo file chỉ xoá nét chữ cũ, lấp bằng nền xung quanh (giữ hoa văn, chìm, dòng chấm) – không còn ô trắng. Chữ mới dài hơn tự co để không đè chữ in sẵn phía sau (vd "Giới tính"). Vẫn có tuỳ chọn "Phủ bằng một màu nền phẳng"
- Hai loại PDF (có lớp chữ / bản scan) dùng chung một thông báo đỏ "File mẫu chưa có ký hiệu trường" với 2 cách xử lý; nút "Tiếp tục" luôn bấm được = chọn ghép thủ công
- Thông báo quan trọng: chữ và biểu tượng màu đỏ
- Ghép thủ công trên PDF có lớp chữ: bỏ tự ghép theo giá trị (hay sai). Thay bằng "ô chờ" viền xanh ở các chỗ giống giá trị điền (sau nhãn "…:", dòng chấm, khác kiểu chữ với nhãn) – bấm vào ô hoặc kéo cột thả vào để tạo khung; không tự đề xuất cột
- Kéo khung lên chữ: lấy trọn cụm chữ cũ (không cắt giữa từ), tự bỏ nhãn "Cho:" và dòng chấm
- Dữ liệu thử: du-lieu-thu/chung-chi-co-lop-chu.pdf + ds-chung-chi.xlsx
- Sửa (1.6c): cột năm/mã/số hiệu/SĐT/CCCD và số trong khoảng 1000–2200 giữ nguyên chữ số (2026, không thành 2.026); thêm định dạng "Thêm số 0 phía trước (9 → 09)"
- Sửa (1.6c): bản scan – nhận dòng chấm theo khoảng cách đều nên giữ được chấm dưới cả ô hẹp (ngày/tháng); nét bị mép khung cắt ngang (vd dấu "/") giữ nguyên, không bị xoá dở

## Bản 1.5
- Nút "Công cụ hữu ích khác" thu gọn thành nút tròn nhỏ góc dưới phải; bỏ dòng "Mọi trường đều có cột cùng tên"; nút "↻ Đổi file" chữ đỏ.
- Xuất mặc định "Mỗi dòng một file · lưu vào thư mục" trên Chrome/Edge (tránh Windows chặn khi giải nén ZIP); ZIP vẫn còn để chọn.
- PDF: phông mặc định theo file gốc – tự dùng phông cùng tên trên máy nếu trình duyệt đã cho phép; lần đầu có khung xanh "Dùng đúng phông gốc" để cấp quyền một lần. Word/Excel giữ phông của chính file mẫu.

## Bản 1.4
- **Link cần thay:** `DEMO_VIDEO_ID` trong `nguon/src/ui.js` (đang để tạm video YouTube `jNQXAC9IVRw`); `TOOLS_URL` = `/cong-cu` khi chạy trên web, `https://quantritute.pages.dev/cong-cu` khi mở file offline (đổi khi gắn tên miền).
- Trang đầu: nút "Xem video hướng dẫn" (mở hộp video), nút nổi góc dưới phải "Tham khảo các công cụ hữu ích khác"; ô chọn loại file to, có biểu tượng, đánh số bước.
- Tự nhận ra file Excel là **danh sách** (hàng tiêu đề + nhiều dòng dữ liệu, không có ký hiệu) hay **file mẫu** (có ký hiệu [..]) – nếu khác lựa chọn của người dùng thì hiện hộp thoại xin xác nhận (ở trang đầu, bước File mẫu, bước Danh sách).
- Nút chính (Tiếp tục, Xem thử, Xuất file, Tạo…) màu cam đậm có bóng; nút tải file phụ trợ (danh sách trống, Word khởi đầu) màu xanh lá.
- PDF: đọc đúng tên phông/đậm của mẫu; chọn phông lại được (phông nhúng sẵn hoặc phông cài trên máy – trình duyệt xin quyền) cho từng khung và cho mọi khung; tuỳ chọn "Co nhỏ cho vừa / Giữ nguyên cỡ chữ"; **tự dàn lại dòng**: chữ phía sau ký hiệu (cùng lệnh vẽ) được đẩy theo độ dài giá trị mới, không phải co chữ; cảnh báo ở bước Xem thử khi vẫn phải co.
- Xuất: thêm "Mỗi dòng một file · lưu vào thư mục" (Chrome/Edge, không cần giải nén); tên file không dấu (mặc định bật); hướng dẫn Unblock khi Windows chặn giải nén.

## Cách vận hành (5 bước)
| Bước | Người dùng | Công cụ |
|---|---|---|
| 1. File mẫu | Đánh dấu chỗ cần thay bằng `[Tên cột]` (hoặc `{{Tên cột}}`, `«Tên cột»`), tải lên .docx, .xlsx, .pdf, .png/.jpg. Có hướng dẫn + mẫu tải sẵn | Nhận diện ký hiệu ngay khi tải, cho tải file danh sách trống đúng tên cột |
| 2. Danh sách | Tải lên Excel/CSV, dòng đầu là tên cột; chọn/bỏ dòng | Đọc cột, ngày, số tiền |
| 3. Ghép trường | Soát, kéo thả cột vào trường, bôi đen chữ trong mẫu để thêm | Ghép ký hiệu với cột cùng tên (không phân biệt hoa thường, dấu); Trang mẫu Word hiện như trang in với các ô trường tô màu. Mẫu không có ký hiệu → dự phòng: dò giá trị của danh sách trong bản đã điền |
| 4. Xem thử | Duyệt từng bản | Dựng bản thật cho dòng đang chọn |
| 5. Xuất file | Chọn định dạng, gộp hoặc tách, đặt tên file theo cột | Tạo file trên máy, tải về |

## Định dạng hỗ trợ
| Mẫu | Nhận diện trường | Mỗi dòng 1 file (ZIP) | Gộp 1 file |
|---|---|---|---|
| Word .docx | Tự động (cả đầu/chân trang) | .docx | .docx, mỗi bản 1 section, đầu/chân trang riêng từng bản |
| Excel .xlsx | Tự động (ô chữ + ô số/ngày) | .xlsx | .xlsx, mỗi bản 1 trang tính |
| PDF có lớp chữ | Tự động, xoá hẳn chữ gốc rồi ghi chữ mới | .pdf | .pdf |
| PDF scan / Ảnh | Người dùng kéo khung đặt chữ, công cụ lấy màu nền phủ chữ cũ | .png / .jpg / .pdf | .pdf |

Định dạng giá trị: dd/mm/yyyy, d/m/yyyy, "dd tháng mm năm yyyy", 1.000.000 / 1,000,000, CHỮ IN HOA, Viết Hoa Đầu Từ. Mẫu có đánh dấu `{{Tên cột}}`, `«Tên cột»` cũng nhận.

## Quy tắc ký hiệu (bản 1.1)
- Nhận `[Tên]`, `{{Tên}}`, `«Tên»`, `<<Tên>>`. Với `[...]`: bỏ qua `[1]`, `[...]`, số La Mã; tên có dấu phẩy/hai chấm hoặc từ 6 từ trở lên (ví dụ `[Ký, ghi rõ họ tên]`) coi là "có thể không phải trường" – để tắt nếu không khớp cột, không đưa vào danh sách trống.
- Word/Excel: chữ mới lấy định dạng của chữ đầu tiên bên trong ký hiệu (phông, cỡ, đậm, màu).
- Excel: ô chỉ chứa đúng 1 ký hiệu + giá trị số/ngày → ghi thành số, giữ định dạng ô, công thức tính lại.
- PDF có chữ: khung đặt tại ký hiệu, giữ phông/đậm của ký hiệu, tự căn phải nếu ký hiệu nằm cuối dòng bên phải; giá trị dài hơn chỗ trống được co chữ.

## PDF (bản 1.2)
- PDF có lớp chữ: **không phủ nền** nữa – chữ cũ trong khung bị xoá hẳn khỏi file, hoa văn/nền giữ nguyên. Dòng chấm/gạch dưới (từ 3 ký tự liền) luôn được giữ.
- Bấm 1 lần vào chữ cũ (hoặc kéo khung quanh) → khung tự bắt theo chữ cũ: phông, cỡ, đậm/nghiêng, màu, dòng chân chữ; chữ cũ in hoa thì định dạng tự là CHỮ IN HOA. Kéo khung trên dòng chấm trống → giữ dòng chấm, chữ viết lên trên, cỡ theo nhãn đứng trước.
- "Dùng đúng phông gốc của mẫu (lấy từ máy tính)": Chrome/Edge hỏi quyền đọc phông trên máy, tự dùng phông cùng tên với phông trong PDF (ví dụ Times New Roman). Từng khung chọn được "Phông máy".
- Kiểu Đậm + Nghiêng bật cùng lúc được; nút "Áp phông & màu này cho mọi khung" (và "… kèm cỡ chữ").
- Phủ màu nền chỉ dùng cho ảnh, PDF scan, hoặc khi tick "Phủ thêm màu nền".
- OCR: chưa đưa vào (chỉ cần cho bản scan/ảnh; nặng thêm ~15 MB) – để gói riêng nếu anh cần.

## Giới hạn đã biết (nói rõ với người dùng)
1. Word/Excel không xuất ra PDF được khi chạy offline trên trình duyệt. Cần PDF thì mở file gộp trong Word → Lưu thành PDF.
2. PDF không tự dàn lại dòng: tên dài hơn chỗ trống sẽ được co chữ cho vừa. Văn bản có đoạn chữ dài ngắn khác nhau nên dùng mẫu Word.
3. Ảnh/PDF scan chưa có OCR nên không tự nhận diện. OCR tiếng Việt offline làm file nặng thêm 10–15 MB (để bản sau nếu cần).
4. Chưa có: chèn ảnh theo từng dòng (ảnh thẻ), đọc số tiền bằng chữ (anh đã chốt để bản sau).
5. Chữ trên ảnh/PDF dùng 2 phông nhúng sẵn: Có chân (Liberation Serif ≈ Times New Roman), Không chân (Liberation Sans ≈ Arial).

## Bản ghi database (đã đưa vào migration `_mig_tools_v5` trong src/core.js)
- Cập nhật bản ghi có sẵn slug `van-ban-hang-loat` (đang Coming soon): url `/tools/tao-van-ban-hang-loat/`, status `ok`, released `2026-10-09`, version `Bản 1.7`, who, benefits, highlights, features, guide (em soạn, anh sửa được ở Quản trị → Công cụ). Giữ nguyên tên, pain, tags, icon, Nổi bật anh đã có.
- Chỉ chạy khi bản ghi chưa có link; trường anh đã tự nhập không bị ghi đè.
- Ảnh giao diện: `site/public/assets/tools/van-ban-hang-loat.jpg` (1280×720).

## Bản ghi database đề xuất ban đầu (bản 1.1 – tham khảo)
| Trường | Giá trị |
|---|---|
| grp | `hc` |
| name | Tạo văn bản hàng loạt |
| slug | `tao-van-ban-hang-loat` |
| icon | 📑 |
| tags | Hành chính, Nhân sự, Trộn văn bản, Hợp đồng, Giấy chứng nhận |
| status | `ok` sau khi deploy |
| pricing | Free |
| url | `/tools/tao-van-ban-hang-loat/` |
| pain | Phải gõ lại cùng một hợp đồng, giấy mời, giấy chứng nhận cho hàng chục người, vừa mất thời gian vừa dễ sai tên. |
| benefits | Tạo nhanh hàng loạt văn bản Word, Excel, PDF hoặc ảnh từ một file mẫu và một danh sách Excel · Đánh dấu [Tên cột] trong mẫu, công cụ tự nhận diện và giữ đúng định dạng · Kiểm tra từng bản trước khi tạo, chỉnh ghép trường bằng kéo thả · Tải về mỗi người một file hoặc gộp tất cả vào một file |
| who | Hành chính – Nhân sự, C&B, Kế toán, Đào tạo – Sự kiện, Chủ doanh nghiệp nhỏ |
| highlights | Ký hiệu dễ làm \| Gõ [Họ và tên] ngay trong Word/Excel, có hướng dẫn và mẫu sẵn · Giữ nguyên định dạng \| Phông, bảng, màu, công thức Excel giữ như mẫu · Gộp hoặc tách \| Mỗi người một file (ZIP) hoặc gộp một file · Dữ liệu không rời máy \| Chạy hoàn toàn trên máy, dùng được khi không có mạng |

## Thư mục
```
app/index.html     ← file đưa lên web (bản build, KHÔNG sửa tay)
nguon/             ← mã nguồn: src/*.js, src/app.css, src/app.html, fonts/, build.py
du-lieu-thu/       ← dữ liệu giả để thử (danh sách 8 nhân sự; mẫu có ký hiệu *-ky-hieu.*; mẫu đã điền cho cách dự phòng)
nguon/samples/     ← 3 file mẫu nhúng vào nút "Tải mẫu dùng thử"
video/ke-hoach-video.md
cap-nhat.cmd
```
Sửa giao diện/tính năng: sửa trong `nguon/src/` → trong `nguon/` chạy `npm install` (lần đầu) rồi `python build.py` → chép `nguon/dist/index.html` sang `app/index.html`. Em làm bước này trong các phiên sau.

Thư viện nhúng sẵn (giấy phép mở): SheetJS CE, JSZip, pdf.js, pdf-lib + fontkit, docx-preview; phông Lexend, IBM Plex Mono, Liberation (OFL).

## Kiểm tra trước khi đưa lên
- [x] Không có thông tin tổ chức cũ, không cổng mã, không form thu thông tin
- [x] Nút "← Bộ công cụ" trỏ `/cong-cu` (chỉ hiện khi mở trên web)
- [x] Kiểm thử tự động 07/10/2026: Word (tách + gộp, đầu trang riêng), Excel (tách + gộp, công thức tính lại), PDF chứng nhận, PDF xuất từ Word (chữ gốc bị xoá hẳn, không lộ khi sao chép), ảnh thẻ; danh sách .xlsx và .csv; màn hình 1440px, 390px, tắt đèn
- [ ] Anh dùng thử với mẫu thật của anh (Word + PDF)
- [ ] Anh mở file gộp .docx/.xlsx bằng Microsoft Office (môi trường thử của em chỉ có LibreOffice)

## Nhật ký
| Ngày | Việc |
|---|---|
| 09/10/2026 | Chốt mốc: công cụ tạm DONE. Còn chờ anh: chạy .\cap-nhat.cmd + npm run deploy:admin cho bản 1.7.2; gửi link video demo thật (thay DEMO_VIDEO_ID trong nguon/src/ui.js rồi build lại) |
| 09/10/2026 | Bản 1.7.2: nút ↶ Hoàn tác / ↷ Làm lại trên thanh trên cùng + phím Ctrl+Z, Ctrl+Y (Ctrl+Shift+Z); lưu tối đa 100 thao tác: ghép/bỏ ghép, đổi cột, định dạng, bật/tắt trường, thêm/xoá/kéo khung chữ, kiểu chữ, chọn dòng danh sách, đổi trang tính, tuỳ chọn xuất. Đổi file thì lịch sử làm mới; trong ô nhập chữ Ctrl+Z hoàn tác chữ như bình thường |
| 09/10/2026 | Popup trên web: 2 nút "Dùng online" (mở cùng tab) + "Tải bản offline" (tải tao-van-ban-hang-loat.html); migration _mig_tools_v6 điền download_url; sửa site/public/app.js (dlName, bỏ target _blank) |
| 09/10/2026 | Bản 1.7.1: chọn trang tính (sheet) của file danh sách Excel nhiều trang tính |
| 09/10/2026 | Anh duyệt. Thêm migration _mig_tools_v5 (bản ghi van-ban-hang-loat → Active, link, nội dung popup), ảnh giao diện 1280×720; thử chạy qua http như trên web (nút Bộ công cụ, Tải về máy, xuất file) |
| 08/10/2026 | Bản 1.7: Word chưa ký hiệu → ô chờ bấm chọn cột, ghép theo vị trí, bảng chọn cột ổn định, phóng to/thu nhỏ; xuất PDF từ mẫu Word |
| 08/10/2026 | Bản 1.6: ZIP đóng gói kiểu tool chứng chỉ, tên file gạch dưới, làm sạch PDF, thêm PDF dạng ảnh; tự chọn phông gần giống (bỏ ô phông), lưu thư mục ổ D; bộ ví dụ phiếu lương + nút Thử ngay; nút chuyển bước góc trên phải; xoá chữ trên bản scan giữ nền, ô chờ kết nối, Tiếp tục luôn bấm được |
| 08/10/2026 | Bản 1.5: CTA gọn, nút Đổi file đỏ, lưu thư mục mặc định, phông theo file gốc |
| 07/10/2026 | Bản 1.4: video + CTA công cụ khác; nút nổi bật; nhận diện nhầm loại file; chọn phông lại (nhúng/máy); PDF tự dàn dòng; lưu vào thư mục, tên không dấu |
| 07/10/2026 | Bản 1.3: trang đầu kiểu banner + ô tải file chọn loại; luồng theo file tải trước; xử lý mẫu chưa có ký hiệu (2 lựa chọn); file Word khởi đầu từ cột danh sách; bỏ phông của máy |
| 07/10/2026 | Bản 1.2: PDF xoá chữ cũ không phủ nền, giữ dòng chấm; bấm/kéo vào chữ cũ để khung tự bắt phông-cỡ-vị trí; phông của máy; Đậm+Nghiêng; áp kiểu cho mọi khung |
| 07/10/2026 | Bản 1.1: cách chính là ký hiệu trong mẫu (anh chốt: nhận cả [..] lẫn {{..}}, định dạng theo file mẫu, giữ dò giá trị làm dự phòng + tải danh sách trống); hướng dẫn làm mẫu + 3 file mẫu nhúng sẵn; Trang mẫu Word dạng trang in |
| 07/10/2026 | Build bản 1.0 từ đầu theo mô tả của anh: mẫu kết quả (B), danh sách, tự đề xuất ghép trường, kéo thả, xem thử, xuất tách/gộp; hỗ trợ mẫu PDF |
