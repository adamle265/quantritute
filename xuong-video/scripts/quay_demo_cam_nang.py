# Quay demo công cụ bằng CDP screencast (nét, 1080px) + con trỏ/chạm giả lập
import asyncio, base64, json, os, subprocess, shutil, sys
from playwright.async_api import async_playwright

TOOL = "file:///home/claude/xuong/tool.html"
OUT = "/home/claude/xuong/clips"
VW, VH, DPR = 360, 440, 3

CURSOR_JS = r"""
(()=>{ if(document.getElementById('__cur')) return;
const s=document.createElement('style'); s.textContent=`#__cur{position:fixed;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,255,255,.6);border:3px solid rgba(60,40,20,.9);box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:transform .12s}
.__rip{position:fixed;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid #e8a33c;z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}@keyframes __r{to{transform:scale(2.8);opacity:0}}
mark.__hl{background:linear-gradient(transparent 55%, rgba(242,184,102,.75) 55%);color:inherit;padding:0 1px;transition:background-size .6s}`;
document.head.appendChild(s); const c=document.createElement('div'); c.id='__cur'; document.body.appendChild(c);
window.__cur={x:-50,y:-50,set(x,y){this.x=x;this.y=y;c.style.left=x+'px';c.style.top=y+'px'},
 tap(){c.style.transform='scale(.7)';setTimeout(()=>c.style.transform='',150);const r=document.createElement('div');r.className='__rip';r.style.left=this.x+'px';r.style.top=this.y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),650)},
 hide(){c.style.opacity=0}, show(){c.style.opacity=1}};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="http"]'); if(a){e.preventDefault();}},true);
window.open=()=>null;
})()
"""

TAPS = []
TYPES = []
class Rec:
    def __init__(self, page): self.p = page; self.frames = []; self.cdp = None
    async def start(self, name):
        self.name = name; self.dir = f"{OUT}/{name}"; shutil.rmtree(self.dir, ignore_errors=True); os.makedirs(self.dir)
        self.frames = []; TAPS.clear(); TYPES.clear(); self.cdp = await self.p.context.new_cdp_session(self.p)
        self.cdp.on("Page.screencastFrame", self._on)
        await self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": VW * DPR, "maxHeight": VH * DPR, "everyNthFrame": 1})
        await asyncio.sleep(0.4)
        self.t0 = None
    def _on(self, f):
        ts = f["metadata"]["timestamp"]; i = len(self.frames)
        fn = f"{self.dir}/{i:05d}.jpg"; open(fn, "wb").write(base64.b64decode(f["data"]))
        self.frames.append((ts, fn))
        asyncio.ensure_future(self.cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]}))
    async def stop(self, tail=0.3):
        await asyncio.sleep(tail)
        import time
        # timestamp đồng hồ hệ thống tương thích metadata.timestamp (giây epoch)
        end = time.time()
        await self.cdp.send("Page.stopScreencast"); await self.cdp.detach()
        fr = self.frames
        lines = []
        for k, (ts, fn) in enumerate(fr):
            nxt = fr[k + 1][0] if k + 1 < len(fr) else max(end, ts + 0.04)
            lines += [f"file '{fn}'", f"duration {max(nxt - ts, 0.001):.4f}"]
        lines.append(f"file '{fr[-1][1]}'")
        open(f"{self.dir}/list.txt", "w").write("\n".join(lines))
        out = f"{OUT}/{self.name}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{self.dir}/list.txt",
                        "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "medium", out], check=True)
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]))
        print(f"  {self.name}: {len(fr)} khung, {dur:.2f}s")
        self.taps=[round(t-fr[0][0],3) for t in TAPS]; self.types=[(round(a-fr[0][0],3),round(b-fr[0][0],3)) for a,b in TYPES]
        return dur

async def ensure_cursor(p): await p.evaluate(CURSOR_JS)

import time as _t
async def do_tap(p):
    TAPS.append(_t.time()); await p.evaluate("window.__cur.tap()")

async def no_header(p, hide=True):
    css = '.topbar{display:none!important}' if hide else '.topbar{position:static!important}'
    await p.add_style_tag(content=css)

async def move(p, x, y, ms=450):
    await ensure_cursor(p)
    x0, y0 = await p.evaluate("[window.__cur.x, window.__cur.y]")
    if x0 < 0: x0, y0 = x + 60, y + 120
    n = max(int(ms / 16), 1)
    for i in range(1, n + 1):
        t = i / n; e = t * t * (3 - 2 * t)
        await p.evaluate(f"window.__cur.set({x0 + (x - x0) * e},{y0 + (y - y0) * e})")
        await asyncio.sleep(ms / 1000 / n)

