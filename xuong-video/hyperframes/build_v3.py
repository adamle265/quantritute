# Dựng short v3 (HyperFrames): hook con dấu + demo quay thật + phụ đề nhấn từ khóa + SFX
import json, re, subprocess, html
E = html.escape
R3 = lambda v: round(v, 3)
KB = json.load(open("/home/claude/xv/tap/cn01-cam-nang-thue/kich-ban-v3.json", encoding="utf-8"))
META = json.load(open("/home/claude/xuong/clips/meta.json"))
CLIPS = "/home/claude/xuong/clips"
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
A = {s["id"]: dur(f"assets/giong/{s['id']}.wav") for s in KB["doan"]}
SEG = {s["id"]: s for s in KB["doan"]}

CARD = dict(x=130, y=380, w=820)
CARD["h"] = round(CARD["w"] * 1320 / 1080)
DEMO = [  # (id đoạn, clip, tiêu đề, Đốm, kiểu zoom)
    ("03", "s03-tim-kiem", "Gõ số văn bản cũ → biết ngay văn bản THAY THẾ", "dom-16-kinh-lup", "hover"),
    ("04", "s04-doc-dieu", "Đủ từng CHƯƠNG – từng ĐIỀU", "dom-13-xu-ly", None),
    ("05", "s05-hoi-dap", "Hỏi đáp TÌNH HUỐNG THẬT", "dom-02-chi-phai", "hold"),
    ("06", "s06-so-do", "Sơ đồ văn bản HƯỚNG DẪN", "dom-08-to-mo", "slow"),
    ("07", "s07-kiem-tra", "Học xong – TỰ KIỂM TRA", "dom-19-hoan-thanh", None),
    ("08", "s08-xem-goc", "⚠ Luôn xem VĂN BẢN GỐC", "dom-09-suy-nghi", "hold"),
]

def kw(text):  # tô vàng cụm chữ IN HOA
    toks = re.split(r"(\s+)", text); out = []
    for t in toks:
        core = re.sub(r"[^\wÀ-ỹ]", "", t)
        if len(core) > 1 and core == core.upper() and not core.isdigit():
            out.append(f'<b class="k">{E(t)}</b>')
        else: out.append(E(t))
    return "".join(out).replace('</b><b class="k">', "").replace('</b> <b class="k">', " ")

def chunks(t):
    parts = [p.strip() for p in re.findall(r"[^,.?!:]+[,.?!:]?", t) if p.strip()]
    o = []
    for p in parts:
        w = p.split()
        if len(w) > 10: m = (len(w) + 1) // 2; o += [" ".join(w[:m]), " ".join(w[m:])]
        else: o.append(p)
    return o

body, js, sfx = [], [], []
def audio(id_, start, src, d, vol=1.0, track=5):
    body.append(f'<audio id="{id_}" data-start="{R3(start)}" data-duration="{R3(d)}" data-track-index="{track}" data-volume="{vol}" src="{src}"></audio>')
def fx(name, t, vol=0.8):
    i = len(sfx); sfx.append(1); d = {"tap": .08, "key": .05, "thud": .6, "whoosh": .45, "pop": .18, "ding": .9}[name]
    audio(f"fx{i}", t, f"assets/sfx/{name}.wav", d, vol, 7)
def subs(seg_id, vo_start, scene_end, wide=False):
    s = SEG[seg_id]; cs = chunks(s["phu_de"]); tot = sum(len(x) for x in cs); acc = 0
    for i, x in enumerate(cs):
        a = vo_start + acc / tot * A[seg_id]; b = vo_start + (acc + len(x)) / tot * A[seg_id]; acc += len(x)
        if i == len(cs) - 1: b = scene_end
        body.append(f'<div class="clip sub{" wide" if wide else ""}" data-start="{R3(a)}" data-duration="{R3(b - a)}" data-track-index="4"><span>{kw(x)}</span></div>')
def dom(sid, pose, x, y, size, t_in, d_scene):
    body.append(f'<div class="dom" id="{sid}-dom" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px"><div class="glow"></div><img src="assets/dom/{pose}-toi.png"></div>')
    return [f'tl.fromTo("#{sid}-dom",{{opacity:0,y:50,scale:0.6}},{{opacity:1,y:0,scale:1,duration:0.45,ease:"back.out(2)"}},{R3(t_in)});',
            f'tl.to("#{sid}-dom img",{{y:-12,rotation:4,duration:0.7,repeat:{max(int((d_scene - 0.5) / 0.7) - 1, 0)},yoyo:true,ease:"sine.inOut"}},{R3(t_in + 0.45)});']

