import json, re, html, subprocess, os, random
E = html.escape; R = lambda v: round(v, 3)
HOME = os.path.expanduser("~"); W = f"{HOME}/work/hf-body"; PD = f"{HOME}/mnt/quantritute/xuong-video/tap/v04-chon-dung-cong-cu"
os.chdir(W)
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
A = {k: dur(f"assets/a/{k}.wav") for k in ["E1","E2"]}
RM = json.load(open(f"{HOME}/work/b4/rec/marks.json"))
body = []; js = []; mix = []
INTRO = 5.0; X = 0.5; T0 = INTRO - X; G = lambda t: T0 + t
ANH_END = 114.45                    # cắt trước lúc anh giơ tay (~115,8)
D0 = G(114.15)                      # cảnh Đốm
S5 = G(117.3); TOTAL = S5 + 7.0
def tw(s): js.append(s)
# ---------- MỞ ĐẦU ----------
body.append(f'<video id="intro" class="clip full" muted playsinline data-start="0" data-duration="{INTRO}" data-track-index="1" src="assets/v/mo-dau.mp4"></video>')
mix += [("sfx/click.wav",1.05,0.6),("sfx/sparkle.wav",1.2,0.4)]
# ---------- ANH ----------
body.append(f'<div class="scene" id="talk" style="opacity:0"><div id="zx"><div class="zw" id="zw"><video id="talkv" class="clip full" muted playsinline data-start="{T0}" data-duration="{R(ANH_END+0.3)}" data-track-index="2" src="assets/v/talk.mp4"></video></div></div><div class="vig2" id="vig2"></div></div>')
tw(f'tl.fromTo("#talk",{{opacity:0}},{{opacity:1,duration:{X}}},{T0});'); tw('tl.set("#zw",{transformOrigin:"50% 32%"},0);'); tw('tl.set("#vig2",{opacity:0},0);')
mix.append(("../b4/talk_cut.wav",T0,1.0))
SEG = [(0,6.9,1.00,1.04),(6.9,19.6,1.10,1.06),(19.6,30.2,1.00,1.05),(30.2,39.7,1.10,1.05),(39.7,56.2,1.00,1.07),(56.2,65.5,1.10,1.05),(94.5,108.9,1.00,1.06),(108.9,ANH_END+0.3,1.06,1.16)]
for i,(a,b,s0,s1) in enumerate(SEG):
    sa = a+(0.25 if i else 0); sb = b-(0.25 if i < len(SEG)-1 else 0)
    tw(f'tl.fromTo("#zw",{{scale:{s0}}},{{scale:{s1},duration:{R(sb-sa)},ease:"none"}},{R(G(sa))});')
    if i: tw(f'tl.fromTo("#zw",{{scale:{SEG[i-1][3]}}},{{scale:{s0},duration:0.5,ease:"power2.inOut"}},{R(G(a-0.25))});')
# ---------- PHỤ ĐỀ ----------
words = []
for s in json.load(open(f"{PD}/phien-am/Video 4 161026.json")):
    for w in s["words"]: words.append([w["w"],w["s"],w["e"]])
