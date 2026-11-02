# Sinh file "Danh sách hóa đơn" GIẢ (MST 0123456789) theo đúng khuôn file cổng thuế – dùng chụp ảnh, quay video
import openpyxl, random, datetime
random.seed(7)
ME, MEN = '0123456789', 'CÔNG TY TNHH MẪU QUẢN TRỊ TỬ TẾ'
NCC = [('0109999001','CÔNG TY TNHH THỰC PHẨM SẠCH AN BÌNH'),('0109999002','CÔNG TY CP THIẾT BỊ BẾP MINH PHÁT'),('0109999003','CÔNG TY TNHH VẬT TƯ VĂN PHÒNG HÒA AN'),('0109999004','CÔNG TY CP DỊCH VỤ VỆ SINH XANH'),('0109999005','CÔNG TY TNHH ĐỒ UỐNG NAM VIỆT')]
NCC2 = [('0108888001','CÔNG TY ĐIỆN LỰC MẪU'),('0108888002','NGÂN HÀNG TMCP MẪU – CHI NHÁNH HÀ NỘI'),('0108888003','VIỄN THÔNG MẪU')]
H_MUA = ['STT','Ký hiệu mẫu số','Ký hiệu hóa đơn','Số hóa đơn','Ngày lập','MST người bán/MST người xuất hàng','Tên người bán/Tên người xuất hàng','MST người mua/MST người nhận hàng','Tên người mua/Tên người nhận hàng','Địa chỉ người mua','Tổng tiền chưa thuế','Tổng tiền thuế','Tổng tiền chiết khấu thương mại','Tổng tiền phí','Tổng tiền thanh toán','Đơn vị tiền tệ','Tỷ giá','Trạng thái hóa đơn','Kết quả kiểm tra hóa đơn']
H_MTT = ['STT','Ký hiệu mẫu số','Ký hiệu hóa đơn','Số hóa đơn','Ngày lập','MST người bán/MST người xuất hàng','Tên người bán/Tên người xuất hàng','MST người mua/MST người nhận hàng','Tên người mua/Tên người nhận hàng','Địa chỉ người mua','Căn cước công dân','Tổng tiền chưa thuế','Tổng tiền thuế','Tổng tiền chiết khấu thương mại','Tổng tiền thanh toán','Trạng thái hóa đơn','Kết quả kiểm tra hóa đơn']
def d(): return datetime.date(2026,9,random.randint(1,30)).strftime('%d/%m/%Y')
def save(name, title, H, rows):
    wb=openpyxl.Workbook(); ws=wb.active; ws.title='sheet 1'
    ws['A3']=title; ws['A4']='Từ ngày 01/09/2026 đến ngày 30/09/2026'
    ws.append([]) if False else None
    for i,h in enumerate(H): ws.cell(6,i+1,h)
    for r,row in enumerate(rows): ws.cell(7+r,1,r+1); [ws.cell(7+r,j+2,v) for j,v in enumerate(row)]
    wb.save('gia/'+name)
def amt(r): ct=random.randint(20,900)*10000; return ct, round(ct*r)
# bán ra máy tính tiền: 8% / 10% / tách 8+10
rows=[]
for i in range(140):
    k=random.random()
    if k<.7: ct,th=amt(.08)
    elif k<.9: ct,th=amt(.1)
    else: a,b=random.randint(10,60)*10000,random.randint(5,30)*10000; ct,th=a+b,round(a*.08)+round(b*.1)
    st='Hóa đơn mới'
    rows.append(['1','C26MAA',str(1000+i),d(),ME,MEN,'','','NGƯỜI MUA KHÔNG LẤY HOÁ ĐƠN','',ct,th,0,ct+th,st,'Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền'])
rows[5][14]='Hóa đơn đã bị thay thế'; rows.append(['1','C26MAA','1200','30/09/2026',ME,MEN,'','','NGƯỜI MUA KHÔNG LẤY HOÁ ĐƠN','',rows[5][10],rows[5][11],0,rows[5][13],'Hóa đơn thay thế','Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền'])
save('Ban ra MTT 09-2026 (du lieu gia).xlsx','DANH SÁCH HÓA ĐƠN MÁY TÍNH TIỀN',H_MTT,rows)
rows=[]
for i in range(48):
    m,n=random.choice(NCC); ct,th=amt(random.choice([.08,.08,.1,0]))
    rows.append(['1','C26TAA',str(2000+i),d(),m,n,ME,MEN,'Số 1 Đường Mẫu, Hà Nội',ct,th,0,None,ct+th,'VND','1.0','Hóa đơn mới','Đã cấp mã hóa đơn'])
rows.append(['2','C26THK','15','20/09/2026','8099999001','HỘ KINH DOANH BÁNH MÌ CÔ BA',ME,MEN,'Số 1 Đường Mẫu, Hà Nội',None,None,None,None,1500000,'VND','1.0','Hóa đơn mới','Đã cấp mã hóa đơn'])  # HĐ hộ kinh doanh (mẫu số 2)
rows.append(['1','C26TAA','2100','29/09/2026','0109999002','CÔNG TY CP THIẾT BỊ BẾP MINH PHÁT',ME,MEN,'Số 1 Đường Mẫu, Hà Nội',-1500000,-120000,0,None,-1620000,'VND','1.0','Hóa đơn điều chỉnh','Đã cấp mã hóa đơn'])
save('Mua vao co ma 09-2026 (du lieu gia).xlsx','DANH SÁCH HÓA ĐƠN',H_MUA,rows)
rows=[]
for i in range(30):
    m,n=random.choice(NCC2); ct,th=amt(.1)
    rows.append(['1','K26TBB',str(5000+i),d(),m,n,ME,MEN,None,ct,th,None,None,ct+th,'VND','1.0','Hóa đơn mới','Tổng cục thuế đã nhận không mã'])
save('Mua vao khong ma 09-2026 (du lieu gia).xlsx','DANH SÁCH HÓA ĐƠN',H_MUA,rows)
