import asyncio, json, sys
sys.path.insert(0,"/tmp/v01")
import rec_web as R
from playwright.async_api import async_playwright
R.VW,R.VH,R.DPR=1000,1134,2
R.OUT="/tmp/v01/web2"
import os; os.makedirs(R.OUT,exist_ok=True)
async def main():
    meta={}
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        ctx=await b.new_context(viewport={"width":1000,"height":1134},device_scale_factor=2)
        await ctx.add_init_script("try{sessionStorage.setItem('qtt-dom-chao','1');sessionStorage.setItem('qtt-dom-noi','1')}catch(e){}")
        p=await ctx.new_page(); r=R.Rec(p)
        await p.goto(R.BASE+"/cong-cu"); await p.wait_for_timeout(3000)
        await p.add_style_tag(content=".dom-btn,.dom-say,.dom-talk,.dom-tip,.dom-msg,.dom-recall,.dom-hide{visibility:hidden!important}")
        await R.cur(p)
        await r.start("w34"); await asyncio.sleep(1.0)
        covers=p.locator(".cb-cover:visible, .bm-cover:visible, .bp-cover:visible")
        await R.tap(p,covers.nth(0),ms=800,hover=True); r.mark("flip1"); await asyncio.sleep(1.8)
        await R.tap(p,covers.nth(1),ms=700,hover=True); r.mark("flip2"); await asyncio.sleep(1.8)
        await p.mouse.move(980,1100); await R.move(p,860,980,500); await asyncio.sleep(0.6)
        await R.hl(p,"giải quyết các công việc lặp đi lặp lại"); r.mark("hl1"); await asyncio.sleep(1.6)
        await R.hl(p,"có thêm thời gian ở bên người thân yêu"); r.mark("hl2"); await asyncio.sleep(3.0)
        meta["w34"]=await r.stop()
        await p.goto(R.BASE+"/cong-cu"); await p.wait_for_timeout(2500); await R.cur(p)
        await r.start("w5"); await asyncio.sleep(0.8)
        btn=p.locator(".dom-btn:visible").first
        await R.tap(p,btn,ms=900); r.mark("open"); await asyncio.sleep(3.5)
        meta["w5"]=await r.stop()
        await b.close()
    json.dump(meta,open(R.OUT+"/meta.json","w"),indent=1)
asyncio.run(main())
