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
    siteUrl: (s.site_url || 'https://quantritute.com').replace(/\/+$/, ''), lastDigest: +(s._mail_last_digest || 0), lastResult: s._mail_last_result || '' };
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
/* Hai danh sách đăng ký, mỗi danh sách một thư riêng và link hủy riêng */
const TOOLS_LIST = 'bo-cong-cu';
const LISTS = {
  [TOOL]: { label: 'Cẩm nang Thuế – Kế toán – Lao động', home: `/tools/${TOOL}/#cap-nhat`, homeBtn: 'Xem Cẩm nang',
    what: 'nhận cập nhật pháp lý từ Cẩm nang Thuế – Kế toán – Lao động', ok: 'cảm ơn anh/chị đã đăng ký, từ nay em sẽ gửi các cập nhật pháp lý mới của Cẩm nang tới anh/chị.',
    subjConfirm: 'Xác nhận đăng ký nhận cập nhật' },
  [TOOLS_LIST]: { label: 'Bộ công cụ', home: '/cong-cu', homeBtn: 'Xem Bộ công cụ',
    what: 'nhận thông báo khi Bộ công cụ của Quản trị tử tế có công cụ mới', ok: 'cảm ơn anh/chị đã đăng ký, từ nay em sẽ báo anh/chị ngay khi có công cụ mới phát hành.',
    subjConfirm: 'Xác nhận đăng ký nhận tin công cụ mới' },
};
const listOf = k => LISTS[k] || LISTS[TOOL];

const frame = (st, title, body, unsub, label = LISTS[TOOL].label) => `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#1a1f2b">
<div style="max-width:620px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border:1px solid #e2e6ee;border-radius:12px;padding:22px 24px">
<div style="font-size:12px;letter-spacing:1px;color:#8f6a1f;font-weight:700;text-transform:uppercase">Quản trị tử tế · ${esc(label)}</div>
<h1 style="font-size:20px;color:#1F3864;margin:8px 0 14px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#767676;line-height:1.6;margin:14px 4px">Quản trị tử tế · quantritute.com${unsub ? `<br>Anh/chị không muốn nhận thư nữa? <a href="${esc(unsub)}" style="color:#767676">Bấm vào đây để hủy đăng ký</a>.` : ''}</p></div></body></html>`;

const P = 'font-size:15px;line-height:1.65;margin:0 0 12px';
const SIGN = `<p style="${P};margin-top:18px">Trân trọng,<br><b>Đốm</b> · Quản trị tử tế</p>`;
const SUBJ = 'Thư từ Quản trị tử tế_ ';

/* Thư 1: gửi ngay khi người dùng điền email và bấm đăng ký */
export async function sendConfirm(env, st, sub) {
  const L = listOf(sub.tool_slug);
  const link = `${st.siteUrl}/api/subscribe/confirm?token=${sub.token}`;
  const body = `<p style="${P}">Chào anh/chị,</p>
<p style="${P}">Em là Đốm, trợ lý của Quản trị tử tế. Địa chỉ <b>${esc(sub.email)}</b> vừa được dùng để đăng ký ${L.what}.</p>
<p style="${P}">Để em biết đúng là anh/chị đăng ký, anh/chị bấm nút bên dưới giúp em nhé:</p>
<p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:9px">Xác nhận nhận cập nhật</a></p>
<p style="font-size:14px;line-height:1.65;color:#595959;margin:0 0 6px">Em chỉ gửi thư sau khi anh/chị bấm xác nhận. Nếu không phải anh/chị đăng ký, anh/chị cứ bỏ qua thư này, em sẽ không gửi thêm thư nào.</p>${SIGN}`;
  return sendMail(env, st, { to: sub.email, subject: SUBJ + L.subjConfirm, html: frame(st, 'Anh/chị bấm xác nhận giúp em một bước nhé', body, '', L.label),
    text: `Chào anh/chị,\n\nEm là Đốm, trợ lý của Quản trị tử tế. Địa chỉ ${sub.email} vừa được dùng để đăng ký ${L.what}.\nAnh/chị bấm vào link sau để xác nhận: ${link}\n\nEm chỉ gửi thư sau khi anh/chị xác nhận. Nếu không phải anh/chị đăng ký, anh/chị cứ bỏ qua thư này.\n\nTrân trọng,\nĐốm · Quản trị tử tế` });
}

