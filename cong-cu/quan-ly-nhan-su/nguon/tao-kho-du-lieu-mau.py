# -*- coding: utf-8 -*-
"""
TẠO KHO DỮ LIỆU MẪU TỰ DỰNG – Phần mềm quản lý nhân sự (Quản trị tử tế)
Chạy:  python tao-kho-du-lieu-mau.py   (cần openpyxl)  →  node tao-du-lieu-mau.js  →  node build.js
Toàn bộ là dữ liệu HƯ CẤU: tên người, CCCD, số sổ BHXH, số tài khoản, số điện thoại, email đều tự đặt.
Kịch bản: công ty nhỏ 9 hồ sơ (8 người đang làm + 1 người vừa nghỉ), tháng 10/2026 chuyển văn phòng,
chuyên viên hành chính nhân sự nghỉ việc → kế toán trưởng kiêm nhiệm. Ngày chốt dữ liệu: 31/10/2026.
"""
import os, random, datetime as dt, unicodedata
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

D = dt.date
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'du-lieu-mau')
CT_NAME = 'CÔNG TY TNHH ĐỐM SÁNG'
MAIN = os.path.join(OUT, 'Du_lieu_nhan_su_Dom_Sang')
NEW = os.path.join(OUT, 'thang-moi')
TRY = os.path.join(OUT, 'nhap-thu')
NOTE = 'DỮ LIỆU MẪU HƯ CẤU – tên, CCCD, số sổ BHXH, số tài khoản đều tự đặt'
REF = D(2026, 10, 31)
rnd = random.Random(20261102)

# ---------------- Danh mục ----------------
PB = [('BGD', 'Ban Giám đốc', 'DS001', 1), ('KTHC', 'Phòng Kế toán – Hành chính', 'DS002', 3),
      ('KD', 'Phòng Kinh doanh', 'DS005', 3), ('KHO', 'Bộ phận Kho – Giao nhận', 'DS008', 2)]
PBN = {p[0]: p[1] for p in PB}
CV = [('GD', 'Giám đốc', 1, 3000000), ('KTT', 'Kế toán trưởng', 2, 2000000), ('TP', 'Trưởng phòng', 3, 1500000),
      ('PT', 'Phụ trách bộ phận', 4, 500000), ('NV', 'Nhân viên', 5, 0)]
CVPC = {c[1]: c[3] for c in CV}
CA = [('HC', 'Ca hành chính', '08:00', '17:00', '12:00 - 13:00', 'Toàn công ty, Thứ Hai – Thứ Sáu')]
KH = [('X', 'Đi làm', 'Có'), ('CT', 'Đi công tác', 'Có'), ('P', 'Nghỉ phép năm', 'Có'), ('R', 'Nghỉ việc riêng có lương', 'Có'),
      ('L', 'Nghỉ lễ, Tết', 'Có'), ('Ô', 'Nghỉ ốm', 'Không (BHXH trả)'), ('TS', 'Nghỉ thai sản', 'Không (BHXH trả)'),
      ('KL', 'Nghỉ không lương', 'Không'), ('KP', 'Nghỉ không phép', 'Không')]

# ---------------- Nhân sự (9 hồ sơ) ----------------
# 0 Mã,1 họ tên,2 giới,3 ngày sinh,4 phòng,5 chức vụ,6 chức danh,7 vào làm,8 trình độ,9 hôn nhân,10 NPT,11 ngân hàng,12 trạng thái,13 nghỉ việc,14 quê,15 địa chỉ
NV = [
 ('DS001', 'Trần Quang Minh', 'Nam', D(1979, 4, 12), 'BGD', 'Giám đốc', 'Giám đốc', D(2019, 3, 1), 'Thạc sĩ', 'Đã kết hôn', 2, 'Vietcombank', 'Đang làm việc', None, 'Hà Nội', 'Số 8, ngõ 12 phố Trần Quý Kiên, phường Cầu Giấy, TP Hà Nội'),
 ('DS002', 'Nguyễn Thị Thu Hà', 'Nữ', D(1986, 7, 8), 'KTHC', 'Kế toán trưởng', 'Kế toán trưởng (kiêm hành chính – nhân sự từ 05/10/2026)', D(2019, 4, 1), 'Đại học', 'Đã kết hôn', 2, 'BIDV', 'Đang làm việc', None, 'Ninh Bình', 'Số 21, ngõ 68 đường Cầu Giấy, phường Láng, TP Hà Nội'),
 ('DS003', 'Lê Thị Ngọc Anh', 'Nữ', D(1995, 2, 17), 'KTHC', 'Nhân viên', 'Chuyên viên hành chính – nhân sự', D(2022, 6, 1), 'Đại học', 'Độc thân', 0, 'Techcombank', 'Đã nghỉ việc', D(2026, 10, 2), 'Hưng Yên', 'Số 5, ngõ 30 phố Nguyễn Khang, phường Yên Hòa, TP Hà Nội'),
 ('DS004', 'Phạm Thu Trang', 'Nữ', D(1996, 3, 25), 'KTHC', 'Nhân viên', 'Kế toán viên', D(2023, 5, 15), 'Đại học', 'Đã kết hôn', 0, 'Vietcombank', 'Nghỉ thai sản', None, 'Phú Thọ', 'Số 14, ngõ 165 phố Chùa Bộc, phường Kim Liên, TP Hà Nội'),
 ('DS005', 'Hoàng Văn Đức', 'Nam', D(1988, 11, 3), 'KD', 'Trưởng phòng', 'Trưởng phòng kinh doanh', D(2021, 10, 11), 'Đại học', 'Đã kết hôn', 1, 'MB Bank', 'Đang làm việc', None, 'Thanh Hóa', 'Số 3, ngõ 9 đường Lê Đức Thọ, phường Từ Liêm, TP Hà Nội'),
 ('DS006', 'Vũ Thị Mai Phương', 'Nữ', D(1997, 10, 20), 'KD', 'Nhân viên', 'Nhân viên kinh doanh', D(2025, 10, 1), 'Cao đẳng', 'Độc thân', 0, 'VPBank', 'Đang làm việc', None, 'Bắc Ninh', 'Số 47, ngõ 1 phố Phạm Văn Đồng, phường Phú Diễn, TP Hà Nội'),
 ('DS007', 'Đặng Minh Khoa', 'Nam', D(2001, 6, 14), 'KD', 'Nhân viên', 'Nhân viên kinh doanh', D(2026, 10, 5), 'Đại học', 'Độc thân', 0, 'Techcombank', 'Đang làm việc', None, 'Nghệ An', 'Số 10, ngõ 214 đường Nguyễn Xiển, phường Thanh Liệt, TP Hà Nội'),
 ('DS008', 'Bùi Văn Thắng', 'Nam', D(1990, 1, 9), 'KHO', 'Phụ trách bộ phận', 'Thủ kho', D(2020, 7, 1), 'Trung cấp', 'Đã kết hôn', 1, 'Agribank', 'Đang làm việc', None, 'Hải Phòng', 'Thôn Đông, xã Gia Lâm, TP Hà Nội'),
 ('DS009', 'Ngô Văn Hiếu', 'Nam', D(1999, 8, 28), 'KHO', 'Nhân viên', 'Nhân viên giao hàng', D(2024, 10, 8), 'THPT', 'Độc thân', 0, 'Agribank', 'Đang làm việc', None, 'Hà Nội', 'Thôn Trung, xã Thư Lâm, TP Hà Nội'),
]
E = {n[0]: n for n in NV}
ID = [n[0] for n in NV]
def nm(i): return E[i][1]
def dept(i): return PBN[E[i][4]]
def vao(i): return E[i][7]
def nghi(i): return E[i][13]
def cdanh(i): return E[i][6].split(' (')[0]
def ascii_name(s):
    s = unicodedata.normalize('NFD', s).replace('đ', 'd').replace('Đ', 'D')
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')
def email(i):
    p = ascii_name(nm(i)).lower().split(); return p[-1] + '.' + ''.join(x[0] for x in p[:-1]) + '@domsang-demo.vn'
