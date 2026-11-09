/* 04/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT 1.0.5: đưa lên web ở chế độ ẨN (visible=0) để anh test; anh tự bật Hiển thị trong Quản trị (chỉ chạy 1 lần) */
const T22_FEAT = `Đọc thẳng file xuất từ TikTok Shop Seller Center: Đơn hàng (OrderSKUList) và Income (Chi tiết đơn hàng, Báo cáo, Lịch sử rút tiền); nạp nhiều file nhiều tháng cùng lúc, tự bỏ dòng trùng
Đối chiếu từng đơn với tiền sàn quyết toán: đơn đã về tiền, đơn giao rồi chưa về tiền, đơn hủy / trả vẫn bị trừ phí, đơn có tiền mà không có trong file đơn hàng
Bảng đơn giao theo ngày: đơn nào đã giao thành công trong ngày để lập hóa đơn, kèm doanh thu theo giá bán và sau giảm giá của shop
Cảnh báo đơn trả hàng / hoàn tiền sau khi đã giao (cần lập hóa đơn điều chỉnh), đánh dấu đã xử lý từng đơn
Dòng tiền ví: tiền quyết toán theo ngày khớp tiền vào ví (Earnings), các lần rút về ngân hàng, số dư đầu kỳ / cuối kỳ
Báo cáo lợi nhuận theo đơn, sản phẩm, ngày, tháng: doanh thu, giá vốn, phí sàn (giao dịch, hoa hồng, liên kết, voucher, vận chuyển…), phí đơn hủy / trả; tỷ lệ % trên doanh thu
Giá vốn nhập tay hoặc nạp file Excel; SKU combo khai thành phần (VD 2 hộp trà + 1 bình) để tự tính giá vốn; nhắc SKU thiếu giá vốn
Biểu đồ Tổng quan theo ngày / tháng, chọn 1 hoặc nhiều chỉ tiêu; Dashboard lợi nhuận một màn hình khi đã đủ giá vốn
Xuất Excel nhiều sheet; xuất Báo cáo HTML gửi sếp (mở bằng trình duyệt, chỉ xem); chạy hoàn toàn trên máy, không tải dữ liệu lên mạng`;
const T22_HL = `Biết đơn nào đã về tiền | Khớp từng đơn hàng với tiền sàn quyết toán, chỉ ra đơn giao rồi chưa về tiền và đơn hủy / trả vẫn bị trừ phí.
Không sót hóa đơn điều chỉnh | Liệt kê đơn trả hàng sau khi đã giao để lập hóa đơn điều chỉnh, đánh dấu đơn đã xử lý.
Lãi thật sau mọi loại phí | Doanh thu trừ giá vốn, phí sàn, phí hủy / trả; xem theo đơn, sản phẩm, ngày, tháng, kèm % trên doanh thu.
Báo cáo gửi sếp trong 1 nút | Dashboard lợi nhuận, file Excel nhiều sheet và báo cáo HTML mở được trên mọi máy.`;
const T22_GUIDE = `Bước 1: trên TikTok Shop Seller Center, xuất file Đơn hàng và file Income (thu nhập) cho cùng khoảng thời gian.
Bước 2: bấm "Thêm file", chọn cả 2 file (nhiều tháng cũng được); công cụ tự nhận loại file.
Bước 3: xem Tổng quan, Đối soát đơn – tiền, Đơn giao theo ngày, Đơn trả cần điều chỉnh HĐ, Dòng tiền ví.
Bước 4: thẻ Giá vốn – nhập giá vốn từng SKU hoặc nạp file Excel giá vốn; SKU combo khai thành phần.
Bước 5: thẻ Lợi nhuận – xem báo cáo, mở Dashboard, xuất Excel hoặc Báo cáo HTML gửi sếp.`;
const T22_CL = '1.0.5 | 04/11/2026 | Bản đầu tiên: đối chiếu đơn hàng TikTok Shop với tiền quyết toán; bảng đơn giao theo ngày để lập hóa đơn; cảnh báo đơn trả cần hóa đơn điều chỉnh; dòng tiền ví; báo cáo lợi nhuận có giá vốn (kể cả SKU combo), phí sàn, phí hủy / trả; biểu đồ chọn chỉ tiêu; Dashboard lợi nhuận; xuất Excel và Báo cáo HTML';
const T22_SET = {
  name: 'Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT', sub: 'Kế toán – tài chính',
  pain: 'Bán nhiều đơn mà không biết lãi lỗ thật', who: 'Chủ shop online, Kế toán bán hàng sàn TMĐT, Kế toán dịch vụ',
  tags: 'Sàn TMĐT, TikTok Shop, Đối soát, Lợi nhuận, Hóa đơn điều chỉnh, Giá vốn',
  benefits: 'Đối chiếu từng đơn với tiền sàn trả về ví, nhắc đơn trả cần hóa đơn điều chỉnh và tính lãi thật sau giá vốn, phí sàn – từ chính file xuất của TikTok Shop, chạy trên máy, không gửi dữ liệu đi đâu.',
};
const q22 = s => "'" + String(s).replace(/'/g, "''") + "'";
const MIGRATE_TOOLS_V22 = [
  `UPDATE tools SET name = ${q22(T22_SET.name)}, sub = ${q22(T22_SET.sub)}, pain = ${q22(T22_SET.pain)}, who = ${q22(T22_SET.who)},
     status = 'ok', url = '/tools/loi-nhuan-san-tmdt/', download_url = '/tools/loi-nhuan-san-tmdt/index.html', visible = 0,
     pricing = 'free', icon = CASE WHEN icon = '' THEN 'chart' ELSE icon END, tags = ${q22(T22_SET.tags)}, benefits = ${q22(T22_SET.benefits)},
     features = ${q22(T22_FEAT)}, highlights = ${q22(T22_HL)}, guide = ${q22(T22_GUIDE)},
     version = 'Bản 1.0.5', released = '2026-11-04', author = 'Tuấn · Quản trị tử tế', changelog = ${q22(T22_CL)},
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND url = ''`,
  `INSERT INTO tools (slug, no, name, grp, sub, pain, who, status, price, url, embed, videos, body, sort, visible, created_at, updated_at,
      pricing, price_note, featured, icon, tags, features, highlights, guide, version, released, author, download_url, banner_url, benefits, changelog)
   SELECT 'loi-nhuan-san-tmdt', '#' || substr('0' || (SELECT COUNT(*) + 1 FROM tools), -2), ${q22(T22_SET.name)}, 'kt', ${q22(T22_SET.sub)},
     ${q22(T22_SET.pain)}, ${q22(T22_SET.who)}, 'ok', 0, '/tools/loi-nhuan-san-tmdt/', 0, '[]', '', 130, 0,
     CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000,
     'free', '', 0, 'chart', ${q22(T22_SET.tags)}, ${q22(T22_FEAT)}, ${q22(T22_HL)}, ${q22(T22_GUIDE)},
     'Bản 1.0.5', '2026-11-04', 'Tuấn · Quản trị tử tế', '/tools/loi-nhuan-san-tmdt/index.html', '', ${q22(T22_SET.benefits)}, ${q22(T22_CL)}
   WHERE NOT EXISTS (SELECT 1 FROM tools WHERE slug = 'loi-nhuan-san-tmdt')`,
];
