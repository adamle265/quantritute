# Bộ xử lý hóa đơn điện tử

- **Slug:** `xu-ly-hoa-don` (link trên web: `/tools/xu-ly-hoa-don/`)
- **Nhóm:** Kế toán – tài chính
- **Nỗi đau giải quyết:** trang hoadondientu.gdt.gov.vn chỉ cho tải từng hóa đơn; gộp số liệu XML ra Excel mất thời gian.
- **Người dùng:** kế toán doanh nghiệp, dịch vụ kế toán, hộ kinh doanh.
- **Trạng thái:** Bản 1.5.4 (18/10/2026) – anh chốt dùng tạm bản này, **đưa lên web 18/10** (Active, Nổi bật).
- **Trên web:** link `/tools/xu-ly-hoa-don/` (nút Tải bản offline = `/tools/xu-ly-hoa-don/index.html`). Bản ghi database dùng lại slug **`hoa-don-thue`** (anh đã đặt tên "Bộ công cụ hóa đơn thuế" trong Quản trị – giữ nguyên), Active, Nổi bật; ẩn `tai-hoa-don-hang-loat` và `doc-hoa-don-xml` vì đã gộp vào bộ này – migration `_mig_tools_v7` trong `src/core.js`. Ảnh giao diện `site/public/assets/tools/hoa-don-thue.jpg`.
- **Cập nhật lên web:** PowerShell tại thư mục này → `.\cap-nhat.cmd` (chép `app/` sang `site/public/tools/xu-ly-hoa-don/` rồi deploy site).
- **Nghiên cứu, kiểm chứng kỹ thuật:** `../Tải, tra cứu hóa đơn/NGHIEN-CUU-B1.md`

## Cấu trúc
| Đường dẫn | Là gì |
|---|---|
| `app/index.html` | Công cụ hoàn chỉnh, 1 file, mở bằng Chrome là dùng (có cả nút bookmark) |
| `nguon/src/hd-core.js` | Lõi dùng chung: đọc/ghi ZIP, ghi Excel .xlsx, đọc XML hóa đơn, phân tích 4 sheet, nhật ký |
| `nguon/src/hd-misa.js`, `misa-templates.json` | Thẻ 5: dựng chứng từ theo 5 mẫu nhập khẩu MISA AMIS (tiêu đề cột lấy nguyên văn từ mẫu anh gửi, thư mục `Tải, tra cứu hóa đơn/Mẫu/`) |
| `nguon/src/hd-panel.js` | Bảng điều khiển chạy trên trang thuế (nút bookmark) |
| `nguon/src/app.html`, `style.css` | Trang công cụ (thẻ 1–5) |
| `nguon/build.js` | Ráp file: `npm i terser@5.31.0` rồi `node build.js` (chạy trong thư mục `nguon`, cần tạo `build/`) |
| `nguon/build/bookmarklet.txt` | Mã nút bookmark (dán vào ô URL khi tạo dấu trang bằng tay) |

## Cách hoạt động (đã kiểm chứng 17/10/2026 trên tài khoản DN thật)
- Nút bookmark chạy ngay trên trang thuế, dùng phiên đăng nhập sẵn có (cookie `jwt`, sống ~24 giờ). Không hỏi, không lưu mật khẩu.
- Gọi `/api/query/invoices/sold|purchase` (HĐĐT) và `/api/sco-query/...` (máy tính tiền), mỗi lần ≤ 1 tháng, 50 HĐ/trang, lật bằng `state`.
- **Bắt buộc gửi header** `Action` (tên thao tác, encodeURIComponent), `End-Point: /tra-cuu/tra-cuu-hoa-don`, `request-id` (UUID). Thiếu → 403 "Hệ thống phát hiện hành vi không hợp lệ".
- Tải `/api/(sco-)query/invoices/export-xml?nbmst&khhdon&shdon&khmshdon` → ZIP (invoice.xml + invoice.html + ảnh + details.js).
- Mua vào "Tất cả kết quả kiểm tra" gọi không kèm `ttxly` (tháng 9/2026: 12 HĐ = 4 đã cấp mã + 8 không mã). Nếu máy chủ từ chối, công cụ tự tách gọi mã 5, 6 (MTT: 8) và nhớ lại.
- Nghỉ 250 ms giữa các lần tải (~0,7 s/HĐ). Lỗi mạng/5xx thử lại 2–4–8 s; bị chặn 403 chờ 5–10–20 s; hết phiên (401) tạm dừng, cho đăng nhập lại rồi "Tiếp tục tải" hoặc "Lưu phần đã tải".

