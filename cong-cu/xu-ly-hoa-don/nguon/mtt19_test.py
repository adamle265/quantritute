# Kiểm thử bản 1.9.0 trên cổng thuế GIẢ LẬP theo hành vi đo trên cổng thật 09/11/2026:
# - HĐ máy tính tiền: tra tối đa 31 ngày/lần, mỗi lần tra VÀ mỗi lần sang trang cần 1 mã mới (mã dùng 1 lần)
# - tải XML không cần mã; HĐ điện tử không cần mã
# Chạy: python3 mtt19_test.py [403]   (403 = cổng trả 403 khi mã sai, tái hiện góp ý 07/11)
import asyncio, json, io, zipfile, base64, time, re, sys, datetime, os
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read()
Z=os.environ.get('INV_ZIP','invoice.zip')
zsrc=zipfile.ZipFile(Z); base={n:zsrc.read(n) for n in zsrc.namelist()}
MY='0700922112'; SAI403=len(sys.argv)>1 and sys.argv[1]=='403'
dt=[{'id':'d%d'%i,'nbmst':'0101%04d'%i,'khmshdon':1,'khhdon':'C26TYY','shdon':100+i,'tdlap':'2026-%02d-%02dT03:00:00'%(7+i%3,1+i%28),'nbten':'Cty A','tgtttbso':100000,'tthai':1,'ttxly':5} for i in range(20)]
# MTT: 70 HĐ trong tháng 9 (>50 → trang 2), 5 HĐ tháng 7, 3 HĐ tháng 8, 1 HĐ lập 06:30 sáng 01/07 giờ VN (= 30/06 23:30 UTC)
mtt=[{'id':'m%d'%i,'nbmst':'0300%04d'%i,'khmshdon':1,'khhdon':'C26MAA','shdon':500+i,'tdlap':'2026-09-%02dT02:00:00'%(1+i%28),'nbten':'Nhà hàng','tgtttbso':50000,'tthai':1,'ttxly':8} for i in range(70)]
mtt+=[{'id':'j%d'%i,'nbmst':'0310','khmshdon':1,'khhdon':'C26MBB','shdon':900+i,'tdlap':'2026-07-%02dT02:00:00'%(3+i),'nbten':'Cafe','tgtttbso':30000,'tthai':1,'ttxly':8} for i in range(5)]
mtt+=[{'id':'a%d'%i,'nbmst':'0311','khmshdon':1,'khhdon':'C26MCC','shdon':950+i,'tdlap':'2026-08-%02dT02:00:00'%(10+i),'nbten':'Xang','tgtttbso':40000,'tthai':1,'ttxly':8} for i in range(3)]
mtt+=[{'id':'utc','nbmst':'0312','khmshdon':1,'khhdon':'C26MDD','shdon':999,'tdlap':'2026-06-30T23:30:00','nbten':'Banh mi','tgtttbso':20000,'tthai':1,'ttxly':8}]
caps={}; used=set(); log={'cap':0,'seq':[],'bad':0,'export_mtt':0,'range_err':0}
SVG='<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50"><text x="10" y="35" font-size="28">%s</text></svg>'
def zipfor():
    b=io.BytesIO(); z=zipfile.ZipFile(b,'w')
    for n,v in base.items(): z.writestr(n,v)
    z.close(); return b.getvalue()
def rng(s):
    m=re.findall(r'tdlap=(ge|le)=(\d\d)/(\d\d)/(\d{4})',s)
    return datetime.date(int(m[0][3]),int(m[0][2]),int(m[0][1])), datetime.date(int(m[1][3]),int(m[1][2]),int(m[1][1]))
