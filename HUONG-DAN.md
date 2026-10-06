# Quản trị tử tế – Hướng dẫn cài đặt và vận hành

Phiên bản 1.2 · 05/10/2026

## 0. Sản phẩm gồm những gì

| Phần | Địa chỉ (sau khi cài) | Dành cho |
|---|---|---|
| **Trang khách** | `https://quantritute.pages.dev` (sau gắn `quantritute.vn`) | Người xem: trang chủ bàn làm việc + đèn, Bộ công cụ, Hành trình, Blog, Phát triển bản thân, Liên hệ |
| **Trang quản trị** (link riêng) | `https://quantritute-admin.pages.dev` (sau gắn `admin.quantritute.vn`) | Anh Tuấn: quản lý công cụ, tập Hành trình, bài viết, đặt hàng công cụ, lịch tư vấn 1:1, cài đặt |

```
Khách ──► quantritute (Pages) ──► /api công khai ──┐
                                                   ├──► Database D1 "quantritute-db" (dùng chung)
Anh ────► quantritute-admin (Pages) ──► /api/admin ┘   (cần mật khẩu quản trị)
```

- Trang khách **không có** địa chỉ quản trị nào. Quản trị chạy ở dự án riêng, có mật khẩu riêng.
- Cách làm giống bộ Tiện ích Nhungdao: Cloudflare Pages + Pages Functions + D1, cài bằng một lệnh.

## 1. Chuẩn bị

| Việc | Ghi chú |
|---|---|
| Máy tính có **Node.js** (bản LTS) | Anh đã có sẵn từ lúc làm web Nhungdao |
| Tài khoản **Cloudflare** | Dùng tài khoản riêng của anh cho Quản trị tử tế (không dùng chung tài khoản của khách hàng) |
| Tên miền `quantritute.vn` | Chưa bắt buộc. Có thể chạy bằng địa chỉ `.pages.dev` trước, mua tên miền sau |

## 2. Cài đặt lần đầu (khoảng 10 phút)

1. Giải nén file `quantritute.zip` vào một thư mục, ví dụ `Dự án 5.0/04_Website/quantritute`.
2. Mở cửa sổ lệnh **trong thư mục `quantritute`** (Windows: mở thư mục → gõ `cmd` vào thanh địa chỉ → Enter).
3. Chạy lần lượt:

```bash
npm install
npm run setup
```

Script `setup` tự làm 7 bước:

1. Đăng nhập Cloudflare (trình duyệt mở ra, bấm **Allow**)
2. Tạo database `quantritute-db`
3. Tạo bảng và nạp sẵn 15 công cụ theo sơ đồ của anh, Tập 01 (bản nháp)
4. Tạo 2 dự án Pages: `quantritute` và `quantritute-admin`
5. Hỏi mật khẩu quản trị → **lần đầu gõ `y`** rồi nhập mật khẩu (tối thiểu 10 ký tự, ghi lại ở nơi an toàn)
6. Đưa trang khách lên mạng
7. Đưa trang quản trị lên mạng

> Chạy lại `npm run setup` bao nhiêu lần cũng được: database và dữ liệu cũ được giữ nguyên. Khi hỏi mật khẩu, bấm Enter để giữ mật khẩu cũ.

> Nếu tên `quantritute` đã bị người khác dùng trên Cloudflare, địa chỉ có thể kèm thêm vài ký tự. Script in ra địa chỉ đúng ở cuối.

## 3. Việc làm ngay sau khi cài

Vào trang quản trị → đăng nhập → **Cài đặt**:

| Nhóm | Nhập gì |
|---|---|
| Trang chủ | Địa chỉ trang khách (để nút "Xem trang khách" hoạt động), câu định vị, câu phụ, thông báo đầu trang (nếu có) |
| Liên hệ & mạng xã hội | Số điện thoại, Zalo, email, link TikTok / Fanpage / YouTube |
| Form trên web | Bật/tắt nhận đặt hàng công cụ, bật/tắt nhận lịch tư vấn |
| Mời cà phê | Mã ngân hàng VietQR (VD `MB`, `VCB`, `TCB`), số tài khoản, chủ tài khoản, nội dung chuyển khoản → web tự hiện mã QR |

