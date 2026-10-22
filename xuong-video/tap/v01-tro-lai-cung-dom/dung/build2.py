import json, re, html, subprocess
E=html.escape; R=lambda v: round(v,3)
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
A={k:dur(f"hf/assets/a/{k}.wav") for k in ["D1","D2","D3","D4","D5a"]}
WM=json.load(open("web2/meta.json"))
body=[]; js=[]; mix=[]
INTRO=5.0; X=0.5            # mở đầu 5s, hoà cảnh 0.5s
T0=INTRO-X; TALK=56.0
# ---------- MỞ ĐẦU ----------
body.append(f'<video id="intro" class="clip full" muted playsinline data-start="0" data-duration="{INTRO}" data-track-index="1" src="assets/v/mo-dau.mp4"></video>')
mix+= [("sfx/click.wav",1.05,0.6),("sfx/sparkle.wav",1.2,0.4)]
# ---------- LỜI ANH ----------
body.append(f'<div class="scene" id="talk" style="opacity:0"><div class="zw" id="zw"><video id="talkv" class="clip full" muted playsinline data-start="{T0}" data-duration="{TALK}" data-track-index="2" src="assets/v/talk2.mp4"></video></div>'
            '<div class="lt" id="lt"><div class="lt-n">MINH TUẤN</div><div class="lt-s">Quản trị tử tế</div></div></div>')
js+=[f'tl.fromTo("#talk",{{opacity:0}},{{opacity:1,duration:{X}}},{T0});', 'tl.set("#zw",{transformOrigin:"50% 32%"},0);',
     f'tl.fromTo("#zw",{{scale:1}},{{scale:1.06,duration:{TALK-1.2},ease:"none"}},{T0});',
     f'tl.fromTo("#lt",{{opacity:0,x:-40}},{{opacity:1,x:0,duration:0.5,ease:"power3.out"}},{R(T0+1.0)});', f'tl.to("#lt",{{opacity:0,x:-30,duration:0.4}},{R(T0+6.0)});']
mix.append(("talk2_n.wav",T0,1.0))
# phụ đề lời anh
FIX={"lay":"loay"}
ws=[]
for s in json.load(open("words2.json")):
    for w in s["words"]:
        if w["s"]>TALK: continue
        ws.append([FIX.get(w["w"],w["w"]),T0+w["s"],T0+w["e"]])
# gộp "Đố mơ ơi!" -> "Đốm ơi!"
for i in range(len(ws)-2):
    if ws[i][0]=="Đố" and ws[i+1][0]=="mơ": ws[i]=["Đốm",ws[i][1],ws[i+1][2]]; ws[i+1]=None
ws=[w for w in ws if w]
chunks=[]; cur=[]
for i,w in enumerate(ws):
    cur.append(w); t=" ".join(x[0] for x in cur)
    gap=(ws[i+1][1]-w[2]) if i+1<len(ws) else 9
    if (re.search(r"[.,!?]$",w[0]) and len(cur)>=2) or len(cur)>=6 or len(t)>=28 or gap>0.6: chunks.append(cur); cur=[]
if cur: chunks.append(cur)
KW=["minh tuấn","trí tuệ nhân tạo ai","thay đổi rất lớn","chuyên môn rất tốt","loay hoay","tối ưu","công nghệ số","dừng lại","thử nghiệm","kiến thức mới","cách làm mới","hữu ích","lần trở lại","người bạn nhỏ","đốm ơi"]
def hl(t,kws):
    s=E(t)
    for k in kws: s=re.sub("("+re.escape(k)+")",r'<b class="k">\1</b>',s,flags=re.I)
    return s
def sub(text,a,b,cls="sub"):
    body.append(f'<div class="clip {cls}" data-start="{R(a)}" data-duration="{R(max(b-a,0.2))}" data-track-index="9"><span>{text}</span></div>')
for i,c in enumerate(chunks):
    a=c[0][1]-0.05; b=(chunks[i+1][0][1]-0.05) if i+1<len(chunks) else c[-1][2]+0.35
    if b-c[-1][2]>0.8: b=c[-1][2]+0.5
    b=min(b,T0+55.02+0.5)
    sub(hl(" ".join(x[0] for x in c),KW),a,b)
