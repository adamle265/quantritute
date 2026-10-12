# Sinh index.html HyperFrames từ data.json (cùng dữ liệu bản Remotion)
import json, re, sys, html
data = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
FPS = data["fps"]
CARD = dict(x=140, y=390, w=800, h=990, r=46)
SC = CARD["w"] / 1080
DEMO = {
    "tra-cuu": dict(img="demo/tra-cuu.png", a=180, b=1350, hl=dict(x=270, y=1408, w=225, h=70, at=0.12, until=0.75)),
    "dong-thoi-gian": dict(img="demo/dong-thoi-gian.png", a=1050, b=2150),
    "doi-chieu": dict(img="demo/doi-chieu.png", a=1100, b=2050),
    "tu-van-ban": dict(img="demo/tu-van-ban.png", img2="demo/tu-van-ban-tim.png", swap=0.4, a=300, b=1300),
    "xem-goc": dict(img="demo/tra-cuu.png", a=820, b=870, hl=dict(x=820, y=1232, w=195, h=72, at=0.15, until=1)),
    "home": dict(img="demo/home.png", a=0, b=330),
}

def chunks(t):
    t = t.replace("hai nghìn không trăm hai mươi sáu", "2026")
    parts = [p.strip() for p in re.findall(r"[^,.?!:]+[,.?!:]?", t) if p.strip()]
    o = []
    for p in parts:
        w = p.split(" ")
        if len(w) > 9:
            m = (len(w) + 1) // 2; o += [" ".join(w[:m]), " ".join(w[m:])]
        else:
            o.append(p)
    return o

E = html.escape
body, js = [], []
total = data["total"] / FPS
r3 = lambda v: round(v, 3)