/* v1.22 Thư gửi link công cụ (khách xem trên điện thoại, muốn mở lại trên máy tính). Thư giao dịch 1 lần, không đưa vào danh sách nhận tin. */
export async function sendToolLink(env, st, { email, name, link }) {
  const body = `<p style="${P}">Chào anh/chị,</p>
<p style="${P}">Em là Đốm, trợ lý của Quản trị tử tế. Đây là link công cụ <b>${esc(name)}</b> anh/chị vừa nhờ em gửi, để mở trên máy tính lúc làm việc:</p>
<p style="margin:0 0 16px"><a href="${esc(link)}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:9px">Mở công cụ</a></p>
<p style="font-size:14px;line-height:1.65;color:#595959;margin:0 0 6px">Công cụ dùng miễn phí, chạy ngay trên trình duyệt Chrome hoặc Edge của anh/chị, dữ liệu không gửi lên máy chủ. Nếu nút không bấm được, anh/chị sao chép link này: ${esc(link)}</p>
<p style="font-size:14px;line-height:1.65;color:#595959;margin:0 0 6px">Em chỉ gửi đúng 1 thư này. Nếu không phải anh/chị yêu cầu, anh/chị cứ bỏ qua thư nhé.</p>${SIGN}`;
  return sendMail(env, st, { to: email, subject: SUBJ + 'Link công cụ ' + name, html: frame(st, 'Link công cụ để mở trên máy tính', body, '', 'Bộ công cụ'),
    text: `Chào anh/chị,\n\nEm là Đốm, trợ lý của Quản trị tử tế. Đây là link công cụ ${name} anh/chị vừa nhờ em gửi, để mở trên máy tính:\n${link}\n\nCông cụ dùng miễn phí, chạy ngay trên trình duyệt, dữ liệu không gửi lên máy chủ.\nEm chỉ gửi đúng 1 thư này.\n\nTrân trọng,\nĐốm · Quản trị tử tế` });
}