Sau đó vào **Công cụ** → mở từng tool → dán **Link công cụ** (trang Cloudflare của tool), thêm video, viết giới thiệu.

## 4. Gắn công cụ của anh vào web

Có 2 cách cho mỗi tool:

| Tool đang ở dạng | Cách gắn |
|---|---|
| Đã có trang trên Cloudflare | Quản trị → Công cụ → mở tool → dán link vào **Link công cụ** → Lưu |
| File HTML tải về, mở bằng trình duyệt | Chép file vào `site/public/tools/<duong-dan>/index.html` (VD `site/public/tools/doc-hoa-don-xml/index.html`) → chạy `npm run deploy:site` → trong quản trị dán link `/tools/doc-hoa-don-xml/` |

Tích **"Nhúng công cụ ngay trong trang"** nếu muốn tool hiện luôn trong trang web thay vì mở tab mới.

### Công cụ đã gắn sẵn

| Tool | Đường dẫn | Ghi chú |
|---|---|---|
| Cẩm nang tra cứu Thuế – Kế toán – Lao động 2026 | `/tools/cam-nang-thue-2026/` | Bản gốc của anh, đã bỏ thông tin tổ chức cũ, bỏ cổng mã truy cập và form thu thông tin. Nút liên hệ trỏ về `/lien-he`, `/cong-cu`. Database tự gắn link vào tool "tra-cuu-van-ban" |

## 5. Vận hành hằng ngày (trong trang quản trị)

| Mục | Dùng để |
|---|---|
| Tổng quan | Số đặt hàng mới, yêu cầu tư vấn mới, tool đang dùng được, nội dung đã đăng, biểu đồ 30 ngày, việc còn thiếu trong Cài đặt |
| Đặt hàng công cụ | Xem người xem cần gì; đổi trạng thái Mới → Đang xem → Sẽ làm → Đã có tool; gộp yêu cầu trùng bằng ô "Lượt cùng cần" |
| Lịch tư vấn 1:1 | Xem yêu cầu, ghi lịch hẹn, đổi trạng thái, ghi chú nội bộ |
| Công cụ | Thêm / sửa / ẩn tool, đổi trạng thái (Dùng được, Sắp ra, Có phí, Đang rà soát), sắp thứ tự, gắn video theo từng tính năng |
| Hành trình | Thêm tập video dài (link YouTube) và các shorts cắt ra |
| Bài viết | Viết bài cho Blog (Quản trị, Hành trình trưởng thành, Gia đình) và Phát triển bản thân (Sách, Video) |
| Cài đặt | Như mục 3 |

Mỗi danh sách có ô tìm kiếm, lọc trạng thái và nút **Tải file Excel (CSV)**.

## 6. Gắn tên miền (khi đã mua `quantritute.vn`)

Làm đúng thứ tự (thêm ở Cloudflare TRƯỚC, rồi mới tạo bản ghi ở nhà cung cấp tên miền):

1. Cloudflare → Workers & Pages → `quantritute` → **Custom domains** → thêm `quantritute.vn` (và `www.quantritute.vn` nếu muốn).
2. Cloudflare → `quantritute-admin` → **Custom domains** → thêm `admin.quantritute.vn`.
3. Tại nơi quản lý DNS tên miền, tạo bản ghi theo đúng hướng dẫn Cloudflare hiện ra (CNAME `admin` → `quantritute-admin.pages.dev`, v.v.). Nếu chuyển hẳn DNS về Cloudflare thì Cloudflare tự tạo.
4. Chờ trạng thái **Active** (vài phút đến vài giờ). HTTPS tự cấp.
5. Vào Quản trị → Cài đặt → sửa "Địa chỉ trang khách" thành `https://quantritute.vn`.

## 7. Cập nhật phiên bản (làm cuốn chiếu)

Mỗi lần em gửi bản mới:

1. Chép đè các thư mục `src`, `site/public`, `site/functions`, `admin/public`, `admin/functions`, `scripts` và file `schema.sql`.
2. **Không chép đè** `site/wrangler.jsonc` và `admin/wrangler.jsonc` (chứa mã database thật).
3. Chạy:

