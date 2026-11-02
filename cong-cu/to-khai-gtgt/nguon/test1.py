import asyncio, glob, json, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(accept_downloads=True, viewport={'width':1280,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('mau/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        info = await pg.evaluate('''()=>{const S=window.__TK;return {my:S.my, files:S.files.map(f=>[f.name,f.invs.length,f.mtt,f.tu,f.den,f.err||'']), n:S.G.list.length, trung:S.G.trung,
          loai:S.G.list.reduce((a,v)=>{a[v.loai+'|'+v.loaiHD]=(a[v.loai+'|'+v.loaiHD]||0)+1;return a},{}), ky:S.R.ky.nhan, c:S.R.c, dem:S.R.dem, pl:[S.R.plMua,S.R.plBan]}}''')
        print(json.dumps(info, ensure_ascii=False, indent=1))
        await pg.screenshot(path='s1.png', full_page=True)
        await pg.click('#t2'); await pg.screenshot(path='s2.png')
        async with pg.expect_download() as d: await pg.click('#b-xuat')
        dl = await d.value; await dl.save_as('build/bk.xlsx'); print('bk', dl.suggested_filename)
        await pg.click('#b-side button[data-s=ban]'); await pg.select_option('#b-f','xn'); await pg.screenshot(path='s2b.png')
        await pg.click('#t3'); await pg.screenshot(path='s3.png', full_page=True)
        async with pg.expect_download() as d: await pg.click('#k-xuat')
        dl = await d.value; await dl.save_as('build/tk.xlsx'); print('tk', dl.suggested_filename)
        print('ERR', errs)
        await b.close()
asyncio.run(main())
