import asyncio, json, io, zipfile, base64, time, re, sys
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read()
Z='/mnt/user-data/uploads/Dự án 5.0/quantritute/cong-cu/Tải, tra cứu hóa đơn/Hướng dẫn tạo tool/Ảnh và file sử dụng/invoice.zip'
zsrc=zipfile.ZipFile(Z); base={n:zsrc.read(n) for n in zsrc.namelist()}
MY='0123456789'
SKIP=len(sys.argv)>1 and sys.argv[1]=='skip'
dt=[{'id':'d%d'%i,'nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':100+i,'tdlap':'2026-09-%02dT03:00:00'%(1+i%28),'nmten':'Cty A','nmmst':'0101','tgtttbso':100000,'tthai':1,'ttxly':5} for i in range(20)]
# 70 HĐ MTT, dồn vào 01-10/09 (>50 để có trang 2)
mtt=[{'id':'m%d'%i,'nbmst':MY,'khmshdon':1,'khhdon':'C26MAA','shdon':500+i,'tdlap':'2026-09-%02dT02:00:00'%(1+i%10 if i<60 else 15+i%10),'nmten':'Khách lẻ','nmmst':'','tgtttbso':50000,'tthai':1,'ttxly':8} for i in range(70)]
caps={}; log={'cap':0,'sco':[],'bad':0,'export_mtt':0}
SVG='<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50"><path d="M5 30 Q40 5 75 28 T145 20" stroke="#999" fill="none"/><text x="18" y="35" font-size="28" font-family="serif" fill="#333" letter-spacing="6">%s</text></svg>'
def zipfor(r):
    b=io.BytesIO(); z=zipfile.ZipFile(b,'w')
    for n,v in base.items(): z.writestr(n,v)
    z.close(); return b.getvalue()
def rng(s):
    m=re.findall(r'tdlap=(ge|le)=(\d\d)/(\d\d)/(\d{4})',s); return m[0][3]+m[0][2]+m[0][1], m[1][3]+m[1][2]+m[1][1], m
async def handler(route):
    u=urlparse(route.request.url); q=parse_qs(u.query); h=route.request.headers
    if u.path=='/api/captcha':
        log['cap']+=1; k='k%d'%log['cap']; caps[k]='K7mQ2'
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'key':k,'content':SVG%caps[k]}))
    if '/invoices/sold' in u.path:
        s=q['search'][0]; lo,hi,m=rng(s)
        if '/sco-query' in u.path:
            k=q.get('ckey',[None])[0]; v=q.get('cvalue',[None])[0]
            log['sco'].append((lo,hi,k,v,q.get('state',[''])[0],h.get('ckey'),h.get('cvalue')))
            if not k: return await route.fulfill(status=400, body=json.dumps({'message':"Required request parameter 'ckey' is not present"}))
            if caps.get(k)!=v: log['bad']+=1; return await route.fulfill(status=400, content_type='application/json', body=json.dumps({'message':'Mã captcha không đúng'}))
            import datetime
            d0=datetime.date(int(m[0][3]),int(m[0][2]),int(m[0][1])); d1=datetime.date(int(m[1][3]),int(m[1][2]),int(m[1][1]))
            if (d1-d0).days>9: return await route.fulfill(status=400, body=json.dumps({'message':'Khoảng thời gian tìm kiếm không được lớn hơn 10 ngày.'}))
            sel=[r for r in mtt if lo<=r['tdlap'][:10].replace('-','')<=hi]
        else:
            sel=[r for r in dt if lo<=r['tdlap'][:10].replace('-','')<=hi]
        st=int(q.get('state',['0'])[0] or 0); page=sel[st:st+50]; nxt=st+50
        return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':page,'total':len(sel),'state':str(nxt) if nxt<len(sel) else None}))
    if '/export-xml' in u.path:
        if '/sco-query' in u.path: log['export_mtt']+=1
        return await route.fulfill(status=200, body=zipfor(None))
    return await route.fulfill(status=200, content_type='text/html', body='<html><body>gia</body></html>')
async def typecap(pg,sr,val=None):
    await sr.locator('#cap').wait_for(state='visible',timeout=20000)
    await pg.wait_for_function("()=>{const r=document.querySelector('#qtt-hd-host').shadowRoot;return !r.getElementById('capok').disabled}")
    k='k%d'%log['cap']
    await sr.locator('#capin').fill(val if val is not None else caps[k]); await sr.locator('#capin').press('Enter')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True, viewport={'width':1300,'height':1300}, device_scale_factor=2)
    await ctx.route('https://hoadondientu.gdt.gov.vn/**', handler)
    pay=base64.urlsafe_b64encode(json.dumps({'sub':MY,'exp':int(time.time())+3600}).encode()).decode().rstrip('=')
    await ctx.add_cookies([{'name':'jwt','value':'eyJhbGciOiJIUzI1NiJ9.'+pay+'.sig','domain':'hoadondientu.gdt.gov.vn','path':'/'}])
    pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('https://hoadondientu.gdt.gov.vn/tra-cuu/tra-cuu-hoa-don'); await pg.add_script_tag(content=SRC)
    sr=pg.locator('#qtt-hd-host')
    await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01092026'); await pg.keyboard.type('30092026')
    await sr.locator('#bfind').click()
    await sr.locator('#cap').wait_for(state='visible',timeout=20000)
    await pg.wait_for_function("()=>{const r=document.querySelector('#qtt-hd-host').shadowRoot;return !r.getElementById('capok').disabled}")
    await sr.locator('#capin').fill('K7mQ2'); await pg.wait_for_timeout(300)
    await sr.screenshot(path='/tmp/claude-0/-home-claude/87321939-9c53-53ca-a247-c55b550cd597/scratchpad/panel171.png')
    await b.close()
asyncio.run(main())