PROV = {'Hà Nội': '01', 'Ninh Bình': '37', 'Hưng Yên': '33', 'Phú Thọ': '25', 'Thanh Hóa': '38', 'Bắc Ninh': '27', 'Nghệ An': '40', 'Hải Phòng': '31'}
# số giả, nhìn là biết tự đặt (khối 0000 ở giữa)
def cccd(i, k): return '0' + PROV[E[i][14]] + ('0' if E[i][2] == 'Nam' else '1') + str(E[i][3].year)[2:] + '0000' + '%02d' % k
def sdt(k): return '09000001%02d' % k
def bhxh(k): return '01990000%02d' % k
def stk(k): return '99990000%04d' % (k * 111)

# ---------------- Hợp đồng ----------------
def hd(so, i, loai, ky, hl, het, luong, cd=None, ld=None): return dict(so=so, id=i, loai=loai, ky=ky, hl=hl, het=het, luong=luong, cd=cd, ld=ld)
TV, X12, X24, X36, KXD = 'Hợp đồng thử việc', 'HĐLĐ xác định thời hạn 12 tháng', 'HĐLĐ xác định thời hạn 24 tháng', 'HĐLĐ xác định thời hạn 36 tháng', 'HĐLĐ không xác định thời hạn'
HD = [
 hd('01/2019/HĐLĐ-DS', 'DS001', X12, D(2019, 2, 27), D(2019, 3, 1), D(2020, 2, 29), 25000000),
 hd('02/2020/HĐLĐ-DS', 'DS001', KXD, D(2020, 2, 27), D(2020, 3, 1), None, 25000000),
 hd('01/2019/HĐTV-DS', 'DS002', TV, D(2019, 3, 29), D(2019, 4, 1), D(2019, 5, 30), 13000000),
 hd('03/2019/HĐLĐ-DS', 'DS002', X24, D(2019, 5, 29), D(2019, 5, 31), D(2021, 5, 30), 15000000),
 hd('04/2021/HĐLĐ-DS', 'DS002', KXD, D(2021, 5, 28), D(2021, 5, 31), None, 18000000),
 hd('02/2022/HĐTV-DS', 'DS003', TV, D(2022, 5, 30), D(2022, 6, 1), D(2022, 7, 30), 8000000),
 hd('05/2022/HĐLĐ-DS', 'DS003', X24, D(2022, 7, 29), D(2022, 7, 31), D(2024, 7, 30), 9000000),
 hd('06/2024/HĐLĐ-DS', 'DS003', X36, D(2024, 7, 29), D(2024, 7, 31), D(2027, 7, 30), 10500000, cd=D(2026, 10, 2), ld='Người lao động đơn phương chấm dứt, đã báo trước 30 ngày'),
 hd('03/2023/HĐTV-DS', 'DS004', TV, D(2023, 5, 12), D(2023, 5, 15), D(2023, 7, 13), 8500000),
 hd('07/2023/HĐLĐ-DS', 'DS004', X24, D(2023, 7, 12), D(2023, 7, 14), D(2025, 7, 13), 10000000),
 hd('08/2025/HĐLĐ-DS', 'DS004', KXD, D(2025, 7, 11), D(2025, 7, 14), None, 11500000),
 hd('04/2021/HĐTV-DS', 'DS005', TV, D(2021, 10, 8), D(2021, 10, 11), D(2021, 12, 9), 10500000),
 hd('09/2021/HĐLĐ-DS', 'DS005', X24, D(2021, 12, 8), D(2021, 12, 10), D(2023, 12, 9), 12000000),
 hd('10/2023/HĐLĐ-DS', 'DS005', X36, D(2023, 12, 8), D(2023, 12, 10), D(2026, 12, 9), 14000000),
 hd('05/2025/HĐTV-DS', 'DS006', TV, D(2025, 9, 29), D(2025, 10, 1), D(2025, 11, 29), 7500000),
 hd('11/2025/HĐLĐ-DS', 'DS006', X12, D(2025, 11, 27), D(2025, 11, 30), D(2026, 11, 29), 8500000),
 hd('06/2026/HĐTV-DS', 'DS007', TV, D(2026, 10, 5), D(2026, 10, 5), D(2026, 12, 4), 7500000),
 hd('03/2020/HĐTV-DS', 'DS008', TV, D(2020, 6, 29), D(2020, 7, 1), D(2020, 7, 30), 7000000),
 hd('05/2020/HĐLĐ-DS', 'DS008', X36, D(2020, 7, 29), D(2020, 7, 31), D(2023, 7, 30), 8000000),
 hd('08/2023/HĐLĐ-DS', 'DS008', KXD, D(2023, 7, 28), D(2023, 7, 31), None, 9500000),
 hd('07/2024/HĐTV-DS', 'DS009', TV, D(2024, 10, 8), D(2024, 10, 8), D(2024, 10, 14), 7000000),
 hd('08/2024/HĐLĐ-DS', 'DS009', X24, D(2024, 10, 14), D(2024, 10, 15), D(2026, 10, 14), 7500000),
]
# ---------------- Lịch sử lương ----------------
LS = [  # số QĐ, ngày QĐ, hiệu lực, id, lương mới, lý do
 (None, None, D(2019, 3, 1), 'DS001', 25000000, 'Lương khởi điểm khi tiếp nhận'),
 ('01/2023/QĐ-DS', D(2022, 12, 26), D(2023, 1, 1), 'DS001', 30000000, 'Điều chỉnh lương định kỳ năm 2023'),
 ('01/2025/QĐ-DS', D(2024, 12, 26), D(2025, 1, 1), 'DS001', 35000000, 'Điều chỉnh lương định kỳ năm 2025'),
 (None, None, D(2019, 4, 1), 'DS002', 15000000, 'Lương khởi điểm khi tiếp nhận'),
 ('02/2022/QĐ-DS', D(2021, 12, 27), D(2022, 1, 1), 'DS002', 18000000, 'Điều chỉnh lương định kỳ năm 2022'),
 ('02/2025/QĐ-DS', D(2024, 12, 26), D(2025, 1, 1), 'DS002', 22000000, 'Điều chỉnh lương định kỳ năm 2025'),
 (None, None, D(2022, 6, 1), 'DS003', 9000000, 'Lương khởi điểm khi tiếp nhận'),
 ('03/2024/QĐ-DS', D(2023, 12, 26), D(2024, 1, 1), 'DS003', 10500000, 'Điều chỉnh lương định kỳ năm 2024'),
 (None, None, D(2023, 5, 15), 'DS004', 10000000, 'Lương khởi điểm khi tiếp nhận'),
 ('04/2025/QĐ-DS', D(2025, 7, 10), D(2025, 7, 14), 'DS004', 11500000, 'Điều chỉnh khi ký HĐ không xác định thời hạn'),
 (None, None, D(2021, 10, 11), 'DS005', 12000000, 'Lương khởi điểm khi tiếp nhận'),
 ('05/2023/QĐ-DS', D(2023, 12, 6), D(2023, 12, 10), 'DS005', 14000000, 'Điều chỉnh khi ký HĐ lần 2'),
 ('05/2026/QĐ-DS', D(2026, 9, 25), D(2026, 10, 1), 'DS005', 15500000, 'Tăng lương theo kết quả kinh doanh 9 tháng 2026'),
 (None, None, D(2025, 10, 1), 'DS006', 8500000, 'Lương khởi điểm khi tiếp nhận'),
 (None, None, D(2026, 10, 5), 'DS007', 9000000, 'Lương khởi điểm khi tiếp nhận'),
 (None, None, D(2020, 7, 1), 'DS008', 8000000, 'Lương khởi điểm khi tiếp nhận'),
 ('06/2023/QĐ-DS', D(2022, 12, 26), D(2023, 1, 1), 'DS008', 9500000, 'Điều chỉnh lương định kỳ năm 2023'),
 ('03/2025/QĐ-DS', D(2024, 12, 26), D(2025, 1, 1), 'DS008', 10500000, 'Điều chỉnh lương định kỳ năm 2025'),
 (None, None, D(2024, 10, 8), 'DS009', 7500000, 'Lương khởi điểm khi tiếp nhận'),
]
def salary(i, d):
    tv = [h for h in HD if h['id'] == i and h['loai'] == TV and h['hl'] <= d <= h['het']]
    if tv: return tv[0]['luong']
    s = [x for x in LS if x[3] == i and x[2] <= d]; return s[-1][4]
