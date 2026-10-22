import json, re, html, subprocess, os, sys
os.chdir("/home/claude/v02/hf")
E=html.escape; R=lambda v: round(v,3)
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
A={k:dur(f"assets/a/{k}.wav") for k in ["E1","E2","E3","E4","E5"]}
LOI=json.load(open("/home/claude/v02/kich-ban-v1.json"))["doan"]
TXT={d["id"]:d["loi"] for d in LOI}
def sents(t): return [s.strip() for s in re.findall(r"[^.?!]+[.?!]?",t) if s.strip()]
def wlen(x): return len(x)+(6 if re.search(r"[.!?]$",x) else 3 if x.endswith(",") else 0)
KW=["ví dụ có sẵn","tám nhân viên","hai thứ","file mẫu","danh sách Excel","ngoặc vuông","ghép trường","cùng tên","kéo thả","xem thử","xuất file","mỗi người một file","tám phiếu lương","bản scan","Excel","PDF","ảnh","Word","kéo khung","hoa văn","miễn phí","không bị gửi đi đâu","trên máy anh chị","góp ý","cảm nhận","cảm ơn","sợ sai","mỏi tay","sửa tên"]
def hl(t):
    s=E(t)
    for k in KW: s=re.sub("("+re.escape(k)+")",r'<b class="k">\1</b>',s,flags=re.I)
    return s
body=[]; js=[]; mix=[]
INTRO=5.0; SW=4.5
V={}; t=INTRO+0.2
for k in ["E1","E2","E3","E4","E5"]:
    V[k]=t; t+=A[k]+0.4
SE=V["E5"]+A["E5"]+0.8
# ---------- plan ----------
P={ "E1":[([0,1],"panelA","dom-09-suy-nghi","SỬA TAY TỪNG CHỖ"),
          ([2],("s1",[(0.6,6.9)]),"dom-02-chi-phai","BẮT ĐẦU · BỘ VÍ DỤ CÓ SẴN")],
    "E2":[([0],("s2",[(1.0,4.9)]),"dom-02-chi-phai","BƯỚC 1–2 · FILE MẪU + DANH SÁCH"),
          ([1],("s2",[(5.6,10.2)]),"dom-14-tai-lieu","FILE MẪU · TÊN CỘT TRONG [ ]"),
          ([2],("s2",[(10.6,12.4)]),"dom-03-chi-xuong","BƯỚC 2 · DANH SÁCH 8 NHÂN VIÊN"),
          ([3],("s2",[(15.2,18.6)]),"dom-13-xu-ly","BƯỚC 3 · GHÉP TRƯỜNG"),
          ([4],("s2",[(18.5,21.3),(24.6,27.0)]),"dom-02-chi-phai","KÉO THẢ · ĐỊNH DẠNG NGÀY, SỐ TIỀN")],
    "E3":[([0],("s3",[(2.4,4.0),(6.0,9.6)]),"dom-20-danh-gia","BƯỚC 4 · XEM THỬ TỪNG BẢN"),
          ([1],("s3s4",[("s3",15.8,17.0),("s4",2.0,6.0)]),"dom-02-chi-phai","BƯỚC 5 · XUẤT FILE"),
          ([2],("s4",[(10.0,10.9)]),"dom-19-hoan-thanh","XONG RỒI!"),
          ([3],"panelD","dom-19-hoan-thanh","THÀNH PHẨM · 8 PHIẾU LƯƠNG")],
    "E4":[([0,1],"panelC","dom-01-chao","WORD · EXCEL · PDF · ẢNH"),
          ([2],("s5",[(4.0,5.4),(19.9,23.4),(36.9,40.3)]),"dom-14-tai-lieu","MẪU BẢN SCAN · KÉO KHUNG"),
          ([3],("s6",[(20.0,21.8),(38.0,40.8)]),"dom-18-tai-len","THƯ MỜI DẠNG ẢNH"),
          ([4],("s1",[(0.6,4.4)]),"dom-10-vui","XỬ LÝ NGAY TRÊN MÁY BẠN")],
    "E5":[([0,1],"panelE","dom-21-cam-on","HÃY THỬ & CHIA SẺ CÙNG ĐỐM")]}
