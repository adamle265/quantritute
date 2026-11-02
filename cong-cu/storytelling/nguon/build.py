#!/usr/bin/env python3
# python3 build.py  ->  build/index.html (1 file, chạy trên trình duyệt)
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
ST = ROOT  # bản trong cong-cu/storytelling/nguon: lessons/, data/, check.py nằm cùng thư mục
VER = '1.0.0'
VERDATE = '02/11/2026'

r = subprocess.run([sys.executable, os.path.join(ST, 'check.py')] + [os.path.join(ST, 'lessons', f) for f in sorted(os.listdir(os.path.join(ST, 'lessons'))) if f.endswith('.json')], capture_output=True, text=True)
print(r.stdout.strip().splitlines()[0])
if r.returncode: print(r.stdout); sys.exit(1)

lessons = []
for f in sorted(os.listdir(os.path.join(ST, 'lessons'))):
    if f.endswith('.json'):
        d = json.load(open(os.path.join(ST, 'lessons', f), encoding='utf-8'))
        lessons += d if isinstance(d, list) else [d]
lessons.sort(key=lambda L: (L['day'], L.get('branch') or ''))
ids = [L['id'] for L in lessons]
assert len(ids) == len(set(ids)) == 57, (len(ids), len(set(ids)))

# Sửa nhỏ sau rà soát
for L in lessons:
    p = L.get('practice') or {}
    p['steps'] = [s.replace(', đánh dấu sao vào ô đó', ', chép câu đó vào ô cuối cùng bên dưới') for s in p.get('steps', [])]

HIDE = {'PH-023', 'PH-045', 'PH-047'}  # video giới thiệu sách/podcast, chuyện có yếu tố bệnh tật
videos = [v for v in json.load(open(os.path.join(ST, 'data', 'videos-vi.json'), encoding='utf-8')) if v['ma'] not in HIDE]
used = {m for L in lessons for m in L.get('videos', [])}
assert not (used & HIDE), used & HIDE
pt = json.load(open(os.path.join(ST, 'data', 'phongtap.json'), encoding='utf-8'))
pt['impromptu']['C'] = [x.replace('Nếu cắt 20% ngân sách', 'Nếu phải cắt bớt ngân sách') for x in pt['impromptu']['C']]

def js(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
src = os.path.join(ROOT, 'src')
html = open(os.path.join(src, 'app.html'), encoding='utf-8').read()
rep = {'{{CSS}}': open(os.path.join(src, 'app.css'), encoding='utf-8').read(),
       '{{JS}}': open(os.path.join(src, 'app.js'), encoding='utf-8').read(),
       '{{LESSONS}}': js(lessons), '{{VIDEOS}}': js(videos), '{{PT}}': js(pt),
       '{{DOM}}': open(os.path.join(ROOT, 'dom64.txt'), encoding='utf-8').read().strip(),
       '{{VER}}': VER, '{{VERDATE}}': VERDATE}
for k, v in rep.items(): html = html.replace(k, v)
left = re.findall(r'\{\{[A-Z]+\}\}', html)
assert not left, left

open(os.path.join(os.path.dirname(ROOT), 'app', 'index.html'), 'w', encoding='utf-8').write(html)
print('build/index.html', round(len(html.encode()) / 1024), 'KB, bản', VER, '·', len(lessons), 'bài ·', len(videos), 'video')
