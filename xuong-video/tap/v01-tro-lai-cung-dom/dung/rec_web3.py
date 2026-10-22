import asyncio, json, sys, os
sys.path.insert(0,"/tmp/v01")
import rec_web as R
from playwright.async_api import async_playwright
R.VW,R.VH,R.DPR=1000,1134,1; R.OUT="/tmp/v01/web3"; os.makedirs(R.OUT,exist_ok=True)
HIDE=".dom-btn,.dom-say,.dom-talk,.dom-tip,.dom-msg,.dom-recall,.dom-hide{visibility:hidden!important}"
async def main():
    meta={}
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        ctx=await b.new_context(viewport={"width":1000,"height":1134})
        await ctx.add_init_script("try{sessionStorage.setItem('qtt-dom-chao','1');sessionStorage.setItem('qtt-dom-noi','1')}catch(e){}")
        p=await ctx.new_page(); r=R.Rec(p)
        # chi tiết công cụ
        await p.goto(R.BASE+"/cong-cu"); await p.wait_for_timeout(2500); await p.add_style_tag(content=HIDE); await R.cur(p)
        await r.start("chi-tiet"); await asyncio.sleep(0.4)
        c=p.locator(".cb-cover:visible").nth(1)
        await R.tap(p,c,ms=600,hover=True); await asyncio.sleep(0.9)
        await R.tap(p,c,ms=200); r.mark("open"); await asyncio.sleep(1.6)
        btn=p.locator("text=Dùng công cụ >> visible=true").first
        if await btn.count(): await R.tap(p,btn,ms=700,click=False); await p.evaluate("__cur.tap()")
        await asyncio.sleep(1.4); meta["chi-tiet"]=await r.stop()
        # cẩm nang: tìm văn bản
        await p.goto(R.BASE+"/tools/cam-nang-thue-2026/"); await p.wait_for_timeout(2500); await R.cur(p)
        await r.start("cam-nang"); await asyncio.sleep(0.4)
        await R.tap(p,p.locator("#topSearch"),ms=600)
        await p.type("#topSearch","123/2020",delay=90); r.mark("typed"); await asyncio.sleep(0.3); await p.keyboard.press("Enter"); await asyncio.sleep(2.2)
        meta["cam-nang"]=await r.stop()
        # tạo văn bản hàng loạt
        await p.goto(R.BASE+"/tools/tao-van-ban-hang-loat/"); await p.wait_for_timeout(2500); await R.cur(p)
        await r.start("van-ban"); await asyncio.sleep(0.4)
        await R.hl(p,"Xem từng bản, tải gộp một file"); await asyncio.sleep(0.6)
        t=p.locator("text=Thả file thành phẩm mẫu vào đây >> visible=true").first
        if await t.count(): await R.tap(p,t,ms=800,click=False)
        await asyncio.sleep(0.6); await R.hl(p,"Xử lý 100% trên máy bạn"); await asyncio.sleep(1.6)
        meta["van-ban"]=await r.stop()
        # đề xuất tính năng
        await p.goto(R.BASE+"/cong-cu"); await p.wait_for_timeout(2500); await p.add_style_tag(content=HIDE); await R.cur(p)
        await r.start("de-xuat"); await asyncio.sleep(0.3)
        await R.tap(p,p.locator("[data-suggest]:visible").last,ms=700); await asyncio.sleep(0.9); await R.cur(p)
        await R.tap(p,p.locator("#dm-o-pain"),ms=500)
        await p.type("#dm-o-pain","Thêm mẫu hợp đồng lao động có sẵn để tạo hàng loạt",delay=40); r.mark("typed"); await asyncio.sleep(1.2)
        meta["de-xuat"]=await r.stop()
        await b.close()
    json.dump(meta,open(R.OUT+"/meta.json","w"),indent=1)
asyncio.run(main())
