import asyncio
from playwright.async_api import async_playwright
Q3='/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await (await b.new_context(viewport={'width':1400,'height':950})).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/hd/build/index.html'); await pg.click('#t2'); await pg.set_input_files('#f2',[Q3]); await pg.wait_for_selector('#out2:not([hidden])')
    await pg.click('#t5'); await pg.wait_for_timeout(500)
    print('bulk an:', await pg.locator('#m-bulk').is_hidden(), '| chip an:', await pg.locator('#m-fitem').is_hidden())
    # tìm 2 hàng hóa xuất hiện trên nhiều HĐ
    names=await pg.eval_on_selector_all('#m-itbl tbody tr','rs=>rs.map(r=>r.cells[1].innerText.split("\\n")[0])')
    from collections import Counter; c=Counter(names); top=[n for n,k in c.most_common(2)]; print('top:', [(n,c[n]) for n in top])
    for n in top:
      i=names.index(n); await pg.locator('#m-itbl tbody tr').nth(i).locator('input[data-sel]').check()
    await pg.wait_for_timeout(100); print(await pg.inner_text('#m-seln'))
    await pg.click('#m-fitbtn'); await pg.wait_for_timeout(300)
    print('toast:', await pg.inner_text('#toast')); print('chip:', await pg.inner_text('#m-fitem-t'), '|', await pg.inner_text('#m-fcount'))
    vis=await pg.eval_on_selector_all('#m-itbl tbody tr','rs=>rs.map(r=>r.cells[1].innerText.split("\\n")[0])'); print('dong hien:', len(vis), set(vis))
    await pg.screenshot(path='t5d.png')
    await pg.click('#m-fitem-x'); await pg.wait_for_timeout(300); print('bo loc:', await pg.inner_text('#m-fcount'), '| chip an:', await pg.locator('#m-fitem').is_hidden())
    print('errs',errs); await b.close()
asyncio.run(main())
