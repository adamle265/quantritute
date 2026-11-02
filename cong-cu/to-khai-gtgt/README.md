# Bảng kê & Tờ khai thuế GTGT từ Excel

> Tên chốt 29/10/2026 (anh Phương đồng ý để công cụ miễn phí trong kho công cụ). Tên cũ: "Bảng kê & Tờ khai thuế GTGT". Tên trong database sửa ở Quản trị → Công cụ.

- **Slug:** `to-khai-gtgt` (link web khi đưa lên: `/tools/to-khai-gtgt/`)
- **Nhóm:** Kế toán – tài chính
- **Nguồn đặt hàng:** anh Phương (kế toán, đang dùng MISA AMIS) – 28/10/2026. Khách hàng đầu tiên chủ động đặt công cụ riêng.
- **Nỗi đau:** AMIS đã lập được tờ khai nhưng kế toán cần 1 công cụ độc lập để lập lại và **double check** từ chính danh sách hóa đơn trên cổng thuế.
- **Đầu vào:** các file "DANH SÁCH HÓA ĐƠN" (.xlsx) xuất ở hoadondientu.gdt.gov.vn (bán ra / mua vào; HĐ có mã, không mã, máy tính tiền). File mẫu anh Phương gửi: `../Tạo tờ khai thuế/` (MST 0401409569, tháng 09/2026 – dữ liệu thật của khách, KHÔNG đưa lên web).
- **Trạng thái:** **Bản 1.0.0 – đưa lên web chung 29/10/2026 (anh chốt 09:18), chờ anh chạy lệnh.** Link `/tools/to-khai-gtgt/`, bản ghi database slug **`to-khai-gtgt`** (mới – trên web chưa có cuốn Coming soon cùng chủ đề), nhóm Kế toán – tài chính, Active, Free, chưa Nổi bật; migration `_mig_tools_v11` (bản lưu `nguon/mig-v11.js`). Ảnh giao diện `site/public/assets/tools/to-khai-gtgt.jpg` (dữ liệu giả MST 0123456789). Bài hướng dẫn SEO `/huong-dan/lap-bang-ke-va-soat-to-khai-gtgt-tu-danh-sach-hoa-don/`. Góp ý trong công cụ → Quản trị → Góp ý (tool `to-khai-gtgt`).
- **Bản link claude.ai:** `node build.js` tạo thêm `build/artifact.html` (bỏ khung html/head, bỏ qtt-track). Tải file qua quyền `downloads` của trang; file XML tờ khai được nén thành .zip (trang không cho tải .xml).

## Cấu trúc
| Đường dẫn | Là gì |
|---|---|
| `app/index.html` | Công cụ hoàn chỉnh 1 file, mở bằng Chrome/Edge là dùng |
| `nguon/src/tk-ds.js` | Lõi: đọc danh sách, nhận bán/mua, bỏ trùng, suy thuế suất, tính tờ khai, dựng bảng kê 2 sheet, đọc XML tờ khai để đối chiếu |
| `nguon/src/app.html`, `app.js` | Giao diện 3 bước |
| `nguon/build.js` | Ráp file: `node build.js` trong `nguon/` → `build/index.html`, chép sang `app/` |
| `nguon/test1.py`, `test2.py` | Kiểm thử Playwright với 4 file mẫu |

**Dùng lại (chỉ đọc, không sửa):** `../xu-ly-hoa-don/nguon/src/hd-core.js` (đọc/ghi xlsx), `hd-tokhai.js` (dòng tờ khai, bảng kê nhóm, XML HTKK), `style.css`, `dom.json`. Sửa các file đó ở Bộ xử lý hóa đơn thì build lại công cụ này.