def fixwords(ws):
    o = []; i = 0
    while i < len(ws):
        w = ws[i][0]; lw = w.lower().strip(".,!?")
        nx = ws[i+1][0].lower().strip(".,!?") if i+1 < len(ws) else ""
        pv = ws[i-1][0].lower().strip(".,!?") if i else ""
        n2 = ws[i+2][0].lower() if i+2 < len(ws) else ""
        if lw == "live" and nx.startswith("-wide"): o += [["loay",ws[i][1],ws[i][2]],["hoay",ws[i+1][1],ws[i+1][2]]]; i += 2; continue
        if lw == "vai" and nx == "coding": o += [["vibe",ws[i][1],ws[i][2]],["code"+ws[i+1][0][6:],ws[i+1][1],ws[i+1][2]]]; i += 2; continue
        if lw == "tuần" and pv != "mỗi": o.append(["Tuấn"+w[4:],ws[i][1],ws[i][2]]); i += 1; continue
        if lw == "khoa" and nx == "học" and n2.startswith("công"): o.append(["kho",ws[i][1],ws[i+1][2]]); i += 2; continue
        if lw == "khoa" and nx == "học": o.append(["khóa",ws[i][1],ws[i][2]]); i += 1; continue
        if lw == "răng" and nx.startswith("rở"): o += [["dang",ws[i][1],ws[i][2]],["dở"+ws[i+1][0][2:],ws[i+1][1],ws[i+1][2]]]; i += 2; continue
        if lw == "hiệu" and nx.startswith("ích"): o += [["hữu",ws[i][1],ws[i][2]],[ws[i+1][0],ws[i+1][1],ws[i+1][2]]]; i += 2; continue
        if lw == "đúng" and nx in ("sẽ","nhé"): o.append(["Đốm"+w[4:],ws[i][1],ws[i][2]]); i += 1; continue
        o.append(ws[i]); i += 1
    return o
fw = fixwords(words)
ws = [[w,G(s),G(e)] for w,s,e in fw]
KW = ["loay hoay","vibe code","ai agent","bộ não thứ 2","doanh nghiệp 1 người","mệt","sợ bị bỏ lại","chậm lại","nhanh hơn","thời gian","người thân","bận hơn","lặp đi lặp lại","đỡ nhọc","kho công cụ","một việc","miễn phí","cẩm nang tra cứu","tạo văn bản","lắng nghe","đỡ bận hơn","góp ý","hữu ích","Đốm"]
def hl(t,kws):
    s = E(t)
    for k in kws: s = re.sub("("+re.escape(k)+")",r'<b class="k">\1</b>',s,flags=re.I)
    return s
def sub(text,a,b,cls="sub"):
    body.append(f'<div class="clip {cls}" data-start="{R(a)}" data-duration="{R(max(b-a,0.2))}" data-track-index="9"><span>{text}</span></div>')
chunks = []; cur = []
for i,w in enumerate(ws):
    cur.append(w); t = " ".join(x[0] for x in cur)
    gap = (ws[i+1][1]-w[2]) if i+1 < len(ws) else 9
    if (re.search(r"[.,!?]$",w[0]) and len(cur) >= 2) or len(cur) >= 6 or len(t) >= 28 or gap > 0.6: chunks.append(cur); cur = []
if cur: chunks.append(cur)
for i,c in enumerate(chunks):
    a = c[0][1]-0.05; b = (chunks[i+1][0][1]-0.05) if i+1 < len(chunks) else c[-1][2]+0.35
    if b-c[-1][2] > 0.8: b = c[-1][2]+0.5
    b = min(b, D0-0.05)
    sub(hl(" ".join(x[0] for x in c),KW),a,b)
def ft(word,after=0.0):
    for w,s,e in fw:
        if s >= after and w.lower().strip(".,!?") == word: return s
    raise SystemExit("không thấy từ "+word)
# ---------- CHỮ TRÊN HÌNH (phần đầu khung, chỉ ý chính) ----------
NC = [0]
def cap(htm,a,b,cls="cap"):
    n = NC[0]; NC[0] += 1
    body.append(f'<div class="clip {cls}" id="cp{n}" data-start="{R(G(a))}" data-duration="{R(b-a)}" data-track-index="8"><span>{htm}</span></div>')
    tw(f'tl.fromTo("#cp{n} span",{{opacity:0,y:-34,scale:0.95}},{{opacity:1,y:0,scale:1,duration:0.6,ease:"back.out(1.5)"}},{R(G(a))});')
    tw(f'tl.to("#cp{n} span",{{opacity:0,y:-20,duration:0.3}},{R(G(b)-0.3)});')
