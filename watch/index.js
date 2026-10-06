/* ============================================================
 * Quản trị tử tế — Worker "quantritute-watch"
 * Tự chạy 3 ngày/lần (lịch trong wrangler.jsonc): đọc văn bản mới trên chinhphu.vn,
 * lọc văn bản liên quan Cẩm nang Thuế – Kế toán – Lao động, ghi vào database ở trạng thái "Chờ duyệt".
 * Không có địa chỉ nào cho phép người ngoài kích hoạt quét; quét tay dùng nút "Quét ngay" trong trang quản trị.
 * ============================================================ */
import { scan, ensureLegalSchema, cronDue } from '../src/legal-watch.js';
import { sendDigest } from '../src/mailer.js';

export default {
  // Cloudflare gọi mỗi ngày 08:00; số ngày giữa 2 lượt quét do anh đặt trong Quản trị → Cài đặt
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (event.cron === '0 10 * * *') { // 17:00 giờ VN: gửi bản tin email nếu có văn bản mới được duyệt
        const r = await sendDigest(env).catch(e => ({ ok: false, error: e.message }));
        return console.log('legal-digest', JSON.stringify(r));
      }
      const c = await cronDue(env);
      if (!c.due) return console.log('legal-watch: bỏ qua, chưa đủ', c.days, 'ngày từ lượt quét trước');
      const r = await scan(env, { trigger: 'cron' });
      console.log('legal-watch', JSON.stringify({ ok: r.ok, fetched: r.fetched, new: r.new_count, candidates: r.candidates, error: r.error }));
    })());
  },
  async fetch(request, env) {
    // Chỉ cho xem trạng thái lượt quét gần nhất (không lộ dữ liệu nội bộ)
    await ensureLegalSchema(env);
    const s = await env.DB.prepare(`SELECT started_at, finished_at, ok, fetched, new_count, candidates FROM legal_scans ORDER BY id DESC LIMIT 1`).first();
    return new Response(JSON.stringify({ service: 'quantritute-watch', last_scan: s || null }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  },
};