t = 0.0
# ---------- CẢNH 1: HOOK ----------
s1 = t; v1 = s1 + 0.35; stamp = v1 + A["01a"] + 0.05; e1 = stamp + 0.05 + A["01b"] + 0.4
scene = [f'<div class="clip scene" id="c1" data-start="{R3(s1)}" data-duration="{R3(e1 - s1)}" data-track-index="2">',
         '<div class="paper" id="paper"><div class="p-org">CHÍNH PHỦ</div><div class="p-no">NGHỊ ĐỊNH SỐ 123/2020/NĐ-CP</div>'
         '<div class="p-tt">Quy định về hóa đơn, chứng từ</div>' + "".join(f'<i style="width:{w}%"></i>' for w in [92, 86, 95, 70, 88, 60]) +
         '<div class="stamp" id="stamp">HẾT HIỆU LỰC</div></div>',
         '<div class="hook"><span id="h1">Nghị định 123</span> <span id="h2">về hóa đơn…</span></div></div>']
body += scene
js += [f'tl.fromTo("#paper",{{opacity:0,y:80,rotation:-3}},{{opacity:1,y:0,rotation:-2,duration:0.5,ease:"power3.out"}},{R3(s1 + 0.15)});',
       f'tl.fromTo("#h1",{{opacity:0,scale:1.6}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2)"}},{R3(v1)});',
       f'tl.fromTo("#h2",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.3}},{R3(v1 + A["01a"] * 0.55)});',
       f'tl.fromTo("#stamp",{{opacity:0,scale:2.6,rotation:-24}},{{opacity:1,scale:1,rotation:-12,duration:0.22,ease:"power4.in"}},{R3(stamp - 0.22)});',
       f'tl.to("#shake",{{x:14,duration:0.04,repeat:7,yoyo:true,ease:"none"}},{R3(stamp)});',
       f'tl.set("#shake",{{x:0}},{R3(stamp + 0.33)});',
       f'tl.to("#c1",{{opacity:0,duration:0.2}},{R3(e1 - 0.2)});']
audio("vo01a", v1, "assets/giong/01a.wav", A["01a"]); audio("vo01b", stamp + 0.05, "assets/giong/01b.wav", A["01b"])
fx("thud", stamp - 0.02, 1.0); fx("whoosh", s1 + 0.1, 0.5)
t = e1
# ---------- CẢNH 2: ĐỐM LO LẮNG ----------
s2 = t; v2 = s2 + 0.15; e2 = v2 + A["02"] + 0.45
body.append(f'<div class="clip scene" id="c2" data-start="{R3(s2)}" data-duration="{R3(e2 - s2)}" data-track-index="2"><div class="q2" id="q2">Anh chị <b class="k">cập nhật kịp</b> chưa?</div>')
js += dom("c2", "dom-11-lo-lang", 290, 820, 500, s2, e2 - s2)
body.append('</div>')
js += [f'tl.fromTo("#q2",{{opacity:0,scale:0.7}},{{opacity:1,scale:1,duration:0.35,ease:"back.out(2.2)"}},{R3(s2 + 0.05)});',
       f'tl.to("#c2",{{opacity:0,duration:0.15}},{R3(e2 - 0.15)});']
