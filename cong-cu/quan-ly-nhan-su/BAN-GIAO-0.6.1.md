# Bàn giao – bản 0.6.1: đã xuất bản phần Hội nhập để xem trước, làm tiếp Đào tạo nội bộ VÀO CHÍNH BẢN 0.6.1
> Viết 12/11/2026 12:20, sửa 12:25. **Anh chốt 12:15: KHÔNG lên 0.7.1 – Đào tạo nội bộ cập nhật tiếp vào 0.6.1 rồi mới đăng bài truyền thông. Xuất bản lúc này để anh xem là chính.** Anh chốt Hội nhập 12:05: đổi tên "Tiến độ hội nhập" → **"Hội nhập nhân sự mới"**, đưa lên trước "Thiết lập hành trình", xuất bản 0.6.1 + cập nhật app nhân viên. Sau khi anh duyệt bản xuất bản mới làm Đào tạo nội bộ.

| Hạng mục | Trạng thái |
|---|---|
| Nguồn | `nguon/src/hoinhap.js` (menu IIFE: `hntiendo` "Hội nhập nhân sự mới" trước `hnlotrinh` "Thiết lập hành trình"; dữ liệu `u.hn`; `hnAppPayload`, `hnAppSync`). `nhansu.js` gửi `hn` kèm hồ sơ khi Đồng bộ. `build.js` VER `0.6.1` |
| Nguồn chốt | `nguon/_ban-0.6.1/` = `src` + `mau.b64` (12/11 12:15). Sửa sau xuất bản: chép thẳng cả `src` và `_ban-0.6.1` như 0.4.1/0.5.1 |
| `xuat-ban.js` | ghép `hoinhap.js` khi thư mục nguồn của bản có file (bản cũ `xuat-ban.js.truoc-0.6.1`) |
| `phien-ban.json` | 0.6.1 – 6 ý `moi`, 3 ý `nang_cap`; `phien-ban-du-kien.json` = **"0.6.1 (bổ sung)" Đào tạo nội bộ**. Khi xong Đào tạo: sửa mục 0.6.1 trong `phien-ban.json` (module "Hội nhập · Đào tạo nội bộ", thêm ý), chép src → `_ban-0.6.1`, xóa/để trống `phien-ban-du-kien.json`, dựng lại 2 ảnh og 061 (thêm `og_v`/`og_hist_v`), chạy `node xuat-ban.js 0.6.1` (ghi đè /061) (bản cũ `*.truoc-0.6.1`) |
| Ảnh chia sẻ | `og/quan-ly-nhan-su-061.jpg` (nguồn `nguon/og/og61.html` + `shot-061.png`), `og/quan-ly-nhan-su-lich-su-061.jpg` (0.6.1 "Hội nhập, Đào tạo nội bộ" đang bổ sung) |
| Bộ công cụ | `src/core.js` `MIGRATE_TOOLS_V31` (dòng 0.6.1, điểm nổi bật "Hội nhập"). Bản cũ `src/core.js.truoc-qlns-061-20261112.bak`. Khi thêm Đào tạo: **v32** nối ý vào dòng 0.6.1 (như V30 với 0.5.1) |
| App nhân viên thử | `cham-cong-thu/src/app.html` (nút Home + cửa sổ hành trình), `worker.js` VER 0.4.2 (bảng `hn_xong`, `/api/hoi-nhap`, `/api/sync|demo/hn-xong`), `demo-hoinhap.js` (DS007, SG005). Bản cũ `*.truoc-0.6.1` |
| Máy chủ chấm công của công ty (bản thật) | Cùng mã `worker.js` – đơn vị cập nhật khi tải bản mới |

## Bổ sung 12/11 12:55 (góp ý anh 12:33)
- Vai trò `kc` đổi tên **Người đồng hành** (có thể khác trưởng bộ phận).
- **Kho biểu mẫu hội nhập** (`S.settings.hnBm`, mã BM01…): loại `soan` (ký hiệu `tplMdToHtml`, trường `{{…}}` + trường riêng ngay_vao_lam, ngay_het_thu_viec, truong_bo_phan, nguoi_dong_hanh, chuyen_vien_nhan_su, hom_nay), `hd` (`@tv`, `@ld` hoặc mã mẫu trong Kho HĐ), `file` (≤ 300 KB, base64). Bước giữ `bm: [mã]`; payload app gửi `bm{}` đã điền sẵn thông tin từng người.
- App: chào mừng chữ viết tay (font tự phục vụ), chỉ việc của người mới, nút biểu mẫu.