```bash
npm run db:init     # chỉ khi bản mới có thêm bảng (em sẽ báo)
npm run deploy      # đưa cả trang khách và trang quản trị lên
```

Chỉ sửa trang khách: `npm run deploy:site`. Chỉ sửa quản trị: `npm run deploy:admin`.

## 8. Bảo mật

| Việc | Cách làm |
|---|---|
| Đổi mật khẩu quản trị | `npm run setup` → gõ `y` ở bước mật khẩu. Hoặc `npx wrangler pages secret put ADMIN_TOKEN --project-name quantritute-admin` rồi `npm run deploy:admin` |
| Khoá thêm một lớp (khuyên dùng) | Cloudflare → Zero Trust → Access → tạo ứng dụng cho `admin.quantritute.vn`, chỉ cho phép email của anh. Khi đó phải xác thực email trước, rồi mới tới mật khẩu |
| Dữ liệu người xem | Form tư vấn bắt buộc tích đồng ý lưu thông tin. Chỉ dùng để liên hệ lại. Không nhập dữ liệu khách hàng của công ty cũ vào hệ thống này |
| Chống spam | Form có bẫy bot và giới hạn số lần gửi mỗi giờ theo địa chỉ mạng |

## 9. Thử trên máy trước khi đưa lên (không bắt buộc)

```bash
npm run db:local     # tạo database thử trên máy
npm run dev:site     # mở http://localhost:8788
npm run dev:admin    # cửa sổ lệnh khác, mở http://localhost:8789 – mật khẩu thử: matkhauthu123
```

## 10. Cấu trúc thư mục

| Thư mục / file | Nội dung |
|---|---|
| `site/public/` | Trang khách: `index.html`, `app.js`, `style.css`, ảnh bàn làm việc trong `assets/`, công cụ HTML đặt trong `tools/` |
| `site/functions/api/` | Cổng vào API công khai |
| `admin/public/` | Trang quản trị: `index.html`, `admin.js`, `admin.css` |
| `admin/functions/api/` | Cổng vào API quản trị |
| `src/core.js` | Cấu trúc dữ liệu, cài đặt, kiểm tra dữ liệu dùng chung |
| `src/public-api.js` | Xử lý cho trang khách |
| `src/admin-api.js` | Xử lý cho trang quản trị |
| `schema.sql` | Cấu trúc database + dữ liệu ban đầu |
| `scripts/setup.mjs` | Script cài đặt tự động |
| `site/wrangler.jsonc`, `admin/wrangler.jsonc` | Cấu hình Cloudflare (setup tự điền mã database) |

## 11. Phần sẽ làm ở các bản sau

- Thanh toán tự động qua SePay cho tool có phí (giống Tiện ích Nhungdao), sau khi anh đăng ký hộ kinh doanh.
- Ghi nhận ủng hộ tự động qua SePay.
- Trang riêng cho từng tập Hành trình, tối ưu tìm kiếm Google (SEO) cho trang tool và bài viết.
- Tải ảnh trực tiếp từ trang quản trị (hiện dán link ảnh).

## 12. Bản 1.2 – Trang Bộ công cụ mới

- Tab theo chủ đề: **Tiện ích nổi bật** (mặc định), Kế toán – Tài chính, Hành chính – Nhân sự, Hỗ trợ khởi nghiệp, Học tập, Tất cả.
- Thẻ công cụ: icon, tên, giá (Free xanh lá / Có phí đỏ), trạng thái (Dùng được / Coming soon / Đang rà soát), vấn đề giải quyết, tag. Bỏ số "Tool 01, 02…".
- Bấm vào thẻ: popup chi tiết (banner, tính năng nổi bật, tính năng hữu ích, phiên bản, ngày cập nhật, tác giả, đối tượng, cách sử dụng: truy cập link / tải về).
- Database cũ **tự nâng cấp** ở lần mở web đầu tiên sau khi deploy (thêm cột, chuyển nhóm, trạng thái, icon, tag). Không cần chạy `db:init`.
- Quy tắc trạng thái lúc nâng cấp: tool chưa có Link công cụ → Coming soon; tool trước đây ghi "Có phí" → giá Có phí.
- Nhập liệu trong Quản trị → Công cụ: "Tính năng nổi bật" mỗi dòng `Tên | mô tả`; "Tính năng hữu ích" và "Cách sử dụng" mỗi dòng 1 ý.

