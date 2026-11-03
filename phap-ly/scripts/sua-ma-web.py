# 03/11/2026 – Pháp lý: sửa mã web (đồng ý, lưu vết, thời hạn lưu, nhãn AI, chân trang, header). Mỗi chuỗi phải khớp đúng 1 lần.
import os, re
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..'))
CS = '/chinh-sach-du-lieu/'
def patch(p, reps, count=1):
    s = open(p, encoding='utf-8').read()
    for a, b in reps:
        n = s.count(a)
        if n != count and not (isinstance(count, dict)):
            raise SystemExit(f'LỖI {p}: "{a[:80]}" xuất hiện {n} lần')
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s); print('ĐỔI', p)

# ---------- A. core.js: cột lưu vết đồng ý ----------
patch('src/core.js', [
 ("async function addCols(env, table, cols) {",
  "/* 03/11/2026 Pháp lý (Luật BVDLCN 91/2025): lưu vết đồng ý = thời điểm + mã câu chữ (fb-v1, rq-v1, bk-v1, sub-v1, sl-v1 – xem quantritute/phap-ly/MAU-CAU-DONG-Y.md) */\n"
  "export const CONSENT_COLS = { consent_at: 'INTEGER NOT NULL DEFAULT 0', consent_ver: \"TEXT NOT NULL DEFAULT ''\" };\nasync function addCols(env, table, cols) {"),
 ("  await addCols(env, 'requests', PUB_COLS);\n",
  "  await addCols(env, 'requests', PUB_COLS);\n  await addCols(env, 'feedback', CONSENT_COLS);\n  await addCols(env, 'requests', CONSENT_COLS);\n  await addCols(env, 'bookings', CONSENT_COLS);\n  await addCols(env, 'subscribers', { consent_ver: CONSENT_COLS.consent_ver });\n"),
 ("JSON.stringify([PUB_COLS, REQ_EXTRA_COLS, POST_EXTRA_COLS, REFL_EXTRA_COLS])", "JSON.stringify([PUB_COLS, REQ_EXTRA_COLS, POST_EXTRA_COLS, REFL_EXTRA_COLS, CONSENT_COLS])"),
])

# ---------- B. public-api.js: bắt buộc đồng ý + lưu vết ----------
s = open('src/public-api.js', encoding='utf-8').read()
def one(a, b):
    global s
    n = s.count(a)
    if n != 1: raise SystemExit(f'LỖI public-api.js: "{a[:80]}" xuất hiện {n} lần')
    s = s.replace(a, b)
one("        if (content.length < 5) errs.push('Vui lòng nhập nội dung góp ý.');\n",
    "        if (content.length < 5) errs.push('Vui lòng nhập nội dung góp ý.');\n        if (!body.consent) errs.push('Anh/chị tích ô đồng ý để Đốm lưu thông tin và phản hồi góp ý giúp em nhé (cập nhật công cụ bản mới nếu chưa thấy ô này).');\n")
one("INSERT INTO feedback (tool_slug, name, phone, content, page, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`)\n          .bind(tool, name, phone, content, clean(body.page, 200), ipHash, t)",
    "INSERT INTO feedback (tool_slug, name, phone, content, page, ip_hash, created_at, updated_at, consent_at, consent_ver) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?7, 'fb-v1')`)\n          .bind(tool, name, phone, content, clean(body.page, 200), ipHash, t)")
# đăng ký thư: lần 1 = từ ô "Báo cho tôi khi có công cụ mới" trong hộp gửi link (sl-v1), lần 2 = form đăng ký (sub-v1)
U = "consent_at = ?2, ip_hash = ?3"
assert s.count(U) == 2, s.count(U)
i = s.index(U); s = s[:i] + "consent_at = ?2, consent_ver = 'sl-v1', ip_hash = ?3" + s[i + len(U):]
i = s.index(U); s = s[:i] + "consent_at = ?2, consent_ver = 'sub-v1', ip_hash = ?3" + s[i + len(U):]
one("INSERT INTO subscribers (tool_slug, email, status, token, consent_at, ip_hash, created_at, updated_at) VALUES ('bo-cong-cu', ?1, 'pending', ?2, ?3, ?4, ?3, ?3)",
    "INSERT INTO subscribers (tool_slug, email, status, token, consent_at, consent_ver, ip_hash, created_at, updated_at) VALUES ('bo-cong-cu', ?1, 'pending', ?2, ?3, 'sl-v1', ?4, ?3, ?3)")