## File ZIP nhận về
`HoaDon_BanRa|MuaVao_<MST>_<ddmmyyyy>-<ddmmyyyy>.zip` gồm: `XML/` (tên `yyyymmdd_KyHieu_So8_TEN-DOI-TAC.xml`), `GOC/` (nếu tick giữ gói gốc), `Bang-ke-hoa-don.xlsx`, `danh-sach.json` (trạng thái HĐ từ trang thuế, thẻ 2 đọc lại), `HD-chua-tai-duoc.txt` (nếu có), `nhat-ky.txt`.

## Quy tắc số liệu (anh duyệt 17/10/2026)
- HĐ **đã bị thay thế / đã bị hủy**: vẫn liệt kê, cột "Tính vào tổng" = Không, không cộng vào tổng và sheet thuế suất. HĐ bị điều chỉnh vẫn tính.
- Trùng (cùng MST bán + mẫu + ký hiệu + số) chỉ tính 1 lần. Cảnh báo lệch khi tổng dòng hàng ≠ tổng chưa thuế quá 1 đ; cảnh báo HĐ ngoại tệ.
- Ngày luôn dd/mm/yyyy (Excel lưu kiểu ngày thật, định dạng dd/mm/yyyy).

## Đã kiểm thử
- Trên trang thuế thật: tra cứu 4 loại, lật 9 trang (446/446 HĐ), tải ZIP bán ra/mua vào/MTT mua vào, 12 lần tải liên tiếp không bị chặn.
- Trên trang thuế giả (Playwright, `mock_test.py`): 120 HĐ/2 tháng, 1 lần bị chặn (tự chờ), 1 HĐ lỗi 500 (ghi danh sách chưa tải), hết phiên giữa chừng (tạm dừng → tiếp tục) → ZIP đúng 119 XML + Excel 4 sheet (mở bằng openpyxl), nhật ký không lộ phiên đăng nhập.
- Thẻ 2 đọc lại ZIP: 118 HĐ tính vào tổng + 1 bị thay thế loại trừ; xuất Excel. Thẻ 3: in 3 HĐ bản gốc (QR, chữ ký giữ nguyên).
- **Chưa kiểm:** chạy trọn vòng bằng nút bookmark trên tài khoản thật (anh test); HĐ máy tính tiền bán ra (tài khoản chưa có); tải >150 HĐ liên tục trên máy chủ thật; Firefox/Safari.

## Sửa lỗi bản 1.1.1 (17/10/2026 – anh so với công cụ khác, Q3/2026 mua vào MST 0111403942: mình 49/56, công cụ khác 61)
- **Cổng thuế trả thiếu HĐ không ổn định:** cùng lệnh tra MTT mua vào 9/2026 lúc 18:18 trả 11 HĐ, lúc 18:34 trả 16 HĐ (đã kiểm trực tiếp). Lọc `ttxly==8` chỉ ra 11. → Mỗi tháng tra chính + tra bổ sung theo mã kết quả kiểm tra (HĐĐT: 5, 6; MTT: 8), gộp bỏ trùng; nếu bổ sung tìm thêm thì tra lại lần chính 1 lần nữa. Nhật ký ghi `[DOI SOAT]`. Bỏ cơ chế tự dò có ghi nhớ (`qtt-hd-muaTatCa`).
- **"Không tồn tại hồ sơ gốc của hóa đơn." (HTTP 500)** ở HĐ không mã của điện lực, ngân hàng, viễn thông (công cụ khác cũng gặp): không thử lại; vẫn đưa vào bảng kê bằng số tổng của danh sách tra cứu (`noXml`), file `HD-khong-co-XML-goc.txt`, `danh-sach.json` mang theo `listOnly` để thẻ 2 đọc lại; thẻ 5 báo cần nhập tay chi tiết vào MISA.

