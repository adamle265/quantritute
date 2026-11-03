import re, os, shutil, sys
FILES = '''cong-cu/cam-nang-thue-2026/app/index.html
cong-cu/ghep-doi-chieu/app/index.html
cong-cu/ghep-doi-chieu/nguon/src/ui.html
cong-cu/in-hoa-don-pdf/app/index.html
cong-cu/in-hoa-don-pdf/nguon/src/ui.html
cong-cu/quan-ly-nhan-su/app/index.html
cong-cu/quan-ly-nhan-su/nguon/src/pages.js
cong-cu/storytelling/app/index.html
cong-cu/storytelling/nguon/src/app.js
cong-cu/tai-to-khai/app/index.html
cong-cu/tai-to-khai/nguon/src/app.html
cong-cu/to-khai-gtgt/app/index.html
cong-cu/to-khai-gtgt/nguon/src/app.html
cong-cu/to-khai-gtgt/nguon/src/app.js
site/public/tools/cam-nang-thue-2026/index.html
site/public/tools/ghep-doi-chieu/index.html
site/public/tools/in-hoa-don-pdf/index.html
site/public/tools/tai-to-khai/index.html
site/public/tools/to-khai-gtgt/index.html'''.split()
BK = '_tam/email-gopy-20261103/ban-cu'
OLDC = 'lưu họ tên, số điện thoại và nội dung góp ý để phản hồi và cải thiện công cụ'
NEWC = 'lưu họ tên, số điện thoại, email và nội dung góp ý để phản hồi, cải thiện công cụ và gửi email báo khi công cụ có bản cập nhật (bỏ nhận bất cứ lúc nào bằng link trong thư)'
dry = '--dry' in sys.argv
for f in FILES:
    s = open(f, encoding='utf-8').read(); o = s; log = []
    if 'fbEmail' in s or 'id="fb-email"' in s or 'id="fbE"' in s: print('SKIP (đã có)', f); continue
    m = re.search(r'id=\\?"(fbPhone|fb-phone|fbP)\\?"', s)
    if m:
        pid = m.group(1); eid = {'fbPhone': 'fbEmail', 'fb-phone': 'fb-email', 'fbP': 'fbE'}[pid]
        i = m.start()
        if pid == 'fbP':  # <div class="field"><label for="fbP">…</label><input … id="fbP" …></div>
            a = s.rfind('<div class="field">', 0, i); b = s.find('</div>', i) + 6
        else:
            a = s.rfind('<label', 0, i); b = s.find('</label>', i) + 8
        el = s[a:b]
        em = (el.replace('Số điện thoại (không bắt buộc)', 'Email (không bắt buộc – để Đốm báo khi công cụ có bản mới)')
                .replace('(không bắt buộc)', '(không bắt buộc – để Đốm báo khi công cụ có bản mới)').replace('Số điện thoại', 'Email')
                .replace(pid, eid).replace('type="tel"', 'type="email"').replace('autocomplete="tel"', 'autocomplete="email"').replace('maxlength="20"', 'maxlength="160"'))
        if 'type="email"' not in em: em = em.replace('id="%s"' % eid, 'id="%s" type="email"' % eid)
        if 'autocomplete="email"' not in em: em = em.replace('id="%s"' % eid, 'id="%s" autocomplete="email"' % eid)
        rest = s[b:]; ws = len(rest) - len(rest.lstrip())
        if rest.lstrip().startswith('</div>'):
            pos = b + ws + 6; ins = em.replace('<label', '<label style="display:block;margin-top:8px"', 1) if pid != 'fbP' else em.replace('<div class="field">', '<div class="field" style="margin-top:8px">', 1)
        else:
            pos = b; ins = s[b:b+ws] + em if ws else em
        s = s[:pos] + ins + s[pos:]; log.append('o email')
    # JS: thêm email vào thân gửi
    get = "((document.getElementById('%s')||{}).value||'').trim()"
    n = 0
    def rp(mm):
        global n; n += 1
        return mm.group(1) + mm.group(2) + ', email: ' + get % EID
    EID = {'fbPhone': 'fbEmail', 'fb-phone': 'fb-email', 'fbP': 'fbE'}.get(m.group(1) if m else '', None)
    if EID is None:  # file JS không có ô (to-khai-gtgt app.js) – dùng id theo bộ
        EID = 'fb-email' if 'to-khai-gtgt' in f else 'fbEmail'
    s2 = re.sub(r"(tool\s*:[^{};]{0,80}?phone\s*:\s*)(phone|ph)\b(?!\s*,\s*email)", rp, s)
    if n: s = s2; log.append('js x%d' % n)
    if OLDC in s: s = s.replace(OLDC, NEWC); log.append('dong y')
    if s != o:
        if not dry:
            d = os.path.join(BK, os.path.dirname(f)); os.makedirs(d, exist_ok=True); shutil.copy2(f, os.path.join(d, os.path.basename(f)))
            open(f, 'w', encoding='utf-8').write(s)
    print(f, '|', ', '.join(log) or 'KHONG DOI')
