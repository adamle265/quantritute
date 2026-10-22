import asyncio, base64, os, subprocess, shutil, time, json
from playwright.async_api import async_playwright
BASE="http://localhost:8790"; OUT="/tmp/v01/web"; VW,VH,DPR=1280,800,1.5
CUR=r"""(()=>{if(document.getElementById('__cur'))return;const s=document.createElement('style');s.textContent=`#__cur{position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(60,40,20,.9);box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:transform .12s}.__rip{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e8a33c;z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}@keyframes __r{to{transform:scale(2.8);opacity:0}}mark.__hl{background:linear-gradient(transparent 55%,rgba(242,184,102,.8) 55%);color:inherit}`;document.head.appendChild(s);const c=document.createElement('div');c.id='__cur';document.body.appendChild(c);
window.__cur={x:-50,y:-50,set(x,y){this.x=x;this.y=y;c.style.left=x+'px';c.style.top=y+'px'},tap(){c.style.transform='scale(.7)';setTimeout(()=>c.style.transform='',150);const r=document.createElement('div');r.className='__rip';r.style.left=this.x+'px';r.style.top=this.y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),650)}};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="http"]');if(a)e.preventDefault()},true);window.open=()=>null;})()"""
class Rec:
    def __init__(s,p): s.p=p
    async def start(s,name):
        s.name=name; s.dir=f"{OUT}/{name}"; shutil.rmtree(s.dir,ignore_errors=True); os.makedirs(s.dir); s.frames=[]; s.marks={}
        s.cdp=await s.p.context.new_cdp_session(s.p); s.cdp.on("Page.screencastFrame",s._on)
        await s.cdp.send("Page.startScreencast",{"format":"jpeg","quality":90,"maxWidth":int(VW*DPR),"maxHeight":int(VH*DPR)}); await asyncio.sleep(0.4)
    def _on(s,f):
        fn=f"{s.dir}/{len(s.frames):05d}.jpg"; open(fn,"wb").write(base64.b64decode(f["data"])); s.frames.append((f["metadata"]["timestamp"],fn))
        asyncio.ensure_future(s.cdp.send("Page.screencastFrameAck",{"sessionId":f["sessionId"]}))
    def mark(s,k): s.marks[k]=round(time.time()-s.frames[0][0],2)
    async def stop(s):
        await asyncio.sleep(0.3); end=time.time(); await s.cdp.send("Page.stopScreencast"); await s.cdp.detach()
        fr=s.frames; L=[]
        for k,(ts,fn) in enumerate(fr):
            nx=fr[k+1][0] if k+1<len(fr) else max(end,ts+0.04); L+= [f"file '{fn}'",f"duration {max(nx-ts,0.001):.4f}"]
        L.append(f"file '{fr[-1][1]}'"); open(f"{s.dir}/l.txt","w").write("\n".join(L))
        out=f"{OUT}/{s.name}.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",f"{s.dir}/l.txt","-vf","fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p","-c:v","libx264","-crf","16",out],check=True)
        shutil.rmtree(s.dir); d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out]))
        print(s.name,round(d,2),s.marks); return {"dur":d,**s.marks}
async def cur(p): await p.evaluate(CUR)
async def move(p,x,y,ms=600):
    await cur(p); x0,y0=await p.evaluate("[__cur.x,__cur.y]")
    if x0<0: x0,y0=x+120,y+160
    n=max(int(ms/16),1)
    for i in range(1,n+1):
        t=i/n;e=t*t*(3-2*t); await p.evaluate(f"__cur.set({x0+(x-x0)*e},{y0+(y-y0)*e})"); await asyncio.sleep(ms/1000/n)
async def ctr(loc):
    b=await loc.bounding_box(); return b["x"]+b["width"]/2,b["y"]+b["height"]/2
async def tap(p,loc,ms=600,click=True,hover=False):
    x,y=await ctr(loc); await move(p,x,y,ms); await asyncio.sleep(0.12)
    if hover: await p.mouse.move(x,y); return
    await p.evaluate("__cur.tap()")
    if click: await loc.click(force=True); await p.mouse.move(2,2)