audio("vo02", v2, "assets/giong/02.wav", A["02"]); fx("pop", s2 + 0.05, 0.6)
t = e2
# ---------- CẢNH DEMO ----------
for sid_, clip, title, pose, zoom in DEMO:
    m = META[clip]; cd = m["dur"]; s = t; vs = s + 0.3
    D = max(A[sid_] + 0.75, cd / 1.7)
    f = max(cd / D, 1.0)
    out = f"assets/clips/{clip}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{CLIPS}/{clip}.mp4", "-vf",
                    f"setpts=PTS/{f:.4f},tpad=stop_mode=clone:stop_duration={D:.3f},trim=duration={D:.3f},fps=30,format=yuv420p",
                    "-an", "-c:v", "libx264", "-crf", "16", "-preset", "fast", out], check=True)
    sid = f"c{sid_}"
    body.append(f'<div class="clip scene" id="{sid}" data-start="{R3(s)}" data-duration="{R3(D)}" data-track-index="2">')
    body.append(f'<div class="title" id="{sid}-t">{kw(title)}</div>')
    body.append(f'<div class="card" id="{sid}-card"><div class="zoom" id="{sid}-z">'
                f'<video id="{sid}-v" class="clip" muted playsinline data-start="{R3(s)}" data-duration="{R3(D)}" data-track-index="3" src="{out}"></video></div></div>')
    js += dom(sid, pose, 0, 1235, 290, s + 0.25, D)
    body.append('</div>')
    js += [f'tl.fromTo("#{sid}-card",{{opacity:0,y:60,scale:0.96}},{{opacity:1,y:0,scale:1,duration:0.35,ease:"power3.out"}},{R3(s)});',
           f'tl.fromTo("#{sid}-t",{{opacity:0,y:-20}},{{opacity:1,y:0,duration:0.3}},{R3(s + 0.08)});',
           f'tl.to("#{sid}",{{opacity:0,duration:0.15}},{R3(s + D - 0.15)});']
    if zoom:
        zx, zy = (m.get("zoom") or [0.5, 0.5]); ox, oy = f"{zx*100:.1f}%", f"{zy*100:.1f}%"
        js.append(f'tl.set("#{sid}-z",{{transformOrigin:"{ox} {oy}"}},{R3(s)});')
        if zoom == "hover":
            z0 = s + max(m["zt"] - 1.3, 0) / f; z1 = s + (m["zt"] + 0.2) / f
            js += [f'tl.to("#{sid}-z",{{scale:1.45,duration:0.4,ease:"power2.out"}},{R3(z0)});', f'tl.to("#{sid}-z",{{scale:1,duration:0.35,ease:"power2.inOut"}},{R3(z1)});']
        elif zoom == "hold":
            z0 = s + max(m["zt"] - 0.6, 0.2) / f
            js.append(f'tl.to("#{sid}-z",{{scale:1.4,duration:0.45,ease:"power2.out"}},{R3(z0)});')
        elif zoom == "slow":
            js.append(f'tl.fromTo("#{sid}-z",{{scale:1}},{{scale:1.18,duration:{R3(D)},ease:"none"}},{R3(s)});')
    for tp in m.get("taps", []): fx("tap", s + tp / f, 0.7)
    for a, b in m.get("types", []):
        n = 8; [fx("key", s + (a + (b - a) * k / n) / f, 0.5) for k in range(n)]
    if sid_ == "07": fx("ding", s + (m["taps"][0] + 0.15) / f, 0.45)
    fx("whoosh", s - 0.05, 0.35)
    audio(f"vo{sid_}", vs, f"assets/giong/{sid_}.wav", A[sid_]); subs(sid_, vs, s + D)
    t = s + D
# ---------- CẢNH KẾT ----------
s9 = t; v9 = s9 + 0.25; e9 = v9 + A["09"] + 1.6
body.append(f'<div class="clip scene" id="c9" data-start="{R3(s9)}" data-duration="{R3(e9 - s9)}" data-track-index="2">'
            '<div class="ket" id="ket"><img class="mark" src="assets/brand/logo-mark-nen-toi-1024.png">'
            '<div class="free" id="free">MIỄN PHÍ</div><div class="ket-t">Mở trình duyệt là dùng</div>'
            '<div class="ket-s">Link ở hồ sơ kênh</div></div>')
js += dom("c9", "dom-23-tam-biet", 650, 1030, 330, s9 + 0.3, e9 - s9)
body.append('</div>')
js += [f'tl.fromTo("#ket",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.4,ease:"power3.out"}},{R3(s9 + 0.05)});',
       f'tl.fromTo("#free",{{scale:0.4,opacity:0}},{{scale:1,opacity:1,duration:0.35,ease:"back.out(3)"}},{R3(v9)});']
audio("vo09", v9, "assets/giong/09.wav", A["09"]); subs("09", v9, e9, wide=True); fx("pop", v9, 0.6)
TOTAL = e9
audio("music", 0, "assets/sfx/nhac-nhanh.wav", TOTAL, 0.16, 6)
# đèn chập chờn + bụi
js.insert(0, 'tl.set(".lamp-on",{opacity:0},0);' + "".join(f'tl.set(".lamp-on",{{opacity:{v}}},{R3(i * 0.05)});' for i, v in enumerate([0, .7, .1, 1])))
dust = "".join(f'<i class="dust" id="d{i}" style="left:{(i*137)%1080}px;top:{(i*263)%1920}px;width:{4+(i%3)*2}px;height:{4+(i%3)*2}px"></i>' for i in range(12))
for i in range(12): js.append(f'tl.to("#d{i}",{{y:-{int(TOTAL*40*(0.4+(i%3)*0.2))},duration:{R3(TOTAL)},ease:"none"}},0);')

page = open("../template_v3.html", encoding="utf-8").read()
page = (page.replace("{{TOTAL}}", str(R3(TOTAL))).replace("{{BODY}}", "\n".join(body)).replace("{{DUST}}", dust)
        .replace("{{JS}}", "\n".join(js)).replace("{{LABEL}}", E(KB["nhan_tren_hinh"]))
        .replace("{{CARD}}", f'left:{CARD["x"]}px;top:{CARD["y"]}px;width:{CARD["w"]}px;height:{CARD["h"]}px'))
open("index.html", "w", encoding="utf-8").write(page)
print("TOTAL", R3(TOTAL), "s")