## Thẻ 5 – File nhập MISA AMIS Kế toán (bản 1.1.0)
- 5 mẫu: Mua hàng trong nước (nhập kho / không qua kho), Mua dịch vụ, Nghiệp vụ khác (mua vào); Bán hàng, Bán dịch vụ (bán ra). File xuất giữ nguyên 6 dòng hướng dẫn, dòng nhóm cột (dòng 7), tiêu đề cột dòng 8, dữ liệu từ dòng 9.
- **Quy tắc anh chốt 17/10:** mặc định TK công nợ 331 · TK thuế 1331 · "Chưa thanh toán" · nhóm HHDV 1; loại hàng hóa/dịch vụ do công cụ gợi ý, người dùng xác nhận; chiết khấu thương mại (dòng tính chất 3) phân bổ vào cột "Tiền chiết khấu" của các dòng cùng thuế suất; không đủ ĐK khấu trừ do người dùng tick (nhóm 4), công cụ cảnh báo HĐ thanh toán tiền mặt từ 5 triệu; HĐ 8% kê theo thuế suất 8%.
- Ghép mã: bảng đối tác (mã NCC/KH) + bảng mặt hàng (loại, mã, TK) – ô trống tô đỏ, không tự đoán; nút "Dùng MST làm mã" do người dùng bấm. Cách ghép nhớ theo MST trên trình duyệt; có Sao lưu/Nạp cách ghép (.json).
- Thuế từng dòng: lấy trên HĐ nếu có, không thì tính (thành tiền − CK) × thuế suất, rồi khớp lại tổng thuế theo thuế suất của HĐ.
- HĐ bị thay thế/hủy không đưa vào file nhập. 1 HĐ có cả hàng hóa và dịch vụ → tách thành 2 chứng từ (cần KTT xác nhận cách này hợp lệ trong MISA).
- **Cần KTT kiểm khi nhập thử vào MISA:** (1) Mẫu số/Ký hiệu HĐ TT78 nhập dạng "1" + "C26TAA" hay "1C26TAA" (có tùy chọn ghép); (2) Nghiệp vụ khác: có cần dòng hạch toán thuế riêng 1331/331 không (tùy chọn, mặc định Có); (3) Mua không qua kho dùng cột "Số chứng từ ghi nợ" (MH0001), để trống "Số phiếu nhập"; (4) Dòng ghi chú trên HĐ bị bỏ ở mẫu Mua hàng (mẫu không có cột ghi chú).
- Kiểm thử (Playwright, `misa_test.py`, `misa_test2.py`): HĐ thử có CK thương mại, 8%/10%/KCT, dòng ghi chú, tiền mặt ≥ 5 triệu → tiêu đề cột 5 file khớp 100% mẫu, CK 200.000 phân bổ 109.091 + 90.909, thuế dòng cộng đúng 160.000.

## Bản 1.5.0 (18/10/2026 – góp ý vòng 3 của anh)
- **Tải hàng loạt:** khi quét hiện khung Đốm cầm kính lúp (chuyển động nhẹ) + thanh tiến độ % + dòng "Hệ thống tự động quét tối đa 3 lần để đảm bảo đủ hóa đơn" (thường 2 lần là ổn định, lần 3 chỉ chạy khi lần 2 còn tìm thêm). Sửa lỗi ô ngày: gõ nhanh liền 8 số đôi khi bị lệch ô (do lệnh bôi đen chạy trễ).
- **XML → Excel:** có cả mua vào và bán ra thì bảng kê tách 2 sheet "Bảng kê mua vào", "Bảng kê bán ra" (STT, dòng tổng riêng).
- **Tờ khai:** HĐ không có XML gốc bấm số HĐ → trang giải thích cổng thuế không lưu bản gốc + cách lấy (email/tra cứu người bán, tải XML bổ sung); HĐ đã bổ sung XML thì mở đúng hóa đơn. Cột thuế suất bấm để sửa tay (gõ hoặc chọn 0%, 5%, 8%, 10%, KCT, KKKNT) → nút ✓, nhãn "gợi ý" mất, tờ khai tính theo thuế suất đã sửa (nhớ theo MST; để trống = quay lại gợi ý). Khung "Thông tin ghi trên file XML tờ khai" luôn mở, lưới 3×3 thẳng hàng, nút xanh "Lấy từ XML tờ khai kỳ trước" góc phải: chỉ điền ô còn trống + [22] = [43] kỳ trước, các ô vẫn sửa tay.
- **Tạo file nhập lên Misa** (đổi tên thẻ 5): hàng hóa hiện từng dòng theo hóa đơn (cùng mặt hàng trong 1 HĐ gộp 1 dòng); mã MISA dùng chung theo mặt hàng (sửa 1 dòng, các dòng cùng mặt hàng tự cập nhật), Loại/TK/xác nhận riêng từng dòng (lưu map.lines). Lọc theo tên hàng, theo số HĐ (gợi ý danh sách HĐ); "Chọn tất cả dòng đang lọc", "Chọn hết hàng hóa cùng hóa đơn", áp dụng hàng loạt (dòng đủ thông tin tự xác nhận). Cột Xác nhận: nút ✓ chỉ bấm được khi đủ mã + TK; bấm xong dòng ẩn ngay nếu đang tick "Chỉ hiện dòng còn thiếu dữ liệu". Q3/2026: 218 dòng.

