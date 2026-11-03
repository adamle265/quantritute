import asyncio, base64, io, json, re, sys, zipfile, urllib.parse as up
from playwright.async_api import async_playwright
import os; SRC=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','build','tk-panel.bundle.js')
MODE=sys.argv[1] if len(sys.argv)>1 else 'full'
CAP='ABCDE'
st={'cur':set(),'searched':None,'dl':0,'n429':0,'expired':False,'calls':[]}
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
def mk(ma,tk,ky,loai,lanbs,lan,ngay,tt,mst='0123456789'):
    return dict(ma=ma,tk=tk,ky=ky,loai=loai,lanbs=lanbs,lan=lan,ngay=ngay,tt=tt,mst=mst)
GT='01/GTGT - TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG Mẫu số 01/GTGT (TT80/2021)'
TN='05/KK-TNCN - Tờ khai thuế thu nhập cá nhân (TT80/2021)'
HD='01/ĐKTĐ-HĐĐT - Đăng ký/thay đổi thông tin sử dụng hóa đơn điện tử'
DATA=[]
# tháng 10: 14 hồ sơ ; tháng 11: 3
DATA.append(mk('G12.18-250715-00000001',GT,'Q2/2025','Chính thức','0','1','15/07/2025 10:00','Đã chấp nhận'))
DATA.append(mk('G12.18-261015-00088306',GT,'Q3/2026','Chính thức','0','1','15/10/2026 11:33','Đã chấp nhận'))
DATA.append(mk('G12.18-261020-00090001',GT,'Q3/2026','Bổ sung','1','2','20/10/2026 09:10','Đã chấp nhận'))
DATA.append(mk('G12.18-261025-00090002',GT,'Q3/2026','Bổ sung','2','3','25/10/2026 16:45','Không chấp nhận'))
DATA.append(mk('G12.18-261015-00083533',TN,'Q3/2026','Chính thức','0','1','15/10/2026 11:19','Đã chấp nhận'))
DATA.append(mk('G12.18-261009-00039007',HD,'','Chính thức','','1','09/10/2026 10:00','Hồ sơ đã hủy'))
DATA.append(mk('G12.18-261014-00030177',HD,'','Chính thức','','1','14/10/2026 09:21','Đã trả kết quả'))
for i in range(8):
    DATA.append(mk('G12.18-2610%02d-0010%04d'%(i+1,i),'01/NTNN - Tờ khai thuế nhà thầu nước ngoài mẫu số 01/NTNN (TT80/2021)','%02d/2026'%(i+1),'Chính thức','0','1','%02d/10/2026 08:00'%(i+1),'Đã chấp nhận'))
DATA.append(mk('G12.18-261103-00200001',GT,'Q3/2026','Bổ sung','2','4','03/11/2026 10:00','Đang xử lý'))
DATA.append(mk('G12.18-261105-00200002',TN,'Q3/2026','Bổ sung','1','2','05/11/2026 10:00','Đã chấp nhận'))
DATA.append(mk('G12.18-261106-00200003',HD,'','Chính thức','','1','06/11/2026 10:00','Đã trả kết quả'))
TDT=[]
for i,(ten,ky,ngay,tt,code) in enumerate([
 ('TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (TT80/2021)(00-Hoạt động sản xuất kinh doanh thông thường-)','Q4/2024','20/01/2025 14:04:26','Cơ quan thuế chấp nhận hồ sơ khai thuế điện tử của NNT','842'),
 ('TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (TT80/2021)(00-Hoạt động sản xuất kinh doanh thông thường-)','Q4/2024','05/02/2025 09:00:00','Không chấp nhận việc nộp HSKT điện tử',''),
 ('TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (TT80/2021)(00-Hoạt động sản xuất kinh doanh thông thường-)','Q3/2024','21/10/2024 10:00:00','Chấp nhận việc nộp HSKT điện tử',''),
 ('Tờ khai quyết toán thuế TNDN (TT80/2021)','2024','28/03/2025 10:00:00','Chấp nhận việc nộp HSKT điện tử',''),
 ('Bảng tổng hợp đăng ký người phụ thuộc giảm trừ gia cảnh','2025','26/02/2025 10:08:39','Đã cấp mã số thuế cho người phụ thuộc thành công',''),
]+[('Tờ khai thuế thu nhập cá nhân (TT80/2021)','Q%d/2024'%q,'%02d/%02d/2024 08:00:00'%(10+q,q*3+1 if q<4 else 12),'Chấp nhận việc nộp HSKT điện tử','864' if q%2 else '') for q in (1,2,3)]+[('Tờ khai lệ phí môn bài (TT80/2021)','2024','%02d/01/2024 08:00:00'%(d+2),'Chấp nhận việc nộp HSKT điện tử','') for d in range(8)]):
    TDT.append(dict(ma='1132025%010d'%i,tk=ten,ky=ky,ngay=ngay,tt=tt,code=code))
