import asyncio, glob, openpyxl
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(accept_downloads=True, viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('mau/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        c=lambda: pg.evaluate('[window.__TK.R.c.c23,window.__TK.R.c.c24,window.__TK.R.c.c25]')
        print('c23 (cu 560733801, phi 234362)', await c())
        await pg.click('#t2'); await pg.fill('#b-q','12220'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s14.png')
        await pg.fill('#b-q',''); 
        k = await pg.evaluate("window.__TK.G.list.find(v=>v.kyHieu=='C26TDV'&&v.so=='103534').key")
        v = await pg.evaluate("(()=>{const v=window.__TK.G.list.find(v=>v.kyHieu=='C26TDV'&&v.so=='103534');return [v.ctVND,v.thVND,v.tongVND,v.gtMua]})()"); print('HD 103534', v)
        await pg.fill('#b-q','103534'); await pg.wait_for_timeout(200)
        await pg.locator(f'input[data-hkd="{k}"]').check(); print('tick ho KD', await c())
        async with pg.expect_download() as d: await pg.click('#b-xuat')
        dl=await d.value; await dl.save_as('build/bk5.xlsx')
        print('ERR', errs); await b.close()
asyncio.run(main())
ws=openpyxl.load_workbook('build/bk5.xlsx')['HĐ mua vào']; h=[c.value for c in ws[5]]; i=h.index('Giá trị mua chưa VAT tính vào [23]'); print(h[i-2:i+1], list(ws.iter_rows(values_only=True))[-1][i])
