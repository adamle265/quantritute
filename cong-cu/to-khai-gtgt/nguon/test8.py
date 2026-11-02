import asyncio, glob, openpyxl
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(accept_downloads=True, viewport={'width':1280,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/tools/to-khai-gtgt/')
        print('boff visible', await pg.is_visible('#boff'), await pg.get_attribute('#boff','href'))
        async with pg.expect_download() as d: await pg.click('#boff')
        dl=await d.value; await dl.save_as('build/off.html'); print('offline file', dl.suggested_filename, open('build/off.html','rb').read()==open('build/index.html','rb').read())
        await pg.set_input_files('#fin', sorted(glob.glob('mau/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        await pg.click('#t2'); print(await pg.inner_text('#b-side'))
        for s in ['dcm','dcb']:
            await pg.click(f'#b-side button[data-s={s}]')
            rows = await pg.locator('#b-tbl tbody tr').count(); hd = await pg.inner_text('#b-tbl thead'); print(s, rows, hd.replace('\n',' | '), 'tay-box hidden', await pg.is_hidden('#tay-box'))
        await pg.screenshot(path='s12.png')
        async with pg.expect_download() as d: await pg.click('#b-xuat')
        dl=await d.value; await dl.save_as('build/bk4.xlsx')
        print('ERR', errs); await b.close()
    wb=openpyxl.load_workbook('build/bk4.xlsx'); print(wb.sheetnames)
    for n in wb.sheetnames[1::2]:
        ws=wb[n]; print(n, ws.max_row-5, [c.value for c in ws[5]][:6])
    pg2=None
asyncio.run(main())
