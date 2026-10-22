import asyncio, json, io, zipfile, base64, time, re, random
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read()
Z='/mnt/user-data/uploads/Dự án 5.0/quantritute/cong-cu/Tải, tra cứu hóa đơn/Hướng dẫn tạo tool/Ảnh và file sử dụng/invoice.zip'
zsrc=zipfile.ZipFile(Z); base={n:zsrc.read(n) for n in zsrc.namelist()}
xml0=base['invoice.xml'].decode()
MY='0700922112'
# 120 hóa đơn bán ra, 2 tháng
rows=[]
for i in range(120):
    m=8 if i<70 else 9; d=1+(i%28)
    rows.append({'id':'id%d'%i,'nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':300+i,'tdlap':'2026-%02d-%02dT00:00:00'%(m,d),
      'nmten':['CÔNG TY TNHH ĐAM MÊ KẾ TOÁN VIỆT','Công ty CP Bình Minh','Hộ kinh doanh Thu Hà'][i%3],'nmmst':'0101%06d'%i,'tgtttbso':1790000,'tthai':4 if i==5 else (2 if i==6 else 1),'ttxly':5})
def mkxml(r):
    x=xml0.replace('<SHDon>00000222</SHDon>','<SHDon>%08d</SHDon>'%r['shdon']).replace('<NLap>2026-08-19</NLap>','<NLap>%s</NLap>'%r['tdlap'][:10])
    if r['shdon']==306: x=x.replace('</TTChung>','<TTHDLQuan><TCHDon>1</TCHDon><LHDCLQuan>1</LHDCLQuan><KHMSHDCLQuan>1</KHMSHDCLQuan><KHHDCLQuan>C26TYY</KHHDCLQuan><SHDCLQuan>00000305</SHDCLQuan><NLHDCLQuan>2026-08-06</NLHDCLQuan></TTHDLQuan></TTChung>')
    return x
cnt={'export':0,'403':0}
def zipfor(r):
    b=io.BytesIO(); z=zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED)
    for n,v in base.items(): z.writestr(n, mkxml(r).encode() if n=='invoice.xml' else v)
    z.close(); return b.getvalue()
SCEN={'fail_shdon':310,'block_once_at':5,'expire_at':40}
expired={'v':False}
async def handler(route):
    u=urlparse(route.request.url); q=parse_qs(u.query); h=route.request.headers
    if u.path.startswith('/api/'):
        if not h.get('action') or not h.get('end-point') or not h.get('authorization','').startswith('Bearer '):
            return await route.fulfill(status=403, body=json.dumps({'status':403,'message':'Hệ thống phát hiện hành vi không hợp lệ. Yêu cầu đã bị chặn.'}))
        if expired['v']: return await route.fulfill(status=401, body='{"message":"Unauthorized"}')
        if '/invoices/sold' in u.path:
            s=q['search'][0]; m=re.findall(r'tdlap=(ge|le)=(\d\d)/(\d\d)/(\d{4})',s)
            lo=m[0][3]+m[0][2]+m[0][1]; hi=m[1][3]+m[1][2]+m[1][1]
            if '/sco-query' in u.path: return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':[],'total':0}))
            sel=[r for r in rows if lo<=r['tdlap'][:10].replace('-','')<=hi]
            if 'ttxly' not in s and lo.startswith('202609'): sel=[r for r in sel if r['shdon']%10!=0]  # gia lap cong thue tra thieu
            st=int(q.get('state',['0'])[0]); page=sel[st:st+50]; nxt=st+50
            return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':page,'total':len(sel),'state':str(nxt) if nxt<len(sel) else None}))
        if '/export-xml' in u.path:
            cnt['export']+=1
            if cnt['export']==SCEN['block_once_at']: cnt['403']+=1; return await route.fulfill(status=403, body=json.dumps({'status':403,'message':'Hệ thống phát hiện hành vi không hợp lệ. Yêu cầu đã bị chặn.'}))
            if cnt['export']==SCEN['expire_at']: expired['v']=True; return await route.fulfill(status=401, body='{}')
            r=[x for x in rows if str(x['shdon'])==q['shdon'][0]][0]
            if r['shdon']==SCEN['fail_shdon']: return await route.fulfill(status=500, body='{"message":"Internal error"}')
            if r['shdon']==315: return await route.fulfill(status=500, content_type='application/json', body=json.dumps({'message':'Không tồn tại hồ sơ gốc của hóa đơn.','path':'uri=/invoices/export-xml'}))
            return await route.fulfill(status=200, body=zipfor(r))
    return await route.fulfill(status=200, content_type='text/html', body='<html><body><h3>Trang thuế giả</h3></body></html>')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1400,'height':950})
    await ctx.route('https://hoadondientu.gdt.gov.vn/**', handler)
    pay=base64.urlsafe_b64encode(json.dumps({'sub':MY,'type':2,'exp':int(time.time())+3600,'iat':int(time.time())}).encode()).decode().rstrip('=')
    await ctx.add_cookies([{'name':'jwt','value':'eyJhbGciOiJIUzI1NiJ9.'+pay+'.sig','domain':'hoadondientu.gdt.gov.vn','path':'/'}])
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('https://hoadondientu.gdt.gov.vn/tra-cuu/tra-cuu-hoa-don')
    await pg.add_script_tag(content=SRC)
    sr=pg.locator('#qtt-hd-host')
    await pg.wait_for_timeout(300)
    await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01082026'); await pg.keyboard.type('30092026')
    await pg.screenshot(path='m1.png')
    await sr.locator('#bfind').click()
    await sr.locator('#res').wait_for(state='visible', timeout=30000)
    print('sum:', await sr.locator('#sum').inner_text(), '|', await sr.locator('#seln').inner_text())
    await pg.screenshot(path='m2.png')
    # tick gói gốc
    await sr.locator('#ogoc').check()
    await sr.locator('#bdl').click()
    await sr.locator('#bcont').wait_for(state='visible', timeout=120000)
    print('paused msg:', await sr.locator('#msg').inner_text())
    await pg.screenshot(path='m3.png')
    expired['v']=False
    async with pg.expect_download(timeout=180000) as dl:
        await sr.locator('#bcont').click()
    d=await dl.value; path='out.zip'; await d.save_as(path)
    print('download name:', d.suggested_filename)
    print('fmsg:', await sr.locator('#fmsg').inner_text()); print('final msg:', await sr.locator('#msg').inner_text())
    await pg.screenshot(path='m4.png')
    print('errs', errs, 'export calls', cnt)
    await b.close()
asyncio.run(main())
