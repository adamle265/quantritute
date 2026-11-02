import asyncio, openpyxl
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1300,'height':900})
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/xl/nguon/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2','/tmp/claude-x/lq.zip')
    await pg.wait_for_selector('#out2:not([hidden])', timeout=60000)
    await pg.fill('#mymst','0700922112'); await pg.dispatch_event('#mymst','change'); await pg.wait_for_timeout(500)
    print('lqf', await pg.inner_text('#lqf'))
    await pg.check('#lqonly'); await pg.wait_for_timeout(300)
    rows = await pg.evaluate("[...document.querySelectorAll('#sheet-tbl tbody tr')].map(tr=>{const t=[...tr.children].map(td=>td.innerText);return t[4]+'-'+t[5]+' | '+t[16]+' | '+t[18]})")
    print('\n'.join(rows))
    await pg.locator('#lqf').scroll_into_view_if_needed(); await pg.screenshot(path='/home/claude/xl/lq1.png')
    await pg.uncheck('#lqonly'); await pg.wait_for_timeout(200)
    async with pg.expect_download() as dl: await pg.click('#bxls')
    d=await dl.value; await d.save_as('/tmp/claude-x/lq.xlsx')
    ws=openpyxl.load_workbook('/tmp/claude-x/lq.xlsx')['Bảng kê hóa đơn']
    H=[c.value for c in ws[1]]; i=H.index('HĐ liên quan')
    for r in ws.iter_rows(min_row=2,values_only=True):
        if r[5]: print('XLS', r[4],r[5],'|',r[16],'|',r[i])
    print('errs',errs); await b.close()
asyncio.run(main())
