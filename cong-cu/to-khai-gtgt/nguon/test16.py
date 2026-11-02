import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('mau/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0'); await pg.click('#t2'); await pg.wait_for_timeout(300)
        await pg.click('#b-side [data-s=ban]'); await pg.wait_for_timeout(200)
        st=lambda: pg.evaluate("[window.__TK.R.c.c32||0, window.__TK.R.c.c33||0, document.getElementById('toast').textContent]")
        c0=await st(); print('dau', c0)
        print('tat ca indet', await pg.evaluate("[document.querySelector('#b-tkall').checked,document.querySelector('#b-tkall').indeterminate, document.querySelector('.tkall label').textContent]"))
        await pg.select_option('#b-f','off'); await pg.wait_for_timeout(200)
        print(await pg.evaluate("document.querySelector('.tkall label').textContent"))
        await pg.click('#b-tkall'); await pg.wait_for_timeout(200); print('tick', await st())
        await pg.screenshot(path='s22.png', clip={'x':0,'y':250,'width':1366,'height':420})
        await pg.select_option('#b-f',''); await pg.wait_for_timeout(200); await pg.click('#b-tkmd'); await pg.wait_for_timeout(200); c1=await st(); print('mac dinh', c1, c1[:2]==c0[:2])
        print('ERR', errs); await b.close()
asyncio.run(main())
