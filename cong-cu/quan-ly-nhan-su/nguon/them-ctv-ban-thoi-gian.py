# -*- coding: utf-8 -*-
"""
09/11/2026 (anh yêu cầu 12:18): thêm vào dữ liệu mẫu Đốm Sáng Edu 2 trường hợp để xem thử tính năng mới
  - DS010 Lý Thu Hằng – BÁN THỜI GIAN (tư vấn tuyển sinh buổi chiều 13:30–17:30), HĐLĐ bán thời gian 12 tháng,
    lương 5.500.000/tháng, CHƯA có số sổ BHXH → phần mềm nhắc thuộc diện đóng BHXH bắt buộc
  - DS011 Trịnh Văn Long – CỘNG TÁC VIÊN giảng dạy (sáng thứ Hai, Tư, Sáu 08:00–11:30), Hợp đồng cộng tác viên 6 tháng, thù lao 6.000.000/tháng
  Cả 2 vào làm 02/11/2026 → chưa có trong bảng lương T08–T10. Cột mới "Loại lao động" ở Danh sách nhân viên.
Chạy SAU các bộ sinh dữ liệu mẫu khác (tao-kho-du-lieu-mau.py, tao-cham-cong-t11.py, tao-ho-so-giay-to.py…), rồi: node tao-du-lieu-mau.js → node build.js
Chạy lại nhiều lần không bị nhân đôi (có kiểm tra Mã NV đã có).
"""
import os, copy, datetime as dt, openpyxl
D = dt.datetime
HERE = os.path.dirname(os.path.abspath(__file__))
M = os.path.join(HERE, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_Edu')
HROW = 5
def cols(ws): return {ws.cell(HROW, c).value: c for c in range(1, ws.max_column + 1) if ws.cell(HROW, c).value}
def add(ws, vals, key='Mã NV'):
    C = cols(ws); last = ws.max_row
    if key and any(ws.cell(r, C[key]).value == vals.get(key) for r in range(HROW + 1, last + 1)): return False
    r = last + 1
    for c in range(1, ws.max_column + 1):
        src = ws.cell(last, c); dst = ws.cell(r, c)
        if src.has_style: dst._style = copy.copy(src._style)
    for k, v in vals.items():
        if k in C: ws.cell(r, C[k]).value = v
    return True
def addcol(ws, name):
    C = cols(ws)
    if name in C: return C[name]
    c = ws.max_column + 1; h = ws.cell(HROW, c - 1); ws.cell(HROW, c).value = name
    if h.has_style: ws.cell(HROW, c)._style = copy.copy(h._style)
    ws.column_dimensions[openpyxl.utils.get_column_letter(c)].width = 16
    return c
VAO = D(2026, 11, 2)
P = [dict(ma='DS010', ten='Lý Thu Hằng', gt='Nữ', ns=D(2004, 5, 19), cccd='001304000010', nc=D(2022, 6, 10), que='Hà Nội', dc='Số 21, ngõ 68 đường Cầu Giấy, phường Cầu Giấy, TP Hà Nội',
          sdt='0900000110', em='hang.lt@domsang-demo.vn', pb='Phòng Tuyển sinh', cv='Nhân viên', cd='Nhân viên tư vấn tuyển sinh (bán thời gian)', td='Cao đẳng', hn='Độc thân',
          nh='Techcombank', stk='999900001110', ld='Bán thời gian', nt='Lý Văn Tâm', qh='Bố', ntsdt='0900000210', mcc=10,
          hd=('01/2026/HĐLĐ-DS', 'HĐLĐ bán thời gian, xác định thời hạn 12 tháng', D(2027, 11, 1), 5500000)),
     dict(ma='DS011', ten='Trịnh Văn Long', gt='Nam', ns=D(1985, 9, 2), cccd='001085000011', nc=D(2021, 8, 20), que='Nam Định', dc='Số 6, ngõ 41 phố Thái Hà, phường Đống Đa, TP Hà Nội',
          sdt='0900000111', em='long.tv@domsang-demo.vn', pb='Bộ phận Giảng viên', cv='Nhân viên', cd='Giảng viên cộng tác (khóa kỹ năng mềm)', td='Thạc sĩ', hn='Đã kết hôn',
          nh='Vietcombank', stk='999900001221', ld='Cộng tác viên', nt='Đỗ Thị Hạnh', qh='Vợ', ntsdt='0900000211', mcc=11,
          hd=('01/2026/HĐCTV-DS', 'Hợp đồng cộng tác viên', D(2027, 5, 1), 6000000))]
# 1) Danh sách nhân viên
f = os.path.join(M, '01_Ho_so_nhan_su', 'Danh_sach_nhan_vien.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
addcol(ws, 'Loại lao động')
for p in P:
    add(ws, {'Mã NV': p['ma'], 'Họ và tên': p['ten'], 'Giới tính': p['gt'], 'Ngày sinh': p['ns'], 'Số CCCD/Mã số thuế': p['cccd'], 'Ngày cấp CCCD': p['nc'], 'Dân tộc': 'Kinh', 'Quê quán': p['que'],
             'Địa chỉ thường trú': p['dc'], 'Số điện thoại': p['sdt'], 'Email công ty': p['em'], 'Phòng ban': p['pb'], 'Chức vụ': p['cv'], 'Chức danh công việc': p['cd'], 'Tổ/Ca': None,
             'Ngày vào làm': VAO, 'Trình độ': p['td'], 'Tình trạng hôn nhân': p['hn'], 'Số người phụ thuộc': 0, 'Số sổ BHXH': None, 'Ngân hàng': p['nh'], 'Số tài khoản': p['stk'],
             'Trạng thái': 'Đang làm việc', 'Ngày nghỉ việc': None, 'Mã chấm công': p['mcc'], 'Số con từ 6 tuổi trở xuống': 0, 'Người thân liên hệ': p['nt'], 'Quan hệ với người thân': p['qh'],
             'SĐT người thân liên hệ': p['ntsdt'], 'Loại lao động': p['ld']})
wb.save(f)
# 2) Sổ hợp đồng + lịch sử lương
f = os.path.join(M, '02_Hop_dong', 'So_theo_doi_hop_dong.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
for p in P:
    so, loai, het, luong = p['hd']; n = ws.max_row - HROW + 1
    add(ws, {'STT': n, 'Số hợp đồng': so, 'Mã NV': p['ma'], 'Họ và tên': p['ten'], 'Phòng ban': p['pb'], 'Chức danh': p['cd'].split(' (')[0], 'Loại hợp đồng': loai, 'Ngày ký': D(2026, 10, 30),
             'Ngày hiệu lực': VAO, 'Ngày hết hạn': het, 'Mức lương theo HĐ': luong, 'Phụ cấp chức vụ': 0, 'Tình trạng': 'Đang hiệu lực'}, key='Số hợp đồng')
wb.save(f)
f = os.path.join(M, '02_Hop_dong', 'Lich_su_dieu_chinh_luong.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
C = cols(ws)
for p in P:
    if any(ws.cell(r, C['Mã NV']).value == p['ma'] for r in range(HROW + 1, ws.max_row + 1)): continue
    add(ws, {'STT': ws.max_row - HROW + 1, 'Ngày hiệu lực': VAO, 'Mã NV': p['ma'], 'Họ và tên': p['ten'], 'Phòng ban': p['pb'], 'Chức danh': p['cd'].split(' (')[0], 'Lương mới': p['hd'][3],
             'Phụ cấp chức vụ': 0, 'Lý do': 'Lương khởi điểm khi tiếp nhận' if p['ld'] != 'Cộng tác viên' else 'Thù lao theo hợp đồng cộng tác viên'}, key=None)
wb.save(f)
# 3) Hồ sơ giấy tờ (người mới: còn thiếu 1–2 loại để thấy nhắc hồ sơ)
f = os.path.join(M, '01_Ho_so_nhan_su', 'Ho_so_giay_to.xlsx'); wb = openpyxl.load_workbook(f); ws = wb['Giay_to']
add(ws, {'Mã NV': 'DS010', 'Họ và tên': 'Lý Thu Hằng', 'Sơ yếu lý lịch': '30/10/2026', 'CV': 'Không áp dụng', 'Bản sao CCCD': '30/10/2026', 'Bằng cấp, chứng chỉ': '30/10/2026', 'Giấy khám sức khỏe': None,
         'Ảnh 3x4': '30/10/2026', 'Đơn xin việc': '30/10/2026', 'Xác nhận thông tin cư trú': '30/10/2026', 'Cam kết bảo mật, nội quy': '02/11/2026', 'Ghi chú hồ sơ': 'Bán thời gian – hẹn nộp giấy khám sức khỏe'})
add(ws, {'Mã NV': 'DS011', 'Họ và tên': 'Trịnh Văn Long', 'Sơ yếu lý lịch': '30/10/2026', 'CV': '30/10/2026', 'Bản sao CCCD': '30/10/2026', 'Bằng cấp, chứng chỉ': '30/10/2026', 'Giấy khám sức khỏe': 'Không áp dụng',
         'Ảnh 3x4': 'Không áp dụng', 'Đơn xin việc': 'Không áp dụng', 'Xác nhận thông tin cư trú': 'Không áp dụng', 'Cam kết bảo mật, nội quy': '02/11/2026', 'Ghi chú hồ sơ': 'Cộng tác viên – chỉ cần giấy tờ phục vụ hợp đồng, thanh toán'})
wb.save(f)
# 4) Chấm công tháng 11 (02–06/11): bán thời gian chiều các ngày làm việc, CTV sáng thứ Hai, Tư, Sáu
f = os.path.join(M, '03_Cham_cong', 'Cham_cong_2026_11.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active; C = cols(ws)
have = {(ws.cell(r, C['Mã NV']).value, str(ws.cell(r, C['Ngày']).value)[:10]) for r in range(HROW + 1, ws.max_row + 1)}
THU = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật']
PT = {2: ('13:27', '17:34'), 3: ('13:31', '17:30'), 4: ('13:24', '17:41'), 5: ('13:29', '17:33'), 6: ('13:35', '17:31')}
CT = {2: ('07:56', '11:34'), 4: ('07:58', '11:40'), 6: ('08:03', '11:31')}
for p, tab, note in ((P[0], PT, 'Bán thời gian – ca chiều'), (P[1], CT, 'Cộng tác viên – buổi dạy sáng')):
    for d, (a, b) in tab.items():
        dd = D(2026, 11, d)
        if (p['ma'], str(dd)[:10]) in have: continue
        add(ws, {'STT': ws.max_row - HROW + 1, 'Ngày': dd, 'Thứ': THU[dd.weekday()], 'Mã NV': p['ma'], 'Họ và tên': p['ten'], 'Phòng ban': p['pb'], 'Ca': None, 'Giờ vào': a, 'Giờ ra': b,
                 'Số giờ công': None, 'Ký hiệu': 'X', 'Ghi chú': note}, key=None)
wb.save(f)
# 5) Danh mục phòng ban: cập nhật số nhân sự hiện có
f = os.path.join(M, '01_Ho_so_nhan_su', 'Danh_muc_phong_ban.xlsx'); wb = openpyxl.load_workbook(f); ws = wb['Phong_ban']; C = cols(ws)
for r in range(HROW + 1, ws.max_row + 1):
    t = ws.cell(r, C['Tên phòng ban']).value
    if t in ('Phòng Tuyển sinh', 'Bộ phận Giảng viên') and 'Nhân sự hiện có' in C:
        v = ws.cell(r, C['Nhân sự hiện có']).value or 0; mark = ws.cell(r, C['Định biên'])
        # chỉ cộng 1 lần
        if not getattr(mark, 'comment', None):
            ws.cell(r, C['Nhân sự hiện có']).value = v + 1; mark.comment = openpyxl.comments.Comment('09/11/2026: +1 người (bán thời gian / cộng tác viên)', 'Quản trị tử tế')
wb.save(f)
print('Đã thêm DS010 (bán thời gian), DS011 (cộng tác viên) vào dữ liệu mẫu Đốm Sáng Edu')
