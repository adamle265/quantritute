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
export async function sendMail(env, st, { to, subject, html, text, unsubscribe, kind, replyTo }) {
  let r, d = {}, err = '';
  try {
    r = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: `${st.fromName} <${st.from}>`, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}), ...(unsubscribe ? { headers: { 'List-Unsubscribe': `<${unsubscribe}>` } } : {}) }),
    });
    d = await r.json().catch(() => ({}));
    if (!r.ok) err = `Resend ${r.status}: ${d.message || d.name || ''}`;
  } catch (e) { err = 'Không kết nối được Resend: ' + (e.message || e); }
  await mailCount(env, !err);
  await mailLog(env, { to, subject, html, text, kind: kind || guessKind(subject), from: st.from, ok: !err, error: err, resendId: d.id || '' });
  if (err) throw new Error(err);
  return true;
}
/* 02/11/2026: nhật ký từng email gửi đi (bảng mail_log) – để Quản trị → Tổng quan xem gửi cho ai, nội dung gì.
 * Giữ 90 ngày. Lỗi ghi nhật ký không làm hỏng việc gửi. Chỉ ghi từ lúc deploy bản này. */
export const MAIL_KINDS = { 'xac-nhan': 'Xác nhận đăng ký', 'chao-mung': 'Đăng ký thành công', 'gui-link': 'Gửi link công cụ', 'ban-tin': 'Bản tin pháp lý', 'cong-cu-moi': 'Tin công cụ mới', 'cap-nhat': 'Tin cập nhật công cụ', 'gui-thu': 'Gửi thử', 'so-lieu': 'Số liệu web', 'bo-sung': 'Gửi bổ sung', 'tiep-nhan': 'Xác nhận tiếp nhận góp ý', khac: 'Khác' };
function guessKind(subj = '') {
  const s = String(subj);
  if (/Xác nhận đăng ký nhận/.test(s)) return 'xac-nhan';
  if (/Xác nhận đăng ký thành công/.test(s)) return 'chao-mung';
  if (/Link công cụ/.test(s)) return 'gui-link';
  if (/Cập nhật pháp lý mới/.test(s)) return 'ban-tin';
  if (/Công cụ mới:/.test(s)) return 'cong-cu-moi';
  if (/^Thử gửi email/.test(s)) return 'gui-thu';
  if (/Số liệu web/.test(s)) return 'so-lieu';
  return 'khac';
}
let logReady = false;
async function ensureMailLog(env) {
  if (logReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS mail_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL, to_addr TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'khac', from_addr TEXT NOT NULL DEFAULT '', ok INTEGER NOT NULL DEFAULT 1, error TEXT NOT NULL DEFAULT '',
      resend_id TEXT NOT NULL DEFAULT '', text TEXT NOT NULL DEFAULT '', html TEXT NOT NULL DEFAULT '')`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS mail_log_day ON mail_log (day, at)`),
  ]);
  logReady = true;
  await env.DB.prepare(`DELETE FROM mail_log WHERE at < ?1`).bind(Date.now() - 90 * 864e5).run().catch(() => {});
}
async function mailLog(env, m) {
  try {
    await ensureMailLog(env);
    const t = Date.now();
    await env.DB.prepare(`INSERT INTO mail_log (at, day, to_addr, subject, kind, from_addr, ok, error, resend_id, text, html) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`)
      .bind(t, vnDay(t), String(m.to || '').slice(0, 200), String(m.subject || '').slice(0, 300), m.kind, String(m.from || '').slice(0, 200), m.ok ? 1 : 0,
        String(m.error || '').slice(0, 500), String(m.resendId || '').slice(0, 80), String(m.text || '').slice(0, 8000), String(m.html || '').slice(0, 120000)).run();
  } catch (e) { console.error('mailLog', e); }
}
/* Danh sách email của 1 ngày (giờ VN, mặc định hôm nay) – không kèm html cho nhẹ */
export async function mailLogDay(env, day) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day : vnDay();
  try {
    await ensureMailLog(env);
    const { results } = await env.DB.prepare(`SELECT id, at, to_addr, subject, kind, ok, error, substr(text, 1, 400) AS preview FROM mail_log WHERE day = ?1 ORDER BY at DESC LIMIT 500`).bind(d).all();
    return { day: d, items: results || [], kinds: MAIL_KINDS };
  } catch (e) { return { day: d, items: [], kinds: MAIL_KINDS, error: e.message }; }
}
export async function mailLogItem(env, id) {
  await ensureMailLog(env);
  return env.DB.prepare(`SELECT * FROM mail_log WHERE id = ?1`).bind(id).first();
}
/* 01/11/2026: đếm email gửi theo ngày (giờ VN) – settings._mail_ok_YYYY-MM-DD / _mail_err_YYYY-MM-DD; lỗi đếm không làm hỏng việc gửi */
export const vnDay = (t = Date.now()) => new Date(t + 7 * 3600000).toISOString().slice(0, 10);
async function mailCount(env, ok) {
  try { await env.DB.prepare(`INSERT INTO settings (key, value) VALUES (?1, '1') ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1`).bind(`_mail_${ok ? 'ok' : 'err'}_${vnDay()}`).run(); }
  catch (e) { console.error('mailCount', e); }
}
export async function mailToday(env) {
  const d = vnDay(), r = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN (?1, ?2)`).bind(`_mail_ok_${d}`, `_mail_err_${d}`).all().catch(() => ({ results: [] }));
  const m = Object.fromEntries((r.results || []).map(x => [x.key, +x.value || 0]));
  return { day: d, ok: m[`_mail_ok_${d}`] || 0, err: m[`_mail_err_${d}`] || 0 };
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
  return sendMail(env, st, { kind: 'xac-nhan', to: sub.email, subject: SUBJ + L.subjConfirm, html: frame(st, 'Anh/chị bấm xác nhận giúp em một bước nhé', body, '', L.label),
    text: `Chào anh/chị,\n\nEm là Đốm, trợ lý của Quản trị tử tế. Địa chỉ ${sub.email} vừa được dùng để đăng ký ${L.what}.\nAnh/chị bấm vào link sau để xác nhận: ${link}\n\nEm chỉ gửi thư sau khi anh/chị xác nhận. Nếu không phải anh/chị đăng ký, anh/chị cứ bỏ qua thư này.\n\nTrân trọng,\nĐốm · Quản trị tử tế` });
}

/* v1.22 Thư gửi link công cụ (khách xem trên điện thoại, muốn mở lại trên máy tính). Thư giao dịch 1 lần, không đưa vào danh sách nhận tin. */
export async function sendToolLink(env, st, { email, name, link }) {
  const body = `<p style="${P}">Chào anh/chị,</p>
<p style="${P}">Em là Đốm, trợ lý của Quản trị tử tế. Đây là link công cụ <b>${esc(name)}</b> anh/chị vừa nhờ em gửi, để mở trên máy tính lúc làm việc:</p>
<p style="margin:0 0 16px"><a href="${esc(link)}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:9px">Mở công cụ</a></p>
<p style="font-size:14px;line-height:1.65;color:#595959;margin:0 0 6px">Công cụ dùng miễn phí, chạy ngay trên trình duyệt Chrome hoặc Edge của anh/chị, dữ liệu không gửi lên máy chủ. Nếu nút không bấm được, anh/chị sao chép link này: ${esc(link)}</p>
<p style="font-size:14px;line-height:1.65;color:#595959;margin:0 0 6px">Em chỉ gửi đúng 1 thư này. Nếu không phải anh/chị yêu cầu, anh/chị cứ bỏ qua thư nhé.</p>${SIGN}`;
  return sendMail(env, st, { kind: 'gui-link', to: email, subject: SUBJ + 'Link công cụ ' + name, html: frame(st, 'Link công cụ để mở trên máy tính', body, '', 'Bộ công cụ'),
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
  return sendMail(env, st, { kind: 'chao-mung', to: sub.email, subject: SUBJ + 'Xác nhận đăng ký thành công', html: frame(st, 'Đăng ký thành công, cảm ơn anh/chị đã theo dõi', body, unsub, L.label), unsubscribe: unsub,
    text: `Chào anh/chị,\n\nEm là Đốm. Email ${sub.email} đã được xác nhận. ${L.ok[0].toUpperCase() + L.ok.slice(1)}\n\nEm gửi thư như sau:\n${rules.map(r => '- ' + r[0] + ' ' + r[1]).join('\n')}\n\nHủy đăng ký: ${unsub}\n\nTrân trọng,\nĐốm · Quản trị tử tế` });
}

/* 04/11/2026: tách phần dựng thư bản tin để dùng chung cho gửi thật và xem trước (Tổng quan → Email chờ gửi theo lịch). Nội dung thư giữ nguyên. */
const DIGEST_COLS = `so_hieu, title, summary, key_points, hieu_luc, ngay_ban_hanh, level, url, approved_at`;
function digestMail(st, ups, s, intro) {
  const page = `${st.siteUrl}/tools/${TOOL}/#cap-nhat`;
  const lv = { cao: ['Quan trọng', '#B22222', '#FBEAEA'], tb: ['Nên xem', '#8f6a1f', '#FFF4DC'], thap: ['Tham khảo', '#595959', '#EEF1F6'] };
  const items = ups.map(u => { const l = lv[u.level]; const pts = String(u.key_points || '').split('\n').filter(Boolean);
    return `<div style="border:1px solid #e2e6ee;border-radius:10px;padding:12px 14px;margin:0 0 12px">
      <div style="font-size:12.5px;color:#595959">${l ? `<span style="background:${l[2]};color:${l[1]};font-weight:700;border-radius:99px;padding:2px 8px">${l[0]}</span> ` : ''}<b style="color:#1F3864">${esc(u.so_hieu)}</b> · Ban hành ${esc(u.ngay_ban_hanh)}${u.hieu_luc ? ` · <b style="color:#0F6E56">Hiệu lực: ${esc(u.hieu_luc)}</b>` : ''}</div>
      <div style="font-weight:700;font-size:15px;margin:6px 0">${esc(u.title)}</div>${u.summary ? `<div style="font-size:14px;line-height:1.55">${esc(u.summary)}</div>` : ''}
      ${pts.length ? `<ul style="font-size:14px;line-height:1.55;margin:6px 0 4px 18px;padding:0">${pts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${u.url ? `<a href="${esc(u.url)}" style="font-size:13px;color:#2c4d80">Văn bản gốc ↗</a>` : ''}</div>`; }).join('');
  const unsub = `${st.siteUrl}/api/unsubscribe?token=${s.token}`;
  const body = `<p style="${P}">Chào anh/chị,</p><p style="${P}">Em là Đốm. ${intro || `Hôm nay có <b>${ups.length} cập nhật pháp lý mới</b> vừa được rà soát, em gửi anh/chị xem nhé:`}</p>${items}
      <p style="margin:0 0 12px"><a href="${page}" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:9px">Xem trên Cẩm nang</a></p>
      <p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 6px">Đây là bản tóm tắt để tham khảo, được soạn với sự hỗ trợ của AI từ văn bản gốc và đã được anh Tuấn rà soát trước khi gửi; anh/chị nhớ đối chiếu văn bản gốc trước khi áp dụng. Cần trao đổi thêm, anh/chị cứ gửi góp ý trên Cẩm nang, bên em sẽ xem và phản hồi.</p>${SIGN}`;
  return { kind: 'ban-tin', to: s.email, subject: `${SUBJ}Cập nhật pháp lý mới: ${ups[0].title}${ups.length > 1 ? ` (+${ups.length - 1} văn bản)` : ''}`, html: frame(st, 'Cập nhật pháp lý mới dành cho anh/chị', body, unsub), text: ups.map(u => `${u.so_hieu}: ${u.title} ${u.url || ''}`).join('\n') + `\n\nHủy đăng ký: ${unsub}`, unsubscribe: unsub };
}

/* Bản tin: 10h00 sáng mỗi ngày (cron 03:00 UTC), chỉ gửi khi có văn bản MỚI được duyệt kể từ lần gửi trước (không gửi thư rỗng). Duyệt sau 10h thì vào bản tin 10h hôm sau. */
export async function sendDigest(env, { max = 95 } = {}) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, skipped: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const since = st.lastDigest || Date.now() - 2 * 864e5;
  const { results: ups } = await env.DB.prepare(`SELECT ${DIGEST_COLS} FROM legal_docs
      WHERE status = 'approved' AND approved_at > ?1 ORDER BY approved_at DESC LIMIT 20`).bind(since).all();
  if (!ups.length) return { ok: true, skipped: 'Không có cập nhật mới.' };
  const { results: subs } = await env.DB.prepare(`SELECT id, email, token FROM subscribers WHERE tool_slug = ?1 AND status = 'active' ORDER BY id LIMIT ?2`).bind(TOOL, max).all();
  let sent = 0; const errs = [];
  for (const s of subs) {
    try { await sendMail(env, st, digestMail(st, ups, s)); sent++;
      await env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id = ?2`).bind(Date.now(), s.id).run(); }
    catch (e) { errs.push(`${s.email}: ${e.message}`); if (errs.length >= 5) break; }
  }
  const res = { ok: !errs.length, sent, updates: ups.length, at: Date.now(), errors: errs.slice(0, 5) };
  const st2 = [env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_result', ?1)`).bind(JSON.stringify(res))];
  // Chỉ đánh dấu "đã gửi tới văn bản này" khi gửi được (hoặc chưa có ai đăng ký) – lỗi toàn bộ thì lần sau gửi lại
  if (sent || !subs.length) {
    st2.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_digest', ?1)`).bind(String(Math.max(...ups.map(u => u.approved_at)))));
    // 04/11/2026: nhật ký các lượt bản tin (lúc gửi + văn bản mới nhất trong lượt) – dùng cho "Gửi bổ sung" người đăng ký mới
    const runs = (await digestRuns(env)).concat([{ at: Date.now(), upto: Math.max(...ups.map(u => u.approved_at)) }]).slice(-60);
    st2.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_digest_runs', ?1)`).bind(JSON.stringify(runs)));
  }
  await env.DB.batch(st2);
  return res;
}

/* ---------- Tin công cụ mới ----------
 * 02/11/2026 (v1.29): gửi theo lô qua Resend /emails/batch (100 thư / 1 lần gọi) → không còn giới hạn 95 người / lượt,
 * ghi nhật ký + bộ đếm bằng 1 lần DB.batch. Có xem trước (không gửi) và gửi ngay cho 1 công cụ.
 *  - Lịch: 10h sáng (watch, cron 03:00 UTC) gửi các công cụ đã hẹn (announce_at > 0, announced_at = 0)
 *  - Gửi ngay: Quản trị → Công cụ → 👁 Xem trước → ⚡ Gửi ngay (sendToolAnnounce(env, { ids: [id] }))
 * ------------------------------------------------------------ */
const ANN_COLS = `id, slug, name, pain, who, benefits, pricing, price, price_note, status, visible, announce_at, announced_at`;
// "Cộng tay…" → "cộng tay…" (giữ nguyên chữ viết tắt như "MST", "HĐLĐ", "Excel" đứng sau vẫn giữ)
const lower1 = s => { s = String(s || '').trim(); return s.length > 1 && /\p{Lu}/u.test(s[0]) && /\p{Ll}/u.test(s[1]) ? s[0].toLocaleLowerCase('vi') + s.slice(1) : s; };
const utm = (u, c) => u + (u.includes('?') ? '&' : '?') + `utm_source=email&utm_medium=email&utm_campaign=${c}`;
function annMail(st, tools, s, intro) {
  const items = tools.map(t => {
    const bens = String(t.benefits || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 4);
    const price = t.pricing === 'paid' ? `Có phí${t.price > 0 ? ' · ' + Number(t.price).toLocaleString('vi-VN') + 'đ' + (t.price_note ? ' ' + t.price_note : '') : ''}` : 'Miễn phí';
    return `<div style="border:1px solid #e2e6ee;border-radius:10px;padding:14px 16px;margin:0 0 12px">
      <div style="font-weight:700;font-size:16px;color:#1F3864">${esc(t.name)}</div>
      <div style="font-size:12.5px;color:#595959;margin:4px 0 8px"><b style="color:#0F6E56">${esc(price)}</b>${t.who ? ' · Dành cho ' + esc(String(t.who).split(',').slice(0, 3).map(x => x.trim()).filter(Boolean).join(', ')) : ''}</div>
      ${t.pain ? `<div style="font-size:14px;line-height:1.55;margin:0 0 6px">Dành cho anh/chị đang phải ${esc(lower1(t.pain).replace(/[.…]+$/, ''))}.</div>` : ''}
      ${bens.length ? `<ul style="font-size:14px;line-height:1.55;margin:6px 0 8px 18px;padding:0">${bens.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      <a href="${esc(utm(`${st.siteUrl}/cong-cu/${t.slug}`, 'cong-cu-moi'))}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:9px 16px;border-radius:9px;font-size:14px">Dùng ngay</a></div>`; }).join('');
  const subject = `${SUBJ}Công cụ mới: ${tools[0].name}${tools.length > 1 ? ` (+${tools.length - 1} công cụ)` : ''}`;
  const unsub = `${st.siteUrl}/api/unsubscribe?token=${s.token}`;
  const body = `<p style="${P}">Chào anh/chị,</p><p style="${P}">Em là Đốm. ${intro || `Bộ công cụ vừa có <b>${tools.length} công cụ mới</b> để anh/chị dùng thử:`}</p>${items}
      <p style="margin:0 0 12px"><a href="${esc(utm(`${st.siteUrl}/cong-cu`, 'cong-cu-moi'))}" style="display:inline-block;background:#1F3864;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:9px">Xem Bộ công cụ</a></p>
      <p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 6px">Anh/chị đang phải làm một việc lặp đi lặp lại mà chưa có công cụ? Anh/chị cứ kể cho em nghe trong mục Đề xuất công cụ, em sẽ cố gắng tìm giải pháp.</p>${SIGN}`;
  return { kind: 'cong-cu-moi', to: s.email, subject, unsubscribe: unsub, html: frame(st, 'Công cụ mới dành cho anh/chị', body, unsub, LISTS[TOOLS_LIST].label),
    text: tools.map(t => `${t.name}: ${utm(`${st.siteUrl}/cong-cu/${t.slug}`, 'cong-cu-moi')}`).join('\n') + `\n\nHủy đăng ký: ${unsub}` };
}
/* Gửi tối đa 100 thư trong 1 lần gọi Resend; ghi nhật ký + bộ đếm bằng 1 lần DB.batch. Lỗi → ném lỗi (cả lô không gửi) */
async function sendMailBatch(env, st, mails) {
  let r, d = {}, err = '';
  try {
    r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', signal: AbortSignal.timeout(30000),
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(mails.map(m => ({ from: `${st.fromName} <${st.from}>`, to: [m.to], subject: m.subject, html: m.html, text: m.text,
        ...(m.unsubscribe ? { headers: { 'List-Unsubscribe': `<${m.unsubscribe}>` } } : {}) }))),
    });
    d = await r.json().catch(() => ({}));
    if (!r.ok) err = `Resend ${r.status}: ${d.message || d.name || ''}`;
  } catch (e) { err = 'Không kết nối được Resend: ' + (e.message || e); }
  const ids = Array.isArray(d.data) ? d.data.map(x => x.id || '') : [];
  try {
    await ensureMailLog(env);
    const t = Date.now(), day = vnDay(t);
    await env.DB.batch([
      ...mails.map((m, i) => env.DB.prepare(`INSERT INTO mail_log (at, day, to_addr, subject, kind, from_addr, ok, error, resend_id, text, html) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`)
        .bind(t, day, String(m.to).slice(0, 200), String(m.subject).slice(0, 300), m.kind, String(st.from).slice(0, 200), err ? 0 : 1, err.slice(0, 500), String(ids[i] || '').slice(0, 80),
          String(m.text || '').slice(0, 8000), String(m.html || '').slice(0, 120000))),
      env.DB.prepare(`INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + ?2`).bind(`_mail_${err ? 'err' : 'ok'}_${day}`, mails.length),
    ]);
  } catch (e) { console.error('mailBatchLog', e); }
  if (err) throw new Error(err);
  return mails.length;
}
const activeToolSubs = env => env.DB.prepare(`SELECT id, email, token FROM subscribers WHERE tool_slug = ?1 AND status = 'active' ORDER BY id`).bind(TOOLS_LIST).all().then(r => r.results || []);

/* Xem trước thư của 1 công cụ (không gửi gì) + số người sẽ nhận */
export async function previewToolAnnounce(env, id) {
  const st = await mailStatus(env);
  const t = await env.DB.prepare(`SELECT ${ANN_COLS} FROM tools WHERE id = ?1`).bind(id).first();
  if (!t) return null;
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE tool_slug = ?1 AND status = 'active'`).bind(TOOLS_LIST).first('n');
  const m = annMail(st, [t], { email: 'nguoi-nhan@vi-du.com', token: 'xem-truoc' });
  return { id: t.id, name: t.name, status: t.status, visible: t.visible, announce_at: t.announce_at, announced_at: t.announced_at,
    ready: st.ready, from: st.from, recipients: n || 0, subject: m.subject, html: m.html };
}

/* Gửi tin công cụ mới.
 *  - Không truyền ids: các công cụ anh đã hẹn (lượt 10h sáng, cùng lượt bản tin pháp lý)
 *  - ids = [id]: anh bấm "Gửi ngay" trong Quản trị (công cụ phải Dùng được + đang hiện) */
export async function sendToolAnnounce(env, { ids } = {}) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, skipped: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const now_ = Date.now();
  const list = Array.isArray(ids) ? ids.map(x => parseInt(x, 10)).filter(x => x > 0).slice(0, 10) : null;
  const { results: tools } = list
    ? await env.DB.prepare(`SELECT ${ANN_COLS} FROM tools WHERE id IN (${list.map((_, i) => '?' + (i + 1)).join(',')}) AND visible = 1 AND status = 'ok' ORDER BY id`).bind(...list).all()
    : await env.DB.prepare(`SELECT ${ANN_COLS} FROM tools WHERE announce_at > 0 AND announced_at = 0 AND visible = 1 AND status = 'ok' ORDER BY announce_at LIMIT 10`).all();
  if (!tools.length) return { ok: true, sent: 0, skipped: list ? 'Công cụ chưa ở trạng thái Dùng được hoặc đang ẩn.' : 'Không có công cụ nào chờ thông báo.' };
  const subs = await activeToolSubs(env);
  let sent = 0; const errs = [];
  for (let i = 0; i < subs.length; i += 100) {
    const chunk = subs.slice(i, i + 100);
    try {
      sent += await sendMailBatch(env, st, chunk.map(s => annMail(st, tools, s)));
      await env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id IN (${chunk.map(s => +s.id).join(',')})`).bind(Date.now()).run().catch(e => console.error(e));
    } catch (e) { errs.push(`Lô ${i / 100 + 1} (${chunk.length} người): ${e.message}`); }
  }
  const res = { ok: !errs.length, sent, total: subs.length, tools: tools.length, names: tools.map(t => t.name), at: Date.now(), via: list ? 'gui-ngay' : 'lich-10h', errors: errs.slice(0, 5) };
  // Chỉ đánh dấu "đã thông báo" khi gửi được (hoặc chưa có ai đăng ký); lỗi toàn bộ thì giữ hẹn để lần sau gửi lại
  if (sent || !subs.length) await env.DB.batch([...tools.map(t => env.DB.prepare(`UPDATE tools SET announce_at = CASE WHEN announce_at > 0 THEN announce_at ELSE ?1 END, announced_at = ?2 WHERE id = ?3`).bind(now_, Date.now(), t.id)),
    env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mail_last_tools_result', ?1)`).bind(JSON.stringify(res))]);
  return res;
}


/* ------------------------------------------------------------
 * 03/11/2026 BÁO CẬP NHẬT CÔNG CỤ (bản mới / tính năng mới)
 *  - Nội dung: dòng mới nhất trong "Lịch sử cập nhật" (changelog: "Phiên bản | dd/mm/yyyy | ý 1; ý 2; …") + lời nhắn thêm của anh (không bắt buộc)
 *  - Người nhận: người đăng ký "Bộ công cụ" đã xác nhận + người để lại email trong form Góp ý của CHÍNH công cụ đó (chưa bỏ nhận), không trùng email
 *  - Link bỏ nhận: người đăng ký → /api/unsubscribe?token= ; người góp ý → /api/unsubscribe?fb=
 *  - Chỉ gửi khi anh bấm (Quản trị → Công cụ → 🔔 Báo cập nhật → xem trước → bấm 2 lần) – không có lịch tự gửi
 * ------------------------------------------------------------ */
const UPD_COLS = `id, slug, name, status, visible, version, changelog, upd_sent_ver, upd_sent_at`;
function banMoi(t) {
  const dong = String(t.changelog || '').split('\n').map(x => x.trim()).filter(Boolean)[0] || '';
  const p = dong.split('|').map(x => x.trim());
  const ver = p.length >= 3 ? p[0] : String(t.version || '').replace(/^Bản\s*/i, '');
  const items = (p.length >= 3 ? p.slice(2).join(' | ') : '').split(';').map(x => x.trim()).filter(Boolean);
  return { ver, ngay: p.length >= 3 ? p[1] : '', items };
}
function updMail(st, t, r, note) {
  const b = banMoi(t);
  const link = utm(`${st.siteUrl}/tools/${t.slug}/`, 'cap-nhat-' + t.slug);
  const subject = `${SUBJ}${t.name} có bản mới${b.ver ? ' ' + b.ver : ''}`;
  const loi = r.fb ? 'Anh/chị từng góp ý cho công cụ này và để lại email để nhận tin khi công cụ có bản mới.' : 'Anh/chị đang nhận tin từ Bộ công cụ của Quản trị tử tế.';
  const body = `<p style="${P}">Chào anh/chị,</p><p style="${P}">Em là Đốm. ${esc(loi)} Công cụ <b>${esc(t.name)}</b> vừa được cập nhật${b.ver ? ` lên <b>bản ${esc(b.ver)}</b>` : ''}${b.ngay ? ` (${esc(b.ngay)})` : ''}:</p>
      ${b.items.length ? `<ul style="font-size:14.5px;line-height:1.6;margin:0 0 14px 18px;padding:0">${b.items.slice(0, 8).map(x => `<li style="margin:0 0 6px">${esc(x)}</li>`).join('')}</ul>` : ''}
      ${note ? `<div style="border-left:3px solid #C08B2C;background:#faf6ee;padding:10px 14px;margin:0 0 14px;font-size:14.5px;line-height:1.6">${esc(note).replace(/\n/g, '<br>')}</div>` : ''}
      <p style="margin:0 0 14px"><a href="${esc(link)}" style="display:inline-block;background:#C08B2C;color:#1a1208;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:9px;font-size:14.5px">Dùng bản mới</a></p>
      <p style="font-size:13.5px;line-height:1.65;color:#595959;margin:0 0 6px">Nhiều thay đổi trong bản này đến từ góp ý của người dùng. Anh/chị gặp vướng hay muốn công cụ làm thêm việc gì, cứ bấm nút <b>Góp ý cho Đốm</b> ngay trong công cụ nhé.</p>${SIGN}`;
  return { kind: 'cap-nhat', to: r.email, subject, unsubscribe: r.unsub, html: frame(st, `${t.name} có bản mới`, body, r.unsub, 'Bộ công cụ'),
    text: `${t.name} – bản ${b.ver}\n${b.items.map(x => '- ' + x).join('\n')}${note ? '\n\n' + note : ''}\n\nDùng bản mới: ${link}\n\nBỏ nhận thư: ${r.unsub}` };
}
async function updRecipients(env, st, t) {
  const subs = await activeToolSubs(env);
  const seen = new Set(subs.map(x => String(x.email).toLowerCase()));
  const out = subs.map(x => ({ email: x.email, id: x.id, unsub: `${st.siteUrl}/api/unsubscribe?token=${x.token}` }));
  let fbs = [];
  try {
    fbs = (await env.DB.prepare(`SELECT email, MIN(notify_token) AS tk FROM feedback WHERE tool_slug = ?1 AND email <> '' AND notify = 1 AND notify_token <> '' GROUP BY email`).bind(t.slug).all()).results || [];
    // người đã bỏ nhận ở bất kỳ góp ý nào (cùng email) thì không gửi
    const off = new Set(((await env.DB.prepare(`SELECT DISTINCT email FROM feedback WHERE email <> '' AND notify = 0`).all()).results || []).map(x => x.email));
    fbs = fbs.filter(x => !off.has(x.email));
  } catch (e) { console.error('updRecipients', e); }
  let nFb = 0;
  for (const f of fbs) { const e = String(f.email).toLowerCase(); if (seen.has(e)) continue; seen.add(e); nFb++; out.push({ email: f.email, fb: 1, unsub: `${st.siteUrl}/api/unsubscribe?fb=${f.tk}` }); }
  return { list: out, nSub: subs.length, nFb };
}
export async function previewToolUpdate(env, id, note = '') {
  const st = await mailStatus(env);
  const t = await env.DB.prepare(`SELECT ${UPD_COLS} FROM tools WHERE id = ?1`).bind(id).first();
  if (!t) return null;
  const rc = await updRecipients(env, st, t), b = banMoi(t);
  const m = updMail(st, t, { email: 'nguoi-nhan@vi-du.com', unsub: `${st.siteUrl}/api/unsubscribe?token=xem-truoc` }, note);
  return { id: t.id, name: t.name, status: t.status, visible: t.visible, version: t.version, ver: b.ver, items: b.items.length, upd_sent_ver: t.upd_sent_ver, upd_sent_at: t.upd_sent_at,
    ready: st.ready, from: st.from, recipients: rc.list.length, nSub: rc.nSub, nFb: rc.nFb, subject: m.subject, html: m.html };
}
export async function sendToolUpdate(env, { id, note = '' } = {}) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, error: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const t = await env.DB.prepare(`SELECT ${UPD_COLS} FROM tools WHERE id = ?1`).bind(id).first();
  if (!t) return { ok: false, error: 'Không tìm thấy công cụ.' };
  const b = banMoi(t);
  if (!b.items.length) return { ok: false, error: 'Lịch sử cập nhật của công cụ chưa có dòng nào (dạng "Phiên bản | ngày | ý 1; ý 2").' };
  const { list } = await updRecipients(env, st, t);
  let sent = 0; const errs = [];
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      sent += await sendMailBatch(env, st, chunk.map(r => updMail(st, t, r, note)));
      const sid = chunk.filter(r => r.id).map(r => +r.id);
      if (sid.length) await env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id IN (${sid.join(',')})`).bind(Date.now()).run().catch(e => console.error(e));
    } catch (e) { errs.push(`Lô ${i / 100 + 1} (${chunk.length} người): ${e.message}`); }
  }
  if (sent || !list.length) await env.DB.prepare(`UPDATE tools SET upd_sent_ver = ?1, upd_sent_at = ?2 WHERE id = ?3`).bind(b.ver || t.version || '', Date.now(), t.id).run();
  return { ok: !errs.length, sent, total: list.length, ver: b.ver, errors: errs.slice(0, 5) };
}


/* ------------------------------------------------------------
 * 04/11/2026 EMAIL CHỜ GỬI THEO LỊCH (Quản trị → Tổng quan)
 * Đọc đúng điều kiện mà lượt 10h00 sáng (watch, cron 03:00 UTC) dùng để gửi – không gửi gì:
 *  - Bản tin pháp lý: văn bản đã duyệt sau lần gửi bản tin trước → người đăng ký Cẩm nang đã xác nhận (tối đa 95 người/lượt)
 *  - Tin công cụ mới: công cụ anh đã hẹn (announce_at > 0, chưa gửi) → người đăng ký Bộ công cụ đã xác nhận
 *    Công cụ đang ẩn hoặc chưa "Dùng được" vẫn liệt kê nhưng đánh dấu "sẽ không gửi"
 *  - preview = 'ban-tin' | 'cong-cu-moi': trả thêm nguyên thư (html) để xem trước
 * ------------------------------------------------------------ */
export async function mailQueue(env, { preview = '' } = {}) {
  const st = await mailStatus(env), t0 = Date.now();
  const d = new Date(t0); let next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 3, 0, 0);
  if (next <= t0) next += 864e5;
  const cnt = async slug => +(await env.DB.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE tool_slug = ?1 AND status = 'active'`).bind(slug).first('n').catch(() => 0)) || 0;
  const since = st.lastDigest || t0 - 2 * 864e5, DIG_MAX = 95;
  const ups = (await env.DB.prepare(`SELECT id, ${DIGEST_COLS} FROM legal_docs WHERE status = 'approved' AND approved_at > ?1 ORDER BY approved_at DESC LIMIT 20`).bind(since).all().catch(() => ({ results: [] }))).results || [];
  const pend = +(await env.DB.prepare(`SELECT COUNT(*) AS n FROM legal_docs WHERE status = 'pending'`).first('n').catch(() => 0)) || 0;
  const nLaw = await cnt(TOOL);
  const tools = (await env.DB.prepare(`SELECT ${ANN_COLS} FROM tools WHERE announce_at > 0 AND announced_at = 0 ORDER BY announce_at LIMIT 30`).all().catch(() => ({ results: [] }))).results || [];
  const okTools = tools.filter(t => +t.visible === 1 && t.status === 'ok').slice(0, 10);
  const nTool = await cnt(TOOLS_LIST);
  const fake = { email: 'nguoi-nhan@vi-du.com', token: 'xem-truoc' };
  const law = { kind: 'ban-tin', items: ups.map(u => ({ id: u.id, so_hieu: u.so_hieu, title: u.title, level: u.level, approved_at: u.approved_at })),
    recipients: Math.min(nLaw, DIG_MAX), totalSubs: nLaw, max: DIG_MAX, pendingDocs: pend, since,
    subject: ups.length ? digestMail(st, ups, fake).subject : '' };
  const tl = { kind: 'cong-cu-moi', items: tools.map(t => ({ id: t.id, name: t.name, slug: t.slug, announce_at: t.announce_at, willSend: +t.visible === 1 && t.status === 'ok',
      why: +t.visible !== 1 ? 'Đang ẩn trên web' : t.status !== 'ok' ? 'Chưa ở trạng thái "Dùng được"' : '' })),
    recipients: nTool, subject: okTools.length ? annMail(st, okTools, fake).subject : '' };
  if (preview === 'ban-tin' && ups.length) law.html = digestMail(st, ups, fake).html;
  if (preview === 'cong-cu-moi' && okTools.length) tl.html = annMail(st, okTools, fake).html;
  const sp = await supplementPlan(env);
  law.supp = supSummary(sp.law, 'docs'); tl.supp = supSummary(sp.tools, 'tools');
  if (preview === 'bo-sung-ban-tin' && sp.law.list.length) { const r = sp.law.list[0]; law.supp.html = digestMail(st, r.docs, fake, supIntro('law', r.docs.length)).html; law.supp.subject = digestMail(st, r.docs, fake).subject; }
  if (preview === 'bo-sung-cong-cu-moi' && sp.tools.list.length) { const r = sp.tools.list[0]; tl.supp.html = annMail(st, r.tools, fake, supIntro('tools', r.tools.length)).html; tl.supp.subject = annMail(st, r.tools, fake).subject; }
  return { ready: st.ready, from: st.from, next, now: t0, groups: [law, tl] };
}

