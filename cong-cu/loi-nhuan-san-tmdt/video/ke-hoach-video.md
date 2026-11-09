# Kế hoạch video – Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT (anh chốt 08/11/2026 08:13)

> Theo `xuong-video/QUY-TRINH-VIDEO.md` mục 1. Mỗi video **1 hội thoại riêng**; Cổng 2 (kịch bản chi tiết) làm ở hội thoại video, sau khi chạy thử công cụ.
> Công cụ làm ở hội thoại "Đề xuất – Đối soát sàn TMĐT" (04–06/11). Bản giới thiệu: **1.1.0 · Beta 06.11** (`cong-cu/loi-nhuan-san-tmdt/app/index.html`, web `/tools/loi-nhuan-san-tmdt/`).
> Lời đã chốt ở bài fanpage: `04_Nội dung - Marketing/bai-dang-loi-nhuan-san-tmdt.md` (ra mắt 05/11) và `bai-dang-cap-nhat-0611.md` (bản 1.1.0) – dùng làm xương sống lời kể.

## 1. Trạng thái
| Mã | Video | Ai | Dài | Đăng (đề xuất, anh kéo thả đổi được) | Thư mục | Trạng thái |
|---|---|---|---|---|---|---|
| **v22** | Ra mắt "Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT" (= **Video demo**, dán link vào Quản trị → Công cụ → Video demo) | **Anh mở đầu** (anh gửi video quay) + **Đốm giới thiệu** bản 1.1.0 | 2:30–3:00 | đề xuất T2 09/11 19:00 | `xuong-video/tap/v22-ra-mat-loi-nhuan-san-tmdt/` | ✅ Xong 08/11 14:45 (bản 4, 2:49) – anh đăng CN 08/11 19:00 · `Source hoàn thiện/22.` · `_mig_studio_v22` · đăng xong dán link Video demo |
| **v23** | Nguyên tắc bảo mật dữ liệu người dùng (chung cho web + Bộ công cụ, KHÔNG thuộc công cụ này – kế hoạch ở hội thoại v23) | anh chốt ở hội thoại v23 | – | đề xuất T3 10/11 19:00 | `xuong-video/tap/v23-bao-mat-du-lieu/` | ⏳ Chờ anh mở hội thoại mới |
Migration Xưởng video: **v22 `_mig_studio_v22`, v23 `_mig_studio_v23`** (đã dùng tới `_mig_studio_v21`). Hai hội thoại chạy song song → mỗi bên chỉ thêm khối của mình vào `src/studio-schema.js`, sửa bằng python thay đúng chỗ, không ghi đè cả file.

## 2. Câu chuyện ra đời (đúng sự thật)
- 04/11: trên **Bảng ghim** có một bạn kế toán đề xuất: "Nhờ bạn làm thêm công cụ đối soát dữ liệu sàn TMĐT (shopee, tiktok...) với phần xuất hóa đơn, dòng tiền...". Bạn ấy **không để lại thông tin liên hệ** → Tuấn **hỏi vợ** (kế toán trưởng) xem đang làm việc này thế nào.
- Vợ Tuấn hằng ngày vào sàn xem đơn nào **đã giao thành công để xuất hóa đơn**, hôm sau có đơn hoàn về thì **làm hóa đơn điều chỉnh**. Vướng: tiền sàn về theo đợt quyết toán, trừ nhiều loại phí → khó biết đơn nào đã về tiền; đơn đã xuất HĐ rồi bị trả → dễ sót HĐ điều chỉnh; đơn hủy / trả vẫn bị trừ phí; bán nhiều mà lãi thật sau giá vốn + phí phải tính tay, nhất là hàng combo.
- 05/11 ra mắt **bản beta 05.11** → nhận ngay **file góp ý 5 điểm** từ người dùng thử với dữ liệu thật → 06/11 ra **bản 1.1.0 (Beta 06.11)**: thẻ Hàng về kho, bấm số ở Tổng quan mở danh sách, lọc trạng thái đơn, doanh số đơn hủy/trả, kỳ dùng chung, số cảnh báo theo kỳ.
- Cách gọi đã chốt: "**vợ Tuấn**", "**Bảng ghim**", tên công cụ "**Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT**" (nói: "báo cáo lợi nhuận"), "**TikTok Shop**", "**file Đơn hàng**" và "**file Income**" tải từ Seller Center.
- ⚠️ Người gửi file góp ý 5 điểm: anh **chưa xác nhận** là ai → nói "người dùng thử với dữ liệu thật", không nói tên / không nói "vợ Tuấn" trừ khi anh xác nhận.

