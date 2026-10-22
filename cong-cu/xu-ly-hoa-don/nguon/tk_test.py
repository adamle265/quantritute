import asyncio, openpyxl
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1350,'height':950})
    pg=await ctx.new_page(); errs=[]; dls=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('download',lambda d:dls.append(d))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',['mua_test.zip','out.zip']); await pg.wait_for_selector('#out2:not([hidden])')
    print('mst', await pg.input_value('#mymst'))
    await pg.click('#t4'); await pg.wait_for_timeout(400)
    print('ky', await pg.input_value('#k-kieu'), await pg.input_value('#k-so'), await pg.input_value('#k-nam'))
    print('KPI', (await pg.inner_text('#k-kpis')).replace('\n',' | '))
    print('WARN', (await pg.inner_text('#k-warns'))[:1500])
    await pg.fill('#ki-c22','1.000.000'); await pg.dispatch_event('#ki-c22','change'); await pg.wait_for_timeout(200)
    print((await pg.inner_text('#k-tbl')))
    await pg.screenshot(path='t4a.png',full_page=True)
    await pg.click('#k-xuat'); await pg.wait_for_timeout(1500)
    for d in dls:
      await d.save_as(d.suggested_filename); wb=openpyxl.load_workbook(d.suggested_filename); print('##',d.suggested_filename,[ (ws.title,ws.max_row) for ws in wb.worksheets])
      for ws in wb.worksheets[1:]:
        for r in list(ws.iter_rows(values_only=True))[:8]: print(r)
    print('errs',errs); await b.close()
asyncio.run(main())
