# In hóa đơn PDF hàng loạt theo danh sách

- **Slug:** `in-hoa-don-pdf` (trùng tên thư mục, link trên web: `/tools/in-hoa-don-pdf/`)
- **Nhóm:** Kế toán – tài chính (kt)
- **Nỗi đau giải quyết:** Tải về hàng nghìn file PDF hóa đơn, in ra thì lẫn thứ tự, không biết thiếu tờ nào.
- **Người dùng:** Kế toán doanh nghiệp, dịch vụ kế toán, kiểm toán nội bộ.
- **Trạng thái:** **Bản 1.2.0 (03/11/2026) – nguồn `nguon/` đã là 1.2.0, bản thử `ban-thu-1.2.0/index.html`; **anh chốt xuất bản 03/11 12:30: đã chép vào `app/index.html`, migration `_mig_tools_v19` (nâng Bản 1.2.0 + Lịch sử cập nhật) – chờ anh `cap-nhat.cmd` + `deploy:admin`.** Bản 1.1.0 lưu ở `quantritute/_tam/in-hoa-don-pdf-app-1.1.0.html`.** Thêm: Lưu file mềm – đổi tên file theo cú pháp + tải file nén ZIP / lưu vào thư mục (góp ý người dùng 03/11). Trước đó: Bản 1.1.0 (03/11/2026) – giao diện mới** theo bố cục Ghép & đối chiếu (trang chủ có hình minh họa + ô tải file; 4 bước trên thanh tiến độ ngang có Đốm: Tải file → Khớp & kiểm tra → Ghép file để in → In & tải về; xem trước trang của lô; nút Xem video Demo – điền `DEMO_VIDEO` trong `nguon/src/ui.html` khi có link YouTube). Migration `_mig_tools_v18` nâng bản + Lịch sử cập nhật. Trước đó: Bản 1.0.0 (02/11/2026) – **đưa lên kho công cụ, Nổi bật** (anh chốt 02/11 16:57). Bản ghi database **mới** slug `in-hoa-don-pdf` qua migration `_mig_tools_v16` (src/core.js; xếp đầu kho; kèm gắn slug vào tờ note đề xuất gốc trên Bảng ghim, trạng thái Mới phát hành). Icon mới `printer` (site/public/app.js + admin/public/admin.js). Ảnh `site/public/assets/tools/in-hoa-don-pdf.jpg`. Bài hướng dẫn `/huong-dan/in-hoa-don-pdf-hang-loat-theo-danh-sach/` (ảnh `huong-dan/anh/in-hoa-don-*.webp`), GUIDES trong `src/seo.js` + `site/public/app.js`. Góp ý: `in-hoa-don-pdf` trong `TOOL_SLUGS` + tên ở bảng Góp ý. Video: `video/ke-hoach-video.md` (chờ duyệt), `video/diem-noi-bat-truyen-thong.md`.
- **Nguồn đề xuất:** Bảng ghim 02/11/2026 (kế toán) – thư mục `../Công cụ sẽ làm/In hóa đơn PDF hàng loạt theo danh sách/`. Anh chốt 02/11: làm thành công cụ riêng, chủ động làm không chờ khách phản hồi.

## Tính năng (bản 1.0.0)
1. **Nạp PDF:** nhiều file, cả thư mục (kéo thả hoặc nút), file ZIP chứa PDF; nạp nhiều lần, tự bỏ file trùng đường dẫn.
2. **Nạp danh sách:** .xlsx / .csv (đọc bằng mã riêng + fflate, không cần SheetJS). Tự tìm dòng tiêu đề và cột: số HĐ (bắt buộc), ký hiệu, MST người bán, ngày, tên. Đổi được trang tính, dòng tiêu đề, từng cột. Thứ tự in = thứ tự dòng.
3. **Khớp 2 lượt** (`src/engine.js`):
   - Lượt tên file: ký hiệu + số liền nhau (`1C26TAA_00000123`) → chắc chắn; số + ký hiệu / MST → chắc chắn; chỉ có số (số đó duy nhất trong danh sách) → "Khớp theo số HĐ – nên xem lại".
   - Lượt đọc chữ trong file (pdf.js, trang 1–2): cho file chưa khớp **và** file chỉ khớp theo số (để xác nhận lại). Nhận "Số (No.):", ký hiệu `[CK]yyXXX`, MST 10/13 số.
   - Tranh chấp: 2 file mạnh cùng 1 dòng → file sau là "trùng" (ưu tiên bản không có "(1)", "Copy"); tranh chấp yếu → để lượt đọc chữ xử lý.
   - Dòng lặp lại trong danh sách (cùng ký hiệu + số + MST) → báo "Dòng lặp lại của STT x", không in lại.