def pccv(i): return CVPC[E[i][5]]
def on_prob(i, d): return any(h['id'] == i and h['loai'] == TV and h['hl'] <= d <= h['het'] for h in HD)

# ---------------- Ngày lễ, đơn nghỉ, sự kiện chấm công ----------------
HOLI = {D(2026, 9, 1): 'Nghỉ lễ Quốc khánh', D(2026, 9, 2): 'Nghỉ lễ Quốc khánh'}
MOVE_DAY = D(2026, 10, 11)   # Chủ nhật – chuyển văn phòng mới
MOVE_TEAM = ['DS002', 'DS005', 'DS006', 'DS008', 'DS009']
GD = 'Trần Quang Minh'
PN = 'Nghỉ phép năm'
DON = []  # stt, ngày tạo, id, loại, từ, đến, số ngày, lý do, người duyệt, trạng thái, ngày duyệt
def wd_count(a, b): return sum(1 for k in range((b - a).days + 1) if (a + dt.timedelta(k)).weekday() < 5 and (a + dt.timedelta(k)) not in HOLI)
def don(i, loai, a, b, lydo, st='Đã duyệt', tao=None, so_ngay=None):
    tao = tao or a - dt.timedelta(days=5 if loai != 'Nghỉ thai sản' else 20)
    DON.append([None, tao, i, loai, a, b, so_ngay if so_ngay is not None else wd_count(a, b), lydo, GD, st, (tao + dt.timedelta(days=1)) if st == 'Đã duyệt' else None])
for i, a, b, ly in [('DS001', D(2026, 2, 23), D(2026, 2, 24), 'Việc gia đình'), ('DS002', D(2026, 2, 23), D(2026, 2, 23), 'Việc gia đình'),
                    ('DS002', D(2026, 6, 15), D(2026, 6, 17), 'Nghỉ hè cùng gia đình'), ('DS003', D(2026, 4, 29), D(2026, 4, 29), 'Việc cá nhân'),
                    ('DS003', D(2026, 7, 13), D(2026, 7, 15), 'Du lịch'), ('DS005', D(2026, 3, 9), D(2026, 3, 10), 'Việc gia đình'),
                    ('DS005', D(2026, 7, 6), D(2026, 7, 6), 'Đưa con đi khám'), ('DS006', D(2026, 5, 4), D(2026, 5, 5), 'Về quê'),
                    ('DS008', D(2026, 1, 12), D(2026, 1, 13), 'Việc gia đình'), ('DS008', D(2026, 4, 20), D(2026, 4, 24), 'Sửa nhà'),
                    ('DS008', D(2026, 7, 20), D(2026, 7, 22), 'Việc gia đình'), ('DS009', D(2026, 6, 1), D(2026, 6, 2), 'Về quê')]:
    don(i, PN, a, b, ly)
