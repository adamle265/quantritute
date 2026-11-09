# Chấm công Wi-Fi – bản thử nghiệm (0.2.0-thu 31/10/2026 → 0.3.1 ngày 07/11/2026)

## Chế độ dùng thử (07/11/2026 18:10) – để mọi người trải nghiệm, góp ý
Tự bật khi chạy ở tên miền `chamcong-thu.*` (hoặc biến môi trường `DEMO=1`). Không sửa `wrangler.jsonc`.
1. Đưa lên: PowerShell tại thư mục này → `.\trien-khai.cmd`. Lần gọi đầu máy chủ tự tạo 15 tài khoản nhân sự mẫu (Đốm Sáng Edu DS001–DS009 trừ DS003 đã nghỉ, Health SG001–SG007), **PIN chung 123456**. Mã trùng tài khoản thử cũ thì PIN cũ bị thay.
2. `/quan-ly` và `/tram` **không cần mật khẩu**; khóa: đổi cài đặt, mã PIN, mã QR, mã kết nối, xóa dữ liệu, ngừng nhân viên. Mã kết nối cũ (nếu đã tạo) vẫn dùng được.
3. Mỗi ngày máy chủ tự dọn: lượt chấm quá 14 ngày, lượt từ chối quá 3 ngày, đơn điện thoại quá 14 ngày, IP văn phòng quá 2 ngày; xác nhận công về "chưa xác nhận".
4. Trang nhân viên: chọn nhân sự → tự điền mã + PIN → Đăng nhập; hướng dẫn 4 bước (Wi‑Fi → tắt Wi‑Fi bị từ chối → quét QR → đơn nghỉ, xác nhận công).
5. Phần mềm nhân sự (dữ liệu mẫu) tự lấy lượt chấm + đơn qua `/api/demo/*` – không cần mã kết nối.
6. Đổi dữ liệu mẫu thì chạy `node tao-du-lieu-thu.cjs` rồi `trien-khai.cmd`.
7. (08/11) Lượt chấm mẫu 01–07/11 nạp sẵn; ngày sau đó máy chủ tự sinh mỗi ngày (lượt mẫu không bị dọn). Trang nhân viên có Bảng chấm công T08–T11. `/phan-mem` = Phần mềm quản lý nhân sự bản xem trước (chép từ `nguon/build/index.html` khi `node build.js`) – nhớ build trước khi `trien-khai.cmd`.

## Bản 0.3.1 (07/11/2026) – nối Phần mềm quản lý nhân sự
Máy chủ này là **nơi lưu chính** lượt chấm, đơn nghỉ gửi từ điện thoại, xác nhận công (anh chốt 07/11).
1. Đưa bản mới lên: PowerShell tại thư mục này → `.\trien-khai.cmd` (database tự thêm bảng `don`, `cong` khi chạy lần đầu, dữ liệu cũ giữ nguyên).
2. `/quan-ly` → **Cài đặt → Kết nối Phần mềm quản lý nhân sự → Tạo mã kết nối** → chép Địa chỉ + Mã (mã chỉ hiện 1 lần).
3. Phần mềm nhân sự (`app/index.html`) → Chấm công → **Chấm công Wi‑Fi** → dán vào ô của công ty → Kết nối.
4. Danh sách nhân sự → ô Tài khoản → **Cấp tài khoản / Đặt lại PIN** → PIN tự gửi lên máy chủ. Nhân viên đăng nhập `/` bằng mã NV + PIN.
5. Thử: chấm Vào/Ra · **+ Gửi đơn** nghỉ trên điện thoại · phần mềm **Đồng bộ ngay** → đơn vào Nghỉ phép, lượt chấm vào Tổng hợp công · duyệt đơn → điện thoại thấy Đã duyệt · Chốt công tháng → điện thoại hiện thẻ **Xác nhận công** → Đúng / Báo sai → Đồng bộ → thanh chốt hiện "Nhân viên xác nhận x/y".
- Lưu ý: PIN cấp **trước** khi kết nối không gửi được (phần mềm chỉ lưu dạng mã hóa) → trang Chấm công Wi‑Fi liệt kê người "chưa có PIN trên máy chủ" → Đặt lại PIN.
- Đã chạy thử cục bộ (wrangler dev) ngày 07/11/2026: đạt toàn bộ luồng trên. Chưa thử trên Cloudflare thật.


Mục đích: kiểm tra trên **mạng thật** xem cách nhận Wi-Fi văn phòng qua IP có chạy ổn với Android và iPhone không, trước khi làm bản đầy đủ ghép vào phần mềm nhân sự.

- Địa chỉ: **https://chamcong-thu.quantritute.com**
  - `/` – nhân viên (đăng nhập, bấm Vào ca / Ra ca)
  - `/tram` – màn hình chung (báo IP văn phòng, QR động 30 giây, danh sách có mặt)
  - `/quan-ly` – quản lý (nhân viên, lượt chấm, IP văn phòng, lượt bị từ chối, cài đặt, tải CSV)