/* Thư 2: gửi sau khi người dùng bấm xác nhận ở Thư 1 (có nguyên tắc gửi thư) */
export async function sendWelcome(env, st, sub) {
  const L = listOf(sub.tool_slug), isTools = sub.tool_slug === TOOLS_LIST;
  const unsub = `${st.siteUrl}/api/unsubscribe?token=${sub.token}`;
  const li = (b, t) => `<li style="margin:0 0 8px"><b>${b}</b> ${t}</li>`;
  const rules = isTools ? [
    ['Chỉ gửi khi có công cụ mới.', 'Em chỉ báo khi Bộ công cụ có công cụ mới phát hành. Chưa có công cụ mới, em không làm phiền anh/chị.'],
    ['Gửi lúc 10h00 sáng.', 'Khi có công cụ mới, em sẽ gửi thư cho anh/chị vào 10h00 sáng.'],
    ['Có giới thiệu ngắn gọn.', 'Mỗi công cụ kèm vài dòng cho biết giúp được việc gì, dành cho ai, dùng miễn phí hay có phí, và đường dẫn để dùng ngay.'],
    ['Gom trong một thư.', 'Nếu cùng lúc có nhiều công cụ mới, em gộp lại một thư cho gọn hộp thư của anh/chị.'],
    ['Email chỉ dùng để gửi thông báo công cụ mới.', 'Em không bán hay chia sẻ email của anh/chị cho bên khác.'],
    ['Hủy lúc nào cũng được.', 'Cuối mỗi thư có đường dẫn hủy đăng ký, anh/chị bấm một lần là xong.'],
  ] : [
    ['Chỉ gửi khi có văn bản mới.', 'Mỗi ngày em theo dõi văn bản pháp luật mới về thuế, kế toán, lao động, bảo hiểm xã hội. Hôm nào chưa có tin mới, em không làm phiền anh/chị.'],
    ['Gửi lúc 10h00 sáng.', 'Khi có văn bản mới, em sẽ gửi thư cho anh/chị vào 10h00 sáng.'],
    ['Có tóm tắt dễ hiểu.', 'Mỗi văn bản đều được rà soát trước, kèm điểm chính, ngày hiệu lực và đường dẫn tới văn bản gốc.'],
    ['Gom trong một thư.', 'Nếu cùng lúc có nhiều văn bản, em gộp lại một thư cho gọn hộp thư của anh/chị.'],
    ['Email chỉ dùng để gửi cập nhật pháp lý.', 'Em không bán hay chia sẻ email của anh/chị cho bên khác.'],
    ['Hủy lúc nào cũng được.', 'Cuối mỗi thư có đường dẫn hủy đăng ký, anh/chị bấm một lần là xong.'],
  ];
  const body = `<p style="${P}">Chào anh/chị,</p>
<p style="${P}">Em là Đốm. Email <b>${esc(sub.email)}</b> đã được xác nhận. ${L.ok[0].toUpperCase() + L.ok.slice(1)}</p>
<p style="${P};margin-bottom:6px"><b>Em sẽ gửi thư như thế nào?</b></p>
<ul style="font-size:14.5px;line-height:1.65;margin:0 0 14px 18px;padding:0">${rules.map(r => li(...r)).join('\n')}</ul>
${isTools ? '' : `<p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 14px">Nội dung trong thư là bản tóm tắt để tham khảo, anh/chị nhớ đối chiếu văn bản gốc trước khi áp dụng nhé.</p>`}
<p style="margin:0 0 6px"><a href="${st.siteUrl}${L.home}" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:9px">${L.homeBtn}</a></p>${SIGN}`;
  return sendMail(env, st, { to: sub.email, subject: SUBJ + 'Xác nhận đăng ký thành công', html: frame(st, 'Đăng ký thành công, cảm ơn anh/chị đã theo dõi', body, unsub, L.label), unsubscribe: unsub,
    text: `Chào anh/chị,\n\nEm là Đốm. Email ${sub.email} đã được xác nhận. ${L.ok[0].toUpperCase() + L.ok.slice(1)}\n\nEm gửi thư như sau:\n${rules.map(r => '- ' + r[0] + ' ' + r[1]).join('\n')}\n\nHủy đăng ký: ${unsub}\n\nTrân trọng,\nĐốm · Quản trị tử tế` });
}