## 13. Bản 1.3 – Theo dõi văn bản pháp luật mới cho Cẩm nang (05/10/2026)

**Làm gì:** mỗi ngày lúc 08:00 (đổi số ngày trong Quản trị → Cài đặt → "Theo dõi văn bản pháp luật mới"), Worker `quantritute-watch` đọc 5 danh sách văn bản mới trên chinhphu.vn, lọc văn bản liên quan 8 chủ đề cẩm nang, ghi vào **Quản trị → Văn bản pháp luật mới** ở trạng thái *Chờ duyệt*. Chỉ văn bản anh bấm **Duyệt & hiện trên cẩm nang** mới hiện ở khối "🔔 Cập nhật pháp lý mới cần chú ý" trên trang chủ cẩm nang, kèm nhãn "đang chờ cập nhật" ở chủ đề liên quan.

**Triển khai (1 lần):** mở PowerShell tại thư mục `quantritute` → `.\trien-khai-theo-doi-van-ban.cmd`. Lần đầu Cloudflare có thể hỏi bật Workers AI: chọn đồng ý. Sau đó vào quản trị bấm **Quét ngay**.

| Việc | Cách làm |
|---|---|
| Duyệt văn bản | Quản trị → Văn bản pháp luật mới → mở văn bản → đọc văn bản gốc → sửa Tiêu đề / Tóm tắt / Ảnh hưởng / Nên làm → **Duyệt & hiện trên cẩm nang** (hoặc **Loại**) |
| Đã sửa nội dung cẩm nang theo văn bản mới | Tích "Đã cập nhật nội dung này vào cẩm nang" → Lưu (nhãn cảnh báo ở chủ đề tự tắt) |
| Gỡ khỏi trang cẩm nang | Đổi trạng thái sang "Loại" |
| Thêm văn bản từ nguồn khác (Cục Thuế, BHXH…) | Nút **+ Thêm văn bản**, nhập tay, chọn trạng thái |
| Xem văn bản bộ lọc đã bỏ qua | Lọc trạng thái "Tự bỏ qua" (giữ 200 ngày) |
| Sửa nội dung cẩm nang xong | Chạy `npm run legal:index` để cập nhật danh sách căn cứ cho bộ lọc, rồi `npm run deploy:admin` và `npm run deploy:watch` |
| Dùng Claude thay Workers AI (tóm tắt tốt hơn, có phí theo lượt) | `npx wrangler secret put ANTHROPIC_API_KEY --config watch/wrangler.jsonc` và `npx wrangler pages secret put ANTHROPIC_API_KEY --project-name quantritute-admin` |
| Xem Worker có chạy không | Cloudflare → Workers & Pages → `quantritute-watch` → Logs; hoặc bảng nhật ký quét trong trang quản trị |

**Cách bộ lọc chấm điểm** (`src/legal-watch.js`, từ khóa ở `scripts/build-legal-index.mjs`): nhắc tới văn bản đang dùng trong cẩm nang +60; từ khóa chủ đề +20…40; Luật/NQ Quốc hội +20, Nghị định/Thông tư +10; cơ quan BTC/BNV/BHXH +10; văn bản nhân sự, thi đua, tổ chức bộ máy −50. ≥60 Quan trọng · ≥45 Nên xem → vào *Chờ duyệt*. Dưới 45 (trừ văn bản sửa đổi văn bản đang dùng trong cẩm nang) → *Tự bỏ qua*, vẫn tra lại được. Bản 1.3.1 (05/10/2026) loại thêm: cựu chiến binh, năng lượng, lao động đi nước ngoài, chuẩn mực kiểm toán, cán bộ công chức – viên chức. Văn bản đã có trong cẩm nang được đánh dấu "Đã có".