cap('Vì sao có kho công cụ nhỏ này?',0.4,6.7,"cap big")
tv = ft("vibe",19); ta = ft("agent",tv); tb = ft("não",ta); td = ft("doanh",tb)
body.append(f'<div class="clip chips" id="chips" data-start="{R(G(tv-0.1))}" data-duration="{R(29.95-tv+0.1)}" data-track-index="8">' + "".join(f'<span id="ch{k}">{x}</span>' for k,x in enumerate(["Vibe code","AI agent","Bộ não thứ 2","Doanh nghiệp 1 người"])) + '</div>')
for k,t in enumerate([tv,ta,tb,td]): tw(f'tl.fromTo("#ch{k}",{{opacity:0,scale:0.4,y:-20}},{{opacity:1,scale:1,y:0,duration:0.45,ease:"back.out(2.2)"}},{R(G(t-0.1))});')
tw(f'tl.to("#chips",{{opacity:0,y:-20,duration:0.35}},{R(G(29.95)-0.35)});')
mix += [("sfx/pop.wav",G(t-0.1),0.18) for t in (tv,ta,tb,td)]
cap('<small>Tự hỏi</small>Công việc có thật sự nhanh hơn?',43.1,47.4)
cap('<small>Tự hỏi</small>Có thêm thời gian cho người thân?',48.2,53.3)
cap('Hay mình ngày càng bận hơn?',53.6,55.9)
cap('Việc lặp đi lặp lại mỗi ngày',56.65,65.1)
# ---------- HIỆU ỨNG CHUYỂN CẢNH ----------
body.append('<div class="leak" id="leak1"></div><div class="leak" id="leak2"></div><div class="ring" id="ring"></div><div class="orb" id="orb"></div><div class="flash" id="flash"></div>')
tw('gsap.set(["#orb","#flash","#leak1","#leak2","#ring"],{opacity:0});'); tw('gsap.set(["#leak1","#leak2"],{rotation:16});')
def leak(t, lid="#leak1", d=1, k=0.9):
    x0, x1 = (-1000, 1300) if d > 0 else (1300, -1000)
    tw(f'tl.fromTo("{lid}",{{x:{x0}}},{{x:{x1},duration:1.1,ease:"power1.inOut"}},{R(t-0.55)});')
    tw(f'tl.fromTo("{lid}",{{opacity:0}},{{opacity:{k},duration:0.35}},{R(t-0.55)});')
    tw(f'tl.to("{lid}",{{opacity:0,duration:0.45}},{R(t+0.1)});')
    mix.append(("sfx/whoosh.wav",t-0.5,0.22))
def whip(t, d=1):
    tw(f'tl.fromTo("#zx",{{x:0,filter:"blur(0px)"}},{{x:{-100*d},filter:"blur(16px)",duration:0.22,ease:"power2.in"}},{R(t-0.22)});')
    tw(f'tl.fromTo("#zx",{{x:{100*d},filter:"blur(16px)"}},{{x:0,filter:"blur(0px)",duration:0.32,ease:"power2.out"}},{R(t)});')
    tw(f'tl.fromTo("#flash",{{opacity:0}},{{opacity:0.18,duration:0.2}},{R(t-0.2)});'); tw(f'tl.to("#flash",{{opacity:0,duration:0.35}},{R(t)});')
    mix.append(("sfx/whoosh.wav",t-0.3,0.3))
