import json, re, html, subprocess
E=html.escape; R=lambda v: round(v,3)
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
A={k:dur(f"hf/assets/a/{k}.wav") for k in ["E1","E2","E3"]}
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
# ---------- CHUYỂN CẢNH: luồng sáng Đốm -> anh tập trung gõ máy ----------
DOM_CALL=T0+55.02
TR=DOM_CALL+0.55
S1=TR
V1=S1+0.7; E1end=V1+A["E1"]
body.append(f'<div class="scene" id="p1" style="opacity:0"><div class="zw" id="zw1"><video id="workv" class="clip full" muted playsinline data-start="{R(S1)}" data-duration="7.5" data-track-index="3" src="assets/v/work.mp4"></video></div>'
            '<div class="dom big" id="d1"><div class="glow" id="d1g"></div><img id="d1b" src="assets/img/dom-01-chao-toi.png"><img id="d1c" src="assets/img/dom-10-vui-toi.png"></div>'
            '<div class="tag" id="tag1">Đốm · người bạn đồng hành</div></div>')
body.append('<div class="orb" id="orb"></div><div class="flash" id="flash"></div>')
js+=['gsap.set("#d1c",{opacity:0});gsap.set(["#orb","#flash"],{opacity:0});',
     f'tl.fromTo("#orb",{{opacity:0,scale:0.1}},{{opacity:1,scale:1,duration:0.45,ease:"power2.out"}},{R(DOM_CALL-0.05)});',
     f'tl.to("#orb",{{scale:7,duration:0.35,ease:"power3.in"}},{R(TR-0.3)});',
     f'tl.to("#zw",{{scale:1.35,x:-80,y:120,duration:0.6,ease:"power3.in"}},{R(TR-0.55)});',
     f'tl.to("#flash",{{opacity:1,duration:0.25,ease:"power2.in"}},{R(TR-0.25)});',
     f'tl.set("#p1",{{opacity:1}},{R(TR)});', f'tl.set("#talk",{{opacity:0}},{R(TR)});', f'tl.set("#orb",{{opacity:0}},{R(TR)});',
     f'tl.fromTo("#zw1",{{scale:1.25}},{{scale:1.0,duration:1.1,ease:"power3.out"}},{R(TR)});',
     f'tl.to("#flash",{{opacity:0,duration:0.7,ease:"power2.out"}},{R(TR+0.05)});',
     f'tl.fromTo("#d1",{{opacity:0,scale:0.2,rotation:-30}},{{opacity:1,scale:1,rotation:0,duration:0.7,ease:"back.out(1.8)"}},{R(TR+0.1)});',
     f'tl.to("#d1c",{{opacity:1,duration:0.3}},{R(V1+1.5)});', f'tl.to("#d1b",{{opacity:0,duration:0.3}},{R(V1+1.5)});',
     f'tl.to("#d1 img",{{y:-14,rotation:4,duration:0.75,repeat:8,yoyo:true,ease:"sine.inOut"}},{R(TR+0.8)});',
     f'tl.fromTo("#tag1",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.4}},{R(V1+1.2)});']
mix+=[("sfx/whoosh.wav",TR-0.5,0.55),("sfx/sparkle.wav",TR-0.05,0.55),("sfx/pop.wav",TR+0.25,0.35),("typing.wav",S1,0.55),("hf/assets/a/E1.wav",V1,1.15)]
KB={"E1":"Dạ, Đốm đây! Em chào các anh chị! Em là một đốm sáng nhỏ, như đom đóm dẫn đường trong đêm.",
    "E2":"Em rất háo hức được đồng hành cùng anh chị trên hành trình này. Em sẽ xây dựng và giới thiệu những công cụ hữu ích, miễn phí, và hướng dẫn cách ứng dụng AI để tối ưu công việc, để những việc lặp đi lặp lại không còn lấy mất thời gian của mình, và anh chị sẽ có thêm nhiều thời gian hơn bên những người thân yêu.",
    "E3":"Anh chị hãy theo dõi, ủng hộ, và đồng hành cùng Đốm nha!"}
