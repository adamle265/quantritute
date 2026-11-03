# Kiểm thử bản 1.1.0 trên trang thuế điện tử GIẢ LẬP (theo khảo sát thuedientu.gdt.gov.vn thật 03/11/2026)
# Chạy: python mock_etax.py full | nhanh | last | relog | dvc
import asyncio, io, re, sys, zipfile, urllib.parse as up, os
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,'..','build','tk-panel.bundle.js')
MODE=sys.argv[1] if len(sys.argv)>1 else 'full'
SID='SIDabc123'; PID='PIDxyz'
st={'cur':set(),'dl':0,'calls':[],'expired':False,'q':[]}
GT='01/GTGT-TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (TT80/2021)(00-Hoạt động sản xuất kinh doanh thông thường-)'
KK='05/KK-TNCN-Tờ khai khấu trừ thuế thu nhập cá nhân (TT80)'
QT='05/QTT-TNCN-TỜ KHAI QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN (TT80/2021)'
TN='03/TNDN-Tờ khai quyết toán thuế TNDN (TT80/2021)'
BC='TT133_VuaVaNho_LT_B01b-Bộ báo cáo tài chính dành cho doanh nghiệp vừa và nhỏ hoạt động liên tục mẫu B01b (thông tư 133/2016/TT-BTC)'
OK='Cơ quan thuế chấp nhận hồ sơ khai thuế điện tử của NNT'
D=[]
def add(tk,ky,loai,lan,bs,ngay,tt=OK,link=True): D.append(dict(ma='1132%04d%09d'%(int(ngay[6:10]),len(D)+1),tk=tk,ky=ky,loai=loai,lan=lan,bs=bs,ngay=ngay,tt=tt,link=link))
for y in (2021,2022,2023):
    for q in (1,2,3,4):
        m=q*3+1; yy=y if q<4 else y+1; m=m if q<4 else 1
        add(GT,'Q%d/%d'%(q,y),'Chính thức','1','0','20/%02d/%d 08:%02d:00'%(m,yy,q))
add(GT,'Q3/2022','Bổ sung','2','1','15/11/2022 09:00:00')
add(GT,'Q3/2022','Bổ sung','3','2','20/11/2022 09:00:00','Cơ quan thuế không chấp nhận hồ sơ')
add(KK,'Q3/2022','Chính thức','1','0','30/10/2022 08:03:43')
add(QT,'2021','Bổ sung','1','','03/11/2022 16:16:28',link=False)
add(TN,'2022','Chính thức','1','0','30/03/2023 10:00:00')
add(BC,'2022','Chính thức','1','0','30/03/2023 10:05:00')
add(TN,'2020','Chính thức','1','0','30/03/2021 10:00:00')
add(BC,'2025','Chính thức','1','0','12/02/2026 14:19:15')
def key(s): return s[6:10]+s[3:5]+s[0:2]+s[11:19]
D.sort(key=lambda r:key(r['ngay']),reverse=True)
OPTS='<option value="00">--Tất cả--</option><option value="--">THUẾ GIÁ TRỊ GIA TĂNG</option><option value="842">01/GTGT - TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (TT80/2021)</option><option value="--">THUẾ THU NHẬP CÁ NHÂN</option><option value="953">05/QTT-TNCN - TỜ KHAI QUYẾT TOÁN THUẾ THU NHẬP CÁ NHÂN (TT80/2021)</option><option value="864">05/KK-TNCN - Tờ khai khấu trừ thuế thu nhập cá nhân (TT80)</option><option value="892">03/TNDN - Tờ khai quyết toán thuế TNDN (TT80/2021)</option>'
def form(state='viewTraCuuTkhai'):
    return ('<form name="traCuuKhaiForm" id="traCuuKhaiForm" action="/etaxnnt/Request" method="post">'
     '<input type="hidden" name="dse_sessionId" value="%s"><input type="hidden" name="dse_applicationId" value="-1"><input type="hidden" name="dse_operationName" value="traCuuToKhaiProc"><input type="hidden" name="dse_pageId" value="15"><input type="hidden" name="dse_processorState" value="%s"><input type="hidden" name="dse_processorId" value="%s"><input type="hidden" name="dse_errorPage" value="error_page.jsp"><input type="hidden" name="dse_nextEventName" value=""><input type="hidden" name="pn" value="1">'
     '<select name="maTKhai" id="maTKhai">%s</select><input type="hidden" name="tenTKhai" value=""><input type="hidden" name="kieuKy" id="kieuKy" value=""><input type="text" name="ma_gd" id="ma_gd"><input type="text" name="qryFromDate" id="qryFromDate"><input type="text" name="qryToDate" id="qryToDate"><input type="button" value="Tra cứu" onclick="validateForm()"></form>')%(SID,state,PID,OPTS)