def ttable(rows,total,page,size):
    th=''.join('<th>%s</th>'%h for h in ['STT','Mã giao dịch','Tờ khai/Phụ lục','Kỳ tính thuế','Loại tờ khai','Lần nộp','Lần bổ sung','Ngày nộp','Nơi nộp','Tiến trình giải quyết hồ sơ (Trạng thái)','Thao tác'])
    trs=''.join('<tr><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td>Chính thức</td><td>1</td><td>0</td><td>%s</td><td>Thuế cơ sở 15</td><td>%s</td><td><i class="bi bi-eye" onclick="viewDetail(this)" data-ma-ho-so="%s" data-loai="ETAX"></i>%s</td></tr>'%(i+1,r['ma'],r['tk'],r['ky'],r['ngay'],r['tt'],r['ma'],('<i onclick="kkhaiBSung(this)" data-ma-tkhai="%s" data-mst-nop="0123456789" data-mst-nop-thay="0123456789"></i>'%r['code']) if r['code'] else '') for i,r in enumerate(rows))
    return '<div><span>Trang <span>%d</span>/ <span>%d</span> — Tổng số bản ghi: <span>%d</span></span><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'%(page,max(1,-(-total//size)),total,th,trs)
def inrange(r,a,b):
    def k(s): d,m,y=s[:10].split('/'); return y+m+d
    return k(a)<=k(r['ngay'])<=k(b)
def table(rows,total,page,size):
    pages=max(1,-(-total//size))
    th=''.join('<th>%s</th>'%h for h in ['STT','Thao tác','Mã hồ sơ','Tên TTHC','Tờ khai','Kỳ tính thuế','Loại tờ khai','Lần nộp bổ sung','Lần nộp (Tờ khai)/File số (DLVC)','Cơ quan thuế tiếp nhận','Ngày nộp','Trạng thái','Hồ sơ đính kèm'])
    trs=''
    for i,r in enumerate(rows):
        bs='<i class="bi bi-folder-symlink-fill" onclick="kkhaiBSung(this)" data-ma-ho-so="%s" data-mst-nop="%s" data-mst-nop-thay="null"></i>'%(r['ma'],r['mst']) if r['ky'] else ''
        trs+='<tr><td>%d</td><td><i class="bi bi-eye" onclick="viewDetail(this)" data-ma-ho-so="%s"></i>%s</td><td class="align-middle labelTableBody">%s</td><td><a><span>1.007014 - Khai thuế ...</span></a></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>10127 - Thuế cơ sở 15</td><td>%s</td><td><span class="badge">%s</span><br></td><td></td></tr>'%((page-1)*size+i+1,r['ma'],bs,r['ma'],r['tk'],r['ky'],r['loai'],r['lanbs'],r['lan'],r['ngay'],r['tt'])
    return '<div id="table-container"><div><span>Trang <input value="%d">/<span id="totalPage">%d</span> - Tổng số bản ghi: <span>%d</span></span></div><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'%(page,pages,total,th,trs)
def zipfor(ma):
    b=io.BytesIO(); z=zipfile.ZipFile(b,'w')
    z.writestr('files_%s_0.xml'%ma,'<?xml version="1.0"?><HSoThueDTu><ma>%s</ma></HSoThueDTu>'%ma)
    if ma.endswith('1'): z.writestr('files_%s_1.pdf'%ma,'%PDF-1.4 test')
    z.close(); return b.getvalue()
DETAIL='''<html><body><main><h2>Thông tin hồ sơ</h2><div class="modal"><div class="modal-body"><div class="row"><div class="col">Xem thông báo</div></div>%s</div></div></main></body></html>'''
def detail(ma):
    items=''
    n=2 if 'GTGT' in ma or True else 0
    for i in range(n):
        items+='<div class="row border-bottom"><div class="col-7">V/v: %s</div><div class="col-3">15:21 16/10/2026</div><div class="col-2"><a class="bi bi-download" href="#" onclick="downloadThongBao(this); return false;" data-id="1082026%010d">Tải xuống</a></div></div>'%(['Tiếp nhận hồ sơ thuế điện tử TT19','Xác nhận nộp hồ sơ thuế điện tử TT19'][i], int(ma[-5:])*10+i)
    return DETAIL%items
TCHS='''<html><head><meta name="csrf-token" content="tok123"><meta name="csrf-header" content="X-XSRF-TOKEN"></head><body><form id="form-search-advanced"><select name="maToKhai"><option value="">---Tất cả---</option><option value="842">01/GTGT - Tờ khai GTGT</option><option value="864">05/KK-TNCN - Tờ khai TNCN</option></select><input name="captcha"></form><img id="image-capt" src="/tthc/getCaptcha?1"></body></html>'''
async def handle(route):
    req=route.request; u=up.urlparse(req.url); q=dict(up.parse_qsl(u.query,keep_blank_values=True)); p=u.path
    st['calls'].append((req.method,p))
    if st['expired'] and p!='/tthc/homelogin' and not p.startswith('/tthc/getCaptcha'):
        return await route.fulfill(status=200,content_type='text/html',body='<html><body><form><input type=password></form>Đăng nhập</body></html>')
    if p=='/tthc/homelogin': return await route.fulfill(status=200,content_type='text/html',body='<html><body>Đăng nhập</body></html>')
    if p=='/tthc/tchs': return await route.fulfill(status=200,content_type='text/html',body=TCHS)
    if p.startswith('/tthc/getCaptcha'): return await route.fulfill(status=200,content_type='image/png',body=PNG)
    if p=='/tthc/ho-so/search':
        assert req.headers.get('hx-request')=='true'
        a,b=q['tuNgay'],q['denNgay']
        def k(s): d,m,y=s.split('/'); return int(y+m+d)
        if q.get('captcha'):
            if q['captcha']!=CAP: return await route.fulfill(status=400,content_type='text/plain',body='Mã captcha không chính xác')
            st['searched']=(a,b)
        else:
            if st['searched']!=(a,b): return await route.fulfill(status=400,content_type='text/plain',body='Mã captcha không chính xác')
        rows=[r for r in DATA if inrange(r,a,b) and (not q.get('maToKhai') or q['maToKhai'] in ('842',) and 'GTGT' in r['tk'] or q['maToKhai']=='864' and 'TNCN' in r['tk'])]
        rows.sort(key=lambda r:r['ngay'][6:10]+r['ngay'][3:5]+r['ngay'][:2],reverse=True)
        page=int(q.get('page') or 1); size=int(q.get('size') or 10)
        if not rows: return await route.fulfill(status=200,content_type='text/html',body='<div id="table-container"><p>Không có dữ liệu</p></div>')
        sl=rows[(page-1)*size:page*size]; st['cur']=set(r['ma'] for r in sl)
        return await route.fulfill(status=200,content_type='text/html',body=table(sl,len(rows),page,size))
    if p=='/tthc/tchs/downloadhoso':
        assert req.headers.get('x-xsrf-token')=='tok123', req.headers
        st['dl']+=1
        if MODE=='429' and st['dl']==3 and st['n429']==0:
            st['n429']+=1; return await route.fulfill(status=429,body='Too Many Requests')
        if MODE=='relog' and st['dl']==4: st['expired']=True; return await route.fulfill(status=200,content_type='text/html',body='<html><body>Đăng nhập</body></html>')
        ma=json.loads(req.post_data)['maHoSo']
        if ma not in st['cur']: return await route.fulfill(status=500,content_type='application/json',body=json.dumps({'error':'Hồ sơ truyền lên không hợp lệ'}))
        if ma=='G12.18-261014-00030177' and MODE!='thumb': return await route.fulfill(status=500,content_type='application/json',body=json.dumps({'error':'Lỗi hệ thống thử'}))
        return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'fileName':'files_%s.zip'%ma,'fileType':'application/zip','content':base64.b64encode(zipfor(ma)).decode()}))
    if p=='/tthc/tchs/thuedientu':
        f=dict(up.parse_qsl(req.post_data,keep_blank_values=True)); a,b=f['tuNgay_tdt'],f['denNgay_tdt']
        assert f['_csrf']=='tok123' and req.headers.get('x-xsrf-token')=='tok123'
        if f.get('captcha'):
            if f['captcha']!=CAP: return await route.fulfill(status=400,content_type='text/plain',body='Mã captcha không chính xác')
            st['tsearched']=(a,b)
        elif st.get('tsearched')!=(a,b): return await route.fulfill(status=400,content_type='text/plain',body='Mã captcha không chính xác')
        rows=[r for r in TDT if inrange(r,a,b)]; rows.sort(key=lambda r:r['ngay'][6:10]+r['ngay'][3:5]+r['ngay'][:2],reverse=True)
        page=int(f.get('page') or 1); size=int(f.get('size') or 10); sl=rows[(page-1)*size:page*size]; st['cur']=set(r['ma'] for r in sl)
        return await route.fulfill(status=200,content_type='text/html',body=ttable(sl,len(rows),page,size))
    if p=='/tthc/tchs/downloadhoso-tdt':
        ma=json.loads(req.post_data)['maHoSo']
        if ma not in st['cur']: return await route.fulfill(status=500,content_type='application/json',body=json.dumps({'error':'Tải hồ sơ thất bại'}))
        return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'fileName':'files_%s.zip'%ma,'fileType':'application/zip','content':base64.b64encode(zipfor(ma)).decode()}))
    if p=='/tthc/tchs/downloadthongbao-tdt':
        ma=json.loads(req.post_data)['idTbao']; b=io.BytesIO(); z=zipfile.ZipFile(b,'w'); z.writestr('files_%s_0.xml'%ma,'<TB/>'); z.writestr('files_%s_1.xml'%ma,'<TB2/>'); z.close()
        return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'fileName':'files_%s.zip'%ma,'fileType':'application/zip','content':base64.b64encode(b.getvalue()).decode()}))
    if p.startswith('/tthc/tchs/files/detail/'):
        return await route.fulfill(status=200,content_type='text/html',body=detail(up.unquote(p.split('/')[-1])))
    if p=='/tthc/tchs/downloadthongbao':
        idt=json.loads(req.post_data)['idTbao']
        if MODE!='thumb' and (idt.endswith('883061') or idt=='1082026'+'%010d'%(88306*10+1)): return await route.fulfill(status=500,content_type='application/json',body=json.dumps({'error':'Tải file thất bại.'}))
        return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'fileName':'Thong bao_%s.xml'%idt,'fileType':'xml','content':base64.b64encode(('<?xml version="1.0"?><TBao>%s</TBao>'%idt).encode()).decode()}))
    return await route.fulfill(status=404,body='nf')