## 3 bước
1. **Nạp danh sách:** kéo thả nhiều file; tự nhận MST doanh nghiệp (MST đứng yên ở cột bán/mua), tự nhận bán ra/mua vào, HĐ điện tử/máy tính tiền, khoảng ngày; chọn tay "Nhận là" nếu cần; báo loại danh sách còn thiếu.
2. **Bảng kê tổng hợp:** xem/lọc từng HĐ; sửa/tách thuế suất; bỏ tick khấu trừ; **tải Excel 2 sheet "HĐ mua vào", "HĐ bán ra"** (loại HĐ, đủ cột của cổng thuế, thuế suất, tính vào TK, được khấu trừ, tách giá trị/thuế theo 0%/KCT/5%/8%/10%, ghi chú, file nguồn, dòng tổng).
3. **Tờ khai 01/GTGT:** TT 89/2026 hoặc TT 80/2021; chỉ tiêu tự nhập nhớ theo kỳ; Excel (tờ khai + bảng kê theo nhóm + PL NQ 204 [+ sheet Đối chiếu]); XML cấu trúc HTKK; **đối chiếu** với XML tờ khai AMIS/HTKK hoặc gõ số → lệch chỉ tiêu nào, gợi ý nguyên nhân.

## Quy tắc số liệu
- HĐ "đã bị thay thế", "đã bị hủy", CQT từ chối: liệt kê, không tính. "Đã bị điều chỉnh": tính. "Điều chỉnh": tính theo dấu trên danh sách + cảnh báo.
- Trùng (MST bán + mẫu + ký hiệu + số): tính 1 lần.
- Thuế suất suy từ Thuế/Chưa thuế: khớp 10%/8%/5% (sai số ≤ max(1,5 đ; 0,1%)) → lấy; không khớp → tách 2 mức kề nhau trong {0, 5, 8, 10} bằng giải hệ 2 ẩn, đánh dấu **ước tính**; Thuế = 0 → bán ra "KCT" (ước tính, cần xác nhận), mua vào "0%/KCT". Người dùng xác nhận ✓ hoặc nhập tách tay (tổng phải khớp HĐ); nhớ theo MST trên trình duyệt.
- Mua vào: [23]/[24] = mọi HĐ tính; [25] trừ HĐ bỏ tick khấu trừ (nhóm 4). Cảnh báo HĐ tổng thanh toán ≥ 5 triệu (cần chứng từ TT không dùng tiền mặt).
- PL NQ 204: danh sách không có tên hàng → 1 dòng tổng mua vào (giá trị × 8%) và 1 dòng bán ra (giá trị × 2%), tên dòng sửa được.

## Bản 1.0.4 (30/10/2026 12:20 – góp ý: thuế suất HĐ sửa sai nhập tay mặc định 10%, chưa theo HĐ gốc)
- Khung "Thêm hóa đơn sửa sai lập kỳ sau": khi tìm thấy HĐ gốc trong danh sách đã nạp, ô **Thuế suất** tự lấy theo HĐ gốc (tiền thuế tự tính lại nếu chưa gõ tay). HĐ gốc nhiều mức → chọn mức có tiền chưa thuế lớn nhất + nhắc "nhiều mức – kiểm tra lại"; thuế suất HĐ gốc đang ước tính → nhắc kiểm tra. Không tìm thấy HĐ gốc → giữ như cũ (người dùng chọn).
- Kiểm thử `test17.py` (dữ liệu giả 8%, 10%), `test17b.py` (bộ T09 thật – chỉ chạy trên máy: 8%, 10%, 0%, HĐ 8% + 10%).

