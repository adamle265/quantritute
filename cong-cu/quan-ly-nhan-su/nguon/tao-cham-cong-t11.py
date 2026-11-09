# -*- coding: utf-8 -*-
# Bổ sung dữ liệu mẫu CHẤM CÔNG THÁNG 11/2026 (01–07/11) cho 2 công ty hư cấu – anh yêu cầu 07/11/2026 15:15
# Chạy: cd nguon → python tao-cham-cong-t11.py → node tao-du-lieu-mau.js → node build.js
# Lấy định dạng từ file tháng 10 (giữ tiêu đề, cột, kiểu ngày), thay toàn bộ dòng dữ liệu bằng 01–07/11/2026.
import openpyxl, datetime, os, copy
H = os.path.dirname(os.path.abspath(__file__))
THU = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật']
def tm(s): h, m = map(int, s.split(':')); return h * 60 + m
def row(d, nv, tin=None, tout=None, ky='X', note=None, loai=None):
    # tính như máy chấm công: giờ công trong ca 08:00–17:00 (nghỉ 12–13), đi muộn, tăng ca làm tròn 30 phút sau 17:00
    gio = late = ot = None
    if tin and tout:
        a, b = tm(tin), tm(tout); s, e = max(a, 480), min(b, 1020)
        w = max(0, e - s) - max(0, min(e, 780) - max(s, 720)); gio = round(w / 60, 1)
        late = (a - 480) if a > 480 else None
        if d.weekday() >= 5:
            allw = (b - a) - max(0, min(b, 780) - max(a, 720)); ot = allw // 30 * 30 / 60; gio = 0; loai = loai or ('Chủ nhật' if d.weekday() == 6 else 'Thứ Bảy')
        elif b - 1020 >= 30: ot = (b - 1020) // 30 * 30 / 60; loai = 'Ngày thường'
    elif ky in ('CT', 'TB'): gio = 8
    return [d, THU[d.weekday()], nv[0], nv[1], nv[2], None, 'HC' if ky not in ('P', 'Ô', 'TS', 'KL') else None, tin, tout, gio, late, ot if ot else None, loai if ot else None, ky, note]
def build(co, people, plan, note3):
    src = os.path.join(H, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_' + co, '03_Cham_cong')
    wb = openpyxl.load_workbook(os.path.join(src, 'Cham_cong_2026_10.xlsx')); ws = wb.worksheets[0]; ws.title = 'Cham_cong_T11'
    ws['A2'] = 'BẢNG CHẤM CÔNG CHI TIẾT THÁNG 11/2026 (đến 07/11/2026)'; ws['A3'] = note3 + ' · DỮ LIỆU MẪU HƯ CẤU – tên, CCCD, số sổ BHXH, số tài khoản đều tự đặt'
    hdr = 5; style = [copy.copy(c._style) for c in ws[hdr + 1]]
    ws.delete_rows(hdr + 1, ws.max_row)
    rows = []
    for day in range(1, 8):
        d = datetime.datetime(2026, 11, day)
        for nv in people:
            r = plan(d, nv)
            if r: rows.append(row(d, nv, *r) if isinstance(r, tuple) else row(d, nv, *r))
    for i, r in enumerate(rows):
        for j, v in enumerate([i + 1] + r):
            c = ws.cell(row=hdr + 1 + i, column=j + 1, value=v); c._style = copy.copy(style[j])
    wb.save(os.path.join(src, 'Cham_cong_2026_11.xlsx')); print(co, len(rows), 'dòng')
import random
random.seed(1107)
def norm_in(): return '07:%02d' % random.randint(42, 59)
def norm_out(): return '17:%02d' % random.randint(0, 12)
EDU = [('DS001', 'Trần Quang Minh', 'Ban Giám đốc'), ('DS002', 'Nguyễn Thị Thu Hà', 'Phòng Kế toán'), ('DS004', 'Phạm Thu Trang', 'Phòng Kế toán'), ('DS005', 'Hoàng Văn Đức', 'Phòng Tuyển sinh'),
       ('DS006', 'Vũ Thị Mai Phương', 'Phòng Tuyển sinh'), ('DS007', 'Đặng Minh Khoa', 'Bộ phận Giảng viên'), ('DS008', 'Bùi Văn Thắng', 'Bộ phận Giảng viên'), ('DS009', 'Ngô Văn Hiếu', 'Phòng Truyền thông')]
def edu(d, nv):
    k, dd, wd = nv[0], d.day, d.weekday()
    if wd >= 5: return None
    if k == 'DS004' and dd <= 3: return (None, None, 'TS', 'Nghỉ thai sản')
    if k == 'DS004' and dd == 4: return (norm_in(), norm_out(), 'X', 'Đi làm lại sau thai sản')
    if k == 'DS006' and dd in (5, 6): return None                      # đơn nghỉ 05–06/11 đang chờ duyệt → bảng công báo vắng
    if k == 'DS002' and dd == 6: return (norm_in(), None, 'X', None)    # quên chấm ra
    if k == 'DS008' and dd == 3: return ('08:21', norm_out(), 'X', 'Đi muộn 21 phút')
    if k == 'DS008' and dd == 5: return (norm_in(), '18:41', 'X', None)
    if k == 'DS009' and dd in (4, 5): return (norm_in(), '19:06', 'X', 'Hoàn thiện ấn phẩm tuyển sinh')
    if k == 'DS005' and dd == 4: return (None, None, 'CT', 'Gặp trường đối tác tại Bắc Ninh')
    return (norm_in(), norm_out(), 'X', None)
HEA = [('SG001', 'Lý Thanh Tùng', 'Ban Giám đốc'), ('SG002', 'Trịnh Thị Kim Ngân', 'Kho hàng'), ('SG003', 'Đoàn Minh Trí', 'Kho hàng'), ('SG004', 'Huỳnh Ngọc Hân', 'Phòng RnD'),
       ('SG005', 'Phan Gia Bảo', 'Xưởng Sản xuất'), ('SG006', 'Lê Văn Phát', 'Xưởng Sản xuất'), ('SG007', 'Võ Thành Đạt', 'Xưởng Sản xuất')]
def hea(d, nv):
    k, dd, wd = nv[0], d.day, d.weekday()
    if wd == 6: return None
    if wd == 5: return ('07:30', '11:30', 'X', 'Sản xuất đơn gấp thứ Bảy') if k in ('SG006', 'SG007') else None
    if k == 'SG006' and dd in (2, 3, 4): return (norm_in(), '19:0%d' % random.randint(1, 8), 'X', None)
    if k == 'SG007' and dd == 3: return (norm_in(), '19:04', 'X', None)
    if k == 'SG005' and dd == 5: return ('08:35', norm_out(), 'X', 'Đi muộn 35 phút – kẹt xe')
    if k == 'SG002' and dd == 6: return (norm_in(), '15:30', 'X', 'Về sớm việc gia đình')
    return (norm_in(), norm_out(), 'X', None)
build('Edu', EDU, edu, 'Đến 07/11/2026 (thứ Bảy) · đơn nghỉ 05–06/11 của DS006 đang chờ duyệt')
build('Health', HEA, hea, 'Dữ liệu xuất từ máy chấm công xưởng đến 07/11/2026 · thứ Bảy 07/11 xưởng tăng ca')