## Sửa lỗi bản 1.4.1 (18/10/2026 – KTT phát hiện [23] Q3/2026 mua vào bị cộng thừa chiết khấu)
- Nguyên nhân: tờ khai và sheet "Tổng hợp thuế suất" lấy giá trị theo bảng tổng hợp thuế suất trong XML (LTSuat/ThTien). HĐ C26MSW-7720 (CTY TNHH BBQ Việt Nam) ghi ở đó 358.334 = giá trị TRƯỚC chiết khấu, trong khi tổng chưa thuế của HĐ (TgTCThue) là 322.501 (đã trừ CK 35.833). HĐ C26MLT-12869 ghi đúng 610.000 nên không bị. Rà cả 54 XML Q3: chỉ HĐ 7720 lệch.
- Sửa: hàm chung HDCore.tachTS – tổng của HĐ là chuẩn; chênh lệch đúng bằng các dòng chiết khấu (tính chất 3) thì trừ theo từng thuế suất, không thì phân bổ theo tỷ lệ; tiền thuế cũng khớp TgTThue. Dùng cho tờ khai, bảng kê, phụ lục NQ 204, sheet Tổng hợp thuế suất.
- Kết quả Q3/2026: [23] = 59.784.986, [24] = 4.182.740 = đúng tổng "Tổng chưa thuế"/"Tiền thuế" của 61 HĐ (trước đây [23] thừa 35.833).