**Giới hạn cần nhớ:** chỉ đọc chinhphu.vn (thiếu nhiều công văn của Cục Thuế, BHXH VN); AI chỉ đọc trích yếu và trang thông tin, không đọc PDF; gói Cloudflare miễn phí giới hạn thời gian xử lý mỗi lượt. Nếu nhật ký báo lỗi liên tục, gửi BuBu ảnh chụp.

### Bản 1.3.2 (06/10/2026)
- **Thẻ đề xuất ngay trên danh sách:** Quản trị → Văn bản pháp luật mới hiện các thẻ "✅ Đề xuất: Duyệt / ❌ Đề xuất: Loại" kèm lý do, tiêu đề, tóm tắt, điểm cập nhật chính, ngày hiệu lực và nút **Duyệt & hiện trên cẩm nang**, **Loại**, **Sửa chi tiết**; nút **Làm theo tất cả đề xuất** (bấm 2 lần để chắc chắn).
- **Điểm cập nhật chính:** mỗi văn bản có danh sách gạch đầu dòng, hiện trên khối "Cập nhật pháp lý mới" của Cẩm nang cùng nhãn ngày hiệu lực và link văn bản gốc.
- **Văn bản PDF bản scan:** mở "Sửa chi tiết" → dán toàn văn (file Word / PDF có chữ: Ctrl+A, Ctrl+C) vào ô "Toàn văn" → bấm **AI đọc toàn văn & soạn lại nội dung** → xem lại → Duyệt.
- Lần mở đầu sau khi triển khai, database tự thêm cột mới và điền sẵn đề xuất BuBu đã soạn cho 8 văn bản của lượt quét 05/10/2026.
- Cẩm nang: đã thêm Nghị quyết 43/2026/QH16 vào chủ đề Thuế TNCN và Thuế TNDN.
- Triển khai: `.\trien-khai-theo-doi-van-ban.cmd` (đưa cả trang khách, quản trị, Worker).

### Bản 1.3.3 (06/10/2026)
- Quét mặc định hằng ngày 08:00; số ngày giữa 2 lượt đặt trong Cài đặt (1–30).
- Khối "Cập nhật pháp lý mới" trên Cẩm nang: mặc định tin trong tháng, ô "Xem tin" chọn tháng cũ hoặc tất cả, tin nhóm theo ngày đăng.
- **Khi nào cần anh tải file gốc:** thẻ đề xuất nào có ô đỏ "📄 Cần file gốc" (đề xuất duyệt nhưng chưa ai đọc toàn văn – Worker chỉ đọc trích yếu, không đọc PDF). Số văn bản cần file gốc hiện ở đầu danh sách đề xuất và ở trang Tổng quan; tác vụ kiểm tra chéo hằng ngày cũng liệt kê trong email nháp.

### Bản 1.3.4 (06/10/2026) – Tải file Word thay cho copy/dán
- Thẻ có ô "📄 Cần file gốc": bấm **📎 Tải file Word lên** → chọn file .docx → AI tự đọc và soạn lại tiêu đề, tóm tắt, điểm cập nhật chính, hiệu lực → anh xem rồi bấm Duyệt.
- File được đọc ngay trên trình duyệt của anh, chỉ phần chữ được gửi lên để AI đọc; file không lưu trên máy chủ.
- Nhận .docx (và .txt). File .doc (Word cũ): mở bằng Word → Lưu thành .docx. PDF chưa hỗ trợ.

## 14. Bản 1.4 (06/10/2026) – Giao diện Cẩm nang mới, góp ý, đăng ký email, dữ liệu riêng từng công cụ

**Trên Cẩm nang (người dùng):**
- Menu "Trang chủ" đổi tên **Giới thiệu**: giữ giới thiệu, 8 chủ đề, lời cảm ơn, Góp ý & liên hệ; bỏ "Hướng dẫn sử dụng nhanh"; thêm dòng nhắc "N cập nhật pháp lý mới trong tháng".
- Tab mới **🔔 Tự động cập nhật pháp lý mới nhất** (ngay dưới Giới thiệu): xem **theo tháng** hoặc **theo chủ đề** (8 chủ đề, có số tin), form "Tôi muốn nhận được thông tin cập nhật tự động hàng ngày qua email:". Link trực tiếp: `/tools/cam-nang-thue-2026/#cap-nhat`.
- Nút **💬 Góp ý · Liên hệ** (3 chỗ) mở popup: Họ tên, SĐT (không bắt buộc), Nội dung. Link trực tiếp: `#gop-y`.

