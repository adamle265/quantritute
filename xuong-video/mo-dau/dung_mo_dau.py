# Dựng đoạn MỞ ĐẦU và KẾT chuẩn của kênh Quản trị tử tế (HyperFrames).
#   python dung_mo_dau.py "TIÊU ĐỀ VIDEO" <thư mục dự án>  -> ghi index-mo-dau.html, index-ket.html
# Ảnh bàn làm việc giống trang chủ web: desk-off/desk-on 2752x1536, màn hình laptop chiếu trang Bộ công cụ
import sys, html
TITLE = sys.argv[1]; P = sys.argv[2]
S = 1920 / 1536                 # phóng ảnh để cao đúng 1920
LX, LY, LW, LH = 1037, 847, 680, 417   # màn hình laptop trên ảnh gốc (đo ở app.js v1.14)
CX = 1377                       # căn giữa khung dọc theo tâm laptop
OFF = round(540 - CX * S)
def lap(): return (f'<div class="lap" style="left:{round(OFF+LX*S)}px;top:{round(LY*S)}px;width:{round(LW*S)}px;height:{round(LH*S)}px">'
                   '<div class="bar"><i></i><i></i><i></i><span>quantritute.com/cong-cu</span></div>'
                   '<div class="sl"><img id="scr" src="assets/img/bo-cong-cu.jpg"></div><span class="glare"></span></div>'
                   f'<span class="lglow" id="lglow" style="left:{round(OFF+(LX-160)*S)}px;top:{round((LY+60)*S)}px;width:{round((LW+320)*S)}px;height:{round((LH+300)*S)}px"></span>')
def title_html(t):
    t = html.escape(t).replace("&amp;", '<b class="amp">&amp;</b>').replace("|", "<br>")
    return t
CSS = open(f"{P}/style-mo-dau.css", encoding="utf-8").read() if False else ""
HEAD = '''<!doctype html><html lang="vi" data-resolution="portrait"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="assets/gsap.min.js"></script><link rel="stylesheet" href="assets/mo-dau.css"></head><body>'''
def page(kind, dur, body, js):
    return (HEAD + f'<div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1080" data-height="1920">{body}</div>'
            '<script>const tl=gsap.timeline({paused:true});' + "\n".join(js) + f'tl.set({{}},{{}},{dur});window.__timelines=window.__timelines||{{}};window.__timelines["main"]=tl;tl.seek(0);</script></body></html>')
desk = (f'<div class="desk" id="desk"><img class="ph" id="off" src="assets/img/desk-off.jpg" style="left:{OFF}px">'
        f'<img class="ph" id="on" src="assets/img/desk-on.jpg" style="left:{OFF}px">{lap()}<div class="cord" id="cord" style="left:{round(OFF+1640*S)}px"></div></div>'
        '<div class="vig"></div>')
# ---- MỞ ĐẦU 5 giây ----
D = 5.0
body = desk + ('<div class="brand" id="brand"><img src="assets/img/logo-ngang-nen-sang.png"></div>'
               f'<div class="ttl" id="ttl"><span id="ttl-in">{title_html(TITLE)}</span></div><div class="line" id="line"></div>')
js = ['gsap.set("#on",{opacity:0});gsap.set(["#brand","#ttl","#line"],{opacity:0});',
      'tl.fromTo("#desk",{scale:1.06},{scale:1.0,duration:5,ease:"power1.out"},0);',
      'tl.to("#cord",{y:26,duration:0.12,ease:"power2.in"},1.05);tl.to("#cord",{y:0,duration:0.25,ease:"back.out(3)"},1.17);'] + \
     [f'tl.set("#on",{{opacity:{v}}},{1.2 + i * 0.07:.2f});' for i, v in enumerate([.75, .1, .9, .35, 1])] + \
     ['tl.to("#lglow",{opacity:0,duration:0.6},1.3);',
      'tl.fromTo("#brand",{opacity:0,y:24,scale:0.96},{opacity:1,y:0,scale:1,duration:0.7,ease:"power3.out"},1.75);',
      'tl.fromTo("#ttl",{opacity:0,y:30,scale:0.94},{opacity:1,y:0,scale:1,duration:0.9,ease:"power3.out"},2.25);',
      'tl.fromTo("#line",{opacity:1,scaleX:0},{scaleX:1,duration:0.7,ease:"power2.inOut"},2.6);',
      'tl.fromTo("#scr",{y:0},{y:-60,duration:3.5,ease:"sine.inOut"},1.4);']
