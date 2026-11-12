# -*- coding: utf-8 -*-
"""
11/11/2026 (anh duyệt 08:08 – bản 0.4.2): thêm vào dữ liệu mẫu Đốm Sáng Health bộ phận XƯỞNG ĐÓNG GÓI làm theo 3 ca,
tính lương theo GIỜ LÀM THỰC TẾ, có Lịch xếp ca (lịch xếp ca mẫu do phần mềm tự dựng: xoay ca theo tuần, nghỉ Chủ nhật).
  - 6 người SG008–SG013 (hư cấu), vào làm 01/10/2026, HĐLĐ 12 tháng, đóng BHXH theo lương cơ bản
  - Không có file chấm công: phần mềm tự sinh giờ vào/ra theo ca đã xếp (dữ liệu mẫu)
Chạy SAU các bộ sinh dữ liệu mẫu khác, rồi: node tao-du-lieu-mau.js → node build.js. Chạy lại nhiều lần không bị nhân đôi.
"""
import os, copy, datetime as dt, openpyxl
D = dt.datetime
HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(HERE, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_Health')
HROW = 5
PB = 'Xưởng Đóng gói'
def cols(ws): return {ws.cell(HROW, c).value: c for c in range(1, ws.max_column + 1) if ws.cell(HROW, c).value}
def last_row(ws, key_col):
    r = ws.max_row
    while r > HROW and ws.cell(r, key_col).value in (None, ''): r -= 1
    return r
def add(ws, vals, key='Mã NV'):
    C = cols(ws); kc = C.get(key) or 1; last = last_row(ws, kc)
    if key and any(ws.cell(r, C[key]).value == vals.get(key) for r in range(HROW + 1, last + 1)): return False
    r = last + 1
    for c in range(1, ws.max_column + 1):
        src = ws.cell(last, c); dst = ws.cell(r, c)
        if src.has_style: dst._style = copy.copy(src._style)
    for k, v in vals.items():
        if k in C: ws.cell(r, C[k]).value = v
    return True
VAO = D(2026, 10, 1)
P = [
 ('SG008', 'Nguyễn Văn Khánh', 'Nam', D(1990, 3, 14), 'Tổ trưởng', 'Tổ trưởng ca đóng gói', 6000000, 500000, 'Đã kết hôn', 1, 'Đồng Nai'),
 ('SG009', 'Trần Thị Mai', 'Nữ', D(1996, 7, 2), 'Nhân viên', 'Công nhân đóng gói', 5600000, 0, 'Đã kết hôn', 1, 'Long An'),
 ('SG010', 'Lê Hoàng Nam', 'Nam', D(1998, 11, 20), 'Nhân viên', 'Công nhân đóng gói', 5600000, 0, 'Độc thân', 0, 'Tiền Giang'),
 ('SG011', 'Phạm Thị Thu', 'Nữ', D(1995, 5, 9), 'Nhân viên', 'Công nhân đóng gói', 5600000, 0, 'Đã kết hôn', 2, 'Bình Dương'),
 ('SG012', 'Đặng Quốc Huy', 'Nam', D(1993, 1, 27), 'Nhân viên', 'Công nhân vận hành máy đóng gói', 5600000, 0, 'Đã kết hôn', 1, 'Tây Ninh'),
 ('SG013', 'Bùi Thị Lan', 'Nữ', D(2001, 9, 15), 'Nhân viên', 'Công nhân đóng gói', 5310000, 0, 'Độc thân', 0, 'Đồng Tháp'),
]
BANK = ['Vietcombank', 'BIDV', 'Techcombank', 'ACB', 'VietinBank', 'MB']
f = os.path.join(M, '01_Ho_so_nhan_su', 'Danh_sach_nhan_vien.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
for i, p in enumerate(P):
    ma, ten, gt, ns, cv, cd, cb, pc, hn, npt, que = p; n = int(ma[2:])
    add(ws, {'Mã NV': ma, 'Họ và tên': ten, 'Giới tính': gt, 'Ngày sinh': ns, 'Số CCCD/Mã số thuế': '079' + ('0' if gt == 'Nam' else '1') + str(ns.year)[2:] + '0000' + str(n + 20), 'Ngày cấp CCCD': D(2021, 8, 10 + i),
             'Dân tộc': 'Kinh', 'Quê quán': que, 'Địa chỉ thường trú': 'Số ' + str(10 + n) + ' đường số ' + str(n) + ', phường Tân Tạo, TP Hồ Chí Minh', 'Số điện thoại': '09000001' + str(n + 20),
             'Email công ty': None, 'Phòng ban': PB, 'Chức vụ': cv, 'Chức danh công việc': cd, 'Tổ/Ca': 'Theo lịch xếp ca', 'Ngày vào làm': VAO, 'Trình độ': 'Trung học phổ thông' if i else 'Trung cấp',
             'Tình trạng hôn nhân': hn, 'Số người phụ thuộc': npt, 'Số sổ BHXH': '01990000' + str(n + 20), 'Ngân hàng': BANK[i], 'Số tài khoản': '9999000033' + str(n + 20), 'Trạng thái': 'Đang làm việc', 'Ngày nghỉ việc': None,
             'Mã chấm công': n, 'Số con từ 6 tuổi trở xuống': 0, 'Người thân liên hệ': None, 'Quan hệ với người thân': None, 'SĐT người thân liên hệ': None})
wb.save(f)
f = os.path.join(M, '02_Hop_dong', 'So_theo_doi_hop_dong.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
for i, p in enumerate(P):
    ma, ten, gt, ns, cv, cd, cb, pc, hn, npt, que = p
    add(ws, {'STT': last_row(ws, 1) - HROW + 1, 'Số hợp đồng': '%02d/2026/HĐLĐ-SG' % (10 + i), 'Mã NV': ma, 'Họ và tên': ten, 'Phòng ban': PB, 'Chức danh': cd, 'Loại hợp đồng': 'HĐLĐ xác định thời hạn 12 tháng',
             'Ngày ký': D(2026, 9, 28), 'Ngày hiệu lực': VAO, 'Ngày hết hạn': D(2027, 9, 30), 'Mức lương theo HĐ': cb, 'Phụ cấp chức vụ': pc, 'Lương hiệu suất mục tiêu': 0, 'Tình trạng': 'Đang hiệu lực'}, key='Số hợp đồng')
wb.save(f)
f = os.path.join(M, '02_Hop_dong', 'Lich_su_dieu_chinh_luong.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active; C = cols(ws)
for p in P:
    ma, ten, gt, ns, cv, cd, cb, pc, hn, npt, que = p
    if any(ws.cell(r, C['Mã NV']).value == ma for r in range(HROW + 1, ws.max_row + 1)): continue
    add(ws, {'STT': last_row(ws, 1) - HROW + 1, 'Ngày hiệu lực': VAO, 'Mã NV': ma, 'Họ và tên': ten, 'Phòng ban': PB, 'Chức danh': cd, 'Lương mới': cb, 'Phụ cấp chức vụ': pc, 'Lương hiệu suất mục tiêu': 0,
             'Lý do': 'Lương khởi điểm – trả lương theo giờ làm thực tế, giờ công chuẩn 208 giờ/tháng'}, key=None)
wb.save(f)
f = os.path.join(M, '01_Ho_so_nhan_su', 'Ho_so_giay_to.xlsx'); wb = openpyxl.load_workbook(f); ws = wb['Giay_to']
for i, p in enumerate(P):
    add(ws, {'Mã NV': p[0], 'Họ và tên': p[1], 'Sơ yếu lý lịch': '26/09/2026', 'CV': 'Không áp dụng', 'Bản sao CCCD': '26/09/2026', 'Bằng cấp, chứng chỉ': 'Không áp dụng', 'Giấy khám sức khỏe': '26/09/2026' if i != 5 else None,
             'Ảnh 3x4': '26/09/2026', 'Đơn xin việc': '26/09/2026', 'Xác nhận thông tin cư trú': '26/09/2026', 'Cam kết bảo mật, nội quy': '01/10/2026', 'Ghi chú hồ sơ': 'Hẹn nộp giấy khám sức khỏe' if i == 5 else None})
wb.save(f)
f = os.path.join(M, '01_Ho_so_nhan_su', 'Danh_muc_phong_ban.xlsx'); wb = openpyxl.load_workbook(f); ws = wb['Phong_ban']
add(ws, {'Mã phòng ban': 'DG', 'Tên phòng ban': PB, 'Mã NV trưởng bộ phận': 'SG008', 'Trưởng bộ phận': 'Nguyễn Văn Khánh', 'Định biên': 6, 'Nhân sự hiện có': 6, 'Lịch làm việc': '3 ca (sáng, chiều, đêm) theo lịch xếp ca, nghỉ Chủ nhật'}, key='Mã phòng ban')
ws = wb['Ca_lam_viec']
for r in (('S', 'Ca sáng', '06:00', '14:30', '10:00 - 10:30', PB), ('C', 'Ca chiều', '14:00', '22:30', '18:00 - 18:30', PB), ('Đ', 'Ca đêm', '22:00', '06:45', '02:00 - 02:45', PB)):
    add(ws, {'Mã ca': r[0], 'Tên ca': r[1], 'Giờ bắt đầu': r[2], 'Giờ kết thúc': r[3], 'Nghỉ giữa ca': r[4], 'Áp dụng': r[5] + ', theo lịch xếp ca'}, key='Mã ca')
wb.save(f)
# Đơn nghỉ phép (11/11 09:12 anh: setup sẵn dữ liệu liên quan để thử): nghỉ phép năm tính đủ giờ của ca đã xếp
f = os.path.join(M, '04_Nghi_phep', 'Don_nghi_phep_2026.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
for so, tao, ma, ten, tu, den, n, ly, st, dd in (('NP-2026-030', D(2026, 10, 12), 'SG011', 'Phạm Thị Thu', D(2026, 10, 16), D(2026, 10, 16), 1, 'Việc gia đình', 'Đã duyệt', D(2026, 10, 13)),
                                                ('NP-2026-031', D(2026, 11, 9), 'SG009', 'Trần Thị Mai', D(2026, 11, 20), D(2026, 11, 20), 1, 'Đưa con đi khám', 'Đã duyệt', D(2026, 11, 10))):
    add(ws, {'STT': last_row(ws, 1) - HROW + 1, 'Số đơn': so, 'Ngày tạo đơn': tao, 'Mã NV': ma, 'Họ và tên': ten, 'Phòng ban': PB, 'Loại nghỉ': 'Nghỉ phép năm', 'Từ ngày': tu, 'Đến ngày': den, 'Số ngày': n, 'Lý do': ly, 'Người duyệt': 'Nguyễn Văn Khánh', 'Trạng thái': st, 'Ngày duyệt': dd}, key='Số đơn')
wb.save(f)
print('Đã thêm Xưởng Đóng gói SG008–SG013 vào dữ liệu mẫu Đốm Sáng Health')