**Trong Quản trị:** menu **Dữ liệu công cụ → Cẩm nang thuế** gồm 4 tab: Văn bản pháp luật mới · Góp ý · Đăng ký nhận email · Cài đặt công cụ (tần suất quét, bật/tắt góp ý và form email, cấu hình gửi email, gửi thử). Mỗi tab tải được file Excel (CSV).

**Gửi email tự động – cách bật (làm khi đã có tên miền quantritute.vn):**
1. Tạo tài khoản tại resend.com → Domains → thêm `quantritute.vn` → thêm các bản ghi DNS Resend hiện ra (SPF, DKIM) vào nơi quản lý tên miền → chờ "Verified".
2. Resend → API Keys → tạo khóa quyền "Sending access".
3. Cài khóa cho cả 3 nơi (mỗi lệnh sẽ hỏi dán khóa):
   ```
   npx wrangler secret put RESEND_API_KEY --config watch/wrangler.jsonc
   npx wrangler pages secret put RESEND_API_KEY --project-name quantritute
   npx wrangler pages secret put RESEND_API_KEY --project-name quantritute-admin
   ```
4. Quản trị → Cẩm nang thuế → Cài đặt công cụ: nhập Email gửi đi (VD `capnhat@quantritute.vn`), tích "Bật gửi email" → Lưu → "Gửi thử" vào email của anh.
5. Bấm "Gửi email xác nhận cho N người chờ" cho những người đã đăng ký trước đó.
- Lịch gửi: 17:00 hằng ngày, **chỉ khi có văn bản mới được duyệt** kể từ lần gửi trước. Người đăng ký phải bấm xác nhận trong thư (double opt-in); mỗi thư có link hủy đăng ký.
- Chưa bật: form vẫn nhận đăng ký, lưu ở trạng thái "Chờ xác nhận", chưa gửi thư nào.

## 15. Sao lưu (06/10/2026)

| Cái gì | Ở đâu | Cách sao lưu |
|---|---|---|
| Code + nội dung cẩm nang | Folder `quantritute` trên máy | Kho **GitHub riêng tư** (Private) |
| Database (văn bản đã duyệt, góp ý, email đăng ký, cài đặt) | Cloudflare D1 | File `sao-luu\db-YYYYMMDD.sql` trên máy + chép lên Google Drive. **Không** đưa lên GitHub vì có email, SĐT người dùng |
| Khóa bí mật (mật khẩu quản trị, RESEND_API_KEY) | Cloudflare (secret) | Anh tự ghi vào trình quản lý mật khẩu; không lưu trong file |

**Cài 1 lần:**
1. Cài Git for Windows: https://git-scm.com/download/win (bấm Next đến hết).
2. Vào github.com → đăng nhập/đăng ký → **New repository** → tên `quantritute` → chọn **Private** → Create (không tích thêm README).
3. Mở PowerShell tại thư mục `quantritute` → `.\cai-dat-github.cmd` → nhập tên, email, dán link kho (dạng `https://github.com/<tên>/quantritute.git`) → trình duyệt mở ra để đăng nhập GitHub → xong.
4. (Tùy chọn) Nếu máy có Google Drive cho máy tính: tạo file `sao-luu-drive.txt` trong thư mục `quantritute`, ghi 1 dòng đường dẫn thư mục Drive, VD `G:\My Drive\quantritute-sao-luu`.

**Hằng tuần (sáng thứ Hai, có nhắc tự động):** mở PowerShell tại `quantritute` → `.\sao-luu.cmd`.

**Khôi phục database khi cần:** `npx wrangler d1 execute quantritute-db --remote --file=sao-luu\db-YYYYMMDD.sql` (hỏi BuBu trước khi chạy vì lệnh ghi đè dữ liệu).