## 3. Tính năng (bản 1.1.0 – nhãn đúng như trên giao diện)
| Thẻ / nút | Trên giao diện | Câu lợi ích (ai dùng) |
|---|---|---|
| Nạp file | Nút **Thêm file**, kéo thả nhiều file nhiều tháng; tự nhận file Đơn hàng (OrderSKUList) / Income; nút **Dùng dữ liệu mẫu** | Không phải chỉnh file, không cần biết cột nào là gì |
| **Tổng quan** | Thanh "tiền đang ở đâu": Đã vào ví / Đã quyết toán, chưa vào ví / Chưa quyết toán / Phí sàn thực tế / Phí sàn ước tính · ô Doanh thu đơn thành công, **Đơn hủy / trả hàng (kèm doanh số)**, Tiền quyết toán, Phí sàn, Đã vào ví, Chưa nhận, Chênh lệch, Lợi nhuận (tạm tính) · **bấm ô → mở danh sách đơn** · biểu đồ theo Ngày/Tháng, chọn chỉ tiêu (Doanh thu, Giá vốn, Phí sàn, Phí hủy/trả, Lợi nhuận) | Chủ shop: nhìn 1 màn là biết tiền đi đâu |
| **Đối chiếu đơn hàng** | Từng đơn ↔ tiền quyết toán; lọc **Trạng thái đơn** (Thành công / Hủy + trả hàng / Hủy / Trả hàng) và **Đối chiếu** (đã về tiền, giao rồi chưa về tiền, hủy/trả vẫn bị trừ phí…) | Kế toán: biết đơn nào đã về tiền, đơn nào còn treo |
| **Giao theo ngày** | Chọn ngày → danh sách đơn giao thành công trong ngày, doanh thu theo giá bán và sau giảm giá shop | Kế toán: hôm nay xuất hóa đơn cho đơn nào |
| **Trả cần HĐ điều chỉnh** | Đơn trả hàng sau khi đã giao; tích ô khi đã lập HĐ điều chỉnh (lưu trên máy) | Không sót hóa đơn điều chỉnh |
| **Hàng về kho** (mới 1.1.0) | Đơn **hủy khi ĐVVC đã lấy hàng** + đơn **trả hàng/hoàn tiền**; cột phí vận chuyển người bán chịu, mã vận đơn; ô **Ngày hàng về kho** + **Ghi chú**; lọc Chưa về kho / Đã về kho; số ngày đã chờ | Không quên hàng đang trên đường hoàn về, biết mất bao nhiêu phí vận chuyển |
| **Ví & dòng tiền** | Tiền quyết toán theo ngày ↔ tiền vào ví, các lần rút về ngân hàng, số dư đầu/cuối kỳ | Đối chiếu sổ phụ ngân hàng |
| **Giá vốn** | Nhập tay hoặc nạp file Excel giá vốn; **SKU combo khai thành phần** (vd Combo 2 hộp = 2 × hộp lẻ); nhắc SKU thiếu / nghi sai giá vốn | Combo tự tính giá vốn |
| **Lợi nhuận** | Bảng 3 phạm vi kèm % trên doanh thu; theo đơn / sản phẩm / ngày / tháng; nút **Dashboard lợi nhuận** (mở khi đủ giá vốn) | Lãi thật sau giá vốn, phí sàn, phí hủy/trả |
| Xuất | **Xuất Excel** (nhiều sheet) · **Báo cáo HTML gửi sếp** (mở bằng trình duyệt, chỉ xem) | Gửi sếp 1 file là xong |
| Kỳ | Chọn tháng / khoảng ngày ở 1 thẻ → mọi thẻ cùng theo; số đỏ trên thẻ đếm theo kỳ | |