## Bản 1.0.3 (29/10/2026 21:50 – góp ý đầu tiên từ người dùng web: chị Mai Ngọc Hằng, 5/5★, đề xuất "Tick toàn bộ")
- Cột **Tính vào TK** có ô **"Tất cả (N)"** ở tiêu đề: tick / bỏ tick cùng lúc mọi HĐ **đang lọc** (cả HĐ chưa hiện do giới hạn dòng); ô hiện trạng thái nửa (–) khi lẫn Có/Không. Nút **"↺ mặc định"** (hiện khi có lựa chọn tay) đưa các HĐ đang lọc về mặc định theo trạng thái HĐ.
- Tick tất cả mà trong đó có HĐ đã bị thay thế / bị hủy / ngoài kỳ / thuộc khai bổ sung → thông báo số HĐ đó để kiểm tra lại.
- Kiểm thử `test15.py` (dữ liệu giả: lọc ≥ 5 triệu, bỏ 39 HĐ → [23] giảm, mặc định → về đúng số cũ), `test16.py` (bộ T09 thật – chỉ chạy trên máy: tick HĐ bị loại → cảnh báo; mặc định → [32]/[33] về đúng).

## Bản 1.0.2 (29/10/2026 10:45 – anh Phương báo "dữ liệu double 2 lần")
- Nguyên nhân: dòng HĐ nhập tay được lưu trên trình duyệt theo MST + kỳ (`qtt-tk-tay-<mst>-<kỳ>`, cố ý để không mất khi tải lại trang). Lần trước anh Phương đã thêm A-8, hôm nay thêm lại → 2 dòng; công cụ chưa chặn trùng và chưa báo rõ là có dòng lưu từ trước. Không phải lỗi nhân đôi khi đọc file.
- Sửa: chặn thêm dòng nhập tay trùng ký hiệu + số (+ MST nếu có) với dòng nhập tay đã có hoặc với HĐ đã có trong file đã nạp; khung cam "Đang có N dòng nhập tay … kể cả dòng thêm từ lần mở trước" + nút "Xóa tất cả dòng nhập tay … kỳ này" + cảnh báo đỏ nếu đang có dòng trùng; thông báo khi mở lại kỳ có dòng nhập tay đã lưu; mỗi dòng nhập tay ghi "thêm lúc hh:mm dd/mm/yyyy".
- Nút **↺ Làm lại từ đầu** (bước 1, cạnh "Gỡ tất cả file"): hỏi xác nhận bằng khung ngay dưới, xóa của MST đang chọn – mọi kỳ: dòng nhập tay (`tay-`), ô sửa/tick (`st-`), số gõ tay bước 3 (`in-`), số đối chiếu (`cmp-in-`); GIỮ file đã nạp, tên DN (`ten-`), thông tin CQT (`nnt-`), mẫu tờ khai, phụ lục. Kiểm thử `test14.py`.
- Kiểm thử: `test12.py` (thêm, thêm lại bị chặn, mở lại còn 1 dòng + thông báo, xóa tất cả), `test13.py` (2 dòng A-8 trùng có sẵn → cảnh báo trùng).

## Bản 1.0.1 (29/10/2026 10:30 – góp ý anh Phương: cách lấy giá trị mua chưa VAT như MISA)
- [23] mỗi HĐ mua vào: **HĐ công ty = Tổng tiền chưa thuế + Tổng tiền phí**; **HĐ hộ kinh doanh = Tổng tiền thanh toán** (hộ KD không có phần chưa VAT và VAT – lời anh Phương). Tự nhận HĐ hộ KD: ký hiệu mẫu số 2, hoặc không có tiền chưa thuế lẫn tiền thuế nhưng có tổng thanh toán; cột tick **HĐ hộ KD** ở bước 2 để sửa (nhớ theo MST, `st.hkd`).
- Bảng kê mua vào thêm cột "HĐ hộ kinh doanh", "Giá trị mua chưa VAT tính vào [23]" + dòng ghi chú cách tính; bảng web có dòng tổng [23] và ghi chú. Bảng kê theo nhóm trong Excel tờ khai dùng cùng giá trị.
- Kiểm thử (`test10.py`): T09/2026 [23] = 560.733.801 + phí 234.362 = **560.968.163**; dữ liệu giả có 1 HĐ hộ KD mẫu số 2 (1.500.000, không chưa thuế/thuế) → tự nhận, bỏ tick thì [23] giảm đúng 1.500.000.
- Mô tả trên web (migration v11, tính năng) thêm 1 dòng về cách tính này.
- Bộ lọc bước 2 thêm "HĐ hộ kinh doanh (mua vào)" để rà nhanh các HĐ đã tick/tự nhận (`test11.py`).