async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); ctx=await b.new_context(accept_downloads=True,viewport={'width':1366,'height':900}); pg=await ctx.new_page()
        await ctx.route('https://dichvucong.gdt.gov.vn/**',handle)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('https://dichvucong.gdt.gov.vn/tthc/tchs')
        await pg.evaluate("window.__fast=1")
        await pg.add_script_tag(path=SRC)
        await pg.evaluate("window.__qttTK.state.gap=50")
        await pg.wait_for_selector('text=Đã đăng nhập',timeout=8000)
        # ngày
        async def setd(i,v):
            d,m,y=v.split('/'); box=pg.locator('[data-db="%s"]'%i)
            await box.locator('[data-p=d]').fill(d); await box.locator('[data-p=m]').fill(m); await box.locator('[data-p=y]').fill(y)
        if MODE=='tdt': await setd('dtu','01/01/2024'); await setd('dden','31/07/2025')
        else: await setd('dtu','01/10/2026'); await setd('dden','30/11/2026')
        await pg.evaluate("(()=>{const r=document.getElementById('qtt-tk-host').shadowRoot; ['dtu','dden'].forEach(id=>{const b=r.querySelector('[data-db='+id+']'); b.querySelectorAll('input[data-p]').forEach(i=>i.dispatchEvent(new Event('input')));});})()")
        print('hint:',await pg.locator('#khint').inner_text())
        if MODE=='last': await pg.locator('#olast').check()
        if MODE=='nhanh': await pg.locator('#mode button[data-v=nhanh]').click()
        await pg.locator('#bfind').click()
        await pg.wait_for_selector('#cap:not([hidden])')
        print('cap:',await pg.locator('#capt').inner_text())
        await pg.locator('#capin').fill('WRONG'); await pg.locator('#capin').press('Enter')
        await pg.wait_for_selector('#caperr:not([hidden])',timeout=8000)
        print('caperr:',await pg.locator('#caperr').inner_text())
        async with pg.expect_download(timeout=230000) as dl:
            await pg.locator('#capin').fill(CAP); await pg.locator('#capin').press('Enter')
            if MODE in ('nhanh','shot'):
                await pg.wait_for_selector('#pnext:not([hidden])',timeout=30000); print('pnext:',await pg.locator('#pnext').inner_text())
                if MODE=='shot': await pg.locator('#qtt-tk-host').screenshot(path='/tmp/claude-0/prog.png')
            if MODE=='tdt':
                for k in (2,3):
                    await pg.wait_for_function("document.getElementById('qtt-tk-host').shadowRoot.getElementById('capt').textContent.indexOf('Lượt %d/3')===0 && !document.getElementById('qtt-tk-host').shadowRoot.getElementById('cap').hidden"%k,timeout=170000)
                    await pg.locator('#capin').fill(CAP); await pg.locator('#capin').press('Enter')
            elif MODE!='relog':
                await pg.wait_for_function("document.getElementById('qtt-tk-host').shadowRoot.getElementById('capt').textContent.indexOf('Lượt 2/2')===0 && !document.getElementById('qtt-tk-host').shadowRoot.getElementById('cap').hidden",timeout=170000)
                await pg.locator('#capin').fill(CAP); await pg.locator('#capin').press('Enter')
        d=await dl.value; path='/tmp/claude-0/out_%s.zip'%MODE; await d.save_as(path)
        await pg.wait_for_selector('#res:not([hidden])',timeout=15000)
        print('sum:',(await pg.locator('#sum').inner_text()).replace('\n',' '))
        if MODE=='thumb':
            await pg.set_viewport_size({'width':1280,'height':720})
            await pg.evaluate("document.body.innerHTML='';document.body.style.cssText='margin:0;background:radial-gradient(1200px 600px at 85% 0%,#F3D9B8 0%,#F4EFE5 55%) #F4EFE5;height:720px';const h=document.getElementById('qtt-tk-host');h.style.left='260px';h.style.top='18px';h.style.width='760px';")
            await pg.locator('#flt').fill('GTGT'); await pg.wait_for_timeout(400)
            await pg.evaluate("document.getElementById('qtt-tk-host').shadowRoot.querySelector('.tw').scrollTop=0; document.getElementById('qtt-tk-host').shadowRoot.querySelector('.b').scrollTop=470")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path='/tmp/claude-0/thumb.png'); print('thumb'); await b.close(); return
        if MODE=='shot':
            await pg.locator('#flt').fill('GTGT'); await pg.wait_for_timeout(300)
            await pg.locator('#qtt-tk-host').screenshot(path='/tmp/claude-0/panel.png'); print('shot'); await b.close(); return
        print('download:',d.suggested_filename)
        await pg.wait_for_timeout(500)
        print('msg:',await pg.locator('#msg').inner_text())
        z=zipfile.ZipFile(path); names=z.namelist(); print(len(names)); print('\n'.join(names))
        print(z.read('HS-chua-tai-duoc.txt').decode('utf-8-sig')[:600] if 'HS-chua-tai-duoc.txt' in names else 'no errs file')
        open('/tmp/claude-0/bk_%s.xlsx'%MODE,'wb').write(z.read('Bang-ke-to-khai.xlsx'))
        if MODE=='relog':
            st['expired']=False
            await pg.reload(); await pg.add_script_tag(path=SRC); await pg.evaluate("window.__qttTK.state.gap=50")
            await pg.wait_for_selector('#resume:not([hidden])',timeout=8000); print('resume:',await pg.locator('#resumet').inner_text())
            await pg.wait_for_selector('text=Đã đăng nhập',timeout=8000)
            await pg.locator('#bresume').click(); print('dates:',await pg.evaluate("[document.getElementById('qtt-tk-host').shadowRoot.getElementById('dtu').value,document.getElementById('qtt-tk-host').shadowRoot.getElementById('dden').value]"))
        print('pageerrors:',errs)
        print('calls:',len(st['calls']), sum(1 for c in st['calls'] if c[1]=='/tthc/ho-so/search'),'search calls')
        await b.close()
asyncio.run(main())
