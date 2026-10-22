import re, sys, os, shutil
w0, w1 = float(sys.argv[1]), float(sys.argv[2]); name = sys.argv[3]
HOME = os.path.expanduser("~"); src = f"{HOME}/work/hf-body"; dst = f"{HOME}/work/{name}"
os.makedirs(dst, exist_ok=True)
if not os.path.exists(f"{dst}/assets"): os.symlink(f"{src}/assets", f"{dst}/assets")
html = open(f"{src}/index.html", encoding="utf-8").read()
R = lambda v: round(v, 3)
def getattr_(tag, a):
    m = re.search(a + r'="([^"]*)"', tag); return m.group(1) if m else None
def setattr_(tag, a, v):
    if re.search(a + r'="[^"]*"', tag): return re.sub(a + r'="[^"]*"', f'{a}="{v}"', tag, count=1)
    return tag[:-1].rstrip("/") + f' {a}="{v}">' if not tag.endswith("/>") else tag
def fix_tag(m):
    tag = m.group(1) if (hasattr(m,"groups") and m.groups()) else (m.group(0) if hasattr(m,"group") else m)
    if 'id="root"' in tag: return setattr_(tag, "data-duration", R(w1 - w0))
    s = getattr_(tag, "data-start"); d = getattr_(tag, "data-duration")
    if s is None or d is None: return tag
    s = float(s); e = s + float(d)
    if e <= w0 + 1e-6 or s >= w1 - 1e-6: return "<!--DROP-->" + tag
    ns = max(s, w0); ne = min(e, w1)
    tag = setattr_(tag, "data-start", R(ns - w0)); tag = setattr_(tag, "data-duration", R(ne - ns))
    if tag.startswith("<video"):
        ms = float(getattr_(tag, "data-media-start") or 0) + (ns - s)
        tag = setattr_(tag, "data-media-start", R(ms))
    return tag
out = []
for line in html.split("\n"):
    if "data-start" not in line or line.startswith("<script") or "gsap" in line[:40]:
        out.append(line); continue
    # videos
    def vfix(m):
        t = fix_tag(m)
        return t.group(0) if hasattr(t, "group") else t
    nl = re.sub(r'(<video[^>]*>)(</video>)', lambda m: ("" if fix_tag(m).startswith("<!--DROP-->") else fix_tag(m)+m.group(2)), line)
    if re.match(r'<div class="clip', nl) or nl.startswith('<video'):
        m = re.match(r'<[^>]*>', nl); t = fix_tag(m)
        if t.startswith("<!--DROP-->"): continue
        nl = t + nl[m.end():]
    out.append(nl)
html = "\n".join(out)
html = re.sub(r'(<div id="root"[^>]*>)', lambda m: fix_tag(m), html, count=1)

def shift_js(line):
    m = re.search(r',\s*(-?\d+(?:\.\d+)?)\);\s*$', line)
    if not line.startswith("tl.") or not m: return line
    if line.startswith("tl.set({}, {},"): return line[:m.start(1)] + str(R(w1 - w0)) + ");"
    pos = float(m.group(1)); md = re.search(r'duration:([\d.]+)', line); d = float(md.group(1)) if md else 0.0
    mr = re.search(r'repeat:(\d+)', line); tot = d * (int(mr.group(1)) + 1) if mr else d
    e = pos + tot
    if pos >= w1: return ""
    head = line[:m.start(1)]
    if "ease:\"none\"" in line and md:                     # zoom tuyến tính: nội suy
        ms = re.search(r'\{scale:([\d.]+)\},\{(?:immediateRender:false,)?scale:([\d.]+)', line); a0, a1 = float(ms.group(1)), float(ms.group(2))
        if e <= w0: ns, nd, b0, b1 = 0, 0, a1, a1
        else:
            cs = max(pos, w0); ce = min(e, w1)
            f = lambda t: a0 + (a1 - a0) * (t - pos) / d
            ns, nd, b0, b1 = cs - w0, ce - cs, f(cs), f(ce)
        l2 = re.sub(r'\{scale:[\d.]+\},\{(immediateRender:false,)?scale:[\d.]+', "{scale:%.4f},{immediateRender:false,scale:%.4f" % (b0, b1), head)
        l2 = re.sub(r'duration:[\d.]+', "duration:%s" % R(nd), l2, count=1)
        return l2 + str(R(ns)) + ");"
    if e <= w0 + 1e-9:
        if mr: return ""
        l2 = re.sub(r'duration:[\d.]+', "duration:0", head, count=1)
        return l2 + "0);"
    if pos < w0:
        print("!! tween vắt qua mốc cắt:", line[:90])
        return head + "0);"
    return head + str(R(pos - w0)) + ");"
html = html.replace('window.__timelines["main"] = tl;', f'const M=gsap.timeline({{paused:true}});M.add(tl.tweenFromTo({w0},{w1},{{ease:"none",duration:{R(w1-w0)}}}),0);M.set({{}},{{}},{R(w1-w0)});window.__timelines["main"] = M;').replace("tl.seek(0);", "M.seek(0);")
open(f"{dst}/index.html", "w", encoding="utf-8").write(html)
print("ok", name, w0, w1, html.count("<!--DROP-->"))