leak(G(6.9),"#leak1",1); whip(G(19.6),1); leak(G(30.2),"#leak2",-1)
# 39,7: đốm sáng lướt qua + mơ nhẹ + viền tối ấm
tw(f'tl.fromTo("#orb",{{opacity:0,x:-160,y:540,scale:0.6}},{{opacity:1,x:520,y:400,scale:0.6,duration:0.55,ease:"power2.out"}},{R(G(39.7)-0.55)});')
tw(f'tl.to("#orb",{{x:1150,y:300,opacity:0,duration:0.6,ease:"power2.in"}},{R(G(39.7))});')
tw(f'tl.fromTo("#zx",{{filter:"blur(0px)"}},{{filter:"blur(10px)",duration:0.3}},{R(G(39.7)-0.3)});'); tw(f'tl.to("#zx",{{filter:"blur(0px)",duration:0.6}},{R(G(39.7))});')
tw(f'tl.to("#vig2",{{opacity:1,duration:0.8}},{R(G(39.7))});'); tw(f'tl.to("#vig2",{{opacity:0,duration:0.8}},{R(G(55.7))});')
mix.append(("sfx/sparkle.wav",G(39.7)-0.5,0.3))
whip(G(56.2),-1)
# ---------- CẢNH WEB 1: Bộ công cụ (iris từ đốm sáng) ----------
def card(idn, src, a, dc, tr, glint=False):
    g = f'<div class="glint" id="{idn}g"></div>' if glint else ''
    body.append(f'<div class="scene webs" id="{idn}" style="opacity:0"><div class="glowbg"></div><div class="card" id="{idn}c"><div class="bar"><i></i><i></i><i></i><span>quantritute.com</span></div><div class="zw2"><div class="zwz" id="{idn}z"><video id="{idn}v" class="clip" muted playsinline data-start="{R(G(a)-0.6)}" data-duration="{R(dc+0.6)}" data-track-index="{tr}" src="assets/v/{src}"></video></div>{g}</div></div></div>')
card("pw1","web1.mp4",65.5,30.0,4,True)
IR = G(65.5)
tw(f'tl.fromTo("#orb",{{opacity:0,x:830,y:200,scale:0.4}},{{opacity:1,x:830,y:200,scale:0.8,duration:0.35}},{R(IR-1.1)});')
tw(f'tl.to("#orb",{{x:480,y:746,scale:1.1,duration:0.5,ease:"power2.inOut"}},{R(IR-0.75)});')
tw(f'tl.to("#orb",{{opacity:0,scale:2.5,duration:0.3}},{R(IR-0.25)});')
tw(f'tl.fromTo("#ring",{{opacity:1,scale:0.3}},{{opacity:0,scale:7,duration:0.9,ease:"power2.out"}},{R(IR-0.3)});')
tw(f'tl.fromTo("#pw1",{{opacity:1,clipPath:"circle(0% at 50% 42%)"}},{{opacity:1,clipPath:"circle(85% at 50% 42%)",duration:0.85,ease:"power2.inOut"}},{R(IR-0.3)});')
tw(f'tl.fromTo("#pw1c",{{rotationX:16,scale:0.88,y:70,transformPerspective:1600}},{{rotationX:0,scale:1,y:0,transformPerspective:1600,duration:1.0,ease:"power3.out"}},{R(IR-0.3)});')
mix += [("sfx/sparkle.wav",IR-1.1,0.4),("sfx/whoosh.wav",IR-0.5,0.35)]
tw(f'tl.fromTo("#pw1g",{{x:-400,opacity:0.95}},{{x:1300,duration:0.75,ease:"power2.inOut"}},{R(G(77.6)-0.2)});'); tw(f'tl.set("#pw1g",{{opacity:0}},{R(G(77.6)+0.6)});')
tw(f'tl.fromTo("#pw1c",{{scale:1}},{{scale:1.02,duration:0.25,yoyo:true,repeat:1,ease:"sine.inOut"}},{R(G(77.6)-0.1)});')
mix.append(("sfx/sparkle.wav",G(77.6)-0.2,0.2))
# thoát: khung thu nhỏ bay lên góc, anh hiện lại
EX = G(94.5)
tw(f'tl.to("#pw1",{{backgroundColor:"rgba(18,13,9,0)",duration:0.5}},{R(EX-0.5)});'); tw(f'tl.to("#pw1 .glowbg",{{opacity:0,duration:0.5}},{R(EX-0.5)});')
tw(f'tl.to("#pw1c",{{scale:0.18,x:360,y:-700,rotation:8,duration:0.7,ease:"power3.in"}},{R(EX-0.5)});'); tw(f'tl.to("#pw1",{{opacity:0,duration:0.2}},{R(EX+0.15)});')
leak(EX,"#leak1",-1,0.7)
# ---------- CẢNH WEB 2: Bảng ghim → đề xuất → góp ý ----------
card("pw2","web2.mp4",96.5,12.25,5)
EN = G(96.5)
tw(f'tl.set("#pw2",{{clipPath:"circle(85% at 50% 42%)"}},{R(EN-0.5)});')
tw(f'tl.fromTo("#pw2",{{opacity:0}},{{opacity:1,duration:0.35}},{R(EN-0.45)});')
tw(f'tl.fromTo("#pw2c",{{y:950,rotation:-5,scale:0.94}},{{y:0,rotation:0,scale:1,duration:0.8,ease:"power3.out"}},{R(EN-0.45)});')
leak(EN,"#leak2",1,0.6)
tw('tl.set("#pw2z",{transformOrigin:"50% 52%"},0);')
tw(f'tl.fromTo("#pw2z",{{scale:1}},{{scale:1.5,duration:0.6,ease:"power2.inOut"}},{R(G(100.75))});')
tw(f'tl.fromTo("#pw2z",{{scale:1.5}},{{scale:1,duration:0.4,ease:"power2.inOut"}},{R(G(103.6))});')
tw(f'tl.fromTo("#pw2z",{{scale:1}},{{scale:1.5,duration:0.6,ease:"power2.inOut"}},{R(G(105.25))});')
CL = G(108.75)
tw(f'tl.to("#pw2",{{clipPath:"circle(0% at 50% 42%)",duration:0.6,ease:"power2.in"}},{R(CL-0.55)});')
tw(f'tl.fromTo("#ring",{{opacity:0,scale:6}},{{opacity:0.9,scale:0.3,duration:0.6,ease:"power2.in"}},{R(CL-0.55)});'); tw(f'tl.to("#ring",{{opacity:0,duration:0.2}},{R(CL+0.05)});')
mix.append(("sfx/whoosh.wav",CL-0.6,0.3))
# tiếng bấm theo thao tác web
def mapt(cs, vs, t):
    for i in range(len(cs)-1):
        if cs[i] <= t <= cs[i+1]: return vs[i] + (t-cs[i])*(vs[i+1]-vs[i])/(cs[i+1]-cs[i])
    return None
