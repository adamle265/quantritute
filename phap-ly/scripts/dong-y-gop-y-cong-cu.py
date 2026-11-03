# 03/11/2026 – Pháp lý mục 2: thêm ô đồng ý (fb-v1) vào form "Góp ý cho Đốm" của các công cụ đang chạy trên web.
# Sửa cả nguồn (nguon/src) và bản đã build (app/index.html), rồi chép app → site/public/tools/<slug>/.
import os, shutil
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..'))
LINK = '<a href="https://quantritute.com/chinh-sach-du-lieu/" target="_blank" rel="noopener">Chính sách dữ liệu</a>'
TXT = 'Tôi đồng ý để Quản trị tử tế lưu họ tên, số điện thoại và nội dung góp ý để phản hồi và cải thiện công cụ (' + LINK + ').'
def lab(i): return ('<label class="fb-consent" style="display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:400;line-height:1.5;margin:6px 0">'
                    '<input type="checkbox" id="' + i + '" style="width:auto;margin-top:3px;flex:none"><span>' + TXT + '</span></label>')
MSG = 'Anh/chị tích ô đồng ý để Đốm lưu thông tin và phản hồi giúp em nhé.'
P = {
 'ghep-doi-chieu': (['nguon/src/ui.html', 'app/index.html'], [
   ("""'<div class="fb-act"><button type="button" class="btn btn-secondary" data-action="close-modal">Đóng</button>""",
    "'" + lab('fbConsent') + """'+\n    '<div class="fb-act"><button type="button" class="btn btn-secondary" data-action="close-modal">Đóng</button>"""),
   ("  var head='['+fb.type+']'", "  if(!$('#fbConsent').checked){ fbMsg('" + MSG + "','err'); return; }\n  var head='['+fb.type+']'"),
   ("name:name, phone:phone, content:head", "name:name, phone:phone, consent:true, content:head")]),
 'in-hoa-don-pdf': (['nguon/src/ui.html', 'app/index.html'], [
   ("""'<p class="fb-msg" id="fbMsg" role="status"></p><div class="fb-act"><button type="button" class="btn" data-a="close">""",
    "'" + lab('fbConsent') + """<p class="fb-msg" id="fbMsg" role="status"></p><div class="fb-act"><button type="button" class="btn" data-a="close">"""),
   ("  var body={tool:TOOL_SLUG,name:name,phone:phone,content:", "  if(!$('#fbConsent').checked){ fbMsg('" + MSG + "','err'); return; }\n  var body={tool:TOOL_SLUG,name:name,phone:phone,consent:true,content:")]),
 'tai-to-khai': (['nguon/src/app.html', 'app/index.html'], [
   ("""    <p class="fb-msg" id="fbMsg" role="status"></p>\n    <div class="fb-act"><button type="button" class="btn" id="fbClose">""",
    "    " + lab('fbConsent') + """\n    <p class="fb-msg" id="fbMsg" role="status"></p>\n    <div class="fb-act"><button type="button" class="btn" id="fbClose">"""),
   ("    var body = { tool: 'tai-to-khai', name: name, phone: phone, ", "    if (!$('fbConsent').checked) { fbMsg('" + MSG + "', 'err'); return; }\n    var body = { tool: 'tai-to-khai', name: name, phone: phone, consent: true, ")]),
 'to-khai-gtgt': (['nguon/src/app.html', 'app/index.html'], [
   ("""      <p class="fb-msg" id="fb-msg" role="status"></p>""", "      " + lab('fb-consent') + """\n      <p class="fb-msg" id="fb-msg" role="status"></p>""")]),
 'to-khai-gtgt#js': (['nguon/src/app.js', 'app/index.html'], [
   ("    var body = { tool: 'to-khai-gtgt', name: name, phone: phone, ", "    if (!$('fb-consent').checked) { fbMsg('" + MSG + "', 'err'); return; }\n    var body = { tool: 'to-khai-gtgt', name: name, phone: phone, consent: true, ")]),
 'cam-nang-thue-2026': (['app/index.html'], [
   ('<p class="fb-note">Thông tin chỉ dùng để phản hồi góp ý của anh/chị.</p>', lab('fbConsent')),
   ("    if(!ONLINE){ msg.textContent='Mở cẩm nang trên web để gửi góp ý.';", "    if(!document.getElementById('fbConsent').checked){ msg.textContent='" + MSG + "'; msg.classList.add('bad'); return; }\n    if(!ONLINE){ msg.textContent='Mở cẩm nang trên web để gửi góp ý.';"),
   ("body:JSON.stringify({tool:TOOL,name:name,phone:phone,content:content,", "body:JSON.stringify({tool:TOOL,name:name,phone:phone,consent:true,content:content,")]),
}
for key, (files, reps) in P.items():
    slug = key.split('#')[0]
    for f in files:
        p = f'cong-cu/{slug}/{f}'; s = open(p, encoding='utf-8').read()
        done = ("consent: true" in s) if key.endswith('#js') else ('id="fbConsent"' in s or 'id="fb-consent"' in s)
        if done:
            print('đã có, bỏ qua', p); continue
        for a, b in reps:
            n = s.count(a)
            if n != 1: raise SystemExit(f'LỖI {p}: chuỗi xuất hiện {n} lần: {a[:70]}')
            s = s.replace(a, b)
        open(p, 'w', encoding='utf-8').write(s); print('ĐỔI', p)
for slug in ['ghep-doi-chieu', 'in-hoa-don-pdf', 'tai-to-khai', 'to-khai-gtgt', 'cam-nang-thue-2026']:
    shutil.copyfile(f'cong-cu/{slug}/app/index.html', f'site/public/tools/{slug}/index.html'); print('chép app →', f'site/public/tools/{slug}/')
