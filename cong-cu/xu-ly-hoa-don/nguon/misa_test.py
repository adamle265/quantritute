import asyncio, openpyxl, io, zipfile
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1350,'height':950})
    pg=await ctx.new_page(); dls=[]; errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',['mua_test.zip','out.zip']); await pg.wait_for_selector('#out2:not([hidden])')
    await pg.click('#t5'); await pg.wait_for_timeout(400)
    print('empty?', await pg.is_visible('#m-empty'), await pg.inner_text('#mdir'))
    print('items:', (await pg.inner_text('#m-itbl'))[:700])
    print('inv:', (await pg.inner_text('#m-vtbl'))[:500])
    print('out:', await pg.inner_text('#m-out')); print('miss:', await pg.inner_text('#m-miss'))
    await pg.screenshot(path='t5a.png', full_page=True)
    # điền mã
    await pg.click('#m-mstcode')
    for i,el in enumerate(await pg.query_selector_all('#m-itbl input[data-f=ma]')): await el.fill('HH%02d'%i); await el.dispatch_event('change')
    # đổi loại: internet & vận chuyển → DV
    sels=await pg.query_selector_all('#m-itbl select[data-f=loai]')
    names=[await (await r.query_selector('td')).inner_text() for r in await pg.query_selector_all('#m-itbl tbody tr')]
    print(names)
    await pg.click('#m-okall')
    await pg.click('#m-set summary'); await pg.fill('#ms-tkDichVu','6427'); await pg.dispatch_event('#ms-tkDichVu','change')
    await pg.wait_for_timeout(200)
    print('out2:', await pg.inner_text('#m-out')); print('miss2:', await pg.inner_text('#m-miss'))
    await pg.screenshot(path='t5b.png', full_page=True)
    pg.on('download', lambda d: dls.append(d))
    await pg.locator('button[data-x=ALL]').click(); await pg.wait_for_timeout(4000)
    print('toast', await pg.inner_text('#toast'), 'dls', len(dls), 'errs', errs)
    if dls: await dls[0].save_as('misa_mua.zip')
    # bán ra
    await pg.click('#mdir button[data-v=ban]'); await pg.wait_for_timeout(300)
    print('ban out:', await pg.inner_text('#m-out')); print('ban miss:', await pg.inner_text('#m-miss'))
    print('errs', errs); await b.close()
asyncio.run(main())