async def scroll(p,dy,ms=1200):
    n=max(int(ms/16),1);done=0
    for i in range(1,n+1):
        t=i/n;e=t*t*(3-2*t);tg=dy*e; await p.evaluate(f"window.scrollBy(0,{tg-done})");done=tg; await asyncio.sleep(ms/1000/n)
async def hl(p,t):
    return await p.evaluate("""(t)=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const i=n.nodeValue.indexOf(t);if(i>=0&&n.parentElement.offsetParent){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+t.length);const m=document.createElement('mark');m.className='__hl';r.surroundContents(m);return true}}return false}""",t)
async def main():
    meta={}
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        # W1 trang chủ: đèn tắt -> kéo dây -> Đốm chào
        ctx=await b.new_context(viewport={"width":VW,"height":VH},device_scale_factor=DPR)
        await ctx.add_init_script("try{if(!sessionStorage.getItem('__x')){sessionStorage.setItem('qtt-lamp','off');sessionStorage.setItem('__x','1')}}catch(e){}")
        p=await ctx.new_page(); await p.goto(BASE+"/"); await p.wait_for_timeout(3500); await cur(p); r=Rec(p)
        await r.start("w1-bat-den"); await asyncio.sleep(1.6)
        cord=p.locator("[data-lamp-cord]:visible").first
        await tap(p,cord,ms=900); r.mark("bat"); await asyncio.sleep(6.5)
        meta["w1"]=await r.stop(); await ctx.close()
        ctx=await b.new_context(viewport={"width":VW,"height":VH},device_scale_factor=DPR)
        await ctx.add_init_script("try{sessionStorage.setItem('qtt-dom-chao','1');sessionStorage.setItem('qtt-dom-noi','1')}catch(e){}")
        p=await ctx.new_page(); r=Rec(p)
        # W2 Về Đốm
        await p.goto(BASE+"/ve-dom"); await p.wait_for_timeout(2500); await cur(p)
        await r.start("w2-ve-dom"); await asyncio.sleep(1.5)
        sec=p.locator("text=Đom đóm dẫn đường").first; bb=await sec.bounding_box()
        await scroll(p,bb["y"]-220,1600); await asyncio.sleep(0.4); await hl(p,"Đom đóm dẫn đường"); r.mark("hl"); await asyncio.sleep(0.6)
        await hl(p,"một đốm sáng nhỏ"); await asyncio.sleep(2.5)
        meta["w2"]=await r.stop()
        # W3 Bộ công cụ: thẻ Free, rê bìa, mở popup
        await p.goto(BASE+"/cong-cu"); await p.wait_for_timeout(2500); await cur(p)
        await r.start("w3-cong-cu"); await asyncio.sleep(0.8)
        await scroll(p,150,900); await asyncio.sleep(0.3)
        covers=p.locator(".cb-cover:visible, .bm-cover:visible, .bp-cover:visible")
        n=await covers.count(); print("covers",n)
        c1=covers.nth(0); await tap(p,c1,ms=700,hover=True); r.mark("hover1"); await asyncio.sleep(1.2)
        c2=covers.nth(1); await tap(p,c2,ms=600,hover=True); await asyncio.sleep(1.2)
        await tap(p,c1,ms=600); r.mark("popup"); await asyncio.sleep(3.0)
        meta["w3"]=await r.stop()
        # W4 Đốm kể: thời gian ở bên người thân yêu
        await p.goto(BASE+"/cong-cu"); await p.wait_for_timeout(2500); await cur(p)
        await r.start("w4-nguoi-than"); await asyncio.sleep(1.0)
        await hl(p,"giải quyết các công việc lặp đi lặp lại"); r.mark("hl1"); await asyncio.sleep(1.4)
        await hl(p,"có thêm thời gian ở bên người thân yêu"); r.mark("hl2"); await asyncio.sleep(3.0)
        meta["w4"]=await r.stop()
        # W5 bấm Đốm nổi -> bảng giúp gì
        await r.start("w5-dom-giup"); await asyncio.sleep(0.8)
        btn=p.locator(".dom-btn:visible").first
        await tap(p,btn,ms=900); r.mark("open"); await asyncio.sleep(4.0)
        meta["w5"]=await r.stop()
        await b.close()
    json.dump(meta,open(f"{OUT}/meta.json","w"),indent=1)
if __name__=="__main__": if __name__=="__main__": asyncio.run(main())
