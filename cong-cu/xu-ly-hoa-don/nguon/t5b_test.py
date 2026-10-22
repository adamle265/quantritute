import asyncio, openpyxl
from playwright.async_api import async_playwright
Q3='/root/.claude/uploads/87321939-9c53-53ca-a247-c55b550cd597/a20972af-HoaDon_MuaVao_Q3.zip'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1400,'height':950}); pg=await ctx.new_page(); errs=[]; dls=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('download',lambda d:dls.append(d))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',[Q3]); await pg.wait_for_selector('#out2:not([hidden])')
    await pg.click('#t5'); await pg.wait_for_timeout(500)
    print('fl5:', (await pg.locator('#p5 .fl-box').inner_text()).replace('\n',' | ')[:120])
    items=await pg.eval_on_selector_all('#m-itbl tbody tr','rs=>rs.map(r=>[r.cells[1]?.innerText.split("\\n")[0],r.cells[5]?.querySelector("select")?.value,r.cells[6]?.innerText])')
    import collections; print('loai:', collections.Counter(i[1] for i in items)); print('vd NVK:', [i[0] for i in items if i[1]=='NVK'][:6]); print('vd khac:', [(i[0],i[1]) for i in items if i[1]!='NVK'][:8])
    print('nocode cells:', await pg.locator('#m-itbl .nocode').count())
    await pg.locator('#m-dmncc').set_input_files(['/tmp/dm_ncc.xlsx']); await pg.wait_for_timeout(500); print('toast', await pg.inner_text('#toast'))
    print('ncc info:', await pg.inner_text('#m-dmncc-t'), '| h:', await pg.inner_text('#m-p-h'), '| rows', await pg.locator('#m-ptbl tbody tr').count())
    await pg.click('#m-mstcode'); await pg.wait_for_timeout(300)
    await pg.click('#m-xncc'); await pg.wait_for_timeout(800)
    await pg.locator('#m-dmvt').set_input_files(['/tmp/dm_vt.xlsx']); await pg.wait_for_timeout(500); print('toast', await pg.inner_text('#toast')); print('vt:', await pg.inner_text('#m-dmvt-t'))
    # bulk
    await pg.locator('#m-itbl input[data-sel]').nth(3).check(); await pg.wait_for_timeout(200)
    print('bulk:', await pg.inner_text('#m-seln')); await pg.click('#m-selinv'); await pg.wait_for_timeout(300); print('after selinv:', await pg.inner_text('#m-seln'))
    await pg.select_option('#m-bloai','NVK'); await pg.fill('#m-btk','6422'); await pg.click('#m-bapply'); await pg.wait_for_timeout(300); print('toast', await pg.inner_text('#toast'))
    await pg.click('#m-xvt'); await pg.wait_for_timeout(800)
    # open invoice link
    async with ctx.expect_page() as np:
        await pg.locator('#m-itbl a[data-openinv]').first.click()
    newp=await np.value; await newp.wait_for_timeout(500); print('tab moi:', (await newp.title()), (await newp.inner_text('body'))[:150].replace('\n',' '))
    async with ctx.expect_page() as np2:
        await pg.locator('#m-vtbl a[data-openinv]').first.click()
    n2=await np2.value; await n2.wait_for_timeout(300); print('tab vtbl:', await n2.title())
    await pg.locator('#ms-tkHangHoa').count()
    await pg.screenshot(path='t5b.png', full_page=True)
    for d in dls:
        fn='/tmp/'+d.suggested_filename; await d.save_as(fn); ws=openpyxl.load_workbook(fn).active; print('##',d.suggested_filename, ws.max_row-8,'dòng'); 
        for r in list(ws.iter_rows(min_row=8,max_row=11,values_only=True)): print('  ',r)
    print('errs',errs); await b.close()
asyncio.run(main())