DKW=["Đốm đây","đốm sáng nhỏ","đom đóm dẫn đường","háo hức","công cụ hữu ích","miễn phí","ứng dụng AI","lặp đi lặp lại","người thân yêu","theo dõi","đồng hành cùng Đốm"]
def wlen(x): return len(x)+(6 if re.search(r"[.!?]$",x) else 3 if x.endswith(",") else 0)
def dsub(k,a,end,cls="sub dsub"):
    text=KB[k]; d=A[k]
    parts=[p.strip() for p in re.findall(r"[^,.?!]+[,.?!]?",text) if p.strip()]; o=[]
    for p in parts:
        w=p.split()
        if len(w)>7: m=(len(w)+1)//2; o+=[" ".join(w[:m])," ".join(w[m:])]
        else: o.append(p)
    tot=sum(wlen(x) for x in o); acc=0; times=[]
    for i,x in enumerate(o):
        s=a+acc/tot*d; acc+=wlen(x); e=a+acc/tot*d if i<len(o)-1 else end
        sub(hl(x,DKW),s,e,cls); times.append((x,s,e))
    return times
dsub("E1",V1,E1end+0.3,"sub psub")
# ---------- WEB: 1 cảnh, đổi clip theo từng ý của lời Đốm ----------
V2=E1end+0.4                      # lời đoạn 2 bắt đầu ngay khi vào web (nghỉ 0,4s)
SW=V2-0.45                        # web hiện ra trước lời 0,45s
SENT=[("Em rất háo hức được đồng hành cùng anh chị trên hành trình này.","web2/w34.mp4",1.6,5.6,"dom-01-chao"),
      ("Em sẽ xây dựng và giới thiệu những công cụ hữu ích, miễn phí,","web3/chi-tiet.mp4",3.0,6.7,"dom-02-chi-phai"),
      ("và hướng dẫn cách ứng dụng AI để tối ưu công việc,","web3/cam-nang.mp4",1.7,5.5,"dom-13-xu-ly"),
      ("để những việc lặp đi lặp lại không còn lấy mất thời gian của mình,","web3/van-ban.mp4",0.4,4.5,"dom-19-hoan-thanh"),
      ("và anh chị sẽ có thêm nhiều thời gian hơn bên những người thân yêu.","web2/w34.mp4",9.4,13.9,"dom-21-cam-on")]
tot=sum(wlen(s[0]) for s in SENT); acc=0; bounds=[]
for x,*_ in SENT:
    s=V2+acc/tot*A["E2"]; acc+=wlen(x); bounds.append([s,V2+acc/tot*A["E2"]])
bounds[0][0]=SW; E2end=V2+A["E2"]
V3=E2end+0.4; bounds[-1][1]=V3-0.3
SE=V3+A["E3"]+1.0                  # hết cảnh đề xuất
clips=[]
for i,((x,src,a0,a1,pose),(bs,be)) in enumerate(zip(SENT,bounds)):
    D=be-bs+0.2; f=(a1-a0)/D; out=f"hf/assets/v/s{i}.mp4"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",str(a0),"-t",str(a1-a0),"-i",src,"-vf",f"setpts=PTS/{f:.4f},tpad=stop_mode=clone:stop_duration=1,trim=duration={D:.3f},fps=30,format=yuv420p","-an","-c:v","libx264","-crf","16","-preset","fast",out],check=True)
    clips.append((f"s{i}",bs,D,pose)); print(f"cảnh {i}: {D:.2f}s tốc độ x{f:.2f}")