async def center(p, loc):
    await loc.scroll_into_view_if_needed()
    b = await loc.bounding_box(); return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

async def tap(p, loc, click=True, ms=450):
    x, y = await center(p, loc)
    await move(p, x, y, ms); await asyncio.sleep(0.12)
    await do_tap(p)
    if click:
        await loc.click(); await p.mouse.move(2, 2)
    return x, y

async def smooth_scroll(p, dy, ms=1200):
    n = max(int(ms / 16), 1); done = 0
    for i in range(1, n + 1):
        t = i / n; e = t * t * (3 - 2 * t); target = dy * e
        await p.evaluate(f"window.scrollBy(0,{target - done})"); done = target
        await asyncio.sleep(ms / 1000 / n)

async def scroll_to_y(p, loc, y_target, ms=1000):
    b = await loc.bounding_box(); await smooth_scroll(p, b["y"] - y_target, ms)

async def mark(p, text):
    await p.evaluate("""(t)=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
      while(n=w.nextNode()){const i=n.nodeValue.indexOf(t); if(i>=0 && n.parentElement.offsetParent){
        const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+t.length);const m=document.createElement('mark');m.className='__hl';r.surroundContents(m);return true}} return false}""", text)

async def main(only=None):
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=DPR, is_mobile=True, has_touch=True)
        p = await ctx.new_page()
        await p.goto(TOOL); await p.wait_for_timeout(1500); await ensure_cursor(p)
        r = Rec(p)

        # S3: gõ tìm 123/2020 -> kết quả Điều 43 -> mở
        await no_header(p, False); await p.evaluate("window.scrollTo(0,0)")
        await r.start("s03-tim-kiem")
        await move(p, 180, 330, 300)
        await tap(p, p.locator("#topSearch"))
        _a=_t.time(); await p.type("#topSearch", "123/2020", delay=95); TYPES.append((_a,_t.time()))
        await asyncio.sleep(0.25); await p.keyboard.press("Enter"); await asyncio.sleep(0.6); await ensure_cursor(p)
        res = p.locator(".search-result-doc", has_text="Điều 43").first
        await scroll_to_y(p, res, 120, 700); await asyncio.sleep(0.2)
        x, y = await center(p, res); await move(p, x + 40, y + 30, 400)
        await asyncio.sleep(1.0)
        meta["s03-tim-kiem"] = {"zoom": [x / VW, y / VH]}; meta["s03-tim-kiem"]["zt"]=round(_t.time()-r.frames[0][0],3)
        await do_tap(p); await res.click(); await p.mouse.move(2,2); await asyncio.sleep(1.4)
        meta["s03-tim-kiem"]["dur"] = await r.stop()
        meta["s03-tim-kiem"]["taps"]=r.taps; meta["s03-tim-kiem"]["types"]=r.types

        # S4: mở mục lục chương/điều của NĐ 254
        await p.goto(TOOL); await p.wait_for_timeout(900); await no_header(p)
        await p.evaluate("go('topic','hoadon','lookup');window.scrollTo(0,0)"); await asyncio.sleep(0.6); await ensure_cursor(p)
        btn = p.locator("text=Mở mục lục Chương >> visible=true").first
        b0 = await btn.bounding_box(); await p.evaluate(f"window.scrollBy(0,{b0['y'] - 300})"); await asyncio.sleep(0.3)
        await r.start("s04-doc-dieu")
        await tap(p, btn, ms=500); await asyncio.sleep(0.9); await ensure_cursor(p); await no_header(p)
        await p.evaluate("window.scrollTo(0,0)"); await asyncio.sleep(0.3)
        await p.evaluate("window.__cur.set(300,330)")
        await smooth_scroll(p, 260, 1600); await asyncio.sleep(0.3)
        d4 = p.locator("text=Điều 4 >> visible=true").first
        if await d4.count():
            x, y = await center(p, d4); await move(p, x + 60, y, 500); await do_tap(p)
        await asyncio.sleep(0.6); await smooth_scroll(p, 300, 1500); await asyncio.sleep(0.3)
        meta["s04-doc-dieu"] = {"dur": await r.stop()}
        meta["s04-doc-dieu"]["taps"]=r.taps; meta["s04-doc-dieu"]["types"]=r.types

        # S5: hỏi đáp
        await p.goto(TOOL); await p.wait_for_timeout(900); await no_header(p); await p.evaluate("go('topic','hoadon','faq');window.scrollTo(0,0)"); await asyncio.sleep(0.6); await ensure_cursor(p)
        q = p.locator(".faq-q:visible", has_text="NĐ123/2020").first
        b0 = await q.bounding_box(); await p.evaluate(f"window.scrollBy(0,{b0['y'] - 120})"); await asyncio.sleep(0.3)
        await r.start("s05-hoi-dap")
        await tap(p, q, ms=500); await asyncio.sleep(0.6); await ensure_cursor(p)
        await scroll_to_y(p, q, 20, 600)
        x, y = await center(p, q)
        meta["s05-hoi-dap"] = {"zoom": [0.5, (y + 90) / VH]}; meta["s05-hoi-dap"]["zt"]=round(_t.time()-r.frames[0][0],3)
        await asyncio.sleep(0.3); await mark(p, "thay thế hoàn toàn"); await asyncio.sleep(0.7)
        await mark(p, "rà soát và cập nhật lại"); await asyncio.sleep(1.4)
        meta["s05-hoi-dap"]["dur"] = await r.stop()
        meta["s05-hoi-dap"]["taps"]=r.taps; meta["s05-hoi-dap"]["types"]=r.types

        # S6: sơ đồ quan hệ
        await p.goto(TOOL); await p.wait_for_timeout(900); await no_header(p); await p.evaluate("go('topic','hoadon','timeline');window.scrollTo(0,0)"); await asyncio.sleep(0.6); await ensure_cursor(p)
        sd = p.locator("text=Sơ đồ quan hệ giữa các văn bản >> visible=true").first
        b0 = await sd.bounding_box(); await p.evaluate(f"window.scrollBy(0,{b0['y'] - 20})"); await asyncio.sleep(0.3)
        await p.evaluate("window.__cur.set(-50,-50)")
        await r.start("s06-so-do")
        await asyncio.sleep(0.3); await smooth_scroll(p, 520, 3200); await asyncio.sleep(0.3)
        meta["s06-so-do"] = {"dur": await r.stop()}
        meta["s06-so-do"]["taps"]=r.taps; meta["s06-so-do"]["types"]=r.types

        # S7: tự kiểm tra
        await p.goto(TOOL); await p.wait_for_timeout(900); await no_header(p); await p.evaluate("go('topic','hoadon','quiz');window.scrollTo(0,0)"); await asyncio.sleep(0.6); await ensure_cursor(p)
        ans = p.locator("text=Trên 1 tỷ/năm >> visible=true").first
        qq = p.locator("text=Câu 1. >> visible=true").first
        b0 = await qq.bounding_box(); await p.evaluate(f"window.scrollBy(0,{b0['y'] - 15})"); await asyncio.sleep(0.3)
        await r.start("s07-kiem-tra")
        await asyncio.sleep(0.3); await tap(p, ans, ms=600); await asyncio.sleep(1.6)
        meta["s07-kiem-tra"] = {"dur": await r.stop()}
        meta["s07-kiem-tra"]["taps"]=r.taps; meta["s07-kiem-tra"]["types"]=r.types

        # S8: xem gốc
        await p.goto(TOOL); await p.wait_for_timeout(900); await no_header(p); await p.evaluate("go('topic','hoadon','lookup');window.scrollTo(0,0)"); await asyncio.sleep(0.6); await ensure_cursor(p)
        xg = p.locator("text=Xem gốc >> visible=true").first
        b0 = await xg.bounding_box(); await p.evaluate(f"window.scrollBy(0,{b0['y'] - 120})"); await asyncio.sleep(0.3)
        await r.start("s08-xem-goc")
        x, y = await center(p, xg)
        await move(p, x - 40, y + 90, 10); await asyncio.sleep(0.3)
        await move(p, x, y, 600); await asyncio.sleep(0.15); await do_tap(p)
        await p.evaluate("""()=>{const e=[...document.querySelectorAll('*')].find(e=>e.children.length==0&&e.textContent.trim().startsWith('Xem gốc')&&e.offsetParent);
            e.style.outline='3px solid #d9923c';e.style.outlineOffset='4px';e.style.borderRadius='8px'}""")
        meta["s08-xem-goc"] = {"zoom": [x / VW, y / VH]}; meta["s08-xem-goc"]["zt"]=round(_t.time()-r.frames[0][0],3)
        await asyncio.sleep(2.0)
        meta["s08-xem-goc"]["dur"] = await r.stop()
        meta["s08-xem-goc"]["taps"]=r.taps; meta["s08-xem-goc"]["types"]=r.types

        # Ảnh trang chủ công cụ cho cảnh kết
        await p.goto(TOOL); await p.wait_for_timeout(900); await asyncio.sleep(0.6)
        await p.screenshot(path=f"{OUT}/home.png")
        await b.close()
    json.dump(meta, open(f"{OUT}/meta.json", "w"), indent=2)
    print(meta)

asyncio.run(main())
