import asyncio
from playwright.async_api import async_playwright
OUT='/home/claude/xv/remotion/public/demo/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':432,'height':768},device_scale_factor=2.5,is_mobile=True,has_touch=True)
        await pg.goto('file:///home/claude/xuong/tool.html'); await pg.wait_for_timeout(1500)
        async def full(name, maxh=3200):
            await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(500)
            h=await pg.evaluate("document.documentElement.scrollHeight")
            await pg.screenshot(path=OUT+name, full_page=True, clip={'x':0,'y':0,'width':432,'height':min(h,maxh)})
            print(name,h)
        await full('home.png',768)
        for nm,args in [('tra-cuu.png',"'topic','hoadon','lookup'"),('dong-thoi-gian.png',"'topic','hoadon','timeline'"),('doi-chieu.png',"'topic','hoadon','doichieu'"),('tu-van-ban.png',"'library'")]:
            await pg.evaluate(f"go({args})"); await pg.wait_for_timeout(1200); await full(nm)
        await pg.fill('#libSearch','hóa đơn'); await pg.wait_for_timeout(1000); await full('tu-van-ban-tim.png',1600)
        # find bbox of "Còn hiệu lực" on lookup + "Xem gốc"
        await pg.evaluate("go('topic','hoadon','lookup')"); await pg.wait_for_timeout(1000); await pg.evaluate("window.scrollTo(0,0)")
        for t in ['Còn hiệu lực','Xem gốc']:
            el=pg.get_by_text(t).first
            print(t, await el.bounding_box())
        await b.close()
asyncio.run(main())