## Bản 1.0.0 – lên web chung (29/10/2026)
- Bỏ thẻ noindex; thêm nút **Góp ý cho Đốm** (POST /api/feedback, tool `to-khai-gtgt`; bản offline gửi kiểu no-cors như Ghép & đối chiếu); `qtt-track.js` đã có.
- Web: `src/core.js` (`MIGRATE_TOOLS_V11` + khoá `_mig_tools_v11`), `src/public-api.js` (TOOL_SLUGS), `admin/public/admin.js` (tên công cụ cột Góp ý), `site/public/app.js` (GUIDES – lối vào bài hướng dẫn trong popup), `src/seo.js` (sitemap), `site/huong-dan-nguon/tao-trang.py` (bài mới, các bài cũ sinh lại giữ nguyên byte), ảnh `assets/tools/to-khai-gtgt.jpg`.
- Dữ liệu giả để chụp ảnh / quay video: `nguon/du-lieu-thu/` (sinh bằng `nguon/tao_du_lieu_gia.py`). Chụp lại ảnh giao diện: `nguon/shot_giao_dien.py`.
- Kiểm thử: migration chạy trên bản sao lưu 22/10 và database trống (node:sqlite + ensureSchema), chạy 2 lần không trùng; trang Bộ công cụ + popup 1440px / 390px với /api/site giả lập; bài hướng dẫn; góp ý (test9.py).
- Kế hoạch video `video/ke-hoach-video.md` (3 video, chờ anh duyệt Cổng 1); điểm truyền thông `video/diem-noi-bat-truyen-thong.md`.

## Bản 0.5.0 (29/10/2026 – góp ý anh Phương + anh Minh Tuấn)
- Tách theo dõi HĐ điều chỉnh / thay thế thành 2 thẻ: "Mua vào điều chỉnh / thay thế" (đứng sau thẻ Mua vào, có cột Khấu trừ) và "Bán ra điều chỉnh / thay thế"; Excel bảng kê thành 4 sheet: HĐ mua vào · Mua vào ĐC - TT · HĐ bán ra · Bán ra ĐC - TT.
- Nút "Tải bản dùng offline" ở góc trên (chỉ hiện khi dùng trên web; tải đúng file /tools/to-khai-gtgt/index.html, tên Bang-ke-To-khai-GTGT_offline.html). Test `test8.py` (máy chủ http cục bộ).

## Bản 0.4.0 (28/10/2026 – kỳ kê khai HĐ điều chỉnh / thay thế theo TT 91/2026, NĐ 252/2026, NĐ 181/2025)
- Xem `CAN-CU-HD-DIEU-CHINH.md`. Test `test6.py` (lý do ss-truoc mua thay thế → [23] −465.500; mua điều chỉnh giảm → không tính; thay thế nhập tay HĐ bán C26MFB-231 → [32] +3.148, HĐ gốc tự Không; HĐ gốc ngoài kỳ → chặn), `test7.py` (sheet 3 có cột Lý do).

## Bản 0.3.0 (28/10/2026 – góp ý giao diện của anh Minh Tuấn)
- Góc trên hiện "Phiên bản cập nhật ngày 28/10/2026" (`NGAY` trong build.js); bỏ footer, bỏ khung "Công cụ làm gì"; nút "Sang bước 2" xuống dưới, bên phải khung File đã nạp.
- Khung thêm dòng: lưới 12 cột cân đối; ô ngày 3 phần dd / mm / yyyy (dấu / có sẵn, tự nhảy, tự thêm 0, nháy đúp chọn cả phần, Backspace lùi ô, dán tự tách) – **mẫu ô ngày chuẩn cho mọi công cụ sau** (hàm `dateBox` trong app.js). Bỏ chữ ví dụ mờ ở các ô (trừ ô ngày); tên dòng phụ lục 8% điền sẵn giá trị mặc định.
- Test `test4.py`, `test5.py` (gõ 01072026, 5102026, 31/1/2026, 1.12.2026 đều ra đúng).

