import asyncio, base64, os, subprocess, shutil, time, json
from playwright.async_api import async_playwright
OUT="/tmp/v02/web"; VW,VH,DPR=1000,1134,1.5
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
