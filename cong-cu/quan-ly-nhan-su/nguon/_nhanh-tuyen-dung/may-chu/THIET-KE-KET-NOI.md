# Cổng tuyển dụng – thiết kế kết nối máy chủ (CHƯA LÀM, chờ anh duyệt)
> Viết 09/11/2026. Bản 0.5.1 mới dựng **form và trang mẫu**; phần máy chủ để bước sau (anh chốt 09/11 16:04: "các phần cần máy chủ thì cứ dựng form trước rồi kết nối sau").
> Những gì đã sẵn trong phần mềm: hàm `tdPortalHtml()` dựng trang cổng (danh sách + chi tiết + form), form có nhánh gửi `POST {D.api}/api/ung-tuyen` khi có `D.api`; ô "Kết nối máy chủ" (địa chỉ + mã kết nối) ở trang Cổng tuyển dụng. Nhánh gửi lên máy chủ **chưa kiểm thử** vì chưa có máy chủ.

## 1. Đề xuất hạ tầng (cần anh chốt)
| Hạng mục | Đề xuất | Lý do |
|---|---|---|
| Worker | Worker riêng `qtt-tuyen-dung`, tên miền `tuyendung.quantritute.com` | Không đụng Worker chấm công (`cham-cong-thu`) mà Module Lương đang dùng để gửi phiếu lương |
| Dữ liệu | D1 riêng `qtt-tuyen-dung-db` | Tách khỏi dữ liệu chấm công, dễ xóa theo công ty |
| File CV | R2 bucket `qtt-tuyen-dung-cv` | D1 không hợp để lưu file vài MB. ⚠️ R2 cần bật trên tài khoản Cloudflare – em chưa kiểm tra tài khoản của anh đã bật chưa và điều kiện gói miễn phí hiện tại, cần anh xem trang giá Cloudflare |
| Chống spam | Cloudflare Turnstile trên form + giới hạn số lần gửi theo IP | Form công khai |

## 2. Bảng dữ liệu (D1)
```sql
CREATE TABLE td_cong (slug TEXT PRIMARY KEY, ten TEXT, key_hash TEXT NOT NULL, cfg_json TEXT, cap_nhat TEXT);
CREATE TABLE td_vi_tri (slug_cong TEXT, id TEXT, slug TEXT, json TEXT, mo INTEGER DEFAULT 1, cap_nhat TEXT, PRIMARY KEY (slug_cong, id));
CREATE TABLE td_ho_so (
  ma TEXT PRIMARY KEY, slug_cong TEXT, vi_tri TEXT, ho_ten TEXT, sdt TEXT, email TEXT, kinh_nghiem TEXT, nguon TEXT,
  cv_key TEXT, cv_ten TEXT, cv_loai TEXT, cv_kb INTEGER,
  consent_at TEXT NOT NULL, consent_ver TEXT NOT NULL, consent_text TEXT NOT NULL,   -- quy tắc pháp lý dự án: lưu thời điểm + phiên bản đồng ý
  tao_luc TEXT, da_lay_luc TEXT, xoa_luc TEXT);
```

## 3. API
| Đường dẫn | Ai gọi | Việc |
|---|---|---|
| `GET /{slug}` · `GET /{slug}/{vi-tri}` | Ứng viên | Trả trang cổng (dùng lại đúng HTML `tdPortalHtml`, `mode: 'live'`), có og:image, tiêu đề, mô tả theo vị trí để chia sẻ Facebook/Zalo |
| `POST /api/ung-tuyen` | Form trên cổng | multipart: job, name, phone, email, exp, src, consent, consentText, cv (PDF/ảnh ≤ 5 MB). Kiểm tra lại ở máy chủ, lưu CV vào R2, trả `{ok, code}` |
| `POST /api/cong/dong-bo` | Phần mềm (nút "Đưa vị trí lên cổng") | Gửi thông tin công ty + các vị trí đang bật. Header `X-Ma-Ket-Noi` |
| `GET /api/cong/ho-so?sau=…` | Phần mềm (nút "Lấy hồ sơ mới") | Trả hồ sơ mới + link tải CV có hạn |
| `POST /api/cong/da-lay` | Phần mềm | Báo đã lấy về → máy chủ xóa CV và thông tin cá nhân sau N ngày (giảm dữ liệu lưu trên máy chủ) |
| `DELETE /api/cong/ho-so/{ma}` | Phần mềm | Xóa theo yêu cầu ứng viên |

## 4. Việc cần làm khi triển khai (ước lượng 1 buổi làm + anh chạy lệnh)
1. `wrangler d1 create`, `wrangler r2 bucket create`, migration bảng trên – anh chạy.
2. Worker: 6 API + render trang + Turnstile.
3. Phần mềm: nối 3 nút ở trang Cổng tuyển dụng (Lưu & thử kết nối · Đưa vị trí lên cổng · Lấy hồ sơ mới), tự lấy hồ sơ khi mở trang Ứng viên.
4. Pháp lý (quy tắc dự án mục 5 tiến độ chung): form đã có ô đồng ý + link chính sách của **công ty dùng phần mềm**; máy chủ lưu `consent_at`/`consent_ver`. Khi quantritute.com lưu hộ hồ sơ ứng viên cho công ty khác thì quantritute.com là bên xử lý dữ liệu – cần cập nhật trang Chính sách dữ liệu của quantritute.com (mục bên thứ ba nhận dữ liệu) và rà lại theo Luật 91/2025/QH15, NĐ 356/2025/NĐ-CP trước khi mở cho khách thật.
