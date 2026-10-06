/* ============================================================
 * Quản trị tử tế — Gửi email (đăng ký nhận cập nhật pháp lý của Cẩm nang)
 * Dùng dịch vụ Resend (https://resend.com) qua API. Cần:
 *   - secret RESEND_API_KEY (đặt bằng wrangler, KHÔNG lưu trong database)
 *   - Quản trị → Cẩm nang thuế → Cài đặt công cụ: bật gửi email + email gửi đi (thuộc tên miền đã xác minh ở Resend)
 * Chưa đủ điều kiện → không gửi gì, người đăng ký nằm ở trạng thái "Chờ xác nhận".
 * ============================================================ */
const TOOL = 'cam-nang-thue-2026';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function settingsMap(env) {
  const { results } = await env.DB.prepare(`SELECT key, value FROM settings`).all();
  return Object.fromEntries(results.map(r => [r.key, r.value]));
}
export async function mailStatus(env) {
  const s = await settingsMap(env);
  const hasKey = !!env.RESEND_API_KEY, enabled = s.mail_enabled === '1', from = (s.mail_from || '').trim();
  return { hasKey, enabled, from, fromName: s.mail_from_name || 'Quản trị tử tế', ready: hasKey && enabled && /@/.test(from),
    siteUrl: (s.site_url || 'https://quantritute.pages.dev').replace(/\/+$/, ''), lastDigest: +(s._mail_last_digest || 0), lastResult: s._mail_last_result || '' };
}
export async function sendMail(env, st, { to, subject, html, text, unsubscribe }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: `${st.fromName} <${st.from}>`, to: [to], subject, html, text, ...(unsubscribe ? { headers: { 'List-Unsubscribe': `<${unsubscribe}>` } } : {}) }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(`Resend ${r.status}: ${d.message || d.name || ''}`); }
  return true;
}
const frame = (st, title, body, unsub) => `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1a1f2b">
<div style="max-width:620px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border:1px solid #e2e6ee;border-radius:12px;padding:22px 24px">
<div style="font-size:12px;letter-spacing:1px;color:#8f6a1f;font-weight:700;text-transform:uppercase">Quản trị tử tế · Cẩm nang Thuế – Kế toán – Lao động</div>
<h1 style="font-size:20px;color:#1F3864;margin:8px 0 14px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#767676;line-height:1.6;margin:14px 4px">Thông tin tóm tắt để tham khảo, luôn đối chiếu văn bản gốc trước khi áp dụng.
${unsub ? `Không muốn nhận nữa? <a href="${esc(unsub)}" style="color:#767676">Hủy đăng ký</a>.` : ''}</p></div></body></html>`;

export async function sendConfirm(env, st, sub) {
  const link = `${st.siteUrl}/api/subscribe/confirm?token=${sub.token}`;
  const body = `<p style="font-size:15px;line-height:1.6">Bạn (hoặc ai đó) vừa đăng ký nhận cập nhật pháp lý tự động bằng email <b>${esc(sub.email)}</b>.</p>
<p><a href="${link}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:9px">Xác nhận nhận email</a></p>
<p style="font-size:13px;color:#595959">Nếu không phải bạn đăng ký, hãy bỏ qua thư này, bạn sẽ không nhận thêm thư nào.</p>`;
  return sendMail(env, st, { to: sub.email, subject: 'Xác nhận nhận cập nhật pháp lý – Cẩm nang Thuế, Kế toán, Lao động', html: frame(st, 'Xác nhận đăng ký nhận cập nhật', body), text: `Xác nhận đăng ký: ${link}` });
}

/* Bản tin: chỉ gửi khi có văn bản MỚI được duyệt kể từ lần gửi trước (không gửi thư rỗng) */
export async function sendDigest(env, { max = 95 } = {}) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, skipped: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const since = st.lastDigest || Date.now() - 2 * 864e5;
  const { results: ups } = await env.DB.prepare(`SELECT so_hieu, title, summary, key_points, hieu_luc, ngay_ban_hanh, level, url, approved_at FROM legal_docs
      WHERE status = 'approved' AND approved_at > ?1 ORDER BY approved_at DESC LIMIT 20`).bind(since).all();
  if (!ups.length) return { ok: true, skipped: 'Không có cập nhật mới.' };
  const { results: subs } = await env.DB.prepare(`SELECT id, email, token FROM subscribers WHERE tool_slug = ?1 AND status = 'active' ORDER BY id LIMIT ?2`).bind(TOOL, max).all();
  const page = `${st.siteUrl}/tools/${TOOL}/#cap-nhat`;
  const lv = { cao: ['Quan trọng', '#B22222', '#FBEAEA'], tb: ['Nên xem', '#8f6a1f', '#FFF4DC'], thap: ['Tham khảo', '#595959', '#EEF1F6'] };
  const items = ups.map(u => { const l = lv[u.level]; const pts = String(u.key_points || '').split('\n').filter(Boolean);
    return `<div style="border:1px solid #e2e6ee;border-radius:10px;padding:12px 14px;margin:0 0 12px">
      <div style="font-size:12.5px;color:#595959">${l ? `<span style="background:${l[2]};color:${l[1]};font-weight:700;border-radius:99px;padding:2px 8px">${l[0]}</span> ` : ''}<b style="color:#1F3864">${esc(u.so_hieu)}</b> · Ban hành ${esc(u.ngay_ban_hanh)}${u.hieu_luc ? ` · <b style="color:#0F6E56">Hiệu lực: ${esc(u.hieu_luc)}</b>` : ''}</div>
      <div style="font-weight:700;font-size:15px;margin:6px 0">${esc(u.title)}</div>${u.summary ? `<div style="font-size:14px;line-height:1.55">${esc(u.summary)}</div>` : ''}
      ${pts.length ? `<ul style="font-size:14px;line-height:1.55;margin:6px 0 4px 18px;padding:0">${pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${u.url ? `<a href="${esc(u.url)}" style="font-size:13px;color:#2c4d80">Văn bản gốc ↗</a>` : ''}</div>`; }).join('');
  let sent = 0; const errs = [];
  for (const s of subs) {
    const unsub = `${st.siteUrl}/api/unsubscribe?token=${s.token}`;
    const body = `<p style="font-size:14px;color:#595959;margin-top:0">${ups.length} cập nhật pháp lý mới đã được rà soát:</p>${items}
      <p><a href="${page}" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:9px">Xem trên Cẩm nang</a></p>`;
    try { await sendMail(env, st, { to: s.email, subject: `[Cập nhật pháp lý] ${ups[0].title}${ups.length > 1 ? ` (+${ups.length - 1} văn bản)` : ''}`, html: frame(st, 'Cập nhật pháp lý mới', body, unsub), text: ups.map(u => `${u.so_hieu}: ${u.title} ${u.url || ''}`).join('\n') + `\n\nHủy đăng ký: ${unsub}`, unsubscribe: unsub }); sent++;
      await env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id = ?2`).bind(Date.now(), s.id).run(); }
    catch (e) { errs.push(`${s.email}: ${e.message}`); if (errs.length >= 5) break; }
  }
  const res = { ok: !errs.length, sent, updates: ups.length, at: Date.now(), errors: errs.slice(0, 5) };
  const st2 = [env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_result', ?1)`).bind(JSON.stringify(res))];
  // Chỉ đánh dấu "đã gửi tới văn bản này" khi gửi được (hoặc chưa có ai đăng ký) – lỗi toàn bộ thì lần sau gửi lại
  if (sent || !subs.length) st2.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_digest', ?1)`).bind(String(Math.max(...ups.map(u => u.approved_at)))));
  await env.DB.batch(st2);
  return res;
}
