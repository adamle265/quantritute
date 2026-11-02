import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1366,'height':900}); pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        async def nap():
            await pg.goto('file:///home/claude/tk/build/index.html')
            await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
            await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0'); await pg.click('#t2'); await pg.wait_for_timeout(300)
        await nap()
        g = await pg.evaluate("(()=>{const v=window.__TK.G.list.find(v=>v.loai=='Mua vào'&&v.trongKy&&!v.loaiTru&&!v.manual);return [v.kyHieu,v.so]})()"); print('goc',g)
        async def them():
            await pg.fill('#ty-gkh',g[0]); await pg.fill('#ty-gso',g[1]); await pg.dispatch_event('#ty-gso','change')
            await pg.fill('#ty-kh','C26TAA'); await pg.fill('#ty-so','77')
            ins = pg.locator('#ty-ngay input'); await ins.nth(0).fill('15'); await ins.nth(1).fill('10'); await ins.nth(2).fill('2026')
            await pg.fill('#ty-ct','-1000000'); await pg.dispatch_event('#ty-ct','input'); await pg.click('#ty-add'); await pg.wait_for_timeout(300)
            return await pg.evaluate("[window.__TK.G.list.filter(v=>v.manual).length, document.getElementById('toast').textContent]")
        print('lan 1', await them()); print('lan 2', await them())
        await nap(); print('mo lai', await pg.evaluate("[window.__TK.G.list.filter(v=>v.manual).length, document.getElementById('toast').textContent]"))
        await pg.wait_for_timeout(800); print('toast', await pg.evaluate("document.getElementById('toast').textContent"))
        await pg.locator('#tay-box').scroll_into_view_if_needed(); await pg.screenshot(path='s19.png')
        await pg.click('#tay-xoahet'); await pg.wait_for_timeout(300)
        print('sau xoa', await pg.evaluate("[window.__TK.G.list.filter(v=>v.manual).length, document.getElementById('toast').textContent]"))
        print('ERR', errs); await b.close()
asyncio.run(main())