4. **Kết quả:** ô lọc Khớp chắc chắn / Theo số HĐ / Thiếu file / File chưa khớp / Trùng / Lỗi / Dòng lặp; gán tay file cho dòng thiếu (gợi ý "Có thể đúng" trước), Bỏ khớp; bấm tên file để mở xem; bảng 200 dòng/trang. Báo file bản scan (không có chữ).
5. **Excel đối chiếu:** sheet "Doi chieu" (tô màu theo kết quả, có lô in + trang trong lô sau khi ghép) và "File khong khop".
6. **Ghép (pdf-lib):** lô 50/100/200/500/tất cả; số thứ tự góc trên phải "0001/2000 . C26TAA-123" (xử lý cả trang xoay 90/180/270); in 2 mặt (thêm trang trắng sau HĐ lẻ trang); trang "THIẾU HÓA ĐƠN" đúng vị trí; trang đầu lô; có/không gồm HĐ khớp theo số. Trang chữ Việt vẽ bằng canvas → PNG. Tải từng lô, "Mở để in", lưu tất cả vào thư mục (Chrome/Edge) hoặc ZIP.
7. Góp ý cho Đốm (`tool = in-hoa-don-pdf`), Thử với dữ liệu mẫu (tạo ngay trong trình duyệt, dữ liệu giả MST 0123456789…), Hướng dẫn sử dụng, `qtt-track.js`, giao diện sáng/tối, điện thoại.