# ---------- CHUYỂN CẢNH: luồng sáng Đốm ----------
DOM_CALL=T0+55.02           # "Đốm ơi!"
TR=DOM_CALL+0.55           # đỉnh lóe sáng
S1=TR                      # bắt đầu cảnh anh làm việc
D1=S1+0.75; D2=D1+A["D1"]+0.25; E1=D2+A["D2"]+0.5
body.append(f'<div class="scene" id="p1" style="opacity:0"><div class="zw" id="zw1"><video id="workv" class="clip full" muted playsinline data-start="{R(S1)}" data-duration="{R(E1-S1+0.6)}" data-track-index="3" src="assets/v/work.mp4"></video></div>'
            '<div class="dom big" id="d1"><div class="glow" id="d1g"></div><img id="d1b" src="assets/img/dom-01-chao-toi.png"><img id="d1c" src="assets/img/dom-10-vui-toi.png"></div>'
            '<div class="tag" id="tag1">Đốm · người bạn đồng hành</div></div>')
body.append('<div class="orb" id="orb"></div><div class="flash" id="flash"></div>')
js+=['gsap.set("#d1c",{opacity:0});gsap.set(["#orb","#flash"],{opacity:0});',
     # đốm sáng nhỏ xuất hiện góc phải trên, lớn dần, kéo máy quay vào
     f'tl.fromTo("#orb",{{opacity:0,scale:0.1,x:0,y:0}},{{opacity:1,scale:1,duration:0.45,ease:"power2.out"}},{R(DOM_CALL-0.05)});',
     f'tl.to("#orb",{{scale:7,duration:0.35,ease:"power3.in"}},{R(TR-0.3)});',
     f'tl.to("#zw",{{scale:1.35,x:-80,y:120,duration:0.6,ease:"power3.in"}},{R(TR-0.55)});',
     f'tl.to("#flash",{{opacity:1,duration:0.25,ease:"power2.in"}},{R(TR-0.25)});',
     f'tl.set("#p1",{{opacity:1}},{R(TR)});', f'tl.set("#talk",{{opacity:0}},{R(TR)});', f'tl.set("#orb",{{opacity:0}},{R(TR)});',
     f'tl.fromTo("#zw1",{{scale:1.25}},{{scale:1.0,duration:1.1,ease:"power3.out"}},{R(TR)});',
     f'tl.to("#flash",{{opacity:0,duration:0.7,ease:"power2.out"}},{R(TR+0.05)});',
     f'tl.fromTo("#d1",{{opacity:0,scale:0.2,rotation:-30}},{{opacity:1,scale:1,rotation:0,duration:0.7,ease:"back.out(1.8)"}},{R(TR+0.1)});',
     f'tl.to("#d1c",{{opacity:1,duration:0.3}},{R(D2+1.4)});', f'tl.to("#d1b",{{opacity:0,duration:0.3}},{R(D2+1.4)});',
     f'tl.to("#d1 img",{{y:-14,rotation:4,duration:0.75,repeat:{int((E1-S1)/0.75)},yoyo:true,ease:"sine.inOut"}},{R(TR+0.8)});',
     f'tl.fromTo("#tag1",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.4}},{R(D2+0.3)});']
mix+=[("sfx/whoosh.wav",TR-0.5,0.55),("sfx/sparkle.wav",TR-0.05,0.55),("sfx/pop.wav",TR+0.25,0.35),("hf/assets/a/D1.wav",D1,1.15),("hf/assets/a/D2.wav",D2,1.15)]
KB={"D1":"Dạ, Đốm đây!","D2":"Em chào các anh chị. Em là một đốm sáng nhỏ, như đom đóm dẫn đường trong đêm.",
    "D3":"Trên hành trình này, em sẽ hỗ trợ các anh chị với những công cụ nhỏ, miễn phí, và cách ứng dụng AI để tối ưu công việc của mình.",
    "D4":"Giải phóng thời gian khỏi những việc lặp đi lặp lại, để có thêm thời gian cho những người thân yêu.",
    "D5a":"Anh chị hãy ủng hộ, và đồng hành cùng Đốm nha!"}
DKW=["Đốm đây","đốm sáng nhỏ","đom đóm dẫn đường","công cụ nhỏ","miễn phí","ứng dụng AI","lặp đi lặp lại","người thân yêu","ủng hộ","đồng hành cùng Đốm"]
def dsub(k,a,end,cls="sub dsub"):
    text=KB[k]; d=A[k]
    parts=[p.strip() for p in re.findall(r"[^,.?!]+[,.?!]?",text) if p.strip()]; o=[]
    for p in parts:
        w=p.split()
        if len(w)>7: m=(len(w)+1)//2; o+=[" ".join(w[:m])," ".join(w[m:])]
        else: o.append(p)
    tot=sum(len(x) for x in o); acc=0
    for i,x in enumerate(o):
        s=a+acc/tot*d; acc+=len(x); e=a+acc/tot*d if i<len(o)-1 else end
        sub(hl(x,DKW),s,e,cls)
