import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1280,'height':720}, device_scale_factor=1)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/tools/to-khai-gtgt/')
        await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        print(await pg.evaluate('[window.__TK.my, window.__TK.G.list.length, window.__TK.R.c.c40, window.__TK.R.dem]'))
        await pg.click('#t2'); await pg.click('#b-side button[data-s=ban]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shot-bk.png')
        await pg.click('#t3'); await pg.wait_for_timeout(300); await pg.evaluate('window.scrollTo(0, document.getElementById("k-th").getBoundingClientRect().top + scrollY - 260)')
        await pg.screenshot(path='shot-tk.png')
        print('ERR', errs); await b.close()
asyncio.run(main())