## Bản 0.2.0 (28/10/2026 – 3 góp ý đầu tiên của anh Phương)
- **Tính vào TK sửa được:** ô tick ở bước 2 (mặc định theo trạng thái HĐ). Bỏ tick → không kê; tick HĐ ngoài kỳ / đã bị thay thế → kê vào kỳ này (cảnh báo ở bước 3). Lưu theo MST (`st.tk`).
- **Thêm dòng nhập tay** dưới bảng kê mua vào / bán ra: HĐ điều chỉnh / thay thế lập kỳ sau, HĐ bổ sung khác (loại, mẫu, ký hiệu, số, ngày, MST, tên, chưa thuế ±, thuế suất, thuế tự tính sửa được, ghi chú). Luôn tính vào kỳ đang lập, nhớ theo MST + kỳ (`qtt-tk-tay-…`), xóa bằng "× Xóa". Có trong Excel, tờ khai, bảng kê theo nhóm.
- **Theo dõi HĐ điều chỉnh / thay thế** (góp ý của anh Phương): thẻ thứ 3 ở bước 2 + **sheet thứ 3 "HĐ điều chỉnh - thay thế"** trong Excel: đã bị điều chỉnh, đã bị thay thế, đã bị hủy, HĐ điều chỉnh, HĐ thay thế (cả mua vào, bán ra, nhập tay). Bảng kê tổng hợp giờ là 3 sheet.
- Test `test3.py`: bỏ 1 HĐ → [23] −536.000; thêm HĐ điều chỉnh giảm −1.000.000 (8%) → [23] 559.197.801, [24] 38.427.737; tải lại trang vẫn nhớ; sheet 3 đủ 10 HĐ.

## Kiểm thử 28/10/2026 (4 file mẫu tháng 09/2026)
- 1.191 HĐ: bán ra 817 (MTT), mua vào 374 (175 có mã + 186 không mã + 13 MTT), 0 trùng, 2 HĐ đã bị thay thế loại đúng.
- Khớp 100% với tính độc lập bằng Python: [23] 560.733.801 · [24] 38.550.617 · [32] 1.640.373.256 · [33] 131.462.511 · [40] 92.911.894.
- 49 HĐ thuế suất ước tính (36 bán ra 8%+10%, 13 mua vào). Sửa tách tay, ✓ hàng loạt, bỏ khấu trừ, xuất XML, đối chiếu XML (cố ý sửa [23]) → báo đúng lệch 733.801.

## CHƯA kiểm chứng
- Đối chiếu với file XML tờ khai **thật xuất từ AMIS** (đang thử bằng XML cấu trúc HTKK) – cần anh Phương gửi 1 file.
- Cách tách thuế suất ước tính với HĐ mua vào tỷ lệ lạ (VD 4,28% đang tách "0%/KCT + 5%", có thể thực tế là KCT + 8%) – chỉ ảnh hưởng phụ lục 8% mua vào, không ảnh hưởng [23]/[24]/[25].
- Phụ lục NQ 204 ghi 1 dòng tổng – HTKK/eTax có chấp nhận không.
- File danh sách định dạng khác (cổng đổi cột, .xls cũ).

## Nhật ký
| Ngày | Việc |
|---|---|
| 28/10/2026 | Đăng link claude.ai cho anh Phương dùng thử (quyền downloads, XML nén .zip) |
| 28/10/2026 | Bản 0.1.0: nghiên cứu 4 file mẫu, dựng 3 bước, kiểm thử với dữ liệu thật |