a = RM["a"]; b = RM["b"]; c = RM["c"]; d = RM["d"]
clicks = [mapt([0.9,15.4],[65.5,77.6],a[k]) for k in ("hanh-chinh","khoi-nghiep","hoc-tap")]
bc, bv = [1.2,b["cn_mo"],b["vb_mo"],b["free"],19.0], [77.6,85.0,88.3,91.3,94.4]
clicks += [mapt(bc,bv,b[k]) for k in ("noibat","cn_mo","vb_mo")]
cc, cv = [0.8,c["vote"],c["dx_mo"],c["dx_ok"],11.0], [96.5,97.9,100.4,103.4,104.15]
clicks += [mapt(cc,cv,c[k]) for k in ("vote","dx_mo","dx_gui")]
dc_, dv = [0.7,d["gy_mo"],d["gy_ok"],7.8], [103.85,105.0,107.4,108.7]
clicks += [mapt(dc_,dv,d[k]) for k in ("gy_mo","gy_gui")]
for t in clicks:
    if t: mix.append(("sfx/tap.wav",G(t)-0.05,0.35))
# ---------- NHÃN CẢNH WEB ----------
NP = [0]
def pill(htm,a,b):
    n = NP[0]; NP[0] += 1
    body.append(f'<div class="clip tag2" id="pl{n}" data-start="{R(G(a))}" data-duration="{R(b-a)}" data-track-index="10"><span>{htm}</span></div>')
    tw(f'tl.fromTo("#pl{n} span",{{opacity:0,y:-24,scale:0.9}},{{opacity:1,y:0,scale:1,duration:0.45,ease:"back.out(1.8)"}},{R(G(a))});')
