# Quản trị tử tế – Hướng dẫn cài đặt và vận hành

Phiên bản 1.2 · 05/10/2026

## 0. Sản phẩm gồm những gì

| Phần | Địa chỉ (sau khi cài) | Dành cho |
|---|---|---|
| **Trang khách** | `https://quantritute.pages.dev` (đã gắn `quantritute.com`) | Người xem: trang chủ bàn làm việc + đèn, Bộ công cụ, Hành trình, Blog, Phát triển bản thân, Liên hệ |
| **Trang quản trị** (link riêng) | `https://quantritute-admin.pages.dev` (đã gắn `admin.quantritute.com`) | Anh Tuấn: quản lý công cụ, tập Hành trình, bài viết, đặt hàng công cụ, lịch tư vấn 1:1, cài đặt |

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
| Tên miền `quantritute.com` | Đã mua tại Mắt Bão (12/10/2026), DNS ở Cloudflare – xem mục 6 |

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

## 6. Tên miền chính: `quantritute.com` (mua tại Mắt Bão, 12/10/2026)

DNS quản lý ở Cloudflare (nameserver tại Mắt Bão trỏ về Cloudflare). Làm theo thứ tự:

1. Cloudflare → **Add a domain** → `quantritute.com` → gói **Free** → Cloudflare cho 2 nameserver (dạng `xxx.ns.cloudflare.com`).
2. Mắt Bão → quản lý tên miền → **Đổi nameserver/DNS** → thay bằng 2 nameserver của Cloudflare. Chờ Cloudflare báo **Active** (vài phút đến 24 giờ).
3. Workers & Pages → `quantritute` → **Custom domains** → thêm `quantritute.com`, rồi thêm `www.quantritute.com`.
4. Workers & Pages → `quantritute-admin` → **Custom domains** → thêm `admin.quantritute.com`.
5. Chờ các tên miền **Active** (HTTPS tự cấp).
6. Quản trị → Cài đặt → "Địa chỉ trang khách" = `https://quantritute.com` → Lưu (dùng cho sitemap, thẻ chia sẻ, email).
7. Từ bản 1.13: `site/functions/_middleware.js` tự chuyển `quantritute.pages.dev` và `www.quantritute.com` về `https://quantritute.com` (không đụng bản xem trước `<nhánh>.quantritute.pages.dev`).

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
| Khoá thêm một lớp (khuyên dùng) | Cloudflare → Zero Trust → Access → tạo ứng dụng cho `admin.quantritute.com`, chỉ cho phép email của anh. Khi đó phải xác thực email trước, rồi mới tới mật khẩu |
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

**Gửi email tự động – cách bật (làm khi đã có tên miền quantritute.com):**
1. Tạo tài khoản tại resend.com → Domains → thêm `quantritute.com` → thêm các bản ghi DNS Resend hiện ra (SPF, DKIM) vào nơi quản lý tên miền → chờ "Verified".
2. Resend → API Keys → tạo khóa quyền "Sending access".
3. Cài khóa cho cả 3 nơi (mỗi lệnh sẽ hỏi dán khóa):
   ```
   npx wrangler secret put RESEND_API_KEY --config watch/wrangler.jsonc
   npx wrangler pages secret put RESEND_API_KEY --project-name quantritute
   npx wrangler pages secret put RESEND_API_KEY --project-name quantritute-admin
   ```
4. Quản trị → Cẩm nang thuế → Cài đặt công cụ: nhập Email gửi đi (VD `capnhat@quantritute.com`), tích "Bật gửi email" → Lưu → "Gửi thử" vào email của anh.
5. Bấm "Gửi email xác nhận cho N người chờ" cho những người đã đăng ký trước đó.
- Lịch gửi: 10:00 sáng hằng ngày (văn bản duyệt sau 10:00 sẽ gửi 10:00 hôm sau), **chỉ khi có văn bản mới được duyệt** kể từ lần gửi trước. Người đăng ký phải bấm xác nhận trong thư (double opt-in); mỗi thư có link hủy đăng ký.
- Chưa bật: form vẫn nhận đăng ký, lưu ở trạng thái "Chưa xác nhận", chưa gửi thư nào.

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

## 16. Bản 1.5 (06/10/2026) – Trang Bộ công cụ dạng kệ sách

