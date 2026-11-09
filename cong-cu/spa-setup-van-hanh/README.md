# Bộ công cụ Mở & Vận hành Spa

- **Slug:** `spa-setup-van-hanh` (link trên web dự kiến: `/tools/spa-setup-van-hanh/`)
- **Nhóm:** Ngành spa
- **Khuyến nghị:** dùng chung cho spa, phù hợp nhất với massage trị liệu, cơ sở dưỡng sinh
- **Tài liệu gốc:** `../Công cụ sẽ làm/Doing_Cẩm nang setup, vận hành Spa/` (anh toàn quyền sử dụng, đã bỏ tên thương hiệu cũ)
- **Tiến độ chi tiết:** `Dự án 5.0/00_TIẾN ĐỘ - Bộ công cụ Spa.md`

## Cấu trúc
| File | Vai trò |
|---|---|
| `app/index.html` | Trang chủ "Con đường mở spa" (phương án B anh chọn 25/10) – bản đưa lên web, ảnh Đốm nhúng sẵn |
| `app/chon-mo-hinh.html` | Công cụ 1 – Chọn mô hình phù hợp (miễn phí) |
| `app/cham-diem-mat-bang.html` | Công cụ 2 – Chấm điểm mặt bằng (miễn phí), lưu `qtt-spa-m2` |
| `app/khao-sat-thi-truong.html` | Công cụ 3 – Khảo sát thị trường & đối thủ (miễn phí), lưu `qtt-spa-m3`; nguồn `nguon/src/khao-sat-thi-truong.html`, ghép bằng `nguon/build-m3.py` (chạy được trên máy anh) |
| `nguon/src/core.css`, `core.js` | Phần dùng chung: màu, hộp thoại, hồ sơ cơ sở, dữ liệu 13 bước + 12 công cụ, bảng giá `CONFIG` |
| `nguon/src/trang-chu.html`, `chon-mo-hinh.html` | Bản nguồn từng trang (ảnh để dạng {{...}}) |
| `nguon/build.py` | Ghép core + trang + nhúng ảnh → `app/` (đường dẫn ảnh trong script đang trỏ bản sao trên máy ảo, sửa `U` nếu chạy trên máy anh) |
| `nguon/phuong-an-giao-dien/` | 4 phương án giao diện A–D để tham khảo |

## Quy ước
- Hồ sơ cơ sở dùng chung, lưu localStorage `qtt-spa-hub-v1` (cùng tên miền thì các công cụ đọc chung). Theme dùng khóa `qtt-theme`.
- Mỗi công cụ là 1 file trong `app/`; khai báo `url` trong `MODULES` (core.js) thì popup công cụ hiện nút **Dùng ngay**.
- Giá lấy từ `CONFIG` (gia 0 = miễn phí, null = có phí chưa đặt giá, số = giá) → sau này đọc từ trang admin.
- Nút "Thử số liệu giả định" ở mỗi trang: không lưu, có dải/nhãn báo rõ là số liệu mẫu.
- Trang chủ: nút nổi bật **Bắt đầu hành trình** → popup mời điền hồ sơ; khi đã có hồ sơ nút đổi thành "Tiếp tục hành trình · Trạm N".
- Công cụ 1 lưu câu trả lời ở `qtt-spa-m1`; nút "Lưu quy mô vào hồ sơ cơ sở" ghi `hoso.quymo`.

## Nhật ký
| Ngày | Việc |
|---|---|
| 25/10/2026 | Bản giao diện 0.1 trang chủ (phương án A) |
| 25/10/2026 19:30 | Anh chọn phương án B. Bản 0.2: nút Bắt đầu hành trình + popup hồ sơ; Công cụ 1 Chọn mô hình bản 0.1 – chờ anh test |
| 26/10/2026 | Chọn mô hình 0.2b (anh duyệt). Chấm điểm mặt bằng 0.1 – chờ anh test. Quy ước: ô nhập để trống, màn hình đầu tối giản |


## Cập nhật 27/10/2026
- `app/cham-diem-mat-bang.html` = Bộ tiêu chí đánh giá mặt bằng mở spa bản 0.2 (phương án Y): 32 tiêu chí / 5 chặng, thang 10 có tỷ trọng, tiêu chí loại, "Chưa xác định" + bổ sung nhanh, ghi chú nhiều dòng, sửa thông tin mặt bằng, 2 bố cục (từng chặng / một trang). Nội dung: `BO-TIEU-CHI-MAT-BANG.md`. Dữ liệu trình duyệt: khóa `qtt-spa-m2v2`.
- Nguồn cũ bản 0.1: `nguon/src/cham-diem-mat-bang-0.1.html`.

- 27/10/2026 15:30: bản 0.3 – hạng mục, ẩn điểm, trang Quy chuẩn tham khảo, trang Lưu ý đàm phán hợp đồng thuê. Khuyến nghị cho tiêu chí loại nằm trong trường `kn` của từng tiêu chí.
- 27/10/2026 16:00: bản 0.4 – ô nhập độ rộng đường (1.4), lựa chọn đầu nêu số quy chuẩn, ghi chú xanh nghiêng, thanh hạng mục đủ 6 ô.
- 03/11/2026: bản 0.5 – 1.4 độ rộng đường 5 mức (6 / 5 / 3,5 / 2,5 m), biểu đồ mạng nhện có điểm từng hạng mục, trang Lưu ý hợp đồng đối chiếu BLDS 2015. Sửa trực tiếp cả `app/` và `nguon/src/` (cùng nội dung).
- 03/11/2026 19:20: bản 0.5b – 1.4 chuẩn riêng cơ sở nhỏ (từ 3,5 m), nút "Đường một chiều" (một chiều chuẩn từ 4 m) cho cơ sở vừa, lớn.

## Cập nhật 04/11/2026
- 03/11: anh chốt tạm đưa mọi module về miễn phí (CONFIG `gia:0`).
- 04/11: Công cụ 3 – Khảo sát thị trường & đối thủ **bản 0.1**: 3 hạng mục (Khu vực – không bắt buộc; Đối thủ 5–7 cơ sở; Phiếu trải nghiệm 20 tiêu chí / 4 mặt) + báo cáo (quy mô thị trường, năng lực đối thủ, khoảng trống, quy mô đề xuất, mô hình phù hợp, mạng nhện 4 mặt, cơ hội khác biệt, khuyến nghị, in, lưu `hoso.thitruong`). Giả định chạy ngầm, chỉnh ở "Điều chỉnh giả định". Nội dung: `KHAO-SAT-THI-TRUONG.md`.
