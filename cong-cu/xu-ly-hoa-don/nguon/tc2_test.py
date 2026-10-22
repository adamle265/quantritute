import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1350,'height':950}); pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/hd/build/index.html')
    async def load():
      await pg.click('#t2'); await pg.set_input_files('#f2',['/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip']); await pg.wait_for_selector('#out2:not([hidden])')
      i=await pg.evaluate("[...document.querySelectorAll('#sheets button')].findIndex(b=>b.textContent==='Tra cứu mẫu người bán')"); await pg.click(f'#sheets button[data-i="{i}"]'); await pg.wait_for_timeout(200)
    await load()
    ed=pg.locator('#sheet-tbl [data-tcedit]'); print('edit btns', await ed.count())
    # pick a row with no link
    r=pg.locator('#sheet-tbl tbody tr', has=pg.locator('a:has-text("Tìm trang")')).first
    mst=await r.locator('[data-tcedit]').get_attribute('data-tcedit'); print('mst',mst)
    await r.locator('[data-tcedit]').click(); await pg.screenshot(path='tc3.png'); await pg.fill('[data-tcin]','abc'); await pg.click('[data-tcok]'); print('bad:', await pg.inner_text('#toast'))
    await pg.fill('[data-tcin]','tracuu.vidu.vn/hd'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200); print('ok:', await pg.inner_text('#toast'))
    n=await pg.evaluate("m=>[...document.querySelectorAll('#sheet-tbl tbody tr')].filter(r=>r.cells[8].innerText.startsWith(m)).map(r=>[r.cells[6].querySelector('a').href,r.cells[6].innerText,r.cells[10].innerText])",mst); print(n[:2], len(n))
    pass
    # reload page: persists
    await pg.reload(); await load()
    n=await pg.evaluate("m=>[...document.querySelectorAll('#sheet-tbl tbody tr')].filter(r=>r.cells[8].innerText.startsWith(m)).map(r=>r.cells[6].querySelector('a').href)",mst); print('after reload', n[:1])
    # delete
    await pg.locator(f'#sheet-tbl [data-tcedit="{mst}"]').first.click(); await pg.click('[data-tcdel]'); await pg.wait_for_timeout(200)
    n=await pg.evaluate("m=>[...document.querySelectorAll('#sheet-tbl tbody tr')].filter(r=>r.cells[8].innerText.startsWith(m)).map(r=>r.cells[6].innerText)",mst); print('after del', n[:1])
    print('errs',errs); await b.close()
asyncio.run(main())
