# 03/11/2026 – Pháp lý mục 13: thay Google Fonts bằng phông tự lưu /assets/fonts/fonts.css
# Chạy lại được nhiều lần (file đã đổi thì bỏ qua).
import re, sys, glob, os
os.chdir(os.path.join(os.path.dirname(__file__), '..', '..'))
V = '?v=20261103'
REL = '/assets/fonts/fonts.css' + V
ABS = 'https://quantritute.com/assets/fonts/fonts.css' + V
TOOLS = ['cam-nang-thue-2026', 'ghep-doi-chieu', 'in-hoa-don-pdf', 'tai-to-khai', 'to-khai-gtgt', 'xu-ly-hoa-don', 'tao-van-ban-hang-loat']
files = [('site/public/index.html', REL), ('site/huong-dan-nguon/tao-trang.py', REL)] + [(f, REL) for f in glob.glob('site/public/huong-dan/**/*.html', recursive=True) if '_to_delete' not in f]
for t in TOOLS:
    for f in glob.glob(f'cong-cu/{t}/app/*.html') + glob.glob(f'cong-cu/{t}/app/*.css') + glob.glob(f'cong-cu/{t}/nguon/src/*.html') + glob.glob(f'site/public/tools/{t}/*.html') + glob.glob(f'site/public/tools/{t}/*.css'):
        files.append((f, ABS))
changed = 0
for f, href in files:
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"( crossorigin)?>\n?', '', s)
    s = re.sub(r'<noscript><link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*"></noscript>\n?', '', s)
    s = re.sub(r'<link rel="preload" as="style" href="https://fonts\.googleapis\.com/[^"]*" onload="[^"]*">', f'<link rel="stylesheet" href="{href}">', s)
    s = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">', f'<link rel="stylesheet" href="{href}">', s)
    s = re.sub(r"@import url\('https://fonts\.googleapis\.com/[^']*'\);", f"@import url('{href}');", s)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s); changed += 1
    left = re.findall(r'fonts\.(?:googleapis|gstatic)\.com', s)
    print(('ĐỔI ' if s != o else 'giữ ') + f + (f'  ⚠ còn {len(left)} chỗ Google Fonts' if left else ''))
print('Đã đổi', changed, 'file')
