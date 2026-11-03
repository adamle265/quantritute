/* ============================================================
 * Quản trị tử tế — Thời hạn lưu dữ liệu cá nhân (03/11/2026, Luật BVDLCN 91/2025/QH15 + NĐ 356/2025/NĐ-CP)
 * Chạy mỗi ngày lúc 10:00 giờ VN trong Worker quantritute-watch (watch/index.js).
 * Thời hạn trùng với trang /chinh-sach-du-lieu/ mục 4 – đổi ở đây thì sửa cả trang đó.
 *   - Gửi link công cụ qua email (link_requests): xoá sau 30 ngày
 *   - Đăng ký nhận thư chưa xác nhận / đã huỷ (subscribers): xoá sau 30 ngày
 *   - Góp ý (feedback), đề xuất (requests): sau 24 tháng xoá họ tên, SĐT, liên hệ (giữ nội dung để làm công cụ, Bảng ghim)
 *   - Đặt lịch trò chuyện (bookings): xoá sau 24 tháng
 *   - Phân tích web (wa_views, wa_events) tự xoá sau 400 ngày ở src/analytics.js; nhật ký thư (mail_log) 90 ngày ở src/mailer.js
 * ============================================================ */
const DAY = 864e5;
export const RETENTION = { linkDays: 30, subPendingDays: 30, subUnsubDays: 30, contactMonths: 24 };

export async function cleanupPersonalData(env) {
  const now = Date.now(), R = RETENTION, cut2y = now - R.contactMonths * 30.44 * DAY;
  const jobs = [
    ['link_requests', `DELETE FROM link_requests WHERE created_at < ?1`, now - R.linkDays * DAY],
    ['subscribers_pending', `DELETE FROM subscribers WHERE status = 'pending' AND updated_at < ?1`, now - R.subPendingDays * DAY],
    ['subscribers_unsub', `DELETE FROM subscribers WHERE status = 'unsubscribed' AND updated_at < ?1`, now - R.subUnsubDays * DAY],
    ['feedback_an_danh', `UPDATE feedback SET name = '', phone = '', email = '', notify_token = '', ip_hash = '' WHERE created_at < ?1 AND (name <> '' OR phone <> '' OR email <> '' OR ip_hash <> '')`, cut2y],
    ['requests_an_danh', `UPDATE requests SET contact = '', ip_hash = '' WHERE created_at < ?1 AND (contact <> '' OR ip_hash <> '')`, cut2y],
    ['bookings', `DELETE FROM bookings WHERE created_at < ?1`, cut2y],
  ];
  const out = {};
  for (const [k, sql, t] of jobs) {
    try { const r = await env.DB.prepare(sql).bind(t).run(); out[k] = r.meta ? r.meta.changes : 0; }
    catch (e) { out[k] = 'lỗi: ' + String(e.message || e).slice(0, 80); }
  }
  return out;
}
