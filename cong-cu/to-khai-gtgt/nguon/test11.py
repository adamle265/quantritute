import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        await pg.click('#t2'); await pg.select_option('#b-f','hkd'); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('#b-tbl tbody tr input[data-hkd]').length")
        print('so dong loc hkd', n, 'ky vong', await pg.evaluate("window.__TK.G.list.filter(v=>v.hoKD).length"))
        await pg.screenshot(path='s18.png')
        print('ERR', errs); await b.close()
asyncio.run(main())
