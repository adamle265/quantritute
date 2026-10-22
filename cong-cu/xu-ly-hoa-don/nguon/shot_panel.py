import asyncio, json, time, base64, re
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read(); MY='9876543210'
names=['CÔNG TY TNHH THƯƠNG MẠI AN PHÁT','Hộ kinh doanh Thu Hà','Công ty CP Bình Minh','CÔNG TY TNHH DỊCH VỤ SAO VIỆT']
rows=[{'id':'id%d'%i,'nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':300+i,'tdlap':'2026-09-%02dT03:00:00'%(28-i%27),'nmten':names[i%4],'nmmst':'0101%06d'%i,'tgtttbso':[1790000,2450000,860000,5320000][i%4],'tthai':1,'ttxly':5} for i in range(46)]
async def handler(route):
    u=route.request.url
    if '/invoices/sold' in u:
        if '/sco-query' in u: return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':[],'total':0}))
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':rows if '09/2026' in u and 'ttxly' not in u else [],'total':46}))
    return await route.fulfill(status=200, content_type='text/html', body='<html><body style="margin:0;background:#eef3f8"></body></html>')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':760,'height':1000}, device_scale_factor=2)
    await ctx.route('https://hoadondientu.gdt.gov.vn/**', handler)
    pay=base64.urlsafe_b64encode(json.dumps({'sub':MY,'exp':int(time.time())+3600}).encode()).decode().rstrip('=')
    await ctx.add_cookies([{'name':'jwt','value':'x.'+pay+'.s','domain':'hoadondientu.gdt.gov.vn','path':'/'}])
    pg=await ctx.new_page(); await pg.goto('https://hoadondientu.gdt.gov.vn/x'); await pg.add_script_tag(content=SRC); await pg.wait_for_timeout(400)
    sr=pg.locator('#qtt-hd-host')
    await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01092026'); await pg.keyboard.type('30092026')
    await sr.locator('#bfind').click(); await sr.locator('#res').wait_for(state='visible'); await pg.wait_for_timeout(300)
    await pg.evaluate("document.activeElement && document.activeElement.blur()")
    await sr.screenshot(path='/tmp/panel.png')
    await b.close()
asyncio.run(main())
from PIL import Image
im=Image.open('/tmp/panel.png'); print(im.size); im.save('/tmp/panel.webp','WEBP',quality=82)
import os; print(os.path.getsize('/tmp/panel.webp'))
open('panelshot.txt','w').write('data:image/webp;base64,'+base64.b64encode(open('/tmp/panel.webp','rb').read()).decode())