## Tính năng bản 1.2.0 – Đổi tên file & tải file nén (góp ý người dùng 03/11/2026)
- Góp ý: tải hàng loạt hóa đơn từ MISA, tên file dính liền không dấu (`0110928376_1_C26TAB_00000098_25042026_congtytnhhviethailogistics`) nên gõ tìm số HĐ, tên công ty không ra; in chỉ để lưu, tra cứu chủ yếu trên file mềm.
- Mục riêng **dưới cùng Bước 4** "Lưu file mềm: đổi tên file & tải về 1 file nén" (anh chốt 03/11 12:09). Bước 4 mở được ngay sau khi khớp (không bắt buộc ghép in); Bước 3 có nút "Chỉ lưu file mềm →".
- Cú pháp mặc định (anh chốt 03/11): `STT_Ký hiệu mẫu số_YYMM_Số hóa đơn_Tên công ty`, ví dụ `0002_1_2609_1579_CÔNG TY TNHH VIẾT HẢI LOGISTICS.pdf`. STT = số thứ tự in ở góc bản giấy. "Loại tờ khai" lấy theo cột **Ký hiệu mẫu số** (anh chốt, không dùng cột "Tờ khai"). YYMM lấy từ cột Ngày lập.
- Tùy chỉnh: tích/bỏ từng phần, ↑↓ đổi thứ tự, thêm Ký hiệu HĐ, MST người bán, Ngày DDMMYYYY, Chữ tự nhập; dấu nối _ - . hoặc dấu cách; ô tích **Bỏ dấu tiếng Việt**, **Bỏ dấu cách** (mặc định giữ dấu, giữ dấu cách); nhớ thiết lập trên máy (localStorage); nút Về cú pháp mặc định.
- Tự xử lý: ký tự Windows cấm → "-", tên > 150 ký tự cắt bớt phần tên công ty, trùng tên thêm (2), (3), phần trống không để 2 dấu nối liền; dòng thiếu file bỏ qua; theo ô "Gồm cả hóa đơn khớp theo số HĐ". Không có danh sách → STT + tên gốc.
- Tải: ZIP nén luồng (fflate Zip + ZipPassThrough, không nén lại PDF, tên tiếng Việt UTF-8) kèm `Doi-chieu-ten-file-moi.xlsx` (Excel đối chiếu thêm cột "Tên file mới"); hoặc Lưu vào một thư mục (Chrome/Edge). Danh sách nhận thêm cột **Ký hiệu mẫu số** (`cols.mau`).
- Kiểm thử 03/11: `kiem-thu/t8-doi-ten.js` (lõi, 2 file Excel mẫu thật: nhận đúng cột, 3 kiểu tên, ký tự cấm, cắt dài, trùng tên, tên file MISA khớp ký hiệu + số + MST) – đạt; `kiem-thu/t9-doi-ten-giao-dien.js` (trang 2604 bảng kê mẫu: 16 PDF giả tên kiểu MISA + 1 PDF thật → khớp 17/17, ZIP 17 file + Excel, mở bằng Python đúng tên có dấu; sáng/tối; 390px không tràn ngang) – đạt. Hồi quy `t1.js`, `t2.js` đạt.
- **Sửa lỗi chọn cả thư mục (anh báo 03/11 11:50):** ở trang đầu bấm "Chọn cả thư mục PDF" thì file vẫn nạp nhưng trang không chuyển sang Bước 1 (trông như không có gì), chọn lại lần 2 thì báo "Không có file PDF mới" (vì file đã nạp rồi). Nay: chọn file/thư mục đi qua cùng 1 hàm với ô thả – tự sang Bước 1, báo "Đã nạp n file PDF"; chọn trùng thì báo rõ "đã nạp trước đó"; Excel trong thư mục tự nhận làm danh sách (chỉ khi thư mục có đúng 1 file Excel, có 2 file trở lên thì nhắc chọn). Kiểm `kiem-thu/t10-thu-muc.js` với thư mục mẫu anh gửi (9 PDF + 1 Excel).
- **Nhiều trang tính (anh chốt 03/11):** khung "Trang tính dùng để in" liệt kê mọi trang tính kèm số HĐ, tick sẵn các trang có hóa đơn, nút Chọn tất cả / Bỏ chọn tất cả, ↑↓ đổi thứ tự; gộp theo thứ tự trang tính trong file, STT chạy liền. Mỗi trang tự nhận dòng tiêu đề + cột; sửa cột ở trang đang xem thì các trang cùng tên cột đổi theo. Excel đối chiếu thêm cột "Trang tính". Trang TKHQ (số tờ khai 12 chữ số, không phải số HĐ) không tick được. Kiểm `kiem-thu/t11-nhieu-sheet.js`: mặc định 17/18 trang, 265 HĐ; chọn 2605 + 2604 → 33 dòng, 9/9 PDF thật khớp.
- **Sửa 03/11 12:20 (anh test):** (1) ZIP mở trong Windows báo "potentially harmful / blocked" → thay bộ nén luồng fflate (mục lưu trữ có data descriptor) bằng bộ ghi ZIP riêng `E.ZipStore`: lưu trữ không nén, CRC + kích thước ghi ngay ở header, cờ UTF-8, thuộc tính Archive kiểu Windows; `unzip -t` đạt. Giới hạn 4 GB → nhắc dùng Lưu vào thư mục. (2) Thư mục có ≥2 file Excel: tự chọn file khớp nhiều PDF nhất (hòa thì ưu tiên tên "Bảng kê / Danh sách"), hiện dải vàng có nút đổi sang file còn lại; thả thư mục vào ô PDF ở Bước 1 cũng nhận Excel.
- Chưa kiểm: giải nén ZIP bằng Windows Explorer / WinRAR trên máy anh (tên có dấu); ZIP lớn (2.000 file × 300 KB ≈ 600 MB) chạy trên máy RAM thấp.

