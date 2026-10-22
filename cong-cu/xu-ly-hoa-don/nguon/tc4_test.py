import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1350,'height':950}); await ctx.grant_permissions(['clipboard-read','clipboard-write']); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/hd/build/index.html'); await pg.click('#t2')
    await pg.set_input_files('#f2',['/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip']); await pg.wait_for_selector('#out2:not([hidden])')
    i=await pg.evaluate("[...document.querySelectorAll('#sheets button')].findIndex(b=>b.textContent==='Tra cứu mẫu người bán')"); await pg.click(f'#sheets button[data-i="{i}"]')
    btn=pg.locator('#sheet-tbl [data-copyten]').first; print('mst btns', await pg.locator('#sheet-tbl [data-copyten]').count())
    await btn.click(); await pg.wait_for_timeout(200); print(await pg.inner_text('#toast')); print('clip', await pg.evaluate('navigator.clipboard.readText()'))
    await pg.locator('#sheet-tbl [data-copy]:not([data-copyten])').first.click(); await pg.wait_for_timeout(200); print(await pg.inner_text('#toast'))
    await pg.locator('#sheet-tbl tbody tr').first.scroll_into_view_if_needed(); await pg.evaluate("document.querySelector('#sheet-tbl').parentElement.scrollLeft=600"); await pg.screenshot(path='tc4.png')
    print('errs',errs); await b.close()
asyncio.run(main())