## Bản 1.4.0 (18/10/2026 – sửa theo góp ý của anh)
**A. Tải hàng loạt (nút bookmark – cần kéo lại nút)**
- Bảng điều khiển rộng 720px, ra giữa màn hình; nút ⤢ mở rộng tối đa 1180px.
- Ô ngày 3 phần dd / mm / yyyy: gõ đủ tự nhảy ô (01 → tháng → năm → ô "Đến ngày"); gõ 4–9 ở ngày hoặc 2–9 ở tháng tự thêm số 0; bấm / nháy đúp vào ô nào thì bôi đen ô đó để gõ đè, không đẩy số sang ô khác; dán "01/07/2026" tự tách.
- Khi quét chỉ hiện: "Đang quét lần 1…", "Đang quét lần 2 để đảm bảo đầy đủ…", "Sắp xong rồi…". Xong: "Đã quét N lượt." + (khoảng ngày > 1 tháng) khuyến nghị bấm "Quét lại 1 lượt".
- Bỏ dòng chân trang và file nhat-ky.txt trong ZIP. Người hỗ trợ vẫn lấy được nhật ký bằng phím **Ctrl+Alt+L** (trên bảng điều khiển hoặc trang công cụ).
- Trang công cụ thẻ 1: trình bày dọc (hướng dẫn 3 bước trải ngang → ảnh bảng điều khiển nét gấp đôi); bỏ đoạn "Đốm tự lật…"; câu bảo mật không nhắc Quản trị tử tế.
**B. Chung**
- Danh sách file dùng chung thẻ 2, 4, 5: từng file có nút × để gỡ, "+ Thêm file", "Gỡ tất cả".
- Thẻ 2: nút "Tải lên file XML bổ sung" ở mục Cần xem lại; XML khớp HĐ "không có XML gốc" thì thay thế, cảnh báo tự mất; gỡ file thì quay lại như cũ.
- Chân trang mọi thẻ: nút "← Quay lại Bộ công cụ" (quantritute.com/cong-cu; chạy trên web thì /cong-cu). Xưng hô "bạn" → "anh/chị".
**C. Tờ khai**
- Ô nhập số tự thêm dấu chấm hàng nghìn ngay khi gõ.
- Bảng HĐ không có XML gốc trong kỳ: tổng chưa thuế, tiền thuế, nút "Tải XML bổ sung", thuế suất (gợi ý theo tỷ lệ thuế/giá trị, nhãn "gợi ý"); bổ sung XML → lấy thuế suất thật, nhãn "Đã bổ sung", nút Gỡ để quay lại.
- Nút "Tải file XML tờ khai": cấu trúc theo file mẫu HTKK 5.8.1 anh gửi (maTKhai 842, TT 80/2021, pbanTKhaiXML 2.8.3), có phụ lục PL_NQ142_GTGT (giảm thuế 8%), ct9 = thuế được giảm bán ra − thuế mua vào 8% (khớp file mẫu). Thông tin NNT/cơ quan thuế nhập 1 lần (nhớ theo MST) hoặc "Lấy nhanh từ XML tờ khai kỳ trước" (tự điền [22] = [43] kỳ trước).
- CHƯA kiểm chứng: HTKK/eTax có nhận file này không; kỳ tháng (kieuKy M, kyKKhai mm/yyyy) chưa có file mẫu; trường ttinNhaCCapDVu chép từ file mẫu HTKK. Mẫu TT 89 chưa có XML: nếu [32b]/[34a] khác 0 thì chặn xuất.
**D. File nhập MISA**
- Thiết lập: các ô TK chọn từ danh sách tài khoản (gõ số/tên để tìm); TK kho ưu tiên 1561; TK chi phí ưu tiên 6421, 6422, 242. Tên TK theo TT 133 (6421 Chi phí bán hàng, 6422 Chi phí QLDN) – doanh nghiệp theo TT 200 cần lưu ý 6421 khác nghĩa.
- NCC: "Tải lên danh mục NCC từ MISA" (.xlsx/.csv; .xls cần lưu lại thành .xlsx) → đối chiếu MST, điền mã, ẩn NCC đã có; thêm cột Địa chỉ, TK công nợ (mặc định 331, sửa được, dùng khi xuất chứng từ); "Xuất Excel danh mục NCC" theo mẫu mau_danh_muc_nha_cung_cap.
- Hàng hóa: hiện toàn bộ (tick "Chỉ hiện dòng còn thiếu dữ liệu"), cột Số HĐ (bấm mở hóa đơn ở tab mới), ô tick chọn + "Chọn hết hàng hóa cùng hóa đơn" + áp dụng Loại/TK hàng loạt; "Tải lên danh mục hàng hóa, dịch vụ từ MISA" (khớp theo mã trên HĐ hoặc tên) → điền mã, bỏ nhãn gợi ý, nhãn MISA; "Xuất Excel danh mục hàng hóa" theo mẫu mau_danh_muc_vat_tu_hang_hoa (bỏ dòng Nghiệp vụ khác và dòng đã có trong MISA).
- Quy ước: đồ ăn uống, xăng dầu, vé máy bay, phí ngân hàng → gợi ý Nghiệp vụ khác, ô mã ghi "Không cần sinh mã" (xám). Nhận diện theo tên hàng, tên người bán, và hóa đơn có ≥ 40% dòng là đồ ăn uống. Q3/2026 MST 0111403942: 129/149 mặt hàng gợi ý Nghiệp vụ khác.
- Mục Hóa đơn mua vào: bấm số HĐ mở hóa đơn ở tab mới (có gói gốc GOC thì mở bản gốc cổng thuế, không có thì bản xem dựng từ XML).
- CHƯA kiểm chứng: định dạng file danh mục MISA xuất ra (tiêu đề cột), giá trị cột "Thuế suất GTGT (%)" MISA chấp nhận (đang ghi 8, 10, KCT…).

## Bản 1.3.0 – Tra cứu hóa đơn theo mẫu người bán (mức A, anh duyệt 17/10/2026)
- Mục tiêu: xem hóa đơn đúng bản thể hiện người bán gửi khách qua email (như "Gợi ý tra cứu" của phần mềm Save Invoice), không cần máy chủ trung gian.
- Thẻ 2 thêm sheet thứ 5 "Tra cứu mẫu người bán" (cả trong Excel của nút bookmark): Mã tra cứu (bấm để sao chép), Trang tra cứu (bấm mở), Nhà cung cấp HĐĐT, ghi chú. XML không ghi trang tra cứu → nút "Tìm trang tra cứu" (Google theo tên người bán).
- Cách đọc: MST nhà cung cấp (MSTTCGP) + các thẻ TTKhac. Lập từ 54 XML thật (Q3/2026 mua vào MST 0111403942):

