# Bàn giao cho hội thoại mới – sau bản 0.5.1, làm bản 0.6.1
> Viết 11/11/2026 20:50, khi đóng hội thoại làm Module Tuyển dụng + xuất bản 0.5.1. Anh đã đăng bài fanpage Ngày 6.
> Hội thoại mới đọc theo thứ tự: file này → `README.md` (bảng nhật ký, các dòng 11/11) → `BAN-GIAO-0.4.1.md` mục 5 + mục 7.3 (quy ước, điểm chưa kiểm chứng) → `BAN-GIAO-0.3.1.md` mục 2 (quy ước xuất bản, ảnh chia sẻ, migration) → `../../../00_TIẾN ĐỘ CHUNG - Các hội thoại.md`.

## 1. Hiện trạng
| Hạng mục | Trạng thái 11/11 20:50 |
|---|---|
| Bản 0.5.1 (đã xuất bản `/quan-ly-nhan-su/051`) | Gồm 3 phần: **App cho nhân viên** + **khối sản xuất làm ca / lương theo giờ** (các bổ sung 11/11, anh chốt 19:20 tính vào 0.5.1, không còn ghi ở 0.4.1) + **Module Tuyển dụng** (5 trang: Nhu cầu tuyển dụng · Ngân hàng ứng viên · Lịch phỏng vấn · Kết quả phỏng vấn · Cổng tuyển dụng). Nguồn chốt `nguon/_ban-0.5.1/` = `nguon/src` (sửa sau xuất bản đều chép thẳng cả hai, không tách bản – theo cách anh làm ở 0.4.1) |
| `build.js` | VER `0.5.1`, ghép `src/tuyendung.js` sau `chiluong.js`. `xuat-ban.js` chỉ ghép `tuyendung.js` khi thư mục nguồn của bản có file đó |
| `phien-ban.json` | 0.5.1: `ten` "App cho nhân viên, Module Tuyển dụng, xếp ca và tính lương cho người làm theo ca"; 8 ý `moi` (Tuyển dụng) + 8 ý `nang_cap` (app nhân viên, làm theo ca); `og_v: b`, `og_hist_v: c` (mã làm mới ảnh chia sẻ – bản sau xóa / không cần) |
| `phien-ban-du-kien.json` | **0.6.1 – Module Hội nhập và Cổng đào tạo nội bộ** (anh chốt 20:42). Mục dự kiến lấy từ `SOON.hoinhap`, `SOON.daotao` trong `src/app.js` |
| Ảnh chia sẻ | `og/quan-ly-nhan-su-051.jpg` (nguồn `nguon/og/og51.html` + `shot-051.png`), `og/quan-ly-nhan-su-lich-su-051.jpg` (0.6.1 "Hội nhập, Đào tạo nội bộ" đang làm). Bản 0.6.1 phải dựng ảnh mới theo quy ước |
| Bộ công cụ (`src/core.js`) | `MIGRATE_TOOLS_V29` (dòng 0.5.1) + `V30` (nối các bổ sung app nhân viên / làm theo ca vào dòng 0.5.1, thêm điểm nổi bật "App nhân viên"). Bản sau: **v31** trở đi |
| Máy chủ chấm công thử | `cham-cong-thu/src/og-anh.js` + `worker.js`: ảnh, tiêu đề chia sẻ link app nhân viên mới ("App cho nhân viên – bản chạy thử", `/og-nv.jpg?v=0511`; nguồn `cham-cong-thu/og/og-app.html` → `og-app-nv.jpg`) |
| **Cổng tuyển dụng thử** `recruit.quantritute.com` | Thư mục `cong-cu/quan-ly-nhan-su/tuyen-dung-thu/` (Worker `qtt-tuyen-dung-thu`). Đọc `tuyen-dung-thu/README.md`. Dùng chung D1 `qtt-cham-cong-thu-db`, bảng tiền tố `td_` (database riêng `qtt-tuyen-dung-thu-db` bị lỗi 10021 – để trống, xóa được). Triển khai: `tuyen-dung-thu\trien-khai.cmd` (tự thử lại khi gặp 10021). **Gặp lỗi wrangler 10021 → anh chạy `npx wrangler login` trước** (lần này đăng nhập lại là hết) |
| Bài fanpage Ngày 6 | Đã đăng (anh báo 20:42). Bài + email: `04_Nội dung - Marketing/Series phần mềm nhân sự/bai-cap-nhat-0.5.1.md`; 22 ảnh `anh-051-v2/`; nguồn dựng `_nguon-anh-051/poster-v2.html` (có danh sách cụm từ không được tách dòng – xem mục 3) |
| Nhánh `nguon/_nhanh-tuyen-dung/` | Lưu trữ. Từ nay sửa Tuyển dụng ở `nguon/src/tuyendung.js` |

**Lệnh còn phải chạy (nếu anh chưa chạy sau 20:50):**
1. Đứng ở `quantritute\cong-cu\quan-ly-nhan-su`: `.\xuat-ban-web.cmd` (favicon Đốm ở cổng, trang Lịch sử 0.6.1, ảnh Lịch sử mới)
2. Đứng ở `quantritute\cong-cu\quan-ly-nhan-su\tuyen-dung-thu`: `.\trien-khai.cmd` (favicon trang giới thiệu cổng)
3. Facebook Sharing Debugger → Scrape Again: `https://quantritute.com/quan-ly-nhan-su/?nguon=facebook`