for c in data["canh"]:
    s = c["from"] / FPS; d = c["frames"] / FPS; sid = "s" + c["id"]; L = c["loai"]
    inner = []
    if L == "mo":
        inner.append('<div class="hook"><div class="hook-t">Văn bản thuế<br><span>sửa liên tục…</span></div>'
                     '<div class="hook-s">Quy định anh/chị đang dùng<br>còn hiệu lực không?</div></div>')
        inner.append(f'<div class="dom big" id="{sid}-dom" style="left:290px;top:960px;width:500px;height:500px">'
                     f'<div class="glow"></div><img src="assets/dom/{c["dom"]}-toi.png"></div>')
    elif L == "ket":
        inner.append('<div class="ket"><img class="mark" src="assets/brand/logo-mark-nen-toi-1024.png">'
                     '<div class="ket-t">Link công cụ ở hồ sơ kênh</div><div class="ket-s">Quản trị lấy Con người làm gốc</div></div>')
        inner.append(f'<div class="dom" id="{sid}-dom" style="left:330px;top:1000px;width:420px;height:420px">'
                     f'<div class="glow"></div><img src="assets/dom/{c["dom"]}-toi.png"></div>')
    else:
        key = "home" if L == "gioi-thieu" else ("xem-goc" if L == "luu-y" else c["demo"])
        cfg = DEMO[key]
        title = ("⚠ " if L == "luu-y" else "") + c["chu"]
        top = 235 if L in ("gioi-thieu", "luu-y") else 290
        inner.append(f'<div class="title" id="{sid}-title" style="top:{top}px">{E(title).replace(chr(10), "<br>")}</div>')
        img2 = f'<img class="sw" id="{sid}-img2" src="assets/{cfg["img2"]}">' if "img2" in cfg else ""
        hl = ""
        if "hl" in cfg:
            h = cfg["hl"]
            hl = (f'<div class="hl" id="{sid}-hl" style="left:{h["x"]*SC-8:.1f}px;top:{h["y"]*SC-8:.1f}px;'
                  f'width:{h["w"]*SC+16:.1f}px;height:{h["h"]*SC+16:.1f}px"></div>')
        inner.append(f'<div class="card" id="{sid}-card"><div class="scroll" id="{sid}-scroll" style="transform:translateY({-cfg["a"]*SC:.1f}px)">'
                     f'<img src="assets/{cfg["img"]}">{img2}{hl}</div></div>')
        inner.append(f'<div class="dom" id="{sid}-dom" style="left:0;top:1250px;width:300px;height:300px">'
                     f'<div class="glow"></div><img src="assets/dom/{c["dom"]}-toi.png"></div>')
        # timeline cho card
        js.append(f'tl.fromTo("#{sid}-card",{{opacity:0,y:80}},{{opacity:1,y:0,duration:0.5,ease:"power3.out"}},{r3(s)});')
        js.append(f'tl.fromTo("#{sid}-title",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.45,ease:"power2.out"}},{r3(s+0.07)});')
        js.append(f'tl.fromTo("#{sid}-scroll",{{y:{-cfg["a"]*SC:.1f}}},{{y:{-cfg["b"]*SC:.1f},duration:{r3(d-0.47)},ease:"power2.inOut"}},{r3(s+0.27)});')
        if "img2" in cfg:
            js.append(f'tl.fromTo("#{sid}-img2",{{opacity:0}},{{opacity:1,duration:0.4}},{r3(s+0.27+(d-0.47)*cfg["swap"]-0.2)});')
        if "hl" in cfg:
            h = cfg["hl"]; t0 = s + 0.27 + (d - 0.47) * h["at"]
            js.append(f'tl.fromTo("#{sid}-hl",{{opacity:0,scale:1.25}},{{opacity:1,scale:1,duration:0.3,ease:"back.out(2)"}},{r3(t0)});')
            n = int((d - (t0 - s)) / 0.35)
            js.append(f'tl.to("#{sid}-hl",{{boxShadow:"0 0 0 12px rgba(242,184,102,0.15)",duration:0.35,repeat:{max(n-1,0)},yoyo:true,ease:"sine.inOut"}},{r3(t0+0.3)});')
            if h["until"] < 1:
                js.append(f'tl.to("#{sid}-hl",{{opacity:0,duration:0.2}},{r3(s+0.27+(d-0.47)*h["until"])});')
    # Đốm: vào cảnh + lơ lửng
    delay = 0.33 if L in ("mo", "ket", "gioi-thieu") else 0.27
    js.append(f'tl.fromTo("#{sid}-dom",{{opacity:0,y:60,scale:0.7}},{{opacity:1,y:0,scale:1,duration:0.6,ease:"back.out(1.6)"}},{r3(s+delay)});')
    n = int((d - delay - 0.6) / 1.5)
    if n > 0:
        js.append(f'tl.to("#{sid}-dom img",{{y:-14,rotation:3,duration:1.5,repeat:{n-1},yoyo:true,ease:"sine.inOut"}},{r3(s+delay+0.6)});')
    if L == "mo":
        js.append(f'tl.fromTo(".hook-t",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.6,ease:"power3.out"}},{r3(s+0.7)});')
        js.append(f'tl.fromTo(".hook-s",{{opacity:0}},{{opacity:1,duration:0.6}},{r3(s+1.2)});')
    if L == "ket":
        js.append(f'tl.fromTo(".ket",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.6,ease:"power3.out"}},{r3(s+0.13)});')
    # mờ dần cuối cảnh (trừ cảnh kết)
    if L != "ket":
        js.append(f'tl.to("#{sid}",{{opacity:0,duration:0.2}},{r3(s+d-0.2)});')
    body.append(f'<div class="clip scene" id="{sid}" data-start="{r3(s)}" data-duration="{r3(d)}" data-track-index="2">{"".join(inner)}</div>')
    # giọng
    body.append(f'<audio id="{sid}-vo" data-start="{r3(s+c["lead"])}" data-duration="{r3(c["audioSec"])}" data-track-index="5" data-volume="1" src="assets/giong/{c["id"]}.wav"></audio>')
    # phụ đề
    cs = chunks(c["loi"]); tot = sum(len(x) for x in cs); acc = 0
    side = L in ("mo", "ket")
    for i, x in enumerate(cs):
        a = s + c["lead"] + acc / tot * c["audioSec"]
        b = s + c["lead"] + (acc + len(x)) / tot * c["audioSec"]
        if i == 0: a = s
        if i == len(cs) - 1: b = s + d
        acc += len(x)
        body.append(f'<div class="clip sub {"wide" if side else ""}" data-start="{r3(a)}" data-duration="{r3(b-a)}" data-track-index="4"><span>{E(x)}</span></div>')

dust = "".join(f'<i class="dust" id="d{i}" style="left:{(i*137)%1080}px;top:{(i*263)%1920}px;width:{4+(i%3)*2}px;height:{4+(i%3)*2}px"></i>' for i in range(14))
for i in range(14):
    js.append(f'tl.to("#d{i}",{{y:-{int(total*30*(0.4+(i%3)*0.2))},duration:{r3(total)},ease:"none"}},0);')
    js.append(f'tl.to("#d{i}",{{opacity:0.15,duration:{1+(i%4)*0.5},repeat:{int(total/(1+(i%4)*0.5))-1},yoyo:true,ease:"sine.inOut"}},0);')
# đèn bật chập chờn
js.insert(0, 'tl.set(".lamp-on",{opacity:0},0);' + "".join(f'tl.set(".lamp-on",{{opacity:{v}}},{r3(i*0.1)});' for i, v in enumerate([0, 0, 0.6, 0.1, 0.9, 0.3, 1])))
js.append(f'tl.to(".glowbg",{{opacity:0.85,duration:2.6,repeat:{int(total/2.6)-1},yoyo:true,ease:"sine.inOut"}},0.7);')

page = open("/home/claude/hf/template.html", encoding="utf-8").read()
page = (page.replace("{{TOTAL}}", str(r3(total))).replace("{{BODY}}", "\n".join(body)).replace("{{DUST}}", dust)
        .replace("{{JS}}", "\n".join(js)).replace("{{LABEL}}", E(data["nhan_tren_hinh"])))
open(out, "w", encoding="utf-8").write(page)
print("ok", out, total)
