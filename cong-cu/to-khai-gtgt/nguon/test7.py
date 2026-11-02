import asyncio, glob, openpyxl
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(accept_downloads=True)
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.set_input_files('#fin', sorted(glob.glob('mau/*.xlsx')))
        await pg.wait_for_function('window.__TK.G && window.__TK.G.list.length>0')
        await pg.click('#t2')
        async with pg.expect_download() as d: await pg.click('#b-xuat')
        dl=await d.value; await dl.save_as('build/bk3.xlsx'); await b.close()
asyncio.run(main())
ws=openpyxl.load_workbook('build/bk3.xlsx')['HĐ điều chỉnh - thay thế']
for r in ws.iter_rows(min_row=5,max_row=8,values_only=True): print(r[1],r[5],r[6],r[14],r[15])
