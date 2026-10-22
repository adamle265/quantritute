# Giả lập cổng thuế trả thiếu theo 3 kiểu, kiểm tra nút tìm có ra đủ 120 HĐ không
import asyncio, json, time, re, random, base64, sys
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read(); MY='0700922112'
import datetime as _dt
def utc(m,d,h): return (_dt.datetime(2026,m,d,h)-_dt.timedelta(hours=7)).strftime('%Y-%m-%dT%H:%M:%S')
rows=[{'id':'id%d'%i,'nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':300+i,'tdlap':utc(8 if i<70 else 9,1+(i%28),i%24),
  'nmten':'KH %d'%i,'nmmst':'0101%06d'%i,'tgtttbso':1000,'tthai':1,'ttxly':[5,6,8][i%3]} for i in range(120)]
# HĐ biên: 01/10 lúc 02:00 giờ VN (UTC 30/09 19:00) -> KHÔNG thuộc khoảng 01/08-30/09; 31/07 23:00 VN -> không thuộc
rows.append({'id':'idX','nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':999,'tdlap':utc(10,1,2),'nmten':'BIEN','nmmst':'0','tgtttbso':1,'tthai':1,'ttxly':5})
rows.append({'id':'idY','nbmst':MY,'khmshdon':1,'khhdon':'C26TYY','shdon':998,'tdlap':utc(7,31,23),'nmten':'BIEN2','nmmst':'0','tgtttbso':1,'tthai':1,'ttxly':5})
print('HĐ ngày 01/08 trước 7h sáng (UTC ở 31/07):', sum(1 for r in rows if r['tdlap'].startswith('2026-07-31') and r['nmten']!='BIEN2'))
async def run(mode, seed=1):
    rnd=random.Random(seed); seenurl={}; calls={'n':0}
    async def handler(route):
        u=urlparse(route.request.url); q=parse_qs(u.query)
        if '/invoices/sold' in u.path:
            calls['n']+=1
            if '/sco-query' in u.path: return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':[],'total':0}))
            s=q['search'][0]; m=re.findall(r'tdlap=(ge|le)=(\d\d)/(\d\d)/(\d{4})',s); lo=m[0][3]+m[0][2]+m[0][1]; hi=m[1][3]+m[1][2]+m[1][1]
            d0=_dt.date(int(lo[:4]),int(lo[4:6]),int(lo[6:])); d1=_dt.date(int(hi[:4]),int(hi[4:6]),int(hi[6:]))
            lim=_dt.date(d0.year+(d0.month==12),d0.month%12+1,min(d0.day,28)) if d0.day<=28 else _dt.date(d0.year+(d0.month==12),d0.month%12+1,1)+_dt.timedelta(days=d0.day-1)
            if d1>=lim: calls['loi1thang']=calls.get('loi1thang',0)+1; return await route.fulfill(status=400, content_type='application/json', body=json.dumps({'message':'Khoảng thời gian tìm kiếm không được lớn hơn 1 tháng.'}))
            sel=[r for r in rows if lo<=r['tdlap'][:10].replace('-','')<=hi]
            if 'ttxly' in s: sel=[r for r in sel if str(r['ttxly']) in s.split('ttxly==')[1][:1]]
            asc='tdlap:asc' in u.query; sel=sorted(sel,key=lambda r:r['tdlap'],reverse=not asc)
            tot=len(sel)
            key=u.path+s+q.get('sort',[''])[0]
            if mode=='cache':   # cùng URL -> cùng kết quả thiếu (bộ nhớ đệm), URL mới -> đủ
                if key not in seenurl: seenurl[key]=len(seenurl)<3
                if seenurl[key]: sel=[r for r in sel if r['shdon']%7!=0]; tot=len(sel)
            elif mode=='random':  # mỗi lần gọi 40% trả thiếu ngẫu nhiên, total cũng sai
                if rnd.random()<0.6: sel=[r for r in sel if rnd.random()>0.2]; tot=len(sel)
            elif mode=='total':   # total đúng nhưng datas thiếu ở lần đầu
                if key not in seenurl: seenurl[key]=1; sel=[r for r in sel if r['shdon']%9!=0]
            st=int(q.get('state',['0'])[0]); page=sel[st:st+50]; nxt=st+50
            return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'datas':page,'total':tot,'state':str(nxt) if nxt<len(sel) else None}))
        return await route.fulfill(status=200, content_type='text/html', body='<html><body>x</body></html>')
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1400,'height':950})
        await ctx.route('https://hoadondientu.gdt.gov.vn/**', handler)
        pay=base64.urlsafe_b64encode(json.dumps({'sub':MY,'type':2,'exp':int(time.time())+3600}).encode()).decode().rstrip('=')
        await ctx.add_cookies([{'name':'jwt','value':'eyJhbGciOiJIUzI1NiJ9.'+pay+'.sig','domain':'hoadondientu.gdt.gov.vn','path':'/'}])
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('https://hoadondientu.gdt.gov.vn/x'); await pg.add_script_tag(content=SRC); sr=pg.locator('#qtt-hd-host'); await pg.wait_for_timeout(300)
        await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01082026'); await pg.keyboard.type('30092026')
        t=time.time(); await sr.locator('#bfind').click(); await sr.locator('#res').wait_for(state='visible', timeout=120000)
        print(mode, seed, '| loi1thang', calls.get('loi1thang',0), '| sum:', (await sr.locator('#sum').inner_text()).replace('\n',' '), '| calls', calls['n'], '| %.1fs'%(time.time()-t))
        print('   fmsg:', await sr.locator('#fmsg').inner_text()); m=await sr.locator('#msg').inner_text()
        if m: print('   msg:', m[:200])
        if mode=='random':
            print('   hint:', await sr.locator('#rescanhint').inner_text(), '| nut:', await sr.locator('#brescan').inner_text()); await sr.locator('#brescan').click(); await pg.wait_for_timeout(500); await sr.locator('#bfind:not([disabled])').wait_for(timeout=120000); print('   hint2:', await sr.locator('#rescanhint').inner_text(), '| nut:', await sr.locator('#brescan').inner_text())
            print('   bam Tim lan 2 ->', (await sr.locator('#sum').inner_text()).replace('\n',' '), '|', (await sr.locator('#fmsg').inner_text())[:90])
        if errs: print('   errs', errs)
        await b.close()
async def main():
    for mode in ['ok','cache','total']: await run(mode)
    for sd in range(2,4): await run('random',sd)
asyncio.run(main())
