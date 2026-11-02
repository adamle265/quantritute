import base64,re
U='/mnt/user-data/uploads/Dự án 5.0/quantritute/site/public/assets/'
IMG={'LOGO_SANG':'logo/dom-logo-sang.webp','LOGO_TOI':'logo/dom-logo-toi.webp','DOM_CHAO_SANG':'dom/dom-01-chao-sang.webp','DOM_CHAO_TOI':'dom/dom-01-chao-toi.webp','DOM_TL_SANG':'dom/dom-14-tai-lieu-sang.webp','DOM_TL_TOI':'dom/dom-14-tai-lieu-toi.webp'}
B64={k:'data:image/webp;base64,'+base64.b64encode(open(U+v,'rb').read()).decode() for k,v in IMG.items()}
css=open('core.css',encoding='utf-8').read(); js=open('core.js',encoding='utf-8').read()
def header(tag): return f'''<header class="top"><div class="wrap">
  <a class="brand" href="/cong-cu"><img alt="" src="{{{{LOGO_SANG}}}}" data-light="{{{{LOGO_SANG}}}}" data-dark="{{{{LOGO_TOI}}}}"><b>Quản trị tử tế</b><span>/ Bộ công cụ Mở &amp; Vận hành Spa</span></a>
  <div class="sp"></div>{('<span class="opt-tag">'+tag+'</span>') if tag else ''}
  <button class="icon-btn" type="button" data-act="theme" aria-label="Đổi giao diện sáng/tối"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/></svg></button>
</div></header>
<div class="demo-bar" id="demoBar" hidden><div class="wrap"><span><b>Đang xem số liệu giả định.</b> Đây là cơ sở mẫu để anh/chị hình dung, không phải số liệu của anh/chị.</span><button type="button" data-act="demooff">Xóa số liệu giả định</button></div></div>'''
FOOT='<div class="scrim" id="scrim" hidden></div>\n<div class="toast" id="toast" hidden></div>'
for f,tag,out in [('b','','index'),('m1','','chon-mo-hinh'),('m2v2','','cham-diem-mat-bang'),('m2x','','mat-bang-phuong-an-x'),('m2y','','mat-bang-phuong-an-y')]:
    s=open(f+'.html',encoding='utf-8').read()
    title=re.search(r'<!--TITLE:(.*?)-->',s).group(1); s=re.sub(r'<!--TITLE:.*?-->\n','',s)
    s=s.replace('{{M2CORE}}',open('m2core.js',encoding='utf-8').read())
    s=s.replace('{{HEADER}}',header(tag)).replace('{{FOOTER}}',FOOT)
    s=s.replace('<style>','<style>\n'+css+'\n',1).replace('<script>','<script>\n'+js+'\n',1)
    s=f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">\n'+s
    for k,v in B64.items(): s=s.replace('{{%s}}'%k,v)
    assert '{{' not in s, f
    open(f'art-{out}.html','w',encoding='utf-8').write(s)
    web='<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>[hidden]{display:none!important}body{margin:0}img{max-width:100%}</style>\n</head>\n<body>\n'+s+'\n</body>\n</html>\n'
    open(f'/mnt/user-data/outputs/spa/app-{out}.html','w',encoding='utf-8').write(web)
print('built')