dsub("D1",D1,D2-0.05,"sub psub"); dsub("D2",D2,E1,"sub psub")
# ---------- WEB ----------
def web(sid,clip,s,e,poses):
    body.append(f'<div class="scene webs" id="{sid}" style="opacity:0"><div class="glowbg"></div>'
                f'<div class="card" id="{sid}c"><div class="bar"><i></i><i></i><i></i><span>quantritute.com/cong-cu</span></div>'
                f'<div class="zw2" id="{sid}z"><video id="{sid}v" class="clip" muted playsinline data-start="{R(s)}" data-duration="{R(e-s)}" data-track-index="4" src="assets/v/{clip}.mp4"></video></div></div>'
                f'<div class="dom small" id="{sid}d"><div class="glow"></div>'+"".join(f'<img id="{sid}p{i}" src="assets/img/{p}-toi.png">' for i,(p,_) in enumerate(poses))+'</div></div>')
    js.extend([f'gsap.set("#{sid}",{{opacity:0}});', f'tl.to("#{sid}",{{opacity:1,duration:0.45}},{R(s-0.45)});',
               f'tl.fromTo("#{sid}c",{{y:80,scale:0.94}},{{y:0,scale:1,duration:0.6,ease:"power3.out"}},{R(s-0.45)});',
               f'tl.fromTo("#{sid}d",{{opacity:0,scale:0.4,y:60}},{{opacity:1,scale:1,y:0,duration:0.5,ease:"back.out(2)"}},{R(s)});',
               f'tl.to("#{sid}d img",{{y:-12,rotation:5,duration:0.7,repeat:{int((e-s)/0.7)},yoyo:true,ease:"sine.inOut"}},{R(s+0.5)});'])
    for i,(p,t) in enumerate(poses):
        if i==0: continue
        js.extend([f'gsap.set("#{sid}p{i}",{{opacity:0}});', f'tl.to("#{sid}p{i}",{{opacity:1,duration:0.3}},{R(s+t)});', f'tl.to("#{sid}p{i-1}",{{opacity:0,duration:0.3}},{R(s+t)});'])
s=E1+0.45; d34=WM["w34"]["dur"]; e=s+d34-0.3
v3=s+0.5; v4=s+WM["w34"]["hl1"]-0.2
web("p2","w34",s,e,[("dom-02-chi-phai",0),("dom-13-xu-ly",3.5),("dom-21-cam-on",v4-s+1.5)])
js.append(f'tl.set("#p1",{{opacity:0}},{R(s+0.05)});')
mix+=[("sfx/whoosh.wav",s-0.5,0.3),("hf/assets/a/D3.wav",v3,1.15),("hf/assets/a/D4.wav",v4,1.15)]
dsub("D3",v3,v3+A["D3"]+0.3); dsub("D4",v4,e)
s5=e+0.45; e5=s5+WM["w5"]["dur"]-0.4; v5=s5+1.5
web("p3","w5",s5,e5,[("dom-10-vui",0),("dom-19-hoan-thanh",v5-s5+1.2)])
js.append(f'tl.set("#p2",{{opacity:0}},{R(s5+0.05)});')
mix+=[("sfx/whoosh.wav",s5-0.5,0.3),("hf/assets/a/D5a.wav",v5,1.2),("sfx/sparkle.wav",v5+A["D5a"]-0.6,0.4)]
dsub("D5a",v5,e5,"sub dsub big")
# ---------- KẾT ----------
S5=e5; E5=S5+5.0
body.append(f'<div class="scene" id="outro" style="opacity:0"><video id="ketv" class="clip full" muted playsinline data-start="{R(S5)}" data-duration="5" data-track-index="5" src="assets/v/ket.mp4"></video></div>')
js+=[f'tl.to("#outro",{{opacity:1,duration:0.5}},{R(S5)});', f'tl.set("#p3",{{opacity:0}},{R(S5+0.55)});']
mix+=[("sfx/click.wav",S5+2.35,0.5)]
TOTAL=E5
page=open("template2.html",encoding="utf-8").read().replace("{{TOTAL}}",str(R(TOTAL))).replace("{{BODY}}","\n".join(body)).replace("{{JS}}","\n".join(js))
open("hf/index.html","w",encoding="utf-8").write(page)
json.dump({"total":TOTAL,"mix":mix,"T0":T0,"S1":S1,"S5":S5},open("mix2.json","w"),indent=1)
print("TOTAL",R(TOTAL),"T0",T0,"TR",R(TR),"web",R(E1+0.45),"S5",R(S5))