| Nhà cung cấp (MSTTCGP) | Số HĐ | Trường mã tra cứu | Trang tra cứu | Căn cứ link |
|---|---|---|---|---|
| 0101300842 | 15 | "Mã TC" | "ĐCTC" trong XML (5/15 có) | ghi trong XML |
| 0101360697 – Bkav | 16 | KHÔNG có trong XML | tracuu.ehoadon.vn | in trên PDF người bán gửi |
| 0100684378 – VNPT | 6 | Fkey | mỗi người bán 1 trang riêng | – |
| 0101243150 – MISA | 5 | TransactionID | meinvoice.vn/tra-cuu | helpact.misa.vn (người mua tra theo mã) |
| 0106026495-001 | 5 | "Mã tra cứu" | chưa rõ | – |
| không ghi MSTTCGP | 3 | Fkey | chưa rõ | – |
| 0100109106 – Viettel | 3 | SearchKey (1/3), PortalLink (1/3) | vinvoice.viettel.vn/utilities/invoice-search | ảnh chụp Save Invoice |
| 0102519041 | 1 | không có | – | – |
| (không có XML gốc) | 7 | – | – | – |

- Kết quả: 37/61 HĐ có mã tra cứu; 16 HĐ Bkav có trang tra cứu nhưng mã chỉ có trong email/PDF.
- CHƯA kiểm chứng: tên nhà cung cấp của MST 0101300842, 0106026495-001, 0102519041 (để nguyên MST); tên "VNPT" cho 0100684378 và "Viettel" cho 0100109106 theo hiểu biết chung, chưa đối chiếu văn bản. Chưa thử mở từng trang tra cứu với mã thật.
- Không làm mức C (tự tải PDF hàng loạt): cần máy chủ trung gian, phá cam kết "hóa đơn không rời máy".

## Bản 1.2.4 (17/10/2026 – anh test 1.2.3 ra đúng 61 HĐ)
- Thêm nút "Quét lại lần 2" (không bắt buộc) cạnh nút Tìm: tra lại đúng điều kiện, gộp với kết quả đã có. Khoảng ngày > 1 tháng thì nút tô màu và có dòng khuyến khích. Sau mỗi lần quét báo "tìm thêm N HĐ – nên quét thêm" hoặc "không có HĐ mới – danh sách đã đầy đủ".

## Sửa lỗi bản 1.2.3 (17/10/2026 – anh test 1.2.2: lỗi "Khoảng thời gian tìm kiếm không được lớn hơn 1 tháng"; anh yêu cầu không để người dùng đợi lâu)
- Nguyên nhân lỗi: bản 1.2.2 nới mỗi khoảng tra thêm 1 ngày hai đầu (vd 30/06–01/08) → vượt giới hạn 1 tháng của cổng. Trang thuế giả cũ không kiểm giới hạn này nên không bắt được → đã thêm kiểm tra giới hạn 1 tháng vào trang thuế giả.
- Sửa: giữ nguyên khoảng tra theo tháng; chỉ tra thêm đúng 1 ngày liền trước ngày bắt đầu (bắt HĐ lập trước 7h sáng ngày đầu kỳ, do cổng lưu giờ UTC), rồi lọc lại theo ngày VN.
- Giảm số lượt: lượt 1 (theo tháng) + lượt 2 kiểm tra (nửa tháng, đổi chiều sắp xếp); chỉ khi lượt 2 tìm thêm HĐ mới tra lượt 3. Tối đa 3 lượt (bản 1.2.1–1.2.2: 3–5 lượt). Q3 khoảng 30 lệnh tra, vài giây.
- Bấm "Tìm hóa đơn" lần nữa với đúng điều kiện cũ → GỘP với kết quả trước (không mất HĐ đã tìm thấy), báo "tìm thêm N HĐ mới".
- Kiểm thử trang thuế giả (có giới hạn 1 tháng, ngày UTC, HĐ biên): 0 lỗi 1 tháng; 15/15 kịch bản đủ 120/120 sau tối đa 2 lần bấm. Kịch bản rất xấu (60% lệnh tra rơi 20% HĐ): 4/12 lần bấm đầu thiếu 1 HĐ mà không cảnh báo được → bấm lại lần 2 đủ cả 12.