pill('Bộ công cụ · quantritute.com',65.9,77.5); pill('2 công cụ đã hoàn thành',77.8,90.5); pill('<b>Miễn phí</b> tại quantritute.com',90.5,94.1)
pill('Bảng ghim · Bấm “Tôi cũng cần”',96.6,100.3); pill('Đề xuất công cụ mới',100.35,103.9); pill('Góp ý cho từng công cụ',104.0,108.3)
# ---------- ĐỐM XUẤT HIỆN ----------
OB = G(113.3)
tw(f'tl.fromTo("#orb",{{opacity:0,x:850,y:180,scale:0.3}},{{opacity:1,x:850,y:180,scale:0.9,duration:0.35,ease:"power2.out"}},{R(OB)});')
tw(f'tl.to("#orb",{{x:480,y:746,scale:1.3,duration:0.5,ease:"power2.inOut"}},{R(OB+0.3)});')
tw(f'tl.to("#orb",{{scale:10,duration:0.3,ease:"power3.in"}},{R(D0-0.25)});')
tw(f'tl.fromTo("#flash",{{opacity:0}},{{opacity:0.95,duration:0.22,ease:"power2.in"}},{R(D0-0.2)});')
tw(f'tl.set("#orb",{{opacity:0}},{R(D0+0.02)});'); tw(f'tl.to("#flash",{{opacity:0,duration:0.7,ease:"power2.out"}},{R(D0+0.02)});')
random.seed(4)
pts = "".join(f'<i class="pt" id="pt{k}" style="left:{random.randint(120,960)}px;top:{random.randint(700,1300)}px"></i>' for k in range(14))
body.append(f'<div class="scene" id="ds" style="opacity:0"><div id="rays"></div>{pts}<div class="rg" id="rg1"></div><div class="rg" id="rg2"></div>'
            '<div class="dbig" id="dbig"><div class="glow" id="dglow"></div><img id="dA" src="assets/img/dom-01-chao-toi.png"><img id="dB" src="assets/img/dom-10-vui-toi.png"></div>'
            '<div class="dlab" id="dlab">Đốm · trợ lý của Quản trị tử tế</div>'
            '<div class="dtext" id="dtx"><span id="dt1">Dạ vâng,</span> <span id="dt2">em <b class="k">sẵn sàng</b> ạ!</span></div></div>')
tw('gsap.set("#dB",{opacity:0});')
tw(f'tl.set("#ds",{{opacity:1}},{R(D0)});'); tw(f'tl.set("#talk",{{opacity:0}},{R(D0+0.05)});')
tw(f'tl.fromTo("#rays",{{rotation:0,scale:0.6,opacity:0}},{{rotation:35,scale:1,opacity:1,duration:{R(S5+0.6-D0)},ease:"sine.out"}},{R(D0)});')
tw(f'tl.fromTo("#dbig",{{opacity:0,scale:0.15,rotation:-35,y:80}},{{opacity:1,scale:1,rotation:0,y:0,duration:0.85,ease:"back.out(1.7)"}},{R(D0+0.05)});')
tw(f'tl.fromTo("#dglow",{{scale:0.8}},{{scale:1.15,duration:0.6,yoyo:true,repeat:3,ease:"sine.inOut"}},{R(D0+0.3)});')
for k,(rg,dl) in enumerate([("#rg1",0.2),("#rg2",0.75),("#rg1",1.3),("#rg2",1.85)]):
    tw(f'tl.fromTo("{rg}",{{scale:0.6,opacity:0.9}},{{scale:3.2,opacity:0,duration:1.1,ease:"power2.out"}},{R(D0+dl)});')
random.seed(7)
for k in range(14):
    st = D0 + random.uniform(0, 1.2); dy = random.randint(220, 480)
    tw(f'tl.fromTo("#pt{k}",{{opacity:0,y:0,scale:0.5}},{{opacity:1,y:{-dy//2},scale:1,duration:0.8,ease:"sine.out"}},{R(st)});')
    tw(f'tl.to("#pt{k}",{{opacity:0,y:{-dy},duration:1.0,ease:"sine.in"}},{R(st+0.8)});')
