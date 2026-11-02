import asyncio, glob
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0'); await pg.click('#t2'); await pg.wait_for_timeout(300)
        G = await pg.evaluate("(()=>{const L=window.__TK.G.list.filter(v=>v.loai=='Mua vào'&&v.trongKy&&!v.loaiTru&&!v.manual);const f=r=>{const v=L.find(v=>v.parts.length==1&&v.parts[0].ts==r);return v?[v.kyHieu,v.so,r]:null};const m=L.find(v=>v.parts.length>1);return [f('8%'),f('10%'),f('5%'),m?[m.kyHieu,m.so,m.parts.map(x=>x.ts).join('+')]:null]})()")
        print(G)
        for g in G:
            if not g: continue
            await pg.select_option('#ty-ts','10%')
            await pg.fill('#ty-gkh',g[0]); await pg.fill('#ty-gso',g[1]); await pg.dispatch_event('#ty-gso','change'); await pg.wait_for_timeout(150)
            await pg.fill('#ty-ct','-1000000'); await pg.dispatch_event('#ty-ct','input')
            print(g[2], '->', await pg.input_value('#ty-ts'), await pg.input_value('#ty-th'), '|', (await pg.inner_text('#ty-ginfo'))[-90:])
        await pg.locator('#tay-box').scroll_into_view_if_needed(); await pg.screenshot(path='s23.png')
        print('ERR', errs); await b.close()
asyncio.run(main())
