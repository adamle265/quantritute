import sys
common = """
<link rel=stylesheet href=lx700.css><link rel=stylesheet href=lx600.css><link rel=stylesheet href=mono.css>
<style>
*{margin:0;box-sizing:border-box}
body{width:var(--W);height:var(--H);overflow:hidden;position:relative;font-family:'Lexend',sans-serif}
.t{font-weight:700;text-transform:uppercase;letter-spacing:.01em;line-height:1.08}
.t em{font-style:normal;color:var(--acc)}
.sub{font-family:'IBM Plex Mono',monospace;font-size:var(--sf);letter-spacing:.01em}
.pill{display:inline-block;background:var(--acc);color:#231E19;font-weight:700;border-radius:999px;text-transform:uppercase}
.abs{position:absolute}
</style>"""
def page(W,H,css,body):
    return f"<!doctype html><meta charset=utf-8>{common}<style>:root{{--W:{W}px;--H:{H}px}}{css}</style><body>{body}"
V=lambda s,h: s if True else h
out={}
for k,(W,H) in {'doc':(1080,1920),'ngang':(1280,720)}.items():
    v = k=='doc'
    f = (lambda a,b: a if v else b)
    # A: den vua sang (anh ban lam viec toi + Dom)
    out[f'A-{k}']=page(W,H,f"""
:root{{--acc:#EBB25B;--sf:{f(34,22)}px}}
body{{background:#141210 url(desk-on.jpg) {f('50% 62%','50% 40%')}/{f('auto 118%','cover')}}}
.sh{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,18,16,.88),rgba(20,18,16,.25) 45%,rgba(20,18,16,.55))}}
.t{{color:#F6EEDF;font-size:{f(128,84)}px;text-shadow:0 4px 30px rgba(0,0,0,.5)}}
""",f"""<div class=sh></div>
<div class='abs' style="left:{f(70,70)}px;top:{f(150,70)}px;right:{f(60,0)}px"><div class=t>Trở lại<br>cùng <em>Đốm</em></div>
<div class=sub style="color:#D9CDB8;margin-top:{f(36,22)}px">Một người bạn nhỏ cùng ứng dụng công nghệ số</div></div>
<img class=abs src=dom-01-chao-toi.png style="width:{f(560,430)}px;{f('left:260px;top:880px','right:150px;top:190px')}">""")
    # B: tuong sang
    out[f'B-{k}']=page(W,H,f"""
:root{{--acc:#D98A2B;--sf:{f(34,22)}px}}
body{{background:radial-gradient(circle at 50% 55%,#FBF7EE,#F4EFE5 60%,#EAE2D2)}}
.t{{color:#231E19;font-size:{f(132,88)}px}}.sub{{color:#6A6157}}
""",f"""<div class=abs style="left:{f(70,80)}px;top:{f(170,150)}px"><div class=t>Trở lại<br>cùng <em>Đốm</em></div>
<div class=sub style="margin-top:{f(36,24)}px">Một người bạn nhỏ cùng ứng dụng công nghệ số</div></div>
<img class=abs src=dom-01-chao-sang.png style="width:{f(760,470)}px;{f('left:160px;top:700px','right:90px;top:130px')}">
<img class=abs src=logo-ngang-nen-sang.png style="width:{f(440,250)}px;{f('left:320px;bottom:230px','left:80px;bottom:55px')}">""")
    # C: Dom mot minh trong bong toi
    out[f'C-{k}']=page(W,H,f"""
:root{{--acc:#EBB25B;--sf:{f(34,22)}px}}
body{{background:radial-gradient(circle at 50% {f(52,50)}%,#4a3216 0,#241a10 28%,#141210 62%)}}
.t{{color:#ECE6DB;font-size:{f(96,66)}px;text-align:center}}.sub{{color:#B5AC9F;text-align:center}}
""",f"""<div class=abs style="left:0;right:0;top:{f(190,70)}px"><div class=t>Trở lại cùng <em>Đốm</em></div></div>
<img class=abs src=dom-10-vui-toi.png style="width:{f(740,480)}px;left:{f(170,400)}px;top:{f(480,170)}px">
<div class=abs style="left:0;right:0;bottom:{f(430,70)}px"><div class=sub>Một người bạn nhỏ cùng ứng dụng công nghệ số</div></div>""")
    # D: dong series (giong thumb v03): nen nau toi, tieu de trang, pill
    out[f'D-{k}']=page(W,H,f"""
:root{{--acc:#EBB25B;--sf:{f(34,22)}px}}
body{{background:#1b130b}}
.t{{color:#fff;font-size:{f(150,96)}px;text-align:center}}
.pill{{font-size:{f(46,30)}px;padding:{f(30,18)}px {f(70,44)}px}}
""",f"""<div class=abs style="left:0;right:0;top:{f(190,60)}px"><div class=t>Trở lại<br>cùng <em>Đốm</em></div></div>
<img class=abs src=dom-01-chao-toi.png style="width:{f(720,380)}px;left:{f(180,450)}px;top:{f(720,300)}px">
<div class=abs style="left:0;right:0;text-align:center;bottom:{f(260,50)}px"><span class=pill>Người bạn mới của kênh</span></div>""")
for n,h in out.items(): open(n+'.html','w').write(h)