VD = D0 + 0.55
tw(f'tl.fromTo("#dlab",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.45}},{R(D0+0.45)});')
tw(f'tl.fromTo("#dt1",{{opacity:0,y:30,scale:0.8}},{{opacity:1,y:0,scale:1,duration:0.35,ease:"back.out(2)"}},{R(VD)});')
tw(f'tl.fromTo("#dt2",{{opacity:0,y:30,scale:0.8}},{{opacity:1,y:0,scale:1,duration:0.4,ease:"back.out(2)"}},{R(VD+0.45)});')
tw(f'tl.to("#dB",{{opacity:1,duration:0.25}},{R(VD+0.45)});'); tw(f'tl.to("#dA",{{opacity:0,duration:0.25}},{R(VD+0.45)});')
tw(f'tl.to("#dbig img",{{y:-34,duration:0.22,yoyo:true,repeat:1,ease:"power2.out"}},{R(VD+0.45)});')
tw(f'tl.to("#dbig img",{{y:-12,rotation:4,duration:0.5,yoyo:true,repeat:1,ease:"sine.inOut"}},{R(VD+1.0)});')
FL = S5 - 0.75
tw(f'tl.to(["#dtx","#dlab"],{{opacity:0,y:-20,duration:0.35}},{R(FL)});')
tw(f'tl.to("#dbig",{{x:330,y:-560,scale:0.25,rotation:20,duration:0.75,ease:"power3.in"}},{R(FL)});')
mix += [("sfx/sparkle.wav",OB,0.4),("sfx/whoosh.wav",D0-0.45,0.4),("sfx/sparkle.wav",D0,0.55),("sfx/pop.wav",D0+0.3,0.4),("assets/a/E1.wav",VD,1.15),("sfx/whoosh.wav",FL,0.35)]
# ---------- KẾT ----------
body.append(f'<div class="scene" id="outro" style="opacity:0"><video id="ketv" class="clip full" muted playsinline data-start="{R(S5)}" data-duration="7" data-track-index="6" src="assets/v/ket.mp4"></video></div>')
tw(f'tl.to("#outro",{{opacity:1,duration:0.45}},{R(S5)});'); tw(f'tl.set("#ds",{{opacity:0}},{R(S5+0.5)});')
E2s = S5 + 0.3
mix += [("sfx/pop.wav",S5+0.3,0.35),("assets/a/E2.wav",E2s,1.15),("sfx/whoosh.wav",S5+3.95,0.4),("sfx/click.wav",S5+4.88,0.7)]
DKW = ["tập sau","follow","đồng hành cùng Đốm"]
p1 = "Hẹn gặp anh chị ở tập sau nhé."; p2 = "Anh chị follow và đồng hành cùng Đốm nha."
d1 = A["E2"]*len(p1)/(len(p1)+len(p2))
sub(hl(p1,DKW),E2s,E2s+d1+0.1); sub(hl(p2,DKW),E2s+d1+0.1,E2s+A["E2"]+0.6)
js = [ (l.replace("},{","},{immediateRender:false,",1) if l.startswith("tl.fromTo(") else l) for l in js ]
init = ['gsap.set("#zx",{x:0,filter:"blur(0px)"});','gsap.set(".chips span",{opacity:0});','gsap.set(".pt",{opacity:0});',
        'gsap.set(["#dbig","#dlab","#dt1","#dt2","#rays"],{opacity:0});','gsap.set(".cap span",{opacity:0});','gsap.set(".tag2 span",{opacity:0});','gsap.set(["#pw2z","#pw1z"],{scale:1});']
js = init + js
tpl = open(f"{HOME}/work/b4/template5.html",encoding="utf-8").read()
open("index.html","w",encoding="utf-8").write(tpl.replace("{{TOTAL}}",str(R(TOTAL))).replace("{{BODY}}","\n".join(body)).replace("{{JS}}","\n".join(js)))
json.dump({"total":TOTAL,"mix":mix,"T0":T0,"S5":S5,"D0":D0},open(f"{HOME}/work/b4/mix.json","w"),indent=1)
print("TOTAL",R(TOTAL),"S5",R(S5),"D0",R(D0),"clicks",[round(x,2) for x in clicks if x])