don('DS004', 'Nghỉ thai sản', D(2026, 5, 4), D(2026, 11, 3), 'Nghỉ sinh con (6 tháng)', so_ngay=184)
EV = {}  # (id, ngày) → (ký hiệu, ghi chú)
def ev(i, a, b, code, note=None):
    for k in range((b - a).days + 1):
        d = a + dt.timedelta(k)
        if d.weekday() < 5: EV[(i, d)] = (code, note)
def pdon(i, a, b, ly): don(i, PN, a, b, ly); ev(i, a, b, 'P')
pdon('DS001', D(2026, 9, 25), D(2026, 9, 25), 'Việc gia đình')
pdon('DS002', D(2026, 8, 14), D(2026, 8, 14), 'Việc cá nhân')
pdon('DS003', D(2026, 8, 24), D(2026, 8, 25), 'Về quê')
pdon('DS005', D(2026, 9, 14), D(2026, 9, 14), 'Việc gia đình')
pdon('DS005', D(2026, 10, 16), D(2026, 10, 16), 'Việc cá nhân')          # cố ý: quỹ phép chưa cập nhật đơn này
pdon('DS006', D(2026, 8, 31), D(2026, 8, 31), 'Về quê')
pdon('DS008', D(2026, 9, 4), D(2026, 9, 4), 'Việc gia đình')
pdon('DS009', D(2026, 8, 21), D(2026, 8, 21), 'Việc cá nhân')
don('DS006', PN, D(2026, 11, 5), D(2026, 11, 6), 'Dự đám cưới bạn ở quê', st='Chờ duyệt', tao=D(2026, 10, 29))
ev('DS001', D(2026, 8, 19), D(2026, 8, 20), 'CT', 'Công tác Đà Nẵng – gặp nhà cung cấp')
ev('DS005', D(2026, 8, 5), D(2026, 8, 7), 'CT', 'Công tác TP Hồ Chí Minh')
ev('DS005', D(2026, 10, 21), D(2026, 10, 22), 'CT', 'Công tác Hải Phòng – khảo sát công trình')
ev('DS006', D(2026, 10, 21), D(2026, 10, 22), 'CT', 'Công tác Hải Phòng – khảo sát công trình')
ev('DS009', D(2026, 10, 27), D(2026, 10, 27), 'Ô', 'Ốm – báo miệng, chưa có đơn')   # cố ý: nghỉ không có đơn
ev('DS003', D(2026, 10, 1), D(2026, 10, 2), 'X', 'Bàn giao công việc trước khi nghỉ')
LATE = {('DS008', D(2026, 10, 7)): 12, ('DS008', D(2026, 10, 14)): 18, ('DS008', D(2026, 10, 23)): 25,
        ('DS006', D(2026, 8, 12)): 7, ('DS009', D(2026, 9, 9)): 10, ('DS003', D(2026, 8, 4)): 5, ('DS005', D(2026, 9, 22)): 9}
OT = {}
for i, days, h in [('DS008', [D(2026, 8, 6), D(2026, 8, 13), D(2026, 8, 20), D(2026, 8, 27)], 2), ('DS008', [D(2026, 9, 10), D(2026, 9, 17), D(2026, 9, 24)], 2),
                   ('DS008', [D(2026, 10, 8), D(2026, 10, 9), D(2026, 10, 15), D(2026, 10, 29)], 1.5),
                   ('DS009', [D(2026, 8, 6), D(2026, 8, 13), D(2026, 8, 14), D(2026, 8, 20), D(2026, 8, 27)], 2), ('DS009', [D(2026, 9, 10), D(2026, 9, 17), D(2026, 9, 18), D(2026, 9, 24)], 2),
                   ('DS009', [D(2026, 10, 8), D(2026, 10, 15), D(2026, 10, 29)], 2)]:
    for d in days: OT[(i, d)] = h