- Đầu trang: lời trích của Tuấn (chữ viết tay, ký tên Minh Tuấn). Bỏ chú thích giá, số lượng công cụ.
- Tab **Tiện ích nổi bật**: carousel "sách mở" (trang trái: banner + tên; trang phải: giải quyết gì, tag, Free/giá, Active/Coming soon), 3 cuốn/lần, nút ‹ › và vuốt. Công cụ nào tích "Hiện trong carousel Tiện ích nổi bật" trong Quản trị → Công cụ thì hiện ở đây.
- Các tab khác: lưới "sách gập" 3D, bìa nổi bật Tên công cụ + Giải quyết gì; mỗi công cụ một màu bìa cố định.
- Trạng thái trên web chỉ còn **Active** (= Dùng được) và **Coming soon** (gồm cả Đang rà soát).
- Popup công cụ: Tên, Free/giá, trạng thái, tag, nút Dùng công cụ; 2 ô nổi bật **Giải quyết vấn đề** + **Dành cho**; **Tiện ích nổi bật**; **Video demo**. Đã bỏ cách sử dụng, tác giả, phiên bản, lặp giá/trạng thái.
- **Video demo:** quay 60–90 giây, đăng YouTube (để Công khai hoặc Không công khai/Unlisted) → Quản trị → Công cụ → mục "Video demo" → dán link. Web chỉ hiện ảnh xem trước, bấm mới tải video nên trang vẫn nhẹ.
- Cẩm nang: bỏ các câu chú thích hướng dẫn ở Đối chiếu, Nghiên cứu theo chủ đề, Tìm kiếm, Tủ văn bản, Hỏi đáp, Sơ đồ văn bản, tab Cập nhật pháp lý.


## Bản 1.21 (20/10/2026) – Báo cáo hiệu quả web hằng ngày · TẠM GÁC

> **Tạm gác 20/10/2026 18:17:** anh tự xem số liệu ở Quản trị → Phân tích web; khi số liệu nhiều sẽ bật lại. Đã giữ sẵn `src/analytics-digest.js` + API `POST /api/admin/analytics-digest`; đã GỠ lịch 07:30 khỏi Worker và nút gửi thử khỏi Quản trị; tác vụ Claude đã TẮT (không xóa). Bật lại: thêm cron `30 0 * * *` + vars `WA_REPORT_TO` vào `watch/wrangler.jsonc`, nhánh gọi `sendAnalyticsDigest` trong `watch/index.js`, deploy:watch, rồi bật lại tác vụ. Kiểm tra trước tổng số cron trên tài khoản (Free tối đa 5).

| Giờ | Ai làm | Việc |
|---|---|---|
| 07:30 | Worker `quantritute-watch` (cron `30 0 * * *` UTC) | Gom số liệu Phân tích web **ngày hôm qua** + so hôm kia + TB 7 ngày → gửi thư `[QTT-SO-LIEU] Số liệu web ngày dd/mm/yyyy` qua Resend tới `WA_REPORT_TO` (`watch/wrangler.jsonc`). Thư chỉ có số đếm, dữ liệu đầy đủ dạng JSON giữa `===QTT-JSON-BEGIN===` / `===QTT-JSON-END===` |
| 07:57 | Tác vụ Claude "Báo cáo hiệu quả web quantritute (hằng ngày)" | Đọc thư trong Gmail → báo cáo trên app Claude (chỉ số, nguồn, phễu Bộ công cụ, cần lưu ý, nên tối ưu, việc cần làm) → ghi 1 dòng vào Project doc `claude/nhat-ky-phan-tich-web.md` |

- Mã: `src/analytics-digest.js` (mới), `watch/index.js`, `watch/wrangler.jsonc`, `src/admin-api.js` (`POST /api/admin/analytics-digest`), `admin/public/analytics.js` (nút **Gửi thử thư số liệu hôm qua**).
- Triển khai: `npm run deploy:watch` rồi `npm run deploy:admin`.
- Gửi thư cần `RESEND_API_KEY` trên Worker và Quản trị; không phụ thuộc công tắc "Bật gửi email" của người đăng ký. Email gửi đi lấy từ Cài đặt (`mail_from`), trống thì dùng `capnhat@quantritute.com`.
- Đổi email nhận: sửa `WA_REPORT_TO` trong `watch/wrangler.jsonc` → `npm run deploy:watch`.
- Không có thư → kiểm tra Cloudflare → Workers & Pages → `quantritute-watch` → Logs, dòng `analytics-digest`.