## Bổ sung 12/11 14:20 (phiếu góp ý + Ứng dụng nhân viên)
- Nguồn đổi: `app.js`, `chamcong.js`, `cocau.js`, `nhansu.js`, `pages.js`, `ui.html` (đã chép vào `_ban-0.6.1`), `phien-ban.json` 0.6.1 thêm 4 ý `nang_cap`.
- `worker.js` **0.4.3** (schema_v 5): đăng nhập lần cuối, mở khóa PIN, QR app – phải chạy `trien-khai.cmd` thì trang Ứng dụng nhân viên mới hiện đủ.
- Thu nhập HĐ: một nguồn là Cơ cấu nhân sự; sửa ở HĐ ghi ngược các tháng chưa duyệt.

## Bổ sung 12/11 15:10 (góp ý 14:52)
- Mật khẩu app (mã PIN) lưu dạng mã hóa → popup Thông tin tài khoản không hiện lại được PIN; quên thì Đổi mật khẩu. Bản thử dữ liệu mẫu hiện PIN chung 123456.
- Sao lưu .zip gồm dữ liệu + file kho; đơn vị nạp từ thư mục cần Quét lại sau khi khôi phục.

## Bổ sung 12/11 17:05 (Đào tạo nội bộ: khóa mẫu Hội nhập + B2 – anh 16:30)
- `nguon/src/daotao.js` (bản cũ `.truoc-b2`): KH01 4 chương · 15 bài · KT nhanh chương 2 (5 câu) + KT cuối khóa 20 câu; ảnh bìa nhúng `DT_BIA_HN`. B2: `dtAppPayload`, `dtDemoExport`, `dtMerge` (giữ điểm tự luận đã chấm nếu bài làm không đổi), `dtHnApply`, `dtAppSync` (gộp 1 thông báo cho mọi đơn vị).
- `nguon/src/nhansu.js`: hồ sơ app gửi kèm `dt`.
- `cham-cong-thu/src/worker.js` VER 0.4.4 (bản cũ `.truoc-b2`): bảng `dt_kq`, `POST /api/hoc`, GET `dt-kq` (sync + demo); `demo-daotao.js` mới. App `app.html` (bản cũ `.truoc-b2`): nút "Khóa học của bạn" + sheet học.
- **Chưa** chép src → `_ban-0.6.1`, chưa xuất /061 cho phần Đào tạo – chờ anh duyệt.
- Bản thử (demo): app chưa thấy điểm tự luận quản lý chấm (máy chủ demo chỉ có mẫu); bản thật nhận qua hồ sơ phần mềm gửi lên.
- Còn thiếu: link YouTube bài 1.2 (Video: Một ngày ở công ty) và link nội quy đầy đủ bài 3.2 – để trống, app hiện "sẽ sớm có".

## Bổ sung 12/11 18:05 (góp ý 17:42, 17:44)
- Ảnh bìa khóa đúng tỉ lệ; app: đăng ký lịch ghi tên ca + giờ, tab **Học** riêng (6 tab, thanh tab mới); phần mềm: hồ sơ 1 người có tab **Đào tạo**. Bản cũ `*.truoc-1742`. Lưu ý: app (máy chủ chung) sẽ hiện tab Học cho mọi công ty ngay khi triển khai – công ty chưa giao khóa thấy dòng "chưa được giao khóa học nào".

## Bổ sung 12/11 18:40 (góp ý 17:55–17:59, app nhân viên)
- Lịch tháng + bảng Đăng ký lịch; Công tô xám ngày nghỉ (nửa buổi nửa xám); Lương chọn năm, biểu đồ theo năm bấm cột mở phiếu. Bản cũ `*.truoc-1755`.
- `lich.nua` (ngày làm nửa buổi) do phần mềm gửi: hiện mới có ở bản thử – khi chép `chamcong.js`, `nhansu.js` sang `_ban-0.6.1` và anh bấm cập nhật hồ sơ lên app thì ô nửa xám mới hiện với dữ liệu thật.