## Sửa lỗi bản 1.2.2 (17/10/2026 – anh test bản 1.2.1 Q3/2026 MST 0111403942: 60 HĐ = 23 điện tử + 37 MTT; công cụ khác 61 = 23 + 38)
- Phát hiện: cổng thuế trả ngày lập (tdlap) theo giờ UTC. Bằng chứng: K26TDV-319742 cổng trả 01/07, công cụ khác/XML ghi 02/07; C26MNE-3172 (MTT) trả 29/09, thực tế 30/09. Hệ quả: (1) cột Ngày, tên file, HD-chua-tai-duoc.txt lệch lùi 1 ngày với HĐ lập trước 7h sáng; (2) nếu máy chủ so điều kiện ngày theo UTC thì HĐ lập ngày đầu kỳ trước 7h sáng (giờ VN) bị loại khỏi kết quả tra.
- Sửa: đổi tdlap sang giờ VN (UTC+7) khi hiển thị/đặt tên file; (cách nới 1 ngày hai đầu gây lỗi giới hạn 1 tháng → đã thay ở bản 1.2.3).
- CHƯA khẳng định HĐ MTT còn thiếu là HĐ đầu kỳ (ứng viên: C26MTT-6706 ngày 01/07/2026) – cần bảng kê/nhật ký lần chạy 60 HĐ để đối chiếu.
- Kiểm thử cổng giả: thêm HĐ biên (01/08 trước 7h sáng, 31/07 23h, 01/10 2h sáng) – đủ 120/120, loại đúng 2 HĐ ngoài kỳ, 15/15 kịch bản.

## Sửa lỗi bản 1.2.1 (17/10/2026 – KTT test Q3/2026: lần đầu 57 HĐ, bấm lại 61)
- Hiện tượng: cổng thuế trả thiếu không ổn định cho cùng điều kiện tra (đã gặp 3 lần: MTT 9/2026 11→16; Q3 mua vào 56/57 → 61). Nhật ký 17/10 cho thấy mỗi tháng chỉ 1 trang (≤ 50 HĐ) → KHÔNG phải lỗi lật trang. Nguyên nhân phía máy chủ chưa xác định (giả thuyết: bộ nhớ đệm hoặc các máy chủ tìm kiếm chưa đồng bộ) – CHƯA kiểm chứng.
- Cách xử lý (không phụ thuộc nguyên nhân): tra nhiều lượt, mỗi lượt đổi cách chia ngày (1, 2, 3, 4, 6 đoạn/tháng) và chiều sắp xếp (giảm/tăng dần) để không nhận lại kết quả cũ; gộp bỏ trùng; dừng khi 2 lượt liền nhau không thêm HĐ nào (tối thiểu 3, tối đa 5 lượt). Hết 5 lượt vẫn còn thêm → cảnh báo đỏ.
- Thêm: so số HĐ nhận được với "total" máy chủ báo, thiếu thì tra lại (tối đa 2 lần); ghi total vào nhật ký.
- Kiểm thử cổng giả 15 kịch bản (bộ nhớ đệm trả thiếu, total đúng nhưng thiếu dữ liệu, 12 lần ngẫu nhiên 60% lệnh tra bị rơi 20% HĐ): cả 15 lần đều đủ 120/120. Thời gian tra tăng khoảng 3–5 lần (vài giây với 1 quý vài chục HĐ).
- Giới hạn: nếu cổng thuế thiếu cùng một HĐ ở mọi lượt thì không công cụ nào tự phát hiện được → vẫn nên đối chiếu số lượng với tra cứu trên cổng / công cụ khác ở kỳ quan trọng.