## Bản 1.22 (21/10/2026) – Tốc độ điện thoại, link ngắn theo kênh, gửi link về email, trang Hướng dẫn (SEO)
**Vì sao:** Phân tích web 18–21/10 cho thấy điện thoại tải rất chậm (LCP p75: trang chủ ~9,3 s, công cụ Văn bản hàng loạt ~23,8 s), chưa đo được khách từ TikTok/YouTube, khách điện thoại không dùng được công cụ cần máy tính, Google chưa đem về lượt nào.
| Hạng mục | Làm gì | File |
|---|---|---|
| A1 Tốc độ | Ảnh bàn làm việc chuyển WebP (192 KB → 23 KB trên điện thoại); chỉ trang chủ tải trước ảnh; phông Google không chặn hiển thị; tải trước `/api/site`; khách quay lại hiện trang ngay từ bản lưu ≤ 24 giờ; `/api/site`, `/api/tools` lưu đệm ở máy chủ biên 60 giây (sửa ở Quản trị hiện trên web chậm nhất 1 phút) | `site/public/index.html`, `app.js`, `assets/desk-*.webp`, `src/public-api.js` |
| A1 Văn bản hàng loạt | Bản web tách nhẹ: `index.html` 41 KB + `web-*.js/css` nạp sau (trước đây 1 file 4,4 MB). Bản tải offline 1 file đổi tên `tao-van-ban-hang-loat.html` (migration `_mig_dl_v1` sửa link tải). Sau mỗi lần build lại: `python nguon/tach-ban-web.py` trong thư mục công cụ | `cong-cu/tao-van-ban-hang-loat/nguon/tach-ban-web.py`, `app/` |
| A2 Link ngắn theo kênh | `/tt` TikTok · `/yt` YouTube · `/fb` Fanpage · `/nhom` group Facebook · `/zl` Zalo · `/mail` email. Nối thêm đường dẫn được (`/yt/cong-cu/hoa-don-thue`), thêm `?c=ten-group` để ghi tên chiến dịch. Phân tích web → Nguồn hiện TikTok, YouTube, "Facebook (group)"… | `site/functions/_middleware.js`, `src/analytics.js` |
| A4 Gửi link về email | Trên điện thoại, mở công cụ cần máy tính (Hóa đơn, Văn bản hàng loạt) → Đốm mời gửi link về email / sao chép link / vẫn xem trên điện thoại (mỗi phiên 1 lần). Thư gửi qua Resend, giới hạn 5 lần/giờ/người; tích "Báo khi có công cụ mới" thì vào danh sách nhận tin (cần xác nhận). Xem ở Quản trị → Bộ công cụ → **Gửi link về email** | `site/public/qtt-sendlink.js`, `qtt-track.js`, `app.js`, `src/public-api.js` (`POST /api/send-link`), `src/mailer.js`, `src/core.js` (bảng `link_requests`), `admin/public/admin.js` |
| B3 Hướng dẫn (SEO) | 4 trang tĩnh + trang mục lục `/huong-dan/` (Article + FAQ + Breadcrumb schema), có trong sitemap. Sửa nội dung: `site/huong-dan-nguon/tao-trang.py` → chạy `python tao-trang.py` | `site/public/huong-dan/`, `src/seo.js` |
**Lệnh đưa lên:** PowerShell tại `quantritute`: `npm run deploy:site` → `npm run deploy:admin`. (Bản web Văn bản hàng loạt đã chép sẵn vào `site/public/tools/tao-van-ban-hang-loat/`, không cần chạy `cap-nhat.cmd`.)

**Bản 1.22b (21/10/2026 tối):** lối vào trang Hướng dẫn – khối "Hướng dẫn từng bước" trong popup công cụ (Hóa đơn, Văn bản hàng loạt), dãy thẻ hướng dẫn cuối trang Bộ công cụ, link "Hướng dẫn" ở chân trang; ảnh giao diện thật trong 2 bài hướng dẫn (`site/public/huong-dan/anh/`); bài tờ khai sửa theo mẫu 01/GTGT Thông tư 89/2026 và hạn quý III/2026 là 02/11/2026. Danh sách hướng dẫn trong web: hằng `GUIDES` đầu `app.js` (thêm bài mới thì thêm 1 dòng). Lệnh: `npm run deploy:site`.