- Chạy trên tài khoản Cloudflare của anh, **database riêng** `qtt-cham-cong-thu-db`, Worker riêng `qtt-cham-cong-thu`. Không đụng web quantritute.
- Gói miễn phí Cloudflare là đủ cho bản thử.

## Bước 1. Đưa lên Cloudflare (một lần)
1. Mở PowerShell tại thư mục này → gõ `.\trien-khai.cmd`.
2. Script tự tạo database (nếu chưa có), tự điền mã database vào `wrangler.jsonc`, rồi đưa Worker lên.
3. Chờ vài phút cho tên miền `chamcong-thu.quantritute.com` có hiệu lực.

Sửa mã sau này: sửa `src/*` → chạy lại `.\trien-khai.cmd` (dữ liệu giữ nguyên).

## Bước 2. Cài đặt lần đầu (máy tính, đang ở văn phòng)
1. Mở `/quan-ly` → đặt tên đơn vị + **mã PIN quản lý (6–12 số)**. Phần mềm chỉ lưu dạng băm, quên là không lấy lại được.
2. Tab **Nhân viên** → thêm 2 người thử, ví dụ `NV001` (cho Android) và `NV002` (cho iPhone), mỗi người một PIN 4–8 số.
3. Mở **Màn hình chung** trên thiết bị đặt ở văn phòng (điện thoại cũ / máy tính) → nhập PIN quản lý để kích hoạt → màn hình hiện giờ, QR và dòng "IP văn phòng".

## Bước 3. Danh sách test (ghi Đạt / Không đạt + ảnh chụp nếu lỗi)

| # | Thử | Kỳ vọng |
|---|---|---|
| 1 | Android bắt Wi-Fi văn phòng → mở `/` → đăng nhập NV001 → **Vào ca** | Báo "Đã chấm … (Wi-Fi)" |
| 2 | iPhone bắt Wi-Fi văn phòng → Safari mở `/` → đăng nhập NV002 → **Vào ca** | Như trên. Nếu bị từ chối → xem mục **iPhone** bên dưới |
| 3 | Ghim ra màn hình chính (Android: ⋮ → Thêm vào màn hình chính; iPhone: Chia sẻ → Thêm vào MH chính), mở từ biểu tượng, chấm **Ra ca** | Chạy như ứng dụng, chấm được. iPhone có thể phải đăng nhập lại một lần (biểu tượng và Safari tách đăng nhập) |
| 4 | Tắt Wi-Fi (dùng 4G) → bấm chấm | Bị từ chối: "Không nhận ra mạng Wi-Fi văn phòng" |
| 5 | Vẫn 4G → mở **camera** điện thoại quét QR trên màn hình chung → bấm chấm | Chấm được, ghi "QR"; màn hình chung hiện ô **Vừa chấm** và thêm lượt vào danh sách trong ≤ 8 giây |
| 6 | Chụp ảnh QR, chờ đến khi mã trên màn hình đổi (khoảng 35 giây), quét ảnh đó | Bị từ chối ngay khi mở: "Mã QR này đã đổi" |
| 7 | Bấm Vào ca 2 lần liên tiếp | Lần 2 báo "không ghi trùng" |
| 8 | Ở nhà (Wi-Fi nhà) bấm chấm | Bị từ chối |
| 9 | **Khởi động lại router văn phòng** → chờ mạng lên → bấm chấm *trước* khi màn hình chung tự làm mới | Có thể bị từ chối nếu IP đổi. Màn hình chung tự báo IP mới sau ≤ 20 giây (hoặc tải lại trang) → chấm lại được |
| 10 | `/quan-ly` → tab **Lượt chấm**: xem tóm tắt ngày, chi tiết, thêm lượt chấm bổ sung, hủy một lượt, **Tải CSV tháng** mở bằng Excel | Đủ cột, ngày dd/mm/yyyy, tiếng Việt không lỗi |
| 11 | Tab **Mạng văn phòng**: xem có mấy IP, IPv4 hay IPv6 | Ghi lại để em biết mạng văn phòng dùng loại nào |
| 12 | Tab **Bị từ chối**: xem lượt nào bị từ chối, thiết bị gì, IP gì | Dùng để em chẩn đoán |
| 13 | Trên **một** điện thoại: đăng nhập NV001 → chấm → Đăng xuất → đăng nhập NV002 → chấm | Trang quản lý hiện dải đỏ **Cảnh báo chấm hộ**, tab **Máy dùng chung (1)** liệt kê máy đó với 2 nhân viên; lượt chấm của NV002 có nhãn đỏ "Máy dùng chung với …"; file CSV có cột Cảnh báo |
| 14 | Ở tab Máy dùng chung, ghi chú "máy thử" → **Đã kiểm tra** | Hết cảnh báo đỏ; bấm **Theo dõi lại** thì cảnh báo quay lại |