/* Bản tin: 10h00 sáng mỗi ngày (cron 03:00 UTC), chỉ gửi khi có văn bản MỚI được duyệt kể từ lần gửi trước (không gửi thư rỗng). Duyệt sau 10h thì vào bản tin 10h hôm sau. */
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
    const body = `<p style="${P}">Chào anh/chị,</p><p style="${P}">Em là Đốm. Hôm nay có <b>${ups.length} cập nhật pháp lý mới</b> vừa được rà soát, em gửi anh/chị xem nhé:</p>${items}
      <p style="margin:0 0 12px"><a href="${page}" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:9px">Xem trên Cẩm nang</a></p>
      <p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 6px">Đây là bản tóm tắt để tham khảo, anh/chị nhớ đối chiếu văn bản gốc trước khi áp dụng. Cần trao đổi thêm, anh/chị cứ gửi góp ý trên Cẩm nang, bên em sẽ xem và phản hồi.</p>${SIGN}`;
    try { await sendMail(env, st, { to: s.email, subject: `${SUBJ}Cập nhật pháp lý mới: ${ups[0].title}${ups.length > 1 ? ` (+${ups.length - 1} văn bản)` : ''}`, html: frame(st, 'Cập nhật pháp lý mới dành cho anh/chị', body, unsub), text: ups.map(u => `${u.so_hieu}: ${u.title} ${u.url || ''}`).join('\n') + `\n\nHủy đăng ký: ${unsub}`, unsubscribe: unsub }); sent++;
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

/* Thông báo công cụ mới: gửi vào 10h sáng (cùng lượt với bản tin pháp lý) cho các công cụ anh đã bấm "Thông báo" trong Quản trị */
export async function sendToolAnnounce(env, { max = 95 } = {}) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, skipped: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const { results: tools } = await env.DB.prepare(`SELECT id, slug, name, pain, who, benefits, pricing, price, price_note, announce_at FROM tools
      WHERE announce_at > 0 AND announced_at = 0 AND visible = 1 AND status = 'ok' ORDER BY announce_at LIMIT 10`).all();
  if (!tools.length) return { ok: true, skipped: 'Không có công cụ nào chờ thông báo.' };
  const { results: subs } = await env.DB.prepare(`SELECT id, email, token FROM subscribers WHERE tool_slug = ?1 AND status = 'active' ORDER BY id LIMIT ?2`).bind(TOOLS_LIST, max).all();
  const items = tools.map(t => {
    const bens = String(t.benefits || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 4);
    const price = t.pricing === 'paid' ? `Có phí${t.price > 0 ? ' · ' + Number(t.price).toLocaleString('vi-VN') + 'đ' + (t.price_note ? ' ' + t.price_note : '') : ''}` : 'Miễn phí';
    return `<div style="border:1px solid #e2e6ee;border-radius:10px;padding:14px 16px;margin:0 0 12px">
      <div style="font-weight:700;font-size:16px;color:#1F3864">${esc(t.name)}</div>
      <div style="font-size:12.5px;color:#595959;margin:4px 0 8px"><b style="color:#0F6E56">${esc(price)}</b>${t.who ? ' · Dành cho ' + esc(String(t.who).split(',').slice(0, 3).map(x => x.trim()).filter(Boolean).join(', ')) : ''}</div>
      ${t.pain ? `<div style="font-size:14px;line-height:1.55;margin:0 0 6px">Dành cho anh/chị đang phải ${esc(String(t.pain).replace(/[.…]+$/, ''))}.</div>` : ''}
      ${bens.length ? `<ul style="font-size:14px;line-height:1.55;margin:6px 0 8px 18px;padding:0">${bens.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      <a href="${st.siteUrl}/cong-cu/${esc(t.slug)}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:9px 16px;border-radius:9px;font-size:14px">Dùng ngay</a></div>`; }).join('');
  const subject = `${SUBJ}Công cụ mới: ${tools[0].name}${tools.length > 1 ? ` (+${tools.length - 1} công cụ)` : ''}`;
  let sent = 0; const errs = [];
  for (const s of subs) {
    const unsub = `${st.siteUrl}/api/unsubscribe?token=${s.token}`;
    const body = `<p style="${P}">Chào anh/chị,</p><p style="${P}">Em là Đốm. Bộ công cụ vừa có <b>${tools.length} công cụ mới</b> để anh/chị dùng thử:</p>${items}
      <p style="margin:0 0 12px"><a href="${st.siteUrl}/cong-cu" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:9px">Xem Bộ công cụ</a></p>
      <p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 6px">Anh/chị đang phải làm một việc lặp đi lặp lại mà chưa có công cụ? Anh/chị cứ kể cho em nghe trong mục Đề xuất công cụ, em sẽ cố gắng tìm giải pháp.</p>${SIGN}`;
    try { await sendMail(env, st, { to: s.email, subject, html: frame(st, 'Công cụ mới dành cho anh/chị', body, unsub, LISTS[TOOLS_LIST].label), unsubscribe: unsub,
      text: tools.map(t => `${t.name}: ${st.siteUrl}/cong-cu/${t.slug}`).join('\n') + `\n\nHủy đăng ký: ${unsub}` }); sent++;
      await env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id = ?2`).bind(Date.now(), s.id).run(); }
    catch (e) { errs.push(`${s.email}: ${e.message}`); if (errs.length >= 5) break; }
  }
  const res = { ok: !errs.length, sent, tools: tools.length, at: Date.now(), errors: errs.slice(0, 5) };
  // Chỉ đánh dấu "đã thông báo" khi gửi được (hoặc chưa có ai đăng ký); lỗi toàn bộ thì lần sau gửi lại
  if (sent || !subs.length) await env.DB.batch([...tools.map(t => env.DB.prepare(`UPDATE tools SET announced_at = ?1 WHERE id = ?2`).bind(Date.now(), t.id)),
    env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_tools_result', ?1)`).bind(JSON.stringify(res))]);
  return res;
}