## 4. KHÔNG được nói
- **Chỉ TikTok Shop.** Không nói Shopee / sàn khác "đã hỗ trợ" (nói: cần sàn khác thì góp ý kèm file mẫu).
- Công cụ **không xuất hóa đơn**, không kết nối phần mềm hóa đơn – chỉ chỉ ra đơn cần lập / cần điều chỉnh.
- Không hứa "lãi lỗ chính xác 100%": lợi nhuận phụ thuộc **giá vốn người dùng nhập**; đơn chưa có Income thì phí sàn là **ước tính**.
- **Ngày hàng về kho nhập tay** (file TikTok không có) – không nói "tự theo dõi hàng về kho".
- Ngày về kho, ghi chú, dấu "đã lập HĐ" **lưu trên trình duyệt đang dùng** – không nói "lưu trên mạng / đồng bộ nhiều máy".
- Không nêu số liệu thật (463 đơn, 76 triệu…) và **không quay dữ liệu thật** của shop – chỉ dùng **Dữ liệu mẫu shop "Đốm Sáng"** (nút trong công cụ).
- Không nói đường menu tải file trên Seller Center (chưa kiểm chứng) – chỉ nói "tải file Đơn hàng và file Income từ Seller Center".
- Không nói "kiểm toán / thay kế toán"; không chê phần mềm khác.
- Tên người đề xuất / người góp ý: không có → không nêu.

## 5. Khung kịch bản v22 – Ra mắt (Anh mở đầu + Đốm giới thiệu)
Khung giống v18 (anh + Đốm): **câu đầu của anh (hook) → bật đèn 5s → phần còn lại của anh → Đốm giới thiệu → cam kết + CTA → kết 7s.** Phần anh: phiên âm `phien-am-v22.cmd`, đọc QUY-TRINH 8e (phiên âm lại từng câu sau cắt). Thumb có anh nói = ảnh anh nền mờ (PA3).

### 5a. Phần anh (anh tự quay, ~50–70s) – gợi ý ý, anh nói tự nhiên
| # | Ý | Hình chèn đề xuất |
|---|---|---|
| A1 hook | vd "Bán trên TikTok Shop cả tháng, tiền về ví bao nhiêu, lãi thật bao nhiêu?" hoặc "Đơn đã xuất hóa đơn, hôm sau khách trả hàng." | Chữ hook lớn |
| A2 | Đề xuất trên Bảng ghim của một bạn kế toán, không để lại liên hệ → Tuấn hỏi vợ | Tờ ghim trên Bảng ghim (web thật, không lộ thông tin người gửi) |
| A3 | Vợ Tuấn mỗi ngày: xem đơn giao thành công để xuất HĐ, đơn hoàn về thì làm HĐ điều chỉnh; tiền về theo đợt, trừ nhiều loại phí | Cảnh minh họa chung (không quay Seller Center thật) |
| A4 | Ra mắt bản beta 05.11, ngay hôm sau nhận góp ý 5 điểm, sửa thành bản mới 06.11 | Popup Lịch sử cập nhật trên web |
| A5 dẫn | "Công cụ làm được gì, mời Đốm giới thiệu." | Hòa sang Đốm |