## Thẻ 4 – Tờ khai 01/GTGT (bản 1.2.0)
- Nguồn: hóa đơn đã nạp ở thẻ 2 (cần cả ZIP bán ra và mua vào của kỳ). Chọn tháng/quý, năm, mẫu TT 89/2026 hoặc TT 80/2021 (QĐ 1934/QĐ-BTC cho dùng mẫu cũ khi HTKK/eTax chưa nâng cấp).
- Tự tính: [21] (X khi kỳ không có HĐ), [23], [24], [25], [26], [29]–[33], [32a], [27], [28], [34], [35], [36], [40a], [40], [41], [43]. Tự nhập: [22], [32b], [34a], [37], [38], [39a], [40b], [42] (nhớ theo MST + kỳ).
- Công thức TT 89: [27]=[29]+[30]+[32]+[32a]−[32b]; [34]=[26]+[27]+[34a]. Lưu ý: nhãn file mẫu MISA Q2 không ghi −[32b] → để KTT xác nhận.
- HĐ 8% (NQ 204/2025/QH15) kê vào [32]/[33] với số thuế thực tế; phụ lục giảm thuế: mục I mua vào (giá trị × 8%, anh xác nhận), mục II bán ra (giá trị × 2%). Dòng hàng được co giãn cho khớp tổng 8% của HĐ (trừ chiết khấu thương mại ghi dòng riêng).
- Mua vào: nhóm theo thẻ 5 (mặc định nhóm cài đặt); tick "Không đủ ĐK khấu trừ" → nhóm 4, vào [23]/[24] nhưng không vào [25].
- Không kê HĐ bị thay thế/bị hủy; HĐ không có XML gốc dùng số tổng cổng thuế trả (nếu cổng không trả số chưa thuế/thuế → cảnh báo đỏ, phải nhập tay).
- Chưa tự cộng: [23a]/[24a] hàng nhập khẩu (tờ khai hải quan), chứng từ khác ngoài HĐ điện tử trên cổng.
- Excel xuất: Tờ khai, Bảng kê bán ra (5 nhóm), Bảng kê mua vào (5 nhóm), Phụ lục giảm thuế NQ 204. Là bảng đối chiếu để nhập HTKK/eTax, KHÔNG phải file XML nộp thẳng.
- Kiểm thử (dữ liệu mock Q3/2026): [32]/[33], [23]/[24], phụ lục mục I khớp 100% với tổng LTSuat tính độc lập từ XML; đổi mẫu TT80, tháng/quý, [41]/[43], nhóm 4, nhớ số nhập theo kỳ, màn hình 390px – đạt.

## Kiểm tra trước khi đưa lên web
- [ ] Anh chạy thử nút bookmark trên tài khoản thật, gửi nhat-ky.txt nếu lỗi
- [ ] Ảnh giao diện 1280×720 theo quy trình mới công cụ
- [ ] Bản ghi database `_mig_*` theo `claude/quy-trinh-moi-cong-cu.md`

## Nhật ký
| Ngày | Việc |
|---|---|
| 17/10/2026 | Nghiên cứu, kiểm chứng API, giao diện 0.1 (anh duyệt), bản 1.0.0 thẻ 1–3 |
| 18/10/2026 | Bản 1.5.0: góp ý vòng 3 (Đốm quét + tiến độ, tách bảng kê, sửa thuế suất tay, bố cục XML tờ khai, MISA theo từng dòng HĐ + lọc + ✓) |
| 18/10/2026 | Bản 1.4.1: sửa [23] cộng thừa chiết khấu khi XML ghi bảng thuế suất trước CK |
| 18/10/2026 | Bản 1.4.0: sửa theo 27 góp ý (A1–8, B1–4, C1–4, D1–5) |
| 17/10/2026 | Bản 1.3.0: sheet Tra cứu mẫu người bán (mã + trang tra cứu đọc từ XML) |
| 17/10/2026 | Bản 1.2.4: anh test Q3 đúng 61 HĐ; thêm nút Quét lại lần 2 |
| 17/10/2026 | Bản 1.2.3: sửa lỗi vượt 1 tháng, tối đa 3 lượt tra, Tìm lại thì gộp |
| 17/10/2026 | Bản 1.2.2: đổi giờ UTC → VN, nới biên ngày khi tra (anh test 60/61) |
| 17/10/2026 | Bản 1.2.1: tra nhiều lượt đến khi ổn định + đối chiếu total (KTT gặp 57→61) |
| 17/10/2026 | Bản 1.2.0: thẻ 4 tờ khai 01/GTGT (TT 89/2026, chọn được mẫu TT 80), bảng kê, phụ lục giảm thuế NQ 204 |
| 17/10/2026 | Bản 1.1.1: tra đối soát (cổng thuế trả thiếu HĐ), HĐ không có XML gốc vẫn vào bảng kê |
| 17/10/2026 | Bản 1.1.0: thẻ 5 file nhập MISA (5 mẫu), sửa ghi Excel có dòng hướng dẫn phía trên |