one("INSERT INTO subscribers (tool_slug, email, status, token, consent_at, ip_hash, created_at, updated_at) VALUES (?1, ?2, 'pending', ?3, ?4, ?5, ?4, ?4)",
    "INSERT INTO subscribers (tool_slug, email, status, token, consent_at, consent_ver, ip_hash, created_at, updated_at) VALUES (?1, ?2, 'pending', ?3, ?4, 'sub-v1', ?5, ?4, ?4)")
one("        if (pain.length < 10) return json({ error: 'Anh/chị kể cụ thể hơn một chút giúp Đốm nhé (ít nhất 10 ký tự).' }, 422);\n",
    "        if (pain.length < 10) return json({ error: 'Anh/chị kể cụ thể hơn một chút giúp Đốm nhé (ít nhất 10 ký tự).' }, 422);\n"
    "        const rqContact = clean(body.contact, 160); // 03/11/2026: có để lại Zalo/Email thì phải tích đồng ý\n"
    "        if (rqContact && !body.consent) return json({ error: 'Anh/chị tích ô đồng ý để Đốm lưu Zalo/Email và báo tin giúp em nhé (hoặc để trống ô liên hệ).' }, 422);\n")
one("INSERT INTO requests (pain, role, contact, tool_ref, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)\n          .bind(pain, clean(body.role, 80), clean(body.contact, 160), ref, ipHash, t).run();",
    "INSERT INTO requests (pain, role, contact, tool_ref, ip_hash, created_at, updated_at, consent_at, consent_ver) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?8)`)\n          .bind(pain, clean(body.role, 80), rqContact, ref, ipHash, t, rqContact ? t : 0, rqContact ? 'rq-v1' : '').run();")
one("INSERT INTO bookings (name, contact, topic, description, ip_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)",
    "INSERT INTO bookings (name, contact, topic, description, ip_hash, created_at, updated_at, consent_at, consent_ver) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6, 'bk-v1')`)")
open('src/public-api.js', 'w', encoding='utf-8').write(s); print('ĐỔI src/public-api.js')

# ---------- C. watch: dọn dữ liệu quá hạn mỗi ngày 10:00 ----------
patch('watch/index.js', [
 ("import { sendDigest, sendToolAnnounce } from '../src/mailer.js';",
  "import { sendDigest, sendToolAnnounce } from '../src/mailer.js';\nimport { cleanupPersonalData } from '../src/retention.js'; // 03/11/2026: thời hạn lưu dữ liệu cá nhân"),
 ("        const t = await sendToolAnnounce(env).catch(e => ({ ok: false, error: e.message }));\n",
  "        const t = await sendToolAnnounce(env).catch(e => ({ ok: false, error: e.message }));\n        const c = await cleanupPersonalData(env).catch(e => ({ error: e.message }));\n        console.log('retention', JSON.stringify(c));\n"),
])

# ---------- D. app.js ----------
LINKA = f' <a href="{CS}" target="_blank" rel="noopener">Chính sách dữ liệu</a>'
patch('site/public/app.js', [
 ('<span class="socials"><a href="/huong-dan/">Hướng dẫn</a>',
  '<span class="socials"><a href="/huong-dan/">Hướng dẫn</a><a href="/chinh-sach-du-lieu/">Chính sách dữ liệu</a><a href="/dieu-khoan-su-dung/">Điều khoản</a><a href="#" data-cookie-settings>Tùy chọn cookie</a>'),
 ('<label class="cf-check"><input type="checkbox" id="b-consent"> Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.</label>',
  '<label class="cf-check"><input type="checkbox" id="b-consent"> <span>Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.' + LINKA + '</span></label>'),
 ('<input type="checkbox" id="b-consent" style="width:auto;margin-top:4px"> Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.',
  '<input type="checkbox" id="b-consent" style="width:auto;margin-top:4px"> <span>Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.' + LINKA + '</span>'),
 ('Hủy bất cứ lúc nào bằng link trong mỗi email.</span></label>', 'Hủy bất cứ lúc nào bằng link trong mỗi email.' + LINKA + '</span></label>'),
 ("contact: $('#o-contact').value, website: $('#o-web').value }", "contact: $('#o-contact').value, consent: !!($('#o-consent') || {}).checked, website: $('#o-web').value }"),
])

