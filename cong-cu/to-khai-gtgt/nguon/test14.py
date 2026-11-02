import asyncio, glob, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1366,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/tk/build/index.html')
        r=lambda i:{'id':1761700000000+i,'loai':'Mua vào','nhom':'Điều chỉnh do sai sót','mau':'1','kh':'A','so':'8','ngay':'31/08/2026','mst':'','ten':'X','ct':1000,'ts':'10%','th':100,'ghiChu':'','gocKh':'A','gocSo':'8','gocNgay':'31/08/2026','gocKey':''}
        await pg.evaluate("t=>{localStorage.setItem('qtt-tk-tay-0123456789-thang9-2026', t);localStorage.setItem('qtt-tk-st-0123456789', JSON.stringify({tk:{'x':0},hkd:{'y':1}}));localStorage.setItem('qtt-tk-in-0123456789-thang9-2026','{\"c22\":5}');localStorage.setItem('qtt-tk-nnt-0123456789','{\"maCQT\":\"10100\"}');localStorage.setItem('qtt-tk-st-9999999999','{}')}", json.dumps([r(1),r(2)]))
        await pg.set_input_files('#fin', sorted(glob.glob('gia/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0'); await pg.wait_for_timeout(300)
        print('truoc', await pg.evaluate("window.__TK.G.list.filter(v=>v.manual).length"))
        await pg.click('#freset'); await pg.wait_for_timeout(200); await pg.screenshot(path='s20.png')
        print(await pg.inner_text('#freset-hoi'))
        await pg.click('#freset-ok'); await pg.wait_for_timeout(300)
        print('sau', await pg.evaluate("[window.__TK.G.list.filter(v=>v.manual).length, window.__TK.G.list.length, Object.keys(localStorage).filter(k=>k.startsWith('qtt-tk')).sort(), document.getElementById('toast').textContent]"))
        await pg.click('#freset'); await pg.wait_for_timeout(200); print(await pg.evaluate("document.getElementById('toast').textContent"))
        print('ERR', errs); await b.close()
asyncio.run(main())
