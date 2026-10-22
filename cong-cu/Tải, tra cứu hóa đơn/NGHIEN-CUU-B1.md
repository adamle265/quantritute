# Bộ xử lý hóa đơn thuế – Bước 1: Nghiên cứu tool "Tải hóa đơn hàng loạt"

> Ngày: 17/10/2026 · Nguồn: folder `Hướng dẫn tạo tool/` (video 17 phút + giọng thuyết minh, 2 file prompt, 4 ảnh, invoice.zip, code mẫu `Tool tải hóa đơn hàng loạt.py` bản 1.3).
> Bản chép lời giọng thuyết minh: `chep-loi-video-huong-dan.txt` (chép tự động, chữ in hoa, có lỗi nhận dạng như "atifax" = artifact, "cốt bitơn" = code Python).

## 1. Quy trình tác giả video dùng (2 bước + nhật ký)
1. **Bước 1 – Dựng khung:** mô tả trang hoadondientu.gdt.gov.vn bằng lời + ảnh (bộ lọc bắt buộc/tùy chọn, 2 danh sách thả xuống, 2 tab bán ra/mua vào, 2 loại HĐĐT/máy tính tiền, file invoice.zip chỉ lấy .xml) → yêu cầu Claude **hỏi lại đủ thông tin trước** → dựng artifact giao diện → duyệt.
2. **Bước 2 – Gắn "bộ não":** yêu cầu viết 1 file Python chạy giao diện y hệt trong Chrome; nút "Chọn thư mục lưu" phải mở hộp thoại thật; kèm **yêu cầu nhật ký 8 mục** (file `nhat-ky.txt`).
3. **Sửa lỗi:** chạy → gặp lỗi → gửi `nhat-ky.txt` + 1 câu mô tả → Claude sửa. Bản sau thêm tick chọn riêng HĐĐT / HĐ máy tính tiền ở Bước 3.
4. Tác giả thử PDF nhưng bỏ (mẫu PDF tự in không giống mẫu hóa đơn gốc) → chỉ dùng XML.

## 2. Cách code mẫu hoạt động (bản 1.3)
| Thành phần | Cách làm |
|---|---|
| Chạy | 1 file .py, chỉ thư viện có sẵn của Python; mở máy chủ nội bộ `127.0.0.1:8765+` rồi tự mở Chrome; cửa sổ đen = tắt tool |
| Đăng nhập | Lấy captcha `GET /captcha` (ảnh SVG + key) → người dùng tự gõ → `POST /security-taxpayer/authenticate` {ckey, cvalue, username=MST, password} → nhận token |
| Tra cứu | `GET /query/invoices/sold` hoặc `/purchase` (HĐĐT), `/sco-query/...` (máy tính tiền); `search=tdlap=ge=dd/mm/yyyyT00:00:00;tdlap=le=...;tthai==;ttxly==;...`, `size=50`, lật trang bằng `state`; tự chia khoảng ngày theo tháng; tối đa 240 trang × 50 HĐ/nhóm |
| Tải | `GET /query/invoices/export-xml?nbmst&khhdon&shdon&khmshdon` → .zip → lấy .xml; thử lại 3 lần; tự dò đường dẫn dự phòng và nhớ đường chạy được |
| Tên file | `yyyymmdd_KýHiệu_Số8chữsố_TÊN-ĐỐI-TÁC.xml`; file đã có thì bỏ qua |
| Thêm (ẩn trong 1.3) | In PDF bằng Chrome chạy ngầm; gộp Excel 3 sheet: Bảng kê HĐ, Chi tiết hàng hóa, Tổng hợp theo thuế suất (tự viết .xlsx, không cần thư viện) |
| Nhật ký | Đủ 8 mục: xoay vòng 5 MB, che mật khẩu/token/captcha/dãy số ≥12 chữ số, ghi nguyên văn lỗi máy chủ |
| Mã trạng thái | tthai 1–6 (mới, thay thế, điều chỉnh, bị thay thế, bị điều chỉnh, bị hủy); ttxly 0–8 (theo ảnh 3–4) |

Lưu ý: các địa chỉ API trên là **API nội bộ của trang thuế, không công bố chính thức** – lấy từ code mẫu, em chưa kiểm chứng trực tiếp được (cần tài khoản thật). Cục Thuế có thể đổi bất cứ lúc nào.

## 3. Điểm cần sửa nếu làm bản của mình
1. **Mật khẩu lưu dạng base64 trong `cai-dat.json`** – base64 không phải mã hóa, ai mở file cũng đọc được → dùng mã hóa của Windows (DPAPI) hoặc không lưu.
2. **Tắt kiểm tra chứng chỉ SSL** (`CERT_NONE`) → dễ bị giả mạo máy chủ; nên bật, chỉ hạ mức khi lỗi và ghi cảnh báo.
3. **Ô ngày dùng `<input type=date>`** → hiện mm/dd/yyyy theo trình duyệt (thấy rõ trong video: 07/19/2026) – trái quy ước dd/mm/yyyy đã chốt.
4. **Bắt người dùng cài Python** – rào cản lớn với kế toán → cần đóng gói .exe (code đã hỗ trợ chạy dạng đóng gói); lưu ý .exe chưa ký số sẽ bị Windows SmartScreen/antivirus cảnh báo.
5. Không có độ trễ giữa các lần tải → dễ bị máy chủ thuế chặn khi tải hàng trăm HĐ; nên giãn nhịp + giới hạn.
6. Font Google tải online – máy không mạng ngoài vẫn chạy nhưng giao diện lệch.
7. Đây là code người khác viết – nếu phát hành trên quantritute.com nên viết lại bản riêng (học cách làm, không chép nguyên).

