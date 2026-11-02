#!/usr/bin/env python3
"""Kiểm tra file bài học JSON theo BRIEF.md.  python3 check.py file.json [...]"""
import json, sys, re
VIDS = {v['ma'] for v in json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'data','videos-vi.json'), encoding='utf-8'))}
BANNED = ['sự cố', 'Sự cố']
CARD_TYPES = {'story', 'idea', 'how', 'compare', 'takeaway', 'recap'}

def err(errs, lid, msg): errs.append(f'[{lid}] {msg}')

def walk_text(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from walk_text(v)
    elif isinstance(o, list):
        for v in o: yield from walk_text(v)

def check(L, errs):
    lid = L.get('id', '?')
    for k in ['id', 'day', 'stage', 'branch', 'milestone', 'title', 'hook', 'cards', 'practice', 'review', 'done', 'videos']:
        if k not in L: err(errs, lid, f'thiếu khóa {k}')
    d = L.get('day'); b = L.get('branch')
    exp = f"d{d:02d}" + (b or '') if isinstance(d, int) else None
    if exp and lid != exp: err(errs, lid, f'id phải là {exp}')
    if isinstance(d, int):
        st = 1 if d <= 7 else 2 if d <= 14 else 3 if d <= 21 else 4 if d <= 28 else 5
        if L.get('stage') != st: err(errs, lid, f'stage phải là {st}')
        if d <= 14 or d == 29:
            if b is not None: err(errs, lid, 'bài chung phải branch null')
        elif b not in ('A', 'B', 'C'): err(errs, lid, 'bài nhánh phải có branch A/B/C')
        if (d in (7, 14, 21, 28)) != bool(L.get('milestone')): err(errs, lid, 'milestone sai')
    cards = L.get('cards', [])
    if not cards: err(errs, lid, 'không có thẻ')
    for c in cards:
        if c.get('type') not in CARD_TYPES: err(errs, lid, f"thẻ lạ {c.get('type')}")
        if c.get('type') == 'compare':
            rows = c.get('rows', [])
            if not c.get('weakLabel') or not c.get('strongLabel'): err(errs, lid, 'compare thiếu weakLabel/strongLabel')
            if isinstance(d, int) and d <= 14:
                if sorted(r.get('branch') or '' for r in rows) != ['A', 'B', 'C']: err(errs, lid, 'compare chặng 1–2 cần 3 dòng A,B,C')
            else:
                if len(rows) < 2 or any(r.get('branch') for r in rows): err(errs, lid, 'compare bài nhánh: ≥2 dòng, branch null')
            for r in rows:
                if not r.get('weak') or not r.get('strong'): err(errs, lid, 'compare dòng thiếu weak/strong')
        elif not c.get('body'): err(errs, lid, f"thẻ {c.get('type')} thiếu body")
    if not L.get('milestone'):
        types = [c.get('type') for c in cards]
        if types != ['story', 'idea', 'how', 'compare', 'takeaway']: err(errs, lid, f'thứ tự thẻ phải story,idea,how,compare,takeaway (đang {types})')
    q = L.get('quiz')
    if q is None:
        if not L.get('milestone'): err(errs, lid, 'thiếu quiz')
    elif q.get('kind') == 'choice':
        opts = q.get('options', [])
        if not (2 <= len(opts) <= 4): err(errs, lid, 'quiz 2–4 lựa chọn')
        if sum(1 for o in opts if o.get('correct')) != 1: err(errs, lid, 'quiz phải đúng 1 lựa chọn correct')
        if any(not o.get('feedback') for o in opts): err(errs, lid, 'quiz thiếu feedback')
    elif q.get('kind') == 'order':
        if len(q.get('items', [])) < 3 or not q.get('feedback'): err(errs, lid, 'quiz order cần ≥3 items + feedback')
    else: err(errs, lid, 'quiz.kind phải choice/order')
    p = L.get('practice', {})
    if not p.get('steps'): err(errs, lid, 'practice thiếu steps')
    if p.get('saveAs') not in (None, 'seeds', 'storyNote'): err(errs, lid, 'saveAs sai')
    if p.get('widget') not in (None, 'impromptu', 'flbw', 'highlow', 'shelf', 'compare7'): err(errs, lid, 'widget sai')
    if p.get('saveAs') == 'storyNote' and not p.get('pickStory'): err(errs, lid, 'storyNote cần pickStory true')
    if p.get('saveAs') and not p.get('fields') and not p.get('widget'): err(errs, lid, 'saveAs cần fields')
    n = 5 if L.get('milestone') else 3
    if len(L.get('review', [])) < n: err(errs, lid, f'review cần ≥{n} tiêu chí')
    for v in L.get('videos', []):
        if v not in VIDS: err(errs, lid, f'video {v} không có trong danh sách')
    for t in walk_text(L):
        for w in BANNED:
            if w in t: err(errs, lid, f'có từ cấm "{w}": …{t[max(0,t.find(w)-30):t.find(w)+30]}…')
        if re.search(r'\d+\s?%', t) and 'giả định' not in json.dumps(L, ensure_ascii=False): err(errs, lid, f'có số % – kiểm lại: {t[:60]}')

errs = []
n = 0
for f in sys.argv[1:]:
    data = json.load(open(f, encoding='utf-8'))
    if isinstance(data, dict): data = [data]
    for L in data: check(L, errs); n += 1
print(f'{n} bài, {len(errs)} lỗi')
for e in errs: print(' -', e)
sys.exit(1 if errs else 0)