/* ------------------------------------------------------------
 * 04/11/2026 GỬI NGAY + GỬI BỔ SUNG (Quản trị → Tổng quan → Email chờ gửi theo lịch)
 *  - Gửi ngay: chạy đúng lượt gửi của nhóm đó ngay bây giờ → đã đánh dấu "đã gửi" nên lượt 10h sáng không gửi lại
 *  - Gửi bổ sung: người xác nhận đăng ký SAU một lượt đã gửi (trong SUP_DAYS ngày gần nhất) nhận 1 thư gửi bù
 *    những văn bản / công cụ họ lỡ. Mốc "đã gửi bù tới đâu": settings._sup_law_at, _sup_tools_at (theo confirmed_at)
 *    Bản tin: chỉ tính các lượt gửi từ khi có nhật ký _mail_digest_runs (bản 04/11/2026)
 * ------------------------------------------------------------ */
const SUP_DAYS = 14;
async function settingVal(env, k) { return (await env.DB.prepare(`SELECT value FROM settings WHERE key = ?1`).bind(k).first('value').catch(() => '')) || ''; }
async function digestRuns(env) { try { const a = JSON.parse(await settingVal(env, '_mail_digest_runs') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
const supIntro = (k, n) => k === 'law'
  ? `Anh/chị vừa đăng ký nhận tin, em gửi bù <b>${n} cập nhật pháp lý</b> gần đây đã được rà soát mà anh/chị chưa nhận được:`
  : `Anh/chị vừa đăng ký nhận tin, em gửi bù <b>${n} công cụ mới</b> phát hành gần đây mà anh/chị chưa nhận được thông báo:`;
export async function supplementPlan(env) {
  const from = Date.now() - SUP_DAYS * 864e5;
  const subsAfter = (slug, low) => env.DB.prepare(`SELECT id, email, token, confirmed_at FROM subscribers WHERE tool_slug = ?1 AND status = 'active' AND confirmed_at > ?2 ORDER BY confirmed_at, id LIMIT 500`).bind(slug, low).all().then(r => r.results || []).catch(() => []);
  // Bản tin pháp lý
  const law = { list: [], items: [], lastAt: 0 };
  const runs = (await digestRuns(env)).filter(r => r.at > from).sort((a, b) => a.at - b.at);
  if (runs.length) {
    const docs = (await env.DB.prepare(`SELECT id, ${DIGEST_COLS} FROM legal_docs WHERE status = 'approved' AND approved_at > ?1 ORDER BY approved_at DESC LIMIT 40`).bind(from - 3 * 864e5).all().catch(() => ({ results: [] }))).results || [];
    const sentDocs = docs.map(d => ({ ...d, sent_at: (runs.find(r => r.upto >= d.approved_at) || {}).at || 0 })).filter(d => d.sent_at > from);
    if (sentDocs.length) {
      const low = Math.max(+(await settingVal(env, '_sup_law_at')) || 0, Math.min(...sentDocs.map(d => d.sent_at)));
      for (const s of await subsAfter(TOOL, low)) { const miss = sentDocs.filter(d => d.sent_at < s.confirmed_at); if (miss.length) law.list.push({ s, docs: miss }); }
      law.items = sentDocs.filter(d => law.list.some(r => r.docs.includes(d)));
      law.lastAt = Math.max(...sentDocs.map(d => d.sent_at));
    }
  }
  // Tin công cụ mới
  const tools = { list: [], items: [], lastAt: 0 };
  const sentTools = (await env.DB.prepare(`SELECT ${ANN_COLS} FROM tools WHERE announced_at > ?1 AND visible = 1 AND status = 'ok' ORDER BY announced_at DESC LIMIT 10`).bind(from).all().catch(() => ({ results: [] }))).results || [];
  if (sentTools.length) {
    const low = Math.max(+(await settingVal(env, '_sup_tools_at')) || 0, Math.min(...sentTools.map(t => t.announced_at)));
    for (const s of await subsAfter(TOOLS_LIST, low)) { const miss = sentTools.filter(t => t.announced_at < s.confirmed_at); if (miss.length) tools.list.push({ s, tools: miss }); }
    tools.items = sentTools.filter(t => tools.list.some(r => r.tools.includes(t)));
    tools.lastAt = Math.max(...sentTools.map(t => t.announced_at));
  }
  return { law, tools };
}
function supSummary(g, key) {
  return { n: g.list.length, lastAt: g.lastAt, emails: g.list.slice(0, 50).map(r => ({ email: r.s.email, at: r.s.confirmed_at, n: r[key].length })),
    items: g.items.map(x => key === 'docs' ? { id: x.id, label: `${x.so_hieu || ''} ${x.title || ''}`.trim() } : { id: x.id, label: x.name }) };
}
export async function sendSupplement(env, kind) {
  const st = await mailStatus(env);
  if (!st.ready) return { ok: false, error: 'Chưa bật gửi email hoặc chưa cài khóa Resend / email gửi đi.' };
  const isLaw = kind === 'ban-tin', sp = await supplementPlan(env), list = isLaw ? sp.law.list : sp.tools.list;
  if (!list.length) return { ok: true, sent: 0, skipped: 'Không có người đăng ký mới cần gửi bổ sung.' };
  let sent = 0; const errs = [];
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      sent += await sendMailBatch(env, st, chunk.map(r => ({ ...(isLaw ? digestMail(st, r.docs, r.s, supIntro('law', r.docs.length)) : annMail(st, r.tools, r.s, supIntro('tools', r.tools.length))), kind: 'bo-sung' })));
      await env.DB.batch([
        env.DB.prepare(`UPDATE subscribers SET last_sent_at = ?1 WHERE id IN (${chunk.map(r => +r.s.id).join(',')})`).bind(Date.now()),
        env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)`).bind(isLaw ? '_sup_law_at' : '_sup_tools_at', String(Math.max(...chunk.map(r => r.s.confirmed_at)))),
      ]);
    } catch (e) { errs.push(`Lô ${i / 100 + 1} (${chunk.length} người): ${e.message}`); break; }
  }
  return { ok: !errs.length, sent, total: list.length, errors: errs };
}
/* Gửi ngay 1 nhóm của lượt 10h sáng: 'ban-tin' (bản tin pháp lý) | 'cong-cu-moi' (mọi công cụ đang hẹn) */
export async function sendQueueNow(env, kind) {
  if (kind === 'ban-tin') { const r = await sendDigest(env); return r.skipped && !r.sent ? { ...r, ok: r.ok !== false, sent: 0 } : r; }
  if (kind === 'cong-cu-moi') return sendToolAnnounce(env);
  return { ok: false, error: 'Loại thư không hợp lệ.' };
}


/* 06/11/2026: Thư xác nhận đã tiếp nhận đề xuất / góp ý (Quản trị → Sửa đề xuất / Sửa góp ý → nút "✉ Email xác nhận tiếp nhận").
 * Anh xem trước, sửa người nhận / tiêu đề / nội dung rồi mới gửi. Thư giao dịch 1 lần, ký tên Minh Tuấn, trả lời thư về Email liên hệ (Hệ thống → Cài đặt chung). */
export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const ddmmyyyy = ms => { const x = new Date((ms || Date.now()) + 7 * 3600000).toISOString(); return `${x.slice(8, 10)}/${x.slice(5, 7)}/${x.slice(0, 4)}`; };
export function ackDraft({ ent, row, toolName, zalo }) {
  const isReq = ent === 'requests', day = ddmmyyyy(row.created_at);
  const title = String(row.board_title || row.pub_title || '').trim();
  const what = isReq ? 'đề xuất' : 'góp ý';
  const about = isReq ? (title ? `về công cụ "${title}"` : 'về công cụ anh/chị cần') : (toolName ? `về công cụ ${toolName}` : 'về công cụ của Quản trị tử tế');
  const plan = isReq
    ? (row.tool_ref && toolName ? `Em đang nghiên cứu để bổ sung tính năng này vào ${toolName} trên website.` : 'Em đang nghiên cứu, phân tích để xây dựng công cụ phù hợp với nhu cầu này.')
    : 'Em đang xem xét và xử lý theo góp ý của anh/chị.';
  const subject = `[Quản trị tử tế] Đã tiếp nhận ${what} ${isReq ? (title ? 'công cụ ' + title : 'công cụ của anh/chị') : (toolName ? 'về ' + toolName : 'của anh/chị')}`;
  const text = `Chào anh/chị,

Em là Minh Tuấn từ website quantritute.com (Quản trị tử tế). Em đã nhận được ${what} của anh/chị trên website ngày ${day} ${about}. Em cảm ơn anh/chị đã tin dùng các công cụ của Đốm và dành thời gian chia sẻ${isReq ? ' một nhu cầu rất thực tế' : ''}.

${plan} Khi hoàn thiện, em sẽ thông báo ngay để anh/chị dùng thử và góp ý thêm.

Nếu anh/chị muốn chia sẻ thêm thông tin, anh/chị cứ phản hồi thư này${zalo ? ` hoặc nhắn Zalo cho em qua số ${zalo}` : ''}.

Cảm ơn anh/chị đã tin tưởng.

Trân trọng,
Minh Tuấn`;
  const zaloText = `Chào anh/chị, em là Minh Tuấn từ quantritute.com (Quản trị tử tế). Em đã nhận được ${what} của anh/chị ngày ${day} ${about}. Cảm ơn anh/chị đã tin dùng công cụ của Đốm. ${plan} Khi hoàn thiện, em sẽ báo ngay để anh/chị dùng thử. Em cảm ơn anh/chị!`;
  return { subject, text, zaloText, label: isReq ? 'Bảng ghim' : 'Góp ý công cụ', title: `Em đã nhận được ${what} của anh/chị` };
}
export function ackHtml(st, { title, label, text }) {
  const paras = String(text || '').replace(/\r\n/g, '\n').trim().split(/\n\s*\n/).map(p => `<p style="${P}">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('\n');
  return frame(st, title, paras, '', label);
}
export async function sendAck(env, st, { to, subject, text, title, label, replyTo }) {
  return sendMail(env, st, { kind: 'tiep-nhan', to, subject, text, html: ackHtml(st, { title, label, text }), replyTo });
}