open(f"{P}/index.html", "w", encoding="utf-8").write(page("mo", D, body, js))
# ---- KẾT 7 giây: tường sáng (không laptop) + Đốm + lời mời -> Đốm bay kéo dây tắt đèn -> tối ----
D2 = 7.0
K = 2.4; KX = 1377; KOFF = round(540 - KX * K)   # phóng phần tường phía trên laptop cho kín khung dọc
CORDX = 800
wall = (f'<div class="desk" id="wall"><img class="ph2" id="off2" src="assets/img/desk-off.jpg" style="left:{KOFF}px;height:{round(1536*K)}px">'
        f'<img class="ph2" id="on2" src="assets/img/desk-on.jpg" style="left:{KOFF}px;height:{round(1536*K)}px"></div>'
        f'<div class="cord2" id="cord2" style="left:{CORDX}px"><i></i></div><div class="vig"></div>')
body2 = wall + ('<div class="klogo" id="klogo"><img src="assets/img/logo-ngang-nen-sang.png"></div>'
        '<div class="kdom" id="kdom"><div class="kglow"></div><img id="kd1" src="assets/img/dom-01-chao-sang.png"><img id="kd2" src="assets/img/dom-10-vui-sang.png"><img id="kd3" src="assets/img/dom-12-ngu-toi.png"></div>'
        '<div class="cta" id="cta"><span class="fbtn"><svg viewBox="0 0 24 24"><path d="M15 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19 4v6M16 7h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>Follow</span>'
        '<div class="cta-t">&amp; Đồng hành cùng Đốm nhé!</div></div>'
        '<div class="thx" id="thx">Cảm ơn anh chị! <span class="heart">♥</span></div><div class="black" id="black"></div>')
js2 = ['gsap.set(["#off2"],{opacity:1});gsap.set("#black",{opacity:0});gsap.set(["#kd2","#kd3"],{opacity:0});',
       'tl.fromTo("#wall",{scale:1.04},{scale:1.0,duration:7,ease:"none"},0);',
       'tl.fromTo("#klogo",{opacity:0,y:-20},{opacity:1,y:0,duration:0.6,ease:"power3.out"},0.1);',
       'tl.fromTo("#kdom",{opacity:0,scale:0.5,y:60},{opacity:1,scale:1,y:0,duration:0.7,ease:"back.out(1.8)"},0.25);',
       'tl.to("#kd1",{rotation:-8,duration:0.32,repeat:5,yoyo:true,ease:"sine.inOut"},0.9);',
       'tl.fromTo("#cta",{opacity:0,y:40},{opacity:1,y:0,duration:0.6,ease:"power3.out"},0.8);',
       'tl.fromTo(".fbtn",{scale:0.6},{scale:1,duration:0.5,ease:"back.out(3)"},0.85);',
       'tl.to(".fbtn",{scale:1.08,duration:0.25,repeat:3,yoyo:true,ease:"sine.inOut"},1.6);',
       'tl.fromTo("#thx",{opacity:0,y:30},{opacity:1,y:0,duration:0.6,ease:"power3.out"},1.9);',
       # Đốm bay lên kéo dây
       'tl.to("#kd1",{opacity:0,duration:0.2},3.9);tl.to("#kd2",{opacity:1,duration:0.2},3.9);',
       f'tl.to("#kdom",{{x:{CORDX-540},y:-410,scale:0.5,duration:0.85,ease:"power2.inOut"}},3.95);',
       'tl.to("#kdom",{y:-380,duration:0.18,ease:"power2.in"},4.85);tl.to("#cord2",{y:30,duration:0.18,ease:"power2.in"},4.85);',
       'tl.to("#kdom",{y:-410,duration:0.3,ease:"back.out(2)"},5.05);tl.to("#cord2",{y:0,duration:0.3,ease:"back.out(3)"},5.05);'] + \
      [f'tl.set("#on2",{{opacity:{v}}},{5.05 + i * 0.07:.2f});' for i, v in enumerate([0.3, 0.8, 0.1, 0])] + \
      ['tl.to(["#klogo","#cta","#thx"],{opacity:0,duration:0.35},5.05);',
       'tl.to("#kd2",{opacity:0,duration:0.3},5.3);tl.to("#kd3",{opacity:1,duration:0.3},5.3);',
       'tl.to("#kdom",{opacity:0,duration:0.9,ease:"power1.in"},5.9);',
       'tl.to("#black",{opacity:1,duration:0.9,ease:"power1.in"},6.0);']
open(f"{P}/ket.html", "w", encoding="utf-8").write(page("ket", D2, body2, js2))
print("ok", OFF)
