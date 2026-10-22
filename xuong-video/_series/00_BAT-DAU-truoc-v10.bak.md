# 00 · BẮT ĐẦU VIDEO MỚI – file bàn giao giữa các hội thoại

> Cập nhật: 20/10/2026 12:20 (sau v08). Hội thoại xong video nào thì **sửa file này** cho video kế tiếp (mục 1, 4) – giữ ngắn, ≤ 3 KB.
> Anh mở hội thoại: *"Làm video tiếp theo. Đọc `Video xây kênh/00_BẮT ĐẦU VIDEO MỚI.md` trước."*

## 1. Video kế tiếp
**v09 – Tạo sẵn file nhập lên MISA** (thẻ 5 Bộ công cụ hóa đơn thuế) · Đốm dẫn 100% · 40–60s · đăng **T2 26/10/2026 19:00** · Source hoàn thiện số **9**.
- Nội dung đã chốt: **chỉ nói cách vận hành + tác dụng cơ bản, chưa demo chi tiết** – từ hóa đơn → 5 mẫu chứng từ đúng mẫu nhập khẩu MISA, danh mục NCC/hàng hóa, gợi ý Nghiệp vụ khác. Demo chi tiết để đợt 2 (sau khi KTT nhập thử thật).
- **Không nói:** "nhập thẳng MISA không lỗi" (chưa nhập thử thật).
- Sau v09: hết đợt 1 chuỗi Hóa đơn thuế → đề xuất anh danh sách đợt 2 (định hướng ở `00_TIẾN ĐỘ - Chuỗi video Hóa đơn thuế.md` mục 5b).

## 2. Chỉ đọc những thứ này (theo thứ tự)
1. File này.
2. `quantritute/xuong-video/QUY-TRINH-VIDEO.md` (bản gọn ~9 KB: quy tắc, phiên âm, CTA, dữ liệu, lỗi cần tránh).
3. Project doc `claude/cong-cu-hoa-don-tong-hop.md` – **chỉ** mục 4 (thẻ của video) + mục 7 (KHÔNG được nói).
4. `00_TIẾN ĐỘ CHUNG - Các hội thoại.md` – **chỉ mục 2 "Đang làm"** (xem có ai đang sửa file mình cần không): `sed -n '/^## 2\./,/^## 3\./p'`.

**Không đọc:** nhật ký các file tiến độ, `BAI-HOC-VIDEO-LUU-TRU.md` (chỉ tra khi cần), mã cũ của video trước (mã mẫu đã có trong bộ dựng), Project doc khác.

## 3. Các bước (giữ đúng 3 cổng)
1. Ghi tên vào mục 6 "Đang làm" của `00_TIẾN ĐỘ - Chuỗi video Hóa đơn thuế.md` + 1 dòng nhật ký (python sửa đúng dòng, chèn lên đầu bảng nhật ký).
2. Chuyển vào máy chủ: `quantritute/xuong-video/_bo-dung/bo-dung-chung.tgz`, công cụ `quantritute/cong-cu/xu-ly-hoa-don/app/index.html`, dữ liệu `tap/_hoa-don-chung/du-lieu-gia/HoaDon_BanRa_Quy3.zip` + `tai-tu-trang-mo-phong/HoaDon_MuaVao_9876543210_01072026-30092026.zip` (đổi tên bán ra thành `HoaDon_BanRa_9876543210_01072026-30092026.zip`). Giải nén → `bash setup.sh v09 "DÒNG 1|DÒNG 2"` (xem `_bo-dung/README.md`).
3. Chạy thử thẻ của video với dữ liệu thật → soạn kịch bản `tap/v09-…/kich-ban-de-xuat-v1.md` → **Cổng 2** (gửi lời Đốm dạng bảng + câu hỏi cần anh chốt).
4. Anh duyệt → `kich-ban-v1.json` (rà phiên âm bằng regex) + `xuong-video/doc-giong-v09.cmd` → báo anh bấm. CTA chép giọng D13/D14 của v07.
5. Quay (`rec_v09.py` từ mẫu) → dựng (`build_v09.py`: sửa BEATS, PL, IMG, DKW, ZM) → render nền → trộn → kiểm tra khung hình + độ dài âm thanh → thumb → gửi **Cổng 3** (≤ 30 MB).
6. Anh duyệt → lưu Source hoàn thiện, migration `_mig_studio_v7`, bảng lịch HTML, `youtube-v09.md` → cập nhật tiến độ, **file này**, thêm bài học mới vào `QUY-TRINH-VIDEO.md` mục 8 (ngắn) + `BAI-HOC-VIDEO-LUU-TRU.md` (chi tiết) → đồng bộ bản sao Project `claude/quy-trinh-video.md`.

## 4. Trạng thái để biết (20/10)
- v05–v08 đã nạp Xưởng video, **chờ anh `npm run deploy:admin`**.
- Migration Xưởng video tiếp theo: `_mig_studio_v7` (v08 dùng v6).
- Việc công cụ còn treo (báo anh, không tự sửa trong hội thoại video): ảnh minh họa thẻ 1 còn MST 0700922112; câu "Mở bằng HTKK hoặc nộp qua eTax" ở thẻ 4.
