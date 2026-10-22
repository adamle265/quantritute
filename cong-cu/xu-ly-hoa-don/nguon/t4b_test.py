import asyncio, re
from playwright.async_api import async_playwright
Q3='/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip'
SAMPLE='/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/fba10f57-File_t__khai_XML_m_u.xml'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1350,'height':950}); pg=await ctx.new_page(); errs=[]; dls=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('download',lambda d:dls.append(d))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',[Q3]); await pg.wait_for_selector('#out2:not([hidden])')
    print('fl2:', (await pg.locator('#p2 .fl-box').inner_text()).replace('\n',' | ')[:200])
    print('warnsup visible', await pg.locator('#warnsup').is_visible(), '| warn count', await pg.inner_text('#warnh'))
    await pg.locator('#warnbox input[data-add]').set_input_files(['/tmp/sup/K26DGD-2829048.xml']); await pg.wait_for_timeout(600)
    print('after sup:', await pg.inner_text('#warnh'), '| kpi', (await pg.inner_text('#kpis')).replace('\n',' ')[:80])
    print('fl2:', (await pg.locator('#p2 .fl-box').inner_text()).replace('\n',' | ')[:200])
    await pg.click('#t4'); await pg.wait_for_timeout(500)
    print('nx table:\n', (await pg.inner_text('#k-nxtbl'))[:1200])
    await pg.locator('#k-nxtbl input[data-sup]').first.set_input_files(['/tmp/sup/K26TDV-426559.xml']); await pg.wait_for_timeout(800)
    print('toast', await pg.inner_text('#toast'))
    t=await pg.inner_text('#k-nxtbl'); print('rows bo sung:', t.count('Đã bổ sung'), '| goi y:', t.count('gợi ý'))
    await pg.locator('#k-nxtbl [data-rm]').first.click(); await pg.wait_for_timeout(500)
    t=await pg.inner_text('#k-nxtbl'); print('sau go: bo sung', t.count('Đã bổ sung'), '| goi y', t.count('gợi ý'))
    print('fl4:', (await pg.locator('#p4 .fl-box').inner_text()).replace('\n',' | ')[:200])
    # money input
    el=pg.locator('#ki-c37'); await el.click(); await pg.keyboard.type('1234567'); print('money:', await el.input_value())
    await pg.keyboard.press('Tab'); await pg.wait_for_timeout(300)
    # NNT from previous XML + export
    # sửa thuế suất tay
    await pg.locator('#k-nxtbl [data-tsedit]').nth(1).click(); await pg.keyboard.type('10'); await pg.locator('#k-nxtbl [data-tsok]').click(); await pg.wait_for_timeout(300)
    print('sau sua ts:', [l for l in (await pg.inner_text('#k-nxtbl')).split('\n') if 'đã sửa' in l or 'gợi ý' in l][:4]); print('KPI', (await pg.inner_text('#k-kpis')).replace('\n',' '))
    await pg.locator('#kn-ten').fill(''); await pg.locator('#kn-ten').dispatch_event('change')
    await pg.locator('#kn-cu').set_input_files([SAMPLE]); await pg.wait_for_timeout(500); print('toast', await pg.inner_text('#toast'))
    print('c22', await pg.input_value('#ki-c22'))
    await pg.click('#k-xml'); await pg.wait_for_timeout(800)
    await pg.screenshot(path='t4b.png', full_page=True)
    for d in dls: await d.save_as('/tmp/'+d.suggested_filename); print('dl', d.suggested_filename)
    print('errs',errs); await b.close()
asyncio.run(main())
