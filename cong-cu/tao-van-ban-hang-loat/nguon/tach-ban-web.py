"""v1.22 (21/10/2026) Tách bản WEB nhẹ cho công cụ Tạo văn bản hàng loạt.
Vì sao: file 1 trang ~4,5 MB làm điện thoại mở rất chậm (đo thực tế LCP p75 ~23,8 giây).
Cách làm: từ app/ban-day-du (bản 1 file chạy offline) tạo:
  app/index.html  – khung giao diện + CSS (hiện ngay), 3 file JS nạp sau bằng defer theo đúng thứ tự cũ
  app/web-libs.js, app/web-data.js, app/web-app.js – được trình duyệt lưu đệm, nén riêng
  app/tao-van-ban-hang-loat.html – bản đầy đủ 1 file để người dùng tải về dùng offline (giữ nguyên như cũ)
Chạy lại sau mỗi lần build:  python nguon/tach-ban-web.py   (tại thư mục công cụ)
Đầu vào: app/tao-van-ban-hang-loat.html nếu có, nếu chưa có thì lấy app/index.html (bản đầy đủ) rồi đổi tên.
"""
import os, re, sys
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(B, 'app')
full_p = os.path.join(A, 'tao-van-ban-hang-loat.html')
if not os.path.exists(full_p):
    os.replace(os.path.join(A, 'index.html'), full_p)
html = open(full_p, encoding='utf-8').read()
# 3 khối <script> cuối thân trang: thư viện, dữ liệu phông/mẫu, mã công cụ
blocks = [m for m in re.finditer(r'<script>(.*?)</script>', html, re.S)]
assert len(blocks) == 3, f'Cần đúng 3 khối <script> nội tuyến, thấy {len(blocks)}'
names = ['web-libs.js', 'web-data.js', 'web-app.js']
V = sys.argv[1] if len(sys.argv) > 1 else '20261021'
BASE = '/tools/' + os.path.basename(B) + '/'  # đường dẫn tuyệt đối, không phụ thuộc dấu / cuối link
out, last = [], 0
for m, n in zip(blocks, names):
    code = m.group(1)
    if n == 'web-app.js':
        old = "fetch(location.href, { cache: 'no-store' })"
        assert code.count(old) == 1, 'Không tìm thấy lệnh tải bản offline'
        code = code.replace(old, "fetch(new URL('tao-van-ban-hang-loat.html', location.href).href, { cache: 'no-store' })")
    open(os.path.join(A, n), 'w', encoding='utf-8').write(code)
    out.append(html[last:m.start()]); out.append(f'<script src="{BASE}{n}?v={V}" defer></script>'); last = m.end()
out.append(html[last:])
web = ''.join(out)
# Phông giao diện (base64 ~140 KB) tách ra file CSS nạp không chặn hiển thị
fm = re.search(r'<style>(@font-face.*?)</style>', web, re.S)
if fm:
    open(os.path.join(A, 'web-fonts.css'), 'w', encoding='utf-8').write(fm.group(1))
    href = f'{BASE}web-fonts.css?v={V}'
    web = web[:fm.start()] + f'<link rel="preload" as="style" href="{href}" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="{href}"></noscript>' + web[fm.end():]
    names.append('web-fonts.css')
open(os.path.join(A, 'index.html'), 'w', encoding='utf-8').write(web)
for n in ['index.html'] + names + ['tao-van-ban-hang-loat.html']:
    print(n, round(os.path.getsize(os.path.join(A, n)) / 1024), 'KB')