SRC={"s1":"web/s1-trang-dau.mp4","s2":"web/s2-ghep.mp4","s3":"web/s3-xemthu.mp4","s4":"web/s4-xuat.mp4","s5":"web/s5-scan.mp4","s6":"web/s6-thiep.mp4"}
groups=[]   # dict: id,start,D,layer,pose,label,sentences,eid
for k in ["E1","E2","E3","E4","E5"]:
    S=sents(TXT[k]); print(k,len(S),[x[:20] for x in S])
    w=[wlen(x) for x in S]; tot=sum(w); acc=0; st=[]
    for i,x in enumerate(S): st.append((V[k]+acc/tot*A[k], V[k]+(acc+w[i])/tot*A[k])); acc+=w[i]
    for gi,(idx,layer,pose,label) in enumerate(P[k]):
        a=st[idx[0]][0]; b=st[idx[-1]][1]
        groups.append(dict(id=f"g{len(groups)}",start=a,end=b,layer=layer,pose=pose,label=label,k=k,S=[(S[i],st[i][0],st[i][1]) for i in idx]))
# nối kín: mỗi nhóm kéo tới đầu nhóm sau
for i,g in enumerate(groups):
    g["end"]= groups[i+1]["start"] if i+1<len(groups) else SE
groups[0]["start"]=SW
# ---------- cắt clip ----------
os.makedirs("assets/v",exist_ok=True)
def cut(g):
    lay=g["layer"]
    if not isinstance(lay,tuple): return None
    D=g["end"]-g["start"]+0.25
    segs=[(lay[0],a,b) for a,b in lay[1]] if lay[0]!="s3s4" else lay[1]
    tmp=[]
    for j,(s,a,b) in enumerate(segs):
        f=f"/tmp/v02/seg_{g['id']}_{j}.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-ss",str(a),"-t",str(b-a),"-i",SRC[s],"-vf","fps=30,format=yuv420p","-an","-c:v","libx264","-crf","14","-preset","fast",f],check=True); tmp.append(f)
    open(f"/tmp/v02/l_{g['id']}.txt","w").write("\n".join(f"file '{x}'" for x in tmp))
    raw=sum(b-a for _,a,b in segs); fct=raw/D
    out=f"assets/v/{g['id']}.mp4"
    subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",f"/tmp/v02/l_{g['id']}.txt","-vf",f"setpts=PTS/{fct:.4f},tpad=stop_mode=clone:stop_duration=2,trim=duration={D:.3f},fps=30,format=yuv420p","-an","-c:v","libx264","-crf","15","-preset","fast",out],check=True)
    print(f"{g['id']} {g['k']} {lay[0]} D={D:.2f} x{fct:.2f}"+("  <<< NHANH" if fct>1.65 else ""))
    return D,fct,segs