### 5b. Phần Đốm (~1:40–2:00) – trọng tâm: 3 việc của kế toán + 2 câu hỏi của chủ shop
| Mã | Ý lời Đốm (viết chi tiết ở Cổng 2) | Hình (quay `/tools/loi-nhuan-san-tmdt/` + Dùng dữ liệu mẫu) | Nhãn vàng |
|---|---|---|---|
| D01 | Chỉ cần 2 file tải từ Seller Center: file Đơn hàng và file Income, kéo vào là công cụ tự nhận; chạy ngay trên máy | Kéo 2 file / bấm Dùng dữ liệu mẫu | ① 2 file TikTok Shop |
| D02 | Tổng quan: tiền đang ở đâu – đã vào ví, chưa quyết toán, phí sàn; bấm vào ô là ra danh sách đơn | Thanh tiền + bấm ô "Đơn hủy / trả hàng" → sang Đối chiếu đã lọc | ② Tiền đang ở đâu |
| D03 | Đối chiếu từng đơn với tiền quyết toán: đơn giao rồi chưa về tiền, đơn hủy vẫn bị trừ phí | Bảng Đối chiếu, nút lọc | |
| D04 | Kế toán: Giao theo ngày → hôm nay xuất hóa đơn cho đơn nào | Thẻ Giao theo ngày | ③ Xuất HĐ mỗi ngày |
| D05 | Đơn đã giao rồi bị trả → thẻ Trả cần HĐ điều chỉnh, tích khi đã lập | Tích ô | ④ Không sót HĐ điều chỉnh |
| D06 | **Mới:** Hàng về kho – đơn hủy khi shipper đã lấy hàng, đơn trả hàng; phí vận chuyển mất bao nhiêu; nhập ngày hàng về kho | Gõ ngày vào ô → đơn chuyển "Đã về kho" | ⑤ Hàng về kho |
| D07 | Giá vốn: nạp Excel; hàng combo khai thành phần một lần | Thẻ Giá vốn, dòng combo nhắc thiếu giá vốn → khai thành phần | |
| D08 | Lợi nhuận thật sau giá vốn, phí sàn, phí hủy trả; Dashboard; xuất Excel, Báo cáo gửi sếp | Thẻ Lợi nhuận → Dashboard → nút Báo cáo HTML | ⑥ Lãi thật |
| K01 | Cam kết: miễn phí, chạy trên máy anh chị, file không gửi đi đâu; bản beta – góp ý để hoàn thiện; cần Shopee thì góp ý kèm file mẫu | Dòng cam kết + nút Góp ý cho Đốm | Miễn phí · File không rời máy |
| K02 | Chép D14 v07 (link ở bio + góp ý) | Đốm cảm ơn | |
Phiên âm Vbee: TikTok "tíc tóc" · Income "in-câm" · Seller Center "xe-lơ xen-tơ" · Excel "ích xeo" · HTML "hát tê em eo" · TMĐT "thương mại điện tử" · HĐ "hóa đơn" · ĐVVC "đơn vị vận chuyển" · combo "com-bô" · Dashboard "đát-bọt" · beta "bê-ta" · bio "bai ô".
Thumbnail đề xuất (PA3 ảnh anh nền mờ): "ĐỐI CHIẾU ĐƠN HÀNG / TIKTOK SHOP / LÃI THẬT BAO NHIÊU?" (nhấn màu `#EBB25B` = "lãi thật"), nút vàng **MIỄN PHÍ**.
Caption: skill `viet-caption-social`, link `/cong-cu/loi-nhuan-san-tmdt`.

**Dữ liệu quay:** chỉ dùng **Dữ liệu mẫu** trong công cụ (shop giả lập "Đốm Sáng", T8–T9/2026: 10 đơn ở Hàng về kho, có 1 combo thiếu giá vốn + 1 combo nghi sai để demo thẻ Giá vốn). Muốn demo nạp file Excel giá vốn: dùng file mẫu tạo theo sản phẩm của shop Đốm Sáng (không dùng `Gia-von-mau-TikTok-T8-T9.xlsx` – là sản phẩm thật). Ảnh chụp sẵn: `site/public/assets/tools/loi-nhuan-san-tmdt.jpg` (Dashboard), `04_Nội dung - Marketing/anh-bai-dang-cap-nhat-0611.png`.
**Anh chuẩn bị trước khi mở hội thoại v22:** quay phần mở đầu 50–70s (dọc, đủ sáng, mic gần) → `Video xây kênh/Source gốc/<ddmmyy>/`.
Sau khi đăng v22: dán link vào Quản trị → Công cụ → Đối chiếu đơn hàng… → Video demo.

## 6. v23 – Nguyên tắc bảo mật dữ liệu người dùng (làm ở hội thoại riêng)
Không thuộc riêng công cụ này. Tài liệu gốc cho hội thoại v23: `quantritute/phap-ly/README.md` (đã làm gì theo Luật 91/2025), trang `/chinh-sach-du-lieu/` và `/dieu-khoan-su-dung/` trên web, `phap-ly/QUY-TRINH-YEU-CAU-DU-LIEU.md`, `phap-ly/MAU-CAU-DONG-Y.md`. Chất liệu có thể dùng từ công cụ này: "file chạy ngay trên máy, không gửi đi đâu" (công cụ offline, dữ liệu nhập lưu trên trình duyệt). Kế hoạch chi tiết + KHÔNG được nói: anh chốt ở hội thoại v23.