D6=SE-(V3-0.3)+0.2; a0,a1=0.9,7.5; f=(a1-a0)/D6
subprocess.run(["ffmpeg","-v","error","-y","-ss",str(a0),"-t",str(a1-a0),"-i","web3/de-xuat.mp4","-vf",f"setpts=PTS/{f:.4f},tpad=stop_mode=clone:stop_duration=1,trim=duration={D6:.3f},fps=30,format=yuv420p","-an","-c:v","libx264","-crf","16","-preset","fast","hf/assets/v/s5.mp4"],check=True)
clips.append(("s5",V3-0.3,D6,"dom-10-vui")); print(f"cảnh 5: {D6:.2f}s tốc độ x{f:.2f}")
body.append('<div class="scene webs" id="pw" style="opacity:0"><div class="glowbg"></div><div class="card" id="pwc"><div class="bar"><i></i><i></i><i></i><span>quantritute.com</span></div><div class="zw2">'
            + "".join(f'<div class="sv" id="{c}w" style="opacity:0"><video id="{c}v" class="clip" muted playsinline data-start="{R(bs)}" data-duration="{R(D)}" data-track-index="{4+i%2}" src="assets/v/{c}.mp4"></video></div>' for i,(c,bs,D,_) in enumerate(clips))
            + '</div></div><div class="dom small" id="pwd"><div class="glow"></div>' + "".join(f'<img id="{c}p" src="assets/img/{p}-toi.png" style="opacity:0">' for c,_,_,p in clips) + '</div></div>')
js+=[f'tl.to("#pw",{{opacity:1,duration:0.45}},{R(SW)});', f'tl.fromTo("#pwc",{{y:80,scale:0.94}},{{y:0,scale:1,duration:0.6,ease:"power3.out"}},{R(SW)});',
     f'tl.set("#p1",{{opacity:0}},{R(SW+0.5)});',
     f'tl.fromTo("#pwd",{{opacity:0,scale:0.4,y:60}},{{opacity:1,scale:1,y:0,duration:0.5,ease:"back.out(2)"}},{R(SW+0.2)});',
     f'tl.to("#pwd img",{{y:-12,rotation:5,duration:0.7,repeat:{int((SE-SW)/0.7)},yoyo:true,ease:"sine.inOut"}},{R(SW+0.7)});']
for i,(c,bs,D,_) in enumerate(clips):
    js+=[f'tl.to("#{c}w",{{opacity:1,duration:0.2}},{R(bs)});', f'tl.to("#{c}p",{{opacity:1,duration:0.25}},{R(bs)});']
    if i: js+=[f'tl.to("#{clips[i-1][0]}w",{{opacity:0,duration:0.2}},{R(bs+0.2)});', f'tl.to("#{clips[i-1][0]}p",{{opacity:0,duration:0.25}},{R(bs)});']
    if i: mix.append(("sfx/whoosh.wav",bs-0.15,0.18))
mix+=[("sfx/whoosh.wav",SW-0.4,0.3),("hf/assets/a/E2.wav",V2,1.15),("hf/assets/a/E3.wav",V3,1.2),("sfx/sparkle.wav",V3+A["E3"]-0.5,0.4)]
dsub("E2",V2,E2end+0.3); dsub("E3",V3,SE,"sub dsub big")
e5=SE
# ---------- KẾT ----------
S5=e5; E5=S5+7.0
body.append(f'<div class="scene" id="outro" style="opacity:0"><video id="ketv" class="clip full" muted playsinline data-start="{R(S5)}" data-duration="7" data-track-index="5" src="assets/v/ket.mp4"></video></div>')
js+=[f'tl.to("#outro",{{opacity:1,duration:0.5}},{R(S5)});', f'tl.set("#pw",{{opacity:0}},{R(S5+0.55)});']
mix+=[("sfx/pop.wav",S5+0.3,0.35),("sfx/whoosh.wav",S5+3.95,0.4),("sfx/click.wav",S5+4.88,0.7)]
TOTAL=E5
page=open("template3.html",encoding="utf-8").read().replace("{{TOTAL}}",str(R(TOTAL))).replace("{{BODY}}","\n".join(body)).replace("{{JS}}","\n".join(js))
open("hf/index.html","w",encoding="utf-8").write(page)
json.dump({"total":TOTAL,"mix":mix,"T0":T0,"S1":S1,"S5":S5},open("mix2.json","w"),indent=1)
print("TOTAL",R(TOTAL),"T0",T0,"TR",R(TR),"web",R(SW),"S5",R(S5))