info={}
for g in groups: info[g["id"]]=cut(g)
# ---------- HTML ----------
NAMES=["Nguyễn Văn An","Trần Thị Bích Ngọc","Lê Hoàng Minh","Phạm Thu Hà","Võ Quốc Bảo","Đặng Ngọc Ánh","Huỳnh Đức Thịnh","Bùi Thị Mai Phương"]
FILES=["Nguyen_Van_An","Tran_Thi_Bich_Ngoc","Le_Hoang_Minh","Pham_Thu_Ha","Vo_Quoc_Bao","Dang_Ngoc_Anh","Huynh_Duc_Thinh","Bui_Thi_Mai_Phuong"]
layers=[]; pills=[]; doms=[]
for g in groups:
    i=g["id"]; lay=g["layer"]
    if isinstance(lay,tuple):
        D=info[i][0]
        inner=f'<video id="{i}v" class="clip" muted playsinline data-start="{R(g["start"])}" data-duration="{R(D)}" data-track-index="{4+int(i[1:])%2}" src="assets/v/{i}.mp4"></video>'
    elif lay=="panelA":
        pile="".join(f'<img class="pp" src="assets/img/phieu-an.png" style="--r:{r}deg;--x:{x}px;--y:{y}px">' for r,x,y in [(-7,-70,30),(5,60,40),(-3,-20,50)])
        inner=(f'<div class="pa">{pile}<img class="paper" src="assets/img/phieu-an.png"><div class="edit" id="edit">{NAMES[0]}</div>'
               '<div class="stamp" id="stamp">SAI TÊN!</div><div class="cnt" id="cnt">Sửa lần 1</div></div>')
    elif lay=="panelC":
        tiles=[("assets/img/phieu-an.png","WORD","docx","top"),("assets/img/xlsx-crop.png","EXCEL","xlsx","center"),("assets/img/cert.jpg","PDF · BẢN SCAN","pdf","center"),("assets/img/thiep.jpg","ẢNH THIỆP MỜI","png","top")]
        inner='<div class="pc">'+"".join(f'<div class="tile" id="t{j}"><div class="timg" style="background-image:url({s});background-position:{pos};{'background-size:contain;background-repeat:no-repeat;background-color:#faf7f0' if e=='xlsx' else ''}"></div><div class="tlab"><b>{l}</b><span>.{e}</span></div></div>' for j,(s,l,e,pos) in enumerate(tiles))+'</div>'
    elif lay=="panelD":
        inner=('<div class="pd"><div class="fhead"><span class="fic">📁</span><b>VanBan</b><span class="fcnt">8 file · Word .docx</span></div><div class="fgrid">'
               +"".join(f'<div class="fi" id="f{j}"><img src="assets/img/mau-phieu-luong_{FILES[j]}-1.png"><div class="fn">mau-phieu-luong_{FILES[j]}.docx</div></div>' for j in range(8))+'</div></div>')
    elif lay=="panelE":
        inner=('<div class="pe"><img class="bg" src="assets/img/s1-last.jpg"><div class="shade"></div><div class="chips">'
               '<div class="chip" id="c0"><i>1</i>Thử trải nghiệm</div><div class="chip" id="c1"><i>2</i>Chia sẻ cảm nhận cho Đốm</div><div class="chip" id="c2"><i>3</i>Góp ý để cải thiện tính năng</div></div></div>')
    extra=""
    if i==groups[-1]["id"]: pass
    layers.append(f'<div class="sv" id="{i}w" style="opacity:0">{inner}{extra}</div>')
    pills.append(f'<div class="pill" id="{i}t" style="opacity:0">{E(g["label"])}</div>')
    doms.append(f'<img id="{i}p" src="assets/img/{g["pose"]}-toi.png" style="opacity:0">')
# phụ đề
def sub(text,a,b,cls="sub dsub"):
    body.append(f'<div class="clip {cls}" data-start="{R(a)}" data-duration="{R(max(b-a,0.2))}" data-track-index="9"><span>{text}</span></div>')
for k in ["E1","E2","E3","E4","E5"]:
    S=sents(TXT[k]); w=[wlen(x) for x in S]; tot=sum(w); acc=0
    for i,x in enumerate(S):
        a=V[k]+acc/tot*A[k]; acc+=w[i]; b=V[k]+acc/tot*A[k]
        words=x.split()
        parts=[x] if len(words)<=8 else [" ".join(words[:(len(words)+1)//2])," ".join(words[(len(words)+1)//2:])]
        pw=[wlen(p) for p in parts]; pt=sum(pw); pa=0
        for p,q in zip(parts,pw):
            s0=a+pa/pt*(b-a); pa+=q; e0=a+pa/pt*(b-a)
            sub(hl(p),s0,min(e0+0.05,b+0.3 if k!="E5" or True else e0))
body.append('<video id="intro" class="clip full" muted playsinline data-start="0" data-duration="5" data-track-index="1" src="assets/v/mo-dau.mp4"></video>')
body.append('<div class="scene webs" id="pw" style="opacity:0"><div class="glowbg"></div>'+"".join(pills)+
  '<div class="card" id="pwc"><div class="bar"><i></i><i></i><i></i><span>quantritute.com/cong-cu</span></div><div class="zw2">'+"".join(layers)+
  f'</div><div class="note" id="note" style="opacity:0">Số liệu minh họa</div></div><div class="dom small" id="pwd"><div class="glow"></div>'+"".join(doms)+'</div></div>')
body.append(f'<div class="scene" id="outro" style="opacity:0"><video id="ketv" class="clip full" muted playsinline data-start="{R(SE)}" data-duration="7" data-track-index="5" src="assets/v/ket.mp4"></video></div>')
mix+=[("sfx/click.wav",1.05,0.6),("sfx/sparkle.wav",1.2,0.4)]
js+=[f'tl.to("#pw",{{opacity:1,duration:0.45}},{R(SW)});', f'tl.fromTo("#pwc",{{y:80,scale:0.94}},{{y:0,scale:1,duration:0.6,ease:"power3.out"}},{R(SW)});',
     f'tl.fromTo("#pwd",{{opacity:0,scale:0.4,y:60}},{{opacity:1,scale:1,y:0,duration:0.5,ease:"back.out(2)"}},{R(SW+0.2)});',
     f'tl.to("#pwd img",{{y:-12,rotation:5,duration:0.7,repeat:{int((SE-SW)/0.7)},yoyo:true,ease:"sine.inOut"}},{R(SW+0.7)});']
for j,g in enumerate(groups):
    i=g["id"]; s=g["start"]
    js+=[f'tl.to("#{i}w",{{opacity:1,duration:0.2}},{R(s)});', f'tl.to("#{i}p",{{opacity:1,duration:0.25}},{R(s)});',
         f'tl.fromTo("#{i}t",{{opacity:0,y:-14}},{{opacity:1,y:0,duration:0.35,ease:"power2.out"}},{R(s+0.1)});']
    if j:
        pv=groups[j-1]["id"]
        js+=[f'tl.to("#{pv}w",{{opacity:0,duration:0.2}},{R(s+0.2)});', f'tl.to("#{pv}p",{{opacity:0,duration:0.25}},{R(s)});', f'tl.to("#{pv}t",{{opacity:0,duration:0.2}},{R(s)});']
        mix.append(("sfx/whoosh.wav",s-0.15,0.18))
# ghi chú "số liệu minh họa": từ nhóm E2 đầu đến hết thư mục
ns=[g for g in groups if g["k"] in("E2","E3")]
js+=[f'tl.to("#note",{{opacity:1,duration:0.3}},{R(ns[0]["start"]+0.3)});', f'tl.to("#note",{{opacity:0,duration:0.3}},{R(ns[-1]["end"]-0.1)});']
# panel A hoạt họa
gA=groups[0]; a0=gA["start"]+0.5
n=0; tt=a0
js.append(f'tl.fromTo(".pa .paper",{{y:30,opacity:0}},{{y:0,opacity:1,duration:0.5,ease:"power3.out"}},{R(gA["start"]+0.1)});')
js.append(f'tl.fromTo(".pa .pp",{{opacity:0,scale:0.9}},{{opacity:1,scale:1,duration:0.5,stagger:0.12}},{R(gA["start"]+0.3)});')
tend=gA["end"]-0.9
k=0
while tt<tend:
    js.append(f'tl.set("#edit",{{textContent:{json.dumps(NAMES[k%8],ensure_ascii=False)}}},{R(tt)});')
    n=min(50,int(1+ (tt-a0)/(tend-a0)*49)); js.append(f'tl.set("#cnt",{{textContent:"Sửa lần {n}"}},{R(tt)});')
    tt+=0.27; k+=1
js.append(f'tl.fromTo("#stamp",{{opacity:0,scale:2.2,rotation:-18}},{{opacity:1,scale:1,rotation:-12,duration:0.28,ease:"back.out(2.5)"}},{R(gA["S"][1][1]+0.25)});')
mix.append(("sfx/pop.wav",gA["S"][1][1]+0.25,0.5))
# panel C
gC=[g for g in groups if g["layer"]=="panelC"][0]
for j in range(4):
    ts=gC["start"]+0.3+j*(gC["end"]-gC["start"]-0.9)/4
    js.append(f'tl.fromTo("#t{j}",{{opacity:0,scale:0.6,y:50}},{{opacity:1,scale:1,y:0,duration:0.45,ease:"back.out(2)"}},{R(ts)});'); mix.append(("sfx/pop.wav",ts,0.35))
# panel D
gD=[g for g in groups if g["layer"]=="panelD"][0]
js.append(f'tl.fromTo(".fhead",{{opacity:0,y:-20}},{{opacity:1,y:0,duration:0.4}},{R(gD["start"]+0.05)});')
for j in range(8):
    ts=gD["start"]+0.35+j*0.2
    js.append(f'tl.fromTo("#f{j}",{{opacity:0,scale:0.7,y:40}},{{opacity:1,scale:1,y:0,duration:0.4,ease:"back.out(2)"}},{R(ts)});'); mix.append(("sfx/pop.wav",ts,0.22))
# panel E
gE=groups[-1]
for j in range(3):
    ts=gE["start"]+0.4+j*0.9
    js.append(f'tl.fromTo("#c{j}",{{opacity:0,x:-80}},{{opacity:1,x:0,duration:0.5,ease:"power3.out"}},{R(ts)});')
js.append(f'tl.fromTo(".pe .bg",{{scale:1.0}},{{scale:1.08,duration:{R(gE["end"]-gE["start"])},ease:"none"}},{R(gE["start"])});')
mix.append(("sfx/sparkle.wav",gE["start"]+A["E5"]-1.6,0.4))
# click s1 + done
g1=groups[1]; fct1=info[g1["id"]][1]; mix.append(("sfx/click.wav",g1["start"]+(4.74-0.6)/fct1,0.7))
js+=[f'tl.to("#outro",{{opacity:1,duration:0.5}},{R(SE)});', f'tl.set("#pw",{{opacity:0}},{R(SE+0.55)});']
mix+=[("sfx/pop.wav",SE+0.3,0.35),("sfx/whoosh.wav",SE+3.95,0.4),("sfx/click.wav",SE+4.88,0.7)]
for k in V: mix.append((f"assets/a/{k}.wav",V[k],1.15))
mix+=[("sfx/whoosh.wav",SW-0.4,0.3)]
TOTAL=SE+7.0
tpl=open("/home/claude/v02/xuong-video/tap/v01-tro-lai-cung-dom/dung/template3.html",encoding="utf-8").read()
EXTRA='''
.pill{position:absolute;left:40px;right:40px;top:62px;text-align:center;z-index:12}
.pill{display:block}
.pill{font-weight:800;font-size:34px;letter-spacing:1.5px;color:#2a1d10}
.pill{width:auto;left:50%;right:auto;transform:translateX(-50%);white-space:nowrap;background:#f2b866;padding:12px 34px;border-radius:40px;box-shadow:0 8px 30px rgba(242,184,102,.35);margin-left:0}
.note{position:absolute;right:22px;top:62px;font-weight:800;font-size:24px;color:#d3261a;background:rgba(255,255,255,.9);padding:6px 16px;border-radius:12px;z-index:5}
.pa{position:absolute;inset:0;background:#e9e1d3;overflow:hidden}
.pa .paper,.pa .pp{position:absolute;left:132px;top:47px;height:1040px;width:735px;box-shadow:0 14px 40px rgba(0,0,0,.28);background:#fff}
.pa .pp{transform:translate(var(--x),var(--y)) rotate(var(--r))}
.edit{position:absolute;left:296px;top:246px;min-width:185px;height:30px;line-height:30px;padding:0 10px;background:#fff3a8;border:2px solid #d99a00;font-weight:700;font-size:20px;color:#2a1d10;white-space:nowrap;z-index:4}
.stamp{position:absolute;right:120px;top:420px;font-weight:800;font-size:92px;color:#d3261a;border:10px solid #d3261a;border-radius:20px;padding:6px 30px;transform:rotate(-12deg);background:rgba(255,255,255,.55);z-index:6;opacity:0}
.cnt{position:absolute;left:30px;top:30px;font-weight:800;font-size:44px;color:#fff;background:#8a4b12;padding:10px 26px;border-radius:16px;z-index:6}
.pc{position:absolute;inset:0;background:#efe9df}
.tile{position:absolute;width:450px;height:520px;background:#fff;border-radius:22px;box-shadow:0 12px 36px rgba(0,0,0,.22);overflow:hidden;opacity:0}
.tile:nth-child(1){left:30px;top:70px}.tile:nth-child(2){left:520px;top:70px}.tile:nth-child(3){left:30px;top:610px}.tile:nth-child(4){left:520px;top:610px}
.timg{position:absolute;left:0;right:0;top:0;bottom:78px;background-size:cover}
.tlab{position:absolute;left:0;right:0;bottom:0;height:78px;background:#2a1d10;display:flex;align-items:center;justify-content:space-between;padding:0 26px}
.tlab b{font-size:30px;color:#f2b866;font-weight:800}.tlab span{font-size:26px;color:#fbeedb;font-family:monospace}
.pd{position:absolute;inset:0;background:#efe9df}
.fhead{position:absolute;left:30px;right:30px;top:62px;height:92px;background:#fff;border-radius:18px;display:flex;align-items:center;gap:18px;padding:0 28px;box-shadow:0 6px 20px rgba(0,0,0,.15);color:#2a1d10}
.fhead .fic{font-size:44px}.fhead b{font-size:40px;font-weight:800}.fhead .fcnt{margin-left:auto;font-size:28px;color:#8a4b12;font-weight:700}
.fgrid{position:absolute;left:30px;right:30px;top:185px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px 18px}
.fi{background:#fff;border-radius:14px;padding:10px 10px 12px;box-shadow:0 6px 20px rgba(0,0,0,.18);opacity:0}
.fi img{width:100%;height:340px;object-fit:cover;object-position:top;display:block;border:1px solid #ddd}
.fn{margin-top:10px;font-size:15px;line-height:1.25;color:#2a1d10;word-break:break-all;font-family:monospace;min-height:38px}
.pe{position:absolute;inset:0;overflow:hidden;background:#efe9df}
.pe .bg{position:absolute;left:0;top:0;width:1000px;height:1134px;object-fit:cover;filter:blur(5px) saturate(.9);transform-origin:50% 40%}
.pe .shade{position:absolute;inset:0;background:rgba(239,233,223,.72)}
.chips{position:absolute;left:60px;right:60px;top:240px;display:flex;flex-direction:column;gap:42px}
.chip{display:flex;align-items:center;gap:26px;background:#fff;border-radius:28px;padding:30px 36px;font-weight:800;font-size:46px;color:#2a1d10;box-shadow:0 14px 40px rgba(0,0,0,.2);border-left:14px solid #B06A22;opacity:0}
.chip i{font-style:normal;width:72px;height:72px;border-radius:50%;background:#B06A22;color:#fff;display:flex;align-items:center;justify-content:center;font-size:42px;flex:none}
'''
page=tpl.replace("{{TOTAL}}",str(R(TOTAL))).replace("{{BODY}}","\n".join(body)).replace("{{JS}}","\n".join(js)).replace("</style>",EXTRA+"</style>")
open("/home/claude/v02/hf-main/index.html","w",encoding="utf-8").write(page)
json.dump({"total":TOTAL,"mix":mix,"SE":SE,"SW":SW,"V":V},open("mix.json","w"),indent=1)
print("TOTAL",R(TOTAL),"SE",R(SE),{k:R(v) for k,v in V.items()})