## 2. Cổng tuyển dụng – cách chạy (để làm tiếp nếu cần)
- Nút **Mở link** (khung Link chia sẻ, thanh địa chỉ khung xem trước, Toàn màn hình, nút Mở tin ở Nhu cầu): đưa trang cổng (`tdPortalHtml`, mode `live`) lên `recruit.quantritute.com` bằng mã cổng + khóa bí mật của trình duyệt (`cfg.thu`), mở link thật `…/t/<mã>/<công ty>[/<vị trí>|/ve-chung-toi]`. Không kết nối được → mở trang trên máy (blob, hồ sơ gửi về qua `window.opener`).
- Phần mềm tự lấy hồ sơ mỗi 45 giây khi đang mở (`tdThuPull`, `tdThuTimer`), lấy xong máy chủ xóa ngay; link + hồ sơ tự xóa sau 24 giờ. Thử cục bộ: đặt `window.QTT_TD_THU = 'http://localhost:8787'` trước khi tải trang, chạy `wrangler dev --local`.
- Trang **Về chúng tôi** (`cfg.ab`: story, mission, values, env, perks, stats) – sửa ở Thông tin công ty trên cổng, nút "Điền lại văn bản mẫu" (`tdAboutPage` chèn nguyên văn vào script trang cổng).
- Favicon trang cổng = hình Đốm của phần mềm (`tdFav()` lấy `link[rel=icon]` của phần mềm).
- **Pháp lý:** cổng thử là ngoại lệ có chủ đích với nguyên tắc "dữ liệu khách không nằm trên máy chủ của Tuấn" – chỉ dữ liệu mẫu, có dải nhắc không nhập thông tin thật, tự xóa 24 giờ. Còn treo: thêm 1 đoạn vào trang Chính sách dữ liệu quantritute.com về cổng thử (chờ anh duyệt). Bản chính thức: mỗi công ty dựng cổng trên tài khoản Cloudflare của mình (`_nhanh-tuyen-dung/may-chu/THIET-KE-KET-NOI.md`).

## 3. Quy ước mới phát sinh 11/11 (giữ ở bản sau)
- **Tiêu đề ảnh, chữ trên ảnh: không tách cụm từ sang 2 dòng** (anh nhắc 20:22: "nhân sự là 1 cụm từ"). Poster dùng danh sách `GLUE` (thay dấu cách trong cụm bằng khoảng trắng không ngắt) – thêm cụm mới khi cần; tự rà toàn bộ tiêu đề trước khi giao.
- Ảnh bài đăng: 3 ảnh đầu thể hiện các tính năng chính của đợt cập nhật, sau đó mới là ảnh chi tiết (anh yêu cầu 20:08).
- Bài fanpage: anh có thể tự sửa phần mở đầu – giữ nguyên văn phần anh sửa, chỉ viết tiếp.
- Khi chuẩn bị đăng: luôn gửi kèm link Facebook Sharing Debugger cho các link ở bình luận; ảnh chia sẻ đổi sau khi đã đăng thì thêm mã làm mới (`og_v`, `og_hist_v`, hoặc `?v=` trên ảnh máy chủ thử).
- Đọc CV: đã xử lý CV 2 cột, ngày sinh tiếng Anh, link xuống dòng (thử bằng CV thật của anh – file không lưu vào dự án).

## 4. Việc tiếp theo – bản 0.6.1: Module Hội nhập + Cổng đào tạo nội bộ
- Phạm vi dự kiến: `phien-ban-du-kien.json`. Hai mục menu đã có sẵn trong `MODS` (`hoinhap`, `daotao`, `st: 7`, trang "Sắp có" qua `SOON`) – lắp module vào khung như Tuyển dụng.
- Nên nối với: hồ sơ nhân sự mới tạo từ Tuyển dụng (`tdToNv` → người mới vào làm → kích hoạt lộ trình hội nhập), App nhân viên (việc cần làm, khóa học của mình), Việc cần xử lý (ai chậm mốc).
- "Cổng đào tạo nội bộ" nếu cần trang cho nhân viên xem/học: cân nhắc dùng lại cách của cổng tuyển dụng (trang dựng sẵn + máy chủ thử) hoặc đưa vào app nhân viên – hỏi anh trước.

## 5. Việc còn treo
- Đoạn Chính sách dữ liệu cho cổng thử (mục 2).
- Từ BAN-GIAO-0.4.1 mục 7.3: Ngày Văn hóa 24/11 chưa đối chiếu văn bản gốc; quét QR camera chưa thử trên điện thoại thật; cách tính lương theo giờ / làm đêm cần kế toán trưởng duyệt nghiệp vụ.
- Chấm công nhiều điểm (anh chốt làm sau Lương – chưa xếp bản).
- Database trống `qtt-tuyen-dung-thu-db` – xóa khi tiện: `npx wrangler d1 delete qtt-tuyen-dung-thu-db`.