SCR=("<script>function validateForm(){alert('Không tìm thấy tệp');}\nfunction downloadTkhai(msgId){\n window.location.href='/etaxnnt/Request?&dse_sessionId=%s&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=16&dse_processorState=viewTraCuuTkhai&dse_processorId=%s&dse_nextEventName=downTkhai&messageId='+msgId;\n}\n"
     "function thongBao(maGDich) {\n window.location.href='/etaxnnt/Request?&dse_sessionId=%s&dse_applicationId=-1&dse_operationName=traCuuToKhaiProc&dse_pageId=16&dse_processorState=viewTraCuuTkhai&dse_processorId=%s&dse_nextEventName=viewTBao&ctMaGDich='+maGDich;\n}</script>")%(SID,PID,SID,PID)
def page_start(): return '<html><body><div>Tra cứu &gt; Tờ khai</div>%s%s</body></html>'%(form('initial'),SCR)
def page_result(rows,total,pn):
    pages=max(1,-(-total//10))
    th=''.join('<th>%s</th>'%h for h in ['STT','Mã giao dịch','Tờ khai/Phụ lục','Kỳ tính thuế','Loại tờ khai','Lần nộp','Lần bổ sung','Ngày nộp','Gửi phụ lục','Nơi nộp','Tiến trình giải quyết hồ sơ (Trạng thái)','Tải thông báo'])
    trs=''
    for i,r in enumerate(rows):
        name=('<a title="Tải tệp tờ khai về" onclick="downloadTkhai(\'%s\');">%s</a>'%(r['ma'],r['tk'])) if r['link'] else r['tk']
        trs+='<tr><td class="align-c"> %d </td><td> %s </td><td> %s </td><td> %s </td><td> %s </td><td> %s </td><td> %s </td><td> %s </td><td></td><td> Thuế cơ sở 15 Thành phố Hà Nội </td><td> %s </td><td><a href="#" onclick="thongBao(\'%s\'); return false;"> Thông báo </a></td></tr>'%((pn-1)*10+i+1,r['ma'],name,r['ky'],r['loai'],r['lan'],r['bs'],r['ngay'],r['tt'],r['ma'])
    pager=' '.join('<a href="/etaxnnt/Request?&dse_sessionId=%s&pn=%d">%d</a>'%(SID,k,k) for k in range(1,pages+1))
    return '<html><body>%s<div>%s Trang %d/%d. Có %d bản ghi. Đến trang</div><div>Kết quả tra cứu</div><table id="data_content"><tr>%s</tr>%s</table>%s</body></html>'%(form(),pager,pn,pages,total,th,trs,SCR)
def page_tb(ma):
    rows=''.join('<tr><td>%d</td><td><a href="#" onclick="downloadFile(\'%s\'); return false;">%s/2022/TB-TĐT</a></td><td>V/v: %s</td><td>30/10/2022 09:00:26</td><td></td></tr>'%(k+1,'112'+ma[-9:]+str(k),k,t) for k,t in enumerate(['Tiếp nhận hồ sơ thuế điện tử TT19','Xác nhận nộp hồ sơ thuế điện tử TT19']))
    return ('<html><body><form name="tkhaiForm" id="tkhaiForm" method="post" action="/etaxnnt/Request"><input type="hidden" name="dse_sessionId" value="%s"><input type="hidden" name="dse_applicationId" value="-1"><input type="hidden" name="dse_operationName" value="traCuuToKhaiProc"><input type="hidden" name="dse_pageId" value="19"><input type="hidden" name="dse_processorState" value="dsTBaoViewPage"><input type="hidden" name="dse_processorId" value="%s"><input type="hidden" name="dse_nextEventName" value=""><input type="hidden" name="pn" value="1"><input type="hidden" id="messageId" name="messageId" value=""><input type="button" value="Quay lại" onclick="back()"></form><table>%s</table><script>function downloadFile(maID){document.tkhaiForm.submit()}</script></body></html>')%(SID,PID,rows)
LOGIN='<html><body><div>ĐĂNG NHẬP HỆ THỐNG</div><form><input name="_userName"><input type="password" name="_password"></form></body></html>'
TOP='''<html><head><title>Thue dien tu</title></head><body><ul><li onclick="active(this);openPage('traCuuToKhaiProc')"><a href="#">Tra cứu tờ khai</a></li></ul>
<iframe id="tranFrame" name="mainframe" src="about:blank"></iframe>
<script>function openPage(procName){ document.getElementById('tranFrame').setAttribute('src', "/etaxnnt/Request?&dse_sessionId=%s&dse_applicationId=-1&dse_pageId=11&dse_operationName=" + procName+ "&dse_processorState=initial&dse_nextEventName=start"); }</script></body></html>'''%SID
def k8(s): d,m,y=s.split('/'); return y+m+d
async def handle(route):
    req=route.request; u=up.urlparse(req.url); q=dict(up.parse_qsl(u.query,keep_blank_values=True))
    f=dict(up.parse_qsl(req.post_data or '',keep_blank_values=True)) if req.method=='POST' else {}
    ev=f.get('dse_nextEventName') or q.get('dse_nextEventName','')
    st['calls'].append((req.method,ev))
    html=lambda b: route.fulfill(status=200,content_type='text/html; charset=UTF-8',body=b)
    if u.path!='/etaxnnt/Request': return await route.fulfill(status=404,body='nf')
    if st['expired']: return await html(LOGIN)
    if req.method=='GET' and not ev: return await html(TOP)
    sid=f.get('dse_sessionId') or q.get('dse_sessionId')
    if sid!=SID: return await html(LOGIN)
    if ev=='start': return await html(page_start())
    if ev=='query':
        assert f['maTKhai']!='' and f['dse_processorId']==PID, f
        a,b=k8(f['qryFromDate']),k8(f['qryToDate']); pn=int(f.get('pn') or 1)
        rows=[r for r in D if a<=key(r['ngay'])[:8]<=b and (f['maTKhai']=='00' or (f['maTKhai']=='842' and r['tk'].startswith('01/GTGT')))]
        sl=rows[(pn-1)*10:pn*10]; st['cur']=set(r['ma'] for r in sl); st['q'].append((f['qryFromDate'],f['qryToDate'],pn,f['maTKhai']))
        return await html(page_result(sl,len(rows),pn))
    if ev=='downTkhai':
        st['dl']+=1
        if MODE=='relog' and st['dl']==5: st['expired']=True; return await html(LOGIN)
        ma=q['messageId']; r=[x for x in D if x['ma']==ma]
        if ma not in st['cur'] or not r or not r[0]['link']: return await html('<html><body>'+'x'*5000+' Lỗi hệ thống</body></html>')
        body='<?xml version="1.0" encoding="UTF-8" standalone="no"?><HSoThueDTu><HSoKhaiThue><TTinChung><TTinTKhaiThue><NNT><mst>0123456789</mst></NNT></TTinTKhaiThue></TTinChung><ma>%s</ma></HSoKhaiThue></HSoThueDTu>'%ma
        return await route.fulfill(status=200,headers={'Content-Type':'application/octet-stream','Content-Disposition':'attachment;filename=ETAX%s.xml'%ma},body=body.encode())
    if ev=='viewTBao': return await html(page_tb(q['ctMaGDich']))
    if ev=='download':
        assert f['dse_processorState']=='dsTBaoViewPage' and f['messageId']
        return await route.fulfill(status=200,headers={'Content-Type':'application/octet-stream','Content-Disposition':'attachment;filename=ETAX%s.xml'%f['messageId']},body=('<?xml version="1.0" encoding="UTF-8"?><TBaoThueDTu>%s</TBaoThueDTu>'%f['messageId']).encode())
    return await html('<html><body>?</body></html>')

async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); ctx=await b.new_context(accept_downloads=True,viewport={'width':1366,'height':900}); pg=await ctx.new_page()
        await ctx.route('https://thuedientu.gdt.gov.vn/**',handle)
        await ctx.route('https://dichvucong.gdt.gov.vn/**',lambda r: r.fulfill(status=200,content_type='text/html',body='<html><head><meta name="csrf-token" content="t"></head><body><form id="form-search-advanced"><select name="maToKhai"><option value="">Tất cả</option></select></form></body></html>'))
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        R="document.getElementById('qtt-tk-host').shadowRoot"
        if MODE=='dvc':
            await pg.goto('https://dichvucong.gdt.gov.vn/tthc/tchs'); await pg.add_script_tag(path=SRC)
            await pg.wait_for_selector('text=Đã đăng nhập',timeout=8000)
            async def setd(i,v):
                d,m,y=v.split('/'); box=pg.locator('[data-db="%s"]'%i)
                await box.locator('[data-p=d]').fill(d); await box.locator('[data-p=m]').fill(m); await box.locator('[data-p=y]').fill(y)
            for a,c in (('01/01/2022','31/12/2023'),('01/01/2025','31/10/2025')):
                await setd('dtu',a); await setd('dden',c); await pg.wait_for_timeout(100)
                print(a,c,'->',await pg.locator('#khint').inner_text())
            await setd('dtu','01/01/2022'); await setd('dden','31/12/2023'); await pg.locator('#bfind').click(); await pg.wait_for_timeout(300)
            print('msg:',await pg.locator('#msg').inner_text()); print('rule:',await pg.locator('#form .msg').first.inner_text()); print('errs',errs); await b.close(); return
        await pg.goto('https://thuedientu.gdt.gov.vn/etaxnnt/Request')
        await pg.add_script_tag(path=SRC)
        await pg.evaluate("window.__qttTK.state.gap=30")
        await pg.wait_for_selector('text=Đã đăng nhập',timeout=8000)
        print('rule:',await pg.locator('#form .msg').first.inner_text())
        print('dates:',await pg.evaluate("["+R+".getElementById('dtu').value,"+R+".getElementById('dden').value]"))
        print('mode:',await pg.locator('#modeh').inner_text(),'| loai TK:',await pg.locator('#ltk option').count())
        await pg.locator('button[data-q=tatca]').click()
        print('hint:',await pg.locator('#khint').inner_text())
        if MODE=='full': await pg.locator('#mode button[data-v=day]').click()
        if MODE=='last': await pg.locator('#olast').check()
        if MODE=='shot':
            await pg.locator('#qtt-tk-host').screenshot(path=os.path.join(HERE,'etax-panel.png')); print('shot'); await b.close(); return
        async with pg.expect_download(timeout=120000) as dl:
            await pg.locator('#bfind').click()
        d=await dl.value; path=os.path.join(HERE,'out_etax_%s.zip'%MODE); await d.save_as(path)
        await pg.wait_for_timeout(500)
        print('download:',d.suggested_filename)
        print('msg:',await pg.locator('#msg').inner_text())
        print('sum:',(await pg.locator('#sum').inner_text()).replace('\n',' '))
        z=zipfile.ZipFile(path); names=z.namelist(); print(len(names),'files'); print('\n'.join(names))
        if 'HS-chua-tai-duoc.txt' in names: print(z.read('HS-chua-tai-duoc.txt').decode('utf-8-sig')[:700])
        open(os.path.join(HERE,'bk_etax_%s.xlsx'%MODE),'wb').write(z.read('Bang-ke-to-khai.xlsx'))
        print('queries:',st['q'])
        print('calls:',len(st['calls']),'| pageerrors:',errs)
        await b.close()
asyncio.run(main())