## ĐÃ XUẤT BẢN 0.6.1 bổ sung Đào tạo nội bộ – 12/11 18:40
- `_ban-0.6.1` = src (bản cũ `_ban-0.6.1.truoc-daotao/`), `phien-ban.json` 0.6.1 cập nhật, `phien-ban-du-kien.json` trống, ảnh og 061/lịch sử 061 mới (bản cũ `.truoc-daotao`), `src/core.js` MIGRATE_TOOLS_V32.
- Anh chạy: `.\xuat-ban-web.cmd` tại `quantritute\cong-cu\quan-ly-nhan-su`; `.\trien-khai.cmd` tại `quantritute\cong-cu\quan-ly-nhan-su\cham-cong-thu`.
- Còn: link video bài 1.2, link nội quy bài 3.2 của khóa mẫu; bài fanpage 0.6.1.

## Bổ sung 12/11 19:15 – Bảo hiểm xã hội + chọn mục thanh tính năng (ANH DUYỆT 18:55)
- Nguồn: `src/bhxh.js` mới, `app.js`, `thietlap.js`, `ui.html` (bản cũ `.truoc-bhxh`); `_ban-0.6.1` = src (bản cũ `_ban-0.6.1.truoc-bhxh/`); `phien-ban.json` 0.6.1 cập nhật (bản cũ `.truoc-bhxh`); `src/core.js` V33 (bản cũ `core.js.truoc-qlns-061-bhxh.bak`); đã xuất /061.
- Ảnh chia sẻ 061 chưa dựng lại cho BHXH (đang là ảnh Kho khóa học) – dựng lại nếu anh muốn.
- Bước phát hành khi anh duyệt: `.\xuat-ban-web.cmd` tại `quantritute\cong-cu\quan-ly-nhan-su`; bài fanpage 0.6.1.
- File C12 thật của anh (HaDu) chỉ dùng thử bộ đọc, không lưu vào phần mềm/dữ liệu mẫu.

## ĐÃ CHUẨN BỊ PHÁT HÀNH 0.6.1 đủ (Hội nhập · Đào tạo · BHXH) – 12/11 19:35
- Ảnh lịch sử 061 có 0.7.1 đang làm (bản cũ `.truoc-071`); `phien-ban-du-kien.json` = 0.7.1; đã chạy `node xuat-ban.js 0.6.1`.
- Bài fanpage Ngày 7 + 4 bình luận + email + link Debugger: `04_Nội dung - Marketing/Series phần mềm nhân sự/bai-cap-nhat-0.6.1.md`; 20 ảnh `anh-061/`.
- Thứ tự anh làm: (1) `.\xuat-ban-web.cmd` tại `quantritute\cong-cu\quan-ly-nhan-su`; (2) `.\trien-khai.cmd` tại `quantritute\cong-cu\quan-ly-nhan-su\cham-cong-thu`; (3) `.\trien-khai-quan-tri.cmd` tại `quantritute`; (4) Debugger Scrape Again; (5) đăng bài + ảnh + bình luận; (6) Quản trị → Bộ công cụ → Phần mềm quản lý nhân sự → 🔔 Báo cập nhật (Gửi 2 lần, không bấm ⚡ Gửi ngay).
- Bản sau 0.7.1: Phân quyền tài khoản, Nhập dữ liệu từ nhiều định dạng, Rà soát trải nghiệm người dùng.

## Việc còn mở cho bản sau
- **Đào tạo nội bộ (bổ sung vào 0.6.1)**: có khóa "Hội nhập" mà bước mẫu b10 "Giới thiệu công ty, phổ biến nội quy và chế độ" trỏ tới (người mới tự học trên app).
- Việc của người phụ trách (nhân sự, trưởng BP, kèm cặp) hiện trên app của họ ("Việc của tôi") – chưa làm.
- Đọc PDF quy trình: bảng có ô 2 dòng đôi khi bị tách đôi (Excel đọc đúng hết).
- Chưa thử nối liền máy chủ thật: người mới tự xác nhận → phần mềm kéo về (đã thử từng nửa).
- Bài fanpage bản 0.6.1: **chỉ viết sau khi xong Đào tạo nội bộ** (anh chốt 12:15).
