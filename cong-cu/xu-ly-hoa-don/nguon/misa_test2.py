import asyncio, openpyxl, io, json
from playwright.async_api import async_playwright
T=json.load(open('src/misa-templates.json'))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1350,'height':950})
    pg=await ctx.new_page(); errs=[]; dls=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('download',lambda d:dls.append(d))
    await pg.goto('file:///home/claude/hd/build/index.html')
    await pg.click('#t2'); await pg.set_input_files('#f2',['mua_test.zip','out.zip']); await pg.wait_for_selector('#out2:not([hidden])')
    await pg.click('#t5'); await pg.wait_for_timeout(300)
    await pg.click('#m-mstcode')
    rows=await pg.query_selector_all('#m-itbl tbody tr')
    for r in rows:
        name=await (await r.query_selector('td:nth-child(2)')).inner_text()
        if 'internet' in name:
            await (await r.query_selector('select')).select_option('NVK'); break
    await pg.wait_for_timeout(200)
    for i,el in enumerate(await pg.query_selector_all('#m-itbl input[data-f=ma]')): await el.fill('M%02d'%i); await el.dispatch_event('change')
    for el in await pg.query_selector_all('#m-itbl input[data-f=tk]'):
        if not await el.input_value(): await el.fill('6427'); await el.dispatch_event('change')
    await pg.click('#m-okall'); await pg.wait_for_timeout(200)
    print('mua out:', (await pg.inner_text('#m-out')).replace('\n',' | ')); print('miss:', (await pg.inner_text('#m-miss')).replace('\n',' '))
    await pg.locator('button[data-x=NVK]').click(); await pg.wait_for_timeout(1500)
    await pg.click('#mdir button[data-v=ban]'); await pg.wait_for_timeout(300)
    await pg.click('#m-mstcode')
    for i,el in enumerate(await pg.query_selector_all('#m-itbl input[data-f=ma]')): await el.fill('DV%02d'%i); await el.dispatch_event('change')
    await pg.click('#m-okall'); await pg.wait_for_timeout(200)
    print('ban out:', (await pg.inner_text('#m-out')).replace('\n',' | ')); print('miss:', (await pg.inner_text('#m-miss')).replace('\n',' '))
    await pg.locator('button[data-x=BDV]').click(); await pg.wait_for_timeout(2500)
    for d in dls:
        await d.save_as(d.suggested_filename); wb=openpyxl.load_workbook(d.suggested_filename); ws=wb.worksheets[0]
        k='NVK' if 'Nghiep' in d.suggested_filename else 'BDV'
        print('\n##',d.suggested_filename,'header khớp:', [c.value for c in ws[8]][:len(T[k]['hdr'])]==T[k]['hdr'], 'dòng dữ liệu:', ws.max_row-8)
        for r in list(ws.iter_rows(min_row=9,values_only=True))[:3]:
            dd=dict(zip(T[k]['hdr'],r)); print({kk:dd[kk] for kk in (['Số chứng từ (*)','Diễn giải (Hạch toán)','TK Nợ (*)','TK Có (*)','Số tiền','Mã đối tượng Có','Có hóa đơn','Loại thuế','Giá trị HHDV chưa thuế','% thuế GTGT','Tiền thuế GTGT','Số hóa đơn'] if k=='NVK' else ['Số chứng từ (*)','Mẫu số HĐ','Ký hiệu HĐ','Số hóa đơn','Mã khách hàng','Tên khách hàng','Mã dịch vụ (*)','TK Tiền/Chi phí/Nợ (*)','TK Doanh thu/Có (*)','Thành tiền','% thuế GTGT','Tiền thuế GTGT','TK thuế GTGT'])})
    print('errs',errs); await b.close()
asyncio.run(main())
