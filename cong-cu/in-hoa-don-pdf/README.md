# In hóa đơn PDF hàng loạt theo danh sách

- **Slug:** `in-hoa-don-pdf` (trùng tên thư mục, link trên web: `/tools/in-hoa-don-pdf/`)
- **Nhóm:** Kế toán – tài chính (kt)
- **Nỗi đau giải quyết:** Tải về hàng nghìn file PDF hóa đơn, in ra thì lẫn thứ tự, không biết thiếu tờ nào.
- **Người dùng:** Kế toán doanh nghiệp, dịch vụ kế toán, kiểm toán nội bộ.
- **Trạng thái:** **Bản 1.1.0 (03/11/2026) – giao diện mới** theo bố cục Ghép & đối chiếu (trang chủ có hình minh họa + ô tải file; 4 bước trên thanh tiến độ ngang có Đốm: Tải file → Khớp & kiểm tra → Ghép file để in → In & tải về; xem trước trang của lô; nút Xem video Demo – điền `DEMO_VIDEO` trong `nguon/src/ui.html` khi có link YouTube). Migration `_mig_tools_v18` nâng bản + Lịch sử cập nhật. Trước đó: Bản 1.0.0 (02/11/2026) – **đưa lên kho công cụ, Nổi bật** (anh chốt 02/11 16:57). Bản ghi database **mới** slug `in-hoa-don-pdf` qua migration `_mig_tools_v16` (src/core.js; xếp đầu kho; kèm gắn slug vào tờ note đề xuất gốc trên Bảng ghim, trạng thái Mới phát hành). Icon mới `printer` (site/public/app.js + admin/public/admin.js). Ảnh `site/public/assets/tools/in-hoa-don-pdf.jpg`. Bài hướng dẫn `/huong-dan/in-hoa-don-pdf-hang-loat-theo-danh-sach/` (ảnh `huong-dan/anh/in-hoa-don-*.webp`), GUIDES trong `src/seo.js` + `site/public/app.js`. Góp ý: `in-hoa-don-pdf` trong `TOOL_SLUGS` + tên ở bảng Góp ý. Video: `video/ke-hoach-video.md` (chờ duyệt), `video/diem-noi-bat-truyen-thong.md`.
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
| 03/11/2026 | Bản 1.1.0 – giao diện mới (anh yêu cầu trước khi quay video v18): trang chủ + tiến độ ngang, thả PDF + danh sách cùng lúc ở trang đầu, xem trước lô; `_mig_tools_v18` |
| 02/11/2026 | Ảnh chia sẻ Facebook/Zalo 1200×630 `site/public/assets/tools/og/in-hoa-don-pdf.jpg`; `src/seo.js` chèn thẻ og: cho trang `/tools/` (áp dụng mọi công cụ) |
| 02/11/2026 | Lên kho công cụ + Nổi bật: migration `_mig_tools_v16`, icon printer, ảnh bìa, bài hướng dẫn SEO, link hướng dẫn trong công cụ (app/index.html build lại) |
| 02/11/2026 | Chuẩn bị đưa link công khai (chưa vào Bộ công cụ): thêm slug góp ý; chờ anh `.\cap-nhat.cmd` + `npm run deploy:admin` |