# ---------- E. dom.js ----------
patch('site/public/dom.js', [
 ('<label for="dm-o-contact">Zalo hoặc Email – để Đốm báo tin khi xong<input id="dm-o-contact" placeholder="Không bắt buộc"></label></div>',
  '<label for="dm-o-contact">Zalo hoặc Email – để Đốm báo tin khi xong<input id="dm-o-contact" placeholder="Không bắt buộc"></label></div>\n'
  '      <label class="cf-check"><input type="checkbox" id="dm-o-consent"> <span>Nếu để lại Zalo/Email: tôi đồng ý để Đốm lưu thông tin này để báo tin khi xử lý xong đề xuất.' + LINKA + '</span></label>'),
 ('<label class="cf-check"><input type="checkbox" id="dm-b-consent"> Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.</label>',
  '<label class="cf-check"><input type="checkbox" id="dm-b-consent"> <span>Tôi đồng ý để Đốm lưu thông tin này và liên hệ lại.' + LINKA + '</span></label>'),
 ("contact: v('dm-o-contact').value, tool_ref:", "contact: v('dm-o-contact').value, consent: v('dm-o-consent').checked, tool_ref:"),
])

# ---------- F. hộp gửi link qua email ----------
patch('site/public/qtt-sendlink.js', [
 ('        <p class="qsl-msg" role="status"></p>\n',
  '        <p class="qsl-note" style="font-size:12.5px;color:#6B6259;margin:6px 0 0;line-height:1.5">Email chỉ dùng để gửi link này, tự xoá sau 30 ngày. <a href="/chinh-sach-du-lieu/" target="_blank" rel="noopener" style="color:inherit">Chính sách dữ liệu</a></p>\n        <p class="qsl-msg" role="status"></p>\n'),
])

# ---------- G. Clarity: link chính sách + Tùy chọn cookie (rút lại đồng ý) ----------
patch('site/public/qtt-analytics.js', [
 ("Chữ anh/chị gõ vào ô nhập luôn được che.</p>",
  "Chữ anh/chị gõ vào ô nhập luôn được che. <a href=\"/chinh-sach-du-lieu/#cookie\" style=\"color:inherit\">Tìm hiểu thêm</a></p>"),
 ("LS.set('qtt-clarity', y ? 'yes' : 'no'); d.remove(); if (y) clarity(id);",
  "LS.set('qtt-clarity', y ? 'yes' : 'no'); d.remove(); if (y) clarity(id); else dropClarity();"),
 ("  /* ---------- Microsoft Clarity (hỏi đồng ý) ---------- */\n",
  "  /* ---------- Microsoft Clarity (hỏi đồng ý) ---------- */\n"
  "  /* 03/11/2026: rút lại đồng ý – xoá cookie Clarity trên tên miền này; link \"Tùy chọn cookie\" (data-cookie-settings) hỏi lại từ đầu */\n"
  "  function dropClarity() { ['_clck', '_clsk', 'CLID', 'MUID', 'ANONCHK', 'SM'].forEach(n => { ['', '; domain=.' + location.hostname.replace(/^www\\./, '')].forEach(dm => { document.cookie = n + '=; Max-Age=0; path=/' + dm; }); }); }\n"
  "  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('[data-cookie-settings]'); if (!a) return; e.preventDefault(); LS.set('qtt-clarity', null); dropClarity(); location.reload(); });\n"),
])

# ---------- H. bản tin email: nói rõ có AI hỗ trợ ----------
patch('src/mailer.js', [
 ("Đây là bản tóm tắt để tham khảo, anh/chị nhớ đối chiếu văn bản gốc trước khi áp dụng.",
  "Đây là bản tóm tắt để tham khảo, được soạn với sự hỗ trợ của AI từ văn bản gốc và đã được anh Tuấn rà soát trước khi gửi; anh/chị nhớ đối chiếu văn bản gốc trước khi áp dụng."),
])