## Cấu trúc
| Đường dẫn | Là gì |
|---|---|
| `app/index.html` | Bản build 1 file (~2 MB, đã gói thư viện) – dùng trên web và tải về dùng không cần mạng. Không sửa tay |
| `nguon/src/engine.js` | Lõi: chuẩn hoá, trích khoá, chấm điểm, khớp, đọc xlsx/csv, ghi xlsx |
| `nguon/src/ui.html` | Giao diện + xử lý PDF |
| `nguon/vendor/` | fflate 0.8 (chép từ ghep-doi-chieu), pdf-lib 1.17.1, pdf.js 3.11.174 (pdf.min.js + pdf.worker.min.js). Thư viện PDF chỉ nạp khi cần (để trong `<script type="text/plain">`) |
| `nguon/build.js` | `node build.js` → `build/index.html` → chép sang `app/index.html` |
| `nguon/kiem-thu/` | `t1.js` (lõi khớp, node), `gen.js` (sinh 2.000 PDF + danh sách giả), `t2.js` (dữ liệu mẫu), `t4.js` (2.000 file) – Playwright, cần `npm i pdf-lib fflate playwright` |

## Đã kiểm thử (02/11/2026, Chromium)
- Dữ liệu mẫu 16 PDF / 14 dòng: 13 khớp chắc chắn (6 theo tên file, 7 đọc chữ trong file), 1 thiếu file, 1 bản sao "(1)" → trùng, 1 file ngoài danh sách, 1 bản scan. Số HĐ 123 có ở 3 người bán khác nhau → khớp đúng từng người bán.
- 2.000 PDF (1.000 tên chuẩn + 1.000 tên `Scan_xxxxx` phải đọc chữ) + danh sách 2.000 dòng: khớp 2.000/2.000 trong ~3 giây; ghép 20 lô × 100 HĐ trong ~13 giây; đối chiếu 100 trang lô 3: đúng thứ tự, đúng ký hiệu/số.
- Giao diện 1440px, 390px (không tràn ngang), chế độ tối.
- **Chưa kiểm:** PDF hóa đơn thật của các nhà cung cấp (VNPT, Viettel, MISA, BKAV…) – font nhúng, mật khẩu; tốc độ với PDF thật nặng 100–300 KB/file; Safari/Firefox (chọn thư mục, lưu vào thư mục chỉ có trên Chrome/Edge).

## Lên web (02/11/2026)
Đã làm đủ hạng mục quy trình công cụ mới. Chưa có: video demo (chưa quay), Góc cảm ơn (cần chị Thủy đồng ý).

## Cập nhật lên web
`cd nguon` → `node build.js` → chép `build/index.html` sang `app/index.html` → về thư mục công cụ → `.\cap-nhat.cmd`.

## Nhật ký
| Ngày | Việc |
|---|---|
| 02/11/2026 | Bản 1.0.0 – dựng mới từ đề xuất Bảng ghim, kiểm thử dữ liệu mẫu + 2.000 file |
| 03/11/2026 | Xuất bản 1.2.0: app/index.html + `_mig_tools_v19` (src/core.js, bản cũ `_tam/core.js.truoc-in-hoa-don-120-20261103.bak`) |
| 03/11/2026 | Bản 1.2.0 – đổi tên file theo cú pháp + tải ZIP / lưu thư mục (góp ý người dùng); bản thử `ban-thu-1.2.0/`, chưa vào `app/` |
| 03/11/2026 | Bản 1.1.0 – giao diện mới (anh yêu cầu trước khi quay video v18): trang chủ + tiến độ ngang, thả PDF + danh sách cùng lúc ở trang đầu, xem trước lô; `_mig_tools_v18` |
| 02/11/2026 | Ảnh chia sẻ Facebook/Zalo 1200×630 `site/public/assets/tools/og/in-hoa-don-pdf.jpg`; `src/seo.js` chèn thẻ og: cho trang `/tools/` (áp dụng mọi công cụ) |
| 02/11/2026 | Lên kho công cụ + Nổi bật: migration `_mig_tools_v16`, icon printer, ảnh bìa, bài hướng dẫn SEO, link hướng dẫn trong công cụ (app/index.html build lại) |
| 02/11/2026 | Chuẩn bị đưa link công khai (chưa vào Bộ công cụ): thêm slug góp ý; chờ anh `.\cap-nhat.cmd` + `npm run deploy:admin` |
