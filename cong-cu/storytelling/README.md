# Luyện tập thuyết trình, kể chuyện (storytelling) (`cong-cu/storytelling`)

Công cụ học tập miễn phí – nhóm **Học tập (ht)**. Bản **1.0.0** (02/11/2026) – bản xem trước, **chưa đưa lên web**, chờ anh duyệt.

- **Link trên web (khi đưa lên):** `/tools/storytelling/`
- **Người dùng:** người Việt, chủ yếu dân văn phòng 18–40, mới bắt đầu luyện kể chuyện, nói trước camera, thuyết trình.
- **Thông điệp:** Mỗi ngày 10 phút (không tính thời gian xem video nguồn).
- **Nguồn kiến thức:** kênh YouTube Philipp Humm (tiếng Anh), chuỗi email 5 Days to Great Stories, bài tập Homework for Life / First–Last–Best–Worst của Matthew Dicks. Viết lại bằng lời mình, ví dụ minh họa tự soạn. Ghi công + "không có liên kết với tác giả" ở chân trang và trang Về công cụ.
- **Tài liệu duyệt:** https://claude.ai/artifact/CmoVdbmaYkcjWzCNGeyZx9 (lộ trình, game, bài mẫu, chặng 1).

## Tính năng bản 1.0.0
| Phần | Nội dung |
|---|---|
| Chọn hướng | 3 nhánh: A Giao tiếp · B Trước camera · C Thuyết trình công việc. Ngày 1–14 dùng chung, 15–28 theo nhánh, ngày 29 Về đích |
| Bài học | 57 bài. Mỗi bài 4 bước: Đọc (5 thẻ) → Thử nhanh → Thực hành (đồng hồ, ghi âm/quay video, ô điền) → Ghi nhận (tự chấm) |
| Nhịp học | 1 bài mới mỗi ngày; bài tiếp mở vào hôm sau. Ôn lại bài cũ bất cứ lúc nào |
| Game | 50 XP/bài, 100 XP ngày qua màn; 5 cấp theo chặng; 6 huy hiệu; chuỗi ngày (nghỉ 1 ngày/tuần không mất chuỗi); bản đồ 4 vùng; không bảng xếp hạng |
| Phòng tập | 3 cấp (Khởi động mở ngày 1, Cơ bản ngày 8, Nâng cao ngày 15), 18 bài tập; 75 đề ứng khẩu tiếng Việt |
| Kho chuyện | Hạt giống tự vào kho từ bài học; Đốm hỏi từng câu để dựng chuyện (gõ hoặc nói); kệ thẻ chuyện, lọc theo dịp dùng; tập kể 60 giây có ghi âm |
| Video | 47 video, tên tiếng Việt, tóm tắt, nhãn chủ đề/cấp độ/độ dài, "Dùng trong: Ngày…" (ẩn PH-023, 045, 047) |
| Dữ liệu | Lưu trên trình duyệt (localStorage + IndexedDB cho bản ghi). Sao lưu/khôi phục file JSON. Tải lịch nhắc .ics |
| Khác | Nút "Góp ý cho Đốm" (tool `storytelling`), `qtt-track.js`, nhãn phiên bản, chế độ tối theo máy |

**Chế độ xem trước (mở tất cả bài để duyệt):** thêm `?xem-truoc=1` vào link, hoặc vào Về công cụ bấm 5 lần vào dòng phiên bản.

## Cấu trúc
```
app/index.html          ← bản build, KHÔNG sửa tay
nguon/build.py          ← python build.py → nguon/build/index.html (kiểm 57 bài bằng check.py)
nguon/src/app.html|css|js
nguon/lessons/*.json    ← nội dung bài học (c1, d08, c2, A3, A4, B3, B4, C3, d16C, C4, d29)
nguon/data/videos-vi.json, phongtap.json
nguon/BRIEF.md, check.py ← quy tắc viết bài + bộ kiểm tra
```

## Việc còn lại trước khi đưa lên web
- [ ] Anh duyệt bản xem trước
- [ ] Thêm `storytelling` vào `TOOL_SLUGS` (`src/public-api.js`) + tên hiển thị cột Công cụ (`admin/public/admin.js`)
- [ ] Bản ghi công cụ trong database (migration `_mig_tools_vN`, nhóm ht) + ảnh giao diện `site/public/assets/tools/storytelling.jpg`
- [ ] Bài hướng dẫn SEO
- [ ] Anh gửi thư cảm ơn Philipp Humm (bản nháp: `thu-cam-on-philipp-humm.md`)

## Nhật ký
| Ngày | Việc |
|---|---|
| 01/11/2026 | Chốt định hướng, lộ trình, 2 bài mẫu, viết chặng 1 |
| 02/11/2026 | Viết đủ 57 bài, dựng bản 1.0.0, kiểm thử tự động cả 3 nhánh |