# ---------- I. Cẩm nang: nhãn AI + link chính sách ở ô đăng ký ----------
AI_NOTE = "'<p class=\"lu-ai\" style=\"font-size:13px;color:var(--mute,#6b6259);margin:0 0 10px;line-height:1.55\">ⓘ Phần tóm tắt và “Điểm cập nhật chính” được soạn với sự hỗ trợ của AI từ văn bản gốc, đã được Minh Tuấn rà soát trước khi đăng. Vui lòng đối chiếu văn bản gốc trước khi áp dụng.</p>'"
patch('cong-cu/cam-nang-thue-2026/app/index.html', [
 ("box.innerHTML = note + (L.length ?", "box.innerHTML = note + (L.length ? " + AI_NOTE + "+"),
 ("Tôi đồng ý để Quản trị tử tế lưu email này và gửi thông tin cập nhật pháp lý.",
  "Tôi đồng ý để Quản trị tử tế lưu email này và gửi thông tin cập nhật pháp lý (<a href=\"https://quantritute.com/chinh-sach-du-lieu/\" target=\"_blank\" rel=\"noopener\">Chính sách dữ liệu</a>)."),
])
import shutil; shutil.copyfile('cong-cu/cam-nang-thue-2026/app/index.html', 'site/public/tools/cam-nang-thue-2026/index.html')

# ---------- J. header bảo mật, routes, seo ----------
patch('site/public/_headers', [
 ("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n",
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
  "  Strict-Transport-Security: max-age=31536000\n"
  "  Content-Security-Policy: frame-ancestors 'self' https://quantritute-admin.pages.dev; upgrade-insecure-requests; object-src 'none'; base-uri 'self'\n"
  "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()\n"
  "  Cross-Origin-Resource-Policy: same-site\n"
  "\n/assets/fonts/*\n  Access-Control-Allow-Origin: *\n  Cross-Origin-Resource-Policy: cross-origin\n  Cache-Control: public, max-age=31536000, immutable\n"),
])
patch('admin/public/_headers', [
 ("  X-Frame-Options: DENY\n",
  "  X-Frame-Options: DENY\n  Strict-Transport-Security: max-age=31536000\n  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n  Cache-Control: no-store\n"),
])
patch('site/public/_routes.json', [('    "/huong-dan/*",\n', '    "/huong-dan/*",\n    "/chinh-sach-du-lieu/*",\n    "/dieu-khoan-su-dung/*",\n')])
patch('src/seo.js', [
 ("const STATIC_HTML = ['/huong-dan/', '/tools/'];", "const STATIC_HTML = ['/huong-dan/', '/tools/', '/chinh-sach-du-lieu', '/dieu-khoan-su-dung'];"),
 ("'/goc-cam-on', '/tach-ca-phe'].map(x => u(x)).join('')", "'/goc-cam-on', '/tach-ca-phe', '/chinh-sach-du-lieu/', '/dieu-khoan-su-dung/'].map(x => u(x)).join('')"),
])

# ---------- K. chân trang trang Hướng dẫn ----------
OLD_F = '<a href="/cong-cu">Xem Bộ công cụ</a></div></footer>'
NEW_F = '<a href="/cong-cu">Xem Bộ công cụ</a> · <a href="/chinh-sach-du-lieu/">Chính sách dữ liệu</a> · <a href="/dieu-khoan-su-dung/">Điều khoản</a></div></footer>'
import glob
for f in ['site/huong-dan-nguon/tao-trang.py'] + [x for x in glob.glob('site/public/huong-dan/**/*.html', recursive=True) if '_to_delete' not in x]:
    t = open(f, encoding='utf-8').read()
    if OLD_F in t and NEW_F not in t: open(f, 'w', encoding='utf-8').write(t.replace(OLD_F, NEW_F)); print('ĐỔI chân trang', f)
    elif NEW_F not in t: print('⚠ không thấy chân trang', f)

# ---------- M. đổi số phiên bản để trình duyệt tải file mới ----------
patch('site/public/index.html', [
 ('/qtt-analytics.js?v=20261021"', '/qtt-analytics.js?v=20261103"'), ('/app.js?v=20261026a"', '/app.js?v=20261103a"'),
 ('/dom.js?v=20261015p"', '/dom.js?v=20261103a"'), ('/qtt-sendlink.js?v=20261021"', '/qtt-sendlink.js?v=20261103"'),
])
print('XONG')