def inr(r,d0,d1): return d0<=datetime.date.fromisoformat(r['tdlap'][:10])<=d1
async def handler(route):
    u=urlparse(route.request.url); q=parse_qs(u.query)
    if u.path=='/api/captcha':
        log['cap']+=1; k='k%d'%log['cap']; caps[k]='AB%d'%log['cap']
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'key':k,'content':SVG%caps[k]}))
    if '/invoices/purchase' in u.path:
        d0,d1=rng(q['search'][0]); st=int(q.get('state',['0'])[0] or 0)
        if '/sco-query' in u.path:
            k=q.get('ckey',[None])[0]; v=q.get('cvalue',[None])[0]
            log['seq'].append(('mtt',str(d0),str(d1),st,k))
            if not k: return await route.fulfill(status=400, body=json.dumps({'message':"Required request parameter 'ckey' is not present"}))
            if caps.get(k)!=v or k in used:
                log['bad']+=1
                return await route.fulfill(status=403 if SAI403 else 400, content_type='application/json', body=json.dumps({'message':'Mã captcha không hợp lệ' if not SAI403 else 'Forbidden'}))
            used.add(k)
            if (d1-d0).days>30: log['range_err']+=1; return await route.fulfill(status=400, body=json.dumps({'message':'Khoảng thời gian tìm kiếm không được lớn hơn 31 ngày'}))
            sel=[r for r in mtt if inr(r,d0,d1)]
        else:
            log['seq'].append(('dt',str(d0),str(d1),st,None))
            sel=[r for r in dt if inr(r,d0,d1)]
        page=sel[st:st+50]; nxt=st+50
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':page,'total':len(sel),'state':str(nxt) if nxt<len(sel) else None}))
    if '/export-xml' in u.path:
        if 'ckey' in q: return await route.fulfill(status=400, body='{"message":"khong can ma"}')
        if '/sco-query' in u.path: log['export_mtt']+=1
        return await route.fulfill(status=200, body=zipfor())
    return await route.fulfill(status=200, content_type='text/html', body='<html><body>gia</body></html>')
async def typecap(pg,sr,val=None):
    await sr.locator('#cap').wait_for(state='visible',timeout=20000)
    await pg.wait_for_function("()=>{const r=document.querySelector('#qtt-hd-host').shadowRoot;return !r.getElementById('capok').disabled}")
    t=await sr.locator('#capt').inner_text(); k='k%d'%log['cap']
    await sr.locator('#capin').fill(val if val is not None else caps[k]); await sr.locator('#capin').press('Enter')
    await pg.wait_for_timeout(400); return t
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1300,'height':950})
    await ctx.route('https://hoadondientu.gdt.gov.vn/**', handler)
    pay=base64.urlsafe_b64encode(json.dumps({'sub':MY,'exp':int(time.time())+3600}).encode()).decode().rstrip('=')
    await ctx.add_cookies([{'name':'jwt','value':'eyJhbGciOiJIUzI1NiJ9.'+pay+'.sig','domain':'hoadondientu.gdt.gov.vn','path':'/'}])
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('https://hoadondientu.gdt.gov.vn/tra-cuu/tra-cuu-hoa-don'); await pg.add_script_tag(content=SRC)
    sr=pg.locator('#qtt-hd-host')
    await sr.locator('#dir button[data-v=mua]').click()
    await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01072026'); await pg.keyboard.type('30092026')
    await sr.locator('#bfind').click()
    print('scanmax:', await sr.locator('#scanmax').inner_text())
    print('cap1', await typecap(pg,sr,'SAI'))
    await sr.locator('#caperr').wait_for(state='visible'); print('  err shown:', await sr.locator('#caperr').inner_text())
    print('  relog panel visible:', await sr.locator('#relog').is_visible())
    await pg.screenshot(path='t1.png')
    for i in range(4): print('cap', i+2, await typecap(pg,sr))
    await pg.screenshot(path='t2.png')
    await sr.locator('#res').wait_for(state='visible', timeout=60000)
    print('sum:', await sr.locator('#sum').inner_text()); print('fmsg:', await sr.locator('#fmsg').inner_text())
    print('captcha calls',log['cap'],'bad',log['bad'],'range_err',log['range_err'])
    fdt=next((i for i,x in enumerate(log['seq']) if x[0]=='dt'),None); lmtt=max(i for i,x in enumerate(log['seq']) if x[0]=='mtt')
    print('MTT truoc HD dien tu:', lmtt < fdt, '| thu tu MTT:', [x[1:4] for x in log['seq'] if x[0]=='mtt'])
    n0=log['cap']; await sr.locator('#brescan').click(); await pg.wait_for_timeout(5000)
    print('rescan asked captcha:', log['cap']-n0, 'cap visible', await sr.locator('#cap').is_visible())
    async with pg.expect_download(timeout=180000) as dl: await sr.locator('#bdl').click()
    d=await dl.value; fp=await d.path(); z=zipfile.ZipFile(fp)
    print('download', d.suggested_filename, 'xml files', len([n for n in z.namelist() if n.startswith('XML/')]), 'export mtt calls', log['export_mtt'])
    print('errs',errs)
    await b.close()
asyncio.run(main())
