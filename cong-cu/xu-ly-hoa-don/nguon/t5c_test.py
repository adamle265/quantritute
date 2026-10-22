import asyncio
from playwright.async_api import async_playwright
Q3='/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1400,'height':950}); pg=await ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',[Q3]); await pg.wait_for_selector('#out2:not([hidden])')
    print('sheets:', await pg.inner_text('#sheets'))
    await pg.click('#t5'); await pg.wait_for_timeout(500)
    print('tab:', await pg.inner_text('#t5'), '| count:', await pg.inner_text('#m-fcount'))
    await pg.fill('#m-fname','bánh bao'); await pg.wait_for_timeout(400); print('loc ten:', await pg.inner_text('#m-fcount'))
    await pg.fill('#m-fname',''); await pg.fill('#m-fso','7720'); await pg.wait_for_timeout(400); print('loc so:', await pg.inner_text('#m-fcount'))
    await pg.click('#m-selflt'); print('bulk:', await pg.inner_text('#m-seln'))
    await pg.select_option('#m-bloai','NVK'); await pg.fill('#m-btk','6422'); await pg.click('#m-bapply'); await pg.wait_for_timeout(300); print('toast:', await pg.inner_text('#toast'))
    await pg.fill('#m-fso',''); await pg.check('#m-onlymiss'); await pg.wait_for_timeout(400); print('chi thieu:', await pg.inner_text('#m-fcount'))
    # dòng NK: điền mã + tk rồi ✓
    row=pg.locator('#m-itbl tbody tr').filter(has=pg.locator('input[data-f=ma]')).first
    name=await row.locator('td').nth(1).inner_text(); print('dong:', name.split('\n')[0])
    print('ok disabled truoc:', await row.locator('[data-ok]').is_disabled())
    await row.locator('input[data-f=ma]').fill('HH01'); await row.locator('input[data-f=ma]').dispatch_event('change')
    await row.locator('input[data-f=tk]').fill('1561'); await row.locator('input[data-f=tk]').dispatch_event('change'); await pg.wait_for_timeout(200)
    print('ok disabled sau:', await row.locator('[data-ok]').is_disabled())
    n0=await pg.locator('#m-itbl tbody tr').count(); await row.locator('[data-ok]').click(); await pg.wait_for_timeout(200); print('so dong hien:', n0, '->', await pg.locator('#m-itbl tbody tr').count(), '|', await pg.inner_text('#m-fcount'))
    await pg.uncheck('#m-onlymiss'); await pg.wait_for_timeout(300)
    await pg.screenshot(path='t5c.png', full_page=False)
    print('out:', (await pg.inner_text('#m-out')).replace('\n',' | ')[:200])
    print('errs',errs); await b.close()
asyncio.run(main())
