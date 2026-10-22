import asyncio
from playwright.async_api import async_playwright
HIDE=".spot,.homenav,[class^='dom-'],[class*=' dom-'],#dom,.dom-wrap,.notice,.site-notice,.lap-cur,.tag{display:none!important} *{transition:none!important;animation-play-state:paused!important}"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lamp in ["off","on"]:
            ctx=await b.new_context(viewport={"width":1720,"height":1100},device_scale_factor=2)
            await ctx.add_init_script(f"try{{sessionStorage.setItem('qtt-lamp','{lamp}');sessionStorage.setItem('qtt-dom-chao','1');sessionStorage.setItem('qtt-dom-noi','1');localStorage.setItem('qtt-dom-an','1')}}catch(e){{}}")
            pg=await ctx.new_page(); await pg.goto("http://localhost:8790/"); await pg.wait_for_timeout(4000)
            await pg.add_style_tag(content=HIDE); await pg.wait_for_timeout(800)
            ph=pg.locator(".photo").first; print(lamp, await ph.bounding_box())
            await ph.screenshot(path=f"md/photo-{lamp}.png")
            await ctx.close()
        await b.close()
asyncio.run(main())
