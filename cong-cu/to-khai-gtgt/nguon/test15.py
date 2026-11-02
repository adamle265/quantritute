import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0'); await pg.click('#t2'); await pg.wait_for_timeout(300)
        st=lambda: pg.evaluate("[window.__TK.R.c.c23, window.__TK.G.list.filter(v=>v.loai=='Mua vào'&&v.tinh).length, document.getElementById('toast').textContent]")
        print('dau', await st())
        await pg.select_option('#b-f','5tr'); await pg.wait_for_timeout(200)
        print('so loc', await pg.evaluate("document.querySelector('#b-tkall') && document.querySelector('.tkall label').textContent"))
        await pg.uncheck('#b-tkall'); await pg.wait_for_timeout(200); print('bo het', await st())
        print('indet/checked', await pg.evaluate("[document.querySelector('#b-tkall').checked, document.querySelector('#b-tkall').indeterminate]"))
        await pg.screenshot(path='s21.png', clip={'x':0,'y':300,'width':1366,'height':500})
        await pg.click('#b-tkmd'); await pg.wait_for_timeout(200); print('mac dinh', await st())
        await pg.select_option('#b-f','off'); await pg.wait_for_timeout(200)
        n=await pg.evaluate("document.querySelector('.tkall label')?.textContent"); print('loc khong tinh', n)
        if n:
            await pg.check('#b-tkall'); await pg.wait_for_timeout(200); print('tick het off', await st())
            await pg.click('#b-tkmd'); await pg.wait_for_timeout(200); print('mac dinh', await st())
        await pg.select_option('#b-f',''); await pg.wait_for_timeout(200)
        print('indet tat ca', await pg.evaluate("document.querySelector('#b-tkall').indeterminate"))
        print('ERR', errs); await b.close()
asyncio.run(main())