### iPhone bị từ chối dù đang bắt Wi-Fi văn phòng?
Nguyên nhân hay gặp là **Chuyển tiếp bảo mật iCloud (iCloud Private Relay)** hoặc VPN: Safari đi qua máy chủ của Apple nên IP khác IP văn phòng.
- Thử: Cài đặt → Wi-Fi → bấm (i) cạnh mạng văn phòng → tắt **Chuyển tiếp bảo mật iCloud** → chấm lại.
- So IP hiện trên điện thoại với IP văn phòng ở tab Mạng văn phòng.
- Ghi lại kết quả: tên cài đặt chính xác trên máy anh, trước/sau khi tắt có chấm được không. (Tên mục cài đặt em chưa kiểm chứng trên iOS mới nhất.)

### Lưu ý khác khi test
- **IPv4 vs IPv6:** nếu màn hình chung báo IPv6 mà điện thoại đi IPv4 (hoặc ngược lại), lượt chấm sẽ bị từ chối. Cách xử lý tạm: tab Mạng văn phòng → **Thêm IP của máy này** trên điện thoại đó (hoặc nhập IP thấy ở tab Bị từ chối). Anh ghi lại nếu gặp – đây là điểm em cần dữ liệu thật để xử lý tự động.
- Bản thử đang **hiện IP** cho nhân viên để dễ chẩn đoán; tắt ở tab Cài đặt.
- Xong test muốn làm lại: tab Cài đặt → gõ `XOA` → **Xóa dữ liệu chấm công** (giữ nhân viên, IP, cài đặt).
- Dữ liệu thử nằm trên tài khoản Cloudflare của anh; chỉ nhập tên thử, không nhập dữ liệu thật của công ty chị.

## Cấu trúc
```
trien-khai.cmd     ← chạy để đưa lên Cloudflare
chuan-bi.mjs       ← tạo database D1 + điền database_id (trien-khai.cmd tự gọi)
wrangler.jsonc     ← cấu hình Worker, tên miền, database
src/worker.js      ← máy chủ: API, kiểm tra IP, QR động, phân quyền
src/app.html       ← giao diện 3 trang (nhân viên / màn hình chung / quản lý)
src/qrcode.mjs     ← thư viện vẽ QR (qrcode-generator 2.0.4, MIT)
src/icon.js        ← biểu tượng ứng dụng
```

## Đã kiểm thử trên máy của Claude (31/10/2026)
Chạy giả lập: cài đặt lần đầu, đăng nhập sai/khóa 15 phút/mở khóa, chấm qua Wi-Fi (IPv4 và IPv6 cùng dải /64), từ chối 4G, chấm bằng QR khi 4G, QR giả bị từ chối, chặn bấm trùng, chế độ chỉ QR, chấm bổ sung, CSV, phân quyền (nhân viên không vào được trang quản lý), giao diện sáng/tối, 390px và 1280px. **Chưa thử trên mạng thật** – đó là mục đích của lần test này.

## Thay đổi bản 0.1.1-thu (31/10/2026, sau lần test đầu – 12/12 mục đạt)
- **QR chặt hơn:** mã chỉ nhận trong 30 giây đang hiện (thêm 5 giây nếu đang quét đúng lúc đổi mã). Kiểm tra ngay lúc mở link; quét đúng mã thì có 2 phút để đăng nhập và bấm chấm.
- **Màn hình chung:** hiện **tất cả** lượt chấm trong ngày của từng người (trước chỉ hiện vào đầu tiên/ra cuối cùng nên lượt vào thứ hai bằng QR không thấy), thêm ô **Vừa chấm** (90 giây gần nhất), tự làm mới mỗi 8 giây.

## Thay đổi bản 0.2.0-thu (31/10/2026) – chống chấm hộ lớp 2 (anh chốt chỉ làm lớp này)
- Mỗi trình duyệt có **mã máy** riêng (cookie `qtt_may`, giữ 2 năm, đăng xuất không mất). Ghi mã máy vào mỗi lần đăng nhập, mỗi lượt chấm, mỗi lượt bị từ chối.
- Một máy dùng cho **≥ 2 nhân viên** → dải đỏ "Cảnh báo chấm hộ" + tab **Máy dùng chung**; nhãn đỏ trên lượt chấm; cột **Mã máy**, **Cảnh báo** trong CSV. Quản lý bấm **Đã kiểm tra** cho trường hợp hợp lệ (máy thử, mượn máy).
- Không báo cho nhân viên (tránh lộ cách phát hiện). Dữ liệu cũ trước bản này không có mã máy.
- Giới hạn: xóa dữ liệu trình duyệt, dùng tab ẩn danh hoặc trình duyệt khác sẽ ra mã máy mới → không phát hiện được. Đây là lớp phát hiện, không phải lớp chặn.
- Sửa lỗi: lượt chấm bổ sung có giờ sau thời điểm hiện tại không còn làm lượt bấm thật bị coi là "trùng".