THU = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật']
def working(i, d): return vao(i) <= d and (nghi(i) is None or d <= nghi(i))
def hm(m): return '%02d:%02d' % (m // 60, m % 60)
def cc_month(y, m):
    rows, d = [], D(y, m, 1)
    while d.month == m:
        for i in ID:
            if not working(i, d): continue
            rec = None
            if d == MOVE_DAY:
                if i in MOVE_TEAM: rec = ['X', 'HC', '07:30', '13:30', 0, None, 6, 'Chủ nhật', 'Chuyển văn phòng mới']
            elif d.weekday() < 5:
                if i == 'DS004': rec = ['TS', None, None, None, None, None, None, None, 'Nghỉ thai sản']
                elif d in HOLI: rec = ['L', None, None, None, None, None, None, None, HOLI[d]]
                elif (i, d) in EV and EV[(i, d)][0] != 'X':
                    c, note = EV[(i, d)]
                    rec = [c, 'HC' if c == 'CT' else None, None, None, 8 if c == 'CT' else None, None, None, None, note]
                else:
                    late = LATE.get((i, d)); ot = OT.get((i, d))
                    vin = 480 + late if late else rnd.randint(465, 479)
                    vout = (1020 + int(ot * 60) + rnd.randint(1, 9)) if ot else rnd.randint(1021, 1035)
                    note = (EV.get((i, d)) or (None, None))[1]
                    if late: note = 'Đi muộn %d phút' % late
                    rec = ['X', 'HC', hm(vin), hm(vout), round(8 - late / 60, 1) if late else 8, late, ot, 'Ngày thường' if ot else None, note]
            if rec:
                c, ca, gv, gr, gc, dm, gtc, ltc, gchu = rec
                rows.append([len(rows) + 1, d, THU[d.weekday()], i, nm(i), dept(i), None, ca, gv, gr, gc, dm, gtc, ltc, c, gchu])
        d += dt.timedelta(1)
    return rows

# ---------------- Bảng lương ----------------
TAX = [(10e6, .05), (30e6, .10), (60e6, .20), (100e6, .30), (float('inf'), .35)]
def pit(x):
    t, lo = 0, 0
    for hi, r in TAX:
        if x > lo: t += (min(x, hi) - lo) * r
        lo = hi
    return round(t)
def r1000(x): return int(round(x / 1000.0)) * 1000
def payroll(y, m, cc_rows, tam_ung=None, sai=None):
    tam_ung = tam_ung or {}; sai = sai or {}
    first = D(y, m, 1); last = D(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(1)
    std = sum(1 for k in range(last.day) if (first + dt.timedelta(k)).weekday() < 5)
    out = []
    for i in ID:
        if not (vao(i) <= last and (nghi(i) is None or nghi(i) >= first)): continue
        mine = [r for r in cc_rows if r[3] == i]
        def cnt(code, sun=False): return sum(1 for r in mine if r[14] == code and ((r[1].weekday() == 6) == sun))
        cong = cnt('X') + cnt('CT'); sunw = cnt('X', True)
        p, rr, l, o, ts, kl = cnt('P'), cnt('R'), cnt('L'), cnt('Ô'), cnt('TS'), cnt('KL') + cnt('KP')
        ot_n = sum(r[12] or 0 for r in mine if r[13] == 'Ngày thường'); ot_c = sum(r[12] or 0 for r in mine if r[13] == 'Chủ nhật')
        lcb = sai.get(i, salary(i, last)); pc = pccv(i)
        full = cong + p + rr + l
        ltg = round((lcb + pc) / std * full)
        hour = lcb / std / 8; tc = round(hour * (1.5 * ot_n + 2 * ot_c)); tc_free = round(hour * (0.5 * ot_n + 1 * ot_c))
        anca = 30000 * (cong + sunw)
        def pro(x): return x if full >= std / 2 else r1000(x * full / std)
        xang = 0 if ts else pro({'KD': 500000, 'KHO': 300000 if i == 'DS008' else 500000}.get(E[i][4], 0))
        dthoai = 0 if ts else pro({'DS001': 500000, 'DS002': 300000, 'DS005': 300000, 'DS006': 300000, 'DS007': 300000}.get(i, 0))
        lates = sum(1 for r in mine if r[11])
        cc_ok = E[i][5] in ('Nhân viên', 'Phụ trách bộ phận')
        chuyencan = 300000 if (cc_ok and not ts and lates == 0 and o == 0 and kl == 0 and vao(i) <= first and (nghi(i) is None or nghi(i) >= last)) else 0
        tong = ltg + tc + anca + xang + dthoai + chuyencan
        prob = on_prob(i, last)
        dong_bh = 0 if (ts or prob or full < 14) else min(lcb + pc, 46800000)
        bhxh, bhyt, bhtn = round(dong_bh * .08), round(dong_bh * .015), round(dong_bh * .01)
        chiu = max(0, tong - anca - tc_free)
        npt = E[i][10]; gt = 15500000 + 6200000 * npt
        note = None
        if prob:
            tinh = chiu; thue = round(chiu * .10) if chiu >= 2000000 else 0; gt_show = 0
            note = 'Thử việc – khấu trừ 10% (giả định, đơn vị rà lại)'
        else:
            tinh = max(0, chiu - bhxh - bhyt - bhtn - gt); thue = pit(tinh); gt_show = gt
        if ts: note = 'Nghỉ thai sản – BHXH chi trả'
        if nghi(i) and first <= nghi(i) <= last: note = 'Nghỉ việc từ %s – thanh toán đến ngày nghỉ' % nghi(i).strftime('%d/%m/%Y')
        tu = tam_ung.get(i, 0)
        thuc = tong - bhxh - bhyt - bhtn - thue - tu
        k = ID.index(i) + 1
        out.append([i, nm(i), dept(i), cdanh(i), lcb, pc, std, cong, p + rr, l, o, kl, ts, ltg, ot_n, ot_c, tc, 0, 0, anca, xang, dthoai, chuyencan,
                    tong, dong_bh, bhxh, bhyt, bhtn, 0, chiu, npt, gt_show, tinh, thue, tu, thuc, stk(k), E[i][11], note])
    return out

# ---------------- Ghi Excel ----------------
HFILL = PatternFill('solid', fgColor='DDEBE9'); THIN = Side(style='thin', color='B8C7C5'); BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
TXT = ('Số CCCD/Mã số thuế', 'Số tài khoản', 'Số sổ BHXH', 'Số điện thoại')
def sheet(wb, title, t2, t3, headers, rows, widths=None, money=(), first=False, tail=None):
    ws = wb.active if first else wb.create_sheet()
    ws.title = title
    ws['A1'] = CT_NAME; ws['A1'].font = Font(bold=True, size=11)
    ws['A2'] = t2; ws['A2'].font = Font(bold=True, size=14)
    ws['A3'] = t3; ws['A3'].font = Font(italic=True, size=10, color='666666')
    for c, h in enumerate(headers, 1):
        x = ws.cell(row=5, column=c, value=h); x.font = Font(bold=True); x.fill = HFILL; x.border = BOX
        x.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
    ws.row_dimensions[5].height = 32
    for r, row in enumerate(rows, 6):
        for c, v in enumerate(row, 1):
            x = ws.cell(row=r, column=c, value=v); x.border = BOX
            if isinstance(v, dt.date): x.number_format = 'dd/mm/yyyy'
            elif headers[c - 1] in money and isinstance(v, (int, float)): x.number_format = '#,##0'
            elif isinstance(v, str) and headers[c - 1] in TXT: x.number_format = '@'
    if tail: tail(ws, 6 + len(rows))
    for c, h in enumerate(headers, 1):
        vals = [len(str(r[c - 1])) if r[c - 1] is not None and not isinstance(r[c - 1], dt.date) else 11 for r in rows]
        w = (widths or {}).get(h) or max(10, min(34, max([len(h) // 2 + 2] + [v + 2 for v in vals])))
        ws.column_dimensions[get_column_letter(c)].width = w
    ws.freeze_panes = 'C6' if len(headers) > 12 else 'A6'
    return ws
def save(wb, *p):
    path = os.path.join(*p); os.makedirs(os.path.dirname(path), exist_ok=True); wb.save(path); print('  ✓', os.path.relpath(path, OUT).replace(os.sep, '/'))

NVH = ['Mã NV', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Số CCCD/Mã số thuế', 'Ngày cấp CCCD', 'Dân tộc', 'Quê quán', 'Địa chỉ thường trú', 'Số điện thoại', 'Email công ty',
       'Phòng ban', 'Chức vụ', 'Chức danh công việc', 'Tổ/Ca', 'Ngày vào làm', 'Trình độ', 'Tình trạng hôn nhân', 'Số người phụ thuộc', 'Số sổ BHXH', 'Ngân hàng', 'Số tài khoản',
       'Trạng thái', 'Ngày nghỉ việc', 'Mã chấm công']
CCH = ['STT', 'Ngày', 'Thứ', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Tổ', 'Ca', 'Giờ vào', 'Giờ ra', 'Số giờ công', 'Đi muộn (phút)', 'Giờ tăng ca', 'Loại tăng ca', 'Ký hiệu', 'Ghi chú']
BLH = ['Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Lương cơ bản', 'Phụ cấp chức vụ', 'Công chuẩn', 'Ngày công thực tế', 'Nghỉ phép/việc riêng có lương', 'Nghỉ lễ',
       'Nghỉ ốm (BHXH trả)', 'Nghỉ không lương/không phép', 'Nghỉ thai sản', 'Lương thời gian', 'Giờ tăng ca ngày thường', 'Giờ tăng ca Chủ nhật', 'Tiền tăng ca', 'Giờ làm đêm',
       'Phụ cấp làm đêm', 'Tiền ăn ca', 'Phụ cấp xăng xe', 'Phụ cấp điện thoại', 'Phụ cấp chuyên cần', 'Tổng thu nhập', 'Lương đóng BH', 'BHXH (8%)', 'BHYT (1,5%)', 'BHTN (1%)',
       'Đoàn phí công đoàn (1%)', 'Thu nhập chịu thuế', 'Số người phụ thuộc', 'Giảm trừ gia cảnh', 'Thu nhập tính thuế', 'Thuế TNCN', 'Tạm ứng', 'Thực lĩnh', 'Số tài khoản', 'Ngân hàng', 'Ghi chú']
NOT_MONEY = {'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Công chuẩn', 'Ngày công thực tế', 'Nghỉ phép/việc riêng có lương', 'Nghỉ lễ', 'Nghỉ ốm (BHXH trả)', 'Nghỉ không lương/không phép',
             'Nghỉ thai sản', 'Giờ tăng ca ngày thường', 'Giờ tăng ca Chủ nhật', 'Giờ làm đêm', 'Số người phụ thuộc', 'Số tài khoản', 'Ngân hàng', 'Ghi chú'}
MONEY = tuple(h for h in BLH if h not in NOT_MONEY)
def bl_tail(ws, r):
    ws.cell(row=r, column=2, value='TỔNG CỘNG').font = Font(bold=True)
    for c, h in enumerate(BLH, 1):
        if h in MONEY:
            col = get_column_letter(c); x = ws.cell(row=r, column=c, value='=SUM(%s6:%s%d)' % (col, col, r - 1)); x.font = Font(bold=True); x.number_format = '#,##0'
    for col, t in ((2, 'Người lập biểu'), (13, 'Kế toán trưởng'), (24, 'Giám đốc')):
        ws.cell(row=r + 2, column=col, value=t).font = Font(bold=True); ws.cell(row=r + 3, column=col, value='(Ký, ghi rõ họ tên)')
T3_BL = 'Đơn vị tính: đồng. Giảm trừ gia cảnh 15.500.000 đ/6.200.000 đ; biểu thuế 5 bậc; trần đóng BHXH 46.800.000 đ · ' + NOTE

def build():
    # chạy lại sẽ GHI ĐÈ các file cùng tên (không xóa file nào khác)
    # 01 Danh mục
    wb = Workbook()
    hc = {p[0]: sum(1 for n in NV if n[4] == p[0] and (n[13] is None or n[13] >= REF)) for p in PB}
    sheet(wb, 'Phong_ban', 'DANH MỤC PHÒNG BAN', 'Cơ cấu tổ chức áp dụng từ 05/10/2026 (văn phòng mới) · ' + NOTE,
          ['Mã phòng ban', 'Tên phòng ban', 'Mã NV trưởng bộ phận', 'Trưởng bộ phận', 'Định biên', 'Nhân sự hiện có', 'Lịch làm việc'],
          [[p[0], p[1], p[2], nm(p[2]), p[3], hc[p[0]], 'Thứ Hai – Thứ Sáu'] for p in PB], first=True)
    sheet(wb, 'Chuc_vu', 'DANH MỤC CHỨC VỤ VÀ PHỤ CẤP CHỨC VỤ', 'Theo Quy chế lương thưởng năm 2026 · ' + NOTE,
          ['Mã chức vụ', 'Tên chức vụ', 'Cấp bậc', 'Phụ cấp chức vụ (đồng/tháng)'], [list(c) for c in CV], money=('Phụ cấp chức vụ (đồng/tháng)',))
    sheet(wb, 'Ca_lam_viec', 'QUY ĐỊNH CA LÀM VIỆC', 'Văn phòng làm việc Thứ Hai – Thứ Sáu · ' + NOTE,
          ['Mã ca', 'Tên ca', 'Giờ bắt đầu', 'Giờ kết thúc', 'Nghỉ giữa ca', 'Áp dụng'], [list(c) for c in CA])
    sheet(wb, 'Ky_hieu_cham_cong', 'KÝ HIỆU CHẤM CÔNG', NOTE, ['Ký hiệu', 'Ý nghĩa', 'Công ty trả lương'], [list(c) for c in KH])
    save(wb, MAIN, '01_Ho_so_nhan_su', 'Danh_muc_phong_ban.xlsx')
    # 01 Danh sách nhân viên
    wb = Workbook(); rows = []
    for k, n in enumerate(NV, 1):
        i = n[0]
        rows.append([i, n[1], n[2], n[3], cccd(i, k), D(2021, 3 + k % 9, 5 + k), 'Kinh', n[14], n[15], sdt(k), email(i), PBN[n[4]], n[5], n[6], 'HC', n[7], n[8], n[9], n[10],
                     None if i == 'DS007' else bhxh(k), n[11], stk(k), n[12], n[13], k])
    sheet(wb, 'Danh_sach_nhan_vien', 'DANH SÁCH HỒ SƠ NHÂN SỰ', 'Cập nhật đến ngày 31/10/2026 · ' + NOTE, NVH, rows, first=True, widths={'Chức danh công việc': 30, 'Địa chỉ thường trú': 40})
    save(wb, MAIN, '01_Ho_so_nhan_su', 'Danh_sach_nhan_vien.xlsx')
    # 02 Hợp đồng + lịch sử lương
    def tt(h):
        if h['cd'] and h['cd'] <= REF: return 'Đã chấm dứt'
        if h['het'] and h['het'] < REF: return 'Đã hết hạn'
        return 'Đang hiệu lực'
    wb = Workbook()
    sheet(wb, 'So_theo_doi_HDLD', 'SỔ THEO DÕI HỢP ĐỒNG LAO ĐỘNG', 'Từ năm 2019 đến nay – gồm hợp đồng thử việc · ' + NOTE,
          ['STT', 'Số hợp đồng', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Loại hợp đồng', 'Ngày ký', 'Ngày hiệu lực', 'Ngày hết hạn', 'Mức lương theo HĐ', 'Phụ cấp chức vụ',
           'Tình trạng', 'Ngày chấm dứt', 'Lý do chấm dứt'],
          [[k, h['so'], h['id'], nm(h['id']), dept(h['id']), cdanh(h['id']), h['loai'], h['ky'], h['hl'], h['het'], h['luong'], pccv(h['id']), tt(h), h['cd'], h['ld']]
           for k, h in enumerate(sorted(HD, key=lambda h: (h['hl'], h['id'])), 1)], money=('Mức lương theo HĐ', 'Phụ cấp chức vụ'), first=True)
    save(wb, MAIN, '02_Hop_dong', 'So_theo_doi_hop_dong.xlsx')
    wb = Workbook(); rows = []; prev = {}
    for k, x in enumerate(sorted(LS, key=lambda x: (x[2], x[3])), 1):
        old = prev.get(x[3]); new = x[4]
        rows.append([k, x[0], x[1], x[2], x[3], nm(x[3]), dept(x[3]), cdanh(x[3]), old, new, (new - old) if old else None, round((new - old) / old * 100, 1) if old else None, pccv(x[3]), x[5]])
        prev[x[3]] = new
    sheet(wb, 'Lich_su_luong', 'LỊCH SỬ ĐIỀU CHỈNH LƯƠNG', 'Lương cơ bản theo từng quyết định (chưa gồm phụ cấp) · ' + NOTE,
          ['STT', 'Số quyết định', 'Ngày quyết định', 'Ngày hiệu lực', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Lương cũ', 'Lương mới', 'Mức tăng', 'Tỷ lệ tăng (%)', 'Phụ cấp chức vụ', 'Lý do'],
          rows, money=('Lương cũ', 'Lương mới', 'Mức tăng', 'Phụ cấp chức vụ'), first=True)
    save(wb, MAIN, '02_Hop_dong', 'Lich_su_dieu_chinh_luong.xlsx')
    # 03 Chấm công
    CC = {}
    old = 'Dữ liệu xuất từ máy chấm công vân tay (văn phòng cũ), đã đối chiếu đơn nghỉ'
    for m, note in [(8, old), (9, old), (10, 'Từ 05/10/2026 chấm công tại văn phòng mới · Chủ nhật 11/10 chuyển văn phòng (tính tăng ca)')]:
        CC[m] = cc_month(2026, m); wb = Workbook()
        sheet(wb, 'Cham_cong_T%02d' % m, 'BẢNG CHẤM CÔNG CHI TIẾT THÁNG %02d/2026' % m, note + ' · ' + NOTE, CCH, CC[m], first=True, widths={'Ghi chú': 40, 'Họ và tên': 20, 'Phòng ban': 26})
        save(wb, MAIN, '03_Cham_cong', 'Cham_cong_2026_%02d.xlsx' % m)
    # 04 Nghỉ phép
    DONs = sorted(DON, key=lambda x: (x[4], x[2]))
    for k, x in enumerate(DONs, 1): x[0] = k
    wb = Workbook()
    sheet(wb, 'Don_nghi_phep', 'SỔ THEO DÕI ĐƠN NGHỈ PHÉP NĂM 2026', 'Số ngày nghỉ tính theo ngày làm việc (không tính Thứ Bảy, Chủ nhật, ngày lễ) · ' + NOTE,
          ['STT', 'Số đơn', 'Ngày tạo đơn', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Loại nghỉ', 'Từ ngày', 'Đến ngày', 'Số ngày', 'Lý do', 'Người duyệt', 'Trạng thái', 'Ngày duyệt'],
          [[x[0], 'NP-2026-%03d' % x[0], x[1], x[2], nm(x[2]), dept(x[2]), x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10]] for x in DONs], first=True)
    qrows = []
    for i in ID:
        tn = (REF - vao(i)).days // 365; tnp = tn // 5
        if vao(i).year == 2026: tot, gchu = round(12 * (12 - vao(i).month + 1) / 12), 'Vào làm trong năm – tính theo tỷ lệ tháng làm việc'
        else: tot, gchu = 12 + tnp, None
        used = sum(x[6] for x in DON if x[2] == i and x[3] == PN and x[9] == 'Đã duyệt' and x[4] <= REF and not (i == 'DS005' and x[4] == D(2026, 10, 16)))
        if nghi(i): gchu = 'Đã nghỉ việc %s – thanh toán ngày phép chưa nghỉ' % nghi(i).strftime('%d/%m/%Y')
        if i == 'DS004': gchu = 'Đang nghỉ thai sản'
        qrows.append([i, nm(i), dept(i), vao(i), tn, 12, tnp, tot, used, tot - used, gchu])
    sheet(wb, 'Quy_phep_nam', 'QUỸ PHÉP NĂM 2026', 'Số ngày phép đã nghỉ tính đến 31/10/2026 (chỉ tính đơn đã duyệt) · ' + NOTE,
          ['Mã NV', 'Họ và tên', 'Phòng ban', 'Ngày vào làm', 'Thâm niên (năm)', 'Phép cơ bản', 'Phép thâm niên', 'Tổng phép năm 2026', 'Đã nghỉ', 'Còn lại', 'Ghi chú'], qrows)
    save(wb, MAIN, '04_Nghi_phep', 'Don_nghi_phep_2026.xlsx')
    # 05 Lương T08, T09 (+ T10 ở thang-moi, cố ý giữ lương cũ của DS005 để thử bước kiểm tra trước khi nạp)
    wb = Workbook()
    for k, (m, tu) in enumerate([(8, {}), (9, {'DS009': 2000000})]):
        sheet(wb, 'Luong_T%02d' % m, 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG %02d/2026' % m, T3_BL, BLH, payroll(2026, m, CC[m], tu), money=MONEY, first=(k == 0), tail=bl_tail, widths={'Ghi chú': 36})
    save(wb, MAIN, '05_Luong', 'Bang_luong_2026.xlsx')
    wb = Workbook()
    sheet(wb, 'Luong_T10', 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG 10/2026', T3_BL, BLH, payroll(2026, 10, CC[10], {'DS006': 1000000}, sai={'DS005': 14000000}), money=MONEY, first=True, tail=bl_tail, widths={'Ghi chú': 36})
    save(wb, NEW, 'Bang_luong_2026_T10.xlsx')
    build_try(CC)

# ---------------- nhap-thu: 3 kiểu file KHÁC MẪU (để thử tính năng nhập dữ liệu – Phần 2) ----------------
def build_try(CC):
    # Kiểu A – danh sách đơn giản: tiêu đề ngay dòng 1, tên cột khác, ngày lẫn kiểu chữ/ngày, SĐT & CCCD mất số 0, có dòng trùng & dòng thiếu mã
    wb = Workbook(); ws = wb.active; ws.title = 'Sheet1'
    ws.append(['STT', 'Mã nhân viên', 'Họ tên', 'Bộ phận', 'Vị trí', 'Ngày bắt đầu làm', 'Ngày sinh', 'SĐT', 'CCCD', 'Ghi chú'])
    for k, n in enumerate(NV, 1):
        ten = n[1].upper() if k == 6 else (n[1] + '  ' if k == 3 else n[1])
        ws.append([k, n[0], ten, PBN[n[4]], cdanh(n[0]), n[7].strftime('%d/%m/%Y'), n[3].strftime('%d-%m-%Y') if k % 2 else n[3],
                   int(sdt(k)), int(cccd(n[0], k)), 'Đã nghỉ 02/10' if n[13] else None])
    ws.append([10, 'DS005', 'Hoàng Văn Đức', 'Phòng Kinh doanh', 'Trưởng phòng kinh doanh', '11/10/2021', '03-11-1988', int(sdt(5)), None, 'Dòng trùng (cố ý)'])
    ws.append([11, None, 'Nguyễn Văn Bình', 'Kho', 'Bốc xếp thời vụ', '20/10/2026', None, None, None, 'Thiếu mã (cố ý) – lao động thời vụ'])
    for row in ws.iter_rows(min_row=2, min_col=7, max_col=7):
        for x in row:
            if isinstance(x.value, (dt.date, dt.datetime)): x.number_format = 'dd/mm/yyyy'
    for c, w in zip('ABCDEFGHIJ', (6, 13, 22, 26, 26, 16, 13, 13, 15, 34)): ws.column_dimensions[c].width = w
    save(wb, TRY, 'Kieu_A_Danh_sach_don_gian.xlsx')
    # Kiểu B – chấm công dạng lưới: mỗi người 1 dòng, cột ngày 1..31, tiêu đề gộp ô, 2 dòng tiêu đề (ngày + thứ)
    wb = Workbook(); ws = wb.active; ws.title = 'T10'
    days = [D(2026, 10, k) for k in range(1, 32)]
    ws['A1'] = CT_NAME; ws['A2'] = 'BẢNG CHẤM CÔNG THÁNG 10 NĂM 2026'
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=36); ws['A2'].alignment = Alignment(horizontal='center'); ws['A2'].font = Font(bold=True, size=14)
    ws['A3'] = 'Ký hiệu: X đi làm, CT công tác, P phép, L lễ, Ô ốm, TS thai sản, KL không lương · ' + NOTE
    ws.append([]); ws.append(['Mã NV', 'Họ và tên', 'Bộ phận'] + [d.day for d in days] + ['Tổng công', 'Ghi chú'])
    ws.append([None, None, None] + [['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][d.weekday()] for d in days] + [None, None])
    for i in ID:
        mine = {r[1]: r[14] for r in CC[10] if r[3] == i}
        if not mine: continue
        ws.append([i, nm(i), dept(i)] + [mine.get(d) for d in days] + [sum(1 for d in days if mine.get(d) in ('X', 'CT') and d.weekday() < 5), None])
    for c in range(4, 35): ws.column_dimensions[get_column_letter(c)].width = 4.5
    ws.column_dimensions['B'].width = 22; ws.column_dimensions['C'].width = 26
    save(wb, TRY, 'Kieu_B_Cham_cong_dang_luoi_T10.xlsx')
    # Kiểu C – log thô từ máy chấm công: tiêu đề tiếng Anh, mã chấm công (1..9) thay cho mã NV, tên không dấu, mỗi lượt bấm 1 dòng, có lượt bấm trùng
    wb = Workbook(); ws = wb.active; ws.title = 'AttLog'
    ws.append(['AC-No.', 'Name', 'Time', 'State', 'Device'])
    for r in CC[10]:
        if not r[8] or not r[9]: continue
        k = ID.index(r[3]) + 1; d = r[1]
        h, m = map(int, r[8].split(':')); t_in = dt.datetime(d.year, d.month, d.day, h, m, rnd.randint(0, 59))
        ws.append([k, ascii_name(r[4]), t_in, 'C/In', 'VP-MOI-01'])
        if rnd.random() < 0.08: ws.append([k, ascii_name(r[4]), t_in + dt.timedelta(seconds=rnd.randint(20, 90)), 'C/In', 'VP-MOI-01'])
        h, m = map(int, r[9].split(':')); ws.append([k, ascii_name(r[4]), dt.datetime(d.year, d.month, d.day, h, m, rnd.randint(0, 59)), 'C/Out', 'VP-MOI-01'])
    for row in ws.iter_rows(min_row=2, min_col=3, max_col=3):
        for x in row: x.number_format = 'dd/mm/yyyy hh:mm:ss'
    for c, w in zip('ABCDE', (8, 22, 20, 8, 12)): ws.column_dimensions[c].width = w
    save(wb, TRY, 'Kieu_C_Log_may_cham_cong_T10.xlsx')

if __name__ == '__main__':
    print('Tạo kho dữ liệu mẫu tự dựng →', OUT)
    build()
    print('Xong. Tiếp theo: node tao-du-lieu-mau.js  →  node build.js')
