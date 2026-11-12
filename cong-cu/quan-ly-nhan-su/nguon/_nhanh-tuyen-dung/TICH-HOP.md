# Ghép Module Tuyển dụng (0.5.1) vào bản chính – CHỈ LÀM KHI ANH DUYỆT
> Nhánh: `nguon/_nhanh-tuyen-dung/`. Bản chụp `src` lúc bắt đầu (09/11 ~16:05, có cả phần Lương đang làm dở) – mã băm ở `src-goc.md5`.
> Toàn bộ module nằm trong **1 file** `tuyendung.js`; **không sửa** file nào trong `src/`.

## 1. Các bước ghép (làm trên `src` MỚI NHẤT lúc đó – không chép đè `src` từ nhánh)
1. Chép `_nhanh-tuyen-dung/tuyendung.js` → `nguon/src/tuyendung.js`.
2. `nguon/build.js`: trong dòng `.replace('/*@@LUONG@@*/', …)` thêm `+ '\n' + rd('src/tuyendung.js')` vào **cuối** (sau `phieuluong.js` hoặc module cuối cùng lúc đó). Đổi `VER` theo bản sẽ phát hành.
3. (Dọn, không bắt buộc) `src/app.js`: xóa 4 mục `tdnhucau, tdtin, tdungvien, tdmoi` trong `SOON`; ghi sẵn trong `MODS` nhóm `td` theo thứ tự anh chốt 11/11: `tdnhucau` Nhu cầu tuyển dụng · `tdungvien` **Ngân hàng ứng viên** · `tdlich` **Lịch phỏng vấn** (mục mới) · `tdmoi` **Kết quả phỏng vấn** · `tdtin` Cổng tuyển dụng, `st: 'ok'`; thêm icon `tdlich` vào `IC`. (Hiện module tự đổi tên, thêm mục, sắp lại thứ tự và thêm icon lúc chạy.)
4. `node build.js` → chạy kiểm thử mục 3.
5. Ghi `phien-ban-du-kien.json` (thêm khối 0.5.1), 1 dòng nhật ký `README.md`, tiến độ chung (anh duyệt mới ghi).

## 1b. Thư viện ngoài (nạp qua mạng khi cần – 11/11)
- **pdf.js 3.11.174** từ cdnjs (cùng bản `nhansu.js` bản chính đang dùng) – đọc lớp chữ CV dạng PDF. Nếu bản chính đã nạp `window.pdfjsLib` thì module dùng lại.
- **Tesseract.js 5.1.1** từ jsDelivr (kèm lõi WASM + dữ liệu tiếng Việt, tiếng Anh `@tesseract.js-data` – tải lần đầu, vài MB) – đọc chữ CV dạng ảnh / PDF scan **ngay trên máy**, file không gửi đi đâu. Máy không có mạng → báo "chưa đọc được", vẫn lưu CV và nhập tay.
- Khi xuất bản web: rà lại trang Chính sách dữ liệu nếu cần nêu việc tải thư viện từ cdnjs / jsDelivr (chỉ tải mã, không gửi dữ liệu).

## 2. Module dùng những gì của phần mềm (nếu hội thoại khác đổi tên các hàm này thì phải sửa theo)
- Biến/hàm chung: `MODS, IC, PAGES, BINDS, ACTS, PS, ps, S, selUnits, refDate, saveUnits, render, renderNav, go, curPage, log, logErr, toast, showErr, busy, modal, confirmBox, field, dbox, bindDbox, selectBox, searchBox, opt, table, esc, ic, fmtInt, p2, norm, cmp, vn, isMulti, unitById, shortUnit`
- Nhân sự: `orgOf` (gợi ý theo định biên), `openNvForm` + id ô `fName, fSdt, fPb, fCd, fLd, fTd, fVao, fQrRes` (chuyển ứng viên → nhân sự), `ACTS['hd-new']`, `ACTS.profile`
- Kho file: `KHO, khoPut, khoDel, khoView, khoId, kbSize, sampleImg` (CV lưu `kho: 'cv'`, `nv` = mã ứng viên)
- Cảnh báo: **bọc** `alertList` (nối thêm cảnh báo tuyển dụng, `ACACHE`), thêm `HRR.KINDS.td_*`
- Gắn thêm: `BINDS.dash` (ghế "Trống" → "Đang tuyển"), `BINDS.tochuc` (nhãn "Đang tuyển" ở phòng ban) – đều gọi lại hàm gốc trước
- Dữ liệu: `u.td = { rq: [phiếu], cd: [ứng viên], cfg: {thông tin cổng, mẫu thư, tiêu chí} }` – lưu cùng dữ liệu công ty; dữ liệu mẫu tự sinh (khóa `TD_SEED`)

## 3. Kiểm thử sau khi ghép (đã chạy trên nhánh 09/11)
| Kiểm | Kết quả trên nhánh |
|---|---|
| 4 trang Tuyển dụng + Bảng điều hành, Việc cần xử lý, Sơ đồ tổ chức – 1440px và 390px | Không lỗi, không tràn ngang |
| Nộp hồ sơ trên cổng xem trước (có CV) → vào Mới nhận | Đạt |
| Hẹn PV → thư mời PV tự điền → đánh giá 5 tiêu chí → điều kiện mời (chặn lương thử việc < 85%) → thư mời nhận việc → Đồng ý → Chuyển thành nhân sự (form tự điền) → mã NV mới, phiếu tự chuyển "Đã đủ người" | Đạt |
| Cảnh báo từ ngữ phân biệt (giới tính, tuổi, ngoại hình, thu phí) khi bật hiện trên cổng | Đạt |
| Nhập ứng viên từ Excel (file kiểu Google Form) | Đạt |
| Xóa hồ sơ quá hạn lưu · sửa mẫu thư · tải lại trang dữ liệu còn nguyên | Đạt |
