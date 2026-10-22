import asyncio, collections
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await (await b.new_context(viewport={'width':1350,'height':950})).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',['/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip']); await pg.wait_for_selector('#out2:not([hidden])')
    print('kpi', (await pg.inner_text('#kpis')).replace('\n',' | '))
    await pg.click('#sheets button[data-i="4"]'); await pg.wait_for_timeout(300)
    rows=await pg.eval_on_selector_all('#sheet-tbl tbody tr', 'rs=>rs.map(r=>[...r.cells].map(c=>{const a=c.querySelector("a");return a?a.href:c.innerText}))')
    c=collections.Counter((r[7], bool(r[5]), r[6][:45]) for r in rows)
    for k,v in sorted(c.items(), key=lambda x:-x[1]): print(v, k)
    print('khong ma:', sum(1 for r in rows if not r[5]), '/', len(rows))
    for r in rows[:3]: print(r[3:])
    btn=pg.locator('#sheet-tbl [data-copy]').first; await btn.click(); await pg.wait_for_timeout(200); print('toast', await pg.inner_text('#toast'))
    print((await pg.inner_text('#sheet-note')))
    await pg.screenshot(path='tc1.png')
    print('errs',errs); await b.close()
asyncio.run(main())