## 4. Giới hạn kỹ thuật quan trọng
- Bản HTML thuần trên web (kiểu "Dùng online") **gần như chắc chắn không gọi được API trang thuế** do trình duyệt chặn gọi chéo tên miền (CORS) – chưa kiểm chứng thực tế. Vì vậy phần "Tải hàng loạt" cần chạy trên máy người dùng (Python/.exe, hoặc tiện ích Chrome). Các phần sau (trích xuất XML → Excel, tờ khai, file import MISA) làm được bằng HTML thuần.
- Tờ khai: căn cứ **89/2026/TT-BTC** (HL 01/07/2026, theo Cẩm nang). Mẫu tờ khai cụ thể cần đọc toàn văn trước khi làm – chưa kiểm chứng.

## 5. Tham khảo công cụ EzTech (file PDF anh gửi 17/10)
- 4 chức năng: (1) Tải HĐ đầu vào hàng loạt bằng **bookmark** (bookmarklet) chạy ngay trên trang hoadondientu.gdt.gov.vn đã đăng nhập → 1 file ZIP gồm XML + bảng kê; (2) Import XML → Excel 3 sheet (Tổng hợp HĐ, Chi tiết hàng hóa, Flat all-in-one); (3) In hàng loạt PDF từ file ZIP; (4) Tách file PDF tổng thành từng hóa đơn.
- Đăng nhập Google để dùng; bookmark chỉ hiệu lực 24 giờ (cách giới hạn quyền dùng). Không cần cài phần mềm.
- Hạn chế thấy được: chỉ tải hóa đơn **đang hiển thị trên trang hiện tại** (tối đa 50/trang); tài liệu chỉ nói đầu vào; tải từng HĐ cách 1 giây, lỗi thì thử lại 2s→4s→6s.
- Kết luận kỹ thuật: chạy ngay trên trang thuế thì không bị chặn gọi chéo tên miền, dùng luôn phiên đăng nhập của trình duyệt → tool không cần giữ mật khẩu. Đề xuất phương án lai: bookmarklet cho phần tải + web HTML cho các phần xử lý file (chi tiết trong hội thoại 17/10 16:30).

## 6. KẾT QUẢ KIỂM CHỨNG KỸ THUẬT (17/10/2026 16:20–16:40, tài khoản DN thật của anh, trình duyệt tích hợp) – ĐẠT
| Hạng mục | Kết quả |
|---|---|
| CSP trang thuế | Không có → mã chèn (bookmarklet) chạy được |
| Phiên đăng nhập | Cookie `jwt` (đọc được bằng JS, dài 192 ký tự); gửi dạng `Authorization: Bearer <jwt>` |
| Địa chỉ API | Cùng tên miền: `https://hoadondientu.gdt.gov.vn/api/...` |
| **Header bắt buộc** | Thiếu thì bị 403 "Hệ thống phát hiện hành vi không hợp lệ". Trang thật gửi: `Action` = tên thao tác đã encodeURIComponent (vd "Tìm kiếm (hóa đơn bán ra)", "Xuất xml (Hóa đơn bán ra)"), `End-Point: /tra-cuu/tra-cuu-hoa-don`, `request-id` = UUID mới, `Accept-Language: vi` |
| Tra cứu | `/api/query/invoices/sold|purchase`, `/api/sco-query/invoices/sold|purchase`; tham số `sort=tdlap:desc&size=50&search=tdlap=ge=dd/mm/yyyyT00:00:00;tdlap=le=dd/mm/yyyyT23:59:59[;ttxly==5]` (search để nguyên, không encode); mua vào trang thật mặc định `ttxly==5` (HĐĐT) / `ttxly==8` (MTT) |
| Lật trang | Trường `state` → tham số `&state=`. Thử 9/2026 bán ra: 9 trang, 446/446 HĐ, không trùng, 8,5 giây |
| Tải XML | `/api/query/invoices/export-xml?nbmst&khhdon&shdon&khmshdon` (MTT: `/api/sco-query/...`) → ZIP ~313 KB (có invoice.xml + invoice.html + ảnh). Đạt cả bán ra, mua vào, MTT mua vào |
| Tốc độ | 12 HĐ liên tiếp, nghỉ 0,3s: tất cả 200, 0,2–0,7 s/HĐ → ~0,7 s/HĐ, 446 HĐ ≈ 5 phút |
| Chưa thử | MTT bán ra (tài khoản không có HĐ); tải >100 HĐ liên tục (ngưỡng chặn); phiên hết hạn giữa chừng |
